// Governors: a named advisor appointed to one city (city.data.gov). An empire has 1 governor slot, plus one for each
// era it has reached (see game/eras), and each kind of governor at most once. After RANK_TURNS turns in office a
// governor is promoted to rank 2 and their bonus grows. Moving a governor to another city starts the clock again.
//  - Steward:   the city grows +1 every 3 turns (every 2 at rank 2).
//  - Treasurer: +2★ a turn in the city (+3 at rank 2), and +1★ for each Market in its land.
//  - Marshal:   your units in the city's land defend +0.5 (+1 at rank 2); units trained there cost 1★ less; the city
//               never grows restless (see game/rebels).
//  - Scholar:   every tech costs 1★ less (2 at rank 2).
import { emit } from './events';
import { eraState } from './eras';
import { addPop, cityById, citiesOf, doAction, type Action } from './rules';
import type { City, GameState, Tile } from './types';

export type GovKind = 'steward' | 'treasurer' | 'marshal' | 'scholar';
export const GOV_KINDS: GovKind[] = ['steward', 'treasurer', 'marshal', 'scholar'];
export interface GovDef { name: string; icon: string; blurb: string; rank2: string }
export const GOVERNORS: Record<GovKind, GovDef> = {
  steward: { name: 'Steward', icon: 'farm', blurb: 'The city grows +1 every 3 turns.', rank2: 'every 2 turns' },
  treasurer: { name: 'Treasurer', icon: 'market', blurb: '+2★ a turn here, and +1★ for each Market in its land.', rank2: '+3★ a turn' },
  marshal: { name: 'Marshal', icon: 'flag', blurb: 'Your units in its land defend +0.5; units trained here cost 1★ less; the city never grows restless.', rank2: '+1 defence' },
  scholar: { name: 'Scholar', icon: 'temple', blurb: 'Every tech costs you 1★ less.', rank2: '2★ less' },
};
export const APPOINT_COST = 5;
export const RANK_TURNS = 8;

/** `pid`: the empire that appointed them. A governor serves only that empire: when the city changes hands they are gone. */
export interface GovState { k: GovKind; since: number; pid?: number }

export const govOf = (c: City | undefined | null): GovState | undefined => {
  const g = c?.data?.gov as GovState | undefined;
  return g && (g.pid === undefined || g.pid === c!.owner) ? g : undefined;
};
export const govRank = (s: GameState, g: GovState) => (s.turn - g.since >= RANK_TURNS ? 2 : 1);
/** Governor slots: one, plus one for each era reached. */
export const govSlots = (s: GameState, pid: number) => 1 + eraState(s, pid).n;
export const govsOf = (s: GameState, pid: number) => citiesOf(s, pid).filter((c) => govOf(c)).map((c) => ({ c, g: govOf(c)! }));
const holding = (s: GameState, pid: number, k: GovKind) => govsOf(s, pid).find((x) => x.g.k === k);

/** The rank of `pid`'s governor of this kind, or 0. */
export function govLevel(s: GameState, pid: number, k: GovKind): number {
  const h = holding(s, pid, k);
  return h ? govRank(s, h.g) : 0;
}

// ---------------------------------------------------------------- effects read by the rules

export function govCityIncome(s: GameState, c: City): number {
  const g = govOf(c);
  if (!g || g.k !== 'treasurer') return 0;
  return (govRank(s, g) === 2 ? 3 : 2) + s.tiles.filter((t) => t.owner === c.id && t.improvement === 'market').length;
}
export function govDefense(s: GameState, owner: number, t: Tile): number {
  const c = cityById(s, t.owner);
  const g = govOf(c);
  return g && g.k === 'marshal' && c!.owner === owner ? (govRank(s, g) === 2 ? 1 : 0.5) : 0;
}
export const govTechOff = (s: GameState, pid: number) => govLevel(s, pid, 'scholar');
export const govCalm = (c: City) => govOf(c)?.k === 'marshal';

/** Training costs 1★ less in a city with a Marshal. */
export function govDiscount(s: GameState, pid: number, t: Tile, acts: Action[]) {
  const c = cityById(s, t.cityId);
  if (!c || c.owner !== pid || govOf(c)?.k !== 'marshal') return;
  const stars = s.players[pid].stars;
  for (const a of acts) {
    if (!a.id.startsWith('train:') || a.cost <= 1) continue;
    a.cost -= 1;
    a.desc = `${a.desc} (Marshal: 1★ off)`;
    if (!a.enabled && a.reason === 'Not enough stars' && stars >= a.cost) { a.enabled = true; a.reason = undefined; }
  }
}

/** Start of turn: Stewards grow their cities; governors reaching rank 2 are announced. */
export function govTurnStart(s: GameState, pid: number) {
  for (const { c, g } of govsOf(s, pid)) {
    const served = s.turn - g.since;
    if (served === RANK_TURNS) emit({ type: 'toast', player: pid, text: `🎖 The ${GOVERNORS[g.k].name} of ${c.name} is promoted: ${GOVERNORS[g.k].rank2}.` });
    if (g.k === 'steward' && served > 0 && served % (govRank(s, g) === 2 ? 2 : 3) === 0) {
      addPop(s, c, 1);
      emit({ type: 'harvest', player: pid, x: c.x, y: c.y, pop: 1 });
    }
  }
}

// ---------------------------------------------------------------- appointing

/** Why `k` can't be appointed to city `c` now, or null. */
export function appointWhy(s: GameState, pid: number, c: City, k: GovKind, paid = false): string | null {
  const here = govOf(c);
  if (here?.k === k) return 'Already governs here';
  const moving = holding(s, pid, k);
  if (!moving && !here && govsOf(s, pid).length >= govSlots(s, pid)) return `All ${govSlots(s, pid)} governor slots are filled (one more each era)`;
  if (!paid && s.players[pid].stars < APPOINT_COST) return 'Not enough stars';
  return null;
}

/** Carried out through doAction, which has already charged APPOINT_COST. */
/** The city tile's governor actions: appoint (or move here) each kind. */
export function govActions(s: GameState, pid: number, t: Tile): Action[] {
  const c = cityById(s, t.cityId);
  if (!c || c.owner !== pid || t.cityId !== c.id || s.players[pid].neutral) return [];
  const here = govOf(c);
  return GOV_KINDS.map((k) => {
    const d = GOVERNORS[k];
    const why = appointWhy(s, pid, c, k);
    const moving = holding(s, pid, k);
    const label = here?.k === k ? `${d.name} (rank ${govRank(s, here)})` : moving ? `Move ${d.name} here` : `Appoint ${d.name}`;
    const note = here && here.k !== k ? ` Replaces the ${GOVERNORS[here.k].name}.` : moving && moving.c !== c ? ` Leaves ${moving.c.name}.` : '';
    return {
      id: `gov:${k}`, label, desc: `${d.blurb} Rank 2 after ${RANK_TURNS} turns in office: ${d.rank2}.${note}`,
      cost: APPOINT_COST, icon: d.icon, enabled: !why, reason: why ?? undefined,
    };
  });
}

export function govDoAction(s: GameState, pid: number, t: Tile, id: string): boolean {
  const c = cityById(s, t.cityId);
  const k = id.slice(4) as GovKind;
  if (!c || !GOV_KINDS.includes(k) || appointWhy(s, pid, c, k, true)) return false;
  const old = holding(s, pid, k);
  if (old) { const { gov: _g, ...rest } = old.c.data ?? {}; old.c.data = rest; }
  c.data = { ...(c.data ?? {}), gov: { k, since: s.turn, pid } satisfies GovState };
  emit({ type: 'toast', player: pid, text: `${GOVERNORS[k].name} appointed in ${c.name}. ${GOVERNORS[k].blurb}` });
  return true;
}

// ---------------------------------------------------------------- the AI

/** An AI fills an empty slot when it has Stars to spare: a Marshal where the enemy is near, else by need. */
export function govAi(s: GameState, pid: number, threatened: (c: City) => boolean): boolean {
  const p = s.players[pid];
  if (s.turn < 3 || p.stars < APPOINT_COST + 12 || govsOf(s, pid).length >= govSlots(s, pid)) return false;
  const free = citiesOf(s, pid).filter((c) => !govOf(c)).sort((a, b) => b.level - a.level);
  const taken = new Set(govsOf(s, pid).map((x) => x.g.k));
  for (const c of free) {
    const order: GovKind[] = threatened(c) ? ['marshal', 'treasurer', 'steward', 'scholar'] : c.capital ? ['treasurer', 'scholar', 'steward', 'marshal'] : ['steward', 'treasurer', 'scholar', 'marshal'];
    const k = order.find((x) => !taken.has(x));
    if (!k) return false;
    const t = s.tiles[c.y * s.size + c.x];
    if (!appointWhy(s, pid, c, k)) return doAction(s, pid, t, `gov:${k}`);
  }
  return false;
}

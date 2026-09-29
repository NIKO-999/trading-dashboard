// Greeks: Oracle & Polis Democracy + Amphictyony Alignment.
//
// (A) Polis Democracy. There is no permanent capital: the LARGEST Greek city (level, then population, then the incumbent)
//     is the seat, and it wears the capital flag (`city.capital`), so the +1 capital income and the capital mark move with
//     it. It is re-decided at the end/start of every Greek turn and when a city changes hands.
//     Each turn the Greek cities vote on one global Edict. Three of the five edicts are offered (`mech.offer`, rotating),
//     each city votes for the offered edict that suits it best (`votes()`); the human picks one for free from the city tile
//     menu ("mech:edict:<id>", also the Edict dock button), or repeals-and-replaces a running one for REPEAL_COST stars.
//     The AI enacts the edict with the most votes. An edict lasts EDICT_TURNS Greek turns and shifts the whole map for the Greeks:
//       pax        Pax Hellenica: foreign units standing inside Greek borders cannot hurt anyone (their attacks do 0 damage).
//                  Simplification of "no attacks by units in own borders": Greek units are exempt so the AI can still defend.
//       philosophy Philosophers' Age: +1 population in the seat and in the smallest city every turn. Simplification of
//                  "cheaper techs": tech prices are core rules, so the Age pays out in growth instead.
//       olympiad   Olympiad: +1 attack for every Greek unit.
//       trade      Trade League: +1 star per city, +2 more in the seat.
//       walls      Long Walls: +1 defence for Greek units inside Greek borders.
// (B) Amphictyony Alignment. Whenever two or more Greek cities have exactly the same level, every resource improvement
//     (farm/mine/lumber/port on a tile with a resource) in all of them yields +50% Stars, until the balance breaks.
//     Simplification: the game has no per-tile Star yield, so the base yield of such an improvement is taken as 1 star and the
//     bonus is 0.5 star each, summed over the empire and rounded down.
import { tileAt } from '../grid';
import { addPop, citiesOf, doAction, tileOwnerPlayer } from '../rules';
import type { Action } from '../rules';
import type { City, GameState, Tile } from '../types';
import type { Mechanic } from './types';

export type EdictId = 'pax' | 'philosophy' | 'olympiad' | 'trade' | 'walls';
export const EDICT_IDS: EdictId[] = ['pax', 'philosophy', 'olympiad', 'trade', 'walls'];
export const EDICTS: Record<EdictId, { name: string; desc: string }> = {
  pax: { name: 'Pax Hellenica', desc: 'Foreign units inside your borders cannot deal damage.' },
  philosophy: { name: "Philosophers' Age", desc: '+1 population each turn in the seat and in your smallest city.' },
  olympiad: { name: 'Olympiad', desc: '+1 attack for all your units.' },
  trade: { name: 'Trade League', desc: '+1 star per city, +2 more in the seat.' },
  walls: { name: 'Long Walls', desc: '+1 defence for your units inside your borders.' },
};
export const EDICT_TURNS = 4;
export const REPEAL_COST = 3;
export const EDICT_PREFIX = 'mech:edict:';
const RES_IMPS = ['farm', 'mine', 'lumber', 'port'];

interface GreekState { edict: EdictId | null; left: number; offer: EdictId[]; seat: number; enacted: number; aligned: number }

export function stateOf(s: GameState, owner: number): GreekState {
  const p = s.players[owner];
  p.mech ??= {};
  const m = p.mech as Record<string, unknown>;
  if (!Array.isArray(m.offer)) m.offer = [];
  if (typeof m.left !== 'number') m.left = 0;
  if (typeof m.seat !== 'number') m.seat = -1;
  if (typeof m.enacted !== 'number') m.enacted = 0;
  if (typeof m.aligned !== 'number') m.aligned = 0;
  if (typeof m.edict !== 'string') m.edict = null;
  return m as unknown as GreekState;
}

/** The running edict, or null. */
export function activeEdict(s: GameState, owner: number): EdictId | null {
  const st = stateOf(s, owner);
  return st.edict && st.left > 0 ? st.edict : null;
}
export const edictLeft = (s: GameState, owner: number) => (activeEdict(s, owner) ? stateOf(s, owner).left : 0);
export const offered = (s: GameState, owner: number): EdictId[] => stateOf(s, owner).offer.slice();
export const enactedCount = (s: GameState, owner: number) => stateOf(s, owner).enacted;

// ------------------------------------------------------------------ seat

/** The largest city: level, then population, then the current seat, then the oldest city. */
export function seatOf(s: GameState, owner: number): City | undefined {
  let best: City | undefined;
  const better = (a: City, b: City) => a.level !== b.level ? a.level > b.level : a.pop !== b.pop ? a.pop > b.pop : a.capital !== b.capital ? a.capital : a.id < b.id;
  for (const c of citiesOf(s, owner)) if (!best || better(c, best)) best = c;
  return best;
}

/** Moves the capital flag to the seat, so the core's capital income follows the largest city. */
export function syncSeat(s: GameState, owner: number) {
  const seat = seatOf(s, owner);
  for (const c of citiesOf(s, owner)) c.capital = c === seat;
  stateOf(s, owner).seat = seat ? seat.id : -1;
}

// ------------------------------------------------------------- Amphictyony

/** Greek cities that share their level with at least one other Greek city. */
export function alignedCities(s: GameState, owner: number): City[] {
  const cs = citiesOf(s, owner);
  return cs.filter((c) => cs.some((k) => k !== c && k.level === c.level));
}
const resourceImps = (s: GameState, c: City) => s.tiles.filter((t) => t.owner === c.id && t.resource !== null && !!t.improvement && RES_IMPS.includes(t.improvement)).length;
export function alignmentIncome(s: GameState, owner: number): number {
  let n = 0;
  for (const c of alignedCities(s, owner)) n += resourceImps(s, c);
  return Math.floor(n / 2);
}

// ------------------------------------------------------------------ edicts

export function edictIncome(s: GameState, owner: number): number {
  return activeEdict(s, owner) === 'trade' ? citiesOf(s, owner).length + 2 : 0;
}

/** Each city's favourite among the offered edicts, tallied. */
export function votes(s: GameState, owner: number): Record<string, number> {
  const st = stateOf(s, owner);
  const tally: Record<string, number> = {};
  for (const e of st.offer) tally[e] = 0;
  if (!st.offer.length) return tally;
  for (const c of citiesOf(s, owner)) {
    const foes = (r: number) => s.units.filter((u) => u.owner !== owner && Math.abs(u.x - c.x) + Math.abs(u.y - c.y) <= r).length;
    const mine = s.tiles.filter((t) => t.owner === c.id);
    const count = (imp: string) => mine.filter((t) => t.improvement === imp).length;
    const score: Record<EdictId, number> = {
      pax: foes(3) * 2,
      walls: foes(4),
      trade: 1 + count('market') + count('port'),
      philosophy: 1 + count('temple') + (c.level <= 2 ? 1 : 0),
      olympiad: 1 + s.units.filter((u) => u.owner === owner && Math.abs(u.x - c.x) + Math.abs(u.y - c.y) <= 2).length,
    };
    const pick = st.offer.slice().sort((a, b) => score[b] - score[a])[0];
    tally[pick]++;
  }
  return tally;
}

function refreshOffer(s: GameState, owner: number) {
  const st = stateOf(s, owner);
  const start = (s.turn * 2 + Math.max(0, st.seat)) % EDICT_IDS.length;
  st.offer = [0, 1, 2].map((i) => EDICT_IDS[(start + i) % EDICT_IDS.length]);
}

export function seatTileOf(s: GameState, owner: number): Tile | undefined {
  const c = seatOf(s, owner);
  return c ? tileAt(s, c.x, c.y) : undefined;
}

const inOwnBorders = (s: GameState, owner: number, t: Tile | undefined) => !!t && tileOwnerPlayer(s, t) === owner;

export const mech: Mechanic = {
  name: 'Oracle & Polis Democracy',
  blurb: 'No permanent capital: the largest city is the seat and all cities vote a global Edict every few turns; equal-sized cities form an Amphictyony that pays +50% Stars on resource improvements.',

  setup(s, owner) { syncSeat(s, owner); refreshOffer(s, owner); },

  turnStart(s, owner) {
    syncSeat(s, owner);
    const st = stateOf(s, owner);
    if (activeEdict(s, owner) === 'philosophy') {
      const seat = seatOf(s, owner);
      const small = citiesOf(s, owner).sort((a, b) => a.level - b.level || a.pop - b.pop || a.id - b.id)[0];
      for (const c of new Set([seat, small])) if (c) addPop(s, c, 1);
      syncSeat(s, owner);
    }
    if (st.left > 0) st.left--;
    if (st.left <= 0) st.edict = null;
    st.aligned = alignedCities(s, owner).length;
    refreshOffer(s, owner);
  },

  turnEnd(s, owner) { syncSeat(s, owner); },
  cityCaptured(s, owner, c, from) { if (c.owner === owner || from === owner) syncSeat(s, owner); },

  income(s, owner) {
    syncSeat(s, owner);
    return edictIncome(s, owner) + alignmentIncome(s, owner);
  },

  stat(s, owner, u, stat) {
    if (u.owner !== owner) return 0;
    const e = activeEdict(s, owner);
    if (e === 'olympiad' && stat === 'atk') return 1;
    if (e === 'walls' && stat === 'def' && inOwnBorders(s, owner, tileAt(s, u.x, u.y))) return 1;
    return 0;
  },

  combat(s, owner, a, _d, ctx) {
    if (a.owner === owner || activeEdict(s, owner) !== 'pax') return;
    if (inOwnBorders(s, owner, tileAt(s, a.x, a.y))) { ctx.dmg = 0; ctx.ret = 0; }
  },

  actions(s, owner, t) {
    if (t.cityId === null || tileOwnerPlayer(s, t) !== owner) return [];
    const st = stateOf(s, owner);
    const cur = activeEdict(s, owner);
    const cost = cur ? REPEAL_COST : 0;
    const stars = s.players[owner].stars;
    const acts: Action[] = [];
    for (const id of st.offer) {
      const same = cur === id;
      acts.push({
        id: EDICT_PREFIX + id, label: `Edict: ${EDICTS[id].name}`, icon: 'temple',
        desc: `${EDICTS[id].desc} Lasts ${EDICT_TURNS} turns.${cur ? ` Replaces ${EDICTS[cur].name}.` : ''}`,
        cost, enabled: !same && stars >= cost,
        reason: same ? 'Already in force' : stars < cost ? 'Not enough stars' : undefined,
      });
    }
    return acts;
  },

  doAction(s, owner, _t, id) {
    if (!id.startsWith(EDICT_PREFIX)) return false;
    const e = id.slice(EDICT_PREFIX.length) as EdictId;
    const st = stateOf(s, owner);
    if (!st.offer.includes(e)) return false;
    st.edict = e;
    st.left = EDICT_TURNS;
    st.enacted++;
    return true;
  },

  // The AI enacts the edict its cities voted for whenever none is running.
  ai(s, owner) {
    if (activeEdict(s, owner)) return false;
    const st = stateOf(s, owner);
    const t = seatTileOf(s, owner);
    if (!t || !st.offer.length) return false;
    const tally = votes(s, owner);
    const pick = st.offer.slice().sort((a, b) => tally[b] - tally[a])[0];
    return doAction(s, owner, t, EDICT_PREFIX + pick);
  },
};

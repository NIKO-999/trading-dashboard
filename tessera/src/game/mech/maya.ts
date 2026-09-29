import { emit } from '../events';
import { area, isWater } from '../grid';
import { addPop, citiesOf, def, doAction, tileActions, unitAt } from '../rules';
import type { Action } from '../rules';
import { makeRng } from '../rng';
import type { City, GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// Maya: the Long Count Prophecies and the Katun Cycles.
//
// (A) Long Count. Every ERA_EVERY (13) turns an "Enochian Era" begins and rewrites a rule of the whole map for ERA_TURNS
//     (3) turns. Which one is drawn from the world seed and the epoch number (deterministic), unless the Maya paid
//     PROPHECY_COST stars at their capital (`mech:prophecy:<era>`) to choose the era of the NEXT epoch. Eras:
//       ebb      Great Ebb    - every free shallow-water tile becomes walkable land (restored afterwards; a land unit
//                                stranded on one keeps its ground until it walks off; building there is blocked).
//       hawk     Hawk Sight   - ranged units gain +1 range and see 1 tile further (moves reveal fog to radius 2).
//       storm    Great Storm  - ships lose 1 attack, every step at sea costs +1 move and boats cannot enter deep ocean.
//       golden   Golden Age   - the Maya earn +1 star per city each turn (only the owner's `income` hook exists, so
//                                this one favours the Maya rather than everyone).
//       eclipse  Long Night   - every unit gets +1 defence and -1 move (never below 1).
//     Simplification: eras switch on/off at the Maya player's own turn start (the calendar is the Maya's), so players
//     who move before the Maya in that round feel the change from the next round. The era is a pure function of
//     (seed, turn, chosen[]); state lives in s.mech.maya = { active, chosen } and tile.data.maya = { orig } (ebb tiles).
// (B) Katun Cycles. Resource improvements (farm, mine, lumber hut, port) pay +1★ each per turn. Every KATUN (5) turns
//     that income doubles for that one turn. An improvement bought on an off-peak turn only yields half; one bought
//     on a Katun turn yields fully and gives its city +1 population. Every GREAT (20) turns each Maya city gains +1
//     population free. Improvements are stamped at the end of the turn they were built (tile.data.maya.peak).
//     Unstamped (captured) improvements count as off-peak.

export const ERA_EVERY = 13;
export const ERA_TURNS = 3;
export const PROPHECY_COST = 6;
export const KATUN = 5;
export const GREAT = 20;
const RES_IMPS = ['farm', 'mine', 'lumber', 'port'];

export type EraId = 'ebb' | 'hawk' | 'storm' | 'golden' | 'eclipse';
export const ERAS: { id: EraId; name: string; blurb: string; color: string }[] = [
  { id: 'ebb', name: 'Great Ebb', blurb: 'Shallow water turns to walkable land.', color: '#d9b26a' },
  { id: 'hawk', name: 'Hawk Sight', blurb: 'Ranged units gain +1 range and vision.', color: '#7fc9c0' },
  { id: 'storm', name: 'Great Storm', blurb: 'Ships: -1 attack, +1 move per step at sea, no deep ocean for boats.', color: '#6d7fae' },
  { id: 'golden', name: 'Golden Age', blurb: 'The Maya earn +1 star per city each turn.', color: '#f0c13a' },
  { id: 'eclipse', name: 'Long Night', blurb: 'Every unit gains +1 defence and -1 move.', color: '#5a4a7a' },
];
export const eraName = (id: EraId) => ERAS.find((e) => e.id === id)!.name;
const isEra = (x: unknown): x is EraId => ERAS.some((e) => e.id === x);

interface MayaWorld { active: { id: EraId; k: number } | null; chosen: Record<string, EraId> }
const world = (s: GameState): MayaWorld => {
  const m = (s.mech ??= {});
  return (m.maya ??= { active: null, chosen: {} }) as unknown as MayaWorld;
};
const mayaPid = (s: GameState) => s.players.findIndex((p) => p.tribe === 'maya');

// ---------------------------------------------------------------- calendar

export const epochOf = (turn: number) => Math.floor(turn / ERA_EVERY);
/** The era of epoch k (k >= 1): the Maya's paid choice, else drawn from the world seed. */
export function eraFor(s: GameState, k: number): EraId {
  const c = world(s).chosen[String(k)];
  if (isEra(c)) return c;
  return makeRng((s.seed ^ Math.imul(k, 0x9e3779b1)) >>> 0).pick(ERAS).id;
}
/** The era that should be in force this turn, from the calendar alone. */
export function wantedEra(s: GameState): { id: EraId; k: number; left: number } | null {
  const k = epochOf(s.turn);
  if (k < 1) return null;
  const into = s.turn - k * ERA_EVERY;
  return into < ERA_TURNS ? { id: eraFor(s, k), k, left: ERA_TURNS - into } : null;
}
export const activeEra = (s: GameState): EraId | null => world(s).active?.id ?? null;
/** Epoch of the next era to begin (the one a prophecy would choose). */
export const nextEpoch = (s: GameState) => epochOf(s.turn) + 1;
export const turnsToEra = (s: GameState) => nextEpoch(s) * ERA_EVERY - s.turn;
export const prophecyFor = (s: GameState, k: number): EraId | null => { const c = world(s).chosen[String(k)]; return isEra(c) ? c : null; };

export const isKatun = (turn: number) => turn % KATUN === 0;
export const turnsToKatun = (s: GameState) => (KATUN - (s.turn % KATUN)) % KATUN;
export const turnsToGreat = (s: GameState) => GREAT - (s.turn % GREAT);

// ---------------------------------------------------------------- era effects

export const tempOrig = (t: Tile) => (t.data?.maya as { orig?: string } | undefined)?.orig;
const setMaya = (t: Tile, v: Record<string, unknown> | null) => {
  const { maya: _m, ...rest } = t.data ?? {};
  t.data = v ? { ...rest, maya: v } : rest;
};

function dryUp(s: GameState) {
  for (const t of s.tiles) {
    if (t.terrain !== 'shallow' || t.improvement || t.cityId !== null || unitAt(s, t.x, t.y)) continue;
    setMaya(t, { ...(t.data?.maya as object | undefined), orig: 'shallow' });
    t.terrain = 'field';
  }
}
/** Bring the tide back to every dried tile nobody stands on. */
function refill(s: GameState) {
  for (const t of s.tiles) {
    if (tempOrig(t) !== 'shallow' || unitAt(s, t.x, t.y)) continue;
    t.terrain = 'shallow';
    t.road = false;
    setMaya(t, null);
  }
}

/** Make `s.mech.maya.active` match the calendar; idempotent, runs at the Maya's turn start (and when income is paid). */
export function syncEra(s: GameState) {
  const w = world(s);
  const want = wantedEra(s);
  if (w.active && (!want || want.id !== w.active.id || want.k !== w.active.k)) w.active = null;
  if (!w.active && want) {
    w.active = { id: want.id, k: want.k };
    if (want.id === 'ebb') dryUp(s);
    const me = mayaPid(s);
    if (me >= 0) emit({ type: 'toast', player: me, text: `A new Era begins: ${eraName(want.id)}! ${ERAS.find((e) => e.id === want.id)!.blurb}` });
  }
  if (activeEra(s) !== 'ebb') refill(s); // the water returns (retried each turn for stranded units)
}

const rangedBase = (u: Unit) => !def(u).naval && def(u).range > 1;

/** Hawk Sight: reveal one more ring of fog around a ranged unit. */
function hawkEyes(s: GameState, u: Unit) {
  const p = s.players[u.owner];
  for (const t of area(s, u.x, u.y, 2)) p.explored[t.y * s.size + t.x] = true;
}

// ---------------------------------------------------------------- economy

export interface KatunIncome { base: number; peak: boolean; total: number; cheap: number }
/** Star income of the Maya's resource improvements this turn (doubled on a Katun turn, halved for off-peak builds). */
export function katunIncome(s: GameState, owner: number, turn = s.turn): KatunIncome {
  let halves = 0, cheap = 0;
  const ids = new Set(citiesOf(s, owner).map((c) => c.id));
  for (const t of s.tiles) {
    if (t.owner === null || !ids.has(t.owner) || !t.improvement || !RES_IMPS.includes(t.improvement)) continue;
    const peak = (t.data?.maya as { peak?: boolean } | undefined)?.peak === true;
    halves += peak ? 2 : 1;
    if (!peak) cheap++;
  }
  const base = Math.floor(halves / 2);
  const peak = turn > 0 && isKatun(turn);
  return { base, peak, total: peak ? base * 2 : base, cheap };
}

const goldenBonus = (s: GameState, owner: number) => (wantedEra(s)?.id === 'golden' ? citiesOf(s, owner).length : 0);

/** Stamp improvements built during the turn that just ended; a Katun-turn build also grows its city. */
function stampBuilds(s: GameState, owner: number) {
  const p = s.players[owner];
  for (const c of citiesOf(s, owner)) {
    for (const t of s.tiles) {
      if (t.owner !== c.id || !t.improvement || !RES_IMPS.includes(t.improvement)) continue;
      const cur = t.data?.maya as { peak?: boolean } | undefined;
      if (cur && typeof cur.peak === 'boolean') continue;
      const peak = isKatun(s.turn);
      setMaya(t, { ...cur, peak });
      if (peak) {
        addPop(s, c, 1);
        emit({ type: 'harvest', player: owner, x: t.x, y: t.y, pop: 1 });
        p.mech = { ...(p.mech ?? {}), peakBuilds: ((p.mech?.peakBuilds as number) ?? 0) + 1 };
      }
    }
  }
}

// ---------------------------------------------------------------- prophecy

const seat = (s: GameState, owner: number): City | undefined => citiesOf(s, owner).find((c) => c.capital) ?? citiesOf(s, owner)[0];

function prophecyActions(s: GameState, owner: number, t: Tile): Action[] {
  const c = seat(s, owner);
  if (!c || t.cityId !== c.id) return [];
  const k = nextEpoch(s);
  const chosen = prophecyFor(s, k);
  const poor = s.players[owner].stars < PROPHECY_COST;
  const n = turnsToEra(s);
  return ERAS.map((e): Action => ({
    id: `mech:prophecy:${e.id}`,
    label: `Prophesy: ${e.name}`,
    desc: `Choose the Era that opens in ${n} turn${n === 1 ? '' : 's'}: ${e.blurb} (Otherwise the stars decide.)`,
    cost: PROPHECY_COST,
    enabled: !chosen && !poor,
    reason: chosen ? `The next Era is already written: ${eraName(chosen)}` : poor ? 'Not enough stars' : undefined,
    icon: 'temple',
  }));
}

function prophesy(s: GameState, owner: number, id: string): boolean {
  const era = id.slice('mech:prophecy:'.length);
  if (!isEra(era)) return false;
  const k = nextEpoch(s);
  if (prophecyFor(s, k)) return false;
  world(s).chosen[String(k)] = era;
  const p = s.players[owner];
  p.mech = { ...(p.mech ?? {}), prophecies: ((p.mech?.prophecies as number) ?? 0) + 1 };
  emit({ type: 'toast', player: owner, text: `Prophecy sealed: the ${eraName(era)} will open in ${turnsToEra(s)} turns.` });
  return true;
}

// ---------------------------------------------------------------- the mechanic

const BUILD_IDS = ['road', 'harvest', 'farm', 'mine', 'lumber', 'clear', 'irrigate', 'drain', 'port', 'shrine', 'temple', 'market'];

export const mech: Mechanic = {
  name: 'Long Count Prophecies & Katun Cycles',
  blurb: 'Every 13 turns an Era rewrites the map (dry seas, storms, a golden age...) and you may pay to choose it; every 5 turns your improvements pay double, and every 20 your cities grow free.',

  setup(s, owner) {
    world(s);
    const p = s.players[owner];
    p.mech = { ...(p.mech ?? {}), prophecies: 0, peakBuilds: 0, popTurn: -1 };
  },

  turnStart(s, owner) {
    syncEra(s);
    const p = s.players[owner];
    if (s.turn > 0 && s.turn % GREAT === 0) { // the Great Cycle turns
      if (p.mech?.popTurn !== s.turn) {
        p.mech = { ...(p.mech ?? {}), popTurn: s.turn };
        for (const c of citiesOf(s, owner)) {
          addPop(s, c, 1);
          emit({ type: 'harvest', player: owner, x: c.x, y: c.y, pop: 1 });
        }
        emit({ type: 'toast', player: owner, text: 'The Great Cycle turns: every city grows by 1 population.' });
      }
    } else if (s.turn > 0 && isKatun(s.turn)) {
      emit({ type: 'toast', player: owner, text: 'Katun peak: resource improvements pay double this turn, and builds today yield fully.' });
    }
    if (activeEra(s) === 'hawk') for (const u of s.units) if (rangedBase(u)) hawkEyes(s, u);
  },

  turnEnd(s, owner) { stampBuilds(s, owner); },

  income(s, owner) {
    syncEra(s);
    return katunIncome(s, owner).total + goldenBonus(s, owner);
  },

  moveStep(s, _owner, u, _from, to, ctx) {
    if (activeEra(s) !== 'storm' || !def(u).naval) return;
    if (isWater(to)) ctx.cost += 1;
    if (to.terrain === 'ocean' && u.kind === 'boat') ctx.forbid = true;
  },

  stat(s, _owner, u, stat) {
    switch (activeEra(s)) {
      case 'hawk': return stat === 'range' && rangedBase(u) ? 1 : 0;
      case 'storm': return stat === 'atk' && def(u).naval ? -1 : 0;
      case 'eclipse': return stat === 'def' ? 1 : stat === 'move' ? -1 : 0;
      default: return 0;
    }
  },

  afterMove(s, _owner, u) {
    if (activeEra(s) === 'hawk' && rangedBase(u)) hawkEyes(s, u);
  },

  actions(s, owner, t) { return prophecyActions(s, owner, t); },

  doAction(s, owner, t, id) {
    if (!id.startsWith('mech:prophecy:')) return false;
    const c = seat(s, owner);
    if (!c || t.cityId !== c.id) return false;
    return prophesy(s, owner, id);
  },

  // Dried seabed is only borrowed ground: nothing may be built on it (called for every empire's actions).
  block(_s, _owner, _pid, actionId, t) {
    if (tempOrig(t) && BUILD_IDS.includes(actionId)) return 'The seabed returns with the tide';
    return undefined;
  },

  ai(s, owner) {
    const p = s.players[owner];
    if (prophecyFor(s, nextEpoch(s)) || turnsToEra(s) > 4 || p.stars < PROPHECY_COST) return false;
    const c = seat(s, owner);
    if (!c) return false;
    const t = s.tiles[c.y * s.size + c.x];
    const ranged = s.units.filter((u) => u.owner === owner && rangedBase(u)).length;
    const id = `mech:prophecy:${ranged >= 2 ? 'hawk' : 'golden'}`;
    if (!tileActions(s, owner, t).find((a) => a.id === id)?.enabled) return false;
    return doAction(s, owner, t, id);
  },
};

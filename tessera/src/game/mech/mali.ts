import { emit } from '../events';
import { dist, tileAt } from '../grid';
import { spawnUnit } from '../mapgen';
import { citiesOf, def, doAction as coreDoAction, inflationOf, isExplored, moveOptions, moveUnit, tileOwnerPlayer, unitCap, unitAt } from '../rules';
import type { Action } from '../rules';
import type { GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// Salt & Gold Inflation (Mali)
//  (A) Core: `mech:flood-market` on a foreign city floods its markets with Malian gold. That empire suffers
//      hyper-inflation: for INFLATION_TURNS of its own turns everything it trains costs double (core `trainCost` reads
//      `inflationOf`; "maintenance" is simplified to this cost doubling because the game has no upkeep), and for its
//      first PAUSE_TURNS turns it cannot train at all (`block` hook). State: s.mech.inflation[pid] = {until, pauseUntil}
//      (absolute game turns, inclusive), so it expires by itself even if Mali dies.
//  (B) Economy: Caravan Tolls. `mech:caravan` (5 stars, in a free Malian city) raises a Caravan (a tagged rider that
//      never fights). Each tile it travels across foreign borders (2) or neutral land (1), +1 when an enemy soldier is
//      within 2 tiles of the tile (danger), adds to unit.data.toll during the turn. `income` pays the tolls at the start
//      of the next turn and `turnStart` resets them; consecutive paying turns add a streak bonus. Paths are
//      reconstructed as a straight line from -> to (afterMove has no path), an accepted simplification.

export const FLOOD_COST = 8;
export const CARAVAN_COST = 3;
export const PAUSE_TURNS = 2;
export const INFLATION_TURNS = 4;
export const TOLL_CAP = 5; // stars per caravan per turn
export const MAX_CARAVANS = 3;

interface MaliState { floods: number; tolls: number; caravans: number }
export const state = (s: GameState): MaliState => {
  s.mech ??= {};
  return (s.mech.mali ??= { floods: 0, tolls: 0, caravans: 0 }) as unknown as MaliState;
};

export const isCaravan = (u: Unit) => u.data?.caravan === true;
const caravansOf = (s: GameState, owner: number) => s.units.filter((u) => u.owner === owner && isCaravan(u));
const tollOf = (u: Unit) => (typeof u.data?.toll === 'number' ? (u.data.toll as number) : 0);
const streakOf = (u: Unit) => (typeof u.data?.streak === 'number' ? (u.data.streak as number) : 0);

/** Stars a caravan will pay at the start of the next turn. */
export const payout = (u: Unit) => {
  const toll = tollOf(u);
  return toll > 0 ? Math.min(TOLL_CAP, toll + Math.min(2, Math.floor(streakOf(u) / 2))) : 0;
};

/** Toll points earned by standing on tile (x, y). */
function tileToll(s: GameState, owner: number, x: number, y: number): number {
  const t = tileAt(s, x, y);
  if (!t || t.terrain === 'shallow' || t.terrain === 'ocean') return 0;
  const o = tileOwnerPlayer(s, t);
  if (o === owner) return 0;
  let n = o === null ? 1 : 2;
  if (s.units.some((e) => e.owner !== owner && def(e).atk > 0 && !isCaravan(e) && dist(e.x, e.y, x, y) <= 2)) n += 1;
  return n;
}

/** The tiles crossed between two points (straight line, excluding the start). */
function line(from: { x: number; y: number }, to: { x: number; y: number }) {
  const n = Math.max(1, dist(from.x, from.y, to.x, to.y));
  const out: { x: number; y: number }[] = [];
  for (let i = 1; i <= n; i++) out.push({ x: Math.round(from.x + ((to.x - from.x) * i) / n), y: Math.round(from.y + ((to.y - from.y) * i) / n) });
  return out;
}

const floodable = (s: GameState, owner: number, t: Tile) => {
  if (t.cityId === null) return null;
  const c = s.cities.find((k) => k.id === t.cityId);
  if (!c || c.owner === owner || !s.players[c.owner]?.alive) return null;
  return c;
};

function flood(s: GameState, owner: number, victim: number) {
  s.mech ??= {};
  const map = (s.mech.inflation ??= {}) as Record<string, { until: number; pauseUntil: number }>;
  // the victim's own turns: T and T+1 if it plays after Mali this round, T+1 and T+2 if before
  const pauseUntil = s.turn + (victim > owner ? PAUSE_TURNS - 1 : PAUSE_TURNS);
  map[victim] = { pauseUntil, until: pauseUntil + INFLATION_TURNS - PAUSE_TURNS };
  state(s).floods++;
  emit({ type: 'toast', player: victim, text: 'Malian gold floods your markets: hyper-inflation! Production halts and costs double.' });
}

export const isPaused = (s: GameState, pid: number) => {
  const i = inflationOf(s, pid);
  return !!i && s.turn <= i.pauseUntil;
};

function freeCity(s: GameState, owner: number) {
  return citiesOf(s, owner).find((c) => c.units < unitCap(c) && !unitAt(s, c.x, c.y));
}

export const mech: Mechanic = {
  name: 'Salt & Gold Inflation',
  blurb: "Flood a foreign city's markets with gold: its costs double and its production halts for 2 turns. Caravans earn Stars from every tile crossed through foreign or neutral lands, more when it is dangerous.",

  turnStart(s, owner) {
    const st = state(s);
    for (const u of caravansOf(s, owner)) {
      const p = payout(u);
      st.tolls += p;
      u.data = { ...u.data, toll: 0, streak: p > 0 ? streakOf(u) + 1 : 0 };
    }
    st.caravans = caravansOf(s, owner).length;
  },

  income(s, owner) {
    return caravansOf(s, owner).reduce((n, u) => n + payout(u), 0) + 2 * citiesOf(s, owner).length;
  },

  afterMove(s, owner, u, from, to) {
    if (u.owner !== owner || !isCaravan(u)) return;
    let n = 0;
    for (const p of line(from, to)) n += tileToll(s, owner, p.x, p.y);
    if (n > 0) u.data = { ...u.data, toll: tollOf(u) + n };
  },

  attackTargets(_s, _owner, u, targets) {
    return isCaravan(u) ? [] : targets; // merchants do not fight
  },

  block(s, owner, pid, actionId) {
    if (pid === owner) return undefined;
    if ((actionId.startsWith('train:') || actionId.startsWith('mech:caravan')) && isPaused(s, pid)) return 'Hyper-inflation halts production';
    return undefined;
  },

  actions(s, owner, t): Action[] {
    const acts: Action[] = [];
    const p = s.players[owner];
    const fc = floodable(s, owner, t);
    if (fc && isExplored(s, owner, t.x, t.y)) {
      const vic = s.players[fc.owner];
      const on = inflationOf(s, fc.owner);
      acts.push({
        id: 'mech:flood-market', label: 'Flood Market',
        desc: `Flood ${fc.name}'s markets with gold: ${vic.tribe} costs double for ${INFLATION_TURNS} turns and its production halts for ${PAUSE_TURNS}.`,
        cost: FLOOD_COST, icon: 'market',
        enabled: p.stars >= FLOOD_COST && !on,
        reason: on ? 'Already suffering inflation' : p.stars < FLOOD_COST ? 'Not enough stars' : undefined,
      });
    }
    const c = t.cityId !== null ? s.cities.find((k) => k.id === t.cityId) : undefined;
    if (c && c.owner === owner) {
      const n = caravansOf(s, owner).length;
      const why = unitAt(s, t.x, t.y) ? 'City tile is occupied' : c.units >= unitCap(c) ? `City supports ${unitCap(c)} units` : n >= MAX_CARAVANS ? `At most ${MAX_CARAVANS} caravans` : p.stars < CARAVAN_COST ? 'Not enough stars' : undefined;
      acts.push({
        id: 'mech:caravan', label: 'Caravan',
        desc: `A trading caravan (${n}/${MAX_CARAVANS}). Earns Stars from each tile it travels across foreign (2) or neutral (1) land, +1 in danger, paid next turn. Cannot fight.`,
        cost: CARAVAN_COST, icon: 'rider', enabled: !why, reason: why,
      });
    }
    return acts;
  },

  doAction(s, owner, t, id) {
    if (id === 'mech:flood-market') {
      const c = floodable(s, owner, t);
      if (!c) return false;
      flood(s, owner, c.owner);
      return true;
    }
    if (id === 'mech:caravan') {
      if (t.cityId === null) return false;
      const u = spawnUnit(s, 'rider', owner, t.x, t.y, t.cityId);
      u.data = { caravan: true, toll: 0, streak: 0 };
      return true;
    }
    return false;
  },

  ai(s, owner) {
    const p = s.players[owner];
    // 1. flood the richest rival whose city we have seen
    if (s.turn >= 3 && p.stars >= FLOOD_COST + 3) {
      let best: { t: Tile; score: number } | null = null;
      for (const c of s.cities) {
        if (c.owner === owner || !s.players[c.owner].alive || inflationOf(s, c.owner)) continue;
        const t = tileAt(s, c.x, c.y)!;
        if (!isExplored(s, owner, c.x, c.y)) continue;
        const score = s.players[c.owner].stars + s.units.filter((u) => u.owner === c.owner).length * 2 + c.level;
        if (!best || score > best.score) best = { t, score };
      }
      if (best && coreDoAction(s, owner, best.t, 'mech:flood-market')) return true;
    }
    // 2. keep a couple of caravans on the road
    if (caravansOf(s, owner).length < 3 && p.stars >= CARAVAN_COST) {
      const c = freeCity(s, owner);
      if (c && coreDoAction(s, owner, tileAt(s, c.x, c.y)!, 'mech:caravan')) return true;
    }
    // 3. send each caravan to the most lucrative reachable tile (else toward the nearest foreign city)
    for (const u of caravansOf(s, owner)) {
      if (u.moved) continue;
      const opts = moveOptions(s, u);
      if (!opts.length) { u.moved = true; continue; }
      const foreign = s.cities.filter((c) => c.owner !== owner);
      let best = opts[0], bestScore = -Infinity;
      for (const o of opts) {
        let toll = 0;
        for (const q of line(u, o)) toll += tileToll(s, owner, q.x, q.y);
        const pull = foreign.length ? -Math.min(...foreign.map((c) => dist(c.x, c.y, o.x, o.y))) * 0.1 : 0;
        const sc = toll + pull;
        if (sc > bestScore) { best = o; bestScore = sc; }
      }
      if (moveUnit(s, u, best.x, best.y)) return true;
      u.moved = true;
    }
    return false;
  },
};

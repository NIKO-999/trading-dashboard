// Aztec: Blood Altar Ascension + Flowery Captives.
//
// (A) Core. When an Aztec land unit would kill an enemy land unit, the enemy is taken alive (`spare` hook): it is removed
//     from the map and becomes a CAPTIVE dragged along by the killer (`unit.data.captives`, at most CARRY_MAX; a loaded
//     unit is slowed by 1 move; if it dies the captives escape). A carrier that ends a move (or starts a turn) inside
//     one of its own cities hands the captives over to the empire's pool (`player.mech.captives`). Cities may raise an
//     ALTAR (`mech:altar`, improvement 'altar' on the city tile). At an altar `mech:sacrifice` spends SUN_COST captives
//     to open a Sun Age lasting SUN_TURNS Aztec turns: every Aztec city grows +1 pop at once ("instant tile growth"
//     simplified to city pop), the whole map is revealed to the Aztecs (restored when the age ends, except around
//     their own units and cities) and every Aztec unit fights with +1 attack (frenzy).
// (B) Economy. Aztec units earn NO experience (kills never count toward veteran status; the core's increment is undone
//     in afterAttack) but each defeat pays a Star bounty (KILL_BOUNTY for a kill, CAPTURE_BOUNTY for a captive). In
//     any own city `mech:offer` sacrifices one captive for +1 Population immediately ("Flowery Captives").
//     The "Sun Age" is global only in the sense of the whole map being lit; it affects Aztecs.
// Simplifications: no rivers/hills exist, so nothing terrain-based is needed; tile growth is expressed as city pop.
import { emit } from '../events';
import { area, dist } from '../grid';
import { addPop, citiesOf, cityById, def, maxHp, moveOptions, moveUnit } from '../rules';
import type { Action } from '../rules';
import type { City, GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

export const ALTAR_COST = 5;
export const SUN_COST = 3; // captives per Sun Age
export const SUN_TURNS = 4; // the turn it is opened plus three more
export const CARRY_MAX = 2;
export const KILL_BOUNTY = 2;
export const CAPTURE_BOUNTY = 1;
export const FRENZY_ATK = 1;

interface AztecState {
  captives: number; // pooled, delivered to a city
  sun: number; // Sun Age turns left (0 = none)
  revealed: number[]; // tile indices lit by the Sun Age that were unexplored before
  captured: number; // lifetime counters (also used by the tests)
  bounty: number;
  offered: number;
  sacrificed: number;
}

/** The empire's state, created on first use (also for saves made before this mechanic). */
export function st(s: GameState, owner: number): AztecState {
  const p = s.players[owner];
  const m = (p.mech ??= {}) as Record<string, unknown>;
  for (const k of ['captives', 'sun', 'captured', 'bounty', 'offered', 'sacrificed']) if (typeof m[k] !== 'number') m[k] = 0;
  if (!Array.isArray(m.revealed)) m.revealed = [];
  return m as unknown as AztecState;
}

export const carried = (u: Unit) => (typeof u.data?.captives === 'number' ? (u.data.captives as number) : 0);
export const sunTurns = (s: GameState, owner: number) => st(s, owner).sun;
export const hasAltar = (t: Tile) => t.improvement === 'altar';
const cityTile = (s: GameState, c: City) => s.tiles[c.y * s.size + c.x];
export const altarCities = (s: GameState, owner: number) => s.cities.filter((c) => c.owner === owner && hasAltar(cityTile(s, c)));
const setCarried = (u: Unit, n: number) => {
  const { captives: _c, ...rest } = u.data ?? {};
  u.data = n > 0 ? { ...rest, captives: n } : rest;
};

/** Carriers standing in one of their own cities hand their captives to the pool. */
export function deliver(s: GameState, owner: number) {
  const m = st(s, owner);
  for (const u of s.units) {
    if (u.owner !== owner || !carried(u)) continue;
    const c = cityById(s, s.tiles[u.y * s.size + u.x].cityId);
    if (!c || c.owner !== owner) continue;
    m.captives += carried(u);
    setCarried(u, 0);
  }
}

function reveal(s: GameState, owner: number) {
  const p = s.players[owner], m = st(s, owner);
  for (let i = 0; i < p.explored.length; i++) if (!p.explored[i]) { p.explored[i] = true; m.revealed.push(i); }
}

function endSun(s: GameState, owner: number) {
  const p = s.players[owner], m = st(s, owner);
  const keep = new Set<number>(); // stay revealed around our own people
  const hold = (x: number, y: number, r: number) => { for (const t of area(s, x, y, r)) keep.add(t.y * s.size + t.x); };
  for (const c of s.cities) if (c.owner === owner) hold(c.x, c.y, c.borderRadius + 1);
  for (const u of s.units) if (u.owner === owner) hold(u.x, u.y, 1);
  for (const i of m.revealed) if (!keep.has(i)) p.explored[i] = false;
  m.revealed = [];
}

// ------------------------------------------------------------------ checks

const ownCityAt = (s: GameState, owner: number, t: Tile) => {
  const c = cityById(s, t.cityId);
  return c && c.owner === owner && c.x === t.x && c.y === t.y ? c : undefined;
};

export function altarCheck(s: GameState, owner: number, t: Tile): string | null {
  if (!ownCityAt(s, owner, t)) return 'Needs one of your cities';
  if (hasAltar(t)) return 'This city already has an altar';
  if (t.improvement) return 'The tile is already built on';
  if (s.players[owner].stars < ALTAR_COST) return 'Not enough stars';
  return null;
}
export function sacrificeCheck(s: GameState, owner: number, t: Tile): string | null {
  if (!ownCityAt(s, owner, t) || !hasAltar(t)) return 'Needs an altar';
  const m = st(s, owner);
  if (m.sun > 0) return `A Sun Age already burns (${m.sun} turns)`;
  if (m.captives < SUN_COST) return `Needs ${SUN_COST} captives (${m.captives} delivered)`;
  return null;
}
export function offerCheck(s: GameState, owner: number, t: Tile): string | null {
  if (!ownCityAt(s, owner, t)) return 'Needs one of your cities';
  if (st(s, owner).captives < 1) return 'No captives delivered (walk a captive-laden warrior into a city)';
  return null;
}

function openSunAge(s: GameState, owner: number) {
  const m = st(s, owner);
  m.captives -= SUN_COST;
  m.sacrificed++;
  m.sun = SUN_TURNS;
  for (const c of s.cities) {
    if (c.owner !== owner) continue;
    emit({ type: 'harvest', player: owner, x: c.x, y: c.y, pop: 1 });
    addPop(s, c, 1);
  }
  reveal(s, owner);
  s.log.push({ turn: s.turn, text: 'A Sun Age dawns: the altars run red, the cities swell and the Aztec warriors are seized by frenzy.' });
  return true;
}

function offerAt(s: GameState, owner: number, c: City) {
  const m = st(s, owner);
  m.captives--;
  m.offered++;
  emit({ type: 'harvest', player: owner, x: c.x, y: c.y, pop: 1 });
  addPop(s, c, 1);
  return true;
}

// ------------------------------------------------------------------ the mechanic

export const mech: Mechanic = {
  income(s, owner) { return 2 * citiesOf(s, owner).length; }, // tribute of the Triple Alliance
  name: 'Blood Altar Ascension',
  blurb: 'Warriors take beaten foes captive and drag them to city altars for a Sun Age (instant growth, full map vision, frenzy); they earn no XP, only Star bounties, and a captive offered in any city gives +1 Population.',

  setup(s, owner) { st(s, owner); },

  turnStart(s, owner) {
    deliver(s, owner);
    const m = st(s, owner);
    if (m.sun > 0) {
      m.sun--;
      if (m.sun <= 0) endSun(s, owner);
      else reveal(s, owner);
    }
  },
  turnEnd(s, owner) { deliver(s, owner); },

  stat(s, owner, u, stat) {
    if (u.owner !== owner) return 0;
    if (stat === 'atk' && st(s, owner).sun > 0) return FRENZY_ATK;
    if (stat === 'move' && carried(u) > 0) return -1; // dragging captives slows the march
    return 0;
  },

  // A would-be kill by an Aztec land unit takes the defender alive if there is a free rope.
  spare(s, owner, a, d) {
    if (a.owner !== owner || d.owner === owner || def(a).naval || def(d).naval || d.carrying) return false;
    if (a.carrying || carried(a) >= CARRY_MAX) return false;
    s.units = s.units.filter((x) => x !== d);
    const home = cityById(s, d.homeCity);
    if (home) home.units = Math.max(0, home.units - 1);
    emit({ type: 'death', unitId: d.id, x: d.x, y: d.y, owner: d.owner, kind: d.kind });
    setCarried(a, carried(a) + 1);
    const m = st(s, owner);
    m.captured++;
    m.bounty += CAPTURE_BOUNTY;
    s.players[owner].stars += CAPTURE_BOUNTY;
    emit({ type: 'stars', player: owner, x: d.x, y: d.y, amount: CAPTURE_BOUNTY });
    deliver(s, owner); // attacked from inside a city
    return true;
  },

  unitDied(s, owner, u, killer) {
    if (u.owner === owner && carried(u)) setCarried(u, 0); // the captives slip their ropes
    if (!killer || killer.owner !== owner || u.owner === owner) return;
    // stash the experience the core is about to award, so afterAttack can take it back
    killer.data = { ...killer.data, vx: [killer.veteranKills, killer.veteran ? 1 : 0, killer.hp] };
    const m = st(s, owner);
    m.bounty += KILL_BOUNTY;
    s.players[owner].stars += KILL_BOUNTY;
    emit({ type: 'stars', player: owner, x: u.x, y: u.y, amount: KILL_BOUNTY });
  },

  afterAttack(s, owner, a, _d, info) {
    if (a.owner !== owner) return;
    const vx = a.data?.vx as [number, number, number] | undefined;
    if (vx) {
      if (info.killed) { // no experience for Aztec warriors: only the bounty
        a.veteranKills = vx[0];
        if (!vx[1] && a.veteran) { a.veteran = false; a.hp = Math.min(vx[2], maxHp(a)); }
      }
      const { vx: _v, ...rest } = a.data!;
      a.data = rest;
    }
    deliver(s, owner);
  },

  afterMove(s, owner, u) { if (u.owner === owner) deliver(s, owner); },

  actions(s, owner, t): Action[] {
    if (!ownCityAt(s, owner, t)) return [];
    deliver(s, owner);
    const acts: Action[] = [];
    if (!hasAltar(t)) {
      const why = altarCheck(s, owner, t);
      acts.push({ id: 'mech:altar', label: 'Build Altar', cost: ALTAR_COST, icon: 'temple', enabled: !why, reason: why ?? undefined,
        desc: `Raise a blood altar in this city. Spend ${SUN_COST} captives at an altar to open a Sun Age.` });
    } else {
      const why = sacrificeCheck(s, owner, t);
      acts.push({ id: 'mech:sacrifice', label: 'Sun Age Sacrifice', cost: 0, icon: 'temple', enabled: !why, reason: why ?? undefined,
        desc: `Spend ${SUN_COST} captives: for ${SUN_TURNS} turns all Aztec cities gain +1 pop now, the whole map is revealed and Aztec units get +${FRENZY_ATK} attack.` });
    }
    const why = offerCheck(s, owner, t);
    acts.push({ id: 'mech:offer', label: 'Offer Captive', cost: 0, icon: 'fruit', enabled: !why, reason: why ?? undefined,
      desc: 'Sacrifice one captive at the city centre: +1 Population at once.' });
    return acts;
  },

  doAction(s, owner, t, id) {
    if (id === 'mech:altar') {
      // the core has already charged the cost, so check everything except the star balance
      if (!ownCityAt(s, owner, t) || t.improvement) return false;
      t.improvement = 'altar';
      return true;
    }
    if (id === 'mech:sacrifice') return !sacrificeCheck(s, owner, t) && openSunAge(s, owner);
    if (id === 'mech:offer') return !offerCheck(s, owner, t) && offerAt(s, owner, ownCityAt(s, owner, t)!);
    return false;
  },

  ai(s, owner) {
    const p = s.players[owner], m = st(s, owner);
    deliver(s, owner);
    const mine = s.cities.filter((c) => c.owner === owner);
    if (!mine.length) return false;
    const altars = altarCities(s, owner);
    // Sun Age as soon as an altar has its captives
    if (m.sun <= 0 && m.captives >= SUN_COST && altars.length) return openSunAge(s, owner);
    // an altar (capital first) once the treasury allows
    if (!altars.length && p.stars >= ALTAR_COST + 3) {
      const c = mine.find((e) => e.capital) ?? mine[0];
      const t = cityTile(s, c);
      if (!t.improvement) { p.stars -= ALTAR_COST; t.improvement = 'altar'; return true; }
    }
    // no altar to feed (or the age burns already): captives become population
    if (m.captives > 0 && (!altars.length || m.sun > 0 || m.captives > SUN_COST)) {
      const c = [...mine].sort((a, b) => a.level - b.level || a.id - b.id)[0];
      return offerAt(s, owner, c);
    }
    // haul captives home
    for (const u of s.units) {
      if (u.owner !== owner || !carried(u) || u.moved) continue;
      const near = (x: number, y: number) => Math.min(...mine.map((c) => dist(c.x, c.y, x, y)));
      let best: { x: number; y: number } | null = null, bd = near(u.x, u.y);
      for (const o of moveOptions(s, u)) { const d = near(o.x, o.y); if (d < bd) { bd = d; best = o; } }
      if (best && moveUnit(s, u, best.x, best.y)) return true;
    }
    return false;
  },
};

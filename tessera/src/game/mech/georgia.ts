import { emit } from '../events';
import { hostile } from '../diplomacy';
import { neighbors, tileAt } from '../grid';
import { addPop, citiesOf, maxHp, tileOwnerPlayer } from '../rules';
import type { Action } from '../rules';
import type { City, GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// Golden Age of Tamar (empire bonus) + Qvevri Cellars (signature).
//
// Golden Age of Tamar (`income`): while no enemy unit stands on a tile inside Georgia's borders, every Georgian city
// pays GOLDEN_STARS (+1★) a turn. An "enemy" is a unit of another empire that is hostile to Georgia under diplomacy
// (`hostile`: always, when diplomacy is off). Units of the neutral owner (Great Beasts, Raider Clans, Free City guards;
// see game/wild) do NOT count: a bear in the vineyards is a nuisance, not an invasion, and the AI can't make peace with
// beasts. Allies and peace partners passing through don't break it either.
//
// Qvevri Cellars (improvement `qvevri`, tile action `mech:qvevri`): great clay jars buried in the ground to age wine.
// Built on an empty field tile inside Georgia's borders (no improvement, resource, village, ruin or city) that is not
// next to another qvevri. Costs QVEVRI_BASE★ + QVEVRI_STEP★ for each one Georgia already holds. `tile.data.qvevri` is
// the turn it was buried. Each pays (the `income` hook) by the wine's age: +1★ while young, +2★ from 5 turns, +3★ from
// 10 turns (aged wine). A qvevri in land Georgia has lost pays nobody (only Georgia knows the wine).
//
// Supra (`mech:supra`, at the capital, SUPRA_COST★, once every SUPRA_COOLDOWN turns; `player.mech.supra` = the turn of the
// last feast): every Georgian unit heals SUPRA_HEAL HP, and every Georgian city with a qvevri in its borders gains
// SUPRA_POP population.

export const GOLDEN_STARS = 1;
export const QVEVRI_BASE = 4;
export const QVEVRI_STEP = 1;
/** Stars a qvevri pays a turn by age: [from turns, stars], oldest first. */
export const QVEVRI_AGES: readonly (readonly [number, number])[] = [[10, 3], [5, 2], [0, 1]];
export const SUPRA_COST = 3;
export const SUPRA_COOLDOWN = 6;
export const SUPRA_HEAL = 3;
export const SUPRA_POP = 1;
/** Stars the computer keeps back after burying a qvevri. */
export const AI_RESERVE = 3;

interface GeorgiaState { supra?: number; feasts?: number; buried?: number }

const isGeorgia = (s: GameState, pid: number) => s.players[pid]?.tribe === 'georgia';
const state = (s: GameState, owner: number): GeorgiaState => (s.players[owner].mech ??= {}) as GeorgiaState;
const peek = (s: GameState, owner: number): GeorgiaState => (s.players[owner].mech ?? {}) as GeorgiaState;
const cityOn = (s: GameState, t: Tile): City | undefined => (t.cityId === null ? undefined : s.cities.find((c) => c.id === t.cityId));

// ---------------------------------------------------------------- Golden Age of Tamar

/** Is `u` an enemy of Georgia player `owner`: another empire's unit, hostile, and not the neutral owner's? */
export const isEnemy = (s: GameState, owner: number, u: Unit) =>
  u.owner !== owner && !s.players[u.owner]?.neutral && hostile(s, owner, u.owner);

/** Enemy units standing inside `owner`'s borders. */
export function intruders(s: GameState, owner: number): Unit[] {
  return s.units.filter((u) => {
    if (!isEnemy(s, owner, u)) return false;
    const t = tileAt(s, u.x, u.y);
    return !!t && tileOwnerPlayer(s, t) === owner;
  });
}

/** Is the Golden Age on: no enemy inside the borders? */
export const goldenAge = (s: GameState, owner: number) => isGeorgia(s, owner) && intruders(s, owner).length === 0;

export const goldenIncome = (s: GameState, owner: number) => (goldenAge(s, owner) ? GOLDEN_STARS * citiesOf(s, owner).length : 0);

// ---------------------------------------------------------------- Qvevri

/** Every qvevri inside `owner`'s borders. */
export const qvevris = (s: GameState, owner: number): Tile[] =>
  s.tiles.filter((t) => t.improvement === 'qvevri' && tileOwnerPlayer(s, t) === owner);

/** Turns since this qvevri was buried. */
export const qvevriAge = (s: GameState, t: Tile) => Math.max(0, s.turn - Number(t.data?.qvevri ?? s.turn));

/** Stars this qvevri pays a turn, by its age. */
export function qvevriStars(s: GameState, t: Tile): number {
  const age = qvevriAge(s, t);
  for (const [from, stars] of QVEVRI_AGES) if (age >= from) return stars;
  return 1;
}

/** Turns until this qvevri's wine pays more (null when fully aged). */
export function nextAge(s: GameState, t: Tile): number | null {
  const age = qvevriAge(s, t);
  const next = [...QVEVRI_AGES].reverse().find(([from]) => from > age);
  return next ? next[0] - age : null;
}

export const qvevriIncome = (s: GameState, owner: number) =>
  isGeorgia(s, owner) ? qvevris(s, owner).reduce((n, t) => n + qvevriStars(s, t), 0) : 0;

/** What the next qvevri costs. */
export const qvevriCost = (s: GameState, owner: number) => QVEVRI_BASE + QVEVRI_STEP * qvevris(s, owner).length;

/** Is this an empty field a qvevri could be buried in (ownership aside)? */
const bareField = (t: Tile) => t.terrain === 'field' && !t.improvement && !t.resource && !t.village && !t.ruin && t.cityId === null;

/** Why a qvevri can't be buried on `t` (stars aside), or null. */
export function qvevriWhy(s: GameState, owner: number, t: Tile): string | null {
  if (!isGeorgia(s, owner)) return 'Only Georgia buries qvevri';
  if (tileOwnerPlayer(s, t) !== owner) return 'Only inside your borders';
  if (!bareField(t)) return 'Needs an empty field';
  if (neighbors(s, t.x, t.y).some((n) => n.improvement === 'qvevri')) return 'Too close to another qvevri';
  if (s.units.some((u) => u.x === t.x && u.y === t.y && u.owner !== owner)) return 'Someone else stands here';
  return null;
}

/** Bury a qvevri on `t` (stars are paid by the caller). */
export function buryQvevri(s: GameState, owner: number, t: Tile): boolean {
  if (qvevriWhy(s, owner, t)) return false;
  t.improvement = 'qvevri';
  t.data = { ...(t.data ?? {}), qvevri: s.turn };
  const st = state(s, owner);
  st.buried = (st.buried ?? 0) + 1;
  return true;
}

// ---------------------------------------------------------------- Supra

/** `owner`'s capital. */
export const capitalOf = (s: GameState, owner: number): City | undefined => citiesOf(s, owner).find((c) => c.capital);

/** Turns until the next supra may be held (0 when it may). */
export function supraCooldown(s: GameState, owner: number): number {
  const last = peek(s, owner).supra;
  return last === undefined ? 0 : Math.max(0, last + SUPRA_COOLDOWN - s.turn);
}

/** Georgian cities with at least one qvevri in their own borders. */
export const cellarCities = (s: GameState, owner: number): City[] =>
  citiesOf(s, owner).filter((c) => s.tiles.some((t) => t.owner === c.id && t.improvement === 'qvevri'));

/** Why a supra can't be held at `c` (stars aside), or null. */
export function supraWhy(s: GameState, owner: number, c: City | undefined): string | null {
  if (!isGeorgia(s, owner)) return 'Only Georgia holds a supra';
  if (!c || c.owner !== owner || !c.capital) return 'Only at your capital';
  const cd = supraCooldown(s, owner);
  if (cd > 0) return `The next supra is in ${cd} turn${cd === 1 ? '' : 's'}`;
  return null;
}

/** Hold the feast (stars are paid by the caller). */
export function supra(s: GameState, owner: number, c: City): boolean {
  if (supraWhy(s, owner, c)) return false;
  const st = state(s, owner);
  st.supra = s.turn;
  st.feasts = (st.feasts ?? 0) + 1;
  for (const u of s.units) {
    if (u.owner !== owner || u.hp >= maxHp(u)) continue;
    const before = u.hp;
    u.hp = Math.min(maxHp(u), u.hp + SUPRA_HEAL);
    emit({ type: 'heal', unitId: u.id, x: u.x, y: u.y, amount: u.hp - before });
  }
  const grown = cellarCities(s, owner);
  for (const g of grown) addPop(s, g, SUPRA_POP);
  emit({ type: 'toast', player: owner, text: `🍷 A supra at ${c.name}: the tamada raises the horn. Every unit heals ${SUPRA_HEAL} HP${grown.length ? ` and ${grown.length} cit${grown.length === 1 ? 'y' : 'ies'} with a qvevri grow +${SUPRA_POP}` : ''}.` });
  return true;
}

export const feasts = (s: GameState, owner: number) => peek(s, owner).feasts ?? 0;

/** Wounded HP the feast would restore (for the AI). */
const woundedHp = (s: GameState, owner: number) =>
  s.units.filter((u) => u.owner === owner).reduce((n, u) => n + Math.min(SUPRA_HEAL, Math.max(0, maxHp(u) - u.hp)), 0);

// ---------------------------------------------------------------- the mechanic

export const mech: Mechanic = {
  name: 'Qvevri Cellars',
  blurb: `Bury a qvevri of wine in an empty field in your borders (${QVEVRI_BASE}★, +${QVEVRI_STEP}★ for each you hold; not next to another): +1★ a turn, +2★ after 5 turns, +3★ after 10. Hold a supra at the capital (${SUPRA_COST}★, every ${SUPRA_COOLDOWN} turns): every unit heals ${SUPRA_HEAL} HP and each city with a qvevri grows +${SUPRA_POP}. Golden Age of Tamar: while no enemy stands in your borders, every city pays +${GOLDEN_STARS}★.`,

  income(s, owner) {
    return goldenIncome(s, owner) + qvevriIncome(s, owner);
  },

  actions(s, owner, t): Action[] {
    if (!isGeorgia(s, owner)) return [];
    const stars = s.players[owner].stars;
    const c = cityOn(s, t);
    if (c && c.owner === owner && c.capital) {
      const cost = SUPRA_COST;
      const why = supraWhy(s, owner, c) ?? (stars < cost ? 'Not enough stars' : null);
      return [{
        id: 'mech:supra', label: 'Hold a Supra', cost, icon: 'temple', enabled: !why, reason: why ?? undefined,
        desc: `A Georgian feast led by the tamada: every unit heals ${SUPRA_HEAL} HP, and each city with a qvevri in its borders grows +${SUPRA_POP}. Once every ${SUPRA_COOLDOWN} turns.`,
      }];
    }
    if (tileOwnerPlayer(s, t) !== owner || !bareField(t)) return [];
    const cost = qvevriCost(s, owner);
    const why = qvevriWhy(s, owner, t) ?? (stars < cost ? 'Not enough stars' : null);
    return [{
      id: 'mech:qvevri', label: 'Bury Qvevri', cost, icon: 'farm', enabled: !why, reason: why ?? undefined,
      desc: `Bury great clay jars of wine to age: +1★ a turn, +2★ after 5 turns and +3★ after 10 (aged wine). Each qvevri costs +${QVEVRI_STEP}★ more than the last; not next to another.`,
    }];
  },

  doAction(s, owner, t, id) {
    if (id === 'mech:qvevri') return buryQvevri(s, owner, t);
    if (id === 'mech:supra') { const c = cityOn(s, t); return !!c && supra(s, owner, c); }
    return false;
  },

  // Bury a qvevri when there are stars to spare (they pay for themselves within a few turns), on the field nearest a
  // city; hold a supra when the army is wounded or a cellar city would grow.
  ai(s, owner) {
    if (!isGeorgia(s, owner)) return false;
    const p = s.players[owner];
    const cap = capitalOf(s, owner);
    if (cap && !supraWhy(s, owner, cap) && p.stars >= SUPRA_COST + AI_RESERVE
      && (woundedHp(s, owner) >= 6 || cellarCities(s, owner).length >= 2)) {
      p.stars -= SUPRA_COST; // the core charges only for human-issued actions; the AI pays here
      return supra(s, owner, cap);
    }
    const cost = qvevriCost(s, owner);
    if (p.stars < cost + AI_RESERVE || qvevris(s, owner).length >= citiesOf(s, owner).length * 2) return false;
    let best: Tile | null = null, bd = Infinity;
    for (const t of s.tiles) {
      if (!bareField(t) || qvevriWhy(s, owner, t)) continue;
      const c = s.cities.find((k) => k.id === t.owner);
      const d = c ? Math.max(Math.abs(c.x - t.x), Math.abs(c.y - t.y)) : 9;
      if (d < bd) { bd = d; best = t; }
    }
    if (!best) return false;
    p.stars -= cost;
    return buryQvevri(s, owner, best);
  },
};

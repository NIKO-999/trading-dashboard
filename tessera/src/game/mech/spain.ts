import { cityOrigin } from '../culture';
import { emit } from '../events';
import { isLand, neighbors } from '../grid';
import { citiesOf, maxHp, tileOwnerPlayer } from '../rules';
import type { Action } from '../rules';
import type { City, GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// Treasure Fleets (empire bonus) + Conquest & Missions (core).
//
// Treasure Fleets: every Spanish ship and warship (unit kinds `ship` / `warship`, laden or not) pays FLEET_PAY★ a turn.
// A plain boat does not count.
//
// Plunder: when Spain takes a city from another empire (`cityCaptured`), it plunders PLUNDER_PER_LEVEL★ per city level.
//
// Missions (improvement `mission`, the `mech:mission` tile action, MISSION_COST★): founded on an empty land tile next to
// one of Spain's own cities and inside its borders, at most one per city (a city "has" a mission when one stands next to
// it). Each Mission pays MISSION_PAY★ a turn, MISSION_PAY_TAKEN★ instead when it stands next to a city Spain captured
// rather than founded (its people came from elsewhere: `cityOrigin` is not Spain). At the start of Spain's turn its
// wounded units on or next to a Mission heal MISSION_HEAL HP more.

export const FLEET_PAY = 1;
export const PLUNDER_PER_LEVEL = 3;
export const MISSION_COST = 6;
export const MISSION_PAY = 1;
export const MISSION_PAY_TAKEN = 2;
export const MISSION_HEAL = 2;
/** The AI keeps this many stars back after paying for a Mission. */
const AI_RESERVE = 4;

const isSpain = (s: GameState, pid: number) => s.players[pid]?.tribe === 'spain';

// ---------------------------------------------------------------- treasure fleets

/** `owner`'s galleons: ships and warships (a boat carrying a unit is a `boat`, and does not count). */
export const fleet = (s: GameState, owner: number): Unit[] =>
  s.units.filter((u) => u.owner === owner && (u.kind === 'ship' || u.kind === 'warship'));

export const fleetIncome = (s: GameState, owner: number) => (isSpain(s, owner) ? fleet(s, owner).length * FLEET_PAY : 0);

// ---------------------------------------------------------------- missions

/** Every Mission standing inside `owner`'s borders. */
export const missions = (s: GameState, owner: number): Tile[] =>
  s.tiles.filter((t) => t.improvement === 'mission' && tileOwnerPlayer(s, t) === owner);

/** Did Spain take this city from another people, rather than found it? */
export const isTaken = (s: GameState, c: City) => cityOrigin(s, c) !== s.players[c.owner].tribe;

/** `owner`'s cities next to tile `t`. */
const citiesBeside = (s: GameState, owner: number, t: Tile): City[] =>
  citiesOf(s, owner).filter((c) => Math.max(Math.abs(c.x - t.x), Math.abs(c.y - t.y)) === 1);

/** Does city `c` already have a Mission beside it? */
export const hasMission = (s: GameState, c: City) => neighbors(s, c.x, c.y).some((n) => n.improvement === 'mission');

/** The city a new Mission on `t` would serve: a mission-less city of `owner` next to it (the tile's own city first). */
export function missionCity(s: GameState, owner: number, t: Tile): City | undefined {
  const free = citiesBeside(s, owner, t).filter((c) => !hasMission(s, c));
  return free.find((c) => c.id === t.owner) ?? free[0];
}

/** Stars one Mission pays a turn: 2 beside a captured city of its owner, else 1. */
export function missionStars(s: GameState, t: Tile): number {
  const o = tileOwnerPlayer(s, t);
  if (o === null) return 0;
  return citiesBeside(s, o, t).some((c) => isTaken(s, c)) ? MISSION_PAY_TAKEN : MISSION_PAY;
}

export const missionIncome = (s: GameState, owner: number) => missions(s, owner).reduce((n, t) => n + missionStars(s, t), 0);

/** Is this a bare land tile a Mission could stand on? */
const bareLand = (t: Tile) =>
  isLand(t) && t.terrain !== 'mountain' && t.terrain !== 'ice' && t.terrain !== 'bridge' && t.terrain !== 'platform'
  && !t.improvement && t.cityId === null && !t.village && !t.ruin && !t.resource;

/** Why a Mission can't be founded here, or null if it can. */
export function missionWhy(s: GameState, owner: number, t: Tile): string | null {
  if (tileOwnerPlayer(s, t) !== owner) return 'Only inside your borders';
  if (!bareLand(t)) return 'Needs an empty land tile';
  if (!citiesBeside(s, owner, t).length) return 'Must be next to one of your cities';
  if (!missionCity(s, owner, t)) return 'One Mission per city';
  if (s.units.some((u) => u.x === t.x && u.y === t.y && u.owner !== owner)) return 'Enemy on the tile';
  return null;
}

/** Turn start: Spain's wounded on or beside a Mission heal MISSION_HEAL more. */
export function missionHeal(s: GameState, owner: number) {
  const ms = missions(s, owner);
  if (!ms.length) return;
  for (const u of s.units) {
    if (u.owner !== owner || u.hp >= maxHp(u)) continue;
    if (!ms.some((m) => Math.max(Math.abs(m.x - u.x), Math.abs(m.y - u.y)) <= 1)) continue;
    const before = u.hp;
    u.hp = Math.min(maxHp(u), u.hp + MISSION_HEAL);
    emit({ type: 'heal', unitId: u.id, x: u.x, y: u.y, amount: u.hp - before });
  }
}

/** Running totals for the HUD (plundered stars, missions founded). */
const bump = (s: GameState, owner: number, k: string, n: number) => {
  const p = s.players[owner];
  p.mech = { ...(p.mech ?? {}), [k]: Number(p.mech?.[k] ?? 0) + n };
};
export const plundered = (s: GameState, owner: number) => Number(s.players[owner].mech?.plunder ?? 0);

export const mech: Mechanic = {
  name: 'Conquest & Missions',
  blurb: 'Each ship and warship pays +1★ a turn. Taking a city plunders 3★ per level. Found a Mission beside each city (6★): +1★ a turn, +2★ beside a conquered city, and your wounded on or beside it heal 2 HP more.',

  income(s, owner) {
    if (!isSpain(s, owner)) return 0;
    return fleetIncome(s, owner) + missionIncome(s, owner);
  },

  turnStart(s, owner) {
    if (isSpain(s, owner)) missionHeal(s, owner);
  },

  cityCaptured(s, owner, c, from) {
    if (!isSpain(s, owner) || c.owner !== owner || from === owner) return;
    const loot = PLUNDER_PER_LEVEL * Math.max(1, c.level);
    s.players[owner].stars += loot;
    bump(s, owner, 'plunder', loot);
    emit({ type: 'stars', player: owner, x: c.x, y: c.y, amount: loot });
    emit({ type: 'toast', player: owner, text: `⚓ ${c.name} is plundered: +${loot}★ for the Crown.` });
  },

  actions(s, owner, t): Action[] {
    if (!isSpain(s, owner) || tileOwnerPlayer(s, t) !== owner || !bareLand(t)) return [];
    if (!citiesBeside(s, owner, t).length) return [];
    const why = missionWhy(s, owner, t);
    const poor = s.players[owner].stars < MISSION_COST;
    return [{
      id: 'mech:mission', label: 'Found Mission',
      desc: `A whitewashed mission beside the city: +${MISSION_PAY}★ a turn (+${MISSION_PAY_TAKEN}★ beside a conquered city), and your wounded on or beside it heal ${MISSION_HEAL} HP more. One per city.`,
      cost: MISSION_COST, icon: 'temple', enabled: !why && !poor, reason: why ?? (poor ? 'Not enough stars' : undefined),
    }];
  },

  doAction(s, owner, t, id) {
    if (id !== 'mech:mission' || !isSpain(s, owner) || missionWhy(s, owner, t)) return false;
    const c = missionCity(s, owner, t)!;
    t.improvement = 'mission';
    t.data = { ...(t.data ?? {}), missionCity: c.id };
    bump(s, owner, 'missions', 1);
    return true;
  },

  // Found a Mission when there are stars to spare: conquered cities first (they pay double), then the rest.
  ai(s, owner) {
    if (!isSpain(s, owner)) return false;
    const p = s.players[owner];
    if (p.stars < MISSION_COST + AI_RESERVE) return false;
    let best: Tile | null = null, bestScore = -Infinity;
    for (const c of citiesOf(s, owner)) {
      if (hasMission(s, c)) continue;
      for (const t of neighbors(s, c.x, c.y)) {
        if (missionWhy(s, owner, t)) continue;
        let score = isTaken(s, c) ? 10 : 0;
        score += c.capital ? 2 : 0;
        score += t.terrain === 'field' || t.terrain === 'desert' ? 1 : 0; // leave forest for lumber
        score += s.units.some((u) => u.owner === owner && u.hp < maxHp(u) && Math.max(Math.abs(u.x - t.x), Math.abs(u.y - t.y)) <= 1) ? 1 : 0;
        if (score > bestScore) { best = t; bestScore = score; }
      }
    }
    if (!best) return false;
    p.stars -= MISSION_COST; // the core charges only for human-issued actions; the AI pays here
    return mech.doAction!(s, owner, best, 'mech:mission');
  },
};


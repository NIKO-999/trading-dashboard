import { dist, neighbors } from '../grid';
import { attackRange, moveOptions, moveUnit, tileOwnerPlayer } from '../rules';
import type { Action } from '../rules';
import { hostile } from '../diplomacy';
import { unitMatches } from '../perks';
import type { GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// Pyramids of Meroë (core) + Land of the Bow (military).
//
// Core: Kush raises steep pyramids (improvement `pyramid`, the `mech:pyramid` tile action) on open desert or field
// inside its own borders: a tile with no improvement, city, village, ruin or resource, and not next to another pyramid.
// The first costs PYRAMID_BASE stars and each one Kush already holds adds PYRAMID_STEP. Every pyramid pays
// PYRAMID_STARS a turn (the `income` hook). They are the archers' high ground: a Nubian ranged unit (range > 1, not
// naval, not siege) standing on or next to a Nubian pyramid shoots PYRAMID_RANGE tile further (the `stat` hook).
//
// Military: Land of the Bow. Archers and other ranged units cost 1★ less to train. That is applied in rules
// `trainCost` beside the Mongols' mounted discount; it has no hook here.

export const PYRAMID_BASE = 6;
export const PYRAMID_STEP = 2;
export const PYRAMID_STARS = 1;
export const PYRAMID_RANGE = 1;
/** Most pyramids the computer builds: one per city and one more, up to this. */
export const AI_MAX = 5;

const isNubia = (s: GameState, pid: number) => s.players[pid]?.tribe === 'nubia';

/** Every pyramid standing in `owner`'s territory. */
export const pyramids = (s: GameState, owner: number): Tile[] =>
  s.tiles.filter((t) => t.improvement === 'pyramid' && tileOwnerPlayer(s, t) === owner);

/** What the next pyramid costs `owner`: 6★, +2★ for each one already held. */
export const pyramidCost = (s: GameState, owner: number) => PYRAMID_BASE + PYRAMID_STEP * pyramids(s, owner).length;

/** All `owner`'s pyramids pay this a turn. */
export const pyramidIncome = (s: GameState, owner: number) => PYRAMID_STARS * pyramids(s, owner).length;

/** Why a pyramid can't be raised here, or null if it can. */
export function pyramidWhy(s: GameState, owner: number, t: Tile): string | null {
  if (!isNubia(s, owner)) return 'Only Kush raises pyramids';
  if (tileOwnerPlayer(s, t) !== owner) return 'Only inside your borders';
  if (t.terrain !== 'desert' && t.terrain !== 'field') return 'Needs open desert or field';
  if (t.improvement || t.cityId !== null || t.village || t.ruin || t.resource) return 'Needs an empty tile';
  if (s.units.some((u) => u.x === t.x && u.y === t.y && u.owner !== owner)) return 'Enemy on the tile';
  if (neighbors(s, t.x, t.y).some((n) => n.improvement === 'pyramid')) return 'Too close to another pyramid';
  return null;
}

/** A unit that gains the pyramid's high ground: a ranged unit (not a boat, not siege) on its own feet. */
export const isBowman = (s: GameState, u: Unit) => !u.carrying && unitMatches(s.players[u.owner].tribe, u.kind, 'ranged');

/** Is (x, y) on or next to one of `owner`'s pyramids? */
export function byPyramid(s: GameState, owner: number, x: number, y: number): boolean {
  const here = s.tiles[y * s.size + x];
  if (!here) return false;
  return [here, ...neighbors(s, x, y)].some((n) => n.improvement === 'pyramid' && tileOwnerPlayer(s, n) === owner);
}

export const mech: Mechanic = {
  name: 'Pyramids of Meroë',
  blurb: 'Raise steep pyramids on desert or field: each pays +1★ a turn, and your archers on or beside one shoot 1 tile further. Land of the Bow: archers and other ranged units cost 1★ less.',

  income(s, owner) {
    return isNubia(s, owner) ? pyramidIncome(s, owner) : 0;
  },

  // the archers' high ground
  stat(s, owner, u, stat) {
    if (stat !== 'range' || u.owner !== owner || !isNubia(s, owner) || !isBowman(s, u)) return 0;
    return byPyramid(s, owner, u.x, u.y) ? PYRAMID_RANGE : 0;
  },

  actions(s, owner, t): Action[] {
    if (!isNubia(s, owner) || tileOwnerPlayer(s, t) !== owner) return [];
    if (t.terrain !== 'desert' && t.terrain !== 'field') return [];
    if (t.improvement || t.cityId !== null || t.village || t.resource) return [];
    const why = pyramidWhy(s, owner, t);
    const cost = pyramidCost(s, owner);
    const poor = s.players[owner].stars < cost;
    return [{
      id: 'mech:pyramid', label: 'Raise Pyramid',
      desc: `A steep royal pyramid of Meroë: +${PYRAMID_STARS}★ a turn, and your archers on it or beside it shoot ${PYRAMID_RANGE} tile further. Costs ${PYRAMID_STEP}★ more for each one you hold.`,
      cost, icon: 'temple', enabled: !why && !poor, reason: why ?? (poor ? 'Not enough stars' : undefined),
    }];
  },

  doAction(s, owner, t, id) {
    if (id !== 'mech:pyramid' || pyramidWhy(s, owner, t)) return false;
    t.improvement = 'pyramid';
    return true;
  },

  ai(s, owner) {
    if (!isNubia(s, owner)) return false;
    const p = s.players[owner];
    const mine = pyramids(s, owner);
    const foes = s.units.filter((e) => e.owner !== owner && hostile(s, owner, e.owner));
    // threatened: post an idle bowman on the high ground next to a pyramid that a foe is closing on
    if (mine.length && foes.length) {
      for (const u of s.units) {
        if (u.owner !== owner || u.moved || u.attacked || !isBowman(s, u) || byPyramid(s, owner, u.x, u.y)) continue;
        // a bowman that can already shoot something stays to shoot
        const reach = attackRange(s, u);
        if (foes.some((e) => dist(e.x, e.y, u.x, u.y) <= reach)) continue;
        const threatened = mine.filter((t) => foes.some((e) => dist(e.x, e.y, t.x, t.y) <= 4));
        if (!threatened.length) continue;
        let best: { x: number; y: number } | null = null, bv = -Infinity;
        for (const o of moveOptions(s, u)) {
          if (o.embark || !byPyramid(s, owner, o.x, o.y)) continue;
          const v = -Math.min(...threatened.map((t) => dist(t.x, t.y, o.x, o.y))) - 0.1 * Math.min(...foes.map((e) => Math.abs(dist(e.x, e.y, o.x, o.y) - 3)));
          if (v > bv) { bv = v; best = o; }
        }
        if (best && moveUnit(s, u, best.x, best.y)) return true;
      }
    }
    // build a few when there are stars to spare: desert first, near the cities' edges where archers stand guard
    const cities = s.cities.filter((c) => c.owner === owner);
    if (mine.length >= Math.min(AI_MAX, cities.length + 1)) return false;
    const cost = pyramidCost(s, owner);
    if (p.stars < cost + 4) return false;
    let best: Tile | null = null, bestScore = -Infinity;
    for (const t of s.tiles) {
      if (tileOwnerPlayer(s, t) !== owner || pyramidWhy(s, owner, t)) continue;
      const near = foes.length ? Math.min(...foes.map((e) => dist(e.x, e.y, t.x, t.y))) : 9;
      const score = (t.terrain === 'desert' ? 2 : 0) + Math.max(0, 6 - near) * 0.5 + (t.road ? 0.5 : 0) - (t.y * s.size + t.x) * 1e-6;
      if (score > bestScore) { best = t; bestScore = score; }
    }
    if (!best) return false;
    p.stars -= cost; // the core charges only for human-issued actions; the AI pays here
    return mech.doAction!(s, owner, best, 'mech:pyramid');
  },
};

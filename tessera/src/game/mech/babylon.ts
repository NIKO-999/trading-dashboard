import { area, isLand, neighbors } from '../grid';
import { citiesOf, tileOwnerPlayer } from '../rules';
import type { Action } from '../rules';
import type { City, GameState, Tile } from '../types';
import type { Mechanic } from './types';

// Ziggurats & Star-Gazers (core) + Clay Tablets (economy).
//
// Core: Babylon raises a Ziggurat (improvement `ziggurat`, the `mech:ziggurat` tile action) for ZIGGURAT_COST stars on
// an empty land tile of open ground (not forest, mountain, ice or a bridge) inside its own borders and next to the city
// whose land it is: a tile with no improvement, city, village, ruin or resource, and no foreign unit on it. Each city
// may hold one ziggurat (counted by the city whose territory the tile is).
//  - every ziggurat pays ZIGGURAT_STARS (+1★) a turn (the `income` hook);
//  - when one is raised, its astronomers chart the sky: every tile within REVEAL_RANGE (3) becomes explored for Babylon;
//  - every ziggurat Babylon holds makes each tech 1★ cheaper, at most TECH_OFF_MAX (−3), never below 1★. That is a
//    tribe check in rules `techCost` (zigguratTechOff below).
//
// Economy (Clay Tablets): a Eureka makes its tech TABLET_OFF (50%) cheaper for Babylon instead of the usual 40%. Also a
// tribe check in rules `techCost`; it has no hook here.

export const ZIGGURAT_COST = 7;
export const ZIGGURAT_STARS = 1;
export const REVEAL_RANGE = 3;
export const TECH_OFF_MAX = 2;
export const TABLET_OFF = 0.5;
/** Stars the computer keeps in hand after paying for a ziggurat. */
export const AI_RESERVE = 5;

const isBabylon = (s: GameState, pid: number) => s.players[pid]?.tribe === 'babylon';
const OPEN = new Set(['field', 'desert', 'swamp', 'tundra']);

/** Every ziggurat standing in `owner`'s territory. */
export const ziggurats = (s: GameState, owner: number): Tile[] =>
  s.tiles.filter((t) => t.improvement === 'ziggurat' && tileOwnerPlayer(s, t) === owner);

/** Does city `c` already have a ziggurat on its land? */
export const cityHasZiggurat = (s: GameState, c: City) => s.tiles.some((t) => t.improvement === 'ziggurat' && t.owner === c.id);

/** The stars every Babylonian tech is cheaper by: 1 per ziggurat, at most 3 (0 for other empires). */
export const zigguratTechOff = (s: GameState, pid: number) => (isBabylon(s, pid) ? Math.min(TECH_OFF_MAX, ziggurats(s, pid).length) : 0);

/** All `owner`'s ziggurats pay this a turn. */
export const zigguratIncome = (s: GameState, owner: number) => (isBabylon(s, owner) ? ZIGGURAT_STARS * ziggurats(s, owner).length : 0);

/** Why a ziggurat can't be raised here, or null if it can. */
export function zigguratWhy(s: GameState, owner: number, t: Tile): string | null {
  if (tileOwnerPlayer(s, t) !== owner) return 'Only inside your borders';
  if (!isLand(t) || !OPEN.has(t.terrain)) return 'Needs open land (not forest or mountain)';
  if (t.improvement || t.cityId !== null || t.village || t.ruin || t.resource) return 'Needs an empty tile';
  if (s.units.some((u) => u.x === t.x && u.y === t.y && u.owner !== owner)) return 'A foreign unit is on the tile';
  const c = s.cities.find((x) => x.id === t.owner);
  if (!c || Math.max(Math.abs(c.x - t.x), Math.abs(c.y - t.y)) !== 1) return 'Must stand next to the city';
  if (cityHasZiggurat(s, c)) return 'This city already has its ziggurat';
  return null;
}

/** The astronomers on a new ziggurat chart every tile within 3. */
export function stargaze(s: GameState, owner: number, t: Tile) {
  const p = s.players[owner];
  for (const n of area(s, t.x, t.y, REVEAL_RANGE)) p.explored[n.y * s.size + n.x] = true;
}

export const mech: Mechanic = {
  name: 'Ziggurats & Star-Gazers',
  blurb: 'Raise a ziggurat beside each city (7★): it pays +1★ a turn, its astronomers reveal every tile within 3, and each one makes every tech 1★ cheaper (up to 2★). Clay Tablets: a Eureka makes its tech 50% cheaper, not 40%.',

  income(s, owner) {
    return zigguratIncome(s, owner);
  },

  actions(s, owner, t): Action[] {
    if (!isBabylon(s, owner) || tileOwnerPlayer(s, t) !== owner) return [];
    if (!isLand(t) || t.improvement || t.cityId !== null || t.village || t.resource) return [];
    const c = s.cities.find((x) => x.id === t.owner);
    if (!c || Math.max(Math.abs(c.x - t.x), Math.abs(c.y - t.y)) !== 1) return [];
    const why = zigguratWhy(s, owner, t);
    const poor = s.players[owner].stars < ZIGGURAT_COST;
    return [{
      id: 'mech:ziggurat', label: 'Raise Ziggurat',
      desc: `A stepped temple-tower beside the city: +${ZIGGURAT_STARS}★ a turn, its star-gazers reveal every tile within ${REVEAL_RANGE}, and every tech costs 1★ less (up to ${TECH_OFF_MAX}★). One per city.`,
      cost: ZIGGURAT_COST, icon: 'temple', enabled: !why && !poor, reason: why ?? (poor ? 'Not enough stars' : undefined),
    }];
  },

  doAction(s, owner, t, id) {
    if (id !== 'mech:ziggurat' || !isBabylon(s, owner) || zigguratWhy(s, owner, t)) return false;
    t.improvement = 'ziggurat';
    stargaze(s, owner, t);
    return true;
  },

  // build one when it is affordable with a reserve left; prefer the spot that charts the most unknown land
  ai(s, owner) {
    if (!isBabylon(s, owner)) return false;
    const p = s.players[owner];
    if (p.stars < ZIGGURAT_COST + AI_RESERVE) return false;
    let best: Tile | null = null, bestScore = -1;
    for (const c of citiesOf(s, owner)) {
      if (cityHasZiggurat(s, c)) continue;
      for (const t of neighbors(s, c.x, c.y)) {
        if (zigguratWhy(s, owner, t)) continue;
        const unseen = area(s, t.x, t.y, REVEAL_RANGE).filter((n) => !p.explored[n.y * s.size + n.x]).length;
        const score = unseen * 2 + (t.terrain === 'desert' ? 1 : 0);
        if (score > bestScore) { best = t; bestScore = score; }
      }
    }
    if (!best) return false;
    p.stars -= ZIGGURAT_COST; // the core charges only for human-issued actions; the AI pays here
    return mech.doAction!(s, owner, best, 'mech:ziggurat');
  },
};

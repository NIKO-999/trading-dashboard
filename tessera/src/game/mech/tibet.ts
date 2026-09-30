import { dist, isLand } from '../grid';
import { addPop, cityById, tileOwnerPlayer } from '../rules';
import type { Action } from '../rules';
import type { City, GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// Highland Stupa & Mist (core) + Highland Solitude (economy).
//
// Core: mountains breathe out Sky Mist. A Tibetan city with a mountain within MIST_REACH tiles (or a stupa in its
// borders) is hidden from every enemy: it is not drawn or targeted by them (cityVisible hook; the renderer and the AI
// honour it) until an enemy unit stands on a peak (mountain tile) adjacent to the city and looks down through the
// cloud. Stupas (improvement `stupa`, built on any free land tile inside borders) extend the mist: they act as an
// artificial peak so even a city on the plains is veiled, and Tibetan units on a mountain or stupa tile are unseen
// by enemies who are not within 1 tile of them. Simplification: only the *display and AI targeting* of a city is
// hidden; units may still walk onto a city tile and capture it.
//
// Economy: resources on mountain tiles (ore) and in forest (the "forest-hill" analogue) inside Tibetan borders pay Stars
// every turn, growing with the distance to the nearest enemy unit or enemy-owned tile: isolation is maximum output.
// Mountain resource: floor(d/2) capped at 3; forest resource: floor(d/3) capped at 2; whole empire capped at SOLITUDE_CAP.
// Each stupa also gives +1 population when built (max STUPA_MAX per city).

export const MIST_REACH = 2;
export const STUPA_COST = 8;
export const STUPA_MAX = 1;
export const SOLITUDE_CAP = 3;
const FAR = 99;

const isPeak = (t: Tile) => t.terrain === 'mountain';

/** Stupa tiles standing inside the borders of city `c`. */
export const stupasOf = (s: GameState, c: City): Tile[] => s.tiles.filter((t) => t.improvement === 'stupa' && t.owner === c.id);

/** Does the mist cover this city (a peak nearby, or a stupa)? */
export function hasMist(s: GameState, c: City): boolean {
  if (s.tiles.some((t) => isPeak(t) && dist(t.x, t.y, c.x, c.y) <= MIST_REACH)) return true;
  return stupasOf(s, c).length > 0;
}

/** Has `viewer` climbed a peak next to the city (which parts the mist)? */
export function peakWatcher(s: GameState, c: City, viewer: number): boolean {
  return s.units.some((u) => u.owner === viewer && dist(u.x, u.y, c.x, c.y) <= 1 && s.tiles[u.y * s.size + u.x]?.terrain === 'mountain');
}

/** Is city `c` currently hidden from `viewer`? */
export const cityHiddenFrom = (s: GameState, c: City, viewer: number): boolean =>
  viewer >= 0 && viewer !== c.owner && hasMist(s, c) && !peakWatcher(s, c, viewer);

/** Distance from a tile to the nearest enemy unit or enemy-owned tile. */
function isolation(s: GameState, owner: number, t: Tile): number {
  let d = FAR;
  for (const u of s.units) if (u.owner !== owner) d = Math.min(d, dist(u.x, u.y, t.x, t.y));
  for (const o of s.tiles) {
    if (o.owner === null) continue;
    const p = tileOwnerPlayer(s, o);
    if (p !== null && p !== owner) d = Math.min(d, dist(o.x, o.y, t.x, t.y));
  }
  return d;
}

/** Stars one highland resource pays this turn. */
export function solitudeStars(s: GameState, owner: number, t: Tile): number {
  if (!t.resource || tileOwnerPlayer(s, t) !== owner) return 0;
  if (t.terrain !== 'mountain' && t.terrain !== 'forest') return 0;
  const d = isolation(s, owner, t);
  return t.terrain === 'mountain' ? Math.min(2, Math.floor(d / 2)) : Math.min(1, Math.floor(d / 3));
}

export function solitudeIncome(s: GameState, owner: number): number {
  let n = 0;
  for (const t of s.tiles) if (t.resource && (t.terrain === 'mountain' || t.terrain === 'forest')) n += solitudeStars(s, owner, t);
  return Math.min(SOLITUDE_CAP, n);
}

const canStupa = (s: GameState, owner: number, t: Tile): City | null => {
  if (tileOwnerPlayer(s, t) !== owner || !isLand(t) || t.improvement || t.resource || t.cityId !== null || t.village || t.ruin) return null;
  if (s.units.some((u) => u.x === t.x && u.y === t.y && u.owner !== owner)) return null;
  const c = cityById(s, t.owner);
  if (!c || stupasOf(s, c).length >= STUPA_MAX) return null;
  return c;
};

export const mech: Mechanic = {
  name: 'Highland Stupa & Mist',
  blurb: 'Sky Mist hides your cities until an enemy stands on an adjacent peak, and stupas extend it. Remote mountain and forest resources pay more Stars the farther they lie from any enemy.',

  cityVisible(s, owner, viewer, c) {
    if (c.owner !== owner) return undefined;
    return cityHiddenFrom(s, c, viewer) ? false : undefined;
  },

  // Tibetan units on a peak or a stupa vanish in the mist unless an enemy is right next to them.
  unitVisible(s, owner, viewer, u: Unit) {
    if (u.owner !== owner) return undefined;
    const t = s.tiles[u.y * s.size + u.x];
    if (!t || !(isPeak(t) || t.improvement === 'stupa')) return undefined;
    return s.units.some((e) => e.owner === viewer && dist(e.x, e.y, u.x, u.y) <= 1) ? undefined : false;
  },

  income(s, owner) {
    return solitudeIncome(s, owner);
  },

  actions(s, owner, t): Action[] {
    if (!canStupa(s, owner, t)) return [];
    const p = s.players[owner];
    return [{
      id: 'mech:stupa', label: 'Raise Stupa',
      desc: 'A whitewashed chorten spreads the Sky Mist: it veils the city even without peaks. +1 population.',
      cost: STUPA_COST, enabled: p.stars >= STUPA_COST, reason: p.stars >= STUPA_COST ? undefined : 'Not enough stars', icon: 'temple',
    }];
  },

  doAction(s, owner, t, id) {
    if (id !== 'mech:stupa') return false;
    const c = canStupa(s, owner, t);
    if (!c) return false;
    t.improvement = 'stupa';
    addPop(s, c, 1);
    return true;
  },

  ai(s, owner) {
    const p = s.players[owner];
    if (p.stars < STUPA_COST + 3) return false;
    for (const c of s.cities) {
      if (c.owner !== owner || hasMist(s, c)) continue; // only cities the mist does not already cover
      const spot = s.tiles.find((t) => t.owner === c.id && dist(t.x, t.y, c.x, c.y) <= 1 && canStupa(s, owner, t));
      if (!spot) continue;
      p.stars -= STUPA_COST; // the core charges only for human-issued actions; the AI pays here
      return mech.doAction!(s, owner, spot, 'mech:stupa');
    }
    return false;
  },
};

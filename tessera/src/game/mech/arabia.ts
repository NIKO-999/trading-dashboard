import { isLand, neighbors } from '../grid';
import { tileOwnerPlayer } from '../rules';
import type { Action } from '../rules';
import type { GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// Caravanserais & Desert Roads (core) + House of Wisdom (economy).
//
// Core: Arabia raises Caravanserais (improvement `caravanserai`, the `mech:caravanserai` tile action) on open desert or
// field inside its own borders: a tile with no improvement, city, village, ruin or resource, and not next to another
// caravanserai (anyone's). The first costs CARAVANSERAI_BASE stars and each one Arabia already holds adds
// CARAVANSERAI_STEP. Every caravanserai pays +1★ a turn, and +1★ more when trade passes by: a road on its tile or a
// neighbouring tile, or a trade route's trail running over either (the `income` hook).
// Across the sand Arabia's camel-borne units (Camel Riders, merchants and Camel Scouts) move as if on a road: a step
// onto desert from land costs DESERT_STEP move points (the `moveStep` hook).
//
// Economy: House of Wisdom. A tech that a met empire already knows costs WISDOM_OFF (40%) less for Arabia instead of
// the usual 20%. That is computed with the other discounts in rules `techCost`; it has no hook here.

export const CARAVANSERAI_BASE = 6;
export const CARAVANSERAI_STEP = 2;
export const DESERT_STEP = 0.5;
/** Most caravanserais the computer builds: one per city and one more, up to this. */
export const AI_MAX = 5;

const isArabia = (s: GameState, pid: number) => s.players[pid]?.tribe === 'arabia';
const key = (s: GameState, t: Tile) => t.y * s.size + t.x;

/** Every caravanserai standing in `owner`'s territory. */
export const caravanserais = (s: GameState, owner: number): Tile[] =>
  s.tiles.filter((t) => t.improvement === 'caravanserai' && tileOwnerPlayer(s, t) === owner);

/** What the next caravanserai costs `owner`: 6★, +2★ for each one already held. */
export const caravanseraiCost = (s: GameState, owner: number) => CARAVANSERAI_BASE + CARAVANSERAI_STEP * caravanserais(s, owner).length;

/** Why a caravanserai can't be raised here, or null if it can. */
export function caravanseraiWhy(s: GameState, owner: number, t: Tile): string | null {
  if (tileOwnerPlayer(s, t) !== owner) return 'Only inside your borders';
  if (t.terrain !== 'desert' && t.terrain !== 'field') return 'Needs open desert or field';
  if (t.improvement || t.cityId !== null || t.village || t.ruin || t.resource) return 'Needs an empty tile';
  if (s.units.some((u) => u.x === t.x && u.y === t.y && u.owner !== owner)) return 'Enemy on the tile';
  if (neighbors(s, t.x, t.y).some((n) => n.improvement === 'caravanserai')) return 'Too close to another caravanserai';
  return null;
}

/** Tile indices that a trade route's trail runs over. */
function routeTiles(s: GameState): Set<number> {
  const out = new Set<number>();
  for (const r of s.trade?.routes ?? []) for (const i of r.path) out.add(i);
  return out;
}

/** Does trade pass a caravanserai: a road or a route's trail on its tile or a neighbouring tile? */
export function onTradeWay(s: GameState, t: Tile, trails = routeTiles(s)): boolean {
  return [t, ...neighbors(s, t.x, t.y)].some((n) => n.road || trails.has(key(s, n)));
}

/** Stars one caravanserai pays a turn: 1, or 2 when trade passes it. */
export const caravanseraiStars = (s: GameState, t: Tile, trails = routeTiles(s)) => 1 + (onTradeWay(s, t, trails) ? 1 : 0);

/** All `owner`'s caravanserais pay this a turn. */
export function caravanIncome(s: GameState, owner: number): number {
  const trails = routeTiles(s);
  return caravanserais(s, owner).reduce((n, t) => n + caravanseraiStars(s, t, trails), 0);
}

/** Arabia's camel-borne units: Camel Riders, merchants (camel caravans) and Camel Scouts. */
export const isCamel = (u: Unit) => {
  const k = u.carrying ? null : u.kind;
  return k === 'camelrider' || k === 'trader' || k === 'scout';
};

export const mech: Mechanic = {
  name: 'Caravanserais & Desert Roads',
  blurb: 'Raise caravanserais in the desert: each pays +1★ a turn, +1★ more beside a road or trade route. Camels cross the sand as if on a road, and a tech a met empire knows costs 40% less.',

  income(s, owner) {
    return caravanIncome(s, owner);
  },

  // the sand is a road to a camel
  moveStep(s, owner, u, from, to, ctx) {
    if (u.owner !== owner || !isArabia(s, owner) || !isCamel(u)) return;
    if (to.terrain !== 'desert' || !isLand(from) || ctx.opt.embark) return;
    ctx.cost = Math.min(ctx.cost, DESERT_STEP);
  },

  actions(s, owner, t): Action[] {
    if (!isArabia(s, owner) || tileOwnerPlayer(s, t) !== owner) return [];
    if (t.terrain !== 'desert' && t.terrain !== 'field') return [];
    if (t.improvement || t.cityId !== null || t.village || t.resource) return [];
    const why = caravanseraiWhy(s, owner, t);
    const cost = caravanseraiCost(s, owner);
    const poor = s.players[owner].stars < cost;
    return [{
      id: 'mech:caravanserai', label: 'Build Caravanserai',
      desc: `A walled inn for the caravans: +1★ a turn, +1★ more with a road or trade route on it or beside it. Costs ${CARAVANSERAI_STEP}★ more for each one you hold.`,
      cost, icon: 'market', enabled: !why && !poor, reason: why ?? (poor ? 'Not enough stars' : undefined),
    }];
  },

  doAction(s, owner, t, id) {
    if (id !== 'mech:caravanserai' || caravanseraiWhy(s, owner, t)) return false;
    t.improvement = 'caravanserai';
    return true;
  },

  // build a few when there are stars to spare: the best spot is on a road or route, then on desert
  ai(s, owner) {
    if (!isArabia(s, owner)) return false;
    const p = s.players[owner];
    const have = caravanserais(s, owner).length;
    const cities = s.cities.filter((c) => c.owner === owner).length;
    if (have >= Math.min(AI_MAX, cities + 1)) return false;
    const cost = caravanseraiCost(s, owner);
    if (p.stars < cost + 4) return false;
    const trails = routeTiles(s);
    let best: Tile | null = null, bestScore = -1;
    for (const t of s.tiles) {
      if (caravanseraiWhy(s, owner, t)) continue;
      const score = (onTradeWay(s, t, trails) ? 2 : 0) + (t.terrain === 'desert' ? 1 : 0);
      if (score > bestScore) { best = t; bestScore = score; }
    }
    if (!best) return false;
    p.stars -= cost; // the core charges only for human-issued actions; the AI pays here
    return mech.doAction!(s, owner, best, 'mech:caravanserai');
  },
};

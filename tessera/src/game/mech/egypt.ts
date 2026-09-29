// Egypt: Dynastic Wonders & Afterlife (core) + Inundation Silt (economy).
//
// (A) Any land tile inside Egyptian borders where a unit died is marked `data.fallen`. On such a tile the owner may raise a
//     Megalith (`mech:monolith`, improvement `monolith`, 5 stars): +1 population for the city and a *wonder*. Every 2 wonders
//     add +1 star income. When a high-tier Egyptian unit (cost >= 3, or a veteran) dies anywhere, its soul returns as a
//     Golden Guardian (unit kind `guardian`, `data.golden`) at the nearest Pyramid (the capital, or any city ringed by 2+
//     megaliths). Golden Guardians gain +0.5 atk/def per 2 wonders (max +1.5); at most 2 + wonders may exist at once.
// (B) Floodplain simplification: a *silt field* is a field (no resource, or a crop) inside our borders touching shallow/ocean
//     water. `mech:silt` develops it into a farm for 0 stars (data.silt = turns into the cycle). It yields nothing for 3 of
//     our turns; on the 4th (the Flood) it pays FLOOD_STARS and +1 population to the city owning the tile, then restarts.
import { dist, isLand, isWater, tileAt } from '../grid';
import { spawnUnit } from '../mapgen';
import { UNITS } from '../../data/units';
import { addPop, cityById, tileOwnerPlayer, unitAt } from '../rules';
import type { Action } from '../rules';
import { emit } from '../events';
import type { City, GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

export const MONOLITH_COST = 5;
export const FLOOD_STARS = 5;
export const FLOOD_PERIOD = 4; // 3 dry turns, flood on the 4th
export const GUARDIAN_BASE_CAP = 2;

export const isFallen = (t: Tile) => t.data?.fallen === true;
export const siltPhase = (t: Tile): number | null => (t.improvement === 'farm' && typeof t.data?.silt === 'number' ? (t.data.silt as number) : null);

/** Megaliths standing in `owner`'s territory. */
export const wondersOf = (s: GameState, owner: number): number =>
  s.tiles.filter((t) => t.improvement === 'monolith' && tileOwnerPlayer(s, t) === owner).length;

/** A city is a Pyramid when it is the capital or ringed by at least 2 megaliths. */
export function isPyramid(s: GameState, c: City): boolean {
  return c.capital || s.tiles.filter((t) => t.owner === c.id && t.improvement === 'monolith').length >= 2;
}

export const guardianBonus = (wonders: number) => Math.min(1.5, 0.5 * Math.floor(wonders / 2));
const isHighTier = (u: Unit) => u.kind !== 'explorer' && (UNITS[u.kind].cost >= 3 || u.veteran) && !UNITS[u.kind].naval;

/** Why this tile cannot become a silt farm for `owner` (null when it can). */
function siltCheck(s: GameState, owner: number, t: Tile): string | null {
  if (t.terrain !== 'field' || t.cityId !== null || t.village || t.ruin) return 'Only open fields';
  if (tileOwnerPlayer(s, t) !== owner) return 'Must lie inside your borders';
  if (t.improvement || (t.resource && t.resource !== 'crop')) return 'The tile is already developed';
  const u = unitAt(s, t.x, t.y);
  if (u && u.owner !== owner) return 'Enemy unit here';
  const wet = [-1, 0, 1].some((dy) => [-1, 0, 1].some((dx) => { const n = tileAt(s, t.x + dx, t.y + dy); return !!n && isWater(n); }));
  return wet ? null : 'Needs water alongside';
}

function monolithCheck(s: GameState, owner: number, t: Tile): string | null {
  if (!isFallen(t)) return 'Only where a unit has fallen';
  if (!isLand(t) || t.cityId !== null) return 'Cannot build here';
  if (tileOwnerPlayer(s, t) !== owner) return 'Must lie inside your borders';
  if (t.improvement || t.resource) return 'The tile is already developed';
  const u = unitAt(s, t.x, t.y);
  if (u && u.owner !== owner) return 'Enemy unit here';
  return null;
}

function raiseMonolith(s: GameState, owner: number, t: Tile) {
  t.improvement = 'monolith';
  const { fallen: _f, ...rest } = t.data ?? {};
  t.data = { ...rest, monolith: owner };
  const c = cityById(s, t.owner);
  if (c) { emit({ type: 'harvest', player: owner, x: t.x, y: t.y, pop: 1 }); addPop(s, c, 1); }
}

function developSilt(t: Tile) {
  t.improvement = 'farm';
  t.data = { ...(t.data ?? {}), silt: 0 };
}

/** Advance every silt field of `owner` one turn; the 4th turn is the Flood. */
function flood(s: GameState, owner: number) {
  const p = s.players[owner];
  for (const t of s.tiles) {
    const ph = siltPhase(t);
    if (ph === null || tileOwnerPlayer(s, t) !== owner) continue;
    if (ph + 1 < FLOOD_PERIOD) { t.data!.silt = ph + 1; continue; }
    t.data!.silt = 0;
    p.stars += FLOOD_STARS;
    emit({ type: 'stars', player: owner, x: t.x, y: t.y, amount: FLOOD_STARS });
    const c = cityById(s, t.owner);
    if (c) { emit({ type: 'harvest', player: owner, x: t.x, y: t.y, pop: 1 }); addPop(s, c, 1); }
  }
}

/** Spawn a Golden Guardian for a fallen high-tier soldier at the nearest Pyramid. */
function returnSoul(s: GameState, owner: number, u: Unit) {
  const wonders = wondersOf(s, owner);
  if (s.units.filter((g) => g.owner === owner && g.data?.golden).length >= GUARDIAN_BASE_CAP + wonders) return;
  let best: City | null = null;
  let bd = Infinity;
  for (const c of s.cities) {
    if (c.owner !== owner || !isPyramid(s, c)) continue;
    const d = dist(c.x, c.y, u.x, u.y);
    if (d < bd) { bd = d; best = c; }
  }
  if (!best) return;
  const b = best;
  const spot = [tileAt(s, b.x, b.y)!, ...s.tiles.filter((t) => dist(t.x, t.y, b.x, b.y) === 1)]
    .find((t) => isLand(t) && !(t.x === u.x && t.y === u.y) && !unitAt(s, t.x, t.y) && (t.terrain !== 'mountain' || t.cityId !== null));
  if (!spot) return;
  const g = spawnUnit(s, 'guardian', owner, spot.x, spot.y, null);
  g.data = { golden: true };
  g.hp = UNITS.guardian.hp + 2 * Math.floor(wonders / 2);
}

export const mech: Mechanic = {
  name: 'Dynastic Wonders & Afterlife',
  blurb: 'Megaliths rise over fallen heroes and great souls return to the pyramids as Golden Guardians; fields beside water become free farms that flood every 4th turn with stars and +1 population.',

  turnStart(s, owner) { flood(s, owner); },

  income(s, owner) { return Math.floor(wondersOf(s, owner) / 2); },

  stat(s, owner, u, stat) {
    if (u.owner !== owner || !u.data?.golden || (stat !== 'atk' && stat !== 'def')) return 0;
    return guardianBonus(wondersOf(s, owner));
  },

  unitDied(s, owner, u) {
    if (s.players[owner].tribe !== 'egypt') return;
    const t = tileAt(s, u.x, u.y);
    if (t && isLand(t) && t.cityId === null && !t.improvement && !t.resource && !t.village && tileOwnerPlayer(s, t) === owner) {
      t.data = { ...(t.data ?? {}), fallen: true };
    }
    if (u.owner === owner && !u.data?.golden && isHighTier(u)) returnSoul(s, owner, u);
  },

  actions(s, owner, t): Action[] {
    const acts: Action[] = [];
    const p = s.players[owner];
    if (!siltCheck(s, owner, t)) {
      acts.push({
        id: 'mech:silt', label: 'Silt Farm', cost: 0, icon: 'farm', enabled: true,
        desc: `Free farm on the floodplain: nothing for ${FLOOD_PERIOD - 1} turns, then the Flood brings ${FLOOD_STARS} stars and +1 population, again and again.`,
      });
    }
    if (isFallen(t) && tileOwnerPlayer(s, t) === owner) {
      const why = monolithCheck(s, owner, t) ?? (p.stars < MONOLITH_COST ? 'Not enough stars' : null);
      acts.push({
        id: 'mech:monolith', label: 'Raise Megalith', cost: MONOLITH_COST, icon: 'temple', enabled: !why, reason: why ?? undefined,
        desc: 'A wonder over the fallen: +1 population, stronger Golden Guardians, and +1 star income per 2 wonders.',
      });
    }
    return acts;
  },

  doAction(s, owner, t, id) {
    if (id === 'mech:silt') { if (siltCheck(s, owner, t)) return false; developSilt(t); return true; }
    if (id === 'mech:monolith') { if (monolithCheck(s, owner, t)) return false; raiseMonolith(s, owner, t); return true; }
    return false;
  },

  ai(s, owner) {
    const p = s.players[owner];
    if (p.stars >= MONOLITH_COST) {
      const t = s.tiles.find((x) => isFallen(x) && !monolithCheck(s, owner, x));
      if (t) { p.stars -= MONOLITH_COST; raiseMonolith(s, owner, t); return true; }
    }
    const f = s.tiles.find((x) => !siltCheck(s, owner, x));
    if (f) { developSilt(f); return true; }
    return false;
  },
};

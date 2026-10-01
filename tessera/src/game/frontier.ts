// Frontier Camps: a way out for a city hemmed in by mountains, sea or bad luck. A land soldier standing on unclaimed
// land within FRONTIER_REACH tiles of your borders may pitch a camp there (no tech needed): the tile and the ring
// around it (whatever no one else holds) join the nearest of your cities, so there is new land to farm, homestead or
// cultivate. FRONTIER_BASE★, +FRONTIER_STEP★ for each camp you hold; at most FRONTIER_PER_CITY per city. A camp is
// not a city, so it works in the One City Challenge too. The tile keeps `improvement: 'frontier'`.
import { emit } from './events';
import { area, dist, isLand } from './grid';
import { citiesOf, def, doAction, tileOwnerPlayer, unitAt, type Action } from './rules';
import type { City, GameState, Tile } from './types';
import { isTrader } from './trade';
import { isRoleUnit } from './roles';
import { isSupport } from './auxiliaries';
import { naturalAt } from '../data/naturals';

export const FRONTIER_BASE = 5;
export const FRONTIER_STEP = 2;
export const FRONTIER_PER_CITY = 2;
export const FRONTIER_REACH = 2;

export const frontierCount = (s: GameState, pid: number) => s.tiles.filter((t) => t.improvement === 'frontier' && tileOwnerPlayer(s, t) === pid).length;
export const frontierCost = (s: GameState, pid: number) => FRONTIER_BASE + FRONTIER_STEP * frontierCount(s, pid);
const campsOf = (s: GameState, c: City) => s.tiles.filter((t) => t.improvement === 'frontier' && t.owner === c.id).length;

/** The city a camp here would join: the nearest of yours with room for another camp. */
function hostCity(s: GameState, pid: number, t: Tile): City | undefined {
  return citiesOf(s, pid).filter((c) => campsOf(s, c) < FRONTIER_PER_CITY && !c.data?.waka).sort((a, b) => dist(a.x, a.y, t.x, t.y) - dist(b.x, b.y, t.x, t.y))[0];
}

/** Is this tile near enough to `pid`'s borders? */
const nearBorders = (s: GameState, pid: number, t: Tile) => area(s, t.x, t.y, FRONTIER_REACH).some((n) => tileOwnerPlayer(s, n) === pid);

export function frontierActions(s: GameState, pid: number, t: Tile): Action[] {
  const p = s.players[pid];
  const u = unitAt(s, t.x, t.y);
  if (p.neutral || !u || u.owner !== pid || t.owner !== null || !isLand(t) || t.cityId !== null || t.village || t.ruin || t.improvement) return [];
  if (def(u).naval || isTrader(u) || isRoleUnit(u) || isSupport(u) || naturalAt(s, t.x, t.y) || t.terrain === 'platform') return [];
  if (!nearBorders(s, pid, t)) return [];
  const host = hostCity(s, pid, t);
  const cost = frontierCost(s, pid);
  const why = !host ? `Every city already has ${FRONTIER_PER_CITY} camps` : u.attacked ? 'Unit has already attacked' : p.stars < cost ? 'Not enough stars' : undefined;
  return [{
    id: 'frontier', label: 'Pitch a Camp', cost, icon: 'flag', enabled: !why, reason: why,
    desc: `A frontier camp: this tile and the free land around it join ${host?.name ?? 'your nearest city'}, giving it room to grow. Each camp costs ${FRONTIER_STEP}★ more; up to ${FRONTIER_PER_CITY} per city.`,
  }];
}

export function frontierDoAction(s: GameState, pid: number, t: Tile): boolean {
  const host = hostCity(s, pid, t);
  if (!host) return false;
  t.improvement = 'frontier';
  let n = 0;
  for (const x of area(s, t.x, t.y, 1)) if (x.owner === null && x.cityId === null && !x.village) { x.owner = host.id; n++; }
  const u = unitAt(s, t.x, t.y);
  if (u) u.attacked = true;
  emit({ type: 'toast', player: pid, text: `🏕 A frontier camp: ${n} new tile${n === 1 ? '' : 's'} join ${host.name}.` });
  return true;
}

/** An AI whose cities have run out of room pitches a camp with a unit standing near its borders. */
export function frontierAi(s: GameState, pid: number): boolean {
  const p = s.players[pid];
  if (p.stars < frontierCost(s, pid) + 4) return false;
  for (const u of s.units) {
    if (u.owner !== pid || u.attacked) continue;
    const t = s.tiles[u.y * s.size + u.x];
    const a = frontierActions(s, pid, t)[0];
    if (!a?.enabled) continue;
    // worth it when the land around has something to work
    const gain = area(s, t.x, t.y, 1).filter((x) => x.owner === null && isLand(x) && (x.resource || x.terrain === 'field' || x.terrain === 'forest')).length;
    if (gain >= 3 && doAction(s, pid, t, 'frontier')) return true;
  }
  return false;
}

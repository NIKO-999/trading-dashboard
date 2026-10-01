// Making land work without luck.
//  - HOMESTEAD: turn an empty field (or desert or tundra) in your borders into a working Farm from nothing (Farming):
//    crops are sown and the farm built in one go, +2 population. Cheap for Economy empires, dear for Military ones
//    (HOMESTEAD_COST), and each one in the same city costs 1★ more.
//  - CULTIVATE: once an empire you have met has developed a resource, you can raise your own source of it on suitable
//    empty land in your borders, with the tech you would need anyway: plant a luxury (it is built straight as its
//    works), sink a Mine (Iron) or fence a Pasture (Horses). CULTIVATE_BASE★, +CULTIVATE_STEP★ for each you have made.
import { categoryOf, type Category } from '../data/tribes';
import { emit } from './events';
import { LUXURIES, LUXURY_IDS, luxuriesOf, type Luxury } from './goods';
import { addPop, cityById, hasTech, tileOwnerPlayer, unitAt, type Action } from './rules';
import type { GameState, Terrain, Tile } from './types';

export const HOMESTEAD_COST: Record<Category, number> = { military: 9, economy: 3, naval: 6 };
export const HOMESTEAD_POP = 2;
export const CULTIVATE_BASE = 8;
export const CULTIVATE_STEP = 2;

const isLux = (c: Crop): c is Luxury => c !== 'iron' && c !== 'horses';
const empty = (t: Tile) => !t.improvement && !t.resource && t.cityId === null && !t.village && !t.ruin;
const homesteadsIn = (s: GameState, cityId: number) => Number(cityById(s, cityId)?.data?.homesteads ?? 0);

export function homesteadCost(s: GameState, pid: number, t: Tile): number {
  return HOMESTEAD_COST[categoryOf(s.players[pid].tribe).id] + (t.owner === null ? 0 : homesteadsIn(s, t.owner));
}

/** What can be cultivated: a luxury, Iron (a mine on ore) or Horses (a pasture on a herd). */
export type Crop = Luxury | 'iron' | 'horses';
interface CropDef { name: string; works: string; tech: string; terrain: Terrain[]; icon: string }
const STRATEGIC: Record<'iron' | 'horses', CropDef> = {
  iron: { name: 'Iron', works: 'Mine', tech: 'mining', terrain: ['field', 'desert', 'tundra', 'mountain'], icon: 'mine' },
  horses: { name: 'Horses', works: 'Pasture', tech: 'horsemanship', terrain: ['field', 'tundra'], icon: 'animal' },
};
export const cropDef = (c: Crop): CropDef => (isLux(c)
  ? { name: LUXURIES[c].name, works: LUXURIES[c].works, tech: LUXURIES[c].tech, terrain: LUXURIES[c].terrain, icon: `lux:${c}` }
  : STRATEGIC[c]);

/** Has an empire `pid` has met (alive, not the wild) developed this resource somewhere? */
function seenDeveloped(s: GameState, pid: number, c: Crop): boolean {
  const met = s.players[pid].met ?? [];
  return s.players.some((q) => q.id !== pid && q.alive && !q.neutral && met.includes(q.id) && (
    isLux(c) ? !!luxuriesOf(s, q.id)[c]
      : s.tiles.some((t) => t.improvement === (c === 'iron' ? 'mine' : 'pasture') && tileOwnerPlayer(s, t) === q.id)));
}

export const cultivateCost = (s: GameState, pid: number) => CULTIVATE_BASE + CULTIVATE_STEP * (s.players[pid].cultivated ?? 0);

export function homesteadActions(s: GameState, pid: number, t: Tile): Action[] {
  const p = s.players[pid];
  if (p.neutral || !empty(t) || tileOwnerPlayer(s, t) !== pid) return [];
  const u = unitAt(s, t.x, t.y);
  if (u && u.owner !== pid) return [];
  const out: Action[] = [];
  if (t.terrain === 'field' || t.terrain === 'desert' || t.terrain === 'tundra') {
    const cost = homesteadCost(s, pid, t);
    const has = hasTech(s, pid, 'farming');
    out.push({
      id: 'homestead', label: 'Homestead', cost, icon: 'farm', enabled: has && p.stars >= cost,
      reason: !has ? 'Needs Farming' : p.stars < cost ? 'Not enough stars' : undefined, needs: has ? undefined : 'farming',
      desc: `Sow crops and build a Farm here from nothing: +${HOMESTEAD_POP} population. Each homestead in this city costs 1★ more.`,
    });
  }
  const cost = cultivateCost(s, pid);
  for (const c of [...LUXURY_IDS, 'iron', 'horses'] as Crop[]) {
    const d = cropDef(c);
    if (!d.terrain.includes(t.terrain) || !seenDeveloped(s, pid, c)) continue;
    const has = hasTech(s, pid, d.tech);
    out.push({
      id: `cultivate:${c}`, label: `Cultivate ${d.name}`, cost, icon: d.icon, enabled: has && p.stars >= cost,
      reason: !has ? `Needs ${d.tech}` : p.stars < cost ? 'Not enough stars' : undefined, needs: has ? undefined : d.tech,
      desc: `Learned from a people you have met: raise your own ${d.name} here, built straight as a ${d.works}. Each source you cultivate costs ${CULTIVATE_STEP}★ more.`,
    });
  }
  return out;
}

export function homesteadDoAction(s: GameState, pid: number, t: Tile, id: string): boolean {
  const c = cityById(s, t.owner);
  if (!c) return false;
  if (id === 'homestead') {
    t.resource = 'crop';
    t.improvement = 'farm';
    c.data = { ...(c.data ?? {}), homesteads: homesteadsIn(s, c.id) + 1 };
    addPop(s, c, HOMESTEAD_POP);
    emit({ type: 'harvest', player: pid, x: t.x, y: t.y, pop: HOMESTEAD_POP });
    return true;
  }
  if (id.startsWith('cultivate:')) {
    const crop = id.slice(10) as Crop;
    if (isLux(crop)) { t.resource = crop; t.improvement = 'estate'; }
    else if (crop === 'iron') { t.resource = 'ore'; t.improvement = 'mine'; }
    else { t.resource = 'animal'; t.improvement = 'pasture'; }
    const p = s.players[pid];
    p.cultivated = (p.cultivated ?? 0) + 1;
    addPop(s, c, 1);
    emit({ type: 'harvest', player: pid, x: t.x, y: t.y, pop: 1 });
    emit({ type: 'toast', player: pid, text: `${cropDef(crop).name} now grows in ${c.name}: a ${cropDef(crop).works} of your own.` });
    return true;
  }
  return false;
}

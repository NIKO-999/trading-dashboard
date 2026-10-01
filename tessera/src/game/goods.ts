// Strategic and luxury resources.
//
//  - Bonus resources (fruit, crops, game, fish, ore, whales) grow cities, as they always have.
//  - Strategic resources are stockpiled: every Mine digs Iron and every Pasture breeds Horses each turn (more when
//    the tile is raised, see game/levels), up to STOCK_CAP of each. Iron-age units spend them when trained or
//    upgraded (NEEDS): no Iron, no Swordsmen.
//  - Luxuries (silk, spices, wine, ivory, pearls, incense) are rare deposits on the map. Developing one grows its
//    city by 1 and pays every turn: LUX_FIRST★ for each different luxury you hold, LUX_EXTRA★ for each extra copy.
import { TRIBES } from '../data/tribes';
import { neighbors } from './grid';
import { SPECIALITY, tileLevel } from './levels';
import { perkSum } from './perks';
import type { Rng } from './rng';
import { routesOf } from './trade';
import type { GameState, Player, Resource, Terrain, Tile, UnitKind } from './types';

export type Strategic = 'iron' | 'horses';
export type Luxury = 'silk' | 'spices' | 'wine' | 'ivory' | 'pearls' | 'incense';
export const LUXURY_IDS: Luxury[] = ['silk', 'spices', 'wine', 'ivory', 'pearls', 'incense'];

export interface LuxuryDef {
  name: string; // the good
  works: string; // what developing it builds
  tech: string; // the tech that lets you develop it
  terrain: Terrain[]; // where deposits lie
  blurb: string;
}
export const LUXURIES: Record<Luxury, LuxuryDef> = {
  silk: { name: 'Silk', works: 'Silk Farm', tech: 'forestry', terrain: ['forest'], blurb: 'Silkworms spinning in the mulberry groves.' },
  spices: { name: 'Spices', works: 'Spice Garden', tech: 'forestry', terrain: ['forest', 'swamp'], blurb: 'Pepper, cinnamon and cloves, worth their weight in gold.' },
  wine: { name: 'Wine', works: 'Vineyard', tech: 'farming', terrain: ['field'], blurb: 'Sun-warmed vines heavy with grapes.' },
  ivory: { name: 'Ivory', works: 'Ivory Camp', tech: 'hunting', terrain: ['field', 'desert'], blurb: 'Great tusks, carved into treasures.' },
  pearls: { name: 'Pearls', works: 'Pearl Beds', tech: 'fishing', terrain: ['shallow'], blurb: 'Oyster beds glinting in the shallows.' },
  incense: { name: 'Incense', works: 'Incense Grove', tech: 'farming', terrain: ['desert'], blurb: 'Fragrant resin for every temple in the world.' },
};
export const isLuxury = (r: Resource | null | undefined): r is Luxury => !!r && (LUXURY_IDS as string[]).includes(r);

/** Stars a turn for each different luxury held, and for each further copy of one. */
export const LUX_FIRST = 2;
export const LUX_EXTRA = 1;
export const LUX_COST = 5;
/** The most of each strategic resource an empire can stockpile. */
export const STOCK_CAP = 12;

/** What training (or upgrading into) a unit uses up. An empire's unique unit needs what the unit it replaces needs. */
export const NEEDS: Partial<Record<UnitKind, Partial<Record<Strategic, number>>>> = {
  swordsman: { iron: 2 },
  catapult: { iron: 1 },
  knight: { horses: 2 },
};
export const STRATEGIC_NAME: Record<Strategic, string> = { iron: 'Iron', horses: 'Horses' };
export const STRATEGIC_ICON: Record<Strategic, string> = { iron: '⛏', horses: '🐎' };

export function needsOf(k: UnitKind): Partial<Record<Strategic, number>> | undefined {
  if (NEEDS[k]) return NEEDS[k];
  for (const t of Object.values(TRIBES)) if (t.unique === k) return NEEDS[t.replaces];
  return undefined;
}

export function stockOf(p: Player): Record<Strategic, number> & { goods?: number } {
  return (p.stock ??= { iron: 0, horses: 0 });
}

const ownedBy = (s: GameState, pid: number, t: Tile) => t.owner !== null && s.cities.find((c) => c.id === t.owner)?.owner === pid;

/**
 * Iron and Horses a turn: a Mine digs 1 Iron per level, a Pasture breeds 1 Horse (2 once raised to Stables). A people
 * whose speciality is the pasture (the horse and herd nations, see game/levels) breeds 1 more at each; the Pirates, who
 * hold no land to mine, smuggle 1 Iron a turn through each of their Ports.
 */
export function stockYield(s: GameState, pid: number): Record<Strategic, number> {
  const y = { iron: 0, horses: 0 };
  const tribe = s.players[pid].tribe;
  const herders = SPECIALITY[tribe]?.kind === 'pasture';
  for (const t of s.tiles) {
    if (t.improvement !== 'mine' && t.improvement !== 'pasture' && t.improvement !== 'port') continue;
    if (!ownedBy(s, pid, t)) continue;
    if (t.improvement === 'mine') y.iron += Math.max(1, tileLevel(t));
    else if (t.improvement === 'pasture') y.horses += Math.max(1, tileLevel(t) - 1) + (herders ? 1 : 0);
    else if (tribe === 'pirates') y.iron += 1;
  }
  y.iron += perkSum(s, pid, 'stock', (pk) => pk.of === 'iron'); // Bloomery and Stockyards (see game/government)
  y.horses += perkSum(s, pid, 'stock', (pk) => pk.of === 'horses');
  return y;
}

/** Why `pid` can't afford a unit's strategic resources right now, or undefined when it can (or needs none). */
export function needWhy(s: GameState, pid: number, k: UnitKind): string | undefined {
  const need = needsOf(k);
  if (!need) return undefined;
  const have = stockOf(s.players[pid]);
  for (const r of Object.keys(need) as Strategic[]) {
    if (have[r] < need[r]!) return `Needs ${need[r]} ${STRATEGIC_NAME[r]} (you have ${have[r]}): ${r === 'iron' ? 'build Mines' : 'raise Pastures'}`;
  }
  return undefined;
}

/** A short "2 Iron" note for a unit's description, or ''. */
export function needNote(k: UnitKind): string {
  const need = needsOf(k);
  return need ? ` Uses ${(Object.keys(need) as Strategic[]).map((r) => `${need[r]} ${STRATEGIC_NAME[r]}`).join(', ')}.` : '';
}

export function spendNeeds(s: GameState, pid: number, k: UnitKind) {
  const need = needsOf(k);
  if (!need) return;
  const have = stockOf(s.players[pid]);
  for (const r of Object.keys(need) as Strategic[]) have[r] = Math.max(0, have[r] - need[r]!);
}

/** Start of turn: the mines and pastures add to the stockpile. */
export function goodsTurnStart(s: GameState, pid: number) {
  const p = s.players[pid];
  if (p.neutral) return;
  const y = stockYield(s, pid);
  const have = stockOf(p);
  for (const r of ['iron', 'horses'] as Strategic[]) have[r] = Math.min(STOCK_CAP, have[r] + y[r]);
  have.goods = Math.min(STOCK_CAP, (have.goods ?? 0) + goodsYield(s, pid)); // luxury goods for the Armoury (see game/forge)
}

/** Luxury goods a turn: 1 for every developed luxury held. They buy the Armoury's upgrades (see game/forge). */
export const goodsYield = (s: GameState, pid: number) => Object.values(luxuriesOf(s, pid)).reduce((a, n) => a + n, 0);
export const goodsOf = (p: Player) => stockOf(p).goods ?? 0;

/** Developed luxuries held, by kind. */
export function luxuriesOf(s: GameState, pid: number): Partial<Record<Luxury, number>> {
  const out: Partial<Record<Luxury, number>> = {};
  for (const t of s.tiles) if (isLuxury(t.resource) && t.improvement === 'estate' && ownedBy(s, pid, t)) out[t.resource] = (out[t.resource] ?? 0) + 1;
  return out;
}

/** Copies of one luxury that make a Monopoly. */
export const MONOPOLY_AT = 3;
/** The most Stars a Monopoly's trade routes add. */
export const MONOPOLY_ROUTES_MAX = 5;

/** The luxuries `pid` holds a Monopoly on (MONOPOLY_AT or more developed copies). */
export const monopoliesOf = (s: GameState, pid: number): Luxury[] =>
  (Object.entries(luxuriesOf(s, pid)) as [Luxury, number][]).filter(([, n]) => n >= MONOPOLY_AT).map(([l]) => l);

/**
 * Stars a turn from luxuries: LUX_FIRST for each different kind, LUX_EXTRA for each further copy. A Monopoly pays
 * LUX_FIRST for every copy, and +1★ for each live trade route the empire runs (up to MONOPOLY_ROUTES_MAX).
 */
export function luxuryIncome(s: GameState, pid: number): number {
  const held = Object.values(luxuriesOf(s, pid));
  let n = held.reduce((a, c) => a + (c >= MONOPOLY_AT ? c * LUX_FIRST : LUX_FIRST + (c - 1) * LUX_EXTRA), 0);
  if (held.some((c) => c >= MONOPOLY_AT)) n += Math.min(MONOPOLY_ROUTES_MAX, routesOf(s, pid).length);
  return n;
}

/** Sprinkles luxury deposits over the map (clusters of 1-3 of a kind), and one within reach of every capital. */
export function placeLuxuries(s: GameState, rng: Rng) {
  const free = (t: Tile) => !t.resource && !t.improvement && !t.village && !t.ruin && t.cityId === null;
  const fits = (t: Tile) => LUXURY_IDS.filter((l) => LUXURIES[l].terrain.includes(t.terrain));
  const near = (t: Tile, d: number) => s.cities.some((c) => Math.max(Math.abs(c.x - t.x), Math.abs(c.y - t.y)) <= d);
  // one deposit beside every capital, two or three tiles out, so luxuries matter from the start
  for (const c of s.cities) {
    const ring = neighbors(s, c.x, c.y, 2).filter((t) => free(t) && fits(t).length);
    if (!ring.length) continue;
    const t = rng.pick(ring);
    t.resource = rng.pick(fits(t));
  }
  const target = Math.round((s.size * s.size) / 55);
  const spots = rng.shuffle(s.tiles.filter((t) => free(t) && fits(t).length && !near(t, 2)));
  let placed = 0;
  for (const t of spots) {
    if (placed >= target) break;
    if (!free(t) || neighbors(s, t.x, t.y, 2).some((n) => isLuxury(n.resource))) continue;
    const kind = rng.pick(fits(t));
    t.resource = kind;
    placed++;
    for (const n of neighbors(s, t.x, t.y, 1)) if (free(n) && LUXURIES[kind].terrain.includes(n.terrain) && rng.chance(0.3)) n.resource = kind;
  }
}

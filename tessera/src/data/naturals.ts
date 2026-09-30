// Natural Wonders: the eight landmarks and what holding each gives (the rules are in game/naturals.ts, the art in
// render/naturals.ts). This file is plain data plus the cheap questions the perk code must ask ("which wonders lie in
// this empire's borders?"), kept free of game rules so game/perks can load it without an import cycle.
import type { Perk } from '../game/perks';
import type { City, GameState, NaturalSite, Terrain } from '../game/types';

/** The bonuses (see NATURALS for which is whose). */
export const FLATS_STARS = 2; // Skymirror Flats: its city earns this many ★ more a turn
export const PEAK_DEF = 1; // Mount Halcyra: your units on its city's land defend this much better
export const GROTTO_OFF = 0.1; // Glimmerdeep Grotto: research costs this share less (at least 1★)
export const ELDER_EVERY = 5; // the Hollowcrown Elder: +1 population to its city every this many turns
export const SPRINGS_MOVE = 1; // Emberbreath Springs: land units starting next to it move this much further

export type NaturalId = 'falls' | 'grotto' | 'peak' | 'elder' | 'reef' | 'flats' | 'springs' | 'glacier';

export interface NaturalDef {
  id: NaturalId;
  name: string;
  /** One line of lore. */
  lore: string;
  /** What holding it gives, in words. */
  bonus: string;
  /** Terrain its tile may have (it keeps that terrain for movement). */
  terrain: Terrain[];
  /** Its tile must touch water. */
  coast?: boolean;
  /** Empire-wide perks while held (see game/perks); the rest is applied by the hooks below. */
  perks?: Perk[];
}

export const NATURALS: Record<NaturalId, NaturalDef> = {
  falls: {
    id: 'falls', name: 'Thundermantle Falls', terrain: ['mountain', 'field', 'forest'], coast: true,
    lore: 'A river leaps from the cliffs in a roaring white veil; the spray is said to close any wound.',
    bonus: 'Your units on its city’s land heal to full at the start of your turn.',
  },
  grotto: {
    id: 'grotto', name: 'Glimmerdeep Grotto', terrain: ['mountain', 'field', 'desert', 'tundra'],
    lore: 'A cave of singing crystal. Scholars who sleep inside wake with new ideas.',
    bonus: `Research costs ${Math.round(GROTTO_OFF * 100)}% less (at least 1★ less).`,
  },
  peak: {
    id: 'peak', name: 'Mount Halcyra', terrain: ['mountain'],
    lore: 'A lone spire crowned with a ring of light at dawn. No army has ever taken it by storm.',
    bonus: `Your units on its city’s land defend +${PEAK_DEF}.`,
  },
  elder: {
    id: 'elder', name: 'The Hollowcrown Elder', terrain: ['forest', 'field', 'swamp'],
    lore: 'A tree older than any people, its hollow crown wide enough to shelter a village.',
    bonus: `Its city grows +1 population every ${ELDER_EVERY} turns.`,
  },
  reef: {
    id: 'reef', name: 'The Opaline Reef', terrain: ['shallow'],
    lore: 'Coral gardens in every colour of a shell’s lining, teeming with fish. Ships may sail over it.',
    bonus: 'Every fish harvest grows its city by 1 more, and every port you own pays +1★ a turn.',
    perks: [{ k: 'grow', on: 'fish', n: 1 }, { k: 'income', per: 'port', n: 1 }],
  },
  flats: {
    id: 'flats', name: 'The Skymirror Flats', terrain: ['desert', 'field', 'tundra'],
    lore: 'A plain of white salt so still after rain that the sky lies on the ground.',
    bonus: `Salt caravans: its city earns +${FLATS_STARS}★ a turn.`,
  },
  springs: {
    id: 'springs', name: 'Emberbreath Springs', terrain: ['field', 'tundra', 'swamp', 'desert'],
    lore: 'Terraces of warm stone where geysers breathe steam into the cold air.',
    bonus: `Your land units that start their move next to it move +${SPRINGS_MOVE}.`,
  },
  glacier: {
    id: 'glacier', name: 'The Lanternveil Glacier', terrain: ['tundra', 'mountain', 'field'],
    lore: 'Blue ice beneath curtains of green and violet light that dance on winter nights.',
    bonus: 'All your units and cities see 1 tile further, and every city that levels up pays +2★.',
    perks: [{ k: 'vision', n: 1 }, { k: 'levelstar', n: 2 }],
  },
};
export const NATURAL_IDS = Object.keys(NATURALS) as NaturalId[];

// ---------------------------------------------------------------- small queries

export const naturalSites = (s: GameState): NaturalSite[] => s.naturals?.sites ?? [];
export const naturalAt = (s: GameState, x: number, y: number): NaturalSite | undefined => s.naturals?.sites.find((n) => n.x === x && n.y === y);
export const naturalDef = (n: NaturalSite): NaturalDef => NATURALS[n.id as NaturalId];

/** The city whose land the wonder lies in, if any. */
export function naturalCity(s: GameState, n: NaturalSite): City | undefined {
  const t = s.tiles[n.y * s.size + n.x];
  return t.owner === null ? undefined : s.cities.find((c) => c.id === t.owner);
}
/** The empire holding it now (whose borders it lies in), or null. */
export const naturalHolder = (s: GameState, n: NaturalSite): number | null => naturalCity(s, n)?.owner ?? null;
/** The wonders `pid` holds right now. */
export const naturalsHeldBy = (s: GameState, pid: number): NaturalSite[] => naturalSites(s).filter((n) => naturalHolder(s, n) === pid);

/** Empire-wide perks of the wonders `pid` holds (read by game/perks). */
export function naturalPerks(s: GameState, pid: number): Perk[] {
  if (!s.naturals) return [];
  const out: Perk[] = [];
  for (const n of naturalsHeldBy(s, pid)) out.push(...(naturalDef(n).perks ?? []));
  return out;
}

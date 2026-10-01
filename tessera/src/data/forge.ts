// The Armoury's five tiers for each military unit type (see game/forge). Pure data, read by game/perks, so a tier
// raises attack, movement or range wherever those stats are used. `forge` lives on the player: kind -> tiers bought.
import { UNITS } from './units';
import type { Player, UnitKind } from '../game/types';

export interface ForgeTier { name: string; stars: number; goods: number; yard: number; atk?: number; move?: number; range?: number }
/** Tier 4 gives a ranged unit +1 range, anyone else +0.5 attack. `yard`: the Barracks level the tier needs. */
export const FORGE_TIERS: ForgeTier[] = [
  { name: 'Tempered Blades', stars: 5, goods: 1, yard: 1, atk: 0.5 },
  { name: 'Forced Marches', stars: 8, goods: 2, yard: 1, move: 1 },
  { name: 'Battle Drill', stars: 12, goods: 3, yard: 1, atk: 0.5 },
  { name: 'Long Reach', stars: 16, goods: 4, yard: 2, range: 1 },
  { name: 'Masterwork Arms', stars: 20, goods: 5, yard: 3, atk: 0.5 },
];
export const FORGE_MAX = FORGE_TIERS.length;

export const forgeTier = (p: Player | undefined, k: UnitKind) => p?.forge?.[k] ?? 0;
const ranged = (k: UnitKind) => UNITS[k].range > 1;

/** What a tier gives this kind (tier 4 is range for archers and siege, attack for the rest). */
export function tierGives(i: number, k: UnitKind): { atk: number; move: number; range: number } {
  const t = FORGE_TIERS[i];
  if (t.range) return ranged(k) ? { atk: 0, move: 0, range: t.range } : { atk: 0.5, move: 0, range: 0 };
  return { atk: t.atk ?? 0, move: t.move ?? 0, range: 0 };
}

/** The Armoury's total bonus to one stat of this kind for this empire. */
export function forgeBonus(p: Player | undefined, k: UnitKind, stat: 'atk' | 'move' | 'range'): number {
  let n = 0;
  for (let i = 0; i < forgeTier(p, k); i++) n += tierGives(i, k)[stat];
  return n;
}

export const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];

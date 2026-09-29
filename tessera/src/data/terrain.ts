import type { Terrain } from '../game/types';

/** Land that is neither field, forest nor mountain: what makes each one different to play on. */
export type ClimateTerrain = 'desert' | 'swamp' | 'tundra';
export const CLIMATES: ClimateTerrain[] = ['desert', 'swamp', 'tundra'];

export interface TerrainInfo {
  name: string;
  blurb: string;
  top: string; // colour of the tile top
  side: string;
}

export const CLIMATE_INFO: Record<ClimateTerrain, TerrainInfo> = {
  desert: { name: 'Desert', blurb: 'Dry sand. No farms, but ore and the odd oasis. Irrigate it into a field with Farming.', top: '#e3c98c', side: '#b8955a' },
  swamp: { name: 'Swamp', blurb: 'Boggy ground. Units entering stop (unless a road runs through), but it gives cover. Drain it into a field with Forestry.', top: '#6f8d5c', side: '#4f4630' },
  tundra: { name: 'Tundra', blurb: 'Frozen ground. Reindeer and ore, no farms, and units left out in the cold beyond your borders lose 1 HP a turn.', top: '#e4edf1', side: '#9db0bc' },
};

export const isClimate = (t: Terrain): t is ClimateTerrain => t === 'desert' || t === 'swamp' || t === 'tundra';

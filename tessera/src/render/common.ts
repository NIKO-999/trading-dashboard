// Shared constants and types for the map renderer.
import type { Tile, TribeId, UnitKind } from '../game/types';
import { TH, TW } from './camera';
import type { Pt } from './prims';

export const FONT = '"Josefin Sans", "Avenir Next", system-ui, sans-serif';
export const HW = TW / 2;
export const HH = TH / 2;
export const UNIT_SCALE = 1.35;
export const REDUCED_MOTION = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export const LUNGE_MS = 260;
export const FLASH_MS = 320;
export const GHOST_MS = 650;
export const FLOAT_MS = 1100;
export const HOP_MS = 170; // one tile of a walk
export const SAIL_MS = 150; // one tile of a boat trip

export const isWaterTile = (t: Tile) => t.terrain === 'shallow' || t.terrain === 'ocean';

/** Screen point for tile-local coords (u along +x, v along +y, both -0.5..0.5) around a tile centre. */
export const uv = (cx: number, cy: number, u: number, v: number): Pt => ({ x: cx + (u - v) * HW, y: cy + (u + v) * HH });

export interface Fx {
  moves: Map<number, { path: { x: number; y: number }[]; t0: number; dur: number }>;
  lunges: Map<number, { tx: number; ty: number; t0: number }>;
  flashes: Map<number, number>;
  facing: Map<number, number>; // -1 faces left, 1 faces right
  ghosts: { kind: UnitKind; tribe: TribeId; x: number; y: number; t0: number; facing: number }[];
  projectiles: { fx: number; fy: number; tx: number; ty: number; t0: number; dur: number; kind: 'arrow' | 'bolt' | 'stone' | 'nut' | 'ball' | 'shot' }[];
  particles: { x: number; y: number; vx: number; vy: number; g: number; t0: number; life: number; color: string; size: number; shape: 'star' | 'square' | 'puff' | 'drop' | 'ring' }[];
  floaters: { x: number; y: number; text: string; color: string; t0: number }[];
  hpHold: Map<number, { hp: number; until: number }>; // health shown until a blow visibly lands
}

export const newFx = (): Fx => ({
  moves: new Map(), lunges: new Map(), flashes: new Map(), facing: new Map(), ghosts: [], projectiles: [], particles: [], floaters: [], hpHold: new Map(),
});

export interface Overlay {
  selected: { x: number; y: number } | null;
  moves: { x: number; y: number }[];
  attacks: { x: number; y: number }[];
  glow: Set<number>; // tiles (y*size+x) holding something the viewer can harvest right now
  fx: Fx;
  now: number;
}

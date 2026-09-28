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

const coarsePointer = typeof matchMedia === 'function' ? matchMedia('(pointer: coarse)') : null;

/**
 * Pixel density to render canvases at: the screen's own (times any page zoom), never below 2x,
 * and never below 3x on a phone. An app can load its web view off-screen, where the page is told
 * the pixel ratio is 1, and then show it on a 3x screen without a resize event, so a canvas sized
 * from that first reading stays blurry. Every current iPhone is 3x, so phones don't trust it.
 */
export function renderDpr() {
  const phone = !!coarsePointer?.matches && Math.min(screen.width, screen.height) <= 540;
  const raw = (window.devicePixelRatio || 1) * (window.visualViewport?.scale ?? 1);
  return Math.min(3, Math.max(phone ? 3 : 2, raw));
}

export const isWaterTile = (t: Tile) => t.terrain === 'shallow' || t.terrain === 'ocean';

/** Screen point for tile-local coords (u along +x, v along +y, both -0.5..0.5) around a tile centre. */
export const uv = (cx: number, cy: number, u: number, v: number): Pt => ({ x: cx + (u - v) * HW, y: cy + (u + v) * HH });

export interface Fx {
  moves: Map<number, { path: { x: number; y: number }[]; t0: number; dur: number; before?: UnitKind }>; // before: kind at the start (a boat, when landing)
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

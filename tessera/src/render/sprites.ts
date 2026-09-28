// Units are drawn once per (kind, empire, zoom level) into small offscreen bitmaps and reused
// every frame. That keeps busy maps fast on phones and lets the art carry more detail.
import type { TribeId, UnitKind } from '../game/types';
import { setTint } from './prims';
import { drawUnitSprite } from './units';

/** Unit-space box every unit fits in (origin = the unit's feet). */
const BOX = { left: 36, top: 80, w: 72, h: 96 };
const MAX_SPRITES = 72;
/** Total bitmap pixels the cache may hold (iOS caps canvas memory; zoomed-in sprites are big). */
const MAX_PIXELS = 16_000_000;

export type SpriteVariant = 'base' | 'spent' | 'white';
/** A unit bitmap with `q` pixels per unit-space unit and the feet at pixel (ox, oy). */
interface Sprite { canvas: HTMLCanvasElement; q: number; ox: number; oy: number }
const cache = new Map<string, Sprite>();
let cachedPixels = 0;

/**
 * Bitmap of a unit at `pxScale` device pixels per unit-space unit. While the zoom is changing the
 * scale is rounded to steps of ~8% so pinching doesn't create endless variants; once it settles
 * (`exact`) the bitmap is made at exactly the on-screen scale so it can be copied 1:1.
 */
export function unitSprite(kind: UnitKind, tribe: TribeId, pxScale: number, variant: SpriteVariant, exact = false): Sprite {
  const q = exact ? Math.max(0.2, pxScale) : Math.pow(1.08, Math.round(Math.log(Math.max(0.2, pxScale)) / Math.log(1.08)));
  const key = `${kind}|${tribe}|${q.toFixed(4)}|${variant}`;
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }
  // feet on a whole pixel, so placing the feet on a whole device pixel lines up every pixel
  const ox = Math.round(BOX.left * q), oy = Math.round(BOX.top * q);
  const canvas = document.createElement('canvas');
  canvas.width = ox + Math.ceil((BOX.w - BOX.left) * q);
  canvas.height = oy + Math.ceil((BOX.h - BOX.top) * q);
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(q, 0, 0, q, ox, oy);
  if (variant === 'spent') setTint('#6f6f6f', 0.45);
  drawUnitSprite(ctx, kind, tribe, 0, 0, { shadow: false });
  setTint(null);
  if (variant === 'white') {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const sprite = { canvas, q, ox, oy };
  cache.set(key, sprite);
  cachedPixels += canvas.width * canvas.height;
  while (cache.size > 1 && (cache.size > MAX_SPRITES || cachedPixels > MAX_PIXELS)) {
    const oldest = cache.keys().next().value as string;
    const old = cache.get(oldest)!;
    cachedPixels -= old.canvas.width * old.canvas.height;
    old.canvas.width = old.canvas.height = 0; // free the memory right away (iOS counts it)
    cache.delete(oldest);
  }
  return sprite;
}

/** Opaque extent of a figure in unit-art units around its feet: x0..x1 across, y0 (top)..y1. */
export interface FigureBounds { x0: number; y0: number; x1: number; y1: number }
interface FigureShape extends FigureBounds { mask: Uint8Array | null; w: number; h: number; ox: number; oy: number; q: number }
const shapes = new Map<string, FigureShape>();

/** A unit's drawn shape (measured once from its bitmap), so taps match exactly what's on screen. */
function figureShape(kind: UnitKind, tribe: TribeId): FigureShape {
  const key = `${kind}|${tribe}`;
  const hit = shapes.get(key);
  if (hit) return hit;
  const q = 2;
  const sp = unitSprite(kind, tribe, q, 'base', true);
  const { width: w, height: h } = sp.canvas;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  let mask: Uint8Array | null = null;
  try {
    const px = sp.canvas.getContext('2d')!.getImageData(0, 0, w, h).data;
    mask = new Uint8Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if (px[(y * w + x) * 4 + 3] > 40) {
          mask[y * w + x] = 1;
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
  } catch {
    mask = null; // pixels unreadable: the bounds below still work
  }
  const shape: FigureShape = x1 < 0
    ? { x0: -10, y0: -34, x1: 10, y1: 3, mask: null, w, h, ox: sp.ox, oy: sp.oy, q }
    : { x0: (x0 - sp.ox) / q, y0: (y0 - sp.oy) / q, x1: (x1 + 1 - sp.ox) / q, y1: (y1 + 1 - sp.oy) / q, mask, w, h, ox: sp.ox, oy: sp.oy, q };
  shapes.set(key, shape);
  return shape;
}

export function figureBounds(kind: UnitKind, tribe: TribeId): FigureBounds {
  return figureShape(kind, tribe);
}

/**
 * Whether a point (in unit-art units from the feet; +u to the right as drawn) lands on the figure,
 * allowing `slack` units around it for a fingertip. `flip` for a unit drawn facing left.
 */
export function figureHit(kind: UnitKind, tribe: TribeId, u: number, v: number, slack: number, flip = false): boolean {
  const f = figureShape(kind, tribe);
  const uu = flip ? -u : u;
  if (uu < f.x0 - slack || uu > f.x1 + slack || v < f.y0 - slack || v > f.y1 + slack) return false;
  if (!f.mask) return true;
  const r = Math.ceil(slack * f.q);
  const cx = Math.round(f.ox + uu * f.q), cy = Math.round(f.oy + v * f.q);
  for (let dy = -r; dy <= r; dy += Math.max(1, r >> 1))
    for (let dx = -r; dx <= r; dx += Math.max(1, r >> 1)) {
      if (dx * dx + dy * dy > r * r) continue;
      const x = cx + dx, y = cy + dy;
      if (x >= 0 && y >= 0 && x < f.w && y < f.h && f.mask[y * f.w + x]) return true;
    }
  return false;
}

/**
 * Draws a cached unit with its feet at (x, y) in world space. `scale` is world units per
 * unit-space unit; sx/sy squash and stretch around the feet; `flip` mirrors it to face left.
 * Without squash the feet are put on a whole device pixel, so a unit standing still (or bobbing)
 * is an exact copy of its bitmap rather than a resampled, softened one.
 */
export function drawSprite(ctx: CanvasRenderingContext2D, sp: Sprite, x: number, y: number, scale: number, sx = 1, sy = 1, flip = false, alpha = 1) {
  const k = scale / sp.q; // world units per bitmap pixel
  if (sx === 1 && sy === 1) {
    const m = ctx.getTransform();
    if (m.b === 0 && m.c === 0 && m.a > 0 && m.d > 0) {
      x = (Math.round(m.a * x + m.e) - m.e) / m.a;
      y = (Math.round(m.d * y + m.f) - m.f) / m.d;
    }
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -sx : sx, sy);
  if (alpha < 1) ctx.globalAlpha *= alpha;
  ctx.drawImage(sp.canvas, -sp.ox * k, -sp.oy * k, sp.canvas.width * k, sp.canvas.height * k);
  ctx.restore();
}

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

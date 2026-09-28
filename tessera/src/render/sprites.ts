// Units are drawn once per (kind, empire, zoom level) into small offscreen bitmaps and reused
// every frame. That keeps busy maps fast on phones and lets the art carry more detail.
import type { TribeId, UnitKind } from '../game/types';
import { setTint } from './prims';
import { drawUnitSprite } from './units';

/** Unit-space box every unit fits in (origin = the unit's feet). */
const BOX = { left: 36, top: 80, w: 72, h: 96 };
const MAX_SPRITES = 72;

export type SpriteVariant = 'base' | 'spent' | 'white';
interface Sprite { canvas: HTMLCanvasElement }
const cache = new Map<string, Sprite>();

/** Bitmap of a unit rendered at roughly `pxScale` device pixels per unit-space unit. */
export function unitSprite(kind: UnitKind, tribe: TribeId, pxScale: number, variant: SpriteVariant): Sprite {
  // Quantize the scale so zooming doesn't create endless variants (steps of ~8%).
  const q = Math.pow(1.08, Math.round(Math.log(Math.max(0.2, pxScale)) / Math.log(1.08)));
  const key = `${kind}|${tribe}|${q.toFixed(4)}|${variant}`;
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(BOX.w * q);
  canvas.height = Math.ceil(BOX.h * q);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(q, q);
  ctx.translate(BOX.left, BOX.top);
  if (variant === 'spent') setTint('#6f6f6f', 0.45);
  drawUnitSprite(ctx, kind, tribe, 0, 0, { shadow: false });
  setTint(null);
  if (variant === 'white') {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const sprite = { canvas };
  cache.set(key, sprite);
  if (cache.size > MAX_SPRITES) {
    const oldest = cache.keys().next().value as string;
    const old = cache.get(oldest)!;
    old.canvas.width = old.canvas.height = 0; // free the memory right away (iOS counts it)
    cache.delete(oldest);
  }
  return sprite;
}

/**
 * Draws a cached unit with its feet at (x, y) in world space. `scale` is world units per
 * unit-space unit; sx/sy squash and stretch around the feet; `flip` mirrors it to face left.
 */
export function drawSprite(ctx: CanvasRenderingContext2D, sp: Sprite, x: number, y: number, scale: number, sx = 1, sy = 1, flip = false, alpha = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -sx : sx, sy);
  if (alpha < 1) ctx.globalAlpha *= alpha;
  ctx.drawImage(sp.canvas, -BOX.left * scale, -BOX.top * scale, BOX.w * scale, BOX.h * scale);
  ctx.restore();
}

// Drawing side of the Free Cities (see game/citystates): their verdigris-and-gold colours, a still banner with the
// city's type badge planted beside it (on the cached map layer, so it is in the resting picture on iOS), and the type
// badge that goes on its name label and on the Send Envoy button.
import { freeCityOf } from '../game/citystates';
import type { City, FreeKind, GameState } from '../game/types';
import { ellipse, line, poly, shade, softShadow, type Ctx } from './prims';

/** The colour of the Free Cities: borders, roofs and label pills. */
export const FREE_COLOR = '#4d6b63';
export const FREE_ROOF = '#34504a';
/** The gold trim that sets them apart from any empire. */
export const FREE_GOLD = '#e2bf62';

/** The type of the Free City standing as `c`, or null (for the map layers, which only know the city). */
export const freeKindOf = (s: GameState, c: City): FreeKind | null => freeCityOf(s, c)?.kind ?? null;

/** A small type glyph centred on (x, y), `r` its radius, in `ink`. */
export function drawFreeGlyph(ctx: Ctx, kind: FreeKind, x: number, y: number, r: number, ink = '#fff6dc') {
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(1, r * 0.2);
  switch (kind) {
    case 'trade': { // a coin with a square hole
      ctx.beginPath();
      ctx.arc(x, y, r * 0.78, 0, Math.PI * 2);
      ctx.stroke();
      const q = r * 0.26;
      ctx.fillRect(x - q, y - q, q * 2, q * 2);
      break;
    }
    case 'military': { // a sword over a round shield
      ctx.beginPath();
      ctx.arc(x, y + r * 0.1, r * 0.62, 0, Math.PI * 2);
      ctx.stroke();
      line(ctx, x - r * 0.75, y + r * 0.75, x + r * 0.75, y - r * 0.75, ink, Math.max(1, r * 0.22));
      line(ctx, x - r * 0.62, y + r * 0.2, x - r * 0.2, y + r * 0.62, ink, Math.max(1, r * 0.2));
      break;
    }
    case 'science': { // an open book
      poly(ctx, [x, y - r * 0.35, x - r * 0.85, y - r * 0.6, x - r * 0.85, y + r * 0.45, x, y + r * 0.7], ink);
      poly(ctx, [x, y - r * 0.35, x + r * 0.85, y - r * 0.6, x + r * 0.85, y + r * 0.45, x, y + r * 0.7], shade(ink, -0.18));
      line(ctx, x, y - r * 0.35, x, y + r * 0.7, 'rgba(0,0,0,0.35)', Math.max(0.8, r * 0.1));
      break;
    }
    case 'culture': { // a note of music
      ellipse(ctx, x - r * 0.3, y + r * 0.5, r * 0.34, r * 0.26, ink);
      line(ctx, x + r * 0.02, y + r * 0.45, x + r * 0.02, y - r * 0.75, ink, Math.max(1, r * 0.18));
      poly(ctx, [x + r * 0.02, y - r * 0.75, x + r * 0.7, y - r * 0.45, x + r * 0.7, y - r * 0.2, x + r * 0.02, y - r * 0.45], ink);
      break;
    }
    case 'maritime': { // an anchor
      ctx.beginPath();
      ctx.arc(x, y - r * 0.62, r * 0.18, 0, Math.PI * 2);
      ctx.stroke();
      line(ctx, x, y - r * 0.44, x, y + r * 0.75, ink, Math.max(1, r * 0.2));
      line(ctx, x - r * 0.4, y - r * 0.2, x + r * 0.4, y - r * 0.2, ink, Math.max(1, r * 0.18));
      ctx.beginPath();
      ctx.arc(x, y + r * 0.15, r * 0.62, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

/** A round verdigris badge with a gold rim and the type glyph: on labels and buttons. */
export function drawFreeBadge(ctx: Ctx, kind: FreeKind, x: number, y: number, r: number) {
  ellipse(ctx, x, y + r * 0.12, r, r, 'rgba(0,0,0,0.3)');
  ellipse(ctx, x, y, r, r, FREE_GOLD);
  ellipse(ctx, x, y, r * 0.82, r * 0.82, shade(FREE_COLOR, -0.15));
  drawFreeGlyph(ctx, kind, x, y, r * 0.62);
}

/** The Send Envoy button's icon (`free:<kind>`), centred on (x, y). False for an icon that is not ours. */
export function drawFreeIcon(ctx: Ctx, icon: string, x: number, y: number): boolean {
  const kind = icon.slice(5) as FreeKind;
  if (!['trade', 'military', 'science', 'culture', 'maritime'].includes(kind)) return false;
  // a scroll with a wax seal, and the city's badge
  poly(ctx, [x - 15, y - 9, x + 9, y - 13, x + 13, y + 9, x - 11, y + 13], '#f1e4c2');
  poly(ctx, [x - 15, y - 9, x - 11, y + 13, x - 13, y + 13, x - 17, y - 8], '#cdbb8e');
  line(ctx, x - 9, y - 3, x + 5, y - 6, '#9a8a64', 1.4);
  line(ctx, x - 8, y + 2, x + 6, y - 1, '#9a8a64', 1.4);
  drawFreeBadge(ctx, kind, x + 8, y + 8, 9);
  return true;
}

/**
 * The Free City's banner, planted beside it: a pole with a gold finial and a square verdigris flag with a gold border
 * and the type glyph. Still (it is part of the cached map, so it shows in the resting picture). Pole foot at (x, y).
 */
export function drawFreeBanner(ctx: Ctx, kind: FreeKind, x: number, y: number) {
  softShadow(ctx, x + 1, y + 1, 3, 1.2, 0.25);
  line(ctx, x, y, x, y - 30, '#3b2a1a', 1.4);
  ellipse(ctx, x, y - 31, 1.4, 1.4, FREE_GOLD);
  const top = y - 29, w = 13, h = 10;
  poly(ctx, [x, top, x + w, top + 1, x + w, top + h + 1, x, top + h], FREE_GOLD);
  poly(ctx, [x + 1, top + 1, x + w - 1, top + 1.9, x + w - 1, top + h, x + 1, top + h - 1], FREE_COLOR);
  // a swallow tail below the flag in the city's gold
  poly(ctx, [x + 1, top + h, x + 5, top + h + 0.4, x + 3, top + h + 4], FREE_GOLD);
  poly(ctx, [x + 5, top + h + 0.4, x + 9, top + h + 0.8, x + 7, top + h + 4.4], FREE_GOLD);
  drawFreeGlyph(ctx, kind, x + w / 2, top + h / 2 + 0.4, 3.6);
}

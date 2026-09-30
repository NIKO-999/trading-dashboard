// Drawing side of Rebellion (see game/rebels): the Rogue States' crimson borders and war banners, and the small unrest
// badge on the viewer's own restless cities. Borders and city colours go on the cached map layer; the banners wave and
// the badge pulses every frame.
import { cityOrigin } from '../game/culture';
import { cityVisibleTo } from '../game/mech';
import { isRogueCity, onBrink, subject, unrestOf, UNREST_MAX, UNREST_WARN } from '../game/rebels';
import type { City, GameState } from '../game/types';
import { tileCenter } from './camera';
import { FONT, REDUCED_MOTION } from './common';
import { ellipse, line, poly, roundRect, shade, softShadow, type Ctx } from './prims';

/** The colour of the Rogue States: borders, city roofs, label pills and rebel badges. */
export const REBEL_COLOR = '#b3263e';
export const REBEL_ROOF = '#5a2a30';
const CLOTH_DARK = '#2a1519';

/** A Rogue State draws as its people's city in rebel colours: the tribe whose architecture to use. */
export const rogueStyle = (s: GameState, c: City) => (isRogueCity(s, c) ? cityOrigin(s, c) : null);

/**
 * A war banner on a pole planted beside a Rogue State: a crimson cloth with a torn, swallow-tailed fly, a black band
 * and a broken ring (a snapped chain link). `wave` (radians) ripples the cloth. Pole foot at (x, y).
 */
export function rebelBanner(ctx: Ctx, x: number, y: number, wave: number) {
  softShadow(ctx, x + 1, y + 1, 4, 1.6, 0.25);
  line(ctx, x, y, x, y - 40, '#3b2618', 1.8);
  ellipse(ctx, x, y - 41, 1.6, 1.6, '#d9b25a'); // finial
  const top = y - 39, h = 13, w = 18;
  const dy = (k: number) => Math.sin(wave + k * 3.2) * 1.6 * k; // the fly ripples more than the hoist
  const pts: number[] = [];
  const n = 6;
  for (let i = 0; i <= n; i++) { const k = i / n; pts.push(x + k * w, top + dy(k)); }
  // swallow-tailed, torn fly
  pts.push(x + w - 5, top + h * 0.5 + dy(0.8), x + w, top + h + dy(1));
  for (let i = n; i >= 0; i--) { const k = i / n; pts.push(x + k * w, top + h + dy(k) + (i % 2 && i > 2 ? 1.2 : 0)); }
  poly(ctx, pts, REBEL_COLOR);
  // a black band along the hoist and a darker lower half for depth
  poly(ctx, [x, top, x + 4, top + dy(0.2), x + 4, top + h + dy(0.2), x, top + h], CLOTH_DARK);
  poly(ctx, [x + 4, top + h * 0.62 + dy(0.2), x + w * 0.7, top + h * 0.62 + dy(0.7), x + w * 0.7, top + h + dy(0.7), x + 4, top + h + dy(0.2)], shade(REBEL_COLOR, -0.2));
  // the broken ring: an open circle with a gap
  const cx = x + 10, cy = top + h / 2 + dy(0.55);
  ctx.save();
  ctx.strokeStyle = '#f2e3c4';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, 3.2, 0.5, Math.PI * 2 - 0.5);
  ctx.stroke();
  ctx.restore();
}

/** Waving banners over the Rogue States the viewer has seen. Drawn in world space every frame. */
export function drawRebelOverlay(ctx: Ctx, s: GameState, viewer: number, now: number) {
  const t0 = REDUCED_MOTION ? 0 : now;
  for (const c of s.cities) {
    if (!isRogueCity(s, c) || c.data?.waka) continue;
    if (viewer >= 0 && (!s.players[viewer]?.explored[c.y * s.size + c.x] || !cityVisibleTo(s, viewer, c))) continue;
    const p = tileCenter(c.x, c.y);
    rebelBanner(ctx, p.x + 16, p.y - 2, t0 / 260 + c.id);
  }
}

/**
 * A little flame-shaped badge with the unrest count, left of the viewer's own restless city's label (screen space).
 * `r` is the label's box; `k` the label scale.
 */
export function drawUnrestBadge(ctx: Ctx, s: GameState, c: City, r: { x0: number; y0: number; y1: number }, k: number, now: number) {
  if (!subject(s, c)) return;
  const n = unrestOf(c);
  if (n <= 0) return;
  const brink = onBrink(c);
  const hot = brink || n >= UNREST_WARN;
  const pulse = brink && !REDUCED_MOTION ? 1 + Math.sin(now / 140) * 0.08 : 1;
  const w = 30 * k * pulse, h = 17 * k * pulse;
  const x = r.x0 - w - 4 * k, y = r.y0 + (21 * k - h) / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  roundRect(ctx, x + 1, y + 2, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = brink ? REBEL_COLOR : hot ? '#d9702a' : '#8a6a3a';
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  // a tiny flame
  const fx = x + 8 * k, fy = y + h / 2;
  poly(ctx, [fx, fy - 5.5 * k, fx + 3.4 * k, fy + 1 * k, fx, fy + 4.5 * k, fx - 3.4 * k, fy + 1 * k], '#ffd35a');
  poly(ctx, [fx, fy - 1.5 * k, fx + 1.6 * k, fy + 1.6 * k, fx, fy + 3.6 * k, fx - 1.6 * k, fy + 1.6 * k], '#fff4c8');
  ctx.font = `700 ${Math.round(11 * k)}px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${n}/${UNREST_MAX}`, x + 13 * k, fy + 0.5);
  ctx.textBaseline = 'alphabetic';
}

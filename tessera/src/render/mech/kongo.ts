// Kongo: an nkisi nkondi stands beside every city that raised one. A carved wooden figure on a little base, standing
// with hands on hips, a medicine pack (bilongo) sealed with a small mirror on its belly, white clay round the eyes, a
// raffia skirt at the waist, and its body driven all over with iron nails and blades, each one a vow sworn before it.
import { ellipse, line, poly, rand, shade, softShadow } from '../prims';
import type { Ctx } from '../prims';
import { hasNkisi } from '../../game/mech/kongo';
import type { MechRender } from './types';

const WOOD = '#6a4428', WOOD_L = '#8a5c36', WOOD_D = '#3e2614';
const IRON = '#5e6268', IRON_L = '#a8acb0', RUST = '#8a4a2a';
const CLAY = '#efe6d2', RESIN = '#2a1c12', MIRROR = '#c8dce8', RAFFIA = '#cfae6c';

/** The nkisi nkondi standing on (x, y), `k` its scale (about 18 px tall at 1). */
export function nkisi(ctx: Ctx, x: number, y: number, k = 1) {
  softShadow(ctx, x + 1 * k, y + 0.6 * k, 5 * k, 1.8 * k, 0.32);
  // the base
  ellipse(ctx, x, y, 3.6 * k, 1.4 * k, WOOD_D);
  poly(ctx, [x - 3.6 * k, y, x + 3.6 * k, y, x + 3.6 * k, y - 1.2 * k, x - 3.6 * k, y - 1.2 * k], WOOD);
  ellipse(ctx, x, y - 1.2 * k, 3.6 * k, 1.4 * k, WOOD_L);
  // the legs, short and bent
  for (const dx of [-1.3, 1.3]) {
    poly(ctx, [x + dx * k - 0.9 * k, y - 1.4 * k, x + dx * k + 0.9 * k, y - 1.4 * k, x + dx * k + 0.8 * k, y - 6 * k, x + dx * k - 0.8 * k, y - 6 * k], dx < 0 ? WOOD_L : WOOD);
  }
  // the raffia skirt
  poly(ctx, [x - 2.8 * k, y - 5.4 * k, x + 2.8 * k, y - 5.4 * k, x + 3.2 * k, y - 3.4 * k, x - 3.2 * k, y - 3.4 * k], RAFFIA);
  for (let i = 0; i < 7; i++) line(ctx, x - 3 * k + i * k, y - 5.2 * k, x - 3.1 * k + i * k, y - 3 * k, shade(RAFFIA, -0.25), 0.3 * k);
  // the body: a stout torso, the right side in shadow
  poly(ctx, [x - 2.6 * k, y - 5.6 * k, x + 2.6 * k, y - 5.6 * k, x + 2.4 * k, y - 11.6 * k, x - 2.4 * k, y - 11.6 * k], WOOD_L);
  poly(ctx, [x + 0.4 * k, y - 5.6 * k, x + 2.6 * k, y - 5.6 * k, x + 2.4 * k, y - 11.6 * k, x + 0.4 * k, y - 11.6 * k], WOOD);
  // the arms, hands on hips: the akimbo stance of challenge
  for (const s of [-1, 1]) {
    const sx = x + s * 2.5 * k, sy = y - 11 * k;
    line(ctx, sx, sy, sx + s * 1.8 * k, sy + 2.6 * k, s < 0 ? WOOD_L : WOOD, 1.3 * k);
    line(ctx, sx + s * 1.8 * k, sy + 2.6 * k, x + s * 2.4 * k, y - 6.6 * k, s < 0 ? WOOD_L : WOOD, 1.2 * k);
  }
  // the medicine pack on the belly, sealed with resin and a mirror
  ellipse(ctx, x, y - 8.4 * k, 1.8 * k, 1.7 * k, RESIN);
  ellipse(ctx, x - 0.1 * k, y - 8.5 * k, 1 * k, 0.95 * k, MIRROR);
  ellipse(ctx, x - 0.4 * k, y - 8.8 * k, 0.35 * k, 0.3 * k, '#ffffff');
  // the head: large, the eyes rimmed in white clay, a small beard; a headdress of resin
  poly(ctx, [x - 1 * k, y - 11.6 * k, x + 1 * k, y - 11.6 * k, x + 0.9 * k, y - 12.6 * k, x - 0.9 * k, y - 12.6 * k], WOOD_D);
  ellipse(ctx, x, y - 14.8 * k, 2.5 * k, 2.6 * k, WOOD_L);
  poly(ctx, [x + 0.5 * k, y - 17.2 * k, x + 2.5 * k, y - 15.4 * k, x + 2.2 * k, y - 13 * k, x + 0.5 * k, y - 12.3 * k], WOOD);
  ellipse(ctx, x, y - 17.2 * k, 2.2 * k, 0.9 * k, RESIN);
  for (const dx of [-0.9, 0.9]) { ellipse(ctx, x + dx * k, y - 15.1 * k, 0.7 * k, 0.5 * k, CLAY); ellipse(ctx, x + dx * k, y - 15.1 * k, 0.28 * k, 0.28 * k, '#1a120a'); }
  poly(ctx, [x - 0.8 * k, y - 13.2 * k, x + 0.8 * k, y - 13.2 * k, x, y - 11.8 * k], RESIN);
  // the nails and blades, driven in all over the body and arms
  for (let i = 0; i < 22; i++) {
    const px = x + (rand(7, i) - 0.5) * 4.6 * k, py = y - (6 + rand(11, i) * 5.4) * k;
    if (Math.abs(px - x) < 1.7 * k && Math.abs(py - (y - 8.4 * k)) < 1.6 * k) continue; // not through the medicine
    const ang = (rand(13, i) - 0.5) * 1.2 + (px < x ? Math.PI : 0), len = (1.2 + rand(17, i) * 1.4) * k;
    const ex = px + Math.cos(ang) * len, ey = py + Math.sin(ang) * len * 0.6 - 0.4 * k;
    if (i % 5 === 0) poly(ctx, [px, py - 0.3 * k, ex, ey - 0.5 * k, ex, ey + 0.5 * k, px, py + 0.3 * k], i % 2 ? IRON_L : IRON); // a blade
    else line(ctx, px, py, ex, ey, i % 3 ? IRON : RUST, 0.4 * k);
    ellipse(ctx, px, py, 0.3 * k, 0.3 * k, IRON_L);
  }
  // a cord of raffia with a tied knot of cloth round the neck
  line(ctx, x - 1.8 * k, y - 11.4 * k, x + 1.8 * k, y - 11.2 * k, RAFFIA, 0.6 * k);
  poly(ctx, [x - 1.2 * k, y - 11.4 * k, x - 0.2 * k, y - 11.2 * k, x - 0.8 * k, y - 9.6 * k], '#a8321e');
}

export const render: MechRender = {
  tile(ctx, s, t, cx, cy) {
    if (t.cityId === null) return;
    const c = s.cities.find((k) => k.id === t.cityId);
    if (!c || c.x !== t.x || c.y !== t.y || s.players[c.owner]?.tribe !== 'kongo' || !hasNkisi(c)) return;
    nkisi(ctx, cx - 25, cy + 9, 0.95);
  },
};

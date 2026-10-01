// Kush: a steep Meroitic pyramid on every pyramid tile. Narrow and sharp (far steeper than the Egyptian ones), built of
// red-brown sandstone in stepped courses with smooth dressed edges at the corners, a little blind window high on the
// face, and a small offering chapel with a pylon gateway at its foot.
import { ellipse, line, poly, shade, softShadow } from '../prims';
import type { Ctx } from '../prims';
import type { MechRender } from './types';

export const SANDSTONE = '#b8603a';
const SAND_L = '#d88a5a';
export const SAND_D = '#7a3a22';
const PLASTER = '#ead8b8';
const DOOR = '#2a160c';

/** A point on the ground plan: u runs to the lower right, v to the lower left, h is height. */
const P = (x: number, y: number, u: number, v: number, h = 0): [number, number] => [x + (u - v), y + (u + v) / 2 - h];

/** A small offering chapel with a pylon gate, its door facing the lower left, standing on (x, y). */
export function chapel(ctx: Ctx, x: number, y: number, k = 1, stone = SANDSTONE) {
  const lit = shade(stone, 0.12), dark = shade(stone, -0.22), top = shade(stone, 0.28);
  const q = (pts: [number, number, number][], c: string) => poly(ctx, pts.flatMap(([u, v, h]) => P(x, y, u * k, v * k, h * k)), c);
  // the chapel hall: a low box running back to the pyramid
  q([[-1.6, -3, 0], [-1.6, 1, 0], [-1.6, 1, 3.4], [-1.6, -3, 3.4]], lit);
  q([[-1.6, 1, 0], [1.6, 1, 0], [1.6, 1, 3.4], [-1.6, 1, 3.4]], lit);
  q([[1.6, 1, 0], [1.6, -3, 0], [1.6, -3, 3.4], [1.6, 1, 3.4]], dark);
  q([[-1.6, -3, 3.4], [1.6, -3, 3.4], [1.6, 1, 3.4], [-1.6, 1, 3.4]], top);
  // the pylon: two battered towers either side of a gate, its face turned to the lower left (the v+ side)
  const tower = (u0: number, u1: number) => {
    q([[u0, 1, 0], [u1, 1, 0], [u1 - 0.3, 1, 5.6], [u0 + 0.3, 1, 5.6]], lit); // the front, leaning in
    q([[u1, 1, 0], [u1, 0, 0], [u1 - 0.3, 0.2, 5.6], [u1 - 0.3, 1, 5.6]], dark); // the side
    q([[u0 + 0.3, 1, 5.6], [u1 - 0.3, 1, 5.6], [u1 - 0.3, 0.2, 5.6], [u0 + 0.3, 0.2, 5.6]], top);
    const a = P(x, y, (u0 + 0.3) * k, 1.02 * k, 5.4 * k), b = P(x, y, (u1 - 0.3) * k, 1.02 * k, 5.4 * k);
    line(ctx, a[0], a[1], b[0], b[1], PLASTER, 0.5 * k); // the cavetto cornice, plastered
  };
  tower(-2.6, -0.5);
  tower(0.5, 2.6);
  // the lintel over the gate and the dark doorway
  q([[-0.6, 1.05, 3.6], [0.6, 1.05, 3.6], [0.6, 1.05, 4.6], [-0.6, 1.05, 4.6]], shade(stone, 0.2));
  q([[-0.5, 1.05, 0], [0.5, 1.05, 0], [0.5, 1.05, 3.4], [-0.5, 1.05, 3.4]], DOOR);
  const d = P(x, y, 0, 1.05 * k, 4.1 * k);
  ellipse(ctx, d[0], d[1], 0.5 * k, 0.32 * k, '#e8b840'); // a winged sun disc over the door, reduced to a gold dot
}

/** A steep Meroitic pyramid standing on (x, y): base half-width `s`, height `H`. */
export function pyramid(ctx: Ctx, x: number, y: number, s = 6.5, H = 30, stone = SANDSTONE, withChapel = true) {
  softShadow(ctx, x + 3, y + 2, s * 2.6, s * 1.2, 0.3);
  const apex = P(x, y, 0, 0, H);
  const L = P(x, y, -s, s), F = P(x, y, s, s), R = P(x, y, s, -s);
  const lit = shade(stone, 0.1), dark = shade(stone, -0.26);
  // a low plinth of rubble round the foot
  poly(ctx, [...P(x, y, -s - 1, s + 1), ...P(x, y, s + 1, s + 1), ...P(x, y, s + 1, -s - 1), ...P(x, y, s + 1, -s - 1, 1), ...P(x, y, s + 1, s + 1, 1), ...P(x, y, -s - 1, s + 1, 1)], shade(stone, -0.3));
  poly(ctx, [...P(x, y, -s - 1, s + 1, 1), ...P(x, y, s + 1, s + 1, 1), ...P(x, y, s + 1, -s - 1, 1), ...P(x, y, -s - 1, -s - 1, 1)], shade(stone, -0.08));
  const lift = (p: [number, number]): [number, number] => [p[0], p[1] - 1];
  const l = lift(L), f = lift(F), r = lift(R);
  // the two visible faces
  poly(ctx, [...l, ...f, ...apex], lit);
  poly(ctx, [...f, ...r, ...apex], dark);
  // stepped courses: lines across each face, a lit lip on the step above each
  const at = (a: [number, number], t: number): [number, number] => [a[0] + (apex[0] - a[0]) * t, a[1] + (apex[1] - a[1]) * t];
  const n = 13;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const [a, b, c] = [at(l, t), at(f, t), at(r, t)];
    line(ctx, a[0], a[1], b[0], b[1], shade(lit, -0.14), 0.45);
    line(ctx, b[0], b[1], c[0], c[1], shade(dark, -0.16), 0.45);
    if (i % 2) { line(ctx, a[0] + 0.3, a[1] - 0.5, b[0], b[1] - 0.5, shade(lit, 0.12), 0.3); }
  }
  // a few loose blocks of colour so the stone reads as sandstone, not paint
  for (let i = 0; i < 9; i++) {
    const t = 0.1 + ((i * 37) % 70) / 100, w = ((i * 53) % 10) / 10;
    const a = at(l, t), b = at(f, t), px = a[0] + (b[0] - a[0]) * w, py = a[1] + (b[1] - a[1]) * w;
    poly(ctx, [px - 0.9, py + 0.2, px + 0.9, py + 1, px + 0.9, py + 0.3, px - 0.9, py - 0.5], i % 2 ? SAND_L : shade(stone, -0.06));
  }
  // dressed edges: a smooth band down each corner
  line(ctx, f[0], f[1], apex[0], apex[1], shade(stone, 0.3), 1.1);
  line(ctx, l[0] + 0.4, l[1], apex[0], apex[1] + 0.4, shade(stone, 0.2), 0.8);
  line(ctx, r[0] - 0.4, r[1], apex[0], apex[1] + 0.4, shade(dark, -0.12), 0.8);
  // the blind window high on the lit face, framed in plaster
  const wc = at(P(x, y, 0, s, 1), 0.66);
  poly(ctx, [wc[0] - 1.2, wc[1] - 0.2, wc[0] + 0.2, wc[1] + 0.5, wc[0] + 0.2, wc[1] - 2.6, wc[0] - 1.2, wc[1] - 3.3], PLASTER);
  poly(ctx, [wc[0] - 0.8, wc[1] - 0.4, wc[0] - 0.1, wc[1] - 0.05, wc[0] - 0.1, wc[1] - 2.4, wc[0] - 0.8, wc[1] - 2.8], DOOR);
  // the tip: a small capstone, a little paler
  const cap = at(f, 0.9), capL = at(l, 0.9), capR = at(r, 0.9);
  poly(ctx, [...capL, ...cap, ...apex], SAND_L);
  poly(ctx, [...cap, ...capR, ...apex], shade(SAND_L, -0.3));
  // the offering chapel at its foot, door to the lower left
  if (withChapel) chapel(ctx, ...P(x, y, 0, s + 4.4), 1.5, stone);
}

/** A pyramid tile: one big pyramid with a smaller queen's pyramid behind it. */
export function pyramidTile(ctx: Ctx, cx: number, cy: number) {
  pyramid(ctx, cx + 9, cy - 5, 3.6, 17, shade(SANDSTONE, -0.06), false);
  pyramid(ctx, cx - 1, cy + 1, 6.4, 31);
}

export const render: MechRender = {
  tile(ctx, _s, t, cx, cy) {
    if (t.improvement !== 'pyramid') return;
    pyramidTile(ctx, cx, cy + 2);
  },
};

// Arabia: a caravanserai on every caravanserai tile. A square walled courtyard inn of sun-baked brick: corner towers,
// a tall arched gate in a whitewashed portal, a dome over the hall in the back corner, a well and a date palm inside.
import { ellipse, line, mix, poly, shade, softShadow } from '../prims';
import type { Ctx } from '../prims';
import type { MechRender } from './types';

const BRICK = '#dcbc88';
const WASH = '#f3ecdc';
const GREEN = '#3f8f2a';
const DOOR = '#5a3a1e';

/** A point on the inn's ground plan: u runs to the lower right, v to the lower left, h is height. */
const P = (x: number, y: number, u: number, v: number, h = 0): [number, number] => [x + (u - v), y + (u + v) / 2 - h];

/** One straight wall from (u0,v0) to (u1,v1), `h` high, with a lit or shaded face and a coping on top. */
function wall(ctx: Ctx, x: number, y: number, u0: number, v0: number, u1: number, v1: number, h: number, face: string, top: string) {
  const a = P(x, y, u0, v0), b = P(x, y, u1, v1), c = P(x, y, u1, v1, h), d = P(x, y, u0, v0, h);
  poly(ctx, [...a, ...b, ...c, ...d], face);
  line(ctx, d[0], d[1], c[0], c[1], top, 1.3);
}

/** A little date palm: a curved ringed trunk, a crown of drooping fronds and two clusters of dates. */
export function palm(ctx: Ctx, x: number, y: number, k: number, lean = 1) {
  const tx = x + 3 * k * lean, ty = y - 17 * k;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#7a5634';
  ctx.lineWidth = 1.8 * k;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - 0.5 * k * lean, y - 10 * k, tx, ty);
  ctx.stroke();
  for (let i = 1; i < 7; i++) { // the rough rings of old frond bases
    const t = i / 7, px = x * (1 - t) * (1 - t) + 2 * t * (1 - t) * (x - 0.5 * k * lean) + t * t * tx, py = y * (1 - t) * (1 - t) + 2 * t * (1 - t) * (y - 10 * k) + t * t * ty;
    line(ctx, px - 1 * k, py + 0.3 * k, px + 1 * k, py - 0.3 * k, '#4f3720', 0.5 * k);
  }
  const frond = (a: number, len: number, c: string) => {
    const ex = tx + Math.cos(a) * len * k, ey = ty + Math.sin(a) * len * 0.6 * k + len * 0.35 * k;
    const mx = tx + Math.cos(a) * len * 0.55 * k, my = ty + Math.sin(a) * len * 0.5 * k - 1.6 * k;
    ctx.strokeStyle = c;
    ctx.lineWidth = 1.5 * k;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();
    for (let i = 1; i < 5; i++) { // leaflets along the rib
      const t = i / 5, px = tx * (1 - t) * (1 - t) + 2 * t * (1 - t) * mx + t * t * ex, py = ty * (1 - t) * (1 - t) + 2 * t * (1 - t) * my + t * t * ey;
      line(ctx, px, py, px + Math.cos(a + 1.3) * 1.6 * k, py + 1.5 * k, c, 0.6 * k);
      line(ctx, px, py, px + Math.cos(a - 1.3) * 1.6 * k, py + 1.5 * k, shade(c, -0.15), 0.6 * k);
    }
  };
  for (const [a, len, c] of [[Math.PI + 0.5, 7, '#2f6a22'], [-0.5, 7, '#2f6a22'], [Math.PI - 0.2, 8, '#3f8a2c'], [0.2, 8, '#3f8a2c'], [-Math.PI / 2 - 0.4, 6, '#4f9a34'], [-Math.PI / 2 + 0.5, 6, '#4f9a34'], [Math.PI / 2, 5, '#3a7a28']] as const) frond(a, len, c);
  ellipse(ctx, tx - 1.4 * k, ty + 1.6 * k, 1.3 * k, 1.7 * k, '#b0581c'); // dates
  ellipse(ctx, tx + 1.5 * k, ty + 1.4 * k, 1.2 * k, 1.6 * k, '#c86a22');
  ellipse(ctx, tx, ty, 1.2 * k, 1 * k, '#5a8a2a');
}

/** The caravanserai, standing on (x, y), about `s` world px from its centre to each corner. */
export function caravanserai(ctx: Ctx, x: number, y: number, s = 13) {
  const H = 6.5; // wall height
  const sb = shade(BRICK, 0.08), sd = shade(BRICK, -0.24), top = shade(BRICK, 0.3);
  softShadow(ctx, x + 2, y + 2, s * 2.2, s * 0.95, 0.28);
  // the courtyard floor, packed sand with a paved cross path
  poly(ctx, [...P(x, y, -s, -s), ...P(x, y, s, -s), ...P(x, y, s, s), ...P(x, y, -s, s)], shade(BRICK, -0.08));
  poly(ctx, [...P(x, y, -s, -s, 0), ...P(x, y, s, -s), ...P(x, y, s, s), ...P(x, y, -s, s)], mix(BRICK, '#c8a46a', 0.5));
  poly(ctx, [...P(x, y, -1.6, -s), ...P(x, y, 1.6, -s), ...P(x, y, 1.6, s), ...P(x, y, -1.6, s)], shade(BRICK, 0.12));
  poly(ctx, [...P(x, y, -s, -1.6), ...P(x, y, s, -1.6), ...P(x, y, s, 1.6), ...P(x, y, -s, 1.6)], shade(BRICK, 0.12));
  // the back walls, seen from inside: a row of arched cells for travellers along each
  wall(ctx, x, y, -s, -s, s, -s, H, sd, top);
  wall(ctx, x, y, -s, -s, -s, s, H, sb, top);
  for (let i = 0; i < 4; i++) {
    const u = -s + 3.4 + i * 5.6;
    const [ax, ay] = P(x, y, u, -s + 0.2, 0);
    if (Math.abs(u) > 2.5) { poly(ctx, [ax - 1.4, ay, ax + 0.6, ay + 1, ax + 0.6, ay - 3.6, ax - 0.4, ay - 4.6, ax - 1.4, ay - 4.4], '#6a4a2a'); }
    const [bx, by] = P(x, y, -s + 0.2, u, 0);
    if (Math.abs(u) > 2.5) { poly(ctx, [bx + 1.4, by, bx - 0.6, by + 1, bx - 0.6, by - 3.6, bx + 0.4, by - 4.6, bx + 1.4, by - 4.4], '#7a5634'); }
  }
  // the domed hall over the back corner
  const [hx, hy] = P(x, y, -s + 3, -s + 3, 0);
  poly(ctx, [hx - 7, hy - 3.5, hx, hy, hx, hy - 8, hx - 7, hy - 11.5], shade(WASH, 0.04));
  poly(ctx, [hx + 7, hy - 3.5, hx, hy, hx, hy - 8, hx + 7, hy - 11.5], shade(WASH, -0.16));
  poly(ctx, [hx - 7, hy - 11.5, hx, hy - 8, hx + 7, hy - 11.5, hx, hy - 15], WASH);
  for (const d of [-4.4, -2]) { // arched windows
    poly(ctx, [hx + d - 0.7, hy - 2.4 + d * 0.5 + 0.0, hx + d + 0.7, hy - 2.1 + d * 0.5 + 0.7, hx + d + 0.7, hy - 5.6 + d * 0.5, hx + d, hy - 6.6 + d * 0.5, hx + d - 0.7, hy - 6 + d * 0.5], '#6a4a2a');
    poly(ctx, [hx - d - 0.7, hy - 2.1 + d * 0.5 + 0.7, hx - d + 0.7, hy - 2.4 + d * 0.5, hx - d + 0.7, hy - 6 + d * 0.5, hx - d, hy - 6.6 + d * 0.5, hx - d - 0.7, hy - 5.6 + d * 0.5], '#4a3020');
  }
  line(ctx, hx - 7, hy - 9.8, hx, hy - 6.3, GREEN, 0.9); // a green tiled band round the hall
  line(ctx, hx, hy - 6.3, hx + 7, hy - 9.8, shade(GREEN, -0.3), 0.9);
  ellipse(ctx, hx, hy - 11.8, 4.8, 2.3, shade(WASH, -0.12)); // the drum
  ctx.beginPath();
  ctx.ellipse(hx, hy - 12.2, 4.6, 5.6, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = WASH;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(hx + 0.6, hy - 12.2, 3, 5.6, 0, Math.PI * 1.5, 0);
  ctx.lineTo(hx + 0.6, hy - 12.2);
  ctx.closePath();
  ctx.fillStyle = shade(WASH, -0.14);
  ctx.fill();
  ellipse(ctx, hx - 1.6, hy - 15, 1.2, 1.6, '#ffffff');
  line(ctx, hx, hy - 17.8, hx, hy - 20, '#b89a4a', 0.8);
  ellipse(ctx, hx, hy - 20.4, 0.8, 0.8, '#d8b84a');
  // the well in the courtyard, and a palm beside it
  const [wx, wy] = P(x, y, 2.6, -2.6, 0);
  ellipse(ctx, wx, wy, 2.8, 1.5, shade(BRICK, -0.3));
  ellipse(ctx, wx, wy - 1.4, 2.8, 1.5, shade(BRICK, 0.15));
  ellipse(ctx, wx, wy - 1.4, 1.8, 0.9, '#2a5a7a');
  line(ctx, wx - 2.4, wy - 1.4, wx - 2.4, wy - 5, DOOR, 0.6);
  line(ctx, wx + 2.4, wy - 1.4, wx + 2.4, wy - 5, DOOR, 0.6);
  line(ctx, wx - 2.8, wy - 5, wx + 2.8, wy - 5, DOOR, 0.8);
  const [px, py] = P(x, y, -2.6, 3.4, 0);
  palm(ctx, px, py, 0.82, 1);
  // a resting camel kneeling in the yard
  const [cx, cy] = P(x, y, 5.6, 3.4, 0);
  ellipse(ctx, cx, cy - 1.4, 3.6, 1.8, '#c89a5a');
  ellipse(ctx, cx - 0.4, cy - 3, 2, 1.6, '#d2a868');
  line(ctx, cx + 2.6, cy - 1.8, cx + 4.2, cy - 5, '#c89a5a', 1.2);
  ellipse(ctx, cx + 4.8, cy - 5.2, 1.3, 0.8, '#b8884a');
  // the front walls, seen from outside: brick with a whitewashed top course
  const front = (u0: number, v0: number, u1: number, v1: number, face: string) => {
    wall(ctx, x, y, u0, v0, u1, v1, H, face, top);
    const a = P(x, y, u0, v0, H - 1.4), b = P(x, y, u1, v1, H - 1.4), c = P(x, y, u1, v1, H), d = P(x, y, u0, v0, H);
    poly(ctx, [...a, ...b, ...c, ...d], WASH);
    for (let i = 1; i < 6; i++) { // crenellations
      const t = i / 6, m = P(x, y, u0 + (u1 - u0) * t, v0 + (v1 - v0) * t, H);
      poly(ctx, [m[0] - 0.9, m[1] + 0.4, m[0] + 0.9, m[1] - 0.4, m[0] + 0.9, m[1] - 2.2, m[0] - 0.9, m[1] - 1.4], WASH);
    }
    for (const t of [0.3, 0.7]) { // brick courses
      const a2 = P(x, y, u0, v0, H * t), b2 = P(x, y, u1, v1, H * t);
      line(ctx, a2[0], a2[1], b2[0], b2[1], shade(face, -0.12), 0.4);
    }
  };
  front(-s, s, s, s, sb);
  front(s, -s, s, s, sd);
  // the gatehouse portal in the middle of the left-front wall: a raised whitewashed block with a pointed arch
  const g0 = P(x, y, -4.2, s + 0.6, 0), g1 = P(x, y, 4.2, s + 0.6, 0);
  const GH = H + 6;
  poly(ctx, [...g0, ...g1, g1[0], g1[1] - GH, g0[0], g0[1] - GH], shade(WASH, 0.02));
  poly(ctx, [g1[0], g1[1] - GH, g0[0], g0[1] - GH, g0[0] + 1.4, g0[1] - GH - 0.8, g1[0] + 1.4, g1[1] - GH - 0.8], WASH);
  const gm = P(x, y, 0, s + 0.6, 0);
  line(ctx, g0[0] + 0.6, g0[1] - GH + 1.6, g1[0] - 0.6, g1[1] - GH + 1.6, GREEN, 1.1); // a green tile frieze
  for (let i = 0; i < 4; i++) { const t = (i + 0.5) / 4; ellipse(ctx, g0[0] + (g1[0] - g0[0]) * t, g0[1] - GH + 1.6 + (g1[1] - g0[1]) * t, 0.5, 0.5, '#f4e8a8'); }
  // the pointed arch: a dark opening, a green-painted door leaf half open and a brick voussoir
  const ax = gm[0], ay = gm[1];
  poly(ctx, [ax - 3, ay - 1.5, ax + 3, ay + 1.5, ax + 3, ay - 4.4, ax + 1.6, ay - 7.6, ax, ay - 9.8, ax - 1.6, ay - 9.2, ax - 3, ay - 7], shade(BRICK, -0.2));
  poly(ctx, [ax - 2.2, ay - 1.1, ax + 2.2, ay + 1.1, ax + 2.2, ay - 4.2, ax + 1.1, ay - 6.8, ax, ay - 8.6, ax - 1.2, ay - 8.2, ax - 2.2, ay - 6.4], '#2a1c12');
  poly(ctx, [ax - 2.2, ay - 1.1, ax - 0.4, ay - 0.2, ax - 0.4, ay - 7.6, ax - 1.2, ay - 8.2, ax - 2.2, ay - 6.4], GREEN);
  for (const v of [-2.4, -5]) ellipse(ctx, ax - 1.3, ay + v, 0.3, 0.3, '#e8c84a'); // studs
  // corner towers: round, banded, with a little green-capped top
  const tower = (u: number, v: number, lit: boolean) => {
    const [tx, ty] = P(x, y, u, v, 0);
    const c = lit ? sb : sd;
    poly(ctx, [tx - 2.6, ty, tx - 2.6, ty - H - 3, tx + 2.6, ty - H - 3, tx + 2.6, ty], c);
    poly(ctx, [tx, ty + 0.8, tx + 2.6, ty, tx + 2.6, ty - H - 3, tx, ty - H - 2.2], shade(c, -0.12));
    ellipse(ctx, tx, ty + 0.1, 2.6, 0.9, c);
    ellipse(ctx, tx, ty - H - 3, 2.9, 1.1, WASH);
    ellipse(ctx, tx, ty - H - 3.5, 2.1, 0.8, shade(WASH, -0.1));
    ctx.beginPath();
    ctx.ellipse(tx, ty - H - 3.5, 2.1, 2.6, 0, Math.PI, 0);
    ctx.fillStyle = lit ? GREEN : shade(GREEN, -0.2);
    ctx.fill();
    line(ctx, tx - 2.6, ty - H * 0.5, tx + 2.6, ty - H * 0.5, shade(c, -0.15), 0.5);
  };
  tower(s, -s, false);
  tower(-s, s, true);
  tower(s, s, true);
  // a green banner on the portal
  line(ctx, g1[0] - 1, g1[1] - GH - 0.4, g1[0] - 1, g1[1] - GH - 7, DOOR, 0.6);
  poly(ctx, [g1[0] - 1, g1[1] - GH - 7, g1[0] + 3.4, g1[1] - GH - 6, g1[0] - 1, g1[1] - GH - 4.6], '#5cb82a');
}

export const render: MechRender = {
  tile(ctx, _s, t, cx, cy) {
    if (t.improvement !== 'caravanserai') return;
    caravanserai(ctx, cx, cy + 3);
  },
};

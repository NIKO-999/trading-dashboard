// The Cree trading post on every `tradingpost` tile: a small cabin of squared spruce logs with a bark-slab roof and a
// stone chimney, a fur press beside it (two posts, a cross beam and a long lever bearing down on a box of pelts), bales
// of furs stacked by the door and beaver pelts stretched on round willow hoops, a birch-bark canoe drawn up on the
// shore, and a plain red flag on a pole.
import { ellipse, line, poly, shade, softShadow } from '../prims';
import type { Ctx } from '../prims';
import type { MechRender } from './types';

const LOG = '#8a6440', LOG_D = '#5a3e24', LOG_L = '#b08a60';
const BARK = '#c8b088';
const WOOD = '#7a5434', WOOD_D = '#4a3020', WOOD_L = '#a88058';
const FUR = '#5a3e2a', FUR_L = '#8a6646', PELT = '#7a5232';
const CORD = '#ece0c0';
const BIRCH = '#efe8d8', BIRCH_D = '#c4b8a0', GUM = '#2a1e16';
const RED = '#9a2a26';

type Pt2 = [number, number];
/** A point on the plan: u runs to the lower right, v to the lower left, z is height. */
const P = (x: number, y: number, u: number, v: number, z = 0): Pt2 => [x + (u - v), y + (u + v) / 2 - z];
function quad(ctx: Ctx, x: number, y: number, pts: [number, number, number][], c: string) {
  poly(ctx, pts.flatMap(([u, v, z]) => P(x, y, u, v, z)), c);
}
function smoke(ctx: Ctx, x: number, y: number) {
  for (let i = 0; i < 4; i++) ellipse(ctx, x - i * 0.9, y - i * 2.6, 1 + i * 0.5, 0.8 + i * 0.4, `rgba(222,224,228,${0.42 - i * 0.09})`);
}

/** A bale of pelts pressed square and bound with cord. */
function bale(ctx: Ctx, x: number, y: number, u: number, v: number, z: number, c: string) {
  const s = 2.2, h = 2.4;
  quad(ctx, x, y, [[u - s, v + s, z], [u + s, v + s, z], [u + s, v + s, z + h], [u - s, v + s, z + h]], shade(c, 0.04));
  quad(ctx, x, y, [[u + s, v - s, z], [u + s, v + s, z], [u + s, v + s, z + h], [u + s, v - s, z + h]], shade(c, -0.2));
  quad(ctx, x, y, [[u - s, v - s, z + h], [u + s, v - s, z + h], [u + s, v + s, z + h], [u - s, v + s, z + h]], shade(c, 0.18));
  // the fur's edges sticking out of the press, and the cords
  for (let i = 0; i < 3; i++) line(ctx, ...P(x, y, u - s + 0.4, v + s, z + 0.6 + i * 0.7), ...P(x, y, u + s - 0.4, v + s, z + 0.6 + i * 0.7), shade(c, -0.25), 0.3);
  line(ctx, ...P(x, y, u, v + s, z), ...P(x, y, u, v + s, z + h), CORD, 0.5);
  line(ctx, ...P(x, y, u, v + s, z + h), ...P(x, y, u, v - s, z + h), CORD, 0.5);
  line(ctx, ...P(x, y, u + s, v, z), ...P(x, y, u + s, v, z + h), CORD, 0.5);
}

/** A beaver pelt stretched on a round willow hoop, leaning on something. */
function hoop(ctx: Ctx, x: number, y: number, r: number) {
  ellipse(ctx, x, y, r * 0.78, r, '#c8a870');
  ellipse(ctx, x, y, r * 0.66, r * 0.88, PELT);
  ellipse(ctx, x - r * 0.15, y - r * 0.2, r * 0.32, r * 0.42, shade(PELT, 0.18));
  ctx.strokeStyle = '#c8a870';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.78, r, 0, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 10; i++) { // the lacing round the hoop
    const a = (i / 10) * Math.PI * 2;
    line(ctx, x + Math.cos(a) * r * 0.66, y + Math.sin(a) * r * 0.88, x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r, CORD, 0.25);
  }
}

/** The trading post standing on (x, y). */
export function tradingPost(ctx: Ctx, x: number, y: number) {
  softShadow(ctx, x + 1, y + 2, 24, 10, 0.26);
  // the trodden yard
  quad(ctx, x, y, [[-11, -9, 0], [9, -9, 0], [9, 9, 0], [-11, 9, 0]], 'rgba(150,120,80,0.35)');
  // ---- the cabin: u -10..2, v -9..-2, walls 6 high, a gable roof along u
  const U0 = -10, U1 = 2, V0 = -9, V1 = -2, VM = (V0 + V1) / 2, H = 6, R = 3.6;
  quad(ctx, x, y, [[U0 - 0.6, V0 - 0.8, H - 0.4], [U1 + 0.6, V0 - 0.8, H - 0.4], [U1 + 0.6, VM, H + R], [U0 - 0.6, VM, H + R]], shade(BARK, -0.3));
  const [hx, hy] = P(x, y, U0 + 2, VM - 1, H + R * 0.6); // the stone chimney behind the ridge
  poly(ctx, [hx - 1.4, hy + 2, hx + 1.4, hy + 2, hx + 1.2, hy - 4, hx - 1.2, hy - 4], '#8a8478');
  for (let i = 0; i < 3; i++) line(ctx, hx - 1.3, hy - i * 2, hx + 1.3, hy - i * 2 - 0.2, '#5a5650', 0.35);
  smoke(ctx, hx + 0.4, hy - 6);
  quad(ctx, x, y, [[U0, V1, 0], [U1, V1, 0], [U1, V1, H], [U0, V1, H]], LOG); // the long wall
  for (let z = 0.9; z < H; z += 1.1) line(ctx, ...P(x, y, U0, V1, z), ...P(x, y, U1, V1, z), LOG_D, 0.45);
  for (let z = 0.4; z < H; z += 1.1) line(ctx, ...P(x, y, U0 + 0.3, V1, z), ...P(x, y, U1 - 0.3, V1, z), LOG_L, 0.25);
  // the trade window with its shutter propped open
  quad(ctx, x, y, [[-6.4, V1, 2.4], [-3.6, V1, 2.4], [-3.6, V1, 4.6], [-6.4, V1, 4.6]], '#2a1e14');
  quad(ctx, x, y, [[-6.6, V1 + 0.2, 4.6], [-3.4, V1 + 0.2, 4.6], [-3.4, V1 + 2, 5.4], [-6.6, V1 + 2, 5.4]], WOOD_L);
  quad(ctx, x, y, [[-6.6, V1 + 0.2, 2.2], [-3.4, V1 + 0.2, 2.2], [-3.4, V1 + 1.2, 2.2], [-6.6, V1 + 1.2, 2.2]], WOOD); // the counter
  // the gable end with its plank door, the log ends at the corners
  quad(ctx, x, y, [[U1, V0, 0], [U1, V1, 0], [U1, V1, H], [U1, V0, H]], shade(LOG, -0.18));
  quad(ctx, x, y, [[U1, V0, H], [U1, V1, H], [U1, VM, H + R]], shade(LOG_L, -0.2));
  for (let z = 0.9; z < H; z += 1.1) line(ctx, ...P(x, y, U1, V0, z), ...P(x, y, U1, V1, z), LOG_D, 0.45);
  for (let z = 0.5; z < H; z += 1.1) for (const v of [V1]) { const [ex, ey] = P(x, y, U1 + 0.5, v + 0.5, z); ellipse(ctx, ex, ey, 0.6, 0.55, LOG_L); ellipse(ctx, ex, ey, 0.25, 0.25, LOG_D); }
  quad(ctx, x, y, [[U1, VM + 1.4, 0], [U1, VM - 1.4, 0], [U1, VM - 1.4, 4.8], [U1, VM + 1.4, 4.8]], WOOD_D);
  line(ctx, ...P(x, y, U1, VM, 0), ...P(x, y, U1, VM, 4.8), shade(WOOD_D, -0.3), 0.3);
  // a pair of snowshoes hung on the wall by the door
  for (const dv of [-3, -2]) { const [sx, sy] = P(x, y, U1 + 0.1, VM + dv, 3.6); ellipse(ctx, sx, sy, 0.7, 2, 'rgba(236,224,192,0.6)'); ctx.strokeStyle = '#d8c08a'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.ellipse(sx, sy, 0.7, 2, 0, 0, Math.PI * 2); ctx.stroke(); }
  // the near roof slope: slabs of bark held by poles
  quad(ctx, x, y, [[U0 - 0.6, V1 + 0.8, H - 0.4], [U1 + 0.6, V1 + 0.8, H - 0.4], [U1 + 0.6, VM, H + R], [U0 - 0.6, VM, H + R]], BARK);
  for (let i = 1; i < 8; i++) { const u = U0 - 0.6 + ((U1 - U0 + 1.2) * i) / 8; line(ctx, ...P(x, y, u, V1 + 0.8, H - 0.4), ...P(x, y, u, VM, H + R), shade(BARK, -0.2), 0.35); }
  line(ctx, ...P(x, y, U0 - 0.6, VM + 2, H + R * 0.55), ...P(x, y, U1 + 0.6, VM + 2, H + R * 0.55), WOOD_D, 0.6);
  line(ctx, ...P(x, y, U0 - 0.6, VM, H + R), ...P(x, y, U1 + 0.6, VM, H + R), WOOD_D, 0.8);
  // ---- the flag on its pole behind the cabin's far corner
  const [fx, fy] = P(x, y, U1 + 1, V0 - 1, 0);
  line(ctx, fx, fy, fx, fy - 24, WOOD_D, 0.8);
  poly(ctx, [fx, fy - 24, fx + 7.6, fy - 23.4, fx + 7, fy - 21.6, fx + 7.6, fy - 19.6, fx, fy - 19.4], RED);
  poly(ctx, [fx, fy - 24, fx + 7.6, fy - 23.4, fx + 7.4, fy - 22.6, fx, fy - 23], shade(RED, 0.16));
  ellipse(ctx, fx, fy - 24.4, 0.6, 0.6, WOOD_L);
  // ---- the fur press, beside the cabin on the near side: a box of pelts under a long lever
  const pu = 5.6, pv = -6;
  quad(ctx, x, y, [[pu - 2, pv + 2, 0], [pu + 2, pv + 2, 0], [pu + 2, pv + 2, 2.6], [pu - 2, pv + 2, 2.6]], WOOD);
  quad(ctx, x, y, [[pu + 2, pv - 2, 0], [pu + 2, pv + 2, 0], [pu + 2, pv + 2, 2.6], [pu + 2, pv - 2, 2.6]], shade(WOOD, -0.2));
  quad(ctx, x, y, [[pu - 2, pv - 2, 2.6], [pu + 2, pv - 2, 2.6], [pu + 2, pv + 2, 2.6], [pu - 2, pv + 2, 2.6]], FUR); // the pelts in the box
  for (let i = 0; i < 4; i++) line(ctx, ...P(x, y, pu - 2, pv + 2, 0.6 + i * 0.5), ...P(x, y, pu + 2, pv + 2, 0.6 + i * 0.5), WOOD_D, 0.25);
  const post = (u: number, v: number) => { const [a, b] = P(x, y, u, v, 0), [, d] = P(x, y, u, v, 8); line(ctx, a, b, a, d, WOOD_D, 1.3); line(ctx, a - 0.35, b, a - 0.35, d, WOOD_L, 0.4); };
  post(pu, pv - 2.6);
  // the press block on the pelts, the lever over it from the post's slot down to a weight of stones
  quad(ctx, x, y, [[pu - 1.6, pv - 1.6, 3.4], [pu + 1.6, pv - 1.6, 3.4], [pu + 1.6, pv + 1.6, 3.4], [pu - 1.6, pv + 1.6, 3.4]], WOOD_L);
  const l0 = P(x, y, pu, pv - 2.6, 6.4), l1 = P(x, y, pu + 1, pv + 8, 2.6);
  line(ctx, l0[0], l0[1], l1[0], l1[1], LOG_D, 1.4);
  line(ctx, l0[0], l0[1] - 0.4, l1[0], l1[1] - 0.4, LOG_L, 0.45);
  const [mx, my] = P(x, y, pu, pv, 3.4);
  line(ctx, mx, my, mx + 0.8, my - 2.6, WOOD_D, 0.8); // the strut from block to lever
  for (const [dx, dy] of [[-0.8, 1.4], [0.8, 1.6], [0, 0.6]] as const) ellipse(ctx, l1[0] + dx, l1[1] + dy + 1.2, 1, 0.8, '#8a8680'); // the weight
  line(ctx, l1[0], l1[1], l1[0], l1[1] + 1.6, CORD, 0.4);
  post(pu, pv + 2.6);
  // ---- bales and stretched pelts by the cabin wall
  bale(ctx, x, y, -7, 0.6, 0, FUR);
  bale(ctx, x, y, -2.6, 0.6, 0, FUR_L);
  bale(ctx, x, y, -4.8, 0.6, 2.4, shade(FUR, 0.1));
  for (const [u, r] of [[-11, 2.2], [-9.6, 1.9]] as const) { const [px, py] = P(x, y, u, -1, 2.2); hoop(ctx, px, py, r); }
  // ---- a birch-bark canoe drawn up on the shore at the front right, its high ends curving up
  const c0 = P(x, y, 10, -0.5, 0), c1 = P(x, y, 10, 9.5, 0);
  const at = (t: number, lift: number, side = 0): Pt2 => [c0[0] + (c1[0] - c0[0]) * t - side, c0[1] + (c1[1] - c0[1]) * t - lift - side * 0.5];
  const N = 16, e = (t: number) => Math.pow(Math.abs(t * 2 - 1), 4);
  const wide = (t: number) => Math.sin(Math.PI * t) * 1.6;
  const gun: Pt2[] = [], farG: Pt2[] = [], keel: Pt2[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    gun.push(at(t, 2.2 + e(t) * 3.4, -wide(t)));
    farG.push(at(t, 2.2 + e(t) * 3.4, wide(t)));
    keel.push(at(t, 0.2 + e(t) * 1.6, -wide(t) * 0.5));
  }
  poly(ctx, [...farG.flat(), ...[...gun].reverse().flat()], '#c8a070'); // the ribs inside
  for (let i = 2; i < N - 1; i += 2) line(ctx, ...farG[i], ...gun[i], '#a87a4a', 0.35);
  for (const i of [5, 11]) line(ctx, ...farG[i], ...gun[i], WOOD_L, 0.7); // thwarts
  poly(ctx, [...gun.flat(), ...[...keel].reverse().flat()], BIRCH);
  poly(ctx, [...keel.slice(2, N - 1).flat(), ...[...keel].slice(2, N - 1).reverse().map(([a, b]): Pt2 => [a, b - 1]).flat()], BIRCH_D);
  for (let i = 2; i < N - 1; i += 2) { const [a, b] = gun[i]; line(ctx, a - 0.5, b + 1.2 + (i % 4) * 0.2, a + 0.5, b + 1.2 + (i % 4) * 0.2, '#4a3a2a', 0.3); } // lenticels
  for (const i of [5, 8, 11]) line(ctx, ...gun[i], keel[i][0], keel[i][1], GUM, 0.45); // gummed seams
  for (const i of [0, N]) line(ctx, ...gun[i], ...keel[i], GUM, 0.6);
  ctx.strokeStyle = WOOD;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  gun.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)));
  ctx.stroke();
  // a paddle lying beside it
  const [pa, pb] = P(x, y, 7, 7, 0.2);
  line(ctx, pa - 3.6, pb - 1.4, pa + 2, pb + 1, WOOD_L, 0.6);
  ellipse(ctx, pa + 2.8, pb + 1.4, 1.7, 0.7, WOOD);
}

export const render: MechRender = {
  tile(ctx, _s, t, cx, cy) {
    if (t.improvement !== 'tradingpost') return;
    tradingPost(ctx, cx, cy + 2);
  },
};

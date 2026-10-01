// Nepal: a rope bridge slung across a bridged mountain tile. Two stone-footed timber posts stand on the near slopes,
// left and right; between them a deck of wooden planks hangs on sagging rope cables, with two hand ropes above it
// tied down to the deck by little vertical cords. From each post top a string of prayer flags (lung ta) in the five
// colours (blue, white, red, green, yellow) swings across above the bridge and flutters in the wind.
import { ellipse, ink, line, poly, rand, shade, softShadow } from '../prims';
import type { Ctx } from '../prims';
import { hasBridge } from '../../game/mech/nepal';
import type { MechRender } from './types';

const ROPE = '#a8865a', ROPE_D = '#6a5034';
const PLANK = '#8a6040', PLANK_L = '#b08458', PLANK_D = '#5a3c24';
const POST = '#5a3c24', POST_L = '#7a5434';
const STONE = '#9a948a', STONE_D = '#6a655e';
const FLAGS = ['#2d6cdf', '#f4f1ea', '#d8302a', '#2aa84a', '#f2c81e'];

/** A point on a quadratic sag from a to b, dropping `sag` px at the middle. */
const sagAt = (ax: number, ay: number, bx: number, by: number, sag: number, t: number): [number, number] =>
  [ax + (bx - ax) * t, ay + (by - ay) * t + sag * 4 * t * (1 - t)];

function cable(ctx: Ctx, ax: number, ay: number, bx: number, by: number, sag: number, c: string, w: number) {
  ctx.strokeStyle = ink(c);
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + sag * 2, bx, by);
  ctx.stroke();
}

/** A timber post on a cairn of stones, `h` px tall; returns its top. */
function post(ctx: Ctx, x: number, y: number, h: number, k: number): [number, number] {
  softShadow(ctx, x + 1 * k, y + 0.6 * k, 4 * k, 1.6 * k, 0.3);
  for (const [dx, dy, r] of [[-1.8, 0.4, 1.7], [1.6, 0.6, 1.5], [0, -0.6, 1.6], [-0.6, 1.2, 1.3]] as const) {
    ellipse(ctx, x + dx * k, y + dy * k, r * k, r * 0.7 * k, STONE_D);
    ellipse(ctx, x + dx * k - 0.3 * k, y + dy * k - 0.3 * k, r * 0.7 * k, r * 0.45 * k, STONE);
  }
  poly(ctx, [x - 1.1 * k, y, x + 1.1 * k, y, x + 0.9 * k, y - h, x - 0.9 * k, y - h], POST_L);
  poly(ctx, [x + 0.1 * k, y, x + 1.1 * k, y, x + 0.9 * k, y - h, x + 0.1 * k, y - h], POST);
  ellipse(ctx, x, y - h, 1 * k, 0.5 * k, shade(POST_L, 0.2));
  for (const v of [0.3, 0.62]) line(ctx, x - 1.1 * k, y - h * v, x + 1.1 * k, y - h * v + 0.3 * k, ROPE_D, 0.6 * k); // rope lashings
  return [x, y - h];
}

/** A string of prayer flags from a to b, sagging, small squares of the five colours fluttering below the cord. */
function prayerFlags(ctx: Ctx, ax: number, ay: number, bx: number, by: number, sag: number, k: number, seed: number) {
  cable(ctx, ax, ay, bx, by, sag, '#e8dcc0', 0.35 * k);
  const n = Math.max(5, Math.round(Math.hypot(bx - ax, by - ay) / (2.6 * k)));
  for (let i = 1; i < n; i++) {
    const t = i / n, [px, py] = sagAt(ax, ay, bx, by, sag, t);
    const c = FLAGS[i % 5], fl = (rand(seed, i) - 0.5) * 0.8 * k, w = 1.9 * k, h = 2.2 * k;
    poly(ctx, [px - w / 2, py, px + w / 2, py + 0.1 * k, px + w / 2 + fl, py + h, px - w / 2 + fl, py + h - 0.2 * k], c);
    line(ctx, px - w / 2 + fl, py + h - 0.2 * k, px + w / 2 + fl, py + h, shade(c, -0.25), 0.25 * k);
  }
}

/**
 * The rope bridge, from the left anchor (lx, ly) to the right one (rx, ry): planks hung on two sagging deck cables,
 * hand ropes above with cords down to the deck, prayer flags strung over it from the post tops.
 */
export function ropeBridge(ctx: Ctx, lx: number, ly: number, rx: number, ry: number, k = 1, seed = 0) {
  const sag = 5 * k, postH = 9 * k, half = 1.4 * k; // deck half-width (seen in depth)
  // the far posts, behind the deck
  const [flx, fly] = post(ctx, lx + 1.6 * k, ly - 1.4 * k, postH, k);
  const [frx, fry] = post(ctx, rx + 1.6 * k, ry - 1.4 * k, postH, k);
  // the far hand rope and its cords
  cable(ctx, flx, fly + 1.6 * k, frx, fry + 1.6 * k, sag, ROPE_D, 0.6 * k);
  // the deck: planks laid across two cables, the far one first
  cable(ctx, lx + half, ly - half * 0.6, rx + half, ry - half * 0.6, sag, ROPE_D, 0.7 * k);
  const n = Math.max(8, Math.round(Math.hypot(rx - lx, ry - ly) / (1.7 * k)));
  for (let i = 0; i <= n; i++) {
    const t = i / n, [px, py] = sagAt(lx, ly, rx, ry, sag, t);
    const missing = rand(seed, i) < 0.08 && i > 1 && i < n - 1; // a gap or two where a plank has fallen
    if (missing) continue;
    const c = i % 3 === 0 ? PLANK_L : i % 3 === 1 ? PLANK : shade(PLANK, -0.08);
    poly(ctx, [px - 0.6 * k, py + 0.5 * k, px + 0.6 * k, py + 0.4 * k, px + 0.6 * k + half, py + 0.4 * k - half * 0.6, px - 0.6 * k + half, py + 0.5 * k - half * 0.6], c);
    line(ctx, px - 0.6 * k, py + 0.6 * k, px + 0.6 * k, py + 0.5 * k, PLANK_D, 0.4 * k);
  }
  cable(ctx, lx, ly + 0.4 * k, rx, ry + 0.4 * k, sag, ROPE_D, 0.8 * k); // the near deck cable
  cable(ctx, lx, ly, rx, ry, sag, ROPE, 0.4 * k);
  // the near hand rope, with the vertical cords that tie it to the deck
  const [nlx, nly] = [lx - 0.8 * k, ly + 0.8 * k], [nrx, nry] = [rx - 0.8 * k, ry + 0.8 * k];
  for (let i = 1; i < 8; i++) {
    const t = i / 8, [dx, dy] = sagAt(lx, ly, rx, ry, sag, t), [hx, hy] = sagAt(nlx, nly - postH + 1.6 * k, nrx, nry - postH + 1.6 * k, sag * 0.8, t);
    line(ctx, dx, dy + 0.2 * k, hx, hy, ROPE_D, 0.3 * k);
    const [fx, fy] = sagAt(lx + half, ly - half * 0.6, rx + half, ry - half * 0.6, sag, t), [gx, gy] = sagAt(flx, fly + 1.6 * k, frx, fry + 1.6 * k, sag, t);
    line(ctx, fx, fy, gx, gy, shade(ROPE_D, -0.1), 0.25 * k);
  }
  // the near posts and the hand rope
  const [plx, ply] = post(ctx, nlx, nly + 1 * k, postH, k);
  const [prx, pry] = post(ctx, nrx, nry + 1 * k, postH, k);
  cable(ctx, plx, ply + 1.6 * k, prx, pry + 1.6 * k, sag * 0.8, ROPE_D, 0.8 * k);
  cable(ctx, plx, ply + 1.4 * k, prx, pry + 1.4 * k, sag * 0.8, ROPE, 0.35 * k);
  // the prayer flags: from the near post tops, high over the bridge, and down to the slopes behind
  prayerFlags(ctx, plx, ply - 0.4 * k, frx, fry - 0.4 * k, sag * 1.2, k, seed + 1);
  prayerFlags(ctx, flx, fly - 0.2 * k, prx, pry - 0.2 * k, sag * 1.6, k * 0.85, seed + 2);
  // little white khata scarves knotted on the post tops
  for (const [x, y] of [[plx, ply], [prx, pry]] as const) poly(ctx, [x - 0.4 * k, y + 0.6 * k, x + 0.6 * k, y + 0.4 * k, x + 1.6 * k, y + 3.2 * k, x + 0.8 * k, y + 3.4 * k], '#f4efe0');
}

export const render: MechRender = {
  tile(ctx, _s, t, cx, cy) {
    if (!hasBridge(t)) return;
    ropeBridge(ctx, cx - 22, cy + 1, cx + 21, cy - 2, 1, t.seed);
  },
};

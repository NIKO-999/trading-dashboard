// The Kingdom of Kongo's own art (see render/tribeart): the lower Congo river, fourteenth to seventeenth century.
// A kingdom of cloth: everyone wears wraps of woven raffia, natural tan with geometric interlace in brown, black and
// camwood red (tukula), fringed at the hem; men carry netted nkutu bags on a shoulder strap. Nobles wear the mpu, a
// knitted raffia cap worked in interlace, and capes of parrot feathers (the grey parrot's red tail feathers prized
// above all); warriors bind feathers in their hair. The king, the Mani Kongo, wears a leopard skin, a tall mpu set
// round with leopard claws, and carries the mbele a lulendo, the broad sword of state with its openwork guard.
// Soldiers fight behind the mbeba, a tall rectangular shield of woven cane and raffia; spears, bows and broad
// leaf-bladed iron swords. Horses were rare: the riders are few and modest, the knight a noble on a horse under a
// leopard-skin cloth. The siege engine is a lashed timber stone-thrower; the boats are great dugout river canoes
// driven by standing paddlers. Towns of rectangular houses with steep gabled thatch and walls of patterned palm
// mats, set in fenced compounds; the capital, Mbanza Kongo, is the royal enclosure behind high woven fences round a
// great audience hall, under the court's great tree. Forests are oil palms, raffia palms and buttressed kapok trees.
import type { BiomePalette } from '../../data/tribes';
import type { UnitKind } from '../../game/types';
import { registerArt, type Body } from '../tribeart';
import { band, box, ellipse, faceQuad, ink, line, mix, poly, rand, shade, softShadow } from '../prims';
import type { Ctx } from '../prims';
import { drawHorse, figure } from '../units';

// ---------------------------------------------------------------- colours

const SKIN = '#5e3a22';
const RAFFIA = '#d8b878'; // natural raffia cloth
const RAFFIA_L = '#e8d0a0';
const RAFFIA_D = '#a8844a';
const BROWN = '#6a4224';
const BLACK = '#2a1a10';
const RED = '#a8321e'; // camwood red
const RED_D = '#6e1e12';
const WHITE = '#f0e8d4'; // white clay
const LEOP = '#d8a650';
const SPOT = '#3a2210';
const IRON = '#6e7278';
const STEEL = '#b0b6bc';
const COPPER = '#c87a42';
const WOOD = '#7a5434';
const WOOD_D = '#4a3020';
const GREY = '#8e969c'; // grey parrot
const PARROT = '#d02a1e'; // its red tail
const CANE = '#c8a868';
const THATCH = '#a87a42';
const MAT = '#e8d4a0';

// ---------------------------------------------------------------- helpers

/** A point on one visible side of a box, in faceQuad's (u, v) coordinates. */
function fpt(face: 'L' | 'R', cx: number, cy: number, w: number, h: number, u: number, v: number): [number, number] {
  return face === 'R' ? [cx + (u * w) / 2, cy + (w / 4) * (1 - u) - v * h] : [cx - w / 2 + (u * w) / 2, cy + (w / 4) * u - v * h];
}
/** A polygon on one side of a box, given in (u, v). */
function fpoly(ctx: Ctx, face: 'L' | 'R', cx: number, cy: number, w: number, h: number, pts: [number, number][], color: string) {
  poly(ctx, pts.flatMap(([u, v]) => fpt(face, cx, cy, w, h, u, v)), face === 'L' ? shade(color, 0.06) : shade(color, -0.2));
}
/** A curved stroke through three points. */
function curve(ctx: Ctx, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, w: number, c: string) {
  ctx.strokeStyle = ink(c);
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx, cy, x1, y1);
  ctx.stroke();
}
/** A point on a quadratic curve. */
const qpt = (x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, t: number): [number, number] => {
  const u = 1 - t;
  return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1];
};
/** An elliptical outline. */
function ring(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string, w: number) {
  ctx.strokeStyle = ink(color);
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
  ctx.stroke();
}

/** A quadrilateral [TL, TR, BR, BL] and a point in it at (s across, t down), by bilinear interpolation. */
type Quad = [[number, number], [number, number], [number, number], [number, number]];
function qp(q: Quad, s: number, t: number): [number, number] {
  const ax = q[0][0] + (q[1][0] - q[0][0]) * s, ay = q[0][1] + (q[1][1] - q[0][1]) * s;
  const bx = q[3][0] + (q[2][0] - q[3][0]) * s, by = q[3][1] + (q[2][1] - q[3][1]) * s;
  return [ax + (bx - ax) * t, ay + (by - ay) * t];
}
function qpoly(ctx: Ctx, q: Quad, pts: [number, number][], c: string) { poly(ctx, pts.flatMap(([s, t]) => qp(q, s, t)), c); }
function qline(ctx: Ctx, q: Quad, s0: number, t0: number, s1: number, t1: number, c: string, w: number) {
  const a = qp(q, s0, t0), b = qp(q, s1, t1);
  line(ctx, a[0], a[1], b[0], b[1], c, w);
}

/**
 * Kongo interlace on a quad: a lattice of diamonds in two colours, each outlined by the dark woven bands that cross
 * it, a small diamond at each heart. `cols` x `rows` cells; `ink2` the outline, `a` and `b` the fills.
 */
function interlace(ctx: Ctx, q: Quad, cols: number, rows: number, a: string, b: string, ink2: string, lw: number, heart = true) {
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const s = (i + 0.5) / cols, t = (j + 0.5) / rows, ds = 0.5 / cols, dt = 0.5 / rows;
    qpoly(ctx, q, [[s - ds, t], [s, t - dt], [s + ds, t], [s, t + dt]], (i + j) % 2 ? a : b);
    if (heart) qpoly(ctx, q, [[s - ds * 0.34, t], [s, t - dt * 0.34], [s + ds * 0.34, t], [s, t + dt * 0.34]], (i + j) % 2 ? b : a);
  }
  // the crossing bands: diagonals running both ways across the whole field
  for (let i = -rows; i <= cols; i++) {
    const s0 = i / cols, s1 = (i + rows) / cols;
    const clip = (sa: number, ta: number, sb: number, tb: number) => { // trim a segment from (sa, ta) to (sb, tb) to the unit square
      let t0 = 0, t1 = 1;
      const ds = sb - sa;
      if (ds !== 0) { const u0 = (0 - sa) / ds, u1 = (1 - sa) / ds; t0 = Math.max(t0, Math.min(u0, u1)); t1 = Math.min(t1, Math.max(u0, u1)); }
      if (t1 <= t0) return;
      qline(ctx, q, sa + ds * t0, ta + (tb - ta) * t0, sa + ds * t1, ta + (tb - ta) * t1, ink2, lw);
    };
    clip(s0, 0, s1, 1);
    clip(s1, 0, s0, 1);
  }
}

/** A plain flat quad of four corners. */
const quadOf = (x: number, y: number, w: number, h: number, skew: number): Quad => [[x - w / 2, y - h / 2], [x + w / 2, y - h / 2 + skew], [x + w / 2, y + h / 2 + skew], [x - w / 2, y + h / 2]];

/** A feather from (x0, y0) to its tip: a vane widest past the middle round a pale quill, the tip in another colour (the
 *  grey parrot's red tail). */
function feather(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, k: number, c = GREY, tip: string | null = PARROT) {
  const mx = (x0 + x1) / 2 + (y1 - y0) * 0.08, my = (y0 + y1) / 2;
  const n = 8, L: number[] = [], Rr: number[] = [], wmax = 1.5 * k;
  const edge = (t0: number, t1: number, col: string) => {
    L.length = 0; Rr.length = 0;
    for (let i = 0; i <= n; i++) {
      const t = t0 + ((t1 - t0) * i) / n, [px, py] = qpt(x0, y0, mx, my, x1, y1, t), [qx, qy] = qpt(x0, y0, mx, my, x1, y1, Math.min(1, t + 0.02));
      const dx = qx - px, dy = qy - py, d = Math.hypot(dx, dy) || 1, wv = wmax * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (t < 0.12 ? t / 0.12 : 1);
      L.push(px - (dy / d) * wv, py + (dx / d) * wv);
      Rr.unshift(px + (dy / d) * wv * 0.8, py - (dx / d) * wv * 0.8);
    }
    const pts = [...L];
    for (let i = 0; i < Rr.length; i += 2) pts.push(Rr[i], Rr[i + 1]);
    poly(ctx, pts, col);
  };
  edge(0, 1, c);
  if (tip) edge(0.6, 1, tip);
  curve(ctx, x0, y0, mx, my, x1, y1, 0.3 * k, shade(c, 0.35)); // the quill
  for (const t of [0.35, 0.5]) { const [px, py] = qpt(x0, y0, mx, my, x1, y1, t); line(ctx, px, py, px - 0.9 * k, py + 0.6 * k, shade(c, -0.25), 0.25 * k); }
}

// ---------------------------------------------------------------- dress

/** [torso, legs, sleeves]: bare skin over raffia wraps; woven tunics for the heavier ranks, gold-tan for the king. */
function dress(kind: UnitKind): [string, string, string] {
  switch (kind) {
    case 'defender': return [RAFFIA_D, SKIN, SKIN];
    case 'swordsman': return [RAFFIA, SKIN, SKIN];
    case 'knight': return [RED, SKIN, SKIN];
    case 'giant': return [RAFFIA_L, SKIN, SKIN];
    case 'explorer': return [RAFFIA, SKIN, SKIN];
    default: return [SKIN, SKIN, SKIN];
  }
}

/** A raffia wrap round the hips: tan cloth, a band of interlace near the hem, a fringe of loose fibres below. */
function wrap(ctx: Ctx, x: number, hip: number, k: number, len: number, cloth: string, pat: string, rich: boolean) {
  const w = 10.8 * k, cy = hip + len * k, h = (len + 0.1) * k;
  faceQuad(ctx, 'L', x, cy, w, h, 0, 1, 0, 1, cloth);
  faceQuad(ctx, 'R', x, cy, w, h, 0, 1, 0, 1, cloth);
  // the woven texture: fine vertical lines
  for (const u of [0.12, 0.28, 0.44, 0.6, 0.76, 0.92]) for (const f of ['L', 'R'] as const) faceQuad(ctx, f, x, cy, w, h, u, u + 0.02, 0.06, 1, shade(cloth, -0.1));
  // a band of chevrons: little triangles in alternating colours, over a dark ground line
  band(ctx, x, cy, w, h, 0.18, 0.44, shade(cloth, -0.06));
  for (const f of ['L', 'R'] as const) for (let i = 0; i < 5; i++) {
    const u = 0.02 + i * 0.2;
    fpoly(ctx, f, x, cy, w, h, [[u, 0.2], [u + 0.18, 0.2], [u + 0.09, 0.42]], i % 2 ? pat : BLACK);
    if (rich) fpoly(ctx, f, x, cy, w, h, [[u + 0.09, 0.42], [u + 0.18, 0.2], [u + 0.2, 0.42]], RED);
  }
  band(ctx, x, cy, w, h, 0.16, 0.2, BLACK);
  band(ctx, x, cy, w, h, 0.44, 0.48, BLACK);
  // the fringe
  for (const f of ['L', 'R'] as const) for (let i = 0; i < 9; i++) {
    const [px, py] = fpt(f, x, cy, w, h, 0.04 + i * 0.115, 0);
    line(ctx, px, py, px + (f === 'L' ? -0.2 : 0.2) * k, py + 1.4 * k, i % 2 ? shade(cloth, 0.12) : shade(cloth, -0.08), 0.5 * k);
  }
}

/** A netted nkutu bag on a strap from the right shoulder, hanging at the left hip. */
function nkutu(ctx: Ctx, x: number, y: number, w: number, h: number, k: number, c = RAFFIA_D) {
  fpoly(ctx, 'R', x, y, w, h, [[0, 0.86], [0.1, 0.96], [0.96, 0.18], [0.86, 0.1]], shade(c, -0.25));
  const [bx, by] = fpt('L', x, y, w, h, 0.32, 0.02);
  poly(ctx, [bx - 2 * k, by - 2 * k, bx + 2 * k, by - 1.6 * k, bx + 2.4 * k, by + 1.6 * k, bx, by + 3.4 * k, bx - 2.4 * k, by + 1.4 * k], c);
  for (let i = 0; i < 3; i++) { // the netting: little crossing loops
    line(ctx, bx - 2 * k + i * 1.4 * k, by - 1.8 * k, bx - 1 * k + i * 1.4 * k, by + 2.6 * k, shade(c, -0.35), 0.35 * k);
    line(ctx, bx + 2 * k - i * 1.4 * k, by - 1.6 * k, bx + 1 * k - i * 1.4 * k, by + 2.6 * k, shade(c, -0.35), 0.35 * k);
  }
  line(ctx, bx - 2 * k, by - 2 * k, bx + 2 * k, by - 1.6 * k, BLACK, 0.6 * k);
  for (const dx of [-1.2, 0.2, 1.4]) line(ctx, bx + dx * k, by + 2.6 * k, bx + dx * k, by + 4 * k, c, 0.4 * k); // tassels
}

/** A cape of feathers over the shoulders: rows of scalloped grey and red feathers, the lowest row reaching the waist. */
function featherCape(ctx: Ctx, x: number, y: number, w: number, h: number, k: number, red: string = PARROT) {
  const rows: [number, string][] = [[0.38, GREY], [0.58, red], [0.76, WHITE], [0.92, GREY]];
  for (const [v, c] of rows) for (const f of ['L', 'R'] as const) {
    const n = 6;
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n;
      if (f === 'R' && u > 0.3 && u < 0.75 && v < 0.7) continue; // the chest shows between the cape's sides
      const [px, py] = fpt(f, x, y, w, h, u, v);
      ellipse(ctx, px, py, 0.95 * k, 1.3 * k, f === 'L' ? shade(c, 0.04) : shade(c, -0.18));
      line(ctx, px, py - 1 * k, px, py + 0.9 * k, shade(c, -0.3), 0.25 * k);
    }
  }
  band(ctx, x, y, w, h, 0.94, 1.02, RED_D);
}

/** A leopard skin over the back and one shoulder, rosettes and a paw hanging at the hem. */
function leopard(ctx: Ctx, x: number, y: number, w: number, h: number, k: number) {
  fpoly(ctx, 'L', x, y, w, h, [[0, 1.02], [0.8, 1.02], [0.94, 0.3], [0.74, -0.25], [0.2, -0.3], [0, 0]], LEOP);
  fpoly(ctx, 'R', x, y, w, h, [[0, 1.02], [0.36, 1.02], [0.2, 0.4], [0, 0.3]], LEOP);
  for (let i = 0; i < 9; i++) {
    const u = 0.12 + (i % 3) * 0.26 + (Math.floor(i / 3) % 2) * 0.08, v = 0.84 - Math.floor(i / 3) * 0.4;
    const [px, py] = fpt('L', x, y, w, h, u, v);
    for (let j = 0; j < 4; j++) { const a = j * 1.57 + 0.4; ellipse(ctx, px + Math.cos(a) * 0.55 * k, py + Math.sin(a) * 0.45 * k, 0.24 * k, 0.24 * k, SPOT); } // a rosette of spots
    ellipse(ctx, px, py, 0.26 * k, 0.26 * k, shade(LEOP, -0.18));
  }
  for (const [u, v] of [[0.08, 0.84], [0.16, 0.56]] as const) { const [px, py] = fpt('R', x, y, w, h, u, v); ellipse(ctx, px, py, 0.4 * k, 0.4 * k, SPOT); }
  const [pa, pb] = fpt('L', x, y, w, h, 0.5, -0.3);
  ellipse(ctx, pa, pb + 0.4 * k, 1 * k, 0.6 * k, shade(LEOP, -0.12));
  for (let i = -1; i <= 1; i++) line(ctx, pa + i * 0.4 * k, pb + 0.8 * k, pa + i * 0.5 * k, pb + 1.4 * k, WHITE, 0.3 * k);
}

function torso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const k = w / 10;
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const B = (v0: number, v1: number, c: string) => band(ctx, x, y, w, h, v0, v1, c);
  switch (kind) {
    case 'warrior': case 'ngao': // a raffia wrap with a red-and-black band, a red belt, a cord of beads on the bare chest
      wrap(ctx, x, y, k, 3.2, RAFFIA, RED, kind === 'ngao');
      B(0.03, 0.14, RED);
      B(0.03, 0.06, BLACK);
      R(0.2, 0.26, 0.42, 0.62, shade(SKIN, -0.18));
      for (let i = 0; i < 5; i++) { const [px, py] = fpt('R', x, y, w, h, 0.12 + i * 0.18, 0.86 - Math.abs(i - 2) * 0.05); ellipse(ctx, px, py, 0.35 * k, 0.35 * k, i % 2 ? WHITE : RED); }
      return;
    case 'archer': // a wrap, a belt and the netted bag
      wrap(ctx, x, y, k, 3, RAFFIA, BROWN, false);
      B(0.03, 0.14, BROWN);
      nkutu(ctx, x, y, w, h, k);
      return;
    case 'defender': { // a woven tunic of heavy raffia in a big diamond weave, over a fringed wrap
      wrap(ctx, x, y, k, 3, RAFFIA, RED, false);
      for (const f of ['L', 'R'] as const) {
        const q: Quad = [fpt(f, x, y, w, h, 0, 0.94), fpt(f, x, y, w, h, 1, 0.94), fpt(f, x, y, w, h, 1, 0.2), fpt(f, x, y, w, h, 0, 0.2)];
        interlace(ctx, q, 3, 2, f === 'L' ? RAFFIA_D : shade(RAFFIA_D, -0.2), f === 'L' ? BROWN : shade(BROWN, -0.2), BLACK, 0.35 * k, false);
      }
      B(0.03, 0.18, RED);
      B(0.9, 1, shade(RAFFIA_D, -0.2));
      return;
    }
    case 'swordsman': { // a raffia tunic worked with interlace, a broad red sash, a short shoulder cape of feathers
      wrap(ctx, x, y, k, 3.2, RAFFIA, BROWN, true);
      for (const f of ['L', 'R'] as const) {
        const q: Quad = [fpt(f, x, y, w, h, 0, 0.7), fpt(f, x, y, w, h, 1, 0.7), fpt(f, x, y, w, h, 1, 0.24), fpt(f, x, y, w, h, 0, 0.24)];
        interlace(ctx, q, 4, 1, f === 'L' ? RAFFIA : shade(RAFFIA, -0.18), f === 'L' ? RED : shade(RED, -0.2), BLACK, 0.3 * k);
      }
      B(0.03, 0.18, RED);
      fpoly(ctx, 'R', x, y, w, h, [[0, 0.9], [0.14, 0.98], [0.96, 0.22], [0.82, 0.16]], RED_D);
      featherCape(ctx, x, y, w, h * 0.6 + 0.4 * h, k);
      return;
    }
    case 'knight': // a red cloth tunic under a cape of feathers: a nobleman
      wrap(ctx, x, y, k, 2.4, RAFFIA, RED, true);
      B(0.03, 0.14, BLACK);
      featherCape(ctx, x, y, w, h, k);
      return;
    case 'giant': { // the Mani Kongo: a long fine wrap, a cape of feathers, a leopard skin and a sash of red cloth
      wrap(ctx, x, y, k, 4.8, RAFFIA_L, RED, true);
      for (const f of ['L', 'R'] as const) {
        const q: Quad = [fpt(f, x, y, w, h, 0, 0.5), fpt(f, x, y, w, h, 1, 0.5), fpt(f, x, y, w, h, 1, 0.16), fpt(f, x, y, w, h, 0, 0.16)];
        interlace(ctx, q, 4, 1, f === 'L' ? RAFFIA_L : shade(RAFFIA_L, -0.18), f === 'L' ? RED : shade(RED, -0.2), BLACK, 0.3 * k);
      }
      featherCape(ctx, x, y, w, h, k);
      leopard(ctx, x, y, w, h, k);
      B(0.02, 0.14, RED);
      for (let i = 0; i < 4; i++) { const [px, py] = fpt('R', x, y, w, h, 0.2 + i * 0.2, 0.08); ellipse(ctx, px, py, 0.45 * k, 0.45 * k, COPPER); } // copper on the sash
      return;
    }
    case 'rider':
      wrap(ctx, x, y, k, 2.4, RAFFIA, BROWN, false);
      B(0.03, 0.14, RED);
      return;
    case 'explorer': // a wrap to the shoulder and the bag
      wrap(ctx, x, y, k, 3.4, RAFFIA, BROWN, false);
      B(0.03, 0.14, BROWN);
      nkutu(ctx, x, y, w, h, k, CANE);
      return;
    default:
      wrap(ctx, x, y, k, 3, RAFFIA, RED, false);
      B(0.03, 0.14, RED);
  }
}

/** Faces: clean-shaven, a little white clay at the brow for the fighters; the king with a short beard. */
function face(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  if (kind === 'giant') { R(0.3, 0.7, 0, 0.14, '#140c08'); R(0.38, 0.62, 0.16, 0.2, '#3a2010'); return; }
  if (kind === 'warrior' || kind === 'ngao' || kind === 'defender') for (const u of [0.3, 0.5, 0.7]) R(u, u + 0.08, 0.66, 0.72, WHITE); // dots of white clay
  R(0.38, 0.62, 0.16, 0.2, '#3a2010');
}

// ---------------------------------------------------------------- headgear

/** The mpu: a knitted raffia cap, a short cylinder, worked in rows of knots with an interlace band; `tall` for chiefs. */
function mpu(ctx: Ctx, x: number, top: number, k: number, hw: number, tall: number, c = RAFFIA, claws = false) {
  const r = hw * 0.5 + 0.2 * k, bot = top + 2.6 * k, h = tall * k, ry = r * 0.42;
  const body = (rr: number, col: string) => {
    ctx.beginPath();
    ctx.moveTo(x - rr, bot - h);
    ctx.lineTo(x - rr, bot);
    ctx.ellipse(x, bot, rr, ry, 0, Math.PI, 0, true);
    ctx.lineTo(x + rr, bot - h);
    ctx.closePath();
    ctx.fillStyle = ink(col);
    ctx.fill();
  };
  body(r, c);
  // the shaded right side
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + r * 0.25, bot - h - ry, r, h + ry * 2.2);
  ctx.clip();
  body(r, shade(c, -0.22));
  ctx.restore();
  // rows of knots: little dark dots in a staggered grid round the front
  const rows = Math.max(2, Math.round(tall / 1.6));
  for (let j = 0; j < rows; j++) for (let i = 0; i < 6; i++) {
    const a = Math.PI * (0.12 + i * 0.15 + (j % 2) * 0.075), px = x - Math.cos(a) * r * 0.92, py = bot - (j + 0.5) * (h / rows) + Math.sin(a) * ry;
    ellipse(ctx, px, py, 0.32 * k, 0.28 * k, shade(c, -0.35));
  }
  // an interlace band round the middle: a zigzag in black over red
  const bv = bot - h * 0.5;
  ctx.strokeStyle = ink(RED); ctx.lineWidth = 1.1 * k; ctx.beginPath();
  ctx.ellipse(x, bv, r, ry, 0, 0, Math.PI); ctx.stroke();
  ctx.strokeStyle = ink(BLACK); ctx.lineWidth = 0.35 * k; ctx.beginPath();
  for (let i = 0; i <= 10; i++) { const a = Math.PI * (i / 10), px = x + Math.cos(a) * r, py = bv + Math.sin(a) * ry + (i % 2 ? -0.5 : 0.5) * k; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
  ctx.stroke();
  // the crown, flat on top
  ellipse(ctx, x, bot - h, r, ry, shade(c, 0.14));
  ring(ctx, x, bot - h, r * 0.6, ry * 0.6, shade(c, -0.12), 0.35 * k);
  if (claws) { // leopard claws set upright all round the crown
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (1.08 + i * 0.14), px = x + Math.cos(a) * r * 0.96, py = bot - h + Math.sin(a) * ry * 0.96 + 0.2 * k;
      const back = i === 0 || i === 6;
      curve(ctx, px, py, px + 0.2 * k, py - 1.6 * k, px + 1 * k, py - 2.6 * k, 0.9 * k, back ? '#c8bca0' : WHITE);
      line(ctx, px - 0.3 * k, py + 0.2 * k, px + 0.3 * k, py + 0.2 * k, BLACK, 0.5 * k);
    }
    for (let i = 0; i < 6; i++) { const a = Math.PI * (0.1 + i * 0.16); ellipse(ctx, x - Math.cos(a) * r, bot - Math.sin(a) * -ry - 0.4 * k, 0.4 * k, 0.4 * k, COPPER); } // copper beads at the brim
  }
}

/** A band at the brow with feathers standing up from it, fanned: the warrior's headdress. */
function featherCrown(ctx: Ctx, x: number, top: number, k: number, hw: number, n: number, len: number, band_: string) {
  const hh = 10.5 * k, cy = top + hh;
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1), a = -Math.PI / 2 + (t - 0.5) * 1.3;
    const bx = x - hw * 0.5 + t * hw, by = top + 2.6 * k + Math.abs(t - 0.5) * 1.2 * k;
    const tip = i % 2 ? PARROT : WHITE;
    feather(ctx, bx, by, bx + Math.cos(a) * len * k - 1 * k, by + Math.sin(a) * len * k, k * 0.9, i % 3 === 1 ? WHITE : GREY, tip);
  }
  band(ctx, x, cy, hw + 0.3 * k, hh, 0.74, 0.86, band_);
  for (let i = 0; i < 4; i++) { const [px, py] = fpt('R', x, cy, hw + 0.3 * k, hh, 0.15 + i * 0.24, 0.8); ellipse(ctx, px, py, 0.32 * k, 0.32 * k, i % 2 ? WHITE : BLACK); }
}

/** A single feather tucked into the hair, a cord round the brow. */
function hairFeather(ctx: Ctx, x: number, top: number, k: number, hw: number, c = PARROT) {
  const hh = 10.5 * k, cy = top + hh;
  band(ctx, x, cy, hw + 0.3 * k, hh, 0.76, 0.82, RED);
  feather(ctx, x - hw * 0.36, top + 2.4 * k, x - hw * 0.1 - 2.4 * k, top - 10.6 * k, k * 1.1, c === PARROT ? GREY : c, PARROT);
}

function head(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  switch (kind) {
    case 'ngao': hairFeather(ctx, x, top, k, hw); break;
    case 'warrior': featherCrown(ctx, x, top, k, hw, 3, 7, RED); break;
    case 'archer': featherCrown(ctx, x, top, k, hw, 2, 6, BROWN); break;
    case 'defender': featherCrown(ctx, x, top, k, hw, 5, 8, RED); break;
    case 'swordsman': mpu(ctx, x, top, k, hw, 3.6, RAFFIA_D); feather(ctx, x - hw * 0.4, top - 0.4 * k, x - hw * 0.6, top - 7 * k, k * 0.8); break;
    case 'knight': mpu(ctx, x, top, k, hw, 4.2, RAFFIA); feather(ctx, x - hw * 0.3, top - 1 * k, x - hw * 0.3, top - 9 * k, k * 0.9); feather(ctx, x - hw * 0.5, top - 0.6 * k, x - hw * 0.9 - 1.4 * k, top - 7.6 * k, k * 0.8, WHITE); break;
    case 'giant': mpu(ctx, x, top, k, hw, 7.4, RAFFIA_L, true); break;
    case 'rider': hairFeather(ctx, x, top, k, hw, WHITE); break;
    case 'explorer': mpu(ctx, x, top, k, hw, 2.2, CANE); break;
    default: hairFeather(ctx, x, top, k, hw);
  }
}

// ---------------------------------------------------------------- weapons and shields

/** A spear: a wooden shaft with a long leaf-shaped iron head, a tuft of raffia bound below it. */
function spear(ctx: Ctx, x: number, y: number, k: number, len = 28, head_ = IRON) {
  const x0 = x - 1.8 * k, y0 = y + 6 * k, x1 = x + 3 * k, y1 = y - (len - 6) * k;
  line(ctx, x0, y0, x1, y1, WOOD, 1.3 * k);
  line(ctx, x0 - 0.4 * k, y0, x1 - 0.4 * k, y1, '#a8784a', 0.4 * k);
  poly(ctx, [x1 + 0.2 * k, y1 - 7.4 * k, x1 - 1.5 * k, y1 - 3 * k, x1 - 0.2 * k, y1 + 0.6 * k], shade(head_, 0.3));
  poly(ctx, [x1 + 0.2 * k, y1 - 7.4 * k, x1 + 1.5 * k, y1 - 2.6 * k, x1 - 0.2 * k, y1 + 0.6 * k], shade(head_, -0.2));
  line(ctx, x1 + 0.1 * k, y1 - 6.6 * k, x1 - 0.1 * k, y1, shade(head_, -0.4), 0.3 * k);
  for (let i = -1; i <= 1; i++) line(ctx, x1 - 0.1 * k, y1 + 1 * k, x1 + i * 0.7 * k - 0.6 * k, y1 + 3.8 * k, i ? RAFFIA : RAFFIA_D, 0.5 * k);
  line(ctx, x1 - 0.7 * k, y1 + 1.2 * k, x1 + 0.5 * k, y1 + 0.8 * k, RED, 0.9 * k);
}

/** A plain bow of springy wood with a cane-shafted arrow on the string. */
function bow(ctx: Ctx, x: number, y: number, k: number) {
  const gx = x + 1 * k, gy = y - 1 * k;
  const top = { x: gx - 2 * k, y: gy - 13 * k }, bot = { x: gx - 2 * k, y: gy + 11 * k };
  for (const [c, wd] of [[WOOD_D, 1.9], ['#9a6a3a', 1.1]] as const) {
    curve(ctx, gx, gy, gx + 3.4 * k, gy - 7 * k, top.x, top.y, wd * k, c);
    curve(ctx, gx, gy, gx + 3.4 * k, gy + 6 * k, bot.x, bot.y, wd * k, c);
  }
  const nock = { x: gx - 5.6 * k, y: gy - 0.4 * k };
  ctx.strokeStyle = ink('#e8dcc0');
  ctx.lineWidth = 0.4 * k;
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(nock.x, nock.y);
  ctx.lineTo(bot.x, bot.y);
  ctx.stroke();
  line(ctx, gx + 0.2 * k, gy - 1.6 * k, gx + 0.2 * k, gy + 1.2 * k, RED, 1.6 * k); // the grip, bound in red cloth
  const tx = gx + 8 * k, ty = gy - 1.6 * k;
  line(ctx, nock.x, nock.y, tx, ty, CANE, 0.7 * k);
  poly(ctx, [tx, ty - 0.9 * k, tx + 2.6 * k, ty + 0.1 * k, tx, ty + 0.9 * k], IRON);
  poly(ctx, [nock.x, nock.y, nock.x + 2.4 * k, nock.y - 1.3 * k, nock.x + 2.8 * k, nock.y - 0.2 * k], GREY);
}

/** A broad iron sword: a wide leaf-shaped blade widest near the tip, a midrib, copper wire on the grip, a round pommel. */
function broadSword(ctx: Ctx, x: number, y: number, k: number, size = 1) {
  const s = k * size;
  const tx = x + 3.4 * s, ty = y - 13 * s;
  poly(ctx, [x - 0.7 * s, y - 2 * s, x - 1.6 * s, y - 7 * s, tx - 2.2 * s, ty + 2 * s, tx, ty, x + 0.4 * s, y - 2 * s], shade(STEEL, 0.12));
  poly(ctx, [x + 0.4 * s, y - 2 * s, tx, ty, tx + 1.6 * s, ty + 3.4 * s, x + 2.2 * s, y - 6 * s, x + 1.2 * s, y - 2 * s], shade(STEEL, -0.22));
  line(ctx, x + 0.3 * s, y - 2.4 * s, tx - 0.2 * s, ty + 1 * s, shade(STEEL, -0.4), 0.35 * s); // the midrib
  line(ctx, x - 1.6 * s, y - 1.8 * s, x + 2.4 * s, y - 2.4 * s, IRON, 0.9 * s);
  line(ctx, x + 0.2 * s, y - 1.8 * s, x - 0.4 * s, y + 1.6 * s, BLACK, 1.5 * s);
  for (const t of [0.2, 0.5, 0.8]) line(ctx, x + 0.2 * s - 0.6 * s * t - 0.7 * s, y - 1.8 * s + 3.4 * s * t, x + 0.2 * s - 0.6 * s * t + 0.7 * s, y - 1.8 * s + 3.4 * s * t - 0.2 * s, COPPER, 0.35 * s);
  ellipse(ctx, x - 0.5 * s, y + 2.1 * s, 1 * s, 0.8 * s, COPPER);
}

/** The mbele a lulendo, the sword of state: a broad blade over an openwork guard of two curling arms, a copper pommel. */
function stateSword(ctx: Ctx, x: number, y: number, k: number) {
  broadSword(ctx, x, y, k, 1.3);
  const gx = x + 0.3 * k, gy = y - 2.6 * k;
  curve(ctx, gx, gy, gx - 3.4 * k, gy - 0.4 * k, gx - 3 * k, gy - 3 * k, 0.7 * k, COPPER);
  curve(ctx, gx, gy, gx + 3.6 * k, gy - 1.4 * k, gx + 3.2 * k, gy - 4 * k, 0.7 * k, COPPER);
  ellipse(ctx, gx - 3 * k, gy - 3.2 * k, 0.6 * k, 0.6 * k, COPPER);
  ellipse(ctx, gx + 3.2 * k, gy - 4.2 * k, 0.6 * k, 0.6 * k, COPPER);
}

/** A walking staff with a calabash tied to it. */
function staff(ctx: Ctx, x: number, y: number, k: number) {
  line(ctx, x - 1 * k, y + 7 * k, x + 2.2 * k, y - 15 * k, WOOD, 1.1 * k);
  ellipse(ctx, x + 2.6 * k, y - 10 * k, 1.6 * k, 2 * k, '#c89a50');
  ellipse(ctx, x + 2.6 * k, y - 12.2 * k, 0.6 * k, 0.6 * k, shade('#c89a50', -0.3));
  line(ctx, x + 1.4 * k, y - 12 * k, x + 2.6 * k, y - 12.4 * k, BLACK, 0.4 * k);
}

/**
 * The mbeba: a tall rectangular shield of cane and raffia, woven, its face worked in an interlace of diamonds; a frame
 * of thicker cane round the rim, lashed at intervals; seen turned a little to the lower left.
 */
function mbeba(ctx: Ctx, cx: number, cy: number, w: number, h: number, k: number, style: 'ngao' | 'plain' | 'royal' | 'small') {
  const skew = w * 0.22;
  const q = quadOf(cx, cy, w, h, skew);
  const back = quadOf(cx + 0.9 * k, cy + 0.5 * k, w, h, skew);
  qpoly(ctx, back, [[0, 0], [1, 0], [1, 1], [0, 1]], WOOD_D); // its thickness
  qpoly(ctx, q, [[0, 0], [1, 0], [1, 1], [0, 1]], CANE);
  // the woven texture: fine horizontal courses
  for (let i = 1; i < 14; i++) qline(ctx, q, 0.04, i / 14, 0.96, i / 14, shade(CANE, -0.1), 0.25 * k);
  const inner: Quad = [qp(q, 0.1, 0.06), qp(q, 0.9, 0.06), qp(q, 0.9, 0.94), qp(q, 0.1, 0.94)];
  if (style === 'ngao') { // big red-and-black diamonds in a dark lattice, between sawtooth borders
    const mid: Quad = [qp(inner, 0, 0.12), qp(inner, 1, 0.12), qp(inner, 1, 0.88), qp(inner, 0, 0.88)];
    interlace(ctx, mid, 2, 4, RED, RAFFIA_L, BLACK, 0.55 * k);
    for (const [t0, t1] of [[0, 0.1], [0.9, 1]] as const) for (let i = 0; i < 5; i++) qpoly(ctx, inner, [[i / 5, t1], [(i + 1) / 5, t1], [(i + 0.5) / 5, t0]], BLACK);
  }
  else if (style === 'royal') interlace(ctx, inner, 2, 4, LEOP, RED, BLACK, 0.45 * k);
  else if (style === 'small') interlace(ctx, inner, 2, 3, BROWN, CANE, BLACK, 0.35 * k, false);
  else { // the defender's: bold black stripes with a red diamond in the middle
    for (const s of [0.2, 0.5, 0.8]) qpoly(ctx, inner, [[s - 0.08, 0], [s + 0.08, 0], [s + 0.08, 1], [s - 0.08, 1]], BROWN);
    qpoly(ctx, inner, [[0.1, 0.5], [0.5, 0.3], [0.9, 0.5], [0.5, 0.7]], RED);
    qpoly(ctx, inner, [[0.32, 0.5], [0.5, 0.42], [0.68, 0.5], [0.5, 0.58]], BLACK);
  }
  // the frame of thick cane, lashed
  const edge = (s0: number, t0: number, s1: number, t1: number) => qline(ctx, q, s0, t0, s1, t1, shade(CANE, -0.3), 0.9 * k);
  edge(0, 0, 1, 0); edge(1, 0, 1, 1); edge(1, 1, 0, 1); edge(0, 1, 0, 0);
  for (const t of [0.2, 0.5, 0.8]) for (const s of [0, 1]) { const [px, py] = qp(q, s, t); line(ctx, px - 0.6 * k, py - 0.5 * k, px + 0.6 * k, py + 0.5 * k, BLACK, 0.6 * k); }
  if (style === 'ngao' || style === 'royal') { // a tuft of feathers bound at the top corner
    const [fx, fy] = qp(q, 0.05, 0);
    feather(ctx, fx, fy, fx - 3 * k, fy - 4.6 * k, k * 0.7, GREY, PARROT);
  }
}

function weapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  switch (kind) {
    case 'ngao': // a long spear and the great mbeba
      spear(ctx, x, y, k, 30);
      mbeba(ctx, b.off.x - 1.6 * k, b.off.y - 5 * k, 9 * k, 19 * k, k, 'ngao');
      return true;
    case 'warrior':
      spear(ctx, x, y, k, 26);
      mbeba(ctx, b.off.x - 1 * k, b.off.y - 4 * k, 5.6 * k, 11.6 * k, k, 'small');
      return true;
    case 'archer':
      bow(ctx, x, y, k);
      return true;
    case 'defender': // the shield is drawn afterwards, like everyone's
      spear(ctx, x, y, k, 30);
      return true;
    case 'swordsman':
      broadSword(ctx, x, y, k);
      mbeba(ctx, b.off.x - 1 * k, b.off.y - 4 * k, 5 * k, 10.4 * k, k, 'small');
      return true;
    case 'giant':
      stateSword(ctx, x, y, k);
      return true;
    case 'explorer':
      staff(ctx, x, y, k);
      return true;
  }
  return false;
}

function shield(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number): boolean {
  if (kind === 'defender') { mbeba(ctx, x - 1.2 * k, y - 4.8 * k, 7.4 * k, 16 * k, k, 'plain'); return true; }
  if (kind === 'giant') { mbeba(ctx, x - 1.2 * k, y - 4.8 * k, 6.4 * k, 14 * k, k, 'royal'); return true; }
  mbeba(ctx, x - 1 * k, y - 4 * k, 5.4 * k, 11 * k, k, 'small');
  return true;
}

// ---------------------------------------------------------------- horsemen

/** A modest horseman: a small horse under a raffia cloth, its rider with a spear and a small shield. The knight is a
 *  nobleman in a feather cape and mpu, his horse under a leopard-skin cloth, his broad sword raised. */
function horseman(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  const noble = kind === 'knight';
  const saddle = drawHorse(ctx, x - 1, y + 3, noble ? 0.95 : 0.86, noble ? '#5a3a26' : '#8a6040', '#1a120c', noble ? LEOP : RAFFIA, noble ? LEOP : RAFFIA);
  const sx = saddle.x, sy = saddle.y;
  if (noble) { // the leopard skin over the horse's back, its paws hanging down and spotted all over
    poly(ctx, [sx - 6.4, sy - 0.8, sx + 4, sy - 0.8, sx + 3.6, sy + 6.4, sx + 1.4, sy + 8, sx - 1.6, sy + 6.2, sx - 5.8, sy + 7.6], LEOP);
    poly(ctx, [sx - 6.4, sy - 0.8, sx + 4, sy - 0.8, sx + 3.8, sy + 1, sx - 6.2, sy + 1], shade(LEOP, -0.14));
    for (const [dx, dy] of [[-4.6, 2.4], [-2, 4.2], [0.8, 2.2], [2.6, 5], [-3.6, 5.6], [-0.6, 6.4], [2.4, 0.8]] as const) { ring(ctx, sx + dx, sy + dy, 0.7, 0.55, SPOT, 0.4); ellipse(ctx, sx + dx, sy + dy, 0.2, 0.2, shade(LEOP, -0.25)); }
    ellipse(ctx, sx + 1.4, sy + 8.4, 0.9, 0.6, shade(LEOP, -0.1)); // a paw
    for (let i = -1; i <= 1; i++) line(ctx, sx + 1.4 + i * 0.4, sy + 8.8, sx + 1.4 + i * 0.5, sy + 9.4, WHITE, 0.3);
    line(ctx, sx - 6.2, sy - 0.6, sx + 3.8, sy - 0.6, RED, 0.8);
  } else { // a plain raffia cloth with a red-and-black edge
    poly(ctx, [sx - 5.4, sy - 0.8, sx + 3.4, sy - 0.8, sx + 3, sy + 5.4, sx - 5, sy + 5.8], RAFFIA);
    line(ctx, sx - 5, sy + 5.4, sx + 3, sy + 5, RED, 0.9);
    for (let i = 0; i < 5; i++) poly(ctx, [sx - 4.6 + i * 1.6, sy + 4.6, sx - 3.8 + i * 1.6, sy + 3.2, sx - 3 + i * 1.6, sy + 4.6], BLACK);
    for (let i = 0; i < 6; i++) line(ctx, sx - 4.8 + i * 1.5, sy + 5.8, sx - 4.8 + i * 1.5, sy + 7, RAFFIA_D, 0.5);
  }
  // a brow band of red cloth with a feather on the horse's head
  const hhx = x - 1 + 10.5 * 0.9, hhy = y + 3 - 15 * 0.9;
  feather(ctx, hhx + 0.4, hhy - 4, hhx - 1.6, hhy - 9.4, 0.7, noble ? WHITE : GREY, PARROT);
  const b = figure(ctx, kind, 'kongo', sx, sy, 0.9, true);
  if (noble) { broadSword(ctx, b.hand.x, b.hand.y, 0.9, 1.1); return; }
  mbeba(ctx, b.off.x - 1.2, b.off.y + 1.4, 3.8, 8, 0.62, 'small');
  spear(ctx, b.hand.x, b.hand.y, 0.95, 28);
}

// ---------------------------------------------------------------- the stone-thrower

/** A lashed timber stone-thrower: an A-frame of poles bound with raffia cord, a long throwing beam with a sling and a
 *  stone, pulling ropes at the short end, a heap of river stones and a crewman hauling. */
function stoneThrower(ctx: Ctx, x: number, y: number) {
  // the log skids on the ground
  for (const dy of [-1.6, 4]) { line(ctx, x - 13, y + dy, x + 10, y + dy - 4, WOOD_D, 2.6); line(ctx, x - 13, y + dy - 0.6, x + 10, y + dy - 4.6, WOOD, 1.2); }
  // the far trestle
  const px = x - 1, py = y - 17;
  line(ctx, x - 6, y - 3, px + 1, py, WOOD_D, 2);
  line(ctx, x + 5, y - 5.4, px + 1, py, WOOD_D, 2);
  // the beam: long arm up to the right with the sling, short arm down to the left with the ropes
  const lx = px + 15, ly = py - 9, sx = px - 7, sy = py + 5;
  line(ctx, sx, sy, lx, ly, WOOD_D, 2.6);
  line(ctx, sx, sy - 0.6, lx, ly - 0.6, '#a07448', 1.2);
  for (const t of [0.2, 0.48, 0.75]) { const bx = sx + (lx - sx) * t, by = sy + (ly - sy) * t; line(ctx, bx - 0.6, by - 1.4, bx + 0.6, by + 1.4, RAFFIA, 1); } // lashings of raffia cord
  // the sling hanging from the tip, a stone in its pouch
  line(ctx, lx, ly, lx + 2, ly + 7, RAFFIA_D, 0.5);
  line(ctx, lx, ly, lx + 4.4, ly + 5.6, RAFFIA_D, 0.5);
  ellipse(ctx, lx + 3.2, ly + 7.2, 2.2, 1.6, RAFFIA_D);
  ellipse(ctx, lx + 3, ly + 6.4, 1.5, 1.3, '#8a8478');
  // the near trestle, over the beam
  line(ctx, x - 3, y + 1.6, px - 0.6, py + 0.4, WOOD, 2.2);
  line(ctx, x + 7, y - 1, px - 0.6, py + 0.4, WOOD, 2.2);
  line(ctx, x - 1.6, y - 6, x + 4.4, y - 7.4, WOOD, 1.4); // a cross-tie
  for (const [bx, by] of [[px, py], [x - 1.6, y - 6], [x + 4.4, y - 7.4]] as const) ellipse(ctx, bx, by, 1.3, 1.1, RAFFIA);
  // the pulling ropes and a red streamer of cloth on the beam
  for (const d of [0, 1.6]) line(ctx, sx, sy, sx - 5 + d, y + 2, RAFFIA_D, 0.5);
  poly(ctx, [lx - 4, ly + 2, lx - 1, ly + 7, lx - 3.2, ly + 6], RED);
  // the heap of stones
  for (const [dx, dy, r] of [[9, 4, 1.8], [12, 3, 1.5], [10.6, 1.8, 1.4], [13.6, 5, 1.3]] as const) { ellipse(ctx, x + dx, y + dy, r, r * 0.8, '#7a7468'); ellipse(ctx, x + dx - 0.4, y + dy - 0.4, r * 0.5, r * 0.36, '#a09a8c'); }
  // a crewman hauling on the ropes
  const b = figure(ctx, 'warrior', 'kongo', x - 13, y + 5, 0.52);
  line(ctx, b.hand.x, b.hand.y, sx, sy, RAFFIA_D, 0.5);
}

// ---------------------------------------------------------------- dugout canoes

/** A dugout hull: one great log hollowed out, long and narrow, the ends drawn up into low blunt points; the bow (to the
 *  right) carved with a small figurehead post. Returns the gunwale height along it. */
function dugout(ctx: Ctx, x: number, y: number, len: number, color: string, crewBehind?: () => void, war = false) {
  const half = len / 2;
  const sheer = (t: number) => y - 3 - Math.pow(Math.abs(t), 4) * 3.2;
  // the hollow inside, seen over the far gunwale
  poly(ctx, [x - half * 0.9, sheer(-0.9) - 1.4, x + half * 0.9, sheer(0.9) - 1.4, x + half * 0.88, sheer(0.88) + 0.4, x - half * 0.88, sheer(-0.88) + 0.4], shade(color, -0.35));
  crewBehind?.();
  const top: number[] = [];
  for (let i = 0; i <= 20; i++) { const t = -1 + i * 0.1; top.push(x + t * half, sheer(t)); }
  const bottom: number[] = [];
  for (let i = 20; i >= 0; i--) { const t = -1 + i * 0.1, tt = Math.abs(t); bottom.push(x + t * half * 0.94, y + 2 - tt * tt * 3.6); }
  poly(ctx, [...top, ...bottom], color);
  poly(ctx, [x - half * 0.86, y + 0.4, x + half * 0.86, y + 0.4, x + half * 0.7, y + 2.2, x - half * 0.7, y + 2.2], shade(color, -0.28));
  // adze marks and a light along the gunwale
  ctx.strokeStyle = ink(shade(color, 0.22)); ctx.lineWidth = 0.6; ctx.beginPath();
  for (let i = 1; i < top.length / 2 - 1; i++) (i > 1 ? ctx.lineTo(top[i * 2], top[i * 2 + 1] + 0.5) : ctx.moveTo(top[i * 2], top[i * 2 + 1] + 0.5));
  ctx.stroke();
  for (let i = 0; i < Math.floor(len / 5); i++) { const px = x - half * 0.8 + i * 5 + rand(len, i) * 2; line(ctx, px, y - 1.4, px + 1.2, y - 1, shade(color, -0.18), 0.4); }
  // a band of carved chevrons along the side
  for (let i = 0; i < Math.floor(len / 4); i++) { const px = x - half * 0.7 + i * 4; poly(ctx, [px, y - 1.2, px + 1.4, y - 2.6, px + 2.8, y - 1.2], i % 2 ? shade(color, -0.3) : (war ? RED : shade(color, 0.12))); }
  // the bow post with a small carved head, and a raffia streamer
  const bx = x + half, by = sheer(1);
  line(ctx, bx - 1, by + 0.6, bx + 1.2, by - 4.4, shade(color, -0.1), 1.6);
  ellipse(ctx, bx + 1.4, by - 5.4, 1.1, 1.3, shade(color, 0.05));
  ellipse(ctx, bx + 1.8, by - 5.6, 0.3, 0.3, WHITE);
  line(ctx, bx + 1.2, by - 4.4, bx + 4, by - 3, war ? RED : RAFFIA, 0.8);
  // foam at the waterline
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - half * 0.8, y + 2);
  ctx.quadraticCurveTo(x, y + 4.2, x + half * 0.8, y + 1.6);
  ctx.stroke();
  return sheer;
}

/** Paddles to draw over the hull once it is drawn: [hand x, hand y, scale, stroke]. */
const OARS: [number, number, number, number][] = [];

/** A standing paddler behind the gunwale; his long paddle is drawn later, over the hull (see `paddles`). */
function paddler(ctx: Ctx, x: number, y: number, k: number, kind: UnitKind = 'archer', stroke = 0) {
  const b = figure(ctx, kind, 'kongo', x, y, k);
  OARS.push([b.hand.x, b.hand.y, k, stroke]);
}

/** The paddles: long shafts slanting back into the river, leaf-shaped blades in the water, a ripple at each. */
function paddles(ctx: Ctx, waterY: number) {
  for (const [hx, hy, k, st] of OARS.splice(0)) {
    const tx = hx - (5 + st * 3) * k / 0.44, ty = waterY + 1.6;
    line(ctx, hx + 2.6 * k / 0.44, hy - 5 * k / 0.44, tx, ty, WOOD_D, 1.1);
    line(ctx, hx + 2.6 * k / 0.44, hy - 5 * k / 0.44, tx, ty, '#a07448', 0.5);
    ellipse(ctx, tx - 0.3, ty + 0.6, 1.1, 2, WOOD);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(tx, ty + 2.4, 2.4, 0.8, 0, 0, Math.PI * 2); ctx.stroke();
  }
}

function canoe(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  if (kind === 'boat') { // a dugout with two paddlers and bales of raffia cloth
    dugout(ctx, x, y, 34, '#7a5232', () => {
      paddler(ctx, x - 9, y - 3.4, 0.44, 'archer', 0);
      for (const [dx, c] of [[1, RAFFIA], [4, RAFFIA_D], [2.4, RED]] as const) box(ctx, x + dx, y - 3.6 - (dx === 2.4 ? 2.4 : 0), 3.6, 2.2, c, shade(c, 0.2));
      paddler(ctx, x + 10, y - 3.4, 0.44, 'explorer', 1);
    });
    paddles(ctx, y);
    return;
  }
  if (kind === 'ship') { // a great trading canoe: four paddlers and a shelter of palm matting over the goods
    dugout(ctx, x, y, 48, '#6e4a2c', () => {
      paddler(ctx, x - 17, y - 3.2, 0.42, 'archer', 0);
      paddler(ctx, x - 10, y - 3.2, 0.42, 'warrior', 1);
      // the mat shelter: an arched roof of mats on bent poles
      const mx = x + 2, my = y - 4;
      ctx.beginPath();
      ctx.moveTo(mx - 6, my);
      ctx.quadraticCurveTo(mx - 6, my - 9, mx, my - 9);
      ctx.quadraticCurveTo(mx + 6, my - 9, mx + 6, my);
      ctx.closePath();
      ctx.fillStyle = ink(MAT);
      ctx.fill();
      for (let i = 1; i < 6; i++) line(ctx, mx - 6 + i * 2, my - 0.2, mx - 6 + i * 2, my - 8.4 + Math.abs(i - 3) * 0.6, shade(MAT, -0.2), 0.4);
      for (const t of [0.3, 0.6]) curve(ctx, mx - 5.6, my - 9 * t * 0.9 - 1, mx, my - 9 * t * 0.4 - 6 + t * 4, mx + 5.6, my - 9 * t * 0.9 - 1, 0.6, BROWN);
      poly(ctx, [mx - 2, my, mx + 2, my, mx + 2, my - 4, mx - 2, my - 4], BLACK);
      paddler(ctx, x + 12, y - 3.2, 0.42, 'archer', 1);
      paddler(ctx, x + 19, y - 3.2, 0.42, 'warrior', 0);
    });
    paddles(ctx, y);
    line(ctx, x - 24, y - 7, x - 28, y + 3, WOOD_D, 1.1); // the steering paddle
    ellipse(ctx, x - 27.8, y + 2.4, 1, 2.2, WOOD);
    return;
  }
  // the warship: a long war canoe, shieldbearers and paddlers in a line, mbeba shields hung along the side
  const sheer = dugout(ctx, x, y, 58, '#5e3e24', () => {
    for (let i = 0; i < 6; i++) paddler(ctx, x - 22 + i * 7.6, y - 3.2, 0.42, i % 2 ? 'warrior' : 'archer', i % 2);
    const b = figure(ctx, 'ngao', 'kongo', x + 25, y - 4.2, 0.46); // a shieldbearer at the bow
    spear(ctx, b.hand.x, b.hand.y, 0.46, 30);
  }, true);
  paddles(ctx, y);
  for (let i = 0; i < 7; i++) { // shields along the gunwale
    const px = x - 21 + i * 6.6, py = sheer((px - x) / 29) + 0.8;
    mbeba(ctx, px, py, 3, 4.4, 0.36, i % 2 ? 'small' : 'ngao');
  }
  line(ctx, x - 27, y - 8, x - 31, y + 3, WOOD_D, 1.2);
  ellipse(ctx, x - 30.8, y + 2.4, 1, 2.2, WOOD);
}

function unit(ctx: Ctx, kind: UnitKind, x: number, y: number): boolean {
  switch (kind) {
    case 'rider': case 'knight': horseman(ctx, kind, x, y); return true;
    case 'catapult': stoneThrower(ctx, x, y); return true;
    case 'boat': case 'ship': case 'warship': canoe(ctx, kind, x, y); return true;
  }
  return false;
}

// ---------------------------------------------------------------- buildings

/** A point on the ground plan: u runs to the lower right, v to the lower left, h is height. */
const P = (x: number, y: number, u: number, v: number, h = 0): [number, number] => [x + (u - v), y + (u + v) / 2 - h];

/** A woven fence of palm ribs from (u0, v0) to (u1, v1): a panel with stakes and two binding courses. */
function fence(ctx: Ctx, x: number, y: number, u0: number, v0: number, u1: number, v1: number, fh: number, c = CANE, posts = true) {
  const a = P(x, y, u0, v0), b = P(x, y, u1, v1);
  const facesRight = Math.abs(u1 - u0) < Math.abs(v1 - v0); // a run along v faces the lower right (in shadow)
  const col = facesRight ? shade(c, -0.18) : c;
  poly(ctx, [a[0], a[1], b[0], b[1], b[0], b[1] - fh, a[0], a[1] - fh], col);
  const n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.2));
  for (let i = 0; i <= n; i++) { // the ribs, their tops a little ragged
    const t = i / n, px = a[0] + (b[0] - a[0]) * t, py = a[1] + (b[1] - a[1]) * t;
    line(ctx, px, py, px, py - fh - (i % 3 === 0 ? 0.6 : 0), shade(col, -0.2), 0.35);
  }
  for (const f of [0.35, 0.75]) line(ctx, a[0], a[1] - fh * f, b[0], b[1] - fh * f, shade(col, -0.38), 0.5);
  if (posts) for (const p of [a, b]) line(ctx, p[0], p[1] + 0.3, p[0], p[1] - fh - 1, WOOD_D, 0.9);
}

/**
 * A rectangular Kongo house: walls of woven palm mats with a band of diamond patterns, a door in the long side, a
 * steep gabled roof of grass thatch with its ridge running along u. `L` and `D` are the half-length and half-depth.
 */
function house(ctx: Ctx, x: number, y: number, L: number, D: number, H: number, R: number, opts: { mat?: string; pat?: string; door?: boolean; veranda?: boolean; thatch?: string } = {}) {
  const mat = opts.mat ?? MAT, pat = opts.pat ?? RED, th = opts.thatch ?? THATCH;
  softShadow(ctx, x + 1.4, y + 1.4, (L + D) * 1.1, (L + D) * 0.5, 0.24);
  const W = (s: number, t: number) => P(x, y, -L + 2 * L * s, D, H * t); // the front wall, s along, t up
  const S = (s: number, t: number) => P(x, y, L, D - 2 * D * s, H * t); // the end wall
  const wpoly = (f: typeof W, pts: [number, number][], c: string) => poly(ctx, pts.flatMap(([s, t]) => f(s, t)), c);
  // the walls
  wpoly(W, [[0, 0], [1, 0], [1, 1], [0, 1]], mat);
  wpoly(S, [[0, 0], [1, 0], [1, 1], [0, 1]], shade(mat, -0.24));
  // the gable end, matted, above the end wall
  poly(ctx, [...P(x, y, L, D, H), ...P(x, y, L, -D, H), ...P(x, y, L, 0, H + R)], shade(mat, -0.3));
  for (let i = 1; i < 4; i++) { const a = P(x, y, L, D - (2 * D * i) / 4, H), g = P(x, y, L, 0, H + R); line(ctx, a[0], a[1], a[0] + (g[0] - a[0]) * (1 - Math.abs(i - 2) / 2) * 0.9, a[1] + (g[1] - a[1]) * (1 - Math.abs(i - 2) / 2) * 0.9, shade(mat, -0.42), 0.3); }
  // the mat weave: fine vertical and horizontal lines
  const n = Math.max(3, Math.round(L * 1.4));
  for (let i = 1; i < n; i++) { const a = W(i / n, 0), b = W(i / n, 1); line(ctx, a[0], a[1], b[0], b[1], shade(mat, -0.1), 0.25); }
  for (let i = 1; i < 4; i++) { const a = S(i / 4, 0), b = S(i / 4, 1); line(ctx, a[0], a[1], b[0], b[1], shade(mat, -0.34), 0.25); }
  // a band of diamonds across the front and the end, between black lines
  const m = Math.max(3, Math.round(L * 0.9));
  for (let i = 0; i < m; i++) { const s = (i + 0.5) / m, ds = 0.5 / m; wpoly(W, [[s - ds, 0.6], [s, 0.78], [s + ds, 0.6], [s, 0.42]], i % 2 ? pat : BLACK); wpoly(W, [[s - ds * 0.4, 0.6], [s, 0.67], [s + ds * 0.4, 0.6], [s, 0.53]], i % 2 ? BLACK : RAFFIA_L); }
  for (let i = 0; i < 2; i++) { const s = (i + 0.5) / 2, ds = 0.25; wpoly(S, [[s - ds, 0.6], [s, 0.78], [s + ds, 0.6], [s, 0.42]], shade(i % 2 ? pat : BLACK, -0.2)); }
  for (const t of [0.4, 0.8]) { const a = W(0, t), b = W(1, t), c = S(1, t); line(ctx, a[0], a[1], b[0], b[1], BLACK, 0.35); line(ctx, b[0], b[1], c[0], c[1], BLACK, 0.35); }
  // the corner posts
  for (const p of [W(0, 0), W(1, 0), S(1, 0)]) line(ctx, p[0], p[1], p[0], p[1] - H, WOOD_D, 0.7);
  if (opts.door !== false) { // the door, offset along the front, under a lintel
    const d0 = 0.56, d1 = 0.56 + Math.min(0.24, 2.4 / L / 2);
    wpoly(W, [[d0 - 0.03, 0], [d1 + 0.03, 0], [d1 + 0.03, 0.74], [d0 - 0.03, 0.74]], WOOD_D);
    wpoly(W, [[d0, 0], [d1, 0], [d1, 0.68], [d0, 0.68]], '#1e140c');
  }
  // the roof: only the near slope shows; overhanging the walls, steep, its thatch combed downward
  const o = 0.45, e = 0.8, eh = H - (o * R) / D;
  const E1 = P(x, y, -L - e, D + o, eh), E2 = P(x, y, L + e, D + o, eh), R2 = P(x, y, L + e, 0, H + R), R1 = P(x, y, -L - e, 0, H + R);
  const B2 = P(x, y, L + e, -D - o, eh);
  poly(ctx, [...R2, ...B2, B2[0] + 0.2, B2[1] + 1.1, R2[0] + 0.2, R2[1] + 1.1], shade(th, -0.36)); // the far slope's edge over the gable
  if (opts.veranda) { // posts holding the eave out over a shaded porch
    for (const s of [0.1, 0.4, 0.7, 1]) { const p = P(x, y, -L - e + (2 * L + 2 * e) * s, D + o, 0); line(ctx, p[0], p[1], p[0], p[1] - eh, WOOD, 0.8); }
  }
  poly(ctx, [...R1, ...R2, ...E2, ...E1], th);
  poly(ctx, [...R2, ...E2, E2[0] - 0.3, E2[1] + 1.1, R2[0] - 0.3, R2[1] + 1.1], shade(th, -0.24)); // the thatch's thickness at the end
  const ns = Math.round((2 * L + 2 * e) * 1.3);
  for (let i = 1; i < ns; i++) { // combed lines down the slope, some lighter
    const s = i / ns, a = [R1[0] + (R2[0] - R1[0]) * s, R1[1] + (R2[1] - R1[1]) * s], b = [E1[0] + (E2[0] - E1[0]) * s, E1[1] + (E2[1] - E1[1]) * s];
    line(ctx, a[0], a[1], b[0], b[1], i % 3 ? shade(th, -0.14) : shade(th, 0.14), 0.35);
  }
  for (const t of [0.35, 0.7]) line(ctx, R1[0] + (E1[0] - R1[0]) * t, R1[1] + (E1[1] - R1[1]) * t, R2[0] + (E2[0] - R2[0]) * t, R2[1] + (E2[1] - R2[1]) * t, shade(th, -0.22), 0.4); // courses
  for (let i = 0; i <= ns; i++) { const s = i / ns, px = E1[0] + (E2[0] - E1[0]) * s, py = E1[1] + (E2[1] - E1[1]) * s; line(ctx, px, py, px - 0.2, py + 0.9 + (i % 2) * 0.4, shade(th, -0.2), 0.45); } // the ragged eave
  line(ctx, R1[0], R1[1], R2[0], R2[1], shade(th, -0.4), 1.1); // the ridge, bound
  for (let i = 0; i <= 3; i++) { const s = i / 3, px = R1[0] + (R2[0] - R1[0]) * s, py = R1[1] + (R2[1] - R1[1]) * s; line(ctx, px - 0.6, py - 0.5, px + 0.6, py + 0.6, BROWN, 0.6); }
}

/** A small granary raised on four posts, round with a conical thatch cap. */
function granary(ctx: Ctx, x: number, y: number, s = 1) {
  softShadow(ctx, x + 1, y + 1, 4 * s, 1.8 * s, 0.2);
  for (const [dx, dy] of [[-2, 0], [2, 0], [0, 1], [0, -1]] as const) line(ctx, x + dx * s, y + dy * s, x + dx * s, y + dy * s - 3 * s, WOOD_D, 0.7 * s);
  ellipse(ctx, x, y - 3.4 * s, 3.2 * s, 1.3 * s, WOOD);
  poly(ctx, [x - 2.8 * s, y - 3.4 * s, x + 2.8 * s, y - 3.4 * s, x + 2.6 * s, y - 6.8 * s, x - 2.6 * s, y - 6.8 * s], CANE);
  poly(ctx, [x + 0.6 * s, y - 3.2 * s, x + 2.8 * s, y - 3.4 * s, x + 2.6 * s, y - 6.8 * s, x + 0.6 * s, y - 6.8 * s], shade(CANE, -0.22));
  for (const t of [0.3, 0.65]) line(ctx, x - 2.7 * s, y - 3.4 * s - 3.4 * s * t, x + 2.7 * s, y - 3.4 * s - 3.4 * s * t, shade(CANE, -0.35), 0.35 * s);
  poly(ctx, [x - 3.8 * s, y - 6.4 * s, x + 3.8 * s, y - 6.4 * s, x, y - 11 * s], THATCH);
  poly(ctx, [x + 0.4 * s, y - 6.2 * s, x + 3.8 * s, y - 6.4 * s, x, y - 11 * s], shade(THATCH, -0.22));
  for (let i = 0; i < 5; i++) line(ctx, x - 3.6 * s + i * 1.8 * s, y - 6.2 * s, x, y - 10.6 * s, shade(THATCH, -0.15), 0.3 * s);
}

/** A family compound: a house inside a low woven fence, the far runs drawn before the house and the near ones after. */
function compound(ctx: Ctx, x: number, y: number, L: number, D: number, H: number, R: number, F: number, G: number, fh: number, opts: Parameters<typeof house>[7] = {}, extra?: () => void) {
  fence(ctx, x, y, -F, -G, F, -G, fh);
  fence(ctx, x, y, -F, -G, -F, G, fh);
  extra?.();
  house(ctx, x, y, L, D, H, R, opts);
  fence(ctx, x, y, F, -G, F, G, fh);
  fence(ctx, x, y, -F, G, -F * 0.25, G, fh); // the near run, with a gap for the gateway
  fence(ctx, x, y, F * 0.25, G, F, G, fh);
}

/** A palm-rib gateway: two tall posts and a lintel, a red cloth hanging from it. */
function gateway(ctx: Ctx, x: number, y: number, u: number, v: number, w: number, gh: number) {
  const a = P(x, y, u - w, v), b = P(x, y, u + w, v);
  for (const p of [a, b]) { line(ctx, p[0], p[1], p[0], p[1] - gh, WOOD_D, 1.4); line(ctx, p[0] - 0.3, p[1], p[0] - 0.3, p[1] - gh, WOOD, 0.5); }
  line(ctx, a[0] - 1, a[1] - gh, b[0] + 1, b[1] - gh, WOOD_D, 1.2);
  poly(ctx, [a[0] + 1, a[1] - gh + 0.6, b[0] - 1, b[1] - gh + 0.6, b[0] - 1.4, b[1] - gh + 3, a[0] + 1.4, a[1] - gh + 3], RED);
  for (let i = 0; i < 4; i++) { const t = (i + 0.5) / 4; poly(ctx, [a[0] + 1.4 + (b[0] - a[0] - 2.8) * t - 0.5, a[1] - gh + 3 + (b[1] - a[1]) * t, a[0] + 1.4 + (b[0] - a[0] - 2.8) * t + 0.5, a[1] - gh + 3 + (b[1] - a[1]) * t, a[0] + 1.4 + (b[0] - a[0] - 2.8) * t, a[1] - gh + 2 + (b[1] - a[1]) * t], BLACK); }
}

/**
 * The capital, Mbanza Kongo: the royal enclosure. The court's great tree rises behind; within high woven fences stands
 * the great audience hall, its long thatch over a deep porch; the gateway faces the square, hung with red cloth.
 */
function royalEnclosure(ctx: Ctx, x: number, y: number) {
  softShadow(ctx, x + 1, y + 3, 22, 10, 0.2);
  const F = 12, G = 8, fh = 6;
  kapok(ctx, x + 12, y - 8, 0.72, 3, undefined); // the court tree behind the enclosure
  fence(ctx, x, y, -F, -G, F, -G, fh);
  fence(ctx, x, y, -F, -G, -F, G, fh);
  // a second, inner fence: the enclosures within enclosures of the royal court
  fence(ctx, x, y, -F + 2.4, -G + 2, -F + 2.4, -1, fh - 1.2, shade(CANE, -0.08), false);
  granary(ctx, x - 10, y - 4, 0.85);
  // the king's house behind the hall
  house(ctx, x - 4, y - 5, 3.6, 2.4, 4, 3.6, { pat: BLACK, door: false });
  // the great audience hall with its porch
  house(ctx, x + 1.4, y + 1.4, 8.4, 4, 5.4, 5.6, { veranda: true, pat: RED, mat: RAFFIA_L });
  fence(ctx, x, y, F, -G, F, G, fh);
  fence(ctx, x, y, -F, G, -2.6, G, fh);
  fence(ctx, x, y, 2.6, G, F, G, fh);
  gateway(ctx, x, y, 0, G, 2.8, fh + 3.6);
  // the cloth of state hung at the gate posts: tall poles with streamers of red and black
  for (const [u, v] of [[-F, G], [F, G], [F, -G]] as const) {
    const p = P(x, y, u, v);
    line(ctx, p[0], p[1], p[0], p[1] - fh - 6, WOOD_D, 0.8);
    poly(ctx, [p[0], p[1] - fh - 6, p[0] + 3.4, p[1] - fh - 5, p[0], p[1] - fh - 3.6], u === F && v === -G ? BLACK : RED);
  }
}

/** A chief's compound: a big house with a porch inside a fence, a granary beside it. */
function chiefCompound(ctx: Ctx, x: number, y: number) {
  compound(ctx, x, y, 5.4, 3.2, 4.2, 4.4, 8, 5.6, 2.6, { veranda: true, pat: RED }, () => granary(ctx, x - 8, y - 2, 0.75));
  gateway(ctx, x, y, 0, 5.6, 1.8, 6);
}

function building(ctx: Ctx, x: number, y: number, big: boolean, _roofC: string, capital: boolean) {
  if (big && capital) return royalEnclosure(ctx, x, y);
  if (big) return chiefCompound(ctx, x, y);
  const v = ((Math.round(x) * 7 + Math.round(y) * 3) % 5 + 5) % 5;
  if (v === 0) house(ctx, x, y, 3.4, 2.4, 4, 3.2, { pat: RED });
  else if (v === 1) { // a house behind a short fence, with a granary
    fence(ctx, x, y, -5, 3.6, 2.6, 3.6, 2, CANE);
    granary(ctx, x + 6, y - 1, 0.6);
    house(ctx, x, y, 3.2, 2.2, 3.8, 3, { pat: BLACK });
  } else if (v === 2) { house(ctx, x, y, 3.6, 2.4, 4, 3.2, { pat: RED, mat: RAFFIA_L }); oilPalm(ctx, x + 7, y + 3, 0.5, 2); }
  else if (v === 3) { house(ctx, x - 2, y - 1.4, 2.6, 2, 3.6, 2.8, { pat: BLACK }); house(ctx, x + 3, y + 2, 2.8, 2, 3.6, 2.8, { pat: RED, door: true }); }
  else { fence(ctx, x, y, -4.6, -3.4, 4.6, -3.4, 2.2); house(ctx, x, y, 3.4, 2.2, 4, 3.2, { veranda: true, pat: RED }); fence(ctx, x, y, 4.6, -3.4, 4.6, 3.4, 2.2); }
}

// ---------------------------------------------------------------- trees

/** A palm frond from (x0, y0) arching to (x1, y1), leaflets hanging from both sides of its rib. */
function frond(ctx: Ctx, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, k: number, c: string, leaf: number) {
  curve(ctx, x0, y0, cx, cy, x1, y1, 0.6 * k, shade(c, -0.3));
  const n = 9;
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1), [px, py] = qpt(x0, y0, cx, cy, x1, y1, t);
    const [qx, qy] = qpt(x0, y0, cx, cy, x1, y1, Math.min(1, t + 0.05));
    const dx = qx - px, dy = qy - py, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
    const l = leaf * k * (1 - t * 0.55);
    for (const sgn of [1, -1]) line(ctx, px, py, px + nx * l * sgn + dx * 0.6, py + ny * l * sgn + Math.abs(l) * 0.55, i % 2 ? c : shade(c, 0.12), 0.55 * k);
  }
}

/** The oil palm: a rough trunk studded with old leaf bases, a dense crown of arching feathery fronds, and clusters of
 *  red-orange fruit tucked in under the crown. */
function oilPalm(ctx: Ctx, x: number, y: number, k: number, variant: number, P_?: BiomePalette) {
  const trunk = P_?.trunk ?? '#5a3a24', green = P_ ? mix(P_.forest, '#3a8a2a', 0.4) : '#2a7a30';
  const lean = (rand(variant, 1) - 0.5) * 4 * k, hgt = (17 + rand(variant, 2) * 4) * k;
  const tx = x + lean, ty = y - hgt;
  curve(ctx, x, y, x + lean * 0.2, y - hgt * 0.5, tx, ty, 2.6 * k, shade(trunk, -0.12));
  curve(ctx, x - 0.5 * k, y, x + lean * 0.2 - 0.5 * k, y - hgt * 0.5, tx - 0.5 * k, ty, 0.9 * k, shade(trunk, 0.14));
  for (let i = 1; i < 8; i++) { // the leaf bases, crossing
    const [px, py] = qpt(x, y, x + lean * 0.2, y - hgt * 0.5, tx, ty, i / 8);
    line(ctx, px - 1.4 * k, py + 0.6 * k, px + 0.2 * k, py - 0.8 * k, shade(trunk, -0.35), 0.5 * k);
    line(ctx, px + 1.4 * k, py + 0.6 * k, px - 0.2 * k, py - 0.8 * k, shade(trunk, -0.3), 0.45 * k);
  }
  // the back fronds, darker; then the fruit; then the near fronds
  const fr = (a: number, len: number, droop: number, c: string) => {
    const ex = tx + Math.cos(a) * len * k, ey = ty + Math.sin(a) * len * 0.6 * k + droop * k;
    frond(ctx, tx, ty, tx + Math.cos(a) * len * 0.55 * k, ty + Math.sin(a) * len * 0.4 * k - 3 * k, ex, ey, k, c, 2.4);
  };
  for (const a of [-2.1, -1.5, -1.0]) fr(a, 9, 1, shade(green, -0.22));
  for (const [dx, dy] of [[-1.4, 1.2], [1.2, 1.4]] as const) { // the fruit bunches
    for (let i = 0; i < 6; i++) ellipse(ctx, tx + dx * k + (i % 3 - 1) * 0.7 * k, ty + dy * k + Math.floor(i / 3) * 0.8 * k, 0.6 * k, 0.6 * k, i % 2 ? '#d84a1a' : '#e8781e');
    ellipse(ctx, tx + dx * k, ty + dy * k + 1.6 * k, 0.5 * k, 0.4 * k, '#3a1a0c');
  }
  for (const a of [Math.PI + 0.2, Math.PI - 0.3, -0.2, 0.3, Math.PI * 0.5 + 0.6, Math.PI * 0.5 - 0.7]) fr(a, 10, 3, green);
  for (const a of [-2.6, -0.5]) fr(a, 8, -1, shade(green, 0.14));
  ellipse(ctx, tx, ty, 1.2 * k, 0.9 * k, shade(green, -0.3));
}

/** The raffia palm: almost no trunk, enormous fronds springing up and out from the swampy ground, and long hanging
 *  clusters of glossy scaled fruit, red-brown. The source of the kingdom's cloth. */
function raffiaPalm(ctx: Ctx, x: number, y: number, k: number, variant: number, P_?: BiomePalette) {
  const trunk = P_?.trunk ?? '#5a3a24', green = P_ ? mix(P_.forest, '#5a9a2a', 0.45) : '#3a8a30';
  const cx = x, cy = y - 4 * k;
  poly(ctx, [x - 1.8 * k, y, x + 1.8 * k, y, x + 1.4 * k, cy, x - 1.4 * k, cy], shade(trunk, -0.1));
  for (let i = 0; i < 3; i++) line(ctx, x - 1.6 * k, y - i * 1.3 * k - 0.6 * k, x + 1.6 * k, y - i * 1.3 * k - 1.2 * k, shade(trunk, -0.35), 0.5 * k);
  const fr = (a: number, len: number, rise: number, c: string) => {
    const ex = cx + Math.cos(a) * len * k, ey = cy - rise * k;
    frond(ctx, cx, cy, cx + Math.cos(a) * len * 0.3 * k, cy - rise * 1.3 * k, ex, ey, k, c, 2.8);
  };
  const turn = rand(variant, 3) * 0.3;
  for (const a of [Math.PI * 0.62, Math.PI * 0.4]) fr(a + turn, 9, 22, shade(green, -0.2));
  // the hanging fruit: long tassels of little scaly cones
  for (const dx of [-1.6, 1.8]) {
    line(ctx, cx + dx * 0.4 * k, cy - 1 * k, cx + dx * k, cy + 3 * k, '#6a4a2a', 0.5 * k);
    for (let i = 0; i < 4; i++) { const px = cx + dx * k + (i % 2 - 0.5) * 0.8 * k, py = cy + 1.6 * k + i * 0.9 * k; ellipse(ctx, px, py, 0.6 * k, 0.75 * k, i % 2 ? '#8a3a1a' : '#a8501e'); line(ctx, px - 0.4 * k, py, px + 0.4 * k, py, '#4a1e0a', 0.25 * k); }
  }
  for (const a of [Math.PI + 0.1, Math.PI * 0.82, Math.PI * 0.2, -0.1]) fr(a + turn * 0.5, 13, 14, green);
  for (const a of [Math.PI * 0.7, Math.PI * 0.3]) fr(a, 10, 19, shade(green, 0.14));
}

/** The kapok (ceiba): a tall pale smooth trunk on great buttress roots, branching high into wide flat layered tiers. */
function kapok(ctx: Ctx, x: number, y: number, k: number, variant: number, P_?: BiomePalette) {
  const bark = '#a49a88', green = P_ ? mix(P_.forest, '#2a6a2a', 0.3) : '#2a6a30';
  const h = (22 + rand(variant, 4) * 4) * k, top = y - h;
  // the buttress roots: thin fins flaring out from the base
  for (const [dx, dy, c] of [[-7, 1, -0.2], [6.6, 1.4, -0.32], [-3, 2.8, 0.02], [2.8, 2.6, -0.12]] as const) {
    poly(ctx, [x, y - 9 * k, x + dx * 0.15 * k, y + dy * 0.5 * k, x + dx * k, y + dy * k, x + dx * 0.4 * k, y - 2 * k], shade(bark, c));
    line(ctx, x, y - 9 * k, x + dx * k, y + dy * k, shade(bark, c + 0.12), 0.4 * k);
  }
  poly(ctx, [x - 2.2 * k, y + 0.6 * k, x + 2.2 * k, y + 0.6 * k, x + 1.4 * k, top + 4 * k, x - 1.4 * k, top + 4 * k], bark);
  poly(ctx, [x + 0.3 * k, y + 0.6 * k, x + 2.2 * k, y + 0.6 * k, x + 1.4 * k, top + 4 * k, x + 0.3 * k, top + 4 * k], shade(bark, -0.22));
  for (let i = 0; i < 4; i++) ellipse(ctx, x - 0.5 * k, y - (6 + i * 4.5) * k, 0.3 * k, 0.5 * k, shade(bark, -0.3)); // a few thorns
  // the branches: spreading level from the top of the trunk
  for (const [dx, dy] of [[-8, -1], [-4, -3], [4, -3.4], [8.6, -1.4]] as const) curve(ctx, x, top + 5 * k, x + dx * 0.5 * k, top + (dy + 2) * k, x + dx * k, top + dy * k, 0.9 * k, shade(bark, -0.15));
  // the crown: a broad spreading dome of leafy clumps, darker beneath, sunlit on top
  const W = (10 + rand(variant, 5) * 2) * k, cy = top - 1 * k;
  ellipse(ctx, x + 0.8 * k, cy + 2 * k, W, 4 * k, shade(green, -0.34));
  for (let j = 0; j < 3; j++) {
    const ww = W * (1 - j * 0.3), yy = cy - j * 2.6 * k, n = 6 - j;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1), px = x - ww * 0.8 + t * ww * 1.6, py = yy - Math.sin(t * Math.PI) * 1.2 * k;
      ellipse(ctx, px, py, 3.2 * k, 2.6 * k, shade(green, -0.14 + j * 0.1 + (i % 2) * 0.05));
    }
  }
  for (let i = 0; i < 3; i++) ellipse(ctx, x - W * 0.3 + i * W * 0.3 - 0.8 * k, cy - 6.8 * k - (i === 1 ? 0.8 : 0) * k, 1.8 * k, 1 * k, shade(green, 0.26));
}

function tree(ctx: Ctx, x: number, y: number, k: number, P_: BiomePalette, variant: number) {
  const v = variant % 5;
  if (v === 1) return kapok(ctx, x, y, k * 0.72, variant, P_);
  if (v === 3) return raffiaPalm(ctx, x, y, k * 0.95, variant, P_);
  oilPalm(ctx, x, y, k * 0.95, variant, P_);
}

registerArt('kongo', {
  cape: () => null, // no European-style cloak behind the heavy ranks
  unit,
  dress: (kind) => dress(kind),
  torso,
  face,
  head,
  weapon,
  shield,
  building,
  tree,
});

// The Cree of the Subarctic boreal forest (Nēhiyawak, Ininiwak, Eeyouch and their kin), drawn from their material
// culture: coats and leggings of smoke-tanned moose and caribou hide, fringed and worked with the floral beadwork the
// Cree are known for (small flowers, buds and leaves in red, pink, blue and yellow glass beads on hide or dark velvet);
// fur caps of beaver and marten, hooded capotes cut from trade blankets (the white point blanket with its green, red,
// yellow and indigo stripes for the higher ranks), mittens, a woven sash, and puckered moccasins with beaded vamps.
// Self bows and hide quivers, trade muskets with a powder horn, crooked knives, stone-headed and gunstock war clubs,
// small round hide shields left plain, and snowshoes carried on the back. On the water the birch-bark canoe, its seams
// sealed with black spruce gum, up to the great freight canoe; Plains Cree riders on their ponies. Conical lodges of
// birch bark and smoked hide, log cabins, racks of drying whitefish; at the capital a long gathering lodge inside a
// palisaded trading fort beside the lake. Forests of black spruce, white birch and tamarack (golden in the fall).
// No sacred objects, sweat lodges, pipes or painted vision designs are drawn.
import type { BiomePalette } from '../../data/tribes';
import type { UnitKind } from '../../game/types';
import { band, box, ellipse, faceQuad, ink, line, mix, poly, rand, shade, softShadow, type Ctx } from '../prims';
import { registerArt, type Body } from '../tribeart';
import { drawHorse, figure } from '../units';

// ---------------------------------------------------------------- palette

const HIDE = '#b8905e', HIDE_D = '#8a6640', HIDE_L = '#dcbc8a'; // smoke-tanned moose hide
const SMOKE = '#7a5634'; // the darker, well-smoked hide of a lodge cover's top
const VELVET = '#1e1a24'; // black velvet under the beadwork
const STROUD = '#9a2a26'; // red trade wool
const NAVY = '#2a3656'; // navy blanket wool
const BLANKET = '#f2eee2'; // the white point blanket
const STRIPES = ['#2a7a3a', '#c8282a', '#e8c020', '#2a3a7a']; // green, red, yellow, indigo
const FUR = '#5a3e2a', FUR_D = '#3a2818', FUR_L = '#8a6646'; // beaver and marten
const WOOD = '#7a5434', WOOD_D = '#4a3020', WOOD_L = '#a88058';
const ASH = '#d8c08a'; // a snowshoe's ash frame
const BABICHE = '#ece0c0'; // the rawhide webbing
const IRON = '#5e6268', IRON_L = '#b8bec6';
const BRASS = '#d8a83a';
const HAIR = '#100c0a';
const BIRCH = '#efe8d8', BIRCH_D = '#c4b8a0', GUM = '#2a1e16'; // birch bark and the spruce gum sealing its seams
const LOG = '#8a6440', LOG_D = '#5a3e24', LOG_L = '#b08a60';
// floral beadwork
const BEAD = { red: '#d8302a', pink: '#ec7aa2', blue: '#3a7ad8', yellow: '#f0c838', white: '#f6f2e6', leaf: '#3a9a4a', teal: '#3ab0b0' };
const PETALS = [BEAD.red, BEAD.pink, BEAD.blue, BEAD.yellow, BEAD.teal];

type Pt2 = [number, number];
/** Iso point at (u, v, z) from the centre: u runs down to the right, v down to the left, z up. */
const P = (cx: number, cy: number, u: number, v: number, z = 0): Pt2 => [cx + u - v, cy + (u + v) / 2 - z];

// ---------------------------------------------------------------- small helpers

/** A point on one visible side of a box, in faceQuad's (u, v) coordinates. */
function pt(face: 'L' | 'R', cx: number, cy: number, w: number, h: number, u: number, v: number): Pt2 {
  return face === 'R' ? [cx + (u * w) / 2, cy + (w / 4) * (1 - u) - v * h] : [cx - w / 2 + (u * w) / 2, cy + (w / 4) * u - v * h];
}
function facePoly(ctx: Ctx, face: 'L' | 'R', cx: number, cy: number, w: number, h: number, pts: Pt2[], color: string) {
  poly(ctx, pts.flatMap(([u, v]) => pt(face, cx, cy, w, h, u, v)), face === 'L' ? shade(color, 0.06) : shade(color, -0.2));
}
function curve(ctx: Ctx, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, w: number, c: string) {
  ctx.strokeStyle = ink(c);
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx, cy, x1, y1);
  ctx.stroke();
}
function ring(ctx: Ctx, x: number, y: number, rx: number, ry: number, c: string, w: number, a0 = 0, a1 = Math.PI * 2) {
  ctx.strokeStyle = ink(c);
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, a0, a1);
  ctx.stroke();
}

/** A beaded flower: five petals round a bright centre. */
function flower(ctx: Ctx, x: number, y: number, r: number, petal: string, centre = BEAD.yellow) {
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    ellipse(ctx, x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.46, r * 0.46, petal);
  }
  ellipse(ctx, x, y, r * 0.34, r * 0.34, centre === petal ? BEAD.white : centre);
}
/** A beaded leaf or bud. */
function leaf(ctx: Ctx, x: number, y: number, r: number, ang: number, c = BEAD.leaf) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ellipse(ctx, r * 0.9, 0, r, r * 0.42, c);
  ctx.restore();
}
/** A spray of floral beadwork: a flower, two leaves, a bud. */
function spray(ctx: Ctx, x: number, y: number, r: number, i = 0) {
  leaf(ctx, x, y, r * 0.9, -2.4, BEAD.leaf);
  leaf(ctx, x, y, r * 0.9, -0.6, shade(BEAD.leaf, 0.15));
  ellipse(ctx, x + r * 1.3, y + r * 1.2, r * 0.36, r * 0.5, PETALS[(i + 2) % PETALS.length]); // a bud
  flower(ctx, x, y, r, PETALS[i % PETALS.length], i % 2 ? BEAD.yellow : BEAD.white);
}
/** A short fringe hanging from a line. */
function fringe(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, n: number, len: number, c: string, w: number) {
  for (let i = 0; i <= n; i++) {
    const t = i / n, px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t;
    line(ctx, px, py, px - len * 0.12, py + len * (0.8 + (i % 2) * 0.25), i % 2 ? c : shade(c, -0.15), w);
  }
}
/** Soft smoke rising. */
function smoke(ctx: Ctx, x: number, y: number, s = 1) {
  for (let i = 0; i < 4; i++) ellipse(ctx, x - i * 0.9 * s, y - i * 2.6 * s, (1 + i * 0.5) * s, (0.8 + i * 0.4) * s, `rgba(222,224,228,${0.42 - i * 0.09})`);
}

// ---------------------------------------------------------------- dress

const isCapote = (k: UnitKind) => k === 'swordsman' || k === 'knight' || k === 'giant';

function dress(kind: UnitKind): [string, string, string] {
  switch (kind) {
    case 'okihtcitaw': return [HIDE, STROUD, HIDE];
    case 'warrior': return [HIDE, HIDE_D, HIDE];
    case 'archer': return [HIDE_L, NAVY, HIDE_L];
    case 'defender': return [NAVY, STROUD, NAVY];
    case 'swordsman': case 'knight': case 'giant': return [BLANKET, kind === 'knight' ? STROUD : NAVY, BLANKET];
    case 'explorer': return [HIDE_D, HIDE_D, HIDE_D];
    default: return [HIDE, HIDE_D, HIDE];
  }
}

/** A woven sash at the waist: red with an arrow pattern in blue and yellow, its tasselled end at the hip. */
function sash(ctx: Ctx, x: number, y: number, w: number, h: number, k: number) {
  band(ctx, x, y, w, h, 0.1, 0.24, STROUD);
  for (const f of ['L', 'R'] as const) for (let i = 0; i < 6; i++) {
    const u = 0.04 + i * 0.16;
    facePoly(ctx, f, x, y, w, h, [[u, 0.13], [u + 0.06, 0.17], [u + 0.12, 0.13], [u + 0.12, 0.16], [u + 0.06, 0.2], [u, 0.16]], i % 2 ? BEAD.blue : BEAD.yellow);
  }
  const [kx, ky] = pt('L', x, y, w, h, 0.28, 0.14);
  poly(ctx, [kx - 0.6 * k, ky, kx + 0.8 * k, ky + 0.2 * k, kx + 0.4 * k, ky + 4.6 * k, kx - 0.9 * k, ky + 4.2 * k], STROUD);
  fringe(ctx, kx - 0.9 * k, ky + 4.2 * k, kx + 0.4 * k, ky + 4.6 * k, 3, 1.4 * k, BEAD.blue, 0.3 * k);
}

/** A hide coat: the yoke fringe, a front panel of floral beadwork on black velvet, and a fringed skirt over the thighs. */
function hideCoat(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const k = w / 10;
  const base = dress(kind)[0];
  const hem = kind === 'okihtcitaw' ? -0.1 : -0.62; // the runner's coat is cut short, clear of his stride
  // the skirt of the coat, falling over the thighs (drawn over the legs), fringed at the hem
  for (const f of ['L', 'R'] as const) facePoly(ctx, f, x, y, w, h, [[0, 0.05], [1, 0.05], [1.02, hem], [-0.02, hem]], base);
  const [a0, b0] = pt('L', x, y, w, h, -0.02, hem), [a1, b1] = pt('L', x, y, w, h, 1, hem), [a2, b2] = pt('R', x, y, w, h, 1.02, hem);
  fringe(ctx, a0, b0, a1, b1, 7, 1.6 * k, shade(base, -0.1), 0.35 * k);
  fringe(ctx, a1, b1, a2, b2, 7, 1.6 * k, shade(base, -0.25), 0.35 * k);
  // the coat opens down the front edge: a dark velvet band beaded with flowers
  facePoly(ctx, 'R', x, y, w, h, [[0, 1], [0.24, 1], [0.24, hem + 0.02], [0, hem + 0.02]], VELVET);
  const r = 0.75 * k;
  for (let i = 0; i < (hem > -0.5 ? 2 : 3); i++) {
    const [fx, fy] = pt('R', x, y, w, h, 0.12, 0.78 - i * 0.62);
    spray(ctx, fx, fy, r, i + (kind === 'archer' ? 1 : 0));
  }
  // a flower on the chest, and the yoke: a curved line of fringe across the shoulders
  if (kind === 'okihtcitaw' || kind === 'archer' || kind === 'rider') {
    const [cx, cy] = pt('R', x, y, w, h, 0.62, 0.56);
    spray(ctx, cx, cy, r * 1.05, 3);
    const [lx, ly] = pt('L', x, y, w, h, 0.45, 0.5);
    spray(ctx, lx, ly, r * 0.95, 1);
  }
  const [y0x, y0y] = pt('L', x, y, w, h, 0, 0.8), [y1x, y1y] = pt('L', x, y, w, h, 1, 0.84), [y2x, y2y] = pt('R', x, y, w, h, 1, 0.8);
  fringe(ctx, y0x, y0y, y1x, y1y, 6, 1.4 * k, HIDE_L, 0.3 * k);
  fringe(ctx, y1x, y1y, y2x, y2y, 6, 1.4 * k, shade(HIDE_L, -0.2), 0.3 * k);
  band(ctx, x, y, w, h, 0.9, 1, FUR); // a fur collar
  if (kind === 'okihtcitaw' || kind === 'rider') sash(ctx, x, y, w, h, k);
  else band(ctx, x, y, w, h, 0.12, 0.2, HIDE_D); // a hide belt
}

/** A capote cut from a trade blanket: stripes at the hem, a fringed hood (drawn by the head), a red sash. */
function capote(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const k = w / 10;
  const white = kind !== 'defender';
  const base = white ? BLANKET : NAVY;
  for (const f of ['L', 'R'] as const) facePoly(ctx, f, x, y, w, h, [[0, 0.05], [1, 0.05], [1.02, -0.7], [-0.02, -0.7]], base);
  if (white) {
    for (let i = 0; i < 4; i++) for (const f of ['L', 'R'] as const) facePoly(ctx, f, x, y, w, h, [[0, -0.36 - i * 0.07], [1, -0.36 - i * 0.07], [1, -0.31 - i * 0.07], [0, -0.31 - i * 0.07]], STRIPES[i]);
    for (const u of [0.18, 0.3, 0.42]) faceQuad(ctx, 'L', x, y, w, h, u, u + 0.03, 0.44, 0.62, '#1a1a1e'); // the point marks
  } else {
    for (const f of ['L', 'R'] as const) facePoly(ctx, f, x, y, w, h, [[0, -0.5], [1, -0.5], [1, -0.42], [0, -0.42]], STROUD); // a red border
  }
  // the overlapping front, and its edge
  facePoly(ctx, 'R', x, y, w, h, [[0, 1], [0.3, 1], [0.34, -0.7], [0, -0.7]], shade(base, 0.04));
  const [ex, ey] = pt('R', x, y, w, h, 0.3, 1), [fx, fy] = pt('R', x, y, w, h, 0.34, -0.7);
  line(ctx, ex, ey, fx, fy, shade(base, -0.3), 0.4 * k);
  if (!white) for (let i = 0; i < 3; i++) { const [bx, by] = pt('R', x, y, w, h, 0.2, 0.7 - i * 0.5); spray(ctx, bx, by, 0.6 * k, i); } // a beaded front
  if (white) band(ctx, x, y, w, h, 0.88, 1, STRIPES[3]);
  sash(ctx, x, y, w, h, k);
  // a beaded bag at the hip
  if (kind === 'giant' || kind === 'knight') {
    const [bx, by] = pt('R', x, y, w, h, 0.7, 0.1);
    poly(ctx, [bx - 1.2 * k, by, bx + 1.4 * k, by - 0.4 * k, bx + 1.4 * k, by + 2.6 * k, bx - 1.2 * k, by + 3 * k], VELVET);
    flower(ctx, bx + 0.1 * k, by + 1.3 * k, 0.75 * k, BEAD.pink);
    fringe(ctx, bx - 1.2 * k, by + 3 * k, bx + 1.4 * k, by + 2.6 * k, 4, 1 * k, BEAD.white, 0.25 * k);
  }
}

function torso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  if (isCapote(kind) || kind === 'defender') capote(ctx, kind, x, y, w, h);
  else hideCoat(ctx, kind, x, y, w, h);
  const k = w / 10;
  if (kind === 'explorer') { // a tumpline strap across the chest
    facePoly(ctx, 'R', x, y, w, h, [[0.1, 1], [0.26, 1], [0.92, 0.26], [0.78, 0.22]], HIDE_D);
    line(ctx, ...pt('R', x, y, w, h, 0.5, 0.6), ...pt('R', x, y, w, h, 0.56, 0.64), BEAD.red, 0.4 * k);
  }
  if (kind === 'swordsman' || kind === 'knight') { // a powder horn on a beaded strap
    facePoly(ctx, 'R', x, y, w, h, [[0, 0.98], [0.14, 0.98], [0.96, 0.2], [0.82, 0.18]], VELVET);
    for (let i = 0; i < 4; i++) { const [bx, by] = pt('R', x, y, w, h, 0.18 + i * 0.2, 0.84 - i * 0.18); ellipse(ctx, bx, by, 0.35 * k, 0.35 * k, PETALS[i]); }
    const [hx, hy] = pt('R', x, y, w, h, 0.9, 0.2);
    poly(ctx, [hx - 1.6 * k, hy - 0.6 * k, hx + 1.2 * k, hy - 1.2 * k, hx + 2.4 * k, hy + 1.8 * k, hx + 1.8 * k, hy + 2.2 * k], '#e8dcc0');
    ellipse(ctx, hx - 1.4 * k, hy - 0.4 * k, 0.6 * k, 0.7 * k, WOOD_D);
  }
}

// ---------------------------------------------------------------- headgear

/** Hair in two braids falling in front of the shoulders, wrapped in red cloth at the ends. */
function braids(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const hy = top + 10.5 * k;
  for (const [u, dx] of [[0.82, 0], [0.18, -0.6]] as const) {
    const [bx, by] = pt('L', x, hy, hw, 10.5 * k, u, 0.42);
    const ex = bx + dx * k, ey = by + 6.4 * k;
    line(ctx, bx, by, ex, ey, HAIR, 1.3 * k);
    for (let i = 1; i < 4; i++) line(ctx, bx - 0.5 * k, by + i * 1.4 * k, bx + 0.5 * k, by + i * 1.4 * k + 0.5 * k, '#2a2420', 0.3 * k);
    line(ctx, ex, ey - 1.6 * k, ex, ey, STROUD, 1.5 * k);
  }
}

/** A headband quilled or beaded in a row of little flowers, with one feather tied at the back. */
function headband(ctx: Ctx, x: number, top: number, k: number, hw: number, feather: boolean) {
  const hy = top + 10.5 * k, w = hw + 0.4 * k;
  for (const f of ['L', 'R'] as const) {
    faceQuad(ctx, f, x, hy, w, 10.5 * k, 0, 1, 0.66, 0.82, VELVET);
    for (let i = 0; i < 3; i++) {
      const [fx, fy] = pt(f, x, hy, w, 10.5 * k, 0.18 + i * 0.32, 0.74);
      flower(ctx, fx, fy, 0.62 * k, PETALS[(i + (f === 'L' ? 2 : 0)) % PETALS.length]);
    }
  }
  if (!feather) return;
  // a hawk feather tied at the back of the band, slanting back
  const [qx, qy] = pt('L', x, hy, w, 10.5 * k, 0.1, 0.8);
  const ex = qx - 4.4 * k, ey = qy - 8.4 * k;
  const len = Math.hypot(ex - qx, ey - qy), nx = -(ey - qy) / len, ny = (ex - qx) / len, fw = 1.3 * k;
  const at = (t: number, s: number) => [qx + (ex - qx) * t + nx * fw * s, qy + (ey - qy) * t + ny * fw * s];
  poly(ctx, [...at(0.1, 0), ...at(0.25, 0.6), ...at(0.8, 0.45), ...at(1, 0), ...at(0.8, -0.45), ...at(0.25, -0.55)], '#a87a4a');
  for (const t of [0.35, 0.55, 0.75]) poly(ctx, [...at(t, 0.55), ...at(t + 0.08, 0.5), ...at(t + 0.08, -0.5), ...at(t, -0.55)], '#4a3020'); // barred
  poly(ctx, [...at(0.86, 0.3), ...at(1, 0), ...at(0.86, -0.3)], '#f2ead8');
  line(ctx, qx, qy, ex, ey, '#e8dcc0', 0.3 * k);
  line(ctx, qx, qy, qx + (ex - qx) * 0.12, qy + (ey - qy) * 0.12, STROUD, 0.7 * k);
}

/** A round fur cap of beaver or marten, its pelt short and soft, a marten tail hanging behind; earflaps for the cold. */
function furCap(ctx: Ctx, x: number, top: number, k: number, hw: number, flaps: boolean, tail: boolean) {
  const w = hw + 1.2 * k, hy = top + 10.5 * k;
  if (tail) curve(ctx, x - w / 2 + 0.4 * k, top + 1.6 * k, x - w / 2 - 2.6 * k, top + 4 * k, x - w / 2 - 2 * k, top + 9 * k, 1.6 * k, FUR_D);
  if (tail) ellipse(ctx, x - w / 2 - 2 * k, top + 9 * k, 0.9 * k, 1.2 * k, '#2a1a10');
  if (flaps) {
    faceQuad(ctx, 'L', x, hy, hw + 0.6 * k, 10.5 * k, 0.12, 0.6, 0.2, 0.8, FUR);
    faceQuad(ctx, 'L', x, hy, hw + 0.6 * k, 10.5 * k, 0.12, 0.6, 0.2, 0.3, FUR_L);
    const [tx, ty] = pt('L', x, hy, hw + 0.6 * k, 10.5 * k, 0.36, 0.2);
    line(ctx, tx, ty, tx + 0.6 * k, ty + 3 * k, HIDE_D, 0.4 * k); // a tie
  }
  box(ctx, x, top + 3.4 * k, w, 3.8 * k, FUR, FUR_L);
  // the soft crown, rounded over
  ctx.beginPath();
  ctx.ellipse(x, top - 0.4 * k, w / 2, w / 4 + 2 * k, 0, Math.PI, 0);
  ctx.ellipse(x, top - 0.4 * k, w / 2, w / 4, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fillStyle = ink(FUR_L);
  ctx.fill();
  // the fur's texture: short strokes round the brim and over the crown
  for (let i = 0; i < 14; i++) {
    const t = i / 13, a = Math.PI * (0.02 + t * 0.96);
    const px = x - Math.cos(a) * (w / 2) * 0.96, py = top + 3.6 * k + Math.sin(a) * (w / 4) * 0.9;
    line(ctx, px, py, px + (rand(i, 3) - 0.5) * 0.8 * k, py - 1.4 * k, i % 2 ? FUR_D : FUR_L, 0.4 * k);
  }
  for (let i = 0; i < 7; i++) ellipse(ctx, x + (rand(i, 7) - 0.5) * w * 0.7, top - 0.8 * k - rand(i, 9) * 1.6 * k, 0.6 * k, 0.4 * k, shade(FUR_L, 0.15));
  ellipse(ctx, x - w * 0.18, top - 1.4 * k, w * 0.16, 0.6 * k, 'rgba(255,240,220,0.22)');
}

/** The capote's hood, up: it covers the back and sides of the head and frames the face; its point flops back, a tassel at the tip. */
function hood(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  const white = kind !== 'defender';
  const c = white ? BLANKET : NAVY, edge = white ? STROUD : FUR, hy = top + 10.5 * k, w = hw + 1 * k, hh = 10.5 * k;
  faceQuad(ctx, 'L', x, hy + 0.4 * k, w, hh + 0.6 * k, 0, 1, 0.1, 1, c); // the side and back of the hood
  if (white) faceQuad(ctx, 'L', x, hy + 0.4 * k, w, hh + 0.6 * k, 0, 1, 0.18, 0.28, STRIPES[3]);
  faceQuad(ctx, 'R', x, hy + 0.4 * k, w, hh + 0.6 * k, 0, 1, 0.84, 1, c); // over the brow
  faceQuad(ctx, 'R', x, hy + 0.4 * k, w, hh + 0.6 * k, 0.84, 1, 0.1, 1, c); // the far cheek
  faceQuad(ctx, 'R', x, hy + 0.4 * k, w, hh + 0.6 * k, 0, 0.84, 0.8, 0.86, edge); // the edge round the face
  faceQuad(ctx, 'R', x, hy + 0.4 * k, w, hh + 0.6 * k, 0.8, 0.86, 0.1, 0.86, edge);
  // the rounded crown
  const cy = top - 0.6 * k;
  ctx.beginPath();
  ctx.ellipse(x, cy, w / 2, w / 4 + 2 * k, 0, Math.PI, 0);
  ctx.ellipse(x, cy, w / 2, w / 4, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fillStyle = ink(shade(c, 0.1));
  ctx.fill();
  ellipse(ctx, x - w * 0.18, cy - 1.4 * k, w * 0.18, 0.7 * k, white ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.12)');
  // the point, flopping back and down behind the head, and its tassel
  const bx = x - w * 0.2, by = cy - w / 4 - 1.2 * k, tx = x - w * 0.72, ty = cy + 1.4 * k;
  poly(ctx, [bx + 1.4 * k, by + 0.2 * k, bx - 1.6 * k, by - 0.4 * k, tx, ty, bx - 0.6 * k, by + 3 * k], shade(c, -0.1));
  line(ctx, bx - 1.6 * k, by - 0.4 * k, tx, ty, shade(c, -0.3), 0.3 * k);
  line(ctx, tx, ty, tx - 0.4 * k, ty + 2.2 * k, edge === FUR ? BEAD.yellow : STROUD, 0.5 * k);
  ellipse(ctx, tx - 0.4 * k, ty + 2.8 * k, 0.8 * k, 1.1 * k, edge === FUR ? BEAD.yellow : STROUD);
}

/** Mittens of moose hide, fur at the cuff, a little flower on the back. Painted over the shared figure's front hand. */
function mittens(ctx: Ctx, x: number, top: number, k: number) {
  const hip = top + 19 * k;
  box(ctx, x + 6 * k, hip + 2.5 * k, 2.8 * k, 2.4 * k, HIDE_L, shade(HIDE_L, 0.1));
  faceQuad(ctx, 'R', x + 6 * k, hip + 2.5 * k, 2.8 * k, 2.4 * k, 0, 1, 0.8, 1.15, FUR_L);
  const [fx, fy] = pt('R', x + 6 * k, hip + 2.5 * k, 2.8 * k, 2.4 * k, 0.5, 0.4);
  ellipse(ctx, fx, fy, 0.45 * k, 0.45 * k, BEAD.red);
}

function head(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  // the figure's shoulder guard and cuffs would be steel on the heavy ranks: re-dress them in blanket and fur
  if (isCapote(kind) || kind === 'defender') {
    const hip = top + 19 * k;
    const c = kind === 'defender' ? NAVY : BLANKET;
    box(ctx, x + 6 * k, hip - 4.8 * k, 3.6 * k, 2.2 * k, c, shade(c, 0.1));
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.12, 0.34, c);
    if (c === BLANKET) for (let i = 0; i < 3; i++) faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.38 + i * 0.07, 0.43 + i * 0.07, STRIPES[i]);
    else faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.36, 0.44, STROUD);
  } else {
    // a fringe of hide along the front sleeve, and a beaded cuff
    faceQuad(ctx, 'R', x + 6 * k, top + 19.6 * k, 2.8 * k, 7 * k, 0, 1, 0.14, 0.26, VELVET);
    const [cx, cy] = pt('R', x + 6 * k, top + 19.6 * k, 2.8 * k, 7 * k, 0.5, 0.2);
    ellipse(ctx, cx, cy, 0.45 * k, 0.45 * k, BEAD.pink);
  }
  switch (kind) {
    case 'okihtcitaw': braids(ctx, x, top, k, hw); headband(ctx, x, top, k, hw, true); break;
    case 'warrior': braids(ctx, x, top, k, hw); furCap(ctx, x, top, k, hw, false, false); break;
    case 'archer': braids(ctx, x, top, k, hw); headband(ctx, x, top, k, hw, true); break;
    case 'defender': hood(ctx, kind, x, top, k, hw); mittens(ctx, x, top, k); break;
    case 'swordsman': furCap(ctx, x, top, k, hw, false, true); break;
    case 'rider': braids(ctx, x, top, k, hw); headband(ctx, x, top, k, hw, true); break;
    case 'knight': braids(ctx, x, top, k, hw); furCap(ctx, x, top, k, hw, false, true); break;
    case 'giant': hood(ctx, kind, x, top, k, hw); mittens(ctx, x, top, k); break;
    case 'explorer': furCap(ctx, x, top, k, hw, true, false); mittens(ctx, x, top, k); break;
    default: braids(ctx, x, top, k, hw); headband(ctx, x, top, k, hw, false); break;
  }
}

// ---------------------------------------------------------------- weapons and shields

/** A self bow of birch or ash, strung, an arrow nocked. */
function bow(ctx: Ctx, x: number, y: number, k: number) {
  const bx = x + 3.6 * k, top = y - 12.6 * k, bot = y + 7.4 * k;
  curve(ctx, bx - 1 * k, top, bx + 5.2 * k, (top + bot) / 2, bx - 1 * k, bot, 1.4 * k, WOOD_D);
  curve(ctx, bx - 1.3 * k, top, bx + 4.6 * k, (top + bot) / 2, bx - 1.3 * k, bot, 0.5 * k, WOOD_L);
  ellipse(ctx, bx + 2.1 * k, (top + bot) / 2, 0.9 * k, 1.6 * k, STROUD); // a wrapped grip
  line(ctx, bx - 1 * k, top, x - 2.4 * k, y - 2.4 * k, '#e8e0cc', 0.4 * k);
  line(ctx, bx - 1 * k, bot, x - 2.4 * k, y - 2.4 * k, '#e8e0cc', 0.4 * k);
  line(ctx, x - 3.4 * k, y - 2.2 * k, bx + 6 * k, y - 3.4 * k, '#c8a878', 0.6 * k);
  poly(ctx, [bx + 6 * k, y - 4.2 * k, bx + 8.2 * k, y - 3.5 * k, bx + 6 * k, y - 2.6 * k], IRON); // a trade-iron point
  poly(ctx, [x - 3.4 * k, y - 2.2 * k, x - 1.4 * k, y - 2.6 * k, x - 1.6 * k, y - 3.6 * k], '#f0ead8');
  poly(ctx, [x - 3.4 * k, y - 2.2 * k, x - 1.4 * k, y - 2.4 * k, x - 1.8 * k, y - 1.2 * k], '#4a3020');
}

/** A hide quiver on the back, a flower beaded on it, the fletchings showing. */
function quiver(ctx: Ctx, x: number, y: number, k: number) {
  const qx = x - 6.4 * k;
  box(ctx, qx, y - 8 * k, 3.2 * k, 9.4 * k, HIDE_D);
  faceQuad(ctx, 'R', qx, y - 8 * k, 3.2 * k, 9.4 * k, 0, 1, 0.78, 0.94, VELVET);
  const [fx, fy] = pt('R', qx, y - 8 * k, 3.2 * k, 9.4 * k, 0.5, 0.86);
  flower(ctx, fx, fy, 0.6 * k, BEAD.red);
  fringe(ctx, qx - 1.6 * k, y - 8 * k, qx, y - 7.2 * k, 4, 1.6 * k, HIDE, 0.3 * k);
  for (const i of [-1, 0, 1]) {
    const tx = qx - 1.2 * k + i * 1.1 * k;
    line(ctx, qx + i * 0.7 * k, y - 17.6 * k, tx, y - 21.6 * k, '#c8a878', 0.6 * k);
    poly(ctx, [tx, y - 21.6 * k, tx - 0.9 * k, y - 23.6 * k, tx + 0.4 * k, y - 22.4 * k], i ? '#f0ead8' : '#4a3020');
  }
}

/** A stone-headed club: a grooved river stone lashed with rawhide to a short handle, a red cloth at the grip. */
function stoneClub(ctx: Ctx, x: number, y: number, k: number) {
  const x0 = x - 1 * k, y0 = y + 3 * k, x1 = x + 2.4 * k, y1 = y - 8.4 * k;
  line(ctx, x0, y0, x1, y1, WOOD_D, 1.4 * k);
  line(ctx, x0 - 0.3 * k, y0, x1 - 0.3 * k, y1, WOOD_L, 0.45 * k);
  ellipse(ctx, x1 + 0.4 * k, y1 - 0.4 * k, 2.6 * k, 1.7 * k, '#6a6660');
  ellipse(ctx, x1 - 0.2 * k, y1 - 0.9 * k, 1.8 * k, 0.9 * k, '#9a948a');
  line(ctx, x1 - 0.6 * k, y1 - 1.6 * k, x1 + 0.8 * k, y1 + 1 * k, BABICHE, 0.6 * k); // the rawhide lashing
  line(ctx, x1 + 0.4 * k, y1 - 1.8 * k, x1 - 0.4 * k, y1 + 1 * k, BABICHE, 0.5 * k);
  line(ctx, x0 + 0.2 * k, y0 - 1.2 * k, x0 + 0.6 * k, y0 - 2.6 * k, STROUD, 1.4 * k);
  fringe(ctx, x0 - 0.2 * k, y0 + 0.2 * k, x0 + 0.6 * k, y0 - 0.2 * k, 2, 2 * k, HIDE_L, 0.3 * k);
}

/** A gunstock club: a flat wooden club shaped like a musket's stock, a trade-iron blade set in its angle, brass tacks. */
function gunstock(ctx: Ctx, x: number, y: number, k: number) {
  const x0 = x - 1.2 * k, y0 = y + 3.4 * k;
  poly(ctx, [x0 - 0.8 * k, y0, x0 + 0.8 * k, y0 + 0.2 * k, x + 2.4 * k, y - 6 * k, x + 4.2 * k, y - 8.6 * k, x + 2.4 * k, y - 12.4 * k, x + 0.8 * k, y - 11 * k, x + 1.2 * k, y - 6.6 * k], WOOD);
  line(ctx, x0, y0, x + 1.2 * k, y - 10.6 * k, WOOD_L, 0.4 * k);
  poly(ctx, [x + 3.4 * k, y - 7.4 * k, x + 7.2 * k, y - 8.6 * k, x + 4.4 * k, y - 9.2 * k], IRON_L); // the blade
  line(ctx, x + 4.2 * k, y - 8.2 * k, x + 7.2 * k, y - 8.6 * k, '#f0f2f4', 0.3 * k);
  for (const t of [0.3, 0.5, 0.7]) ellipse(ctx, x0 + (x + 1.6 * k - x0) * t, y0 + (y - 10 * k - y0) * t, 0.35 * k, 0.35 * k, BRASS);
  line(ctx, x0 - 0.2 * k, y0 - 0.6 * k, x0 + 0.4 * k, y0 - 2 * k, STROUD, 1.2 * k);
}

/** A trade musket: a long barrel, a stock studded with brass tacks, held upright. */
function musket(ctx: Ctx, x: number, y: number, k: number) {
  const x0 = x - 1.6 * k, y0 = y + 6 * k, x1 = x + 2.6 * k, y1 = y - 20 * k;
  const mx = x0 + (x1 - x0) * 0.36, my = y0 + (y1 - y0) * 0.36;
  poly(ctx, [x0 - 1 * k, y0 + 0.4 * k, x0 + 1.2 * k, y0, mx + 0.6 * k, my, mx - 0.6 * k, my + 0.2 * k], WOOD); // the stock
  line(ctx, mx, my, x1, y1, IRON, 1 * k); // the barrel
  line(ctx, mx - 0.3 * k, my, x1 - 0.3 * k, y1, IRON_L, 0.3 * k);
  line(ctx, mx + 0.3 * k, my - 1 * k, x1 - 1 * k, y1 + 4 * k, WOOD_D, 0.6 * k); // the ramrod
  ellipse(ctx, mx + 0.4 * k, my + 1.2 * k, 0.8 * k, 0.6 * k, BRASS); // the lock's side plate
  for (const t of [0.3, 0.6]) ellipse(ctx, x0 + (mx - x0) * t, y0 + (my - y0) * t, 0.35 * k, 0.35 * k, BRASS);
  line(ctx, x1, y1, x1 + 0.2 * k, y1 - 0.6 * k, IRON, 0.6 * k);
}

/** A crooked knife (mookotaakan): a short curved blade at the end of a carved handle, held thumb-up. */
function crookedKnife(ctx: Ctx, x: number, y: number, k: number) {
  line(ctx, x - 0.4 * k, y + 1.6 * k, x + 2.4 * k, y - 3.6 * k, WOOD_L, 1.2 * k);
  line(ctx, x + 2.4 * k, y - 3.6 * k, x + 3.6 * k, y - 4.6 * k, WOOD, 1 * k); // the thumb rest
  curve(ctx, x + 2 * k, y - 3 * k, x + 4.6 * k, y - 4 * k, x + 5.8 * k, y - 2.2 * k, 0.7 * k, IRON_L);
  ellipse(ctx, x + 0.8 * k, y - 0.6 * k, 0.4 * k, 0.4 * k, BEAD.red);
}

/** Snowshoes carried on the back: two long-tailed frames of bent ash laced with babiche, crossed behind the shoulders. */
function snowshoe(ctx: Ctx, cx: number, cy: number, len: number, wid: number, ang: number, k: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ang);
  const L = len / 2, W = wid / 2;
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(0, -L); // the rounded toe
    ctx.bezierCurveTo(W * 1.3, -L, W * 1.1, -L * 0.1, W * 0.5, L * 0.35);
    ctx.lineTo(0, L); // the long tail
    ctx.lineTo(-W * 0.5, L * 0.35);
    ctx.bezierCurveTo(-W * 1.1, -L * 0.1, -W * 1.3, -L, 0, -L);
    ctx.closePath();
  };
  path();
  ctx.fillStyle = ink('rgba(232,218,180,0.88)');
  ctx.fill();
  ctx.save();
  path();
  ctx.clip();
  ctx.strokeStyle = ink('#a8925e');
  ctx.lineWidth = 0.28 * k;
  for (let i = -6; i <= 6; i++) { // the woven babiche
    ctx.beginPath(); ctx.moveTo(i * W * 0.4 - L, -L); ctx.lineTo(i * W * 0.4 + L, L); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i * W * 0.4 + L, -L); ctx.lineTo(i * W * 0.4 - L, L); ctx.stroke();
  }
  ctx.restore();
  // the toe and heel crossbars, the frame, and a red tuft of wool at the toe
  line(ctx, -W * 0.8, -L * 0.35, W * 0.8, -L * 0.35, ASH, 0.5 * k);
  line(ctx, -W * 0.6, L * 0.15, W * 0.6, L * 0.15, ASH, 0.5 * k);
  path();
  ctx.strokeStyle = ink(WOOD_L);
  ctx.lineWidth = 1 * k;
  ctx.stroke();
  ellipse(ctx, -W * 0.7, -L * 0.6, 0.6 * k, 0.6 * k, STROUD);
  ellipse(ctx, W * 0.7, -L * 0.6, 0.6 * k, 0.6 * k, BEAD.yellow);
  ctx.restore();
}
function snowshoesOnBack(ctx: Ctx, x: number, y: number, k: number) {
  snowshoe(ctx, x - 8.4 * k, y - 17 * k, 18 * k, 7 * k, -0.5, k);
  snowshoe(ctx, x - 5.6 * k, y - 19 * k, 18 * k, 7 * k, -0.08, k);
}

/** A small round shield of rawhide, left plain, a red wool edge and a fringe of hide along the bottom. */
function hideShield(ctx: Ctx, cx: number, cy: number, r: number, k: number) {
  ellipse(ctx, cx + 0.7 * k, cy + 0.6 * k, r, r * 1.04, HIDE_D);
  ellipse(ctx, cx, cy, r, r * 1.04, HIDE_L);
  ellipse(ctx, cx - r * 0.3, cy - r * 0.35, r * 0.45, r * 0.4, 'rgba(255,250,230,0.4)');
  ring(ctx, cx, cy, r * 0.94, r * 0.98, STROUD, 1 * k);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ellipse(ctx, cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.82, 0.3 * k, 0.3 * k, i % 3 === 0 ? BEAD.blue : BEAD.white); } // a ring of beads
  fringe(ctx, cx - r * 0.7, cy + r * 0.72, cx + r * 0.7, cy + r * 0.72, 6, 3 * k, HIDE, 0.35 * k);
}

function weapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  switch (kind) {
    case 'okihtcitaw': case 'archer': bow(ctx, x, y, k); return true;
    case 'warrior': case 'defender': stoneClub(ctx, x, y, k); return true;
    case 'swordsman': gunstock(ctx, x, y, k); return true;
    case 'giant': gunstock(ctx, x, y, k * 1.15); return true;
    case 'knight': musket(ctx, x, y, k); return true;
    case 'explorer': crookedKnife(ctx, x, y, k); return true;
  }
  return false;
}

function shield(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number): boolean {
  hideShield(ctx, x - 1.4 * k, y - 5.6 * k, (kind === 'defender' ? 5.8 : 4.8) * k, k);
  return true;
}

// ---------------------------------------------------------------- figures on foot

const LEGS = [[-2.2, -0.3, 'L'], [2.2, 0.7, 'R'], [2.2, 0.7, 'L']] as const;

/** Leggings with a beaded panel at the ankle, and soft puckered moccasins with a flower on the vamp and a fur cuff. */
function legs(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  const leg = dress(kind)[1];
  for (const [dx, dy, f] of LEGS) {
    const q = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, u0, u1, v0, v1, c);
    q(0, 1, 0.2, 1, leg);
    q(0, 1, 0.28, 0.42, VELVET); // the beaded panel at the ankle
    q(0.2, 0.4, 0.31, 0.39, BEAD.pink);
    q(0.6, 0.8, 0.31, 0.39, BEAD.blue);
    if (f === 'L') q(0, 0.16, 0.42, 1, shade(leg, 0.14)); // the seam flap
    q(0, 1, 0, 0.22, HIDE_L); // the moccasin
    q(0, 1, 0.18, 0.26, FUR); // its fur-trimmed cuff
  }
  const [fx, fy] = pt('R', x + 2.2 * k, y + 0.7 * k, 3.6 * k, 5.2 * k, 0.24, 0.1);
  flower(ctx, fx, fy, 0.55 * k, BEAD.red); // the beaded vamp
}

/** Legs in mid-stride for the runner: the near leg reaching forward, the far one pushing off behind. */
function strideLegs(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  const leg = dress(kind)[1], hip = y - 7.4 * k;
  const limb = (hx: number, hy: number, fx: number, fy: number, c: string, toe: number) => {
    const w = 1.9 * k;
    poly(ctx, [hx - w, hy, hx + w, hy, fx + w * 0.8, fy - 1 * k, fx - w * 0.8, fy - 1 * k], c);
    const ax = hx + (fx - hx) * 0.72, ay = hy + (fy - hy) * 0.72;
    poly(ctx, [ax - w * 0.9, ay - 0.9 * k, ax + w * 0.9, ay - 0.9 * k, ax + w * 0.85, ay + 0.6 * k, ax - w * 0.85, ay + 0.6 * k], VELVET);
    ellipse(ctx, ax, ay - 0.15 * k, 0.45 * k, 0.45 * k, BEAD.pink);
    // the moccasin
    poly(ctx, [fx - w * 0.9, fy - 1.4 * k, fx + w * 0.8, fy - 1.4 * k, fx + w + toe * k, fy - 0.2 * k, fx + w + toe * k, fy + 0.4 * k, fx - w * 0.9, fy + 0.4 * k], HIDE_L);
    line(ctx, fx - w * 0.9, fy - 1.4 * k, fx + w * 0.8, fy - 1.4 * k, FUR, 0.8 * k);
    ellipse(ctx, fx + w * 0.6 + toe * 0.4 * k, fy - 0.4 * k, 0.4 * k, 0.4 * k, BEAD.red);
  };
  limb(x - 1.4 * k, hip + 0.6 * k, x - 5 * k, y - 1.6 * k, shade(leg, -0.3), 0.6); // the far leg, heel lifted
  limb(x + 1.8 * k, hip + 1 * k, x + 5 * k, y + 1 * k, leg, 1.4); // the near leg, striding
}

function footUnit(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  if (kind === 'archer') quiver(ctx, x, y, k);
  if (kind === 'okihtcitaw' || kind === 'explorer') snowshoesOnBack(ctx, x, y, k);
  if (kind === 'okihtcitaw') {
    // the runner: legs in stride, the body leaning a little into the run
    strideLegs(ctx, kind, x, y, k);
    const b = figure(ctx, kind, 'cree', x + 0.4 * k, y - 7.4 * k, k, true);
    weapon(ctx, kind, b, k);
    return;
  }
  if (kind === 'explorer') { // a pack of furs bound with a tumpline
    box(ctx, x - 5.6 * k, y - 6 * k, 5 * k, 6 * k, FUR, FUR_L);
    band(ctx, x - 5.6 * k, y - 6 * k, 5 * k, 6 * k, 0.4, 0.5, HIDE_D);
  }
  const b = figure(ctx, kind, 'cree', x, y, k);
  legs(ctx, kind, x, y, k);
  if (kind === 'explorer') line(ctx, x - 5 * k, b.top + 4.2 * k, x - 7.4 * k, y - 11 * k, HIDE_D, 0.7 * k);
  weapon(ctx, kind, b, k);
  if (kind === 'defender' || kind === 'warrior' || kind === 'giant') shield(ctx, kind, b.off.x, b.off.y, k);
}

// ---------------------------------------------------------------- Plains Cree riders

/** A pad saddle of hide, stuffed with hair, its corners beaded with flowers and hung with tassels. */
function padSaddle(ctx: Ctx, sx: number, sy: number) {
  poly(ctx, [sx - 4.4, sy + 0.8, sx + 3.6, sy + 0.4, sx + 4, sy + 4.4, sx - 4, sy + 5], HIDE_L);
  poly(ctx, [sx - 4.4, sy + 0.8, sx + 3.6, sy + 0.4, sx + 3.7, sy + 1.6, sx - 4.3, sy + 2], HIDE_D);
  for (const [dx, dy] of [[-3, 3.4], [2.6, 3]] as const) {
    poly(ctx, [sx + dx - 1.4, sy + dy - 1, sx + dx + 1.4, sy + dy - 1.2, sx + dx + 1.4, sy + dy + 1.4, sx + dx - 1.4, sy + dy + 1.6], VELVET);
    flower(ctx, sx + dx, sy + dy + 0.2, 0.9, dx < 0 ? BEAD.pink : BEAD.blue);
    for (let i = 0; i < 3; i++) line(ctx, sx + dx - 0.8 + i * 0.8, sy + dy + 1.5, sx + dx - 0.9 + i * 0.8, sy + dy + 3.6, i % 2 ? STROUD : BEAD.yellow, 0.4);
  }
}

function rider(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  const knight = kind === 'knight';
  const saddle = drawHorse(ctx, x - 1, y + 3, 0.92, knight ? '#5a3a24' : '#c8a070', '#1a120c', undefined, NAVY);
  if (!knight) { // a pinto's patches
    for (const [dx, dy, rx, ry] of [[-6, -5.4, 2.8, 2], [4.4, -6.8, 2.2, 1.6], [-1.6, -3.2, 1.8, 1.2]] as const) ellipse(ctx, x - 1 + dx, y + 3 + dy, rx, ry, '#f0e8da');
  }
  padSaddle(ctx, saddle.x, saddle.y);
  // a beaded martingale across the horse's chest
  for (let i = 0; i < 4; i++) ellipse(ctx, x + 6.4 + i * 0.9, y - 6.6 + i * 1.4, 0.6, 0.6, PETALS[i]);
  const b = figure(ctx, kind, 'cree', saddle.x, saddle.y, 0.9, true);
  if (knight) musket(ctx, b.hand.x, b.hand.y + 1, 0.95);
  else bow(ctx, b.hand.x, b.hand.y + 0.6, 0.85);
}

// ---------------------------------------------------------------- the log engine

function engine(ctx: Ctx, x: number, y: number) {
  softShadow(ctx, x, y + 2, 20, 6, 0.28);
  const P3 = (u: number, v: number, z: number): Pt2 => P(x, y, u, v, z);
  const logLine = (a: Pt2, b: Pt2, w: number) => {
    line(ctx, a[0], a[1], b[0], b[1], LOG_D, w);
    line(ctx, a[0], a[1] - w * 0.25, b[0], b[1] - w * 0.25, LOG, w * 0.55);
  };
  // the two ground logs along u, the far one first
  logLine(P3(-9, -4, 0), P3(9, -4, 0), 2.4);
  // the far A-frame
  logLine(P3(-4, -3.6, 0), P3(0, -3, 11), 1.6);
  logLine(P3(4, -3.6, 0), P3(0, -3, 11), 1.6);
  // the throwing pole of spruce on its axle, cocked back, its sling hanging with a stone
  const pivot = P3(0, 0, 11), longEnd = P3(-9, 0, 19.5), shortEnd = P3(4.4, 0, 7);
  line(ctx, longEnd[0], longEnd[1], shortEnd[0], shortEnd[1], LOG_D, 1.8);
  line(ctx, longEnd[0], longEnd[1] - 0.5, shortEnd[0], shortEnd[1] - 0.5, LOG_L, 0.6);
  curve(ctx, longEnd[0], longEnd[1], longEnd[0] + 1, longEnd[1] + 4, longEnd[0] + 2.4, longEnd[1] + 6, 0.5, BABICHE);
  ellipse(ctx, longEnd[0] + 2.6, longEnd[1] + 6.4, 1.6, 1.2, HIDE_D);
  ellipse(ctx, longEnd[0] + 2.4, longEnd[1] + 5.8, 1.1, 0.8, '#8a8680');
  line(ctx, P3(0, -3.6, 11)[0], P3(0, -3.6, 11)[1], P3(0, 3.6, 11)[0], P3(0, 3.6, 11)[1], WOOD_D, 1.4); // the axle
  ellipse(ctx, pivot[0], pivot[1], 1, 0.8, BABICHE);
  // the hauling ropes from the short end down toward the crew
  for (const [u, v] of [[13, -1], [12, 5]] as const) curve(ctx, shortEnd[0], shortEnd[1], shortEnd[0] + 4, shortEnd[1] + 3, ...P3(u, v, 4.4), 0.45, BABICHE);
  // the near A-frame and ground log
  logLine(P3(-4, 3.6, 0), P3(0, 3, 11), 1.8);
  logLine(P3(4, 3.6, 0), P3(0, 3, 11), 1.8);
  logLine(P3(-9, 4, 0), P3(9, 4, 0), 2.6);
  for (const u of [-9, 9]) { const [a, b] = P3(u, 4, 0); ellipse(ctx, a, b - 0.6, 1.3, 1.3, LOG_L); ellipse(ctx, a, b - 0.6, 0.6, 0.6, LOG); }
  // lashings of rawhide at the joints
  for (const [u, v, z] of [[0, 3, 11], [0, -3, 11], [-4, 3.6, 0.6], [4, 3.6, 0.6]] as const) { const [a, b] = P3(u, v, z); ellipse(ctx, a, b, 0.9, 0.7, BABICHE); }
  // a heap of river stones
  for (let i = 0; i < 6; i++) { const [a, b] = P3(-3 + (i % 3) * 1.8, 8 + Math.floor(i / 3) * 1.4, 0); ellipse(ctx, a, b - 1 - (i < 3 ? 0 : 0.6), 1.2, 0.9, i % 2 ? '#8a8680' : '#a8a298'); }
  // the crew hauling on the ropes
  for (const [u, v] of [[14, -1], [13, 5]] as const) {
    const [px, py] = P3(u, v, 0);
    const b = figure(ctx, 'warrior', 'cree', px, py, 0.55);
    legs(ctx, 'warrior', px, py, 0.55);
    line(ctx, b.hand.x, b.hand.y, b.hand.x - 2.6, b.hand.y - 1, BABICHE, 0.45);
  }
}

// ---------------------------------------------------------------- canoes

/** A paddle dipping into the water from the gunwale. */
function paddle(ctx: Ctx, x: number, y: number, len: number, phase: number) {
  const ex = x - 2 - phase * 1.6, ey = y + len;
  line(ctx, x + 0.8, y - 2.4, ex, ey, WOOD_L, 0.7);
  ellipse(ctx, ex - 0.3, ey + 0.3, 0.9, 1.8, WOOD);
  ellipse(ctx, ex - 0.3, ey + 1.6, 1.8, 0.6, 'rgba(255,255,255,0.55)');
}

/**
 * A birch-bark canoe, `w` its half-length, `lift` how high its curved ends rise: panels of white bark sewn with spruce
 * root and their seams sealed with black spruce gum, a cedar gunwale, the crew drawn inside by `crew`.
 */
export function barkCanoe(ctx: Ctx, x: number, y: number, w: number, lift: number, crew: (top: (t: number) => number) => void, bow = BEAD.red) {
  const top = (t: number) => y - 3.4 - Math.pow(Math.abs(t), 5) * lift;
  const near: Pt2[] = [];
  for (let i = 0; i <= 20; i++) { const t = -1 + i / 10; near.push([x + t * w, top(t)]); }
  const far = near.map(([px, py], i): Pt2 => [px + (i === 0 ? 1.2 : i === 20 ? -1.2 : 0), py - 2]);
  poly(ctx, [...near.flat(), ...[...far].reverse().flat()], '#c8a070'); // the cedar ribs inside the far wall
  for (let i = 1; i < 14; i++) { const t = -0.9 + i * 0.13; line(ctx, x + t * w, top(t) - 1.9, x + t * w + 0.3, top(t) + 0.2, '#a87a4a', 0.4); }
  for (let i = 1; i < 6; i++) { const t = -0.8 + i * 0.27; line(ctx, x + t * w - 0.4, top(t) - 1.8, x + t * w + 0.6, top(t) + 0.3, WOOD_L, 0.8); } // thwarts
  crew(top);
  // the near side: bark, lit above, darker toward the keel; the ends sweep up high
  const hull: Pt2[] = [...near, [x + w * 0.9, y - 0.4], [x + w * 0.5, y + 1.8], [x, y + 2.2], [x - w * 0.5, y + 1.8], [x - w * 0.9, y - 0.4]];
  poly(ctx, hull.flat(), BIRCH_D);
  poly(ctx, [...near.flat(), x + w * 0.86, y - 1.4, x, y - 0.8, x - w * 0.86, y - 1.4], BIRCH);
  // the bark's dark lenticels, the gummed seams, the root lacing along the gunwale
  for (let i = 0; i < 18; i++) { const t = -0.86 + (i / 17) * 1.72; const py = top(t) + 1.4 + (i % 3) * 0.7; line(ctx, x + t * w - 0.8, py, x + t * w + 0.8, py, '#4a3a2a', 0.3); }
  for (const t of [-0.56, -0.18, 0.2, 0.58]) line(ctx, x + t * w, top(t) + 0.6, x + t * w - 0.4, y + 1.6, GUM, 0.7);
  for (const s of [-1, 1]) { // the gummed seam up the curved stem
    const ex = x + s * w, ey = top(s);
    curve(ctx, ex - s * 4.6, y + 0.2, ex - s * 0.4, y - 1.4, ex, ey + 0.4, 0.8, GUM);
  }
  ctx.strokeStyle = ink(WOOD); // the gunwale
  ctx.lineWidth = 1;
  ctx.beginPath();
  near.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)));
  ctx.stroke();
  for (let i = 1; i < 20; i += 1) { const [a, b] = near[i]; line(ctx, a, b - 0.2, a + 0.2, b + 0.9, '#6a5040', 0.3); }
  // a painted mark on each high end: a red disc ringed in white
  for (const s of [-1, 1]) {
    const ex = x + s * w * 0.9, ey = top(s * 0.9) + 2.2;
    ellipse(ctx, ex, ey, 1.4, 1.2, BEAD.white);
    ellipse(ctx, ex, ey, 0.9, 0.8, bow);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y + 2.2, w * 0.8, 1.8, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.stroke();
}

/** A bale of furs bound with cord. */
function bale(ctx: Ctx, x: number, y: number, s = 1, c = FUR) {
  box(ctx, x, y, 4 * s, 2.6 * s, c, shade(c, 0.2));
  band(ctx, x, y, 4 * s, 2.6 * s, 0.45, 0.6, BABICHE);
  faceQuad(ctx, 'R', x, y, 4 * s, 2.6 * s, 0.45, 0.55, 0, 1, BABICHE);
}

function boats(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  if (kind === 'boat') {
    const w = 15;
    barkCanoe(ctx, x, y, w, 7, (top) => {
      for (const [t, kd] of [[-0.45, 'archer'], [0.4, 'okihtcitaw']] as const) figure(ctx, kd, 'cree', x + t * w, top(t) + 2.4, 0.46, true);
    });
    paddle(ctx, x - 0.45 * w + 2.6, y - 6, 8, 0);
    paddle(ctx, x + 0.4 * w + 2.6, y - 6, 8, 1);
    return;
  }
  if (kind === 'ship') {
    // a larger canoe of the lakes: three paddlers and a load of fur bales
    const w = 21;
    barkCanoe(ctx, x, y, w, 8.5, (top) => {
      bale(ctx, x + 0.08 * w, top(0.08) + 1.4, 1);
      bale(ctx, x - 0.12 * w, top(-0.12) + 1.6, 0.9, FUR_L);
      for (const [t, kd] of [[-0.62, 'archer'], [-0.36, 'okihtcitaw'], [0.5, 'okihtcitaw']] as const) figure(ctx, kd, 'cree', x + t * w, top(t) + 2.4, 0.44, true);
    });
    for (const [t, p] of [[-0.62, 0], [-0.36, 1], [0.5, 0]] as const) paddle(ctx, x + t * w + 2.4, y - 5.8, 8, p);
    return;
  }
  // the warship: the great freight canoe (canot du nord), six paddlers, a steersman standing at the stern, fur bales
  // amidships and a red pennant at the bow
  const w = 28;
  barkCanoe(ctx, x, y, w, 10, (top) => {
    bale(ctx, x - 0.06 * w, top(-0.06) + 1.6, 1.1);
    bale(ctx, x + 0.1 * w, top(0.1) + 1.4, 1, FUR_L);
    const ts = [-0.6, -0.4, -0.22, 0.26, 0.44, 0.62];
    ts.forEach((t, i) => figure(ctx, i % 3 === 1 ? 'archer' : i % 3 === 2 ? 'warrior' : 'okihtcitaw', 'cree', x + t * w, top(t) + 2.4, 0.44, true));
    const c = figure(ctx, 'swordsman', 'cree', x - 0.8 * w, top(-0.8) + 3.6, 0.46, true);
    line(ctx, c.hand.x, c.hand.y, c.hand.x + 3, c.hand.y + 8, WOOD_L, 0.9); // the steering paddle
    ellipse(ctx, c.hand.x + 3.2, c.hand.y + 8.6, 0.9, 1.8, WOOD);
  }, STROUD);
  for (const [i, t] of [-0.6, -0.4, -0.22, 0.26, 0.44, 0.62].entries()) paddle(ctx, x + t * w + 2.4, y - 5.8, 8, i % 2);
  const px = x + w * 0.84, py = y - 9;
  line(ctx, px, py + 6, px, py - 12, WOOD_D, 0.8);
  poly(ctx, [px, py - 12, px + 8, py - 10.6, px + 7.4, py - 9.6, px + 8, py - 8.4, px, py - 7.6], STROUD);
  flower(ctx, px + 3.2, py - 9.8, 1.1, BEAD.white, BEAD.yellow);
}

// ---------------------------------------------------------------- buildings

/**
 * A conical lodge (miichiwaahp): a cone of spruce poles covered with rolls of birch bark (or smoked hide), held down by
 * outer poles, the poles crossing above the smoke hole, a hide hung over the door.
 */
function lodge(ctx: Ctx, cx: number, cy: number, r: number, h: number, cover: 'bark' | 'hide', roofC: string, seed = 0) {
  ellipse(ctx, cx + 1.5, cy + 1, r * 1.1, r * 0.55, 'rgba(0,0,0,0.18)');
  const ax = cx, ay = cy - h;
  // the poles standing out above the smoke hole, behind the cone
  for (let i = 0; i < 6; i++) {
    const a = -0.9 + i * 0.36 + (rand(seed, i) - 0.5) * 0.15;
    line(ctx, ax - Math.sin(a) * 0.4, ay + 1.4, ax + Math.sin(a) * 3, ay - Math.cos(a) * 3, WOOD_D, 0.55);
  }
  const base = cover === 'bark' ? roofC : HIDE;
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI * (i / n), a1 = Math.PI * ((i + 1) / n), am = (a0 + a1) / 2;
    const lit = 0.16 * Math.cos(am) - 0.02; // lit from the left
    poly(ctx, [ax, ay, cx - Math.cos(a0) * r, cy + Math.sin(a0) * r * 0.5, cx - Math.cos(a1) * r, cy + Math.sin(a1) * r * 0.5], shade(base, -lit - 0.04));
  }
  if (cover === 'bark') {
    // rows of bark rolls: seams round the cone, dark lenticels, a darker top where the smoke has stained it
    for (const t of [0.24, 0.47, 0.68]) {
      const rr = r * (1 - t);
      ring(ctx, cx, cy - h * t, rr, rr * 0.5, shade(base, -0.35), 0.5, 0, Math.PI);
    }
    for (let i = 0; i < 16; i++) {
      const t = rand(seed + 3, i) * 0.85, a = 0.15 + rand(seed + 5, i) * 2.8, rr = r * (1 - t);
      const px = cx - Math.cos(a) * rr, py = cy - h * t + Math.sin(a) * rr * 0.5;
      line(ctx, px - 0.7, py, px + 0.7, py, '#5a4a38', 0.35);
    }
  } else {
    for (const a of [0.7, 1.3, 1.9, 2.5]) line(ctx, ax, ay, cx - Math.cos(a) * r, cy + Math.sin(a) * r * 0.5, shade(HIDE, -0.22), 0.4); // the hide's seams
  }
  // smoke-darkened top
  poly(ctx, [ax, ay, cx - r * 0.3, cy - h * 0.7 + r * 0.06, cx, cy - h * 0.7 + r * 0.15, cx + r * 0.3, cy - h * 0.7 + r * 0.06], cover === 'bark' ? shade(base, -0.25) : SMOKE);
  // the outer poles holding the cover down
  for (const a of [0.45, 1.15, 2.65]) line(ctx, ax + (Math.cos(a) > 0 ? -0.3 : 0.3), ay + 0.6, cx - Math.cos(a) * r * 1.02, cy + Math.sin(a) * r * 0.51, shade(WOOD, 0.1), 0.45);
  // the door, facing us a little to the right, its hide flap pinned aside
  const da = 1.85, dx = cx - Math.cos(da) * r, dy = cy + Math.sin(da) * r * 0.5, dh = Math.min(6, h * 0.42);
  poly(ctx, [dx - 2, dy, dx + 2, dy - 0.2, dx + 0.6, dy - dh, dx - 0.8, dy - dh], '#1e140c');
  poly(ctx, [dx - 2, dy, dx - 0.4, dy, dx - 0.2, dy - dh * 0.95, dx - 0.8, dy - dh], cover === 'bark' ? HIDE_D : SMOKE);
  smoke(ctx, ax + 0.6, ay - 3, 0.9);
}

/**
 * A log cabin of squared spruce logs: notched at the corners, a bark-slab roof, a plank door at the gable end and a
 * small window, a stone chimney at the back. Half-length A along u, half-width B, walls H high, roof rising R.
 */
function cabin(ctx: Ctx, cx: number, cy: number, A: number, B: number, H: number, R: number, roofC: string, chimney = true) {
  ellipse(ctx, cx + 1.5, cy + 1.5, A * 1.3 + 2, (A + B) * 0.55, 'rgba(0,0,0,0.16)');
  const Q = (u: number, v: number, z: number) => P(cx, cy, u, v, z);
  const quad = (pts: [number, number, number][], c: string) => poly(ctx, pts.flatMap(([u, v, z]) => Q(u, v, z)), c);
  // the far roof slope, and the chimney behind
  quad([[-A - 0.6, -B - 0.8, H - 0.4], [A + 0.6, -B - 0.8, H - 0.4], [A + 0.6, 0, H + R], [-A - 0.6, 0, H + R]], shade(roofC, -0.3));
  if (chimney) {
    const [hx, hy] = Q(-A + 1.4, -B * 0.4, H + R * 0.6);
    poly(ctx, [hx - 1.4, hy + 2, hx + 1.4, hy + 2, hx + 1.2, hy - 4, hx - 1.2, hy - 4], '#8a8478');
    for (let i = 0; i < 3; i++) line(ctx, hx - 1.3, hy - i * 2, hx + 1.3, hy - i * 2 - 0.2, '#5a5650', 0.35);
    smoke(ctx, hx + 0.4, hy - 6, 0.9);
  }
  // the long wall facing lower left: logs in rows
  quad([[-A, B, 0], [A, B, 0], [A, B, H], [-A, B, H]], LOG);
  for (let z = 0.9; z < H; z += 1.1) line(ctx, ...Q(-A, B, z), ...Q(A, B, z), LOG_D, 0.45);
  for (let z = 0.4; z < H; z += 1.1) line(ctx, ...Q(-A + 0.3, B, z), ...Q(A - 0.3, B, z), LOG_L, 0.25);
  // a window with a parchment pane
  quad([[-A * 0.2 - 1.2, B, H * 0.38], [-A * 0.2 + 1.2, B, H * 0.38], [-A * 0.2 + 1.2, B, H * 0.72], [-A * 0.2 - 1.2, B, H * 0.72]], '#e8d8a8');
  line(ctx, ...Q(-A * 0.2, B, H * 0.38), ...Q(-A * 0.2, B, H * 0.72), WOOD_D, 0.35);
  // the gable end, the log ends sticking out at the corner
  quad([[A, -B, 0], [A, B, 0], [A, B, H], [A, -B, H]], shade(LOG, -0.18));
  quad([[A, -B, H], [A, B, H], [A, 0, H + R]], shade(LOG_L, -0.2));
  for (let z = 0.9; z < H; z += 1.1) line(ctx, ...Q(A, -B, z), ...Q(A, B, z), LOG_D, 0.45);
  for (let z = H + 0.9; z < H + R - 0.4; z += 1.1) { const f = 1 - (z - H) / R; line(ctx, ...Q(A, -B * f, z), ...Q(A, B * f, z), shade(LOG_D, 0.1), 0.35); }
  for (let z = 0.5; z < H; z += 1.1) { const [ex, ey] = Q(A + 0.5, B + 0.5, z); ellipse(ctx, ex, ey, 0.6, 0.55, LOG_L); ellipse(ctx, ex, ey, 0.25, 0.25, LOG_D); }
  // the plank door
  const dw = Math.min(1.5, B * 0.45);
  quad([[A, dw, 0], [A, -dw, 0], [A, -dw, H * 0.86], [A, dw, H * 0.86]], WOOD_D);
  line(ctx, ...Q(A, 0, 0), ...Q(A, 0, H * 0.86), shade(WOOD_D, -0.3), 0.3);
  // the near roof slope: slabs of bark held by poles
  quad([[-A - 0.6, B + 0.8, H - 0.4], [A + 0.6, B + 0.8, H - 0.4], [A + 0.6, 0, H + R], [-A - 0.6, 0, H + R]], roofC);
  for (let i = 1; i < 7; i++) { const u = -A - 0.6 + ((2 * A + 1.2) * i) / 7; line(ctx, ...Q(u, B + 0.8, H - 0.4), ...Q(u, 0, H + R), shade(roofC, -0.2), 0.35); }
  for (const t of [0.3, 0.7]) line(ctx, ...Q(-A - 0.6, (B + 0.8) * (1 - t), H - 0.4 + (R + 0.4) * t), ...Q(A + 0.6, (B + 0.8) * (1 - t), H - 0.4 + (R + 0.4) * t), WOOD_D, 0.6);
  line(ctx, ...Q(-A - 0.6, 0, H + R), ...Q(A + 0.6, 0, H + R), WOOD_D, 0.8);
}

/** A rack of poles hung with split whitefish drying over a smoky fire. */
function fishRack(ctx: Ctx, cx: number, cy: number, s = 1) {
  const a = P(cx, cy, -3.4 * s, 0), b = P(cx, cy, 3.4 * s, 0), H = 6.6 * s;
  for (const p of [a, b]) { line(ctx, p[0], p[1], p[0], p[1] - H, WOOD, 0.8); line(ctx, p[0] - 0.8, p[1] - H - 0.8, p[0], p[1] - H, WOOD, 0.5); line(ctx, p[0] + 0.8, p[1] - H - 0.8, p[0], p[1] - H, WOOD, 0.5); }
  line(ctx, a[0], a[1] - H, b[0], b[1] - H, WOOD_D, 0.8);
  for (let i = 0; i < 6; i++) {
    const t = (i + 0.5) / 6, px = a[0] + (b[0] - a[0]) * t, py = a[1] - H + (b[1] - a[1]) * t;
    // a split fish: the pale flesh, a darker skin edge
    poly(ctx, [px - 0.9, py + 0.4, px + 0.9, py + 0.4, px + 0.6, py + 3.8 * s, px, py + 4.6 * s, px - 0.6, py + 3.8 * s], i % 2 ? '#e8a07a' : '#f0b890');
    line(ctx, px, py + 0.6, px, py + 4 * s, '#b86a4a', 0.3);
  }
  // the little smudge fire below
  const [fx, fy] = P(cx, cy, 0, 2 * s);
  ellipse(ctx, fx, fy, 1.6, 0.7, '#3a2a1a');
  poly(ctx, [fx - 0.7, fy, fx, fy - 1.8, fx + 0.7, fy], '#e86a1a');
  smoke(ctx, fx, fy - 3, 0.8);
}

/** A canoe drawn up and turned over on two trestles, its bottom up and its curved ends dipping. */
function canoeOnRack(ctx: Ctx, cx: number, cy: number, s = 1) {
  for (const u of [-3.4, 3.4]) {
    const [px, py] = P(cx, cy, u * s, 0);
    line(ctx, px - 1.2, py + 0.6, px, py - 3.4 * s - 0.4, WOOD, 0.6);
    line(ctx, px + 1.2, py - 0.6, px, py - 3.4 * s - 0.4, WOOD, 0.6);
  }
  const N = 14, e = (t: number) => Math.pow(Math.abs(t * 2 - 1), 3);
  const gun: Pt2[] = [], keel: Pt2[] = [], far: Pt2[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, u = (-7.6 + t * 15.2) * s, w = Math.sin(Math.PI * t) * 1.8 * s;
    gun.push(P(cx, cy, u, w, (3.6 - e(t) * 2) * s));
    far.push(P(cx, cy, u, -w, (3.6 - e(t) * 2) * s));
    keel.push(P(cx, cy, u, 0, (5.4 - e(t) * 3.8) * s));
  }
  poly(ctx, [...far.flat(), ...[...keel].reverse().flat()], BIRCH_D); // the far side, in shade
  poly(ctx, [...gun.flat(), ...[...keel].reverse().flat()], BIRCH);
  for (let i = 2; i < N - 1; i += 3) line(ctx, ...gun[i], ...keel[i], GUM, 0.45); // the gummed seams
  for (let i = 1; i < N; i += 2) { const [a, b] = gun[i], [c, d] = keel[i]; line(ctx, (a + c) / 2 - 0.6, (b + d) / 2, (a + c) / 2 + 0.6, (b + d) / 2, '#4a3a2a', 0.3); }
  ctx.strokeStyle = ink(WOOD);
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  gun.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)));
  ctx.stroke();
  line(ctx, ...keel[0], ...gun[0], GUM, 0.6);
  line(ctx, ...keel[N], ...gun[N], GUM, 0.6);
}

/** A run of palisade stakes from (u0, v0) to (u1, v1). */
function palisade(ctx: Ctx, cx: number, cy: number, u0: number, v0: number, u1: number, v1: number, h: number, seed = 0) {
  const len = Math.hypot(u1 - u0, v1 - v0), n = Math.max(2, Math.round(len / 1.5));
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = u0 + (u1 - u0) * t, v = v0 + (v1 - v0) * t;
    const hh = h + (rand(seed + 7, i) - 0.5) * 1.4;
    const [bx, by] = P(cx, cy, u, v), [, ty] = P(cx, cy, u, v, hh);
    line(ctx, bx, by, bx, ty + 0.8, LOG_D, 1.5);
    line(ctx, bx - 0.35, by, bx - 0.35, ty + 0.8, i % 2 ? LOG : LOG_L, 0.7);
    poly(ctx, [bx - 0.75, ty + 1, bx + 0.75, ty + 1, bx, ty - 0.6], LOG_L);
  }
  for (const f of [0.3, 0.75]) line(ctx, ...P(cx, cy, u0, v0, h * f), ...P(cx, cy, u1, v1, h * f), LOG_D, 0.6);
}

/**
 * The gathering lodge (shaapuhtuwaan): a long lodge with a door at each end, its frame of poles along a ridge covered
 * with bark and hide; half-length A, half-width B, height H.
 */
function longLodge(ctx: Ctx, cx: number, cy: number, A: number, B: number, H: number, roofC: string) {
  ellipse(ctx, cx + 2, cy + 2, A * 1.3, (A + B) * 0.5, 'rgba(0,0,0,0.17)');
  const Q = (u: number, v: number, z: number) => P(cx, cy, u, v, z);
  // the poles out above the ridge
  for (let i = 0; i <= 6; i++) { const u = -A + 2 + ((2 * A - 4) * i) / 6; const [a, b] = Q(u, 0, H); line(ctx, a, b, a - 1.4 + (i % 2) * 2.8, b - 3.6, WOOD_D, 0.55); }
  // the far slope, then the near slope in strips, each a sheet of bark or a hide
  poly(ctx, [...Q(-A, -B, 0), ...Q(A, -B, 0), ...Q(A, 0, H), ...Q(-A, 0, H)], shade(roofC, -0.3));
  const n = 8;
  for (let i = 0; i < n; i++) {
    const u0 = -A + (2 * A * i) / n, u1 = -A + (2 * A * (i + 1)) / n;
    const c = i % 3 === 1 ? HIDE : i % 3 === 2 ? shade(roofC, -0.06) : roofC;
    poly(ctx, [...Q(u0, B, 0), ...Q(u1, B, 0), ...Q(u1, 0, H), ...Q(u0, 0, H)], c);
    line(ctx, ...Q(u1, B, 0), ...Q(u1, 0, H), shade(roofC, -0.35), 0.4);
  }
  for (const t of [0.35, 0.7]) line(ctx, ...Q(-A, B * (1 - t), H * t), ...Q(A, B * (1 - t), H * t), WOOD_D, 0.55); // the tie poles
  for (let i = 0; i < 20; i++) { const u = -A + rand(9, i) * 2 * A, t = rand(11, i) * 0.8; const [px, py] = Q(u, B * (1 - t), H * t); line(ctx, px - 0.6, py, px + 0.6, py, '#5a4a38', 0.3); }
  // the smoke-dark ridge with two smoke holes
  poly(ctx, [...Q(-A, 1.4, H - 1.4), ...Q(A, 1.4, H - 1.4), ...Q(A, 0, H), ...Q(-A, 0, H)], shade(roofC, -0.32));
  for (const u of [-A * 0.4, A * 0.4]) { const [hx, hy] = Q(u, 0, H); ellipse(ctx, hx, hy, 1.4, 0.7, '#1e140c'); smoke(ctx, hx, hy - 2.4, 1); }
  // the near end: a half cone, its door hung with a hide
  const end: Pt2[] = [];
  for (let s = 0; s <= 10; s++) { const a = Math.PI * (s / 10); end.push(Q(A + Math.sin(a) * B * 0.9, -Math.cos(a) * B, 0)); }
  poly(ctx, [...end.flat(), ...Q(A, 0, H)], shade(roofC, -0.16));
  for (let s = 1; s < 10; s += 2) { const a = Math.PI * (s / 10); line(ctx, ...Q(A, 0, H), ...Q(A + Math.sin(a) * B * 0.9, -Math.cos(a) * B, 0), shade(roofC, -0.36), 0.35); }
  const [dx, dy] = Q(A + B * 0.9, 0, 0);
  poly(ctx, [dx - 1.8, dy, dx + 1.8, dy, dx + 0.6, dy - H * 0.5, dx - 0.6, dy - H * 0.5], '#1e140c');
  poly(ctx, [dx - 1.8, dy, dx - 0.2, dy, dx - 0.2, dy - H * 0.48, dx - 0.6, dy - H * 0.5], HIDE_D);
  // a ribbon of floral beadwork hung over the door, for the gathering
  const [rx, ry] = Q(A + B * 0.6, 0, H * 0.62);
  poly(ctx, [rx - 2.4, ry, rx + 2.4, ry - 0.2, rx + 2.4, ry + 1.4, rx - 2.4, ry + 1.6], VELVET);
  for (let i = 0; i < 3; i++) flower(ctx, rx - 1.6 + i * 1.6, ry + 0.7, 0.6, PETALS[i]);
}

/** A flagpole with a plain red flag. */
function flag(ctx: Ctx, x: number, y: number, h: number) {
  line(ctx, x, y, x, y - h, WOOD_D, 0.8);
  poly(ctx, [x, y - h, x + 7.6, y - h + 0.6, x + 7, y - h + 2.4, x + 7.6, y - h + 4.4, x, y - h + 4.6], STROUD);
  poly(ctx, [x, y - h, x + 7.6, y - h + 0.6, x + 7.4, y - h + 1.4, x, y - h + 1], shade(STROUD, 0.15));
  ellipse(ctx, x, y - h - 0.4, 0.6, 0.6, WOOD_L);
}

/** The capital: a palisaded fort by the lake, the long gathering lodge, a store cabin, lodges and a flag. */
function capital(ctx: Ctx, x: number, y: number, roofC: string) {
  palisade(ctx, x, y, -18, -10, 15, -10, 9, 3);
  palisade(ctx, x, y, -18, -10, -18, 9, 9, 5);
  // the corner bastion: a square log blockhouse at the back corner, the flag over it
  cabin(ctx, x - 13.5, y - 15, 3.4, 3.4, 9, 3.6, shade(roofC, -0.1), false);
  flag(ctx, ...P(x, y, -13.5, -10.5, 12.4), 12);
  lodge(ctx, x + 9, y - 9, 6, 11, 'bark', roofC, 7);
  cabin(ctx, x - 10, y + 1, 4.6, 3.6, 5, 3.4, shade(roofC, -0.05));
  longLodge(ctx, x + 2, y + 1, 9, 5.4, 10.5, roofC);
  fishRack(ctx, x - 2, y + 12, 0.85);
  // the front palisade on the left, with its gate standing open toward the lodge
  palisade(ctx, x, y, -18, 10, -10, 10, 9, 11);
  for (const u of [-10, -5]) { const [gx, gy] = P(x, y, u, 10); line(ctx, gx, gy, gx, gy - 11, LOG_D, 1.8); line(ctx, gx - 0.4, gy, gx - 0.4, gy - 11, LOG_L, 0.6); }
  line(ctx, ...P(x, y, -10, 10, 10.4), ...P(x, y, -5, 10, 10.4), LOG_D, 1.4);
}

function building(ctx: Ctx, x: number, y: number, big: boolean, roofIn: string, isCapital: boolean) {
  const roofC = /^#[0-9a-f]{6}$/i.test(roofIn) ? roofIn : '#c8b088';
  if (big && isCapital) return capital(ctx, x, y, roofC);
  if (big) {
    // a lodge circle: a big bark lodge, a hide lodge, a cabin and a fish rack
    lodge(ctx, x - 7, y - 6, 5.6, 10.6, 'hide', roofC, 2);
    cabin(ctx, x + 6, y - 5, 4.4, 3.4, 4.6, 3.2, roofC);
    lodge(ctx, x - 1, y + 1, 7.4, 13.4, 'bark', roofC, 4);
    fishRack(ctx, x + 8, y + 5, 0.8);
    return;
  }
  const v = ((Math.round(x) * 7 + Math.round(y) * 3) % 7 + 7) % 7;
  switch (v) {
    case 0: case 6: lodge(ctx, x, y, 6.4, 12, 'bark', roofC, Math.round(x)); break;
    case 1: lodge(ctx, x, y, 5.8, 11, 'hide', roofC, Math.round(y)); break;
    case 2: cabin(ctx, x, y, 5, 3.6, 4.6, 3.2, roofC); break;
    case 3: lodge(ctx, x - 2, y - 1, 5.6, 10.6, 'bark', roofC, 3); fishRack(ctx, x + 6, y + 3, 0.7); break;
    case 4: cabin(ctx, x - 1, y - 1, 4, 3.2, 4.2, 3, roofC); canoeOnRack(ctx, x + 2, y + 6, 0.6); break;
    default: lodge(ctx, x - 3, y - 2, 5, 9.4, 'hide', roofC, 5); lodge(ctx, x + 4, y + 2, 5.2, 10, 'bark', roofC, 6); break;
  }
}

// ---------------------------------------------------------------- trees

/** Black spruce: very narrow and spindly, short drooping branches, a dense club of growth at the top. */
function blackSpruce(ctx: Ctx, x: number, y: number, k: number, g: string, seed: number) {
  const h = (22 + rand(seed, 1) * 6) * k;
  const lean = (rand(seed, 2) - 0.5) * 1.6 * k;
  line(ctx, x, y, x + lean, y - h, '#3a2e24', 1 * k);
  const tiers = 13;
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers, ty = y - h * (0.12 + t * 0.78), tx = x + lean * (0.12 + t * 0.78);
    const span = (2.6 - t * 1.2 + rand(seed, i + 5) * 0.8) * k;
    for (const s of [-1, 1]) {
      if (rand(seed + s, i) < 0.18) continue; // gaps: the scraggly look
      const ex = tx + s * span, ey = ty + 1.2 * k;
      line(ctx, tx, ty - 0.4 * k, ex, ey, shade(g, -0.25), 0.9 * k);
      ellipse(ctx, tx + s * span * 0.55, ty + 0.5 * k, span * 0.55, 0.9 * k, i % 2 ? g : shade(g, 0.06));
    }
  }
  // the club at the crown: a dense knot of short tufts near the top, then a thin leader
  const cx = x + lean * 0.9, cy = y - h * 0.88;
  for (let j = 0; j < 6; j++) {
    const px = cx + (rand(seed + 11, j) - 0.5) * 1.4 * k, py = cy + 2.4 * k - j * 1.1 * k, rx = (1.9 - j * 0.18) * k;
    ellipse(ctx, px + 0.3 * k, py + 0.35 * k, rx, 0.95 * k, shade(g, -0.28));
    ellipse(ctx, px, py, rx * 0.92, 0.85 * k, j % 2 ? g : shade(g, 0.1));
  }
  line(ctx, cx, cy - 3.6 * k, cx + 0.2 * k, cy - 6 * k, g, 0.7 * k);
}

/** White birch: a clump of chalk-white stems marked with black, an airy crown of small leaves, green or turned yellow. */
function whiteBirch(ctx: Ctx, x: number, y: number, k: number, seed: number, autumn: boolean) {
  const leafC = autumn ? '#e8c43a' : '#7ab048';
  const stems = [[-1.4, -0.8], [0.8, 0.5], [2.2, -0.4]] as const;
  const tops: Pt2[] = [];
  stems.forEach(([dx, lean], i) => {
    const h = (16 + rand(seed, i) * 5) * k;
    const bx = x + dx * k, tx = bx + lean * 2.4 * k, ty = y - h;
    line(ctx, bx, y, tx, ty, '#e8e2d6', 1.4 * k);
    line(ctx, bx + 0.4 * k, y, tx + 0.4 * k, ty, '#b8b0a2', 0.4 * k); // the shaded side
    for (let j = 0; j < 6; j++) { // the black marks
      const t = 0.1 + j * 0.14 + rand(seed + i, j) * 0.05, px = bx + (tx - bx) * t, py = y + (ty - y) * t;
      line(ctx, px - 0.6 * k, py, px + 0.5 * k, py - 0.2 * k, '#2a2420', 0.35 * k);
    }
    line(ctx, bx, y - 0.6 * k, bx, y - 2.4 * k, '#3a3430', 1.2 * k); // the dark base of the trunk
    tops.push([tx, ty]);
  });
  // the crown: loose clusters of small leaves round each stem's top
  for (const [i, [tx, ty]] of tops.entries()) {
    for (let j = 0; j < 9; j++) {
      const a = rand(seed + i * 3, j) * Math.PI * 2, rr = rand(seed + i * 5, j) * 3.6 * k;
      const px = tx + Math.cos(a) * rr, py = ty + 2.6 * k + Math.sin(a) * rr * 0.8;
      ellipse(ctx, px + 0.3 * k, py + 0.3 * k, 1.5 * k, 1.1 * k, shade(leafC, -0.25));
      ellipse(ctx, px, py, 1.3 * k, 1 * k, j % 3 === 0 ? shade(leafC, 0.15) : leafC);
    }
  }
}

/** Tamarack: a narrow, open cone of soft needle tufts on upswept twigs, feathery green, or gold in the fall. */
function tamarack(ctx: Ctx, x: number, y: number, k: number, seed: number, autumn: boolean) {
  const c = autumn ? '#e4ac32' : '#8ab85a';
  const h = (20 + rand(seed, 3) * 4) * k;
  line(ctx, x, y, x, y - h, '#5a4232', 1 * k);
  const tiers = 12;
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers, ty = y - h * (0.16 + t * 0.8), span = (4.6 - t * 3.8 + rand(seed, i) * 1.2) * k;
    for (const s of [-1, 1]) {
      if (rand(seed + s * 3, i) < 0.15) continue;
      const ex = x + s * span, ey = ty - 1.4 * k;
      line(ctx, x, ty + 0.6 * k, ex, ey, '#5a4232', 0.35 * k);
      for (let j = 0; j < 3; j++) { // soft tufts along the twig
        const f = 0.35 + j * 0.3, px = x + s * span * f, py = ty + 0.6 * k - 2 * k * f;
        ellipse(ctx, px + 0.25 * k, py + 0.35 * k, 1.1 * k, 0.8 * k, shade(c, -0.25));
        ellipse(ctx, px, py, 1 * k, 0.7 * k, (i + j) % 3 ? c : shade(c, 0.14));
      }
    }
  }
  ellipse(ctx, x, y - h + 0.4 * k, 0.7 * k, 1.4 * k, c);
}

function tree(ctx: Ctx, x: number, y: number, k: number, Pal: BiomePalette, variant: number) {
  const seed = Math.round(x) * 13 + Math.round(y) * 7 + variant;
  const h = rand(seed, 3);
  const type = ['spruce', 'spruce', 'birch', 'spruce', 'tamarack', 'birch', 'spruce', 'tamarack'][(variant + Math.floor(h * 8)) % 8];
  const g = mix(Pal.forest ?? '#235a38', '#1a3a34', 0.35);
  if (type === 'spruce') return blackSpruce(ctx, x, y, k, g, seed);
  if (type === 'birch') return whiteBirch(ctx, x, y, k * 0.95, seed, h < 0.3);
  return tamarack(ctx, x, y, k * 0.95, seed, h < 0.55);
}

// ---------------------------------------------------------------- registration

registerArt('cree', {
  cape: () => null, // no European-style cloak behind the heavy ranks
  unit(ctx, kind, x, y) {
    switch (kind) {
      case 'okihtcitaw': case 'warrior': case 'archer': case 'defender': case 'swordsman': case 'explorer':
        footUnit(ctx, kind, x, y, 1);
        return true;
      case 'giant': footUnit(ctx, kind, x, y, 1.4); return true;
      case 'rider': case 'knight': rider(ctx, kind, x, y); return true;
      case 'catapult': engine(ctx, x, y); return true;
      case 'boat': case 'ship': case 'warship': boats(ctx, kind, x, y); return true;
      default: return false;
    }
  },
  dress,
  torso,
  head,
  weapon,
  shield,
  building,
  tree,
});

// The Asante Empire's own art (see render/tribeart): the Akan forest kingdom of Kumasi, late seventeenth to nineteenth
// century. Nobles wear kente, the strip-woven silk-and-cotton cloth of gold, green, red and black, wrapped toga-style
// with the right shoulder bare; elders wear russet adinkra cloth stamped with black symbols. Warriors wear the
// batakari, a smock of striped cotton sewn all over with leather amulets (sebe), some cased in gold; their caps are
// hung with more of them. Gold is everywhere at court: cast-gold armlets and rings, gold-leaf headbands, and the
// Asantehene's crown studded with gold ornaments. Arms are long trade muskets (flintlocks with a leopard-skin lock
// cover), spears with small round leather shields, and the afena, the curved state sword whose grip is a gilded
// dumbbell of two balls. Horses were few in the forest: the rider is modest, the knight a noble riding under the great
// state umbrella (kyiniɛ) held up by a bearer. The siege piece is a trade cannon on a wooden carriage; the boats are
// the surf canoes of the coast, painted and flagged, driven by kneeling paddlers with three-pointed blades.
// Towns are courtyard houses: four open-fronted rooms round a court, steep thatched roofs, walls polished red-brown
// below and white above, the lower walls modelled in deep relief with spirals and arabesques. The capital is the
// palace at Kumasi with the Golden Stool on its dais under a great umbrella, the fontomfrom drums beside it. Forests
// are giant odum (iroko) trees, plantain clumps and kola trees heavy with pods.
import type { BiomePalette } from '../../data/tribes';
import type { UnitKind } from '../../game/types';
import { registerArt, type Body } from '../tribeart';
import { band, box, ellipse, faceQuad, ink, line, mix, poly, rand, shade, softShadow } from '../prims';
import type { Ctx } from '../prims';
import { drawHorse, figure } from '../units';

// ---------------------------------------------------------------- colours

const SKIN = '#5a3820';
const GOLD = '#e8b424'; // kente gold
const GOLD_L = '#f8d860';
const GOLD_D = '#a87a10';
const METAL = '#f0c43a'; // cast gold
const GREEN = '#1f7a3a';
const RED = '#b8281e';
const RED_D = '#7a1810';
const BLACK = '#1e1610';
const BLUE = '#2a4a8a';
const SMOCK = '#d8cba4'; // undyed batakari cotton
const SMOCK_R = '#a8582e'; // batakari dyed red-brown
const INDIGO = '#2a3452';
const LEATHER = '#7a3a1a';
const LEATHER_D = '#4a220e';
const RUSSET = '#7a3420'; // adinkra cloth
const CLAY_R = '#9a4428'; // polished red wall clay
const CLAY_W = '#ece0c4'; // white wall clay
const THATCH = '#b88a4a';
const WOOD = '#7a5030';
const WOOD_D = '#4a2e1a';
const WOOD_L = '#a8784a';
const IRON = '#4e5056';
const STEEL = '#a8aeb4';
const LEOP = '#d8a650';
const WHITE = '#f0e8d4';

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
/** An elliptical outline. */
function ring(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string, w: number) {
  ctx.strokeStyle = ink(color);
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
  ctx.stroke();
}
/** Clip to a polygon (call inside save/restore). */
function clipPoly(ctx: Ctx, pts: number[]) {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.clip();
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
/** The quad of one face of a box between heights v0 (bottom) and v1 (top). */
const faceQ = (f: 'L' | 'R', x: number, y: number, w: number, h: number, v0 = 0, v1 = 1, u0 = 0, u1 = 1): Quad =>
  [fpt(f, x, y, w, h, u0, v1), fpt(f, x, y, w, h, u1, v1), fpt(f, x, y, w, h, u1, v0), fpt(f, x, y, w, h, u0, v0)];

// ---------------------------------------------------------------- kente

/** Kente colourways: the weft blocks cycle through these. */
const KENTE_ROYAL = [GOLD, GREEN, RED, GOLD, BLACK, GREEN];
const KENTE_RICH = [GOLD, RED, GREEN, BLUE, GOLD, BLACK];
const KENTE_PLAIN = [GOLD, GREEN, GOLD, RED];

/**
 * Kente on a quad: narrow strips running down the cloth, sewn edge to edge, each strip a chequer of warp-striped
 * sections (gold ground, thin coloured pin-stripes) and weft blocks (solid colour crossed by fine bars), offset strip
 * by strip so the blocks make the cloth's checkerboard; dark seams between the strips. `dim` darkens the shaded side.
 */
function kente(ctx: Ctx, q: Quad, cols: number, rows: number, pal: readonly string[], k: number, dim = 0, seed = 0) {
  const d = (c: string) => (dim ? shade(c, dim) : c);
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const s0 = i / cols, s1 = (i + 1) / cols, t0 = j / rows, t1 = (j + 1) / rows;
    if ((i + j) % 2 === 0) { // a weft block
      const c = pal[(i * 3 + j * 2 + seed) % pal.length], bar = c === GOLD ? BLACK : c === BLACK ? GOLD : c === GREEN ? GOLD : BLACK;
      qpoly(ctx, q, [[s0, t0], [s1, t0], [s1, t1], [s0, t1]], d(c));
      for (const f of [0.3, 0.7]) qline(ctx, q, s0 + 0.01, t0 + (t1 - t0) * f, s1 - 0.01, t0 + (t1 - t0) * f, d(bar), 0.22 * k);
      if ((i + j + seed) % 4 === 0) { const m = (s0 + s1) / 2, tm = (t0 + t1) / 2; qpoly(ctx, q, [[m - (s1 - s0) * 0.22, tm], [m, t0 + (t1 - t0) * 0.2], [m + (s1 - s0) * 0.22, tm], [m, t1 - (t1 - t0) * 0.2]], d(c === GOLD ? RED : GOLD)); } // a little woven diamond
    } else { // a warp-striped section: gold ground with fine coloured stripes
      qpoly(ctx, q, [[s0, t0], [s1, t0], [s1, t1], [s0, t1]], d(GOLD));
      const sc = pal[(i + j + 1 + seed) % pal.length] === GOLD ? GREEN : pal[(i + j + 1 + seed) % pal.length];
      for (const f of [0.28, 0.5, 0.72]) qline(ctx, q, s0 + (s1 - s0) * f, t0, s0 + (s1 - s0) * f, t1, d(f === 0.5 ? sc : BLACK), 0.2 * k);
    }
  }
  for (let i = 1; i < cols; i++) qline(ctx, q, i / cols, 0, i / cols, 1, d(shade(GOLD_D, -0.3)), 0.18 * k); // the seams
}

// ---------------------------------------------------------------- dress

type Garb = 'kente' | 'royal' | 'adinkra' | 'batakari' | 'warsmock';
const garbOf = (kind: UnitKind): Garb => {
  switch (kind) {
    case 'giant': return 'royal';
    case 'knight': return 'kente';
    case 'explorer': return 'adinkra';
    case 'defender': case 'asafo': return 'warsmock';
    default: return 'batakari';
  }
};

/** [torso, legs, sleeves]: smocks for the fighters (with sleeves of the same cloth), cloth over bare skin for the rest. */
function dress(kind: UnitKind): [string, string, string] {
  switch (garbOf(kind)) {
    case 'royal': return [GOLD, SKIN, SKIN];
    case 'kente': return [GOLD, SKIN, SKIN];
    case 'adinkra': return [RUSSET, SKIN, SKIN];
    case 'warsmock': return [SMOCK_R, SKIN, SMOCK_R];
    default: return [SMOCK, SKIN, SMOCK];
  }
}

/** A leather amulet (sebe): a little sewn square packet, some cased in gold foil or red cloth, with a stitched edge. */
function amulet(ctx: Ctx, x: number, y: number, k: number, i: number, big = 1) {
  const c = i % 5 === 0 ? METAL : i % 4 === 1 ? RED : i % 3 === 2 ? LEATHER_D : LEATHER;
  const s = 0.7 * k * big;
  poly(ctx, [x - s, y - s * 0.9, x + s, y - s * 1.1, x + s, y + s * 0.9, x - s, y + s * 1.1], c);
  poly(ctx, [x - s, y - s * 0.9, x + s, y - s * 1.1, x + s * 0.8, y - s * 0.6, x - s * 0.8, y - s * 0.4], shade(c, 0.25));
  line(ctx, x - s * 0.6, y + s * 0.5, x + s * 0.6, y + s * 0.3, shade(c, -0.35), 0.18 * k);
}

/** Amulets scattered over a quad, in a staggered grid. */
function amulets(ctx: Ctx, q: Quad, cols: number, rows: number, k: number, seed: number, big = 1) {
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const s = (i + 0.5 + (j % 2) * 0.4) / (cols + 0.4), t = (j + 0.5) / rows;
    if (rand(seed, i * 7 + j) < 0.18) continue;
    const [px, py] = qp(q, s, t);
    amulet(ctx, px, py, k, i + j * 3 + seed, big);
  }
}

/**
 * The batakari: a smock of narrow cotton strips (fine dark stripes running down), flaring out over the hips, its body
 * sewn with amulets; a cord of more amulets across the chest. `c` the cloth, `n` how thickly it is hung.
 */
function batakari(ctx: Ctx, x: number, y: number, w: number, h: number, k: number, c: string, n: number, len = 3.6) {
  // the flared skirt of the smock, over the hips
  const sw = w * 1.18, sy = y + len * k, sh = (len + 0.2) * k;
  faceQuad(ctx, 'L', x, sy, sw, sh, 0, 1, 0, 1, c);
  faceQuad(ctx, 'R', x, sy, sw, sh, 0, 1, 0, 1, c);
  for (const f of ['L', 'R'] as const) {
    for (let i = 1; i < 7; i++) faceQuad(ctx, f, x, sy, sw, sh, i / 7, i / 7 + 0.025, 0, 1, i % 2 ? INDIGO : shade(c, -0.22)); // the strip stripes
    faceQuad(ctx, f, x, sy, sw, sh, 0, 1, 0, 0.1, shade(c, -0.3)); // the hem
  }
  // stripes down the body
  for (const f of ['L', 'R'] as const) for (let i = 1; i < 6; i++) faceQuad(ctx, f, x, y, w, h, i / 6, i / 6 + 0.03, 0, 1, i % 2 ? INDIGO : shade(c, -0.2));
  // the neck opening, a dark V
  fpoly(ctx, 'R', x, y, w, h, [[0, 1], [0.34, 1], [0.12, 0.72]], shade(c, -0.45));
  // amulets: on the body and the skirt
  if (n > 0) {
    amulets(ctx, faceQ('L', x, y, w, h, 0.12, 0.86), 2, Math.max(1, n - 1), k, 3);
    amulets(ctx, faceQ('R', x, y, w, h, 0.12, 0.86, 0.1, 1), 3, n, k, 5);
    amulets(ctx, faceQ('R', x, sy, sw, sh, 0.25, 0.9), 4, 1, k, 9);
    amulets(ctx, faceQ('L', x, sy, sw, sh, 0.25, 0.9), 3, 1, k, 11);
  }
  // a cord across the chest strung with amulet packets
  const a = fpt('R', x, y, w, h, 0.05, 0.92), b = fpt('R', x, y, w, h, 0.95, 0.2);
  line(ctx, a[0], a[1], b[0], b[1], LEATHER_D, 0.4 * k);
  for (let i = 1; i < 4; i++) amulet(ctx, a[0] + (b[0] - a[0]) * i / 4, a[1] + (b[1] - a[1]) * i / 4 + 0.4 * k, k * 0.9, i * 2 + 1);
}

/**
 * Kente worn toga-style: a long cloth wrapped round the body to the shins, its end thrown over the left shoulder, the
 * right shoulder and chest left bare. `pal` its colourway, `len` how far it hangs below the hip.
 */
function toga(ctx: Ctx, x: number, y: number, w: number, h: number, k: number, pal: readonly string[], len: number, adinkra = false) {
  const sw = w * 1.08, sy = y + len * k, sh = (len + 0.2) * k;
  const cloth = (q: Quad, cols: number, rows: number, dim: number, seed: number) => {
    if (adinkra) {
      qpoly(ctx, q, [[0, 0], [1, 0], [1, 1], [0, 1]], dim ? shade(RUSSET, dim) : RUSSET);
      for (let i = 1; i < cols; i++) qline(ctx, q, i / cols, 0, i / cols, 1, shade(RUSSET, -0.35 + dim), 0.25 * k); // stitched strips
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) adinkraMark(ctx, q, (i + 0.5) / cols, (j + 0.5) / rows, k, (i + j + seed) % 3, dim);
    } else kente(ctx, q, cols, rows, pal, k, dim, seed);
  };
  // the skirt
  cloth(faceQ('L', x, sy, sw, sh), 3, 3, 0.04, 1);
  cloth(faceQ('R', x, sy, sw, sh), 3, 3, -0.22, 2);
  // the upper body: the left side fully wrapped; on the right, only below the diagonal from the left shoulder
  cloth(faceQ('L', x, y, w, h), 3, 3, 0.04, 3);
  ctx.save();
  clipPoly(ctx, [...fpt('R', x, y, w, h, 0, 1.02), ...fpt('R', x, y, w, h, 0.28, 1.02), ...fpt('R', x, y, w, h, 1.02, 0.3), ...fpt('R', x, y, w, h, 1.02, -0.02), ...fpt('R', x, y, w, h, 0, -0.02)]);
  cloth(faceQ('R', x, y, w, h), 3, 3, -0.22, 4);
  ctx.restore();
  // the folds of the upper edge, crossing the chest
  const a = fpt('R', x, y, w, h, 0.28, 1), b = fpt('R', x, y, w, h, 1, 0.3);
  line(ctx, a[0], a[1], b[0], b[1], shade(adinkra ? RUSSET : GOLD_D, -0.2), 0.6 * k);
  line(ctx, a[0] + 0.2 * k, a[1] + 0.6 * k, b[0] - 0.2 * k, b[1] + 0.6 * k, adinkra ? shade(RUSSET, 0.2) : GOLD_L, 0.3 * k);
  // the cloth's end hangs down the back from the left shoulder
  const s0 = fpt('L', x, y, w, h, 0.1, 1);
  poly(ctx, [s0[0], s0[1], s0[0] - 1.8 * k, s0[1] + 2 * k, s0[0] - 2 * k, y + len * k, s0[0] - 0.4 * k, y + len * k - 0.6 * k], adinkra ? shade(RUSSET, -0.1) : shade(pal[1], -0.1));
}

/** A stamped adinkra symbol in black at (s, t) of a quad: gye nyame-like spiral, a sankofa heart, or a cross of four. */
function adinkraMark(ctx: Ctx, q: Quad, s: number, t: number, k: number, kind: number, dim: number) {
  const [px, py] = qp(q, s, t), c = shade(BLACK, dim > 0 ? 0 : 0);
  if (kind === 0) { ring(ctx, px, py, 0.7 * k, 0.6 * k, c, 0.25 * k); ellipse(ctx, px, py, 0.22 * k, 0.22 * k, c); }
  else if (kind === 1) { // a heart (sankofa)
    poly(ctx, [px, py + 0.7 * k, px - 0.8 * k, py - 0.1 * k, px - 0.4 * k, py - 0.6 * k, px, py - 0.2 * k, px + 0.4 * k, py - 0.6 * k, px + 0.8 * k, py - 0.1 * k], c);
  } else { line(ctx, px - 0.7 * k, py, px + 0.7 * k, py, c, 0.25 * k); line(ctx, px, py - 0.7 * k, px, py + 0.7 * k, c, 0.25 * k); for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) ellipse(ctx, px + dx * 0.45 * k, py + dy * 0.45 * k, 0.16 * k, 0.16 * k, c); }
}

/** Gold at the bare chest and arms: a necklace of cast-gold beads with a disc pendant (the soul-washer's badge). */
function goldNecklace(ctx: Ctx, x: number, y: number, w: number, h: number, k: number, heavy: boolean) {
  for (let i = 0; i < 6; i++) { const [px, py] = fpt('R', x, y, w, h, 0.12 + i * 0.14, 0.92 - Math.sin((i / 5) * Math.PI) * 0.12); ellipse(ctx, px, py, 0.4 * k, 0.4 * k, i % 2 ? METAL : GOLD_L); }
  const [cx, cy] = fpt('R', x, y, w, h, 0.42, 0.66);
  ellipse(ctx, cx, cy, (heavy ? 1.4 : 1) * k, (heavy ? 1.4 : 1) * k, METAL);
  ring(ctx, cx, cy, (heavy ? 0.9 : 0.6) * k, (heavy ? 0.9 : 0.6) * k, GOLD_D, 0.25 * k);
  ellipse(ctx, cx - 0.3 * k, cy - 0.3 * k, 0.3 * k, 0.3 * k, '#fff4c0');
  if (heavy) for (let i = 0; i < 7; i++) { const [px, py] = fpt('R', x, y, w, h, 0.05 + i * 0.13, 0.8 - Math.sin((i / 6) * Math.PI) * 0.3); ellipse(ctx, px, py, 0.5 * k, 0.45 * k, i % 2 ? METAL : GOLD_D); }
}

/** Gold armlets on the near arm (the arm box is at x + 6k, hip + 0.6k, 2.8k x 7k). */
function armlets(ctx: Ctx, x: number, hip: number, k: number, n: number) {
  const ax = x + 6 * k, ay = hip + 0.6 * k;
  for (let i = 0; i < n; i++) {
    faceQuad(ctx, 'R', ax, ay, 2.8 * k, 7 * k, 0, 1, 0.62 - i * 0.12, 0.7 - i * 0.12, METAL);
    faceQuad(ctx, 'L', ax, ay, 2.8 * k, 7 * k, 0, 1, 0.62 - i * 0.12, 0.7 - i * 0.12, GOLD_L);
  }
}

function torso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const k = w / 10;
  switch (garbOf(kind)) {
    case 'royal': // the Asantehene: the richest kente to the ankles, gold at the chest, armlets
      toga(ctx, x, y, w, h, k, KENTE_RICH, 4.8);
      goldNecklace(ctx, x, y, w, h, k, true);
      armlets(ctx, x, y, k, 3);
      return;
    case 'kente':
      toga(ctx, x, y, w, h, k, kind === 'knight' ? KENTE_ROYAL : KENTE_PLAIN, kind === 'knight' ? 2.6 : 2.2);
      goldNecklace(ctx, x, y, w, h, k, false);
      if (kind === 'knight') armlets(ctx, x, y, k, 2);
      return;
    case 'adinkra':
      toga(ctx, x, y, w, h, k, KENTE_PLAIN, 3.4, true);
      return;
    case 'warsmock':
      batakari(ctx, x, y, w, h, k, SMOCK_R, 3, 3.4);
      return;
    default:
      batakari(ctx, x, y, w, h, k, SMOCK, kind === 'archer' ? 1 : kind === 'swordsman' ? 3 : 2, kind === 'swordsman' ? 3.8 : 3.2);
      if (kind === 'swordsman') { // a kente sash knotted at the hip
        const q = faceQ('R', x, y, w, h, 0.02, 0.2);
        kente(ctx, q, 4, 1, KENTE_PLAIN, k, -0.1);
        const [px, py] = fpt('R', x, y, w, h, 0.85, 0.08);
        poly(ctx, [px, py, px + 1.2 * k, py + 3.4 * k, px - 0.4 * k, py + 3.2 * k], GREEN);
      }
  }
}

/** Faces: short black hair; the king with a short beard; white clay dots for the asafo man. */
function face(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  if (kind === 'giant') { R(0.3, 0.7, 0, 0.14, '#140c08'); R(0.38, 0.62, 0.16, 0.2, '#3a2010'); return; }
  if (kind === 'asafo') { R(0.14, 0.24, 0.5, 0.56, WHITE); R(0.76, 0.86, 0.5, 0.56, WHITE); }
  R(0.38, 0.62, 0.16, 0.2, '#3a2010');
}

// ---------------------------------------------------------------- headgear

/** An eagle feather from its quill (x0, y0) to its tip: a white vane, the tip dark brown, a pale quill. */
function eagleFeather(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, k: number) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  const P = (t: number, o: number): [number, number] => [x0 + dx * t + nx * o * k, y0 + dy * t + ny * o * k];
  poly(ctx, [...P(0.05, 0), ...P(0.25, -1), ...P(0.85, -1.1), ...P(1, 0), ...P(0.85, 0.9), ...P(0.25, 0.8)], WHITE);
  poly(ctx, [...P(0.62, -1.08), ...P(0.85, -1.1), ...P(1, 0), ...P(0.85, 0.9), ...P(0.62, 0.86)], '#3a2416');
  poly(ctx, [...P(0.05, 0), ...P(0.25, 0.8), ...P(0.85, 0.9), ...P(1, 0)], 'rgba(0,0,0,0.12)');
  line(ctx, ...P(0, 0), ...P(0.95, 0), '#c8b890', 0.3 * k);
}

/** A close cap of cotton or leather, the shape of the skull, hung round the brim with amulets. */
function amuletCap(ctx: Ctx, x: number, top: number, k: number, hw: number, c: string, n: number, extra?: 'horns' | 'feather' | 'gold') {
  const bw = hw + 0.8 * k, by = top + 3.2 * k;
  box(ctx, x, by, bw, 3 * k, c, shade(c, 0.12));
  ellipse(ctx, x, by - 3.2 * k - 0.2 * k, bw * 0.42, bw * 0.2, shade(c, 0.18)); // the rounded crown
  for (const f of ['L', 'R'] as const) for (let i = 1; i < 5; i++) faceQuad(ctx, f, x, by, bw, 3 * k, i / 5, i / 5 + 0.04, 0, 1, shade(c, -0.25));
  band(ctx, x, by, bw, 3 * k, 0, 0.22, shade(c, -0.3));
  if (extra === 'horns') { // a pair of short horns bound with red cloth, standing up from the crown
    for (const s of [-1, 1]) {
      const bx = x + s * bw * 0.22, byy = by - 3.6 * k;
      curve(ctx, bx, byy, bx + s * 1.2 * k, byy - 3 * k, bx + s * 0.2 * k, byy - 5.4 * k, 1.1 * k, '#d8c8a0');
      line(ctx, bx - 0.6 * k, byy - 0.4 * k, bx + 0.6 * k, byy - 0.6 * k, RED, 0.8 * k);
    }
  }
  if (extra === 'feather') eagleFeather(ctx, x - bw * 0.3, by - 3.4 * k, x - bw * 0.3 - 3 * k, by - 12 * k, k);
  if (extra === 'gold') for (let i = 0; i < 3; i++) { const [px, py] = fpt('R', x, by, bw, 3 * k, 0.2 + i * 0.3, 0.6); ellipse(ctx, px, py, 0.55 * k, 0.55 * k, METAL); }
  // amulets sewn on the cap, and a few hanging at the back of the head
  for (let i = 0; i < n; i++) {
    const [px, py] = fpt('R', x, by, bw, 3 * k, (i + 0.5) / n, extra === 'gold' ? 0.25 : 0.55);
    if (extra !== 'gold') amulet(ctx, px, py, k * 0.75, i + 1);
  }
  for (let i = 0; i < Math.min(3, n); i++) {
    const [px, py] = fpt('L', x, by, bw, 3 * k, 0.1 + i * 0.2, 0);
    line(ctx, px, py, px, py + (1 + i * 0.6) * k, LEATHER_D, 0.2 * k);
    amulet(ctx, px, py + (1.5 + i * 0.6) * k, k * 0.8, i + 3);
  }
}

/** A gold-leaf headband (abotire) with a cast ornament at the front. */
function goldBand(ctx: Ctx, x: number, top: number, k: number, hw: number, tall = 1.6) {
  const bw = hw + 0.6 * k, by = top + 3 * k;
  box(ctx, x, by, bw, tall * k, BLACK, BLACK);
  band(ctx, x, by, bw, tall * k, 0.12, 0.88, METAL);
  for (const f of ['L', 'R'] as const) for (let i = 0; i < 4; i++) faceQuad(ctx, f, x, by, bw, tall * k, 0.1 + i * 0.25, 0.18 + i * 0.25, 0.3, 0.7, GOLD_D);
  const [px, py] = fpt('R', x, by, bw, tall * k, 0.35, 0.5);
  poly(ctx, [px - 1.2 * k, py, px, py - 2.6 * k, px + 1.2 * k, py, px, py + 0.8 * k], METAL);
  ellipse(ctx, px, py - 0.6 * k, 0.4 * k, 0.4 * k, '#fff4c0');
}

/**
 * The Asantehene's crown: a tall band of black velvet studded all over with gold, gold ornaments standing up round the
 * rim (cast birds and horns), a gold disc at the front.
 */
function asantehene(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const bw = hw + 1.4 * k, by = top + 3.2 * k, ch = 5.4 * k;
  box(ctx, x, by, bw, ch, '#24161a', '#2e1e22');
  band(ctx, x, by, bw, ch, 0, 0.16, METAL);
  band(ctx, x, by, bw, ch, 0.86, 1, METAL);
  for (const f of ['L', 'R'] as const) for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) { // gold studs in rows
    const [px, py] = fpt(f, x, by, bw, ch, 0.12 + i * 0.25 + (j % 2) * 0.1, 0.32 + j * 0.2);
    ellipse(ctx, px, py, 0.42 * k, 0.42 * k, f === 'L' ? GOLD_L : METAL);
  }
  // ornaments round the rim: little gold horns and a bird at the front
  for (let i = 0; i < 5; i++) {
    const a = Math.PI * (0.1 + i * 0.2), px = x - Math.cos(a) * bw * 0.48, py = by - ch + bw * 0.12 * Math.sin(a);
    poly(ctx, [px - 0.6 * k, py, px + 0.6 * k, py, px + (i % 2 ? 0.2 : -0.2) * k, py - (i === 2 ? 1.6 : 2.4) * k], METAL);
    ellipse(ctx, px, py - (i === 2 ? 1.6 : 2.4) * k, 0.35 * k, 0.35 * k, GOLD_L);
  }
  const [bx, byy] = fpt('R', x, by, bw, ch, 0.3, 1);
  ellipse(ctx, bx, byy - 2.2 * k, 1.4 * k, 0.9 * k, METAL); // a gold bird with spread wings
  poly(ctx, [bx - 3 * k, byy - 3.4 * k, bx, byy - 2.2 * k, bx + 3 * k, byy - 3.4 * k, bx + 1.6 * k, byy - 1.8 * k, bx - 1.6 * k, byy - 1.8 * k], GOLD_L);
  ellipse(ctx, bx + 0.6 * k, byy - 3.2 * k, 0.6 * k, 0.6 * k, METAL);
  // the gold disc at the brow
  const [dx, dy] = fpt('R', x, by, bw, ch, 0.38, 0.5);
  ellipse(ctx, dx, dy, 1.3 * k, 1.3 * k, METAL);
  ring(ctx, dx, dy, 0.8 * k, 0.8 * k, GOLD_D, 0.3 * k);
  ellipse(ctx, dx - 0.3 * k, dy - 0.3 * k, 0.35 * k, 0.35 * k, '#fff4c0');
}

function head(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  switch (kind) {
    case 'warrior': amuletCap(ctx, x, top, k, hw, '#8a6a42', 3); break;
    case 'archer': amuletCap(ctx, x, top, k, hw, SMOCK, 2); break;
    case 'defender': amuletCap(ctx, x, top, k, hw, SMOCK_R, 4, 'horns'); break;
    case 'swordsman': amuletCap(ctx, x, top, k, hw, '#6a4a2a', 3, 'feather'); break;
    case 'asafo': amuletCap(ctx, x, top, k, hw, INDIGO, 3, 'feather'); break;
    case 'knight': goldBand(ctx, x, top, k, hw, 2); break;
    case 'rider': amuletCap(ctx, x, top, k, hw, '#8a6a42', 2, 'gold'); break;
    case 'giant': asantehene(ctx, x, top, k, hw); break;
    case 'explorer': amuletCap(ctx, x, top, k, hw, RUSSET, 0); break;
    default: amuletCap(ctx, x, top, k, hw, '#8a6a42', 2);
  }
}

// ---------------------------------------------------------------- weapons and shields

/** A spear: a wooden shaft with a long iron head, bound below the head with a tassel of red cloth. */
function spear(ctx: Ctx, x: number, y: number, k: number, len = 28) {
  const x0 = x - 1.8 * k, y0 = y + 6 * k, x1 = x + 3 * k, y1 = y - (len - 6) * k;
  line(ctx, x0, y0, x1, y1, WOOD, 1.2 * k);
  line(ctx, x0 - 0.4 * k, y0, x1 - 0.4 * k, y1, WOOD_L, 0.4 * k);
  poly(ctx, [x1 + 0.3 * k, y1 - 6.4 * k, x1 - 1.2 * k, y1 - 2.4 * k, x1 - 0.2 * k, y1 + 0.4 * k], shade(STEEL, 0.15));
  poly(ctx, [x1 + 0.3 * k, y1 - 6.4 * k, x1 + 1.2 * k, y1 - 2.2 * k, x1 - 0.2 * k, y1 + 0.4 * k], shade(STEEL, -0.25));
  line(ctx, x1 - 0.7 * k, y1 + 1.2 * k, x1 + 0.5 * k, y1 + 0.8 * k, RED, 1 * k);
  poly(ctx, [x1 - 0.4 * k, y1 + 1.2 * k, x1 - 1.6 * k, y1 + 4 * k, x1 + 0.2 * k, y1 + 3 * k], RED);
}

/**
 * A long trade musket (a Danish or English flintlock), from the butt (bx, by) to the muzzle (mx, my): a plain wooden
 * stock, a long iron barrel bound with brass bands, the lock wrapped in a leopard-skin cover against the forest damp.
 */
function musket(ctx: Ctx, bx: number, by: number, mx: number, my: number, k: number) {
  const dx = mx - bx, dy = my - by, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const P = (t: number, o: number): [number, number] => [bx + ux * t + nx * o, by + uy * t + ny * o];
  poly(ctx, [...P(0, -1.3 * k), ...P(len * 0.28, -0.45 * k), ...P(len * 0.88, -0.35 * k), ...P(len * 0.88, 0.45 * k), ...P(len * 0.3, 0.7 * k), ...P(len * 0.16, 1.6 * k), ...P(0, 1.5 * k)], WOOD);
  line(ctx, ...P(0.4 * k, -0.9 * k), ...P(len * 0.28, -0.25 * k), WOOD_L, 0.4 * k);
  line(ctx, ...P(0, -1.3 * k), ...P(0, 1.5 * k), '#c8a040', 0.6 * k); // the butt plate
  line(ctx, ...P(len * 0.24, -0.5 * k), ...P(len, -0.5 * k), IRON, 0.85 * k);
  line(ctx, ...P(len * 0.3, -0.7 * k), ...P(len, -0.7 * k), STEEL, 0.25 * k);
  for (const t of [0.5, 0.68, 0.84]) line(ctx, ...P(len * t, -0.95 * k), ...P(len * t, 0.5 * k), '#c8a040', 0.35 * k); // brass bands
  // the lock under its leopard-skin cover
  const [lx, ly] = P(len * 0.3, 0);
  ellipse(ctx, lx, ly, 1.6 * k, 1.1 * k, LEOP);
  for (const [ox, oy] of [[-0.6, -0.3], [0.5, 0.2], [0, 0.6]] as const) ellipse(ctx, lx + ox * k, ly + oy * k, 0.22 * k, 0.22 * k, BLACK);
  curve(ctx, ...P(len * 0.22, 0.8 * k), ...P(len * 0.26, 1.8 * k), ...P(len * 0.32, 0.7 * k), 0.3 * k, '#c8a040'); // the trigger guard
}

/** A powder horn and a gourd of shot on a strap. */
function powderHorn(ctx: Ctx, x: number, y: number, k: number) {
  curve(ctx, x - 1.6 * k, y - 0.6 * k, x, y + 1.4 * k, x + 1.8 * k, y + 0.2 * k, 1.1 * k, '#e0d0a8');
  ellipse(ctx, x + 1.9 * k, y + 0.2 * k, 0.45 * k, 0.45 * k, '#c8a040');
}

/**
 * An asafo company flag: bright cotton with a border of contrasting triangles and an appliqué figure in the field (here
 * a lion beside a small Union-style canton, as the coastal companies sewed them), streaming from a pole.
 */
function asafoFlag(ctx: Ctx, x: number, y: number, w: number, h: number, k: number, wave = 0.8, field = RED) {
  const P = (u: number, v: number): [number, number] => [x - u * w, y + v * h + Math.sin(u * 3.4) * wave * k];
  const pts = [[0, 0], [0.5, 0], [1, 0], [1, 1], [0.5, 1], [0, 1]].flatMap(([u, v]) => P(u, v));
  poly(ctx, pts, field);
  ctx.save();
  clipPoly(ctx, pts);
  // the border of triangles
  for (let i = 0; i < 8; i++) {
    const u0 = i / 8, u1 = (i + 1) / 8;
    poly(ctx, [...P(u0, 0), ...P(u1, 0), ...P((u0 + u1) / 2, 0.14)], i % 2 ? GOLD : WHITE);
    poly(ctx, [...P(u0, 1), ...P(u1, 1), ...P((u0 + u1) / 2, 0.86)], i % 2 ? WHITE : GOLD);
  }
  // the canton: a small square with a cross
  poly(ctx, [...P(0.04, 0.16), ...P(0.3, 0.16), ...P(0.3, 0.5), ...P(0.04, 0.5)], BLUE);
  line(ctx, ...P(0.04, 0.33), ...P(0.3, 0.33), WHITE, 0.6 * k);
  line(ctx, ...P(0.17, 0.16), ...P(0.17, 0.5), WHITE, 0.6 * k);
  // the appliqué lion, in yellow cloth: body, head with mane, legs, raised tail
  const [lx, ly] = P(0.64, 0.56);
  ellipse(ctx, lx, ly, 2.6 * k, 1.3 * k, GOLD);
  ellipse(ctx, lx - 2.6 * k, ly - 0.8 * k, 1.5 * k, 1.5 * k, shade(GOLD, -0.2)); // mane
  ellipse(ctx, lx - 2.8 * k, ly - 0.8 * k, 0.9 * k, 0.9 * k, GOLD);
  for (const d of [-1.8, -0.8, 1, 2]) line(ctx, lx + d * k, ly + 0.8 * k, lx + d * k, ly + 2.4 * k, GOLD, 0.6 * k);
  curve(ctx, lx + 2.4 * k, ly - 0.2 * k, lx + 3.8 * k, ly - 1 * k, lx + 3.4 * k, ly - 2.6 * k, 0.4 * k, GOLD);
  ellipse(ctx, lx - 3.1 * k, ly - 1 * k, 0.2 * k, 0.2 * k, BLACK);
  // a fold of shade
  poly(ctx, [...P(0.45, -0.1), ...P(0.6, -0.1), ...P(0.6, 1.1), ...P(0.45, 1.1)], 'rgba(0,0,0,0.12)');
  ctx.restore();
  // the pole with a gold finial
  line(ctx, x, y - 1 * k, x, y + h + 18 * k, WOOD_D, 0.9 * k);
  ellipse(ctx, x, y - 1.6 * k, 0.8 * k, 0.8 * k, METAL);
}

/** A plain curved bow with an arrow on the string; a quiver of leather on the back. */
function bow(ctx: Ctx, x: number, y: number, k: number) {
  const gx = x + 1 * k, gy = y - 1 * k;
  const top = { x: gx - 2 * k, y: gy - 12 * k }, bot = { x: gx - 2 * k, y: gy + 10 * k };
  for (const [c, wd] of [[WOOD_D, 1.7], [WOOD_L, 0.9]] as const) {
    curve(ctx, gx, gy, gx + 3.2 * k, gy - 6.6 * k, top.x, top.y, wd * k, c);
    curve(ctx, gx, gy, gx + 3.2 * k, gy + 5.6 * k, bot.x, bot.y, wd * k, c);
  }
  const nock = { x: gx - 5.4 * k, y: gy - 0.4 * k };
  ctx.strokeStyle = ink('#e8dcc0'); ctx.lineWidth = 0.4 * k;
  ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(nock.x, nock.y); ctx.lineTo(bot.x, bot.y); ctx.stroke();
  line(ctx, gx + 0.2 * k, gy - 1.4 * k, gx + 0.2 * k, gy + 1 * k, LEATHER, 1.5 * k);
  const tx = gx + 7.6 * k, ty = gy - 1.4 * k;
  line(ctx, nock.x, nock.y, tx, ty, '#c8a868', 0.6 * k);
  poly(ctx, [tx, ty - 0.8 * k, tx + 2.4 * k, ty + 0.1 * k, tx, ty + 0.8 * k], IRON);
}

/**
 * The afena, the curved sword of state: a broad iron blade bending back like a sickle and widening toward its tip, the
 * blade pierced with small holes; the grip a dumbbell, a ball at either end, the whole hilt covered in gold leaf. `s`
 * scales it; the sword is held upright in the hand at (x, y).
 */
function afena(ctx: Ctx, x: number, y: number, k: number, s = 1, gilt = true) {
  const g = k * s, hilt = gilt ? METAL : WOOD;
  // the blade: rising from the upper ball and curving back over the shoulder
  const bx = x + 0.2 * g, by = y - 3.4 * g;
  const pts: number[] = [];
  const spine = (t: number): [number, number] => [bx + Math.sin(t * 1.4) * 5 * g - t * t * 1.6 * g, by - t * 11 * g];
  const width = (t: number) => (0.5 + t * 1.6) * g;
  const N = 10;
  for (let i = 0; i <= N; i++) { const t = i / N, [px, py] = spine(t); pts.push(px - width(t) * 0.6, py); }
  const [tx, ty] = spine(1);
  pts.push(tx + 1.4 * g, ty - 1.4 * g); // the blunt rounded tip, swept forward
  for (let i = N; i >= 0; i--) { const t = i / N, [px, py] = spine(t); pts.push(px + width(t) * 0.8, py + width(t) * 0.2); }
  poly(ctx, pts, shade(STEEL, -0.08));
  const lit: number[] = [];
  for (let i = 0; i <= N; i++) { const t = i / N, [px, py] = spine(t); lit.push(px - width(t) * 0.6, py); }
  for (let i = N; i >= 0; i--) { const t = i / N, [px, py] = spine(t); lit.push(px + 0.1 * g, py); }
  poly(ctx, lit, shade(STEEL, 0.22));
  for (const t of [0.45, 0.62, 0.78]) { const [px, py] = spine(t); ellipse(ctx, px + 0.2 * g, py, 0.35 * g, 0.35 * g, '#2a2a30'); } // the piercings
  // the hilt: two gold balls with the grip between
  line(ctx, x, y - 2.6 * g, x, y + 2.6 * g, gilt ? GOLD_D : WOOD_D, 1.3 * g);
  for (const dy of [-3, 3]) {
    ellipse(ctx, x, y + dy * g, 1.6 * g, 1.6 * g, hilt);
    ellipse(ctx, x - 0.5 * g, y + dy * g - 0.5 * g, 0.6 * g, 0.6 * g, gilt ? '#fff4c0' : WOOD_L);
    ring(ctx, x, y + dy * g, 1.6 * g, 1.6 * g, gilt ? GOLD_D : WOOD_D, 0.25 * g);
  }
  if (gilt) for (const dy of [-1.2, 0, 1.2]) line(ctx, x - 0.6 * g, y + dy * g, x + 0.6 * g, y + dy * g, METAL, 0.3 * g);
}

/** A walking staff topped with a carved finial, a gourd tied below it. */
function staff(ctx: Ctx, x: number, y: number, k: number) {
  line(ctx, x - 1 * k, y + 7 * k, x + 2.2 * k, y - 15 * k, WOOD, 1.1 * k);
  ellipse(ctx, x + 2.3 * k, y - 15.6 * k, 1 * k, 1 * k, WOOD_D);
  ellipse(ctx, x + 2.8 * k, y - 10 * k, 1.6 * k, 2 * k, '#c89a50');
  ellipse(ctx, x + 2.8 * k, y - 12.2 * k, 0.6 * k, 0.6 * k, shade('#c89a50', -0.3));
  line(ctx, x + 1.6 * k, y - 12 * k, x + 2.8 * k, y - 12.4 * k, BLACK, 0.4 * k);
}

/**
 * A small round shield of thick hide, seen turned a little: a raised rim, a ring of brass studs and a central boss; the
 * richer ones with a ring of red cloth and a gold boss.
 */
function roundShield(ctx: Ctx, x: number, y: number, r: number, k: number, rich = false) {
  ellipse(ctx, x + 0.8 * k, y + 0.4 * k, r * 0.78, r, LEATHER_D); // its thickness
  ellipse(ctx, x, y, r * 0.78, r, LEATHER);
  ellipse(ctx, x - 0.3 * k, y - 0.3 * k, r * 0.62, r * 0.82, shade(LEATHER, 0.12));
  if (rich) ring(ctx, x - 0.2 * k, y - 0.2 * k, r * 0.5, r * 0.66, RED, 0.7 * k);
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; ellipse(ctx, x + Math.cos(a) * r * 0.66, y + Math.sin(a) * r * 0.86, 0.32 * k, 0.32 * k, '#d8b048'); }
  ellipse(ctx, x, y, r * 0.26, r * 0.32, rich ? METAL : '#c8a040');
  ellipse(ctx, x - 0.2 * r, y - 0.2 * r, r * 0.1, r * 0.12, '#fff4c0');
  ring(ctx, x, y, r * 0.78, r, LEATHER_D, 0.5 * k);
}

function weapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  switch (kind) {
    case 'asafo': // a long trade musket at the shoulder, the company's flag in the other hand
      asafoFlag(ctx, b.off.x - 1.4 * k, b.off.y - 30 * k, 12 * k, 8 * k, k);
      musket(ctx, x - 0.6 * k, y + 6 * k, x + 4.6 * k, y - 24 * k, k);
      powderHorn(ctx, b.off.x + 1.6 * k, b.off.y - 1 * k, k);
      return true;
    case 'warrior':
      spear(ctx, x, y, k, 26);
      roundShield(ctx, b.off.x - 1 * k, b.off.y - 2 * k, 3.8 * k, k);
      return true;
    case 'archer':
      bow(ctx, x, y, k);
      return true;
    case 'defender': // the shield is drawn afterwards, like everyone's
      spear(ctx, x, y, k, 30);
      return true;
    case 'swordsman': // a war afena, its grip plain wood
      afena(ctx, x, y, k, 0.9, false);
      roundShield(ctx, b.off.x - 1 * k, b.off.y - 2 * k, 4 * k, k, true);
      return true;
    case 'giant': // the state sword, its hilt in gold
      afena(ctx, x, y, k, 1.25, true);
      return true;
    case 'explorer':
      staff(ctx, x, y, k);
      return true;
  }
  return false;
}

function shield(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number): boolean {
  if (kind === 'asafo' || kind === 'archer' || kind === 'explorer') return true; // no shield
  if (kind === 'giant') { // a gold-cased amulet bundle at the hip rather than a shield
    for (let i = 0; i < 3; i++) amulet(ctx, x - 0.6 * k + i * 1.2 * k, y + 1 * k + (i % 2) * 0.6 * k, k * 1.2, 5);
    return true;
  }
  roundShield(ctx, x - 1 * k, y - 2 * k, kind === 'defender' ? 5.6 * k : 4.2 * k, k, kind === 'defender' || kind === 'swordsman');
  return true;
}

// ---------------------------------------------------------------- horsemen

/** The state umbrella (kyiniɛ): a great dome of cloth in bands of colour with a deep fringed valance, a carved gold
 *  finial on top, on a stout pole. Its rim is centred on (x, y), `r` its radius. */
function umbrella(ctx: Ctx, x: number, y: number, r: number, k: number, finial: 'bird' | 'stool' = 'bird', pole = 0) {
  if (pole > 0) line(ctx, x + 0.6 * k, y, x + 0.6 * k, y + pole, WOOD_D, 1.2 * k);
  const h = r * 0.62, ry = r * 0.3;
  // the dome: segments in red, gold, green, black
  const cols = [RED, GOLD, GREEN, RED, BLACK, GOLD];
  for (let i = 0; i < cols.length; i++) {
    const a0 = Math.PI + (i / cols.length) * Math.PI, a1 = Math.PI + ((i + 1) / cols.length) * Math.PI;
    const p0 = [x + Math.cos(a0) * r, y - Math.sin(a0) * -ry * 0], p1 = [x + Math.cos(a1) * r, y];
    const c = i >= cols.length / 2 ? shade(cols[i], -0.18) : cols[i];
    ctx.beginPath();
    ctx.moveTo(x, y - h - ry * 0.2);
    ctx.quadraticCurveTo(p0[0] - (p0[0] - x) * 0.1, y - h * 0.9, p0[0], p0[1]);
    ctx.lineTo(p1[0], p1[1]);
    ctx.quadraticCurveTo(p1[0] - (p1[0] - x) * 0.1, y - h * 0.9, x, y - h - ry * 0.2);
    ctx.closePath();
    ctx.fillStyle = ink(c);
    ctx.fill();
  }
  // the valance: a deep band round the rim, its hem cut in tongues, a gold fringe
  const vt = y, vb = y + r * 0.34;
  ctx.beginPath();
  ctx.ellipse(x, vt, r, ry, 0, 0, Math.PI);
  ctx.lineTo(x - r, vb);
  ctx.ellipse(x, vb, r, ry, 0, Math.PI, 0, true);
  ctx.closePath();
  ctx.fillStyle = ink(RED_D);
  ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.ellipse(x, vt, r, ry, 0, 0, Math.PI); ctx.lineTo(x - r, vb); ctx.ellipse(x, vb, r, ry, 0, Math.PI, 0, true); ctx.closePath(); ctx.clip();
  for (let i = 0; i < 9; i++) { // kente panels round the valance
    const a0 = (i / 9) * Math.PI, a1 = ((i + 0.55) / 9) * Math.PI;
    const q: Quad = [[x + Math.cos(a0) * r, vt + Math.sin(a0) * ry], [x + Math.cos(a1) * r, vt + Math.sin(a1) * ry], [x + Math.cos(a1) * r, vb + Math.sin(a1) * ry - 1 * k], [x + Math.cos(a0) * r, vb + Math.sin(a0) * ry - 1 * k]];
    kente(ctx, q, 1, 2, KENTE_ROYAL, k * 0.8, a0 > Math.PI / 2 ? 0 : -0.15, i);
  }
  ctx.restore();
  for (let i = 0; i <= 18; i++) { const a = (i / 18) * Math.PI, px = x + Math.cos(a) * r, py = vb + Math.sin(a) * ry; line(ctx, px, py, px, py + 1.3 * k, i % 2 ? METAL : GOLD_D, 0.5 * k); }
  line(ctx, x - r, vt, x - r, vb, shade(RED_D, -0.3), 0.4 * k);
  // the finial
  const fy = y - h - ry * 0.2;
  line(ctx, x, fy, x, fy - 1.6 * k, METAL, 0.8 * k);
  if (finial === 'bird') { // a gold bird, wings raised
    ellipse(ctx, x, fy - 2.4 * k, 1.3 * k, 0.9 * k, METAL);
    poly(ctx, [x - 0.4 * k, fy - 2.8 * k, x - 3 * k, fy - 5 * k, x - 1 * k, fy - 2.4 * k], GOLD_L);
    poly(ctx, [x + 0.4 * k, fy - 2.8 * k, x + 2.8 * k, fy - 5.2 * k, x + 1 * k, fy - 2.4 * k], METAL);
    ellipse(ctx, x + 1.2 * k, fy - 3.2 * k, 0.6 * k, 0.6 * k, METAL);
    poly(ctx, [x + 1.6 * k, fy - 3.3 * k, x + 2.6 * k, fy - 3 * k, x + 1.6 * k, fy - 2.9 * k], GOLD_D);
  } else { // a little gold stool
    poly(ctx, [x - 1.6 * k, fy - 3.4 * k, x + 1.6 * k, fy - 3.4 * k, x + 1.2 * k, fy - 2.8 * k, x - 1.2 * k, fy - 2.8 * k], METAL);
    line(ctx, x, fy - 2.8 * k, x, fy - 1.4 * k, METAL, 1 * k);
    poly(ctx, [x - 1.4 * k, fy - 1.4 * k, x + 1.4 * k, fy - 1.4 * k, x + 1.4 * k, fy - 0.9 * k, x - 1.4 * k, fy - 0.9 * k], GOLD_D);
  }
}

/** A modest forest rider on a small horse with a cloth over its back; the knight a chief in kente, gold-banded, his
 *  afena raised, riding under the great state umbrella which a bearer on foot holds above him. */
function horseman(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  const noble = kind === 'knight';
  let bearer: Body | null = null;
  if (noble) bearer = figure(ctx, 'archer', 'ashanti', x - 9, y - 1, 0.62); // the umbrella bearer walks beside, behind the horse
  const saddle = drawHorse(ctx, x - 1, y + 3, noble ? 0.9 : 0.82, noble ? '#6a4a30' : '#8a6a48', '#1a120c', undefined, RED);
  const sx = saddle.x, sy = saddle.y;
  const ux = sx + 1.4, uy = sy - 28; // where the umbrella's rim is centred
  if (bearer) line(ctx, bearer.hand.x, bearer.hand.y + 2, ux - 0.4, uy + 1, WOOD_D, 1.1); // its pole, behind the chief
  // a cloth over the horse's back: kente for the chief, a striped smock-cloth for the rider
  const q: Quad = [[sx - 5.6, sy - 0.4], [sx + 3.6, sy - 0.4], [sx + 3.2, sy + 5.6], [sx - 5.2, sy + 6]];
  if (noble) kente(ctx, q, 4, 2, KENTE_ROYAL, 0.9);
  else { qpoly(ctx, q, [[0, 0], [1, 0], [1, 1], [0, 1]], SMOCK); for (let i = 1; i < 6; i++) qline(ctx, q, i / 6, 0, i / 6, 1, INDIGO, 0.4); }
  for (let i = 0; i < 6; i++) line(ctx, sx - 5 + i * 1.6, sy + 5.8, sx - 5 + i * 1.6, sy + 6.8, noble ? METAL : RED, 0.5);
  // amulets on the horse's headstall
  const hhx = x - 1 + 10.5 * 0.86, hhy = y + 3 - 15 * 0.86;
  for (let i = 0; i < 3; i++) amulet(ctx, hhx - 1 + i * 1.3, hhy + 1.6 + (i % 2) * 0.5, 0.6, i);
  const b = figure(ctx, kind, 'ashanti', sx, sy, 0.9, true);
  if (noble) {
    afena(ctx, b.hand.x, b.hand.y, 0.9, 0.9, true);
    if (bearer) umbrella(ctx, ux, uy, 10, 0.8, 'bird');
    return;
  }
  roundShield(ctx, b.off.x - 0.6, b.off.y + 1, 3, 0.62);
  spear(ctx, b.hand.x, b.hand.y, 0.9, 28);
}

// ---------------------------------------------------------------- the cannon

/** A trade cannon of black iron on a wooden field carriage with two spoked wheels, a gunner in a batakari with a
 *  linstock, a pile of shot and a keg of powder. */
function cannon(ctx: Ctx, x: number, y: number) {
  // shot and the keg
  for (const [ax, ay, ar] of [[11, 6, 1.5], [13.2, 6.6, 1.5], [12.2, 4.6, 1.4]] as const) { ellipse(ctx, x + ax, y + ay, ar, ar, '#2e3036'); ellipse(ctx, x + ax - 0.5, y + ay - 0.5, ar * 0.4, ar * 0.35, '#6a6e78'); }
  box(ctx, x - 13, y + 5, 3.6, 4, WOOD, WOOD_L);
  band(ctx, x - 13, y + 5, 3.6, 4, 0.2, 0.32, BLACK);
  band(ctx, x - 13, y + 5, 3.6, 4, 0.7, 0.82, BLACK);
  // the trail of the carriage running back to the ground
  poly(ctx, [x - 10, y + 4, x - 8, y + 4.6, x + 4, y - 3.4, x + 2.6, y - 4.6], WOOD_D);
  poly(ctx, [x - 10, y + 4, x - 8.6, y + 3.4, x + 2.6, y - 4.6, x + 1.4, y - 4.2], WOOD);
  // the far wheel
  const wheel = (wx: number, wy: number, r: number, c: string) => {
    ring(ctx, wx, wy, r * 0.8, r, shade(c, -0.25), 1.4);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI; line(ctx, wx + Math.cos(a) * r * 0.75, wy + Math.sin(a) * r * 0.95, wx - Math.cos(a) * r * 0.75, wy - Math.sin(a) * r * 0.95, c, 0.6); }
    ellipse(ctx, wx, wy, r * 0.22, r * 0.26, IRON);
  };
  wheel(x + 4.4, y - 2.6, 5, WOOD_D);
  // the barrel: black iron, tapering, with reinforcing rings and a cascabel knob
  const b0: [number, number] = [x - 5, y - 4], b1: [number, number] = [x + 14, y - 12];
  const dx = b1[0] - b0[0], dy = b1[1] - b0[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const P = (t: number, o: number): [number, number] => [b0[0] + ux * t + nx * o, b0[1] + uy * t + ny * o];
  poly(ctx, [...P(0, -2.8), ...P(len, -1.9), ...P(len, 1.9), ...P(0, 2.8)], '#3a3c42');
  poly(ctx, [...P(0, -2.8), ...P(len, -1.9), ...P(len, -0.7), ...P(0, -1)], '#6a6e76');
  for (const t of [0.12, 0.38, 0.7]) line(ctx, ...P(len * t, -3 + t * 0.9), ...P(len * t, 3 - t * 0.9), '#24262a', 1.1);
  ellipse(ctx, ...P(len, 0), 2.2, 2.4, '#2a2c30');
  ellipse(ctx, ...P(len + 0.4, 0), 1.1, 1.2, '#0e0e10');
  ellipse(ctx, ...P(-1.2, 0), 1.6, 1.6, '#3a3c42');
  ellipse(ctx, ...P(-2.4, 0), 0.9, 0.9, '#3a3c42');
  // the cheek of the carriage over the barrel's belly, a kente cloth tied on, amulets for the gun's protection
  poly(ctx, [...P(-1, 2), ...P(9, 1.8), x + 6.6, y - 1, x - 7, y + 4], WOOD);
  poly(ctx, [x - 7, y + 4, x + 6.6, y - 1, x + 6.6, y, x - 7, y + 5], WOOD_D);
  const cq: Quad = [P(3, -2.9), P(6.4, -2.6), P(6.4, 2.6), P(3, 2.9)];
  kente(ctx, cq, 2, 2, KENTE_PLAIN, 0.7);
  for (let i = 0; i < 3; i++) { const [px, py] = P(5 + i * 0.4, 3.6 + i * 0.9); amulet(ctx, px, py, 0.7, i); }
  // the near wheel
  wheel(x + 1.8, y + 1.6, 5.6, WOOD);
  // the gunner with his linstock and a smouldering match
  const g = figure(ctx, 'archer', 'ashanti', x - 11, y - 3, 0.52);
  line(ctx, g.hand.x, g.hand.y + 2, g.hand.x + 6, g.hand.y - 6, WOOD, 0.7);
  ellipse(ctx, g.hand.x + 6.2, g.hand.y - 6.3, 0.6, 0.6, '#e8601e');
  ellipse(ctx, g.hand.x + 6.8, g.hand.y - 8, 1.2, 0.9, 'rgba(220,220,220,0.6)');
}

// ---------------------------------------------------------------- surf canoes

/** A surf canoe hull: a long dugout with high pointed ends, the bow and stern raised in beak-like prows, painted along
 *  its side in bright bands with sayings and patterns; flags at the stern. Returns the gunwale height along it. */
function hull(ctx: Ctx, x: number, y: number, len: number, color: string, paint: [string, string], crewBehind?: () => void) {
  const half = len / 2;
  const sheer = (t: number) => y - 3 - Math.pow(Math.abs(t), 5) * 5;
  poly(ctx, [x - half * 0.9, sheer(-0.9) - 1.2, x + half * 0.9, sheer(0.9) - 1.2, x + half * 0.88, sheer(0.88) + 0.4, x - half * 0.88, sheer(-0.88) + 0.4], shade(color, -0.4));
  crewBehind?.();
  const top: number[] = [];
  for (let i = 0; i <= 20; i++) { const t = -1 + i * 0.1; top.push(x + t * half, sheer(t)); }
  const bottom: number[] = [];
  for (let i = 20; i >= 0; i--) { const t = -1 + i * 0.1, tt = Math.abs(t); bottom.push(x + t * half * 0.92, y + 2 - tt * tt * 4); }
  poly(ctx, [...top, ...bottom], color);
  // painted bands along the side
  const band2 = (o0: number, o1: number, c: string) => {
    const pts: number[] = [];
    for (let i = 1; i <= 19; i++) { const t = -1 + i * 0.1; pts.push(x + t * half * 0.97, sheer(t) + o0); }
    for (let i = 19; i >= 1; i--) { const t = -1 + i * 0.1; pts.push(x + t * half * 0.97, sheer(t) + o1); }
    poly(ctx, pts, c);
  };
  band2(0.4, 1.4, paint[0]);
  band2(1.4, 2.2, paint[1]);
  for (let i = 0; i < Math.floor(len / 5); i++) { // a row of little painted triangles and dots
    const px = x - half * 0.75 + i * 5, py = sheer((px - x) / half) + 2.6;
    poly(ctx, [px, py, px + 1.2, py + 1.4, px + 2.4, py], i % 2 ? paint[0] : WHITE);
    ellipse(ctx, px + 3.6, py + 0.6, 0.4, 0.4, paint[1]);
  }
  poly(ctx, [x - half * 0.84, y + 0.6, x + half * 0.84, y + 0.6, x + half * 0.7, y + 2.2, x - half * 0.7, y + 2.2], shade(color, -0.3));
  // foam at the waterline and at the bow
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x - half * 0.8, y + 2); ctx.quadraticCurveTo(x, y + 4.2, x + half * 0.8, y + 1.6); ctx.stroke();
  return sheer;
}

/** Paddles to draw over the hull once it is drawn: [hand x, hand y, scale, stroke]. */
const OARS: [number, number, number, number][] = [];

/** A kneeling paddler behind the gunwale; his paddle is drawn over the hull afterwards (see `paddles`). */
function paddler(ctx: Ctx, x: number, y: number, k: number, kind: UnitKind = 'archer', stroke = 0) {
  const b = figure(ctx, kind, 'ashanti', x, y, k);
  OARS.push([b.hand.x, b.hand.y, k, stroke]);
}

/** The paddles of the Gold Coast: short shafts, the blade a three-pointed trident shape, dipping into the surf. */
function paddles(ctx: Ctx, waterY: number) {
  for (const [hx, hy, k, st] of OARS.splice(0)) {
    const tx = hx - (4 + st * 3) * k / 0.44, ty = waterY + 1.2;
    line(ctx, hx + 2 * k / 0.44, hy - 3 * k / 0.44, tx, ty, WOOD_D, 1);
    const bx = tx, by = ty;
    poly(ctx, [bx - 1.4, by - 1, bx + 1.4, by - 1, bx + 1.6, by + 2.2, bx + 0.6, by + 1.2, bx, by + 2.8, bx - 0.6, by + 1.2, bx - 1.6, by + 2.2], WOOD);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(bx, by + 2.6, 2.4, 0.8, 0, 0, Math.PI * 2); ctx.stroke();
  }
}

/** A small flag on a staff: bright cotton, a border of triangles. */
function pennon(ctx: Ctx, x: number, y: number, h: number, c: string, c2: string) {
  line(ctx, x, y, x, y - h, WOOD_D, 0.7);
  poly(ctx, [x, y - h, x - 5, y - h + 0.6, x - 5.4, y - h + 3.6, x, y - h + 3.4], c);
  for (let i = 0; i < 3; i++) poly(ctx, [x - i * 1.7, y - h + 3.5, x - (i + 1) * 1.7, y - h + 3.6, x - (i + 0.5) * 1.7, y - h + 2.5], c2);
}

function canoe(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  if (kind === 'boat') { // a surf canoe: two paddlers and bundles of kola nuts in baskets
    hull(ctx, x, y, 34, '#7a4a2a', [GOLD, GREEN], () => {
      paddler(ctx, x - 9, y - 2.6, 0.42, 'archer', 0);
      for (const [dx, c] of [[1, '#b88a4a'], [4, '#9a6a3a']] as const) { ellipse(ctx, x + dx, y - 4, 2.2, 1.4, c); ellipse(ctx, x + dx, y - 4.8, 1.6, 0.8, '#c84a2a'); }
      paddler(ctx, x + 10, y - 2.6, 0.42, 'warrior', 1);
    });
    paddles(ctx, y);
    pennon(ctx, x - 15, y - 6, 8, RED, GOLD);
    return;
  }
  if (kind === 'ship') { // a great trading canoe: four paddlers, a cloth awning over gold and cloth
    hull(ctx, x, y, 48, '#6e4228', [RED, GOLD], () => {
      paddler(ctx, x - 17, y - 2.6, 0.4, 'archer', 0);
      paddler(ctx, x - 10, y - 2.6, 0.4, 'warrior', 1);
      const mx = x + 2, my = y - 4; // the awning on four poles, a kente cloth over it
      for (const dx of [-5, 5]) line(ctx, mx + dx, my, mx + dx, my - 8, WOOD_D, 0.7);
      kente(ctx, [[mx - 6.4, my - 9], [mx + 6.4, my - 9.4], [mx + 6, my - 6.6], [mx - 6, my - 6.2]], 5, 1, KENTE_ROYAL, 0.9);
      box(ctx, mx - 1.6, my, 3.6, 2.4, '#b88a4a', '#d0a868');
      box(ctx, mx + 2.2, my + 0.4, 3.4, 2, RED, shade(RED, 0.2));
      paddler(ctx, x + 12, y - 2.6, 0.4, 'archer', 1);
      paddler(ctx, x + 19, y - 2.6, 0.4, 'warrior', 0);
    });
    paddles(ctx, y);
    pennon(ctx, x - 22, y - 7, 10, GREEN, GOLD);
    pennon(ctx, x + 23, y - 8, 7, RED, WHITE);
    return;
  }
  // the warship: a long war canoe with musketeers and paddlers, an asafo flag at the stern, a chief under his umbrella
  hull(ctx, x, y, 60, '#5a3420', [RED, BLACK], () => {
    for (let i = 0; i < 6; i++) paddler(ctx, x - 22 + i * 7.6, y - 2.6, 0.4, i % 2 ? 'warrior' : 'archer', i % 2);
    const m = figure(ctx, 'asafo', 'ashanti', x + 25, y - 3.4, 0.44); // a musketeer at the bow
    musket(ctx, m.hand.x - 0.4, m.hand.y + 2.6, m.hand.x + 6, m.hand.y - 4, 0.44);
    const c = figure(ctx, 'knight', 'ashanti', x - 26, y - 4, 0.44); // the chief at the stern
    umbrella(ctx, c.hand.x - 2.4, c.top - 3, 5.4, 0.44, 'bird', 6);
  });
  paddles(ctx, y);
  asafoFlag(ctx, x - 30, y - 22, 9, 6, 0.6, 0.6);
}

function unit(ctx: Ctx, kind: UnitKind, x: number, y: number): boolean {
  switch (kind) {
    case 'rider': case 'knight': horseman(ctx, kind, x, y); return true;
    case 'catapult': cannon(ctx, x, y); return true;
    case 'boat': case 'ship': case 'warship': canoe(ctx, kind, x, y); return true;
  }
  return false;
}

// ---------------------------------------------------------------- buildings

/** A point on the ground plan: u runs to the lower right, v to the lower left, h is height. */
const P = (x: number, y: number, u: number, v: number, h = 0): [number, number] => [x + (u - v), y + (u + v) / 2 - h];

/** A spiral scroll in relief at (px, py): a raised highlight and a shadowed groove, `r` its size, turning `dir`. */
function scroll(ctx: Ctx, px: number, py: number, r: number, wall: string, dir = 1) {
  const draw = (c: string, ox: number, oy: number, w: number) => {
    ctx.strokeStyle = ink(c); ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) { const a = (i / 16) * Math.PI * 3.2 * dir, rr = r * (1 - i / 20); const sx = px + ox + Math.cos(a) * rr, sy = py + oy + Math.sin(a) * rr * 0.75; if (i) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy); }
    ctx.stroke();
  };
  draw(shade(wall, -0.35), 0.25, 0.25, Math.max(0.35, r * 0.32));
  draw(shade(wall, 0.25), 0, 0, Math.max(0.25, r * 0.22));
}

interface HouseOpts { ridge?: 'u' | 'v'; open?: boolean; reliefs?: boolean; thatch?: string; wall?: string; door?: boolean; stool?: boolean }

/**
 * An Asante building: a rectangular room of `L` x `D` half-size and wall height `H`, its walls polished red-brown below
 * and white clay above, the red dado modelled in relief with spirals and a band of arabesque; a steep thatched gable
 * roof of rise `R` with its ridge along u (or v). `open`: the room's front stands open to the courtyard, showing the
 * raised red platform inside between two pillars.
 */
function house(ctx: Ctx, x: number, y: number, L: number, D: number, H: number, R: number, o: HouseOpts = {}) {
  const ridge = o.ridge ?? 'u', th = o.thatch ?? THATCH, wall = o.wall ?? CLAY_R, dado = 0.48;
  softShadow(ctx, x + 1.4, y + 1.4, (L + D) * 1.1, (L + D) * 0.5, 0.22);
  const F = (s: number, t: number) => P(x, y, -L + 2 * L * s, D, H * t); // the front (left-facing) wall
  const S = (s: number, t: number) => P(x, y, L, D - 2 * D * s, H * t); // the side (right-facing) wall
  const wp = (f: typeof F, pts: [number, number][], c: string) => poly(ctx, pts.flatMap(([s, t]) => f(s, t)), c);
  // the walls: white above, red below
  wp(F, [[0, 0], [1, 0], [1, 1], [0, 1]], CLAY_W);
  wp(S, [[0, 0], [1, 0], [1, 1], [0, 1]], shade(CLAY_W, -0.2));
  wp(F, [[0, 0], [1, 0], [1, dado], [0, dado]], wall);
  wp(S, [[0, 0], [1, 0], [1, dado], [0, dado]], shade(wall, -0.22));
  // the open front: a dark room behind two pillars, the raised red platform inside
  const openF = o.open && ridge === 'u', openS = o.open && ridge === 'v';
  const opening = (f: typeof F, dark: number) => {
    wp(f, [[0.08, 0.16], [0.92, 0.16], [0.92, 0.95], [0.08, 0.95]], shade('#2a1810', dark));
    wp(f, [[0.08, 0], [0.92, 0], [0.92, 0.2], [0.08, 0.2]], shade(wall, 0.05 + dark)); // the platform's face
    wp(f, [[0.08, 0.2], [0.92, 0.2], [0.92, 0.24], [0.08, 0.24]], shade(wall, 0.3 + dark));
    for (const s of [0.08, 0.5, 0.92]) { const a = f(s, 0), b = f(s, 0.95); line(ctx, a[0], a[1], b[0], b[1], shade(CLAY_W, -0.1 + dark), 1.1); }
    if (o.stool) { const [sx, sy] = f(0.3, 0.26); ellipse(ctx, sx, sy - 1.4, 1.4, 0.5, '#4a2a18'); line(ctx, sx, sy - 1.3, sx, sy, '#4a2a18', 0.6); } // a blackened ancestral stool
  };
  if (openF) opening(F, 0);
  if (openS) opening(S, -0.2);
  // the relief: spirals and arabesques on the red dado, a moulded band at its top
  if (o.reliefs !== false) {
    const nF = Math.max(2, Math.round(L * 0.7)), nS = Math.max(1, Math.round(D * 0.7));
    if (!openF) for (let i = 0; i < nF; i++) { const [px, py] = F((i + 0.5) / nF, dado * 0.5); scroll(ctx, px, py, Math.min(1.4, H * 0.12), wall, i % 2 ? 1 : -1); }
    if (!openS) for (let i = 0; i < nS; i++) { const [px, py] = S((i + 0.5) / nS, dado * 0.5); scroll(ctx, px, py, Math.min(1.4, H * 0.12), shade(wall, -0.22), i % 2 ? 1 : -1); }
    for (const [f, dk] of [[F, 0], [S, -0.22]] as const) {
      const a = f(0, dado), b = f(1, dado);
      line(ctx, a[0], a[1], b[0], b[1], shade(wall, dk - 0.3), 0.7);
      line(ctx, a[0], a[1] - 0.4, b[0], b[1] - 0.4, shade(CLAY_W, dk + 0.1), 0.3);
      if (!(f === F ? openF : openS)) { // a running arabesque of little loops under the band
        const n = Math.max(3, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.6));
        for (let i = 0; i < n; i++) { const [px, py] = f((i + 0.5) / n, dado - 0.1); ring(ctx, px, py, 0.45, 0.35, shade(wall, dk + 0.2), 0.25); }
      }
    }
  }
  // the door
  if (o.door && !openF) { wp(F, [[0.42, 0], [0.6, 0], [0.6, 0.66], [0.42, 0.66]], '#2a1810'); wp(F, [[0.4, 0.66], [0.62, 0.66], [0.62, 0.72], [0.4, 0.72]], WOOD_D); }
  // the corner posts
  for (const p of [F(0, 0), F(1, 0), S(1, 0)]) line(ctx, p[0], p[1], p[0], p[1] - H, shade(wall, -0.35), 0.5);
  // the roof: steep, thatched, overhanging
  const e = 0.7, ov = 0.35;
  const combed = (A: [number, number], B: [number, number], Cc: [number, number], Dd: [number, number], c: string) => { // a slope A-B (ridge) to D-C (eave)
    poly(ctx, [...A, ...B, ...Cc, ...Dd], c);
    const n = Math.max(4, Math.round(Math.hypot(B[0] - A[0], B[1] - A[1]) * 1.1));
    for (let i = 1; i < n; i++) { const s = i / n; line(ctx, A[0] + (B[0] - A[0]) * s, A[1] + (B[1] - A[1]) * s, Dd[0] + (Cc[0] - Dd[0]) * s, Dd[1] + (Cc[1] - Dd[1]) * s, i % 3 ? shade(c, -0.12) : shade(c, 0.14), 0.35); }
    for (const t of [0.4, 0.75]) line(ctx, A[0] + (Dd[0] - A[0]) * t, A[1] + (Dd[1] - A[1]) * t, B[0] + (Cc[0] - B[0]) * t, B[1] + (Cc[1] - B[1]) * t, shade(c, -0.2), 0.4);
    for (let i = 0; i <= n; i++) { const s = i / n, px = Dd[0] + (Cc[0] - Dd[0]) * s, py = Dd[1] + (Cc[1] - Dd[1]) * s; line(ctx, px, py, px - 0.15, py + 0.8 + (i % 2) * 0.4, shade(c, -0.22), 0.4); } // the ragged eave
  };
  if (ridge === 'u') {
    const eh = H - (ov * R) / D;
    const R1 = P(x, y, -L - e, 0, H + R), R2 = P(x, y, L + e, 0, H + R), E1 = P(x, y, -L - e, D + ov, eh), E2 = P(x, y, L + e, D + ov, eh), B2 = P(x, y, L + e, -D - ov, eh);
    // the gable end: clay, with a little round vent
    poly(ctx, [...P(x, y, L, D, H), ...P(x, y, L, -D, H), ...P(x, y, L, 0, H + R)], shade(CLAY_W, -0.24));
    const [gx, gy] = P(x, y, L, 0, H + R * 0.4); ellipse(ctx, gx, gy, 0.6, 0.8, '#2a1810');
    poly(ctx, [...R2, ...B2, B2[0] + 0.3, B2[1] + 1.1, R2[0] + 0.3, R2[1] + 1.1], shade(th, -0.36)); // the far slope's edge
    combed(R1, R2, E2, E1, th);
    poly(ctx, [...R2, ...E2, E2[0] - 0.3, E2[1] + 1.1, R2[0] - 0.3, R2[1] + 1.1], shade(th, -0.26));
    line(ctx, R1[0], R1[1], R2[0], R2[1], shade(th, -0.42), 1.1);
  } else {
    const eh = H - (ov * R) / L;
    const R1 = P(x, y, 0, -D - e, H + R), R2 = P(x, y, 0, D + e, H + R), E1 = P(x, y, L + ov, -D - e, eh), E2 = P(x, y, L + ov, D + e, eh), B2 = P(x, y, -L - ov, D + e, eh);
    poly(ctx, [...P(x, y, -L, D, H), ...P(x, y, L, D, H), ...P(x, y, 0, D, H + R)], CLAY_W);
    const [gx, gy] = P(x, y, 0, D, H + R * 0.4); ellipse(ctx, gx, gy, 0.6, 0.8, '#2a1810');
    poly(ctx, [...R2, ...B2, B2[0] - 0.3, B2[1] + 1.1, R2[0] - 0.3, R2[1] + 1.1], shade(th, -0.1)); // the far slope's edge, lit
    combed(R1, R2, E2, E1, shade(th, -0.2));
    poly(ctx, [...R2, ...E2, E2[0] + 0.3, E2[1] + 1.1, R2[0] + 0.3, R2[1] + 1.1], shade(th, -0.36));
    line(ctx, R1[0], R1[1], R2[0], R2[1], shade(th, -0.42), 1.1);
  }
}

/** A low wall of red clay, white-capped, from (u0, v0) to (u1, v1). */
function lowWall(ctx: Ctx, x: number, y: number, u0: number, v0: number, u1: number, v1: number, wh: number) {
  const a = P(x, y, u0, v0), b = P(x, y, u1, v1);
  const right = Math.abs(u1 - u0) < Math.abs(v1 - v0);
  const c = right ? shade(CLAY_R, -0.22) : CLAY_R;
  poly(ctx, [a[0], a[1], b[0], b[1], b[0], b[1] - wh, a[0], a[1] - wh], c);
  poly(ctx, [a[0], a[1] - wh, b[0], b[1] - wh, b[0] + (right ? -0.6 : 0.6), b[1] - wh - 0.6, a[0] + (right ? -0.6 : 0.6), a[1] - wh - 0.6], CLAY_W);
  const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3));
  for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; scroll(ctx, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - wh * 0.5, Math.min(0.9, wh * 0.22), c, i % 2 ? 1 : -1); }
}

/** A courtyard floor of polished red clay. */
function court(ctx: Ctx, x: number, y: number, G: number, c = '#b4643c') {
  poly(ctx, [...P(x, y, -G, -G), ...P(x, y, G, -G), ...P(x, y, G, G), ...P(x, y, -G, G)], c);
  poly(ctx, [...P(x, y, -G * 0.6, -G * 0.6), ...P(x, y, G * 0.6, -G * 0.6), ...P(x, y, G * 0.6, G * 0.6), ...P(x, y, -G * 0.6, G * 0.6)], shade(c, 0.08));
}

/** A Nyame dua: a forked post, the altar of the sky god, holding a brass basin. */
function nyameDua(ctx: Ctx, x: number, y: number, s = 1) {
  line(ctx, x, y, x, y - 6 * s, WOOD_D, 0.8 * s);
  line(ctx, x, y - 5 * s, x - 1.6 * s, y - 7.4 * s, WOOD_D, 0.6 * s);
  line(ctx, x, y - 5 * s, x + 1.6 * s, y - 7.4 * s, WOOD_D, 0.6 * s);
  ellipse(ctx, x, y - 7.4 * s, 2 * s, 0.8 * s, '#c89838');
  ellipse(ctx, x, y - 7.6 * s, 1.5 * s, 0.5 * s, '#5a3a18');
}

/** A tall fontomfrom drum: a carved wooden body on a stand, a hide head pegged on, its carved waist painted. */
function drum(ctx: Ctx, x: number, y: number, s = 1, lean = 0) {
  const h = 6 * s, r = 1.4 * s;
  poly(ctx, [x - r, y - h + lean, x + r, y - h - lean, x + r * 0.7, y, x - r * 0.7, y], WOOD);
  poly(ctx, [x + 0.2 * s, y - h - lean * 0.2, x + r, y - h - lean, x + r * 0.7, y, x + 0.2 * s, y], WOOD_D);
  ellipse(ctx, x, y - h, r, r * 0.4, '#e8d8b0');
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI; line(ctx, x + Math.cos(a) * r, y - h + Math.sin(a) * r * 0.4, x + Math.cos(a) * r * 0.9, y - h + 2 * s, BLACK, 0.3 * s); }
  line(ctx, x - r * 0.85, y - h * 0.4, x + r * 0.85, y - h * 0.42, RED, 0.6 * s);
  line(ctx, x - r * 0.8, y - h * 0.3, x + r * 0.8, y - h * 0.32, BLACK, 0.4 * s);
}

/** The Golden Stool (Sika Dwa Kofi) on its own dais: a curved seat on a central column and four corner posts, all of
 *  gold, with gold bells and figures hung at its sides; it never touches the ground but rests on a cloth. */
function goldenStool(ctx: Ctx, x: number, y: number, s = 1) {
  // the dais: two steps of red clay, a white edge
  box(ctx, x, y + 1.6 * s, 10 * s, 1.6 * s, CLAY_R, shade(CLAY_R, 0.25));
  box(ctx, x, y, 7 * s, 1.4 * s, CLAY_R, shade(CLAY_R, 0.25));
  // the cloth it rests on, kente
  kente(ctx, [[x - 3 * s, y - 2.2 * s], [x + 3 * s, y - 2.6 * s], [x + 3.2 * s, y - 1 * s], [x - 3.2 * s, y - 0.6 * s]], 4, 1, KENTE_ROYAL, s * 0.8);
  // the stool: base, column, curved seat
  const by = y - 1.8 * s;
  poly(ctx, [x - 2.4 * s, by, x + 2.4 * s, by, x + 2 * s, by - 0.8 * s, x - 2 * s, by - 0.8 * s], GOLD_D);
  poly(ctx, [x - 0.8 * s, by - 0.8 * s, x + 0.8 * s, by - 0.8 * s, x + 0.6 * s, by - 3 * s, x - 0.6 * s, by - 3 * s], METAL);
  for (const dx of [-1.8, 1.8]) line(ctx, x + dx * s, by - 0.8 * s, x + dx * 0.9 * s, by - 3 * s, METAL, 0.5 * s);
  ctx.beginPath(); // the seat, curving up at the ends
  ctx.moveTo(x - 2.8 * s, by - 4.4 * s);
  ctx.quadraticCurveTo(x, by - 2.4 * s, x + 2.8 * s, by - 4.4 * s);
  ctx.lineTo(x + 2.6 * s, by - 3.4 * s);
  ctx.quadraticCurveTo(x, by - 2 * s, x - 2.6 * s, by - 3.4 * s);
  ctx.closePath();
  ctx.fillStyle = ink(METAL); ctx.fill();
  curve(ctx, x - 2.6 * s, by - 4.2 * s, x, by - 2.4 * s, x + 2.6 * s, by - 4.2 * s, 0.3 * s, '#fff4c0');
  // the bells hung at its sides
  for (const dx of [-2.9, 2.9]) { line(ctx, x + dx * s, by - 4.2 * s, x + dx * s, by - 2.6 * s, GOLD_D, 0.25 * s); poly(ctx, [x + dx * s - 0.6 * s, by - 1.8 * s, x + dx * s + 0.6 * s, by - 1.8 * s, x + dx * s, by - 2.8 * s], METAL); }
  // its glow
  ctx.save(); ctx.globalAlpha = 0.25; ellipse(ctx, x, by - 3 * s, 4 * s, 3 * s, '#fff0a0'); ctx.restore();
}

/** A courtyard house: two open-fronted rooms on the far sides of a red clay court, low relief-worked walls closing the
 *  near sides with a gateway; `extra` draws what stands in the court. */
function courtyard(ctx: Ctx, x: number, y: number, G: number, H: number, R: number, extra?: () => void) {
  softShadow(ctx, x + 1, y + 2, G * 2.4, G * 1.2, 0.2);
  court(ctx, x, y, G);
  const d = 2.2;
  const back = P(x, y, 0, -G + d), left = P(x, y, -G + d, d * 1.1);
  house(ctx, back[0], back[1], G, d, H, R, { ridge: 'u', open: true, stool: true });
  house(ctx, left[0], left[1], d, G - d * 1.1, H * 0.92, R * 0.92, { ridge: 'v', open: true });
  extra?.();
  lowWall(ctx, x, y, G, -G, G, G, 2.8);
  lowWall(ctx, x, y, -G, G, -G * 0.25, G, 2.8);
  lowWall(ctx, x, y, G * 0.25, G, G, G, 2.8);
  // the gateway in the near wall: two white posts under a little thatched lintel
  const ga = P(x, y, -G * 0.25, G), gb = P(x, y, G * 0.25, G), gh = H * 0.95;
  for (const q of [ga, gb]) { line(ctx, q[0], q[1], q[0], q[1] - gh, CLAY_W, 1.5); line(ctx, q[0] + 0.5, q[1], q[0] + 0.5, q[1] - gh, shade(CLAY_W, -0.2), 0.5); }
  poly(ctx, [ga[0] - 1.4, ga[1] - gh + 0.2, gb[0] + 1.4, gb[1] - gh + 0.2, gb[0] + 0.4, gb[1] - gh - 2.6, ga[0] - 0.4, ga[1] - gh - 2.6], THATCH);
  line(ctx, ga[0] - 1.4, ga[1] - gh + 0.2, gb[0] + 1.4, gb[1] - gh + 0.2, shade(THATCH, -0.3), 0.6);
}

/**
 * The capital: the Asantehene's palace at Kumasi. A great court of red clay; on the far sides, the open hall of state
 * and a wing, steep thatch over relief-worked walls; in the court, the Golden Stool on its dais under the great
 * umbrella, the fontomfrom drums beside it; flags of state at the gate, and an odum tree rising behind.
 */
function palace(ctx: Ctx, x: number, y: number) {
  const G = 11;
  odum(ctx, x - 17, y - 14, 0.62, 4);
  courtyard(ctx, x, y, G, 6, 6.4, () => {
    const [sx, sy] = P(x, y, 0.5, 0.5);
    drum(ctx, sx - 7, sy - 1, 0.95, 0.3);
    drum(ctx, sx - 5, sy + 1.4, 0.95, -0.3);
    goldenStool(ctx, sx, sy + 1, 0.9);
    umbrella(ctx, sx + 0.4, sy - 13, 7.4, 0.78, 'stool', 12);
    drum(ctx, sx + 7, sy + 0.4, 0.8, 0.2);
  });
  for (const [u, v, c] of [[-G, G, RED], [G, G, GREEN], [G, -G, GOLD]] as const) { const p = P(x, y, u, v); pennon(ctx, p[0], p[1], 15, c, c === GOLD ? GREEN : GOLD); }
}

/** A chief's courtyard house: two open rooms round the court, a drum and a nyame dua in it. */
function chiefHouse(ctx: Ctx, x: number, y: number) {
  courtyard(ctx, x, y, 8, 4.8, 5, () => { const [px, py] = P(x, y, 1, 1); drum(ctx, px - 2.4, py + 0.6, 0.7, 0.2); nyameDua(ctx, px + 2.6, py + 1.6, 0.8); });
}

function building(ctx: Ctx, x: number, y: number, big: boolean, _roofC: string, capital: boolean) {
  if (big && capital) return palace(ctx, x, y);
  if (big) return chiefHouse(ctx, x, y);
  const v = ((Math.round(x) * 7 + Math.round(y) * 3) % 5 + 5) % 5;
  if (v === 0) house(ctx, x, y, 3.8, 2.4, 5.6, 4.4, { door: true });
  else if (v === 1) { house(ctx, x, y, 2.6, 3.4, 5.4, 4.2, { ridge: 'v', door: true }); nyameDua(ctx, x + 6, y + 3, 0.6); }
  else if (v === 2) { plantain(ctx, x - 6, y - 1, 0.5, 2); house(ctx, x, y, 3.8, 2.4, 5.6, 4.4, { door: true }); }
  else if (v === 3) { house(ctx, x - 2, y - 1.6, 2, 2.8, 5, 4, { ridge: 'v' }); house(ctx, x + 3, y + 2, 3, 2, 5, 4, { door: true }); }
  else { lowWall(ctx, x, y, -5, -3.6, 5, -3.6, 2.2); house(ctx, x, y, 3.4, 2.2, 5.4, 4.2, { door: true }); lowWall(ctx, x, y, 5, -3.6, 5, 3.6, 2.2); }
}

// ---------------------------------------------------------------- trees

/** A canopy of leafy clumps: a dark under-layer, tiers of round clumps, sunlit tops. */
function canopy(ctx: Ctx, x: number, y: number, W: number, k: number, green: string, tiers = 3) {
  ellipse(ctx, x + 0.8 * k, y + 2 * k, W, 3.6 * k, shade(green, -0.34));
  for (let j = 0; j < tiers; j++) {
    const ww = W * (1 - j * 0.28), yy = y - j * 2.6 * k, n = 6 - j;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1), px = x - ww * 0.8 + t * ww * 1.6, py = yy - Math.sin(t * Math.PI) * 1.2 * k;
      ellipse(ctx, px, py, 3 * k, 2.5 * k, shade(green, -0.14 + j * 0.1 + (i % 2) * 0.05));
    }
  }
  for (let i = 0; i < 3; i++) ellipse(ctx, x - W * 0.3 + i * W * 0.3 - 0.8 * k, y - tiers * 2.2 * k - (i === 1 ? 0.8 : 0) * k, 1.8 * k, 1 * k, shade(green, 0.26));
}

/** The odum (iroko): a giant of the forest, a tall straight grey-brown trunk on low buttresses, bare for most of its
 *  height, then a high wide crown; a creeper hanging from it. */
function odum(ctx: Ctx, x: number, y: number, k: number, variant: number, P_?: BiomePalette) {
  const bark = '#8a7660', green = P_ ? mix(P_.forest, '#1a5a24', 0.35) : '#1f6a30';
  const h = (22 + rand(variant, 4) * 4) * k, top = y - h;
  for (const [dx, dy, c] of [[-5, 1, -0.1], [5, 1.4, -0.3], [-2, 2.4, 0.04], [2.4, 2.2, -0.16]] as const) poly(ctx, [x, y - 5 * k, x + dx * 0.2 * k, y + dy * 0.5 * k, x + dx * k, y + dy * k, x + dx * 0.4 * k, y - 1.4 * k], shade(bark, c));
  poly(ctx, [x - 1.8 * k, y + 0.6 * k, x + 1.8 * k, y + 0.6 * k, x + 1.2 * k, top + 3 * k, x - 1.2 * k, top + 3 * k], bark);
  poly(ctx, [x + 0.2 * k, y + 0.6 * k, x + 1.8 * k, y + 0.6 * k, x + 1.2 * k, top + 3 * k, x + 0.2 * k, top + 3 * k], shade(bark, -0.25));
  for (let i = 0; i < 5; i++) line(ctx, x - 1 * k, y - (4 + i * 4.5) * k, x - 0.6 * k, y - (5.6 + i * 4.5) * k, shade(bark, -0.3), 0.3 * k); // bark fissures
  // a creeper hanging down the trunk
  curve(ctx, x - 1 * k, top + 4 * k, x - 3 * k, y - h * 0.5, x - 1.6 * k, y - 4 * k, 0.4 * k, '#3a6a2a');
  for (let i = 0; i < 4; i++) ellipse(ctx, x - 2.4 * k + (i % 2) * 0.6 * k, top + (7 + i * 4) * k, 0.8 * k, 0.5 * k, '#4a8a34');
  for (const [dx, dy] of [[-10, -1], [-4, -3], [4, -3.4], [10.6, -1.4]] as const) curve(ctx, x, top + 4 * k, x + dx * 0.5 * k, top + (dy + 2) * k, x + dx * k, top + dy * k, 0.8 * k, shade(bark, -0.15));
  canopy(ctx, x, top - 1 * k, (13 + rand(variant, 5) * 3) * k, k * 1.25, green, 3);
}

/** A plantain clump: several pseudo-stems, huge paddle leaves arching out, some torn along the veins, a hanging bunch
 *  of green plantains with the purple flower bell below. */
function plantain(ctx: Ctx, x: number, y: number, k: number, variant: number, P_?: BiomePalette) {
  const green = P_ ? mix(P_.forest, '#5aa83a', 0.55) : '#4a9a34';
  const leaf = (bx: number, by: number, a: number, len: number, c: string, torn: boolean) => {
    const ex = bx + Math.cos(a) * len * k, ey = by + Math.sin(a) * len * k * 0.7;
    const mx = (bx + ex) / 2, my = Math.min(by, ey) - 3 * k;
    const nx = -Math.sin(a) * 3.6 * k, ny = Math.cos(a) * 2.2 * k;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(mx + nx, my + ny - 1 * k, ex, ey);
    ctx.quadraticCurveTo(mx - nx, my - ny + 1.6 * k, bx, by);
    ctx.fillStyle = ink(c); ctx.fill();
    curve(ctx, bx, by, mx, my, ex, ey, 0.35 * k, shade(c, 0.25)); // the midrib
    if (torn) for (let i = 1; i < 4; i++) { const t = i / 4, [px, py] = [bx + (ex - bx) * t, by + (ey - by) * t - 2.2 * k * Math.sin(t * Math.PI)]; line(ctx, px, py, px + nx * 0.6, py + ny * 0.6 + 0.8 * k, shade(c, -0.3), 0.3 * k); }
  };
  const turn = rand(variant, 7) * 0.4;
  const stems = [[-1.6, 9], [0.8, 12], [2.6, 8]] as const;
  for (const [dx, h] of stems) { poly(ctx, [x + dx * k - 0.8 * k, y, x + dx * k + 0.8 * k, y, x + dx * k + 0.5 * k, y - h * k, x + dx * k - 0.5 * k, y - h * k], shade('#6a8a3a', dx > 0 ? -0.2 : 0)); line(ctx, x + dx * k - 0.3 * k, y, x + dx * k - 0.2 * k, y - h * k, '#8a6a3a', 0.3 * k); }
  const tx = x + 0.8 * k, ty = y - 12 * k;
  for (const a of [-2.4, -0.7]) leaf(tx, ty, a + turn, 9, shade(green, -0.22), true);
  // the bunch and the flower bell
  line(ctx, tx + 1 * k, ty + 1 * k, tx + 2.4 * k, ty + 5 * k, '#5a7a2a', 0.5 * k);
  for (let i = 0; i < 6; i++) { const px = tx + 1.6 * k + (i % 3 - 1) * 0.8 * k, py = ty + 2 * k + Math.floor(i / 3) * 1.2 * k; curve(ctx, px - 0.4 * k, py, px, py + 0.8 * k, px + 0.8 * k, py - 0.2 * k, 0.6 * k, i % 2 ? '#7aa83a' : '#8ab84a'); }
  ellipse(ctx, tx + 2.6 * k, ty + 5.6 * k, 0.8 * k, 1.2 * k, '#6a2a4a');
  for (const a of [Math.PI + 0.3, -0.2, -1.4, Math.PI - 0.6]) leaf(tx, ty, a + turn * 0.5, 10, green, a > 0 && a < 3);
  leaf(tx, ty, -1.9, 8, shade(green, 0.12), false);
}

/** The kola tree: a rounded, dense crown of dark glossy leaves on a short trunk, the star-shaped clusters of kola pods
 *  hanging under the crown, one split open to show the red and white nuts. */
function kola(ctx: Ctx, x: number, y: number, k: number, variant: number, P_?: BiomePalette) {
  const trunk = P_?.trunk ?? '#5a3a24', green = P_ ? mix(P_.forest, '#0e4a20', 0.35) : '#1a5a2a';
  const h = (9 + rand(variant, 6) * 2) * k;
  poly(ctx, [x - 1.4 * k, y, x + 1.4 * k, y, x + 1 * k, y - h, x - 1 * k, y - h], trunk);
  poly(ctx, [x + 0.2 * k, y, x + 1.4 * k, y, x + 1 * k, y - h, x + 0.2 * k, y - h], shade(trunk, -0.25));
  for (const dx of [-4, 3.6]) curve(ctx, x, y - h + 1 * k, x + dx * 0.4 * k, y - h - 1 * k, x + dx * k, y - h - 2.4 * k, 0.7 * k, shade(trunk, -0.1));
  const cy = y - h - 4 * k;
  ellipse(ctx, x + 0.6 * k, cy + 2 * k, 8 * k, 4.4 * k, shade(green, -0.32));
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, rr = 5.2 * k; ellipse(ctx, x + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.55, 3 * k, 2.4 * k, shade(green, -0.1 + (i % 3) * 0.06)); }
  ellipse(ctx, x, cy - 1 * k, 4.8 * k, 3.4 * k, green);
  for (let i = 0; i < 6; i++) { // glossy leaf glints
    const px = x - 5 * k + rand(variant, i + 10) * 10 * k, py = cy - 3 * k + rand(variant, i + 20) * 5 * k;
    line(ctx, px, py, px + 1 * k, py - 0.4 * k, shade(green, 0.35), 0.4 * k);
  }
  // the pods: clusters of knobbly star-arranged follicles under the crown
  for (const [dx, dy] of [[-3.6, 3.6], [2.6, 4], [0, 4.8]] as const) {
    const px = x + dx * k, py = cy + dy * k;
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; ellipse(ctx, px + Math.cos(a) * 0.9 * k, py + Math.sin(a) * 0.5 * k + 0.6 * k, 0.9 * k, 0.6 * k, i % 2 ? '#7a8a3a' : '#9a8a40'); }
  }
  const [ox, oy] = [x + 2.6 * k, cy + 4.6 * k]; // an open pod: the red and white nuts
  ellipse(ctx, ox + 0.4 * k, oy + 0.2 * k, 0.45 * k, 0.4 * k, '#c83a3a');
  ellipse(ctx, ox - 0.3 * k, oy + 0.4 * k, 0.4 * k, 0.35 * k, '#f0e0c8');
}

function tree(ctx: Ctx, x: number, y: number, k: number, P_: BiomePalette, variant: number) {
  const v = variant % 5;
  if (v === 1 || v === 4) return odum(ctx, x, y, k * 0.62, variant, P_);
  if (v === 3) return plantain(ctx, x, y, k * 0.95, variant, P_);
  kola(ctx, x, y, k * 0.9, variant, P_);
}

registerArt('ashanti', {
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

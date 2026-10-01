// The Majapahit Empire of East Java (thirteenth to fifteenth century): batik sarongs and kain wrapped to the ankle (soga
// brown and indigo, with parang diagonals, kawung rosettes and dotted ceplok), bare chests with gold armbands and a gold
// collar for the warriors, quilted cotton vests and lacquered lamellar for the heavy ranks; udeng and blangkon headcloths,
// and tall gold crowns with winged ear ornaments for the elite. The kris with its wavy blade, tall narrow painted wooden
// shields, tasselled tombak spears and the sumpit blowpipe with its spearhead; the Surya Majapahit sun on shields,
// sails and chests. Horses under batik caparisons with a royal payung parasol, a bronze cetbang cannon, the jukung
// outrigger canoe and great jong ships with canted tanja sails, twin quarter rudders and a roofed stern castle.
// Red-brick candi temples, the split gate (candi bentar), houses and rice barns on low stilts under steep ijuk roofs;
// coconut palms, clove trees and banyans.
import type { BiomePalette } from '../../data/tribes';
import type { UnitKind } from '../../game/types';
import { band, box, ellipse, faceQuad, ink, line, mix, poly, rand, shade, softShadow, type Ctx } from '../prims';
import { registerArt, type Body } from '../tribeart';
import { drawHorse, figure } from '../units';

// ---------------------------------------------------------------- palette

const ORANGE = '#e05010', ORANGE_D = '#7a2804';
const SOGA = '#7a4a22', SOGA_D = '#4a2a12'; // batik brown dyed with soga bark
const INDIGO = '#2a3256';
const CREAM = '#efe2c0', CREAM_D = '#c8b48a';
const GOLD = '#e8b840', GOLD_D = '#a47818', GOLD_L = '#fbe08a';
const RED = '#b02a1a', RED_D = '#6a1810';
const BRICK = '#b4543a', BRICK_D = '#7a3220', BRICK_L = '#d4785a';
const WOOD = '#7a5230', WOOD_D = '#4a3018', WOOD_L = '#a87a4a';
const IJUK = '#3a302a', IJUK_L = '#5a4a3e'; // black sugar-palm fibre thatch
const THATCH = '#c09a52';
const BAMB = '#b8b060', BAMB_D = '#7a7032';
const STEEL = '#9aa0a8', STEEL_L = '#d8dee6', STEEL_D = '#5a6068';
const BRONZE = '#b0803a', BRONZE_D = '#6a4a1e', BRONZE_L = '#e0b060';
const MAT = '#caa264', MAT_D = '#9a7840'; // woven pandan matting
const SKIN = '#b87a48', HAIR = '#120c0a';

// ---------------------------------------------------------------- small helpers

/** A point on one visible side of a box, in faceQuad's (u, v) coordinates. */
function pt(face: 'L' | 'R', cx: number, cy: number, w: number, h: number, u: number, v: number): [number, number] {
  return face === 'R' ? [cx + (u * w) / 2, cy + (w / 4) * (1 - u) - v * h] : [cx - w / 2 + (u * w) / 2, cy + (w / 4) * u - v * h];
}
/** A flat polygon on one side of a box. */
function facePoly(ctx: Ctx, face: 'L' | 'R', cx: number, cy: number, w: number, h: number, pts: [number, number][], color: string) {
  poly(ctx, pts.flatMap(([u, v]) => pt(face, cx, cy, w, h, u, v)), face === 'L' ? shade(color, 0.06) : shade(color, -0.2));
}
/** A quadratic stroke. */
function curve(ctx: Ctx, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, w: number, c: string) {
  ctx.strokeStyle = ink(c);
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx, cy, x1, y1);
  ctx.stroke();
}
/** An elliptical outline, or part of one. */
function ring(ctx: Ctx, x: number, y: number, rx: number, ry: number, c: string, w: number, a0 = 0, a1 = Math.PI * 2) {
  ctx.strokeStyle = ink(c);
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, a0, a1);
  ctx.stroke();
}
/** A hanging tassel of dyed horsehair. */
function tassel(ctx: Ctx, x: number, y: number, len: number, w: number, c = RED) {
  ellipse(ctx, x, y, w * 0.7, w * 0.6, GOLD);
  for (let i = -2; i <= 2; i++) line(ctx, x + i * w * 0.18, y + w * 0.3, x + i * w * 0.34, y + len, i % 2 ? shade(c, -0.22) : c, w * 0.32);
}
/** Clip to one side of a box between heights v0 and v1, run `draw`, and restore. */
function clipFace(ctx: Ctx, face: 'L' | 'R', cx: number, cy: number, w: number, h: number, v0: number, v1: number, draw: () => void) {
  ctx.save();
  ctx.beginPath();
  const a = pt(face, cx, cy, w, h, 0, v0), b = pt(face, cx, cy, w, h, 1, v0), c = pt(face, cx, cy, w, h, 1, v1), d = pt(face, cx, cy, w, h, 0, v1);
  ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]);
  ctx.closePath();
  ctx.clip();
  draw();
  ctx.restore();
}

type Motif = 'parang' | 'kawung' | 'ceplok';

/**
 * Batik on one side of a box: parang (rows of diagonal blades edged in dark, with dots between), kawung (rosettes of
 * four oval petals on a grid) or ceplok (scattered dots in rings). Drawn in screen space, clipped to the face.
 */
function batik(ctx: Ctx, face: 'L' | 'R', cx: number, cy: number, w: number, h: number, v0: number, v1: number, base: string, motif: Motif, fg: string, k: number) {
  faceQuad(ctx, face, cx, cy, w, h, 0, 1, v0, v1, base);
  const x0 = face === 'R' ? cx : cx - w / 2, x1 = x0 + w / 2;
  const yTop = cy - v1 * h - w / 4, yBot = cy - v0 * h + w / 4;
  const col = face === 'L' ? fg : shade(fg, -0.18);
  clipFace(ctx, face, cx, cy, w, h, v0, v1, () => {
    if (motif === 'parang') {
      const s = 2.2 * k;
      for (let xx = x0 - (yBot - yTop); xx < x1 + s; xx += s) {
        line(ctx, xx, yBot, xx + (yBot - yTop), yTop, col, 0.75 * k);
        line(ctx, xx + 0.5 * k, yBot, xx + 0.5 * k + (yBot - yTop), yTop, shade(base, -0.35), 0.3 * k);
        for (let yy = yBot; yy > yTop; yy -= s * 1.1) { const dx = yBot - yy; ellipse(ctx, xx + dx + s * 0.55, yy - 0.2 * k, 0.32 * k, 0.32 * k, col); }
      }
    } else if (motif === 'kawung') {
      const s = 2.4 * k;
      for (let yy = yTop; yy < yBot + s; yy += s) for (let xx = x0 - s; xx < x1 + s; xx += s) {
        const ox = ((Math.round((yy - yTop) / s)) % 2) * s * 0.5;
        for (const [dx, dy] of [[-0.45, 0], [0.45, 0], [0, -0.45], [0, 0.45]] as const) ellipse(ctx, xx + ox + dx * s * 0.6, yy + dy * s * 0.6, 0.42 * k, 0.42 * k, col);
        ellipse(ctx, xx + ox, yy, 0.18 * k, 0.18 * k, shade(base, -0.4));
      }
    } else {
      const s = 2.6 * k;
      for (let yy = yTop; yy < yBot + s; yy += s) for (let xx = x0 - s; xx < x1 + s; xx += s) {
        const ox = ((Math.round((yy - yTop) / s)) % 2) * s * 0.5;
        ring(ctx, xx + ox, yy, 0.7 * k, 0.6 * k, col, 0.3 * k);
        ellipse(ctx, xx + ox, yy, 0.25 * k, 0.25 * k, col);
      }
    }
  });
}

/** The Surya Majapahit: the royal sun of eight long rays with eight short ones between, a disc in the middle. */
function surya(ctx: Ctx, x: number, y: number, r: number, c: string, c2: string, sy = 1) {
  const pts: number[] = [];
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 4 === 0 ? r : i % 4 === 2 ? r * 0.72 : r * 0.46;
    pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr * sy);
  }
  poly(ctx, pts, c);
  ellipse(ctx, x, y, r * 0.38, r * 0.38 * sy, c2);
  ellipse(ctx, x, y, r * 0.2, r * 0.2 * sy, c);
}

// ---------------------------------------------------------------- dress

const BARE: UnitKind[] = ['warrior', 'archer', 'kris'];
const isBare = (k: UnitKind) => BARE.includes(k);

/** The sarong each rank wraps: base colour, motif and the motif's colour. */
function kain(kind: UnitKind): [string, Motif, string] {
  switch (kind) {
    case 'kris': return [SOGA, 'parang', CREAM];
    case 'archer': return [INDIGO, 'ceplok', CREAM];
    case 'explorer': return [CREAM_D, 'kawung', SOGA];
    case 'defender': return [INDIGO, 'kawung', CREAM_D];
    case 'swordsman': case 'knight': return [SOGA_D, 'parang', GOLD];
    case 'giant': return [ORANGE_D, 'parang', GOLD];
    default: return [SOGA, 'kawung', CREAM];
  }
}

function dress(kind: UnitKind): [string, string, string] {
  const legs = kain(kind)[0];
  switch (kind) {
    case 'warrior': case 'archer': case 'kris': return [SKIN, legs, SKIN];
    case 'explorer': return [CREAM, legs, CREAM];
    case 'defender': return [CREAM, legs, SKIN];
    case 'swordsman': case 'knight': return [ORANGE_D, legs, ORANGE];
    case 'giant': return [GOLD_D, legs, ORANGE];
    default: return [ORANGE, legs, ORANGE];
  }
}

/** Rows of small lacquered plates laced with cord, between heights v0 and v1 of the torso box. */
function lamellar(ctx: Ctx, x: number, y: number, w: number, h: number, v0: number, v1: number, rows: number, base: string, lace: string) {
  const rh = (v1 - v0) / rows;
  for (let r = 0; r < rows; r++) {
    const a = v0 + r * rh, b = a + rh;
    for (const f of ['L', 'R'] as const) {
      for (let c = 0; c < 5; c++) {
        const u0 = (c + (r % 2) * 0.5) / 5, u1 = Math.min(1, u0 + 0.19);
        if (u0 >= 1) continue;
        faceQuad(ctx, f, x, y, w, h, u0, u1, a + rh * 0.12, b, c % 2 ? shade(base, 0.12) : base);
        faceQuad(ctx, f, x, y, w, h, u0, u1, b - rh * 0.22, b, shade(base, 0.32));
      }
      faceQuad(ctx, f, x, y, w, h, 0, 1, a, a + rh * 0.12, lace);
    }
  }
}

/** The bare chest, the quilted vest, or lamellar; a batik stagen sash at the waist. */
function torso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const k = w / 10;
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const B = (v0: number, v1: number, c: string) => band(ctx, x, y, w, h, v0, v1, c);
  if (isBare(kind)) {
    facePoly(ctx, 'R', x, y, w, h, [[0.12, 0.86], [0.46, 0.86], [0.44, 0.62], [0.16, 0.6]], shade(SKIN, -0.06)); // the chest's shadow
    facePoly(ctx, 'R', x, y, w, h, [[0.54, 0.86], [0.88, 0.86], [0.84, 0.6], [0.56, 0.62]], shade(SKIN, -0.06));
    R(0.47, 0.53, 0.2, 0.56, shade(SKIN, -0.1));
    // a batik stagen wound round the waist, the loose end hanging at the hip
    batik(ctx, 'L', x, y, w, h, 0, 0.24, kind === 'archer' ? INDIGO : ORANGE, 'parang', GOLD, k);
    batik(ctx, 'R', x, y, w, h, 0, 0.24, kind === 'archer' ? INDIGO : ORANGE, 'parang', GOLD, k);
    B(0.22, 0.27, GOLD);
    if (kind === 'kris' || kind === 'warrior') { // the gold collar (kalung) on the chest
      const [nx, ny] = pt('R', x, y, w, h, 0.05, 1);
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(nx, ny - 0.4 * k, 4.6 * k, 2.4 * k, 0.15, 0.05 * Math.PI, 0.95 * Math.PI);
      ctx.strokeStyle = ink(GOLD_D);
      ctx.lineWidth = (kind === 'kris' ? 1.5 : 0.9) * k;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(nx, ny - 0.6 * k, 4.6 * k, 2.4 * k, 0.15, 0.05 * Math.PI, 0.95 * Math.PI);
      ctx.strokeStyle = ink(GOLD_L);
      ctx.lineWidth = 0.5 * k;
      ctx.stroke();
      ctx.restore();
      if (kind === 'kris') ellipse(ctx, nx + 0.4 * k, ny + 2 * k, 0.8 * k, 0.9 * k, RED);
    }
    if (kind === 'archer') { // the strap of the dart quiver across the chest
      facePoly(ctx, 'R', x, y, w, h, [[0.02, 1], [0.22, 1], [0.95, 0.26], [0.75, 0.26]], SOGA_D);
      facePoly(ctx, 'R', x, y, w, h, [[0.4, 0.66], [0.52, 0.66], [0.52, 0.56], [0.4, 0.56]], GOLD);
    }
    return;
  }
  if (kind === 'defender' || kind === 'explorer') {
    // a quilted cotton vest (kere) stitched in diamonds, edged in orange, open at the throat
    const base = kind === 'defender' ? CREAM : '#e8d8b0';
    for (const f of ['L', 'R'] as const) {
      clipFace(ctx, f, x, y, w, h, 0.2, 1, () => {
        const x0 = f === 'R' ? x : x - w / 2, yT = y - h - w / 4, yB = y + w / 4, s = 2 * k;
        for (let xx = x0 - h; xx < x0 + w / 2 + h; xx += s) {
          line(ctx, xx, yB, xx + (yB - yT), yT, shade(base, f === 'L' ? -0.2 : -0.35), 0.3 * k);
          line(ctx, xx, yT, xx + (yB - yT), yB, shade(base, f === 'L' ? -0.2 : -0.35), 0.3 * k);
        }
      });
    }
    facePoly(ctx, 'R', x, y, w, h, [[0.02, 1], [0.3, 1], [0.12, 0.6], [0.02, 0.6]], SKIN); // the open throat
    line(ctx, ...pt('R', x, y, w, h, 0.3, 1), ...pt('R', x, y, w, h, 0.12, 0.6), ORANGE, 0.7 * k);
    B(0.96, 1, ORANGE);
    batik(ctx, 'L', x, y, w, h, 0, 0.2, ORANGE, 'parang', GOLD, k);
    batik(ctx, 'R', x, y, w, h, 0, 0.2, ORANGE, 'parang', GOLD, k);
    R(0.4, 0.56, 0.04, 0.18, GOLD); // the timang buckle
    if (kind === 'explorer') facePoly(ctx, 'R', x, y, w, h, [[0.02, 1], [0.2, 1], [0.95, 0.24], [0.78, 0.24]], SOGA);
    return;
  }
  // the heavy ranks: lamellar of lacquered hide (gilt for the giant), a Surya Majapahit on the chest
  const plate = kind === 'giant' ? GOLD_D : '#4a2a1a';
  lamellar(ctx, x, y, w, h, 0.22, 0.9, 4, plate, kind === 'giant' ? RED : GOLD);
  batik(ctx, 'L', x, y, w, h, 0, 0.22, ORANGE, 'parang', GOLD, k);
  batik(ctx, 'R', x, y, w, h, 0, 0.22, ORANGE, 'parang', GOLD, k);
  B(0.18, 0.24, GOLD);
  B(0.9, 1, ORANGE);
  const [mx, my] = pt('R', x, y, w, h, 0.45, 0.6);
  ellipse(ctx, mx + 0.3 * k, my + 0.3 * k, 2.6 * k, 2.6 * k, GOLD_D);
  surya(ctx, mx, my, 2.5 * k, kind === 'giant' ? RED : GOLD, kind === 'giant' ? GOLD_L : ORANGE_D);
}

/** Thin moustaches for the officers and the giant. */
function face(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  if (kind !== 'swordsman' && kind !== 'knight' && kind !== 'giant' && kind !== 'kris') return;
  faceQuad(ctx, 'R', x, y, w, h, 0.26, 0.48, 0.21, 0.25, HAIR);
  faceQuad(ctx, 'R', x, y, w, h, 0.54, 0.76, 0.21, 0.25, HAIR);
  faceQuad(ctx, 'R', x, y, w, h, 0.22, 0.27, 0.16, 0.24, HAIR);
  faceQuad(ctx, 'R', x, y, w, h, 0.75, 0.8, 0.16, 0.24, HAIR);
  // gold ear studs
  faceQuad(ctx, 'L', x, y, w, h, 0.68, 0.82, 0.3, 0.44, GOLD);
}

// ---------------------------------------------------------------- headgear

/**
 * The udeng: a batik headcloth bound round the head, its folded front rising in a peak and the knotted ends standing up
 * at the back. With `bun` it is a blangkon instead: a fitted cap with the round mondolan knot at the nape.
 */
function udeng(ctx: Ctx, x: number, top: number, k: number, hw: number, base: string, fg: string, bun = false) {
  const w = hw + 0.6 * k, by = top + 4 * k;
  if (bun) { // the mondolan at the back of the head
    ellipse(ctx, x - w * 0.42, by - 1.6 * k, 2.6 * k, 2.4 * k, shade(base, -0.3));
    ellipse(ctx, x - w * 0.46, by - 2.1 * k, 1.6 * k, 1.4 * k, shade(base, -0.05));
  } else { // the knotted ends tucked in a small flap at the back
    poly(ctx, [x - w * 0.5, by - 2.4 * k, x - w * 0.7, by - 5.6 * k, x - w * 0.36, by - 4.6 * k], shade(base, -0.3));
    poly(ctx, [x - w * 0.44, by - 3 * k, x - w * 0.56, by - 6.2 * k, x - w * 0.28, by - 4.8 * k], shade(base, -0.08));
  }
  // the crown of the cloth over the top of the head
  poly(ctx, [x - w / 2, by - 4.2 * k, x, by - 4.2 * k - w / 4, x + w / 2, by - 4.2 * k, x, by - 4.2 * k + w / 4], shade(base, 0.14));
  batik(ctx, 'L', x, by, w, 4.2 * k, 0, 1, base, 'parang', fg, k);
  batik(ctx, 'R', x, by, w, 4.2 * k, 0, 1, base, 'parang', fg, k);
  band(ctx, x, by, w, 4.2 * k, 0, 0.18, shade(base, -0.35)); // the folded lower edge
  if (!bun) { // the front peak: the cloth folded up into a point over the brow
    const [fx, fy] = pt('R', x, by, w, 4.2 * k, 0.1, 1);
    poly(ctx, [fx - 2.4 * k, fy + 1.6 * k, fx + 0.6 * k, fy - 3.6 * k, fx + 2.8 * k, fy + 1.4 * k], shade(base, 0.08));
    poly(ctx, [fx + 0.6 * k, fy - 3.6 * k, fx + 2.8 * k, fy + 1.4 * k, fx + 0.8 * k, fy + 1.2 * k], shade(base, -0.2));
    line(ctx, fx - 2.2 * k, fy + 1.4 * k, fx + 2.6 * k, fy + 1.2 * k, fg, 0.4 * k);
  } else {
    band(ctx, x, by, w, 4.2 * k, 0.42, 0.56, GOLD); // a gold band on the blangkon
  }
}

/**
 * The Majapahit crown: a gold jamang band of pointed plates, a tall tiered kirita crown narrowing to a lotus bud, and
 * winged sumping ornaments curling up beside the ears. `tall` is 0..1.
 */
function crown(ctx: Ctx, x: number, top: number, k: number, hw: number, tall: number) {
  const w = hw + 0.4 * k, by = top + 3.4 * k;
  // the sumping: gold wings curling back from the temples
  for (const d of [-1, 1]) {
    const sx = x + d * w * 0.5, sy = by - 2 * k;
    poly(ctx, [sx, sy + 1.6 * k, sx + d * 3.4 * k, sy - 2.6 * k, sx + d * 2.2 * k, sy - 4.4 * k, sx + d * 4.4 * k, sy - 6 * k, sx + d * 1.4 * k, sy - 4.4 * k, sx - d * 0.2 * k, sy - 1.4 * k], d < 0 ? GOLD_D : GOLD);
    curve(ctx, sx, sy, sx + d * 2.6 * k, sy - 2.6 * k, sx + d * 3.8 * k, sy - 5.4 * k, 0.4 * k, GOLD_L);
  }
  // the band with its pointed plates and a red jewel
  box(ctx, x, by, w, 3 * k, GOLD, GOLD_L);
  band(ctx, x, by, w, 3 * k, 0, 0.2, GOLD_D);
  for (const f of ['L', 'R'] as const) for (const u of [0.15, 0.5, 0.85]) {
    const [px, py] = pt(f, x, by, w, 3 * k, u, 1);
    poly(ctx, [px - 1 * k, py + 0.4 * k, px, py - 2 * k, px + 1 * k, py + 0.4 * k], f === 'L' ? GOLD : GOLD_D);
  }
  const [jx, jy] = pt('R', x, by, w, 3 * k, 0.12, 0.5);
  ellipse(ctx, jx, jy, 0.9 * k, 0.9 * k, RED);
  ellipse(ctx, jx - 0.3 * k, jy - 0.3 * k, 0.3 * k, 0.3 * k, '#ffd0c0');
  // the tiered kirita: rings of gold, each narrower, a lotus bud on top
  let cy = by - 3 * k, cw = w * 0.82;
  const tiers = 2 + Math.round(tall * 2);
  for (let i = 0; i < tiers; i++) {
    const th = (2.6 - i * 0.2) * k;
    box(ctx, x, cy, cw, th, i % 2 ? GOLD_D : GOLD, GOLD_L);
    band(ctx, x, cy, cw, th, 0.7, 0.85, i % 2 ? GOLD : RED); // a jewelled ring
    cy -= th;
    cw *= 0.8;
  }
  poly(ctx, [x - cw * 0.55, cy + 0.6 * k, x, cy - (3 + tall * 2) * k, x + cw * 0.55, cy + 0.6 * k], GOLD);
  poly(ctx, [x, cy - (3 + tall * 2) * k, x + cw * 0.55, cy + 0.6 * k, x + 0.2 * k, cy + 0.9 * k], GOLD_D);
  ellipse(ctx, x, cy - (3 + tall * 2) * k, 0.7 * k, 0.7 * k, GOLD_L);
}

function head(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  switch (kind) {
    case 'warrior': udeng(ctx, x, top, k, hw, SOGA, CREAM); break;
    case 'archer': udeng(ctx, x, top, k, hw, INDIGO, CREAM); break;
    case 'explorer': udeng(ctx, x, top, k, hw, CREAM_D, SOGA, true); break;
    case 'kris': udeng(ctx, x, top, k, hw, ORANGE, GOLD); break;
    case 'defender': udeng(ctx, x, top, k, hw, SOGA_D, GOLD, true); break;
    case 'rider': udeng(ctx, x, top, k, hw, ORANGE_D, GOLD); break;
    case 'swordsman': crown(ctx, x, top, k, hw, 0); break;
    case 'knight': crown(ctx, x, top, k, hw, 0.5); break;
    case 'giant': crown(ctx, x, top, k, hw, 1); break;
    default: udeng(ctx, x, top, k, hw, SOGA, CREAM); break;
  }
}

// ---------------------------------------------------------------- shields and weapons

/**
 * The kris: a wavy (luk) blade rising from an asymmetric ganja, pamor patterning down the steel, a carved wooden hilt
 * bent like a bird's head over a gold mendak ring.
 */
function kris(ctx: Ctx, x: number, y: number, k: number, len = 1, luk = 7) {
  const L = 11 * k * len;
  const ang = -Math.PI / 2 + 0.22;
  const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
  const bx = x + ux * 1.6 * k, by = y + uy * 1.6 * k; // the blade's base
  const edge = (side: number) => {
    const out: number[] = [];
    for (let i = 0; i <= 28; i++) {
      const t = i / 28;
      const width = (1 - t * 0.7) * 1.35 * k * (t < 0.08 ? 1.3 : 1);
      const wave = Math.sin(t * Math.PI * luk) * 0.55 * k * (1 - t * 0.5);
      out.push(bx + ux * L * t + nx * (wave + side * width), by + uy * L * t + ny * (wave + side * width));
    }
    return out;
  };
  const a = edge(1), b = edge(-1);
  const tip = [bx + ux * (L + 1.8 * k), by + uy * (L + 1.8 * k)];
  const pts: number[] = [...a, tip[0], tip[1]];
  for (let i = b.length - 2; i >= 0; i -= 2) pts.push(b[i], b[i + 1]);
  poly(ctx, pts, STEEL);
  poly(ctx, [...a, tip[0], tip[1], ...Array.from({ length: 29 }, (_, i) => i).reverse().flatMap((i) => [(a[i * 2] + b[i * 2]) / 2, (a[i * 2 + 1] + b[i * 2 + 1]) / 2])], STEEL_D);
  // pamor: a pale grain wavering down the middle
  ctx.strokeStyle = ink(STEEL_L);
  ctx.lineWidth = 0.35 * k;
  ctx.beginPath();
  for (let i = 0; i <= 26; i++) { const px = (a[i * 2] * 0.62 + b[i * 2] * 0.38), py = (a[i * 2 + 1] * 0.62 + b[i * 2 + 1] * 0.38); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
  ctx.stroke();
  // the ganja: the wide asymmetric base plate
  poly(ctx, [bx + nx * 2.4 * k, by + ny * 2.4 * k, bx - nx * 1.4 * k, by - ny * 1.4 * k, bx - nx * 1.4 * k + ux * 1.2 * k, by - ny * 1.4 * k + uy * 1.2 * k, bx + nx * 2.8 * k + ux * 0.8 * k, by + ny * 2.8 * k + uy * 0.8 * k], STEEL_D);
  // the mendak ring and the hilt
  ellipse(ctx, x, y, 1.1 * k, 0.8 * k, GOLD);
  const hx = x - ux * 3.4 * k, hy = y - uy * 3.4 * k;
  poly(ctx, [x - nx * 0.8 * k, y - ny * 0.8 * k, x + nx * 0.8 * k, y + ny * 0.8 * k, hx + nx * 1 * k, hy + ny * 1 * k, hx - nx * 2.2 * k + ux * 0.4 * k, hy - ny * 2.2 * k, hx - nx * 1.2 * k, hy - ny * 1.2 * k + 0.8 * k], WOOD_D);
  line(ctx, x - nx * 0.4 * k, y - ny * 0.4 * k, hx - nx * 0.2 * k, hy - ny * 0.2 * k, WOOD_L, 0.35 * k);
}

/** A kris sheathed in its wrangka: a boat-shaped crosspiece and a slim gold-sheathed scabbard, worn at the back of the waist. */
function sheathedKris(ctx: Ctx, x: number, y: number, k: number) {
  poly(ctx, [x - 3.4 * k, y - 0.8 * k, x + 2.6 * k, y - 1.6 * k, x + 3.4 * k, y - 0.6 * k, x - 2.6 * k, y + 0.6 * k], WOOD);
  poly(ctx, [x - 3.4 * k, y - 0.8 * k, x + 2.6 * k, y - 1.6 * k, x + 2.2 * k, y - 1.1 * k, x - 3 * k, y - 0.3 * k], WOOD_L);
  poly(ctx, [x - 0.6 * k, y, x + 0.6 * k, y - 0.2 * k, x + 1.6 * k, y + 7 * k, x + 0.8 * k, y + 7.2 * k], GOLD_D);
  line(ctx, x - 0.2 * k, y, x + 1.1 * k, y + 7 * k, GOLD_L, 0.3 * k);
  curve(ctx, x - 0.4 * k, y - 1 * k, x - 1.2 * k, y - 3 * k, x + 0.4 * k, y - 3.6 * k, 1.2 * k, WOOD_D); // the hilt
}

/**
 * A tall narrow wooden shield (tameng), pointed at both ends, held upright: a painted border of red and black tumpal
 * triangles and a Surya Majapahit, or a naga, in the middle.
 */
function tallShield(ctx: Ctx, cx: number, cy: number, h: number, k: number, field = WOOD_L, motif: 'surya' | 'tumpal' = 'surya') {
  const w = h * 0.34;
  const outline = (dx: number, dy: number, s: number) => [cx + dx, cy + dy - h / 2 * s, cx + dx + w / 2 * s, cy + dy - h * 0.36 * s, cx + dx + w / 2 * s, cy + dy + h * 0.36 * s, cx + dx, cy + dy + h / 2 * s, cx + dx - w / 2 * s, cy + dy + h * 0.36 * s, cx + dx - w / 2 * s, cy + dy - h * 0.36 * s];
  poly(ctx, outline(0.9 * k, 0.5 * k, 1), WOOD_D); // its thickness
  poly(ctx, outline(0, 0, 1), RED_D);
  poly(ctx, outline(0, 0, 0.86), field);
  // tumpal triangles at top and bottom
  for (const d of [-1, 1]) {
    for (let i = -1; i <= 1; i++) poly(ctx, [cx + i * w * 0.26 - w * 0.12, cy + d * h * 0.3, cx + i * w * 0.26 + w * 0.12, cy + d * h * 0.3, cx + i * w * 0.26, cy + d * h * (0.3 - 0.12)], i ? RED : '#1a1210');
  }
  if (motif === 'surya') surya(ctx, cx, cy, w * 0.36, GOLD, RED);
  else for (let i = -1; i <= 1; i++) poly(ctx, [cx - w * 0.3, cy + i * h * 0.1 + h * 0.04, cx, cy + i * h * 0.1 - h * 0.05, cx + w * 0.3, cy + i * h * 0.1 + h * 0.04], i ? '#1a1210' : RED);
  line(ctx, cx, cy - h * 0.44, cx, cy + h * 0.44, 'rgba(0,0,0,0.2)', 0.5 * k); // the spine of the shield
  line(ctx, cx - w * 0.34, cy - h * 0.3, cx - w * 0.34, cy + h * 0.3, 'rgba(255,255,255,0.25)', 0.7 * k); // a sheen on the left
}

/** The tombak: a long spear with a leaf blade (wavy for the officers), a gold collar and a hanging tassel. */
function tombak(ctx: Ctx, x: number, y: number, k: number, len = 1, wavy = false, tc = RED) {
  const x0 = x - 2 * k, y0 = y + 6.6 * k, x1 = x + 3 * k * len, y1 = y - 21 * k * len;
  line(ctx, x0, y0, x1, y1, WOOD_D, 1.4 * k);
  line(ctx, x0 - 0.35 * k, y0, x1 - 0.35 * k, y1, WOOD_L, 0.45 * k);
  ellipse(ctx, x1, y1, 1 * k, 0.7 * k, GOLD);
  if (wavy) {
    const pts: number[] = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(x1 + Math.sin(t * Math.PI * 5) * 0.6 * k - (1 - t) * 1.2 * k + t * 0.4 * k, y1 - t * 7 * k); }
    for (let i = 10; i >= 0; i--) { const t = i / 10; pts.push(x1 + Math.sin(t * Math.PI * 5) * 0.6 * k + (1 - t) * 1.2 * k + t * 0.4 * k, y1 - t * 7 * k); }
    poly(ctx, pts, STEEL);
    line(ctx, x1, y1, x1 + 0.4 * k, y1 - 6.6 * k, STEEL_L, 0.35 * k);
  } else {
    poly(ctx, [x1 + 0.5 * k, y1 - 6.8 * k, x1 - 1.4 * k, y1 - 1.6 * k, x1 + 0.2 * k, y1 + 0.2 * k], STEEL_L);
    poly(ctx, [x1 + 0.5 * k, y1 - 6.8 * k, x1 + 1.9 * k, y1 - 1.4 * k, x1 + 0.2 * k, y1 + 0.2 * k], STEEL);
  }
  tassel(ctx, x1 - 0.1 * k, y1 + 0.8 * k, 4.4 * k, 1.4 * k, tc);
}

/** The sumpit: a long blowpipe of bored hardwood held upright, a spearhead lashed to its muzzle. */
function sumpit(ctx: Ctx, x: number, y: number, k: number) {
  const x0 = x - 2.4 * k, y0 = y + 7 * k, x1 = x + 3.4 * k, y1 = y - 24 * k;
  line(ctx, x0, y0, x1, y1, '#3a2614', 1.6 * k);
  line(ctx, x0 - 0.4 * k, y0, x1 - 0.4 * k, y1, '#6a4a2a', 0.5 * k);
  for (const t of [0.15, 0.55, 0.9]) { const px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t; line(ctx, px - 1 * k, py + 0.2 * k, px + 1 * k, py - 0.2 * k, GOLD, 0.6 * k); } // rattan bindings
  ellipse(ctx, x0, y0, 0.9 * k, 0.6 * k, '#1a1008'); // the mouthpiece
  poly(ctx, [x1 - 0.2 * k, y1 - 5.6 * k, x1 - 1.2 * k, y1 + 0.4 * k, x1 + 0.9 * k, y1 + 0.4 * k], STEEL_L); // the lashed spearhead
  poly(ctx, [x1 - 0.2 * k, y1 - 5.6 * k, x1 + 0.9 * k, y1 + 0.4 * k, x1 + 0.1 * k, y1 + 0.4 * k], STEEL);
  line(ctx, x1 - 1 * k, y1 + 1 * k, x1 + 1 * k, y1 + 0.6 * k, RED, 0.7 * k);
}

/** A bamboo tube of darts with a carved lid, at the hip. */
function dartQuiver(ctx: Ctx, x: number, y: number, k: number) {
  const qx = x - 6.4 * k;
  box(ctx, qx, y - 2 * k, 3 * k, 8 * k, BAMB);
  for (const v of [0.25, 0.6]) band(ctx, qx, y - 2 * k, 3 * k, 8 * k, v, v + 0.06, BAMB_D);
  band(ctx, qx, y - 2 * k, 3 * k, 8 * k, 0.86, 1, ORANGE);
  ellipse(ctx, qx, y - 10.6 * k, 1.5 * k, 0.8 * k, WOOD_D); // the lid
  for (const i of [-1, 0, 1]) line(ctx, qx + i * 0.5 * k, y - 10.4 * k, qx + i * 0.8 * k, y - 12.6 * k, CREAM, 0.4 * k); // dart flights of kapok
}

/** A short wooden walking staff hung with a bundle (the explorer). */
function bundleStaff(ctx: Ctx, x: number, y: number, k: number) {
  line(ctx, x - 1 * k, y + 2 * k, x + 4 * k, y - 18 * k, WOOD, 1.1 * k);
  const bx = x + 3.4 * k, by = y - 15 * k;
  ellipse(ctx, bx + 3 * k, by + 3.4 * k, 2.8 * k, 2.4 * k, SOGA_D);
  ellipse(ctx, bx + 2.6 * k, by + 2.8 * k, 2.2 * k, 1.8 * k, SOGA);
  poly(ctx, [bx + 2 * k, by + 1 * k, bx + 3.6 * k, by + 1 * k, bx + 2.8 * k, by + 2 * k], ORANGE);
}

function weapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  switch (kind) {
    case 'kris':
      kris(ctx, x, y, k, 1.05, 7);
      tallShield(ctx, b.off.x - 1.6 * k, b.off.y - 6 * k, 15 * k, k, WOOD_L, 'surya');
      return true;
    case 'warrior':
      tombak(ctx, x, y, k, 0.92, false, ORANGE);
      tallShield(ctx, b.off.x - 1.4 * k, b.off.y - 5.4 * k, 11.5 * k, k, THATCH, 'tumpal');
      return true;
    case 'archer': sumpit(ctx, x, y, k); return true;
    case 'defender': tombak(ctx, x, y, k, 1.05, false, RED); return true; // the shield is drawn afterwards
    case 'swordsman':
      kris(ctx, x, y, k, 1.2, 9);
      tallShield(ctx, b.off.x - 1.6 * k, b.off.y - 6 * k, 14 * k, k, ORANGE_D, 'surya');
      return true;
    case 'giant':
      tombak(ctx, x, y, k, 1.15, true, ORANGE);
      tallShield(ctx, b.off.x - 1.6 * k, b.off.y - 6 * k, 14 * k, k, RED_D, 'surya');
      return true;
    case 'explorer': bundleStaff(ctx, x, y, k); return true;
  }
  return false;
}

function shield(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number): boolean {
  tallShield(ctx, x - 1.6 * k, y - 6.4 * k, kind === 'defender' ? 17 * k : 13 * k, k, WOOD_L, kind === 'defender' ? 'surya' : 'tumpal');
  return true;
}

// ---------------------------------------------------------------- figures on foot

const LEGS = [[-2.2, -0.3, 'L'], [2.2, 0.7, 'R'], [2.2, 0.7, 'L']] as const;

/**
 * The sarong wrapped from the waist to the ankle (hitched up to the knee for the wading Kris Warrior), bare feet below,
 * a pleated front fold (wiru) and a pale border at the hem.
 */
function sarong(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  const hitched = kind === 'kris';
  const [base, motif, fg] = kain(kind);
  for (const [dx, dy, f] of LEGS) { // bare shins and feet
    const q = (v0: number, v1: number, c: string, u0 = 0, u1 = 1) => faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, u0, u1, v0, v1, c);
    q(0, hitched ? 0.9 : 0.5, SKIN);
    q(0.3, 0.36, shade(SKIN, -0.14), 0.2, 0.8); // the calf's shade
    if (hitched) q(0.12, 0.2, GOLD); // a gold anklet
  }
  faceQuad(ctx, 'R', x + 2.2 * k, y + 0.7 * k, 3.6 * k, 5.2 * k, 0, 0.35, 0, 0.1, shade(SKIN, -0.2)); // toes
  const cy = y - (hitched ? 2 : 0.6) * k, h = (hitched ? 3.1 : 4.5) * k, w = 9.6 * k;
  batik(ctx, 'L', x, cy, w, h, 0, 1, base, motif, fg, k);
  batik(ctx, 'R', x, cy, w, h, 0, 1, base, motif, fg, k);
  band(ctx, x, cy, w, h, 0, 0.14, shade(base, 0.3)); // the border at the hem
  band(ctx, x, cy, w, h, 0.14, 0.18, shade(base, -0.4));
  for (const u of [0.06, 0.14, 0.22]) { // the wiru pleats down the front
    const [ax, ay] = pt('R', x, cy, w, h, u, 1), [bx, by] = pt('R', x, cy, w, h, u, 0);
    line(ctx, ax, ay, bx, by, shade(base, -0.45), 0.4 * k);
  }
  if (hitched) { // the hem tucked up into the waist makes a swag on the left
    const [sx, sy] = pt('L', x, cy, w, h, 0.25, 0.2);
    curve(ctx, sx, sy, sx + 2 * k, sy + 1.6 * k, sx + 4 * k, sy + 0.6 * k, 0.6 * k, shade(base, -0.4));
  }
}

/** Gold armbands on both upper arms (and a bangle at the wrist for the Kris Warrior). */
function armbands(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  const hip = y - 5 * k;
  const F = (ax: number, ay: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', ax, ay, 2.8 * k, 7 * k, 0, 1, v0, v1, c);
  F(x + 6 * k, hip + 0.6 * k, 0.66, 0.8, GOLD);
  F(x + 6 * k, hip + 0.6 * k, 0.7, 0.74, GOLD_L);
  F(x - 5.9 * k, hip - 1 * k, 0.6, 0.72, GOLD);
  if (kind === 'kris') F(x + 6 * k, hip + 0.6 * k, 0.14, 0.24, GOLD);
}

function footUnit(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  if (kind === 'archer') dartQuiver(ctx, x, y, k);
  if (kind === 'explorer') { // a woven pandan basket on the back
    box(ctx, x - 5.6 * k, y - 6 * k, 4.6 * k, 7 * k, MAT);
    for (const v of [0.2, 0.45, 0.7]) band(ctx, x - 5.6 * k, y - 6 * k, 4.6 * k, 7 * k, v, v + 0.06, MAT_D);
    band(ctx, x - 5.6 * k, y - 6 * k, 4.6 * k, 7 * k, 0.9, 1, ORANGE);
  }
  if (kind === 'warrior' || kind === 'defender') sheathedKris(ctx, x - 4 * k, y - 8.4 * k, k); // everyone carries a kris at the back
  const b = figure(ctx, kind, 'majapahit', x, y, k);
  sarong(ctx, kind, x, y, k);
  if (isBare(kind) || kind === 'defender') armbands(ctx, kind, x, y, k);
  weapon(ctx, kind, b, k);
  if (kind === 'defender') shield(ctx, kind, b.off.x, b.off.y, k);
}

// ---------------------------------------------------------------- cavalry

/** A batik saddle cloth hanging over the horse's flank. */
function caparison(ctx: Ctx, sx: number, sy: number, k: number, base: string, fg: string) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(sx - 5 * k, sy + 1 * k); ctx.lineTo(sx + 4 * k, sy + 0.6 * k); ctx.lineTo(sx + 4.6 * k, sy + 6.6 * k); ctx.lineTo(sx - 4.6 * k, sy + 7.4 * k);
  ctx.closePath();
  ctx.fillStyle = ink(base);
  ctx.fill();
  ctx.clip();
  for (let i = -6; i < 8; i++) line(ctx, sx + i * 1.8 * k, sy + 8 * k, sx + i * 1.8 * k + 8 * k, sy, fg, 0.6 * k);
  ctx.restore();
  line(ctx, sx - 4.6 * k, sy + 7.4 * k, sx + 4.6 * k, sy + 6.6 * k, GOLD, 0.9 * k);
  for (const t of [0.1, 0.4, 0.7, 1]) tassel(ctx, sx - 4.6 * k + 9.2 * k * t, sy + 7.4 * k - 0.8 * k * t, 1.8 * k, 0.7 * k, ORANGE);
}

/** The umbul-umbul: a tall bamboo pole bending at the top, a long narrow banner hanging from it. */
function umbul(ctx: Ctx, x: number, y: number, h: number, k: number, c = ORANGE) {
  curve(ctx, x, y, x + 0.4 * k, y - h * 0.6, x + 3 * k, y - h, 0.9 * k, BAMB_D);
  const tx = x + 1.2 * k, ty = y - h * 0.82;
  poly(ctx, [tx, ty, tx + 2.6 * k, ty - 0.2 * k, tx + 3.2 * k, ty + h * 0.42, tx + 1.6 * k, ty + h * 0.5, tx + 0.4 * k, ty + h * 0.44], c);
  poly(ctx, [tx, ty, tx + 1.2 * k, ty - 0.1 * k, tx + 1.6 * k, ty + h * 0.5, tx + 0.4 * k, ty + h * 0.44], shade(c, 0.15));
  for (const t of [0.1, 0.22]) line(ctx, tx + 0.1 * k, ty + h * t, tx + 2.8 * k, ty + h * t, GOLD, 0.5 * k);
  line(ctx, x + 3 * k, y - h, x + 3.6 * k, y - h - 1.4 * k, GOLD, 0.6 * k);
}

/** A payung: a tiered royal parasol of gold and orange on a pole. */
function payung(ctx: Ctx, x: number, y: number, r: number, k: number) {
  line(ctx, x, y, x, y - r * 2.4, WOOD_D, 0.8 * k);
  const top = y - r * 2.2;
  for (const [ry, rr, c] of [[0, 1, ORANGE], [-1.6, 0.72, GOLD], [-2.8, 0.44, ORANGE]] as const) {
    const yy = top + ry * k;
    poly(ctx, [x - r * rr, yy + r * rr * 0.32, x, yy - r * rr * 0.28, x + r * rr, yy + r * rr * 0.32, x, yy + r * rr * 0.5], c);
    poly(ctx, [x, yy - r * rr * 0.28, x + r * rr, yy + r * rr * 0.32, x, yy + r * rr * 0.5], shade(c, -0.22));
    for (let i = 0; i <= 6; i++) { const t = i / 6; const px = x - r * rr + 2 * r * rr * t, py = yy + r * rr * 0.32 + Math.sin(t * Math.PI) * r * rr * 0.18; line(ctx, px, py, px, py + 1.2 * k, GOLD, 0.35 * k); } // the gold fringe
  }
  ellipse(ctx, x, top - 3.6 * k, 0.8 * k, 0.8 * k, GOLD_L);
}

function rider(ctx: Ctx, x: number, y: number) {
  const saddle = drawHorse(ctx, x - 1, y + 3, 0.92, '#7a4a2a', '#1a120c', undefined, ORANGE);
  caparison(ctx, saddle.x, saddle.y, 0.95, SOGA, CREAM);
  tassel(ctx, x + 8.6, y - 18.4, 2.6, 1, ORANGE); // a plume between the ears
  const b = figure(ctx, 'rider', 'majapahit', saddle.x, saddle.y, 0.9, true);
  tallShield(ctx, b.off.x - 2.4, b.off.y - 3, 9, 0.7, THATCH, 'tumpal');
  tombak(ctx, b.hand.x, b.hand.y + 1, 0.9, 1.1, false, ORANGE);
}

function knight(ctx: Ctx, x: number, y: number) {
  const saddle = drawHorse(ctx, x - 1, y + 3, 1, '#e8dcc4', '#3a2a1a', undefined, RED);
  caparison(ctx, saddle.x, saddle.y, 1.05, ORANGE_D, GOLD);
  // a gold breast band with bells, and a gold crest on the brow
  line(ctx, x + 3.6, y - 10, x + 8.4, y - 4, GOLD, 1.3);
  for (const t of [0.25, 0.6, 0.9]) ellipse(ctx, x + 3.6 + 4.8 * t, y - 10 + 6 * t + 1, 0.8, 0.8, GOLD_L);
  poly(ctx, [x + 9, y - 19, x + 10.4, y - 24, x + 11.4, y - 19], GOLD);
  payung(ctx, saddle.x - 6, saddle.y + 2, 6.4, 1); // the royal parasol, carried on a socket behind the saddle
  const b = figure(ctx, 'knight', 'majapahit', saddle.x, saddle.y, 0.95, true);
  sheathedKris(ctx, saddle.x - 2.4, saddle.y - 3, 0.8);
  tombak(ctx, b.hand.x, b.hand.y + 1, 0.95, 1.15, true, GOLD);
}

// ---------------------------------------------------------------- siege: the cetbang

/** A bronze cetbang on a wooden carriage: a ringed barrel ending in a naga head, a gunner with a smouldering linstock. */
function cetbang(ctx: Ctx, x: number, y: number) {
  softShadow(ctx, x, y + 2, 16, 5, 0.28);
  // the carriage: a low wooden sledge with two solid wheels
  box(ctx, x - 1, y + 1, 18, 3, WOOD, WOOD_L);
  for (const wx of [-7, 5]) {
    ellipse(ctx, x + wx, y + 2.4, 3.4, 3.6, WOOD_D);
    ellipse(ctx, x + wx - 0.4, y + 2.2, 2.8, 3, WOOD);
    ellipse(ctx, x + wx - 0.4, y + 2.2, 0.9, 1, GOLD_D);
  }
  poly(ctx, [x - 8, y - 2, x + 6, y - 6, x + 6, y - 3, x - 8, y + 1], WOOD_D); // the cradle
  // the barrel: a tapering bronze tube with raised rings, lying on the cradle, aimed up and to the right
  const bx0 = x - 9, by0 = y - 4.6, bx1 = x + 12, by1 = y - 11;
  const len = Math.hypot(bx1 - bx0, by1 - by0), ux = (bx1 - bx0) / len, uy = (by1 - by0) / len, nx = -uy, ny = ux;
  const r0 = 2.6, r1 = 1.8;
  poly(ctx, [bx0 + nx * r0, by0 + ny * r0, bx1 + nx * r1, by1 + ny * r1, bx1 - nx * r1, by1 - ny * r1, bx0 - nx * r0, by0 - ny * r0], BRONZE);
  poly(ctx, [bx0 - nx * r0 * 0.2, by0 - ny * r0 * 0.2, bx1 - nx * r1 * 0.2, by1 - ny * r1 * 0.2, bx1 - nx * r1, by1 - ny * r1, bx0 - nx * r0, by0 - ny * r0], BRONZE_L);
  for (const t of [0.12, 0.3, 0.55, 0.78]) { const px = bx0 + ux * len * t, py = by0 + uy * len * t, r = r0 + (r1 - r0) * t + 0.4; line(ctx, px + nx * r, py + ny * r, px - nx * r, py - ny * r, BRONZE_D, 0.9); }
  ellipse(ctx, bx0 - ux * 1, by0 - uy * 1, 1.6, 2, BRONZE_D); // the cascabel
  // the naga head at the muzzle, its jaws open round the bore
  const hx = bx1 + ux * 1.6, hy = by1 + uy * 1.6;
  poly(ctx, [hx - nx * 2.6, hy - ny * 2.6, hx + ux * 3.6 - nx * 1.8, hy + uy * 3.6 - ny * 1.8 - 1.4, hx + ux * 4.4, hy + uy * 4.4, hx + ux * 3.4 + nx * 1.8, hy + uy * 3.4 + ny * 1.8 + 0.6, hx + nx * 2.4, hy + ny * 2.4], BRONZE);
  poly(ctx, [hx - nx * 2.6, hy - ny * 2.6 - 0.4, hx - nx * 1 - 1.6, hy - ny * 1 - 3.4, hx + ux * 2 - nx * 1, hy + uy * 2 - ny * 1 - 1.4], GOLD_D); // the crest
  ellipse(ctx, hx + ux * 1.6 - nx * 1, hy + uy * 1.6 - ny * 1, 0.5, 0.5, '#1a1008');
  ellipse(ctx, hx + ux * 4.2, hy + uy * 4.2, 0.9, 0.9, '#1a1008'); // the bore
  // a pyramid of stone shot and a rammer
  for (const [sx, sy] of [[-12, 5], [-10, 5.4], [-11, 3.6]] as const) { ellipse(ctx, x + sx, y + sy, 1.3, 1.2, '#7a766c'); ellipse(ctx, x + sx - 0.4, y + sy - 0.4, 0.5, 0.4, '#b0aca0'); }
  line(ctx, x - 15, y + 4, x - 9, y - 9, WOOD_L, 0.7);
  // the gunner kneels behind with a smouldering linstock, an orange umbul-umbul planted beside the gun
  umbul(ctx, x - 14, y + 3, 24, 1, ORANGE);
  const b = figure(ctx, 'warrior', 'majapahit', x + 15, y + 6, 0.55);
  sarong(ctx, 'archer', x + 15, y + 6, 0.55);
  curve(ctx, b.hand.x, b.hand.y + 1, b.hand.x - 2, b.hand.y - 4, bx0 + ux * 4, by0 + uy * 4 - 3, 0.6, WOOD_D);
  ellipse(ctx, bx0 + ux * 4, by0 + uy * 4 - 3, 0.8, 0.8, '#ff8a2a');
  curve(ctx, bx0 + ux * 4, by0 + uy * 4 - 4, bx0 + ux * 4 + 2, by0 - 8, bx0 + ux * 4 - 1, by0 - 12, 0.6, 'rgba(200,200,200,0.55)'); // a wisp of smoke
}

// ---------------------------------------------------------------- the sea: jukung and jong

/**
 * A tanja sail: a canted rectangle of pandan matting between a yard and a boom, its forward edge high, with battens.
 * The mast stands at mx; the sail spans `sw` to the right of it and `sw * 0.3` behind.
 */
function tanja(ctx: Ctx, mx: number, topY: number, botY: number, sw: number, mat = MAT, emblem = false) {
  const A: [number, number] = [mx - sw * 0.34, topY + sw * 0.32]; // after end of the yard
  const B: [number, number] = [mx + sw, topY - sw * 0.06]; // fore end of the yard, raised
  const C: [number, number] = [mx + sw * 0.86, botY - sw * 0.2]; // fore end of the boom
  const D: [number, number] = [mx - sw * 0.44, botY + sw * 0.1]; // after end of the boom
  poly(ctx, [...A, ...B, ...C, ...D], mat);
  poly(ctx, [...A, ...B, B[0] - sw * 0.06, B[1] + (C[1] - B[1]) * 0.18, A[0] - sw * 0.02, A[1] + (D[1] - A[1]) * 0.18], shade(mat, 0.12));
  const n = Math.max(4, Math.round((botY - topY) / 4.4));
  for (let i = 1; i < n; i++) { // battens
    const t = i / n;
    line(ctx, A[0] + (D[0] - A[0]) * t, A[1] + (D[1] - A[1]) * t, B[0] + (C[0] - B[0]) * t, B[1] + (C[1] - B[1]) * t, shade(mat, -0.32), 0.6);
  }
  for (let i = 1; i < 6; i++) { const t = i / 6; line(ctx, A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, D[0] + (C[0] - D[0]) * t, D[1] + (C[1] - D[1]) * t, 'rgba(90,60,20,0.18)', 0.4); } // the weave
  line(ctx, A[0] - 1, A[1] + 0.4, B[0] + 1.4, B[1] - 0.3, WOOD_D, 1.1); // yard
  line(ctx, D[0] - 1, D[1] + 0.3, C[0] + 1, C[1] - 0.3, WOOD_D, 1); // boom
  if (emblem) surya(ctx, (A[0] + B[0] + C[0] + D[0]) / 4, (A[1] + B[1] + C[1] + D[1]) / 4, sw * 0.26, ORANGE, GOLD);
}

/** The jong's hull: deep, dark, a raised stern, an orange and gold wale; returns the gunwale height along t ∈ [-1, 1]. */
function jongHull(ctx: Ctx, x: number, y: number, w: number, stern: number, deck: () => void) {
  const top = (t: number) => y - 5 - (t < 0 ? Math.pow(-t, 2.2) * stern : Math.pow(t, 2.4) * 3);
  const near: [number, number][] = [];
  for (let i = 0; i <= 12; i++) { const t = -1 + i / 6; near.push([x + t * w, top(t)]); }
  const far = near.map(([px, py], i): [number, number] => [px + (i === 0 ? 2.4 : i === 12 ? -2.4 : 0), py - 2.6]);
  poly(ctx, [...near.flatMap(([a, b]) => [a, b]), ...[...far].reverse().flatMap(([a, b]) => [a, b])], '#2a1c12');
  poly(ctx, [x - w * 0.9, y - 5.2, x + w * 0.9, y - 5.4, x + w * 0.9, y - 7.4, x - w * 0.9, y - 7.2], '#9a7448'); // the deck
  deck();
  const hullPts = [...near, [x + w * 0.92, y - 1], [x + w * 0.55, y + 2.6], [x, y + 3.2], [x - w * 0.55, y + 2.6], [x - w * 0.95, y - 1.4]] as [number, number][];
  poly(ctx, hullPts.flatMap(([a, b]) => [a, b]), '#3e2818');
  poly(ctx, [...near.flatMap(([a, b]) => [a, b]), x + w * 0.85, y - 2.6, x, y - 2.2, x - w * 0.85, y - 2.8], '#5e3e26');
  const stroke = (dy: number, c: string, wd: number) => {
    ctx.strokeStyle = ink(c);
    ctx.lineWidth = wd;
    ctx.lineCap = 'round';
    ctx.beginPath();
    near.forEach(([a, b], i) => (i ? ctx.lineTo(a, b + dy) : ctx.moveTo(a, b + dy)));
    ctx.stroke();
  };
  stroke(1.3, ORANGE, 1.5);
  stroke(2.4, GOLD, 0.5);
  stroke(0, WOOD_L, 0.7);
  for (const t of [-0.6, -0.2, 0.2, 0.6]) line(ctx, x + t * w, top(t) + 2.8, x + t * w - 0.4, y + 2.2, 'rgba(0,0,0,0.25)', 0.4); // plank seams
  // the twin quarter rudders hanging at the stern
  for (const d of [0, 1.6]) {
    const rx = x - w * 0.84 + d, ry = top(-0.84) + 1;
    line(ctx, rx, ry - 3, rx - 2.6, y + 4, WOOD_D, 1.2);
    poly(ctx, [rx - 1.4, y + 0.6, rx - 4, y + 1.4, rx - 3.6, y + 5.4, rx - 2, y + 5], WOOD);
  }
  // a Surya painted at the bow
  surya(ctx, x + w * 0.7, top(0.7) + 2.8, 1.8, GOLD, ORANGE);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y + 3.2, w * 0.84, 2.2, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.stroke();
  return top;
}

/** The roofed stern castle of a jong: a timber deckhouse, red-painted, under a steep ijuk roof. */
function sternCastle(ctx: Ctx, x: number, y: number, w: number, h: number, storeys: number) {
  let cy = y, cw = w;
  for (let i = 0; i < storeys; i++) {
    box(ctx, x, cy, cw, h, i ? WOOD : RED_D, i ? WOOD_L : shade(RED_D, 0.2));
    for (const u of [0.25, 0.65]) faceQuad(ctx, 'L', x, cy, cw, h, u, u + 0.14, 0.25, 0.8, '#2a1a10');
    band(ctx, x, cy, cw, h, 0.88, 1, GOLD);
    cy -= h;
    cw *= 0.82;
  }
  // a steep pyramid roof of black ijuk with an upturned ridge end
  poly(ctx, [x - cw / 2 - 1.4, cy + 0.6, x, cy + cw / 4 + 1, x, cy - cw * 0.7], shade(IJUK, 0.12));
  poly(ctx, [x + cw / 2 + 1.4, cy + 0.6, x, cy + cw / 4 + 1, x, cy - cw * 0.7], IJUK);
  line(ctx, x - cw / 2 - 1.4, cy + 0.6, x, cy + cw / 4 + 1, IJUK_L, 0.6);
  ellipse(ctx, x, cy - cw * 0.7, 0.8, 0.8, GOLD);
}

function boats(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  if (kind === 'boat') {
    // a jukung: a slim dugout with a swordfish prow, bamboo outriggers on curved booms, a little canted sail and a paddler
    const w = 16;
    // the far outrigger float and its booms
    line(ctx, x - 9, y - 9, x + 9, y - 11, BAMB_D, 1.4);
    line(ctx, x - 9, y - 9.6, x + 9, y - 11.6, BAMB, 0.6);
    for (const bx of [-5, 5]) curve(ctx, x + bx, y - 5, x + bx + 0.6, y - 12, x + bx + 1.4, y - 10.2, 0.8, WOOD_L);
    tanja(ctx, x + 1, y - 30, y - 9, 9, '#e8d8b0');
    line(ctx, x + 1, y - 31, x + 1, y - 5, WOOD_D, 1);
    // the canoe: white with an orange band, its prow running out to a long swordfish bill
    const hull: number[] = [x - w, y - 6.4, x - w * 0.6, y - 4.6, x + w * 0.6, y - 4.6, x + w, y - 6.6, x + w + 5, y - 8.6, x + w * 0.9, y - 3.8, x + w * 0.5, y + 1.4, x - w * 0.5, y + 1.4, x - w * 0.9, y - 3];
    poly(ctx, hull, '#f2ead6');
    poly(ctx, [x - w * 0.9, y - 3, x - w * 0.5, y + 1.4, x + w * 0.5, y + 1.4, x + w * 0.9, y - 3.8, x + w * 0.5, y - 1.2, x - w * 0.5, y - 1.2], '#3a6a8a');
    line(ctx, x - w * 0.95, y - 5, x + w * 0.95, y - 5.2, ORANGE, 1.2);
    ellipse(ctx, x + w * 0.78, y - 4.4, 1, 0.8, '#101010'); // the painted eye
    ellipse(ctx, x + w * 0.78, y - 4.6, 0.3, 0.3, '#ffffff');
    figure(ctx, 'warrior', 'majapahit', x - 5, y - 3.6, 0.5, true);
    line(ctx, x - 2, y - 7, x - 7, y + 2, WOOD_L, 0.7); // the paddle
    ellipse(ctx, x - 7.2, y + 2.4, 0.9, 1.6, WOOD);
    // the near outrigger float on its booms
    for (const bx of [-5, 5]) curve(ctx, x + bx, y - 5, x + bx - 1, y - 1, x + bx - 2.4, y + 3.4, 0.9, WOOD_L);
    line(ctx, x - 11, y + 4, x + 7, y + 2.4, BAMB_D, 1.6);
    line(ctx, x - 11, y + 3.4, x + 7, y + 1.8, BAMB, 0.7);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(x - 2, y + 4.4, 10, 1.4, 0, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
    return;
  }
  if (kind === 'ship') {
    // a trading jong: two canted tanja sails, a roofed stern castle, a bowsprit with a small sail, crew with tombak
    const w = 25;
    tanja(ctx, x - 6, y - 36, y - 12, 10, MAT_D);
    line(ctx, x - 6, y - 37, x - 6, y - 8, WOOD_D, 1.3);
    tanja(ctx, x + 6, y - 42, y - 12, 12, MAT);
    line(ctx, x + 6, y - 43, x + 6, y - 8, WOOD_D, 1.4);
    const top = jongHull(ctx, x, y, w, 7, () => {
      sternCastle(ctx, x - 17, y - 6, 8, 4.4, 1);
      for (const [cx2, kd] of [[0.1, 'warrior'], [0.42, 'archer']] as const) figure(ctx, kd, 'majapahit', x + cx2 * w, y - 4.8, 0.42, true);
      for (const [bx, by] of [[-0.3, 0], [-0.16, 0.6], [0.6, 0.2]] as const) { box(ctx, x + bx * w, y - 6 + by, 3, 2.2, MAT_D, MAT); line(ctx, x + bx * w - 1.4, y - 7.2 + by, x + bx * w + 1.4, y - 7.4 + by, ORANGE, 0.5); } // spice bales
    });
    // the bowsprit and its little sail
    const bx = x + w, by = top(1);
    line(ctx, bx - 2, by + 1, bx + 7, by - 3.6, WOOD_D, 1);
    poly(ctx, [bx + 1, by - 2, bx + 6.4, by - 4.4, bx + 5.6, by + 1.4, bx + 1.6, by + 2.2], MAT);
    umbul(ctx, x + 6, y - 43, 10, 0.7, ORANGE);
    return;
  }
  // the warship: a great war jong with three tanja sails (the main with the Surya), a two-storey stern castle, shields
  // along the rail and a cetbang at the bow
  const w = 29;
  tanja(ctx, x - 10, y - 36, y - 14, 9, MAT_D);
  line(ctx, x - 10, y - 37, x - 10, y - 9, WOOD_D, 1.2);
  tanja(ctx, x + 3, y - 48, y - 14, 14, MAT, true);
  line(ctx, x + 3, y - 49, x + 3, y - 9, WOOD_D, 1.6);
  tanja(ctx, x + 16, y - 36, y - 14, 8, MAT_D);
  line(ctx, x + 16, y - 37, x + 16, y - 9, WOOD_D, 1.2);
  const top = jongHull(ctx, x, y, w, 9, () => {
    sternCastle(ctx, x - 20, y - 6, 10, 4.6, 2);
    for (const [cx2, kd] of [[-0.28, 'swordsman'], [0.02, 'archer'], [0.3, 'defender'], [0.56, 'warrior']] as const) figure(ctx, kd, 'majapahit', x + cx2 * w, y - 5, 0.42, true);
  });
  for (let i = 0; i < 6; i++) { const t = -0.46 + i * 0.2; tallShield(ctx, x + t * w, top(t) + 0.6, 6, 0.4, i % 2 ? ORANGE_D : WOOD_L, i % 2 ? 'tumpal' : 'surya'); } // shields along the rail
  // the bow cetbang poking out over the stem
  const bx = x + w * 0.88, by = top(0.88) - 1;
  line(ctx, bx - 3, by + 1, bx + 5, by - 1.6, BRONZE_D, 2.4);
  line(ctx, bx - 3, by + 0.4, bx + 5, by - 2.2, BRONZE_L, 0.7);
  ellipse(ctx, bx + 5.2, by - 1.7, 1.2, 1.3, BRONZE_D);
  // flags: umbul-umbul at the stern, a pennant at the main truck
  umbul(ctx, x - 22, top(-0.76) - 9, 16, 0.8, ORANGE);
  poly(ctx, [x + 3, y - 49, x + 11, y - 47.6, x + 8, y - 46, x + 11, y - 44.4, x + 3, y - 45], ORANGE);
  ellipse(ctx, x + 6.4, y - 47, 0.9, 0.9, GOLD);
}

// ---------------------------------------------------------------- buildings

/** Iso point at (u, v) from the centre: u runs down to the right, v down to the left. */
const P = (cx: number, cy: number, u: number, v: number): [number, number] => [cx + u - v, cy + (u + v) / 2];

/** Two visible walls of a rectangular block: half-extents A along u, B along v, height h. */
function walls(ctx: Ctx, cx: number, cy: number, A: number, B: number, h: number, color: string) {
  const [lx, ly] = P(cx, cy, -A, B), [fx, fy] = P(cx, cy, A, B), [rx, ry] = P(cx, cy, A, -B);
  poly(ctx, [lx, ly, fx, fy, fx, fy - h, lx, ly - h], shade(color, 0.06));
  poly(ctx, [fx, fy, rx, ry, rx, ry - h, fx, fy - h], shade(color, -0.22));
}
/** The top face of a block. */
function lid(ctx: Ctx, cx: number, cy: number, A: number, B: number, color: string) {
  poly(ctx, [...P(cx, cy, -A, -B), ...P(cx, cy, A, -B), ...P(cx, cy, A, B), ...P(cx, cy, -A, B)], color);
}
/** A brick block with its courses drawn in. */
function brickBlock(ctx: Ctx, cx: number, cy: number, A: number, B: number, h: number, color = BRICK, courses = true) {
  walls(ctx, cx, cy, A, B, h, color);
  lid(ctx, cx, cy - h, A, B, shade(color, 0.16));
  if (!courses) return;
  const [lx, ly] = P(cx, cy, -A, B), [fx, fy] = P(cx, cy, A, B), [rx, ry] = P(cx, cy, A, -B);
  for (let yy = 1.4; yy < h - 0.3; yy += 1.4) {
    line(ctx, lx, ly - yy, fx, fy - yy, 'rgba(70,24,12,0.35)', 0.3);
    line(ctx, fx, fy - yy, rx, ry - yy, 'rgba(50,16,8,0.35)', 0.3);
  }
}

/**
 * A stepped brick roof: tiers each narrower than the last, small corner turrets (miniature candi) on each tier, and a
 * ratna finial on top. Returns the y of the finial's tip.
 */
function steppedRoof(ctx: Ctx, cx: number, cy: number, A: number, tiers: number, th: number, color = BRICK) {
  let y = cy, a = A;
  for (let i = 0; i < tiers; i++) {
    brickBlock(ctx, cx, y, a, a, th, i % 2 ? shade(color, 0.06) : color, false);
    walls(ctx, cx, y - th + 0.6, a + 0.5, a + 0.5, 0.6, shade(color, -0.12)); // the cornice
    for (const [u, v] of [[-a, a], [a, a], [a, -a]] as const) { // corner turrets
      const [px, py] = P(cx, y - th, u * 0.82, v * 0.82);
      poly(ctx, [px - 0.9, py, px, py - 2.4 - th * 0.2, px + 0.9, py], shade(color, -0.08));
      poly(ctx, [px, py - 2.4 - th * 0.2, px + 0.9, py, px, py + 0.4], shade(color, -0.3));
    }
    y -= th;
    a *= 0.74;
  }
  // the ratna: a bell on a lotus cushion and a spire
  ellipse(ctx, cx, y, a * 1.2, a * 0.6, shade(color, -0.08));
  poly(ctx, [cx - a, y, cx - a * 0.6, y - a * 1.4, cx + a * 0.6, y - a * 1.4, cx + a, y], shade(color, 0.08));
  poly(ctx, [cx, y - a * 1.4, cx + a * 0.6, y - a * 1.4, cx + a, y, cx + 0.2, y + 0.3], shade(color, -0.22));
  line(ctx, cx, y - a * 1.4, cx, y - a * 1.4 - 3.4, GOLD_D, 0.8);
  ellipse(ctx, cx, y - a * 1.4 - 3.6, 0.7, 0.7, GOLD);
  return y - a * 1.4 - 4.3;
}

/** The door of a candi: a dark doorway under a kala head carved over the lintel, on the front-left wall. */
function candiDoor(ctx: Ctx, cx: number, cy: number, B: number, w: number, h: number, A: number) {
  void A;
  const [dx, dy] = P(cx, cy, 0, B);
  poly(ctx, [dx - w / 2, dy - w / 4, dx + w / 2, dy + w / 4, dx + w / 2, dy + w / 4 - h, dx - w / 2, dy - w / 4 - h], '#2a140c');
  poly(ctx, [dx - w / 2 - 0.8, dy - w / 4 - h - 0.4, dx + w / 2 + 0.8, dy + w / 4 - h + 0.4, dx + w / 2 + 0.8, dy + w / 4 - h - 1.6, dx - w / 2 - 0.8, dy - w / 4 - h - 2.4], BRICK_L); // the lintel
  ellipse(ctx, dx, dy - h - 2.4, w * 0.36, 1.4, BRICK_D); // the kala head
  ellipse(ctx, dx - w * 0.14, dy - h - 2.6, 0.35, 0.35, GOLD);
  ellipse(ctx, dx + w * 0.14, dy - h - 2.4, 0.35, 0.35, GOLD);
}

/** A red-brick candi: a terraced base with a stair, a square body with a doorway and niches, a stepped roof. */
function candi(ctx: Ctx, x: number, y: number, s: number) {
  softShadow(ctx, x + 1, y + 2, 13 * s, 5.5 * s, 0.26);
  brickBlock(ctx, x, y, 9 * s, 9 * s, 2.4 * s, BRICK_D);
  brickBlock(ctx, x, y - 2.4 * s, 7.4 * s, 7.4 * s, 2.2 * s, BRICK);
  // the stair up the front-left side
  for (let i = 0; i < 4; i++) { const [sx, sy] = P(x, y - i * 1.1 * s, 0, 9 * s - i * 0.5 * s); box(ctx, sx, sy + 1, 3.4 * s, 1.1 * s, BRICK_L); }
  const by = y - 4.6 * s, A = 5.2 * s;
  brickBlock(ctx, x, by, A, A, 9 * s, BRICK);
  candiDoor(ctx, x, by, A, 2.6 * s, 4.6 * s, A);
  // niches on the right wall
  const [nx, ny] = P(x, by, A, 0);
  poly(ctx, [nx - 1.1 * s, ny + 0.55 * s - 2 * s, nx + 1.1 * s, ny - 0.55 * s - 2 * s, nx + 1.1 * s, ny - 0.55 * s - 6 * s, nx - 1.1 * s, ny + 0.55 * s - 6 * s], BRICK_D);
  walls(ctx, x, by - 9 * s + 0.8 * s, A + 0.8 * s, A + 0.8 * s, 1 * s, BRICK_L); // the cornice
  steppedRoof(ctx, x, by - 9 * s, A * 0.92, 3, 3 * s, BRICK);
}

/**
 * The candi bentar: the split gate, a stepped brick tower cut clean in two, its halves standing apart with a path between
 * them, their cut faces sheer. `s` scales it; the path runs toward the viewer along v.
 */
function splitGate(ctx: Ctx, x: number, y: number, s: number) {
  softShadow(ctx, x + 1, y + 2, 15 * s, 5 * s, 0.24);
  const gap = 4.2 * s;
  for (const d of [-1, 1]) { // the far half (u < 0) first; each tier steps in on its outer side only, the cut face stays sheer
    let yy = y, a = 3.4 * s, bb = 4.2 * s;
    const tiers = [6, 3.8, 3, 2.4, 2];
    tiers.forEach((th, i) => {
      const [px, py] = P(x, yy, d * (gap + a), 0);
      brickBlock(ctx, px, py, a, bb, th * s, i % 2 ? shade(BRICK, 0.05) : BRICK, i === 0);
      walls(ctx, px, py - th * s + 0.5, a + 0.3, bb + 0.3, 0.5, BRICK_L);
      yy -= th * s;
      a *= 0.7;
      bb *= 0.78;
    });
    const [tx, ty] = P(x, yy, d * (gap + a), 0);
    poly(ctx, [tx - 1, ty, tx, ty - 3 * s, tx + 1, ty], BRICK_D);
    ellipse(ctx, tx, ty - 3 * s, 0.6, 0.6, GOLD);
  }
  // a few steps between the halves
  const [gx, gy] = P(x, y, 0, 4.6 * s);
  for (let i = 0; i < 2; i++) box(ctx, gx - i * 0.6, gy + 1 - i * 0.8, 3.6 * s, 0.9 * s, BRICK_L);
}

/** A steep hip roof of black ijuk (or thatch) with a ridge and upturned ridge ends. */
function steepRoof(ctx: Ctx, cx: number, cy: number, A: number, B: number, h: number, color: string) {
  const o = 1.4;
  const a = A + o, b = B + o, r = Math.max(0, a - b) * 0.7;
  const C = (u: number, v: number, up = 0): [number, number] => { const [px, py] = P(cx, cy, u, v); return [px, py - up]; };
  const cL = C(-a, b), cF = C(a, b), cR = C(a, -b), cB = C(-a, -b), r0 = C(-r, 0, h), r1 = C(r, 0, h);
  poly(ctx, [...cB, ...cR, ...r1, ...r0], shade(color, -0.1));
  poly(ctx, [...cL, ...cB, ...r0], shade(color, 0.02));
  poly(ctx, [...cR, ...cF, ...r1], shade(color, -0.28));
  poly(ctx, [...cF, ...cL, ...r0, ...r1], shade(color, 0.1));
  for (let i = 1; i < 6; i++) { // the thatch's combed lines
    const t = i / 6;
    const ex = cF[0] + (cL[0] - cF[0]) * t, ey = cF[1] + (cL[1] - cF[1]) * t;
    const rx2 = r1[0] + (r0[0] - r1[0]) * t, ry2 = r1[1] + (r0[1] - r1[1]) * t;
    line(ctx, ex, ey, ex + (rx2 - ex) * 0.85, ey + (ry2 - ey) * 0.85, shade(color, -0.2), 0.4);
  }
  line(ctx, cF[0], cF[1] + 0.4, cL[0], cL[1] + 0.4, shade(color, -0.45), 0.9);
  line(ctx, cR[0], cR[1] + 0.4, cF[0], cF[1] + 0.4, shade(color, -0.5), 0.9);
  line(ctx, r0[0], r0[1], r1[0], r1[1], shade(color, -0.4), 1.2);
  for (const [p, d] of [[r0, -1], [r1, 1]] as const) curve(ctx, p[0], p[1], p[0] + d * 1.2, p[1] - 0.6, p[0] + d * 1.4, p[1] - 2.4, 0.9, shade(color, -0.4));
}

/** A timber house on low stilts: plank and woven-bamboo walls, a front veranda and a ladder, a steep roof. */
function stiltHouse(ctx: Ctx, x: number, y: number, s: number, roofC: string) {
  const A = 6 * s, B = 4 * s, stilt = 2.6 * s, wh = 4.6 * s;
  softShadow(ctx, x + 1, y + 1.4, A * 1.4, B * 0.9, 0.2);
  for (const [u, v] of [[-A, B], [A, B], [A, -B], [0, B], [A, 0]] as const) { const [px, py] = P(x, y, u, v); line(ctx, px, py, px, py - stilt, WOOD_D, 1.1); box(ctx, px, py + 0.5, 1.4, 0.8, '#8a8274'); } // posts on stone footings
  const fy = y - stilt;
  walls(ctx, x, fy, A + 0.8, B + 0.8, 1, WOOD);
  walls(ctx, x, fy - 1, A, B, wh, '#b88a52');
  const [lx, ly] = P(x, fy - 1, -A, B), [fx, fy2] = P(x, fy - 1, A, B), [rx, ry] = P(x, fy - 1, A, -B);
  for (let t = 0.1; t < 1; t += 0.12) line(ctx, lx + (fx - lx) * t, ly + (fy2 - ly) * t - 0.4, lx + (fx - lx) * t, ly + (fy2 - ly) * t - wh + 0.4, 'rgba(90,60,30,0.35)', 0.35); // the woven panels
  for (const t of [0, 0.5, 1]) line(ctx, lx + (fx - lx) * t, ly + (fy2 - ly) * t, lx + (fx - lx) * t, ly + (fy2 - ly) * t - wh, WOOD_D, 0.8);
  line(ctx, rx, ry, rx, ry - wh, WOOD_D, 0.8);
  const dx = lx + (fx - lx) * 0.68, dy = ly + (fy2 - ly) * 0.68;
  poly(ctx, [dx - 1.2 * s, dy - 0.6 * s, dx + 1.2 * s, dy + 0.6 * s, dx + 1.2 * s, dy + 0.6 * s - 3.2 * s, dx - 1.2 * s, dy - 0.6 * s - 3.2 * s], '#2a1a10');
  line(ctx, dx - 1.4 * s, dy - 0.7 * s - 3.3 * s, dx + 1.4 * s, dy + 0.7 * s - 3.3 * s, ORANGE, 0.6); // a carved orange lintel
  const wx = fx + (rx - fx) * 0.5, wy = fy2 + (ry - fy2) * 0.5;
  poly(ctx, [wx - 1.2 * s, wy + 0.6 * s - 1.6 * s, wx + 1.2 * s, wy - 0.6 * s - 1.6 * s, wx + 1.2 * s, wy - 0.6 * s - 3.2 * s, wx - 1.2 * s, wy + 0.6 * s - 3.2 * s], '#2a1a10');
  for (const o of [-0.8, 0.8]) line(ctx, dx + o * s, dy + stilt + 1.4 * s, dx + o * s * 0.8, dy, WOOD_L, 0.6);
  for (let i = 1; i < 3; i++) line(ctx, dx - 0.8 * s, dy + (stilt + 1.4 * s) * (1 - i / 3), dx + 0.8 * s, dy + (stilt + 1.4 * s) * (1 - i / 3), WOOD_L, 0.5);
  steepRoof(ctx, x, fy - 1 - wh, A, B, 7 * s, roofC);
}

/** A lumbung rice barn: a small loft on four tall posts with rat-guard discs, under a tall rounded roof of thatch. */
function lumbung(ctx: Ctx, x: number, y: number, s: number) {
  softShadow(ctx, x + 1, y + 1, 7 * s, 3 * s, 0.2);
  const A = 3.4 * s, post = 4.4 * s;
  for (const [u, v] of [[-A, A], [A, A], [A, -A]] as const) {
    const [px, py] = P(x, y, u, v);
    line(ctx, px, py, px, py - post, WOOD_D, 1);
    ellipse(ctx, px, py - post * 0.72, 1.4, 0.6, WOOD_L); // the rat guard
  }
  const fy = y - post;
  walls(ctx, x, fy, A + 0.6, A + 0.6, 0.8, WOOD);
  walls(ctx, x, fy - 0.8, A * 0.8, A * 0.8, 2.6 * s, '#a07a4a');
  // the tall roof bellies out and rises to a ridge, like a hull upturned
  const [lx, ly] = P(x, fy - 0.8, -A - 1.6, A + 1.6), [fx, fyy] = P(x, fy - 0.8, A + 1.6, A + 1.6), [rx, ry] = P(x, fy - 0.8, A + 1.6, -A - 1.6);
  const tip: [number, number] = [x, fy - 0.8 - 12 * s];
  ctx.beginPath();
  ctx.moveTo(lx, ly);
  ctx.quadraticCurveTo(lx - 1.6 * s, ly - 7 * s, tip[0], tip[1]);
  ctx.quadraticCurveTo(rx + 1.6 * s, ry - 7 * s, rx, ry);
  ctx.lineTo(fx, fyy);
  ctx.closePath();
  ctx.fillStyle = ink(THATCH);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(fx, fyy);
  ctx.lineTo(rx, ry);
  ctx.quadraticCurveTo(rx + 1.6 * s, ry - 7 * s, tip[0], tip[1]);
  ctx.quadraticCurveTo(fx + 0.6 * s, fyy - 6 * s, fx, fyy);
  ctx.closePath();
  ctx.fillStyle = ink(shade(THATCH, -0.22));
  ctx.fill();
  curve(ctx, fx, fyy, fx + 0.6 * s, fyy - 6 * s, tip[0], tip[1], 0.7, shade(THATCH, -0.4));
  for (let i = 1; i < 4; i++) curve(ctx, lx + (fx - lx) * i / 4, ly + (fyy - ly) * i / 4, x - 2 * s + i * s, fy - 6 * s, tip[0], tip[1], 0.35, shade(THATCH, -0.2));
  line(ctx, lx, ly + 0.3, fx, fyy + 0.3, shade(THATCH, -0.45), 0.8);
  line(ctx, tip[0], tip[1], tip[0], tip[1] - 2, WOOD_D, 0.7);
}

/** A small shrine: a brick plinth and a little stepped candi on it, an offering of flowers before it. */
function shrine(ctx: Ctx, x: number, y: number, s: number) {
  softShadow(ctx, x + 1, y + 1, 7 * s, 3 * s, 0.2);
  brickBlock(ctx, x, y, 4.4 * s, 4.4 * s, 2 * s, BRICK_D);
  brickBlock(ctx, x, y - 2 * s, 3 * s, 3 * s, 5 * s, BRICK);
  candiDoor(ctx, x, y - 2 * s, 3 * s, 1.6 * s, 2.8 * s, 3 * s);
  steppedRoof(ctx, x, y - 7 * s, 2.8 * s, 2, 2 * s, BRICK);
  const [ox, oy] = P(x, y, 1, 6 * s);
  ellipse(ctx, ox, oy, 1.4, 0.7, '#3a7a3a');
  for (const [dx, c] of [[-0.6, '#fff6e0'], [0.4, '#ffd34a'], [0, RED]] as const) ellipse(ctx, ox + dx, oy - 0.5, 0.5, 0.4, c);
}

/** A brick temple tower of the capital, tall and slender (like Candi Jabung), on a broad terrace with a stair. */
function templeTower(ctx: Ctx, x: number, y: number, s: number) {
  softShadow(ctx, x + 2, y + 3, 18 * s, 8 * s, 0.28);
  brickBlock(ctx, x, y, 12 * s, 12 * s, 3 * s, BRICK_D);
  brickBlock(ctx, x, y - 3 * s, 10 * s, 10 * s, 3 * s, BRICK);
  for (let i = 0; i < 6; i++) { const [sx, sy] = P(x, y - i * 1 * s, 0, 12 * s - i * 0.4 * s); box(ctx, sx, sy + 1, 4.4 * s, 1 * s, BRICK_L); }
  const by = y - 6 * s, A = 7 * s;
  brickBlock(ctx, x, by, A, A, 13 * s, BRICK);
  // carved bands of relief
  const [lx, ly] = P(x, by, -A, A), [fx, fy] = P(x, by, A, A), [rx, ry] = P(x, by, A, -A);
  for (const hh of [3 * s, 11 * s]) { line(ctx, lx, ly - hh, fx, fy - hh, BRICK_L, 0.8); line(ctx, fx, fy - hh, rx, ry - hh, shade(BRICK_L, -0.2), 0.8); }
  candiDoor(ctx, x, by, A, 3 * s, 6.4 * s, A);
  const [nx, ny] = P(x, by, A, 0);
  poly(ctx, [nx - 1.4 * s, ny + 0.7 * s - 3 * s, nx + 1.4 * s, ny - 0.7 * s - 3 * s, nx + 1.4 * s, ny - 0.7 * s - 9 * s, nx - 1.4 * s, ny + 0.7 * s - 9 * s], BRICK_D);
  surya(ctx, nx, ny - 6 * s, 1.2 * s, GOLD, BRICK_D, 1);
  walls(ctx, x, by - 13 * s + 1 * s, A + 1 * s, A + 1 * s, 1.2 * s, BRICK_L);
  steppedRoof(ctx, x, by - 13 * s, A * 0.94, 5, 3.4 * s, BRICK);
}

function building(ctx: Ctx, x: number, y: number, big: boolean, roofC: string, capital: boolean) {
  if (big && capital) {
    templeTower(ctx, x - 2, y - 3, 0.95);
    splitGate(ctx, x + 14, y + 12, 0.95);
    return;
  }
  if (big) {
    candi(ctx, x, y, 1.05);
    return;
  }
  const spot: Record<string, number> = { '-10,2': 0, '10,2': 1, '0,8': 3, '-6,-8': 2, '7,-7': 4, '-14,-3': 1, '14,-2': 0 };
  const v = spot[`${Math.round(x)},${Math.round(y)}`] ?? ((Math.round(x) * 7 + Math.round(y) * 3) % 5 + 5) % 5;
  if (v === 0) stiltHouse(ctx, x, y, 0.95, IJUK);
  else if (v === 1) stiltHouse(ctx, x, y, 0.9, mix(roofC, IJUK, 0.35));
  else if (v === 2) shrine(ctx, x, y, 0.9);
  else if (v === 3) { lumbung(ctx, x - 4, y, 0.8); stiltHouse(ctx, x + 5, y + 3, 0.7, THATCH); }
  else { stiltHouse(ctx, x, y, 0.8, IJUK); tree(ctx, x + 8, y + 2, 0.6, { forest: '#1f8a44' } as BiomePalette, 0); }
}

// ---------------------------------------------------------------- trees

/** Coconut palms, clove trees and banyans. */
function tree(ctx: Ctx, x: number, y: number, k: number, Pal: BiomePalette, variant: number) {
  const type = ['coconut', 'clove', 'coconut', 'banyan', 'clove', 'coconut', 'clove', 'coconut', 'banyan', 'clove'][variant % 10];
  const g = Pal.forest ?? '#1f8a44';
  if (type === 'coconut') {
    const lean = (variant % 2 ? 1 : -1) * 4.4 * k;
    const h = 19 * k, tx = x + lean, ty = y - h;
    curve(ctx, x, y, x + lean * 0.1, y - h * 0.55, tx, ty, 1.8 * k, '#7a6a52');
    curve(ctx, x - 0.4 * k, y, x + lean * 0.1 - 0.4 * k, y - h * 0.55, tx - 0.4 * k, ty, 0.6 * k, '#a8987c');
    for (let i = 1; i < 10; i++) {
      const s = i / 10, u = 1 - s, px = u * u * x + 2 * u * s * (x + lean * 0.1) + s * s * tx, py = u * u * y + 2 * u * s * (y - h * 0.55) + s * s * ty;
      line(ctx, px - 0.8 * k, py, px + 0.8 * k, py - 0.2 * k, '#4a3e2e', 0.35 * k);
    }
    for (let i = 0; i < 9; i++) { // long feathered fronds arching out and drooping low
      const a = -Math.PI / 2 + (i - 4) * 0.5 + (i % 2 ? 0.1 : 0);
      const len = 10 * k;
      const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * 0.5 + 4.4 * k * Math.abs(Math.cos(a));
      const mx = tx + Math.cos(a) * len * 0.5, my = ty + Math.sin(a) * len * 0.5 - 1.8 * k;
      const c = i % 2 ? shade(g, 0.12) : mix(g, '#7ab84a', 0.35);
      curve(ctx, tx, ty, mx, my, ex, ey, 0.5 * k, shade(c, -0.3));
      for (let j = 1; j < 8; j++) {
        const s = j / 8, u = 1 - s, px = u * u * tx + 2 * u * s * mx + s * s * ex, py = u * u * ty + 2 * u * s * my + s * s * ey;
        const ll = (2.6 - s * 1.2) * k;
        line(ctx, px, py, px - Math.sin(a) * ll * 0.5, py + ll, c, 0.5 * k);
        line(ctx, px, py, px + Math.sin(a) * ll * 0.5, py + ll * 0.8, shade(c, -0.15), 0.45 * k);
      }
    }
    for (const [dx, dy] of [[-1, 1.2], [1, 1.3], [0, 2], [0.4, 0.8]] as const) { ellipse(ctx, tx + dx * k, ty + dy * k, 1.1 * k, 1 * k, '#6a5a22'); ellipse(ctx, tx + dx * k - 0.3 * k, ty + dy * k - 0.3 * k, 0.4 * k, 0.35 * k, '#a89a4a'); }
    return;
  }
  if (type === 'clove') {
    // a clove tree: a straight grey trunk and a dense conical crown of glossy leaves, dotted with pink-red bud clusters
    line(ctx, x, y, x, y - 6 * k, '#6a5a4a', 1.6 * k);
    line(ctx, x - 0.4 * k, y, x - 0.4 * k, y - 6 * k, '#9a8a76', 0.5 * k);
    const layers = 5;
    for (let i = 0; i < layers; i++) {
      const t = i / (layers - 1);
      const cy = y - 5 * k - t * 13 * k, rw = (7.4 - t * 5.2) * k;
      const c = i % 2 ? shade(g, -0.06) : mix(g, '#2a6a2a', 0.3);
      ellipse(ctx, x + 0.4 * k, cy + 0.6 * k, rw, rw * 0.6, shade(c, -0.3));
      ellipse(ctx, x, cy, rw, rw * 0.58, c);
      ellipse(ctx, x - rw * 0.35, cy - rw * 0.2, rw * 0.45, rw * 0.25, shade(c, 0.25)); // the glossy light side
      for (let j = 0; j < 4; j++) { // the bud clusters
        const a = rand(variant + i, j) * Math.PI * 2;
        const bx = x + Math.cos(a) * rw * 0.7, by = cy + Math.sin(a) * rw * 0.36;
        for (const [ox, oy] of [[0, 0], [0.5, 0.3], [-0.4, 0.35]] as const) ellipse(ctx, bx + ox * k, by + oy * k, 0.36 * k, 0.36 * k, j % 2 ? '#d8402a' : '#f07a6a');
      }
    }
    poly(ctx, [x - 1.2 * k, y - 18 * k, x, y - 22 * k, x + 1.2 * k, y - 18 * k], mix(g, '#2a6a2a', 0.3));
    return;
  }
  // a banyan: several trunks fused together, aerial roots hanging from wide boughs, a broad low dome of small leaves
  const wd = 13 * k, ch = 13 * k;
  for (const [dx, wv] of [[-4, 1.6], [-1.4, 2.2], [1.6, 2], [4.4, 1.4]] as const) { line(ctx, x + dx * k, y, x + dx * 0.6 * k, y - ch * 0.7, '#6a5a48', wv * k); line(ctx, x + dx * k - 0.4 * k, y, x + dx * 0.6 * k - 0.4 * k, y - ch * 0.7, '#9a8a72', 0.5 * k); }
  curve(ctx, x, y - ch * 0.6, x - 6 * k, y - ch * 0.8, x - wd * 0.85, y - ch * 0.7, 1.1 * k, '#6a5a48'); // the boughs
  curve(ctx, x, y - ch * 0.6, x + 6 * k, y - ch * 0.85, x + wd * 0.85, y - ch * 0.72, 1.1 * k, '#6a5a48');
  // the canopy: overlapping clumps, darker below
  const clumps: [number, number, number][] = [[-9, -12, 5], [9, -12.6, 5], [-4, -16, 6], [4.6, -16.4, 6], [0, -19, 6.4], [-11, -9.6, 3.8], [11, -10, 3.8]];
  for (const [cx2, cy2, r] of clumps) ellipse(ctx, x + cx2 * k + 0.6 * k, y + cy2 * k + 1 * k, r * k, r * 0.7 * k, shade(g, -0.35));
  for (const [cx2, cy2, r] of clumps) {
    ellipse(ctx, x + cx2 * k, y + cy2 * k, r * k, r * 0.66 * k, g);
    ellipse(ctx, x + cx2 * k - r * 0.3 * k, y + cy2 * k - r * 0.22 * k, r * 0.5 * k, r * 0.32 * k, shade(g, 0.2));
  }
  // aerial roots hanging from the boughs to the ground
  for (let i = 0; i < 9; i++) {
    const t = i / 8, rx2 = x + (t - 0.5) * wd * 1.7, ry2 = y - ch * 0.7 - Math.sin(t * Math.PI) * 1.2 * k;
    const long = i % 3 === 0;
    line(ctx, rx2, ry2, rx2 + (rand(variant, i) - 0.5) * 1.2 * k, long ? y + 0.4 * k : ry2 + (3 + rand(variant + 2, i) * 3) * k, '#8a7a62', (long ? 0.7 : 0.4) * k);
  }
}

// ---------------------------------------------------------------- registration

registerArt('majapahit', {
  unit(ctx, kind, x, y) {
    switch (kind) {
      case 'kris': case 'warrior': case 'archer': case 'defender': case 'swordsman': case 'explorer':
        footUnit(ctx, kind, x, y, 1);
        return true;
      case 'giant': footUnit(ctx, kind, x, y, 1.4); return true;
      case 'rider': rider(ctx, x, y); return true;
      case 'knight': knight(ctx, x, y); return true;
      case 'catapult': cetbang(ctx, x, y); return true;
      case 'boat': case 'ship': case 'warship': boats(ctx, kind, x, y); return true;
      default: return false;
    }
  },
  dress,
  torso,
  face,
  head,
  weapon,
  shield,
  building,
  tree,
});

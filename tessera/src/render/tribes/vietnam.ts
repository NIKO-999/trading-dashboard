// The Kingdom of Đại Việt, Lý and Trần dynasties (eleventh to fourteenth century): áo giao lĩnh cross-collared tunics over
// loose trousers, brown nâu cloth for the villagers and red and black for the soldiers, lotus-pink sashes, lacquered
// leather lamellar for the heavy ranks; the nón lá leaf hat, red-tasselled lacquer helmets and red headbands; round
// woven-rattan shields (đằng bài), the long-handled đao glaive, bamboo spears and the nỏ crossbow; bare feet and straw
// sandals. War elephants with a roofed howdah, a bamboo traction trebuchet, oared war boats with painted eyes and
// battened mat sails. Stilt houses under curved terracotta roofs with upswept dragon-tail corners, bamboo fences,
// brick towers, a communal đình, the One Pillar Pagoda in its lotus pond and an imperial citadel gate; bamboo groves,
// banana plants and areca palms.
import type { BiomePalette } from '../../data/tribes';
import type { UnitKind } from '../../game/types';
import { band, box, ellipse, faceQuad, ink, line, mix, poly, rand, shade, softShadow, type Ctx } from '../prims';
import { registerArt, type Body } from '../tribeart';
import { drawHorse, figure } from '../units';

// ---------------------------------------------------------------- palette

const RED = '#b8282a', RED_D = '#7a1a1c', RED_L = '#d8463a';
const BLK = '#231e20', BLK_L = '#3e3438';
const LOTUS = '#f08aa8', LOTUS_D = '#c4567a', LOTUS_L = '#ffc4d4';
const GOLD = '#e2b84a', GOLD_D = '#a07a22', GOLD_L = '#fbe08a';
const NAU = '#7a4a2e'; // brown cloth dyed with củ nâu yam
const CREAM = '#efe4c8';
const LAC = '#5e1a14'; // lacquered leather
const RAT = '#d4a95a', RAT_D = '#9a7234', RAT_L = '#f0d08a'; // rattan
const LEAF = '#e8dca8', LEAF_D = '#b8a46a'; // the nón lá
const WOOD = '#7a5230', WOOD_D = '#4a3018', WOOD_L = '#a87a4a';
const BAMB = '#9aa84a', BAMB_D = '#62702a', BAMB_L = '#c8c870'; // bamboo
const IRON = '#8a9098', STEELV = '#d0d6de';
const SKIN = '#d8a874', HAIR = '#100c0c';
const TERRA = '#b03a2a';
const STONE = '#b8b0a0', STONE_D = '#8a8274';

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
/** A hanging tassel of red horsehair or silk. */
function tassel(ctx: Ctx, x: number, y: number, len: number, w: number, c = RED) {
  ellipse(ctx, x, y, w * 0.7, w * 0.6, shade(c, 0.15));
  for (let i = -2; i <= 2; i++) line(ctx, x + i * w * 0.18, y + w * 0.3, x + i * w * 0.32, y + len, i % 2 ? shade(c, -0.22) : c, w * 0.3);
}
/** A bamboo pole with node rings, from (x0, y0) to (x1, y1). */
function bamboo(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, w: number, c = BAMB, nodes = 4) {
  line(ctx, x0, y0, x1, y1, shade(c, -0.25), w);
  line(ctx, x0 - w * 0.2, y0, x1 - w * 0.2, y1, c, w * 0.6);
  line(ctx, x0 - w * 0.3, y0, x1 - w * 0.3, y1, shade(c, 0.3), w * 0.2);
  const len = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
  for (let i = 1; i <= nodes; i++) {
    const t = i / (nodes + 1), px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t;
    line(ctx, px - nx * w * 0.65, py - ny * w * 0.65, px + nx * w * 0.65, py + ny * w * 0.65, shade(c, -0.4), w * 0.35);
  }
}

// ---------------------------------------------------------------- dress

const LIGHT: UnitKind[] = ['warrior', 'archer', 'explorer'];
const isLight = (k: UnitKind) => LIGHT.includes(k);

function dress(kind: UnitKind): [string, string, string] {
  switch (kind) {
    case 'rattan': return [BLK, BLK, SKIN]; // a short black vest, bare arms
    case 'warrior': case 'archer': case 'explorer': return [NAU, BLK, NAU];
    case 'swordsman': case 'knight': return [LAC, BLK, RED];
    case 'giant': return [LAC, RED_D, RED];
    default: return [RED, BLK, RED];
  }
}

/** Rows of small lacquered-leather plates laced with gold cord, between heights v0 and v1 of the torso box. */
function lamellar(ctx: Ctx, x: number, y: number, w: number, h: number, v0: number, v1: number, rows: number, base: string, lace = GOLD) {
  const rh = (v1 - v0) / rows;
  for (let r = 0; r < rows; r++) {
    const a = v0 + r * rh, b = a + rh;
    for (const f of ['L', 'R'] as const) {
      for (let c = 0; c < 5; c++) {
        const u0 = (c + (r % 2) * 0.5) / 5, u1 = Math.min(1, u0 + 0.19);
        if (u0 >= 1) continue;
        faceQuad(ctx, f, x, y, w, h, u0, u1, a + rh * 0.12, b, c % 2 ? shade(base, 0.12) : base);
        faceQuad(ctx, f, x, y, w, h, u0, u1, b - rh * 0.22, b, shade(base, 0.32)); // the lacquer shine on each plate's top
      }
      faceQuad(ctx, f, x, y, w, h, 0, 1, a, a + rh * 0.12, lace);
    }
  }
}

/** The tunic: an áo giao lĩnh with its crossed collar, a sash, and armour for the heavy ranks. */
function torso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const k = w / 10;
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const B = (v0: number, v1: number, c: string) => band(ctx, x, y, w, h, v0, v1, c);
  const sashKnot = (c: string) => { // the knot of the sash and its two hanging ends
    const [kx, ky] = pt('R', x, y, w, h, 0.72, 0.26);
    poly(ctx, [kx - 1 * k, ky, kx + 1 * k, ky, kx + 1.5 * k, ky + 4.6 * k, kx + 0.2 * k, ky + 3.8 * k], shade(c, -0.12));
    poly(ctx, [kx - 1 * k, ky, kx - 0.1 * k, ky + 0.2 * k, kx - 1.3 * k, ky + 4.2 * k, kx - 2.2 * k, ky + 3.3 * k], c);
    ellipse(ctx, kx, ky, 1.2 * k, 1 * k, shade(c, 0.2));
  };
  if (kind === 'rattan') {
    // a short black vest left open over the bare chest, edged in lotus pink, a red sash
    facePoly(ctx, 'R', x, y, w, h, [[0.18, 1], [0.62, 1], [0.5, 0.3], [0.36, 0.3]], SKIN);
    facePoly(ctx, 'R', x, y, w, h, [[0.3, 0.85], [0.46, 0.85], [0.45, 0.6], [0.32, 0.62]], shade(SKIN, -0.08)); // the chest muscle's shadow
    line(ctx, ...pt('R', x, y, w, h, 0.18, 1), ...pt('R', x, y, w, h, 0.36, 0.3), LOTUS, 0.6 * k);
    line(ctx, ...pt('R', x, y, w, h, 0.62, 1), ...pt('R', x, y, w, h, 0.5, 0.3), LOTUS, 0.6 * k);
    B(0.12, 0.32, RED);
    B(0.2, 0.23, RED_L);
    B(0, 0.12, BLK_L);
    sashKnot(RED);
    return;
  }
  if (kind === 'swordsman' || kind === 'knight' || kind === 'giant') {
    const plate = kind === 'giant' ? '#b0802a' : LAC;
    B(0, 0.26, kind === 'giant' ? RED : RED_D); // the skirt of the tunic under the armour
    for (let i = 0; i < 5; i++) { R(0.06 + i * 0.2, 0.1 + i * 0.2, 0, 0.26, shade(RED_D, -0.25)); faceQuad(ctx, 'L', x, y, w, h, 0.06 + i * 0.2, 0.1 + i * 0.2, 0, 0.26, shade(RED_D, -0.25)); }
    lamellar(ctx, x, y, w, h, 0.34, 0.9, 5, plate, kind === 'giant' ? RED : GOLD);
    B(0.24, 0.36, BLK); // a black belt with gilt plaques
    for (const u of [0.15, 0.5, 0.85]) { R(u, u + 0.1, 0.26, 0.34, GOLD); faceQuad(ctx, 'L', x, y, w, h, u, u + 0.1, 0.26, 0.34, GOLD); }
    B(0.9, 1, RED); // the red collar of the tunic above the plates
    // a round gilt chest plate with a lotus
    const [mx, my] = pt('R', x, y, w, h, 0.45, 0.62);
    ellipse(ctx, mx, my, 2.2 * k, 2.3 * k, GOLD_D);
    ellipse(ctx, mx, my, 1.8 * k, 1.9 * k, kind === 'giant' ? LOTUS : GOLD);
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.55; poly(ctx, [mx, my + 0.8 * k, mx + Math.cos(a) * 1.5 * k - 0.4 * k, my + Math.sin(a) * 1.6 * k, mx + Math.cos(a) * 1.5 * k + 0.4 * k, my + Math.sin(a) * 1.6 * k], kind === 'giant' ? GOLD : LOTUS_D); }
    ellipse(ctx, mx - 0.5 * k, my - 0.6 * k, 0.5 * k, 0.5 * k, '#ffffff');
    if (kind === 'giant') { B(0.84, 0.9, LOTUS); for (const u of [0.1, 0.35, 0.6, 0.85]) { R(u, u + 0.08, 0.84, 0.9, GOLD); faceQuad(ctx, 'L', x, y, w, h, u, u + 0.08, 0.84, 0.9, GOLD); } }
    return;
  }
  // the áo giao lĩnh: its right panel crossed over the left in a dark collar band down to the waist
  const collar = isLight(kind) ? BLK : BLK;
  facePoly(ctx, 'R', x, y, w, h, [[0.02, 1], [0.22, 1], [0.78, 0.34], [0.6, 0.34]], collar);
  facePoly(ctx, 'R', x, y, w, h, [[0.22, 1], [0.3, 1], [0.84, 0.36], [0.78, 0.34]], CREAM); // the white under-collar
  B(0.9, 1, collar);
  // the four panels part at the front below the sash (áo tứ thân)
  R(0.48, 0.52, 0, 0.18, shade(isLight(kind) ? NAU : RED, -0.35));
  const sash = kind === 'archer' ? RED : kind === 'warrior' || kind === 'explorer' ? LOTUS : LOTUS;
  B(0.18, 0.34, sash);
  B(0.24, 0.27, shade(sash, 0.3));
  if (!isLight(kind)) { B(0.14, 0.18, BLK); R(0.4, 0.56, 0.14, 0.36, GOLD); } // a soldier's black belt and gilt buckle
  sashKnot(sash);
  if (kind === 'explorer') R(0.25, 0.65, 0.4, 0.86, shade(NAU, 0.12)); // a cloth satchel strap
}

/** Thin moustaches for the officers. */
function face(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  if (kind !== 'swordsman' && kind !== 'knight' && kind !== 'giant' && kind !== 'defender') return;
  faceQuad(ctx, 'R', x, y, w, h, 0.26, 0.48, 0.21, 0.25, HAIR);
  faceQuad(ctx, 'R', x, y, w, h, 0.54, 0.76, 0.21, 0.25, HAIR);
  faceQuad(ctx, 'R', x, y, w, h, 0.22, 0.27, 0.12, 0.24, HAIR); // drooping ends
  faceQuad(ctx, 'R', x, y, w, h, 0.75, 0.8, 0.12, 0.24, HAIR);
  if (kind === 'giant') faceQuad(ctx, 'R', x, y, w, h, 0.44, 0.58, -0.04, 0.12, HAIR); // a pointed beard
}

// ---------------------------------------------------------------- headgear

/** The nón lá: a cone of palm leaves sewn on bamboo rings, a white strap under the chin. */
function nonLa(ctx: Ctx, x: number, base: number, rx: number, k: number, strap: string | null = '#f4efe0') {
  const ry = rx * 0.42, ay = base - rx * 0.86;
  if (strap) { // the chin strap runs down past the face
    line(ctx, x - rx * 0.36, base + 0.6 * k, x + 0.6 * k, base + 9.6 * k, strap, 0.55 * k);
    line(ctx, x + rx * 0.5, base + 1.2 * k, x + 0.6 * k, base + 9.6 * k, shade(strap, -0.2), 0.55 * k);
  }
  ellipse(ctx, x, base, rx, ry, LEAF_D); // the underside of the brim
  ellipse(ctx, x + 0.4 * k, base + 0.3 * k, rx * 0.72, ry * 0.6, shade(LEAF_D, -0.25));
  // the cone: lit on the left, shaded on the right
  ctx.beginPath();
  ctx.moveTo(x - rx, base);
  ctx.lineTo(x, ay);
  ctx.lineTo(x + rx, base);
  ctx.ellipse(x, base, rx, ry, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fillStyle = ink(LEAF);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + rx * 0.08, ay + 0.6 * k);
  ctx.lineTo(x + rx, base);
  ctx.ellipse(x, base, rx, ry, 0, 0, Math.PI * 0.42);
  ctx.closePath();
  ctx.fillStyle = ink(shade(LEAF, -0.16));
  ctx.fill();
  // the bamboo rings under the leaves, and the leaf seams to the tip
  for (const t of [0.3, 0.5, 0.7, 0.88]) ring(ctx, x, ay + (base - ay) * t, rx * t, ry * t, shade(LEAF_D, -0.08), 0.4 * k, 0.05 * Math.PI, 0.95 * Math.PI);
  for (const a of [0.15, 0.32, 0.5, 0.68, 0.85]) line(ctx, x, ay, x + Math.cos(a * Math.PI) * rx * 0.98, base + Math.sin(a * Math.PI) * ry * 0.98, 'rgba(120,96,40,0.35)', 0.3 * k);
  ring(ctx, x, base, rx, ry, shade(LEAF, 0.3), 0.5 * k, 0, Math.PI); // the bright bound rim
  ellipse(ctx, x - rx * 0.22, ay + (base - ay) * 0.45, rx * 0.12, ry * 0.5, 'rgba(255,255,255,0.35)');
}

/** A lacquered helmet: a black bowl with a gilt brim band, a gilt knob and a spray of red horsehair. */
function lacHelm(ctx: Ctx, x: number, top: number, k: number, hw: number, bowl: string, crest: 'tassel' | 'wing' | 'phoenix') {
  const w = hw + 0.8 * k;
  if (crest === 'wing' || crest === 'phoenix') { // the brim sweeps up at both sides like a boat's prow
    poly(ctx, [x - w / 2 - 3 * k, top + 0.4 * k, x - w / 2, top + 3.4 * k, x, top + 5.4 * k, x + w / 2, top + 3.4 * k, x + w / 2 + 3 * k, top + 0.4 * k, x + w / 2 + 0.6 * k, top + 4.8 * k, x, top + 6.8 * k, x - w / 2 - 0.6 * k, top + 4.8 * k], crest === 'phoenix' ? GOLD_D : BLK);
    poly(ctx, [x - w / 2 - 3 * k, top + 0.4 * k, x - w / 2, top + 3.4 * k, x, top + 5.4 * k, x, top + 6.2 * k, x - w / 2 - 0.4 * k, top + 4.2 * k], crest === 'phoenix' ? GOLD : BLK_L);
  }
  box(ctx, x, top + 3.6 * k, w, 3.6 * k, bowl, shade(bowl, 0.18));
  const dy = top + 0.4 * k, dr = w / 2.3;
  ctx.beginPath(); // the domed crown, sitting on the band
  ctx.ellipse(x, dy, w / 2, dr, 0, Math.PI, 0);
  ctx.ellipse(x, dy, w / 2, w / 4, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fillStyle = ink(shade(bowl, 0.1));
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, dy, w / 2, dr, 0, Math.PI * 1.55, 0);
  ctx.ellipse(x, dy, w / 2, w / 4, 0, 0, Math.PI * 0.5);
  ctx.lineTo(x + w * 0.08, dy - dr);
  ctx.closePath();
  ctx.fillStyle = ink(shade(bowl, -0.18));
  ctx.fill();
  for (const a of [0.3, 0.5, 0.7]) curve(ctx, x, dy - dr, x + Math.cos(Math.PI * (1 + a)) * w * 0.3, dy - dr * 0.7, x + Math.cos(Math.PI * a) * w * -0.5, dy + Math.sin(Math.PI * a) * w / 4, 0.35 * k, shade(bowl, -0.35)); // the ribs of the bowl
  ellipse(ctx, x - w * 0.2, dy - dr * 0.5, w * 0.1, w * 0.07, 'rgba(255,255,255,0.45)'); // the lacquer's gloss
  band(ctx, x, top + 3.6 * k, w, 3.6 * k, 0, 0.3, GOLD);
  faceQuad(ctx, 'R', x, top + 3.6 * k, w, 3.6 * k, 0.38, 0.62, 0.3, 0.95, GOLD); // a gilt front plate
  faceQuad(ctx, 'R', x, top + 3.6 * k, w, 3.6 * k, 0.45, 0.55, 0.45, 0.8, RED);
  const ty = dy - dr + 0.4 * k;
  if (crest === 'phoenix') { // a gilt phoenix crest with a lotus-pink plume
    poly(ctx, [x - 1 * k, ty + 1.4 * k, x + 1.2 * k, ty + 1.2 * k, x + 2.6 * k, ty - 4.4 * k, x + 0.4 * k, ty - 6.6 * k, x - 2.4 * k, ty - 5 * k], GOLD);
    poly(ctx, [x + 0.4 * k, ty - 6.6 * k, x + 2.6 * k, ty - 4.4 * k, x + 4.6 * k, ty - 6 * k], GOLD_L);
    for (let i = 0; i < 6; i++) curve(ctx, x - 0.6 * k, ty - 3 * k, x - 4 * k - i * 0.4 * k, ty - 8 * k + i * 0.6 * k, x - 8 * k - i * 0.6 * k, ty - 2 * k + i * 1.2 * k, 0.8 * k, i % 2 ? LOTUS_D : LOTUS);
    return;
  }
  ellipse(ctx, x, ty + 0.6 * k, 1.1 * k, 1 * k, GOLD);
  line(ctx, x, ty + 0.6 * k, x, ty - 1.6 * k, GOLD, 0.8 * k);
  // the horsehair falls back over the crown
  for (let i = 0; i < 7; i++) {
    const t = i / 6 - 0.5;
    curve(ctx, x + t * 1.2 * k, ty - 1.4 * k, x - 3 * k + t * 2 * k, ty - 4 * k, x - 6 * k + t * 2.4 * k + (crest === 'wing' ? -1 : 0) * k, ty + 3.6 * k + Math.abs(t) * 2 * k, 1 * k, i % 2 ? RED_D : RED);
  }
  if (crest === 'wing') line(ctx, x + 0.4 * k, ty - 1.4 * k, x + 0.8 * k, ty - 4.6 * k, GOLD, 0.6 * k); // a gilt spike rises through the tuft
}

function head(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  switch (kind) {
    case 'rattan': { // the hair in a topknot, a red headband with its ends flying
      ellipse(ctx, x - 0.6 * k, top - 0.6 * k, 2.6 * k, 1.9 * k, HAIR);
      ellipse(ctx, x - 0.8 * k, top - 1.4 * k, 1.7 * k, 1.4 * k, '#2a2224');
      ellipse(ctx, x - 1.2 * k, top - 1.8 * k, 0.6 * k, 0.4 * k, '#5a5054');
      band(ctx, x, top + 3.4 * k, hw + 0.3 * k, 2 * k, 0, 1, RED);
      band(ctx, x, top + 3.4 * k, hw + 0.3 * k, 2 * k, 0.4, 0.55, RED_L);
      const kx = x - hw / 2 - 0.2 * k, ky = top + 2.4 * k;
      ellipse(ctx, kx, ky, 1.1 * k, 1 * k, RED_D);
      curve(ctx, kx, ky, kx - 3 * k, ky - 0.6 * k, kx - 5.6 * k, ky + 1.6 * k, 1.1 * k, RED);
      curve(ctx, kx, ky + 0.4 * k, kx - 2.4 * k, ky + 2 * k, kx - 4.2 * k, ky + 4.6 * k, 1 * k, RED_D);
      break;
    }
    case 'warrior': case 'archer': nonLa(ctx, x, top + 2.6 * k, hw * 0.98, k); break;
    case 'explorer': nonLa(ctx, x, top + 2.6 * k, hw * 1.1, k, LOTUS); break;
    case 'defender': case 'rider': lacHelm(ctx, x, top, k, hw, BLK, 'tassel'); break;
    case 'swordsman': case 'knight': lacHelm(ctx, x, top, k, hw, RED_D, 'wing'); break;
    case 'giant': lacHelm(ctx, x, top, k, hw, '#c8942a', 'phoenix'); break;
    default: lacHelm(ctx, x, top, k, hw, BLK, 'tassel'); break;
  }
}

// ---------------------------------------------------------------- shields and weapons

/** The đằng bài: a round shield of coiled, bound rattan, a lacquered boss and a painted red ring. */
function rattanShield(ctx: Ctx, cx: number, cy: number, r: number, k: number, boss = RED_D) {
  const rx = r, ry = r * 1.04;
  ellipse(ctx, cx + 0.8 * k, cy + 0.7 * k, rx, ry, RAT_D); // the rim's thickness
  ellipse(ctx, cx, cy, rx, ry, RAT);
  const n = Math.max(4, Math.round(r / k / 0.9));
  for (let i = 0; i < n; i++) { // the coils, each bound with strips at staggered points
    const f = 0.96 - (i / n) * 0.78;
    ring(ctx, cx, cy, rx * f, ry * f, i % 2 ? RAT_D : shade(RAT_D, 0.15), 0.35 * k);
    ring(ctx, cx - 0.2 * k, cy - 0.2 * k, rx * (f - 0.04), ry * (f - 0.04), RAT_L, 0.25 * k, Math.PI * 0.9, Math.PI * 1.6);
    const m = Math.max(5, Math.round(10 * f));
    for (let j = 0; j < m; j++) {
      const a = (j / m) * Math.PI * 2 + i * 0.35;
      const px = cx + Math.cos(a) * rx * (f - 0.05), py = cy + Math.sin(a) * ry * (f - 0.05);
      line(ctx, px, py, px + Math.cos(a) * rx * 0.07, py + Math.sin(a) * ry * 0.07, shade(RAT_D, -0.2), 0.45 * k);
    }
  }
  ring(ctx, cx, cy, rx * 0.62, ry * 0.62, RED, 0.9 * k); // a painted ring
  ring(ctx, cx, cy, rx * 0.56, ry * 0.56, BLK, 0.4 * k);
  // the boss: a lacquered cone with a gilt rim and a point
  ellipse(ctx, cx + 0.3 * k, cy + 0.3 * k, rx * 0.3, ry * 0.3, shade(boss, -0.4));
  ellipse(ctx, cx, cy, rx * 0.28, ry * 0.28, boss);
  ring(ctx, cx, cy, rx * 0.28, ry * 0.28, GOLD, 0.5 * k);
  poly(ctx, [cx - rx * 0.12, cy, cx + rx * 0.12, cy + 0.2 * k, cx + 0.3 * k, cy - rx * 0.32], shade(boss, 0.25));
  ellipse(ctx, cx - rx * 0.08, cy - ry * 0.1, rx * 0.07, ry * 0.06, '#ffffff');
  ring(ctx, cx, cy, rx * 0.98, ry * 0.98, shade(RAT_D, -0.3), 0.6 * k);
  ellipse(ctx, cx - rx * 0.42, cy - ry * 0.5, rx * 0.18, ry * 0.28, 'rgba(255,255,255,0.22)');
}

/** A short curved sabre with a red-bound grip and a tassel. */
function sabre(ctx: Ctx, x: number, y: number, k: number, len = 1) {
  const hx = x, hy = y + 1 * k, tx = x + 7 * k * len, ty = y - 11 * k * len;
  for (const [c, wd, dx] of [[shade(IRON, -0.3), 2.4, 0.5], [STEELV, 1.6, 0], ['#f6f9fc', 0.5, -0.5]] as const) curve(ctx, hx + dx * k, hy - 2 * k, x + 0.6 * k + dx * k, y - 8 * k * len, tx + dx * k, ty, wd * k, c);
  poly(ctx, [tx, ty, tx + 0.8 * k, ty + 2.4 * k, tx + 2 * k, ty - 0.6 * k], STEELV);
  line(ctx, hx, hy + 2.6 * k, hx, hy - 2 * k, RED, 1.7 * k);
  for (const t of [0, 1, 2]) line(ctx, hx - 0.9 * k, hy + (t - 0.4) * k, hx + 0.9 * k, hy + (t - 0.9) * k, BLK, 0.45 * k);
  ellipse(ctx, hx, hy - 2.3 * k, 2 * k, 0.9 * k, GOLD);
  tassel(ctx, hx - 0.3 * k, hy + 3 * k, 3.6 * k, 1 * k, LOTUS);
}

/** The đao: a broad, curved single-edged blade on a long red-lacquered shaft, with a red tassel at the socket. */
function dao(ctx: Ctx, x: number, y: number, k: number, big = false) {
  const s = big ? 1.15 : 1;
  const x0 = x - 2.6 * k, y0 = y + 7 * k, x1 = x + 2.8 * k * s, y1 = y - 16 * k * s;
  line(ctx, x0, y0, x1, y1, RED_D, 1.5 * k);
  line(ctx, x0 - 0.4 * k, y0, x1 - 0.4 * k, y1, RED_L, 0.45 * k);
  for (const t of [0.08, 0.14]) line(ctx, x0 + (x1 - x0) * t - 0.9 * k, y0 + (y1 - y0) * t, x0 + (x1 - x0) * t + 0.9 * k, y0 + (y1 - y0) * t - 0.3 * k, GOLD, 0.6 * k);
  ellipse(ctx, x0, y0 + 0.6 * k, 0.9 * k, 0.9 * k, GOLD); // the butt cap
  // the blade: its back straight up the shaft's line, its edge bellying out and sweeping back to the point
  const bx = x1, by = y1;
  const tipX = bx + 2.6 * k * s, tipY = by - 10.4 * k * s;
  ctx.beginPath();
  ctx.moveTo(bx - 0.6 * k, by + 0.6 * k);
  ctx.quadraticCurveTo(bx + 0.2 * k, by - 6 * k * s, tipX, tipY);
  ctx.quadraticCurveTo(bx + 6.4 * k * s, by - 5 * k * s, bx + 3 * k * s, by + 0.8 * k);
  ctx.closePath();
  ctx.fillStyle = ink(STEELV);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(bx + 1.2 * k, by - 1 * k);
  ctx.quadraticCurveTo(bx + 1.8 * k * s, by - 6 * k * s, tipX, tipY);
  ctx.quadraticCurveTo(bx + 6.4 * k * s, by - 5 * k * s, bx + 3 * k * s, by + 0.8 * k);
  ctx.closePath();
  ctx.fillStyle = ink(shade(IRON, -0.05));
  ctx.fill();
  curve(ctx, bx + 3 * k * s, by + 0.6 * k, bx + 6.4 * k * s, by - 5 * k * s, tipX, tipY, 0.5 * k, '#ffffff'); // the bright edge
  line(ctx, bx + 0.2 * k, by - 0.8 * k, bx + 1 * k, by - 6 * k * s, shade(IRON, -0.4), 0.4 * k); // a fuller by the back
  if (big) { ellipse(ctx, bx + 1.4 * k, by - 2 * k, 0.8 * k, 0.8 * k, GOLD); }
  // a gilt dragon-mouth socket and the tassel
  poly(ctx, [bx - 1.4 * k, by + 1.2 * k, bx + 3.4 * k, by + 1.4 * k, bx + 2.6 * k, by + 3.2 * k, bx - 0.8 * k, by + 3 * k], GOLD);
  poly(ctx, [bx + 2.6 * k, by + 3.2 * k, bx + 3.4 * k, by + 1.4 * k, bx + 4.2 * k, by + 2.4 * k], GOLD_D);
  tassel(ctx, bx - 0.2 * k, by + 3.2 * k, 5 * k, 1.4 * k, RED);
}

/** A bamboo spear with a leaf-shaped iron head and a red tassel. */
function spear(ctx: Ctx, x: number, y: number, k: number, len = 1, pennant = false) {
  const x0 = x - 1.8 * k, y0 = y + 6.4 * k, x1 = x + 3 * k * len, y1 = y - 20 * k * len;
  bamboo(ctx, x0, y0, x1, y1, 1.3 * k, BAMB_L, 5);
  poly(ctx, [x1 + 0.4 * k, y1 - 6.6 * k, x1 - 1.4 * k, y1 - 0.2 * k, x1 + 0.4 * k, y1 + 1 * k], STEELV);
  poly(ctx, [x1 + 0.4 * k, y1 - 6.6 * k, x1 + 2.2 * k, y1 - 0.2 * k, x1 + 0.4 * k, y1 + 1 * k], shade(IRON, -0.15));
  tassel(ctx, x1 + 0.2 * k, y1 + 1.4 * k, 4.4 * k, 1.3 * k);
  if (pennant) {
    const px = x1 + 0.3 * k, py = y1 + 4.6 * k;
    poly(ctx, [px, py, px + 7.4 * k, py + 1.6 * k, px + 5 * k, py + 3.4 * k, px + 7 * k, py + 5.4 * k, px - 0.3 * k, py + 5 * k], LOTUS);
    poly(ctx, [px, py, px + 7.4 * k, py + 1.6 * k, px + 6.6 * k, py + 2.4 * k, px, py + 1.8 * k], LOTUS_L);
  }
}

/** The nỏ: a crossbow with a lacquered stock and a bamboo-and-horn bow, loaded with a bolt. */
function crossbow(ctx: Ctx, x: number, y: number, k: number) {
  const sx = x - 3 * k, sy = y + 1.6 * k, fx = x + 9 * k, fy = y - 4.6 * k; // stock from the shoulder to the bow
  line(ctx, sx, sy, fx, fy, shade(RED_D, -0.2), 2.2 * k);
  line(ctx, sx, sy - 0.5 * k, fx, fy - 0.5 * k, RED, 1 * k);
  // the bow across the front, seen at an angle: two limbs curving back
  const lx = fx - 2.8 * k, ly0 = fy - 6.6 * k, ly1 = fy + 5.4 * k;
  curve(ctx, fx, fy, fx + 0.6 * k, fy - 4 * k, lx, ly0, 1.5 * k, BAMB_D);
  curve(ctx, fx, fy, fx + 0.6 * k, fy + 3.4 * k, lx + 0.4 * k, ly1, 1.5 * k, BAMB_D);
  curve(ctx, fx, fy, fx + 0.3 * k, fy - 4 * k, lx, ly0, 0.6 * k, BAMB_L);
  line(ctx, lx, ly0, x + 1.4 * k, y - 1.4 * k, '#f4efe0', 0.45 * k); // the string drawn back to the nut
  line(ctx, lx + 0.4 * k, ly1, x + 1.4 * k, y - 1.4 * k, '#f4efe0', 0.45 * k);
  ellipse(ctx, x + 1.4 * k, y - 1.4 * k, 0.8 * k, 0.7 * k, IRON); // the bronze trigger lock
  line(ctx, x + 1 * k, y - 0.6 * k, x + 0.4 * k, y + 1.8 * k, IRON, 0.6 * k);
  line(ctx, x + 1.4 * k, y - 1.8 * k, fx + 3 * k, fy - 2 * k, '#d8c8a0', 0.6 * k); // the bolt
  poly(ctx, [fx + 3 * k, fy - 2.8 * k, fx + 5 * k, fy - 2.4 * k, fx + 3 * k, fy - 1.4 * k], IRON);
  ellipse(ctx, fx, fy, 1 * k, 1 * k, GOLD);
}

/** A bamboo quiver of crossbow bolts on the back. */
function boltQuiver(ctx: Ctx, x: number, y: number, k: number) {
  const qx = x - 6.6 * k;
  box(ctx, qx, y - 8 * k, 3.4 * k, 9 * k, BAMB);
  for (const v of [0.3, 0.62]) band(ctx, qx, y - 8 * k, 3.4 * k, 9 * k, v, v + 0.06, BAMB_D);
  band(ctx, qx, y - 8 * k, 3.4 * k, 9 * k, 0.86, 0.96, RED);
  for (const i of [-1, 0, 1]) {
    const tx = qx - 1.2 * k + i * 1.1 * k;
    line(ctx, qx + i * 0.7 * k, y - 17.2 * k, tx, y - 21.4 * k, '#d8c8a0', 0.6 * k);
    poly(ctx, [tx, y - 21.4 * k, tx - 0.9 * k, y - 23.4 * k, tx + 0.4 * k, y - 22.2 * k], i ? LOTUS : RED);
  }
}

/** The traveller's pole over the shoulder, a bundle hanging from it. */
function travelPole(ctx: Ctx, x: number, y: number, k: number) {
  bamboo(ctx, x - 1 * k, y + 2 * k, x + 4 * k, y - 18 * k, 1.1 * k, BAMB_L, 4);
  const bx = x + 3.4 * k, by = y - 15.6 * k;
  line(ctx, bx, by, bx + 3.4 * k, by + 4 * k, '#6a4a2a', 0.5 * k);
  ellipse(ctx, bx + 3.6 * k, by + 6.2 * k, 2.6 * k, 2.4 * k, shade(LOTUS_D, -0.1));
  ellipse(ctx, bx + 3.2 * k, by + 5.6 * k, 2 * k, 1.8 * k, LOTUS);
  poly(ctx, [bx + 3 * k, by + 3.6 * k, bx + 4.2 * k, by + 3.6 * k, bx + 3.6 * k, by + 4.6 * k], LOTUS_D);
}

function weapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  switch (kind) {
    case 'rattan':
      sabre(ctx, x, y, k);
      rattanShield(ctx, b.off.x - 1.6 * k, b.off.y - 5.6 * k, 7 * k, k);
      return true;
    case 'warrior':
      spear(ctx, x, y, k, 0.9);
      rattanShield(ctx, b.off.x - 1.2 * k, b.off.y - 5.4 * k, 5 * k, k);
      return true;
    case 'archer': crossbow(ctx, x, y, k); return true;
    case 'defender': spear(ctx, x, y, k, 1.05, true); return true; // the shield is drawn afterwards, like everyone's
    case 'swordsman': dao(ctx, x, y, k); return true;
    case 'giant': dao(ctx, x, y, k, true); rattanShield(ctx, b.off.x - 1.4 * k, b.off.y - 5.6 * k, 5.6 * k, k, GOLD_D); return true;
    case 'explorer': travelPole(ctx, x, y, k); return true;
  }
  return false;
}

function shield(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number): boolean {
  rattanShield(ctx, x - 1.4 * k, y - 5.6 * k, kind === 'defender' ? 6.4 * k : 5.4 * k, k);
  return true;
}

// ---------------------------------------------------------------- figures on foot

const LEGS = [[-2.2, -0.3, 'L'], [2.2, 0.7, 'R'], [2.2, 0.7, 'L']] as const;

/** Bare feet, or straw sandals; the Rattan Guard's trousers are rolled up to the knee. */
function feet(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  const rolled = kind === 'rattan';
  const legs = dress(kind)[1];
  for (const [dx, dy, f] of LEGS) {
    const q = (v0: number, v1: number, c: string, u0 = 0, u1 = 1) => faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, u0, u1, v0, v1, c);
    if (rolled) {
      q(0, 0.5, SKIN);
      q(0.5, 0.62, shade(legs, 0.25)); // the rolled cuff
      q(0.62, 0.66, shade(legs, -0.3));
      q(0.26, 0.3, shade(SKIN, -0.16), 0.2, 0.8); // the shin's shading
    } else {
      q(0, 0.22, SKIN);
      q(0, 0.05, '#c9a860'); // a straw sole
      q(0.1, 0.15, '#c9a860', 0.2, 0.8); // its strap
      q(0.22, 0.32, shade(legs, -0.2)); // the trouser hem tied at the ankle
    }
  }
  faceQuad(ctx, 'R', x + 2.2 * k, y + 0.7 * k, 3.6 * k, 5.2 * k, 0, 0.35, 0, 0.1, shade(SKIN, -0.2)); // toes
}

function footUnit(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  if (kind === 'archer') boltQuiver(ctx, x, y, k);
  if (kind === 'explorer') { // a woven bamboo pack basket
    box(ctx, x - 5.6 * k, y - 6 * k, 4.6 * k, 7 * k, RAT);
    for (const v of [0.2, 0.45, 0.7]) band(ctx, x - 5.6 * k, y - 6 * k, 4.6 * k, 7 * k, v, v + 0.06, RAT_D);
    band(ctx, x - 5.6 * k, y - 6 * k, 4.6 * k, 7 * k, 0.9, 1, RAT_L);
  }
  const b = figure(ctx, kind, 'vietnam', x, y, k);
  feet(ctx, kind, x, y, k);
  if (kind === 'rattan') { // "Sát Thát" (death to the invader) tattooed on the arm, as the Trần soldiers did in 1285
    const ax = x + 6 * k, ay = y - 5 * k + 0.6 * k;
    faceQuad(ctx, 'R', ax, ay, 2.8 * k, 7 * k, 0.2, 0.42, 0.52, 0.8, '#2a3040');
    faceQuad(ctx, 'R', ax, ay, 2.8 * k, 7 * k, 0.58, 0.8, 0.52, 0.8, '#2a3040');
    faceQuad(ctx, 'R', ax, ay, 2.8 * k, 7 * k, 0, 1, 0.3, 0.38, RED); // and a red cord round the wrist
  }
  weapon(ctx, kind, b, k);
  if (kind === 'defender') shield(ctx, kind, b.off.x, b.off.y, k);
}

// ---------------------------------------------------------------- cavalry: the horse and the war elephant

function rider(ctx: Ctx, x: number, y: number) {
  const saddle = drawHorse(ctx, x - 1, y + 3, 0.92, '#8a5a36', '#1a120c', undefined, RED);
  // a black saddle cloth edged in lotus pink, red tassels on the breast strap and the crupper
  poly(ctx, [saddle.x - 3.8, saddle.y + 1.4, saddle.x + 3, saddle.y + 1, saddle.x + 3.4, saddle.y + 4.6, saddle.x - 3.4, saddle.y + 5.2], BLK);
  line(ctx, saddle.x - 3.4, saddle.y + 5.2, saddle.x + 3.4, saddle.y + 4.6, LOTUS, 0.9);
  for (const t of [0.15, 0.5, 0.85]) ellipse(ctx, saddle.x - 3.4 + 6.8 * t, saddle.y + 5.2 - 0.6 * t, 0.45, 0.45, GOLD);
  line(ctx, x + 3.4, y - 9.6, x + 8, y - 3.6, RED, 1.2);
  for (const t of [0.3, 0.7]) tassel(ctx, x + 3.4 + 4.6 * t, y - 9.6 + 6 * t + 0.6, 3, 1.1);
  line(ctx, saddle.x - 4.6, saddle.y + 1.6, x - 9.4, y - 7.4, RED, 1);
  tassel(ctx, x - 7.6, y - 7, 2.8, 1);
  tassel(ctx, x + 8.6, y - 18.4, 2.6, 1); // a plume between the ears
  const b = figure(ctx, 'rider', 'vietnam', saddle.x, saddle.y, 0.9, true);
  rattanShield(ctx, b.off.x - 2.4, b.off.y - 2.6, 4.2, 0.7);
  spear(ctx, b.hand.x, b.hand.y + 1, 0.9, 1.1, true);
}

/** A grey war elephant under a red-and-black cloth, a mahout in a leaf hat on its neck and a roofed howdah on its back. */
function elephant(ctx: Ctx, x: number, y: number) {
  const sk = '#85828a', skD = '#5e5b63', skL = '#a8a5ac';
  softShadow(ctx, x, y + 1, 18, 5.5, 0.3);
  // the tail
  curve(ctx, x - 13, y - 17, x - 17, y - 13, x - 16, y - 6.4, 1.4, skD);
  poly(ctx, [x - 16.2, y - 7.4, x - 17.4, y - 4.4, x - 15.2, y - 4.6], '#2a2a2e');
  const leg = (lx: number, far: boolean) => {
    const c = far ? shade(sk, -0.22) : sk, w = 6;
    poly(ctx, [x + lx, y - 12, x + lx + w, y - 12, x + lx + w - 0.4, y - 0.8, x + lx + w - 0.9, y + 0.6, x + lx + 0.9, y + 0.6, x + lx + 0.4, y - 0.8], c);
    poly(ctx, [x + lx + w * 0.56, y - 12, x + lx + w, y - 12, x + lx + w - 0.4, y - 0.8, x + lx + w - 0.9, y + 0.6, x + lx + w * 0.56, y + 0.6], shade(c, -0.16));
    for (const r of [-5, -3.6]) curve(ctx, x + lx + 0.8, y + r, x + lx + w / 2, y + r + 0.5, x + lx + w - 0.8, y + r, 0.4, shade(c, -0.3)); // skin folds
    poly(ctx, [x + lx + 0.5, y - 3, x + lx + w - 0.5, y - 3, x + lx + w - 0.6, y - 1.8, x + lx + 0.6, y - 1.8], GOLD); // a gilt anklet
    for (const u of [1, 2.4, 3.8]) ellipse(ctx, x + lx + u + 0.4, y + 0.2, 0.7, 0.5, '#efe6d0');
  };
  leg(-5.6, true);
  leg(8.4, true);
  leg(-10.4, false);
  leg(4.6, false);
  // the body
  ellipse(ctx, x - 0.6, y - 14.6, 13.6, 8.8, skD);
  ellipse(ctx, x - 1, y - 15.4, 13.2, 8.2, sk);
  ellipse(ctx, x - 3.4, y - 19.6, 8.6, 3.4, skL);
  // the cloth: black with a broad red border, a lotus-pink fringe and gilt studs
  const cl = [x - 11.4, y - 19.4, x - 8.6, y - 24.4, x + 4.4, y - 25.2, x + 8.8, y - 20, x + 8, y - 10.2, x - 10.8, y - 9.6];
  poly(ctx, cl, BLK);
  poly(ctx, [x - 11.4, y - 19.4, x - 8.6, y - 24.4, x - 1, y - 25, x - 1, y - 10, x - 10.8, y - 9.6], BLK_L);
  poly(ctx, [x - 11, y - 12.6, x + 8.1, y - 13.2, x + 8, y - 10.2, x - 10.8, y - 9.6], RED);
  line(ctx, x - 11, y - 12.7, x + 8.1, y - 13.3, GOLD, 0.7);
  for (let i = 0; i < 8; i++) { const fx = x - 10.2 + i * 2.5; poly(ctx, [fx - 1, y - 9.8 + i * -0.06, fx + 1, y - 9.8 + i * -0.06, fx, y - 7.6], i % 2 ? LOTUS : LOTUS_D); }
  for (const [rx, ry] of [[-6, -17.4], [1.6, -17.6]] as const) { // embroidered lotus roundels
    ellipse(ctx, x + rx, y + ry, 2.6, 2.4, RED);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ellipse(ctx, x + rx + Math.cos(a) * 1.3, y + ry + Math.sin(a) * 1.2, 0.9, 0.7, LOTUS); }
    ellipse(ctx, x + rx, y + ry, 0.8, 0.8, GOLD);
  }
  line(ctx, x - 6, y - 8.6, x + 5, y - 8.8, RED_D, 1.2); // the girth
  // the head: a domed brow, a big fanned ear, a trunk curling down and gilt-capped tusks
  ellipse(ctx, x + 11.4, y - 17.4, 6.4, 6.8, skD);
  ellipse(ctx, x + 11.2, y - 18, 6, 6.4, sk);
  ellipse(ctx, x + 10.4, y - 21.6, 3.6, 2.2, skL);
  ctx.beginPath(); // the trunk
  ctx.moveTo(x + 14.4, y - 16);
  ctx.bezierCurveTo(x + 19, y - 12, x + 18, y - 5, x + 20.6, y - 2.4);
  ctx.lineTo(x + 18.4, y - 2);
  ctx.bezierCurveTo(x + 16, y - 5, x + 16, y - 10, x + 11.4, y - 13);
  ctx.closePath();
  ctx.fillStyle = ink(sk);
  ctx.fill();
  for (let i = 0; i < 6; i++) { const t = i / 6; line(ctx, x + 15 + t * 4.6, y - 14 + t * 10.6, x + 16.8 + t * 3.6, y - 14.6 + t * 10.6, skD, 0.35); }
  curve(ctx, x + 13.4, y - 13.4, x + 17.4, y - 12.4, x + 18.6, y - 9, 1.2, '#f2ead6'); // the tusk
  ellipse(ctx, x + 18.6, y - 9, 0.8, 0.8, GOLD);
  // the ear, fanned out over the neck
  poly(ctx, [x + 8, y - 22, x + 4.8, y - 21.4, x + 3.6, y - 16, x + 5, y - 11.4, x + 8.6, y - 12.6, x + 9.6, y - 17], skD);
  poly(ctx, [x + 8, y - 21.4, x + 5.4, y - 20.8, x + 4.4, y - 16, x + 5.6, y - 12.4, x + 8.2, y - 13.4, x + 8.8, y - 17], sk);
  ellipse(ctx, x + 12.6, y - 18.6, 0.75, 0.6, '#101010');
  ellipse(ctx, x + 12.4, y - 18.8, 0.25, 0.2, '#ffffff');
  // a red head-cloth with a gilt rosette
  poly(ctx, [x + 8.6, y - 23.4, x + 14.6, y - 22.4, x + 14, y - 19.6, x + 9.4, y - 20.8], RED);
  ellipse(ctx, x + 11.6, y - 21.6, 1.1, 1, GOLD);
  tassel(ctx, x + 14.6, y - 20.2, 3, 1, LOTUS);
  // the howdah: a lacquered platform, red posts and a curved tile roof with upswept corners
  const hx = x - 1.6, hy = y - 24.4;
  box(ctx, hx, hy, 15, 2.6, RED_D, shade(RED_D, 0.2));
  band(ctx, hx, hy, 15, 2.6, 0.3, 0.55, GOLD);
  const seat = { x: hx + 0.4, y: hy - 2.6 };
  const crew = figure(ctx, 'knight', 'vietnam', seat.x, seat.y + 2, 0.72, true);
  dao(ctx, crew.hand.x, crew.hand.y + 1, 0.62);
  for (const [px, py] of [[-6.4, 0.2], [6.4, 0.2], [0, 3.6]] as const) { // posts (the back ones are hidden by the crew)
    line(ctx, hx + px, hy - 2 + py, hx + px, hy - 11 + py, RED, 1.1);
    line(ctx, hx + px - 0.3, hy - 2 + py, hx + px - 0.3, hy - 11 + py, RED_L, 0.35);
  }
  // a low railing of turned balusters along the front edges
  line(ctx, hx - 7.4, hy - 3.4, hx, hy - 0.6 + 1.6, GOLD, 0.6);
  line(ctx, hx, hy + 1, hx + 7.4, hy - 3, GOLD, 0.6);
  hipRoof(ctx, hx, hy - 10.4, 5, 4.2, 3.4, TERRA, { over: 0.8, lift: 1.4, horns: true, ridge: 0 });
  // the mahout on the neck in a leaf hat, with a goad
  const m = figure(ctx, 'warrior', 'vietnam', x + 9.6, y - 22.6, 0.58, true);
  line(ctx, m.hand.x, m.hand.y + 1, m.hand.x + 3.4, m.hand.y - 4.6, WOOD, 0.7);
  curve(ctx, m.hand.x + 3.4, m.hand.y - 4.6, m.hand.x + 4.6, m.hand.y - 5.2, m.hand.x + 4.2, m.hand.y - 3.6, 0.5, IRON);
}

// ---------------------------------------------------------------- the bamboo traction trebuchet

function trebuchet(ctx: Ctx, x: number, y: number) {
  softShadow(ctx, x, y + 2, 20, 6, 0.28);
  // a heap of round stones
  for (const [ax, ay, ar] of [[-17, 6, 2.2], [-14, 7, 1.8], [-15.6, 4, 1.6]] as const) { ellipse(ctx, x + ax, y + ay, ar, ar * 0.85, '#7d766c'); ellipse(ctx, x + ax - ar * 0.3, y + ay - ar * 0.3, ar * 0.45, ar * 0.35, '#b0a698'); }
  // the cart: a timber bed on two spoked wheels a side
  box(ctx, x, y + 2, 24, 2.6, WOOD, WOOD_L);
  for (const u of [0.2, 0.5, 0.8]) { faceQuad(ctx, 'R', x, y + 2, 24, 2.6, u, u + 0.03, 0, 1, WOOD_D); faceQuad(ctx, 'L', x, y + 2, 24, 2.6, u, u + 0.03, 0, 1, WOOD_D); }
  const A: [number, number] = [x + 1, y - 27]; // the axle
  // the far pair of legs, then the near pair: bamboo, lashed in red at the top, braced across
  for (const [bx, by, d] of [[x - 4, y - 4, -1], [x + 13, y - 3, 1]] as const) bamboo(ctx, bx, by, A[0] + d * 1.6 - 2, A[1] - 1, 1.6, BAMB_D, 3);
  for (const [bx, by, d] of [[x - 10, y + 2, -1], [x + 8, y + 4, 1]] as const) {
    bamboo(ctx, bx, by, A[0] + d * 1.6, A[1], 2.2, BAMB, 4);
    ellipse(ctx, A[0] + d * 1.6 - (A[0] + d * 1.6 - bx) * 0.04, A[1] + (by - A[1]) * 0.04, 1.4, 1, RED);
  }
  bamboo(ctx, x - 7, y - 8, x + 6.6, y - 6.6, 1.3, BAMB_D, 2); // the cross brace
  line(ctx, A[0] - 3.4, A[1] + 1, A[0] + 3.4, A[1] - 1, WOOD_D, 2.4);
  for (const dx of [-3.4, 3.4]) ellipse(ctx, A[0] + dx, A[1] - dx * 0.3, 1, 1, GOLD_D);
  // the throwing arm: bamboo poles bound together, the long end swung back and up, the short end forward and down
  const tip: [number, number] = [x - 14, y - 47], pull: [number, number] = [x + 10, y - 19];
  for (const o of [-0.7, 0.7]) bamboo(ctx, pull[0] + o, pull[1], tip[0] + o, tip[1], 1.5, o < 0 ? BAMB_L : BAMB, 6);
  for (const t of [0.22, 0.42, 0.62, 0.82]) { const px = pull[0] + (tip[0] - pull[0]) * t, py = pull[1] + (tip[1] - pull[1]) * t; line(ctx, px - 1.5, py - 0.6, px + 1.5, py + 0.6, RED, 1.1); }
  ellipse(ctx, A[0], A[1], 1.5, 1.5, GOLD);
  // the sling: two cords from the arm's tip down to a net pouch resting on the bed, holding a stone
  const pouch: [number, number] = [x - 8, y - 1];
  curve(ctx, tip[0], tip[1], tip[0] - 3, (tip[1] + pouch[1]) / 2, pouch[0] - 2, pouch[1] - 1, 0.5, '#5a4a2a');
  curve(ctx, tip[0], tip[1], tip[0] + 2, (tip[1] + pouch[1]) / 2, pouch[0] + 2.2, pouch[1] - 1, 0.5, '#5a4a2a');
  ellipse(ctx, pouch[0], pouch[1], 3, 1.8, RAT_D);
  ellipse(ctx, pouch[0], pouch[1] - 0.8, 1.8, 1.5, '#7d766c');
  ellipse(ctx, pouch[0] - 0.5, pouch[1] - 1.3, 0.7, 0.6, '#b0a698');
  tassel(ctx, tip[0], tip[1] + 0.6, 3.4, 1.2, LOTUS);
  // wheels on the near side
  for (const wx of [-7, 9]) {
    const wy = y + 3 + (wx + 7) * 0.25;
    ellipse(ctx, x + wx, wy + 0.3, 4.2, 4.4, WOOD_D);
    ellipse(ctx, x + wx - 0.3, wy, 3.6, 3.8, WOOD);
    ellipse(ctx, x + wx - 0.3, wy, 2.6, 2.8, WOOD_D);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI; line(ctx, x + wx - 0.3 + Math.cos(a) * 3, wy + Math.sin(a) * 3.2, x + wx - 0.3 - Math.cos(a) * 3, wy - Math.sin(a) * 3.2, WOOD_L, 0.6); }
    ellipse(ctx, x + wx - 0.3, wy, 1, 1, GOLD_D);
  }
  // a red banner with a lotus on the cart's back corner
  line(ctx, x - 12, y + 1, x - 12, y - 20, WOOD_D, 0.9);
  poly(ctx, [x - 12, y - 20, x - 5, y - 18.6, x - 6.6, y - 16, x - 5, y - 13.4, x - 12, y - 14.4], RED);
  ellipse(ctx, x - 9.2, y - 16.8, 1.3, 1.2, LOTUS);
  ellipse(ctx, x - 9.2, y - 17.2, 0.7, 0.6, LOTUS_L);
  // a small woven rattan mantlet, then the pulling ropes down to a crewman in a leaf hat who hauls on them
  const mx = x + 14, my = y + 7;
  poly(ctx, [mx, my, mx + 6, my - 3, mx + 6, my - 10, mx, my - 7], RAT);
  for (let i = 1; i < 5; i++) line(ctx, mx, my - i * 1.4, mx + 6, my - 3 - i * 1.4, RAT_D, 0.4);
  for (let i = 1; i < 4; i++) line(ctx, mx + i * 1.5, my - i * 0.75, mx + i * 1.5, my - 7 - i * 0.75, shade(RAT, 0.18), 0.4);
  for (let i = 0; i < 4; i++) {
    const px = pull[0] - 0.6 + i * 0.5, ex = x + 4 + i * 2.6, ey = y + 4 + (i % 2) * 1.6;
    curve(ctx, px, pull[1] + 0.6, (px + ex) / 2 + 1, (pull[1] + ey) / 2, ex, ey, 0.55, i % 2 ? '#8a6a3a' : '#a8885a');
  }
  const crew = figure(ctx, 'warrior', 'vietnam', x + 21, y + 9, 0.55);
  feet(ctx, 'warrior', x + 21, y + 9, 0.55);
  curve(ctx, crew.hand.x, crew.hand.y, crew.hand.x - 6, crew.hand.y - 6, pull[0] + 0.8, pull[1] + 1, 0.6, '#a8885a');
}

// ---------------------------------------------------------------- war boats

/** A battened mat sail of woven bamboo: a lug sail between the mast and its fanned outer edge, with a fan of sheet lines. */
function matSail(ctx: Ctx, mx: number, topY: number, botY: number, sw: number, dir: number, n: number, mat = '#c8945a') {
  const A = [mx - dir * sw * 0.18, topY], B = [mx + dir * sw, topY + 2.6], C = [mx + dir * sw * 1.08, botY + 0.6], D = [mx - dir * sw * 0.14, botY];
  const at = (u: number, v: number) => [A[0] + (B[0] - A[0]) * u + (D[0] - A[0]) * v + ((C[0] - D[0]) - (B[0] - A[0])) * u * v, A[1] + (B[1] - A[1]) * u + (D[1] - A[1]) * v + ((C[1] - D[1]) - (B[1] - A[1])) * u * v];
  poly(ctx, [...A, ...B, ...C, ...D], mat);
  for (let i = 0; i < n; i++) {
    const p0 = at(0, i / n), p1 = at(1, i / n), p2 = at(1, (i + 1) / n), p3 = at(0, (i + 1) / n);
    poly(ctx, [...p0, ...p1, ...p2, ...p3], i % 2 ? shade(mat, -0.1) : mat);
    // the weave: short diagonal strokes across each panel
    for (let j = 0; j < 7; j++) {
      const u = (j + 0.5) / 7, a = at(u, (i + 0.25) / n), b = at(u + 0.06, (i + 0.75) / n);
      line(ctx, a[0], a[1], b[0], b[1], shade(mat, -0.22), 0.3);
    }
    // each panel bellies a little: a lit strip under the batten
    const l0 = at(0, i / n + 0.12 / n), l1 = at(1, i / n + 0.12 / n);
    line(ctx, l0[0], l0[1], l1[0], l1[1], shade(mat, 0.2), 0.5);
  }
  for (let i = 0; i <= n; i++) { const p = at(0, i / n), q = at(1, i / n); line(ctx, p[0], p[1], q[0] + dir * 0.8, q[1], WOOD_D, 0.7); } // battens
  // the sheet lines fan from every batten end to one block low on the stern side
  const blk = [mx - dir * sw * 0.6, botY + 4];
  for (let i = 1; i <= n; i++) { const q = at(1, i / n); line(ctx, q[0] + dir * 0.8, q[1], blk[0], blk[1], 'rgba(60,40,20,0.55)', 0.3); }
}

/** A painted almond eye on the bow. */
function bowEye(ctx: Ctx, x: number, y: number, s: number) {
  poly(ctx, [x - 2.4 * s, y, x - 0.6 * s, y - 1.3 * s, x + 1.8 * s, y - 0.6 * s, x + 2.4 * s, y + 0.2 * s, x + 0.4 * s, y + 1.1 * s, x - 1.6 * s, y + 0.8 * s], '#f4efe0');
  ellipse(ctx, x + 0.3 * s, y - 0.05 * s, 0.85 * s, 0.85 * s, '#101010');
  ellipse(ctx, x + 0.05 * s, y - 0.35 * s, 0.28 * s, 0.28 * s, '#ffffff');
  curve(ctx, x - 2.6 * s, y - 0.2 * s, x - 0.4 * s, y - 2.4 * s, x + 2.6 * s, y - 1 * s, 0.6 * s, RED); // the red lid
  line(ctx, x + 2.4 * s, y + 0.2 * s, x + 3.6 * s, y - 0.4 * s, '#101010', 0.45 * s);
}

/** An oar dipping into the water from the gunwale, with a splash. */
function oar(ctx: Ctx, x: number, y: number, len: number, phase: number) {
  const ex = x + 1.4 + phase * 1.4, ey = y + len;
  line(ctx, x, y, ex, ey, WOOD_L, 0.7);
  ellipse(ctx, ex + 0.3, ey + 0.2, 0.9, 1.5, WOOD);
  ellipse(ctx, ex + 0.3, ey + 1.4, 1.6, 0.6, 'rgba(255,255,255,0.55)');
}

/** The hull: a long dark tarred boat whose ends sweep up, a red and black band, an eye on the bow. Returns the gunwale's height at t ∈ [-1, 1]. */
function hull(ctx: Ctx, x: number, y: number, w: number, lift: number, deck: () => void) {
  const top = (t: number) => y - 5 - Math.pow(Math.abs(t), 2.6) * lift - (t > 0 ? t * t * 1.4 : 0);
  const near: [number, number][] = [];
  for (let i = 0; i <= 12; i++) { const t = -1 + i / 6; near.push([x + t * w, top(t)]); }
  const far = near.map(([px, py], i): [number, number] => [px + (i === 0 ? 2.4 : i === 12 ? -2.4 : 0), py - 2.4]);
  poly(ctx, [...near.flatMap(([a, b]) => [a, b]), ...[...far].reverse().flatMap(([a, b]) => [a, b])], '#2a1c12'); // the far wall's inside
  poly(ctx, [x - w * 0.9, y - 5.2, x + w * 0.9, y - 5.4, x + w * 0.9, y - 7.2, x - w * 0.9, y - 7], '#9a7448'); // the deck
  deck();
  const hullPts = [...near, [x + w * 0.88, y - 1.2], [x + w * 0.5, y + 2.4], [x, y + 3], [x - w * 0.5, y + 2.4], [x - w * 0.88, y - 1.2]] as [number, number][];
  poly(ctx, hullPts.flatMap(([a, b]) => [a, b]), '#4a3022');
  poly(ctx, [...near.flatMap(([a, b]) => [a, b]), x + w * 0.8, y - 3, x, y - 2.4, x - w * 0.8, y - 3], '#6a4630'); // the lit upper strake
  // a red wale with a black stripe under the gunwale
  ctx.strokeStyle = ink(RED);
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  near.forEach(([a, b], i) => (i ? ctx.lineTo(a, b + 1.2) : ctx.moveTo(a, b + 1.2)));
  ctx.stroke();
  ctx.strokeStyle = ink(BLK);
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  near.forEach(([a, b], i) => (i ? ctx.lineTo(a, b + 2.3) : ctx.moveTo(a, b + 2.3)));
  ctx.stroke();
  ctx.strokeStyle = ink(WOOD_L);
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  near.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)));
  ctx.stroke();
  poly(ctx, [x - w * 0.88, y - 1.2, x - w * 0.5, y + 2.4, x, y + 3, x + w * 0.5, y + 2.4, x + w * 0.88, y - 1.2, x + w * 0.5, y - 0.2, x, y + 0.4, x - w * 0.5, y - 0.2], '#26180e');
  for (const t of [-0.6, -0.2, 0.2, 0.6]) line(ctx, x + t * w, top(t) + 2.6, x + t * w - 0.4, y + 2, 'rgba(0,0,0,0.25)', 0.4); // plank seams
  bowEye(ctx, x + w * 0.82, top(0.82) + 2.4, 1.1);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y + 3, w * 0.82, 2.2, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.stroke();
  return top;
}

/** A small deckhouse under a curved roof. */
function cabin(ctx: Ctx, x: number, y: number, w: number, h: number) {
  box(ctx, x, y, w, h, '#8a5a34', '#a8784a');
  for (const u of [0.2, 0.5, 0.8]) { faceQuad(ctx, 'R', x, y, w, h, u - 0.06, u + 0.06, 0.2, 0.8, '#3a2414'); faceQuad(ctx, 'L', x, y, w, h, u - 0.06, u + 0.06, 0.2, 0.8, '#3a2414'); }
  band(ctx, x, y, w, h, 0.88, 1, RED);
  hipRoof(ctx, x, y - h, w * 0.32, w * 0.22, w * 0.32, TERRA, { over: 1.4, lift: 1.8, horns: true, ridge: 0 });
}

function boats(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  if (kind === 'boat') {
    // a sampan: a single mat sail, a rattan awning and a boatman sculling with a long oar
    const w = 17;
    matSail(ctx, x + 3, y - 30, y - 9, 9, 1, 4);
    line(ctx, x + 3, y - 31, x + 3, y - 6, WOOD_D, 1.1);
    hull(ctx, x, y, w, 4.4, () => {
      // the rounded rattan awning over the stern half
      ctx.beginPath();
      ctx.moveTo(x - 12, y - 6.6);
      ctx.bezierCurveTo(x - 12, y - 15, x - 1, y - 15, x - 1, y - 6.8);
      ctx.closePath();
      ctx.fillStyle = ink(RAT_D);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - 11, y - 6.6);
      ctx.bezierCurveTo(x - 11, y - 13.6, x - 2, y - 13.6, x - 2, y - 6.8);
      ctx.closePath();
      ctx.fillStyle = ink(RAT);
      ctx.fill();
      for (let i = 0; i < 5; i++) curve(ctx, x - 11 + i * 0.4, y - 6.6 - i * 1.4, x - 6.5, y - 13.6 - i * 0.2 + i * 1.3, x - 2 - i * 0.4, y - 6.8 - i * 1.4, 0.35, RAT_D);
      figure(ctx, 'warrior', 'vietnam', x + 6, y - 4.2, 0.5, true);
    });
    oar(ctx, x - w * 0.86, y - 9, 10, -1);
    oar(ctx, x + 1, y - 4, 5.6, 0);
    poly(ctx, [x + 3, y - 31, x + 9, y - 30, x + 6.8, y - 28.6, x + 9, y - 27.2, x + 3, y - 28], LOTUS); // the pennant
    return;
  }
  if (kind === 'ship') {
    // a war galley: a mat sail, a roofed cabin aft, rowers' oars all along and soldiers with crossbows
    const w = 25;
    matSail(ctx, x + 4, y - 38, y - 12, 12, 1, 5);
    line(ctx, x + 4, y - 39, x + 4, y - 8, WOOD_D, 1.3);
    const top = hull(ctx, x, y, w, 5, () => {
      cabin(ctx, x - 14, y - 6, 9, 5);
      for (const [cx2, kd] of [[-0.1, 'archer'], [0.3, 'defender'], [0.56, 'archer']] as const) figure(ctx, kd, 'vietnam', x + cx2 * w, y - 4.6, 0.42, true);
    });
    for (let i = 0; i < 7; i++) { const t = -0.62 + i * 0.2; oar(ctx, x + t * w, top(t) + 2.2, 7.4, i % 2 ? 1 : -0.4); }
    poly(ctx, [x + 4, y - 39, x + 11, y - 37.8, x + 8.6, y - 36.2, x + 11, y - 34.6, x + 4, y - 35.6], RED);
    tassel(ctx, x + w * 0.98, top(0.98) - 1.4, 3.4, 1.2);
    return;
  }
  // the warship: a great two-masted war junk, rattan shields along the rail, a tall roofed castle and a dragon-headed bow
  const w = 29;
  matSail(ctx, x + 9, y - 46, y - 14, 13, 1, 6);
  line(ctx, x + 9, y - 47, x + 9, y - 9, WOOD_D, 1.5);
  matSail(ctx, x - 6, y - 38, y - 14, 10, 1, 5, '#b8844a');
  line(ctx, x - 6, y - 39, x - 6, y - 9, WOOD_D, 1.3);
  const top = hull(ctx, x, y, w, 6, () => {
    // the stern castle: two storeys of red lacquer under a curved roof
    box(ctx, x - 19, y - 6, 10, 6, RED_D, shade(RED_D, 0.15));
    box(ctx, x - 19, y - 12, 8, 4.4, '#8a5a34', '#a8784a');
    for (const u of [0.25, 0.65]) faceQuad(ctx, 'L', x - 19, y - 12, 8, 4.4, u, u + 0.14, 0.2, 0.8, '#3a2414');
    hipRoof(ctx, x - 19, y - 16.4, 3.2, 2.6, 3.4, TERRA, { over: 1.6, lift: 2, horns: true, ridge: 0 });
    for (const [cx2, kd] of [[-0.24, 'swordsman'], [0.08, 'archer'], [0.38, 'defender'], [0.64, 'archer']] as const) figure(ctx, kd, 'vietnam', x + cx2 * w, y - 4.8, 0.42, true);
  });
  for (let i = 0; i < 6; i++) { const t = -0.5 + i * 0.2; rattanShield(ctx, x + t * w, top(t) + 0.4, 2.2, 0.5); } // shields hung along the rail
  for (let i = 0; i < 9; i++) { const t = -0.78 + i * 0.19; oar(ctx, x + t * w, top(t) + 3.2, 7.6, i % 2 ? 1 : -0.4); }
  // the dragon-headed bow post
  const bx = x + w, by = top(1);
  curve(ctx, bx - 1, by + 1, bx + 2, by - 3, bx + 1.2, by - 6.4, 2, GOLD_D);
  ellipse(ctx, bx + 1.6, by - 6.8, 1.8, 1.4, GOLD);
  poly(ctx, [bx + 2.6, by - 7.4, bx + 5, by - 6.6, bx + 2.8, by - 6], GOLD);
  ellipse(ctx, bx + 1.6, by - 7.2, 0.4, 0.4, '#101010');
  for (let i = 0; i < 3; i++) curve(ctx, bx + 0.6, by - 7.6, bx - 1 - i, by - 10 + i * 0.6, bx - 3 - i * 1.2, by - 7.4 + i, 0.6, i % 2 ? RED : LOTUS); // its mane
  // pennants: red at the main truck, lotus pink at the fore
  poly(ctx, [x + 9, y - 47, x + 17, y - 45.4, x + 14, y - 43.6, x + 17, y - 41.6, x + 9, y - 42.6], RED);
  ellipse(ctx, x + 12.4, y - 44.6, 1, 0.9, GOLD);
  poly(ctx, [x - 6, y - 39, x + 0.4, y - 38, x - 1.6, y - 36.6, x + 0.4, y - 35.2, x - 6, y - 36], LOTUS);
  line(ctx, x - 6, y - 38, x + 9, y - 46, 'rgba(60,40,20,0.6)', 0.35); // a stay between the mastheads
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

interface RoofOpts { over: number; lift: number; horns: boolean; ridge: number }

/**
 * A hipped roof of curved terracotta tiles at eave height `cy`: its ridge runs along u, its eaves sag in the middle and
 * sweep up at the corners, which end in upturned dragon-tail horns (đầu đao).
 */
function hipRoof(ctx: Ctx, cx: number, cy: number, A: number, B: number, h: number, color: string, o: RoofOpts) {
  const a = A + o.over, b = B + o.over;
  const r = Math.max(o.ridge, a - b);
  const C = (u: number, v: number, up = 0): [number, number] => { const [px, py] = P(cx, cy, u, v); return [px, py - up]; };
  const lift = o.lift;
  const cL = C(-a, b, lift), cF = C(a, b, lift), cR = C(a, -b, lift), cB = C(-a, -b, lift);
  const r0 = C(-r, 0, h), r1 = C(r, 0, h);
  const sag = (p: [number, number], q: [number, number]): [number, number] => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2 + lift * 1.15];
  const face = (p: [number, number], q: [number, number], ridge: [number, number][], col: string) => {
    const m = sag(p, q);
    ctx.beginPath();
    ctx.moveTo(p[0], p[1]);
    ctx.quadraticCurveTo(m[0], m[1], q[0], q[1]);
    for (const [px, py] of ridge) ctx.lineTo(px, py);
    ctx.closePath();
    ctx.fillStyle = ink(col);
    ctx.fill();
  };
  const dark = shade(color, -0.3), lit = shade(color, 0.08);
  // the back slopes first, then the two that face us
  face(cB, cR, [r1, r0], shade(color, -0.1));
  face(cL, cB, [r0], shade(color, 0.02));
  face(cR, cF, [r1], dark);
  face(cF, cL, [r0, r1], lit);
  // rows of tubular tiles running down each front slope
  const rows = (p: [number, number], q: [number, number], ridge: [number, number][], n: number, col: string) => {
    const m = sag(p, q);
    for (let i = 1; i < n; i++) {
      const t = i / n, u = 1 - t;
      const ex = u * u * p[0] + 2 * u * t * m[0] + t * t * q[0], ey = u * u * p[1] + 2 * u * t * m[1] + t * t * q[1];
      const rp = ridge.length === 1 ? ridge[0] : [ridge[1][0] + (ridge[0][0] - ridge[1][0]) * t, ridge[1][1] + (ridge[0][1] - ridge[1][1]) * t];
      line(ctx, ex, ey, ex + (rp[0] - ex) * 0.92, ey + (rp[1] - ey) * 0.92, col, 0.45);
    }
  };
  rows(cF, cL, [r0, r1], Math.max(4, Math.round(a / 1.6)), shade(color, -0.2));
  rows(cR, cF, [r1], Math.max(3, Math.round(b / 1.6)), shade(color, -0.45));
  // the dark eave line and a pale tile edge just above it
  const edge = (p: [number, number], q: [number, number]) => {
    const m = sag(p, q);
    curve(ctx, p[0], p[1] + 0.5, m[0], m[1] + 0.5, q[0], q[1] + 0.5, 1.1, shade(color, -0.5));
    curve(ctx, p[0], p[1] - 0.3, m[0], m[1] - 0.3, q[0], q[1] - 0.3, 0.45, shade(color, 0.3));
  };
  edge(cF, cL);
  edge(cR, cF);
  // the ridge, with its ends curling up
  line(ctx, r0[0], r0[1], r1[0], r1[1], shade(color, -0.4), 1.6);
  line(ctx, r0[0], r0[1] - 0.5, r1[0], r1[1] - 0.5, shade(color, 0.2), 0.5);
  line(ctx, r1[0], r1[1], cF[0], cF[1], shade(color, -0.42), 1);
  line(ctx, r0[0], r0[1], cL[0], cL[1], shade(color, -0.3), 1);
  line(ctx, r1[0], r1[1], cR[0], cR[1], shade(color, -0.5), 1);
  if (r > 0.5) for (const [p, d] of [[r0, -1], [r1, 1]] as const) curve(ctx, p[0], p[1], p[0] + d * 1.6, p[1] - 0.4, p[0] + d * 1.8, p[1] - 2.4, 1, shade(color, -0.4));
  if (o.horns) for (const [p, d] of [[cL, -1], [cR, 1]] as const) { // the upswept dragon-tail corners at the two ends
    const sz = Math.min(1, lift / 2.4), dx = d * 1.8 * sz;
    curve(ctx, p[0], p[1], p[0] + dx * 0.6, p[1] - 1 * sz, p[0] + dx, p[1] - 3 * sz, 1.1 * Math.max(0.7, sz), shade(color, -0.42));
    ellipse(ctx, p[0] + dx, p[1] - 3.1 * sz, 0.55 * sz, 0.55 * sz, shade(color, -0.2));
  }
}

/** A bamboo fence along a straight run: split-bamboo palings between two rails. */
function fence(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, h: number) {
  const n = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / 1.6));
  for (let i = 0; i <= n; i++) {
    const t = i / n, px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t;
    line(ctx, px, py, px, py - h - (i % 2) * 0.6, i % 3 ? BAMB_L : BAMB, 0.7);
  }
  for (const f of [0.35, 0.75]) line(ctx, x0, y0 - h * f, x1, y1 - h * f, BAMB_D, 0.6);
}

/** A house on low stilts under a curved terracotta roof, with a ladder and a bamboo fence before it. */
function stiltHouse(ctx: Ctx, x: number, y: number, s: number, roofC: string, thatch = false) {
  const A = 7 * s, B = 3.4 * s, stilt = 3.2 * s, wh = 5 * s;
  ellipse(ctx, x + 1, y + 1.4, A * 1.3, B * 0.9, 'rgba(0,0,0,0.16)');
  // the stilts and the floor platform
  for (const [u, v] of [[-A, B], [A, B], [A, -B], [0, B], [A, 0]] as const) { const [px, py] = P(x, y, u, v); line(ctx, px, py, px, py - stilt, WOOD_D, 1.1); }
  const fy = y - stilt;
  walls(ctx, x, fy, A + 0.8, B + 0.8, 1.1, WOOD);
  // the walls: woven bamboo panels between dark posts, with a door and a window
  walls(ctx, x, fy - 1.1, A, B, wh, thatch ? '#c8aa6a' : '#a87a4a');
  const [lx, ly] = P(x, fy - 1.1, -A, B), [fx, fy2] = P(x, fy - 1.1, A, B), [rx, ry] = P(x, fy - 1.1, A, -B);
  for (const t of [0, 0.5, 1]) line(ctx, lx + (fx - lx) * t, ly + (fy2 - ly) * t, lx + (fx - lx) * t, ly + (fy2 - ly) * t - wh, WOOD_D, 0.8);
  line(ctx, rx, ry, rx, ry - wh, WOOD_D, 0.8);
  const dx = lx + (fx - lx) * 0.7, dy = ly + (fy2 - ly) * 0.7;
  poly(ctx, [dx - 1.2 * s, dy - 0.6 * s, dx + 1.2 * s, dy + 0.6 * s, dx + 1.2 * s, dy + 0.6 * s - 3.2 * s, dx - 1.2 * s, dy - 0.6 * s - 3.2 * s], '#2a1a10'); // the door
  const wx = fx + (rx - fx) * 0.5, wy = fy2 + (ry - fy2) * 0.5;
  poly(ctx, [wx - 1.3 * s, wy + 0.6 * s - 1.4 * s, wx + 1.3 * s, wy - 0.6 * s - 1.4 * s, wx + 1.3 * s, wy - 0.6 * s - 3 * s, wx - 1.3 * s, wy + 0.6 * s - 3 * s], '#2a1a10');
  for (const t of [0.3, 0.6]) line(ctx, wx - 1.3 * s + 2.6 * s * t, wy + 0.6 * s - 1.2 * s * t - 1.4 * s, wx - 1.3 * s + 2.6 * s * t, wy + 0.6 * s - 1.2 * s * t - 3 * s, WOOD_L, 0.4);
  // the ladder up to the door
  for (const o of [-0.8, 0.8]) line(ctx, dx + o * s, dy + stilt + 1.6 * s, dx + o * s * 0.8, dy, WOOD_L, 0.6);
  for (let i = 1; i < 4; i++) line(ctx, dx - 0.8 * s, dy + (stilt + 1.6 * s) * (1 - i / 4), dx + 0.8 * s, dy + (stilt + 1.6 * s) * (1 - i / 4), WOOD_L, 0.5);
  if (thatch) hipRoof(ctx, x, fy - 1.1 - wh, A, B, 5.6 * s, '#c8a050', { over: 1.2 * s, lift: 0.5, horns: false, ridge: 0 });
  else hipRoof(ctx, x, fy - 1.1 - wh, A, B, 4.6 * s, roofC, { over: 1.2 * s, lift: 1.8 * s, horns: true, ridge: 0 });
}

/** A brick tower of the Trần (like Phổ Minh): tiers stepping in, a lotus finial. */
function tower(ctx: Ctx, x: number, y: number, s: number) {
  ellipse(ctx, x + 1, y + 1.4, 7 * s, 3 * s, 'rgba(0,0,0,0.16)');
  box(ctx, x, y, 11 * s, 2 * s, STONE, shade(STONE, 0.15));
  let cy = y - 2 * s, w = 8.6 * s;
  const brick = '#a8583a';
  for (let i = 0; i < 5; i++) {
    const h = (i === 0 ? 5 : 3.4 - i * 0.3) * s;
    box(ctx, x, cy, w, h, brick, shade(brick, 0.1));
    for (let r = 1; r < 3; r++) band(ctx, x, cy, w, h, r / 3, r / 3 + 0.04, shade(brick, -0.2));
    faceQuad(ctx, 'R', x, cy, w, h, 0.38, 0.62, 0.15, 0.75, '#2a1a10'); // a niche
    cy -= h;
    box(ctx, x, cy + 0.8 * s, w + 1.6 * s, 0.8 * s, shade(brick, -0.15), shade(brick, 0.15)); // the cornice
    w *= 0.84;
  }
  poly(ctx, [x - 1 * s, cy, x + 1 * s, cy, x, cy - 4 * s], GOLD);
  ellipse(ctx, x, cy - 0.4 * s, 1.6 * s, 0.8 * s, LOTUS);
}

/** A ground house with a tile roof inside a bamboo fence, a haystack and a water jar in the yard. */
function yardHouse(ctx: Ctx, x: number, y: number, roofC: string) {
  ellipse(ctx, x + 1, y + 1.4, 9, 4, 'rgba(0,0,0,0.14)');
  // the fence behind and to the left
  const [bx, by] = P(x, y, -7, -5), [lx, ly] = P(x, y, -7, 6);
  fence(ctx, bx, by, lx, ly, 2.6);
  // the house
  walls(ctx, x - 1, y - 1, 5, 3.2, 1, STONE_D);
  walls(ctx, x - 1, y - 2, 4.6, 2.8, 4.4, '#e6d8b8');
  const [fx, fy] = P(x - 1, y - 2, 4.6, 2.8), [lx2, ly2] = P(x - 1, y - 2, -4.6, 2.8);
  for (const t of [0.15, 0.85]) line(ctx, lx2 + (fx - lx2) * t, ly2 + (fy - ly2) * t, lx2 + (fx - lx2) * t, ly2 + (fy - ly2) * t - 4.4, RED, 0.9); // red columns of the porch
  const dx = lx2 + (fx - lx2) * 0.5, dy = ly2 + (fy - ly2) * 0.5;
  poly(ctx, [dx - 1.4, dy - 0.7, dx + 1.4, dy + 0.7, dx + 1.4, dy + 0.7 - 3.4, dx - 1.4, dy - 0.7 - 3.4], '#3a2414');
  hipRoof(ctx, x - 1, y - 6.4, 4.6, 2.8, 4.6, roofC, { over: 1.6, lift: 2, horns: true, ridge: 0 });
  // a haystack and a glazed water jar
  const [hx, hy] = P(x, y, 6.4, -1);
  ellipse(ctx, hx, hy, 2.6, 1.2, '#a88a40');
  poly(ctx, [hx - 2.6, hy, hx, hy - 6, hx + 2.6, hy], '#d8b860');
  poly(ctx, [hx, hy - 6, hx + 2.6, hy, hx + 0.6, hy + 0.6], '#b8983e');
  line(ctx, hx, hy - 6, hx, hy - 7.6, WOOD_D, 0.6);
  const [jx, jy] = P(x, y, 4.6, 5);
  ellipse(ctx, jx, jy - 1.4, 1.6, 1.8, '#5a4a3a');
  ellipse(ctx, jx - 0.4, jy - 1.8, 0.6, 0.8, '#8a7a6a');
  ellipse(ctx, jx, jy - 3, 1, 0.4, '#2a1e16');
  // the fence's near run and a gate
  const [nx0, ny0] = P(x, y, -7, 6), [nx1, ny1] = P(x, y, 1, 6);
  fence(ctx, nx0, ny0, nx1, ny1, 2.6);
}

/** The village đình: a great curved roof on red columns over a stone plinth, a flag pole and an incense urn. */
function dinh(ctx: Ctx, x: number, y: number, roofC: string) {
  ellipse(ctx, x + 1, y + 2, 16, 6, 'rgba(0,0,0,0.18)');
  walls(ctx, x, y + 1, 12, 7, 2, STONE);
  const [pl, pf, pr] = [P(x, y - 1, -12, 7), P(x, y - 1, 12, 7), P(x, y - 1, 12, -7)];
  poly(ctx, [...P(x, y - 1, -12, -7), ...pr, ...pf, ...pl], shade(STONE, 0.15)); // the plinth's top
  void pl;
  walls(ctx, x, y - 1, 10, 5, 6, '#7a4a2a'); // dark timber walls set back behind the columns
  for (let i = 0; i < 6; i++) { // lattice doors
    const [ax, ay] = P(x, y - 1, -10 + i * 4 + 0.8, 5), [bx2, by2] = P(x, y - 1, -10 + i * 4 + 3.2, 5);
    poly(ctx, [ax, ay, bx2, by2, bx2, by2 - 4.6, ax, ay - 4.6], '#5a3418');
    for (const f of [0.3, 0.6]) line(ctx, ax, ay - 4.6 * f, bx2, by2 - 4.6 * f, WOOD_L, 0.35);
  }
  for (let i = 0; i <= 6; i++) { const [cx2, cy2] = P(x, y - 1, -11.4 + i * 3.8, 6.4); line(ctx, cx2, cy2, cx2, cy2 - 6.4, RED_D, 1.4); line(ctx, cx2 - 0.3, cy2, cx2 - 0.3, cy2 - 6.4, RED_L, 0.4); }
  for (let i = 0; i <= 3; i++) { const [cx2, cy2] = P(x, y - 1, 11.4, 6.4 - i * 4.3); line(ctx, cx2, cy2, cx2, cy2 - 6.4, shade(RED_D, -0.2), 1.4); }
  hipRoof(ctx, x, y - 7.4, 11.4, 6.4, 10, roofC, { over: 2.6, lift: 3.4, horns: true, ridge: 3 });
  // a pair of dragons on the ridge, facing a pearl
  const [rx0, ry0] = P(x, y - 17.4, -3, 0), [rx1, ry1] = P(x, y - 17.4, 3, 0);
  for (const [qx, qy, d] of [[rx0, ry0, 1], [rx1, ry1, -1]] as const) curve(ctx, qx, qy, qx + d * 1.6, qy - 2.6, qx + d * 2.6, qy - 0.6, 1, '#4a6a5a');
  ellipse(ctx, x, (ry0 + ry1) / 2 - 1.6, 1.1, 1.1, GOLD);
  // the flag pole of the five-coloured festival flag and a bronze urn
  const [gx, gy] = P(x, y, -15, 10);
  line(ctx, gx, gy, gx, gy - 24, WOOD_D, 0.9);
  poly(ctx, [gx, gy - 24, gx + 8, gy - 22.6, gx + 8, gy - 17.4, gx, gy - 18.6], RED);
  poly(ctx, [gx, gy - 22.6, gx + 8, gy - 21.2, gx + 8, gy - 19.8, gx, gy - 21.2], GOLD);
  const [ux, uy] = P(x, y, 9, 13);
  ellipse(ctx, ux, uy - 1, 2, 1.2, '#4a3a22');
  ellipse(ctx, ux, uy - 2, 1.8, 1.2, '#8a6a32');
  line(ctx, ux, uy - 3, ux + 0.4, uy - 7, 'rgba(200,200,200,0.5)', 0.6); // incense smoke
}

/** The One Pillar Pagoda: a small hall on a single stone pillar, rising like a lotus from a square pond. */
function onePillar(ctx: Ctx, x: number, y: number, roofC: string, s = 1) {
  const pond = 9 * s;
  const [l, f, r, b] = [P(x, y, -pond, pond), P(x, y, pond, pond), P(x, y, pond, -pond), P(x, y, -pond, -pond)];
  poly(ctx, [...b, ...r, ...f, ...l], STONE_D); // the stone kerb
  const inner = pond - 1.2 * s;
  poly(ctx, [...P(x, y + 0.6, -inner, -inner), ...P(x, y + 0.6, inner, -inner), ...P(x, y + 0.6, inner, inner), ...P(x, y + 0.6, -inner, inner)], '#3a8a8a');
  poly(ctx, [...P(x, y + 0.6, -inner, -inner), ...P(x, y + 0.6, inner, -inner), ...P(x, y + 0.6, inner * 0.2, -inner * 0.2), ...P(x, y + 0.6, -inner, inner * 0.2)], '#4aa0a0');
  for (const [u, v, fl] of [[-5, 4, true], [4, 5, false], [5, -3, true], [-4, -5, false], [-6, 0, false], [1, 6.4, true]] as const) { // lotus pads and flowers
    const [px, py] = P(x, y + 0.6, u * s, v * s);
    ellipse(ctx, px, py, 1.5 * s, 0.7 * s, '#3a7a3a');
    ellipse(ctx, px - 0.2 * s, py - 0.1 * s, 1.1 * s, 0.5 * s, '#5aa04a');
    if (fl) { poly(ctx, [px - 0.9 * s, py - 0.4 * s, px, py - 2.4 * s, px + 0.9 * s, py - 0.4 * s], LOTUS); poly(ctx, [px - 0.3 * s, py - 0.5 * s, px, py - 1.8 * s, px + 0.5 * s, py - 0.5 * s], LOTUS_L); }
  }
  // the pillar
  box(ctx, x, y + 0.4, 2.2 * s, 7 * s, STONE, shade(STONE, 0.2));
  // the lotus bracket: struts flaring out to the floor
  const fy = y - 6.6 * s;
  for (const [u, v] of [[-3, 3], [3, 3], [3, -3]] as const) { const [px, py] = P(x, fy, u * s, v * s); line(ctx, x, y - 4 * s, px, py, WOOD_D, 0.8 * s); }
  walls(ctx, x, fy, 3.6 * s, 3.6 * s, 0.9 * s, RED_D);
  // the little hall: red columns and lattice, and a sweeping roof
  walls(ctx, x, fy - 0.9 * s, 2.8 * s, 2.8 * s, 4 * s, '#7a3a24');
  for (const t of [0.2, 0.5, 0.8]) {
    const [ax, ay] = P(x, fy - 0.9 * s, -2.8 * s + 5.6 * s * t, 2.8 * s), [bx2, by2] = P(x, fy - 0.9 * s, 2.8 * s, 2.8 * s - 5.6 * s * t);
    line(ctx, ax, ay, ax, ay - 4 * s, RED_L, 0.5 * s);
    line(ctx, bx2, by2, bx2, by2 - 4 * s, RED, 0.5 * s);
  }
  // a stair up from the kerb
  const [sx, sy] = P(x, y, pond, 0);
  for (let i = 0; i < 4; i++) line(ctx, sx - i * 1.2 * s - 1, sy - i * 1.4 * s - 0.6, sx - i * 1.2 * s + 1.4, sy - i * 1.4 * s + 0.4, STONE, 0.9);
  hipRoof(ctx, x, fy - 4.9 * s, 2.8 * s, 2.8 * s, 4.4 * s, roofC, { over: 1.8 * s, lift: 2.2 * s, horns: true, ridge: 0.8 * s });
  ellipse(ctx, x, fy - 9.6 * s, 0.9 * s, 0.9 * s, GOLD);
}

/** The imperial citadel gate: a broad stone base pierced by three arches, under a red-columned pavilion with two tiers of roof. */
function citadelGate(ctx: Ctx, x: number, y: number, roofC: string) {
  ellipse(ctx, x + 1, y + 3, 26, 8, 'rgba(0,0,0,0.18)');
  const A = 16, B = 6;
  walls(ctx, x, y, A, B, 10, '#a89a86');
  poly(ctx, [...P(x, y - 10, -A, -B), ...P(x, y - 10, A, -B), ...P(x, y - 10, A, B), ...P(x, y - 10, -A, B)], '#c4b8a4');
  // the masonry courses and three arches with dark red doors
  for (let r = 1; r < 5; r++) { const [ax, ay] = P(x, y - r * 2, -A, B), [bx2, by2] = P(x, y - r * 2, A, B); line(ctx, ax, ay, bx2, by2, 'rgba(90,80,64,0.45)', 0.4); }
  for (const u of [-9, 0, 9]) {
    const [px, py] = P(x, y, u, B);
    const hw = u === 0 ? 2.6 : 2, hh = u === 0 ? 7 : 5.6;
    ctx.beginPath();
    ctx.moveTo(px - hw, py - hw / 2);
    ctx.lineTo(px - hw, py - hw / 2 - hh + hw);
    ctx.quadraticCurveTo(px, py - hh - 1.6, px + hw, py + hw / 2 - hh + hw);
    ctx.lineTo(px + hw, py + hw / 2);
    ctx.closePath();
    ctx.fillStyle = ink('#3a1c14');
    ctx.fill();
    line(ctx, px, py - hh + 0.4, px, py, '#5a2a1c', 0.4);
    for (const d of [-1, 1]) ellipse(ctx, px + d * hw * 0.5, py - hh * 0.4 + d * hw * 0.25, 0.3, 0.3, GOLD);
  }
  // the battlements along the front edges
  for (let i = 0; i < 12; i++) { const [px, py] = P(x, y - 10, -A + 1.2 + i * 2.7, B); box(ctx, px, py, 1.4, 1.4, '#b8ac98'); }
  for (let i = 0; i < 4; i++) { const [px, py] = P(x, y - 10, A, B - 1.4 - i * 3); box(ctx, px, py, 1.4, 1.4, '#a89a86'); }
  // the pavilion of the Five Phoenixes: red columns, lattice, and two tiers of sweeping roof
  const py0 = y - 10;
  walls(ctx, x, py0, 10, 3.6, 5, '#8a3a24');
  for (let i = 0; i <= 6; i++) { const [cx2, cy2] = P(x, py0, -10 + i * 3.33, 3.6); line(ctx, cx2, cy2, cx2, cy2 - 5, RED, 1.2); line(ctx, cx2 - 0.3, cy2, cx2 - 0.3, cy2 - 5, RED_L, 0.35); }
  for (let i = 0; i <= 2; i++) { const [cx2, cy2] = P(x, py0, 10, 3.6 - i * 3.6); line(ctx, cx2, cy2, cx2, cy2 - 5, RED_D, 1.2); }
  hipRoof(ctx, x, py0 - 5, 10, 3.6, 3.6, roofC, { over: 2, lift: 2.4, horns: true, ridge: 6 });
  walls(ctx, x, py0 - 7.6, 6.6, 2.4, 3.4, '#8a3a24');
  for (let i = 0; i <= 4; i++) { const [cx2, cy2] = P(x, py0 - 7.6, -6.6 + i * 3.3, 2.4); line(ctx, cx2, cy2, cx2, cy2 - 3.4, RED, 1); }
  hipRoof(ctx, x, py0 - 11, 6.6, 2.4, 5, '#d8a832', { over: 1.8, lift: 2.2, horns: true, ridge: 4 }); // the imperial yellow tiles over the throne room
  ellipse(ctx, x, py0 - 16.6, 1, 1, GOLD_L);
  // banners on the corners of the platform
  for (const [u, v] of [[-A + 1, B - 1], [A - 1, -B + 1], [A - 1, B - 1]] as const) {
    const [px, py] = P(x, y - 10, u, v);
    line(ctx, px, py, px, py - 12, WOOD_D, 0.7);
    poly(ctx, [px, py - 12, px + 5, py - 11, px + 3.4, py - 9.4, px + 5, py - 7.8, px, py - 8.4], u > 0 && v > 0 ? GOLD : RED);
  }
}

function building(ctx: Ctx, x: number, y: number, big: boolean, roofC: string, capital: boolean) {
  if (big && capital) {
    citadelGate(ctx, x, y - 2, roofC);
    onePillar(ctx, x + 20, y + 12, roofC, 0.66);
    return;
  }
  if (big) return dinh(ctx, x, y, roofC);
  const spot: Record<string, number> = { '-10,2': 0, '10,2': 1, '0,8': 3, '-6,-8': 2, '7,-7': 4, '-14,-3': 1, '14,-2': 0 };
  const v = spot[`${Math.round(x)},${Math.round(y)}`] ?? ((Math.round(x) * 7 + Math.round(y) * 3) % 5 + 5) % 5;
  if (v === 0) {
    stiltHouse(ctx, x, y, 0.95, roofC);
    const [fx0, fy0] = P(x, y, -8, 6.4), [fx1, fy1] = P(x, y, 2, 6.4);
    fence(ctx, fx0, fy0, fx1, fy1, 2.4);
  } else if (v === 1) yardHouse(ctx, x, y, roofC);
  else if (v === 2) tower(ctx, x, y, 0.85);
  else if (v === 3) stiltHouse(ctx, x, y, 0.9, roofC, true);
  else {
    stiltHouse(ctx, x, y, 0.8, roofC);
    tree(ctx, x + 8, y + 2, 0.6, { forest: '#2a8a4a' } as BiomePalette, 2);
  }
}

// ---------------------------------------------------------------- trees

/** Bamboo groves, banana plants, areca and coconut palms. */
function tree(ctx: Ctx, x: number, y: number, k: number, Pal: BiomePalette, variant: number) {
  const type = ['bamboo', 'banana', 'areca', 'bamboo', 'banana', 'coconut', 'bamboo', 'areca', 'banana', 'bamboo'][variant % 10];
  const g = Pal.forest ?? '#2a8a4a';
  const leaf = (lx: number, ly: number, ang: number, len: number, wd: number, c: string) => { // a narrow lance-shaped leaf
    const ex = lx + Math.cos(ang) * len, ey = ly + Math.sin(ang) * len;
    const nx = -Math.sin(ang) * wd, ny = Math.cos(ang) * wd;
    poly(ctx, [lx, ly, (lx + ex) / 2 + nx, (ly + ey) / 2 + ny, ex, ey, (lx + ex) / 2 - nx * 0.4, (ly + ey) / 2 - ny * 0.4], c);
  };
  if (type === 'bamboo') {
    // a clump of culms springing from one root, leaning outward, nodes ringed, with sprays of narrow leaves
    const n = 6 + (variant % 3);
    const culm = (i: number) => {
      const t = i / (n - 1) - 0.5, r = rand(variant + 3, i);
      const bx = x + t * 3.4 * k, tx = x + t * 13 * k + (r - 0.5) * 3 * k, ty = y - (19 + r * 5 - Math.abs(t) * 6) * k;
      return { bx, tx, ty, r, t };
    };
    ellipse(ctx, x, y, 4 * k, 1.5 * k, '#5a4a2a');
    for (let i = 0; i < n; i++) { // the culms, far ones darker
      const { bx, tx, ty, r } = culm(i);
      const cx2 = (bx + tx) / 2 - (tx - bx) * 0.25, cy2 = (y + ty) / 2;
      const c = r > 0.5 ? BAMB_L : BAMB;
      curve(ctx, bx, y, cx2, cy2, tx, ty, 1.2 * k, shade(c, -0.3));
      curve(ctx, bx - 0.3 * k, y, cx2 - 0.3 * k, cy2, tx - 0.3 * k, ty, 0.55 * k, c);
      for (let j = 1; j < 5; j++) { // nodes
        const s = j / 5, u = 1 - s, px = u * u * bx + 2 * u * s * cx2 + s * s * tx, py = u * u * y + 2 * u * s * cy2 + s * s * ty;
        line(ctx, px - 0.8 * k, py, px + 0.8 * k, py - 0.2 * k, shade(c, -0.45), 0.4 * k);
      }
    }
    for (let i = 0; i < n; i++) { // leaf sprays along the upper culms
      const { bx, tx, ty } = culm(i);
      const cx2 = (bx + tx) / 2 - (tx - bx) * 0.25, cy2 = (y + ty) / 2;
      for (let j = 0; j < 6; j++) {
        const s = 0.5 + j * 0.1, u = 1 - s, px = u * u * bx + 2 * u * s * cx2 + s * s * tx, py = u * u * y + 2 * u * s * cy2 + s * s * ty;
        const side = j % 2 ? 1 : -1, a = Math.PI / 2 + side * (1.1 + rand(variant, i * 7 + j) * 0.5);
        const c = [shade(g, 0.2), shade(g, -0.05), mix(g, '#a8c84a', 0.4)][(i + j) % 3];
        leaf(px, py, a, (3.4 + rand(variant + 1, i * 7 + j) * 1.6) * k, 0.7 * k, c);
        leaf(px, py, a + side * 0.5, 2.8 * k, 0.6 * k, shade(c, -0.12));
      }
    }
    return;
  }
  if (type === 'banana') {
    // a banana plant: a pale stem of sheathing leaf-stalks, broad arching leaves torn by the wind, a purple bud on a hanging bunch
    const top = y - 10 * k;
    poly(ctx, [x - 1.6 * k, y, x + 1.6 * k, y, x + 1.1 * k, top, x - 1.1 * k, top], '#8aa858');
    poly(ctx, [x + 0.2 * k, y, x + 1.6 * k, y, x + 1.1 * k, top, x + 0.2 * k, top], '#6a8840');
    line(ctx, x - 0.6 * k, y - 1 * k, x - 0.4 * k, top + 1 * k, '#8a6a3a', 0.4 * k);
    const leaves: [number, number, number][] = [[-2.75, 8.6, 1], [-0.35, 8.8, 1], [-2.25, 7.6, 1], [-0.85, 8, 1], [-1.75, 7.4, -1], [-1.3, 6.6, 1]];
    leaves.forEach(([a, len, side], i) => {
      // a long paddle-shaped blade, lit on its upper half, drooping at the tip, with a pale midrib and a split or two
      const L = len * k, bw = 2.1 * k;
      const c = i % 2 ? mix(g, '#9ad04a', 0.45) : mix(g, '#7ac04a', 0.25);
      ctx.save();
      ctx.translate(x, top);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(L * 0.3, -bw * 1.3, L * 0.8, -bw * 1.1 + side * 0.6 * k, L, side * 1.6 * k);
      ctx.bezierCurveTo(L * 0.8, bw * 1.1 + side * 0.6 * k, L * 0.3, bw * 1.3, 0, 0);
      ctx.closePath();
      ctx.fillStyle = ink(shade(c, -0.16));
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(L * 0.3, -bw * 1.3, L * 0.8, -bw * 1.1 + side * 0.6 * k, L, side * 1.6 * k);
      ctx.quadraticCurveTo(L * 0.5, side * 0.6 * k, 0, 0);
      ctx.closePath();
      ctx.fillStyle = ink(c);
      ctx.fill();
      curve(ctx, 0, 0, L * 0.5, side * 0.6 * k, L, side * 1.6 * k, 0.4 * k, mix(c, '#f0f0b0', 0.45));
      for (const t of [0.45, 0.72]) line(ctx, L * t, side * 0.5 * k - bw * 0.2, L * (t + 0.06), -bw * 1.05, mix(Pal.field ?? '#7ad050', '#000000', 0.05), 0.35 * k);
      ctx.restore();
    });
    // the hanging bunch and the purple bud
    curve(ctx, x + 0.6 * k, top + 0.4 * k, x + 3 * k, top + 1 * k, x + 3.2 * k, top + 4.6 * k, 0.6 * k, '#6a8840');
    for (let i = 0; i < 3; i++) ellipse(ctx, x + 2.6 * k, top + (2 + i * 0.9) * k, 1.4 * k, 0.5 * k, '#a8c04a');
    ellipse(ctx, x + 3.3 * k, top + 5.6 * k, 0.9 * k, 1.4 * k, '#7a2a4a');
    ellipse(ctx, x + 3.1 * k, top + 5.2 * k, 0.4 * k, 0.6 * k, '#a84a6a');
    return;
  }
  // palms: the slim ringed areca with its nuts, or a leaning coconut
  const lean = type === 'coconut' ? (variant % 2 ? 1 : -1) * 4 * k : 0.8 * k;
  const h = (type === 'coconut' ? 17 : 21) * k;
  const tx = x + lean, ty = y - h;
  curve(ctx, x, y, x + lean * 0.2, y - h * 0.5, tx, ty, (type === 'coconut' ? 1.7 : 1.2) * k, '#8a7a62');
  curve(ctx, x - 0.3 * k, y, x + lean * 0.2 - 0.3 * k, y - h * 0.5, tx - 0.3 * k, ty, 0.5 * k, '#b0a088');
  for (let i = 1; i < 9; i++) { // the trunk's rings
    const s = i / 9, u = 1 - s, px = u * u * x + 2 * u * s * (x + lean * 0.2) + s * s * tx, py = u * u * y + 2 * u * s * (y - h * 0.5) + s * s * ty;
    line(ctx, px - 0.7 * k, py, px + 0.7 * k, py - 0.2 * k, '#5a4a3a', 0.35 * k);
  }
  if (type === 'areca') { ellipse(ctx, tx, ty + 1.4 * k, 0.9 * k, 1.4 * k, '#7a9a4a'); } // the green crownshaft
  const n = type === 'coconut' ? 8 : 7;
  for (let i = 0; i < n; i++) { // feathered fronds arching out and drooping
    const a = -Math.PI / 2 + (i - (n - 1) / 2) * (type === 'coconut' ? 0.48 : 0.42) + (i % 2 ? 0.08 : 0);
    const len = (type === 'coconut' ? 9 : 7.4) * k;
    const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * 0.55 + 3.2 * k * Math.abs(Math.cos(a));
    const mx = tx + Math.cos(a) * len * 0.5, my = ty + Math.sin(a) * len * 0.5 - 1.4 * k;
    const c = i % 2 ? shade(g, 0.1) : mix(g, '#6ab04a', 0.3);
    curve(ctx, tx, ty, mx, my, ex, ey, 0.5 * k, shade(c, -0.3));
    for (let j = 1; j < 7; j++) { // leaflets hanging from the rachis
      const s = j / 7, u = 1 - s, px = u * u * tx + 2 * u * s * mx + s * s * ex, py = u * u * ty + 2 * u * s * my + s * s * ey;
      const ll = (2.4 - s) * k;
      line(ctx, px, py, px - Math.sin(a) * ll * 0.5, py + ll, c, 0.5 * k);
      line(ctx, px, py, px + Math.sin(a) * ll * 0.5, py + ll * 0.8, shade(c, -0.15), 0.45 * k);
    }
  }
  if (type === 'coconut') for (const [dx, dy] of [[-0.8, 1], [0.8, 1.2], [0, 1.8]] as const) { ellipse(ctx, tx + dx * k, ty + dy * k, 1 * k, 0.9 * k, '#6a5a2a'); ellipse(ctx, tx + dx * k - 0.3 * k, ty + dy * k - 0.3 * k, 0.4 * k, 0.3 * k, '#9a8a4a'); }
  else for (let i = 0; i < 6; i++) ellipse(ctx, tx + (i % 3 - 1) * 0.7 * k, ty + (2.2 + Math.floor(i / 3) * 0.8) * k, 0.45 * k, 0.45 * k, i % 2 ? '#e8902a' : '#c8701a'); // areca nuts
}

// ---------------------------------------------------------------- registration

registerArt('vietnam', {
  unit(ctx, kind, x, y) {
    switch (kind) {
      case 'rattan': case 'warrior': case 'archer': case 'defender': case 'swordsman': case 'explorer':
        footUnit(ctx, kind, x, y, 1);
        return true;
      case 'giant': footUnit(ctx, kind, x, y, 1.4); return true;
      case 'rider': rider(ctx, x, y); return true;
      case 'knight': elephant(ctx, x, y); return true;
      case 'catapult': trebuchet(ctx, x, y); return true;
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

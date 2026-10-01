// France (the Kingdom of France): royal-blue surcoats and tabards sown with gold fleurs-de-lis; plate armour for the
// knights and men-at-arms under plumed bascinets; blue coats with white facings for the line; the Royal Guard in the
// musketeer's blue cassock with its white cross, a feathered cavalier hat and a halberd; a Genoese-style crossbowman with
// his pavise; heater shields azure with gold lilies; chevaliers on horses caparisoned in blue and gold; a trebuchet; a
// river barge, a carrack and a tall gilded galleon in royal blue; slate-roofed limestone houses with tall chimneys,
// half-timbered Normandy houses, a parish church with a slate spire, and for the capital a château with conical turret
// roofs beside a Gothic cathedral façade with its rose window; plane trees, rows of poplars, lavender and vines.
import { registerArt, type Body } from '../tribeart';
import { drawHorse, figure } from '../units';
import type { BiomePalette } from '../../data/tribes';
import type { UnitKind } from '../../game/types';
import { band, box, ellipse, faceQuad, ink, line, mix, poly, rand, roof, shade, type Ctx } from '../prims';

const BLUE = '#2a48c0';
const BLUE_L = '#4a6ae0';
const BLUE_D = '#14246a';
const GOLD = '#e6bc3e';
const GOLD_L = '#f8e08a';
const GOLD_D = '#9a7418';
const WHITE = '#f6f4ee';
const STEEL = '#c4cad4';
const STEEL_L = '#eef2f8';
const STEEL_D = '#6a7280';
const RED = '#c0262e';
const WOOD = '#7a5230';
const WOOD_D = '#4a3018';
const STONE = '#e6dcc2'; // pale limestone of the Loire
const STONE_D = '#c8bc9e';
const TIMBER = '#4a3020';
const PLASTER = '#f3ecdc';
const HAIR = '#3a2616';
const BRONZE = '#c8903a';

// ---------------------------------------------------------------- small helpers

function curve(ctx: Ctx, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, w: number, c: string) {
  ctx.strokeStyle = ink(c);
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx, cy, x1, y1);
  ctx.stroke();
}

function ring(ctx: Ctx, x: number, y: number, rx: number, ry: number, c: string, w: number) {
  ctx.strokeStyle = ink(c);
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
}

/** A fleur-de-lis about 5·s tall centred on (x, y): a tall middle petal, two petals curling out, a band and a foot. */
export function fleur(ctx: Ctx, x: number, y: number, s: number, c = GOLD) {
  poly(ctx, [x, y - 2.8 * s, x + 0.75 * s, y - 1.3 * s, x + 0.45 * s, y - 0.1 * s, x - 0.45 * s, y - 0.1 * s, x - 0.75 * s, y - 1.3 * s], c);
  for (const d of [-1, 1]) {
    poly(ctx, [x + d * 0.35 * s, y - 0.1 * s, x + d * 1.3 * s, y - 1.6 * s, x + d * 2.2 * s, y - 1.2 * s, x + d * 2 * s, y - 0.1 * s, x + d * 1.4 * s, y + 0.5 * s], c);
    poly(ctx, [x + d * 0.35 * s, y + 0.6 * s, x + d * 1.2 * s, y + 1.4 * s, x + d * 1.1 * s, y + 2 * s, x + d * 0.3 * s, y + 1.1 * s], c);
  }
  poly(ctx, [x - 1.2 * s, y + 0.05 * s, x + 1.2 * s, y + 0.05 * s, x + 1.2 * s, y + 0.65 * s, x - 1.2 * s, y + 0.65 * s], shade(c, -0.12));
  poly(ctx, [x - 0.35 * s, y + 0.6 * s, x + 0.35 * s, y + 0.6 * s, x, y + 2.2 * s], c);
}

/** A point on the R (front-right) or L (front-left) face of a box() at (u, v). */
const faceAt = (f: 'L' | 'R', cx: number, cy: number, w: number, h: number, u: number, v: number): [number, number] => f === 'R'
  ? [cx + (u * w) / 2, cy + (w / 4) * (1 - u) - v * h]
  : [cx - w / 2 + (u * w) / 2, cy + (w / 4) * u - v * h];

/** A swallow-tailed pennon or a square banner of France: azure with gold lilies, streaming right from (x, y). */
function banner(ctx: Ctx, x: number, y: number, w: number, h: number, look: 'royal' | 'pennon' | 'white', wave = 0) {
  const pts = look === 'pennon'
    ? [x, y, x + w * 0.5, y + 0.6 + wave, x + w, y + h * 0.2, x + w * 0.62, y + h * 0.5, x + w, y + h * 0.8, x + w * 0.5, y + h + 0.4 - wave, x, y + h]
    : [x, y, x + w * 0.5, y + 0.8 + wave, x + w, y + 0.2, x + w, y + h, x + w * 0.5, y + h + 0.6 - wave, x, y + h];
  const field = look === 'white' ? WHITE : BLUE;
  poly(ctx, pts, field);
  poly(ctx, [x, y, x + w * 0.5, y + 0.8 + wave, x + w * 0.9, y + 0.3, x + w * 0.9, y + h * 0.3, x, y + h * 0.32], shade(field, 0.12));
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.clip();
  const s = h * 0.17;
  if (look === 'pennon') fleur(ctx, x + w * 0.3, y + h * 0.5, s, GOLD);
  else for (const [u, v] of [[0.28, 0.32], [0.72, 0.34], [0.5, 0.72]] as const) fleur(ctx, x + w * u, y + h * v + wave * 0.4, s, look === 'white' ? GOLD_D : GOLD);
  ctx.restore();
}

// ---------------------------------------------------------------- dress

const PLATED = (k: UnitKind) => k === 'defender' || k === 'knight' || k === 'giant' || k === 'rider';

function dress(kind: UnitKind): [string, string, string] | null {
  switch (kind) {
    case 'warrior': return [BLUE, '#3a3040', BLUE_D];
    case 'archer': return ['#e8e2d0', '#3a3040', BLUE];
    case 'rider': return [STEEL, '#3a3040', STEEL];
    case 'defender': return [STEEL, STEEL_D, STEEL];
    case 'swordsman': return [BLUE, WHITE, BLUE];
    case 'knight': return [STEEL, STEEL_D, STEEL];
    case 'garde': return [BLUE, '#2a2430', RED];
    case 'giant': return [STEEL, BLUE_D, BLUE];
    case 'explorer': return ['#6a5040', '#4a3a2c', '#6a5040'];
    default: return [BLUE, '#3a3040', BLUE];
  }
}

/** A blue surcoat (or tabard) over the chest, sown with a gold fleur-de-lis, with a gold hem and a belt. */
function surcoat(ctx: Ctx, x: number, y: number, w: number, h: number, k: number, full: boolean) {
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const L = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'L', x, y, w, h, u0, u1, v0, v1, c);
  const u0 = full ? 0 : 0.14, u1 = full ? 1 : 0.86;
  R(u0, u1, -0.36, 0.96, BLUE); // the skirt hangs below the waist
  L(full ? 0 : 0.3, 1, -0.36, 0.96, BLUE);
  R(u0, u1, -0.36, -0.28, GOLD); // a gold hem
  L(full ? 0 : 0.3, 1, -0.36, -0.28, GOLD_D);
  R(0.48, 0.52, -0.36, 0.1, BLUE_D); // the split in the skirt
  band(ctx, x, y, w, h, 0.12, 0.2, '#3a2418'); // the belt
  R(0.42, 0.56, 0.11, 0.21, GOLD);
  const [fx, fy] = faceAt('R', x, y, w, h, 0.5, 0.58);
  fleur(ctx, fx, fy, 0.95 * k, GOLD);
  const [gx, gy] = faceAt('L', x, y, w, h, 0.62, 0.58);
  fleur(ctx, gx, gy, 0.7 * k, GOLD_D);
}

/** Plate: a steel breast with a lit ridge, pauldrons and fauld lames below the waist. */
function plate(ctx: Ctx, x: number, y: number, w: number, h: number) {
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const L = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'L', x, y, w, h, u0, u1, v0, v1, c);
  for (let i = 0; i < 3; i++) { R(0.02, 0.98, -0.1 - i * 0.1, 0 - i * 0.1, shade(STEEL, -0.06 * i)); L(0.02, 0.98, -0.1 - i * 0.1, 0 - i * 0.1, shade(STEEL, -0.06 * i - 0.1)); R(0.02, 0.98, -0.1 - i * 0.1, -0.08 - i * 0.1, STEEL_D); }
  R(0.1, 0.46, 0.2, 0.86, shade(STEEL, 0.22));
  R(0.47, 0.53, 0.1, 0.9, STEEL_L);
  R(0.53, 0.57, 0.1, 0.9, shade(STEEL, -0.25));
  L(0.2, 0.7, 0.4, 0.8, shade(STEEL, 0.12));
  band(ctx, x, y, w, h, 0.9, 1, STEEL_D);
}

function torso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const k = w / 10;
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const L = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'L', x, y, w, h, u0, u1, v0, v1, c);
  switch (kind) {
    case 'warrior': // a padded blue surcoat with a mail collar
      surcoat(ctx, x, y, w, h, k, true);
      band(ctx, x, y, w, h, 0.86, 1, '#9aa2ae');
      for (let i = 0; i < 6; i++) R(i / 6 + 0.02, i / 6 + 0.1, 0.9, 0.96, '#6a7280');
      return;
    case 'archer': { // a quilted white-and-blue jack, the crossbowman's
      R(0, 1, -0.3, 0.96, '#e8e2d0');
      L(0, 1, -0.3, 0.96, '#d8d0bc');
      R(0, 0.5, -0.3, 0.96, BLUE); // parti-coloured, blue and white
      for (let i = 1; i < 6; i++) { R(0, 1, i / 6 - 0.02, i / 6, 'rgba(0,0,0,0.18)'); L(0, 1, i / 6 - 0.02, i / 6, 'rgba(0,0,0,0.15)'); } // quilting
      band(ctx, x, y, w, h, 0.12, 0.2, '#5a3a1e');
      line(ctx, ...faceAt('R', x, y, w, h, 0.02, 0.94), ...faceAt('R', x, y, w, h, 0.9, 0.16), '#5a3a1e', 0.9 * k); // the baldric for the bolt case
      return;
    }
    case 'swordsman': { // a blue coat with white facings, white turnbacks, gold buttons and a white cross-belt
      R(0, 1, -0.4, 0.96, BLUE);
      L(0, 1, -0.4, 0.96, BLUE);
      R(0.36, 0.64, 0.1, 0.96, WHITE); // the white waistcoat
      R(0.24, 0.36, 0.3, 0.96, WHITE); // lapels
      R(0.64, 0.76, 0.3, 0.96, WHITE);
      R(0.02, 0.2, -0.4, -0.1, WHITE); // turnbacks
      R(0.8, 0.98, -0.4, -0.1, WHITE);
      for (let i = 0; i < 4; i++) { R(0.28, 0.33, 0.36 + i * 0.16, 0.42 + i * 0.16, GOLD); R(0.67, 0.72, 0.36 + i * 0.16, 0.42 + i * 0.16, GOLD); }
      R(0.3, 0.7, 0.9, 1, RED); // a red collar
      for (let i = 0; i < 6; i++) { const t = i / 6; R(0.04 + t * 0.86, 0.16 + t * 0.86, 0.9 - t * 0.8 - 0.1, 0.9 - t * 0.8, WHITE); } // cross-belt
      return;
    }
    case 'garde': { // the musketeer's cassock: blue, a white cross with lilies at its ends, silver-edged
      R(0, 1, -0.38, 0.96, BLUE);
      L(0, 1, -0.38, 0.96, BLUE);
      R(0, 1, -0.38, -0.3, WHITE);
      L(0, 1, -0.38, -0.3, '#d8d8e0');
      R(0.43, 0.57, -0.2, 0.86, WHITE); // the cross
      R(0.12, 0.88, 0.42, 0.56, WHITE);
      L(0.2, 0.84, 0.42, 0.56, '#dcdce4');
      for (const [u, v] of [[0.5, 0.92], [0.08, 0.49], [0.92, 0.49]] as const) { const [px, py] = faceAt('R', x, y, w, h, u, v); fleur(ctx, px, py + 0.8 * k, 0.42 * k, GOLD); }
      band(ctx, x, y, w, h, 0.1, 0.16, '#2a1a10');
      return;
    }
    case 'giant': // the king: plate under a blue mantle sown with lilies, an ermine collar
      plate(ctx, x, y, w, h);
      surcoat(ctx, x, y, w, h, k, false);
      for (const [u, v] of [[0.24, 0.28], [0.76, 0.28], [0.26, 0.82], [0.74, 0.82]] as const) { const [px, py] = faceAt('R', x, y, w, h, u, v); fleur(ctx, px, py, 0.45 * k, GOLD); }
      band(ctx, x, y, w, h, 0.86, 1, WHITE); // ermine
      for (const u of [0.15, 0.4, 0.65, 0.9]) R(u, u + 0.04, 0.9, 0.97, '#1a1a1a');
      return;
    case 'explorer': // a buff leather jerkin with a blue sash
      band(ctx, x, y, w, h, 0.3, 0.42, BLUE);
      for (let i = 0; i < 4; i++) R(0.48, 0.53, 0.5 + i * 0.12, 0.55 + i * 0.12, GOLD_D);
      return;
    default:
      if (PLATED(kind)) {
        plate(ctx, x, y, w, h);
        surcoat(ctx, x, y, w, h, k, kind === 'defender');
        return;
      }
      surcoat(ctx, x, y, w, h, k, true);
  }
}

/** A trim moustache, and a pointed royale beard on the cavaliers. */
function face(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  if (kind === 'garde' || kind === 'swordsman' || kind === 'explorer' || kind === 'giant') {
    R(0.26, 0.46, 0.2, 0.25, HAIR);
    R(0.54, 0.74, 0.2, 0.25, HAIR);
    R(0.45, 0.55, -0.1, 0.12, HAIR); // the royale
    if (kind === 'giant') R(0.3, 0.7, -0.04, 0.12, HAIR);
    faceQuad(ctx, 'L', x, y, w, h, 0.7, 1, -0.2, 0.7, HAIR); // long cavalier hair falling to the shoulder
  } else if (kind === 'warrior' || kind === 'archer') {
    R(0.3, 0.7, 0.2, 0.24, HAIR);
  }
}

// ---------------------------------------------------------------- headgear

/** A bascinet: a steel skull rising to a point at the back, a mail aventail, a pig-faced visor or open, and a plume. */
function bascinet(ctx: Ctx, x: number, top: number, k: number, hw: number, visor: boolean, plume: string | null, big = false) {
  const by = top + 2.4 * k, r = hw / 2 + 0.6 * k, peak = (big ? 10.4 : 9.4) * k;
  // the aventail: mail hanging at the cheeks and the nape, framing the face
  for (const [a, b] of [[x - r - 0.5 * k, x - r + 2.6 * k], [x + r - 1.4 * k, x + r + 0.5 * k]] as const) {
    poly(ctx, [a, by - 0.4 * k, b, by - 0.4 * k, b + 0.3 * k, by + 6.4 * k, a - 0.3 * k, by + 6.4 * k], '#8a929e');
    for (let i = 0; i < 4; i++) line(ctx, a, by + (1 + i * 1.4) * k, b, by + (1 + i * 1.4) * k, '#5a6270', 0.35 * k);
  }
  // the skull, rising to a point swept back
  const sk = [x - r, by, x - r, by - peak * 0.4, x - r * 0.62, by - peak * 0.78, x - r * 0.18, by - peak, x + r * 0.3, by - peak * 0.82, x + r * 0.84, by - peak * 0.44, x + r, by];
  poly(ctx, sk, STEEL);
  poly(ctx, [x + 0.6 * k, by, x + r * 0.1, by - peak * 0.94, x + r * 0.4, by - peak * 0.86, x + r * 0.9, by - peak * 0.5, x + r, by], shade(STEEL, -0.24));
  line(ctx, x - r * 0.62, by - peak * 0.3, x - r * 0.4, by - peak * 0.8, STEEL_L, 0.7 * k);
  if (visor) { // a pointed "hounskull" visor with sights and breaths
    poly(ctx, [x - r * 0.9, by - peak * 0.42, x + r * 0.9, by - peak * 0.42, x + r * 1.3, by - 0.6 * k, x + r * 0.2, by + 2.2 * k, x - r * 0.9, by + 0.6 * k], shade(STEEL, 0.08));
    poly(ctx, [x + r * 0.2, by - peak * 0.42, x + r * 0.9, by - peak * 0.42, x + r * 1.3, by - 0.6 * k, x + r * 0.2, by + 2.2 * k], shade(STEEL, -0.18));
    line(ctx, x - r * 0.8, by - peak * 0.3, x + r * 1.0, by - peak * 0.3, '#1a1c22', 0.7 * k); // the sight
    for (const d of [-0.4, 0, 0.4]) ellipse(ctx, x + r * (0.5 + d * 0.5), by - 0.2 * k + d * k, 0.3 * k, 0.3 * k, '#1a1c22'); // breaths
  }
  ellipse(ctx, x - r * 0.6, by - 0.4 * k, 0.4 * k, 0.4 * k, GOLD_L);
  ellipse(ctx, x + r * 0.6, by - 0.4 * k, 0.4 * k, 0.4 * k, GOLD_L);
  if (plume) { // a tall plume from a gilt holder at the crown, curling back
    const px = x - r * 0.2, py = by - peak;
    line(ctx, px, py + 0.8 * k, px, py - 1.2 * k, GOLD, 0.9 * k);
    const n = big ? 5 : 3;
    for (let i = 0; i < n; i++) curve(ctx, px, py - 1 * k, px - (2 + i * 0.8) * k, py - (big ? 9 : 7) * k + i * 0.6 * k, px - (6 + i * 1.2) * k, py - (2 - i * 1.2) * k, (1.6 - i * 0.12) * k, i % 2 ? shade(plume, -0.16) : plume);
  }
}

/** A chapel-de-fer (kettle hat): a round steel bowl with a broad sloping brim. */
function kettleHat(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const by = top + 2.4 * k, rx = hw / 2 + 3 * k;
  ellipse(ctx, x + 0.4 * k, by + 0.7 * k, rx, 2.4 * k, STEEL_D);
  ellipse(ctx, x, by, rx, 2.3 * k, STEEL);
  ring(ctx, x, by, rx, 2.3 * k, STEEL_D, 0.4 * k);
  ctx.beginPath();
  ctx.ellipse(x, by - 0.6 * k, hw / 2 + 0.4 * k, 5.4 * k, 0, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = ink(STEEL);
  ctx.fill();
  ellipse(ctx, x + hw * 0.24, by - 2.6 * k, hw * 0.18, 2.6 * k, shade(STEEL, -0.2));
  line(ctx, x - hw * 0.26, by - 1 * k, x - hw * 0.1, by - 4.6 * k, STEEL_L, 0.7 * k);
  line(ctx, x, by - 6 * k, x, by - 0.6 * k, shade(STEEL, -0.35), 0.4 * k); // the comb seam
  line(ctx, x - hw / 2, by - 0.6 * k, x + hw / 2, by - 0.6 * k, BLUE, 0.9 * k); // a blue-painted band
}

/** A cavalier's broad-brimmed felt hat, cocked up on one side, with great curling ostrich plumes. */
function cavalierHat(ctx: Ctx, x: number, top: number, k: number, hw: number, felt: string, plumes: string[]) {
  const by = top + 2.2 * k, rx = hw / 2 + 4 * k;
  // the brim, cocked up on the left
  ellipse(ctx, x + 0.4 * k, by + 0.8 * k, rx, 2.8 * k, shade(felt, -0.35));
  ellipse(ctx, x, by, rx, 2.7 * k, felt);
  ctx.beginPath(); // the brim turned up against the crown on the left
  ctx.ellipse(x - rx * 0.5, by - 0.6 * k, rx * 0.56, 4.4 * k, -0.35, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = ink(shade(felt, 0.14));
  ctx.fill();
  // the crown
  const cw = hw / 2 + 0.4 * k;
  poly(ctx, [x - cw, by, x - cw * 0.86, by - 4.6 * k, x + cw * 0.86, by - 4.6 * k, x + cw, by], felt);
  poly(ctx, [x + 0.4 * k, by + 0.6 * k, x + 0.4 * k, by - 4.6 * k, x + cw * 0.86, by - 4.6 * k, x + cw, by], shade(felt, -0.22));
  ellipse(ctx, x, by - 4.6 * k, cw * 0.86, 1.4 * k, shade(felt, 0.1));
  poly(ctx, [x - cw, by, x - cw * 0.96, by - 1.4 * k, x + cw * 0.96, by - 1.4 * k, x + cw, by], GOLD); // a gold hatband
  ellipse(ctx, x - cw * 0.6, by - 1 * k, 0.9 * k, 0.9 * k, GOLD_L); // the brooch holding the plumes
  // the plumes: sweeping back from the cocked side, curling over the brim
  plumes.forEach((c, i) => {
    const x0 = x - cw * 0.6, y0 = by - 1.2 * k, qx = x - (1 + i * 1.4) * k, qy = by - (12 - i * 1.8) * k, x1 = x + rx + (1.4 - i * 1.4) * k, y1 = by - (2.4 - i * 0.8) * k;
    curve(ctx, x0, y0, qx, qy, x1, y1, (3 - i * 0.5) * k, shade(c, -0.18));
    curve(ctx, x0, y0 - 0.4 * k, qx, qy - 0.4 * k, x1, y1 - 0.4 * k, (2.2 - i * 0.4) * k, c);
    for (let j = 1; j < 6; j++) { // the fronds of the ostrich feather
      const t = j / 6, u = 1 - t, px = u * u * x0 + 2 * u * t * qx + t * t * x1, py = u * u * y0 + 2 * u * t * qy + t * t * y1;
      line(ctx, px, py, px + 0.6 * k, py + 1.6 * k, shade(c, -0.1), 0.5 * k);
    }
    ellipse(ctx, x1, y1 + 0.6 * k, 1.1 * k, 1.1 * k, c); // the curling tip
  });
}

/** The crown of France: a gold circlet of fleurons (lilies), gems, over a blue velvet cap. */
function crown(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const by = top + 2.4 * k, rx = hw / 2 + 0.8 * k;
  ellipse(ctx, x, by - 2.4 * k, rx * 0.86, 3.4 * k, BLUE);
  poly(ctx, [x - rx, by + 0.6 * k, x + rx, by + 0.6 * k, x + rx, by - 2.6 * k, x - rx, by - 2.6 * k], GOLD);
  poly(ctx, [x + 0.4 * k, by + 0.6 * k, x + rx, by + 0.6 * k, x + rx, by - 2.6 * k, x + 0.4 * k, by - 2.6 * k], shade(GOLD, -0.18));
  line(ctx, x - rx, by - 2.5 * k, x + rx, by - 2.5 * k, GOLD_L, 0.5 * k);
  for (let i = 0; i < 4; i++) fleur(ctx, x - rx * 0.78 + (i / 3) * rx * 1.56, by - 4.6 * k, 0.9 * k, i > 1 ? shade(GOLD, -0.1) : GOLD);
  for (const [d, c] of [[-0.55, RED], [0, BLUE_L], [0.55, '#2a9a5a']] as const) ellipse(ctx, x + d * rx, by - 1 * k, 0.7 * k, 0.8 * k, c);
}

function head(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  switch (kind) {
    case 'warrior': bascinet(ctx, x, top, k, hw, false, null); return;
    case 'archer': kettleHat(ctx, x, top, k, hw); return;
    case 'rider': bascinet(ctx, x, top, k, hw, false, WHITE); return;
    case 'defender': bascinet(ctx, x, top, k, hw, true, BLUE_L); return;
    case 'knight': bascinet(ctx, x, top, k, hw, true, WHITE, true); return;
    case 'swordsman': cavalierHat(ctx, x, top, k, hw, '#1e1c28', [WHITE, BLUE_L]); return;
    case 'garde': cavalierHat(ctx, x, top, k, hw, '#1e1c28', [WHITE, RED, BLUE_L]); return;
    case 'explorer': cavalierHat(ctx, x, top, k, hw, '#5a4030', [WHITE]); return;
    case 'giant': crown(ctx, x, top, k, hw); return;
    default: return;
  }
}

// ---------------------------------------------------------------- weapons and shields

/** A heater shield: a flat top, sides curving to a point; azure with gold lilies, a gold rim. */
function heater(ctx: Ctx, x: number, y: number, s: number, lilies: 1 | 3) {
  const w = 5 * s, h = 7 * s;
  const path = (ox: number, oy: number) => {
    ctx.beginPath();
    ctx.moveTo(x - w + ox, y - h * 0.5 + oy);
    ctx.lineTo(x + w + ox, y - h * 0.5 + oy);
    ctx.quadraticCurveTo(x + w + ox, y + h * 0.3 + oy, x + ox, y + h * 0.62 + oy);
    ctx.quadraticCurveTo(x - w + ox, y + h * 0.3 + oy, x - w + ox, y - h * 0.5 + oy);
    ctx.closePath();
  };
  path(0.9 * s, 0.5 * s);
  ctx.fillStyle = ink(GOLD_D);
  ctx.fill();
  path(0, 0);
  ctx.fillStyle = ink(BLUE);
  ctx.fill();
  ctx.save();
  path(0, 0);
  ctx.clip();
  ellipse(ctx, x - w * 0.5, y - h * 0.2, w * 0.7, h * 0.6, shade(BLUE, 0.12));
  ctx.restore();
  ctx.strokeStyle = ink(GOLD);
  ctx.lineWidth = 0.8 * s;
  path(0, 0);
  ctx.stroke();
  if (lilies === 3) for (const [dx, dy] of [[-0.48, -0.18], [0.48, -0.18], [0, 0.26]] as const) fleur(ctx, x + dx * w, y + dy * h, 0.62 * s, GOLD);
  else fleur(ctx, x, y - 0.02 * h, 1.05 * s, GOLD);
}

/** A halberd: an ash staff, an axe blade, a back spike and a top spike, with a blue-and-gold tassel. */
function halberd(ctx: Ctx, x: number, y: number, k: number, len = 34) {
  const x0 = x - 2 * k, y0 = y + 8 * k, x1 = x + 3 * k, y1 = y - (len - 8) * k;
  line(ctx, x0, y0, x1, y1, WOOD, 1.1 * k);
  line(ctx, x0 - 0.3 * k, y0, x1 - 0.3 * k, y1, shade(WOOD, 0.35), 0.35 * k);
  poly(ctx, [x1, y1 - 7 * k, x1 + 0.7 * k, y1 - 0.4 * k, x1 - 0.5 * k, y1 - 0.4 * k], STEEL_L); // top spike
  poly(ctx, [x1 + 0.2 * k, y1 + 0.4 * k, x1 + 5 * k, y1 - 1 * k, x1 + 5.6 * k, y1 + 2.8 * k, x1 + 4.6 * k, y1 + 5 * k, x1 + 0.1 * k, y1 + 3.6 * k], STEEL); // the axe blade
  poly(ctx, [x1 + 4.4 * k, y1 - 0.8 * k, x1 + 5 * k, y1 - 1 * k, x1 + 5.6 * k, y1 + 2.8 * k, x1 + 4.6 * k, y1 + 5 * k], STEEL_D);
  poly(ctx, [x1 - 0.2 * k, y1 + 1 * k, x1 - 4 * k, y1 + 2.6 * k, x1 - 0.3 * k, y1 + 2.8 * k], STEEL_D); // back spike
  line(ctx, x1 - 0.2 * k, y1 + 4.4 * k, x1 + 0.3 * k, y1 + 5.2 * k, GOLD, 1.2 * k);
  curve(ctx, x1, y1 + 5 * k, x1 - 1.4 * k, y1 + 6.4 * k, x1 - 0.8 * k, y1 + 8.6 * k, 1 * k, BLUE);
}

/** A rapier with a gilt swept hilt. */
function rapier(ctx: Ctx, x: number, y: number, k: number, len = 16) {
  const tx = x + len * 0.3 * k, ty = y - len * k;
  poly(ctx, [x - 0.6 * k, y - 1.6 * k, tx - 0.15 * k, ty + 1 * k, tx + 0.1 * k, ty - 0.4 * k, x + 0.6 * k, y - 1.8 * k], STEEL_L);
  line(ctx, x + 0.2 * k, y - 2 * k, tx, ty + 1 * k, STEEL_D, 0.3 * k);
  line(ctx, x - 2.8 * k, y - 1.2 * k, x + 2.8 * k, y - 2.2 * k, GOLD_D, 0.8 * k);
  ctx.strokeStyle = ink(GOLD);
  ctx.lineWidth = 0.7 * k;
  ctx.beginPath();
  ctx.ellipse(x + 0.2 * k, y - 1.2 * k, 2 * k, 1.3 * k, -0.25, 0, Math.PI);
  ctx.stroke();
  curve(ctx, x + 2.4 * k, y - 2.1 * k, x + 3.4 * k, y + 1.6 * k, x - 0.6 * k, y + 3 * k, 0.6 * k, GOLD);
  line(ctx, x, y - 1.6 * k, x - 0.4 * k, y + 2.2 * k, '#2a1a12', 1.3 * k);
  ellipse(ctx, x - 0.5 * k, y + 2.8 * k, 1 * k, 1 * k, GOLD);
}

/** A broad arming sword (or the king's great sword). */
function sword(ctx: Ctx, x: number, y: number, k: number, len = 15) {
  const tx = x + len * 0.26 * k, ty = y - len * k;
  poly(ctx, [x - 1.2 * k, y - 1.6 * k, tx - 0.4 * k, ty + 1.6 * k, tx, ty, tx + 0.5 * k, ty + 1.6 * k, x + 1.2 * k, y - 2 * k], STEEL_L);
  poly(ctx, [x + 0.1 * k, y - 1.8 * k, tx, ty, tx + 0.5 * k, ty + 1.6 * k, x + 1.2 * k, y - 2 * k], '#9aa2ac');
  line(ctx, x - 3.4 * k, y - 1 * k, x + 3.4 * k, y - 2.6 * k, GOLD, 1 * k);
  line(ctx, x, y - 1.6 * k, x - 0.4 * k, y + 2.4 * k, BLUE_D, 1.4 * k);
  ellipse(ctx, x - 0.5 * k, y + 2.9 * k, 1.1 * k, 1.1 * k, GOLD);
}

/** A lance with a vamplate and a pennon of France. */
function lance(ctx: Ctx, x: number, y: number, len: number, look: 'pennon' | 'royal') {
  const x0 = x - 3, y0 = y + 8, x1 = x + 5, y1 = y - len;
  // painted in blue-and-white spirals
  line(ctx, x0, y0, x1, y1, WHITE, 1.4);
  for (let i = 0; i < 8; i++) { const t0 = i / 8 + 0.02, t1 = t0 + 0.06; line(ctx, x0 + (x1 - x0) * t0, y0 + (y1 - y0) * t0, x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1, BLUE, 1.5); }
  poly(ctx, [x1 + 0.6, y1 - 5, x1 - 0.8, y1 - 0.4, x1 + 0.2, y1 + 0.8, x1 + 1.4, y1 - 0.2], STEEL_L);
  poly(ctx, [x1 + 0.6, y1 - 5, x1 + 1.4, y1 - 0.2, x1 + 0.2, y1 + 0.8], STEEL_D);
  ctx.beginPath(); // the vamplate guarding the hand
  ctx.ellipse(x - 0.2, y + 0.6, 2.2, 1.6, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = ink(STEEL);
  ctx.fill();
  banner(ctx, x1 - 0.3, y1 + 1.4, look === 'royal' ? 10 : 11, look === 'royal' ? 7.4 : 5.6, look, 0.7);
}

/** A crossbow held across the body: a tiller, a steel bow and a stirrup at the nose. */
function crossbow(ctx: Ctx, x: number, y: number, k: number) {
  const bx = x - 5 * k, by = y + 2 * k, nx = x + 7 * k, ny = y - 9 * k;
  line(ctx, bx, by, nx, ny, '#6a3c1c', 1.6 * k); // the tiller
  line(ctx, bx, by - 0.5 * k, nx, ny - 0.5 * k, '#9a6430', 0.5 * k);
  // the steel prod, bowed across the nose
  const px = nx - 1.4 * k, py = ny + 1.4 * k;
  curve(ctx, px - 6 * k, py - 4.4 * k, px + 1.4 * k, py - 1.6 * k, px + 5.4 * k, py + 5 * k, 1.1 * k, STEEL);
  curve(ctx, px - 6 * k, py - 4.4 * k, px + 1.4 * k, py - 1.6 * k, px + 5.4 * k, py + 5 * k, 0.35 * k, STEEL_L);
  // the string drawn back to the nut, and a bolt
  line(ctx, px - 6 * k, py - 4.4 * k, x + 0.6 * k, y - 3.4 * k, '#e8dcc0', 0.4 * k);
  line(ctx, px + 5.4 * k, py + 5 * k, x + 0.6 * k, y - 3.4 * k, '#e8dcc0', 0.4 * k);
  line(ctx, x + 0.6 * k, y - 3.4 * k, nx + 1 * k, ny - 1 * k, '#5a3a1e', 0.6 * k);
  poly(ctx, [nx + 1 * k, ny - 1 * k, nx + 2.6 * k, ny - 2.6 * k, nx + 1.6 * k, ny - 0.4 * k], STEEL_D);
  ellipse(ctx, x + 0.6 * k, y - 3.4 * k, 0.6 * k, 0.6 * k, BRONZE); // the nut
  ctx.strokeStyle = ink(STEEL_D); // the stirrup at the nose
  ctx.lineWidth = 0.6 * k;
  ctx.beginPath();
  ctx.ellipse(nx + 1 * k, ny - 1.6 * k, 1.2 * k, 1.6 * k, 0.8, 0, Math.PI * 2);
  ctx.stroke();
}

/** A guisarme-voulge: a long cleaver-blade on a pole, for the footmen. */
function voulge(ctx: Ctx, x: number, y: number, k: number) {
  const x0 = x - 2 * k, y0 = y + 7 * k, x1 = x + 2.6 * k, y1 = y - 22 * k;
  line(ctx, x0, y0, x1, y1, WOOD, 1.1 * k);
  poly(ctx, [x1 - 0.4 * k, y1 + 4 * k, x1 + 0.2 * k, y1 - 6 * k, x1 + 3 * k, y1 - 2 * k, x1 + 2.8 * k, y1 + 4.6 * k], STEEL);
  poly(ctx, [x1 + 1.4 * k, y1 - 4 * k, x1 + 3 * k, y1 - 2 * k, x1 + 2.8 * k, y1 + 4.6 * k, x1 + 1.4 * k, y1 + 4.4 * k], STEEL_D);
  line(ctx, x1 + 0.2 * k, y1 - 6 * k, x1 - 1.2 * k, y1 - 7.6 * k, STEEL_L, 0.6 * k); // the hook
  line(ctx, x1 - 0.2 * k, y1 + 4.2 * k, x1 + 2.8 * k, y1 + 4.6 * k, GOLD, 0.6 * k);
}

function weapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  switch (kind) {
    case 'warrior': voulge(ctx, x, y, k); return true;
    case 'archer': crossbow(ctx, x, y, k); return true;
    case 'defender': halberd(ctx, x, y, k, 36); return true; // the heater shield is drawn by the shield hook
    case 'swordsman': rapier(ctx, x, y, k, 16); return true;
    case 'garde': halberd(ctx, x, y, k, 38); return true;
    case 'giant':
      sword(ctx, x, y, k, 21);
      heater(ctx, b.off.x - 1.4 * k, b.off.y - 5.4 * k, 1.2 * k, 3);
      return true;
    case 'explorer': rapier(ctx, x, y, k, 11); return true;
    default: return false;
  }
}

function shield(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number): boolean {
  heater(ctx, x - 1.4 * k, y - 5.6 * k, (kind === 'defender' ? 1.15 : 1) * k, kind === 'defender' ? 3 : 1);
  return true;
}

// ---------------------------------------------------------------- the chevaliers

const HK = 0.95;

/** A caparison of royal blue sown with gold fleurs-de-lis over the horse, a crinet down the neck and a chamfron with a plume. */
function caparison(ctx: Ctx, x: number, y: number, full: boolean) {
  const bx = x - 1, by = y + 3 - 6 * HK, bw = 17 * HK, bh = 7 * HK;
  const v0 = full ? -0.55 : -0.2, v1 = 0.7;
  for (const f of ['L', 'R'] as const) {
    faceQuad(ctx, f, bx, by, bw, bh, 0, 1, v0, v1, BLUE);
    faceQuad(ctx, f, bx, by, bw, bh, 0, 1, v0, v0 + 0.12, GOLD); // the gold hem
    for (let i = 0; i < 8; i++) faceQuad(ctx, f, bx, by, bw, bh, i / 8 + 0.03, i / 8 + 0.09, v0 - 0.08, v0, GOLD_D); // fringe
  }
  // lilies sown over both flanks
  const spots: [('L' | 'R'), number, number][] = full
    ? [['L', 0.2, 0.36], ['L', 0.55, 0.4], ['L', 0.86, 0.36], ['L', 0.38, -0.2], ['L', 0.72, -0.2], ['R', 0.3, 0.3], ['R', 0.72, 0.3], ['R', 0.5, -0.25]]
    : [['L', 0.25, 0.3], ['L', 0.62, 0.3], ['R', 0.4, 0.26], ['R', 0.82, 0.3], ['L', 0.44, -0.05]];
  for (const [f, u, v] of spots) { const [px, py] = faceAt(f, bx, by, bw, bh, u, v); fleur(ctx, px, py, f === 'L' ? 0.55 : 0.5, f === 'L' ? GOLD : GOLD_D); }
  // the crinet over the neck and the chamfron over the face, with a plume
  const nx = x - 1 + 8 * HK, ny = y + 3 - 10.5 * HK;
  faceQuad(ctx, 'R', nx, ny, 5 * HK, 7 * HK, 0.05, 0.95, 0.2, 0.96, BLUE);
  const [cx, cy] = faceAt('R', nx, ny, 5 * HK, 7 * HK, 0.5, 0.6);
  fleur(ctx, cx, cy, 0.45, GOLD);
  const hhx = x - 1 + 10.5 * HK, hhy = y + 3 - 15 * HK;
  faceQuad(ctx, 'R', hhx, hhy, 7 * HK, 5 * HK, 0.08, 0.72, 0.3, 0.98, STEEL);
  faceQuad(ctx, 'R', hhx, hhy, 7 * HK, 5 * HK, 0.36, 0.46, 0.3, 0.98, GOLD);
  for (let i = -1; i <= 1; i++) curve(ctx, hhx + 0.4, hhy - 4.6, hhx + i * 1.2 - 0.6, hhy - 8.6, hhx + i * 1.6 - 2.6, hhy - 10.6, 0.9, i ? WHITE : BLUE_L);
}

/** The leg of an armoured rider in the stirrup: a steel greave and sabaton. */
function greave(ctx: Ctx, sx: number, sy: number) {
  poly(ctx, [sx + 0.4, sy + 0.4, sx + 4, sy + 0.6, sx + 4.6, sy + 5, sx + 2.2, sy + 5.4], STEEL);
  poly(ctx, [sx + 2.2, sy + 5.4, sx + 4.6, sy + 5, sx + 4.4, sy + 10, sx + 2.2, sy + 10.2], shade(STEEL, -0.12));
  ellipse(ctx, sx + 3.4, sy + 5.2, 1.3, 1, STEEL_L); // the poleyn at the knee
  poly(ctx, [sx + 2.2, sy + 10, sx + 4.8, sy + 9.8, sx + 6.4, sy + 11, sx + 2.2, sy + 11.2], STEEL_D);
  line(ctx, sx + 1.8, sy + 11.4, sx + 5, sy + 11.2, GOLD_D, 0.6);
}

/** A chevalier: a rider in plate on a blue-and-gold caparisoned horse. The knight rides the bigger white destrier. */
function chevalier(ctx: Ctx, kind: 'rider' | 'knight', x: number, y: number) {
  const knight = kind === 'knight';
  const saddle = drawHorse(ctx, x - 1, y + 3, HK, knight ? '#ecebe6' : '#7a4a2a', knight ? '#c8c4bc' : '#1a120c', undefined, BLUE);
  caparison(ctx, x, y, knight);
  const b = figure(ctx, kind, 'france', saddle.x, saddle.y, 0.9, true);
  greave(ctx, saddle.x, saddle.y);
  heater(ctx, b.off.x - 1.4, b.off.y - 2.4, knight ? 0.72 : 0.62, knight ? 3 : 1);
  lance(ctx, b.hand.x, b.hand.y, knight ? 33 : 28, knight ? 'royal' : 'pennon');
}

// ---------------------------------------------------------------- the trebuchet

function trebuchet(ctx: Ctx, x: number, y: number) {
  const beam = (x0: number, y0: number, x1: number, y1: number, w: number) => { line(ctx, x0, y0, x1, y1, WOOD_D, w + 0.6); line(ctx, x0, y0, x1, y1, WOOD, w); line(ctx, x0 - 0.3, y0 - 0.3, x1 - 0.3, y1 - 0.3, shade(WOOD, 0.3), w * 0.3); };
  // the ground frame: two sill beams crossed by sleepers
  beam(x - 14, y + 2, x + 8, y - 6, 2);
  beam(x - 8, y + 7, x + 14, y - 1, 2);
  beam(x - 14, y + 2, x - 8, y + 7, 1.6);
  beam(x + 8, y - 6, x + 14, y - 1, 1.6);
  // a pile of stone shot and a blue-and-gold pennant
  for (const [ax, ay] of [[-15, 8], [-12.4, 8.8], [-13.6, 6.6]] as const) { ellipse(ctx, x + ax, y + ay, 1.8, 1.6, '#9a9488'); ellipse(ctx, x + ax - 0.5, y + ay - 0.5, 0.7, 0.6, '#c8c2b4'); }
  // the far A-frame
  beam(x - 2, y - 2, x + 1, y - 22, 1.6);
  beam(x + 5, y - 4, x + 1, y - 22, 1.6);
  // the throwing arm, long end up and back to the sling, short end down to the counterweight
  const px = x + 1, py = y - 21;
  const ax = px - 19, ay = py - 14, cx = px + 7, cy = py + 5;
  beam(cx, cy, ax, ay, 1.8);
  ellipse(ctx, px, py, 1.4, 1.4, '#3a3a40'); // the axle
  // the sling hanging from the tip, with its stone
  line(ctx, ax, ay, ax - 3, ay + 9, '#c8b890', 0.5);
  line(ctx, ax, ay, ax + 1, ay + 9.4, '#c8b890', 0.5);
  ellipse(ctx, ax - 1, ay + 9.8, 1.8, 1.4, '#6a5a40');
  ellipse(ctx, ax - 1, ay + 9.2, 1.4, 1.2, '#a8a294');
  // the counterweight: a hanging box of stones, banded with iron, painted with a lily
  line(ctx, cx, cy, cx - 0.6, cy + 4, '#3a3a40', 0.8);
  line(ctx, cx, cy, cx + 1.8, cy + 3.6, '#3a3a40', 0.8);
  box(ctx, cx + 0.6, cy + 12, 7, 7.6, '#8a6038', '#a87848');
  band(ctx, cx + 0.6, cy + 12, 7, 7.6, 0.1, 0.18, '#3a3a40');
  band(ctx, cx + 0.6, cy + 12, 7, 7.6, 0.82, 0.9, '#3a3a40');
  faceQuad(ctx, 'R', cx + 0.6, cy + 12, 7, 7.6, 0.15, 0.85, 0.26, 0.76, BLUE);
  const [fx, fy] = faceAt('R', cx + 0.6, cy + 12, 7, 7.6, 0.5, 0.5);
  fleur(ctx, fx, fy, 0.6, GOLD);
  // the near A-frame, over the arm
  beam(x - 6, y + 4, x + 1.4, y - 21, 1.8);
  beam(x + 9, y + 0, x + 1.4, y - 21, 1.8);
  beam(x - 3.4, y - 6, x + 6, y - 7.6, 1.2);
  // the windlass wheel to winch the arm down
  ring(ctx, x + 6.8, y + 0.4, 2.6, 3.4, WOOD_D, 1);
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI; line(ctx, x + 6.8 - Math.cos(a) * 2.6, y + 0.4 - Math.sin(a) * 3.4, x + 6.8 + Math.cos(a) * 2.6, y + 0.4 + Math.sin(a) * 3.4, WOOD, 0.5); }
  line(ctx, px, py - 1, px, py - 8, WOOD_D, 0.7);
  banner(ctx, px, py - 8, 7, 4.6, 'pennon', 0.4);
  // an engineer in a blue surcoat beside it
  figure(ctx, 'warrior', 'france', x - 13, y + 1, 0.56);
}

// ---------------------------------------------------------------- ships

function foam(ctx: Ctx, x: number, y: number, w: number) {
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y, w, 2.2, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.stroke();
}

/** A square sail on a yard: white canvas, plain, with a blue cross, or with a gold-lilied blue roundel. */
function squareSail(ctx: Ctx, mx: number, yTop: number, w: number, h: number, mark: 'none' | 'lily' | 'cross') {
  const l = mx - w / 2, r = mx + w / 2, b = yTop + h;
  line(ctx, l - 1.4, yTop - 0.4, r + 1.4, yTop + 0.4, WOOD_D, 1);
  const pts = [l, yTop, r, yTop + 0.4, r + 1.4, b - h * 0.45, r + 0.4, b, mx, b + 1.8, l - 0.4, b - 0.2, l - 1.4, b - h * 0.45];
  poly(ctx, pts, '#f6f2e6');
  poly(ctx, [mx, yTop + 0.2, r, yTop + 0.4, r + 1.4, b - h * 0.45, r + 0.4, b, mx, b + 1.8], '#e0d8c4');
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.clip();
  if (mark === 'cross') { line(ctx, mx, yTop, mx, b + 2, BLUE, w * 0.14); line(ctx, l - 2, yTop + h * 0.45, r + 2, yTop + h * 0.45, BLUE, w * 0.14); }
  if (mark === 'lily') {
    ellipse(ctx, mx, yTop + h * 0.52, Math.min(w, h) * 0.34, Math.min(w, h) * 0.36, BLUE);
    fleur(ctx, mx, yTop + h * 0.52, Math.min(w, h) * 0.085, GOLD);
  }
  ctx.restore();
  for (const t of [0.2, 0.8]) line(ctx, l + t * w, yTop + 1, l + t * w + (t - 0.5) * 2, b, 'rgba(0,0,0,0.1)', 0.5);
}

/** A curved hull side-on; `top(t)` gives the gunwale along it (t from -1 stern to 1 bow). Painted blue with gold bands. */
function hull(ctx: Ctx, x: number, y: number, w: number, top: (t: number) => number, paint: 'wood' | 'blue') {
  const near: [number, number][] = [];
  for (let i = 0; i <= 12; i++) { const t = -1 + i / 6; near.push([x + t * w, top(t)]); }
  const far = near.map(([a, b], i) => [a + (i === 0 ? 1.8 : i === 12 ? -1.8 : 0), b - 2] as [number, number]);
  poly(ctx, [...near.flat(), ...[...far].reverse().flat()], '#3a2414');
  const keel = [...near, [x + w * 0.86, y - 0.6], [x + w * 0.5, y + 2.6], [x, y + 3.2], [x - w * 0.5, y + 2.8], [x - w * 0.96, y - 0.4]] as [number, number][];
  return { near, draw: () => {
    poly(ctx, keel.flat(), paint === 'blue' ? BLUE_D : '#4a2a16');
    poly(ctx, [...near.flat(), x + w * 0.9, y - 2.6, x, y - 2, x - w * 0.9, y - 2.4], paint === 'blue' ? BLUE : '#7a4a26');
    line(ctx, x - w * 0.94, y - 0.6, x + w * 0.86, y - 0.8, '#1a1208', 0.7);
    const stroke = (dy: number, c: string, wd: number) => {
      ctx.strokeStyle = ink(c);
      ctx.lineWidth = wd;
      ctx.beginPath();
      near.forEach(([a, b], i) => (i ? ctx.lineTo(a, b + dy) : ctx.moveTo(a, b + dy)));
      ctx.stroke();
    };
    if (paint === 'blue') { stroke(0.8, GOLD, 1); stroke(4.2, GOLD_D, 0.6); }
    else stroke(1.2, BLUE, 1.2);
  } };
}

/** A castle on the deck: a timber box with a painted band and a gilt rail. */
function deckCastle(ctx: Ctx, x: number, y: number, w: number, h: number, windows: boolean, gilt: boolean) {
  box(ctx, x, y, w, h, gilt ? BLUE : '#7a4a26', gilt ? BLUE_L : '#9a6a40');
  band(ctx, x, y, w, h, 0.62, 0.74, gilt ? GOLD : BLUE);
  band(ctx, x, y, w, h, 0.0, 0.08, gilt ? GOLD_D : '#4a2a16');
  if (windows) for (const u of [0.22, 0.6]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.16, 0.22, 0.5, '#ffd870');
  for (let i = 0; i < 5; i++) faceQuad(ctx, 'L', x, y - h, w, 1.6, i / 5 + 0.04, i / 5 + 0.1, 0, 1, gilt ? GOLD : '#5a3418');
}

/** The river barge (gabare): a long flat hull, a single square sail, a striped awning over the cargo, a steering oar. */
function barge(ctx: Ctx, x: number, y: number) {
  const w = 18;
  const top = (t: number) => y - 3.2 - (t < 0 ? Math.pow(-t, 4) * 2.6 : Math.pow(t, 4) * 3.6);
  const h = hull(ctx, x, y, w, top, 'wood');
  line(ctx, x + 3, y - 3, x + 3, y - 26, WOOD_D, 1.1);
  squareSail(ctx, x + 3, y - 24, 13, 11, 'lily');
  poly(ctx, [x + 3, y - 26, x + 9, y - 25, x + 3, y - 24], BLUE);
  // wine casks in the hold
  for (const dx of [8, 11.4]) { ellipse(ctx, x + dx, y - 4.6, 1.6, 1.9, '#8a5a2a'); line(ctx, x + dx - 1.6, y - 4.6, x + dx + 1.6, y - 4.6, '#3a2a20', 0.4); }
  h.draw();
  // a blue-and-white striped awning over the stern
  const ax = x - 9, ay = y - 4;
  poly(ctx, [ax - 6, ay, ax + 6, ay, ax + 5, ay - 6, ax - 5, ay - 6], WHITE);
  for (let i = 0; i < 4; i++) poly(ctx, [ax - 6 + i * 3, ay, ax - 4.5 + i * 3, ay, ax - 3.75 + i * 2.5, ay - 6, ax - 5 + i * 2.5, ay - 6], BLUE);
  line(ctx, ax - 5.4, ay - 6.2, ax + 5.4, ay - 6.2, GOLD_D, 0.6);
  figure(ctx, 'warrior', 'france', x - 15, y - 3.6, 0.4, true);
  line(ctx, x - 15, y - 7, x - w - 5, y + 3.4, WOOD, 1.2); // the long steering oar
  foam(ctx, x, y + 3.2, w * 0.86);
}

/** The carrack: a high forecastle and sterncastle, square sails with a blue cross, a lateen mizzen. */
function carrack(ctx: Ctx, x: number, y: number) {
  const w = 21;
  const top = (t: number) => y - 4.8 - (t < 0 ? Math.pow(-t, 2) * 5 : Math.pow(t, 2.4) * 4.4);
  const h = hull(ctx, x, y, w, top, 'wood');
  line(ctx, x + 2, y - 5, x + 2, y - 36, WOOD_D, 1.2);
  line(ctx, x + 12, y - 6, x + 12.6, y - 26, WOOD_D, 1);
  line(ctx, x - 10, y - 6, x - 10, y - 24, WOOD_D, 0.9);
  for (const [a, b] of [[x - 18, y - 6], [x + 20, y - 7]] as const) line(ctx, a, b, x + 2, y - 35, 'rgba(60,40,24,0.55)', 0.4);
  // a lateen mizzen
  line(ctx, x - 16, y - 10, x - 5, y - 24, WOOD_D, 0.8);
  poly(ctx, [x - 15.4, y - 10.4, x - 5.4, y - 23.4, x - 6, y - 10], '#f2ead6');
  squareSail(ctx, x + 2, y - 33, 13, 8, 'none');
  squareSail(ctx, x + 2, y - 23, 18, 12, 'cross');
  squareSail(ctx, x + 12.3, y - 23, 9, 9, 'none');
  ellipse(ctx, x + 2, y - 36.6, 2, 0.9, '#5a3418');
  line(ctx, x + 2, y - 37, x + 2, y - 41, WOOD_D, 0.6);
  banner(ctx, x + 2, y - 41, 8, 5, 'royal', 0.5);
  h.draw();
  deckCastle(ctx, x - w * 0.72, y - 5.2, 9, 5.4, true, false);
  deckCastle(ctx, x + w * 0.72, y - 5.6, 7, 4.4, false, false);
  figure(ctx, 'archer', 'france', x - w * 0.72, y - 10.8, 0.36, true);
  line(ctx, x + w * 0.9, top(0.9) - 3, x + w + 6, top(1) - 8, WOOD_D, 0.9);
  line(ctx, x - w + 1.4, top(-1) + 1.4, x - w - 1.4, y + 4.4, WOOD, 1.1);
  foam(ctx, x, y + 3.2, w * 0.86);
}

/** The galleon of the Royal Navy: a royal-blue hull banded with gold, a gilded sterncastle, three masts, the white ensign. */
function galleon(ctx: Ctx, x: number, y: number) {
  const w = 27;
  const top = (t: number) => y - 5.4 - (t < 0 ? Math.pow(-t, 2.4) * 6.4 : Math.pow(t, 3) * 2.6);
  const h = hull(ctx, x, y, w, top, 'blue');
  line(ctx, x + 1, y - 5, x + 1, y - 48, WOOD_D, 1.4);
  line(ctx, x + 14, y - 6, x + 14.4, y - 37, WOOD_D, 1.1);
  line(ctx, x - 13, y - 7, x - 13, y - 33, WOOD_D, 1);
  for (const [a, b, c, d] of [[x - 26, y - 8, x + 1, y - 47], [x + 30, y - 9, x + 14.4, y - 36], [x + 30, y - 9, x + 1, y - 47]] as const) line(ctx, a, b, c, d, 'rgba(60,40,24,0.55)', 0.4);
  line(ctx, x - 20, y - 16, x - 7, y - 32, WOOD_D, 0.8); // the lateen mizzen
  poly(ctx, [x - 19.4, y - 16.4, x - 7.4, y - 31.4, x - 8, y - 15], '#f2ead6');
  squareSail(ctx, x + 1, y - 45, 14, 8, 'none');
  squareSail(ctx, x + 1, y - 34, 21, 14, 'lily');
  squareSail(ctx, x + 14.2, y - 34, 11, 7, 'none');
  squareSail(ctx, x + 14, y - 25.4, 14, 10, 'lily');
  ellipse(ctx, x + 1, y - 35.4, 2.4, 1, '#5a3418');
  ellipse(ctx, x + 14.2, y - 26.4, 2, 0.9, '#5a3418');
  // the white ensign of the Bourbons at the main, blue streamers
  line(ctx, x + 1, y - 48, x + 1, y - 53, WOOD_D, 0.8);
  banner(ctx, x + 1, y - 53, 10, 6.6, 'white', 0.6);
  poly(ctx, [x + 14.4, y - 37, x + 27, y - 36, x + 14.4, y - 35.4], BLUE);
  poly(ctx, [x - 13, y - 33, x - 4, y - 32.2, x - 13, y - 31.6], GOLD);
  h.draw();
  // two tiers of gunports with gilt wreaths
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) {
    const t = -0.5 + i * 0.2 + r * 0.08, px = x + t * w, py = top(t) + 2.8 + r * 3;
    if (r && i > 4) continue;
    poly(ctx, [px - 1.1, py - 0.9, px + 1.1, py - 0.9, px + 1.1, py + 0.9, px - 1.1, py + 0.9], '#0e0a14');
    ctx.strokeStyle = ink(GOLD);
    ctx.lineWidth = 0.4;
    ctx.strokeRect(px - 1.3, py - 1.1, 2.6, 2.2);
    line(ctx, px + 0.2, py, px + 1.6, py + 0.7, '#3a3a40', 0.9);
  }
  // the towering gilded sterncastle with a gallery, carvings and great lanterns
  deckCastle(ctx, x - w * 0.7, y - 6.6, 12, 7.4, true, true);
  deckCastle(ctx, x - w * 0.82, y - 14, 8, 4.6, true, true);
  for (let i = 0; i < 4; i++) { const px = x - w * 0.95 + i * 1.8; curve(ctx, px, y - 7, px + 0.9, y - 9, px + 1.8, y - 7, 0.6, GOLD_L); } // the carved stern scrolls
  fleur(ctx, x - w * 0.86, y - 21.4, 0.9, GOLD);
  for (const d of [-1, 1]) {
    const lx = x - w * 0.82 + d * 3.4, ly = y - 21.4;
    line(ctx, lx, ly + 2.4, lx, ly + 0.8, '#3a2a20', 0.5);
    ellipse(ctx, lx, ly, 1, 1.4, '#ffd060');
    ellipse(ctx, lx, ly - 1.4, 0.8, 0.4, GOLD_D);
  }
  deckCastle(ctx, x + w * 0.66, y - 5.8, 7, 3.8, false, true);
  figure(ctx, 'garde', 'france', x - w * 0.82, y - 18.6, 0.34, true);
  figure(ctx, 'swordsman', 'france', x + w * 0.66, y - 9.6, 0.34, true);
  // the gilded beak-head with its figurehead, and the bowsprit
  poly(ctx, [x + w * 0.9, top(0.9) + 1, x + w + 5, top(1) + 1.6, x + w + 4.6, top(1) + 3, x + w * 0.88, top(0.88) + 4], GOLD_D);
  ellipse(ctx, x + w + 4.4, top(1) + 1.2, 1.2, 1.4, GOLD);
  line(ctx, x + w * 0.9, top(0.9) - 2, x + w + 8, top(1) - 9, WOOD_D, 1);
  line(ctx, x - w + 1.4, top(-1) + 2, x - w - 1.6, y + 4.6, WOOD, 1.2);
  foam(ctx, x, y + 3.2, w * 0.88);
}

// ---------------------------------------------------------------- whole units

/** The Genoese crossbowman: a tall pavise painted with the lilies slung on his back, then the man and his crossbow. */
function crossbowman(ctx: Ctx, x: number, y: number) {
  const px = x - 6, py = y - 3;
  poly(ctx, [px - 4.6, py + 3, px + 3.4, py + 4.6, px + 3.8, py - 15, px - 4.2, py - 16.6], '#5a3a1e');
  poly(ctx, [px - 4, py + 2.4, px + 3, py + 3.8, px + 3.2, py - 14.4, px - 3.6, py - 15.8], BLUE);
  poly(ctx, [px - 0.6, py + 3, px + 0.6, py + 3.2, px + 0.8, py - 14.8, px - 0.4, py - 15.2], WHITE); // a white pale down the middle
  fleur(ctx, px - 2.2, py - 9, 0.7, GOLD);
  fleur(ctx, px + 1.8, py - 8.4, 0.7, GOLD);
  fleur(ctx, px - 0.1, py - 2.4, 0.7, GOLD);
  const b = figure(ctx, 'archer', 'france', x, y, 1);
  // the bolt case at the hip
  poly(ctx, [x + 3.6, y - 6, x + 6, y - 5.4, x + 5.6, y - 1, x + 3.4, y - 1.4], '#6a4422');
  for (const d of [0, 1.1]) line(ctx, x + 4 + d, y - 6, x + 4.4 + d, y - 8, '#e8dcc0', 0.5);
  crossbow(ctx, b.hand.x, b.hand.y, 1);
}

/** The Royal Guard: a musketeer's cassock with the white cross, a plumed hat, a halberd and the lilied heater shield. */
function garde(ctx: Ctx, x: number, y: number) {
  heater(ctx, x - 6.4, y - 11, 1.15, 3); // slung on the back, so the cross on the cassock shows
  const b = figure(ctx, 'garde', 'france', x, y, 1);
  halberd(ctx, b.hand.x, b.hand.y, 1, 38);
}

function unit(ctx: Ctx, kind: UnitKind, x: number, y: number): boolean {
  switch (kind) {
    case 'archer': crossbowman(ctx, x, y); return true;
    case 'garde': garde(ctx, x, y); return true;
    case 'rider': chevalier(ctx, 'rider', x, y); return true;
    case 'knight': chevalier(ctx, 'knight', x, y); return true;
    case 'catapult': trebuchet(ctx, x, y); return true;
    case 'boat': barge(ctx, x, y); return true;
    case 'ship': carrack(ctx, x, y); return true;
    case 'warship': galleon(ctx, x, y); return true;
    default: return false;
  }
}

// ---------------------------------------------------------------- buildings

/** A steep slate roof over a box: the hipped roof, slate courses and a lead ridge. */
function slateRoof(ctx: Ctx, x: number, y: number, w: number, h: number, roofC: string) {
  roof(ctx, x, y, w, h, roofC);
  const hw = w / 2, hh = w / 4;
  for (let i = 1; i < 5; i++) {
    const t = i / 5;
    line(ctx, x - hw * (1 - t), y + hh * (1 - t) * 0 - h * t + 0 + (hh * 0), x, y + hh - (hh + h) * t, shade(roofC, 0.2), 0.35);
    line(ctx, x + hw * (1 - t), y - h * t, x, y + hh - (hh + h) * t, shade(roofC, -0.45), 0.35);
  }
  line(ctx, x, y + hh, x, y - h, shade(roofC, 0.35), 0.4);
}

/** A tall chimney stack of stone with clay pots. */
function chimney(ctx: Ctx, x: number, y: number, h: number, stone: string) {
  box(ctx, x, y, 2.2, h, stone);
  box(ctx, x, y - h, 2.6, 0.7, shade(stone, -0.15));
  for (const d of [-0.5, 0.5]) { box(ctx, x + d, y - h - 0.7 + Math.abs(d) * 0.2, 0.8, 1, '#b8643a'); }
}

/** A dormer window poking out of a slate roof face. */
function dormer(ctx: Ctx, x: number, y: number, roofC: string) {
  poly(ctx, [x - 1.6, y, x + 1.6, y + 0.8, x + 1.6, y - 2.6, x - 1.6, y - 3.4], STONE);
  poly(ctx, [x - 0.8, y - 0.4, x + 0.8, y + 0.2, x + 0.8, y - 2.4, x - 0.8, y - 2.8], '#3a4a6a');
  poly(ctx, [x - 2.2, y - 3.2, x, y - 6.4, x + 2.2, y - 2.2, x + 1.6, y - 2.4, x, y - 5, x - 1.6, y - 3.4], shade(roofC, -0.1));
}

/** A limestone house under a steep slate roof: blue shutters, a dormer, tall chimneys at the gables. */
function stoneHouse(ctx: Ctx, x: number, y: number, w: number, h: number, roofC: string, shop: boolean) {
  box(ctx, x, y, w, h, STONE, '#efe6d0');
  band(ctx, x, y, w, h, 0, 0.1, STONE_D);
  band(ctx, x, y, w, h, 0.92, 1, shade(STONE, -0.06)); // the cornice
  const win = (f: 'L' | 'R', u: number, v: number) => {
    faceQuad(ctx, f, x, y, w, h, u, u + 0.14, v, v + 0.24, '#3a4a6a');
    faceQuad(ctx, f, x, y, w, h, u - 0.07, u, v, v + 0.24, BLUE); // shutters
    faceQuad(ctx, f, x, y, w, h, u + 0.14, u + 0.21, v, v + 0.24, BLUE);
  };
  win('R', 0.14, 0.52); win('R', 0.64, 0.52); win('L', 0.4, 0.52);
  if (shop) { // a ground-floor boutique with a striped awning
    faceQuad(ctx, 'R', x, y, w, h, 0.1, 0.9, 0.06, 0.36, '#5a3a2a');
    faceQuad(ctx, 'R', x, y, w, h, 0.16, 0.84, 0.1, 0.32, '#e8c870');
    for (let i = 0; i < 6; i++) faceQuad(ctx, 'R', x, y, w, h, 0.08 + i * 0.14, 0.15 + i * 0.14, 0.34, 0.44, i % 2 ? WHITE : BLUE);
  } else {
    faceQuad(ctx, 'R', x, y, w, h, 0.4, 0.58, 0, 0.36, '#4a3020'); // the door
    faceQuad(ctx, 'R', x, y, w, h, 0.38, 0.6, 0.36, 0.4, STONE_D);
  }
  slateRoof(ctx, x, y - h, w + 1.2, w * 0.56, roofC);
  const [dx, dy] = faceAt('R', x, y - h, w + 1.2, 0, 0.5, 0);
  dormer(ctx, dx - 0.4, dy - w * 0.12, roofC);
  chimney(ctx, x - w * 0.3, y - h - w * 0.02, w * 0.5, STONE);
  chimney(ctx, x + w * 0.32, y - h - w * 0.02, w * 0.44, STONE);
}

/** A half-timbered Normandy house: white plaster crossed by dark oak posts and braces, an overhanging upper floor. */
function normandy(ctx: Ctx, x: number, y: number, w: number, h: number, roofC: string) {
  box(ctx, x, y, w, h * 0.5, '#d8ccb0'); // a stone ground course
  box(ctx, x, y - h * 0.5 + 0.6, w + 1, h * 0.5, PLASTER, '#f8f2e4'); // the jettied upper floor
  const yy = y - h * 0.5 + 0.6, ww = w + 1, hh = h * 0.5;
  for (const f of ['L', 'R'] as const) {
    for (const u of [0, 0.25, 0.5, 0.75, 0.94]) faceQuad(ctx, f, x, yy, ww, hh, u, u + 0.06, 0, 1, TIMBER); // posts
    faceQuad(ctx, f, x, yy, ww, hh, 0, 1, 0, 0.1, TIMBER); // sill and plate
    faceQuad(ctx, f, x, yy, ww, hh, 0, 1, 0.9, 1, TIMBER);
    for (const u of [0.06, 0.56]) { // diagonal braces
      const [ax, ay] = faceAt(f, x, yy, ww, hh, u, 0.1), [bx, by] = faceAt(f, x, yy, ww, hh, u + 0.19, 0.9);
      line(ctx, ax, ay, bx, by, TIMBER, 0.7);
    }
  }
  faceQuad(ctx, 'R', x, yy, ww, hh, 0.3, 0.46, 0.3, 0.72, '#3a4a6a'); // a leaded window
  faceQuad(ctx, 'R', x, y, w, h * 0.5, 0.56, 0.74, 0, 0.8, '#5a3a22'); // the door below
  faceQuad(ctx, 'L', x, y, w, h * 0.5, 0.3, 0.48, 0.3, 0.7, '#3a4a6a');
  for (const u of [0.1, 0.3]) { const [px, py] = faceAt('R', x, y, w, h * 0.5, u, 0.1); ellipse(ctx, px + 0.6, py - 0.6, 1, 0.8, '#5a9a4a'); ellipse(ctx, px + 0.6, py - 1, 0.45, 0.45, '#c860a8'); } // hydrangeas
  // a steep thatch-or-slate roof with a crest of irises along the ridge (as on Norman cottages)
  slateRoof(ctx, x, yy - hh, ww + 1.2, ww * 0.62, mix(roofC, '#6a5a48', 0.35));
  chimney(ctx, x + ww * 0.24, yy - hh - ww * 0.05, ww * 0.5, '#b86a48');
}

/** A Gothic parish church: a nave with buttresses and a pointed portal, a square tower and a tall slate spire. */
function church(ctx: Ctx, x: number, y: number, roofC: string) {
  box(ctx, x - 2, y, 14, 9, STONE, '#efe6d0');
  for (const u of [0.2, 0.5, 0.8]) faceQuad(ctx, 'L', x - 2, y, 14, 9, u, u + 0.06, 0, 0.9, STONE_D); // buttresses
  for (const u of [0.28, 0.58]) faceQuad(ctx, 'L', x - 2, y, 14, 9, u, u + 0.1, 0.3, 0.74, '#4a5a8a'); // lancet windows
  const [px, py] = faceAt('R', x - 2, y, 14, 9, 0.5, 0);
  poly(ctx, [px - 1.4, py + 0.6, px + 1.4, py - 0.1, px + 1.4, py - 4.2, px, py - 6.4, px - 1.4, py - 4.6], '#4a3020'); // the pointed portal
  const [rx, ry] = faceAt('R', x - 2, y, 14, 9, 0.5, 0.78);
  ellipse(ctx, rx, ry, 1.5, 1.6, '#4a5a9a');
  ring(ctx, rx, ry, 1.5, 1.6, STONE_D, 0.45);
  slateRoof(ctx, x - 2, y - 9, 15.4, 7, roofC);
  // the tower and its spire
  const tx = x + 5, ty = y - 3;
  box(ctx, tx, ty, 6, 15, STONE);
  for (const f of ['L', 'R'] as const) faceQuad(ctx, f, tx, ty, 6, 15, 0.3, 0.7, 0.66, 0.88, '#2a2430');
  band(ctx, tx, ty, 6, 15, 0.94, 1, shade(STONE, 0.08));
  const st = ty - 15;
  poly(ctx, [tx - 3, st, tx, st + 1.5, tx, st - 15], shade(roofC, 0.1));
  poly(ctx, [tx + 3, st, tx, st + 1.5, tx, st - 15], shade(roofC, -0.25));
  line(ctx, tx, st - 15, tx, st - 18.6, GOLD_D, 0.6);
  line(ctx, tx - 1, st - 17.4, tx + 1, st - 17.4, GOLD_D, 0.5);
  ellipse(ctx, tx, st - 19, 0.7, 0.6, GOLD); // a gilt cockerel's perch
}

/** A round tower with a conical slate roof and a gilt finial (the château's turrets). */
function turret(ctx: Ctx, x: number, y: number, r: number, h: number, roofC: string, cone = 1.9) {
  const ry = r * 0.5;
  ctx.save();
  const g = ctx.createLinearGradient(x - r, 0, x + r, 0);
  g.addColorStop(0, ink(shade(STONE, 0.06)));
  g.addColorStop(0.45, ink(STONE));
  g.addColorStop(1, ink(shade(STONE, -0.28)));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - r, y - h);
  ctx.lineTo(x - r, y);
  ctx.ellipse(x, y, r, ry, 0, Math.PI, 0, true);
  ctx.lineTo(x + r, y - h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  line(ctx, x - r * 0.3, y - h * 0.62, x - r * 0.3, y - h * 0.42, '#2a2430', r * 0.3); // a window
  // the machicolated cornice and the cone
  ellipse(ctx, x, y - h, r * 1.08, ry * 1.08, shade(STONE, -0.1));
  const ch = r * cone * 2;
  poly(ctx, [x - r * 1.12, y - h, x, y - h - ch, x, y - h + ry], shade(roofC, 0.12));
  poly(ctx, [x + r * 1.12, y - h, x, y - h - ch, x, y - h + ry], shade(roofC, -0.25));
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y - h, r * 1.12, ry * 1.12, 0, 0, Math.PI);
  ctx.fillStyle = ink(shade(roofC, -0.05));
  ctx.fill();
  ctx.restore();
  for (const t of [0.35, 0.65]) line(ctx, x - r * 1.12 * (1 - t), y - h - ch * t + ry * 0.2 * (1 - t), x + r * 1.12 * (1 - t), y - h - ch * t + ry * 0.2 * (1 - t), shade(roofC, -0.4), 0.3);
  line(ctx, x, y - h - ch, x, y - h - ch - 2.4, GOLD_D, 0.5);
  ellipse(ctx, x, y - h - ch - 2.6, 0.5, 0.5, GOLD);
}

/** The capital: a Loire château of pale stone with conical turrets, beside a Gothic cathedral façade with its rose window. */
function chateau(ctx: Ctx, x: number, y: number, roofC: string) {
  ellipse(ctx, x, y + 6, 27, 7.5, 'rgba(0,0,0,0.14)');
  // the cathedral behind, to the right: two square towers flanking a gable with the rose window
  const cx = x + 14, cy = y - 9;
  box(ctx, cx, cy, 15, 15, STONE, '#efe6d0');
  slateRoof(ctx, cx, cy - 15, 15, 7, roofC);
  for (const d of [-1, 1]) { // the two towers of the west front
    const tx = cx + d * 5.4, ty = cy + 2.4 - d * 2.7;
    box(ctx, tx, ty, 5.2, 25, '#ece2c8');
    for (const f of ['L', 'R'] as const) { faceQuad(ctx, f, tx, ty, 5.2, 25, 0.3, 0.7, 0.66, 0.9, '#2a2430'); faceQuad(ctx, f, tx, ty, 5.2, 25, 0.1, 0.9, 0.6, 0.63, STONE_D); }
    band(ctx, tx, ty, 5.2, 25, 0.96, 1, shade(STONE, 0.1));
  }
  // the façade: three pointed portals, a gallery of kings and the great rose window
  const F = (u: number, v: number) => faceAt('R', cx, cy, 15, 15, u, v);
  for (const u of [0.22, 0.5, 0.78]) {
    const [px, py] = F(u, 0);
    poly(ctx, [px - 1.3, py + 0.6, px + 1.3, py - 0.1, px + 1.3, py - 3.6, px, py - 5.6, px - 1.3, py - 4], '#3a2a24');
  }
  for (let i = 0; i < 7; i++) { const [px, py] = F(0.14 + i * 0.12, 0.46); line(ctx, px, py, px, py - 1.4, STONE_D, 0.6); } // the gallery of kings
  const [rx, ry] = F(0.5, 0.72);
  ellipse(ctx, rx, ry, 3.1, 3.4, STONE_D);
  ellipse(ctx, rx, ry, 2.6, 2.9, '#3a4aa0');
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; line(ctx, rx, ry, rx + Math.cos(a) * 2.6, ry + Math.sin(a) * 2.9, i % 2 ? '#c03a4a' : STONE_D, 0.35); }
  ellipse(ctx, rx, ry, 0.8, 0.9, GOLD);
  ring(ctx, rx, ry, 1.7, 1.9, STONE_D, 0.3);
  // the château: a main block of pale stone under a steep slate roof with dormers and chimneys
  const mx = x - 4, my = y + 2;
  box(ctx, mx, my, 20, 10, STONE, '#efe6d0');
  band(ctx, mx, my, 20, 10, 0, 0.1, STONE_D);
  band(ctx, mx, my, 20, 10, 0.5, 0.54, STONE_D);
  for (const f of ['L', 'R'] as const) for (const u of [0.12, 0.36, 0.6, 0.84]) for (const v of [0.18, 0.62]) faceQuad(ctx, f, mx, my, 20, 10, u, u + 0.08, v, v + 0.24, '#3a4a6a'); // tall windows
  const [gx, gy] = faceAt('R', mx, my, 20, 10, 0.5, 0);
  poly(ctx, [gx - 1.4, gy + 0.6, gx + 1.4, gy - 0.1, gx + 1.4, gy - 3.8, gx - 1.4, gy - 3.2], '#4a3020'); // the door
  slateRoof(ctx, mx, my - 10, 21, 11, roofC);
  for (const u of [0.25, 0.75]) { const [dx, dy] = faceAt('R', mx, my - 10, 21, 0, u, 0); dormer(ctx, dx, dy - 3, roofC); }
  { const [dx, dy] = faceAt('L', mx, my - 10, 21, 0, 0.5, 0); dormer(ctx, dx, dy - 3, roofC); }
  chimney(ctx, mx - 3.4, my - 17, 5, STONE);
  chimney(ctx, mx + 4.4, my - 16, 5.6, STONE);
  // round corner towers with conical roofs, the tallest bearing the royal banner
  turret(ctx, mx - 10.4, my + 0.4, 3.2, 14, roofC);
  turret(ctx, mx + 10.4, my + 0.6, 3.2, 14, roofC);
  turret(ctx, mx, my + 5.6, 3.6, 12, roofC);
  turret(ctx, mx - 2, my - 11, 2.4, 8, roofC, 2.2); // a stair turret rising from the roof
  line(ctx, mx - 10.4, my - 28, mx - 10.4, my - 36, WOOD_D, 0.7);
  banner(ctx, mx - 10.4, my - 36, 10, 6.6, 'royal', 0.7);
}

function building(ctx: Ctx, x: number, y: number, big: boolean, roofC: string, capital: boolean) {
  if (big && capital) {
    ctx.save();
    ctx.translate(x, y + 2);
    ctx.scale(0.8, 0.8);
    chateau(ctx, 0, 0, roofC);
    ctx.restore();
    return;
  }
  if (big) { church(ctx, x, y, roofC); return; }
  const v = ((Math.round(x) * 7 + Math.round(y) * 3) % 4 + 4) % 4;
  if (v === 0) stoneHouse(ctx, x, y, 11, 8, roofC, false);
  else if (v === 1) normandy(ctx, x, y, 10, 10, roofC);
  else if (v === 2) { stoneHouse(ctx, x - 2, y - 1, 8, 6, roofC, true); normandy(ctx, x + 4, y + 2.4, 7, 8, roofC); }
  else stoneHouse(ctx, x, y, 12, 9, roofC, true);
}

// ---------------------------------------------------------------- trees

function clumps(ctx: Ctx, x: number, y: number, k: number, g: string, list: readonly (readonly [number, number, number, number, number])[]) {
  for (const [dx, dy, rx, ry, c] of list) {
    ellipse(ctx, x + dx * k, y + (dy + 1) * k, rx * k, ry * k, shade(g, c - 0.22));
    ellipse(ctx, x + dx * k, y + dy * k, rx * k, ry * k, shade(g, c));
    ellipse(ctx, x + (dx - rx * 0.3) * k, y + (dy - ry * 0.32) * k, rx * 0.5 * k, ry * 0.36 * k, shade(g, c + 0.18));
  }
}

/** A plane tree (platane): a tall trunk with mottled peeling bark in cream, olive and grey, a broad airy crown. */
function plane(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  const g = mix(P.forest, '#7ab04a', 0.45);
  line(ctx, x, y, x, y - 11 * k, '#9a9478', 2.6 * k);
  for (let i = 0; i < 6; i++) { // the mottled patches
    const py = y - (1.4 + i * 1.6) * k, dx = (rand(variant + 3, i) - 0.5) * 1.4 * k;
    ellipse(ctx, x + dx, py, 0.8 * k, 0.9 * k, ['#e0d8b8', '#7a7a5a', '#c8c0a0'][i % 3]);
  }
  curve(ctx, x, y - 9 * k, x - 3 * k, y - 11 * k, x - 6 * k, y - 13 * k, 1.2 * k, '#a8a080');
  curve(ctx, x, y - 9 * k, x + 3 * k, y - 11 * k, x + 6.4 * k, y - 13.6 * k, 1.2 * k, '#a8a080');
  clumps(ctx, x, y, k, g, [[-6.4, -14, 4.2, 3.2, -0.12], [6.6, -14.6, 4.2, 3.2, -0.16], [0, -15.6, 6.4, 4, -0.04], [-3.2, -18.6, 4.4, 3, 0.06], [3.4, -18.6, 4.2, 2.8, 0.04], [0, -21, 3.6, 2.4, 0.12]]);
  for (let i = 0; i < 5; i++) { const a = rand(variant + 6, i) * Math.PI * 2, r = 2 + rand(variant + 9, i) * 5; ellipse(ctx, x + Math.cos(a) * r * k, y - 16 * k + Math.sin(a) * r * 0.5 * k, 0.5 * k, 0.5 * k, '#a89a5a'); } // seed balls
}

/** Lombardy poplars planted in a row: tall slim columns, silvery green. */
function poplars(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette) {
  const g = mix(P.forest, '#6aa04a', 0.4);
  for (const i of [-1, 0, 1]) {
    const px = x + i * 4.4 * k, py = y + i * 2.2 * k, hgt = (24 - Math.abs(i) * 2) * k;
    line(ctx, px, py, px, py - 3 * k, '#7a6a54', 1 * k);
    poly(ctx, [px, py - hgt, px + 2 * k, py - hgt * 0.6, px + 2.2 * k, py - 5 * k, px, py - 2 * k, px - 2.2 * k, py - 5 * k, px - 1.9 * k, py - hgt * 0.6], shade(g, -0.08));
    poly(ctx, [px, py - hgt, px - 1.9 * k, py - hgt * 0.6, px - 2.2 * k, py - 5 * k, px, py - 2 * k, px - 0.4 * k, py - hgt * 0.5], shade(g, 0.12));
    for (let j = 0; j < 6; j++) { const yy = py - (5 + j * 3) * k; line(ctx, px - 1.4 * k, yy, px + 0.6 * k, yy - 0.8 * k, shade(g, 0.26), 0.45 * k); }
  }
}

/** Rows of lavender: purple mounds along furrows. */
function lavender(ctx: Ctx, x: number, y: number, k: number) {
  for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) {
    const px = x + (i * 3.2 - 5 + r * -3) * k, py = y + (i * 1.6 - 2.4 + r * 1.6) * k;
    ellipse(ctx, px, py + 0.6 * k, 1.8 * k, 1 * k, '#5a7a4a');
    ellipse(ctx, px, py - 0.4 * k, 1.6 * k, 1.3 * k, '#7a5ab8');
    ellipse(ctx, px - 0.4 * k, py - 0.9 * k, 0.8 * k, 0.6 * k, '#a88ae0');
  }
}

/** Rows of vines on stakes, heavy with dark grapes. */
function vines(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette) {
  const g = mix(P.forest, '#5a9a3a', 0.5);
  for (let r = 0; r < 2; r++) {
    const ox = x - r * 4.4 * k, oy = y + r * 2.6 * k - 1.6 * k;
    line(ctx, ox - 6 * k, oy - 3 * k, ox + 6 * k, oy + 3 * k - 3 * k + 3 * k, '#6a5a44', 0.3 * k);
    for (let i = 0; i < 4; i++) {
      const px = ox + (i * 3.6 - 5.4) * k, py = oy + (i * 1.8 - 2.7) * k;
      line(ctx, px, py, px, py - 5 * k, '#6a4a2a', 0.6 * k); // the stake
      clumps(ctx, px, py, k, g, [[0, -4.6, 1.8, 1.5, 0]]);
      ellipse(ctx, px + 0.6 * k, py - 2.8 * k, 0.6 * k, 0.8 * k, '#4a2a5a');
    }
  }
}

function tree(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  const type = ['plane', 'poplar', 'plane', 'lavender', 'poplar', 'plane', 'vine', 'poplar', 'plane'][variant % 9];
  if (type === 'plane') plane(ctx, x, y, k, P, variant);
  else if (type === 'poplar') poplars(ctx, x, y, k * 0.85, P);
  else if (type === 'lavender') lavender(ctx, x, y, k);
  else vines(ctx, x, y, k, P);
}

registerArt('france', {
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

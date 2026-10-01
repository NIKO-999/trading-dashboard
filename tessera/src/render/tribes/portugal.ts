// Portugal (the Kingdom of the Discoveries): soldiers in green and red doublets with steel morions and kettle hats,
// round rodelas painted in green and red quarters with a gilt armillary sphere at the boss; sailors in linen smocks with
// red sashes and wide hats; crossbowmen (besteiros), pikes and broad swords; Henry the Navigator's great black chaperon
// for the hero; the Caçador, a green-jacketed rifleman in a plumed shako, kneeling to aim; a ginete under a green-and-red
// pennon and a man-at-arms on a chequered caparison; a bronze cannon on a naval truck carriage; a lateen caravel, a
// square-rigged nau and a tall galleon, their white sails marked with the red Cross of the Order of Christ; whitewashed
// towns with ochre trim, blue azulejo tile panels, terracotta roofs and lacy Algarve chimneys, a church with a tiled
// façade, and for the capital a Manueline tower by the water (Belém, its stone twisted like rope) before a monastery
// cloister; cork oaks with stripped red trunks, orange trees, maritime and umbrella pines.
import { registerArt, type Body } from '../tribeart';
import { drawHorse, figure } from '../units';
import type { BiomePalette } from '../../data/tribes';
import type { UnitKind } from '../../game/types';
import { band, box, ellipse, faceQuad, ink, line, mix, poly, rand, roof, shade, type Ctx } from '../prims';

const GREEN = '#1a7a4a';
const GREEN_L = '#38a066';
const GREEN_D = '#0a3a20';
const RED = '#c4262e';
const RED_L = '#e2484e';
const RED_D = '#7a1018';
const GOLD = '#e8b83a';
const GOLD_L = '#f8dc80';
const GOLD_D = '#9a7018';
const STEEL = '#c4cad2';
const STEEL_L = '#eef2f6';
const STEEL_D = '#6a727c';
const WHITE = '#f8f6ee';
const LINEN = '#ebe4d2';
const NAVY = '#2a3a5a';
const BREECH = '#3a2c24';
const BLACK = '#1e1a1e';
const LEATH = '#7a4a26';
const WOOD = '#7a5230';
const WOOD_D = '#4a3018';
const BRONZE = '#c8903a';
const BRONZE_L = '#efc070';
const BRONZE_D = '#7a5020';
const WASH = '#f8f6f0';
const OCHRE = '#e0b040';
const AZUL = '#2a5ab0';
const AZUL_L = '#8ab4e8';
const AZUL_D = '#1a3a7a';
const LIOZ = '#eadcb8'; // the honey limestone of Belém and the Jerónimos
const HAIR = '#2a1a10';
const CAC = '#2a6a3a'; // the caçador's jacket
const CAC_D = '#16301e';

// ---------------------------------------------------------------- small helpers

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

/** An elliptical outline (or part of one). */
function ring(ctx: Ctx, x: number, y: number, rx: number, ry: number, c: string, w: number, a0 = 0, a1 = Math.PI * 2, rot = 0) {
  ctx.strokeStyle = ink(c);
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, a0, a1);
  ctx.stroke();
}

/** A rounded dome (helmet bowl): the rim is the ellipse at (x, y), the crown rises `h` above it. */
function dome(ctx: Ctx, x: number, y: number, rx: number, h: number, c: string) {
  const path = () => {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, rx / 2.4, 0, 0, Math.PI);
    ctx.ellipse(x, y, rx, h, 0, Math.PI, Math.PI * 2);
    ctx.closePath();
  };
  path();
  ctx.fillStyle = ink(c);
  ctx.fill();
  ctx.save();
  path();
  ctx.clip();
  ellipse(ctx, x + rx * 0.8, y - h * 0.1, rx * 0.62, h * 1.3, shade(c, -0.24));
  ellipse(ctx, x - rx * 0.34, y - h * 0.58, rx * 0.34, h * 0.26, shade(c, 0.45));
  ctx.restore();
}

/** The armillary sphere, the badge of King Manuel and of the voyages: a gilt globe of crossing rings on a little axis. */
function armillary(ctx: Ctx, x: number, y: number, r: number, c = GOLD) {
  const w = Math.max(0.3, r * 0.2);
  line(ctx, x - r * 0.5, y + r * 1.2, x + r * 0.5, y - r * 1.2, shade(c, -0.3), w); // the axis
  ring(ctx, x, y, r, r, c, w);
  ring(ctx, x, y, r, r * 0.34, c, w * 0.9); // the equator
  ring(ctx, x, y, r, r * 0.3, c, w * 0.9, 0, Math.PI * 2, -0.5); // the ecliptic band, tilted
  ring(ctx, x, y, r * 0.36, r, shade(c, -0.15), w * 0.8); // a meridian
  ellipse(ctx, x, y, r * 0.22, r * 0.22, shade(c, 0.4));
}

/** The red Cross of the Order of Christ: a cross pattée, red with a slim white cross inside it. */
function orderCross(ctx: Ctx, cx: number, cy: number, r: number, red = RED) {
  const a = r * 0.22, f = r * 0.55; // the arm's waist and its flared end
  poly(ctx, [
    cx - a, cy - a, cx - f, cy - r, cx + f, cy - r, cx + a, cy - a,
    cx + r, cy - f, cx + r, cy + f, cx + a, cy + a,
    cx + f, cy + r, cx - f, cy + r, cx - a, cy + a,
    cx - r, cy + f, cx - r, cy - f,
  ], red);
  line(ctx, cx, cy - r * 0.78, cx, cy + r * 0.78, WHITE, r * 0.12);
  line(ctx, cx - r * 0.78, cy, cx + r * 0.78, cy, WHITE, r * 0.12);
}

/** A flag of Portugal streaming from (x, y): a green hoist, a red fly and a gilt armillary sphere at the seam. */
function flag(ctx: Ctx, x: number, y: number, w: number, h: number, wave = 0) {
  const s = 0.4; // where green gives way to red
  const pts = [x, y, x + w * 0.5, y + 0.8 + wave, x + w, y + 0.2, x + w, y + h, x + w * 0.5, y + h + 0.6 - wave, x, y + h];
  poly(ctx, pts, RED);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.clip();
  poly(ctx, [x - 1, y - 2, x + w * s, y - 2, x + w * s, y + h + 3, x - 1, y + h + 3], GREEN);
  poly(ctx, [x - 1, y - 2, x + w + 1, y - 2, x + w + 1, y + h * 0.28, x - 1, y + h * 0.3], 'rgba(255,255,255,0.16)');
  ctx.restore();
  armillary(ctx, x + w * s, y + h * 0.5 + wave * 0.3, Math.min(w, h) * 0.24);
}

/** A swallow-tailed pennon, green over red. */
function pennon(ctx: Ctx, x: number, y: number, len: number, h: number) {
  poly(ctx, [x, y, x + len, y + h * 0.15, x + len * 0.72, y + h * 0.5, x, y + h * 0.5], GREEN);
  poly(ctx, [x, y + h * 0.5, x + len * 0.72, y + h * 0.5, x + len, y + h * 0.95, x, y + h], RED);
  line(ctx, x, y + 0.3, x + len * 0.9, y + h * 0.2, 'rgba(255,255,255,0.3)', 0.5);
}

// ---------------------------------------------------------------- dress

const OFFICER = (k: UnitKind) => k === 'swordsman' || k === 'knight' || k === 'giant';

function dress(kind: UnitKind): [string, string, string] | null {
  switch (kind) {
    case 'warrior': return [GREEN, BREECH, RED];
    case 'archer': return [LINEN, NAVY, LINEN];
    case 'rider': return [RED, BREECH, GREEN];
    case 'defender': return [STEEL, GREEN_D, GREEN];
    case 'swordsman': return [STEEL, BREECH, RED];
    case 'knight': return [STEEL, BREECH, GREEN];
    case 'giant': return [BLACK, BLACK, BLACK];
    case 'explorer': return [LINEN, NAVY, LINEN];
    case 'cacador': return [CAC, '#3a3a2e', CAC];
    default: return [GREEN, BREECH, RED];
  }
}

/** A steel breastplate with a ridge, a trim at neck and waist, and lames below. */
function cuirass(ctx: Ctx, x: number, y: number, w: number, h: number, trim: string) {
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const L = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'L', x, y, w, h, u0, u1, v0, v1, c);
  for (let i = 0; i < 2; i++) {
    R(0.04, 0.96, -0.08 - i * 0.1, 0.02 - i * 0.1, shade(STEEL, -0.1 * i));
    L(0.04, 0.96, -0.08 - i * 0.1, 0.02 - i * 0.1, shade(STEEL, -0.1 * i));
    R(0.04, 0.96, -0.08 - i * 0.1, -0.06 - i * 0.1, STEEL_D);
  }
  R(0.06, 0.48, 0.2, 0.86, shade(STEEL, 0.24));
  R(0.48, 0.54, 0.12, 0.88, shade(STEEL, 0.55)); // the ridge
  R(0.54, 0.58, 0.12, 0.88, shade(STEEL, -0.25));
  L(0.2, 0.7, 0.4, 0.8, shade(STEEL, 0.12));
  band(ctx, x, y, w, h, 0.9, 1, trim);
  band(ctx, x, y, w, h, 0.04, 0.1, trim);
  for (const u of [0.14, 0.86]) R(u - 0.04, u + 0.04, 0.82, 0.88, GOLD_L);
}

/** A sash round the waist, its knotted end hanging at the side. */
function sash(ctx: Ctx, x: number, y: number, w: number, h: number, c: string) {
  band(ctx, x, y, w, h, 0.08, 0.2, c);
  faceQuad(ctx, 'R', x, y, w, h, 0.78, 0.92, -0.3, 0.12, shade(c, -0.12));
  faceQuad(ctx, 'R', x, y, w, h, 0.84, 0.96, -0.42, -0.26, shade(c, -0.2));
}

function torso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const L = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'L', x, y, w, h, u0, u1, v0, v1, c);
  const B = (v0: number, v1: number, c: string) => band(ctx, x, y, w, h, v0, v1, c);
  const buttons = (c: string, u = 0.5) => { for (let i = 0; i < 4; i++) R(u - 0.04, u + 0.04, 0.26 + i * 0.16, 0.32 + i * 0.16, c); };
  switch (kind) {
    case 'warrior': // a green doublet, its sleeves slashed red, red panes on the breast, a red sash
      for (const [u, v] of [[0.12, 0.46], [0.24, 0.62], [0.76, 0.46], [0.86, 0.62]] as const) R(u, u + 0.06, v, v + 0.2, RED);
      L(0.3, 0.36, 0.44, 0.7, RED);
      L(0.6, 0.66, 0.44, 0.7, RED);
      buttons(GOLD_L);
      B(0.88, 1, GREEN_D);
      sash(ctx, x, y, w, h, RED);
      return;
    case 'archer': case 'explorer': // a sailor's linen smock: pleats, an open neck, a red sash knotted at the hip
      for (const u of [0.18, 0.36, 0.64, 0.82]) R(u, u + 0.04, 0.22, 0.86, shade(LINEN, -0.1));
      for (const u of [0.3, 0.7]) L(u, u + 0.04, 0.22, 0.86, shade(LINEN, -0.08));
      R(0.42, 0.58, 0.72, 1, '#dcae82'); // the open neck
      R(0.46, 0.54, 0.62, 0.74, shade(LINEN, -0.18));
      if (kind === 'archer') for (const v of [0.34, 0.5, 0.66]) B(v, v + 0.04, shade(NAVY, 0.3)); // a striped sailor's shirt
      sash(ctx, x, y, w, h, RED);
      return;
    case 'rider': // a red jerkin with a green sash over the shoulder
      for (let i = 0; i < 4; i++) { const u = 0.08 + i * 0.22; R(u, u + 0.22, 0.86 - i * 0.2, 0.62 - i * 0.2, GREEN); }
      buttons(GOLD, 0.7);
      B(0.08, 0.16, LEATH);
      return;
    case 'giant': // the Navigator's black velvet doublet, a gilt chain of office and an armillary pendant
      B(0.86, 1, shade(BLACK, 0.2));
      for (let i = 0; i < 9; i++) { const t = i / 8; R(0.08 + t * 0.84, 0.14 + t * 0.84, 0.86 - Math.sin(t * Math.PI) * 0.32, 0.92 - Math.sin(t * Math.PI) * 0.32, i % 2 ? GOLD : GOLD_L); }
      armillary(ctx, x + w * 0.25, y + w * 0.125 - h * 0.44, w * 0.11);
      buttons('#3a3434');
      return;
    case 'cacador': // a green jacket, black frogging across the breast, brass buttons, black crossbelts
      for (const v of [0.34, 0.5, 0.66]) R(0.22, 0.78, v, v + 0.05, CAC_D);
      buttons(GOLD_L, 0.22);
      buttons(GOLD_L, 0.78);
      B(0.88, 1, CAC_D); // the collar
      B(0.04, 0.12, CAC_D);
      for (let i = 0; i < 5; i++) { const u = 0.06 + i * 0.2; R(u, u + 0.14, 0.92 - i * 0.18, 0.8 - i * 0.18, '#1a1414'); }
      return;
    default:
      if (kind === 'defender' || kind === 'swordsman' || kind === 'knight') {
        cuirass(ctx, x, y, w, h, kind === 'defender' ? GREEN : GOLD);
        if (kind === 'swordsman') for (let i = 0; i < 4; i++) { const u = 0.08 + i * 0.22; R(u, u + 0.22, 0.86 - i * 0.18, 0.66 - i * 0.18, GREEN); }
        if (kind === 'knight') sash(ctx, x, y, w, h, RED);
        if (kind === 'defender') sash(ctx, x, y, w, h, RED);
        return;
      }
      buttons(GOLD);
      sash(ctx, x, y, w, h, RED);
  }
}

/** Portuguese faces: a full dark beard for the soldiers, a drooping moustache for the Navigator, sideburns for the caçador. */
function face(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  if (kind === 'giant') { // Henry's long drooping moustache, clean chin
    R(0.24, 0.48, 0.18, 0.24, HAIR); R(0.52, 0.76, 0.18, 0.24, HAIR);
    R(0.2, 0.26, 0.04, 0.22, HAIR); R(0.74, 0.8, 0.04, 0.22, HAIR);
    return;
  }
  if (kind === 'cacador') { R(0, 0.12, 0.1, 0.5, HAIR); R(0.3, 0.7, 0.2, 0.25, HAIR); return; } // sideburns and a moustache
  if (kind === 'archer' || kind === 'explorer') { R(0.1, 0.9, -0.04, 0.12, shade(HAIR, 0.2)); return; } // a sailor's stubble
  // a full beard, rounded
  R(0.12, 0.88, -0.14, 0.2, HAIR);
  R(0.3, 0.7, -0.22, -0.1, HAIR);
  R(0.26, 0.74, 0.2, 0.26, HAIR);
  faceQuad(ctx, 'L', x, y, w, h, 0.7, 1, -0.1, 0.34, HAIR);
  if (OFFICER(kind)) R(0.3, 0.7, -0.3, -0.18, shade(HAIR, 0.3)); // a trimmed point to the officer's beard
}

// ---------------------------------------------------------------- headgear

/** A morion: a steel bowl, a comb over the crown, a brim swept up front and back; a plume of green and red. */
function morion(ctx: Ctx, x: number, top: number, k: number, hw: number, metal: string, plume: string | null) {
  const by = top + 2 * k, rx = hw / 2 + 4 * k;
  dome(ctx, x, by - 0.4 * k, hw / 2 + 0.6 * k, 5 * k, metal);
  // the comb
  const cy = by - 3.4 * k, cr = 3 * k, ch = 5.6 * k;
  ctx.beginPath();
  ctx.ellipse(x, cy, cr, ch, 0, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = ink(shade(metal, 0.1));
  ctx.fill();
  ring(ctx, x, cy, cr, ch, shade(metal, -0.45), 0.45 * k, Math.PI, Math.PI * 2);
  ring(ctx, x, cy, cr * 0.8, ch * 0.86, STEEL_L, 0.5 * k, Math.PI * 1.12, Math.PI * 1.46);
  // the brim
  const outer = [x - rx, by - 4.4 * k, x - rx * 0.7, by - 0.4 * k, x - rx * 0.3, by + 1.4 * k, x + rx * 0.3, by + 1.6 * k, x + rx * 0.7, by, x + rx, by - 4 * k];
  const inner = [x + rx * 0.66, by - 1.4 * k, x + rx * 0.3, by - 0.2 * k, x - rx * 0.3, by - 0.4 * k, x - rx * 0.66, by - 1.8 * k];
  poly(ctx, [...outer, ...inner], metal);
  poly(ctx, [x + rx * 0.3, by + 1.6 * k, x + rx * 0.7, by, x + rx, by - 4 * k, x + rx * 0.66, by - 1.4 * k, x + rx * 0.3, by - 0.2 * k], shade(metal, -0.22));
  line(ctx, x - rx * 0.92, by - 3.6 * k, x - rx * 0.5, by - 0.5 * k, STEEL_L, 0.5 * k);
  for (const d of [-3, -1, 1, 3]) ellipse(ctx, x + d * k, by - 0.2 * k, 0.4 * k, 0.4 * k, GOLD_L);
  if (plume) { // a short upright plume at the back of the comb: green and red feathers
    line(ctx, x - 2.6 * k, by - 2.4 * k, x - 3 * k, by - 5.6 * k, GOLD, 0.8 * k);
    for (let i = 0; i < 4; i++) curve(ctx, x - 3 * k, by - 5.6 * k, x - 3.6 * k - i * 0.8 * k, by - 11 * k + i * 0.4 * k, x - 7.6 * k - i * 0.6 * k, by - 9 * k + i * 1.2 * k, 1.4 * k, i % 2 ? RED : plume);
  }
}

/** A chapel-de-fer (kettle hat): a round steel crown and a wide downturned brim. */
function kettle(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const by = top + 2.4 * k, rx = hw / 2 + 3 * k;
  ellipse(ctx, x + 0.3 * k, by + 0.9 * k, rx, 2.4 * k, STEEL_D);
  ellipse(ctx, x, by, rx, 2.3 * k, STEEL);
  ellipse(ctx, x - rx * 0.3, by - 0.5 * k, rx * 0.5, 1 * k, STEEL_L);
  dome(ctx, x, by - 0.4 * k, hw / 2 + 0.4 * k, 5.4 * k, STEEL);
  line(ctx, x, by - 5.6 * k, x, by - 0.8 * k, STEEL_D, 0.5 * k); // the central seam
  line(ctx, x - hw / 2, by - 0.8 * k, x + hw / 2, by - 0.8 * k, GREEN, 0.9 * k); // a green-dyed lining showing
}

/** A wide-brimmed hat with a band and (maybe) a feather. */
function hat(ctx: Ctx, x: number, top: number, k: number, hw: number, felt: string, bandC: string, feather: string | null) {
  const by = top + 2 * k, rx = hw / 2 + 3.6 * k;
  ellipse(ctx, x + 0.4 * k, by + 0.8 * k, rx, 2.8 * k, shade(felt, -0.3));
  ellipse(ctx, x, by, rx, 2.7 * k, felt);
  ellipse(ctx, x - rx * 0.3, by - 0.6 * k, rx * 0.5, 1.2 * k, shade(felt, 0.14));
  const cw = hw / 2 + 0.2 * k;
  poly(ctx, [x - cw, by, x - cw * 0.8, by - 4 * k, x + cw * 0.8, by - 4 * k, x + cw, by], felt);
  poly(ctx, [x + 0.4 * k, by + 0.6 * k, x + 0.4 * k, by - 4 * k, x + cw * 0.8, by - 4 * k, x + cw, by], shade(felt, -0.2));
  ellipse(ctx, x, by - 4 * k, cw * 0.8, 1.3 * k, shade(felt, 0.08));
  poly(ctx, [x - cw, by, x - cw * 0.96, by - 1.4 * k, x + cw * 0.96, by - 1.4 * k, x + cw, by], bandC);
  if (feather) for (let i = 0; i < 3; i++) curve(ctx, x + cw * 0.5, by - 1.4 * k, x - 1 * k - i * 0.6 * k, by - 8 * k + i * k, x - rx - 0.6 * k + i * 0.8 * k, by - 2.6 * k + i * 0.8 * k, (1.6 - i * 0.4) * k, i % 2 ? shade(feather, -0.15) : feather);
}

/** Henry the Navigator's chaperon: a great black hat of rolled cloth, broad and flat, its tail falling to one side. */
function chaperon(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const by = top + 2.4 * k, rx = hw / 2 + 4.6 * k;
  poly(ctx, [x - rx * 0.7, by, x - rx * 1.05, by + 5 * k, x - rx * 0.7, by + 9 * k, x - rx * 0.4, by + 2 * k], shade(BLACK, 0.06)); // the tail
  ellipse(ctx, x + 0.4 * k, by + 0.4 * k, rx, 3.4 * k, '#0e0c0e');
  ellipse(ctx, x, by - 0.6 * k, rx, 3.4 * k, BLACK);
  ellipse(ctx, x, by - 2.4 * k, rx * 0.96, 3.2 * k, shade(BLACK, 0.12));
  ellipse(ctx, x - rx * 0.3, by - 3.2 * k, rx * 0.46, 1.4 * k, shade(BLACK, 0.24)); // the velvet's sheen
  for (const d of [-0.5, 0, 0.5]) curve(ctx, x + d * rx, by - 0.4 * k, x + d * rx + 1 * k, by - 2 * k, x + d * rx * 0.7, by - 4.6 * k, 0.4 * k, '#3a3436'); // folds
}

/** The caçador's shako: a black felt cylinder with a peak, a brass plate, a green cord and a tall green plume. */
function shako(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const by = top + 2.2 * k, cw = hw / 2 + 0.6 * k, ch = 7.4 * k;
  poly(ctx, [x - 1 * k, by + 0.4 * k, x + cw + 2.6 * k, by + 1.8 * k, x + cw + 2.2 * k, by + 0.6 * k, x, by - 0.6 * k], '#0e0c0c'); // the peak
  poly(ctx, [x - cw, by, x - cw * 1.1, by - ch, x + cw * 1.1, by - ch, x + cw, by], '#221e1e');
  poly(ctx, [x + 0.4 * k, by + 0.4 * k, x + 0.4 * k, by - ch, x + cw * 1.1, by - ch, x + cw, by], '#141010');
  ellipse(ctx, x, by - ch, cw * 1.1, 1.4 * k, '#3a3434');
  line(ctx, x - cw * 1.08, by - ch + 0.8 * k, x + cw * 1.08, by - ch + 0.8 * k, CAC, 0.9 * k); // a green band at the top
  curve(ctx, x - cw, by - 2 * k, x, by + 0.6 * k, x + cw, by - 2.6 * k, 0.6 * k, GREEN_L); // the cords
  poly(ctx, [x + 0.6 * k, by - 2 * k, x + 2.8 * k, by - 1.4 * k, x + 2.8 * k, by - 4.6 * k, x + 1.7 * k, by - 5.4 * k, x + 0.6 * k, by - 5 * k], GOLD); // the brass plate (a bugle horn)
  ring(ctx, x + 1.7 * k, by - 3.4 * k, 0.6 * k, 0.6 * k, GOLD_D, 0.3 * k);
  // the plume: a tall green cock-feather tuft, swept back
  const px = x - 0.6 * k, py = by - ch;
  ellipse(ctx, px, py - 0.4 * k, 0.9 * k, 0.9 * k, GOLD);
  for (let i = 0; i < 5; i++) curve(ctx, px, py, px - 1 * k - i * 0.4 * k, py - 6 * k + i * 0.2 * k, px - 3.6 * k - i * 0.6 * k, py - 9 * k + i * 0.8 * k, (1.6 - i * 0.18) * k, i % 2 ? GREEN_D : GREEN_L);
}

function head(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  switch (kind) {
    case 'warrior': kettle(ctx, x, top, k, hw); return;
    case 'defender': morion(ctx, x, top, k, hw, STEEL, null); return;
    case 'swordsman': morion(ctx, x, top, k, hw, STEEL, GREEN); return;
    case 'knight': morion(ctx, x, top, k, hw, STEEL_L, GREEN_L); return;
    case 'archer': hat(ctx, x, top, k, hw, '#d8c08a', RED, null); return; // a wide straw hat
    case 'rider': hat(ctx, x, top, k, hw, '#3a2a20', GREEN, RED_L); return;
    case 'explorer': hat(ctx, x, top, k, hw, '#6a4a2e', RED, WHITE); return;
    case 'giant': chaperon(ctx, x, top, k, hw); return;
    case 'cacador': shako(ctx, x, top, k, hw); return;
    default: return;
  }
}

// ---------------------------------------------------------------- weapons and shields

/** A rodela: a round shield painted in green and red quarters, a gilt rim and a boss bearing the armillary sphere. */
function rodela(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  const big = kind === 'defender' || kind === 'giant';
  const cx = x - 1.4 * k, cy = y - (big ? 6 : 5.4) * k, rx = (big ? 6.2 : 5.4) * k, ry = (big ? 6.8 : 5.9) * k;
  ellipse(ctx, cx + 0.9 * k, cy + 0.6 * k, rx, ry, '#3a2a20'); // its thickness
  ellipse(ctx, cx, cy, rx, ry, GREEN);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 0.94, ry * 0.94, 0, 0, Math.PI * 2);
  ctx.clip();
  poly(ctx, [cx, cy - ry, cx + rx, cy - ry, cx + rx, cy, cx, cy], RED);
  poly(ctx, [cx - rx, cy, cx, cy, cx, cy + ry, cx - rx, cy + ry], RED);
  ellipse(ctx, cx - rx * 0.36, cy - ry * 0.4, rx * 0.4, ry * 0.26, 'rgba(255,255,255,0.18)');
  line(ctx, cx, cy - ry, cx, cy + ry, GOLD_D, 0.5 * k);
  line(ctx, cx - rx, cy, cx + rx, cy, GOLD_D, 0.5 * k);
  ctx.restore();
  ring(ctx, cx, cy, rx * 0.95, ry * 0.95, GOLD, 0.9 * k);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.4; ellipse(ctx, cx + Math.cos(a) * rx * 0.95, cy + Math.sin(a) * ry * 0.95, 0.35 * k, 0.35 * k, GOLD_L); }
  ellipse(ctx, cx + 0.3 * k, cy + 0.3 * k, 2 * k, 2.1 * k, GOLD_D);
  ellipse(ctx, cx, cy, 1.9 * k, 2 * k, WHITE);
  armillary(ctx, cx, cy, 1.4 * k);
}

/** A broad straight sword (espada) with a cross guard and a ring. */
function espada(ctx: Ctx, x: number, y: number, k: number, len = 15) {
  const tx = x + len * 0.26 * k, ty = y - len * k, wd = 1.1 * k;
  poly(ctx, [x - wd, y - 1.6 * k, tx - 0.2 * k, ty + 1.2 * k, tx + 0.15 * k, ty - 0.8 * k, x + 0.1 * k, y - 2 * k], STEEL_L);
  poly(ctx, [x + wd, y - 1.4 * k, tx + 0.4 * k, ty + 1.2 * k, tx + 0.15 * k, ty - 0.8 * k, x + 0.1 * k, y - 2 * k], '#9aa2ac');
  line(ctx, x + 0.1 * k, y - 2.4 * k, tx, ty + 1.4 * k, STEEL_D, 0.3 * k);
  line(ctx, x - 3 * k, y - 1 * k, x + 3 * k, y - 2.4 * k, GOLD_D, 1 * k); // the cross guard
  ring(ctx, x + 0.4 * k, y - 0.8 * k, 1.3 * k, 1 * k, GOLD, 0.5 * k, 0, Math.PI);
  line(ctx, x, y - 1.6 * k, x - 0.5 * k, y + 2.4 * k, '#3a2a20', 1.4 * k);
  ellipse(ctx, x - 0.6 * k, y + 3 * k, 1.1 * k, 1.1 * k, GOLD);
}

/** A long pike with a leaf-shaped steel head and a green-and-red tassel. */
function pike(ctx: Ctx, x: number, y: number, k: number, len = 40) {
  const x0 = x - 2.6 * k, y0 = y + 8 * k, x1 = x + 4 * k, y1 = y - (len - 8) * k;
  line(ctx, x0, y0, x1, y1, WOOD, 1.2 * k);
  line(ctx, x0 - 0.4 * k, y0, x1 - 0.4 * k, y1, shade(WOOD, 0.4), 0.4 * k);
  poly(ctx, [x1 + 0.6 * k, y1 - 6 * k, x1 - 1.2 * k, y1 - 1.6 * k, x1 + 0.1 * k, y1 + 0.8 * k, x1 + 1.5 * k, y1 - 1.2 * k], STEEL_L);
  poly(ctx, [x1 + 0.6 * k, y1 - 6 * k, x1 + 1.5 * k, y1 - 1.2 * k, x1 + 0.1 * k, y1 + 0.8 * k], STEEL_D);
  ellipse(ctx, x1 - 0.5 * k, y1 + 2.4 * k, 1 * k, 1.1 * k, GREEN);
  ellipse(ctx, x1 - 0.7 * k, y1 + 3.6 * k, 0.9 * k, 1 * k, RED);
}

/** A besta (crossbow): a wooden tiller, a steel bow across its head, the string drawn back, a quarrel laid. */
function besta(ctx: Ctx, x: number, y: number, k: number) {
  const bx = x - 3 * k, by = y + 2 * k, mx = x + 8 * k, my = y - 9 * k; // butt to head, slanting up
  line(ctx, bx, by, mx, my, '#6a3c1c', 1.6 * k);
  line(ctx, bx, by - 0.5 * k, mx, my - 0.5 * k, '#9a6a3a', 0.5 * k);
  // the steel bow, crosswise at the head
  const dx = mx - bx, dy = my - by, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
  const ax = mx + nx * 6 * k - (dx / len) * 2 * k, ay = my + ny * 6 * k - (dy / len) * 2 * k;
  const cx = mx - nx * 6 * k - (dx / len) * 2 * k, cy = my - ny * 6 * k - (dy / len) * 2 * k;
  curve(ctx, ax, ay, mx + (dx / len) * 1.6 * k, my + (dy / len) * 1.6 * k, cx, cy, 1 * k, STEEL_D);
  curve(ctx, ax, ay, mx + (dx / len) * 1.2 * k, my + (dy / len) * 1.2 * k, cx, cy, 0.4 * k, STEEL_L);
  const sx = bx + dx * 0.55, sy = by + dy * 0.55; // the string, drawn back to the nut
  line(ctx, ax, ay, sx, sy, '#e8e0c8', 0.35 * k);
  line(ctx, cx, cy, sx, sy, '#e8e0c8', 0.35 * k);
  line(ctx, sx, sy, mx + (dx / len) * 2 * k, my + (dy / len) * 2 * k, '#5a3a20', 0.6 * k); // the quarrel
  poly(ctx, [mx + (dx / len) * 3.2 * k, my + (dy / len) * 3.2 * k, mx + (dx / len) * 1.6 * k + nx * 0.6 * k, my + (dy / len) * 1.6 * k + ny * 0.6 * k, mx + (dx / len) * 1.6 * k - nx * 0.6 * k, my + (dy / len) * 1.6 * k - ny * 0.6 * k], STEEL);
  ellipse(ctx, mx + (dx / len) * 0.4 * k, my + (dy / len) * 0.4 * k, 0.8 * k, 0.8 * k, STEEL_D); // the stirrup
  ellipse(ctx, sx, sy, 0.6 * k, 0.6 * k, GOLD_D); // the nut
}

function weapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  switch (kind) {
    case 'warrior': espada(ctx, x, y, k, 13); return true;
    case 'archer': besta(ctx, x, y, k); return true;
    case 'defender': pike(ctx, x, y, k, 40); return true; // the rodela comes from the shield hook
    case 'swordsman':
      espada(ctx, x, y, k, 16);
      rodela(ctx, kind, b.off.x, b.off.y, k);
      return true;
    case 'giant': // the Navigator: a sword at his side and a gilt armillary sphere held up in his off hand
      espada(ctx, x, y, k, 14);
      line(ctx, b.off.x, b.off.y, b.off.x - 0.6 * k, b.off.y - 5 * k, GOLD_D, 0.8 * k);
      armillary(ctx, b.off.x - 0.6 * k, b.off.y - 8 * k, 3 * k);
      return true;
    case 'explorer': // a telescope... no, an astrolabe: the navigator's brass ring
      line(ctx, x, y, x + 0.4 * k, y - 3 * k, GOLD_D, 0.5 * k);
      ring(ctx, x + 0.4 * k, y - 5.6 * k, 2.4 * k, 2.4 * k, BRONZE, 0.9 * k);
      line(ctx, x - 1.8 * k, y - 4.4 * k, x + 2.6 * k, y - 6.8 * k, BRONZE_D, 0.5 * k);
      return true;
    default: return false;
  }
}

// ---------------------------------------------------------------- horsemen

const HK = 0.95;

/** Horse gear: a saddle cloth and breast collar; for the man-at-arms a caparison chequered green and red. */
function horseGear(ctx: Ctx, x: number, y: number, saddle: { x: number; y: number }, barded: boolean) {
  const sx = saddle.x, sy = saddle.y;
  if (!barded) {
    poly(ctx, [sx - 5.6, sy - 0.6, sx + 3.6, sy - 0.6, sx + 3.2, sy + 5.4, sx - 5.2, sy + 6.4], GREEN);
    line(ctx, sx - 5.2, sy + 6.2, sx + 3.2, sy + 5.2, RED, 0.9);
  } else {
    const bx = x - 1, by = y + 3 - 6 * HK, bw = 17 * HK, bh = 7 * HK;
    for (const f of ['L', 'R'] as const) {
      for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) faceQuad(ctx, f, bx, by, bw, bh, i / 6, (i + 1) / 6, -0.3 + j * 0.42, -0.3 + (j + 1) * 0.42, (i + j) % 2 ? GREEN : RED);
      faceQuad(ctx, f, bx, by, bw, bh, 0, 1, -0.34, -0.24, GOLD);
    }
    const fx = bx + bw * 0.25 - 2, fy = by + bw * 0.125 - bh * 0.4; // the armillary on a white roundel on the flank
    ellipse(ctx, fx, fy, 2.6, 2.6, WHITE);
    armillary(ctx, fx, fy, 1.8);
    const hhx = x - 1 + 10.5 * HK, hhy = y + 3 - 15 * HK; // a steel chamfron with a plume
    faceQuad(ctx, 'R', hhx, hhy, 7 * HK, 5 * HK, 0.08, 0.72, 0.3, 0.98, STEEL);
    for (let i = -1; i <= 1; i++) curve(ctx, hhx + 0.4, hhy - 4.6, hhx + i * 1.2 - 0.6, hhy - 8.6, hhx + i * 1.6 - 2.6, hhy - 10.6, 0.9, i ? GREEN : RED);
  }
  line(ctx, x + 3.5, y - 9.6, x + 8, y - 3.4, barded ? RED_D : LEATH, 1.2);
  for (let i = 0; i < 3; i++) { const t = (i + 0.5) / 3; ellipse(ctx, x + 3.5 + 4.5 * t, y - 9.6 + 6.2 * t, 0.5, 0.5, GOLD_L); }
}

function boot(ctx: Ctx, sx: number, sy: number, hose: string) {
  poly(ctx, [sx + 0.4, sy + 0.4, sx + 4, sy + 0.6, sx + 4.6, sy + 5, sx + 2.2, sy + 5.4], hose);
  poly(ctx, [sx + 2.2, sy + 5.4, sx + 4.6, sy + 5, sx + 4.4, sy + 10, sx + 2.2, sy + 10.2], '#3a2a20');
  poly(ctx, [sx + 2.2, sy + 10, sx + 4.8, sy + 9.8, sx + 6, sy + 11, sx + 2.2, sy + 11.2], '#2a1c14');
  line(ctx, sx + 1.8, sy + 11.4, sx + 5, sy + 11.2, STEEL_D, 0.6);
}

/** A lance with a pennon (the ginete) or the flag of Portugal (the man-at-arms). */
function lance(ctx: Ctx, x: number, y: number, len: number, withFlag: boolean) {
  const x0 = x - 3, y0 = y + 8, x1 = x + 5, y1 = y - len;
  line(ctx, x0, y0, x1, y1, '#8a5a30', 1.3);
  line(ctx, x0 - 0.4, y0, x1 - 0.4, y1, '#b8844a', 0.4);
  poly(ctx, [x1 + 0.6, y1 - 5, x1 - 0.8, y1 - 0.4, x1 + 0.2, y1 + 0.8, x1 + 1.4, y1 - 0.2], STEEL_L);
  poly(ctx, [x1 + 0.6, y1 - 5, x1 + 1.4, y1 - 0.2, x1 + 0.2, y1 + 0.8], STEEL_D);
  if (withFlag) flag(ctx, x1 - 0.2, y1 + 1.6, 11, 7.4, 0.8);
  else pennon(ctx, x1 - 0.2, y1 + 1.8, 9, 5);
}

function ginete(ctx: Ctx, x: number, y: number) {
  const saddle = drawHorse(ctx, x - 1, y + 3, HK, '#c8b8a0', '#5a4a3a', undefined, GREEN); // a grey Lusitano
  horseGear(ctx, x, y, saddle, false);
  const b = figure(ctx, 'rider', 'portugal', saddle.x, saddle.y, 0.9, true);
  boot(ctx, saddle.x, saddle.y, BREECH);
  rodela(ctx, 'rider', b.off.x - 1, b.off.y + 1.5, 0.6);
  lance(ctx, b.hand.x, b.hand.y, 28, false);
}

function manAtArms(ctx: Ctx, x: number, y: number) {
  const saddle = drawHorse(ctx, x - 1, y + 3, HK, '#3a2a22', '#120c0a', undefined, RED);
  horseGear(ctx, x, y, saddle, true);
  const b = figure(ctx, 'knight', 'portugal', saddle.x, saddle.y, 0.9, true);
  boot(ctx, saddle.x, saddle.y, STEEL);
  rodela(ctx, 'swordsman', b.off.x - 1, b.off.y + 1.5, 0.62);
  lance(ctx, b.hand.x, b.hand.y, 33, true);
}

// ---------------------------------------------------------------- the Caçador

/** The Caçador: a rifleman in a green jacket and a plumed shako, down on one knee to aim his Baker rifle. */
function cacador(ctx: Ctx, x: number, y: number) {
  const leg = '#3a3a2e', shoe = '#1a1412', hipY = y - 4.2;
  // a sword-bayonet scabbard and a cartridge box behind
  line(ctx, x - 4, hipY + 0.4, x - 10, y + 1, '#2a2020', 1);
  ellipse(ctx, x - 10, y + 1, 0.6, 0.5, GOLD_D);
  // the back leg: the left knee on the ground behind him, the shin flat, the toe dug in
  poly(ctx, [x - 4, hipY - 1, x - 0.4, hipY - 0.4, x - 2.4, y + 0.4, x - 5.8, y + 0.2], shade(leg, -0.05));
  poly(ctx, [x - 5.8, y + 0.2, x - 2.4, y + 0.4, x - 8.6, y + 1.4, x - 10.6, y + 0.6], shade(leg, -0.2));
  poly(ctx, [x - 11.4, y + 1, x - 9.6, y - 1.2, x - 8.6, y + 1.2], shoe);
  ellipse(ctx, x - 4.2, y + 0.2, 1.8, 1, 'rgba(0,0,0,0.25)'); // the knee pressed into the ground
  // the body, low on its haunches
  const b = figure(ctx, 'cacador', 'portugal', x - 1, hipY, 1, true);
  // the front leg: the right knee raised before him, the foot planted flat
  poly(ctx, [x - 1.6, hipY - 2, x + 2.6, hipY - 1.6, x + 6.6, hipY - 3.6, x + 6.8, hipY - 0.8, x + 2.2, hipY + 1.6, x - 1.2, hipY + 1.2], leg);
  poly(ctx, [x - 1.6, hipY - 2, x + 2.6, hipY - 1.6, x + 6.6, hipY - 3.6, x + 5.6, hipY - 4.2, x + 1.4, hipY - 2.8], shade(leg, 0.2));
  poly(ctx, [x + 4.6, hipY - 3, x + 6.8, hipY - 3.4, x + 6.8, y - 0.6, x + 4.6, y - 0.4], shade(leg, -0.18));
  poly(ctx, [x + 4.6, y - 2.8, x + 6.8, y - 3, x + 6.8, y - 0.4, x + 4.6, y - 0.2], '#22221c'); // the gaiter
  poly(ctx, [x + 4.2, y + 0.4, x + 9.4, y + 1, x + 9.2, y - 0.6, x + 6.8, y - 1.2, x + 4.4, y - 1], shoe);
  // the Baker rifle levelled at the shoulder, aiming right
  const sy = b.top + 10;
  const ax = x - 3.6, ay = sy + 0.6, mx = x + 18, my = sy - 2;
  const dx = mx - ax, dy = my - ay, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const P = (t: number, o: number): [number, number] => [ax + ux * t + nx * o, ay + uy * t + ny * o];
  poly(ctx, [...P(-1.6, 2.8), ...P(4, 1.4), ...P(len * 0.66, 0.7), ...P(len * 0.66, -0.5), ...P(4, -0.6), ...P(-1.2, -0.6)], '#5a3418'); // the walnut stock
  poly(ctx, [...P(-1.6, 2.8), ...P(4, 1.4), ...P(len * 0.66, 0.7), ...P(len * 0.66, 0.2), ...P(-1, 0.6)], '#8a5428');
  line(ctx, ...P(3, -0.5), ...P(len, -0.5), '#34363c', 1.1); // the barrel
  line(ctx, ...P(3, -0.8), ...P(len, -0.8), '#8a909a', 0.35);
  line(ctx, ...P(5, 0.8), ...P(6.4, 2), GOLD, 0.6); // the brass trigger guard
  ellipse(ctx, ...P(len * 0.3, 0.1), 0.9, 0.6, GOLD); // the patch box
  line(ctx, ...P(len - 0.6, -1), ...P(len - 0.6, -1.7), '#34363c', 0.5); // the foresight
  // the left arm reaching forward under the barrel, the right hand at the wrist of the stock
  const [hx, hy] = P(len * 0.5, 1.1), [rx, ry] = P(4.6, 1.4);
  const [sx0, sy0] = [b.hand.x - 1.4, b.top + 11.4];
  poly(ctx, [sx0 - 1.2, sy0 - 1.2, hx - 0.8, hy - 1.2, hx + 0.4, hy + 0.9, sx0 + 0.6, sy0 + 1.6], CAC);
  poly(ctx, [sx0 - 1.2, sy0 - 1.2, hx - 0.8, hy - 1.2, hx - 0.6, hy - 0.4, sx0 - 1, sy0 - 0.2], shade(CAC, 0.18));
  line(ctx, hx - 1.4, hy - 1, hx - 1, hy + 0.8, CAC_D, 0.8); // the cuff
  ellipse(ctx, hx, hy, 1.2, 1.1, '#dcae82');
  ellipse(ctx, rx, ry, 1.2, 1.1, '#dcae82');
  // a puff of smoke from the muzzle
  ellipse(ctx, ...P(len + 2.4, -0.6), 1.6, 1.3, 'rgba(235,235,235,0.7)');
  ellipse(ctx, ...P(len + 4.6, -1.6), 2.2, 1.7, 'rgba(235,235,235,0.5)');
}

// ---------------------------------------------------------------- the bronze cannon

function cannon(ctx: Ctx, x: number, y: number) {
  // shot and a sponge-rammer laid by the carriage, a powder keg
  for (const [ax, ay, ar] of [[-13, 6, 1.6], [-10.6, 6.6, 1.6], [-11.8, 4.6, 1.5]] as const) {
    ellipse(ctx, x + ax, y + ay, ar, ar, '#2e3036');
    ellipse(ctx, x + ax - 0.5, y + ay - 0.6, ar * 0.4, ar * 0.35, '#6a6e78');
  }
  box(ctx, x + 13, y + 6, 3.6, 4, '#7a5230', '#9a6a40');
  band(ctx, x + 13, y + 6, 3.6, 4, 0.2, 0.32, '#3a2a20');
  band(ctx, x + 13, y + 6, 3.6, 4, 0.7, 0.82, '#3a2a20');
  line(ctx, x - 15, y + 8, x + 4, y + 9.6, WOOD, 0.8);
  ellipse(ctx, x + 4.4, y + 9.6, 1.2, 0.9, '#6a5a48');
  // the barrel's axis: bronze, tapering to a flared muzzle, resting on a naval truck carriage
  const b0: [number, number] = [x - 10, y - 3], b1: [number, number] = [x + 15, y - 10.4];
  const dx = b1[0] - b0[0], dy = b1[1] - b0[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const P = (t: number, o: number): [number, number] => [b0[0] + ux * t + nx * o, b0[1] + uy * t + ny * o];
  const truck = (wx: number, wy: number, r: number) => {
    ellipse(ctx, wx + 0.5, wy + 0.3, r * 0.8, r, '#2a1c10');
    ellipse(ctx, wx, wy, r * 0.8, r, WOOD);
    ellipse(ctx, wx - 0.3, wy - 0.3, r * 0.5, r * 0.6, shade(WOOD, 0.2));
    ellipse(ctx, wx, wy, r * 0.26, r * 0.32, '#3a3036');
  };
  /** One stepped cheek of the carriage, under the barrel, its top `o` below the axis. */
  const cheek = (o: number, c: string) => {
    const [ax, ay] = P(1, o), [bx, by] = P(9, o), [cx2, cy2] = P(9, o - 1.4), [dx2, dy2] = P(16, o - 1.4);
    poly(ctx, [ax, ay, bx, by, cx2, cy2, dx2, dy2, dx2 + 0.6, y - 2.4, ax - 1.6, y + 4.6], c);
    poly(ctx, [ax - 1.6, y + 4.6, dx2 + 0.6, y - 2.4, dx2 + 0.6, y - 3.4, ax - 1.6, y + 3.6], shade(c, -0.3));
  };
  truck(P(15, 0)[0] + 2.6, y - 2.6, 2.3); // the far trucks
  truck(P(2, 0)[0] + 2.6, y + 2.6, 2.3);
  cheek(1.2, RED_D);
  poly(ctx, [...P(0, -3.4), ...P(len, -2.2), ...P(len, 2.2), ...P(0, 3.4)], BRONZE);
  poly(ctx, [...P(0, -3.4), ...P(len, -2.2), ...P(len, -0.6), ...P(0, -1)], BRONZE_L);
  poly(ctx, [...P(0, 2), ...P(len, 1.4), ...P(len, 2.2), ...P(0, 3.4)], BRONZE_D);
  for (const t of [0.14, 0.4, 0.72]) line(ctx, ...P(len * t, -3.6 + t * 1.2), ...P(len * t, 3.6 - t * 1.2), shade(BRONZE, -0.3), 1.2);
  ellipse(ctx, ...P(len, 0), 2.6, 2.8, BRONZE_D);
  ellipse(ctx, ...P(len + 0.4, 0), 2.2, 2.4, BRONZE);
  ellipse(ctx, ...P(len + 0.6, 0), 1.2, 1.3, '#1a1410');
  ellipse(ctx, ...P(-1.2, 0), 2.4, 2.4, BRONZE_D);
  ellipse(ctx, ...P(-2.4, 0), 1.2, 1.2, BRONZE);
  const [ax, ay] = P(len * 0.27, -1);
  armillary(ctx, ax, ay, 1.7, '#ffe090');
  cheek(2.2, RED); // the near cheek, a little lower, hiding the barrel's belly
  const [qx, qy] = P(9, 2.2);
  line(ctx, qx, qy, qx - 0.6, qy + 3.4, RED_D, 0.5); // the step
  for (const t of [4, 12]) { const [bx, by] = P(t, 2.6); ellipse(ctx, bx, by + 1, 0.5, 0.5, '#2a2a30'); } // iron bolts
  const [cx3, cy3] = P(8, -1.8);
  line(ctx, cx3 - 1.6, cy3 - 0.2, cx3 + 1.6, cy3 + 4, '#2a2a30', 0.8); // the capsquare strap over the trunnion
  truck(P(15, 0)[0] + 0.4, y - 1.4, 2.6); // the near trucks
  truck(P(2, 0)[0] + 0.2, y + 4, 2.6);
  // a sailor-gunner with the linstock
  const g = figure(ctx, 'archer', 'portugal', x - 15, y + 1, 0.56);
  line(ctx, g.hand.x - 1, g.hand.y + 4, g.hand.x + 3, g.hand.y - 7, WOOD, 0.7);
  ellipse(ctx, g.hand.x + 3.2, g.hand.y - 7.4, 0.6, 0.6, '#ff7a2a');
  curve(ctx, g.hand.x + 3.2, g.hand.y - 8, g.hand.x + 1.6, g.hand.y - 10.6, g.hand.x + 3.2, g.hand.y - 13, 0.6, 'rgba(220,220,220,0.6)');
  // the flag on a staff by the keg
  line(ctx, x + 16, y + 5, x + 16, y - 16, WOOD_D, 0.8);
  flag(ctx, x + 16, y - 16, 8, 5.4, 0.4);
}

// ---------------------------------------------------------------- ships

function foam(ctx: Ctx, x: number, y: number, w: number) {
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y, w, 2.2, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.stroke();
}

/** A square sail on a yard, bellied by the wind, marked with the Cross of the Order of Christ (or plain). */
function squareSail(ctx: Ctx, mx: number, yTop: number, w: number, h: number, cross: boolean) {
  const l = mx - w / 2, r = mx + w / 2, b = yTop + h;
  line(ctx, l - 1.4, yTop - 0.4, r + 1.4, yTop + 0.4, WOOD_D, 1);
  const pts = [l, yTop, r, yTop + 0.4, r + 1.4, b - h * 0.45, r + 0.4, b, mx, b + 1.8, l - 0.4, b - 0.2, l - 1.4, b - h * 0.45];
  poly(ctx, pts, '#f6f0e0');
  poly(ctx, [mx, yTop + 0.2, r, yTop + 0.4, r + 1.4, b - h * 0.45, r + 0.4, b, mx, b + 1.8], '#e0d6c0');
  if (cross) orderCross(ctx, mx, yTop + h * 0.54, Math.min(w, h) * 0.36);
  for (const t of [0.2, 0.8]) line(ctx, l + t * w, yTop + 1, l + t * w + (t - 0.5) * 2, b, 'rgba(0,0,0,0.1)', 0.5);
}

/** A lateen sail: a triangle hung from a long slanting yard, with the cross on it. */
function lateen(ctx: Ctx, mx: number, my: number, h: number, span: number, cross: boolean) {
  const ya: [number, number] = [mx - span * 0.55, my + h * 0.15], yb: [number, number] = [mx + span * 0.5, my - h * 0.9];
  line(ctx, ya[0], ya[1], yb[0], yb[1], WOOD_D, 0.9);
  const foot: [number, number] = [mx + span * 0.42, my + h * 0.02];
  poly(ctx, [ya[0] + 0.6, ya[1] - 0.2, yb[0] - 0.4, yb[1] + 0.6, foot[0] + 1.6, foot[1] - 0.8], '#f6f0e0');
  poly(ctx, [mx, my - h * 0.4, yb[0] - 0.4, yb[1] + 0.6, foot[0] + 1.6, foot[1] - 0.8], '#e0d6c0');
  if (cross) orderCross(ctx, mx + span * 0.1, my - h * 0.3, h * 0.2);
}

/** A curved hull, side-on, its strakes painted; `top(t)` is the gunwale height (t from -1 stern to 1 bow). */
function hull(ctx: Ctx, x: number, y: number, w: number, top: (t: number) => number, paint: 'none' | 'band' | 'chequer') {
  const near: [number, number][] = [];
  for (let i = 0; i <= 12; i++) { const t = -1 + i / 6; near.push([x + t * w, top(t)]); }
  const far = near.map(([a, b], i) => [a + (i === 0 ? 1.8 : i === 12 ? -1.8 : 0), b - 2] as [number, number]);
  poly(ctx, [...near.flat(), ...[...far].reverse().flat()], '#3a2414');
  const keel = [...near, [x + w * 0.86, y - 0.6], [x + w * 0.5, y + 2.6], [x, y + 3.2], [x - w * 0.5, y + 2.8], [x - w * 0.96, y - 0.4]] as [number, number][];
  return { draw: () => {
    poly(ctx, keel.flat(), '#4a2c18');
    poly(ctx, [...near.flat(), x + w * 0.9, y - 2.6, x, y - 2, x - w * 0.9, y - 2.4], '#7a4a26');
    line(ctx, x - w * 0.94, y - 0.6, x + w * 0.86, y - 0.8, '#1e140c', 0.7);
    if (paint === 'none') return;
    // a band along the topsides: plain green, or a chequer of green and white squares as on the Indies galleons
    for (let i = 1; i < 12; i++) {
      const [a0, b0] = near[i], [a1, b1] = near[i + 1];
      const c = paint === 'band' ? GREEN : i % 2 ? GREEN : WHITE;
      poly(ctx, [a0, b0 + 1, a1, b1 + 1, a1, b1 + 2.6, a0, b0 + 2.6], c);
    }
    ctx.strokeStyle = ink(GOLD);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    near.forEach(([a, b], i) => (i ? ctx.lineTo(a, b + 3) : ctx.moveTo(a, b + 3)));
    ctx.stroke();
  } };
}

function deckCastle(ctx: Ctx, x: number, y: number, w: number, h: number, windows: boolean) {
  box(ctx, x, y, w, h, '#7a4a26', '#9a6a40');
  band(ctx, x, y, w, h, 0.62, 0.78, GREEN);
  band(ctx, x, y, w, h, 0.78, 0.84, GOLD);
  if (windows) for (const u of [0.25, 0.6]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.14, 0.24, 0.48, '#f0c860');
  for (let i = 0; i < 5; i++) faceQuad(ctx, 'L', x, y - h, w, 1.6, i / 5 + 0.04, i / 5 + 0.1, 0, 1, '#5a3418');
}

/** The caravela latina: a slim low hull, three masts of lateen sails with the red cross, a little stern deck. */
function caravel(ctx: Ctx, x: number, y: number) {
  const w = 18;
  const top = (t: number) => y - 4 - (t < 0 ? Math.pow(-t, 2) * 4.2 : Math.pow(t, 3) * 3);
  const h = hull(ctx, x, y, w, top, 'band');
  line(ctx, x + 6, y - 4, x + 6, y - 26, WOOD_D, 1.1);
  line(ctx, x - 3, y - 4, x - 3, y - 22, WOOD_D, 1);
  line(ctx, x - 11, y - 4, x - 11, y - 17, WOOD_D, 0.8);
  lateen(ctx, x - 11, y - 9, 8, 8, false);
  lateen(ctx, x - 3, y - 11, 12, 13, true);
  lateen(ctx, x + 6, y - 13, 14, 15, true);
  figure(ctx, 'archer', 'portugal', x + 11, y - 4.4, 0.4, true);
  h.draw();
  deckCastle(ctx, x - w * 0.8, y - 4.4, 5.4, 2.6, false);
  poly(ctx, [x + 6, y - 26, x + 12.6, y - 25.4, x + 10.4, y - 24.6, x + 12.6, y - 23.8, x + 6, y - 23.6], RED); // a long pennant
  poly(ctx, [x + 6, y - 26, x + 9, y - 25.7, x + 9, y - 23.8, x + 6, y - 23.6], GREEN);
  line(ctx, x - w + 1.4, top(-1) + 1.4, x - w - 1.4, y + 4.4, WOOD, 1);
  foam(ctx, x, y + 3.2, w * 0.86);
}

/** The nau: a round-bellied carrack, high castles fore and aft, square courses with the cross and a lateen mizzen. */
function nau(ctx: Ctx, x: number, y: number) {
  const w = 21;
  const top = (t: number) => y - 4.8 - (t < 0 ? Math.pow(-t, 2) * 5 : Math.pow(t, 2.4) * 4.4);
  const h = hull(ctx, x, y, w, top, 'band');
  line(ctx, x + 2, y - 5, x + 2, y - 37, WOOD_D, 1.2);
  line(ctx, x + 12, y - 6, x + 12.6, y - 27, WOOD_D, 1);
  line(ctx, x - 10, y - 6, x - 10, y - 24, WOOD_D, 0.9);
  for (const [a, b] of [[x - 18, y - 6], [x + 20, y - 7]] as const) line(ctx, a, b, x + 2, y - 36, 'rgba(60,40,24,0.55)', 0.4);
  lateen(ctx, x - 10, y - 12, 10, 10, false);
  squareSail(ctx, x + 2, y - 34, 13, 8, false);
  squareSail(ctx, x + 2, y - 24, 19, 13, true);
  squareSail(ctx, x + 12.3, y - 24, 10, 10, true);
  ellipse(ctx, x + 2, y - 37.6, 2, 0.9, '#5a3418');
  flag(ctx, x + 2, y - 43, 7, 4.6, 0.4);
  line(ctx, x + 2, y - 37, x + 2, y - 43, WOOD_D, 0.6);
  h.draw();
  deckCastle(ctx, x - w * 0.72, y - 5.2, 9, 5.4, true);
  deckCastle(ctx, x + w * 0.72, y - 5.6, 7, 4.4, false);
  figure(ctx, 'explorer', 'portugal', x - w * 0.72, y - 10.8, 0.36, true);
  line(ctx, x + w * 0.9, top(0.9) - 3, x + w + 6, top(1) - 8, WOOD_D, 0.9);
  line(ctx, x - w + 1.4, top(-1) + 1.4, x - w - 1.4, y + 4.4, WOOD, 1.1);
  foam(ctx, x, y + 3.2, w * 0.86);
}

/** The galleon: long and tall, a chequered hull of green and white with gunports, four masts, the cross on its courses. */
function galleon(ctx: Ctx, x: number, y: number) {
  const w = 27;
  const top = (t: number) => y - 5.4 - (t < 0 ? Math.pow(-t, 2.4) * 6.4 : Math.pow(t, 3) * 2.6);
  const h = hull(ctx, x, y, w, top, 'chequer');
  line(ctx, x + 1, y - 5, x + 1, y - 47, WOOD_D, 1.4);
  line(ctx, x + 14, y - 6, x + 14.4, y - 37, WOOD_D, 1.1);
  line(ctx, x - 12, y - 7, x - 12, y - 32, WOOD_D, 1);
  line(ctx, x - 21, y - 9, x - 21, y - 27, WOOD_D, 0.8); // the bonaventure mizzen
  for (const [a, b, c, d] of [[x - 26, y - 8, x + 1, y - 46], [x + 30, y - 9, x + 14.4, y - 36], [x + 30, y - 9, x + 1, y - 46]] as const) line(ctx, a, b, c, d, 'rgba(60,40,24,0.55)', 0.4);
  lateen(ctx, x - 21, y - 15, 9, 8, false);
  lateen(ctx, x - 12, y - 17, 12, 12, false);
  squareSail(ctx, x + 1, y - 44, 14, 9, false);
  squareSail(ctx, x + 1, y - 32.6, 21, 15, true);
  squareSail(ctx, x + 14.2, y - 34, 10, 7.4, false);
  squareSail(ctx, x + 14, y - 25, 14, 10, true);
  ellipse(ctx, x + 1, y - 35.4, 2.4, 1, '#5a3418');
  ellipse(ctx, x + 14.2, y - 26.4, 2, 0.9, '#5a3418');
  line(ctx, x + 1, y - 47, x + 1, y - 52, WOOD_D, 0.8);
  flag(ctx, x + 1, y - 52, 10, 6.4, 0.6);
  poly(ctx, [x + 14.4, y - 37, x + 26, y - 36, x + 14.4, y - 35.4], GREEN);
  poly(ctx, [x - 12, y - 32, x - 3, y - 31.2, x - 12, y - 30.6], RED);
  h.draw();
  for (let i = 0; i < 6; i++) { // gunports with the muzzles run out
    const t = -0.5 + i * 0.2, px = x + t * w, py = top(t) + 4.6;
    poly(ctx, [px - 1.2, py - 1, px + 1.2, py - 1, px + 1.2, py + 1, px - 1.2, py + 1], '#1a100a');
    line(ctx, px + 0.2, py, px + 1.6, py + 0.8, BRONZE_D, 1);
  }
  deckCastle(ctx, x - w * 0.7, y - 6.4, 12, 7, true);
  deckCastle(ctx, x - w * 0.8, y - 13.4, 8, 4.4, true);
  for (const d of [-1, 1]) {
    const lx = x - w * 0.8 + d * 3.4, ly = y - 20.4;
    line(ctx, lx, ly + 2.4, lx, ly + 0.8, '#3a2a20', 0.5);
    ellipse(ctx, lx, ly, 1, 1.4, '#ffd060');
    ellipse(ctx, lx, ly - 1.4, 0.8, 0.4, GOLD_D);
  }
  deckCastle(ctx, x + w * 0.66, y - 5.8, 7, 3.8, false);
  figure(ctx, 'swordsman', 'portugal', x - w * 0.8, y - 17.8, 0.34, true);
  figure(ctx, 'archer', 'portugal', x + w * 0.66, y - 9.6, 0.34, true);
  poly(ctx, [x + w * 0.9, top(0.9) + 1, x + w + 5, top(1) + 1.6, x + w + 4.6, top(1) + 3, x + w * 0.88, top(0.88) + 4], '#7a4a26');
  line(ctx, x + w * 0.9, top(0.9) - 2, x + w + 8, top(1) - 9, WOOD_D, 1);
  line(ctx, x - w + 1.4, top(-1) + 2, x - w - 1.6, y + 4.6, WOOD, 1.2);
  foam(ctx, x, y + 3.2, w * 0.88);
}

// ---------------------------------------------------------------- buildings

/** A point on face 'L' or 'R' of a box (u along the face, v up it). */
const onFace = (f: 'L' | 'R', cx: number, cy: number, w: number, h: number, u: number, v: number): [number, number] => f === 'R'
  ? [cx + (u * w) / 2, cy + (w / 4) * (1 - u) - v * h]
  : [cx - w / 2 + (u * w) / 2, cy + (w / 4) * u - v * h];

/** A terracotta roof over a box, with courses of tiles. */
function tileRoof(ctx: Ctx, x: number, y: number, w: number, h: number, roofC: string) {
  roof(ctx, x, y, w, h, roofC);
  const hw = w / 2, hh = w / 4;
  for (let i = 1; i < 5; i++) {
    const t = i / 5;
    line(ctx, x - hw * t, y + hh * t, x, y - h, shade(roofC, 0.18), 0.3);
    line(ctx, x + hw * t, y + hh * t, x, y - h, shade(roofC, -0.32), 0.3);
  }
  for (let i = 1; i < 4; i++) {
    const t = i / 4;
    line(ctx, x - hw + hw * t, y - h * t, x, y + hh - (hh + h) * t, shade(roofC, -0.2), 0.35);
    line(ctx, x + hw - hw * t, y - h * t, x, y + hh - (hh + h) * t, shade(roofC, -0.4), 0.35);
  }
  line(ctx, x - hw, y, x, y + hh, shade(roofC, 0.3), 0.4); // the white-pointed eaves
}

/** An arched opening on a face. */
function arch(ctx: Ctx, f: 'L' | 'R', cx: number, cy: number, w: number, h: number, u: number, du: number, v0: number, v1: number, c: string) {
  faceQuad(ctx, f, cx, cy, w, h, u, u + du, v0, v1, c);
  const [ax, ay] = onFace(f, cx, cy, w, h, u + du / 2, v1);
  const r = (du * w) / 4;
  ctx.beginPath();
  ctx.ellipse(ax, ay, r, r * 1.1, f === 'R' ? -0.46 : 0.46, Math.PI, Math.PI * 2);
  ctx.fillStyle = ink(f === 'R' ? shade(c, -0.2) : shade(c, 0.06));
  ctx.fill();
}

/** A panel of blue-and-white azulejos on a face: a tiled field with a darker frame and a pattern of little blue motifs. */
function azulejos(ctx: Ctx, f: 'L' | 'R', cx: number, cy: number, w: number, h: number, u0: number, u1: number, v0: number, v1: number) {
  faceQuad(ctx, f, cx, cy, w, h, u0, u1, v0, v1, AZUL);
  const nu = Math.max(2, Math.round((u1 - u0) * w / 1.6)), nv = Math.max(2, Math.round((v1 - v0) * h / 1.6));
  const du = (u1 - u0) / nu, dv = (v1 - v0) / nv;
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = u0 + i * du, b = v0 + j * dv;
    faceQuad(ctx, f, cx, cy, w, h, a + du * 0.1, a + du * 0.9, b + dv * 0.1, b + dv * 0.9, (i + j) % 2 ? '#e8eef8' : AZUL_L);
    faceQuad(ctx, f, cx, cy, w, h, a + du * 0.38, a + du * 0.62, b + dv * 0.38, b + dv * 0.62, AZUL_D);
  }
  // the frame
  faceQuad(ctx, f, cx, cy, w, h, u0, u1, v1 - 0.03, v1, AZUL_D);
  faceQuad(ctx, f, cx, cy, w, h, u0, u1, v0, v0 + 0.03, AZUL_D);
}

/** A lacy Algarve chimney: a slim white shaft with a pierced lantern and a little pointed cap. */
function chimney(ctx: Ctx, x: number, y: number) {
  box(ctx, x, y, 1.1, 1.8, WASH);
  box(ctx, x, y - 1.8, 1.7, 1.4, WASH);
  for (const d of [-0.4, 0.4]) ellipse(ctx, x + d, y - 2.6, 0.18, 0.32, '#4a4a54');
  poly(ctx, [x - 1, y - 3.3, x, y - 4.6, x + 1, y - 3.3, x, y - 2.9], WASH);
  ellipse(ctx, x, y - 4.8, 0.25, 0.25, WASH);
}

/** A whitewashed Portuguese house: an ochre (or blue) painted plinth and corners, an azulejo panel, green shutters. */
function house(ctx: Ctx, x: number, y: number, w: number, h: number, roofC: string, look: 'tiles' | 'shutters' | 'balcony' | 'plain') {
  const trim = look === 'shutters' ? AZUL : OCHRE;
  box(ctx, x, y, w, h, WASH, '#efeae0');
  band(ctx, x, y, w, h, 0, 0.12, trim); // the painted plinth (barra)
  for (const f of ['L', 'R'] as const) { // painted corners (cunhais)
    faceQuad(ctx, f, x, y, w, h, 0, 0.07, 0.12, 1, trim);
    faceQuad(ctx, f, x, y, w, h, 0.93, 1, 0.12, 1, trim);
  }
  band(ctx, x, y, w, h, 0.92, 1, trim); // the cornice
  // the door, framed in stone
  faceQuad(ctx, 'R', x, y, w, h, 0.36, 0.6, 0.0, 0.5, '#d8d0c0');
  faceQuad(ctx, 'R', x, y, w, h, 0.4, 0.56, 0.0, 0.44, look === 'shutters' ? '#2a5a3a' : '#5a3418');
  if (look === 'tiles') azulejos(ctx, 'L', x, y, w, h, 0.2, 0.8, 0.2, 0.82); // a tiled side
  else if (look === 'balcony') { // an iron balcony upstairs, with pots
    faceQuad(ctx, 'R', x, y, w, h, 0.3, 0.62, 0.6, 0.86, '#2a3a4a');
    const [ax, ay] = onFace('R', x, y, w, h, 0.24, 0.58), [bx, by] = onFace('R', x, y, w, h, 0.68, 0.58);
    poly(ctx, [ax, ay, bx, by, bx + 1.4, by + 0.8, ax + 1.4, ay + 0.8], '#3a3a40');
    line(ctx, ax + 0.7, ay - 2.4, bx + 0.7, by - 2.4, '#1a1a20', 0.5);
    for (let i = 0; i <= 5; i++) { const t = i / 5; line(ctx, ax + 0.7 + (bx - ax) * t, ay + 0.4 + (by - ay) * t, ax + 0.7 + (bx - ax) * t, ay - 2.4 + (by - ay) * t, '#1a1a20', 0.3); }
    for (const t of [0.15, 0.8]) { const px = ax + (bx - ax) * t + 0.7, py = ay + (by - ay) * t - 2.6; ellipse(ctx, px, py, 0.9, 0.7, '#3a8a3a'); ellipse(ctx, px, py - 0.4, 0.45, 0.45, RED_L); }
    faceQuad(ctx, 'L', x, y, w, h, 0.35, 0.65, 0.5, 0.75, '#2a3a4a');
  } else {
    // windows with green shutters, upstairs and down
    for (const u of [0.1, 0.72]) {
      faceQuad(ctx, 'R', x, y, w, h, u, u + 0.18, 0.56, 0.8, '#2a3a4a');
      faceQuad(ctx, 'R', x, y, w, h, u - 0.04, u, 0.56, 0.8, GREEN);
      faceQuad(ctx, 'R', x, y, w, h, u + 0.18, u + 0.22, 0.56, 0.8, GREEN);
    }
    faceQuad(ctx, 'L', x, y, w, h, 0.36, 0.56, 0.5, 0.74, '#3a4a5a');
    if (look === 'shutters') azulejos(ctx, 'R', x, y, w, h, 0.1, 0.92, 0.86, 0.92); // a tiled frieze under the eaves
  }
  tileRoof(ctx, x, y - h, w + 1.6, w * 0.3, roofC);
  if (look !== 'balcony') chimney(ctx, x + w * 0.16, y - h - w * 0.06);
}

/** A rope-twist moulding (the Manueline cordame): a twisted cable along a line. */
function rope(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, c: string, wd: number) {
  line(ctx, x0, y0, x1, y1, shade(c, -0.2), wd);
  const n = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / (wd * 0.9)));
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 0.7) / n;
    line(ctx, x0 + (x1 - x0) * t0, y0 + (y1 - y0) * t0 - wd * 0.3, x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1 + wd * 0.3, shade(c, 0.22), wd * 0.32);
  }
}

/** The rope moulding round both visible faces of a box at height v. */
function ropeBand(ctx: Ctx, x: number, y: number, w: number, h: number, v: number, c: string, wd: number) {
  rope(ctx, ...onFace('L', x, y, w, h, 0, v), ...onFace('L', x, y, w, h, 1, v), c, wd);
  rope(ctx, ...onFace('R', x, y, w, h, 0, v), ...onFace('R', x, y, w, h, 1, v), c, wd);
}

/** A garita: a round corner turret with a ribbed dome, as on the bastion of Belém. */
function garita(ctx: Ctx, x: number, y: number, r: number, hgt: number) {
  poly(ctx, [x - r, y, x - r, y - hgt, x + r, y - hgt, x + r, y], LIOZ);
  poly(ctx, [x + 0.2, y + 0.4, x + 0.2, y - hgt, x + r, y - hgt, x + r, y], shade(LIOZ, -0.18));
  ellipse(ctx, x, y, r, r * 0.4, shade(LIOZ, -0.08));
  rope(ctx, x - r, y - hgt * 0.4, x + r, y - hgt * 0.4, LIOZ, 0.6);
  line(ctx, x - r * 0.2, y - hgt * 0.5, x - r * 0.2, y - hgt * 0.85, '#2a2420', 0.5); // a slit
  dome(ctx, x, y - hgt, r * 1.05, r * 1.3, LIOZ);
  for (const d of [-0.5, 0, 0.5]) curve(ctx, x + d * r, y - hgt, x + d * r * 0.7, y - hgt - r * 1, x, y - hgt - r * 1.3, 0.3, shade(LIOZ, -0.25)); // the ribs
  ellipse(ctx, x, y - hgt - r * 1.4, 0.45, 0.6, shade(LIOZ, -0.1)); // a finial
}

/** A crenellation of shield-shaped merlons along a face line. */
function shieldMerlons(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, n: number, s: number) {
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, mx = x0 + (x1 - x0) * t, my = y0 + (y1 - y0) * t;
    poly(ctx, [mx - s, my, mx - s, my - s * 1.4, mx + s, my - s * 1.4, mx + s, my, mx, my + s * 0.4], LIOZ);
    poly(ctx, [mx, my + s * 0.4, mx, my - s * 1.4, mx + s, my - s * 1.4, mx + s, my], shade(LIOZ, -0.16));
    line(ctx, mx, my - s * 1.2, mx, my, shade(LIOZ, -0.3), 0.25);
    line(ctx, mx - s * 0.7, my - s * 0.6, mx + s * 0.7, my - s * 0.6, shade(LIOZ, -0.3), 0.25);
  }
}

/** The capital: a Manueline tower standing in the water (Belém), and behind it the arcaded cloister of a monastery. */
function capitalTower(ctx: Ctx, x: number, y: number, roofC: string) {
  // ---- the water at its foot: a little tidal shore along the front left
  poly(ctx, [x - 30, y + 2, x - 8, y + 13, x + 2, y + 16, x - 24, y + 16, x - 32, y + 8], '#3a8ac8');
  poly(ctx, [x - 30, y + 2, x - 8, y + 13, x - 6, y + 12, x - 28, y + 1], '#8ad0ea');
  for (const [dx, dy] of [[-24, 9], [-16, 13], [-26, 13]] as const) curve(ctx, x + dx, y + dy, x + dx + 2, y + dy - 1, x + dx + 4, y + dy, 0.5, 'rgba(255,255,255,0.7)');
  // ---- the cloister behind, right: a square court ringed by two storeys of arcades (the Jerónimos)
  const cx = x + 10, cy = y - 6;
  box(ctx, cx, cy, 24, 4, shade(LIOZ, -0.06), '#c8d898'); // the garth lawn, with the low wall round it
  box(ctx, cx + 6, cy - 3, 12, 9, LIOZ); // the far wing (behind)
  box(ctx, cx, cy + 3, 24, 9, LIOZ, shade(LIOZ, 0.1)); // the near ranges
  for (let i = 0; i < 5; i++) {
    arch(ctx, 'L', cx, cy + 3, 24, 9, 0.06 + i * 0.19, 0.12, 0.06, 0.4, '#6a5a44'); // ground-floor arcade
    arch(ctx, 'L', cx, cy + 3, 24, 9, 0.08 + i * 0.19, 0.08, 0.56, 0.82, '#7a6a52'); // the upper gallery
    arch(ctx, 'R', cx, cy + 3, 24, 9, 0.06 + i * 0.19, 0.12, 0.06, 0.4, '#5a4a38');
    arch(ctx, 'R', cx, cy + 3, 24, 9, 0.08 + i * 0.19, 0.08, 0.56, 0.82, '#6a5a44');
  }
  ropeBand(ctx, cx, cy + 3, 24, 9, 0.5, LIOZ, 0.7);
  for (const f of ['L', 'R'] as const) for (let i = 0; i < 6; i++) { // pinnacles along the parapet
    const [px, py] = onFace(f, cx, cy + 3, 24, 9, i / 5, 1);
    line(ctx, px, py, px, py - 2, shade(LIOZ, -0.1), 0.7);
    ellipse(ctx, px, py - 2.2, 0.4, 0.5, LIOZ);
  }
  // the church's tall south door rising behind the cloister: a gable of carved stone and a slim cupola
  box(ctx, cx + 10, cy - 8, 6, 14, LIOZ);
  arch(ctx, 'L', cx + 10, cy - 8, 6, 14, 0.2, 0.6, 0.06, 0.6, '#5a4a38');
  ropeBand(ctx, cx + 10, cy - 8, 6, 14, 0.66, LIOZ, 0.5);
  tileRoof(ctx, cx + 10, cy - 22, 7, 4, roofC);
  dome(ctx, cx + 10, cy - 25, 1.8, 3, LIOZ);
  // ---- the tower, front left, in the water
  const tx = x - 11, ty = y + 4;
  // the bastion: a low many-sided platform with shield-shaped merlons and garitas at its corners
  box(ctx, tx, ty, 18, 6, LIOZ, shade(LIOZ, 0.12));
  ropeBand(ctx, tx, ty, 18, 6, 0.55, LIOZ, 0.7);
  for (const u of [0.2, 0.5, 0.8]) faceQuad(ctx, 'R', tx, ty, 18, 6, u, u + 0.08, 0.2, 0.42, '#2a2420'); // gunports
  shieldMerlons(ctx, ...onFace('L', tx, ty, 18, 6, 0.05, 1), ...onFace('L', tx, ty, 18, 6, 0.95, 1), 5, 0.9);
  shieldMerlons(ctx, ...onFace('R', tx, ty, 18, 6, 0.05, 1), ...onFace('R', tx, ty, 18, 6, 0.95, 1), 5, 0.9);
  // the tower itself: tall and square, a loggia half way up, a balcony of arcades, rope mouldings, armillary spheres
  const T = 9.6, H = 27, bx = tx + 1, by = ty - 4;
  box(ctx, bx, by, T, H, LIOZ, shade(LIOZ, 0.12));
  ropeBand(ctx, bx, by, T, H, 0.42, LIOZ, 0.6);
  ropeBand(ctx, bx, by, T, H, 0.78, LIOZ, 0.6);
  for (const f of ['L', 'R'] as const) {
    arch(ctx, f, bx, by, T, H, 0.3, 0.4, 0.14, 0.3, '#3a3028'); // a window low down
    arch(ctx, f, bx, by, T, H, 0.15, 0.3, 0.5, 0.66, '#3a3028'); // the loggia: twin arches
    arch(ctx, f, bx, by, T, H, 0.55, 0.3, 0.5, 0.66, '#3a3028');
    arch(ctx, f, bx, by, T, H, 0.35, 0.3, 0.82, 0.94, '#3a3028');
  }
  // the loggia's balcony, jutting out
  const [lx, ly] = onFace('R', bx, by, T, H, 0.5, 0.48);
  poly(ctx, [lx - 4, ly + 1, lx + 4, ly - 1, lx + 4, ly + 0.6, lx - 4, ly + 2.6], shade(LIOZ, -0.2));
  for (let i = 0; i < 5; i++) { const t = i / 4; line(ctx, lx - 4 + 8 * t, ly + 1 - 2 * t, lx - 4 + 8 * t, ly - 1.4 - 2 * t, LIOZ, 0.5); }
  line(ctx, lx - 4, ly - 1.4, lx + 4, ly - 3.4, LIOZ, 0.6);
  for (const [u, v] of [[0.5, 0.36], [0.5, 0.72]] as const) { // carved armillary spheres
    const [ax, ay] = onFace('L', bx, by, T, H, u, v);
    armillary(ctx, ax, ay, 1.1, shade(LIOZ, -0.35));
  }
  // the crown: shield merlons and four garitas, a little roof terrace
  shieldMerlons(ctx, ...onFace('L', bx, by, T, H, 0.08, 1), ...onFace('L', bx, by, T, H, 0.92, 1), 3, 0.7);
  shieldMerlons(ctx, ...onFace('R', bx, by, T, H, 0.08, 1), ...onFace('R', bx, by, T, H, 0.92, 1), 3, 0.7);
  for (const [u, f] of [[0, 'L'], [1, 'R'], [0, 'R']] as const) { const [gx, gy] = onFace(f, bx, by, T, H, u, 1); garita(ctx, gx, gy + 0.6, 1.2, 2.4); }
  for (const [u, f] of [[0, 'L'], [1, 'R'], [0.02, 'R']] as const) { const [gx, gy] = onFace(f, tx, ty, 18, 6, u, 1); garita(ctx, gx, gy + 0.6, 1.4, 3); }
  // the flag on the tower
  const [fx, fy] = onFace('R', bx, by, T, H, 0, 1);
  line(ctx, fx, fy - 1, fx, fy - 13, WOOD_D, 0.7);
  flag(ctx, fx, fy - 13, 9, 6, 0.6);
}

/** A Portuguese church: whitewashed with ochre pilasters, a blue-tiled façade, a scrolled gable and one bell tower. */
function church(ctx: Ctx, x: number, y: number, roofC: string) {
  // the bell tower at the back corner
  const tx = x - 8, ty = y - 4;
  box(ctx, tx, ty, 6, 17, WASH);
  for (const f of ['L', 'R'] as const) {
    faceQuad(ctx, f, tx, ty, 6, 17, 0, 0.1, 0, 1, OCHRE);
    faceQuad(ctx, f, tx, ty, 6, 17, 0.9, 1, 0, 1, OCHRE);
    arch(ctx, f, tx, ty, 6, 17, 0.3, 0.4, 0.66, 0.86, '#2a2024');
  }
  band(ctx, tx, ty, 6, 17, 0.6, 0.64, OCHRE);
  ellipse(ctx, tx + 1.6, ty - 12, 0.9, 1.2, BRONZE);
  // an onion-ish pyramidal cap tiled in blue and white, with a little gilt ball
  poly(ctx, [tx - 3.2, ty - 17, tx, ty - 15.4, tx + 3.2, ty - 17, tx, ty - 23.4], AZUL_L);
  poly(ctx, [tx, ty - 15.4, tx + 3.2, ty - 17, tx, ty - 23.4], AZUL);
  for (let i = 1; i < 4; i++) line(ctx, tx - 3.2 + i * 0.8, ty - 17 - i * 1.6, tx + 3.2 - i * 0.8, ty - 17 - i * 1.6, '#e8eef8', 0.3);
  ellipse(ctx, tx, ty - 23.8, 0.7, 0.7, GOLD);
  // the nave
  box(ctx, x - 2, y, 14, 9, WASH, '#efeae0');
  band(ctx, x - 2, y, 14, 9, 0, 0.1, OCHRE);
  for (const f of ['L', 'R'] as const) { faceQuad(ctx, f, x - 2, y, 14, 9, 0, 0.06, 0.1, 1, OCHRE); faceQuad(ctx, f, x - 2, y, 14, 9, 0.94, 1, 0.1, 1, OCHRE); }
  azulejos(ctx, 'R', x - 2, y, 14, 9, 0.1, 0.9, 0.14, 0.86); // the tiled façade
  arch(ctx, 'R', x - 2, y, 14, 9, 0.38, 0.24, 0, 0.5, '#d8d0c0');
  arch(ctx, 'R', x - 2, y, 14, 9, 0.42, 0.16, 0, 0.44, '#4a2a18');
  for (const u of [0.2, 0.7]) faceQuad(ctx, 'L', x - 2, y, 14, 9, u, u + 0.1, 0.5, 0.76, '#3a4a5a');
  tileRoof(ctx, x - 2, y - 9, 15.4, 5, roofC);
  // the scrolled gable over the façade
  const [g0x, g0y] = onFace('R', x - 2, y, 14, 9, 0.08, 1), [g1x, g1y] = onFace('R', x - 2, y, 14, 9, 0.92, 1);
  const gmx = (g0x + g1x) / 2, gmy = (g0y + g1y) / 2;
  poly(ctx, [g0x, g0y, g0x + 1.4, g0y - 2.4, gmx - 1.6, gmy - 4.6, gmx, gmy - 6.2, gmx + 1.6, gmy - 4.6, g1x - 1.4, g1y - 2.4, g1x, g1y], WASH);
  poly(ctx, [gmx, gmy - 6.2, gmx + 1.6, gmy - 4.6, g1x - 1.4, g1y - 2.4, g1x, g1y, gmx, gmy], shade(WASH, -0.12));
  curve(ctx, g0x, g0y, g0x + 1.4, g0y - 3.2, gmx - 1.6, gmy - 4.6, 0.6, OCHRE);
  curve(ctx, g1x, g1y, g1x - 1.4, g1y - 3.2, gmx + 1.6, gmy - 4.6, 0.6, OCHRE);
  ellipse(ctx, gmx, gmy - 3, 1.1, 1.2, '#3a4a5a'); // an oculus
  ellipse(ctx, gmx, gmy - 6.8, 0.6, 0.8, OCHRE);
}

function building(ctx: Ctx, x: number, y: number, big: boolean, roofC: string, capital: boolean) {
  if (big && capital) {
    ctx.save();
    ctx.translate(x, y + 2);
    ctx.scale(0.8, 0.8);
    capitalTower(ctx, 0, 0, roofC);
    ctx.restore();
    return;
  }
  if (big) { church(ctx, x, y, roofC); return; }
  const v = ((Math.round(x) * 7 + Math.round(y) * 3) % 4 + 4) % 4;
  if (v === 0) house(ctx, x, y, 11, 9, roofC, 'tiles');
  else if (v === 1) house(ctx, x, y, 11, 8, roofC, 'shutters');
  else if (v === 2) { house(ctx, x - 2, y - 1, 8, 6, roofC, 'plain'); house(ctx, x + 4, y + 2.4, 7, 6, roofC, 'tiles'); }
  else house(ctx, x, y, 12, 10, roofC, 'balcony');
}

// ---------------------------------------------------------------- trees

function clumps(ctx: Ctx, x: number, y: number, k: number, g: string, list: readonly (readonly [number, number, number, number, number])[]) {
  for (const [dx, dy, rx, ry, c] of list) {
    ellipse(ctx, x + dx * k, y + (dy + 1) * k, rx * k, ry * k, shade(g, c - 0.22));
    ellipse(ctx, x + dx * k, y + dy * k, rx * k, ry * k, shade(g, c));
    ellipse(ctx, x + (dx - rx * 0.3) * k, y + (dy - ry * 0.32) * k, rx * 0.5 * k, ry * 0.36 * k, shade(g, c + 0.18));
  }
}

function tree(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  const type = ['cork', 'orange', 'pine', 'cork', 'umbrella', 'cork', 'orange', 'pine', 'cork'][variant % 9];
  if (type === 'cork') {
    // the cork oak (sobreiro) of the montado: the lower trunk stripped to its rust-red skin, a numeral painted on it
    // to mark the year of the harvest, grey corky bark above, crooked boughs and a broad dark crown
    const red = '#b8482a', bark = '#8a7a66', g = mix(P.forest, '#2e4a2a', 0.5);
    poly(ctx, [x - 1.8 * k, y, x - 1.4 * k, y - 6 * k, x + 1.4 * k, y - 6 * k, x + 1.8 * k, y], red);
    poly(ctx, [x + 0.2 * k, y, x + 0.2 * k, y - 6 * k, x + 1.4 * k, y - 6 * k, x + 1.8 * k, y], shade(red, -0.2));
    line(ctx, x - 1.4 * k, y - 6 * k, x + 1.4 * k, y - 6.4 * k, '#e8dcc0', 0.4 * k); // the cut line
    line(ctx, x - 0.6 * k, y - 3.6 * k, x - 0.6 * k, y - 2 * k, '#f4f0e8', 0.35 * k); // the white year mark
    line(ctx, x - 0.6 * k, y - 3.6 * k, x + 0.2 * k, y - 3.2 * k, '#f4f0e8', 0.35 * k);
    poly(ctx, [x - 1.4 * k, y - 6 * k, x - 1.6 * k, y - 8.6 * k, x + 1.6 * k, y - 8.6 * k, x + 1.4 * k, y - 6 * k], bark);
    for (let i = 0; i < 3; i++) line(ctx, x - 1 * k + i * k, y - 6.2 * k, x - 1.2 * k + i * k, y - 8.4 * k, shade(bark, -0.25), 0.3 * k);
    curve(ctx, x - 0.6 * k, y - 8 * k, x - 3.4 * k, y - 9.4 * k, x - 6.6 * k, y - 11 * k, 1.3 * k, bark);
    curve(ctx, x + 0.6 * k, y - 8 * k, x + 2.4 * k, y - 10.6 * k, x + 6 * k, y - 11.6 * k, 1.2 * k, shade(bark, -0.1));
    clumps(ctx, x, y, k, g, [[-6.6, -12.4, 4.4, 2.8, -0.12], [6.2, -12.8, 4.4, 2.8, -0.16], [0, -13.6, 6.2, 3.4, -0.04], [-3, -16, 4.4, 2.6, 0.06], [3.4, -16, 4, 2.4, 0.04], [0, -18, 3.4, 2, 0.12]]);
    for (let i = 0; i < 6; i++) { const a = rand(variant + 2, i) * Math.PI * 2, r = 2 + rand(variant + 5, i) * 6; ellipse(ctx, x + Math.cos(a) * r * k, y - 14 * k + Math.sin(a) * r * 0.45 * k, 0.4 * k, 0.5 * k, '#7a5a2a'); } // acorns
    return;
  }
  if (type === 'orange') {
    const bk = '#6a4a32', g = mix(P.forest, '#1e6a2a', 0.6);
    line(ctx, x, y, x, y - 6 * k, bk, 1.6 * k);
    line(ctx, x, y, x, y - 2.2 * k, WASH, 1.8 * k); // whitewashed against pests
    clumps(ctx, x, y, k, g, [[-3.2, -9, 3.4, 2.8, -0.1], [3.2, -9.4, 3.4, 2.8, -0.14], [0, -11.4, 4.8, 3.8, 0], [-1.2, -14, 3, 2.3, 0.1], [1.6, -13.6, 2.8, 2.2, 0.08]]);
    for (let i = 0; i < 10; i++) {
      const a = rand(variant + 3, i) * Math.PI * 2, r = 1.4 + rand(variant + 9, i) * 4;
      const ox = x + Math.cos(a) * r * k, oy = y - 11 * k + Math.sin(a) * r * 0.7 * k;
      ellipse(ctx, ox, oy, 0.85 * k, 0.85 * k, '#f39418');
      ellipse(ctx, ox - 0.3 * k, oy - 0.3 * k, 0.32 * k, 0.32 * k, '#ffc860');
    }
    // a little ring of blue azulejo-trimmed stone round its foot
    ring(ctx, x, y + 0.4 * k, 3.4 * k, 1.3 * k, AZUL, 0.6 * k, 0, Math.PI);
    return;
  }
  if (type === 'pine') {
    // a maritime pine (pinheiro-bravo): a tall, slightly leaning orange-brown trunk, tufted clumps high up
    const bk = '#a0603a', g = mix(P.forest, '#2a5a3a', 0.55);
    curve(ctx, x, y, x - 1 * k, y - 10 * k, x + 1.2 * k, y - 20 * k, 1.6 * k, shade(bk, -0.15));
    curve(ctx, x - 0.4 * k, y, x - 1.4 * k, y - 10 * k, x + 0.8 * k, y - 20 * k, 0.6 * k, shade(bk, 0.2));
    for (let i = 0; i < 5; i++) line(ctx, x - 0.8 * k, y - (2 + i * 3) * k, x + 0.4 * k, y - (2.6 + i * 3) * k, shade(bk, -0.35), 0.35 * k); // plated bark
    curve(ctx, x + 0.4 * k, y - 15 * k, x - 2.6 * k, y - 16 * k, x - 4.6 * k, y - 18 * k, 0.8 * k, bk);
    curve(ctx, x + 0.8 * k, y - 17 * k, x + 3 * k, y - 18 * k, x + 4.6 * k, y - 20 * k, 0.8 * k, bk);
    clumps(ctx, x, y, k, g, [[-4.6, -18.6, 2.8, 1.8, -0.12], [4.4, -20.4, 2.8, 1.8, -0.1], [0.8, -21.4, 3.6, 2.2, 0], [-1.6, -23.4, 2.6, 1.6, 0.08], [2.4, -24, 2.2, 1.4, 0.1]]);
    for (const [dx, dy] of [[-4, -17.2], [3, -19.2]] as const) ellipse(ctx, x + dx * k, y + dy * k, 0.6 * k, 0.8 * k, '#7a5a34'); // cones
    return;
  }
  // an umbrella (stone) pine: a bare forked trunk and a flat-topped spreading canopy
  const bk = '#8a5a3a', g = mix(P.forest, '#2e5a32', 0.5);
  curve(ctx, x, y, x - 0.6 * k, y - 8 * k, x - 3 * k, y - 14 * k, 1.4 * k, bk);
  curve(ctx, x, y - 6 * k, x + 2 * k, y - 10 * k, x + 4 * k, y - 14 * k, 1.1 * k, shade(bk, -0.12));
  ellipse(ctx, x + 0.6 * k, y - 15.6 * k, 9 * k, 2.6 * k, shade(g, -0.25));
  ellipse(ctx, x, y - 16.6 * k, 9 * k, 2.8 * k, g);
  ellipse(ctx, x - 1.6 * k, y - 17.6 * k, 6 * k, 1.6 * k, shade(g, 0.14));
  for (let i = 0; i < 8; i++) { const t = i / 7; ellipse(ctx, x - 8 * k + t * 16 * k, y - (16 + Math.sin(t * Math.PI) * 1.2) * k, 1.6 * k, 0.9 * k, shade(g, 0.06 + (i % 2) * 0.08)); }
}

// ---------------------------------------------------------------- whole units

/** The besteiro: a quiver of quarrels at the hip, then the man and his crossbow. */
function besteiro(ctx: Ctx, x: number, y: number) {
  poly(ctx, [x - 7.4, y - 10, x - 5, y - 9.4, x - 5.4, y - 3, x - 7.6, y - 3.4], LEATH);
  for (const d of [0, 0.8, 1.6]) line(ctx, x - 7 + d, y - 10, x - 7.2 + d, y - 12, '#e8dcc0', 0.5);
  const b = figure(ctx, 'archer', 'portugal', x, y, 1);
  besta(ctx, b.hand.x, b.hand.y, 1);
}

function unit(ctx: Ctx, kind: UnitKind, x: number, y: number): boolean {
  switch (kind) {
    case 'cacador': cacador(ctx, x, y); return true;
    case 'archer': besteiro(ctx, x, y); return true;
    case 'rider': ginete(ctx, x, y); return true;
    case 'knight': manAtArms(ctx, x, y); return true;
    case 'catapult': cannon(ctx, x, y); return true;
    case 'boat': caravel(ctx, x, y); return true;
    case 'ship': nau(ctx, x, y); return true;
    case 'warship': galleon(ctx, x, y); return true;
    default: return false;
  }
}

registerArt('portugal', {
  unit,
  dress: (kind) => dress(kind),
  torso,
  face,
  head,
  weapon,
  shield: (ctx, kind, x, y, k) => { rodela(ctx, kind, x, y, k); return true; },
  building,
  tree,
});

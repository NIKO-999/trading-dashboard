// The Mapuche of the south (Araucanía, the lands either side of the southern Andes), drawn from their material culture:
// the makuñ, a woven wool poncho with stepped geometric bands (the ñimin technique, its stepped lukutuwe figures) in
// dark blue, red, black and white; the chiripá, a wrap of wool cloth worn about the hips and thighs; woven garters; the
// trarilonko round the head, a woven band (set with small silver plates for those of rank) over long black hair; wool
// caps. Weapons: the very long lance of colihue cane, much longer than the man who carries it; the macana, a hardwood
// club; bows of the forest; boleadoras; captured Spanish swords and morion helmets; hide cuirasses (coletos) for the
// heavy ranks. Horses of the plains with a sheepskin (pellón) laid across them and silver bridle plates. The dalca, a
// sewn-plank canoe of the southern channels and Chiloé. Ruka houses: oval, thatched with the thatch reaching the ground,
// the doorway facing the rising sun; a rewe (a carved stepped trunk with branches of canelo tied to it) and a log
// palisade at the capital; looms (witral), corrals and gardens. Forests of araucaria (pewen), coigüe and canelo (foye).
// Sacred objects are drawn plainly and small; no machi or ceremony is shown.
import type { BiomePalette } from '../../data/tribes';
import type { UnitKind } from '../../game/types';
import { band, box, ellipse, faceQuad, ink, line, mix, poly, rand, shade, softShadow, type Ctx } from '../prims';
import { registerArt, type Body } from '../tribeart';
import { drawHorse, figure } from '../units';

// ---------------------------------------------------------------- palette

const BLUE = '#1f2f62', BLUE_L = '#3a5098'; // indigo-dark wool
const RED = '#b0242a', RED_D = '#7a1418', RED_L = '#d84a40';
const BLACK = '#1c1816';
const WOOL = '#ece2cc', WOOL_D = '#c8b896'; // undyed white wool
const GREYW = '#8a7e6c', GREYW_D = '#5e5446'; // natural brown-grey wool
const CHIRIPA = '#3a2e2a', CHIRIPA_L = '#5a4a40';
const SILVER = '#e0e4ea', SILVER_D = '#9ea4ae';
const HIDE = '#8a5a30', HIDE_D = '#5e3a1c', HIDE_L = '#b07a48';
const CANE = '#cdb878', CANE_D = '#8e7a44', CANE_L = '#e8d8a0'; // colihue
const WOOD = '#5a3a22', WOOD_D = '#3a2414', WOOD_L = '#8a6040';
const IRON = '#6a6e76', IRON_L = '#c8ccd2';
const SKIN = '#b07648', HAIR = '#100c0a';
const LOG = '#6e5236', LOG_D = '#463220', LOG_L = '#957552';
const FLEECE = '#efe6d0', FLEECE_D = '#cfc2a2';

// ---------------------------------------------------------------- small helpers

/** A point on one visible side of a box, in faceQuad's (u, v) coordinates. */
function pt(face: 'L' | 'R', cx: number, cy: number, w: number, h: number, u: number, v: number): [number, number] {
  return face === 'R' ? [cx + (u * w) / 2, cy + (w / 4) * (1 - u) - v * h] : [cx - w / 2 + (u * w) / 2, cy + (w / 4) * u - v * h];
}
function facePoly(ctx: Ctx, face: 'L' | 'R', cx: number, cy: number, w: number, h: number, pts: [number, number][], color: string) {
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
/** The guñelve, the eight-pointed morning star. */
function star8(ctx: Ctx, x: number, y: number, r: number, c: string) {
  const pts: number[] = [];
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.42 : r; pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  poly(ctx, pts, c);
}

// ---------------------------------------------------------------- dress

const HEAVY: UnitKind[] = ['defender', 'swordsman', 'knight', 'giant'];
const isHeavy = (k: UnitKind) => HEAVY.includes(k);

/** The poncho's colours: [ground, bands, steps]. */
function makun(kind: UnitKind): [string, string, string] {
  switch (kind) {
    case 'malon': return [RED, BLACK, WOOL];
    case 'rider': return [BLACK, RED, WOOL];
    case 'archer': return [GREYW, BLACK, WOOL];
    case 'explorer': return [WOOL_D, GREYW_D, RED];
    case 'giant': return [BLACK, RED, SILVER];
    default: return [BLUE, RED, WOOL];
  }
}

function dress(kind: UnitKind): [string, string, string] {
  if (isHeavy(kind)) return [HIDE, CHIRIPA, kind === 'swordsman' || kind === 'knight' ? RED : BLUE];
  const [g] = makun(kind);
  return [g, CHIRIPA, g];
}

/** A run of stepped figures (the ñimin weave) down a band on one face, between heights v0 and v1. */
function steps(ctx: Ctx, f: 'L' | 'R', x: number, y: number, w: number, h: number, u0: number, u1: number, v0: number, v1: number, c: string) {
  const n = 4, du = (u1 - u0) / 6;
  for (let i = 0; i < n; i++) {
    const vb = v0 + ((v1 - v0) * i) / n, vt = vb + (v1 - v0) / n, vm = (vb + vt) / 2, um = (u0 + u1) / 2;
    // a stepped diamond: three stacked bars, wide in the middle
    faceQuad(ctx, f, x, y, w, h, um - du * 0.6, um + du * 0.6, vt - (vt - vb) * 0.3, vt - (vt - vb) * 0.12, c);
    faceQuad(ctx, f, x, y, w, h, um - du * 2, um + du * 2, vm - (vt - vb) * 0.12, vm + (vt - vb) * 0.12, c);
    faceQuad(ctx, f, x, y, w, h, um - du * 0.6, um + du * 0.6, vb + (vt - vb) * 0.12, vb + (vt - vb) * 0.3, c);
  }
}

/** The poncho's skirt: the woven cloth hanging below the waist, with its band, stepped figures and fringe. */
function ponchoHem(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  if (isHeavy(kind)) {
    // under the cuirass, the chiripá's folds and a red-edged hem
    const c = dress(kind)[2];
    for (const f of ['L', 'R'] as const) {
      facePoly(ctx, f, x, y, w, h, [[0, 0.06], [1, 0.06], [1, -0.22], [0, -0.24]], CHIRIPA);
      faceQuad(ctx, f, x, y, w, h, 0, 1, -0.24, -0.17, c);
      for (const u of [0.25, 0.5, 0.75]) faceQuad(ctx, f, x, y, w, h, u, u + 0.04, -0.2, 0.04, CHIRIPA_L);
    }
    return;
  }
  const [g, b, s] = makun(kind);
  for (const f of ['L', 'R'] as const) facePoly(ctx, f, x, y, w, h, [[0, 0.06], [1, 0.06], [1, -0.24], [0, -0.22]], g);
  faceQuad(ctx, 'R', x, y, w, h, 0.36, 0.64, -0.24, 0.06, b); // the central band runs on down the front
  faceQuad(ctx, 'R', x, y, w, h, 0.47, 0.53, -0.2, 0.02, s);
  for (const f of ['L', 'R'] as const) {
    faceQuad(ctx, f, x, y, w, h, 0, 1, -0.2, -0.15, b); // a band along the hem
    for (let i = 0; i < 9; i++) faceQuad(ctx, f, x, y, w, h, i / 9 + 0.02, i / 9 + 0.07, -0.31, -0.22, i % 2 ? shade(g, -0.2) : s); // the fringe
  }
}

/** The leather cuirass of the heavy ranks: rows of overlapping hide, laced, with a raised collar. */
function cuirass(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  for (const f of ['L', 'R'] as const) {
    for (let r = 0; r < 4; r++) {
      const v0 = 0.08 + r * 0.2;
      faceQuad(ctx, f, x, y, w, h, 0, 1, v0, v0 + 0.2, r % 2 ? HIDE : shade(HIDE, 0.06));
      faceQuad(ctx, f, x, y, w, h, 0, 1, v0, v0 + 0.035, HIDE_D); // the lower edge of each row
      for (let i = 0; i < 5; i++) faceQuad(ctx, f, x, y, w, h, 0.08 + i * 0.2, 0.12 + i * 0.2, v0 + 0.07, v0 + 0.11, HIDE_L); // the lacing
    }
  }
  band(ctx, x, y, w, h, 0.88, 1, HIDE_D); // the collar
  faceQuad(ctx, 'R', x, y, w, h, 0.47, 0.53, 0.1, 0.88, HIDE_D); // the front lacing seam
  if (kind === 'knight' || kind === 'giant') { // a silver plaque on the chest
    const [px, py] = pt('R', x, y, w, h, 0.5, 0.6);
    ellipse(ctx, px, py, 1.6 * (w / 10), 1.3 * (w / 10), SILVER_D);
    ellipse(ctx, px - 0.2 * (w / 10), py - 0.2 * (w / 10), 1.3 * (w / 10), 1 * (w / 10), SILVER);
    star8(ctx, px - 0.2 * (w / 10), py - 0.2 * (w / 10), 0.8 * (w / 10), SILVER_D);
  }
  if (kind === 'swordsman') facePoly(ctx, 'R', x, y, w, h, [[0, 1], [0.24, 1], [1, 0.12], [0.8, 0.08]], RED); // a red sash over the shoulder
}

function torso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  if (isHeavy(kind)) { cuirass(ctx, kind, x, y, w, h); ponchoHem(ctx, kind, x, y, w, h); return; }
  const [g, b, s] = makun(kind);
  // the makuñ: a broad central band down the front, side stripes, and a slit for the head
  faceQuad(ctx, 'R', x, y, w, h, 0.34, 0.66, 0, 0.92, b);
  steps(ctx, 'R', x, y, w, h, 0.36, 0.64, 0.04, 0.88, s);
  for (const u of [0.08, 0.86]) { faceQuad(ctx, 'R', x, y, w, h, u, u + 0.07, 0, 1, b); faceQuad(ctx, 'L', x, y, w, h, u, u + 0.07, 0, 1, b); }
  faceQuad(ctx, 'L', x, y, w, h, 0.32, 0.68, 0, 1, shade(b, -0.05)); // the band runs over the shoulder and down the back
  steps(ctx, 'L', x, y, w, h, 0.34, 0.66, 0.06, 0.9, shade(s, -0.1));
  facePoly(ctx, 'R', x, y, w, h, [[0.4, 1], [0.6, 1], [0.5, 0.8]], SKIN); // the neck slit
  band(ctx, x, y, w, h, 0.95, 1, shade(g, 0.18));
  ponchoHem(ctx, kind, x, y, w, h);
  if (kind === 'archer' || kind === 'explorer') facePoly(ctx, 'R', x, y, w, h, [[0.06, 1], [0.24, 1], [0.94, 0.06], [0.76, 0.04]], HIDE_D); // a strap
}

// ---------------------------------------------------------------- the head

/** Long black hair falling down the back, from the back of the head to below the shoulders. */
function longHair(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const bx = x - hw / 2, by = top + 4 * k;
  poly(ctx, [bx + 0.2 * k, by - 1 * k, bx + 2 * k, by + 0.4 * k, bx + 1.4 * k, by + 11 * k, bx - 0.4 * k, by + 10.4 * k, bx - 0.6 * k, by + 3 * k], HAIR);
  line(ctx, bx + 0.5 * k, by + 0.6 * k, bx + 0.3 * k, by + 9.6 * k, shade(HAIR, 0.25), 0.35 * k);
}

/**
 * The trarilonko: a woven band round the brow over long hair. `plates`: small silver plates on it (for those of rank);
 * its colours: red for the war bands, blue and red otherwise.
 */
function trarilonko(ctx: Ctx, x: number, top: number, k: number, hw: number, c: string, plates: number) {
  const hy = top + 10.5 * k, hh = 10.5 * k;
  for (const f of ['L', 'R'] as const) {
    faceQuad(ctx, f, x, hy, hw, hh, 0, 1, 0.76, 0.9, c);
    for (let i = 0; i < 4; i++) faceQuad(ctx, f, x, hy, hw, hh, 0.08 + i * 0.25, 0.16 + i * 0.25, 0.8, 0.86, i % 2 ? WOOL : shade(c, -0.3)); // a woven figure
  }
  for (let i = 0; i < plates; i++) {
    const u = plates === 1 ? 0.5 : 0.15 + (i * 0.7) / (plates - 1);
    const [px, py] = pt('R', x, hy, hw, hh, u, 0.83);
    ellipse(ctx, px, py, 0.75 * k, 0.75 * k, SILVER_D);
    ellipse(ctx, px - 0.15 * k, py - 0.15 * k, 0.5 * k, 0.5 * k, SILVER);
  }
  // the band's ends tied at the back, hanging over the hair
  const [kx, ky] = pt('L', x, hy, hw, hh, 0.1, 0.82);
  line(ctx, kx, ky, kx - 1.4 * k, ky + 4 * k, c, 0.7 * k);
  line(ctx, kx + 0.4 * k, ky, kx - 0.2 * k, ky + 4.4 * k, shade(c, -0.25), 0.6 * k);
}

/** A soft wool cap, knitted, its crown slouching back over the long hair, with a woven band at the brow. */
function woolCap(ctx: Ctx, x: number, top: number, k: number, hw: number, c: string, s: string) {
  const w = hw + 0.4 * k, cy = top + 1.2 * k, rx = w / 2, ry = w / 4;
  // the slouch: the crown falls back and down behind the head
  ctx.beginPath();
  ctx.moveTo(x - rx, cy);
  ctx.quadraticCurveTo(x - rx - 1 * k, cy - 4 * k, x - rx - 3.4 * k, cy + 1.6 * k);
  ctx.quadraticCurveTo(x - rx - 2.6 * k, cy + 3.4 * k, x - rx + 1.6 * k, cy + 2 * k);
  ctx.closePath();
  ctx.fillStyle = ink(shade(c, -0.18));
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x - 0.4 * k, cy, rx + 0.2 * k, ry + 3 * k, 0, Math.PI, 0);
  ctx.ellipse(x - 0.4 * k, cy, rx + 0.2 * k, ry, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fillStyle = ink(c);
  ctx.fill();
  ellipse(ctx, x - rx * 0.4, cy - ry - 1.4 * k, rx * 0.35, 0.9 * k, 'rgba(255,255,255,0.16)');
  for (let i = 0; i < 5; i++) { const a = Math.PI * (0.15 + i * 0.17); line(ctx, x - 0.4 * k + Math.cos(a) * rx * 0.9, cy + Math.sin(a) * ry * 0.9, x - 0.4 * k + Math.cos(a) * rx * 0.5, cy - ry - 1.6 * k, shade(c, -0.12), 0.3 * k); } // the knit's ribs
  // the band at the brow, with a stepped figure
  for (const f of ['L', 'R'] as const) {
    faceQuad(ctx, f, x, top + 10.5 * k, hw, 10.5 * k, 0, 1, 0.78, 0.9, s);
    for (let i = 0; i < 4; i++) faceQuad(ctx, f, x, top + 10.5 * k, hw, 10.5 * k, 0.1 + i * 0.25, 0.18 + i * 0.25, 0.81, 0.87, i % 2 ? WOOL : BLACK);
  }
}

/** A captured Spanish morion: a steel bowl with a tall comb and a brim curving up to points at front and back. */
function morion(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const cy = top + 1.4 * k, rx = hw * 0.78, ry = hw * 0.32;
  // the brim, its ends turned up
  ctx.beginPath();
  ctx.moveTo(x - rx - 1.2 * k, cy - 2.2 * k);
  ctx.quadraticCurveTo(x - rx * 0.5, cy + ry * 1.3, x, cy + ry);
  ctx.quadraticCurveTo(x + rx * 0.5, cy + ry * 1.3, x + rx + 1.4 * k, cy - 2.4 * k);
  ctx.quadraticCurveTo(x + rx * 0.5, cy + ry * 0.1, x, cy - ry * 0.3);
  ctx.quadraticCurveTo(x - rx * 0.5, cy + ry * 0.1, x - rx - 1.2 * k, cy - 2.2 * k);
  ctx.closePath();
  ctx.fillStyle = ink(IRON);
  ctx.fill();
  // the bowl
  ctx.beginPath();
  ctx.ellipse(x, cy - 0.4 * k, rx * 0.66, 4.4 * k, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = ink(shade(IRON, 0.1));
  ctx.fill();
  ellipse(ctx, x - rx * 0.25, cy - 2.8 * k, rx * 0.22, 1.2 * k, IRON_L);
  // the comb
  ctx.beginPath();
  ctx.moveTo(x - rx * 0.55, cy - 2 * k);
  ctx.quadraticCurveTo(x, cy - 9.4 * k, x + rx * 0.55, cy - 2 * k);
  ctx.closePath();
  ctx.fillStyle = ink(shade(IRON, -0.08));
  ctx.fill();
  curve(ctx, x - rx * 0.55, cy - 2 * k, x, cy - 9.4 * k, x + rx * 0.55, cy - 2 * k, 0.5 * k, IRON_L);
  for (const d of [-0.4, 0, 0.4]) ellipse(ctx, x + d * rx, cy - 0.9 * k, 0.35 * k, 0.35 * k, '#e8d080'); // brass rivets
  // a tuft of red wool tied at the comb's end: no longer a Spanish helmet
  line(ctx, x - rx * 0.55, cy - 2.4 * k, x - rx * 0.55 - 2 * k, cy + 1.6 * k, RED, 0.9 * k);
  line(ctx, x - rx * 0.55, cy - 2.4 * k, x - rx * 0.55 - 1 * k, cy + 2 * k, RED_D, 0.6 * k);
}

function head(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  // the figure's steel shoulder guards on the heavy ranks become hide (the head is drawn after the front shoulder)
  if (isHeavy(kind)) {
    const hip = top + 19 * k;
    box(ctx, x + 6 * k, hip - 5 * k, 3.6 * k, 2.2 * k, HIDE, HIDE_L);
    faceQuad(ctx, 'R', x + 6 * k, hip - 5 * k, 3.6 * k, 2.2 * k, 0, 1, 0, 0.2, HIDE_D);
  }
  if (kind !== 'knight') longHair(ctx, x, top, k, hw);
  switch (kind) {
    case 'warrior': trarilonko(ctx, x, top, k, hw, RED, 0); break;
    case 'archer': woolCap(ctx, x, top, k, hw, GREYW_D, RED); break;
    case 'explorer': woolCap(ctx, x, top, k, hw, WOOL_D, BLUE_L); break;
    case 'defender': trarilonko(ctx, x, top, k, hw, BLUE_L, 1); break;
    case 'swordsman': trarilonko(ctx, x, top, k, hw, RED, 3); break;
    case 'rider': trarilonko(ctx, x, top, k, hw, RED, 1); break;
    case 'malon': trarilonko(ctx, x, top, k, hw, RED, 3); break;
    case 'knight': longHair(ctx, x, top, k, hw); morion(ctx, x, top, k, hw); break;
    case 'giant': trarilonko(ctx, x, top, k, hw, RED, 5); break;
    default: trarilonko(ctx, x, top, k, hw, BLUE_L, 0); break;
  }
}

// ---------------------------------------------------------------- weapons

/** A colihue lance from the butt (x0, y0) to the point (x1, y1): cane with its nodes, a narrow iron head, a wool tuft. */
function lanceTo(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, k: number, tuft = RED) {
  const len = Math.hypot(x1 - x0, y1 - y0) || 1, dx = (x1 - x0) / len, dy = (y1 - y0) / len;
  line(ctx, x0, y0, x1, y1, CANE_D, 1.2 * k);
  line(ctx, x0 - 0.3 * k, y0, x1 - 0.3 * k, y1, CANE_L, 0.45 * k);
  for (let d = 4 * k; d < len - 4 * k; d += 4.6 * k) { const px = x0 + dx * d, py = y0 + dy * d; line(ctx, px - dy * 0.8 * k, py + dx * 0.8 * k, px + dy * 0.8 * k, py - dx * 0.8 * k, CANE_D, 0.5 * k); } // the nodes
  // the point: a long narrow blade lashed into the cane
  const nx = -dy, ny = dx, L = 5 * k;
  poly(ctx, [x1 + nx * 0.7 * k, y1 + ny * 0.7 * k, x1 + dx * L, y1 + dy * L, x1 - nx * 0.7 * k, y1 - ny * 0.7 * k], IRON);
  poly(ctx, [x1, y1, x1 + dx * L, y1 + dy * L, x1 - nx * 0.7 * k, y1 - ny * 0.7 * k], IRON_L);
  line(ctx, x1 - dx * 1.4 * k, y1 - dy * 1.4 * k, x1, y1, HIDE_D, 1.4 * k); // the lashing
  // a tuft of dyed wool below the head
  const tx = x1 - dx * 2.2 * k, ty = y1 - dy * 2.2 * k;
  poly(ctx, [tx, ty, tx - 1.6 * k, ty + 3.2 * k, tx + 0.2 * k, ty + 2.4 * k, tx + 1.2 * k, ty + 3.4 * k], tuft);
}

/** The macana: a hardwood club, thickening to a heavy curved head. */
function macana(ctx: Ctx, x: number, y: number, k: number, s = 1) {
  const x0 = x - 1.2 * k, y0 = y + 3.4 * k, x1 = x + 3 * k * s, y1 = y - 10 * k * s;
  curve(ctx, x0, y0, x + 0.4 * k, y - 3 * k, x1, y1, 1.3 * k, WOOD_D);
  // the head: a broad flattened blade of wood
  const hx = x1, hy = y1;
  poly(ctx, [hx - 1.2 * k, hy + 2.4 * k * s, hx + 0.6 * k, hy + 2.8 * k * s, hx + 2.4 * k * s, hy - 2.6 * k * s, hx + 1.4 * k * s, hy - 5.2 * k * s, hx - 1.2 * k * s, hy - 4.4 * k * s, hx - 2 * k * s, hy - 1 * k * s], WOOD);
  poly(ctx, [hx - 1.2 * k, hy + 2.4 * k * s, hx - 2 * k * s, hy - 1 * k * s, hx - 1.2 * k * s, hy - 4.4 * k * s, hx - 0.4 * k * s, hy - 3.6 * k * s, hx - 0.2 * k, hy + 1.8 * k * s], WOOD_L);
  for (const t of [0.3, 0.6]) { const px = hx - 1.6 * k * s + 3.6 * k * s * t, py = hy + 1 * k * s - 5 * k * s * t; line(ctx, px - 0.8 * k, py - 0.5 * k, px + 0.8 * k, py + 0.5 * k, WOOD_D, 0.4 * k); } // carved grooves
  line(ctx, x0, y0, x0 - 0.2 * k, y0 + 1.6 * k, RED, 1.3 * k); // a wool wrist cord
}

/** A captured steel sword, a cut-and-thrust blade with a simple cross guard. */
function sword(ctx: Ctx, x: number, y: number, k: number) {
  const x0 = x, y0 = y, x1 = x + 3.4 * k, y1 = y - 14 * k;
  line(ctx, x0 - 0.6 * k, y0 + 2.4 * k, x0, y0, HIDE_D, 1.1 * k); // the grip
  ellipse(ctx, x0 - 0.7 * k, y0 + 2.8 * k, 0.8 * k, 0.8 * k, IRON); // the pommel
  line(ctx, x0 - 2 * k, y0 + 0.4 * k, x0 + 2 * k, y0 - 0.6 * k, IRON, 0.9 * k); // the cross guard
  poly(ctx, [x0 - 0.7 * k, y0, x0 + 0.7 * k, y0 - 0.2 * k, x1 + 0.2 * k, y1 + 0.6 * k, x1, y1 - 0.4 * k], IRON_L);
  line(ctx, x0, y0 - 0.1 * k, x1, y1, '#f0f2f4', 0.3 * k);
}

/** A bow of the forest, strung, with a colihue arrow nocked. */
function bow(ctx: Ctx, x: number, y: number, k: number) {
  const bx = x + 3.4 * k, top = y - 11.6 * k, bot = y + 6.8 * k;
  curve(ctx, bx - 1 * k, top, bx + 5 * k, (top + bot) / 2, bx - 1 * k, bot, 1.3 * k, WOOD_D);
  curve(ctx, bx - 1.3 * k, top, bx + 4.4 * k, (top + bot) / 2, bx - 1.3 * k, bot, 0.45 * k, WOOD_L);
  ellipse(ctx, bx + 2 * k, (top + bot) / 2, 0.8 * k, 1.5 * k, RED);
  line(ctx, bx - 1 * k, top, x - 2.4 * k, y - 2.4 * k, '#e8e0cc', 0.4 * k);
  line(ctx, bx - 1 * k, bot, x - 2.4 * k, y - 2.4 * k, '#e8e0cc', 0.4 * k);
  line(ctx, x - 3.4 * k, y - 2.2 * k, bx + 6 * k, y - 3.4 * k, CANE, 0.6 * k);
  poly(ctx, [bx + 6 * k, y - 4.2 * k, bx + 8.2 * k, y - 3.5 * k, bx + 6 * k, y - 2.6 * k], '#3a3634'); // an obsidian point
  poly(ctx, [x - 3.4 * k, y - 2.2 * k, x - 1.4 * k, y - 2.6 * k, x - 1.6 * k, y - 3.6 * k], '#2a2420');
}

/** A quiver of hide on the back, the colihue arrows showing. */
function quiver(ctx: Ctx, x: number, y: number, k: number) {
  const qx = x - 6.4 * k;
  box(ctx, qx, y - 8 * k, 3.2 * k, 9 * k, HIDE);
  band(ctx, qx, y - 8 * k, 3.2 * k, 9 * k, 0.8, 0.92, RED);
  band(ctx, qx, y - 8 * k, 3.2 * k, 9 * k, 0.3, 0.36, HIDE_D);
  for (const i of [-1, 0, 1]) {
    const tx = qx - 1.2 * k + i * 1.1 * k;
    line(ctx, qx + i * 0.7 * k, y - 17.2 * k, tx, y - 21.4 * k, CANE, 0.6 * k);
    poly(ctx, [tx, y - 21.4 * k, tx - 0.9 * k, y - 23.4 * k, tx + 0.4 * k, y - 22.2 * k], i ? '#2a2420' : WOOL);
  }
}

/** Boleadoras: three stones in hide on cords from the hand, swung. */
function bolas(ctx: Ctx, x: number, y: number, k: number) {
  const cx = x + 2 * k, cy = y - 9 * k;
  line(ctx, x, y, cx, cy, HIDE_D, 0.5 * k);
  for (const [dx, dy] of [[-4.6, -2.4], [3.6, -4.4], [4.6, 2.2]] as const) {
    line(ctx, cx, cy, cx + dx * k, cy + dy * k, HIDE_D, 0.4 * k);
    ellipse(ctx, cx + dx * k, cy + dy * k, 1.2 * k, 1.1 * k, HIDE);
    ellipse(ctx, cx + dx * k - 0.3 * k, cy + dy * k - 0.3 * k, 0.5 * k, 0.4 * k, HIDE_L);
  }
  ring(ctx, cx, cy, 5.6 * k, 2.8 * k, 'rgba(255,255,255,0.35)', 0.4 * k, Math.PI * 1.1, Math.PI * 1.8); // the swing
}

function weapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  switch (kind) {
    case 'warrior': macana(ctx, x, y, k); return true;
    case 'giant': macana(ctx, x, y, k, 1.3); return true;
    case 'archer': bow(ctx, x, y, k); return true;
    case 'defender': lanceTo(ctx, x - 2.4 * k, y + 8 * k, x + 4.6 * k, y - 34 * k, k); return true;
    case 'swordsman': sword(ctx, x, y, k); return true;
    case 'explorer': bolas(ctx, x, y, k); return true;
  }
  return false;
}

function shield(): boolean {
  return true; // the Mapuche fought without shields: the long lance kept the enemy off
}

// ---------------------------------------------------------------- figures on foot

const LEGS = [[-2.2, -0.3, 'L'], [2.2, 0.7, 'R'], [2.2, 0.7, 'L']] as const;

/** The chiripá wrapped to the knee, bare calves with a woven garter, and soft hide foot wraps. */
function legs(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  for (const [dx, dy, f] of LEGS) {
    const q = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, u0, u1, v0, v1, c);
    q(0, 1, 0.2, 0.62, SKIN); // bare calves (covers the shared figure's trousers and greaves)
    q(0, 1, 0.56, 1, CHIRIPA); // the chiripá's folds about the thigh and knee
    q(0, 1, 0.56, 0.62, shade(CHIRIPA, -0.3));
    q(0.3, 0.42, 0.62, 1, CHIRIPA_L);
    q(0, 1, 0.42, 0.48, isHeavy(kind) ? RED : RED_L); // a woven garter
    q(0, 1, 0, 0.22, HIDE); // hide foot wraps
    q(0, 1, 0.18, 0.24, HIDE_D);
  }
  faceQuad(ctx, 'R', x + 2.2 * k, y + 0.7 * k, 3.6 * k, 5.2 * k, 0, 0.35, 0, 0.13, HIDE_D);
}

function footUnit(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  if (kind === 'archer') quiver(ctx, x, y, k);
  const b = figure(ctx, kind, 'mapuche', x, y, k);
  legs(ctx, kind, x, y, k);
  ponchoHem(ctx, kind, x, y - 5 * k, 10 * k, 8.5 * k);
  weapon(ctx, kind, b, k);
}

// ---------------------------------------------------------------- riders

/** A sheepskin (pellón) laid across the horse's back. */
function pellon(ctx: Ctx, x: number, y: number) {
  poly(ctx, [x - 6, y - 0.8, x + 5, y - 1.4, x + 5.8, y + 6.4, x - 6.4, y + 7.2], FLEECE_D);
  for (let i = 0; i < 11; i++) ellipse(ctx, x - 5.6 + i * 1.15, y + 6.8 - i * 0.1 + (i % 2) * 0.6, 1, 0.9, FLEECE_D); // the shaggy edge
  for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) ellipse(ctx, x - 4.8 + i * 1.6 + (r % 2) * 0.7, y + 0.6 + r * 1.9 - i * 0.1, 1.1, 0.9, r === 1 ? FLEECE : shade(FLEECE, r ? -0.04 : 0.05));
  line(ctx, x + 1, y - 1, x + 1.6, y + 7, HIDE_D, 0.6); // the cinch over it
}

/** Silver plates on the headstall and breast strap. */
function silverTack(ctx: Ctx, x: number, y: number) {
  for (const [dx, dy] of [[11.4, -18.2], [12.6, -16.6], [8.6, -8.4], [6.6, -7.2], [4.6, -6.6]] as const) {
    ellipse(ctx, x + dx, y + dy, 0.75, 0.75, SILVER_D);
    ellipse(ctx, x + dx - 0.15, y + dy - 0.15, 0.5, 0.5, SILVER);
  }
}

function rider(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  const malon = kind === 'malon', knight = kind === 'knight';
  const coat = malon ? '#8a6a44' : knight ? '#2a1e18' : '#6a3e22';
  const mane = malon ? '#2a1e14' : '#120c08';
  const saddle = drawHorse(ctx, x - 1, y + 3, 0.92, coat, mane, undefined, malon ? RED : knight ? BLACK : BLUE);
  if (malon) { // a pinto of the plains with a pale blaze, ridden on a sheepskin
    const x0 = x - 1, y0 = y + 3;
    for (const [dx, dy, rx, ry] of [[-5.6, -8.4, 2.6, 2], [4.6, -7.4, 2.2, 2.4], [-1, -4.8, 2.4, 1.2], [8.4, -10.6, 1.4, 1.8]] as const) ellipse(ctx, x0 + dx, y0 + dy, rx, ry, '#efe6d6');
    line(ctx, x + 13.6, y - 13.8, x + 15.6, y - 11.8, '#efe6d6', 0.9);
    pellon(ctx, saddle.x, saddle.y - 0.6);
  } else {
    // a woven blanket (pontro) with stepped figures, under a hide pad
    poly(ctx, [saddle.x - 4, saddle.y + 1.2, saddle.x + 3.2, saddle.y + 0.8, saddle.x + 3.6, saddle.y + 5, saddle.x - 3.6, saddle.y + 5.6], knight ? RED : BLUE);
    line(ctx, saddle.x - 3.7, saddle.y + 4.4, saddle.x + 3.5, saddle.y + 3.8, WOOL, 0.8);
    for (let i = 0; i < 3; i++) poly(ctx, [saddle.x - 2.4 + i * 2.4, saddle.y + 2.4, saddle.x - 1.6 + i * 2.4, saddle.y + 1.8, saddle.x - 0.8 + i * 2.4, saddle.y + 2.4, saddle.x - 1.6 + i * 2.4, saddle.y + 3], WOOL);
  }
  if (knight || malon) silverTack(ctx, x, y);
  const b = figure(ctx, kind, 'mapuche', saddle.x, saddle.y, 0.9, true);
  // the lance: very long, couched forward and up, far longer than the rider
  const reach = malon ? 52 : knight ? 44 : 38;
  const ang = malon ? -1.2 : -1.25;
  const hx = b.hand.x, hy = b.hand.y + 0.4;
  lanceTo(ctx, hx - Math.cos(ang) * 8, hy - Math.sin(ang) * 8, hx + Math.cos(ang) * reach, hy + Math.sin(ang) * reach, 0.9, malon ? RED : knight ? WOOL : RED);
  ellipse(ctx, hx, hy, 1.1, 1, SKIN); // the fist round the cane
}

// ---------------------------------------------------------------- the siege engine

/**
 * A simple traction engine: a long throwing beam of lashed poles pivoting on two log trestles, a sling at its long end,
 * pulled down by a crew on hide ropes at the short end.
 */
function engine(ctx: Ctx, x: number, y: number) {
  softShadow(ctx, x, y + 2, 18, 6, 0.28);
  const P3 = (u: number, v: number, z: number): [number, number] => [x + u - v, y + (u + v) / 2 - z];
  // the base frame of logs
  for (const v of [-4, 4]) line(ctx, ...P3(-10, v, 0), ...P3(10, v, 0), LOG_D, 2.2);
  for (const u of [-8, 8]) line(ctx, ...P3(u, -5, 0), ...P3(u, 5, 0), LOG, 1.8);
  // the trestles: two A-frames, lashed with rawhide
  const H = 13;
  for (const v of [-4, 4]) {
    for (const u of [-5, 5]) line(ctx, ...P3(u, v, 0), ...P3(0, v, H), v < 0 ? LOG_D : LOG, 1.4);
    const [lx, ly] = P3(0, v, H);
    ellipse(ctx, lx, ly, 1, 0.8, HIDE_D);
  }
  line(ctx, ...P3(0, -4, H), ...P3(0, 4, H), LOG_D, 1.4); // the axle
  // the beam: the short end down by the crew, the long end raised with its sling
  const a = P3(5.5, 0, H - 5), bb = P3(-14, 0, H + 12);
  line(ctx, a[0], a[1], bb[0], bb[1], LOG_D, 2.4);
  line(ctx, a[0] - 0.4, a[1] - 0.4, bb[0] - 0.4, bb[1] - 0.4, LOG_L, 0.8);
  for (const t of [0.3, 0.55]) { const px = a[0] + (bb[0] - a[0]) * t, py = a[1] + (bb[1] - a[1]) * t; ellipse(ctx, px, py, 1.1, 1.1, HIDE_D); } // lashings
  line(ctx, bb[0], bb[1], bb[0] + 1.6, bb[1] + 6, '#c8b088', 0.5); // the sling with its stone
  ellipse(ctx, bb[0] + 1.8, bb[1] + 6.8, 1.6, 1.4, '#8a8478');
  ellipse(ctx, bb[0] + 1.4, bb[1] + 6.4, 0.6, 0.5, '#b8b4a8');
  // a pile of stones
  for (let i = 0; i < 5; i++) { const [sx, sy] = P3(-9 + (i % 3) * 1.8, 6 + Math.floor(i / 3) * 1.6, 0); ellipse(ctx, sx, sy - 0.8, 1.4, 1.1, i % 2 ? '#8a8478' : '#a09a8c'); }
  // the crew hauling on the ropes
  for (const [u, v] of [[11, 7], [14, 2]] as const) {
    const [px, py] = P3(u, v, 0);
    const fb = figure(ctx, 'warrior', 'mapuche', px, py, 0.55);
    legs(ctx, 'warrior', px, py, 0.55);
    ponchoHem(ctx, 'warrior', px, py - 5 * 0.55, 10 * 0.55, 8.5 * 0.55);
    line(ctx, fb.hand.x, fb.hand.y, a[0], a[1], '#c8b088', 0.5);
  }
}

// ---------------------------------------------------------------- the dalca

function paddle(ctx: Ctx, x: number, y: number, len: number, phase: number) {
  const ex = x - 2 - phase * 1.6, ey = y + len;
  line(ctx, x + 0.8, y - 2.4, ex, ey, WOOD_L, 0.7);
  ellipse(ctx, ex - 0.3, ey + 0.3, 0.9, 1.7, WOOD);
  ellipse(ctx, ex - 0.3, ey + 1.6, 1.8, 0.6, 'rgba(255,255,255,0.55)');
}

/**
 * A dalca: three broad planks (a bottom and two sides bent up to meet at the pointed ends), sewn together with cane fibre
 * through rows of holes and caulked with bark. `w` its half-length; the crew drawn inside by `crew`.
 */
function dalca(ctx: Ctx, x: number, y: number, w: number, crew: (top: (t: number) => number) => void) {
  const PL = '#7a6048', PL_D = '#4e3c2c', PL_L = '#a08466';
  const top = (t: number) => y - 3.6 - Math.pow(Math.abs(t), 3) * 2.4;
  const near: [number, number][] = [];
  for (let i = 0; i <= 16; i++) { const t = -1 + i / 8; near.push([x + t * w, top(t)]); }
  const far = near.map(([px, py], i): [number, number] => [px + (i === 0 ? 1.6 : i === 16 ? -1.6 : 0), py - 2.2]);
  poly(ctx, [...near.flat(), ...[...far].reverse().flat()], '#2e2218'); // the inside of the far plank
  for (let i = 1; i < 6; i++) { const t = -0.8 + i * 0.27; line(ctx, x + t * w, top(t) - 2, x + t * w + 0.6, top(t) + 0.4, PL_L, 0.7); } // the thwarts
  crew(top);
  // the near side plank, the seam to the bottom plank, the pointed ends
  const hull = [...near, [x + w * 0.92, y - 0.6], [x + w * 0.5, y + 1.6], [x, y + 2], [x - w * 0.5, y + 1.6], [x - w * 0.92, y - 0.6]] as [number, number][];
  poly(ctx, hull.flat(), PL_D);
  poly(ctx, [...near.flat(), x + w * 0.9, y - 1.2, x, y - 0.6, x - w * 0.9, y - 1.2], PL);
  ctx.strokeStyle = ink(PL_L);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  near.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)));
  ctx.stroke();
  // the sewn seam: a line of stitches between the planks, and the bark caulking
  ctx.strokeStyle = ink('#3a2a1c');
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let i = 0; i <= 16; i++) { const t = -0.94 + (i / 16) * 1.88; const px = x + t * w, py = y - 1.2 + Math.abs(t) * -0.6; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.stroke();
  for (let i = 0; i < 18; i++) { const t = -0.88 + (i / 17) * 1.76; const px = x + t * w, py = y - 1.2 - Math.abs(t) * 0.6; line(ctx, px - 0.3, py - 0.8, px + 0.3, py + 0.6, '#d8c890', 0.35); }
  for (let i = 1; i < 16; i += 2) { const [a, b] = near[i]; line(ctx, a, b + 0.2, a + 0.2, b + 1, '#3a2a1c', 0.35); } // stitch holes at the gunwale
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y + 2, w * 0.8, 1.8, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.stroke();
}

/** A blue pennant with the white guñelve. */
function pennant(ctx: Ctx, px: number, py: number, h: number) {
  line(ctx, px, py, px, py - h, CANE_D, 0.8);
  poly(ctx, [px, py - h, px + 9, py - h + 1.6, px + 7, py - h + 3.6, px + 9, py - h + 5.8, px, py - h + 6.4], BLUE);
  star8(ctx, px + 3.4, py - h + 3.3, 2.2, WOOL);
}

function boats(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  if (kind === 'boat') {
    const w = 15;
    dalca(ctx, x, y, w, (top) => {
      for (const [t, kd] of [[-0.45, 'warrior'], [0.4, 'archer']] as const) figure(ctx, kd, 'mapuche', x + t * w, top(t) + 2.4, 0.46, true);
    });
    paddle(ctx, x - 0.45 * w + 2.6, y - 6, 8, 0);
    paddle(ctx, x + 0.4 * w + 2.6, y - 6, 8, 1);
    return;
  }
  if (kind === 'ship') {
    // a larger dalca with four paddlers and a load of bundled wool and sacks
    const w = 21;
    dalca(ctx, x, y, w, (top) => {
      box(ctx, x + 0.05 * w, top(0.05) + 1.4, 4.4, 2.8, WOOL_D, WOOL);
      band(ctx, x + 0.05 * w, top(0.05) + 1.4, 4.4, 2.8, 0.4, 0.6, RED);
      for (const [t, kd] of [[-0.66, 'warrior'], [-0.32, 'archer'], [0.32, 'warrior'], [0.64, 'archer']] as const) figure(ctx, kd, 'mapuche', x + t * w, top(t) + 2.4, 0.44, true);
    });
    for (const [t, p] of [[-0.66, 0], [-0.32, 1], [0.32, 0], [0.64, 1]] as const) paddle(ctx, x + t * w + 2.4, y - 5.8, 8, p);
    return;
  }
  // the war dalca: six paddlers, two lancers standing with their long colihue lances, and a toqui at the stern
  const w = 28;
  dalca(ctx, x, y, w, (top) => {
    const ts = [-0.6, -0.4, -0.2, 0.0, 0.2, 0.4];
    ts.forEach((t, i) => figure(ctx, i % 3 === 1 ? 'archer' : 'warrior', 'mapuche', x + t * w, top(t) + 2.4, 0.44, true));
    for (const t of [-0.1, 0.55]) {
      const b = figure(ctx, 'defender', 'mapuche', x + t * w, top(t) + 3.6, 0.42, true);
      lanceTo(ctx, b.hand.x - 2, b.hand.y + 4, b.hand.x + 5, b.hand.y - 24, 0.6);
    }
    const c = figure(ctx, 'swordsman', 'mapuche', x - 0.82 * w, top(-0.82) + 3.6, 0.46, true);
    line(ctx, c.hand.x, c.hand.y, c.hand.x + 3, c.hand.y + 7, WOOD_L, 0.8); // the steering paddle
  });
  for (let i = 0; i < 6; i++) paddle(ctx, x + (-0.6 + i * 0.2) * w + 2.4, y - 5.8, 8, i % 2);
  pennant(ctx, x + w * 0.86, y - 4, 20);
}

// ---------------------------------------------------------------- buildings

type Pt2 = [number, number];
/** Iso point at (u, v, z) from the centre: u runs down to the right (east), v down to the left, z up. */
const P = (cx: number, cy: number, u: number, v: number, z = 0): Pt2 => [cx + u - v, cy + (u + v) / 2 - z];

/**
 * A ruka: an oval house thatched from the ridge right down to the ground, its doorway at the east end (+u), smoke
 * leaving by the ridge. Half-length A (along u), half-width B, height H. The thatch is a ruled surface from the oval
 * footprint up to a ridge of half-length 0.5 A (so the ends are rounded hips), drawn strip by strip from the back,
 * lit from the upper left, with the courses of thatch and the bound ridge marked.
 */
function ruka(ctx: Ctx, cx: number, cy: number, A: number, B: number, H0: number, roofC: string, smoke = true) {
  const H = H0 * 1.3;
  const straw = mix(roofC || '#8a7a5a', '#c8a860', 0.45);
  ellipse(ctx, cx + 1.2, cy + 1, A + B * 0.6, (A + B) * 0.5, 'rgba(0,0,0,0.16)');
  const R = A * 0.5, N = 32;
  const foot = (th: number): [number, number, number] => [A * Math.cos(th), B * Math.sin(th) * (1 + 0.08 * Math.cos(th) ** 2), 0];
  const ridge = (th: number): [number, number, number] => [Math.max(-R, Math.min(R, A * Math.cos(th) * 0.92)), 0, H];
  const at = (th: number, f: number): Pt2 => { const a = foot(th), b = ridge(th); return P(cx, cy, a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f); };
  const strips = Array.from({ length: N }, (_, i) => { const t0 = (i / N) * Math.PI * 2, t1 = ((i + 1) / N) * Math.PI * 2; return { t0, t1, d: Math.cos((t0 + t1) / 2) + Math.sin((t0 + t1) / 2) }; });
  strips.sort((p, q) => p.d - q.d);
  for (const { t0, t1 } of strips) {
    const tm = (t0 + t1) / 2;
    const lit = -0.04 + 0.11 * Math.sin(tm) - 0.11 * Math.cos(tm);
    const c = shade(straw, lit);
    poly(ctx, [...at(t0, 0), ...at(t1, 0), ...at(t1, 1), ...at(t0, 1)], c);
    // a bundle edge every other strip on the visible side
    if (Math.cos(tm) + Math.sin(tm) > 0.2 && Math.round(tm * 10) % 2 === 0) { const [a, b] = at(t0, 0.05), [e, g] = at(t0, 0.9); line(ctx, a, b, e, g, shade(c, -0.12), 0.35); }
  }
  // the courses of thatch: each one's lower edge, ragged with straw ends
  const vis = (th: number) => Math.cos(th) + Math.sin(th) > -0.25;
  for (const f of [0.3, 0.58]) {
    ctx.strokeStyle = ink(shade(straw, -0.32));
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    let on = false;
    for (let i = 0; i <= 40; i++) {
      const th = -Math.PI * 0.35 + (i / 40) * Math.PI * 1.2;
      if (!vis(th)) { on = false; continue; }
      const [px, py] = at(th, f);
      if (on) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      on = true;
    }
    ctx.stroke();
    for (let i = 0; i < 14; i++) { const th = -Math.PI * 0.3 + (i / 13) * Math.PI * 1.1; const [px, py] = at(th, f); line(ctx, px, py, px + 0.1, py + 1.1, shade(straw, -0.24), 0.4); }
  }
  // the hem of straw ends at the ground
  for (let i = 0; i < 18; i++) { const th = -Math.PI * 0.3 + (i / 17) * Math.PI * 1.1; const [px, py] = at(th, 0); line(ctx, px, py, px + 0.15, py - 1.2, shade(straw, 0.12), 0.4); }
  // the ridge, bound with a roll of thatch, its ends a little raised
  const r0 = P(cx, cy, -R, 0, H), r1 = P(cx, cy, R, 0, H);
  line(ctx, r0[0], r0[1], r1[0], r1[1], shade(straw, -0.3), 2.2);
  line(ctx, r0[0], r0[1] - 0.5, r1[0], r1[1] - 0.5, shade(straw, 0.2), 1.1);
  for (let i = 1; i < 5; i++) { const t = i / 5; const px = r0[0] + (r1[0] - r0[0]) * t, py = r0[1] + (r1[1] - r0[1]) * t; line(ctx, px - 0.5, py - 0.9, px + 0.2, py + 0.9, shade(straw, -0.4), 0.45); }
  // the doorway at the east end, cut into the thatch, framed with poles and a lintel
  const dth = Math.min(0.42, 2.2 / B), dh = 0.42;
  poly(ctx, [...at(-dth, 0), ...at(dth, 0), ...at(dth * 0.85, dh), ...at(-dth * 0.85, dh)], '#1a120c');
  for (const s of [-1, 1]) { const [a, b] = at(s * dth, 0), [e, g] = at(s * dth * 0.85, dh + 0.04); line(ctx, a, b, e, g, WOOD_L, 0.6); }
  const [lx0, ly0] = at(-dth * 1.2, dh + 0.04), [lx1, ly1] = at(dth * 1.2, dh + 0.04);
  line(ctx, lx0, ly0, lx1, ly1, WOOD, 0.8);
  if (smoke) {
    const [sx, sy] = P(cx, cy, R, 0, H + 0.6); // smoke leaves by the ridge's east end
    for (let s = 0; s < 3; s++) ellipse(ctx, sx - 0.4 - s * 1.1, sy - 2 - s * 2.4, 1 + s * 0.45, 0.8 + s * 0.35, `rgba(225,225,228,${0.4 - s * 0.12})`);
  }
}


/** A run of palisade logs from (u0, v0) to (u1, v1), sharpened, bound to a rail. */
function palisade(ctx: Ctx, cx: number, cy: number, u0: number, v0: number, u1: number, v1: number, h: number, seed = 0) {
  const len = Math.hypot(u1 - u0, v1 - v0), n = Math.max(2, Math.round(len / 1.5));
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = u0 + (u1 - u0) * t, v = v0 + (v1 - v0) * t;
    const hh = h + (rand(seed + 7, i) - 0.5) * 1.6;
    const [bx, by] = P(cx, cy, u, v), [, ty] = P(cx, cy, u, v, hh);
    line(ctx, bx, by, bx, ty + 0.8, LOG_D, 1.5);
    line(ctx, bx - 0.35, by, bx - 0.35, ty + 0.8, i % 2 ? LOG : LOG_L, 0.7);
    poly(ctx, [bx - 0.75, ty + 1, bx + 0.75, ty + 1, bx, ty - 0.6], LOG_L);
  }
  for (const f of [0.3, 0.72]) line(ctx, ...P(cx, cy, u0, v0, h * f), ...P(cx, cy, u1, v1, h * f), LOG_D, 0.7);
}

/** A rail fence: posts with two rails, for a corral. */
function railFence(ctx: Ctx, cx: number, cy: number, pts: [number, number][], h = 3.4) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [u0, v0] = pts[i], [u1, v1] = pts[i + 1];
    for (const f of [0.45, 0.9]) line(ctx, ...P(cx, cy, u0, v0, h * f), ...P(cx, cy, u1, v1, h * f), LOG_L, 0.6);
  }
  for (const [u, v] of pts) { const [bx, by] = P(cx, cy, u, v); line(ctx, bx, by, bx, by - h - 0.4, LOG_D, 0.8); }
}

/** A sheep, small, facing right. */
function sheep(ctx: Ctx, x: number, y: number, dark = false) {
  const c = dark ? '#5a4a3e' : FLEECE;
  line(ctx, x - 1.4, y, x - 1.4, y - 1.6, '#3a2e26', 0.5);
  line(ctx, x + 1.2, y + 0.2, x + 1.2, y - 1.4, '#3a2e26', 0.5);
  ellipse(ctx, x, y - 2.4, 2.4, 1.6, shade(c, -0.12));
  ellipse(ctx, x - 0.3, y - 2.7, 2.1, 1.3, c);
  ellipse(ctx, x + 2.4, y - 3, 0.8, 0.7, '#3a2e26');
}

/** A witral: the upright loom, a poncho half woven on it, the stepped figures showing. */
function witral(ctx: Ctx, cx: number, cy: number) {
  const a = P(cx, cy, 0, -3), b = P(cx, cy, 0, 3);
  for (const p of [a, b]) line(ctx, p[0], p[1], p[0], p[1] - 9, WOOD, 0.9);
  line(ctx, a[0], a[1] - 8.4, b[0], b[1] - 8.4, WOOD_D, 0.8);
  line(ctx, a[0], a[1] - 1.2, b[0], b[1] - 1.2, WOOD_D, 0.8);
  // the warp threads, and the woven cloth growing up from the bottom beam
  for (let i = 1; i < 8; i++) { const t = i / 8; line(ctx, a[0] + (b[0] - a[0]) * t, a[1] - 8.4 + (b[1] - a[1]) * t, a[0] + (b[0] - a[0]) * t, a[1] - 1.2 + (b[1] - a[1]) * t, WOOL_D, 0.3); }
  const q = (t0: number, t1: number, z0: number, z1: number, c: string) => poly(ctx, [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0 - z0, a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1 - z0, a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1 - z1, a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0 - z1], c);
  q(0.06, 0.94, 1.4, 5.2, BLUE);
  q(0.38, 0.62, 1.4, 5.2, RED);
  q(0.46, 0.54, 2, 2.6, WOOL); q(0.42, 0.58, 2.9, 3.5, WOOL); q(0.46, 0.54, 3.8, 4.4, WOOL); // a stepped figure
}

/** A small garden of potatoes and maize. */
function garden(ctx: Ctx, cx: number, cy: number, seed = 0) {
  for (let r = 0; r < 3; r++) {
    const [x0, y0] = P(cx, cy, -5, -4 + r * 3), [x1, y1] = P(cx, cy, 5, -4 + r * 3);
    line(ctx, x0, y0, x1, y1, '#6a4a2c', 1.6);
    for (let i = 0; i < 5; i++) {
      const t = (i + 0.5) / 5, px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t;
      if ((r + seed) % 3 === 2) { line(ctx, px, py, px + 0.2, py - 5, '#6a9a3a', 0.6); line(ctx, px, py - 3, px + 1.6, py - 4, '#7aaa44', 0.5); } // maize
      else { ellipse(ctx, px, py - 0.8, 1.2, 0.8, '#3a7028'); ellipse(ctx, px - 0.3, py - 1.1, 0.6, 0.4, '#5a9a3a'); if ((i + r) % 3 === 0) ellipse(ctx, px + 0.5, py - 1.4, 0.3, 0.3, '#e8e0f0'); } // potato plants in flower
    }
  }
}

/**
 * The rewe: a trunk carved into steps, set upright, with a simple face at the top and branches of canelo and a colihue
 * cane tied to it.
 */
export function rewe(ctx: Ctx, x: number, y: number, k = 1) {
  softShadow(ctx, x + 1 * k, y + 0.4 * k, 3 * k, 1.2 * k, 0.3);
  const h = 17 * k;
  // branches tied at its sides
  for (const s of [-1, 1]) {
    line(ctx, x + s * 0.6 * k, y - 4 * k, x + s * 3.4 * k, y - h - 1 * k, WOOD_D, 0.4 * k);
    for (let i = 0; i < 5; i++) {
      const t = 0.35 + i * 0.15, px = x + s * (0.6 + 2.8 * t) * k, py = y - 4 * k - (h - 3 * k) * t;
      ellipse(ctx, px + s * 0.8 * k, py, 1.3 * k, 0.55 * k, i % 2 ? '#6a9a4a' : '#88b062');
    }
  }
  line(ctx, x - 1.6 * k, y - 2 * k, x - 2.4 * k, y - h - 4 * k, CANE_D, 0.5 * k); // a colihue cane
  // the trunk, cut into steps on its front
  poly(ctx, [x - 1.3 * k, y, x + 1.3 * k, y, x + 1.1 * k, y - h, x - 1.1 * k, y - h], WOOD_L);
  poly(ctx, [x + 0.2 * k, y, x + 1.3 * k, y, x + 1.1 * k, y - h, x + 0.2 * k, y - h], WOOD);
  for (let i = 0; i < 5; i++) {
    const sy = y - 1.6 * k - i * 2.4 * k;
    poly(ctx, [x - 1.2 * k, sy, x + 1.2 * k, sy, x + 1.2 * k, sy - 0.7 * k], WOOD_D); // a notched step
    line(ctx, x - 1.2 * k, sy, x + 1.2 * k, sy, '#c8a070', 0.3 * k);
  }
  // the head: a simple carved face
  ellipse(ctx, x, y - h - 1.4 * k, 1.6 * k, 2 * k, WOOD_L);
  ellipse(ctx, x + 0.5 * k, y - h - 1.4 * k, 1.1 * k, 1.9 * k, WOOD);
  for (const dx of [-0.6, 0.6]) ellipse(ctx, x + dx * k, y - h - 1.8 * k, 0.3 * k, 0.25 * k, WOOD_D);
  line(ctx, x, y - h - 1.6 * k, x, y - h - 0.8 * k, WOOD_D, 0.3 * k);
  line(ctx, x - 0.5 * k, y - h - 0.4 * k, x + 0.5 * k, y - h - 0.4 * k, WOOD_D, 0.3 * k);
}

/** The capital: a ring of rukas behind a log palisade, the rewe on the open ground before the great ruka. */
function capital(ctx: Ctx, x: number, y: number, roofC: string) {
  palisade(ctx, x, y, -19, -10, 16, -10, 8, 3);
  palisade(ctx, x, y, -19, -10, -19, 9, 8, 5);
  ruka(ctx, x - 9, y - 9, 6, 4, 6.4, shade(roofC, -0.04));
  ruka(ctx, x + 5, y - 10, 5.4, 3.6, 6, shade(roofC, 0.03));
  ruka(ctx, x - 2, y - 1, 11, 6.4, 10, roofC); // the great ruka of the lonko
  ruka(ctx, x - 13, y + 3, 5, 3.4, 5.6, shade(roofC, 0.06), false);
  // the open ground before the door, the rewe and a blue banner with the guñelve
  const [rx, ry] = P(x, y, 13, 2);
  rewe(ctx, rx, ry, 0.95);
  const [fx, fy] = P(x, y, 9, 8);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ellipse(ctx, fx + Math.cos(a) * 1.5, fy + Math.sin(a) * 0.75, 0.5, 0.4, '#8a8478'); } // a fire ring
  poly(ctx, [fx - 0.8, fy, fx, fy - 2.4, fx + 0.8, fy], '#e86a1a');
  poly(ctx, [fx - 0.4, fy, fx, fy - 1.5, fx + 0.4, fy], '#f8c040');
  palisade(ctx, x, y, -19, 9, -4, 12, 8, 11);
  palisade(ctx, x, y, 3, 13, 16, 13, 8, 13);
  const [bx, by] = P(x, y, 17, -7);
  pennant(ctx, bx, by, 20);
}

function building(ctx: Ctx, x: number, y: number, big: boolean, roofC: string, isCapital: boolean) {
  if (big && isCapital) return capital(ctx, x, y, roofC);
  if (big) {
    // a lonko's household: a large ruka and a smaller one, a corral with sheep
    railFence(ctx, x, y, [[-15, -8], [-15, 4], [-6, 8]]);
    ruka(ctx, x - 4, y - 4, 6, 4, 6, shade(roofC, 0.04));
    ruka(ctx, x + 3, y + 1, 10, 6, 9, roofC);
    sheep(ctx, ...P(x, y, -12, 0)); sheep(ctx, ...P(x, y, -10, 4), true);
    return;
  }
  const spot: Record<string, number> = { '-10,2': 1, '10,2': 0, '0,8': 2, '-6,-8': 0, '7,-7': 3, '-14,-3': 2, '14,-2': 0 };
  const v = spot[`${Math.round(x)},${Math.round(y)}`] ?? ((Math.round(x) * 7 + Math.round(y) * 3) % 4 + 4) % 4;
  if (v === 0) ruka(ctx, x, y, 7, 4.6, 6.4, roofC);
  else if (v === 1) { ruka(ctx, x - 1, y - 1, 6.4, 4.2, 6, shade(roofC, -0.05)); witral(ctx, ...P(x, y, 7, 3)); }
  else if (v === 2) { // a corral of sheep beside a little ruka
    railFence(ctx, x, y, [[-7, -2], [-7, 6], [3, 6], [3, -2]]);
    ruka(ctx, x + 4, y - 5, 4.6, 3.2, 4.6, shade(roofC, 0.05));
    sheep(ctx, ...P(x, y, -4, 3)); sheep(ctx, ...P(x, y, -1, 4.6), true); sheep(ctx, ...P(x, y, 0, 1.6));
  } else { garden(ctx, x - 2, y + 2, Math.round(x)); ruka(ctx, x + 4, y - 4, 5, 3.4, 5, roofC, false); }
}

// ---------------------------------------------------------------- trees

/**
 * The pewen (araucaria): a tall bare grey trunk ringed with old branch scars, and at the top a flat umbrella of long
 * rope-like branches in whorls, each running out level and curving up at its tip. Young ones are cones of branches.
 */
function araucaria(ctx: Ctx, x: number, y: number, k: number, g: string, seed: number) {
  const young = rand(seed, 5) < 0.22;
  const dark = mix(g, '#1e3a2a', 0.45), lit = mix(g, '#8ab07a', 0.35);
  if (young) {
    const h = 16 * k;
    line(ctx, x, y, x, y - h, '#6a5a4a', 1.2 * k);
    for (let i = 0; i < 6; i++) {
      const ty = y - h * (0.18 + i * 0.14), span = (1 - i / 6) * 5.6 * k + 1.2 * k;
      for (const s of [-1, 1]) {
        curve(ctx, x, ty, x + s * span * 0.6, ty + 0.6 * k, x + s * span, ty - 1.2 * k, 1.5 * k, dark);
        curve(ctx, x, ty - 0.4 * k, x + s * span * 0.6, ty + 0.1 * k, x + s * span, ty - 1.6 * k, 0.6 * k, lit);
      }
    }
    ellipse(ctx, x, y - h - 0.4 * k, 0.9 * k, 1.4 * k, dark);
    return;
  }
  const h = (25 + rand(seed, 2) * 5) * k;
  // the trunk: grey, straight, its bark in plates, scars where the lower branches fell
  line(ctx, x, y, x, y - h, '#6e655c', 2 * k);
  line(ctx, x - 0.5 * k, y, x - 0.4 * k, y - h, '#9a9086', 0.6 * k);
  for (let i = 1; i < 7; i++) { const sy = y - h * (i / 9); line(ctx, x - 1 * k, sy, x + 1 * k, sy - 0.3 * k, '#4e4640', 0.35 * k); }
  // the crown: three whorls, the lowest widest, each branch running out level and turning up at its tip, so the
  // whole crown is a flat-topped umbrella
  const tiers = 3;
  const branch = (ty: number, a: number, span: number, w: number, c: string, cl: string) => {
    const ex = Math.cos(a) * span, ey = Math.sin(a) * span * 0.28;
    const mx = x + ex * 0.75, my = ty + ey * 0.75 + 0.3 * k; // it sags a little, then rises
    const tx = x + ex, ty2 = ty + ey - 3 * k;
    curve(ctx, x, ty, mx, my, tx, ty2, w, c);
    curve(ctx, x, ty - 0.4 * k, mx, my - 0.5 * k, tx - 0.2 * k, ty2 - 0.3 * k, w * 0.4, cl);
    ellipse(ctx, tx, ty2 - 0.4 * k, w * 0.45, w * 0.7, cl); // the upturned tip
  };
  for (let i = 0; i < tiers; i++) {
    const ty = y - h + i * 3 * k - 1 * k, n = 7 - i * 2;
    const span = (11 - i * 3.2) * k, w = (2.2 - i * 0.3) * k;
    const as = Array.from({ length: n }, (_, j) => (j / n) * Math.PI * 2 + i * 0.5 + rand(seed, j + i * 7) * 0.4);
    for (const a of as) if (Math.sin(a) < 0) branch(ty, a, span, w, shade(dark, -0.12), dark); // the far branches first
    for (const a of as) if (Math.sin(a) >= 0) branch(ty, a, span, w, dark, g);
  }
  // the top tuft
  ellipse(ctx, x, y - h - 1.4 * k, 2.2 * k, 1.4 * k, dark);
  ellipse(ctx, x - 0.4 * k, y - h - 1.8 * k, 1.2 * k, 0.7 * k, lit);
  // cones on the female trees
  if (rand(seed, 9) < 0.4) for (const dx of [-1.6, 1.4]) ellipse(ctx, x + dx * k, y - h + 0.4 * k, 0.9 * k, 1 * k, '#7a6a3a');
}

/** The coigüe: an evergreen southern beech, its small dark leaves in flat layered sprays on spreading limbs. */
function coigue(ctx: Ctx, x: number, y: number, k: number, g: string, seed: number) {
  const c = mix(g, '#1e4a2a', 0.25);
  line(ctx, x, y, x + 0.3 * k, y - 10 * k, '#5a4434', 1.8 * k);
  for (const d of [-1, 1]) curve(ctx, x, y - 8 * k, x + d * 2 * k, y - 12 * k, x + d * 5 * k, y - 14 * k, 0.8 * k, '#5a4434');
  const sprays: [number, number, number][] = [[-5, -12, 4], [5, -13, 4], [0, -15, 5], [-2.6, -18.4, 3.6], [2.8, -19, 3.4], [0, -22, 2.6]];
  for (const [dx, dy, r] of sprays) {
    const jx = (rand(seed, dx + 9) - 0.5) * 1.4 * k;
    ellipse(ctx, x + dx * k + jx + 0.5 * k, y + dy * k + 0.8 * k, r * k, r * 0.4 * k, shade(c, -0.3));
    ellipse(ctx, x + dx * k + jx, y + dy * k, r * k, r * 0.38 * k, c);
    ellipse(ctx, x + dx * k + jx - r * 0.3 * k, y + dy * k - 0.3 * k, r * 0.5 * k, r * 0.16 * k, shade(c, 0.2));
  }
}

/** The canelo (foye), the sacred tree: an upright crown of long pale leaves on a smooth pale trunk, white flowers. */
function canelo(ctx: Ctx, x: number, y: number, k: number, g: string, seed: number) {
  const c = mix(g, '#7ab060', 0.5);
  line(ctx, x, y, x, y - 9 * k, '#a89a86', 1.5 * k);
  line(ctx, x - 0.4 * k, y, x - 0.4 * k, y - 9 * k, '#c8bca8', 0.5 * k);
  const lobes: [number, number, number, number][] = [[-2.4, -11, 2.8, 4.4], [2.4, -11.4, 2.8, 4.6], [0, -15, 3.2, 5], [0, -10, 3, 3.6]];
  for (const [dx, dy, rx, ry] of lobes) ellipse(ctx, x + dx * k + 0.5 * k, y + dy * k + 0.6 * k, rx * k, ry * k, shade(c, -0.3));
  for (const [dx, dy, rx, ry] of lobes) ellipse(ctx, x + dx * k, y + dy * k, rx * 0.92 * k, ry * 0.9 * k, c);
  // long leaves pointing up at the edges, a few clusters of white flowers
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + (rand(seed, i) - 0.5) * 2.2, r = 4.4 * k;
    const px = x + Math.cos(a) * r * 0.8, py = y - 12.6 * k + Math.sin(a) * r;
    line(ctx, px, py, px + Math.cos(a) * 1.8 * k, py + Math.sin(a) * 1.8 * k, shade(c, 0.15), 0.8 * k);
  }
  for (let i = 0; i < 5; i++) { const px = x + (rand(seed + 3, i) - 0.5) * 6 * k, py = y - (10 + rand(seed + 4, i) * 7) * k; ellipse(ctx, px, py, 0.6 * k, 0.5 * k, '#f8f4ea'); }
}

function tree(ctx: Ctx, x: number, y: number, k: number, Pal: BiomePalette, variant: number) {
  const h = rand(Math.round(x) * 13 + Math.round(y) * 7, 3);
  const type = ['pewen', 'coigue', 'pewen', 'canelo', 'pewen', 'coigue', 'pewen', 'coigue', 'canelo'][(variant + Math.floor(h * 9)) % 9];
  const g = Pal.forest ?? '#2a6a3a';
  const seed = variant * 7 + Math.floor(h * 50);
  if (type === 'pewen') return araucaria(ctx, x, y, k, g, seed);
  if (type === 'coigue') return coigue(ctx, x, y, k, g, seed);
  return canelo(ctx, x, y, k, g, seed);
}

// ---------------------------------------------------------------- registration

registerArt('mapuche', {
  unit(ctx, kind, x, y) {
    switch (kind) {
      case 'warrior': case 'archer': case 'defender': case 'swordsman': case 'explorer':
        footUnit(ctx, kind, x, y, 1);
        return true;
      case 'giant': footUnit(ctx, kind, x, y, 1.4); return true;
      case 'rider': case 'knight': case 'malon': rider(ctx, kind, x, y); return true;
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

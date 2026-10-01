// The Kingdom of Kush's own art (see render/tribeart): Napata and Meroë, eighth century BC to fourth century AD.
// The "Land of the Bow": dark-skinned bowmen in white linen kilts with sashes of amber and red, bare chests hung with
// bead collars, close-cropped hair bound with a red or gold headband and arrows tucked into it, sometimes a single
// ostrich feather; leather caps, leather cuirasses and bronze scale shirts for the heavy ranks; leopard-skin cloaks for
// the elite; great recurved bows of acacia and horn, tall hide shields of dappled cowhide and long iron-headed spears.
// The king wears the close Kushite cap-crown with two small upright cobras at the brow. Horsemen ride Dongola horses
// under red cloths; the knight is a Kushite war elephant; a great bolt-thrower with a ram's head of Amun serves as the
// siege engine; the boats are Nile craft with papyrus-umbel prows under square amber sails. Towns of rounded mud brick
// and red sandstone with round thatched huts; the capital has steep pyramids and a pylon temple of Amun guarded by a
// ram. Forests are forked doum palms and flat-topped acacias.
import type { BiomePalette } from '../../data/tribes';
import type { UnitKind } from '../../game/types';
import { registerArt, type Body } from '../tribeart';
import { band, box, ellipse, faceQuad, ink, line, mix, poly, rand, shade, softShadow } from '../prims';
import type { Ctx } from '../prims';
import { drawHorse, figure } from '../units';
import { chapel, pyramid, SANDSTONE } from '../mech/nubia';

// ---------------------------------------------------------------- colours

const SKIN = '#5a3820';
const LINEN = '#f3eedf';
const LINEN_D = '#d8cfb8';
const AMBER = '#e0a020';
const RED = '#b8402a';
const RED_D = '#7a2416';
const GOLD = '#ecc040';
const GOLD_D = '#a8801c';
const LEATH = '#8a5a30';
const LEATH_D = '#5a361a';
const SCALE = '#b88a48'; // bronze scales
const IRON = '#7a7e84';
const STEEL = '#b8bec4';
const LEOP = '#d8a650';
const SPOT = '#3a2210';
const WOOD = '#7a5434';
const WOOD_D = '#4a3020';
const HORN = '#efe2c0';
const BEAD_B = '#3a8ab0'; // faience blue
const MUD = '#c89a62';
const MUD_L = '#dcb47a';
const THATCH = '#c8a050';

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
/** An ostrich feather from (x0, y0) to its tip, soft and drooping. */
function feather(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, k: number, c = LINEN) {
  const mx = (x0 + x1) / 2 - 1.4 * k, my = (y0 + y1) / 2;
  curve(ctx, x0, y0, mx, my, x1, y1, 2.2 * k, shade(c, -0.12));
  curve(ctx, x0, y0, mx + 0.3 * k, my, x1 + 0.2 * k, y1 + 0.3 * k, 1.4 * k, c);
  for (let i = 1; i < 6; i++) { const [px, py] = qpt(x0, y0, mx, my, x1, y1, i / 6); line(ctx, px, py, px - 1.4 * k, py + 0.9 * k, shade(c, -0.08), 0.4 * k); }
  line(ctx, x0, y0, x0 + 0.2 * k, y0 + 1.6 * k, '#2a1a10', 0.5 * k);
}

// ---------------------------------------------------------------- dress


/** [torso, legs, sleeves]: bare skin for the bowmen and spearmen, leather and bronze scale for the heavy ranks. */
function dress(kind: UnitKind): [string, string, string] {
  switch (kind) {
    case 'defender': return [LEATH, SKIN, SKIN];
    case 'swordsman': case 'knight': return [SCALE, SKIN, SKIN];
    case 'giant': return [GOLD, SKIN, SKIN];
    case 'explorer': return [LINEN, SKIN, LINEN];
    default: return [SKIN, SKIN, SKIN];
  }
}

/** The white linen kilt, wrapped to the knee: two sides, a front panel hanging down, pleats and a coloured hem. */
function kilt(ctx: Ctx, x: number, hip: number, k: number, len: number, hem: string | null, panel: string | null) {
  const w = 10.8 * k, cy = hip + len * k, h = (len + 0.1) * k;
  faceQuad(ctx, 'L', x, cy, w, h, 0, 1, 0, 1, LINEN);
  faceQuad(ctx, 'R', x, cy, w, h, 0, 1, 0, 1, LINEN);
  for (const u of [0.16, 0.34, 0.52, 0.7, 0.86]) { // fine pleats
    faceQuad(ctx, 'L', x, cy, w, h, u, u + 0.03, 0.08, 0.9, LINEN_D);
    faceQuad(ctx, 'R', x, cy, w, h, u, u + 0.03, 0.08, 0.9, LINEN_D);
  }
  if (hem) band(ctx, x, cy, w, h, 0, 0.1, hem);
  if (panel) { // the sash end hanging down the front over the kilt
    fpoly(ctx, 'R', x, cy, w, h, [[0.3, 1.02], [0.5, 1.02], [0.52, -0.25], [0.42, -0.32], [0.3, -0.24]], panel);
    fpoly(ctx, 'R', x, cy, w, h, [[0.3, -0.12], [0.52, -0.14], [0.52, -0.25], [0.42, -0.32], [0.3, -0.24]], shade(panel, -0.2));
  }
}

/** A broad collar of beads in rows of gold, faience blue and red. */
function collar(ctx: Ctx, x: number, y: number, w: number, h: number, rich: boolean) {
  const rows = rich ? [GOLD, BEAD_B, RED, GOLD] : [RED, LINEN, AMBER];
  rows.forEach((c, i) => band(ctx, x, y, w, h, 0.9 - i * 0.07, 0.97 - i * 0.07, c));
  for (let i = 0; i < 6; i++) { const [px, py] = fpt('R', x, y, w, h, 0.08 + i * 0.17, 0.97 - rows.length * 0.07); ellipse(ctx, px, py, 0.45 * (w / 10), 0.55 * (w / 10), rows[rows.length - 1]); } // drop beads
}

/** Rows of bronze scales over part of a box. */
function scales(ctx: Ctx, x: number, y: number, w: number, h: number, v0: number, v1: number, base: string, rows = 5) {
  band(ctx, x, y, w, h, v0, v1, base);
  const dv = (v1 - v0) / rows;
  for (let r = 0; r < rows; r++) {
    const v = v0 + r * dv;
    for (let i = 0; i < 6; i++) {
      const u = (i + (r % 2) * 0.5) / 6;
      for (const f of ['L', 'R'] as const) {
        faceQuad(ctx, f, x, y, w, h, u, u + 0.1, v, v + dv * 0.3, shade(base, -0.32));
        faceQuad(ctx, f, x, y, w, h, u + 0.02, u + 0.08, v + dv * 0.6, v + dv * 0.9, shade(base, 0.28));
      }
    }
  }
}

/** A leopard-skin cloak over the back and one shoulder, its spots in rosettes and the paws hanging down. */
function leopard(ctx: Ctx, x: number, y: number, w: number, h: number, k: number) {
  fpoly(ctx, 'L', x, y, w, h, [[0, 1.02], [0.7, 1.02], [0.9, 0.3], [0.7, -0.5], [0.2, -0.6], [0, -0.2]], LEOP);
  fpoly(ctx, 'R', x, y, w, h, [[0, 1.02], [0.34, 1.02], [0.18, 0.4], [0, 0.3]], LEOP);
  for (let i = 0; i < 9; i++) { // rosettes
    const u = 0.1 + (i % 3) * 0.24 + (i % 2) * 0.06, v = 0.85 - Math.floor(i / 3) * 0.48;
    const [px, py] = fpt('L', x, y, w, h, u, v);
    ring(ctx, px, py, 0.6 * k, 0.5 * k, SPOT, 0.4 * k);
  }
  for (const [u, v] of [[0.08, 0.85], [0.14, 0.55]] as const) { const [px, py] = fpt('R', x, y, w, h, u, v); ellipse(ctx, px, py, 0.4 * k, 0.4 * k, SPOT); }
  const [pa, pb] = fpt('L', x, y, w, h, 0.5, -0.55); // a paw at the hem
  ellipse(ctx, pa, pb + 0.4 * k, 0.9 * k, 0.6 * k, shade(LEOP, -0.1));
  for (let i = -1; i <= 1; i++) line(ctx, pa + i * 0.4 * k, pb + 0.8 * k, pa + i * 0.5 * k, pb + 1.3 * k, '#f4efe0', 0.25 * k);
}

function torso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const k = w / 10;
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const B = (v0: number, v1: number, c: string) => band(ctx, x, y, w, h, v0, v1, c);
  switch (kind) {
    case 'warrior': // a white kilt with a red hem, a red belt, a bead collar on the bare chest
      kilt(ctx, x, y, k, 3, RED, null);
      B(0.04, 0.16, RED);
      collar(ctx, x, y, w, h, false);
      R(0.2, 0.26, 0.4, 0.62, shade(SKIN, -0.18)); // the chest
      return;
    case 'archer': case 'pitati': { // kilt, a sash across the chest and its end hanging in front
      const pit = kind === 'pitati';
      kilt(ctx, x, y, k, 3.2, pit ? AMBER : RED, pit ? AMBER : RED);
      B(0.04, 0.16, pit ? RED : AMBER);
      fpoly(ctx, 'R', x, y, w, h, [[0, 0.82], [0.2, 0.96], [1, 0.3], [0.8, 0.16]], pit ? AMBER : RED);
      fpoly(ctx, 'R', x, y, w, h, [[0.08, 0.86], [0.13, 0.9], [0.92, 0.26], [0.87, 0.22]], pit ? RED : AMBER);
      fpoly(ctx, 'L', x, y, w, h, [[0.6, 0.96], [0.8, 1], [1, 0.82], [0.85, 0.74]], pit ? AMBER : RED);
      if (pit) { // a gold armlet of rank and a string of faience beads
        collar(ctx, x, y, w, h, false);
        R(0.66, 0.8, 0.5, 0.6, GOLD);
      }
      return;
    }
    case 'defender': // a leather cuirass, studded, over the kilt; a broad red belt
      kilt(ctx, x, y, k, 3, RED, null);
      B(0.88, 1, shade(LEATH, 0.2));
      for (const v of [0.3, 0.52, 0.74]) B(v, v + 0.03, LEATH_D);
      for (const u of [0.15, 0.4, 0.65, 0.9]) for (const v of [0.42, 0.64]) { const [px, py] = fpt('R', x, y, w, h, u, v); ellipse(ctx, px, py, 0.4 * k, 0.4 * k, GOLD); }
      B(0.04, 0.16, RED);
      return;
    case 'swordsman': case 'knight': // a bronze scale shirt to the hip over the kilt, a leather belt and baldric
      kilt(ctx, x, y, k, 3, AMBER, null);
      scales(ctx, x, y, w, h, 0.12, 0.96, SCALE, 5);
      B(0.9, 1, LEATH);
      B(0.02, 0.14, LEATH_D);
      R(0.42, 0.56, 0.02, 0.14, GOLD);
      fpoly(ctx, 'R', x, y, w, h, [[0.04, 0.92], [0.16, 0.98], [0.92, 0.14], [0.8, 0.08]], LEATH_D);
      return;
    case 'giant': { // the king: a pleated gold-and-linen robe, a broad bead collar, a leopard cloak and a red sash
      kilt(ctx, x, y, k, 4.6, GOLD, RED);
      B(0, 1, LINEN);
      for (const u of [0.15, 0.35, 0.55, 0.75]) { R(u, u + 0.04, 0.05, 0.7, LINEN_D); faceQuad(ctx, 'L', x, y, w, h, u, u + 0.04, 0.05, 0.7, LINEN_D); }
      collar(ctx, x, y, w, h, true);
      B(0.04, 0.16, RED);
      R(0.4, 0.56, 0.02, 0.18, GOLD);
      leopard(ctx, x, y, w, h, k);
      return;
    }
    case 'rider': // a red kilt-cloth and a gold armlet
      kilt(ctx, x, y, k, 2.4, AMBER, null);
      B(0.04, 0.14, RED);
      collar(ctx, x, y, w, h, false);
      return;
    case 'explorer': // a linen wrap, a bag on a strap
      kilt(ctx, x, y, k, 3.4, AMBER, null);
      B(0.04, 0.14, LEATH);
      fpoly(ctx, 'R', x, y, w, h, [[0, 0.9], [0.14, 0.98], [1, 0.4], [0.86, 0.32]], LEATH_D);
      return;
    default:
      kilt(ctx, x, y, k, 3, AMBER, null);
      B(0.04, 0.14, RED);
  }
}

/** Faces: clean-shaven; the king with a short dark beard; facial scars on the warriors' cheeks (three lines). */
function face(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  if (kind === 'giant') { R(0.3, 0.7, 0, 0.12, '#140c08'); return; }
  if (kind === 'warrior' || kind === 'pitati' || kind === 'swordsman') for (const v of [0.4, 0.46, 0.52]) R(0.76, 0.92, v, v + 0.025, shade(SKIN, -0.3)); // cheek scars
  R(0.38, 0.62, 0.16, 0.2, '#3a2010'); // the lips
}

// ---------------------------------------------------------------- headgear

/** A cloth headband round the brow, following both faces of the head box. */
function headband(ctx: Ctx, x: number, top: number, k: number, hw: number, c: string, v = 0.78) {
  const hh = 10.5 * k, cy = top + hh;
  band(ctx, x, cy, hw + 0.3 * k, hh, v, v + 0.1, c);
  faceQuad(ctx, 'L', x, cy, hw + 0.3 * k, hh, 0, 0.3, v - 0.1, v + 0.1, c); // the knot at the back, its tails
  const [kx, ky] = fpt('L', x, cy, hw + 0.3 * k, hh, 0.04, v + 0.05);
  line(ctx, kx, ky, kx - 1.6 * k, ky + 4 * k, c, 0.9 * k);
  line(ctx, kx, ky, kx - 0.4 * k, ky + 4.6 * k, shade(c, -0.2), 0.9 * k);
}

/** Arrows thrust upright into the headband behind the head, their fletchings above. */
function headArrows(ctx: Ctx, x: number, top: number, k: number, hw: number, n: number, fletch: string) {
  const hh = 10.5 * k;
  for (let i = 0; i < n; i++) {
    const [bx, by] = fpt('L', x, top + hh, hw, hh, 0.12 + i * 0.16, 0.8);
    const lean = (i - (n - 1) / 2) * 0.9 * k - 0.8 * k;
    const tx = bx + lean, ty = by - 9.6 * k;
    line(ctx, bx, by, tx, ty, '#d8c08a', 0.6 * k);
    poly(ctx, [tx, ty, tx - 1.1 * k, ty + 2.8 * k, tx - 0.1 * k, ty + 2.4 * k], fletch);
    poly(ctx, [tx, ty, tx + 1 * k, ty + 2.8 * k, tx + 0.1 * k, ty + 2.4 * k], shade(fletch, -0.3));
  }
}

/** A close-fitting leather cap: a rounded crown with a stitched rim. */
function leatherCap(ctx: Ctx, x: number, top: number, k: number, hw: number, c: string, rim: string) {
  const hh = 10.5 * k, cy = top + hh;
  band(ctx, x, cy, hw + 0.4 * k, hh, 0.66, 1.02, c);
  ellipse(ctx, x, top + 0.2 * k, hw * 0.52, hw * 0.3, shade(c, 0.12));
  ellipse(ctx, x - 0.8 * k, top - 0.6 * k, hw * 0.3, hw * 0.14, shade(c, 0.26));
  band(ctx, x, cy, hw + 0.5 * k, hh, 0.64, 0.72, rim);
  for (let i = 0; i < 5; i++) { const [px, py] = fpt('R', x, cy, hw + 0.5 * k, hh, 0.1 + i * 0.2, 0.68); ellipse(ctx, px, py, 0.3 * k, 0.3 * k, shade(rim, 0.4)); }
}

/** A small upright cobra (uraeus): a rearing body, a spread hood and a little head. */
function uraeus(ctx: Ctx, x: number, y: number, k: number) {
  curve(ctx, x, y, x + 0.8 * k, y - 1.2 * k, x + 0.1 * k, y - 2.4 * k, 0.6 * k, GOLD_D);
  ellipse(ctx, x + 0.1 * k, y - 3 * k, 0.75 * k, 1.1 * k, GOLD);
  ellipse(ctx, x + 0.1 * k, y - 3 * k, 0.32 * k, 0.6 * k, RED);
  ellipse(ctx, x + 0.15 * k, y - 4.2 * k, 0.42 * k, 0.4 * k, GOLD);
}

/** The Kushite royal cap-crown: a close skullcap, a gold diadem with streamers and two uraei at the brow. */
function capCrown(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const hh = 10.5 * k, cy = top + hh;
  // streamers falling behind
  const [sx, sy] = fpt('L', x, cy, hw, hh, 0.1, 0.74);
  line(ctx, sx, sy, sx - 1.8 * k, sy + 7 * k, RED, 1.1 * k);
  line(ctx, sx + 0.6 * k, sy, sx - 0.4 * k, sy + 7.6 * k, GOLD, 0.9 * k);
  band(ctx, x, cy, hw + 0.4 * k, hh, 0.7, 1.04, '#1c140e');
  ellipse(ctx, x, top + 0.2 * k, hw * 0.52, hw * 0.3, '#2a2018');
  ellipse(ctx, x - 0.8 * k, top - 0.4 * k, hw * 0.24, hw * 0.1, '#4a3a2a');
  band(ctx, x, cy, hw + 0.5 * k, hh, 0.68, 0.78, GOLD);
  for (let i = 0; i < 5; i++) { const [px, py] = fpt('R', x, cy, hw + 0.5 * k, hh, 0.1 + i * 0.2, 0.73); ellipse(ctx, px, py, 0.32 * k, 0.32 * k, i % 2 ? BEAD_B : RED); }
  // the two cobras rearing at the front of the brow
  const [ax, ay] = fpt('R', x, cy, hw + 0.5 * k, hh, 0.3, 0.78);
  const [bx, by] = fpt('R', x, cy, hw + 0.5 * k, hh, 0.52, 0.78);
  uraeus(ctx, ax, ay, k);
  uraeus(ctx, bx, by, k);
  // a ram's-head pendant on a cord would hang below; a single gold ball on the crown stands for the sun
  ellipse(ctx, x, top - 1.6 * k, 0.9 * k, 0.9 * k, GOLD);
}

function head(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  switch (kind) {
    case 'warrior': // a red headband and one ostrich feather
      headband(ctx, x, top, k, hw, RED);
      feather(ctx, x - hw * 0.34, top + 1.6 * k, x - hw * 0.1, top - 7.6 * k, k * 0.9);
      break;
    case 'archer': // a red headband with three arrows in it
      headband(ctx, x, top, k, hw, RED);
      headArrows(ctx, x, top, k, hw, 3, LINEN);
      break;
    case 'pitati': // a gold-studded amber band, four arrows and a feather: the eye-shooters
      headband(ctx, x, top, k, hw, AMBER);
      for (let i = 0; i < 4; i++) { const [px, py] = fpt('R', x, top + 10.5 * k, hw + 0.3 * k, 10.5 * k, 0.15 + i * 0.24, 0.83); ellipse(ctx, px, py, 0.35 * k, 0.35 * k, GOLD); }
      headArrows(ctx, x, top, k, hw, 4, RED);
      feather(ctx, x - hw * 0.44, top + 2 * k, x - hw * 0.56, top - 8.4 * k, k * 0.8);
      break;
    case 'defender': // a red leather cap with a stitched rim
      leatherCap(ctx, x, top, k, hw, '#8a3a22', LEATH_D);
      break;
    case 'swordsman': // a dark leather cap with a bronze rim and a short feather
      leatherCap(ctx, x, top, k, hw, LEATH_D, SCALE);
      feather(ctx, x - hw * 0.3, top + 0.4 * k, x - hw * 0.5, top - 5.4 * k, k * 0.7, RED);
      break;
    case 'knight':
      leatherCap(ctx, x, top, k, hw, LEATH, GOLD);
      feather(ctx, x - hw * 0.3, top + 0.4 * k, x - hw * 0.2, top - 6.6 * k, k * 0.8);
      break;
    case 'rider':
      headband(ctx, x, top, k, hw, AMBER);
      feather(ctx, x - hw * 0.34, top + 1.6 * k, x - hw * 0.5, top - 6 * k, k * 0.8, RED);
      break;
    case 'giant':
      capCrown(ctx, x, top, k, hw);
      break;
    case 'explorer':
      headband(ctx, x, top, k, hw, LINEN);
      break;
    default:
      headband(ctx, x, top, k, hw, RED);
  }
}

// ---------------------------------------------------------------- weapons and shields

/** A leather bracer on the bow arm, laced, with a gold stud. */
function bracer(ctx: Ctx, x: number, y: number, k: number) {
  box(ctx, x, y + 3.4 * k, 3 * k, 2.6 * k, LEATH, shade(LEATH, 0.2));
  for (const v of [0.3, 0.65]) faceQuad(ctx, 'R', x, y + 3.4 * k, 3 * k, 2.6 * k, 0, 1, v, v + 0.1, LEATH_D);
  ellipse(ctx, x + 0.7 * k, y + 2.2 * k, 0.35 * k, 0.35 * k, GOLD);
}

/** The great Nubian bow: tall, deeply recurved at both tips, bound at the grip, with an arrow on the string. */
function bow(ctx: Ctx, x: number, y: number, k: number, size = 1, grip = RED) {
  const s = k * size;
  const gx = x + 1 * s, gy = y - 1 * s;
  const top = { x: gx - 1.2 * s, y: gy - 15 * s }, bot = { x: gx - 1.2 * s, y: gy + 12.6 * s };
  // the limbs: from the grip out to the bend, then the tips curl forward again (the recurve)
  for (const [c, wd] of [[WOOD_D, 2.2], ['#9a6a3a', 1.3], ['#c89a5a', 0.4]] as const) {
    curve(ctx, gx, gy, gx + 4.6 * s, gy - 8 * s, top.x, top.y, wd * s, c);
    curve(ctx, gx, gy, gx + 4.6 * s, gy + 7 * s, bot.x, bot.y, wd * s, c);
  }
  curve(ctx, top.x, top.y, top.x - 1.2 * s, top.y - 1.4 * s, top.x + 0.8 * s, top.y - 3 * s, 1.1 * s, HORN); // horn tips curling forward
  curve(ctx, bot.x, bot.y, bot.x - 1.2 * s, bot.y + 1.4 * s, bot.x + 0.8 * s, bot.y + 3 * s, 1.1 * s, HORN);
  const nock = { x: gx - 6.4 * s, y: gy - 0.6 * s };
  ctx.strokeStyle = ink('#ece4cc');
  ctx.lineWidth = 0.4 * s;
  ctx.beginPath();
  ctx.moveTo(top.x - 0.4 * s, top.y - 0.6 * s);
  ctx.lineTo(nock.x, nock.y);
  ctx.lineTo(bot.x - 0.4 * s, bot.y + 0.6 * s);
  ctx.stroke();
  line(ctx, gx + 0.4 * s, gy - 2 * s, gx + 0.4 * s, gy + 1.4 * s, grip, 1.8 * s); // the grip wrap
  line(ctx, gx - 0.4 * s, gy - 1.4 * s, gx + 1.2 * s, gy - 1.4 * s, GOLD, 0.4 * s);
  // the arrow: a reed shaft with a leaf-shaped iron head, fletched in white
  const tx = gx + 8.4 * s, ty = gy - 2 * s;
  line(ctx, nock.x, nock.y, tx, ty, '#d8c08a', 0.7 * s);
  poly(ctx, [tx, ty - 1 * s, tx + 3 * s, ty + 0.1 * s, tx, ty + 0.9 * s, tx + 0.6 * s, ty], IRON);
  for (const t of [0.04, 0.12]) { const px = nock.x + (tx - nock.x) * t, py = nock.y + (ty - nock.y) * t; poly(ctx, [px, py, px + 2.2 * s, py - 1.5 * s, px + 2.6 * s, py - 0.3 * s], t > 0.1 ? LINEN : RED); }
}

/** A long spear: a wooden shaft with a broad iron head (Meroë smelted iron) and a red tassel below it. */
function spear(ctx: Ctx, x: number, y: number, k: number, len = 28, head = IRON) {
  const x0 = x - 1.8 * k, y0 = y + 6 * k, x1 = x + 3 * k, y1 = y - (len - 6) * k;
  line(ctx, x0, y0, x1, y1, WOOD, 1.3 * k);
  line(ctx, x0 - 0.4 * k, y0, x1 - 0.4 * k, y1, '#a8784a', 0.4 * k);
  poly(ctx, [x1, y1 - 6.8 * k, x1 - 1.6 * k, y1 - 2 * k, x1 - 0.2 * k, y1 + 0.6 * k], shade(head, 0.25));
  poly(ctx, [x1, y1 - 6.8 * k, x1 + 1.6 * k, y1 - 1.6 * k, x1 - 0.2 * k, y1 + 0.6 * k], shade(head, -0.2));
  line(ctx, x1 - 0.2 * k, y1 - 6 * k, x1 - 0.1 * k, y1, shade(head, -0.4), 0.3 * k);
  line(ctx, x1 - 0.6 * k, y1 + 1 * k, x1 + 0.6 * k, y1 + 0.6 * k, LEATH_D, 0.9 * k);
  for (let i = -1; i <= 1; i++) line(ctx, x1, y1 + 1.2 * k, x1 + i * 0.6 * k - 0.6 * k, y1 + 3.6 * k, i ? RED : RED_D, 0.5 * k);
}

/** A short iron sword with a leaf blade and an ivory grip. */
function sword(ctx: Ctx, x: number, y: number, k: number) {
  const x1 = x + 3 * k, y1 = y - 12 * k;
  poly(ctx, [x - 0.8 * k, y - 2 * k, x1 - 1.2 * k, y1 + 3 * k, x1, y1, x + 0.2 * k, y - 2 * k], shade(STEEL, 0.1));
  poly(ctx, [x + 0.2 * k, y - 2 * k, x1, y1, x1 + 0.6 * k, y1 + 3.4 * k, x + 1.2 * k, y - 1.8 * k], shade(STEEL, -0.25));
  line(ctx, x - 2 * k, y - 1.6 * k, x + 2.2 * k, y - 2.2 * k, GOLD, 1 * k);
  line(ctx, x, y - 1.6 * k, x - 0.5 * k, y + 1.6 * k, HORN, 1.5 * k);
  ellipse(ctx, x - 0.6 * k, y + 2 * k, 1 * k, 0.8 * k, GOLD);
}

/** A tall hide shield, round-topped, of dappled cowhide on a wooden spine, edged with stitched leather. */
function hideShield(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  const big = kind === 'defender' || kind === 'giant';
  const cx = x - 1.4 * k, cy = y - 5.4 * k, w = (big ? 5.8 : 4.8) * k, h = (big ? 14 : 11.4) * k;
  const royal = kind === 'giant';
  const shape = (dx: number, dy: number, sw: number, sh: number) => {
    ctx.beginPath();
    ctx.moveTo(cx + dx - sw, cy + dy + sh * 0.4);
    ctx.lineTo(cx + dx - sw, cy + dy - sh * 0.2);
    ctx.quadraticCurveTo(cx + dx - sw, cy + dy - sh * 0.62, cx + dx, cy + dy - sh * 0.62);
    ctx.quadraticCurveTo(cx + dx + sw, cy + dy - sh * 0.62, cx + dx + sw, cy + dy - sh * 0.2);
    ctx.lineTo(cx + dx + sw, cy + dy + sh * 0.4);
    ctx.quadraticCurveTo(cx + dx, cy + dy + sh * 0.5, cx + dx - sw, cy + dy + sh * 0.4);
    ctx.closePath();
  };
  shape(0.8 * k, 0.5 * k, w, h);
  ctx.fillStyle = ink(LEATH_D);
  ctx.fill();
  shape(0, 0, w, h);
  ctx.fillStyle = ink(royal ? LEOP : '#f0e8d8');
  ctx.fill();
  ctx.save();
  shape(0, 0, w, h);
  ctx.clip();
  if (royal) { for (let i = 0; i < 10; i++) ring(ctx, cx - w * 0.6 + (i % 3) * w * 0.6 + (Math.floor(i / 3) % 2) * w * 0.3, cy - h * 0.45 + Math.floor(i / 3) * h * 0.3, 0.7 * k, 0.6 * k, SPOT, 0.45 * k); }
  else {
    const dark = kind === 'swordsman' ? '#5a2e18' : '#2a1e16';
    for (const [dx, dy, rx, ry] of [[-0.5, -0.38, 0.6, 0.18], [0.5, -0.05, 0.5, 0.2], [-0.4, 0.22, 0.5, 0.14], [0.7, 0.36, 0.4, 0.1]] as const) {
      ellipse(ctx, cx + dx * w, cy + dy * h, rx * w, ry * h, dark);
    }
    ellipse(ctx, cx - 0.2 * w, cy - 0.12 * h, 0.2 * w, 0.06 * h, '#8a5a30');
  }
  ctx.restore();
  // the spine and the stitched rim
  line(ctx, cx, cy - h * 0.6, cx, cy + h * 0.46, royal ? GOLD : WOOD, 0.9 * k);
  shape(0, 0, w, h);
  ctx.strokeStyle = ink(royal ? GOLD : LEATH);
  ctx.lineWidth = 0.7 * k;
  ctx.stroke();
  for (let i = 0; i < 4; i++) line(ctx, cx - w, cy - h * 0.15 + i * h * 0.15, cx - w + 0.6 * k, cy - h * 0.15 + i * h * 0.15, LEATH_D, 0.3 * k);
  ellipse(ctx, cx, cy - h * 0.06, 1 * k, 1.2 * k, royal ? GOLD : IRON); // the boss over the grip
  if (!royal) line(ctx, cx - w + 0.2 * k, cy + h * 0.36, cx + w - 0.2 * k, cy + h * 0.36, RED, 0.7 * k);
}

/** A traveller's staff with a water gourd tied to it. */
function staff(ctx: Ctx, x: number, y: number, k: number) {
  line(ctx, x + 1 * k, y + 6 * k, x + 2.6 * k, y - 15 * k, '#8a6a3a', 1 * k);
  ellipse(ctx, x + 2.8 * k, y - 15.4 * k, 0.8 * k, 0.8 * k, '#6a4a2a');
  ellipse(ctx, x - 0.6 * k, y + 2.6 * k, 1.9 * k, 2.4 * k, '#c89a4a');
  ellipse(ctx, x - 0.6 * k, y - 0.4 * k, 0.9 * k, 1 * k, '#c89a4a');
  ellipse(ctx, x - 1.2 * k, y + 1.8 * k, 0.6 * k, 1 * k, '#e0b868');
  line(ctx, x - 0.6 * k, y - 1.2 * k, x + 1.4 * k, y - 2 * k, LEATH_D, 0.5 * k);
}

function weapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  switch (kind) {
    case 'warrior':
      spear(ctx, x, y, k, 26);
      hideShield(ctx, kind, b.off.x, b.off.y, k);
      return true;
    case 'archer':
      bracer(ctx, x, y, k);
      bow(ctx, x, y, k, 1);
      return true;
    case 'pitati':
      bracer(ctx, x, y, k);
      bow(ctx, x, y, k, 1.24, AMBER);
      return true;
    case 'defender': // the shield is drawn afterwards, like everyone's
      spear(ctx, x, y, k, 30);
      return true;
    case 'swordsman':
      sword(ctx, x, y, k);
      hideShield(ctx, kind, b.off.x, b.off.y, k);
      return true;
    case 'giant':
      spear(ctx, x, y, k, 32, GOLD);
      hideShield(ctx, kind, b.off.x, b.off.y, k);
      return true;
    case 'explorer':
      staff(ctx, x, y, k);
      return true;
  }
  return false;
}

function shield(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number): boolean {
  hideShield(ctx, kind, x, y, k);
  return true;
}

// ---------------------------------------------------------------- horsemen

/** A Kushite horseman on a Dongola horse under a red cloth with amber tassels: a spearman, or a horse archer. */
function horseman(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  const archer = kind === 'horsearcher';
  const saddle = drawHorse(ctx, x - 1, y + 3, 0.95, archer ? '#3a2a22' : '#7a4426', '#140c08', RED, RED);
  const sx = saddle.x, sy = saddle.y;
  // the saddle cloth: red with an amber border and a fringe
  poly(ctx, [sx - 6, sy - 0.8, sx + 3.6, sy - 0.8, sx + 3.2, sy + 6.2, sx - 1.2, sy + 5.2, sx - 5.4, sy + 7], RED);
  line(ctx, sx - 5.4, sy + 6.8, sx - 1.2, sy + 5, AMBER, 0.9);
  line(ctx, sx - 1.2, sy + 5, sx + 3.2, sy + 6, AMBER, 0.9);
  for (let i = 0; i < 6; i++) line(ctx, sx - 5 + i * 1.6, sy + 6.8 - (i < 3 ? i * 0.6 : (5 - i) * 0.4 + 0.4), sx - 5 + i * 1.6, sy + 8.4 - (i < 3 ? i * 0.6 : (5 - i) * 0.4 + 0.4), i % 2 ? AMBER : GOLD, 0.6);
  // a breast strap hung with bells and a plume of ostrich feathers on the brow
  line(ctx, x + 3.5, y - 9.6, x + 8, y - 3.4, LEATH_D, 1.1);
  for (let i = 0; i < 3; i++) { const t = (i + 0.5) / 3; ellipse(ctx, x + 3.5 + 4.5 * t, y - 9 + 6.2 * t, 0.7, 0.7, GOLD); }
  const hhx = x - 1 + 10.5 * 0.95, hhy = y + 3 - 15 * 0.95;
  feather(ctx, hhx + 0.4, hhy - 4.4, hhx - 2.6, hhy - 10.4, 0.8);
  const b = figure(ctx, archer ? 'archer' : 'rider', 'nubia', sx, sy, 0.9, true);
  if (archer) { bow(ctx, b.hand.x, b.hand.y, 0.9); return; }
  hideShield(ctx, 'warrior', b.off.x - 1.2, b.off.y + 1.6, 0.62);
  spear(ctx, b.hand.x, b.hand.y, 0.95, 29);
}

// ---------------------------------------------------------------- the war elephant

/** The Kushite war elephant: an African bush elephant with great ears, under a red-and-amber cloth, a leopard-skin pad
 *  on its back carrying a noble archer, a gold frontlet and bells; no tower (the Meroitic reliefs show a rider astride). */
function elephant(ctx: Ctx, x: number, y: number) {
  const skin = '#857a70', skinD = '#5e554e', lit = '#a49a90';
  curve(ctx, x - 12.6, y - 18, x - 16, y - 14, x - 15, y - 8, 1.3, skinD); // the tail
  poly(ctx, [x - 15, y - 8.8, x - 16.4, y - 5.6, x - 14.8, y - 4.8, x - 13.8, y - 6.6], '#2a2622');
  const leg = (lx: number, far: boolean) => {
    const c = far ? shade(skin, -0.18) : skin, w = 5.8;
    poly(ctx, [x + lx, y - 13, x + lx + w, y - 13, x + lx + w - 0.4, y - 1, x + lx + w - 0.9, y + 0.6, x + lx + 0.9, y + 0.6, x + lx + 0.4, y - 1], c);
    poly(ctx, [x + lx + w * 0.58, y - 13, x + lx + w, y - 13, x + lx + w - 0.4, y - 1, x + lx + w - 0.9, y + 0.6, x + lx + w * 0.58, y + 0.6], shade(c, -0.16));
    for (const v of [-6, -4.6]) line(ctx, x + lx + 0.8, y + v, x + lx + w - 0.8, y + v + 0.3, shade(c, -0.25), 0.4);
    for (const u of [1, 2.6, 4.2]) ellipse(ctx, x + lx + u, y + 0.2, 0.6, 0.45, '#e6dcc4');
    line(ctx, x + lx + 0.6, y - 2.4, x + lx + w - 0.6, y - 2.2, GOLD, 0.8); // a gold anklet
  };
  leg(-5.6, true);
  leg(8.8, true);
  leg(-10.4, false);
  leg(4.6, false);
  // the body: high shoulder, dipped back
  ellipse(ctx, x - 0.6, y - 14.6, 13.4, 8.6, skinD);
  ellipse(ctx, x - 1, y - 15.4, 13, 8.2, skin);
  ellipse(ctx, x - 4, y - 19.6, 8, 3, lit);
  for (let i = 0; i < 5; i++) curve(ctx, x - 10 + i * 4, y - 9, x - 9 + i * 4, y - 12, x - 10.4 + i * 4, y - 16, 0.35, shade(skin, -0.2));
  // the cloth: red with amber bands, hanging in a point, fringed in gold
  const cl = [x - 9.6, y - 21.6, x + 5, y - 22.6, x + 6.6, y - 12, x - 1.6, y - 8.4, x - 9.4, y - 12];
  poly(ctx, cl, RED);
  poly(ctx, [x - 9.6, y - 21.6, x - 2, y - 22.2, x - 1.6, y - 8.4, x - 9.4, y - 12], shade(RED, 0.08));
  line(ctx, x - 9.4, y - 12.6, x - 1.6, y - 9, AMBER, 1.1);
  line(ctx, x - 1.6, y - 9, x + 6.6, y - 12.6, AMBER, 1.1);
  line(ctx, x - 9.4, y - 14.4, x - 1.6, y - 11, GOLD, 0.5);
  line(ctx, x - 1.6, y - 11, x + 6.4, y - 14.4, GOLD, 0.5);
  for (let i = 0; i < 9; i++) { const t = i / 8, px = t < 0.5 ? x - 9.4 + 15.6 * t : x - 1.6 + 16.4 * (t - 0.5), py = t < 0.5 ? y - 12 + 7.2 * t : y - 8.4 - 7.2 * (t - 0.5); line(ctx, px, py, px, py + 1.6, GOLD, 0.5); }
  // the leopard-skin riding pad
  ellipse(ctx, x - 2.4, y - 22.4, 6.4, 2.2, LEOP);
  for (const [dx, dy] of [[-4.6, -0.4], [-1.6, 0.6], [1.6, -0.2], [-2.6, -1.2], [3.4, 0.6]] as const) ring(ctx, x - 2.4 + dx, y - 22.4 + dy, 0.6, 0.4, SPOT, 0.35);
  // the head and the great ear
  ellipse(ctx, x + 13.4, y - 18.4, 5.8, 7, shade(skin, -0.03));
  ellipse(ctx, x + 12, y - 23.4, 4.6, 3, lit);
  poly(ctx, [x + 11.6, y - 26.4, x + 4.8, y - 27, x + 1, y - 21.6, x + 1.6, y - 12.4, x + 6.2, y - 9.4, x + 10.6, y - 12, x + 12.4, y - 19], shade(skin, -0.08));
  poly(ctx, [x + 10.6, y - 25.2, x + 5.4, y - 25.6, x + 2.6, y - 21.4, x + 3, y - 13.4, x + 6.4, y - 11, x + 9.8, y - 13.2, x + 11.2, y - 19], shade(skin, 0.06));
  for (let i = 0; i < 4; i++) curve(ctx, x + 4 + i * 1.6, y - 24, x + 2 + i * 1.6, y - 18, x + 4.4 + i * 1.4, y - 12.4, 0.35, shade(skin, -0.2));
  // a gold frontlet with a red tassel and a string of bells across the brow
  poly(ctx, [x + 14.6, y - 24.4, x + 18.4, y - 22.4, x + 17.6, y - 18.6, x + 14.8, y - 19.4], GOLD);
  poly(ctx, [x + 14.6, y - 24.4, x + 16.2, y - 23.6, x + 15.8, y - 19.2, x + 14.8, y - 19.4], shade(GOLD, 0.2));
  ellipse(ctx, x + 16.4, y - 21.6, 0.8, 0.8, RED);
  for (let i = 0; i < 4; i++) ellipse(ctx, x + 11 + i * 1.6, y - 13.6 + i * 0.4, 0.55, 0.6, GOLD);
  ellipse(ctx, x + 17.2, y - 20.8 + 2, 0.9, 0.8, '#f4efe0'); // the eye
  ellipse(ctx, x + 17.4, y - 20.8 + 2, 0.5, 0.5, '#111116');
  // the trunk, curling, and the tusks
  ctx.strokeStyle = ink(skinD);
  ctx.lineWidth = 4.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 18.4, y - 17.6);
  ctx.quadraticCurveTo(x + 22.6, y - 12, x + 22.4, y - 5.4);
  ctx.quadraticCurveTo(x + 20, y - 0.4, x + 23.6, y - 1.6);
  ctx.stroke();
  ctx.strokeStyle = ink(skin);
  ctx.lineWidth = 3;
  ctx.stroke();
  for (let i = 0; i < 7; i++) { const t = i / 7, px = x + 19 + t * 3.4, py = y - 16 + t * 11; line(ctx, px - 1.3, py, px + 1.3, py + 0.4, shade(skin, -0.28), 0.4); }
  curve(ctx, x + 16.6, y - 14, x + 22, y - 11, x + 26, y - 16, 2, '#d8cdb0');
  curve(ctx, x + 16.6, y - 14.4, x + 22, y - 11.6, x + 25.8, y - 16.4, 0.8, '#fbf6e8');
  ellipse(ctx, x + 25.8, y - 16.2, 0.8, 0.8, GOLD); // gold-capped tips
  // the noble astride, an archer with his great bow
  const b = figure(ctx, 'knight', 'nubia', x - 2.4, y - 22.6, 0.8, true);
  bow(ctx, b.hand.x, b.hand.y, 0.8, 1.1, AMBER);
}

// ---------------------------------------------------------------- the bolt-thrower

/** A great bolt-thrower: a giant bow of horn and acacia mounted on a stock, on a wheeled frame, a winch at the back and
 *  a carved ram's head of Amun on the front; a crewman stands by with spare bolts. */
function boltThrower(ctx: Ctx, x: number, y: number) {
  // spare bolts in a rack
  for (let i = 0; i < 3; i++) { line(ctx, x - 18 + i * 1.2, y + 6.4 - i * 0.6, x - 8 + i * 1.2, y + 1.4 - i * 0.6, '#d8c08a', 0.8); poly(ctx, [x - 8 + i * 1.2, y + 0.4 - i * 0.6, x - 5.6 + i * 1.2, y + 0.2 - i * 0.6, x - 7.6 + i * 1.2, y + 2.2 - i * 0.6], IRON); }
  // the wheels and the frame
  for (const [wx, wy] of [[-8, 6], [8, 6.4]] as const) { ellipse(ctx, x + wx, y + wy, 3.4, 3.4, WOOD_D); ellipse(ctx, x + wx - 0.4, y + wy - 0.3, 2.6, 2.6, WOOD); for (let a = 0; a < 6; a++) line(ctx, x + wx - 0.4, y + wy - 0.3, x + wx - 0.4 + Math.cos(a) * 2.4, y + wy - 0.3 + Math.sin(a) * 2.4, WOOD_D, 0.4); ellipse(ctx, x + wx - 0.4, y + wy - 0.3, 0.7, 0.7, IRON); }
  box(ctx, x, y + 3, 24, 2.6, WOOD, shade(WOOD, 0.25));
  band(ctx, x, y + 3, 24, 2.6, 0.3, 0.7, RED);
  // the trestle under the stock
  for (const [bx, by] of [[x - 6, y + 1], [x + 4, y + 1.6]] as const) line(ctx, bx, by, x - 1, y - 9, WOOD_D, 1.8);
  // the stock, aimed up and to the right
  const s0: [number, number] = [x - 12, y - 4], s1: [number, number] = [x + 14, y - 15];
  line(ctx, s0[0], s0[1], s1[0], s1[1], WOOD_D, 3.4);
  line(ctx, s0[0], s0[1] - 0.8, s1[0], s1[1] - 0.8, WOOD, 1.8);
  // the winch at the back
  ellipse(ctx, s0[0] + 1, s0[1] + 0.6, 2.2, 2.2, WOOD_D);
  for (let a = 0; a < 4; a++) line(ctx, s0[0] + 1, s0[1] + 0.6, s0[0] + 1 + Math.cos(a * 1.57 + 0.3) * 3.4, s0[1] + 0.6 + Math.sin(a * 1.57 + 0.3) * 3.4, WOOD, 0.8);
  // the great bow across the front, deeply recurved, its string drawn back to the slider
  const bx = x + 7, by = y - 12;
  const draw: [number, number] = [x - 4, y - 7.4];
  for (const [c, wd] of [[WOOD_D, 2.6], ['#9a6a3a', 1.6], [HORN, 0.5]] as const) {
    curve(ctx, bx, by, bx + 3, by - 7, bx - 2, by - 13, wd, c);
    curve(ctx, bx, by, bx + 5, by + 5, bx + 3, by + 10, wd, c);
  }
  curve(ctx, bx - 2, by - 13, bx - 3.4, by - 14, bx - 2, by - 15.6, 1.2, HORN);
  curve(ctx, bx + 3, by + 10, bx + 2.6, by + 11.6, bx + 4.4, by + 12.4, 1.2, HORN);
  line(ctx, bx - 2.4, by - 14.6, draw[0], draw[1], '#ece4cc', 0.5);
  line(ctx, bx + 3.4, by + 11.4, draw[0], draw[1], '#ece4cc', 0.5);
  ellipse(ctx, bx, by, 1.4, 1.6, RED); // the binding at the centre
  // the bolt on the stock
  line(ctx, draw[0], draw[1], s1[0] + 2, s1[1] - 1, '#d8c08a', 1);
  poly(ctx, [s1[0] + 1.6, s1[1] - 2.2, s1[0] + 6, s1[1] - 2.6, s1[0] + 2.4, s1[1] + 0.4], IRON);
  poly(ctx, [draw[0], draw[1], draw[0] + 2.6, draw[1] - 2.6, draw[0] + 3.2, draw[1] - 1.2], LINEN);
  // the ram's head of Amun carved on the front of the stock, painted gold
  const rx = s1[0] - 1, ry = s1[1] + 3;
  ellipse(ctx, rx, ry, 2.4, 2, GOLD);
  ellipse(ctx, rx + 1.8, ry + 0.8, 1.4, 1, shade(GOLD, -0.1));
  curve(ctx, rx - 0.6, ry - 1.4, rx - 3.6, ry - 1, rx - 2.2, ry + 1.6, 1.1, GOLD_D); // the curled horn
  ellipse(ctx, rx + 0.6, ry - 0.6, 0.4, 0.4, '#1a1008');
  // an amber pennant on a pole
  line(ctx, x - 9, y + 1, x - 9.6, y - 16, WOOD_D, 0.8);
  poly(ctx, [x - 9.6, y - 16, x - 2.4, y - 14.6, x - 9.4, y - 12], AMBER);
  poly(ctx, [x - 9.6, y - 16, x - 2.4, y - 14.6, x - 9.6, y - 14.6], shade(AMBER, 0.25));
  // a crewman cranking the winch
  const b = figure(ctx, 'archer', 'nubia', x - 17, y + 4, 0.52);
  line(ctx, b.hand.x, b.hand.y, s0[0] + 2, s0[1] + 1, LEATH_D, 0.6);
}

// ---------------------------------------------------------------- Nile boats

/** A square sail on a mast and two yards: amber linen, with a red stripe for the warship. */
function squareSail(ctx: Ctx, mx: number, my: number, h: number, w: number, cloth: string, stripe: string | null) {
  line(ctx, mx, my, mx, my - h - 2, WOOD_D, 1.3);
  const top = my - h, bot = my - h * 0.3;
  ctx.beginPath(); // the sail bellied a little to the right
  ctx.moveTo(mx - w * 0.45, top);
  ctx.lineTo(mx + w * 0.55, top - w * 0.12);
  ctx.quadraticCurveTo(mx + w * 0.66, (top + bot) / 2, mx + w * 0.55, bot - w * 0.12);
  ctx.lineTo(mx - w * 0.45, bot);
  ctx.quadraticCurveTo(mx - w * 0.34, (top + bot) / 2, mx - w * 0.45, top);
  ctx.closePath();
  ctx.fillStyle = ink(cloth);
  ctx.fill();
  poly(ctx, [mx + w * 0.1, top - w * 0.06, mx + w * 0.55, top - w * 0.12, mx + w * 0.62, (top + bot) / 2 - w * 0.08, mx + w * 0.55, bot - w * 0.12, mx + w * 0.1, bot - w * 0.06], shade(cloth, -0.16));
  for (let i = 1; i < 4; i++) { const t = i / 4; line(ctx, mx - w * 0.45 + w * t, top - w * 0.12 * t, mx - w * 0.45 + w * t, bot - w * 0.12 * t, shade(cloth, -0.1), 0.35); }
  if (stripe) for (const t of [0.3, 0.7]) line(ctx, mx - w * 0.4, top + (bot - top) * t, mx + w * 0.55, top + (bot - top) * t - w * 0.12, stripe, 1.4);
  line(ctx, mx - w * 0.5, top, mx + w * 0.6, top - w * 0.13, WOOD, 1.1); // the yards
  line(ctx, mx - w * 0.5, bot, mx + w * 0.6, bot - w * 0.13, WOOD, 0.9);
  line(ctx, mx, my - h - 2, mx - w * 0.6, my - 1, '#b8a070', 0.35); // stays
  line(ctx, mx, my - h - 2, mx + w * 0.7, my - 2, '#b8a070', 0.35);
}

/** A papyrus-umbel finial: the bundle flares out into a fan at the tip of a curved post. */
function umbel(ctx: Ctx, x: number, y: number, k: number, dir: 1 | -1) {
  for (let i = -2; i <= 2; i++) line(ctx, x, y, x + dir * (1.2 + i * 0.2) * k + i * 0.6 * k, y - 2.6 * k + Math.abs(i) * 0.3 * k, i % 2 ? '#7a9a3a' : '#a8b84a', 0.6 * k);
  ellipse(ctx, x, y + 0.2 * k, 0.7 * k, 0.5 * k, GOLD);
}

/** A Nile hull: long and low, bound papyrus or planks, both ends sweeping up into papyrus-umbel posts. */
function nileHull(ctx: Ctx, x: number, y: number, len: number, rise: number, color: string, bound: boolean, crewBehind?: () => void) {
  const half = len / 2;
  const sheer = (t: number) => y - 4 - Math.pow(Math.abs(t), 3) * rise; // the gunwale rises steeply at both ends
  // the deck seen over the far gunwale
  poly(ctx, [x - half * 0.8, sheer(-0.8) - 1.6, x + half * 0.8, sheer(0.8) - 1.6, x + half * 0.8, sheer(0.8) + 0.4, x - half * 0.8, sheer(-0.8) + 0.4], shade(color, 0.18));
  crewBehind?.();
  const top: number[] = [];
  for (let i = 0; i <= 20; i++) { const t = -1 + i * 0.1; top.push(x + t * half, sheer(t)); }
  const bottom: number[] = [];
  for (let i = 20; i >= 0; i--) { const t = -1 + i * 0.1; const tt = Math.abs(t); bottom.push(x + t * half * 0.92, y + 2.4 - tt * tt * 6 + (tt > 0.9 ? -(tt - 0.9) * 20 : 0)); }
  poly(ctx, [...top, ...bottom], color);
  poly(ctx, [x - half * 0.8, y + 0.6, x + half * 0.8, y + 0.6, x + half * 0.6, y + 2.6, x - half * 0.6, y + 2.6], shade(color, -0.3)); // the bilge in shadow
  if (bound) { // papyrus bundles lashed with cord
    for (let i = 1; i < 12; i++) { const t = -1 + i / 6; const px = x + t * half * 0.9; line(ctx, px, sheer(t) + 0.4, px - 0.4, y + 2, shade(color, -0.25), 0.5); }
    for (const v of [1.6, 3.6]) {
      ctx.strokeStyle = ink(shade(color, -0.15)); ctx.lineWidth = 0.4; ctx.beginPath();
      for (let i = 0; i < top.length; i += 2) (i ? ctx.lineTo(top[i], top[i + 1] + v) : ctx.moveTo(top[i], top[i + 1] + v));
      ctx.stroke();
    }
  } else {
    ctx.strokeStyle = ink(AMBER); ctx.lineWidth = 1.2; ctx.beginPath(); // a painted band under the gunwale
    for (let i = 2; i < top.length - 2; i += 2) (i > 2 ? ctx.lineTo(top[i], top[i + 1] + 1.6) : ctx.moveTo(top[i], top[i + 1] + 1.6));
    ctx.stroke();
    for (let i = 1; i < 8; i++) { const px = x - half * 0.7 + i * half * 0.18; line(ctx, px, y - 2.6, px - 0.3, y + 1.6, shade(color, -0.25), 0.35); }
  }
  // the posts: the stern curls back over itself, the bow stands tall and flares into an umbel
  const sx = x - half, sy = sheer(-1), bx = x + half, by = sheer(1);
  curve(ctx, sx + 1, sy + 1, sx - 2.6, sy - 3, sx - 0.4, sy - 6.4, 1.8, color);
  umbel(ctx, sx - 0.4, sy - 6.4, 1, -1);
  curve(ctx, bx - 1, by + 1, bx + 2.6, by - 3, bx + 1.2, by - 7, 1.8, color);
  for (const v of [-1.6, -3.4]) line(ctx, bx + 0.6, by + v, bx + 2.4, by + v - 0.4, RED, 0.6); // lashings
  umbel(ctx, bx + 1.2, by - 7, 1.1, 1);
  // a painted eye of protection near the bow
  ellipse(ctx, bx - 5, sheer(0.8) + 2.4, 1.1, 0.7, LINEN);
  ellipse(ctx, bx - 4.8, sheer(0.8) + 2.4, 0.5, 0.5, '#1a1008');
  // foam at the waterline
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - half * 0.7, y + 2.2);
  ctx.quadraticCurveTo(x, y + 4.6, x + half * 0.7, y + 1.8);
  ctx.stroke();
  return { sheer };
}

function nileBoat(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  const crew = (cx: number, cy: number, kd: UnitKind, kk: number) => figure(ctx, kd, 'nubia', cx, cy, kk, true);
  if (kind === 'boat') { // a papyrus skiff with one square sail, a poler and a bundle of goods
    squareSail(ctx, x + 1, y - 4, 22, 16, AMBER, null);
    nileHull(ctx, x, y, 34, 5, '#a8a048', true, () => {
      box(ctx, x + 7, y - 6, 4, 3, '#c8a870', '#dcc090');
      const b = crew(x - 8, y - 4.6, 'explorer', 0.46);
      line(ctx, b.hand.x, b.hand.y - 6, b.hand.x - 4, b.hand.y + 8, WOOD_D, 0.7); // the punting pole
    });
    return;
  }
  if (kind === 'ship') { // a planked river ship: a square sail, a cabin of matting, jars of grain and a steering oar
    squareSail(ctx, x + 3, y - 5, 28, 22, AMBER, null);
    nileHull(ctx, x, y, 46, 6.4, '#9a6a3a', false, () => {
      box(ctx, x - 10, y - 6, 7, 5, '#c8a060', '#dcb878'); // the cabin
      for (const u of [0.25, 0.5, 0.75]) faceQuad(ctx, 'R', x - 10, y - 6, 7, 5, u, u + 0.06, 0, 1, '#8a6a3a');
      for (const jx of [8, 10.4, 12.8]) { ellipse(ctx, x + jx, y - 7, 1.3, 1.8, '#b0683a'); ellipse(ctx, x + jx, y - 8.8, 0.7, 0.4, '#8a4a2a'); }
      crew(x - 17, y - 6.4, 'archer', 0.44);
      crew(x + 1, y - 5, 'warrior', 0.44);
    });
    line(ctx, x - 20, y - 10, x - 24, y + 2, WOOD_D, 1.2); // the steering oar
    ellipse(ctx, x - 23.8, y + 1.6, 1, 2, WOOD);
    return;
  }
  // the warship: a long rowed galley, a great amber sail striped red, a deck of archers and hide shields on the rail
  squareSail(ctx, x + 3, y - 6, 32, 26, AMBER, RED);
  const h = nileHull(ctx, x, y, 54, 8, '#8a5a32', false, () => {
    crew(x - 16, y - 6.6, 'archer', 0.44);
    crew(x - 7, y - 5.4, 'pitati', 0.44);
    crew(x + 12, y - 5.4, 'archer', 0.44);
  });
  for (let i = 0; i < 6; i++) { // oars
    const px = x - 16 + i * 6.4;
    line(ctx, px, y - 1, px - 3.6, y + 4, WOOD_D, 0.8);
  }
  for (let i = 0; i < 5; i++) { // hide shields along the rail
    const px = x - 13 + i * 6.4, py = h.sheer((px - x) / 27) + 1.2;
    ellipse(ctx, px, py, 1.6, 2.2, LEATH_D);
    ellipse(ctx, px - 0.2, py - 0.2, 1.3, 1.9, i % 2 ? '#f0e8d8' : '#3a2a1e');
    ellipse(ctx, px - 0.2, py + 0.4, 0.7, 0.5, i % 2 ? '#3a2a1e' : '#f0e8d8');
  }
  line(ctx, x - 25, y - 13, x - 29, y + 2, WOOD_D, 1.3); // the steering oar
  ellipse(ctx, x - 28.8, y + 1.6, 1.1, 2.2, WOOD);
}

/** The Pitati Archer: drawn a head taller than the line, a hide quiver of red-fletched arrows on his back. */
function pitati(ctx: Ctx, x: number, y: number) {
  const k = 1.12;
  const qx = x - 7 * k, qy = y - 8 * k;
  for (const i of [-1, 0, 1, 2]) { // the arrows sticking out of the quiver
    const tx = qx - 1.8 * k + i * 1.2 * k, ty = qy - 16 * k + Math.abs(i) * 0.6 * k;
    line(ctx, qx + i * 0.8 * k, qy - 8 * k, tx, ty, '#d8c08a', 0.7 * k);
    poly(ctx, [tx, ty, tx - 1 * k, ty - 2.6 * k, tx + 0.4 * k, ty - 1.2 * k], i % 2 ? RED : LINEN);
    poly(ctx, [tx, ty, tx + 1.1 * k, ty - 2.4 * k, tx + 0.4 * k, ty - 1.2 * k], shade(i % 2 ? RED : LINEN, -0.3));
  }
  box(ctx, qx, qy, 4 * k, 9 * k, LEOP, shade(LEOP, 0.2)); // a leopard-skin quiver
  for (const [u, v] of [[0.3, 0.3], [0.7, 0.6], [0.4, 0.8]] as const) { const [px, py] = fpt('R', qx, qy, 4 * k, 9 * k, u, v); ring(ctx, px, py, 0.5 * k, 0.4 * k, SPOT, 0.35 * k); }
  band(ctx, qx, qy, 4 * k, 9 * k, 0.86, 0.96, RED);
  const b = figure(ctx, 'pitati', 'nubia', x, y, k);
  weapon(ctx, 'pitati', b, k);
}

function unit(ctx: Ctx, kind: UnitKind, x: number, y: number): boolean {
  switch (kind) {
    case 'rider': case 'horsearcher': horseman(ctx, kind, x, y); return true;
    case 'knight': elephant(ctx, x, y); return true;
    case 'pitati': pitati(ctx, x, y); return true;
    case 'catapult': boltThrower(ctx, x, y); return true;
    case 'boat': case 'ship': case 'warship': nileBoat(ctx, kind, x, y); return true;
  }
  return false;
}

// ---------------------------------------------------------------- buildings

/** A mud-brick house with rounded corners: the walls swell out at the corners and the parapet is softly rounded. */
function mudHouse(ctx: Ctx, x: number, y: number, w: number, h: number, wall: string, door: 'L' | 'R', extra: 'pots' | 'stair' | 'none') {
  softShadow(ctx, x + 1, y + 1.6, w * 0.75, w * 0.32, 0.22);
  const hw = w / 2, hq = w / 4, r = Math.min(1.6, w * 0.14);
  const lit = shade(wall, 0.08), dark = shade(wall, -0.2), top = shade(wall, 0.2);
  // the walls: the outline is pulled in at the top corners so the block reads as a rounded, hand-smoothed mass
  poly(ctx, [x - hw, y, x, y + hq, x, y + hq - h, x - hw + r * 0.6, y - h + r * 0.4, x - hw, y - h + r * 1.2], lit);
  poly(ctx, [x + hw, y, x, y + hq, x, y + hq - h, x + hw - r * 0.6, y - h + r * 0.4, x + hw, y - h + r * 1.2], dark);
  ellipse(ctx, x, y + hq - h + 0.2, r * 0.7, r * 0.5, mix(lit, dark, 0.5)); // the rounded front corner
  poly(ctx, [x - hw + r * 0.6, y - h + r * 0.4, x, y + hq - h, x + hw - r * 0.6, y - h + r * 0.4, x, y - hq - h + r * 0.3], top);
  // the roof: a low rounded parapet and a lip of palm-rib beams
  ellipse(ctx, x, y - h + 0.2, hw * 0.62, hq * 0.62, shade(wall, 0.08)); // the roof dipping inside the parapet
  ellipse(ctx, x + 0.4, y - h + 0.5, hw * 0.5, hq * 0.48, shade(wall, -0.04));
  for (const u of [0.15, 0.5, 0.85]) { const [px, py] = fpt('R', x, y, w, h, u, 0.88); line(ctx, px, py, px + 1.4, py + 0.4, '#5a3a1e', 0.6); }
  band(ctx, x, y, w, h, 0, 0.12, shade(wall, -0.14)); // the plinth
  // a doorway with a red-painted frame and a small high window
  faceQuad(ctx, door, x, y, w, h, 0.32, 0.56, 0.06, 0.66, RED);
  faceQuad(ctx, door, x, y, w, h, 0.36, 0.52, 0.06, 0.6, '#2a1a10');
  faceQuad(ctx, door === 'R' ? 'L' : 'R', x, y, w, h, 0.4, 0.56, 0.6, 0.78, '#3a2a1e');
  // a painted band of triangles under the parapet
  for (let i = 0; i < 5; i++) { const u = 0.08 + i * 0.2; fpoly(ctx, 'L', x, y, w, h, [[u, 0.84], [u + 0.12, 0.84], [u + 0.06, 0.74]], i % 2 ? AMBER : RED); }
  if (extra === 'pots') for (const [dx, dy, c] of [[w * 0.55, 2, '#b0683a'], [w * 0.7, 0.4, '#c88a4a']] as const) { ellipse(ctx, x + dx, y + dy, 1.4, 1.8, c); ellipse(ctx, x + dx, y + dy - 1.8, 0.8, 0.4, shade(c, -0.3)); }
  if (extra === 'stair') for (let i = 0; i < 4; i++) { const [px, py] = fpt('L', x, y, w, h, 0.18 + i * 0.12, 0.1 + i * 0.22); box(ctx, px, py, 2, 0.8, shade(wall, -0.06)); }
}

/** A round hut: a mud wall under a steep conical thatch roof with a topknot. */
function hut(ctx: Ctx, x: number, y: number, r: number, h: number) {
  softShadow(ctx, x + 1, y + 1.2, r * 1.5, r * 0.6, 0.22);
  // the wall: a squat cylinder
  ctx.beginPath();
  ctx.moveTo(x - r, y - h);
  ctx.lineTo(x - r, y);
  ctx.ellipse(x, y, r, r * 0.45, 0, Math.PI, 0, true);
  ctx.lineTo(x + r, y - h);
  ctx.closePath();
  ctx.fillStyle = ink(MUD);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + r * 0.2, y - h + r * 0.44);
  ctx.lineTo(x + r * 0.2, y + r * 0.44);
  ctx.ellipse(x, y, r, r * 0.45, 0, Math.PI * 0.43, 0, true);
  ctx.lineTo(x + r, y - h);
  ctx.closePath();
  ctx.fillStyle = ink(shade(MUD, -0.2));
  ctx.fill();
  poly(ctx, [x - r * 0.4, y + r * 0.4, x + 0.1 * r, y + r * 0.44, x + 0.1 * r, y - h * 0.5 + r * 0.44, x - r * 0.4, y - h * 0.5 + r * 0.4], '#2a1a10'); // the door
  line(ctx, x - r, y - h * 0.3, x + r, y - h * 0.3, RED, 0.5);
  // the thatch: a steep cone with an overhanging eave, ridged
  const ry = y - h, apexY = ry - r * 1.8;
  ctx.beginPath();
  ctx.moveTo(x - r * 1.25, ry + 0.4);
  ctx.ellipse(x, ry + 0.4, r * 1.25, r * 0.5, 0, Math.PI, 0, true);
  ctx.lineTo(x, apexY);
  ctx.closePath();
  ctx.fillStyle = ink(THATCH);
  ctx.fill();
  poly(ctx, [x + r * 0.15, ry + r * 0.88, x + r * 1.25, ry + 0.4, x, apexY], shade(THATCH, -0.22));
  for (let i = 0; i < 7; i++) { const a = Math.PI * (0.1 + i * 0.13); const ex = x - Math.cos(a) * r * 1.2, ey = ry + 0.4 + Math.sin(a) * r * 0.5; line(ctx, x, apexY + 1, ex, ey, shade(THATCH, i > 4 ? -0.32 : -0.14), 0.4); }
  for (let i = 0; i < 9; i++) { const a = Math.PI * (0.05 + i * 0.11); line(ctx, x - Math.cos(a) * r * 1.25, ry + 0.4 + Math.sin(a) * r * 0.5, x - Math.cos(a) * r * 1.28, ry + 1.6 + Math.sin(a) * r * 0.5, shade(THATCH, -0.1), 0.5); } // the ragged eave
  line(ctx, x, apexY + 0.6, x, apexY - 2, '#7a5a2a', 0.9); // the topknot
  ellipse(ctx, x, apexY - 2.2, 0.8, 0.6, '#8a6a3a');
}

/** A temple pylon of Amun: two great battered towers flanking a gate, cavetto cornices, flagstaffs with red pennants,
 *  and the hall behind; an avenue ram before it. */
function pylon(ctx: Ctx, x: number, y: number, s = 1, stone = SANDSTONE) {
  const lit = shade(stone, 0.18), dark = shade(stone, -0.16), top = shade(stone, 0.32);
  softShadow(ctx, x + 1, y + 2, 15 * s, 6 * s, 0.24);
  // the hall behind
  box(ctx, x + 4 * s, y - 4 * s, 12 * s, 7 * s, stone, top);
  // the two towers: their faces lean in toward the top (battered), their front turned to the lower left
  const tower = (ox: number, oy: number) => {
    const bx = x + ox * s, by = y + oy * s, w = 7 * s, hb = 15 * s, inset = 1 * s;
    poly(ctx, [bx - w / 2, by, bx + w / 2 - 1 * s, by + w / 4 - 0.5 * s, bx + w / 2 - 1 * s - inset, by + w / 4 - 0.5 * s - hb, bx - w / 2 + inset, by - hb], lit);
    poly(ctx, [bx + w / 2 - 1 * s, by + w / 4 - 0.5 * s, bx + w / 2 + 2 * s, by + w / 4 - 2 * s, bx + w / 2 + 2 * s - inset, by + w / 4 - 2 * s - hb, bx + w / 2 - 1 * s - inset, by + w / 4 - 0.5 * s - hb], dark);
    poly(ctx, [bx - w / 2 + inset, by - hb, bx + w / 2 - 1 * s - inset, by + w / 4 - 0.5 * s - hb, bx + w / 2 + 2 * s - inset, by + w / 4 - 2 * s - hb, bx - w / 2 + inset + 3 * s, by - hb - 1.5 * s], top);
    // the cornice and torus moulding
    line(ctx, bx - w / 2 + inset - 0.4 * s, by - hb + 1 * s, bx + w / 2 - 1 * s - inset + 0.4 * s, by + w / 4 - 0.5 * s - hb + 1 * s, shade(stone, 0.4), 1.2 * s);
    line(ctx, bx - w / 2 + 0.2 * s, by - 0.4 * s, bx - w / 2 + inset, by - hb + 1.6 * s, shade(stone, 0.32), 0.6 * s); // the torus at the edge
    // a relief of the king with his bow, as a dark carved silhouette, and a winged sun
    const fx = bx - 0.6 * s, fy = by - hb * 0.42;
    line(ctx, fx, fy + 2.4 * s, fx, fy - 2.6 * s, shade(stone, -0.24), 1.1 * s);
    ellipse(ctx, fx, fy - 3.4 * s, 0.7 * s, 0.8 * s, shade(stone, -0.24));
    curve(ctx, fx + 1.4 * s, fy - 3.4 * s, fx + 3 * s, fy - 0.6 * s, fx + 1.6 * s, fy + 2.2 * s, 0.5 * s, shade(stone, -0.24));
    // a flagstaff with a red pennant
    line(ctx, bx - 1.8 * s, by + 0.6 * s, bx - 1.8 * s, by - hb - 7 * s, WOOD_D, 0.7 * s);
    poly(ctx, [bx - 1.8 * s, by - hb - 7 * s, bx + 3 * s, by - hb - 6 * s, bx - 1.8 * s, by - hb - 4.4 * s], RED);
  };
  tower(-5.6, -1.6);
  // the gate between them: a tall lintel and dark doorway
  const gx = x + 0.6 * s, gy = y + 1.4 * s;
  poly(ctx, [gx - 2 * s, gy - 0.6 * s, gx + 2.2 * s, gy + 0.6 * s, gx + 2.2 * s, gy - 11 * s, gx - 2 * s, gy - 12.2 * s], lit);
  poly(ctx, [gx - 1.2 * s, gy - 0.4 * s, gx + 1.4 * s, gy + 0.4 * s, gx + 1.4 * s, gy - 8 * s, gx - 1.2 * s, gy - 8.8 * s], '#2a160c');
  ellipse(ctx, gx + 0.1 * s, gy - 10.2 * s, 1.4 * s, 0.6 * s, GOLD); // the winged sun over the gate
  line(ctx, gx - 1.8 * s, gy - 10.6 * s, gx + 2 * s, gy - 9.8 * s, BEAD_B, 0.4 * s);
  tower(6, 2.2);
}

/** A recumbent ram of Amun on a plinth, a little king standing between its forelegs. */
function ram(ctx: Ctx, x: number, y: number, s = 1) {
  const st = '#c8a888';
  box(ctx, x, y, 7 * s, 2 * s, shade(st, -0.12), shade(st, 0.1));
  const by = y - 2.6 * s;
  ellipse(ctx, x - 0.6 * s, by - 1 * s, 3.4 * s, 1.8 * s, st); // the body
  ellipse(ctx, x - 1.2 * s, by - 1.8 * s, 2.2 * s, 0.8 * s, shade(st, 0.14));
  ellipse(ctx, x + 2.8 * s, by - 2.6 * s, 1.5 * s, 1.3 * s, st); // the head
  ellipse(ctx, x + 3.9 * s, by - 2.2 * s, 0.9 * s, 0.7 * s, shade(st, -0.06)); // the muzzle
  curve(ctx, x + 2.6 * s, by - 3.4 * s, x + 0.8 * s, by - 3.4 * s, x + 1.6 * s, by - 1.6 * s, 0.9 * s, shade(st, -0.26)); // the curled horn
  ellipse(ctx, x + 3.2 * s, by - 3 * s, 0.25 * s, 0.25 * s, '#2a1a10');
  ellipse(ctx, x + 2.6 * s, by - 4.2 * s, 0.6 * s, 0.5 * s, GOLD); // the sun disc on its head
  line(ctx, x + 3.6 * s, by - 0.8 * s, x + 3.6 * s, by + 0.6 * s, shade(st, -0.2), 0.9 * s); // the little king
  ellipse(ctx, x + 3.6 * s, by - 1.2 * s, 0.4 * s, 0.4 * s, shade(st, -0.2));
}

/** The capital: two steep pyramids behind a pylon temple of Amun, and a ram on the processional way. */
function capitalComplex(ctx: Ctx, x: number, y: number) {
  pyramid(ctx, x - 9, y - 9, 4.2, 22, shade(SANDSTONE, -0.05), false);
  pyramid(ctx, x + 3, y - 12, 3.4, 18, shade(SANDSTONE, -0.1), false);
  pylon(ctx, x + 1, y + 1, 0.9);
  ram(ctx, x - 12, y + 7, 1.2);
  ram(ctx, x + 13, y + 9, 1.1);
}

/** The ordinary big building: a palace of red sandstone and mud brick, with a single pyramid's chapel in front. */
function palace(ctx: Ctx, x: number, y: number) {
  softShadow(ctx, x + 1, y + 2, 14, 6, 0.22);
  mudHouse(ctx, x - 1, y, 18, 8, MUD_L, 'R', 'none');
  box(ctx, x + 6, y - 6, 6, 9, SANDSTONE, shade(SANDSTONE, 0.3)); // a tower of red sandstone
  band(ctx, x + 6, y - 6, 6, 9, 0.86, 0.94, AMBER);
  faceQuad(ctx, 'R', x + 6, y - 6, 6, 9, 0.3, 0.6, 0.5, 0.75, '#2a1a10');
  chapel(ctx, x - 8, y + 5, 0.9);
  hut(ctx, x + 10, y + 5, 3, 3);
}

function building(ctx: Ctx, x: number, y: number, big: boolean, _roofC: string, capital: boolean) {
  if (big && capital) return capitalComplex(ctx, x, y);
  if (big) return palace(ctx, x, y);
  const spot: Record<string, number> = { '-10,2': 0, '10,2': 1, '0,8': 2, '-6,-8': 3, '7,-7': 4, '-14,-3': 1, '14,-2': 2 };
  const v = spot[`${Math.round(x)},${Math.round(y)}`] ?? ((Math.round(x) * 7 + Math.round(y) * 3) % 5 + 5) % 5;
  if (v === 0) mudHouse(ctx, x, y, 11, 7, MUD_L, 'R', 'pots');
  else if (v === 1) hut(ctx, x, y, 4, 4);
  else if (v === 2) { mudHouse(ctx, x, y, 10, 8, SANDSTONE, 'R', 'stair'); }
  else if (v === 3) { hut(ctx, x - 3, y, 3.4, 3.4); hut(ctx, x + 4, y + 2, 3, 3); }
  else { mudHouse(ctx, x, y, 10, 7, MUD, 'L', 'none'); doum(ctx, x + 6, y + 3, 0.5, 1); }
}

// ---------------------------------------------------------------- trees

/** A doum palm: a trunk that forks (once or twice) into branches, each topped by a crown of stiff fan leaves, with
 *  clusters of glossy brown doum fruit hanging under the crowns. */
function doum(ctx: Ctx, x: number, y: number, k: number, variant: number, P?: BiomePalette) {
  const trunk = P?.trunk ?? '#6a4a2a';
  const green = P ? mix(P.forest, '#7a9a3a', 0.45) : '#6a9a3a';
  const fork = (x0: number, y0: number, x1: number, y1: number, w: number) => {
    line(ctx, x0, y0, x1, y1, shade(trunk, -0.15), w * k);
    line(ctx, x0 - 0.3 * k, y0, x1 - 0.3 * k, y1, shade(trunk, 0.15), w * 0.4 * k);
    for (let i = 1; i < 4; i++) { const t = i / 4, px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t; line(ctx, px - w * 0.5 * k, py, px + w * 0.5 * k, py - 0.3 * k, shade(trunk, -0.35), 0.4 * k); }
  };
  const crown = (cx: number, cy: number, r: number) => {
    // fan leaves: stiff, wedge-shaped, spreading out all round, the lower ones drooping and dry
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (1.05 + i * 0.11) + (i % 2) * 0.05;
      const ex = cx + Math.cos(a) * r * k, ey = cy + Math.sin(a) * r * 0.75 * k;
      const c = i < 2 || i > 7 ? shade(green, -0.24) : i % 2 ? green : shade(green, 0.12);
      poly(ctx, [cx, cy, ex + Math.cos(a + 1.57) * 1.6 * k, ey + Math.sin(a + 1.57) * 1.2 * k, ex, ey, ex - Math.cos(a + 1.57) * 1.6 * k, ey - Math.sin(a + 1.57) * 1.2 * k], c);
      for (let j = -1; j <= 1; j++) line(ctx, cx, cy, ex + j * Math.cos(a + 1.57) * 1.1 * k, ey + j * Math.sin(a + 1.57) * 0.8 * k, shade(c, -0.18), 0.3 * k); // the ribs of the fan
    }
    for (const a of [0.4, 1.0, 2.2, 2.7]) { // drooping dead leaves below
      const ex = cx + Math.cos(a) * r * 0.7 * k, ey = cy + Math.sin(a) * r * 0.6 * k + 1.6 * k;
      poly(ctx, [cx, cy, ex - 1 * k, ey, ex + 1 * k, ey + 0.4 * k], '#a08a4a');
    }
    for (const dx of [-1.2, 1]) for (let i = 0; i < 3; i++) ellipse(ctx, cx + (dx + (i % 2) * 0.6) * k, cy + (1.4 + i * 0.8) * k, 0.7 * k, 0.8 * k, i % 2 ? '#8a4a1c' : '#a8602a'); // the fruit
    ellipse(ctx, cx, cy, 1 * k, 0.8 * k, shade(green, 0.2));
  };
  const lean = (rand(variant, 1) - 0.5) * 3 * k;
  const fx = x + lean, fy = y - (10 + rand(variant, 2) * 3) * k; // the fork
  fork(x, y, fx, fy, 2.2);
  const twice = variant % 2 === 0;
  const a1: [number, number] = [fx - 4.6 * k, fy - 7 * k], a2: [number, number] = [fx + 4.4 * k, fy - 6 * k];
  fork(fx, fy, a1[0], a1[1], 1.6);
  fork(fx, fy, a2[0], a2[1], 1.6);
  if (twice) { // the left branch forks again
    const b1: [number, number] = [a1[0] - 2.6 * k, a1[1] - 4.6 * k], b2: [number, number] = [a1[0] + 1.6 * k, a1[1] - 5.4 * k];
    fork(a1[0], a1[1], b1[0], b1[1], 1.2);
    fork(a1[0], a1[1], b2[0], b2[1], 1.2);
    crown(b1[0], b1[1], 5.4);
    crown(b2[0], b2[1], 5);
  } else crown(a1[0], a1[1], 6);
  crown(a2[0], a2[1], 6);
}

/** A flat-topped acacia: a thin twisted trunk splaying into branches under a wide flat layered canopy. */
function acacia(ctx: Ctx, x: number, y: number, k: number, variant: number, P: BiomePalette) {
  const trunk = shade(P.trunk, 0.05), green = mix(P.forest, '#8a9a3a', 0.35);
  const cy = y - 14 * k, w = (11 + rand(variant, 3) * 3) * k;
  curve(ctx, x, y, x - 1.6 * k, y - 7 * k, x - 0.4 * k, cy + 3 * k, 1.8 * k, shade(trunk, -0.15));
  for (const [dx, c] of [[-6, -3], [-2, -6], [3, -5], [7, -2]] as const) curve(ctx, x - 0.4 * k, cy + 3 * k, x + dx * 0.4 * k, cy + 1 * k, x + dx * k, cy + c * 0.2 * k, 1 * k, shade(trunk, -0.1));
  // the canopy in two flat layers, darker below
  ellipse(ctx, x + 0.4 * k, cy + 0.8 * k, w, 3.4 * k, shade(green, -0.28));
  ellipse(ctx, x, cy - 0.2 * k, w * 0.96, 3 * k, green);
  ellipse(ctx, x - 1.4 * k, cy - 1.8 * k, w * 0.66, 2.2 * k, shade(green, 0.08));
  ellipse(ctx, x - 2.4 * k, cy - 2.8 * k, w * 0.36, 1.2 * k, shade(green, 0.2));
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; ellipse(ctx, x + Math.cos(a) * w * 0.9, cy + Math.sin(a) * 2.6 * k, 1.4 * k, 0.9 * k, i % 2 ? green : shade(green, -0.12)); } // ragged edge
  for (let i = 0; i < 4; i++) ellipse(ctx, x - w * 0.5 + i * w * 0.34, cy - 1 * k + (i % 2) * 1.2 * k, 0.4 * k, 0.4 * k, '#e8d870'); // yellow puffball flowers
}

function tree(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  const v = variant % 4;
  if (v === 1 || v === 3) return acacia(ctx, x, y, k, variant, P);
  doum(ctx, x, y, k * 0.95, variant, P);
}

registerArt('nubia', {
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

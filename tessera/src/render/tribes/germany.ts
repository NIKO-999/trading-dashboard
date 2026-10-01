// The Holy Roman Empire: its own art (see render/tribeart).
// Landsknechts in slashed and puffed doublets and hose of clashing red and yellow, black and white, each leg a different
// colour, under huge slashed berets heaped with ostrich plumes, their zweihänder (the great two-handed sword with its
// parrying hooks) sloped at the shoulder; halberdiers under the iron kettle hat (Eisenhut), pikemen and men-at-arms in
// fluted Gothic plate under sallets with a bevor; arquebusiers with a forked musket rest, a burning match and a bandolier
// of powder flasks; black Reiters in blackened armour with wheellock pistols; knights of the Teutonic Order in Gothic plate
// under the white mantle with the black cross, a great helm, on barded horses; heater shields with the black single-headed
// eagle on gold, and Barbarossa under the octagonal imperial crown with the orb and the imperial sword. A bronze cannon on
// a field carriage; a Rhine barge, a Hanse cog with the red-and-white pennant, and a war cog with castles fore and aft.
// Half-timbered houses with steep red roofs, brick houses with stepped gables, a guild hall; for the capital a castle on a
// crag over the Rhine and a twin-spired Gothic cathedral. Spruce and silver fir of the Black Forest, beech and linden.
import { registerArt, type Body } from '../tribeart';
import { drawHorse, figure } from '../units';
import type { BiomePalette } from '../../data/tribes';
import type { UnitKind } from '../../game/types';
import { band, box, ellipse, faceQuad, ink, line, mix, poly, rand, shade, type Ctx } from '../prims';

const RED = '#c42a2a';
const RED_L = '#e0504a';
const RED_D = '#7a1414';
const YEL = '#f0c430';
const YEL_D = '#b08a18';
const BLACK = '#1c1a1c';
const BLACK_L = '#3a363a';
const WHITE = '#f2efe6';
const WHITE_D = '#cfcabc';
const GOLD = '#e8b830';
const GOLD_L = '#fadc78';
const GOLD_D = '#9a7018';
const STEEL = '#c4cad2';
const STEEL_L = '#eef2f6';
const STEEL_D = '#6a727c';
const BSTEEL = '#3a3c44'; // blackened steel of the Reiters
const BSTEEL_L = '#6a6e7a';
const WOOD = '#7a5230';
const WOOD_D = '#4a3018';
const BRONZE = '#b8823a';
const BRONZE_L = '#e0b060';
const BRONZE_D = '#7a4e1e';
const IRON = '#4a4e58';
const PLASTER = '#f0e6cc';
const BEAM = '#3a2418';
const BRICK = '#a8482e';
const BRICK_D = '#7a3020';
const STONE = '#b4ac9c';
const STONE_L = '#dcd4c2';
const SAND = '#c8a888'; // the red-grey sandstone of the Rhine and of Cologne
const SLATE = '#4a5260';
const HAIR = '#8a6a3a';
const GINGER = '#c0582a';
const SKIN = '#f0caa6';

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

/** An elliptical outline. */
function ring(ctx: Ctx, x: number, y: number, rx: number, ry: number, c: string, w: number) {
  ctx.strokeStyle = ink(c);
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
}

/** A rounded dome (a helmet bowl): the rim is the ellipse at (x, y), the crown rises `h` above it. */
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

const clipPoly = (ctx: Ctx, pts: number[]) => {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.clip();
};

/** A point on one face of a box(x, y, w, h), as faceQuad's (u, v). */
const fp = (f: 'L' | 'R', x: number, y: number, w: number, h: number, u: number, v: number): [number, number] => f === 'R'
  ? [x + (u * w) / 2, y + (w / 4) * (1 - u) - v * h]
  : [x - w / 2 + (u * w) / 2, y + (w / 4) * u - v * h];

/** A line drawn on a face of a box, from (u0, v0) to (u1, v1). */
function faceLine(ctx: Ctx, f: 'L' | 'R', x: number, y: number, w: number, h: number, u0: number, v0: number, u1: number, v1: number, c: string, wd: number) {
  line(ctx, ...fp(f, x, y, w, h, u0, v0), ...fp(f, x, y, w, h, u1, v1), c, wd);
}

// ---------------------------------------------------------------- heraldry

/** The Reichsadler: the black single-headed eagle displayed, its head turned to the viewer's left, beak and claws red.
 *  (cx, cy) is the middle of the body; the span is about 10s. */
export function eagle(ctx: Ctx, cx: number, cy: number, s: number, c = BLACK, arm = RED) {
  for (const d of [-1, 1]) {
    const X = (v: number) => cx + d * v * s;
    // the wing raised, its pinions spread in fingers along the lower edge
    poly(ctx, [X(0.5), cy - 1 * s, X(1.6), cy - 2.6 * s, X(3.4), cy - 3.2 * s, X(4.8), cy - 3 * s, X(4.4), cy - 2 * s, X(5), cy - 1.6 * s,
      X(4.2), cy - 0.9 * s, X(4.6), cy - 0.3 * s, X(3.6), cy + 0.1 * s, X(3.7), cy + 0.7 * s, X(2.6), cy + 0.5 * s, X(2.4), cy + 1.1 * s, X(1.2), cy + 0.6 * s, X(0.5), cy + 0.6 * s], c);
    // the legs and claws
    line(ctx, X(0.6), cy + 1.6 * s, X(1.6), cy + 2.8 * s, c, 0.55 * s);
    for (const a of [-0.5, 0, 0.5]) line(ctx, X(1.6), cy + 2.8 * s, X(2 + a * 0.4), cy + 3.4 * s + Math.abs(a) * 0.2 * s, arm, 0.3 * s);
  }
  ellipse(ctx, cx, cy + 0.4 * s, 1.1 * s, 2 * s, c); // the body
  poly(ctx, [cx - 0.9 * s, cy + 2 * s, cx + 0.9 * s, cy + 2 * s, cx + 1.5 * s, cy + 3.8 * s, cx + 0.5 * s, cy + 3.3 * s, cx, cy + 3.9 * s, cx - 0.5 * s, cy + 3.3 * s, cx - 1.5 * s, cy + 3.8 * s], c); // the tail
  ellipse(ctx, cx - 0.2 * s, cy - 2.2 * s, 0.85 * s, 0.85 * s, c); // the head
  poly(ctx, [cx - 0.8 * s, cy - 2.5 * s, cx - 2 * s, cy - 2.2 * s, cx - 1.2 * s, cy - 1.6 * s, cx - 0.8 * s, cy - 1.9 * s], arm); // beak
  if (s > 0.7) poly(ctx, [cx - 1 * s, cy - 1.8 * s, cx - 1.6 * s, cy - 0.9 * s, cx - 0.7 * s, cy - 1.5 * s], arm); // the tongue
}

/** A heater shield, gold with the black eagle (or white with the black cross of the Teutonic Order), its top at y - 11k. */
function heater(ctx: Ctx, x: number, y: number, k: number, arms: 'eagle' | 'cross' = 'eagle', size = 1) {
  const s = k * size;
  const cx = x - 1.6 * s, top = y - 11 * s, w = 5.4 * s, h = 12.4 * s;
  const pts: number[] = [cx - w, top, cx + w, top + 0.8 * s];
  for (let i = 1; i <= 8; i++) { const t = i / 8; pts.push(cx + w * (1 - t * t), top + 0.8 * s + (h - 0.8 * s) * t); }
  for (let i = 7; i >= 1; i--) { const t = i / 8; pts.push(cx - w * (1 - t * t) - 0.3 * s * t, top + h * t); }
  const field = arms === 'eagle' ? GOLD : WHITE;
  poly(ctx, pts.map((v, i) => (i % 2 ? v + 0.8 * s : v + 1 * s)), shade(field, -0.5)); // its thickness
  poly(ctx, pts, field);
  ctx.save();
  clipPoly(ctx, pts);
  if (arms === 'eagle') eagle(ctx, cx - 0.2 * s, top + h * 0.38, 0.95 * s);
  else {
    poly(ctx, [cx - 1.3 * s, top - 1, cx + 1.3 * s, top - 1, cx + 1.3 * s, top + h + 1, cx - 1.3 * s, top + h + 1], BLACK);
    poly(ctx, [cx - w - 1, top + 3.6 * s, cx + w + 1, top + 3.8 * s, cx + w + 1, top + 6.2 * s, cx - w - 1, top + 6 * s], BLACK);
  }
  poly(ctx, [cx - w, top, cx - w * 0.4, top + 0.2 * s, cx - w * 0.3, top + h, cx - w, top + h], 'rgba(255,255,255,0.14)');
  ctx.restore();
  ctx.strokeStyle = ink(arms === 'eagle' ? GOLD_D : STEEL_D);
  ctx.lineWidth = 0.6 * s;
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.stroke();
}

/** A flag of the Empire: the black eagle on gold, streaming from (x, y) on the staff. */
function eagleFlag(ctx: Ctx, x: number, y: number, w: number, h: number, wave = 0) {
  const pts = [x, y, x + w * 0.5, y + 0.6 + wave, x + w, y + 0.2, x + w, y + h - 0.2, x + w * 0.5, y + h + 0.4 - wave, x, y + h];
  poly(ctx, pts, GOLD);
  ctx.save();
  clipPoly(ctx, pts);
  eagle(ctx, x + w * 0.5, y + h * 0.42, h * 0.11);
  poly(ctx, [x + w * 0.5, y + 0.6 + wave, x + w, y + 0.2, x + w, y + h, x + w * 0.5, y + h], 'rgba(0,0,0,0.1)');
  ctx.restore();
}

/** The Hanse pennant: a long swallow-tailed streamer, white over red. */
function hansePennant(ctx: Ctx, x: number, y: number, len: number, wave = 0) {
  const pts = [x, y, x + len * 0.5, y + 0.4 + wave, x + len, y + 0.6, x + len * 0.86, y + 1.4 + wave * 0.5, x + len, y + 2.4, x + len * 0.5, y + 2.6 - wave, x, y + 2.8];
  poly(ctx, pts, RED);
  ctx.save();
  clipPoly(ctx, pts);
  poly(ctx, [x - 1, y - 2, x + len + 2, y - 2, x + len + 2, y + 1.4 + wave * 0.5, x - 1, y + 1.4], WHITE);
  ctx.restore();
}

// ---------------------------------------------------------------- dress

function dress(kind: UnitKind): [string, string, string] | null {
  switch (kind) {
    case 'landsknecht': return [RED, YEL, YEL];
    case 'warrior': return [BLACK, WHITE, WHITE];
    case 'archer': return [YEL, RED, RED];
    case 'defender': return [STEEL, BLACK, WHITE];
    case 'swordsman': return [STEEL, STEEL_D, STEEL];
    case 'rider': return [BSTEEL, '#2a2420', BSTEEL];
    case 'knight': return [WHITE, STEEL, STEEL];
    case 'giant': return [RED, RED_D, GOLD];
    case 'explorer': return [BLACK, BLACK, WHITE];
    default: return [BLACK, WHITE, RED];
  }
}

/** Slashes cut down a garment, showing the bright lining puffed through: vertical strips with a paler puff in each. */
function slashes(ctx: Ctx, f: 'L' | 'R', x: number, y: number, w: number, h: number, us: number[], v0: number, v1: number, c: string) {
  for (const u of us) {
    faceQuad(ctx, f, x, y, w, h, u, u + 0.07, v0, v1, c);
    const [px, py] = fp(f, x, y, w, h, u + 0.035, (v0 + v1) / 2);
    ellipse(ctx, px, py, w * 0.022, h * (v1 - v0) * 0.24, shade(c, 0.35));
  }
}

/** Landsknecht hose: each leg a different colour below the knee, a garter, and puffed, slashed breeches above.
 *  (x, y) is where the figure stands (its feet). */
function hose(ctx: Ctx, x: number, y: number, k: number, far: string, near: string, upper: string, slash: string, garter: string) {
  for (const [dx, dy, c] of [[-2.2, -0.3, far], [2.2, 0.7, near]] as const) {
    const lx = x + dx * k, ly = y + dy * k, w = 3.6 * k, h = 5.2 * k;
    for (const f of ['L', 'R'] as const) {
      faceQuad(ctx, f, lx, ly, w, h, 0, 1, 0.2, 0.5, c); // the stocking
      faceQuad(ctx, f, lx, ly, w, h, 0, 1, 0.5, 0.58, garter); // the garter tied under the knee
      faceQuad(ctx, f, lx, ly, w, h, -0.04, 1.04, 0.58, 0.9, upper); // the puffed breeches, standing out a little
      slashes(ctx, f, lx, ly, w, h, [0.12, 0.5, 0.82], 0.62, 0.86, slash);
    }
    const [gx, gy] = fp('R', lx, ly, w, h, 0.8, 0.54);
    ellipse(ctx, gx + 0.5 * k, gy + 0.3 * k, 0.7 * k, 0.5 * k, garter); // the bow of the garter
  }
}

/** Puffed and slashed sleeves on the front arm (the arm hangs from (ax, ay) as in render/units `figure`). */
function puffSleeve(ctx: Ctx, ax: number, ay: number, k: number, c: string, slash: string) {
  const w = 2.8 * k, h = 7 * k;
  for (const [v0, v1] of [[0.34, 0.6], [0.66, 0.98]] as const) {
    const [px, py] = fp('R', ax, ay, w, h, 0.5, (v0 + v1) / 2);
    ellipse(ctx, px - 0.3 * k, py, 1.9 * k, (v1 - v0) * h * 0.55, c); // a puff
    for (const d of [-0.9, 0, 0.9]) line(ctx, px + d * k - 0.3 * k, py - (v1 - v0) * h * 0.4, px + d * k - 0.3 * k, py + (v1 - v0) * h * 0.4, slash, 0.5 * k);
    ellipse(ctx, px - 1 * k, py - (v1 - v0) * h * 0.2, 0.5 * k, 0.6 * k, shade(c, 0.3));
  }
}

/** Fluted Gothic plate on a torso: a pointed waist, ridges fanning up from it, a skirt of lames. */
function gothicPlate(ctx: Ctx, x: number, y: number, w: number, h: number, metal: string) {
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const k = w / 10;
  R(0.06, 0.46, 0.22, 0.86, shade(metal, 0.2)); // the light on the breastplate
  // the flutes, fanning from the waist (the plackart's point) up over the chest
  for (const [u0, u1] of [[0.48, 0.2], [0.5, 0.42], [0.52, 0.64], [0.54, 0.86]] as const) faceLine(ctx, 'R', x, y, w, h, u0, 0.2, u1, 0.9, shade(metal, -0.3), 0.4 * k);
  for (const [u0, u1] of [[0.47, 0.18], [0.49, 0.4]] as const) faceLine(ctx, 'R', x, y, w, h, u0 + 0.03, 0.2, u1 + 0.03, 0.9, shade(metal, 0.5), 0.3 * k);
  for (const u of [0.25, 0.55, 0.85]) faceLine(ctx, 'L', x, y, w, h, u, 0.2, u - 0.08, 0.9, shade(metal, -0.25), 0.35 * k);
  // the plackart's pointed top edge
  const a = fp('R', x, y, w, h, 0.04, 0.3), b = fp('R', x, y, w, h, 0.5, 0.58), c = fp('R', x, y, w, h, 0.96, 0.3);
  line(ctx, a[0], a[1], b[0], b[1], shade(metal, -0.35), 0.45 * k);
  line(ctx, b[0], b[1], c[0], c[1], shade(metal, -0.35), 0.45 * k);
  // the fauld: lames below the waist with a scalloped (cusped) edge
  for (let i = 0; i < 2; i++) band(ctx, x, y, w * 1.04, h, -0.08 - i * 0.12, 0.04 - i * 0.12, shade(metal, -0.08 * i));
  for (let i = 0; i < 4; i++) { const [px, py] = fp('R', x, y, w * 1.04, h, 0.12 + i * 0.25, -0.22); ellipse(ctx, px, py, 0.7 * k, 0.4 * k, shade(metal, -0.12)); }
  for (const u of [0.1, 0.9]) R(u - 0.03, u + 0.03, 0.82, 0.88, GOLD_L); // gilt rivets
}

function torso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const L = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'L', x, y, w, h, u0, u1, v0, v1, c);
  const B = (v0: number, v1: number, c: string) => band(ctx, x, y, w, h, v0, v1, c);
  const k = w / 10;
  switch (kind) {
    case 'landsknecht': // a red doublet slashed in yellow, cut low over a pleated white shirt, a yellow sash; red-and-yellow hose
      hose(ctx, x, y + 5 * k, k, YEL, RED, YEL, RED, WHITE);
      slashes(ctx, 'R', x, y, w, h, [0.06, 0.24, 0.72, 0.9], 0.18, 0.74, YEL);
      slashes(ctx, 'L', x, y, w, h, [0.12, 0.42, 0.72], 0.18, 0.74, YEL);
      R(0.36, 0.64, 0.6, 1, WHITE); // the shirt in the low square neck
      for (const u of [0.42, 0.5, 0.58]) R(u, u + 0.02, 0.6, 1, WHITE_D);
      B(0.04, 0.16, YEL_D); // the sash
      R(0.66, 0.8, -0.08, 0.16, YEL); // its knot
      L(0.14, 0.24, 0.1, 0.22, GOLD); // the katzbalger's hilt at the hip
      return;
    case 'warrior': // a halberdier: a black doublet slashed in white, a white shirt and a buff belt (his hose: see `unit`)
      slashes(ctx, 'R', x, y, w, h, [0.08, 0.3, 0.68, 0.88], 0.2, 0.8, WHITE);
      slashes(ctx, 'L', x, y, w, h, [0.2, 0.55, 0.85], 0.2, 0.8, WHITE);
      R(0.42, 0.58, 0.8, 1, WHITE);
      B(0.08, 0.16, '#8a6a3a');
      R(0.44, 0.56, 0.08, 0.16, GOLD);
      return;
    case 'archer': // an arquebusier: a yellow doublet slashed in red, a bandolier of powder flasks (the Twelve Apostles)
      slashes(ctx, 'R', x, y, w, h, [0.1, 0.32, 0.74], 0.2, 0.84, RED);
      slashes(ctx, 'L', x, y, w, h, [0.2, 0.5, 0.8], 0.2, 0.84, RED);
      // the bandolier over the left shoulder, flasks hanging from it
      faceLine(ctx, 'R', x, y, w, h, 0.02, 0.98, 0.96, 0.08, '#4a3020', 1.1 * k);
      for (let i = 0; i < 5; i++) {
        const t = 0.12 + i * 0.18;
        const [px, py] = fp('R', x, y, w, h, 0.02 + 0.94 * t, 0.98 - 0.9 * t);
        poly(ctx, [px - 0.6 * k, py + 0.4 * k, px + 0.6 * k, py + 0.4 * k, px + 0.5 * k, py + 2.2 * k, px - 0.5 * k, py + 2.2 * k], '#6a4a2a');
        ellipse(ctx, px, py + 0.4 * k, 0.6 * k, 0.3 * k, '#2a1a10');
      }
      B(0.06, 0.14, '#4a3020');
      return;
    case 'defender': // a pikeman's half-armour: a fluted breastplate over a black doublet, black-and-white hose
      hose(ctx, x, y + 5 * k, k, BLACK, WHITE, BLACK, WHITE, RED);
      gothicPlate(ctx, x, y, w, h, STEEL);
      return;
    case 'swordsman': // a man-at-arms in full Gothic harness
      gothicPlate(ctx, x, y, w, h, STEEL);
      R(0.06, 0.12, 0.22, 0.7, RED); // the red arming doublet showing at the armhole
      return;
    case 'rider': // a black Reiter: blackened cuirass, a red sash slung across, a buff coat's skirts
      R(0.06, 0.46, 0.22, 0.86, BSTEEL_L);
      R(0.47, 0.53, 0.1, 0.92, shade(BSTEEL, 0.4));
      for (let i = 0; i < 2; i++) B(-0.06 - i * 0.12, 0.04 - i * 0.12, shade(BSTEEL, -0.1 * i));
      faceLine(ctx, 'R', x, y, w, h, 0.04, 0.95, 0.9, 0.12, RED, 1.2 * k);
      faceLine(ctx, 'L', x, y, w, h, 0.9, 0.95, 0.2, 0.2, RED, 1.2 * k);
      return;
    case 'knight': // the white mantle of the Teutonic Order with its black cross, Gothic plate at the waist and collar
      R(0.4, 0.6, 0.12, 0.86, BLACK);
      R(0.1, 0.9, 0.48, 0.64, BLACK);
      L(0.38, 0.62, 0.12, 0.86, BLACK);
      L(0.1, 0.9, 0.46, 0.62, BLACK);
      B(0.86, 1, STEEL); // the gorget
      B(0, 0.1, STEEL_D); // the fauld below the mantle
      R(0.6, 0.66, 0.12, 0.86, WHITE_D);
      return;
    case 'giant': // Barbarossa's coronation mantle: red silk hemmed in gold, the black eagle on a gold breast panel, a jewelled clasp
      R(0.28, 0.72, 0.3, 0.92, GOLD);
      eagle(ctx, ...fp('R', x, y, w, h, 0.5, 0.64), 0.36 * k);
      for (const u of [0.06, 0.94]) R(u - 0.04, u + 0.04, 0, 1, GOLD);
      L(0.84, 0.94, 0, 1, GOLD);
      for (let i = 0; i < 6; i++) { const [px, py] = fp('L', x, y, w, h, 0.15 + i * 0.12, 0.3 + (i % 2) * 0.3); ellipse(ctx, px, py, 0.5 * k, 0.5 * k, GOLD); } // gold stars sown on the mantle
      B(0.9, 1, '#f4ecd8'); // ermine at the collar
      for (const u of [0.2, 0.5, 0.8]) R(u, u + 0.04, 0.92, 0.98, BLACK);
      R(0.42, 0.58, 0.86, 0.96, RED_L); // the clasp
      return;
    case 'explorer': // a journeyman in his Kluft: black waistcoat with pearl buttons over a white collarless shirt
      R(0.34, 0.66, 0.5, 1, WHITE);
      for (let i = 0; i < 4; i++) R(0.47, 0.53, 0.14 + i * 0.12, 0.2 + i * 0.12, '#e8e4dc');
      B(0.06, 0.14, '#2a2a2a');
      return;
    default:
      slashes(ctx, 'R', x, y, w, h, [0.1, 0.72], 0.2, 0.8, RED);
  }
}

/** German faces: great moustaches and forked beards for the soldiers, Barbarossa's red beard for the Emperor. */
function face(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  if (kind === 'giant') {
    R(0.1, 0.9, -0.1, 0.24, GINGER); // the red beard
    R(0.26, 0.74, -0.18, -0.08, GINGER);
    R(0.2, 0.46, 0.22, 0.3, GINGER); // the moustache
    R(0.54, 0.8, 0.22, 0.3, GINGER);
    R(0.42, 0.58, 0.12, 0.17, '#8a3a2a');
    return;
  }
  if (kind === 'landsknecht') {
    R(0.22, 0.48, 0.18, 0.28, HAIR); // a sweeping moustache, its ends turned up
    R(0.52, 0.78, 0.18, 0.28, HAIR);
    R(0.12, 0.22, 0.24, 0.34, HAIR);
    R(0.78, 0.88, 0.24, 0.34, HAIR);
    R(0.3, 0.46, -0.12, 0.1, HAIR); // a forked beard
    R(0.54, 0.7, -0.12, 0.1, HAIR);
    return;
  }
  if (kind === 'warrior' || kind === 'defender' || kind === 'archer' || kind === 'swordsman' || kind === 'explorer') {
    R(0.24, 0.48, 0.18, 0.26, HAIR); // a full moustache
    R(0.52, 0.76, 0.18, 0.26, HAIR);
    if (kind !== 'archer') R(0.32, 0.68, -0.04, 0.1, shade(HAIR, 0.1));
  }
}

// ---------------------------------------------------------------- headgear

/** The landsknecht's beret: a huge flat bonnet slashed all round its brim, tipped over one ear, heaped with ostrich plumes. */
function beret(ctx: Ctx, x: number, top: number, k: number, hw: number, cloth: string, slash: string, plumes: string[], size = 1) {
  const s = k * size, by = top + 2.4 * k, rx = hw / 2 + 5 * s;
  // the plumes falling behind and over the brim
  for (let i = 0; i < plumes.length; i++) {
    const a = -1.2 + i * 0.6;
    curve(ctx, x + 1 * s, by - 3 * s, x - 2 * s + a * 3 * s, by - 13 * s + Math.abs(a) * 2 * s, x - 9 * s + a * 5 * s, by - 5 * s + Math.abs(a) * 3 * s, 2.4 * s, shade(plumes[i], -0.18));
    curve(ctx, x + 1 * s, by - 3.4 * s, x - 2 * s + a * 3 * s, by - 13.6 * s + Math.abs(a) * 2 * s, x - 9 * s + a * 5 * s, by - 5.6 * s + Math.abs(a) * 3 * s, 1.5 * s, plumes[i]);
  }
  // the brim: a wide flat disc, tilted, its edge cut into tabs that show the lining
  ellipse(ctx, x + 0.6 * s, by + 0.8 * s, rx, 2.8 * s, shade(cloth, -0.4));
  ellipse(ctx, x, by, rx, 2.8 * s, cloth);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const px = x + Math.cos(a) * rx * 0.86, py = by + Math.sin(a) * 2.5 * s;
    line(ctx, px, py, x + Math.cos(a) * rx * 1.02, by + Math.sin(a) * 2.9 * s, slash, 0.7 * s);
  }
  ring(ctx, x, by, rx, 2.8 * s, shade(cloth, -0.3), 0.4 * s);
  // the soft crown, puffed and slashed
  ellipse(ctx, x - 0.4 * s, by - 1.6 * s, hw / 2 + 1.2 * s, 2.6 * s, shade(cloth, -0.1));
  for (const d of [-2.6, -0.8, 1, 2.8]) line(ctx, x + d * s, by - 0.4 * s, x + d * 1.1 * s - 0.4 * s, by - 3.4 * s, slash, 0.8 * s);
  ellipse(ctx, x - 1.6 * s, by - 2.8 * s, hw * 0.2, 0.9 * s, shade(cloth, 0.25));
  // a gold medallion pinned at the front, and the plumes tumbling over the near brim
  ellipse(ctx, x + rx * 0.5, by - 0.6 * s, 0.9 * s, 0.9 * s, GOLD);
  for (let i = 0; i < Math.min(2, plumes.length); i++) curve(ctx, x + rx * 0.5, by - 1 * s, x + rx * 0.9, by - 5 * s + i * 1.4 * s, x + rx * 1.1 + i * 0.8 * s, by + 1.6 * s + i * 1.2 * s, 1.4 * s, plumes[plumes.length - 1 - i]);
}

/** The Eisenhut (kettle hat): a round steel bowl with a broad brim, a feather tucked at the side. */
function kettleHat(ctx: Ctx, x: number, top: number, k: number, hw: number, feather?: string) {
  const by = top + 1.6 * k, rx = hw / 2 + 3.4 * k;
  if (feather) curve(ctx, x - 1 * k, by - 4 * k, x - 4 * k, by - 10 * k, x - 8 * k, by - 6 * k, 1.3 * k, feather);
  ellipse(ctx, x + 0.4 * k, by + 0.8 * k, rx, 2.6 * k, shade(STEEL, -0.4));
  ellipse(ctx, x, by, rx, 2.6 * k, STEEL);
  ring(ctx, x, by, rx, 2.6 * k, STEEL_D, 0.45 * k);
  ellipse(ctx, x - rx * 0.4, by - 0.6 * k, rx * 0.4, 0.9 * k, STEEL_L);
  dome(ctx, x, by - 0.6 * k, hw / 2 + 0.4 * k, 6.4 * k, STEEL);
  line(ctx, x, by - 6.8 * k, x + 0.2 * k, by - 0.8 * k, STEEL_D, 0.5 * k); // the comb
  for (const d of [-2.6, 0, 2.6]) ellipse(ctx, x + d * k, by - 0.8 * k, 0.4 * k, 0.4 * k, STEEL_L);
}

/** A Gothic sallet: a rounded bowl drawn out into a long tail behind, a sight across the brow; a bevor at the chin. */
function sallet(ctx: Ctx, x: number, top: number, k: number, hw: number, metal: string, plume?: string[], bevor = true) {
  const by = top + 3.6 * k, bx = hw / 2 + 0.8 * k;
  poly(ctx, [x - bx * 0.4, by - 4 * k, x - bx - 5.2 * k, by + 2.8 * k, x - bx - 4 * k, by + 3.8 * k, x - bx * 0.2, by + 0.6 * k], shade(metal, -0.1));
  poly(ctx, [x - bx - 5.2 * k, by + 2.8 * k, x - bx - 4 * k, by + 3.8 * k, x - bx * 0.2, by + 0.6 * k, x - bx * 0.3, by - 0.2 * k], shade(metal, -0.32));
  dome(ctx, x, by, bx, 7.2 * k, metal);
  line(ctx, x - bx * 0.9, by - 3 * k, x + 0.4 * k, by - 7.4 * k, shade(metal, 0.4), 0.5 * k); // the ridge
  poly(ctx, [x - bx * 0.2, by - 1.4 * k, x + bx, by - 2.2 * k, x + bx * 1.02, by + 1.4 * k, x - bx * 0.1, by + 2 * k], shade(metal, -0.08));
  line(ctx, x + 0.2 * k, by - 0.6 * k, x + bx * 0.96, by - 1 * k, '#1a1a20', 0.8 * k);
  if (bevor) { // the bevor rising over the chin and mouth
    const cy = top + 10.5 * k;
    poly(ctx, [x - bx * 0.5, cy + 0.8 * k, x + bx * 1.05, cy - 0.2 * k, x + bx * 1.08, cy - 4.4 * k, x + 1 * k, cy - 4 * k, x - bx * 0.4, cy - 3 * k], shade(metal, -0.04));
    line(ctx, x + 1 * k, cy - 4 * k, x + bx * 1.08, cy - 4.4 * k, shade(metal, 0.4), 0.5 * k);
    line(ctx, x - bx * 0.4, cy - 1 * k, x + bx * 1.06, cy - 2 * k, shade(metal, -0.35), 0.4 * k);
  }
  if (plume) for (let i = 0; i < plume.length; i++) curve(ctx, x - 1 * k, by - 6.6 * k, x - 3 * k - i * 0.6 * k, by - 13 * k + i * k, x - 8 * k - i * 0.6 * k, by - 7 * k + i * 1.2 * k, 1.5 * k, plume[i]);
}

/** A burgonet for the black Reiter: an open helmet with a tall comb, a peak and hinged cheek-pieces. */
function burgonet(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const by = top + 3.6 * k, bx = hw / 2 + 0.6 * k;
  poly(ctx, [x - bx * 0.6, by - 1 * k, x - bx - 2.4 * k, by + 2.6 * k, x - bx - 1.4 * k, by + 3.2 * k, x - bx * 0.2, by + 0.8 * k], shade(BSTEEL, -0.2)); // the neck guard
  dome(ctx, x, by, bx, 7 * k, BSTEEL);
  poly(ctx, [x - bx * 0.7, by - 3 * k, x - 1 * k, by - 9.6 * k, x + bx * 0.6, by - 7.4 * k, x + bx * 0.5, by - 5 * k], BSTEEL_L); // the comb
  poly(ctx, [x + bx * 0.2, by - 0.4 * k, x + bx + 3 * k, by + 0.4 * k, x + bx, by + 1 * k], shade(BSTEEL, 0.15)); // the peak
  faceQuad(ctx, 'R', x, top + 10.5 * k, hw, 10.5 * k, 0, 0.26, 0.1, 0.62, BSTEEL); // a cheek-piece
  for (const d of [-2, 1]) ellipse(ctx, x + d * k, by - 0.4 * k, 0.4 * k, 0.4 * k, GOLD);
  curve(ctx, x - 1 * k, by - 9 * k, x - 4 * k, by - 13 * k, x - 7.4 * k, by - 8 * k, 1.3 * k, BLACK_L); // a black plume
}

/** The Teutonic great helm: a flat-topped steel pot with eye-slits and breaths, a black-and-white crest of plumes. */
function greatHelm(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const hh = 11.6 * k, hy = top + hh - 0.6 * k, w = hw + 1.4 * k;
  box(ctx, x, hy, w, hh, STEEL, shade(STEEL, 0.2));
  faceQuad(ctx, 'R', x, hy, w, hh, 0, 1, 0.56, 0.64, '#1a1a20'); // the sight
  faceQuad(ctx, 'R', x, hy, w, hh, 0.46, 0.54, 0.64, 0.98, '#1a1a20'); // the gap between the sights, a cross with the nasal
  faceQuad(ctx, 'R', x, hy, w, hh, 0.44, 0.56, 0.06, 0.56, STEEL_L); // the reinforced front ridge
  faceQuad(ctx, 'L', x, hy, w, hh, 0, 1, 0.56, 0.64, '#2a2a30');
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) faceQuad(ctx, 'R', x, hy, w, hh, 0.66 + j * 0.14, 0.72 + j * 0.14, 0.18 + i * 0.1, 0.22 + i * 0.1, '#1a1a20'); // breaths
  faceQuad(ctx, 'R', x, hy, w, hh, 0, 1, 0.94, 1, GOLD); // a gilt band round the top
  faceQuad(ctx, 'L', x, hy, w, hh, 0, 1, 0.94, 1, GOLD);
  // the crest: two wings of black and white feathers over a torse
  const cy = hy - hh;
  ellipse(ctx, x, cy, 2.6 * k, 1 * k, BLACK);
  ellipse(ctx, x - 0.6 * k, cy - 0.2 * k, 1.2 * k, 0.6 * k, WHITE);
  for (const [d, c] of [[-1, WHITE], [1, BLACK]] as const) {
    for (let i = 0; i < 4; i++) {
      const fx = x + d * (1 + i * 1.2) * k, fy = cy - (9 - i * 1.6) * k;
      poly(ctx, [x + d * 0.6 * k, cy - 0.4 * k, fx - 0.8 * k, fy, fx + 0.8 * k, fy + 0.6 * k], c);
    }
  }
}

/** The imperial crown (the Reichskrone): eight hinged gold plates with rounded tops, the jewel plates studded with
 *  pearls and gems, the picture plates enamelled blue, a single arch from front to back, over a red mitre cap.
 *  (The giant's gold star sits where the front plate's cross would be.) */
function imperialCrown(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const by = top + 2.6 * k, rx = hw / 2 + 0.8 * k, ph = 5.4 * k;
  dome(ctx, x, by - 2.6 * k, rx * 0.7, 4.6 * k, RED); // the cap inside
  // the plates as seen from the front: the side jewel plates, two picture plates, the tall front plate
  const plates = [[-1, 0.62, -0.12, 'J'], [1, 0.62, -0.28, 'J'], [-0.52, 0.66, -0.02, 'P'], [0.52, 0.66, -0.16, 'P'], [0, 0.8, 0.12, 'J']] as const;
  for (const [u, wd, l, kind] of plates) {
    const px = x + u * rx * 0.78, pw = rx * 0.3 * wd + 0.5 * k, c = shade(GOLD, l);
    const h0 = u === 0 ? ph * 1.12 : Math.abs(u) > 0.9 ? ph * 0.9 : ph;
    ctx.beginPath(); // a plate with a round-arched top
    ctx.moveTo(px - pw, by);
    ctx.lineTo(px - pw, by - h0 + pw);
    ctx.arc(px, by - h0 + pw, pw, Math.PI, 0);
    ctx.lineTo(px + pw, by);
    ctx.closePath();
    ctx.fillStyle = ink(c);
    ctx.fill();
    if (kind === 'P') { // an enamel picture of a king or prophet, in blue
      poly(ctx, [px - pw * 0.6, by - 0.8 * k, px + pw * 0.6, by - 0.8 * k, px + pw * 0.6, by - h0 + pw, px - pw * 0.6, by - h0 + pw], '#2a5aa8');
      ellipse(ctx, px, by - h0 * 0.62, pw * 0.26, pw * 0.3, SKIN);
      poly(ctx, [px - pw * 0.34, by - 1.2 * k, px + pw * 0.34, by - 1.2 * k, px, by - h0 * 0.52], '#e8e0d0');
    } else {
      for (const t of [0.2, 0.46, 0.72]) for (const d of [-0.62, 0.62]) ellipse(ctx, px + pw * d, by - h0 * t, 0.3 * k, 0.3 * k, WHITE); // pearls
      ellipse(ctx, px, by - h0 * 0.5, pw * 0.38, pw * 0.48, u === 0 ? '#2a6ac8' : '#2a9a5a');
      ellipse(ctx, px, by - h0 * 0.22, pw * 0.24, pw * 0.24, RED_L);
      ellipse(ctx, px - pw * 0.12, by - h0 * 0.56, pw * 0.13, pw * 0.15, '#ffffff');
    }
  }
  line(ctx, x - rx, by + 0.2 * k, x + rx, by + 0.2 * k, GOLD_D, 0.7 * k);
  // the arch, from the front plate over to the back, set with pearls
  const ax = x, ay = by - ph * 1.0;
  curve(ctx, ax, ay, x - rx * 0.1, by - ph * 2.1, x - rx * 0.42, by - ph * 0.86, 1 * k, GOLD_D);
  curve(ctx, ax, ay - 0.3 * k, x - rx * 0.1, by - ph * 2.1 - 0.3 * k, x - rx * 0.42, by - ph * 0.86 - 0.3 * k, 0.6 * k, GOLD);
  for (let i = 1; i < 5; i++) {
    const t = i / 5, q = (1 - t) * (1 - t), r = 2 * t * (1 - t), w2 = t * t;
    ellipse(ctx, q * ax + r * (x - rx * 0.1) + w2 * (x - rx * 0.42), q * (ay - 0.3 * k) + r * (by - ph * 2.1 - 0.3 * k) + w2 * (by - ph * 0.86 - 0.3 * k), 0.3 * k, 0.3 * k, WHITE);
  }
}

/** The journeyman's broad black hat. */
function wideHat(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const by = top + 2 * k, rx = hw / 2 + 4 * k;
  ellipse(ctx, x + 0.4 * k, by + 0.7 * k, rx, 2.4 * k, '#0a0a0a');
  ellipse(ctx, x, by, rx, 2.4 * k, '#1e1e20');
  dome(ctx, x, by - 0.4 * k, hw / 2 + 0.2 * k, 5 * k, '#242426');
  band(ctx, x, by - 0.6 * k, hw + 0.4 * k, 1.2 * k, 0, 1, '#3a3a3a');
}

function head(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  switch (kind) {
    case 'landsknecht': beret(ctx, x, top, k, hw, RED, YEL, [WHITE, YEL, RED, WHITE, YEL], 1.15); return;
    case 'warrior': kettleHat(ctx, x, top, k, hw, WHITE); return;
    case 'archer': beret(ctx, x, top, k, hw, BLACK, YEL, [RED, WHITE], 0.62); return;
    case 'defender': sallet(ctx, x, top, k, hw, STEEL); return;
    case 'swordsman': sallet(ctx, x, top, k, hw, STEEL, [RED, YEL, WHITE]); return;
    case 'rider': burgonet(ctx, x, top, k, hw); return;
    case 'knight': greatHelm(ctx, x, top, k, hw); return;
    case 'giant': imperialCrown(ctx, x, top, k, hw); return;
    case 'explorer': wideHat(ctx, x, top, k, hw); return;
    default: kettleHat(ctx, x, top, k, hw); return;
  }
}

// ---------------------------------------------------------------- weapons

/** The zweihänder: a blade as long as a man, a long leather-bound ricasso with two parrying hooks, a broad straight guard
 *  with curled ends and side rings, a long grip and a pear pommel. Held at (x, y), the blade rising toward (dx, dy). */
function zweihander(ctx: Ctx, x: number, y: number, k: number, dx: number, dy: number, len = 30) {
  const n = Math.hypot(dx, dy), ux = dx / n, uy = dy / n, nx = -uy, ny = ux;
  const P = (t: number, o: number): [number, number] => [x + ux * t * k + nx * o * k, y + uy * t * k + ny * o * k];
  // the grip and the pommel below the hand
  line(ctx, ...P(-1.5, 0), ...P(-7.4, 0), '#3a2418', 1.4 * k);
  for (let i = 0; i < 4; i++) line(ctx, ...P(-2.2 - i * 1.3, -0.7), ...P(-2.8 - i * 1.3, 0.7), '#6a4a2a', 0.35 * k);
  ellipse(ctx, ...P(-8.4, 0), 1.2 * k, 1.2 * k, STEEL_D);
  ellipse(ctx, ...P(-8.6, -0.3), 0.5 * k, 0.5 * k, STEEL_L);
  // the blade, broad and flat, with a central fuller
  const r0 = 2.2, r1 = 6.4; // the ricasso
  poly(ctx, [...P(r1, -1.1), ...P(len, -0.8), ...P(len + 2, 0), ...P(len, 0.8), ...P(r1, 1.1)], STEEL_L);
  poly(ctx, [...P(r1, 0), ...P(len + 2, 0), ...P(len, 0.8), ...P(r1, 1.1)], '#a8b0ba');
  line(ctx, ...P(r1 + 1, 0), ...P(len - 2, 0), STEEL_D, 0.3 * k);
  // the ricasso wrapped in leather, and the parrying hooks
  poly(ctx, [...P(r0, -0.8), ...P(r1, -0.8), ...P(r1, 0.8), ...P(r0, 0.8)], '#5a3a22');
  for (const d of [-1, 1]) {
    poly(ctx, [...P(r1 - 0.3, d * 0.9), ...P(r1 + 0.2, d * 3.4), ...P(r1 + 2, d * 4), ...P(r1 + 0.8, d * 2.8), ...P(r1 + 0.7, d * 0.9)], STEEL_D);
  }
  // the guard: a long straight cross with curled tips and a side ring
  line(ctx, ...P(r0, -6), ...P(r0, 6), STEEL_D, 1.1 * k);
  line(ctx, ...P(r0 + 0.2, -6), ...P(r0 + 0.2, 6), STEEL, 0.6 * k);
  for (const d of [-1, 1]) {
    const [ex, ey] = P(r0 + 1, d * 6.4);
    ring(ctx, ex, ey, 0.9 * k, 0.9 * k, STEEL_D, 0.5 * k);
  }
  const [rx, ry] = P(r0 - 0.6, 1.6);
  ring(ctx, rx, ry, 1.2 * k, 0.9 * k, STEEL_D, 0.5 * k);
}

/** A halberd: an ash haft, an axe blade with a hooked fluke behind it and a long spike on top. */
function halberd(ctx: Ctx, x: number, y: number, k: number, len = 32) {
  const x0 = x - 2.2 * k, y0 = y + 7 * k, x1 = x + 2.6 * k, y1 = y - (len - 7) * k;
  line(ctx, x0, y0, x1, y1, WOOD, 1.2 * k);
  line(ctx, x0 - 0.4 * k, y0, x1 - 0.4 * k, y1, shade(WOOD, 0.4), 0.4 * k);
  for (let i = 0; i < 3; i++) { const t = 0.55 + i * 0.12; line(ctx, x0 + (x1 - x0) * t - 0.7 * k, y0 + (y1 - y0) * t, x0 + (x1 - x0) * t + 0.7 * k, y0 + (y1 - y0) * t - 0.4 * k, RED, 0.5 * k); } // a red tassel binding
  // the axe blade, its edge curved, facing forward
  poly(ctx, [x1, y1 + 3 * k, x1 + 2 * k, y1 + 3.6 * k, x1 + 5 * k, y1 + 4.6 * k, x1 + 5.6 * k, y1 + 1 * k, x1 + 5 * k, y1 - 2.6 * k, x1 + 2 * k, y1 - 1.4 * k, x1, y1 - 1 * k], STEEL);
  poly(ctx, [x1 + 5 * k, y1 + 4.6 * k, x1 + 5.6 * k, y1 + 1 * k, x1 + 5 * k, y1 - 2.6 * k, x1 + 4.2 * k, y1 + 1], STEEL_D);
  line(ctx, x1 + 5.2 * k, y1 + 4 * k, x1 + 5.2 * k, y1 - 2 * k, STEEL_L, 0.4 * k);
  ellipse(ctx, x1 + 2.4 * k, y1 + 1 * k, 0.5 * k, 0.5 * k, '#2a2a30'); // a pierced quatrefoil
  // the back fluke, hooked down
  poly(ctx, [x1, y1 + 2 * k, x1 - 3.6 * k, y1 + 2.4 * k, x1 - 4.2 * k, y1 + 3.8 * k, x1 - 0.2 * k, y1 + 0.2 * k], STEEL);
  // the top spike
  poly(ctx, [x1 - 0.6 * k, y1 - 0.6 * k, x1 + 0.7 * k, y1 - 0.8 * k, x1 + 0.9 * k, y1 - 9 * k], STEEL_L);
  line(ctx, x1, y1 + 3 * k, x1 - 0.4 * k, y1 + 6 * k, STEEL_D, 0.7 * k); // langets
}

/** A pike: eighteen feet of ash with a small leaf head; it rises far above the man. */
function pike(ctx: Ctx, x: number, y: number, k: number, len = 46) {
  const x0 = x - 1.4 * k, y0 = y + 8 * k, x1 = x + 3 * k, y1 = y - (len - 8) * k;
  line(ctx, x0, y0, x1, y1, WOOD, 1 * k);
  line(ctx, x0 - 0.3 * k, y0, x1 - 0.3 * k, y1, shade(WOOD, 0.4), 0.35 * k);
  poly(ctx, [x1 - 0.8 * k, y1 + 0.4 * k, x1 + 0.9 * k, y1 + 0.2 * k, x1 + 0.4 * k, y1 - 4.4 * k], STEEL_L);
  line(ctx, x1, y1 + 0.4 * k, x1 - 0.2 * k, y1 + 3.4 * k, STEEL_D, 0.6 * k);
  for (const d of [-0.5, 0.5]) curve(ctx, x1, y1 + 1.8 * k, x1 + d * 3 * k, y1 + 3 * k, x1 + d * 2.4 * k, y1 + 6 * k, 0.6 * k, RED); // a red tuft
}

/** The katzbalger: a short broad sword with an S-shaped (figure-eight) guard and a fan pommel. */
function katzbalger(ctx: Ctx, x: number, y: number, k: number, len = 12) {
  const tx = x + len * 0.26 * k, ty = y - len * k;
  poly(ctx, [x - 1.1 * k, y - 1.6 * k, tx - 0.4 * k, ty + 1.2 * k, tx + 0.3 * k, ty - 0.4 * k, x + 0.2 * k, y - 2 * k], STEEL_L);
  poly(ctx, [x + 1.1 * k, y - 1.4 * k, tx + 0.8 * k, ty + 1.2 * k, tx + 0.3 * k, ty - 0.4 * k, x + 0.2 * k, y - 2 * k], '#98a0aa');
  // the S guard: two loops curling opposite ways
  curve(ctx, x - 3 * k, y - 0.2 * k, x - 1.6 * k, y - 3 * k, x, y - 1.6 * k, 0.7 * k, STEEL_D);
  curve(ctx, x, y - 1.6 * k, x + 1.6 * k, y + 0.2 * k, x + 3 * k, y - 3 * k, 0.7 * k, STEEL_D);
  line(ctx, x, y - 1.4 * k, x - 0.5 * k, y + 2 * k, '#3a2a20', 1.3 * k);
  poly(ctx, [x - 0.6 * k, y + 1.8 * k, x - 2 * k, y + 3.6 * k, x + 1 * k, y + 3.4 * k], STEEL_D); // the fan pommel
}

/** The imperial sword: a long cross-hilted arming sword, gilt. */
function reichsschwert(ctx: Ctx, x: number, y: number, k: number, len = 20) {
  const tx = x + len * 0.2 * k, ty = y - len * k;
  poly(ctx, [x - 1.2 * k, y - 1.6 * k, tx - 0.3 * k, ty + 1.8 * k, tx + 0.2 * k, ty - 0.6 * k, x + 0.1 * k, y - 2 * k], STEEL_L);
  poly(ctx, [x + 1.2 * k, y - 1.4 * k, tx + 0.6 * k, ty + 1.8 * k, tx + 0.2 * k, ty - 0.6 * k, x + 0.1 * k, y - 2 * k], '#98a0aa');
  line(ctx, x + 0.1 * k, y - 2.6 * k, tx, ty + 2.4 * k, STEEL_D, 0.3 * k);
  line(ctx, x - 4.4 * k, y - 0.8 * k, x + 4.4 * k, y - 2.6 * k, GOLD, 1.1 * k);
  line(ctx, x, y - 1.6 * k, x - 0.6 * k, y + 2.6 * k, GOLD_D, 1.4 * k);
  ellipse(ctx, x - 0.8 * k, y + 3.2 * k, 1.4 * k, 1.2 * k, GOLD);
  ellipse(ctx, x - 1.1 * k, y + 2.9 * k, 0.5 * k, 0.5 * k, GOLD_L);
}

/** The imperial orb (the Reichsapfel): a gold globe with a jewelled band and a cross. */
function orb(ctx: Ctx, x: number, y: number, k: number) {
  ellipse(ctx, x, y + 0.3 * k, 2.6 * k, 2.6 * k, GOLD_D);
  ellipse(ctx, x, y, 2.6 * k, 2.6 * k, GOLD);
  ellipse(ctx, x - 0.9 * k, y - 0.9 * k, 0.9 * k, 0.8 * k, GOLD_L);
  line(ctx, x - 2.6 * k, y, x + 2.6 * k, y, GOLD_D, 0.5 * k);
  line(ctx, x, y - 2.6 * k, x, y, GOLD_D, 0.5 * k);
  for (const d of [-1.6, 0, 1.6]) ellipse(ctx, x + d * k, y, 0.4 * k, 0.4 * k, d ? RED_L : '#2a6ac8');
  line(ctx, x, y - 2.6 * k, x, y - 5.4 * k, GOLD, 0.7 * k);
  line(ctx, x - 1.2 * k, y - 4.4 * k, x + 1.2 * k, y - 4.4 * k, GOLD, 0.7 * k);
}

function weapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  switch (kind) {
    case 'landsknecht': {
      // the front sleeve puffed and slashed, then the great sword sloped up past the shoulder
      puffSleeve(ctx, x - 0.3 * k, y + 5.8 * k, k, YEL, RED);
      zweihander(ctx, x, y + 1 * k, k, 0.1, -1, 33);
      ellipse(ctx, x, y + 1 * k, 1.2 * k, 1.2 * k, SKIN);
      return true;
    }
    case 'warrior':
      puffSleeve(ctx, x - 0.3 * k, y + 5.8 * k, k, WHITE, BLACK);
      halberd(ctx, x, y, k, 31);
      return true;
    case 'defender':
      puffSleeve(ctx, x - 0.3 * k, y + 5.8 * k, k, WHITE, BLACK);
      pike(ctx, x, y, k, 44);
      return true;
    case 'swordsman':
      katzbalger(ctx, x, y, k, 13);
      heater(ctx, b.off.x, b.off.y, k, 'eagle');
      return true;
    case 'giant':
      reichsschwert(ctx, x, y, k, 21);
      orb(ctx, b.off.x + 0.6 * k, b.off.y - 3 * k, k);
      return true;
    case 'explorer': // the journeyman's twisted staff (Stenz) and a bundle
      line(ctx, x - 1 * k, y + 6 * k, x + 1.6 * k, y - 13 * k, '#5a3a22', 1.1 * k);
      for (let i = 0; i < 6; i++) { const t = i / 6; line(ctx, x - 1 * k + 2.6 * k * t, y + 6 * k - 19 * k * t, x - 0.4 * k + 2.6 * k * t, y + 5 * k - 19 * k * t, '#8a6a42', 0.5 * k); }
      ellipse(ctx, b.off.x - 2 * k, b.off.y - 6 * k, 2.4 * k, 1.8 * k, '#c8b890');
      return true;
    default: return false;
  }
}

// ---------------------------------------------------------------- the arquebusier

/** An arquebus (Hakenbüchse) aimed from the shoulder, resting on a forked staff, the match smouldering in the serpentine. */
function arquebusier(ctx: Ctx, x: number, y: number) {
  const b = figure(ctx, 'archer', 'germany', x, y, 1);
  puffSleeve(ctx, b.hand.x - 0.3, b.hand.y + 5.8, 1, RED, YEL);
  // the forked rest planted before him
  const rx = x + 14, fy = y - 13.4;
  line(ctx, rx + 1.4, y + 4, rx, fy + 0.6, WOOD_D, 0.9);
  curve(ctx, rx - 1.2, fy - 1.4, rx, fy + 1.2, rx + 1.2, fy - 1.4, 0.6, IRON);
  // the gun: a stock tucked against the shoulder, a long octagonal barrel laid in the fork
  const s0: [number, number] = [x + 2.6, y - 12.6], s1: [number, number] = [x + 23, y - 15];
  const dx = s1[0] - s0[0], dy = s1[1] - s0[1], n = Math.hypot(dx, dy), ux = dx / n, uy = dy / n, nx = -uy, ny = ux;
  const P = (t: number, o: number): [number, number] => [s0[0] + ux * t + nx * o, s0[1] + uy * t + ny * o];
  poly(ctx, [...P(-1, -1.2), ...P(9, -0.9), ...P(9, 1), ...P(2, 1.4), ...P(-1, 2.6)], '#6a3e1e'); // the stock
  line(ctx, ...P(0, -0.6), ...P(8, -0.5), '#8a5a30', 0.5);
  poly(ctx, [...P(8.6, -0.7), ...P(n, -0.55), ...P(n, 0.55), ...P(8.6, 0.7)], IRON); // the barrel
  line(ctx, ...P(9, -0.4), ...P(n - 0.4, -0.3), '#8a8e98', 0.35);
  poly(ctx, [...P(10.6, 0.6), ...P(12, 1.6), ...P(12.8, 1.6), ...P(12.6, 0.6)], IRON); // the hook (Haken) under the barrel
  ellipse(ctx, ...P(n, 0), 0.5, 0.7, '#121214');
  // the serpentine with its glowing match, a wisp of smoke
  const [lx, ly] = P(7, -1);
  curve(ctx, lx, ly + 0.6, lx - 0.4, ly - 1.4, lx + 1, ly - 1.6, 0.5, IRON);
  ellipse(ctx, lx + 1.1, ly - 1.7, 0.5, 0.5, '#ff6a20');
  ellipse(ctx, lx + 1.1, ly - 1.7, 0.25, 0.25, '#ffd080');
  curve(ctx, lx + 1.2, ly - 2.2, lx - 0.4, ly - 4, lx + 1, ly - 6, 0.6, 'rgba(220,220,220,0.55)');
  curve(ctx, lx - 0.4, ly + 0.8, lx - 3, ly + 3, lx - 4.4, ly + 6.4, 0.4, '#c8b890'); // the match cord trailing to his hand
  ellipse(ctx, ...P(9.6, 1.4), 1.1, 1.1, SKIN); // the hand under the barrel
}

// ---------------------------------------------------------------- horsemen

const HK = 0.95;

/** Plate barding on a horse: a steel chanfron with a spike, a crinet down the neck, a peytral over the chest; below it a
 *  white caparison with black crosses (the Teutonic knight) or a short black-and-red saddle cloth (the Reiter). */
function barding(ctx: Ctx, x: number, y: number, saddle: { x: number; y: number }, knight: boolean) {
  const hx0 = x - 1, hy0 = y + 3;
  if (knight) {
    const bx = hx0, by = hy0 - 6 * HK, bw = 17 * HK, bh = 7 * HK;
    for (const f of ['L', 'R'] as const) {
      faceQuad(ctx, f, bx, by, bw, bh, 0, 1, -0.66, 0.98, WHITE);
      for (let i = 0; i < 10; i++) faceQuad(ctx, f, bx, by, bw, bh, i / 10 + 0.02, i / 10 + 0.08, -0.74, -0.66, WHITE_D); // the dagged hem
    }
    // a black cross on each side of the near flank
    const P = (u: number, v: number): [number, number] => [bx + (u * bw) / 2, by + (bw / 4) * (1 - u) - v * bh];
    for (const u of [0.28, 0.78]) {
      const [cx, cy] = P(u, 0.12);
      poly(ctx, [cx - 0.8, cy - 3, cx + 0.8, cy - 3.4, cx + 0.8, cy + 2.6, cx - 0.8, cy + 3], BLACK);
      poly(ctx, [cx - 2.6, cy - 0.6, cx + 2.6, cy - 1.6, cx + 2.6, cy - 0.2, cx - 2.6, cy + 0.8], BLACK);
    }
  } else {
    const sx = saddle.x, sy = saddle.y;
    poly(ctx, [sx - 6, sy - 0.6, sx + 4, sy - 0.6, sx + 3.6, sy + 5.4, sx - 5.6, sy + 6.2], BLACK);
    line(ctx, sx - 5.6, sy + 6, sx + 3.6, sy + 5.2, RED, 0.9);
    // a holster with the second pistol's butt
    poly(ctx, [sx + 2.6, sy - 0.4, sx + 5, sy - 0.8, sx + 5.6, sy + 4, sx + 3.6, sy + 4.4], '#4a3020');
    ellipse(ctx, sx + 3.8, sy - 1.2, 1.2, 1, '#6a3e1e');
    ellipse(ctx, sx + 3.8, sy - 1.2, 0.6, 0.5, GOLD);
  }
  // the chanfron over the face, the crinet's lames down the neck, the peytral over the chest
  const hhx = hx0 + 10.5 * HK, hhy = hy0 - 15 * HK, m = knight ? STEEL : BSTEEL;
  faceQuad(ctx, 'R', hhx, hhy, 7 * HK, 5 * HK, 0.06, 0.74, 0.3, 0.98, m);
  faceQuad(ctx, 'R', hhx, hhy, 7 * HK, 5 * HK, 0.38, 0.44, 0.3, 0.98, shade(m, 0.4));
  if (knight) {
    poly(ctx, [hhx + 1.4, hhy - 3.6, hhx + 2.2, hhy - 3.4, hhx + 3, hhy - 6.8], STEEL_L); // the spike on the brow
    for (let i = -1; i <= 1; i++) curve(ctx, hhx + 0.4, hhy - 4.6, hhx + i * 1.2 - 0.6, hhy - 8.6, hhx + i * 1.6 - 2.6, hhy - 10.6, 0.9, i ? WHITE : BLACK);
  }
  for (let i = 0; i < 4; i++) { const t = i / 4; line(ctx, x + 3 + t * 4, y - 10 - t * 3.4, x + 5.2 + t * 4, y - 9 - t * 3.4, shade(m, i % 2 ? -0.2 : 0.2), 1.6); } // the crinet
  poly(ctx, [x + 5, y - 6.6, x + 10.6, y - 9, x + 11.6, y - 4, x + 7, y - 1.6], m); // the peytral
  poly(ctx, [x + 5, y - 6.6, x + 10.6, y - 9, x + 10.8, y - 8, x + 5.2, y - 5.6], shade(m, 0.35));
  line(ctx, x + 3.5, y - 9.6, x + 8, y - 3.4, knight ? BLACK : RED_D, 1.1); // the reins
}

/** A leg in plate (sabaton and greave) hanging in the stirrup. */
function plateLeg(ctx: Ctx, sx: number, sy: number, m: string) {
  poly(ctx, [sx + 0.4, sy + 0.4, sx + 4, sy + 0.6, sx + 4.6, sy + 5, sx + 2.2, sy + 5.4], m);
  ellipse(ctx, sx + 3.6, sy + 5.2, 1.4, 1.1, shade(m, 0.4));
  poly(ctx, [sx + 2.2, sy + 5.4, sx + 4.6, sy + 5, sx + 4.4, sy + 10, sx + 2.2, sy + 10.2], shade(m, -0.12));
  poly(ctx, [sx + 2.2, sy + 10, sx + 4.8, sy + 9.8, sx + 7.2, sy + 11.2, sx + 2.2, sy + 11.2], shade(m, -0.3)); // the pointed Gothic sabaton
  line(ctx, sx + 1.8, sy + 11.4, sx + 5, sy + 11.2, IRON, 0.6);
}

/** A lance with a pennon, black and white, below the head. */
function lance(ctx: Ctx, x: number, y: number, len: number) {
  const x0 = x - 3, y0 = y + 8, x1 = x + 5, y1 = y - len;
  line(ctx, x0, y0, x1, y1, '#8a5a30', 1.3);
  poly(ctx, [x1 + 0.6, y1 - 5, x1 - 0.8, y1 - 0.4, x1 + 0.2, y1 + 0.8, x1 + 1.4, y1 - 0.2], STEEL_L);
  ellipse(ctx, x - 0.4, y + 1, 1.8, 1.1, STEEL);
  const px = x1 - 0.2, py = y1 + 1.4;
  poly(ctx, [px, py, px + 9, py + 1.4, px + 6.6, py + 2.6, px + 9, py + 4, px, py + 5], WHITE);
  poly(ctx, [px + 1.4, py + 1.6, px + 2.6, py + 1.6, px + 2.6, py + 3.6, px + 1.4, py + 3.6], BLACK);
  poly(ctx, [px + 0.8, py + 2.2, px + 3.2, py + 2.2, px + 3.2, py + 3, px + 0.8, py + 3], BLACK);
}

/** A wheellock pistol held out: a long barrel, a lock with its wheel, and the ball pommel on the grip. */
function pistol(ctx: Ctx, x: number, y: number, k: number) {
  line(ctx, x - 1, y + 1.6 * k, x + 1.2 * k, y - 0.6 * k, '#6a3e1e', 1.4 * k); // the grip
  ellipse(ctx, x - 1.4 * k, y + 2.2 * k, 1.1 * k, 1.1 * k, '#6a3e1e'); // the ball pommel
  ellipse(ctx, x - 1.4 * k, y + 2.2 * k, 0.5 * k, 0.5 * k, GOLD);
  line(ctx, x + 0.8 * k, y - 0.6 * k, x + 9 * k, y - 2.2 * k, '#8a8e98', 1 * k); // the barrel
  line(ctx, x + 1 * k, y - 1 * k, x + 9 * k, y - 2.6 * k, STEEL_L, 0.3 * k);
  for (const [dx, dy, r] of [[11, -2.8, 1.2], [13, -3.6, 1.6], [15.4, -4.8, 1.9]] as const) ellipse(ctx, x + dx * k, y + dy * k, r * k, r * 0.8 * k, 'rgba(230,230,230,0.6)'); // the smoke of a shot
  ellipse(ctx, x + 1.6 * k, y - 0.4 * k, 0.9 * k, 0.9 * k, STEEL_D); // the wheel
  ellipse(ctx, x + 9.2 * k, y - 2.2 * k, 0.4 * k, 0.5 * k, '#121214');
}

/** The rider: a black Reiter in blackened armour on a dark horse, a wheellock pistol levelled; the knight: a brother of the
 *  Teutonic Order in Gothic plate under the white mantle, on a grey in barding and a white caparison, with lance and shield. */
function horseman(ctx: Ctx, kind: 'rider' | 'knight', x: number, y: number) {
  const knight = kind === 'knight';
  const saddle = drawHorse(ctx, x - 1, y + 3, HK, knight ? '#d8d4cc' : '#5a3420', knight ? '#c8c4bc' : '#140c08', undefined, knight ? WHITE : BLACK);
  barding(ctx, x, y, saddle, knight);
  const b = figure(ctx, kind, 'germany', saddle.x, saddle.y, 0.9, true);
  plateLeg(ctx, saddle.x, saddle.y, knight ? STEEL : BSTEEL);
  if (knight) {
    // the white mantle falling behind over the horse's back
    poly(ctx, [saddle.x - 3.4, saddle.y - 6.6, saddle.x - 1, saddle.y - 6.8, saddle.x - 4, saddle.y + 4.2, saddle.x - 10, saddle.y + 3.4], WHITE_D);
    poly(ctx, [saddle.x - 3.4, saddle.y - 6.6, saddle.x - 6.4, saddle.y - 3, saddle.x - 10, saddle.y + 3.4, saddle.x - 7, saddle.y + 0.4], WHITE);
    heater(ctx, b.off.x - 0.6, b.off.y + 3, 0.62, 'cross');
    lance(ctx, b.hand.x, b.hand.y, 32);
  } else {
    pistol(ctx, b.hand.x, b.hand.y - 1, 0.9);
    ellipse(ctx, b.hand.x, b.hand.y - 0.6, 1, 1, '#3a2a20'); // a gauntleted fist
  }
}

// ---------------------------------------------------------------- the field gun

/** A spoked wheel seen side-on. */
function wheel(ctx: Ctx, x: number, y: number, r: number) {
  ring(ctx, x, y, r, r, WOOD_D, 1.4);
  ring(ctx, x, y, r - 0.5, r - 0.5, IRON, 0.5);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI; line(ctx, x - Math.cos(a) * r, y - Math.sin(a) * r, x + Math.cos(a) * r, y + Math.sin(a) * r, WOOD, 0.6); }
  ellipse(ctx, x, y, r * 0.24, r * 0.24, WOOD_D);
  ellipse(ctx, x, y, r * 0.1, r * 0.1, IRON);
}

/** A bronze cannon (a Kartaune) on a two-wheeled field carriage, the eagle cast on its barrel; a gunner in a slashed
 *  doublet with the linstock, shot and a powder keg, an Imperial flag. */
function fieldGun(ctx: Ctx, x: number, y: number) {
  for (const [ax, ay, ar] of [[-15, 7, 1.7], [-12.4, 7.4, 1.7], [-13.8, 5.4, 1.6]] as const) {
    ellipse(ctx, x + ax, y + ay, ar, ar, IRON);
    ellipse(ctx, x + ax - 0.5, y + ay - 0.5, ar * 0.4, ar * 0.35, '#8a8e98');
  }
  box(ctx, x + 13, y + 6, 4, 4.4, '#7a5230', '#9a6a40');
  band(ctx, x + 13, y + 6, 4, 4.4, 0.2, 0.3, IRON);
  band(ctx, x + 13, y + 6, 4, 4.4, 0.72, 0.82, IRON);
  line(ctx, x + 16.6, y + 5, x + 16.6, y - 17, WOOD_D, 0.8);
  eagleFlag(ctx, x + 16.6, y - 17, 8, 6, 0.5);
  // the far wheel, the trail running back to the ground, the near wheel
  wheel(ctx, x - 1.4, y - 1.8, 5.6);
  poly(ctx, [x - 13, y + 5, x + 3, y - 3.6, x + 4.4, y - 2.2, x - 12, y + 6.4], WOOD_D);
  poly(ctx, [x - 13, y + 5, x + 3, y - 3.6, x + 3.4, y - 3, x - 12.6, y + 5.6], WOOD);
  for (const t of [0.3, 0.6]) line(ctx, x - 13 + 16 * t, y + 5 - 8.6 * t, x - 12 + 16 * t, y + 6.4 - 8.6 * t, IRON, 0.6);
  // the bronze barrel, its mouldings and the cast eagle, the muzzle swelling
  const b0: [number, number] = [x - 7, y - 1], b1: [number, number] = [x + 13, y - 9.4];
  const dx = b1[0] - b0[0], dy = b1[1] - b0[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const P = (t: number, o: number): [number, number] => [b0[0] + ux * t + nx * o, b0[1] + uy * t + ny * o];
  ellipse(ctx, ...P(-1.2, 0), 1.6, 1.6, BRONZE_D); // the cascabel
  poly(ctx, [...P(0, -3.2), ...P(len, -2.2), ...P(len, 2.2), ...P(0, 3.2)], BRONZE);
  poly(ctx, [...P(0, -3.2), ...P(len, -2.2), ...P(len, -0.8), ...P(0, -1.2)], BRONZE_L);
  poly(ctx, [...P(0, 1.8), ...P(len, 1.2), ...P(len, 2.2), ...P(0, 3.2)], BRONZE_D);
  for (const t of [0.06, 0.34, 0.62]) line(ctx, ...P(len * t, -3.3 + t), ...P(len * t, 3.3 - t), BRONZE_D, 0.9);
  poly(ctx, [...P(len - 2.4, -2.9), ...P(len, -2.9), ...P(len, 2.9), ...P(len - 2.4, 2.9)], BRONZE); // the muzzle swell
  ellipse(ctx, ...P(len + 0.2, 0), 1.4, 2.8, BRONZE_D);
  ellipse(ctx, ...P(len + 0.4, 0), 0.9, 1.9, '#121214');
  for (const t of [0.42]) { const [ex, ey] = P(len * t + 2, -0.6); eagle(ctx, ex, ey, 0.42, BRONZE_D, BRONZE_D); } // the cast eagle
  for (const t of [0.48, 0.56]) { const [dx2, dy2] = P(len * t, -3.4); ring(ctx, dx2, dy2, 0.8, 0.6, BRONZE_D, 0.5); } // the dolphins
  wheel(ctx, x + 2.6, y + 1.6, 6);
  // the gunner, in a slashed doublet and beret, with a linstock
  const g = figure(ctx, 'archer', 'germany', x - 16, y + 1, 0.56);
  line(ctx, g.hand.x - 1, g.hand.y + 4, g.hand.x + 3, g.hand.y - 7, WOOD, 0.7);
  ellipse(ctx, g.hand.x + 3.2, g.hand.y - 7.4, 0.6, 0.6, '#ff7a2a');
  curve(ctx, g.hand.x + 3.2, g.hand.y - 8, g.hand.x + 1.6, g.hand.y - 10.6, g.hand.x + 3.2, g.hand.y - 13, 0.6, 'rgba(220,220,220,0.6)');
}

// ---------------------------------------------------------------- ships

function foam(ctx: Ctx, x: number, y: number, w: number) {
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y, w, 2.2, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.stroke();
}

/** A square sail on its yard, bellied out: plain, or halved white over red (the Hanse), or gold with the black eagle. */
function squareSail(ctx: Ctx, mx: number, yTop: number, w: number, h: number, paint: 'plain' | 'hanse' | 'eagle') {
  const l = mx - w / 2, r = mx + w / 2, b = yTop + h;
  line(ctx, l - 1.4, yTop - 0.4, r + 1.4, yTop + 0.4, WOOD_D, 1);
  const pts = [l, yTop, r, yTop + 0.4, r + 1.4, b - h * 0.45, r + 0.4, b, mx, b + 1.8, l - 0.4, b - 0.2, l - 1.4, b - h * 0.45];
  poly(ctx, pts, paint === 'eagle' ? GOLD : '#f4eedc');
  ctx.save();
  clipPoly(ctx, pts);
  if (paint === 'hanse') poly(ctx, [l - 2, yTop + h * 0.5, r + 2, yTop + h * 0.52, r + 2, b + 3, l - 2, b + 3], RED);
  if (paint === 'eagle') eagle(ctx, mx, yTop + h * 0.42, h * 0.1);
  poly(ctx, [mx, yTop + 0.2, r, yTop + 0.4, r + 1.4, b - h * 0.45, r + 0.4, b, mx, b + 1.8], 'rgba(0,0,0,0.1)');
  ctx.restore();
  for (const t of [0.2, 0.8]) line(ctx, l + t * w, yTop + 1, l + t * w + (t - 0.5) * 2, b, 'rgba(0,0,0,0.1)', 0.5);
}

/** A curved, clinker-built hull seen side-on; `top(t)` is the gunwale height along it (t from -1 stern to 1 bow). */
function hull(ctx: Ctx, x: number, y: number, w: number, top: (t: number) => number, side = '#7a4a26', flat = false) {
  const near: [number, number][] = [];
  for (let i = 0; i <= 12; i++) { const t = -1 + i / 6; near.push([x + t * w, top(t)]); }
  const far = near.map(([a, b], i) => [a + (i === 0 ? 1.8 : i === 12 ? -1.8 : 0), b - 2] as [number, number]);
  poly(ctx, [...near.flat(), ...[...far].reverse().flat()], '#3a2414');
  const d = flat ? 1.4 : 3;
  const keel = [...near, [x + w * 0.9, y - 0.6], [x + w * 0.5, y + d * 0.8], [x, y + d], [x - w * 0.5, y + d * 0.9], [x - w * 0.96, y - 0.4]] as [number, number][];
  return {
    near, draw: () => {
      poly(ctx, keel.flat(), shade(side, -0.25));
      poly(ctx, [...near.flat(), x + w * 0.9, y - 2.6, x, y - 2, x - w * 0.9, y - 2.4], side);
      line(ctx, x - w * 0.94, y - 0.6, x + w * 0.86, y - 0.8, '#1a120a', 0.7);
      const stroke = (dy: number, c: string, wd: number) => {
        ctx.strokeStyle = ink(c);
        ctx.lineWidth = wd;
        ctx.beginPath();
        near.forEach(([a, b], i) => (i ? ctx.lineTo(a, b + dy) : ctx.moveTo(a, b + dy)));
        ctx.stroke();
      };
      for (const dy of [1.4, 2.8, 4.2]) stroke(dy, 'rgba(30,18,8,0.55)', 0.4); // the overlapping strakes
    },
  };
}

/** A castle on the deck: a timber box with a crenellated parapet (and painted shields hung along it). */
function deckCastle(ctx: Ctx, x: number, y: number, w: number, h: number, shields: boolean) {
  box(ctx, x, y, w, h, '#7a4a26', '#9a6a40');
  band(ctx, x, y, w, h, 0.66, 0.78, '#5a3418');
  for (let i = 0; i < 5; i++) faceQuad(ctx, 'L', x, y - h, w, 2, i / 5 + 0.04, i / 5 + 0.12, 0, 1, '#8a5a30'); // merlons
  for (let i = 0; i < 4; i++) faceQuad(ctx, 'R', x, y - h, w, 2, i / 4 + 0.04, i / 4 + 0.14, 0, 1, '#8a5a30');
  if (shields) for (const u of [0.2, 0.6]) {
    const [sx, sy] = fp('L', x, y, w, h, u + 0.1, 0.45);
    ellipse(ctx, sx, sy, 1, 1.3, u < 0.5 ? GOLD : WHITE);
    if (u < 0.5) eagle(ctx, sx, sy - 0.2, 0.18);
    else { line(ctx, sx, sy - 1, sx, sy + 1, BLACK, 0.4); line(ctx, sx - 0.8, sy - 0.2, sx + 0.8, sy - 0.2, BLACK, 0.4); }
  }
}

/** The Rhine barge: a long low hull with a single mast and a small sail, wine casks and bales amidships, a little cabin
 *  aft with a steering oar, a red-and-white pennant. */
function barge(ctx: Ctx, x: number, y: number) {
  const w = 18;
  const top = (t: number) => y - 3.4 - (t > 0.6 ? (t - 0.6) * 4 : 0) - (t < -0.7 ? (-t - 0.7) * 2 : 0);
  const h = hull(ctx, x, y, w, top, '#5a3a22', true);
  line(ctx, x + 3, y - 3, x + 3, y - 24, WOOD_D, 1);
  for (const [a, b] of [[x - 14, y - 5], [x + 17, y - 5]] as const) line(ctx, a, b, x + 3, y - 23, 'rgba(60,40,24,0.55)', 0.4);
  squareSail(ctx, x + 3, y - 21, 10, 9, 'plain');
  hansePennant(ctx, x + 3, y - 25.6, 8);
  h.draw();
  // the cargo: casks of Rhine wine and a bale under canvas
  for (const [cx, cy] of [[-3.6, -4.4], [0, -4.8], [7, -4.4]] as const) {
    ellipse(ctx, x + cx, y + cy, 1.8, 1.5, '#8a5a30');
    line(ctx, x + cx - 0.8, y + cy - 1.4, x + cx - 0.8, y + cy + 1.4, IRON, 0.4);
    line(ctx, x + cx + 0.8, y + cy - 1.4, x + cx + 0.8, y + cy + 1.4, IRON, 0.4);
  }
  box(ctx, x + 10.6, y - 3.6, 4, 2.4, '#c8b890');
  // the cabin aft and the long steering oar
  box(ctx, x - 11, y - 3.6, 5.6, 3.6, '#7a4a26', '#a83a2a');
  faceQuad(ctx, 'R', x - 11, y - 3.6, 5.6, 3.6, 0.3, 0.6, 0.2, 0.7, '#f0c860');
  line(ctx, x - 13, y - 6, x - 21, y + 3.4, WOOD, 1);
  poly(ctx, [x - 19, y + 1.6, x - 22.4, y + 3.4, x - 21.6, y + 4.6, x - 18.6, y + 2.6], WOOD);
  figure(ctx, 'explorer', 'germany', x - 11, y - 8, 0.34, true);
  foam(ctx, x, y + 2.2, w * 0.86);
}

/** The Hanse cog: a deep round clinker hull, straight stem and stern, a stern rudder, one mast with a great square sail
 *  halved white over red, a castle aft, the red-and-white pennant streaming from the masthead. */
function cog(ctx: Ctx, x: number, y: number) {
  const w = 17;
  const top = (t: number) => y - 6 - (t < 0 ? Math.pow(-t, 4) * 2.4 : Math.pow(t, 4) * 2.8);
  const h = hull(ctx, x, y, w, top);
  line(ctx, x + 1, y - 5, x + 1, y - 34, WOOD_D, 1.3);
  for (const [a, b] of [[x - 16, y - 8], [x + 18, y - 8]] as const) line(ctx, a, b, x + 1, y - 33, 'rgba(60,40,24,0.55)', 0.4);
  squareSail(ctx, x + 1, y - 30, 19, 17, 'hanse');
  ellipse(ctx, x + 1, y - 34.6, 1.6, 0.8, '#5a3418');
  hansePennant(ctx, x + 1, y - 37, 14, 0.6);
  h.draw();
  // a timber stern castle, a forecastle platform at the bow
  deckCastle(ctx, x - w * 0.74, y - 6.4, 7.6, 4.4, false);
  box(ctx, x + w * 0.8, y - 6.8, 4.4, 1.4, '#7a4a26', '#9a6a40');
  figure(ctx, 'swordsman', 'germany', x - w * 0.74, y - 11, 0.34, true);
  line(ctx, x - w + 1, top(-1) + 1.4, x - w - 1.8, y + 4.4, WOOD, 1.2); // the stern rudder
  line(ctx, x + w * 0.92, top(0.92) - 1, x + w + 5, top(1) - 6, WOOD_D, 0.9); // a short bowsprit
  foam(ctx, x, y + 3.2, w * 0.86);
}

/** The war cog: bigger, with crenellated castles fore and aft hung with shields, a fighting top on the mast, the sail of
 *  the Empire (gold with the black eagle) and the Imperial banner at the stern. */
function warCog(ctx: Ctx, x: number, y: number) {
  const w = 23;
  const top = (t: number) => y - 6.6 - (t < 0 ? Math.pow(-t, 3) * 3.4 : Math.pow(t, 3) * 3.4);
  const h = hull(ctx, x, y, w, top, '#6a3e20');
  line(ctx, x + 1, y - 5, x + 1, y - 44, WOOD_D, 1.5);
  for (const [a, b] of [[x - 22, y - 9], [x + 24, y - 9]] as const) line(ctx, a, b, x + 1, y - 40, 'rgba(60,40,24,0.55)', 0.4);
  squareSail(ctx, x + 1, y - 37, 24, 21, 'eagle');
  // the fighting top: a round crenellated basket with a crossbowman in it
  box(ctx, x + 1, y - 39.4, 5.4, 3, '#7a4a26', '#9a6a40');
  for (let i = 0; i < 3; i++) faceQuad(ctx, 'R', x + 1, y - 42.4, 5.4, 1.2, i / 3 + 0.05, i / 3 + 0.2, 0, 1, '#8a5a30');
  line(ctx, x + 1, y - 44, x + 1, y - 48, WOOD_D, 0.8);
  hansePennant(ctx, x + 1, y - 49, 13, 0.6);
  h.draw();
  // painted pavises along the waist
  for (let i = 0; i < 6; i++) {
    const t = -0.42 + i * 0.16, px = x + t * w, py = top(t) + 0.8;
    ellipse(ctx, px, py, 1.4, 1.8, i % 2 ? WHITE : GOLD);
    if (i % 2) { line(ctx, px, py - 1.3, px, py + 1.3, BLACK, 0.5); line(ctx, px - 1, py - 0.3, px + 1, py - 0.3, BLACK, 0.5); }
    else eagle(ctx, px, py - 0.3, 0.22);
  }
  deckCastle(ctx, x - w * 0.76, y - 7.4, 11, 6.4, true);
  deckCastle(ctx, x + w * 0.76, y - 7.6, 9, 5.4, true);
  figure(ctx, 'knight', 'germany', x - w * 0.76, y - 14.8, 0.36, true);
  figure(ctx, 'swordsman', 'germany', x + w * 0.76, y - 13.8, 0.34, true);
  // the Imperial banner at the stern
  line(ctx, x - w * 1.02, y - 10, x - w * 1.08, y - 25, WOOD_D, 0.8);
  eagleFlag(ctx, x - w * 1.08, y - 25, -8, 5.6, 0.6);
  line(ctx, x - w + 1, top(-1) + 1.4, x - w - 2, y + 4.6, WOOD, 1.3);
  line(ctx, x + w * 0.92, top(0.92) - 2, x + w + 7, top(1) - 9, WOOD_D, 1);
  foam(ctx, x, y + 3.2, w * 0.88);
}

function ship(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  if (kind === 'boat') barge(ctx, x, y);
  else if (kind === 'ship') cog(ctx, x, y);
  else warCog(ctx, x, y);
}

// ---------------------------------------------------------------- buildings

/** A steep gabled roof with the gable end facing right, over a box (x, y, w) whose walls top out at y. */
function gable(ctx: Ctx, x: number, y: number, w: number, rh: number, c: string, gableC: string, over = 1.2) {
  const hw = w / 2, hh = w / 4;
  const L0: [number, number] = [x - hw - over, y + over * 0.5], F0: [number, number] = [x, y + hh + over * 0.5], R0: [number, number] = [x + hw + over, y - over * 0.5], B0: [number, number] = [x, y - hh];
  const ridgeA: [number, number] = [(L0[0] + B0[0]) / 2, (L0[1] + B0[1]) / 2 - rh], ridgeB: [number, number] = [(F0[0] + R0[0]) / 2, (F0[1] + R0[1]) / 2 - rh];
  poly(ctx, [x, y + hh, x + hw, y, ridgeB[0], ridgeB[1] + 0.6], gableC);
  poly(ctx, [B0[0], B0[1] - 0.4, R0[0], R0[1], ridgeB[0], ridgeB[1], ridgeA[0], ridgeA[1]], shade(c, -0.25));
  poly(ctx, [L0[0], L0[1], F0[0], F0[1], ridgeB[0], ridgeB[1], ridgeA[0], ridgeA[1]], c);
  line(ctx, ridgeA[0], ridgeA[1], ridgeB[0], ridgeB[1], shade(c, -0.35), 0.7);
  for (let i = 1; i < 5; i++) { const t = i / 5; line(ctx, L0[0] + (ridgeA[0] - L0[0]) * t, L0[1] + (ridgeA[1] - L0[1]) * t, F0[0] + (ridgeB[0] - F0[0]) * t, F0[1] + (ridgeB[1] - F0[1]) * t, shade(c, -0.18), 0.35); } // tile courses
  return { ridgeA, ridgeB, L0, F0, R0 };
}

/** Fachwerk: the dark oak frame on one face of a storey, with the 'Mann' bracing (posts, a sill, a plate, K-braces) and
 *  St Andrew's crosses under the windows. */
function fachwerk(ctx: Ctx, f: 'L' | 'R', x: number, y: number, w: number, h: number, posts: number[], crosses: boolean) {
  const wd = Math.max(0.45, w * 0.045);
  faceQuad(ctx, f, x, y, w, h, 0, 1, 0, 0.1, BEAM);
  faceQuad(ctx, f, x, y, w, h, 0, 1, 0.9, 1, BEAM);
  for (const u of posts) faceQuad(ctx, f, x, y, w, h, u, u + 0.06, 0, 1, BEAM);
  for (let i = 0; i + 1 < posts.length; i += 2) {
    const a = posts[i] + 0.06, b = posts[i + 1];
    faceLine(ctx, f, x, y, w, h, a, 0.1, b, 0.5, BEAM, wd); // the Mann's braces, meeting the next post
    faceLine(ctx, f, x, y, w, h, a, 0.9, b, 0.5, BEAM, wd);
  }
  if (crosses) for (let i = 1; i + 1 < posts.length; i += 2) {
    const a = posts[i] + 0.06, b = posts[i + 1];
    faceLine(ctx, f, x, y, w, h, a, 0.1, b, 0.42, BEAM, wd);
    faceLine(ctx, f, x, y, w, h, a, 0.42, b, 0.1, BEAM, wd);
  }
}

/** A half-timbered house: two or three jettied storeys of ochre or white plaster in a dark oak frame, a steep red roof. */
function fachwerkHaus(ctx: Ctx, x: number, y: number, w: number, h: number, roofC: string, wall = PLASTER, storeys = 2) {
  const g = h / storeys;
  for (let i = 0; i < storeys; i++) {
    const sx = x + i * 0.4, sy = y - i * g + i * 0.2, sw = w + i * 0.9;
    box(ctx, sx, sy, sw, g, wall, shade(wall, 0.1));
    for (const f of ['L', 'R'] as const) fachwerk(ctx, f, sx, sy, sw, g, f === 'R' ? [0, 0.32, 0.62, 0.94] : [0, 0.3, 0.62, 0.94], i > 0);
    // small leaded windows with a red shutter
    for (const u of [0.12, 0.72]) {
      faceQuad(ctx, 'R', sx, sy, sw, g, u + 0.04, u + 0.16, 0.34, 0.74, '#3a4a5a');
      faceQuad(ctx, 'R', sx, sy, sw, g, u + 0.16, u + 0.2, 0.34, 0.74, i ? '#2a6a3a' : RED_D);
    }
    faceQuad(ctx, 'L', sx, sy, sw, g, 0.4, 0.52, 0.36, 0.72, '#3a4a5a');
    if (i === 0) faceQuad(ctx, 'R', sx, sy, sw, g, 0.38, 0.56, 0.1, 0.78, '#5a3a22'); // the door
  }
  const tx = x + (storeys - 1) * 0.4, ty = y - h + (storeys - 1) * 0.2, tw = w + (storeys - 1) * 0.9;
  const r = gable(ctx, tx, ty, tw, tw * 0.78, roofC, wall);
  // the gable end framed too: a king post and braces, a hoist beam at the top
  line(ctx, tx + tw / 4, ty + tw / 8, r.ridgeB[0], r.ridgeB[1] + 0.8, BEAM, 0.6);
  line(ctx, tx, ty + tw / 4, tx + tw / 2, ty, BEAM, 0.6);
  const mx = (tx + tw / 4 + r.ridgeB[0]) / 2, my = (ty + tw / 8 + r.ridgeB[1]) / 2;
  line(ctx, mx - 0.6, my + 2.6, mx + 0.6, my - 0.4, BEAM, 0.5);
  faceQuad(ctx, 'R', tx, ty + tw * 0.38, tw * 0.4, 1.6, 0.6, 1, 0, 1, '#3a4a5a');
  // a dormer on the roof and a chimney
  const dx = (r.L0[0] + r.ridgeB[0]) / 2 - 0.4, dy = (r.L0[1] + r.ridgeB[1]) / 2 + 0.6;
  poly(ctx, [dx - 1.4, dy, dx + 1.4, dy + 0.6, dx + 1.4, dy - 1.6, dx, dy - 3, dx - 1.4, dy - 2.2], shade(roofC, -0.1));
  poly(ctx, [dx - 0.8, dy - 0.2, dx + 0.8, dy + 0.2, dx + 0.8, dy - 1.4, dx - 0.8, dy - 1.8], '#3a4a5a');
  box(ctx, r.ridgeA[0] + 1.4, r.ridgeA[1] + 2.4, 1.8, 3.4, BRICK);
}

/** A stepped gable (Treppengiebel) in brick over the right face of a box (x, y, w) whose walls top out at y: tall steps
 *  climbing to the ridge, tall blind lancet panels in it, a hoist beam at the top. */
function steppedGable(ctx: Ctx, x: number, y: number, w: number, rh: number, brick: string, steps = 4) {
  const hw = w / 2, hh = w / 4;
  // the gable wall face: the right face of the box, extended upward in steps
  const P = (u: number, v: number): [number, number] => [x + u * hw, y + hh * (1 - u) - v];
  const pts: number[] = [...P(0, 0), ...P(1, 0)];
  for (let i = 0; i < steps; i++) {
    const u0 = 1 - (i / steps) * 0.5, u1 = 1 - ((i + 1) / steps) * 0.5, v = ((i + 1) / steps) * rh;
    pts.push(...P(u0, v), ...P(u1, v));
  }
  for (let i = steps - 1; i >= 0; i--) {
    const u0 = (i + 1) / steps * 0.5, u1 = (i / steps) * 0.5, v = ((i + 1) / steps) * rh;
    pts.push(...P(u0, v), ...P(u1, v));
  }
  poly(ctx, pts, shade(brick, 0.08));
  poly(ctx, [...P(0.5, 0), ...P(1, 0), ...P(1, rh * 0.1), ...P(0.5, rh)], 'rgba(0,0,0,0.12)'); // the far half in shadow
  // coping on each step
  for (let i = 0; i < steps; i++) {
    const v = ((i + 1) / steps) * rh;
    for (const [a, b] of [[1 - (i / steps) * 0.5, 1 - ((i + 1) / steps) * 0.5], [(i + 1) / steps * 0.5, (i / steps) * 0.5]] as const) line(ctx, ...P(a, v), ...P(b, v), '#e8e0d0', 0.5);
  }
  // blind lancet panels, whitewashed, and a window
  for (const [u, top] of [[0.22, 0.5], [0.42, 0.8], [0.58, 0.8], [0.78, 0.5]] as const) {
    const [ax, ay] = P(u, rh * 0.1), [bx, by] = P(u + 0.08, rh * 0.1);
    poly(ctx, [ax, ay, bx, by, bx, by - rh * top + 0.6, (ax + bx) / 2, by - rh * top - 0.6, ax, ay - rh * top + 0.6], shade(brick, -0.35));
  }
  const [hx, hy] = P(0.5, rh * 0.96);
  line(ctx, hx, hy, hx + 1.6, hy - 0.6, BEAM, 0.6); // the hoist beam
}

/** A Hanseatic merchant's house: a narrow brick front, a stepped gable to the street, a steep roof behind it. */
function giebelHaus(ctx: Ctx, x: number, y: number, w: number, h: number, roofC: string, brick = BRICK) {
  box(ctx, x, y, w, h, brick, shade(brick, 0.1));
  for (const f of ['L', 'R'] as const) {
    for (let i = 1; i < 6; i++) faceQuad(ctx, f, x, y, w, h, 0, 1, i / 6, i / 6 + 0.02, shade(brick, -0.15)); // courses
    for (const u of f === 'R' ? [0.16, 0.64] : [0.2, 0.6]) for (const v of [0.5]) faceQuad(ctx, f, x, y, w, h, u, u + 0.2, v, v + 0.3, '#3a4a5a');
  }
  faceQuad(ctx, 'R', x, y, w, h, 0.38, 0.6, 0, 0.36, '#4a2a18'); // the arched door
  const [ax, ay] = fp('R', x, y, w, h, 0.49, 0.36);
  ellipse(ctx, ax, ay, w * 0.055, 0.8, '#4a2a18');
  // the roof running back, its slope showing on the left; then the stepped gable over the right face
  const hw = w / 2, hh = w / 4, rh = w * 0.95;
  poly(ctx, [x - hw - 0.6, y - h + 0.3, x, y - h + hh + 0.3, x + hw / 2, y - h + hh / 2 - rh, x - hw / 2, y - h - hh / 2 - rh], roofC);
  line(ctx, x - hw / 2, y - h - hh / 2 - rh, x + hw / 2, y - h + hh / 2 - rh, shade(roofC, -0.35), 0.6);
  for (let i = 1; i < 5; i++) { const t = i / 5; line(ctx, x - hw - 0.6 + (hw / 2 + 0.6) * t, y - h + 0.3 - (rh + hh / 2 + 0.3) * t, x + (hw / 2) * t, y - h + hh + 0.3 - (rh + hh / 2) * t, shade(roofC, -0.18), 0.35); }
  steppedGable(ctx, x, y - h, w, rh, brick);
}

/** The guild hall (Gildehaus / Rathaus): a broad brick hall with an arcaded ground floor, a great stepped gable with
 *  pinnacles, a clock on the gable, a slender roof turret with a gilded vane, and the guild's banner. */
function guildHall(ctx: Ctx, x: number, y: number, roofC: string) {
  const w = 15, h = 9;
  box(ctx, x, y, w, h, BRICK, shade(BRICK, 0.1));
  for (const f of ['L', 'R'] as const) {
    for (let i = 1; i < 6; i++) faceQuad(ctx, f, x, y, w, h, 0, 1, i / 6, i / 6 + 0.02, shade(BRICK, -0.15));
    // the arcade of pointed arches below, tall windows above
    for (let i = 0; i < 4; i++) {
      const u = 0.06 + i * 0.24;
      faceQuad(ctx, f, x, y, w, h, u, u + 0.16, 0, 0.36, '#2a1a14');
      const [ax, ay] = fp(f, x, y, w, h, u + 0.08, 0.36);
      poly(ctx, [ax - w * 0.04, ay + 0.4, ax + w * 0.04, ay - 0.4, ax, ay - 1.8], '#2a1a14');
      faceQuad(ctx, f, x, y, w, h, u + 0.03, u + 0.13, 0.5, 0.86, '#3a4a5a');
      faceQuad(ctx, f, x, y, w, h, u + 0.075, u + 0.085, 0.5, 0.86, '#e8e0d0');
    }
    faceQuad(ctx, f, x, y, w, h, 0, 1, 0.42, 0.46, '#e8e0d0'); // a white string course
  }
  // the roof and the great stepped gable
  const hw = w / 2, hh = w / 4, rh = w * 0.8;
  poly(ctx, [x - hw - 0.6, y - h + 0.3, x, y - h + hh + 0.3, x + hw / 2, y - h + hh / 2 - rh, x - hw / 2, y - h - hh / 2 - rh], roofC);
  line(ctx, x - hw / 2, y - h - hh / 2 - rh, x + hw / 2, y - h + hh / 2 - rh, shade(roofC, -0.35), 0.6);
  steppedGable(ctx, x, y - h, w, rh, BRICK, 5);
  // the clock on the gable
  const [cx, cy] = [x + hw / 2, y - h + hh / 2 - rh * 0.42];
  ellipse(ctx, cx, cy, 1.7, 1.9, '#f4ecd8');
  ring(ctx, cx, cy, 1.7, 1.9, GOLD_D, 0.4);
  line(ctx, cx, cy, cx, cy - 1.3, BLACK, 0.3);
  line(ctx, cx, cy, cx + 0.9, cy + 0.2, BLACK, 0.3);
  // a slender roof turret with a green copper spire
  const tx = x - hw / 4, ty = y - h - hh / 4 - rh * 0.55;
  box(ctx, tx, ty, 2.6, 4, STONE_L);
  faceQuad(ctx, 'R', tx, ty, 2.6, 4, 0.3, 0.7, 0.4, 0.8, '#2a2a30');
  poly(ctx, [tx - 1.6, ty - 4, tx + 1.6, ty - 4, tx, ty - 11], '#5a9a84');
  poly(ctx, [tx, ty - 4, tx + 1.6, ty - 4, tx, ty - 11], '#3a7a64');
  line(ctx, tx, ty - 11, tx, ty - 13, GOLD_D, 0.4);
  poly(ctx, [tx, ty - 13, tx + 1.6, ty - 12.6, tx, ty - 12], GOLD);
}

/** A Gothic spire: a square tower of stone climbing in stages, an openwork octagonal spire with crockets, a finial. */
function spireTower(ctx: Ctx, x: number, y: number, w: number, h: number, sh: number, c: string) {
  box(ctx, x, y, w, h, c, shade(c, 0.1));
  for (const f of ['L', 'R'] as const) {
    for (const v of [0.34, 0.66]) faceQuad(ctx, f, x, y, w, h, 0, 1, v, v + 0.03, shade(c, -0.25));
    faceQuad(ctx, f, x, y, w, h, 0.32, 0.68, 0.72, 0.96, '#2a2a30'); // the belfry's tall lancet
    faceQuad(ctx, f, x, y, w, h, 0.47, 0.53, 0.72, 0.96, c);
    faceQuad(ctx, f, x, y, w, h, 0.36, 0.64, 0.4, 0.6, '#3a3a44');
    faceQuad(ctx, f, x, y, w, h, 0, 0.1, 0, 1, shade(c, 0.1)); // the corner buttresses
    faceQuad(ctx, f, x, y, w, h, 0.9, 1, 0, 1, shade(c, 0.1));
  }
  // the pinnacles at the corners and the spire
  const top = y - h, hw = w / 2, hh = w / 4;
  for (const [px, py] of [[x - hw, top], [x + hw, top], [x, top + hh]] as const) poly(ctx, [px - 0.6, py, px + 0.6, py, px, py - 4], shade(c, -0.05));
  poly(ctx, [x - hw * 0.8, top + 0.4, x, top + hh * 0.8, x, top - sh], shade(c, 0.05));
  poly(ctx, [x, top + hh * 0.8, x + hw * 0.8, top + 0.4, x, top - sh], shade(c, -0.22));
  for (let i = 1; i < 6; i++) { // crockets up the edges, and the openwork tracery as dark slits
    const t = i / 6;
    for (const d of [-1, 1]) ellipse(ctx, x + d * hw * 0.8 * (1 - t) + d * 0.5, top + 0.4 - (sh + 0.4) * t, 0.45, 0.35, shade(c, 0.15));
    if (i < 5) ellipse(ctx, x + hw * 0.3 * (1 - t), top + hh * 0.4 - (sh * 0.92) * t, 0.3, 0.7, 'rgba(30,30,40,0.6)');
  }
  // the finial: a cross-flower and a gilt star
  line(ctx, x, top - sh, x, top - sh - 2, shade(c, -0.1), 0.6);
  line(ctx, x - 0.9, top - sh - 1.2, x + 0.9, top - sh - 1.2, shade(c, -0.1), 0.6);
  ellipse(ctx, x, top - sh - 2.4, 0.5, 0.5, GOLD);
}

/** The cathedral: a tall nave with a steep slate roof and flying buttresses, a choir, and two great openwork spires over
 *  the west front with its rose window (after Cologne). */
function cathedral(ctx: Ctx, x: number, y: number) {
  const c = SAND;
  // the nave and the choir running back to the left, buttresses and tall windows
  box(ctx, x - 5, y - 2, 9, 11, c, shade(c, 0.1));
  for (let i = 0; i < 3; i++) faceQuad(ctx, 'L', x - 5, y - 2, 9, 11, 0.12 + i * 0.3, 0.24 + i * 0.3, 0.3, 0.86, '#3a3a50');
  for (let i = 0; i < 4; i++) {
    const [bx, by] = fp('L', x - 5, y - 2, 9, 11, i * 0.3, 0);
    poly(ctx, [bx - 0.6, by, bx + 0.6, by + 0.3, bx + 0.4, by - 9, bx - 0.4, by - 9], shade(c, -0.12)); // a buttress
    line(ctx, bx, by - 8.6, bx + 2, by - 11.6, shade(c, -0.15), 0.6); // its flyer
    poly(ctx, [bx - 0.4, by - 9, bx + 0.4, by - 9, bx, by - 12], shade(c, -0.05));
  }
  gable(ctx, x - 5, y - 13, 9, 7, SLATE, c, 0.5);
  // the two west towers, close together, the gable and rose window between
  const fy = y + 1.4;
  spireTower(ctx, x + 1.8, fy - 3, 5.4, 20, 15, c);
  box(ctx, x + 5.4, fy - 1.2, 3.2, 13, c, shade(c, 0.1));
  const [rx, ry] = fp('R', x + 5.4, fy - 1.2, 3.2, 13, 0.5, 0.72);
  ellipse(ctx, rx, ry, 1.1, 1.3, '#4a3a6a');
  ellipse(ctx, rx, ry, 0.5, 0.6, '#c86a4a');
  faceQuad(ctx, 'R', x + 5.4, fy - 1.2, 3.2, 13, 0.2, 0.8, 0, 0.36, '#2a2420'); // the great west door
  spireTower(ctx, x + 8.6, fy + 0.4, 5.4, 20, 15, c);
}

/** The Rhine castle on its crag: a rocky hill with vines, a curtain wall with a gate tower, the palas (the great hall)
 *  under a steep slate roof, and the tall round Bergfried with a pointed roof and the Imperial banner. */
function rhineCastle(ctx: Ctx, x: number, y: number) {
  // the crag
  ellipse(ctx, x, y + 6, 22, 7, 'rgba(0,0,0,0.14)');
  poly(ctx, [x - 20, y + 6, x - 12, y - 2, x - 6, y - 5, x + 6, y - 6, x + 14, y - 2, x + 20, y + 5, x + 4, y + 10, x - 10, y + 10], '#7a7468');
  poly(ctx, [x + 6, y - 6, x + 14, y - 2, x + 20, y + 5, x + 4, y + 10, x + 2, y + 2], '#5e5850');
  poly(ctx, [x - 20, y + 6, x - 12, y - 2, x - 6, y - 5, x - 9, y + 2], '#8e887a');
  for (const [dx, dy] of [[-14, 4], [-9, 6], [-4, 7], [8, 6], [13, 4]] as const) { // vines on the terraces
    ellipse(ctx, x + dx, y + dy, 1.6, 0.9, '#4a7a2a');
    ellipse(ctx, x + dx + 1.8, y + dy + 0.8, 1.4, 0.8, '#5a8a32');
  }
  for (const [ax, ay, bx2, by2] of [[-16, 6, -6, 9], [6, 9, 17, 5]] as const) line(ctx, x + ax, y + ay, x + bx2, y + by2, '#9a9282', 0.6); // terrace walls
  // the curtain wall round the top of the crag, with a gate tower
  const wc = STONE;
  box(ctx, x, y - 3, 22, 4, wc, STONE_L);
  for (const f of ['L', 'R'] as const) for (let i = 0; i < 9; i++) faceQuad(ctx, f, x, y - 7, 22, 1.4, i / 9 + 0.02, i / 9 + 0.07, 0, 1, wc);
  box(ctx, x + 6, y - 0.6, 4.4, 9, wc, STONE_L);
  faceQuad(ctx, 'R', x + 6, y - 0.6, 4.4, 9, 0.3, 0.7, 0, 0.42, '#2a2420');
  for (const f of ['L', 'R'] as const) for (let i = 0; i < 3; i++) faceQuad(ctx, f, x + 6, y - 9.6, 4.4, 1.2, i / 3 + 0.04, i / 3 + 0.2, 0, 1, wc);
  // the palas: a tall hall with a steep slate roof, its gable stepped
  const px = x - 4, py = y - 5;
  box(ctx, px, py, 11, 9, '#e8dcc4', '#f0e8d4');
  for (const f of ['L', 'R'] as const) for (const u of [0.15, 0.45, 0.75]) {
    faceQuad(ctx, f, px, py, 11, 9, u, u + 0.12, 0.42, 0.78, '#3a3a44');
    faceQuad(ctx, f, px, py, 11, 9, u + 0.055, u + 0.065, 0.42, 0.78, '#e8dcc4');
  }
  const r = gable(ctx, px, py - 9, 11, 9, SLATE, '#e8dcc4', 0.6);
  for (let i = 0; i < 3; i++) { const t = (i + 0.5) / 3; const ax = r.L0[0] + (r.F0[0] - r.L0[0]) * t, ay = r.L0[1] + (r.F0[1] - r.L0[1]) * t; poly(ctx, [ax - 0.7, ay - 1, ax + 0.7, ay - 0.6, ax + 0.7, ay - 2.6, ax, ay - 3.6, ax - 0.7, ay - 3], SLATE); } // dormers
  // the Bergfried: a tall round keep with machicolations and a pointed slate cap, oriels at its corners
  const bx = x + 2.4, by = y - 7.6, br = 3.4, bh = 22;
  ellipse(ctx, bx, by, br, br * 0.5, shade(wc, -0.2));
  poly(ctx, [bx - br, by, bx - br, by - bh, bx + br, by - bh, bx + br, by], wc);
  poly(ctx, [bx + br * 0.2, by + br * 0.5, bx + br * 0.2, by - bh, bx + br, by - bh, bx + br, by], shade(wc, -0.2));
  for (const v of [0.3, 0.6]) line(ctx, bx - br * 0.5, by - bh * v, bx - br * 0.5, by - bh * v - 2, '#2a2a30', 0.6);
  const cy = by - bh;
  ellipse(ctx, bx, cy + 0.6, br + 0.8, (br + 0.8) * 0.5, shade(wc, -0.3)); // the machicolated gallery
  poly(ctx, [bx - br - 0.8, cy + 0.6, bx - br - 0.8, cy - 2, bx + br + 0.8, cy - 2, bx + br + 0.8, cy + 0.6], STONE_L);
  for (let i = 0; i < 5; i++) line(ctx, bx - br + i * br * 0.5, cy + 0.6, bx - br + i * br * 0.5, cy + 1.6, '#3a3a40', 0.5);
  poly(ctx, [bx - br - 0.8, cy - 2, bx + br + 0.8, cy - 2, bx, cy - 12], SLATE);
  poly(ctx, [bx + 0.2, cy - 2, bx + br + 0.8, cy - 2, bx, cy - 12], shade(SLATE, -0.25));
  for (const d of [-1, 1]) { // four little corner turrets (two seen)
    const tx = bx + d * (br + 0.4);
    poly(ctx, [tx - 0.9, cy - 1.6, tx + 0.9, cy - 1.6, tx, cy - 6], SLATE);
  }
  line(ctx, bx, cy - 12, bx, cy - 20, WOOD_D, 0.6);
  eagleFlag(ctx, bx, cy - 20, 8.4, 5.6, 0.5);
}

function building(ctx: Ctx, x: number, y: number, big: boolean, roofC: string, capital: boolean) {
  if (big && capital) {
    ctx.save();
    ctx.translate(x, y + 2);
    ctx.scale(0.78, 0.78);
    cathedral(ctx, 12, -4);
    rhineCastle(ctx, -5, 2);
    ctx.restore();
    return;
  }
  if (big) { guildHall(ctx, x, y, roofC); return; }
  const v = ((Math.round(x) * 7 + Math.round(y) * 3) % 4 + 4) % 4;
  if (v === 0) fachwerkHaus(ctx, x, y, 9.6, 10, roofC, PLASTER, 2);
  else if (v === 1) giebelHaus(ctx, x, y, 8.6, 9, roofC);
  else if (v === 2) { fachwerkHaus(ctx, x - 2.8, y - 1.4, 8, 10, roofC, '#e8c88a', 3); giebelHaus(ctx, x + 4.4, y + 2.8, 7, 7, mix(roofC, '#5a5a62', 0.3), BRICK_D); }
  else fachwerkHaus(ctx, x, y, 10, 11.4, mix(roofC, '#7a3a20', 0.3), '#f4ead4', 3);
}

// ---------------------------------------------------------------- trees

/** A Norway spruce: a tall, narrow spire of drooping tiers, nearly black-green, on a bare reddish trunk. */
function spruce(ctx: Ctx, x: number, y: number, k: number, g: string, h = 24) {
  line(ctx, x, y, x, y - 4 * k, '#5a3a28', 1.6 * k);
  const tiers = 7;
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers, ty = y - 3 * k - t * (h - 6) * k, hw = (5.6 - t * 4.6) * k, th = (h / tiers + 1.6) * k;
    // each tier droops: a wide skirt with ragged tips, darker below, lit on the left
    poly(ctx, [x - hw, ty + 0.6 * k, x - hw * 0.5, ty + 1.2 * k, x, ty + 0.4 * k, x + hw * 0.5, ty + 1.2 * k, x + hw, ty + 0.6 * k, x, ty - th], shade(g, -0.12 + t * 0.06));
    poly(ctx, [x, ty + 0.4 * k, x + hw * 0.5, ty + 1.2 * k, x + hw, ty + 0.6 * k, x, ty - th], shade(g, -0.3 + t * 0.06));
    line(ctx, x - hw * 0.8, ty + 0.4 * k, x - hw * 0.2, ty - th * 0.5, shade(g, 0.12), 0.4 * k);
  }
  line(ctx, x, y - (h - 2) * k, x, y - (h + 1) * k, shade(g, -0.2), 0.6 * k); // the leader
}

/** A silver fir: broader than the spruce, its tiers held level with up-turned tips, silver bands under the needles,
 *  a flattened 'stork's nest' top and upright violet cones. */
function silverFir(ctx: Ctx, x: number, y: number, k: number, g: string, variant: number) {
  line(ctx, x, y, x, y - 5 * k, '#8a8a84', 1.8 * k);
  const tiers = 6;
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers, ty = y - 3.6 * k - t * 16 * k, hw = (7 - t * 4.8) * k, th = 4.6 * k;
    poly(ctx, [x - hw, ty - 0.6 * k, x - hw * 0.6, ty + 0.6 * k, x + hw * 0.6, ty + 0.6 * k, x + hw, ty - 0.6 * k, x + hw * 0.3, ty - th, x - hw * 0.3, ty - th], shade(g, -0.06 + t * 0.05));
    poly(ctx, [x, ty + 0.6 * k, x + hw * 0.6, ty + 0.6 * k, x + hw, ty - 0.6 * k, x + hw * 0.3, ty - th, x, ty - th], shade(g, -0.26 + t * 0.05));
    line(ctx, x - hw * 0.55, ty + 0.5 * k, x + hw * 0.55, ty + 0.5 * k, mix(g, '#a8bcb4', 0.45), 0.3 * k); // the silver undersides
    line(ctx, x - hw * 0.9, ty - 0.8 * k, x - hw * 0.3, ty - th * 0.8, shade(g, 0.14), 0.4 * k);
  }
  ellipse(ctx, x, y - 21.6 * k, 2.6 * k, 1.6 * k, shade(g, 0.02)); // the flat, rounded crown
  ellipse(ctx, x - 0.6 * k, y - 22 * k, 1.2 * k, 0.7 * k, shade(g, 0.16));
  for (let i = 0; i < 3; i++) { const cx = x + (rand(variant, i) - 0.5) * 5 * k, cy = y - 15 * k - rand(variant + 3, i) * 5 * k; poly(ctx, [cx - 0.45 * k, cy, cx + 0.45 * k, cy, cx, cy - 1.8 * k], '#6a4a6a'); }
}

/** Clumps of foliage: a darker underside, the clump, and a highlight. */
function clumps(ctx: Ctx, x: number, y: number, k: number, g: string, list: readonly (readonly [number, number, number, number, number])[]) {
  for (const [dx, dy, rx, ry, c] of list) {
    ellipse(ctx, x + dx * k, y + (dy + 1) * k, rx * k, ry * k, shade(g, c - 0.22));
    ellipse(ctx, x + dx * k, y + dy * k, rx * k, ry * k, shade(g, c));
    ellipse(ctx, x + (dx - rx * 0.3) * k, y + (dy - ry * 0.32) * k, rx * 0.5 * k, ry * 0.36 * k, shade(g, c + 0.18));
  }
}

function tree(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  const type = ['spruce', 'fir', 'beech', 'spruce', 'linden', 'spruce', 'fir', 'beech', 'spruce'][variant % 9];
  if (type === 'spruce') {
    // a stand of Black Forest spruce: one tall, one shorter behind, needles on the ground
    const g = mix(P.forest, '#1a3a2a', 0.6);
    spruce(ctx, x - 4 * k, y - 1.4 * k, k * 0.8, shade(g, 0.05), 20);
    spruce(ctx, x + 1.4 * k, y, k, g, 24);
    ellipse(ctx, x + 1 * k, y + 1 * k, 3 * k, 0.8 * k, 'rgba(90,50,30,0.35)');
    return;
  }
  if (type === 'fir') { silverFir(ctx, x, y, k, mix(P.forest, '#24483a', 0.55), variant); return; }
  if (type === 'beech') {
    // a copper-grey beech: a smooth silver-grey trunk forking high, a tall dome of fresh green, beech-mast at its foot
    const bk = '#9a9a94', g = mix(P.forest, '#5a8a32', 0.5);
    line(ctx, x, y, x, y - 6 * k, shade(bk, -0.2), 3 * k);
    line(ctx, x - 0.8 * k, y, x - 0.8 * k, y - 6 * k, shade(bk, 0.25), 0.9 * k);
    for (const [ex, ey] of [[-4, -12], [4, -13], [0, -15]] as const) curve(ctx, x, y - 5 * k, x + ex * 0.4 * k, y - 9 * k, x + ex * k, y + ey * k, 1.2 * k, bk);
    clumps(ctx, x, y, k, g, [[-5.6, -10, 4, 3.2, -0.14], [5.6, -10.4, 4, 3.2, -0.18], [0, -11.4, 6, 4.2, -0.06], [-3, -15.6, 4.6, 3.4, 0.04], [3, -16, 4.4, 3.2, 0.02], [0, -19.4, 3.6, 2.6, 0.12]]);
    for (let i = 0; i < 5; i++) { const a = rand(variant + 2, i) * Math.PI * 2; ellipse(ctx, x + Math.cos(a) * 4 * k, y + 1 * k + Math.sin(a) * 1.2 * k, 0.6 * k, 0.4 * k, '#a86a2a'); } // fallen leaves
    return;
  }
  // a village linden (Dorflinde): a short thick trunk, a broad heart-shaped crown, pale blossom, a bench round its foot
  const bk = '#5a4a3a', g = mix(P.forest, '#6a9a3a', 0.5);
  box(ctx, x, y + 0.6 * k, 9 * k, 1 * k, '#8a6a42'); // the bench round the trunk
  line(ctx, x, y, x, y - 6 * k, shade(bk, -0.2), 3.2 * k);
  line(ctx, x - 0.9 * k, y, x - 0.9 * k, y - 6 * k, bk, 1.2 * k);
  clumps(ctx, x, y, k, g, [[-5.6, -10, 4, 3.4, -0.14], [5.6, -10.4, 4, 3.4, -0.18], [0, -10.6, 6, 4, -0.06], [-3, -14.6, 4.4, 3.4, 0.04], [3, -15, 4.4, 3.4, 0.02], [0, -18, 3.4, 2.6, 0.1]]);
  for (let i = 0; i < 12; i++) { const a = rand(variant + 5, i) * Math.PI * 2, r = 1.4 + rand(variant + 9, i) * 5; ellipse(ctx, x + Math.cos(a) * r * k, y - 13 * k + Math.sin(a) * r * 0.6 * k, 0.45 * k, 0.4 * k, '#e8e0a0'); }
}

// ---------------------------------------------------------------- whole units

function unit(ctx: Ctx, kind: UnitKind, x: number, y: number): boolean {
  switch (kind) {
    case 'archer': arquebusier(ctx, x, y); return true;
    case 'warrior': { // drawn whole so that his hose is painted only when he stands (a seated warrior crews other boats)
      const b = figure(ctx, 'warrior', 'germany', x, y, 1);
      hose(ctx, x, y, 1, WHITE, BLACK, BLACK, WHITE, RED);
      weapon(ctx, 'warrior', b, 1);
      return true;
    }
    case 'rider': horseman(ctx, 'rider', x, y); return true;
    case 'knight': horseman(ctx, 'knight', x, y); return true;
    case 'catapult': fieldGun(ctx, x, y); return true;
    case 'boat': case 'ship': case 'warship': ship(ctx, kind, x, y); return true;
    default: return false;
  }
}

registerArt('germany', {
  unit,
  dress: (kind) => dress(kind),
  torso,
  face,
  head,
  weapon,
  shield: (ctx, kind, x, y, k) => { heater(ctx, x, y, k, kind === 'knight' ? 'cross' : 'eagle'); return true; },
  building,
  tree,
});

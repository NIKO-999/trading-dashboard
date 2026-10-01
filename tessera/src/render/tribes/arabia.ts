// The Abbasid Caliphate's own art (see render/tribeart): Baghdad and the desert roads, eighth to tenth century.
// White and sand-coloured thobes trimmed in green over sandals, keffiyeh headcloths bound with a black agal, white
// turbans wound round pointed helmets for the heavy ranks, mail hauberks and quilted coats; round leather darqa shields
// tooled with an eight-pointed star, straight sayf swords, curved blades, long lances and composite bows. The Camel
// Rider sits on a dromedary under a fringed saddle cloth; Arabian horses carry the faris; mangonels throw stones and
// naphtha pots; the boats are dhows under lateen sails. Towns are cubes of whitewash and mud brick with arches and
// domes; the capital has a great domed hall and a spiral minaret. Forests are date-palm groves.
import type { BiomePalette } from '../../data/tribes';
import type { UnitKind } from '../../game/types';
import { registerArt, type Body } from '../tribeart';
import { band, box, ellipse, faceQuad, ink, line, mix, poly, rand, roof, shade, softShadow } from '../prims';
import type { Ctx } from '../prims';
import { drawHorse, figure } from '../units';

// ---------------------------------------------------------------- colours

const AR_WHITE = '#f4efe2'; // bleached cotton
const AR_CREAM = '#e9dcbc';
const AR_SAND = '#d6bf8c';
const AR_GREEN = '#2f8f2a'; // the empire's green, a little deeper for trim
const AR_GREEN_L = '#5cb82a';
const AR_GREEN_D = '#1f5a14';
const AR_GOLD = '#e2b846';
const AR_GOLD_D = '#a07a1e';
const AR_MAIL = '#a6aeb8';
const AR_STEEL = '#c4ccd4';
const AR_LEATH = '#8a5a30';
const AR_LEATH_D = '#5a3a1e';
const AR_BLACK = '#1d1a18';
const AR_RED = '#b23a2a'; // shemagh red, tassels
const AR_INDIGO = '#2c3a6a';
const AR_WOOD = '#7a5434';
const AR_WOOD_D = '#4a3020';
const AR_TEAK = '#8a5a32';
const AR_HAIR = '#140e0a';

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
/** A silk tassel hanging from (x, y). */
function tassel(ctx: Ctx, x: number, y: number, len: number, w: number, color = AR_RED) {
  ellipse(ctx, x, y, w * 0.55, w * 0.55, AR_GOLD);
  for (let i = -2; i <= 2; i++) line(ctx, x + i * w * 0.14, y + w * 0.3, x + i * w * 0.34, y + len, i % 2 ? shade(color, -0.18) : color, w * 0.3);
}
/** An eight-pointed star of two overlapping squares (a common geometric ornament). */
function star8(ctx: Ctx, x: number, y: number, r: number, ry: number, color: string) {
  for (const a0 of [0, Math.PI / 4]) {
    const pts: number[] = [];
    for (let i = 0; i < 4; i++) { const a = a0 + (i * Math.PI) / 2; pts.push(x + Math.cos(a) * r, y + Math.sin(a) * ry); }
    poly(ctx, pts, color);
  }
}

// ---------------------------------------------------------------- dress

const isHeavyKind = (kind: UnitKind) => kind === 'swordsman' || kind === 'knight' || kind === 'giant' || kind === 'defender';

/** [torso, legs, sleeves]: the thobe for the line, quilting for the spearmen, mail for the swordsmen and knights. */
function dress(kind: UnitKind): [string, string, string] {
  switch (kind) {
    case 'warrior': return [AR_CREAM, AR_CREAM, AR_CREAM];
    case 'archer': return [AR_WHITE, AR_WHITE, AR_WHITE];
    case 'defender': return [AR_SAND, AR_WHITE, AR_SAND];
    case 'swordsman': case 'knight': return [AR_MAIL, AR_WHITE, AR_MAIL];
    case 'giant': return [AR_GREEN, AR_WHITE, AR_GREEN];
    case 'explorer': return [AR_SAND, AR_SAND, AR_SAND];
    case 'camelrider': return [AR_WHITE, AR_WHITE, AR_WHITE];
    case 'rider': return [AR_WHITE, AR_WHITE, AR_WHITE];
    default: return [AR_WHITE, AR_WHITE, AR_WHITE];
  }
}

/** The long skirt of the robe, falling from the hip nearly to the ankle over the legs: only its two sides. */
function skirt(ctx: Ctx, x: number, hip: number, k: number, color: string, len: number, trim: string | null, wide = 10.8) {
  const w = wide * k, cy = hip + len * k, h = (len + 0.1) * k;
  faceQuad(ctx, 'L', x, cy, w, h, 0, 1, 0, 1, color);
  faceQuad(ctx, 'R', x, cy, w, h, 0, 1, 0, 1, color);
  for (const u of [0.22, 0.5, 0.78]) { // soft folds
    faceQuad(ctx, 'L', x, cy, w, h, u, u + 0.05, 0.05, 0.85, shade(color, -0.1));
    faceQuad(ctx, 'R', x, cy, w, h, u, u + 0.05, 0.05, 0.85, shade(color, -0.12));
  }
  if (trim) { band(ctx, x, cy, w, h, 0, 0.1, trim); band(ctx, x, cy, w, h, 0.1, 0.13, AR_GOLD); }
  else band(ctx, x, cy, w, h, 0, 0.06, shade(color, -0.2));
}

/** Rows of mail rings over part of a box: tiny dark arcs staggered row by row, with a lit ring now and then. */
function mail(ctx: Ctx, x: number, y: number, w: number, h: number, v0: number, v1: number, base: string, rows = 6) {
  band(ctx, x, y, w, h, v0, v1, base);
  const dv = (v1 - v0) / rows;
  for (let r = 0; r < rows; r++) {
    const v = v0 + r * dv;
    for (let i = 0; i < 6; i++) {
      const u = (i + (r % 2) * 0.5 + 0.2) / 6.4;
      for (const f of ['L', 'R'] as const) {
        faceQuad(ctx, f, x, y, w, h, u, u + 0.08, v + dv * 0.15, v + dv * 0.55, shade(base, -0.34));
        faceQuad(ctx, f, x, y, w, h, u, u + 0.05, v + dv * 0.6, v + dv * 0.85, shade(base, 0.3));
      }
    }
  }
}

/** A khanjar: a curved dagger in a silver-and-gold sheath tucked into the belt at the front. */
function khanjar(ctx: Ctx, x: number, y: number, k: number) {
  line(ctx, x, y - 2.2 * k, x + 0.2 * k, y - 0.2 * k, AR_LEATH_D, 1.3 * k); // the hilt
  ellipse(ctx, x + 0.1 * k, y - 2.6 * k, 1 * k, 0.6 * k, AR_GOLD);
  curve(ctx, x + 0.2 * k, y, x + 0.4 * k, y + 3 * k, x + 2.6 * k, y + 3.6 * k, 1.5 * k, '#cfd4da'); // the J-shaped silver sheath
  curve(ctx, x + 0.2 * k, y, x + 0.4 * k, y + 3 * k, x + 2.6 * k, y + 3.6 * k, 0.5 * k, AR_GOLD_D);
  ellipse(ctx, x + 2.7 * k, y + 3.6 * k, 0.6 * k, 0.6 * k, AR_GOLD);
}

function torso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const k = w / 10;
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const B = (v0: number, v1: number, c: string) => band(ctx, x, y, w, h, v0, v1, c);
  const [base] = dress(kind);
  if (isHeavyKind(kind)) {
    if (kind === 'defender') {
      // a quilted kazaghand coat: vertical rows of stitching, a mail collar and a green-edged hem over a white robe
      skirt(ctx, x, y, k, AR_WHITE, 3.6, AR_GREEN);
      skirt(ctx, x, y, k, AR_SAND, 2.2, null, 10.6);
      for (const u of [0.12, 0.3, 0.48, 0.66, 0.84]) { R(u, u + 0.03, 0.08, 0.86, shade(AR_SAND, -0.22)); faceQuad(ctx, 'L', x, y, w, h, u, u + 0.03, 0.08, 0.86, shade(AR_SAND, -0.18)); }
      mail(ctx, x, y, w, h, 0.84, 1, AR_MAIL, 2);
      B(0.16, 0.28, AR_LEATH);
      B(0.2, 0.24, AR_GREEN);
      R(0.44, 0.56, 0.15, 0.29, AR_GOLD);
      return;
    }
    // a mail hauberk to the knee over the white robe
    skirt(ctx, x, y, k, AR_WHITE, 3.8, kind === 'giant' ? AR_GOLD : AR_GREEN);
    if (kind !== 'giant') {
      const sw = 10.6 * k, scy = y + 2.4 * k, sh = 2.5 * k;
      for (const f of ['L', 'R'] as const) faceQuad(ctx, f, x, scy, sw, sh, 0, 1, 0, 1, AR_MAIL);
      mail(ctx, x, scy, sw, sh, 0, 1, AR_MAIL, 2);
      band(ctx, x, scy, sw, sh, 0, 0.14, shade(AR_MAIL, -0.3));
      mail(ctx, x, y, w, h, 0, 1, AR_MAIL, 6);
    } else {
      // the commander: a green silk qaba embroidered in gold over mail, a broad gold belt
      for (const v of [0.4, 0.62]) B(v, v + 0.04, AR_GOLD_D);
      for (const u of [0.1, 0.3, 0.5, 0.7, 0.9]) { R(u, u + 0.06, 0.48, 0.58, AR_GOLD); faceQuad(ctx, 'L', x, y, w, h, u, u + 0.06, 0.48, 0.58, AR_GOLD); }
      mail(ctx, x, y, w, h, 0.84, 1, AR_MAIL, 1);
    }
    if (kind === 'swordsman' || kind === 'knight') {
      // the open qaba coat over the mail: white panels edged in green down the front
      fpoly(ctx, 'R', x, y, w, h, [[0, 0], [0.26, 0], [0.34, 1], [0, 1]], AR_WHITE);
      fpoly(ctx, 'R', x, y, w, h, [[0.26, 0], [0.32, 0], [0.4, 1], [0.34, 1]], AR_GREEN);
      fpoly(ctx, 'L', x, y, w, h, [[0, 0], [0.7, 0], [0.62, 1], [0, 1]], AR_WHITE);
      fpoly(ctx, 'L', x, y, w, h, [[0.7, 0], [0.76, 0], [0.68, 1], [0.62, 1]], AR_GREEN);
      fpoly(ctx, 'R', x, y, w, h, [[0.9, 0], [1, 0], [1, 1], [0.84, 1]], AR_WHITE);
    }
    B(0.18, 0.3, AR_LEATH);
    B(0.22, 0.26, kind === 'giant' ? AR_GOLD : AR_GREEN);
    for (const u of [0.2, 0.55, 0.85]) R(u, u + 0.08, 0.17, 0.31, AR_GOLD); // gilt belt plaques
    if (kind === 'knight') { // a round chest plate
      const [mx, my] = fpt('R', x, y, w, h, 0.56, 0.62);
      ellipse(ctx, mx, my, 2 * k, 2.2 * k, AR_GOLD);
      ellipse(ctx, mx, my, 1.5 * k, 1.7 * k, AR_STEEL);
      ellipse(ctx, mx - 0.4 * k, my - 0.5 * k, 0.6 * k, 0.6 * k, '#ffffff');
    }
    return;
  }
  // the thobe: an ankle-length robe with an embroidered placket, a leather belt and a dagger
  const trim = kind === 'explorer' ? AR_INDIGO : AR_GREEN;
  skirt(ctx, x, y, k, base, 3.8, kind === 'warrior' || kind === 'explorer' ? null : trim);
  B(0.9, 1, shade(base, 0.18)); // the collar
  B(0.86, 0.9, trim);
  fpoly(ctx, 'R', x, y, w, h, [[0.44, 0.48], [0.54, 0.48], [0.54, 0.9], [0.44, 0.9]], trim); // the placket
  for (const v of [0.56, 0.68, 0.8]) { const [bx, by] = fpt('R', x, y, w, h, 0.49, v); ellipse(ctx, bx, by, 0.45 * k, 0.45 * k, AR_GOLD); }
  for (const u of [0.18, 0.78]) R(u, u + 0.04, 0.3, 0.84, shade(base, -0.1)); // folds where the robe blouses over the belt
  B(0.16, 0.28, kind === 'warrior' ? AR_LEATH : kind === 'explorer' ? AR_LEATH_D : AR_LEATH);
  B(0.2, 0.24, shade(AR_LEATH, -0.3));
  if (kind === 'warrior' || kind === 'camelrider' || kind === 'rider') { // the warrior's khanjar at the belt
    const [dx, dy] = fpt('R', x, y, w, h, 0.4, 0.24);
    khanjar(ctx, dx, dy, k);
  }
  if (kind === 'archer') { // a green sash across the chest
    fpoly(ctx, 'R', x, y, w, h, [[0, 0.86], [0.2, 0.96], [1, 0.36], [0.8, 0.26]], AR_GREEN);
    fpoly(ctx, 'R', x, y, w, h, [[0.1, 0.9], [0.16, 0.93], [0.9, 0.32], [0.84, 0.29]], AR_GOLD);
  }
  if (kind === 'explorer') { // an indigo shoulder bag on a strap
    fpoly(ctx, 'R', x, y, w, h, [[0, 0.9], [0.14, 0.98], [1, 0.4], [0.86, 0.32]], AR_LEATH_D);
  }
}

/** Beards: full and black for the ranks, trimmed for the young archers, grey for the guide. */
function face(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const beard = kind === 'explorer' ? '#cfc8bc' : AR_HAIR;
  if (kind === 'archer') {
    R(0.06, 0.94, 0.02, 0.1, beard); // a short trimmed beard along the jaw
    R(0.3, 0.42, 0.1, 0.16, beard); R(0.6, 0.72, 0.1, 0.16, beard);
    R(0.28, 0.72, 0.2, 0.24, beard);
    return;
  }
  const full = isHeavyKind(kind) || kind === 'explorer';
  R(0.04, 0.96, 0, full ? 0.2 : 0.14, beard);
  R(0.04, 0.2, 0.14, 0.34, beard); R(0.8, 0.96, 0.14, 0.34, beard); // up the cheeks
  R(0.26, 0.74, 0.19, 0.25, beard); // moustache
  R(0.36, 0.64, 0.13, 0.17, '#7a3a2a'); // the lips showing through
  if (full) poly(ctx, [...fpt('R', x, y, w, h, 0.3, 0.02), ...fpt('R', x, y, w, h, 0.7, 0.02), ...fpt('R', x, y, w, h, 0.5, -0.16)], beard); // a pointed end
  if (kind === 'explorer') R(0.1, 0.4, 0.7, 0.74, '#cfc8bc');
}

// ---------------------------------------------------------------- headgear

/** A keffiyeh: a square of cloth over the head, framing the face, falling to the shoulders, held by a black agal. */
function keffiyeh(ctx: Ctx, x: number, top: number, k: number, hw: number, cloth: string, check: string | null, agal = true) {
  const w = hw + 1.4 * k, h = 11.8 * k, cy = top + 11.2 * k;
  // the cloth falling behind the head onto the shoulders and back
  poly(ctx, [x - w / 2, top + 1 * k, x - w / 2 - 1.6 * k, top + 13.4 * k, x - 1 * k, top + 15.6 * k, x + 0.6 * k, top + 12 * k], shade(cloth, -0.12));
  faceQuad(ctx, 'L', x, cy, w, h, 0, 1, 0.12, 1, cloth);
  faceQuad(ctx, 'R', x, cy, w, h, 0, 1, 0.8, 1, cloth); // over the forehead
  faceQuad(ctx, 'R', x, cy, w, h, 0, 0.1, 0.06, 0.8, cloth); // framing the face
  faceQuad(ctx, 'R', x, cy, w, h, 0.9, 1, 0.06, 0.8, cloth);
  ellipse(ctx, x, top + 0.4 * k, w / 2, w / 4 + 0.4 * k, shade(cloth, 0.1)); // the cloth over the crown
  if (check) { // a woven check on the cloth
    for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) {
      const u = 0.08 + i * 0.24 + (r % 2) * 0.1, v = 0.22 + r * 0.18;
      faceQuad(ctx, 'L', x, cy, w, h, u, u + 0.08, v, v + 0.06, check);
    }
    for (const u of [0.02, 0.92]) for (const v of [0.2, 0.4, 0.6]) faceQuad(ctx, 'R', x, cy, w, h, u, u + 0.06, v, v + 0.06, check);
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; ellipse(ctx, x + Math.cos(a) * w * 0.28, top - 0.6 * k + Math.sin(a) * w * 0.12, 0.5 * k, 0.4 * k, check); }
  }
  faceQuad(ctx, 'L', x, cy, w, h, 0, 1, 0.12, 0.18, shade(cloth, -0.25)); // the fringed hem
  if (agal) { // the agal: a doubled black cord round the crown, the cloth puffing up inside it
    ring(ctx, x, top + 1.8 * k, w * 0.47, w * 0.235, AR_BLACK, 1.1 * k);
    ring(ctx, x, top + 0.7 * k, w * 0.45, w * 0.225, AR_BLACK, 1.1 * k);
    ellipse(ctx, x - 0.2 * k, top - 0.5 * k, w * 0.4, w * 0.2 + 0.6 * k, shade(cloth, 0.2));
    ellipse(ctx, x - 1 * k, top - 1 * k, w * 0.2, w * 0.08, shade(cloth, 0.4));
    ctx.strokeStyle = ink(AR_BLACK); // the front of the cord passes in front of the puff
    ctx.lineWidth = 1.1 * k;
    ctx.beginPath();
    ctx.ellipse(x, top + 0.7 * k, w * 0.45, w * 0.225, 0, 0.05 * Math.PI, 0.95 * Math.PI);
    ctx.stroke();
    ctx.strokeStyle = ink('#5a524c');
    ctx.lineWidth = 0.35 * k;
    ctx.beginPath();
    ctx.ellipse(x, top + 0.4 * k, w * 0.45, w * 0.225, 0, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else ellipse(ctx, x - 0.2 * k, top - 0.3 * k, w * 0.42, w * 0.21 + 0.4 * k, shade(cloth, 0.18));
}

/** A turban: wraps of cloth wound round the head, each a little smaller, with fold lines across the front. */
function turban(ctx: Ctx, x: number, top: number, k: number, hw: number, cloth: string, wraps: number, size = 1) {
  const rx = hw * 0.6 * size, ry = hw * 0.32 * size;
  for (let i = 0; i < wraps; i++) {
    const yy = top + 2 * k - i * 1.5 * k, s = 1 - i * 0.07;
    ellipse(ctx, x + 0.2 * k, yy + 0.5 * k, rx * s, ry * s, shade(cloth, -0.22));
    ellipse(ctx, x, yy, rx * s, ry * s, i % 2 ? shade(cloth, -0.05) : cloth);
    curve(ctx, x - rx * s * 0.9, yy + ry * 0.1, x, yy + ry * s * 1.2, x + rx * s * 0.8, yy - ry * s * 0.4, 0.5 * k, shade(cloth, -0.2)); // a fold
  }
}

/** A pointed steel helmet rising out of a turban. */
function spike(ctx: Ctx, x: number, top: number, k: number, hgt: number, metal = AR_STEEL) {
  poly(ctx, [x - 3.2 * k, top + 0.4 * k, x, top - hgt * k, x + 3.2 * k, top + 0.4 * k], metal);
  poly(ctx, [x, top - hgt * k, x + 3.2 * k, top + 0.4 * k, x + 0.6 * k, top + 1.2 * k], shade(metal, -0.28));
  line(ctx, x - 0.8 * k, top - 1 * k, x - 0.2 * k, top - hgt * k + 1.4 * k, shade(metal, 0.5), 0.5 * k);
}

/** A mail aventail hanging from the helmet round the back of the neck. */
function aventail(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const x0 = x - hw / 2 - 0.8 * k, x1 = x - 0.4 * k, y0 = top + 2.6 * k, y1 = top + 12 * k;
  poly(ctx, [x0, y0, x1, y0 + hw / 4 - 1.2 * k, x1 - 0.4 * k, y1, x0 + 0.4 * k, y1 - hw / 4 + 1 * k], shade(AR_MAIL, -0.1));
  for (let r = 0; r < 5; r++) for (let i = 0; i < 4; i++) {
    const t = (i + 0.5 + (r % 2) * 0.4) / 4.4, yy = y0 + 1 * k + r * 1.7 * k + (hw / 4 - 1.2 * k) * t;
    ellipse(ctx, x0 + (x1 - x0) * t, yy, 0.45 * k, 0.35 * k, shade(AR_MAIL, -0.38));
  }
}

function head(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  switch (kind) {
    case 'warrior': // a red-checked shemagh and agal
      keffiyeh(ctx, x, top, k, hw, AR_WHITE, AR_RED);
      break;
    case 'archer': // a plain white keffiyeh with a green cord
      keffiyeh(ctx, x, top, k, hw, AR_WHITE, null);
      ring(ctx, x, top + 1.2 * k, (hw + 1.4 * k) * 0.47, (hw + 1.4 * k) * 0.235, AR_GREEN, 0.4 * k);
      break;
    case 'rider':
      keffiyeh(ctx, x, top, k, hw, AR_CREAM, AR_GREEN);
      break;
    case 'camelrider': { // the desert rider: a sand-coloured headcloth wound as a litham over the lower face, with a black agal
      keffiyeh(ctx, x, top, k, hw, AR_SAND, null);
      const w = hw + 1.4 * k, cy = top + 11.2 * k, h = 11.8 * k;
      faceQuad(ctx, 'R', x, cy, w, h, 0, 1, 0.06, 0.32, shade(AR_SAND, 0.06)); // the veil across mouth and nose
      faceQuad(ctx, 'R', x, cy, w, h, 0, 1, 0.3, 0.33, shade(AR_SAND, -0.2));
      faceQuad(ctx, 'R', x, cy, w, h, 0.2, 0.26, 0.08, 0.3, shade(AR_SAND, -0.12));
      break;
    }
    case 'explorer': { // an indigo headcloth tied as a turban, its tail falling behind
      turban(ctx, x, top, k, hw, AR_INDIGO, 3, 0.95);
      curve(ctx, x - hw * 0.5, top + 1 * k, x - hw * 0.8, top + 7 * k, x - hw * 0.6, top + 12 * k, 2 * k, shade(AR_INDIGO, -0.1));
      break;
    }
    case 'defender': // a conical helmet over a mail coif, a white turban wound round its foot
      aventail(ctx, x, top, k, hw);
      spike(ctx, x, top, k, 8.4);
      turban(ctx, x, top + 0.4 * k, k, hw, AR_WHITE, 2, 1.02);
      line(ctx, x + hw * 0.3, top + 2 * k, x + hw * 0.32, top + 6.6 * k, AR_STEEL, 1 * k); // the nasal
      break;
    case 'swordsman': // a tall pointed helmet in a big white turban with a green under-wrap
      aventail(ctx, x, top, k, hw);
      spike(ctx, x, top - 1.4 * k, k, 9.4);
      ellipse(ctx, x, top - 10.2 * k, 0.8 * k, 0.8 * k, AR_GOLD);
      turban(ctx, x, top + 0.2 * k, k, hw, AR_GREEN, 1, 1.06);
      turban(ctx, x, top - 1.2 * k, k, hw, AR_WHITE, 2, 1.04);
      line(ctx, x + hw * 0.3, top + 1.4 * k, x + hw * 0.32, top + 6.6 * k, AR_STEEL, 1 * k);
      break;
    case 'knight': // a gilded helmet, a green turban with a trailing end, mail round the neck
      aventail(ctx, x, top, k, hw);
      spike(ctx, x, top - 1.4 * k, k, 9.8, '#d8c27a');
      turban(ctx, x, top + 0.2 * k, k, hw, AR_GREEN, 3, 1.06);
      curve(ctx, x - hw * 0.5, top + 0.2 * k, x - hw * 0.95, top + 4 * k, x - hw * 0.9, top + 9 * k, 1.8 * k, AR_GREEN_D);
      ellipse(ctx, x + hw * 0.24, top - 0.6 * k, 1 * k, 1.1 * k, AR_GOLD);
      ellipse(ctx, x + hw * 0.24, top - 0.6 * k, 0.5 * k, 0.55 * k, AR_RED);
      break;
    case 'giant': // the commander: a great white turban set with a jewel and a plume
      turban(ctx, x, top + 0.6 * k, k, hw, AR_WHITE, 4, 1.16);
      ellipse(ctx, x + hw * 0.36, top - 1.8 * k, 1.5 * k, 1.6 * k, AR_GOLD);
      ellipse(ctx, x + hw * 0.36, top - 1.8 * k, 0.9 * k, 1 * k, AR_GREEN_L);
      for (let i = -1; i <= 1; i++) curve(ctx, x + hw * 0.36, top - 2.8 * k, x + hw * 0.3 + i * 1.2 * k, top - 7 * k, x + hw * 0.1 + i * 2 * k, top - 9.4 * k, 0.8 * k, i ? AR_WHITE : '#e8e2d2');
      break;
    default:
      keffiyeh(ctx, x, top, k, hw, AR_WHITE, null);
  }
}

// ---------------------------------------------------------------- weapons and shields

/** A straight double-edged sayf with a gilt cross-guard and a round pommel, raised from the hand. */
function sayf(ctx: Ctx, x: number, y: number, k: number, len = 17) {
  const x1 = x + 3.6 * k, y1 = y - len * k;
  poly(ctx, [x - 0.9 * k, y - 2.2 * k, x1 - 0.7 * k, y1 + 1 * k, x1, y1 - 1.6 * k, x + 0.2 * k, y - 2.2 * k], shade(AR_STEEL, 0.15));
  poly(ctx, [x + 0.2 * k, y - 2.2 * k, x1, y1 - 1.6 * k, x1 + 0.7 * k, y1 + 1 * k, x + 1.3 * k, y - 2 * k], shade(AR_STEEL, -0.25));
  line(ctx, x + 0.3 * k, y - 3.6 * k, x1 - 0.2 * k, y1 + 2 * k, shade(AR_STEEL, -0.45), 0.4 * k); // the fuller
  line(ctx, x - 2.6 * k, y - 1.6 * k, x + 2.8 * k, y - 2.4 * k, AR_GOLD, 1.2 * k); // the cross-guard, its ends turned down
  ellipse(ctx, x - 2.7 * k, y - 1.2 * k, 0.6 * k, 0.8 * k, AR_GOLD_D);
  ellipse(ctx, x + 2.9 * k, y - 2 * k, 0.6 * k, 0.8 * k, AR_GOLD_D);
  line(ctx, x, y - 1.6 * k, x - 0.5 * k, y + 1.6 * k, AR_LEATH_D, 1.5 * k);
  ellipse(ctx, x - 0.6 * k, y + 2 * k, 1.1 * k, 1.1 * k, AR_GOLD);
  ellipse(ctx, x - 0.9 * k, y + 1.7 * k, 0.4 * k, 0.4 * k, '#fff2c0');
}

/** A broad curved blade swept back over the shoulder. */
function curved(ctx: Ctx, x: number, y: number, k: number, size = 1) {
  const s = k * size;
  const p0: [number, number] = [x + 0.4 * s, y - 2.2 * s], c: [number, number] = [x + 0.6 * s, y - 12 * s], p1: [number, number] = [x + 9.4 * s, y - 15.4 * s];
  // the blade widens towards the point and is clipped back at the tip, like a broad sabre
  const back: number[] = [], edge: [number, number][] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10, [px, py] = qpt(p0[0], p0[1], c[0], c[1], p1[0], p1[1], t);
    const [qx, qy] = qpt(p0[0], p0[1], c[0], c[1], p1[0], p1[1], Math.min(1, t + 0.02));
    const [rx, ry] = qpt(p0[0], p0[1], c[0], c[1], p1[0], p1[1], Math.max(0, t - 0.02));
    const dx = qx - rx, dy = qy - ry, l = Math.hypot(dx, dy) || 1, nx = dy / l, ny = -dx / l;
    const wdt = (0.9 + 1.3 * t * t) * s * (t > 0.85 ? 1 - (t - 0.85) * 4 : 1);
    back.push(px - nx * 0.5 * s, py - ny * 0.5 * s);
    edge.push([px + nx * wdt, py + ny * wdt]);
  }
  poly(ctx, [...back, p1[0] + 0.6 * s, p1[1] - 0.6 * s, ...edge.reverse().flat()], AR_STEEL);
  poly(ctx, [...edge.slice(0, 6).flat(), ...edge.slice(0, 6).reverse().flatMap(([ex, ey]) => [ex - 0.8 * s, ey + 0.6 * s])], shade(AR_STEEL, -0.2));
  curve(ctx, p0[0] - 0.4 * s, p0[1], c[0] - 0.4 * s, c[1], p1[0] - 0.2 * s, p1[1] - 0.6 * s, 0.6 * s, '#f6f9fc'); // the bright back
  curve(ctx, p0[0] + 0.5 * s, p0[1] - 1 * s, c[0] + 1 * s, c[1] + 0.4 * s, p1[0] - 1.6 * s, p1[1] + 1.2 * s, 0.4 * s, shade(AR_STEEL, -0.35)); // the fuller
  line(ctx, x - 2.4 * s, y - 1.2 * s, x + 2.4 * s, y - 2.6 * s, AR_GOLD, 1.2 * s);
  line(ctx, x, y - 1.6 * s, x - 0.6 * s, y + 1.8 * s, AR_LEATH_D, 1.5 * s);
  ellipse(ctx, x - 0.7 * s, y + 2.2 * s, 1 * s, 1 * s, AR_GOLD);
  tassel(ctx, x - 0.7 * s, y + 2.6 * s, 3 * s, 1 * s, AR_GREEN);
}

/** A long spear (rumh): a cane shaft with a narrow steel head and a small green pennon. */
function spear(ctx: Ctx, x: number, y: number, k: number, len = 28, pennon = true) {
  const x0 = x - 1.8 * k, y0 = y + 6 * k, x1 = x + 3 * k, y1 = y - (len - 6) * k;
  line(ctx, x0, y0, x1, y1, '#9a7a4a', 1.3 * k);
  line(ctx, x0 - 0.4 * k, y0, x1 - 0.4 * k, y1, '#c8a870', 0.4 * k);
  for (let i = 1; i < 6; i++) { const t = i / 6; line(ctx, x0 + (x1 - x0) * t - 0.7 * k, y0 + (y1 - y0) * t, x0 + (x1 - x0) * t + 0.7 * k, y0 + (y1 - y0) * t - 0.2 * k, '#6a5030', 0.4 * k); } // cane nodes
  poly(ctx, [x1, y1 - 6.4 * k, x1 - 1.2 * k, y1 + 0.2 * k, x1 + 0.2 * k, y1 + 0.8 * k], shade(AR_STEEL, 0.25));
  poly(ctx, [x1, y1 - 6.4 * k, x1 + 1.4 * k, y1 + 0.2 * k, x1 + 0.2 * k, y1 + 0.8 * k], shade(AR_STEEL, -0.25));
  line(ctx, x1 - 0.6 * k, y1 + 1.2 * k, x1 + 0.9 * k, y1 + 0.8 * k, AR_GOLD, 0.8 * k);
  if (pennon) {
    const bx = x1 + 0.3 * k, by = y1 + 2.2 * k;
    poly(ctx, [bx, by, bx + 6.6 * k, by + 1.6 * k, bx + 0.2 * k, by + 4 * k], AR_GREEN_L);
    poly(ctx, [bx, by, bx + 6.6 * k, by + 1.6 * k, bx + 0.2 * k, by + 1.4 * k], shade(AR_GREEN_L, 0.3));
  }
}

/** A composite bow, horn tips recurved, with an arrow on the string. */
function bow(ctx: Ctx, x: number, y: number, k: number) {
  const bx = x - 3.4 * k, top = { x: bx + 2.6 * k, y: y - 13.4 * k }, bot = { x: bx + 2.6 * k, y: y + 10.4 * k }, ctl = { x: bx + 10.4 * k, y: y - 1.4 * k };
  const nock = { x: bx - 3 * k, y: y - 1.4 * k };
  for (const [c, wd, dx] of [[AR_BLACK, 2, 0], ['#a8703a', 1.2, -0.35], ['#e0b878', 0.35, -0.7]] as const) curve(ctx, top.x + dx * k, top.y, ctl.x + dx * k, ctl.y, bot.x + dx * k, bot.y, wd * k, c);
  line(ctx, top.x, top.y, top.x - 1.6 * k, top.y - 2.4 * k, '#f0e6cc', 1.1 * k); // the siyahs, bent forward
  line(ctx, bot.x, bot.y, bot.x - 1.6 * k, bot.y + 2.4 * k, '#f0e6cc', 1.1 * k);
  ctx.strokeStyle = ink('#ece4cc');
  ctx.lineWidth = 0.4 * k;
  ctx.beginPath();
  ctx.moveTo(top.x - 1.6 * k, top.y - 2.4 * k);
  ctx.lineTo(nock.x, nock.y);
  ctx.lineTo(bot.x - 1.6 * k, bot.y + 2.4 * k);
  ctx.stroke();
  line(ctx, x + 0.8 * k, y - 1.8 * k, x + 0.8 * k, y + 0.8 * k, AR_GREEN, 1.6 * k); // the grip wrap
  const tx = x + 9.6 * k, ty = y - 3.2 * k;
  line(ctx, nock.x, nock.y, tx, ty, '#d0b080', 0.7 * k);
  poly(ctx, [tx, ty - 0.9 * k, tx + 2.8 * k, ty + 0.2 * k, tx, ty + 0.9 * k], AR_STEEL);
  for (const t of [0.04, 0.12]) { const px = nock.x + (tx - nock.x) * t, py = nock.y + (ty - nock.y) * t; poly(ctx, [px, py, px + 2.2 * k, py - 1.5 * k, px + 2.6 * k, py - 0.3 * k], t > 0.1 ? AR_GREEN_L : AR_WHITE); }
}

/** A guide's camel stick: a thin cane with a hooked head, and a goatskin water bag. */
function stick(ctx: Ctx, x: number, y: number, k: number) {
  line(ctx, x + 1 * k, y + 6 * k, x + 2.4 * k, y - 14 * k, '#8a6a3a', 1 * k);
  curve(ctx, x + 2.4 * k, y - 14 * k, x + 3 * k, y - 17.4 * k, x + 5.2 * k, y - 15.6 * k, 1 * k, '#8a6a3a');
  ellipse(ctx, x - 0.4 * k, y + 3 * k, 2 * k, 2.6 * k, '#6a4428');
  ellipse(ctx, x - 0.8 * k, y + 2.2 * k, 0.8 * k, 1.2 * k, '#8a5a34');
  line(ctx, x - 0.4 * k, y + 0.4 * k, x + 0.6 * k, y - 1 * k, AR_LEATH_D, 0.5 * k);
}

/** A round darqa: stiff layered leather, a green-painted ring, a tooled eight-pointed star, gilt studs and a steel boss. */
function darqa(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  const big = kind === 'defender' || kind === 'giant';
  const cx = x - 1.2 * k, cy = y - 5.4 * k, rx = (big ? 6.2 : 5) * k, ry = (big ? 6.6 : 5.4) * k;
  const face = kind === 'giant' ? AR_GREEN : kind === 'swordsman' || kind === 'knight' ? '#b8864a' : '#a8743c';
  ellipse(ctx, cx + 0.8 * k, cy + 0.6 * k, rx, ry, AR_LEATH_D); // its thickness
  ellipse(ctx, cx, cy, rx, ry, shade(face, -0.15));
  ellipse(ctx, cx, cy, rx * 0.9, ry * 0.9, face);
  ring(ctx, cx, cy, rx * 0.78, ry * 0.78, kind === 'giant' ? AR_GOLD : AR_GREEN, 1 * k);
  star8(ctx, cx, cy, rx * 0.56, ry * 0.56, kind === 'giant' ? AR_GOLD : shade(face, 0.22));
  star8(ctx, cx, cy, rx * 0.4, ry * 0.4, kind === 'giant' ? AR_GREEN_D : shade(face, -0.12));
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; ellipse(ctx, cx + Math.cos(a) * rx * 0.9, cy + Math.sin(a) * ry * 0.9, 0.45 * k, 0.45 * k, AR_GOLD); }
  ellipse(ctx, cx, cy, 1.7 * k, 1.8 * k, shade(AR_STEEL, -0.25));
  ellipse(ctx, cx, cy, 1.3 * k, 1.4 * k, AR_STEEL);
  ellipse(ctx, cx - 0.4 * k, cy - 0.5 * k, 0.45 * k, 0.45 * k, '#ffffff');
  ellipse(ctx, cx - rx * 0.4, cy - ry * 0.5, rx * 0.18, ry * 0.26, 'rgba(255,255,255,0.18)');
  if (kind === 'warrior' || kind === 'camelrider') tassel(ctx, cx + rx * 0.2, cy + ry * 0.9, 2.6 * k, 0.9 * k, AR_RED);
}

function weapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  switch (kind) {
    case 'warrior':
      curved(ctx, x, y, k, 0.9);
      darqa(ctx, kind, b.off.x, b.off.y, k);
      return true;
    case 'archer':
      bow(ctx, x, y, k);
      return true;
    case 'defender': // the shield is drawn afterwards, like everyone's
      spear(ctx, x, y, k);
      return true;
    case 'swordsman':
      sayf(ctx, x, y, k);
      darqa(ctx, kind, b.off.x, b.off.y, k);
      return true;
    case 'giant':
      curved(ctx, x, y, k, 1.3);
      darqa(ctx, kind, b.off.x, b.off.y, k);
      return true;
    case 'explorer':
      stick(ctx, x, y, k);
      return true;
  }
  return false;
}

function shield(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number): boolean {
  darqa(ctx, kind, x, y, k);
  return true;
}

// ---------------------------------------------------------------- the dromedary and the Camel Rider

/** One long camel leg: thigh, knobbly knee, thin shank and a broad splayed pad. */
function camelLeg(ctx: Ctx, x: number, y: number, k: number, c: string, far: boolean) {
  const leg = far ? shade(c, -0.3) : shade(c, -0.06);
  box(ctx, x, y - 6 * k, 3 * k, 6.4 * k, leg); // the upper leg
  box(ctx, x + 0.2 * k, y, 1.5 * k, 6.4 * k, shade(leg, -0.06)); // the shank
  ellipse(ctx, x + 0.2 * k, y - 6.2 * k, 1.4 * k, 1.2 * k, shade(leg, 0.1)); // the knobbly knee
  ellipse(ctx, x + 0.2 * k, y - 6 * k, 0.9 * k, 0.6 * k, shade(leg, -0.25)); // its calloused pad
  ellipse(ctx, x + 0.4 * k, y + 0.6 * k, 1.7 * k, 0.8 * k, shade(leg, -0.3)); // the foot pad
}

/** A dromedary facing right: long knobbly legs, a high round hump, a long curved neck, a fringed saddle cloth and a
 *  tasselled halter. The saddle sits on the rump behind the hump. Returns where the rider sits. */
export function dromedary(ctx: Ctx, x: number, y: number, k: number, coat: string, cloth = AR_GREEN, rich = false) {
  const dark = shade(coat, -0.2);
  // the far legs
  camelLeg(ctx, x - 5 * k, y - 1.4 * k, k, coat, true);
  camelLeg(ctx, x + 5.8 * k, y - 1.2 * k, k, coat, true);
  // the tail with a dark tuft
  curve(ctx, x - 8.6 * k, y - 18 * k, x - 10 * k, y - 15 * k, x - 9.6 * k, y - 11.6 * k, 0.9 * k, dark);
  ellipse(ctx, x - 9.6 * k, y - 11.2 * k, 0.7 * k, 1.2 * k, shade(coat, -0.45));
  // the body: deep chest, tucked belly, a rump falling away behind
  box(ctx, x, y - 13 * k, 16 * k, 6.4 * k, coat);
  band(ctx, x, y - 13 * k, 16 * k, 6.4 * k, 0, 0.2, shade(coat, -0.28)); // the belly in shadow
  faceQuad(ctx, 'R', x, y - 13 * k, 16 * k, 6.4 * k, 0.62, 1, 0.2, 0.9, shade(coat, 0.06)); // the shoulder
  ellipse(ctx, x + 5.4 * k, y - 12 * k, 2.2 * k, 1.4 * k, shade(coat, -0.14)); // the chest pad
  // the hump: high and round, rising in front of the saddle
  const hx = x + 1.6 * k, hy = y - 19.6 * k;
  ellipse(ctx, hx, hy + 1.6 * k, 6.4 * k, 5 * k, shade(coat, -0.1));
  ellipse(ctx, hx - 0.4 * k, hy, 5.6 * k, 5.6 * k, coat);
  ellipse(ctx, hx - 1.8 * k, hy - 2 * k, 3 * k, 2.6 * k, shade(coat, 0.14));
  ellipse(ctx, hx + 2.4 * k, hy + 1.4 * k, 2.6 * k, 3 * k, shade(coat, -0.08));
  // the saddle cloth on the rump, down the flank: stripes, woven diamonds and a fringe of tassels
  const sx = x - 4.4 * k, sy = y - 20 * k, cy0 = sy + 1.4 * k;
  poly(ctx, [sx - 4.6 * k, cy0, sx + 4.8 * k, cy0 - 0.6 * k, sx + 5.2 * k, cy0 + 7.6 * k, sx + 0.2 * k, cy0 + 9.4 * k, sx - 4.2 * k, cy0 + 8.2 * k], cloth);
  poly(ctx, [sx - 4.6 * k, cy0, sx - 2.6 * k, cy0, sx - 2.2 * k, cy0 + 8.8 * k, sx - 4.2 * k, cy0 + 8.2 * k], shade(cloth, -0.18));
  for (const [t, c] of [[0.5, rich ? AR_GOLD : AR_WHITE], [0.68, AR_RED], [0.84, rich ? AR_GOLD : AR_WHITE]] as const) {
    line(ctx, sx - 4.4 * k, cy0 + 8 * k * t, sx + 0.2 * k, cy0 + 9.2 * k * t, c, 0.8 * k);
    line(ctx, sx + 0.2 * k, cy0 + 9.2 * k * t, sx + 5 * k, cy0 - 0.6 * k + 8 * k * t, c, 0.8 * k);
  }
  for (const [ax, ay] of [[-2.4, 3], [0.2, 3.8], [2.8, 2.8]] as const) { // little diamonds woven in
    poly(ctx, [sx + ax * k, cy0 + (ay - 1) * k, sx + (ax + 0.9) * k, cy0 + ay * k, sx + ax * k, cy0 + (ay + 1) * k, sx + (ax - 0.9) * k, cy0 + ay * k], AR_GOLD);
  }
  for (let i = 0; i < 9; i++) { // the fringe
    const t = i / 8;
    const [fx, fy] = t < 0.5 ? [sx - 4.2 * k + 4.4 * k * t * 2, cy0 + 8.2 * k + 1.2 * k * t * 2] : [sx + 0.2 * k + 5 * k * (t - 0.5) * 2, cy0 + 9.4 * k - 1.8 * k * (t - 0.5) * 2];
    line(ctx, fx, fy, fx + 0.2 * k, fy + 2.2 * k, i % 2 ? AR_RED : AR_GOLD, 0.6 * k);
    if (i % 2 === 0) ellipse(ctx, fx + 0.2 * k, fy + 2.4 * k, 0.5 * k, 0.5 * k, i % 4 ? AR_RED : AR_GOLD);
  }
  line(ctx, sx + 4 * k, cy0 + 7.6 * k, sx + 4.4 * k, y - 8.6 * k, AR_LEATH_D, 0.8 * k); // the girth under the belly
  // the saddle: a wooden frame with tall pommel and cantle posts over a sheepskin
  ellipse(ctx, sx, sy + 0.8 * k, 4.2 * k, 1.8 * k, '#efe6d0');
  for (let i = 0; i < 5; i++) line(ctx, sx - 3.4 * k + i * 1.6 * k, sy + 1.8 * k, sx - 3.2 * k + i * 1.6 * k, sy + 2.8 * k, '#d8ccb0', 0.6 * k); // the fleece edge
  line(ctx, sx + 3 * k, sy + 1 * k, sx + 3.4 * k, sy - 2.8 * k, AR_WOOD, 1.1 * k);
  line(ctx, sx - 3.2 * k, sy + 1.2 * k, sx - 3.6 * k, sy - 2.6 * k, AR_WOOD, 1.1 * k);
  ellipse(ctx, sx + 3.4 * k, sy - 3 * k, 0.8 * k, 0.8 * k, AR_GOLD);
  ellipse(ctx, sx - 3.6 * k, sy - 2.8 * k, 0.8 * k, 0.8 * k, AR_GOLD);
  // striped saddle bags hanging at the rump
  box(ctx, x - 8 * k, y - 12.4 * k, 3 * k, 4.6 * k, '#8a3a2a');
  band(ctx, x - 8 * k, y - 12.4 * k, 3 * k, 4.6 * k, 0.4, 0.55, AR_GOLD);
  for (let i = 0; i < 3; i++) line(ctx, x - 9 * k + i * 0.8 * k, y - 12.2 * k, x - 9 * k + i * 0.8 * k, y - 10.4 * k, AR_RED, 0.5 * k);
  // the near legs
  camelLeg(ctx, x - 2.8 * k, y + 0.4 * k, k, coat, false);
  camelLeg(ctx, x + 7.8 * k, y + 0.6 * k, k, coat, false);
  // the long neck: down from the chest and curving up to the head
  const n0: [number, number] = [x + 6.6 * k, y - 16 * k], nc: [number, number] = [x + 14.4 * k, y - 12.4 * k], n1: [number, number] = [x + 15.4 * k, y - 26.4 * k];
  curve(ctx, n0[0], n0[1] + 1.2 * k, nc[0], nc[1] + 1.6 * k, n1[0] + 0.6 * k, n1[1], 4.8 * k, shade(coat, -0.16));
  curve(ctx, n0[0], n0[1], nc[0], nc[1], n1[0], n1[1], 4 * k, coat);
  curve(ctx, n0[0] - 0.4 * k, n0[1] - 1.2 * k, nc[0] - 1.6 * k, nc[1] - 1.8 * k, n1[0] - 1.4 * k, n1[1] + 0.4 * k, 1 * k, shade(coat, 0.14)); // the lit crest
  // the head: long, a heavy-lidded eye, small ears and a drooping lip
  const ex = x + 17.4 * k, ey = y - 26.6 * k;
  box(ctx, ex, ey, 4.2 * k, 3.6 * k, coat, shade(coat, 0.1));
  box(ctx, ex + 3 * k, ey + 1.2 * k, 4 * k, 2.6 * k, shade(coat, 0.04), shade(coat, 0.14)); // the muzzle
  poly(ctx, [ex + 3 * k, ey + 2.8 * k, ex + 5.2 * k, ey + 2.6 * k, ex + 4.4 * k, ey + 4.2 * k, ex + 2.6 * k, ey + 3.8 * k], shade(coat, -0.2)); // the drooping lower lip
  ellipse(ctx, ex + 4.8 * k, ey - 0.4 * k, 0.5 * k, 0.35 * k, AR_BLACK); // nostril
  ellipse(ctx, ex + 0.4 * k, ey - 2.4 * k, 0.8 * k, 0.65 * k, AR_BLACK); // eye
  ellipse(ctx, ex + 0.2 * k, ey - 2.6 * k, 0.25 * k, 0.25 * k, '#ffffff');
  line(ctx, ex - 0.6 * k, ey - 3.1 * k, ex + 1.4 * k, ey - 3.1 * k, shade(coat, -0.32), 0.6 * k); // the heavy lid
  poly(ctx, [ex - 1.8 * k, ey - 3.4 * k, ex - 1.6 * k, ey - 5.4 * k, ex - 0.8 * k, ey - 3.6 * k], shade(coat, -0.2)); // ears
  poly(ctx, [ex - 0.6 * k, ey - 3.6 * k, ex - 0.2 * k, ey - 5.4 * k, ex + 0.4 * k, ey - 3.6 * k], shade(coat, -0.05));
  // the halter: a red head-stall hung with tassels and a lead rope back to the saddle
  line(ctx, ex + 1.6 * k, ey - 3.8 * k, ex + 1.6 * k, ey + 0.8 * k, AR_RED, 0.8 * k);
  line(ctx, ex + 1.6 * k, ey - 1.2 * k, ex + 5.2 * k, ey - 1.2 * k, AR_RED, 0.8 * k);
  tassel(ctx, ex + 1.6 * k, ey + 0.8 * k, 3 * k, 1 * k, AR_RED);
  if (rich) tassel(ctx, ex - 1.2 * k, ey + 1.4 * k, 3.4 * k, 1 * k, AR_GOLD);
  for (let i = 0; i < 5; i++) { const [px, py] = qpt(n0[0], n0[1], nc[0], nc[1], n1[0], n1[1], 0.4 + i * 0.03); ellipse(ctx, px + 1.6 * k, py + 1.2 * k - i * 0.1 * k, 0.55 * k, 0.55 * k, i % 2 ? AR_GREEN_L : '#3aa0c8'); } // a bead collar
  ctx.strokeStyle = ink(AR_RED);
  ctx.lineWidth = 0.5 * k;
  ctx.beginPath();
  ctx.moveTo(ex + 1.6 * k, ey + 0.6 * k);
  ctx.quadraticCurveTo(x + 8 * k, y - 15 * k, sx + 3.4 * k, sy - 1 * k);
  ctx.stroke();
  return { x: sx, y: sy + 0.2 * k };
}

/** The Camel Rider: a veiled desert rider on his dromedary with a long lance, a darqa and a sword at the saddle. */
function camelRider(ctx: Ctx, x: number, y: number) {
  const seat = dromedary(ctx, x - 3, y + 2, 1.06, '#c8955a');
  // a sword in its scabbard slung from the saddle
  line(ctx, seat.x - 3, seat.y + 3, seat.x - 7.4, seat.y + 11, AR_BLACK, 1.4);
  line(ctx, seat.x - 3.2, seat.y + 2.8, seat.x - 7, seat.y + 10.4, AR_GOLD, 0.4);
  const b = figure(ctx, 'camelrider', 'arabia', seat.x, seat.y, 0.76, true);
  darqa(ctx, 'camelrider', b.off.x - 1.2, b.off.y + 1.6, 0.6);
  // a long lance held high, a green pennon at its head
  const hx = b.hand.x, hy = b.hand.y;
  line(ctx, hx - 3.4, hy + 7, hx + 9.4, hy - 25, '#9a7a4a', 1.4);
  line(ctx, hx - 3.8, hy + 7, hx + 9, hy - 25, '#c8a870', 0.4);
  poly(ctx, [hx + 10.6, hy - 31.4, hx + 8.4, hy - 25.4, hx + 9.8, hy - 24.6], shade(AR_STEEL, 0.25));
  poly(ctx, [hx + 10.6, hy - 31.4, hx + 10.8, hy - 24.4, hx + 9.8, hy - 24.6], shade(AR_STEEL, -0.25));
  poly(ctx, [hx + 8.8, hy - 22.6, hx + 16.4, hy - 20.4, hx + 13, hy - 18.8, hx + 15.6, hy - 16.6, hx + 8.2, hy - 18.4], AR_GREEN_L);
  poly(ctx, [hx + 8.8, hy - 22.6, hx + 16.4, hy - 20.4, hx + 15.6, hy - 19.6, hx + 8.6, hy - 21.4], AR_WHITE);
  ellipse(ctx, hx - 0.2, hy + 0.2, 1.2, 1.2, shade('#c48c58', -0.1)); // the fist over the shaft
}

// ---------------------------------------------------------------- horsemen

/** Arabian horse gear over drawHorse: a tasselled breast collar, a fringed green saddle cloth, a plume and a quilted caparison for the knight. */
function horseGear(ctx: Ctx, knight: boolean, x: number, y: number, saddle: { x: number; y: number }) {
  const hx0 = x - 1, hy0 = y + 3, kh = 0.95;
  const sx = saddle.x, sy = saddle.y;
  if (!knight) { // a green saddle cloth with a gold border and a fringe
    poly(ctx, [sx - 6.2, sy - 0.8, sx + 3.8, sy - 0.8, sx + 3.4, sy + 6.4, sx - 1.2, sy + 5.2, sx - 5.6, sy + 7.4], AR_GREEN);
    line(ctx, sx - 5.6, sy + 7.2, sx - 1.2, sy + 5, AR_GOLD, 0.9);
    line(ctx, sx - 1.2, sy + 5, sx + 3.4, sy + 6.2, AR_GOLD, 0.9);
    star8(ctx, sx - 1.2, sy + 2.6, 1.6, 1.2, AR_GOLD);
    for (let i = 0; i < 6; i++) line(ctx, sx - 5.2 + i * 1.6, sy + 7.2 - (i < 3 ? i * 0.7 : (5 - i) * 0.4 + 0.4), sx - 5.2 + i * 1.6, sy + 8.8 - (i < 3 ? i * 0.7 : (5 - i) * 0.4 + 0.4), i % 2 ? AR_RED : AR_GOLD, 0.6);
  } else { // a long quilted caparison in white and green
    const bx = hx0, by = hy0 - 6 * kh, bw = 17 * kh, bh = 7 * kh;
    for (const f of ['L', 'R'] as const) {
      faceQuad(ctx, f, bx, by, bw, bh, 0, 1, -0.2, 0.95, AR_WHITE);
      for (let i = 0; i < 6; i++) faceQuad(ctx, f, bx, by, bw, bh, i / 6 + 0.02, i / 6 + 0.1, -0.2, 0.95, AR_GREEN);
      faceQuad(ctx, f, bx, by, bw, bh, 0, 1, -0.2, -0.08, AR_GOLD);
    }
  }
  // the breast collar with tassels
  line(ctx, x + 3.5, y - 9.6, x + 8, y - 3.4, AR_RED, 1.2);
  for (let i = 0; i < 3; i++) { const t = (i + 0.5) / 3; tassel(ctx, x + 3.5 + 4.5 * t, y - 9.6 + 6.2 * t + 0.6, 2.6, 0.9, i % 2 ? AR_GREEN_L : AR_RED); }
  // a plume between the ears and a beaded browband
  const hhx = hx0 + 10.5 * kh, hhy = hy0 - 15 * kh;
  ellipse(ctx, hhx + 0.4, hhy - 4.6, 1.1, 1.1, AR_GOLD);
  for (let i = -1; i <= 1; i++) curve(ctx, hhx + 0.4, hhy - 5, hhx + i * 1.2 - 0.6, hhy - 8.6, hhx + i * 1.6 - 2.4, hhy - 10.8, 0.9, i ? AR_WHITE : AR_GREEN_L);
  if (knight) { // a steel chamfron
    faceQuad(ctx, 'R', hhx, hhy, 7 * kh, 5 * kh, 0.08, 0.72, 0.3, 0.98, AR_STEEL);
    faceQuad(ctx, 'R', hhx, hhy, 7 * kh, 5 * kh, 0.36, 0.46, 0.3, 0.98, AR_GOLD);
  }
}

/** A horseman: a light rider with a lance, a mailed faris with lance and darqa, or a horse archer. */
function horseman(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  const knight = kind === 'knight';
  const coat = knight ? '#e9e5dc' : kind === 'horsearcher' ? '#3a2a22' : '#9a5a2c'; // a grey Arabian, a black, a chestnut
  const saddle = drawHorse(ctx, x - 1, y + 3, 0.95, coat, knight ? '#c8c4bc' : '#1a120c', undefined, AR_GREEN);
  horseGear(ctx, knight, x, y, saddle);
  const body = knight ? 'knight' : kind === 'horsearcher' ? 'archer' : 'rider';
  const b = figure(ctx, body, 'arabia', saddle.x, saddle.y, 0.9, true);
  if (kind === 'horsearcher') return bow(ctx, b.hand.x, b.hand.y, 0.9);
  darqa(ctx, knight ? 'knight' : 'warrior', b.off.x - 1.5, b.off.y + 1.5, 0.66);
  spear(ctx, b.hand.x, b.hand.y, 0.95, knight ? 32 : 29, true);
}

// ---------------------------------------------------------------- the mangonel

/** A traction mangonel (manjaniq) on a timber base: an A-frame, a long beam with a sling, pulling ropes, stones and naphtha pots. */
function mangonel(ctx: Ctx, x: number, y: number) {
  const W = AR_WOOD, Wd = AR_WOOD_D;
  // round stones and two clay naphtha pots, one alight
  for (const [ax, ay, ar] of [[14, 5, 2.1], [17.2, 6.2, 1.8], [15.6, 2.8, 1.7]] as const) {
    ellipse(ctx, x + ax, y + ay, ar, ar * 0.86, '#9a8a72');
    ellipse(ctx, x + ax - ar * 0.3, y + ay - ar * 0.3, ar * 0.45, ar * 0.35, '#c8b8a0');
  }
  for (const [px, py, lit] of [[-17, 5.6, false], [-13.4, 7, true]] as const) {
    ellipse(ctx, x + px, y + py, 2.2, 2.6, '#b0683a');
    ellipse(ctx, x + px - 0.6, y + py - 0.8, 0.8, 1.2, '#d08a50');
    box(ctx, x + px, y + py - 2.2, 1.6, 1, '#8a4a2a');
    if (lit) { poly(ctx, [x + px - 1, y + py - 3.2, x + px, y + py - 7.4, x + px + 1.2, y + py - 3.2], '#ffb02e'); poly(ctx, [x + px - 0.4, y + py - 3.2, x + px + 0.1, y + py - 5.6, x + px + 0.6, y + py - 3.2], '#fff0a0'); }
  }
  // the base: a timber frame on four small solid wheels
  for (const [wx, wy] of [[-10, 6], [8, 6.6]] as const) { ellipse(ctx, x + wx, y + wy, 3, 3, Wd); ellipse(ctx, x + wx - 0.4, y + wy - 0.3, 2.2, 2.2, W); ellipse(ctx, x + wx - 0.4, y + wy - 0.3, 0.7, 0.7, AR_STEEL); }
  box(ctx, x - 1, y + 2.6, 26, 2.6, W, shade(W, 0.25));
  band(ctx, x - 1, y + 2.6, 26, 2.6, 0.3, 0.7, AR_GREEN);
  // the A-frame towers either side, braced
  const A: [number, number] = [x + 1, y - 24];
  for (const [bx, by] of [[x - 8, y - 0.6], [x + 10, y - 0.6]] as const) {
    line(ctx, bx, by, A[0] + (bx < x ? -1.8 : 1.8), A[1], Wd, 2.6);
    line(ctx, bx - 0.5, by, A[0] + (bx < x ? -1.8 : 1.8) - 0.5, A[1], W, 1.5);
  }
  for (const [bx, by] of [[x - 4, y + 3], [x + 6, y + 3.4]] as const) line(ctx, bx, by, A[0], A[1] + 2, Wd, 1.6);
  line(ctx, x - 6.2, y - 8, x + 8.2, y - 9, Wd, 1.3);
  line(ctx, x - 4.4, y - 15.6, x + 6.4, y - 16.4, Wd, 1.2);
  // the axle and the throwing beam, cocked back with the sling hanging from its tip
  line(ctx, A[0] - 4, A[1] + 0.4, A[0] + 4.2, A[1] - 0.4, Wd, 2.2);
  const tip: [number, number] = [x - 16, y - 40], pull: [number, number] = [x + 9, y - 16];
  line(ctx, A[0] + 1, A[1] - 0.6, tip[0], tip[1], Wd, 3);
  line(ctx, A[0] + 0.8, A[1] - 1.2, tip[0] + 0.4, tip[1] - 0.4, W, 1.8);
  line(ctx, A[0] + 1, A[1], pull[0], pull[1], Wd, 2.6);
  for (const t of [0.3, 0.5, 0.7]) { const px = A[0] + (tip[0] - A[0]) * t, py = A[1] + (tip[1] - A[1]) * t; line(ctx, px - 1.1, py + 0.6, px + 1.1, py - 0.6, t === 0.5 ? AR_GOLD : AR_GREEN, 1); } // painted bands
  // pulling ropes down to a row of hand-loops
  for (let i = 0; i < 6; i++) {
    const px = pull[0] - 1.2 + i * 0.6, ex = x + 2 + i * 3.4, ey = y + 1.4 + (i % 2) * 1.6;
    curve(ctx, px, pull[1] + 0.6, (px + ex) / 2 + 1, (pull[1] + ey) / 2 - 1, ex, ey, 0.6, i % 2 ? '#b8a070' : '#d8c090');
    ring(ctx, ex, ey + 0.6, 0.8, 0.5, '#d8c090', 0.4);
  }
  const pouch: [number, number] = [x - 14, y - 1.6];
  curve(ctx, tip[0], tip[1], tip[0] - 4, (tip[1] + pouch[1]) / 2, pouch[0] - 2.2, pouch[1] - 1, 0.55, '#c8b080');
  curve(ctx, tip[0], tip[1], tip[0] + 4.6, (tip[1] + pouch[1]) / 2, pouch[0] + 2.6, pouch[1] - 1, 0.55, '#c8b080');
  ellipse(ctx, pouch[0], pouch[1] + 0.4, 3.4, 2, AR_LEATH_D);
  ellipse(ctx, pouch[0], pouch[1], 3.1, 1.8, AR_LEATH);
  ellipse(ctx, pouch[0], pouch[1] - 0.8, 1.7, 1.4, '#9a8a72');
  ellipse(ctx, tip[0], tip[1], 1.3, 1.3, AR_STEEL);
  // a green banner on a pole above the frame
  line(ctx, A[0] + 3.2, A[1] - 1, A[0] + 3.6, A[1] - 13, Wd, 0.9);
  poly(ctx, [A[0] + 3.6, A[1] - 13, A[0] + 11.4, A[1] - 11.4, A[0] + 3.6, A[1] - 8], AR_GREEN_L);
  poly(ctx, [A[0] + 3.6, A[1] - 13, A[0] + 11.4, A[1] - 11.4, A[0] + 3.6, A[1] - 11.6], shade(AR_GREEN_L, 0.3));
  // a gunner in a keffiyeh hauling on the ropes
  const b = figure(ctx, 'warrior', 'arabia', x + 19, y + 5, 0.52);
  line(ctx, b.hand.x, b.hand.y, x + 11, y + 2, '#d8c090', 0.6);
}

// ---------------------------------------------------------------- dhows

/** A lateen sail on a long slanted yard: low at the bow, high at the stern, bellied out. */
function lateen(ctx: Ctx, mx: number, my: number, h: number, span: number, cloth: string, stripe: string | null) {
  const mastTop: [number, number] = [mx, my - h];
  const fore: [number, number] = [mx + span * 0.55, my - h * 0.28], peak: [number, number] = [mx - span * 0.45, my - h * 1.08];
  const clew: [number, number] = [mx - span * 0.32, my - 2];
  line(ctx, mx, my, mastTop[0], mastTop[1], AR_WOOD_D, 1.3); // the mast, raked forward a touch
  // the sail: a triangle from the yard down to the clew, its belly curved
  ctx.beginPath();
  ctx.moveTo(fore[0], fore[1]);
  ctx.lineTo(peak[0], peak[1]);
  ctx.quadraticCurveTo(peak[0] + span * 0.02, (peak[1] + clew[1]) / 2, clew[0], clew[1]);
  ctx.quadraticCurveTo((clew[0] + fore[0]) / 2 + span * 0.08, (clew[1] + fore[1]) / 2 + h * 0.08, fore[0], fore[1]);
  ctx.closePath();
  ctx.fillStyle = ink(cloth);
  ctx.fill();
  // the shaded belly near the leech
  poly(ctx, [peak[0], peak[1], peak[0] + span * 0.12, peak[1] + h * 0.18, clew[0] + span * 0.06, clew[1] - h * 0.06, clew[0], clew[1]], shade(cloth, -0.14));
  for (let i = 1; i < 4; i++) { // seams fanning from the yard
    const t = i / 4;
    const [ax, ay] = [fore[0] + (peak[0] - fore[0]) * t, fore[1] + (peak[1] - fore[1]) * t];
    line(ctx, ax, ay, clew[0] + (fore[0] - clew[0]) * (1 - t) * 0.4, clew[1] - (1 - t) * 1.4, shade(cloth, -0.1), 0.35);
  }
  if (stripe) { // a band of colour along the foot
    ctx.strokeStyle = ink(stripe);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(clew[0] + 1, clew[1] - 1.2);
    ctx.quadraticCurveTo((clew[0] + fore[0]) / 2 + span * 0.08, (clew[1] + fore[1]) / 2 + h * 0.08 - 1.2, fore[0] - 1, fore[1] + 0.6);
    ctx.stroke();
  }
  line(ctx, fore[0] + 1.4, fore[1] + 0.8, peak[0] - 1.6, peak[1] - 0.9, AR_WOOD, 1.1); // the yard
  line(ctx, clew[0], clew[1], clew[0] - 2, my + 1, '#b8a070', 0.4); // the sheet
  line(ctx, fore[0] + 1.4, fore[1] + 0.8, fore[0] + 3, my - 1, '#b8a070', 0.4); // the tack line to the bow
  return { peak, fore };
}

/** A dhow hull of teak: a long raking bow, a raised square stern, a white-painted strake and a green band. */
function dhowHull(ctx: Ctx, x: number, y: number, len: number, high: number) {
  const bow: [number, number] = [x + len * 0.62, y - 8 - high * 0.2], stern: [number, number] = [x - len * 0.5, y - 6 - high];
  const dk = (t: number) => y - 4.6 - (t < 0 ? -t * high : t * t * 3.4); // the sheer line rises to both ends
  // the far gunwale, seen over the deck
  poly(ctx, [stern[0] + 1.6, stern[1] - 1.6, bow[0] - 2, bow[1] - 1.2, x + len * 0.3, dk(0.6) - 2.4, x, dk(0) - 2.4, x - len * 0.4, dk(-0.8) - 2.4], '#3a2410');
  poly(ctx, [x - len * 0.42, dk(-0.84) - 1.2, x + len * 0.42, dk(0.84) - 1.2, x + len * 0.4, dk(0.8) + 0.2, x - len * 0.4, dk(-0.8) + 0.2], '#c8a06a'); // the deck
  return { bow, stern, dk };
}
function dhowSide(ctx: Ctx, x: number, y: number, len: number, high: number, band2: string) {
  const bow: [number, number] = [x + len * 0.62, y - 8 - high * 0.2], stern: [number, number] = [x - len * 0.5, y - 6 - high];
  const top: number[] = [];
  for (let i = 0; i <= 10; i++) { const t = -1 + i * 0.2; top.push(x + t * len * 0.5, y - 4.6 - (t < 0 ? -t * high : t * t * 3.4)); }
  const hull = [stern[0], stern[1], ...top, bow[0], bow[1], x + len * 0.42, y - 1.2, x + len * 0.2, y + 2.4, x - len * 0.2, y + 2.8, x - len * 0.44, y + 0.6, stern[0] + 1, y - 2];
  poly(ctx, hull, AR_TEAK);
  poly(ctx, [x - len * 0.44, y + 0.6, x - len * 0.2, y + 2.8, x + len * 0.2, y + 2.4, x + len * 0.42, y - 1.2, x + len * 0.2, y, x - len * 0.2, y + 0.4], shade(AR_TEAK, -0.35)); // the bilge in shadow
  ctx.strokeStyle = ink(AR_WHITE); // the white-washed upper strake
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < top.length; i += 2) (i ? ctx.lineTo(top[i], top[i + 1] + 1.6) : ctx.moveTo(top[i], top[i + 1] + 1.6));
  ctx.stroke();
  ctx.strokeStyle = ink(band2);
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  for (let i = 0; i < top.length; i += 2) (i ? ctx.lineTo(top[i], top[i + 1] + 3) : ctx.moveTo(top[i], top[i + 1] + 3));
  ctx.stroke();
  for (let i = 1; i < 6; i++) { const px = x - len * 0.4 + i * len * 0.14; line(ctx, px, y - 3, px - 0.4, y + 1.6, shade(AR_TEAK, -0.25), 0.35); } // plank seams
  // the stern: a raised square transom with a carved green panel; the bow a long stem head
  poly(ctx, [stern[0] - 1, stern[1] - 1, stern[0] + 3, stern[1] - 0.6, stern[0] + 3.4, y - 2, stern[0] - 0.6, y - 3], shade(AR_TEAK, -0.12));
  poly(ctx, [stern[0] - 0.2, stern[1] + 1, stern[0] + 2.4, stern[1] + 1.2, stern[0] + 2.6, stern[1] + 4, stern[0], stern[1] + 3.6], AR_GREEN);
  ellipse(ctx, stern[0] + 1.2, stern[1] + 2.4, 0.6, 0.6, AR_GOLD);
  line(ctx, bow[0] - 1, bow[1] + 1, bow[0] + 3.4, bow[1] - 3, AR_TEAK, 1.6);
  ellipse(ctx, bow[0] + 3.6, bow[1] - 3.2, 0.8, 0.8, AR_GOLD);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; // foam at the waterline
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - len * 0.44, y + 1.2);
  ctx.quadraticCurveTo(x, y + 4.4, x + len * 0.42, y - 0.4);
  ctx.stroke();
}

function dhow(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  const crew = (cx: number, cy: number, kd: UnitKind, kk: number) => figure(ctx, kd, 'arabia', cx, cy, kk, true);
  if (kind === 'boat') { // a small sambuk: one lateen sail, a helmsman and a bale of goods
    const len = 34;
    const h = dhowHull(ctx, x, y, len, 4);
    lateen(ctx, x + 2, h.dk(0) - 1, 24, 30, AR_WHITE, AR_GREEN_L);
    box(ctx, x + 8, y - 6, 4, 3, '#c8a870', '#dcc090');
    crew(x - 9, y - 4.4, 'explorer', 0.46);
    dhowSide(ctx, x, y, len, 4, AR_GREEN);
    line(ctx, x - len * 0.5, y - 9, x - len * 0.56, y - 1, AR_WOOD_D, 1); // the rudder
    return;
  }
  if (kind === 'ship') { // a baghlah: two lateen sails, a cargo of bales and jars
    const len = 46;
    const h = dhowHull(ctx, x, y, len, 6);
    for (const [bx, c] of [[10, '#c8a870'], [13.6, '#b07a4a']] as const) box(ctx, x + bx, y - 6, 3.6, 3, c, shade(c, 0.2));
    for (const jx of [-4, -1.4]) { ellipse(ctx, x + jx, y - 7, 1.4, 1.9, '#b0683a'); ellipse(ctx, x + jx, y - 8.8, 0.8, 0.4, '#8a4a2a'); }
    lateen(ctx, x - 9, h.dk(-0.3) - 1, 22, 26, AR_CREAM, null);
    lateen(ctx, x + 6, h.dk(0.2) - 1, 30, 36, AR_WHITE, AR_GREEN_L);
    crew(x - 15, y - 5.6, 'archer', 0.44);
    crew(x + 2, y - 4.6, 'warrior', 0.44);
    dhowSide(ctx, x, y, len, 6, AR_GREEN);
    line(ctx, x - len * 0.5, y - 12, x - len * 0.56, y - 1, AR_WOOD_D, 1.1);
    return;
  }
  // the war dhow: two big lateen sails striped in green, a fighting deck at the stern, archers and lancers, shields on the rail
  const len = 52;
  const h = dhowHull(ctx, x, y, len, 8);
  lateen(ctx, x - 10, h.dk(-0.35) - 1, 26, 30, AR_WHITE, AR_GREEN);
  const s = lateen(ctx, x + 7, h.dk(0.2) - 1, 34, 40, AR_WHITE, AR_GREEN);
  // green stripes down the main sail and a pennant at the peak
  for (const t of [0.35, 0.6]) {
    const ax = s.fore[0] + (s.peak[0] - s.fore[0]) * t, ay = s.fore[1] + (s.peak[1] - s.fore[1]) * t;
    line(ctx, ax, ay + 1, ax - 2 + t * 4, y - 9, 'rgba(47,143,42,0.55)', 1.6);
  }
  poly(ctx, [s.peak[0] - 1.4, s.peak[1] - 0.8, s.peak[0] - 9, s.peak[1] - 0.4, s.peak[0] - 1.6, s.peak[1] + 2], AR_GREEN_L);
  crew(x - 20, y - 8.6, 'archer', 0.44);
  crew(x - 2, y - 4.8, 'swordsman', 0.44);
  crew(x + 14, y - 4.6, 'defender', 0.44);
  dhowSide(ctx, x, y, len, 8, AR_GREEN);
  for (let i = 0; i < 5; i++) { // round shields hung along the rail
    const px = x - 12 + i * 7, py = y - 4.4 + Math.pow((px - x) / (len * 0.5), 2) * -3.4;
    ellipse(ctx, px, py, 2, 2, AR_LEATH_D);
    ellipse(ctx, px - 0.2, py - 0.2, 1.7, 1.7, i % 2 ? '#a8743c' : AR_GREEN);
    ellipse(ctx, px - 0.2, py - 0.2, 0.5, 0.5, AR_STEEL);
  }
  line(ctx, x - len * 0.5, y - 15, x - len * 0.56, y - 1, AR_WOOD_D, 1.2);
}

function unit(ctx: Ctx, kind: UnitKind, x: number, y: number): boolean {
  switch (kind) {
    case 'camelrider': camelRider(ctx, x, y); return true;
    case 'rider': case 'knight': case 'horsearcher': horseman(ctx, kind, x, y); return true;
    case 'catapult': mangonel(ctx, x, y); return true;
    case 'boat': case 'ship': case 'warship': dhow(ctx, kind, x, y); return true;
  }
  return false;
}

// ---------------------------------------------------------------- buildings

const WASH = '#f4eee0';
const MUD = '#d2b07a';
const MUD_D = '#b08a54';

/** A pointed arch (door or window) on one side of a box, centred at u, from v0 up to v1. */
function arch(ctx: Ctx, f: 'L' | 'R', cx: number, cy: number, w: number, h: number, u: number, du: number, v0: number, v1: number, c: string) {
  const sp = v0 + (v1 - v0) * 0.66;
  poly(ctx, [
    ...fpt(f, cx, cy, w, h, u - du, v0), ...fpt(f, cx, cy, w, h, u + du, v0), ...fpt(f, cx, cy, w, h, u + du, sp),
    ...fpt(f, cx, cy, w, h, u + du * 0.5, v1 - (v1 - sp) * 0.25), ...fpt(f, cx, cy, w, h, u, v1), ...fpt(f, cx, cy, w, h, u - du * 0.5, v1 - (v1 - sp) * 0.25),
    ...fpt(f, cx, cy, w, h, u - du, sp),
  ], c);
}

/** A dome on a drum, lit from the left: white, sand or green-tiled, with a finial. */
function dome(ctx: Ctx, x: number, y: number, r: number, c: string, finial = true, pointed = false) {
  ellipse(ctx, x, y + r * 0.1, r * 1.04, r * 0.42, shade(c, -0.2)); // the drum's rim
  ctx.beginPath();
  ctx.moveTo(x - r, y);
  if (pointed) { ctx.quadraticCurveTo(x - r, y - r * 1.05, x, y - r * 1.45); ctx.quadraticCurveTo(x + r, y - r * 1.05, x + r, y); }
  else ctx.ellipse(x, y, r, r * 1.05, 0, Math.PI, 0);
  ctx.ellipse(x, y, r, r * 0.4, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fillStyle = ink(c);
  ctx.fill();
  ctx.beginPath(); // the shaded right flank
  ctx.moveTo(x + r * 0.15, y - r * (pointed ? 1.4 : 1.04));
  if (pointed) ctx.quadraticCurveTo(x + r * 0.95, y - r * 1.0, x + r, y);
  else ctx.ellipse(x, y, r, r * 1.05, 0, -Math.PI * 0.45, 0);
  ctx.ellipse(x, y, r, r * 0.4, 0, 0, Math.PI * 0.4);
  ctx.closePath();
  ctx.fillStyle = ink(shade(c, -0.18));
  ctx.fill();
  ellipse(ctx, x - r * 0.42, y - r * 0.55, r * 0.2, r * 0.3, 'rgba(255,255,255,0.45)');
  if (finial) {
    const ty = y - r * (pointed ? 1.45 : 1.05);
    line(ctx, x, ty, x, ty - r * 0.45, AR_GOLD_D, Math.max(0.5, r * 0.1));
    ellipse(ctx, x, ty - r * 0.2, r * 0.14, r * 0.14, AR_GOLD);
    ellipse(ctx, x, ty - r * 0.5, r * 0.1, r * 0.1, AR_GOLD);
  }
}

/** Little triangular merlons along the parapet of a flat-roofed box. */
function merlons(ctx: Ctx, x: number, top: number, w: number, c: string) {
  const n = Math.max(3, Math.round(w / 3));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    for (const [px, py] of [[x - w / 2 + (w / 2) * t, top + (w / 4) * t], [x + (w / 2) * t, top + (w / 4) * (1 - t)]] as const) {
      poly(ctx, [px - 0.8, py, px, py - 1.6, px + 0.8, py], c);
    }
  }
}

/** A cubic house of whitewash or mud brick: a parapet, arched windows, a wooden door, perhaps a small dome or a mashrabiya. */
function house(ctx: Ctx, x: number, y: number, w: number, h: number, wall: string, extra: 'dome' | 'screen' | 'stair' | 'none') {
  softShadow(ctx, x + 1, y + 1.6, w * 0.75, w * 0.32, 0.22);
  box(ctx, x, y, w, h, wall, shade(wall, 0.12));
  band(ctx, x, y, w, h, 0, 0.12, shade(wall, -0.12)); // the plinth
  box(ctx, x, y - h, w, 1.2, shade(wall, 0.04), shade(wall, -0.06)); // the parapet
  merlons(ctx, x, y - h - 1.2, w, shade(wall, 0.06));
  arch(ctx, 'R', x, y, w, h, 0.3, 0.1, 0.12, 0.6, DOOR_C); // the door
  faceQuad(ctx, 'R', x, y, w, h, 0.2, 0.4, 0.62, 0.66, AR_GREEN); // a green lintel
  arch(ctx, 'R', x, y, w, h, 0.74, 0.07, 0.48, 0.78, WIN_C);
  arch(ctx, 'L', x, y, w, h, 0.4, 0.08, 0.46, 0.78, WIN_C);
  if (wall === MUD) for (const v of [0.3, 0.55, 0.82]) { faceQuad(ctx, 'L', x, y, w, h, 0.05, 0.25, v, v + 0.03, MUD_D); faceQuad(ctx, 'R', x, y, w, h, 0.6, 0.9, v - 0.1, v - 0.07, MUD_D); } // bricks showing through the render
  if (wall === MUD) for (const u of [0.12, 0.52, 0.88]) { const [px, py] = fpt('R', x, y, w, h, u, 0.92); line(ctx, px, py, px + 1.6, py + 0.3, '#6a4a2a', 0.7); } // roof beams poking out
  if (extra === 'dome') dome(ctx, x - w * 0.12, y - h - 0.6, w * 0.26, WASH, false);
  if (extra === 'screen') { // a wooden mashrabiya bay on the front, its lattice lit from behind
    const [mx, my] = fpt('R', x, y, w, h, 0.62, 0.56);
    box(ctx, mx, my + 1, 3.6, 4, '#7a4a28', '#9a6a3a');
    for (const dy of [-1, -2.2, -3.4]) line(ctx, mx - 1.6, my + dy + 0.6, mx + 1.6, my + dy - 0.2, '#c89a5a', 0.3);
    roof(ctx, mx, my - 3, 4.2, 1.4, '#6a3a20');
  }
  if (extra === 'stair') { // an outside stair to the roof
    for (let i = 0; i < 4; i++) { const [px, py] = fpt('L', x, y, w, h, 0.2 + i * 0.12, 0.1 + i * 0.22); box(ctx, px, py, 2, 0.8, shade(wall, -0.06)); }
  }
}
const DOOR_C = '#5a3a1e';
const WIN_C = '#3a2a22';

/** A covered market stall: a striped awning on poles over sacks and baskets. */
function stall(ctx: Ctx, x: number, y: number) {
  softShadow(ctx, x + 1, y + 1.4, 8, 3.2, 0.2);
  for (const [px, py] of [[-6, -1], [6, -1], [-1, 3], [1, -4]] as const) line(ctx, x + px, y + py, x + px, y + py - 7, AR_WOOD_D, 0.8);
  for (const [sx, sy, c] of [[-3, 0.4, '#d8a040'], [0.4, 1.6, '#b8402e'], [3.2, 0.2, '#e8c870'], [-0.2, -1.6, '#7a9a3a']] as const) { ellipse(ctx, x + sx, y + sy, 1.8, 1.3, shade(c, -0.2)); ellipse(ctx, x + sx, y + sy - 0.6, 1.6, 0.9, c); }
  const pts = [x - 7.4, y - 8, x, y - 4.2, x + 7.4, y - 8, x, y - 11.6];
  poly(ctx, pts, AR_WHITE);
  for (let i = 0; i < 4; i++) { const t = (i + 0.25) / 4; poly(ctx, [x - 7.4 + 7.4 * t, y - 8 + 3.8 * t, x - 7.4 + 7.4 * (t + 0.12), y - 8 + 3.8 * (t + 0.12), x + 7.4 * (t + 0.12), y - 11.6 + 3.6 * (t + 0.12), x + 7.4 * t, y - 11.6 + 3.6 * t], AR_GREEN); }
  poly(ctx, [x - 7.4, y - 8, x, y - 4.2, x, y - 3.2, x - 7.4, y - 7], shade(AR_GREEN, -0.25)); // the valance
  for (let i = 0; i < 5; i++) ellipse(ctx, x - 6.4 + i * 1.6, y - 6.8 + i * 0.8, 0.4, 0.5, AR_GOLD);
}

/** The spiral minaret of the Abbasid capitals: a tapering tower wound by an outside ramp, with a small pavilion on top. */
function spiralMinaret(ctx: Ctx, x: number, y: number, H: number, R: number) {
  softShadow(ctx, x + 1.4, y + 1.4, R * 1.6, R * 0.7, 0.24);
  box(ctx, x, y, R * 2.4, 2, MUD_D, shade(MUD, 0.1)); // the square plinth
  const tiers = 5;
  for (let i = 0; i < tiers; i++) {
    const y0 = y - 2 - (i * H) / tiers, y1 = y0 - H / tiers;
    const r0 = R * (1 - i * 0.14), r1 = R * (1 - (i + 1) * 0.14);
    poly(ctx, [x - r0, y0, x - r1, y1, x + r1, y1, x + r0, y0], MUD);
    poly(ctx, [x + r0 * 0.2, y0 + r0 * 0.35, x + r1 * 0.2, y1 + r1 * 0.35, x + r1, y1, x + r0, y0], shade(MUD, -0.2));
    ellipse(ctx, x, y0, r0, r0 * 0.38, i ? shade(MUD, 0.16) : shade(MUD, -0.06));
    // the ramp climbing round the outside: a lit ledge sloping up across the front
    line(ctx, x - r0, y0 - 0.4, x + r1, y1 + r1 * 0.3, shade(MUD, 0.3), 1.1);
    line(ctx, x - r0, y0 + 0.5, x + r1, y1 + r1 * 0.3 + 0.9, shade(MUD, -0.35), 0.5);
    for (let j = 1; j < 4; j++) { const t = j / 4; const px = x - r0 + (r1 + r0) * t, py = y0 - 0.4 + (y1 + r1 * 0.3 - y0 + 0.4) * t; line(ctx, px, py - 0.1, px, py - 1.2, shade(MUD, 0.2), 0.5); } // the balustrade posts
  }
  const yt = y - 2 - H, rt = R * (1 - tiers * 0.14);
  box(ctx, x, yt, rt * 2.2, rt * 2, MUD, shade(MUD, 0.15)); // the little top pavilion
  arch(ctx, 'R', x, yt, rt * 2.2, rt * 2, 0.5, 0.18, 0.1, 0.85, WIN_C);
  dome(ctx, x, yt - rt * 2, rt * 1.0, WASH, true, true);
}

/** The great domed hall of the capital: an arcade of pointed arches, a green-tiled dome on a high drum and a spiral minaret. */
function greatHall(ctx: Ctx, x: number, y: number) {
  softShadow(ctx, x + 1, y + 2.4, 18, 7.4, 0.24);
  spiralMinaret(ctx, x - 14, y - 3.4, 27, 4.4);
  const w = 24, h = 9;
  box(ctx, x, y, w, h, WASH, shade(WASH, 0.06));
  band(ctx, x, y, w, h, 0, 0.1, shade(WASH, -0.14));
  for (let i = 0; i < 5; i++) { arch(ctx, 'R', x, y, w, h, 0.1 + i * 0.2, 0.05, 0.1, 0.72, i === 2 ? DOOR_C : WIN_C); arch(ctx, 'L', x, y, w, h, 0.1 + i * 0.2, 0.05, 0.1, 0.72, WIN_C); }
  band(ctx, x, y, w, h, 0.84, 0.92, AR_GREEN); // a band of green tile and gold under the cornice
  for (let i = 0; i < 8; i++) { faceQuad(ctx, 'R', x, y, w, h, 0.04 + i * 0.12, 0.08 + i * 0.12, 0.85, 0.91, AR_GOLD); faceQuad(ctx, 'L', x, y, w, h, 0.04 + i * 0.12, 0.08 + i * 0.12, 0.85, 0.91, AR_GOLD); }
  merlons(ctx, x, y - h, w, shade(WASH, -0.04));
  // the raised central block with its portal, and the drum and dome
  box(ctx, x + 1, y - h + 3, 12, 5, WASH, shade(WASH, 0.06));
  arch(ctx, 'R', x + 1, y - h + 3, 12, 5, 0.5, 0.2, 0.05, 0.95, AR_GREEN);
  arch(ctx, 'R', x + 1, y - h + 3, 12, 5, 0.5, 0.13, 0.05, 0.8, DOOR_C);
  const dx = x + 1, dy = y - h - 4;
  ctx.beginPath(); // the drum, with little windows
  ctx.ellipse(dx, dy + 1, 5.8, 2.6, 0, 0, Math.PI);
  ctx.lineTo(dx - 5.8, dy - 2);
  ctx.ellipse(dx, dy - 2, 5.8, 2.6, 0, Math.PI, 0, true);
  ctx.closePath();
  ctx.fillStyle = ink(shade(WASH, -0.04));
  ctx.fill();
  for (const a of [0.3, 0.9, 1.5, 2.1, 2.7]) { const px = dx - Math.cos(a) * 5.4, py = dy + Math.sin(a) * 2.2 - 0.6; poly(ctx, [px - 0.5, py + 0.8, px - 0.5, py - 1, px, py - 1.6, px + 0.5, py - 1, px + 0.5, py + 0.8], WIN_C); }
  dome(ctx, dx, dy - 2.2, 5.8, '#3f9a4a', true, true);
  for (const a of [-0.9, -0.45, 0, 0.45]) curve(ctx, dx + Math.sin(a) * 6.2, dy - 2.2, dx + Math.sin(a) * 6, dy - 7, dx + Math.sin(a) * 0.6, dy - 11.2, 0.4, '#2a7a34'); // tile ribs
  // two small corner domes
  dome(ctx, x - 8, y - h - 3.2, 2.4, WASH, true);
  dome(ctx, x + 9, y - h - 0.2, 2.4, WASH, true);
  palmTree(ctx, x + 12, y + 4, 0.62, 2);
}

/** The ordinary big building: a domed market hall (a qaysariyya) with an arcade and a palm in front. */
function marketHall(ctx: Ctx, x: number, y: number) {
  softShadow(ctx, x + 1, y + 2, 14, 6, 0.22);
  const w = 18, h = 8;
  box(ctx, x, y, w, h, MUD, shade(MUD, 0.12));
  band(ctx, x, y, w, h, 0, 0.1, MUD_D);
  for (let i = 0; i < 4; i++) { arch(ctx, 'R', x, y, w, h, 0.14 + i * 0.24, 0.08, 0.1, 0.8, WIN_C); arch(ctx, 'L', x, y, w, h, 0.14 + i * 0.24, 0.08, 0.1, 0.8, WIN_C); }
  band(ctx, x, y, w, h, 0.86, 0.94, AR_GREEN);
  merlons(ctx, x, y - h, w, shade(MUD, 0.08));
  dome(ctx, x - 3, y - h - 0.6, 3.6, WASH, true);
  dome(ctx, x + 3.6, y - h + 1.6, 3.6, WASH, true);
  dome(ctx, x + 0.4, y - h - 3.6, 4.6, WASH, true, true);
  // a square tower with a little lantern at the corner
  box(ctx, x - 9, y - 1.6, 4, 16, WASH, shade(WASH, 0.1));
  arch(ctx, 'R', x - 9, y - 1.6, 4, 16, 0.5, 0.2, 0.74, 0.92, WIN_C);
  band(ctx, x - 9, y - 1.6, 4, 16, 0.66, 0.7, AR_GREEN);
  dome(ctx, x - 9, y - 17.6, 1.9, WASH, true, true);
  stall(ctx, x + 10, y + 5);
}

function building(ctx: Ctx, x: number, y: number, big: boolean, _roofC: string, capital: boolean) {
  if (big && capital) return greatHall(ctx, x, y);
  if (big) return marketHall(ctx, x, y);
  const spot: Record<string, number> = { '-10,2': 0, '10,2': 1, '0,8': 2, '-6,-8': 3, '7,-7': 4, '-14,-3': 1, '14,-2': 2 };
  const v = spot[`${Math.round(x)},${Math.round(y)}`] ?? ((Math.round(x) * 7 + Math.round(y) * 3) % 5 + 5) % 5;
  if (v === 0) house(ctx, x, y, 11, 8, WASH, 'dome');
  else if (v === 1) house(ctx, x, y, 10, 7, MUD, 'stair');
  else if (v === 2) { house(ctx, x, y, 11, 10, WASH, 'screen'); }
  else if (v === 3) stall(ctx, x, y);
  else { house(ctx, x, y, 10, 7, MUD, 'none'); palmTree(ctx, x + 6, y + 3, 0.55, 1); }
}

// ---------------------------------------------------------------- date palms

/** A date palm: a slender ringed trunk leaning a little, a crown of arching fronds, hanging bunches of dates. */
function palmTree(ctx: Ctx, x: number, y: number, k: number, variant: number, P?: BiomePalette) {
  const lean = (rand(variant, 1) - 0.5) * 6 * k + (variant % 2 ? 2 : -1.6) * k;
  const H = (20 + rand(variant, 2) * 6) * k;
  const tx = x + lean, ty = y - H;
  const cx = x + lean * 0.2 - 0.6 * k, cy = y - H * 0.5;
  const trunk = P?.trunk ?? '#7a5a34';
  curve(ctx, x, y, cx, cy, tx, ty, 2.4 * k, shade(trunk, -0.15));
  curve(ctx, x - 0.4 * k, y, cx - 0.4 * k, cy, tx - 0.3 * k, ty, 1.2 * k, shade(trunk, 0.12));
  for (let i = 1; i < 11; i++) { // the diamond-scaled bark of old frond bases
    const [px, py] = qpt(x, y, cx, cy, tx, ty, i / 11);
    line(ctx, px - 1.2 * k, py + 0.4 * k, px + 1.2 * k, py - 0.3 * k, shade(trunk, -0.35), 0.5 * k);
  }
  const green = P ? mix(P.forest, '#5a9a2a', 0.4) : '#4a8a2a';
  const frond = (a: number, len: number, droop: number, c: string) => {
    const ex = tx + Math.cos(a) * len * k, ey = ty + Math.sin(a) * len * 0.5 * k + droop * k;
    const mx = tx + Math.cos(a) * len * 0.5 * k, my = ty + Math.sin(a) * len * 0.3 * k - 3 * k;
    for (let i = 1; i <= 7; i++) { // leaflets hanging from the rib
      const t = i / 8, [px, py] = qpt(tx, ty, mx, my, ex, ey, t);
      const l = (1.2 + 2 * Math.sin(Math.PI * t)) * k;
      line(ctx, px, py, px + Math.cos(a + 0.9) * l * 0.6, py + l, c, 0.6 * k);
      line(ctx, px, py, px + Math.cos(a - 0.9) * l * 0.6, py + l * 0.9, shade(c, -0.18), 0.6 * k);
    }
    curve(ctx, tx, ty, mx, my, ex, ey, 0.8 * k, shade(c, -0.1));
  };
  // back fronds first, darker; then the bunches of dates; then the front fronds
  for (const [a, len, d] of [[-2.6, 10, 5], [-0.5, 10, 5], [-1.57, 7, 1]] as const) frond(a, len, d, shade(green, -0.2));
  const dates = variant % 3 === 2 ? '#d89a2a' : '#b0581c';
  for (const dx of [-1.6, 1.4]) {
    ellipse(ctx, tx + dx * k, ty + 2.6 * k, 1.4 * k, 2 * k, shade(dates, -0.15));
    for (let i = 0; i < 5; i++) ellipse(ctx, tx + dx * k + (i % 2 - 0.5) * 1.1 * k, ty + (1.8 + i * 0.6) * k, 0.55 * k, 0.55 * k, i % 2 ? dates : shade(dates, 0.2));
  }
  for (const [a, len, d] of [[Math.PI - 0.2, 11, 6], [0.15, 11, 6], [2.3, 9, 7], [0.8, 9, 7], [-2.1, 8, 2], [-1.0, 8, 2]] as const) frond(a, len, d, green);
  ellipse(ctx, tx, ty, 1.3 * k, 1 * k, shade(green, 0.2));
}

function tree(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  const v = variant % 4;
  if (v === 1) { // a pair of palms, one tall and one young
    palmTree(ctx, x - 2.4 * k, y - 1 * k, k * 0.95, variant, P);
    palmTree(ctx, x + 3 * k, y + 1.4 * k, k * 0.62, variant + 3, P);
    return;
  }
  if (v === 3) { // a young palm: fronds springing from the sand, offshoots round its foot, and a tall one behind
    palmTree(ctx, x + 2 * k, y - 2 * k, k * 0.9, variant + 1, P);
    const green = mix(P.forest, '#5a9a2a', 0.4);
    for (const [a, l] of [[-2.6, 6], [-2.0, 7], [-1.3, 7.4], [-0.6, 6.6], [-0.1, 5.4], [-3.0, 5]] as const) {
      const ex = x - 2 * k + Math.cos(a) * l * k, ey = y + 1 * k + Math.sin(a) * l * 0.9 * k;
      curve(ctx, x - 2 * k, y + 1 * k, (x - 2 * k + ex) / 2, (y + ey) / 2 - 2 * k, ex, ey + 1.6 * k, 1.1 * k, a < -1.5 ? shade(green, -0.15) : green);
    }
    return;
  }
  palmTree(ctx, x, y, k, variant, P);
}

registerArt('arabia', {
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

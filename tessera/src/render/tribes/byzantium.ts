// The Byzantine empire's own art (see render/tribeart): the Roman army of the Macedonian emperors, tenth to eleventh
// century. Green-and-gold tunics with the old Roman clavi stripes under quilted coats, lamellar and scale klibania,
// purple for the elite tagmata; conical spangenhelms with mail aventails, felt caps and the tall kamelaukion; kite and
// round shields painted with the chi-rho and the cross-in-circle; spears, spathia, composite bows. The Varangian Guard
// in mail with red cloaks and long Dane axes; kataphraktoi on barded horses; a traction trebuchet; dromons under
// lateen sails with a bronze siphon at the bow. Towns of red-tiled houses, arcades and domed churches, the capital a
// great dome on its piers behind a stretch of the triple land walls; cypress, olive and stone pine on the hills.
import { registerArt, type Body } from '../tribeart';
import { drawHorse, figure } from '../units';
import { band, box, ellipse, faceQuad, ink, line, mix, poly, rand, roof, shade, type Ctx } from '../prims';
import type { BiomePalette } from '../../data/tribes';
import type { UnitKind } from '../../game/types';

const GREEN = '#2f7a3a', GREEN_D = '#1d5226', GREEN_L = '#4f9a52';
const GOLD = '#e2b43c', GOLD_D = '#a8801e', GOLD_L = '#f6d878';
const PURPLE = '#5e2a70', PURPLE_D = '#3c1848', PURPLE_L = '#8a4aa0';
const RED = '#a8262a', RED_D = '#6e1418';
const IRON = '#8c949e', IRON_D = '#5c636c', STEEL = '#c2c9d2';
const MAIL = '#7a828c';
const LINEN = '#efe6cf', LEATH = '#6e4a2a', LEATH_D = '#4a3018';
const WOOD = '#7a5230', WOOD_D = '#4e321c';
const BLOND = '#d8b060', BRONZE = '#c08a3a';
const PLASTER = '#efe4cc', STONE = '#d9cfb6', BRICK = '#b25a3c', TILE = '#c0583a', LEAD = '#8a96a2';

// ---------------------------------------------------------------- small helpers

/** A point on one visible side of a box, in faceQuad's (u, v) coordinates. */
function pt(face: 'L' | 'R', cx: number, cy: number, w: number, h: number, u: number, v: number): [number, number] {
  return face === 'R' ? [cx + (u * w) / 2, cy + (w / 4) * (1 - u) - v * h] : [cx - w / 2 + (u * w) / 2, cy + (w / 4) * u - v * h];
}

/** A polygon on one side of a box, shaded like that side. */
function fpoly(ctx: Ctx, face: 'L' | 'R', cx: number, cy: number, w: number, h: number, pts: [number, number][], color: string) {
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

function ring(ctx: Ctx, x: number, y: number, rx: number, ry: number, c: string, w: number) {
  ctx.strokeStyle = ink(c);
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
  ctx.stroke();
}

/** The chi-rho: an X crossed by a P, the labarum's monogram of Christ. */
function chiRho(ctx: Ctx, x: number, y: number, r: number, c: string, w: number) {
  line(ctx, x, y - r, x, y + r, c, w);
  line(ctx, x - r * 0.7, y - r * 0.45, x + r * 0.7, y + r * 0.45, c, w);
  line(ctx, x + r * 0.7, y - r * 0.45, x - r * 0.7, y + r * 0.45, c, w);
  ctx.strokeStyle = ink(c);
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.arc(x + r * 0.28, y - r * 0.68, r * 0.3, -Math.PI / 2 - 0.4, Math.PI / 2 + 0.2);
  ctx.stroke();
}

/** A cross inside a circle, the gold device painted on shields and sails. */
function crossCircle(ctx: Ctx, x: number, y: number, rx: number, ry: number, c: string, w: number) {
  ring(ctx, x, y, rx, ry, c, w);
  line(ctx, x, y - ry * 1.35, x, y + ry * 1.35, c, w);
  line(ctx, x - rx * 1.35, y, x + rx * 1.35, y, c, w);
}

/** Rows of iron lamellae laced together, on both visible sides of a torso box. */
function lamellar(ctx: Ctx, x: number, y: number, w: number, h: number, v0: number, v1: number, rows: number, base: string, cols = 6, lace = RED) {
  const dv = (v1 - v0) / rows;
  for (let r = 0; r < rows; r++) {
    const a = v0 + r * dv, b = a + dv * 0.92;
    band(ctx, x, y, w, h, a, b, r % 2 ? shade(base, -0.07) : base);
    band(ctx, x, y, w, h, a, a + dv * 0.18, shade(base, 0.34)); // each row's lit lower edge
    for (let i = 0; i <= cols; i++) {
      const u = (i + (r % 2) * 0.5) / (cols + 0.5);
      if (u > 0.97) continue;
      faceQuad(ctx, 'R', x, y, w, h, u, u + 0.025, a, b, shade(base, -0.45));
      faceQuad(ctx, 'L', x, y, w, h, u, u + 0.025, a, b, shade(base, -0.45));
    }
  }
  for (const u of [0.22, 0.78]) { faceQuad(ctx, 'R', x, y, w, h, u, u + 0.04, v0, v1, lace); faceQuad(ctx, 'L', x, y, w, h, u, u + 0.04, v0, v1, lace); }
}

/** Overlapping scales hanging in rows (a klibanion of scale), drawn bottom row first so each upper row overlaps the next. */
function scales(ctx: Ctx, x: number, y: number, w: number, h: number, v0: number, v1: number, rows: number, base: string, cols = 5) {
  const dv = (v1 - v0) / rows;
  band(ctx, x, y, w, h, v0, v1, shade(base, -0.35));
  for (let r = 0; r < rows; r++) {
    const v = v0 + (r + 0.55) * dv;
    for (const face of ['L', 'R'] as const) {
      for (let i = 0; i < cols; i++) {
        const u = (i + 0.5 + (r % 2) * 0.5) / (cols + 0.5);
        if (u > 1) continue;
        const [px, py] = pt(face, x, y, w, h, u, v);
        const rx = w / (cols * 2.2), ry = dv * h * 0.62;
        const c = face === 'L' ? shade(base, 0.05) : shade(base, -0.18);
        ellipse(ctx, px, py + ry * 0.25, rx, ry, shade(c, -0.35));
        ellipse(ctx, px, py, rx * 0.9, ry * 0.9, c);
        ellipse(ctx, px - rx * 0.25, py - ry * 0.3, rx * 0.35, ry * 0.3, shade(c, 0.4));
      }
    }
  }
}

/** Fine mail: a grey ground speckled with ring highlights. */
function mail(ctx: Ctx, x: number, y: number, w: number, h: number, v0: number, v1: number, base = MAIL) {
  band(ctx, x, y, w, h, v0, v1, base);
  const rows = Math.max(2, Math.round((v1 - v0) * 9));
  for (let r = 0; r < rows; r++) {
    const v = v0 + ((r + 0.5) / rows) * (v1 - v0);
    for (let i = 0; i < 7; i++) {
      const u = (i + 0.3 + (r % 2) * 0.5) / 7.5;
      for (const face of ['L', 'R'] as const) {
        const [px, py] = pt(face, x, y, w, h, u, v);
        ellipse(ctx, px, py, w * 0.022, w * 0.016, r % 2 ? shade(base, 0.35) : shade(base, -0.3));
      }
    }
  }
}

// ---------------------------------------------------------------- dress

/** The colours of the dress: [torso, legs, sleeves]. Tunics in green, the elite in purple, the Varangians in mail. */
function dress(kind: UnitKind): [string, string, string] | null {
  switch (kind) {
    case 'warrior': return [GREEN, '#6a5640', GREEN];
    case 'archer': return [GREEN_L, '#5e4c38', GREEN_L];
    case 'defender': return [IRON, '#5a4a3a', GREEN];
    case 'swordsman': return [GOLD_D, '#4e3e30', GREEN];
    case 'knight': return [IRON_D, '#3c2e40', PURPLE];
    case 'rider': case 'horsearcher': return [GREEN, '#5a4632', GREEN];
    case 'giant': return [GOLD, PURPLE_D, PURPLE];
    case 'varangian': return [MAIL, '#4a3a2c', MAIL];
    case 'explorer': return [LINEN, '#7a6a52', LINEN];
    default: return [GREEN, '#5a4632', GREEN];
  }
}

/** Belt with a gilt buckle, at the waist of a torso box. */
function belt(ctx: Ctx, x: number, y: number, w: number, h: number, c = LEATH) {
  band(ctx, x, y, w, h, 0.22, 0.32, c);
  band(ctx, x, y, w, h, 0.22, 0.25, shade(c, -0.3));
  faceQuad(ctx, 'R', x, y, w, h, 0.42, 0.56, 0.2, 0.34, GOLD);
  faceQuad(ctx, 'R', x, y, w, h, 0.46, 0.52, 0.24, 0.3, GOLD_L);
}

/** Pteruges: leather strips hanging from the waist over the tunic skirt. */
function pteruges(ctx: Ctx, x: number, y: number, w: number, h: number, c: string) {
  for (let i = 0; i < 5; i++) {
    const u = 0.04 + i * 0.2;
    faceQuad(ctx, 'R', x, y, w, h, u, u + 0.15, -0.02, 0.24, c);
    faceQuad(ctx, 'L', x, y, w, h, u, u + 0.15, -0.02, 0.24, c);
    faceQuad(ctx, 'R', x, y, w, h, u, u + 0.15, -0.02, 0.03, GOLD);
  }
}

function torso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const k = w / 10;
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const Lf = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'L', x, y, w, h, u0, u1, v0, v1, c);
  const B = (v0: number, v1: number, c: string) => band(ctx, x, y, w, h, v0, v1, c);
  switch (kind) {
    case 'warrior': { // a quilted kavadion: stitched in vertical rows, gold clavi stripes down the front, a gold collar
      for (let i = 1; i < 6; i++) { R(i / 6, i / 6 + 0.02, 0, 0.88, GREEN_D); Lf(i / 6, i / 6 + 0.02, 0, 0.88, GREEN_D); }
      for (const v of [0.45, 0.65]) B(v, v + 0.02, shade(GREEN, 0.18));
      R(0.24, 0.32, 0, 0.9, GOLD); R(0.68, 0.76, 0, 0.9, GOLD);
      belt(ctx, x, y, w, h);
      B(0, 0.08, GOLD_D); // embroidered hem
      B(0.88, 1, GOLD);
      return;
    }
    case 'archer': { // a light tunic with clavi, a baldric across the chest and a gold collar
      R(0.2, 0.28, 0, 0.9, GOLD); R(0.72, 0.8, 0, 0.9, GOLD);
      fpoly(ctx, 'R', x, y, w, h, [[0.02, 0.98], [0.2, 0.98], [0.98, 0.14], [0.8, 0.12]], LEATH);
      R(0.5, 0.6, 0.48, 0.6, GOLD);
      belt(ctx, x, y, w, h);
      B(0.88, 1, GOLD);
      B(0, 0.07, GREEN_D);
      return;
    }
    case 'defender': { // a lamellar klibanion over a green tunic, pteruges at the waist
      B(0, 0.3, GREEN);
      lamellar(ctx, x, y, w, h, 0.3, 0.9, 5, IRON);
      pteruges(ctx, x, y, w, h, LEATH);
      belt(ctx, x, y, w, h, LEATH_D);
      B(0.9, 1, GREEN_D); // the padded collar
      B(0.9, 0.93, GOLD);
      return;
    }
    case 'swordsman': { // a gilt-bronze scale corselet over a green tunic, a red sash knotted at the chest
      B(0, 0.3, GREEN);
      scales(ctx, x, y, w, h, 0.3, 0.92, 5, GOLD_D, 5);
      pteruges(ctx, x, y, w, h, GREEN_D);
      belt(ctx, x, y, w, h, LEATH_D);
      R(0.0, 1, 0.66, 0.72, RED); // the officer's sash (the cingulum) tied round the chest
      Lf(0.0, 1, 0.66, 0.72, RED);
      const [kx, ky] = pt('R', x, y, w, h, 0.5, 0.7);
      ellipse(ctx, kx, ky, 1.1 * k, 0.9 * k, shade(RED, 0.15));
      poly(ctx, [kx - 0.6 * k, ky, kx + 0.4 * k, ky, kx + 0.8 * k, ky + 3 * k, kx - 0.2 * k, ky + 2.6 * k], RED_D);
      B(0.92, 1, GREEN_D);
      return;
    }
    case 'knight':
    case 'horsearcher':
    case 'rider': { // the kataphraktos: lamellar with a mail collar, purple for the heavy horse; the light rider a padded coat
      if (kind !== 'knight') {
        for (let i = 1; i < 6; i++) { R(i / 6, i / 6 + 0.02, 0, 0.9, GREEN_D); Lf(i / 6, i / 6 + 0.02, 0, 0.9, GREEN_D); }
        R(0.24, 0.32, 0, 0.9, GOLD); R(0.68, 0.76, 0, 0.9, GOLD);
        belt(ctx, x, y, w, h);
        B(0.88, 1, GOLD);
        return;
      }
      B(0, 0.3, PURPLE);
      lamellar(ctx, x, y, w, h, 0.28, 0.86, 5, IRON, 6, GOLD);
      belt(ctx, x, y, w, h, PURPLE_D);
      mail(ctx, x, y, w, h, 0.86, 1);
      return;
    }
    case 'giant': { // the emperor's champion: gilt lamellar under a jewelled purple loros
      B(0, 0.3, PURPLE);
      lamellar(ctx, x, y, w, h, 0.3, 0.92, 5, GOLD, 6, PURPLE);
      belt(ctx, x, y, w, h, PURPLE_D);
      fpoly(ctx, 'R', x, y, w, h, [[0.3, 1], [0.56, 1], [0.56, 0], [0.3, 0]], PURPLE); // the loros falling down the front
      for (let i = 0; i < 5; i++) {
        const [px, py] = pt('R', x, y, w, h, 0.43, 0.12 + i * 0.2);
        ellipse(ctx, px, py, 0.8 * k, 0.8 * k, i % 2 ? '#d84a5a' : '#3aa0d0');
        ellipse(ctx, px, py, 0.35 * k, 0.35 * k, GOLD_L);
      }
      R(0.28, 0.32, 0, 1, GOLD); R(0.54, 0.58, 0, 1, GOLD);
      B(0.9, 1, GOLD);
      return;
    }
    case 'varangian': { // a long mail byrnie, a broad leather belt with a gilt buckle, the red tunic showing at the hem
      B(0, 0.12, RED);
      mail(ctx, x, y, w, h, 0.1, 0.94);
      belt(ctx, x, y, w, h, LEATH_D);
      B(0.92, 1, shade(MAIL, -0.2));
      B(0.08, 0.12, shade(MAIL, -0.35));
      return;
    }
    case 'explorer': { // a linen travelling tunic with a green hem and a satchel strap
      R(0.24, 0.3, 0, 0.9, GREEN); R(0.7, 0.76, 0, 0.9, GREEN);
      B(0, 0.08, GREEN);
      fpoly(ctx, 'R', x, y, w, h, [[0.76, 0.98], [0.94, 0.98], [0.2, 0.1], [0.04, 0.12]], LEATH);
      belt(ctx, x, y, w, h);
      return;
    }
    default:
      R(0.24, 0.32, 0, 0.9, GOLD); R(0.68, 0.76, 0, 0.9, GOLD);
      belt(ctx, x, y, w, h);
  }
}

/** Faces: the Varangians are bearded northerners, the officers wear the neat Greek beard. */
function face(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  if (kind === 'varangian') {
    fpoly(ctx, 'R', x, y, w, h, [[0.06, 0.34], [0.94, 0.34], [0.86, -0.12], [0.5, -0.32], [0.14, -0.12]], BLOND); // a long fair beard
    R(0.24, 0.76, 0.3, 0.38, shade(BLOND, 0.2)); // the moustache
    R(0.3, 0.7, 0.13, 0.19, shade(BLOND, -0.4));
    for (const u of [0.3, 0.5, 0.7]) R(u, u + 0.03, -0.18, 0.28, shade(BLOND, -0.22));
    faceQuad(ctx, 'L', x, y, w, h, 0.2, 1, 0.1, 0.42, BLOND); // the beard round the jaw
    return;
  }
  if (kind === 'swordsman' || kind === 'knight' || kind === 'giant' || kind === 'defender') { // a short dark beard
    fpoly(ctx, 'R', x, y, w, h, [[0.08, 0.32], [0.92, 0.32], [0.8, 0.02], [0.5, -0.06], [0.2, 0.02]], '#2e2014');
    R(0.3, 0.7, 0.13, 0.19, '#7a3a2a');
  }
}

// ---------------------------------------------------------------- headgear

/** A mail curtain hanging from a helmet over the neck and shoulders. */
function aventail(ctx: Ctx, x: number, top: number, k: number, hw: number, c = MAIL, front = false) {
  const x0 = x - hw / 2 - 0.9 * k, x1 = x + (front ? hw / 2 + 0.8 * k : -0.4 * k);
  const y0 = top + 3.4 * k, y1 = top + 11 * k;
  poly(ctx, [x0, y0, x1, y0 + (front ? 0 : hw / 4 - 1.2 * k), x1 - 0.4 * k, y1 - (front ? 2 * k : 0), x0 + 0.4 * k, y1 - hw / 4 + 1 * k], c);
  for (let i = 1; i < 6; i++) {
    const t = i / 6;
    line(ctx, x0 + 0.2 * k, y0 + (y1 - y0) * t - 0.6 * k, x1 - 0.6 * k, y0 + (y1 - y0) * t + (front ? -1 * k : (hw / 4 - 1.2 * k) * (1 - t)) - 0.6 * k, i % 2 ? shade(c, 0.3) : shade(c, -0.35), 0.4 * k);
  }
}

/** A spangenhelm: a tall cone of riveted plates on a brow band, gilded ribs, a nasal and a knob at the peak. */
function spangenhelm(ctx: Ctx, x: number, top: number, k: number, hw: number, metal: string, rib: string, tall = 8) {
  const by = top + 3.4 * k, bw = hw + 0.8 * k;
  box(ctx, x, by, bw, 2.4 * k, rib, shade(rib, 0.3)); // the brow band
  for (const u of [0.15, 0.4, 0.65, 0.9]) { faceQuad(ctx, 'R', x, by, bw, 2.4 * k, u, u + 0.05, 0.3, 0.7, shade(rib, 0.5)); faceQuad(ctx, 'L', x, by, bw, 2.4 * k, u, u + 0.05, 0.3, 0.7, shade(rib, 0.4)); }
  roof(ctx, x, by - 2.4 * k, bw, tall * k, metal); // the cone, its two lit and shaded halves
  const apex = by - 2.4 * k - tall * k;
  for (const [ex, ey] of [[x - bw / 2, by - 2.4 * k], [x, by - 2.4 * k + bw / 4], [x + bw / 2, by - 2.4 * k]] as const) line(ctx, ex, ey, x, apex, rib, 0.9 * k); // the spangen ribs
  ellipse(ctx, x, apex + 0.4 * k, 1 * k, 0.9 * k, rib);
  ellipse(ctx, x - 0.3 * k, apex + 0.1 * k, 0.4 * k, 0.35 * k, shade(rib, 0.6));
  line(ctx, x - 1.6 * k, by - 2.2 * k + 2 * k, x - 1.9 * k, by - 2 * k - 2.6 * k + 2 * k, 'rgba(255,255,255,0.35)', 0.7 * k); // a glint on the cone
  const [nx, ny] = pt('R', x, by, bw, 2.4 * k, 0.5, 0.3); // the nasal
  poly(ctx, [nx - 0.7 * k, ny, nx + 0.7 * k, ny, nx + 0.5 * k, ny + 4.4 * k, nx - 0.5 * k, ny + 4.4 * k], metal);
  line(ctx, nx - 0.2 * k, ny + 0.4 * k, nx - 0.2 * k, ny + 4 * k, shade(metal, 0.4), 0.3 * k);
  return apex;
}

/** A horsehair crest (toupha) tuft at the peak of a helmet. */
function toupha(ctx: Ctx, x: number, y: number, k: number, c: string) {
  for (let i = 0; i < 6; i++) {
    const t = i / 5 - 0.5;
    curve(ctx, x + t * 1.2 * k, y, x - 2 * k + t * 2 * k, y - 4.4 * k, x - 5.4 * k + t * 2.4 * k, y - 2 * k + Math.abs(t) * 2 * k, 0.9 * k, i % 2 ? shade(c, -0.2) : c);
  }
}

function head(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  switch (kind) {
    case 'warrior': { // a padded felt cap with a rolled brim
      box(ctx, x, top + 3.2 * k, hw + 0.6 * k, 4.2 * k, '#c8b48a', '#d8c69c');
      for (const u of [0.25, 0.5, 0.75]) { faceQuad(ctx, 'R', x, top + 3.2 * k, hw + 0.6 * k, 4.2 * k, u, u + 0.03, 0.3, 1, '#9a8660'); faceQuad(ctx, 'L', x, top + 3.2 * k, hw + 0.6 * k, 4.2 * k, u, u + 0.03, 0.3, 1, '#9a8660'); }
      ellipse(ctx, x, top - 0.8 * k, hw * 0.5, hw * 0.3, '#d8c69c');
      ellipse(ctx, x - 0.8 * k, top - 1.4 * k, hw * 0.28, hw * 0.14, '#e8d8b4');
      box(ctx, x, top + 3.6 * k, hw + 1.6 * k, 1.4 * k, GREEN, GREEN_L); // the green roll
      return;
    }
    case 'archer': { // the tall white kamelaukion of the light troops, banded in green and gold
      box(ctx, x, top + 3.4 * k, hw + 0.4 * k, 6.4 * k, '#f0e8d4', '#fbf6ea');
      ellipse(ctx, x, top - 3 * k - 0.4 * k, (hw + 0.4 * k) / 2, (hw + 0.4 * k) / 4, '#fbf6ea');
      ellipse(ctx, x, top - 3 * k - 0.4 * k, (hw + 0.4 * k) / 2 - 0.6 * k, (hw + 0.4 * k) / 4 - 0.4 * k, '#efe4c8');
      band(ctx, x, top + 3.4 * k, hw + 0.4 * k, 6.4 * k, 0, 0.26, GREEN);
      band(ctx, x, top + 3.4 * k, hw + 0.4 * k, 6.4 * k, 0.26, 0.34, GOLD);
      return;
    }
    case 'defender': {
      aventail(ctx, x, top, k, hw);
      spangenhelm(ctx, x, top, k, hw, IRON, BRONZE, 7);
      return;
    }
    case 'swordsman': {
      aventail(ctx, x, top, k, hw);
      const apex = spangenhelm(ctx, x, top, k, hw, STEEL, GOLD, 8);
      toupha(ctx, x, apex + 0.4 * k, k, RED);
      return;
    }
    case 'varangian': { // fair braids from under a plain conical nasal helm with a mail aventail
      for (const dx of [-1, 1]) curve(ctx, x + dx * (hw / 2 - 0.4 * k), top + 4 * k, x + dx * (hw / 2 + 0.6 * k), top + 8 * k, x + dx * (hw / 2), top + 12 * k, 1.3 * k, BLOND);
      aventail(ctx, x, top, k, hw);
      spangenhelm(ctx, x, top, k, hw, IRON, IRON_D, 7.4);
      return;
    }
    case 'rider':
    case 'horsearcher': {
      aventail(ctx, x, top, k, hw, MAIL);
      spangenhelm(ctx, x, top, k, hw, IRON, BRONZE, 6.5);
      return;
    }
    case 'knight': { // a mail veil hides all but the eyes: the kataphraktos
      aventail(ctx, x, top, k, hw, MAIL, true);
      faceQuad(ctx, 'R', x, top + 10.5 * k, hw, 10.5 * k, 0.04, 0.96, 0.02, 0.4, MAIL); // the mail mask over the lower face
      for (const v of [0.08, 0.18, 0.28]) faceQuad(ctx, 'R', x, top + 10.5 * k, hw, 10.5 * k, 0.04, 0.96, v, v + 0.03, shade(MAIL, -0.35));
      const apex = spangenhelm(ctx, x, top, k, hw, IRON_D, GOLD, 8.5);
      toupha(ctx, x, apex + 0.4 * k, k, PURPLE_L);
      return;
    }
    case 'giant': { // a jewelled stemma crown with pearl pendilia and a cross
      const by = top + 3 * k, bw = hw + 0.8 * k;
      box(ctx, x, by, bw, 4 * k, GOLD, GOLD_L);
      for (const u of [0.12, 0.38, 0.62, 0.88]) {
        faceQuad(ctx, 'R', x, by, bw, 4 * k, u, u + 0.12, 0.3, 0.75, u === 0.38 || u === 0.88 ? '#3aa0d0' : '#d84a5a');
        faceQuad(ctx, 'L', x, by, bw, 4 * k, u, u + 0.12, 0.3, 0.75, '#3a9a5a');
      }
      band(ctx, x, by, bw, 4 * k, 0.86, 1, '#f4f0e6'); // a row of pearls
      for (const dx of [-1, 1]) { // pendilia: strings of pearls hanging beside the face
        const px = x + dx * (bw / 2 - 0.2 * k), py = by - 0.6 * k + (dx > 0 ? 0 : 0);
        for (let i = 0; i < 4; i++) ellipse(ctx, px, py + i * 1.4 * k, 0.55 * k, 0.55 * k, '#f8f4ea');
        ellipse(ctx, px, py + 5.8 * k, 0.8 * k, 0.9 * k, '#d84a5a');
      }
      ellipse(ctx, x, by - 4 * k - 0.4 * k, bw / 2 - 0.6 * k, bw / 4 - 0.4 * k, PURPLE); // the purple cap inside
      line(ctx, x, by - 4.4 * k, x, by - 10 * k, GOLD, 1.1 * k); // the cross on top
      line(ctx, x - 1.8 * k, by - 8.2 * k, x + 1.8 * k, by - 8.2 * k, GOLD, 1.1 * k);
      return;
    }
    case 'explorer': { // a broad straw petasos tied under the chin
      ellipse(ctx, x, top + 1.6 * k, hw * 0.95, hw * 0.42, shade('#d8b870', -0.25));
      ellipse(ctx, x, top + 1.2 * k, hw * 0.92, hw * 0.4, '#d8b870');
      ellipse(ctx, x, top - 0.6 * k, hw * 0.4, hw * 0.24, '#c8a45a');
      ellipse(ctx, x - 0.6 * k, top - 1.4 * k, hw * 0.24, hw * 0.12, '#e6cc8a');
      ring(ctx, x, top + 0.4 * k, hw * 0.42, hw * 0.2, GREEN, 0.8 * k);
      return;
    }
    default:
      return;
  }
}

// ---------------------------------------------------------------- weapons and shields

/** A spear: an ash shaft with a gilt ferrule and a leaf-shaped iron head; `pennon` adds a green-and-gold streamer. */
function spear(ctx: Ctx, x: number, y: number, k: number, len = 27, pennon = false) {
  const x0 = x - 1.6 * k, y0 = y + 7 * k, x1 = x + 2.8 * k, y1 = y - (len - 7) * k;
  line(ctx, x0, y0, x1, y1, WOOD, 1.3 * k);
  line(ctx, x0 - 0.4 * k, y0, x1 - 0.4 * k, y1, shade(WOOD, 0.4), 0.4 * k);
  poly(ctx, [x1 + 0.4 * k, y1 - 7 * k, x1 - 1.4 * k, y1 - 1.4 * k, x1 + 0.2 * k, y1 + 0.8 * k], STEEL);
  poly(ctx, [x1 + 0.4 * k, y1 - 7 * k, x1 + 2 * k, y1 - 1.2 * k, x1 + 0.2 * k, y1 + 0.8 * k], shade(STEEL, -0.3));
  line(ctx, x1 - 0.1 * k, y1 + 0.6 * k, x1 + 0.1 * k, y1 + 2 * k, GOLD, 1.6 * k);
  if (pennon) {
    const bx = x1 + 0.2 * k, by = y1 + 2.4 * k;
    poly(ctx, [bx, by, bx + 8 * k, by + 1.2 * k, bx + 6 * k, by + 2.8 * k, bx + 8 * k, by + 4.6 * k, bx - 0.2 * k, by + 4 * k], GREEN);
    poly(ctx, [bx, by + 1.6 * k, bx + 7.2 * k, by + 2.6 * k, bx + 6.8 * k, by + 3.2 * k, bx - 0.1 * k, by + 2.4 * k], GOLD);
  }
}

/** A spathion: a long straight double-edged blade with a gilt cross-guard and a disc pommel. */
function spathion(ctx: Ctx, x: number, y: number, k: number) {
  const hx = x + 0.4 * k, hy = y - 1.6 * k, tx = x + 4.4 * k, ty = y - 19 * k;
  poly(ctx, [hx - 0.9 * k, hy, tx - 0.5 * k, ty, tx + 0.3 * k, ty - 2.2 * k, tx + 0.9 * k, ty, hx + 1.1 * k, hy], STEEL);
  poly(ctx, [hx + 0.1 * k, hy, tx + 0.2 * k, ty - 1 * k, tx + 0.9 * k, ty, hx + 1.1 * k, hy], shade(STEEL, -0.28));
  line(ctx, hx + 0.1 * k, hy - 1 * k, tx - 0.1 * k, ty + 1.4 * k, shade(STEEL, -0.45), 0.35 * k); // the fuller
  line(ctx, hx - 2.6 * k, hy + 0.6 * k, hx + 2.8 * k, hy - 0.6 * k, GOLD, 1.3 * k); // the guard
  line(ctx, hx - 0.2 * k, hy + 0.6 * k, hx - 0.6 * k, hy + 3.6 * k, LEATH_D, 1.5 * k);
  ellipse(ctx, hx - 0.7 * k, hy + 4.2 * k, 1.2 * k, 1 * k, GOLD);
  ellipse(ctx, hx - 1 * k, hy + 3.9 * k, 0.45 * k, 0.4 * k, GOLD_L);
}

/** A composite recurve bow with an arrow on the string. */
function bow(ctx: Ctx, x: number, y: number, k: number) {
  const bx = x + 2 * k, top = y - 11 * k, bot = y + 7 * k;
  ctx.lineCap = 'round';
  for (const [c, wd] of [[LEATH_D, 1.8], ['#a8743a', 1.1]] as const) {
    ctx.strokeStyle = ink(c);
    ctx.lineWidth = wd * k;
    ctx.beginPath();
    ctx.moveTo(bx - 1.6 * k, top - 1.2 * k);
    ctx.quadraticCurveTo(bx + 0.6 * k, top + 0.8 * k, bx + 1.4 * k, top + 3 * k); // the recurved tip
    ctx.quadraticCurveTo(bx + 4.6 * k, (top + bot) / 2, bx + 1.4 * k, bot - 3 * k);
    ctx.quadraticCurveTo(bx + 0.6 * k, bot - 0.8 * k, bx - 1.6 * k, bot + 1.2 * k);
    ctx.stroke();
  }
  line(ctx, bx - 1.4 * k, top - 0.8 * k, bx - 1.4 * k, bot + 0.8 * k, '#f4efe0', 0.4 * k); // the string
  ellipse(ctx, bx + 3.2 * k, (top + bot) / 2, 0.9 * k, 1.4 * k, GOLD); // the gilt grip
  line(ctx, bx - 3 * k, (top + bot) / 2 + 0.2 * k, bx + 7 * k, (top + bot) / 2 - 0.4 * k, '#c9a06a', 0.6 * k); // the arrow
  poly(ctx, [bx + 7 * k, (top + bot) / 2 - 1.2 * k, bx + 9 * k, (top + bot) / 2 - 0.5 * k, bx + 7 * k, (top + bot) / 2 + 0.4 * k], STEEL);
  poly(ctx, [bx - 3 * k, (top + bot) / 2 + 0.2 * k, bx - 4.6 * k, (top + bot) / 2 - 1.2 * k, bx - 2 * k, (top + bot) / 2 - 0.2 * k], GREEN);
}

/** The labarum: Constantine's standard, a purple banner with the chi-rho on a cross-barred staff. */
function labarum(ctx: Ctx, x: number, y: number, k: number) {
  const x0 = x - 1.4 * k, y0 = y + 7 * k, x1 = x + 1.6 * k, y1 = y - 28 * k;
  line(ctx, x0, y0, x1, y1, WOOD_D, 1.4 * k);
  line(ctx, x1 - 4.6 * k, y1 + 4 * k, x1 + 4.8 * k, y1 + 3.6 * k, GOLD, 1 * k); // the cross bar
  poly(ctx, [x1 - 4.4 * k, y1 + 4.2 * k, x1 + 4.6 * k, y1 + 3.8 * k, x1 + 4.4 * k, y1 + 13 * k, x1 - 4.2 * k, y1 + 13.4 * k], PURPLE);
  poly(ctx, [x1 + 0.2 * k, y1 + 4 * k, x1 + 4.6 * k, y1 + 3.8 * k, x1 + 4.4 * k, y1 + 13 * k, x1 + 0.2 * k, y1 + 13.2 * k], PURPLE_D);
  chiRho(ctx, x1, y1 + 8.4 * k, 3 * k, GOLD, 0.7 * k);
  for (let i = 0; i < 4; i++) line(ctx, x1 - 3.6 * k + i * 2.6 * k, y1 + 13.2 * k, x1 - 3.6 * k + i * 2.6 * k, y1 + 14.6 * k, GOLD, 0.6 * k); // fringe
  ring(ctx, x1, y1 - 2 * k, 2 * k, 2 * k, GOLD, 0.8 * k); // the wreath atop the staff
  chiRho(ctx, x1, y1 - 2 * k, 1.2 * k, GOLD, 0.4 * k);
}

/** A tall kite shield (the skoutarion): green with a gold rim, the chi-rho or a cross-in-circle, and a boss. */
function kite(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  const cx = x - 1.2 * k, cy = y - 6 * k;
  const field = kind === 'swordsman' ? RED : kind === 'giant' || kind === 'knight' ? PURPLE : GREEN;
  const outline = (s: number, dx = 0, dy = 0) => {
    ctx.beginPath();
    ctx.moveTo(cx + dx, cy - 7 * k * s + dy);
    ctx.quadraticCurveTo(cx + 6 * k * s + dx, cy - 6.6 * k * s + dy, cx + 5 * k * s + dx, cy + 1 * k * s + dy);
    ctx.quadraticCurveTo(cx + 3 * k * s + dx, cy + 7 * k * s + dy, cx + dx, cy + 10.5 * k * s + dy);
    ctx.quadraticCurveTo(cx - 3 * k * s + dx, cy + 7 * k * s + dy, cx - 5 * k * s + dx, cy + 1 * k * s + dy);
    ctx.quadraticCurveTo(cx - 6 * k * s + dx, cy - 6.6 * k * s + dy, cx + dx, cy - 7 * k * s + dy);
    ctx.closePath();
  };
  outline(1, 0.8 * k, 0.6 * k); ctx.fillStyle = ink(shade(field, -0.5)); ctx.fill(); // its thickness
  outline(1); ctx.fillStyle = ink(GOLD_D); ctx.fill();
  outline(0.86); ctx.fillStyle = ink(field); ctx.fill();
  ctx.save();
  outline(0.86);
  ctx.clip();
  ctx.fillStyle = ink(shade(field, -0.22));
  ctx.fillRect(cx, cy - 8 * k, 7 * k, 20 * k); // the far half in shade
  ctx.restore();
  if (kind === 'swordsman' || kind === 'giant') chiRho(ctx, cx, cy - 0.2 * k, 3.8 * k, GOLD, 0.8 * k);
  else crossCircle(ctx, cx, cy - 0.6 * k, 2.6 * k, 2.6 * k, GOLD, 0.8 * k);
  ellipse(ctx, cx, cy - 0.4 * k, 1.1 * k, 1.1 * k, GOLD_L);
  for (const [dx, dy] of [[0, -5.6], [3.8, -4.2], [-3.8, -4.2], [3.4, 2.6], [-3.4, 2.6], [0, 8.2]] as const) ellipse(ctx, cx + dx * k, cy + dy * k, 0.42 * k, 0.42 * k, GOLD_L); // rivets on the rim
  ellipse(ctx, cx - 2.4 * k, cy - 3.4 * k, 1 * k, 1.8 * k, 'rgba(255,255,255,0.16)');
}

/** A round shield: a painted field, a gold rim, the cross-in-circle in gold and a domed boss. */
function roundShield(ctx: Ctx, x: number, y: number, k: number, field: string, device: 'cross' | 'chirho' | 'boards', r = 5.4) {
  const cx = x - 1.2 * k, cy = y - 5.4 * k, rx = r * k, ry = (r + 0.4) * k;
  ellipse(ctx, cx + 0.7 * k, cy + 0.6 * k, rx, ry, shade(field, -0.55));
  ellipse(ctx, cx, cy, rx, ry, device === 'boards' ? '#8a6a44' : GOLD_D);
  ellipse(ctx, cx, cy, rx * 0.86, ry * 0.86, field);
  if (device === 'boards') { // a Norse shield of painted boards, red and white quarters
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.86, ry * 0.86, 0, 0, Math.PI * 2);
    ctx.clip();
    for (let i = 0; i < 4; i += 2) {
      const a0 = (i / 4) * Math.PI * 2 + 0.6, a1 = a0 + Math.PI / 2;
      poly(ctx, [cx, cy, cx + Math.cos(a0) * rx * 1.3, cy + Math.sin(a0) * ry * 1.3, cx + Math.cos((a0 + a1) / 2) * rx * 1.5, cy + Math.sin((a0 + a1) / 2) * ry * 1.5, cx + Math.cos(a1) * rx * 1.3, cy + Math.sin(a1) * ry * 1.3], '#efe6d0');
    }
    for (let i = -3; i <= 3; i++) line(ctx, cx + i * rx * 0.26, cy - ry, cx + i * rx * 0.26, cy + ry, 'rgba(60,30,20,0.25)', 0.35 * k);
    ctx.restore();
  } else if (device === 'chirho') chiRho(ctx, cx, cy, rx * 0.6, GOLD, 0.8 * k);
  else crossCircle(ctx, cx, cy, rx * 0.4, ry * 0.4, GOLD, 0.8 * k);
  ellipse(ctx, cx, cy, 1.6 * k, 1.7 * k, shade(IRON, -0.2));
  ellipse(ctx, cx, cy, 1.2 * k, 1.3 * k, device === 'boards' ? STEEL : GOLD);
  ellipse(ctx, cx - 0.4 * k, cy - 0.5 * k, 0.45 * k, 0.45 * k, '#ffffff');
  ellipse(ctx, cx - 2 * k, cy - 2.8 * k, 1 * k, 1.5 * k, 'rgba(255,255,255,0.16)');
}

function weapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  switch (kind) {
    case 'warrior':
      spear(ctx, x, y, k, 24);
      roundShield(ctx, b.off.x, b.off.y, k, GREEN, 'cross');
      return true;
    case 'archer':
      bow(ctx, x, y, k);
      return true;
    case 'defender': // the kite shield is drawn afterwards, like everyone's
      spear(ctx, x, y, k, 30, true);
      return true;
    case 'swordsman':
      spathion(ctx, x, y, k);
      kite(ctx, kind, b.off.x, b.off.y, k);
      return true;
    case 'giant':
      labarum(ctx, x, y, k);
      kite(ctx, kind, b.off.x, b.off.y, k);
      return true;
    case 'explorer': { // a pilgrim's staff topped with a small cross
      line(ctx, x - 1 * k, y + 7 * k, x + 1.4 * k, y - 16 * k, WOOD, 1.2 * k);
      line(ctx, x + 1.4 * k, y - 16 * k, x + 1.6 * k, y - 19 * k, GOLD, 0.8 * k);
      line(ctx, x + 0.2 * k, y - 18 * k, x + 2.8 * k, y - 18.2 * k, GOLD, 0.8 * k);
      return true;
    }
  }
  return false;
}

function shield(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number): boolean {
  if (kind === 'defender' || kind === 'swordsman' || kind === 'giant') { kite(ctx, kind, x, y, k); return true; }
  roundShield(ctx, x, y, k, GREEN, 'cross');
  return true;
}

// ---------------------------------------------------------------- the Varangian Guard

/** A long Dane axe held in both hands: an ash haft taller than a man and a broad bearded blade. */
function daneAxe(ctx: Ctx, b: Body, k: number) {
  const { x, y } = b.hand;
  const x0 = x - 3 * k, y0 = y + 9 * k, x1 = x + 7 * k, y1 = y - 22 * k;
  line(ctx, x0, y0, x1, y1, WOOD_D, 1.7 * k);
  line(ctx, x0 - 0.5 * k, y0, x1 - 0.5 * k, y1, shade(WOOD, 0.3), 0.5 * k);
  for (const t of [0.42, 0.5]) line(ctx, x0 + (x1 - x0) * t - 1 * k, y0 + (y1 - y0) * t, x0 + (x1 - x0) * t + 1 * k, y0 + (y1 - y0) * t - 0.3 * k, LEATH_D, 0.8 * k); // the wrapped grip
  // the blade: a long crescent edge swept down into a beard, bright at the edge
  const hx = x1 - 0.6 * k, hy = y1 + 2 * k;
  poly(ctx, [hx, hy - 1.6 * k, hx + 3 * k, hy - 3 * k, hx + 7.4 * k, hy - 6.4 * k, hx + 8.6 * k, hy + 1 * k, hx + 7 * k, hy + 7.4 * k, hx + 3 * k, hy + 3 * k, hx, hy + 1.6 * k], shade(STEEL, -0.15));
  poly(ctx, [hx + 2 * k, hy - 1 * k, hx + 6.4 * k, hy - 5 * k, hx + 7.4 * k, hy + 1 * k, hx + 6 * k, hy + 5.8 * k, hx + 2.4 * k, hy + 2 * k], STEEL);
  curve(ctx, hx + 7.4 * k, hy - 6.4 * k, hx + 9.6 * k, hy + 0.4 * k, hx + 7 * k, hy + 7.4 * k, 0.6 * k, '#f4f8fc'); // the honed edge
  for (let i = 0; i < 3; i++) ellipse(ctx, hx + 3.6 * k + i * 1 * k, hy - 0.4 * k + i * 0.3 * k, 0.3 * k, 0.3 * k, GOLD); // inlaid knotwork
  ellipse(ctx, hx + 0.2 * k, hy, 1.2 * k, 1.8 * k, IRON_D); // the socket
  line(ctx, x1, y1, x1 + 0.4 * k, y1 - 1.4 * k, IRON_D, 1.4 * k);
}

function varangian(ctx: Ctx, x: number, y: number) {
  const k = 1.1; // tall northerners
  // a round board shield slung on the back, and the red cloak of the guard
  roundShield(ctx, x - 5 * k, y - 4 * k, k, RED, 'boards', 5);
  const hip = y - 5 * k, top = hip - 8.5 * k + 1 * k;
  poly(ctx, [x - 4.4 * k, top, x + 1.4 * k, top - 0.6 * k, x - 1.6 * k, hip + 9 * k, x - 10.4 * k, hip + 7 * k], RED_D);
  poly(ctx, [x - 4.4 * k, top, x - 7 * k, top + 3 * k, x - 10.4 * k, hip + 7 * k, x - 7.4 * k, hip + 2 * k], RED);
  line(ctx, x - 10.4 * k, hip + 7 * k, x - 1.6 * k, hip + 9 * k, GOLD, 0.9 * k); // a woven gold hem
  const b = figure(ctx, 'varangian', 'byzantium', x, y, k);
  ellipse(ctx, x + 2.6 * k, top - 1 * k, 2 * k, 1 * k, GOLD); // a gilt penannular brooch pinning the cloak
  ring(ctx, x + 2.6 * k, top - 1 * k, 1.6 * k, 0.8 * k, GOLD_D, 0.4 * k);
  daneAxe(ctx, b, k);
}

// ---------------------------------------------------------------- kataphraktoi

/** The barding of the heavy horse: rows of scales over the neck, chest and flanks, a chamfron and a purple caparison. */
function barding(ctx: Ctx, kind: UnitKind, x: number, y: number, kh: number) {
  const hx0 = x - 1, hy0 = y + 3;
  const knight = kind === 'knight';
  const bx = hx0, by = hy0 - 6 * kh, bw = 17 * kh, bh = 7 * kh;
  if (knight) {
    scales(ctx, bx, by, bw, bh, 0.12, 0.96, 4, '#7a828c', 7); // the scale trapper over the body
    band(ctx, bx, by, bw, bh, 0.06, 0.16, PURPLE);
    band(ctx, bx, by, bw, bh, 0.06, 0.09, GOLD);
    scales(ctx, hx0 + 7.5 * kh, hy0 - 10 * kh, 5 * kh, 7 * kh, 0.1, 1, 4, '#7a828c', 3); // over the neck
    const hhx = hx0 + 10.5 * kh, hhy = hy0 - 15 * kh; // a gilt chamfron over the face
    faceQuad(ctx, 'R', hhx, hhy, 7 * kh, 5 * kh, 0.06, 0.72, 0.28, 1, IRON);
    faceQuad(ctx, 'R', hhx, hhy, 7 * kh, 5 * kh, 0.06, 0.72, 0.86, 1, GOLD);
    faceQuad(ctx, 'R', hhx, hhy, 7 * kh, 5 * kh, 0.3, 0.42, 0.3, 0.86, GOLD);
    poly(ctx, [hhx + 1, hhy - 4.6, hhx - 0.4, hhy - 8.6, hhx + 2, hhy - 5], PURPLE_L); // a plume between the ears
  } else {
    // the light horse: a green saddle cloth with a gold border and a breast strap with gilt phalerae
    band(ctx, bx - 1 * kh, by, 10 * kh, bh, 0.5, 0.95, GREEN);
    band(ctx, bx - 1 * kh, by, 10 * kh, bh, 0.5, 0.58, GOLD);
    line(ctx, x + 3.5, y - 9.6, x + 8, y - 3.4, LEATH_D, 1.2);
    for (let i = 0; i < 3; i++) { const t = (i + 0.5) / 3; ellipse(ctx, x + 3.5 + 4.5 * t, y - 9.6 + 6.2 * t + 1, 1, 1, GOLD); ellipse(ctx, x + 3.3 + 4.5 * t, y - 9.6 + 6.2 * t + 0.7, 0.4, 0.4, GOLD_L); }
  }
}

/** A long kontos lance with a gilt head and, for the heavy horse, a purple streamer bearing a gold cross. */
function kontos(ctx: Ctx, hx: number, hy: number, heavy: boolean) {
  const x0 = hx - 4, y0 = hy + 7, tx = hx + 9, ty = hy - 22;
  line(ctx, x0, y0, tx, ty, WOOD, heavy ? 1.9 : 1.5);
  line(ctx, x0 - 0.5, y0, tx - 0.5, ty, shade(WOOD, 0.4), 0.5);
  poly(ctx, [tx + 0.6, ty - 6, tx - 1.4, ty + 0.6, tx + 0.6, ty + 1.2], STEEL);
  poly(ctx, [tx + 0.6, ty - 6, tx + 2.2, ty + 0.2, tx + 0.6, ty + 1.2], shade(STEEL, -0.3));
  line(ctx, tx, ty + 1, tx - 0.2, ty + 2.4, GOLD, 1.8);
  const c = heavy ? PURPLE : GREEN, bx = tx - 0.2, by = ty + 2.6;
  poly(ctx, [bx, by, bx + 11, by + 1.8, bx + 8, by + 4.4, bx + 11, by + 7.2, bx - 0.4, by + 6.4], c);
  poly(ctx, [bx - 0.4, by + 6.4, bx + 11, by + 7.2, bx + 10.2, by + 6.2, bx - 0.3, by + 5.4], shade(c, -0.32));
  line(ctx, bx + 3.6, by + 1.4, bx + 3.4, by + 5.6, GOLD, 0.8);
  line(ctx, bx + 1.8, by + 3.2, bx + 5.4, by + 3.6, GOLD, 0.8);
}

function rider(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  const knight = kind === 'knight';
  const saddle = drawHorse(ctx, x - 1, y + 3, 0.92, knight ? '#3e2c22' : '#8a5634', '#1a120c', undefined, knight ? PURPLE : GREEN);
  barding(ctx, kind, x, y, 0.92);
  const b = figure(ctx, kind, 'byzantium', saddle.x, saddle.y, 0.9, true);
  if (kind === 'horsearcher') return bow(ctx, b.hand.x, b.hand.y, 0.9);
  if (knight) kite(ctx, kind, b.off.x - 1.5, b.off.y + 1.5, 0.66);
  else roundShield(ctx, b.off.x - 1.5, b.off.y + 1.5, 0.7, GREEN, 'cross');
  kontos(ctx, b.hand.x, b.hand.y, knight);
}

// ---------------------------------------------------------------- the traction trebuchet

function trebuchet(ctx: Ctx, x: number, y: number) {
  // a heap of dressed stone shot and a coil of rope
  for (const [ax, ay, ar] of [[15, 5, 2.2], [18.4, 6, 1.9], [16.6, 3, 1.8], [12.6, 6.6, 1.5]] as const) {
    ellipse(ctx, x + ax, y + ay, ar, ar * 0.85, '#8d8576');
    ellipse(ctx, x + ax - ar * 0.3, y + ay - ar * 0.3, ar * 0.45, ar * 0.35, '#c4bba8');
  }
  // the base: two sole beams crossed under a deck, iron-shod
  box(ctx, x - 1, y + 3, 28, 3, WOOD, shade(WOOD, 0.25));
  for (const u of [0.12, 0.88]) { faceQuad(ctx, 'R', x - 1, y + 3, 28, 3, u, u + 0.05, 0, 1, IRON_D); faceQuad(ctx, 'L', x - 1, y + 3, 28, 3, u, u + 0.05, 0, 1, IRON_D); }
  band(ctx, x - 1, y + 3, 28, 3, 0.4, 0.6, GREEN);
  // the frame: an A of two pairs of posts with braces, holding the axle high
  const A: [number, number] = [x + 1, y - 27];
  for (const [bx, by] of [[x - 8, y - 1], [x + 11, y - 1]] as const) {
    line(ctx, bx, by, A[0] + (bx < x ? -1.4 : 1.4), A[1], WOOD_D, 2.8);
    line(ctx, bx - 0.5, by, A[0] + (bx < x ? -1.4 : 1.4) - 0.5, A[1], WOOD, 1.6);
  }
  line(ctx, x - 6, y - 9, x + 9, y - 10, WOOD_D, 1.4);
  line(ctx, x - 3.6, y - 18, x + 6.4, y - 18.6, WOOD_D, 1.3);
  for (const t of [0.3, 0.6]) line(ctx, x - 8 + 9 * t, y - 1 - 26 * t, x + 11 - 10 * t, y - 1 - 26 * t, IRON_D, 0.5); // iron straps
  line(ctx, A[0] - 4.4, A[1] + 0.4, A[0] + 4.6, A[1] - 0.4, WOOD_D, 2.4); // the axle, its ends capped in iron
  for (const dx of [-4.4, 4.6]) ellipse(ctx, A[0] + dx, A[1] + (dx > 0 ? -0.4 : 0.4), 1.1, 1.1, IRON);
  // the beam: a long throwing arm swung back, a short arm forward with the pulling ropes
  const tip: [number, number] = [x - 18, y - 44], pull: [number, number] = [x + 11, y - 17];
  line(ctx, A[0] + 1.4, A[1] - 1, tip[0], tip[1], WOOD_D, 3.4);
  line(ctx, A[0] + 1.2, A[1] - 1.6, tip[0] + 0.4, tip[1] - 0.4, WOOD, 2);
  line(ctx, A[0] + 0.6, A[1] - 2.4, tip[0] + 1, tip[1] - 0.6, shade(WOOD, 0.45), 0.5);
  for (const t of [0.3, 0.5, 0.7]) { const px = A[0] + (tip[0] - A[0]) * t, py = A[1] - 1 + (tip[1] - A[1] + 1) * t; line(ctx, px - 1.2, py + 0.6, px + 1.2, py - 0.6, t === 0.5 ? GOLD : IRON_D, 1); }
  line(ctx, A[0] + 1, A[1], pull[0], pull[1], WOOD_D, 2.8);
  for (let i = 0; i < 6; i++) { // the pulling ropes down to the crew's toggles
    const px = pull[0] - 1.4 + i * 0.7, ex = x + 4 + i * 3.2, ey = y + 1.6 + (i % 2) * 2;
    curve(ctx, px, pull[1] + 0.6, (px + ex) / 2 + 1, (pull[1] + ey) / 2 - 1, ex, ey, 0.7, i % 2 ? '#a08a62' : '#c4ad80');
    ellipse(ctx, ex, ey + 0.4, 0.8, 0.5, WOOD_D);
  }
  // the sling: two cords from the tip to a leather pouch on the trough, with a stone in it
  const pouch: [number, number] = [x - 16, y - 1.6];
  curve(ctx, tip[0], tip[1], tip[0] - 5, (tip[1] + pouch[1]) / 2, pouch[0] - 2.4, pouch[1] - 1, 0.6, '#a08a62');
  curve(ctx, tip[0], tip[1], tip[0] + 5, (tip[1] + pouch[1]) / 2, pouch[0] + 2.8, pouch[1] - 1, 0.6, '#a08a62');
  ellipse(ctx, pouch[0], pouch[1] + 0.4, 3.6, 2.2, LEATH_D);
  ellipse(ctx, pouch[0], pouch[1], 3.3, 2, LEATH);
  ellipse(ctx, pouch[0], pouch[1] - 0.8, 1.8, 1.5, '#8d8576');
  ellipse(ctx, pouch[0] - 0.5, pouch[1] - 1.3, 0.7, 0.6, '#c4bba8');
  ellipse(ctx, tip[0], tip[1], 1.5, 1.5, IRON);
  // a green banner with the gold cross-in-circle flies over the frame
  line(ctx, A[0] + 3.4, A[1] - 2, A[0] + 3.8, A[1] - 13, WOOD_D, 1);
  poly(ctx, [A[0] + 3.8, A[1] - 13, A[0] + 12.4, A[1] - 11.6, A[0] + 10, A[1] - 9, A[0] + 12.4, A[1] - 6.4, A[0] + 3.8, A[1] - 7], GREEN);
  poly(ctx, [A[0] + 3.8, A[1] - 8.4, A[0] + 12, A[1] - 7.2, A[0] + 12.4, A[1] - 6.4, A[0] + 3.8, A[1] - 7], GREEN_D);
  crossCircle(ctx, A[0] + 7.6, A[1] - 10, 1.6, 1.6, GOLD, 0.5);
  ellipse(ctx, A[0] + 3.8, A[1] - 13.4, 0.8, 0.8, GOLD);
}

// ---------------------------------------------------------------- dromons

/** A lateen sail on a slanting yard, from the mast at (mx, my) up: linen in vertical cloths, a device painted on it. */
function lateen(ctx: Ctx, mx: number, my: number, s: number, device: 'cross' | 'chirho' | 'stripe') {
  const yb: [number, number] = [mx - 12 * s, my - 4 * s], yt: [number, number] = [mx + 9 * s, my - 30 * s]; // the yard's two ends
  const clew: [number, number] = [mx + 6 * s, my - 2 * s];
  line(ctx, mx, my + 4 * s, mx, my - 22 * s, WOOD_D, 1.3 * s); // the mast
  // the sail bellies out, a little darker towards the back
  ctx.beginPath();
  ctx.moveTo(yb[0], yb[1]);
  ctx.lineTo(yt[0], yt[1]);
  ctx.quadraticCurveTo(mx + 13 * s, my - 13 * s, clew[0], clew[1]);
  ctx.quadraticCurveTo(mx - 3 * s, my - 4 * s, yb[0], yb[1]);
  ctx.closePath();
  ctx.fillStyle = ink('#efe4c8');
  ctx.fill();
  ctx.save();
  ctx.clip();
  for (let i = 0; i < 6; i++) { // the cloths of the sail
    const t = i / 6;
    line(ctx, yb[0] + (yt[0] - yb[0]) * t, yb[1] + (yt[1] - yb[1]) * t, clew[0] - 6 * s + t * 6 * s, clew[1] + 2 * s, 'rgba(120,96,60,0.28)', 0.5 * s);
  }
  poly(ctx, [mx - 2 * s, my - 2 * s, clew[0] + 3 * s, clew[1] + 2 * s, mx + 14 * s, my - 18 * s, mx + 6 * s, my - 22 * s], 'rgba(90,70,40,0.16)'); // shade on the belly
  if (device === 'stripe') {
    poly(ctx, [yb[0], yb[1] + 2 * s, yt[0], yt[1] + 2 * s, yt[0], yt[1] + 5 * s, yb[0], yb[1] + 5 * s], RED);
  } else if (device === 'chirho') {
    chiRho(ctx, mx + 2.6 * s, my - 13 * s, 4.6 * s, RED, 1.1 * s);
  } else {
    crossCircle(ctx, mx + 2.6 * s, my - 13 * s, 3.4 * s, 3.4 * s, RED, 1 * s);
  }
  ctx.restore();
  line(ctx, yb[0], yb[1], yt[0], yt[1], WOOD_D, 1.1 * s); // the yard
  line(ctx, clew[0], clew[1], clew[0] + 4 * s, my + 2 * s, '#8a7a5a', 0.4 * s); // the sheet
  line(ctx, yb[0], yb[1], yb[0] + 1 * s, my + 1 * s, '#8a7a5a', 0.4 * s);
}

/** A hull in side view: a long low dromon, its ram-like spur at the bow, a green wale and a gold band. */
function hull(ctx: Ctx, x: number, y: number, len: number, s: number, rowers: number) {
  const a = x - len, b = x + len;
  poly(ctx, [a - 1 * s, y - 7 * s, b - 2 * s, y - 7.4 * s, b + 5 * s, y - 2.6 * s, b - 4 * s, y + 3.4 * s, a + 5 * s, y + 3.4 * s], '#3a2414'); // the hull below the wale
  poly(ctx, [a - 1 * s, y - 7 * s, b - 2 * s, y - 7.4 * s, b + 1 * s, y - 4.8 * s, a + 1.6 * s, y - 4 * s], WOOD); // the upper strakes
  poly(ctx, [a + 1.6 * s, y - 4 * s, b + 1 * s, y - 4.8 * s, b + 0.4 * s, y - 3.6 * s, a + 2.4 * s, y - 2.8 * s], GREEN); // the green wale
  line(ctx, a + 2 * s, y - 3.2 * s, b + 0.6 * s, y - 4 * s, GOLD, 0.6 * s);
  poly(ctx, [b + 1 * s, y - 2.8 * s, b + 8 * s, y - 1.2 * s, b + 1 * s, y + 0.2 * s], IRON_D); // the spur
  poly(ctx, [a - 1 * s, y - 7 * s, a - 5 * s, y - 13 * s, a - 3.6 * s, y - 13.4 * s, a + 1 * s, y - 7 * s], WOOD); // the sternpost curling up
  ellipse(ctx, a - 4.6 * s, y - 13.6 * s, 1 * s, 1 * s, GOLD);
  for (let i = 0; i < rowers; i++) { // the oars, dipping into the water
    const ox = a + 5 * s + (i * (2 * len - 9 * s)) / Math.max(1, rowers - 1);
    line(ctx, ox, y - 2.2 * s, ox - 3 * s, y + 5.6 * s, shade(WOOD, 0.2), 0.7 * s);
    ellipse(ctx, ox - 3.2 * s, y + 5.8 * s, 0.7 * s, 1.3 * s, shade(WOOD, 0.1));
    ellipse(ctx, ox, y - 2.2 * s, 0.45 * s, 0.45 * s, '#1a1008'); // the oar port
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.ellipse(x + 2, y + 3.8 * s, len * 0.85, 2.2, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.stroke();
}

/** The siphon at the bow: a bronze tube with a lion's mouth, and a puff of flame. */
function siphon(ctx: Ctx, x: number, y: number, s: number) {
  box(ctx, x - 1 * s, y, 4 * s, 3 * s, WOOD_D, shade(WOOD, 0.2)); // the bow platform
  line(ctx, x - 1 * s, y - 3.4 * s, x + 6 * s, y - 5 * s, BRONZE, 2 * s);
  line(ctx, x - 1 * s, y - 3.9 * s, x + 6 * s, y - 5.5 * s, shade(BRONZE, 0.4), 0.6 * s);
  ellipse(ctx, x + 6.6 * s, y - 5.1 * s, 1.5 * s, 1.4 * s, GOLD); // the lion's head
  ellipse(ctx, x + 7.4 * s, y - 5 * s, 0.6 * s, 0.6 * s, '#3a1a08');
  for (const [dx, dy, r, c] of [[10, -6, 2.2, '#e8552a'], [12.4, -6.6, 1.6, '#ff9a2e'], [9.4, -5.8, 1.1, '#ffe27a']] as const) ellipse(ctx, x + dx * s, y + dy * s, r * s, r * 0.7 * s, c);
}

function crew(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) { figure(ctx, kind, 'byzantium', x, y, k, true); }

function dromon(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  if (kind === 'boat') {
    // a small chelandion: one lateen sail, a steersman and a soldier
    hull(ctx, x - 2, y, 13, 0.85, 4);
    lateen(ctx, x - 1, y - 6, 0.68, 'cross');
    crew(ctx, 'warrior', x + 7, y - 6.4, 0.46);
    crew(ctx, 'explorer', x - 11, y - 6, 0.44);
    return;
  }
  if (kind === 'ship') {
    // a galley-dromon: a single great lateen with the chi-rho, oars, shields along the rail
    hull(ctx, x - 1, y, 19, 1, 6);
    for (let i = 0; i < 5; i++) { // shields along the rail
      const sx = x - 14 + i * 6.4;
      ellipse(ctx, sx, y - 6.8, 1.9, 2, GOLD_D);
      ellipse(ctx, sx, y - 6.8, 1.5, 1.6, i % 2 ? GREEN : RED);
      ellipse(ctx, sx, y - 6.8, 0.5, 0.5, GOLD_L);
    }
    lateen(ctx, x + 1, y - 7, 0.86, 'chirho');
    crew(ctx, 'archer', x + 12, y - 7.2, 0.46);
    crew(ctx, 'warrior', x - 13, y - 7, 0.46);
    return;
  }
  // the war dromon: two lateens, a fighting castle amidships, the siphon at the bow and the purple imperial banner astern
  hull(ctx, x - 2, y, 23, 1.08, 8);
  for (let i = 0; i < 7; i++) {
    const sx = x - 20 + i * 6.4;
    ellipse(ctx, sx, y - 7.2, 1.9, 2, GOLD_D);
    ellipse(ctx, sx, y - 7.2, 1.5, 1.6, i % 2 ? GREEN : PURPLE);
    ellipse(ctx, sx, y - 7.2, 0.5, 0.5, GOLD_L);
  }
  box(ctx, x - 3, y - 7.6, 8, 5, WOOD, shade(WOOD, 0.25)); // the xylokastron, a wooden fighting tower
  band(ctx, x - 3, y - 7.6, 8, 5, 0.8, 1, GREEN);
  for (const u of [0.15, 0.55]) { faceQuad(ctx, 'R', x - 3, y - 7.6, 8, 5, u, u + 0.2, 0.84, 1.2, WOOD_D); faceQuad(ctx, 'L', x - 3, y - 7.6, 8, 5, u, u + 0.2, 0.84, 1.2, WOOD_D); }
  lateen(ctx, x - 11, y - 7.6, 0.78, 'stripe');
  lateen(ctx, x + 7, y - 7.8, 0.92, 'cross');
  crew(ctx, 'archer', x - 3, y - 13, 0.42);
  siphon(ctx, x + 19, y - 6.6, 1);
  crew(ctx, 'defender', x + 15, y - 7.6, 0.44);
  // the imperial banner on the sternpost
  const px = x - 27, py = y - 14;
  line(ctx, px, py + 2, px, py - 9, WOOD_D, 0.9);
  poly(ctx, [px, py - 9, px - 8, py - 8, px - 6.4, py - 6, px - 8, py - 4, px, py - 4.6], PURPLE);
  ellipse(ctx, px - 3.4, py - 6.6, 1, 1, GOLD);
}

// ---------------------------------------------------------------- buildings

/** A dome: a half-ellipse on the base line at y, shaded towards the right, with ribs and a gilt cross. */
function dome(ctx: Ctx, x: number, y: number, r: number, h: number, c: string, cross = true, windows = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, r, h, 0, Math.PI, Math.PI * 2);
  ctx.ellipse(x, y, r, r * 0.42, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fillStyle = ink(c);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = ink(shade(c, -0.24));
  ctx.fillRect(x + r * 0.15, y - h - 1, r, h + r);
  ctx.fillStyle = ink(shade(c, 0.28));
  ctx.beginPath();
  ctx.ellipse(x - r * 0.42, y - h * 0.55, r * 0.22, h * 0.32, -0.4, 0, Math.PI * 2);
  ctx.fill();
  for (const t of [-0.66, -0.33, 0, 0.33, 0.66]) curve(ctx, x + t * r, y + r * 0.42 * Math.sqrt(1 - t * t), x + t * r * 0.9, y - h * 0.7, x, y - h, 0.35, shade(c, -0.3)); // the ribs
  ctx.restore();
  for (let i = 0; i < windows; i++) { // a ring of small windows round its foot
    const t = -0.8 + (1.6 * i) / Math.max(1, windows - 1);
    const wx = x + t * r * 0.92, wy = y + r * 0.42 * Math.sqrt(1 - t * t) * 0.6 - h * 0.12;
    ellipse(ctx, wx, wy, 0.32, 0.6, '#6a5030');
  }
  if (cross) {
    line(ctx, x, y - h, x, y - h - 4, GOLD, 0.8);
    line(ctx, x - 1.4, y - h - 2.8, x + 1.4, y - h - 2.8, GOLD, 0.7);
    ellipse(ctx, x, y - h - 0.2, 0.8, 0.5, GOLD);
  }
}

/** A round drum under a dome: a short cylinder with arched windows. */
function drum(ctx: Ctx, x: number, y: number, r: number, h: number, c: string, windows = 4) {
  ellipse(ctx, x, y, r, r * 0.42, shade(c, -0.3));
  poly(ctx, [x - r, y, x - r, y - h, x, y - h, x, y], shade(c, 0.06));
  poly(ctx, [x, y, x, y - h, x + r, y - h, x + r, y], shade(c, -0.18));
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.42, 0, 0, Math.PI);
  ctx.fillStyle = ink(shade(c, -0.08));
  ctx.fill();
  ellipse(ctx, x, y - h, r, r * 0.42, shade(c, 0.2));
  for (let i = 0; i < windows; i++) {
    const t = -0.7 + (1.4 * i) / Math.max(1, windows - 1);
    const wx = x + t * r, wy = y + r * 0.42 * Math.sqrt(1 - t * t) - h * 0.25;
    archWin(ctx, wx, wy, Math.min(0.6, r * 0.14), h * 0.46, '#4a3a30');
  }
  line(ctx, x - r, y - h + 0.4, x + r, y - h + 0.4, BRICK, 0.5);
}

/** An arched window or door: a small upright opening with a round top. */
function archWin(ctx: Ctx, x: number, y: number, w: number, h: number, c: string) {
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.lineTo(x - w, y - h + w);
  ctx.arc(x, y - h + w, w, Math.PI, 0);
  ctx.lineTo(x + w, y);
  ctx.closePath();
  ctx.fillStyle = ink(c);
  ctx.fill();
}

/** An arched opening on one side of a box (face coordinates), with a brick voussoir round it. */
function faceArch(ctx: Ctx, face: 'L' | 'R', cx: number, cy: number, w: number, h: number, u: number, v: number, aw: number, ah: number, c = '#2a2420') {
  const [px, py] = pt(face, cx, cy, w, h, u, v);
  const ww = (aw * w) / 2 / 2, hh = ah * h;
  archWin(ctx, px, py, ww + 0.5, hh + 0.5, BRICK);
  archWin(ctx, px, py, ww, hh, c);
}

/** Banded masonry: the courses of red brick laid between the stone, as on the Theodosian Walls. */
function banded(ctx: Ctx, x: number, y: number, w: number, h: number, every: number) {
  for (let v = every; v < 0.95; v += every) band(ctx, x, y, w, h, v, v + 0.06, BRICK);
}

/** A tiled hip roof in terracotta, with tile courses. */
function tiledRoof(ctx: Ctx, x: number, y: number, w: number, h: number, c = TILE) {
  roof(ctx, x, y, w + 1.6, h, c);
  for (let i = 1; i < 4; i++) {
    const t = i / 4;
    line(ctx, x - (w + 1.6) / 2 * (1 - t), y - h * t + ((w + 1.6) / 4) * (1 - t) * 0 , x, y + (w + 1.6) / 4 * (1 - t) - h * t, shade(c, -0.25), 0.4);
    line(ctx, x + (w + 1.6) / 2 * (1 - t), y - h * t, x, y + (w + 1.6) / 4 * (1 - t) - h * t, shade(c, -0.45), 0.4);
  }
}

function house(ctx: Ctx, x: number, y: number, w: number, h: number, wall: string, roofC: string, storeys = 1) {
  ellipse(ctx, x + 1, y + 1.6, w * 0.7, w * 0.3, 'rgba(0,0,0,0.16)');
  box(ctx, x, y, w, h, wall);
  band(ctx, x, y, w, h, 0, 0.1, shade(wall, -0.2));
  for (let s = 0; s < storeys; s++) {
    const v = 0.14 + (s * 0.85) / storeys;
    faceArch(ctx, 'R', x, y, w, h, 0.3, v, 0.18, 0.5 / storeys);
    faceArch(ctx, 'R', x, y, w, h, 0.72, v, 0.18, 0.5 / storeys);
    faceArch(ctx, 'L', x, y, w, h, 0.5, v, 0.2, 0.46 / storeys, '#3a3028');
  }
  if (storeys > 1) band(ctx, x, y, w, h, 0.5, 0.55, BRICK);
  tiledRoof(ctx, x, y - h, w, w * 0.32, roofC);
}

/** A small cross-in-square church: brick-banded walls, an arched door, a drum and a gilded dome. */
function chapel(ctx: Ctx, x: number, y: number, s: number, domeC: string) {
  ellipse(ctx, x + 1, y + 1.8, 9 * s, 3.6 * s, 'rgba(0,0,0,0.16)');
  const w = 11 * s, h = 7 * s;
  box(ctx, x, y, w, h, STONE);
  banded(ctx, x, y, w, h, 0.3);
  faceArch(ctx, 'R', x, y, w, h, 0.5, 0, 0.3, 0.62, '#3a2a20');
  faceArch(ctx, 'L', x, y, w, h, 0.5, 0.32, 0.2, 0.42);
  tiledRoof(ctx, x, y - h, w, 2.4 * s);
  drum(ctx, x, y - h - 1.2 * s, 3.2 * s, 3 * s, STONE, 3);
  dome(ctx, x, y - h - 4.2 * s, 3.2 * s, 3.4 * s, domeC);
}

/** An arcaded stoa: columns under a tiled roof, a market behind. */
function stoa(ctx: Ctx, x: number, y: number) {
  ellipse(ctx, x + 1, y + 1.8, 9, 3.4, 'rgba(0,0,0,0.16)');
  box(ctx, x, y, 12, 1.2, STONE, shade(STONE, 0.15)); // the stylobate
  box(ctx, x - 1, y - 1.6, 8, 6, '#c9b896'); // the back wall
  for (let i = 0; i < 4; i++) { // the columns along the front
    const [cx, cy] = pt('R', x, y - 1.2, 12, 6, 0.08 + i * 0.28, 0);
    line(ctx, cx, cy, cx, cy - 6, '#f4ecd8', 1.4);
    line(ctx, cx + 0.4, cy, cx + 0.4, cy - 6, '#c9bca0', 0.5);
    ellipse(ctx, cx, cy - 6.2, 1.2, 0.6, '#f4ecd8');
  }
  for (const [ax, c] of [[0.22, GREEN], [0.5, RED]] as const) { // awnings over the stalls
    const [px, py] = pt('R', x, y - 1.2, 12, 6, ax, 0.4);
    poly(ctx, [px - 1.6, py - 1, px + 1.6, py - 1.8, px + 2, py, px - 1.2, py + 0.8], c);
  }
  tiledRoof(ctx, x, y - 7.6, 12, 3);
}

/** A long, thin run of wall along the map's left-to-front axis: `n` short blocks of thickness `t`, banded and crenellated. */
function wallRun(ctx: Ctx, x0: number, y0: number, n: number, t: number, h: number) {
  for (let i = 0; i < n; i++) {
    const bx = x0 + (i * t) / 2, by = y0 + (i * t) / 4;
    box(ctx, bx, by, t, h, STONE);
    banded(ctx, bx, by, t, h, 0.4);
    if (i % 2 === 0) box(ctx, bx, by - h, t * 0.7, 1.2, STONE); // a merlon
  }
}

/** A stretch of wall with a square tower: stone banded with brick, battlements, a gilt-and-green flag. */
function wallTower(ctx: Ctx, x: number, y: number, s: number) {
  ellipse(ctx, x + 1, y + 2, 10 * s, 3.6 * s, 'rgba(0,0,0,0.16)');
  wallRun(ctx, x - 10 * s, y - 4 * s, 7, 2.6 * s, 4.6 * s);
  box(ctx, x + 2 * s, y + 1 * s, 6 * s, 11 * s, STONE);
  banded(ctx, x + 2 * s, y + 1 * s, 6 * s, 11 * s, 0.24);
  faceArch(ctx, 'R', x + 2 * s, y + 1 * s, 6 * s, 11 * s, 0.5, 0.6, 0.3, 0.2);
  faceArch(ctx, 'L', x + 2 * s, y + 1 * s, 6 * s, 11 * s, 0.5, 0.6, 0.3, 0.2);
  faceArch(ctx, 'R', x + 2 * s, y + 1 * s, 6 * s, 11 * s, 0.5, 0, 0.36, 0.3, '#3a2a20');
  for (let i = 0; i < 3; i++) { faceQuad(ctx, 'R', x + 2 * s, y - 10 * s, 6 * s, 1.4 * s, i * 0.36, i * 0.36 + 0.2, 0, 1, STONE); faceQuad(ctx, 'L', x + 2 * s, y - 10 * s, 6 * s, 1.4 * s, i * 0.36, i * 0.36 + 0.2, 0, 1, STONE); }
  line(ctx, x + 2 * s, y - 11 * s, x + 2 * s, y - 18 * s, WOOD_D, 0.7);
  poly(ctx, [x + 2 * s, y - 18 * s, x + 7 * s, y - 17 * s, x + 2 * s, y - 15 * s], GREEN);
  poly(ctx, [x + 2 * s, y - 16.6 * s, x + 5.4 * s, y - 16.2 * s, x + 2 * s, y - 15.6 * s], GOLD);
}

/** A great domed church: a cross-in-square of banded masonry, four corner domes round a high central drum. */
function church(ctx: Ctx, x: number, y: number, domeC: string) {
  ellipse(ctx, x + 1, y + 2.4, 15, 6, 'rgba(0,0,0,0.18)');
  const w = 18, h = 10;
  box(ctx, x, y, w, h, STONE);
  banded(ctx, x, y, w, h, 0.25);
  faceArch(ctx, 'R', x, y, w, h, 0.5, 0, 0.18, 0.56, '#3a2a20'); // the west door
  for (const u of [0.18, 0.82]) faceArch(ctx, 'R', x, y, w, h, u, 0.36, 0.1, 0.4);
  for (const u of [0.25, 0.5, 0.75]) faceArch(ctx, 'L', x, y, w, h, u, 0.36, 0.1, 0.4);
  // gabled arms of the cross on the roof
  tiledRoof(ctx, x, y - h, w, 3);
  box(ctx, x, y - h - 0.6, 10, 3, STONE);
  for (const [dx, dy] of [[-6, -1.4], [6, -1.4], [0, 3.6]] as const) { drum(ctx, x + dx, y - h + dy - 1, 1.8, 1.6, STONE, 2); dome(ctx, x + dx, y - h + dy - 2.6, 1.8, 2, domeC, false); }
  drum(ctx, x, y - h - 3.6, 4.6, 4.4, STONE, 5); // the central drum and dome
  dome(ctx, x, y - h - 8, 4.6, 5, domeC, true, 0);
}

/** The capital: a great dome on its piers, half-domes either side and buttress towers, behind a stretch of the land walls. */
function greatChurch(ctx: Ctx, x: number, y: number, domeC: string) {
  ellipse(ctx, x + 1, y + 4, 26, 9, 'rgba(0,0,0,0.2)');
  // the body: a broad block with tiers of arched windows
  const w = 26, h = 11;
  box(ctx, x, y - 2, w, h, '#e6c9a0');
  banded(ctx, x, y - 2, w, h, 0.3);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) {
    faceArch(ctx, 'R', x, y - 2, w, h, 0.1 + i * 0.2, 0.18 + r * 0.4, 0.06, 0.26);
    faceArch(ctx, 'L', x, y - 2, w, h, 0.1 + i * 0.2, 0.18 + r * 0.4, 0.06, 0.26, '#3a3028');
  }
  // buttress towers at the corners
  for (const [dx, dy] of [[-11, -3.4], [11, -3.4]] as const) {
    box(ctx, x + dx, y - 2 + dy + 2.6, 4, h + 7, '#e6c9a0');
    banded(ctx, x + dx, y - 2 + dy + 2.6, 4, h + 7, 0.3);
    tiledRoof(ctx, x + dx, y - 2 + dy + 2.6 - h - 7, 4, 2.4, LEAD);
  }
  const top = y - 2 - h;
  // the half-domes east and west, stepping down from the great dome
  for (const dx of [-7.6, 7.6]) { drum(ctx, x + dx, top + 0.6, 4.4, 1.4, '#e6c9a0', 0); dome(ctx, x + dx, top - 0.8, 4.4, 3.8, domeC, false, 5); }
  // the great dome on its ring of forty windows
  drum(ctx, x, top - 1, 7.6, 3.2, '#e6c9a0', 0);
  dome(ctx, x, top - 4.2, 7.6, 6.4, domeC, true, 9);
  // a stretch of the triple land walls before it: the low moat wall, the outer wall and the tall inner wall with towers
  wallRun(ctx, x - 30, y - 3.2, 9, 3, 7);
  const wy = y + 9;
  for (const [tx, ty] of [[-27.6, -3.6], [-17.4, 1.6]] as const) {
    box(ctx, x + tx, y + ty, 5, 11, STONE);
    banded(ctx, x + tx, y + ty, 5, 11, 0.26);
    faceArch(ctx, 'R', x + tx, y + ty, 5, 11, 0.5, 0.6, 0.36, 0.18);
    faceArch(ctx, 'L', x + tx, y + ty, 5, 11, 0.5, 0.6, 0.36, 0.18);
    for (let i = 0; i < 3; i++) { faceQuad(ctx, 'R', x + tx, y + ty - 11, 5, 1.2, i * 0.36, i * 0.36 + 0.2, 0, 1, STONE); faceQuad(ctx, 'L', x + tx, y + ty - 11, 5, 1.2, i * 0.36, i * 0.36 + 0.2, 0, 1, STONE); }
  }
  wallRun(ctx, x - 29, y + 0.6, 12, 2.6, 4.4);
  wallRun(ctx, x - 28, y + 4, 12, 2.4, 2.4);
  // the purple-and-gold banner of the Empire on the tower
  const fx = x - 27.6, fy = wy - 24.6;
  line(ctx, fx, fy + 10, fx, fy, WOOD_D, 0.8);
  poly(ctx, [fx, fy, fx + 7, fy + 1, fx + 5.4, fy + 3, fx + 7, fy + 5, fx, fy + 4.4], PURPLE);
  crossCircle(ctx, fx + 3.4, fy + 2.6, 1, 1, GOLD, 0.4);
}

function building(ctx: Ctx, x: number, y: number, big: boolean, roofC: string, capital: boolean) {
  if (big && capital) return greatChurch(ctx, x, y, roofC);
  if (big) return church(ctx, x, y, roofC);
  const spot: Record<string, number> = { '-10,2': 0, '10,2': 1, '0,8': 2, '-6,-8': 3, '7,-7': 4, '-14,-3': 2, '14,-2': 0 };
  const v = spot[`${Math.round(x)},${Math.round(y)}`] ?? ((Math.round(x) * 7 + Math.round(y) * 3) % 5 + 5) % 5;
  if (v === 0) house(ctx, x, y, 11, 8, PLASTER, TILE);
  else if (v === 1) chapel(ctx, x, y, 0.95, roofC);
  else if (v === 2) house(ctx, x, y, 10, 11, '#e8d2a8', TILE, 2);
  else if (v === 3) wallTower(ctx, x, y, 0.9);
  else stoa(ctx, x, y);
}

// ---------------------------------------------------------------- trees

/** Cypress spires, silver olives and umbrella-crowned stone pines. */
function tree(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  const type = ['cypress', 'olive', 'cypress', 'pine', 'olive', 'cypress', 'olive', 'pine', 'cypress', 'olive'][variant % 10];
  if (type === 'cypress') {
    // a tall dark flame of a tree on a short trunk, its foliage in tight upward tufts
    const g = mix(P.forest, '#1e4a2a', 0.55), hgt = (21 + (variant % 3) * 3) * k, wd = 4.6 * k;
    line(ctx, x, y, x, y - 3 * k, P.trunk, 1.4 * k);
    const sil = (dx: number, c: string, sc = 1) => {
      ctx.beginPath();
      ctx.moveTo(x + dx, y - 2 * k);
      ctx.quadraticCurveTo(x + dx - wd * 1.25 * sc, y - hgt * 0.4, x + dx, y - hgt);
      ctx.quadraticCurveTo(x + dx + wd * 1.25 * sc, y - hgt * 0.4, x + dx, y - 2 * k);
      ctx.fillStyle = ink(c);
      ctx.fill();
    };
    sil(0.5 * k, shade(g, -0.3));
    sil(0, g);
    ctx.save(); // the shaded right half
    ctx.beginPath();
    ctx.rect(x + 0.4 * k, y - hgt - 1, wd * 2, hgt + 2);
    ctx.clip();
    sil(0, shade(g, -0.22));
    ctx.restore();
    for (let i = 0; i < 9; i++) { // tufts
      const t = 0.15 + (i / 9) * 0.75, side = i % 2 ? 1 : -1;
      const half = wd * Math.sin(Math.PI * (0.15 + t * 0.85)) * 0.75;
      ellipse(ctx, x + side * half * 0.5, y - hgt * t, 1.2 * k, 1.8 * k, side < 0 ? shade(g, 0.18) : shade(g, -0.12));
    }
    line(ctx, x - 0.8 * k, y - hgt * 0.2, x - 0.4 * k, y - hgt * 0.85, shade(g, 0.3), 0.5 * k);
    return;
  }
  if (type === 'olive') {
    // a gnarled, split grey trunk and a low, broad crown of silver-green leaves, with dark olives
    const bark = '#7a7466', leaf = mix(P.forest, '#9ab08a', 0.55);
    poly(ctx, [x - 3 * k, y + 0.4 * k, x - 1 * k, y - 1 * k, x + 1.4 * k, y - 0.8 * k, x + 3.2 * k, y + 0.6 * k], shade(bark, -0.3)); // the swollen foot
    curve(ctx, x + 0.6 * k, y, x - 2.4 * k, y - 3.6 * k, x + 0.4 * k, y - 7.4 * k, 3.6 * k, shade(bark, -0.2)); // one squat, twisted trunk
    curve(ctx, x - 0.2 * k, y - 0.2 * k, x - 2.8 * k, y - 3.6 * k, x - 0.4 * k, y - 7 * k, 1.2 * k, bark);
    curve(ctx, x - 0.8 * k, y - 1 * k, x - 2.6 * k, y - 3.8 * k, x - 1 * k, y - 6.4 * k, 0.4 * k, shade(bark, 0.4));
    curve(ctx, x + 0.4 * k, y - 6 * k, x - 3 * k, y - 7 * k, x - 4.6 * k, y - 8.6 * k, 1.1 * k, bark); // limbs
    curve(ctx, x + 0.6 * k, y - 6.4 * k, x + 3.6 * k, y - 6.6 * k, x + 5.4 * k, y - 8.4 * k, 1 * k, shade(bark, -0.1));
    for (const [dx, dy, rx, ry, c] of [[-5.6, -9, 4, 2.6, -0.16], [5.8, -9.4, 4.2, 2.6, -0.2], [-2, -10.6, 4.8, 3, -0.06], [2.6, -11.2, 4.8, 3, -0.1], [-3.6, -13, 3.6, 2.4, 0.06], [1.4, -14, 3.8, 2.4, 0.1], [5, -12.6, 2.8, 2, 0]] as const) {
      ellipse(ctx, x + dx * k, y + (dy + 0.9) * k, rx * k, ry * k, shade(leaf, c - 0.22));
      ellipse(ctx, x + dx * k, y + dy * k, rx * k, ry * k, shade(leaf, c));
      ellipse(ctx, x + (dx - rx * 0.3) * k, y + (dy - ry * 0.35) * k, rx * 0.5 * k, ry * 0.32 * k, shade(leaf, c + 0.22));
    }
    for (let i = 0; i < 8; i++) { // silver leaf undersides and a few olives
      const a = rand(variant + 3, i) * Math.PI * 2, r = 2 + rand(variant + 7, i) * 5;
      ellipse(ctx, x + Math.cos(a) * r * k, y - 11 * k + Math.sin(a) * r * 0.45 * k, 0.5 * k, 0.28 * k, i % 4 ? '#dfe8d4' : '#3a2a3a');
    }
    return;
  }
  // the stone pine: a bare, leaning trunk forking under a flat umbrella crown
  const bark = '#8a5a3a', g = mix(P.forest, '#2e5a2a', 0.4);
  curve(ctx, x, y, x + 1.6 * k, y - 8 * k, x + 0.6 * k, y - 15 * k, 1.8 * k, shade(bark, -0.2));
  curve(ctx, x - 0.4 * k, y, x + 1.2 * k, y - 8 * k, x + 0.2 * k, y - 15 * k, 0.6 * k, shade(bark, 0.3));
  curve(ctx, x + 0.8 * k, y - 11 * k, x - 2 * k, y - 13 * k, x - 4 * k, y - 15.6 * k, 1 * k, bark);
  curve(ctx, x + 0.8 * k, y - 12 * k, x + 3.4 * k, y - 14 * k, x + 5 * k, y - 16 * k, 0.9 * k, bark);
  ellipse(ctx, x + 0.6 * k, y - 16.4 * k, 9 * k, 3.4 * k, shade(g, -0.3));
  ellipse(ctx, x + 0.4 * k, y - 17.4 * k, 8.6 * k, 3.2 * k, g);
  for (const [dx, dy, rx] of [[-4, -18, 3.4], [3.6, -18.2, 3.6], [0, -19, 3.8]] as const) {
    ellipse(ctx, x + dx * k, y + dy * k, rx * k, 1.6 * k, shade(g, 0.12));
    ellipse(ctx, x + (dx - 1) * k, y + (dy - 0.5) * k, rx * 0.5 * k, 0.7 * k, shade(g, 0.28));
  }
}

registerArt('byzantium', {
  dress: (kind) => dress(kind),
  torso,
  face,
  head,
  weapon,
  shield,
  unit(ctx, kind, x, y) {
    switch (kind) {
      case 'varangian': varangian(ctx, x, y); return true;
      case 'rider': case 'knight': case 'horsearcher': rider(ctx, kind, x, y); return true;
      case 'catapult': trebuchet(ctx, x, y); return true;
      case 'boat': case 'ship': case 'warship': dromon(ctx, kind, x, y); return true;
      default: return false;
    }
  },
  building: (ctx, x, y, big, roofC, capital) => building(ctx, x, y, big, roofC, capital),
  tree,
});

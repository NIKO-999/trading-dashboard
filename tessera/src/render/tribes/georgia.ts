// The Kingdom of Georgia: its own art (see render/tribeart).
// The golden age of David the Builder and Queen Tamar, eleventh to thirteenth century, and the mountain clans after it:
// the chokha, a long coat in black, wine-red or brown with rows of gazyri cartridge tubes across the chest, worn over a
// contrasting arkhaluk with a wide silver-mounted belt and a kindjal dagger at the front; tall sheepskin papakhi hats and
// the hooded bashlyk; mail shirts, mail coifs and low riveted spangenhelms for the knights; the Khevsurs of the high
// valleys in mail over dark tunics densely embroidered with crosses, beads and coins, carrying small round studded
// shields and straight broadswords. The emblem is the borjgali, the seven-armed whirling sun. Stone houses with flat
// roofs and carved wooden balconies (Tbilisi), tall Svan defensive towers in the mountain villages, a hill fortress like
// Narikala over the capital and cross-in-square churches with a tall cylindrical drum under a conical roof; vineyards on
// pergolas, walnut trees and Caucasian pines and firs.
import { drawHorse, figure } from '../units';
import { registerArt } from '../tribeart';
import type { Body } from '../tribeart';
import type { BiomePalette } from '../../data/tribes';
import type { UnitKind } from '../../game/types';
import { band, box, ellipse, faceQuad, ink, line, mix, poly, rand, shade } from '../prims';
import type { Ctx } from '../prims';

const GE_RED = '#b02040', GE_RED_D = '#580c1e', GE_RED_L = '#d04a64';
const WINE = '#7a1830'; // a wine-red chokha
const BLACK = '#26222a'; // the black chokha
const BROWN = '#6a4630', BROWN_D = '#42281a';
const ARKH = '#e8dcc0'; // a pale arkhaluk under the coat
const SILVER = '#d4d8dc', SILVER_D = '#8a9098', NIELLO = '#34343c';
const GOLD = '#d8a838', GOLD_L = '#f2d274', GOLD_D = '#946c1c';
const MAIL = '#8e949c', MAIL_D = '#5a6068', STEEL = '#c4ccd4', STEEL_D = '#6e7680';
const FLEECE = '#2a2422', WHITE_FLEECE = '#e6dfd0', GREY_FLEECE = '#8a8078';
const KHEV = '#1e2238', KHEV_RED = '#c0283a', KHEV_WHITE = '#f0e8d8', KHEV_OCHRE = '#d8a040'; // Khevsur embroidery
const LEATHER = '#5e3c24', LEATHER_D = '#3a2414';
const WOOD = '#7a5434', WOOD_D = '#4a3020', WOOD_L = '#a07848';
const STONE = '#d6c6a4', STONE_D = '#a8987a'; // warm ochre tuff of the churches
const SLATE = '#7c7a72'; // stone-slab roofs of towers and domes
const BRICK = '#b07a58';
const SKY_GLASS = '#2a3040';
const LINEN = '#efe6d2';

const MAIL_KINDS: UnitKind[] = ['defender', 'swordsman', 'knight', 'giant'];
const isMail = (k: UnitKind) => MAIL_KINDS.includes(k);

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

/** A point on one visible side of a box, in the (u, v) coordinates of faceQuad. */
function pt(face: 'L' | 'R', cx: number, cy: number, w: number, h: number, u: number, v: number): [number, number] {
  return face === 'R' ? [cx + (u * w) / 2, cy + (w / 4) * (1 - u) - v * h] : [cx - w / 2 + (u * w) / 2, cy + (w / 4) * u - v * h];
}

/** A polygon on one side of a box, shaded like that side. */
function fpoly(ctx: Ctx, face: 'L' | 'R', x: number, y: number, w: number, h: number, pts: [number, number][], c: string) {
  poly(ctx, pts.flatMap(([u, v]) => pt(face, x, y, w, h, u, v)), face === 'L' ? shade(c, 0.06) : shade(c, -0.2));
}

/** Rows of tiny mail rings over a box between heights v0 and v1. */
function mail(ctx: Ctx, x: number, y: number, w: number, h: number, v0: number, v1: number, base: string, rows = 6, faces: ('L' | 'R')[] = ['L', 'R']) {
  for (const f of faces) faceQuad(ctx, f, x, y, w, h, 0, 1, v0, v1, base);
  const dv = (v1 - v0) / rows;
  for (let r = 0; r < rows; r++) {
    const v = v0 + (r + 0.5) * dv;
    for (let i = 0; i < 6; i++) {
      const u = (i + 0.25 + (r % 2) * 0.5) / 6.2;
      for (const f of faces) {
        const [px, py] = pt(f, x, y, w, h, u, v);
        const s = w / 10;
        ellipse(ctx, px, py + 0.25 * s, 0.42 * s, 0.3 * s, shade(base, f === 'L' ? -0.3 : -0.45));
        ellipse(ctx, px, py - 0.1 * s, 0.32 * s, 0.22 * s, shade(base, f === 'L' ? 0.4 : 0.15));
      }
    }
  }
}

/** The borjgali: a disc with seven arms whirling out from it, the old Georgian sun. */
function borjgali(ctx: Ctx, cx: number, cy: number, r: number, c: string, sy = 1) {
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const x0 = cx + Math.cos(a) * r * 0.3, y0 = cy + Math.sin(a) * r * 0.3 * sy;
    const x1 = cx + Math.cos(a + 0.9) * r, y1 = cy + Math.sin(a + 0.9) * r * sy;
    const qx = cx + Math.cos(a + 0.15) * r * 0.95, qy = cy + Math.sin(a + 0.15) * r * 0.95 * sy;
    curve(ctx, x0, y0, qx, qy, x1, y1, Math.max(0.35, r * 0.22), c);
  }
  ellipse(ctx, cx, cy, r * 0.36, r * 0.36 * sy, c);
}

/** A small Georgian cross with flared, splayed arms (as on a banner or church). */
function cross(ctx: Ctx, cx: number, cy: number, s: number, c: string) {
  line(ctx, cx, cy - 1.4 * s, cx, cy + 1.6 * s, c, 0.6 * s);
  line(ctx, cx - 1.1 * s, cy - 0.4 * s, cx + 1.1 * s, cy - 0.4 * s, c, 0.6 * s);
}

// ---------------------------------------------------------------- shields

type ShieldStyle = 'leather' | 'iron' | 'red' | 'gold';

/** A small round shield seen a little from the side: a rim, rings of studs, a boss; painted styles carry a borjgali. */
function buckler(ctx: Ctx, cx: number, cy: number, r: number, k: number, style: ShieldStyle) {
  const rx = r * 0.82, ry = r;
  const field = style === 'leather' ? LEATHER : style === 'iron' ? '#4a4e56' : style === 'red' ? GE_RED : GOLD_D;
  const stud = style === 'leather' ? GOLD : style === 'gold' ? GOLD_L : STEEL;
  ellipse(ctx, cx + 0.8 * k, cy + 0.3 * k, rx, ry, LEATHER_D); // its thickness
  ellipse(ctx, cx, cy, rx, ry, style === 'iron' ? STEEL_D : style === 'gold' ? GOLD : SILVER_D); // the rim
  ellipse(ctx, cx, cy, rx - 0.7 * k, ry - 0.7 * k, field);
  ctx.save(); // the lit left half
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(0.1, rx - 0.7 * k), Math.max(0.1, ry - 0.7 * k), 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = ink(shade(field, 0.14));
  ctx.fillRect(cx - rx, cy - ry, rx * 0.9, ry * 2);
  ctx.restore();
  if (style === 'red' || style === 'gold') borjgali(ctx, cx, cy, r * 0.5, style === 'red' ? GOLD : GE_RED, 1.15);
  else { // concentric rings of studs, the Khevsur way
    const rings: [number, number][] = [[0.78, 14], [0.52, 9]];
    for (const [f, n] of rings) for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const px = cx + Math.cos(a) * rx * f, py = cy + Math.sin(a) * ry * f;
      ellipse(ctx, px, py, 0.42 * k, 0.42 * k, shade(stud, -0.35));
      ellipse(ctx, px - 0.12 * k, py - 0.12 * k, 0.28 * k, 0.28 * k, stud);
    }
    if (style === 'iron') ellipse(ctx, cx, cy, rx * 0.3, ry * 0.3, KHEV_RED); // a red leather ring under the boss
  }
  // the boss
  ellipse(ctx, cx + 0.2 * k, cy + 0.2 * k, rx * 0.22, ry * 0.22, shade(stud, -0.4));
  ellipse(ctx, cx, cy, rx * 0.2, ry * 0.2, stud);
  ellipse(ctx, cx - rx * 0.06, cy - ry * 0.07, rx * 0.08, ry * 0.08, '#ffffff');
  if (style !== 'iron' && style !== 'leather') for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ellipse(ctx, cx + Math.cos(a) * (rx - 0.35 * k), cy + Math.sin(a) * (ry - 0.35 * k), 0.28 * k, 0.28 * k, GOLD_L); } // rim nails
  curve(ctx, cx - rx * 0.6, cy - ry * 0.5, cx - rx * 0.85, cy, cx - rx * 0.6, cy + ry * 0.5, 0.6 * k, 'rgba(255,255,255,0.22)');
}

function shieldFor(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  const cx = x - 1.2 * k, cy = y - 3.6 * k;
  switch (kind) {
    case 'warrior': return buckler(ctx, cx, cy + 0.6 * k, 3.6 * k, k, 'leather');
    case 'khevsur': return buckler(ctx, cx, cy, 4 * k, k, 'iron');
    case 'defender': return buckler(ctx, cx - 0.4 * k, cy - 0.6 * k, 6 * k, k, 'red');
    case 'giant': return buckler(ctx, cx, cy - 0.4 * k, 5.2 * k, k, 'gold');
    default: return buckler(ctx, cx, cy, 4.6 * k, k, 'red');
  }
}

// ---------------------------------------------------------------- dress

/** [torso, legs, sleeves]: a chokha in black, wine-red or brown, mail for the heavy ranks, the Khevsur's dark tunic. */
function dress(kind: UnitKind): [string, string, string] {
  switch (kind) {
    case 'warrior': return [BROWN, '#3a3030', BROWN];
    case 'archer': return [WINE, '#2e2a30', WINE];
    case 'rider': return [BLACK, '#2e2a30', BLACK];
    case 'explorer': return [GREY_FLEECE, '#3a3030', GREY_FLEECE];
    case 'defender': return [MAIL, '#3a2e28', MAIL];
    case 'swordsman': return [MAIL, GE_RED_D, MAIL];
    case 'khevsur': return [KHEV, '#2a2830', KHEV];
    case 'knight': return [MAIL, GE_RED_D, MAIL];
    case 'giant': return [MAIL, GE_RED_D, GE_RED];
    default: return [BLACK, '#2e2a30', BLACK];
  }
}

/** The coat's long skirt below the waist, flaring a little, split at the front, with a trimmed hem. */
function skirt(ctx: Ctx, x: number, hip: number, k: number, len: number, cloth: string, hem: string) {
  const w0 = 10 * k, w1 = 11.6 * k;
  for (const f of ['L', 'R'] as const) {
    const top = [pt(f, x, hip, w0, 0, 0, 0), pt(f, x, hip, w0, 0, 1, 0)];
    const bot = [pt(f, x, hip + len * k, w1, 0, 1, 0), pt(f, x, hip + len * k, w1, 0, 0, 0)];
    const c = f === 'L' ? shade(cloth, 0.06) : shade(cloth, -0.2);
    poly(ctx, [...top[0], ...top[1], ...bot[0], ...bot[1]], c);
    const hb = [pt(f, x, hip + len * k, w1, 1.2 * k, 0, 1), pt(f, x, hip + len * k, w1, 1.2 * k, 1, 1)];
    poly(ctx, [...hb[0], ...hb[1], ...bot[0], ...bot[1]], f === 'L' ? shade(hem, 0.04) : shade(hem, -0.2)); // the hem band
    for (const u of [0.3, 0.7]) { // folds
      const [ax, ay] = pt(f, x, hip, w0, 0, u, 0), [bx, by] = pt(f, x, hip + len * k, w1, 0, u, 0);
      line(ctx, ax, ay + 0.4 * k, bx, by - 0.4 * k, shade(cloth, -0.32), 0.35 * k);
    }
  }
  // the split down the front, legs showing in its shadow
  const [fx, fy] = pt('R', x, hip, w0, 0, 0, 0), [gx, gy] = pt('R', x, hip + len * k, w1, 0, 0, 0);
  poly(ctx, [fx, fy, gx - 0.9 * k, gy, gx + 0.9 * k, gy], shade(cloth, -0.5));
}

/** The kindjal at the front of the belt: a silver-mounted hilt above, a long tapering scabbard below. */
function beltKindjal(ctx: Ctx, x: number, hip: number, w: number, k: number) {
  const [fx, fy] = [x + 0.6 * k, hip + w / 4 - 0.5 * k];
  poly(ctx, [fx - 0.8 * k, fy, fx + 0.8 * k, fy, fx + 0.4 * k, fy + 4.6 * k, fx, fy + 5.4 * k, fx - 0.4 * k, fy + 4.6 * k], NIELLO); // the scabbard
  poly(ctx, [fx - 0.8 * k, fy, fx, fy, fx, fy + 5.4 * k, fx - 0.4 * k, fy + 4.6 * k], shade(NIELLO, 0.2));
  for (const t of [0.1, 0.45]) line(ctx, fx - 0.75 * k, fy + t * 5 * k, fx + 0.75 * k, fy + t * 5 * k, SILVER, 0.5 * k); // silver bands
  poly(ctx, [fx - 0.4 * k, fy + 4.6 * k, fx + 0.4 * k, fy + 4.6 * k, fx, fy + 5.6 * k], SILVER); // the chape
  line(ctx, fx, fy - 0.2 * k, fx, fy - 2.4 * k, SILVER, 1.1 * k); // the hilt
  ellipse(ctx, fx, fy - 2.6 * k, 0.8 * k, 0.6 * k, SILVER);
  for (const t of [0.8, 1.6]) ellipse(ctx, fx, fy - t * k, 0.3 * k, 0.3 * k, NIELLO); // grip rivets
}

/** The wide belt: black leather mounted with silver plaques, a buckle at the front. */
function belt(ctx: Ctx, x: number, y: number, w: number, h: number, v0: number, v1: number) {
  band(ctx, x, y, w, h, v0, v1, '#1e1a1c');
  for (const u of [0.1, 0.32, 0.54, 0.76]) for (const f of ['L', 'R'] as const) faceQuad(ctx, f, x, y, w, h, u, u + 0.12, v0 + 0.02, v1 - 0.02, SILVER);
  faceQuad(ctx, 'R', x, y, w, h, 0, 0.1, v0 - 0.01, v1 + 0.01, SILVER);
}

/** Gazyri across the chest: a sewn pocket band on each breast, the capped tops of the cartridge tubes above it. */
function gazyri(ctx: Ctx, x: number, y: number, w: number, h: number, coat: string, cap: string) {
  const k = w / 10;
  for (const f of ['L', 'R'] as const) {
    const u0 = f === 'L' ? 0.3 : 0.14, u1 = f === 'L' ? 0.86 : 0.7;
    faceQuad(ctx, f, x, y, w, h, u0, u1, 0.5, 0.74, shade(coat, -0.14));
    const n = 5;
    for (let i = 0; i < n; i++) {
      const u = u0 + ((i + 0.5) / n) * (u1 - u0);
      const [ax, ay] = pt(f, x, y, w, h, u, 0.52), [bx, by] = pt(f, x, y, w, h, u, 0.84);
      line(ctx, ax, ay, bx, by, shade(coat, -0.45), 0.7 * k); // the tube's pocket
      line(ctx, ax - 0.25 * k, ay, bx - 0.25 * k, by, shade(coat, 0.25), 0.25 * k);
      ellipse(ctx, bx, by - 0.2 * k, 0.55 * k, 0.42 * k, shade(cap, -0.3)); // its cap
      ellipse(ctx, bx - 0.1 * k, by - 0.3 * k, 0.4 * k, 0.3 * k, cap);
    }
    faceQuad(ctx, f, x, y, w, h, u0, u1, 0.5, 0.53, shade(coat, 0.2));
  }
}

/** The chokha's deep V neck, showing the arkhaluk with its row of small buttons. */
function vneck(ctx: Ctx, x: number, y: number, w: number, h: number, under: string) {
  const k = w / 10;
  fpoly(ctx, 'L', x, y, w, h, [[0.82, 1], [1, 1], [1, 0.42]], under);
  fpoly(ctx, 'R', x, y, w, h, [[0, 1], [0.18, 1], [0, 0.42]], under);
  for (const v of [0.56, 0.7, 0.84]) { const [bx, by] = pt('R', x, y, w, h, 0.02, v); ellipse(ctx, bx, by, 0.3 * k, 0.3 * k, SILVER_D); }
}

/** Rows of Khevsur embroidery over a band of a box: crosses, beads and little coins on the dark cloth. */
function embroidery(ctx: Ctx, x: number, y: number, w: number, h: number, v0: number, v1: number) {
  const k = w / 10;
  band(ctx, x, y, w, h, v0, v1, KHEV);
  const rows = Math.max(1, Math.round((v1 - v0) / 0.16));
  for (let r = 0; r < rows; r++) {
    const v = v0 + ((r + 0.5) / rows) * (v1 - v0);
    for (const f of ['L', 'R'] as const) for (let i = 0; i < 4; i++) {
      const u = (i + 0.5 + (r % 2) * 0.5) / 4.3;
      const [px, py] = pt(f, x, y, w, h, u, v);
      const c = (i + r) % 3 === 0 ? KHEV_WHITE : (i + r) % 3 === 1 ? KHEV_RED : KHEV_OCHRE;
      line(ctx, px - 0.6 * k, py, px + 0.6 * k, py, c, 0.32 * k); // a cross
      line(ctx, px, py - 0.6 * k, px, py + 0.6 * k, c, 0.32 * k);
      ellipse(ctx, px + 1 * k, py - 0.1 * k, 0.18 * k, 0.18 * k, KHEV_WHITE); // a bead
    }
    const [ax, ay] = pt('L', x, y, w, h, 0, v - 0.5 / rows * (v1 - v0)), [bx, by] = pt('L', x, y, w, h, 1, v - 0.5 / rows * (v1 - v0));
    line(ctx, ax, ay, bx, by, KHEV_RED, 0.25 * k);
    const [cx2, cy2] = pt('R', x, y, w, h, 0, v - 0.5 / rows * (v1 - v0)), [dx2, dy2] = pt('R', x, y, w, h, 1, v - 0.5 / rows * (v1 - v0));
    line(ctx, cx2, cy2, dx2, dy2, KHEV_RED, 0.25 * k);
  }
}

/** An embroidered Khevsur skirt below the mail: crosses in rows, a border of coins at the hem. */
function khevSkirt(ctx: Ctx, x: number, hip: number, k: number, len: number) {
  skirt(ctx, x, hip, k, len, KHEV, KHEV_RED);
  const w = 11 * k;
  for (const f of ['L', 'R'] as const) for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
    const u = 0.1 + i * 0.24 + (r % 2) * 0.1;
    const [px, py] = pt(f, x, hip + (r + 1) * 1.4 * k, w, 0, u, 0);
    const c = r === 0 ? (i % 2 ? KHEV_WHITE : KHEV_OCHRE) : (i % 2 ? KHEV_RED : KHEV_WHITE);
    line(ctx, px - 0.55 * k, py, px + 0.55 * k, py, c, 0.3 * k);
    line(ctx, px, py - 0.55 * k, px, py + 0.55 * k, c, 0.3 * k);
  }
  for (const f of ['L', 'R'] as const) for (let i = 0; i < 6; i++) { // a fringe of small silver coins at the hem
    const [px, py] = pt(f, x, hip + (len - 0.5) * k, 11.4 * k, 0, 0.08 + i * 0.17, 0);
    ellipse(ctx, px, py, 0.42 * k, 0.42 * k, SILVER_D);
    ellipse(ctx, px - 0.1 * k, py - 0.1 * k, 0.26 * k, 0.26 * k, SILVER);
  }
}

function torso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const k = w / 10;
  const B = (v0: number, v1: number, c: string) => band(ctx, x, y, w, h, v0, v1, c);
  if (kind === 'khevsur') { // mail over a densely embroidered dark tunic
    khevSkirt(ctx, x, y, k, 3.8);
    embroidery(ctx, x, y, w, h, 0, 0.46);
    mail(ctx, x, y, w, h, 0.46, 0.94, shade(MAIL, -0.04), 4);
    B(0.44, 0.48, shade(MAIL, -0.38)); // the mail's ragged lower edge
    belt(ctx, x, y, w, h, 0.02, 0.13);
    beltKindjal(ctx, x, y - 0.02 * h, w, k);
    // an embroidered collar and a string of beads and crosses hanging on the chest
    B(0.9, 1, KHEV);
    for (const f of ['L', 'R'] as const) for (let i = 0; i < 4; i++) { const [px, py] = pt(f, x, y, w, h, 0.12 + i * 0.25, 0.95); ellipse(ctx, px, py, 0.32 * k, 0.32 * k, i % 2 ? KHEV_RED : KHEV_WHITE); }
    const [cx, cy] = pt('R', x, y, w, h, 0.18, 0.68);
    ellipse(ctx, cx, cy, 1.1 * k, 1.1 * k, SILVER_D); // a round silver amulet
    ellipse(ctx, cx - 0.15 * k, cy - 0.15 * k, 0.8 * k, 0.8 * k, SILVER);
    cross(ctx, cx, cy + 0.1 * k, 0.45 * k, KHEV_RED);
    return;
  }
  if (isMail(kind)) {
    const under = kind === 'defender' ? BROWN : kind === 'giant' ? GE_RED : WINE;
    skirt(ctx, x, y, k, kind === 'giant' ? 4.2 : 3.4, under, kind === 'giant' ? GOLD : shade(under, -0.4));
    if (kind !== 'defender') skirtMail(ctx, x, y, k, 2.2);
    B(0, 0.2, under);
    mail(ctx, x, y, w, h, 0.18, 0.92, kind === 'giant' || kind === 'knight' ? shade(MAIL, 0.08) : MAIL, 6);
    B(0.16, 0.21, shade(MAIL, -0.35));
    belt(ctx, x, y, w, h, 0.24, 0.36);
    if (kind !== 'defender') beltKindjal(ctx, x, y - 0.24 * h, w, k);
    if (kind === 'giant' || kind === 'knight') { // a red surcoat panel down the front, with a gold borjgali
      fpoly(ctx, 'R', x, y, w, h, [[0, 0.92], [0.34, 0.92], [0.34, 0.38], [0, 0.38]], GE_RED);
      fpoly(ctx, 'L', x, y, w, h, [[0.7, 0.92], [1, 0.92], [1, 0.38], [0.7, 0.38]], GE_RED);
      const [bx, by] = pt('R', x, y, w, h, 0.02, 0.64);
      borjgali(ctx, bx, by, 1.6 * k, GOLD);
    }
    B(0.9, 1, under); // the coat's collar at the neck
    if (kind === 'giant') for (const f of ['L', 'R'] as const) for (const u of [0.15, 0.4, 0.65, 0.9]) { const [px, py] = pt(f, x, y, w, h, u, 0.95); ellipse(ctx, px, py, 0.4 * k, 0.4 * k, GOLD_L); }
    return;
  }
  // the chokha
  const coat = dress(kind)[0];
  const under = kind === 'rider' ? GE_RED : kind === 'archer' ? ARKH : kind === 'warrior' ? ARKH : '#5a5048';
  skirt(ctx, x, y, k, kind === 'explorer' ? 4.2 : 3.8, coat, shade(coat, -0.3));
  if (kind === 'explorer') { // a felt burka cape over the shoulders: a shaggy grey cloak
    for (const f of ['L', 'R'] as const) for (const u of [0.15, 0.4, 0.65, 0.9]) {
      const [px, py] = pt(f, x, y, w, h, u, 0.1);
      line(ctx, px, py - 2 * k, px, py + 3.2 * k, shade(GREY_FLEECE, -0.25), 0.4 * k);
    }
    B(0.6, 1, shade(GREY_FLEECE, 0.06));
    vneck(ctx, x, y, w, h, BROWN);
    B(0.1, 0.2, LEATHER);
    return;
  }
  vneck(ctx, x, y, w, h, under);
  gazyri(ctx, x, y, w, h, coat, kind === 'rider' ? SILVER : kind === 'archer' ? '#e8dcc0' : SILVER_D);
  belt(ctx, x, y, w, h, 0.02, 0.15);
  beltKindjal(ctx, x, y - 0.06 * h, w, k);
}

/** Mail hanging below the coat's waist over the skirt (a long hauberk). */
function skirtMail(ctx: Ctx, x: number, hip: number, k: number, len: number) {
  mail(ctx, x, hip + len * k, 10.4 * k, len * k, 0, 1, MAIL, 2);
  band(ctx, x, hip + len * k, 10.4 * k, len * k, 0, 0.14, shade(MAIL, -0.35));
}

/** A dark Georgian moustache on everyone; beards on the grown men of rank. */
function face(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const L = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'L', x, y, w, h, u0, u1, v0, v1, c);
  const hair = '#1a120c', lit = '#3e2e22';
  R(0.32, 0.5, 0.52, 0.58, hair); R(0.62, 0.8, 0.52, 0.58, hair); // heavy dark brows
  if (kind === 'giant' || kind === 'knight' || kind === 'defender' || kind === 'explorer' || kind === 'khevsur') {
    R(0, 1, 0, 0.24, hair); // a full black beard
    L(0.6, 1, 0, 0.24, hair);
    R(0.9, 1, 0.24, 0.48, hair);
    for (const u of [0.15, 0.45, 0.75]) R(u, u + 0.07, 0.03, 0.16, lit);
    if (kind === 'giant' || kind === 'explorer') { // longer, the king's and the wanderer's
      poly(ctx, [...pt('R', x, y, w, h, 0.1, 0.02), ...pt('R', x, y, w, h, 0.9, 0.02), ...pt('R', x, y, w, h, 0.62, -0.3), ...pt('R', x, y, w, h, 0.4, -0.3)], shade(kind === 'explorer' ? '#5a5048' : hair, -0.1));
    }
  }
  // the moustache, broad and curled up at the ends
  R(0.22, 0.78, 0.22, 0.29, hair);
  R(0.12, 0.24, 0.26, 0.34, hair); R(0.76, 0.88, 0.26, 0.34, hair);
  R(0.36, 0.64, 0.17, 0.2, '#b06656'); // the lip
}

// ---------------------------------------------------------------- headgear

/** A papakhi: a tall cylinder of curly sheepskin, a little wider at the crown, with a cloth top. */
function papakhi(ctx: Ctx, x: number, top: number, k: number, hw: number, fleece: string, tall: number, topCloth?: string) {
  const w = hw + 1.4 * k, h = tall * k, cy = top + w / 4 + 1.2 * k;
  box(ctx, x, cy, w, h, fleece, topCloth ?? shade(fleece, 0.12));
  // the curls: short arcs scattered over both sides, lit on the left
  for (const f of ['L', 'R'] as const) for (let i = 0; i < 16; i++) {
    const u = 0.06 + rand(31, i) * 0.88, v = 0.08 + rand(37, i) * 0.84;
    const [px, py] = pt(f, x, cy, w, h, u, v);
    ellipse(ctx, px, py, 0.55 * k, 0.4 * k, shade(fleece, f === 'L' ? 0.3 : 0.12));
    ellipse(ctx, px + 0.15 * k, py + 0.15 * k, 0.3 * k, 0.22 * k, shade(fleece, -0.35));
  }
  band(ctx, x, cy, w, h, 0, 0.08, shade(fleece, -0.3));
  if (topCloth) { // a cross of braid on the cloth top
    const lx = x, ly = cy - h;
    line(ctx, lx - w * 0.3, ly - w * 0.08, lx + w * 0.3, ly + w * 0.08, GOLD, 0.35 * k);
    line(ctx, lx + w * 0.3, ly - w * 0.08, lx - w * 0.3, ly + w * 0.08, GOLD, 0.35 * k);
  }
}

/** The bashlyk: a pointed felt hood, its long tails wrapped round the neck, one end hanging down the back. */
function bashlyk(ctx: Ctx, x: number, top: number, k: number, hw: number, c: string) {
  const yb = top + 3 * k, rx = hw / 2 + 0.8 * k;
  poly(ctx, [x - rx, yb + 6 * k, x - rx, yb, x - 1.6 * k, top - 4.2 * k, x + 0.4 * k, top - 3.8 * k, x, yb + rx * 0.5], shade(c, 0.06));
  poly(ctx, [x + 0.4 * k, top - 3.8 * k, x + rx, yb, x + rx, yb + 2 * k, x, yb + rx * 0.5], shade(c, -0.2));
  line(ctx, x - 1.6 * k, top - 4.2 * k, x - 0.6 * k, top - 5.6 * k, c, 0.9 * k); // the hood's tip
  // a gold braid along the edge round the face
  line(ctx, x, yb + rx * 0.5, x + rx, yb, GOLD, 0.4 * k);
  // the tails
  poly(ctx, [x - rx, yb + 5 * k, x - rx - 3 * k, yb + 13 * k, x - rx - 1 * k, yb + 13.4 * k, x - rx + 1.4 * k, yb + 6 * k], shade(c, -0.12));
  line(ctx, x - rx - 3 * k, yb + 13 * k, x - rx - 1 * k, yb + 13.4 * k, GOLD, 0.5 * k);
}

/** A mail coif round the head, the face left open. */
function coif(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const hh = 10.5 * k, hy = top + hh;
  const w = hw + 0.8 * k, y = hy + 0.6 * k, h = hh + 0.8 * k;
  mail(ctx, x, y, w, h, 0, 1, MAIL, 6, ['L']);
  mail(ctx, x, y, w, h, 0.8, 1, MAIL, 1, ['R']);
  faceQuad(ctx, 'R', x, y, w, h, 0.84, 1, 0, 0.8, shade(MAIL, -0.1));
  faceQuad(ctx, 'R', x, y, w, h, 0, 0.12, 0, 0.8, shade(MAIL, -0.1));
  poly(ctx, [x, top - w / 4 + 0.6 * k, x + w / 2, top + 0.6 * k, x, top + w / 4 + 0.6 * k, x - w / 2, top + 0.6 * k], shade(MAIL, 0.2)); // the crown
  // the coif hangs on over the shoulders
  poly(ctx, [x - w / 2, hy + 0.6 * k, x - w / 2 + 0.6 * k, hy + 3 * k, x + w / 2, hy + 1.6 * k, x + w / 2, hy - 0.4 * k, x, hy + w / 4], MAIL_D);
  for (let i = 0; i < 6; i++) ellipse(ctx, x - w / 2 + 1 * k + i * 1.8 * k, hy + 1.8 * k - Math.abs(i - 2) * 0.2 * k, 0.4 * k, 0.3 * k, shade(MAIL, 0.3));
}

/** A low spangenhelm: a riveted iron cone of four plates in brass frames, a brow band, a nasal and a finial. */
function spangenhelm(ctx: Ctx, x: number, top: number, k: number, hw: number, metal: string, frame: string, tall: number, nasal: boolean) {
  const yb = top + 1.6 * k, rx = hw / 2 + 0.6 * k, apex = yb - tall * k;
  ctx.beginPath(); // the lit left half
  ctx.moveTo(x - rx, yb);
  ctx.quadraticCurveTo(x - rx * 0.95, yb - tall * 0.7 * k, x, apex);
  ctx.lineTo(x, yb + rx * 0.5);
  ctx.closePath();
  ctx.fillStyle = ink(shade(metal, 0.14));
  ctx.fill();
  ctx.beginPath(); // the right half, in shade
  ctx.moveTo(x + rx, yb);
  ctx.quadraticCurveTo(x + rx * 0.95, yb - tall * 0.7 * k, x, apex);
  ctx.lineTo(x, yb + rx * 0.5);
  ctx.closePath();
  ctx.fillStyle = ink(shade(metal, -0.24));
  ctx.fill();
  // the frame: ribs from the brow to the apex, with rivets
  for (const d of [-0.55, 0.05, 0.6]) {
    curve(ctx, x + d * rx, yb + rx * 0.5 * (1 - Math.abs(d)), x + d * rx * 0.8, yb - tall * 0.55 * k, x, apex + 0.2 * k, 0.75 * k, frame);
    for (const t of [0.3, 0.6]) ellipse(ctx, x + d * rx * (1 - t * 0.7), yb - tall * t * 0.9 * k + rx * 0.4 * (1 - t), 0.3 * k, 0.3 * k, shade(frame, 0.4));
  }
  // the brow band
  const bw = hw + 1.4 * k, bh = 1.8 * k, by = yb + 1.8 * k;
  faceQuad(ctx, 'L', x, by, bw, bh, 0, 1, 0, 1, frame);
  faceQuad(ctx, 'R', x, by, bw, bh, 0, 1, 0, 1, frame);
  for (const u of [0.15, 0.4, 0.65, 0.9]) { faceQuad(ctx, 'R', x, by, bw, bh, u, u + 0.05, 0.3, 0.7, shade(frame, 0.45)); faceQuad(ctx, 'L', x, by, bw, bh, u, u + 0.05, 0.3, 0.7, shade(frame, 0.45)); }
  curve(ctx, x - rx * 0.5, yb - 0.4 * k, x - rx * 0.55, yb - tall * 0.5 * k, x - 0.6 * k, apex + 1.4 * k, 0.6 * k, 'rgba(255,255,255,0.5)');
  ellipse(ctx, x, apex - 0.3 * k, 0.8 * k, 0.8 * k, frame); // the finial
  if (nasal) faceQuad(ctx, 'R', x, top + 10.5 * k, hw, 10.5 * k, 0.06, 0.2, 0.42, 1, frame);
}

/** A Georgian royal crown: a gold circlet set with stones, tall points with pearls, a small cross at the front. */
function crown(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const w = hw + 1.6 * k, h = 2.6 * k, cy = top + w / 4 + 1.6 * k;
  // the points round the rim
  for (const f of ['L', 'R'] as const) for (const u of [0.1, 0.5, 0.9]) {
    const [px, py] = pt(f, x, cy, w, h, u, 1);
    poly(ctx, [px - 1 * k, py, px, py - 3.4 * k, px + 1 * k, py], f === 'L' ? GOLD : GOLD_D);
    ellipse(ctx, px, py - 3.6 * k, 0.6 * k, 0.6 * k, '#f8f4e8');
  }
  faceQuad(ctx, 'L', x, cy, w, h, 0, 1, 0, 1, GOLD);
  faceQuad(ctx, 'R', x, cy, w, h, 0, 1, 0, 1, GOLD);
  for (const f of ['L', 'R'] as const) for (const [u, c] of [[0.25, GE_RED], [0.5, '#2a7a5a'], [0.75, GE_RED]] as const) {
    const [px, py] = pt(f, x, cy, w, h, u, 0.5);
    ellipse(ctx, px, py, 0.6 * k, 0.6 * k, c);
  }
  band(ctx, x, cy, w, h, 0.9, 1, GOLD_L);
  const [fx, fy] = pt('R', x, cy, w, h, 0, 1);
  cross(ctx, fx, fy - 4.6 * k, 0.9 * k, GOLD_L);
}

function head(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  switch (kind) {
    case 'warrior': papakhi(ctx, x, top, k, hw, FLEECE, 6.4); return;
    case 'archer': papakhi(ctx, x, top, k, hw, BROWN_D, 6, WINE); return;
    case 'rider': papakhi(ctx, x, top, k, hw, WHITE_FLEECE, 6.6, GE_RED); return;
    case 'explorer': bashlyk(ctx, x, top, k, hw, '#8a6a4a'); return;
    case 'defender':
      coif(ctx, x, top, k, hw);
      spangenhelm(ctx, x, top, k, hw, STEEL_D, '#8a6a3a', 6.6, false);
      return;
    case 'swordsman':
      coif(ctx, x, top, k, hw);
      spangenhelm(ctx, x, top, k, hw, '#9aa2ac', GOLD_D, 7.4, true);
      return;
    case 'khevsur': // a mail coif under a small round iron cap with a red tassel
      coif(ctx, x, top, k, hw);
      ellipse(ctx, x, top + 1 * k, hw / 2 + 0.4 * k, 3 * k, STEEL_D);
      ellipse(ctx, x - 0.6 * k, top + 0.2 * k, hw / 2 - 0.8 * k, 2.2 * k, shade(STEEL, -0.1));
      for (let i = 0; i < 5; i++) ellipse(ctx, x - hw / 2 + 1.2 * k + i * 2.1 * k, top + 2.8 * k + Math.abs(i - 2) * -0.25 * k, 0.32 * k, 0.32 * k, SILVER);
      line(ctx, x, top - 1.8 * k, x, top - 3.4 * k, STEEL_D, 0.6 * k);
      for (const d of [-0.6, 0, 0.6]) line(ctx, x, top - 3.4 * k, x - 2 * k + d * k, top - 0.6 * k, KHEV_RED, 0.5 * k);
      return;
    case 'knight':
      coif(ctx, x, top, k, hw);
      spangenhelm(ctx, x, top, k, hw, '#a8b0ba', GOLD, 8, true);
      return;
    case 'giant':
      crown(ctx, x, top, k, hw);
      return;
    default: papakhi(ctx, x, top, k, hw, FLEECE, 5.4); return;
  }
}

// ---------------------------------------------------------------- weapons

/** The kindjal: a broad, straight double-edged dagger with a fuller, a silver hilt worked in niello. */
function kindjal(ctx: Ctx, x: number, y: number, k: number, len = 9) {
  const hx = x + 0.2 * k, hy = y - 1.2 * k, tx = x + 2.4 * k, ty = y - (1.2 + len) * k;
  const L = Math.hypot(tx - hx, ty - hy), nx = -(ty - hy) / L, ny = (tx - hx) / L, dx = (tx - hx) / L, dy = (ty - hy) / L;
  const w = 1.15 * k;
  poly(ctx, [hx - nx * w, hy - ny * w, tx, ty, hx, hy], STEEL);
  poly(ctx, [hx + nx * w, hy + ny * w, tx, ty, hx, hy], STEEL_D);
  line(ctx, hx + dx * 0.6 * k, hy + dy * 0.6 * k, hx + (tx - hx) * 0.75, hy + (ty - hy) * 0.75, shade(STEEL_D, -0.3), 0.35 * k); // the fuller
  line(ctx, hx - nx * 1.4 * k, hy - ny * 1.4 * k, hx + nx * 1.4 * k, hy + ny * 1.4 * k, SILVER, 0.9 * k); // the small guard
  line(ctx, hx, hy, hx - dx * 3 * k, hy - dy * 3 * k, SILVER, 1.4 * k); // the hilt
  for (const t of [1, 2]) ellipse(ctx, hx - dx * t * k, hy - dy * t * k, 0.32 * k, 0.32 * k, NIELLO);
  ellipse(ctx, hx - dx * 3.4 * k, hy - dy * 3.4 * k, 0.95 * k, 0.75 * k, SILVER);
}

/** The Khevsur broadsword: a long straight blade, a plain cross-guard, a leather grip and a disc pommel. */
function broadsword(ctx: Ctx, x: number, y: number, k: number, len = 17, rich = false) {
  const hx = x + 0.2 * k, hy = y - 1.4 * k, tx = x + 4 * k, ty = y - (1.4 + len) * k;
  const L = Math.hypot(tx - hx, ty - hy), nx = -(ty - hy) / L, ny = (tx - hx) / L, dx = (tx - hx) / L, dy = (ty - hy) / L;
  const w = 1.1 * k;
  poly(ctx, [hx - nx * w, hy - ny * w, tx - nx * w * 0.7, ty - ny * w * 0.7, tx + dx * 1.6 * k, ty + dy * 1.6 * k, hx, hy], STEEL);
  poly(ctx, [hx + nx * w, hy + ny * w, tx + nx * w * 0.7, ty + ny * w * 0.7, tx + dx * 1.6 * k, ty + dy * 1.6 * k, hx, hy], STEEL_D);
  line(ctx, hx + dx * 0.8 * k, hy + dy * 0.8 * k, hx + (tx - hx) * 0.85, hy + (ty - hy) * 0.85, shade(STEEL_D, -0.3), 0.45 * k); // the fuller
  line(ctx, hx - nx * 3.2 * k, hy - ny * 3.2 * k, hx + nx * 3.2 * k, hy + ny * 3.2 * k, rich ? GOLD : STEEL_D, 1.2 * k); // the cross-guard
  ellipse(ctx, hx - nx * 3.2 * k, hy - ny * 3.2 * k, 0.6 * k, 0.6 * k, rich ? GOLD_L : STEEL);
  ellipse(ctx, hx + nx * 3.2 * k, hy + ny * 3.2 * k, 0.6 * k, 0.6 * k, rich ? GOLD_L : STEEL);
  line(ctx, hx, hy, hx - dx * 3.4 * k, hy - dy * 3.4 * k, LEATHER_D, 1.5 * k); // the grip
  for (const t of [1, 2.2]) line(ctx, hx - dx * t * k - nx * 0.7 * k, hy - dy * t * k - ny * 0.7 * k, hx - dx * t * k + nx * 0.7 * k, hy - dy * t * k + ny * 0.7 * k, KHEV_RED, 0.4 * k);
  const px = hx - dx * 4.4 * k, py = hy - dy * 4.4 * k;
  ellipse(ctx, px, py, 1.3 * k, 1 * k, rich ? GOLD : STEEL_D); // the disc pommel
  ellipse(ctx, px - 0.3 * k, py - 0.2 * k, 0.6 * k, 0.45 * k, rich ? GOLD_L : STEEL);
}

/** A spear with a long leaf blade and a red tassel under it. */
function spear(ctx: Ctx, x: number, y: number, k: number, len = 27) {
  const x0 = x - 1.8 * k, y0 = y + 6.2 * k, x1 = x + 3 * k, y1 = y + (6.2 - len) * k;
  line(ctx, x0, y0, x1, y1, WOOD, 1.4 * k);
  line(ctx, x0 - 0.4 * k, y0, x1 - 0.4 * k, y1, shade(WOOD, 0.4), 0.4 * k);
  poly(ctx, [x1 + 0.6 * k, y1 - 7.4 * k, x1 - 1.6 * k, y1 - 2.6 * k, x1, y1], shade(STEEL, 0.15));
  poly(ctx, [x1 + 0.6 * k, y1 - 7.4 * k, x1 + 2.2 * k, y1 - 2.4 * k, x1, y1], STEEL_D);
  line(ctx, x1 + 0.4 * k, y1 - 6.6 * k, x1, y1 - 1 * k, '#ffffff', 0.35 * k);
  for (const d of [-0.5, 0, 0.5]) line(ctx, x1 - 0.2 * k, y1 + 0.4 * k, x1 - 0.8 * k + d * k, y1 + 3.6 * k, GE_RED, 0.5 * k); // the tassel
}

/** A composite recurve bow with an arrow on the string. */
function bow(ctx: Ctx, x: number, y: number, k: number) {
  const bx = x - 3.4 * k, top = { x: bx + 2.4 * k, y: y - 13.6 * k }, bot = { x: bx + 2.4 * k, y: y + 10.4 * k }, ctl = { x: bx + 10.4 * k, y: y - 1.6 * k };
  const nock = { x: bx - 3 * k, y: y - 1.6 * k };
  for (const [c, wd, dx] of [['#3a2418', 2, 0], ['#9a6a3a', 1.2, -0.35], [shade('#c9a06a', 0.3), 0.35, -0.7]] as const) curve(ctx, top.x + dx * k, top.y, ctl.x + dx * k, ctl.y, bot.x + dx * k, bot.y, wd * k, c);
  line(ctx, top.x, top.y, top.x + 1.4 * k, top.y - 2.4 * k, '#3a2418', 1.1 * k);
  line(ctx, bot.x, bot.y, bot.x + 1.4 * k, bot.y + 2.4 * k, '#3a2418', 1.1 * k);
  ctx.strokeStyle = ink('#e8e0c8');
  ctx.lineWidth = 0.4 * k;
  ctx.beginPath();
  ctx.moveTo(top.x + 1.4 * k, top.y - 2.4 * k);
  ctx.lineTo(nock.x, nock.y);
  ctx.lineTo(bot.x + 1.4 * k, bot.y + 2.4 * k);
  ctx.stroke();
  line(ctx, x + 0.8 * k, y - 1.8 * k, x + 0.8 * k, y + 0.6 * k, GE_RED, 1.6 * k);
  const tx = x + 9.4 * k, ty = y - 3.6 * k;
  line(ctx, nock.x, nock.y, tx, ty, '#c9a06a', 0.7 * k);
  poly(ctx, [tx, ty - 1 * k, tx + 3 * k, ty + 0.2 * k, tx, ty + 1 * k], STEEL_D);
  for (const t of [0.05, 0.13]) { const px = nock.x + (tx - nock.x) * t, py = nock.y + (ty - nock.y) * t; poly(ctx, [px, py, px + 2.2 * k, py - 1.6 * k, px + 2.6 * k, py - 0.4 * k], t < 0.1 ? LINEN : GE_RED); }
}

/** A quiver of red leather with silver mounts at the archer's back. */
function quiver(ctx: Ctx, x: number, y: number, k: number) {
  const qx = x - 6 * k, qy = y - 14 * k;
  poly(ctx, [qx - 1.4 * k, qy, qx + 1.4 * k, qy + 0.6 * k, qx + 2.4 * k, qy + 9 * k, qx - 0.4 * k, qy + 9.4 * k], GE_RED_D);
  for (const t of [0.15, 0.7]) line(ctx, qx - 1.2 * k + t * 1.2 * k, qy + t * 9 * k, qx + 1.6 * k + t * 0.9 * k, qy + 0.6 * k + t * 8.6 * k, SILVER, 0.5 * k);
  for (let i = 0; i < 4; i++) line(ctx, qx - 0.8 * k + i * 0.7 * k, qy + 0.2 * k, qx - 1.6 * k + i * 0.7 * k, qy - 2.6 * k, i % 2 ? LINEN : GE_RED, 0.5 * k);
}

function weapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  switch (kind) {
    case 'warrior': kindjal(ctx, x, y, k, 10); shieldFor(ctx, kind, b.off.x, b.off.y, k); return true;
    case 'archer': quiver(ctx, b.off.x + 4 * k, b.off.y + 4 * k, k); bow(ctx, x, y, k); return true;
    case 'defender': spear(ctx, x, y, k); return true; // the shield comes afterwards
    case 'swordsman': broadsword(ctx, x, y, k, 16); shieldFor(ctx, kind, b.off.x, b.off.y, k); return true;
    case 'khevsur': broadsword(ctx, x, y, k, 18); shieldFor(ctx, kind, b.off.x, b.off.y, k); return true;
    case 'giant': broadsword(ctx, x, y, k, 20, true); shieldFor(ctx, kind, b.off.x, b.off.y, k); return true;
    case 'explorer': // a long walking staff
      line(ctx, x - 1 * k, y + 6 * k, x + 2 * k, y - 18 * k, WOOD, 1.2 * k);
      line(ctx, x - 1.3 * k, y + 6 * k, x + 1.7 * k, y - 18 * k, WOOD_L, 0.35 * k);
      return true;
  }
  return false;
}

// ---------------------------------------------------------------- mounted troops

/** A lance with a red swallow-tailed banner carrying a gold borjgali. */
function lance(ctx: Ctx, hx: number, hy: number, thick: number, banner: boolean) {
  const tx = hx + 8, ty = hy - 21;
  line(ctx, hx - 3, hy + 6, tx, ty, WOOD_D, thick);
  line(ctx, hx - 3.6, hy + 6, tx - 0.6, ty, shade(WOOD, 0.35), 0.5);
  poly(ctx, [tx + 0.4, ty - 5.6, tx - 1.4, ty + 0.4, tx + 0.4, ty + 1], STEEL);
  poly(ctx, [tx + 0.4, ty - 5.6, tx + 2.2, ty + 0.2, tx + 0.4, ty + 1], STEEL_D);
  if (banner) {
    const bx = tx - 0.2, by = ty + 2;
    poly(ctx, [bx, by, bx + 10, by + 1.2, bx + 7, by + 3.8, bx + 10, by + 7.2, bx - 0.4, by + 6.6], GE_RED);
    poly(ctx, [bx, by, bx + 10, by + 1.2, bx + 9.2, by + 2.1, bx, by + 1.5], GE_RED_L);
    borjgali(ctx, bx + 3.6, by + 3.8, 1.8, GOLD);
  } else {
    poly(ctx, [tx - 0.4, ty + 1.6, tx + 6.4, ty + 2.6, tx + 4.2, ty + 4.2, tx + 6.4, ty + 6, tx - 0.8, ty + 5.2], GE_RED);
  }
}

/** Georgian horse gear: a silver-studded bridle and breast strap with hanging tassels. */
function tack(ctx: Ctx, x: number, y: number, rich: boolean) {
  const kh = 0.92, hx0 = x - 1, hy0 = y + 3;
  line(ctx, x + 3.5, y - 9.4, x + 8, y - 3.6, LEATHER_D, 1.2);
  for (let i = 0; i < 4; i++) {
    const t = (i + 0.5) / 4, px = x + 3.5 + 4.5 * t, py = y - 9.4 + 5.8 * t;
    ellipse(ctx, px, py, 0.55, 0.55, SILVER);
    line(ctx, px, py + 0.4, px, py + 2.4, rich ? GE_RED : '#2a2222', 0.6);
  }
  const hhx = hx0 + 10.5 * kh, hhy = hy0 - 15 * kh;
  for (const [dx, dy] of [[1.6, 0.2], [0.6, -2.2], [-0.8, -3.6]] as const) ellipse(ctx, hhx + dx, hhy + dy, 0.55, 0.55, SILVER);
  for (let i = -1; i <= 1; i++) line(ctx, hhx + 2.6, hhy + 1, hhx + 2.6 + i * 0.5, hhy + 4, GE_RED, 0.6);
}

/** A caparison border: a gold band with borjgali roundels along the red cloth. */
function caparisonDecor(ctx: Ctx, x: number, y: number, k: number) {
  const cx = x, cy = y - 6 * k, w = 17 * k, h = 7 * k;
  for (const f of ['L', 'R'] as const) for (const u of [0.25, 0.7]) {
    const [px, py] = pt(f, cx, cy, w, h, u, 0.36);
    ellipse(ctx, px, py, 1.5 * k, 1.5 * k, GOLD_D);
    borjgali(ctx, px, py, 1.2 * k, GOLD_L);
  }
  for (const f of ['L', 'R'] as const) for (let i = 0; i < 6; i++) { // a fringe of tassels
    const [px, py] = pt(f, cx, cy, w, h, 0.05 + i * 0.18, 0);
    line(ctx, px, py, px, py + 1.4 * k, GOLD, 0.45 * k);
  }
}

/** The knight: a mailed noble of the royal host (monaspa) on a horse in a red caparison, with a bannered lance. */
function knight(ctx: Ctx, x: number, y: number) {
  const saddle = drawHorse(ctx, x - 1, y + 3, 0.92, '#5a3a26', '#1a120c', GE_RED);
  caparisonDecor(ctx, x - 1, y + 3, 0.92);
  tack(ctx, x, y, true);
  const b = figure(ctx, 'knight', 'georgia', saddle.x, saddle.y, 0.9, true);
  buckler(ctx, b.off.x - 1.4, b.off.y - 3, 3.2, 0.75, 'red');
  lance(ctx, b.hand.x, b.hand.y, 1.8, true);
}

/** The light horseman: a black chokha and a white papakhi, a bow case at the saddle, a light lance with a pennant. */
function rider(ctx: Ctx, x: number, y: number) {
  const saddle = drawHorse(ctx, x - 1, y + 3, 0.88, '#8a5a32', '#2a1a10', undefined, GE_RED_D);
  tack(ctx, x, y, false);
  // a bow case of red leather hung behind the leg, silver-mounted
  poly(ctx, [saddle.x - 3.4, saddle.y + 1.6, saddle.x - 0.6, saddle.y + 2.4, saddle.x - 2, saddle.y + 9, saddle.x - 4.8, saddle.y + 8], GE_RED_D);
  for (const t of [0.3, 0.7]) line(ctx, saddle.x - 3.4 + t * -1.2, saddle.y + 1.8 + t * 6.4, saddle.x - 0.8 + t * -1.2, saddle.y + 2.4 + t * 6.4, SILVER, 0.5);
  curve(ctx, saddle.x - 3.2, saddle.y + 1.8, saddle.x - 5.2, saddle.y - 2, saddle.x - 7.4, saddle.y - 3, 0.9, '#3a2418');
  const b = figure(ctx, 'rider', 'georgia', saddle.x, saddle.y, 0.88, true);
  buckler(ctx, b.off.x - 1.4, b.off.y - 2.6, 2.6, 0.66, 'leather');
  lance(ctx, b.hand.x, b.hand.y, 1.4, false);
}

// ---------------------------------------------------------------- the trebuchet

/** A counterweight trebuchet on a timber frame: a long arm with a sling, a hinged box of stones, a crew and a banner. */
function trebuchet(ctx: Ctx, x: number, y: number) {
  for (const [ax, ay, ar] of [[15, 6, 2.2], [18.4, 7, 1.9], [16.6, 3.8, 1.7]] as const) { // shot stones
    ellipse(ctx, x + ax, y + ay, ar, ar * 0.85, '#8a8478');
    ellipse(ctx, x + ax - ar * 0.3, y + ay - ar * 0.3, ar * 0.45, ar * 0.35, '#c8c0b0');
  }
  // the base: two long sills and a cross beam
  for (const [ox, oy] of [[-3, -2], [4, 2]] as const) box(ctx, x + ox, y + oy, 24, 2.4, WOOD, shade(WOOD, 0.18));
  box(ctx, x, y, 4, 2.6, WOOD_D);
  // the uprights: two tall A-frames carrying the axle
  const A: [number, number] = [x + 1, y - 22];
  for (const [bx, by] of [[x - 9, y - 0.6], [x + 9, y + 1.4], [x - 4, y - 3], [x + 6, y + 4]] as const) {
    line(ctx, bx, by, A[0] + (bx < x ? -1.4 : 1.4), A[1] + 0.4, WOOD_D, 2.4);
    line(ctx, bx - 0.5, by, A[0] + (bx < x ? -1.4 : 1.4) - 0.5, A[1] + 0.4, WOOD, 1.3);
  }
  line(ctx, x - 6, y - 8, x + 8, y - 7, WOOD_D, 1.2); // braces
  line(ctx, x - 3.6, y - 15, x + 6, y - 14.6, WOOD_D, 1.1);
  for (const [px, py] of [[x - 6, y - 8], [x + 8, y - 7]] as const) ellipse(ctx, px, py, 0.5, 0.5, STEEL_D); // iron pins
  line(ctx, A[0] - 4, A[1] + 0.4, A[0] + 4.4, A[1] - 0.4, WOOD_D, 2.4); // the axle
  // the arm: long to the back (the sling end, raised), short to the front with the counterweight
  const tip: [number, number] = [x - 19, y - 42], hinge: [number, number] = [x + 9, y - 13];
  line(ctx, hinge[0], hinge[1], tip[0], tip[1], WOOD_D, 3);
  line(ctx, hinge[0] - 0.3, hinge[1] - 0.6, tip[0] + 0.3, tip[1] - 0.5, WOOD_L, 1.4);
  for (const t of [0.25, 0.45, 0.65]) { const px = hinge[0] + (tip[0] - hinge[0]) * t, py = hinge[1] + (tip[1] - hinge[1]) * t; line(ctx, px - 1.2, py + 0.6, px + 1.2, py - 0.6, t === 0.45 ? GE_RED : STEEL_D, 1); }
  // the counterweight: a hinged box of stones hanging from the short end
  line(ctx, hinge[0] - 1.6, hinge[1], hinge[0] - 1.6, hinge[1] + 4, STEEL_D, 0.7);
  line(ctx, hinge[0] + 1.6, hinge[1], hinge[0] + 1.6, hinge[1] + 4, STEEL_D, 0.7);
  box(ctx, hinge[0], hinge[1] + 10.4, 7, 6.4, WOOD, shade(WOOD, 0.2));
  for (const u of [0.3, 0.7]) { faceQuad(ctx, 'R', hinge[0], hinge[1] + 10.4, 7, 6.4, u, u + 0.06, 0, 1, WOOD_D); faceQuad(ctx, 'L', hinge[0], hinge[1] + 10.4, 7, 6.4, u, u + 0.06, 0, 1, WOOD_D); }
  for (const [dx, dy] of [[-1.4, -6.6], [0.8, -6.8], [2, -6], [-0.2, -5.8]] as const) ellipse(ctx, hinge[0] + dx, hinge[1] + 10.4 + dy, 1, 0.7, '#9a9286');
  // the sling hanging from the tip, its pouch on the ground under the frame
  const pouch: [number, number] = [x - 12, y - 1];
  curve(ctx, tip[0], tip[1], tip[0] - 3, (tip[1] + pouch[1]) / 2, pouch[0] - 2.4, pouch[1] - 1, 0.55, '#a89060');
  curve(ctx, tip[0], tip[1], tip[0] + 4, (tip[1] + pouch[1]) / 2, pouch[0] + 2.6, pouch[1] - 1, 0.55, '#a89060');
  ellipse(ctx, pouch[0], pouch[1] + 0.4, 3.2, 1.8, LEATHER_D);
  ellipse(ctx, pouch[0], pouch[1] - 0.6, 1.7, 1.4, '#8a8478');
  // a red banner with the borjgali beside the engine
  const fx = x + 15, fy = y - 2;
  line(ctx, fx, fy + 2, fx, fy - 30, WOOD_D, 1);
  poly(ctx, [fx, fy - 29, fx + 10, fy - 27.6, fx + 7.4, fy - 24.6, fx + 10, fy - 21, fx, fy - 21.6], GE_RED);
  poly(ctx, [fx, fy - 29, fx + 10, fy - 27.6, fx + 9.2, fy - 26.6, fx, fy - 27.4], GE_RED_L);
  borjgali(ctx, fx + 3.8, fy - 25.2, 2, GOLD);
  ellipse(ctx, fx, fy - 30.6, 0.8, 0.8, GOLD);
  figure(ctx, 'catapult', 'georgia', x - 3, y + 8, 0.62);
}

// ---------------------------------------------------------------- Black Sea boats

/** A lateen sail on a slanted yard from (x0, y0) high to (x1, y1) low, striped red and white. */
function lateen(ctx: Ctx, mx: number, my: number, x0: number, y0: number, x1: number, y1: number, emblem: boolean) {
  const clew: [number, number] = [mx + 2, my - 2];
  line(ctx, x0, y0, x1, y1, WOOD_D, 1); // the yard
  poly(ctx, [x0, y0, x1, y1, clew[0], clew[1]], LINEN);
  for (let i = 0; i < 2; i++) { // red stripes along the sail
    const a = 0.2 + i * 0.4, b = a + 0.2;
    const P = (t: number, s: number): [number, number] => {
      const ex = x0 + (x1 - x0) * t, ey = y0 + (y1 - y0) * t;
      return [ex + (clew[0] - ex) * s, ey + (clew[1] - ey) * s];
    };
    poly(ctx, [...P(a, 0), ...P(b, 0), ...P(b, 1), ...P(a, 1)], GE_RED);
  }
  poly(ctx, [x1, y1, clew[0], clew[1], clew[0] - 2, clew[1] - 1, x1 + 1.6, y1 + 0.4], 'rgba(0,0,0,0.12)');
  if (emblem) {
    const ex = (x0 + x1 + clew[0]) / 3, ey = (y0 + y1 + clew[1]) / 3;
    ellipse(ctx, ex, ey, 2.6, 2.6, LINEN);
    borjgali(ctx, ex, ey, 2.2, GE_RED_D);
  }
}

/** A hull between -w and w round (x, y), rising `rise` at the ends; returns its gunwale points. */
function hull(ctx: Ctx, x: number, y: number, w: number, rise: number, wood: string, paint: string | null) {
  const woodD = shade(wood, -0.45), woodL = shade(wood, 0.25);
  const top = (t: number) => y - 5 - Math.pow(Math.abs(t), 2.4) * rise;
  const near: [number, number][] = [];
  for (let i = 0; i <= 10; i++) { const t = -1 + i * 0.2; near.push([x + t * w, top(t)]); }
  const far = near.map(([px, py], i) => [px + (i === 0 ? 2 : i === 10 ? -2 : 0), py - 2.6] as [number, number]);
  poly(ctx, [...near.flatMap(([a, b]) => [a, b]), ...[...far].reverse().flatMap(([a, b]) => [a, b])], '#3a2412');
  poly(ctx, [x - w * 0.86, y - 5.2, x + w * 0.86, y - 5.4, x + w * 0.86, y - 7.2, x - w * 0.86, y - 7], '#b8945c');
  return {
    near, top,
    front: () => {
      const shape = [...near, [x + w * 0.84, y - 1.2], [x + w * 0.5, y + 2.4], [x, y + 3.2], [x - w * 0.5, y + 2.4], [x - w * 0.84, y - 1.2]] as [number, number][];
      poly(ctx, shape.flatMap(([a, b]) => [a, b]), wood);
      poly(ctx, [...near.flatMap(([a, b]) => [a, b]), x + w * 0.78, y - 3.2, x, y - 2.6, x - w * 0.78, y - 3.2], woodL);
      if (paint) poly(ctx, [...near.flatMap(([a, b]) => [a, b + 0.2]), ...[...near].reverse().flatMap(([a, b]) => [a, b + 1.4])], paint); // a painted strake
      for (const dv of [2, 3.4]) {
        ctx.strokeStyle = ink(shade(wood, -0.35));
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let i = 1; i < 10; i++) { const t = -1 + i * 0.2, px = x + t * w * 0.94, py = top(t) * (1 - dv / 6) + (y + 2) * (dv / 6); if (i === 1) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
        ctx.stroke();
      }
      poly(ctx, [x - w * 0.84, y - 1.2, x - w * 0.5, y + 2.4, x, y + 3.2, x + w * 0.5, y + 2.4, x + w * 0.84, y - 1.2, x + w * 0.5, y - 0.2, x, y + 0.6, x - w * 0.5, y - 0.2], woodD);
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; // foam along the waterline
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x, y + 3.2, w * 0.78, 2.2, 0, 0.08 * Math.PI, 0.92 * Math.PI);
      ctx.stroke();
    },
  };
}

/** Black Sea craft: a small lateen fishing boat, a round-hulled trader, and the royal galley with oars and a ram. */
function blackSeaBoat(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  const tier = kind === 'warship' ? 2 : kind === 'ship' ? 1 : 0;
  const w = [15, 21, 28][tier], rise = [4, 6, 3.6][tier];
  const wood = tier === 2 ? '#5a3a26' : '#8a5a34';
  const H = hull(ctx, x, y, w, rise, wood, tier === 2 ? GE_RED : tier === 1 ? '#2a5a7a' : null);
  const crew = (cx: number, kd: UnitKind, kk: number) => figure(ctx, kd, 'georgia', cx, y - 4.6, kk, true);
  if (tier === 0) {
    const mx = x + 2, my = y - 6;
    line(ctx, mx, my, mx, my - 20, WOOD_D, 1.1);
    lateen(ctx, mx, my, mx - 9, my - 23, mx + 9, my - 9, false);
    crew(x - 6, 'warrior', 0.44);
  } else if (tier === 1) {
    // a raised stern deck and a single big lateen with the borjgali
    box(ctx, x - w * 0.72, y - 6, 8, 3, wood, shade(wood, 0.2));
    const mx = x + 1, my = y - 7;
    line(ctx, mx, my, mx, my - 26, WOOD_D, 1.3);
    lateen(ctx, mx, my, mx - 12, my - 29, mx + 12, my - 10, true);
    line(ctx, mx, my - 26, x + w - 1, H.top(1) - 1.6, '#5a4a3a', 0.4);
    poly(ctx, [mx, my - 26.4, mx + 5, my - 25.6, mx + 3.6, my - 24.6, mx + 5, my - 23.6, mx, my - 24], GE_RED);
    crew(x - 9, 'warrior', 0.42); crew(x + 8, 'archer', 0.42);
    // a jar of wine in the cargo
    ellipse(ctx, x + 4.4, y - 6.4, 1.6, 1.2, '#c4733e');
  } else {
    // the galley: two masts with lateens, a stern castle with the royal banner
    for (const [mx, sz, em] of [[x + 6, 1, true], [x - 9, 0.7, false]] as const) {
      const my = y - 7, mh = 28 * sz;
      line(ctx, mx, my, mx, my - mh, WOOD_D, 1.3);
      lateen(ctx, mx, my, mx - 12 * sz, my - mh - 2, mx + 12 * sz, my - 10 * sz, em);
    }
    crew(x - 4, 'swordsman', 0.42); crew(x + 12, 'archer', 0.42);
    box(ctx, x - w * 0.78, y - 7, 9, 4, '#6a4428', shade('#6a4428', 0.2));
    for (const u of [0.2, 0.5, 0.8]) faceQuad(ctx, 'R', x - w * 0.78, y - 7, 9, 4, u, u + 0.08, 0.3, 0.8, GE_RED);
    const sx = x - w * 0.82;
    line(ctx, sx, y - 11, sx, y - 26, WOOD_D, 0.9);
    poly(ctx, [sx, y - 26, sx + 8, y - 25, sx + 6, y - 22.6, sx + 8, y - 20, sx, y - 20.6], GE_RED);
    borjgali(ctx, sx + 3, y - 23.2, 1.5, GOLD);
  }
  H.front();
  if (tier === 2) {
    // the oars, a long bank of them, and small round shields along the rail
    for (let i = 0; i < 9; i++) {
      const t = -0.7 + (i / 8) * 1.4, ox = x + t * w * 0.82, oy = H.top(t) + 1.4;
      line(ctx, ox, oy, ox - 4, oy + 8, WOOD_D, 0.7);
      ellipse(ctx, ox - 4.2, oy + 8.4, 0.8, 1.4, WOOD);
    }
    for (let i = 0; i < 6; i++) {
      const t = -0.55 + (i / 5) * 1.1, sx2 = x + t * w * 0.82, sy2 = H.top(t) + 0.4;
      buckler(ctx, sx2, sy2, 1.6, 0.4, i % 2 ? 'red' : 'leather');
    }
    // the ram at the bow, sheathed in bronze
    const [bx, by] = H.near[10];
    const rx = x + w * 0.8, ry = y - 1.6;
    poly(ctx, [rx - 1, ry - 1.6, rx + 7, ry + 0.6, rx - 0.4, ry + 2], '#b08040');
    poly(ctx, [rx - 1, ry - 1.6, rx + 7, ry + 0.6, rx + 0.6, ry + 0.2], '#d8a860');
    curve(ctx, bx - 1.4, by + 1, bx + 1, by - 1, bx + 0.6, by - 4.4, 1.6, '#3a2414');
    ellipse(ctx, bx + 0.6, by - 4.8, 1, 1, GOLD);
  } else {
    const oars = tier === 0 ? 2 : 3;
    for (let i = 0; i < oars; i++) {
      const t = -0.5 + (i / Math.max(1, oars - 1)) * 1, ox = x + t * w * 0.8, oy = H.top(t) + 0.6;
      line(ctx, ox, oy, ox - 4, oy + 8.4, WOOD_D, 0.8);
      ellipse(ctx, ox - 4.2, oy + 8.8, 0.9, 1.6, WOOD);
    }
    const [bx, by] = H.near[10];
    curve(ctx, bx - 1.4, by + 1, bx + 1.4, by - 1, bx + 1.2, by - 3.6, 1.6, '#4a2c16');
    if (tier === 1) { // painted eyes on the bow
      ellipse(ctx, bx - 2.4, by + 1.6, 1, 0.7, LINEN);
      ellipse(ctx, bx - 2.2, by + 1.6, 0.45, 0.45, '#1a1a1a');
    }
  }
  const [sx, sy] = H.near[0]; // the steering oar
  line(ctx, sx + 2.4, sy + 0.4, sx - 2.6, sy + 7.6, WOOD_D, 1);
  ellipse(ctx, sx - 2.8, sy + 8, 1, 1.8, WOOD);
}

function unit(ctx: Ctx, kind: UnitKind, x: number, y: number): boolean {
  switch (kind) {
    case 'knight': knight(ctx, x, y); return true;
    case 'rider': rider(ctx, x, y); return true;
    case 'catapult': trebuchet(ctx, x, y); return true;
    case 'boat': case 'ship': case 'warship': blackSeaBoat(ctx, kind, x, y); return true;
  }
  return false;
}

// ---------------------------------------------------------------- buildings

/** Rough stone walls: a box with a few courses and scattered stones picked out. */
function stoneWall(ctx: Ctx, x: number, y: number, w: number, h: number, c: string, seed: number) {
  box(ctx, x, y, w, h, c, shade(c, 0.12));
  const rows = Math.max(2, Math.round(h / 2.2));
  for (let r = 1; r < rows; r++) {
    const v = r / rows;
    faceQuad(ctx, 'L', x, y, w, h, 0, 1, v - 0.015, v + 0.015, shade(c, -0.18));
    faceQuad(ctx, 'R', x, y, w, h, 0, 1, v - 0.015, v + 0.015, shade(c, -0.22));
  }
  for (let i = 0; i < Math.round(w * h / 18); i++) { // odd stones lighter or darker
    const f = i % 2 ? 'L' : 'R', u = rand(seed, i) * 0.9, v = rand(seed + 1, i) * 0.9;
    faceQuad(ctx, f, x, y, w, h, u, u + 0.12, v, v + 0.06, shade(c, rand(seed + 2, i) > 0.5 ? 0.12 : -0.14));
  }
}

/** A window or door: a dark opening with an arched top. */
function arch(ctx: Ctx, face: 'L' | 'R', x: number, y: number, w: number, h: number, u: number, v: number, du: number, dv: number, c = SKY_GLASS) {
  faceQuad(ctx, face, x, y, w, h, u, u + du, v, v + dv, c);
  const [ax, ay] = pt(face, x, y, w, h, u + du / 2, v + dv);
  ellipse(ctx, ax, ay, (du * w) / 4 + 0.05, (du * w) / 6 + 0.05, c);
}

/** A carved wooden balcony along the upper floor of a face: a floor, posts, a fretted railing and a shading roof. */
function balcony(ctx: Ctx, face: 'L' | 'R', x: number, y: number, w: number, h: number, v0: number, v1: number, paint: string) {
  const out = 1.6; // how far it projects
  const ox = face === 'R' ? out * 0.5 : -out * 0.5, oy = out * 0.25;
  const P = (u: number, v: number): [number, number] => { const [px, py] = pt(face, x, y, w, h, u, v); return [px + ox, py + oy]; };
  const B = (u: number, v: number): [number, number] => pt(face, x, y, w, h, u, v);
  poly(ctx, [...B(0.04, v0), ...B(0.96, v0), ...P(0.96, v0), ...P(0.04, v0)], WOOD_D); // the floor's underside
  for (let i = 0; i < 6; i++) { const u = 0.08 + i * 0.17; const [a, b] = B(u, v0), [c, d] = P(u, v0); line(ctx, a, b + 0.2, c, d + 1, WOOD_D, 0.4); } // brackets
  faceQuad(ctx, face, x + ox, y + oy, w, h, 0.04, 0.96, v0, v0 + (v1 - v0) * 0.36, paint); // the railing panel
  for (let i = 0; i < 9; i++) { // fretwork: little lozenges along it
    const u = 0.08 + i * 0.105;
    const [cx, cy] = P(u, v0 + (v1 - v0) * 0.18);
    poly(ctx, [cx, cy - 0.7, cx + 0.5, cy, cx, cy + 0.7, cx - 0.5, cy], shade(paint, -0.4));
  }
  for (const u of [0.05, 0.36, 0.66, 0.95]) { const [a, b] = P(u, v0), [c, d] = P(u, v1); line(ctx, a, b, c, d, shade(paint, -0.25), 0.55); } // posts
  const [r0x, r0y] = P(0, v1), [r1x, r1y] = P(1, v1), [b1x, b1y] = B(1, v1 + 0.05), [b0x, b0y] = B(0, v1 + 0.05);
  poly(ctx, [r0x + (face === 'R' ? 0 : -0.6), r0y + 0.4, r1x + (face === 'R' ? 0.6 : 0), r1y + 0.4, b1x, b1y, b0x, b0y], shade(WOOD, -0.15)); // its little roof
}

/** A flat roof: a parapet edge round the top of a box, with a few things on it. */
function flatRoof(ctx: Ctx, x: number, y: number, w: number, h: number, c: string) {
  band(ctx, x, y, w, h, 0.94, 1, shade(c, 0.12));
  poly(ctx, [x, y - h - w / 4 + 0.6, x + w / 2 - 0.6, y - h, x, y - h + w / 4 - 0.6, x - w / 2 + 0.6, y - h], shade(c, -0.12)); // the roof deck
}

/** A Tbilisi house: two storeys of brick and stone, a flat roof, a carved wooden balcony on the upper floor. */
function tbilisiHouse(ctx: Ctx, x: number, y: number, wall: string, paint: string, seed: number) {
  stoneWall(ctx, x, y, 11, 12, wall, seed);
  arch(ctx, 'R', x, y, 11, 12, 0.4, 0, 0.2, 0.3, '#3a2a20'); // the door
  arch(ctx, 'L', x, y, 11, 12, 0.3, 0.2, 0.16, 0.2);
  arch(ctx, 'L', x, y, 11, 12, 0.3, 0.62, 0.16, 0.18);
  flatRoof(ctx, x, y, 11, 12, wall);
  balcony(ctx, 'R', x, y, 11, 12, 0.5, 0.92, paint);
  for (const u of [0.25, 0.7]) arch(ctx, 'R', x, y, 11, 12, u - 0.06, 0.62, 0.12, 0.2); // windows behind it
  // laundry and a pot plant on the roof, a clay chimney
  box(ctx, x - 2, y - 12.4, 1.4, 2.4, BRICK);
  ellipse(ctx, x + 2, y - 12.6, 0.9, 0.6, '#5a8a3a');
}

/** A Svan tower: a tall square stone tower, slightly tapering, with slit windows and a slate-capped fighting top. */
function svanTower(ctx: Ctx, x: number, y: number, h: number, seed: number) {
  const w = 5.6;
  stoneWall(ctx, x, y, w, h, '#b8ae9c', seed);
  for (const v of [0.35, 0.6, 0.82]) { faceQuad(ctx, 'R', x, y, w, h, 0.42, 0.56, v, v + 0.06, '#2a2420'); faceQuad(ctx, 'L', x, y, w, h, 0.45, 0.58, v - 0.04, v + 0.02, '#2a2420'); }
  // the jettied top with machicolations and a low slate pyramid roof
  const ty = y - h;
  box(ctx, x, ty, w + 1.6, 3, '#c4baa8', shade('#c4baa8', 0.12));
  for (const u of [0.2, 0.5, 0.8]) { faceQuad(ctx, 'R', x, ty, w + 1.6, 3, u, u + 0.1, 0, 0.22, '#3a3028'); faceQuad(ctx, 'L', x, ty, w + 1.6, 3, u, u + 0.1, 0, 0.22, '#3a3028'); }
  for (const u of [0.35, 0.7]) faceQuad(ctx, 'R', x, ty, w + 1.6, 3, u, u + 0.1, 0.45, 0.8, '#2a2420');
  const hw = (w + 2.4) / 2, ry = ty - 3;
  poly(ctx, [x - hw, ry, x, ry + hw / 2, x, ry - 5], shade(SLATE, 0.12));
  poly(ctx, [x + hw, ry, x, ry + hw / 2, x, ry - 5], shade(SLATE, -0.22));
}

/** A low stone farmhouse with a flat earth roof. */
function stoneHut(ctx: Ctx, x: number, y: number, w: number, h: number, seed: number) {
  stoneWall(ctx, x, y, w, h, STONE_D, seed);
  arch(ctx, 'R', x, y, w, h, 0.36, 0, 0.18, 0.5, '#3a2a20');
  flatRoof(ctx, x, y, w, h, '#8a7a5a');
  ellipse(ctx, x - 1, y - h - 0.2, 1.6, 0.6, '#6a8a3a'); // grass on the earth roof
}

/** A vine pergola: posts, a lattice of poles, vines leafing out and grapes hanging (also used as a "tree"). */
function pergola(ctx: Ctx, x: number, y: number, s: number, leaf: string, grapes: boolean, seed: number) {
  const W = 9 * s, H = 9 * s;
  const posts: [number, number][] = [[-W, 0], [0, W / 2], [W, 0], [0, -W / 2]];
  for (const [px, py] of posts) {
    line(ctx, x + px, y + py, x + px, y + py - H, WOOD_D, 0.9 * s);
    line(ctx, x + px - 0.3 * s, y + py, x + px - 0.3 * s, y + py - H, WOOD_L, 0.3 * s);
  }
  // vine trunks twisting up
  for (const [px, py] of posts) curve(ctx, x + px + 0.8 * s, y + py, x + px + 2 * s, y + py - H * 0.5, x + px + 0.6 * s, y + py - H, 0.7 * s, '#5a3a24');
  // the leaf canopy on the lattice: a flat diamond of leaves
  const cy = y - H;
  poly(ctx, [x - W, cy, x, cy + W / 2, x + W, cy, x, cy - W / 2], shade(leaf, -0.3));
  for (let i = 0; i < 26; i++) {
    const a = rand(seed, i) * 2 - 1, b = rand(seed + 3, i) * 2 - 1;
    if (Math.abs(a) + Math.abs(b) > 1) continue;
    const lx = x + a * W, ly = cy + b * W / 2 - 0.4 * s;
    ellipse(ctx, lx, ly, 1.7 * s, 1.1 * s, shade(leaf, -0.15 + rand(seed + 5, i) * 0.3));
  }
  for (const [px, py] of posts) line(ctx, x + px, y + py - H, x + px, y + py - H - 0.6 * s, WOOD, 0.8 * s);
  // the near edges of the lattice
  line(ctx, x - W, cy, x, cy + W / 2, WOOD, 0.5 * s);
  line(ctx, x, cy + W / 2, x + W, cy, WOOD, 0.5 * s);
  if (grapes) for (const [gx, gy] of [[-W * 0.5, W * 0.25], [W * 0.4, W * 0.3], [-W * 0.05, W * 0.45], [W * 0.75, W * 0.1]] as const) {
    for (const [dx, dy] of [[0, 0.8], [-0.6, 1.5], [0.6, 1.5], [0, 2.2], [-0.3, 2.9], [0.3, 2.9]] as const) {
      ellipse(ctx, x + gx + dx * s, cy + gy + dy * s, 0.55 * s, 0.55 * s, '#4a1e48');
      ellipse(ctx, x + gx + dx * s - 0.15 * s, cy + gy + dy * s - 0.15 * s, 0.22 * s, 0.22 * s, '#8a4a7e');
    }
  }
}

/** A conical roof over a round drum: the Georgian dome. */
function cone(ctx: Ctx, x: number, y: number, r: number, h: number, c: string) {
  poly(ctx, [x - r - 0.5, y, x, y + r * 0.32, x, y - h], shade(c, 0.12));
  poly(ctx, [x + r + 0.5, y, x, y + r * 0.32, x, y - h], shade(c, -0.24));
  for (let i = 1; i < 4; i++) { const t = i / 4; line(ctx, x - (r + 0.5) * (1 - t), y - h * t + 0.2, x, y + r * 0.32 * (1 - t) - h * t, shade(c, -0.12), 0.3); }
  line(ctx, x, y - h, x, y - h - 2.4, GOLD_D, 0.6); // a small cross on top
  line(ctx, x - 0.9, y - h - 1.6, x + 0.9, y - h - 1.6, GOLD_D, 0.5);
}

/** A tall cylindrical drum: round walls, tall arched windows under a blind arcade. */
function drum(ctx: Ctx, x: number, y: number, r: number, h: number, wall: string) {
  poly(ctx, [x - r, y, x - r, y - h, x, y - h + r * 0.32, x, y + r * 0.32], shade(wall, 0.06));
  poly(ctx, [x + r, y, x + r, y - h, x, y - h + r * 0.32, x, y + r * 0.32], shade(wall, -0.2));
  ellipse(ctx, x, y - h, r, r * 0.32, shade(wall, 0.18));
  for (const d of [-0.7, -0.25, 0.2, 0.62]) { // tall slit windows with an arch moulding over each
    const wx = x + d * r, wy = y - h * 0.32 + Math.abs(d) * 0.2;
    poly(ctx, [wx - 0.35, wy, wx + 0.35, wy, wx + 0.35, wy - h * 0.4, wx, wy - h * 0.48, wx - 0.35, wy - h * 0.4], SKY_GLASS);
    curve(ctx, wx - 1, wy - h * 0.38, wx, wy - h * 0.6, wx + 1, wy - h * 0.38, 0.3, shade(wall, -0.3));
  }
  line(ctx, x - r, y - h * 0.86, x + r, y - h * 0.86, shade(wall, -0.25), 0.3); // the cornice
}

/** A gabled arm of a cross-in-square church: a box with a pitched stone roof running along it. */
function gabledArm(ctx: Ctx, x: number, y: number, w: number, h: number, rise: number, wall: string, roofC: string, seed: number) {
  stoneWall(ctx, x, y, w, h, wall, seed);
  const hw = w / 2, hh = w / 4;
  const L = [x - hw, y - h], F = [x, y + hh - h], R = [x + hw, y - h], Bk = [x, y - hh - h];
  const m1 = [(L[0] + F[0]) / 2, (L[1] + F[1]) / 2 - rise], m2 = [(Bk[0] + R[0]) / 2, (Bk[1] + R[1]) / 2 - rise];
  poly(ctx, [L[0], L[1], F[0], F[1], m1[0], m1[1]], shade(wall, 0.04)); // the gable wall
  poly(ctx, [L[0], L[1], Bk[0], Bk[1], m2[0], m2[1], m1[0], m1[1]], shade(roofC, 0.12)); // the far slope
  poly(ctx, [F[0], F[1], R[0], R[1], m2[0], m2[1], m1[0], m1[1]], shade(roofC, -0.12)); // the near slope
  line(ctx, m1[0], m1[1], m2[0], m2[1], shade(roofC, 0.3), 0.6);
  // a carved cross-window in the gable, as on the Georgian churches
  const gx = (L[0] + F[0] + m1[0]) / 3, gy = (L[1] + F[1] + m1[1]) / 3 + 0.4;
  cross(ctx, gx, gy, 0.7, shade(wall, -0.4));
  return { m1, m2 };
}

/** A cross-in-square church: four gabled arms round a tall cylindrical drum under a conical roof. */
function church(ctx: Ctx, x: number, y: number, s: number, seed: number) {
  const wall = STONE, roofC = SLATE;
  gabledArm(ctx, x, y - 3 * s, 16 * s, 10 * s, 4 * s, wall, roofC, seed); // the long nave behind
  gabledArm(ctx, x + 2 * s, y + 1 * s, 9 * s, 8 * s, 3.4 * s, wall, roofC, seed + 1); // the near transept arm
  // ornament round the west door
  arch(ctx, 'R', x + 2 * s, y + 1 * s, 9 * s, 8 * s, 0.36, 0, 0.26, 0.5, '#4a3628');
  arch(ctx, 'L', x + 2 * s, y + 1 * s, 9 * s, 8 * s, 0.42, 0.42, 0.14, 0.26);
  // the drum and its cone
  const dy = y - 11.6 * s;
  box(ctx, x, dy + 1.4 * s, 8 * s, 2 * s, shade(wall, -0.06)); // its square base where the roofs meet
  drum(ctx, x, dy, 3.6 * s, 8 * s, wall);
  cone(ctx, x, dy - 8 * s, 3.7 * s, 5.6 * s, roofC);
}

/** The capital's fortress on a rocky hill: crenellated walls climbing the ridge, round and square towers. */
function fortressHill(ctx: Ctx, x: number, y: number) {
  // the rock
  poly(ctx, [x - 22, y + 6, x - 16, y - 6, x - 8, y - 12, x + 2, y - 14, x + 10, y - 9, x + 18, y + 4, x + 6, y + 10, x - 10, y + 10], '#8a7a62');
  poly(ctx, [x - 16, y - 6, x - 8, y - 12, x + 2, y - 14, x - 2, y - 4, x - 12, y + 2], '#a8987a');
  poly(ctx, [x + 2, y - 14, x + 10, y - 9, x + 18, y + 4, x + 6, y + 2], '#6e6050');
  for (const [dx, dy] of [[-12, 4], [-4, 6], [8, 4], [-14, -2], [12, -2]] as const) ellipse(ctx, x + dx, y + dy, 2.2, 0.9, '#5e7a3a'); // scrub
  // the wall along the crest
  const wallPts: [number, number][] = [[-17, -5], [-8, -11], [2, -13], [10, -8], [16, 1]];
  for (let i = 0; i < wallPts.length - 1; i++) {
    const [ax, ay] = wallPts[i], [bx, by] = wallPts[i + 1];
    poly(ctx, [x + ax, y + ay, x + bx, y + by, x + bx, y + by - 4, x + ax, y + ay - 4], i < 2 ? STONE_D : shade(STONE_D, -0.15));
    for (let j = 0; j < 4; j++) { // merlons
      const t = (j + 0.25) / 4, mx = x + ax + (bx - ax) * t, my = y + ay + (by - ay) * t - 4;
      poly(ctx, [mx, my, mx + 1.2, my + (by - ay) / 4 * 0.3, mx + 1.2, my - 1.4, mx, my - 1.4], shade(STONE_D, 0.08));
    }
  }
  // towers along it
  for (const [dx, dy, tw, th, round] of [[-17, -4, 4, 9, true], [2, -12, 5, 11, false], [16, 2, 4, 8, true]] as const) {
    if (round) {
      drum(ctx, x + dx, y + dy, tw / 2, th, STONE_D);
      for (let j = 0; j < 4; j++) box(ctx, x + dx - tw / 2 + 0.6 + j * 1.1, y + dy - th + 0.4, 0.8, 1.2, shade(STONE_D, 0.1));
    } else {
      stoneWall(ctx, x + dx, y + dy, tw, th, STONE_D, 7);
      for (const u of [0.1, 0.55]) { faceQuad(ctx, 'R', x + dx, y + dy - th, tw, 1.4, u, u + 0.25, 0, 1, shade(STONE_D, 0.1)); faceQuad(ctx, 'L', x + dx, y + dy - th, tw, 1.4, u, u + 0.25, 0, 1, shade(STONE_D, 0.1)); }
      faceQuad(ctx, 'R', x + dx, y + dy, tw, th, 0.4, 0.6, 0.5, 0.7, '#2a2420');
      // the royal banner
      line(ctx, x + dx, y + dy - th - 1, x + dx, y + dy - th - 10, WOOD_D, 0.7);
      poly(ctx, [x + dx, y + dy - th - 10, x + dx + 7, y + dy - th - 9.2, x + dx + 5.2, y + dy - th - 7.6, x + dx + 7, y + dy - th - 5.6, x + dx, y + dy - th - 6.2], GE_RED);
      borjgali(ctx, x + dx + 2.6, y + dy - th - 7.9, 1.2, GOLD);
    }
  }
}

function building(ctx: Ctx, x: number, y: number, big: boolean, _roofC: string, capital: boolean) {
  const seed = Math.round(x * 7 + y * 13);
  if (big && capital) { // the fortress on the hill behind, a great domed cathedral before it
    fortressHill(ctx, x - 4, y - 8);
    church(ctx, x + 6, y + 6, 1.1, seed);
    return;
  }
  if (big) { // a cross-in-square church with a Svan tower beside it
    svanTower(ctx, x - 10, y + 2, 18, seed);
    church(ctx, x + 2, y + 4, 1, seed);
    return;
  }
  const spot: Record<string, number> = { '-10,2': 0, '10,2': 1, '0,8': 2, '-6,-8': 3, '7,-7': 1, '-14,-3': 0, '14,-2': 3 };
  const v = spot[`${Math.round(x)},${Math.round(y)}`] ?? (((Math.round(x) * 7 + Math.round(y) * 3) % 4) + 4) % 4;
  if (v === 0) tbilisiHouse(ctx, x, y, STONE, '#5a7a8a', seed); // a pale blue balcony
  else if (v === 1) { // a mountain village: a Svan tower over a low stone house
    stoneHut(ctx, x + 3, y + 2, 8, 5, seed);
    svanTower(ctx, x - 3, y - 1, 17, seed + 1);
  } else if (v === 2) { // a brick house with a carved wooden balcony on its side and a vine pergola before it
    tbilisiHouse(ctx, x, y - 1, BRICK, WOOD_L, seed);
    pergola(ctx, x - 7, y + 4, 0.5, '#4f8a32', true, seed);
  } else { // a stone farmhouse, a little hall chapel with its cone, and a wine jar by the door
    stoneHut(ctx, x - 3, y + 1, 9, 5.6, seed);
    stoneWall(ctx, x + 6, y - 2, 6, 6, STONE, seed + 2);
    drum(ctx, x + 6, y - 9.4, 1.8, 3.6, STONE);
    cone(ctx, x + 6, y - 13, 1.9, 3.8, SLATE);
    ellipse(ctx, x + 1.4, y + 4, 1.2, 1.6, '#c4733e');
    ellipse(ctx, x + 1.4, y + 2.5, 0.8, 0.3, '#8a4a26');
  }
}

// ---------------------------------------------------------------- trees

/** Vineyards on pergolas, broad walnut trees, Caucasian pines and dark Nordmann firs. */
function tree(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  const type = ['walnut', 'pine', 'vines', 'fir', 'walnut', 'pine', 'vines', 'fir'][variant % 8];
  if (type === 'vines') {
    pergola(ctx, x, y, 0.95 * k, mix(P.forest, '#6aa040', 0.55), variant % 2 === 0, variant + 3);
    return;
  }
  if (type === 'walnut') { // a pale grey trunk, spreading boughs and a broad, round, light-green crown
    line(ctx, x, y, x, y - 8 * k, '#8a8478', 2.6 * k);
    line(ctx, x - 0.6 * k, y, x - 0.6 * k, y - 8 * k, '#b0aa9c', 0.8 * k);
    curve(ctx, x, y - 7 * k, x - 3 * k, y - 9 * k, x - 6 * k, y - 12 * k, 1.2 * k, '#8a8478');
    curve(ctx, x, y - 7 * k, x + 3 * k, y - 9.6 * k, x + 5.6 * k, y - 13 * k, 1.2 * k, '#7a7468');
    const g = mix(P.forest, '#7aa848', 0.45);
    for (const [dx, dy, rx, ry, c] of [[-5, -13, 5, 4, -0.1], [5, -13.4, 5, 4, -0.18], [0, -17, 6, 4.6, 0], [-2.4, -20, 4, 3, 0.08], [3, -19.6, 3.6, 2.8, 0.04]] as const) {
      ellipse(ctx, x + dx * k, y + (dy + 1) * k, rx * k, ry * k, shade(g, c - 0.22));
      ellipse(ctx, x + dx * k, y + dy * k, rx * k, ry * k, shade(g, c));
    }
    for (let i = 0; i < 6; i++) { // a few green walnuts
      const px = x + (rand(variant, i) - 0.5) * 12 * k, py = y - (12 + rand(variant + 2, i) * 8) * k;
      ellipse(ctx, px, py, 0.7 * k, 0.7 * k, shade(g, 0.3));
    }
    return;
  }
  if (type === 'pine') { // a Caucasian pine: a tall bare trunk, orange near the top, flat clouds of needles
    curve(ctx, x, y, x + 1 * k, y - 12 * k, x - 0.4 * k, y - 24 * k, 2 * k, '#6a4a32');
    curve(ctx, x + 0.3 * k, y - 8 * k, x + 1.2 * k, y - 15 * k, x - 0.2 * k, y - 24 * k, 1 * k, '#c8743a');
    curve(ctx, x + 0.4 * k, y - 16 * k, x - 3 * k, y - 17 * k, x - 5 * k, y - 20 * k, 0.8 * k, '#8a5232');
    const g = shade(mix(P.forest, '#1f4a30', 0.35), 0);
    for (const [dx, dy, rx, ry, c] of [[-4.4, -20.4, 3.6, 1.8, -0.1], [3, -22.6, 4, 2, -0.16], [-0.6, -26.4, 4.4, 2.2, 0.04], [4.4, -17.6, 2.6, 1.4, -0.2]] as const) {
      ellipse(ctx, x + dx * k, y + (dy + 0.8) * k, rx * k, ry * k, shade(g, c - 0.2));
      ellipse(ctx, x + dx * k, y + dy * k, rx * k, ry * k, shade(g, c));
      ellipse(ctx, x + (dx - 1) * k, y + (dy - 0.6) * k, rx * 0.5 * k, ry * 0.4 * k, shade(g, c + 0.16));
    }
    return;
  }
  // a Nordmann fir: a dense, dark, narrow cone of tiers down to the ground
  line(ctx, x, y, x, y - 4 * k, '#4a3424', 1.8 * k);
  const g = shade(mix(P.forest, '#0e3424', 0.5), -0.04);
  for (let i = 0; i < 7; i++) {
    const by = y - (2 + i * 3.4) * k, hw = (7.4 - i * 0.98) * k, th = 5 * k;
    poly(ctx, [x, by - th, x - hw, by + 0.6 * k, x, by + 1.4 * k], shade(g, 0.12));
    poly(ctx, [x, by - th, x + hw, by + 0.6 * k, x, by + 1.4 * k], shade(g, -0.22));
    line(ctx, x - hw * 0.9, by + 0.5 * k, x - hw * 0.2, by - th * 0.5, shade(g, 0.3), 0.4 * k);
  }
  poly(ctx, [x - 0.8 * k, y - 24.6 * k, x, y - 28.6 * k, x + 0.8 * k, y - 24.6 * k], shade(g, -0.05));
}

registerArt('georgia', {
  unit,
  dress: (kind) => dress(kind),
  torso,
  face,
  head,
  weapon,
  shield: (ctx, kind, x, y, k) => { shieldFor(ctx, kind, x, y, k); return true; },
  building,
  tree,
});

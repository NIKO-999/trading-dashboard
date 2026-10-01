// The Gorkha Kingdom's own art (see render/tribeart): the hill state of Gorkha that unified Nepal under Prithvi Narayan
// Shah in the 1760s, and the Newar cities of the Kathmandu valley it took. Men wear the daura-suruwal: a long cream
// double-breasted tunic (daura) whose front flaps cross and are tied with strings, over narrow suruwal trousers; a
// dark waistcoat (istakot) over it and the patuka, a long cloth wound round the waist, with the kukri tucked in at the
// front. On the head the dhaka topi, a brimless cap of patterned dhaka cloth, higher on one side; the heavy ranks wear
// quilted coats and turban helmets of steel wound with cloth. Everyone carries the kukri, the curved inward-bent knife;
// the swordsmen the kora, the sacred forward-curved blade that flares into a broad tip marked with an eye; round hide
// shields (dhal) with four brass bosses; bows. The king wears the Shree Pech: a jewelled crown hung with emeralds and
// pearls under a great fountain of bird-of-paradise plumes. Hill ponies for the horsemen; a small bronze cannon for the
// siege; and, the kingdom being landlocked, river rafts, dugouts and a roofed river boat flying the double pennant.
// Towns of Newar red-brick houses with carved wooden windows under deep tiled eaves held on struts; multi-tiered
// pagoda temples on stepped plinths, gilt finials and banners; the capital a Durbar Square with a five-roofed pagoda
// and a royal palace front with its golden gate. Forests of red-flowering rhododendron and chir pine above terraces.
import type { BiomePalette } from '../../data/tribes';
import type { UnitKind } from '../../game/types';
import { registerArt, type Body } from '../tribeart';
import { band, box, ellipse, faceQuad, ink, line, mix, poly, rand, shade, softShadow } from '../prims';
import type { Ctx } from '../prims';
import { drawHorse, figure } from '../units';

// ---------------------------------------------------------------- colours

const CREAM = '#ece2c8'; // the daura-suruwal's cotton
const CREAM_D = '#c8bc9e';
const VEST = '#2c2a36'; // the istakot waistcoat
const CRIMSON = '#c82a5a'; // the kingdom's crimson
const CRIMSON_D = '#7a1434';
const MAROON = '#6e2032'; // quilted coats
const NAVY = '#24305a'; // the pennant's blue border
const GOLD = '#e8c048', GOLD_D = '#a8802a', GOLD_L = '#fbe48a';
const STEEL = '#c0c6cc', STEEL_D = '#7a828a', IRON = '#5a6068';
const HORN = '#3a2418'; // a kukri's horn grip
const BRASS = '#d0a040';
const HIDE = '#3a2416', HIDE_L = '#5a3a22'; // the dhal
const WOOD = '#7a5434', WOOD_D = '#4a3020', WOOD_L = '#a07448';
const BRICK = '#a8462c', BRICK_D = '#7a2e1c', BRICK_L = '#c45a3a';
const CARVE = '#3a2416', CARVE_L = '#5a3a24'; // the carved window timber
const TILE = '#6a3a24'; // the eaves' tiles
const STONE = '#a49c8e', STONE_D = '#7a7468';
const EMERALD = '#2a9a5a', RUBY = '#c82a3a', PEARL = '#f4f0e4';
const PLUME = '#e8d070'; // the bird-of-paradise plumes
const FLAGS = ['#2d6cdf', '#f4f1ea', '#d8302a', '#2aa84a', '#f2c81e'];
// dhaka cloth: small motifs of red, orange, green, white and black on cream or black
const DHAKA = ['#d8302a', '#f08a1e', '#2a8a4a', '#f4efe0', '#1a1418', '#2d6cdf'];

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
/** A filled shape in local coordinates: (x, y) the origin, `a` the rotation, `s` the scale. */
function local(ctx: Ctx, x: number, y: number, a: number, s: number, draw: (P: (u: number, v: number) => [number, number]) => void) {
  const c = Math.cos(a), sn = Math.sin(a);
  draw((u, v) => [x + (u * c - v * sn) * s, y + (u * sn + v * c) * s]);
}
const flat = (pts: [number, number][]) => pts.flatMap((p) => p);

/** A string of prayer flags from a to b, sagging, little squares of the five colours fluttering below the cord. */
function prayerFlags(ctx: Ctx, ax: number, ay: number, bx: number, by: number, sag: number, k: number, seed = 0) {
  curve(ctx, ax, ay, (ax + bx) / 2, (ay + by) / 2 + sag * 2, bx, by, 0.3 * k, '#e8dcc0');
  const n = Math.max(4, Math.round(Math.hypot(bx - ax, by - ay) / (2.4 * k)));
  for (let i = 1; i < n; i++) {
    const t = i / n, px = ax + (bx - ax) * t, py = ay + (by - ay) * t + sag * 4 * t * (1 - t);
    const c = FLAGS[i % 5], fl = (rand(seed, i) - 0.5) * 0.7 * k, w = 1.7 * k, h = 2 * k;
    poly(ctx, [px - w / 2, py, px + w / 2, py + 0.1 * k, px + w / 2 + fl, py + h, px - w / 2 + fl, py + h - 0.2 * k], c);
  }
}

/** The flag of Nepal: two stacked crimson pennants edged in blue, a white moon in the upper and a sun in the lower. */
function nepalFlag(ctx: Ctx, x: number, y: number, s: number) {
  const pts = [x, y, x + 6 * s, y + 4 * s, x + 2.2 * s, y + 4 * s, x + 6.4 * s, y + 9 * s, x, y + 9 * s];
  poly(ctx, pts, NAVY);
  poly(ctx, [x + 0.5 * s, y + 0.9 * s, x + 4.6 * s, y + 3.6 * s, x + 1.2 * s, y + 3.6 * s, x + 5.2 * s, y + 8.5 * s, x + 0.5 * s, y + 8.5 * s], CRIMSON);
  ellipse(ctx, x + 1.9 * s, y + 2.6 * s, 0.8 * s, 0.5 * s, '#f4f1ea'); // the moon
  ellipse(ctx, x + 1.9 * s, y + 2.3 * s, 0.7 * s, 0.35 * s, CRIMSON);
  ellipse(ctx, x + 2.1 * s, y + 6.6 * s, 0.9 * s, 0.9 * s, '#f4f1ea'); // the sun
}

// ---------------------------------------------------------------- dress

/** [torso, legs, sleeves]: cream daura-suruwal for most; quilted coats for the heavy ranks; brocade for the king. */
function dress(kind: UnitKind): [string, string, string] {
  switch (kind) {
    case 'defender': return [MAROON, CREAM, MAROON];
    case 'swordsman': return [CRIMSON_D, CREAM, CRIMSON_D];
    case 'knight': return [MAROON, CREAM_D, MAROON];
    case 'giant': return ['#f2e6c4', CREAM, '#f2e6c4'];
    default: return [CREAM, CREAM, CREAM];
  }
}

/**
 * The skirt of a long coat, from the waist to the knee over the trousers: plain cloth flaring a little, a hem, and the
 * crossing edge of the double-breasted front. `len` in figure units.
 */
function skirt(ctx: Ctx, x: number, hip: number, k: number, len: number, cloth: string, hem: string, quilted = false) {
  const w = 11 * k, cy = hip + len * k, h = (len + 0.1) * k;
  faceQuad(ctx, 'L', x, cy, w, h, 0, 1, 0, 1, cloth);
  faceQuad(ctx, 'R', x, cy, w, h, 0, 1, 0, 1, cloth);
  band(ctx, x, cy, w, h, 0, 0.12, hem);
  for (const u of [0.25, 0.7]) faceQuad(ctx, 'L', x, cy, w, h, u, u + 0.03, 0.12, 1, shade(cloth, -0.12)); // folds
  fpoly(ctx, 'R', x, cy, w, h, [[0.36, 1], [0.42, 1], [0.48, 0], [0.42, 0]], shade(cloth, -0.22)); // the overlap of the front
  if (quilted) for (const f of ['L', 'R'] as const) for (const v of [0.4, 0.7]) faceQuad(ctx, f, x, cy, w, h, 0, 1, v, v + 0.04, shade(cloth, -0.2));
}

/** The daura's crossing front: the flap's edge running down from the right shoulder, tied with two pairs of strings. */
function dauraFront(ctx: Ctx, x: number, y: number, w: number, h: number, k: number, cloth: string) {
  fpoly(ctx, 'R', x, y, w, h, [[0.12, 1], [0.24, 1], [0.86, 0.28], [0.86, 0.18]], shade(cloth, -0.16));
  for (const [u, v] of [[0.42, 0.72], [0.7, 0.42]] as const) {
    const [px, py] = fpt('R', x, y, w, h, u, v);
    line(ctx, px, py, px + 1.2 * k, py + 1.6 * k, shade(cloth, -0.4), 0.35 * k);
    line(ctx, px, py, px + 0.3 * k, py + 2 * k, shade(cloth, -0.4), 0.35 * k);
    ellipse(ctx, px, py, 0.35 * k, 0.3 * k, shade(cloth, -0.45));
  }
}

/** The istakot: a dark waistcoat open down the front, a row of little brass buttons. */
function waistcoat(ctx: Ctx, x: number, y: number, w: number, h: number, k: number, c = VEST) {
  fpoly(ctx, 'L', x, y, w, h, [[0, 0.12], [1, 0.12], [1, 1], [0, 1]], c);
  fpoly(ctx, 'R', x, y, w, h, [[0, 0.12], [0.18, 0.12], [0.1, 1], [0, 1]], c);
  fpoly(ctx, 'R', x, y, w, h, [[0.56, 0.12], [1, 0.12], [1, 1], [0.84, 1], [0.66, 0.6]], c);
  for (const v of [0.3, 0.5, 0.7]) { const [px, py] = fpt('R', x, y, w, h, 0.6 + (v - 0.3) * 0.2, v); ellipse(ctx, px, py, 0.3 * k, 0.3 * k, BRASS); }
}

/** The patuka: a long cloth wound round the waist in folds, its end hanging; a kukri in its black scabbard tucked in
 *  at the front, the horn grip slanting up. */
function patuka(ctx: Ctx, x: number, y: number, w: number, h: number, k: number, c: string, kukriIn = true) {
  band(ctx, x, y, w, h, 0, 0.2, c);
  band(ctx, x, y, w, h, 0.07, 0.09, shade(c, -0.22));
  band(ctx, x, y, w, h, 0.14, 0.16, shade(c, 0.2));
  const [ex, ey] = fpt('L', x, y, w, h, 0.72, 0.06);
  poly(ctx, [ex - 0.8 * k, ey, ex + 0.8 * k, ey + 0.2 * k, ex + 0.6 * k, ey + 3 * k, ex - 0.6 * k, ey + 2.8 * k], shade(c, -0.08)); // the hanging end
  for (let i = 0; i < 3; i++) line(ctx, ex - 0.5 * k + i * 0.5 * k, ey + 2.9 * k, ex - 0.5 * k + i * 0.5 * k, ey + 3.6 * k, c, 0.3 * k);
  if (!kukriIn) return;
  // the scabbard (dap), black leather, curving down across the belly with a brass chape; the grip up out of the sash
  const [ax, ay] = fpt('R', x, y, w, h, 0.2, 0.2), [bx, by] = fpt('R', x, y, w, h, 0.96, -0.05);
  curve(ctx, ax, ay, (ax + bx) / 2, (ay + by) / 2 - 2.2 * k, bx, by + 0.6 * k, 1.5 * k, '#1a1214');
  curve(ctx, ax, ay - 0.4 * k, (ax + bx) / 2, (ay + by) / 2 - 2.6 * k, bx, by + 0.2 * k, 0.35 * k, '#4a3a3a');
  poly(ctx, [bx - 0.6 * k, by - 0.2 * k, bx + 1 * k, by + 0.4 * k, bx + 0.4 * k, by + 1.6 * k], BRASS);
  line(ctx, ax, ay, ax - 2.2 * k, ay - 2.4 * k, HORN, 1.4 * k);
  ellipse(ctx, ax - 2.4 * k, ay - 2.6 * k, 0.8 * k, 0.6 * k, BRASS);
  line(ctx, ax - 0.4 * k, ay - 0.3 * k, ax + 0.3 * k, ay + 0.4 * k, BRASS, 0.6 * k);
}

/** Diamond quilting over a padded coat. */
function quilting(ctx: Ctx, x: number, y: number, w: number, h: number, k: number, c: string) {
  for (const f of ['L', 'R'] as const) {
    for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) {
      const u = (i + 0.5) / 3, v = 0.24 + j * 0.2, du = 0.16, dv = 0.1;
      const p = [fpt(f, x, y, w, h, u - du, v), fpt(f, x, y, w, h, u, v + dv), fpt(f, x, y, w, h, u + du, v), fpt(f, x, y, w, h, u, v - dv)];
      ctx.strokeStyle = ink(shade(c, f === 'L' ? -0.15 : -0.35));
      ctx.lineWidth = 0.3 * k;
      ctx.beginPath();
      ctx.moveTo(p[0][0], p[0][1]);
      for (const q of p.slice(1)) ctx.lineTo(q[0], q[1]);
      ctx.closePath();
      ctx.stroke();
    }
  }
}

function torso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const k = w / 10;
  const B = (v0: number, v1: number, c: string) => band(ctx, x, y, w, h, v0, v1, c);
  switch (kind) {
    case 'gurkha': // the daura-suruwal, a dark waistcoat, a crimson patuka with the kukri's scabbard in it
      skirt(ctx, x, y, k, 3.2, CREAM, CREAM_D);
      dauraFront(ctx, x, y, w, h, k, CREAM);
      waistcoat(ctx, x, y, w, h, k);
      patuka(ctx, x, y, w, h, k, CRIMSON, false);
      return;
    case 'warrior':
      skirt(ctx, x, y, k, 3, CREAM, CREAM_D);
      dauraFront(ctx, x, y, w, h, k, CREAM);
      patuka(ctx, x, y, w, h, k, CRIMSON);
      return;
    case 'archer': // daura and a white patuka, a strap of the quiver across
      skirt(ctx, x, y, k, 3, CREAM, CREAM_D);
      dauraFront(ctx, x, y, w, h, k, CREAM);
      waistcoat(ctx, x, y, w, h, k, '#4a3a2a');
      patuka(ctx, x, y, w, h, k, '#f4efe0');
      return;
    case 'defender': // a quilted coat to the knee with a high collar, a white patuka
      skirt(ctx, x, y, k, 3.6, MAROON, CRIMSON_D, true);
      quilting(ctx, x, y, w, h, k, MAROON);
      dauraFront(ctx, x, y, w, h, k, MAROON);
      B(0.88, 1, shade(MAROON, -0.2));
      patuka(ctx, x, y, w, h, k, '#f4efe0');
      return;
    case 'swordsman': // a quilted crimson coat, a dark waistcoat over it, a gold-edged patuka
      skirt(ctx, x, y, k, 3.4, CRIMSON_D, GOLD_D, true);
      quilting(ctx, x, y, w, h, k, CRIMSON_D);
      waistcoat(ctx, x, y, w, h, k);
      patuka(ctx, x, y, w, h, k, CREAM);
      B(0.19, 0.21, GOLD);
      return;
    case 'knight':
      skirt(ctx, x, y, k, 2.4, MAROON, GOLD_D, true);
      quilting(ctx, x, y, w, h, k, MAROON);
      patuka(ctx, x, y, w, h, k, CRIMSON);
      return;
    case 'giant': { // the king: a long brocade daura, a jewelled sash, ropes of pearls and an emerald pendant
      skirt(ctx, x, y, k, 4.6, '#f2e6c4', GOLD);
      for (const f of ['L', 'R'] as const) for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) { // brocade sprigs
        const [px, py] = fpt(f, x, y, w, h, (i + 0.5) / 4, 0.3 + j * 0.24);
        ellipse(ctx, px, py, 0.4 * k, 0.3 * k, f === 'L' ? GOLD : GOLD_D);
      }
      dauraFront(ctx, x, y, w, h, k, '#f2e6c4');
      patuka(ctx, x, y, w, h, k, CRIMSON, false);
      B(0.19, 0.22, GOLD);
      for (let r = 0; r < 2; r++) for (let i = 0; i <= 8; i++) { // ropes of pearls hanging across the chest
        const u = 0.05 + i * 0.11, [px, py] = fpt('R', x, y, w, h, u, 0.95 - r * 0.18 - Math.sin((i / 8) * Math.PI) * 0.22);
        ellipse(ctx, px, py, 0.32 * k, 0.32 * k, PEARL);
      }
      const [px, py] = fpt('R', x, y, w, h, 0.5, 0.44);
      ellipse(ctx, px, py, 1 * k, 1.2 * k, GOLD);
      ellipse(ctx, px, py, 0.6 * k, 0.8 * k, EMERALD);
      return;
    }
    case 'rider':
      dauraFront(ctx, x, y, w, h, k, CREAM);
      waistcoat(ctx, x, y, w, h, k);
      patuka(ctx, x, y, w, h, k, CRIMSON, false);
      return;
    case 'explorer': // a daura, a plain sash, and a shawl over one shoulder
      skirt(ctx, x, y, k, 3, CREAM, CREAM_D);
      dauraFront(ctx, x, y, w, h, k, CREAM);
      patuka(ctx, x, y, w, h, k, '#8a6a4a');
      fpoly(ctx, 'R', x, y, w, h, [[0, 1], [0.3, 1], [1, 0.3], [1, 0.1], [0.8, 0.1]], '#8a3a2a');
      return;
    default:
      skirt(ctx, x, y, k, 3, CREAM, CREAM_D);
      dauraFront(ctx, x, y, w, h, k, CREAM);
      patuka(ctx, x, y, w, h, k, CRIMSON);
  }
}

/** Faces: a red tika on the brow for all; moustaches for the soldiers, a fuller one for the king. */
function face(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  if (kind !== 'explorer' && kind !== 'archer') R(0.3, 0.7, 0.26, 0.31, '#1a1010'); // the moustache
  if (kind === 'giant') { R(0.26, 0.36, 0.2, 0.28, '#1a1010'); R(0.64, 0.74, 0.2, 0.28, '#1a1010'); }
  R(0.38, 0.62, 0.16, 0.2, '#6a3a24'); // the mouth
  R(0.46, 0.56, 0.7, 0.84, '#d8202a'); // the tika
  R(0.48, 0.54, 0.73, 0.8, '#f05a3a');
}

// ---------------------------------------------------------------- headgear

/**
 * The dhaka topi: a brimless cap of woven dhaka cloth, its crown slanting so the back stands higher than the front,
 * worked all over in rows of small coloured motifs. `base` the cloth's ground; `plain` for the black bhadgaunle topi.
 */
function topi(ctx: Ctx, x: number, top: number, k: number, hw: number, tall = 4.4, base = '#f0e6d0', plain = false) {
  const r = hw * 0.5 + 0.15 * k, bot = top + 2.2 * k, ry = r * 0.4;
  const hL = (tall + 1.3) * k, hR = (tall - 1.3) * k; // higher at the back (left), lower at the front
  const tilt = Math.atan2(hL - hR, 2 * r) * 0.9, tc = bot - (hL + hR) / 2, tr = ry * 0.75;
  const outline = () => {
    ctx.beginPath();
    ctx.moveTo(x - r, bot - hL);
    ctx.lineTo(x - r, bot);
    ctx.ellipse(x, bot, r, ry, 0, Math.PI, 0, true);
    ctx.lineTo(x + r, bot - hR);
    ctx.ellipse(x, tc, r, tr, tilt, 0, Math.PI, false);
    ctx.closePath();
  };
  outline();
  ctx.fillStyle = ink(base);
  ctx.fill();
  if (!plain) { // the dhaka pattern: staggered rows of little lozenges and chevrons in many colours
    ctx.save();
    outline();
    ctx.clip();
    const rows = 6;
    for (let j = 0; j < rows; j++) for (let i = 0; i < 8; i++) {
      const a = Math.PI * (0.04 + i * 0.13 + (j % 2) * 0.065), cu = -Math.cos(a), px = x + cu * r * 0.96;
      const hh = hR + (hL - hR) * (0.5 - cu * 0.5) - 0.6 * k;
      const py = bot - 0.8 * k - (j + 0.3) * (hh / rows) + Math.sin(a) * ry * 0.9;
      const c = DHAKA[(i * 3 + j * 2) % DHAKA.length], s = 0.62 * k;
      if ((i + j) % 2) { poly(ctx, [px - s, py, px, py - s, px + s, py, px, py + s], c); ellipse(ctx, px, py, s * 0.3, s * 0.3, DHAKA[(i + j + 3) % DHAKA.length]); }
      else poly(ctx, [px - s, py + s * 0.5, px, py - s * 0.7, px + s, py + s * 0.5, px + s * 0.5, py + s * 0.5, px, py - s * 0.1, px - s * 0.5, py + s * 0.5], c);
    }
    ctx.restore();
  }
  // the shaded right side
  ctx.save();
  outline();
  ctx.clip();
  ctx.fillStyle = 'rgba(0,0,0,0.24)';
  ctx.fillRect(x + r * 0.32, bot - hL - 3 * k, r, hL + ry + 4 * k);
  ctx.restore();
  // the slanting crown, a little paler
  ctx.beginPath();
  ctx.ellipse(x, tc, r, tr, tilt, 0, Math.PI * 2);
  ctx.fillStyle = ink(shade(base, plain ? 0.14 : 0.08));
  ctx.fill();
  if (!plain) for (let i = 0; i < 5; i++) { const a = i * 1.26 + 0.4; ellipse(ctx, x + Math.cos(a) * r * 0.5, tc + Math.sin(a) * tr * 0.5 - Math.cos(a) * r * 0.5 * Math.tan(tilt), 0.4 * k, 0.3 * k, DHAKA[(i * 2) % DHAKA.length]); }
  ctx.strokeStyle = ink(shade(base, plain ? 0.25 : -0.25));
  ctx.lineWidth = 0.35 * k;
  ctx.beginPath();
  ctx.ellipse(x, tc, r, tr, tilt, 0, Math.PI * 2);
  ctx.stroke();
  // the folded edge round the brow
  ctx.strokeStyle = ink(shade(base, plain ? 0.18 : -0.3));
  ctx.lineWidth = 0.6 * k;
  ctx.beginPath();
  ctx.ellipse(x, bot - 0.5 * k, r, ry, 0, 0, Math.PI);
  ctx.stroke();
}

/** A turban helmet: a steel cap with a spike and a little crest, wound round the brow with folds of cloth. */
function turbanHelm(ctx: Ctx, x: number, top: number, k: number, hw: number, cloth: string, plume: string | null = null) {
  const r = hw * 0.52, bot = top + 2.8 * k;
  // the steel cap rising from the turban
  ctx.beginPath();
  ctx.moveTo(x - r * 0.8, bot - 2.6 * k);
  ctx.quadraticCurveTo(x - r * 0.8, bot - 7.6 * k, x, bot - 8.2 * k);
  ctx.quadraticCurveTo(x + r * 0.8, bot - 7.6 * k, x + r * 0.8, bot - 2.6 * k);
  ctx.closePath();
  ctx.fillStyle = ink(STEEL);
  ctx.fill();
  poly(ctx, [x + 0.3 * k, bot - 8.1 * k, x + r * 0.8, bot - 2.6 * k, x + 0.3 * k, bot - 2.6 * k], STEEL_D);
  line(ctx, x - r * 0.4, bot - 6.4 * k, x - r * 0.2, bot - 7.6 * k, '#f4f8fb', 0.5 * k);
  line(ctx, x, bot - 8 * k, x, bot - 11 * k, STEEL_D, 0.8 * k); // the spike
  ellipse(ctx, x, bot - 8.4 * k, 0.9 * k, 0.5 * k, BRASS);
  if (plume) { curve(ctx, x, bot - 10.6 * k, x - 2 * k, bot - 14 * k, x - 4.6 * k, bot - 13 * k, 1.1 * k, plume); curve(ctx, x, bot - 10.6 * k, x - 1 * k, bot - 13 * k, x - 3.6 * k, bot - 14.6 * k, 0.6 * k, shade(plume, 0.3)); }
  // the cloth wound round: three bulging folds, crossing at the front
  for (let i = 0; i < 3; i++) {
    const yy = bot - 0.6 * k - i * 1.2 * k, rr = r * (1.04 - i * 0.05);
    ellipse(ctx, x, yy, rr, rr * 0.42, i % 2 ? shade(cloth, -0.12) : cloth);
    ctx.strokeStyle = ink(shade(cloth, -0.32));
    ctx.lineWidth = 0.3 * k;
    ctx.beginPath();
    ctx.ellipse(x, yy, rr, rr * 0.42, 0, 0.1, Math.PI - 0.1);
    ctx.stroke();
  }
  curve(ctx, x - r * 0.3, bot - 0.2 * k, x + r * 0.3, bot - 1.6 * k, x + r * 0.6, bot - 3 * k, 0.5 * k, shade(cloth, -0.35)); // the cross-fold
  ellipse(ctx, x + r * 0.3, bot - 2 * k, 0.8 * k, 0.7 * k, GOLD); // a jewel
  ellipse(ctx, x + r * 0.3, bot - 2 * k, 0.4 * k, 0.35 * k, RUBY);
}

/**
 * The Shree Pech, the jewelled crown of the Shah kings: a gold cap set with emeralds and rubies, a fringe of emerald
 * and pearl drops over the brow, and on top a great fountain of bird-of-paradise plumes curling back and down.
 */
function shreePech(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const r = hw * 0.56, bot = top + 2.8 * k;
  // the plumes behind first: a dense spray rising from the crest and cascading back (left) and down to the shoulders
  const ox = x + 0.6 * k, oy = bot - 7.4 * k;
  for (let i = 0; i < 13; i++) {
    const t = i / 12, rise = (9 + rand(5, i) * 3) * k * (1 - t * 0.35);
    const ex = ox - (6 + t * 9) * k, ey = oy + (-4 + t * 13) * k;
    const cx = ox - (1 + t * 3) * k, cy = oy - rise - 4 * k;
    const c = [PLUME, '#d8b850', '#f4ecc8', '#c8a040'][i % 4];
    curve(ctx, ox, oy, cx, cy, ex, ey, 1.9 * k, shade(c, -0.3));
    curve(ctx, ox, oy, cx, cy, ex, ey, 1.1 * k, c);
    for (let j = 3; j < 12; j++) { // the fine filaments hanging from each plume
      const [px, py] = qpt(ox, oy, cx, cy, ex, ey, j / 12);
      line(ctx, px, py, px - 0.5 * k, py + (1.2 + j * 0.12) * k, j % 2 ? shade(c, 0.15) : shade(c, -0.12), 0.3 * k);
    }
  }
  // the cap: a gold dome with bands of jewels
  ctx.beginPath();
  ctx.moveTo(x - r, bot - 1 * k);
  ctx.quadraticCurveTo(x - r * 1.04, bot - 7.4 * k, x, bot - 7.8 * k);
  ctx.quadraticCurveTo(x + r * 1.04, bot - 7.4 * k, x + r, bot - 1 * k);
  ctx.closePath();
  ctx.fillStyle = ink(GOLD);
  ctx.fill();
  poly(ctx, [x + 0.6 * k, bot - 7.6 * k, x + r * 0.7, bot - 6 * k, x + r, bot - 1 * k, x + 0.6 * k, bot - 1 * k], GOLD_D);
  for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) {
    const a = Math.PI * (0.12 + i * 0.15), rr = r * (0.94 - row * 0.2), px = x - Math.cos(a) * rr, py = bot - 1.8 * k - row * 2 * k + Math.sin(a) * rr * 0.32;
    ellipse(ctx, px, py, 0.5 * k, 0.45 * k, (i + row) % 2 ? EMERALD : row === 1 ? RUBY : PEARL);
  }
  // the great jewel at the front with its gold mount, and the crest from which the plumes spring
  ellipse(ctx, x + r * 0.2, bot - 3.4 * k, 1.3 * k, 1.5 * k, GOLD_L);
  ellipse(ctx, x + r * 0.2, bot - 3.4 * k, 0.9 * k, 1.1 * k, EMERALD);
  ellipse(ctx, x + r * 0.1, bot - 3.8 * k, 0.3 * k, 0.3 * k, '#c8f4dc');
  poly(ctx, [ox - 1.2 * k, oy + 0.6 * k, ox + 1.2 * k, oy + 0.6 * k, ox, oy - 2.4 * k], GOLD_L);
  ellipse(ctx, ox, oy - 0.2 * k, 0.6 * k, 0.6 * k, RUBY);
  // the band and the fringe of drops over the brow
  ctx.strokeStyle = ink(GOLD_D);
  ctx.lineWidth = 0.9 * k;
  ctx.beginPath();
  ctx.ellipse(x, bot - 1 * k, r, r * 0.36, 0, 0, Math.PI);
  ctx.stroke();
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (0.08 + i * 0.105), px = x + Math.cos(a) * r, py = bot - 1 * k + Math.sin(a) * r * 0.36;
    line(ctx, px, py, px, py + 1.6 * k, GOLD_D, 0.25 * k);
    ellipse(ctx, px, py + 1.8 * k, 0.35 * k, 0.45 * k, i % 2 ? PEARL : EMERALD);
  }
}

function head(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  switch (kind) {
    case 'gurkha': topi(ctx, x, top, k, hw, 4.6); break;
    case 'warrior': topi(ctx, x, top, k, hw, 4.2, '#1e1a22'); break; // a dhaka topi on a black ground
    case 'archer': topi(ctx, x, top, k, hw, 3.8, '#1a1a1e', true); break; // the plain black bhadgaunle topi
    case 'defender': turbanHelm(ctx, x, top, k, hw, '#f4efe0'); break;
    case 'swordsman': turbanHelm(ctx, x, top, k, hw, CRIMSON, null); break;
    case 'knight': turbanHelm(ctx, x, top, k, hw, CRIMSON, '#f4efe0'); break;
    case 'giant': shreePech(ctx, x, top, k, hw); break;
    case 'rider': topi(ctx, x, top, k, hw, 4.2); break;
    case 'explorer': topi(ctx, x, top, k, hw, 4, '#e8dcc0'); break;
    default: topi(ctx, x, top, k, hw, 4.2);
  }
}

// ---------------------------------------------------------------- weapons and shields

/**
 * The kukri: a short heavy blade bent forward at its middle, the edge on the inside of the bend, widest at the belly
 * near the tip; the little notch (cho) by the grip; a horn grip with brass bolster and butt cap. (x, y) is the grip's
 * front end; the blade runs along angle `a` with its edge on the clockwise side; `s` the scale (about 13 px long at 1).
 */
export function kukri(ctx: Ctx, x: number, y: number, a: number, s: number, gilt = false) {
  local(ctx, x, y, a, s, (P) => {
    // the grip, behind the hand: horn, swelling in the middle, two brass rings, a flared brass butt cap
    poly(ctx, flat([P(-4.4, -1), P(-2.2, -1.2), P(0, -0.8), P(0, 0.8), P(-2.2, 1.2), P(-4.4, 1.1)]), gilt ? GOLD_D : HORN);
    poly(ctx, flat([P(-4.4, -1), P(-2.2, -1.2), P(0, -0.8), P(0, -0.3), P(-4.4, -0.4)]), gilt ? GOLD : '#5a3a28');
    for (const u of [-1.2, -3]) poly(ctx, flat([P(u - 0.25, -1.15), P(u + 0.25, -1.15), P(u + 0.25, 1.15), P(u - 0.25, 1.15)]), BRASS);
    poly(ctx, flat([P(-4.4, -1.5), P(-4.1, -1.3), P(-4.1, 1.4), P(-4.4, 1.7), P(-5.1, 0.1)]), BRASS); // the butt cap
    poly(ctx, flat([P(-0.2, -1.2), P(0.6, -1.1), P(0.6, 1.1), P(-0.2, 1.2)]), GOLD_D); // the bolster
    // the blade: the spine rises a little, then bends down hard; the edge sweeps out into the deep belly
    const spine = [P(0.6, -0.9), P(3.4, -1.6), P(5.6, -1.8), P(7.6, -1.2), P(9.4, 0.6), P(10.8, 2.9), P(11.8, 5.4)];
    const edge = [P(11.8, 5.4), P(11.2, 6.8), P(9.8, 7.4), P(8, 6.8), P(6.4, 5.2), P(4.8, 3.3), P(3.4, 1.9), P(2.4, 1.4), P(2.1, 2.1), P(1.6, 1.3), P(0.6, 0.9)];
    poly(ctx, flat([...spine, ...edge]), gilt ? GOLD_L : STEEL);
    // the sharpened bevel along the edge, in shadow, and the bright cutting edge itself
    poly(ctx, flat([P(2.6, 1), P(4.4, 1.9), P(6.2, 3.4), P(7.8, 4.8), P(9.6, 5.6), P(11.2, 5.4), P(11.8, 5.4), P(11.2, 6.8), P(9.8, 7.4), P(8, 6.8), P(6.4, 5.2), P(4.8, 3.3), P(3.4, 1.9)]), gilt ? GOLD : STEEL_D);
    const stroke = (pts: [number, number][], c: string, w: number) => {
      ctx.strokeStyle = ink(c);
      ctx.lineWidth = w;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (const q of pts.slice(1)) ctx.lineTo(q[0], q[1]);
      ctx.stroke();
    };
    stroke(spine, gilt ? GOLD_D : IRON, 0.45 * s); // the thick spine
    stroke(edge.slice(1, 7), '#f4f8fb', 0.35 * s);
    stroke([P(1.4, -0.3), P(4, -0.7), P(6.4, -0.6)], '#ffffff', 0.4 * s); // a glint along the flat
    stroke([P(3, 0.2), P(6, 0.6), P(8.6, 2.2)], gilt ? GOLD_D : '#9aa2aa', 0.25 * s); // the fuller
  });
}

/**
 * The kora: the sacred sword of the Gorkha temples, a single-edged blade curving forward and widening steadily into a
 * broad tip cut in a concave curve between two points, an eye engraved near the end; a waisted hilt with disc guard
 * and pommel. The blade's edge is on the clockwise side of angle `a`.
 */
function kora(ctx: Ctx, x: number, y: number, a: number, s: number, gilt = false) {
  const metal = gilt ? GOLD_L : STEEL, dark = gilt ? GOLD : STEEL_D;
  local(ctx, x, y, a, s, (P) => {
    // the hilt: grip, disc guard and disc pommel
    poly(ctx, flat([P(-3.4, -0.6), P(-1.7, -0.9), P(0, -0.6), P(0, 0.6), P(-1.7, 0.9), P(-3.4, 0.6)]), gilt ? GOLD_D : WOOD_D);
    for (const u of [-3.7, 0.2]) { const [cx, cy] = P(u, 0); ellipse(ctx, cx, cy, 1.2 * s, 1.2 * s, BRASS); ellipse(ctx, cx, cy, 0.5 * s, 0.5 * s, GOLD_D); }
    // the blade: a centre line bending toward the edge, its width growing toward the tip
    const n = 10, L = 13, back: [number, number][] = [], front: [number, number][] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 0.8 + t * L, c = 4.2 * t * t, w = 0.8 + 3.2 * Math.pow(t, 1.25);
      back.push([u - c * 0.25, c - w]);
      front.push([u + c * 0.1, c + w * 0.8]);
    }
    // the tip: the back point juts forward, the cut curves in, the front point hooks down
    const [bu, bv] = back[n], [fu, fv] = front[n];
    const tip: [number, number][] = [[bu + 1.4, bv - 0.6], [bu + 0.2, (bv + fv) / 2 - 0.4], [fu + 1.6, fv + 0.8]];
    const outline = [...back, ...tip, ...front.slice().reverse()].map(([u, v]) => P(u, v));
    poly(ctx, flat(outline), metal);
    poly(ctx, flat([...front.map(([u, v]) => P(u, v - 0.9 * (u / L))), P(tip[2][0], tip[2][1]), ...front.slice().reverse().map(([u, v]) => P(u, v))]), dark); // the bevel
    ctx.strokeStyle = ink(gilt ? GOLD_D : IRON);
    ctx.lineWidth = 0.4 * s;
    ctx.beginPath();
    back.forEach(([u, v], i) => { const [px, py] = P(u, v); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
    ctx.stroke();
    // the eye near the tip
    const [ex, ey] = P(bu - 1.4, (bv + fv) / 2 - 0.6);
    ellipse(ctx, ex, ey, 1.3 * s, 0.75 * s, gilt ? GOLD_D : '#4a5058');
    ellipse(ctx, ex, ey, 0.75 * s, 0.6 * s, '#f4f8fb');
    ellipse(ctx, ex, ey, 0.35 * s, 0.35 * s, '#1a1418');
    line(ctx, ...P(1.4, -0.2), ...P(8.6, 0), '#ffffff', 0.3 * s);
  });
}

/** A round dhal of lacquered hide: domed, a rim, four brass bosses and a brass crescent; `rich` gilds it. */
function dhal(ctx: Ctx, cx: number, cy: number, r: number, k: number, rich = false) {
  const c = rich ? CRIMSON_D : HIDE;
  ellipse(ctx, cx + 0.6 * k, cy + 0.4 * k, r, r * 0.92, shade(c, -0.4)); // its thickness
  ellipse(ctx, cx, cy, r, r * 0.92, c);
  ellipse(ctx, cx - r * 0.2, cy - r * 0.22, r * 0.62, r * 0.55, shade(c, 0.12)); // the dome's light
  ellipse(ctx, cx - r * 0.34, cy - r * 0.38, r * 0.22, r * 0.16, shade(c, 0.3));
  ring(ctx, cx, cy, r * 0.94, r * 0.86, rich ? GOLD : HIDE_L, 0.6 * k);
  for (let i = 0; i < 4; i++) { // the bosses in a diamond
    const a = Math.PI * 0.25 + i * Math.PI * 0.5, px = cx + Math.cos(a) * r * 0.38, py = cy + Math.sin(a) * r * 0.36;
    ellipse(ctx, px, py, r * 0.14, r * 0.14, BRASS);
    ellipse(ctx, px - r * 0.04, py - r * 0.04, r * 0.06, r * 0.06, GOLD_L);
  }
  // a brass crescent moon below the centre
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.28, Math.PI * 0.1, Math.PI * 0.9);
  ctx.arc(cx, cy - r * 0.06, r * 0.2, Math.PI * 0.9, Math.PI * 0.1, true);
  ctx.fillStyle = ink(BRASS);
  ctx.fill();
  if (rich) ellipse(ctx, cx, cy, r * 0.12, r * 0.12, RUBY);
}

/** A spear (bhala): a bamboo shaft, a leaf-shaped head and a crimson tassel. */
function spear(ctx: Ctx, x: number, y: number, k: number, len = 28) {
  const x0 = x - 1.8 * k, y0 = y + 6 * k, x1 = x + 3 * k, y1 = y - (len - 6) * k;
  line(ctx, x0, y0, x1, y1, '#a88a50', 1.2 * k);
  for (let i = 1; i < 5; i++) { const t = i / 5; line(ctx, x0 + (x1 - x0) * t - 0.6 * k, y0 + (y1 - y0) * t, x0 + (x1 - x0) * t + 0.6 * k, y0 + (y1 - y0) * t - 0.2 * k, '#6a5a30', 0.4 * k); } // bamboo nodes
  poly(ctx, [x1 + 0.3 * k, y1 - 6.4 * k, x1 - 1.3 * k, y1 - 2.6 * k, x1 - 0.2 * k, y1 + 0.4 * k], shade(STEEL, 0.15));
  poly(ctx, [x1 + 0.3 * k, y1 - 6.4 * k, x1 + 1.3 * k, y1 - 2.2 * k, x1 - 0.2 * k, y1 + 0.4 * k], STEEL_D);
  for (let i = -1; i <= 1; i++) line(ctx, x1 - 0.1 * k, y1 + 0.8 * k, x1 + i * 0.8 * k - 0.4 * k, y1 + 3.6 * k, CRIMSON, 0.6 * k);
  ellipse(ctx, x1 - 0.1 * k, y1 + 0.8 * k, 0.8 * k, 0.6 * k, GOLD);
}

/** A bow of bamboo, bound at the grip, an arrow on the string. */
function bow(ctx: Ctx, x: number, y: number, k: number) {
  const gx = x + 1 * k, gy = y - 1 * k;
  const top = { x: gx - 2.4 * k, y: gy - 12 * k }, bot = { x: gx - 2.4 * k, y: gy + 10 * k };
  for (const [c, wd] of [[WOOD_D, 1.8], ['#b8944a', 1]] as const) {
    curve(ctx, gx, gy, gx + 3.2 * k, gy - 6 * k, top.x, top.y, wd * k, c);
    curve(ctx, gx, gy, gx + 3.2 * k, gy + 5 * k, bot.x, bot.y, wd * k, c);
  }
  for (const p of [top, bot]) curve(ctx, p.x, p.y, p.x - 1.2 * k, p.y + (p === top ? -0.4 : 0.4) * k, p.x - 1.6 * k, p.y + (p === top ? 1 : -1) * k, 0.8 * k, WOOD_D); // recurved tips
  const nock = { x: gx - 5.4 * k, y: gy - 0.4 * k };
  ctx.strokeStyle = ink('#efe6d0');
  ctx.lineWidth = 0.4 * k;
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(nock.x, nock.y);
  ctx.lineTo(bot.x, bot.y);
  ctx.stroke();
  line(ctx, gx + 0.2 * k, gy - 1.6 * k, gx + 0.2 * k, gy + 1.2 * k, CRIMSON, 1.6 * k);
  const tx = gx + 8 * k, ty = gy - 1.6 * k;
  line(ctx, nock.x, nock.y, tx, ty, '#c8a868', 0.7 * k);
  poly(ctx, [tx, ty - 0.9 * k, tx + 2.6 * k, ty + 0.1 * k, tx, ty + 0.9 * k], IRON);
  poly(ctx, [nock.x, nock.y, nock.x + 2.4 * k, nock.y - 1.3 * k, nock.x + 2.8 * k, nock.y - 0.2 * k], '#f4efe0');
}

/** A walking stick of rhododendron wood with a small cloth bundle tied at the top. */
function lathi(ctx: Ctx, x: number, y: number, k: number) {
  line(ctx, x - 1 * k, y + 7 * k, x + 2.2 * k, y - 15 * k, WOOD, 1.1 * k);
  ellipse(ctx, x + 2.4 * k, y - 15.4 * k, 0.9 * k, 0.8 * k, WOOD_D);
  ellipse(ctx, x + 3.6 * k, y - 11.6 * k, 2 * k, 1.8 * k, '#8a3a2a');
  line(ctx, x + 1.8 * k, y - 12.6 * k, x + 4.4 * k, y - 13 * k, '#5a2418', 0.5 * k);
}

function weapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  switch (kind) {
    case 'gurkha': // the kukri raised high, bright and big: the empire's emblem
      kukri(ctx, x + 0.4 * k, y - 0.6 * k, -1.2, 1.25 * k);
      return true;
    case 'warrior':
      kukri(ctx, x + 0.2 * k, y - 0.2 * k, -0.7, 1.05 * k);
      dhal(ctx, b.off.x - 1.4 * k, b.off.y - 3 * k, 4.2 * k, k);
      return true;
    case 'archer':
      bow(ctx, x, y, k);
      return true;
    case 'defender':
      spear(ctx, x, y, k, 30);
      return true;
    case 'swordsman':
      kora(ctx, x + 0.2 * k, y - 0.4 * k, -1.35, 1.05 * k);
      dhal(ctx, b.off.x - 1.4 * k, b.off.y - 3.2 * k, 4.4 * k, k);
      return true;
    case 'giant':
      kora(ctx, x + 0.2 * k, y - 0.4 * k, -1.3, 1.2 * k);
      dhal(ctx, b.off.x - 1.4 * k, b.off.y - 3.4 * k, 4.8 * k, k, true);
      return true;
    case 'explorer':
      lathi(ctx, x, y, k);
      return true;
  }
  return false;
}

function shield(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number): boolean {
  dhal(ctx, x - 1.4 * k, y - 4 * k, kind === 'defender' ? 6.4 * k : 4.6 * k, k, kind === 'giant');
  return true;
}

// ---------------------------------------------------------------- hill ponies

/**
 * A hill pony: small, stocky and shaggy, a thick mane over the brow, a crimson saddle cloth. The rider wears a topi and
 * carries a spear and a dhal; the knight is a nobleman in a quilted coat and plumed turban helmet, his kora raised,
 * his pony in a crimson caparison fringed with gold and hung with a bell.
 */
function horseman(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  const noble = kind === 'knight';
  const k = noble ? 0.95 : 0.9;
  const coat = noble ? '#5a3a2a' : '#a07a52', mane = '#2a1c14';
  const saddle = drawHorse(ctx, x - 1, y + 3, k, coat, mane, noble ? CRIMSON_D : undefined, CRIMSON);
  const sx = saddle.x, sy = saddle.y;
  // the shaggy forelock and a thick mane hanging over the neck
  const hx = x - 1 + 10.5 * k, hy = y + 3 - 15 * k;
  for (let i = 0; i < 6; i++) line(ctx, hx - 4.6 * k + i * 0.9 * k, hy + 2.6 * k - i * 0.6 * k, hx - 4.6 * k + i * 0.9 * k - 0.6 * k, hy + 5.4 * k - i * 0.5 * k, i % 2 ? mane : shade(mane, 0.2), 0.8 * k);
  line(ctx, hx + 0.4 * k, hy - 0.4 * k, hx + 1.4 * k, hy + 1.6 * k, mane, 1 * k);
  if (noble) { // the caparison's gold fringe and a bell on the breast strap
    for (let i = 0; i < 9; i++) line(ctx, sx - 7 * k + i * 1.8 * k, sy + 6.4 * k + (i % 2) * 0.2, sx - 7 * k + i * 1.8 * k, sy + 7.6 * k, GOLD, 0.5);
    line(ctx, x + 3, y - 8, x + 7.4, y - 3.6, CRIMSON, 1.1);
    ellipse(ctx, x + 6, y - 4.2, 1.1, 1.2, GOLD);
    ellipse(ctx, x + 6, y - 3.4, 0.4, 0.3, GOLD_D);
  } else { // a saddle cloth with a woven border
    poly(ctx, [sx - 4.4, sy - 0.6, sx + 3.4, sy - 0.8, sx + 3.2, sy + 4.4, sx - 4.2, sy + 4.8], CRIMSON);
    line(ctx, sx - 4.2, sy + 4.6, sx + 3.2, sy + 4.2, GOLD, 0.7);
    for (let i = 0; i < 4; i++) poly(ctx, [sx - 3.4 + i * 1.8, sy + 3.8, sx - 2.6 + i * 1.8, sy + 2.6, sx - 1.8 + i * 1.8, sy + 3.8], NAVY);
  }
  const b = figure(ctx, kind, 'nepal', sx, sy, 0.84, true);
  if (noble) {
    kora(ctx, b.hand.x, b.hand.y, -1.4, 0.95);
    dhal(ctx, b.off.x - 1.6, b.off.y + 0.6, 3.4, 0.7, true);
    return;
  }
  dhal(ctx, b.off.x - 1.4, b.off.y + 0.8, 3, 0.62);
  spear(ctx, b.hand.x, b.hand.y, 0.9, 28);
}

// ---------------------------------------------------------------- the cannon

/** A small bronze cannon on a two-wheeled wooden carriage, a crewman in a topi with a rammer, and a few iron balls. */
function cannon(ctx: Ctx, x: number, y: number) {
  softShadow(ctx, x, y + 2, 14, 4, 0.28);
  // the trail of the carriage on the ground, back to the left
  poly(ctx, [x - 12, y + 3, x - 10, y + 4, x + 3, y - 3.4, x + 1, y - 4.4], WOOD_D);
  poly(ctx, [x - 12, y + 3, x - 12, y + 1.6, x + 1, y - 5.8, x + 1, y - 4.4], WOOD);
  // the far wheel
  ellipse(ctx, x + 4, y - 5, 4.2, 4.6, WOOD_D);
  ellipse(ctx, x + 4, y - 5, 3.2, 3.6, shade(WOOD_D, -0.2));
  // the barrel: bronze, banded, the muzzle swelling, pointing up to the right
  local(ctx, x + 1.6, y - 6.4, -0.32, 1, (P) => {
    poly(ctx, flat([P(-6.4, -2.4), P(10, -1.7), P(10, 1.7), P(-6.4, 2.4)]), '#b8862e');
    poly(ctx, flat([P(-6.4, 0.6), P(10, 0.5), P(10, 1.7), P(-6.4, 2.4)]), '#8a5e1e');
    poly(ctx, flat([P(-6.4, -2.4), P(10, -1.7), P(10, -1), P(-6.4, -1.4)]), '#e8b85a');
    for (const u of [-4.4, 1, 6]) poly(ctx, flat([P(u, -2.4), P(u + 0.9, -2.3), P(u + 0.9, 2.3), P(u, 2.4)]), '#d8a040');
    poly(ctx, flat([P(9.4, -2.4), P(11.4, -2.5), P(11.4, 2.5), P(9.4, 2.4)]), '#c8963a'); // the muzzle ring
    const [mx, my] = P(11.4, 0);
    ellipse(ctx, mx, my, 0.9, 1.9, '#2a1a10');
    const [cx, cy] = P(-7.2, 0);
    ellipse(ctx, cx, cy, 1.6, 1.6, '#b8862e'); // the cascabel knob
    const [tx, ty] = P(-3, -2.4);
    ellipse(ctx, tx, ty, 0.6, 0.4, '#2a1a10'); // the touch hole
    const [lx, ly] = P(2, -2.6); // a dolphin handle shaped like a little naga
    curve(ctx, lx - 1.4, ly + 0.2, lx, ly - 1.8, lx + 1.4, ly + 0.2, 0.7, '#8a5e1e');
  });
  // the near cheek of the carriage and the near wheel: spokes and an iron tyre
  poly(ctx, [x - 4, y - 2.6, x + 5, y - 7.6, x + 6, y - 5.4, x - 3, y - 0.6], WOOD_L);
  const wx = x + 1, wy = y - 1;
  ellipse(ctx, wx, wy, 4.8, 5.2, IRON);
  ellipse(ctx, wx, wy, 4, 4.4, WOOD);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; line(ctx, wx, wy, wx + Math.cos(a) * 3.8, wy + Math.sin(a) * 4.2, WOOD_D, 0.7); }
  ellipse(ctx, wx, wy, 1.1, 1.2, BRASS);
  // a pile of iron shot
  for (const [dx, dy] of [[9, 4], [11.2, 4.4], [10, 2.6]] as const) { ellipse(ctx, x + dx, y + dy, 1.2, 1.1, '#3a3c40'); ellipse(ctx, x + dx - 0.3, y + dy - 0.4, 0.4, 0.3, '#8a8c90'); }
  // the gunner, a rammer in his hands, a crimson pennant on a pole
  const b = figure(ctx, 'warrior', 'nepal', x - 11, y + 5, 0.52);
  line(ctx, b.hand.x - 1, b.hand.y + 2, b.hand.x + 6, b.hand.y - 6, WOOD_L, 0.7);
  ellipse(ctx, b.hand.x + 6.2, b.hand.y - 6.2, 0.8, 0.8, '#5a4a3a');
  line(ctx, x - 13, y + 1.6, x - 13, y - 16, WOOD_D, 0.6);
  nepalFlag(ctx, x - 13, y - 16, 0.7);
}

// ---------------------------------------------------------------- river craft

/** Paddles to draw over the hull once it is drawn: [hand x, hand y, scale, stroke]. */
const OARS: [number, number, number, number][] = [];

function paddler(ctx: Ctx, x: number, y: number, k: number, kind: UnitKind = 'warrior', stroke = 0) {
  const b = figure(ctx, kind, 'nepal', x, y, k);
  OARS.push([b.hand.x, b.hand.y, k, stroke]);
}

function paddles(ctx: Ctx, waterY: number) {
  for (const [hx, hy, k, st] of OARS.splice(0)) {
    const tx = hx - (5 + st * 3) * k / 0.44, ty = waterY + 1.6;
    line(ctx, hx + 2.4 * k / 0.44, hy - 4.6 * k / 0.44, tx, ty, WOOD_D, 1);
    ellipse(ctx, tx - 0.3, ty + 0.6, 1, 1.9, WOOD);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(tx, ty + 2.4, 2.4, 0.8, 0, 0, Math.PI * 2); ctx.stroke();
  }
}

function foam(ctx: Ctx, x: number, y: number, half: number) {
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - half * 0.85, y + 2);
  ctx.quadraticCurveTo(x, y + 4.4, x + half * 0.85, y + 1.6);
  ctx.stroke();
}

/** A raft of logs lashed with cane, seen end-on at an angle: a boatman poling it with a long bamboo, sacks of grain. */
function raft(ctx: Ctx, x: number, y: number) {
  const logs = 5;
  for (let i = logs - 1; i >= 0; i--) { // far logs first
    const oy = y - i * 1.6, ox = x + i * 1.4;
    poly(ctx, [ox - 15, oy - 0.8, ox + 13, oy - 3.4, ox + 13, oy - 1.4, ox - 15, oy + 1.2], i % 2 ? WOOD : WOOD_L);
    ellipse(ctx, ox + 13, oy - 2.4, 0.9, 1, shade(WOOD_L, 0.2)); // the cut end
    ring(ctx, ox + 13, oy - 2.4, 0.5, 0.5, WOOD_D, 0.3);
  }
  for (const t of [0.15, 0.85]) line(ctx, x - 15 + 28 * t, y + 0.8 - 2.6 * t, x - 15 + 28 * t + 6, y + 0.8 - 2.6 * t - 6.4, '#c8a868', 0.8); // cane lashings
  // sacks and a doko basket
  for (const [dx, dy, c] of [[2, -6, '#d8c8a0'], [5, -7.4, '#c8b48a'], [3.6, -9, '#e0d0aa']] as const) { ellipse(ctx, x + dx, y + dy, 2.2, 1.5, c); line(ctx, x + dx - 1, y + dy - 1.2, x + dx + 0.6, y + dy - 1.4, shade(c, -0.3), 0.4); }
  poly(ctx, [x + 7.6, y - 10, x + 11.6, y - 11, x + 10.6, y - 4.6, x + 8.6, y - 4.4], '#b8944a');
  for (const t of [0.3, 0.6]) line(ctx, x + 7.8 + t * 0.6, y - 10 + t * 5.4, x + 11.4 - t * 0.6, y - 11 + t * 6.2, '#7a5a2a', 0.4);
  // the boatman with his pole
  const b = figure(ctx, 'explorer', 'nepal', x - 8, y - 4, 0.48);
  line(ctx, b.hand.x + 4, b.hand.y - 10, b.hand.x - 7, b.hand.y + 12, '#a88a50', 0.9);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(b.hand.x - 7, b.hand.y + 12.6, 2.2, 0.7, 0, 0, Math.PI * 2); ctx.stroke();
  foam(ctx, x, y, 16);
}

/** A dugout river boat (dunga): one hollowed sal log, long and low, the ends a little raised and squared. */
function dunga(ctx: Ctx, x: number, y: number, len: number, color: string, crew?: () => void, rail = false) {
  const half = len / 2;
  const sheer = (t: number) => y - 3 - Math.pow(Math.abs(t), 3) * 2.6;
  poly(ctx, [x - half * 0.9, sheer(-0.9) - 1.4, x + half * 0.9, sheer(0.9) - 1.4, x + half * 0.88, sheer(0.88) + 0.4, x - half * 0.88, sheer(-0.88) + 0.4], shade(color, -0.35));
  crew?.();
  const top: number[] = [];
  for (let i = 0; i <= 20; i++) { const t = -1 + i * 0.1; top.push(x + t * half, sheer(t)); }
  const bottom: number[] = [];
  for (let i = 20; i >= 0; i--) { const t = -1 + i * 0.1, tt = Math.abs(t); bottom.push(x + t * half * 0.96, y + 2 - tt * tt * 2.4); }
  poly(ctx, [...top, ...bottom], color);
  poly(ctx, [x - half * 0.9, y + 0.4, x + half * 0.9, y + 0.4, x + half * 0.76, y + 2.2, x - half * 0.76, y + 2.2], shade(color, -0.28));
  // the squared ends, the adze marks and a painted band
  for (const d of [-1, 1]) { const ex = x + d * half, ey = sheer(d); poly(ctx, [ex, ey, ex + d * 1.2, ey - 0.6, ex + d * 1.2, ey + 2.6, ex - d * 0.4, ey + 3.2], shade(color, -0.12)); }
  line(ctx, x - half * 0.9, y - 1.6, x + half * 0.9, y - 1.6, rail ? CRIMSON : shade(color, 0.15), rail ? 1 : 0.5);
  for (let i = 0; i < Math.floor(len / 5); i++) { const px = x - half * 0.8 + i * 5 + rand(len, i) * 2; line(ctx, px, y - 0.6, px + 1.2, y - 0.2, shade(color, -0.18), 0.4); }
  if (rail) for (let i = 0; i < Math.floor(len / 6); i++) { const px = x - half * 0.75 + i * 6; poly(ctx, [px, y - 1.1, px + 1.2, y - 2.1, px + 2.4, y - 1.1, px + 1.2, y - 0.1], GOLD); }
  foam(ctx, x, y, half);
  return sheer;
}

function boats(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  if (kind === 'boat') return raft(ctx, x, y);
  if (kind === 'ship') { // a long dugout: two paddlers and a porter's load of baskets
    dunga(ctx, x, y, 46, '#6a4a2c', () => {
      paddler(ctx, x - 15, y - 3.2, 0.42, 'archer', 0);
      for (const [dx, c] of [[-3, '#b8944a'], [1.4, '#c8a45a'], [-0.8, '#a8844a']] as const) {
        poly(ctx, [x + dx - 2, y - 9 - (dx === -0.8 ? 2 : 0), x + dx + 2, y - 9.4 - (dx === -0.8 ? 2 : 0), x + dx + 1.4, y - 3.4, x + dx - 1.2, y - 3.2], c);
        line(ctx, x + dx - 1.8, y - 7 - (dx === -0.8 ? 2 : 0), x + dx + 1.8, y - 7.3 - (dx === -0.8 ? 2 : 0), shade(c, -0.35), 0.4);
      }
      paddler(ctx, x + 9, y - 3.2, 0.42, 'warrior', 1);
    });
    paddles(ctx, y);
    line(ctx, x - 22, y - 7, x - 26, y + 3, WOOD_D, 1.1); // the steering paddle
    ellipse(ctx, x - 25.8, y + 2.4, 1, 2.1, WOOD);
    prayerFlags(ctx, x + 18, y - 4, x + 22, y - 14, 0.6, 0.8, 5);
    line(ctx, x + 22, y - 3, x + 22, y - 14.4, WOOD_D, 0.6);
    return;
  }
  // the warship: a broad river boat of planks with a curved roof of matting at the stern, Gurkhas with kukris in
  // the bow, paddlers along the side, and the double crimson pennant of Nepal on a mast
  const sheer = dunga(ctx, x, y, 58, '#5a3a22', () => {
    // the cabin roof: an arched hood of bamboo matting on poles, crimson cloth hung at its mouth
    const mx = x - 13, my = y - 4;
    ctx.beginPath();
    ctx.moveTo(mx - 9, my);
    ctx.quadraticCurveTo(mx - 9, my - 11, mx, my - 11);
    ctx.quadraticCurveTo(mx + 9, my - 11, mx + 9, my);
    ctx.closePath();
    ctx.fillStyle = ink('#c8a868');
    ctx.fill();
    for (let i = 1; i < 9; i++) line(ctx, mx - 9 + i * 2, my - 0.2, mx - 9 + i * 2, my - 10.4 + Math.abs(i - 4.5) * 0.4, shade('#c8a868', -0.2), 0.4);
    for (const t of [0.3, 0.6]) curve(ctx, mx - 8.6, my - 11 * t * 0.9 - 1, mx, my - 11 * t * 0.4 - 7 + t * 5, mx + 8.6, my - 11 * t * 0.9 - 1, 0.6, '#7a5a2a');
    poly(ctx, [mx + 5, my, mx + 9, my, mx + 8.6, my - 6.4, mx + 5, my - 8], CRIMSON);
    for (let i = 0; i < 3; i++) paddler(ctx, x - 1 + i * 7, y - 3.2, 0.42, 'archer', i % 2);
    for (const dx of [16, 21]) { const b = figure(ctx, 'gurkha', 'nepal', x + dx, y - 4, 0.44); kukri(ctx, b.hand.x, b.hand.y, -1.2, 0.55); }
    // the mast with the flag of Nepal and a string of prayer flags to the bow
    line(ctx, x + 6, y - 3, x + 6, y - 26, WOOD_D, 1);
    nepalFlag(ctx, x + 6.4, y - 26, 1.1);
    prayerFlags(ctx, x + 6, y - 16, x + 28, y - 6, 1, 0.8, 9);
  }, true);
  paddles(ctx, y);
  for (let i = 0; i < 5; i++) { // round dhal shields hung along the gunwale
    const px = x - 4 + i * 5.6, py = sheer((px - x) / 29) + 1.6;
    dhal(ctx, px, py, 1.9, 0.4, i % 2 === 1);
  }
  line(ctx, x - 27, y - 8, x - 31, y + 3, WOOD_D, 1.2);
  ellipse(ctx, x - 30.8, y + 2.4, 1, 2.2, WOOD);
}

function unit(ctx: Ctx, kind: UnitKind, x: number, y: number): boolean {
  switch (kind) {
    case 'rider': case 'knight': horseman(ctx, kind, x, y); return true;
    case 'catapult': cannon(ctx, x, y); return true;
    case 'boat': case 'ship': case 'warship': boats(ctx, kind, x, y); return true;
  }
  return false;
}

// ---------------------------------------------------------------- buildings

/** A point on the ground plan: u runs to the lower right, v to the lower left, h is height. */
const P = (x: number, y: number, u: number, v: number, h = 0): [number, number] => [x + (u - v), y + (u + v) / 2 - h];

/** Two visible walls of a block (half-extents A along u, B along v, height h), standing at height `h0`. */
function walls(ctx: Ctx, x: number, y: number, A: number, B: number, h: number, c: string, h0 = 0) {
  poly(ctx, [...P(x, y, -A, B, h0), ...P(x, y, A, B, h0), ...P(x, y, A, B, h0 + h), ...P(x, y, -A, B, h0 + h)], shade(c, 0.04));
  poly(ctx, [...P(x, y, A, B, h0), ...P(x, y, A, -B, h0), ...P(x, y, A, -B, h0 + h), ...P(x, y, A, B, h0 + h)], shade(c, -0.24));
}
/** The flat top of a block. */
function lid(ctx: Ctx, x: number, y: number, A: number, B: number, h: number, c: string) {
  poly(ctx, [...P(x, y, -A, -B, h), ...P(x, y, A, -B, h), ...P(x, y, A, B, h), ...P(x, y, -A, B, h)], c);
}
/** Brick courses on the two walls. */
function courses(ctx: Ctx, x: number, y: number, A: number, B: number, h: number, h0: number, step = 1.2) {
  for (let z = h0 + step; z < h0 + h - 0.3; z += step) {
    const a = P(x, y, -A, B, z), f = P(x, y, A, B, z), r = P(x, y, A, -B, z);
    line(ctx, a[0], a[1], f[0], f[1], 'rgba(60,20,10,0.28)', 0.25);
    line(ctx, f[0], f[1], r[0], r[1], 'rgba(30,10,5,0.3)', 0.25);
  }
}

/**
 * A carved Newar window on the front wall (along u, at v = B) centred at u, its sill at height z: a dark timber frame
 * with a projecting lintel, latticed (tiki jhya) or with a carved centre panel; `wide` for the long bay windows.
 */
function jhya(ctx: Ctx, x: number, y: number, u: number, B: number, z: number, w: number, h: number, kind: 'lattice' | 'carved' | 'door', side: 'F' | 'S' = 'F') {
  const Q = (du: number, dz: number) => (side === 'F' ? P(x, y, u + du, B, z + dz) : P(x, y, B, u + du, z + dz));
  const frame = side === 'F' ? CARVE : shade(CARVE, -0.2);
  // the projecting sill and lintel
  poly(ctx, [...Q(-w / 2 - 0.8, -0.5), ...Q(w / 2 + 0.8, -0.5), ...Q(w / 2 + 0.8, 0), ...Q(-w / 2 - 0.8, 0)], frame);
  poly(ctx, [...Q(-w / 2 - 1, h), ...Q(w / 2 + 1, h), ...Q(w / 2 + 1, h + 0.7), ...Q(-w / 2 - 1, h + 0.7)], frame);
  poly(ctx, [...Q(-w / 2, 0), ...Q(w / 2, 0), ...Q(w / 2, h), ...Q(-w / 2, h)], kind === 'door' ? '#2a1610' : CARVE_L);
  if (kind === 'lattice') { // a fine diagonal lattice
    const n = Math.max(2, Math.round(w / 0.9));
    for (let i = 0; i <= n; i++) {
      const a = Q(-w / 2 + (w * i) / n, 0), b = Q(-w / 2 + Math.min(w, (w * i) / n + h), Math.min(h, w - (w * i) / n));
      line(ctx, a[0], a[1], b[0], b[1], '#8a6a44', 0.25);
      const c = Q(w / 2 - (w * i) / n, 0), d = Q(w / 2 - Math.min(w, (w * i) / n + h), Math.min(h, w - (w * i) / n));
      line(ctx, c[0], c[1], d[0], d[1], '#8a6a44', 0.25);
    }
  } else if (kind === 'carved') { // a dark opening with a carved central panel and side panels
    poly(ctx, [...Q(-w / 2 + 0.3, 0.3), ...Q(w / 2 - 0.3, 0.3), ...Q(w / 2 - 0.3, h - 0.3), ...Q(-w / 2 + 0.3, h - 0.3)], '#1a0e08');
    for (const du of [-w / 4, w / 4]) { const a = Q(du, 0.3), b = Q(du, h - 0.3); line(ctx, a[0], a[1], b[0], b[1], '#8a6a44', 0.35); }
    const c = Q(0, h * 0.55);
    ellipse(ctx, c[0], c[1], Math.min(0.8, w * 0.18), 0.7, '#8a6a44');
  } else { // a door with a carved tympanum above it
    const c = Q(0, h + 1.2);
    ellipse(ctx, c[0], c[1], w * 0.55, 0.9, GOLD_D);
    const a = Q(0, 0), b = Q(0, h);
    line(ctx, a[0], a[1], b[0], b[1], '#5a3a24', 0.3);
  }
}

/**
 * The deep overhanging pitched roof of a Newar house: dark terracotta tiles in rows, its ridge along u; the eaves
 * held out on carved diagonal struts. Drawn at eave height `h` over a block of half-extents A, B.
 */
function newarRoof(ctx: Ctx, x: number, y: number, A: number, B: number, h: number, R: number, c = TILE, struts = true) {
  const o = 1.6, e = 1.2, eh = h - 0.6;
  if (struts) for (let i = 0; i < 4; i++) { // the struts from the wall up to the eave
    const u = -A + 0.6 + (i * (2 * A - 1.2)) / 3, a = P(x, y, u, B, h - 3), b = P(x, y, u, B + o * 0.9, eh + 0.2);
    line(ctx, a[0], a[1], b[0], b[1], CARVE, 0.7);
  }
  if (struts) for (const v of [B * 0.2, -B * 0.6]) { const a = P(x, y, A, v, h - 3), b = P(x, y, A + o * 0.9, v, eh + 0.2); line(ctx, a[0], a[1], b[0], b[1], shade(CARVE, -0.2), 0.7); }
  const E1 = P(x, y, -A - e, B + o, eh), E2 = P(x, y, A + e, B + o, eh), R2 = P(x, y, A + e, 0, h + R), R1 = P(x, y, -A - e, 0, h + R);
  const B2 = P(x, y, A + e, -B - o, eh);
  poly(ctx, [...R2, ...B2, B2[0], B2[1] + 0.9, R2[0], R2[1] + 0.9], shade(c, -0.4)); // the far slope's edge over the gable
  // the gable end in brick under the roof
  poly(ctx, [...P(x, y, A, B, h), ...P(x, y, A, -B, h), ...P(x, y, A, 0, h + R - 0.4)], shade(BRICK, -0.3));
  poly(ctx, [...R1, ...R2, ...E2, ...E1], c);
  poly(ctx, [...E1, ...E2, E2[0], E2[1] + 0.9, E1[0], E1[1] + 0.9], shade(c, -0.45)); // the eave's thickness
  poly(ctx, [...R2, ...E2, E2[0] - 0.2, E2[1] + 0.9, R2[0] - 0.2, R2[1] + 0.9], shade(c, -0.3));
  const n = Math.round((2 * A + 2 * e) * 1.2);
  for (let i = 1; i < n; i++) { // the rows of tiles running down the slope
    const s = i / n, a = [R1[0] + (R2[0] - R1[0]) * s, R1[1] + (R2[1] - R1[1]) * s], b = [E1[0] + (E2[0] - E1[0]) * s, E1[1] + (E2[1] - E1[1]) * s];
    line(ctx, a[0], a[1], b[0], b[1], shade(c, -0.22), 0.35);
  }
  for (const t of [0.33, 0.66]) line(ctx, R1[0] + (E1[0] - R1[0]) * t, R1[1] + (E1[1] - R1[1]) * t, R2[0] + (E2[0] - R2[0]) * t, R2[1] + (E2[1] - R2[1]) * t, shade(c, 0.12), 0.3);
  line(ctx, R1[0], R1[1], R2[0], R2[1], shade(c, -0.5), 1);
}

/**
 * A Newar house: two or three storeys of red brick, each floor with its carved wooden windows (a door below, carved
 * windows above, a latticed bay at the top), a string course of dark timber between floors and a deep tiled roof.
 */
function newarHouse(ctx: Ctx, x: number, y: number, A: number, B: number, floors: number, roofC = TILE, brick = BRICK) {
  softShadow(ctx, x + 1.4, y + 1.4, (A + B) * 1.2, (A + B) * 0.55, 0.24);
  const fh = 4.2, H = floors * fh;
  walls(ctx, x, y, A + 0.3, B + 0.3, 0.8, STONE_D); // the plinth
  walls(ctx, x, y, A, B, H, brick, 0.8);
  courses(ctx, x, y, A, B, H, 0.8);
  for (let f = 1; f < floors; f++) { // timber string courses between the floors
    const z = 0.8 + f * fh, a = P(x, y, -A, B, z), b = P(x, y, A, B, z), c = P(x, y, A, -B, z);
    line(ctx, a[0], a[1], b[0], b[1], CARVE, 0.8);
    line(ctx, b[0], b[1], c[0], c[1], shade(CARVE, -0.2), 0.8);
  }
  // the windows
  const nw = Math.max(1, Math.round(A / 2.6));
  for (let f = 0; f < floors; f++) {
    const z = 0.8 + f * fh + (f === 0 ? 0 : 0.9), top = f === floors - 1 && floors > 1;
    if (f === 0) { jhya(ctx, x, y, -A * 0.3, B, z, 1.8, 3, 'door'); if (A > 3) jhya(ctx, x, y, A * 0.45, B, z + 1, 1.4, 1.8, 'carved'); continue; }
    if (top) { jhya(ctx, x, y, 0, B, z, A * 1.3, 2.2, 'lattice'); continue; }
    for (let i = 0; i < nw; i++) jhya(ctx, x, y, -A + ((i + 0.5) * 2 * A) / nw, B, z, 1.4, 2.2, 'carved');
  }
  if (floors > 1) jhya(ctx, x, y, 0, A, 0.8 + fh + 0.9, 1.2, 2, 'carved', 'S');
  newarRoof(ctx, x, y, A, B, H + 0.8, Math.max(2.6, B * 1.1), roofC);
}

/**
 * A pyramidal roof tier of a pagoda: a square of half-side a at eave height z, its four slopes meeting at height
 * z + h (or cut off where the next storey rises, at half-side `cut`); a dark eave, struts beneath, bells at the corners.
 */
function tier(ctx: Ctx, x: number, y: number, a: number, z: number, h: number, wallA: number, c: string, cut = 0, gilt = false) {
  const t = cut / a; // how far up the slope the next storey cuts it
  const top = (u: number, v: number) => P(x, y, u * (cut || 0.01), v * (cut || 0.01), z + h * (1 - t));
  // struts from the wall below up to the eave
  for (let i = 0; i < 3; i++) { const u = -wallA + ((i + 0.5) * 2 * wallA) / 3, p = P(x, y, u, wallA, z - 2.4), q = P(x, y, u * 1.3, a * 0.92, z - 0.2); line(ctx, p[0], p[1], q[0], q[1], CARVE, 0.6); }
  for (let i = 0; i < 2; i++) { const v = wallA - ((i + 0.5) * 2 * wallA) / 2, p = P(x, y, wallA, v, z - 2.4), q = P(x, y, a * 0.92, v * 1.3, z - 0.2); line(ctx, p[0], p[1], q[0], q[1], shade(CARVE, -0.25), 0.6); }
  const L = P(x, y, -a, a, z), F = P(x, y, a, a, z), R = P(x, y, a, -a, z);
  // the eave's thickness
  poly(ctx, [...L, ...F, F[0], F[1] + 1, L[0], L[1] + 1], shade(c, -0.5));
  poly(ctx, [...F, ...R, R[0], R[1] + 1, F[0], F[1] + 1], shade(c, -0.6));
  // the two slopes we see
  poly(ctx, [...L, ...F, ...top(1, 1), ...top(-1, 1)], gilt ? GOLD : c);
  poly(ctx, [...F, ...R, ...top(1, -1), ...top(1, 1)], shade(gilt ? GOLD : c, -0.3));
  // tile ribs down the slopes, a lighter line along the hips
  const n = Math.max(4, Math.round(a * 1.1));
  for (let i = 1; i < n; i++) {
    const s = i / n, e1 = [L[0] + (F[0] - L[0]) * s, L[1] + (F[1] - L[1]) * s], t1 = P(x, y, (-1 + 2 * s) * (cut || 0.01), cut || 0.01, z + h * (1 - t));
    line(ctx, e1[0], e1[1], t1[0], t1[1], shade(gilt ? GOLD : c, -0.18), 0.3);
    const e2 = [F[0] + (R[0] - F[0]) * s, F[1] + (R[1] - F[1]) * s], t2 = P(x, y, cut || 0.01, (1 - 2 * s) * (cut || 0.01), z + h * (1 - t));
    line(ctx, e2[0], e2[1], t2[0], t2[1], shade(gilt ? GOLD : c, -0.45), 0.3);
  }
  const tf = top(1, 1);
  line(ctx, F[0], F[1], tf[0], tf[1], shade(gilt ? GOLD : c, 0.25), 0.6);
  // little bells hanging at the corners
  for (const p of [L, F, R]) { line(ctx, p[0], p[1], p[0], p[1] + 1.6, GOLD_D, 0.3); ellipse(ctx, p[0], p[1] + 2, 0.5, 0.6, GOLD); }
}

/**
 * A Newar pagoda temple: a stepped brick plinth, a square shrine with carved doors and a gilt torana over the middle
 * one, and `n` diminishing roofs on struts, the top one gilt, a gilt finial (gajur) and a long metal banner (pataka)
 * hanging down the roofs from it. `s` scales the whole.
 */
function pagoda(ctx: Ctx, x: number, y: number, s: number, n: number, steps: number, roofC: string, lions = false) {
  softShadow(ctx, x + 1.4 * s, y + 2 * s, 14 * s, 6 * s, 0.24);
  let z = 0, half = (5.2 + steps * 1.6) * s;
  const sh = 1.6 * s;
  for (let i = 0; i < steps; i++) { // the plinth
    walls(ctx, x, y, half, half, sh, i % 2 ? '#b8584a' : BRICK_L, z);
    lid(ctx, x, y, half, half, z + sh, shade(STONE, 0.1));
    const st = P(x, y, half * 0.55, half, z); // a stair up the front
    poly(ctx, [st[0] - 1.6 * s, st[1] - 0.8 * s, st[0] + 1.6 * s, st[1] + 0.8 * s, st[0] + 1.6 * s, st[1] + 0.8 * s - sh, st[0] - 1.6 * s, st[1] - 0.8 * s - sh], STONE);
    if (lions && i < 4) { // a pair of guardians flanking the stair on each step (as at the Nyatapola)
      for (const du of [-2.6, 2.6]) {
        const g = P(x, y, half * 0.55 + du * s, half - 0.6 * s, z + sh);
        poly(ctx, [g[0] - 0.8 * s, g[1], g[0] + 0.8 * s, g[1], g[0] + 0.6 * s, g[1] - 2.4 * s, g[0] - 0.6 * s, g[1] - 2.4 * s], i < 2 ? STONE : '#c8bca8');
        ellipse(ctx, g[0], g[1] - 2.6 * s, 0.8 * s, 0.7 * s, i < 2 ? STONE_D : STONE);
      }
    }
    z += sh;
    half -= 1.6 * s;
  }
  // the shrine: brick walls with three carved doors on the front
  const w = 4.2 * s, wh = 5.4 * s;
  walls(ctx, x, y, w, w, wh, BRICK, z);
  courses(ctx, x, y, w, w, wh, z, 1.1 * s);
  for (const du of [-w * 0.6, 0, w * 0.6]) jhya(ctx, x, y, du, w, z + 0.3 * s, du === 0 ? 1.6 * s : 1.2 * s, (du === 0 ? 3.4 : 3) * s, 'door');
  const tg = P(x, y, 0, w, z + 4.4 * s);
  ellipse(ctx, tg[0], tg[1], 1.9 * s, 1.1 * s, GOLD); // the gilt torana over the main door
  ellipse(ctx, tg[0], tg[1] + 0.2 * s, 1.2 * s, 0.6 * s, GOLD_D);
  z += wh;
  // the roofs, each storey stepping in
  let a = 8.2 * s, ww = w, zt = z, at = a;
  for (let i = 0; i < n; i++) {
    const last = i === n - 1, nextW = ww * 0.74, rh = (last ? 5.4 : 3.6) * s;
    tier(ctx, x, y, a, z, rh, ww, roofC, last ? 0 : nextW, last && n > 1);
    zt = z; at = a;
    if (last) { z += rh; break; }
    z += rh * (1 - nextW / a);
    const sh2 = 2.6 * s; // the next storey's wall, with a carved window band
    walls(ctx, x, y, nextW, nextW, sh2, BRICK_D, z);
    for (const du of [-nextW * 0.5, 0, nextW * 0.5]) jhya(ctx, x, y, du, nextW, z + 0.4 * s, 0.8 * s, 1.5 * s, 'lattice');
    z += sh2;
    a *= 0.76;
    ww = nextW;
  }
  // the gilt finial: stacked bells and a parasol, and the banner hanging from it down the roofs
  const f = P(x, y, 0, 0, z);
  for (let i = 0; i < 3; i++) ellipse(ctx, f[0], f[1] - i * 1.2 * s, (1.3 - i * 0.3) * s, (0.8 - i * 0.15) * s, i % 2 ? GOLD_D : GOLD);
  poly(ctx, [f[0] - 0.5 * s, f[1] - 3 * s, f[0] + 0.5 * s, f[1] - 3 * s, f[0], f[1] - 6 * s], GOLD_L);
  ellipse(ctx, f[0], f[1] - 6 * s, 0.4 * s, 0.4 * s, GOLD_L);
  // the pataka: a ribbon of gilt metal hanging from the finial down the top roof and over its eave
  const bt = P(x, y, 0, 0.6 * s, z - 1 * s), be = P(x, y, -0.4 * s, at * 0.96, zt), bb = [be[0], be[1] + 3.4 * s];
  poly(ctx, [bt[0] - 0.5 * s, bt[1], bt[0] + 0.5 * s, bt[1], be[0] + 0.6 * s, be[1], bb[0] + 0.6 * s, bb[1], bb[0], bb[1] + 0.8 * s, bb[0] - 0.6 * s, bb[1], be[0] - 0.6 * s, be[1]], GOLD);
  line(ctx, bt[0] + 0.3 * s, bt[1], be[0] + 0.3 * s, be[1], GOLD_L, 0.25 * s);
  for (let i = 1; i < 4; i++) { const t = i / 4; line(ctx, bt[0] + (be[0] - bt[0]) * t - 0.5 * s, bt[1] + (be[1] - bt[1]) * t, bt[0] + (be[0] - bt[0]) * t + 0.5 * s, bt[1] + (be[1] - bt[1]) * t, GOLD_D, 0.3 * s); }
}

/** A pati: an open rest-house of carved posts under a tiled roof, on a brick platform, a bench inside. */
function pati(ctx: Ctx, x: number, y: number, s = 1) {
  softShadow(ctx, x + 1, y + 1.2, 9 * s, 4 * s, 0.22);
  const A = 5 * s, B = 2.6 * s;
  walls(ctx, x, y, A + 0.6, B + 0.6, 1.4, BRICK);
  lid(ctx, x, y, A + 0.6, B + 0.6, 1.4, shade(BRICK_L, 0.1));
  // the back wall, then the carved posts along the front
  poly(ctx, [...P(x, y, -A, -B, 1.4), ...P(x, y, A, -B, 1.4), ...P(x, y, A, -B, 5.6), ...P(x, y, -A, -B, 5.6)], BRICK_D);
  for (let i = 0; i <= 3; i++) { const p = P(x, y, -A + (i * 2 * A) / 3, B, 1.4); line(ctx, p[0], p[1], p[0], p[1] - 4.2, CARVE, 0.9); ellipse(ctx, p[0], p[1] - 3.8, 0.6, 0.4, CARVE_L); }
  for (let i = 0; i <= 1; i++) { const p = P(x, y, A, B - i * 2 * B, 1.4); line(ctx, p[0], p[1], p[0], p[1] - 4.2, shade(CARVE, -0.2), 0.9); }
  newarRoof(ctx, x, y, A, B, 5.6, 2.6, TILE, false);
}

/** A stone water-spout (dhunge dhara): a sunken brick basin with a carved makara spout and a water jar. */
function dhara(ctx: Ctx, x: number, y: number) {
  poly(ctx, [...P(x, y, -3.4, -2.4), ...P(x, y, 3.4, -2.4), ...P(x, y, 3.4, 2.4), ...P(x, y, -3.4, 2.4)], BRICK_D);
  poly(ctx, [...P(x, y + 0.8, -2.6, -1.6), ...P(x, y + 0.8, 2.6, -1.6), ...P(x, y + 0.8, 2.6, 1.6), ...P(x, y + 0.8, -2.6, 1.6)], '#4a8aa0');
  const sp = P(x, y, -1, -2.4, 1.6);
  poly(ctx, [sp[0] - 0.8, sp[1], sp[0] + 1.6, sp[1] + 0.8, sp[0] + 1.2, sp[1] + 1.6, sp[0] - 0.8, sp[1] + 1], STONE);
  line(ctx, sp[0] + 1.4, sp[1] + 1.4, sp[0] + 1.8, sp[1] + 3.6, 'rgba(220,240,255,0.8)', 0.5);
  const j = P(x, y, 2, 2.4);
  ellipse(ctx, j[0], j[1] - 1.4, 1.3, 1.5, '#b8862e');
  ellipse(ctx, j[0], j[1] - 2.8, 0.7, 0.3, '#5a3a1a');
}

/**
 * The capital: a Durbar Square. Behind, a tall five-roofed pagoda on a five-step plinth flanked by stone guardians;
 * in front, the royal palace: a long brick front of three storeys with rows of carved windows, a gilt Golden Gate in
 * the middle, the flag of Nepal over it, and a pillar with a kneeling gilt king on top before the gate.
 */
function durbarSquare(ctx: Ctx, x: number, y: number, roofC: string) {
  softShadow(ctx, x + 1, y + 3, 26, 10, 0.2);
  pagoda(ctx, x - 7, y - 8, 0.82, 5, 5, roofC, true);
  // the palace front
  const px = x + 6, py = y + 5, A = 12, B = 3.2, fh = 4, H = 12;
  softShadow(ctx, px + 1, py + 1.6, 16, 5, 0.22);
  walls(ctx, px, py, A + 0.3, B + 0.3, 0.8, STONE_D);
  walls(ctx, px, py, A, B, H, BRICK, 0.8);
  courses(ctx, px, py, A, B, H, 0.8);
  for (let f = 1; f < 3; f++) { const z = 0.8 + f * fh, a = P(px, py, -A, B, z), b = P(px, py, A, B, z), c = P(px, py, A, -B, z); line(ctx, a[0], a[1], b[0], b[1], CARVE, 0.8); line(ctx, b[0], b[1], c[0], c[1], shade(CARVE, -0.2), 0.8); }
  for (let i = 0; i < 6; i++) { // the windows: carved on the first floor, a long latticed gallery on the top
    const u = -A + 2 + i * 4;
    if (Math.abs(u) > 1.6) jhya(ctx, px, py, u, B, 1.6, 1.2, 2.2, 'carved');
    jhya(ctx, px, py, u, B, 0.8 + fh + 0.8, 1.4, 2.2, 'carved');
  }
  jhya(ctx, px, py, 0, B, 0.8 + 2 * fh + 0.7, A * 1.6, 2.2, 'lattice');
  // the Golden Gate: a gilt doorway with a torana of the goddess and makaras above it
  const g = (du: number, dz: number) => P(px, py, du, B + 0.1, dz);
  poly(ctx, [...g(-2.4, 0.8), ...g(2.4, 0.8), ...g(2.4, 6.6), ...g(-2.4, 6.6)], GOLD_D);
  poly(ctx, [...g(-1.6, 0.8), ...g(1.6, 0.8), ...g(1.6, 5), ...g(-1.6, 5)], '#2a1610');
  const tc = g(0, 6.8);
  ctx.beginPath(); ctx.ellipse(tc[0], tc[1], 3, 2.4, 0, Math.PI, 0); ctx.fillStyle = ink(GOLD); ctx.fill();
  ellipse(ctx, tc[0], tc[1] - 1, 0.9, 0.9, RUBY);
  for (const d of [-1, 1]) ellipse(ctx, tc[0] + d * 2.4, tc[1] - 0.2, 0.6, 0.6, GOLD_L);
  newarRoof(ctx, px, py, A, B, H + 0.8, 3.6, roofC);
  // a small pagoda roof tower at the palace's end
  // the flag over the gate
  const fp = P(px, py, 0, 0, H + 4.4);
  line(ctx, fp[0], fp[1] + 2, fp[0], fp[1] - 9, WOOD_D, 0.6);
  nepalFlag(ctx, fp[0], fp[1] - 9, 0.75);
  // the king's pillar before the gate: a stone column with a gilt kneeling figure under a little parasol
  const kp = P(x, y, 4, 13);
  softShadow(ctx, kp[0] + 0.6, kp[1] + 0.4, 2.4, 1, 0.3);
  box(ctx, kp[0], kp[1], 2.4, 1.2, STONE);
  poly(ctx, [kp[0] - 0.6, kp[1] - 1, kp[0] + 0.6, kp[1] - 1, kp[0] + 0.5, kp[1] - 13, kp[0] - 0.5, kp[1] - 13], STONE);
  poly(ctx, [kp[0], kp[1] - 1, kp[0] + 0.6, kp[1] - 1, kp[0] + 0.5, kp[1] - 13, kp[0], kp[1] - 13], STONE_D);
  ellipse(ctx, kp[0], kp[1] - 13, 1.4, 0.6, GOLD_D);
  ellipse(ctx, kp[0], kp[1] - 14.4, 0.9, 1.2, GOLD);
  ellipse(ctx, kp[0], kp[1] - 16, 0.6, 0.6, GOLD);
  line(ctx, kp[0] + 0.6, kp[1] - 16, kp[0] + 0.6, kp[1] - 18.6, GOLD_D, 0.3);
  poly(ctx, [kp[0] - 1.6, kp[1] - 18, kp[0] + 2.8, kp[1] - 18, kp[0] + 0.6, kp[1] - 19.6], GOLD);
  // prayer flags strung from the pagoda's plinth to the palace roof
  const pf = P(x - 7, y - 8, 9, 9, 6), pr = P(px, py, -A - 1, 0, H + 3);
  prayerFlags(ctx, pf[0], pf[1], pr[0], pr[1], 1.4, 0.8, 3);
}

/** The temple square of a big town: a three-roofed pagoda on a stepped plinth, with a pati and a bell beside it. */
function templeSquare(ctx: Ctx, x: number, y: number, roofC: string) {
  pati(ctx, x - 12, y + 3, 0.75);
  pagoda(ctx, x + 1, y, 0.85, 3, 3, roofC);
  // the temple bell hung in a little frame
  const b = P(x, y, 12, 6);
  line(ctx, b[0] - 2, b[1], b[0] - 2, b[1] - 7, CARVE, 0.8);
  line(ctx, b[0] + 2, b[1], b[0] + 2, b[1] - 7, CARVE, 0.8);
  line(ctx, b[0] - 2.6, b[1] - 7, b[0] + 2.6, b[1] - 7, CARVE, 1);
  poly(ctx, [b[0] - 1.2, b[1] - 3, b[0] + 1.2, b[1] - 3, b[0] + 0.7, b[1] - 6.2, b[0] - 0.7, b[1] - 6.2], '#a8782a');
  ellipse(ctx, b[0], b[1] - 3, 1.2, 0.4, '#8a5e1e');
  const f = P(x, y, -4, 9);
  line(ctx, f[0], f[1], f[0], f[1] - 12, WOOD_D, 0.6);
  prayerFlags(ctx, f[0], f[1] - 12, b[0] + 2.6, b[1] - 7, 1, 0.75, 7);
}

function building(ctx: Ctx, x: number, y: number, big: boolean, roofC: string, capital: boolean) {
  const rc = roofC || TILE;
  if (big && capital) return durbarSquare(ctx, x, y, rc);
  if (big) return templeSquare(ctx, x, y, rc);
  const spot: Record<string, number> = { '-10,2': 0, '10,2': 1, '0,8': 3, '-6,-8': 2, '7,-7': 4, '-14,-3': 1, '14,-2': 0 };
  const v = spot[`${Math.round(x)},${Math.round(y)}`] ?? ((Math.round(x) * 7 + Math.round(y) * 3) % 5 + 5) % 5;
  if (v === 0) newarHouse(ctx, x, y, 4.2, 3, 3, rc);
  else if (v === 1) { newarHouse(ctx, x - 3, y - 1.6, 3, 2.6, 3, rc); newarHouse(ctx, x + 3.6, y + 1.8, 3.2, 2.6, 2, rc, BRICK_L); }
  else if (v === 2) { pagoda(ctx, x, y, 0.5, 2, 2, rc); dhara(ctx, x + 8, y + 4); }
  else if (v === 3) { newarHouse(ctx, x - 1, y - 1, 3.6, 2.6, 2, rc); pati(ctx, x + 5, y + 5, 0.6); }
  else { newarHouse(ctx, x, y, 3.8, 2.8, 3, rc, BRICK_L); rhododendron(ctx, x + 8, y + 3, 0.5, 3); }
}

// ---------------------------------------------------------------- trees

/** A little terrace of rice below a tree: a curved earth bank with a ledge of green rice on top. */
function terrace(ctx: Ctx, x: number, y: number, k: number, w: number, P_?: BiomePalette) {
  const rice = P_ ? mix(P_.field, '#7ac040', 0.5) : '#8ac850', bank = P_?.fieldSide ?? '#8a6a44';
  ctx.beginPath();
  ctx.moveTo(x - w * k, y);
  ctx.quadraticCurveTo(x, y + 2.6 * k, x + w * k, y - 0.4 * k);
  ctx.lineTo(x + w * k, y + 1.4 * k);
  ctx.quadraticCurveTo(x, y + 4.4 * k, x - w * k, y + 1.8 * k);
  ctx.closePath();
  ctx.fillStyle = ink(bank);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - w * k, y);
  ctx.quadraticCurveTo(x, y + 2.6 * k, x + w * k, y - 0.4 * k);
  ctx.quadraticCurveTo(x, y - 0.6 * k, x - w * k, y - 1.6 * k);
  ctx.closePath();
  ctx.fillStyle = ink(rice);
  ctx.fill();
  for (let i = 0; i < 9; i++) { // rows of rice tufts
    const t = (i + 0.5) / 9, px = x - w * k + 2 * w * k * t, py = y - 0.6 * k + Math.sin(t * Math.PI) * 1.2 * k - t * 0.2 * k;
    line(ctx, px, py, px - 0.2 * k, py - 1.2 * k, shade(rice, -0.2), 0.4 * k);
    line(ctx, px, py, px + 0.4 * k, py - 1 * k, shade(rice, 0.15), 0.35 * k);
  }
}

/**
 * The rhododendron (lali gurans), the kingdom's flower: a crooked reddish trunk branching low, rounded clumps of
 * dark leathery leaves, and crowns of bright red flower trusses all over the top.
 */
function rhododendron(ctx: Ctx, x: number, y: number, k: number, variant: number, P_?: BiomePalette) {
  const bark = '#6a4030', green = P_ ? mix(P_.forest, '#1e5a30', 0.4) : '#235a32';
  const lean = (rand(variant, 1) - 0.5) * 3 * k;
  // the crooked trunk and branches
  curve(ctx, x, y, x - 1.6 * k + lean, y - 5 * k, x + lean, y - 8 * k, 3 * k, shade(bark, -0.1));
  curve(ctx, x - 0.4 * k, y, x - 2 * k + lean, y - 5 * k, x - 0.4 * k + lean, y - 8 * k, 0.7 * k, shade(bark, 0.2));
  for (const [dx, dy] of [[-7, -11], [6, -12], [0, -15], [-3, -10], [3, -10]] as const) curve(ctx, x + lean, y - 8 * k, x + lean + dx * 0.3 * k, y - 10 * k, x + lean + dx * k, y + dy * k, 1.4 * k, bark);
  // the leaf clumps, darker beneath
  const cx = x + lean, cy = y - 14 * k, W = (9 + rand(variant, 2) * 2) * k;
  ellipse(ctx, cx + 0.6 * k, cy + 2.4 * k, W, 4 * k, shade(green, -0.35));
  const clumps: [number, number, number][] = [[-5.6, 0.6, 3.4], [5, 0.8, 3.4], [-2.6, -2.6, 3.6], [2.8, -2.8, 3.6], [0, 1.4, 3.8], [0, -5, 3.2], [-6, -3.4, 2.4], [6.4, -3, 2.4]];
  clumps.forEach(([dx, dy, r], i) => {
    ellipse(ctx, cx + dx * k, cy + dy * k, r * k, r * 0.8 * k, shade(green, -0.15 + (dy < -2 ? 0.1 : 0) + (i % 2) * 0.05));
    for (let j = 0; j < 4; j++) { const a = j * 1.6 + i; line(ctx, cx + dx * k, cy + dy * k, cx + dx * k + Math.cos(a) * r * 0.9 * k, cy + dy * k + Math.sin(a) * r * 0.6 * k, shade(green, 0.12), 0.5 * k); } // leaf rosettes
  });
  // the red flower trusses
  for (let i = 0; i < 11; i++) {
    const a = rand(variant + 7, i) * Math.PI * 2, rr = rand(variant + 9, i) * 0.85;
    const fx = cx + Math.cos(a) * W * 0.78 * rr, fy = cy - 2 * k + Math.sin(a) * 4.6 * k * rr - (1 - rr) * 2 * k;
    const c = i % 4 === 0 ? '#f04a5a' : i % 3 === 0 ? '#b8102a' : '#d8203a';
    for (let j = 0; j < 5; j++) { const b = (j / 5) * Math.PI * 2; ellipse(ctx, fx + Math.cos(b) * 0.9 * k, fy + Math.sin(b) * 0.7 * k, 0.8 * k, 0.7 * k, c); }
    ellipse(ctx, fx - 0.2 * k, fy - 0.3 * k, 0.6 * k, 0.5 * k, '#ff8a8a');
  }
}

/**
 * The chir pine of the middle hills: a tall straight trunk of reddish plated bark, bare below, with a few upswept
 * branches carrying open tufts of long drooping light-green needles; the crown irregular and airy.
 */
function chirPine(ctx: Ctx, x: number, y: number, k: number, variant: number, P_?: BiomePalette) {
  const bark = '#8a4a2a', green = P_ ? mix(P_.forest, '#5a9a3a', 0.35) : '#4a8a3a';
  const h = (24 + rand(variant, 3) * 5) * k, top = y - h, lean = (rand(variant, 4) - 0.5) * 2 * k;
  poly(ctx, [x - 1.3 * k, y, x + 1.3 * k, y, x + lean + 0.4 * k, top, x + lean - 0.4 * k, top], bark);
  poly(ctx, [x + 0.2 * k, y, x + 1.3 * k, y, x + lean + 0.4 * k, top, x + lean, top], shade(bark, -0.28));
  for (let i = 0; i < 6; i++) { const py = y - (2 + i * 2.6) * k; line(ctx, x - 1 * k + lean * (y - py) / h, py, x + 0.2 * k + lean * (y - py) / h, py - 0.8 * k, shade(bark, -0.4), 0.35 * k); } // the bark plates
  // the tufts: on short upswept branches, each a fan of drooping needles
  const tuft = (tx: number, ty: number, r: number, c: string) => {
    ellipse(ctx, tx, ty, r * 1.1 * k, r * 0.6 * k, shade(c, -0.25));
    for (let j = 0; j < 9; j++) {
      const a = Math.PI * (0.9 + (j / 8) * 1.2), ex = tx + Math.cos(a) * r * 1.3 * k, ey = ty + Math.sin(a) * r * 0.5 * k;
      curve(ctx, tx, ty - 0.4 * k, (tx + ex) / 2, ty - r * 0.8 * k, ex, ey + r * 0.5 * k, 0.45 * k, j % 2 ? c : shade(c, 0.16));
    }
  };
  const levels = [0.38, 0.52, 0.64, 0.76, 0.88];
  levels.forEach((lv, i) => {
    const by = y - h * lv, bx = x + lean * lv, side = i % 2 ? 1 : -1, len = (5.6 - i * 0.7) * k;
    const ex = bx + side * len, ey = by - 2.6 * k;
    curve(ctx, bx, by, bx + side * len * 0.5, by - 0.2 * k, ex, ey, 0.6 * k, shade(bark, -0.2));
    tuft(ex, ey, 3 - i * 0.25, i % 2 ? green : shade(green, -0.08));
    if (i < 3) tuft(bx - side * 1.6 * k, by - 1.4 * k, 2.2, shade(green, -0.14));
  });
  tuft(x + lean, top + 0.6 * k, 2.6, shade(green, 0.08));
}

function tree(ctx: Ctx, x: number, y: number, k: number, P_: BiomePalette, variant: number) {
  const v = variant % 6;
  if (v === 1 || v === 4) return chirPine(ctx, x, y, k * 0.85, variant, P_);
  if (v === 3) { terrace(ctx, x - 1 * k, y - 0.6 * k, k, 8, P_); terrace(ctx, x + 1 * k, y + 2.6 * k, k, 10, P_); return rhododendron(ctx, x, y - 1 * k, k * 0.85, variant, P_); }
  if (v === 5) { terrace(ctx, x - 1 * k, y - 0.6 * k, k, 8, P_); terrace(ctx, x + 1 * k, y + 2.6 * k, k, 10, P_); return chirPine(ctx, x, y - 1 * k, k * 0.8, variant, P_); }
  rhododendron(ctx, x, y, k * 0.9, variant, P_);
}

registerArt('nepal', {
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

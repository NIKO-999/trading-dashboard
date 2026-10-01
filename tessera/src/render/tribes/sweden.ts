// Sweden, the Carolean Empire (17th and 18th centuries): infantry in blue coats with yellow facings, cuffs and coat-tail
// turnbacks, buff breeches and cross-belts, long hair under black tricorns laced in yellow (a blue-and-yellow karpus cap
// for the levy); muskets with socket bayonets, pikes, and long straight pallasch swords with brass hilts. The Carolean
// charges home (gå-på) with the bayonet levelled and his sword at his hip. Cavalry in blue coats and steel breastplates,
// tall black jackboots, on horses with blue shabraques of the Three Crowns; the heavy horse under lobster-pot helmets.
// A light 'leather cannon' (a bronze tube bound in leather and rope) on a blue carriage. A Baltic galley, a pear-bellied
// fluyt and the royal warship Vasa with its gilded stern, all under the blue-and-yellow cross (triple-tongued at war).
// Falu-red wooden cottages with white corners and window frames, ochre stone houses under green copper säteri roofs, a
// white church with a copper spire, and for the capital the castle of Tre Kronor with its three gold crowns. Scots pine,
// drooping Norway spruce and birch, with lingonberries and mossy boulders on the forest floor.
import { registerArt, type Body } from '../tribeart';
import { drawHorse, figure } from '../units';
import type { BiomePalette } from '../../data/tribes';
import type { UnitKind } from '../../game/types';
import { band, box, ellipse, faceQuad, ink, line, mix, poly, rand, roof, shade, type Ctx } from '../prims';

const BLUE = '#26478c';
const BLUE_L = '#4066ac';
const BLUE_D = '#172c5a';
const FLAG_BLUE = '#1f5cae';
const YEL = '#f2c823';
const YEL_L = '#fbe27a';
const YEL_D = '#b08a14';
const BUFF = '#d8bf88';
const BUFF_D = '#a88a56';
const BOOT = '#1c1816';
const BOOT_L = '#3c3430';
const HAT = '#1c1a1f';
const STEEL = '#c4cad2';
const STEEL_L = '#eef2f6';
const STEEL_D = '#6a727c';
const BRASS = '#d4aa3a';
const BRASS_D = '#8a6a1a';
const GOLD = '#e8b830';
const GOLD_L = '#fadc78';
const GOLD_D = '#9a7018';
const WHITE = '#f4f1e8';
const WHITE_D = '#d4d0c4';
const WOOD = '#7a5230';
const WOOD_L = '#9a6a40';
const WOOD_D = '#4a3018';
const BRONZE = '#b8823a';
const BRONZE_L = '#e4b468';
const BRONZE_D = '#76501e';
const LEATHER = '#4a3020';
const IRON = '#34343a';
const FALU = '#9c2e22';
const FALU_D = '#6e1e16';
const COPPER = '#5aa88c';
const COPPER_L = '#92d4b6';
const COPPER_D = '#33765e';
const OCHRE = '#dca850';
const STONE = '#c4beb2';
const STONE_L = '#ece8de';
const TAR = '#3a3430';
const HAIR = '#c99a42';
const HAIR_D = '#8a6420';
const SKIN = '#f2d0b0';
const GLASS = '#3a4a5c';

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

/** A rounded dome (a hat crown, a helmet bowl): the rim is the ellipse at (x, y), the crown rises `h` above it. */
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
  ellipse(ctx, x - rx * 0.34, y - h * 0.58, rx * 0.34, h * 0.26, shade(c, 0.4));
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

/** A polygon on one face of a box, given in (u, v). */
function fpoly(ctx: Ctx, f: 'L' | 'R', x: number, y: number, w: number, h: number, pts: [number, number][], c: string) {
  poly(ctx, pts.flatMap(([u, v]) => fp(f, x, y, w, h, u, v)), c);
}

/** A line drawn on a face of a box, from (u0, v0) to (u1, v1). */
function faceLine(ctx: Ctx, f: 'L' | 'R', x: number, y: number, w: number, h: number, u0: number, v0: number, u1: number, v1: number, c: string, wd: number) {
  line(ctx, ...fp(f, x, y, w, h, u0, v0), ...fp(f, x, y, w, h, u1, v1), c, wd);
}

/** The flag of Sweden: blue with a yellow Nordic cross, streaming right from (x, y); the war flag is triple-tongued. */
function flag(ctx: Ctx, x: number, y: number, w: number, h: number, wave = 0, tongues = false) {
  const P = (u: number, v: number): [number, number] => [x + u * w, y + v * h + Math.sin(u * 3.2) * wave];
  const outline: [number, number][] = tongues
    ? [[0, 0], [0.6, 0], [1.2, 0], [0.9, 0.36], [1.34, 0.5], [0.9, 0.64], [1.2, 1], [0.6, 1], [0, 1]]
    : [[0, 0], [0.5, 0], [1, 0], [1, 1], [0.5, 1], [0, 1]];
  const pts = outline.flatMap(([u, v]) => P(u, v));
  poly(ctx, pts, FLAG_BLUE);
  ctx.save();
  clipPoly(ctx, pts);
  const top: number[] = [], bot: number[] = [];
  for (let i = 0; i <= 10; i++) { const u = (i / 10) * 1.4; top.push(...P(u, 0.38)); bot.unshift(...P(u, 0.62)); }
  poly(ctx, [...top, ...bot], YEL);
  const vt: number[] = [], vb: number[] = [];
  for (let i = 0; i <= 4; i++) { const v = -0.2 + (i / 4) * 1.4; vt.push(...P(0.3, v)); vb.unshift(...P(0.46, v)); }
  poly(ctx, [...vt, ...vb], YEL);
  poly(ctx, [...P(0.55, -0.2), ...P(1.4, -0.2), ...P(1.4, 1.2), ...P(0.55, 1.2)], 'rgba(0,0,0,0.1)');
  ctx.restore();
}

/** A long blue-and-yellow masthead pennant. */
function pennant(ctx: Ctx, x: number, y: number, len: number, wave = 0.6) {
  poly(ctx, [x, y, x + len * 0.5, y + 0.6 + wave, x + len, y + 1.2, x + len * 0.5, y + 1.8 + wave, x, y + 2.4], FLAG_BLUE);
  poly(ctx, [x, y + 0.9, x + len * 0.5, y + 1.15 + wave, x + len * 0.92, y + 1.2, x + len * 0.5, y + 1.35 + wave, x, y + 1.5], YEL);
}

/** A small gold crown (for the Three Crowns), `s` about its half width. */
function crownMark(ctx: Ctx, x: number, y: number, s: number, c = GOLD) {
  poly(ctx, [x - s, y, x + s, y, x + s, y - 0.7 * s, x - s, y - 0.7 * s], c);
  poly(ctx, [x - s, y - 0.6 * s, x - s * 0.95, y - 1.7 * s, x - s * 0.45, y - 1 * s, x, y - 2 * s, x + s * 0.45, y - 1 * s, x + s * 0.95, y - 1.7 * s, x + s, y - 0.6 * s], c);
  for (const d of [-0.95, 0, 0.95]) ellipse(ctx, x + d * s, y - (d ? 1.8 : 2.1) * s, 0.3 * s, 0.3 * s, GOLD_L);
}

/** The Three Crowns, two over one. */
function threeCrowns(ctx: Ctx, x: number, y: number, s: number, c = GOLD) {
  crownMark(ctx, x - 1.25 * s, y - 1.3 * s, s * 0.9, c);
  crownMark(ctx, x + 1.25 * s, y - 1.3 * s, s * 0.9, c);
  crownMark(ctx, x, y + 1.2 * s, s * 0.9, c);
}

// ---------------------------------------------------------------- dress

function dress(kind: UnitKind): [string, string, string] | null {
  switch (kind) {
    case 'explorer': return [BUFF, '#5a4c3c', BUFF];
    case 'warrior': return ['#3a5a94', BUFF, '#3a5a94'];
    default: return [BLUE, BUFF, BLUE];
  }
}

const PLATED = (k: UnitKind) => k === 'swordsman' || k === 'knight' || k === 'rider';
const MUSKET = (k: UnitKind) => k === 'archer' || k === 'carolean' || k === 'warrior';

/** The Carolean coat: skirts with yellow turnbacks, yellow facings down the front, brass buttons, a white neckcloth, a
 *  buff waist belt and a buff cross-belt (or a steel breastplate for the heavy ranks). */
function torso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const k = w / 10;
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const L = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'L', x, y, w, h, u0, u1, v0, v1, c);
  const B = (v0: number, v1: number, c: string) => band(ctx, x, y, w, h, v0, v1, c);
  // the back sleeve's yellow cuff (the back arm is drawn before the torso)
  faceQuad(ctx, 'R', x - 5.9 * k, y - 1 * k, 2.8 * k, 7 * k, 0, 1, 0.12, 0.34, YEL);
  if (kind === 'explorer') { // a buff leather coat, belted, a brown satchel strap and a spyglass at the belt
    for (const f of ['L', 'R'] as const) faceQuad(ctx, f, x, y, w * 1.04, h, 0, 1, -0.4, 0.02, shade(BUFF, -0.12));
    R(0.47, 0.53, -0.4, 1, BUFF_D);
    for (let i = 0; i < 5; i++) R(0.4, 0.46, 0.18 + i * 0.15, 0.24 + i * 0.15, BRASS_D);
    B(0.08, 0.16, LEATHER);
    fpoly(ctx, 'R', x, y, w, h, [[0, 0.96], [0.14, 0.96], [1, 0.2], [0.86, 0.2]], LEATHER);
    R(0.7, 0.98, -0.1, 0.06, '#4a4a50');
    B(0.88, 1, WHITE);
    return;
  }
  const cloth = kind === 'warrior' ? '#3a5a94' : BLUE;
  // the coat skirts below the waist
  for (const f of ['L', 'R'] as const) faceQuad(ctx, f, x, y, w * 1.04, h, 0, 1, -0.46, 0.02, shade(cloth, -0.1));
  // the skirts' corners turned back to show the yellow lining
  fpoly(ctx, 'R', x, y, w * 1.04, h, [[0.34, -0.46], [0.5, -0.46], [0.5, -0.06]], YEL);
  fpoly(ctx, 'R', x, y, w * 1.04, h, [[0.5, -0.46], [0.66, -0.46], [0.5, -0.06]], YEL_D);
  fpoly(ctx, 'L', x, y, w * 1.04, h, [[0, -0.46], [0.16, -0.46], [0, -0.1]], YEL_D);
  R(0.06, 0.3, -0.18, -0.1, shade(cloth, -0.3)); // a pocket flap
  if (PLATED(kind)) {
    // a steel breastplate with a lit ridge and brass rivets, strapped over the coat
    R(0.04, 0.96, 0.14, 0.88, STEEL);
    R(0.04, 0.46, 0.14, 0.88, shade(STEEL, 0.14));
    R(0.46, 0.52, 0.14, 0.88, STEEL_L);
    R(0.52, 0.56, 0.14, 0.88, STEEL_D);
    L(0.5, 1, 0.14, 0.88, shade(STEEL, -0.04));
    for (const u of [0.1, 0.9]) R(u - 0.04, u + 0.04, 0.8, 0.86, BRASS);
    R(0.04, 0.96, 0.14, 0.2, STEEL_D); // its turned lower edge
    B(0.88, 1, cloth);
    R(0.4, 0.6, 0.88, 1, WHITE); // the neckcloth
    // a yellow-and-blue silk sash over the plate for the officers
    if (kind === 'knight') fpoly(ctx, 'R', x, y, w, h, [[0, 0.82], [0.14, 0.86], [1, 0.3], [0.86, 0.24]], YEL);
    B(0.06, 0.14, BUFF_D);
    return;
  }
  // facings down the front, brass (or gilt) buttons, the neckcloth
  const button = kind === 'giant' ? GOLD_L : BRASS;
  R(0.42, 0.47, -0.04, 0.9, YEL);
  R(0.53, 0.58, -0.04, 0.9, YEL);
  R(0.47, 0.53, -0.04, 0.9, shade(cloth, -0.25));
  for (let i = 0; i < 6; i++) R(0.36, 0.42, 0.12 + i * 0.13, 0.17 + i * 0.13, button);
  R(0.38, 0.62, 0.86, 1, WHITE);
  L(0.82, 1, 0.86, 1, WHITE_D);
  B(0.92, 1, YEL); // the yellow collar
  if (kind === 'giant') {
    // King Karl's plain blue coat, but a blue silk ribbon of the Seraphim and its star
    fpoly(ctx, 'R', x, y, w, h, [[0, 0.86], [0.12, 0.9], [1, 0.22], [0.88, 0.18]], '#6aa8e0');
    R(0.66, 0.8, 0.58, 0.72, WHITE);
    R(0.7, 0.76, 0.6, 0.7, GOLD);
    B(0.06, 0.14, BUFF_D);
    R(0.46, 0.56, 0.06, 0.14, GOLD);
    return;
  }
  B(0.06, 0.14, BUFF_D); // the waist belt
  R(0.44, 0.56, 0.06, 0.14, BRASS);
  if (MUSKET(kind) || kind === 'defender') {
    // the buff cross-belt from the left shoulder, the cartridge box on the hip behind
    fpoly(ctx, 'R', x, y, w, h, [[0, 0.94], [0.16, 0.96], [1, 0.22], [0.84, 0.18]], BUFF);
    fpoly(ctx, 'R', x, y, w, h, [[0.06, 0.94], [0.1, 0.95], [0.94, 0.21], [0.9, 0.2]], shade(BUFF, 0.2));
    L(0.4, 0.86, -0.12, 0.14, LEATHER);
    L(0.54, 0.72, 0.02, 0.1, BRASS); // the crowned plate on the cartridge box
  }
}

/** The front sleeve's yellow cuff, painted over the arm figure() drew (its hand is at b.hand). */
function frontCuff(ctx: Ctx, b: Body, k: number, c = YEL) {
  const x = b.hand.x - 6.3 * k, hip = b.hand.y + 5.2 * k;
  faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.12, 0.36, c);
  faceQuad(ctx, 'L', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.12, 0.36, shade(c, -0.06));
  faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0.3, 0.42, 0.16, 0.3, BRASS);
}

/** Clean-shaven Caroleans, rosy with the cold; a cavalryman's moustache; the king clean-shaven and stern. */
function face(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  R(0.08, 0.22, 0.26, 0.36, '#eeaa92');
  R(0.78, 0.92, 0.26, 0.36, '#eeaa92');
  if (kind === 'swordsman' || kind === 'knight' || kind === 'rider' || kind === 'defender' || kind === 'explorer') {
    R(0.24, 0.47, 0.2, 0.26, HAIR_D); // a moustache, the ends turned up
    R(0.53, 0.76, 0.2, 0.26, HAIR_D);
    R(0.18, 0.26, 0.24, 0.3, HAIR_D);
    R(0.74, 0.82, 0.24, 0.3, HAIR_D);
  }
  if (kind === 'giant') R(0.2, 0.42, 0.62, 0.66, HAIR_D); // a hard brow
}

// ---------------------------------------------------------------- headgear

/** Long hair falling from under the hat to the shoulders. */
function longHair(ctx: Ctx, x: number, top: number, k: number, hw: number, c = HAIR) {
  const hh = 10.5 * k, hy = top + hh;
  faceQuad(ctx, 'L', x, hy, hw, hh, 0, 0.66, -0.3, 0.7, c);
  for (let i = 0; i < 4; i++) { const [px, py] = fp('L', x, hy, hw, hh, 0.08 + i * 0.17, -0.3); ellipse(ctx, px, py, 0.9 * k, 0.9 * k, shade(c, -0.12)); }
  faceQuad(ctx, 'L', x, hy, hw, hh, 0.1, 0.16, -0.24, 0.6, shade(c, -0.18));
  faceQuad(ctx, 'R', x, hy, hw, hh, 0.9, 1, -0.2, 0.8, c);
  faceQuad(ctx, 'R', x, hy, hw, hh, 0, 0.06, -0.1, 0.8, shade(c, -0.1));
}

/** The black tricorn, bound in yellow lace: three brim walls cocked up round a low crown. */
function tricorn(ctx: Ctx, x: number, top: number, k: number, hw: number, lace = YEL, s = 1) {
  const by = top + 2.2 * k, rx = (hw / 2 + 2.8 * k) * s;
  const pF: [number, number] = [x + 2 * k * s, by + 2.6 * k * s], pL: [number, number] = [x - rx, by - 0.2 * k], pR: [number, number] = [x + rx + 0.4 * k, by - 1.2 * k];
  const wall = (a: [number, number], b: [number, number], rise: number, c: string) => {
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const cx = mx, cy = my - rise * 2;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.quadraticCurveTo(cx, cy, a[0], a[1] - 0.6 * k);
    ctx.closePath();
    ctx.fillStyle = ink(c);
    ctx.fill();
    ctx.strokeStyle = ink(lace);
    ctx.lineWidth = 0.75 * k;
    ctx.beginPath();
    ctx.moveTo(b[0], b[1]);
    ctx.quadraticCurveTo(cx, cy, a[0], a[1] - 0.6 * k);
    ctx.stroke();
  };
  ellipse(ctx, x + 0.4 * k, by + 0.8 * k, rx * 0.9, 2.4 * k, 'rgba(0,0,0,0.25)'); // its shadow on the hair
  wall(pR, pL, 3.4 * k * s, shade(HAT, 0.12)); // the back wall, behind the crown
  dome(ctx, x, by, hw / 2 + 0.3 * k, 4.2 * k, HAT);
  wall(pL, pF, 3 * k * s, shade(HAT, 0.06));
  wall(pF, pR, 2.6 * k * s, shade(HAT, -0.08));
  ellipse(ctx, pL[0] * 0.55 + pF[0] * 0.45, pL[1] * 0.55 + pF[1] * 0.45 - 2.2 * k * s, 0.6 * k, 0.6 * k, BRASS); // a button holding the loop
}

/** The karpus: a Swedish blue cloth cap whose yellow flaps are folded up round it, tied at the front. */
function karpus(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const by = top + 2.6 * k, rx = hw / 2 + 1.2 * k;
  dome(ctx, x - 0.3 * k, by - 1.4 * k, rx * 0.9, 5.8 * k, BLUE);
  ellipse(ctx, x - 0.2 * k, by - 6.4 * k, 0.9 * k, 0.6 * k, BLUE_L); // the button on top
  // the folded flaps: a deep yellow band round the head, rising at the back
  poly(ctx, [x - rx, by + 0.4 * k, x - rx + 0.4 * k, by - 3.2 * k, x, by - 2.2 * k, x + rx, by - 3 * k, x + rx, by + 0.6 * k, x, by + 2 * k], YEL);
  poly(ctx, [x, by - 2.2 * k, x + rx, by - 3 * k, x + rx, by + 0.6 * k, x, by + 2 * k], YEL_D);
  line(ctx, x - rx + 0.4 * k, by - 3.2 * k, x, by - 2.2 * k, YEL_L, 0.6 * k);
  line(ctx, x, by - 2.2 * k, x + rx, by - 3 * k, YEL_L, 0.5 * k);
  line(ctx, x + 0.2 * k, by - 2 * k, x + 0.2 * k, by + 1.8 * k, YEL_D, 0.5 * k); // where the flaps meet
  ellipse(ctx, x + 0.2 * k, by - 0.4 * k, 0.7 * k, 0.5 * k, BLUE_D); // the tie
}

/** The lobster-pot (zischägge): a round steel skull with a riveted comb, a peak with a sliding nasal bar, hinged cheek
 *  plates and a laminated tail over the neck. */
function lobsterPot(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const hh = 10.5 * k, hy = top + hh, by = top + 3.4 * k, bx = hw / 2 + 0.6 * k;
  // the tail: three lames sweeping down the back of the neck
  for (let i = 2; i >= 0; i--) {
    const t = top + 3 * k + i * 2.4 * k;
    poly(ctx, [x - bx * 0.4, t, x - bx - 1.6 * k - i * 0.8 * k, t + 1.6 * k, x - bx - 1.4 * k - i * 0.8 * k, t + 3.6 * k, x - bx * 0.3, t + 2.4 * k], i % 2 ? STEEL_D : shade(STEEL, -0.18));
    line(ctx, x - bx - 1.4 * k - i * 0.8 * k, t + 3.5 * k, x - bx * 0.3, t + 2.3 * k, BRASS, 0.35 * k);
  }
  // the cheek plate over the ear
  faceQuad(ctx, 'L', x, hy, hw, hh, 0.46, 0.96, 0.16, 0.72, STEEL);
  faceQuad(ctx, 'L', x, hy, hw, hh, 0.46, 0.96, 0.16, 0.22, STEEL_D);
  for (const v of [0.3, 0.5]) { const [px, py] = fp('L', x, hy, hw, hh, 0.7, v); ellipse(ctx, px, py, 0.3 * k, 0.3 * k, BRASS); }
  dome(ctx, x, by, bx, 6.6 * k, STEEL);
  // the comb
  curve(ctx, x - bx * 0.7, by - 3 * k, x - 0.6 * k, by - 9 * k, x + bx * 0.6, by - 3.6 * k, 0.9 * k, STEEL_D);
  curve(ctx, x - bx * 0.7, by - 3.4 * k, x - 0.6 * k, by - 9.4 * k, x + bx * 0.6, by - 4 * k, 0.4 * k, STEEL_L);
  line(ctx, x - bx, by, x + bx, by, STEEL_D, 0.6 * k);
  for (const d of [-3.6, -1.2, 1.2, 3.6]) ellipse(ctx, x + d * k, by - 0.3 * k, 0.3 * k, 0.3 * k, BRASS);
  // the peak jutting forward, and the nasal bar
  poly(ctx, [x + 0.4 * k, by - 0.4 * k, x + bx + 3.2 * k, by + 0.8 * k, x + bx + 2.6 * k, by + 1.8 * k, x + 0.2 * k, by + 0.8 * k], STEEL);
  poly(ctx, [x + bx + 3.2 * k, by + 0.8 * k, x + bx + 2.6 * k, by + 1.8 * k, x + 0.2 * k, by + 0.8 * k, x + 0.3 * k, by + 0.3 * k], STEEL_D);
  line(ctx, x + 2.8 * k, by - 2 * k, x + 2.9 * k, by + 6.4 * k, STEEL_L, 0.7 * k);
  ellipse(ctx, x + 2.9 * k, by + 6.4 * k, 0.6 * k, 0.4 * k, STEEL);
}

/** A broad felt hat, one side pinned up, for the explorer. */
function feltHat(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const by = top + 1.8 * k, rx = hw / 2 + 3.6 * k;
  ellipse(ctx, x + 0.3 * k, by + 0.6 * k, rx, 2.6 * k, '#2a2420');
  ellipse(ctx, x, by, rx, 2.6 * k, '#4a3c30');
  dome(ctx, x, by - 0.4 * k, hw / 2 + 0.2 * k, 5 * k, '#4a3c30');
  band(ctx, x, by - 0.2 * k, hw + 0.4 * k, 1.4 * k, 0, 1, '#2a2420');
  poly(ctx, [x - rx, by, x - rx * 0.4, by - 1 * k, x - rx * 0.6, by - 4.4 * k, x - rx - 0.4 * k, by - 2 * k], '#3a2e24'); // the pinned-up side
  curve(ctx, x - rx * 0.5, by - 2 * k, x - rx * 0.9, by - 6 * k, x - rx * 1.2, by - 3 * k, 0.9 * k, WHITE);
}

/** The Swedish royal crown: a gold circlet of strawberry leaves, closed by arches, a blue enamel orb and cross. */
function crown(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const by = top + 2.4 * k, rx = hw / 2 + 0.6 * k;
  dome(ctx, x, by - 1.6 * k, rx * 0.9, 4.6 * k, '#7a1a2a');
  poly(ctx, [x - rx, by + 0.6 * k, x + rx, by + 0.6 * k, x + rx, by - 2.4 * k, x - rx, by - 2.4 * k], GOLD);
  poly(ctx, [x + 0.4 * k, by + 0.6 * k, x + rx, by + 0.6 * k, x + rx, by - 2.4 * k, x + 0.4 * k, by - 2.4 * k], shade(GOLD, -0.18));
  for (let i = 0; i < 5; i++) {
    const fx = x - rx + (i / 4) * rx * 2, c = i > 2 ? shade(GOLD, -0.12) : GOLD;
    poly(ctx, [fx - 1.1 * k, by - 2.4 * k, fx + 1.1 * k, by - 2.4 * k, fx + 0.6 * k, by - 4 * k, fx, by - 5.2 * k, fx - 0.6 * k, by - 4 * k], c); // a strawberry leaf
  }
  for (const [d, c] of [[-0.6, '#d02a3a'], [0, '#2a6ac8'], [0.6, '#2a9a5a']] as const) ellipse(ctx, x + d * rx, by - 0.9 * k, 0.7 * k, 0.8 * k, c);
  for (const d of [-0.8, -0.27, 0.27, 0.8]) ellipse(ctx, x + d * rx, by + 0.2 * k, 0.35 * k, 0.35 * k, WHITE);
  curve(ctx, x - rx * 0.9, by - 2.4 * k, x, by - 11 * k, x + rx * 0.9, by - 2.4 * k, 0.9 * k, GOLD);
  curve(ctx, x - rx * 0.2, by - 2.4 * k, x - 0.4 * k, by - 10.6 * k, x + 0.1 * k, by - 6.8 * k, 0.7 * k, GOLD_D);
  ellipse(ctx, x, by - 7.2 * k, 1.3 * k, 1.3 * k, '#2a5ab8'); // the orb, blue enamel banded in gold
  line(ctx, x - 1.3 * k, by - 7.2 * k, x + 1.3 * k, by - 7.2 * k, GOLD, 0.4 * k);
  line(ctx, x, by - 8.4 * k, x, by - 10.6 * k, GOLD, 0.7 * k);
  line(ctx, x - 0.9 * k, by - 9.8 * k, x + 0.9 * k, by - 9.8 * k, GOLD, 0.7 * k);
}

function head(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  switch (kind) {
    case 'warrior': longHair(ctx, x, top, k, hw); karpus(ctx, x, top, k, hw); return;
    case 'archer': case 'defender': case 'carolean': case 'swordsman': case 'rider':
      longHair(ctx, x, top, k, hw); tricorn(ctx, x, top, k, hw, kind === 'rider' ? WHITE : YEL); return;
    case 'knight': longHair(ctx, x, top, k, hw, HAIR_D); lobsterPot(ctx, x, top, k, hw); return;
    case 'explorer': longHair(ctx, x, top, k, hw, HAIR_D); feltHat(ctx, x, top, k, hw); return;
    case 'giant': longHair(ctx, x, top, k, hw, '#a8743a'); crown(ctx, x, top, k, hw); return;
    default: return;
  }
}

// ---------------------------------------------------------------- weapons

/** A flintlock musket from the butt (bx, by) to the muzzle (mx, my), with a socket bayonet if asked. */
function musket(ctx: Ctx, bx: number, by: number, mx: number, my: number, k: number, bayonet = false) {
  const dx = mx - bx, dy = my - by, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const P = (t: number, o: number): [number, number] => [bx + ux * t + nx * o, by + uy * t + ny * o];
  // the stock: a broad butt narrowing to the wrist, the fore-end running under the barrel
  poly(ctx, [...P(0, -1.5 * k), ...P(len * 0.3, -0.5 * k), ...P(len * 0.86, -0.4 * k), ...P(len * 0.86, 0.5 * k), ...P(len * 0.32, 0.8 * k), ...P(len * 0.18, 1.8 * k), ...P(0, 1.7 * k)], WOOD);
  line(ctx, ...P(0.4 * k, -1.1 * k), ...P(len * 0.3, -0.3 * k), WOOD_L, 0.45 * k);
  line(ctx, ...P(0, -1.5 * k), ...P(0, 1.7 * k), BRASS, 0.7 * k); // the brass butt plate
  // the barrel and its ramrod
  line(ctx, ...P(len * 0.26, -0.55 * k), ...P(len, -0.55 * k), STEEL_D, 0.95 * k);
  line(ctx, ...P(len * 0.3, -0.75 * k), ...P(len, -0.75 * k), STEEL_L, 0.3 * k);
  line(ctx, ...P(len * 0.5, 0.6 * k), ...P(len * 0.95, 0.4 * k), '#2a2420', 0.35 * k);
  for (const t of [0.55, 0.75]) line(ctx, ...P(len * t, -1 * k), ...P(len * t, 0.6 * k), BRASS, 0.4 * k); // the barrel bands
  // the lock: plate, cock and frizzen; the trigger guard below
  poly(ctx, [...P(len * 0.27, -0.2 * k), ...P(len * 0.36, -0.2 * k), ...P(len * 0.36, 0.6 * k), ...P(len * 0.27, 0.6 * k)], '#4a4a52');
  line(ctx, ...P(len * 0.28, -0.2 * k), ...P(len * 0.3, -1.6 * k), IRON, 0.5 * k);
  line(ctx, ...P(len * 0.35, -0.6 * k), ...P(len * 0.36, -1.4 * k), STEEL, 0.45 * k);
  curve(ctx, ...P(len * 0.24, 0.9 * k), ...P(len * 0.29, 2 * k), ...P(len * 0.35, 0.8 * k), 0.35 * k, BRASS);
  if (bayonet) {
    line(ctx, ...P(len - 2 * k, 0.6 * k), ...P(len + 0.4 * k, 0.6 * k), STEEL_D, 0.8 * k); // the socket
    line(ctx, ...P(len - 0.4 * k, 0.6 * k), ...P(len - 0.2 * k, -0.3 * k), STEEL_D, 0.5 * k);
    poly(ctx, [...P(len + 0.2 * k, 0.1 * k), ...P(len + 10 * k, 0.9 * k), ...P(len + 0.2 * k, 1.3 * k)], STEEL_L);
    poly(ctx, [...P(len + 0.2 * k, 0.75 * k), ...P(len + 10 * k, 0.9 * k), ...P(len + 0.2 * k, 1.3 * k)], '#98a0aa');
  }
}

/** A long straight pallasch with a brass hilt (knuckle-bow and shell guard), its blade from (x, y) at angle `a`. */
function pallasch(ctx: Ctx, x: number, y: number, a: number, len: number, k: number) {
  const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
  const P = (t: number, o: number): [number, number] => [x + ux * t * k + nx * o * k, y + uy * t * k + ny * o * k];
  poly(ctx, [...P(1, -0.7), ...P(len - 1.4, -0.6), ...P(len, 0), ...P(len - 1.4, 0.6), ...P(1, 0.7)], STEEL);
  poly(ctx, [...P(1, 0), ...P(len - 1.4, 0), ...P(len, 0), ...P(len - 1.4, 0.6), ...P(1, 0.7)], '#98a0aa');
  line(ctx, ...P(2, -0.15), ...P(len * 0.6, -0.15), STEEL_D, 0.3 * k); // the fuller
  line(ctx, ...P(1.4, -0.6), ...P(len - 1.6, -0.5), STEEL_L, 0.3 * k);
  // the hilt: a shell guard, a knuckle-bow round the grip, a brass pommel
  ellipse(ctx, ...P(0.8, 0), 1.6 * k, 1.1 * k, BRASS);
  ellipse(ctx, ...P(0.6, -0.3), 0.9 * k, 0.6 * k, shade(BRASS, 0.3));
  line(ctx, ...P(0, 0), ...P(-3.4, 0), '#3a2418', 1.4 * k);
  curve(ctx, ...P(0.6, 1.2), ...P(-1.6, 2.6), ...P(-3.6, 0.4), 0.5 * k, BRASS);
  ellipse(ctx, ...P(-3.9, 0), 1 * k, 1 * k, BRASS);
  ellipse(ctx, ...P(-4.1, -0.3), 0.4 * k, 0.4 * k, GOLD_L);
}

/** The sword hanging in its black scabbard at the left hip, its brass hilt by the belt. */
function sidearm(ctx: Ctx, x: number, y: number, k: number) {
  const hx = x - 2.6 * k, hy = y - 6.6 * k, tx = x - 12 * k, ty = y + 0.6 * k;
  line(ctx, hx, hy, tx, ty, '#1e1a18', 1.3 * k);
  line(ctx, hx, hy - 0.4 * k, tx, ty - 0.4 * k, '#4a403a', 0.4 * k);
  line(ctx, tx + 0.6 * k, ty - 0.4 * k, tx - 0.4 * k, ty + 0.3 * k, BRASS, 1.3 * k); // the chape
  line(ctx, hx - 0.4 * k, hy + 0.2 * k, hx + 0.2 * k, hy - 0.2 * k, BRASS, 1.5 * k); // the locket
  line(ctx, hx + 0.4 * k, hy - 0.4 * k, hx + 2.6 * k, hy - 2.2 * k, '#3a2418', 1.2 * k); // the grip
  curve(ctx, hx, hy - 1 * k, hx + 1.2 * k, hy - 3.2 * k, hx + 2.8 * k, hy - 2.4 * k, 0.45 * k, BRASS);
  ellipse(ctx, hx + 0.2 * k, hy - 0.2 * k, 1.3 * k, 0.8 * k, BRASS);
  ellipse(ctx, hx + 2.9 * k, hy - 2.5 * k, 0.8 * k, 0.8 * k, BRASS);
}

/** A pike: a long ash shaft, a leaf head, iron langets down the shaft. */
function pike(ctx: Ctx, x: number, y: number, k: number, len = 44) {
  const x0 = x - 1.4 * k, y0 = y + 7 * k, x1 = x + 2.4 * k, y1 = y - (len - 7) * k;
  line(ctx, x0, y0, x1, y1, WOOD, 1.1 * k);
  line(ctx, x0 - 0.35 * k, y0, x1 - 0.35 * k, y1, shade(WOOD, 0.4), 0.35 * k);
  line(ctx, x1, y1, x1 - 0.3 * k, y1 + 5 * k, STEEL_D, 0.6 * k);
  poly(ctx, [x1 - 1.1 * k, y1, x1 + 0.2 * k, y1 - 6.4 * k, x1 + 1.2 * k, y1 - 0.2 * k, x1 + 0.1 * k, y1 + 1 * k], STEEL_L);
  poly(ctx, [x1 + 0.2 * k, y1 - 6.4 * k, x1 + 1.2 * k, y1 - 0.2 * k, x1 + 0.1 * k, y1 + 1 * k], '#98a0aa');
  ellipse(ctx, x1 - 0.1 * k, y1 + 1.6 * k, 1 * k, 0.6 * k, YEL); // a yellow tassel at the head
}

/** The Carolean's charge: the musket levelled at the hip with the bayonet fixed, the hand forward on the stock. */
function caroleanArms(ctx: Ctx, b: Body, k: number) {
  const hx = b.hand.x, hy = b.hand.y;
  musket(ctx, hx - 7 * k, hy + 2.2 * k, hx + 12 * k, hy - 4.4 * k, k, true);
  // the front arm reaching forward along the musket, and the hand on it
  line(ctx, hx - 2 * k, hy - 3 * k, hx + 4.6 * k, hy - 1.6 * k, BLUE, 2.6 * k);
  line(ctx, hx + 3.2 * k, hy - 1.9 * k, hx + 5 * k, hy - 1.5 * k, YEL, 2.7 * k);
  ellipse(ctx, hx + 6 * k, hy - 1.4 * k, 1.2 * k, 1.1 * k, SKIN);
}

function weapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  frontCuff(ctx, b, k, kind === 'explorer' ? shade(BUFF, -0.15) : YEL);
  switch (kind) {
    case 'warrior': // a musket at the slope on the shoulder
      musket(ctx, x + 1 * k, y + 2 * k, x - 6 * k, y - 18 * k, k);
      return true;
    case 'archer': musket(ctx, x - 1 * k, y + 4 * k, x + 4 * k, y - 18 * k, k); return true;
    case 'defender': pike(ctx, x, y, k, 46); return true;
    case 'carolean': sidearm(ctx, x - 4.3 * k, y + 10.2 * k, k); caroleanArms(ctx, b, k); return true;
    case 'swordsman': pallasch(ctx, x, y, -Math.PI / 2 + 0.3, 19, k); return true;
    case 'giant': pallasch(ctx, x, y, -Math.PI / 2 + 0.22, 24, k); return true;
    case 'explorer': // a walking staff
      line(ctx, x - 1 * k, y + 6 * k, x + 1.6 * k, y - 12 * k, WOOD, 1 * k);
      ellipse(ctx, x + 1.6 * k, y - 12 * k, 0.8 * k, 0.8 * k, BRASS);
      return true;
    default: return false;
  }
}

// ---------------------------------------------------------------- whole foot units

/** The musketeer (archer): taking aim, the musket at his cheek, a wisp of smoke at the pan; the powder flask at his hip. */
function musketeer(ctx: Ctx, x: number, y: number) {
  sidearm(ctx, x, y, 1);
  const b = figure(ctx, 'archer', 'sweden', x, y, 1);
  frontCuff(ctx, b, 1);
  const butt = { x: x + 2.6, y: y - 14.4 }, muzzle = { x: x + 21, y: y - 17.4 };
  // the supporting arm reaching out under the barrel
  line(ctx, x + 4.4, y - 12.6, x + 10, y - 14.2, BLUE, 2.6);
  line(ctx, x + 8.6, y - 13.8, x + 10.4, y - 14.4, YEL, 2.7);
  musket(ctx, butt.x, butt.y, muzzle.x, muzzle.y, 1);
  ellipse(ctx, x + 11.2, y - 15, 1.2, 1.1, SKIN);
  ellipse(ctx, x + 4.6, y - 14.2, 1.1, 1, SKIN); // the trigger hand
  // the flash and the smoke
  ellipse(ctx, muzzle.x + 1.4, muzzle.y - 0.6, 1.4, 0.9, '#ffd060');
  for (const [dx, dy, r, a] of [[3.4, -1.4, 2, 0.55], [6, -2.6, 2.6, 0.45], [9, -3.4, 2.2, 0.32], [5.6, 0.2, 1.6, 0.35]] as const) {
    ctx.globalAlpha = a;
    ellipse(ctx, muzzle.x + dx, muzzle.y + dy, r, r * 0.8, '#e8e6e2');
    ctx.globalAlpha = 1;
  }
  ctx.globalAlpha = 0.5;
  ellipse(ctx, x + 6.4, y - 17, 1.2, 0.9, '#d8d6d2'); // from the pan
  ctx.globalAlpha = 1;
  // the powder flask on a cord
  ellipse(ctx, x - 3, y - 6.6, 1.4, 1.9, '#6a4a2a');
  line(ctx, x - 3, y - 8.6, x - 3, y - 9.6, BRASS, 0.8);
}

/** The Carolean: gå-på, charging home with the bayonet levelled, leaning into the run; dust kicked up behind. */
function carolean(ctx: Ctx, x: number, y: number) {
  for (const [dx, dy, r] of [[-9, 2, 2.2], [-12, 0.6, 1.6], [-6.6, 3, 1.4]] as const) {
    ctx.globalAlpha = 0.35;
    ellipse(ctx, x + dx, y + dy, r, r * 0.6, '#c8b898');
    ctx.globalAlpha = 1;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.transform(1, 0, -0.16, 1, 0, 0); // leaning forward into the charge
  sidearm(ctx, 0, 0, 1);
  const b = figure(ctx, 'carolean', 'sweden', 0, 0, 1);
  frontCuff(ctx, b, 1);
  ctx.restore();
  // the musket stays straight while the man leans: drawn in plain coordinates from the leaning hand
  const hx = x + 6.3 + 0.16 * 10.2, hy = y - 10.2;
  caroleanArms(ctx, { hand: { x: hx, y: hy }, off: b.off, top: b.top }, 1);
}

// ---------------------------------------------------------------- horsemen

const HK = 0.95;

/** A blue shabraque edged in yellow, with the Three Crowns in the corner, and holster caps before the saddle. */
function shabraque(ctx: Ctx, saddle: { x: number; y: number }, big: boolean) {
  const sx = saddle.x, sy = saddle.y, l = big ? 7.6 : 6.2;
  poly(ctx, [sx - l, sy - 0.6, sx + 3.6, sy - 0.6, sx + 3.4, sy + 6.6, sx - l + 1.4, sy + (big ? 9.4 : 8), sx - l - 0.6, sy + 5], BLUE);
  ctx.strokeStyle = ink(YEL);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sx + 3.4, sy + 6.6);
  ctx.lineTo(sx - l + 1.4, sy + (big ? 9.4 : 8));
  ctx.lineTo(sx - l - 0.6, sy + 5);
  ctx.stroke();
  threeCrowns(ctx, sx - l + 2.6, sy + (big ? 6.2 : 5), big ? 0.9 : 0.7);
  // the holsters, capped in blue fur-trimmed cloth
  poly(ctx, [sx + 3.4, sy - 1, sx + 6, sy - 1.6, sx + 6.4, sy + 2.4, sx + 3.8, sy + 2.8], BLUE_D);
  line(ctx, sx + 3.4, sy + 2.6, sx + 6.4, sy + 2.2, YEL, 0.7);
}

/** A rider's leg in buff breeches and a tall black jackboot with a broad bucket top above the knee. */
function jackboot(ctx: Ctx, sx: number, sy: number) {
  poly(ctx, [sx + 0.4, sy + 0.4, sx + 4, sy + 0.6, sx + 4.6, sy + 4.6, sx + 2.2, sy + 5], BUFF);
  poly(ctx, [sx + 1.4, sy + 3.6, sx + 5.6, sy + 3.2, sx + 5.2, sy + 6.6, sx + 1.8, sy + 7], BOOT_L);
  line(ctx, sx + 1.4, sy + 3.6, sx + 5.6, sy + 3.2, '#5a504a', 0.5);
  poly(ctx, [sx + 2.2, sy + 6.6, sx + 4.8, sy + 6.4, sx + 4.6, sy + 10.2, sx + 2.2, sy + 10.4], BOOT);
  poly(ctx, [sx + 2.2, sy + 10, sx + 4.8, sy + 9.8, sx + 6.8, sy + 11, sx + 2.2, sy + 11.3], BOOT);
  line(ctx, sx + 1.6, sy + 10.4, sx + 0.2, sy + 10.8, BRASS, 0.6); // the spur
}

/** Carolean horse: a dragoon (rider) in a tricorn on a bay, or a cuirassier (knight) in a lobster-pot on a black horse,
 *  both in blue coats and breastplates, swords pointed forward for the knee-to-knee charge. */
function horseman(ctx: Ctx, kind: 'rider' | 'knight', x: number, y: number) {
  const knight = kind === 'knight';
  const saddle = drawHorse(ctx, x - 1, y + 3, HK, knight ? '#2a2422' : '#7a4a2a', knight ? '#0e0c0c' : '#1a120c', undefined, BLUE);
  shabraque(ctx, saddle, knight);
  if (knight) { // a steel chamfron and a yellow-and-blue plume on the horse's head
    const hhx = x - 1 + 10.5 * HK, hhy = y + 3 - 15 * HK;
    faceQuad(ctx, 'R', hhx, hhy, 7 * HK, 5 * HK, 0.1, 0.7, 0.3, 0.98, STEEL);
    for (let i = -1; i <= 1; i++) curve(ctx, hhx + 0.4, hhy - 4.6, hhx + i * 1.2 - 0.6, hhy - 8.6, hhx + i * 1.6 - 2.6, hhy - 10.6, 0.9, i ? FLAG_BLUE : YEL);
  }
  const b = figure(ctx, kind, 'sweden', saddle.x, saddle.y, 0.9, true);
  frontCuff(ctx, b, 0.9);
  jackboot(ctx, saddle.x, saddle.y);
  pallasch(ctx, b.hand.x, b.hand.y, -0.5, knight ? 22 : 19, 0.9);
  if (!knight) { // a carbine slung on its swivel behind the dragoon's back
    musket(ctx, saddle.x - 8, saddle.y + 3, saddle.x - 2, saddle.y - 12, 0.7);
  }
}

// ---------------------------------------------------------------- the leather cannon

function wheel(ctx: Ctx, x: number, y: number, r: number, c: string) {
  ring(ctx, x, y, r * 0.78, r, shade(c, -0.3), 1.6);
  ring(ctx, x, y, r * 0.78, r, c, 1);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; line(ctx, x, y, x + Math.cos(a) * r * 0.74, y + Math.sin(a) * r * 0.95, c, 0.6); }
  ellipse(ctx, x, y, 1.3, 1.5, IRON);
  ellipse(ctx, x - 0.3, y - 0.4, 0.5, 0.5, '#7a7a82');
}

/** Gustavus Adolphus's light 'leather cannon': a thin bronze tube bound in leather and rope on a blue-painted carriage,
 *  a gunner in a tricorn with his linstock, a pyramid of shot and the flag of Sweden. */
function leatherCannon(ctx: Ctx, x: number, y: number) {
  for (const [ax, ay, ar] of [[11, 6, 1.5], [13.4, 6.4, 1.5], [12.2, 4.6, 1.5]] as const) {
    ellipse(ctx, x + ax, y + ay, ar, ar * 0.95, '#2a2a30');
    ellipse(ctx, x + ax - 0.5, y + ay - 0.5, ar * 0.4, ar * 0.35, '#7a7a84');
  }
  line(ctx, x + 15.8, y + 5, x + 15.8, y - 16, WOOD_D, 0.8);
  flag(ctx, x + 15.8, y - 16, 8, 5.4, 0.5);
  wheel(ctx, x + 2.4, y - 1.6, 5.4, '#3a5070'); // the far wheel
  // the trail running back to the ground, the cheeks of the carriage
  poly(ctx, [x - 14, y + 5.4, x + 4, y - 4, x + 5.6, y - 2.4, x - 12.6, y + 6.6], '#2e4870');
  poly(ctx, [x - 14, y + 5.4, x + 4, y - 4, x + 4.6, y - 3.2, x - 13.4, y + 6], '#4a6a98');
  line(ctx, x - 13.6, y + 5.8, x - 11, y + 4.4, IRON, 1.2); // the trail's iron shoe
  // the barrel: bronze breech and muzzle, the middle wrapped in leather and lashed with rope
  const b0: [number, number] = [x - 6, y - 3.6], b1: [number, number] = [x + 12, y - 9.6];
  const dx = b1[0] - b0[0], dy = b1[1] - b0[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const P = (t: number, o: number): [number, number] => [b0[0] + ux * t + nx * o, b0[1] + uy * t + ny * o];
  ellipse(ctx, ...P(-1.2, 0), 1.3, 1.3, BRONZE); // the cascabel
  poly(ctx, [...P(0, -2.6), ...P(len, -1.8), ...P(len, 1.8), ...P(0, 2.6)], BRONZE);
  poly(ctx, [...P(0, -2.6), ...P(len, -1.8), ...P(len, -0.6), ...P(0, -1)], BRONZE_L);
  poly(ctx, [...P(len * 0.2, -2.9), ...P(len * 0.78, -2.3), ...P(len * 0.78, 2.3), ...P(len * 0.2, 2.9)], LEATHER);
  poly(ctx, [...P(len * 0.2, -2.9), ...P(len * 0.78, -2.3), ...P(len * 0.78, -1.3), ...P(len * 0.2, -1.6)], '#6a4a30');
  for (let i = 0; i <= 6; i++) { const t = len * (0.22 + i * 0.09); line(ctx, ...P(t, -2.8), ...P(t + 0.6, 2.8), '#c8b080', 0.55); } // rope lashings
  for (const t of [len * 0.08, len * 0.9]) line(ctx, ...P(t, -2.6), ...P(t, 2.6), BRONZE_D, 0.9); // bronze rings
  ellipse(ctx, ...P(len, 0), 1.2, 2.2, BRONZE_D);
  ellipse(ctx, ...P(len + 0.2, 0), 0.8, 1.5, '#121214');
  wheel(ctx, x - 1, y + 1.4, 6, '#4a6a98'); // the near wheel
  // the gunner
  const g = figure(ctx, 'archer', 'sweden', x - 13.6, y + 2.6, 0.58);
  frontCuff(ctx, g, 0.58);
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

/** A square sail on its yard, bellied out; plain, or with a blue-and-yellow band along the foot. */
function squareSail(ctx: Ctx, mx: number, yTop: number, w: number, h: number, mark = false) {
  const l = mx - w / 2, r = mx + w / 2, b = yTop + h;
  line(ctx, l - 1.4, yTop - 0.4, r + 1.4, yTop + 0.4, WOOD_D, 1);
  const pts = [l, yTop, r, yTop + 0.4, r + 1.4, b - h * 0.45, r + 0.4, b, mx, b + 1.8, l - 0.4, b - 0.2, l - 1.4, b - h * 0.45];
  poly(ctx, pts, '#f2ecda');
  poly(ctx, [mx, yTop + 0.2, r, yTop + 0.4, r + 1.4, b - h * 0.45, r + 0.4, b, mx, b + 1.8], '#ddd5bf');
  if (mark) {
    ctx.save();
    clipPoly(ctx, pts);
    poly(ctx, [l - 2, b - h * 0.24, r + 2, b - h * 0.22, r + 2, b + 3, l - 2, b + 3], FLAG_BLUE);
    poly(ctx, [l - 2, b - h * 0.32, r + 2, b - h * 0.3, r + 2, b - h * 0.22, l - 2, b - h * 0.24], YEL);
    ctx.restore();
  }
  for (const t of [0.25, 0.75]) line(ctx, l + t * w, yTop + 1, l + t * w + (t - 0.5) * 2, b, 'rgba(0,0,0,0.1)', 0.5);
}

/** A lateen sail hung from a slanting yard. */
function lateen(ctx: Ctx, mx: number, my: number, h: number, span: number) {
  const ya: [number, number] = [mx - span * 0.55, my + h * 0.15], yb: [number, number] = [mx + span * 0.5, my - h * 0.9];
  line(ctx, ya[0], ya[1], yb[0], yb[1], WOOD_D, 0.9);
  const foot: [number, number] = [mx + span * 0.42, my + h * 0.02];
  poly(ctx, [ya[0] + 0.6, ya[1] - 0.2, yb[0] - 0.4, yb[1] + 0.6, foot[0] + 1.6, foot[1] - 0.8], '#f2ecda');
  poly(ctx, [mx, my - h * 0.4, yb[0] - 0.4, yb[1] + 0.6, foot[0] + 1.6, foot[1] - 0.8], '#ddd5bf');
}

type HullPaint = 'galley' | 'fluyt' | 'vasa';

/** A curved hull seen side-on; `top(t)` is the gunwale height along it (t from -1 stern to 1 bow). */
function hull(ctx: Ctx, x: number, y: number, w: number, top: (t: number) => number, paint: HullPaint) {
  const near: [number, number][] = [];
  for (let i = 0; i <= 12; i++) { const t = -1 + i / 6; near.push([x + t * w, top(t)]); }
  const far = near.map(([a, b], i) => [a + (i === 0 ? 1.8 : i === 12 ? -1.8 : 0), b - 2] as [number, number]);
  poly(ctx, [...near.flat(), ...[...far].reverse().flat()], '#3a2414');
  const keel = [...near, [x + w * 0.86, y - 0.6], [x + w * 0.5, y + 2.6], [x, y + 3.2], [x - w * 0.5, y + 2.8], [x - w * 0.96, y - 0.4]] as [number, number][];
  const side = paint === 'vasa' ? '#3a2818' : paint === 'galley' ? '#8a5a30' : '#6a4426';
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
      if (paint === 'galley') { stroke(1, FLAG_BLUE, 1.2); stroke(2.1, YEL, 0.6); }
      if (paint === 'fluyt') for (const dy of [1.6, 3.2]) stroke(dy, 'rgba(30,18,8,0.5)', 0.45);
      if (paint === 'vasa') { stroke(1, '#b02a20', 0.8); stroke(1.8, GOLD, 0.5); stroke(5, GOLD_D, 0.4); }
    },
  };
}

/** The archipelago galley: long and low, a row of oars, two lateen sails, blue-and-yellow strakes. */
function galley(ctx: Ctx, x: number, y: number) {
  const w = 19;
  const top = (t: number) => y - 3.6 - (t < 0 ? Math.pow(-t, 4) * 2.4 : Math.pow(t, 3) * 1.6);
  const h = hull(ctx, x, y, w, top, 'galley');
  line(ctx, x - 2, y - 3, x - 2, y - 24, WOOD_D, 1);
  line(ctx, x + 9, y - 3, x + 9.4, y - 19, WOOD_D, 0.9);
  lateen(ctx, x - 2, y - 10, 13, 16);
  lateen(ctx, x + 9, y - 8, 10, 12);
  pennant(ctx, x - 2, y - 25, 9);
  h.draw();
  // the oars, dipping in a row
  for (let i = 0; i < 7; i++) {
    const t = -0.7 + i * 0.22, ox = x + t * w, oy = top(t) + 0.6;
    line(ctx, ox, oy, ox - 3.4, y + 3.4, WOOD_L, 0.6);
    ellipse(ctx, ox - 3.6, y + 3.6, 0.9, 0.4, 'rgba(255,255,255,0.6)');
  }
  // a small poop with an awning, the flag astern
  box(ctx, x - w * 0.78, y - 3.8, 6, 2.4, '#8a5a30', '#a87a48');
  poly(ctx, [x - w * 0.78 - 3.4, y - 8.4, x - w * 0.78 + 3, y - 8.8, x - w * 0.78 + 3.4, y - 6, x - w * 0.78 - 3, y - 5.6], FLAG_BLUE);
  line(ctx, x - w - 0.6, top(-1), x - w - 2.6, top(-1) - 9, WOOD_D, 0.7);
  flag(ctx, x - w - 2.6, top(-1) - 9, 6, 4, 0.4);
  figure(ctx, 'warrior', 'sweden', x + 3, y - 6, 0.34, true);
  figure(ctx, 'carolean', 'sweden', x - 6, y - 6, 0.34, true);
  foam(ctx, x, y + 3.2, w * 0.86);
}

/** The fluyt: a pear-bellied Baltic cargo hull, narrow high stern with a round tuck, three masts, the flag astern. */
function fluyt(ctx: Ctx, x: number, y: number) {
  const w = 21;
  const top = (t: number) => y - 5.4 - (t < 0 ? Math.pow(-t, 3) * 6 : Math.pow(t, 2.2) * 2.6);
  const h = hull(ctx, x, y, w, top, 'fluyt');
  line(ctx, x + 1, y - 5, x + 1, y - 37, WOOD_D, 1.2);
  line(ctx, x + 12, y - 6, x + 12.4, y - 30, WOOD_D, 1);
  line(ctx, x - 11, y - 7, x - 11, y - 25, WOOD_D, 0.9);
  for (const [a, b, c, d] of [[x - 19, y - 9, x + 1, y - 36], [x + 22, y - 8, x + 12.4, y - 29], [x + 22, y - 8, x + 1, y - 36]] as const) line(ctx, a, b, c, d, 'rgba(60,40,24,0.5)', 0.4);
  lateen(ctx, x - 11, y - 13, 10, 10);
  squareSail(ctx, x + 1, y - 35, 12, 8);
  squareSail(ctx, x + 1, y - 25, 17, 12, true);
  squareSail(ctx, x + 12.3, y - 28, 9, 6);
  squareSail(ctx, x + 12.3, y - 20, 13, 9, true);
  pennant(ctx, x + 1, y - 38.4, 10);
  pennant(ctx, x + 12.4, y - 31.4, 7);
  h.draw();
  // the narrow high stern with a small gilt window frame, the flag on its staff
  const sx = x - w * 0.82, sy = top(-0.82);
  poly(ctx, [sx - 2.6, sy + 1, sx + 3.4, sy + 1.6, sx + 3, sy - 4, sx - 2.2, sy - 5.4], '#7a4e2c');
  poly(ctx, [sx - 1, sy - 1.6, sx + 1.6, sy - 1.2, sx + 1.6, sy - 3.4, sx - 1, sy - 3.8], GOLD_D);
  poly(ctx, [sx - 0.6, sy - 1.9, sx + 1.2, sy - 1.6, sx + 1.2, sy - 3.1, sx - 0.6, sy - 3.4], '#f0c860');
  line(ctx, sx - 2.4, sy - 5, sx - 4, sy - 15, WOOD_D, 0.8);
  flag(ctx, sx - 4, sy - 15, 7.4, 4.8, 0.5);
  figure(ctx, 'archer', 'sweden', x + 5, y - 7.4, 0.34, true);
  line(ctx, x + w * 0.9, top(0.9) - 2, x + w + 7, top(1) - 8, WOOD_D, 0.9); // the bowsprit
  line(ctx, x - w + 1.4, top(-1) + 2, x - w - 1.4, y + 4.4, WOOD, 1.1);
  foam(ctx, x, y + 3.2, w * 0.86);
}

/** The royal warship Vasa: a tall dark hull with two tiers of red gunports, a towering stern carved and gilded with the
 *  royal arms, a gilt lion at the beak, three masts, the triple-tongued war flag astern and pennants at every masthead. */
function vasa(ctx: Ctx, x: number, y: number) {
  const w = 27;
  const top = (t: number) => y - 6 - (t < 0 ? Math.pow(-t, 2.2) * 8 : Math.pow(t, 3) * 2.6);
  const h = hull(ctx, x, y, w, top, 'vasa');
  line(ctx, x + 1, y - 5, x + 1, y - 49, WOOD_D, 1.4);
  line(ctx, x + 14, y - 6, x + 14.4, y - 39, WOOD_D, 1.1);
  line(ctx, x - 13, y - 8, x - 13, y - 35, WOOD_D, 1);
  for (const [a, b, c, d] of [[x - 26, y - 10, x + 1, y - 48], [x + 31, y - 9, x + 14.4, y - 38], [x + 31, y - 9, x + 1, y - 48], [x - 26, y - 10, x - 13, y - 34]] as const) line(ctx, a, b, c, d, 'rgba(60,40,24,0.55)', 0.4);
  ellipse(ctx, x + 1, y - 37, 2.4, 1, '#3a2418');
  ellipse(ctx, x + 14.2, y - 28, 2, 0.9, '#3a2418');
  lateen(ctx, x - 13, y - 19, 12, 12);
  squareSail(ctx, x - 13, y - 33, 8, 6);
  squareSail(ctx, x + 1, y - 46, 13, 8);
  squareSail(ctx, x + 1, y - 35, 21, 14, true);
  squareSail(ctx, x + 14.2, y - 36, 10, 7);
  squareSail(ctx, x + 14, y - 27, 14, 10, true);
  pennant(ctx, x + 1, y - 50.6, 14, 0.8);
  pennant(ctx, x + 14.4, y - 40.4, 10);
  pennant(ctx, x - 13, y - 36.4, 9);
  h.draw();
  // two tiers of gunports, the lids painted red, the guns run out
  for (const [row, n, t0] of [[3.4, 7, -0.55], [6.8, 6, -0.45]] as const) {
    for (let i = 0; i < n; i++) {
      const t = t0 + i * 0.19, px = x + t * w, py = top(t) + row;
      if (py > y - 1.4) continue;
      poly(ctx, [px - 1.2, py - 1, px + 1.2, py - 1, px + 1.2, py + 1, px - 1.2, py + 1], '#0e0a08');
      poly(ctx, [px - 1.2, py - 1.7, px + 1.2, py - 1.7, px + 1.2, py - 1, px - 1.2, py - 1], '#c42a20');
      ellipse(ctx, px, py - 1.35, 0.3, 0.3, GOLD); // a gilt lion mask on the lid
      line(ctx, px + 0.2, py, px + 1.7, py + 0.7, '#2a2a30', 0.9);
    }
  }
  // the towering stern: tiers of galleries and carvings in gold and red, the arms of Sweden at the top
  const sx = x - w * 0.86, sy = top(-0.86);
  poly(ctx, [sx - 4, sy + 2, sx + 6, sy + 3, sx + 6.6, sy - 10, sx + 2, sy - 15.4, sx - 3.4, sy - 13.6], '#3a2818');
  poly(ctx, [sx - 3.4, sy - 13.6, sx + 2, sy - 15.4, sx + 6.6, sy - 10, sx + 4, sy - 11.2, sx + 1.6, sy - 13, sx - 2.6, sy - 11.6], GOLD);
  for (const [v, c] of [[-2, GOLD], [-6, '#b02a20'], [-9.4, GOLD]] as const) line(ctx, sx - 3.6, sy + v, sx + 6.2, sy + v + 0.6, c, 0.9);
  for (let i = 0; i < 4; i++) { // the gallery windows, lit
    const wx = sx - 2 + i * 2.2;
    poly(ctx, [wx, sy - 3.4, wx + 1.4, sy - 3.3, wx + 1.4, sy - 5, wx, sy - 5.1], '#f0c860');
    poly(ctx, [wx + 0.2, sy - 7.2, wx + 1.4, sy - 7.1, wx + 1.4, sy - 8.6, wx + 0.2, sy - 8.7], '#f0c860');
  }
  ellipse(ctx, sx + 1.4, sy - 12, 2, 1.6, FLAG_BLUE); // the royal arms: a blue shield with the Three Crowns
  threeCrowns(ctx, sx + 1.4, sy - 11.6, 0.42);
  for (const [d, c] of [[-3.8, GOLD_L], [6.6, GOLD_L]] as const) ellipse(ctx, sx + d, sy - 11, 0.9, 2, c); // carved figures at the corners
  for (const d of [-1, 1]) { // stern lanterns
    const lx = sx + 1.4 + d * 3.4, ly = sy - 18;
    line(ctx, lx, ly + 2.6, lx, ly + 1, '#3a2a20', 0.5);
    ellipse(ctx, lx, ly, 1, 1.4, '#ffd060');
    ellipse(ctx, lx, ly - 1.4, 0.8, 0.4, GOLD_D);
  }
  line(ctx, sx - 3, sy - 13, sx - 5, sy - 26, WOOD_D, 0.9);
  flag(ctx, sx - 5, sy - 26, 9, 6, 0.8, true);
  figure(ctx, 'carolean', 'sweden', x - 6, y - 9.6, 0.34, true);
  figure(ctx, 'archer', 'sweden', x + 8, y - 8.6, 0.34, true);
  // the beak-head with the gilt lion leaping at the bow, the bowsprit and spritsail
  poly(ctx, [x + w * 0.9, top(0.9) + 1, x + w + 5.4, top(1) + 1.6, x + w + 5, top(1) + 3, x + w * 0.88, top(0.88) + 4], '#3a2818');
  ellipse(ctx, x + w + 4.8, top(1) + 0.8, 1.6, 1.3, GOLD);
  ellipse(ctx, x + w + 5.8, top(1) - 0.2, 0.9, 0.9, GOLD_L);
  line(ctx, x + w + 3.6, top(1) + 1.4, x + w + 6.4, top(1) + 2.6, GOLD, 0.6);
  line(ctx, x + w * 0.9, top(0.9) - 2, x + w + 9, top(1) - 10, WOOD_D, 1);
  squareSail(ctx, x + w + 5.4, top(1) - 6, 6, 4);
  line(ctx, x - w + 1.4, top(-1) + 2, x - w - 1.6, y + 4.6, WOOD, 1.2);
  foam(ctx, x, y + 3.2, w * 0.88);
}

function ship(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  if (kind === 'boat') galley(ctx, x, y);
  else if (kind === 'ship') fluyt(ctx, x, y);
  else vasa(ctx, x, y);
}

// ---------------------------------------------------------------- buildings

/** A gabled roof with the gable end facing right, over a box (x, y, w) whose walls top out at y. */
function gable(ctx: Ctx, x: number, y: number, w: number, rh: number, c: string, gableC: string, over = 1.2) {
  const hw = w / 2, hh = w / 4;
  const L0: [number, number] = [x - hw - over, y + over * 0.5], F0: [number, number] = [x, y + hh + over * 0.5], R0: [number, number] = [x + hw + over, y - over * 0.5], B0: [number, number] = [x, y - hh];
  const ridgeA: [number, number] = [(L0[0] + B0[0]) / 2, (L0[1] + B0[1]) / 2 - rh], ridgeB: [number, number] = [(F0[0] + R0[0]) / 2, (F0[1] + R0[1]) / 2 - rh];
  poly(ctx, [x, y + hh, x + hw, y, ridgeB[0], ridgeB[1] + 0.6], gableC);
  poly(ctx, [B0[0], B0[1] - 0.4, R0[0], R0[1], ridgeB[0], ridgeB[1], ridgeA[0], ridgeA[1]], shade(c, -0.25));
  poly(ctx, [L0[0], L0[1], F0[0], F0[1], ridgeB[0], ridgeB[1], ridgeA[0], ridgeA[1]], c);
  line(ctx, ridgeA[0], ridgeA[1], ridgeB[0], ridgeB[1], shade(c, -0.35), 0.7);
  return { ridgeA, ridgeB, L0, F0, R0 };
}

/** A white-framed window with a cross of glazing bars on a face. */
function win(ctx: Ctx, f: 'L' | 'R', x: number, y: number, w: number, h: number, u: number, v: number, du = 0.16, dv = 0.22) {
  faceQuad(ctx, f, x, y, w, h, u - 0.03, u + du + 0.03, v - 0.04, v + dv + 0.04, WHITE);
  faceQuad(ctx, f, x, y, w, h, u, u + du, v, v + dv, GLASS);
  faceLine(ctx, f, x, y, w, h, u + du / 2, v, u + du / 2, v + dv, WHITE, 0.35);
  faceLine(ctx, f, x, y, w, h, u, v + dv * 0.55, u + du, v + dv * 0.55, WHITE, 0.35);
}

/** A falu-red timber cottage: board walls, white corner boards and window frames, a dark tarred-tile (or turf) roof. */
function stuga(ctx: Ctx, x: number, y: number, w: number, h: number, roofC: string, turf: boolean) {
  box(ctx, x, y, w, h, FALU, '#b84a3a');
  band(ctx, x, y, w, h, 0, 0.1, '#6a6460'); // a stone plinth
  for (const f of ['L', 'R'] as const) {
    for (let i = 1; i < 7; i++) faceQuad(ctx, f, x, y, w, h, i / 7, i / 7 + 0.012, 0.1, 1, FALU_D); // the vertical boards
    faceQuad(ctx, f, x, y, w, h, 0, 0.07, 0.1, 1, WHITE); // white corners
    faceQuad(ctx, f, x, y, w, h, 0.93, 1, 0.1, 1, WHITE);
  }
  win(ctx, 'L', x, y, w, h, 0.3, 0.42);
  win(ctx, 'R', x, y, w, h, 0.62, 0.42);
  faceQuad(ctx, 'R', x, y, w, h, 0.2, 0.42, 0.1, 0.78, WHITE); // the door in its white frame
  faceQuad(ctx, 'R', x, y, w, h, 0.23, 0.39, 0.1, 0.74, '#3a5a8a');
  const r = gable(ctx, x, y - h, w, w * 0.36, turf ? '#5a7a3a' : roofC, FALU);
  // white barge boards along the gable
  line(ctx, x, y - h + w / 4, r.ridgeB[0], r.ridgeB[1] + 0.4, WHITE, 0.6);
  line(ctx, x + w / 2, y - h, r.ridgeB[0], r.ridgeB[1] + 0.4, WHITE, 0.6);
  win(ctx, 'R', x, y - h, w, w * 0.36, 0.4, 0.06, 0.2, 0.36);
  if (turf) for (let i = 0; i < 7; i++) { const t = rand(Math.round(x * 3 + y), i); const [px, py] = [r.L0[0] + (r.ridgeB[0] - r.L0[0]) * t, r.L0[1] + (r.ridgeB[1] - r.L0[1]) * t * 0.8]; ellipse(ctx, px, py - 1, 0.6, 0.4, i % 3 ? '#7a9a4a' : '#f0e070'); } // grass and buttercups on the turf
  // a white-washed chimney
  const cx = r.ridgeA[0] + 2, cy = r.ridgeA[1] + 2.2;
  box(ctx, cx, cy, 2, 3.2, WHITE);
  band(ctx, cx, cy, 2, 3.2, 0.82, 1, '#4a4a50');
}

/** A broken-hipped säteri roof (a lower hip, a short upright step, an upper hip) in green copper over a box at (x, y). */
function sateriRoof(ctx: Ctx, x: number, y: number, w: number, r1: number, r2: number, c = COPPER) {
  const hw = w / 2 + 0.8, hh = w / 4 + 0.4, s = 0.62, iy = y - r1;
  poly(ctx, [x - hw, y, x, y + hh, x, iy + hh * s, x - hw * s, iy], shade(c, 0.1));
  poly(ctx, [x, y + hh, x + hw, y, x + hw * s, iy, x, iy + hh * s], shade(c, -0.22));
  line(ctx, x - hw, y, x, y + hh, shade(c, 0.35), 0.5);
  line(ctx, x, y + hh, x + hw, y, shade(c, -0.4), 0.5);
  box(ctx, x, iy + 0.2, w * s + 1, 1.4, shade(c, -0.12));
  roof(ctx, x, iy - 1.2, w * s + 1.2, r2, c);
  for (const t of [0.3, 0.6]) line(ctx, x - hw + hw * t * 0.4, y - r1 * t, x - hw * s + (hw - hw * s) * (1 - t), y - r1 * t + 0.4, 'rgba(255,255,255,0.12)', 0.3);
}

/** An ochre stone town house of Gamla stan: white-framed sash windows, a copper säteri roof with a chimney. */
function stonehouse(ctx: Ctx, x: number, y: number, w: number, h: number, wall: string) {
  box(ctx, x, y, w, h, wall);
  band(ctx, x, y, w, h, 0, 0.1, STONE);
  band(ctx, x, y, w, h, 0.94, 1, WHITE);
  for (const f of ['L', 'R'] as const) {
    for (const u of [0.18, 0.58]) for (const v of [0.24, 0.6]) win(ctx, f, x, y, w, h, u, v, 0.18, 0.22);
    faceQuad(ctx, f, x, y, w, h, 0, 0.06, 0.1, 0.94, shade(wall, 0.18)); // quoins
  }
  faceQuad(ctx, 'R', x, y, w, h, 0.38, 0.56, 0.1, 0.42, '#5a3a22');
  sateriRoof(ctx, x, y - h, w, 3, 3.4);
  box(ctx, x - w * 0.18, y - h - 2.8, 1.8, 3.6, '#c8b8a0');
}

/** A white country church: a whitewashed nave under a dark shingle roof, a west tower with a lantern and a tall green
 *  copper spire, gold ball and cross. */
function church(ctx: Ctx, x: number, y: number) {
  box(ctx, x - 1, y + 1, 15, 7.4, '#f2eee4', '#e6e0d2');
  for (let i = 0; i < 3; i++) {
    faceQuad(ctx, 'L', x - 1, y + 1, 15, 7.4, 0.14 + i * 0.3, 0.24 + i * 0.3, 0.3, 0.76, GLASS);
    const [ax, ay] = fp('L', x - 1, y + 1, 15, 7.4, 0.19 + i * 0.3, 0.76);
    ellipse(ctx, ax, ay, 0.75, 0.5, GLASS);
  }
  faceQuad(ctx, 'R', x - 1, y + 1, 15, 7.4, 0.4, 0.6, 0.3, 0.78, GLASS);
  const r = gable(ctx, x - 1, y - 6.4, 15, 6.4, TAR, '#f2eee4', 0.8);
  for (let i = 1; i < 5; i++) { const t = i / 5; line(ctx, r.L0[0] + (r.ridgeA[0] - r.L0[0]) * t, r.L0[1] + (r.ridgeA[1] - r.L0[1]) * t, r.F0[0] + (r.ridgeB[0] - r.F0[0]) * t, r.F0[1] + (r.ridgeB[1] - r.F0[1]) * t, shade(TAR, 0.18), 0.3); } // shingle courses
  // the west tower
  const tx = x - 8.6, ty = y - 1.4, tw = 6.6, th = 17;
  box(ctx, tx, ty, tw, th, '#f2eee4', '#e6e0d2');
  for (const f of ['L', 'R'] as const) {
    faceQuad(ctx, f, tx, ty, tw, th, 0.34, 0.66, 0.74, 0.9, '#2a2a30');
    const [ax, ay] = fp(f, tx, ty, tw, th, 0.5, 0.9);
    ellipse(ctx, ax, ay, tw * 0.08, 0.6, '#2a2a30');
  }
  faceQuad(ctx, 'R', tx, ty, tw, th, 0.36, 0.64, 0, 0.18, '#4a2a1a');
  // the copper helm: a bell-shaped cap, an open lantern, and the needle spire
  const top = ty - th;
  ctx.beginPath();
  ctx.moveTo(tx - tw / 2 - 0.4, top);
  ctx.quadraticCurveTo(tx - tw * 0.36, top - 4, tx - 1.2, top - 4.4);
  ctx.lineTo(tx + 1.2, top - 4.4);
  ctx.quadraticCurveTo(tx + tw * 0.36, top - 4, tx + tw / 2 + 0.4, top);
  ctx.lineTo(tx, top + tw / 4 + 0.4);
  ctx.closePath();
  ctx.fillStyle = ink(COPPER);
  ctx.fill();
  poly(ctx, [tx, top + tw / 4 + 0.4, tx + tw / 2 + 0.4, top, tx + 1.2, top - 4.4, tx + 0.2, top - 4.2], COPPER_D);
  ellipse(ctx, tx - tw * 0.2, top - 1.6, 0.6, 1.2, COPPER_L);
  box(ctx, tx, top - 4.2, 2.6, 2.6, COPPER_D);
  faceQuad(ctx, 'R', tx, top - 4.2, 2.6, 2.6, 0.3, 0.7, 0.2, 0.8, '#1a2a24');
  poly(ctx, [tx - 1.4, top - 7.2, tx, top - 21, tx + 0.1, top - 6.4], COPPER);
  poly(ctx, [tx + 0.1, top - 6.4, tx, top - 21, tx + 1.4, top - 7.2], COPPER_D);
  ellipse(ctx, tx, top - 21.4, 0.7, 0.7, GOLD);
  line(ctx, tx, top - 22, tx, top - 25, GOLD, 0.5);
  line(ctx, tx - 0.9, top - 24, tx + 0.9, top - 24, GOLD, 0.5);
  // a churchyard birch and a wooden cross
  line(ctx, x + 9.6, y + 6, x + 9.8, y - 2, '#f2f0ea', 0.9);
  for (let i = 0; i < 3; i++) line(ctx, x + 9.2, y + 4 - i * 2.4, x + 9.9, y + 3.8 - i * 2.4, '#2a2420', 0.4);
  ellipse(ctx, x + 9.8, y - 3.4, 2.6, 3.2, '#5a9a3a');
  ellipse(ctx, x + 9.2, y - 4.2, 1.2, 1.4, '#7aba4a');
}

/** A round tower with a copper cone (or onion) roof and a gilt vane. */
function roundTower(ctx: Ctx, x: number, y: number, r: number, h: number, wall: string, onion = false) {
  ellipse(ctx, x, y, r, r * 0.5, shade(wall, -0.2));
  poly(ctx, [x - r, y, x - r, y - h, x + r, y - h, x + r, y], wall);
  poly(ctx, [x + r * 0.2, y + r * 0.5, x + r * 0.2, y - h, x + r, y - h, x + r, y], shade(wall, -0.16));
  ellipse(ctx, x - r * 0.3, y - h * 0.55, 0.45, 0.9, GLASS);
  const cy = y - h;
  if (onion) {
    ctx.beginPath();
    ctx.moveTo(x - r - 0.3, cy);
    ctx.bezierCurveTo(x - r * 1.5, cy - r * 1.4, x - r * 0.2, cy - r * 1.6, x, cy - r * 2.8);
    ctx.bezierCurveTo(x + r * 0.2, cy - r * 1.6, x + r * 1.5, cy - r * 1.4, x + r + 0.3, cy);
    ctx.closePath();
    ctx.fillStyle = ink(COPPER);
    ctx.fill();
    poly(ctx, [x + 0.2, cy - r * 2.6, x + r + 0.3, cy, x + 0.4, cy + r * 0.4], COPPER_D);
    ellipse(ctx, x - r * 0.5, cy - r * 0.9, r * 0.22, r * 0.45, COPPER_L);
    line(ctx, x, cy - r * 2.8, x, cy - r * 3.8, GOLD, 0.5);
    ellipse(ctx, x, cy - r * 3.9, 0.5, 0.5, GOLD);
  } else {
    ellipse(ctx, x, cy, r + 0.3, (r + 0.3) * 0.5, COPPER_D);
    poly(ctx, [x - r - 0.4, cy, x, cy - r * 2.6, x + r + 0.4, cy, x, cy + r * 0.5], COPPER);
    poly(ctx, [x + 0.2, cy - r * 2.6, x + r + 0.4, cy, x + 0.2, cy + r * 0.5], COPPER_D);
    line(ctx, x, cy - r * 2.6, x, cy - r * 3.4, GOLD_D, 0.5);
    poly(ctx, [x, cy - r * 3.4, x + 1.6, cy - r * 3.2, x, cy - r * 2.9], GOLD);
  }
}

/** The capital: the castle of Tre Kronor on its island: pale stone wings under copper säteri roofs, round corner towers,
 *  and the great central keep whose copper spire bears the three gold crowns; a church spire behind, the flag flying. */
function treKronor(ctx: Ctx, x: number, y: number) {
  ellipse(ctx, x, y + 7, 28, 8, 'rgba(0,0,0,0.14)');
  // the church of the court behind, to the left: just its copper spire showing
  const cx0 = x - 17, cy0 = y - 6;
  box(ctx, cx0, cy0, 5, 14, '#f2eee4');
  poly(ctx, [cx0 - 2.8, cy0 - 14, cx0, cy0 - 31, cx0 + 0.1, cy0 - 13], COPPER);
  poly(ctx, [cx0 + 0.1, cy0 - 13, cx0, cy0 - 31, cx0 + 2.8, cy0 - 14], COPPER_D);
  line(ctx, cx0, cy0 - 31, cx0, cy0 - 34, GOLD, 0.5);
  // the wings: a long low range round a court
  box(ctx, x - 1, y + 3, 30, 8, STONE_L, '#f4f0e6');
  for (const f of ['L', 'R'] as const) for (let i = 0; i < 6; i++) win(ctx, f, x - 1, y + 3, 30, 8, 0.06 + i * 0.16, 0.42, 0.07, 0.3);
  band(ctx, x - 1, y + 3, 30, 8, 0, 0.12, STONE);
  faceQuad(ctx, 'R', x - 1, y + 3, 30, 8, 0.44, 0.56, 0, 0.6, '#3a2a20'); // the gate
  sateriRoof(ctx, x - 1, y - 5, 30, 4, 4.6);
  for (const [d, h] of [[-16, 15], [14, 14], [-1, 13]] as const) roundTower(ctx, x + d, y + (d === -1 ? 11 : 4), 3, h, STONE_L, d === -1);
  // the great keep, rising from the middle of the court
  const kx = x - 1, ky = y - 6, kw = 9, kh = 20;
  box(ctx, kx, ky, kw, kh, '#e8e2d4');
  for (const f of ['L', 'R'] as const) {
    for (const v of [0.3, 0.58, 0.82]) win(ctx, f, kx, ky, kw, kh, 0.36, v, 0.28, 0.1);
    faceQuad(ctx, f, kx, ky, kw, kh, 0, 0.06, 0, 1, shade('#e8e2d4', 0.1));
  }
  band(ctx, kx, ky, kw, kh, 0.96, 1, STONE);
  // the copper helm: an onion, a lantern, a needle spire, and the three gold crowns on it
  const top = ky - kh;
  ctx.beginPath();
  ctx.moveTo(kx - kw / 2 - 0.4, top);
  ctx.bezierCurveTo(kx - kw * 0.75, top - 4, kx - 1.6, top - 5, kx - 1.2, top - 7);
  ctx.lineTo(kx + 1.2, top - 7);
  ctx.bezierCurveTo(kx + 1.6, top - 5, kx + kw * 0.75, top - 4, kx + kw / 2 + 0.4, top);
  ctx.lineTo(kx, top + kw / 4 + 0.4);
  ctx.closePath();
  ctx.fillStyle = ink(COPPER);
  ctx.fill();
  poly(ctx, [kx, top + kw / 4 + 0.4, kx + kw / 2 + 0.4, top, kx + 1.2, top - 7, kx + 0.2, top - 6.6], COPPER_D);
  ellipse(ctx, kx - kw * 0.22, top - 2, 0.9, 1.6, COPPER_L);
  box(ctx, kx, top - 6.8, 3, 3, COPPER_D);
  faceQuad(ctx, 'R', kx, top - 6.8, 3, 3, 0.3, 0.7, 0.2, 0.8, '#1a2a24');
  poly(ctx, [kx - 1.6, top - 9.8, kx, top - 30, kx + 0.1, top - 9], COPPER);
  poly(ctx, [kx + 0.1, top - 9, kx, top - 30, kx + 1.6, top - 9.8], COPPER_D);
  for (const [v, sz] of [[0, 2.4], [5, 2.1], [9.6, 1.8]] as const) crownMark(ctx, kx, top - 12.6 - v, sz); // the three crowns threaded on the spire
  line(ctx, kx, top - 30, kx, top - 32, GOLD, 0.5);
  // the flag of Sweden over the gate tower
  line(ctx, x + 14, y - 13, x + 14, y - 22, WOOD_D, 0.6);
  flag(ctx, x + 14, y - 22, 6.4, 4.2, 0.4);
}

function building(ctx: Ctx, x: number, y: number, big: boolean, roofC: string, capital: boolean) {
  if (big && capital) {
    ctx.save();
    ctx.translate(x, y + 2);
    ctx.scale(0.8, 0.8);
    treKronor(ctx, 0, 0);
    ctx.restore();
    return;
  }
  if (big) { church(ctx, x, y); return; }
  const v = ((Math.round(x) * 7 + Math.round(y) * 3) % 5 + 5) % 5;
  const dark = mix(roofC, '#2a2a30', 0.7);
  if (v === 0) stuga(ctx, x, y, 10, 6, dark, false);
  else if (v === 1) stonehouse(ctx, x, y, 9.4, 9, OCHRE);
  else if (v === 2) { stuga(ctx, x - 2.6, y - 1.4, 8, 5, dark, true); stuga(ctx, x + 4.6, y + 2.8, 6.4, 4.2, dark, false); }
  else if (v === 3) stonehouse(ctx, x, y, 9, 10, '#e2c08a');
  else stuga(ctx, x, y, 10.4, 6.4, dark, true);
}

// ---------------------------------------------------------------- trees

/** Lingonberry: low glossy tufts studded with red berries on the forest floor. */
function lingon(ctx: Ctx, x: number, y: number, k: number, seed: number) {
  for (let i = 0; i < 4; i++) {
    const dx = (rand(seed, i) - 0.5) * 9 * k, dy = (rand(seed + 1, i) - 0.3) * 2.4 * k;
    ellipse(ctx, x + dx, y + dy + 0.4 * k, 1.8 * k, 0.9 * k, '#1e4a26');
    ellipse(ctx, x + dx - 0.3 * k, y + dy, 1.4 * k, 0.7 * k, '#2e6a32');
    for (let j = 0; j < 3; j++) ellipse(ctx, x + dx + (j - 1) * 0.8 * k, y + dy - 0.2 * k + (j % 2) * 0.4 * k, 0.42 * k, 0.42 * k, '#d0202a');
  }
}

/** A grey granite boulder left by the ice, cushioned in moss. */
function boulder(ctx: Ctx, x: number, y: number, k: number) {
  ellipse(ctx, x, y + 0.6 * k, 3.6 * k, 1.4 * k, 'rgba(0,0,0,0.2)');
  ellipse(ctx, x, y - 1 * k, 3.4 * k, 2.4 * k, '#8a8a88');
  ellipse(ctx, x - 0.8 * k, y - 1.8 * k, 2 * k, 1.3 * k, '#aaa9a4');
  ellipse(ctx, x + 0.6 * k, y - 2.6 * k, 2.2 * k, 0.8 * k, '#6a8a3a');
}

/** The Norway spruce: a tall dark spire whose tiers hang down in skirts of drooping branchlets, cones at the top. */
function spruce(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, s = 1) {
  const g = shade(mix(P.forest, '#0e3a2a', 0.5), -0.04);
  line(ctx, x, y, x, y - 5 * k * s, '#4a3424', 1.7 * k * s);
  const tiers = 7;
  for (let i = 0; i < tiers; i++) {
    const by = y - (2.6 + i * 3.4) * k * s, hw = (7.4 - i * 0.98) * k * s, th = 5 * k * s;
    // a skirt: the branch line rises to the stem, then hangs in a curtain with a ragged hem
    ctx.beginPath();
    ctx.moveTo(x, by - th);
    ctx.quadraticCurveTo(x - hw * 0.6, by - th * 0.4, x - hw, by + 0.6 * k * s);
    for (let j = 0; j <= 5; j++) { const t = j / 5; ctx.lineTo(x - hw + hw * t, by + (j % 2 ? 1.6 : 0.6) * k * s); }
    ctx.closePath();
    ctx.fillStyle = ink(shade(g, 0.1));
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, by - th);
    ctx.quadraticCurveTo(x + hw * 0.6, by - th * 0.4, x + hw, by + 0.6 * k * s);
    for (let j = 0; j <= 5; j++) { const t = j / 5; ctx.lineTo(x + hw - hw * t, by + (j % 2 ? 1.6 : 0.6) * k * s); }
    ctx.closePath();
    ctx.fillStyle = ink(shade(g, -0.24));
    ctx.fill();
    curve(ctx, x, by - th + 0.6 * k * s, x - hw * 0.5, by - th * 0.4, x - hw * 0.92, by + 0.2 * k * s, 0.4 * k * s, shade(g, 0.3));
  }
  poly(ctx, [x - 0.7 * k * s, y - 25 * k * s, x, y - 29 * k * s, x + 0.7 * k * s, y - 25 * k * s], shade(g, -0.1));
  for (const [dx, dy] of [[1.6, -23], [-1.4, -21.6], [2.2, -19.8]] as const) ellipse(ctx, x + dx * k * s, y + dy * k * s, 0.5 * k * s, 1 * k * s, '#7a4a2a');
}

/** The Scots pine: a tall straight trunk, grey below and glowing orange above, umbrella crowns of blue-green needles. */
function pine(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  const lean = ((variant % 3) - 1) * 0.6 * k, tx = x + lean, ty = y - 25 * k;
  line(ctx, x, y, tx, ty, '#5a4434', 2.3 * k);
  line(ctx, x + lean * 0.35, y - 9 * k, tx, ty, '#d0703a', 1.6 * k);
  line(ctx, x + lean * 0.4 + 0.4 * k, y - 9 * k, tx + 0.4 * k, ty, '#f0a060', 0.4 * k);
  for (let i = 0; i < 3; i++) line(ctx, x - 0.9 * k, y - (1.6 + i * 2.6) * k, x + 0.9 * k, y - (2.2 + i * 2.6) * k, '#2e2018', 0.4 * k);
  curve(ctx, tx, ty + 7 * k, tx - 3 * k, ty + 5 * k, tx - 6.6 * k, ty + 5.6 * k, 0.8 * k, '#b0583a');
  curve(ctx, tx, ty + 3 * k, tx + 3 * k, ty + 1 * k, tx + 6.4 * k, ty + 1.4 * k, 0.8 * k, '#b0583a');
  const g = mix(P.forest, '#2a5a4a', 0.55);
  // two tiers of flat umbrella crowns
  for (const [dx, dy, rx, ry, c] of [[-6.2, 5, 3.6, 1.5, -0.12], [6.2, 0.8, 3.4, 1.4, -0.14], [-0.6, -0.8, 5.2, 1.9, -0.02], [1.6, -3, 3.8, 1.5, 0.06], [-3, 1.6, 3.2, 1.3, 0.02]] as const) {
    ellipse(ctx, tx + dx * k, ty + (dy + 0.8) * k, rx * k, ry * k, shade(g, c - 0.22));
    ellipse(ctx, tx + dx * k, ty + dy * k, rx * k, ry * k, shade(g, c));
    ellipse(ctx, tx + (dx - rx * 0.3) * k, ty + (dy - ry * 0.4) * k, rx * 0.5 * k, ry * 0.36 * k, shade(g, c + 0.16));
  }
}

/** The silver birch: a slim white trunk marked with black, a light crown already touched with autumn gold. */
function birch(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, seed: number, lean = 0.6) {
  const tx = x + lean * k, ty = y - 18 * k;
  curve(ctx, x, y, x + lean * 0.3 * k, y - 9 * k, tx, ty, 1.7 * k, '#c8c4b8');
  curve(ctx, x - 0.4 * k, y, x + lean * 0.3 * k - 0.4 * k, y - 9 * k, tx - 0.4 * k, ty, 0.8 * k, '#faf8f2');
  for (let i = 0; i < 7; i++) { const t = (i + 0.4) / 8, px = x + (tx - x) * t, py = y + (ty - y) * t; line(ctx, px - 0.8 * k, py, px + (0.2 + rand(seed, i) * 0.5) * k, py - 0.3 * k, '#2a2624', 0.5 * k); }
  curve(ctx, x + lean * 0.4 * k, y - 10 * k, x + 3 * k, y - 12 * k, x + 4 * k, y - 15 * k, 0.6 * k, '#d8d0c0');
  curve(ctx, x + lean * 0.5 * k, y - 12 * k, x - 2.6 * k, y - 14 * k, x - 3.8 * k, y - 17 * k, 0.6 * k, '#d8d0c0');
  const g = mix(P.forest, '#9ab84a', 0.62);
  for (const [dx, dy, rx, ry, c] of [[-3.4, -15.4, 3, 3.4, -0.1], [3.6, -15, 3, 3.2, -0.14], [0.4, -19, 3.6, 3.6, 0], [-0.8, -22.6, 2.6, 2.4, 0.08]] as const) {
    ellipse(ctx, tx - lean * k + dx * k, y + (dy + 1) * k, rx * k, ry * k, shade(g, c - 0.2));
    ellipse(ctx, tx - lean * k + dx * k, y + dy * k, rx * k, ry * k, shade(g, c));
  }
  for (let i = 0; i < 10; i++) { // leaves turning gold, and fine hanging twigs
    const a = rand(seed + 3, i) * Math.PI * 2, r = 1.4 + rand(seed + 5, i) * 4.4, px = tx - lean * k + Math.cos(a) * r * k, py = y - 18 * k + Math.sin(a) * r * 0.8 * k;
    ellipse(ctx, px, py, 0.6 * k, 0.45 * k, i % 3 ? '#e8c838' : '#c8d860');
    if (i % 2) line(ctx, px, py, px + 0.2 * k, py + 2 * k, shade(g, -0.25), 0.35 * k);
  }
}

function tree(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  const type = ['spruce', 'pine', 'birch', 'spruce', 'stand', 'pine', 'spruce', 'birch', 'pine'][variant % 9];
  if (variant % 4 === 1) boulder(ctx, x + 5.6 * k, y + 1.6 * k, k * 0.8);
  if (type === 'spruce') spruce(ctx, x, y, k, P);
  else if (type === 'pine') pine(ctx, x, y, k, P, variant);
  else if (type === 'birch') birch(ctx, x, y, k, P, variant);
  else { // a small stand: a young spruce behind a birch
    spruce(ctx, x - 3.4 * k, y - 1.4 * k, k, P, 0.72);
    birch(ctx, x + 2.6 * k, y + 0.8 * k, k * 0.86, P, variant + 7, -0.8);
  }
  if (variant % 3 !== 2) lingon(ctx, x - 1 * k, y + 1.4 * k, k, variant + 11);
}

// ---------------------------------------------------------------- whole units

function unit(ctx: Ctx, kind: UnitKind, x: number, y: number): boolean {
  switch (kind) {
    case 'archer': musketeer(ctx, x, y); return true;
    case 'carolean': carolean(ctx, x, y); return true;
    case 'rider': horseman(ctx, 'rider', x, y); return true;
    case 'knight': horseman(ctx, 'knight', x, y); return true;
    case 'catapult': leatherCannon(ctx, x, y); return true;
    case 'boat': case 'ship': case 'warship': ship(ctx, kind, x, y); return true;
    default: return false;
  }
}

registerArt('sweden', {
  unit,
  dress: (kind) => dress(kind),
  torso,
  face,
  head,
  weapon,
  shield: () => true, // no shields: Carolean pike and musket
  building,
  tree,
});

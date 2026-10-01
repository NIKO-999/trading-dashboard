// The Grand Principality of Rus: its own art (see render/tribeart).
// Kievan and Novgorodian Rus, tenth to thirteenth century: padded kaftans and fur-trimmed coats in madder red and
// brown, mail shirts (kolchuga) for the heavy ranks, tall pointed shishak helmets with a mail aventail and fur caps for
// the light troops, red teardrop shields painted with a gold sun or the trident-falcon, spears, narrow axes, sabres and
// recurve bows; the prince's druzhina on grey horses with red cloaks and lances; log izbas with carved window frames,
// wooden churches under onion domes, a kremlin tower and a gold-domed cathedral; river boats with shields on the gunwale;
// white birch and dark spruce.
import { drawHorse, figure } from '../units';
import { registerArt } from '../tribeart';
import type { Body } from '../tribeart';
import type { BiomePalette } from '../../data/tribes';
import type { UnitKind } from '../../game/types';
import { band, box, ellipse, faceQuad, ink, line, mix, poly, rand, shade } from '../prims';
import type { Ctx } from '../prims';

const RU_RED = '#a83228', RU_RED_D = '#6a1a14', RU_RED_L = '#c8483a';
const RU_BROWN = '#7a4a2a', RU_BROWN_D = '#4a2c18';
const RU_GOLD = '#e0b030', RU_GOLD_L = '#f6d870', RU_GOLD_D = '#a07818';
const RU_MAIL = '#8e949c', RU_MAIL_D = '#5a6068', RU_STEEL = '#c0c8d0', RU_STEEL_D = '#6e7680';
const RU_FUR = '#5a3e2a', RU_FUR_L = '#8a6a4a', RU_SABLE = '#3a2a20';
const RU_LINEN = '#efe6d2', RU_BLUE = '#2f4f8a', RU_GREEN = '#3f6a3a';
const RU_WOOD = '#8a6038', RU_WOOD_D = '#4e321c', RU_LOG = '#a2703e', RU_LOG_D = '#6a4424';
const RU_STONE = '#f2ede0', RU_HAIR = '#8a5a2a';

const MAIL_KINDS: UnitKind[] = ['defender', 'swordsman', 'knight', 'druzhina', 'giant'];
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

/** Rows of tiny mail rings over a box between heights v0 and v1: staggered dots, light above and dark below. */
function mail(ctx: Ctx, x: number, y: number, w: number, h: number, v0: number, v1: number, base: string, rows = 6) {
  band(ctx, x, y, w, h, v0, v1, base);
  const dv = (v1 - v0) / rows;
  for (let r = 0; r < rows; r++) {
    const v = v0 + (r + 0.5) * dv;
    for (let i = 0; i < 6; i++) {
      const u = (i + 0.25 + (r % 2) * 0.5) / 6.2;
      for (const f of ['L', 'R'] as const) {
        const [px, py] = pt(f, x, y, w, h, u, v);
        const s = w / 10;
        ellipse(ctx, px, py + 0.25 * s, 0.42 * s, 0.3 * s, shade(base, f === 'L' ? -0.3 : -0.45));
        ellipse(ctx, px, py - 0.1 * s, 0.32 * s, 0.22 * s, shade(base, f === 'L' ? 0.4 : 0.15));
      }
    }
  }
}

/** A teardrop (kite) outline: a round top with half-width w at (cx, ty), narrowing to a point at (cx, by). */
function teardrop(cx: number, ty: number, w: number, by: number): number[] {
  const pts: number[] = [];
  const ry = w * 0.55;
  for (let i = 0; i <= 10; i++) { const a = Math.PI + (i / 10) * Math.PI; pts.push(cx + Math.cos(a) * w, ty + Math.sin(a) * ry); }
  for (let i = 1; i <= 8; i++) { // the right side curving down to the point
    const t = i / 8, u = 1 - t;
    pts.push(u * u * (cx + w) + 2 * u * t * (cx + w * 0.86) + t * t * cx, u * u * ty + 2 * u * t * (ty + (by - ty) * 0.55) + t * t * by);
  }
  for (let i = 7; i >= 1; i--) { // and the left side back up
    const t = i / 8, u = 1 - t;
    pts.push(u * u * (cx - w) + 2 * u * t * (cx - w * 0.86) + t * t * cx, u * u * ty + 2 * u * t * (ty + (by - ty) * 0.55) + t * t * by);
  }
  return pts;
}

/** The trident-falcon of the princes: a stooping bird drawn as a gold trident with a hooked base. */
function trident(ctx: Ctx, cx: number, cy: number, s: number, c: string) {
  line(ctx, cx, cy - 3.2 * s, cx, cy + 2.6 * s, c, 0.9 * s); // the body and tail
  poly(ctx, [cx - 0.7 * s, cy - 3.2 * s, cx, cy - 4.6 * s, cx + 0.7 * s, cy - 3.2 * s], c); // the head
  for (const d of [-1, 1]) { // the wings sweep down and out, then up into the outer prongs
    curve(ctx, cx, cy + 1.6 * s, cx + d * 2.8 * s, cy + 2.4 * s, cx + d * 2.6 * s, cy - 3.4 * s, 0.85 * s, c);
    poly(ctx, [cx + d * 2.1 * s, cy - 3.2 * s, cx + d * 2.6 * s, cy - 4.4 * s, cx + d * 3.1 * s, cy - 3.2 * s], c);
  }
  line(ctx, cx - 1.6 * s, cy + 2.8 * s, cx + 1.6 * s, cy + 2.8 * s, c, 0.8 * s); // the base bar
  ellipse(ctx, cx, cy + 0.6 * s, 0.7 * s, 0.7 * s, c);
}

/** A gold sun: a disc and a ring of rays. */
function sun(ctx: Ctx, cx: number, cy: number, r: number, c: string) {
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, r1 = r * (i % 2 ? 1.5 : 1.85);
    poly(ctx, [cx + Math.cos(a - 0.16) * r * 0.9, cy + Math.sin(a - 0.16) * r * 0.9, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, cx + Math.cos(a + 0.16) * r * 0.9, cy + Math.sin(a + 0.16) * r * 0.9], c);
  }
  ellipse(ctx, cx, cy, r, r, c);
  ellipse(ctx, cx - r * 0.25, cy - r * 0.3, r * 0.4, r * 0.35, shade(c, 0.4));
}

type Motif = 'sun' | 'trident' | 'stripe' | 'plain';

/** A red teardrop shield on a wooden frame: an iron rim, a boss, and a painted sun, trident-falcon or stripe. */
function kite(ctx: Ctx, cx: number, ty: number, w: number, by: number, field: string, motif: Motif, k: number, ink2 = RU_GOLD) {
  poly(ctx, teardrop(cx + 0.8 * k, ty + 0.5 * k, w, by + 0.6 * k), RU_WOOD_D); // its thickness
  poly(ctx, teardrop(cx, ty, w, by), RU_STEEL_D); // the rim
  poly(ctx, teardrop(cx, ty + 0.3 * k, w - 0.7 * k, by - 1 * k), field);
  ctx.save();
  ctx.beginPath();
  const inner = teardrop(cx, ty + 0.3 * k, w - 0.7 * k, by - 1 * k);
  ctx.moveTo(inner[0], inner[1]);
  for (let i = 2; i < inner.length; i += 2) ctx.lineTo(inner[i], inner[i + 1]);
  ctx.closePath();
  ctx.clip();
  poly(ctx, [cx - w, ty - w, cx, ty - w, cx, by, cx - w, by], shade(field, 0.12)); // the lit left half
  if (motif === 'stripe') { // a white band down the middle and a gold chevron
    poly(ctx, [cx - 1 * k, ty - w, cx + 1 * k, ty - w, cx + 1 * k, by, cx - 1 * k, by], RU_LINEN);
    poly(ctx, [cx - w, ty + 3 * k, cx, ty + 6.4 * k, cx + w, ty + 3 * k, cx + w, ty + 4.6 * k, cx, ty + 8 * k, cx - w, ty + 4.6 * k], RU_GOLD);
  }
  ctx.restore();
  if (motif === 'sun') sun(ctx, cx, ty + (by - ty) * 0.24, 1.5 * k, ink2);
  if (motif === 'trident') trident(ctx, cx, ty + (by - ty) * 0.3, 0.95 * k, ink2);
  if (motif === 'plain' || motif === 'stripe') { // an iron boss
    ellipse(ctx, cx, ty + 1.4 * k, 1.5 * k, 1.3 * k, RU_STEEL_D);
    ellipse(ctx, cx - 0.3 * k, ty + 1.1 * k, 1 * k, 0.8 * k, RU_STEEL);
  }
  for (let i = 0; i < 7; i++) { const a = Math.PI + ((i + 0.5) / 7) * Math.PI; ellipse(ctx, cx + Math.cos(a) * (w - 0.35 * k), ty + Math.sin(a) * (w - 0.35 * k) * 0.55, 0.32 * k, 0.32 * k, RU_GOLD_L); } // rim nails
  line(ctx, cx - w * 0.55, ty - w * 0.35, cx - w * 0.75, ty + (by - ty) * 0.3, 'rgba(255,255,255,0.25)', 0.8 * k); // a sheen
}

// ---------------------------------------------------------------- dress

/** [torso, legs, sleeves]: a kaftan or padded coat in red or brown, a mail shirt for the heavy ranks. */
function dress(kind: UnitKind): [string, string, string] {
  switch (kind) {
    case 'warrior': return [RU_BROWN, '#5a4a3c', RU_BROWN];
    case 'archer': return [RU_RED, '#4a4658', RU_RED];
    case 'rider': return ['#9a3a26', '#4a4658', '#9a3a26'];
    case 'explorer': return ['#6a4a30', '#5a4a3c', '#6a4a30'];
    case 'defender': return [RU_MAIL, '#4a3a2e', RU_MAIL];
    case 'swordsman': return [RU_MAIL, RU_RED_D, RU_MAIL];
    case 'knight': case 'druzhina': return [RU_MAIL, RU_RED_D, RU_MAIL];
    case 'giant': return [RU_MAIL, RU_RED_D, RU_RED];
    default: return [RU_RED, '#4a4658', RU_RED];
  }
}

/** Embroidered red-and-white bands, the kaftan's sash and fur trim, or the mail shirt over a red under-coat. */
function torso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const k = w / 10;
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const Lf = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'L', x, y, w, h, u0, u1, v0, v1, c);
  const B = (v0: number, v1: number, c: string) => band(ctx, x, y, w, h, v0, v1, c);
  if (isMail(kind)) {
    const under = kind === 'defender' ? RU_BROWN : RU_RED;
    B(0, 0.2, under); // the coat's hem below the mail
    B(0, 0.05, RU_GOLD);
    mail(ctx, x, y, w, h, 0.2, 0.9, kind === 'giant' || kind === 'druzhina' ? shade(RU_MAIL, 0.1) : RU_MAIL, 6);
    B(0.18, 0.24, shade(RU_MAIL, -0.35)); // the mail's ragged lower edge
    B(0.3, 0.38, RU_BROWN_D); // a leather belt with gilt mounts
    for (const u of [0.12, 0.38, 0.64, 0.88]) { R(u, u + 0.07, 0.31, 0.37, RU_GOLD); Lf(u, u + 0.07, 0.31, 0.37, RU_GOLD); }
    R(0.4, 0.56, 0.29, 0.39, RU_GOLD_L); // the buckle
    if (kind === 'druzhina' || kind === 'knight' || kind === 'giant') { // a chest plate of gilt scales over the mail
      for (let r = 0; r < 3; r++) for (let i = 0; i < 3; i++) {
        const [px, py] = pt('R', x, y, w, h, 0.22 + i * 0.2 + (r % 2) * 0.1, 0.78 - r * 0.12);
        ellipse(ctx, px, py, 1 * k, 0.75 * k, r % 2 ? RU_GOLD_D : RU_GOLD);
        ellipse(ctx, px - 0.2 * k, py - 0.2 * k, 0.45 * k, 0.3 * k, RU_GOLD_L);
      }
    }
    if (kind === 'giant') { B(0.86, 1, RU_SABLE); for (const u of [0.1, 0.35, 0.6, 0.85]) { R(u, u + 0.08, 0.88, 1, RU_FUR_L); Lf(u, u + 0.08, 0.88, 1, RU_FUR_L); } } // a sable collar
    else B(0.9, 1, under); // the coat's collar at the neck
    return;
  }
  const coat = dress(kind)[0];
  if (kind === 'warrior') { // the stegach: a quilted coat, stitched in vertical rows
    for (const u of [0.12, 0.3, 0.48, 0.66, 0.84]) { R(u, u + 0.03, 0.06, 0.9, shade(coat, -0.32)); Lf(u, u + 0.03, 0.06, 0.9, shade(coat, -0.28)); }
    for (const v of [0.5, 0.7]) B(v, v + 0.025, shade(coat, -0.22));
  }
  // an embroidered hem: a red-and-white band with a row of little lozenges
  const hem = kind === 'archer' || kind === 'rider' ? RU_LINEN : RU_RED;
  B(0, 0.12, hem);
  for (let i = 0; i < 5; i++) { R(0.06 + i * 0.2, 0.14 + i * 0.2, 0.03, 0.09, hem === RU_LINEN ? RU_RED : RU_LINEN); Lf(0.06 + i * 0.2, 0.14 + i * 0.2, 0.03, 0.09, hem === RU_LINEN ? RU_RED : RU_LINEN); }
  if (kind === 'explorer') { B(0, 0.14, RU_FUR_L); for (const u of [0.1, 0.35, 0.6, 0.85]) { R(u, u + 0.07, 0.02, 0.14, RU_FUR); Lf(u, u + 0.07, 0.02, 0.14, RU_FUR); } } // the sheepskin coat's fleece hem
  // the side-fastened collar (kosovorotka): the opening runs down from the neck on the near side, edged in embroidery
  facePoly(ctx, x, y, w, h, [[0.56, 1], [0.7, 1], [0.7, 0.5], [0.56, 0.5]], shade(coat, -0.22));
  R(0.68, 0.74, 0.5, 1, RU_GOLD);
  for (const v of [0.58, 0.72, 0.86]) { const [bx, by] = pt('R', x, y, w, h, 0.71, v); ellipse(ctx, bx, by, 0.5 * k, 0.5 * k, RU_GOLD_L); } // gilt buttons
  B(0.88, 1, kind === 'explorer' ? RU_FUR_L : RU_LINEN); // a standing collar, embroidered
  if (kind !== 'explorer') for (let i = 0; i < 5; i++) { R(0.05 + i * 0.2, 0.12 + i * 0.2, 0.9, 0.98, RU_RED); Lf(0.05 + i * 0.2, 0.12 + i * 0.2, 0.9, 0.98, RU_RED); }
  // the woven sash (poyas), tied at the side with fringed ends
  const sash = kind === 'warrior' ? RU_RED : kind === 'archer' ? RU_GOLD : kind === 'rider' ? RU_GREEN : kind === 'explorer' ? RU_RED : RU_BLUE;
  B(0.3, 0.4, sash);
  B(0.34, 0.36, shade(sash, 0.35));
  const [kx, ky] = pt('L', x, y, w, h, 0.62, 0.34);
  poly(ctx, [kx - 0.8 * k, ky, kx + 0.6 * k, ky + 0.3 * k, kx + 0.2 * k, ky + 4.4 * k, kx - 1 * k, ky + 4 * k], sash);
  poly(ctx, [kx + 0.6 * k, ky + 0.3 * k, kx + 1.6 * k, ky + 0.6 * k, kx + 1.6 * k, ky + 3.8 * k, kx + 0.6 * k, ky + 3.6 * k], shade(sash, -0.2));
  for (let i = 0; i < 4; i++) line(ctx, kx - 0.8 * k + i * 0.7 * k, ky + 4 * k, kx - 0.9 * k + i * 0.75 * k, ky + 5.6 * k, shade(sash, i % 2 ? 0.25 : -0.1), 0.35 * k);
  if (kind === 'archer') { // a fur-trimmed hem on the archer's long kaftan
    B(0.12, 0.17, RU_FUR);
  }
}

/** A flat polygon on the near (R) side of a box. */
function facePoly(ctx: Ctx, x: number, y: number, w: number, h: number, pts: [number, number][], color: string) {
  poly(ctx, pts.flatMap(([u, v]) => pt('R', x, y, w, h, u, v)), color);
}

/** Beards for the grown men, a long moustache for the young riders and archers, and ruddy cheeks against the cold. */
function face(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const L = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'L', x, y, w, h, u0, u1, v0, v1, c);
  const hair = RU_HAIR, lit = shade(RU_HAIR, 0.22);
  R(0.04, 0.22, 0.3, 0.4, '#e89a88'); R(0.76, 0.94, 0.3, 0.4, '#e89a88'); // cold-reddened cheeks
  if (kind === 'archer' || kind === 'rider') {
    R(0.2, 0.46, 0.18, 0.24, hair); R(0.54, 0.8, 0.18, 0.24, hair); // a long moustache with drooping ends
    R(0.16, 0.24, 0.08, 0.2, hair); R(0.76, 0.84, 0.08, 0.2, hair);
    return;
  }
  // a full beard along the jaw, a moustache over it, and sideburns
  R(0, 1, 0, 0.26, hair);
  L(0.55, 1, 0, 0.26, hair);
  R(0.26, 0.74, 0.2, 0.27, shade(hair, -0.12));
  R(0.36, 0.64, 0.14, 0.18, '#c07060'); // the lip
  R(0.9, 1, 0.24, 0.52, hair);
  for (const u of [0.12, 0.4, 0.68]) R(u, u + 0.08, 0.02, 0.16, lit); // strands catching the light
  if (kind === 'giant' || kind === 'knight' || kind === 'druzhina' || kind === 'explorer') { // a long beard spilling down the chest
    facePolyR(ctx, x, y, w, h, [[0.1, 0.02], [0.9, 0.02], [0.7, -0.34], [0.5, -0.42], [0.3, -0.34]], kind === 'explorer' ? mix(hair, '#c0b8a8', 0.5) : hair);
    facePolyR(ctx, x, y, w, h, [[0.3, -0.02], [0.44, -0.02], [0.46, -0.3], [0.38, -0.26]], lit);
  }
}

function facePolyR(ctx: Ctx, x: number, y: number, w: number, h: number, pts: [number, number][], color: string) {
  poly(ctx, pts.flatMap(([u, v]) => pt('R', x, y, w, h, u, v)), shade(color, -0.12));
}

// ---------------------------------------------------------------- headgear

/** A mail curtain hanging from a helmet's rim over the neck and shoulders. */
function aventail(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const x0 = x - hw / 2 - 1 * k, x1 = x + hw / 2 + 0.6 * k;
  const y0 = top + 2.6 * k, y1 = top + 11.4 * k;
  poly(ctx, [x0, y0, x0 + 0.6 * k, y1 - hw / 4 + 1.4 * k, x - 1 * k, y1, x - 0.4 * k, y0 + hw / 4], RU_MAIL_D); // the back curtain
  poly(ctx, [x0, y0, x0 + 0.6 * k, y1 - hw / 4 + 1.4 * k, x0 + 3.4 * k, y1 - hw / 4 + 2.4 * k, x0 + 2.6 * k, y0 + 0.8 * k], RU_MAIL);
  for (let r = 0; r < 5; r++) for (let i = 0; i < 4; i++) {
    const px = x0 + 0.6 * k + i * 1.4 * k + (r % 2) * 0.7 * k, py = y0 + 1.2 * k + r * 1.6 * k + i * 0.55 * k;
    ellipse(ctx, px, py, 0.35 * k, 0.26 * k, shade(RU_MAIL, 0.35));
  }
  poly(ctx, [x1, y0 + 0.4 * k, x1 - 0.4 * k, y0 + 6.4 * k, x1 - 2 * k, y0 + 7.2 * k, x1 - 1.6 * k, y0 + 1 * k], shade(RU_MAIL_D, -0.1)); // the far side
  line(ctx, x0 + 0.6 * k, y1 - hw / 4 + 1.4 * k, x - 1 * k, y1, RU_GOLD_D, 0.6 * k); // a brass-ringed edge
}

/** A shishak: a tall, slightly ogival iron cone on a brow band, with a finial at the point. */
function shishak(ctx: Ctx, x: number, top: number, k: number, hw: number, metal: string, tall: number, gilt: boolean) {
  const yb = top + 1.4 * k, rx = hw / 2 + 0.5 * k, apex = yb - tall * k;
  // the brow band, riveted (its two visible sides only: the cone sits on top of it)
  const bw = hw + 1 * k, bh = 1.8 * k, by = yb + 1.6 * k, bc = gilt ? RU_GOLD : shade(metal, -0.1);
  faceQuad(ctx, 'L', x, by, bw, bh, 0, 1, 0, 1, bc);
  faceQuad(ctx, 'R', x, by, bw, bh, 0, 1, 0, 1, bc);
  for (const u of [0.2, 0.5, 0.8]) { faceQuad(ctx, 'R', x, by, bw, bh, u, u + 0.06, 0.3, 0.7, RU_GOLD_L); faceQuad(ctx, 'L', x, by, bw, bh, u, u + 0.06, 0.3, 0.7, RU_GOLD_L); }
  ctx.beginPath(); // the near-left half, lit
  ctx.moveTo(x - rx, yb);
  ctx.quadraticCurveTo(x - rx * 0.7, yb - tall * 0.62 * k, x, apex);
  ctx.lineTo(x, yb + rx * 0.5);
  ctx.closePath();
  ctx.fillStyle = ink(shade(metal, 0.12));
  ctx.fill();
  ctx.beginPath(); // the near-right half, in shade
  ctx.moveTo(x + rx, yb);
  ctx.quadraticCurveTo(x + rx * 0.7, yb - tall * 0.62 * k, x, apex);
  ctx.lineTo(x, yb + rx * 0.5);
  ctx.closePath();
  ctx.fillStyle = ink(shade(metal, -0.24));
  ctx.fill();
  curve(ctx, x - rx * 0.45, yb - 0.6 * k, x - rx * 0.4, yb - tall * 0.5 * k, x - 0.4 * k, apex + 1.4 * k, 0.7 * k, 'rgba(255,255,255,0.55)'); // the shine
  if (gilt) for (const d of [-0.5, 0.5]) curve(ctx, x + d * rx, yb + rx * 0.25, x + d * rx * 0.6, yb - tall * 0.5 * k, x, apex + 0.6 * k, 0.6 * k, RU_GOLD); // gilt ribs
  ellipse(ctx, x, apex - 0.4 * k, 0.8 * k, 0.8 * k, gilt ? RU_GOLD : RU_STEEL); // the finial
  line(ctx, x, apex - 0.6 * k, x, apex - 2.6 * k, gilt ? RU_GOLD : RU_STEEL_D, 0.5 * k);
}

/** A fur cap: a rounded crown of red cloth above a thick brim of fur. */
function furCap(ctx: Ctx, x: number, top: number, k: number, hw: number, crown: string, fur: string, tall = 4.6) {
  const yb = top + 1 * k, rx = hw / 2 + 0.2 * k;
  ctx.beginPath();
  ctx.moveTo(x - rx, yb);
  ctx.quadraticCurveTo(x - rx * 0.9, yb - tall * k, x + 0.6 * k, yb - tall * k);
  ctx.quadraticCurveTo(x + rx * 0.9, yb - tall * k + 0.4 * k, x + rx, yb);
  ctx.lineTo(x, yb + rx * 0.5);
  ctx.closePath();
  ctx.fillStyle = ink(crown);
  ctx.fill();
  poly(ctx, [x, yb + rx * 0.5, x + rx, yb, x + rx * 0.8, yb - tall * 0.7 * k, x + 0.6 * k, yb - tall * k], shade(crown, -0.22));
  curve(ctx, x - rx * 0.6, yb - 0.6 * k, x - rx * 0.6, yb - tall * 0.8 * k, x, yb - tall * k + 0.2 * k, 0.6 * k, shade(crown, 0.3)); // a seam
  box(ctx, x, yb + 2.2 * k, hw + 2 * k, 2.6 * k, fur, shade(fur, 0.2)); // the fur brim
  for (const u of [0.08, 0.28, 0.5, 0.72, 0.9]) {
    faceQuad(ctx, 'R', x, yb + 2.2 * k, hw + 2 * k, 2.6 * k, u, u + 0.05, 0.15, 0.95, shade(fur, 0.25));
    faceQuad(ctx, 'L', x, yb + 2.2 * k, hw + 2 * k, 2.6 * k, u + 0.03, u + 0.08, 0.1, 0.9, shade(fur, 0.2));
  }
  band(ctx, x, yb + 2.2 * k, hw + 2 * k, 2.6 * k, 0, 0.12, shade(fur, -0.3));
}

function head(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  switch (kind) {
    case 'warrior': // a plain iron shishak over a padded coif
      for (const f of ['L', 'R'] as const) faceQuad(ctx, f, x, top + 4.6 * k, hw + 0.6 * k, 1.4 * k, 0, 1, 0, 1, RU_LINEN);
      shishak(ctx, x, top, k, hw, RU_STEEL_D, 8.4, false);
      return;
    case 'archer': // a red cap with a sable brim
      furCap(ctx, x, top, k, hw, RU_RED, RU_SABLE, 5);
      ellipse(ctx, x + 0.6 * k, top - 2.8 * k, 0.8 * k, 0.8 * k, RU_GOLD);
      return;
    case 'rider': // a tall fur hat with a cloth top that flops to one side
      furCap(ctx, x, top, k, hw, RU_GREEN, RU_FUR, 6);
      poly(ctx, [x + 0.6 * k, top - 3.6 * k, x - 4 * k, top - 4.6 * k, x - 3 * k, top - 2.4 * k], shade(RU_GREEN, -0.1));
      return;
    case 'explorer': // a fur hat with its ear flaps tied up
      furCap(ctx, x, top, k, hw, RU_FUR_L, RU_FUR, 5.4);
      for (const d of [-1, 1]) poly(ctx, [x + d * (hw / 2 + 0.8 * k), top + 3 * k, x + d * (hw / 2 + 1.6 * k), top + 7.6 * k, x + d * (hw / 2 - 0.4 * k), top + 6 * k], RU_FUR);
      return;
    case 'defender':
      aventail(ctx, x, top, k, hw);
      shishak(ctx, x, top, k, hw, RU_STEEL_D, 9.6, false);
      return;
    case 'swordsman':
      aventail(ctx, x, top, k, hw);
      shishak(ctx, x, top, k, hw, '#9aa2ac', 10.4, true);
      faceQuad(ctx, 'R', x, top + 10.5 * k, hw, 10.5 * k, 0.44, 0.58, 0.42, 1, RU_STEEL); // the nasal
      return;
    case 'knight':
    case 'druzhina':
    case 'giant': {
      aventail(ctx, x, top, k, hw);
      shishak(ctx, x, top, k, hw, kind === 'giant' ? RU_GOLD_D : '#a8b0ba', kind === 'giant' ? 12 : 11, true);
      faceQuad(ctx, 'R', x, top + 10.5 * k, hw, 10.5 * k, 0.44, 0.58, 0.42, 1, RU_GOLD); // a gilt nasal
      // the yalovets: a little red pennant flying from the helmet's point
      const ax = x, ay = top + 1.4 * k - (kind === 'giant' ? 12 : 11) * k - 2.6 * k;
      poly(ctx, [ax, ay, ax - 5.6 * k, ay + 0.6 * k, ax - 3.8 * k, ay + 1.6 * k, ax - 5.6 * k, ay + 2.8 * k, ax, ay + 2.2 * k], RU_RED);
      poly(ctx, [ax, ay, ax - 5.6 * k, ay + 0.6 * k, ax - 4.8 * k, ay + 1.1 * k, ax, ay + 0.9 * k], RU_RED_L);
      return;
    }
    default: // the crews and everyone else: a red cap with a fur brim
      furCap(ctx, x, top, k, hw, RU_RED, RU_FUR, 4.2);
  }
}

// ---------------------------------------------------------------- weapons

/** A spear with a broad leaf blade and a crossbar under it (rogatina), bound in red cord. */
function spear(ctx: Ctx, x: number, y: number, k: number, len = 27) {
  const x0 = x - 1.8 * k, y0 = y + 6.2 * k, x1 = x + 3 * k, y1 = y + (6.2 - len) * k;
  line(ctx, x0, y0, x1, y1, RU_WOOD, 1.5 * k);
  line(ctx, x0 - 0.4 * k, y0, x1 - 0.4 * k, y1, shade(RU_WOOD, 0.4), 0.4 * k);
  line(ctx, x1 - 2 * k, y1 + 0.6 * k, x1 + 2 * k, y1 - 0.2 * k, RU_STEEL_D, 0.9 * k); // the crossbar
  poly(ctx, [x1 + 0.6 * k, y1 - 8 * k, x1 - 1.8 * k, y1 - 2.4 * k, x1, y1], shade(RU_STEEL, 0.15));
  poly(ctx, [x1 + 0.6 * k, y1 - 8 * k, x1 + 2.4 * k, y1 - 2.4 * k, x1, y1], RU_STEEL_D);
  line(ctx, x1 + 0.5 * k, y1 - 7 * k, x1 + 0.1 * k, y1 - 1 * k, '#ffffff', 0.35 * k);
  for (const t of [0.04, 0.08]) { const px = x1 + (x0 - x1) * t, py = y1 + (y0 - y1) * t; line(ctx, px - 0.9 * k, py, px + 0.9 * k, py - 0.3 * k, RU_RED, 0.7 * k); }
}

/** A narrow-bladed war axe on a long haft, with a hammer back. */
function axe(ctx: Ctx, x: number, y: number, k: number) {
  const x0 = x - 0.6 * k, y0 = y + 4.4 * k, x1 = x + 2.6 * k, y1 = y - 14 * k;
  line(ctx, x0, y0, x1, y1, RU_WOOD, 1.3 * k);
  line(ctx, x0 - 0.3 * k, y0, x1 - 0.3 * k, y1, shade(RU_WOOD, 0.4), 0.35 * k);
  poly(ctx, [x1 - 0.2 * k, y1 + 0.4 * k, x1 + 4.6 * k, y1 - 1 * k, x1 + 5.6 * k, y1 + 3.6 * k, x1 + 4 * k, y1 + 3.4 * k, x1 + 0.2 * k, y1 + 2.6 * k], RU_STEEL_D);
  poly(ctx, [x1 - 0.2 * k, y1 + 0.4 * k, x1 + 4.6 * k, y1 - 1 * k, x1 + 4.4 * k, y1 + 1 * k, x1 + 0.2 * k, y1 + 1.6 * k], RU_STEEL);
  line(ctx, x1 + 4.6 * k, y1 - 1 * k, x1 + 5.6 * k, y1 + 3.6 * k, '#ffffff', 0.5 * k); // the edge
  box(ctx, x1 - 1 * k, y1 + 2 * k, 1.6 * k, 1.8 * k, RU_STEEL_D); // the hammer back
  line(ctx, x0 + 0.4 * k, y0 - 3 * k, x0 + 0.9 * k, y0 - 5 * k, RU_RED, 1.5 * k); // a red grip
}

/** A straight double-edged sword with a gilt guard and a lobed pommel. */
function sword(ctx: Ctx, x: number, y: number, k: number) {
  const hx = x + 0.2 * k, hy = y - 1.4 * k, tx = x + 4.2 * k, ty = y - 18 * k;
  const len = Math.hypot(tx - hx, ty - hy), nx = -(ty - hy) / len, ny = (tx - hx) / len;
  const w = 1.2 * k;
  poly(ctx, [hx - nx * w, hy - ny * w, tx - nx * w * 0.6, ty - ny * w * 0.6, tx + (tx - hx) / len * 2 * k, ty + (ty - hy) / len * 2 * k, hx, hy], RU_STEEL);
  poly(ctx, [hx + nx * w, hy + ny * w, tx + nx * w * 0.6, ty + ny * w * 0.6, tx + (tx - hx) / len * 2 * k, ty + (ty - hy) / len * 2 * k, hx, hy], RU_STEEL_D);
  line(ctx, hx + (tx - hx) * 0.06, hy + (ty - hy) * 0.06, hx + (tx - hx) * 0.8, hy + (ty - hy) * 0.8, shade(RU_STEEL_D, -0.3), 0.45 * k); // the fuller
  line(ctx, hx - nx * 3 * k, hy - ny * 3 * k, hx + nx * 3 * k, hy + ny * 3 * k, RU_GOLD, 1.3 * k); // the guard
  line(ctx, hx, hy, hx - (tx - hx) / len * 3.4 * k, hy - (ty - hy) / len * 3.4 * k, RU_BROWN_D, 1.5 * k); // the grip
  const px = hx - (tx - hx) / len * 4.4 * k, py = hy - (ty - hy) / len * 4.4 * k;
  for (const d of [-1, 0, 1]) ellipse(ctx, px + nx * d * 0.9 * k, py + ny * d * 0.9 * k - Math.abs(d) * 0.1 * k, 0.75 * k, 0.75 * k, d ? RU_GOLD_D : RU_GOLD); // the lobed pommel
}

/** A curved sabre with a gilt cross-guard. */
function sabre(ctx: Ctx, x: number, y: number, k: number) {
  const hx = x, hy = y + 0.6 * k, tx = x + 10 * k, ty = y - 14 * k;
  for (const [c, wd, dx] of [[RU_STEEL_D, 2.2, 0.5], [RU_STEEL, 1.4, 0], ['#f4f8fc', 0.45, -0.45]] as const) curve(ctx, hx + dx * k, hy - 2 * k, x + 1.4 * k + dx * k, y - 10 * k, tx + dx * k, ty, wd * k, c);
  line(ctx, hx - 2.2 * k, hy - 1.4 * k, hx + 2.2 * k, hy - 2.6 * k, RU_GOLD, 1 * k);
  line(ctx, hx, hy - 1.6 * k, hx - 0.6 * k, hy + 2.4 * k, RU_BROWN_D, 1.4 * k);
  ellipse(ctx, hx - 0.7 * k, hy + 2.8 * k, 0.8 * k, 0.8 * k, RU_GOLD);
}

/** A recurve bow with an arrow on the string. */
function bow(ctx: Ctx, x: number, y: number, k: number) {
  const bx = x - 3.4 * k, top = { x: bx + 2.4 * k, y: y - 13.6 * k }, bot = { x: bx + 2.4 * k, y: y + 10.4 * k }, ctl = { x: bx + 10.4 * k, y: y - 1.6 * k };
  const nock = { x: bx - 3 * k, y: y - 1.6 * k };
  for (const [c, wd, dx] of [['#3a2418', 2, 0], ['#9a6a3a', 1.2, -0.35], [shade('#c9a06a', 0.3), 0.35, -0.7]] as const) curve(ctx, top.x + dx * k, top.y, ctl.x + dx * k, ctl.y, bot.x + dx * k, bot.y, wd * k, c);
  line(ctx, top.x, top.y, top.x + 1.4 * k, top.y - 2.4 * k, '#3a2418', 1.1 * k); // the recurved tips
  line(ctx, bot.x, bot.y, bot.x + 1.4 * k, bot.y + 2.4 * k, '#3a2418', 1.1 * k);
  ctx.strokeStyle = ink('#e8e0c8');
  ctx.lineWidth = 0.4 * k;
  ctx.beginPath();
  ctx.moveTo(top.x + 1.4 * k, top.y - 2.4 * k);
  ctx.lineTo(nock.x, nock.y);
  ctx.lineTo(bot.x + 1.4 * k, bot.y + 2.4 * k);
  ctx.stroke();
  line(ctx, x + 0.8 * k, y - 1.8 * k, x + 0.8 * k, y + 0.6 * k, RU_RED, 1.6 * k);
  const tx = x + 9.4 * k, ty = y - 3.6 * k;
  line(ctx, nock.x, nock.y, tx, ty, '#c9a06a', 0.7 * k);
  poly(ctx, [tx, ty - 1 * k, tx + 3 * k, ty + 0.2 * k, tx, ty + 1 * k], RU_STEEL_D);
  for (const t of [0.05, 0.13]) { const px = nock.x + (tx - nock.x) * t, py = nock.y + (ty - nock.y) * t; poly(ctx, [px, py, px + 2.2 * k, py - 1.6 * k, px + 2.6 * k, py - 0.4 * k], t < 0.1 ? RU_LINEN : RU_RED); }
}

/** The bogatyr's mace: a heavy flanged iron head on a short haft. */
function mace(ctx: Ctx, x: number, y: number, k: number) {
  const x0 = x - 0.6 * k, y0 = y + 4 * k, x1 = x + 3.4 * k, y1 = y - 13 * k;
  line(ctx, x0, y0, x1, y1, RU_BROWN_D, 1.6 * k);
  for (const t of [0.1, 0.18, 0.26]) line(ctx, x0 + (x1 - x0) * t - 0.9 * k, y0 + (y1 - y0) * t, x0 + (x1 - x0) * t + 0.9 * k, y0 + (y1 - y0) * t - 0.3 * k, RU_GOLD, 0.6 * k);
  ellipse(ctx, x1 + 0.4 * k, y1 - 1.6 * k, 3.4 * k, 3.6 * k, RU_STEEL_D);
  ellipse(ctx, x1 - 0.4 * k, y1 - 2.4 * k, 2.4 * k, 2.6 * k, RU_STEEL);
  for (let i = 0; i < 6; i++) { // the flanges
    const a = (i / 6) * Math.PI * 2;
    poly(ctx, [x1 + 0.4 * k + Math.cos(a - 0.3) * 2.8 * k, y1 - 1.6 * k + Math.sin(a - 0.3) * 3 * k, x1 + 0.4 * k + Math.cos(a) * 5 * k, y1 - 1.6 * k + Math.sin(a) * 5 * k, x1 + 0.4 * k + Math.cos(a + 0.3) * 2.8 * k, y1 - 1.6 * k + Math.sin(a + 0.3) * 3 * k], i % 2 ? RU_STEEL_D : shade(RU_STEEL, 0.1));
  }
  ellipse(ctx, x1 - 1 * k, y1 - 3 * k, 0.8 * k, 0.7 * k, '#ffffff');
  ellipse(ctx, x1 + 0.4 * k, y1 + 2 * k, 1.4 * k, 0.8 * k, RU_GOLD);
}

/** The kite shield in the off hand, in each rank's colours. */
function shieldFor(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  const cx = x - 1.4 * k, ty = y - 11.6 * k, by = y + 5.4 * k;
  switch (kind) {
    case 'warrior': return kite(ctx, cx, ty + 1.6 * k, 4 * k, by - 1 * k, RU_RED, 'stripe', k);
    case 'defender': return kite(ctx, cx, ty - 1 * k, 5.2 * k, by + 1.4 * k, RU_RED, 'sun', k);
    case 'swordsman': return kite(ctx, cx, ty, 4.8 * k, by, RU_RED, 'trident', k);
    case 'giant': return kite(ctx, cx, ty - 1 * k, 5.4 * k, by + 1 * k, RU_GOLD, 'sun', k, RU_RED);
    default: return kite(ctx, cx, ty, 4.6 * k, by, RU_RED, 'trident', k);
  }
}

function weapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  switch (kind) {
    case 'warrior': axe(ctx, x, y, k); shieldFor(ctx, kind, b.off.x, b.off.y, k); return true;
    case 'archer': bow(ctx, x, y, k); return true;
    case 'defender': spear(ctx, x, y, k); return true; // the shield comes afterwards
    case 'swordsman': sword(ctx, x, y, k); shieldFor(ctx, kind, b.off.x, b.off.y, k); return true;
    case 'giant': mace(ctx, x, y, k); shieldFor(ctx, kind, b.off.x, b.off.y, k); return true;
    case 'explorer': spear(ctx, x, y, k, 22); return true; // a hunting spear
  }
  return false;
}

// ---------------------------------------------------------------- mounted troops

/** A lance with a two-tailed red banner carrying the gold trident-falcon. */
function lance(ctx: Ctx, hx: number, hy: number, thick: number) {
  const P = (t: number) => [hx - 3 + 11 * t, hy + 6 - 27 * t] as const;
  const [tx, ty] = P(1);
  line(ctx, hx - 3, hy + 6, tx, ty, RU_WOOD, thick);
  line(ctx, hx - 3.6, hy + 6, tx - 0.6, ty, shade(RU_WOOD, 0.4), 0.5);
  poly(ctx, [tx + 0.4, ty - 6, tx - 1.4, ty + 0.6, tx + 0.4, ty + 1.2], RU_STEEL);
  poly(ctx, [tx + 0.4, ty - 6, tx + 2.2, ty + 0.4, tx + 0.4, ty + 1.2], RU_STEEL_D);
  const bx = tx - 0.2, by = ty + 2;
  poly(ctx, [bx, by, bx + 11, by + 1.2, bx + 7.6, by + 3.8, bx + 11, by + 7.4, bx - 0.4, by + 6.6], RU_RED);
  poly(ctx, [bx, by, bx + 11, by + 1.2, bx + 10, by + 2.2, bx, by + 1.6], RU_RED_L);
  poly(ctx, [bx - 0.4, by + 6.6, bx + 11, by + 7.4, bx + 10, by + 6.4, bx - 0.3, by + 5.8], RU_RED_D);
  trident(ctx, bx + 3.4, by + 3.6, 0.55, RU_GOLD);
}

/** The prince's horse: a red saddle cloth edged in gold, a breast strap hung with brass pendants and a studded bridle. */
function tack(ctx: Ctx, x: number, y: number, saddle: { x: number; y: number }, rich: boolean) {
  const kh = 0.92, hx0 = x - 1, hy0 = y + 3;
  // the saddle cloth, hanging below the saddle in a pointed skirt
  const sx = saddle.x, sy = saddle.y + 1.4;
  poly(ctx, [sx - 6, sy - 0.4, sx + 3.6, sy + 1.6, sx + 3, sy + 7.6, sx - 0.6, sy + 9.6, sx - 5.6, sy + 6.6], rich ? RU_RED : RU_BROWN);
  poly(ctx, [sx + 3, sy + 7.6, sx - 0.6, sy + 9.6, sx - 5.6, sy + 6.6, sx - 5.4, sy + 5.6, sx - 0.6, sy + 8.4, sx + 3, sy + 6.6], rich ? RU_GOLD : RU_RED);
  if (rich) for (let i = 0; i < 4; i++) ellipse(ctx, sx - 4.6 + i * 2.2, sy + 6.2 + Math.min(i, 3 - i) * 0.9 + i * 0.3, 0.5, 0.5, RU_GOLD_L);
  // a breast strap with pendants
  line(ctx, x + 3.5, y - 9.4, x + 8, y - 3.6, rich ? RU_RED_D : RU_BROWN_D, 1.2);
  for (let i = 0; i < 4; i++) {
    const t = (i + 0.5) / 4, px = x + 3.5 + 4.5 * t, py = y - 9.4 + 5.8 * t;
    poly(ctx, [px - 0.7, py + 0.6, px + 0.7, py + 0.6, px, py + 2.4], rich ? RU_GOLD : RU_STEEL);
  }
  // studs along the bridle and a tassel under the jaw
  const hhx = hx0 + 10.5 * kh, hhy = hy0 - 15 * kh;
  for (const [dx, dy] of [[1.6, 0.2], [0.6, -2.2], [-0.8, -3.6]] as const) ellipse(ctx, hhx + dx, hhy + dy, 0.55, 0.55, rich ? RU_GOLD : RU_STEEL);
  for (let i = -1; i <= 1; i++) line(ctx, hhx + 2.6, hhy + 1, hhx + 2.6 + i * 0.5, hhy + 4, RU_RED, 0.6);
  if (rich) { // a quilted crinet down the neck
    for (let i = 0; i < 3; i++) poly(ctx, [hx0 + (6 + i * 1.3) * kh, hy0 - (11 + i * 2.2) * kh, hx0 + (8.4 + i * 1.3) * kh, hy0 - (10 + i * 2.2) * kh, hx0 + (8.6 + i * 1.3) * kh, hy0 - (8.2 + i * 2.2) * kh, hx0 + (6.2 + i * 1.3) * kh, hy0 - (9.2 + i * 2.2) * kh], i % 2 ? RU_RED_D : RU_RED);
  }
}

/** The druzhina: an armoured horseman of the prince's retinue on a grey horse, in mail and a red cloak, with lance and kite shield. */
function druzhina(ctx: Ctx, x: number, y: number, heavy: boolean) {
  const saddle = drawHorse(ctx, x - 1, y + 3, 0.92, heavy ? '#c4bfb6' : '#9a6a44', heavy ? '#ece8e0' : '#2a1a10', undefined, RU_RED);
  if (heavy) for (const [dx, dy] of [[-5, -7], [-2, -5], [2, -8], [5, -6], [-4, -4]] as const) ellipse(ctx, x + dx, y + dy, 1.1, 0.7, '#e2ddd4'); // a dappled coat
  tack(ctx, x, y, saddle, true);
  const b = figure(ctx, 'knight', 'rus', saddle.x, saddle.y, 0.9, true);
  kite(ctx, b.off.x - 2, b.off.y - 6.4, 3.6, b.off.y + 5.6, RU_RED, 'trident', 0.75);
  lance(ctx, b.hand.x, b.hand.y, heavy ? 1.9 : 1.6);
}

/** The light horseman of the steppe frontier: a fur hat, a red kaftan, a sabre raised, a bow case at the saddle. */
function rider(ctx: Ctx, x: number, y: number) {
  const saddle = drawHorse(ctx, x - 1, y + 3, 0.88, '#8a5a32', '#2a1a10', undefined, RU_BROWN);
  tack(ctx, x, y, saddle, false);
  // the saadak: a leather bow case with the bow's tip showing, hung behind the leg
  poly(ctx, [saddle.x - 3.4, saddle.y + 1.6, saddle.x - 0.6, saddle.y + 2.4, saddle.x - 2, saddle.y + 9, saddle.x - 4.8, saddle.y + 8], RU_BROWN_D);
  poly(ctx, [saddle.x - 3, saddle.y + 3, saddle.x - 1.2, saddle.y + 3.4, saddle.x - 2.2, saddle.y + 7.4, saddle.x - 4, saddle.y + 7], RU_RED);
  ellipse(ctx, saddle.x - 2.6, saddle.y + 5.2, 0.6, 0.6, RU_GOLD);
  curve(ctx, saddle.x - 3.2, saddle.y + 1.8, saddle.x - 5.2, saddle.y - 2, saddle.x - 7.4, saddle.y - 3, 0.9, '#3a2418');
  const b = figure(ctx, 'rider', 'rus', saddle.x, saddle.y, 0.88, true);
  kite(ctx, b.off.x - 1.6, b.off.y - 5, 2.8, b.off.y + 3.4, RU_RED, 'stripe', 0.62);
  sabre(ctx, b.hand.x, b.hand.y, 0.9);
}

// ---------------------------------------------------------------- the siege engine

/** A porok: a pole-sling throwing engine on a log frame with carved horse-head ends, pulled by a team on ropes. */
function porok(ctx: Ctx, x: number, y: number) {
  const W = RU_WOOD, Wd = RU_WOOD_D;
  for (const [ax, ay, ar] of [[16, 5, 2.2], [19.2, 6.2, 1.9], [17.4, 2.8, 1.7], [13.4, 6.8, 1.5]] as const) { // a heap of shaped stones
    ellipse(ctx, x + ax, y + ay, ar, ar * 0.85, '#8a8478');
    ellipse(ctx, x + ax - ar * 0.3, y + ay - ar * 0.3, ar * 0.45, ar * 0.35, '#c0b8aa');
  }
  // two sill logs and a cross log, with their cut ends
  for (const [ox, oy] of [[-4, -2], [4, 2]] as const) {
    box(ctx, x + ox, y + oy, 26, 2.4, RU_LOG, shade(RU_LOG, 0.2));
    for (const u of [0.25, 0.55, 0.85]) faceQuad(ctx, 'R', x + ox, y + oy, 26, 2.4, u, u + 0.02, 0, 1, RU_LOG_D);
  }
  for (const [ex, ey] of [[-17, -0.6], [-9, 3.4]] as const) { ellipse(ctx, x + ex, y + ey, 1.4, 1.3, RU_LOG_D); ellipse(ctx, x + ex, y + ey, 0.9, 0.8, '#d6b07a'); }
  // the trestle: two A-frames holding the axle
  const A: [number, number] = [x + 1, y - 24];
  for (const [bx, by] of [[x - 8, y + 0.4], [x + 11, y + 1.4], [x - 3, y - 2.4], [x + 6, y + 4]] as const) {
    line(ctx, bx, by, A[0] + (bx < x ? -1.6 : 1.6), A[1] + 0.4, Wd, 2.4);
    line(ctx, bx - 0.5, by, A[0] + (bx < x ? -1.6 : 1.6) - 0.5, A[1] + 0.4, W, 1.4);
  }
  line(ctx, x - 6, y - 7, x + 9, y - 6, Wd, 1.2);
  line(ctx, x - 4, y - 15, x + 7, y - 14.6, Wd, 1.2);
  // carved horse-head finials on the frame (konyok), as on a roof ridge
  for (const [hx, hy, d] of [[A[0] - 2.4, A[1] - 0.6, -1], [A[0] + 2.6, A[1] - 0.6, 1]] as const) {
    poly(ctx, [hx, hy + 1, hx + d * 1.2, hy - 2.6, hx + d * 3.2, hy - 3, hx + d * 3.6, hy - 1.8, hx + d * 2, hy - 1.4, hx + d * 1.4, hy + 1], RU_WOOD);
    ellipse(ctx, hx + d * 2.2, hy - 2.4, 0.3, 0.3, RU_BROWN_D);
  }
  line(ctx, A[0] - 4.4, A[1] + 0.4, A[0] + 4.6, A[1] - 0.4, Wd, 2.4); // the axle
  // the throwing pole: long to the back with the sling, short to the front with the hauling ropes
  const tip: [number, number] = [x - 18, y - 40], pull: [number, number] = [x + 10, y - 17];
  line(ctx, A[0] + 1.4, A[1] - 1, tip[0], tip[1], Wd, 3);
  line(ctx, A[0] + 1.2, A[1] - 1.6, tip[0] + 0.4, tip[1] - 0.4, W, 1.8);
  line(ctx, A[0] + 1, A[1], pull[0], pull[1], Wd, 2.6);
  for (const t of [0.3, 0.5, 0.7]) { const px = A[0] + (tip[0] - A[0]) * t, py = A[1] - 1 + (tip[1] - A[1] + 1) * t; line(ctx, px - 1.2, py + 0.5, px + 1.2, py - 0.5, t === 0.5 ? RU_RED : RU_LINEN, 0.9); } // painted bands
  for (let i = 0; i < 5; i++) { // hauling ropes ending in wooden toggles
    const px = pull[0] - 1.2 + i * 0.6, ex = x + 4 + i * 3.4, ey = y + 2.6 + (i % 2) * 2;
    curve(ctx, px, pull[1] + 0.6, (px + ex) / 2 + 1, (pull[1] + ey) / 2 - 1, ex, ey, 0.7, i % 2 ? '#c8b080' : '#a89060');
    line(ctx, ex - 1, ey + 0.4, ex + 1, ey, RU_WOOD_D, 0.9);
  }
  const pouch: [number, number] = [x - 15.6, y - 2.4]; // the sling, with a stone in its pouch
  curve(ctx, tip[0], tip[1], tip[0] - 5, (tip[1] + pouch[1]) / 2, pouch[0] - 2.4, pouch[1] - 1, 0.6, '#a89060');
  curve(ctx, tip[0], tip[1], tip[0] + 5, (tip[1] + pouch[1]) / 2, pouch[0] + 2.8, pouch[1] - 1, 0.6, '#a89060');
  ellipse(ctx, pouch[0], pouch[1] + 0.4, 3.4, 2, RU_BROWN_D);
  ellipse(ctx, pouch[0], pouch[1] - 0.8, 1.8, 1.5, '#8a8478');
  ellipse(ctx, pouch[0] - 0.5, pouch[1] - 1.3, 0.7, 0.6, '#c0b8aa');
  // a war banner (prapor) on a staff beside the frame: red, two-tailed, with the gold trident-falcon
  const fx = x + 15, fy = y - 2;
  line(ctx, fx, fy + 2, fx, fy - 30, Wd, 1);
  poly(ctx, [fx, fy - 29, fx + 10, fy - 27.6, fx + 7, fy - 24.6, fx + 10, fy - 21, fx, fy - 21.6], RU_RED);
  poly(ctx, [fx, fy - 29, fx + 10, fy - 27.6, fx + 9.2, fy - 26.6, fx, fy - 27.4], RU_RED_L);
  trident(ctx, fx + 3.6, fy - 25.4, 0.6, RU_GOLD);
  poly(ctx, [fx - 0.8, fy - 30, fx, fy - 32.4, fx + 0.8, fy - 30], RU_GOLD);
  // the crew: a bearded engineer at the frame
  figure(ctx, 'catapult', 'rus', x + 1, y + 8, 0.62);
}

// ---------------------------------------------------------------- river boats

/** A row of red kite shields hung along a gunwale between two points. */
function gunwaleShields(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, n: number, s: number) {
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t;
    poly(ctx, teardrop(px, py - 1.2 * s, 1.8 * s, py + 3.6 * s), RU_STEEL_D);
    poly(ctx, teardrop(px, py - 1 * s, 1.45 * s, py + 3 * s), i % 3 === 1 ? RU_LINEN : RU_RED);
    ellipse(ctx, px, py - 0.4 * s, 0.5 * s, 0.45 * s, RU_GOLD);
  }
}

/** A carved horse head on a raised stem. */
function horseHead(ctx: Ctx, x: number, y: number, d: number, s: number, c: string) {
  poly(ctx, [x, y, x + d * 1 * s, y - 4 * s, x + d * 3.6 * s, y - 5.2 * s, x + d * 4.4 * s, y - 3.6 * s, x + d * 2.2 * s, y - 3 * s, x + d * 1.6 * s, y + 0.4 * s], c);
  poly(ctx, [x + d * 1 * s, y - 4 * s, x + d * 0.6 * s, y - 5.8 * s, x + d * 1.8 * s, y - 4.6 * s], c); // the ear
  ellipse(ctx, x + d * 2.6 * s, y - 4.2 * s, 0.35 * s, 0.35 * s, RU_BROWN_D);
  line(ctx, x + d * 0.4 * s, y - 1.4 * s, x + d * 1.6 * s, y - 2.6 * s, RU_RED, 0.6 * s); // a red bridle painted on
}

/** A plank river boat (lodya, ushkuy): a long hull with high curved ends, shields along the gunwale, a square sail and oars. */
function lodya(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  const tier = kind === 'warship' ? 2 : kind === 'ship' ? 1 : 0;
  const w = [15, 23, 28][tier], rise = [4.4, 5.6, 7][tier];
  const wood = '#8a5a34', woodD = '#4a2c16', woodL = '#b88250';
  const crew = (cx: number, cy: number, kd: UnitKind, kk: number) => figure(ctx, kd, 'rus', cx, cy, kk, true);
  const top = (t: number) => y - 5 - Math.pow(Math.abs(t), 2.6) * rise;
  const near: [number, number][] = [];
  for (let i = 0; i <= 10; i++) { const t = -1 + i * 0.2; near.push([x + t * w, top(t)]); }
  const far = near.map(([px, py], i) => [px + (i === 0 ? 2 : i === 10 ? -2 : 0), py - 2.6] as [number, number]);
  poly(ctx, [...near.flatMap(([a, b]) => [a, b]), ...[...far].reverse().flatMap(([a, b]) => [a, b])], '#3a2412'); // the far wall's inside
  poly(ctx, [x - w * 0.86, y - 5.2, x + w * 0.86, y - 5.4, x + w * 0.86, y - 7.2, x - w * 0.86, y - 7], '#b8945c'); // the thwarts
  // the mast and its square sail, striped red and white; the warship's carries a gold sun
  if (tier > 0) {
    const mx = x + 1, my = y - 7, mh = tier === 2 ? 30 : 25, sw = tier === 2 ? 11 : 9;
    line(ctx, mx, my, mx, my - mh, woodD, 1.3);
    line(ctx, mx - sw, my - mh + 2.4, mx + sw, my - mh + 1.2, woodD, 1); // the yard
    const sl = [mx - sw, my - mh + 2.6, mx + sw, my - mh + 1.4, mx + sw - 0.6, my - 9.8, mx - sw + 0.8, my - 8.8];
    poly(ctx, sl, RU_LINEN);
    for (let i = 0; i < 4; i += 2) { // red stripes down the sail
      const u0 = i / 4, u1 = (i + 1) / 4;
      const P = (u: number, v: number) => [sl[0] + (sl[2] - sl[0]) * u + (sl[6] - sl[0]) * v, sl[1] + (sl[3] - sl[1]) * u + (sl[7] - sl[1]) * v];
      poly(ctx, [...P(u0, 0), ...P(u1, 0), ...P(u1, 1), ...P(u0, 1)], RU_RED);
    }
    poly(ctx, [mx + sw, my - mh + 1.4, mx + sw - 0.6, my - 9.8, mx + sw - 2.6, my - 10, mx + sw - 2, my - mh + 1.6], 'rgba(0,0,0,0.12)'); // the belly's shade
    if (tier === 2) sun(ctx, mx, my - mh / 2 - 4.4, 2.4, RU_GOLD);
    else trident(ctx, mx, my - mh / 2 - 4.4, 0.8, RU_GOLD);
    line(ctx, mx, my - mh, x - w + 1, top(-1) - 2, '#5a4a3a', 0.4); // stays fore and aft
    line(ctx, mx, my - mh, x + w - 1, top(1) - 2, '#5a4a3a', 0.4);
    poly(ctx, [mx, my - mh - 0.4, mx + 5, my - mh + 0.4, mx + 3.6, my - mh + 1.4, mx + 5, my - mh + 2.6, mx, my - mh + 2], RU_RED); // a pennant at the masthead
  }
  // the crew
  const seats: [number, UnitKind][] = tier === 0 ? [[-0.4, 'warrior'], [0.28, 'archer']] : tier === 1 ? [[-0.6, 'warrior'], [-0.22, 'archer'], [0.4, 'warrior']] : [[-0.66, 'defender'], [-0.36, 'swordsman'], [0.3, 'archer'], [0.6, 'defender']];
  for (const [t, kd] of seats) crew(x + t * w, y - 4.6, kd, tier === 0 ? 0.44 : 0.42);
  // the hull's near side: clinker planks, a dark wale and the waterline
  const hull = [...near, [x + w * 0.84, y - 1.2], [x + w * 0.5, y + 2.4], [x, y + 3.2], [x - w * 0.5, y + 2.4], [x - w * 0.84, y - 1.2]] as [number, number][];
  poly(ctx, hull.flatMap(([a, b]) => [a, b]), wood);
  poly(ctx, [...near.flatMap(([a, b]) => [a, b]), x + w * 0.78, y - 3.2, x, y - 2.6, x - w * 0.78, y - 3.2], woodL);
  for (const dv of [1.4, 3]) { // the overlapping strakes
    ctx.strokeStyle = ink(shade(wood, -0.35));
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let i = 1; i < 10; i++) { const t = -1 + i * 0.2, px = x + t * w * 0.94, py = top(t) * (1 - dv / 6) + (y + 2) * (dv / 6); if (i === 1) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
    ctx.stroke();
  }
  poly(ctx, [x - w * 0.84, y - 1.2, x - w * 0.5, y + 2.4, x, y + 3.2, x + w * 0.5, y + 2.4, x + w * 0.84, y - 1.2, x + w * 0.5, y - 0.2, x, y + 0.6, x - w * 0.5, y - 0.2], woodD);
  ctx.strokeStyle = ink(shade(woodL, 0.25));
  ctx.lineWidth = 1;
  ctx.beginPath();
  near.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)));
  ctx.stroke();
  // oars out over the near side
  const oars = [2, 3, 4][tier];
  for (let i = 0; i < oars; i++) {
    const t = -0.55 + (i / Math.max(1, oars - 1)) * 1.1, ox = x + t * w * 0.8, oy = top(t) + 0.6;
    line(ctx, ox, oy, ox - 4, oy + 8.4, RU_WOOD_D, 0.8);
    ellipse(ctx, ox - 4.2, oy + 8.8, 0.9, 1.6, RU_WOOD);
  }
  if (tier > 0) gunwaleShields(ctx, x - w * 0.62, top(-0.62) + 1.6, x + w * 0.62, top(0.62) + 1.6, tier === 2 ? 7 : 5, tier === 2 ? 1.05 : 0.95);
  else gunwaleShields(ctx, x - w * 0.2, top(-0.2) + 1.6, x + w * 0.2, top(0.2) + 1.6, 1, 0.9);
  // the high stem and stern: a carved horse head forward, a curled stern-post aft, and a steering oar
  const [bx, by] = near[10], [sx, sy] = near[0];
  curve(ctx, bx - 1.4, by + 1, bx + 1.6, by - 1, bx + 1.6, by - 4, 1.8, woodD);
  horseHead(ctx, bx + 1.4, by - 3.6, 1, tier === 2 ? 1.2 : 1, woodL);
  curve(ctx, sx + 1.4, sy + 1, sx - 1.6, sy - 2, sx - 0.4, sy - 4.6, 1.8, woodD);
  ellipse(ctx, sx - 0.2, sy - 4.8, 1.2, 1.2, woodL);
  line(ctx, sx + 2.4, sy + 0.4, sx - 2.6, sy + 7.6, RU_WOOD_D, 1);
  ellipse(ctx, sx - 2.8, sy + 8, 1, 1.8, RU_WOOD);
  if (tier === 2) { // the prince's banner on the stern
    line(ctx, sx + 2, sy, sx + 2, sy - 14, woodD, 0.9);
    poly(ctx, [sx + 2, sy - 14, sx + 9, sy - 13, sx + 6.6, sy - 11, sx + 9, sy - 8.6, sx + 2, sy - 9.2], RU_RED);
    trident(ctx, sx + 4.6, sy - 11.2, 0.45, RU_GOLD);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; // foam along the waterline
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y + 3.2, w * 0.78, 2.2, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.stroke();
}

function unit(ctx: Ctx, kind: UnitKind, x: number, y: number): boolean {
  switch (kind) {
    case 'druzhina': druzhina(ctx, x, y, true); return true;
    case 'knight': druzhina(ctx, x, y, false); return true;
    case 'rider': rider(ctx, x, y); return true;
    case 'catapult': porok(ctx, x, y); return true;
    case 'boat': case 'ship': case 'warship': lodya(ctx, kind, x, y); return true;
  }
  return false;
}

// ---------------------------------------------------------------- buildings

/** A pitched roof over a box footprint: the ridge runs back from the gable on the left face. */
function gable(ctx: Ctx, x: number, y: number, w: number, h: number, rise: number, color: string, eave = 1.4, gableWall = RU_LOG) {
  const hw = w / 2 + eave, hh = hw / 2;
  const L = [x - hw, y - h], F = [x, y + hh - h], Rr = [x + hw, y - h], Bk = [x, y - hh - h];
  const m1 = [(L[0] + F[0]) / 2, (L[1] + F[1]) / 2 - rise], m2 = [(Bk[0] + Rr[0]) / 2, (Bk[1] + Rr[1]) / 2 - rise];
  poly(ctx, [L[0], L[1], Bk[0], Bk[1], m2[0], m2[1], m1[0], m1[1]], shade(color, 0.14)); // the far slope
  poly(ctx, [L[0], L[1], F[0], F[1], m1[0], m1[1]], shade(color, -0.4)); // the shadow under the eaves
  const wl = [x - w / 2, y - h], wf = [x, y + w / 4 - h], ap = [m1[0], m1[1] + 1.2]; // the gable wall, in logs
  poly(ctx, [wl[0], wl[1], wf[0], wf[1], ap[0], ap[1]], shade(gableWall, 0.04));
  for (let i = 1; i < 5; i++) {
    const t = i / 5;
    line(ctx, wl[0] + (ap[0] - wl[0]) * t, wl[1] + (ap[1] - wl[1]) * t, wf[0] + (ap[0] - wf[0]) * t, wf[1] + (ap[1] - wf[1]) * t, shade(gableWall, -0.32), 0.4);
  }
  poly(ctx, [F[0], F[1], Rr[0], Rr[1], m2[0], m2[1], m1[0], m1[1]], shade(color, -0.12)); // the near slope
  for (let i = 1; i < 5; i++) { // shingle courses
    const t = i / 5;
    line(ctx, F[0] + (m1[0] - F[0]) * t, F[1] + (m1[1] - F[1]) * t, Rr[0] + (m2[0] - Rr[0]) * t, Rr[1] + (m2[1] - Rr[1]) * t, shade(color, -0.3), 0.4);
  }
  line(ctx, m1[0], m1[1], m2[0], m2[1], shade(color, 0.3), 0.8); // the ridge
  return { apex: m1, L, F };
}

/** Log walls: a box crossed by the rounded courses of the logs, with notched ends at the corners. */
function logs(ctx: Ctx, x: number, y: number, w: number, h: number, wood = RU_LOG) {
  box(ctx, x, y, w, h, wood, shade(wood, 0.15));
  const n = Math.max(3, Math.round(h / 1.6));
  for (let i = 1; i < n; i++) {
    const v = i / n;
    faceQuad(ctx, 'L', x, y, w, h, 0, 1, v - 0.03, v, shade(wood, -0.32));
    faceQuad(ctx, 'R', x, y, w, h, 0, 1, v - 0.03, v, shade(wood, -0.38));
    faceQuad(ctx, 'L', x, y, w, h, 0, 1, v, v + 0.035, shade(wood, 0.12));
  }
  for (let i = 0; i < n; i++) { // the log ends standing proud at the front corner
    const yy = y + w / 4 - ((i + 0.5) / n) * h;
    ellipse(ctx, x + 0.2, yy, 0.9, 0.7, RU_LOG_D);
    ellipse(ctx, x + 0.2, yy, 0.55, 0.45, '#d8b07c');
  }
}

/** A window in a carved, painted frame (nalichnik): a dark pane, white boards and a pointed cresting above. */
function nalichnik(ctx: Ctx, face: 'L' | 'R', x: number, y: number, w: number, h: number, u: number, v: number, du: number, dv: number, frame = RU_LINEN) {
  faceQuad(ctx, face, x, y, w, h, u - 0.05, u + du + 0.05, v - 0.06, v + dv + 0.06, frame);
  faceQuad(ctx, face, x, y, w, h, u, u + du, v, v + dv, '#2a3040');
  faceQuad(ctx, face, x, y, w, h, u + du * 0.45, u + du * 0.55, v, v + dv, frame); // the mullion
  const [ax, ay] = pt(face, x, y, w, h, u - 0.07, v + dv + 0.06), [bx, by] = pt(face, x, y, w, h, u + du + 0.07, v + dv + 0.06), [cx, cy] = pt(face, x, y, w, h, u + du / 2, v + dv + 0.06);
  poly(ctx, [ax, ay, bx, by, cx, cy - h * 0.16], frame); // the cresting
  ellipse(ctx, cx, cy - h * 0.07, 0.45, 0.45, RU_RED);
  faceQuad(ctx, face, x, y, w, h, u - 0.07, u + du + 0.07, v - 0.1, v - 0.06, RU_BLUE); // a painted sill
}

/** An izba: a log house with a steep shingle roof, carved bargeboards, a horse-head ridge, and framed windows. */
function izba(ctx: Ctx, x: number, y: number, w: number, h: number, roofC: string, tall = false) {
  logs(ctx, x, y, w, h);
  nalichnik(ctx, 'R', x, y, w, h, 0.18, 0.34, 0.2, 0.34);
  nalichnik(ctx, 'R', x, y, w, h, 0.6, 0.34, 0.2, 0.34);
  if (tall) nalichnik(ctx, 'L', x, y, w, h, 0.4, 0.3, 0.2, 0.3);
  const { apex, L, F } = gable(ctx, x, y, w, h, tall ? 9 : 7, roofC);
  line(ctx, L[0], L[1], apex[0], apex[1], RU_LINEN, 0.9); // carved bargeboards (prichelina)
  line(ctx, F[0], F[1], apex[0], apex[1], RU_LINEN, 0.9);
  for (const t of [0.3, 0.6]) { ellipse(ctx, L[0] + (apex[0] - L[0]) * t, L[1] + (apex[1] - L[1]) * t + 0.9, 0.45, 0.45, RU_LINEN); ellipse(ctx, F[0] + (apex[0] - F[0]) * t, F[1] + (apex[1] - F[1]) * t + 0.9, 0.45, 0.45, RU_LINEN); }
  const [gx, gy] = [(L[0] + F[0]) / 2, (L[1] + F[1]) / 2]; // a small round window in the gable
  ellipse(ctx, gx, gy - 3, 1, 1.1, RU_LINEN);
  ellipse(ctx, gx, gy - 3, 0.6, 0.7, '#2a3040');
  horseHead(ctx, apex[0], apex[1] + 0.4, -1, 0.55, RU_LOG); // the konyok on the ridge's end
  if (!tall) { // smoke from the stove
    box(ctx, x + w * 0.2, y - h - 2, 1.6, 4, '#8a7a6a');
    ellipse(ctx, x + w * 0.2 + 1, y - h - 8, 1.6, 1.1, 'rgba(200,205,215,0.4)');
  }
}

/** An onion dome on a drum: a swelling bulb narrowing to a point, a finial, and the drum's ring below. */
function onion(ctx: Ctx, x: number, y: number, r: number, color: string, scales = false) {
  const h = r * 2.3;
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(x - r * 0.62, y);
    ctx.bezierCurveTo(x - r * 1.35, y - h * 0.32, x - r * 0.95, y - h * 0.7, x, y - h);
    ctx.bezierCurveTo(x + r * 0.95, y - h * 0.7, x + r * 1.35, y - h * 0.32, x + r * 0.62, y);
    ctx.closePath();
  };
  path();
  ctx.fillStyle = ink(shade(color, -0.2));
  ctx.fill();
  ctx.save(); // the lit left side and a highlight
  path();
  ctx.clip();
  ctx.fillStyle = ink(shade(color, 0.08));
  ctx.fillRect(x - r * 1.5, y - h, r * 1.3, h);
  if (scales) for (let r2 = 0; r2 < 5; r2++) for (let i = -3; i <= 3; i++) { // aspen shingles
    ellipse(ctx, x + i * r * 0.36 + (r2 % 2) * r * 0.18, y - h * 0.12 - r2 * h * 0.17, r * 0.16, r * 0.11, shade(color, (i < 0 ? 0.12 : -0.18) - 0.08));
  }
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.42, y - h * 0.42, r * 0.18, r * 0.42, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  line(ctx, x, y - h + 0.2, x, y - h - r * 0.9, RU_GOLD_D, Math.max(0.5, r * 0.16)); // the spire
  ellipse(ctx, x, y - h - r * 0.4, r * 0.18, r * 0.18, RU_GOLD_L);
  ellipse(ctx, x, y + r * 0.1, r * 0.66, r * 0.22, shade(color, -0.35)); // the neck ring
}

/** A drum: a narrow round tower under a dome, with tall slit windows. */
function drum(ctx: Ctx, x: number, y: number, r: number, h: number, wall: string) {
  poly(ctx, [x - r, y, x - r, y - h, x, y - h + r * 0.3, x, y + r * 0.3], shade(wall, 0.05));
  poly(ctx, [x + r, y, x + r, y - h, x, y - h + r * 0.3, x, y + r * 0.3], shade(wall, -0.22));
  ellipse(ctx, x, y - h, r, r * 0.3, shade(wall, 0.2));
  for (const d of [-0.5, 0.45]) poly(ctx, [x + d * r - 0.35, y - h * 0.3, x + d * r + 0.35, y - h * 0.3, x + d * r + 0.35, y - h * 0.72, x + d * r, y - h * 0.82, x + d * r - 0.35, y - h * 0.72], '#3a3040');
}

/** A small wooden church: a log body, a tall octagonal drum and a silvery shingled onion dome. */
function chapel(ctx: Ctx, x: number, y: number, dome: string) {
  logs(ctx, x, y, 10, 7, '#9a6a3c');
  nalichnik(ctx, 'R', x, y, 10, 7, 0.38, 0.36, 0.22, 0.34);
  // a low pitched porch roof, then the drum rising through it
  gable(ctx, x, y, 10, 7, 4, '#6a5a4a', 1, '#9a6a3c');
  drum(ctx, x, y - 9.4, 2.2, 7, '#9a6a3c');
  onion(ctx, x, y - 16.4, 2.8, dome, true);
}

/** The cathedral: white stone, gables over arched windows (zakomary), five onion domes in gold, the centre one tallest. */
function cathedral(ctx: Ctx, x: number, y: number, gold: string) {
  box(ctx, x, y, 16, 12, RU_STONE, shade(RU_STONE, 0.05));
  for (const f of ['L', 'R'] as const) {
    for (const u of [0.2, 0.5, 0.8]) { // arched windows and pilasters
      faceQuad(ctx, f, x, y, 16, 12, u - 0.05, u + 0.05, 0.3, 0.62, '#4a4050');
      const [ax, ay] = pt(f, x, y, 16, 12, u, 0.62);
      ellipse(ctx, ax, ay, 0.8, 0.6, '#4a4050');
      faceQuad(ctx, f, x, y, 16, 12, u + 0.13, u + 0.16, 0, 0.92, shade(RU_STONE, -0.08));
    }
    for (const u of [0.17, 0.5, 0.83]) { // the round-topped gables along the roofline
      const [px, py] = pt(f, x, y, 16, 12, u, 1);
      ctx.beginPath();
      ctx.ellipse(px, py, 2.6, 2.2, 0, Math.PI, 0);
      ctx.fillStyle = ink(f === 'L' ? shade(RU_STONE, 0.04) : shade(RU_STONE, -0.18));
      ctx.fill();
      ctx.strokeStyle = ink(shade(RU_STONE, -0.3));
      ctx.lineWidth = 0.4;
      ctx.stroke();
    }
  }
  faceQuad(ctx, 'R', x, y, 16, 12, 0.42, 0.58, 0, 0.36, '#5a3a2a'); // the west door, in a gilt frame
  faceQuad(ctx, 'R', x, y, 16, 12, 0.4, 0.6, 0.36, 0.4, gold);
  for (const [dx, dy] of [[0, -6], [-6, -3], [6, -3], [0, 0]] as const) { // four small domes on the corners
    if (dx === 0 && dy === 0) continue;
    drum(ctx, x + dx, y - 12 + dy + 3, 1.6, 4, RU_STONE);
    onion(ctx, x + dx, y - 12 + dy - 1, 2.2, gold);
  }
  drum(ctx, x, y - 13, 2.6, 7, RU_STONE); // and the great central one
  onion(ctx, x, y - 20, 3.6, gold);
}

/** A kremlin tower: log walls with a jettied fighting gallery and a tall tent roof with a weather-vane. */
function kremlinTower(ctx: Ctx, x: number, y: number) {
  // a stretch of the timber wall running off to the side, its top lined with a little shingle roof
  const wy = y + 2;
  poly(ctx, [x - 4, wy - 8, x - 18, wy - 1, x - 18, wy + 5, x - 4, wy - 2], RU_LOG);
  for (let i = 1; i < 5; i++) line(ctx, x - 4, wy - 8 + i * 1.3, x - 18, wy - 1 + i * 1.3, shade(RU_LOG, -0.32), 0.45);
  poly(ctx, [x - 3, wy - 9.6, x - 19, wy - 1.6, x - 18, wy - 0.4, x - 4, wy - 7.4], '#6a5a4a');
  logs(ctx, x, y, 8, 12, RU_LOG);
  nalichnik(ctx, 'R', x, y, 8, 12, 0.36, 0.36, 0.2, 0.16, RU_RED);
  // the jettied gallery (oblam) with loopholes
  box(ctx, x, y - 12, 10, 4, shade(RU_LOG, -0.05), shade(RU_LOG, 0.15));
  for (const u of [0.25, 0.65]) { faceQuad(ctx, 'R', x, y - 12, 10, 4, u, u + 0.1, 0.35, 0.65, '#2a2020'); faceQuad(ctx, 'L', x, y - 12, 10, 4, u, u + 0.1, 0.35, 0.65, '#2a2020'); }
  // the tent roof (shatyor) and a lookout box under a little dome
  const ty = y - 16;
  poly(ctx, [x - 5.6, ty, x, ty + 2.8, x, ty - 14], shade('#6a5a4a', 0.12));
  poly(ctx, [x + 5.6, ty, x, ty + 2.8, x, ty - 14], shade('#6a5a4a', -0.2));
  for (let i = 1; i < 6; i++) { const t = i / 6; line(ctx, x - 5.6 * (1 - t), ty - 14 * t + 0.6, x, ty + 2.8 * (1 - t) - 14 * t, shade('#6a5a4a', -0.3), 0.4); line(ctx, x + 5.6 * (1 - t), ty - 14 * t + 0.6, x, ty + 2.8 * (1 - t) - 14 * t, shade('#6a5a4a', -0.45), 0.4); }
  line(ctx, x, ty - 14, x, ty - 19, RU_GOLD_D, 0.6);
  poly(ctx, [x, ty - 19, x + 3, ty - 18.2, x, ty - 17.4], RU_GOLD); // the weather-vane flag
  ellipse(ctx, x, ty - 14.4, 0.7, 0.7, RU_GOLD_L);
  // the prince's banner on the tower
  line(ctx, x + 4, y - 15, x + 4, y - 26, RU_WOOD_D, 0.8);
  poly(ctx, [x + 4, y - 26, x + 11, y - 25, x + 8.6, y - 23, x + 11, y - 20.6, x + 4, y - 21.4], RU_RED);
  trident(ctx, x + 6.6, y - 23.2, 0.42, RU_GOLD);
}

/** A two-storey terem: a log house on a raised ground floor with a carved gallery, a steep roof and a small dome. */
function terem(ctx: Ctx, x: number, y: number, roofC: string) {
  logs(ctx, x, y, 10, 5, RU_LOG_D);
  logs(ctx, x, y - 5, 10, 6);
  for (const u of [0.15, 0.5, 0.85]) faceQuad(ctx, 'R', x, y, 10, 5, u - 0.04, u + 0.04, 0, 1, RU_LINEN); // carved posts of the open gallery
  nalichnik(ctx, 'R', x, y - 5, 10, 6, 0.16, 0.3, 0.22, 0.4, '#e8d8a8');
  nalichnik(ctx, 'R', x, y - 5, 10, 6, 0.6, 0.3, 0.22, 0.4, '#e8d8a8');
  const { apex } = gable(ctx, x, y - 5, 10, 6, 7, roofC);
  ellipse(ctx, apex[0], apex[1] - 0.6, 0.7, 0.7, RU_GOLD);
  onion(ctx, x + 2.6, y - 17, 1.5, '#3f7a5a');
}

function building(ctx: Ctx, x: number, y: number, big: boolean, _roofC: string, capital: boolean) {
  const shingle = '#7a6a58', gold = RU_GOLD;
  if (big && capital) { // the kremlin: a gold-domed cathedral behind a corner tower of the timber wall
    cathedral(ctx, x + 3, y - 3, gold);
    kremlinTower(ctx, x - 12, y + 8);
    return;
  }
  if (big) { // a great wooden church with three shingled domes, beside a small izba
    logs(ctx, x, y, 14, 9, '#9a6a3c');
    nalichnik(ctx, 'R', x, y, 14, 9, 0.2, 0.36, 0.14, 0.3);
    nalichnik(ctx, 'R', x, y, 14, 9, 0.66, 0.36, 0.14, 0.3);
    gable(ctx, x, y, 14, 9, 5, shingle, 1, '#9a6a3c');
    for (const [dx, dy, r, h] of [[-3.6, -11, 1.8, 4], [3.6, -9.4, 1.8, 4], [0, -13, 2.4, 6]] as const) {
      drum(ctx, x + dx, y + dy, r, h, '#9a6a3c');
      onion(ctx, x + dx, y + dy - h, r * 1.3, dx === 0 ? gold : '#c0c4c4', dx !== 0);
    }
    return;
  }
  const spot: Record<string, number> = { '-10,2': 0, '10,2': 1, '0,8': 2, '-6,-8': 3, '7,-7': 0, '-14,-3': 1, '14,-2': 3 };
  const v = spot[`${Math.round(x)},${Math.round(y)}`] ?? ((Math.round(x) * 7 + Math.round(y) * 3) % 4 + 4) % 4;
  if (v === 0) izba(ctx, x, y, 11, 6.4, shingle);
  else if (v === 1) terem(ctx, x, y, shingle);
  else if (v === 2) chapel(ctx, x, y, '#c0c4c4');
  else { // an izba with a woven wattle fence and a haystack
    izba(ctx, x, y, 10, 6, '#8a7a5a', true);
    for (let i = 0; i < 5; i++) line(ctx, x - 9 + i * 1.6, y + 3 + i * 0.8, x - 9 + i * 1.6, y + 0.4 + i * 0.8, RU_WOOD_D, 0.6);
    line(ctx, x - 9, y + 1.6, x - 2.6, y + 4.8, RU_WOOD, 0.8);
    ellipse(ctx, x + 7.4, y + 3.6, 2.6, 1.2, '#a88a4a');
    poly(ctx, [x + 4.8, y + 3.6, x + 7.4, y - 1.6, x + 10, y + 3.6], '#c8a858');
    line(ctx, x + 7.4, y - 1.6, x + 7.4, y - 3, RU_WOOD_D, 0.5);
  }
}

// ---------------------------------------------------------------- trees

/** White birches and dark spruce, with a few tall pines. */
function tree(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  const type = ['spruce', 'birch', 'spruce', 'birches', 'pine', 'spruce', 'birch', 'spruce'][variant % 8];
  if (type === 'spruce') { // a dark spruce: a narrow spire of drooping tiers
    line(ctx, x, y, x, y - 6 * k, '#4a3424', 1.8 * k);
    const g = shade(mix(P.forest, '#123a2a', 0.45), -0.05);
    const tiers = 6;
    for (let i = 0; i < tiers; i++) {
      const by = y - (3 + i * 3.6) * k, hw = (6.6 - i * 1.02) * k, th = 5.4 * k;
      poly(ctx, [x, by - th, x - hw, by + 0.4 * k, x - hw * 0.55, by - 0.4 * k, x - hw * 0.35, by + 1.2 * k, x, by + 0.6 * k], shade(g, 0.12));
      poly(ctx, [x, by - th, x + hw, by + 0.4 * k, x + hw * 0.6, by - 0.3 * k, x + hw * 0.3, by + 1.3 * k, x, by + 0.6 * k], shade(g, -0.22));
      line(ctx, x - hw * 0.9, by + 0.2 * k, x - hw * 0.2, by - th * 0.5, shade(g, 0.28), 0.4 * k);
    }
    poly(ctx, [x - 0.8 * k, y - 23.6 * k, x, y - 27.4 * k, x + 0.8 * k, y - 23.6 * k], shade(g, -0.1));
    return;
  }
  const birch = (bx: number, by: number, s: number, lean: number, seed: number) => { // white bark ringed with black, a light drooping crown
    const tx = bx + lean * s, ty = by - 17 * s;
    curve(ctx, bx, by, bx + lean * 0.3 * s, by - 9 * s, tx, ty, 1.9 * s, '#c8c0b0');
    curve(ctx, bx - 0.45 * s, by, bx + lean * 0.3 * s - 0.45 * s, by - 9 * s, tx - 0.4 * s, ty, 0.8 * s, '#f8f6f0');
    for (let i = 0; i < 7; i++) { const t = (i + 0.4) / 8, px = bx + (tx - bx) * t, py = by + (ty - by) * t; line(ctx, px - 0.8 * s, py, px + (0.2 + rand(seed, i) * 0.5) * s, py - 0.3 * s, '#2a2624', 0.5 * s); }
    curve(ctx, bx + lean * 0.4 * s, by - 10 * s, bx + 3 * s, by - 12 * s, bx + 4 * s, by - 15 * s, 0.6 * s, '#d8d0c0');
    curve(ctx, bx + lean * 0.5 * s, by - 12 * s, bx - 2.6 * s, by - 14 * s, bx - 3.8 * s, by - 17 * s, 0.6 * s, '#d8d0c0');
    const g = mix(P.forest, '#8ab048', 0.6);
    for (const [dx, dy, rx, ry, c] of [[-3.6, -16, 3.2, 3.6, -0.1], [3.6, -15.4, 3.2, 3.4, -0.14], [0.4, -19.6, 3.8, 3.6, 0], [-1, -23, 2.6, 2.4, 0.08]] as const) {
      ellipse(ctx, tx - lean * s + dx * s, by + (dy + 1) * s, rx * s, ry * s, shade(g, c - 0.2));
      ellipse(ctx, tx - lean * s + dx * s, by + dy * s, rx * s, ry * s, shade(g, c));
    }
    for (let i = 0; i < 8; i++) { // hanging catkin-fine twigs at the crown's edge
      const a = rand(seed + 3, i) * Math.PI * 2, r = 3 + rand(seed + 5, i) * 2.6, px = tx - lean * s + Math.cos(a) * r * s, py = by - 18 * s + Math.sin(a) * r * 0.8 * s;
      line(ctx, px, py, px + 0.2 * s, py + 2 * s, shade(g, -0.25), 0.4 * s);
      ellipse(ctx, px - 0.3 * s, py - 0.4 * s, 0.7 * s, 0.5 * s, shade(g, 0.22));
    }
  };
  if (type === 'birch') return birch(x, y, k, 0.6, variant);
  if (type === 'birches') { birch(x - 3 * k, y - 1 * k, 0.78 * k, -1, variant); birch(x + 2.6 * k, y + 0.6 * k, 0.88 * k, 1, variant + 7); return; }
  // a tall Scots pine: an orange upper trunk and a flat crown of dark needles
  curve(ctx, x, y, x - 1 * k, y - 12 * k, x + 0.6 * k, y - 22 * k, 2 * k, '#6a4a32');
  curve(ctx, x - 0.3 * k, y - 8 * k, x - 1.2 * k, y - 14 * k, x + 0.3 * k, y - 22 * k, 1.1 * k, '#d0783a');
  curve(ctx, x, y - 17 * k, x + 3 * k, y - 18 * k, x + 5 * k, y - 21 * k, 0.8 * k, '#8a5232');
  const g = shade(mix(P.forest, '#1f4a30', 0.4), 0);
  for (const [dx, dy, rx, ry, c] of [[-2.6, -22.6, 4, 2, -0.08], [3.6, -21.6, 3.4, 1.8, -0.16], [0.6, -25, 4.2, 2.2, 0.04]] as const) {
    ellipse(ctx, x + dx * k, y + (dy + 0.8) * k, rx * k, ry * k, shade(g, c - 0.2));
    ellipse(ctx, x + dx * k, y + dy * k, rx * k, ry * k, shade(g, c));
    ellipse(ctx, x + (dx - 1) * k, y + (dy - 0.6) * k, rx * 0.5 * k, ry * 0.4 * k, shade(g, c + 0.16));
  }
}

registerArt('rus', {
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

// Scotland (the Kingdom of Alba): Highlanders in the belted plaid, the great kilt of tartan wool, crossing stripes of
// blue and green with a red or yellow overcheck, gathered at the waist and thrown over the shoulder under a brooch;
// saffron and white linen shirts, leather sporrans and dirks, knitted hose. Blue Scots bonnets with a red toorie and an
// eagle's feather (three for a chief), wild red hair and beards. The heavy ranks wear quilted aketons and mail under
// iron bascinets with mail aventails, like the galloglass. Two-handed claymores with down-sloping quillons and
// quatrefoil ends, round studded targes with a brass boss, Lochaber axes, long schiltron pikes and bows. A hobelar on a
// shaggy Highland garron, a mailed knight on a grey under a blue-and-white saltire caparison, a timber trebuchet, and
// West Highland birlinns: clinker galleys with a high stem and sternpost, a stern rudder, oars and one square sail.
// Stone crofts (blackhouses) under roped heather thatch, harled tower houses with corbelled turrets and crow-stepped
// gables, and for the capital a castle on a crag of black volcanic rock. Scots pine, rowan with red berries, silver
// birch, and heather at their feet.
import { registerArt, type Body } from '../tribeart';
import { drawHorse, figure } from '../units';
import type { BiomePalette } from '../../data/tribes';
import type { UnitKind } from '../../game/types';
import { band, box, ellipse, faceQuad, ink, line, mix, poly, rand, shade, type Ctx } from '../prims';

const BLUE = '#1f5a8a';
const SALTIRE = '#1a5ab8';
const WHITE = '#f4f2ea';
const LINEN = '#ece4d0';
const SAFFRON = '#d8a83e';
const BONNET = '#24407a';
const TOORIE = '#c8282a';
const STEEL = '#b8bec6';
const STEEL_L = '#eef2f6';
const STEEL_D = '#646c76';
const MAIL = '#8e949c';
const AKETON = '#c8b088';
const LEATH = '#6a4024';
const LEATH_D = '#3e2414';
const BRASS = '#d8b048';
const BRASS_L = '#f6e090';
const SILVER = '#d8dce0';
const WOOD = '#7a5432';
const WOOD_D = '#4a3018';
const HAIR = '#b5541f';
const HAIR_D = '#7a3410';
const HOSE = '#d6cab0';
const HARL = '#d8d2c2';
const STONE = '#8a8a86';
const BASALT = '#3e3c40';
const THATCH = '#9a7a44';

// ---------------------------------------------------------------- tartan

/** A tartan sett: the ground, a broad band crossing it, and one or two thin overcheck lines. */
interface Sett { g: string; b: string; l: string; l2?: string }
const BLACKWATCH: Sett = { g: '#26456e', b: '#1f4a30', l: '#c8282a' }; // blue and green, a red line
const HUNTING: Sett = { g: '#355a34', b: '#22344a', l: '#e8c040' }; // green and blue, a yellow line
const CLAN: Sett = { g: '#2a5a80', b: '#24502e', l: '#d02a2a', l2: '#f0d050' }; // blue and green, red and yellow lines
const ROYAL: Sett = { g: '#b02a2a', b: '#1f3e60', l: '#f0d050', l2: '#1e5030' }; // a red ground for the chief

/** A point on face `f` of a box standing at (x, y): u along the face, v up it (as prims faceQuad). */
const FP = (f: 'L' | 'R', x: number, y: number, w: number, h: number, u: number, v: number): [number, number] => f === 'R'
  ? [x + (u * w) / 2, y + (w / 4) * (1 - u) - v * h]
  : [x - w / 2 + (u * w) / 2, y + (w / 4) * u - v * h];

/** Tartan over part of one face of a box: crossing broad bands and thin lines, darker where they cross. */
function tartanFace(ctx: Ctx, f: 'L' | 'R', x: number, y: number, w: number, h: number, s: Sett, nu = 3, nv = 2, u0 = 0, u1 = 1, v0 = 0, v1 = 1) {
  const q = (a: number, b: number, c: number, d: number, col: string) => {
    const A = Math.max(a, u0), B = Math.min(b, u1), C = Math.max(c, v0), D = Math.min(d, v1);
    if (B > A && D > C) faceQuad(ctx, f, x, y, w, h, A, B, C, D, col);
  };
  q(0, 1, 0, 1, s.g);
  const a = ctx.globalAlpha;
  ctx.globalAlpha = a * 0.62;
  for (let i = 0; i < nu; i++) q((i + 0.08) / nu, (i + 0.42) / nu, 0, 1, s.b);
  for (let j = 0; j < nv; j++) q(0, 1, (j + 0.1) / nv, (j + 0.44) / nv, s.b);
  ctx.globalAlpha = a * 0.9;
  for (let i = 0; i < nu; i++) q((i + 0.7) / nu, (i + 0.76) / nu, 0, 1, s.l);
  for (let j = 0; j < nv; j++) q(0, 1, (j + 0.72) / nv, (j + 0.8) / nv, s.l);
  if (s.l2) {
    for (let i = 0; i < nu; i++) q((i + 0.88) / nu, (i + 0.92) / nu, 0, 1, s.l2);
    for (let j = 0; j < nv; j++) q(0, 1, (j + 0.92) / nv, (j + 0.97) / nv, s.l2);
  }
  ctx.globalAlpha = a;
}

/** Tartan clipped to a polygon given in face coordinates [u, v]. */
function tartanPoly(ctx: Ctx, f: 'L' | 'R', x: number, y: number, w: number, h: number, pts: [number, number][], s: Sett, nu = 3, nv = 3) {
  ctx.save();
  ctx.beginPath();
  pts.forEach(([u, v], i) => { const [px, py] = FP(f, x, y, w, h, u, v); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
  ctx.closePath();
  ctx.clip();
  tartanFace(ctx, f, x, y, w, h, s, nu, nv);
  ctx.restore();
}

// ---------------------------------------------------------------- small helpers

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
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
}

/** The saltire: a white St Andrew's cross on blue, filling the rectangle (x, y, w, h), its fly waving a little. */
function saltireFlag(ctx: Ctx, x: number, y: number, w: number, h: number, wave = 0.8) {
  const pts = [x, y, x + w * 0.5, y + wave, x + w, y, x + w, y + h, x + w * 0.5, y + h + wave, x, y + h];
  poly(ctx, pts, SALTIRE);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.clip();
  const t = Math.min(w, h) * 0.2;
  line(ctx, x, y, x + w, y + h + wave * 0.4, WHITE, t);
  line(ctx, x, y + h, x + w, y + wave * 0.4, WHITE, t);
  poly(ctx, [x, y, x + w * 0.5, y + wave, x + w, y, x + w, y + h * 0.18, x, y + h * 0.2], 'rgba(255,255,255,0.12)');
  ctx.restore();
}

// ---------------------------------------------------------------- dress

const KILTED = (k: UnitKind) => k === 'warrior' || k === 'archer' || k === 'highlander' || k === 'giant' || k === 'explorer' || k === 'rider';

function settOf(kind: UnitKind): Sett {
  switch (kind) {
    case 'archer': case 'explorer': return HUNTING;
    case 'highlander': return CLAN;
    case 'giant': return ROYAL;
    case 'rider': return HUNTING;
    default: return BLACKWATCH;
  }
}

function dress(kind: UnitKind): [string, string, string] | null {
  switch (kind) {
    case 'warrior': return [LINEN, HOSE, LINEN];
    case 'archer': return [SAFFRON, HOSE, SAFFRON];
    case 'highlander': return [LINEN, HOSE, LINEN];
    case 'rider': return [SAFFRON, HOSE, SAFFRON];
    case 'defender': return [AKETON, '#4a463c', AKETON];
    case 'swordsman': return [MAIL, '#4a463c', MAIL];
    case 'knight': return [BLUE, '#4a463c', MAIL];
    case 'giant': return [LINEN, HOSE, LINEN];
    case 'explorer': return ['#7a7458', HOSE, '#7a7458'];
    default: return null;
  }
}

/** The belted plaid below the waist: a pleated kilt of tartan, its fringed apron at the front, to the knee. */
function kilt(ctx: Ctx, x: number, hip: number, w: number, k: number, s: Sett) {
  const kw = w * 1.2, kh = 3.8 * k, ky = hip + 2 * k;
  for (const f of ['L', 'R'] as const) {
    tartanFace(ctx, f, x, ky, kw, kh, s, 3, 1);
    for (let i = 1; i < 6; i++) faceQuad(ctx, f, x, ky, kw, kh, i / 6 - 0.01, i / 6 + 0.01, 0, 0.9, 'rgba(0,0,0,0.14)'); // the pleats
  }
  // the apron's fringed edge down the front
  const [ax, ay] = FP('R', x, ky, kw, kh, 0.12, 0.95), [bx, by] = FP('R', x, ky, kw, kh, 0.12, 0);
  line(ctx, ax, ay, bx, by, shade(s.g, -0.35), 0.5 * k);
  for (let i = 0; i < 4; i++) { const t = (i + 0.5) / 4; line(ctx, ax + (bx - ax) * t, ay + (by - ay) * t, ax + (bx - ax) * t + 0.7 * k, ay + (by - ay) * t + 0.2 * k, shade(s.g, 0.3), 0.3 * k); }
  // the hem, a little ragged
  for (const f of ['L', 'R'] as const) for (let i = 0; i < 6; i++) faceQuad(ctx, f, x, ky, kw, kh, i / 6 + 0.02, i / 6 + 0.12, -0.08, 0.02, shade(s.g, -0.2));
}

/** The upper part of the plaid, thrown over the left shoulder and across the chest, pinned with a round brooch. */
function plaid(ctx: Ctx, x: number, y: number, w: number, h: number, k: number, s: Sett, brooch: string) {
  tartanPoly(ctx, 'L', x, y, w, h, [[0, 0.05], [0.7, 0.05], [0.85, 1], [0, 1]], s, 2, 2);
  tartanPoly(ctx, 'R', x, y, w, h, [[0, 1], [0.56, 1], [1, 0.52], [1, 0.06], [0.5, 0.06], [0, 0.56]], s, 3, 2);
  // a fold line along the lower edge of the sash
  const a = FP('R', x, y, w, h, 0, 0.56), b = FP('R', x, y, w, h, 0.5, 0.06);
  line(ctx, a[0], a[1], b[0], b[1], 'rgba(0,0,0,0.3)', 0.5 * k);
  const [px, py] = FP('R', x, y, w, h, 0.16, 0.86);
  ellipse(ctx, px + 0.3 * k, py + 0.3 * k, 1.5 * k, 1.5 * k, shade(brooch, -0.4));
  ellipse(ctx, px, py, 1.4 * k, 1.4 * k, brooch);
  ellipse(ctx, px, py, 0.7 * k, 0.7 * k, shade(brooch, -0.25));
  ellipse(ctx, px - 0.4 * k, py - 0.4 * k, 0.4 * k, 0.4 * k, '#ffffff');
}

/** A belt with a sporran (a hide pouch with three tassels) at the front and a dirk at the hip. */
function sporran(ctx: Ctx, x: number, y: number, w: number, h: number, k: number, chief: boolean) {
  band(ctx, x, y, w, h, 0, 0.1, LEATH_D);
  faceQuad(ctx, 'R', x, y, w, h, 0.36, 0.5, 0, 0.1, BRASS); // the buckle
  const [sx, sy] = FP('R', x, y, w, h, 0.42, -0.06);
  poly(ctx, [sx - 1.8 * k, sy, sx + 1.8 * k, sy - 0.9 * k, sx + 2 * k, sy + 2.6 * k, sx + 0.2 * k, sy + 4 * k, sx - 1.6 * k, sy + 3.2 * k], chief ? '#ece6d8' : '#8a6a44');
  poly(ctx, [sx - 1.8 * k, sy, sx + 1.8 * k, sy - 0.9 * k, sx + 1.9 * k, sy + 0.4 * k, sx - 1.7 * k, sy + 1.2 * k], chief ? SILVER : LEATH_D); // the cantle
  for (const d of [-0.9, 0.1, 1.1]) { // the tassels
    line(ctx, sx + d * k, sy + 1.6 * k - d * 0.4 * k, sx + d * k, sy + 3.4 * k - d * 0.4 * k, chief ? '#2a2420' : '#3a2a1a', 0.5 * k);
    ellipse(ctx, sx + d * k, sy + 3.6 * k - d * 0.4 * k, 0.4 * k, 0.5 * k, chief ? SILVER : BRASS);
  }
  // the dirk at the right hip: a black grip with a brass pommel, a long straight blade in its sheath
  const [dx, dy] = FP('R', x, y, w, h, 0.9, 0.05);
  line(ctx, dx, dy - 1.4 * k, dx + 1 * k, dy + 1.2 * k, '#1a1414', 1.1 * k);
  ellipse(ctx, dx - 0.1 * k, dy - 1.6 * k, 0.6 * k, 0.6 * k, BRASS);
  line(ctx, dx + 1 * k, dy + 1.2 * k, dx + 2.6 * k, dy + 5.2 * k, LEATH_D, 1 * k);
  ellipse(ctx, dx + 2.6 * k, dy + 5.2 * k, 0.45 * k, 0.45 * k, BRASS);
}

/** A quilted aketon: buff linen stitched in vertical channels, a high collar, and its long skirt to the knee. */
function aketon(ctx: Ctx, x: number, y: number, w: number, h: number, k: number, skirtOnly = false) {
  const kw = w * 1.14, kh = 3.4 * k, ky = y + 1.4 * k;
  for (const f of ['L', 'R'] as const) {
    faceQuad(ctx, f, x, ky, kw, kh, 0, 1, 0, 1, AKETON);
    for (let i = 1; i < 6; i++) faceQuad(ctx, f, x, ky, kw, kh, i / 6 - 0.012, i / 6 + 0.012, 0, 1, shade(AKETON, -0.24));
    faceQuad(ctx, f, x, ky, kw, kh, 0, 1, 0, 0.1, shade(AKETON, -0.18));
  }
  if (skirtOnly) return;
  for (const f of ['L', 'R'] as const) for (let i = 1; i < 5; i++) faceQuad(ctx, f, x, y, w, h, i / 5 - 0.012, i / 5 + 0.012, 0.08, 0.9, shade(AKETON, -0.22));
  band(ctx, x, y, w, h, 0.88, 1, shade(AKETON, 0.12)); // the collar
}

/** A mail shirt: grey rings over the torso, a dark hem, the rings picked out in rows of dots. */
function mailShirt(ctx: Ctx, x: number, y: number, w: number, h: number, k: number) {
  band(ctx, x, y, w, h, 0.0, 1, MAIL);
  for (const f of ['L', 'R'] as const) for (let r = 0; r < 6; r++) for (let i = 0; i < 6; i++) {
    const [px, py] = FP(f, x, y, w, h, (i + 0.5 + (r % 2) * 0.5) / 6.5, 0.1 + r * 0.15);
    ellipse(ctx, px, py, 0.32 * k, 0.24 * k, r % 2 ? shade(MAIL, -0.3) : shade(MAIL, 0.3));
  }
  band(ctx, x, y, w, h, 0, 0.06, shade(MAIL, -0.4));
}

function torso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const k = w / 10;
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  switch (kind) {
    case 'warrior': case 'archer': case 'highlander': case 'giant': case 'explorer': case 'rider': {
      const s = settOf(kind);
      kilt(ctx, x, y, w, k, s);
      // the shirt: an open neck and a few laces
      R(0.4, 0.6, 0.78, 1, shade(dress(kind)![0], -0.2));
      for (let i = 0; i < 2; i++) R(0.46, 0.54, 0.82 + i * 0.07, 0.85 + i * 0.07, LEATH_D);
      plaid(ctx, x, y, w, h, k, s, kind === 'giant' ? BRASS : SILVER);
      sporran(ctx, x, y, w, h, k, kind === 'giant');
      if (kind === 'archer') band(ctx, x, y, w, h, 0.88, 1, shade(SAFFRON, -0.15));
      return;
    }
    case 'defender': // a galloglass in a long quilted aketon with a mail collar
      aketon(ctx, x, y, w, h, k);
      band(ctx, x, y, w, h, 0.82, 1, MAIL);
      band(ctx, x, y, w, h, 0.1, 0.18, LEATH_D);
      return;
    case 'swordsman': // a mail haubergeon over the aketon, whose quilted skirt shows below
      aketon(ctx, x, y, w, h, k, true);
      mailShirt(ctx, x, y, w, h, k);
      band(ctx, x, y, w, h, 0.12, 0.2, LEATH_D);
      R(0.4, 0.54, 0.12, 0.2, BRASS);
      return;
    case 'knight': { // mail under a blue surcoat bearing the white saltire
      const kw = w * 1.14, kh = 3 * k, ky = y + 1.4 * k;
      band(ctx, x, ky, kw, kh, 0, 1, BLUE);
      band(ctx, x, ky, kw, kh, 0, 0.12, shade(BLUE, -0.3));
      const a = FP('R', x, y, w, h, 0.1, 0.9), b = FP('R', x, y, w, h, 0.9, 0.12), c = FP('R', x, y, w, h, 0.1, 0.12), d = FP('R', x, y, w, h, 0.9, 0.9);
      line(ctx, a[0], a[1], b[0], b[1], WHITE, 1.4 * k);
      line(ctx, c[0], c[1], d[0], d[1], WHITE, 1.4 * k);
      band(ctx, x, y, w, h, 0.86, 1, MAIL);
      band(ctx, x, y, w, h, 0.1, 0.18, LEATH_D);
      return;
    }
    default:
  }
}

/** Wild red hair and beards: a great bushy beard for the grown fighters, a short one for the young. */
function face(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const L = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'L', x, y, w, h, u0, u1, v0, v1, c);
  const big = kind === 'highlander' || kind === 'giant' || kind === 'warrior' || kind === 'defender' || kind === 'swordsman';
  if (big) {
    R(0.04, 0.96, -0.14, 0.3, HAIR); // the beard, down onto the chest
    R(0.2, 0.8, -0.26, -0.1, HAIR);
    R(0.36, 0.64, -0.34, -0.24, shade(HAIR, -0.1));
    for (const u of [0.26, 0.5, 0.74]) R(u, u + 0.03, -0.16, 0.2, shade(HAIR, -0.16)); // strands
    L(0.6, 1, -0.06, 0.4, HAIR);
    R(0.22, 0.48, 0.26, 0.33, HAIR); // the moustache, drooping
    R(0.52, 0.78, 0.26, 0.33, HAIR);
    R(0.4, 0.6, 0.15, 0.2, shade('#f0c8a8', -0.42)); // the mouth showing through
  } else {
    R(0.12, 0.88, 0.0, 0.22, shade(HAIR, 0.06)); // a short beard
    L(0.75, 1, 0.04, 0.34, HAIR);
    R(0.28, 0.72, 0.24, 0.3, HAIR);
  }
}

// ---------------------------------------------------------------- headgear

/** Wild red locks escaping under a bonnet or helmet. */
function wildHair(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const by = top + 3 * k;
  for (const [dx, dy, l, c] of [[-0.5, 0.4, -2, HAIR], [-0.46, 2.4, -2.4, HAIR_D], [-0.4, 4.2, -1.8, HAIR], [0.5, 0.6, 1.6, HAIR], [0.48, 2.2, 1.4, HAIR_D]] as const) {
    const px = x + dx * hw, py = by + dy * k;
    poly(ctx, [px, py - 0.9 * k, px + l * k, py + 0.9 * k, px, py + 1.1 * k], c);
  }
}

/** An eagle's feather along a curve from its quill at (x0, y0): dark brown with a white base and a pale shaft. */
function feather(ctx: Ctx, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, wd: number) {
  const at = (t: number): [number, number] => { const u = 1 - t; return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]; };
  const side = (sgn: number) => {
    const out: number[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10, [px, py] = at(t), [qx, qy] = at(Math.min(1, t + 0.05)), [rx, ry] = at(Math.max(0, t - 0.05));
      const dx = qx - rx, dy = qy - ry, l = Math.hypot(dx, dy) || 1, w = wd * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 0.7) * (t < 0.12 ? t / 0.12 : 1);
      out.push(px - (dy / l) * w * sgn, py + (dx / l) * w * sgn);
    }
    return out;
  };
  const a = side(1), b = side(-1);
  const pts = [...a];
  for (let i = b.length - 2; i >= 0; i -= 2) pts.push(b[i], b[i + 1]);
  poly(ctx, pts, '#3a2618');
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.clip();
  const [mx, my] = at(0.32);
  ellipse(ctx, x0, y0, Math.hypot(mx - x0, my - y0), Math.hypot(mx - x0, my - y0), '#f0ece0'); // the white base
  ctx.restore();
  curve(ctx, x0, y0, cx, cy, x1, y1, wd * 0.22, '#d8ccb0');
}

/** The blue Scots bonnet: a flat, wide knitted crown drooping to one side, a red toorie, a band, and eagle feathers. */
function bonnet(ctx: Ctx, x: number, top: number, k: number, hw: number, feathers: number, diced: boolean) {
  wildHair(ctx, x, top, k, hw);
  const by = top + 1 * k, rx = hw / 2 + 0.4 * k;
  // the headband round the brow
  ellipse(ctx, x, by + 0.4 * k, rx, 2.4 * k, shade(BONNET, -0.35));
  poly(ctx, [x - rx, by, x - rx, by - 1.6 * k, x + rx, by - 1.6 * k, x + rx, by], shade(BONNET, -0.15));
  if (diced) for (let i = 0; i < 8; i++) { // the red-and-white dicing of a regimental band
    const px = x - rx + (i + 0.5) * (2 * rx / 8);
    poly(ctx, [px - rx / 8, by - 0.2 * k, px + rx / 8, by - 0.2 * k, px + rx / 8, by - 1.4 * k, px - rx / 8, by - 1.4 * k], i % 2 ? WHITE : TOORIE);
  }
  // the crown: a wide flat disc, its far edge drooping to the left
  const cx = x - 1 * k, cy = by - 2.6 * k, crx = hw / 2 + 2 * k, cry = 2.9 * k;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.14);
  ellipse(ctx, 0, 1.2 * k, crx, cry, shade(BONNET, -0.3));
  ellipse(ctx, 0, 0, crx, cry, BONNET);
  ellipse(ctx, -crx * 0.25, -cry * 0.25, crx * 0.55, cry * 0.5, shade(BONNET, 0.18));
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; line(ctx, Math.cos(a) * crx * 0.25, Math.sin(a) * cry * 0.25, Math.cos(a) * crx * 0.9, Math.sin(a) * cry * 0.9, 'rgba(0,0,0,0.12)', 0.4 * k); } // knitting
  ctx.restore();
  ellipse(ctx, cx + 0.3 * k, cy - 0.6 * k, 1.3 * k, 1 * k, TOORIE); // the toorie
  ellipse(ctx, cx, cy - 0.9 * k, 0.6 * k, 0.45 * k, shade(TOORIE, 0.35));
  // eagle feathers rising from a silver badge at the side
  const fx = x - rx + 0.6 * k, fy = by - 1.2 * k;
  for (let i = feathers - 1; i >= 0; i--) {
    const d = i - (feathers - 1) / 2;
    feather(ctx, fx, fy, fx - 2 * k + d * 1.2 * k, fy - 5 * k, fx - 7.4 * k + d * 2.4 * k, fy - 7.6 * k - d * 1.4 * k, 1.3 * k);
  }
  ellipse(ctx, fx, fy, 1.2 * k, 1.2 * k, SILVER);
  ellipse(ctx, fx, fy, 0.5 * k, 0.5 * k, '#7a3a8a'); // a cairngorm stone in the badge
}

/** An iron bascinet: a tall pointed bowl, with a mail aventail hanging round the neck and shoulders. */
function bascinet(ctx: Ctx, x: number, top: number, k: number, hw: number, crest?: string) {
  const by = top + 3 * k, rx = hw / 2 + 0.8 * k;
  // the aventail: mail from the rim down over the hair and the neck
  const av = [x - rx, by - 0.6 * k, x - rx - 1 * k, by + 6.6 * k, x - 1 * k, by + 9.6 * k, x + 2 * k, by + 9 * k, x + 1.4 * k, by + 6.4 * k, x - rx * 0.4, by + 3 * k];
  poly(ctx, av, MAIL);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) ellipse(ctx, x - rx - 0.4 * k + i * 1.8 * k + r * 0.4 * k, by + 1.6 * k + r * 2 * k + i * 0.4 * k, 0.3 * k, 0.24 * k, shade(MAIL, r % 2 ? -0.3 : 0.3));
  // the bowl
  const pts = [x - rx, by, x - rx * 0.96, by - 3.6 * k, x - rx * 0.6, by - 6.6 * k, x - 0.6 * k, by - 9.4 * k, x + rx * 0.5, by - 6.2 * k, x + rx * 0.96, by - 3 * k, x + rx, by + 0.6 * k];
  poly(ctx, pts, STEEL);
  poly(ctx, [x + 0.2 * k, by + 1 * k, x - 0.6 * k, by - 9.4 * k, x + rx * 0.5, by - 6.2 * k, x + rx * 0.96, by - 3 * k, x + rx, by + 0.6 * k], shade(STEEL, -0.22));
  curve(ctx, x - rx * 0.6, by - 1 * k, x - rx * 0.66, by - 5 * k, x - 1.4 * k, by - 8 * k, 0.7 * k, STEEL_L);
  line(ctx, x - rx, by - 0.2 * k, x + rx, by + 0.4 * k, STEEL_D, 0.8 * k); // the rim with its vervelles
  for (const d of [-0.8, -0.3, 0.2, 0.7]) ellipse(ctx, x + d * rx, by - 0.4 * k + d * 0.3 * k, 0.35 * k, 0.35 * k, BRASS_L);
  if (crest) { // a crest of plumes for the knight
    for (let i = 0; i < 3; i++) curve(ctx, x - 0.6 * k, by - 9 * k, x - 3 * k - i * k, by - 14 * k + i * k, x - 7 * k - i * 0.8 * k, by - 9 * k + i * 1.4 * k, 1.4 * k, i % 2 ? WHITE : crest);
  }
}

function head(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  switch (kind) {
    case 'warrior': bonnet(ctx, x, top, k, hw, 0, false); return;
    case 'archer': bonnet(ctx, x, top, k, hw, 1, false); return;
    case 'highlander': bonnet(ctx, x, top, k, hw, 1, true); return;
    case 'rider': bonnet(ctx, x, top, k, hw, 1, false); return;
    case 'explorer': bonnet(ctx, x, top, k, hw, 0, false); return;
    case 'giant': bonnet(ctx, x, top, k, hw, 3, true); return; // a chief wears three eagle feathers
    case 'defender': wildHair(ctx, x, top, k, hw); bascinet(ctx, x, top, k, hw); return;
    case 'swordsman': wildHair(ctx, x, top, k, hw); bascinet(ctx, x, top, k, hw); return;
    case 'knight': bascinet(ctx, x, top, k, hw, SALTIRE); return;
    default: return;
  }
}

// ---------------------------------------------------------------- weapons and shields

/** A claymore with its hilt at (hx, hy) pointing along angle `a`: a long blade, quillons sloping toward the point with
 *  quatrefoil ends, a long two-handed grip and a wheel pommel. */
function claymore(ctx: Ctx, hx: number, hy: number, a: number, len: number, k: number) {
  const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
  const P = (t: number, o: number): [number, number] => [hx + ux * t * k + nx * o * k, hy + uy * t * k + ny * o * k];
  // the grip below the guard, wrapped in leather, and the pommel
  line(ctx, ...P(-5.2, 0), ...P(0, 0), LEATH_D, 1.3 * k);
  for (const t of [-4.2, -3, -1.8]) line(ctx, ...P(t, -0.6), ...P(t + 0.5, 0.6), '#5a3a22', 0.4 * k);
  ellipse(ctx, ...P(-5.8, 0), 1.1 * k, 1.1 * k, STEEL_D);
  ellipse(ctx, ...P(-5.9, -0.2), 0.5 * k, 0.5 * k, STEEL_L);
  // the blade, with a fuller and a ricasso
  poly(ctx, [...P(0.6, -0.8), ...P(len - 2, -0.6), ...P(len, 0), ...P(len - 2, 0.6), ...P(0.6, 0.8)], STEEL_L);
  poly(ctx, [...P(0.6, 0), ...P(len - 2, 0), ...P(len, 0), ...P(len - 2, 0.6), ...P(0.6, 0.8)], '#9aa2ac');
  line(ctx, ...P(2.4, 0), ...P(len * 0.7, 0), STEEL_D, 0.3 * k);
  // the guard: quillons sloping toward the point, each ending in a quatrefoil, and langets on the blade
  const g = (s: number) => P(2.4, s * 3.8);
  poly(ctx, [...P(0, -0.7), ...g(-1), ...P(2.6, -3.6), ...P(0.8, -0.6), ...P(0.8, 0.6), ...P(2.6, 3.6), ...g(1), ...P(0, 0.7)], STEEL_D);
  line(ctx, ...P(0.2, -0.5), ...g(-1), STEEL, 0.5 * k);
  line(ctx, ...P(0.2, 0.5), ...g(1), STEEL, 0.5 * k);
  for (const s of [-1, 1]) {
    const [qx, qy] = g(s);
    for (let i = 0; i < 4; i++) { const b = (i / 4) * Math.PI * 2 + Math.PI / 4; ellipse(ctx, qx + Math.cos(b) * 0.65 * k, qy + Math.sin(b) * 0.65 * k, 0.5 * k, 0.5 * k, STEEL_D); }
    ellipse(ctx, qx, qy, 0.4 * k, 0.4 * k, STEEL_L);
  }
  poly(ctx, [...P(0.6, -0.9), ...P(2.6, -0.5), ...P(2.6, 0.5), ...P(0.6, 0.9)], STEEL_D); // the langet
}

/** The round Highland targe: studded leather over wood, tooled rings, a brass boss (with a spike for the highlander). */
function targe(ctx: Ctx, x: number, y: number, k: number, spike: boolean, r = 5.8) {
  const cx = x - 1.4 * k, cy = y - 5.4 * k, rx = r * k * 0.92, ry = r * k;
  ellipse(ctx, cx + 0.9 * k, cy + 0.6 * k, rx, ry, LEATH_D); // its thickness
  ellipse(ctx, cx, cy, rx, ry, LEATH);
  ellipse(ctx, cx - rx * 0.25, cy - ry * 0.3, rx * 0.55, ry * 0.4, shade(LEATH, 0.14));
  ring(ctx, cx, cy, rx * 0.7, ry * 0.7, LEATH_D, 0.4 * k); // tooled rings
  ring(ctx, cx, cy, rx * 0.42, ry * 0.42, LEATH_D, 0.35 * k);
  ring(ctx, cx, cy, rx * 0.97, ry * 0.97, '#2a1a0e', 0.5 * k);
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; ellipse(ctx, cx + Math.cos(a) * rx * 0.85, cy + Math.sin(a) * ry * 0.85, 0.36 * k, 0.36 * k, BRASS_L); }
  for (let i = 0; i < 4; i++) { // studs in a saltire from the boss
    const a = Math.PI / 4 + (i / 4) * Math.PI * 2;
    for (const t of [0.56, 0.7]) ellipse(ctx, cx + Math.cos(a) * rx * t, cy + Math.sin(a) * ry * t, 0.32 * k, 0.32 * k, BRASS);
  }
  ellipse(ctx, cx + 0.3 * k, cy + 0.3 * k, 1.8 * k, 1.8 * k, shade(BRASS, -0.45)); // the boss
  ellipse(ctx, cx, cy, 1.7 * k, 1.7 * k, BRASS);
  ellipse(ctx, cx - 0.5 * k, cy - 0.5 * k, 0.6 * k, 0.6 * k, BRASS_L);
  if (spike) {
    poly(ctx, [cx - 0.6 * k, cy, cx + 0.6 * k, cy, cx - 2.6 * k, cy - 3.6 * k], STEEL);
    line(ctx, cx - 0.2 * k, cy - 0.2 * k, cx - 2.6 * k, cy - 3.6 * k, STEEL_L, 0.3 * k);
  }
}

/** A Lochaber axe: a long pole with a broad cleaver blade bound to it and a hook at the top. */
function lochaber(ctx: Ctx, x: number, y: number, k: number) {
  const x0 = x - 2.4 * k, y0 = y + 8 * k, x1 = x + 3 * k, y1 = y - 26 * k;
  line(ctx, x0, y0, x1, y1, WOOD, 1.2 * k);
  line(ctx, x0 - 0.4 * k, y0, x1 - 0.4 * k, y1, shade(WOOD, 0.35), 0.4 * k);
  const at = (t: number): [number, number] => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
  const [ax, ay] = at(0.62), [bx, by] = at(0.9);
  // the blade: a long cleaver curving forward to a point at the top
  poly(ctx, [ax, ay, ax + 3.4 * k, ay - 0.4 * k, bx + 4.2 * k, by + 1 * k, bx + 2 * k, by - 3 * k, bx, by], STEEL);
  poly(ctx, [ax + 3.4 * k, ay - 0.4 * k, bx + 4.2 * k, by + 1 * k, bx + 2 * k, by - 3 * k, bx + 2.4 * k, by + 0.4 * k, ax + 2.4 * k, ay - 0.2 * k], STEEL_L);
  line(ctx, ax + 3.4 * k, ay - 0.4 * k, bx + 4.2 * k, by + 1 * k, STEEL_D, 0.4 * k);
  for (const t of [0.64, 0.86]) { const [px, py] = at(t); line(ctx, px - 0.8 * k, py, px + 0.8 * k, py, '#2a2a30', 0.7 * k); } // the iron straps
  // the hook at the top of the pole, curling back
  curve(ctx, x1, y1, x1 - 1.4 * k, y1 - 2.6 * k, x1 - 3 * k, y1 - 1 * k, 0.8 * k, STEEL_D);
}

/** A long schiltron pike with a leaf-shaped head. */
function pike(ctx: Ctx, x: number, y: number, k: number, len = 42) {
  const x0 = x - 2.6 * k, y0 = y + 8 * k, x1 = x + 4.4 * k, y1 = y - (len - 8) * k;
  line(ctx, x0, y0, x1, y1, WOOD, 1.1 * k);
  line(ctx, x0 - 0.4 * k, y0, x1 - 0.4 * k, y1, shade(WOOD, 0.4), 0.4 * k);
  poly(ctx, [x1 - 0.9 * k, y1 + 0.6 * k, x1 + 0.6 * k, y1 - 5 * k, x1 + 1.2 * k, y1 + 0.4 * k, x1 + 0.2 * k, y1 + 1.8 * k], STEEL);
  poly(ctx, [x1 + 0.6 * k, y1 - 5 * k, x1 + 1.2 * k, y1 + 0.4 * k, x1 + 0.2 * k, y1 + 1.8 * k], STEEL_D);
  line(ctx, x1 - 0.1 * k, y1 + 1.8 * k, x1 - 0.5 * k, y1 + 4 * k, '#2a2a30', 1 * k); // the socket
}

/** A self bow held upright in the front hand, an arrow on the string. */
function bow(ctx: Ctx, x: number, y: number, k: number) {
  const tx = x + 1 * k, ty = y - 13 * k, bx = x + 1 * k, by = y + 10 * k;
  curve(ctx, tx, ty, x + 6.4 * k, y - 1.4 * k, bx, by, 1.1 * k, '#6a4426');
  curve(ctx, tx, ty, x + 6.4 * k, y - 1.4 * k, bx, by, 0.4 * k, '#a8784a');
  line(ctx, tx, ty, bx - 1.4 * k, y - 1.4 * k, '#e8e0cc', 0.3 * k);
  line(ctx, bx - 1.4 * k, y - 1.4 * k, bx, by, '#e8e0cc', 0.3 * k);
  line(ctx, bx - 1.4 * k, y - 1.4 * k, x + 9 * k, y - 2.4 * k, '#8a6a44', 0.5 * k); // the arrow
  poly(ctx, [x + 9 * k, y - 3.2 * k, x + 10.6 * k, y - 2.5 * k, x + 9 * k, y - 1.7 * k], STEEL_D);
  poly(ctx, [bx - 1.4 * k, y - 1.4 * k, bx - 0.2 * k, y - 2.4 * k, bx + 0.6 * k, y - 1.6 * k], '#e8e0d0'); // fletching
}

/** A traveller's staff of crooked hazel. */
function staff(ctx: Ctx, x: number, y: number, k: number) {
  curve(ctx, x - 1 * k, y + 7 * k, x + 1.4 * k, y - 6 * k, x + 0.6 * k, y - 15 * k, 0.9 * k, '#6a4a2a');
  curve(ctx, x + 0.6 * k, y - 15 * k, x - 0.4 * k, y - 17.4 * k, x - 2 * k, y - 16.2 * k, 0.9 * k, '#6a4a2a');
}

function weapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  switch (kind) {
    case 'warrior': lochaber(ctx, x, y, k); return true;
    case 'archer': bow(ctx, x, y, k); return true;
    case 'defender': pike(ctx, x, y, k, 44); return true; // the targe is drawn by the shield hook
    case 'highlander': // the targe on the arm and the claymore raised high
      targe(ctx, b.off.x, b.off.y, k, true);
      claymore(ctx, x, y, -Math.PI / 2 - 0.32, 22, k);
      return true;
    case 'swordsman': // a galloglass: the great two-handed claymore held up at a slant
      claymore(ctx, x, y, -Math.PI / 2 + 0.28, 21, k);
      return true;
    case 'giant': // a chief's great claymore, and a targe
      targe(ctx, b.off.x, b.off.y, k, true, 6.4);
      claymore(ctx, x, y, -Math.PI / 2 - 0.2, 25, k);
      return true;
    case 'explorer': staff(ctx, x, y, k); return true;
    default: return false;
  }
}

// ---------------------------------------------------------------- horsemen

/** A rider's leg in the stirrup: hose and a brogue, or mail chausses. */
function leg(ctx: Ctx, sx: number, sy: number, hose: string, iron: boolean) {
  poly(ctx, [sx + 0.4, sy + 0.4, sx + 3.8, sy + 0.6, sx + 4.4, sy + 6, sx + 2.2, sy + 6.4], hose);
  poly(ctx, [sx + 2.2, sy + 6.4, sx + 4.4, sy + 6, sx + 4.4, sy + 9.6, sx + 2.4, sy + 9.8], iron ? MAIL : HOSE);
  poly(ctx, [sx + 2.2, sy + 9.6, sx + 4.8, sy + 9.4, sx + 5.8, sy + 10.6, sx + 2.2, sy + 10.8], iron ? STEEL_D : '#4a2e18');
  line(ctx, sx + 1.8, sy + 11, sx + 5, sy + 10.8, STEEL_D, 0.6);
}

/** A light spear for the hobelar, held high. */
function spear(ctx: Ctx, x: number, y: number, len: number) {
  const x0 = x - 3, y0 = y + 7, x1 = x + 5, y1 = y - len;
  line(ctx, x0, y0, x1, y1, WOOD, 1.1);
  line(ctx, x0 - 0.4, y0, x1 - 0.4, y1, shade(WOOD, 0.4), 0.35);
  poly(ctx, [x1 - 0.7, y1 + 0.4, x1 + 0.7, y1 - 4.6, x1 + 1.2, y1 + 0.3, x1 + 0.3, y1 + 1.4], STEEL);
}

/** The hobelar: a light horseman in the plaid on a shaggy dun Highland garron, with a spear and a targe. */
function hobelar(ctx: Ctx, x: number, y: number) {
  const k = 0.84;
  const saddle = drawHorse(ctx, x - 1, y + 3, k, '#b8945c', '#3a2a1a', undefined, '#2a5a80');
  // the garron's shaggy feathered fetlocks and its thick forelock
  for (const [lx, ly] of [[-6, -1.5], [-3, 0.5], [4, -0.5], [7, 1.5]] as const) {
    const fx = x - 1 + lx * k, fy = y + 3 + ly * k;
    poly(ctx, [fx - 1.2, fy - 1.6, fx + 1.3, fy - 1.1, fx + 1.5, fy + 0.4, fx - 1.2, fy + 0.1], '#c8b48a');
  }
  for (let i = 0; i < 4; i++) line(ctx, x + (5.4 + i * 0.9) * k, y + (-14 + i * 1.8) * k, x + (4.2 + i * 0.9) * k, y + (-11.6 + i * 1.8) * k, '#2a1e12', 0.8);
  const b = figure(ctx, 'rider', 'scotland', saddle.x, saddle.y, 0.86, true);
  leg(ctx, saddle.x, saddle.y, HOSE, false);
  targe(ctx, b.off.x - 0.4, b.off.y + 1.6, 0.56, false);
  spear(ctx, b.hand.x, b.hand.y, 26);
}

/** A blue caparison over the horse, hemmed in white, with the white saltire on the flank, and a steel chamfron. */
function caparison(ctx: Ctx, x: number, y: number, k: number) {
  const bx = x - 1, by = y + 3 - 6 * k, bw = 17 * k, bh = 7 * k;
  for (const f of ['L', 'R'] as const) {
    faceQuad(ctx, f, bx, by, bw, bh, 0, 1, -0.34, 0.96, SALTIRE);
    faceQuad(ctx, f, bx, by, bw, bh, 0, 1, -0.34, -0.22, WHITE);
    for (let i = 0; i < 7; i++) faceQuad(ctx, f, bx, by, bw, bh, i / 7 + 0.04, i / 7 + 0.1, -0.42, -0.34, shade(SALTIRE, -0.3));
  }
  const [cx, cy] = FP('L', bx, by, bw, bh, 0.36, 0.34);
  line(ctx, cx - 3, cy - 2.6, cx + 3, cy + 2.6, WHITE, 1.2);
  line(ctx, cx + 3, cy - 2.4, cx - 3, cy + 2.8, WHITE, 1.2);
  const [rx, ry] = FP('R', bx, by, bw, bh, 0.5, 0.34);
  line(ctx, rx - 2.6, ry - 2.4, rx + 2.6, ry + 1.6, WHITE, 1.1);
  line(ctx, rx + 2.6, ry - 2.6, rx - 2.6, ry + 1.8, WHITE, 1.1);
  // the chamfron over the face
  const hhx = x - 1 + 10.5 * k, hhy = y + 3 - 15 * k;
  faceQuad(ctx, 'R', hhx, hhy, 7 * k, 5 * k, 0.08, 0.72, 0.3, 0.98, STEEL);
  faceQuad(ctx, 'R', hhx, hhy, 7 * k, 5 * k, 0.36, 0.44, 0.3, 0.98, STEEL_L);
}

/** A lance flying a saltire pennon. */
function lance(ctx: Ctx, x: number, y: number, len: number) {
  const x0 = x - 3, y0 = y + 8, x1 = x + 5, y1 = y - len;
  line(ctx, x0, y0, x1, y1, '#8a5a30', 1.3);
  line(ctx, x0 - 0.4, y0, x1 - 0.4, y1, '#b8844a', 0.4);
  poly(ctx, [x1 + 0.6, y1 - 5, x1 - 0.8, y1 - 0.4, x1 + 0.2, y1 + 0.8, x1 + 1.4, y1 - 0.2], STEEL_L);
  poly(ctx, [x1 + 0.6, y1 - 5, x1 + 1.4, y1 - 0.2, x1 + 0.2, y1 + 0.8], STEEL_D);
  ellipse(ctx, x - 0.4, y + 1, 1.6, 1, STEEL);
  saltireFlag(ctx, x1 - 0.2, y1 + 1.6, 9.4, 6.4, 0.7);
  poly(ctx, [x1 + 9.2, y1 + 1.6, x1 + 12.4, y1 + 4.8, x1 + 9.2, y1 + 8], SALTIRE); // a swallow tail
}

/** The knight: a mailed man-at-arms in a blue surcoat on a grey charger in a saltire caparison. */
function knight(ctx: Ctx, x: number, y: number) {
  const k = 0.95;
  const saddle = drawHorse(ctx, x - 1, y + 3, k, '#d8d4cc', '#8a8a86', undefined, SALTIRE);
  caparison(ctx, x, y, k);
  const b = figure(ctx, 'knight', 'scotland', saddle.x, saddle.y, 0.9, true);
  leg(ctx, saddle.x, saddle.y, MAIL, true);
  targe(ctx, b.off.x - 0.6, b.off.y + 1.8, 0.6, false);
  lance(ctx, b.hand.x, b.hand.y, 31);
}

// ---------------------------------------------------------------- the trebuchet

function trebuchet(ctx: Ctx, x: number, y: number) {
  const beam = (x0: number, y0: number, x1: number, y1: number, w: number) => {
    line(ctx, x0, y0, x1, y1, WOOD_D, w + 0.6);
    line(ctx, x0, y0, x1, y1, WOOD, w);
    line(ctx, x0 - 0.3, y0 - 0.3, x1 - 0.3, y1 - 0.3, shade(WOOD, 0.3), w * 0.3);
  };
  // the ground frame: two long sills and cross pieces
  beam(x - 14, y + 1, x + 8, y - 6, 1.6);
  beam(x - 8, y + 6, x + 14, y - 1, 1.6);
  beam(x - 14, y + 1, x - 8, y + 6, 1.4);
  beam(x + 8, y - 6, x + 14, y - 1, 1.4);
  // the far A-frame
  beam(x - 6, y - 2, x - 1, y - 24, 1.4);
  beam(x + 4, y - 5, x - 1, y - 24, 1.4);
  // the throwing arm: long behind, short to the counterweight, pivoting on the axle
  const px = x, py = y - 22;
  const ax = px + 22, ay = py - 14; // the tip of the long arm, raised
  const cx = px - 7, cy = py + 4.4; // the counterweight end
  beam(cx, cy, ax, ay, 1.6);
  // the sling hanging from the tip with a stone
  line(ctx, ax, ay, ax + 2.4, ay + 9, '#c8b888', 0.5);
  line(ctx, ax, ay, ax - 1, ay + 9, '#c8b888', 0.5);
  ellipse(ctx, ax + 0.6, ay + 9.6, 1.8, 1.6, '#8a8a84');
  ellipse(ctx, ax + 0.1, ay + 9.1, 0.7, 0.6, '#b8b8b0');
  // the counterweight: a timber box of stones hung from the short arm
  line(ctx, cx - 1, cy, cx - 1.6, cy + 4, '#3a2a1a', 0.7);
  line(ctx, cx + 1, cy, cx + 1.6, cy + 4, '#3a2a1a', 0.7);
  box(ctx, cx, cy + 10.6, 7, 6.4, '#6a4a2c', '#5a5a56');
  band(ctx, cx, cy + 10.6, 7, 6.4, 0.1, 0.2, '#2a2a30');
  band(ctx, cx, cy + 10.6, 7, 6.4, 0.78, 0.88, '#2a2a30');
  for (const [dx, dy] of [[-1.6, 2.4], [0.6, 2], [1.8, 2.8], [-0.4, 3]] as const) ellipse(ctx, cx + dx, cy + 10.6 - 6.4 - dy + 3.8, 1, 0.7, '#9a9a94');
  // the near A-frame, over the arm, and the axle
  beam(x - 8, y + 3, px, py, 1.6);
  beam(x + 6, y, px, py, 1.6);
  beam(x - 5, y - 4, x + 3, y - 7, 1);
  ellipse(ctx, px, py, 1.4, 1.4, '#2a2a30');
  ellipse(ctx, px - 0.4, py - 0.4, 0.5, 0.5, STEEL_L);
  // the windlass to winch the arm down
  ellipse(ctx, x - 10, y + 2, 2.4, 2.4, WOOD_D);
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI; line(ctx, x - 10 - Math.cos(a) * 3.2, y + 2 - Math.sin(a) * 3.2, x - 10 + Math.cos(a) * 3.2, y + 2 + Math.sin(a) * 3.2, WOOD, 0.7); }
  // a crewman in the plaid, and the saltire on a pole
  const g = figure(ctx, 'warrior', 'scotland', x - 15, y + 5, 0.52);
  line(ctx, g.hand.x, g.hand.y, x - 10.6, y + 1, WOOD, 0.6);
  line(ctx, x + 14, y + 3, x + 14, y - 18, WOOD_D, 0.8);
  saltireFlag(ctx, x + 14, y - 18, 8, 5.4, 0.5);
}

// ---------------------------------------------------------------- the birlinn

function foam(ctx: Ctx, x: number, y: number, w: number) {
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y, w, 2.2, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.stroke();
}

/** A square sail on a yard, bellied by the wind: plain or with a saltire or a black galley (the lymphad). */
function squareSail(ctx: Ctx, mx: number, yTop: number, w: number, h: number, look: 'plain' | 'stripe' | 'saltire') {
  const l = mx - w / 2, r = mx + w / 2, b = yTop + h;
  line(ctx, l - 1.6, yTop - 0.4, r + 1.6, yTop + 0.4, WOOD_D, 1.1);
  const pts = [l, yTop, r, yTop + 0.4, r + 1.6, b - h * 0.45, r + 0.4, b, mx, b + 1.8, l - 0.4, b - 0.2, l - 1.6, b - h * 0.45];
  poly(ctx, pts, '#e8dcc0');
  poly(ctx, [mx, yTop + 0.2, r, yTop + 0.4, r + 1.6, b - h * 0.45, r + 0.4, b, mx, b + 1.8], '#d0c4a6');
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.clip();
  if (look === 'stripe') for (const d of [-0.18, 0.18]) poly(ctx, [mx + d * w - w * 0.08, yTop, mx + d * w + w * 0.08, yTop, mx + d * w + w * 0.08, b + 2, mx + d * w - w * 0.08, b + 2], d < 0 ? BLUE : shade(BLUE, -0.15));
  if (look === 'saltire') {
    poly(ctx, [l - 2, yTop - 1, r + 2, yTop - 1, r + 2, b + 2, l - 2, b + 2], 'rgba(26,90,184,0.92)');
    line(ctx, l - 1, yTop, r + 1.4, b + 1.4, WHITE, h * 0.2);
    line(ctx, r + 1, yTop, l - 1.4, b + 1.4, WHITE, h * 0.2);
  }
  ctx.restore();
  for (const t of [0.25, 0.75]) line(ctx, l + t * w, yTop + 1, l + t * w + (t - 0.5) * 2, b, 'rgba(0,0,0,0.1)', 0.5);
  for (let i = 1; i < 4; i++) line(ctx, l, yTop + (h * i) / 4, r, yTop + (h * i) / 4 + 0.4, 'rgba(0,0,0,0.07)', 0.4); // reef bands
}

/** The birlinn's hull: clinker strakes, a low waist rising to a high stem and sternpost, oars out along the side. */
function birlinn(ctx: Ctx, x: number, y: number, w: number, oars: number, posts: number) {
  const top = (t: number) => y - 3.6 - Math.pow(Math.abs(t), 4) * posts;
  const near: [number, number][] = [];
  for (let i = 0; i <= 16; i++) { const t = -1 + i / 8; near.push([x + t * w, top(t)]); }
  const far = near.map(([a, b], i) => [a + (i === 0 ? 1.4 : i === 16 ? -1.4 : 0), b - 2] as [number, number]);
  poly(ctx, [...near.flat(), ...[...far].reverse().flat()], '#3a2414'); // the inside of the far side
  // thwarts across the inside
  for (let i = 1; i < 6; i++) { const t = -0.7 + i * 0.23; line(ctx, x + t * w, top(t) - 0.4, x + t * w + 1.4, top(t) - 2.2, '#6a4426', 0.8); }
  return {
    draw() {
      const keel: [number, number][] = [...near, [x + w * 0.92, y - 1], [x + w * 0.5, y + 2.4], [x, y + 3], [x - w * 0.5, y + 2.6], [x - w * 0.92, y - 0.8]];
      poly(ctx, keel.flat(), '#5a3a1e');
      poly(ctx, [...near.flat(), x + w * 0.94, y - 2.4, x, y - 1.6, x - w * 0.94, y - 2.2], '#8a5a30');
      // the clinker strakes, overlapping planks following the sheer
      for (let s = 1; s <= 3; s++) {
        ctx.strokeStyle = ink(s % 2 ? '#4a2c14' : '#a87444');
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        near.forEach(([a, b], i) => { const t = -1 + i / 8, yy = b + s * 1.5 * (1 - Math.pow(Math.abs(t), 3) * 0.6); if (i) ctx.lineTo(a, yy); else ctx.moveTo(a, yy); });
        ctx.stroke();
      }
      ctx.strokeStyle = ink('#2a1a0e');
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      near.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)));
      ctx.stroke();
      // the high stem and sternpost, carried up past the gunwale
      const [sx, sy] = near[16], [bx, by] = near[0];
      curve(ctx, sx - 1, sy + 2, sx + 1.6, sy - 1, sx + 0.6, sy - 4.6, 1.6, '#6a4426');
      curve(ctx, bx + 1, by + 2, bx - 1.6, by - 1, bx - 0.4, by - 4.4, 1.6, '#6a4426');
      // the stern rudder hung on the sternpost, with its tiller
      poly(ctx, [bx - 0.6, by + 2, bx - 2.6, by + 3, bx - 3, y + 4.6, bx - 0.6, y + 3.4], '#5a3a1e');
      line(ctx, bx - 0.4, by + 1, bx + 4, by - 0.6, '#5a3a1e', 0.7);
      // oars out through the oar-ports, dipping into the water
      for (let i = 0; i < oars; i++) {
        const t = -0.6 + (i + 0.5) * (1.2 / oars), px = x + t * w, py = top(t) + 1.6;
        ellipse(ctx, px, py, 0.5, 0.4, '#1a100a');
        line(ctx, px, py, px + 2.4, y + 4.8, '#a07a4a', 0.7);
        ellipse(ctx, px + 2.6, y + 5.2, 1, 0.5, 'rgba(255,255,255,0.6)');
      }
    },
    top,
  };
}

function boat(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  if (kind === 'boat') {
    const w = 17;
    const h = birlinn(ctx, x, y, w, 4, 8);
    line(ctx, x, y - 3, x, y - 25, WOOD_D, 1.1);
    for (const [a, b] of [[x - w + 1, h.top(-1)], [x + w - 1, h.top(1)]] as const) line(ctx, a, b, x, y - 24, 'rgba(60,40,24,0.55)', 0.4);
    squareSail(ctx, x, y - 23, 15, 13, 'stripe');
    figure(ctx, 'warrior', 'scotland', x - 9, y - 3.4, 0.4, true);
    h.draw();
    poly(ctx, [x, y - 25, x + 6, y - 24.2, x, y - 23.4], SALTIRE);
    foam(ctx, x, y + 3.2, w * 0.86);
    return;
  }
  if (kind === 'ship') {
    const w = 21;
    const h = birlinn(ctx, x, y, w, 6, 9);
    line(ctx, x + 1, y - 3, x + 1, y - 31, WOOD_D, 1.2);
    for (const [a, b] of [[x - w + 1, h.top(-1)], [x + w - 1, h.top(1)]] as const) line(ctx, a, b, x + 1, y - 30, 'rgba(60,40,24,0.55)', 0.4);
    squareSail(ctx, x + 1, y - 29, 19, 16, 'stripe');
    figure(ctx, 'highlander', 'scotland', x - 13, y - 3.6, 0.38, true);
    figure(ctx, 'archer', 'scotland', x + 10, y - 3.4, 0.38, true);
    h.draw();
    saltireFlag(ctx, x + 1, y - 35, 6.4, 4.2, 0.4);
    line(ctx, x + 1, y - 31, x + 1, y - 35, WOOD_D, 0.7);
    foam(ctx, x, y + 3.2, w * 0.86);
    return;
  }
  // the warship: a great galley of the Lords of the Isles, with a fighting top and a castle at the stern
  const w = 26;
  const h = birlinn(ctx, x, y, w, 8, 10);
  line(ctx, x + 1, y - 3, x + 1, y - 40, WOOD_D, 1.4);
  for (const [a, b] of [[x - w + 1, h.top(-1)], [x + w - 1, h.top(1)]] as const) line(ctx, a, b, x + 1, y - 38, 'rgba(60,40,24,0.55)', 0.4);
  squareSail(ctx, x + 1, y - 36, 23, 20, 'saltire');
  ellipse(ctx, x + 1, y - 40, 2.4, 1, '#5a3418'); // the fighting top
  figure(ctx, 'swordsman', 'scotland', x - 16, y - 3.6, 0.36, true);
  figure(ctx, 'highlander', 'scotland', x + 13, y - 3.6, 0.36, true);
  h.draw();
  // the stern castle: a little timber fighting platform with a rail
  const sx = x - w * 0.72, sy = y - 5.4;
  box(ctx, sx, sy, 8, 4.4, '#7a4a26', '#9a6a40');
  band(ctx, sx, sy, 8, 4.4, 0.6, 0.76, BLUE);
  for (let i = 0; i < 5; i++) faceQuad(ctx, 'L', sx, sy - 4.4, 8, 1.6, i / 5 + 0.04, i / 5 + 0.1, 0, 1, '#5a3418');
  figure(ctx, 'archer', 'scotland', sx, sy - 4.6, 0.32, true);
  line(ctx, x + 1, y - 40, x + 1, y - 46, WOOD_D, 0.8);
  saltireFlag(ctx, x + 1, y - 46, 9, 6, 0.6);
  foam(ctx, x, y + 3.2, w * 0.88);
}

// ---------------------------------------------------------------- buildings

/** A pitched roof over a w×w box whose top is at (x, y): the ridge runs parallel to the R face; the gable end faces left,
 *  with crow steps (or a plain gable) on the left wall. */
function gabledRoof(ctx: Ctx, x: number, y: number, w: number, rh: number, roofC: string, wallC: string, steps: number) {
  const hw = w / 2, hh = w / 4;
  const Lc: [number, number] = [x - hw, y], F: [number, number] = [x, y + hh], Rc: [number, number] = [x + hw, y], B: [number, number] = [x, y - hh];
  const M1: [number, number] = [(Lc[0] + F[0]) / 2, (Lc[1] + F[1]) / 2 - rh], M2: [number, number] = [(B[0] + Rc[0]) / 2, (B[1] + Rc[1]) / 2 - rh];
  poly(ctx, [...Lc, ...B, ...M2, ...M1], shade(roofC, 0.14)); // the back slope, lit
  poly(ctx, [...F, ...Rc, ...M2, ...M1], shade(roofC, -0.18)); // the front slope
  for (let i = 1; i < 5; i++) { // slate courses
    const t = i / 5;
    line(ctx, F[0] + (M1[0] - F[0]) * t, F[1] + (M1[1] - F[1]) * t, Rc[0] + (M2[0] - Rc[0]) * t, Rc[1] + (M2[1] - Rc[1]) * t, shade(roofC, -0.34), 0.35);
  }
  line(ctx, M1[0], M1[1], M2[0], M2[1], shade(roofC, 0.35), 0.6);
  // the gable on the left wall
  const G = (u: number, z: number): [number, number] => [Lc[0] + (F[0] - Lc[0]) * u, Lc[1] + (F[1] - Lc[1]) * u - z];
  const pts: number[] = [...G(0, 0)];
  if (steps > 0) {
    const n = steps;
    for (let i = 0; i < n; i++) { // rising: up, then along
      const z = rh * ((i + 1) / (n + 0.4)) + 1;
      pts.push(...G(i / (2 * n), z), ...G((i + 1) / (2 * n), z));
    }
    pts.push(...G(0.5, rh + 1.6));
    for (let i = n - 1; i >= 0; i--) {
      const z = rh * ((i + 1) / (n + 0.4)) + 1;
      pts.push(...G(1 - (i + 1) / (2 * n), z), ...G(1 - i / (2 * n), z));
    }
  } else pts.push(...G(0.5, rh));
  pts.push(...G(1, 0));
  poly(ctx, pts, shade(wallC, 0.08));
  if (steps > 0) for (let i = 0; i < steps; i++) { // the cope stones on each step
    const z = rh * ((i + 1) / (steps + 0.4)) + 1;
    for (const u0 of [i / (2 * steps), 1 - (i + 1) / (2 * steps)]) { const a = G(u0, z), b = G(u0 + 1 / (2 * steps), z); line(ctx, a[0], a[1], b[0], b[1], shade(wallC, -0.3), 0.6); }
  }
  // a chimney at the gable top
  const c = G(0.5, rh + 1.6);
  box(ctx, c[0], c[1] + 1, 2.2, 2.6, wallC);
  box(ctx, c[0], c[1] - 1.6, 2.6, 0.7, shade(wallC, -0.2));
}

/** A small window: a dark opening with a pale stone surround. */
function win(ctx: Ctx, f: 'L' | 'R', x: number, y: number, w: number, h: number, u: number, v: number, du = 0.12, dv = 0.12) {
  faceQuad(ctx, f, x, y, w, h, u - 0.02, u + du + 0.02, v - 0.02, v + dv + 0.02, '#e8e2d2');
  faceQuad(ctx, f, x, y, w, h, u, u + du, v, v + dv, '#2a2a32');
}

/** A corbelled turret (bartizan) at (x, y) on a wall top: a stepped corbel under a little round tower and a conical slate cap. */
function bartizan(ctx: Ctx, x: number, y: number, r: number, h: number, wallC: string, roofC: string) {
  for (let i = 0; i < 3; i++) { // the corbel courses, stepping out
    const rr = r * (0.5 + i * 0.18), yy = y + 3 - i * 1;
    ellipse(ctx, x, yy, rr, rr * 0.5, shade(wallC, -0.2 - i * 0.04));
  }
  poly(ctx, [x - r, y, x - r, y - h, x + r, y - h, x + r, y], wallC);
  poly(ctx, [x + r * 0.2, y + r * 0.5, x + r * 0.2, y - h, x + r, y - h, x + r, y], shade(wallC, -0.22));
  ellipse(ctx, x, y, r, r * 0.5, wallC);
  poly(ctx, [x - r, y - 0.6, x + r, y - 0.6, x + r, y], shade(wallC, -0.1));
  faceQuad(ctx, 'R', x - r, y, r * 2, h, 0.3, 0.46, 0.4, 0.66, '#2a2a32'); // a slit window
  poly(ctx, [x - r - 0.6, y - h, x + r + 0.6, y - h, x, y - h - r * 2.6], shade(roofC, 0.06));
  poly(ctx, [x + 0.2, y - h + 0.4, x + r + 0.6, y - h, x, y - h - r * 2.6], shade(roofC, -0.24));
  ellipse(ctx, x, y - h, r + 0.6, (r + 0.6) * 0.45, shade(roofC, -0.1));
  line(ctx, x, y - h - r * 2.6, x, y - h - r * 2.6 - 1.4, '#3a3a40', 0.4);
}

/** A tower house: a tall harled tower, a door at the foot, small windows, corbelled turrets at the corners of the wall
 *  head and a crow-stepped gabled roof between them. */
function towerHouse(ctx: Ctx, x: number, y: number, w: number, h: number, roofC: string, wallC = HARL) {
  box(ctx, x, y, w, h, wallC);
  band(ctx, x, y, w, h, 0, 0.06, shade(wallC, -0.25)); // the plinth
  faceQuad(ctx, 'R', x, y, w, h, 0.4, 0.56, 0, 0.18, '#3a2a20'); // the door, under a carved armorial panel
  faceQuad(ctx, 'R', x, y, w, h, 0.42, 0.54, 0.22, 0.3, shade(wallC, -0.12));
  win(ctx, 'R', x, y, w, h, 0.16, 0.42); win(ctx, 'R', x, y, w, h, 0.7, 0.46); win(ctx, 'R', x, y, w, h, 0.42, 0.64);
  win(ctx, 'L', x, y, w, h, 0.36, 0.5); win(ctx, 'L', x, y, w, h, 0.6, 0.72);
  for (const f of ['L', 'R'] as const) faceQuad(ctx, f, x, y, w, h, 0.6, 0.66, 0.24, 0.32, '#2a2a32'); // gun loops
  // a corbel table running round the wall head
  for (const f of ['L', 'R'] as const) {
    faceQuad(ctx, f, x, y, w, h, 0, 1, 0.9, 0.96, shade(wallC, -0.16));
    for (let i = 0; i < 6; i++) faceQuad(ctx, f, x, y, w, h, i / 6 + 0.04, i / 6 + 0.1, 0.86, 0.9, shade(wallC, -0.3));
  }
  gabledRoof(ctx, x, y - h, w * 0.9, w * 0.62, roofC, wallC, 3);
  // turrets at the left and front corners of the wall head
  bartizan(ctx, x - w / 2 + 0.4, y - h + 1, w * 0.12, w * 0.32, wallC, roofC);
  bartizan(ctx, x, y + w / 4 - h + 1.2, w * 0.12, w * 0.32, wallC, roofC);
  bartizan(ctx, x + w / 2 - 0.4, y - h + 1, w * 0.11, w * 0.28, wallC, roofC);
}

/** Rough drystone coursing on a wall face. */
function rubble(ctx: Ctx, x: number, y: number, w: number, h: number, c: string, seed: number) {
  for (const f of ['L', 'R'] as const) for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) {
    const u = (i + (r % 2) * 0.5) / 4.4 + 0.04, v = 0.1 + r * 0.22;
    faceQuad(ctx, f, x, y, w, h, u, u + 0.16 + rand(seed, r * 4 + i) * 0.06, v, v + 0.14, shade(c, (rand(seed + 3, r * 4 + i) - 0.5) * 0.24));
  }
}

/** A croft (blackhouse): low, thick drystone walls, a rounded heather thatch held down by ropes weighted with stones. */
function croft(ctx: Ctx, x: number, y: number, w: number, h: number, seed: number, door: boolean) {
  box(ctx, x, y, w, h, STONE);
  rubble(ctx, x, y, w, h, STONE, seed);
  if (door) { faceQuad(ctx, 'R', x, y, w, h, 0.38, 0.56, 0, 0.78, '#3a2a1e'); faceQuad(ctx, 'R', x, y, w, h, 0.4, 0.54, 0, 0.72, '#5a3a22'); }
  win(ctx, 'L', x, y, w, h, 0.5, 0.4, 0.14, 0.24);
  // the thatch: a rounded hipped mound overhanging a little
  const hw = w / 2 + 0.8, hh = hw / 2, tx = x, ty = y - h + 0.6, th = w * 0.38;
  const ptsL = [tx - hw, ty, tx, ty + hh, tx + 0.4, ty + hh - th * 0.7, tx - hw * 0.4, ty - th * 0.92, tx - hw * 0.8, ty - th * 0.5];
  const ptsR = [tx, ty + hh, tx + hw, ty, tx + hw * 0.8, ty - th * 0.5, tx + hw * 0.2, ty - th, tx - hw * 0.4, ty - th * 0.92, tx + 0.4, ty + hh - th * 0.7];
  poly(ctx, ptsR, shade(THATCH, -0.2));
  poly(ctx, ptsL, shade(THATCH, 0.08));
  ellipse(ctx, tx - hw * 0.1, ty - th * 0.86, hw * 0.4, th * 0.24, shade(THATCH, 0.18));
  for (let i = 0; i < 8; i++) { const a = rand(seed, i) * hw * 1.6 - hw * 0.8; line(ctx, tx + a, ty - th * 0.6, tx + a * 1.1, ty - th * 0.1, shade(THATCH, -0.3), 0.3); } // straw texture
  // the ropes over the ridge, each weighted with a stone at the eaves
  for (let i = 0; i < 4; i++) {
    const t = (i + 0.5) / 4;
    const ex = tx - hw * 0.15 + hw * 1.05 * t, ey = ty - th * 0.95 + (hh + th * 0.6) * t;
    curve(ctx, tx - hw * 0.5 + hw * 0.6 * t, ty - th * 0.95 + t * 1.2, ex + 1, (ey + ty - th) / 2, ex + 2, ey + 2, 0.35, '#4a3a24');
    ellipse(ctx, ex + 2, ey + 2.6, 0.9, 0.8, '#6a6a66');
  }
  // peat smoke seeping from the thatch
  ellipse(ctx, tx - hw * 0.1, ty - th - 2, 1.6, 1.1, 'rgba(180,180,180,0.35)');
  ellipse(ctx, tx - hw * 0.3, ty - th - 4.4, 2.2, 1.4, 'rgba(190,190,190,0.25)');
}

/** A stack of cut peats drying by the croft. */
function peatStack(ctx: Ctx, x: number, y: number) {
  for (let r = 0; r < 3; r++) for (let i = 0; i < 4 - r; i++) {
    const px = x - 3 + i * 2 + r, py = y - r * 1.4;
    box(ctx, px, py, 1.9, 1.3, '#3a2a1e', '#5a4030');
  }
}

/** A Highland sheep, shaggy and horned: a white fleece, a black face. */
function sheep(ctx: Ctx, x: number, y: number) {
  ellipse(ctx, x, y - 1.6, 2.6, 1.6, '#e8e2d2');
  ellipse(ctx, x - 0.6, y - 2.2, 1.6, 0.9, '#f8f4ea');
  ellipse(ctx, x + 2.6, y - 2.2, 0.9, 0.8, '#2a2420');
  curve(ctx, x + 2.4, y - 2.8, x + 3.6, y - 3.6, x + 3.2, y - 2, 0.4, '#c8b890');
  for (const d of [-1.4, 1.2]) line(ctx, x + d, y - 0.6, x + d, y + 0.6, '#2a2420', 0.5);
}

/** A drystone dyke running along the ground. */
function dyke(ctx: Ctx, x0: number, y0: number, x1: number, y1: number) {
  line(ctx, x0, y0 + 0.4, x1, y1 + 0.4, '#5a5a56', 2);
  line(ctx, x0, y0 - 0.6, x1, y1 - 0.6, '#9a9a94', 1.4);
  const n = Math.round(Math.hypot(x1 - x0, y1 - y0) / 1.6);
  for (let i = 0; i <= n; i++) ellipse(ctx, x0 + (x1 - x0) * (i / n), y0 + (y1 - y0) * (i / n) - 1.4, 0.7, 0.5, i % 2 ? '#b0b0a8' : '#8a8a84');
}

/** A harled cottage under slate with a crow-stepped gable. */
function cottage(ctx: Ctx, x: number, y: number, w: number, h: number, roofC: string) {
  box(ctx, x, y, w, h, '#ece6d6');
  faceQuad(ctx, 'R', x, y, w, h, 0.4, 0.58, 0, 0.66, '#2a4a6a'); // a painted door
  win(ctx, 'R', x, y, w, h, 0.1, 0.36, 0.16, 0.3); win(ctx, 'R', x, y, w, h, 0.72, 0.36, 0.16, 0.3);
  win(ctx, 'L', x, y, w, h, 0.42, 0.36, 0.16, 0.3);
  gabledRoof(ctx, x, y - h, w, w * 0.42, roofC, '#ece6d6', 2);
}

/** The capital: a castle on a crag of black volcanic rock: a curtain wall, round towers, a great hall, a tower house
 *  keep with turrets, the half-moon battery and the saltire flying over all. */
function castle(ctx: Ctx, x: number, y: number, roofC: string) {
  const wall = '#9a948a', wallL = '#b0aa9e';
  ellipse(ctx, x, y + 7, 27, 8, 'rgba(0,0,0,0.16)');
  // the crag: steep dark basalt cliffs, with columns and a green top
  poly(ctx, [x - 26, y + 8, x - 23, y - 8, x - 14, y - 15, x + 6, y - 16, x + 21, y - 11, x + 26, y + 3, x + 15, y + 12, x - 8, y + 13], BASALT);
  poly(ctx, [x - 26, y + 8, x - 23, y - 8, x - 14, y - 15, x - 6, y - 12, x - 8, y + 4, x - 8, y + 13], shade(BASALT, 0.16));
  poly(ctx, [x + 26, y + 3, x + 21, y - 11, x + 14, y - 8, x + 15, y + 12], shade(BASALT, -0.12));
  for (const [dx, h] of [[-21, 12], [-16, 16], [-11, 18], [-3, 19], [5, 18], [12, 15], [19, 10], [23, 6]] as const) line(ctx, x + dx, y + 11 - Math.abs(dx) * 0.12, x + dx + 0.5, y + 11 - h, shade(BASALT, -0.28), 0.7); // basalt columns
  for (const [dx, dy] of [[-18, 4], [17, 0], [-6, 9], [9, 8], [-22, -2]] as const) { ellipse(ctx, x + dx, y + dy, 2, 1, '#3a4a2a'); ellipse(ctx, x + dx, y + dy - 0.5, 1.4, 0.7, '#9a5aa8'); } // heather in the cracks
  poly(ctx, [x - 23, y - 8, x - 14, y - 15, x + 6, y - 16, x + 21, y - 11, x + 10, y - 9, x - 10, y - 8], '#5a7a44');
  ctx.save();
  ctx.translate(0, -7);
  // the great hall behind, its long slate roof
  box(ctx, x + 6, y - 8, 14, 8, wall, wallL);
  for (const u of [0.2, 0.45, 0.7]) faceQuad(ctx, 'R', x + 6, y - 8, 14, 8, u, u + 0.12, 0.4, 0.8, '#2a2a32');
  gabledRoof(ctx, x + 6, y - 16, 13, 6, roofC, wall, 2);
  // the curtain wall along the crag's edge, with crenellations
  box(ctx, x - 2, y + 1, 30, 6, wall, wallL);
  for (const f of ['L', 'R'] as const) for (let i = 0; i < 10; i++) faceQuad(ctx, f, x - 2, y - 5, 30, 1.6, i / 10 + 0.02, i / 10 + 0.07, 0, 1, wall);
  faceQuad(ctx, 'R', x - 2, y + 1, 30, 6, 0.26, 0.36, 0, 0.7, '#2a2020'); // the gate
  faceQuad(ctx, 'R', x - 2, y + 1, 30, 6, 0.27, 0.35, 0.56, 0.62, '#4a3a2a'); // the portcullis bar
  // the half-moon battery: a great round bastion at the front corner
  ellipse(ctx, x - 2, y + 9, 7, 3.2, shade(wall, -0.18));
  poly(ctx, [x - 9, y + 9, x - 9, y + 2, x + 5, y + 2, x + 5, y + 9], wall);
  poly(ctx, [x - 2, y + 12.2, x - 2, y + 5.2, x + 5, y + 2, x + 5, y + 9], shade(wall, -0.2));
  ellipse(ctx, x - 2, y + 2, 7, 3.2, wallL);
  ellipse(ctx, x - 2, y + 2.4, 5.6, 2.4, shade(wall, -0.1));
  for (let i = 0; i < 5; i++) { const a = Math.PI * (0.15 + i * 0.18); ellipse(ctx, x - 2 + Math.cos(a) * 6.2, y + 2 + Math.sin(a) * 2.8 + 2.4, 0.7, 0.5, '#2a2a32'); } // gun ports
  // the keep: a tall tower house with turrets
  towerHouse(ctx, x - 12, y - 4, 10, 17, roofC, wallL);
  // a round tower at the right end of the wall
  ellipse(ctx, x + 13, y + 5, 3.6, 1.8, shade(wall, -0.2));
  poly(ctx, [x + 9.4, y + 5, x + 9.4, y - 7, x + 16.6, y - 7, x + 16.6, y + 5], wall);
  poly(ctx, [x + 13.4, y + 6.8, x + 13.4, y - 5.2, x + 16.6, y - 7, x + 16.6, y + 5], shade(wall, -0.22));
  ellipse(ctx, x + 13, y - 7, 3.6, 1.8, wallL);
  for (let i = 0; i < 4; i++) ellipse(ctx, x + 10.4 + i * 1.8, y - 8 + (i % 2) * 0.3, 0.6, 0.9, wall);
  // the saltire over the keep
  line(ctx, x - 12, y - 30, x - 12, y - 42, WOOD_D, 0.8);
  saltireFlag(ctx, x - 12, y - 42, 10, 6.6, 0.8);
  ctx.restore();
}

function building(ctx: Ctx, x: number, y: number, big: boolean, roofC: string, capital: boolean) {
  if (big && capital) {
    ctx.save();
    ctx.translate(x, y + 2);
    ctx.scale(0.8, 0.8);
    castle(ctx, 0, 0, roofC);
    ctx.restore();
    return;
  }
  if (big) { towerHouse(ctx, x, y, 11, 17, roofC); return; }
  const seed = Math.abs(Math.round(x) * 7 + Math.round(y) * 13);
  const v = ((Math.round(x) * 7 + Math.round(y) * 3) % 4 + 4) % 4;
  if (v === 0) { croft(ctx, x, y, 13, 6, seed, true); peatStack(ctx, x + 9, y + 4); }
  else if (v === 1) { croft(ctx, x - 3, y - 1.4, 11, 5.4, seed, false); croft(ctx, x + 5, y + 2.8, 11, 5.6, seed + 1, true); }
  else if (v === 2) cottage(ctx, x, y, 12, 8, roofC);
  else { dyke(ctx, x - 9, y + 4, x - 1, y + 8); sheep(ctx, x - 6, y + 3); croft(ctx, x + 2, y - 1, 12, 5.6, seed, true); }
}

// ---------------------------------------------------------------- trees

function clumps(ctx: Ctx, x: number, y: number, k: number, g: string, list: readonly (readonly [number, number, number, number, number])[]) {
  for (const [dx, dy, rx, ry, c] of list) {
    ellipse(ctx, x + dx * k, y + (dy + 1) * k, rx * k, ry * k, shade(g, c - 0.22));
    ellipse(ctx, x + dx * k, y + dy * k, rx * k, ry * k, shade(g, c));
    ellipse(ctx, x + (dx - rx * 0.3) * k, y + (dy - ry * 0.32) * k, rx * 0.5 * k, ry * 0.36 * k, shade(g, c + 0.18));
  }
}

/** Purple heather tufts at the foot of a tree. */
function heather(ctx: Ctx, x: number, y: number, k: number, seed: number) {
  for (let i = 0; i < 3; i++) {
    const hx = x + (rand(seed, i) * 10 - 5) * k, hy = y + (rand(seed + 1, i) * 2 + 0.4) * k;
    ellipse(ctx, hx, hy, 2 * k, 1 * k, '#3a4a2a');
    for (let j = 0; j < 5; j++) ellipse(ctx, hx + (j - 2) * 0.7 * k, hy - 0.6 * k - (j % 2) * 0.4 * k, 0.55 * k, 0.5 * k, j % 2 ? '#9a5aa8' : '#b87ac0');
  }
}

function tree(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  const type = ['pine', 'birch', 'pine', 'rowan', 'pine', 'birch', 'rowan', 'pine', 'birch'][variant % 9];
  heather(ctx, x, y, k, variant + 1);
  if (type === 'pine') {
    // the Scots pine: a tall bare trunk, grey and plated below, glowing orange-red above, and flat-topped clouds of
    // blue-green needles on crooked branches
    const g = mix(P.forest, '#24483a', 0.55);
    const lean = ((variant % 3) - 1) * 0.8 * k;
    line(ctx, x, y, x + lean, y - 22 * k, '#5a4434', 2.2 * k);
    line(ctx, x + lean * 0.4, y - 9 * k, x + lean, y - 22 * k, '#c0623a', 1.6 * k);
    line(ctx, x - 0.5 * k, y, x - 0.5 * k + lean * 0.4, y - 9 * k, '#7a6a5a', 0.6 * k);
    for (let i = 0; i < 3; i++) line(ctx, x - 0.8 * k, y - (2 + i * 2.6) * k, x + 0.8 * k, y - (2.6 + i * 2.6) * k, '#3a2a20', 0.4 * k); // plated bark
    const tx = x + lean, ty = y - 22 * k;
    curve(ctx, tx, ty + 6 * k, tx - 3 * k, ty + 3 * k, tx - 6.4 * k, ty + 3.4 * k, 0.8 * k, '#b0583a');
    curve(ctx, tx, ty + 3 * k, tx + 3 * k, ty + 0.4 * k, tx + 6 * k, ty + 0.6 * k, 0.8 * k, '#b0583a');
    clumps(ctx, tx, ty, k, g, [[-6.4, 2.4, 3.6, 1.6, -0.1], [6, -0.2, 3.4, 1.5, -0.08], [-1, -1.6, 5, 2, 0], [1.6, -3.4, 3.6, 1.6, 0.08], [-3, 0.4, 3, 1.4, 0.04]]);
    return;
  }
  if (type === 'birch') {
    // the silver birch: a slim white trunk marked with black, drooping twigs and a light airy crown
    const g = mix(P.forest, '#8ab048', 0.6);
    line(ctx, x, y, x + 0.6 * k, y - 18 * k, '#f2f0ea', 1.4 * k);
    line(ctx, x + 0.4 * k, y, x + 1 * k, y - 18 * k, '#c8c6c0', 0.4 * k);
    for (let i = 0; i < 6; i++) { const py = y - (1.4 + i * 2.6) * k; line(ctx, x - 0.6 * k, py, x + 0.4 * k, py - 0.3 * k, '#2a2420', 0.5 * k); }
    line(ctx, x + 0.3 * k, y - 10 * k, x + 4 * k, y - 14 * k, '#e8e6e0', 0.6 * k);
    line(ctx, x + 0.4 * k, y - 12 * k, x - 3.4 * k, y - 16 * k, '#e8e6e0', 0.6 * k);
    clumps(ctx, x + 0.6 * k, y, k, g, [[-3.6, -13, 3, 3.6, -0.08], [3.4, -13.6, 3, 3.6, -0.12], [0, -17, 3.8, 4, 0.02], [0.6, -21, 2.6, 2.6, 0.12]]);
    for (let i = 0; i < 6; i++) { const dx = (rand(variant + 3, i) - 0.5) * 9; line(ctx, x + dx * k, y - 14 * k, x + dx * 1.1 * k, y - 9.6 * k, shade(g, -0.2), 0.35 * k); } // drooping twigs
    return;
  }
  // the rowan: a grey trunk, fresh feathery leaves and bunches of scarlet berries
  const g = mix(P.forest, '#5a9a3a', 0.5);
  line(ctx, x, y, x, y - 8 * k, '#6a625a', 1.6 * k);
  curve(ctx, x, y - 7 * k, x - 2 * k, y - 9 * k, x - 4 * k, y - 11 * k, 0.9 * k, '#6a625a');
  curve(ctx, x, y - 7 * k, x + 2 * k, y - 9 * k, x + 3.6 * k, y - 12 * k, 0.9 * k, '#6a625a');
  clumps(ctx, x, y, k, g, [[-4, -12, 3.6, 3, -0.08], [4, -12.6, 3.4, 3, -0.12], [0, -15, 4.6, 3.6, 0.02], [-1.6, -18, 3, 2.2, 0.1]]);
  for (let i = 0; i < 5; i++) {
    const a = rand(variant + 6, i) * Math.PI * 2, r = 1.6 + rand(variant + 2, i) * 4;
    const bx = x + Math.cos(a) * r * k, by = y - 13.4 * k + Math.sin(a) * r * 0.6 * k;
    for (const [dx, dy] of [[0, 0], [0.8, 0.3], [-0.6, 0.5], [0.2, 0.9]] as const) ellipse(ctx, bx + dx * k, by + dy * k, 0.55 * k, 0.55 * k, '#d8281e');
    ellipse(ctx, bx - 0.2 * k, by - 0.2 * k, 0.2 * k, 0.2 * k, '#ff9a80');
  }
}

// ---------------------------------------------------------------- whole units

function unit(ctx: Ctx, kind: UnitKind, x: number, y: number): boolean {
  switch (kind) {
    case 'rider': hobelar(ctx, x, y); return true;
    case 'knight': knight(ctx, x, y); return true;
    case 'catapult': trebuchet(ctx, x, y); return true;
    case 'boat': case 'ship': case 'warship': boat(ctx, kind, x, y); return true;
    default: return false;
  }
}

registerArt('scotland', {
  unit,
  dress: (kind) => dress(kind),
  torso: (ctx, kind, x, y, w, h) => { if (KILTED(kind) || kind === 'defender' || kind === 'swordsman' || kind === 'knight') torso(ctx, kind, x, y, w, h); },
  face,
  head,
  weapon,
  shield: (ctx, kind, x, y, k) => { targe(ctx, x, y, k, false, kind === 'defender' ? 6.4 : 5.8); return true; },
  building,
  tree,
});

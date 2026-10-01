// The Kingdom of Babylon (Hammurabi to Nebuchadnezzar, eighteenth to sixth century BC): long fringed wool kilts and
// shawls wound round the body, short tunics with a fringed belt for the soldiers and bronze scale coats for the heavy
// ranks; curled and squared beards on the men of rank, long hair knotted at the nape, pointed bronze helmets, woollen
// fillets for the light troops and a tall horned crown for the giant. Tall wicker shields rimmed in bronze, spears,
// sickle-swords, stone-headed maces and composite bows. Two-horse war chariots with six-spoked wheels, a wheeled siege
// engine with a ram and a turret, round bitumen-coated gufa coracles, reed boats and a wooden river ship. Towns of
// flat-roofed mud brick with beam ends and roof terraces, reed huts, a temple with niched walls and cone mosaics; the
// capital has its ziggurat and a gate glazed in lapis blue with golden lions and aurochs. Date palms grow in irrigated
// rows along their canals.
import type { BiomePalette } from '../../data/tribes';
import type { UnitKind } from '../../game/types';
import { band, box, ellipse, faceQuad, ink, line, mix, poly, rand, shade, softShadow, type Ctx } from '../prims';
import { registerArt, type Body } from '../tribeart';
import { drawHorse, figure } from '../units';
import { datePalm, ziggurat } from '../mech/babylon';

// ---------------------------------------------------------------- palette

const LAPIS = '#2a3fd0', LAPIS_D = '#101a6a', LAPIS_L = '#5a74f0';
const GLAZE = '#1e44b0', GLAZE_D = '#132c80'; // the gate's glazed brick
const GOLD = '#e8c060', GOLD_D = '#a8802a', GOLD_L = '#fbe6a8';
const WOOL = '#e6d8b4', WOOL_D = '#b8a47e';
const MADDER = '#a83a2a', MADDER_D = '#6a2018';
const BRONZE = '#c08a3a', BRONZE_D = '#7a5420', BRONZE_L = '#ecc078';
const BRICK = '#cba270', BRICK_D = '#9a7446', BRICK_L = '#e4c494';
const REED = '#d0b468', REED_D = '#8a7436', REED_L = '#ecd88c';
const WOOD = '#7a5230', WOOD_D = '#4a3018', WOOD_L = '#a87a4a';
const BITUMEN = '#2c2420';
const SKIN = '#c99060', HAIR = '#120c08';

// ---------------------------------------------------------------- helpers

/** A point on one visible side of a box, in faceQuad's (u, v) coordinates (v may run below the box). */
function pt(face: 'L' | 'R', cx: number, cy: number, w: number, h: number, u: number, v: number): [number, number] {
  return face === 'R' ? [cx + (u * w) / 2, cy + (w / 4) * (1 - u) - v * h] : [cx - w / 2 + (u * w) / 2, cy + (w / 4) * u - v * h];
}
/** A flat polygon on one side of a box, shaded like that side. */
function facePoly(ctx: Ctx, face: 'L' | 'R', cx: number, cy: number, w: number, h: number, pts: [number, number][], color: string) {
  poly(ctx, pts.flatMap(([u, v]) => pt(face, cx, cy, w, h, u, v)), face === 'L' ? shade(color, 0.06) : shade(color, -0.2));
}
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
/** An elliptical outline, or part of one. */
function ring(ctx: Ctx, x: number, y: number, rx: number, ry: number, c: string, w: number, a0 = 0, a1 = Math.PI * 2) {
  ctx.strokeStyle = ink(c);
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, a0, a1);
  ctx.stroke();
}
/** A rosette: petals round a gold heart (the Babylonian flower of Ishtar). */
function rosette(ctx: Ctx, x: number, y: number, r: number, petal = '#f4ecd0', heart = GOLD) {
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ellipse(ctx, x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.36, r * 0.36, petal); }
  ellipse(ctx, x, y, r * 0.38, r * 0.38, heart);
}
/** A fringe of short threads hanging along a line on one side of a box. */
function fringe(ctx: Ctx, face: 'L' | 'R', cx: number, cy: number, w: number, h: number, v: number, len: number, n: number, c: string, k: number) {
  for (let i = 0; i <= n; i++) {
    const u = -0.04 + (1.08 * i) / n;
    const [px, py] = pt(face, cx, cy, w, h, u, v);
    line(ctx, px, py, px + (face === 'L' ? -0.15 : 0.15) * k, py + len, i % 2 ? shade(c, -0.18) : c, 0.45 * k);
  }
}

// ---------------------------------------------------------------- dress

const RANK: UnitKind[] = ['swordsman', 'knight', 'giant', 'defender', 'sabum', 'rider'];
const isRank = (k: UnitKind) => RANK.includes(k);
const isScale = (k: UnitKind) => k === 'swordsman' || k === 'knight';

function dress(kind: UnitKind): [string, string, string] {
  switch (kind) {
    case 'warrior': case 'archer': return [SKIN, SKIN, SKIN]; // bare-chested above a fringed kilt
    case 'explorer': return [WOOL, SKIN, WOOL];
    case 'sabum': case 'rider': return [LAPIS, SKIN, SKIN]; // a short tunic
    case 'defender': return [MADDER, SKIN, SKIN];
    case 'swordsman': case 'knight': return [BRONZE, SKIN, LAPIS]; // a bronze scale coat
    case 'giant': return [LAPIS_D, LAPIS_D, LAPIS]; // the royal robe, down to the feet
    default: return [LAPIS, SKIN, SKIN];
  }
}

/** A kilt from the hip (v = 0.08) down to `v1`, a little flared, with a fringed hem. */
function kilt(ctx: Ctx, x: number, y: number, w: number, h: number, v1: number, c: string, edge: string, k: number) {
  for (const f of ['L', 'R'] as const) {
    facePoly(ctx, f, x, y, w, h, [[-0.02, 0.1], [1.02, 0.1], [1.07, v1], [-0.07, v1]], c);
    facePoly(ctx, f, x, y, w, h, [[-0.06, v1 + 0.1], [1.06, v1 + 0.1], [1.07, v1], [-0.07, v1]], edge); // the woven border
    fringe(ctx, f, x, y, w, h, v1, 1.3 * k, 9, edge, k);
  }
  // a fringed edge running down the front where the kilt is wrapped
  const a = pt('R', x, y, w, h, 0.7, 0.1), b = pt('R', x, y, w, h, 0.78, v1);
  line(ctx, a[0], a[1], b[0], b[1], shade(edge, -0.1), 0.6 * k);
  for (let i = 1; i < 5; i++) { const t = i / 5; line(ctx, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[0] + (b[0] - a[0]) * t + 0.9 * k, a[1] + (b[1] - a[1]) * t + 0.4 * k, edge, 0.35 * k); }
}

/** Rows of small bronze scales between heights v0 and v1 of the torso box, each lit along its top. */
function scales(ctx: Ctx, x: number, y: number, w: number, h: number, v0: number, v1: number, rows: number) {
  const rh = (v1 - v0) / rows;
  for (let r = 0; r < rows; r++) {
    const a = v0 + r * rh;
    for (const f of ['L', 'R'] as const) {
      faceQuad(ctx, f, x, y, w, h, 0, 1, a, a + rh, shade(BRONZE, r % 2 ? -0.06 : 0.04));
      for (let c = 0; c < 6; c++) {
        const u = (c + (r % 2) * 0.5) / 6;
        if (u > 0.95) continue;
        const [px, py] = pt(f, x, y, w, h, u + 0.08, a + rh * 0.35);
        ellipse(ctx, px, py, w * 0.035, h * rh * 0.42, f === 'L' ? BRONZE_L : shade(BRONZE_L, -0.2));
        ellipse(ctx, px, py + h * rh * 0.22, w * 0.03, h * rh * 0.18, f === 'L' ? BRONZE_D : shade(BRONZE_D, -0.2));
      }
    }
  }
}

function torso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const k = w / 10;
  const B = (v0: number, v1: number, c: string) => band(ctx, x, y, w, h, v0, v1, c);
  if (kind === 'giant') {
    // the royal robe to the feet, a shawl wound round it in fringed spirals, a broad gold collar
    kilt(ctx, x, y, w, h, -0.56, LAPIS_D, GOLD, k);
    for (const [v0, v1] of [[0.1, -0.12], [0.62, 0.32], [-0.22, -0.42]] as const) {
      for (const f of ['L', 'R'] as const) facePoly(ctx, f, x, y, w, h, [[-0.04, v0 + 0.12], [1.04, v0 - 0.1], [1.04, v1 - 0.1], [-0.04, v1 + 0.12]], LAPIS);
      for (const f of ['L', 'R'] as const) {
        const a = pt(f, x, y, w, h, -0.04, v1 + 0.12), b = pt(f, x, y, w, h, 1.04, v1 - 0.1);
        line(ctx, a[0], a[1], b[0], b[1], GOLD, 0.7 * k);
        for (let i = 0; i <= 8; i++) { const t = i / 8; line(ctx, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + 1.2 * k, i % 2 ? GOLD_D : GOLD, 0.4 * k); }
      }
    }
    B(0.84, 1, GOLD);
    for (const u of [0.15, 0.4, 0.65, 0.9]) { const [px, py] = pt('R', x, y, w, h, u, 0.92); ellipse(ctx, px, py, 0.6 * k, 0.6 * k, LAPIS_L); }
    const [rx, ry] = pt('R', x, y, w, h, 0.45, 0.62);
    rosette(ctx, rx, ry, 1.6 * k, GOLD_L, LAPIS_L);
    return;
  }
  if (kind === 'warrior' || kind === 'archer') {
    // bare chest and a fringed wool kilt; a sash over the shoulder, a beaded collar
    kilt(ctx, x, y, w, h, -0.34, WOOL, kind === 'archer' ? MADDER : LAPIS, k);
    B(0.06, 0.18, shade(WOOL, -0.18)); // the rolled waist of the kilt
    facePoly(ctx, 'R', x, y, w, h, [[0.06, 1], [0.24, 1], [0.94, 0.18], [0.76, 0.18]], kind === 'archer' ? MADDER : LAPIS);
    facePoly(ctx, 'R', x, y, w, h, [[0.4, 0.62], [0.52, 0.62], [0.5, 0.38], [0.4, 0.4]], shade(SKIN, -0.08)); // the chest's shadow
    B(0.9, 0.98, GOLD_D);
    for (const u of [0.2, 0.5, 0.8]) { const [px, py] = pt('R', x, y, w, h, u, 0.88); ellipse(ctx, px, py, 0.45 * k, 0.45 * k, LAPIS_L); }
    return;
  }
  if (kind === 'explorer') {
    // a long fringed wool robe and a shawl thrown over the left shoulder
    kilt(ctx, x, y, w, h, -0.5, WOOL, MADDER, k);
    facePoly(ctx, 'R', x, y, w, h, [[0, 1], [0.3, 1], [1.02, 0.1], [0.66, 0.1]], MADDER);
    const a = pt('R', x, y, w, h, 0.3, 1), b = pt('R', x, y, w, h, 1.02, 0.1);
    for (let i = 0; i <= 6; i++) { const t = i / 6; line(ctx, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[0] + (b[0] - a[0]) * t + 1 * k, a[1] + (b[1] - a[1]) * t + 0.6 * k, GOLD, 0.4 * k); }
    B(0.2, 0.3, WOOL_D);
    return;
  }
  if (isScale(kind)) {
    // a bronze scale coat to the hip over a fringed lapis kilt, a broad belt and a gorget
    kilt(ctx, x, y, w, h, -0.32, LAPIS, GOLD, k);
    scales(ctx, x, y, w, h, 0.16, 0.92, 6);
    B(0.1, 0.22, MADDER_D);
    B(0.14, 0.18, GOLD);
    B(0.9, 1, BRONZE_D);
    const [mx, my] = pt('R', x, y, w, h, 0.45, 0.58);
    ellipse(ctx, mx, my, 1.7 * k, 1.7 * k, GOLD_D);
    rosette(ctx, mx, my, 1.4 * k, GOLD_L, LAPIS);
    return;
  }
  // soldiers: a short lapis tunic to mid-thigh, a broad fringed belt, crossed leather baldrics
  const red = kind === 'defender';
  kilt(ctx, x, y, w, h, -0.28, red ? MADDER : LAPIS, WOOL, k);
  B(0.14, 0.3, red ? LAPIS_D : MADDER);
  B(0.2, 0.24, GOLD);
  for (const f of ['L', 'R'] as const) fringe(ctx, f, x, y, w, h, 0.14, 1.8 * k, 8, MADDER_D, k); // the fringed belt's tassels
  facePoly(ctx, 'R', x, y, w, h, [[0.04, 1], [0.18, 1], [0.92, 0.3], [0.78, 0.3]], '#6a4424');
  facePoly(ctx, 'R', x, y, w, h, [[0.82, 1], [0.96, 1], [0.24, 0.3], [0.1, 0.3]], '#7a5030');
  const [cx2, cy2] = pt('R', x, y, w, h, 0.53, 0.66);
  ellipse(ctx, cx2, cy2, 0.9 * k, 0.9 * k, BRONZE_L);
  B(0.92, 1, WOOL);
}

/** Curled, squared beards for the men of rank. */
function face(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  if (!isRank(kind)) return;
  const long = kind === 'giant' || kind === 'knight' || kind === 'swordsman' || kind === 'sabum';
  const bot = long ? -0.42 : -0.22;
  facePoly(ctx, 'R', x, y, w, h, [[0, 0.42], [0.18, 0.36], [0.2, 0.26], [0.82, 0.26], [0.84, 0.36], [1, 0.4], [1, bot + 0.06], [0.9, bot], [0.1, bot], [0, bot + 0.06]], HAIR);
  facePoly(ctx, 'L', x, y, w, h, [[0.6, 0.38], [1, 0.42], [1, bot + 0.06], [0.7, bot + 0.1], [0.62, 0.1]], HAIR);
  // rows of tight curls
  for (let r = 0; r < (long ? 5 : 3); r++) {
    const v = 0.14 - r * 0.13;
    for (let i = 0; i < 6; i++) {
      const u = 0.08 + i * 0.17 + (r % 2) * 0.06;
      if (u > 0.96) continue;
      const [px, py] = pt('R', x, y, w, h, u, v);
      ring(ctx, px, py, w * 0.04, h * 0.035, '#3a2a1e', w * 0.022);
    }
  }
  faceQuad(ctx, 'R', x, y, w, h, 0.24, 0.76, 0.2, 0.27, '#241a12'); // the moustache
  faceQuad(ctx, 'R', x, y, w, h, 0.36, 0.64, 0.14, 0.18, shade(SKIN, -0.42)); // the lips showing through
}

// ---------------------------------------------------------------- headgear

/** Long hair knotted at the nape in a round club of curls. */
function hairKnot(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const hx = x - hw * 0.5 + 0.2 * k, hy = top + 10.4 * k;
  ellipse(ctx, hx, hy, 1.9 * k, 1.6 * k, HAIR);
  for (const [dx, dy] of [[-0.8, -0.3], [0.6, -0.5], [-0.1, 0.6]] as const) ring(ctx, hx + dx * k, hy + dy * k, 0.5 * k, 0.42 * k, '#3a2a1e', 0.35 * k);
}

/** A woollen fillet bound round the head, its ends hanging at the back. */
function fillet(ctx: Ctx, x: number, top: number, k: number, hw: number, c: string) {
  ellipse(ctx, x, top + 0.6 * k, hw / 2 + 0.2 * k, hw / 4 + 0.6 * k, HAIR); // the hair on top
  ellipse(ctx, x - 0.8 * k, top - 0.2 * k, hw * 0.3, hw * 0.14, '#3a2a1e');
  band(ctx, x, top + 3.2 * k, hw + 0.3 * k, 1.6 * k, 0, 1, c);
  band(ctx, x, top + 3.2 * k, hw + 0.3 * k, 1.6 * k, 0.4, 0.6, shade(c, 0.3));
  const kx = x - hw / 2, ky = top + 2.4 * k;
  line(ctx, kx, ky, kx - 1.4 * k, ky + 4 * k, c, 0.8 * k);
  line(ctx, kx + 0.4 * k, ky, kx - 0.4 * k, ky + 4.6 * k, shade(c, -0.25), 0.7 * k);
  hairKnot(ctx, x, top, k, hw);
}

/** A pointed bronze helmet: a smooth tall cone hugging the head, lit on the left, a riveted rim and a cheek guard. */
function pointedHelm(ctx: Ctx, x: number, top: number, k: number, hw: number, tall = 1, crest: string | null = null) {
  hairKnot(ctx, x, top, k, hw);
  const r = hw / 2 + 0.35 * k, by = top + 2.8 * k, ax = x - 0.5 * k, ay = top - 7.6 * k * tall;
  ctx.beginPath(); // the whole cone, bottom curve included
  ctx.moveTo(x - r, by);
  ctx.lineTo(ax, ay);
  ctx.lineTo(x + r, by);
  ctx.ellipse(x, by, r, r / 2, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fillStyle = ink(BRONZE);
  ctx.fill();
  ctx.beginPath(); // the shaded right flank
  ctx.moveTo(ax + 0.2 * k, ay);
  ctx.lineTo(x + r, by);
  ctx.ellipse(x, by, r, r / 2, 0, 0, Math.PI * 0.35);
  ctx.closePath();
  ctx.fillStyle = ink(BRONZE_D);
  ctx.fill();
  poly(ctx, [ax - 0.1 * k, ay + 1 * k, x - r * 0.42, by + r * 0.3, x - r * 0.62, by + r * 0.2], BRONZE_L); // the shine
  ring(ctx, x, by, r, r / 2, GOLD_D, 0.9 * k, 0, Math.PI); // the rim
  for (const a of [0.25, 0.5, 0.75]) ellipse(ctx, x + Math.cos(a * Math.PI) * r, by + Math.sin(a * Math.PI) * r / 2, 0.38 * k, 0.38 * k, GOLD_L);
  ellipse(ctx, ax, ay, 0.7 * k, 0.6 * k, GOLD);
  if (crest) for (let i = 0; i < 5; i++) curve(ctx, ax, ay - 0.3 * k, ax - 1.4 * k - i * 0.3 * k, ay - 2.6 * k + i * 0.4 * k, ax - 3.6 * k - i * 0.5 * k, ay + 0.8 * k + i * 0.7 * k, 0.75 * k, i % 2 ? shade(crest, -0.25) : crest);
  // the cheek guard on the visible side
  poly(ctx, [x + hw * 0.3, by + 0.6 * k, x + hw * 0.46, by + 0.2 * k, x + hw * 0.44, by + 3.8 * k, x + hw * 0.3, by + 3.6 * k], BRONZE_D);
}

/** The tall horned crown of the giant: a lapis cylinder ringed with gold horns and rosettes, a feathered rim. */
function crown(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  hairKnot(ctx, x, top, k, hw);
  const r = hw / 2 - 0.5 * k, by = top + 2.6 * k, ty = top - 7.4 * k;
  ellipse(ctx, x, by, r, r / 2, GOLD_D);
  poly(ctx, [x - r, by, x - r * 1.06, ty, x + r * 1.06, ty, x + r, by], LAPIS);
  poly(ctx, [x + r * 0.2, by + r * 0.48, x + r, by, x + r * 1.06, ty, x + r * 0.2, ty + r * 0.5], LAPIS_D);
  ctx.beginPath(); // the bottom curve
  ctx.ellipse(x, by, r, r / 2, 0, 0, Math.PI);
  ctx.fillStyle = ink(LAPIS);
  ctx.fill();
  // three tiers of horns sweeping round the front
  for (let i = 0; i < 3; i++) {
    const hy = by - 1.8 * k - i * 2.7 * k;
    curve(ctx, x - r * 0.96, hy - 1.2 * k, x - r * 0.2, hy + 2 * k, x + 0.2 * k, hy - 0.2 * k, 0.9 * k, GOLD);
    curve(ctx, x + r * 0.96, hy - 1.2 * k, x + r * 0.2, hy + 2 * k, x - 0.2 * k, hy - 0.2 * k, 0.9 * k, GOLD_D);
    ellipse(ctx, x, hy, 0.5 * k, 0.5 * k, GOLD_L);
  }
  ring(ctx, x, by, r, r / 2, GOLD, 0.8 * k, 0, Math.PI);
  ellipse(ctx, x, ty, r * 1.12, r * 0.52, GOLD);
  ellipse(ctx, x, ty - 0.3 * k, r * 0.9, r * 0.4, shade(LAPIS, 0.2));
  for (let i = 0; i < 9; i++) { // a crest of feathers standing round the rim
    const a = Math.PI + (i / 8) * Math.PI;
    const px = x + Math.cos(a) * r * 1.02, py = ty + Math.sin(a) * r * 0.46;
    poly(ctx, [px - 0.5 * k, py, px + 0.5 * k, py, px + Math.cos(a) * 0.4 * k, py - 2.4 * k], i % 2 ? GOLD_L : GOLD);
  }
  for (const d of [-1, 1]) rosette(ctx, x + d * r * 0.55, ty + 2 * k, 0.8 * k, GOLD_L, LAPIS_L);
}

function head(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  switch (kind) {
    case 'warrior': fillet(ctx, x, top, k, hw, LAPIS); break;
    case 'archer': fillet(ctx, x, top, k, hw, MADDER); break;
    case 'explorer': fillet(ctx, x, top, k, hw, GOLD_D); break;
    case 'giant': crown(ctx, x, top, k, hw); break;
    case 'sabum': pointedHelm(ctx, x, top, k, hw, 1.15, LAPIS); break;
    case 'swordsman': case 'knight': pointedHelm(ctx, x, top, k, hw, 1.05, MADDER); break;
    default: pointedHelm(ctx, x, top, k, hw); break;
  }
}

// ---------------------------------------------------------------- weapons and shields

/** A spear: an ash shaft, a bronze socket ring and a long leaf-shaped head. */
function spear(ctx: Ctx, x: number, y: number, k: number, len = 1, tassel: string | null = null) {
  const x0 = x - 1.8 * k, y0 = y + 7 * k, x1 = x + 3.4 * k * len, y1 = y - 21 * k * len;
  line(ctx, x0, y0, x1, y1, WOOD_D, 1.3 * k);
  line(ctx, x0 - 0.3 * k, y0, x1 - 0.3 * k, y1, WOOD_L, 0.45 * k);
  poly(ctx, [x1 + 0.6 * k, y1 - 7.4 * k, x1 - 1.4 * k, y1 - 1.6 * k, x1 - 0.2 * k, y1 + 0.6 * k, x1 + 0.3 * k, y1 - 0.2 * k], BRONZE_L);
  poly(ctx, [x1 + 0.6 * k, y1 - 7.4 * k, x1 + 2 * k, y1 - 1.4 * k, x1 + 0.6 * k, y1 + 0.6 * k, x1 + 0.3 * k, y1 - 0.2 * k], BRONZE);
  line(ctx, x1 + 0.4 * k, y1 - 6.6 * k, x1 + 0.3 * k, y1 - 0.6 * k, BRONZE_D, 0.35 * k); // the midrib
  ellipse(ctx, x1 + 0.1 * k, y1 + 1 * k, 0.9 * k, 0.6 * k, BRONZE_D);
  ellipse(ctx, x0, y0 + 0.4 * k, 0.7 * k, 0.7 * k, BRONZE);
  if (tassel) for (let i = -1; i <= 1; i++) line(ctx, x1 + 0.1 * k, y1 + 1.4 * k, x1 + i * 0.7 * k - 0.4 * k, y1 + 4.6 * k, i ? tassel : shade(tassel, 0.25), 0.6 * k);
}

/** The sickle-sword: a bronze grip and shaft that sweeps out into a curved, hooked blade. */
function sickleSword(ctx: Ctx, x: number, y: number, k: number, s = 1) {
  const gx = x, gy = y + 1.4 * k;
  line(ctx, gx, gy + 2.6 * k, gx + 0.6 * k, gy - 2 * k, WOOD_D, 1.8 * k); // the grip
  for (const t of [0, 1, 2]) line(ctx, gx - 0.8 * k, gy + (t * 1.3 - 0.4) * k, gx + 1 * k, gy + (t * 1.3 - 0.8) * k, GOLD_D, 0.45 * k);
  ellipse(ctx, gx + 0.6 * k, gy - 2.2 * k, 1.4 * k, 0.7 * k, GOLD);
  const sx = gx + 0.8 * k, sy = gy - 2.6 * k, ex = gx + 2.4 * k * s, ey = gy - 9 * k * s;
  line(ctx, sx, sy, ex, ey, BRONZE_D, 1.4 * k); // the straight shaft
  line(ctx, sx - 0.3 * k, sy, ex - 0.3 * k, ey, BRONZE_L, 0.4 * k);
  // the blade: a crescent sweeping forward and down to a hooked point
  ctx.beginPath();
  ctx.moveTo(ex - 0.6 * k, ey + 0.4 * k);
  ctx.quadraticCurveTo(ex + 1 * k * s, ey - 7.4 * k * s, ex + 6.4 * k * s, ey - 4.6 * k * s);
  ctx.quadraticCurveTo(ex + 7.6 * k * s, ey - 3.4 * k * s, ex + 6.8 * k * s, ey - 2 * k * s);
  ctx.quadraticCurveTo(ex + 3 * k * s, ey - 4.4 * k * s, ex + 1 * k, ey + 0.8 * k);
  ctx.closePath();
  ctx.fillStyle = ink(BRONZE);
  ctx.fill();
  curve(ctx, ex - 0.4 * k, ey, ex + 1 * k * s, ey - 7.2 * k * s, ex + 6.4 * k * s, ey - 4.6 * k * s, 0.55 * k, BRONZE_L); // the bright back
  curve(ctx, ex + 1 * k, ey + 0.6 * k, ex + 3 * k * s, ey - 4.2 * k * s, ex + 6.8 * k * s, ey - 2 * k * s, 0.4 * k, '#fff0c8'); // the honed edge
  ellipse(ctx, ex + 0.6 * k, ey - 1 * k, 0.4 * k, 0.4 * k, GOLD);
}

/** A mace: a short shaft with a polished pear-shaped stone head bound in bronze. */
function mace(ctx: Ctx, x: number, y: number, k: number) {
  const x1 = x + 2.4 * k, y1 = y - 11 * k;
  line(ctx, x - 0.6 * k, y + 3 * k, x1, y1, WOOD_D, 1.3 * k);
  line(ctx, x - 0.9 * k, y + 3 * k, x1 - 0.3 * k, y1, WOOD_L, 0.4 * k);
  ellipse(ctx, x1 + 0.2 * k, y1 - 1.8 * k, 2.2 * k, 2.6 * k, '#6a6a72');
  ellipse(ctx, x1 - 0.5 * k, y1 - 2.6 * k, 1 * k, 1.2 * k, '#a8a8b4');
  ellipse(ctx, x1 + 0.1 * k, y1 + 0.4 * k, 1.2 * k, 0.6 * k, BRONZE);
}

/** A composite bow, its tips recurved forward, drawn with an arrow on the string. */
function bow(ctx: Ctx, x: number, y: number, k: number) {
  const bx = x + 3 * k, top = y - 11 * k, bot = y + 7 * k;
  ctx.strokeStyle = ink('#5a3a1c');
  ctx.lineWidth = 1.4 * k;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(bx + 1.6 * k, top - 1 * k);
  ctx.quadraticCurveTo(bx - 0.4 * k, top + 0.6 * k, bx + 1 * k, top + 3 * k);
  ctx.quadraticCurveTo(bx + 4 * k, y - 2 * k, bx + 1 * k, bot - 3 * k);
  ctx.quadraticCurveTo(bx - 0.4 * k, bot - 0.6 * k, bx + 1.6 * k, bot + 1 * k);
  ctx.stroke();
  ctx.strokeStyle = ink(GOLD_D); // horn and sinew bands
  ctx.lineWidth = 0.45 * k;
  for (const yy of [top + 3.4 * k, y - 2 * k, bot - 3.4 * k]) line(ctx, bx + 0.6 * k, yy, bx + 2.6 * k, yy, GOLD, 0.6 * k);
  line(ctx, bx + 1.2 * k, top + 0.4 * k, x - 1.6 * k, y - 1.6 * k, '#f4efe0', 0.4 * k); // the string, drawn back
  line(ctx, bx + 1.2 * k, bot - 0.4 * k, x - 1.6 * k, y - 1.6 * k, '#f4efe0', 0.4 * k);
  line(ctx, x - 1.6 * k, y - 1.6 * k, bx + 6 * k, y - 3.2 * k, '#d8c8a0', 0.55 * k); // the arrow
  poly(ctx, [bx + 6 * k, y - 3.9 * k, bx + 8 * k, y - 3.4 * k, bx + 6 * k, y - 2.6 * k], BRONZE);
  poly(ctx, [x - 1.6 * k, y - 1.6 * k, x - 0.2 * k, y - 2.6 * k, x + 0.4 * k, y - 1.8 * k], MADDER); // fletching
}

/** A quiver of arrows on the back, tooled leather with a tasselled cap. */
function quiver(ctx: Ctx, x: number, y: number, k: number) {
  const qx = x - 6.4 * k;
  box(ctx, qx, y - 8 * k, 3.2 * k, 10 * k, '#7a4a24');
  for (const v of [0.25, 0.55, 0.85]) band(ctx, qx, y - 8 * k, 3.2 * k, 10 * k, v, v + 0.06, GOLD_D);
  band(ctx, qx, y - 8 * k, 3.2 * k, 10 * k, 0.38, 0.48, LAPIS);
  for (const i of [-1, 0, 1]) {
    const tx = qx - 1.2 * k + i * 1.1 * k;
    line(ctx, qx + i * 0.6 * k, y - 18 * k, tx, y - 21.6 * k, '#d8c8a0', 0.6 * k);
    poly(ctx, [tx, y - 21.6 * k, tx - 0.8 * k, y - 23.4 * k, tx + 0.5 * k, y - 22.4 * k], i ? MADDER : WOOL);
  }
}

/** A traveller's staff and a goatskin water bag. */
function staff(ctx: Ctx, x: number, y: number, k: number) {
  line(ctx, x - 0.8 * k, y + 6 * k, x + 2.6 * k, y - 17 * k, WOOD, 1.1 * k);
  curve(ctx, x + 2.6 * k, y - 17 * k, x + 4.2 * k, y - 19 * k, x + 3.4 * k, y - 20 * k, 1 * k, WOOD); // the crook
  const sx = x + 1.6 * k, sy = y - 6 * k;
  ellipse(ctx, sx + 1.8 * k, sy + 1.8 * k, 2.2 * k, 2.8 * k, '#8a5a34');
  ellipse(ctx, sx + 1.4 * k, sy + 1 * k, 1 * k, 1.3 * k, '#a8784a');
  line(ctx, sx, sy - 2.6 * k, sx + 1.4 * k, sy - 0.8 * k, '#4a3020', 0.5 * k);
}

/** The tall shield: woven wicker with a rounded top, rimmed in bronze, with a lapis boss and a rosette. */
function tallShield(ctx: Ctx, x: number, y: number, k: number, hgt = 15, w = 6.6, royal = false) {
  const l = x - w / 2 * k, r = x + w / 2 * k, t = y - hgt * 0.62 * k, b = y + hgt * 0.38 * k, skew = 1.2 * k;
  const shape = (ox: number, oy: number) => {
    ctx.beginPath();
    ctx.moveTo(l + ox, b + oy);
    ctx.lineTo(l + ox, t + 2.6 * k + oy);
    ctx.quadraticCurveTo(l + ox, t - 0.8 * k + oy - skew, x + ox, t - 1.2 * k + oy - skew);
    ctx.quadraticCurveTo(r + ox, t - 1.6 * k + oy, r + ox, t + 2.4 * k + oy + skew);
    ctx.lineTo(r + ox, b + oy + skew);
    ctx.closePath();
  };
  shape(0.9 * k, 0.6 * k);
  ctx.fillStyle = ink(REED_D);
  ctx.fill();
  shape(0, 0);
  ctx.fillStyle = ink(REED);
  ctx.fill();
  ctx.save();
  shape(0, 0);
  ctx.clip();
  for (let i = 0; i < hgt * 1.6; i++) { // the woven courses: short staggered strokes over and under the uprights
    const yy = t - 2 * k + i * 0.66 * k;
    for (let j = 0; j < 6; j++) {
      const x0 = l + (j / 6) * (r - l), x1 = l + ((j + 1) / 6) * (r - l), lift = ((x0 - l) / (r - l)) * skew;
      line(ctx, x0, yy + lift, x1, yy + lift + skew / 6, (i + j) % 2 ? REED_D : shade(REED, 0.12), 0.5 * k);
    }
  }
  poly(ctx, [r - 1.6 * k, t, r, t, r, b + skew, r - 1.6 * k, b + skew], 'rgba(0,0,0,0.12)');
  ctx.restore();
  shape(0, 0);
  if (royal) { // a painted lapis border inside the rim, with gold studs
    ctx.strokeStyle = ink(LAPIS);
    ctx.lineWidth = 2.2 * k;
    ctx.stroke();
  }
  ctx.strokeStyle = ink(BRONZE);
  ctx.lineWidth = 0.9 * k;
  ctx.stroke();
  if (royal) for (let i = 0; i < 5; i++) { const yy = t + 3 * k + i * (b - t - 3 * k) / 4; ellipse(ctx, l + 0.6 * k, yy, 0.4 * k, 0.4 * k, GOLD); ellipse(ctx, r - 0.6 * k, yy + skew, 0.4 * k, 0.4 * k, GOLD); }
  const by = y - hgt * 0.14 * k;
  ellipse(ctx, x + 0.4 * k, by + 0.4 * k, 2 * k, 2 * k, BRONZE_D);
  ellipse(ctx, x, by, 1.9 * k, 1.9 * k, LAPIS);
  rosette(ctx, x, by, 1.5 * k, GOLD_L, GOLD);
  for (const yy of [t + 1.4 * k, b - 1 * k]) for (const xx of [l + 0.9 * k, r - 0.9 * k]) ellipse(ctx, xx, yy + (xx > x ? skew : 0), 0.35 * k, 0.35 * k, BRONZE_L); // rivets
}

/** A round shield of leather on a wicker frame, rimmed in bronze, painted lapis with a gold rosette. */
function roundShield(ctx: Ctx, cx: number, cy: number, r: number, k: number, face = LAPIS) {
  ellipse(ctx, cx + 0.8 * k, cy + 0.6 * k, r, r * 1.05, BRONZE_D);
  ellipse(ctx, cx, cy, r, r * 1.05, BRONZE);
  ellipse(ctx, cx, cy, r * 0.84, r * 0.88, face);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ellipse(ctx, cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.96, 0.3 * k, 0.3 * k, BRONZE_L); }
  ring(ctx, cx, cy, r * 0.6, r * 0.63, GOLD, 0.5 * k);
  rosette(ctx, cx, cy, r * 0.42, GOLD_L, GOLD);
  ellipse(ctx, cx - r * 0.4, cy - r * 0.45, r * 0.16, r * 0.24, 'rgba(255,255,255,0.25)');
}

function weapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  switch (kind) {
    case 'warrior':
      mace(ctx, x, y, k);
      roundShield(ctx, b.off.x - 1.4 * k, b.off.y - 5.4 * k, 4.6 * k, k, REED);
      return true;
    case 'archer': bow(ctx, x, y, k); return true;
    case 'sabum': case 'defender': spear(ctx, x, y, k, kind === 'sabum' ? 1.12 : 1, kind === 'sabum' ? LAPIS : null); return true;
    case 'swordsman': sickleSword(ctx, x, y, k); return true;
    case 'giant': sickleSword(ctx, x, y, k, 1.25); return true;
    case 'explorer': staff(ctx, x, y, k); return true;
  }
  return false;
}

function shield(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number): boolean {
  if (kind === 'sabum' || kind === 'defender') tallShield(ctx, x - 0.4 * k, y - 5.4 * k, k, kind === 'sabum' ? 20 : 16, kind === 'sabum' ? 7.2 : 6.6, kind === 'sabum');
  else roundShield(ctx, x - 1.4 * k, y - 5.6 * k, kind === 'giant' ? 5.4 * k : 5.2 * k, k);
  return true;
}

// ---------------------------------------------------------------- figures on foot

function footUnit(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  if (kind === 'archer') quiver(ctx, x, y, k);
  const b = figure(ctx, kind, 'babylon', x, y, k);
  // sandal straps over the ankles
  for (const [dx, dy, f] of [[-2.2, -0.3, 'L'], [2.2, 0.7, 'R'], [2.2, 0.7, 'L']] as const) faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0.1, 0.9, 0.22, 0.28, '#5a3a1e');
  weapon(ctx, kind, b, k);
  if (kind === 'sabum' || kind === 'defender' || kind === 'swordsman' || kind === 'giant') shield(ctx, kind, b.off.x, b.off.y, k);
}

// ---------------------------------------------------------------- cavalry: the horseman and the war chariot

/** Fringed, tasselled tack: a breast collar hung with tassels, a plume and a lapis forehead disc. */
function horseTack(ctx: Ctx, x: number, y: number, k: number) {
  line(ctx, x + 5 * k, y - 10 * k, x + 9.6 * k, y - 5.6 * k, MADDER, 1 * k);
  for (let i = 0; i < 4; i++) {
    const t = i / 3, px = x + 5 * k + 4.6 * k * t, py = y - 10 * k + 4.4 * k * t;
    line(ctx, px, py, px - 0.2 * k, py + 2.4 * k, i % 2 ? MADDER_D : GOLD, 0.7 * k);
    ellipse(ctx, px, py, 0.5 * k, 0.5 * k, GOLD);
  }
  ellipse(ctx, x + 12 * k, y - 16.4 * k, 0.9 * k, 0.9 * k, LAPIS);
  ellipse(ctx, x + 12 * k, y - 16.4 * k, 0.4 * k, 0.4 * k, GOLD);
  for (let i = 0; i < 4; i++) curve(ctx, x + 9.6 * k, y - 20 * k, x + 9 * k - i * 0.4 * k, y - 24 * k, x + 7 * k - i * 0.8 * k, y - 23 * k + i * 0.4 * k, 0.7 * k, i % 2 ? MADDER : '#d84a3a'); // the plume
}

function horseman(ctx: Ctx, x: number, y: number) {
  const saddle = drawHorse(ctx, x - 1, y + 3, 0.92, '#a8784a', '#2a1a10', undefined, LAPIS);
  // a fringed lapis saddle cloth
  poly(ctx, [saddle.x - 4, saddle.y + 1.2, saddle.x + 3.4, saddle.y + 0.8, saddle.x + 3.8, saddle.y + 5, saddle.x - 3.6, saddle.y + 5.6], LAPIS);
  line(ctx, saddle.x - 3.6, saddle.y + 5.6, saddle.x + 3.8, saddle.y + 5, GOLD, 0.8);
  for (let i = 0; i <= 8; i++) { const t = i / 8; line(ctx, saddle.x - 3.6 + 7.4 * t, saddle.y + 5.6 - 0.6 * t, saddle.x - 3.6 + 7.4 * t, saddle.y + 7 - 0.6 * t, i % 2 ? GOLD_D : GOLD, 0.4); }
  horseTack(ctx, x - 1, y + 3, 0.92);
  const b = figure(ctx, 'rider', 'babylon', saddle.x, saddle.y, 0.9, true);
  roundShield(ctx, b.off.x - 2.2, b.off.y - 2.6, 3.8, 0.7);
  spear(ctx, b.hand.x, b.hand.y + 1, 0.9, 1.05, MADDER);
}

/** A six-spoked chariot wheel, its tyre studded with bronze nails. */
function wheel(ctx: Ctx, x: number, y: number, r: number, far = false) {
  const c = far ? shade(WOOD, -0.3) : WOOD;
  ellipse(ctx, x + 0.5, y + 0.4, r * 0.82, r, shade(c, -0.35));
  ellipse(ctx, x, y, r * 0.82, r, c);
  ellipse(ctx, x, y, r * 0.66, r * 0.84, shade(c, -0.45));
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI; line(ctx, x + Math.cos(a) * r * 0.66, y + Math.sin(a) * r * 0.84, x - Math.cos(a) * r * 0.66, y - Math.sin(a) * r * 0.84, far ? WOOD : WOOD_L, 0.7); }
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ellipse(ctx, x + Math.cos(a) * r * 0.75, y + Math.sin(a) * r * 0.92, 0.3, 0.3, BRONZE_L); }
  ellipse(ctx, x, y, r * 0.2, r * 0.24, BRONZE);
}

/** The two-horse war chariot: a driver and a spearman in a lapis-panelled car on six-spoked wheels. */
function chariot(ctx: Ctx, x: number, y: number) {
  softShadow(ctx, x + 2, y + 2, 22, 6, 0.3);
  // the far horse, then the far wheel
  drawHorse(ctx, x + 9, y - 1.6, 0.74, '#6a4a30', '#1a120c', undefined, LAPIS);
  horseTack(ctx, x + 9, y - 1.6, 0.74);
  wheel(ctx, x - 7.6, y - 4.4, 5.4, true);
  // the pole runs from under the car to the yoke over the horses' withers
  line(ctx, x - 4, y - 4, x + 13.6, y - 11.4, WOOD_D, 1.2);
  // the car: a back rail, the crew, then the front panel over their legs
  const cx = x - 6, cy = y - 4;
  poly(ctx, [cx - 6, cy - 6.4, cx + 4, cy - 8.6, cx + 4, cy - 7.4, cx - 6, cy - 5.2], WOOD_D);
  const spear2 = figure(ctx, 'knight', 'babylon', cx - 3.4, cy - 5, 0.72, true);
  const driver = figure(ctx, 'sabum', 'babylon', cx + 2.2, cy - 4.2, 0.68, true);
  spear(ctx, spear2.hand.x, spear2.hand.y, 0.7, 1.2, MADDER);
  // the front: a lapis panel with a gold border and rosette, a quiver of javelins at the corner
  poly(ctx, [cx - 6.6, cy - 6, cx + 5, cy - 8.4, cx + 6.4, cy - 1.4, cx - 5.4, cy + 1], LAPIS);
  poly(ctx, [cx + 5, cy - 8.4, cx + 6.4, cy - 1.4, cx + 7.4, cy - 2.6, cx + 6.2, cy - 8.8], LAPIS_D);
  ctx.strokeStyle = ink(GOLD);
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(cx - 6.6, cy - 6); ctx.lineTo(cx + 5, cy - 8.4); ctx.lineTo(cx + 6.4, cy - 1.4); ctx.lineTo(cx - 5.4, cy + 1); ctx.closePath();
  ctx.stroke();
  rosette(ctx, cx - 0.4, cy - 3.6, 1.8, GOLD_L, GOLD);
  for (const t of [0.15, 0.85]) ellipse(ctx, cx - 6 + 11.4 * t, cy - 6.6 + -2.4 * t + 3.4, 0.5, 0.5, GOLD);
  box(ctx, cx + 6.4, cy - 3, 1.8, 7, '#7a4a24');
  for (const i of [0, 1]) line(ctx, cx + 6 + i, cy - 10, cx + 6.6 + i * 0.8, cy - 14.4, WOOD_L, 0.5);
  // the reins from the driver's hands to the bits
  curve(ctx, driver.hand.x, driver.hand.y, x + 6, y - 15, x + 18, y - 12.6, 0.45, '#3a2414');
  curve(ctx, driver.hand.x, driver.hand.y + 0.6, x + 4, y - 12, x + 15.4, y - 10.6, 0.45, '#3a2414');
  // the near wheel and the near horse
  wheel(ctx, x - 5.4, y - 1.6, 6);
  drawHorse(ctx, x + 6.4, y + 2.6, 0.78, '#c8945a', '#2a1a10', undefined, LAPIS);
  horseTack(ctx, x + 6.4, y + 2.6, 0.78);
  // the yoke saddle over the near horse's withers, in place of a rider's saddle
  poly(ctx, [x + 2.4, y - 8.6, x + 8.2, y - 9.6, x + 8.6, y - 6.6, x + 2.8, y - 5.6], LAPIS);
  line(ctx, x + 2.8, y - 5.6, x + 8.6, y - 6.6, GOLD, 0.6);
  line(ctx, x + 4.6, y - 11.4, x + 12.4, y - 14.6, WOOD_D, 1.4); // the yoke
  ellipse(ctx, x + 8.4, y - 13, 0.8, 0.8, BRONZE);
}

// ---------------------------------------------------------------- the siege engine

function siegeEngine(ctx: Ctx, x: number, y: number) {
  softShadow(ctx, x, y + 2, 22, 6.5, 0.3);
  // the body: a long wheeled frame covered in wicker panels and hides, its roof curved
  const L = x - 15, R = x + 8, base = y + 1, top = y - 11;
  poly(ctx, [L, base, R, base + 2, R, top + 2, L, top], REED);
  ctx.save();
  ctx.beginPath(); ctx.moveTo(L, base); ctx.lineTo(R, base + 2); ctx.lineTo(R, top + 2); ctx.lineTo(L, top); ctx.closePath(); ctx.clip();
  for (let i = 0; i < 14; i++) line(ctx, L, top + i * 0.95, R, top + 2 + i * 0.95, i % 2 ? REED_D : REED_L, 0.4);
  for (let i = 1; i < 6; i++) line(ctx, L + i * 4, top - 1, L + i * 4, base + 3, WOOD_D, 0.8);
  ctx.restore();
  poly(ctx, [L, top, R, top + 2, R - 1, top - 3, L + 1, top - 4.6], '#a8784a'); // hides over the curved roof
  poly(ctx, [L + 1, top - 4.6, R - 1, top - 3, R - 4, top - 5.4, L + 3, top - 6.4], '#c8986a');
  for (const t of [0.25, 0.55, 0.85]) line(ctx, L + 1 + (R - L - 2) * t, top - 4.6 + 1.6 * t, L + (R - L) * t, top + 2 * t, '#6a4a2a', 0.5); // the lashings
  // the ram: a heavy beam out of the front, slung on a chain, with a bronze axe-blade head
  const rx0 = R - 6, ry0 = y - 5, rx1 = x + 20, ry1 = y - 3.6;
  line(ctx, rx0, ry0, rx1, ry1, WOOD_D, 2.6);
  line(ctx, rx0, ry0 - 0.8, rx1, ry1 - 0.8, WOOD_L, 0.6);
  poly(ctx, [rx1 - 0.4, ry1 - 3.4, rx1 + 4.6, ry1 - 0.6, rx1 - 0.4, ry1 + 2.2], BRONZE);
  poly(ctx, [rx1 - 0.4, ry1 - 3.4, rx1 + 4.6, ry1 - 0.6, rx1 + 1, ry1 - 0.8], BRONZE_L);
  for (const t of [0.3, 0.55]) line(ctx, rx0 + (rx1 - rx0) * t, ry0 + (ry1 - ry0) * t - 1.4, rx0 + (rx1 - rx0) * t, ry0 + (ry1 - ry0) * t + 1.4, BRONZE_D, 0.8);
  // the turret over the front, crenellated, an archer behind its parapet
  const tx = x + 1, tb = y - 6;
  box(ctx, tx, tb, 9, 14, REED, '#a8784a');
  for (let i = 1; i < 6; i++) band(ctx, tx, tb, 9, 14, i / 6, i / 6 + 0.03, REED_D);
  faceQuad(ctx, 'R', tx, tb, 9, 14, 0.3, 0.7, 0.4, 0.66, '#2a1a10'); // a shooting window
  const archer = figure(ctx, 'archer', 'babylon', tx - 0.6, tb - 14, 0.55, true);
  bow(ctx, archer.hand.x, archer.hand.y, 0.55);
  for (let i = 0; i < 4; i++) box(ctx, tx - 3.6 + i * 2.4, tb - 14 + (i * 2.4) * 0.5 + 1.4, 1.4, 2, REED_D, REED); // merlons along the front
  line(ctx, tx + 2, tb - 13, rx0 + 9, ry0 - 1, '#5a5a62', 0.6); // the chain
  // a lapis banner with a gold star
  line(ctx, L + 2, top - 5, L + 2, top - 20, WOOD_D, 0.8);
  poly(ctx, [L + 2, top - 20, L + 9, top - 18.6, L + 7.4, top - 16.4, L + 9, top - 14, L + 2, top - 15], LAPIS);
  ellipse(ctx, L + 5.4, top - 17.2, 1.1, 1.1, GOLD);
  // the wheels
  for (const wx of [L + 4, L + 12, R - 2]) wheel(ctx, wx, base + 1 + (wx - L) * 0.087, 3.6);
}

// ---------------------------------------------------------------- boats

/** Water rings round a hull. */
function wake(ctx: Ctx, x: number, y: number, rx: number) {
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, rx * 0.22, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.stroke();
}

/** The gufa: a round basket boat of woven reed coated in bitumen, a boatman with a paddle, jars and dates aboard. */
function gufa(ctx: Ctx, x: number, y: number) {
  const r = 13, ry = 6;
  ellipse(ctx, x, y - 5, r, ry, '#1e1814'); // the inside
  ellipse(ctx, x + 0.6, y - 4.4, r - 2, ry - 1.4, '#3a2e24');
  // cargo: jars and a basket of dates, the boatman
  for (const [dx, c] of [[-5, '#b0784a'], [-2, '#c8905a']] as const) { ellipse(ctx, x + dx, y - 6.6, 1.8, 2.4, c); ellipse(ctx, x + dx - 0.5, y - 7.4, 0.6, 0.9, shade(c, 0.3)); ellipse(ctx, x + dx, y - 8.8, 0.9, 0.4, '#3a2414'); }
  ellipse(ctx, x + 6, y - 6.4, 2.6, 1.6, REED);
  for (let i = 0; i < 6; i++) ellipse(ctx, x + 5 + (i % 3) * 1, y - 7.2 - Math.floor(i / 3) * 0.6, 0.6, 0.6, i % 2 ? '#b8441c' : '#d8902a');
  const b = figure(ctx, 'warrior', 'babylon', x + 1, y - 4.6, 0.55, true);
  line(ctx, b.hand.x - 1, b.hand.y - 6, b.hand.x + 5, b.hand.y + 10, WOOD, 0.9); // the paddle
  ellipse(ctx, b.hand.x + 5.4, b.hand.y + 11, 1.1, 2, WOOD_L);
  // the hull's outer wall, black with bitumen, its weave showing as ribs
  ctx.beginPath();
  ctx.ellipse(x, y - 5, r, ry, 0, 0, Math.PI);
  ctx.lineTo(x - r + 1, y - 2);
  ctx.ellipse(x, y - 1.4, r - 1, ry + 0.4, 0, Math.PI, 0, true);
  ctx.closePath();
  ctx.fillStyle = ink(BITUMEN);
  ctx.fill();
  for (let i = 1; i < 12; i++) { const a = (i / 12) * Math.PI, px = x + Math.cos(a) * r, py = y - 5 + Math.sin(a) * ry; line(ctx, px, py, x + Math.cos(a) * (r - 1), y - 1.4 + Math.sin(a) * (ry + 0.4), '#4a3c30', 0.5); }
  ring(ctx, x, y - 5, r, ry, '#5a4a3a', 1, 0, Math.PI); // the bound rim
  ring(ctx, x, y - 5.3, r, ry, '#8a7a5a', 0.4, 0.1 * Math.PI, 0.6 * Math.PI);
  ellipse(ctx, x - r * 0.45, y - 2.6, 2, 0.7, 'rgba(255,255,255,0.18)'); // the bitumen's gloss
  wake(ctx, x, y + 0.6, r * 0.95);
}

/** A crescent hull: `body` fills it; returns the deck line. */
function crescent(ctx: Ctx, x: number, y: number, w: number, lift: number, deep: number, c: string, cD: string) {
  const top = (t: number) => y - 5 - Math.pow(Math.abs(t), 3) * lift;
  const pts: number[] = [];
  for (let i = 0; i <= 16; i++) { const t = -1 + i / 8; pts.push(x + t * w, top(t)); }
  pts.push(x + w * 0.8, y - 2, x + w * 0.4, y + deep * 0.6, x, y + deep * 0.7, x - w * 0.4, y + deep * 0.6, x - w * 0.8, y - 2);
  poly(ctx, pts, c);
  poly(ctx, [x - w * 0.86, y - 2.4, x - w * 0.4, y + deep * 0.6, x, y + deep * 0.7, x + w * 0.4, y + deep * 0.6, x + w * 0.86, y - 2.4, x + w * 0.4, y - 0.4, x, y, x - w * 0.4, y - 0.4], cD);
  return top;
}

/** The reed boat: bundles of reed lashed into a crescent, both ends curled high, a mat cabin and a square linen sail. */
function reedBoat(ctx: Ctx, x: number, y: number) {
  const w = 22;
  // the sail on a bipod mast
  const mx = x + 2;
  line(ctx, mx - 2, y - 6, mx, y - 34, WOOD_D, 1);
  line(ctx, mx + 2, y - 6, mx, y - 34, WOOD, 1);
  poly(ctx, [mx - 8, y - 31, mx + 9, y - 32, mx + 10, y - 13, mx - 7, y - 12], '#efe6cc');
  poly(ctx, [mx + 1, y - 31.6, mx + 9, y - 32, mx + 10, y - 13, mx + 1.4, y - 12.5], '#d8ceb0');
  for (const v of [0.18, 0.82]) line(ctx, mx - 8 + v * 0.5, y - 31 + 19 * v, mx + 9 + v, y - 32 + 19 * v, LAPIS, 1.2);
  rosette(ctx, mx + 1, y - 22, 2.4, GOLD_L, LAPIS);
  line(ctx, mx - 8.4, y - 31.2, mx + 9.4, y - 32.2, WOOD_D, 0.8); // the yard
  line(ctx, mx - 7.4, y - 12, mx + 10.4, y - 13, WOOD_D, 0.7);
  // a mat cabin aft and the crew
  const cabin = () => {
    ctx.beginPath();
    ctx.moveTo(x - 14, y - 6);
    ctx.bezierCurveTo(x - 14, y - 13, x - 5, y - 13, x - 5, y - 6);
    ctx.closePath();
    ctx.fillStyle = ink(REED_D);
    ctx.fill();
    for (let i = 0; i < 5; i++) curve(ctx, x - 13.4 + i * 0.3, y - 6 - i * 1.2, x - 9.5, y - 12.6 + i * 1.1, x - 5.6 - i * 0.3, y - 6 - i * 1.2, 0.4, REED);
  };
  cabin();
  figure(ctx, 'archer', 'babylon', x + 7, y - 5, 0.46, true);
  figure(ctx, 'warrior', 'babylon', x - 1, y - 5, 0.46, true);
  // the hull of lashed bundles
  const top = crescent(ctx, x, y, w, 9, 4, REED, REED_D);
  for (let i = 1; i < 4; i++) { // the bundles' seams running the length
    ctx.strokeStyle = ink(shade(REED, -0.18 * i));
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let j = 0; j <= 16; j++) { const t = -1 + j / 8, px = x + t * w * (1 - i * 0.04), py = top(t) + i * 1.6; if (j) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.stroke();
  }
  for (let i = 0; i < 9; i++) { const t = -0.8 + i * 0.2; line(ctx, x + t * w, top(t) - 0.2, x + t * w * 0.96, y + 1.4, MADDER_D, 0.8); } // the lashings
  // the ends curl back over
  for (const d of [-1, 1]) {
    const ex = x + d * w, ey = top(d);
    curve(ctx, ex - d * 1.4, ey + 2, ex + d * 1.6, ey - 2, ex - d * 1.4, ey - 3.6, 2.4, REED);
    curve(ctx, ex - d * 1.4, ey + 2, ex + d * 1.6, ey - 2, ex - d * 1.4, ey - 3.6, 0.6, REED_L);
  }
  wake(ctx, x, y + 2, w * 0.8);
}

/** The wooden river ship: a plank hull with a horse-headed prow, oars, shields on the rail and a striped sail. */
function riverShip(ctx: Ctx, x: number, y: number) {
  const w = 27;
  const mx = x + 3;
  line(ctx, mx, y - 6, mx, y - 44, WOOD_D, 1.5);
  poly(ctx, [mx - 11, y - 41, mx + 12, y - 42, mx + 13, y - 17, mx - 10, y - 16], '#efe6cc');
  for (let i = 0; i < 5; i++) { const x0 = mx - 11 + i * 4.6 + 1.2; poly(ctx, [x0, y - 41 - i * 0.2, x0 + 2.3, y - 41.1 - i * 0.2, x0 + 2.5 + 0.2, y - 16.2 - i * 0.2, x0 + 0.2, y - 16 - i * 0.2], LAPIS); } // stripes
  poly(ctx, [mx + 1, y - 41.5, mx + 12, y - 42, mx + 13, y - 17, mx + 1.4, y - 16.5], 'rgba(0,0,0,0.12)');
  line(ctx, mx - 11.4, y - 41.2, mx + 12.4, y - 42.2, WOOD_D, 1);
  line(ctx, mx - 10.4, y - 16, mx + 13.4, y - 17, WOOD_D, 0.8);
  for (const s of [-1, 1]) line(ctx, mx, y - 44, mx + s * 12, y - 41.6, 'rgba(60,40,20,0.5)', 0.35);
  poly(ctx, [mx, y - 44, mx + 7, y - 43, mx + 5, y - 41.4, mx + 7, y - 40, mx, y - 41], GOLD); // the pennant
  // the deck: a raised stern castle with archers, soldiers along the rail
  const top = crescent(ctx, x, y, w, 6, 5, '#7a5232', '#4a3020');
  box(ctx, x - 18, y - 7, 9, 5, '#8a5a34', '#a8784a');
  band(ctx, x - 18, y - 7, 9, 5, 0.8, 1, LAPIS);
  for (const [cx2, kd] of [[-0.66, 'archer'], [-0.22, 'sabum'], [0.12, 'swordsman'], [0.46, 'archer']] as const) figure(ctx, kd, 'babylon', x + cx2 * w, cx2 < -0.5 ? y - 11.4 : y - 5.4, 0.42, true);
  // the strakes, the shields hung along the rail, the oars
  for (const d of [1.4, 3]) {
    ctx.strokeStyle = ink(d < 2 ? WOOD_L : WOOD_D);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let j = 0; j <= 16; j++) { const t = -1 + j / 8; const px = x + t * w * 0.96, py = top(t) + d; if (j) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.stroke();
  }
  for (let i = 0; i < 6; i++) { const t = -0.5 + i * 0.2; roundShield(ctx, x + t * w, top(t) + 0.6, 2.2, 0.45, i % 2 ? LAPIS : MADDER); }
  for (let i = 0; i < 8; i++) { const t = -0.7 + i * 0.19, ox = x + t * w, oy = top(t) + 2.6; line(ctx, ox, oy, ox + 1.4 + (i % 2), oy + 7.6, WOOD_L, 0.7); ellipse(ctx, ox + 1.8 + (i % 2), oy + 8.2, 0.9, 1.4, WOOD); }
  // the horse-headed prow and the curled stern post
  const bx = x + w, by = top(1);
  curve(ctx, bx - 1.4, by + 1.6, bx + 2.6, by - 2.6, bx + 1, by - 6, 2, WOOD);
  poly(ctx, [bx + 0.4, by - 6.6, bx + 4.4, by - 6.4, bx + 4.6, by - 5, bx + 1.6, by - 4.4], WOOD_L); // the head
  poly(ctx, [bx + 0.6, by - 6.6, bx + 1.6, by - 8.6, bx + 2, by - 6.6], WOOD); // the ear
  ellipse(ctx, bx + 2.2, by - 5.8, 0.35, 0.35, '#101010');
  line(ctx, bx - 0.6, by - 5.6, bx - 0.6, by - 2, LAPIS, 0.8); // a lapis mane
  const sx = x - w, sy = top(-1);
  curve(ctx, sx + 1.4, sy + 2, sx - 2.6, sy - 3, sx + 0.4, sy - 6.4, 1.8, WOOD);
  ellipse(ctx, sx + 0.6, sy - 6.4, 1, 1, GOLD);
  wake(ctx, x, y + 3, w * 0.86);
}

// ---------------------------------------------------------------- buildings

/** Iso point at (u, v) from (cx, cy): u runs down to the right, v down to the left. */
const P = (cx: number, cy: number, u: number, v: number, h = 0): [number, number] => [cx + u - v, cy + (u + v) / 2 - h];

/** A rectangular block: half-extents A along u and B along v, `h` high, lit and shaded faces and a lid. */
function block(ctx: Ctx, cx: number, cy: number, A: number, B: number, h: number, color: string, lid?: string) {
  poly(ctx, [...P(cx, cy, -A, B), ...P(cx, cy, A, B), ...P(cx, cy, A, B, h), ...P(cx, cy, -A, B, h)], shade(color, 0.06));
  poly(ctx, [...P(cx, cy, A, B), ...P(cx, cy, A, -B), ...P(cx, cy, A, -B, h), ...P(cx, cy, A, B, h)], shade(color, -0.22));
  poly(ctx, [...P(cx, cy, -A, -B, h), ...P(cx, cy, A, -B, h), ...P(cx, cy, A, B, h), ...P(cx, cy, -A, B, h)], lid ?? shade(color, 0.2));
}

/** A doorway (or window) on the lit face of a block: centred at u, from height h0 up `hh`, `hw` wide. */
function opening(ctx: Ctx, cx: number, cy: number, u: number, B: number, hw: number, h0: number, hh: number, c = '#2a1a10', arch = false) {
  const a = P(cx, cy, u - hw, B, h0), b = P(cx, cy, u + hw, B, h0), d = P(cx, cy, u - hw, B, h0 + hh), e = P(cx, cy, u + hw, B, h0 + hh);
  if (arch) { const m = P(cx, cy, u, B, h0 + hh + hw * 0.9); poly(ctx, [...a, ...b, ...e, ...m, ...d], c); }
  else poly(ctx, [...a, ...b, ...e, ...d], c);
}
/** The same on the shaded face (the u = A side), centred at v. */
function openingR(ctx: Ctx, cx: number, cy: number, A: number, v: number, hw: number, h0: number, hh: number, c = '#1e140c') {
  const a = P(cx, cy, A, v + hw, h0), b = P(cx, cy, A, v - hw, h0), d = P(cx, cy, A, v + hw, h0 + hh), e = P(cx, cy, A, v - hw, h0 + hh);
  poly(ctx, [...a, ...b, ...e, ...d], c);
}

/** The palm-trunk beam ends that carry a flat roof, poking out under the parapet. */
function beamEnds(ctx: Ctx, cx: number, cy: number, A: number, B: number, h: number, n: number) {
  for (let i = 0; i < n; i++) {
    const [px, py] = P(cx, cy, -A + (2 * A * (i + 0.5)) / n, B, h);
    ellipse(ctx, px, py, 0.6, 0.55, WOOD_D);
    ellipse(ctx, px - 0.15, py - 0.1, 0.35, 0.3, WOOD_L);
  }
  for (let i = 0; i < Math.max(2, n - 2); i++) { const [px, py] = P(cx, cy, A, B - (2 * B * (i + 0.5)) / Math.max(2, n - 2), h); ellipse(ctx, px, py, 0.55, 0.5, shade(WOOD_D, -0.2)); }
}

/** A low parapet round a flat roof, with the roof's packed-earth floor inside it. */
function parapet(ctx: Ctx, cx: number, cy: number, A: number, B: number, h: number, color: string) {
  const y = cy - h;
  poly(ctx, [...P(cx, y, -A, -B), ...P(cx, y, A, -B), ...P(cx, y, A, B), ...P(cx, y, -A, B)], shade(color, -0.12)); // the roof floor, a step down
  const t = 0.8, ph = 1.4;
  for (const [u0, v0, u1, v1, s] of [[-A, -B, A, -B, -0.1], [-A, -B, -A, B, 0.02]] as const) poly(ctx, [...P(cx, y, u0, v0), ...P(cx, y, u1, v1), ...P(cx, y, u1, v1, ph), ...P(cx, y, u0, v0, ph)], shade(color, s)); // the inner faces of the back walls
  for (const [u0, v0, u1, v1] of [[-A, B - t, A, B - t], [A - t, -B, A - t, B]] as const) {
    poly(ctx, [...P(cx, y, u0, v0, ph), ...P(cx, y, u1, v1, ph), ...P(cx, y, u1 + (u0 === u1 ? t : 0), v1 + (v0 === v1 ? t : 0), ph), ...P(cx, y, u0 + (u0 === u1 ? t : 0), v0 + (v0 === v1 ? t : 0), ph)], shade(color, 0.25));
  }
  poly(ctx, [...P(cx, y, -A, B), ...P(cx, y, A, B), ...P(cx, y, A, B, ph), ...P(cx, y, -A, B, ph)], shade(color, 0.06));
  poly(ctx, [...P(cx, y, A, B), ...P(cx, y, A, -B), ...P(cx, y, A, -B, ph), ...P(cx, y, A, B, ph)], shade(color, -0.22));
  const a = P(cx, y, -A, B, ph), b = P(cx, y, A, B, ph), c = P(cx, y, A, -B, ph);
  line(ctx, a[0], a[1], b[0], b[1], shade(color, 0.35), 0.5);
  line(ctx, b[0], b[1], c[0], c[1], shade(color, 0.1), 0.5);
}

/** A flat-roofed house of mud brick: beam ends, a door and high windows, a parapet round the roof terrace. */
function house(ctx: Ctx, x: number, y: number, A: number, B: number, h: number, roofC: string, opts: { upper?: boolean; awning?: boolean; ladder?: boolean; jar?: boolean } = {}) {
  ellipse(ctx, x + 1, y + 1.4, (A + B) * 1.05, (A + B) * 0.45, 'rgba(0,0,0,0.16)');
  block(ctx, x, y, A, B, h, BRICK);
  // the plaster worn away in patches, showing the brick courses
  for (const [u, z] of [[-A * 0.5, h * 0.3], [A * 0.4, h * 0.7]] as const) {
    for (let i = 0; i < 3; i++) { const a = P(x, y, u - 1.6, B, z + i * 0.8), b = P(x, y, u + 1.6, B, z + i * 0.8); line(ctx, a[0], a[1], b[0], b[1], BRICK_D, 0.35); }
  }
  opening(ctx, x, y, A * 0.25, B, 1.1, 0, Math.min(4, h * 0.62), '#2a1a10');
  const dl = P(x, y, A * 0.25 - 1.5, B, Math.min(4, h * 0.62) + 0.3), dr = P(x, y, A * 0.25 + 1.5, B, Math.min(4, h * 0.62) + 0.3);
  line(ctx, dl[0], dl[1], dr[0], dr[1], WOOD, 0.8); // the lintel
  opening(ctx, x, y, -A * 0.55, B, 0.7, h * 0.66, 1, '#3a2414');
  openingR(ctx, x, y, A, 0, 0.7, h * 0.66, 1);
  beamEnds(ctx, x, y, A, B, h - 0.6, Math.round(A / 1.6));
  parapet(ctx, x, y, A, B, h, BRICK_L);
  if (opts.upper) { // a small upper room at the back of the roof
    const uy = y - h;
    block(ctx, x - A * 0.3, uy - B * 0.3, A * 0.5, B * 0.55, 4, BRICK, shade(BRICK_L, 0.05));
    opening(ctx, x - A * 0.3, uy - B * 0.3, 0, B * 0.55, 0.8, 0, 2.6, '#2a1a10');
    beamEnds(ctx, x - A * 0.3, uy - B * 0.3, A * 0.5, B * 0.55, 3.6, 3);
  }
  if (opts.awning) { // a reed-mat sunshade on four poles over the terrace
    const ay = y - h;
    for (const [u, v] of [[A * 0.1, B * 0.6], [A * 0.8, B * 0.6], [A * 0.8, -B * 0.4]] as const) { const p = P(x, ay, u, v); line(ctx, p[0], p[1], p[0], p[1] - 4, WOOD_D, 0.6); }
    poly(ctx, [...P(x, ay, A * 0.0, -B * 0.5, 4), ...P(x, ay, A * 0.9, -B * 0.5, 4), ...P(x, ay, A * 0.9, B * 0.7, 4), ...P(x, ay, A * 0.0, B * 0.7, 4)], mix(REED, roofC, 0.35));
    for (let i = 1; i < 5; i++) { const a = P(x, ay, A * 0.9 * (i / 5), -B * 0.5, 4), b = P(x, ay, A * 0.9 * (i / 5), B * 0.7, 4); line(ctx, a[0], a[1], b[0], b[1], REED_D, 0.35); }
  }
  if (opts.ladder) { // a palm-wood ladder up the shaded wall to the roof
    const a = P(x, y, A + 1.6, B * 0.2), b = P(x, y, A, B * 0.2, h + 1.4);
    for (const o of [-0.8, 0.8]) line(ctx, a[0] + o, a[1], b[0] + o, b[1], WOOD_L, 0.55);
    for (let i = 1; i < 5; i++) { const t = i / 5; line(ctx, a[0] - 0.8 + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[0] + 0.8 + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, WOOD_L, 0.45); }
  }
  if (opts.jar) { // a water jar by the door
    const [jx, jy] = P(x, y, A * 0.25 + 3, B + 1.4);
    ellipse(ctx, jx, jy - 1.6, 1.4, 1.8, '#b0784a');
    ellipse(ctx, jx - 0.4, jy - 2, 0.5, 0.8, '#d0986a');
    ellipse(ctx, jx, jy - 3.3, 0.8, 0.35, '#3a2414');
  }
}

/** A reed house of the marshes: bundled reed arches under a barrel roof of reed mats, a latticed end. */
function reedHut(ctx: Ctx, x: number, y: number, s: number) {
  const A = 7 * s, B = 3.6 * s, h = 7.4 * s;
  ellipse(ctx, x + 1, y + 1.4, (A + B) * 1.05, (A + B) * 0.4, 'rgba(0,0,0,0.16)');
  // the barrel roof: a half-ellipse cross-section swept along u
  const sec = (u: number, t: number): [number, number] => { const v = B * Math.cos(t), z = h * Math.sin(t); return P(x, y, u, v, z); };
  const N = 10;
  // the long lit side of the vault, then the end
  const lit: number[] = [];
  for (let i = 0; i <= N / 2; i++) lit.push(...sec(-A, (i / N) * Math.PI));
  for (let i = N / 2; i >= 0; i--) lit.push(...sec(A, (i / N) * Math.PI));
  poly(ctx, lit, REED);
  for (let j = 1; j < 7; j++) { const t = (j / 7) * (Math.PI / 2); const a = sec(-A, t), b = sec(A, t); line(ctx, a[0], a[1], b[0], b[1], REED_D, 0.4); } // the mat courses
  for (let i = 0; i <= 6; i++) { // the reed-bundle arches showing as ribs
    const u = -A + (2 * A * i) / 6;
    ctx.strokeStyle = ink(REED_L);
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (let j = 0; j <= N / 2; j++) { const p = sec(u, (j / N) * Math.PI); if (j) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }
    ctx.stroke();
  }
  // the end wall: latticed reeds, a dark door
  const end: number[] = [];
  for (let i = 0; i <= N; i++) end.push(...sec(A, (i / N) * Math.PI));
  poly(ctx, end, shade(REED, -0.2));
  for (let i = 1; i < 6; i++) { const v = B - (2 * B * i) / 6; const a = P(x, y, A, v), z = h * Math.sqrt(Math.max(0, 1 - (v / B) ** 2)), b = P(x, y, A, v, z); line(ctx, a[0], a[1], b[0], b[1], REED_D, 0.45); }
  for (let j = 1; j < 4; j++) { const z = (h * j) / 4, vv = B * Math.sqrt(1 - (z / h) ** 2); const a = P(x, y, A, vv, z), b = P(x, y, A, -vv, z); line(ctx, a[0], a[1], b[0], b[1], REED_D, 0.4); }
  const d0 = P(x, y, A, 1.2 * s), d1 = P(x, y, A, -1.2 * s);
  poly(ctx, [...d0, ...d1, d1[0], d1[1] - 3.6 * s, d0[0], d0[1] - 3.6 * s], '#2a1a10');
  // the two great bundles framing the doorway, tied at the top
  for (const v of [1.6 * s, -1.6 * s]) { const a = P(x, y, A + 0.4, v), b = P(x, y, A + 0.4, v, h * 0.95); line(ctx, a[0], a[1], b[0], b[1], REED_L, 1.3); }
}

/** The temple: a niched and buttressed mud-brick hall with a cone-mosaic band and a gate of two towers. */
function temple(ctx: Ctx, x: number, y: number, roofC: string) {
  ellipse(ctx, x + 1, y + 2, 20, 7, 'rgba(0,0,0,0.18)');
  datePalm(ctx, ...P(x, y, -12, -8), 0.75, 1);
  const A = 11, B = 7, h = 9;
  block(ctx, x, y, A, B, h, BRICK, BRICK_L);
  // buttresses and recessed niches all along both faces
  for (let i = 0; i < 9; i++) {
    const u = -A + 1.2 + i * 2.45;
    const a = P(x, y, u, B, 0), b = P(x, y, u + 0.9, B, 0), c = P(x, y, u + 0.9, B, h), d = P(x, y, u, B, h);
    poly(ctx, [...a, ...b, ...c, ...d], i % 2 ? shade(BRICK, -0.12) : shade(BRICK, 0.16));
  }
  for (let i = 0; i < 5; i++) {
    const v = B - 1.2 - i * 2.8;
    const a = P(x, y, A, v, 0), b = P(x, y, A, v - 1, 0), c = P(x, y, A, v - 1, h), d = P(x, y, A, v, h);
    poly(ctx, [...a, ...b, ...c, ...d], shade(BRICK, i % 2 ? -0.4 : -0.14));
  }
  // the cone mosaic: a band of red, black and white clay cones in zigzags
  for (let i = 0; i < 22; i++) {
    const u = -A + i * (2 * A / 22), c = ['#b8402a', '#1e1a18', '#f0e8d8'][i % 3];
    const a = P(x, y, u, B, h * 0.52), b = P(x, y, u + 2 * A / 22, B, h * 0.52 + (i % 2 ? 1.4 : 0)), e = P(x, y, u, B, h * 0.52 + 1.4);
    poly(ctx, [...a, ...b, ...e], c);
  }
  for (let i = 0; i < 14; i++) { const v = B - i * (2 * B / 14), a = P(x, y, A, v, h * 0.52), b = P(x, y, A, v - 2 * B / 14, h * 0.52 + (i % 2 ? 1.4 : 0)), e = P(x, y, A, v, h * 0.52 + 1.4); poly(ctx, [...a, ...b, ...e], shade(['#b8402a', '#1e1a18', '#f0e8d8'][i % 3], -0.25)); }
  // the crenellated top: stepped merlons
  for (let i = 0; i < 9; i++) { const [px, py] = P(x, y - h, -A + 1.2 + i * 2.45, B); box(ctx, px, py + 0.5, 1.6, 1.6, BRICK_L); }
  for (let i = 0; i < 5; i++) { const [px, py] = P(x, y - h, A, B - 1.2 - i * 2.8); box(ctx, px, py + 0.5, 1.6, 1.6, shade(BRICK_L, -0.1)); }
  // the gate towers in the middle of the lit face, a gold-framed lapis door
  const gu = 0;
  for (const d of [-1, 1]) block(ctx, ...P(x, y, gu + d * 3.6, B + 1), 1.6, 1.4, h + 3, BRICK, BRICK_L);
  block(ctx, ...P(x, y, gu, B + 0.6), 2.2, 0.8, h + 1, shade(BRICK, -0.05), BRICK_L);
  opening(ctx, x, y, gu, B + 1.4, 1.4, 0, 5.4, LAPIS_D, true);
  opening(ctx, x, y, gu, B + 1.4, 1, 0, 4.8, LAPIS, true);
  const g0 = P(x, y, gu - 1.4, B + 1.4, 6.6), g1 = P(x, y, gu + 1.4, B + 1.4, 6.6);
  line(ctx, g0[0], g0[1], g1[0], g1[1], roofC, 0.8);
  // a bronze brazier on the roof, smoking
  const [bx, by] = P(x, y - h, 4, -3);
  ellipse(ctx, bx, by - 0.6, 1.4, 0.7, BRONZE_D);
  line(ctx, bx, by - 1, bx + 1, by - 6, 'rgba(210,210,210,0.45)', 0.9);
}

/** Golden beasts on glazed brick, drawn in the plane of one face: an aurochs or a striding lion. */
function beast(ctx: Ctx, kind: 'aurochs' | 'lion', s: number) {
  const c = kind === 'lion' ? '#f0c040' : '#f4d070', d = shade(c, -0.3);
  // body, legs, head
  ellipse(ctx, 0, -3.2 * s, 3.4 * s, 1.6 * s, c);
  for (const lx of [-2.4, -1.2, 1.6, 2.6]) line(ctx, lx * s, -2.4 * s, lx * s + (lx < 0 ? -0.2 : 0.3) * s, 0, lx === -1.2 || lx === 2.6 ? d : c, 0.7 * s);
  if (kind === 'aurochs') {
    ellipse(ctx, 3.6 * s, -3.6 * s, 1.2 * s, 1 * s, c);
    curve(ctx, 3.4 * s, -4.4 * s, 4.6 * s, -6.6 * s, 2.6 * s, -6.8 * s, 0.5 * s, '#f8f0d0'); // the horn
    line(ctx, -3.4 * s, -3.4 * s, -4.2 * s, -1.4 * s, d, 0.4 * s);
  } else {
    ellipse(ctx, 3.4 * s, -4 * s, 1.5 * s, 1.4 * s, d); // the mane
    ellipse(ctx, 3.9 * s, -3.8 * s, 0.9 * s, 0.8 * s, c);
    curve(ctx, -3.4 * s, -3.4 * s, -5 * s, -5.2 * s, -4.4 * s, -6 * s, 0.4 * s, c); // the raised tail
  }
}

/** The lapis gate: two crenellated towers flanking an arched passage, glazed blue with rows of golden lions and aurochs. */
function blueGate(ctx: Ctx, x: number, y: number, s = 1) {
  ellipse(ctx, x + 1, y + 2, 20 * s, 7 * s, 'rgba(0,0,0,0.18)');
  const A = 5 * s, B = 2.6 * s, H = 13 * s;
  // the wall between the towers with the passage
  block(ctx, x, y, A, B, H * 0.78, GLAZE, shade(GLAZE, 0.2));
  // the towers either side
  const towers = [-1, 1].map((d) => P(x, y, d * (A + 2.6 * s), 0.6 * s));
  for (const [tx, ty] of towers) {
    block(ctx, tx, ty, 2.6 * s, B + 0.6 * s, H, GLAZE, shade(GLAZE, 0.2));
    for (let i = 0; i < 3; i++) { const [mx, my] = P(tx, ty, -1.8 * s + i * 1.8 * s, B + 0.6 * s, H); box(ctx, mx, my + 0.6 * s, 1.2 * s, 1.4 * s, GLAZE, shade(GLAZE, 0.25)); }
    // rosette borders, top and bottom
    for (const z of [1.2 * s, H - 1.4 * s]) for (let i = 0; i < 5; i++) { const [px, py] = P(tx, ty, -2.2 * s + i * 1.1 * s, B + 0.6 * s, z); ellipse(ctx, px, py, 0.4 * s, 0.4 * s, '#f4ecd0'); }
    // an aurochs above a lion, in the plane of the lit face
    for (const [z, kind] of [[H * 0.62, 'aurochs'], [H * 0.3, 'lion']] as const) {
      const [ox, oy] = P(tx, ty, 0, B + 0.6 * s, z);
      ctx.save();
      ctx.translate(ox, oy);
      ctx.transform(1, 0.5, 0, 1, 0, 0);
      beast(ctx, kind, 0.55 * s);
      ctx.restore();
    }
  }
  // the arched passage, its gold-framed arch and a lion over it
  opening(ctx, x, y, 0, B, 2 * s, 0, 5.4 * s, '#0a0e28', true);
  const a0 = P(x, y, -2.6 * s, B, 0), a1 = P(x, y, -2.6 * s, B, 5.6 * s), am = P(x, y, 0, B, 8 * s), a2 = P(x, y, 2.6 * s, B, 5.6 * s), a3 = P(x, y, 2.6 * s, B, 0);
  ctx.strokeStyle = ink(GOLD);
  ctx.lineWidth = 0.8 * s;
  ctx.beginPath();
  ctx.moveTo(...a0); ctx.lineTo(...a1); ctx.quadraticCurveTo(am[0], am[1], a2[0], a2[1]); ctx.lineTo(...a3);
  ctx.stroke();
  const [ox, oy] = P(x, y, -0.6 * s, B, H * 0.66);
  ctx.save();
  ctx.translate(ox, oy);
  ctx.transform(1, 0.5, 0, 1, 0, 0);
  beast(ctx, 'aurochs', 0.5 * s);
  ctx.restore();
  for (let i = 0; i < 4; i++) { const [mx, my] = P(x, y, -A + 1.2 * s + i * 2.6 * s, B, H * 0.78); box(ctx, mx, my + 0.6 * s, 1.2 * s, 1.4 * s, GLAZE, shade(GLAZE, 0.25)); }
  for (let i = 0; i < 9; i++) { const [px, py] = P(x, y, -A + 0.4 * s + i * 1.15 * s, B, 1); ellipse(ctx, px, py, 0.38 * s, 0.38 * s, '#f4ecd0'); }
  line(ctx, ...P(x, y, -A, B, H * 0.78 - 0.6 * s), ...P(x, y, A, B, H * 0.78 - 0.6 * s), GOLD_D, 0.5 * s);
  // the processional way's walls running off either side, with a striding lion on each
  for (const d of [-1, 1]) {
    const [wx, wy] = P(x, y, d * (A + 2.6 * s + 4.4 * s), 3.2 * s);
    block(ctx, wx, wy, 1.8 * s, 0.9 * s, H * 0.5, GLAZE_D, shade(GLAZE, 0.1));
    const [lx, ly] = P(wx, wy, 0, 0.9 * s, H * 0.18);
    ctx.save();
    ctx.translate(lx, ly);
    ctx.transform(1, 0.5, 0, 1, 0, 0);
    beast(ctx, 'lion', 0.42 * s);
    ctx.restore();
  }
}

function building(ctx: Ctx, x: number, y: number, big: boolean, roofC: string, capital: boolean) {
  if (big && capital) {
    ctx.save();
    ctx.translate(x - 4, y - 4);
    ctx.scale(0.72, 0.72);
    ziggurat(ctx, 0, 0);
    ctx.restore();
    // out at the front-right corner of the tile, clear of the houses that later levels add in front of the ziggurat
    blueGate(ctx, x + 18, y + 14, 0.8);
    return;
  }
  if (big) return temple(ctx, x, y, roofC);
  const v = ((Math.round(x) * 7 + Math.round(y) * 3) % 5 + 5) % 5;
  if (v === 0) house(ctx, x, y, 6, 4, 6, roofC, { awning: true, jar: true });
  else if (v === 1) house(ctx, x, y, 5.4, 4.4, 6.4, roofC, { upper: true, ladder: true });
  else if (v === 2) reedHut(ctx, x, y, 0.95);
  else if (v === 3) {
    house(ctx, x - 2, y - 1, 4.6, 3.6, 5.4, roofC, { jar: true });
    datePalm(ctx, x + 9, y + 3, 0.6, 2);
  } else house(ctx, x, y, 6.4, 3.6, 5.6, roofC, { ladder: true, awning: true });
}

// ---------------------------------------------------------------- trees

/**
 * Date palms in irrigated rows: each tree stands on the bank of the canal that runs along its row (the forest's
 * planting spots lie in rows along u, so the pieces line up), with now and then a pomegranate in the palms' shade.
 */
function tree(ctx: Ctx, x: number, y: number, k: number, Pal: BiomePalette, variant: number) {
  const green = Pal.forest ?? '#4a8a40';
  // the canal in front of the row: a strip of water between two raised earth banks, running along u
  const du = 5.4, ox = -3.6, oy = 2.4; // half-length along the row, and the offset toward the viewer
  const a: [number, number] = [x + ox - du, y + oy - du / 2], b: [number, number] = [x + ox + du, y + oy + du / 2];
  const n = (dx: number, dy: number): [number, number] => [dx, dy];
  const off = (p: [number, number], d: [number, number]) => [p[0] + d[0], p[1] + d[1]];
  const w = n(-1.1, 0.55); // across the canal
  poly(ctx, [...off(a, n(1.6, -0.8)), ...off(b, n(1.6, -0.8)), ...off(b, n(-1.9, 0.95)), ...off(a, n(-1.9, 0.95))], '#a88a5a'); // the banks
  poly(ctx, [...off(a, n(0.9, -0.45)), ...off(b, n(0.9, -0.45)), ...off(b, w), ...off(a, w)], '#3a7aa8'); // the water
  line(ctx, ...(off(a, n(0.4, -0.2)) as [number, number]), ...(off(b, n(0.4, -0.2)) as [number, number]), 'rgba(255,255,255,0.4)', 0.5);
  if (variant % 3 === 1) { // a little sluice gate across the canal
    const s = off([x + ox + du * 0.5, y + oy + du * 0.25], n(0, 0));
    line(ctx, s[0] + 1.4, s[1] - 0.8, s[0] - 1.6, s[1] + 0.8, WOOD_D, 1);
    line(ctx, s[0] + 1.4, s[1] - 0.8, s[0] + 1.4, s[1] - 2.4, WOOD, 0.6);
    line(ctx, s[0] - 1.6, s[1] + 0.8, s[0] - 1.6, s[1] - 0.8, WOOD, 0.6);
  }
  if (variant === 4) { // the middle spot: a pomegranate tree under the palms
    line(ctx, x, y, x - 0.4 * k, y - 4 * k, '#6a4a2a', 1 * k);
    for (const [dx, dy, r] of [[-2, -6, 3], [2, -6.4, 3], [0, -8, 3]] as const) ellipse(ctx, x + dx * k, y + dy * k, r * k, r * 0.8 * k, rand(variant, dx + 3) > 0.5 ? shade(green, -0.05) : mix(green, '#7ab040', 0.4));
    for (const [dx, dy] of [[-2.4, -5], [1.6, -5.6], [0.4, -8.4]] as const) ellipse(ctx, x + dx * k, y + dy * k, 0.8 * k, 0.8 * k, '#c8302a');
    return;
  }
  datePalm(ctx, x, y, k * 0.95, variant, green);
}

// ---------------------------------------------------------------- registration

registerArt('babylon', {
  unit(ctx, kind, x, y) {
    switch (kind) {
      case 'sabum': case 'warrior': case 'archer': case 'defender': case 'swordsman': case 'explorer':
        footUnit(ctx, kind, x, y, 1);
        return true;
      case 'giant': footUnit(ctx, kind, x, y, 1.4); return true;
      case 'rider': horseman(ctx, x, y); return true;
      case 'knight': chariot(ctx, x, y); return true;
      case 'catapult': siegeEngine(ctx, x, y); return true;
      case 'boat': gufa(ctx, x, y); return true;
      case 'ship': reedBoat(ctx, x, y); return true;
      case 'warship': riverShip(ctx, x, y); return true;
      default: return false;
    }
  },
  dress,
  torso,
  face,
  head,
  weapon,
  shield,
  building,
  tree,
});

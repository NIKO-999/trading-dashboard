// The Neo-Assyrian Empire (Ashurnasirpal II to Ashurbanipal, ninth to seventh century BC), as its palace reliefs show
// it: long fringed tunics of ochre wool edged and tasselled in madder red, armlets and bracelets on the bare arms; the
// soldiers in coats of iron lamellae over short red-fringed tunics, laced boots and red puttees; long squared beards and
// hair falling to the shoulders in tight rows of curls. Tall pointed iron helmets with cheek pieces for the line, red
// headbands for the light troops, and for the giant the king's tall fez-like crown with its little cone on top and a
// diadem whose ribbons hang down the back. Great round convex shields of bronze, tall wicker pavises with hooded tops
// sheltering the archers, iron-headed spears, rosette-headed maces, straight swords with volute chapes and angular
// composite bows. Mounted lancers on bay horses under tasselled red tack; the knight is the heavy three-man war chariot
// on big eight-spoked wheels. The siege tower is the star: a wheeled timber tower sheathed in wicker and stitched
// hides, a ram poking from its foot, archers behind a ring of shields on top and a red pennant. River rafts float on
// rows of inflated goatskins (a soldier swims across beside one), and the warship is a Phoenician-built bireme with a
// bronze ram. Towns of mud brick with stepped crenellations and clusters of beehive domes; the palace stands on a
// terrace with gypsum relief panels along its walls, and the capital's gate is guarded by two winged human-headed
// bulls, the lamassu. Poplars line the rivers among pomegranate and fig trees.
import type { BiomePalette } from '../../data/tribes';
import type { UnitKind } from '../../game/types';
import { band, box, ellipse, faceQuad, ink, line, mix, poly, rand, shade, softShadow, type Ctx } from '../prims';
import { registerArt, type Body } from '../tribeart';
import { drawHorse, figure } from '../units';

// ---------------------------------------------------------------- palette

const OCHRE = '#c8902a', OCHRE_D = '#8a5e18', OCHRE_L = '#e8c070';
const RED = '#a82a1c', RED_D = '#6a160e', RED_L = '#d0503a';
const WOOL = '#ece2c8', WOOL_D = '#bfb08a';
const IRON = '#8a8e96', IRON_D = '#4a4e56', IRON_L = '#c8ccd4';
const BRONZE = '#c08a3a', BRONZE_D = '#7a5420', BRONZE_L = '#ecc078';
const GOLD = '#e8c050', GOLD_D = '#a8801c';
const LEATHER = '#7a4a24', LEATHER_D = '#4a2c14';
const WICKER = '#c8a860', WICKER_D = '#8a7038', WICKER_L = '#e4cc88';
const HIDE = '#b88a5a', HIDE_D = '#8a5e36', HIDE_L = '#d8b082';
const WOOD = '#7a5230', WOOD_D = '#4a3018', WOOD_L = '#a87a4a';
const BRICK = '#c49a68', BRICK_D = '#946c40', BRICK_L = '#dcbc8c';
const GYPSUM = '#e6dfcc', GYPSUM_D = '#b4aa92', GYPSUM_DD = '#6a604c';
const SKIN = '#c99060', HAIR = '#140c08', CURL = '#3a2618';

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
/** A rosette of eight petals, the Assyrian royal flower. */
function rosette(ctx: Ctx, x: number, y: number, r: number, petal = WOOL, heart = GOLD) {
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ellipse(ctx, x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.34, r * 0.34, petal); }
  ellipse(ctx, x, y, r * 0.36, r * 0.36, heart);
}
/** A fringe of tassels hanging along a line on one side of a box. */
function fringe(ctx: Ctx, face: 'L' | 'R', cx: number, cy: number, w: number, h: number, v: number, len: number, n: number, c: string, k: number) {
  for (let i = 0; i <= n; i++) {
    const u = -0.04 + (1.08 * i) / n;
    const [px, py] = pt(face, cx, cy, w, h, u, v);
    line(ctx, px, py, px + (face === 'L' ? -0.15 : 0.15) * k, py + len, i % 2 ? shade(c, -0.2) : c, 0.5 * k);
  }
}
/** A tassel: a cord and a little flared bob. */
function tassel(ctx: Ctx, x: number, y: number, len: number, c: string, k: number) {
  line(ctx, x, y, x, y + len, shade(c, -0.2), 0.35 * k);
  poly(ctx, [x - 0.5 * k, y + len + 1.2 * k, x + 0.5 * k, y + len + 1.2 * k, x, y + len], c);
}

// ---------------------------------------------------------------- dress

const HEAVY: UnitKind[] = ['defender', 'swordsman', 'knight', 'rider'];
const isHeavy = (k: UnitKind) => HEAVY.includes(k);

function dress(kind: UnitKind): [string, string, string] {
  switch (kind) {
    case 'warrior': return [OCHRE, SKIN, SKIN]; // a short fringed tunic, bare arms
    case 'archer': return [WOOL, SKIN, SKIN];
    case 'explorer': return [OCHRE, OCHRE_D, OCHRE];
    case 'defender': case 'swordsman': case 'knight': case 'rider': return [IRON, RED_D, RED]; // lamellae, red puttees
    case 'giant': return [WOOL, WOOL, WOOL]; // the king's robe to the feet
    default: return [OCHRE, SKIN, SKIN];
  }
}

/** A tunic from the waist down to `v1`, its hem woven in a border and hung with tassels. */
function tunic(ctx: Ctx, x: number, y: number, w: number, h: number, v1: number, c: string, edge: string, k: number) {
  for (const f of ['L', 'R'] as const) {
    facePoly(ctx, f, x, y, w, h, [[-0.02, 0.12], [1.02, 0.12], [1.05, v1], [-0.05, v1]], c);
    facePoly(ctx, f, x, y, w, h, [[-0.05, v1 + 0.11], [1.05, v1 + 0.11], [1.05, v1], [-0.05, v1]], edge);
    facePoly(ctx, f, x, y, w, h, [[-0.05, v1 + 0.06], [1.05, v1 + 0.06], [1.05, v1 + 0.04], [-0.05, v1 + 0.04]], shade(edge, 0.35));
    fringe(ctx, f, x, y, w, h, v1, 1.6 * k, 10, edge, k);
  }
}

/** Rows of narrow iron lamellae between heights v0 and v1 of the torso box, laced in rows, lit along each top. */
function lamellar(ctx: Ctx, x: number, y: number, w: number, h: number, v0: number, v1: number, rows: number) {
  const rh = (v1 - v0) / rows;
  for (let r = 0; r < rows; r++) {
    const a = v0 + r * rh;
    for (const f of ['L', 'R'] as const) {
      faceQuad(ctx, f, x, y, w, h, 0, 1, a, a + rh, shade(IRON, r % 2 ? -0.08 : 0.04));
      for (let c = 0; c <= 9; c++) { // the plates' edges, staggered from row to row
        const u = (c + (r % 2) * 0.5) / 9;
        if (u > 1) continue;
        const p = pt(f, x, y, w, h, u, a + rh * 0.08), q = pt(f, x, y, w, h, u, a + rh * 0.92);
        line(ctx, p[0], p[1], q[0], q[1], f === 'L' ? IRON_D : shade(IRON_D, -0.2), 0.022 * w);
      }
      const p = pt(f, x, y, w, h, 0, a + rh * 0.92), q = pt(f, x, y, w, h, 1, a + rh * 0.92);
      line(ctx, p[0], p[1], q[0], q[1], f === 'L' ? IRON_L : shade(IRON_L, -0.25), 0.03 * w); // the lit top of the row
      const l0 = pt(f, x, y, w, h, 0, a + rh * 0.5), l1 = pt(f, x, y, w, h, 1, a + rh * 0.5);
      line(ctx, l0[0], l0[1], l1[0], l1[1], 'rgba(90,30,20,0.35)', 0.015 * w); // the red lacing
    }
  }
}

function torso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const k = w / 10;
  const B = (v0: number, v1: number, c: string) => band(ctx, x, y, w, h, v0, v1, c);
  if (kind === 'giant') {
    // the king: a long robe to the feet sewn with rosettes, a fringed shawl wound round it, a broad belt
    tunic(ctx, x, y, w, h, -0.58, WOOL, RED, k);
    for (let r = 0; r < 6; r++) for (let i = 0; i < 4; i++) {
      const [px, py] = pt('R', x, y, w, h, 0.14 + i * 0.24 + (r % 2) * 0.1, 0.86 - r * 0.26);
      ellipse(ctx, px, py, 0.42 * k, 0.42 * k, r % 2 ? RED : OCHRE_D);
    }
    for (const [v0, v1] of [[0.02, -0.2], [-0.3, -0.46]] as const) {
      for (const f of ['L', 'R'] as const) facePoly(ctx, f, x, y, w, h, [[-0.04, v0 + 0.12], [1.04, v0 - 0.08], [1.04, v1 - 0.08], [-0.04, v1 + 0.12]], RED);
      for (const f of ['L', 'R'] as const) {
        const a = pt(f, x, y, w, h, -0.04, v1 + 0.12), b = pt(f, x, y, w, h, 1.04, v1 - 0.08);
        line(ctx, a[0], a[1], b[0], b[1], OCHRE_L, 0.6 * k);
        for (let i = 0; i <= 9; i++) { const t = i / 9; line(ctx, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + 1.6 * k, i % 2 ? OCHRE : RED_L, 0.45 * k); }
      }
    }
    B(0.1, 0.24, RED_D);
    B(0.15, 0.19, GOLD);
    facePoly(ctx, 'R', x, y, w, h, [[0.02, 1], [0.24, 1], [0.98, 0.24], [0.76, 0.24]], RED); // the shawl over the shoulder
    const a = pt('R', x, y, w, h, 0.24, 1), b = pt('R', x, y, w, h, 0.98, 0.24);
    for (let i = 0; i <= 6; i++) { const t = i / 6; line(ctx, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[0] + (b[0] - a[0]) * t + 1 * k, a[1] + (b[1] - a[1]) * t + 0.8 * k, OCHRE_L, 0.4 * k); }
    const [rx, ry] = pt('R', x, y, w, h, 0.32, 0.6);
    rosette(ctx, rx, ry, 1.3 * k, GOLD, RED);
    return;
  }
  if (kind === 'warrior' || kind === 'archer') {
    // a short tunic with a tasselled red hem, a broad belt, crossed leather straps
    const archer = kind === 'archer';
    tunic(ctx, x, y, w, h, -0.3, archer ? WOOL : OCHRE, RED, k);
    B(0.12, 0.28, archer ? RED : RED_D);
    B(0.18, 0.21, archer ? OCHRE_L : OCHRE);
    facePoly(ctx, 'R', x, y, w, h, [[0.04, 1], [0.18, 1], [0.92, 0.28], [0.78, 0.28]], LEATHER);
    if (!archer) facePoly(ctx, 'R', x, y, w, h, [[0.82, 1], [0.96, 1], [0.24, 0.28], [0.1, 0.28]], shade(LEATHER, 0.1));
    const [cx2, cy2] = pt('R', x, y, w, h, 0.53, 0.64);
    ellipse(ctx, cx2, cy2, 0.8 * k, 0.8 * k, BRONZE_L);
    B(0.9, 1, archer ? WOOL_D : OCHRE_D); // the neckline
    return;
  }
  if (kind === 'explorer') {
    // a long ochre tunic with a fringed shawl over the shoulder
    tunic(ctx, x, y, w, h, -0.5, OCHRE, RED, k);
    facePoly(ctx, 'R', x, y, w, h, [[0, 1], [0.3, 1], [1.02, 0.1], [0.66, 0.1]], RED);
    const a = pt('R', x, y, w, h, 0.3, 1), b = pt('R', x, y, w, h, 1.02, 0.1);
    for (let i = 0; i <= 6; i++) { const t = i / 6; line(ctx, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[0] + (b[0] - a[0]) * t + 1 * k, a[1] + (b[1] - a[1]) * t + 0.6 * k, OCHRE_L, 0.4 * k); }
    B(0.18, 0.28, OCHRE_D);
    return;
  }
  if (isHeavy(kind)) {
    // a coat of iron lamellae over a short red-fringed tunic; a broad belt and a bronze disc on the chest
    tunic(ctx, x, y, w, h, kind === 'rider' ? -0.2 : -0.34, kind === 'defender' ? OCHRE : RED, kind === 'defender' ? RED : OCHRE, k);
    lamellar(ctx, x, y, w, h, kind === 'defender' ? 0.3 : 0.12, 0.94, kind === 'defender' ? 4 : 6);
    if (kind === 'defender') B(0.1, 0.3, OCHRE); // the tunic under a shorter coat
    B(kind === 'defender' ? 0.26 : 0.12, kind === 'defender' ? 0.36 : 0.24, LEATHER_D);
    B(kind === 'defender' ? 0.3 : 0.16, kind === 'defender' ? 0.32 : 0.19, BRONZE);
    B(0.92, 1, IRON_D); // the collar
    const [mx, my] = pt('R', x, y, w, h, 0.45, 0.62);
    ellipse(ctx, mx, my, 1.2 * k, 1.2 * k, BRONZE_D);
    ellipse(ctx, mx - 0.2 * k, my - 0.2 * k, 0.9 * k, 0.9 * k, BRONZE_L);
    return;
  }
  tunic(ctx, x, y, w, h, -0.3, OCHRE, RED, k);
  B(0.12, 0.26, RED_D);
}

/** A long squared beard in tight rows of curls, and a curled moustache. */
function face(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const long = kind === 'giant' || kind === 'knight' || kind === 'swordsman' || kind === 'defender';
  const bot = long ? -0.4 : -0.18;
  facePoly(ctx, 'R', x, y, w, h, [[0, 0.42], [0.14, 0.34], [0.2, 0.24], [0.8, 0.24], [0.86, 0.34], [0.98, 0.4], [0.9, bot + 0.04], [0.84, bot], [0.16, bot], [0.1, bot + 0.04]], HAIR);
  facePoly(ctx, 'L', x, y, w, h, [[0.66, 0.4], [1, 0.42], [1, 0.06], [0.8, 0.1]], HAIR);
  const rows = long ? 4 : 2;
  for (let r = 0; r < rows; r++) { // rows of tight snail curls
    const v = 0.12 - r * 0.12;
    for (let i = 0; i < 6; i++) {
      const u = 0.2 + i * 0.13 + (r % 2) * 0.06;
      if (u > 0.86) continue;
      const [px, py] = pt('R', x, y, w, h, u, v);
      ring(ctx, px, py, w * 0.042, h * 0.036, CURL, w * 0.024);
    }
  }
  if (long) { // the squared lower edge, combed into straight locks
    for (let i = 0; i < 5; i++) { const [px, py] = pt('R', x, y, w, h, 0.2 + i * 0.15, bot + 0.12); line(ctx, px, py, px, py + h * 0.1, CURL, w * 0.03); }
  }
  faceQuad(ctx, 'R', x, y, w, h, 0.22, 0.78, 0.19, 0.27, '#241a12'); // the moustache
  for (const u of [0.2, 0.8]) { const [px, py] = pt('R', x, y, w, h, u, 0.22); ring(ctx, px, py, w * 0.05, h * 0.04, CURL, w * 0.03); }
  faceQuad(ctx, 'R', x, y, w, h, 0.38, 0.62, 0.14, 0.18, shade(SKIN, -0.42));
}

// ---------------------------------------------------------------- headgear

/** Hair falling to the shoulders at the back in rows of curls. */
function hairBob(ctx: Ctx, x: number, top: number, k: number, hw: number, long = 1) {
  const hx = x - hw * 0.5 + 0.4 * k, y0 = top + 5 * k, y1 = top + (10.6 + 1.4 * long) * k;
  poly(ctx, [hx - 1.6 * k, y0, hx + 2.4 * k, y0, hx + 2.6 * k, y1, hx - 1.4 * k, y1 + 0.6 * k], HAIR);
  for (let r = 0; r < 3 + Math.round(long); r++) {
    for (let i = 0; i < 2; i++) ring(ctx, hx - 0.6 * k + i * 1.8 * k + (r % 2) * 0.5 * k, y0 + 1.4 * k + r * 1.7 * k, 0.55 * k, 0.45 * k, CURL, 0.35 * k);
  }
}

/** A headband bound round the hair, its ends hanging at the back. */
function headband(ctx: Ctx, x: number, top: number, k: number, hw: number, c: string) {
  hairBob(ctx, x, top, k, hw);
  ellipse(ctx, x, top + 0.8 * k, hw / 2 + 0.3 * k, hw / 4 + 0.7 * k, HAIR); // the hair on top
  for (let i = 0; i < 4; i++) ring(ctx, x - hw * 0.3 + i * hw * 0.2, top + 0.6 * k + (i % 2) * 0.5 * k, 0.5 * k, 0.4 * k, CURL, 0.3 * k);
  band(ctx, x, top + 3.4 * k, hw + 0.4 * k, 1.5 * k, 0, 1, c);
  band(ctx, x, top + 3.4 * k, hw + 0.4 * k, 1.5 * k, 0.4, 0.6, shade(c, 0.35));
  const kx = x - hw / 2, ky = top + 2.6 * k;
  line(ctx, kx, ky, kx - 1.6 * k, ky + 4.6 * k, c, 0.8 * k);
  line(ctx, kx + 0.4 * k, ky, kx - 0.6 * k, ky + 5.2 * k, shade(c, -0.25), 0.7 * k);
  tassel(ctx, kx - 1.6 * k, ky + 4.6 * k, 0.4 * k, c, k);
}

/** The tall pointed iron helmet of the line: a sharp cone, a bronze band at the rim and long cheek pieces. */
function ironHelm(ctx: Ctx, x: number, top: number, k: number, hw: number, tall = 1) {
  hairBob(ctx, x, top, k, hw, 0.5);
  const r = hw / 2 + 0.35 * k, by = top + 2.9 * k, ax = x - 0.2 * k, ay = top - 9.6 * k * tall;
  ctx.beginPath();
  ctx.moveTo(x - r, by);
  ctx.quadraticCurveTo(x - r * 0.75, top - 2 * k, ax, ay);
  ctx.quadraticCurveTo(x + r * 0.75, top - 2 * k, x + r, by);
  ctx.ellipse(x, by, r, r / 2, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fillStyle = ink(IRON);
  ctx.fill();
  ctx.beginPath(); // the shaded right flank
  ctx.moveTo(ax + 0.2 * k, ay);
  ctx.quadraticCurveTo(x + r * 0.75, top - 2 * k, x + r, by);
  ctx.ellipse(x, by, r, r / 2, 0, 0, Math.PI * 0.4);
  ctx.quadraticCurveTo(x + r * 0.3, top - 1 * k, ax + 0.2 * k, ay);
  ctx.closePath();
  ctx.fillStyle = ink(IRON_D);
  ctx.fill();
  curve(ctx, ax - 0.2 * k, ay + 1.2 * k, x - r * 0.6, top - 1 * k, x - r * 0.62, by - 0.4 * k, 0.6 * k, IRON_L); // the shine
  ring(ctx, x, by - 0.3 * k, r, r / 2, BRONZE, 1.1 * k, 0, Math.PI); // the bronze band
  ring(ctx, x, by - 0.5 * k, r, r / 2, BRONZE_L, 0.35 * k, 0.2 * Math.PI, 0.7 * Math.PI);
  ellipse(ctx, ax, ay + 0.2 * k, 0.45 * k, 0.45 * k, IRON_L);
  // the cheek piece on the visible side
  poly(ctx, [x + hw * 0.22, by + 0.5 * k, x + hw * 0.48, by + 0.1 * k, x + hw * 0.46, by + 4.4 * k, x + hw * 0.3, by + 4.6 * k], IRON_D);
  line(ctx, x + hw * 0.24, by + 0.6 * k, x + hw * 0.3, by + 4.4 * k, IRON, 0.35 * k);
}

/** The king's crown: a tall fez of white wool banded in red and gold, a small cone on top, a diadem with ribbons. */
function royalCrown(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  hairBob(ctx, x, top, k, hw, 1.4);
  const r = hw / 2 + 0.1 * k, by = top + 2.8 * k, tr = r * 0.86, ty = top - 5 * k; // the shared giant's star (top - 8k) crowns its point
  // the diadem's two ribbons down the back
  for (const d of [0, 1]) line(ctx, x - r + 0.4 * k, by - 0.6 * k, x - r - 1.4 * k + d * 0.9 * k, by + 8.4 * k + d * 0.6 * k, d ? RED_D : RED, 1 * k);
  for (const d of [0, 1]) tassel(ctx, x - r - 1.4 * k + d * 0.9 * k, by + 8.4 * k + d * 0.6 * k, 0.3 * k, GOLD, k);
  poly(ctx, [x - r, by, x - tr, ty, x + tr, ty, x + r, by], WOOL);
  poly(ctx, [x + r * 0.15, by + r * 0.5, x + r, by, x + tr, ty, x + tr * 0.15, ty + tr * 0.5], WOOL_D);
  ctx.beginPath();
  ctx.ellipse(x, by, r, r / 2, 0, 0, Math.PI);
  ctx.fillStyle = ink(WOOL);
  ctx.fill();
  // red bands round it, the lowest a gold diadem set with rosettes
  for (const [z, c, wd] of [[0.15, GOLD, 1.3], [0.45, RED, 0.8], [0.72, RED, 0.8]] as const) {
    const yy = by + (ty - by) * z, rr = r + (tr - r) * z;
    ring(ctx, x, yy, rr, rr / 2, c, wd * k, 0, Math.PI);
  }
  for (const d of [-0.5, 0, 0.5]) { const yy = by + (ty - by) * 0.15 + r * 0.42 * Math.cos(d); rosette(ctx, x + d * r * 1.2, yy, 0.65 * k, GOLD, RED); }
  for (let i = 0; i < 6; i++) { const u = -0.8 + i * 0.32, yy = by + (ty - by) * 0.58 + tr * 0.45 * Math.sqrt(1 - u * u); ellipse(ctx, x + u * tr, yy, 0.3 * k, 0.3 * k, RED); }
  ellipse(ctx, x, ty, tr, tr / 2, shade(WOOL, 0.08));
  ring(ctx, x, ty, tr, tr / 2, GOLD_D, 0.4 * k);
  // the small cone on top
  poly(ctx, [x - 1.1 * k, ty, x + 1.1 * k, ty, x + 0.1 * k, ty - 3.4 * k], GOLD);
  poly(ctx, [x + 0.1 * k, ty + 0.2 * k, x + 1.1 * k, ty, x + 0.1 * k, ty - 3.4 * k], GOLD_D);
}

function head(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  switch (kind) {
    case 'warrior': headband(ctx, x, top, k, hw, RED); break;
    case 'archer': headband(ctx, x, top, k, hw, WOOL); break;
    case 'explorer': headband(ctx, x, top, k, hw, OCHRE); break;
    case 'giant': royalCrown(ctx, x, top, k, hw); break;
    case 'swordsman': case 'knight': ironHelm(ctx, x, top, k, hw, 1.12); break;
    default: ironHelm(ctx, x, top, k, hw); break;
  }
}

// ---------------------------------------------------------------- weapons and shields

/** A spear: an ash shaft, a bronze butt and a long leaf-shaped iron head. */
function spear(ctx: Ctx, x: number, y: number, k: number, len = 1) {
  const x0 = x - 1.8 * k, y0 = y + 7 * k, x1 = x + 3.4 * k * len, y1 = y - 21 * k * len;
  line(ctx, x0, y0, x1, y1, WOOD_D, 1.3 * k);
  line(ctx, x0 - 0.3 * k, y0, x1 - 0.3 * k, y1, WOOD_L, 0.45 * k);
  poly(ctx, [x1 + 0.7 * k, y1 - 7 * k, x1 - 1.3 * k, y1 - 1.8 * k, x1 - 0.2 * k, y1 + 0.6 * k, x1 + 0.3 * k, y1 - 0.2 * k], IRON_L);
  poly(ctx, [x1 + 0.7 * k, y1 - 7 * k, x1 + 2 * k, y1 - 1.6 * k, x1 + 0.6 * k, y1 + 0.6 * k, x1 + 0.3 * k, y1 - 0.2 * k], IRON);
  line(ctx, x1 + 0.5 * k, y1 - 6.2 * k, x1 + 0.3 * k, y1 - 0.6 * k, IRON_D, 0.35 * k);
  ellipse(ctx, x1 + 0.1 * k, y1 + 1 * k, 0.8 * k, 0.6 * k, BRONZE);
  poly(ctx, [x0 - 0.7 * k, y0, x0 + 0.7 * k, y0, x0, y0 + 2 * k], BRONZE); // the butt spike
}

/** A mace with a bronze head of petals, the shaft tasselled. */
function mace(ctx: Ctx, x: number, y: number, k: number, royal = false) {
  const x1 = x + 2.4 * k, y1 = y - 11 * k;
  line(ctx, x - 0.6 * k, y + 3 * k, x1, y1, royal ? GOLD_D : WOOD_D, 1.3 * k);
  line(ctx, x - 0.9 * k, y + 3 * k, x1 - 0.3 * k, y1, royal ? GOLD : WOOD_L, 0.4 * k);
  ellipse(ctx, x1 + 0.2 * k, y1 - 2 * k, 2.2 * k, 2.4 * k, royal ? GOLD_D : BRONZE_D);
  for (let i = 0; i < 5; i++) { const a = -Math.PI * 0.9 + i * 0.45; ellipse(ctx, x1 + 0.2 * k + Math.cos(a) * 1.2 * k, y1 - 2 * k + Math.sin(a) * 1.3 * k, 0.8 * k, 0.9 * k, royal ? GOLD : BRONZE); }
  ellipse(ctx, x1 - 0.6 * k, y1 - 3 * k, 0.7 * k, 0.8 * k, royal ? '#fff0b8' : BRONZE_L);
  tassel(ctx, x - 0.6 * k, y + 3 * k, 1 * k, RED, k);
}

/** A straight iron sword raised, its hilt capped by a round pommel. */
function sword(ctx: Ctx, x: number, y: number, k: number) {
  const x0 = x + 0.4 * k, y0 = y - 1.6 * k, x1 = x + 3.4 * k, y1 = y - 14.4 * k;
  line(ctx, x - 0.2 * k, y + 1.4 * k, x0, y0, LEATHER_D, 1.4 * k); // the grip
  ellipse(ctx, x - 0.3 * k, y + 1.8 * k, 0.9 * k, 0.9 * k, BRONZE);
  line(ctx, x0 - 1.4 * k, y0 + 0.4 * k, x0 + 1.4 * k, y0 - 0.4 * k, BRONZE, 0.9 * k);
  poly(ctx, [x0 - 0.8 * k, y0, x0 + 0.8 * k, y0 - 0.2 * k, x1 + 0.3 * k, y1 + 0.6 * k, x1, y1 - 0.6 * k, x1 - 0.5 * k, y1 + 0.8 * k], IRON_L);
  line(ctx, x0 + 0.3 * k, y0 - 0.2 * k, x1, y1, IRON_D, 0.35 * k);
}

/** The angular composite bow, drawn: two straight arms meeting at the grip, an arrow on the string. */
function bow(ctx: Ctx, x: number, y: number, k: number) {
  const gx = x + 4.6 * k, gy = y - 2.4 * k, tx = x + 1.6 * k, ty = y - 13 * k, bx = x + 1.2 * k, byy = y + 7.6 * k;
  ctx.strokeStyle = ink('#4a2c14');
  ctx.lineWidth = 1.4 * k;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(tx + 0.8 * k, ty - 0.8 * k);
  ctx.lineTo(tx, ty + 0.6 * k);
  ctx.lineTo(gx, gy);
  ctx.lineTo(bx, byy - 0.6 * k);
  ctx.lineTo(bx + 0.8 * k, byy + 0.8 * k);
  ctx.stroke();
  line(ctx, gx - 0.6 * k, gy - 1 * k, gx - 0.6 * k, gy + 1 * k, RED, 1 * k); // the wrapped grip
  for (const t of [0.35, 0.7]) { line(ctx, tx + (gx - tx) * t - 0.6 * k, ty + (gy - ty) * t, tx + (gx - tx) * t + 0.6 * k, ty + (gy - ty) * t, OCHRE_L, 0.5 * k); line(ctx, bx + (gx - bx) * t - 0.6 * k, byy + (gy - byy) * t, bx + (gx - bx) * t + 0.6 * k, byy + (gy - byy) * t, OCHRE_L, 0.5 * k); }
  const sx = x - 2.6 * k, sy = y - 2 * k;
  line(ctx, tx, ty + 0.6 * k, sx, sy, '#f4efe0', 0.4 * k); // the string, drawn back to the ear
  line(ctx, bx, byy - 0.6 * k, sx, sy, '#f4efe0', 0.4 * k);
  line(ctx, sx, sy, gx + 5 * k, gy - 0.6 * k, '#d8c8a0', 0.55 * k); // the arrow
  poly(ctx, [gx + 5 * k, gy - 1.3 * k, gx + 7 * k, gy - 0.6 * k, gx + 5 * k, gy + 0.1 * k], IRON_L);
  poly(ctx, [sx, sy, sx + 1.4 * k, sy - 1 * k, sx + 2 * k, sy - 0.3 * k], RED);
}

/** A long quiver on the back, red leather banded in bronze, with arrows and a tasselled cap. */
function quiver(ctx: Ctx, x: number, y: number, k: number) {
  const qx = x - 6.4 * k;
  box(ctx, qx, y - 7 * k, 3 * k, 12 * k, RED_D);
  for (const v of [0.2, 0.5, 0.8]) band(ctx, qx, y - 7 * k, 3 * k, 12 * k, v, v + 0.06, BRONZE);
  for (const i of [-1, 0, 1]) {
    const tx = qx - 1 * k + i * 1 * k;
    line(ctx, qx + i * 0.6 * k, y - 19 * k, tx, y - 22.6 * k, '#d8c8a0', 0.6 * k);
    poly(ctx, [tx, y - 22.6 * k, tx - 0.8 * k, y - 24.4 * k, tx + 0.5 * k, y - 23.4 * k], i ? RED : WOOL);
  }
  tassel(ctx, qx + 1.4 * k, y - 18.6 * k, 1.4 * k, OCHRE, k);
}

/** A traveller's staff and a goatskin water bag. */
function staff(ctx: Ctx, x: number, y: number, k: number) {
  line(ctx, x - 0.8 * k, y + 6 * k, x + 2.6 * k, y - 17 * k, WOOD, 1.1 * k);
  ellipse(ctx, x + 2.7 * k, y - 17.4 * k, 0.9 * k, 0.9 * k, BRONZE);
  const sx = x + 1.6 * k, sy = y - 6 * k;
  ellipse(ctx, sx + 1.8 * k, sy + 1.8 * k, 2.2 * k, 2.8 * k, HIDE_D);
  ellipse(ctx, sx + 1.4 * k, sy + 1 * k, 1 * k, 1.3 * k, HIDE);
  line(ctx, sx, sy - 2.6 * k, sx + 1.4 * k, sy - 0.8 * k, LEATHER_D, 0.5 * k);
}

/** A great round convex shield of bronze: rings of studs, the swell lit up on the left, a heavy boss. */
function convexShield(ctx: Ctx, cx: number, cy: number, r: number, k: number, face = BRONZE) {
  ellipse(ctx, cx + 0.9 * k, cy + 0.7 * k, r, r * 1.05, shade(face, -0.5)); // the rim's thickness
  ellipse(ctx, cx, cy, r, r * 1.05, shade(face, -0.25));
  // the swell: rings growing lighter toward the upper left
  for (let i = 0; i < 4; i++) {
    const t = i / 4, rr = r * (0.9 - t * 0.22);
    ellipse(ctx, cx - r * 0.08 * t, cy - r * 0.1 * t, rr, rr * 1.05, shade(face, -0.12 + t * 0.16));
  }
  ring(ctx, cx, cy, r * 0.93, r * 0.98, shade(face, 0.3), 0.5 * k);
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; ellipse(ctx, cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.84, 0.35 * k, 0.35 * k, BRONZE_L); }
  ring(ctx, cx - r * 0.04, cy - r * 0.05, r * 0.5, r * 0.53, shade(face, -0.3), 0.45 * k);
  ellipse(ctx, cx + 0.4 * k, cy + 0.4 * k, r * 0.24, r * 0.25, shade(face, -0.45)); // the boss
  ellipse(ctx, cx, cy, r * 0.22, r * 0.23, shade(face, 0.2));
  ellipse(ctx, cx - r * 0.06, cy - r * 0.07, r * 0.1, r * 0.1, '#fff0c8');
  ellipse(ctx, cx - r * 0.42, cy - r * 0.48, r * 0.16, r * 0.26, 'rgba(255,255,255,0.3)');
}

/** A light round shield of wicker with a bronze rim and a leather boss. */
function wickerShield(ctx: Ctx, cx: number, cy: number, r: number, k: number) {
  ellipse(ctx, cx + 0.8 * k, cy + 0.6 * k, r, r * 1.05, WICKER_D);
  ellipse(ctx, cx, cy, r, r * 1.05, WICKER);
  for (let i = 1; i < 5; i++) ring(ctx, cx, cy, r * i / 5, r * 1.05 * i / 5, i % 2 ? WICKER_D : WICKER_L, 0.45 * k);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; line(ctx, cx, cy, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 1.05, shade(WICKER, -0.12), 0.3 * k); }
  ring(ctx, cx, cy, r, r * 1.05, BRONZE, 0.8 * k);
  ellipse(ctx, cx, cy, r * 0.28, r * 0.3, LEATHER);
  ellipse(ctx, cx - r * 0.06, cy - r * 0.08, r * 0.12, r * 0.12, BRONZE_L);
}

/** The archer's pavise: a man-high screen of wicker on a wooden frame, its top hooded back over him. */
function pavise(ctx: Ctx, x: number, y: number, k: number) {
  const l = x - 4.4 * k, r = x + 4.4 * k, b = y + 2.4 * k, t = y - 22 * k, sk = 2.2 * k; // the right edge sits lower (iso)
  line(ctx, x + 1 * k, t + 6 * k, x - 5 * k, b + 1 * k, WOOD_D, 1 * k); // the prop behind
  const face = () => { ctx.beginPath(); ctx.moveTo(l, b); ctx.lineTo(l, t); ctx.lineTo(r, t + sk); ctx.lineTo(r, b + sk); ctx.closePath(); };
  face();
  ctx.fillStyle = ink(shade(WICKER, -0.08));
  ctx.fill();
  ctx.save();
  face();
  ctx.clip();
  for (let i = 0; i < 40; i++) { // the woven courses
    const yy = t + i * 0.66 * k;
    for (let j = 0; j < 7; j++) {
      const x0 = l + (j / 7) * (r - l), x1 = l + ((j + 1) / 7) * (r - l), lift = ((x0 - l) / (r - l)) * sk;
      line(ctx, x0, yy + lift, x1, yy + lift + sk / 7, (i + j) % 2 ? WICKER_D : WICKER_L, 0.5 * k);
    }
  }
  poly(ctx, [x + 1 * k, t, r, t + sk, r, b + sk, x + 1 * k, b + sk * 0.6], 'rgba(0,0,0,0.12)');
  ctx.restore();
  for (const u of [0, 0.5, 1]) line(ctx, l + (r - l) * u, t + sk * u, l + (r - l) * u, b + sk * u, WOOD, 0.8 * k); // the uprights
  // the hood: a curved top bending back over the archer
  ctx.beginPath();
  ctx.moveTo(l, t);
  ctx.quadraticCurveTo(l - 1 * k, t - 4 * k, l - 4.4 * k, t - 4.6 * k);
  ctx.lineTo(r - 4.4 * k, t - 4.6 * k + sk);
  ctx.quadraticCurveTo(r - 1 * k, t - 4 * k + sk, r, t + sk);
  ctx.closePath();
  ctx.fillStyle = ink(WICKER_D);
  ctx.fill();
  for (let i = 1; i < 4; i++) curve(ctx, l - i * 1.1 * k, t - i * 1.15 * k, x - i * 1.1 * k, t - 1.6 * k - i * 1.1 * k + sk / 2, r - i * 1.1 * k, t + sk - i * 1.15 * k, 0.45 * k, shade(WICKER_D, -0.3));
  line(ctx, l, t, r, t + sk, BRONZE, 0.8 * k);
  line(ctx, l, b, r, b + sk, WOOD_D, 1 * k);
}

function weapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  switch (kind) {
    case 'warrior': spear(ctx, x, y, k, 0.95); return true;
    case 'archer': bow(ctx, x, y, k); return true;
    case 'defender': spear(ctx, x, y, k, 1.1); return true;
    case 'swordsman': sword(ctx, x, y, k); return true;
    case 'giant': mace(ctx, x, y, k, true); return true;
    case 'explorer': staff(ctx, x, y, k); return true;
  }
  return false;
}

function shield(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number): boolean {
  if (kind === 'warrior') wickerShield(ctx, x - 1.4 * k, y - 5 * k, 4.6 * k, k);
  else if (kind === 'defender') convexShield(ctx, x - 1.2 * k, y - 5.6 * k, 7 * k, k);
  else if (kind === 'swordsman') convexShield(ctx, x - 1.4 * k, y - 5.6 * k, 5.6 * k, k);
  else return false;
  return true;
}

// ---------------------------------------------------------------- figures on foot

/** Bracelets on both wrists, the Assyrian armlets. */
function armlets(ctx: Ctx, b: Body, k: number) {
  for (const p of [b.hand, b.off]) { ellipse(ctx, p.x, p.y + 1.6 * k, 1.1 * k, 0.55 * k, GOLD_D); ellipse(ctx, p.x - 0.2 * k, p.y + 1.4 * k, 0.6 * k, 0.3 * k, GOLD); }
}

function footUnit(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  if (kind === 'archer') { pavise(ctx, x - 5.6 * k, y - 1.6 * k, k); quiver(ctx, x, y, k); }
  const b = figure(ctx, kind, 'assyria', x, y, k);
  const legs: [number, number, 'L' | 'R'][] = [[-2.2, -0.3, 'L'], [2.2, 0.7, 'R'], [2.2, 0.7, 'L']];
  if (isHeavy(kind)) { // laced boots to the calf
    for (const [dx, dy, f] of legs) {
      faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0, 1, 0, 0.5, LEATHER);
      for (const v of [0.14, 0.28, 0.42]) faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0.3, 0.7, v, v + 0.04, OCHRE_L);
    }
  } else if (kind !== 'giant' && kind !== 'explorer') {
    for (const [dx, dy, f] of legs) faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0.1, 0.9, 0.2, 0.26, LEATHER_D);
  }
  armlets(ctx, b, k);
  weapon(ctx, kind, b, k);
  if (kind === 'giant') { // the royal bow held low in the other hand
    ctx.strokeStyle = ink('#4a2c14'); ctx.lineWidth = 1.2 * k; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(b.off.x - 3 * k, b.off.y - 8 * k); ctx.lineTo(b.off.x - 1 * k, b.off.y); ctx.lineTo(b.off.x - 3.4 * k, b.off.y + 8 * k); ctx.stroke();
    line(ctx, b.off.x - 3 * k, b.off.y - 8 * k, b.off.x - 3.4 * k, b.off.y + 8 * k, '#f4efe0', 0.35 * k);
  }
  shield(ctx, kind, b.off.x, b.off.y, k);
}

// ---------------------------------------------------------------- cavalry: the lancer and the war chariot

/** Tasselled tack: a breast collar hung with red tassels, a crest plume and a bronze brow disc. */
function horseTack(ctx: Ctx, x: number, y: number, k: number) {
  line(ctx, x + 5 * k, y - 10 * k, x + 9.6 * k, y - 5.6 * k, RED, 1 * k);
  for (let i = 0; i < 5; i++) {
    const t = i / 4, px = x + 5 * k + 4.6 * k * t, py = y - 10 * k + 4.4 * k * t;
    tassel(ctx, px, py, 1.4 * k, i % 2 ? RED : OCHRE, k);
    ellipse(ctx, px, py, 0.45 * k, 0.45 * k, BRONZE_L);
  }
  ellipse(ctx, x + 12 * k, y - 16.4 * k, 0.9 * k, 0.9 * k, BRONZE);
  ellipse(ctx, x + 11.8 * k, y - 16.6 * k, 0.4 * k, 0.4 * k, BRONZE_L);
  // the fan-shaped crest plume between the ears
  for (let i = 0; i < 5; i++) curve(ctx, x + 10 * k, y - 19.6 * k, x + 10 * k - i * 0.5 * k, y - 23.4 * k, x + 8.6 * k - i * 1 * k, y - 23.6 * k + i * 0.5 * k, 0.7 * k, i % 2 ? RED_D : RED_L);
}

function horseman(ctx: Ctx, x: number, y: number) {
  const saddle = drawHorse(ctx, x - 1, y + 3, 0.92, '#8a5634', '#1a120c', undefined, RED);
  // a fringed red saddle cloth
  poly(ctx, [saddle.x - 4, saddle.y + 1.2, saddle.x + 3.4, saddle.y + 0.8, saddle.x + 3.8, saddle.y + 5, saddle.x - 3.6, saddle.y + 5.6], RED);
  poly(ctx, [saddle.x - 3.4, saddle.y + 2.2, saddle.x + 3, saddle.y + 1.8, saddle.x + 3.2, saddle.y + 3, saddle.x - 3.2, saddle.y + 3.4], OCHRE);
  for (let i = 0; i <= 8; i++) { const t = i / 8; line(ctx, saddle.x - 3.6 + 7.4 * t, saddle.y + 5.6 - 0.6 * t, saddle.x - 3.6 + 7.4 * t, saddle.y + 7.2 - 0.6 * t, i % 2 ? RED_D : OCHRE_L, 0.4); }
  horseTack(ctx, x - 1, y + 3, 0.92);
  quiver(ctx, saddle.x + 2.4, saddle.y + 6.6, 0.5);
  const b = figure(ctx, 'rider', 'assyria', saddle.x, saddle.y, 0.9, true);
  armlets(ctx, b, 0.9);
  spear(ctx, b.hand.x, b.hand.y + 1, 0.9, 1.15);
}

/** A big eight-spoked chariot wheel with a studded iron tyre. */
function wheel(ctx: Ctx, x: number, y: number, r: number, far = false) {
  const c = far ? shade(WOOD, -0.3) : WOOD;
  ellipse(ctx, x + 0.5, y + 0.4, r * 0.8, r, shade(c, -0.35));
  ellipse(ctx, x, y, r * 0.8, r, IRON_D);
  ellipse(ctx, x, y, r * 0.7, r * 0.88, c);
  ellipse(ctx, x, y, r * 0.58, r * 0.74, shade(c, -0.5));
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI; line(ctx, x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.76, x - Math.cos(a) * r * 0.6, y - Math.sin(a) * r * 0.76, far ? WOOD : WOOD_L, 0.6); }
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; ellipse(ctx, x + Math.cos(a) * r * 0.76, y + Math.sin(a) * r * 0.95, 0.28, 0.28, IRON_L); }
  ellipse(ctx, x, y, r * 0.18, r * 0.22, BRONZE);
}

/** The heavy war chariot: driver, archer and shield-bearer in a high car on big wheels, two horses under red tack. */
function chariot(ctx: Ctx, x: number, y: number) {
  softShadow(ctx, x + 2, y + 2, 23, 6.5, 0.3);
  drawHorse(ctx, x + 9.4, y - 1.8, 0.76, '#5a3a24', '#140c08', undefined, RED); // the far horse
  horseTack(ctx, x + 9.4, y - 1.8, 0.76);
  const cx = x - 7, cy = y - 4;
  wheel(ctx, cx - 1.6, cy - 2.2, 6.4, true);
  line(ctx, cx + 2, cy - 2, x + 14, y - 11.6, WOOD_D, 1.3); // the pole up to the yoke
  // the car's back rail, the crew, then the high front panel over their legs
  poly(ctx, [cx - 7, cy - 8.6, cx + 4, cy - 11, cx + 4, cy - 9.8, cx - 7, cy - 7.4], WOOD_D);
  const bearer = figure(ctx, 'defender', 'assyria', cx - 5, cy - 6.4, 0.66, true);
  const archer = figure(ctx, 'knight', 'assyria', cx - 1.8, cy - 6.4, 0.7, true);
  const driver = figure(ctx, 'rider', 'assyria', cx + 1.8, cy - 5.8, 0.64, true);
  bow(ctx, archer.hand.x, archer.hand.y - 1, 0.62);
  convexShield(ctx, bearer.off.x - 1.8, bearer.off.y - 5, 4.2, 0.6);
  // the front panel: ochre with a red border, crossed quivers and a battle-axe case at the corner
  poly(ctx, [cx - 7.6, cy - 7.4, cx + 5, cy - 10, cx + 6.4, cy - 1.2, cx - 6.2, cy + 1.2], OCHRE);
  poly(ctx, [cx + 5, cy - 10, cx + 6.4, cy - 1.2, cx + 7.6, cy - 2.4, cx + 6.4, cy - 10.4], OCHRE_D);
  ctx.strokeStyle = ink(RED);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 7.2, cy - 6.8); ctx.lineTo(cx + 4.8, cy - 9.4); ctx.lineTo(cx + 6, cy - 1.6); ctx.lineTo(cx - 6, cy + 0.6); ctx.closePath();
  ctx.stroke();
  for (let i = 0; i < 6; i++) { const t = (i + 0.5) / 6; ellipse(ctx, cx - 7.2 + 12 * t, cy - 6.8 - 2.6 * t, 0.4, 0.4, BRONZE_L); }
  for (const d of [-1, 1]) { // two crossed quivers
    const qx = cx - 0.6, qy = cy - 4.2;
    line(ctx, qx - 4 * d, qy - 3.2 + d * 0.6, qx + 4 * d, qy + 2.2 - d * 1.4, RED_D, 1.8);
    line(ctx, qx - 4 * d, qy - 3.2 + d * 0.6, qx + 4 * d, qy + 2.2 - d * 1.4, BRONZE, 0.4);
  }
  rosette(ctx, cx - 0.6, cy - 4.4, 1.5, OCHRE_L, RED);
  // the reins
  curve(ctx, driver.hand.x, driver.hand.y, x + 6, y - 15, x + 18.4, y - 12.8, 0.45, '#3a2414');
  curve(ctx, driver.hand.x, driver.hand.y + 0.6, x + 4, y - 12, x + 15.6, y - 10.6, 0.45, '#3a2414');
  // a pennant on a staff at the back of the car
  line(ctx, cx - 7.2, cy - 6.6, cx - 8.4, cy - 21, WOOD_D, 0.7);
  poly(ctx, [cx - 8.4, cy - 21, cx - 2.6, cy - 20, cx - 4.4, cy - 18.6, cx - 2.8, cy - 17, cx - 8.1, cy - 17.4], RED);
  // the near wheel at the back of the car, and the near horse
  wheel(ctx, cx + 0.6, cy + 1.2, 7.2);
  drawHorse(ctx, x + 7, y + 2.8, 0.8, '#a8703e', '#1a120c', undefined, RED);
  horseTack(ctx, x + 7, y + 2.8, 0.8);
  poly(ctx, [x + 2.8, y - 8.8, x + 8.8, y - 9.8, x + 9.2, y - 6.6, x + 3.2, y - 5.6], RED); // the yoke saddle
  for (let i = 0; i <= 6; i++) { const t = i / 6; line(ctx, x + 3.2 + 6 * t, y - 5.6 - t, x + 3.2 + 6 * t, y - 4.4 - t, OCHRE_L, 0.35); }
  line(ctx, x + 5, y - 11.6, x + 13, y - 14.8, WOOD_D, 1.4); // the yoke
  ellipse(ctx, x + 9, y - 13.2, 0.8, 0.8, BRONZE);
}

// ---------------------------------------------------------------- the siege tower

/** Iso point at (u, v) from (cx, cy): u runs down to the right, v down to the left. */
const P = (cx: number, cy: number, u: number, v: number, h = 0): [number, number] => [cx + u - v, cy + (u + v) / 2 - h];

/** A rectangular block: half-extents A along u and B along v, `h` high, lit and shaded faces and a lid. */
function block(ctx: Ctx, cx: number, cy: number, A: number, B: number, h: number, color: string, lid?: string) {
  poly(ctx, [...P(cx, cy, -A, B), ...P(cx, cy, A, B), ...P(cx, cy, A, B, h), ...P(cx, cy, -A, B, h)], shade(color, 0.06));
  poly(ctx, [...P(cx, cy, A, B), ...P(cx, cy, A, -B), ...P(cx, cy, A, -B, h), ...P(cx, cy, A, B, h)], shade(color, -0.22));
  poly(ctx, [...P(cx, cy, -A, -B, h), ...P(cx, cy, A, -B, h), ...P(cx, cy, A, B, h), ...P(cx, cy, -A, B, h)], lid ?? shade(color, 0.2));
}

/** Hide panels stitched over a face: `F(s, z)` maps a point on the face (s along it, z up) to the screen. */
function hides(ctx: Ctx, F: (s: number, z: number) => [number, number], s0: number, s1: number, z0: number, z1: number, cols: number, rows: number, dark: boolean, seed: number) {
  const ds = (s1 - s0) / cols, dz = (z1 - z0) / rows;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const o = (r % 2) * ds * 0.5, a = s0 + c * ds + o, b = Math.min(s1, a + ds);
    if (a >= s1) continue;
    const z = z0 + r * dz, tone = rand(seed + r * 7, c) * 0.14 - 0.07;
    const base = shade(HIDE, tone + (dark ? -0.24 : 0.04));
    poly(ctx, [...F(a, z), ...F(b, z), ...F(b, z + dz), ...F(a, z + dz)], base);
    const m0 = F(a + 0.3, z + dz - 0.4), m1 = F(b - 0.3, z + dz - 0.4);
    line(ctx, m0[0], m0[1], m1[0], m1[1], shade(base, 0.18), 0.35); // the lit fold at the top of each hide
    for (let i = 0; i < 3; i++) { const q = F(a + 0.2, z + 0.5 + i * dz * 0.3), q1 = F(a + 0.6, z + 0.5 + i * dz * 0.3); line(ctx, q[0], q[1], q1[0], q1[1], HIDE_D, 0.3); } // stitches
  }
}

/** The Assyrian siege tower: a wheeled timber tower in wicker and hides, a ram at its foot, archers on top. */
function siegeTower(ctx: Ctx, x: number, y: number) {
  softShadow(ctx, x - 1, y + 2, 24, 8, 0.32);
  const cx = x - 2, cy = y - 2;
  // the long chassis running back (the -u end), roofed in hides sloping up to the tower
  const A0 = -12, A1 = 2, B = 4.6, H = 9;
  const mid = (A0 + A1) / 2;
  const cpx = cx + mid, cpy = cy + mid / 2; // the chassis' centre on the ground
  block(ctx, cpx, cpy, (A1 - A0) / 2, B, 2, WOOD_D);
  poly(ctx, [...P(cpx, cpy, -(A1 - A0) / 2, B, 2), ...P(cpx, cpy, (A1 - A0) / 2, B, 2), ...P(cpx, cpy, (A1 - A0) / 2, B, H + 4), ...P(cpx, cpy, -(A1 - A0) / 2, B, H)], WICKER);
  ctx.save();
  ctx.beginPath();
  for (const p of [P(cpx, cpy, -(A1 - A0) / 2, B, 2), P(cpx, cpy, (A1 - A0) / 2, B, 2), P(cpx, cpy, (A1 - A0) / 2, B, H + 4), P(cpx, cpy, -(A1 - A0) / 2, B, H)]) ctx.lineTo(p[0], p[1]);
  ctx.closePath();
  ctx.clip();
  for (let i = 0; i < 16; i++) { const a = P(cpx, cpy, -(A1 - A0) / 2, B, 2 + i * 0.8), b = P(cpx, cpy, (A1 - A0) / 2, B, 2 + i * 0.8); line(ctx, a[0], a[1], b[0], b[1], i % 2 ? WICKER_D : WICKER_L, 0.5); }
  for (let i = 1; i < 5; i++) { const a = P(cpx, cpy, -(A1 - A0) / 2 + i * 2.8, B, 0), b = P(cpx, cpy, -(A1 - A0) / 2 + i * 2.8, B, H + 4); line(ctx, a[0], a[1], b[0], b[1], WOOD, 0.9); }
  ctx.restore();
  // the sloping hide roof
  const roofPts = [P(cpx, cpy, -(A1 - A0) / 2, B, H), P(cpx, cpy, (A1 - A0) / 2, B, H + 4), P(cpx, cpy, (A1 - A0) / 2, -B, H + 4), P(cpx, cpy, -(A1 - A0) / 2, -B, H)];
  poly(ctx, roofPts.flat(), HIDE_L);
  for (let i = 1; i < 5; i++) { const t = i / 5; const a = P(cpx, cpy, -(A1 - A0) / 2 + (A1 - A0) * t, B, H + 4 * t), b = P(cpx, cpy, -(A1 - A0) / 2 + (A1 - A0) * t, -B, H + 4 * t); line(ctx, a[0], a[1], b[0], b[1], HIDE_D, 0.5); }
  for (const v of [-2, 1.4]) { const a = P(cpx, cpy, -(A1 - A0) / 2, v, H), b = P(cpx, cpy, (A1 - A0) / 2, v, H + 4); line(ctx, a[0], a[1], b[0], b[1], LEATHER_D, 0.4); } // the lashings
  // the far wheels peek out under the chassis, the near ones come later
  // the tower: a tall box at the front end, its faces sheathed in hides over wicker
  const TA = 4.6, TB = 5, TH = 30, tx = cx + (A1 + TA), ty = cy + (A1 + TA) / 2;
  block(ctx, tx, ty, TA, TB, TH, WICKER, HIDE_D);
  const FL = (s: number, z: number) => P(tx, ty, s, TB, z); // the lit face, s along u
  const FR = (s: number, z: number) => P(tx, ty, TA, s, z); // the shaded face, s along v (from +TB to -TB)
  hides(ctx, FL, -TA, TA, 4, TH - 4, 3, 5, false, 3);
  hides(ctx, (s, z) => FR(-s, z), -TB, TB, 4, TH - 4, 3, 5, true, 11);
  // the timber frame: corner posts and a few beams
  for (const s of [-TA, TA]) { const a = FL(s, 0), b = FL(s, TH); line(ctx, a[0], a[1], b[0], b[1], WOOD_D, 1.1); }
  { const a = FR(-TB, 0), b = FR(-TB, TH); line(ctx, a[0], a[1], b[0], b[1], WOOD_D, 1.1); }
  for (const z of [4, 16, TH - 4]) {
    const a = FL(-TA, z), b = FL(TA, z), c = FR(-TB, z);
    line(ctx, a[0], a[1], b[0], b[1], WOOD, 0.9);
    line(ctx, b[0], b[1], c[0], c[1], WOOD_D, 0.9);
  }
  // an arched loophole on the lit face, an archer's head and bow in it
  const w0 = FL(-1.6, 18.6), w1 = FL(1.6, 18.6), w2 = FL(1.6, 23), w3 = FL(0, 24.6), w4 = FL(-1.6, 23);
  poly(ctx, [...w0, ...w1, ...w2, ...w3, ...w4], '#22160c');
  const [hx, hy] = FL(0, 21.6);
  ellipse(ctx, hx, hy, 1.1, 1.2, SKIN);
  poly(ctx, [hx - 1.2, hy - 0.6, hx + 1.2, hy - 0.6, hx, hy - 3.2], IRON);
  // the ram: a heavy beam from the tower's foot with an iron blade, under a hide hood
  const r0 = FR(0, 5.4), r1 = P(tx, ty, TA + 9, 0, 4.6);
  line(ctx, r0[0], r0[1], r1[0], r1[1], WOOD_D, 2.8);
  line(ctx, r0[0], r0[1] - 1, r1[0], r1[1] - 1, WOOD_L, 0.6);
  poly(ctx, [r1[0] - 0.6, r1[1] - 3, r1[0] + 4.8, r1[1] + 0.6, r1[0] - 0.4, r1[1] + 2.4], IRON);
  poly(ctx, [r1[0] - 0.6, r1[1] - 3, r1[0] + 4.8, r1[1] + 0.6, r1[0] + 1, r1[1] - 0.4], IRON_L);
  for (const t of [0.35, 0.65]) { const px = r0[0] + (r1[0] - r0[0]) * t, py = r0[1] + (r1[1] - r0[1]) * t; line(ctx, px, py - 1.6, px, py + 1.4, IRON_D, 0.8); }
  const hd = [FR(2.4, 9), FR(-2.4, 9), P(tx, ty, TA + 3.4, -1.6, 7), P(tx, ty, TA + 3.4, 1.6, 7)];
  poly(ctx, hd.flat(), HIDE_D); // the hood over the ram's root
  // the fighting platform on top: a ring of round shields, two archers behind them
  const top = (s: number, v: number) => P(tx, ty, s, v, TH);
  const back = [[-TA + 1, -TB + 1.4], [TA - 1, -TB + 1.4]] as const;
  for (const [s, v] of back) { const [px, py] = top(s, v); ellipse(ctx, px, py - 2.4, 2.2, 2.4, shade(BRONZE, -0.3)); }
  const a1 = figure(ctx, 'archer', 'assyria', ...top(-1.4, 0), 0.5, true);
  bow(ctx, a1.hand.x, a1.hand.y, 0.5);
  const a2 = figure(ctx, 'swordsman', 'assyria', ...top(2.2, -1.4), 0.48, true);
  spear(ctx, a2.hand.x, a2.hand.y + 2, 0.5, 0.9);
  for (let i = 0; i < 3; i++) { const [px, py] = top(-TA + 1.5 + i * 3.2, TB - 0.5); convexShield(ctx, px, py - 1.4, 1.7, 0.34, i % 2 ? OCHRE_D : BRONZE); }
  for (let i = 0; i < 2; i++) { const [px, py] = top(TA - 0.5, TB - 3.6 - i * 3.6); convexShield(ctx, px, py - 1.4, 1.6, 0.32, i % 2 ? BRONZE : OCHRE_D); }
  // the pennant on a pole at the back corner
  const [px, py] = top(-TA + 0.6, -TB + 0.6);
  line(ctx, px, py, px, py - 17, WOOD_D, 0.9);
  poly(ctx, [px, py - 17, px + 9, py - 15.6, px + 6.4, py - 13.8, px + 9.4, py - 12, px, py - 12.6], RED);
  poly(ctx, [px, py - 15.4, px + 7.4, py - 14.4, px + 7, py - 13.6, px, py - 14.4], OCHRE_L);
  ellipse(ctx, px, py - 17.4, 0.7, 0.7, GOLD);
  // the near wheels along the lit side: two under the chassis, one under the tower
  for (const u of [-9.6, -3.4]) { const [wx, wy] = P(cx, cy, u, B + 0.6, 3.2); wheel(ctx, wx, wy, 3.8); }
  { const [wx, wy] = P(tx, ty, 0, TB + 0.6, 3.4); wheel(ctx, wx, wy, 4.2); }
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

/** One inflated goatskin, its legs tied off as stubs. */
function goatskin(ctx: Ctx, x: number, y: number, s: number, tone = 0) {
  const c = shade(HIDE, tone);
  ellipse(ctx, x + 0.5 * s, y + 0.5 * s, 3 * s, 1.9 * s, shade(c, -0.4));
  ellipse(ctx, x, y, 3 * s, 1.9 * s, c);
  ellipse(ctx, x - 0.9 * s, y - 0.7 * s, 1.4 * s, 0.7 * s, shade(c, 0.22));
  for (const [dx, dy] of [[-2.6, 1], [2.4, 1.1], [2.8, -0.6]] as const) line(ctx, x + dx * s, y + dy * s, x + (dx + Math.sign(dx) * 0.8) * s, y + (dy + 0.6) * s, shade(c, -0.25), 0.7 * s);
  line(ctx, x - 3 * s, y - 0.4 * s, x - 3.8 * s, y - 1 * s, LEATHER_D, 0.6 * s); // the tied neck
}

/** A kelek: a timber platform lashed over rows of inflated goatskins. Returns the deck's centre. */
function kelek(ctx: Ctx, x: number, y: number, A: number, B: number, s: number): [number, number] {
  // the skins in rows, back to front
  for (let j = 0; j < 3; j++) for (let i = 0; i < Math.round(A / 2.4); i++) {
    const u = -A + 1.6 + i * 4.8 * s * 0.5 + (j % 2) * 1.2, v = -B + 1.2 + j * (2 * B - 2.4) / 2;
    if (u > A - 1) continue;
    const [px, py] = P(x, y, u, v, 0);
    goatskin(ctx, px, py, 0.75 * s, rand(i, j) * 0.16 - 0.08);
  }
  // the platform: poles along u, crossbars along v, riding high on the skins
  const z = 3.2;
  poly(ctx, [...P(x, y, -A, -B, z), ...P(x, y, A, -B, z), ...P(x, y, A, B, z), ...P(x, y, -A, B, z)], WOOD);
  for (let i = 0; i <= 6; i++) { const v = -B + (2 * B * i) / 6, a = P(x, y, -A, v, z + 0.4), b = P(x, y, A, v, z + 0.4); line(ctx, a[0], a[1], b[0], b[1], i % 2 ? WOOD_L : WOOD_D, 1); }
  for (const u of [-A + 0.6, 0, A - 0.6]) { const a = P(x, y, u, -B, z + 0.8), b = P(x, y, u, B, z + 0.8); line(ctx, a[0], a[1], b[0], b[1], WOOD_D, 1); }
  // the front skins show under the platform's lit edge
  for (let i = 0; i < Math.round(A / 3); i++) { const [px, py] = P(x, y, -A + 2.4 + i * 3.2, B + 1, 0.6); goatskin(ctx, px, py, 0.8 * s, rand(i, 9) * 0.16 - 0.04); }
  return P(x, y, 0, 0, z + 1);
}

/** A soldier swimming across on an inflated goatskin, blowing into its neck. */
function swimmer(ctx: Ctx, x: number, y: number) {
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.ellipse(x, y + 1, 6, 1.4, 0, 0, Math.PI * 2); ctx.stroke();
  goatskin(ctx, x, y - 0.6, 0.85, 0.06);
  line(ctx, x - 2.4, y - 1.8, x + 3.6, y - 1.6, SKIN, 1.4); // the arm over the skin
  ellipse(ctx, x + 3.6, y - 3, 1.5, 1.6, SKIN);
  ellipse(ctx, x + 3.2, y - 4, 1.6, 1, HAIR);
  ellipse(ctx, x + 4.4, y - 2.2, 1, 0.9, HAIR); // the beard
  line(ctx, x - 4, y + 0.2, x - 6.6, y + 1, SKIN, 1); // the kicking legs
}

/** The boat: a small kelek with a boatman at a sweep, bales aboard, and a soldier swimming beside it. */
function raft(ctx: Ctx, x: number, y: number) {
  const [dx, dy] = kelek(ctx, x - 1, y - 2, 9, 5, 1);
  for (const [u, v, c] of [[-5, -2, WOOL_D], [-2.6, -2.6, OCHRE], [-4, 0.6, WOOL]] as const) { const [px, py] = P(dx, dy, u, v); box(ctx, px, py + 1, 3, 2.6, c, shade(c, 0.2)); line(ctx, px - 1.5, py - 0.4, px + 1.5, py - 0.4, LEATHER_D, 0.4); }
  const b = figure(ctx, 'warrior', 'assyria', ...P(dx, dy, 3, 0.4), 0.5);
  line(ctx, b.hand.x - 2, b.hand.y - 5, b.hand.x + 7, b.hand.y + 9, WOOD, 0.9); // the sweep oar
  ellipse(ctx, b.hand.x + 7.4, b.hand.y + 9.8, 1.2, 2, WOOD_L);
  wake(ctx, x - 1, y + 1, 12);
  swimmer(ctx, x + 12, y + 4);
}

/** The ship: a great kelek carrying cedar logs downriver, a reed-mat shelter, oarsmen at long sweeps. */
function bigRaft(ctx: Ctx, x: number, y: number) {
  const [dx, dy] = kelek(ctx, x, y - 2, 16, 7, 1.1);
  // the reed shelter at the back: a barrel of reed mats on hoops
  const [hx, hy] = P(dx, dy, -9, -1);
  ctx.beginPath(); ctx.moveTo(hx - 7, hy + 2); ctx.bezierCurveTo(hx - 7, hy - 10, hx + 5, hy - 10, hx + 5, hy + 3); ctx.closePath();
  ctx.fillStyle = ink(WICKER); ctx.fill();
  for (let i = 0; i < 5; i++) curve(ctx, hx - 6.4 + i * 0.3, hy + 1.6 - i * 1.6, hx - 1, hy - 9 + i * 1.4, hx + 4.4 - i * 0.3, hy + 2.6 - i * 1.6, 0.5, i % 2 ? WICKER_D : WICKER_L);
  ellipse(ctx, hx + 2.6, hy - 0.4, 1.6, 2.2, '#2a1a10');
  // the cedar logs from the Amanus, stacked on the deck
  const CEDAR = '#b0703e';
  for (let j = 0; j < 2; j++) for (let i = 0; i < 3 - j; i++) {
    const v = -1.2 - i * 2 - j, z = 1.2 + j * 1.8;
    const a = P(dx, dy, -1, v, z), b = P(dx, dy, 12, v, z);
    line(ctx, a[0], a[1], b[0], b[1], shade(CEDAR, -0.25), 2.4);
    line(ctx, a[0], a[1] - 0.7, b[0], b[1] - 0.7, CEDAR, 1);
    ellipse(ctx, b[0], b[1], 1.2, 1.2, '#e0b080');
    ring(ctx, b[0], b[1], 0.6, 0.6, shade(CEDAR, -0.1), 0.35);
  }
  for (const [u, v, s] of [[-3, 4.4, 1], [9, 4.2, -1]] as const) {
    const b = figure(ctx, 'archer', 'assyria', ...P(dx, dy, u, v), 0.46);
    line(ctx, b.hand.x - 2, b.hand.y - 5, b.hand.x + 6 * s, b.hand.y + 10, WOOD, 0.8);
    ellipse(ctx, b.hand.x + 6.3 * s, b.hand.y + 10.6, 1, 1.8, WOOD_L);
  }
  wake(ctx, x, y + 3, 19);
}

/** A crescent hull: returns the deck line. */
function hull(ctx: Ctx, x: number, y: number, w: number, lift: number, deep: number, c: string, cD: string) {
  const top = (t: number) => y - 5 - (t < 0 ? Math.pow(-t, 3) * lift * 1.6 : Math.pow(t, 4) * lift * 0.5);
  const pts: number[] = [];
  for (let i = 0; i <= 16; i++) { const t = -1 + i / 8; pts.push(x + t * w, top(t)); }
  pts.push(x + w * 0.92, y - 1, x + w * 0.4, y + deep * 0.6, x, y + deep * 0.7, x - w * 0.4, y + deep * 0.6, x - w * 0.86, y - 2);
  poly(ctx, pts, c);
  poly(ctx, [x - w * 0.88, y - 2.4, x - w * 0.4, y + deep * 0.6, x, y + deep * 0.7, x + w * 0.4, y + deep * 0.6, x + w * 0.92, y - 1.4, x + w * 0.4, y - 0.4, x, y, x - w * 0.4, y - 0.4], cD);
  return top;
}

/** The warship: a Phoenician-built bireme with a bronze ram, two banks of oars, a shield rail and a striped sail. */
function bireme(ctx: Ctx, x: number, y: number) {
  const w = 26, mx = x + 2;
  line(ctx, mx, y - 8, mx, y - 44, WOOD_D, 1.5);
  poly(ctx, [mx - 11, y - 41, mx + 12, y - 42, mx + 13, y - 19, mx - 10, y - 18], WOOL);
  for (let i = 0; i < 5; i++) { const x0 = mx - 10.6 + i * 4.6 + 1.2; poly(ctx, [x0, y - 41 - i * 0.2, x0 + 2.3, y - 41.1 - i * 0.2, x0 + 2.7, y - 18.2 - i * 0.2, x0 + 0.4, y - 18 - i * 0.2], i === 2 ? OCHRE : RED); }
  poly(ctx, [mx + 1, y - 41.5, mx + 12, y - 42, mx + 13, y - 19, mx + 1.4, y - 18.5], 'rgba(0,0,0,0.12)');
  line(ctx, mx - 11.4, y - 41.2, mx + 12.4, y - 42.2, WOOD_D, 1);
  line(ctx, mx - 10.4, y - 18, mx + 13.4, y - 19, WOOD_D, 0.8);
  for (const s of [-1, 1]) line(ctx, mx, y - 44, mx + s * 12, y - 41.6, 'rgba(60,40,20,0.5)', 0.35);
  poly(ctx, [mx, y - 44, mx + 6, y - 43, mx + 4.4, y - 41.6, mx + 6, y - 40.4, mx, y - 41.4], RED);
  // the upper deck: soldiers behind a rail hung with shields
  const top = hull(ctx, x, y, w, 7, 5, '#5a3a22', '#3a2414');
  for (const [t, kd] of [[-0.62, 'archer'], [-0.3, 'swordsman'], [0.02, 'defender'], [0.34, 'archer']] as const) figure(ctx, kd, 'assyria', x + t * w, top(t) - 1.2, 0.42, true);
  // the rail and the shields along it
  ctx.strokeStyle = ink(WOOD_L);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let j = 0; j <= 16; j++) { const t = -1 + j / 8, px = x + t * w * 0.96, py = top(t) + 0.2; if (j) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
  ctx.stroke();
  for (let i = 0; i < 7; i++) { const t = -0.62 + i * 0.18; convexShield(ctx, x + t * w, top(t) + 1.2, 2, 0.4, i % 2 ? RED : BRONZE); }
  // two banks of oars through ports along the hull
  for (const [d, n] of [[3.6, 9], [6, 8]] as const) {
    for (let i = 0; i < n; i++) {
      const t = -0.7 + i * (1.4 / n) + (d > 4 ? 0.08 : 0), ox = x + t * w, oy = top(t) + d;
      ellipse(ctx, ox, oy, 0.6, 0.45, '#1a0e06');
      line(ctx, ox, oy, ox + 1.4 + (i % 2) * 0.6, oy + 7 - (d > 4 ? 1.6 : 0), WOOD_L, 0.6);
    }
  }
  // the bronze ram at the waterline, and the up-curled stern
  const bx = x + w, by = top(1);
  poly(ctx, [bx - 3, y - 1.6, bx + 6, y - 0.6, bx - 2, y + 1.4], BRONZE);
  poly(ctx, [bx - 3, y - 1.6, bx + 6, y - 0.6, bx - 2, y - 0.6], BRONZE_L);
  line(ctx, bx - 1, by + 1, bx + 1.6, by - 3, '#5a3a22', 1.6);
  ellipse(ctx, bx + 1.2, by - 3.4, 0.8, 0.8, '#f4efe0'); // the painted eye
  ellipse(ctx, bx + 1.2, by - 3.4, 0.4, 0.4, '#101010');
  const sx = x - w, sy = top(-1);
  curve(ctx, sx + 1.4, sy + 2.6, sx - 3.4, sy - 2, sx + 1.4, sy - 6.8, 1.8, '#5a3a22');
  curve(ctx, sx + 1.4, sy - 6.8, sx + 3.4, sy - 7.6, sx + 2.6, sy - 5, 1.3, '#5a3a22');
  line(ctx, sx + 4, sy + 0.6, sx + 1.6, sy + 8, WOOD_L, 1.2); // the steering oar
  wake(ctx, x, y + 3, w * 0.9);
}

// ---------------------------------------------------------------- buildings

/** A doorway (or window) on the lit face of a block: centred at u, from height h0 up `hh`, `hw` wide. */
function opening(ctx: Ctx, cx: number, cy: number, u: number, B: number, hw: number, h0: number, hh: number, c = '#2a1a10', arch = false) {
  const a = P(cx, cy, u - hw, B, h0), b = P(cx, cy, u + hw, B, h0), d = P(cx, cy, u - hw, B, h0 + hh), e = P(cx, cy, u + hw, B, h0 + hh);
  if (arch) {
    ctx.beginPath();
    ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...e);
    const m = P(cx, cy, u, B, h0 + hh + hw * 1.1);
    ctx.quadraticCurveTo(m[0] + (e[0] - d[0]) * 0, m[1] - (hw * 0.2), d[0], d[1]);
    ctx.closePath();
    ctx.fillStyle = ink(c);
    ctx.fill();
  } else poly(ctx, [...a, ...b, ...e, ...d], c);
}
/** The same on the shaded face (the u = A side), centred at v. */
function openingR(ctx: Ctx, cx: number, cy: number, A: number, v: number, hw: number, h0: number, hh: number, c = '#1e140c') {
  const a = P(cx, cy, A, v + hw, h0), b = P(cx, cy, A, v - hw, h0), d = P(cx, cy, A, v + hw, h0 + hh), e = P(cx, cy, A, v - hw, h0 + hh);
  poly(ctx, [...a, ...b, ...e, ...d], c);
}

/** One stepped Assyrian merlon (three tiers) standing on a wall top, drawn in the plane of the wall. */
function merlon(ctx: Ctx, F: (s: number, z: number) => [number, number], s: number, W: number, t: number, c: string) {
  const pts: [number, number][] = [[s - W / 2, 0], [s + W / 2, 0], [s + W / 2, t], [s + W / 3, t], [s + W / 3, 2 * t], [s + W / 6, 2 * t], [s + W / 6, 3 * t], [s - W / 6, 3 * t], [s - W / 6, 2 * t], [s - W / 3, 2 * t], [s - W / 3, t], [s - W / 2, t]];
  poly(ctx, pts.flatMap(([a, z]) => F(a, z)), c);
}

/** Stepped merlons all round the top of a block (A, B, h): the back ones first, then the front. */
function crenellate(ctx: Ctx, cx: number, cy: number, A: number, B: number, h: number, color: string, W = 2.2, t = 0.7) {
  const n = Math.max(2, Math.round((2 * A) / (W * 1.3))), m = Math.max(2, Math.round((2 * B) / (W * 1.3)));
  const along = (v: number) => (s: number, z: number) => P(cx, cy, s, v, h + z);
  const across = (u: number) => (s: number, z: number) => P(cx, cy, u, -s, h + z);
  for (let i = 0; i < n; i++) merlon(ctx, along(-B), -A + (2 * A * (i + 0.5)) / n, W, t, shade(color, -0.05));
  for (let i = 0; i < m; i++) merlon(ctx, across(-A), -B + (2 * B * (i + 0.5)) / m, W, t, shade(color, 0.04));
  for (let i = 0; i < m; i++) merlon(ctx, across(A), -B + (2 * B * (i + 0.5)) / m, W, t, shade(color, -0.2));
  for (let i = 0; i < n; i++) merlon(ctx, along(B), -A + (2 * A * (i + 0.5)) / n, W, t, shade(color, 0.1));
}

/** Rain spouts / beam ends poking out under the roof. */
function beamEnds(ctx: Ctx, cx: number, cy: number, A: number, B: number, h: number, n: number) {
  for (let i = 0; i < n; i++) {
    const [px, py] = P(cx, cy, -A + (2 * A * (i + 0.5)) / n, B, h);
    ellipse(ctx, px, py, 0.55, 0.5, WOOD_D);
    ellipse(ctx, px - 0.15, py - 0.1, 0.3, 0.28, WOOD_L);
  }
}

/** A flat-roofed house of mud brick with a stepped parapet, a door, high slit windows. */
function house(ctx: Ctx, x: number, y: number, A: number, B: number, h: number, roofC: string, opts: { upper?: boolean; ladder?: boolean; jar?: boolean; band?: boolean } = {}) {
  ellipse(ctx, x + 1, y + 1.4, (A + B) * 1.05, (A + B) * 0.45, 'rgba(0,0,0,0.16)');
  block(ctx, x, y, A, B, h, BRICK, mix(BRICK_L, roofC, 0.4));
  for (const [u, z] of [[-A * 0.55, h * 0.3], [A * 0.45, h * 0.66]] as const) { // plaster worn away, the brick showing
    for (let i = 0; i < 3; i++) { const a = P(x, y, u - 1.4, B, z + i * 0.8), b = P(x, y, u + 1.4, B, z + i * 0.8); line(ctx, a[0], a[1], b[0], b[1], BRICK_D, 0.35); }
  }
  if (opts.band) { // a painted red band under the parapet
    poly(ctx, [...P(x, y, -A, B, h - 1.4), ...P(x, y, A, B, h - 1.4), ...P(x, y, A, B, h - 0.8), ...P(x, y, -A, B, h - 0.8)], RED);
    poly(ctx, [...P(x, y, A, B, h - 1.4), ...P(x, y, A, -B, h - 1.4), ...P(x, y, A, -B, h - 0.8), ...P(x, y, A, B, h - 0.8)], RED_D);
  }
  opening(ctx, x, y, A * 0.25, B, 1.1, 0, Math.min(4.2, h * 0.62), '#2a1a10', true);
  for (const u of [-A * 0.55, -A * 0.35]) opening(ctx, x, y, u, B, 0.3, h * 0.6, 1.6, '#3a2414');
  openingR(ctx, x, y, A, 0, 0.3, h * 0.6, 1.6);
  beamEnds(ctx, x, y, A, B, h - 0.5, Math.round(A / 1.8));
  crenellate(ctx, x, y, A, B, h, BRICK_L, 1.9, 0.6);
  if (opts.upper) { // a small upper room on the roof
    const uy = y - h;
    block(ctx, x - A * 0.35, uy - B * 0.3, A * 0.45, B * 0.5, 3.8, BRICK, mix(BRICK_L, roofC, 0.4));
    opening(ctx, x - A * 0.35, uy - B * 0.3, 0, B * 0.5, 0.7, 0, 2.4, '#2a1a10');
  }
  if (opts.ladder) {
    const a = P(x, y, A + 1.6, B * 0.2), b = P(x, y, A, B * 0.2, h + 1.4);
    for (const o of [-0.8, 0.8]) line(ctx, a[0] + o, a[1], b[0] + o, b[1], WOOD_L, 0.55);
    for (let i = 1; i < 5; i++) { const t = i / 5; line(ctx, a[0] - 0.8 + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[0] + 0.8 + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, WOOD_L, 0.45); }
  }
  if (opts.jar) {
    const [jx, jy] = P(x, y, A * 0.25 + 3, B + 1.4);
    ellipse(ctx, jx, jy - 1.6, 1.4, 1.8, '#b0784a');
    ellipse(ctx, jx - 0.4, jy - 2, 0.5, 0.8, '#d0986a');
    ellipse(ctx, jx, jy - 3.3, 0.8, 0.35, '#3a2414');
  }
}

/** A beehive house of mud brick: a tall corbelled dome with a smoke hole and a low door. */
function dome(ctx: Ctx, x: number, y: number, r: number, H: number) {
  ellipse(ctx, x + 1, y + 1, r * 1.2, r * 0.55, 'rgba(0,0,0,0.16)');
  const lit = BRICK_L, dark = shade(BRICK, -0.18);
  const shape = (side: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y - H);
    ctx.bezierCurveTo(x + side * r * 0.55, y - H, x + side * r * 1.02, y - H * 0.55, x + side * r, y);
    ctx.ellipse(x, y, r, r / 2, 0, side > 0 ? 0 : Math.PI, Math.PI / 2, side < 0);
    ctx.closePath();
  };
  shape(-1); ctx.fillStyle = ink(lit); ctx.fill();
  shape(1); ctx.fillStyle = ink(dark); ctx.fill();
  // the corbelled courses
  for (let i = 1; i < 6; i++) {
    const t = i / 6, yy = y - H * t * 0.92, rr = r * Math.sqrt(1 - Math.pow(t, 1.6)) * 1.0;
    ring(ctx, x, yy, rr, rr / 2, shade(BRICK_D, 0.05), 0.35, 0.05 * Math.PI, 0.95 * Math.PI);
  }
  ellipse(ctx, x - 0.2, y - H + 0.4, 1, 0.5, '#2a1a10'); // the smoke hole
  // the door
  ctx.beginPath();
  ctx.moveTo(x - r * 0.25 - 1.1, y + r * 0.42);
  ctx.lineTo(x - r * 0.25 - 1.1, y + r * 0.42 - 2.8);
  ctx.quadraticCurveTo(x - r * 0.25, y + r * 0.42 - 4.4, x - r * 0.25 + 1.1, y + r * 0.42 - 2.4);
  ctx.lineTo(x - r * 0.25 + 1.1, y + r * 0.46);
  ctx.closePath();
  ctx.fillStyle = ink('#2a1a10');
  ctx.fill();
}

/** A gypsum relief panel on a wall face, carved with a few striding figures (a procession of tribute bearers). */
function reliefs(ctx: Ctx, F: (s: number, z: number) => [number, number], s0: number, s1: number, z0: number, z1: number, n: number, dark: boolean) {
  const ds = (s1 - s0) / n;
  for (let i = 0; i < n; i++) {
    const a = s0 + i * ds;
    poly(ctx, [...F(a + 0.1, z0), ...F(a + ds - 0.1, z0), ...F(a + ds - 0.1, z1), ...F(a + 0.1, z1)], dark ? shade(GYPSUM, -0.22) : GYPSUM);
    const c = dark ? shade(GYPSUM_DD, -0.1) : GYPSUM_D;
    // two little figures: a head, a long robe, a stride; the second carries a tribute bowl
    for (let j = 0; j < 2; j++) {
      const s = a + ds * (0.3 + j * 0.42), hz = z0 + (z1 - z0) * 0.78;
      const h = F(s, hz), f0 = F(s - 0.35, z0 + 0.3), f1 = F(s + 0.35, z0 + 0.3), m = F(s, hz - (z1 - z0) * 0.12);
      ellipse(ctx, h[0], h[1], 0.32, 0.36, c);
      poly(ctx, [...m, ...f1, ...f0], c);
      if (j) { const t = F(s + 0.5, hz - (z1 - z0) * 0.2); ellipse(ctx, t[0], t[1], 0.36, 0.2, c); }
    }
    const r0 = F(a + 0.1, z1), r1 = F(a + ds - 0.1, z1);
    line(ctx, r0[0], r0[1], r1[0], r1[1], dark ? GYPSUM_D : '#fbf6ea', 0.3);
  }
}

/** A palace on a terrace: relief-panelled walls under a red band, stepped merlons, a cedar portico and a tower. */
function palace(ctx: Ctx, x: number, y: number, roofC: string) {
  ellipse(ctx, x + 1, y + 2, 21, 8, 'rgba(0,0,0,0.18)');
  block(ctx, x, y, 13, 9, 2.4, BRICK_D, shade(BRICK, 0.05)); // the terrace
  const ty = y - 2.4;
  // a tall tower block at the back left
  block(ctx, x - 6, ty - 4, 4, 3.4, 14, BRICK, mix(BRICK_L, roofC, 0.5));
  crenellate(ctx, x - 6, ty - 4, 4, 3.4, 14, BRICK_L, 1.9, 0.6);
  openingR(ctx, x - 6, ty - 4, 4, 0, 0.35, 10, 1.8);
  // the main hall
  const A = 9.6, B = 5.6, h = 10;
  block(ctx, x + 1, ty, A, B, h, BRICK_L, mix(BRICK_L, roofC, 0.5));
  const FL = (s: number, z: number) => P(x + 1, ty, s, B, z), FR = (s: number, z: number) => P(x + 1, ty, A, -s, z);
  reliefs(ctx, FL, -A, A, 0.2, 4.8, 6, false);
  reliefs(ctx, FR, -B, B, 0.2, 4.8, 3, true);
  // the painted bands: red, then a black line, under the merlons
  for (const [z0, z1, c] of [[h - 2.2, h - 1.3, RED], [h - 1.3, h - 1, '#2a1a12']] as const) {
    poly(ctx, [...FL(-A, z0), ...FL(A, z0), ...FL(A, z1), ...FL(-A, z1)], c);
    poly(ctx, [...FR(-B, z0), ...FR(B, z0), ...FR(B, z1), ...FR(-B, z1)], shade(c, -0.25));
  }
  for (let i = 0; i < 5; i++) { const [px, py] = FL(-A + 1.6 + i * 3.9, h - 1.75); rosette(ctx, px, py, 0.55, WOOL, GOLD); }
  crenellate(ctx, x + 1, ty, A, B, h, BRICK_L, 2, 0.65);
  // the portico: two cedar columns on round bases, a beam over them, a dark doorway behind
  opening(ctx, x + 1, ty, 2, B, 1.8, 0, 6.6, '#24160c', true);
  for (const s of [-0.6, 4.6]) {
    const [bx, by] = P(x + 1, ty, s, B + 2.4);
    ellipse(ctx, bx, by, 1.1, 0.55, GYPSUM_D);
    line(ctx, bx, by, bx, by - 7.4, WOOD, 1.2);
    line(ctx, bx - 0.3, by, bx - 0.3, by - 7.4, WOOD_L, 0.4);
    ellipse(ctx, bx, by - 7.6, 1, 0.5, GYPSUM);
  }
  const l0 = P(x + 1, ty, -1.6, B + 2.4, 8), l1 = P(x + 1, ty, 5.6, B + 2.4, 8), l2 = P(x + 1, ty, 5.6, B, 8), l3 = P(x + 1, ty, -1.6, B, 8);
  poly(ctx, [...l0, ...l1, ...l2, ...l3], WOOD_D);
  line(ctx, l0[0], l0[1], l1[0], l1[1], WOOD_L, 0.5);
  // a red banner on the tower
  const [fx, fy] = P(x - 6, ty - 4, 0, 0, 14);
  line(ctx, fx, fy, fx, fy - 9, WOOD_D, 0.7);
  poly(ctx, [fx, fy - 9, fx + 5.4, fy - 8, fx + 4, fy - 6.8, fx + 5.4, fy - 5.6, fx, fy - 6], RED);
}

/** A lamassu, in profile in the local plane: the bull's body, five legs, a sweeping wing, a bearded crowned head. */
function lamassu(ctx: Ctx, s: number) {
  const c = GYPSUM, d = GYPSUM_D, o = GYPSUM_DD;
  poly(ctx, [-5.2 * s, -0.2 * s, 5.2 * s, -0.2 * s, 5.2 * s, 0.8 * s, -5.2 * s, 0.8 * s], d); // the plinth
  for (const lx of [-3.8, -2.6, 2.2, 3.6, 4.6]) { // five legs: four in profile, the fifth seen from the front
    const front = lx > 4;
    line(ctx, lx * s, -4.6 * s, lx * s, -0.4 * s, front ? d : c, 1.1 * s);
    line(ctx, lx * s - 0.6 * s, -0.4 * s, lx * s + 0.7 * s, -0.4 * s, o, 0.6 * s); // the hoof
  }
  ellipse(ctx, 0, -6 * s, 4.8 * s, 2.3 * s, c); // the body
  ellipse(ctx, 3.4 * s, -6.6 * s, 2.2 * s, 2.6 * s, c); // the chest
  curve(ctx, -4.6 * s, -6.6 * s, -5.8 * s, -4.4 * s, -5.4 * s, -2.4 * s, 0.5 * s, d); // the tail
  ellipse(ctx, -5.4 * s, -2.2 * s, 0.5 * s, 0.8 * s, o);
  for (let i = 0; i < 4; i++) line(ctx, -2.6 * s + i * 1.6 * s, -4.2 * s, -2.2 * s + i * 1.6 * s, -3.8 * s, d, 0.3 * s); // belly curls
  // the wing sweeping back and up, in rows of feathers
  ctx.beginPath();
  ctx.moveTo(2.6 * s, -7.6 * s);
  ctx.quadraticCurveTo(-1 * s, -12.6 * s, -5.6 * s, -12.2 * s);
  ctx.lineTo(-4.4 * s, -10.4 * s);
  ctx.quadraticCurveTo(-1.6 * s, -9.6 * s, -1 * s, -7 * s);
  ctx.closePath();
  ctx.fillStyle = ink(shade(c, -0.06));
  ctx.fill();
  for (let i = 1; i < 4; i++) curve(ctx, 2.2 * s - i * 0.6 * s, -7.8 * s + i * 0.1 * s, -1 * s, -11.6 * s + i * 0.9 * s, -5.2 * s + i * 0.3 * s, -11.8 * s + i * 0.6 * s, 0.3 * s, d);
  for (let i = 0; i < 6; i++) line(ctx, -5.4 * s + i * 1.2 * s, -12 * s + i * 0.25 * s, -4.8 * s + i * 1.2 * s, -10.6 * s + i * 0.4 * s, d, 0.25 * s);
  // the head: a bearded man's face under a tall horned cap
  const hx = 4.8 * s, hy = -10 * s;
  poly(ctx, [hx - 1.2 * s, hy + 0.8 * s, hx + 1.2 * s, hy + 0.8 * s, hx + 1.4 * s, hy + 4 * s, hx - 0.8 * s, hy + 4.2 * s], o); // the long beard
  for (let i = 0; i < 3; i++) line(ctx, hx - 0.8 * s, hy + 1.6 * s + i * 0.9 * s, hx + 1.2 * s, hy + 1.6 * s + i * 0.9 * s, shade(o, 0.25), 0.25 * s);
  ellipse(ctx, hx, hy, 1.3 * s, 1.5 * s, c); // the face
  ellipse(ctx, hx + 0.5 * s, hy - 0.2 * s, 0.25 * s, 0.2 * s, o); // the eye
  poly(ctx, [hx - 1.3 * s, hy - 0.8 * s, hx + 1.3 * s, hy - 0.8 * s, hx + 1.2 * s, hy - 3.6 * s, hx - 1.2 * s, hy - 3.6 * s], c); // the cap
  for (const z of [1.4, 2.4]) curve(ctx, hx - 1.3 * s, hy - z * s, hx, hy - (z - 0.6) * s, hx + 1.3 * s, hy - z * s, 0.3 * s, o); // the horns round it
  for (let i = 0; i < 4; i++) ellipse(ctx, hx - 0.9 * s + i * 0.6 * s, hy - 3.9 * s, 0.25 * s, 0.4 * s, d); // the feathered crown
  line(ctx, hx - 1.3 * s, hy - 0.8 * s, hx - 1.6 * s, hy + 2 * s, o, 0.5 * s); // the hair at the nape
}

/** Draw a lamassu standing at (ox, oy), in the plane of the lit face, facing out to the left (dir -1) or right (1). */
function lamassuAt(ctx: Ctx, ox: number, oy: number, s: number, dir: number) {
  ctx.save();
  ctx.translate(ox, oy);
  ctx.transform(1, 0.5, 0, 1, 0, 0);
  ctx.scale(dir, 1);
  lamassu(ctx, s);
  ctx.restore();
}

/** The palace gate: two crenellated towers either side of an arched passage, a lamassu guarding each side. */
function lamassuGate(ctx: Ctx, x: number, y: number, s = 1) {
  ellipse(ctx, x + 1, y + 2, 19 * s, 7 * s, 'rgba(0,0,0,0.18)');
  const A = 4.4 * s, B = 2.8 * s, H = 13 * s, TW = 3 * s;
  block(ctx, x, y, A, B, H * 0.8, BRICK_L, shade(BRICK_L, 0.12)); // the wall over the passage
  crenellate(ctx, x, y, A, B, H * 0.8, BRICK_L, 1.8 * s, 0.6 * s);
  for (const d of [-1, 1]) {
    const [tx, ty] = P(x, y, d * (A + TW), 0.6 * s);
    block(ctx, tx, ty, TW, B + 0.6 * s, H, BRICK, shade(BRICK_L, 0.1));
    crenellate(ctx, tx, ty, TW, B + 0.6 * s, H, BRICK_L, 1.8 * s, 0.6 * s);
    const F = (u: number, z: number) => P(tx, ty, u, B + 0.6 * s, z);
    poly(ctx, [...F(-TW, 0), ...F(TW, 0), ...F(TW, 4.4 * s), ...F(-TW, 4.4 * s)], GYPSUM); // the gypsum orthostats
    for (let i = 1; i < 3; i++) { const a = F(-TW + i * TW * 2 / 3, 0), b = F(-TW + i * TW * 2 / 3, 4.4 * s); line(ctx, a[0], a[1], b[0], b[1], GYPSUM_D, 0.35); }
    poly(ctx, [...F(-TW, H - 2.2 * s), ...F(TW, H - 2.2 * s), ...F(TW, H - 1.4 * s), ...F(-TW, H - 1.4 * s)], RED);
    const [rx, ry] = F(0, H - 3.4 * s);
    rosette(ctx, rx, ry, 1.1 * s, WOOL, GOLD);
  }
  // the arched passage and its gypsum frame
  const F = (u: number, z: number) => P(x, y, u, B, z);
  poly(ctx, [...F(-2.6 * s, 0), ...F(2.6 * s, 0), ...F(2.6 * s, 7.6 * s), ...F(-2.6 * s, 7.6 * s)], GYPSUM_D);
  opening(ctx, x, y, 0, B, 2 * s, 0, 5 * s, '#1a1008', true);
  poly(ctx, [...F(-A, H * 0.8 - 2 * s), ...F(A, H * 0.8 - 2 * s), ...F(A, H * 0.8 - 1.3 * s), ...F(-A, H * 0.8 - 1.3 * s)], RED);
  // the guardians: each on the outer side of the passage, facing out of the gate toward the visitor
  for (const d of [-1, 1]) {
    const [lx, ly] = F(d * 4.6 * s, 0);
    lamassuAt(ctx, lx - 0.6 * s, ly + 2.4 * s, 0.62 * s, d);
  }
}

function building(ctx: Ctx, x: number, y: number, big: boolean, roofC: string, capital: boolean) {
  if (big && capital) {
    palace(ctx, x - 3, y - 3, roofC);
    // the gate out at the front-right corner of the tile, clear of the houses later levels add
    lamassuGate(ctx, x + 17, y + 13, 0.85);
    return;
  }
  if (big) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(0.86, 0.86);
    palace(ctx, 0, 0, roofC);
    ctx.restore();
    return;
  }
  const v = ((Math.round(x) * 7 + Math.round(y) * 3) % 5 + 5) % 5;
  if (v === 0) house(ctx, x, y, 6, 4, 6, roofC, { jar: true, band: true });
  else if (v === 1) house(ctx, x, y, 5.4, 4.4, 6.4, roofC, { upper: true, ladder: true });
  else if (v === 2) { dome(ctx, x - 4, y - 2, 4.4, 9.6); dome(ctx, x + 4, y + 1, 4, 8.6); dome(ctx, x - 1, y + 4, 3.4, 7.2); }
  else if (v === 3) { house(ctx, x - 2, y - 1, 4.6, 3.6, 5.6, roofC, { jar: true }); pomegranate(ctx, x + 8, y + 3, 0.6, 2, '#4a7a3a'); }
  else { house(ctx, x - 1, y, 6.4, 3.6, 5.6, roofC, { ladder: true, band: true }); dome(ctx, x + 7, y + 4, 3, 6.4); }
}

// ---------------------------------------------------------------- trees

/** A Euphrates poplar: a tall narrow column of silvery-green leaves on a pale trunk. */
function poplar(ctx: Ctx, x: number, y: number, k: number, green: string, seed: number) {
  const g = mix(green, '#9ab070', 0.3), hgt = (19 + rand(seed, 1) * 5) * k;
  line(ctx, x, y, x, y - hgt * 0.4, '#a89a80', 1.3 * k);
  line(ctx, x - 0.4 * k, y, x - 0.4 * k, y - hgt * 0.4, '#d0c8b0', 0.4 * k);
  for (let i = 0; i < 7; i++) {
    const t = i / 6, cy = y - hgt * (0.3 + t * 0.62), w = (2.6 - t * 1.4 + (i % 2) * 0.3) * k;
    ellipse(ctx, x, cy, w, 2.6 * k, shade(g, -0.12 + t * 0.06));
    ellipse(ctx, x - w * 0.35, cy - 0.6 * k, w * 0.5, 1.8 * k, shade(g, 0.12 + t * 0.06));
    ellipse(ctx, x + w * 0.45, cy + 0.4 * k, w * 0.4, 1.4 * k, shade(g, -0.26));
  }
  for (let i = 0; i < 6; i++) ellipse(ctx, x + (rand(seed, i + 3) - 0.5) * 3 * k, y - hgt * (0.35 + rand(seed, i + 9) * 0.55), 0.4 * k, 0.3 * k, '#e4ecc8'); // the silver undersides catching light
}

/** A pomegranate: a low bushy crown on a twisted trunk, red fruit and orange flowers. */
function pomegranate(ctx: Ctx, x: number, y: number, k: number, seed: number, green: string) {
  line(ctx, x, y, x - 0.6 * k, y - 4 * k, '#6a4a2a', 1.1 * k);
  line(ctx, x - 0.6 * k, y - 4 * k, x - 2.4 * k, y - 6 * k, '#6a4a2a', 0.7 * k);
  line(ctx, x - 0.6 * k, y - 4 * k, x + 1.6 * k, y - 6.4 * k, '#6a4a2a', 0.7 * k);
  for (const [dx, dy, r] of [[-2.6, -6.4, 3], [2.2, -6.8, 3], [0, -8.8, 3.2], [-0.4, -6, 2.6]] as const) ellipse(ctx, x + dx * k, y + dy * k, r * k, r * 0.82 * k, rand(seed, dx + 5) > 0.5 ? shade(green, -0.08) : mix(green, '#7ab040', 0.35));
  ellipse(ctx, x - 1 * k, y - 9.6 * k, 1.6 * k, 1 * k, mix(green, '#a8d070', 0.4));
  for (const [dx, dy] of [[-2.8, -5.4], [1.8, -5.8], [0.6, -8.8], [-1.6, -8], [3, -7.6]] as const) {
    ellipse(ctx, x + dx * k, y + dy * k, 0.85 * k, 0.85 * k, '#c02a22');
    ellipse(ctx, x + dx * k - 0.25 * k, y + dy * k - 0.3 * k, 0.3 * k, 0.3 * k, '#f07060');
  }
  for (const [dx, dy] of [[-0.6, -10.4], [2.6, -9]] as const) ellipse(ctx, x + dx * k, y + dy * k, 0.5 * k, 0.5 * k, '#f08a2a');
}

/** A fig: a broad low crown of big lobed leaves on a pale grey branching trunk. */
function fig(ctx: Ctx, x: number, y: number, k: number, seed: number, green: string) {
  const bark = '#9a9284';
  line(ctx, x, y, x, y - 4 * k, bark, 1.6 * k);
  line(ctx, x, y - 4 * k, x - 3.4 * k, y - 7 * k, bark, 1 * k);
  line(ctx, x, y - 4 * k, x + 3.2 * k, y - 7.4 * k, bark, 1 * k);
  const g = mix(green, '#3a6a2a', 0.3);
  for (let i = 0; i < 9; i++) { // big leaves, each a cluster of three lobes
    const a = (i / 9) * Math.PI * 2 + seed, rr = 3.4 + (i % 3) * 0.8;
    const lx = x + Math.cos(a) * rr * 1.25 * k, ly = y - 8.6 * k + Math.sin(a) * rr * 0.6 * k;
    const c = shade(g, (Math.sin(a) < 0 ? 0.1 : -0.12) + (i % 2) * 0.06);
    for (const [ox, oy] of [[-0.9, 0.2], [0.9, 0.2], [0, -0.8]] as const) ellipse(ctx, lx + ox * k, ly + oy * k, 1.5 * k, 1.2 * k, c);
  }
  for (const [ox, oy] of [[-0.9, 0.2], [0.9, 0.2], [0, -0.8]] as const) ellipse(ctx, x + ox * 1.4 * k, y - 9.4 * k + oy * k, 2 * k, 1.5 * k, shade(g, 0.16));
  line(ctx, x, y - 9.4 * k, x, y - 7.6 * k, shade(g, -0.3), 0.3 * k);
  for (const [dx, dy] of [[-2.4, -7.4], [2.8, -8], [0.6, -6.4]] as const) ellipse(ctx, x + dx * k, y + dy * k, 0.6 * k, 0.7 * k, '#6a3a5a');
}

/**
 * Poplars stand along a little river (the forest's spots lie in rows along u, so the stream pieces line up), with
 * pomegranates and figs between them.
 */
function tree(ctx: Ctx, x: number, y: number, k: number, Pal: BiomePalette, variant: number) {
  const green = Pal.forest ?? '#4a7a3a';
  if (variant % 2 === 0) { // the river bank in front of the row: water between reedy edges
    const du = 5.6, ox = -3.4, oy = 2.4;
    const a: [number, number] = [x + ox - du, y + oy - du / 2], b: [number, number] = [x + ox + du, y + oy + du / 2];
    poly(ctx, [a[0] + 1.6, a[1] - 0.8, b[0] + 1.6, b[1] - 0.8, b[0] - 1.8, b[1] + 0.9, a[0] - 1.8, a[1] + 0.9], '#8a9a5a');
    poly(ctx, [a[0] + 0.9, a[1] - 0.45, b[0] + 0.9, b[1] - 0.45, b[0] - 1.1, b[1] + 0.55, a[0] - 1.1, a[1] + 0.55], Pal.shallow ?? '#5ad0c8');
    line(ctx, a[0] + 0.4, a[1] - 0.2, b[0] + 0.4, b[1] - 0.2, 'rgba(255,255,255,0.45)', 0.5);
    for (let i = 0; i < 4; i++) { const t = 0.15 + i * 0.22, rx = a[0] + (b[0] - a[0]) * t - 1.6, ry = a[1] + (b[1] - a[1]) * t + 0.8; line(ctx, rx, ry, rx - 0.3, ry - 2.4, '#6a8a3a', 0.4); line(ctx, rx + 0.5, ry, rx + 0.8, ry - 2, '#7a9a4a', 0.4); }
  }
  if (variant === 4) return fig(ctx, x, y, k, variant, green);
  if (variant === 1) return pomegranate(ctx, x, y, k * 0.95, variant, green);
  if (variant === 3 && rand(Math.round(x), Math.round(y)) > 0.5) return fig(ctx, x, y, k * 0.9, variant, green);
  poplar(ctx, x, y, k, green, variant + Math.round(x));
}

// ---------------------------------------------------------------- registration

registerArt('assyria', {
  unit(ctx, kind, x, y) {
    switch (kind) {
      case 'warrior': case 'archer': case 'defender': case 'swordsman': case 'explorer':
        footUnit(ctx, kind, x, y, 1);
        return true;
      case 'giant': footUnit(ctx, kind, x, y, 1.4); return true;
      case 'rider': horseman(ctx, x, y); return true;
      case 'knight': chariot(ctx, x, y); return true;
      case 'siegetower': case 'catapult': siegeTower(ctx, x, y); return true;
      case 'boat': raft(ctx, x, y); return true;
      case 'ship': bigRaft(ctx, x, y); return true;
      case 'warship': bireme(ctx, x, y); return true;
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

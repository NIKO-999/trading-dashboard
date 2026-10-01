// Spain (the Crown of Castile): tercio soldiers in red, black and gold doublets over paned trunk-hose, steel morions and
// cabassets, peascod breastplates for the heavy ranks and white ruffs for the officers; wide-brimmed feathered hats for
// the light troops; steel rodela shields bearing the red saltire of Burgundy or the castle and lion of Castile and León;
// pikes, rapiers, a partisan and the long arquebus; a jinete light horseman with an adarga; the Conquistador on a
// barded horse under a red banner; a bronze cannon; a lateen caravel, a carrack and a tall galleon; whitewashed towns
// with red-tile roofs, balconies and arcades, an alcázar and a cathedral bell tower for the capital; olive, orange and
// holm-oak trees.
import { registerArt, type Body } from '../tribeart';
import { drawHorse, figure } from '../units';
import type { BiomePalette } from '../../data/tribes';
import type { UnitKind } from '../../game/types';
import { band, box, ellipse, faceQuad, ink, line, mix, poly, rand, roof, shade, type Ctx } from '../prims';

const RED = '#b0141e';
const RED_L = '#d8323c';
const RED_D = '#6a0a10';
const BLACK = '#211c20';
const GOLD = '#e2b443';
const GOLD_L = '#f6dc84';
const GOLD_D = '#9a7020';
const STEEL = '#c2c8d0';
const STEEL_L = '#eef2f6';
const STEEL_D = '#6e7680';
const WHITE = '#f7f4ec';
const BUFF = '#d2ae74';
const LEATH = '#7a4a26';
const WOOD = '#7a5230';
const WOOD_D = '#4a3018';
const BRONZE = '#c8903a';
const BRONZE_L = '#efc070';
const BRONZE_D = '#7a5020';
const WASH = '#f6f2ea';
const OCHRE = '#d8a04a';
const HAIR = '#2a1a12';

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

/** A rounded dome (helmet bowl): the rim is the ellipse at (x, y), the crown rises `h` above it. */
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

/** The red saltire of Burgundy: two crossed ragged staves, inside a clip the caller has set. */
function saltire(ctx: Ctx, cx: number, cy: number, r: number, c = RED, wd = 0.34) {
  for (const s of [1, -1]) {
    line(ctx, cx - r * s, cy - r, cx + r * s, cy + r, c, r * wd);
    for (let i = -2; i <= 2; i++) { // the knots on the ragged staves
      if (!i) continue;
      const t = i / 2.6, px = cx + t * r * s, py = cy + t * r;
      ellipse(ctx, px - r * 0.12 * s, py + r * 0.12, r * 0.13, r * 0.13, c);
    }
  }
}

/** A tiny castle (Castile): a gold tower of three turrets on red. */
function castle(ctx: Ctx, cx: number, cy: number, s: number, c = GOLD) {
  poly(ctx, [cx - 1.6 * s, cy + 1.4 * s, cx + 1.6 * s, cy + 1.4 * s, cx + 1.6 * s, cy - 0.2 * s, cx - 1.6 * s, cy - 0.2 * s], c);
  poly(ctx, [cx - 0.6 * s, cy - 0.2 * s, cx + 0.6 * s, cy - 0.2 * s, cx + 0.6 * s, cy - 1.6 * s, cx - 0.6 * s, cy - 1.6 * s], c);
  for (const d of [-1.3, 1.3]) poly(ctx, [cx + d * s - 0.35 * s, cy - 0.2 * s, cx + d * s + 0.35 * s, cy - 0.2 * s, cx + d * s + 0.35 * s, cy - 1 * s, cx + d * s - 0.35 * s, cy - 1 * s], c);
  poly(ctx, [cx - 0.35 * s, cy + 1.4 * s, cx + 0.35 * s, cy + 1.4 * s, cx + 0.35 * s, cy + 0.6 * s, cx, cy + 0.3 * s, cx - 0.35 * s, cy + 0.6 * s], RED_D);
}

/** A tiny rampant lion (León): a purple blob of a beast standing up. */
function lion(ctx: Ctx, cx: number, cy: number, s: number) {
  const c = '#7a2a8a';
  ellipse(ctx, cx, cy, 0.8 * s, 1.3 * s, c); // body
  ellipse(ctx, cx + 0.5 * s, cy - 1.3 * s, 0.7 * s, 0.6 * s, c); // head
  line(ctx, cx + 0.4 * s, cy - 0.4 * s, cx + 1.4 * s, cy - 1.1 * s, c, 0.45 * s); // forepaws
  line(ctx, cx - 0.2 * s, cy + 1 * s, cx - 0.6 * s, cy + 1.9 * s, c, 0.45 * s);
  line(ctx, cx + 0.3 * s, cy + 1 * s, cx + 0.9 * s, cy + 1.8 * s, c, 0.45 * s);
  curve(ctx, cx - 0.6 * s, cy + 0.5 * s, cx - 1.8 * s, cy, cx - 1.2 * s, cy - 1.4 * s, 0.3 * s, c); // tail
}

/** A banner of Spain: red with a gold saltire border, or the Burgundy cross on white, streaming from (x, y). */
function banner(ctx: Ctx, x: number, y: number, w: number, h: number, look: 'red' | 'cross', wave = 0) {
  const pts = [x, y, x + w * 0.5, y + 0.8 + wave, x + w, y + 0.2, x + w * 0.86, y + h * 0.5 + wave * 0.5, x + w, y + h, x + w * 0.5, y + h + 0.6 - wave, x, y + h];
  poly(ctx, pts, look === 'red' ? RED : WHITE);
  poly(ctx, [x, y, x + w * 0.5, y + 0.8 + wave, x + w, y + 0.2, x + w * 0.94, y + h * 0.28, x, y + h * 0.3], look === 'red' ? RED_L : '#ffffff');
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.clip();
  if (look === 'cross') saltire(ctx, x + w * 0.45, y + h * 0.5, Math.min(w, h) * 0.5, RED, 0.3);
  else { castle(ctx, x + w * 0.4, y + h * 0.5, h * 0.2); line(ctx, x, y + h - 0.4, x + w, y + h - 0.4, GOLD, 0.7); }
  ctx.restore();
}

// ---------------------------------------------------------------- dress

const ARMOURED = (k: UnitKind) => k === 'defender' || k === 'swordsman' || k === 'knight' || k === 'giant' || k === 'conquistador';
const OFFICER = (k: UnitKind) => k === 'swordsman' || k === 'knight' || k === 'giant' || k === 'conquistador' || k === 'explorer';

function dress(kind: UnitKind): [string, string, string] | null {
  switch (kind) {
    case 'warrior': return [RED, '#2c2428', RED];
    case 'archer': return [BLACK, '#3a2c2a', BLACK];
    case 'rider': return [BUFF, '#5a3a2a', RED];
    case 'defender': return [STEEL, '#2c2428', RED];
    case 'swordsman': return [STEEL, '#2c2428', BLACK];
    case 'knight': case 'conquistador': return [STEEL, '#2c2428', RED];
    case 'giant': return [GOLD, RED_D, RED];
    case 'explorer': return [BUFF, '#4a3a2c', BUFF];
    default: return [RED, '#2c2428', RED];
  }
}

/** Paned trunk-hose puffed out round the hips: strips of red, gold or black over a contrasting lining. */
function trunkHose(ctx: Ctx, x: number, y: number, w: number, k: number, pane: string, lining: string) {
  const bw = w * 1.24, bh = 3.6 * k, by = y + 3.2 * k;
  for (const f of ['L', 'R'] as const) {
    faceQuad(ctx, f, x, by, bw, bh, 0, 1, 0.1, 1, lining);
    for (let i = 0; i < 4; i++) faceQuad(ctx, f, x, by, bw, bh, i / 4 + 0.03, i / 4 + 0.17, 0.02, 1, pane);
    faceQuad(ctx, f, x, by, bw, bh, 0, 1, 0, 0.12, shade(pane, -0.3)); // the band at the thigh
  }
}

/** A white ruff at the throat: a pleated collar round the neck. */
function ruff(ctx: Ctx, x: number, y: number, k: number) {
  ellipse(ctx, x, y + 0.6 * k, 6.4 * k, 2.6 * k, shade(WHITE, -0.16));
  ellipse(ctx, x, y, 6.2 * k, 2.4 * k, WHITE);
  for (let i = 0; i < 12; i++) {
    const a = Math.PI * (0.02 + (i / 11) * 0.96);
    line(ctx, x + Math.cos(a) * 3 * k, y + Math.sin(a) * 1.1 * k, x + Math.cos(a) * 6 * k, y + Math.sin(a) * 2.3 * k, '#c8c4bc', 0.35 * k);
  }
}

/** A peascod breastplate: steel with a central ridge, a gilt edge and rivets; tassets over the hips. */
function cuirass(ctx: Ctx, x: number, y: number, w: number, h: number, metal: string, trim: string) {
  const k = w / 10;
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const L = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'L', x, y, w, h, u0, u1, v0, v1, c);
  for (let i = 0; i < 3; i++) { // tassets: overlapping lames below the waist
    R(0.04, 0.96, -0.08 - i * 0.1, 0.02 - i * 0.1, shade(metal, -0.08 * i));
    L(0.04, 0.96, -0.08 - i * 0.1, 0.02 - i * 0.1, shade(metal, -0.08 * i));
    R(0.04, 0.96, -0.08 - i * 0.1, -0.06 - i * 0.1, shade(metal, -0.35));
  }
  R(0.06, 0.48, 0.22, 0.86, shade(metal, 0.24)); // the lit half of the breast
  R(0.48, 0.54, 0.12, 0.88, shade(metal, 0.55)); // the ridge, catching the light
  R(0.54, 0.58, 0.12, 0.88, shade(metal, -0.25));
  R(0.36, 0.66, 0.06, 0.16, shade(metal, 0.1)); // the peascod point at the belly
  L(0.2, 0.7, 0.4, 0.8, shade(metal, 0.12));
  band(ctx, x, y, w, h, 0.9, 1, trim); // a gilt neck edge
  band(ctx, x, y, w, h, 0.04, 0.1, trim); // a gilt waist edge
  for (const u of [0.14, 0.86]) R(u - 0.04, u + 0.04, 0.82, 0.88, GOLD_L); // rivets
  ellipse(ctx, x + w * 0.25, y + w * 0.125 - h * 0.48, 0.5 * k, 0.5 * k, GOLD_L);
}

function torso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const k = w / 10;
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const L = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'L', x, y, w, h, u0, u1, v0, v1, c);
  const B = (v0: number, v1: number, c: string) => band(ctx, x, y, w, h, v0, v1, c);
  const buttons = (c: string) => { for (let i = 0; i < 4; i++) R(0.47, 0.55, 0.2 + i * 0.18, 0.27 + i * 0.18, c); };
  const slashes = (c: string) => { for (const [u, v] of [[0.14, 0.5], [0.24, 0.66], [0.72, 0.5], [0.82, 0.66]] as const) R(u, u + 0.05, v, v + 0.18, c); };
  switch (kind) {
    case 'warrior': // a red doublet slashed to show gold, a black belt, paned hose
      trunkHose(ctx, x, y, w, k, RED, GOLD);
      slashes(GOLD);
      buttons(GOLD_L);
      B(0.08, 0.16, BLACK);
      R(0.44, 0.58, 0.08, 0.16, GOLD);
      return;
    case 'archer': { // an arquebusier: a black doublet, a bandolier of powder charges ("the twelve apostles"), red hose
      trunkHose(ctx, x, y, w, k, RED, BLACK);
      buttons(GOLD);
      faceQuad(ctx, 'R', x, y, w, h, 0, 1, 0.92, 1, RED);
      // the bandolier from the shoulder to the hip, hung with little wooden flasks
      for (let i = 0; i < 6; i++) {
        const t = i / 5, u = 0.06 + t * 0.86, v = 0.92 - t * 0.78;
        R(u, u + 0.12, v - 0.08, v + 0.04, '#5a3a1e');
        if (i % 1 === 0 && i < 5) R(u + 0.02, u + 0.1, v - 0.22, v - 0.08, i % 2 ? '#8a5a2a' : '#6a4422');
      }
      return;
    }
    case 'rider': // a jinete's buff leather jerkin with a red sash
      trunkHose(ctx, x, y, w, k, '#5a3a2a', RED);
      B(0.3, 0.42, RED);
      R(0.2, 0.3, 0.12, 0.3, RED_L);
      for (let i = 0; i < 4; i++) R(0.48, 0.52, 0.48 + i * 0.12, 0.52 + i * 0.12, LEATH); // laces
      return;
    case 'explorer': // a buff doublet, a red sash and a ruff
      trunkHose(ctx, x, y, w, k, '#4a3a2c', GOLD);
      buttons(GOLD_D);
      B(0.26, 0.38, RED);
      return;
    case 'giant': // a gilded breastplate, a red sash of command across it, a great ruff
      trunkHose(ctx, x, y, w, k, RED, GOLD);
      cuirass(ctx, x, y, w, h, GOLD, RED);
      for (let i = 0; i < 4; i++) { const u = 0.08 + i * 0.22; R(u, u + 0.22, 0.86 - i * 0.18, 0.66 - i * 0.18, RED); }
      return;
    default:
      if (ARMOURED(kind)) {
        trunkHose(ctx, x, y, w, k, kind === 'swordsman' ? BLACK : RED, GOLD);
        cuirass(ctx, x, y, w, h, STEEL, kind === 'defender' ? STEEL_D : GOLD);
        if (kind === 'knight' || kind === 'conquistador') { // a red sash tied at the side
          L(0.1, 0.9, 0.28, 0.38, RED);
          R(0, 0.14, 0.1, 0.38, RED_L);
        }
        return;
      }
      trunkHose(ctx, x, y, w, k, RED, GOLD);
      buttons(GOLD);
  }
}

/** Castilian faces: an upturned moustache and a pointed goatee for the grown ranks. */
function face(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  if (OFFICER(kind)) ruff(ctx, x + w * 0.08, y + w * 0.2, w / 11); // the chin rests on a white ruff
  if (kind === 'rider' || kind === 'archer') { R(0.3, 0.46, 0.22, 0.26, HAIR); R(0.54, 0.7, 0.22, 0.26, HAIR); return; } // a young moustache
  R(0.42, 0.58, -0.08, 0.14, HAIR); // the goatee, pointed
  R(0.47, 0.53, -0.14, -0.06, HAIR);
  R(0.24, 0.46, 0.2, 0.25, HAIR); // the moustache, its ends curled up
  R(0.54, 0.76, 0.2, 0.25, HAIR);
  R(0.18, 0.24, 0.24, 0.32, HAIR);
  R(0.76, 0.82, 0.24, 0.32, HAIR);
  faceQuad(ctx, 'L', x, y, w, h, 0.84, 1, 0.1, 0.34, HAIR);
}

// ---------------------------------------------------------------- headgear

/** A morion: a round steel bowl with a tall comb, and a brim swept up to a point front and back. */
function morion(ctx: Ctx, x: number, top: number, k: number, hw: number, metal: string, plume?: string) {
  const by = top + 2 * k, rx = hw / 2 + 4.4 * k;
  // the bowl
  dome(ctx, x, by - 0.4 * k, hw / 2 + 0.6 * k, 5 * k, metal);
  // the comb: a tall half-moon fin running front to back over the crown
  const cy = by - 3.4 * k, cr = 3.4 * k, ch = 6.6 * k;
  ctx.beginPath();
  ctx.ellipse(x, cy, cr, ch, 0, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = ink(shade(metal, 0.12));
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, cy, cr, ch, 0, Math.PI * 1.5, Math.PI * 2);
  ctx.lineTo(x, cy);
  ctx.closePath();
  ctx.fillStyle = ink(shade(metal, -0.16));
  ctx.fill();
  ctx.strokeStyle = ink(shade(metal, -0.45));
  ctx.lineWidth = 0.45 * k;
  ctx.beginPath();
  ctx.ellipse(x, cy, cr, ch, 0, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = ink(STEEL_L);
  ctx.lineWidth = 0.5 * k;
  ctx.beginPath();
  ctx.ellipse(x, cy, cr * 0.8, ch * 0.86, 0, Math.PI * 1.12, Math.PI * 1.46);
  ctx.stroke();
  // the brim, a crescent rising to a point at each end, drawn over the foot of the bowl
  const outer = [x - rx, by - 5 * k, x - rx * 0.7, by - 0.6 * k, x - rx * 0.3, by + 1.4 * k, x + rx * 0.3, by + 1.6 * k, x + rx * 0.7, by - 0.2 * k, x + rx, by - 4.4 * k];
  const inner = [x + rx * 0.66, by - 1.6 * k, x + rx * 0.3, by - 0.2 * k, x - rx * 0.3, by - 0.4 * k, x - rx * 0.66, by - 2 * k];
  poly(ctx, [...outer, ...inner], metal);
  poly(ctx, [x + rx * 0.3, by + 1.6 * k, x + rx * 0.7, by - 0.2 * k, x + rx, by - 4.4 * k, x + rx * 0.66, by - 1.6 * k, x + rx * 0.3, by - 0.2 * k], shade(metal, -0.2));
  ctx.strokeStyle = ink(shade(metal, -0.45));
  ctx.lineWidth = 0.4 * k;
  ctx.beginPath();
  for (let i = 0; i < outer.length; i += 2) (i ? ctx.lineTo(outer[i], outer[i + 1]) : ctx.moveTo(outer[i], outer[i + 1]));
  ctx.stroke();
  line(ctx, x - rx * 0.92, by - 3.8 * k, x - rx * 0.5, by - 0.6 * k, STEEL_L, 0.5 * k);
  for (const d of [-3, -1, 1, 3]) ellipse(ctx, x + d * k, by - 0.2 * k + Math.abs(d) * 0.05 * k, 0.4 * k, 0.4 * k, GOLD_L); // brass rivets round the bowl
  if (plume) { // a plume rising from a holder at the back of the comb
    line(ctx, x - 3.4 * k, by - 2.4 * k, x - 4 * k, by - 6 * k, GOLD, 0.9 * k);
    for (let i = 0; i < 4; i++) curve(ctx, x - 4 * k, by - 6 * k, x - 6 * k - i * 0.4 * k, by - 12.6 * k + i * 0.6 * k, x - 9.6 * k - i * 0.6 * k, by - 7.6 * k + i * 1.2 * k, 1.4 * k, i % 2 ? shade(plume, -0.2) : plume);
  }
}

/** A cabasset: a tall almond-shaped steel bowl with a little stalk on top and a narrow flat brim. */
function cabasset(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const by = top + 2.2 * k, rx = hw / 2 + 1.6 * k;
  ellipse(ctx, x, by + 0.6 * k, rx, 2 * k, shade(STEEL, -0.25));
  ellipse(ctx, x, by, rx, 1.9 * k, STEEL);
  ring(ctx, x, by, rx, 1.9 * k, STEEL_D, 0.4 * k);
  const bx = hw / 2 + 0.2 * k;
  const pts = [x - bx, by, x - bx, by - 3.6 * k, x - bx * 0.6, by - 7.4 * k, x, by - 8.8 * k, x + bx * 0.6, by - 7.4 * k, x + bx, by - 3.6 * k, x + bx, by];
  poly(ctx, pts, STEEL);
  poly(ctx, [x + 0.6 * k, by + 0.4 * k, x + 0.6 * k, by - 8.6 * k, x + bx * 0.6, by - 7.4 * k, x + bx, by - 3.6 * k, x + bx, by], shade(STEEL, -0.22));
  line(ctx, x - bx * 0.5, by - 1 * k, x - bx * 0.5, by - 6.4 * k, STEEL_L, 0.7 * k);
  line(ctx, x - bx, by - 0.6 * k, x + bx, by - 0.6 * k, GOLD, 0.9 * k); // a brass band of rivets
  for (const d of [-3, -1, 1, 3]) ellipse(ctx, x + d * k, by - 0.6 * k, 0.35 * k, 0.35 * k, GOLD_L);
  line(ctx, x, by - 8.6 * k, x + 0.8 * k, by - 10.6 * k, STEEL_D, 0.9 * k); // the stalk
}

/** A wide-brimmed felt hat with a band and a curling feather. */
function hat(ctx: Ctx, x: number, top: number, k: number, hw: number, felt: string, bandC: string, feather: string) {
  const by = top + 2 * k, rx = hw / 2 + 3.2 * k;
  ellipse(ctx, x + 0.4 * k, by + 0.8 * k, rx, 2.8 * k, shade(felt, -0.3));
  ellipse(ctx, x, by, rx, 2.7 * k, felt);
  ellipse(ctx, x - rx * 0.3, by - 0.6 * k, rx * 0.5, 1.2 * k, shade(felt, 0.14));
  // the crown
  const cw = hw / 2 + 0.4 * k;
  poly(ctx, [x - cw, by, x - cw * 0.84, by - 5 * k, x + cw * 0.84, by - 5 * k, x + cw, by], felt);
  poly(ctx, [x + 0.4 * k, by + 0.6 * k, x + 0.4 * k, by - 5 * k, x + cw * 0.84, by - 5 * k, x + cw, by], shade(felt, -0.2));
  ellipse(ctx, x, by - 5 * k, cw * 0.84, 1.4 * k, shade(felt, 0.08));
  poly(ctx, [x - cw, by, x - cw * 0.96, by - 1.6 * k, x + cw * 0.96, by - 1.6 * k, x + cw, by], bandC);
  ellipse(ctx, x + cw * 0.6, by - 0.8 * k, 0.6 * k, 0.6 * k, GOLD_L);
  // the feather sweeping back over the brim
  for (let i = 0; i < 3; i++) curve(ctx, x + cw * 0.5, by - 1.6 * k, x - 2 * k - i * 0.6 * k, by - 9 * k + i * k, x - rx - 1 * k + i * 0.8 * k, by - 3 * k + i * 0.8 * k, (1.8 - i * 0.4) * k, i % 2 ? shade(feather, -0.15) : feather);
}

/** A royal crown over a red velvet cap: a gold circlet with fleurons, set with gems. */
function crown(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const by = top + 2.4 * k, rx = hw / 2 + 0.6 * k;
  dome(ctx, x, by - 1.6 * k, rx * 0.9, 4.6 * k, RED);
  poly(ctx, [x - rx, by + 0.6 * k, x + rx, by + 0.6 * k, x + rx, by - 2.6 * k, x - rx, by - 2.6 * k], GOLD);
  poly(ctx, [x + 0.4 * k, by + 0.6 * k, x + rx, by + 0.6 * k, x + rx, by - 2.6 * k, x + 0.4 * k, by - 2.6 * k], shade(GOLD, -0.18));
  for (let i = 0; i < 5; i++) { // fleurons: a lily of three lobes
    const fx = x - rx + (i / 4) * rx * 2;
    poly(ctx, [fx - 1.1 * k, by - 2.4 * k, fx + 1.1 * k, by - 2.4 * k, fx, by - 5.4 * k], i > 2 ? shade(GOLD, -0.12) : GOLD);
    ellipse(ctx, fx, by - 5.6 * k, 0.7 * k, 0.7 * k, GOLD_L);
  }
  for (const [d, c] of [[-0.6, RED_L], [0, '#2a7ac8'], [0.6, '#2a9a5a']] as const) ellipse(ctx, x + d * rx, by - 1 * k, 0.7 * k, 0.8 * k, c);
  line(ctx, x - rx, by - 2.4 * k, x + rx, by - 2.4 * k, GOLD_L, 0.5 * k);
  // the orb and cross atop the arches
  curve(ctx, x - rx * 0.9, by - 2.6 * k, x, by - 9 * k, x + rx * 0.9, by - 2.6 * k, 0.7 * k, GOLD);
  ellipse(ctx, x, by - 6.6 * k, 1 * k, 1 * k, GOLD_L);
  line(ctx, x, by - 7.4 * k, x, by - 9.2 * k, GOLD, 0.6 * k);
  line(ctx, x - 0.8 * k, by - 8.6 * k, x + 0.8 * k, by - 8.6 * k, GOLD, 0.6 * k);
}

function head(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  switch (kind) {
    case 'warrior': cabasset(ctx, x, top, k, hw); return;
    case 'defender': morion(ctx, x, top, k, hw, STEEL); return;
    case 'swordsman': morion(ctx, x, top, k, hw, STEEL, RED); return;
    case 'conquistador': morion(ctx, x, top, k, hw, STEEL_L, RED); return;
    case 'knight': morion(ctx, x, top, k, hw, '#d8dce2', WHITE); return;
    case 'archer': hat(ctx, x, top, k, hw, BLACK, RED, WHITE); return;
    case 'rider': hat(ctx, x, top, k, hw, '#4a3426', GOLD, RED); return;
    case 'explorer': hat(ctx, x, top, k, hw, '#6a4a2e', BLACK, WHITE); return;
    case 'giant': crown(ctx, x, top, k, hw); return;
    default: return;
  }
}

// ---------------------------------------------------------------- weapons and shields

/** A rodela: a round steel shield, polished, with a gilt rim and boss, painted with the saltire or Castile-and-León. */
function rodela(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  const big = kind === 'defender' || kind === 'giant';
  const cx = x - 1.4 * k, cy = y - (big ? 6 : 5.4) * k, rx = (big ? 6.2 : 5.4) * k, ry = (big ? 6.8 : 5.9) * k;
  ellipse(ctx, cx + 0.9 * k, cy + 0.6 * k, rx, ry, STEEL_D); // its thickness
  ellipse(ctx, cx, cy, rx, ry, STEEL);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 0.9, ry * 0.9, 0, 0, Math.PI * 2);
  ctx.clip();
  if (kind === 'giant') { // quartered: castles on red, lions on white
    poly(ctx, [cx - rx, cy - ry, cx, cy - ry, cx, cy, cx - rx, cy], RED);
    poly(ctx, [cx, cy, cx + rx, cy, cx + rx, cy + ry, cx, cy + ry], RED);
    poly(ctx, [cx, cy - ry, cx + rx, cy - ry, cx + rx, cy, cx, cy], WHITE);
    poly(ctx, [cx - rx, cy, cx, cy, cx, cy + ry, cx - rx, cy + ry], WHITE);
    castle(ctx, cx - rx * 0.42, cy - ry * 0.4, 1.1 * k);
    castle(ctx, cx + rx * 0.42, cy + ry * 0.44, 1.1 * k);
    lion(ctx, cx + rx * 0.4, cy - ry * 0.4, 1.1 * k);
    lion(ctx, cx - rx * 0.44, cy + ry * 0.42, 1.1 * k);
  } else {
    ellipse(ctx, cx - rx * 0.3, cy - ry * 0.34, rx * 0.5, ry * 0.36, shade(STEEL, 0.35)); // a polished glint
    saltire(ctx, cx, cy, rx * 0.8, RED, 0.32);
  }
  ctx.restore();
  ring(ctx, cx, cy, rx * 0.95, ry * 0.95, GOLD, 0.9 * k);
  ring(ctx, cx, cy, rx * 0.99, ry * 0.99, GOLD_D, 0.35 * k);
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; ellipse(ctx, cx + Math.cos(a) * rx * 0.95, cy + Math.sin(a) * ry * 0.95, 0.35 * k, 0.35 * k, GOLD_L); }
  ellipse(ctx, cx + 0.3 * k, cy + 0.3 * k, 1.5 * k, 1.5 * k, GOLD_D); // the boss
  ellipse(ctx, cx, cy, 1.4 * k, 1.4 * k, GOLD);
  ellipse(ctx, cx - 0.4 * k, cy - 0.4 * k, 0.5 * k, 0.5 * k, GOLD_L);
}

/** A rapier (or a broader sword): a long narrow blade and a swept hilt with a cup and knuckle-bow. */
function rapier(ctx: Ctx, x: number, y: number, k: number, len = 17, broad = false) {
  const hx = x, hy = y, tx = x + len * 0.28 * k, ty = y - len * k;
  const wd = (broad ? 1.3 : 0.75) * k;
  poly(ctx, [hx - wd, hy - 1.6 * k, tx - 0.2 * k, ty + 1.2 * k, tx + 0.15 * k, ty - 0.6 * k, hx + 0.1 * k, hy - 2 * k], STEEL_L);
  poly(ctx, [hx + wd, hy - 1.4 * k, tx + 0.4 * k, ty + 1.2 * k, tx + 0.15 * k, ty - 0.6 * k, hx + 0.1 * k, hy - 2 * k], '#9aa2ac');
  line(ctx, hx + 0.1 * k, hy - 2.4 * k, tx, ty + 1.4 * k, STEEL_D, 0.3 * k);
  // the swept hilt: quillons, a cup and a knuckle-bow, a wire grip and a round pommel
  line(ctx, hx - 3 * k, hy - 1.2 * k, hx + 3 * k, hy - 2.4 * k, GOLD_D, 0.9 * k);
  ctx.strokeStyle = ink(GOLD);
  ctx.lineWidth = 0.7 * k;
  ctx.beginPath();
  ctx.ellipse(hx + 0.2 * k, hy - 1.2 * k, 2.2 * k, 1.4 * k, -0.25, 0, Math.PI);
  ctx.stroke();
  curve(ctx, hx + 2.6 * k, hy - 2.2 * k, hx + 3.6 * k, hy + 1.8 * k, hx - 0.6 * k, hy + 3.2 * k, 0.6 * k, GOLD);
  line(ctx, hx, hy - 1.6 * k, hx - 0.5 * k, hy + 2.4 * k, '#3a2a20', 1.4 * k);
  ellipse(ctx, hx - 0.6 * k, hy + 3 * k, 1.1 * k, 1.1 * k, GOLD);
  ellipse(ctx, hx - 0.9 * k, hy + 2.7 * k, 0.4 * k, 0.4 * k, GOLD_L);
}

/** A long ash pike with a steel head. */
function pike(ctx: Ctx, x: number, y: number, k: number, len = 40) {
  const x0 = x - 2.6 * k, y0 = y + 8 * k, x1 = x + 4 * k, y1 = y - (len - 8) * k;
  line(ctx, x0, y0, x1, y1, WOOD, 1.2 * k);
  line(ctx, x0 - 0.4 * k, y0, x1 - 0.4 * k, y1, shade(WOOD, 0.4), 0.4 * k);
  poly(ctx, [x1 + 0.5 * k, y1 - 5.6 * k, x1 - 1 * k, y1 - 0.6 * k, x1 + 0.1 * k, y1 + 0.8 * k, x1 + 1.3 * k, y1 - 0.4 * k], STEEL_L);
  poly(ctx, [x1 + 0.5 * k, y1 - 5.6 * k, x1 + 1.3 * k, y1 - 0.4 * k, x1 + 0.1 * k, y1 + 0.8 * k], STEEL_D);
  line(ctx, x1 - 0.1 * k, y1 + 0.6 * k, x1 - 0.5 * k, y1 + 3.6 * k, STEEL, 0.7 * k); // langets
  line(ctx, x1 - 0.5 * k, y1 + 3.6 * k, x1 - 0.8 * k, y1 + 4.6 * k, RED, 1.6 * k); // a red tassel below the head
}

/** A partisan: a broad spear blade with two side lugs, on a short shaft with a red tassel. */
function partisan(ctx: Ctx, x: number, y: number, k: number) {
  const x0 = x - 2 * k, y0 = y + 6 * k, x1 = x + 3 * k, y1 = y - 21 * k;
  line(ctx, x0, y0, x1, y1, WOOD, 1.2 * k);
  line(ctx, x0 - 0.4 * k, y0, x1 - 0.4 * k, y1, shade(WOOD, 0.4), 0.4 * k);
  poly(ctx, [x1 + 1.2 * k, y1 - 8.4 * k, x1 - 1.4 * k, y1 - 1.4 * k, x1 - 3.6 * k, y1 - 1.4 * k, x1 - 1.4 * k, y1 + 0.6 * k, x1 + 1.6 * k, y1 + 1 * k, x1 + 3.4 * k, y1, x1 + 1.8 * k, y1 - 1.4 * k], STEEL);
  poly(ctx, [x1 + 1.2 * k, y1 - 8.4 * k, x1 + 1.8 * k, y1 - 1.4 * k, x1 + 3.4 * k, y1, x1 + 1.6 * k, y1 + 1 * k, x1 + 0.2 * k, y1 - 0.4 * k], STEEL_D);
  line(ctx, x1 + 0.6 * k, y1 - 7.4 * k, x1 + 0.2 * k, y1 - 0.6 * k, STEEL_L, 0.4 * k);
  ellipse(ctx, x1 - 0.2 * k, y1 + 2 * k, 1 * k, 1.3 * k, RED);
}

/** The arquebus: a long iron barrel on a walnut stock, the match cord smouldering in the serpentine. */
function arquebus(ctx: Ctx, x: number, y: number, k: number) {
  // held slanting up across the body: the butt at the shoulder, the muzzle high in front
  const bx = x - 5 * k, by = y + 1 * k, mx = x + 9 * k, my = y - 16 * k;
  const dx = mx - bx, dy = my - by, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const P = (t: number, o: number): [number, number] => [bx + ux * t * k + nx * o * k, by + uy * t * k + ny * o * k];
  const L = len / k;
  // the stock, its butt curving down
  poly(ctx, [...P(-2, 1.6), ...P(9, 0.8), ...P(L * 0.62, 0.6), ...P(L * 0.62, -0.6), ...P(9, -0.6), ...P(0, -1.2), ...P(-2.6, 0)], '#6a3c1c');
  poly(ctx, [...P(-2, 1.6), ...P(9, 0.8), ...P(L * 0.62, 0.6), ...P(L * 0.62, 0.1), ...P(0, 0.6)], '#8a5428');
  // the barrel: dark iron with a bright line, a muzzle ring
  line(ctx, ...P(4, -0.6), ...P(L, -0.6), '#3a3c44', 1.1 * k);
  line(ctx, ...P(4, -0.9), ...P(L, -0.9), '#8a909a', 0.35 * k);
  ellipse(ctx, ...P(L, -0.6), 0.7 * k, 0.7 * k, '#2a2c30');
  for (const t of [L * 0.3, L * 0.5]) line(ctx, ...P(t, -1.4), ...P(t, 0.4), BRONZE, 0.5 * k); // barrel bands
  // the lock: a brass serpentine holding the match, a curl of smoke
  const [sx, sy] = P(8, 1.2);
  line(ctx, sx, sy, sx - 0.6 * k, sy - 2.4 * k, BRONZE, 0.7 * k);
  ellipse(ctx, sx - 0.6 * k, sy - 2.6 * k, 0.5 * k, 0.5 * k, '#ff7a2a');
  curve(ctx, sx - 0.6 * k, sy - 3 * k, sx - 2 * k, sy - 5 * k, sx - 0.6 * k, sy - 7 * k, 0.6 * k, 'rgba(220,220,220,0.6)');
  curve(ctx, sx - 0.4 * k, sy - 2 * k, sx + 2 * k, sy + 2 * k, sx + 0.4 * k, sy + 5 * k, 0.4 * k, '#5a4a3a'); // the hanging match cord
}

function weapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  switch (kind) {
    case 'warrior': partisan(ctx, x, y, k); return true;
    case 'archer': arquebus(ctx, x, y, k); return true;
    case 'defender': pike(ctx, x, y, k, 42); return true; // the rodela is drawn by the shield hook
    case 'swordsman':
      rapier(ctx, x, y, k, 16, true);
      rodela(ctx, kind, b.off.x, b.off.y, k);
      return true;
    case 'giant': // a montante, the great two-handed sword, and the royal shield
      rapier(ctx, x, y, k, 22, true);
      rodela(ctx, kind, b.off.x, b.off.y, k);
      return true;
    case 'explorer': rapier(ctx, x, y, k, 12); return true;
    default: return false;
  }
}

// ---------------------------------------------------------------- horsemen

const HK = 0.95; // drawHorse scale used by the horsemen

/** Gear over drawHorse: a red saddle cloth, a breast collar; a red-and-gold caparison and a steel chamfron when barded. */
function horseGear(ctx: Ctx, x: number, y: number, saddle: { x: number; y: number }, barded: 'none' | 'cloth' | 'plate') {
  const hx0 = x - 1, hy0 = y + 3;
  const sx = saddle.x, sy = saddle.y;
  if (barded === 'none') { // a jinete's short saddle on a red cloth, gold-edged
    poly(ctx, [sx - 5.6, sy - 0.6, sx + 3.6, sy - 0.6, sx + 3.2, sy + 5.4, sx - 5.2, sy + 6.4], RED);
    line(ctx, sx - 5.2, sy + 6.2, sx + 3.2, sy + 5.2, GOLD, 0.8);
  } else {
    const bx = hx0, by = hy0 - 6 * HK, bw = 17 * HK, bh = 7 * HK;
    for (const f of ['L', 'R'] as const) {
      if (barded === 'cloth') { // a red caparison with a gold hem and a white saltire on the flank
        faceQuad(ctx, f, bx, by, bw, bh, 0, 1, -0.3, 0.98, RED);
        faceQuad(ctx, f, bx, by, bw, bh, 0, 1, -0.3, -0.16, GOLD);
        for (let i = 0; i < 8; i++) faceQuad(ctx, f, bx, by, bw, bh, i / 8 + 0.02, i / 8 + 0.08, -0.38, -0.3, GOLD_D); // fringe
      } else { // steel plates: a crupper and a peytral, banded
        faceQuad(ctx, f, bx, by, bw, bh, 0, 1, 0.1, 0.98, STEEL);
        for (const v of [0.34, 0.66]) faceQuad(ctx, f, bx, by, bw, bh, 0, 1, v, v + 0.06, STEEL_D);
        faceQuad(ctx, f, bx, by, bw, bh, 0, 1, 0.1, 0.18, GOLD);
      }
    }
    if (barded === 'cloth') { // the saltire on the near flank
      const fx = bx + bw * 0.25 - 2, fy = by + bw * 0.125 - bh * 0.4;
      line(ctx, fx - 2.4, fy - 2, fx + 2.4, fy + 2.4, WHITE, 1);
      line(ctx, fx + 2.4, fy - 2.2, fx - 2.4, fy + 2.2, WHITE, 1);
    }
    // the chamfron over the horse's face, with a plume
    const hhx = hx0 + 10.5 * HK, hhy = hy0 - 15 * HK;
    faceQuad(ctx, 'R', hhx, hhy, 7 * HK, 5 * HK, 0.08, 0.72, 0.3, 0.98, STEEL);
    faceQuad(ctx, 'R', hhx, hhy, 7 * HK, 5 * HK, 0.36, 0.46, 0.3, 0.98, GOLD);
    for (let i = -1; i <= 1; i++) curve(ctx, hhx + 0.4, hhy - 4.6, hhx + i * 1.2 - 0.6, hhy - 8.6, hhx + i * 1.6 - 2.6, hhy - 10.6, 0.9, i ? RED : GOLD);
  }
  // the breast collar, studded
  line(ctx, x + 3.5, y - 9.6, x + 8, y - 3.4, barded === 'none' ? LEATH : RED_D, 1.2);
  for (let i = 0; i < 3; i++) { const t = (i + 0.5) / 3; ellipse(ctx, x + 3.5 + 4.5 * t, y - 9.6 + 6.2 * t, 0.5, 0.5, GOLD_L); }
}

/** The leg of a rider hanging in the stirrup, booted. */
function boot(ctx: Ctx, sx: number, sy: number, hose: string, long: boolean) {
  const d = long ? 1 : 0.7; // a la brida (long-legged) for the armoured; a la jineta (short) for the light horse
  poly(ctx, [sx + 0.4, sy + 0.4, sx + 4, sy + 0.6, sx + 4.6, sy + 5 * d, sx + 2.2, sy + 5.4 * d], hose);
  poly(ctx, [sx + 2.2, sy + 5.4 * d, sx + 4.6, sy + 5 * d, sx + 4.4, sy + 10 * d, sx + 2.2, sy + 10.2 * d], '#3a2a20');
  poly(ctx, [sx + 2.2, sy + 10 * d, sx + 4.8, sy + 9.8 * d, sx + 6, sy + 11 * d, sx + 2.2, sy + 11.2 * d], '#2a1c14');
  line(ctx, sx + 1.8, sy + 11.4 * d, sx + 5, sy + 11.2 * d, STEEL_D, 0.6); // the stirrup
}

/** A lance with a banner (or a pennon) near the head. */
function lance(ctx: Ctx, x: number, y: number, len: number, look: 'red' | 'cross' | 'pennon') {
  const x0 = x - 3, y0 = y + 8, x1 = x + 5, y1 = y - len;
  line(ctx, x0, y0, x1, y1, '#8a5a30', 1.3);
  line(ctx, x0 - 0.4, y0, x1 - 0.4, y1, '#b8844a', 0.4);
  poly(ctx, [x1 + 0.6, y1 - 5, x1 - 0.8, y1 - 0.4, x1 + 0.2, y1 + 0.8, x1 + 1.4, y1 - 0.2], STEEL_L);
  poly(ctx, [x1 + 0.6, y1 - 5, x1 + 1.4, y1 - 0.2, x1 + 0.2, y1 + 0.8], STEEL_D);
  // the vamplate guarding the hand
  ellipse(ctx, x - 0.4, y + 1, 1.6, 1, STEEL);
  if (look === 'pennon') {
    poly(ctx, [x1 - 0.2, y1 + 2, x1 + 8, y1 + 3.6, x1 + 5, y1 + 4.6, x1 + 8, y1 + 5.8, x1 - 0.6, y1 + 5.2], RED);
    poly(ctx, [x1 - 0.2, y1 + 2, x1 + 8, y1 + 3.6, x1 + 7, y1 + 4, x1 - 0.3, y1 + 3], RED_L);
    return;
  }
  banner(ctx, x1 - 0.2, y1 + 1.6, 10, 7.2, look === 'cross' ? 'cross' : 'red', 0.8);
}

/** An adarga: the jinete's heart-shaped shield of layered hide, two lobes, tooled in red. */
function adarga(ctx: Ctx, x: number, y: number) {
  ellipse(ctx, x - 1.6 + 0.6, y + 0.5, 2.8, 4, '#8a6034');
  ellipse(ctx, x + 1.6 + 0.6, y + 0.5, 2.8, 4, '#8a6034');
  ellipse(ctx, x - 1.6, y, 2.8, 4, BUFF);
  ellipse(ctx, x + 1.6, y, 2.8, 4, shade(BUFF, -0.06));
  poly(ctx, [x - 3.8, y + 1.8, x + 3.8, y + 1.8, x, y + 5.8], shade(BUFF, -0.03));
  ring(ctx, x - 1.6, y, 2.1, 3.1, RED, 0.5);
  ring(ctx, x + 1.6, y, 2.1, 3.1, RED, 0.5);
  ellipse(ctx, x, y + 0.4, 0.9, 0.9, GOLD);
  for (const d of [-1.6, 1.6]) ellipse(ctx, x + d, y - 1.6, 0.4, 0.4, RED_D);
}

/** The jinete: a light horseman on a chestnut, short-stirruped, with a light lance and an adarga. */
function jinete(ctx: Ctx, x: number, y: number) {
  const saddle = drawHorse(ctx, x - 1, y + 3, HK, '#9a5a2c', '#1a120c', undefined, RED);
  horseGear(ctx, x, y, saddle, 'none');
  const b = figure(ctx, 'rider', 'spain', saddle.x, saddle.y, 0.9, true);
  boot(ctx, saddle.x, saddle.y, '#5a3a2a', false);
  adarga(ctx, b.off.x - 1.6, b.off.y - 1.4);
  lance(ctx, b.hand.x, b.hand.y, 28, 'pennon');
}

/** A man-at-arms or the Conquistador: an armoured rider on a barded horse. */
function heavyHorse(ctx: Ctx, kind: 'knight' | 'conquistador', x: number, y: number) {
  const conq = kind === 'conquistador';
  const saddle = drawHorse(ctx, x - 1, y + 3, HK, conq ? '#2a1e1a' : '#e6e2da', conq ? '#0e0a08' : '#c8c4bc', undefined, RED);
  horseGear(ctx, x, y, saddle, conq ? 'cloth' : 'plate');
  const b = figure(ctx, kind, 'spain', saddle.x, saddle.y, 0.9, true);
  boot(ctx, saddle.x, saddle.y, STEEL, true);
  if (conq) {
    // a sword at the hip, the banner of Castile on the lance
    line(ctx, saddle.x - 4, saddle.y + 2, saddle.x - 9, saddle.y + 7, STEEL_D, 1);
    line(ctx, saddle.x - 3.4, saddle.y + 1.2, saddle.x - 4.8, saddle.y + 2.8, GOLD, 1.2);
    rodela(ctx, 'swordsman', b.off.x - 1, b.off.y + 1.5, 0.62);
    lance(ctx, b.hand.x, b.hand.y, 33, 'red');
  } else {
    rodela(ctx, 'swordsman', b.off.x - 1, b.off.y + 1.5, 0.62);
    lance(ctx, b.hand.x, b.hand.y, 32, 'cross');
  }
}

// ---------------------------------------------------------------- the bronze cannon

function cannon(ctx: Ctx, x: number, y: number) {
  // cannonballs piled beside it, a rammer and a powder keg
  for (const [ax, ay, ar] of [[-13, 6, 1.7], [-10.4, 6.6, 1.7], [-11.8, 4.6, 1.6]] as const) {
    ellipse(ctx, x + ax, y + ay, ar, ar, '#2e3036');
    ellipse(ctx, x + ax - 0.5, y + ay - 0.6, ar * 0.4, ar * 0.35, '#6a6e78');
  }
  box(ctx, x + 13, y + 5, 3.6, 4, '#7a5230', '#9a6a40');
  band(ctx, x + 13, y + 5, 3.6, 4, 0.2, 0.32, '#3a2a20');
  band(ctx, x + 13, y + 5, 3.6, 4, 0.7, 0.82, '#3a2a20');
  line(ctx, x - 16, y + 2, x - 4, y - 3, WOOD, 0.8);
  ellipse(ctx, x - 16, y + 2, 1, 0.8, '#5a4a3a');
  // the trail of the carriage running back to the ground
  poly(ctx, [x - 12, y + 3.4, x - 10.6, y + 2, x + 4, y - 4, x + 4.6, y - 2, x - 10.6, y + 4.6], WOOD_D);
  poly(ctx, [x - 12, y + 3.4, x - 10.6, y + 2, x + 4, y - 4, x + 4, y - 3.2, x - 11.4, y + 3], WOOD);
  // the barrel: bronze, tapering to a flared muzzle, with reinforcing rings, dolphins and the royal arms
  const b0: [number, number] = [x - 9, y - 4], b1: [number, number] = [x + 15, y - 12.6];
  const dx = b1[0] - b0[0], dy = b1[1] - b0[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const P = (t: number, o: number): [number, number] => [b0[0] + ux * t + nx * o, b0[1] + uy * t + ny * o];
  poly(ctx, [...P(0, -3.4), ...P(len, -2.2), ...P(len, 2.2), ...P(0, 3.4)], BRONZE);
  poly(ctx, [...P(0, -3.4), ...P(len, -2.2), ...P(len, -0.6), ...P(0, -1)], BRONZE_L);
  poly(ctx, [...P(0, 2), ...P(len, 1.4), ...P(len, 2.2), ...P(0, 3.4)], BRONZE_D);
  for (const t of [0.12, 0.42, 0.7]) line(ctx, ...P(len * t, -3.6 + t * 1.2), ...P(len * t, 3.6 - t * 1.2), shade(BRONZE, -0.3), 1.2);
  ellipse(ctx, ...P(len, 0), 2.6, 2.8, BRONZE_D); // the muzzle
  ellipse(ctx, ...P(len + 0.4, 0), 2.2, 2.4, BRONZE);
  ellipse(ctx, ...P(len + 0.6, 0), 1.2, 1.3, '#1a1410');
  ellipse(ctx, ...P(-1.2, 0), 2.4, 2.4, BRONZE_D); // the cascabel knob
  ellipse(ctx, ...P(-2.4, 0), 1.2, 1.2, BRONZE);
  const [ax, ay] = P(len * 0.26, -2.8); // the dolphins (lifting handles)
  curve(ctx, ax - 1.4, ay + 0.6, ax, ay - 2.4, ax + 1.6, ay + 0.4, 0.9, BRONZE_L);
  const [cx, cy] = P(len * 0.56, -0.6);
  castle(ctx, cx, cy, 0.9, '#f0d080');
  // the carriage cheeks and two great spoked wheels
  poly(ctx, [x - 6, y - 1, x + 6, y - 7, x + 7, y - 3, x - 5, y + 2.4], WOOD);
  poly(ctx, [x - 6, y - 1, x + 6, y - 7, x + 6.2, y - 5.8, x - 5.8, y + 0.2], shade(WOOD, 0.25));
  for (const d of [-1, 1]) line(ctx, x - 4 + d * 3, y - 2 - d * 1.4, x - 4 + d * 3, y + 0.6 - d * 1.4, '#2a2a30', 0.7); // iron straps
  const wheel = (wx: number, wy: number, r: number) => {
    ellipse(ctx, wx + 0.6, wy + 0.4, r * 0.62, r, '#2a1c10');
    ellipse(ctx, wx, wy, r * 0.62, r, '#3a3036'); // iron tyre
    ellipse(ctx, wx, wy, r * 0.5, r * 0.84, WOOD);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI; line(ctx, wx - Math.cos(a) * r * 0.48, wy - Math.sin(a) * r * 0.82, wx + Math.cos(a) * r * 0.48, wy + Math.sin(a) * r * 0.82, WOOD_D, 0.7); }
    ellipse(ctx, wx, wy, r * 0.16, r * 0.24, RED);
  };
  wheel(x + 1, y + 1.4, 6);
  // a gunner in a cabasset with the linstock
  const g = figure(ctx, 'warrior', 'spain', x - 15, y + 1, 0.56);
  line(ctx, g.hand.x - 1, g.hand.y + 4, g.hand.x + 3, g.hand.y - 7, WOOD, 0.7);
  ellipse(ctx, g.hand.x + 3.2, g.hand.y - 7.4, 0.6, 0.6, '#ff7a2a');
  curve(ctx, g.hand.x + 3.2, g.hand.y - 8, g.hand.x + 1.6, g.hand.y - 10.6, g.hand.x + 3.2, g.hand.y - 13, 0.6, 'rgba(220,220,220,0.6)');
  // a small red-and-gold flag on a staff by the keg
  line(ctx, x + 15, y + 4, x + 15, y - 16, WOOD_D, 0.8);
  banner(ctx, x + 15, y - 16, 7, 5, 'red', 0.4);
}

// ---------------------------------------------------------------- ships

function foam(ctx: Ctx, x: number, y: number, w: number) {
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y, w, 2.2, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.stroke();
}

/** A square sail on a yard, bellied by the wind: canvas with a red saltire (or plain). */
function squareSail(ctx: Ctx, mx: number, yTop: number, w: number, h: number, cross: boolean) {
  const l = mx - w / 2, r = mx + w / 2, b = yTop + h;
  line(ctx, l - 1.4, yTop - 0.4, r + 1.4, yTop + 0.4, WOOD_D, 1); // the yard
  const pts = [l, yTop, r, yTop + 0.4, r + 1.4, b - h * 0.45, r + 0.4, b, mx, b + 1.8, l - 0.4, b - 0.2, l - 1.4, b - h * 0.45];
  poly(ctx, pts, '#f2ead6');
  poly(ctx, [mx, yTop + 0.2, r, yTop + 0.4, r + 1.4, b - h * 0.45, r + 0.4, b, mx, b + 1.8], '#dcd2ba');
  if (cross) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath();
    ctx.clip();
    saltire(ctx, mx, yTop + h * 0.52, Math.min(w, h) * 0.42, RED, 0.28);
    ctx.restore();
  }
  for (const t of [0.2, 0.8]) line(ctx, l + t * w, yTop + 1, l + t * w + (t - 0.5) * 2, b, 'rgba(0,0,0,0.1)', 0.5);
}

/** A lateen sail: a triangle hung from a long slanting yard. */
function lateen(ctx: Ctx, mx: number, my: number, h: number, span: number, cross: boolean) {
  const ya: [number, number] = [mx - span * 0.55, my + h * 0.15], yb: [number, number] = [mx + span * 0.5, my - h * 0.9];
  line(ctx, ya[0], ya[1], yb[0], yb[1], WOOD_D, 0.9);
  const foot: [number, number] = [mx + span * 0.42, my + h * 0.02];
  const pts = [ya[0] + 0.6, ya[1] - 0.2, yb[0] - 0.4, yb[1] + 0.6, foot[0] + 1.6, foot[1] - 0.8];
  poly(ctx, pts, '#f2ead6');
  poly(ctx, [mx, my - h * 0.4, yb[0] - 0.4, yb[1] + 0.6, foot[0] + 1.6, foot[1] - 0.8], '#ddd3bc');
  if (cross) { // a red cross on the canvas
    const cx = mx + span * 0.08, cy = my - h * 0.32, s = h * 0.13;
    line(ctx, cx - s, cy - s, cx + s, cy + s, RED, s * 0.5);
    line(ctx, cx + s, cy - s, cx - s, cy + s, RED, s * 0.5);
  }
}

/** A curved hull seen side-on with painted strakes; `top(t)` is the gunwale height along it (t from -1 stern to 1 bow). */
function hull(ctx: Ctx, x: number, y: number, w: number, top: (t: number) => number, paint: boolean) {
  const near: [number, number][] = [];
  for (let i = 0; i <= 12; i++) { const t = -1 + i / 6; near.push([x + t * w, top(t)]); }
  const far = near.map(([a, b], i) => [a + (i === 0 ? 1.8 : i === 12 ? -1.8 : 0), b - 2] as [number, number]);
  poly(ctx, [...near.flat(), ...[...far].reverse().flat()], '#3a2414');
  const keel = [...near, [x + w * 0.86, y - 0.6], [x + w * 0.5, y + 2.6], [x, y + 3.2], [x - w * 0.5, y + 2.8], [x - w * 0.96, y - 0.4]] as [number, number][];
  return { near, keel, draw: () => {
    poly(ctx, keel.flat(), '#4a2a16');
    poly(ctx, [...near.flat(), x + w * 0.9, y - 2.6, x, y - 2, x - w * 0.9, y - 2.4], '#7a4a26');
    line(ctx, x - w * 0.94, y - 0.6, x + w * 0.86, y - 0.8, '#2a1a0e', 0.7); // the waterline wale
    if (paint) { // painted strakes in red and gold, as on the galleons of the Indies fleets
      ctx.strokeStyle = ink(RED);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      near.forEach(([a, b], i) => (i ? ctx.lineTo(a, b + 1.2) : ctx.moveTo(a, b + 1.2)));
      ctx.stroke();
      ctx.strokeStyle = ink(GOLD);
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      near.forEach(([a, b], i) => (i ? ctx.lineTo(a, b + 2.4) : ctx.moveTo(a, b + 2.4)));
      ctx.stroke();
    }
  } };
}

/** A castle on the deck (forecastle or sterncastle): a timber box with a rail and a painted band. */
function deckCastle(ctx: Ctx, x: number, y: number, w: number, h: number, windows: boolean) {
  box(ctx, x, y, w, h, '#7a4a26', '#9a6a40');
  band(ctx, x, y, w, h, 0.62, 0.78, RED);
  band(ctx, x, y, w, h, 0.78, 0.84, GOLD);
  if (windows) for (const u of [0.25, 0.6]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.14, 0.24, 0.48, '#f0c860'); // lit stern windows
  for (let i = 0; i < 5; i++) faceQuad(ctx, 'L', x, y - h, w, 1.6, i / 5 + 0.04, i / 5 + 0.1, 0, 1, '#5a3418'); // the rail
}

/** The caravel: a small hull, two masts of lateen sails and a little stern deck. */
function caravel(ctx: Ctx, x: number, y: number) {
  const w = 17;
  const top = (t: number) => y - 4.2 - (t < 0 ? Math.pow(-t, 2) * 4.6 : Math.pow(t, 3) * 3.4);
  const h = hull(ctx, x, y, w, top, false);
  line(ctx, x + 2, y - 4, x + 2, y - 27, WOOD_D, 1.1);
  line(ctx, x - 7, y - 4, x - 7, y - 20, WOOD_D, 0.9);
  lateen(ctx, x - 7, y - 10, 10, 11, false);
  lateen(ctx, x + 2, y - 13, 14, 16, true);
  figure(ctx, 'warrior', 'spain', x + 7, y - 4.4, 0.4, true);
  h.draw();
  deckCastle(ctx, x - w * 0.78, y - 4.6, 6, 3, false);
  // a little bowsprit and a pennant at the masthead
  line(ctx, x + w * 0.9, top(0.9) + 0.6, x + w + 5, top(1) - 3, WOOD_D, 0.8);
  poly(ctx, [x + 2, y - 27, x + 8, y - 26, x + 2, y - 24.8], RED);
  line(ctx, x - w + 1.4, top(-1) + 1.4, x - w - 1.4, y + 4.4, WOOD, 1); // the rudder
  foam(ctx, x, y + 3.2, w * 0.86);
}

/** The carrack (nao): a round-bellied hull, a high forecastle and sterncastle, two square sails and a lateen mizzen. */
function carrack(ctx: Ctx, x: number, y: number) {
  const w = 21;
  const top = (t: number) => y - 4.8 - (t < 0 ? Math.pow(-t, 2) * 5 : Math.pow(t, 2.4) * 4.4);
  const h = hull(ctx, x, y, w, top, true);
  // masts and rigging
  line(ctx, x + 2, y - 5, x + 2, y - 36, WOOD_D, 1.2);
  line(ctx, x + 12, y - 6, x + 12.6, y - 26, WOOD_D, 1);
  line(ctx, x - 10, y - 6, x - 10, y - 24, WOOD_D, 0.9);
  for (const [a, b] of [[x - 18, y - 6], [x + 20, y - 7]] as const) line(ctx, a, b, x + 2, y - 35, 'rgba(60,40,24,0.55)', 0.4);
  lateen(ctx, x - 10, y - 12, 10, 10, false);
  squareSail(ctx, x + 2, y - 33, 15, 9, false);
  squareSail(ctx, x + 2, y - 22.6, 18, 11, true);
  squareSail(ctx, x + 12.3, y - 23, 9, 9, false);
  ellipse(ctx, x + 2, y - 36.6, 2, 0.9, '#5a3418'); // the crow's nest
  poly(ctx, [x + 2, y - 37, x + 10, y - 35.8, x + 2, y - 34.6], RED);
  h.draw();
  deckCastle(ctx, x - w * 0.72, y - 5.2, 9, 5.4, true); // the sterncastle
  deckCastle(ctx, x + w * 0.72, y - 5.6, 7, 4.4, false); // the forecastle
  figure(ctx, 'archer', 'spain', x - w * 0.72, y - 10.8, 0.36, true);
  line(ctx, x + w * 0.9, top(0.9) - 3, x + w + 6, top(1) - 8, WOOD_D, 0.9); // bowsprit
  line(ctx, x - w + 1.4, top(-1) + 1.4, x - w - 1.4, y + 4.4, WOOD, 1.1);
  foam(ctx, x, y + 3.2, w * 0.86);
}

/** The galleon: long and tall, a towering sterncastle with a gallery and lanterns, a beak-head, gunports, three masts of square sails. */
function galleon(ctx: Ctx, x: number, y: number) {
  const w = 27;
  const top = (t: number) => y - 5.4 - (t < 0 ? Math.pow(-t, 2.4) * 6 : Math.pow(t, 3) * 2.6);
  const h = hull(ctx, x, y, w, top, true);
  // masts: main, fore and mizzen; stays to the bowsprit
  line(ctx, x + 1, y - 5, x + 1, y - 46, WOOD_D, 1.4);
  line(ctx, x + 14, y - 6, x + 14.4, y - 36, WOOD_D, 1.1);
  line(ctx, x - 13, y - 7, x - 13, y - 32, WOOD_D, 1);
  for (const [a, b, c, d] of [[x - 26, y - 8, x + 1, y - 45], [x + 30, y - 9, x + 14.4, y - 35], [x + 30, y - 9, x + 1, y - 45]] as const) line(ctx, a, b, c, d, 'rgba(60,40,24,0.55)', 0.4);
  lateen(ctx, x - 13, y - 17, 12, 12, false);
  squareSail(ctx, x + 1, y - 43, 15, 9, false);
  squareSail(ctx, x + 1, y - 31.6, 21, 14, true);
  squareSail(ctx, x + 14.2, y - 33, 11, 7.4, false);
  squareSail(ctx, x + 14, y - 24, 14, 10, true);
  ellipse(ctx, x + 1, y - 34.4, 2.4, 1, '#5a3418'); // the tops
  ellipse(ctx, x + 14.2, y - 25.4, 2, 0.9, '#5a3418');
  // the royal standard at the main and long red streamers
  line(ctx, x + 1, y - 46, x + 1, y - 51, WOOD_D, 0.8);
  banner(ctx, x + 1, y - 51, 9, 6, 'cross', 0.6);
  poly(ctx, [x + 14.4, y - 36, x + 26, y - 35, x + 14.4, y - 34.4], RED);
  poly(ctx, [x - 13, y - 32, x - 4, y - 31.2, x - 13, y - 30.6], GOLD);
  h.draw();
  // gunports along the side, with the muzzles out
  for (let i = 0; i < 6; i++) {
    const t = -0.5 + i * 0.2, px = x + t * w, py = top(t) + 3.8;
    poly(ctx, [px - 1.2, py - 1, px + 1.2, py - 1, px + 1.2, py + 1, px - 1.2, py + 1], '#1a100a');
    poly(ctx, [px - 1.2, py - 1.6, px + 1.2, py - 1.6, px + 1.2, py - 1, px - 1.2, py - 1], RED);
    line(ctx, px + 0.2, py, px + 1.6, py + 0.8, '#3a3a40', 1);
  }
  // the towering sterncastle: two stepped decks, a gallery, lanterns
  deckCastle(ctx, x - w * 0.7, y - 6.4, 12, 7, true);
  deckCastle(ctx, x - w * 0.8, y - 13.4, 8, 4.4, true);
  for (const d of [-1, 1]) { // stern lanterns
    const lx = x - w * 0.8 + d * 3.4, ly = y - 20.4;
    line(ctx, lx, ly + 2.4, lx, ly + 0.8, '#3a2a20', 0.5);
    ellipse(ctx, lx, ly, 1, 1.4, '#ffd060');
    ellipse(ctx, lx, ly - 1.4, 0.8, 0.4, GOLD_D);
  }
  deckCastle(ctx, x + w * 0.66, y - 5.8, 7, 3.8, false); // the forecastle
  figure(ctx, 'swordsman', 'spain', x - w * 0.8, y - 17.8, 0.34, true);
  figure(ctx, 'archer', 'spain', x + w * 0.66, y - 9.6, 0.34, true);
  // the beak-head and bowsprit
  poly(ctx, [x + w * 0.9, top(0.9) + 1, x + w + 5, top(1) + 1.6, x + w + 4.6, top(1) + 3, x + w * 0.88, top(0.88) + 4], '#7a4a26');
  line(ctx, x + w * 0.9, top(0.9) - 2, x + w + 8, top(1) - 9, WOOD_D, 1);
  line(ctx, x - w + 1.4, top(-1) + 2, x - w - 1.6, y + 4.6, WOOD, 1.2);
  foam(ctx, x, y + 3.2, w * 0.88);
}

function ship(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  if (kind === 'boat') caravel(ctx, x, y);
  else if (kind === 'ship') carrack(ctx, x, y);
  else galleon(ctx, x, y);
}

// ---------------------------------------------------------------- buildings

/** A red pantile roof over a box: the hipped roof with rows of tiles drawn across it. */
function tileRoof(ctx: Ctx, x: number, y: number, w: number, h: number, roofC: string) {
  roof(ctx, x, y, w, h, roofC);
  const hw = w / 2, hh = w / 4;
  for (let i = 1; i < 4; i++) { // tile courses on both faces
    const t = i / 4;
    line(ctx, x - hw + hw * t, y - h * t + 0.0, x + 0 * t, y + hh - (hh + h) * t, shade(roofC, -0.2), 0.4);
    line(ctx, x + hw - hw * t, y - h * t, x, y + hh - (hh + h) * t, shade(roofC, -0.4), 0.4);
  }
  for (let i = 1; i < 5; i++) { // the rows of curved tiles running down the slope
    const t = i / 5;
    line(ctx, x - hw * t, y + hh * t, x, y - h, shade(roofC, 0.18), 0.3);
    line(ctx, x + hw * t, y + hh * t, x, y - h, shade(roofC, -0.32), 0.3);
  }
}

/** An arched opening on one face of a box (a door, a window or an arcade bay). */
function arch(ctx: Ctx, f: 'L' | 'R', cx: number, cy: number, w: number, h: number, u: number, du: number, v0: number, v1: number, c: string) {
  faceQuad(ctx, f, cx, cy, w, h, u, u + du, v0, v1, c);
  const P = (uu: number, v: number): [number, number] => f === 'R'
    ? [cx + (uu * w) / 2, cy + (w / 4) * (1 - uu) - v * h]
    : [cx - w / 2 + (uu * w) / 2, cy + (w / 4) * uu - v * h];
  const [ax, ay] = P(u + du / 2, v1);
  const r = (du * w) / 4;
  ctx.beginPath();
  ctx.ellipse(ax, ay, r, r * 1.1, f === 'R' ? -0.46 : 0.46, Math.PI, Math.PI * 2);
  ctx.fillStyle = ink(f === 'R' ? shade(c, -0.2) : shade(c, 0.06));
  ctx.fill();
}

/** A wrought-iron grille (reja) over a window on the R face. */
function reja(ctx: Ctx, cx: number, cy: number, w: number, h: number, u: number, v: number) {
  faceQuad(ctx, 'R', cx, cy, w, h, u, u + 0.16, v, v + 0.2, '#3a2c24');
  for (const du of [0.04, 0.08, 0.12]) faceQuad(ctx, 'R', cx, cy, w, h, u + du, u + du + 0.015, v - 0.02, v + 0.22, '#1a1414');
}

/** A whitewashed Andalusian house: red tiles, an ochre plinth, a grilled window, an arched door, a balcony or an arcade. */
function house(ctx: Ctx, x: number, y: number, w: number, h: number, roofC: string, extra: 'balcony' | 'arcade' | 'pots' | 'none') {
  box(ctx, x, y, w, h, WASH, '#ebe4d6');
  band(ctx, x, y, w, h, 0, 0.12, OCHRE); // the painted plinth
  band(ctx, x, y, w, h, 0.94, 1, '#e4dccb');
  if (extra === 'arcade') { // an arcaded ground floor
    for (const u of [0.08, 0.4, 0.72]) arch(ctx, 'R', x, y, w, h, u, 0.2, 0.0, 0.32, '#5a4636');
    for (const u of [0.12, 0.56]) arch(ctx, 'L', x, y, w, h, u, 0.22, 0.0, 0.32, '#6a5646');
  } else {
    arch(ctx, 'R', x, y, w, h, 0.36, 0.22, 0.0, 0.42, '#6a3a1e'); // the door
    faceQuad(ctx, 'R', x, y, w, h, 0.46, 0.48, 0.0, 0.42, '#4a2814');
    reja(ctx, x, y, w, h, 0.72, 0.36);
    reja(ctx, x, y, w, h, 0.08, 0.36);
  }
  faceQuad(ctx, 'L', x, y, w, h, 0.32, 0.46, 0.56, 0.78, '#3a2c24'); // an upper window on the side
  if (extra === 'balcony') { // a timber balcony under a shuttered door upstairs, with red geraniums
    faceQuad(ctx, 'R', x, y, w, h, 0.3, 0.6, 0.58, 0.88, '#2a6a4a');
    faceQuad(ctx, 'R', x, y, w, h, 0.43, 0.47, 0.58, 0.88, '#1a4a32');
    const P = (u: number, v: number): [number, number] => [x + (u * w) / 2, y + (w / 4) * (1 - u) - v * h];
    const [ax, ay] = P(0.22, 0.56), [bx, by] = P(0.7, 0.56);
    poly(ctx, [ax, ay, bx, by, bx + 1.6, by + 1, ax + 1.6, ay + 1], '#5a3418');
    line(ctx, ax + 0.8, ay - 2.6, bx + 0.8, by - 2.6, '#2a1a10', 0.6);
    for (let i = 0; i <= 5; i++) { const t = i / 5; line(ctx, ax + 0.8 + (bx - ax) * t, ay + 0.4 + (by - ay) * t, ax + 0.8 + (bx - ax) * t, ay - 2.6 + (by - ay) * t, '#2a1a10', 0.35); }
    for (const t of [0.2, 0.7]) { const px = ax + (bx - ax) * t + 0.8, py = ay + (by - ay) * t - 2.8; ellipse(ctx, px, py, 1, 0.8, '#3a8a3a'); ellipse(ctx, px, py - 0.4, 0.5, 0.5, RED_L); }
  }
  if (extra === 'pots') for (const [u, v] of [[0.08, 0.66], [0.78, 0.66]] as const) { // flowerpots hung on the wall, Córdoba-style
    const P: [number, number] = [x + (u * w) / 2, y + (w / 4) * (1 - u) - v * h];
    ellipse(ctx, P[0] + 0.8, P[1], 0.8, 0.6, '#3a7aa8');
    ellipse(ctx, P[0] + 0.8, P[1] - 0.8, 0.9, 0.6, '#3a8a3a');
    ellipse(ctx, P[0] + 0.8, P[1] - 1, 0.45, 0.45, RED_L);
  }
  tileRoof(ctx, x, y - h, w + 1.6, w * 0.32, roofC);
  if (extra === 'none') { // a chimney
    box(ctx, x + w * 0.16, y - h - w * 0.12, 1.6, 3, WASH);
    box(ctx, x + w * 0.16, y - h - w * 0.12 - 3, 2.2, 0.8, roofC);
  }
}

/** A square tower with crenellations: stone, a slit or an arched window, merlons on top. */
function tower(ctx: Ctx, x: number, y: number, w: number, h: number, stone: string, win: boolean) {
  box(ctx, x, y, w, h, stone);
  band(ctx, x, y, w, h, 0.9, 0.94, shade(stone, -0.2));
  if (win) { arch(ctx, 'R', x, y, w, h, 0.4, 0.2, 0.55, 0.72, '#2a2024'); arch(ctx, 'L', x, y, w, h, 0.4, 0.2, 0.6, 0.74, '#3a3034'); }
  for (const u of [0.08, 0.5]) faceQuad(ctx, 'R', x, y, w, h, u + 0.15, u + 0.2, 0.3, 0.44, '#3a3034');
  // merlons round the top
  const hw = w / 2, hh = w / 4;
  for (let i = 0; i < 4; i++) {
    const t = (i + 0.5) / 4;
    box(ctx, x - hw + hw * t, y - h + hh * t + 0.2, w * 0.16, 1.8, stone);
    box(ctx, x + hw * t, y - h + hh * (1 - t) + 0.2, w * 0.16, 1.8, stone);
  }
}

/** A Castilian parish church: a nave with a red roof, an arched portal and a square bell tower with a tiled spire. */
function church(ctx: Ctx, x: number, y: number, roofC: string) {
  const stone = '#e6d6b4';
  box(ctx, x - 2, y, 14, 9, stone, '#efe2c6');
  arch(ctx, 'R', x - 2, y, 14, 9, 0.38, 0.2, 0, 0.5, '#4a3020');
  ellipse(ctx, x - 2 + 14 * 0.24, y + 14 * 0.125 - 9 * 0.8, 1.3, 1.4, '#6a3a3a'); // the rose window
  ring(ctx, x - 2 + 14 * 0.24, y + 14 * 0.125 - 9 * 0.8, 1.3, 1.4, '#b89a6a', 0.4);
  tileRoof(ctx, x - 2, y - 9, 15.4, 5, roofC);
  // the bell tower at the back corner
  const tx = x + 5, ty = y - 3;
  box(ctx, tx, ty, 6, 16, stone);
  for (const f of ['L', 'R'] as const) { arch(ctx, f, tx, ty, 6, 16, 0.3, 0.4, 0.62, 0.84, '#2a2024'); }
  ellipse(ctx, tx + 1.6, ty - 11, 0.9, 1.2, BRONZE); // a bell in the opening
  band(ctx, tx, ty, 6, 16, 0.94, 1, shade(stone, 0.1));
  tileRoof(ctx, tx, ty - 16, 7, 6, roofC);
  ellipse(ctx, tx, ty - 22.4, 0.7, 0.7, GOLD);
  line(ctx, tx, ty - 23, tx, ty - 25.4, '#3a3034', 0.5);
  // a stork's nest on the tower, a Castilian sight
  ellipse(ctx, tx - 1.6, ty - 21, 1.6, 0.7, '#6a4a2a');
  ellipse(ctx, tx - 1.6, ty - 22, 0.6, 0.9, WHITE);
}

/** The capital: an alcázar of crenellated towers round a keep, with the red-and-gold banner, beside a cathedral bell tower. */
function alcazar(ctx: Ctx, x: number, y: number, roofC: string) {
  const stone = '#d8c49a', stoneL = '#e8d8b2';
  ellipse(ctx, x, y + 6, 26, 7, 'rgba(0,0,0,0.14)');
  // the rocky outcrop it stands on
  poly(ctx, [x - 22, y + 6, x - 14, y - 2, x + 10, y - 4, x + 22, y + 4, x + 12, y + 10, x - 10, y + 10], '#a89070');
  poly(ctx, [x - 22, y + 6, x - 14, y - 2, x - 2, y - 3, x - 4, y + 8, x - 10, y + 10], '#bca484');
  // the cathedral bell tower behind, to the right: a tall square shaft, a belfry and a lantern spire
  const bx = x + 12, by = y - 6;
  box(ctx, bx, by, 7, 26, '#e2c89a');
  for (let i = 0; i < 4; i++) for (const f of ['L', 'R'] as const) faceQuad(ctx, f, bx, by, 7, 26, 0.38, 0.62, 0.12 + i * 0.16, 0.2 + i * 0.16, '#6a4a3a'); // the windows up the shaft
  for (const f of ['L', 'R'] as const) { faceQuad(ctx, f, bx, by, 7, 26, 0.1, 0.9, 0.04, 0.08, '#c8a87a'); faceQuad(ctx, f, bx, by, 7, 26, 0.2, 0.3, 0.1, 0.94, '#d4b88a'); }
  const by2 = by - 26;
  box(ctx, bx, by2, 6, 6, WASH);
  for (const f of ['L', 'R'] as const) arch(ctx, f, bx, by2, 6, 6, 0.25, 0.5, 0.15, 0.7, '#2a2024');
  ellipse(ctx, bx + 1.4, by2 - 2.6, 0.9, 1.1, BRONZE);
  box(ctx, bx, by2 - 6, 4.4, 4, WASH);
  ellipse(ctx, bx, by2 - 10.6, 2.2, 3, '#e8d8b2');
  line(ctx, bx, by2 - 13.4, bx, by2 - 17, GOLD_D, 0.7);
  ellipse(ctx, bx, by2 - 17.4, 1.1, 1.1, GOLD); // the weathervane figure, a gilt globe
  // the curtain wall
  box(ctx, x - 2, y + 2, 26, 6, stone, stoneL);
  for (const f of ['L', 'R'] as const) for (let i = 0; i < 9; i++) faceQuad(ctx, f, x - 2, y - 4, 26, 1.6, i / 9 + 0.02, i / 9 + 0.07, 0, 1, stone);
  arch(ctx, 'R', x - 2, y + 2, 26, 6, 0.3, 0.12, 0, 0.7, '#3a2a20'); // the gate
  // the keep with its turrets (the Torre del Homenaje)
  tower(ctx, x - 3, y - 3, 10, 15, stoneL, true);
  for (const [dx, dy] of [[-5, -18], [2, -21], [2, -16], [-5, -14]] as const) { // bartizans on the keep's corners
    box(ctx, x - 3 + dx * 0.6 + 1, y + dy + 0.4, 2.6, 3.6, stoneL);
    roof(ctx, x - 3 + dx * 0.6 + 1, y + dy - 3.2, 3, 3.6, '#4a5a6a'); // a slate cap, as at Segovia
  }
  // corner towers on the wall, round and square
  tower(ctx, x - 15, y + 5, 6, 10, stone, false);
  tower(ctx, x + 11, y + 5, 6, 10, stone, false);
  tower(ctx, x - 2, y + 9.4, 5, 7, stone, false);
  // the banner of Castile on the keep
  line(ctx, x - 3, y - 20, x - 3, y - 34, WOOD_D, 0.8);
  banner(ctx, x - 3, y - 34, 10, 7, 'red', 0.8);
  void roofC;
}

function building(ctx: Ctx, x: number, y: number, big: boolean, roofC: string, capital: boolean) {
  if (big && capital) {
    ctx.save();
    ctx.translate(x, y + 2);
    ctx.scale(0.8, 0.8);
    alcazar(ctx, 0, 0, roofC);
    ctx.restore();
    return;
  }
  if (big) { church(ctx, x, y, roofC); return; }
  const v = ((Math.round(x) * 7 + Math.round(y) * 3) % 4 + 4) % 4;
  if (v === 0) house(ctx, x, y, 11, 9, roofC, 'balcony');
  else if (v === 1) house(ctx, x, y, 11, 7, roofC, 'arcade');
  else if (v === 2) { house(ctx, x - 2, y - 1, 8, 6, roofC, 'none'); house(ctx, x + 4, y + 2.4, 7, 6, roofC, 'pots'); }
  else house(ctx, x, y, 12, 9, roofC, 'pots');
}

// ---------------------------------------------------------------- trees

/** Clumps of foliage: a darker underside, the clump, and a highlight. */
function clumps(ctx: Ctx, x: number, y: number, k: number, g: string, list: readonly (readonly [number, number, number, number, number])[]) {
  for (const [dx, dy, rx, ry, c] of list) {
    ellipse(ctx, x + dx * k, y + (dy + 1) * k, rx * k, ry * k, shade(g, c - 0.22));
    ellipse(ctx, x + dx * k, y + dy * k, rx * k, ry * k, shade(g, c));
    ellipse(ctx, x + (dx - rx * 0.3) * k, y + (dy - ry * 0.32) * k, rx * 0.5 * k, ry * 0.36 * k, shade(g, c + 0.18));
  }
}

function tree(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  const type = ['holm', 'olive', 'orange', 'olive', 'holm', 'cypress', 'orange', 'olive', 'holm'][variant % 9];
  if (type === 'holm') {
    // the holm oak (encina) of the dehesa: a short stout trunk, a broad low dome of dark grey-green, acorns
    const bk = '#5a4636', g = mix(P.forest, '#3a5232', 0.55);
    line(ctx, x, y, x, y - 7 * k, shade(bk, -0.2), 3 * k);
    line(ctx, x - 0.7 * k, y, x - 0.7 * k, y - 7 * k, bk, 1.2 * k);
    curve(ctx, x, y - 6 * k, x - 3 * k, y - 8 * k, x - 6 * k, y - 9.6 * k, 1.3 * k, bk);
    curve(ctx, x, y - 6 * k, x + 3 * k, y - 8 * k, x + 6 * k, y - 10 * k, 1.3 * k, bk);
    clumps(ctx, x, y, k, g, [[-6.4, -11, 4.4, 3.2, -0.12], [6.4, -11.4, 4.4, 3.2, -0.16], [0, -12.6, 6.6, 3.8, -0.04], [-3, -15, 4.6, 2.8, 0.06], [3.4, -15, 4.2, 2.6, 0.04], [0, -17, 3.6, 2.2, 0.12]]);
    for (let i = 0; i < 8; i++) { const a = rand(variant + 2, i) * Math.PI * 2, r = 2 + rand(variant + 5, i) * 6; ellipse(ctx, x + Math.cos(a) * r * k, y - 13 * k + Math.sin(a) * r * 0.45 * k, 0.4 * k, 0.5 * k, '#8a6a3a'); }
    return;
  }
  if (type === 'olive') {
    // an old olive: a gnarled, split and hollow trunk and a silvery grey-green crown with black olives
    const bk = '#7a6a58', g = mix(P.forest, '#9aa676', 0.7);
    curve(ctx, x - 1.6 * k, y, x - 2.8 * k, y - 4 * k, x - 0.8 * k, y - 8 * k, 2.2 * k, shade(bk, -0.25));
    curve(ctx, x + 1.4 * k, y, x + 2.8 * k, y - 4.4 * k, x + 0.8 * k, y - 8.4 * k, 2 * k, bk);
    ellipse(ctx, x, y - 2.4 * k, 0.8 * k, 1.6 * k, '#3a2e24');
    curve(ctx, x - 0.6 * k, y - 7 * k, x - 3.4 * k, y - 9 * k, x - 5 * k, y - 10.6 * k, 1 * k, bk);
    curve(ctx, x + 0.6 * k, y - 7 * k, x + 3.4 * k, y - 9 * k, x + 4.8 * k, y - 11.4 * k, 1 * k, bk);
    clumps(ctx, x, y, k, g, [[-4.8, -11, 3.8, 2.6, -0.1], [4.6, -11.6, 3.8, 2.6, -0.14], [0, -13.4, 4.8, 3.2, 0], [-2.2, -15.6, 3.2, 2.2, 0.08], [2.6, -15.4, 2.8, 2, 0.06]]);
    for (let i = 0; i < 14; i++) { const a = rand(variant + 4, i) * Math.PI * 2, r = 1.5 + rand(variant + 8, i) * 5.4; ellipse(ctx, x + Math.cos(a) * r * k, y - 13 * k + Math.sin(a) * r * 0.55 * k, 0.5 * k, 0.4 * k, i % 3 ? '#2a2630' : '#d4dcbc'); }
    // the tilled ring of earth round its foot
    ctx.strokeStyle = ink('#8a6a4a');
    ctx.lineWidth = 0.6 * k;
    ctx.beginPath();
    ctx.ellipse(x, y + 0.4 * k, 4.6 * k, 1.6 * k, 0, 0, Math.PI);
    ctx.stroke();
    return;
  }
  if (type === 'orange') {
    // a Seville orange: a slim trunk, whitewashed at the foot, a round glossy dark crown hung with oranges
    const bk = '#6a4a32', g = mix(P.forest, '#1e6a2a', 0.6);
    line(ctx, x, y, x, y - 7 * k, bk, 1.6 * k);
    line(ctx, x, y, x, y - 2.4 * k, WASH, 1.8 * k);
    clumps(ctx, x, y, k, g, [[-3.4, -10, 3.6, 3, -0.1], [3.4, -10.4, 3.6, 3, -0.14], [0, -12.4, 5, 4, 0], [-1.4, -15, 3.2, 2.4, 0.1], [1.8, -14.6, 3, 2.4, 0.08]]);
    for (let i = 0; i < 9; i++) {
      const a = rand(variant + 3, i) * Math.PI * 2, r = 1.4 + rand(variant + 9, i) * 4.2;
      const ox = x + Math.cos(a) * r * k, oy = y - 12 * k + Math.sin(a) * r * 0.7 * k;
      ellipse(ctx, ox, oy, 0.9 * k, 0.9 * k, '#f08a1a');
      ellipse(ctx, ox - 0.3 * k, oy - 0.3 * k, 0.35 * k, 0.35 * k, '#ffc060');
    }
    for (const [dx, dy] of [[2.6, 0.8], [-3, 1.2]] as const) ellipse(ctx, x + dx * k, y + dy * k, 0.7 * k, 0.6 * k, '#e07a12'); // windfalls
    return;
  }
  // a cypress: a tall dark flame
  const g = mix(P.forest, '#24482c', 0.6);
  line(ctx, x, y, x, y - 3 * k, '#5a4030', 1.4 * k);
  poly(ctx, [x, y - 25 * k, x + 2.8 * k, y - 15 * k, x + 3.2 * k, y - 6 * k, x, y - 2 * k, x - 3 * k, y - 6 * k, x - 2.6 * k, y - 15 * k], shade(g, -0.06));
  poly(ctx, [x, y - 25 * k, x - 2.6 * k, y - 15 * k, x - 3 * k, y - 6 * k, x, y - 2 * k, x - 0.6 * k, y - 14 * k], shade(g, 0.12));
  for (let i = 0; i < 8; i++) { const py = y - (5 + i * 2.5) * k, r = 2.4 * (1 - i / 10); line(ctx, x - r * k, py, x + r * 0.4 * k, py - 0.8 * k, shade(g, 0.24), 0.5 * k); }
}

// ---------------------------------------------------------------- whole units

/** The arquebusier: a forked musket rest and a powder horn slung behind, then the man and his long gun. */
function arquebusier(ctx: Ctx, x: number, y: number) {
  line(ctx, x - 5, y - 2, x - 9.6, y - 22, WOOD_D, 0.9); // the forked rest
  line(ctx, x - 9.6, y - 22, x - 11, y - 24, STEEL_D, 0.6);
  line(ctx, x - 9.6, y - 22, x - 8.6, y - 24.2, STEEL_D, 0.6);
  curve(ctx, x - 8.6, y - 9, x - 10.6, y - 6, x - 8, y - 3.6, 2.2, '#e8dcc0'); // a powder horn
  ellipse(ctx, x - 8, y - 3.6, 1, 0.8, GOLD_D);
  const b = figure(ctx, 'archer', 'spain', x, y, 1);
  arquebus(ctx, b.hand.x, b.hand.y, 1);
}

function unit(ctx: Ctx, kind: UnitKind, x: number, y: number): boolean {
  switch (kind) {
    case 'archer': arquebusier(ctx, x, y); return true;
    case 'rider': jinete(ctx, x, y); return true;
    case 'knight': heavyHorse(ctx, 'knight', x, y); return true;
    case 'conquistador': heavyHorse(ctx, 'conquistador', x, y); return true;
    case 'catapult': cannon(ctx, x, y); return true;
    case 'boat': case 'ship': case 'warship': ship(ctx, kind, x, y); return true;
    default: return false;
  }
}

registerArt('spain', {
  unit,
  dress: (kind) => dress(kind),
  torso,
  face,
  head,
  weapon,
  shield: (ctx, kind, x, y, k) => { rodela(ctx, kind, x, y, k); return true; },
  building,
  tree,
});


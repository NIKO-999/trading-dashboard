// Carthage: Punic soldiers in linen and bronze, purple-trimmed for the elite; the Sacred Band in white and purple behind
// great bronze shields marked with the sign of Tanit; Numidian horsemen riding bareback; a North African war elephant
// with a fighting tower; a torsion stone-thrower; merchant gauloi and eyed war galleys under Tyrian-purple sails;
// whitewashed flat-roofed houses, a temple with an Egyptian cornice, and the Byrsa hill for the capital; umbrella pines,
// olives and date palms.
import { registerArt, type Body } from '../tribeart';
import { figure } from '../units';
import type { BiomePalette } from '../../data/tribes';
import type { UnitKind } from '../../game/types';
import { band, box, ellipse, faceQuad, ink, line, mix, poly, rand, shade, type Ctx } from '../prims';

const PUR = '#5a1e6e';
const PUR_L = '#8a3aa8';
const PUR_D = '#360c46';
const LINEN = '#efe6cf';
const WHITE = '#f8f5ee';
const BRZ = '#c48a3c';
const BRZ_L = '#ecc070';
const BRZ_D = '#7a5020';
const GOLD = '#ecc44a';
const LEATH = '#7a4a26';
const WOOD = '#7a5230';
const WOOD_D = '#4a3018';
const SKIN = '#c99260';
const HAIR = '#1a120c';
const OCHRE = '#a8452c';
const WASH = '#f4efe4';

// ---------------------------------------------------------------- small helpers

/** A rounded helmet bowl (or any dome): the rim is the ellipse at (x, y), the crown rises `h` above it. */
function dome(ctx: Ctx, x: number, y: number, rx: number, h: number, c: string) {
  const path = () => {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, rx / 2, 0, 0, Math.PI);
    ctx.ellipse(x, y, rx, h, 0, Math.PI, Math.PI * 2);
    ctx.closePath();
  };
  path();
  ctx.fillStyle = ink(c);
  ctx.fill();
  ctx.save();
  path();
  ctx.clip();
  ellipse(ctx, x + rx * 0.75, y - h * 0.1, rx * 0.65, h * 1.2, shade(c, -0.22)); // the far side in shade
  ellipse(ctx, x - rx * 0.32, y - h * 0.55, rx * 0.36, h * 0.28, shade(c, 0.32)); // a polished glint
  ctx.restore();
}

/** An elliptical outline. */
function ring(ctx: Ctx, x: number, y: number, rx: number, ry: number, c: string, w: number) {
  ctx.strokeStyle = ink(c);
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
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

/** The sign of Tanit: a triangle robe, arms raised at the ends, a round head. `s` is about a third of its height. */
function tanit(ctx: Ctx, cx: number, cy: number, s: number, c: string) {
  poly(ctx, [cx, cy - 0.9 * s, cx - 1.5 * s, cy + 2 * s, cx + 1.5 * s, cy + 2 * s], c);
  line(ctx, cx - 1.8 * s, cy - 0.9 * s, cx + 1.8 * s, cy - 0.9 * s, c, 0.5 * s);
  line(ctx, cx - 1.8 * s, cy - 0.7 * s, cx - 1.8 * s, cy - 1.7 * s, c, 0.45 * s);
  line(ctx, cx + 1.8 * s, cy - 0.7 * s, cx + 1.8 * s, cy - 1.7 * s, c, 0.45 * s);
  ellipse(ctx, cx, cy - 2.1 * s, 0.85 * s, 0.85 * s, c);
}

/** A disc over an upturned crescent, the sign of Baal Hammon. */
function crescentDisc(ctx: Ctx, cx: number, cy: number, s: number, c: string, bg: string) {
  ellipse(ctx, cx, cy + 0.6 * s, 1.6 * s, 1.3 * s, c);
  ellipse(ctx, cx, cy + 0.1 * s, 1.35 * s, 1.05 * s, bg);
  ellipse(ctx, cx, cy - 1.5 * s, 0.75 * s, 0.75 * s, c);
}

// ---------------------------------------------------------------- dress

const ELITE = (k: UnitKind) => k === 'sacredband' || k === 'defender' || k === 'knight' || k === 'giant';

function dress(kind: UnitKind): [string, string, string] | null {
  switch (kind) {
    case 'warrior': return [LINEN, SKIN, SKIN];
    case 'archer': return ['#e2d4b0', SKIN, SKIN];
    case 'rider': return ['#d8b888', SKIN, SKIN]; // a short Numidian tunic of undyed wool
    case 'sacredband': case 'defender': return [WHITE, SKIN, WHITE];
    case 'swordsman': return [BRZ, SKIN, LINEN];
    case 'knight': return [BRZ, SKIN, WHITE];
    case 'explorer': return [LINEN, '#b8a07a', LINEN];
    case 'giant': return [PUR, SKIN, PUR];
    default: return [LINEN, SKIN, LINEN];
  }
}

/** The torso: a belted linen tunic with purple clavi for the elite, a white linothorax for the Sacred Band, bronze cuirasses for the heavy ranks. */
function torso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const k = w / 10;
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const L = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'L', x, y, w, h, u0, u1, v0, v1, c);
  const B = (v0: number, v1: number, c: string) => band(ctx, x, y, w, h, v0, v1, c);
  const pteruges = (c: string, edge: string) => { // hanging strips of stiffened linen below the armour
    for (let i = 0; i < 5; i++) { const u = 0.02 + i * 0.2; R(u, u + 0.16, 0, 0.26, c); L(u, u + 0.16, 0, 0.26, shade(c, -0.06)); R(u, u + 0.16, 0, 0.05, edge); L(u, u + 0.16, 0, 0.05, edge); }
  };
  switch (kind) {
    case 'sacredband':
    case 'defender': {
      // a laminated linen corslet: white, edged and banded in purple, a gold sign of Tanit on the breast
      pteruges(WHITE, PUR);
      B(0.26, 0.36, PUR);
      B(0.3, 0.32, GOLD);
      B(0.88, 1, PUR);
      R(0.0, 0.1, 0.36, 0.88, shade(WHITE, -0.12));
      L(0.86, 1, 0.36, 0.88, shade(WHITE, -0.12));
      for (const u of [0.22, 0.78]) R(u, u + 0.08, 0.6, 0.88, PUR_L); // shoulder ties
      const [tx, ty] = [x + w * 0.25, y + w * 0.125 - h * 0.6];
      tanit(ctx, tx, ty, 0.95 * k, GOLD);
      return;
    }
    case 'swordsman':
    case 'knight':
    case 'giant': {
      // a bronze muscle cuirass over a linen tunic: lit pectorals, a belly line, purple-edged pteruges
      pteruges(kind === 'giant' ? PUR : LINEN, PUR);
      const metal = kind === 'giant' ? GOLD : BRZ;
      B(0.26, 0.34, BRZ_D);
      R(0.12, 0.44, 0.62, 0.84, shade(metal, 0.22)); // pectorals
      R(0.56, 0.88, 0.62, 0.84, shade(metal, 0.12));
      R(0.47, 0.53, 0.38, 0.86, shade(metal, -0.28)); // the sternum line
      R(0.18, 0.82, 0.5, 0.54, shade(metal, -0.2));
      L(0.1, 0.9, 0.62, 0.84, shade(metal, 0.08));
      B(0.92, 1, shade(metal, 0.3));
      if (ELITE(kind)) { B(0.34, 0.38, PUR); B(0.88, 0.92, PUR); }
      ellipse(ctx, x + w * 0.25, y + w * 0.125 - h * 0.72, 0.7 * k, 0.7 * k, BRZ_L); // a boss on the breast
      return;
    }
    case 'rider': {
      // a short belted tunic, a leopard-skin over one shoulder
      B(0, 0.08, shade('#d8b888', -0.2));
      B(0.36, 0.44, OCHRE);
      for (const [u, v] of [[0.1, 0.62], [0.3, 0.78], [0.2, 0.9], [0.6, 0.66]] as const) R(u, u + 0.12, v, v + 0.08, '#e0a848');
      R(0, 0.36, 0.56, 1, '#d89a40');
      for (const [u, v] of [[0.06, 0.66], [0.2, 0.82], [0.1, 0.92], [0.26, 0.6]] as const) R(u, u + 0.06, v, v + 0.05, '#3a2414');
      return;
    }
    default: {
      // the plain linen tunic of the citizen levy: a leather belt with a bronze buckle and a purple hem
      const tun = kind === 'archer' ? '#e2d4b0' : LINEN;
      B(0, 0.08, PUR);
      B(0.08, 0.11, shade(tun, -0.2));
      for (const u of [0.2, 0.5, 0.8]) { R(u, u + 0.04, 0.1, 0.36, shade(tun, -0.12)); L(u, u + 0.04, 0.1, 0.36, shade(tun, -0.12)); } // folds
      B(0.36, 0.46, LEATH);
      R(0.42, 0.58, 0.36, 0.46, BRZ_L);
      B(0.9, 1, shade(tun, -0.1)); // the neck opening
      if (kind === 'explorer') { R(0.2, 0.3, 0.46, 1, PUR); L(0.7, 0.8, 0.46, 1, PUR); } // a traveller's purple sash
      return;
    }
  }
}

/** Punic faces: a trimmed black beard for the grown ranks, gold earrings. */
function face(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  faceQuad(ctx, 'L', x, y, w, h, 0.72, 0.8, 0.22, 0.34, GOLD); // a gold ring in the ear
  if (kind === 'warrior' || kind === 'archer' || kind === 'rider') return;
  R(0.12, 0.88, 0, 0.16, HAIR); // a square-cut beard
  R(0.04, 0.16, 0.12, 0.34, HAIR);
  R(0.84, 0.96, 0.12, 0.34, HAIR);
  R(0.3, 0.7, 0.2, 0.24, HAIR); // moustache
  faceQuad(ctx, 'L', x, y, w, h, 0.8, 1, 0, 0.3, HAIR);
}

// ---------------------------------------------------------------- headgear

/** A Montefortino helmet: a bronze bowl with a knob on top, a short flared neck guard and hinged cheek pieces. */
function montefortino(ctx: Ctx, x: number, top: number, k: number, hw: number, metal: string, plume?: string) {
  const hy = top + 10.5 * k, hh = 10.5 * k;
  // the neck guard flares out behind
  poly(ctx, [x - hw / 2 - 1.2 * k, top + 4 * k, x - hw / 2 + 2 * k, top + 5.4 * k, x - hw / 2 + 2.4 * k, top + 2.4 * k, x - hw / 2 - 0.2 * k, top + 1.6 * k], shade(metal, -0.25));
  box(ctx, x, top + 3 * k, hw + 0.8 * k, 3.4 * k, metal, shade(metal, 0.2));
  band(ctx, x, top + 3 * k, hw + 0.8 * k, 3.4 * k, 0, 0.26, shade(metal, -0.3)); // a rolled rim
  dome(ctx, x, top - 0.4 * k, (hw + 0.8 * k) / 2, 4.4 * k, metal);
  ctx.strokeStyle = ink(shade(metal, -0.32)); // a chased cable band just above the rim
  ctx.lineWidth = 0.5 * k;
  ctx.beginPath();
  ctx.ellipse(x, top - 0.4 * k, (hw + 0.8 * k) / 2 - 0.3 * k, 1.6 * k, 0, Math.PI * 1.05, Math.PI * 1.95);
  ctx.stroke();
  ellipse(ctx, x, top - 4.8 * k, 1 * k, 0.8 * k, shade(metal, -0.1)); // the top knob
  ellipse(ctx, x, top - 5.4 * k, 0.8 * k, 0.7 * k, shade(metal, 0.3));
  // cheek pieces over the ear and down the jaw
  faceQuad(ctx, 'L', x, hy, hw, hh, 0.58, 0.96, 0.24, 0.66, metal);
  faceQuad(ctx, 'L', x, hy, hw, hh, 0.66, 0.72, 0.4, 0.5, shade(metal, 0.35));
  faceQuad(ctx, 'R', x, hy, hw, hh, 0.9, 1, 0.24, 0.62, shade(metal, -0.05));
  if (plume) { // a horsehair plume rising from the knob, swept back
    for (let i = 0; i < 5; i++) curve(ctx, x, top - 5.4 * k, x - 3 * k - i * 0.4 * k, top - 10.8 * k + i * 0.4 * k, x - 7.4 * k - i * 0.5 * k, top - 4.8 * k + i * 0.7 * k, 1.2 * k, i % 2 ? shade(plume, -0.2) : plume);
  }
}

/** A crested bronze helmet for the Sacred Band: a tall transverse crest in purple and white on a gilt holder. */
function crested(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  montefortino(ctx, x, top, k, hw, BRZ);
  const hy = top + 10.5 * k, hh = 10.5 * k;
  faceQuad(ctx, 'R', x, hy, hw, hh, 0.38, 0.62, 0.7, 1.02, BRZ); // a nasal guard
  band(ctx, x, top + 3 * k, hw + 0.8 * k, 3.4 * k, 0.5, 0.7, GOLD);
  line(ctx, x - 1 * k, top - 4.6 * k, x + 1 * k, top - 6.2 * k, GOLD, 1.2 * k); // the crest holder
  // the crest: a tall fan of horsehair running across the helmet, purple with a white edge
  const pts: number[] = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(x - 7 * k + t * 12 * k, top - 5.6 * k - Math.sin(t * Math.PI) * 7.2 * k + t * 1.4 * k); }
  pts.push(x + 5 * k, top - 4.2 * k, x - 7 * k, top - 4 * k);
  poly(ctx, pts, PUR);
  poly(ctx, [...pts.slice(0, 12), x + 0.4 * k, top - 8 * k, x - 6.2 * k, top - 5.4 * k], PUR_L);
  for (let i = 0; i < 9; i++) { const t = (i + 0.5) / 9; line(ctx, x - 7 * k + t * 12 * k, top - 5.6 * k - Math.sin(t * Math.PI) * 7.2 * k + t * 1.4 * k, x - 7 * k + t * 12 * k + 0.4 * k, top - 4.6 * k, shade(PUR, -0.3), 0.4 * k); }
  curve(ctx, x - 7 * k, top - 5.6 * k, x - 1 * k, top - 19.4 * k, x + 5 * k, top - 4.2 * k, 0.9 * k, WHITE);
}

function head(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  switch (kind) {
    case 'warrior': montefortino(ctx, x, top, k, hw, BRZ); return;
    case 'swordsman': montefortino(ctx, x, top, k, hw, BRZ, '#1a1414'); return;
    case 'knight': montefortino(ctx, x, top, k, hw, BRZ, WHITE); return;
    case 'sacredband': case 'defender': crested(ctx, x, top, k, hw); return;
    case 'archer': { // a conical felt cap, banded in purple, with the tip bent forward
      box(ctx, x, top + 2.4 * k, hw + 0.4 * k, 2.6 * k, '#d8c8a0', '#e8dcc0');
      band(ctx, x, top + 2.4 * k, hw + 0.4 * k, 2.6 * k, 0.1, 0.5, PUR);
      poly(ctx, [x - hw / 2 - 0.2 * k, top - 0.2 * k, x + hw / 2 + 0.2 * k, top - 0.2 * k, x + 2 * k, top - 8 * k, x + 4 * k, top - 9.4 * k, x - 1 * k, top - 7.4 * k], '#d8c8a0');
      poly(ctx, [x + 0.6 * k, top + 2.6 * k, x + hw / 2 + 0.2 * k, top - 0.2 * k, x + 2 * k, top - 8 * k, x + 4 * k, top - 9.4 * k], '#b8a680');
      return;
    }
    case 'rider': case 'explorer': { // a wrapped headcloth, its tail hanging behind
      const c = kind === 'rider' ? '#e8dcc0' : LINEN;
      box(ctx, x, top + 2.8 * k, hw + 0.6 * k, 3.4 * k, c, shade(c, 0.1));
      for (const v of [0.25, 0.6]) band(ctx, x, top + 2.8 * k, hw + 0.6 * k, 3.4 * k, v, v + 0.1, shade(c, -0.16));
      dome(ctx, x, top - 0.6 * k, (hw + 0.6 * k) / 2, 2.8 * k, c);
      poly(ctx, [x - hw / 2 - 0.2 * k, top + 1.6 * k, x - hw / 2 - 3 * k, top + 9 * k, x - hw / 2 - 0.8 * k, top + 9.4 * k, x - hw / 2 + 1.4 * k, top + 3 * k], shade(c, -0.12));
      if (kind === 'explorer') band(ctx, x, top + 2.8 * k, hw + 0.6 * k, 3.4 * k, 0.4, 0.55, PUR);
      else { // Numidian curls showing at the brow, and a band of red
        band(ctx, x, top + 2.8 * k, hw + 0.6 * k, 3.4 * k, 0.4, 0.52, OCHRE);
      }
      return;
    }
    case 'giant': { // a gilded helmet, crest and all
      montefortino(ctx, x, top, k, hw, GOLD, PUR);
      return;
    }
    default: return;
  }
}

// ---------------------------------------------------------------- weapons and shields

/** A great round shield: bronze-faced, a purple rim band and the sign of Tanit, or a crescent-disc for the lighter ranks. */
function bigShield(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  const big = kind === 'sacredband' || kind === 'defender';
  const cx = x - 1.4 * k, cy = y - (big ? 6.4 : 5.6) * k, rx = (big ? 6.8 : 5.2) * k, ry = (big ? 7.4 : 5.7) * k;
  ellipse(ctx, cx + 0.8 * k, cy + 0.6 * k, rx, ry, BRZ_D); // its thickness
  ellipse(ctx, cx, cy, rx, ry, big ? BRZ : kind === 'warrior' ? LEATH : BRZ);
  if (big || kind === 'swordsman') {
    ring(ctx, cx, cy, rx * 0.86, ry * 0.86, PUR, 1.6 * k);
    ring(ctx, cx, cy, rx * 0.86, ry * 0.86, PUR_L, 0.5 * k);
    ellipse(ctx, cx - rx * 0.32, cy - ry * 0.38, rx * 0.3, ry * 0.2, shade(BRZ, 0.36)); // a polished glint
    ring(ctx, cx, cy, rx * 0.98, ry * 0.98, BRZ_L, 0.5 * k);
    if (big) tanit(ctx, cx, cy - 0.2 * k, 1.5 * k, WHITE);
    else crescentDisc(ctx, cx, cy, 1.5 * k, WHITE, BRZ);
  } else { // a hide shield, painted ochre with a pale crescent-disc and a bronze boss
    ellipse(ctx, cx, cy, rx * 0.88, ry * 0.88, OCHRE);
    ring(ctx, cx, cy, rx * 0.88, ry * 0.88, shade(OCHRE, -0.3), 0.5 * k);
    crescentDisc(ctx, cx, cy - 0.4 * k, 1.3 * k, LINEN, OCHRE);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ellipse(ctx, cx + Math.cos(a) * rx * 0.74, cy + Math.sin(a) * ry * 0.74, 0.35 * k, 0.35 * k, BRZ_L); }
  }
}

/** A spear with a long leaf-shaped bronze head and a butt spike. */
function spear(ctx: Ctx, x: number, y: number, k: number, len = 27) {
  const x0 = x - 1.6 * k, y0 = y + 6 * k, x1 = x + 3 * k, y1 = y - (len - 6) * k;
  line(ctx, x0, y0, x1, y1, WOOD, 1.3 * k);
  line(ctx, x0 - 0.4 * k, y0, x1 - 0.4 * k, y1, shade(WOOD, 0.4), 0.4 * k);
  poly(ctx, [x1 + 0.6 * k, y1 - 7 * k, x1 - 1.5 * k, y1 - 1.6 * k, x1 - 0.1 * k, y1 + 0.6 * k], BRZ_L);
  poly(ctx, [x1 + 0.6 * k, y1 - 7 * k, x1 + 1.9 * k, y1 - 1.2 * k, x1 - 0.1 * k, y1 + 0.6 * k], BRZ);
  line(ctx, x1 + 0.4 * k, y1 - 6 * k, x1, y1, BRZ_D, 0.4 * k);
  line(ctx, x0, y0, x0 - 0.5 * k, y0 + 2.4 * k, BRZ, 1.1 * k);
  line(ctx, x1 - 0.3 * k, y1 + 1.2 * k, x1 - 0.6 * k, y1 + 2.4 * k, PUR, 1.4 * k); // a purple binding below the head
}

/** A straight, two-edged sword raised in the hand: a bronze hilt with a crescent pommel. */
function sword(ctx: Ctx, x: number, y: number, k: number) {
  const hx = x, hy = y + 0.6 * k, tx = x + 4 * k, ty = y - 15 * k;
  const nx = 0.97, ny = 0.26;
  poly(ctx, [hx - nx * 1.2 * k, hy - 2 * k, tx - nx * 1 * k, ty, tx + 0.7 * k, ty - 2.4 * k, hx, hy - 2.4 * k], '#e4e8ee');
  poly(ctx, [hx + nx * 1.2 * k, hy - 1.7 * k, tx + nx * 1 * k, ty + ny * 0.6 * k, tx + 0.7 * k, ty - 2.4 * k, hx, hy - 2.4 * k], '#9aa2ac');
  line(ctx, hx + 0.2 * k, hy - 3 * k, tx - 0.1 * k, ty - 0.6 * k, '#6a727c', 0.4 * k);
  line(ctx, hx - 2.4 * k, hy - 1.3 * k, hx + 2.4 * k, hy - 2.4 * k, BRZ, 1.3 * k); // the guard
  line(ctx, hx, hy - 1.6 * k, hx - 0.5 * k, hy + 2 * k, LEATH, 1.6 * k);
  ellipse(ctx, hx - 0.6 * k, hy + 2.6 * k, 1.2 * k, 0.9 * k, BRZ_L);
}

/** A bundle of light javelins with thongs. */
function javelins(ctx: Ctx, x: number, y: number, k: number) {
  for (const d of [-1, 0, 1]) {
    const x0 = x - 2.4 * k + d * 0.8 * k, y0 = y + 4 * k, x1 = x + 4.4 * k + d * 1.4 * k, y1 = y - 15 * k + Math.abs(d) * 1 * k;
    line(ctx, x0, y0, x1, y1, '#9a6a3a', 0.8 * k);
    poly(ctx, [x1 + 1 * k, y1 - 3.4 * k, x1 - 0.7 * k, y1 + 0.4 * k, x1 + 0.6 * k, y1 + 0.6 * k], '#d8dde4');
  }
  line(ctx, x - 0.6 * k, y - 1 * k, x + 0.8 * k, y - 1.6 * k, OCHRE, 1.2 * k);
}

function weapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  switch (kind) {
    case 'warrior':
      spear(ctx, x, y, k, 24);
      bigShield(ctx, kind, b.off.x, b.off.y, k);
      return true;
    case 'sacredband':
    case 'defender':
      spear(ctx, x, y, k, 30);
      bigShield(ctx, kind, b.off.x, b.off.y, k);
      return true;
    case 'swordsman':
      sword(ctx, x, y, k);
      bigShield(ctx, kind, b.off.x, b.off.y, k);
      return true;
    case 'rider':
      javelins(ctx, x, y, k);
      return true;
    default:
      return false;
  }
}

// ---------------------------------------------------------------- Numidian horseman

/** A small, quick Numidian horse ridden bareback: no saddle, only a rope round the neck. Returns the seat. */
function numidianHorse(ctx: Ctx, x: number, y: number, k: number, coat: string, mane: string) {
  const leg = shade(coat, -0.25);
  for (const [lx, ly] of [[-6, -1.5], [-3, 0.5], [4, -0.5], [7, 1.5]] as const) {
    box(ctx, x + lx * k, y + ly * k, 1.9 * k, 7.4 * k, leg);
    faceQuad(ctx, 'R', x + lx * k, y + ly * k, 1.9 * k, 7.4 * k, 0, 1, 0.44, 0.52, shade(leg, 0.2));
    box(ctx, x + lx * k, y + ly * k, 2.1 * k, 1.4 * k, '#2a1a10');
  }
  // a long flowing tail
  curve(ctx, x - 8.6 * k, y - 10.6 * k, x - 13 * k, y - 8 * k, x - 12.4 * k, y - 2.4 * k, 2 * k, mane);
  curve(ctx, x - 8.6 * k, y - 10.4 * k, x - 11.6 * k, y - 7.4 * k, x - 11.2 * k, y - 3 * k, 0.8 * k, shade(mane, 0.25));
  box(ctx, x, y - 6.4 * k, 16 * k, 6.4 * k, coat);
  band(ctx, x, y - 6.4 * k, 16 * k, 6.4 * k, 0, 0.18, shade(coat, -0.32));
  faceQuad(ctx, 'R', x, y - 6.4 * k, 16 * k, 6.4 * k, 0.55, 0.95, 0.3, 0.85, shade(coat, 0.1));
  faceQuad(ctx, 'L', x, y - 6.4 * k, 16 * k, 6.4 * k, 0.1, 0.5, 0.3, 0.85, shade(coat, 0.1));
  box(ctx, x + 7.2 * k, y - 10.6 * k, 4.4 * k, 7.4 * k, coat); // a high-carried neck
  box(ctx, x + 10.4 * k, y - 16 * k, 6.4 * k, 4.4 * k, coat); // a fine head
  box(ctx, x + 13.6 * k, y - 15.6 * k, 2.8 * k, 2.6 * k, shade(coat, 0.15));
  faceQuad(ctx, 'R', x + 10.4 * k, y - 16 * k, 6.4 * k, 4.4 * k, 0.45, 0.62, 0.45, 0.75, '#101010');
  faceQuad(ctx, 'R', x + 10.4 * k, y - 16 * k, 6.4 * k, 4.4 * k, 0.5, 0.56, 0.62, 0.72, '#ffffff');
  faceQuad(ctx, 'R', x + 13.6 * k, y - 15.6 * k, 2.8 * k, 2.6 * k, 0.35, 0.6, 0.3, 0.5, '#1a1010');
  box(ctx, x + 6.8 * k, y - 17.4 * k, 2.4 * k, 6.4 * k, mane); // a short upright mane
  box(ctx, x + 9.4 * k, y - 20.6 * k, 1.4 * k, 2.4 * k, coat);
  // the neck rope, knotted, with a tassel, and a thin cord rein
  line(ctx, x + 5.4 * k, y - 13.4 * k, x + 8.4 * k, y - 11.4 * k, OCHRE, 1 * k);
  line(ctx, x + 6.6 * k, y - 12.4 * k, x + 6.4 * k, y - 9.6 * k, OCHRE, 0.7 * k);
  ellipse(ctx, x + 6.4 * k, y - 9.2 * k, 0.7 * k, 0.9 * k, LINEN);
  curve(ctx, x + 15.6 * k, y - 14.4 * k, x + 9 * k, y - 9 * k, x + 3 * k, y - 12.6 * k, 0.5 * k, '#3a2a1a');
  // a leopard pelt thrown over the back in place of a saddle
  poly(ctx, [x - 4.6 * k, y - 12.6 * k, x + 3 * k, y - 12.8 * k, x + 2.6 * k, y - 8 * k, x - 1 * k, y - 6.6 * k, x - 4.4 * k, y - 8.4 * k], '#d89a40');
  for (const [dx, dy] of [[-3.4, -11], [-1.2, -9.4], [1, -11.4], [1.6, -8.8], [-2.6, -8.6]] as const) ellipse(ctx, x + dx * k, y + dy * k, 0.5 * k, 0.45 * k, '#3a2414');
  return { x: x - 1 * k, y: y - 13 * k };
}

function rider(ctx: Ctx, x: number, y: number) {
  const seat = numidianHorse(ctx, x - 1, y + 3, 1, '#9a6238', '#1a120c');
  const b = figure(ctx, 'rider', 'carthage', seat.x, seat.y, 0.88, true);
  // a bare leg hanging loose down the flank: no stirrups for a Numidian
  const sx = seat.x, sy = seat.y;
  poly(ctx, [sx + 0.4, sy + 0.4, sx + 4, sy + 0.6, sx + 5, sy + 6.6, sx + 2.6, sy + 7.2], '#d8b888');
  poly(ctx, [sx + 2.6, sy + 7.2, sx + 5, sy + 6.6, sx + 4.4, sy + 11.4, sx + 2.6, sy + 11.6], SKIN);
  poly(ctx, [sx + 3.6, sy + 7, sx + 5, sy + 6.6, sx + 4.4, sy + 11.4, sx + 3.6, sy + 11.5], shade(SKIN, -0.18));
  poly(ctx, [sx + 2.4, sy + 11.4, sx + 4.6, sy + 11.2, sx + 5.6, sy + 12.4, sx + 2.6, sy + 12.6], shade(SKIN, -0.1));
  javelins(ctx, b.hand.x, b.hand.y, 0.9);
  // a small round hide shield on the far arm
  const hx = b.off.x - 2, hy = b.off.y - 3;
  ellipse(ctx, hx + 0.5, hy + 0.5, 3.6, 3.9, LEATH);
  ellipse(ctx, hx, hy, 3.6, 3.9, OCHRE);
  crescentDisc(ctx, hx, hy - 0.2, 0.9, LINEN, OCHRE);
  ring(ctx, hx, hy, 3.5, 3.8, shade(OCHRE, -0.3), 0.5);
}

// ---------------------------------------------------------------- the war elephant

function elephant(ctx: Ctx, x: number, y: number) {
  const skin = '#8a8278', skinD = '#625a52', lit = '#a8a096';
  // tail with a dark tuft
  curve(ctx, x - 12.6, y - 18, x - 16, y - 14, x - 15, y - 8, 1.3, skinD);
  poly(ctx, [x - 15, y - 8.8, x - 16.4, y - 5.6, x - 14.8, y - 4.8, x - 13.8, y - 6.6], '#2a2622');
  // pillar legs: the far pair darker, wrinkle lines and toenails
  const leg = (lx: number, far: boolean) => {
    const c = far ? shade(skin, -0.18) : skin, w = 5.8;
    poly(ctx, [x + lx, y - 13, x + lx + w, y - 13, x + lx + w - 0.4, y - 1, x + lx + w - 0.9, y + 0.6, x + lx + 0.9, y + 0.6, x + lx + 0.4, y - 1], c);
    poly(ctx, [x + lx + w * 0.58, y - 13, x + lx + w, y - 13, x + lx + w - 0.4, y - 1, x + lx + w - 0.9, y + 0.6, x + lx + w * 0.58, y + 0.6], shade(c, -0.16));
    for (const v of [-6, -4.6]) line(ctx, x + lx + 0.8, y + v, x + lx + w - 0.8, y + v + 0.3, shade(c, -0.25), 0.4);
    for (const u of [1, 2.6, 4.2]) ellipse(ctx, x + lx + u, y + 0.2, 0.6, 0.45, '#e6dcc4');
  };
  leg(-5.6, true);
  leg(8.8, true);
  leg(-10.4, false);
  leg(4.6, false);
  // the body: a dipped back and a high shoulder (the African build)
  ellipse(ctx, x - 0.6, y - 14.6, 13.4, 8.6, skinD);
  ellipse(ctx, x - 1, y - 15.4, 13, 8.2, skin);
  ellipse(ctx, x - 4, y - 19.6, 8, 3, lit);
  for (let i = 0; i < 5; i++) curve(ctx, x - 10 + i * 4, y - 9, x - 9 + i * 4, y - 12, x - 10.4 + i * 4, y - 16, 0.35, shade(skin, -0.2)); // skin folds
  // the caparison: Tyrian purple with a linen border, gold tassels and a sun-disc
  const cap = [x - 11.6, y - 19.6, x - 9.4, y - 24.6, x + 5, y - 25.6, x + 8.6, y - 20.4, x + 7.6, y - 10.6, x - 11, y - 10];
  poly(ctx, cap, PUR);
  poly(ctx, [x - 11.6, y - 19.6, x - 9.4, y - 24.6, x - 1.6, y - 25.2, x - 1.6, y - 10.2, x - 11, y - 10], shade(PUR, 0.1));
  poly(ctx, [x - 11.2, y - 12.8, x + 7.8, y - 13.2, x + 7.6, y - 10.6, x - 11, y - 10], LINEN);
  line(ctx, x - 11.2, y - 13, x + 7.8, y - 13.4, GOLD, 0.7);
  for (let i = 0; i < 8; i++) { const hx = x - 10.2 + i * 2.5, hy = y - 10.2; line(ctx, hx, hy, hx, hy + 2, GOLD, 0.6); ellipse(ctx, hx, hy + 2.4, 0.6, 0.7, GOLD); }
  ellipse(ctx, x - 2, y - 18.2, 2.8, 2.6, GOLD);
  ellipse(ctx, x - 2, y - 18.2, 2.1, 1.9, PUR_D);
  crescentDisc(ctx, x - 2, y - 18, 0.8, GOLD, PUR_D);
  line(ctx, x - 7, y - 8.4, x + 5, y - 8.6, LEATH, 1.2); // the girth
  // the head and the great ear
  ellipse(ctx, x + 13.4, y - 18.4, 5.8, 7, shade(skin, -0.03));
  ellipse(ctx, x + 12, y - 23.4, 4.6, 3, lit);
  const ear = [x + 11.6, y - 26.4, x + 4.8, y - 27, x + 1, y - 21.6, x + 1.6, y - 12.4, x + 6.2, y - 9.4, x + 10.6, y - 12, x + 12.4, y - 19];
  poly(ctx, ear, shade(skin, -0.08));
  poly(ctx, [x + 10.6, y - 25.2, x + 5.4, y - 25.6, x + 2.6, y - 21.4, x + 3, y - 13.4, x + 6.4, y - 11, x + 9.8, y - 13.2, x + 11.2, y - 19], shade(skin, 0.06));
  for (let i = 0; i < 4; i++) curve(ctx, x + 4 + i * 1.6, y - 24, x + 2 + i * 1.6, y - 18, x + 4.4 + i * 1.4, y - 12.4, 0.35, shade(skin, -0.2)); // veins in the ear
  // a bronze frontlet on the brow, plumed in purple
  poly(ctx, [x + 14.4, y - 24, x + 18.6, y - 22, x + 17.6, y - 17, x + 14.6, y - 17.6], BRZ);
  poly(ctx, [x + 14.4, y - 24, x + 16.4, y - 23, x + 15.8, y - 17.4, x + 14.6, y - 17.6], BRZ_L);
  for (let i = 0; i < 4; i++) curve(ctx, x + 15.6, y - 24, x + 13 - i, y - 30 + i * 0.6, x + 9.6 - i * 1.2, y - 27.6 + i, 1, i % 2 ? PUR_L : PUR);
  ellipse(ctx, x + 17.2, y - 20.8, 0.9, 0.8, '#f4efe0'); // the eye
  ellipse(ctx, x + 17.4, y - 20.8, 0.5, 0.5, '#111116');
  // the trunk, ringed, curling at the tip
  const tr: [number, number][] = [[x + 18.4, y - 17.6], [x + 21.6, y - 12], [x + 22.4, y - 5.4], [x + 21, y - 1.4], [x + 23.6, y - 1.6]];
  ctx.strokeStyle = ink(skinD);
  ctx.lineWidth = 4.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(tr[0][0], tr[0][1]);
  ctx.quadraticCurveTo(tr[1][0] + 1, tr[1][1], tr[2][0], tr[2][1]);
  ctx.quadraticCurveTo(tr[3][0] - 1, tr[3][1] + 1, tr[4][0], tr[4][1]);
  ctx.stroke();
  ctx.strokeStyle = ink(skin);
  ctx.lineWidth = 3;
  ctx.stroke();
  for (let i = 0; i < 7; i++) { const t = i / 7, px = x + 19 + t * 3.4, py = y - 16 + t * 11; line(ctx, px - 1.3, py, px + 1.3, py + 0.4, shade(skin, -0.28), 0.4); }
  // the tusks, long and pale
  curve(ctx, x + 16.6, y - 14, x + 22, y - 11, x + 26, y - 16, 2, '#d8cdb0');
  curve(ctx, x + 16.6, y - 14.4, x + 22, y - 11.6, x + 25.8, y - 16.4, 0.8, '#fbf6e8');
  // the tower: a timber turret with crenellations, shields hung along its sides
  const hx = x - 2.6, hy = y - 24.4;
  // a purple pennant streaming back from the tower
  line(ctx, hx - 6, hy - 3, hx - 6.4, hy - 19, WOOD_D, 0.9);
  poly(ctx, [hx - 6.4, hy - 19, hx - 14.6, hy - 17.6, hx - 12, hy - 15.6, hx - 14.6, hy - 13.8, hx - 6.2, hy - 14.2], PUR);
  poly(ctx, [hx - 6.4, hy - 19, hx - 14.6, hy - 17.6, hx - 13.8, hy - 16.8, hx - 6.4, hy - 17.6], PUR_L);
  box(ctx, hx, hy, 14, 2, WOOD_D);
  const crew = figure(ctx, 'knight', 'carthage', hx + 0.6, hy - 3.4, 0.74, true);
  box(ctx, hx, hy - 1.6, 13, 5.4, WOOD, shade(WOOD, 0.2));
  for (const u of [0.2, 0.5, 0.8]) { faceQuad(ctx, 'L', hx, hy - 1.6, 13, 5.4, u - 0.02, u + 0.02, 0, 1, WOOD_D); faceQuad(ctx, 'R', hx, hy - 1.6, 13, 5.4, u - 0.02, u + 0.02, 0, 1, WOOD_D); }
  for (const [u, f] of [[0.2, 'L'], [0.6, 'L'], [0.3, 'R'], [0.72, 'R']] as const) { // round shields on the walls
    const px = f === 'L' ? hx - 6.5 + u * 6.5 : hx + u * 6.5, py = f === 'L' ? hy - 1.6 + u * 3.25 - 3 : hy - 1.6 + (1 - u) * 3.25 - 3;
    ellipse(ctx, px, py, 1.9, 2.1, BRZ);
    ellipse(ctx, px, py, 1.3, 1.5, PUR);
    ellipse(ctx, px, py, 0.5, 0.5, GOLD);
  }
  for (const [dx, dy] of [[-5.6, -7.6], [-2.4, -6], [1.2, -6.4], [4.6, -8]] as const) box(ctx, hx + dx, hy + dy, 1.8, 1.4, WOOD, shade(WOOD, 0.25)); // merlons
  spear(ctx, crew.hand.x, crew.hand.y, 0.74, 24);
  // the mahout on the neck, with a goad
  const m = figure(ctx, 'rider', 'carthage', x + 10.6, y - 24.2, 0.5, true);
  line(ctx, m.hand.x, m.hand.y + 1, m.hand.x + 4.4, m.hand.y - 3.4, WOOD, 0.8);
  poly(ctx, [m.hand.x + 4.4, m.hand.y - 3.4, m.hand.x + 6.6, m.hand.y - 3.6, m.hand.x + 5.2, m.hand.y - 1.8], '#d8dde4');
}

// ---------------------------------------------------------------- the stone-thrower

function catapult(ctx: Ctx, x: number, y: number) {
  // stone shot piled beside it
  for (const [ax, ay, ar] of [[14, 6, 2], [17.4, 6.6, 1.8], [15.6, 4, 1.7], [11.6, 7, 1.5]] as const) {
    ellipse(ctx, x + ax, y + ay, ar, ar * 0.9, '#a49c8e');
    ellipse(ctx, x + ax - ar * 0.3, y + ay - ar * 0.3, ar * 0.45, ar * 0.38, '#d4ccbe');
  }
  // the trestle base on two spoked wheels
  box(ctx, x - 2, y + 2, 28, 3, WOOD, shade(WOOD, 0.25));
  for (const u of [0.15, 0.5, 0.85]) { faceQuad(ctx, 'R', x - 2, y + 2, 28, 3, u, u + 0.03, 0, 1, WOOD_D); faceQuad(ctx, 'L', x - 2, y + 2, 28, 3, u, u + 0.03, 0, 1, WOOD_D); }
  for (const wx of [-11, 6]) {
    ellipse(ctx, x + wx, y + 4.6, 3.4, 3.6, WOOD_D);
    ellipse(ctx, x + wx - 0.3, y + 4.4, 2.6, 2.8, WOOD);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI; line(ctx, x + wx - 0.3 - Math.cos(a) * 2.5, y + 4.4 - Math.sin(a) * 2.7, x + wx - 0.3 + Math.cos(a) * 2.5, y + 4.4 + Math.sin(a) * 2.7, WOOD_D, 0.6); }
    ellipse(ctx, x + wx - 0.3, y + 4.4, 0.8, 0.8, BRZ);
  }
  // the stand: a post and two raking legs holding the machine up at an angle
  line(ctx, x - 1, y, x - 1, y - 13, WOOD_D, 2.6);
  line(ctx, x - 1.4, y, x - 1.4, y - 13, WOOD, 1.4);
  line(ctx, x - 10, y + 1, x - 2, y - 10, WOOD_D, 1.6);
  line(ctx, x + 8, y + 1, x, y - 10, WOOD_D, 1.6);
  // the stock: a long trough angled up towards the enemy, a winch at its tail
  const s0: [number, number] = [x - 16, y - 7], s1: [number, number] = [x + 16, y - 20];
  line(ctx, s0[0], s0[1] + 1.4, s1[0], s1[1] + 1.4, WOOD_D, 3.2);
  line(ctx, s0[0], s0[1], s1[0], s1[1], WOOD, 2.6);
  line(ctx, s0[0], s0[1] - 1, s1[0], s1[1] - 1, shade(WOOD, 0.35), 0.6);
  ellipse(ctx, s0[0] + 1.4, s0[1] + 0.6, 2.6, 2.6, WOOD_D); // the winch drum and its handspikes
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI + 0.4; line(ctx, s0[0] + 1.4 - Math.cos(a) * 4, s0[1] + 0.6 - Math.sin(a) * 4, s0[0] + 1.4 + Math.cos(a) * 4, s0[1] + 0.6 + Math.sin(a) * 4, WOOD, 0.7); }
  ellipse(ctx, s0[0] + 1.4, s0[1] + 0.6, 1, 1, BRZ);
  // the spring frame at the front: two great skeins of twisted sinew, bronze-capped, in a timber frame
  const fx = x + 9, fy = y - 17;
  line(ctx, fx - 6, fy + 7, fx + 6, fy + 4, WOOD_D, 2); // the lower beam
  const arms: [number, number][] = [];
  for (const [dx, dy] of [[-3.4, 1.2], [3.4, -0.8]] as const) {
    const sx = fx + dx, sy = fy + dy;
    ctx.fillStyle = ink('#4a2e1c');
    ctx.fillRect(sx - 1.9, sy - 7, 3.8, 13);
    ctx.fillStyle = ink('#6a4428');
    ctx.fillRect(sx - 1.9, sy - 7, 1.4, 13);
    for (let i = 0; i < 7; i++) line(ctx, sx - 1.9, sy - 6 + i * 1.8, sx + 1.9, sy - 5 + i * 1.8, '#2a1a10', 0.5); // the twist
    ellipse(ctx, sx, sy - 7, 2.6, 1.2, BRZ_L); // bronze washers
    ellipse(ctx, sx, sy - 7.2, 1.4, 0.6, BRZ_D);
    ellipse(ctx, sx, sy + 6, 2.6, 1.2, BRZ);
    arms.push([sx, sy - 1]);
  }
  line(ctx, fx - 6, fy - 7, fx + 6, fy - 9.4, WOOD, 1.8); // the upper beam
  line(ctx, fx - 6, fy - 7.6, fx + 6, fy - 10, shade(WOOD, 0.35), 0.5);
  // the arms swept back, the bowstring drawn to the slider, a stone ball ready
  const pull: [number, number] = [x - 8, y - 11];
  const tips = arms.map(([ax, ay], i): [number, number] => [ax - 9, ay + (i ? -6 : 4)]);
  arms.forEach(([ax, ay], i) => {
    line(ctx, ax, ay, tips[i][0], tips[i][1], WOOD_D, 2.2);
    line(ctx, ax, ay - 0.5, tips[i][0], tips[i][1] - 0.5, shade(WOOD, 0.25), 0.8);
    ellipse(ctx, tips[i][0], tips[i][1], 0.9, 0.9, BRZ_L);
  });
  line(ctx, tips[0][0], tips[0][1], pull[0], pull[1], '#f4ecd8', 0.8);
  line(ctx, tips[1][0], tips[1][1], pull[0], pull[1], '#f4ecd8', 0.8);
  ellipse(ctx, pull[0] + 2, pull[1] - 2, 2.4, 2.2, '#9a9284');
  ellipse(ctx, pull[0] + 1.4, pull[1] - 2.6, 1, 0.9, '#d4ccbe');
  // a purple banner with a gold crescent-disc on a pole at the stand
  line(ctx, x - 3, y - 12, x - 3.6, y - 32, WOOD_D, 1);
  poly(ctx, [x - 3.6, y - 32, x + 6.4, y - 30.4, x + 3.6, y - 27.4, x + 6.4, y - 24.6, x - 3.4, y - 25.6], PUR);
  poly(ctx, [x - 3.6, y - 32, x + 6.4, y - 30.4, x + 5.6, y - 29.4, x - 3.6, y - 30.6], PUR_L);
  crescentDisc(ctx, x + 0.4, y - 28, 0.8, GOLD, PUR);
}

// ---------------------------------------------------------------- ships

/** A curved hull seen side-on. `top(t)` is the gunwale height along it (t from -1 stern to 1 bow). */
function hullPoints(x: number, y: number, w: number, top: (t: number) => number) {
  const near: [number, number][] = [];
  for (let i = 0; i <= 12; i++) { const t = -1 + i / 6; near.push([x + t * w, top(t)]); }
  return near;
}

/** A square sail on a yard, bellied by the wind, in purple with linen stripes or a gold sign. */
function sail(ctx: Ctx, mx: number, yTop: number, w: number, h: number, look: 'stripes' | 'tanit' | 'border') {
  const l = mx - w / 2, r = mx + w / 2, b = yTop + h;
  line(ctx, l - 1.6, yTop - 0.6, r + 1.6, yTop + 0.6, WOOD_D, 1.2); // the yard
  const pts = [l, yTop, r, yTop + 0.6, r + 1.6, b - h * 0.4, r + 0.6, b, mx, b + 1.6, l - 0.6, b - 0.4, l - 1.6, b - h * 0.4];
  poly(ctx, pts, PUR);
  poly(ctx, [mx, yTop + 0.3, r, yTop + 0.6, r + 1.6, b - h * 0.4, r + 0.6, b, mx, b + 1.6], shade(PUR, -0.12));
  if (look === 'stripes') for (const t of [0.2, 0.5, 0.8]) { const sx = l + t * w; poly(ctx, [sx - 1, yTop + 0.3 * t, sx + 1, yTop + 0.3 * t, sx + 1.4, b + 1 - Math.abs(t - 0.5) * 2.6, sx - 0.6, b + 0.8 - Math.abs(t - 0.5) * 2.6], LINEN); }
  if (look === 'border') { line(ctx, l - 0.6, b - 0.4, mx, b + 1.6, LINEN, 1); line(ctx, mx, b + 1.6, r + 0.6, b, LINEN, 1); line(ctx, l, yTop + 1, r, yTop + 1.6, LINEN, 1); }
  if (look === 'tanit') { tanit(ctx, mx, yTop + h * 0.5, h * 0.12, GOLD); line(ctx, l - 0.6, b - 0.4, mx, b + 1.6, GOLD, 0.8); line(ctx, mx, b + 1.6, r + 0.6, b, GOLD, 0.8); }
  for (const t of [0.15, 0.85]) line(ctx, l + t * w, yTop + 1, l + t * w + (t - 0.5) * 2, b, 'rgba(0,0,0,0.12)', 0.5); // brails
}

/** The painted eye on the bow. */
function bowEye(ctx: Ctx, ex: number, ey: number, s: number) {
  ellipse(ctx, ex, ey, 2.2 * s, 1.4 * s, WHITE);
  ellipse(ctx, ex + 0.3 * s, ey, 1 * s, 1 * s, '#1a1420');
  ellipse(ctx, ex + 0.1 * s, ey - 0.3 * s, 0.35 * s, 0.35 * s, '#ffffff');
  ctx.strokeStyle = ink('#1a1420');
  ctx.lineWidth = 0.5 * s;
  ctx.beginPath();
  ctx.moveTo(ex - 2.6 * s, ey + 0.2 * s);
  ctx.quadraticCurveTo(ex, ey - 2.4 * s, ex + 2.8 * s, ey - 0.4 * s);
  ctx.stroke();
}

function foam(ctx: Ctx, x: number, y: number, w: number) {
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y, w, 2.2, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.stroke();
}

/** The merchant gaulos: a round-bellied hull, a horse-head prow, a striped sail and amphorae on deck. */
function gaulos(ctx: Ctx, x: number, y: number) {
  const w = 17;
  const top = (t: number) => y - 4.4 - (t < 0 ? Math.pow(-t, 2) * 6 : Math.pow(t, 3) * 4.6);
  const near = hullPoints(x, y, w, top);
  const far = near.map(([a, b], i) => [a + (i === 0 ? 1.8 : i === 12 ? -1.8 : 0), b - 2.2] as [number, number]);
  poly(ctx, [...near.flat(), ...[...far].reverse().flat()], '#3a2412');
  // cargo: amphorae and a bale
  for (const [dx, c] of [[-7, '#c47a48'], [-4.4, '#b06a3c'], [4.2, '#c47a48']] as const) {
    ellipse(ctx, x + dx, y - 6.6, 1.5, 2.4, c);
    line(ctx, x + dx, y - 9, x + dx, y - 9.8, shade(c, -0.2), 0.9);
    ellipse(ctx, x + dx - 0.5, y - 7.2, 0.5, 1.1, shade(c, 0.3));
  }
  box(ctx, x + 7.8, y - 5.6, 4.6, 2.6, '#d8c8a0');
  band(ctx, x + 7.8, y - 5.6, 4.6, 2.6, 0.4, 0.6, PUR);
  line(ctx, x - 0.4, y - 5, x - 0.4, y - 26, WOOD_D, 1.1);
  sail(ctx, x - 0.4, y - 24.4, 15, 12, 'stripes');
  figure(ctx, 'warrior', 'carthage', x - 11.6, y - 4.6, 0.42, true); // the helmsman
  const hull = [...near, [x + w * 0.8, y - 0.8], [x + w * 0.4, y + 2.6], [x, y + 3.2], [x - w * 0.5, y + 2.6], [x - w * 0.86, y - 1]] as [number, number][];
  poly(ctx, hull.flat(), '#8a5a34');
  poly(ctx, [...near.flat(), x + w * 0.84, y - 2.6, x, y - 2, x - w * 0.84, y - 2.6], '#a8754a');
  line(ctx, x - w * 0.86, y - 1, x + w * 0.8, y - 0.8, '#4a2a14', 0.6);
  ctx.strokeStyle = ink(PUR);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  near.forEach(([a, b], i) => (i ? ctx.lineTo(a, b + 1) : ctx.moveTo(a, b + 1)));
  ctx.stroke();
  // the horse-head prow (hippos) and a curled stern
  const bx = x + w, by = top(1);
  poly(ctx, [bx - 1.4, by + 1.6, bx + 0.6, by - 3, bx + 2.6, by - 5.6, bx + 5, by - 5.2, bx + 5.4, by - 3.6, bx + 3, by - 3.2, bx + 1.6, by + 1.4], '#8a5a34');
  poly(ctx, [bx + 0.8, by - 4.6, bx + 2.4, by - 6.8, bx + 2.6, by - 5.2], '#6a3a1e'); // ear
  ellipse(ctx, bx + 3.4, by - 4.6, 0.45, 0.45, '#1a1010');
  line(ctx, bx + 0.6, by - 3, bx - 0.4, by - 0.6, PUR, 1);
  const sx = x - w, sy = top(-1);
  curve(ctx, sx + 1.4, sy + 1.4, sx - 3.4, sy - 2, sx - 0.6, sy - 6.6, 2, '#8a5a34');
  ellipse(ctx, sx - 0.6, sy - 6.6, 1.2, 1.2, '#a8754a');
  line(ctx, sx + 2, sy + 1, sx - 1.6, y + 5, WOOD, 1.1); // the steering oar
  ellipse(ctx, sx - 1.8, y + 5.2, 1, 1.8, WOOD_D);
  bowEye(ctx, x + w * 0.74, top(0.74) + 2.4, 0.7);
  foam(ctx, x, y + 3.2, w * 0.86);
}

/** A war galley: a long low hull, a bronze ram, an eye on the bow, a curling stern ornament, oars, shields on the rail. */
function galley(ctx: Ctx, x: number, y: number, big: boolean) {
  const w = big ? 29 : 24;
  const top = (t: number) => y - 4.6 - (t < 0 ? Math.pow(-t, 2.6) * 6.4 : Math.pow(t, 3) * 3.4);
  const near = hullPoints(x, y, w, top);
  const far = near.map(([a, b], i) => [a + (i === 0 ? 2 : i === 12 ? -2 : 0), b - 2.4] as [number, number]);
  // far oars, then the inside of the far wall
  for (let i = 0; i < (big ? 9 : 7); i++) { const px = x - w * 0.62 + i * (w * 1.24) / (big ? 8 : 6); line(ctx, px, y - 6.6, px + 2.6, y - 0.6, shade(WOOD, -0.2), 0.7); }
  poly(ctx, [...near.flat(), ...[...far].reverse().flat()], '#2e1a10');
  // marines on deck
  const crew: [number, UnitKind][] = big ? [[-0.6, 'sacredband'], [-0.24, 'archer'], [0.36, 'sacredband'], [0.62, 'warrior']] : [[-0.5, 'warrior'], [0.42, 'archer']];
  for (const [t, kd] of crew) figure(ctx, kd, 'carthage', x + t * w, y - 5.4, 0.42, true);
  // mast, sail and (on the great quinquereme) a fighting tower amidships
  line(ctx, x - 1, y - 5, x - 1, big ? y - 36 : y - 30, WOOD_D, 1.2);
  sail(ctx, x - 1, big ? y - 34 : y - 28.4, big ? 22 : 17, big ? 15 : 12.6, big ? 'tanit' : 'border');
  if (big) {
    box(ctx, x + 11, y - 6, 7, 6, WOOD, shade(WOOD, 0.22));
    for (const u of [0.1, 0.4, 0.7]) { faceQuad(ctx, 'L', x + 11, y - 6, 7, 6, u, u + 0.24, 0.85, 1.1, WOOD); faceQuad(ctx, 'R', x + 11, y - 6, 7, 6, u, u + 0.24, 0.85, 1.1, WOOD); }
    figure(ctx, 'archer', 'carthage', x + 11.2, y - 12.6, 0.36, true);
    band(ctx, x + 11, y - 6, 7, 6, 0.5, 0.64, PUR);
  }
  // the near side of the hull: dark pitch below, purple strake, a row of oar ports and the outrigger
  const keel = [...near, [x + w * 0.9, y - 1.6], [x + w * 0.5, y + 2], [x, y + 2.6], [x - w * 0.5, y + 2], [x - w * 0.88, y - 1]] as [number, number][];
  poly(ctx, keel.flat(), '#3a2a22');
  poly(ctx, [...near.flat(), x + w * 0.9, y - 3.2, x, y - 2.6, x - w * 0.86, y - 3.2], '#8a5a34');
  ctx.strokeStyle = ink(PUR);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  near.forEach(([a, b], i) => (i ? ctx.lineTo(a, b + 1.2) : ctx.moveTo(a, b + 1.2)));
  ctx.stroke();
  ctx.strokeStyle = ink(GOLD);
  ctx.lineWidth = 0.4;
  ctx.stroke();
  // shields along the rail
  for (let i = 0; i < (big ? 9 : 6); i++) {
    const t = -0.64 + i * (big ? 0.16 : 0.24), px = x + t * w, py = top(t) + 0.4;
    ellipse(ctx, px, py, 1.6, 1.7, i % 2 ? BRZ : WHITE);
    ellipse(ctx, px, py, 0.9, 1, i % 2 ? PUR : PUR_L);
  }
  // oars: one bank (two for the great ship), dipping into the water
  const banks = big ? [y - 2.6, y - 0.8] : [y - 2];
  banks.forEach((by, j) => {
    for (let i = 0; i < (big ? 9 : 7); i++) {
      const px = x - w * 0.64 + i * (w * 1.28) / (big ? 8 : 6) + j * 1.4;
      ellipse(ctx, px, by, 0.6, 0.45, '#1a1010');
      line(ctx, px, by, px + 3.6 - j, y + 6.4 + j * 0.6, '#a87a4a', 0.8);
      ellipse(ctx, px + 3.8 - j, y + 6.8 + j * 0.6, 1.4, 0.5, 'rgba(255,255,255,0.55)');
    }
  });
  // the bronze ram at the waterline
  const rx = x + w * 0.84;
  poly(ctx, [rx - 2, y - 3, rx + 6, y - 1.6, rx + 7.6, y - 0.4, rx + 6, y + 0.8, rx - 2, y + 0.4], '#b8913a');
  poly(ctx, [rx - 2, y - 3, rx + 6, y - 1.6, rx + 7.6, y - 0.4, rx - 2, y - 1.4], BRZ_L);
  for (const dx of [1.4, 3.8]) line(ctx, rx + dx, y - 2.6, rx + dx, y + 0.6, '#5a7a5a', 0.6); // verdigris on the fins
  // the stem post and the curling stern
  const bx = x + w, by = top(1);
  curve(ctx, bx - 0.6, by + 1, bx + 2.6, by - 3, bx + 1.4, by - 6.4, 1.8, '#8a5a34');
  ellipse(ctx, bx + 1.4, by - 6.6, 1, 1, GOLD);
  const sx = x - w, sy = top(-1);
  curve(ctx, sx + 1.4, sy + 1.6, sx - 4.4, sy - 4, sx + 0.6, sy - 9.6, 2.2, '#8a5a34');
  curve(ctx, sx + 0.6, sy - 9.6, sx + 3, sy - 10.6, sx + 2.4, sy - 7.6, 1.6, '#8a5a34');
  ellipse(ctx, sx + 2.4, sy - 7.6, 0.8, 0.8, GOLD);
  line(ctx, sx + 3, sy + 1.4, sx - 1.4, y + 5.6, WOOD, 1.2); // the steering oar
  ellipse(ctx, sx - 1.6, y + 5.8, 1.1, 2, WOOD_D);
  bowEye(ctx, x + w * 0.8, top(0.8) + 2.6, big ? 0.95 : 0.8);
  foam(ctx, x, y + 2.6, w * 0.84);
}

function boat(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  if (kind === 'boat') gaulos(ctx, x, y);
  else galley(ctx, x, y, kind === 'warship');
}

// ---------------------------------------------------------------- buildings

/** A whitewashed flat-roofed house: a parapet, a dark door and small windows, sometimes an upper room and a purple awning. */
function house(ctx: Ctx, x: number, y: number, w: number, h: number, upper: boolean, awning: boolean, roofC: string) {
  box(ctx, x, y, w, h, WASH, '#e6dcc8');
  band(ctx, x, y, w, h, 0, 0.1, '#d8ccb4'); // a plinth of rough stone
  band(ctx, x, y, w, h, 0.9, 1, mix(roofC, WASH, 0.4)); // a coloured parapet line
  faceQuad(ctx, 'R', x, y, w, h, 0.38, 0.6, 0.1, 0.62, '#4a3424'); // the door
  faceQuad(ctx, 'R', x, y, w, h, 0.42, 0.56, 0.5, 0.6, '#2a1c14');
  faceQuad(ctx, 'R', x, y, w, h, 0.76, 0.88, 0.56, 0.72, '#3a2c24'); // windows
  faceQuad(ctx, 'L', x, y, w, h, 0.3, 0.42, 0.56, 0.72, '#3a2c24');
  if (awning) {
    faceQuad(ctx, 'R', x, y, w, h, 0.3, 0.68, 0.62, 0.72, PUR);
    for (const u of [0.34, 0.46, 0.58]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.06, 0.62, 0.72, LINEN);
  }
  if (upper) { // a small upper room at the back, with a stair along the side
    const ux = x - w * 0.18, uy = y - h - w * 0.05;
    box(ctx, ux, uy, w * 0.5, h * 0.6, WASH, '#e6dcc8');
    faceQuad(ctx, 'R', ux, uy, w * 0.5, h * 0.6, 0.35, 0.65, 0.1, 0.7, '#4a3424');
    band(ctx, ux, uy, w * 0.5, h * 0.6, 0.86, 1, mix(roofC, WASH, 0.4));
    for (let i = 0; i < 4; i++) faceQuad(ctx, 'L', x, y, w, h, 0.08 + i * 0.12, 0.2 + i * 0.12, 0.1 + i * 0.2, 0.18 + i * 0.2, '#cfc4ae'); // the outside stair
  } else { // things on the flat roof: a water jar and cloth drying in the sun
    ellipse(ctx, x + w * 0.12, y - h - 1, 1.2, 1.6, '#c47a48');
    line(ctx, x - w * 0.3, y - h - 2.6, x + w * 0.02, y - h - 1.2, '#6a5a4a', 0.4);
    poly(ctx, [x - w * 0.24, y - h - 2.4, x - w * 0.1, y - h - 1.8, x - w * 0.1, y - h + 0.2, x - w * 0.24, y - h - 0.4], PUR_L);
  }
}

/** A Punic temple: a stepped podium, a cella with a flaring Egyptian cornice, two palm-capital columns and a winged disc. */
function temple(ctx: Ctx, x: number, y: number) {
  box(ctx, x, y + 2, 20, 2, '#d8ccb4');
  box(ctx, x, y, 17, 2, '#e6dcc8');
  const cy = y - 2;
  box(ctx, x - 1, cy, 13, 10, WASH, '#e8e0cc');
  faceQuad(ctx, 'R', x - 1, cy, 13, 10, 0.3, 0.66, 0, 0.64, '#3a2a20'); // the doorway
  faceQuad(ctx, 'R', x - 1, cy, 13, 10, 0.28, 0.68, 0.64, 0.72, GOLD);
  // the cavetto cornice: a flared lip painted in bands
  box(ctx, x - 1, cy - 10, 15, 2.4, '#e8e0cc', '#efe8d6');
  band(ctx, x - 1, cy - 10, 15, 2.4, 0, 0.35, PUR);
  band(ctx, x - 1, cy - 10, 15, 2.4, 0.35, 0.5, GOLD);
  for (let i = 0; i < 6; i++) { faceQuad(ctx, 'R', x - 1, cy - 10, 15, 2.4, i / 6 + 0.04, i / 6 + 0.1, 0.5, 1, '#5a8aa0'); faceQuad(ctx, 'L', x - 1, cy - 10, 15, 2.4, i / 6 + 0.04, i / 6 + 0.1, 0.5, 1, '#5a8aa0'); } // painted leaf flutes
  // a winged sun-disc over the door
  const [dx, dy] = [x - 1 + 13 * 0.24, cy + 13 * 0.125 - 10 * 0.82];
  poly(ctx, [dx - 3.4, dy, dx, dy - 0.8, dx + 3.4, dy - 1.4, dx + 3, dy + 0.4, dx, dy + 0.6, dx - 3, dy + 1.2], GOLD);
  ellipse(ctx, dx, dy, 1, 1, '#c8372d');
  // two columns with palm capitals before the front
  for (const t of [0.14, 0.82]) {
    const px = x - 1 + t * 6.5 + 0.6, py = cy + 13 * 0.25 - t * 3.25 + 1.4;
    box(ctx, px, py, 1.6, 9, WASH);
    poly(ctx, [px - 1.6, py - 9, px - 0.6, py - 10.4, px + 0.6, py - 10.4, px + 1.6, py - 9, px, py - 8.2], '#7aa860');
  }
  // a tall pole with a purple banner, and an incense stand
  line(ctx, x - 9, y + 1, x - 9, y - 18, WOOD_D, 0.9);
  poly(ctx, [x - 9, y - 18, x - 3.6, y - 17, x - 5.2, y - 15.4, x - 3.6, y - 13.8, x - 9, y - 14.4], PUR);
  line(ctx, x + 9.6, y + 2, x + 9.6, y - 3, BRZ_D, 0.8);
  ellipse(ctx, x + 9.6, y - 3.4, 1.6, 0.7, BRZ);
  curve(ctx, x + 9.6, y - 4, x + 10.6, y - 7, x + 9.4, y - 10, 0.8, 'rgba(220,220,230,0.5)');
}

/** The Byrsa: a rocky hill ringed by a white wall, the temple of Eshmun on its crown reached by a great stair, a round tower at its foot. */
function byrsa(ctx: Ctx, x: number, y: number, roofC: string) {
  ellipse(ctx, x, y + 10, 30, 8, 'rgba(0,0,0,0.16)');
  const hill = [x - 28, y + 8, x - 19, y - 3, x - 8, y - 9, x + 6, y - 10, x + 18, y - 4, x + 28, y + 7, x + 14, y + 12.4, x - 12, y + 13];
  poly(ctx, hill, '#b8a07a');
  poly(ctx, [x - 28, y + 8, x - 19, y - 3, x - 8, y - 9, x - 3, y + 1, x - 13, y + 9, x - 12, y + 13], '#ccb48a');
  poly(ctx, [x + 6, y - 10, x + 18, y - 4, x + 28, y + 7, x + 14, y + 12.4, x + 8, y + 2], '#957e5a');
  for (const [dx, dy] of [[-22, 4], [21, 5.6], [-8, 11], [11, 10]] as const) { ellipse(ctx, x + dx, y + dy - 1, 2.2, 1.4, '#5a7a3a'); ellipse(ctx, x + dx - 0.4, y + dy - 1.6, 1.4, 0.8, '#7a9a4a'); } // scrub
  // the ring wall with square towers
  ctx.strokeStyle = ink('#efe8d8');
  ctx.lineWidth = 2.4;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 25, y + 7); ctx.lineTo(x - 15, y + 11.4); ctx.lineTo(x + 2, y + 12.4); ctx.lineTo(x + 16, y + 10.4); ctx.lineTo(x + 25, y + 6.4);
  ctx.stroke();
  ctx.strokeStyle = ink('#c8bca4');
  ctx.lineWidth = 0.6;
  ctx.stroke();
  for (const [dx, dy] of [[-25, 7], [-8, 12.2], [9, 11.6], [25, 6.4]] as const) box(ctx, x + dx, y + dy, 3.4, 4.4, WASH, '#e6dcc8');
  // the great stair up the slope
  for (let i = 0; i < 6; i++) box(ctx, x + 2 - i * 0.4, y + 10 - i * 2.6, 6 - i * 0.3, 0.9, i % 2 ? '#e6dcc8' : '#d8ccb4');
  // houses on the slopes
  house(ctx, x - 15, y + 3, 6, 4, false, false, roofC);
  house(ctx, x + 15, y + 3, 6, 5, false, true, roofC);
  house(ctx, x - 9, y - 1, 5, 4, false, false, roofC);
  // the temple on the summit
  temple(ctx, x + 1, y - 9);
  // a round tower, the admiral's watch over the harbour, at the left foot
  const tx = x - 22, ty = y + 2;
  ellipse(ctx, tx, ty + 1, 4.4, 2.2, '#c8bca4');
  ctx.fillStyle = ink(WASH);
  ctx.fillRect(tx - 4.4, ty - 14, 8.8, 15);
  ellipse(ctx, tx, ty + 1, 4.4, 2.2, WASH);
  ctx.fillStyle = ink('#d8ccb4');
  ctx.fillRect(tx + 1.6, ty - 14, 2.8, 15);
  ellipse(ctx, tx, ty - 14, 4.4, 2.2, '#e6dcc8');
  for (let i = 0; i < 6; i++) { const a = Math.PI * (0.05 + i * 0.18); box(ctx, tx + Math.cos(a) * 3.8, ty - 14 + Math.sin(a) * 1.9, 1.4, 1.6, WASH); }
  ctx.fillStyle = ink('#3a2c24');
  ctx.fillRect(tx - 0.8, ty - 9.6, 1.6, 2.6);
  line(ctx, tx, ty - 15, tx, ty - 24, WOOD_D, 0.8);
  poly(ctx, [tx, ty - 24, tx + 6.4, ty - 23, tx + 4.6, ty - 21.4, tx + 6.4, ty - 19.8, tx, ty - 20.2], PUR);
  poly(ctx, [tx, ty - 24, tx + 6.4, ty - 23, tx + 5.8, ty - 22.2, tx, ty - 22.8], PUR_L);
}

function building(ctx: Ctx, x: number, y: number, big: boolean, roofC: string, capital: boolean) {
  if (big && capital) { // the Byrsa, drawn a little smaller so the town around it still shows
    ctx.save();
    ctx.translate(x, y + 2);
    ctx.scale(0.74, 0.74);
    byrsa(ctx, 0, 0, roofC);
    ctx.restore();
    return;
  }
  if (big) { temple(ctx, x, y); return; }
  const v = ((Math.round(x) * 7 + Math.round(y) * 3) % 4 + 4) % 4;
  if (v === 0) house(ctx, x, y, 11, 7, true, false, roofC);
  else if (v === 1) house(ctx, x, y, 10, 6, false, true, roofC);
  else if (v === 2) { house(ctx, x - 2, y - 1, 8, 6, false, false, roofC); house(ctx, x + 4, y + 2.4, 7, 5, false, true, roofC); }
  else house(ctx, x, y, 12, 8, true, true, roofC);
}

// ---------------------------------------------------------------- trees

function tree(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  const type = ['pine', 'olive', 'palm', 'pine', 'olive', 'cypress', 'olive', 'pine', 'palm'][variant % 9];
  if (type === 'pine') {
    // a stone pine: a tall, bare, leaning trunk and a flat umbrella of dark needles
    const bk = '#7a5238', g = mix(P.forest, '#2f5a32', 0.55);
    curve(ctx, x, y, x - 1.6 * k, y - 10 * k, x + 1.6 * k, y - 19 * k, 2.6 * k, shade(bk, -0.25));
    curve(ctx, x - 0.4 * k, y, x - 2 * k, y - 10 * k, x + 1.2 * k, y - 19 * k, 1.4 * k, bk);
    curve(ctx, x + 0.6 * k, y - 15 * k, x + 3 * k, y - 17 * k, x + 5 * k, y - 19.4 * k, 1 * k, bk);
    curve(ctx, x + 0.4 * k, y - 16 * k, x - 2.4 * k, y - 18 * k, x - 4.4 * k, y - 19.6 * k, 0.9 * k, bk);
    for (const [dx, dy, rx, ry, c] of [[-5, -20, 5, 2.2, -0.16], [5, -20.6, 5.4, 2.3, -0.12], [0, -21.4, 7.6, 2.8, -0.04], [-2.6, -23.2, 5, 1.9, 0.06], [3, -23.4, 4.4, 1.8, 0.1]] as const) {
      ellipse(ctx, x + dx * k, y + (dy + 0.9) * k, rx * k, ry * k, shade(g, c - 0.22));
      ellipse(ctx, x + dx * k, y + dy * k, rx * k, ry * k, shade(g, c));
      ellipse(ctx, x + (dx - rx * 0.2) * k, y + (dy - ry * 0.35) * k, rx * 0.55 * k, ry * 0.36 * k, shade(g, c + 0.16));
    }
    for (let i = 0; i < 10; i++) { const a = rand(variant + 3, i) * Math.PI * 2, r = 2 + rand(variant + 7, i) * 6; line(ctx, x + Math.cos(a) * r * k, y - 22 * k + Math.sin(a) * r * 0.3 * k, x + Math.cos(a) * r * k + 0.8 * k, y - 22 * k + Math.sin(a) * r * 0.3 * k - 0.5 * k, shade(g, 0.28), 0.5 * k); }
    return;
  }
  if (type === 'olive') {
    // an olive: a short, twisted, hollow trunk and a rounded, silvery grey-green crown hung with olives
    const bk = '#7a6a58', g = mix(P.forest, '#8a9a6a', 0.65);
    curve(ctx, x - 1.4 * k, y, x - 2.4 * k, y - 4 * k, x - 0.6 * k, y - 8 * k, 2.2 * k, shade(bk, -0.2));
    curve(ctx, x + 1.4 * k, y, x + 2.6 * k, y - 4 * k, x + 0.8 * k, y - 8.4 * k, 2 * k, bk);
    ellipse(ctx, x, y - 2.6 * k, 0.8 * k, 1.4 * k, '#3a2e24'); // the hollow
    curve(ctx, x - 0.4 * k, y - 7 * k, x - 3 * k, y - 9 * k, x - 4.6 * k, y - 11 * k, 1 * k, bk);
    curve(ctx, x + 0.6 * k, y - 7 * k, x + 3 * k, y - 9 * k, x + 4.4 * k, y - 11.6 * k, 1 * k, bk);
    for (const [dx, dy, rx, ry, c] of [[-4.4, -11, 4, 3, -0.1], [4.4, -11.6, 4, 3, -0.14], [0, -13.6, 5, 3.6, 0], [-2, -16, 3.4, 2.4, 0.08], [2.6, -15.6, 3, 2.2, 0.06]] as const) {
      ellipse(ctx, x + dx * k, y + (dy + 1) * k, rx * k, ry * k, shade(g, c - 0.2));
      ellipse(ctx, x + dx * k, y + dy * k, rx * k, ry * k, shade(g, c));
      ellipse(ctx, x + (dx - rx * 0.3) * k, y + (dy - ry * 0.3) * k, rx * 0.5 * k, ry * 0.36 * k, shade(g, c + 0.22));
    }
    for (let i = 0; i < 12; i++) { const a = rand(variant + 4, i) * Math.PI * 2, r = 1.5 + rand(variant + 8, i) * 5; ellipse(ctx, x + Math.cos(a) * r * k, y - 13 * k + Math.sin(a) * r * 0.6 * k, 0.5 * k, 0.4 * k, i % 3 ? '#3a3046' : '#c8d0b0'); }
    return;
  }
  if (type === 'palm') {
    // a date palm: a ringed, gently curving trunk, a crown of arching fronds and hanging orange dates
    const bk = '#8a6a44';
    const tx = x + 3 * k, ty = y - 22 * k;
    curve(ctx, x, y, x - 1 * k, y - 12 * k, tx, ty, 2.4 * k, shade(bk, -0.2));
    curve(ctx, x - 0.4 * k, y, x - 1.4 * k, y - 12 * k, tx - 0.4 * k, ty, 1.2 * k, bk);
    for (let i = 1; i < 10; i++) { const t = i / 10, u = 1 - t, px = u * u * x + 2 * u * t * (x - 1 * k) + t * t * tx, py = u * u * y + 2 * u * t * (y - 12 * k) + t * t * ty; line(ctx, px - 1.3 * k, py, px + 1.3 * k, py - 0.4 * k, shade(bk, -0.35), 0.5 * k); }
    const g = mix(P.forest, '#4a8a3a', 0.5);
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (1.0 + i * 0.125) + (i % 2) * 0.05, len = (9 - Math.abs(i - 4) * 0.6) * k;
      const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * 0.5 + (Math.abs(Math.cos(a)) * 4) * k;
      const c = shade(g, i % 2 ? -0.1 : 0.08);
      curve(ctx, tx, ty, (tx + ex) / 2, ty - 3 * k, ex, ey, 1.4 * k, c);
      for (let j = 1; j < 5; j++) { const t = j / 5, px = tx + (ex - tx) * t, py = ty + (ey - ty) * t - Math.sin(t * Math.PI) * 2.4 * k; line(ctx, px, py, px + (ex > tx ? 0.4 : -0.4) * k, py + 1.8 * k, shade(c, -0.12), 0.5 * k); }
    }
    for (const dx of [-1.6, 1.4]) { line(ctx, tx + dx * k, ty, tx + dx * 1.2 * k, ty + 3 * k, '#a86a2a', 0.5 * k); ellipse(ctx, tx + dx * 1.2 * k, ty + 3.4 * k, 1.2 * k, 1.6 * k, '#d8842a'); ellipse(ctx, tx + dx * 1.2 * k - 0.3 * k, ty + 3 * k, 0.5 * k, 0.5 * k, '#f0a848'); }
    return;
  }
  // a cypress: a tall dark flame
  const g = mix(P.forest, '#24482c', 0.6);
  line(ctx, x, y, x, y - 3 * k, '#5a4030', 1.4 * k);
  poly(ctx, [x, y - 26 * k, x + 3 * k, y - 15 * k, x + 3.4 * k, y - 6 * k, x, y - 2 * k, x - 3.2 * k, y - 6 * k, x - 2.8 * k, y - 15 * k], shade(g, -0.06));
  poly(ctx, [x, y - 26 * k, x - 2.8 * k, y - 15 * k, x - 3.2 * k, y - 6 * k, x, y - 2 * k, x - 0.6 * k, y - 14 * k], shade(g, 0.12));
  for (let i = 0; i < 8; i++) { const py = y - (5 + i * 2.6) * k, r = 2.6 * (1 - i / 10); line(ctx, x - r * k, py, x + r * 0.4 * k, py - 0.8 * k, shade(g, 0.24), 0.5 * k); }
}

// ---------------------------------------------------------------- whole units

function unit(ctx: Ctx, kind: UnitKind, x: number, y: number): boolean {
  switch (kind) {
    case 'rider': rider(ctx, x, y); return true;
    case 'knight': elephant(ctx, x, y); return true;
    case 'catapult': catapult(ctx, x, y); return true;
    case 'boat': case 'ship': case 'warship': boat(ctx, kind, x, y); return true;
    default: return false;
  }
}

registerArt('carthage', {
  unit,
  dress: (kind) => dress(kind),
  torso,
  face,
  head,
  weapon,
  shield: (ctx, kind, x, y, k) => { bigShield(ctx, kind, x, y, k); return true; },
  building,
  tree,
});


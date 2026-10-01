// Venice (the Most Serene Republic): crimson and gold. Schiavoni marines in red caps and long red coats; crossbowmen in
// quilted crimson jacks under tailed sallets, sheltering behind painted pavises; brigandines of red velvet studded with
// gilt rivets and barbutes with their T-shaped face opening for the heavy foot; kite shields and pavises bearing the
// golden winged lion of St Mark on red; spears, arming swords and crossbows. Stradiot light horse in tall felt hats with
// long lances; the Condottiere, a mercenary captain in gilded plate and a gold-trimmed red cloak, a commander's baton
// in his fist and a plumed armet, on a barded horse; the Doge in his horned corno ducale and ermine. A great iron
// bombard on its timber bed; a black gondola with its ferro prow, a merchant galley and a long war galley with banks of
// oars and a great stern lantern. Gothic palazzi with pointed arches and balconies over the canals, striped mooring
// poles before them, funnel chimneys, campanili and domed churches; for the capital an arcaded Doge's Palace, the
// campanile of St Mark and a domed basilica. Cypresses, plane trees and lagoon reeds.
import { registerArt, type Body } from '../tribeart';
import { drawHorse, figure } from '../units';
import type { BiomePalette } from '../../data/tribes';
import type { UnitKind } from '../../game/types';
import { band, box, ellipse, faceQuad, ink, line, mix, poly, rand, roof, shade, type Ctx } from '../prims';

const RED = '#a8102a';
const RED_L = '#d0304a';
const RED_D = '#5a0816';
const GOLD = '#e2b443';
const GOLD_L = '#f8dc84';
const GOLD_D = '#946a1c';
const STEEL = '#c4cad2';
const STEEL_L = '#eef2f6';
const STEEL_D = '#6c7480';
const BLACK = '#1c181c';
const WHITE = '#f6f2e8';
const LINEN = '#ece2cc';
const WOOD = '#7a5230';
const WOOD_D = '#4a3018';
const IRON = '#4a4c54';
const IRON_D = '#2a2c32';
const IRON_L = '#8a909a';
const BRICK = '#c8644a';
const BRICK_D = '#9a4632';
const ISTRIA = '#f2ece0'; // Istrian stone
const PINK = '#e8b4a4'; // the Doge's Palace's rose-and-white wall
const CANAL = '#3a8aa6';
const CANAL_D = '#2a6a86';
const LEAD = '#9aa4ac'; // lead-sheathed domes
const BLUE = '#2a4a8a';

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

/** A rounded dome: the rim is the ellipse at (x, y), the crown rises `h` above it. */
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

/** A point on face 'R' (or 'L') of a box, as faceQuad maps it. */
function faceP(f: 'L' | 'R', cx: number, cy: number, w: number, h: number, u: number, v: number): [number, number] {
  return f === 'R' ? [cx + (u * w) / 2, cy + (w / 4) * (1 - u) - v * h] : [cx - w / 2 + (u * w) / 2, cy + (w / 4) * u - v * h];
}

/** A pointed (Gothic, ogee-tipped) opening on one face of a box: a rectangle with a pointed head. */
function gothic(ctx: Ctx, f: 'L' | 'R', cx: number, cy: number, w: number, h: number, u: number, du: number, v0: number, v1: number, c: string, frame?: string) {
  const a = faceP(f, cx, cy, w, h, u, v0), b = faceP(f, cx, cy, w, h, u + du, v0);
  const c1 = faceP(f, cx, cy, w, h, u + du, v1), d = faceP(f, cx, cy, w, h, u, v1);
  const tip = faceP(f, cx, cy, w, h, u + du / 2, v1 + du * (w / h) * 0.55);
  const pts = [...a, ...b, ...c1, tip[0] + (c1[0] - d[0]) * 0.1, (tip[1] + c1[1]) / 2 - 0.2, ...tip, tip[0] - (c1[0] - d[0]) * 0.1, (tip[1] + d[1]) / 2 - 0.2, ...d];
  if (frame) {
    ctx.save();
    ctx.translate((a[0] + b[0]) / 2, (a[1] + tip[1]) / 2);
    ctx.scale(1.3, 1.12);
    ctx.translate(-(a[0] + b[0]) / 2, -(a[1] + tip[1]) / 2);
    poly(ctx, pts, frame);
    ctx.restore();
  }
  poly(ctx, pts, f === 'R' ? shade(c, -0.1) : c);
}

/** A row of pointed arches along one face, on columns (an arcade or a loggia). */
function arcade(ctx: Ctx, f: 'L' | 'R', cx: number, cy: number, w: number, h: number, n: number, v0: number, v1: number, c: string, frame?: string) {
  const du = 1 / n;
  for (let i = 0; i < n; i++) gothic(ctx, f, cx, cy, w, h, i * du + du * 0.16, du * 0.68, v0, v1, c, frame);
}

/** The winged lion of St Mark, simply: gold, haloed, a paw on the open book. (x, y) is its middle; `s` its scale. */
function lion(ctx: Ctx, x: number, y: number, s: number, c = GOLD) {
  const d = shade(c, -0.32);
  ring(ctx, x - 1.9 * s, y - 1.2 * s, 1.5 * s, 1.5 * s, shade(c, 0.35), 0.35 * s); // halo
  poly(ctx, [x - 0.4 * s, y - 0.5 * s, x + 1.8 * s, y - 4.8 * s, x + 3.2 * s, y - 3.8 * s, x + 2.4 * s, y - 2.2 * s, x + 3.4 * s, y - 1.6 * s, x + 1.4 * s, y], d); // far wing
  poly(ctx, [x - 0.2 * s, y - 0.3 * s, x + 0.6 * s, y - 4.4 * s, x + 2.1 * s, y - 3.5 * s, x + 1.3 * s, y - 2.1 * s, x + 2.5 * s, y - 1.3 * s, x + 0.8 * s, y + 0.2 * s], c); // near wing
  ellipse(ctx, x + 0.3 * s, y + 0.3 * s, 2.3 * s, 1.1 * s, c); // body
  ellipse(ctx, x - 1.8 * s, y - 0.5 * s, 1.15 * s, 1.15 * s, c); // maned head
  ellipse(ctx, x - 2.6 * s, y - 0.3 * s, 0.5 * s, 0.45 * s, d); // muzzle
  for (const dx of [-1.3, -0.5, 1.1, 1.9]) line(ctx, x + dx * s, y + 0.9 * s, x + dx * s, y + 2.2 * s, c, 0.6 * s); // legs
  curve(ctx, x + 2.4 * s, y + 0.2 * s, x + 3.6 * s, y - 0.2 * s, x + 3.4 * s, y - 1.6 * s, 0.4 * s, c); // tail
  poly(ctx, [x - 3.7 * s, y + 0.5 * s, x - 2.3 * s, y + 0.3 * s, x - 2.3 * s, y + 1.7 * s, x - 3.7 * s, y + 1.9 * s], WHITE); // the open book
  line(ctx, x - 3 * s, y + 0.4 * s, x - 3 * s, y + 1.8 * s, d, 0.3 * s);
}

/** The gonfalon of St Mark: crimson with the gold lion and six swallow tails, hung from a cross-bar at (x, y). */
function gonfalon(ctx: Ctx, x: number, y: number, w: number, h: number, wave = 0) {
  const pts = [x, y, x + w, y];
  for (let i = 0; i <= 6; i++) pts.push(x + w - (i * w) / 6, y + h * (i % 2 ? 0.74 : 1) + Math.sin(wave + i) * 0.4);
  poly(ctx, pts, RED);
  poly(ctx, [x, y, x + w, y, x + w, y + h * 0.18, x, y + h * 0.18], RED_L);
  line(ctx, x - 0.6, y, x + w + 0.6, y, GOLD_D, 0.7);
  for (let i = 0; i < 6; i++) { const tx = x + w - ((i + 0.5) * w) / 6; ellipse(ctx, tx, y + h * (i % 2 ? 0.9 : 0.84), 0.35, 0.35, GOLD); }
  lion(ctx, x + w * 0.52, y + h * 0.42, Math.min(w, h) / 8.6);
}

// ---------------------------------------------------------------- dress

const ARMOURED = (k: UnitKind) => k === 'defender' || k === 'swordsman' || k === 'knight' || k === 'condottiere';

function dress(kind: UnitKind): [string, string, string] | null {
  switch (kind) {
    case 'warrior': return [RED, '#2a3048', RED]; // a Schiavone's red coat over dark hose
    case 'archer': return [RED_D, '#e8dcc4', RED]; // a quilted crimson jack, pale hose
    case 'rider': return ['#e8dcc4', '#5a3a2a', '#e8dcc4']; // a stradiot's white kaftan
    case 'defender': return [RED, RED_D, STEEL];
    case 'swordsman': return [RED, GOLD_D, STEEL];
    case 'knight': return [STEEL, '#2a2428', STEEL];
    case 'condottiere': return [GOLD, RED_D, STEEL];
    case 'giant': return [GOLD, RED, GOLD];
    case 'explorer': return [RED, RED_D, RED]; // a merchant's long crimson vesta
    default: return [RED, '#2a2428', RED];
  }
}

/** A brigandine: red velvet over steel plates, the plates' gilt rivet heads in rows. */
function brigandine(ctx: Ctx, x: number, y: number, w: number, h: number, cloth: string) {
  const k = w / 10;
  for (const f of ['L', 'R'] as const) {
    faceQuad(ctx, f, x, y, w, h, 0, 1, -0.16, 0.96, cloth);
    for (let r = 0; r < 5; r++) for (let i = 0; i < 4; i++) {
      const [px, py] = faceP(f, x, y, w, h, 0.14 + i * 0.24, 0.08 + r * 0.2);
      ellipse(ctx, px, py, 0.42 * k, 0.36 * k, f === 'R' ? GOLD : GOLD_L);
    }
  }
  faceQuad(ctx, 'R', x, y, w, h, 0.46, 0.54, -0.16, 0.96, shade(cloth, -0.25)); // the front opening
  band(ctx, x, y, w, h, 0.9, 1, GOLD); // a gilt collar edge
  for (let i = 0; i < 3; i++) faceQuad(ctx, 'R', x, y, w, h, 0.02, 0.98, -0.3 - i * 0.12, -0.2 - i * 0.12, shade(STEEL, -0.1 * i)); // fauld lames below
}

/** Plate: a breastplate with a ridge, gilt edges (and etched bands when `gilt`), tassets over the hips. */
function plate(ctx: Ctx, x: number, y: number, w: number, h: number, metal: string, gilt: boolean) {
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const L = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'L', x, y, w, h, u0, u1, v0, v1, c);
  for (let i = 0; i < 3; i++) {
    R(0.04, 0.96, -0.1 - i * 0.11, 0.02 - i * 0.11, shade(metal, -0.08 * i));
    L(0.04, 0.96, -0.1 - i * 0.11, 0.02 - i * 0.11, shade(metal, -0.08 * i));
    R(0.04, 0.96, -0.1 - i * 0.11, -0.07 - i * 0.11, gilt ? GOLD_D : shade(metal, -0.35));
  }
  R(0, 1, 0, 0.96, metal);
  L(0, 1, 0, 0.96, metal);
  R(0.06, 0.48, 0.2, 0.86, shade(metal, 0.24));
  R(0.48, 0.54, 0.1, 0.9, shade(metal, 0.55)); // the ridge
  R(0.54, 0.58, 0.1, 0.9, shade(metal, -0.25));
  L(0.2, 0.7, 0.4, 0.8, shade(metal, 0.12));
  band(ctx, x, y, w, h, 0.88, 0.98, GOLD);
  band(ctx, x, y, w, h, 0.02, 0.1, GOLD);
  if (gilt) { // etched and gilded bands running down the breast
    for (const u of [0.22, 0.76]) R(u, u + 0.08, 0.12, 0.86, GOLD);
    R(0.3, 0.7, 0.62, 0.7, GOLD);
  }
}

function torso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const k = w / 10;
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const L = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'L', x, y, w, h, u0, u1, v0, v1, c);
  const B = (v0: number, v1: number, c: string) => band(ctx, x, y, w, h, v0, v1, c);
  switch (kind) {
    case 'warrior': // a Schiavone marine: a long red coat skirted to the knee, frogged in gold, a dark sash and a white shirt at the throat
      R(0, 1, -0.5, 0.1, RED);
      L(0, 1, -0.5, 0.1, shade(RED, -0.06));
      R(0.46, 0.54, -0.5, 0.96, RED_D);
      for (let i = 0; i < 4; i++) { R(0.3, 0.46, 0.3 + i * 0.16, 0.36 + i * 0.16, GOLD); R(0.54, 0.7, 0.3 + i * 0.16, 0.36 + i * 0.16, GOLD); }
      B(0.08, 0.2, '#2a3048');
      R(0.36, 0.64, 0.86, 1, WHITE);
      R(0, 1, -0.5, -0.44, GOLD_D);
      return;
    case 'archer': // a quilted jack, stitched in vertical channels, a gilt belt with the bolt bag
      for (let i = 1; i < 6; i++) { R(i / 6 - 0.015, i / 6 + 0.015, 0, 0.94, shade(RED_D, -0.3)); L(i / 6 - 0.015, i / 6 + 0.015, 0, 0.94, shade(RED_D, -0.3)); }
      R(0, 1, -0.24, 0.02, RED_D);
      B(0.08, 0.18, GOLD_D);
      R(0.42, 0.56, 0.08, 0.18, GOLD_L);
      return;
    case 'rider': // a stradiot: a white kaftan with a red sash and a mail collar
      R(0, 1, -0.4, 0.02, '#e8dcc4');
      B(0.12, 0.26, RED);
      R(0.46, 0.54, -0.4, 0.96, '#c8b89a');
      for (let i = 0; i < 6; i++) R(i / 6, i / 6 + 0.12, 0.84, 0.98, i % 2 ? STEEL_D : STEEL);
      return;
    case 'defender': brigandine(ctx, x, y, w, h, RED); return;
    case 'swordsman':
      brigandine(ctx, x, y, w, h, RED);
      R(0.1, 0.9, 0.6, 0.94, shade(STEEL, 0.1)); // a steel plackart over the chest
      R(0.46, 0.54, 0.6, 0.94, STEEL_L);
      return;
    case 'knight': plate(ctx, x, y, w, h, STEEL, false); L(0.1, 0.9, 0.26, 0.38, RED); R(0, 0.16, 0.06, 0.38, RED_L); return;
    case 'condottiere': // gilded and etched plate, a red silk sash of command
      plate(ctx, x, y, w, h, '#d8dce2', true);
      for (let i = 0; i < 4; i++) { const u = 0.08 + i * 0.22; R(u, u + 0.22, 0.88 - i * 0.18, 0.68 - i * 0.18, RED); }
      return;
    case 'giant': { // the Doge's gold brocade dogalina, an ermine bavero over the shoulders
      R(0, 1, -0.9, 0.1, GOLD);
      L(0, 1, -0.9, 0.1, shade(GOLD, -0.06));
      for (let r = 0; r < 6; r++) for (let i = 0; i < 4; i++) { // the pomegranate pattern of the brocade
        const u = 0.1 + i * 0.24 + (r % 2) * 0.1, v = -0.8 + r * 0.26;
        R(u, u + 0.08, v, v + 0.1, GOLD_D);
      }
      R(0.44, 0.56, -0.9, 1, RED); // the red front band
      for (let i = 0; i < 4; i++) ellipse(ctx, ...faceP('R', x, y, w, h, 0.5, 0.1 + i * 0.22), 0.6 * k, 0.6 * k, GOLD_L); // gold buttons
      for (const f of ['L', 'R'] as const) { // the ermine collar
        faceQuad(ctx, f, x, y, w, h, 0, 1, 0.66, 1.02, WHITE);
        for (let i = 0; i < 4; i++) { const [px, py] = faceP(f, x, y, w, h, 0.14 + i * 0.24, 0.8 + (i % 2) * 0.1); line(ctx, px, py, px, py + 1 * k, BLACK, 0.5 * k); }
      }
      return;
    }
    case 'explorer': // a merchant's long crimson robe, a fur collar, a gilt belt with a purse
      R(0, 1, -0.6, 0.1, RED);
      L(0, 1, -0.6, 0.1, shade(RED, -0.06));
      B(0.86, 1, '#6a4a32');
      B(0.18, 0.26, GOLD);
      R(0.66, 0.86, -0.12, 0.18, '#7a4a26');
      return;
    default:
      if (ARMOURED(kind)) brigandine(ctx, x, y, w, h, RED);
  }
}

/** Venetian faces: a trimmed beard for the captains, a full white beard for the Doge, a moustache for the marines. */
function face(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const hair = '#3a2414';
  if (kind === 'giant') { // the old Doge: a long white beard
    R(0.04, 0.96, -0.3, 0.28, '#efece4');
    R(0.2, 0.8, 0.26, 0.32, '#e2ded4');
    faceQuad(ctx, 'L', x, y, w, h, 0.6, 1, -0.2, 0.3, '#dcd8ce');
    return;
  }
  if (kind === 'warrior') { R(0.2, 0.8, 0.22, 0.28, hair); R(0.16, 0.24, 0.12, 0.26, hair); R(0.76, 0.84, 0.12, 0.26, hair); return; } // a drooping Dalmatian moustache
  if (kind === 'rider') { R(0.14, 0.86, 0, 0.3, '#2a1a10'); R(0.22, 0.78, 0.26, 0.32, '#2a1a10'); return; } // a stradiot's black beard
  if (kind === 'explorer' || kind === 'condottiere') { R(0.1, 0.9, -0.02, 0.18, hair); R(0.26, 0.74, 0.2, 0.25, hair); } // a short trimmed beard
}

// ---------------------------------------------------------------- headgear

/** The flat top diamond of a box (as box() draws it), for caps and helmets set over the head box. */
function boxTop(ctx: Ctx, x: number, ty: number, w: number, c: string) {
  poly(ctx, [x - w / 2, ty, x, ty - w / 4, x + w / 2, ty, x, ty + w / 4], c);
}

/** A barbute: a close steel helmet down to the jaw, a T-shaped opening for the eyes, nose and mouth; a crest when given. */
function barbute(ctx: Ctx, x: number, top: number, k: number, hw: number, metal: string, crest?: string) {
  const hh = 10.5 * k, hy = top + hh, w = hw + 1.4 * k, h = hh + 1.4 * k, cy = hy + 0.6 * k;
  faceQuad(ctx, 'L', x, cy, w, h, 0, 1, 0, 1, metal);
  // the front face, all but the T
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, cy, w, h, u0, u1, v0, v1, c);
  R(0, 1, 0.68, 1, metal);
  R(0, 0.12, 0, 0.68, metal);
  R(0.88, 1, 0, 0.68, metal);
  R(0.12, 0.32, 0, 0.46, metal);
  R(0.68, 0.88, 0, 0.46, metal);
  // the dark rim of the T opening
  R(0.1, 0.9, 0.67, 0.72, shade(metal, -0.5));
  R(0.3, 0.33, 0, 0.46, shade(metal, -0.5));
  R(0.67, 0.7, 0, 0.46, shade(metal, -0.5));
  R(0.1, 0.32, 0.44, 0.47, shade(metal, -0.4));
  R(0.68, 0.9, 0.44, 0.47, shade(metal, -0.4));
  R(0.1, 0.12, 0.44, 0.7, shade(metal, -0.4));
  R(0.88, 0.9, 0.44, 0.7, shade(metal, -0.4));
  boxTop(ctx, x, cy - h, w, shade(metal, 0.18));
  dome(ctx, x, cy - h + 0.4 * k, w / 2, 3.4 * k, metal);
  // a ridge over the crown and a bright edge
  curve(ctx, x - w * 0.36, cy - h - 0.6 * k, x, cy - h - 4.6 * k, x + w * 0.4, cy - h + 0.6 * k, 0.6 * k, STEEL_L);
  line(ctx, x - w / 2 + 0.4 * k, cy - h + 0.4 * k, x - w / 2 + 0.4 * k, cy - 0.6 * k, shade(metal, 0.35), 0.5 * k);
  if (crest) for (let i = 0; i < 3; i++) curve(ctx, x, cy - h - 3.4 * k, x - 2 * k - i * 0.6 * k, cy - h - 9 * k + i * k, x - 7 * k - i * 0.6 * k, cy - h - 3.4 * k + i * 1.2 * k, (1.6 - i * 0.3) * k, i % 2 ? shade(crest, -0.2) : crest);
}

/** A sallet: a round bowl to the brow with a long tail sweeping down the back of the neck; an eye-slit visor if `visor`. */
function sallet(ctx: Ctx, x: number, top: number, k: number, hw: number, metal: string, visor: boolean, plume?: string) {
  const by = top + 4.4 * k, rx = hw / 2 + 0.9 * k;
  // the tail, behind and to the left
  poly(ctx, [x - rx * 0.6, by - 1.6 * k, x - rx - 4.4 * k, by + 3.2 * k, x - rx - 3.4 * k, by + 4.2 * k, x - rx * 0.2, by + 1.8 * k], shade(metal, -0.22));
  poly(ctx, [x - rx * 0.6, by - 1.6 * k, x - rx - 4.4 * k, by + 3.2 * k, x - rx - 4 * k, by + 2.4 * k, x - rx * 0.4, by - 1.2 * k], shade(metal, 0.2));
  dome(ctx, x, by, rx, 7.4 * k, metal);
  ellipse(ctx, x + 0.2 * k, by + 0.4 * k, rx, 1.6 * k, shade(metal, -0.12));
  ellipse(ctx, x, by, rx, 1.4 * k, metal);
  if (visor) { // the visor down to the nose, with the sight slit
    poly(ctx, [x + 0.6 * k, by - 0.4 * k, x + rx + 0.4 * k, by - 2.6 * k, x + rx + 0.6 * k, by + 2.6 * k, x + 0.6 * k, by + 4.6 * k], shade(metal, -0.06));
    line(ctx, x + 1.2 * k, by + 1.6 * k, x + rx, by - 0.4 * k, IRON_D, 0.7 * k);
  }
  line(ctx, x - rx * 0.5, by - 4.6 * k, x - rx * 0.1, by - 6.6 * k, STEEL_L, 0.6 * k);
  for (const d of [-0.6, 0, 0.6]) ellipse(ctx, x + d * rx, by + 0.6 * k + Math.abs(d) * -0.4 * k, 0.35 * k, 0.35 * k, GOLD_L); // brass rivets
  if (plume) for (let i = 0; i < 3; i++) curve(ctx, x - 1 * k, by - 7 * k, x - 3 * k - i * 0.6 * k, by - 13 * k + i * k, x - 8 * k - i * 0.6 * k, by - 7.6 * k + i * 1.2 * k, (1.6 - i * 0.3) * k, i % 2 ? shade(plume, -0.2) : plume);
}

/** An armet: a close round helmet with a pointed visor and a gilt crest, white and red ostrich plumes rising behind. */
function armet(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const metal = '#d8dce2', hh = 10.5 * k, hy = top + hh, w = hw + 1.6 * k, h = hh + 1.4 * k, cy = hy + 0.6 * k;
  // the plumes first, behind the bowl
  const px = x - 1.6 * k, py = cy - h - 3 * k;
  for (let i = 0; i < 5; i++) curve(ctx, px, py, px - 3 * k - i * 0.8 * k, py - 9 * k + i * 1.2 * k, px - 10 * k - i * 0.6 * k, py - 2 * k + i * 1.6 * k, (2 - i * 0.2) * k, i % 2 ? RED : WHITE);
  faceQuad(ctx, 'L', x, cy, w, h, 0, 1, 0, 1, metal);
  faceQuad(ctx, 'R', x, cy, w, h, 0, 1, 0, 1, metal);
  boxTop(ctx, x, cy - h, w, shade(metal, 0.18));
  dome(ctx, x, cy - h + 0.4 * k, w / 2, 3.8 * k, metal);
  // the visor: a beak over the face, with the sight and breaths
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, cy, w, h, u0, u1, v0, v1, c);
  R(0.06, 0.94, 0.2, 0.74, shade(metal, 0.1));
  R(0.1, 0.9, 0.58, 0.64, IRON_D);
  for (let i = 0; i < 3; i++) R(0.6, 0.64, 0.26 + i * 0.1, 0.32 + i * 0.1, IRON_D);
  const [bx, by] = faceP('R', x, cy, w, h, 0.5, 0.42);
  poly(ctx, [bx - 1.6 * k, by - 2 * k, bx + 3 * k, by + 0.4 * k, bx - 1.6 * k, by + 2.4 * k], shade(metal, -0.12));
  R(0, 1, 0.74, 0.8, GOLD); // gilt brow band
  R(0, 1, 0, 0.06, GOLD);
  curve(ctx, x - w * 0.4, cy - h - 0.4 * k, x, cy - h - 5 * k, x + w * 0.42, cy - h + 0.6 * k, 0.9 * k, GOLD); // the gilt comb
  ellipse(ctx, px, py + 0.6 * k, 1 * k, 1 * k, GOLD);
}

/** The red cap of the Schiavoni (and the gondoliers): a red felt cap with a turned-up band and a black tassel. */
function redCap(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const by = top + 2.6 * k, rx = hw / 2 + 0.6 * k;
  ellipse(ctx, x, by + 0.6 * k, rx, 2.2 * k, RED_D);
  poly(ctx, [x - rx, by, x - rx * 0.9, by - 4.4 * k, x - 1 * k, by - 6.2 * k, x + rx * 0.7, by - 4.6 * k, x + rx, by], RED);
  poly(ctx, [x + 0.4 * k, by + 1.8 * k, x + 0.4 * k, by - 5.8 * k, x + rx * 0.7, by - 4.6 * k, x + rx, by], shade(RED, -0.22));
  ellipse(ctx, x - 0.4 * k, by - 5.2 * k, rx * 0.7, 1.4 * k, RED_L);
  // the turned-up band
  poly(ctx, [x - rx - 0.3 * k, by + 0.4 * k, x - rx - 0.2 * k, by - 1.6 * k, x + rx + 0.2 * k, by - 1.6 * k, x + rx + 0.3 * k, by + 0.4 * k, x, by + 2.2 * k], shade(RED, -0.1));
  line(ctx, x - rx, by - 1.5 * k, x + rx, by - 1.5 * k, RED_L, 0.4 * k);
  // the tassel hanging behind
  curve(ctx, x - 1.4 * k, by - 5.8 * k, x - rx * 0.8, by - 5.4 * k, x - rx * 0.9, by - 2.6 * k, 0.5 * k, BLACK);
  ellipse(ctx, x - rx * 0.9, by - 1.8 * k, 0.6 * k, 1.1 * k, BLACK);
}

/** The stradiot's tall felt hat (a skouphia): a tall cylinder flaring a little, a fur band and a feather. */
function tallHat(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const by = top + 2.4 * k, rx = hw / 2 + 0.6 * k, ht = 11 * k;
  ellipse(ctx, x, by, rx + 0.4 * k, 2.4 * k, '#5a3a24');
  poly(ctx, [x - rx, by, x - rx * 1.06, by - ht, x + rx * 1.06, by - ht, x + rx, by], RED);
  poly(ctx, [x + 0.6 * k, by + 1.6 * k, x + 0.6 * k, by - ht + 1.6 * k, x + rx * 1.06, by - ht, x + rx, by], shade(RED, -0.24));
  ellipse(ctx, x, by - ht, rx * 1.06, 2.2 * k, RED_L);
  ellipse(ctx, x, by - ht, rx * 0.8, 1.5 * k, shade(RED, -0.1));
  poly(ctx, [x - rx - 0.4 * k, by + 0.4 * k, x - rx - 0.4 * k, by - 2.4 * k, x + rx + 0.4 * k, by - 2.4 * k, x + rx + 0.4 * k, by + 0.4 * k, x, by + 2.4 * k], '#5a3a24'); // fur band
  for (let i = 0; i < 6; i++) line(ctx, x - rx + i * (rx / 3), by - 2.2 * k, x - rx + i * (rx / 3) + 0.4 * k, by + 0.6 * k, '#7a5a3a', 0.4 * k);
  curve(ctx, x - rx * 0.6, by - ht + 1 * k, x - rx - 2 * k, by - ht - 6 * k, x - rx - 4 * k, by - ht - 2 * k, 1 * k, WHITE); // a heron feather
}

/** The corno ducale: the Doge's stiff gold-brocade cap rising to a horn at the back, over a white linen camauro. */
function corno(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const by = top + 3 * k, rx = hw / 2 + 0.8 * k;
  // the linen cuffia under it, its strings at the ears
  ellipse(ctx, x, by + 0.8 * k, rx + 0.2 * k, 2.4 * k, WHITE);
  line(ctx, x - rx * 0.4, by + 2 * k, x - rx * 0.5, by + 9 * k, LINEN, 0.8 * k);
  // the horned cap: low at the brow, swelling up and back into the rounded horn
  const pts = [x + rx, by, x + rx * 0.95, by - 3.2 * k, x + rx * 0.4, by - 5.6 * k, x - rx * 0.2, by - 7.8 * k, x - rx * 0.62, by - 9.8 * k, x - rx * 1.0, by - 9.4 * k, x - rx * 1.12, by - 6.4 * k, x - rx, by];
  poly(ctx, pts, GOLD);
  poly(ctx, [x + rx, by, x + rx * 0.95, by - 3.2 * k, x + rx * 0.4, by - 5.6 * k, x - rx * 0.1, by - 7.2 * k, x + 0.2 * k, by + 1.8 * k], shade(GOLD, -0.18));
  // the brocade: jewelled bands and a pattern of pearls
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.clip();
  curve(ctx, x - rx * 1.1, by - 9 * k, x - rx * 0.2, by - 4 * k, x + rx * 0.9, by - 2.6 * k, 0.5 * k, GOLD_D); // the seam up to the horn
  for (let i = 0; i < 10; i++) ellipse(ctx, x - rx + rand(7, i) * rx * 1.9, by - 1 * k - rand(9, i) * 7 * k, 0.35 * k, 0.35 * k, WHITE);
  ctx.restore();
  // the jewelled circlet at the brow and a cross on the front
  poly(ctx, [x - rx - 0.2 * k, by + 0.6 * k, x - rx - 0.2 * k, by - 1.6 * k, x + rx + 0.2 * k, by - 1.6 * k, x + rx + 0.2 * k, by + 0.6 * k, x, by + 2.4 * k], GOLD_D);
  for (const [d, c] of [[-0.6, RED_L], [-0.1, '#2a7ac8'], [0.4, '#2a9a5a'], [0.8, RED_L]] as const) ellipse(ctx, x + d * rx, by + 0.2 * k + d * 0.6 * k, 0.6 * k, 0.6 * k, c);
  line(ctx, x + rx * 0.5, by - 3 * k, x + rx * 0.5, by - 6 * k, GOLD_L, 0.5 * k);
  line(ctx, x + rx * 0.3, by - 4.6 * k, x + rx * 0.7, by - 4.8 * k, GOLD_L, 0.5 * k);
}

/** A merchant's soft round red beret. */
function beret(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const by = top + 2.4 * k, rx = hw / 2 + 1.6 * k;
  ellipse(ctx, x + 0.4 * k, by - 0.6 * k, rx, 3 * k, RED_D);
  ellipse(ctx, x, by - 1.4 * k, rx, 3.2 * k, RED);
  ellipse(ctx, x - rx * 0.3, by - 2.4 * k, rx * 0.5, 1.4 * k, RED_L);
  ellipse(ctx, x, by + 0.6 * k, hw / 2 + 0.2 * k, 1.4 * k, BLACK);
}

function head(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  switch (kind) {
    case 'warrior': redCap(ctx, x, top, k, hw); return;
    case 'archer': sallet(ctx, x, top, k, hw, STEEL, false); return;
    case 'rider': tallHat(ctx, x, top, k, hw); return;
    case 'defender': barbute(ctx, x, top, k, hw, STEEL); return;
    case 'swordsman': barbute(ctx, x, top, k, hw, '#d0d4da', RED); return;
    case 'knight': sallet(ctx, x, top, k, hw, '#d8dce2', true, WHITE); return;
    case 'condottiere': armet(ctx, x, top, k, hw); return;
    case 'giant': corno(ctx, x, top, k, hw); return;
    case 'explorer': beret(ctx, x, top, k, hw); return;
    default: return;
  }
}

// ---------------------------------------------------------------- weapons and shields

/** A kite shield: red, gold-rimmed, the lion of St Mark on it. (x, y) is the off hand. */
function kite(ctx: Ctx, x: number, y: number, k: number, big = false) {
  const s = big ? 1.2 : 1;
  const cx = x - 1.6 * k, cy = y - 6 * k * s, w = 5 * k * s, h = 8 * k * s;
  const pts = [cx - w, cy - h * 0.55, cx - w * 0.5, cy - h * 0.72, cx + w * 0.5, cy - h * 0.72, cx + w, cy - h * 0.55, cx + w * 0.8, cy + h * 0.2, cx, cy + h, cx - w * 0.8, cy + h * 0.2];
  ctx.save();
  ctx.translate(0.9 * k, 0.6 * k);
  poly(ctx, pts, RED_D); // its thickness
  ctx.restore();
  poly(ctx, pts, RED);
  poly(ctx, [cx, cy - h * 0.72, cx + w * 0.5, cy - h * 0.72, cx + w, cy - h * 0.55, cx + w * 0.8, cy + h * 0.2, cx, cy + h], shade(RED, -0.14));
  ctx.strokeStyle = ink(GOLD);
  ctx.lineWidth = 0.8 * k;
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.stroke();
  lion(ctx, cx + 0.2 * k, cy - h * 0.06, 1.02 * k * s);
}

/** A pavise: a tall rectangular shield with a raised central spine, painted red with the lion of St Mark. */
function pavise(ctx: Ctx, x: number, y: number, k: number, s = 1) {
  const cx = x - 2 * k, top = y - 15 * k * s, bot = y + 5 * k * s, w = 5.6 * k * s;
  const pts = [cx - w, top + 1.4 * k, cx, top, cx + w, top + 1.4 * k, cx + w, bot - 1 * k, cx, bot, cx - w, bot - 1 * k];
  ctx.save();
  ctx.translate(1 * k, 0.6 * k);
  poly(ctx, pts, WOOD_D);
  ctx.restore();
  poly(ctx, pts, RED);
  poly(ctx, [cx, top, cx + w, top + 1.4 * k, cx + w, bot - 1 * k, cx, bot], shade(RED, -0.18));
  // the spine
  poly(ctx, [cx - 1 * k, top + 0.8 * k, cx + 1 * k, top + 0.8 * k, cx + 1 * k, bot - 0.6 * k, cx - 1 * k, bot - 0.6 * k], shade(RED, 0.12));
  line(ctx, cx + 1, top + 0.8 * k, cx + 1, bot - 0.6 * k, RED_D, 0.4 * k);
  // a gold border and the lion over a blue chief
  ctx.strokeStyle = ink(GOLD);
  ctx.lineWidth = 0.8 * k;
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.stroke();
  poly(ctx, [cx - w + 0.6 * k, top + 1.8 * k, cx, top + 0.6 * k, cx + w - 0.6 * k, top + 1.8 * k, cx + w - 0.6 * k, top + 4 * k * s, cx - w + 0.6 * k, top + 4 * k * s], BLUE);
  for (let i = 0; i < 3; i++) ellipse(ctx, cx - w * 0.5 + i * w * 0.5, top + 2.8 * k * s, 0.5 * k, 0.5 * k, GOLD_L); // gold stars on the chief
  lion(ctx, cx + 0.3 * k, top + (bot - top) * 0.56, 1.25 * k * s);
}

/** A spear (a light ash shaft, a leaf blade, a red tassel). */
function spear(ctx: Ctx, x: number, y: number, k: number, len = 30) {
  const x0 = x - 2.4 * k, y0 = y + 7 * k, x1 = x + 3.6 * k, y1 = y - (len - 7) * k;
  line(ctx, x0, y0, x1, y1, WOOD, 1.1 * k);
  line(ctx, x0 - 0.4 * k, y0, x1 - 0.4 * k, y1, shade(WOOD, 0.4), 0.35 * k);
  poly(ctx, [x1 + 0.6 * k, y1 - 5.6 * k, x1 - 1 * k, y1 - 1 * k, x1 + 0.1 * k, y1 + 0.8 * k, x1 + 1.4 * k, y1 - 0.6 * k], STEEL_L);
  poly(ctx, [x1 + 0.6 * k, y1 - 5.6 * k, x1 + 1.4 * k, y1 - 0.6 * k, x1 + 0.1 * k, y1 + 0.8 * k], STEEL_D);
  ellipse(ctx, x1 - 0.2 * k, y1 + 1.6 * k, 0.9 * k, 1.2 * k, RED);
  ellipse(ctx, x1 - 0.1 * k, y1 + 0.9 * k, 0.6 * k, 0.4 * k, GOLD);
}

/** A straight arming sword with a cross guard and a gilt pommel. */
function sword(ctx: Ctx, x: number, y: number, k: number, len = 15) {
  const tx = x + len * 0.25 * k, ty = y - len * k;
  poly(ctx, [x - 1 * k, y - 1.6 * k, tx - 0.2 * k, ty + 1.4 * k, tx + 0.2 * k, ty, x + 0.2 * k, y - 2 * k], STEEL_L);
  poly(ctx, [x + 1 * k, y - 1.4 * k, tx + 0.5 * k, ty + 1.4 * k, tx + 0.2 * k, ty, x + 0.2 * k, y - 2 * k], '#9aa2ac');
  line(ctx, x + 0.2 * k, y - 2.4 * k, tx, ty + 1.6 * k, STEEL_D, 0.3 * k);
  line(ctx, x - 3 * k, y - 1 * k, x + 3.2 * k, y - 2.6 * k, GOLD_D, 1 * k); // cross guard
  line(ctx, x, y - 1.6 * k, x - 0.4 * k, y + 2.2 * k, '#3a2414', 1.3 * k);
  ellipse(ctx, x - 0.5 * k, y + 2.8 * k, 1.1 * k, 1.1 * k, GOLD);
}

/** A crossbow, held across the body: a stock, a steel bow (lath) with its string, the stirrup at the nose and a bolt. */
function crossbow(ctx: Ctx, x: number, y: number, k: number) {
  const bx = x - 5 * k, by = y + 2 * k, nx = x + 7 * k, ny = y - 8 * k; // butt at the shoulder, nose ahead and up
  line(ctx, bx, by, nx, ny, '#6a3c1c', 1.6 * k);
  line(ctx, bx, by - 0.5 * k, nx, ny - 0.5 * k, '#9a6430', 0.5 * k);
  const ux = (nx - bx) / Math.hypot(nx - bx, ny - by), uy = (ny - by) / Math.hypot(nx - bx, ny - by);
  const px = -uy, py = ux; // across
  const lx = nx - ux * 1.6 * k, ly = ny - uy * 1.6 * k;
  // the lath, bent back
  curve(ctx, lx + px * 7 * k, ly + py * 7 * k, lx + ux * 2.4 * k, ly + uy * 2.4 * k, lx - px * 7 * k, ly - py * 7 * k, 1 * k, STEEL);
  // the string drawn back to the nut
  const sx = nx - ux * 7 * k, sy = ny - uy * 7 * k;
  line(ctx, lx + px * 7 * k, ly + py * 7 * k, sx, sy, '#e8e0c8', 0.35 * k);
  line(ctx, lx - px * 7 * k, ly - py * 7 * k, sx, sy, '#e8e0c8', 0.35 * k);
  // the bolt in the groove
  line(ctx, sx, sy, nx + ux * 2 * k, ny + uy * 2 * k, '#c8a878', 0.5 * k);
  poly(ctx, [nx + ux * 3.4 * k, ny + uy * 3.4 * k, nx + ux * 1.8 * k + px * 0.8 * k, ny + uy * 1.8 * k + py * 0.8 * k, nx + ux * 1.8 * k - px * 0.8 * k, ny + uy * 1.8 * k - py * 0.8 * k], STEEL_D);
  // the stirrup
  ctx.strokeStyle = ink(IRON);
  ctx.lineWidth = 0.6 * k;
  ctx.beginPath();
  ctx.ellipse(nx + ux * 1.2 * k, ny + uy * 1.2 * k, 1.4 * k, 1 * k, Math.atan2(uy, ux), -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  // the trigger lever under the stock
  line(ctx, bx + ux * 4 * k, by + uy * 4 * k, bx + ux * 2 * k - px * 2.4 * k, by + uy * 2 * k - py * 2.4 * k, IRON, 0.5 * k);
}

/** A tall staff flying the gonfalon of St Mark (the Doge's vessillo). */
function vessillo(ctx: Ctx, x: number, y: number, k: number) {
  const x0 = x - 1 * k, y0 = y + 8 * k, x1 = x + 1.4 * k, y1 = y - 30 * k;
  line(ctx, x0, y0, x1, y1, GOLD_D, 1.1 * k);
  line(ctx, x0 - 0.3 * k, y0, x1 - 0.3 * k, y1, GOLD_L, 0.4 * k);
  ellipse(ctx, x1, y1 - 1 * k, 1.2 * k, 1.2 * k, GOLD);
  line(ctx, x1 - 0.5 * k, y1 + 1.4 * k, x1 + 13 * k, y1 + 1.4 * k, GOLD_D, 0.6 * k);
  gonfalon(ctx, x1, y1 + 1.6 * k, 12.6 * k, 10 * k, 0.6);
}

/** The commander's baton: short, red velvet studded with gold, gilt ends. */
function baton(ctx: Ctx, x: number, y: number, k: number) {
  line(ctx, x - 1 * k, y + 1 * k, x + 3 * k, y - 8 * k, RED, 1.6 * k);
  for (let i = 1; i < 4; i++) ellipse(ctx, x - 1 * k + i * k, y + 1 * k - i * 2.25 * k, 0.4 * k, 0.4 * k, GOLD_L);
  ellipse(ctx, x + 3 * k, y - 8 * k, 1 * k, 1 * k, GOLD);
  ellipse(ctx, x - 1 * k, y + 1 * k, 1 * k, 1 * k, GOLD);
}

function weapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  switch (kind) {
    case 'warrior': spear(ctx, x, y, k, 28); kite(ctx, b.off.x, b.off.y, k * 0.86); return true;
    case 'archer': crossbow(ctx, x, y, k); return true;
    case 'defender': spear(ctx, x, y, k, 36); return true; // the pavise is drawn by the shield hook
    case 'swordsman': sword(ctx, x, y, k, 15); kite(ctx, b.off.x, b.off.y, k); return true;
    case 'giant': vessillo(ctx, x, y, k); return true;
    case 'explorer': // a walking staff and a merchant's ledger
      line(ctx, x - 1.6 * k, y + 8 * k, x + 2.4 * k, y - 16 * k, WOOD, 1 * k);
      box(ctx, b.off.x - 0.6 * k, b.off.y, 3 * k, 4 * k, '#6a2a1a', '#e8dcc0');
      return true;
    case 'condottiere': baton(ctx, x, y, k); return true;
    default: return false;
  }
}

// ---------------------------------------------------------------- horsemen

const HK = 0.95;

/** The leg of a rider in the stirrup. */
function boot(ctx: Ctx, sx: number, sy: number, hose: string, armour: string | null) {
  poly(ctx, [sx + 0.4, sy + 0.4, sx + 4, sy + 0.6, sx + 4.6, sy + 5, sx + 2.2, sy + 5.4], armour ?? hose);
  poly(ctx, [sx + 2.2, sy + 5.4, sx + 4.6, sy + 5, sx + 4.4, sy + 10, sx + 2.2, sy + 10.2], armour ?? '#3a2a20');
  poly(ctx, [sx + 2.2, sy + 10, sx + 4.8, sy + 9.8, sx + 6, sy + 11, sx + 2.2, sy + 11.2], armour ? shade(armour, -0.3) : '#2a1c14');
  if (armour) ellipse(ctx, sx + 3.6, sy + 5.2, 1.1, 0.9, shade(armour, 0.3)); // the knee cop
  line(ctx, sx + 1.8, sy + 11.4, sx + 5, sy + 11.2, STEEL_D, 0.6);
}

/** A caparison over the horse: red and gold, with the lion on the flank and a fringed hem; a steel chamfron with a plume. */
function caparison(ctx: Ctx, x: number, y: number, cloth: string, lionToo: boolean, plumes: string[]) {
  const bx = x - 1, by = y + 3 - 6 * HK, bw = 17 * HK, bh = 7 * HK;
  for (const f of ['L', 'R'] as const) {
    faceQuad(ctx, f, bx, by, bw, bh, 0, 1, -0.4, 0.98, cloth);
    faceQuad(ctx, f, bx, by, bw, bh, 0, 1, -0.4, -0.26, GOLD);
    for (let i = 0; i < 8; i++) faceQuad(ctx, f, bx, by, bw, bh, i / 8 + 0.02, i / 8 + 0.08, -0.5, -0.4, GOLD_D);
    faceQuad(ctx, f, bx, by, bw, bh, 0, 1, 0.86, 0.98, GOLD);
  }
  if (lionToo) { const [lx, ly] = faceP('L', bx, by, bw, bh, 0.5, 0.36); lion(ctx, lx, ly, 0.9); }
  // the chamfron over the face
  const hx = x - 1 + 10.5 * HK, hy = y + 3 - 15 * HK;
  faceQuad(ctx, 'R', hx, hy, 7 * HK, 5 * HK, 0.08, 0.72, 0.3, 0.98, STEEL);
  faceQuad(ctx, 'R', hx, hy, 7 * HK, 5 * HK, 0.36, 0.46, 0.3, 0.98, GOLD);
  plumes.forEach((c, i) => curve(ctx, hx + 0.4, hy - 4.6, hx + (i - 1) * 1.2 - 0.6, hy - 8.6, hx + (i - 1) * 1.6 - 2.6, hy - 10.6, 0.9, c));
}

/** A long light lance with a small pennon in red and gold. */
function lance(ctx: Ctx, x: number, y: number, len: number, pennon: 'red' | 'lion' | 'none') {
  const x0 = x - 3, y0 = y + 8, x1 = x + 5.6, y1 = y - len;
  line(ctx, x0, y0, x1, y1, '#8a5a30', 1.2);
  line(ctx, x0 - 0.4, y0, x1 - 0.4, y1, '#b8844a', 0.4);
  poly(ctx, [x1 + 0.6, y1 - 4.6, x1 - 0.7, y1 - 0.4, x1 + 0.2, y1 + 0.7, x1 + 1.3, y1 - 0.2], STEEL_L);
  poly(ctx, [x1 + 0.6, y1 - 4.6, x1 + 1.3, y1 - 0.2, x1 + 0.2, y1 + 0.7], STEEL_D);
  if (pennon === 'red') {
    poly(ctx, [x1 - 0.2, y1 + 2, x1 + 8.4, y1 + 3.2, x1 + 5.4, y1 + 4.4, x1 + 8.4, y1 + 5.6, x1 - 0.6, y1 + 5.4], RED);
    poly(ctx, [x1 - 0.2, y1 + 2, x1 + 8.4, y1 + 3.2, x1 + 7.4, y1 + 3.6, x1 - 0.3, y1 + 3], GOLD);
  } else if (pennon === 'lion') {
    line(ctx, x1 - 0.4, y1 + 1.6, x1 + 10, y1 + 1.6 - 0.2, GOLD_D, 0.5);
    gonfalon(ctx, x1 - 0.2, y1 + 1.8, 10, 8, 0.8);
  }
}

/** The stradiot: a Balkan light horseman on a small grey, a tall hat, a long lance (asta) and a little shield. */
function stradiot(ctx: Ctx, x: number, y: number) {
  const saddle = drawHorse(ctx, x - 1, y + 3, HK * 0.94, '#bcb4a8', '#4a3a30', undefined, RED);
  // a striped saddle cloth
  poly(ctx, [saddle.x - 5.6, saddle.y - 0.6, saddle.x + 3.6, saddle.y - 0.6, saddle.x + 3.2, saddle.y + 5.4, saddle.x - 5.2, saddle.y + 6.4], RED);
  for (let i = 0; i < 3; i++) line(ctx, saddle.x - 5.4, saddle.y + 1.6 + i * 1.6, saddle.x + 3.4, saddle.y + 1.2 + i * 1.5, i % 2 ? GOLD : BLUE, 0.6);
  const b = figure(ctx, 'rider', 'venice', saddle.x, saddle.y, 0.9, true);
  boot(ctx, saddle.x, saddle.y, '#5a3a2a', null);
  kite(ctx, b.off.x - 0.8, b.off.y + 2, 0.56);
  lance(ctx, b.hand.x, b.hand.y, 36, 'red');
}

/** A man-at-arms: plate on a barded horse, a lance and a kite shield. */
function manAtArms(ctx: Ctx, x: number, y: number) {
  const saddle = drawHorse(ctx, x - 1, y + 3, HK, '#e2ded6', '#c8c4bc', undefined, RED);
  caparison(ctx, x, y, RED, false, [WHITE, RED, WHITE]);
  const b = figure(ctx, 'knight', 'venice', saddle.x, saddle.y, 0.9, true);
  boot(ctx, saddle.x, saddle.y, STEEL, STEEL);
  kite(ctx, b.off.x - 1, b.off.y + 2, 0.62);
  lance(ctx, b.hand.x, b.hand.y, 32, 'lion');
}

/** The Condottiere: a red cloak edged in gold behind him, gilded plate, a plumed armet, a baton, a barded bay horse. */
function condottiere(ctx: Ctx, x: number, y: number) {
  const saddle = drawHorse(ctx, x - 1, y + 3, HK, '#7a4224', '#1e140e', undefined, RED);
  caparison(ctx, x, y, RED, true, [WHITE, GOLD, RED, WHITE]);
  // the cloak streaming back from the shoulders, drawn before the man
  const sx = saddle.x, sy = saddle.y;
  poly(ctx, [sx - 1, sy - 13, sx - 3, sy - 14, sx - 12, sy - 2, sx - 13, sy + 5, sx - 6, sy + 2], RED_D);
  poly(ctx, [sx - 1, sy - 13, sx - 4, sy - 12, sx - 11, sy - 1, sx - 13, sy + 5, sx - 9.4, sy + 0.6], RED);
  line(ctx, sx - 13, sy + 5, sx - 6, sy + 2, GOLD, 1);
  line(ctx, sx - 3, sy - 14, sx - 12.6, sy - 1.6, GOLD, 0.6);
  const b = figure(ctx, 'condottiere', 'venice', sx, sy, 0.92, true);
  boot(ctx, sx, sy, STEEL, '#d8dce2');
  // a sword at his hip, a gilt hilt
  line(ctx, sx - 3.6, sy + 2, sx - 9, sy + 7.6, STEEL_D, 1);
  line(ctx, sx - 3, sy + 1.2, sx - 4.6, sy + 2.8, GOLD, 1.2);
  baton(ctx, b.hand.x, b.hand.y, 0.95);
  // a small gonfalon of the company on a staff at his back
  line(ctx, sx - 4, sy - 2, sx - 6, sy - 32, WOOD_D, 0.8);
  gonfalon(ctx, sx - 6, sy - 31, 9, 7, 0.4);
}

// ---------------------------------------------------------------- the bombard

function bombard(ctx: Ctx, x: number, y: number) {
  // stone balls piled ready and a powder cask
  for (const [ax, ay, ar] of [[-14, 6, 2], [-10.8, 6.6, 2], [-12.4, 4.2, 1.9]] as const) {
    ellipse(ctx, x + ax, y + ay, ar, ar, '#b8b0a0');
    ellipse(ctx, x + ax - 0.5, y + ay - 0.6, ar * 0.4, ar * 0.35, '#e0d8c8');
  }
  box(ctx, x + 14, y + 6, 3.8, 4.2, '#7a5230', '#9a6a40');
  band(ctx, x + 14, y + 6, 3.8, 4.2, 0.2, 0.32, IRON_D);
  band(ctx, x + 14, y + 6, 3.8, 4.2, 0.7, 0.82, IRON_D);
  // the timber bed (a sledge), staked to the ground
  poly(ctx, [x - 12, y + 4, x + 8, y - 4, x + 11, y - 2.4, x - 9, y + 6], WOOD_D);
  poly(ctx, [x - 12, y + 4, x + 8, y - 4, x + 8.6, y - 3, x - 11, y + 4.8], WOOD);
  for (const [px, py] of [[-10, 6], [9, -1.6]] as const) line(ctx, x + px, y + py - 2, x + px, y + py + 1.6, WOOD_D, 1);
  // the barrel: a short, fat iron tube built of hooped staves, the wide mouth up and to the right
  const b0: [number, number] = [x - 8, y - 1], b1: [number, number] = [x + 10, y - 9.6];
  const dx = b1[0] - b0[0], dy = b1[1] - b0[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const P = (t: number, o: number): [number, number] => [b0[0] + ux * t + nx * o, b0[1] + uy * t + ny * o];
  // the narrower powder chamber at the back
  poly(ctx, [...P(-6, -2.6), ...P(0, -2.6), ...P(0, 2.6), ...P(-6, 2.6)], IRON);
  poly(ctx, [...P(-6, -2.6), ...P(0, -2.6), ...P(0, -1), ...P(-6, -1)], IRON_L);
  ellipse(ctx, ...P(-6, 0), 1.6, 2.6, IRON_D);
  // the great barrel
  poly(ctx, [...P(0, -4.6), ...P(len, -5), ...P(len, 5), ...P(0, 4.6)], IRON);
  poly(ctx, [...P(0, -4.6), ...P(len, -5), ...P(len, -2.2), ...P(0, -2)], IRON_L);
  poly(ctx, [...P(0, 3), ...P(len, 3.2), ...P(len, 5), ...P(0, 4.6)], IRON_D);
  for (let i = 0; i <= 6; i++) { const t = (len * i) / 6; line(ctx, ...P(t, -5 - (i === 6 ? 0.4 : 0)), ...P(t, 5 + (i === 6 ? 0.4 : 0)), IRON_D, i === 0 || i === 6 ? 1.6 : 1); } // the hoops
  for (let i = 0; i < 6; i++) { const t = (len * (i + 0.5)) / 6; line(ctx, ...P(t, -4.2), ...P(t, -3.4), '#a8aeb8', 0.5); }
  // the mouth
  ellipse(ctx, ...P(len + 0.2, 0), 3, 5.4, IRON_D);
  ellipse(ctx, ...P(len + 0.5, 0), 2.4, 4.4, '#141416');
  ellipse(ctx, ...P(len + 0.2, -1), 1.2, 2, '#9a9284'); // the stone ball inside
  // ropes lashing it to the bed
  for (const t of [len * 0.25, len * 0.7]) { const [a, c] = [P(t, -5.4), P(t, 5.4)]; line(ctx, a[0], a[1], c[0], c[1] + 2, '#b89a6a', 0.8); }
  // a mantlet behind the gun: a timber screen painted with the lion
  const mx = x - 19, my = y + 2;
  line(ctx, mx + 1, my + 2, mx + 3, my - 16, WOOD_D, 0.9);
  poly(ctx, [mx - 4, my - 13, mx + 4, my - 16, mx + 4, my + 2, mx - 4, my + 5], RED);
  poly(ctx, [mx - 4, my - 13, mx - 2.6, my - 13.5, mx - 2.6, my + 4.5, mx - 4, my + 5], RED_D);
  for (let i = 1; i < 4; i++) line(ctx, mx - 4 + i * 2, my - 13 - i * 0.75, mx - 4 + i * 2, my + 5 - i * 0.75, RED_D, 0.3);
  lion(ctx, mx + 0.3, my - 5.4, 1.05);
  // the gunner with a linstock, in his red cap
  const g = figure(ctx, 'warrior', 'venice', x - 9, y + 9, 0.56);
  line(ctx, g.hand.x - 1, g.hand.y + 4, g.hand.x + 4, g.hand.y - 7, WOOD, 0.7);
  ellipse(ctx, g.hand.x + 4.2, g.hand.y - 7.4, 0.6, 0.6, '#ff7a2a');
  curve(ctx, g.hand.x + 4.2, g.hand.y - 8, g.hand.x + 2.6, g.hand.y - 10.6, g.hand.x + 4.2, g.hand.y - 13, 0.6, 'rgba(220,220,220,0.6)');
}

// ---------------------------------------------------------------- the crossbowman

/** A crossbowman stepping out from behind his pavise, planted on its spike, the crossbow levelled. */
function balestriere(ctx: Ctx, x: number, y: number) {
  pavise(ctx, x - 6.4, y + 1.6, 1, 0.92);
  line(ctx, x - 8.4, y + 6.4, x - 8.6, y + 8, IRON_D, 0.8); // its spike in the ground
  curve(ctx, x + 4, y - 9, x + 6.6, y - 6, x + 5.6, y - 2.6, 2.6, '#6a4422'); // the bolt bag at his hip
  for (let i = 0; i < 3; i++) line(ctx, x + 4.4 + i * 0.7, y - 9.6, x + 5 + i * 0.9, y - 12, '#e8dcc0', 0.5);
  const b = figure(ctx, 'archer', 'venice', x + 1, y, 1);
  crossbow(ctx, b.hand.x, b.hand.y, 1);
}

// ---------------------------------------------------------------- ships

function wake(ctx: Ctx, x: number, y: number, w: number) {
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y, w, 2.2, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.stroke();
}

/** A lateen sail: a triangle hung from a long slanting yard, cream with a red band (or the lion). */
function lateen(ctx: Ctx, mx: number, my: number, h: number, span: number, look: 'band' | 'lion' | 'plain') {
  const ya: [number, number] = [mx - span * 0.62, my + h * 0.18], yb: [number, number] = [mx + span * 0.5, my - h * 0.95];
  line(ctx, ya[0], ya[1], yb[0], yb[1], WOOD_D, 1);
  const foot: [number, number] = [mx + span * 0.44, my + h * 0.04];
  const pts = [ya[0] + 0.6, ya[1] - 0.2, yb[0] - 0.4, yb[1] + 0.6, foot[0] + 1.6, foot[1] - 0.8];
  poly(ctx, pts, '#f2ead6');
  poly(ctx, [mx, my - h * 0.4, yb[0] - 0.4, yb[1] + 0.6, foot[0] + 1.6, foot[1] - 0.8], '#ddd3bc');
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  ctx.lineTo(pts[2], pts[3]);
  ctx.lineTo(pts[4], pts[5]);
  ctx.closePath();
  ctx.clip();
  if (look === 'band') for (const t of [0.42, 0.62]) line(ctx, ya[0] + (yb[0] - ya[0]) * t, ya[1] + (yb[1] - ya[1]) * t, foot[0] + (yb[0] - foot[0]) * (t - 0.3), foot[1] + (yb[1] - foot[1]) * (t - 0.3), RED, h * 0.07);
  if (look === 'lion') { // a great red field with the gold lion
    ellipse(ctx, mx + span * 0.08, my - h * 0.32, h * 0.26, h * 0.24, RED);
    lion(ctx, mx + span * 0.08 + 0.4, my - h * 0.3, h * 0.05);
  }
  ctx.restore();
}

/** A long low hull seen side-on: `top(t)` gives the gunwale height (t from -1 stern to 1 bow). */
function hull(ctx: Ctx, x: number, y: number, w: number, top: (t: number) => number, body: string, strake: string, trim: string) {
  const near: [number, number][] = [];
  for (let i = 0; i <= 12; i++) { const t = -1 + i / 6; near.push([x + t * w, top(t)]); }
  const far = near.map(([a, b], i) => [a + (i === 0 ? 1.8 : i === 12 ? -1.8 : 0), b - 2] as [number, number]);
  poly(ctx, [...near.flat(), ...[...far].reverse().flat()], shade(body, -0.35)); // the deck inside
  return {
    near,
    draw: () => {
      poly(ctx, [...near.flat(), x + w * 0.88, y - 0.4, x + w * 0.5, y + 2.4, x, y + 3, x - w * 0.5, y + 2.6, x - w * 0.94, y - 0.4], body);
      ctx.strokeStyle = ink(strake);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      near.forEach(([a, b], i) => (i ? ctx.lineTo(a, b + 1.2) : ctx.moveTo(a, b + 1.2)));
      ctx.stroke();
      ctx.strokeStyle = ink(trim);
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      near.forEach(([a, b], i) => (i ? ctx.lineTo(a, b + 2.5) : ctx.moveTo(a, b + 2.5)));
      ctx.stroke();
      line(ctx, x - w * 0.92, y - 0.4, x + w * 0.86, y - 0.6, shade(body, -0.4), 0.7); // the waterline
    },
  };
}

/** Banks of oars down into the sea, in groups (alla sensile), from the outrigger at `top(t)`. */
function oars(ctx: Ctx, x: number, w: number, top: (t: number) => number, y: number, n: number, per: number, t0: number, t1: number) {
  for (let i = 0; i < n; i++) {
    const t = t0 + ((t1 - t0) * i) / (n - 1);
    for (let j = 0; j < per; j++) {
      const ox = x + t * w + j * 0.7, oy = top(t) + 2;
      line(ctx, ox, oy, ox - 3.6 + j * 0.3, y + 4.6, j === 0 ? '#c8a878' : '#a88858', 0.5);
    }
  }
  for (let i = 0; i < n; i++) { const t = t0 + ((t1 - t0) * i) / (n - 1); ellipse(ctx, x + t * w - 3.6, y + 4.8, 1.2, 0.4, 'rgba(255,255,255,0.6)'); } // the splashes
}

/** The gondola: long, black, lopsided, rising at both ends; the ferro on its prow; the gondolier at the stern with his oar. */
function gondola(ctx: Ctx, x: number, y: number) {
  const w = 19;
  const top = (t: number) => y - 2.4 - (t < 0 ? Math.pow(-t, 3) * 5 : Math.pow(t, 4) * 7);
  const near: [number, number][] = [];
  for (let i = 0; i <= 16; i++) { const t = -1 + i / 8; near.push([x + t * w, top(t)]); }
  poly(ctx, [...near.flat(), ...[...near].reverse().map(([a, b]) => [a, b - 1.6] as [number, number]).flat()], '#2a2a30'); // the inside
  // the felze: a small black cabin amidships, with a little window
  box(ctx, x - 1, y - 3, 7, 4.4, '#141418', '#2a2a32');
  faceQuad(ctx, 'R', x - 1, y - 3, 7, 4.4, 0.3, 0.7, 0.3, 0.7, '#3a3a44');
  ellipse(ctx, x - 1, y - 9, 0.6, 0.6, GOLD);
  // the gondolier on the stern deck, rowing from the forcola
  const g = figure(ctx, 'warrior', 'venice', x - w * 0.74, y - 4.4, 0.42);
  // the hull itself
  poly(ctx, [...near.flat(), x + w * 0.9, y - 0.4, x + w * 0.4, y + 1.6, x - w * 0.4, y + 1.8, x - w * 0.9, y - 0.2], BLACK);
  ctx.strokeStyle = ink('#4a4a54');
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  near.forEach(([a, b], i) => (i ? ctx.lineTo(a, b + 0.6) : ctx.moveTo(a, b + 0.6)));
  ctx.stroke();
  // the ferro: a curved steel blade on the prow with six teeth forward and one back
  const [fx, fy] = near[16];
  poly(ctx, [fx - 1, fy + 1, fx + 0.6, fy - 6.4, fx + 2.6, fy - 7.2, fx + 2, fy - 5.6, fx + 1.4, fy + 1.2], STEEL_L);
  for (let i = 0; i < 6; i++) line(ctx, fx + 1.2 - i * 0.06, fy - 4.6 + i * 1, fx + 3.4, fy - 4.4 + i * 1, STEEL, 0.55);
  line(ctx, fx - 0.4, fy - 1.6, fx - 2, fy - 1.4, STEEL, 0.6);
  // the stern curl
  const [sx, sy] = near[0];
  poly(ctx, [sx, sy + 1, sx - 0.6, sy - 2.4, sx + 0.8, sy - 2, sx + 1.4, sy + 1], BLACK);
  // the forcola and the long oar dipping into the water ahead of him
  line(ctx, x - w * 0.62, top(-0.62) + 0.2, x - w * 0.62, top(-0.62) - 2.4, '#6a4a2a', 0.9);
  line(ctx, g.hand.x - 2, g.hand.y - 2, x - w * 0.2, y + 4.6, '#c8a878', 0.7);
  ellipse(ctx, x - w * 0.2, y + 4.8, 1.4, 0.5, 'rgba(255,255,255,0.6)');
  wake(ctx, x, y + 2.6, w * 0.8);
}

/** The merchant galley (galea grossa): a deeper red-and-gold hull, two lateen masts, bales on deck, a few oars, a stern house. */
function merchantGalley(ctx: Ctx, x: number, y: number) {
  const w = 22;
  const top = (t: number) => y - 4.6 - (t < 0 ? Math.pow(-t, 2) * 4.6 : Math.pow(t, 3) * 3);
  const h = hull(ctx, x, y, w, top, '#6a3a1c', RED, GOLD);
  line(ctx, x + 4, y - 4, x + 4, y - 32, WOOD_D, 1.2);
  line(ctx, x - 8, y - 4, x - 8, y - 24, WOOD_D, 1);
  lateen(ctx, x - 8, y - 11, 12, 13, 'plain');
  lateen(ctx, x + 4, y - 14, 17, 19, 'band');
  poly(ctx, [x + 4, y - 32, x + 11, y - 31, x + 4, y - 29.6], RED); // a streamer
  // bales of cloth and spice on the deck
  for (const [dx, c] of [[-2, '#d8c8a0'], [1.6, '#b8945a'], [7, '#d8c8a0'], [10.4, '#c8a878']] as const) {
    box(ctx, x + dx, top((dx) / w) + 0.6, 3.2, 2.6, c, shade(c, 0.12));
    band(ctx, x + dx, top((dx) / w) + 0.6, 3.2, 2.6, 0.4, 0.52, '#6a4a2a');
  }
  h.draw();
  oars(ctx, x, w, top, y, 6, 1, -0.4, 0.5);
  // the stern house with its red awning and a lantern
  box(ctx, x - w * 0.72, top(-0.72) + 0.4, 7, 3.6, '#7a4a26', '#9a6a40');
  roof(ctx, x - w * 0.72, top(-0.72) - 3.2, 8, 3, RED);
  line(ctx, x - w - 0.6, top(-1) - 1, x - w - 0.6, top(-1) - 6, WOOD_D, 0.6);
  ellipse(ctx, x - w - 0.6, top(-1) - 7, 1, 1.4, '#ffd060');
  figure(ctx, 'explorer', 'venice', x - w * 0.5, top(-0.5) - 0.6, 0.36, true);
  line(ctx, x + w * 0.9, top(0.9) - 1.6, x + w + 6, top(1) - 6, WOOD_D, 0.9); // the bowsprit
  line(ctx, x - w + 1.4, top(-1) + 1.4, x - w - 1.4, y + 4.4, WOOD, 1.1); // the rudder
  wake(ctx, x, y + 3.2, w * 0.86);
}

/** The war galley (galea sottile): long, low and fast, a spur at the bow, many oars, one great lateen with the lion,
 *  a red awning over the stern, the commander's great gilt lantern on the stern post and the gonfalon above. */
function warGalley(ctx: Ctx, x: number, y: number) {
  const w = 28;
  const top = (t: number) => y - 4 - (t < 0 ? Math.pow(-t, 2.4) * 4 : Math.pow(t, 3) * 1.6);
  const h = hull(ctx, x, y, w, top, '#3a2418', RED, GOLD);
  // the mast, the great lateen and the gonfalon at the masthead
  line(ctx, x + 6, y - 4, x + 6, y - 40, WOOD_D, 1.3);
  lateen(ctx, x + 6, y - 16, 22, 28, 'lion');
  line(ctx, x + 6, y - 40, x + 6, y - 44, WOOD_D, 0.8);
  line(ctx, x + 5.6, y - 43.6, x + 16, y - 43.6, GOLD_D, 0.6);
  gonfalon(ctx, x + 6, y - 43.4, 10, 7.6, 0.9);
  // the corsia (the gangway) with marines along it
  figure(ctx, 'warrior', 'venice', x + 4, top(0.14) - 0.4, 0.34, true);
  figure(ctx, 'archer', 'venice', x + w * 0.7, top(0.7) - 1.6, 0.34, true);
  h.draw();
  oars(ctx, x, w, top, y, 13, 3, -0.6, 0.62);
  // the outrigger rail (the apostis) the oars pivot on
  ctx.strokeStyle = ink('#c8a060');
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) { const t = -0.66 + i * 0.132, px = x + t * w, py = top(t) + 1.8; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
  ctx.stroke();
  // the rambade (the fighting platform at the bow) and the long spur
  box(ctx, x + w * 0.78, top(0.78) + 0.6, 6, 2.6, '#6a3a1c', '#8a5a30');
  band(ctx, x + w * 0.78, top(0.78) + 0.6, 6, 2.6, 0.5, 0.7, RED);
  poly(ctx, [x + w * 0.92, top(0.92) + 1.2, x + w + 10, top(1) + 0.6, x + w + 9.4, top(1) + 1.6, x + w * 0.92, top(0.92) + 3.4], '#4a2a16');
  line(ctx, x + w + 4, top(1) + 0.8, x + w + 10, top(1) + 0.6, GOLD, 0.6);
  // the stern: a red awning (tendalin) on hoops over the poop, gold fringe
  const sx = x - w * 0.8, sy = top(-0.8);
  poly(ctx, [sx - 6, sy + 0.4, sx - 5.4, sy - 4.6, sx - 1, sy - 6.6, sx + 4.6, sy - 5, sx + 6, sy + 0.4], RED);
  poly(ctx, [sx - 1, sy - 6.6, sx + 4.6, sy - 5, sx + 6, sy + 0.4, sx, sy + 0.4], shade(RED, -0.2));
  for (let i = 0; i < 7; i++) line(ctx, sx - 5.6 + i * 1.8, sy + 0.2, sx - 5.6 + i * 1.8, sy + 1.2, GOLD, 0.6);
  // the great stern lantern on its post
  const lx = x - w - 1.6, ly = top(-1) - 10;
  line(ctx, x - w + 0.6, top(-1) + 0.4, lx, ly + 3, GOLD_D, 0.8);
  poly(ctx, [lx - 1.6, ly + 2.4, lx + 1.6, ly + 2.4, lx + 2, ly - 1.6, lx, ly - 3.4, lx - 2, ly - 1.6], GOLD);
  poly(ctx, [lx - 1, ly + 1.8, lx + 1, ly + 1.8, lx + 1.3, ly - 1.4, lx - 1.3, ly - 1.4], '#ffe080');
  ellipse(ctx, lx, ly - 3.8, 0.6, 0.6, GOLD_L);
  ctx.save();
  const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, 6);
  g.addColorStop(0, 'rgba(255,220,120,0.45)');
  g.addColorStop(1, 'rgba(255,220,120,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(lx, ly, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  line(ctx, x - w + 1.4, top(-1) + 1.4, x - w - 1.6, y + 4.4, WOOD, 1.1); // the rudder
  wake(ctx, x + 4, y + 3.2, w * 0.9);
}

// ---------------------------------------------------------------- buildings

/** A canal along the front of a building: a strip of green-blue water, a stone edge, and striped mooring poles. */
function canal(ctx: Ctx, x: number, y: number, w: number, poles: number) {
  const hw = w / 2;
  poly(ctx, [x, y + hw / 2 + 0.4, x + hw + 3, y - 1.1, x + hw + 7, y + 1, x + 4, y + hw / 2 + 2.4], CANAL);
  poly(ctx, [x, y + hw / 2 + 0.4, x + hw + 3, y - 1.1, x + hw + 3.6, y - 0.6, x + 0.6, y + hw / 2 + 0.9], CANAL_D);
  line(ctx, x + 1.6, y + hw / 2 + 1.4, x + hw + 2, y + 0.3, 'rgba(255,255,255,0.4)', 0.4);
  for (let i = 0; i < poles; i++) {
    const t = (i + 0.6) / (poles + 0.4), px = x + 2.4 + t * (hw + 1.4), py = y + hw / 2 + 1.6 - t * (hw / 2 + 2.2);
    line(ctx, px, py, px, py - 7, WHITE, 1);
    for (let j = 0; j < 3; j++) line(ctx, px, py - j * 2.4, px, py - j * 2.4 - 1.2, i % 2 ? BLUE : RED, 1);
    ellipse(ctx, px, py - 7.3, 0.6, 0.5, GOLD);
    ellipse(ctx, px, py + 0.2, 1, 0.35, 'rgba(255,255,255,0.5)');
  }
}

/** A Venetian funnel chimney (camino a campana): a slender stack opening into an inverted bell. */
function chimney(ctx: Ctx, x: number, y: number, c = BRICK) {
  box(ctx, x, y, 1, 2.6, c);
  poly(ctx, [x - 0.5, y - 2.6, x - 1.3, y - 4.4, x + 1.3, y - 4.4, x + 0.5, y - 2.6], shade(c, 0.06));
  poly(ctx, [x, y - 2.6, x + 1.3, y - 4.4, x + 0.5, y - 2.6], shade(c, -0.2));
  ellipse(ctx, x, y - 4.4, 1.3, 0.45, shade(c, -0.3));
}

/** A balcony with a stone balustrade on face R, over the water. */
function balcony(ctx: Ctx, cx: number, cy: number, w: number, h: number, u: number, du: number, v: number) {
  const a = faceP('R', cx, cy, w, h, u, v), b = faceP('R', cx, cy, w, h, u + du, v);
  poly(ctx, [a[0], a[1], b[0], b[1], b[0] + 1.4, b[1] + 0.8, a[0] + 1.4, a[1] + 0.8], ISTRIA);
  line(ctx, a[0] + 0.7, a[1] - 2, b[0] + 0.7, b[1] - 2, ISTRIA, 0.6);
  for (let i = 0; i <= 5; i++) { const t = i / 5; line(ctx, a[0] + 0.7 + (b[0] - a[0]) * t, a[1] + 0.4 + (b[1] - a[1]) * t, a[0] + 0.7 + (b[0] - a[0]) * t, a[1] - 2 + (b[1] - a[1]) * t, '#d8d0c0', 0.4); }
}

/** A palazzo on a canal: a stuccoed façade, Gothic windows (a central polifora of pointed arches over a balcony),
 *  a water gate at the canal, a white Istrian-stone cornice and a tiled roof with a funnel chimney. */
function palazzo(ctx: Ctx, x: number, y: number, w: number, h: number, wall: string, roofC: string, poles: number) {
  box(ctx, x, y, w, h, wall, shade(wall, 0.1));
  band(ctx, x, y, w, h, 0, 0.08, ISTRIA); // the stone plinth at the water
  band(ctx, x, y, w, h, 0.94, 1, ISTRIA); // the cornice
  band(ctx, x, y, w, h, 0.5, 0.53, ISTRIA); // the string course
  // the water gate and the ground windows
  gothic(ctx, 'R', x, y, w, h, 0.38, 0.24, 0.0, 0.3, '#2a2a34', ISTRIA);
  gothic(ctx, 'R', x, y, w, h, 0.1, 0.12, 0.16, 0.34, '#3a3440', ISTRIA);
  gothic(ctx, 'R', x, y, w, h, 0.78, 0.12, 0.16, 0.34, '#3a3440', ISTRIA);
  // the piano nobile: a polifora (a row of pointed arches) in the middle, single windows at the sides
  arcade(ctx, 'R', x, y, w, h, 4, 0.58, 0.76, '#3a3440');
  balcony(ctx, x, y, w, h, 0.06, 0.88, 0.58);
  // windows on the side face
  for (const u of [0.18, 0.62]) { gothic(ctx, 'L', x, y, w, h, u, 0.18, 0.6, 0.76, '#4a4450'); gothic(ctx, 'L', x, y, w, h, u, 0.18, 0.18, 0.34, '#4a4450'); }
  roof(ctx, x, y - h, w + 1.2, w * 0.24, roofC);
  chimney(ctx, x - w * 0.22, y - h - 0.6);
  if (poles) canal(ctx, x, y, w, poles);
}

/** A campanile: a tall brick shaft with pilaster strips, a white belfry of arches, and a pyramid spire with a gilt angel. */
function campanile(ctx: Ctx, x: number, y: number, w: number, h: number, spire: string) {
  box(ctx, x, y, w, h, BRICK, shade(BRICK, 0.1));
  for (const f of ['L', 'R'] as const) for (const u of [0.04, 0.48, 0.88]) faceQuad(ctx, f, x, y, w, h, u, u + 0.08, 0.02, 1, BRICK_D);
  band(ctx, x, y, w, h, 0, 0.04, ISTRIA);
  const by = y - h;
  box(ctx, x, by, w, w * 0.9, ISTRIA);
  for (const f of ['L', 'R'] as const) arcade(ctx, f, x, by, w, w * 0.9, 3, 0.1, 0.62, '#2a2430');
  ellipse(ctx, x + w * 0.18, by - w * 0.5, w * 0.12, w * 0.14, '#c8903a'); // a bell
  const ty = by - w * 0.9;
  box(ctx, x, ty, w * 0.86, w * 0.5, BRICK);
  roof(ctx, x, ty - w * 0.5, w * 0.92, w * 1.6, spire);
  line(ctx, x, ty - w * 0.5 - w * 1.6, x, ty - w * 0.5 - w * 1.6 - 2.4, GOLD_D, 0.6);
  // the gilded angel turning with the wind
  ellipse(ctx, x, ty - w * 2.1 - 2.8, 0.7, 1.1, GOLD);
  poly(ctx, [x, ty - w * 2.1 - 3.2, x + 1.8, ty - w * 2.1 - 4.8, x + 0.6, ty - w * 2.1 - 2.4], GOLD_L);
}

/** A domed church: a white Istrian-stone front with a pointed portal and rose window, a lead dome on a drum, a lantern. */
function domedChurch(ctx: Ctx, x: number, y: number, w: number, h: number, roofC: string) {
  box(ctx, x, y, w, h, ISTRIA, '#e4dccc');
  band(ctx, x, y, w, h, 0.94, 1, '#d8d0c0');
  gothic(ctx, 'R', x, y, w, h, 0.38, 0.24, 0, 0.5, '#4a3a30', '#e0d4c0');
  const [rx, ry] = faceP('R', x, y, w, h, 0.5, 0.78);
  ellipse(ctx, rx, ry, 1.6, 1.8, '#6a4a5a');
  ring(ctx, rx, ry, 1.6, 1.8, '#c8b89a', 0.4);
  for (const u of [0.1, 0.78]) gothic(ctx, 'R', x, y, w, h, u, 0.12, 0.3, 0.6, '#5a4a50');
  roof(ctx, x, y - h, w + 1.2, w * 0.2, roofC);
  // the drum and dome
  const dy = y - h - w * 0.12;
  box(ctx, x, dy, w * 0.5, 2.6, ISTRIA);
  for (const f of ['L', 'R'] as const) for (const u of [0.2, 0.6]) faceQuad(ctx, f, x, dy, w * 0.5, 2.6, u, u + 0.2, 0.2, 0.8, '#5a4a50');
  dome(ctx, x, dy - 2.6, w * 0.3, w * 0.34, LEAD);
  // the lantern atop
  box(ctx, x, dy - 2.6 - w * 0.32, 1.6, 2.2, ISTRIA);
  dome(ctx, x, dy - 4.8 - w * 0.32, 1, 1.2, LEAD);
  line(ctx, x, dy - 6 - w * 0.32, x, dy - 8 - w * 0.32, GOLD_D, 0.5);
  ellipse(ctx, x, dy - 8.2 - w * 0.32, 0.6, 0.6, GOLD);
}

/** The capital: the Doge's Palace (two tiers of white arcades under a rose-and-white diapered wall), the campanile of
 *  St Mark beside it, the five lead domes of the basilica behind, and the gonfalon flying from the quay. */
function dogesPalace(ctx: Ctx, x: number, y: number, roofC: string) {
  ellipse(ctx, x, y + 6, 27, 7, 'rgba(0,0,0,0.14)');
  // the basilica behind, to the left: a low stone mass under five domes with lanterns
  const bx = x - 12, by = y - 7;
  box(ctx, bx, by, 16, 7, '#e8dcc6', '#efe4d0');
  for (const f of ['L', 'R'] as const) arcade(ctx, f, bx, by, 16, 7, 3, 0.1, 0.62, '#c89a3a'); // golden mosaic lunettes
  for (const [dx, dy, r] of [[-5, -2, 2.6], [5, -2, 2.6], [0, -4.4, 3.6], [0, 1, 2.6], [-1, -8, 2.4]] as const) {
    const cx = bx + dx, cy = by - 7 + dy;
    box(ctx, cx, cy + 0.6, r * 1.2, 1.2, '#e8dcc6');
    dome(ctx, cx, cy - 0.6, r, r * 1.05, LEAD);
    line(ctx, cx, cy - 0.6 - r * 1.05, cx, cy - 2.6 - r * 1.05, GOLD_D, 0.5);
    ellipse(ctx, cx, cy - 3 - r * 1.05, 0.7, 0.9, GOLD);
  }
  // the campanile at the back right, tall and alone
  campanile(ctx, x + 13, y - 3, 5, 24, '#5a9a7a');
  // the palace: a long block with its two arcades along the front faces
  const px = x + 2, py = y + 4, pw = 26, ph = 13;
  box(ctx, px, py, pw, ph, PINK, '#efe4d8');
  for (const f of ['L', 'R'] as const) {
    // the lower portico: stout pointed arches
    faceQuad(ctx, f, px, py, pw, ph, 0, 1, 0, 0.36, ISTRIA);
    arcade(ctx, f, px, py, pw, ph, f === 'R' ? 7 : 4, 0, 0.26, '#3a3440');
    // the upper loggia: twice as many slender arches, with quatrefoils
    faceQuad(ctx, f, px, py, pw, ph, 0, 1, 0.36, 0.62, ISTRIA);
    arcade(ctx, f, px, py, pw, ph, f === 'R' ? 14 : 8, 0.38, 0.54, '#3a3440');
    faceQuad(ctx, f, px, py, pw, ph, 0, 1, 0.36, 0.39, '#d8d0c0');
    // the diaper of rose and white above, and the great windows
    for (let r = 0; r < 3; r++) for (let i = 0; i < (f === 'R' ? 12 : 7); i++) if ((i + r) % 2) {
      const n = f === 'R' ? 12 : 7;
      faceQuad(ctx, f, px, py, pw, ph, i / n, (i + 1) / n, 0.64 + r * 0.1, 0.7 + r * 0.1, '#f6ece4');
    }
    for (const u of f === 'R' ? [0.2, 0.42, 0.74] : [0.3, 0.7]) gothic(ctx, f, px, py, pw, ph, u, 0.08, 0.68, 0.84, '#4a4050', ISTRIA);
  }
  // the balcony window on the front (the Porta della Carta side)
  balcony(ctx, px, py, pw, ph, 0.52, 0.16, 0.66);
  // the white crenellated cresting along the roof edge
  roof(ctx, px, py - ph, pw + 0.6, pw * 0.12, roofC);
  for (let i = 0; i < 12; i++) {
    const t = (i + 0.5) / 12;
    const [ax, ay] = faceP('R', px, py, pw, ph, t, 1);
    poly(ctx, [ax - 0.5, ay, ax, ay - 1.6, ax + 0.5, ay], ISTRIA);
  }
  for (let i = 0; i < 7; i++) {
    const t = (i + 0.5) / 7;
    const [ax, ay] = faceP('L', px, py, pw, ph, t, 1);
    poly(ctx, [ax - 0.5, ay, ax, ay - 1.6, ax + 0.5, ay], ISTRIA);
  }
  // the quay before it with two columns (St Mark's lion and St Theodore) and the canal
  canal(ctx, px, py, pw, 0);
  for (const [dx, top] of [[-6, 'lion'], [0, 'theo']] as const) {
    const cx = px - 14 + dx, cy = py + 5 + dx * 0.25;
    line(ctx, cx, cy, cx, cy - 11, '#d8d0c4', 1.6);
    line(ctx, cx - 0.4, cy, cx - 0.4, cy - 11, ISTRIA, 0.5);
    box(ctx, cx, cy - 11, 2.2, 1, ISTRIA);
    if (top === 'lion') lion(ctx, cx + 0.2, cy - 13.6, 0.55);
    else { line(ctx, cx, cy - 12, cx, cy - 15, '#8a8a7a', 0.8); ellipse(ctx, cx, cy - 15.4, 0.6, 0.6, '#8a8a7a'); }
  }
  // the great gonfalon on its flagstaff before the basilica
  line(ctx, x - 24, y + 2, x - 24, y - 28, WOOD_D, 0.9);
  ellipse(ctx, x - 24, y - 28.6, 0.8, 0.8, GOLD);
  line(ctx, x - 24.4, y - 27, x - 12.6, y - 27, GOLD_D, 0.6);
  gonfalon(ctx, x - 24, y - 26.8, 11.4, 8.6, 0.6);
}

function building(ctx: Ctx, x: number, y: number, big: boolean, roofC: string, capital: boolean) {
  if (big && capital) {
    ctx.save();
    ctx.translate(x, y + 2);
    ctx.scale(0.8, 0.8);
    dogesPalace(ctx, 0, 0, roofC);
    ctx.restore();
    return;
  }
  if (big) { // a domed church on its campo, the campanile standing apart
    campanile(ctx, x + 7, y - 4, 4.4, 18, '#5a9a7a');
    domedChurch(ctx, x - 2, y + 1, 13, 9, roofC);
    return;
  }
  const v = ((Math.round(x) * 7 + Math.round(y) * 3) % 4 + 4) % 4;
  if (v === 0) palazzo(ctx, x, y, 11, 11, '#e8b48a', roofC, 2);
  else if (v === 1) palazzo(ctx, x, y, 10, 13, '#d88a6a', roofC, 3);
  else if (v === 2) { // two narrow canal houses, ochre and rose, with funnel chimneys and an altana (a roof terrace)
    palazzo(ctx, x - 2.4, y - 1.4, 8, 9, '#e8c890', roofC, 0);
    palazzo(ctx, x + 4, y + 2, 7, 7, '#e8a898', roofC, 2);
    const ax = x - 2.4, ay = y - 1.4 - 9 - 2.4;
    for (const d of [-1.6, 1.6]) line(ctx, ax + d, ay, ax + d, ay - 2.4, WOOD_D, 0.5);
    line(ctx, ax - 2.2, ay - 2.4, ax + 2.2, ay - 2.4, WOOD, 0.8);
  } else palazzo(ctx, x, y, 12, 10, '#f0d8b8', roofC, 2);
}

// ---------------------------------------------------------------- trees

function clumps(ctx: Ctx, x: number, y: number, k: number, g: string, list: readonly (readonly [number, number, number, number, number])[]) {
  for (const [dx, dy, rx, ry, c] of list) {
    ellipse(ctx, x + dx * k, y + (dy + 1) * k, rx * k, ry * k, shade(g, c - 0.22));
    ellipse(ctx, x + dx * k, y + dy * k, rx * k, ry * k, shade(g, c));
    ellipse(ctx, x + (dx - rx * 0.3) * k, y + (dy - ry * 0.32) * k, rx * 0.5 * k, ry * 0.36 * k, shade(g, c + 0.18));
  }
}

function tree(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  const type = ['cypress', 'plane', 'reeds', 'cypress', 'plane', 'cypress', 'reeds', 'plane'][variant % 8];
  if (type === 'plane') {
    // a plane tree: a pale patchy trunk (the bark peeling in cream and grey-green), a broad open crown
    const bk = '#c8c0a4', g = mix(P.forest, '#5a8a3a', 0.5);
    line(ctx, x, y, x, y - 8 * k, shade(bk, -0.15), 2.6 * k);
    for (let i = 0; i < 5; i++) ellipse(ctx, x + (rand(variant, i) - 0.5) * 1.6 * k, y - (1 + i * 1.5) * k, 0.7 * k, 0.5 * k, i % 2 ? '#8a9a6a' : '#efe8d4');
    curve(ctx, x, y - 7 * k, x - 3 * k, y - 9 * k, x - 6 * k, y - 12 * k, 1.2 * k, bk);
    curve(ctx, x, y - 7 * k, x + 3 * k, y - 9.4 * k, x + 5.6 * k, y - 13 * k, 1.2 * k, bk);
    clumps(ctx, x, y, k, g, [[-6, -12.6, 4.6, 3.2, -0.12], [6, -13, 4.4, 3.2, -0.16], [0, -14, 6.4, 4, -0.04], [-3, -17.4, 4.4, 3, 0.06], [3.4, -17.2, 4, 2.8, 0.04], [0, -19.6, 3.6, 2.2, 0.12]]);
    for (let i = 0; i < 6; i++) { const a = rand(variant + 3, i) * Math.PI * 2, r = 2 + rand(variant + 7, i) * 6; ellipse(ctx, x + Math.cos(a) * r * k, y - 15 * k + Math.sin(a) * r * 0.5 * k, 0.5 * k, 0.5 * k, '#8a7a4a'); } // seed balls
    return;
  }
  if (type === 'reeds') {
    // lagoon reeds (canne) standing in a pool of shallow water, with a heron
    ellipse(ctx, x, y + 0.4 * k, 7 * k, 2.4 * k, mix(CANAL, P.forest, 0.25));
    ellipse(ctx, x - 1 * k, y, 5 * k, 1.4 * k, shade(CANAL, 0.15));
    const g = mix(P.forest, '#8aa04a', 0.55);
    for (let i = 0; i < 18; i++) {
      const dx = (rand(variant + 11, i) - 0.5) * 11, hgt = 8 + rand(variant + 13, i) * 8, lean = (rand(variant + 17, i) - 0.4) * 3;
      line(ctx, x + dx * k, y + (rand(variant, i) - 0.5) * 2 * k, x + (dx + lean) * k, y - hgt * k, i % 3 ? g : shade(g, 0.2), 0.6 * k);
      if (i % 4 === 0) ellipse(ctx, x + (dx + lean) * k, y - hgt * k, 0.6 * k, 1.6 * k, '#8a6a3a'); // a bulrush head
    }
    if (variant % 3 === 0) { // a grey heron in the shallows
      const hx = x + 3 * k, hy = y - 1 * k;
      line(ctx, hx, hy, hx, hy - 3 * k, '#6a6a5a', 0.4 * k);
      ellipse(ctx, hx, hy - 4.4 * k, 1.6 * k, 1.1 * k, '#b8bcc4');
      curve(ctx, hx + 1 * k, hy - 5 * k, hx + 1.6 * k, hy - 7 * k, hx + 1 * k, hy - 8 * k, 0.6 * k, '#d8dce0');
      line(ctx, hx + 1 * k, hy - 8 * k, hx + 2.8 * k, hy - 7.6 * k, '#d8a040', 0.4 * k);
    }
    return;
  }
  // a cypress: a tall dark flame of a tree, as in the gardens of the Giudecca and the cemetery isle
  const g = mix(P.forest, '#24482c', 0.6);
  const t = 1 + (variant % 3) * 0.12;
  line(ctx, x, y, x, y - 3 * k, '#5a4030', 1.4 * k);
  poly(ctx, [x, y - 26 * k * t, x + 2.8 * k, y - 16 * k * t, x + 3.2 * k, y - 6 * k, x, y - 2 * k, x - 3 * k, y - 6 * k, x - 2.6 * k, y - 16 * k * t], shade(g, -0.06));
  poly(ctx, [x, y - 26 * k * t, x - 2.6 * k, y - 16 * k * t, x - 3 * k, y - 6 * k, x, y - 2 * k, x - 0.6 * k, y - 14 * k * t], shade(g, 0.12));
  for (let i = 0; i < 8; i++) { const py = y - (5 + i * 2.5 * t) * k, r = 2.4 * (1 - i / 10); line(ctx, x - r * k, py, x + r * 0.4 * k, py - 0.8 * k, shade(g, 0.24), 0.5 * k); }
}

// ---------------------------------------------------------------- whole units

function unit(ctx: Ctx, kind: UnitKind, x: number, y: number): boolean {
  switch (kind) {
    case 'archer': balestriere(ctx, x, y); return true;
    case 'rider': stradiot(ctx, x, y); return true;
    case 'knight': manAtArms(ctx, x, y); return true;
    case 'condottiere': condottiere(ctx, x, y); return true;
    case 'catapult': bombard(ctx, x, y); return true;
    case 'boat': gondola(ctx, x, y); return true;
    case 'ship': merchantGalley(ctx, x, y); return true;
    case 'warship': warGalley(ctx, x, y); return true;
    default: return false;
  }
}

registerArt('venice', {
  unit,
  dress: (kind) => dress(kind),
  torso,
  face,
  head,
  weapon,
  shield: (ctx, kind, x, y, k) => { if (kind === 'defender') pavise(ctx, x, y, k); else kite(ctx, x, y, k); return true; },
  building,
  tree,
});

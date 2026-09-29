// Voxel-style unit figures: chunky big-headed people whose outfit, headgear and weapons
// come from their empire, and whose silhouette comes from their class.
import { TRIBES } from '../data/tribes';
import { UNITS } from '../data/units';
import type { TribeId, UnitKind } from '../game/types';
import { band, box, drawStar, ellipse, faceQuad, line, mix, poly, shade, softShadow, type Ctx } from './prims';

interface Look { skin: string; hair: string }
const LOOK: Record<TribeId, Look> = {
  egypt: { skin: '#c98d55', hair: '#1d1a17' },
  aztec: { skin: '#b8743f', hair: '#1a1410' },
  polynesia: { skin: '#a5673a', hair: '#1b130d' },
  rome: { skin: '#e8bf93', hair: '#4a3222' },
  pirates: { skin: '#e5b387', hair: '#3b2616' },
  vikings: { skin: '#f0c8a0', hair: '#d9a441' },
  japan: { skin: '#e9c49a', hair: '#16161a' },
  mongols: { skin: '#d6a676', hair: '#1a1612' },
  greeks: { skin: '#dcae80', hair: '#3a2616' },
  zulu: { skin: '#7a4a2a', hair: '#1a120c' },
};

const GOLD = '#f0c43a';
const BRONZE = '#c9974a';
const STEEL = '#bcc3cc';
const WOOD = '#7a5230';
const DARK = '#1b1b1f';

/** Draws a unit standing on (x, y). Map units draw their shadow separately (`shadow: false`). */
export function drawUnitSprite(ctx: Ctx, kind: UnitKind, tribe: TribeId, x: number, y: number, opts: { shadow?: boolean } = {}) {
  const d = UNITS[kind];
  if (opts.shadow !== false) softShadow(ctx, x, y + 1, d.naval ? 20 : 11, d.naval ? 6.5 : 4.4, 0.32);
  if (d.naval) return drawBoat(ctx, kind, tribe, x, y);
  switch (kind) {
    case 'catapult': return drawCatapult(ctx, tribe, x, y);
    case 'rider':
    case 'horsearcher':
    case 'knight': return drawRider(ctx, kind, tribe, x, y);
    case 'chariot': return drawChariot(ctx, tribe, x, y);
    default: return drawFootUnit(ctx, kind, tribe, x, y, kind === 'giant' ? 1.4 : 1);
  }
}

// ---------------------------------------------------------------- people

interface Body { hand: { x: number; y: number }; off: { x: number; y: number }; top: number }

/**
 * Draws a figure. `seated` hides the legs (riders). The returned points are the weapon hand,
 * the off hand (shields) and the y of the top of the head.
 */
/** A flat polygon on one visible side of a box, given in the same (u, v) coordinates as faceQuad. */
function facePoly(ctx: Ctx, face: 'L' | 'R', cx: number, cy: number, w: number, h: number, pts: [number, number][], color: string) {
  const P = (u: number, v: number) => face === 'R'
    ? [cx + (u * w) / 2, cy + (w / 4) * (1 - u) - v * h]
    : [cx - w / 2 + (u * w) / 2, cy + (w / 4) * u - v * h];
  poly(ctx, pts.flatMap(([u, v]) => P(u, v)), face === 'L' ? shade(color, 0.06) : shade(color, -0.2));
}

/** An elliptical outline (shield rims, hoops). */
function ring(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string, w: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
}

/** A blade: two tones for its two faces, a bright edge, a dark fuller and a pointed tip, from hilt (x0,y0) to (x1,y1). */
function blade(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, w: number, color: string) {
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  const nx = -(y1 - y0) / len, ny = (x1 - x0) / len; // unit normal
  const h = w / 2;
  const tip = { x: x1 + ((x1 - x0) / len) * w * 1.3, y: y1 + ((y1 - y0) / len) * w * 1.3 };
  poly(ctx, [x0 - nx * h, y0 - ny * h, x1 - nx * h, y1 - ny * h, tip.x, tip.y, x0, y0], shade(color, 0.18)); // lit face
  poly(ctx, [x0 + nx * h, y0 + ny * h, x1 + nx * h, y1 + ny * h, tip.x, tip.y, x0, y0], shade(color, -0.22)); // shaded face
  line(ctx, x0 + (x1 - x0) * 0.12, y0 + (y1 - y0) * 0.12, x0 + (x1 - x0) * 0.9, y0 + (y1 - y0) * 0.9, shade(color, -0.4), w * 0.16); // fuller
  line(ctx, x0 - nx * h * 0.85, y0 - ny * h * 0.85, x1 - nx * h * 0.85, y1 - ny * h * 0.85, shade(color, 0.6), Math.max(0.5, w * 0.16)); // sharp edge
}

/** A hilt: wrapped grip, a cross-guard and a round pommel, for a blade whose hilt end is at (x, y) pointing along (dx, dy). */
function hilt(ctx: Ctx, x: number, y: number, dx: number, dy: number, k: number, guard: string, grip = '#4a3322') {
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  line(ctx, x, y, x - ux * 3 * k, y - uy * 3 * k, grip, 1.7 * k);
  for (const t of [0.6, 1.5, 2.4]) line(ctx, x - ux * t * k - nx * 0.8 * k, y - uy * t * k - ny * 0.8 * k, x - ux * t * k + nx * 0.8 * k, y - uy * t * k + ny * 0.8 * k, shade(grip, -0.4), 0.5 * k);
  line(ctx, x - nx * 2.6 * k, y - ny * 2.6 * k, x + nx * 2.6 * k, y + ny * 2.6 * k, guard, 1.5 * k);
  ellipse(ctx, x - nx * 2.6 * k, y - ny * 2.6 * k, 0.9 * k, 0.9 * k, shade(guard, 0.3));
  ellipse(ctx, x + nx * 2.6 * k, y + ny * 2.6 * k, 0.9 * k, 0.9 * k, shade(guard, 0.3));
  ellipse(ctx, x - ux * 3.4 * k, y - uy * 3.4 * k, 1.3 * k, 1.3 * k, guard);
  ellipse(ctx, x - ux * 3.6 * k, y - uy * 3.7 * k, 0.5 * k, 0.5 * k, shade(guard, 0.6));
}

/** The metal an empire's armour is made of. */
const metalOf = (tribe: TribeId) => (tribe === 'egypt' || tribe === 'greeks' ? BRONZE : tribe === 'japan' ? '#3a3a48' : STEEL);

/** Units that wear real armour: they get shoulder plates, greaves, gloves and bracers. */
const isHeavy = (kind: UnitKind) =>
  kind === 'swordsman' || kind === 'knight' || kind === 'giant' || kind === 'legionary' || kind === 'samurai' || kind === 'berserker' || kind === 'hoplite' || kind === 'defender';

/**
 * Draws a figure. `seated` hides the legs (riders). The returned points are the weapon hand,
 * the off hand (shields) and the y of the top of the head.
 */
function figure(ctx: Ctx, kind: UnitKind, tribe: TribeId, x: number, y: number, k: number, seated = false): Body {
  const L = LOOK[tribe];
  const T = TRIBES[tribe];
  const armoured = kind === 'swordsman' || kind === 'knight' || kind === 'giant' || kind === 'legionary';
  const heavy = isHeavy(kind);
  const metal = metalOf(tribe);
  let torso = T.color, legs = shade(T.colorDark, 0.1), sleeves = L.skin;
  switch (tribe) {
    case 'egypt': torso = L.skin; legs = L.skin; break;
    case 'aztec': torso = kind === 'jaguar' ? '#e3a53a' : '#efe6d2'; legs = kind === 'jaguar' ? '#e3a53a' : L.skin; sleeves = kind === 'jaguar' ? '#e3a53a' : L.skin; break;
    case 'polynesia': torso = L.skin; legs = L.skin; break;
    case 'rome': torso = '#b3302a'; legs = L.skin; break;
    case 'pirates': torso = '#f1efe6'; legs = '#3b3b46'; sleeves = '#f1efe6'; break;
    case 'vikings': torso = T.color; legs = '#6a5238'; sleeves = T.color; break;
    case 'japan': torso = kind === 'samurai' || armoured ? '#2a2a34' : T.color; legs = '#3a3040'; sleeves = torso; break;
    case 'mongols': torso = T.color; legs = '#4a3a2a'; sleeves = T.color; break;
    case 'greeks': torso = '#f4f1ea'; legs = L.skin; break;
    case 'zulu': torso = L.skin; legs = L.skin; break;
  }
  const hip = seated ? y : y - 5 * k;
  const tw = 10 * k, th = 8.5 * k;

  // A cloak hangs behind the tallest ranks, in the empire's colour with a darker lining.
  if (kind === 'knight' || kind === 'giant' || kind === 'samurai' || kind === 'swordsman') {
    const cape = kind === 'giant' ? GOLD : T.color;
    const top = hip - th + 1 * k;
    poly(ctx, [x - 4 * k, top, x + 1 * k, top - 0.5 * k, x - 2 * k, hip + 8.5 * k, x - 9.5 * k, hip + 6.5 * k], shade(cape, -0.22));
    poly(ctx, [x - 4 * k, top, x - 6.5 * k, top + 3 * k, x - 9.5 * k, hip + 6.5 * k, x - 7 * k, hip + 2 * k], shade(cape, 0.02));
    line(ctx, x - 4 * k, top + 0.5 * k, x - 8.6 * k, hip + 6.2 * k, shade(cape, -0.4), 0.7 * k);
    if (tribe === 'egypt') line(ctx, x - 9.5 * k, hip + 6.5 * k, x - 2 * k, hip + 8.5 * k, GOLD, 1 * k); // gilded hem
    if (tribe === 'aztec') for (let i = 0; i < 3; i++) poly(ctx, [x - 9.3 * k + i * 2.4 * k, hip + 6.6 * k - i * 0.5 * k, x - 8.3 * k + i * 2.4 * k, hip + 10 * k - i * 0.5 * k, x - 7 * k + i * 2.4 * k, hip + 6.3 * k - i * 0.5 * k], ['#1faa6b', '#d6453b', '#1faa9b'][i]); // feather fringe
  }

  // Japan: a sashimono banner pole rides on the back of the higher ranks.
  if (tribe === 'japan' && (kind === 'samurai' || kind === 'knight' || kind === 'swordsman')) {
    const bx = x - 5.2 * k, by = hip - th + 2 * k;
    line(ctx, bx, by + 5 * k, bx - 0.6 * k, by - 25 * k, '#3a2a22', 0.9 * k);
    poly(ctx, [bx - 0.6 * k, by - 24 * k, bx - 5.6 * k, by - 23 * k, bx - 5.6 * k, by - 11 * k, bx - 0.6 * k, by - 12 * k], T.color);
    poly(ctx, [bx - 0.6 * k, by - 24 * k, bx - 1.6 * k, by - 23.8 * k, bx - 1.6 * k, by - 11.8 * k, bx - 0.6 * k, by - 12 * k], shade(T.color, -0.3));
    ellipse(ctx, bx - 3.2 * k, by - 17.6 * k, 1.6 * k, 1.8 * k, '#f4f1ea');
    ellipse(ctx, bx - 3.2 * k, by - 17.6 * k, 0.7 * k, 0.8 * k, T.color);
    line(ctx, bx - 5.4 * k, by - 22.6 * k, bx - 5.4 * k, by - 11.4 * k, '#f4f1ea', 0.5 * k);
  }

  // Legs (hidden when riding).
  if (!seated) {
    box(ctx, x - 2.2 * k, y - 0.3 * k, 3.6 * k, 5.2 * k, legs);
    box(ctx, x + 2.2 * k, y + 0.7 * k, 3.6 * k, 5.2 * k, legs);
    const boots = tribe === 'pirates' || tribe === 'mongols' || tribe === 'vikings';
    const shoe = tribe === 'pirates' ? DARK : tribe === 'mongols' ? '#3a2418' : tribe === 'zulu' ? L.skin : tribe === 'japan' ? '#e2dccb' : '#6b4424';
    const sv = boots ? 0.45 : 0.2;
    const leg = [[-2.2, -0.3, 'L'], [2.2, 0.7, 'R'], [2.2, 0.7, 'L']] as const;
    for (const [dx, dy, f] of leg) {
      faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0, 1, 0, sv, shoe);
      faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0, 1, sv, sv + 0.07, boots ? shade(shoe, 0.3) : shade(legs, -0.22)); // boot cuff / ankle wrap
      if (heavy) faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0.12, 0.88, sv + 0.1, 0.78, metal); // greave
      else if (tribe !== 'zulu' && tribe !== 'polynesia' && tribe !== 'egypt') faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0, 1, 0.9, 1, shade(legs, -0.18)); // trouser hem line
      if (tribe === 'japan' && !heavy) faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0.42, 0.56, sv + 0.1, 0.9, shade(legs, -0.28)); // hakama pleat
      if (tribe === 'japan') faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0, 1, sv - 0.02, sv + 0.02, '#8a3a2a'); // waraji straps
      if (tribe === 'mongols') faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0.3, 0.7, sv + 0.1, sv + 0.42, '#c8372d'); // embroidered boot panel
    }
    // toe caps
    faceQuad(ctx, 'R', x + 2.2 * k, y + 0.7 * k, 3.6 * k, 5.2 * k, 0, 0.35, 0, 0.12, shade(shoe, -0.3));
    if (tribe === 'egypt') for (const [dx, dy] of [[-2.2, -0.3], [2.2, 0.7]] as const) {
      faceQuad(ctx, 'R', x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0.1, 0.9, 0.12, 0.2, '#f4efe0'); // papyrus sandal straps
      faceQuad(ctx, 'R', x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0.4, 0.6, 0.12, 0.34, GOLD);
    }
    if (tribe === 'aztec' && kind !== 'jaguar') for (const [dx, dy] of [[-2.2, -0.3], [2.2, 0.7]] as const) {
      faceQuad(ctx, 'R', x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0, 1, 0.5, 0.62, '#1faa9b'); // beaded anklet
      faceQuad(ctx, 'L', x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0, 1, 0.5, 0.62, '#178a7d');
      faceQuad(ctx, 'R', x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0, 1, 0.62, 0.7, '#c8372d');
    }
    if (tribe === 'mongols') for (const [tx, ty] of [[-2.2, -0.3], [2.2, 0.7]] as const) { // gutal boots curl up at the toe
      poly(ctx, [x + tx * k, y + ty * k + 0.9 * k, x + (tx + 2.1) * k, y + ty * k - 0.1 * k, x + (tx + 2.9) * k, y + ty * k - 1.9 * k, x + (tx + 1.5) * k, y + ty * k - 0.5 * k], '#3a2418');
      poly(ctx, [x + (tx + 2.1) * k, y + ty * k - 0.1 * k, x + (tx + 2.9) * k, y + ty * k - 1.9 * k, x + (tx + 2.4) * k, y + ty * k - 0.2 * k], '#c8372d');
    }
  }

  // Back arm, torso, front arm.
  const glove = heavy ? '#5a4634' : L.skin;
  box(ctx, x - 5.9 * k, hip - 1 * k, 2.8 * k, 7 * k, sleeves);
  faceQuad(ctx, 'R', x - 5.9 * k, hip - 1 * k, 2.8 * k, 7 * k, 0, 1, 0.16, 0.3, heavy ? metal : shade(sleeves, -0.25)); // bracer or cuff
  box(ctx, x - 5.9 * k, hip + 0.9 * k, 2.4 * k, 2 * k, glove);
  if (tribe === 'mongols') faceQuad(ctx, 'R', x - 5.9 * k, hip - 1 * k, 2.8 * k, 7 * k, 0, 1, 0.08, 0.2, '#6a4a2a'); // fur cuff
  if (heavy) box(ctx, x - 5.9 * k, hip - 6.1 * k, 3.6 * k, 2.2 * k, metal); // back pauldron
  box(ctx, x, hip, tw, th, torso);
  dressTorso(ctx, tribe, kind, x, hip, tw, th, armoured);
  // a lit top edge and a shaded waist give the chest some volume
  band(ctx, x, hip, tw, th, 0.93, 1, shade(torso, 0.3));
  band(ctx, x, hip, tw, th, 0, 0.05, shade(torso, -0.3));
  // strap and quiver belt for the bowmen and the wanderer
  if (kind === 'archer' || kind === 'explorer' || kind === 'horsearcher' || kind === 'buccaneer') {
    facePoly(ctx, 'R', x, hip, tw, th, [[0.05, 0.98], [0.3, 0.98], [0.98, 0.12], [0.72, 0.1]], '#6b4424');
    facePoly(ctx, 'L', x, hip, tw, th, [[0.15, 0.98], [0.4, 0.98], [0.9, 0.3], [0.65, 0.28]], '#5a3a1e');
    faceQuad(ctx, 'R', x, hip, tw, th, 0.4, 0.5, 0.42, 0.56, GOLD); // buckle
  }
  box(ctx, x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, sleeves);
  faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.16, 0.3, heavy ? metal : shade(sleeves, -0.25));
  box(ctx, x + 6 * k, hip + 2.5 * k, 2.4 * k, 2 * k, glove);
  if (tribe === 'mongols') { // fur cuff and a gold armband
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.08, 0.2, '#6a4a2a');
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.62, 0.72, GOLD);
  }
  if (tribe === 'japan' && !heavy) faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.3, 0.42, '#f4f1ea'); // kimono under-sleeve
  if (tribe === 'polynesia') faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.55, 0.75, '#2a1a10');
  if (tribe === 'egypt') {
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.62, 0.78, GOLD);
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0.35, 0.65, 0.66, 0.74, '#2b5fb8'); // lapis inlay
    faceQuad(ctx, 'R', x - 5.9 * k, hip - 1 * k, 2.8 * k, 7 * k, 0, 1, 0.55, 0.7, GOLD); // back armlet
  }
  if (tribe === 'aztec' && kind !== 'jaguar') {
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.6, 0.78, '#1faa9b'); // jade armband
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0.35, 0.65, 0.64, 0.74, GOLD);
    faceQuad(ctx, 'R', x - 5.9 * k, hip - 1 * k, 2.8 * k, 7 * k, 0, 1, 0.55, 0.7, '#c8372d');
  }
  if (tribe === 'zulu') faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.5, 0.66, '#f4efe0'); // cow-tail armband
  if (tribe === 'vikings') { // twisted gold arm ring above the bracer
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.62, 0.76, GOLD);
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0.3, 0.5, 0.62, 0.76, shade(GOLD, 0.4));
  }
  if (tribe === 'pirates') { // rolled cuff and a red wristband
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.04, 0.14, '#b3302a');
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.66, 0.72, shade(sleeves, -0.3));
  }
  if (heavy || tribe === 'rome') {
    box(ctx, x + 6 * k, hip - 5 * k, 3.6 * k, 2.2 * k, metal); // front pauldron
    faceQuad(ctx, 'R', x + 6 * k, hip - 5 * k, 3.6 * k, 2.2 * k, 0.1, 0.9, 0.35, 0.55, shade(metal, 0.35)); // its shine
  }

  // Head.
  const hy = hip - th;
  const hw = 11 * k, hh = 10.5 * k;
  box(ctx, x, hy, hw, hh, L.skin, L.hair);
  faceQuad(ctx, 'L', x, hy, hw, hh, 0, 0.62, 0.42, 1, L.hair); // hair down the side and back of the head
  faceQuad(ctx, 'L', x, hy, hw, hh, 0.62, 0.9, 0.36, 0.56, shade(L.skin, -0.14)); // ear
  drawFace(ctx, tribe, kind, x, hy, hw, hh);
  const top = hy - hh;
  drawHeadgear(ctx, tribe, kind, x, top, k, hw);
  return { hand: { x: x + 6.3 * k, y: hip - 5.2 * k }, off: { x: x - 4 * k, y: hip + 1 * k }, top };
}

function dressTorso(ctx: Ctx, tribe: TribeId, kind: UnitKind, x: number, y: number, w: number, h: number, armoured: boolean) {
  switch (tribe) {
    case 'egypt':
      band(ctx, x, y, w, h, 0, 0.42, '#f4efe0'); // linen kilt
      for (const u of [0.12, 0.3, 0.7, 0.88]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.05, 0, 0.38, '#d9d0b8'); // pleats
      for (const u of [0.2, 0.6]) faceQuad(ctx, 'L', x, y, w, h, u, u + 0.06, 0, 0.38, '#d9d0b8');
      faceQuad(ctx, 'R', x, y, w, h, 0.4, 0.62, 0, 0.36, '#2b5fb8'); // striped apron
      faceQuad(ctx, 'R', x, y, w, h, 0.4, 0.62, 0.14, 0.2, GOLD);
      band(ctx, x, y, w, h, 0.38, 0.48, GOLD); // belt
      faceQuad(ctx, 'R', x, y, w, h, 0.42, 0.6, 0.36, 0.5, shade(GOLD, 0.3)); // buckle plate
      if (armoured) {
        band(ctx, x, y, w, h, 0.5, 0.75, BRONZE);
        for (const v of [0.56, 0.66]) band(ctx, x, y, w, h, v, v + 0.03, shade(BRONZE, -0.3)); // scale rows
      } else faceQuad(ctx, 'R', x, y, w, h, 0.36, 0.64, 0.52, 0.72, '#3ab0b8'); // turquoise pectoral
      band(ctx, x, y, w, h, 0.76, 1, GOLD); // broad collar
      band(ctx, x, y, w, h, 0.84, 0.9, '#2b5fb8');
      for (const u of [0.08, 0.28, 0.48, 0.68, 0.88]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.07, 0.7, 0.76, u > 0.4 && u < 0.6 ? '#c8372d' : '#3ab0b8'); // bead drops
      break;
    case 'aztec':
      if (kind === 'jaguar') {
        for (let i = 0; i < 6; i++) faceQuad(ctx, i % 2 ? 'R' : 'L', x, y, w, h, 0.15 + (i % 3) * 0.28, 0.27 + (i % 3) * 0.28, 0.2 + (i % 2) * 0.4, 0.32 + (i % 2) * 0.4, '#3a2410');
        band(ctx, x, y, w, h, 0.9, 1, '#f4efe0'); // white chest fur
        band(ctx, x, y, w, h, 0.34, 0.42, '#c8372d'); // red sash
        faceQuad(ctx, 'R', x, y, w, h, 0.42, 0.58, 0.34, 0.44, GOLD);
      } else {
        band(ctx, x, y, w, h, 0, 0.28, '#c8372d'); // loincloth
        faceQuad(ctx, 'R', x, y, w, h, 0.3, 0.7, 0, 0.3, '#f4efe0'); // embroidered flap
        faceQuad(ctx, 'R', x, y, w, h, 0.4, 0.6, 0.06, 0.22, '#c8372d');
        faceQuad(ctx, 'R', x, y, w, h, 0.47, 0.53, 0.1, 0.18, '#1a1a1a');
        band(ctx, x, y, w, h, 0.28, 0.34, '#1a1a1a'); // belt
        band(ctx, x, y, w, h, 0.5, 0.62, '#1faa9b'); // woven turquoise band
        for (const u of [0.1, 0.34, 0.58, 0.82]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.08, 0.53, 0.59, '#f4efe0'); // stepped-fret weave
        for (const u of [0.1, 0.34, 0.58, 0.82]) faceQuad(ctx, 'L', x, y, w, h, u, u + 0.08, 0.53, 0.59, '#f4efe0');
        for (const u of [0.05, 0.25, 0.45, 0.65, 0.85]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.1, 0.9, 0.98, u === 0.45 ? GOLD : '#1faa6b'); // jade necklace
        faceQuad(ctx, 'R', x, y, w, h, 0.2, 0.4, 0.66, 0.9, '#c8372d');
        faceQuad(ctx, 'R', x, y, w, h, 0.6, 0.8, 0.66, 0.9, '#c8372d');
        if (armoured) {
          band(ctx, x, y, w, h, 0.34, 0.48, GOLD);
          for (const u of [0.2, 0.5, 0.8]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.1, 0.36, 0.46, '#c8372d'); // quilted cotton armour studs
        }
      }
      break;
    case 'polynesia':
      band(ctx, x, y, w, h, 0, 0.4, '#5f9b3a'); // leaf skirt
      band(ctx, x, y, w, h, 0.36, 0.44, '#8a5a2b');
      band(ctx, x, y, w, h, 0.58, 0.63, '#2a1a10'); // tattoo lines
      band(ctx, x, y, w, h, 0.7, 0.74, '#2a1a10');
      for (let i = 0; i < 4; i++) {
        const c = ['#ff7aa8', '#ffffff', '#ffd54a', '#ff7aa8'][i];
        faceQuad(ctx, 'L', x, y, w, h, i * 0.25, i * 0.25 + 0.25, 0.86, 1, c);
        faceQuad(ctx, 'R', x, y, w, h, i * 0.25, i * 0.25 + 0.25, 0.86, 1, ['#ffffff', '#ffd54a', '#ff7aa8', '#ffffff'][i]);
      }
      break;
    case 'rome':
      band(ctx, x, y, w, h, 0, 0.3, '#b3302a');
      for (let i = 0; i < 4; i++) faceQuad(ctx, 'R', x, y, w, h, 0.1 + i * 0.22, 0.18 + i * 0.22, 0, 0.3, '#6b4424'); // leather strips
      band(ctx, x, y, w, h, 0.3, 0.4, '#6b4424'); // belt
      if (armoured || kind === 'defender') {
        for (const v of [0.46, 0.62, 0.78]) band(ctx, x, y, w, h, v, v + 0.13, STEEL); // segmented plates
      }
      break;
    case 'pirates':
      for (const v of [0.1, 0.34, 0.58, 0.82]) band(ctx, x, y, w, h, v, v + 0.11, '#253255'); // striped shirt
      faceQuad(ctx, 'R', x, y, w, h, 0, 0.3, 0, 1, '#3a2a22'); // open waistcoat
      faceQuad(ctx, 'L', x, y, w, h, 0.7, 1, 0, 1, '#3a2a22');
      band(ctx, x, y, w, h, 0.26, 0.36, DARK);
      faceQuad(ctx, 'R', x, y, w, h, 0.45, 0.6, 0.26, 0.36, GOLD);
      if (armoured) faceQuad(ctx, 'R', x, y, w, h, 0, 1, 0.5, 1, '#6b2a2a'); // captain's coat
      // red sash knotted at the hip with a tail, brass waistcoat buttons and a neckerchief
      faceQuad(ctx, 'R', x, y, w, h, 0.62, 0.98, 0.24, 0.38, '#b3302a');
      faceQuad(ctx, 'R', x, y, w, h, 0.8, 0.94, 0.02, 0.26, '#b3302a');
      faceQuad(ctx, 'R', x, y, w, h, 0.84, 0.9, 0.02, 0.24, shade('#b3302a', -0.35));
      faceQuad(ctx, 'R', x, y, w, h, 0.47, 0.57, 0.47, 0.56, '#f4efe0'); // skull buckle
      for (const v of [0.46, 0.62, 0.78]) faceQuad(ctx, 'R', x, y, w, h, 0.12, 0.2, v, v + 0.06, GOLD);
      if (!armoured) band(ctx, x, y, w, h, 0.92, 1, '#b3302a');
      else {
        faceQuad(ctx, 'R', x, y, w, h, 0.28, 0.33, 0.5, 1, GOLD); // gold-laced lapel
        band(ctx, x, y, w, h, 0.5, 0.54, GOLD); // coat hem trim
        for (const v of [0.6, 0.72, 0.84]) faceQuad(ctx, 'L', x, y, w, h, 0.74, 0.82, v, v + 0.05, GOLD);
      }
      if (kind === 'buccaneer') { // a brace of pistols at the belt and a powder horn
        faceQuad(ctx, 'R', x, y, w, h, 0.04, 0.2, 0.18, 0.4, '#2a2a30');
        faceQuad(ctx, 'R', x, y, w, h, 0.2, 0.32, 0.14, 0.34, '#6b4424');
        faceQuad(ctx, 'L', x, y, w, h, 0.3, 0.46, 0.14, 0.34, '#c9b58a');
      }
      break;
    case 'vikings':
      band(ctx, x, y, w, h, 0, 0.3, shade(TRIBES.vikings.color, -0.15)); // tunic skirt
      band(ctx, x, y, w, h, 0.3, 0.4, '#4a3322'); // belt
      faceQuad(ctx, 'R', x, y, w, h, 0.42, 0.58, 0.3, 0.4, STEEL);
      if (armoured) for (const v of [0.44, 0.58, 0.72]) band(ctx, x, y, w, h, v, v + 0.1, '#9aa3ad'); // mail
      if (kind === 'berserker' || kind === 'giant') band(ctx, x, y, w, h, 0.74, 1, '#8a6a4a'); // wolf-fur mantle
      // knotwork trim on the hem, a hanging belt pouch and a gold clasp
      for (let i = 0; i < 5; i++) faceQuad(ctx, i % 2 ? 'L' : 'R', x, y, w, h, 0.05 + (i % 3) * 0.3, 0.17 + (i % 3) * 0.3, 0.02, 0.09, i % 2 ? '#f4efe0' : GOLD);
      faceQuad(ctx, 'R', x, y, w, h, 0.64, 0.9, 0.08, 0.34, '#6b4424'); // pouch
      faceQuad(ctx, 'R', x, y, w, h, 0.64, 0.9, 0.26, 0.34, shade('#6b4424', -0.3));
      faceQuad(ctx, 'R', x, y, w, h, 0.72, 0.8, 0.17, 0.23, GOLD);
      if (kind === 'berserker') {
        for (let i = 0; i < 5; i++) faceQuad(ctx, i % 2 ? 'L' : 'R', x, y, w, h, (i % 3) * 0.3 + 0.05, (i % 3) * 0.3 + 0.27, 0.62, 0.76, i % 2 ? '#6a4c30' : '#a6845e'); // ragged fur edge
        for (const u of [0.28, 0.48, 0.68]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.1, 0.44, 0.6, '#f4efe0'); // claw necklace
      } else if (kind !== 'archer' && kind !== 'explorer') {
        band(ctx, x, y, w, h, 0.9, 1, '#f4efe0'); // rune-stitched collar
        for (const u of [0.15, 0.45, 0.75]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.08, 0.92, 0.98, GOLD);
      } else {
        faceQuad(ctx, 'L', x, y, w, h, 0.05, 0.95, 0.9, 1, '#8a6a4a'); // fur-trimmed cloak edge
      }
      break;
    case 'japan':
      if (kind === 'samurai' || armoured) {
        for (const v of [0.46, 0.62, 0.78]) band(ctx, x, y, w, h, v, v + 0.05, TRIBES.japan.color); // laced plates
        band(ctx, x, y, w, h, 0, 0.3, '#3a3040');
        for (const u of [0.25, 0.5, 0.75]) { // kusazuri: the hanging skirt plates
          faceQuad(ctx, 'L', x, y, w, h, u - 0.02, u + 0.02, 0, 0.3, '#16161c');
          faceQuad(ctx, 'R', x, y, w, h, u - 0.02, u + 0.02, 0, 0.3, '#16161c');
        }
        band(ctx, x, y, w, h, 0, 0.05, GOLD);
        for (const u of [0.28, 0.66]) { // red lacing down the cuirass
          faceQuad(ctx, 'L', x, y, w, h, u, u + 0.07, 0.46, 0.98, '#c8372d');
          faceQuad(ctx, 'R', x, y, w, h, u, u + 0.07, 0.46, 0.98, '#c8372d');
        }
        faceQuad(ctx, 'R', x, y, w, h, 0.4, 0.58, 0.6, 0.8, GOLD); // family crest on the chest
        faceQuad(ctx, 'R', x, y, w, h, 0.46, 0.52, 0.65, 0.75, TRIBES.japan.colorDark);
      } else if (kind === 'defender') {
        band(ctx, x, y, w, h, 0.46, 0.92, '#3a3a48'); // ashigaru breastplate over the kimono
        for (const u of [0.3, 0.68]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.06, 0.46, 0.92, '#c8372d');
        faceQuad(ctx, 'L', x, y, w, h, 0.4, 0.46, 0.46, 0.92, '#c8372d');
        band(ctx, x, y, w, h, 0, 0.1, shade(TRIBES.japan.colorDark, -0.1));
      } else {
        faceQuad(ctx, 'R', x, y, w, h, 0.3, 0.55, 0.5, 1, '#f4f1ea'); // crossed collar
        faceQuad(ctx, 'L', x, y, w, h, 0.72, 1, 0.7, 1, '#f4f1ea');
        band(ctx, x, y, w, h, 0, 0.1, shade(TRIBES.japan.colorDark, -0.1)); // hem
        faceQuad(ctx, 'R', x, y, w, h, 0.62, 0.72, 0.5, 0.9, shade(TRIBES.japan.color, 0.35)); // a kimono pattern stripe
      }
      band(ctx, x, y, w, h, 0.3, 0.42, kind === 'samurai' ? '#c8372d' : '#2a2a34'); // obi sash
      if (kind !== 'samurai' && !armoured) faceQuad(ctx, 'R', x, y, w, h, 0.72, 0.92, 0.18, 0.5, '#1a1a22'); // the obi bow
      break;
    case 'mongols':
      band(ctx, x, y, w, h, 0, 0.09, '#2b5fb8'); // embroidered hem
      for (const u of [0.18, 0.5, 0.82]) faceQuad(ctx, 'R', x, y, w, h, u - 0.05, u + 0.05, 0.02, 0.07, GOLD);
      faceQuad(ctx, 'L', x, y, w, h, 0.3, 0.4, 0.02, 0.07, GOLD);
      faceQuad(ctx, 'L', x, y, w, h, 0.7, 0.8, 0.02, 0.07, GOLD);
      facePoly(ctx, 'R', x, y, w, h, [[0.02, 1], [0.26, 1], [0.94, 0.4], [0.7, 0.4]], '#c9974a'); // the deel wraps diagonally across the chest
      facePoly(ctx, 'R', x, y, w, h, [[0.26, 1], [0.32, 1], [1, 0.4], [0.94, 0.4]], '#2b5fb8'); // ...with an embroidered edge
      faceQuad(ctx, 'R', x, y, w, h, 0.9, 1, 0.4, 0.95, shade(TRIBES.mongols.color, -0.12)); // far lapel
      band(ctx, x, y, w, h, 0.3, 0.4, '#2b5fb8'); // sash
      for (const u of [0.1, 0.4, 0.66]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.12, 0.31, 0.39, GOLD); // gilded belt plaques
      faceQuad(ctx, 'R', x, y, w, h, 0.74, 0.86, 0.05, 0.3, '#2b5fb8'); // hanging sash end
      faceQuad(ctx, 'R', x, y, w, h, 0.74, 0.86, 0.05, 0.1, '#c8372d');
      faceQuad(ctx, 'L', x, y, w, h, 0.15, 0.42, 0.08, 0.3, '#5a3a1e'); // belt pouch
      faceQuad(ctx, 'L', x, y, w, h, 0.15, 0.42, 0.22, 0.3, '#3a2616');
      faceQuad(ctx, 'L', x, y, w, h, 0.26, 0.31, 0.18, 0.26, GOLD);
      band(ctx, x, y, w, h, 0.84, 1, '#6a4a2a'); // fur collar
      faceQuad(ctx, 'R', x, y, w, h, 0.1, 0.9, 0.95, 1, '#8a6a44');
      for (const u of [0.15, 0.4, 0.62, 0.85]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.07, 0.86, 0.94, '#8a6a44'); // shaggy tufts
      faceQuad(ctx, 'R', x, y, w, h, 0.02, 0.12, 0.4, 0.84, '#f4ead0'); // button toggles at the shoulder
      if (armoured) {
        for (const v of [0.44, 0.6]) band(ctx, x, y, w, h, v, v + 0.12, '#8a5a33'); // leather scales
        for (const u of [0.2, 0.4, 0.6, 0.8]) { faceQuad(ctx, 'L', x, y, w, h, u, u + 0.03, 0.44, 0.72, '#4a2e16'); faceQuad(ctx, 'R', x, y, w, h, u, u + 0.03, 0.44, 0.72, '#4a2e16'); }
        for (const u of [0.22, 0.5, 0.78]) faceQuad(ctx, 'L', x, y, w, h, u, u + 0.06, 0.5, 0.56, shade(STEEL, 0.1)); // steel rivets
      }
      break;
    case 'greeks':
      band(ctx, x, y, w, h, 0, 0.08, '#2b5fb8'); // hem
      band(ctx, x, y, w, h, 0.34, 0.42, '#c9974a'); // belt
      if (armoured || kind === 'hoplite' || kind === 'defender') {
        band(ctx, x, y, w, h, 0.42, 1, BRONZE); // cuirass
        faceQuad(ctx, 'R', x, y, w, h, 0.3, 0.7, 0.6, 0.66, shade(BRONZE, -0.2));
      }
      break;
    case 'zulu':
      band(ctx, x, y, w, h, 0, 0.36, '#5a3a22'); // hide kilt
      for (const [u, v] of [[0.15, 0.08], [0.55, 0.2], [0.8, 0.04]]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.16, v, v + 0.12, '#f4efe0');
      faceQuad(ctx, 'L', x, y, w, h, 0.3, 0.5, 0.1, 0.22, '#f4efe0');
      band(ctx, x, y, w, h, 0.84, 0.9, '#f4efe0'); // bead necklace
      band(ctx, x, y, w, h, 0.78, 0.84, '#c8372d');
      if (armoured) band(ctx, x, y, w, h, 0.5, 0.74, '#6a4a2a');
      break;
  }
}

function drawFace(ctx: Ctx, tribe: TribeId, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const skin = LOOK[tribe].skin, hair = LOOK[tribe].hair;
  // brows, a nose and a mouth: small features, but they make a face read as a face
  for (const u of [0.17, 0.57]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.27, 0.68, 0.73, hair);
  faceQuad(ctx, 'R', x, y, w, h, 0.42, 0.6, 0.28, 0.5, shade(skin, -0.16)); // nose, in its own shadow
  faceQuad(ctx, 'R', x, y, w, h, 0.42, 0.6, 0.44, 0.5, shade(skin, 0.18)); // ...with a lit bridge
  faceQuad(ctx, 'R', x, y, w, h, 0.3, 0.72, 0.13, 0.19, shade(skin, -0.42)); // mouth
  faceQuad(ctx, 'R', x, y, w, h, 0.06, 0.2, 0.3, 0.4, mix(skin, '#e0605a', 0.3)); // cheek colour
  // Eyes on the right-hand (viewer-facing) side.
  for (const u of [0.22, 0.62]) {
    faceQuad(ctx, 'R', x, y, w, h, u, u + 0.2, 0.42, 0.64, '#ffffff');
    faceQuad(ctx, 'R', x, y, w, h, u + 0.07, u + 0.17, 0.44, 0.6, '#101010');
    faceQuad(ctx, 'R', x, y, w, h, u + 0.08, u + 0.11, 0.54, 0.59, '#ffffff');
  }
  switch (tribe) {
    case 'egypt':
      faceQuad(ctx, 'R', x, y, w, h, 0.18, 0.86, 0.62, 0.67, '#101010'); // kohl line
      faceQuad(ctx, 'R', x, y, w, h, 0.82, 0.98, 0.52, 0.58, '#101010'); // the kohl wing at the outer corner
      faceQuad(ctx, 'R', x, y, w, h, 0.02, 0.14, 0.5, 0.56, '#101010');
      if (kind === 'giant' || kind === 'knight' || kind === 'swordsman') {
        faceQuad(ctx, 'R', x, y, w, h, 0.42, 0.58, -0.3, 0.16, '#2b5fb8'); // ceremonial plaited beard
        faceQuad(ctx, 'R', x, y, w, h, 0.42, 0.58, -0.3, -0.22, GOLD);
        faceQuad(ctx, 'R', x, y, w, h, 0.42, 0.58, -0.12, -0.06, GOLD);
      }
      break;
    case 'aztec':
      if (kind !== 'jaguar') {
        faceQuad(ctx, 'R', x, y, w, h, 0.1, 0.95, 0.3, 0.38, '#1a1a1a'); // face paint
        faceQuad(ctx, 'R', x, y, w, h, 0.1, 0.95, 0.38, 0.44, '#e3a53a'); // yellow stripe above the black
        faceQuad(ctx, 'R', x, y, w, h, 0.38, 0.62, 0.88, 1, '#c8372d'); // forehead mark
        faceQuad(ctx, 'L', x, y, w, h, 0.66, 0.86, 0.38, 0.54, GOLD); // gold ear plug
        faceQuad(ctx, 'L', x, y, w, h, 0.72, 0.8, 0.42, 0.5, '#1faa9b');
        if (kind === 'giant' || kind === 'swordsman') faceQuad(ctx, 'R', x, y, w, h, 0.4, 0.6, 0.06, 0.14, '#1faa9b'); // lip plug
      } else faceQuad(ctx, 'R', x, y, w, h, 0.05, 0.95, 0.22, 0.3, '#3a2410'); // war paint stripe
      break;
    case 'polynesia':
      faceQuad(ctx, 'R', x, y, w, h, 0.3, 0.7, 0.08, 0.14, '#2a1a10'); // chin tattoo
      faceQuad(ctx, 'R', x, y, w, h, 0.4, 0.6, 0.16, 0.22, '#2a1a10');
      break;
    case 'pirates':
      faceQuad(ctx, 'R', x, y, w, h, 0.05, 1, 0.52, 0.58, '#101010'); // eyepatch strap
      faceQuad(ctx, 'R', x, y, w, h, 0.58, 0.86, 0.4, 0.66, '#101010');
      faceQuad(ctx, 'R', x, y, w, h, 0, 1, 0, 0.3, '#5a3a22'); // beard
      faceQuad(ctx, 'L', x, y, w, h, 0.5, 1, 0, 0.3, '#5a3a22');
      faceQuad(ctx, 'R', x, y, w, h, 0.2, 0.8, 0.28, 0.34, '#5a3a22'); // moustache
      faceQuad(ctx, 'L', x, y, w, h, 0.66, 0.78, 0.26, 0.36, GOLD); // gold hoop earring
      faceQuad(ctx, 'L', x, y, w, h, 0.66, 0.78, 0.36, 0.4, shade(GOLD, -0.2));
      if (kind === 'giant' || kind === 'knight' || kind === 'swordsman') { // forked captain's beard, tied with a bead
        faceQuad(ctx, 'R', x, y, w, h, 0.14, 0.4, -0.16, 0, '#5a3a22');
        faceQuad(ctx, 'R', x, y, w, h, 0.6, 0.86, -0.16, 0, '#5a3a22');
        faceQuad(ctx, 'R', x, y, w, h, 0.2, 0.32, -0.16, -0.08, GOLD);
        faceQuad(ctx, 'R', x, y, w, h, 0.68, 0.8, -0.16, -0.08, GOLD);
      } else if (kind !== 'archer') {
        faceQuad(ctx, 'R', x, y, w, h, 0.76, 0.84, 0.74, 0.96, '#c47a70'); // old scar
      } else faceQuad(ctx, 'R', x, y, w, h, 0.58, 0.64, 0.13, 0.19, GOLD); // gold tooth
      break;
    case 'vikings':
      faceQuad(ctx, 'R', x, y, w, h, 0, 1, 0, 0.32, LOOK.vikings.hair); // braided beard
      faceQuad(ctx, 'L', x, y, w, h, 0.5, 1, 0, 0.32, LOOK.vikings.hair);
      faceQuad(ctx, 'R', x, y, w, h, 0.42, 0.58, -0.12, 0.05, shade(LOOK.vikings.hair, -0.2));
      faceQuad(ctx, 'R', x, y, w, h, 0.2, 0.8, 0.28, 0.34, LOOK.vikings.hair); // moustache
      for (const u of [0.16, 0.7]) { // two plaited braids with gold ties
        faceQuad(ctx, 'R', x, y, w, h, u, u + 0.14, -0.22, 0.05, shade(LOOK.vikings.hair, 0.1));
        for (const v of [-0.06, -0.16]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.14, v, v + 0.03, shade(LOOK.vikings.hair, -0.35));
        faceQuad(ctx, 'R', x, y, w, h, u, u + 0.14, -0.26, -0.2, GOLD);
      }
      if (kind === 'berserker') { // red war paint
        faceQuad(ctx, 'R', x, y, w, h, 0.16, 0.26, 0.2, 0.44, '#b8281f');
        faceQuad(ctx, 'R', x, y, w, h, 0.66, 0.76, 0.2, 0.44, '#b8281f');
        faceQuad(ctx, 'R', x, y, w, h, 0.12, 0.88, 0.78, 0.86, '#b8281f');
        faceQuad(ctx, 'R', x, y, w, h, 0.42, 0.58, 0.66, 0.9, '#b8281f');
      } else if (kind === 'giant' || kind === 'knight') faceQuad(ctx, 'R', x, y, w, h, 0.1, 0.9, 0.74, 0.78, '#2b5fb8'); // blue brow line
      break;
    case 'japan':
      if (kind === 'samurai' || kind === 'giant') faceQuad(ctx, 'R', x, y, w, h, 0.26, 0.74, 0.3, 0.35, '#16161a'); // moustache
      if (kind === 'samurai' || kind === 'swordsman') {
        faceQuad(ctx, 'R', x, y, w, h, 0.4, 0.6, 0.04, 0.14, '#16161a'); // chin tuft
        for (const u of [0.15, 0.55]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.3, 0.72, 0.78, '#16161a'); // fierce brows
      }
      if (kind === 'knight') { // an iron half-mask with a grim red grin
        faceQuad(ctx, 'R', x, y, w, h, 0, 1, 0, 0.36, '#2a2a34');
        faceQuad(ctx, 'L', x, y, w, h, 0.5, 1, 0, 0.36, '#2a2a34');
        faceQuad(ctx, 'R', x, y, w, h, 0.18, 0.82, 0.1, 0.16, '#c8372d');
        for (const u of [0.28, 0.42, 0.56, 0.68]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.05, 0.1, 0.16, '#f4f1ea'); // teeth
        faceQuad(ctx, 'R', x, y, w, h, 0.3, 0.7, 0.32, 0.36, GOLD);
      }
      if (kind === 'giant') for (const u of [0.08, 0.8]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.1, 0.12, 0.5, '#c8372d'); // war paint
      if (kind === 'warrior' || kind === 'rider') faceQuad(ctx, 'R', x, y, w, h, 0.4, 0.6, 0.66, 0.72, shade(skin, -0.12)); // furrowed brow
      break;
    case 'mongols':
      faceQuad(ctx, 'R', x, y, w, h, 0.25, 0.75, 0.3, 0.35, LOOK.mongols.hair); // drooping moustache
      faceQuad(ctx, 'R', x, y, w, h, 0.22, 0.3, 0.14, 0.33, LOOK.mongols.hair);
      faceQuad(ctx, 'R', x, y, w, h, 0.7, 0.78, 0.14, 0.33, LOOK.mongols.hair);
      if (kind === 'swordsman' || kind === 'knight' || kind === 'giant' || kind === 'defender') faceQuad(ctx, 'R', x, y, w, h, 0.38, 0.62, 0.02, 0.15, LOOK.mongols.hair); // wispy chin beard
      if (kind === 'horsearcher' || kind === 'rider') for (const u of [0.1, 0.7]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.2, 0.36, 0.4, '#c8372d'); // war paint under the eyes
      if (kind === 'warrior' || kind === 'archer') faceQuad(ctx, 'R', x, y, w, h, 0.72, 0.77, 0.4, 0.8, '#b0604a'); // an old scar
      if (kind === 'giant' || kind === 'knight') for (const u of [0.1, 0.78]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.12, 0.3, 0.7, '#c8372d');
      break;
    case 'greeks':
      faceQuad(ctx, 'R', x, y, w, h, 0, 1, 0, 0.24, LOOK.greeks.hair); // trimmed beard
      faceQuad(ctx, 'L', x, y, w, h, 0.6, 1, 0, 0.24, LOOK.greeks.hair);
      break;
    case 'zulu':
      for (const u of [0.1, 0.84]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.06, 0.34, 0.4, '#f4efe0'); // white dots
      break;
  }
}

function drawHeadgear(ctx: Ctx, tribe: TribeId, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  switch (tribe) {
    case 'egypt': {
      if (kind === 'giant') {
        // tall white crown with a red rim
        box(ctx, x, top + 1 * k, 9 * k, 3 * k, '#c8372d');
        box(ctx, x, top - 2 * k, 6 * k, 8 * k, '#f4efe0');
        ellipse(ctx, x, top - 10.5 * k, 2.6 * k, 2 * k, '#f4efe0');
        band(ctx, x, top + 1 * k, 9 * k, 3 * k, 0.5, 0.75, GOLD); // gold band on the rim
        ellipse(ctx, x + 2.6 * k, top + 0.4 * k, 1.1 * k, 1.5 * k, GOLD); // uraeus cobra
        ellipse(ctx, x + 2.6 * k, top - 0.3 * k, 0.5 * k, 0.6 * k, '#c8372d');
        for (const s of [-1, 1]) poly(ctx, [x + s * 3 * k, top - 3 * k, x + s * 5.6 * k, top - 8 * k, x + s * 3.4 * k, top - 8 * k], '#2b5fb8'); // ostrich plumes flanking the crown
        break;
      }
      // striped royal headcloth with lappets over the ears
      box(ctx, x, top + 3.4 * k, hw + 1.4 * k, 4.4 * k, GOLD, '#f6d86a');
      for (const u of [0.1, 0.4, 0.7]) faceQuad(ctx, 'R', x, top + 3.4 * k, hw + 1.4 * k, 4.4 * k, u, u + 0.14, 0, 1, '#2b5fb8');
      for (const u of [0.15, 0.45, 0.75]) faceQuad(ctx, 'L', x, top + 3.4 * k, hw + 1.4 * k, 4.4 * k, u, u + 0.14, 0, 1, '#2b5fb8');
      faceQuad(ctx, 'L', x, top + 10.5 * k, hw + 1.4 * k, 10 * k, 0, 0.32, 0.25, 0.72, GOLD);
      faceQuad(ctx, 'L', x, top + 10.5 * k, hw + 1.4 * k, 10 * k, 0.1, 0.2, 0.25, 0.72, '#2b5fb8');
      ellipse(ctx, x + 1 * k, top - 1.5 * k, 1.5 * k, 1.5 * k, '#2b5fb8');
      faceQuad(ctx, 'R', x, top + 3.4 * k, hw + 1.4 * k, 4.4 * k, 0.42, 0.58, 0.7, 1.3, GOLD); // uraeus on the brow
      faceQuad(ctx, 'R', x, top + 3.4 * k, hw + 1.4 * k, 4.4 * k, 0.46, 0.54, 0.9, 1.1, '#c8372d');
      if (kind === 'swordsman' || kind === 'knight' || kind === 'defender') {
        // blue war crown dome with gold discs
        ellipse(ctx, x, top + 0.6 * k, 5.4 * k, 3 * k, '#2b5fb8');
        ellipse(ctx, x - 0.6 * k, top + 0.1 * k, 4 * k, 1.8 * k, shade('#2b5fb8', 0.25));
        for (const dx of [-2.6, 0, 2.6]) ellipse(ctx, x + dx * k, top + 0.4 * k + Math.abs(dx) * 0.15 * k, 0.7 * k, 0.6 * k, GOLD);
      }
      if (kind === 'archer' || kind === 'catapult' || kind === 'explorer') faceQuad(ctx, 'L', x, top + 3.4 * k, hw + 1.4 * k, 4.4 * k, 0.75, 1, 0, 1, '#f4efe0'); // plain linen wrap
      break;
    }
    case 'aztec': {
      if (kind === 'jaguar') {
        // jaguar-pelt helmet with ears and fangs framing the face
        box(ctx, x, top + 3.6 * k, hw + 1.6 * k, 5.5 * k, '#e3a53a');
        for (const [u, v] of [[0.2, 0.3], [0.6, 0.6], [0.45, 0.2]]) faceQuad(ctx, 'R', x, top + 3.6 * k, hw + 1.6 * k, 5.5 * k, u, u + 0.12, v, v + 0.25, '#3a2410');
        box(ctx, x - 3.5 * k, top - 1.8 * k, 2.6 * k, 2.8 * k, '#e3a53a');
        box(ctx, x + 3.5 * k, top - 0.8 * k, 2.6 * k, 2.8 * k, '#e3a53a');
        for (const u of [0.15, 0.45, 0.75]) faceQuad(ctx, 'R', x, top + 3.6 * k, hw + 1.6 * k, 5.5 * k, u, u + 0.1, -0.3, 0.05, '#ffffff');
        faceQuad(ctx, 'R', x, top + 3.6 * k, hw + 1.6 * k, 5.5 * k, 0.4, 0.6, 0.3, 0.55, '#d98a8a'); // pink nose pad
        faceQuad(ctx, 'R', x, top + 3.6 * k, hw + 1.6 * k, 5.5 * k, 0.44, 0.56, 0.3, 0.38, '#3a2410');
        for (const [ex, ey] of [[-3.5, -1.8], [3.5, -0.8]] as const) ellipse(ctx, x + ex * k, top + ey * k + 0.4 * k, 0.9 * k, 1.1 * k, '#8a4a3a'); // inner ears
        band(ctx, x, top + 3.6 * k, hw + 1.6 * k, 5.5 * k, 0.78, 0.9, '#c8372d'); // red headband
        break;
      }
      const cols = ['#1faa6b', '#3a8ee0', '#d6453b', GOLD, '#1faa6b', '#3a8ee0', '#d6453b'];
      const n = kind === 'giant' || kind === 'swordsman' ? 7 : 5;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.3;
        const len = (kind === 'giant' ? 15 : 12) * k;
        poly(ctx, [x - 1.5 * k, top + 1.5 * k, x + 1.5 * k, top + 1.5 * k, x + Math.cos(a) * len, top + Math.sin(a) * len * 0.95], cols[i % cols.length]);
      }
      box(ctx, x, top + 2.8 * k, hw + 0.8 * k, 2.6 * k, GOLD);
      faceQuad(ctx, 'R', x, top + 2.8 * k, hw + 0.8 * k, 2.6 * k, 0.38, 0.62, 0.15, 0.85, '#1faa9b'); // turquoise mosaic
      faceQuad(ctx, 'R', x, top + 2.8 * k, hw + 0.8 * k, 2.6 * k, 0.05, 0.2, 0.3, 0.7, '#c8372d');
      faceQuad(ctx, 'R', x, top + 2.8 * k, hw + 0.8 * k, 2.6 * k, 0.8, 0.95, 0.3, 0.7, '#c8372d');
      for (const s of [-1, 1]) line(ctx, x + s * 3 * k, top + 4 * k, x + s * 3.6 * k, top + 7 * k, '#1faa6b', 0.9 * k); // side feather dangles
      if (kind === 'swordsman' || kind === 'giant' || kind === 'knight') {
        // eagle-warrior helm: a beak over the brow and white down
        poly(ctx, [x + 1 * k, top + 3 * k, x + 7.6 * k, top + 4.2 * k, x + 3.4 * k, top + 7.6 * k], '#e3a53a');
        poly(ctx, [x + 3 * k, top + 5 * k, x + 7.6 * k, top + 4.2 * k, x + 3.4 * k, top + 7.6 * k], shade('#e3a53a', -0.25));
        for (const u of [-3.2, -1, 1.2]) ellipse(ctx, x + u * k, top + 1.4 * k, 1.3 * k, 1 * k, '#f4efe0');
      }
      break;
    }
    case 'polynesia': {
      box(ctx, x - 1 * k, top + 1.2 * k, 6 * k, 3.5 * k, LOOK.polynesia.hair); // topknot
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ellipse(ctx, x + 5.2 * k + Math.cos(a) * 1.9 * k, top + 3.2 * k + Math.sin(a) * 1.6 * k, 1.4 * k, 1.3 * k, '#ffffff');
      }
      ellipse(ctx, x + 5.2 * k, top + 3.2 * k, 1 * k, 1 * k, '#ffd54a');
      if (kind === 'giant') for (let i = 0; i < 5; i++) poly(ctx, [x - 5 * k + i * 2.5 * k, top + 1 * k, x - 3.7 * k + i * 2.5 * k, top - 5 * k, x - 2.4 * k + i * 2.5 * k, top + 1 * k], i % 2 ? '#d6453b' : GOLD);
      break;
    }
    case 'rome': {
      const plain = kind === 'archer' || kind === 'catapult';
      box(ctx, x, top + 4 * k, hw + 1.2 * k, 4.8 * k, kind === 'giant' ? GOLD : STEEL);
      faceQuad(ctx, 'R', x, top + 10.5 * k, hw + 1.2 * k, 10 * k, 0.82, 1, 0.3, 0.72, STEEL); // cheek guards
      faceQuad(ctx, 'L', x, top + 10.5 * k, hw + 1.2 * k, 10 * k, 0.85, 1, 0.3, 0.72, STEEL);
      if (!plain) {
        const c = '#d82a2a';
        poly(ctx, [x - 5.5 * k, top + 0.5 * k, x - 3.5 * k, top - 5 * k, x + 3.5 * k, top - 4 * k, x + 5.5 * k, top + 1.5 * k, x, top + 1.8 * k], c);
        poly(ctx, [x - 3.5 * k, top - 5 * k, x + 3.5 * k, top - 4 * k, x + 2.5 * k, top - 2.5 * k, x - 2.5 * k, top - 3.4 * k], shade(c, 0.2));
      }
      break;
    }
    case 'pirates': {
      const hat = kind === 'buccaneer' || kind === 'swordsman' || kind === 'knight' || kind === 'giant' || kind === 'catapult';
      if (hat) {
        poly(ctx, [x - 8.5 * k, top + 2.5 * k, x, top - 3.2 * k, x + 8.5 * k, top + 2.5 * k, x, top + 6 * k], DARK);
        poly(ctx, [x - 4 * k, top + 1 * k, x, top - 8 * k, x + 4 * k, top + 1 * k], '#2a2a30');
        ellipse(ctx, x, top - 2.2 * k, 1.5 * k, 1.3 * k, '#ffffff');
        for (const ex of [-0.5, 0.5]) ellipse(ctx, x + ex * k, top - 2.4 * k, 0.32 * k, 0.4 * k, DARK);
        line(ctx, x - 1.6 * k, top - 0.3 * k, x + 1.6 * k, top + 0.9 * k, '#ffffff', 0.5 * k); // crossbones
        line(ctx, x - 1.6 * k, top + 0.9 * k, x + 1.6 * k, top - 0.3 * k, '#ffffff', 0.5 * k);
        line(ctx, x - 8.5 * k, top + 2.5 * k, x, top + 6 * k, GOLD, 0.7 * k); // gold-laced brim
        line(ctx, x, top + 6 * k, x + 8.5 * k, top + 2.5 * k, shade(GOLD, -0.25), 0.7 * k);
        if (kind === 'buccaneer') { poly(ctx, [x - 4 * k, top + 0.5 * k, x - 9 * k, top - 6 * k, x - 6.6 * k, top - 0.4 * k, x - 4.6 * k, top + 1.6 * k], '#f4efe0'); line(ctx, x - 4.4 * k, top + 0.6 * k, x - 8.2 * k, top - 5 * k, shade('#f4efe0', -0.3), 0.4 * k); }
        if (kind === 'giant' || kind === 'knight') poly(ctx, [x + 3 * k, top - 1 * k, x + 9 * k, top - 9 * k, x + 5 * k, top - 0.5 * k], '#d6453b');
      } else {
        box(ctx, x, top + 2.4 * k, hw + 0.6 * k, 2.6 * k, '#c8372d');
        faceQuad(ctx, 'L', x, top + 2.4 * k, hw + 0.6 * k, 2.6 * k, 0.2, 0.3, 0, 1, '#ffffff');
        for (const u of [0.15, 0.4, 0.65, 0.88]) faceQuad(ctx, 'R', x, top + 2.4 * k, hw + 0.6 * k, 2.6 * k, u, u + 0.08, 0.3, 0.7, '#f4efe0'); // polka dots
        box(ctx, x, top - 0.2 * k, hw - 1 * k, 2.4 * k, '#c8372d'); // gathered crown of the bandana
        poly(ctx, [x - 5.5 * k, top + 2 * k, x - 9 * k, top + 6 * k, x - 7 * k, top + 6.5 * k], '#c8372d');
        poly(ctx, [x - 5.5 * k, top + 3 * k, x - 10 * k, top + 3.4 * k, x - 7.6 * k, top + 4.8 * k], shade('#c8372d', -0.25)); // second tail
      }
      break;
    }
    case 'vikings': {
      if (kind === 'archer' || kind === 'explorer') {
        box(ctx, x, top + 2.4 * k, hw + 0.4 * k, 1.8 * k, '#6a5238'); // leather band
        faceQuad(ctx, 'R', x, top + 2.4 * k, hw + 0.4 * k, 1.8 * k, 0.42, 0.58, 0, 1, GOLD);
        poly(ctx, [x + 3 * k, top + 1.6 * k, x + 4.6 * k, top - 5 * k, x + 5.4 * k, top + 1.4 * k], '#f4efe0'); // a tucked feather
        poly(ctx, [x + 3 * k, top + 1.6 * k, x + 4.6 * k, top - 5 * k, x + 3.9 * k, top + 1.5 * k], shade('#f4efe0', -0.25));
        line(ctx, x - 5.6 * k, top + 4 * k, x - 6.6 * k, top + 11 * k, shade(LOOK.vikings.hair, -0.15), 1.7 * k); // braid
        ellipse(ctx, x - 6.6 * k, top + 11.4 * k, 0.9 * k, 0.9 * k, GOLD);
        break;
      }
      // rounded iron cap with a nose guard, braids down the back
      faceQuad(ctx, 'L', x, top + 10.5 * k, hw, 10.5 * k, 0, 0.25, 0.1, 0.7, LOOK.vikings.hair);
      box(ctx, x, top + 3.8 * k, hw + 1.2 * k, 4 * k, STEEL);
      ellipse(ctx, x, top - 0.2 * k, 5.6 * k, 3.4 * k, shade(STEEL, 0.1));
      line(ctx, x - 5.2 * k, top + 0.6 * k, x + 5.2 * k, top - 0.4 * k, shade(STEEL, -0.25), 1 * k);
      faceQuad(ctx, 'R', x, top + 10.5 * k, hw, 10.5 * k, 0.44, 0.56, 0.4, 0.8, STEEL);
      faceQuad(ctx, 'R', x, top + 3.8 * k, hw + 1.2 * k, 4 * k, 0, 1, 0, 0.2, GOLD); // brow band
      for (const u of [0.12, 0.38, 0.62, 0.88]) faceQuad(ctx, 'R', x, top + 3.8 * k, hw + 1.2 * k, 4 * k, u, u + 0.07, 0.42, 0.62, shade(STEEL, 0.6)); // rivets
      for (const u of [0.15, 0.55]) faceQuad(ctx, 'L', x, top + 3.8 * k, hw + 1.2 * k, 4 * k, u, u + 0.1, 0.4, 0.6, shade(STEEL, 0.5));
      line(ctx, x - 5.6 * k, top + 4 * k, x - 6.6 * k, top + 11 * k, LOOK.vikings.hair, 1.8 * k); // braid down the back
      for (const t of [0.35, 0.7]) line(ctx, x - 5.6 * k - t * k - 0.9 * k, top + (4 + 7 * t) * k, x - 5.6 * k - t * k + 0.9 * k, top + (4 + 7 * t) * k, shade(LOOK.vikings.hair, -0.4), 0.5 * k);
      ellipse(ctx, x - 6.6 * k, top + 11.4 * k, 0.9 * k, 0.9 * k, GOLD);
      if (kind === 'swordsman' || kind === 'knight' || kind === 'defender') faceQuad(ctx, 'L', x, top + 10.5 * k, hw, 10.5 * k, 0, 0.5, 0.3, 0.75, '#9aa3ad'); // mail aventail
      if (kind === 'knight' || kind === 'giant') { // winged crest
        for (const sd of [-1, 1]) {
          poly(ctx, [x + sd * 4.6 * k, top + 0.6 * k, x + sd * 10.5 * k, top - 3 * k, x + sd * 8 * k, top - 5.4 * k, x + sd * 7 * k, top - 3.6 * k, x + sd * 5.6 * k, top - 3.2 * k, x + sd * 4 * k, top - 1.4 * k], '#f4efe0');
          line(ctx, x + sd * 5 * k, top - 0.4 * k, x + sd * 9.4 * k, top - 3.6 * k, shade('#f4efe0', -0.3), 0.5 * k);
        }
      }
      if (kind === 'berserker' || kind === 'giant') {
        // wolf pelt over the helmet
        ellipse(ctx, x - 1 * k, top - 0.6 * k, 5.8 * k, 3.2 * k, '#8a6a4a');
        box(ctx, x - 3.6 * k, top - 2.2 * k, 2.2 * k, 2.6 * k, '#8a6a4a');
        box(ctx, x + 2.6 * k, top - 1.4 * k, 2.2 * k, 2.6 * k, '#8a6a4a');
      }
      break;
    }
    case 'japan': {
      if (kind === 'samurai' || kind === 'swordsman' || kind === 'knight' || kind === 'giant') {
        // lacquered helmet with neck flaps and a golden crest
        for (const sd of [-1, 1]) { // fukigaeshi: the turned-back wings beside the brow
          poly(ctx, [x + sd * 5.2 * k, top + 2.4 * k, x + sd * 9 * k, top + 0.4 * k, x + sd * 8.4 * k, top + 5.4 * k, x + sd * 5.4 * k, top + 6.4 * k], '#c8372d');
          poly(ctx, [x + sd * 5.2 * k, top + 2.4 * k, x + sd * 9 * k, top + 0.4 * k, x + sd * 8.6 * k, top + 1.6 * k, x + sd * 5.4 * k, top + 3.6 * k], GOLD);
        }
        box(ctx, x, top + 3.8 * k, hw + 1.6 * k, 4.4 * k, '#2a2a34');
        faceQuad(ctx, 'L', x, top + 10.5 * k, hw + 1.6 * k, 10 * k, 0, 1, 0.45, 0.7, '#2a2a34');
        for (const v of [0.5, 0.58, 0.66]) faceQuad(ctx, 'L', x, top + 10.5 * k, hw + 1.6 * k, 10 * k, 0, 1, v, v + 0.03, '#c8372d'); // shikoro: the laced neck-guard lames
        band(ctx, x, top + 3.8 * k, hw + 1.6 * k, 4.4 * k, 0, 0.16, GOLD); // gilded brow rim
        for (const u of [0.2, 0.5, 0.8]) faceQuad(ctx, 'R', x, top + 3.8 * k, hw + 1.6 * k, 4.4 * k, u - 0.04, u + 0.04, 0.5, 0.66, shade(GOLD, 0.3)); // rivets
        ellipse(ctx, x, top - 0.3 * k, 5.2 * k, 2.8 * k, '#34343f');
        if (kind === 'swordsman') poly(ctx, [x - 1.2 * k, top - 1 * k, x, top - 10 * k, x + 1.6 * k, top - 1 * k], GOLD); // a single blade crest
        else poly(ctx, [x - 1 * k, top, x - 6 * k, top - 8 * k, x - 3.6 * k, top - 1 * k, x + 3.6 * k, top - 0.4 * k, x + 6 * k, top - 7.6 * k, x + 1 * k, top + 0.4 * k], GOLD);
        ellipse(ctx, x, top - 1.6 * k, 1.1 * k, 1.1 * k, '#c8372d'); // jewel at the crest's heart
        break;
      }
      if (kind === 'archer' || kind === 'catapult' || kind === 'explorer') {
        // wide straw hat
        poly(ctx, [x - 8.5 * k, top + 3.5 * k, x, top - 4 * k, x + 8.5 * k, top + 3.5 * k, x, top + 6.5 * k], '#d8b86a');
        poly(ctx, [x, top - 4 * k, x + 8.5 * k, top + 3.5 * k, x, top + 6.5 * k], '#b8984a');
        line(ctx, x - 8.3 * k, top + 3.6 * k, x, top + 6.4 * k, '#7a5a2a', 0.8 * k); // dark rim binding
        line(ctx, x, top + 6.4 * k, x + 8.3 * k, top + 3.6 * k, '#5a4018', 0.8 * k);
        line(ctx, x, top - 4 * k, x - 3.5 * k, top + 4.6 * k, shade('#d8b86a', -0.2), 0.5 * k); // woven ribs
        line(ctx, x, top - 4 * k, x + 3.5 * k, top + 5.2 * k, '#a08238', 0.5 * k);
        ellipse(ctx, x, top - 4.2 * k, 0.9 * k, 0.9 * k, '#7a5a2a'); // peak knot
        line(ctx, x + 5.6 * k, top + 4.6 * k, x + 4.6 * k, top + 10 * k, '#c8372d', 0.7 * k); // chin cord
        line(ctx, x + 4.6 * k, top + 10 * k, x + 0.4 * k, top + 12.4 * k, '#c8372d', 0.7 * k);
        break;
      }
      if (kind === 'defender') {
        // ashigaru jingasa: a lacquered iron war-hat
        poly(ctx, [x - 8 * k, top + 3.6 * k, x, top - 5 * k, x + 8 * k, top + 3.6 * k, x, top + 6.4 * k], '#3a3a48');
        poly(ctx, [x, top - 5 * k, x + 8 * k, top + 3.6 * k, x, top + 6.4 * k], '#22222c');
        line(ctx, x - 7.8 * k, top + 3.8 * k, x, top + 6.4 * k, GOLD, 0.8 * k);
        line(ctx, x, top + 6.4 * k, x + 7.8 * k, top + 3.8 * k, shade(GOLD, -0.3), 0.8 * k);
        ellipse(ctx, x - 0.5 * k, top - 0.4 * k, 1.9 * k, 1.9 * k, GOLD); // crest
        ellipse(ctx, x - 0.5 * k, top - 0.4 * k, 0.9 * k, 0.9 * k, TRIBES.japan.color);
        line(ctx, x + 5.4 * k, top + 4.6 * k, x + 4.6 * k, top + 10 * k, '#c8372d', 0.7 * k);
        break;
      }
      box(ctx, x + 1 * k, top + 0.8 * k, 2.4 * k, 3.4 * k, LOOK.japan.hair); // topknot
      ellipse(ctx, x + 1 * k, top - 1 * k, 1.5 * k, 0.9 * k, '#f4f1ea'); // its white tie
      poly(ctx, [x - 5.4 * k, top + 3.4 * k, x - 9.4 * k, top + 6.8 * k, x - 8 * k, top + 8 * k, x - 5 * k, top + 5.4 * k], '#f4f1ea'); // headband tails
      poly(ctx, [x - 5.4 * k, top + 3.4 * k, x - 8.4 * k, top + 4.6 * k, x - 9.4 * k, top + 6.8 * k], shade('#f4f1ea', -0.15));
      box(ctx, x, top + 3.2 * k, hw + 0.4 * k, 1.8 * k, '#f4f1ea'); // headband
      faceQuad(ctx, 'R', x, top + 3.2 * k, hw + 0.4 * k, 1.8 * k, 0.4, 0.6, 0, 1, '#c8372d');
      break;
    }
    case 'mongols': {
      const helm = kind === 'swordsman' || kind === 'knight' || kind === 'giant' || kind === 'defender';
      const hy = top + 10.5 * k;
      const hair = LOOK.mongols.hair;
      for (const [bx, tw] of [[-6.6, -0.5], [6, 0.6]] as const) { // long braids hang beside the face, tied in red
        line(ctx, x + bx * k, hy - 3 * k, x + (bx + tw) * k, hy + 5 * k, hair, 1.9 * k);
        line(ctx, x + bx * k - 0.4 * k, hy - 2 * k, x + (bx + tw) * k - 0.4 * k, hy + 4 * k, shade(hair, 0.35), 0.4 * k);
        ellipse(ctx, x + (bx + tw) * k, hy + 5.4 * k, 1.1 * k, 0.9 * k, '#c8372d');
      }
      const capCol = helm ? STEEL : TRIBES.mongols.color;
      box(ctx, x, top + 3 * k, hw + 1.6 * k, 3 * k, '#6a4a2a'); // fur brim
      faceQuad(ctx, 'R', x, top + 3 * k, hw + 1.6 * k, 3 * k, 0.05, 0.95, 0.75, 1, '#8a6a44'); // fluffy top edge
      // fur ear flaps, one behind and one at the front of the face
      faceQuad(ctx, 'L', x, top + 10.5 * k, hw + 1.6 * k, 10.5 * k, 0, 0.3, 0.38, 0.72, '#6a4a2a');
      faceQuad(ctx, 'L', x, top + 10.5 * k, hw + 1.6 * k, 10.5 * k, 0, 0.3, 0.38, 0.44, '#8a6a44');
      faceQuad(ctx, 'R', x, top + 10.5 * k, hw + 1.6 * k, 10.5 * k, 0.86, 1, 0.42, 0.72, '#6a4a2a');
      faceQuad(ctx, 'R', x, top + 10.5 * k, hw + 1.6 * k, 10.5 * k, 0.86, 1, 0.42, 0.48, '#8a6a44');
      poly(ctx, [x - 5 * k, top + 0.5 * k, x, top - 8 * k, x + 5 * k, top + 0.5 * k, x, top + 2.4 * k], capCol);
      poly(ctx, [x, top - 8 * k, x + 5 * k, top + 0.5 * k, x, top + 2.4 * k], shade(capCol, -0.2));
      line(ctx, x - 5 * k, top + 0.7 * k, x, top + 2.6 * k, GOLD, 0.8 * k); // gilded rim
      line(ctx, x, top + 2.6 * k, x + 5 * k, top + 0.7 * k, shade(GOLD, -0.3), 0.8 * k);
      line(ctx, x, top - 8 * k, x - 2.4 * k, top + 1 * k, shade(capCol, -0.25), 0.5 * k); // quilted seams
      line(ctx, x, top - 8 * k, x + 2.2 * k, top + 1.8 * k, shade(capCol, -0.3), 0.5 * k);
      if (helm) {
        line(ctx, x, top - 8 * k, x, top - 12 * k, STEEL, 1 * k);
        for (const u of [-2.4, 0, 2.4]) ellipse(ctx, x + u * k, top + 1.2 * k + (u === 0 ? 1.2 : 0) * k, 0.6 * k, 0.6 * k, shade(STEEL, 0.5)); // rivets
        if (kind !== 'defender') { // a horsehair plume
          poly(ctx, [x, top - 11 * k, x - 4.6 * k, top - 9 * k, x - 3 * k, top - 3.4 * k, x - 0.6 * k, top - 8 * k], '#c8372d');
          poly(ctx, [x, top - 11 * k, x + 2.8 * k, top - 8.6 * k, x + 1.2 * k, top - 5 * k, x - 0.6 * k, top - 8 * k], shade('#c8372d', -0.3));
        }
      } else {
        ellipse(ctx, x, top - 8.2 * k, 1.3 * k, 1.3 * k, '#c8372d'); // tassel
        line(ctx, x, top - 7.4 * k, x + 0.6 * k, top - 5 * k, '#c8372d', 0.6 * k);
        if (kind === 'archer' || kind === 'horsearcher') { // a hawk feather tucked in the cap
          poly(ctx, [x + 2.6 * k, top - 0.4 * k, x + 4.8 * k, top - 8 * k, x + 5.6 * k, top - 7 * k, x + 3.8 * k, top], '#3a2a22');
          poly(ctx, [x + 2.6 * k, top - 0.4 * k, x + 4.8 * k, top - 8 * k, x + 4.2 * k, top - 3 * k], '#f4ead0');
        }
      }
      break;
    }
    case 'greeks': {
      if (kind === 'archer' || kind === 'catapult' || kind === 'explorer') {
        // olive wreath
        box(ctx, x, top + 2.4 * k, hw + 0.6 * k, 1.6 * k, '#6a8a3a');
        for (const u of [0.2, 0.5, 0.8]) faceQuad(ctx, 'R', x, top + 2.4 * k, hw + 0.6 * k, 1.6 * k, u, u + 0.12, -0.4, 1.4, '#8aaa4a');
        break;
      }
      // bronze helmet with cheek pieces and a tall front-to-back crest
      box(ctx, x, top + 4.4 * k, hw + 1.2 * k, 5 * k, BRONZE);
      faceQuad(ctx, 'R', x, top + 10.5 * k, hw + 1.2 * k, 10 * k, 0.04, 0.3, 0.12, 0.72, BRONZE);
      faceQuad(ctx, 'R', x, top + 10.5 * k, hw + 1.2 * k, 10 * k, 0.72, 0.96, 0.12, 0.72, BRONZE);
      faceQuad(ctx, 'L', x, top + 10.5 * k, hw + 1.2 * k, 10 * k, 0, 1, 0.3, 0.72, BRONZE);
      const c = kind === 'giant' ? GOLD : TRIBES.greeks.color;
      poly(ctx, [x + 4.5 * k, top + 1.5 * k, x + 4 * k, top - 6 * k, x - 1 * k, top - 8 * k, x - 6 * k, top - 5 * k, x - 7 * k, top + 3 * k, x - 3 * k, top - 1 * k, x + 1 * k, top - 1 * k], c);
      poly(ctx, [x + 4 * k, top - 6 * k, x - 1 * k, top - 8 * k, x - 6 * k, top - 5 * k, x - 1 * k, top - 6 * k], shade(c, 0.25));
      break;
    }
    case 'zulu': {
      box(ctx, x, top + 2.8 * k, hw + 1 * k, 2.4 * k, '#6a4a2a'); // fur headband
      faceQuad(ctx, 'R', x, top + 2.8 * k, hw + 1 * k, 2.4 * k, 0.3, 0.45, 0, 1, '#c9a45a');
      const tall = kind === 'impi' || kind === 'giant' || kind === 'swordsman' || kind === 'knight';
      poly(ctx, [x - 2 * k, top + 1 * k, x - 3.6 * k, top - (tall ? 11 : 7) * k, x - 0.6 * k, top + 0.6 * k], '#f4efe0'); // feathers
      if (tall) poly(ctx, [x + 1 * k, top + 1 * k, x + 2.6 * k, top - 10 * k, x + 2.4 * k, top + 0.6 * k], '#1a1a1a');
      break;
    }
  }
  if (kind === 'giant') drawStar(ctx, x, top - (tribe === 'egypt' ? 14 : tribe === 'greeks' || tribe === 'zulu' ? 12 : 8) * k, 2.4 * k);
}

function drawFootUnit(ctx: Ctx, kind: UnitKind, tribe: TribeId, x: number, y: number, k: number) {
  // Things carried on the back go first.
  if (kind === 'archer' || kind === 'explorer') {
    box(ctx, x - (kind === 'archer' ? 7 : 4.5) * k, y - 8 * k, 4 * k, 8 * k, kind === 'explorer' ? '#8a5a2b' : '#6b4424');
    if (kind === 'archer') {
      // a quiver banded in gold, arrows fletched in the empire's colour leaning out of it
      const qx = x - 7 * k;
      band(ctx, qx, y - 8 * k, 4 * k, 8 * k, 0.62, 0.72, GOLD);
      for (const i of [-1, 0, 1]) {
        line(ctx, qx + i * 1 * k, y - 8.4 * k, qx - 1.6 * k + i * 1.3 * k, y - 15 * k, '#c9b58a', 0.7 * k);
        const tx = qx - 1.6 * k + i * 1.3 * k;
        const c = i === 0 ? TRIBES[tribe].color : shade(TRIBES[tribe].color, i * 0.3);
        poly(ctx, [tx, y - 15 * k, tx - 1 * k, y - 17.4 * k, tx + 0.4 * k, y - 16 * k], c);
        poly(ctx, [tx, y - 15 * k, tx + 1.2 * k, y - 17.2 * k, tx + 0.4 * k, y - 16 * k], shade(c, -0.3));
      }
    } else {
      // the pathfinder's pack: a bedroll tied on top and a canteen
      ellipse(ctx, x - 4.5 * k, y - 16.6 * k, 3.4 * k, 1.7 * k, '#c9974a');
      ellipse(ctx, x - 4.5 * k, y - 16.8 * k, 3.4 * k, 1.5 * k, shade('#c9974a', 0.2));
      for (const ox of [-1.6, 1.6]) line(ctx, x - 4.5 * k + ox * k, y - 18 * k, x - 4.5 * k + ox * k, y - 8.4 * k, '#5a3a1e', 0.6 * k);
      ellipse(ctx, x - 6.8 * k, y - 4.5 * k, 1.4 * k, 1.8 * k, '#7a8a9a');
    }
  }
  const shieldFirst = kind === 'defender' || kind === 'legionary' || kind === 'jaguar' || kind === 'hoplite' || kind === 'impi' || (kind === 'warrior' && tribe === 'vikings');
  const b = figure(ctx, kind, tribe, x, y, k);
  drawWeapon(ctx, kind, tribe, b, k);
  if (shieldFirst) drawShield(ctx, tribe, kind, b.off.x, b.off.y, k);
}

function drawWeapon(ctx: Ctx, kind: UnitKind, tribe: TribeId, b: Body, k: number) {
  const { x, y } = b.hand;
  switch (kind) {
    case 'warrior':
    case 'jaguar':
    case 'giant':
    case 'legionary':
    case 'impi':
      meleeWeapon(ctx, tribe, kind, x, y, k);
      break;
    case 'berserker':
      // long-hafted bearded axe held high
      line(ctx, x - 1 * k, y + 3 * k, x + 3 * k, y - 16 * k, WOOD, 2 * k);
      poly(ctx, [x + 2.6 * k, y - 11 * k, x + 9 * k, y - 16 * k, x + 9.5 * k, y - 8 * k, x + 3.4 * k, y - 8.6 * k], STEEL);
      poly(ctx, [x + 9 * k, y - 16 * k, x + 9.5 * k, y - 8 * k, x + 8 * k, y - 11 * k], shade(STEEL, -0.25));
      line(ctx, x + 9.2 * k, y - 15.6 * k, x + 9.6 * k, y - 8.4 * k, shade(STEEL, 0.65), 0.7 * k); // bright edge
      ellipse(ctx, x + 3.6 * k, y - 10.4 * k, 0.5 * k, 0.5 * k, '#33333a'); // rivets
      ellipse(ctx, x + 3.9 * k, y - 8.9 * k, 0.5 * k, 0.5 * k, '#33333a');
      for (const t of [0.05, 0.18, 0.3]) line(ctx, x - 1.6 * k + 4 * k * t, y + 3 * k - 19 * k * t, x - 0.2 * k + 4 * k * t, y + 2.6 * k - 19 * k * t, '#3a2616', 0.9 * k); // leather wraps
      poly(ctx, [x + 2.2 * k, y - 13 * k, x + 0.4 * k, y - 11.2 * k, x + 1.4 * k, y - 8.6 * k, x + 2.8 * k, y - 10 * k], '#8a6a4a'); // fur tuft tied under the head
      poly(ctx, [x + 3 * k, y - 16 * k, x + 3.8 * k, y - 19.6 * k, x + 4.6 * k, y - 15.8 * k], STEEL); // spike
      // a hand axe in the off hand
      line(ctx, b.off.x, b.off.y + 2 * k, b.off.x - 2 * k, b.off.y - 7 * k, WOOD, 1.4 * k);
      poly(ctx, [b.off.x - 2 * k, b.off.y - 7 * k, b.off.x - 6.4 * k, b.off.y - 9.4 * k, b.off.x - 6.2 * k, b.off.y - 4.6 * k, b.off.x - 2.4 * k, b.off.y - 5.4 * k], shade(STEEL, -0.1));
      line(ctx, b.off.x - 6.4 * k, b.off.y - 9.2 * k, b.off.x - 6.2 * k, b.off.y - 4.8 * k, shade(STEEL, 0.65), 0.6 * k);
      break;
    case 'samurai':
      // katana: dark wrapped grip, gold guard, long curved blade
      line(ctx, x - 1 * k, y + 2 * k, x + 0.4 * k, y - 2.5 * k, '#2a2a34', 2 * k);
      ellipse(ctx, x + 0.5 * k, y - 2.8 * k, 1.8 * k, 0.9 * k, GOLD);
      ctx.strokeStyle = STEEL;
      ctx.lineWidth = 1.8 * k;
      ctx.beginPath();
      ctx.moveTo(x + 0.6 * k, y - 3.2 * k);
      ctx.quadraticCurveTo(x + 1 * k, y - 12 * k, x + 5 * k, y - 17 * k);
      ctx.stroke();
      ctx.strokeStyle = '#f4f8ff'; // the bright hamon edge
      ctx.lineWidth = 0.6 * k;
      ctx.beginPath();
      ctx.moveTo(x + 0.1 * k, y - 3.6 * k);
      ctx.quadraticCurveTo(x + 0.5 * k, y - 12 * k, x + 4.4 * k, y - 17.2 * k);
      ctx.stroke();
      line(ctx, x - 1 * k, y + 2.2 * k, x - 3.2 * k, y + 5.4 * k, '#c8372d', 0.8 * k); // sageo cord
      ellipse(ctx, x - 3.4 * k, y + 5.8 * k, 0.9 * k, 0.9 * k, '#c8372d');
      break;
    case 'swordsman':
      blade(ctx, x + 0.2 * k, y - 1 * k, x + 3 * k, y - 14 * k, 2.8 * k, metalOf(tribe));
      hilt(ctx, x + 0.2 * k, y - 1 * k, 0.2, -1, k, tribe === 'egypt' || tribe === 'greeks' ? GOLD : BRONZE);
      if (tribe === 'pirates') { // bell guard and a red ribbon on the pommel
        ring(ctx, x + 0.2 * k, y + 0.2 * k, 2.4 * k, 1.5 * k, GOLD, 0.9 * k);
        poly(ctx, [x + 0.2 * k, y + 2.4 * k, x - 1.6 * k, y + 5.6 * k, x + 0.4 * k, y + 4.6 * k], '#c8372d');
      }
      if (tribe === 'vikings') { // ring-pommel sword with gilded fuller inlay
        ring(ctx, x + 0.1 * k, y + 2.2 * k, 1.3 * k, 1.3 * k, GOLD, 0.7 * k);
        line(ctx, x + 0.9 * k, y - 4 * k, x + 2.4 * k, y - 11 * k, GOLD, 0.5 * k);
      }
      break;
    case 'archer':
    case 'horsearcher': {
      const wood = tribe === 'egypt' ? '#5a3b1e' : '#8a5a2b';
      ctx.lineCap = 'round';
      ctx.strokeStyle = wood;
      ctx.lineWidth = 1.9 * k;
      ctx.beginPath();
      ctx.arc(x + 1 * k, y - 3 * k, 9 * k, -1.15, 1.15);
      ctx.stroke();
      ctx.strokeStyle = shade(wood, 0.35);
      ctx.lineWidth = 0.6 * k;
      ctx.beginPath();
      ctx.arc(x + 1 * k, y - 3 * k, 9.5 * k, -1.1, 1.1); // highlight along the limbs
      ctx.stroke();
      const t0 = { x: x + 1 * k + Math.cos(-1.15) * 9 * k, y: y - 3 * k + Math.sin(-1.15) * 9 * k };
      const t1 = { x: x + 1 * k + Math.cos(1.15) * 9 * k, y: y - 3 * k + Math.sin(1.15) * 9 * k };
      for (const t of [t0, t1]) ellipse(ctx, t.x, t.y, 1 * k, 1 * k, shade(wood, -0.3)); // horn tips
      if (tribe === 'mongols') { // the composite bow's tips curl away from the string
        line(ctx, t0.x, t0.y, t0.x + 2.4 * k, t0.y - 1.4 * k, wood, 1.6 * k);
        line(ctx, t1.x, t1.y, t1.x + 2.4 * k, t1.y + 1.4 * k, wood, 1.6 * k);
        for (const yy of [-5.4, -0.6]) line(ctx, x + 9.4 * k, y + yy * k, x + 10.4 * k, y + yy * k, '#c8372d', 1.8 * k); // red-wrapped grip ends
      }
      if (tribe === 'japan') { // the tall yumi: its upper limb is longer than the lower
        line(ctx, t0.x, t0.y, t0.x + 1 * k, t0.y - 5 * k, wood, 1.7 * k);
        line(ctx, t0.x + 0.3 * k, t0.y - 1.5 * k, t0.x + 0.8 * k, t0.y - 3.5 * k, '#c8372d', 2.2 * k);
        ellipse(ctx, t0.x + 1 * k, t0.y - 5.2 * k, 0.9 * k, 0.9 * k, shade(wood, -0.3));
        line(ctx, t0.x, t0.y, t0.x + 1 * k, t0.y - 5 * k, '#f4efe0', 0.4 * k);
      }
      line(ctx, t0.x, t0.y, x - 3.5 * k, y - 3 * k, '#f4efe0', 0.8 * k); // string, drawn back to the nock
      line(ctx, t1.x, t1.y, x - 3.5 * k, y - 3 * k, '#f4efe0', 0.8 * k);
      line(ctx, x + 9.9 * k, y - 6 * k, x + 9.9 * k, y, '#3a2a1a', 2.6 * k); // wrapped grip
      line(ctx, x - 3.5 * k, y - 3 * k, x + 8 * k, y - 3 * k, '#6b4424', 1.1 * k); // arrow shaft
      poly(ctx, [x + 8 * k, y - 4.6 * k, x + 10.8 * k, y - 3 * k, x + 8 * k, y - 1.4 * k], STEEL); // head
      line(ctx, x + 8 * k, y - 3 * k, x + 10.2 * k, y - 3 * k, shade(STEEL, -0.35), 0.5 * k);
      poly(ctx, [x - 3.6 * k, y - 3 * k, x - 6.2 * k, y - 5 * k, x - 4.2 * k, y - 3 * k], TRIBES[tribe].color); // fletching
      poly(ctx, [x - 3.6 * k, y - 3 * k, x - 6.2 * k, y - 1 * k, x - 4.2 * k, y - 3 * k], shade(TRIBES[tribe].color, -0.3));
      break;
    }
    case 'buccaneer':
      line(ctx, x - 5 * k, y + 2 * k, x + 11 * k, y - 6 * k, '#4a3322', 2.6 * k); // stock
      line(ctx, x - 5 * k, y + 1.2 * k, x + 4 * k, y - 3.3 * k, shade('#4a3322', 0.4), 0.6 * k); // grain
      line(ctx, x + 3 * k, y - 2 * k, x + 13 * k, y - 7 * k, '#3a3a40', 1.6 * k); // barrel
      line(ctx, x + 3 * k, y - 2.6 * k, x + 13 * k, y - 7.6 * k, shade('#3a3a40', 0.6), 0.5 * k);
      for (const t of [0.15, 0.5, 0.85]) line(ctx, x + (3 + 10 * t) * k - 0.4 * k, y + (-2 - 5 * t) * k - 1 * k, x + (3 + 10 * t) * k - 0.4 * k, y + (-2 - 5 * t) * k + 1 * k, GOLD, 0.7 * k); // brass bands
      ellipse(ctx, x + 13 * k, y - 7 * k, 1.1 * k, 1.1 * k, '#1a1a1a');
      ellipse(ctx, x + 2 * k, y - 2.6 * k, 1.5 * k, 1.1 * k, GOLD); // lock plate
      line(ctx, x + 1.6 * k, y - 3.6 * k, x + 0.6 * k, y - 5.2 * k, '#2a2a30', 0.9 * k); // cock
      break;
    case 'defender':
    case 'hoplite': {
      const tipC = tribe === 'egypt' || tribe === 'greeks' ? BRONZE : STEEL;
      line(ctx, x + 1 * k, y + 5 * k, x + 2 * k, y - 18 * k, WOOD, 1.7 * k);
      line(ctx, x + 0.6 * k, y + 5 * k, x + 1.6 * k, y - 18 * k, shade(WOOD, 0.35), 0.5 * k); // shaft highlight
      ellipse(ctx, x + 1 * k, y + 5.2 * k, 1.2 * k, 0.9 * k, shade(tipC, -0.25)); // butt cap
      poly(ctx, [x + 2 * k, y - 22.5 * k, x + 0.2 * k, y - 17.5 * k, x + 2 * k, y - 16.5 * k], shade(tipC, 0.2)); // leaf-shaped head, lit side
      poly(ctx, [x + 2 * k, y - 22.5 * k, x + 3.8 * k, y - 17.5 * k, x + 2 * k, y - 16.5 * k], shade(tipC, -0.22));
      line(ctx, x + 2 * k, y - 22 * k, x + 2 * k, y - 17 * k, shade(tipC, -0.4), 0.5 * k); // mid-rib
      ellipse(ctx, x + 1.95 * k, y - 16.4 * k, 1.5 * k, 0.9 * k, '#3a2a1a'); // binding
      poly(ctx, [x + 1.4 * k, y - 16.2 * k, x + 0.2 * k, y - 12.5 * k, x + 1.4 * k, y - 13.2 * k, x + 2.4 * k, y - 12 * k, x + 2.6 * k, y - 16.2 * k], TRIBES[tribe].color); // tassel
      if (tribe === 'pirates') { // boarding pike: a barbed head and a black rag with a white skull
        poly(ctx, [x + 2.6 * k, y - 15.4 * k, x + 4.6 * k, y - 17 * k, x + 2.8 * k, y - 13.8 * k], tipC);
        poly(ctx, [x + 1.8 * k, y - 10 * k, x + 8 * k, y - 9 * k, x + 6.4 * k, y - 7.4 * k, x + 8 * k, y - 5.6 * k, x + 1.6 * k, y - 6 * k], DARK);
        ellipse(ctx, x + 4.4 * k, y - 7.8 * k, 1 * k, 0.9 * k, '#ffffff');
      }
      if (tribe === 'vikings') { // rune-bound spear with a wolf-tail
        for (const t of [-8, -5.5, -3]) line(ctx, x + 0.2 * k + t * 0.08 * k, y + t * k, x + 2.2 * k + t * 0.08 * k, y + (t - 0.4) * k, '#c9b58a', 0.7 * k);
        poly(ctx, [x + 1.6 * k, y - 14 * k, x + 6 * k, y - 15 * k, x + 4.4 * k, y - 13.4 * k, x + 6.4 * k, y - 11.8 * k, x + 1.6 * k, y - 12 * k], '#f4efe0');
        poly(ctx, [x + 1.6 * k, y - 14 * k, x + 6 * k, y - 15 * k, x + 3.6 * k, y - 13.4 * k], TRIBES.vikings.color);
      }
      break;
    }
    case 'explorer':
      line(ctx, x + 1 * k, y + 6 * k, x + 2.5 * k, y - 12 * k, '#8a5a2b', 1.6 * k);
      line(ctx, x + 0.6 * k, y + 6 * k, x + 2.1 * k, y - 12 * k, shade('#8a5a2b', 0.4), 0.5 * k);
      ellipse(ctx, x + 2.6 * k, y - 12.4 * k, 1.5 * k, 1.5 * k, '#6b4424'); // knob on the walking staff
      if (tribe === 'japan') { // a pilgrim's shakujo: brass rings jingle at the top
        ring(ctx, x + 2.6 * k, y - 14.6 * k, 1.6 * k, 1.9 * k, GOLD, 0.7 * k);
        for (const ox of [-1.8, 1.8]) ellipse(ctx, x + 2.6 * k + ox * k, y - 12.6 * k, 0.6 * k, 0.6 * k, GOLD);
        ellipse(ctx, x - 6.8 * k, y - 3 * k, 1.5 * k, 2 * k, '#c9a45a'); // a gourd flask at the hip
        line(ctx, x - 6.8 * k, y - 5 * k, x - 5.2 * k, y - 7.6 * k, '#5a3a1e', 0.5 * k);
      }
      if (tribe === 'mongols') { // a horsehair standard of the steppe
        for (const [ox, oy] of [[-1.6, 2.6], [-0.4, 3.4], [0.9, 3]] as const) line(ctx, x + 2.6 * k + ox * k * 0.5, y - 12.4 * k, x + 2.6 * k + ox * k * 1.6, y - 12.4 * k + oy * k * 1.6, '#1a1612', 0.6 * k);
        ellipse(ctx, x - 6.8 * k, y - 3 * k, 1.5 * k, 2 * k, '#8a6a44'); // a leather waterskin at the hip
        line(ctx, x - 6.8 * k, y - 5 * k, x - 5.2 * k, y - 7.6 * k, '#c8372d', 0.5 * k);
      }
      line(ctx, x + 2 * k, y - 8 * k, x + 4.5 * k, y - 7 * k, '#f4efe0', 0.7 * k); // a pennant string tied on
      poly(ctx, [x + 4.5 * k, y - 7 * k, x + 8 * k, y - 8.2 * k, x + 7.4 * k, y - 5.8 * k], TRIBES[tribe].color);
      if (tribe === 'pirates') { // a brass spyglass held out and a rolled treasure map
        line(ctx, x - 1 * k, y - 4 * k, x + 8 * k, y - 15 * k, '#b98a3a', 2.2 * k);
        line(ctx, x + 5 * k, y - 11.4 * k, x + 8.4 * k, y - 15.6 * k, '#e0b95a', 1.4 * k);
        ellipse(ctx, x + 8.8 * k, y - 16 * k, 1.5 * k, 1.5 * k, '#7fb8d8');
        line(ctx, x + 1.4 * k, y - 6.2 * k, x + 2.6 * k, y - 7.8 * k, '#5a3a1e', 0.7 * k);
        ellipse(ctx, x - 3 * k, y + 1.6 * k, 2.2 * k, 1 * k, '#e8d9a8');
        ellipse(ctx, x - 4.8 * k, y + 1.6 * k, 0.6 * k, 1 * k, '#b8a070');
      }
      if (tribe === 'vikings') { // a drinking horn on the belt and a rune stone tucked in
        poly(ctx, [x - 5 * k, y - 5 * k, x - 1 * k, y - 4 * k, x + 0.5 * k, y - 0.5 * k, x - 0.6 * k, y - 0.6 * k, x - 3 * k, y - 3 * k], '#efe6d2');
        poly(ctx, [x - 5 * k, y - 5 * k, x - 1 * k, y - 4 * k, x - 3 * k, y - 3.4 * k], shade('#efe6d2', -0.2));
        ellipse(ctx, x + 0.2 * k, y - 0.6 * k, 0.9 * k, 0.9 * k, GOLD);
      }
      break;
  }
}

/** A curved blade drawn as a dark body with a bright edge along it. */
function curvedBlade(ctx: Ctx, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, w: number, color: string, k: number) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = shade(color, -0.22);
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx, cy, x1, y1);
  ctx.stroke();
  ctx.strokeStyle = shade(color, 0.4);
  ctx.lineWidth = w * 0.42;
  ctx.beginPath();
  ctx.moveTo(x0 - 0.35 * k, y0 - 0.2 * k);
  ctx.quadraticCurveTo(cx - 0.4 * k, cy - 0.3 * k, x1 - 0.3 * k, y1 - 0.4 * k);
  ctx.stroke();
}

function meleeWeapon(ctx: Ctx, tribe: TribeId, kind: UnitKind, x: number, y: number, k: number) {
  const wrap = (x0: number, y0: number, x1: number, y1: number, n: number, color: string, w: number) => {
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      line(ctx, x0 + (x1 - x0) * t - 0.9 * k, y0 + (y1 - y0) * t + 0.3 * k, x0 + (x1 - x0) * t + 0.9 * k, y0 + (y1 - y0) * t - 0.3 * k, color, w);
    }
  };
  switch (tribe) {
    case 'egypt': {
      // khopesh: a bronze sickle-sword on a gilded grip
      line(ctx, x, y + 1 * k, x + 1 * k, y - 5 * k, WOOD, 1.8 * k);
      wrap(x, y + 1 * k, x + 1 * k, y - 4 * k, 3, GOLD, 0.7 * k);
      ellipse(ctx, x - 0.2 * k, y + 2.3 * k, 1.3 * k, 1.3 * k, GOLD);
      curvedBlade(ctx, x + 1 * k, y - 5 * k, x + 2 * k, y - 13 * k, x + 7 * k, y - 12 * k, 2.6 * k, BRONZE, k);
      line(ctx, x + 3.2 * k, y - 10.4 * k, x + 4.6 * k, y - 10.2 * k, shade(BRONZE, -0.5), 0.6 * k); // the notch on the inner edge
      break;
    }
    case 'aztec': {
      // macuahuitl: a flat wooden club edged with obsidian blades, its grip bound in red, a feather tuft at the end
      poly(ctx, [x - 1 * k, y + 2 * k, x + 1.2 * k, y + 2 * k, x + 3.5 * k, y - 14 * k, x + 0.5 * k, y - 14 * k], '#8a5a2b');
      poly(ctx, [x - 1 * k, y + 2 * k, x + 0.1 * k, y + 2 * k, x + 2 * k, y - 14 * k, x + 0.5 * k, y - 14 * k], shade('#8a5a2b', 0.18));
      line(ctx, x + 0.3 * k, y - 1 * k, x + 2.4 * k, y - 12 * k, shade('#8a5a2b', -0.3), 0.5 * k);
      for (let i = 0; i < 5; i++) {
        const py = y - 3 * k - i * 2.7 * k;
        poly(ctx, [x + 2.5 * k + i * 0.3 * k, py, x + 4.7 * k + i * 0.3 * k, py - 1 * k, x + 2.7 * k + i * 0.3 * k, py - 2 * k], '#1a1a22');
        line(ctx, x + 2.7 * k + i * 0.3 * k, py - 0.6 * k, x + 4 * k + i * 0.3 * k, py - 1 * k, '#5a5a6a', 0.4 * k); // glint on the obsidian
      }
      wrap(x, y + 1.5 * k, x + 0.9 * k, y - 1 * k, 3, '#c8372d', 0.9 * k);
      poly(ctx, [x - 1 * k, y + 2 * k, x - 3.2 * k, y + 4.2 * k, x - 0.2 * k, y + 3.4 * k], '#1faa6b');
      poly(ctx, [x - 0.5 * k, y + 2.4 * k, x - 1.6 * k, y + 5.4 * k, x + 0.6 * k, y + 3.4 * k], '#d6453b');
      break;
    }
    case 'polynesia': {
      // paddle club: a carved blade set with shark teeth, cord-wrapped grip
      line(ctx, x, y + 2 * k, x + 1.5 * k, y - 4 * k, '#6b4424', 1.8 * k);
      wrap(x, y + 2 * k, x + 1.5 * k, y - 3 * k, 3, '#f4efe0', 0.6 * k);
      poly(ctx, [x + 1.5 * k, y - 4 * k, x - 1.5 * k, y - 10 * k, x + 2 * k, y - 16 * k, x + 5 * k, y - 10 * k], '#8a5a2b');
      poly(ctx, [x + 1.5 * k, y - 4 * k, x - 1.5 * k, y - 10 * k, x + 2 * k, y - 16 * k, x + 1.6 * k, y - 10 * k], shade('#8a5a2b', 0.2));
      for (const [ax, ay, bx, by] of [[0, -8, 2.6, -8.6], [-0.4, -10.6, 3.2, -11.2], [0.2, -13, 3.2, -13.4]] as const) line(ctx, x + ax * k, y + ay * k, x + bx * k, y + by * k, '#2a1a10', 0.6 * k); // carved bands
      for (let i = 0; i < 3; i++) poly(ctx, [x + 4.2 * k - i * 0.6 * k, y - 8 * k - i * 2.5 * k, x + 6 * k - i * 0.6 * k, y - 9 * k - i * 2.5 * k, x + 4.4 * k - i * 0.6 * k, y - 10 * k - i * 2.5 * k], '#f4efe0');
      break;
    }
    case 'rome':
      // gladius
      blade(ctx, x + 0.3 * k, y - 1 * k, x + 2.6 * k, y - 10 * k, 2.7 * k, STEEL);
      hilt(ctx, x + 0.3 * k, y - 1 * k, 0.25, -1, k, BRONZE, '#6b4424');
      break;
    case 'pirates': {
      // cutlass with a basket guard and a brass pommel
      curvedBlade(ctx, x, y - 1 * k, x + 1 * k, y - 8 * k, x + 6 * k, y - 12 * k, 2.4 * k, STEEL, k);
      line(ctx, x - 1.5 * k, y, x + 1.8 * k, y + 1 * k, GOLD, 1.6 * k);
      ring(ctx, x - 0.2 * k, y + 0.6 * k, 2.3 * k, 1.7 * k, GOLD, 0.8 * k);
      ellipse(ctx, x - 0.3 * k, y + 2.7 * k, 1.2 * k, 1.2 * k, GOLD);
      break;
    }
    case 'vikings':
      // bearded axe: bright edge, riveted head, leather-wrapped haft
      line(ctx, x, y + 2 * k, x + 1.6 * k, y - 10 * k, WOOD, 1.8 * k);
      line(ctx, x - 0.4 * k, y + 2 * k, x + 1.2 * k, y - 10 * k, shade(WOOD, 0.35), 0.5 * k);
      wrap(x, y + 1.5 * k, x + 0.7 * k, y - 2.5 * k, 3, '#3a2616', 0.9 * k);
      ellipse(ctx, x - 0.1 * k, y + 2.4 * k, 1.1 * k, 1.1 * k, '#5a3a1e');
      poly(ctx, [x + 1.2 * k, y - 7 * k, x + 6 * k, y - 10.5 * k, x + 6.4 * k, y - 5 * k, x + 1.6 * k, y - 5.4 * k], shade(STEEL, -0.18));
      poly(ctx, [x + 1.2 * k, y - 7 * k, x + 6 * k, y - 10.5 * k, x + 6.2 * k, y - 7.6 * k, x + 1.4 * k, y - 6.2 * k], shade(STEEL, 0.2));
      line(ctx, x + 6 * k, y - 10.5 * k, x + 6.4 * k, y - 5 * k, shade(STEEL, 0.65), 0.7 * k);
      for (const [rx, ry] of [[2.2, -6.9], [2.4, -5.9]] as const) ellipse(ctx, x + rx * k, y + ry * k, 0.45 * k, 0.45 * k, '#33333a');
      poly(ctx, [x + 1.2 * k, y - 9 * k, x - 0.8 * k, y - 10.6 * k, x + 1.4 * k, y - 8 * k], shade(STEEL, -0.3)); // the back spike
      break;
    case 'japan':
      // yari: a straight blade on a lacquered shaft bound in red cord
      line(ctx, x - 0.5 * k, y + 5 * k, x + 2.5 * k, y - 16 * k, '#3a2a22', 1.6 * k);
      wrap(x - 0.3 * k, y + 3 * k, x + 2 * k, y - 10 * k, 4, '#c8372d', 0.6 * k);
      ellipse(ctx, x - 0.6 * k, y + 5.2 * k, 1.1 * k, 0.9 * k, GOLD); // butt cap
      poly(ctx, [x + 3.2 * k, y - 22 * k, x + 1.7 * k, y - 16 * k, x + 2.7 * k, y - 15.6 * k], shade(STEEL, 0.2));
      poly(ctx, [x + 3.2 * k, y - 22 * k, x + 3.7 * k, y - 15.8 * k, x + 2.7 * k, y - 15.6 * k], shade(STEEL, -0.25));
      line(ctx, x + 3 * k, y - 21 * k, x + 2.7 * k, y - 16 * k, shade(STEEL, -0.45), 0.5 * k);
      ellipse(ctx, x + 2.6 * k, y - 15.4 * k, 1.4 * k, 0.9 * k, GOLD); // socket ring
      break;
    case 'mongols': {
      // curved sabre with a red tassel
      curvedBlade(ctx, x, y - 1 * k, x - 1 * k, y - 9 * k, x + 5 * k, y - 14 * k, 2.2 * k, STEEL, k);
      line(ctx, x - 1.5 * k, y, x + 1.8 * k, y + 1 * k, GOLD, 1.6 * k);
      ellipse(ctx, x - 0.2 * k, y + 2.4 * k, 1.1 * k, 1.1 * k, GOLD);
      poly(ctx, [x - 0.2 * k, y + 2.6 * k, x - 1.6 * k, y + 6 * k, x + 0.4 * k, y + 5.4 * k], '#c8372d');
      line(ctx, x - 1.2 * k, y - 1.4 * k, x + 2.2 * k, y - 0.4 * k, shade(GOLD, -0.2), 1 * k); // quillon
      line(ctx, x + 0.4 * k, y - 8.6 * k, x + 2.4 * k, y - 11.4 * k, shade(STEEL, 0.6), 0.5 * k); // sharpened false edge
      break;
    }
    case 'greeks':
      // xiphos: a leaf-bladed short sword
      line(ctx, x, y + 1 * k, x + 1.4 * k, y - 2.5 * k, WOOD, 1.8 * k);
      blade(ctx, x + 1.4 * k, y - 2.7 * k, x + 2.9 * k, y - 10 * k, 3.1 * k, BRONZE);
      hilt(ctx, x + 1.4 * k, y - 2.7 * k, 0.2, -1, k * 0.85, GOLD, '#3a2616');
      break;
    case 'zulu':
      // iklwa: a short stabbing spear with a broad, ribbed blade and a hide binding
      line(ctx, x - 0.5 * k, y + 3 * k, x + 2 * k, y - 8 * k, WOOD, 1.7 * k);
      line(ctx, x - 0.8 * k, y + 3 * k, x + 1.7 * k, y - 8 * k, shade(WOOD, 0.35), 0.5 * k);
      poly(ctx, [x + 2 * k, y - 7 * k, x + 4.2 * k, y - 11 * k, x + 3.4 * k, y - 16.5 * k, x + 2.4 * k, y - 11 * k], shade(STEEL, -0.22));
      poly(ctx, [x + 2 * k, y - 7 * k, x + 2.4 * k, y - 11 * k, x + 3.4 * k, y - 16.5 * k, x + 1 * k, y - 11 * k], shade(STEEL, 0.2));
      line(ctx, x + 2.3 * k, y - 8 * k, x + 3.3 * k, y - 15.5 * k, shade(STEEL, -0.5), 0.5 * k);
      poly(ctx, [x + 1.4 * k, y - 6.6 * k, x + 3 * k, y - 6.8 * k, x + 3.2 * k, y - 8.6 * k, x + 1.2 * k, y - 8.2 * k], '#c9a45a'); // hide binding
      line(ctx, x + 1.3 * k, y - 7.4 * k, x + 3.1 * k, y - 7.6 * k, '#5a3a22', 0.5 * k);
      break;
  }
  void kind;
}

function drawShield(ctx: Ctx, tribe: TribeId, kind: UnitKind, x: number, y: number, k: number) {
  const T = TRIBES[tribe];
  const rivets = (cx: number, cy: number, rx: number, ry: number, n: number, color: string) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.3;
      ellipse(ctx, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, 0.45 * k, 0.45 * k, color);
    }
  };
  switch (tribe) {
    case 'rome': {
      // scutum: tall curved rectangle, gilded edge, winged boss and studs
      box(ctx, x, y, 3 * k, 13 * k, '#b3302a', GOLD);
      faceQuad(ctx, 'R', x, y, 3 * k, 13 * k, 0, 1, 0.9, 1, GOLD);
      faceQuad(ctx, 'R', x, y, 3 * k, 13 * k, 0, 1, 0, 0.08, GOLD);
      faceQuad(ctx, 'L', x, y, 3 * k, 13 * k, 0, 1, 0, 1, '#b3302a');
      faceQuad(ctx, 'L', x, y, 3 * k, 13 * k, 0, 0.1, 0, 1, GOLD);
      faceQuad(ctx, 'L', x, y, 3 * k, 13 * k, 0.9, 1, 0, 1, GOLD);
      faceQuad(ctx, 'L', x, y, 3 * k, 13 * k, 0.46, 0.54, 0.08, 0.92, shade('#b3302a', -0.3)); // central spine
      faceQuad(ctx, 'L', x, y, 3 * k, 13 * k, 0.3, 0.7, 0.45, 0.6, GOLD); // boss
      faceQuad(ctx, 'L', x, y, 3 * k, 13 * k, 0.4, 0.6, 0.48, 0.55, shade(GOLD, 0.6));
      for (const [u, v] of [[0.2, 0.86], [0.8, 0.86], [0.2, 0.14], [0.8, 0.14]] as const) faceQuad(ctx, 'L', x, y, 3 * k, 13 * k, u - 0.06, u + 0.06, v - 0.025, v + 0.025, shade(GOLD, 0.5)); // studs
      faceQuad(ctx, 'L', x, y, 3 * k, 13 * k, 0.14, 0.46, 0.66, 0.78, GOLD); // wings
      faceQuad(ctx, 'L', x, y, 3 * k, 13 * k, 0.54, 0.86, 0.66, 0.78, GOLD);
      break;
    }
    case 'aztec': {
      // chimalli: a feathered round shield with a sun at its heart
      ellipse(ctx, x - 1 * k, y - 6 * k, 5.2 * k, 6 * k, '#efe6d2');
      ellipse(ctx, x - 1 * k, y - 6 * k, 3.6 * k, 4.3 * k, T.color);
      ring(ctx, x - 1 * k, y - 6 * k, 5.2 * k, 6 * k, '#8a6a3a', 0.9 * k);
      ring(ctx, x - 1 * k, y - 6 * k, 3.6 * k, 4.3 * k, shade(T.color, -0.35), 0.6 * k);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        line(ctx, x - 1 * k + Math.cos(a) * 1 * k, y - 6 * k + Math.sin(a) * 1.2 * k, x - 1 * k + Math.cos(a) * 2.7 * k, y - 6 * k + Math.sin(a) * 3.2 * k, GOLD, 0.7 * k); // sun rays
      }
      ellipse(ctx, x - 1 * k, y - 6 * k, 1.2 * k, 1.4 * k, GOLD);
      for (const a of [0.4, 1.95, 3.5, 5.05]) ellipse(ctx, x - 1 * k + Math.cos(a) * 5.2 * k, y - 6 * k + Math.sin(a) * 6 * k, 0.75 * k, 0.75 * k, '#1faa9b'); // turquoise rim beads
      for (let i = 0; i < 5; i++) poly(ctx, [x - 4 * k + i * 1.6 * k, y - 0.5 * k, x - 3.4 * k + i * 1.6 * k, y + 3 * k, x - 2.6 * k + i * 1.6 * k, y - 0.5 * k], ['#1faa6b', '#d6453b', GOLD][i % 3]);
      break;
    }
    case 'egypt': {
      // a tall hide shield with a bronze rim and a lotus at the crown
      const pts = [x - 4.5 * k, y + 1 * k, x - 4.5 * k, y - 9 * k, x - 1 * k, y - 13 * k, x + 2.5 * k, y - 9 * k, x + 2.5 * k, y + 3 * k];
      poly(ctx, pts, '#f4efe0');
      poly(ctx, [pts[0], pts[1], pts[2], pts[3], pts[4], pts[5], x - 1 * k, y + 2 * k], shade('#f4efe0', 0.1));
      ctx.strokeStyle = BRONZE;
      ctx.lineWidth = 0.9 * k;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
      ctx.closePath();
      ctx.stroke();
      ellipse(ctx, x - 2 * k, y - 6 * k, 1.4 * k, 1.8 * k, '#6b4424');
      ellipse(ctx, x, y - 2 * k, 1.2 * k, 1.5 * k, '#6b4424');
      ellipse(ctx, x - 1 * k, y - 10.2 * k, 1.3 * k, 1.1 * k, '#2b5fb8'); // lotus
      line(ctx, x - 1 * k, y - 9.4 * k, x - 1 * k, y - 4 * k, shade('#f4efe0', -0.25), 0.5 * k);
      ellipse(ctx, x - 1 * k, y - 6.4 * k, 1 * k, 1 * k, GOLD); // boss
      for (const [rx, ry] of [[-4, -1], [-4, -8], [2.2, -1], [2.2, -8]] as const) ellipse(ctx, x + rx * k, y + ry * k, 0.5 * k, 0.5 * k, GOLD); // rim rivets
      line(ctx, x - 4.2 * k, y - 11.6 * k, x - 1 * k, y - 12.8 * k, '#2b5fb8', 0.7 * k);
      break;
    }
    case 'polynesia':
      // a lashed timber shield, rimmed and bound with cord
      poly(ctx, [x - 4 * k, y + 1 * k, x - 3.5 * k, y - 11 * k, x + 2 * k, y - 12 * k, x + 2.5 * k, y + 2.5 * k], '#8a5a2b');
      poly(ctx, [x - 4 * k, y + 1 * k, x - 3.5 * k, y - 11 * k, x - 0.6 * k, y - 11.5 * k, x - 0.8 * k, y + 1.7 * k], shade('#8a5a2b', 0.18));
      for (const v of [2, 5, 8]) line(ctx, x - 3.5 * k, y - v * k, x + 2 * k, y - v * k - 0.6 * k, '#2a1a10', 0.9 * k);
      for (const v of [3.5, 6.5, 9.5]) line(ctx, x - 3.3 * k, y - v * k + 1.5 * k, x + 2 * k, y - v * k - 1.4 * k, '#f4efe0', 0.4 * k); // cross-lashings
      ctx.strokeStyle = '#4a3016';
      ctx.lineWidth = 0.8 * k;
      ctx.beginPath();
      ctx.moveTo(x - 4 * k, y + 1 * k);
      ctx.lineTo(x - 3.5 * k, y - 11 * k);
      ctx.lineTo(x + 2 * k, y - 12 * k);
      ctx.lineTo(x + 2.5 * k, y + 2.5 * k);
      ctx.closePath();
      ctx.stroke();
      break;
    case 'pirates':
      // a round plank buckler: iron rim and boss, a ring of rivets
      ellipse(ctx, x - 1 * k, y - 5 * k, 4.8 * k, 5.4 * k, '#5a4a3a');
      ellipse(ctx, x - 1 * k, y - 5 * k, 4.8 * k, 5.4 * k, '#5a4a3a');
      line(ctx, x - 5 * k, y - 5 * k, x + 3 * k, y - 5 * k, shade('#5a4a3a', -0.35), 0.5 * k); // plank seam
      ring(ctx, x - 1 * k, y - 5 * k, 4.6 * k, 5.2 * k, STEEL, 0.9 * k);
      rivets(x - 1 * k, y - 5 * k, 3.4 * k, 3.9 * k, 8, shade(STEEL, 0.3));
      ellipse(ctx, x - 1 * k, y - 5 * k, 1.6 * k, 1.6 * k, STEEL);
      ellipse(ctx, x - 1.4 * k, y - 5.5 * k, 0.6 * k, 0.5 * k, shade(STEEL, 0.6));
      break;
    case 'vikings': {
      // round painted board shield with an iron boss, rivets and plank seams
      const cx = x - 1 * k, cy = y - 5 * k, rx = 5 * k, ry = 5.6 * k;
      ellipse(ctx, cx, cy, rx + 0.7 * k, ry + 0.7 * k, '#6b4424');
      ellipse(ctx, cx, cy, rx, ry, T.color);
      poly(ctx, [cx, cy, cx, cy - ry, cx - rx * 0.72, cy - ry * 0.7], '#f4efe0');
      poly(ctx, [cx, cy, cx, cy + ry, cx + rx * 0.72, cy + ry * 0.7], '#f4efe0');
      line(ctx, cx - rx, cy, cx + rx, cy, shade(T.color, -0.4), 0.4 * k);
      ring(ctx, cx, cy, rx + 0.4 * k, ry + 0.4 * k, '#3a2616', 0.8 * k);
      rivets(cx, cy, rx * 0.72, ry * 0.72, 8, shade(STEEL, 0.2));
      ellipse(ctx, cx, cy, 1.6 * k, 1.6 * k, STEEL);
      ellipse(ctx, cx - 0.4 * k, cy - 0.5 * k, 0.6 * k, 0.5 * k, shade(STEEL, 0.6));
      break;
    }
    case 'japan':
      // tate: a standing paper-and-wood screen shield with a family crest
      poly(ctx, [x - 4 * k, y + 2 * k, x - 4 * k, y - 11 * k, x + 2.5 * k, y - 12.5 * k, x + 2.5 * k, y + 1 * k], '#8a6a44');
      poly(ctx, [x - 4 * k, y + 2 * k, x - 4 * k, y - 11 * k, x - 1 * k, y - 11.6 * k, x - 1 * k, y + 1.6 * k], shade('#8a6a44', 0.18));
      for (const v of [-0.5, 3.5, 7.5]) line(ctx, x - 4 * k, y - v * k + 1 * k, x + 2.5 * k, y - v * k - 0.5 * k, shade('#8a6a44', -0.35), 0.5 * k); // board joints
      ctx.strokeStyle = '#2a2a34';
      ctx.lineWidth = 0.9 * k;
      ctx.beginPath();
      ctx.moveTo(x - 4 * k, y + 2 * k);
      ctx.lineTo(x - 4 * k, y - 11 * k);
      ctx.lineTo(x + 2.5 * k, y - 12.5 * k);
      ctx.lineTo(x + 2.5 * k, y + 1 * k);
      ctx.closePath();
      ctx.stroke();
      line(ctx, x - 4 * k, y - 11 * k, x + 2.5 * k, y - 12.5 * k, T.color, 1.6 * k); // painted top edge
      line(ctx, x - 4 * k, y + 1.6 * k, x + 2.5 * k, y + 0.4 * k, T.colorDark, 1.2 * k); // ...and foot
      line(ctx, x - 1.5 * k, y + 2 * k, x - 3.5 * k, y + 5.4 * k, '#3a2a22', 0.9 * k); // prop stick
      for (const [rx, ry] of [[-3.2, -9.8], [1.7, -11], [-3.2, 0.2], [1.7, -0.6]] as const) ellipse(ctx, x + rx * k, y + ry * k, 0.5 * k, 0.5 * k, GOLD); // studs
      ellipse(ctx, x - 0.8 * k, y - 5.6 * k, 2.2 * k, 2.4 * k, T.color);
      for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + (i * Math.PI * 2) / 3; ellipse(ctx, x - 0.8 * k + Math.cos(a) * 1.1 * k, y - 5.6 * k + Math.sin(a) * 1.2 * k, 0.8 * k, 0.9 * k, '#f4f1ea'); }
      break;
    case 'mongols':
      // a small round leather-and-wicker shield with a brass boss
      ellipse(ctx, x - 1 * k, y - 5 * k, 4.4 * k, 4.8 * k, '#c9a45a');
      for (const r of [3.2, 2, 0.9]) ring(ctx, x - 1 * k, y - 5 * k, r * k, r * 1.1 * k, '#8a6a3a', 0.7 * k);
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; line(ctx, x - 1 * k, y - 5 * k, x - 1 * k + Math.cos(a) * 4 * k, y - 5 * k + Math.sin(a) * 4.4 * k, shade('#c9a45a', -0.25), 0.4 * k); } // wicker spokes
      ring(ctx, x - 1 * k, y - 5 * k, 4.4 * k, 4.8 * k, '#5a3a1e', 0.9 * k);
      ellipse(ctx, x - 1 * k, y - 5 * k, 1.3 * k, 1.3 * k, GOLD);
      ellipse(ctx, x - 1.3 * k, y - 5.4 * k, 0.5 * k, 0.4 * k, shade(GOLD, 0.6));
      ring(ctx, x - 1 * k, y - 5 * k, 3.9 * k, 4.3 * k, '#c8372d', 0.6 * k); // red binding
      rivets(x - 1 * k, y - 5 * k, 3 * k, 3.4 * k, 6, shade(GOLD, 0.3));
      for (const ox of [-1.6, -0.6, 0.5]) line(ctx, x + ox * k, y - 0.6 * k, x + (ox - 0.4) * k, y + 2.6 * k, ox === -0.6 ? '#c8372d' : '#1a1612', 0.7 * k); // dangling horsehair
      break;
    case 'greeks':
      // hoplon: a great round bronze-faced shield with a painted emblem and a dotted rim
      ellipse(ctx, x - 1 * k, y - 5 * k, 6.2 * k, 6.8 * k, shade(BRONZE, -0.15));
      ellipse(ctx, x - 1 * k, y - 5 * k, 5.2 * k, 5.8 * k, T.color);
      ctx.save();
      ctx.setLineDash([1.2 * k, 1.2 * k]);
      ring(ctx, x - 1 * k, y - 5 * k, 5.7 * k, 6.3 * k, shade(BRONZE, 0.4), 0.6 * k);
      ctx.restore();
      poly(ctx, [x - 4 * k, y - 2 * k, x - 1 * k, y - 9 * k, x + 2 * k, y - 2 * k, x + 0.6 * k, y - 2 * k, x - 1 * k, y - 6 * k, x - 2.6 * k, y - 2 * k], '#f4efe0');
      line(ctx, x - 1 * k, y - 8.4 * k, x - 1 * k, y - 6.6 * k, shade(T.color, -0.3), 0.5 * k);
      ellipse(ctx, x - 1.6 * k, y - 8.4 * k, 1.3 * k, 1 * k, shade(BRONZE, 0.5)); // sheen
      break;
    case 'zulu':
      // isihlangu: a tall oval cowhide shield on a stick, stitched down the middle
      line(ctx, x - 1 * k, y + 4 * k, x - 1 * k, y - 18 * k, WOOD, 1 * k);
      ellipse(ctx, x - 1 * k, y - 7 * k, 4.2 * k, 8.4 * k, '#f4efe0');
      ring(ctx, x - 1 * k, y - 7 * k, 4.2 * k, 8.4 * k, '#8a5a33', 0.8 * k);
      for (const [ox, oy, r] of [[-2, -11, 1.8], [1, -5, 2.2], [-2.2, -2, 1.4], [0.8, -10.5, 1], [-1, -6, 0.9]]) ellipse(ctx, x + ox * k, y + oy * k, r * k, r * 1.2 * k, '#2a1a10');
      line(ctx, x - 1 * k, y - 14 * k, x - 1 * k, y, '#8a5a33', 0.8 * k);
      for (let i = 0; i < 7; i++) line(ctx, x - 1.7 * k, y - 13 * k + i * 2 * k, x - 0.3 * k, y - 13 * k + i * 2 * k, '#5a3a22', 0.4 * k); // stitches
      poly(ctx, [x - 2.4 * k, y - 15.2 * k, x - 1 * k, y - 18.6 * k, x + 0.4 * k, y - 15.2 * k], '#3a2416'); // hide tuft
      break;
  }
  void kind;
}

// ---------------------------------------------------------------- mounts & machines

/**
 * A voxel horse (also used for chariots). Returns the saddle point. With `cloth` it wears a full
 * caparison; otherwise a saddle blanket in `blanket`. Legs end in hooves, the head has a bridle.
 */
export function drawHorse(ctx: Ctx, x: number, y: number, k: number, coat: string, mane: string, cloth?: string, blanket = '#8a3030') {
  const leg = shade(coat, -0.25);
  const hoof = '#2a1a10';
  const legs: [number, number][] = [[-6, -1.5], [-3, 0.5], [4, -0.5], [7, 1.5]];
  for (const [lx, ly] of legs) {
    box(ctx, x + lx * k, y + ly * k, 2.2 * k, 7 * k, leg);
    faceQuad(ctx, 'L', x + lx * k, y + ly * k, 2.2 * k, 7 * k, 0, 1, 0.42, 0.5, shade(leg, 0.2)); // knee
    faceQuad(ctx, 'R', x + lx * k, y + ly * k, 2.2 * k, 7 * k, 0, 1, 0.42, 0.5, shade(leg, 0.2));
    faceQuad(ctx, 'R', x + lx * k, y + ly * k, 2.2 * k, 7 * k, 0, 1, 0.16, 0.22, shade(coat, 0.45)); // white sock line
    box(ctx, x + lx * k, y + ly * k, 2.4 * k, 1.5 * k, hoof);
  }
  // the tail: three strands
  poly(ctx, [x - 9 * k, y - 11 * k, x - 12.5 * k, y - 3 * k, x - 10.5 * k, y - 3.5 * k], mane);
  poly(ctx, [x - 9 * k, y - 10.5 * k, x - 11.2 * k, y - 2 * k, x - 9.4 * k, y - 4.2 * k], shade(mane, 0.2));
  poly(ctx, [x - 9 * k, y - 11 * k, x - 13.2 * k, y - 6.4 * k, x - 12 * k, y - 4.2 * k], shade(mane, -0.2));
  box(ctx, x, y - 6 * k, 17 * k, 7 * k, coat);
  band(ctx, x, y - 6 * k, 17 * k, 7 * k, 0, 0.16, shade(coat, -0.32)); // belly in shadow
  faceQuad(ctx, 'R', x, y - 6 * k, 17 * k, 7 * k, 0.55, 0.95, 0.3, 0.85, shade(coat, 0.08)); // shoulder muscle
  faceQuad(ctx, 'L', x, y - 6 * k, 17 * k, 7 * k, 0.1, 0.5, 0.3, 0.85, shade(coat, 0.08)); // haunch
  if (cloth) {
    band(ctx, x, y - 6 * k, 17 * k, 7 * k, 0, 0.7, cloth);
    band(ctx, x, y - 6 * k, 17 * k, 7 * k, 0, 0.12, GOLD);
    band(ctx, x, y - 6 * k, 17 * k, 7 * k, 0.6, 0.66, shade(cloth, 0.4));
  } else {
    band(ctx, x - 1 * k, y - 6 * k, 9 * k, 7 * k, 0.62, 0.92, blanket); // saddle blanket
    band(ctx, x - 1 * k, y - 6 * k, 9 * k, 7 * k, 0.62, 0.68, GOLD);
  }
  // saddle, and a stirrup hanging on the near side
  box(ctx, x - 1 * k, y - 12.6 * k, 6 * k, 1.5 * k, '#5a3a1e');
  box(ctx, x - 4 * k, y - 12.8 * k, 1.6 * k, 2.4 * k, '#4a2e16'); // cantle
  box(ctx, x + 2.4 * k, y - 12.6 * k, 1.4 * k, 2 * k, '#4a2e16'); // pommel
  line(ctx, x + 1.2 * k, y - 11.4 * k, x + 2.2 * k, y - 6.2 * k, '#4a3322', 0.7 * k);
  ring(ctx, x + 2.3 * k, y - 5.6 * k, 1.2 * k, 0.8 * k, STEEL, 0.6 * k);
  box(ctx, x + 7.5 * k, y - 10 * k, 5 * k, 7 * k, coat); // neck
  faceQuad(ctx, 'R', x + 7.5 * k, y - 10 * k, 5 * k, 7 * k, 0, 1, 0.9, 1, shade(coat, -0.15)); // crest
  box(ctx, x + 10.5 * k, y - 15 * k, 7 * k, 5 * k, coat); // head
  box(ctx, x + 14.2 * k, y - 14.6 * k, 3.2 * k, 3 * k, shade(coat, 0.15)); // muzzle
  faceQuad(ctx, 'R', x + 14.2 * k, y - 14.6 * k, 3.2 * k, 3 * k, 0.35, 0.6, 0.3, 0.5, '#1a1010'); // nostril
  faceQuad(ctx, 'R', x + 10.5 * k, y - 15 * k, 7 * k, 5 * k, 0.45, 0.62, 0.45, 0.75, '#101010'); // eye
  faceQuad(ctx, 'R', x + 10.5 * k, y - 15 * k, 7 * k, 5 * k, 0.5, 0.56, 0.62, 0.72, '#ffffff'); // ...with a glint
  box(ctx, x + 7 * k, y - 17 * k, 3 * k, 6 * k, mane); // mane
  box(ctx, x + 6 * k, y - 13.8 * k, 1.8 * k, 3.2 * k, shade(mane, 0.18));
  box(ctx, x + 5 * k, y - 10.6 * k, 1.8 * k, 3 * k, shade(mane, -0.12));
  box(ctx, x + 9.6 * k, y - 20 * k, 1.6 * k, 2.4 * k, coat); // ear
  faceQuad(ctx, 'R', x + 9.6 * k, y - 20 * k, 1.6 * k, 2.4 * k, 0.2, 0.8, 0.2, 0.75, shade(coat, -0.35)); // inside the ear
  box(ctx, x + 8.4 * k, y - 20.6 * k, 1.6 * k, 2 * k, shade(mane, 0.1)); // forelock
  // bridle: cheek strap, noseband, bit and a rein looped back to the saddle
  const tack = '#4a2e16';
  line(ctx, x + 12.4 * k, y - 15.3 * k, x + 11.3 * k, y - 18 * k, tack, 0.6 * k);
  line(ctx, x + 11.3 * k, y - 18 * k, x + 9.4 * k, y - 19.2 * k, tack, 0.6 * k);
  line(ctx, x + 13.4 * k, y - 15.4 * k, x + 15.6 * k, y - 15.8 * k, tack, 0.7 * k);
  ellipse(ctx, x + 16.2 * k, y - 13.6 * k, 0.6 * k, 0.6 * k, GOLD);
  ctx.strokeStyle = tack;
  ctx.lineWidth = 0.6 * k;
  ctx.beginPath();
  ctx.moveTo(x + 16.2 * k, y - 13.6 * k);
  ctx.quadraticCurveTo(x + 9 * k, y - 8.6 * k, x + 2.6 * k, y - 12.2 * k);
  ctx.stroke();
  return { x: x - 1 * k, y: y - 13 * k };
}

/** A lance: a shaft with a wrapped grip and hand guard, a two-tone head and a swallow-tailed pennant. */
function lance(ctx: Ctx, hx: number, hy: number, color: string, thick: number, pennant: boolean) {
  const tx = hx + 8, ty = hy - 20;
  line(ctx, hx - 3, hy + 6, tx, ty, WOOD, thick);
  line(ctx, hx - 3.6, hy + 6, tx - 0.6, ty, shade(WOOD, 0.35), 0.5);
  for (const t of [0.1, 0.16, 0.22]) line(ctx, hx - 3 + 11 * t - 1, hy + 6 - 26 * t + 0.4, hx - 3 + 11 * t + 1, hy + 6 - 26 * t - 0.4, '#3a2616', 0.8); // grip wrap
  ellipse(ctx, hx - 0.4, hy + 0.4, 2.6, 1.5, shade(STEEL, -0.1)); // hand guard
  poly(ctx, [tx + 0.4, ty - 5, tx - 1.4, ty + 0.4, tx + 0.4, ty + 0.8], shade(STEEL, 0.25));
  poly(ctx, [tx + 0.4, ty - 5, tx + 2.2, ty + 0.2, tx + 0.4, ty + 0.8], shade(STEEL, -0.25));
  if (pennant) {
    poly(ctx, [tx - 0.4, ty + 1.6, tx + 7, ty + 2.6, tx + 4.6, ty + 4.4, tx + 7, ty + 6.4, tx - 0.8, ty + 5.4], color);
    poly(ctx, [tx - 0.4, ty + 1.6, tx + 7, ty + 2.6, tx + 6.2, ty + 3.4, tx - 0.5, ty + 3], shade(color, 0.35));
  }
}

function drawRider(ctx: Ctx, kind: UnitKind, tribe: TribeId, x: number, y: number) {
  const knight = kind === 'knight';
  const T = TRIBES[tribe];
  const coat = knight ? '#eeeeee' : tribe === 'pirates' ? '#3a2a22' : tribe === 'mongols' ? '#a07845' : '#8a5a33';
  const saddle = drawHorse(ctx, x - 1, y + 3, 0.95, coat, knight ? '#9aa3ad' : '#2a1a10', knight ? T.color : undefined, T.color);
  if (knight) {
    // the warhorse's chamfron and a plume between its ears
    const hx = x - 1 + 10.5 * 0.95, hy = y + 3 - 15 * 0.95;
    faceQuad(ctx, 'R', hx, hy, 7 * 0.95, 5 * 0.95, 0.05, 0.7, 0.1, 0.95, metalOf(tribe));
    faceQuad(ctx, 'R', hx, hy, 7 * 0.95, 5 * 0.95, 0.4, 0.55, 0.3, 0.95, shade(metalOf(tribe), 0.4));
    poly(ctx, [hx - 1, hy - 5, hx - 0.5, hy - 10, hx + 2.2, hy - 6.4, hx + 1, hy - 4.6], T.color);
  }
  if (tribe === 'egypt' || tribe === 'aztec') {
    const hx = x - 1 + 10.5 * 0.95, hy = y + 3 - 15 * 0.95;
    if (tribe === 'egypt') {
      // twin ostrich plumes on the brow, a gilded blue breast collar and a lotus-fringed blanket
      poly(ctx, [hx + 1, hy - 4, hx - 1, hy - 11, hx + 2.4, hy - 5], '#f4efe0');
      poly(ctx, [hx + 2, hy - 4, hx + 3.6, hy - 10, hx + 4, hy - 4.6], '#2b5fb8');
      band(ctx, x - 1 + 7.5 * 0.95, y + 3 - 10 * 0.95, 5 * 0.95, 7 * 0.95, 0.2, 0.4, '#2b5fb8');
      band(ctx, x - 1 + 7.5 * 0.95, y + 3 - 10 * 0.95, 5 * 0.95, 7 * 0.95, 0.4, 0.46, GOLD);
    } else {
      // feather crest, jade cheek disc and a jaguar-spotted saddle cloth
      for (let i = 0; i < 3; i++) poly(ctx, [hx + 0.6, hy - 4, hx - 2 + i * 2.6, hy - 10 - (i % 2) * 2, hx + 2.6 + i * 0.5, hy - 4], ['#1faa6b', '#d6453b', GOLD][i]);
      ellipse(ctx, hx + 3.6, hy + 1.6, 1.3, 1.3, '#1faa9b');
      for (const [u, v] of [[0.62, 0.3], [0.78, 0.5], [0.7, 0.68]] as const) faceQuad(ctx, 'R', x - 1, y + 3 - 6 * 0.95, 17 * 0.95, 7 * 0.95, u, u + 0.08, v * 0.7, v * 0.7 + 0.16, '#3a2410');
    }
  }
  if (tribe === 'pirates' || tribe === 'vikings') { // saddle cloth: a black cloth edged in gold, or a striped wool blanket
    const c = tribe === 'pirates' ? DARK : T.color, e = tribe === 'pirates' ? GOLD : '#f4efe0';
    poly(ctx, [saddle.x - 6, saddle.y - 1, saddle.x + 3.6, saddle.y - 1, saddle.x + 3, saddle.y + 6, saddle.x - 1.5, saddle.y + 4.6, saddle.x - 5, saddle.y + 7.4], c);
    line(ctx, saddle.x - 5, saddle.y + 7.2, saddle.x - 1.5, saddle.y + 4.6, e, 0.9);
    line(ctx, saddle.x - 1.5, saddle.y + 4.6, saddle.x + 3, saddle.y + 5.8, e, 0.9);
  }
  if (tribe === 'mongols') {
    // a shaggy steppe pony: piebald patches, a bristling mane, a knotted tail and saddle bags
    const hx0 = x - 1, hy0 = y + 3, kh = 0.95;
    const patch = kind === 'horsearcher' ? '#f2ead8' : kind === 'knight' ? '#6a5a4a' : '#5a3a22';
    faceQuad(ctx, 'R', hx0, hy0 - 6 * kh, 17 * kh, 7 * kh, 0.5, 0.86, 0.3, 0.88, patch);
    faceQuad(ctx, 'R', hx0, hy0 - 6 * kh, 17 * kh, 7 * kh, 0.62, 0.72, 0.5, 0.74, shade(patch, 0.15));
    faceQuad(ctx, 'L', hx0, hy0 - 6 * kh, 17 * kh, 7 * kh, 0.12, 0.42, 0.42, 0.95, patch);
    for (let i = 0; i < 4; i++) poly(ctx, [hx0 + (3.4 + i * 1.6) * kh, hy0 - (14 + i * 1.8) * kh, hx0 + (3.6 + i * 1.6) * kh, hy0 - (19.2 + i * 1.8) * kh, hx0 + (5.6 + i * 1.6) * kh, hy0 - (15.4 + i * 1.8) * kh], '#1a1008'); // mane bristles
    line(ctx, hx0 - 11 * kh, hy0 - 8.6 * kh, hx0 - 9.4 * kh, hy0 - 7.6 * kh, '#c8372d', 1.6 * kh); // the tail is tied up in red
    box(ctx, hx0 - 5.4 * kh, hy0 - 8.6 * kh, 2.6 * kh, 4.4 * kh, '#6a4a2a'); // saddle bag
    band(ctx, hx0 - 5.4 * kh, hy0 - 8.6 * kh, 2.6 * kh, 4.4 * kh, 0.55, 0.7, GOLD);
    ellipse(ctx, hx0 + 13.2 * kh, hy0 - 19.8 * kh, 0.9 * kh, 1.1 * kh, '#c8372d'); // a tassel on the brow band
    if (kind === 'horsearcher') {
      // the tug: a horsehair standard on a pole behind the saddle
      const bx = saddle.x - 9, by = saddle.y + 1;
      line(ctx, bx, by, bx - 1.5, by - 28, '#4a2e16', 1.1);
      line(ctx, bx - 4, by - 24, bx + 1.4, by - 25.6, '#c9974a', 1);
      ellipse(ctx, bx - 1.5, by - 29, 1.6, 1.6, GOLD);
      for (const [ox, oy, c] of [[-4.6, 8, '#1a1612'], [-2.4, 9.4, '#c8372d'], [-0.2, 10, '#1a1612'], [2, 9, '#c8372d'], [3.6, 7.6, '#1a1612']] as const) line(ctx, bx - 1.5 + ox * 0.4, by - 26, bx - 1.5 + ox, by - 26 + oy, c, 0.9);
      // a bow case and a full quiver hang from the saddle
      box(ctx, saddle.x + 3.2, saddle.y + 1.4, 2.6, 6, '#8a5a2b');
      band(ctx, saddle.x + 3.2, saddle.y + 1.4, 2.6, 6, 0.6, 0.72, '#c8372d');
      for (const i of [-1, 0, 1]) line(ctx, saddle.x + 3.2 + i * 0.8, saddle.y - 4.4, saddle.x + 3 + i * 1.2, saddle.y - 8.4, '#c9b58a', 0.6);
    }
  } else if (tribe === 'japan') {
    // a lacquered saddle with a raised gilt pommel, knotted cords and tassels, red bridle pom-poms
    const hx0 = x - 1, hy0 = y + 3, kh = 0.95;
    box(ctx, hx0 - 1 * kh, hy0 - 13.4 * kh, 6 * kh, 0.9 * kh, '#1a1a22', GOLD);
    for (const [tx, ty, len] of [[7.6, -6, 2.2], [4.6, -5.8, 1.8], [-8.6, -8.6, 2.6]] as const) { // cord and tassel
      line(ctx, hx0 + tx * kh, hy0 + ty * kh, hx0 + (tx + 0.4) * kh, hy0 + (ty + len) * kh, T.color, 0.9 * kh);
      ellipse(ctx, hx0 + (tx + 0.4) * kh, hy0 + (ty + len + 0.8) * kh, 1 * kh, 1.3 * kh, GOLD);
    }
    line(ctx, hx0 + 4.4 * kh, hy0 - 7.6 * kh, hx0 + 9.6 * kh, hy0 - 8.4 * kh, T.color, 1 * kh); // chest strap
    ellipse(ctx, hx0 + 12.6 * kh, hy0 - 17.2 * kh, 0.9 * kh, 0.9 * kh, '#c8372d');
    ellipse(ctx, hx0 + 9.4 * kh, hy0 - 18.6 * kh, 0.9 * kh, 0.9 * kh, '#c8372d');
    band(ctx, hx0, hy0 - 6 * kh, 17 * kh, 7 * kh, 0.02, 0.07, '#1a1a22');
  }
  const b = figure(ctx, kind, tribe, saddle.x, saddle.y, 0.9, true);
  if (kind === 'horsearcher') return drawWeapon(ctx, 'archer', tribe, b, 0.9);
  if (kind === 'knight' || kind === 'rider') drawShield(ctx, tribe, kind, b.off.x - 1.5, b.off.y + 1.5, 0.7);
  lance(ctx, b.hand.x, b.hand.y, tribe === 'pirates' ? '#15151a' : T.color, knight ? 2 : 1.6, true);
  if (tribe === 'pirates') ellipse(ctx, b.hand.x + 12.6, b.hand.y - 15.6, 1, 0.9, '#ffffff'); // skull on the black pennant
  if (tribe === 'vikings') for (const t of [0.34, 0.42]) line(ctx, b.hand.x - 3 + 11 * t - 1, b.hand.y + 6 - 26 * t, b.hand.x - 3 + 11 * t + 1, b.hand.y + 6 - 26 * t, GOLD, 0.8); // gilt bands on the lance
}

function drawChariot(ctx: Ctx, tribe: TribeId, x: number, y: number) {
  const T = TRIBES[tribe];
  drawHorse(ctx, x + 9, y + 4, 0.8, '#efe6d2', '#c9974a', tribe === 'egypt' ? '#2b5fb8' : undefined, T.color);
  if (tribe === 'egypt') {
    // ostrich-plume crest between the horse's ears
    poly(ctx, [x + 16.5, y - 9, x + 15, y - 17, x + 18.5, y - 10], '#f4efe0');
    poly(ctx, [x + 17.4, y - 9, x + 19.6, y - 16, x + 19.6, y - 9.6], '#c8372d');
  }
  // the pole, the yoke on the horse's shoulders and the reins back to the driver
  line(ctx, x - 2, y - 4, x + 9, y - 3, WOOD, 1.6);
  line(ctx, x - 2, y - 4.6, x + 9, y - 3.6, shade(WOOD, 0.4), 0.5);
  line(ctx, x + 10.2, y - 9.6, x + 13.6, y - 8.2, '#5a3a1e', 1.2);
  ellipse(ctx, x + 11.6, y - 9, 1, 1, GOLD);
  box(ctx, x - 4, y - 1, 12, 7, '#c9974a', '#8a5a2b');
  band(ctx, x - 4, y - 1, 12, 7, 0.58, 0.72, T.color); // painted frieze
  band(ctx, x - 4, y - 1, 12, 7, 0.76, 0.82, GOLD);
  band(ctx, x - 4, y - 1, 12, 7, 0.0, 0.08, shade('#c9974a', -0.3));
  for (const u of [0.15, 0.4, 0.65, 0.9]) faceQuad(ctx, 'R', x - 4, y - 1, 12, 7, u - 0.03, u + 0.03, 0.58, 0.72, shade(T.color, 0.4)); // studs in the frieze
  if (tribe === 'egypt') {
    ellipse(ctx, x + 2.4, y + 0.2, 1.6, 1.6, GOLD); // a winged sun disc on the car's flank
    line(ctx, x - 0.8, y + 0.2, x + 5.6, y + 0.2, '#2b5fb8', 1);
    ellipse(ctx, x + 2.4, y + 0.2, 0.6, 0.6, '#c8372d');
    band(ctx, x - 4, y - 1, 12, 7, 0.9, 1, '#2b5fb8'); // lapis rail
    line(ctx, x + 6, y - 7, x + 6, y - 9.4, GOLD, 1.2); // gilded finial on the front rail
  }
  // a quiver of javelins hung on the side and the rail at the front
  box(ctx, x - 8.5, y - 6.5, 2.2, 5, '#6b4424');
  for (const i of [-0.6, 0.6]) line(ctx, x - 7.4 + i, y - 11.5, x - 7.4 + i * 2, y - 16.5, '#c9b58a', 0.6);
  line(ctx, x + 6, y - 7, x + 6.2, y - 2, '#6b4424', 0.8);
  line(ctx, x + 6, y - 7.2, x - 3, y - 8.6, '#8a5a2b', 0.9);
  const b = figure(ctx, 'archer', tribe, x - 4, y - 8, 0.85, true);
  drawWeapon(ctx, 'archer', tribe, b, 0.85);
  // a spoked wheel with a heavy rim and a gilded hub
  const cx = x - 7, cy = y - 1;
  ctx.strokeStyle = '#4a2e16';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 4.4, 5.8, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 4.4, 5.8, 0, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + 0.3;
    line(ctx, cx, cy, cx + Math.cos(a) * 4.2, cy + Math.sin(a) * 5.6, '#6b4424', 0.9);
  }
  ellipse(ctx, cx, cy, 1.4, 1.7, GOLD);
  ellipse(ctx, cx - 0.4, cy - 0.5, 0.5, 0.6, shade(GOLD, 0.6));
}

/** Each empire fields its own siege engine. */
function drawCatapult(ctx: Ctx, tribe: TribeId, x: number, y: number) {
  const T = TRIBES[tribe];
  const wheels = (hub: string) => {
    for (const [wx, wy] of [[-7, 1], [6, 3]]) {
      ellipse(ctx, x + wx, y + wy, 3.7, 4.1, '#3f2814');
      ellipse(ctx, x + wx, y + wy, 3, 3.4, '#7a5230');
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 4 + 0.2;
        line(ctx, x + wx - Math.cos(a) * 3, y + wy - Math.sin(a) * 3.3, x + wx + Math.cos(a) * 3, y + wy + Math.sin(a) * 3.3, '#3f2814', 0.6); // spokes
      }
      ellipse(ctx, x + wx, y + wy, 1.3, 1.5, hub);
      ellipse(ctx, x + wx - 0.3, y + wy - 0.4, 0.45, 0.5, shade(hub, 0.6));
    }
  };
  const flag = (fx: number, fy: number, color: string) => {
    line(ctx, fx, fy, fx, fy - 15, '#5a3b1e', 1.4);
    poly(ctx, [fx, fy - 15, fx + 7, fy - 13, fx, fy - 10], color);
  };
  if (tribe !== 'pirates' && tribe !== 'polynesia') {
    for (const [ax, ay, ar] of [[-14, 5, 2.2], [-11, 6, 2], [-12.5, 3.2, 1.9]] as const) {
      ellipse(ctx, x + ax, y + ay, ar, ar * 0.9, '#77777e');
      ellipse(ctx, x + ax - ar * 0.3, y + ay - ar * 0.3, ar * 0.4, ar * 0.35, '#a8a8b0');
    }
  }
  switch (tribe) {
    case 'pirates': {
      // deck cannon on a timber carriage, with a stack of shot
      box(ctx, x - 1, y - 1, 16, 5, '#6b4424');
      wheels('#2a2a30');
      line(ctx, x - 7, y - 8, x + 11, y - 15, '#1f1f24', 6.5);
      line(ctx, x - 6, y - 9.5, x + 10, y - 16, '#4a4a54', 1.6);
      ellipse(ctx, x + 11.5, y - 15.3, 3.4, 3.4, '#101014');
      ellipse(ctx, x + 11.5, y - 15.3, 1.8, 1.8, '#000000');
      ellipse(ctx, x - 8, y - 7.5, 2.2, 2.2, '#3a3a42');
      for (const [bx, by] of [[-13, 4], [-10, 5], [-11.5, 2.4]]) ellipse(ctx, x + bx, y + by, 1.9, 1.9, '#1a1a1f');
      flag(x - 3, y - 4, '#15151a');
      ellipse(ctx, x + 1.2, y - 17, 1, 1, '#ffffff');
      for (const t of [0.25, 0.55]) line(ctx, x - 7 + 18 * t, y - 8 - 7 * t - 3, x - 7 + 18 * t, y - 8 - 7 * t + 3, '#7a7a86', 0.9); // iron hoops on the barrel
      ellipse(ctx, x - 6, y - 9.6, 1, 1, '#ff9a2e'); // a glowing fuse
      ellipse(ctx, x - 6, y - 9.6, 0.5, 0.5, '#fff2a0');
      line(ctx, x - 12, y + 6, x - 9, y + 7, '#c9b58a', 0.8); // a coil of slow match
      ring(ctx, x - 12, y + 7, 1.6, 1, '#c9b58a', 0.7);
      ring(ctx, x + 11.2, y - 15.2, 3.7, 3.7, GOLD, 0.8); // gilt muzzle ring
      ellipse(ctx, x - 1, y - 11.6, 1.1, 0.9, GOLD); // dolphin handles
      ellipse(ctx, x + 3, y - 13.2, 1.1, 0.9, GOLD);
      ellipse(ctx, x - 8.6, y - 7.8, 0.8, 0.6, shade('#3a3a42', 0.5)); // cascabel highlight
      line(ctx, x - 5.5, y - 8.5, x + 10, y - 14.6, shade('#1f1f24', 0.45), 0.8); // light along the barrel
      box(ctx, x + 10, y + 4, 4.4, 3.6, '#7a5230'); // a powder keg with a red band and a skull
      band(ctx, x + 10, y + 4, 4.4, 3.6, 0.3, 0.45, '#b3302a');
      band(ctx, x + 10, y + 4, 4.4, 3.6, 0.72, 0.84, '#3a3a40');
      faceQuad(ctx, 'R', x + 10, y + 4, 4.4, 3.6, 0.42, 0.68, 0.5, 0.68, '#f4efe0');
      line(ctx, x + 1, y + 6.4, x + 9, y + 8.4, '#8a5a2b', 0.9); // rammer lying on the ground
      ellipse(ctx, x + 9.4, y + 8.5, 1, 0.8, '#c9b58a');
      line(ctx, x - 3, y - 4, x - 1.6, y - 2.6, '#f4efe0', 0.6); // crossbones on the flag
      line(ctx, x - 1.6, y - 4, x - 3, y - 2.6, '#f4efe0', 0.6);
      break;
    }
    case 'egypt': {
      // giant bow on a sledge, painted gold and blue
      box(ctx, x, y - 1, 19, 3, '#c9974a');
      box(ctx, x - 2, y - 4, 4, 6, '#8a5a2b');
      line(ctx, x - 9, y - 7, x + 9, y - 13, '#8a5a2b', 3.2);
      faceQuadLine(ctx, x - 9, y - 7, x + 9, y - 13);
      ctx.strokeStyle = '#5a3b1e';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(x + 2, y - 23);
      ctx.quadraticCurveTo(x + 11, y - 15, x + 10, y - 3);
      ctx.stroke();
      line(ctx, x + 2, y - 23, x - 3, y - 11, '#f4efe0', 0.8);
      line(ctx, x - 3, y - 11, x + 10, y - 3, '#f4efe0', 0.8);
      line(ctx, x - 4, y - 10, x + 13, y - 14, '#6b4424', 1.6);
      poly(ctx, [x + 13, y - 16, x + 16.5, y - 14.2, x + 13, y - 12.4], BRONZE);
      flag(x - 9, y - 1, '#2b5fb8');
      for (const ox of [-6, -1, 5]) ellipse(ctx, x + ox, y - 0.4, 0.8, 0.8, GOLD); // gold inlay on the sledge
      band(ctx, x - 2, y - 4, 4, 6, 0.2, 0.34, '#2b5fb8'); // painted post
      for (const u of [0.1, 0.35, 0.6, 0.85]) faceQuad(ctx, 'R', x, y - 1, 19, 3, u, u + 0.08, 0.2, 0.7, '#2b5fb8'); // hieroglyph panels
      line(ctx, x - 9, y - 7, x - 3, y - 8.8, GOLD, 1); // gilded bow stock
      ellipse(ctx, x + 2, y - 23.4, 1.2, 1.2, GOLD); // tipped bow nock
      ellipse(ctx, x - 2, y - 7, 1.4, 1.4, '#c8372d'); // winding-drum
      line(ctx, x + 10, y - 3, x + 12, y - 4.2, '#5a3b1e', 0.9); // the trigger
      for (const oy of [0, 1.8, 3.6]) { line(ctx, x - 16, y + oy, x - 11, y + oy - 0.8, '#6b4424', 0.8); poly(ctx, [x - 11, y + oy - 1.8, x - 8.8, y + oy - 0.8, x - 11, y + oy + 0.2], BRONZE); } // spare bolts
      break;
    }
    case 'aztec': {
      // tall painted A-frame stone thrower hung with feathers
      box(ctx, x, y - 1, 17, 4, '#8a5a2b');
      wheels(GOLD);
      line(ctx, x - 5, y - 3, x - 1, y - 21, '#b0443a', 2.6);
      line(ctx, x + 4, y - 1, x + 0, y - 21, '#1faa9b', 2.6);
      line(ctx, x - 7, y - 4, x + 10, y - 27, '#6b4424', 2.8);
      ellipse(ctx, x + 10.5, y - 28, 3.8, 2.8, '#8a5a2b');
      ellipse(ctx, x + 10.5, y - 30, 2.6, 2.4, '#8a8a90');
      for (let i = 0; i < 3; i++) poly(ctx, [x - 1 + i * 0.4, y - 20, x - 4 + i * 2.5, y - 26, x + 0.5 + i * 1.5, y - 20], ['#1faa6b', '#d6453b', GOLD][i]);
      line(ctx, x - 3, y - 14, x + 2, y - 8, '#e6d3ad', 0.8); // cross-lashings on the frame
      line(ctx, x + 2, y - 14, x - 3, y - 8, '#e6d3ad', 0.8);
      line(ctx, x - 2, y - 20.5, x + 1.5, y - 19.5, '#e6d3ad', 1.2);
      ellipse(ctx, x + 10.5, y - 30.3, 1.4, 0.8, shade('#8a8a90', 0.5)); // glint on the stone
      ellipse(ctx, x - 2.6, y - 16, 1.8, 1.9, '#f4efe0'); // skull trophy on the frame
      ellipse(ctx, x - 3.1, y - 16.4, 0.5, 0.6, '#1a1a1a');
      ellipse(ctx, x - 2.1, y - 16.4, 0.5, 0.6, '#1a1a1a');
      for (const oy of [-10, -6.5]) line(ctx, x - 5.4 + (oy + 10) * -0.3, y + oy, x + 3.2 + (oy + 10) * 0.6, y + oy - 0.6, '#c8372d', 1); // painted bands
      for (const [fx, fy, fc] of [[8.6, -25, '#1faa6b'], [6.6, -21.6, '#d6453b']] as const) poly(ctx, [x + fx, y + fy, x + fx - 3.6, y + fy + 4, x + fx - 1.4, y + fy + 0.6], fc); // feather tail on the arm
      ellipse(ctx, x + 10.5, y - 31.6, 0.6, 0.5, '#f4efe0');
      break;
    }
    case 'polynesia': {
      // bamboo sling frame with a pile of coconuts
      box(ctx, x, y - 1, 17, 3, '#d2b56e');
      for (const ox of [-6, 5]) line(ctx, x + ox, y - 1, x + ox * 0.3, y - 19, '#c9a95a', 2.2);
      line(ctx, x - 7, y - 19, x + 6, y - 19, '#c9a95a', 2.2);
      line(ctx, x - 1, y - 19, x + 12, y - 29, '#8a6a3b', 1.4);
      ellipse(ctx, x + 12, y - 29, 3, 2.6, '#6b4424');
      for (const [bx, by] of [[-12, 4], [-9, 5], [-10.5, 2]]) {
        ellipse(ctx, x + bx, y + by, 2.4, 2.2, '#6b4424');
        ellipse(ctx, x + bx - 0.6, y + by - 0.6, 0.7, 0.7, '#2a1a10');
      }
      flag(x + 7, y + 1, T.color);
      for (const [px, py] of [[-6, -1], [-3, -8], [-0.5, -14]] as const) { line(ctx, x + px - 1.6, y + py - 0.6, x + px + 1.8, y + py + 0.8, '#f4efe0', 0.9); line(ctx, x + px - 1.6, y + py + 0.8, x + px + 1.8, y + py - 0.6, '#f4efe0', 0.9); } // cord lashings on the bamboo
      line(ctx, x + 4, y - 19, x + 12, y - 29, '#c9b58a', 0.6); // the sling
      break;
    }
    case 'vikings': {
      // a trebuchet on a plank bed: rune-carved frame, dragon-head arm, shields and a stack of rocks
      box(ctx, x, y - 1, 18, 4, '#6a4a2a');
      band(ctx, x, y - 1, 18, 4, 0.5, 0.66, T.color);
      wheels(GOLD);
      for (const [ax, ay] of [[-6, -1.4], [-2, -1.9], [2, -1.2], [6, -0.8]] as const) ellipse(ctx, x + ax, y + ay, 0.6, 0.6, shade('#6a4a2a', 0.4));
      box(ctx, x - 3, y - 6, 3, 9, '#8a5a2b');
      box(ctx, x + 3, y - 4.5, 3, 9, '#8a5a2b');
      for (const ox of [-3, 3]) { // rune marks and a painted stripe on each upright
        const oy = ox > 0 ? 1.5 : 0;
        faceQuad(ctx, 'R', x + ox, y - 6 + oy, 3, 9, 0.2, 0.8, 0.5, 0.62, T.color);
        for (const v of [0.72, 0.82]) faceQuad(ctx, 'R', x + ox, y - 6 + oy, 3, 9, 0.3, 0.7, v, v + 0.05, '#f4efe0');
      }
      line(ctx, x - 6, y - 4.4, x + 10, y - 24, '#5a3b1e', 3);
      line(ctx, x - 6, y - 5.4, x + 10, y - 25, shade('#5a3b1e', 0.4), 0.7);
      poly(ctx, [x + 9, y - 24, x + 15, y - 27.6, x + 17.4, y - 25, x + 14.6, y - 24.2, x + 15.4, y - 22.6, x + 11.4, y - 22], '#6a4a2a'); // dragon head on the arm
      poly(ctx, [x + 9, y - 24, x + 12, y - 27, x + 13, y - 25], shade('#6a4a2a', -0.25));
      poly(ctx, [x + 14.6, y - 24.2, x + 17.4, y - 25, x + 16, y - 23.6], '#f4efe0'); // fangs
      ellipse(ctx, x + 12.6, y - 25, 0.6, 0.6, '#ffcf33');
      line(ctx, x + 10, y - 22, x + 4, y - 3, '#c9b58a', 0.8); // sling
      ellipse(ctx, x + 4.6, y - 3, 2, 1.7, '#8a7a66'); // rock in the sling
      ellipse(ctx, x - 6, y - 4.4, 2, 2, '#3a3a40'); // counterweight
      ellipse(ctx, x - 6.2, y - 4.8, 0.7, 0.6, shade('#3a3a40', 0.6));
      for (const ox of [-8, 0]) { // round shields hung on the bed
        ellipse(ctx, x + ox + 1, y + 1.2, 2.2, 2.2, ox < -4 ? T.color : '#f4efe0');
        ellipse(ctx, x + ox + 1, y + 1.2, 0.7, 0.7, STEEL);
      }
      flag(x + 8, y + 1, T.color);
      break;
    }
    case 'japan': {
      // a lacquered counterweight trebuchet: black frame, red posts, a hanging weight and a crested banner
      box(ctx, x, y - 2, 18, 4, '#2a2a34');
      wheels('#c8372d');
      band(ctx, x, y - 2, 18, 4, 0.55, 0.75, GOLD);
      line(ctx, x - 5, y - 2, x - 1, y - 20, '#b0302a', 2.6);
      line(ctx, x + 5, y - 1, x + 1, y - 20, '#8a2420', 2.6);
      line(ctx, x - 3.4, y - 10, x + 3.4, y - 10, GOLD, 1);
      line(ctx, x - 7, y - 11, x + 11, y - 31, '#3a2a22', 2.8); // the throwing arm
      line(ctx, x - 7, y - 11.6, x + 11, y - 31.6, shade('#3a2a22', 0.4), 0.6);
      ellipse(ctx, x - 1.6, y - 17.2, 1.5, 1.5, GOLD); // pivot
      line(ctx, x - 7, y - 11, x - 8, y - 5, '#5a3a22', 0.9); // counterweight hangs from the short arm
      box(ctx, x - 8, y - 1.5, 5, 4, '#6a4a2a');
      band(ctx, x - 8, y - 1.5, 5, 4, 0.4, 0.6, '#c8372d');
      line(ctx, x + 11, y - 31, x + 13.4, y - 22, '#c9b58a', 0.7); // sling and stone
      ellipse(ctx, x + 13.6, y - 21, 2.4, 2, '#8a8a90');
      line(ctx, x - 1, y - 20, x - 1, y - 33, '#3a2a22', 1.2); // banner pole with the clan crest
      poly(ctx, [x - 1, y - 33, x - 8.5, y - 32, x - 8.5, y - 24, x - 1, y - 25], T.color);
      ellipse(ctx, x - 4.8, y - 28.6, 1.6, 1.7, '#f4f1ea');
      ellipse(ctx, x - 4.8, y - 28.6, 0.7, 0.8, T.color);
      poly(ctx, [x - 3.4, y - 20.6, x + 0, y - 24, x + 3.4, y - 20.6], '#3e4550'); // a little tiled gable over the pivot
      line(ctx, x - 3.4, y - 20.6, x + 3.4, y - 20.6, GOLD, 0.6);
      break;
    }
    case 'mongols': {
      // a light steppe mangonel on a felt-hooded cart, a horsehair tug at the back
      box(ctx, x, y - 2, 18, 4, '#8a5a2b');
      wheels('#c8372d');
      band(ctx, x, y - 2, 18, 4, 0.5, 0.7, T.color);
      ellipse(ctx, x - 5.4, y - 9.6, 5.4, 4, '#efe6d2'); // a little felt tent on the cart
      ellipse(ctx, x - 5.4, y - 11.4, 4.2, 2.6, '#f8f2e4');
      line(ctx, x - 10, y - 9.6, x - 0.8, y - 9.6, T.color, 0.9);
      line(ctx, x - 5.4, y - 14, x - 5.4, y - 16, '#4a2e16', 0.8);
      line(ctx, x + 1, y - 2, x - 0.5, y - 19, '#6a4a2a', 2.4); // two hide-lashed uprights
      line(ctx, x + 6, y - 1, x + 3.6, y - 19, '#6a4a2a', 2.4);
      for (const yy of [-6, -11, -16]) line(ctx, x + 0.4 + (yy + 6) * 0.1, y + yy, x + 5.6 + (yy + 6) * 0.12, y + yy - 0.8, '#efe6d2', 1); // rawhide binding
      line(ctx, x - 3, y - 6, x + 13, y - 27, '#8a5a2b', 2.8); // long arm
      line(ctx, x - 3, y - 6.6, x + 13, y - 27.6, shade('#8a5a2b', 0.4), 0.6);
      ellipse(ctx, x + 13.6, y - 28, 3.4, 2.6, '#8a5a2b'); // sling cup
      ellipse(ctx, x + 13.6, y - 29.6, 2.4, 2.2, '#8a8a90');
      line(ctx, x + 12.6, y - 25, x + 8, y - 7, '#c9b58a', 0.7); // sling rope
      line(ctx, x + 12, y + 1, x + 12, y - 10, '#4a2e16', 1); // the tug: pole, crossbar and strands
      line(ctx, x + 9.6, y - 8.4, x + 14.4, y - 8.4, GOLD, 0.9);
      for (const [ox, c] of [[9.8, '#1a1612'], [11, '#c8372d'], [12.2, '#1a1612'], [13.4, '#c8372d'], [14.4, '#1a1612']] as const) line(ctx, x + ox, y - 8.4, x + ox + 0.6, y - 3.4, c, 0.9);
      break;
    }
    case 'rome':
    default: {
      // heavy red-painted onager with bronze fittings
      box(ctx, x, y - 2, 18, 4, '#8a5a2b');
      faceQuadLine(ctx, x - 9, y - 4, x + 9, y - 4);
      wheels(BRONZE);
      const paint = tribe === 'rome' ? '#b3302a' : T.color;
      box(ctx, x - 3, y - 6, 3, 8, paint);
      box(ctx, x + 3, y - 4.5, 3, 8, paint);
      line(ctx, x - 2, y - 11, x + 11, y - 26, '#6b4424', 3);
      ellipse(ctx, x + 11.5, y - 27, 4.2, 3, '#8a5a2b');
      ellipse(ctx, x + 11.5, y - 29, 2.8, 2.6, '#8a8a90');
      flag(x - 8, y - 5, T.color);
      line(ctx, x + 9.5, y - 24, x + 5, y - 6, '#c9b58a', 0.8); // the sling rope
      for (const ox of [-3, 3]) line(ctx, x + ox - 1.6, y - 1.5 + (ox > 0 ? 1.5 : 0), x + ox + 1.6, y - 1.5 + (ox > 0 ? 1.5 : 0), '#5a5a64', 1.1); // iron straps on the uprights
      for (const [nx, ny] of [[-6, -2], [-2, -2.5], [2, -1.8], [6, -1.4]] as const) ellipse(ctx, x + nx, y + ny, 0.5, 0.5, shade(BRONZE, 0.4));
      ellipse(ctx, x + 11, y - 29.8, 1.3, 0.8, shade('#8a8a90', 0.5));
      break;
    }
  }
}

/** A thin highlight along a beam so wooden parts read as solid. */
function faceQuadLine(ctx: Ctx, x0: number, y0: number, x1: number, y1: number) {
  line(ctx, x0, y0 - 1, x1, y1 - 1, 'rgba(255,255,255,0.25)', 0.8);
}

// ---------------------------------------------------------------- boats

function drawBoat(ctx: Ctx, kind: UnitKind, tribe: TribeId, x: number, y: number) {
  const T = TRIBES[tribe];
  const tier = kind === 'warship' ? 2 : kind === 'ship' ? 1 : 0;
  const s = 1 + tier * 0.14;
  if (kind === 'waka') {
    // twin hulls, a lashed deck and a claw-shaped sail
    for (const oy of [-3.5, 4]) {
      poly(ctx, [x - 18, y + oy - 4, x + 19, y + oy - 4, x + 14, y + oy + 1, x - 14, y + oy + 1], '#7a4a22');
      poly(ctx, [x - 18, y + oy - 4, x + 19, y + oy - 4, x + 16, y + oy - 6, x - 16, y + oy - 6], '#a86c38');
    }
    box(ctx, x - 1, y - 4, 16, 2, '#c9974a');
    for (const ox of [-8, -1, 6, 13]) line(ctx, x + ox, y - 3.4, x + ox + 1.4, y - 0.4, '#f4efe0', 0.8); // lashings between the hulls
    for (const ox of [-4, 3, 10]) line(ctx, x + ox, y - 4, x + ox + 1, y - 2.2, '#8a5a2b', 0.6); // deck planks
    for (const oy of [-3.5, 4]) {
      line(ctx, x - 16, y + oy - 3.4, x + 16, y + oy - 3.4, shade('#a86c38', -0.25), 0.6); // gunwale line
      ellipse(ctx, x + 18.5, y + oy - 5, 1.2, 1.2, '#f4efe0'); // a shell on each prow
    }
    poly(ctx, [x - 2, y - 6, x - 12, y - 34, x + 1, y - 26, x + 10, y - 35, x + 3, y - 6], T.color);
    poly(ctx, [x - 2, y - 6, x - 7, y - 25, x + 1, y - 22, x + 5, y - 26, x + 3, y - 6], shade(T.color, 0.25));
    for (const [tx, ty] of [[-12, -34], [1, -26], [10, -35]] as const) line(ctx, x, y - 6, x + tx, y + ty, shade(T.color, -0.35), 0.6); // sail ribs
    poly(ctx, [x + 10, y - 35, x + 15, y - 37, x + 12.4, y - 33.4], '#f4efe0'); // streamer
    figure(ctx, 'warrior', tribe, x + 8, y - 5, 0.55, true);
    return;
  }
  const hull = tribe === 'pirates' ? '#3b2a1e' : tribe === 'egypt' ? '#c9b36a' : tribe === 'vikings' || tribe === 'japan' ? '#6a4a2a' : '#8a5a2b';
  const w = 19 * s;
  if (tribe === 'egypt') {
    // papyrus boat with curled ends
    poly(ctx, [x - w, y - 12, x - w + 4, y - 5, x + w - 4, y - 5, x + w, y - 12, x + w * 0.7, y + 3, x - w * 0.7, y + 3], hull);
    for (let i = -2; i <= 2; i++) line(ctx, x + i * 6, y - 4, x + i * 6 - 1, y + 2, shade(hull, -0.2), 0.8);
    // lashing bands, lotus-bundle ends and an Eye of Horus on the bow
    for (const t of [-0.5, -0.15, 0.2, 0.55]) line(ctx, x + t * w, y - 5.2, x + t * w * 0.96, y + 2.4, '#2b5fb8', 1.2);
    for (const e of [-1, 1]) {
      ellipse(ctx, x + e * w, y - 13, 2.6, 2.2, '#8fb35a');
      ellipse(ctx, x + e * w + e * 0.6, y - 13.6, 1.4, 1.2, '#f4efe0');
      line(ctx, x + e * (w - 1), y - 11, x + e * (w - 3), y - 6, '#2b5fb8', 1);
    }
    ellipse(ctx, x + w * 0.62, y - 6.6, 1.6, 1, '#f4efe0');
    ellipse(ctx, x + w * 0.62 + 0.3, y - 6.6, 0.6, 0.6, '#101010');
    line(ctx, x + w * 0.62 - 1.6, y - 5.6, x + w * 0.62 - 2.4, y - 3.6, '#101010', 0.6);
  } else {
    poly(ctx, [x - w, y - 5, x + w + 3, y - 6, x + w * 0.72, y + 3, x - w * 0.7, y + 3], hull);
    poly(ctx, [x - w, y - 5, x + w + 3, y - 6, x + w * 0.9, y - 8.5, x - w * 0.9, y - 8], shade(hull, 0.25));
    // planking, a painted strake along the rail and a keel line
    const at = (t: number) => ({ l: { x: x - w + (w * 0.3) * t, y: y - 5 + 8 * t }, r: { x: x + w + 3 - (w * 0.28 + 3) * t, y: y - 6 + 9 * t } });
    for (const t of [0.4, 0.7]) line(ctx, at(t).l.x, at(t).l.y, at(t).r.x, at(t).r.y, shade(hull, -0.32), 0.7);
    poly(ctx, [at(0.02).l.x, at(0.02).l.y, at(0.02).r.x, at(0.02).r.y, at(0.2).r.x, at(0.2).r.y, at(0.2).l.x, at(0.2).l.y], tribe === 'pirates' ? shade(GOLD, -0.3) : mix(hull, T.color, 0.6));
    for (let i = 0; i < 6; i++) { const t = 0.2 + i * 0.13; line(ctx, x - w * 0.8 + i * (w * 0.32), y - 2, x - w * 0.8 + i * (w * 0.32) - 0.8, y + 2.6, shade(hull, -0.22), 0.5); void t; } // ribs
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; // foam along the waterline
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y + 3.4, w * 0.8, 2.3, 0, 0.08 * Math.PI, 0.92 * Math.PI);
    ctx.stroke();
  }
  if (tribe === 'vikings') {
    // carved dragon prow and a row of shields
    line(ctx, x + w + 1, y - 6, x + w + 4, y - 15, hull, 2.6);
    ellipse(ctx, x + w + 5.5, y - 16, 3, 2, hull);
    ellipse(ctx, x + w + 6, y - 16.6, 0.7, 0.7, GOLD);
    ctx.strokeStyle = hull; // a curled neck
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + w + 1, y - 6);
    ctx.quadraticCurveTo(x + w + 1, y - 15, x + w + 5, y - 15);
    ctx.stroke();
    poly(ctx, [x + w + 6.6, y - 17.4, x + w + 11.4, y - 16.4, x + w + 9.4, y - 14.6, x + w + 6.4, y - 14.4], shade(hull, 0.15)); // snout
    poly(ctx, [x + w + 8, y - 14.8, x + w + 11.4, y - 16, x + w + 10.4, y - 13.2, x + w + 7, y - 13.6], shade(hull, -0.2)); // lower jaw
    for (const tx of [8.4, 9.8]) poly(ctx, [x + w + tx, y - 15, x + w + tx + 0.7, y - 14.9, x + w + tx + 0.3, y - 13.9], '#f4efe0'); // teeth
    poly(ctx, [x + w + 3.6, y - 17.4, x + w + 4.6, y - 21, x + w + 6, y - 17.6], GOLD); // horns
    poly(ctx, [x + w + 4.6, y - 17.2, x + w + 6.2, y - 19.6, x + w + 7, y - 17.4], shade(GOLD, -0.25));
    ellipse(ctx, x + w + 6.4, y - 16.4, 0.9, 0.9, '#c8372d');
    ctx.beginPath(); // the stern tail
    ctx.moveTo(x - w, y - 5);
    ctx.quadraticCurveTo(x - w - 2, y - 11, x - w + 1.4, y - 13);
    ctx.stroke();
    ellipse(ctx, x - w + 1.8, y - 13.4, 1.2, 1.2, GOLD);
    for (let i = 0; i < 4; i++) ellipse(ctx, x - w * 0.5 + i * 7, y - 7, 0.8, 0.8, STEEL); // shield bosses
    if (tier < 2) for (let i = 0; i < 4; i++) ellipse(ctx, x - w * 0.5 + i * 7, y - 7, 2.2, 2.2, i % 2 ? T.color : '#f4efe0');
  }
  if (tribe === 'aztec') {
    // a carved serpent prow, a red-and-turquoise painted rail and a feather standard
    line(ctx, x + w + 1, y - 6, x + w + 3.6, y - 14, hull, 2.6);
    ellipse(ctx, x + w + 5, y - 15, 3.2, 2, '#1faa6b');
    poly(ctx, [x + w + 6.4, y - 14.4, x + w + 9, y - 13.6, x + w + 6.6, y - 13], '#c8372d'); // tongue
    ellipse(ctx, x + w + 5.2, y - 15.6, 0.6, 0.6, '#ffffff');
    for (let i = 0; i < 5; i++) faceQuadLine(ctx, x - w * 0.9 + i * w * 0.38, y - 7.6, x - w * 0.9 + i * w * 0.38 + 3, y - 7.6 + 0.2);
    for (let i = 0; i < 6; i++) poly(ctx, [x - w * 0.9 + i * w * 0.34, y - 8, x - w * 0.9 + i * w * 0.34 + 2.4, y - 8.2, x - w * 0.9 + i * w * 0.34 + 1.2, y - 5.6], i % 2 ? '#1faa9b' : '#c8372d');
    for (let i = 0; i < 3; i++) poly(ctx, [x - w + 1, y - 5, x - w - 4 + i * 0.5, y - 10 - i * 2.4, x - w + 2 + i * 1.4, y - 6.4], ['#1faa6b', '#d6453b', GOLD][i]); // stern plumes
  }
  if (tier >= 1 || tribe === 'rome' || tribe === 'vikings') for (let i = 0; i < 4 + tier * 2; i++) {
    line(ctx, x - w * 0.6 + i * 5, y - 1, x - w * 0.6 + i * 5 - 3, y + 6, '#6b4424', 1.1); // oars
    ellipse(ctx, x - w * 0.6 + i * 5 - 3.3, y + 6.6, 1.7, 0.8, '#9a6a3a'); // ...with blades
  }
  if (tier === 2) for (let i = 0; i < 5; i++) ellipse(ctx, x - w * 0.55 + i * 7, y - 7.5, 2.2, 2.2, i % 2 ? T.color : GOLD); // shields on the rail
  // mast and sail
  line(ctx, x, y - 6, x, y - (34 + tier * 6), '#5a3b1e', 2);
  const sail = tribe === 'pirates' ? DARK : '#f4f1e6';
  const top = y - (32 + tier * 6);
  poly(ctx, [x + 1, top, x + 14 * s, y - 14, x + 1, y - 11], sail);
  poly(ctx, [x - 1, top + 2, x - 12 * s, y - 14, x - 1, y - 11], shade(sail, -0.1));
  if (tribe === 'pirates') {
    ellipse(ctx, x + 6, y - 22 - tier * 2, 2.4, 2.2, '#ffffff');
    line(ctx, x + 4, y - 18 - tier * 2, x + 8, y - 16 - tier * 2, '#ffffff', 1);
  } else {
    poly(ctx, [x + 1, top + 6, x + 11 * s, y - 17, x + 1, y - 16], T.color);
  }
  if (tribe === 'aztec' || tribe === 'egypt') {
    // sun disc on the sail: gold with a ring of rays (aztec) or a blue-winged sun (egypt)
    const sx = x + 6 * s, sy = (top + (y - 14) + (y - 11)) / 3 + 1;
    ellipse(ctx, sx, sy, 3, 3, tribe === 'aztec' ? '#c8372d' : '#2b5fb8');
    ellipse(ctx, sx, sy, 1.8, 1.8, GOLD);
    if (tribe === 'egypt') line(ctx, sx - 3.6, sy + 0.4, sx + 3.6, sy + 0.4, '#2b5fb8', 0.8);
    else for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 4; line(ctx, sx - Math.cos(a) * 3.8, sy - Math.sin(a) * 3.8, sx + Math.cos(a) * 3.8, sy + Math.sin(a) * 3.8, GOLD, 0.5); }
  }
  if (tribe === 'vikings') for (const t of [0.22, 0.5, 0.76]) { // red-and-white striped sail
    const bx = x + 1 + (14 * s - 1) * t, by = y - 11 - 3 * t;
    line(ctx, x + 1, top, bx, by, t === 0.5 ? '#f4efe0' : T.color, 3 * s);
    const cx = x - 1 - (12 * s - 1) * t, cy = y - 11 - 3 * t;
    line(ctx, x - 1, top + 2, cx, cy, t === 0.5 ? '#e0d8c2' : shade(T.color, -0.1), 3 * s);
  }
  if (tribe === 'pirates') {
    for (const t of [0.35, 0.65, 0.9]) poly(ctx, [x + 1 + (14 * s - 1) * t - 2, y - 11 - 3 * t, x + 1 + (14 * s - 1) * t + 1, y - 11 - 3 * t, x + 1 + (14 * s - 1) * t - 0.4, y - 8.2 - 3 * t], sail); // ragged sail hem
    poly(ctx, [x - 4, y - 21 - tier * 2, x - 9, y - 20 - tier * 2, x - 8, y - 16 - tier * 2, x - 4, y - 16.6 - tier * 2], '#3a3a44'); // a patch
    line(ctx, x - 9, y - 18 - tier * 2, x - 4, y - 18.4 - tier * 2, '#8a8a94', 0.5);
    line(ctx, x + w + 1, y - 6.8, x + w + 9, y - 10.6, '#5a3b1e', 1.4); // bowsprit
    poly(ctx, [x + w + 8.4, y - 10.6, x + w + 1, y - 7.6, x + w * 0.8, y - 15 - tier * 2], '#2a2a32'); // a jib
    box(ctx, x - w * 0.72, y - 8, 7, 4, '#4a3524'); // stern cabin with a lantern
    band(ctx, x - w * 0.72, y - 8, 7, 4, 0.5, 0.65, shade(GOLD, -0.2));
    line(ctx, x - w * 0.72, y - 12, x - w * 0.72, y - 17, '#3a2a1a', 0.8);
    ellipse(ctx, x - w * 0.72, y - 17.6, 1.4, 1.7, '#ffcf5a');
    ellipse(ctx, x - w * 0.72 - 0.4, y - 18, 0.5, 0.6, '#fff2a8');
    line(ctx, x - w * 0.9, y - 8.6, x + w * 0.9, y - 9.1, shade(GOLD, -0.2), 0.7); // gilded rail
    if (tier < 2) for (const ox of [-6, 1, 8]) { box(ctx, x + ox, y - 0.6, 2.6, 2, '#1a1010'); ellipse(ctx, x + ox, y - 0.6, 0.6, 0.5, '#ff7a2e'); } // open gun ports, glowing embers
    line(ctx, x, top - 2, x, top - 8, '#3a2a1a', 0.8); // jolly roger at the masthead
    poly(ctx, [x, top - 8, x + 8, top - 7, x + 7, top - 3, x, top - 3.4], '#15151a');
    ellipse(ctx, x + 3.6, top - 5.4, 1.1, 1, '#ffffff');
    line(ctx, x + 2.2, top - 4, x + 5.2, top - 3.4, '#ffffff', 0.5);
    line(ctx, x + 2.2, top - 3.4, x + 5.2, top - 4, '#ffffff', 0.5);
  }
  poly(ctx, [x, top - 2, x + 9, top, x, top + 2], T.color); // pennant
  poly(ctx, [x, top - 2, x + 9, top, x + 7.6, top - 0.8, x, top - 1.2], shade(T.color, 0.35));
  for (const f of [0.3, 0.62]) { // battens across the sails
    line(ctx, x + 1, top + (y - 11 - top) * f, x + 1 + (14 * s - 1) * f, top + (y - 14 - top) * f, shade(sail, -0.3), 0.5);
    line(ctx, x - 1, top + 2 + (y - 11 - top - 2) * f, x - 1 - (12 * s - 1) * f, top + 2 + (y - 14 - top - 2) * f, shade(sail, -0.4), 0.5);
  }
  // rigging from the masthead to the bow and stern, and a rope tied off at the rail
  line(ctx, x, top - 1, x + w + 3, y - 7.4, '#3a2a1a', 0.6);
  line(ctx, x, top - 1, x - w, y - 6.4, '#3a2a1a', 0.6);
  line(ctx, x, top + 4, x + w * 0.5, y - 7.6, '#3a2a1a', 0.5);
  if (tier === 2) { // a crow's nest for the lookout
    box(ctx, x, top + 6, 6, 2.6, '#5a3b1e');
    line(ctx, x - 3, top + 3.6, x + 3, top + 3.6, '#3a2a1a', 0.6);
  }
  if (tier < 2) { // a barrel and a coil of rope on deck
    box(ctx, x + w * 0.45, y - 7.2, 4, 3, '#7a5230');
    band(ctx, x + w * 0.45, y - 7.2, 4, 3, 0.4, 0.55, '#3a3a40');
    ellipse(ctx, x - w * 0.5, y - 8.6, 2.2, 1, '#c9b58a');
  }
  if (tier === 2 && tribe === 'pirates') for (const ox of [-10, -3, 4, 11]) ellipse(ctx, x + ox, y - 2, 1.6, 1.6, '#111');
  if (tribe === 'japan') {
    // black-lacquered rail, a golden prow ornament, a crested sail and (on bigger ships) a camp curtain and a tiled stern house
    line(ctx, x - w, y - 5.4, x + w + 3, y - 6.4, '#1a1a22', 1.2);
    poly(ctx, [x + w + 3, y - 6, x + w + 6.6, y - 10, x + w + 4.6, y - 5, x + w + 3.4, y - 3.4], GOLD);
    ellipse(ctx, x + w + 3.6, y - 8.4, 0.9, 0.9, '#c8372d');
    ellipse(ctx, x + 7 * s, y - 20 - tier * 2.6, 2.6, 2.7, T.colorDark); // family crest on the sail
    ellipse(ctx, x + 7 * s, y - 20 - tier * 2.6, 1.5, 1.6, '#f4f1ea');
    ellipse(ctx, x + 7 * s, y - 20 - tier * 2.6, 0.7, 0.7, T.colorDark);
    if (tier >= 1) {
      poly(ctx, [x - w * 0.86, y - 8.2, x + w * 0.9, y - 9, x + w * 0.9, y - 12, x - w * 0.86, y - 11.4], T.color);
      for (let i = 0; i < 7; i++) { const cx = x - w * 0.78 + i * (w * 1.6 / 6); line(ctx, cx, y - 8.3, cx, y - 11.7, '#f4f1ea', 0.9); }
      box(ctx, x - w * 0.74, y - 8, 7, 5, '#3a2a22');
      poly(ctx, [x - w * 0.74 - 6, y - 13, x - w * 0.74, y - 18.6, x - w * 0.74 + 6, y - 13, x - w * 0.74, y - 10.6], '#3e4550');
      poly(ctx, [x - w * 0.74, y - 18.6, x - w * 0.74 + 6, y - 13, x - w * 0.74, y - 10.6], shade('#3e4550', -0.3));
      line(ctx, x - w * 0.74 - 6, y - 13, x - w * 0.74, y - 10.6, GOLD, 0.6);
    } else {
      line(ctx, x + w - 1, y - 8, x + w - 1, y - 13, '#3a2a22', 0.8); // a paper lantern at the bow
      ellipse(ctx, x + w - 1, y - 13.8, 1.6, 2, '#f4f1ea');
      ellipse(ctx, x + w - 1, y - 13.8, 1.6, 0.6, '#c8372d');
    }
  }
  if (tribe === 'mongols') {
    // a horsehair tug on the masthead, a hide-lashed hull, a felt tent on deck and round shields on the rail
    const mt = y - (34 + tier * 6);
    for (const [ox, c] of [[-3, '#1a1612'], [-1, '#c8372d'], [1, '#1a1612'], [3, '#c8372d']] as const) line(ctx, x + ox * 0.3, mt - 2, x + ox, mt + 5, c, 1);
    ellipse(ctx, x, mt - 3, 1.5, 1.5, GOLD);
    for (let i = 0; i < 5; i++) { const lx = x - w * 0.7 + i * (w * 0.32); line(ctx, lx - 1, y - 1.6, lx + 1, y + 1.8, '#efe6d2', 0.6); line(ctx, lx + 1, y - 1.6, lx - 1, y + 1.8, '#efe6d2', 0.6); }
    if (tier >= 1) {
      ellipse(ctx, x + w * 0.5, y - 9.6, 5, 3.8, '#efe6d2');
      ellipse(ctx, x + w * 0.5, y - 11.2, 3.8, 2.6, '#f8f2e4');
      line(ctx, x + w * 0.5 - 4.6, y - 9.4, x + w * 0.5 + 4.6, y - 9.4, T.color, 0.9);
      ellipse(ctx, x + w * 0.5, y - 14, 0.8, 0.8, '#c8372d');
    }
    if (tier < 2) for (let i = 0; i < 3; i++) { const sx = x - w * 0.3 + i * 7.5; ellipse(ctx, sx, y - 7.6, 2.4, 2.4, '#c9a45a'); ellipse(ctx, sx, y - 7.6, 0.9, 0.9, GOLD); }
    poly(ctx, [x - w, y - 5, x - w - 4, y - 10, x - w - 1.6, y - 4], '#c8372d'); // a streamer at the stern
  }
  figure(ctx, 'warrior', tribe, x - 9, y - 6, 0.5, true);
}

// ---------------------------------------------------------------- wildlife (map resources)

const CRITTER: Record<TribeId, { body: string; feature: 'hump' | 'antlers' | 'snout' | 'horns' | 'tusks' | 'stripes' }> = {
  egypt: { body: '#d0a45e', feature: 'hump' },
  aztec: { body: '#9c6236', feature: 'antlers' },
  polynesia: { body: '#e99aa2', feature: 'snout' },
  rome: { body: '#34343b', feature: 'horns' },
  pirates: { body: '#5a4235', feature: 'tusks' },
  vikings: { body: '#8a7a66', feature: 'antlers' },
  japan: { body: '#6a5040', feature: 'tusks' },
  mongols: { body: '#4a3628', feature: 'horns' },
  greeks: { body: '#e6e0d0', feature: 'horns' },
  zulu: { body: '#f4f1ea', feature: 'stripes' },
};

export function drawCritter(ctx: Ctx, x: number, y: number, biome: TribeId, k = 1) {
  const spec = CRITTER[biome];
  const body = spec.body;
  ellipse(ctx, x + 2 * k, y + 1, 11 * k, 3 * k, 'rgba(0,0,0,0.2)');
  for (const lx of [-6, -2.5, 3, 6.5]) box(ctx, x + lx * k, y + (lx > 0 ? 0.5 : -0.5) * k, 2 * k, 6 * k, shade(body, -0.3));
  box(ctx, x, y - 5 * k, 16 * k, 7 * k, body);
  if (spec.feature === 'hump') box(ctx, x - 1 * k, y - 12 * k, 6 * k, 4 * k, shade(body, 0.05));
  box(ctx, x + 9 * k, y - 10 * k, 7.5 * k, 7.5 * k, shade(body, 0.04));
  faceQuad(ctx, 'R', x + 9 * k, y - 10 * k, 7.5 * k, 7.5 * k, 0.3, 0.5, 0.5, 0.75, spec.feature === 'horns' ? '#f4f0e2' : '#101010');
  switch (spec.feature) {
    case 'horns':
      poly(ctx, [x + 7 * k, y - 20 * k, x + 6 * k, y - 25 * k, x + 9 * k, y - 20 * k], '#e8e2cf');
      poly(ctx, [x + 10 * k, y - 20 * k, x + 11 * k, y - 25 * k, x + 12.5 * k, y - 19.5 * k], '#d2cab4');
      break;
    case 'antlers':
      line(ctx, x + 8 * k, y - 20 * k, x + 6 * k, y - 26 * k, '#e6d3ad', 1.2 * k);
      line(ctx, x + 6 * k, y - 26 * k, x + 4 * k, y - 27 * k, '#e6d3ad', 1.2 * k);
      line(ctx, x + 11 * k, y - 20 * k, x + 13 * k, y - 26 * k, '#e6d3ad', 1.2 * k);
      line(ctx, x + 13 * k, y - 26 * k, x + 15 * k, y - 27 * k, '#e6d3ad', 1.2 * k);
      break;
    case 'snout':
      box(ctx, x + 13 * k, y - 11 * k, 3.5 * k, 3 * k, shade(body, -0.1));
      break;
    case 'tusks':
      poly(ctx, [x + 13 * k, y - 12 * k, x + 16 * k, y - 15 * k, x + 14 * k, y - 11 * k], '#f4f0e2');
      break;
    case 'stripes':
      for (const u of [0.1, 0.35, 0.6, 0.85]) {
        faceQuad(ctx, 'R', x, y - 5 * k, 16 * k, 7 * k, u, u + 0.1, 0.1, 1, '#1a1a1a');
        faceQuad(ctx, 'L', x, y - 5 * k, 16 * k, 7 * k, u, u + 0.1, 0.1, 1, '#1a1a1a');
      }
      faceQuad(ctx, 'R', x + 9 * k, y - 10 * k, 7.5 * k, 7.5 * k, 0.65, 0.8, 0.2, 1, '#1a1a1a');
      box(ctx, x + 7 * k, y - 17 * k, 2 * k, 3 * k, '#1a1a1a'); // mane
      break;
    case 'hump':
      break;
  }
}

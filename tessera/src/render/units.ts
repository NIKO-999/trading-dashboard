// Voxel-style unit figures: chunky big-headed people whose outfit, headgear and weapons
// come from their empire, and whose silhouette comes from their class.
import { TRIBES } from '../data/tribes';
import { UNITS } from '../data/units';
import type { TribeId, UnitKind } from '../game/types';
import { band, box, drawStar, ellipse, faceQuad, ink, line, mix, poly, roof, shade, softShadow, type Ctx } from './prims';

interface Look { skin: string; hair: string }
const LOOK: Record<TribeId, Look> = {
  egypt: { skin: '#c98d55', hair: '#1d1a17' },
  aztec: { skin: '#b8743f', hair: '#1a1410' },
  polynesia: { skin: '#a5673a', hair: '#12121c' },
  rome: { skin: '#e8bf93', hair: '#4a3222' },
  pirates: { skin: '#e5b387', hair: '#3b2616' },
  vikings: { skin: '#f0c8a0', hair: '#d9a441' },
  japan: { skin: '#e9c49a', hair: '#16161a' },
  mongols: { skin: '#d6a676', hair: '#1a1612' },
  greeks: { skin: '#dcae80', hair: '#3a2616' },
  zulu: { skin: '#7a4a2a', hair: '#1a120c' },
  persia: { skin: '#d9a877', hair: '#1a1410' },
  celts: { skin: '#f0c8a8', hair: '#b5541f' },
  inuit: { skin: '#c99a6e', hair: '#141416' },
  inca: { skin: '#b5754a', hair: '#141012' },
  ethiopia: { skin: '#8a5a36', hair: '#15100c' },
  aboriginal: { skin: '#6e4229', hair: '#17110d' },
  china: { skin: '#e6bf8e', hair: '#141214' },
  india: { skin: '#b8763f', hair: '#15100c' },
  mali: { skin: '#5e3a22', hair: '#120d0a' },
  lakota: { skin: '#a8683a', hair: '#141012' },
  ottoman: { skin: '#dcae82', hair: '#1c1410' },
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
const metalOf = (tribe: TribeId) => (tribe === 'egypt' || tribe === 'greeks' || tribe === 'inca' ? BRONZE : tribe === 'japan' ? '#3a3a48' : tribe === 'inuit' ? '#e8e0c8' : STEEL);

/** Units that wear real armour: they get shoulder plates, greaves, gloves and bracers. */
const isHeavy = (kind: UnitKind) =>
  kind === 'swordsman' || kind === 'knight' || kind === 'giant' || kind === 'legionary' || kind === 'samurai' || kind === 'berserker' || kind === 'hoplite' || kind === 'defender' || kind === 'immortal';

/**
 * Draws a figure. `seated` hides the legs (riders). The returned points are the weapon hand,
 * the off hand (shields) and the y of the top of the head.
 */
function figure(ctx: Ctx, kind: UnitKind, tribe: TribeId, x: number, y: number, k: number, seated = false): Body {
  const L = LOOK[tribe];
  const T = TRIBES[tribe];
  const armoured = kind === 'swordsman' || kind === 'knight' || kind === 'giant' || kind === 'legionary' || kind === 'immortal' || kind === 'shotelai';
  const heavy = isHeavy(kind) && !isAbo(tribe); // no metal here: rank is shown in paint, feathers and cloaks
  const metal = metalOf(tribe);
  let torso = T.color, legs = shade(T.colorDark, 0.1), sleeves = L.skin;
  switch (tribe) {
    case 'egypt': torso = L.skin; legs = L.skin; break;
    case 'aztec': torso = kind === 'jaguar' ? '#e3a53a' : '#efe6d2'; legs = kind === 'jaguar' ? '#e3a53a' : L.skin; sleeves = kind === 'jaguar' ? '#e3a53a' : L.skin; break;
    case 'polynesia': torso = T.color; legs = L.skin; break;
    case 'rome': torso = '#b3302a'; legs = L.skin; break;
    case 'pirates': torso = '#f1efe6'; legs = '#3b3b46'; sleeves = '#f1efe6'; break;
    case 'vikings': torso = T.color; legs = '#6a5238'; sleeves = T.color; break;
    case 'japan': torso = kind === 'samurai' || armoured ? '#2a2a34' : T.color; legs = '#3a3040'; sleeves = torso; break;
    case 'mongols': torso = T.color; legs = '#4a3a2a'; sleeves = T.color; break;
    case 'greeks': torso = '#f4f1ea'; legs = L.skin; break;
    case 'zulu': torso = L.skin; legs = L.skin; break;
    case 'persia': torso = T.color; legs = P_TROUSER; sleeves = kind === 'immortal' || kind === 'giant' ? P_DPINK : '#2f9bb9'; break;
    case 'inuit': torso = kind === 'harpooner' ? T.colorDark : kind === 'swordsman' ? '#5a3e2b' : kind === 'giant' ? '#eef3f6' : T.color; legs = '#5a3e2b'; sleeves = torso; break;
    case 'inca': torso = T.color; legs = L.skin; sleeves = L.skin; break;
    case 'ethiopia': torso = '#f3eedd'; legs = '#ece6d2'; break; // white cotton shamma over tight cotton shurruba
    case 'aboriginal': torso = L.skin; legs = L.skin; break; // bare skin, painted in ochre and clay
    case 'celts': torso = kind === 'explorer' ? '#e6e0cc' : '#b07a3a'; legs = kind === 'explorer' ? '#d8d2b8' : '#3f6a34'; sleeves = torso; break;
  }
  const hip = seated ? y : y - 5 * k;
  const tw = 10 * k, th = 8.5 * k;

  // A cloak hangs behind the tallest ranks, in the empire's colour with a darker lining.
  if (kind === 'knight' || kind === 'giant' || kind === 'samurai' || kind === 'swordsman' || kind === 'immortal' || kind === 'shotelai') {
    const cape = tribe === 'inuit' ? (kind === 'giant' ? '#eef3f6' : '#6a4a34') : isAbo(tribe) ? (kind === 'giant' ? '#7a5a3c' : '#6a4a34') : kind === 'giant' && tribe !== 'inca' ? GOLD : T.color;
    const top = hip - th + 1 * k;
    poly(ctx, [x - 4 * k, top, x + 1 * k, top - 0.5 * k, x - 2 * k, hip + 8.5 * k, x - 9.5 * k, hip + 6.5 * k], shade(cape, -0.22));
    poly(ctx, [x - 4 * k, top, x - 6.5 * k, top + 3 * k, x - 9.5 * k, hip + 6.5 * k, x - 7 * k, hip + 2 * k], shade(cape, 0.02));
    line(ctx, x - 4 * k, top + 0.5 * k, x - 8.6 * k, hip + 6.2 * k, shade(cape, -0.4), 0.7 * k);
    if (tribe === 'egypt' || tribe === 'persia') line(ctx, x - 9.5 * k, hip + 6.5 * k, x - 2 * k, hip + 8.5 * k, GOLD, 1 * k); // gilded hem
    if (tribe === 'persia') { // a turquoise lining and a row of gold rosettes down the cloak
      poly(ctx, [x - 6.5 * k, top + 3 * k, x - 9.5 * k, hip + 6.5 * k, x - 7.6 * k, hip + 6.2 * k, x - 5.2 * k, top + 3.6 * k], P_TURQ);
      for (const t of [0.25, 0.55, 0.85]) ellipse(ctx, x - 6.2 * k - t * 2.2 * k, top + 3.6 * k + t * (hip + 2.6 * k - top), 0.6 * k, 0.6 * k, GOLD);
    }
    if (tribe === 'inuit') for (let i = 0; i < 4; i++) poly(ctx, [x - 9.4 * k + i * 1.9 * k, hip + 6.5 * k - i * 0.4 * k, x - 8.5 * k + i * 1.9 * k, hip + 9.6 * k - i * 0.4 * k, x - 7.4 * k + i * 1.9 * k, hip + 6.3 * k - i * 0.4 * k], i % 2 ? '#c5d4de' : '#f4f8fb'); // hanging fur points
    if (tribe === 'inca') { // a woven yacolla: cream and turquoise stripes along the hem, gold tassels
      for (let i = 0; i < 4; i++) poly(ctx, [x - 9.4 * k + i * 1.9 * k, hip + 6.5 * k - i * 0.5 * k, x - 7.8 * k + i * 1.9 * k, hip + 6.6 * k - i * 0.5 * k, x - 7.8 * k + i * 1.9 * k, hip + 8.2 * k - i * 0.5 * k, x - 9.4 * k + i * 1.9 * k, hip + 8 * k - i * 0.5 * k], i % 2 ? I_TURQ : I_CREAM);
      for (const t of [0.15, 0.55, 0.9]) ellipse(ctx, x - 9.2 * k + 7.2 * k * t, hip + 8.6 * k - 2 * k * t, 0.7 * k, 0.7 * k, GOLD);
      line(ctx, x - 4 * k, top + 0.4 * k, x - 8.4 * k, hip + 5 * k, I_WINE_D, 0.5 * k);
    }
    if (tribe === 'ethiopia') { // a woven tibeb hem in green, gold and red, and a gold clasp at the throat
      poly(ctx, [x - 9.5 * k, hip + 6.5 * k, x - 2 * k, hip + 8.5 * k, x - 2.1 * k, hip + 7.6 * k, x - 9.4 * k, hip + 5.6 * k], '#c8372d');
      poly(ctx, [x - 9.4 * k, hip + 5.6 * k, x - 2.1 * k, hip + 7.6 * k, x - 2.2 * k, hip + 6.9 * k, x - 9.3 * k, hip + 4.9 * k], '#e8c21a');
      poly(ctx, [x - 9.3 * k, hip + 4.9 * k, x - 2.2 * k, hip + 6.9 * k, x - 2.3 * k, hip + 6.3 * k, x - 9.2 * k, hip + 4.3 * k], '#2f9a4a');
      ellipse(ctx, x - 4 * k, top + 0.4 * k, 1 * k, 1 * k, GOLD);
    }
    if (tribe === 'celts') celtCloak(ctx, x, top, hip, k);
    if (isAbo(tribe)) aboCloak(ctx, x, top, hip, k); // a possum-skin cloak, stitched and incised
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

  if (tribe === 'polynesia') {
    // a korowai flax cloak hangs from the shoulders: taniko border at the hem, feather tufts (kiwi-feather brown for the high ranks)
    const rank = kind === 'swordsman' || kind === 'knight' || kind === 'giant' || kind === 'defender';
    const cl = rank ? '#2b2b33' : '#24242c';
    const ct = hip - th + 1 * k;
    poly(ctx, [x - 4 * k, ct, x + 1 * k, ct - 0.5 * k, x - 2 * k, hip + 8.5 * k, x - 9.5 * k, hip + 6.5 * k], shade(cl, -0.2));
    poly(ctx, [x - 4 * k, ct, x - 6.5 * k, ct + 3 * k, x - 9.5 * k, hip + 6.5 * k, x - 7 * k, hip + 2 * k], cl);
    poly(ctx, [x - 9.5 * k, hip + 6.5 * k, x - 2 * k, hip + 8.5 * k, x - 2.2 * k, hip + 7 * k, x - 9.3 * k, hip + 5.2 * k], '#b3302a'); // taniko border
    for (const t of [0.15, 0.4, 0.65, 0.9]) ellipse(ctx, x - 9.4 * k + 7.4 * k * t, hip + 6 * k + 1.9 * k * t, 0.55 * k, 0.55 * k, '#f4efe0');
    for (const t of [0.1, 0.45, 0.8]) poly(ctx, [x - 9.4 * k + 7.4 * k * t, hip + 6.6 * k + 1.9 * k * t, x - 8.4 * k + 7.4 * k * t, hip + 6.8 * k + 1.9 * k * t, x - 9 * k + 7.4 * k * t, hip + 8.6 * k + 1.9 * k * t], rank ? '#f4efe0' : '#e8dcc0'); // hanging feather tufts
    for (const [fx, fy] of [[-6, 0], [-4.5, 3], [-7.5, 3.4], [-5.6, 5.2], [-3.4, 1], [-7.9, 0.4], [-2.6, 4.6]] as const) line(ctx, x + fx * k, hip + fy * k, x + (fx + 0.9) * k, hip + (fy + 1.1) * k, rank || fx > -5 ? '#f4efe0' : '#b3302a', 0.55 * k); // feather flecks woven through the cloak
    line(ctx, x - 4 * k, ct + 0.4 * k, x - 8.4 * k, hip + 5 * k, '#b3302a', 0.5 * k); // a taniko seam down the back
    if (kind === 'giant' || kind === 'knight' || kind === 'swordsman') for (let i = 0; i < 4; i++) poly(ctx, [x - 4.6 * k - i * 0.9 * k, ct + 0.2 * k + i * 2.2 * k, x - 2.4 * k - i * 0.9 * k, ct + i * 2.2 * k, x - 3.6 * k - i * 0.9 * k, ct + 2 * k + i * 2.2 * k], i % 2 ? '#b3302a' : '#f4efe0'); // a kahu huruhuru feather yoke
  }

  // Legs (hidden when riding).
  if (!seated) {
    box(ctx, x - 2.2 * k, y - 0.3 * k, 3.6 * k, 5.2 * k, legs);
    box(ctx, x + 2.2 * k, y + 0.7 * k, 3.6 * k, 5.2 * k, legs);
    const boots = tribe === 'pirates' || tribe === 'mongols' || tribe === 'vikings' || tribe === 'inuit';
    const shoe = tribe === 'pirates' ? DARK : tribe === 'mongols' ? '#3a2418' : tribe === 'inuit' ? '#3a2a20' : tribe === 'zulu' || tribe === 'ethiopia' || tribe === 'aboriginal' ? L.skin : tribe === 'japan' ? '#e2dccb' : '#6b4424';
    const sv = boots ? 0.45 : 0.2;
    const leg = [[-2.2, -0.3, 'L'], [2.2, 0.7, 'R'], [2.2, 0.7, 'L']] as const;
    for (const [dx, dy, f] of leg) {
      faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0, 1, 0, sv, shoe);
      faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0, 1, sv, sv + 0.07, boots ? shade(shoe, 0.3) : shade(legs, -0.22)); // boot cuff / ankle wrap
      if (heavy) faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0.12, 0.88, sv + 0.1, 0.78, metal); // greave
      else if (tribe !== 'zulu' && tribe !== 'polynesia' && tribe !== 'egypt' && tribe !== 'aboriginal') faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0, 1, 0.9, 1, shade(legs, -0.18)); // trouser hem line
      if (tribe === 'japan' && !heavy) faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0.42, 0.56, sv + 0.1, 0.9, shade(legs, -0.28)); // hakama pleat
      if (tribe === 'japan') faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0, 1, sv - 0.02, sv + 0.02, '#8a3a2a'); // waraji straps
      if (tribe === 'mongols') faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0.3, 0.7, sv + 0.1, sv + 0.42, '#c8372d'); // embroidered boot panel
      if (tribe === 'inuit') inuitLeg(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, heavy);
      if (tribe === 'greeks') {
        if (heavy) faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0.1, 0.9, 0.68, 0.8, shade(metal, 0.35)); // flared knee guard
        else for (const v of [0.3, 0.46]) faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0.05, 0.95, v, v + 0.06, '#6b4424'); // sandal laces up the shin
      }
      if (tribe === 'persia') persiaLeg(ctx, f, x + dx * k, y + dy * k, k, heavy, kind);
      if (tribe === 'ethiopia') { // tibeb stripes woven round the ankle of the white trousers, and sandal straps
        const q = (a: number, b: number, c: string) => faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0, 1, a, b, c);
        q(0.3, 0.35, '#2f9a4a'); q(0.35, 0.4, '#e8c21a'); q(0.4, 0.45, '#c8372d');
        faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0.1, 0.9, 0.1, 0.14, '#6b4424');
        if (heavy || kind === 'shotelai') faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0.1, 0.9, 0.5, 0.56, GOLD); // gilt garter
        else faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0.5, 0.5 + 0.06, 0.55, 0.65, shade(legs, -0.14)); // a fold in the cloth
      }
      if (tribe === 'celts') celtTrews(ctx, f, x + dx * k, y + dy * k, k, legs, sv, kind === 'explorer');
      if (tribe === 'aboriginal') aboLeg(ctx, f, x + dx * k, y + dy * k, k, kind);
      if (tribe === 'zulu') {
        faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0, 1, 0.27, 0.4, '#f4efe0'); // cow-tail anklet
        faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0.1, 0.9, 0.22, 0.27, '#2a1a10');
      }
    }
    // toe caps
    faceQuad(ctx, 'R', x + 2.2 * k, y + 0.7 * k, 3.6 * k, 5.2 * k, 0, 0.35, 0, 0.12, shade(shoe, -0.3));
    if (tribe === 'egypt') for (const [dx, dy] of [[-2.2, -0.3], [2.2, 0.7]] as const) {
      faceQuad(ctx, 'R', x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0.1, 0.9, 0.12, 0.2, '#f4efe0'); // papyrus sandal straps
      faceQuad(ctx, 'R', x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0.4, 0.6, 0.12, 0.34, GOLD);
    }
    if (tribe === 'inca') for (const [dx, dy, f] of leg) { // ojotas: rawhide sandals laced up the shin, a woven garter
      for (const v of [0.14, 0.24]) faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0.1, 0.9, v, v + 0.06, I_CREAM);
      faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0, 1, 0.62, 0.74, I_WINE);
      faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0.1, 0.9, 0.66, 0.7, I_TURQ);
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
    if (tribe === 'polynesia') {
      // koru curls tattooed on the calves and a plaited flax anklet
      for (const [dx, dy, f] of leg) {
        faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0.1, 0.9, 0.36, 0.42, '#141c30');
        faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0.1, 0.4, 0.5, 0.62, '#141c30');
        faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0, 1, 0.14, 0.2, '#b3302a'); // plaited anklet
        faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0.3, 0.6, 0.14, 0.2, '#f4efe0');
        faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0.1, 0.9, 0.26, 0.31, '#141c30'); // puhoro tattoo band above the ankle
      }
    } else if (tribe === 'rome' && !heavy) {
      // caligae: leather straps laced up the shin
      for (const [dx, dy, f] of leg) for (const v of [0.24, 0.38, 0.52]) faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, 0, 1, v, v + 0.06, '#5a3a1e');
    }
  }

  // Back arm, torso, front arm.
  const glove = tribe === 'inuit' ? '#5a3e2b' : heavy ? '#5a4634' : L.skin; // Inuit hands are in fur mitts
  box(ctx, x - 5.9 * k, hip - 1 * k, 2.8 * k, 7 * k, sleeves);
  faceQuad(ctx, 'R', x - 5.9 * k, hip - 1 * k, 2.8 * k, 7 * k, 0, 1, 0.16, 0.3, heavy ? metal : shade(sleeves, -0.25)); // bracer or cuff
  box(ctx, x - 5.9 * k, hip + 0.9 * k, 2.4 * k, 2 * k, glove);
  if (tribe === 'celts') celtSleeve(ctx, x - 5.9 * k, hip - 1 * k, k, kind, heavy, true);
  if (tribe === 'aboriginal') aboArm(ctx, x - 5.9 * k, hip - 1 * k, k, false, kind);
  if (tribe === 'mongols') faceQuad(ctx, 'R', x - 5.9 * k, hip - 1 * k, 2.8 * k, 7 * k, 0, 1, 0.08, 0.2, '#6a4a2a'); // fur cuff
  if (tribe === 'zulu') faceQuad(ctx, 'R', x - 5.9 * k, hip - 1 * k, 2.8 * k, 7 * k, 0, 1, 0.5, 0.64, '#d9a441'); // brass arm ring
  if (tribe === 'inuit') { faceQuad(ctx, 'R', x - 5.9 * k, hip - 1 * k, 2.8 * k, 7 * k, 0, 1, 0.16, 0.3, '#f4f8fb'); faceQuad(ctx, 'R', x - 5.9 * k, hip - 1 * k, 2.8 * k, 7 * k, 0, 1, 0.5, 0.6, '#c8372d'); } // fur cuff and a red band
  if (heavy) box(ctx, x - 5.9 * k, hip - 6.1 * k, 3.6 * k, 2.2 * k, metal); // back pauldron
  if (tribe === 'ethiopia') { // the shamma's white sleeve with a tibeb edge, and a gold armlet above the wrist
    const A = (v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x - 5.9 * k, hip - 1 * k, 2.8 * k, 7 * k, 0, 1, v0, v1, c);
    if (!heavy) { A(0.72, 1, '#f3eedd'); A(0.68, 0.72, '#2f9a4a'); A(0.64, 0.68, '#c8372d'); }
    A(0.36, 0.46, GOLD);
  }
  box(ctx, x, hip, tw, th, torso);
  dressTorso(ctx, tribe, kind, x, hip, tw, th, armoured);
  // a lit top edge and a shaded waist give the chest some volume
  band(ctx, x, hip, tw, th, 0.93, 1, shade(torso, 0.3));
  band(ctx, x, hip, tw, th, 0, 0.05, shade(torso, -0.3));
  // strap and quiver belt for the bowmen and the wanderer
  if ((kind === 'archer' || kind === 'explorer' || kind === 'horsearcher' || kind === 'buccaneer' || kind === 'slinger') && !isAbo(tribe)) {
    facePoly(ctx, 'R', x, hip, tw, th, [[0.05, 0.98], [0.3, 0.98], [0.98, 0.12], [0.72, 0.1]], '#6b4424');
    facePoly(ctx, 'L', x, hip, tw, th, [[0.15, 0.98], [0.4, 0.98], [0.9, 0.3], [0.65, 0.28]], '#5a3a1e');
    faceQuad(ctx, 'R', x, hip, tw, th, 0.4, 0.5, 0.42, 0.56, GOLD); // buckle
  }
  box(ctx, x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, sleeves);
  faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.16, 0.3, heavy ? metal : shade(sleeves, -0.25));
  box(ctx, x + 6 * k, hip + 2.5 * k, 2.4 * k, 2 * k, glove);
  if (tribe === 'celts') celtSleeve(ctx, x + 6 * k, hip + 0.6 * k, k, kind, heavy, false);
  if (tribe === 'aboriginal') aboArm(ctx, x + 6 * k, hip + 0.6 * k, k, true, kind);
  if (tribe === 'mongols') { // fur cuff and a gold armband
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.08, 0.2, '#6a4a2a');
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.62, 0.72, GOLD);
  }
  if (tribe === 'japan' && !heavy) faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.3, 0.42, '#f4f1ea'); // kimono under-sleeve
  if (tribe === 'inuit') { // white fur cuff, red beaded band with white dots and a bone bracelet
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.16, 0.3, '#f4f8fb');
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.52, 0.66, '#c8372d');
    for (const u of [0.1, 0.5]) faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, u, u + 0.34, 0.56, 0.62, '#f4f8fb');
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.34, 0.4, '#e8e0c8');
  }
  if (tribe === 'polynesia') {
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.55, 0.75, '#2a1a10');
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.76, 0.88, '#b3302a'); // taniko armband
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0.2, 0.5, 0.78, 0.86, '#f4efe0');
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.08, 0.16, '#f4efe0'); // bone bracelet
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0.55, 0.9, 0.08, 0.16, '#3f9a6a');
    faceQuad(ctx, 'R', x - 5.9 * k, hip - 1 * k, 2.8 * k, 7 * k, 0, 1, 0.55, 0.7, '#f4efe0'); // back armlet with a feather
    faceQuad(ctx, 'R', x - 5.9 * k, hip - 1 * k, 2.8 * k, 7 * k, 0.3, 0.7, 0.58, 0.66, '#b3302a');
    if (kind !== 'archer' && kind !== 'explorer') { // a small patu club tucked in the belt
      poly(ctx, [x - 4.8 * k, hip - 2.6 * k, x - 3.6 * k, hip - 3.2 * k, x - 3.6 * k, hip - 6 * k, x - 5.8 * k, hip - 6.4 * k, x - 6.2 * k, hip - 4 * k], '#f4efe0');
      poly(ctx, [x - 4.8 * k, hip - 2.6 * k, x - 5.4 * k, hip - 2.9 * k, x - 6.2 * k, hip - 4 * k, x - 5.8 * k, hip - 6.4 * k, x - 5.2 * k, hip - 6.2 * k], '#cfc8b4');
      line(ctx, x - 4.8 * k, hip - 2.4 * k, x - 5 * k, hip - 1 * k, '#b3302a', 0.7 * k);
    }
  }
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
  if (tribe === 'persia') { // gold armlets set with turquoise, a wrist bracelet, and pink embroidered cuffs
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.66, 0.8, GOLD);
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0.35, 0.65, 0.68, 0.78, P_TURQ);
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.34, 0.42, P_PINK);
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.04, 0.12, GOLD);
    faceQuad(ctx, 'R', x - 5.9 * k, hip - 1 * k, 2.8 * k, 7 * k, 0, 1, 0.55, 0.7, GOLD);
    faceQuad(ctx, 'R', x - 5.9 * k, hip - 1 * k, 2.8 * k, 7 * k, 0, 1, 0.34, 0.42, P_PINK);
  }
  if (tribe === 'inca') { // a gold armlet inlaid with turquoise, a woven wrist wrap
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.62, 0.8, GOLD);
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0.3, 0.7, 0.67, 0.75, I_TURQ);
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.3, 0.4, I_WINE);
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0.25, 0.75, 0.32, 0.38, I_CREAM);
    faceQuad(ctx, 'R', x - 5.9 * k, hip - 1 * k, 2.8 * k, 7 * k, 0, 1, 0.55, 0.7, I_TURQ);
    faceQuad(ctx, 'R', x - 5.9 * k, hip - 1 * k, 2.8 * k, 7 * k, 0.3, 0.7, 0.58, 0.66, GOLD);
  }
  if (tribe === 'vikings') { // twisted gold arm ring above the bracer
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.62, 0.76, GOLD);
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0.3, 0.5, 0.62, 0.76, shade(GOLD, 0.4));
  }
  if (tribe === 'pirates') { // rolled cuff and a red wristband
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.04, 0.14, '#b3302a');
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.66, 0.72, shade(sleeves, -0.3));
  }
  if (tribe === 'egypt') faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.62, 0.78, GOLD);
  if (tribe === 'zulu') {
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.5, 0.66, '#f4efe0'); // cow-tail armband
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.34, 0.42, '#d9a441'); // brass bangle
  }
  if (tribe === 'greeks' && !heavy) faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.7, 0.8, GOLD); // upper-arm band
  if (tribe === 'ethiopia') {
    const A = (v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, v0, v1, c);
    if (!heavy) { A(0.72, 1, '#f3eedd'); A(0.68, 0.72, '#2f9a4a'); A(0.64, 0.68, '#c8372d'); }
    A(0.4, 0.5, GOLD); // gilt armlet
    A(0.1, 0.18, '#e8c21a'); A(0.18, 0.24, '#c8372d'); // beaded wristband
    faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0.3, 0.7, 0.4, 0.5, shade(GOLD, 0.5));
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
    case 'inuit':
      inuitTorso(ctx, kind, x, y, w, h);
      break;
    case 'inca': incaTorso(ctx, kind, x, y, w, h); break;
    case 'aboriginal': aboTorso(ctx, kind, x, y, w, h); break;
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
      band(ctx, x, y, w, h, 0, 0.36, '#23232a'); // piupiu flax skirt: black rolled strips striped in red
      for (let i = 0; i < 6; i++) faceQuad(ctx, i % 2 ? 'L' : 'R', x, y, w, h, 0.06 + i * 0.16, 0.11 + i * 0.16, 0.04, 0.34, i % 2 ? '#b3302a' : '#0e0e13');
      for (let i = 0; i < 6; i++) faceQuad(ctx, i % 2 ? 'L' : 'R', x, y, w, h, 0.06 + i * 0.16, 0.13 + i * 0.16, 0, 0.06, '#f4efe0'); // pale flax ends
      band(ctx, x, y, w, h, 0.36, 0.46, '#b3302a'); // taniko belt
      for (let i = 0; i < 4; i++) {
        faceQuad(ctx, 'R', x, y, w, h, 0.08 + i * 0.24, 0.16 + i * 0.24, 0.39, 0.43, '#f4efe0');
        faceQuad(ctx, 'L', x, y, w, h, 0.08 + i * 0.24, 0.16 + i * 0.24, 0.39, 0.43, '#1a1a1e');
      }
      // tā moko on the bare chest, a hei-tiki on a cord
      for (let i = 0; i < 2; i++) {
        faceQuad(ctx, 'R', x, y, w, h, 0.08 + i * 0.66, 0.24 + i * 0.66, 0.52, 0.58, '#141c30');
        faceQuad(ctx, 'R', x, y, w, h, 0.08 + i * 0.66, 0.24 + i * 0.66, 0.62, 0.68, '#141c30');
        faceQuad(ctx, 'R', x, y, w, h, 0.08 + i * 0.66, 0.14 + i * 0.66, 0.52, 0.68, '#141c30');
      }
      faceQuad(ctx, 'L', x, y, w, h, 0.2, 0.8, 0.55, 0.6, '#141c30');
      if (armoured || kind === 'defender') {
        // a black flax mantle over the shoulders: red taniko band with white diamonds, feather fringe
        band(ctx, x, y, w, h, 0.76, 1, '#24242c');
        band(ctx, x, y, w, h, 0.76, 0.84, '#b3302a');
        for (let i = 0; i < 4; i++) { faceQuad(ctx, 'R', x, y, w, h, 0.1 + i * 0.24, 0.18 + i * 0.24, 0.78, 0.82, '#f4efe0'); faceQuad(ctx, 'L', x, y, w, h, 0.1 + i * 0.24, 0.18 + i * 0.24, 0.78, 0.82, '#f4efe0'); }
        for (let i = 0; i < 5; i++) faceQuad(ctx, 'R', x, y, w, h, 0.04 + i * 0.2, 0.12 + i * 0.2, 0.66, 0.76, i % 2 ? '#f4efe0' : '#3a3a44'); // hanging feather fringe
      } else {
        // a woven flax bandolier with red-and-white taniko triangles
        faceQuad(ctx, 'R', x, y, w, h, 0.02, 0.98, 0.9, 0.96, '#2a2a32');
        for (let i = 0; i < 4; i++) faceQuad(ctx, 'R', x, y, w, h, 0.08 + i * 0.24, 0.16 + i * 0.24, 0.9, 0.96, i % 2 ? '#f4efe0' : '#b3302a');
      }
      faceQuad(ctx, 'R', x, y, w, h, 0.45, 0.55, 0.7, 0.86, '#4a3a22'); // cord
      faceQuad(ctx, 'R', x, y, w, h, 0.34, 0.66, 0.5, 0.72, '#3f9a6a'); // hei-tiki in pounamu
      faceQuad(ctx, 'R', x, y, w, h, 0.34, 0.5, 0.6, 0.72, '#8fd6a8');
      faceQuad(ctx, 'R', x, y, w, h, 0.4, 0.46, 0.62, 0.66, '#1a3a2a');
      faceQuad(ctx, 'R', x, y, w, h, 0.54, 0.6, 0.62, 0.66, '#1a3a2a');
      break;
    case 'rome':
      band(ctx, x, y, w, h, 0, 0.3, '#b3302a');
      for (let i = 0; i < 4; i++) faceQuad(ctx, 'R', x, y, w, h, 0.1 + i * 0.22, 0.18 + i * 0.22, 0, 0.3, '#6b4424'); // leather strips
      band(ctx, x, y, w, h, 0.3, 0.4, '#6b4424'); // belt
      if (armoured || kind === 'defender') {
        for (const v of [0.46, 0.62, 0.78]) band(ctx, x, y, w, h, v, v + 0.13, STEEL); // segmented plates
        faceQuad(ctx, 'R', x, y, w, h, 0.46, 0.54, 0.46, 0.91, shade(STEEL, -0.35)); // centre seam
        for (const u of [0.08, 0.86]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.06, 0.46, 0.91, BRONZE); // buckled straps
        if (kind === 'knight' || kind === 'giant' || kind === 'swordsman') faceQuad(ctx, 'R', x, y, w, h, 0.28, 0.42, 0.6, 0.78, GOLD); // phalera
      }
      // cingulum: studded belt with hanging apron straps, and a white neck scarf
      for (const u of [0.1, 0.34, 0.58, 0.82]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.08, 0.32, 0.38, BRONZE);
      faceQuad(ctx, 'R', x, y, w, h, 0.42, 0.56, 0.3, 0.4, GOLD);
      faceQuad(ctx, 'L', x, y, w, h, 0.3, 0.42, 0.3, 0.4, BRONZE);
      band(ctx, x, y, w, h, 0.94, 1, '#efe6d2');
      band(ctx, x, y, w, h, 0, 0.05, '#e8c25a'); // gold hem trim
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
    case 'greeks': {
      const plate = armoured || kind === 'hoplite' || kind === 'defender';
      band(ctx, x, y, w, h, 0, 0.08, '#2b5fb8'); // hem
      for (let i = 0; i < 4; i++) { // meander pattern along the hem
        faceQuad(ctx, 'R', x, y, w, h, 0.06 + i * 0.24, 0.18 + i * 0.24, 0.015, 0.065, '#f4f1ea');
        faceQuad(ctx, 'L', x, y, w, h, 0.06 + i * 0.24, 0.18 + i * 0.24, 0.015, 0.065, '#f4f1ea');
      }
      for (const u of [0.16, 0.4, 0.64, 0.86]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.05, 0.1, 0.34, '#d2ccbc'); // chiton pleats
      for (const u of [0.2, 0.5, 0.8]) faceQuad(ctx, 'L', x, y, w, h, u, u + 0.05, 0.1, 0.34, '#d2ccbc');
      band(ctx, x, y, w, h, 0.34, 0.42, '#c9974a'); // belt
      faceQuad(ctx, 'R', x, y, w, h, 0.42, 0.58, 0.34, 0.42, GOLD); // buckle
      if (plate) {
        band(ctx, x, y, w, h, 0.42, 1, BRONZE); // cuirass
        faceQuad(ctx, 'R', x, y, w, h, 0.3, 0.7, 0.6, 0.66, shade(BRONZE, -0.2));
        faceQuad(ctx, 'R', x, y, w, h, 0.47, 0.53, 0.66, 0.98, shade(BRONZE, -0.3)); // sternum groove
        faceQuad(ctx, 'R', x, y, w, h, 0.1, 0.44, 0.74, 0.8, shade(BRONZE, -0.24)); // pectoral curves
        faceQuad(ctx, 'R', x, y, w, h, 0.56, 0.92, 0.74, 0.8, shade(BRONZE, -0.24));
        faceQuad(ctx, 'R', x, y, w, h, 0.1, 0.44, 0.8, 0.86, shade(BRONZE, 0.25));
        faceQuad(ctx, 'R', x, y, w, h, 0.47, 0.53, 0.5, 0.56, shade(BRONZE, -0.4)); // navel
        for (let i = 0; i < 4; i++) { // leather pteryges hanging under the belt, gold studs at their tips
          faceQuad(ctx, 'R', x, y, w, h, 0.04 + i * 0.24, 0.24 + i * 0.24, 0.1, 0.33, i % 2 ? '#8a5a2b' : '#a9773f');
          faceQuad(ctx, 'R', x, y, w, h, 0.11 + i * 0.24, 0.17 + i * 0.24, 0.11, 0.16, GOLD);
        }
        if (kind === 'giant') { // a lion-skin mantle with its paws knotted on the chest
          band(ctx, x, y, w, h, 0.76, 1, '#d9a441');
          for (const [u, v] of [[0.15, 0.84], [0.6, 0.88], [0.8, 0.8]] as const) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.1, v, v + 0.07, '#8a5a1e');
          faceQuad(ctx, 'R', x, y, w, h, 0.4, 0.6, 0.62, 0.8, '#b8862c');
        }
      } else {
        facePoly(ctx, 'R', x, y, w, h, [[0.5, 1], [1, 1], [1, 0.36], [0.78, 0.5]], TRIBES.greeks.colorDark); // himation draped from the shoulder
        faceQuad(ctx, 'L', x, y, w, h, 0.5, 1, 0.78, 1, TRIBES.greeks.colorDark);
        faceQuad(ctx, 'R', x, y, w, h, 0.64, 0.76, 0.84, 0.94, GOLD); // brooch
      }
      break;
    }
    case 'persia':
      persiaTorso(ctx, kind, x, y, w, h);
      break;
    case 'ethiopia': {
      // a white cotton shamma with woven tibeb borders, a lime-gold sash and a small gold cross
      const G = '#2f9a4a', Y = '#e8c21a', R = '#c8372d';
      const elite = kind === 'knight' || kind === 'giant';
      band(ctx, x, y, w, h, 0, 0.05, G); // tibeb hem: green, gold, red
      band(ctx, x, y, w, h, 0.05, 0.09, Y);
      band(ctx, x, y, w, h, 0.09, 0.13, R);
      for (let i = 0; i < 5; i++) { faceQuad(ctx, 'R', x, y, w, h, 0.07 + i * 0.2, 0.15 + i * 0.2, 0.14, 0.2, T_LIME); faceQuad(ctx, 'L', x, y, w, h, 0.07 + i * 0.25, 0.17 + i * 0.25, 0.14, 0.2, T_LIME); } // lime-gold zigzag blocks
      for (const u of [0.18, 0.44, 0.7]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.04, 0.2, 0.34, '#dcd5bd'); // cloth pleats
      facePoly(ctx, 'R', x, y, w, h, [[0.02, 1], [0.4, 1], [1, 0.36], [0.72, 0.3]], '#e2dbc4'); // the shamma is thrown over one shoulder
      facePoly(ctx, 'R', x, y, w, h, [[0.4, 1], [0.46, 1], [1, 0.42], [1, 0.36]], R); // ...its tibeb edge
      facePoly(ctx, 'R', x, y, w, h, [[0.46, 1], [0.5, 1], [1, 0.47], [1, 0.42]], Y);
      band(ctx, x, y, w, h, 0.33, 0.44, T_LIME); // lime-gold sash
      band(ctx, x, y, w, h, 0.33, 0.35, shade(T_LIME, -0.35));
      faceQuad(ctx, 'R', x, y, w, h, 0.42, 0.58, 0.32, 0.46, GOLD); // buckle
      faceQuad(ctx, 'R', x, y, w, h, 0.47, 0.53, 0.35, 0.43, shade(GOLD, -0.35));
      faceQuad(ctx, 'R', x, y, w, h, 0.74, 0.82, 0.14, 0.33, T_LIME); // a hanging sash end, tasselled in red
      faceQuad(ctx, 'R', x, y, w, h, 0.74, 0.82, 0.14, 0.2, R);
      if (armoured || kind === 'defender') {
        // a studded, quilted cotton-and-leather corselet in dark olive, a lion's-mane collar for the champions
        band(ctx, x, y, w, h, 0.46, 0.86, T_DARK);
        for (const v of [0.54, 0.66, 0.78]) { band(ctx, x, y, w, h, v, v + 0.03, shade(T_DARK, -0.35)); }
        for (const u of [0.14, 0.34, 0.66, 0.86]) for (const v of [0.5, 0.62, 0.74]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.06, v, v + 0.05, GOLD);
        for (const u of [0.2, 0.6]) for (const v of [0.5, 0.62, 0.74]) faceQuad(ctx, 'L', x, y, w, h, u, u + 0.07, v, v + 0.05, GOLD);
      }
      if (elite) {
        band(ctx, x, y, w, h, 0.8, 1, '#b8791f'); // lion-skin mantle with a dark shaggy fringe
        for (const u of [0.04, 0.2, 0.36, 0.52, 0.68, 0.84]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.1, 0.72, 0.82, '#3a2410');
        for (const u of [0.1, 0.4, 0.7]) faceQuad(ctx, 'L', x, y, w, h, u, u + 0.12, 0.72, 0.82, '#3a2410');
        for (const [u, v] of [[0.1, 0.88], [0.62, 0.9], [0.84, 0.86]] as const) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.08, v, v + 0.06, '#8a5a12');
      } else band(ctx, x, y, w, h, 0.92, 1, '#f9f5e6'); // a bright cotton collar
      // the cross on a cord: a cross pattée in gold
      faceQuad(ctx, 'R', x, y, w, h, 0.49, 0.51, 0.8, 1, '#4a3322');
      faceQuad(ctx, 'R', x, y, w, h, 0.44, 0.56, 0.5, 0.82, GOLD);
      faceQuad(ctx, 'R', x, y, w, h, 0.34, 0.66, 0.62, 0.72, GOLD);
      faceQuad(ctx, 'R', x, y, w, h, 0.47, 0.53, 0.54, 0.78, shade(GOLD, -0.35));
      faceQuad(ctx, 'R', x, y, w, h, 0.4, 0.6, 0.65, 0.69, shade(GOLD, -0.35));
      break;
    }
    case 'celts': celtTorso(ctx, kind, x, y, w, h); break;
    case 'zulu': {
      band(ctx, x, y, w, h, 0, 0.36, '#5a3a22'); // hide kilt
      for (let i = 0; i < 6; i++) { // umutsha: a fringe of dangling cow tails
        const c = i % 2 ? '#2a1a10' : '#f4efe0';
        faceQuad(ctx, 'R', x, y, w, h, 0.02 + i * 0.16, 0.14 + i * 0.16, 0, 0.26, c);
        if (i < 4) faceQuad(ctx, 'L', x, y, w, h, 0.02 + i * 0.25, 0.14 + i * 0.25, 0, 0.26, c);
      }
      band(ctx, x, y, w, h, 0.34, 0.42, '#c8372d'); // beaded belt
      for (let i = 0; i < 4; i++) { faceQuad(ctx, 'R', x, y, w, h, 0.1 + i * 0.22, 0.2 + i * 0.22, 0.35, 0.41, '#f4efe0'); faceQuad(ctx, 'L', x, y, w, h, 0.12 + i * 0.22, 0.2 + i * 0.22, 0.35, 0.41, '#f4efe0'); }
      if (kind === 'swordsman' || kind === 'knight' || kind === 'giant') {
        // a leopard-skin mantle, rosettes and all
        band(ctx, x, y, w, h, 0.62, 1, '#d9a441');
        for (const [u, v] of [[0.08, 0.7], [0.32, 0.8], [0.58, 0.68], [0.8, 0.82], [0.45, 0.9]] as const) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.12, v, v + 0.09, '#3a2410');
        for (const [u, v] of [[0.2, 0.72], [0.62, 0.78]] as const) faceQuad(ctx, 'L', x, y, w, h, u, u + 0.14, v, v + 0.1, '#3a2410');
      } else {
        // crossed bandoliers of trade beads
        facePoly(ctx, 'R', x, y, w, h, [[0.04, 0.98], [0.26, 0.98], [0.98, 0.46], [0.78, 0.44]], '#f4efe0');
        facePoly(ctx, 'R', x, y, w, h, [[0.74, 0.98], [0.96, 0.98], [0.3, 0.44], [0.1, 0.46]], '#c8372d');
        faceQuad(ctx, 'R', x, y, w, h, 0.42, 0.58, 0.62, 0.74, '#2b5fb8'); // where the straps cross
        faceQuad(ctx, 'L', x, y, w, h, 0.2, 0.8, 0.86, 0.96, '#f4efe0');
      }
      band(ctx, x, y, w, h, 0.84, 0.9, '#f4efe0'); // bead necklace
      band(ctx, x, y, w, h, 0.78, 0.84, '#c8372d');
      if (armoured) band(ctx, x, y, w, h, 0.5, 0.6, '#6a4a2a');
      break;
    }
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
    case 'inuit':
      inuitFace(ctx, kind, x, y, w, h);
      break;
    case 'inca': incaFace(ctx, kind, x, y, w, h); break;
    case 'aboriginal': aboFace(ctx, kind, x, y, w, h); break;
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
    case 'polynesia': {
      // tā moko: koru spirals on both cheeks, chin lines and a forehead band, in blue-black
      const mk = '#141c30';
      for (const u of [0.04, 0.68]) {
        faceQuad(ctx, 'R', x, y, w, h, u, u + 0.28, 0.18, 0.42, mk);
        faceQuad(ctx, 'R', x, y, w, h, u + 0.07, u + 0.21, 0.24, 0.36, shade(skin, -0.06));
        faceQuad(ctx, 'R', x, y, w, h, u + 0.11, u + 0.17, 0.28, 0.32, mk);
        faceQuad(ctx, 'R', x, y, w, h, u + (u < 0.5 ? 0.16 : 0), u + (u < 0.5 ? 0.28 : 0.12), 0.3, 0.34, shade(skin, -0.06)); // the spiral's open end
      }
      faceQuad(ctx, 'R', x, y, w, h, 0.3, 0.7, 0.06, 0.12, mk); // chin
      for (const u of [0.32, 0.48, 0.64]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.04, 0, 0.2, mk);
      for (const u of [0.2, 0.4, 0.6]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.06, 0.76, 0.8, mk); // brow curls
      faceQuad(ctx, 'L', x, y, w, h, 0.45, 0.9, 0.24, 0.3, mk); // side of the cheek
      if (kind === 'warrior' || kind === 'archer' || kind === 'explorer' || kind === 'rider') {
        faceQuad(ctx, 'L', x, y, w, h, 0.68, 0.8, -0.12, 0.38, '#f4efe0'); // a mako shark-tooth earring
        faceQuad(ctx, 'L', x, y, w, h, 0.68, 0.74, -0.12, 0.38, '#cfc8b4');
      } else {
        faceQuad(ctx, 'L', x, y, w, h, 0.66, 0.84, 0.1, 0.34, '#3f9a6a'); // kuru: a greenstone ear drop
        faceQuad(ctx, 'L', x, y, w, h, 0.66, 0.74, 0.16, 0.34, '#8fd6a8');
        faceQuad(ctx, 'L', x, y, w, h, 0.72, 0.78, -0.1, 0.1, '#f4efe0'); // with a tooth hanging below
      }
      faceQuad(ctx, 'R', x, y, w, h, 0.44, 0.56, 0.5, 0.74, mk); // nose-bridge line
      faceQuad(ctx, 'R', x, y, w, h, 0.18, 0.3, 0.56, 0.62, '#f4efe0'); // paua-shell glint of the eyes
      faceQuad(ctx, 'R', x, y, w, h, 0.7, 0.82, 0.56, 0.62, '#f4efe0');
      faceQuad(ctx, 'R', x, y, w, h, 0.4, 0.6, 0.22, 0.27, '#b3302a'); // red ochre on the lips
      if (kind === 'giant' || kind === 'swordsman') for (const u of [0, 0.86]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.14, 0.0, 0.3, hair); // beard along the jaw
      break;
    }
    case 'rome':
      if (kind !== 'archer' && kind !== 'catapult' && kind !== 'explorer') {
        faceQuad(ctx, 'R', x, y, w, h, 0.05, 0.95, 0, 0.17, mix(skin, hair, 0.38)); // close-cropped beard stubble
        faceQuad(ctx, 'L', x, y, w, h, 0.55, 1, 0, 0.17, mix(skin, hair, 0.38));
      }
      if (kind === 'legionary' || kind === 'swordsman') faceQuad(ctx, 'R', x, y, w, h, 0.7, 0.75, 0.3, 0.62, '#c98f78'); // a veteran's scar
      faceQuad(ctx, 'R', x, y, w, h, 0.17, 0.44, 0.76, 0.79, shade(skin, -0.2)); // brow crease under the helmet
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
      faceQuad(ctx, 'R', x, y, w, h, 0.28, 0.72, 0.2, 0.25, LOOK.greeks.hair); // moustache
      faceQuad(ctx, 'R', x, y, w, h, 0.9, 1, 0.24, 0.5, LOOK.greeks.hair); // sideburn
      if (kind === 'giant' || kind === 'knight' || kind === 'swordsman') faceQuad(ctx, 'R', x, y, w, h, 0.22, 0.78, -0.14, 0.02, LOOK.greeks.hair); // a longer, forked beard
      if (kind === 'archer' || kind === 'explorer' || kind === 'catapult') for (const u of [0.05, 0.3, 0.55, 0.8]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.16, 0.82, 0.93, LOOK.greeks.hair); // curls under the wreath
      break;
    case 'persia':
      persiaFace(ctx, kind, x, y, w, h);
      break;
    case 'ethiopia': {
      const bearded = kind === 'swordsman' || kind === 'shotelai' || kind === 'defender' || kind === 'knight' || kind === 'giant';
      faceQuad(ctx, 'R', x, y, w, h, 0.22, 0.78, 0.2, 0.25, hair); // a neat moustache
      if (bearded) {
        faceQuad(ctx, 'R', x, y, w, h, 0.02, 0.98, 0, 0.14, hair); // trimmed beard along the jaw
        faceQuad(ctx, 'L', x, y, w, h, 0.5, 1, 0, 0.16, hair);
        faceQuad(ctx, 'R', x, y, w, h, 0.9, 1, 0.14, 0.4, hair); // sideburn
        faceQuad(ctx, 'R', x, y, w, h, 0.3, 0.7, 0.12, 0.15, shade(hair, 0.16)); // a lip line in the beard
        if (kind === 'giant' || kind === 'knight') faceQuad(ctx, 'R', x, y, w, h, 0.28, 0.72, -0.16, 0.02, hair); // longer beard on the champions
      } else {
        faceQuad(ctx, 'R', x, y, w, h, 0.4, 0.6, 0.06, 0.13, hair); // a small chin tuft
      }
      faceQuad(ctx, 'R', x, y, w, h, 0.15, 0.4, 0.36, 0.4, shade(skin, 0.2)); // cheekbone glints
      faceQuad(ctx, 'R', x, y, w, h, 0.62, 0.86, 0.36, 0.4, shade(skin, 0.2));
      faceQuad(ctx, 'L', x, y, w, h, 0.68, 0.8, 0.24, 0.4, GOLD); // a gold ear drop
      faceQuad(ctx, 'L', x, y, w, h, 0.68, 0.8, 0.34, 0.4, shade(GOLD, 0.5));
      if (kind === 'warrior' || kind === 'archer' || kind === 'explorer' || kind === 'rider') faceQuad(ctx, 'R', x, y, w, h, 0.47, 0.53, 0.8, 0.95, shade(skin, -0.28)); // a tiny cross tattooed on the brow
      if (kind === 'warrior' || kind === 'archer' || kind === 'explorer' || kind === 'rider') faceQuad(ctx, 'R', x, y, w, h, 0.4, 0.6, 0.86, 0.9, shade(skin, -0.28));
      break;
    }
    case 'celts': celtFace(ctx, kind, x, y, w, h); break;
    case 'zulu':
      for (const u of [0.1, 0.84]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.06, 0.34, 0.4, '#f4efe0'); // white dots
      for (const u of [0.04, 0.9]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.05, 0.46, 0.66, '#f4efe0'); // chalk streaks on the cheekbones
      faceQuad(ctx, 'R', x, y, w, h, 0.42, 0.58, 0.05, 0.12, LOOK.zulu.hair); // chin tuft
      faceQuad(ctx, 'L', x, y, w, h, 0.66, 0.84, 0.38, 0.54, '#f4efe0'); // ear disc
      faceQuad(ctx, 'L', x, y, w, h, 0.71, 0.79, 0.42, 0.5, '#c8372d');
      break;
  }
}

function drawHeadgear(ctx: Ctx, tribe: TribeId, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  switch (tribe) {
    case 'inuit':
      inuitHead(ctx, kind, x, top, k, hw);
      break;
    case 'inca': incaHeadgear(ctx, kind, x, top, k, hw); break;
    case 'aboriginal': aboHead(ctx, kind, x, top, k, hw); break;
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
      line(ctx, x - 3.6 * k, top + 0.6 * k, x + 1.6 * k, top + 0.6 * k, '#f4efe0', 0.8 * k); // white tie binding the knot
      // plaited taniko headband painted across the brow
      faceQuad(ctx, 'R', x, top + 10.5 * k, hw, 10.5 * k, 0, 1, 0.8, 0.95, '#1a1a1e');
      faceQuad(ctx, 'L', x, top + 10.5 * k, hw, 10.5 * k, 0, 1, 0.8, 0.95, '#1a1a1e');
      for (const u of [0.05, 0.4, 0.75]) faceQuad(ctx, 'R', x, top + 10.5 * k, hw, 10.5 * k, u, u + 0.2, 0.83, 0.92, '#b3302a');
      for (const u of [0.28, 0.63, 0.98]) faceQuad(ctx, 'R', x, top + 10.5 * k, hw, 10.5 * k, u - 0.02, u + 0.06, 0.83, 0.92, '#f4efe0');
      faceQuad(ctx, 'L', x, top + 10.5 * k, hw, 10.5 * k, 0.1, 0.9, 0.83, 0.92, '#b3302a');
      if (kind === 'swordsman' || kind === 'knight' || kind === 'defender' || kind === 'giant') {
        // a carved wooden pare across the brow, inlaid with paua-shell dots and a red edge
        faceQuad(ctx, 'R', x, top + 10.5 * k, hw, 10.5 * k, 0, 1, 0.74, 0.8, '#b3302a');
        for (const u of [0.1, 0.32, 0.54, 0.76]) faceQuad(ctx, 'R', x, top + 10.5 * k, hw, 10.5 * k, u, u + 0.12, 0.8, 0.9, '#f4efe0');
        for (const u of [0.22, 0.44, 0.66, 0.88]) faceQuad(ctx, 'R', x, top + 10.5 * k, hw, 10.5 * k, u, u + 0.07, 0.8, 0.9, '#3f9a6a');
      }
      // a carved bone heru comb standing in the topknot
      box(ctx, x + 1.2 * k, top - 0.4 * k, 1.2 * k, 5 * k, '#f4efe0');
      for (const dy of [-3.6, -2, -0.4]) line(ctx, x + 1.2 * k, top + dy * k, x + 3 * k, top + (dy - 0.6) * k, '#f4efe0', 0.5 * k);
      if (kind === 'archer' || kind === 'explorer' || kind === 'catapult') {
        // a red kaka feather and a green kereru feather tucked into the band
        feather(ctx, x - 2 * k, top + 1.6 * k, x - 4 * k, top - 5.6 * k, 1.2 * k, '#b3302a', '#f4efe0');
        feather(ctx, x - 0.4 * k, top + 1.4 * k, x + 0.6 * k, top - 4.6 * k, 1 * k, '#3f9a6a', '#8fd6a8');
      }
      if (kind !== 'archer' && kind !== 'explorer' && kind !== 'catapult') {
        // a white heron (kōtuku) feather tucked into the knot, with a dark huia-tipped one beside it
        poly(ctx, [x - 2.4 * k, top + 1.4 * k, x - 4.6 * k, top - 6.6 * k, x - 0.4 * k, top + 1 * k], '#f4efe0');
        poly(ctx, [x - 2.4 * k, top + 1.4 * k, x - 4.6 * k, top - 6.6 * k, x - 3.4 * k, top - 0.4 * k], shade('#f4efe0', -0.15));
        poly(ctx, [x - 0.4 * k, top + 1 * k, x + 0.6 * k, top - 6.4 * k, x + 1.6 * k, top + 0.8 * k], '#1a1a1e');
        poly(ctx, [x + 0.6 * k, top - 6.4 * k, x + 1 * k, top - 4.6 * k, x + 0.4 * k, top - 4.6 * k], '#f4efe0');
      }
      if (kind === 'giant') for (let i = 0; i < 5; i++) poly(ctx, [x - 5 * k + i * 2.5 * k, top + 1 * k, x - 3.7 * k + i * 2.5 * k, top - 5 * k, x - 2.4 * k + i * 2.5 * k, top + 1 * k], i % 2 ? '#1a1a1e' : '#f4efe0');
      break;
    }
    case 'rome': {
      const plain = kind === 'archer' || kind === 'catapult';
      box(ctx, x, top + 4 * k, hw + 1.2 * k, 4.8 * k, kind === 'giant' ? GOLD : STEEL);
      faceQuad(ctx, 'R', x, top + 10.5 * k, hw + 1.2 * k, 10 * k, 0.82, 1, 0.3, 0.72, STEEL); // cheek guards
      faceQuad(ctx, 'L', x, top + 10.5 * k, hw + 1.2 * k, 10 * k, 0.85, 1, 0.3, 0.72, STEEL);
      faceQuad(ctx, 'R', x, top + 4 * k, hw + 1.2 * k, 4.8 * k, 0, 1, 0, 0.14, kind === 'giant' ? shade(GOLD, -0.2) : BRONZE); // brow band
      for (const u of [0.12, 0.86]) faceQuad(ctx, 'R', x, top + 4 * k, hw + 1.2 * k, 4.8 * k, u, u + 0.06, 0.5, 0.65, GOLD); // rivets
      faceQuad(ctx, 'L', x, top + 10.5 * k, hw + 1.2 * k, 10 * k, 0.02, 0.5, 0.28, 0.42, shade(STEEL, -0.18)); // neck guard
      faceQuad(ctx, 'L', x, top + 10.5 * k, hw + 1.2 * k, 10 * k, 0.02, 0.5, 0.42, 0.45, BRONZE);
      if (plain) ellipse(ctx, x, top - 0.7 * k, 1.3 * k, 1 * k, BRONZE); // auxiliary's knob
      if (!plain) {
        const c = '#d82a2a';
        poly(ctx, [x - 5.5 * k, top + 0.5 * k, x - 3.5 * k, top - 5 * k, x + 3.5 * k, top - 4 * k, x + 5.5 * k, top + 1.5 * k, x, top + 1.8 * k], c);
        poly(ctx, [x - 3.5 * k, top - 5 * k, x + 3.5 * k, top - 4 * k, x + 2.5 * k, top - 2.5 * k, x - 2.5 * k, top - 3.4 * k], shade(c, 0.2));
        line(ctx, x - 5.4 * k, top + 0.8 * k, x + 5.4 * k, top + 1.4 * k, BRONZE, 0.9 * k); // crest holder
        for (const t of [-3, -1, 1, 3]) line(ctx, x + t * k, top + 0.8 * k, x + t * 0.8 * k, top - 3.6 * k, shade(c, -0.3), 0.4 * k); // bristles
        if (kind === 'swordsman' || kind === 'knight' || kind === 'giant') {
          // a centurion's transverse crest, ear to ear
          poly(ctx, [x - 7.4 * k, top - 0.5 * k, x - 6 * k, top - 6.8 * k, x + 6 * k, top - 6.8 * k, x + 7.4 * k, top - 0.5 * k, x, top + 0.6 * k], c);
          poly(ctx, [x - 6 * k, top - 6.8 * k, x + 6 * k, top - 6.8 * k, x + 6.4 * k, top - 5.4 * k, x - 6.4 * k, top - 5.4 * k], shade(c, 0.3));
          poly(ctx, [x - 7.4 * k, top - 0.5 * k, x - 7 * k, top - 2.4 * k, x + 7 * k, top - 2.4 * k, x + 7.4 * k, top - 0.5 * k, x, top + 0.6 * k], '#f4efe0');
          for (let i = -3; i <= 3; i++) line(ctx, x + i * 1.9 * k, top - 2.6 * k, x + i * 1.7 * k, top - 6.6 * k, shade(c, -0.3), 0.4 * k);
        }
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
        for (const u of [0.1, 0.4, 0.7]) faceQuad(ctx, 'R', x, top + 2.4 * k, hw + 0.6 * k, 1.6 * k, u, u + 0.08, 0.3, 0.9, '#d9c04a'); // olive fruit
        poly(ctx, [x - 5.2 * k, top + 2.2 * k, x - 8 * k, top + 6 * k, x - 6.6 * k, top + 6.6 * k, x - 4.8 * k, top + 3.4 * k], '#f4f1ea'); // ribbon tails
        poly(ctx, [x - 5.2 * k, top + 2.4 * k, x - 6.4 * k, top + 8 * k, x - 4.8 * k, top + 6.4 * k, x - 4.4 * k, top + 3.2 * k], TRIBES.greeks.color);
        if (kind === 'explorer') {
          // a broad felt petasos over the wreath, chin cord and all
          poly(ctx, [x - 9 * k, top + 3 * k, x, top - 3.4 * k, x + 9 * k, top + 3 * k, x, top + 6.4 * k], '#8a6a44');
          poly(ctx, [x, top - 3.4 * k, x + 9 * k, top + 3 * k, x, top + 6.4 * k], shade('#8a6a44', -0.22));
          ellipse(ctx, x, top - 0.8 * k, 4 * k, 2.1 * k, '#a8865a');
          band(ctx, x, top + 1.4 * k, 6 * k, 1.5 * k, 0, 1, TRIBES.greeks.color);
        }
        break;
      }
      // bronze helmet with cheek pieces and a tall front-to-back crest
      box(ctx, x, top + 4.4 * k, hw + 1.2 * k, 5 * k, BRONZE);
      faceQuad(ctx, 'R', x, top + 10.5 * k, hw + 1.2 * k, 10 * k, 0.04, 0.3, 0.12, 0.72, BRONZE);
      faceQuad(ctx, 'R', x, top + 10.5 * k, hw + 1.2 * k, 10 * k, 0.72, 0.96, 0.12, 0.72, BRONZE);
      faceQuad(ctx, 'L', x, top + 10.5 * k, hw + 1.2 * k, 10 * k, 0, 1, 0.3, 0.72, BRONZE);
      const c = kind === 'giant' ? GOLD : kind === 'hoplite' ? '#c8372d' : TRIBES.greeks.color;
      line(ctx, x - 5.4 * k, top + 0.4 * k, x + 4.6 * k, top + 0.6 * k, shade(BRONZE, -0.35), 1.1 * k); // the crest's bronze mount
      poly(ctx, [x + 4.5 * k, top + 1.5 * k, x + 4 * k, top - 6 * k, x - 1 * k, top - 8 * k, x - 6 * k, top - 5 * k, x - 7 * k, top + 3 * k, x - 3 * k, top - 1 * k, x + 1 * k, top - 1 * k], c);
      poly(ctx, [x + 4 * k, top - 6 * k, x - 1 * k, top - 8 * k, x - 6 * k, top - 5 * k, x - 1 * k, top - 6 * k], shade(c, 0.25));
      for (let i = 0; i < 5; i++) line(ctx, x + 3.6 * k - i * 2.2 * k, top - 5.4 * k - (i % 2 === 0 ? 0 : 0.4 * k) + i * 0.5 * k, x + 3.2 * k - i * 2.4 * k, top - 0.8 * k + i * 0.3 * k, shade(c, -0.3), 0.5 * k); // horsehair strands
      faceQuad(ctx, 'R', x, top + 10.5 * k, hw + 1.2 * k, 10 * k, 0.44, 0.56, 0.25, 0.8, shade(BRONZE, 0.15)); // nasal guard
      faceQuad(ctx, 'R', x, top + 10.5 * k, hw + 1.2 * k, 10 * k, 0, 1, 0.42, 0.47, shade(BRONZE, -0.4)); // shadow under the brow rim
      for (const u of [0.15, 0.83]) faceQuad(ctx, 'R', x, top + 10.5 * k, hw + 1.2 * k, 10 * k, u, u + 0.08, 0.5, 0.56, GOLD); // cheek-guard rivets
      if (kind === 'giant' || kind === 'knight' || kind === 'hoplite') faceQuad(ctx, 'R', x, top + 10.5 * k, hw + 1.2 * k, 10 * k, 0, 1, 0.47, 0.53, GOLD); // gilded brow rim
      break;
    }
    case 'persia':
      persiaHeadgear(ctx, kind, x, top, k, hw);
      break;
    case 'ethiopia': {
      const G = '#2f9a4a', Y = '#e8c21a', R = '#c8372d', CL = '#f7f2e2';
      const crossAt = (bx: number, by: number, bw: number, bh: number, c: string) => { // a little cross on the turban's front
        faceQuad(ctx, 'R', bx, by, bw, bh, 0.44, 0.56, 0.2, 0.86, c);
        faceQuad(ctx, 'R', bx, by, bw, bh, 0.3, 0.7, 0.44, 0.6, c);
      };
      const turban = (hgt: number, stripe: string, cross: boolean) => {
        const bw = hw + 1.8 * k, by = top + 3.2 * k, bh = hgt * k;
        // the cloth tail hangs down the back, ending in a tibeb border
        poly(ctx, [x - 4.6 * k, by - bh * 0.6, x - 7.2 * k, by - bh * 0.1, x - 8.8 * k, by + 9.4 * k, x - 5.8 * k, by + 8.2 * k, x - 4.4 * k, by + 1 * k], shade(CL, -0.14));
        poly(ctx, [x - 8.8 * k, by + 9.4 * k, x - 5.8 * k, by + 8.2 * k, x - 5.9 * k, by + 7 * k, x - 8.6 * k, by + 8.1 * k], stripe);
        poly(ctx, [x - 8.6 * k, by + 8.1 * k, x - 5.9 * k, by + 7 * k, x - 6 * k, by + 6.2 * k, x - 8.4 * k, by + 7.2 * k], G);
        box(ctx, x, by, bw, bh, CL);
        for (const v of [0.36, 0.7]) { faceQuad(ctx, 'R', x, by, bw, bh, 0, 1, v, v + 0.07, '#d5cdb2'); faceQuad(ctx, 'L', x, by, bw, bh, 0, 1, v, v + 0.07, '#c4bca2'); }
        facePoly(ctx, 'R', x, by, bw, bh, [[0, 0.3], [1, 0.72], [1, 0.8], [0, 0.38]], '#e4dcc4'); // a slanting fold
        faceQuad(ctx, 'R', x, by, bw, bh, 0, 1, 0, 0.22, stripe); // coloured band
        faceQuad(ctx, 'L', x, by, bw, bh, 0, 1, 0, 0.22, shade(stripe, -0.15));
        faceQuad(ctx, 'R', x, by, bw, bh, 0, 1, 0.22, 0.28, G);
        faceQuad(ctx, 'L', x, by, bw, bh, 0, 1, 0.22, 0.28, shade(G, -0.15));
        ellipse(ctx, x, by - bh, bw * 0.46, bw * 0.25, shade(CL, -0.04)); // rounded crown
        ellipse(ctx, x - 0.6 * k, by - bh - 1.2 * k, bw * 0.34, bw * 0.19, CL);
        ellipse(ctx, x - 1.2 * k, by - bh - 1.8 * k, bw * 0.16, bw * 0.08, '#ffffff');
        line(ctx, x - bw * 0.3, by - bh - 0.6 * k, x + bw * 0.28, by - bh - 1.6 * k, '#d5cdb2', 0.5 * k);
        if (cross) crossAt(x, by, bw, bh, GOLD);
        return { bw, by, bh };
      };
      const mane = (spread: number) => { // a lion's mane: shaggy tufts round the brow and cheeks, behind and over the head
        for (let i = 0; i < 11; i++) {
          const a = Math.PI + (i / 10) * Math.PI, c = i % 2 ? '#8a5a22' : '#3a2410';
          const bx0 = x + Math.cos(a) * 5.4 * k, by0 = top + 2.4 * k + Math.sin(a) * 4 * k;
          poly(ctx, [bx0 - 1.6 * k, by0 + 1.4 * k, x + Math.cos(a) * (8.4 + spread) * k, top + 2.4 * k + Math.sin(a) * (6.6 + spread) * k, bx0 + 1.6 * k, by0 + 1.4 * k], c);
        }
        ellipse(ctx, x, top + 1.6 * k, 6 * k, 3.6 * k, '#4a2e14');
        ellipse(ctx, x - 0.8 * k, top + 0.6 * k, 4 * k, 2 * k, '#6a4520');
        for (const [dx, len, c] of [[-6.6, 10, '#3a2410'], [-5.2, 12, '#8a5a22'], [-7.8, 8, '#5a3a18'], [5.8, 6.4, '#3a2410'], [6.8, 4.6, '#8a5a22']] as const)
          poly(ctx, [x + dx * k - 1.4 * k, top + 3 * k, x + dx * k + 0.2 * k, top + (3 + len) * k, x + dx * k + 1.6 * k, top + 3 * k], c); // hanging locks
        box(ctx, x, top + 3.4 * k, hw + 1 * k, 1.5 * k, '#3a2410'); // a shaggy fringe over the brow
        for (const u of [0.05, 0.2, 0.35, 0.5, 0.65, 0.8]) faceQuad(ctx, 'R', x, top + 3.4 * k, hw + 1 * k, 1.5 * k, u, u + 0.08, 0.2, 1.4, u > 0.4 ? '#8a5a22' : '#3a2410');
      };
      if (kind === 'giant') {
        mane(1.2);
        // a gold crown with a cross rising from it
        faceQuad(ctx, 'R', x, top + 2.6 * k, hw + 1 * k, 2 * k, 0, 1, 0, 1, GOLD);
        faceQuad(ctx, 'L', x, top + 2.6 * k, hw + 1 * k, 2 * k, 0, 1, 0, 1, shade(GOLD, -0.12));
        faceQuad(ctx, 'R', x, top + 2.6 * k, hw + 1 * k, 2 * k, 0.1, 0.9, 0.62, 0.9, shade(GOLD, 0.4));
        for (const u of [0.15, 0.5, 0.85]) faceQuad(ctx, 'R', x, top + 2.6 * k, hw + 1 * k, 2 * k, u - 0.06, u + 0.06, 0.25, 0.6, u === 0.5 ? R : G);
        for (const u of [-3.6, -1.2, 1.2, 3.6]) poly(ctx, [x + (u - 1) * k, top - 0.4 * k, x + u * k, top - 3.2 * k, x + (u + 1) * k, top - 0.4 * k], GOLD); // crown points
        line(ctx, x, top - 1 * k, x, top - 8 * k, GOLD, 1.5 * k);
        line(ctx, x - 2.6 * k, top - 5 * k, x + 2.6 * k, top - 5 * k, GOLD, 1.5 * k);
        for (const [dx, dy] of [[0, -8.4], [-2.8, -5], [2.8, -5]] as const) ellipse(ctx, x + dx * k, top + dy * k, 0.9 * k, 0.9 * k, shade(GOLD, 0.4));
        break;
      }
      if (kind === 'knight') {
        mane(0);
        faceQuad(ctx, 'R', x, top + 2.4 * k, hw + 1 * k, 1.5 * k, 0, 1, 0, 1, T_LIME); // a lime-gold circlet
        faceQuad(ctx, 'L', x, top + 2.4 * k, hw + 1 * k, 1.5 * k, 0, 1, 0, 1, shade(T_LIME, -0.2));
        faceQuad(ctx, 'R', x, top + 2.4 * k, hw + 1 * k, 1.5 * k, 0.42, 0.58, 0.1, 0.9, GOLD);
        break;
      }
      if (kind === 'defender') {
        // an iron helmet on a white cap, a gilded brow band, cheek plates and a plume of tibeb colours
        const hh = hw + 1.4 * k;
        box(ctx, x, top + 3.2 * k, hh, 4.6 * k, '#9aa3ad');
        ellipse(ctx, x, top - 1.4 * k, hh * 0.46, hh * 0.25, '#b4bcc6');
        ellipse(ctx, x - 0.8 * k, top - 2.6 * k, hh * 0.33, hh * 0.17, '#cfd6de');
        faceQuad(ctx, 'R', x, top + 3.2 * k, hh, 4.6 * k, 0, 1, 0, 0.3, GOLD); // brow band
        faceQuad(ctx, 'R', x, top + 3.2 * k, hh, 4.6 * k, 0.44, 0.56, 0.2, 0.95, shade('#9aa3ad', -0.3)); // ridge
        for (const u of [0.18, 0.8]) faceQuad(ctx, 'R', x, top + 3.2 * k, hh, 4.6 * k, u, u + 0.08, 0.06, 0.24, shade(GOLD, -0.35)); // rivets
        faceQuad(ctx, 'R', x, top + 3.2 * k, hh, 4.6 * k, 0.36, 0.64, 0.42, 0.9, shade('#9aa3ad', 0.1));
        crossAt(x, top + 3.2 * k, hh, 4.6 * k, GOLD);
        poly(ctx, [x - 5.4 * k, top + 3.4 * k, x - 5.8 * k, top + 9 * k, x - 3.8 * k, top + 8 * k, x - 4.2 * k, top + 3.4 * k], '#7f8892'); // cheek plate
        for (const [i, c] of [[0, G], [1, Y], [2, R]] as const) poly(ctx, [x - 0.4 * k, top - 2.4 * k, x - 6.6 * k + i * 1.4 * k, top - 8.6 * k - i * 0.5 * k, x - 3.8 * k + i * 1.2 * k, top - 3.6 * k], c);
        break;
      }
      if (kind === 'explorer') {
        // a wide plaited straw hat with a lime-gold cord and a trailing scarf
        ellipse(ctx, x, top + 1.8 * k, 9.4 * k, 3.6 * k, '#a8865a');
        ellipse(ctx, x, top + 1.4 * k, 8.8 * k, 3.1 * k, '#d9b872');
        for (const r of [6, 4]) ring(ctx, x, top + 1.4 * k, r * k, r * 0.36 * k, '#a8865a', 0.5 * k);
        box(ctx, x, top + 1.6 * k, hw * 0.6, 3.6 * k, '#d9b872');
        ellipse(ctx, x, top - 2.4 * k, hw * 0.32, hw * 0.16, '#e6cc8e');
        faceQuad(ctx, 'R', x, top + 1.6 * k, hw * 0.6, 3.6 * k, 0, 1, 0.05, 0.35, T_LIME);
        faceQuad(ctx, 'R', x, top + 1.6 * k, hw * 0.6, 3.6 * k, 0, 1, 0.35, 0.42, R);
        poly(ctx, [x - 5.4 * k, top + 2.4 * k, x - 8.8 * k, top + 8 * k, x - 6.4 * k, top + 8.2 * k, x - 4.2 * k, top + 3.4 * k], CL);
        poly(ctx, [x - 8.8 * k, top + 8 * k, x - 6.4 * k, top + 8.2 * k, x - 6.6 * k, top + 6.8 * k, x - 8.4 * k, top + 6.6 * k], G);
        break;
      }
      if (kind === 'swordsman' || kind === 'shotelai') {
        const t = turban(kind === 'shotelai' ? 6.4 : 5.6, kind === 'shotelai' ? T_LIME : GOLD, true);
        if (kind === 'shotelai') { // an ostrich plume tucked into the wrap
          poly(ctx, [x + 3.4 * k, t.by - t.bh, x + 2 * k, t.by - t.bh - 8 * k, x + 5.2 * k, t.by - t.bh - 1.4 * k], '#1a1a1a');
          poly(ctx, [x + 3.4 * k, t.by - t.bh, x + 6.4 * k, t.by - t.bh - 7 * k, x + 5.8 * k, t.by - t.bh - 0.6 * k], '#f4efe0');
          poly(ctx, [x + 3.6 * k, t.by - t.bh, x + 4.2 * k, t.by - t.bh - 6 * k, x + 4.8 * k, t.by - t.bh], R);
        } else faceQuad(ctx, 'R', x, t.by, t.bw, t.bh, 0, 1, 0.22, 0.28, R);
        break;
      }
      if (kind === 'archer') { turban(4.2, Y, false); break; }
      if (kind === 'rider') { turban(4.6, R, false); break; }
      turban(4.8, T_LIME, false); // warrior
      break;
    }
    case 'celts': celtHeadgear(ctx, kind, x, top, k, hw); break;
    case 'zulu': {
      box(ctx, x, top + 2.8 * k, hw + 1 * k, 2.4 * k, '#6a4a2a'); // fur headband
      faceQuad(ctx, 'R', x, top + 2.8 * k, hw + 1 * k, 2.4 * k, 0.3, 0.45, 0, 1, '#c9a45a');
      const tall = kind === 'impi' || kind === 'giant' || kind === 'swordsman' || kind === 'knight';
      for (const u of [0.05, 0.2, 0.35, 0.5, 0.65, 0.8]) faceQuad(ctx, 'R', x, top + 2.8 * k, hw + 1 * k, 2.4 * k, u, u + 0.07, 0.75, 1.1, '#3a2410'); // fur bristle along the band
      poly(ctx, [x - 2 * k, top + 1 * k, x - 3.6 * k, top - (tall ? 11 : 7) * k, x - 0.6 * k, top + 0.6 * k], '#f4efe0'); // feathers
      poly(ctx, [x - 2 * k, top + 1 * k, x - 3.6 * k, top - (tall ? 11 : 7) * k, x - 2.6 * k, top + 0.6 * k], shade('#f4efe0', -0.15));
      if (tall) poly(ctx, [x + 1 * k, top + 1 * k, x + 2.6 * k, top - 10 * k, x + 2.4 * k, top + 0.6 * k], '#1a1a1a');
      poly(ctx, [x - 0.4 * k, top + 1.2 * k, x + 0.6 * k, top - (tall ? 8 : 5) * k, x + 1.2 * k, top + 1 * k], '#c8372d'); // a red lourie feather
      if (kind !== 'archer' && kind !== 'catapult') {
        // cow-tail tufts hang past the cheeks on either side
        poly(ctx, [x - 5.8 * k, top + 3.6 * k, x - 6.6 * k, top + 11 * k, x - 4.4 * k, top + 9 * k, x - 4.2 * k, top + 3.6 * k], '#f4efe0');
        poly(ctx, [x - 5.8 * k, top + 8 * k, x - 6.6 * k, top + 11 * k, x - 4.4 * k, top + 9 * k, x - 4.6 * k, top + 7.6 * k], '#2a1a10');
        poly(ctx, [x + 5.4 * k, top + 3.4 * k, x + 6.6 * k, top + 9.6 * k, x + 4.8 * k, top + 8 * k], '#f4efe0');
        poly(ctx, [x + 5.6 * k, top + 6.8 * k, x + 6.6 * k, top + 9.6 * k, x + 4.8 * k, top + 8 * k], '#2a1a10');
      }
      break;
    }
  }
  if (kind === 'giant') drawStar(ctx, x, top - (tribe === 'egypt' ? 14 : tribe === 'persia' ? 16 : tribe === 'greeks' || tribe === 'zulu' || tribe === 'ethiopia' || tribe === 'aboriginal' ? 12 : 8) * k, 2.4 * k);
}

function drawFootUnit(ctx: Ctx, kind: UnitKind, tribe: TribeId, x: number, y: number, k: number) {
  // Things carried on the back go first.
  if (kind === 'harpooner') {
    // a sealskin float on a cord and spare harpoon shafts slung behind the shoulder
    for (const [dx, tip] of [[0, -22], [2.6, -20.4]] as const) {
      line(ctx, x - 6 * k, y - 8 * k, x + (dx - 10.4) * k, y + tip * k, '#7a5a3a', 1 * k);
      poly(ctx, [x + (dx - 10.4) * k, y + tip * k, x + (dx - 11.4) * k, y + (tip + 2.6) * k, x + (dx - 9.2) * k, y + (tip + 2.4) * k], I_BONE);
    }
    inuitFloat(ctx, x - 7.4 * k, y - 6.6 * k, k * 0.95);
  }
  if (isAbo(tribe) && (kind === 'archer' || kind === 'explorer' || kind === 'woomera')) aboBack(ctx, kind, x, y, k);
  else if (kind === 'archer' || kind === 'explorer') {
    box(ctx, x - (kind === 'archer' ? 7 : 4.5) * k, y - 8 * k, 4 * k, 8 * k, kind === 'explorer' ? '#8a5a2b' : '#6b4424');
    if (kind === 'archer' && tribe === 'polynesia') {
      // a woven flax kete with a bundle of darts, their feathered ends and red lashings sticking out
      const qx = x - 7 * k;
      box(ctx, qx, y - 8 * k, 4 * k, 8 * k, '#2a2a32');
      band(ctx, qx, y - 8 * k, 4 * k, 8 * k, 0.55, 0.7, '#b3302a');
      for (const v of [0.18, 0.4]) for (const u of [0.1, 0.5]) faceQuad(ctx, 'R', qx, y - 8 * k, 4 * k, 8 * k, u, u + 0.28, v, v + 0.12, '#f4efe0'); // woven diamonds
      for (const i of [-1, 0, 1]) {
        const tx = qx - 1.6 * k + i * 1.4 * k;
        line(ctx, qx + i * 1 * k, y - 8.4 * k, tx, y - 16 * k, '#8a5a2b', 0.8 * k);
        feather(ctx, tx, y - 16 * k, tx - 0.6 * k + i * 0.6 * k, y - 20.4 * k, 1 * k, i === 0 ? '#f4efe0' : '#b3302a', '#1a1a1e');
      }
    } else if (kind === 'archer' && tribe === 'persia') {
      persiaQuiver(ctx, x, y, k);
    } else if (kind === 'archer') {
      // a quiver banded in gold, arrows fletched in the empire's colour leaning out of it
      const qx = x - 7 * k;
      band(ctx, qx, y - 8 * k, 4 * k, 8 * k, 0.62, 0.72, tribe === 'inuit' ? I_RED : GOLD);
      if (tribe === 'inuit') band(ctx, qx, y - 8 * k, 4 * k, 8 * k, 0.88, 1, I_FUR); // a fur-trimmed sealskin quiver
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
  if (kind === 'slinger') incaBag(ctx, x, y, k);
  const shieldFirst = kind === 'defender' || kind === 'immortal' || kind === 'legionary' || kind === 'jaguar' || kind === 'hoplite' || kind === 'impi' || kind === 'shotelai' || (kind === 'warrior' && (tribe === 'vikings' || tribe === 'ethiopia')) || (tribe === 'celts' && (kind === 'warrior' || kind === 'clansman' || kind === 'swordsman')) || (isAbo(tribe) && (kind === 'warrior' || kind === 'swordsman' || kind === 'giant'));
  const b = figure(ctx, kind, tribe, x, y, k);
  drawWeapon(ctx, kind, tribe, b, k);
  if (shieldFirst) drawShield(ctx, tribe, kind, b.off.x, b.off.y, k);
}


// ---------------------------------------------------------------- Maori arms and carving

const M_RED = '#b3302a', M_WHITE = '#f4efe0', M_BLACK = '#1a1a1e', M_POU = '#3f9a6a', M_POUL = '#8fd6a8', M_FLAX = '#c9b27a', M_WOOD = '#6b4424';

/** A koru: an unfurling fern-frond spiral, `dir` mirrors it. */
function koru(ctx: Ctx, x: number, y: number, r: number, color: string, w: number, dir = 1) {
  ctx.strokeStyle = ink(color);
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 14; i++) {
    const a = 0.4 + (i / 14) * Math.PI * 3.1, rr = r * (1 - (i / 14) * 0.78);
    const px = x + dir * Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

/** A tuft of feathers or dog hair: a small fan of strands from (x, y) hanging along (dx, dy). */
function tuft(ctx: Ctx, x: number, y: number, dx: number, dy: number, colors: string[], w: number) {
  colors.forEach((c, i) => {
    const t = colors.length > 1 ? i / (colors.length - 1) - 0.5 : 0;
    line(ctx, x + t * w, y, x + dx + t * w * 2.6, y + dy, c, w * 0.8);
  });
}

/** A feather with a pale quill: pointing from (x, y) toward (tx, ty). */
function feather(ctx: Ctx, x: number, y: number, tx: number, ty: number, w: number, color: string, tip?: string) {
  const len = Math.hypot(tx - x, ty - y) || 1;
  const nx = -(ty - y) / len * w, ny = (tx - x) / len * w;
  poly(ctx, [x, y, x + (tx - x) * 0.5 + nx, y + (ty - y) * 0.5 + ny, tx, ty, x + (tx - x) * 0.5 - nx * 0.6, y + (ty - y) * 0.5 - ny * 0.6], color);
  if (tip) poly(ctx, [x + (tx - x) * 0.72 + nx * 0.6, y + (ty - y) * 0.72 + ny * 0.6, tx, ty, x + (tx - x) * 0.72 - nx * 0.4, y + (ty - y) * 0.72 - ny * 0.4], tip);
  line(ctx, x, y, tx, ty, shade(color, -0.3), 0.35);
}

/** Red-and-white lashing around a shaft at (x, y), `n` turns along (ux, uy). */
function lashing(ctx: Ctx, x: number, y: number, ux: number, uy: number, n: number, k: number, a = M_RED, b = M_WHITE) {
  for (let i = 0; i < n; i++) line(ctx, x + ux * i * 0.9 * k - 1 * k, y + uy * i * 0.9 * k + 0.35 * k, x + ux * i * 0.9 * k + 1 * k, y + uy * i * 0.9 * k - 0.35 * k, i % 2 ? b : a, 0.75 * k);
}

/**
 * The Maori weapons, held in the hand at (x, y): mere (pounamu club), tewhatewha (axe-staff),
 * taiaha (carved staff), kotaha (a dart with its throwing cord).
 */
function maoriWeapon(ctx: Ctx, type: 'mere' | 'tewhatewha' | 'taiaha' | 'dart', x: number, y: number, k: number) {
  if (type === 'mere') {
    // a teardrop of polished pounamu, notched along its edge, bound at the grip, with a plaited wrist cord
    line(ctx, x, y + 2 * k, x + 1 * k, y - 3 * k, M_WOOD, 1.8 * k);
    lashing(ctx, x, y + 1.5 * k, 0.2, -1, 4, k, M_RED, M_WHITE);
    ellipse(ctx, x - 0.1 * k, y + 2.4 * k, 1.1 * k, 1.1 * k, '#2a1a10');
    poly(ctx, [x + 1 * k, y - 3 * k, x - 2.2 * k, y - 8 * k, x - 0.6 * k, y - 13.4 * k, x + 2.6 * k, y - 14 * k, x + 4.6 * k, y - 8 * k, x + 2.4 * k, y - 3 * k], '#2e8a5c');
    poly(ctx, [x + 1 * k, y - 3 * k, x - 2.2 * k, y - 8 * k, x - 0.6 * k, y - 13.4 * k, x + 1.4 * k, y - 13.8 * k, x + 1.4 * k, y - 8 * k], M_POUL);
    poly(ctx, [x - 0.4 * k, y - 11 * k, x + 0.8 * k, y - 13 * k, x + 0.9 * k, y - 9 * k], shade(M_POUL, 0.4)); // sheen
    line(ctx, x + 1.4 * k, y - 4 * k, x + 1.5 * k, y - 13 * k, '#1f6a48', 0.5 * k); // centre ridge
    for (const [ex, ey] of [[-2, -6.5], [-1.4, -9.4], [-0.2, -12.2], [3.4, -12], [4.3, -9.2], [3.6, -6]] as const) ellipse(ctx, x + ex * k, y + ey * k, 0.42 * k, 0.42 * k, '#144a30'); // edge notches
    koru(ctx, x + 1.4 * k, y - 7.6 * k, 1.3 * k, '#1a5a3a', 0.4 * k);
    ellipse(ctx, x + 1.6 * k, y - 4.4 * k, 0.5 * k, 0.5 * k, '#0f2a1c');
    line(ctx, x - 0.2 * k, y + 2.4 * k, x - 3.2 * k, y + 5 * k, M_FLAX, 0.7 * k);
    ellipse(ctx, x - 2 * k, y + 3.8 * k, 0.7 * k, 0.7 * k, M_POU); // a pounamu bead on the cord
    feather(ctx, x - 3.2 * k, y + 5 * k, x - 4.6 * k, y + 9.4 * k, 1 * k, M_WHITE, M_RED);
    return;
  }
  if (type === 'tewhatewha') {
    // an axe-staff: a long shaft, a broad carved blade with a red edge, and a plume of white and black feathers
    line(ctx, x + 0.6 * k, y + 6 * k, x + 2.4 * k, y - 22 * k, M_WOOD, 1.7 * k);
    line(ctx, x + 0.2 * k, y + 6 * k, x + 2 * k, y - 22 * k, shade(M_WOOD, 0.4), 0.5 * k);
    lashing(ctx, x + 0.9 * k, y + 2 * k, 0.05, -1, 3, k, '#2a1a10', M_FLAX);
    poly(ctx, [x + 2 * k, y - 21 * k, x + 8.4 * k, y - 19 * k, x + 10.2 * k, y - 14 * k, x + 8 * k, y - 8.6 * k, x + 2 * k, y - 9.4 * k], '#5a3320'); // blade
    poly(ctx, [x + 2 * k, y - 21 * k, x + 6 * k, y - 20 * k, x + 6.4 * k, y - 10 * k, x + 2 * k, y - 9.6 * k], '#a87a45');
    poly(ctx, [x + 2 * k, y - 21 * k, x + 3.6 * k, y - 20.6 * k, x + 3.8 * k, y - 10 * k, x + 2 * k, y - 9.8 * k], shade('#a87a45', 0.25));
    line(ctx, x + 8.4 * k, y - 19 * k, x + 10.2 * k, y - 14 * k, M_RED, 1 * k); // red painted edge
    line(ctx, x + 10.2 * k, y - 14 * k, x + 8 * k, y - 8.6 * k, M_RED, 1 * k);
    koru(ctx, x + 5.4 * k, y - 15.4 * k, 2.4 * k, '#3a2010', 0.7 * k);
    ellipse(ctx, x + 4 * k, y - 11 * k, 0.6 * k, 0.6 * k, M_WHITE); // paua-shell eye of the carving
    ellipse(ctx, x + 7.4 * k, y - 11.6 * k, 0.6 * k, 0.6 * k, M_WHITE);
    ellipse(ctx, x + 2.6 * k, y - 8.8 * k, 1.2 * k, 0.8 * k, '#2a1a10'); // binding
    tuft(ctx, x + 2.6 * k, y - 8.4 * k, -0.6 * k, 4.6 * k, [M_RED, M_WHITE, M_RED], 1 * k);
    feather(ctx, x + 2.4 * k, y - 21.6 * k, x - 0.6 * k, y - 29 * k, 1.1 * k, M_WHITE, M_BLACK);
    feather(ctx, x + 2.4 * k, y - 21.6 * k, x + 2.8 * k, y - 30 * k, 1.1 * k, M_BLACK, M_WHITE);
    feather(ctx, x + 2.4 * k, y - 21.6 * k, x + 6 * k, y - 28 * k, 1.1 * k, M_WHITE, M_RED);
    return;
  }
  if (type === 'taiaha') {
    // a carved fighting staff: flat rango blade at the foot with a koru, red-white bound neck, tongue (arero) and dog-hair tufts
    line(ctx, x + 0.8 * k, y + 5 * k, x + 2 * k, y - 18 * k, M_WOOD, 1.7 * k);
    line(ctx, x + 0.4 * k, y + 5 * k, x + 1.6 * k, y - 18 * k, shade(M_WOOD, 0.4), 0.5 * k);
    for (const t of [0.15, 0.3, 0.45, 0.6]) line(ctx, x + 0.9 * k + 1 * k * t - 0.9 * k, y + 4 * k - 20 * k * t + 0.7 * k, x + 0.9 * k + 1 * k * t + 0.9 * k, y + 4 * k - 20 * k * t - 0.2 * k, '#3a2010', 0.5 * k); // carved notches
    poly(ctx, [x - 0.8 * k, y + 8.4 * k, x + 3 * k, y + 8.4 * k, x + 3.2 * k, y + 0.5 * k, x + 0.8 * k, y - 1 * k], '#a87a45'); // rango blade
    poly(ctx, [x - 0.8 * k, y + 8.4 * k, x + 1.4 * k, y + 8.4 * k, x + 1.4 * k, y - 0.4 * k, x + 0.8 * k, y - 1 * k], shade('#a87a45', 0.22));
    koru(ctx, x + 1.7 * k, y + 5.2 * k, 1.5 * k, '#3a2010', 0.45 * k);
    line(ctx, x + 1.6 * k, y + 1 * k, x + 1.8 * k, y + 3 * k, '#3a2010', 0.4 * k);
    lashing(ctx, x + 1.8 * k, y - 13.8 * k, 0.05, 1, 4, k, M_RED, M_WHITE); // bound neck
    ellipse(ctx, x + 2 * k, y - 16.4 * k, 2.1 * k, 2.4 * k, '#8a5a2b'); // carved head
    ellipse(ctx, x + 1.3 * k, y - 16.8 * k, 0.65 * k, 0.65 * k, M_WHITE);
    ellipse(ctx, x + 2.9 * k, y - 16.6 * k, 0.65 * k, 0.65 * k, M_WHITE);
    ellipse(ctx, x + 1.3 * k, y - 16.8 * k, 0.28 * k, 0.28 * k, M_POU);
    ellipse(ctx, x + 2.9 * k, y - 16.6 * k, 0.28 * k, 0.28 * k, M_POU);
    poly(ctx, [x + 1.2 * k, y - 18.6 * k, x + 2.8 * k, y - 18.6 * k, x + 2.2 * k, y - 24.6 * k], M_RED); // the tongue
    line(ctx, x + 2 * k, y - 19 * k, x + 2.1 * k, y - 23.6 * k, shade(M_RED, 0.4), 0.4 * k);
    for (const [dx, dy, c] of [[-3.6, 6, M_RED], [-2, 7.4, M_WHITE], [-0.4, 7.8, M_RED], [1.2, 7.4, M_WHITE], [2.6, 6, M_RED]] as const) line(ctx, x + 1.6 * k, y - 14.2 * k, x + 1.6 * k + dx * k, y - 14.2 * k + dy * k, c, 1 * k); // dog-hair tufts
    feather(ctx, x + 1.4 * k, y - 15 * k, x - 2.6 * k, y - 20.4 * k, 0.9 * k, M_WHITE, M_BLACK);
    return;
  }
  // a kotaha dart: a long feathered spear ready to hurl on its throwing cord
  line(ctx, x - 6 * k, y + 0.5 * k, x + 11.6 * k, y - 9.5 * k, '#8a5a2b', 1.3 * k);
  line(ctx, x - 6 * k, y - 0.1 * k, x + 11.6 * k, y - 10 * k, shade('#8a5a2b', 0.4), 0.4 * k);
  for (const t of [0.18, 0.22, 0.26, 0.6, 0.64]) line(ctx, x - 6 * k + 17.6 * k * t, y + 0.5 * k - 10 * k * t - 1.2 * k, x - 6 * k + 17.6 * k * t + 0.5 * k, y + 0.5 * k - 10 * k * t + 1.2 * k, t < 0.3 ? M_RED : M_WHITE, 0.7 * k);
  poly(ctx, [x + 11 * k, y - 11.4 * k, x + 15 * k, y - 11.6 * k, x + 11.6 * k, y - 8.6 * k], M_WHITE); // bone barbs
  poly(ctx, [x + 11 * k, y - 11.4 * k, x + 15 * k, y - 11.6 * k, x + 12 * k, y - 10.4 * k], shade(M_WHITE, -0.2));
  poly(ctx, [x + 9.6 * k, y - 8.6 * k, x + 11.6 * k, y - 8.6 * k, x + 10.8 * k, y - 6.6 * k], M_WHITE);
  feather(ctx, x - 6 * k, y + 0.5 * k, x - 9.6 * k, y - 2.4 * k, 1 * k, M_RED, M_WHITE);
  feather(ctx, x - 6 * k, y + 0.5 * k, x - 9.6 * k, y + 2.6 * k, 1 * k, M_WHITE, M_BLACK);
  ctx.strokeStyle = ink(M_FLAX); // the throwing cord looped over the fingers
  ctx.lineWidth = 0.5 * k;
  ctx.beginPath();
  ctx.moveTo(x - 1.4 * k, y - 1.6 * k);
  ctx.quadraticCurveTo(x - 2.6 * k, y + 4 * k, x + 0.6 * k, y + 3.4 * k);
  ctx.stroke();
  line(ctx, x, y + 2 * k, x + 0.6 * k, y - 2.4 * k, M_WOOD, 1.4 * k); // the kotaha stick
}

/** A huata or kotiate: the rider's long spear, with a barbed bone head, a bunch of feathers and a flax-and-taniko streamer. */
function maoriSpear(ctx: Ctx, hx: number, hy: number, thick: number, grand: boolean) {
  const tx = hx + 8, ty = hy - 20;
  line(ctx, hx - 3, hy + 6, tx, ty, '#6b4424', thick);
  line(ctx, hx - 3.6, hy + 6, tx - 0.6, ty, shade('#6b4424', 0.4), 0.5);
  for (const t of [0.12, 0.2, 0.28, 0.36]) line(ctx, hx - 3 + 11 * t - 1, hy + 6 - 26 * t + 0.4, hx - 3 + 11 * t + 1, hy + 6 - 26 * t - 0.4, '#3a2010', 0.8); // carved notches
  ellipse(ctx, hx - 0.4, hy + 0.4, 2, 1.4, M_FLAX); // flax hand wrap
  poly(ctx, [tx + 0.4, ty - 7, tx - 1.6, ty - 1, tx + 0.4, ty + 1.2], M_WHITE); // bone head
  poly(ctx, [tx + 0.4, ty - 7, tx + 2.4, ty - 1, tx + 0.4, ty + 1.2], shade(M_WHITE, -0.25));
  poly(ctx, [tx - 1.6, ty - 2.6, tx - 3, ty - 0.6, tx - 0.8, ty - 0.6], M_WHITE); // barbs
  poly(ctx, [tx + 2.4, ty - 2.6, tx + 3.8, ty - 0.6, tx + 1.4, ty - 0.6], shade(M_WHITE, -0.25));
  for (let i = 0; i < 3; i++) line(ctx, tx - 0.6 + i * 0.3, ty + 1.2 + i * 1.1, tx + 1.6 + i * 0.3, ty + 1.2 + i * 1.1, i % 2 ? M_WHITE : M_RED, 0.9); // lashing
  for (const [dx, dy, c] of [[-3.4, 4.8, M_RED], [-1.2, 6, M_WHITE], [1.2, 6, M_RED], [3.4, 4.8, M_BLACK]] as const) line(ctx, tx + 0.6, ty + 4.2, tx + 0.6 + dx, ty + 4.2 + dy, c, 1.1); // feather and dog-hair bunch
  if (grand) feather(ctx, tx + 0.4, ty - 6, tx + 1.4, ty - 11, 1, M_BLACK, M_WHITE); // a huia plume over the head
  // a taniko streamer instead of a pennant
  const sx = tx - 0.4, sy = ty + 7.6;
  poly(ctx, [sx, sy, sx + 8, sy + 1.2, sx + 5.6, sy + 3, sx + 8, sy + 5, sx, sy + 4.4], M_BLACK);
  poly(ctx, [sx, sy + 1.6, sx + 6.6, sy + 2, sx + 5.8, sy + 3, sx, sy + 3.2], M_RED);
  for (let i = 0; i < 3; i++) poly(ctx, [sx + 1 + i * 2, sy + 1.4, sx + 2 + i * 2, sy + 1.4, sx + 1.5 + i * 2, sy + 2.6], M_WHITE);
}

function drawWeapon(ctx: Ctx, kind: UnitKind, tribe: TribeId, b: Body, k: number) {
  if (tribe === 'persia' && persiaWeapon(ctx, kind, b, k)) return;
  if (tribe === 'celts' && celtWeapon(ctx, kind, b, k)) return;
  if (tribe === 'aboriginal' && aboWeapon(ctx, kind, b, k)) return;
  const { x, y } = b.hand;
  if (tribe === 'inuit') {
    if (kind === 'harpooner') return inuitHarpoon(ctx, x, y, k);
    if (kind === 'swordsman') return inuitSword(ctx, x, y, k);
    if (kind === 'defender') return inuitSpear(ctx, x, y, k);
  }
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
    case 'slinger':
      incaSling(ctx, b, k);
      break;
    case 'swordsman':
    case 'shotelai':
      if (tribe === 'inca') {
        incaAxe(ctx, x, y, k);
        break;
      }
      if (tribe === 'ethiopia') {
        aksumSword(ctx, kind, x, y, k);
        break;
      }
      if (tribe === 'polynesia') {
        maoriWeapon(ctx, 'tewhatewha', x, y, k);
        break;
      }
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
      if (tribe === 'polynesia') {
        maoriWeapon(ctx, 'dart', x, y, k);
        break;
      }
      const wood = tribe === 'egypt' ? '#5a3b1e' : tribe === 'inuit' ? '#7a6248' : tribe === 'ethiopia' ? '#4a3020' : '#8a5a2b';
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
      if (tribe === 'inuit') { // a sinew-backed bow: twisted cords bound along the limbs and antler tips
        for (const t of [-0.75, -0.4, 0.4, 0.75]) { const ax = x + 1 * k + Math.cos(t * 1.4) * 9.6 * k, ay = y - 3 * k + Math.sin(t * 1.4) * 9.6 * k; line(ctx, ax - 0.5 * k, ay - 1 * k, ax + 0.5 * k, ay + 1 * k, I_SINEW, 0.9 * k); }
        for (const t of [t0, t1]) ellipse(ctx, t.x, t.y, 1.3 * k, 1.3 * k, I_BONE);
        line(ctx, x + 9.9 * k, y - 6 * k, x + 9.9 * k, y, I_RED, 1 * k);
      }
      line(ctx, t0.x, t0.y, x - 3.5 * k, y - 3 * k, '#f4efe0', 0.8 * k); // string, drawn back to the nock
      line(ctx, t1.x, t1.y, x - 3.5 * k, y - 3 * k, '#f4efe0', 0.8 * k);
      line(ctx, x + 9.9 * k, y - 6 * k, x + 9.9 * k, y, '#3a2a1a', 2.6 * k); // wrapped grip
      if (tribe === 'ethiopia') { // tibeb-coloured cord wraps on the grip and gilt limb tips
        for (const [yy, c] of [[-5.2, '#2f9a4a'], [-3.2, '#e8c21a'], [-1.2, '#c8372d']] as const) line(ctx, x + 8.8 * k, y + yy * k, x + 11 * k, y + yy * k, c, 0.9 * k);
        for (const t of [t0, t1]) ellipse(ctx, t.x, t.y, 0.7 * k, 0.7 * k, GOLD);
      }
      line(ctx, x - 3.5 * k, y - 3 * k, x + 8 * k, y - 3 * k, '#6b4424', 1.1 * k); // arrow shaft
      poly(ctx, [x + 8 * k, y - 4.6 * k, x + 10.8 * k, y - 3 * k, x + 8 * k, y - 1.4 * k], tribe === 'inuit' ? I_BONE : STEEL); // head
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
      if (tribe === 'inca') {
        incaSpear(ctx, x, y, k);
        break;
      }
      if (tribe === 'ethiopia') {
        aksumSpear(ctx, x, y, k, true);
        break;
      }
      if (tribe === 'polynesia') {
        maoriWeapon(ctx, 'taiaha', x, y, k);
        break;
      }
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
      if (tribe === 'inca') incaQuipu(ctx, x + 1.4 * k, y - 10 * k, k);
      if (tribe === 'ethiopia') { // a pilgrim's staff crowned with a gilded cross, a goatskin waterbag at the hip
        line(ctx, x + 2.6 * k, y - 12.4 * k, x + 2.8 * k, y - 20 * k, GOLD, 1.3 * k);
        line(ctx, x + 0.2 * k, y - 17 * k, x + 5.4 * k, y - 17.4 * k, GOLD, 1.3 * k);
        for (const [dx, dy] of [[2.8, -20.4], [0, -17], [5.6, -17.4], [2.7, -14.6]] as const) ellipse(ctx, x + dx * k, y + dy * k, 0.9 * k, 0.9 * k, shade(GOLD, 0.3));
        ellipse(ctx, x - 6.8 * k, y - 3 * k, 1.6 * k, 2.2 * k, '#8a5a33');
        line(ctx, x - 6.8 * k, y - 5.2 * k, x - 5.2 * k, y - 7.8 * k, '#2f9a4a', 0.6 * k);
        ellipse(ctx, x - 6.8 * k, y - 2.4 * k, 1.1 * k, 0.6 * k, '#e8c21a');
      }
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
    case 'inuit':
      inuitMelee(ctx, kind, x, y, k);
    case 'inca':
      incaMace(ctx, x, y, k, kind === 'giant');
      break;
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
      if (kind === 'giant') {
        drawWeapon(ctx, 'defender', tribe, { hand: { x, y }, off: { x, y }, top: 0 }, k);
        break;
      }
      maoriWeapon(ctx, 'mere', x, y, k);
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
    case 'ethiopia':
      if (kind === 'giant') aksumSword(ctx, 'shotelai', x, y, k * 0.85);
      else aksumSpear(ctx, x, y, k, false);
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
      poly(ctx, [x + 1.4 * k, y - 6.6 * k, x + 0 * k, y - 3.4 * k, x + 1.6 * k, y - 4.6 * k, x + 2.2 * k, y - 3 * k, x + 2.6 * k, y - 6.8 * k], '#f4efe0'); // cow-tail tassel under the blade
      line(ctx, x + 1.2 * k, y - 4.2 * k, x + 1.9 * k, y - 3.2 * k, '#2a1a10', 0.5 * k);
      ellipse(ctx, x - 0.6 * k, y + 3.2 * k, 0.9 * k, 0.9 * k, '#d9a441'); // brass butt cap
      break;
  }
  void kind;
}

// ---------------------------------------------------------------- Aksumite arms

const T_LIME = '#c9d43a'; // the Aksumite lime-gold
const T_DARK = '#6a7412';
const AK_G = '#2f9a4a', AK_Y = '#e8c21a', AK_R = '#c8372d';

/** A spear with a long narrow iron head, a gilded ferrule and three tibeb-coloured streamers. */
function aksumSpear(ctx: Ctx, x: number, y: number, k: number, long: boolean) {
  const top = long ? 18 : 13;
  line(ctx, x - 0.5 * k, y + 5 * k, x + 2 * k, y - top * k, WOOD, 1.7 * k);
  line(ctx, x - 0.9 * k, y + 5 * k, x + 1.6 * k, y - top * k, shade(WOOD, 0.35), 0.5 * k);
  ellipse(ctx, x - 0.5 * k, y + 5.2 * k, 1.2 * k, 0.9 * k, GOLD); // butt cap
  const hx = x + 2 * k, hy = y - top * k;
  poly(ctx, [hx + 0.2 * k, hy - 8 * k, hx - 1.6 * k, hy + 0.4 * k, hx + 0.2 * k, hy + 1.4 * k], shade(STEEL, 0.2));
  poly(ctx, [hx + 0.2 * k, hy - 8 * k, hx + 2 * k, hy + 0.4 * k, hx + 0.2 * k, hy + 1.4 * k], shade(STEEL, -0.25));
  line(ctx, hx + 0.2 * k, hy - 7 * k, hx + 0.2 * k, hy + 0.6 * k, shade(STEEL, -0.5), 0.5 * k); // mid-rib
  ellipse(ctx, hx + 0.1 * k, hy + 1.6 * k, 1.5 * k, 0.9 * k, GOLD); // gilded ferrule
  ellipse(ctx, hx + 0.1 * k, hy + 1.3 * k, 0.6 * k, 0.3 * k, shade(GOLD, 0.6));
  for (const [i, c] of [[0, AK_G], [1, AK_Y], [2, AK_R]] as const) { // streamers
    ctx.strokeStyle = c;
    ctx.lineWidth = 0.9 * k;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx + 0.1 * k, hy + 2.2 * k + i * 0.5 * k);
    ctx.quadraticCurveTo(hx - 2.4 * k, hy + (3.4 + i * 1.6) * k, hx - (4 + i * 0.6) * k, hy + (7 + i * 1.8) * k);
    ctx.stroke();
  }
}

/** The shotel: a blade that rises straight, sweeps out in a great curve and hooks back, so it can strike round a shield. */
function shotel(ctx: Ctx, x: number, y: number, k: number, gold: boolean) {
  // hilt: a wrapped grip, a disc guard and a round pommel
  line(ctx, x - 0.6 * k, y + 2.4 * k, x + 0.6 * k, y - 3 * k, '#3a2616', 1.9 * k);
  for (const [t, c] of [[0.2, AK_R], [0.5, AK_G], [0.8, AK_Y]] as const) line(ctx, x - 0.6 * k + 1.2 * k * t - 1 * k, y + 2.4 * k - 5.4 * k * t, x - 0.6 * k + 1.2 * k * t + 1 * k, y + 2.4 * k - 5.4 * k * t - 0.2 * k, c, 0.7 * k);
  ellipse(ctx, x - 0.9 * k, y + 3 * k, 1.3 * k, 1.3 * k, gold ? GOLD : BRONZE);
  ellipse(ctx, x - 1.2 * k, y + 2.7 * k, 0.5 * k, 0.5 * k, shade(GOLD, 0.6));
  ellipse(ctx, x + 0.7 * k, y - 3.4 * k, 2 * k, 1 * k, gold ? GOLD : BRONZE);
  // the blade in three arcs: a straight rise, the outward sweep, the hooked tip
  const seg = (x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, w: number) => {
    ctx.lineCap = 'round';
    ctx.strokeStyle = shade(STEEL, -0.28);
    ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.stroke();
    ctx.strokeStyle = shade(STEEL, 0.32);
    ctx.lineWidth = w * 0.4;
    ctx.beginPath(); ctx.moveTo(x0 - 0.3 * k, y0 - 0.1 * k); ctx.quadraticCurveTo(cx - 0.4 * k, cy - 0.2 * k, x1 - 0.3 * k, y1 - 0.3 * k); ctx.stroke();
  };
  seg(x + 0.7 * k, y - 4 * k, x + 0.3 * k, y - 9 * k, x + 2 * k, y - 12.6 * k, 2.4 * k);
  seg(x + 2 * k, y - 12.6 * k, x + 4.2 * k, y - 16.8 * k, x + 7.6 * k, y - 15.4 * k, 2.1 * k);
  seg(x + 7.6 * k, y - 15.4 * k, x + 9.6 * k, y - 14.4 * k, x + 8.4 * k, y - 11.4 * k, 1.3 * k);
  line(ctx, x + 4.6 * k, y - 15.2 * k, x + 5.8 * k, y - 15.2 * k, shade(STEEL, -0.55), 0.5 * k); // a nick on the inner edge
  line(ctx, x + 0.7 * k, y - 4.6 * k, x + 1.1 * k, y - 8 * k, shade(STEEL, -0.5), 0.4 * k); // fuller
}

function aksumSword(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  if (kind === 'shotelai') {
    shotel(ctx, x, y, k, true);
    line(ctx, x - 1.4 * k, y + 3.4 * k, x - 3 * k, y + 7.4 * k, AK_R, 0.8 * k); // a knotted cord and tassel on the pommel
    ellipse(ctx, x - 3.2 * k, y + 7.8 * k, 0.9 * k, 1.1 * k, T_LIME);
    return;
  }
  // the ordinary swordsman: a straight double-edged iron blade with a gilt hilt
  blade(ctx, x + 0.2 * k, y - 1 * k, x + 3 * k, y - 14 * k, 2.8 * k, STEEL);
  hilt(ctx, x + 0.2 * k, y - 1 * k, 0.2, -1, k, GOLD, '#2f5a1e');
  line(ctx, x + 0.9 * k, y - 4 * k, x + 2.4 * k, y - 11 * k, GOLD, 0.5 * k);
  line(ctx, x - 0.4 * k, y + 2.4 * k, x - 2 * k, y + 6.4 * k, AK_G, 0.8 * k);
  ellipse(ctx, x - 2.2 * k, y + 6.8 * k, 0.8 * k, 1 * k, AK_Y);
}


function drawShield(ctx: Ctx, tribe: TribeId, kind: UnitKind, x: number, y: number, k: number) {
  if (tribe === 'persia') return persiaShield(ctx, kind, x, y, k);
  if (tribe === 'celts') return celtShield(ctx, kind, x, y, k);
  if (tribe === 'aboriginal') return aboShield(ctx, kind, x, y, k);
  const T = TRIBES[tribe];
  const rivets = (cx: number, cy: number, rx: number, ry: number, n: number, color: string) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.3;
      ellipse(ctx, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, 0.45 * k, 0.45 * k, color);
    }
  };
  switch (tribe) {
    case 'inuit':
      inuitShieldFace(ctx, x, y, k);
    case 'inca':
      incaShield(ctx, x, y, k);
      break;
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
    case 'polynesia': {
      // no shield: a flax cloak hangs from the off arm, with a taniko hem and feather tufts
      poly(ctx, [x - 3.4 * k, y - 1 * k, x + 2 * k, y - 1 * k, x + 3.2 * k, y + 9 * k, x - 4.4 * k, y + 8 * k], '#22222a');
      poly(ctx, [x - 3.4 * k, y - 1 * k, x - 0.6 * k, y - 1 * k, x - 1 * k, y + 8.6 * k, x - 4.4 * k, y + 8 * k], '#33333d');
      for (const [fx, fy] of [[-2, 1.4], [0.4, 3.2], [-1.6, 4.6], [1.6, 0.6], [1.2, 5.6], [-3, 6]] as const) line(ctx, x + fx * k, y + fy * k, x + (fx + 0.8) * k, y + (fy + 1.2) * k, '#f4efe0', 0.55 * k); // feather flecks
      poly(ctx, [x - 4.4 * k, y + 8 * k, x + 3.2 * k, y + 9 * k, x + 3.1 * k, y + 7.4 * k, x - 4.3 * k, y + 6.4 * k], '#b3302a');
      for (let i = 0; i < 4; i++) ellipse(ctx, x - 3.4 * k + i * 2 * k, y + 7.3 * k + i * 0.25 * k, 0.5 * k, 0.5 * k, i % 2 ? '#f4efe0' : '#1a1a1e');
      for (let i = 0; i < 3; i++) poly(ctx, [x - 3.2 * k + i * 2.6 * k, y + 8.4 * k, x - 2 * k + i * 2.6 * k, y + 8.6 * k, x - 2.8 * k + i * 2.6 * k, y + 10 * k], '#f4efe0');
      break;
    }
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
      if (kind === 'hoplite') {
        poly(ctx, [x - 4 * k, y - 2 * k, x - 1 * k, y - 9 * k, x + 2 * k, y - 2 * k, x + 0.6 * k, y - 2 * k, x - 1 * k, y - 6 * k, x - 2.6 * k, y - 2 * k], '#f4efe0');
        line(ctx, x - 1 * k, y - 8.4 * k, x - 1 * k, y - 6.6 * k, shade(T.color, -0.3), 0.5 * k);
        ring(ctx, x - 1 * k, y - 5 * k, 4.4 * k, 4.9 * k, '#f4efe0', 0.5 * k); // a white inner ring round the lambda
        rivets(x - 1 * k, y - 5 * k, 5.6 * k, 6.2 * k, 10, shade(GOLD, 0.2)); // rim studs
      } else {
        // a sunburst, the Argead star: eight rays about a gilded disc
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + 0.2;
          line(ctx, x - 1 * k + Math.cos(a) * 1.4 * k, y - 5 * k + Math.sin(a) * 1.6 * k, x - 1 * k + Math.cos(a) * 4.4 * k, y - 5 * k + Math.sin(a) * 4.9 * k, '#f4efe0', 0.9 * k);
        }
        ellipse(ctx, x - 1 * k, y - 5 * k, 1.7 * k, 1.9 * k, GOLD);
        ellipse(ctx, x - 1.4 * k, y - 5.5 * k, 0.6 * k, 0.6 * k, shade(GOLD, 0.6));
      }
      ellipse(ctx, x - 1.6 * k, y - 8.4 * k, 1.3 * k, 1 * k, shade(BRONZE, 0.5)); // sheen
      break;
    case 'ethiopia': {
      // gasha: a round hide shield, cross-and-boss on its face, a studded rim and a fringe of tibeb-coloured tassels
      const sc = kind === 'defender' ? 1.06 : kind === 'warrior' ? 0.84 : 0.94;
      const cx = x - 1 * k, cy = y - 5.4 * k, rx = 5.4 * k * sc, ry = 6 * k * sc;
      const field = kind === 'defender' ? '#efe6cc' : kind === 'shotelai' ? '#f4efe0' : '#7a4a2a';
      ellipse(ctx, cx + 0.5 * k, cy + 0.5 * k, rx, ry, '#3a2616'); // shield thickness
      ellipse(ctx, cx, cy, rx, ry, '#5a3a22'); // the hide rim
      ellipse(ctx, cx, cy, rx * 0.86, ry * 0.86, field);
      ring(ctx, cx, cy, rx * 0.86, ry * 0.86, T_LIME, 1.1 * k); // lime-gold painted ring
      ring(ctx, cx, cy, rx * 0.68, ry * 0.68, shade(field, -0.3), 0.5 * k);
      if (kind !== 'warrior') { // a cross pattee reaching to the ring
        const arm = (dx: number, dy: number) => poly(ctx, [cx, cy, cx + dx * rx * 0.86 - dy * 0.9 * k, cy + dy * ry * 0.86 + dx * 0.9 * k, cx + dx * rx * 0.86 + dy * 0.9 * k, cy + dy * ry * 0.86 - dx * 0.9 * k], kind === 'defender' ? AK_R : AK_G);
        arm(0, -1); arm(0, 1); arm(-1, 0); arm(1, 0);
      } else for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; line(ctx, cx + Math.cos(a) * rx * 0.3, cy + Math.sin(a) * ry * 0.3, cx + Math.cos(a) * rx * 0.72, cy + Math.sin(a) * ry * 0.72, '#c9a45a', 0.5 * k); } // stitched hide panels
      ellipse(ctx, cx, cy, 1.9 * k, 2.1 * k, shade(GOLD, -0.2)); // the metal boss
      ellipse(ctx, cx, cy - 0.2 * k, 1.6 * k, 1.8 * k, GOLD);
      ellipse(ctx, cx - 0.5 * k, cy - 0.8 * k, 0.6 * k, 0.6 * k, shade(GOLD, 0.7));
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + 0.2; ellipse(ctx, cx + Math.cos(a) * rx * 0.94, cy + Math.sin(a) * ry * 0.94, 0.45 * k, 0.45 * k, shade(GOLD, 0.35)); } // rim studs
      ellipse(ctx, cx - 2.2 * k * sc, cy - 3 * k * sc, 1 * k, 1.5 * k, 'rgba(255,255,255,0.22)'); // sheen
      for (const [i, c] of [[0, AK_G], [1, AK_Y], [2, AK_R], [3, AK_G], [4, AK_Y]] as const) line(ctx, cx - 3 * k + i * 1.5 * k, cy + ry * 0.92, cx - 3.3 * k + i * 1.5 * k, cy + ry * 0.92 + 2.6 * k, c, 0.8 * k); // tassels
      break;
    }
    case 'zulu': {
      // isihlangu: a tall oval cowhide shield on a stick, stitched down the middle
      line(ctx, x - 1 * k, y + 4 * k, x - 1 * k, y - 18 * k, WOOD, 1 * k);
      const vet = kind === 'impi'; // the elite regiment carries the white war shield, younger warriors a dark red-brown one
      const hideC = vet ? '#f4efe0' : '#a85a36';
      ellipse(ctx, x - 1 * k, y - 7 * k, 4.2 * k, 8.4 * k, hideC);
      ring(ctx, x - 1 * k, y - 7 * k, 4.2 * k, 8.4 * k, '#8a5a33', 0.8 * k);
      for (const [ox, oy, r] of [[-2, -11, 1.8], [1, -5, 2.2], [-2.2, -2, 1.4], [0.8, -10.5, 1], [-1, -6, 0.9]]) ellipse(ctx, x + ox * k, y + oy * k, r * k, r * 1.2 * k, vet ? '#2a1a10' : '#f4efe0');
      ellipse(ctx, x - 2.6 * k, y - 11.6 * k, 0.9 * k, 1.6 * k, shade(hideC, 0.25)); // sheen on the hide
      line(ctx, x - 1 * k, y - 14 * k, x - 1 * k, y, '#8a5a33', 0.8 * k);
      for (let i = 0; i < 7; i++) line(ctx, x - 1.7 * k, y - 13 * k + i * 2 * k, x - 0.3 * k, y - 13 * k + i * 2 * k, '#5a3a22', 0.4 * k); // stitches
      poly(ctx, [x - 2.4 * k, y - 15.2 * k, x - 1 * k, y - 18.6 * k, x + 0.4 * k, y - 15.2 * k], '#3a2416'); // hide tuft
      for (const i of [-1, 0, 1]) line(ctx, x - 1 * k, y - 18.4 * k, x - 1 * k + i * 1.6 * k, y - 21.6 * k, i ? '#f4efe0' : '#c8372d', 0.7 * k); // feather plumes on the stick's tip
      break;
    }
  }
  void kind;
}

// ---------------------------------------------------------------- Persian arms and finery

const P_PINK = '#e0559c', P_DPINK = '#8c1f5a', P_TURQ = '#3fa9c9', P_DTURQ = '#1f7f9c', P_LTURQ = '#9fe6ee';
const P_CREAM = '#f4efe0', P_WICK = '#c9a262', P_DWICK = '#8a6a34', P_GILD = '#d9a93c', P_TROUSER = '#237b9b';

/** A winged sun disc: gold sun with layered spread wings and forked tail feathers. */
function wingedDisc(ctx: Ctx, x: number, y: number, s: number, wing = P_CREAM, gold = GOLD) {
  for (const sd of [-1, 1]) {
    poly(ctx, [x + sd * 1.4 * s, y - 1 * s, x + sd * 7.2 * s, y - 2.4 * s, x + sd * 6.4 * s, y - 0.8 * s, x + sd * 1.4 * s, y + 0.3 * s], wing);
    poly(ctx, [x + sd * 1.4 * s, y + 0.1 * s, x + sd * 6.2 * s, y - 0.6 * s, x + sd * 5.2 * s, y + 0.9 * s, x + sd * 1.4 * s, y + 1.3 * s], shade(wing, -0.18));
    poly(ctx, [x + sd * 1.4 * s, y + 1 * s, x + sd * 4.6 * s, y + 0.6 * s, x + sd * 3.8 * s, y + 2 * s, x + sd * 1.4 * s, y + 2.1 * s], shade(wing, -0.34));
  }
  poly(ctx, [x - 1.5 * s, y + 1.4 * s, x - 2.7 * s, y + 4.8 * s, x, y + 3.2 * s, x + 2.7 * s, y + 4.8 * s, x + 1.5 * s, y + 1.4 * s], shade(gold, -0.15));
  ellipse(ctx, x, y - 0.2 * s, 1.8 * s, 1.8 * s, gold);
  ellipse(ctx, x - 0.4 * s, y - 0.7 * s, 0.6 * s, 0.6 * s, shade(gold, 0.6));
  ring(ctx, x, y - 0.2 * s, 1.8 * s, 1.8 * s, shade(gold, -0.4), 0.4 * s);
}

/** A striding lion in profile (facing right when dir is 1): the royal beast of the Persian court. */
function lionMark(ctx: Ctx, x: number, y: number, s: number, color: string, dir = 1) {
  const X = (dx: number) => x + dir * dx * s, Y = (dy: number) => y + dy * s;
  const dk = shade(color, -0.3);
  for (const [a, b, c, d] of [[-3.4, 0.6, -4.2, 3.4], [-1.8, 0.9, -1.8, 3.6], [1.8, 0.9, 2.2, 3.6], [3.2, 0.5, 4.4, 3]] as const) line(ctx, X(a), Y(b), X(c), Y(d), dk, 1.2 * s);
  line(ctx, X(-4.2), Y(-1.2), X(-6), Y(-2.4), color, 0.9 * s);
  line(ctx, X(-6), Y(-2.4), X(-5.4), Y(-4.4), color, 0.9 * s);
  ellipse(ctx, X(-5.4), Y(-4.8), 0.9 * s, 1.1 * s, dk);
  ellipse(ctx, X(0), Y(-0.6), 4.6 * s, 2 * s, color);
  ellipse(ctx, X(3.7), Y(-2.3), 2.3 * s, 2.4 * s, dk);
  ellipse(ctx, X(4.7), Y(-1.9), 1.6 * s, 1.4 * s, color);
  ellipse(ctx, X(5.6), Y(-1.7), 0.5 * s, 0.4 * s, dk);
}

/** A golden pomegranate: the counterweight on an Immortal's spear and a symbol of plenty. */
function pomegranate(ctx: Ctx, x: number, y: number, r: number) {
  ellipse(ctx, x, y, r, r * 1.05, shade(P_GILD, -0.25));
  ellipse(ctx, x - r * 0.15, y - r * 0.12, r * 0.85, r * 0.9, P_GILD);
  ellipse(ctx, x - r * 0.4, y - r * 0.45, r * 0.34, r * 0.28, shade(P_GILD, 0.65));
  poly(ctx, [x - r * 0.5, y - r * 0.9, x - r * 0.35, y - r * 1.5, x, y - r * 1.05, x + r * 0.35, y - r * 1.5, x + r * 0.5, y - r * 0.9], shade(P_GILD, -0.2)); // the calyx crown
}

function persiaTorso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const mailed = kind === 'swordsman' || kind === 'immortal' || kind === 'knight' || kind === 'defender' || kind === 'giant';
  // a long kandys tunic: pleated skirt, a turquoise embroidered hem, rosette trim
  band(ctx, x, y, w, h, 0, 0.32, shade(P_PINK, -0.08));
  for (const u of [0.12, 0.28, 0.44, 0.6, 0.76, 0.9]) {
    faceQuad(ctx, 'R', x, y, w, h, u, u + 0.045, 0.1, 0.32, P_DPINK);
    faceQuad(ctx, 'L', x, y, w, h, u, u + 0.045, 0.1, 0.32, P_DPINK);
  }
  band(ctx, x, y, w, h, 0, 0.1, P_TURQ);
  for (const u of [0.06, 0.28, 0.5, 0.72, 0.92]) {
    faceQuad(ctx, 'R', x, y, w, h, u, u + 0.08, 0.03, 0.075, GOLD);
    faceQuad(ctx, 'L', x, y, w, h, u, u + 0.08, 0.03, 0.075, GOLD);
  }
  // a gold sash with a turquoise buckle and a tail hanging to the hem
  band(ctx, x, y, w, h, 0.3, 0.4, GOLD);
  faceQuad(ctx, 'R', x, y, w, h, 0.4, 0.6, 0.28, 0.42, P_TURQ);
  faceQuad(ctx, 'R', x, y, w, h, 0.46, 0.54, 0.32, 0.38, shade(GOLD, 0.5));
  faceQuad(ctx, 'R', x, y, w, h, 0.68, 0.8, 0.05, 0.3, P_TURQ);
  faceQuad(ctx, 'R', x, y, w, h, 0.68, 0.8, 0.05, 0.1, GOLD);
  if (!mailed) {
    // the chest: a turquoise placket, cream-and-gold rosettes
    faceQuad(ctx, 'R', x, y, w, h, 0.46, 0.54, 0.4, 0.92, P_TURQ);
    for (const u of [0.12, 0.7]) {
      faceQuad(ctx, 'R', x, y, w, h, u, u + 0.18, 0.58, 0.74, P_CREAM);
      faceQuad(ctx, 'R', x, y, w, h, u + 0.06, u + 0.12, 0.62, 0.7, GOLD);
    }
    faceQuad(ctx, 'L', x, y, w, h, 0.3, 0.5, 0.58, 0.74, P_CREAM);
    faceQuad(ctx, 'L', x, y, w, h, 0.37, 0.43, 0.62, 0.7, GOLD);
    faceQuad(ctx, 'R', x, y, w, h, 0.05, 0.4, 0.42, 0.5, P_DPINK); // a darker lozenge border
    faceQuad(ctx, 'R', x, y, w, h, 0.6, 0.95, 0.42, 0.5, P_DPINK);
  } else if (kind === 'giant') {
    // the royal robe: a gold breastplate blazoned with the winged sun
    band(ctx, x, y, w, h, 0.4, 0.94, P_GILD);
    for (const v of [0.46, 0.66, 0.86]) band(ctx, x, y, w, h, v, v + 0.025, shade(P_GILD, -0.45));
    faceQuad(ctx, 'R', x, y, w, h, 0.1, 0.9, 0.66, 0.72, P_CREAM); // the wings
    faceQuad(ctx, 'R', x, y, w, h, 0.22, 0.78, 0.58, 0.64, shade(P_CREAM, -0.2));
    faceQuad(ctx, 'R', x, y, w, h, 0.4, 0.6, 0.55, 0.8, GOLD);
    faceQuad(ctx, 'R', x, y, w, h, 0.45, 0.55, 0.6, 0.72, P_PINK);
    faceQuad(ctx, 'R', x, y, w, h, 0.4, 0.6, 0.44, 0.56, shade(P_CREAM, -0.1)); // tail feathers
    faceQuad(ctx, 'L', x, y, w, h, 0.2, 0.8, 0.6, 0.68, P_TURQ);
    for (const u of [0.2, 0.5, 0.8]) faceQuad(ctx, 'L', x, y, w, h, u, u + 0.06, 0.48, 0.56, P_CREAM);
  } else {
    // scale armour: rows of overlapping scales, each row a shade apart, seams offset row to row
    const rows = kind === 'defender' ? 3 : 5;
    const r0 = 0.94 - rows * 0.1;
    for (let i = 0; i < rows; i++) {
      const v0 = r0 + i * 0.1;
      const c = kind === 'immortal' ? (i % 2 ? P_TURQ : '#e6c15a') : kind === 'knight' ? (i % 2 ? '#aab4c2' : '#c7d0dc') : (i % 2 ? '#c99a3a' : P_GILD);
      band(ctx, x, y, w, h, v0, v0 + 0.1, c);
      band(ctx, x, y, w, h, v0, v0 + 0.025, shade(c, -0.45));
      for (let j = 0; j < 5; j++) {
        const u = (i % 2 ? 0.1 : 0) + j * 0.2;
        if (u + 0.02 > 1) continue;
        faceQuad(ctx, 'R', x, y, w, h, u, u + 0.02, v0, v0 + 0.1, shade(c, -0.4));
        faceQuad(ctx, 'L', x, y, w, h, u, u + 0.02, v0, v0 + 0.1, shade(c, -0.4));
      }
    }
    if (kind === 'immortal') { // a pomegranate blazon at the breast
      faceQuad(ctx, 'R', x, y, w, h, 0.4, 0.6, 0.58, 0.8, P_DPINK);
      faceQuad(ctx, 'R', x, y, w, h, 0.45, 0.55, 0.62, 0.74, GOLD);
    }
    if (kind === 'defender') faceQuad(ctx, 'R', x, y, w, h, 0.05, 0.95, 0.4, 0.44, P_DPINK); // a pink surcoat shows over the belly
  }
  // the torc: a twisted gold collar with turquoise terminals
  band(ctx, x, y, w, h, 0.92, 1, GOLD);
  faceQuad(ctx, 'R', x, y, w, h, 0.03, 0.14, 0.88, 1, P_TURQ);
  faceQuad(ctx, 'R', x, y, w, h, 0.86, 0.97, 0.88, 1, P_TURQ);
  for (const u of [0.24, 0.42, 0.6, 0.78]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.06, 0.93, 0.99, shade(GOLD, 0.45));
}

/** Striped trousers (anaxyrides), a gold ankle cuff and, on the armoured ranks, cloth over the generic greave. */
function persiaLeg(ctx: Ctx, f: 'L' | 'R', x: number, y: number, k: number, heavy: boolean, kind: UnitKind) {
  const W = 3.6 * k, H = 5.2 * k;
  if (heavy) faceQuad(ctx, f, x, y, W, H, 0.02, 0.98, 0.2, 0.9, P_TROUSER);
  faceQuad(ctx, f, x, y, W, H, 0.2, 0.32, 0.26, 0.92, P_PINK);
  faceQuad(ctx, f, x, y, W, H, 0.68, 0.8, 0.26, 0.92, P_PINK);
  faceQuad(ctx, f, x, y, W, H, 0.4, 0.5, 0.26, 0.92, shade(P_TROUSER, 0.22));
  faceQuad(ctx, f, x, y, W, H, 0, 1, 0.2, 0.27, GOLD); // ankle cuff
  if (kind === 'immortal' || kind === 'giant' || kind === 'knight') faceQuad(ctx, f, x, y, W, H, 0.3, 0.7, 0.6, 0.72, GOLD); // gilded knee plaque
}

function persiaFace(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const hair = '#241810', curl = '#6a4c38';
  const noble = kind === 'giant' || kind === 'swordsman' || kind === 'immortal' || kind === 'knight' || kind === 'defender';
  // a heavy, upturned moustache
  faceQuad(ctx, 'R', x, y, w, h, 0.16, 0.86, 0.2, 0.27, hair);
  faceQuad(ctx, 'R', x, y, w, h, 0.05, 0.2, 0.2, 0.33, hair);
  faceQuad(ctx, 'R', x, y, w, h, 0.82, 0.95, 0.2, 0.33, hair);
  // sideburns and the beard along the jaw
  faceQuad(ctx, 'R', x, y, w, h, 0.9, 1, 0.2, 0.55, hair);
  faceQuad(ctx, 'R', x, y, w, h, 0, 1, 0, 0.16, hair);
  faceQuad(ctx, 'L', x, y, w, h, 0.5, 1, 0, 0.2, hair);
  // tiers of curled beard: each tier a row of ringlets, narrower and longer for the nobles
  const tiers = noble ? 3 : 1;
  for (let t = 0; t < tiers; t++) {
    const v1 = -t * 0.12, v0 = v1 - 0.12;
    const inset = t * 0.06;
    const n = 5 - Math.floor(t * 0.7);
    for (let j = 0; j < n; j++) {
      const u0 = inset + (j * (1 - inset * 2)) / n, u1 = u0 + (1 - inset * 2) / n - 0.02;
      faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1 + 0.02, j % 2 ? hair : shade(hair, 0.16));
      faceQuad(ctx, 'R', x, y, w, h, u0 + 0.02, u0 + 0.07, v1 - 0.06, v1 - 0.01, curl); // each ringlet catching the light
    }
    if (t === tiers - 1 && noble) for (const u of [0.18, 0.5, 0.78]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.06, v0 - 0.04, v0 + 0.02, GOLD); // gold bead ties
  }
  if (noble) faceQuad(ctx, 'L', x, y, w, h, 0.55, 1, -0.12, 0.04, hair);
  // dark kohl on the lids and a gold drop earring
  faceQuad(ctx, 'R', x, y, w, h, 0.1, 0.2, 0.5, 0.56, DARK); // kohl wings at the outer corners of the eyes
  faceQuad(ctx, 'R', x, y, w, h, 0.82, 0.94, 0.5, 0.56, DARK);
  faceQuad(ctx, 'L', x, y, w, h, 0.66, 0.84, 0.24, 0.36, GOLD);
  faceQuad(ctx, 'L', x, y, w, h, 0.72, 0.78, 0.1, 0.24, GOLD);
  faceQuad(ctx, 'L', x, y, w, h, 0.7, 0.8, 0.06, 0.12, P_TURQ);
}

function persiaHeadgear(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  const hb = top + 10.5 * k;
  const hq = (face: 'L' | 'R', u0: number, u1: number, v0: number, v1: number, c: string, extra = 1) => faceQuad(ctx, face, x, hb, hw + extra * k, 10.5 * k, u0, u1, v0, v1, c);
  /** Studs and a gold trim along a brow band whose box sits at (x, cy) with height h. */
  const bandTrim = (cy: number, bw: number, h: number) => {
    faceQuad(ctx, 'R', x, cy, bw, h, 0, 1, 0, 0.14, GOLD);
    faceQuad(ctx, 'L', x, cy, bw, h, 0, 1, 0, 0.14, GOLD);
    for (const u of [0.16, 0.46, 0.76]) faceQuad(ctx, 'R', x, cy, bw, h, u, u + 0.1, 0.4, 0.7, GOLD);
    faceQuad(ctx, 'L', x, cy, bw, h, 0.3, 0.4, 0.4, 0.7, GOLD);
  };
  const tail = (dy = 0, c = P_TURQ) => { // a cloth tail streaming down the back
    poly(ctx, [x - 5.2 * k, top + (3 + dy) * k, x - 9.8 * k, top + (8.6 + dy) * k, x - 8.4 * k, top + (13 + dy) * k, x - 4.8 * k, top + (9 + dy) * k], c);
    poly(ctx, [x - 5.2 * k, top + (3 + dy) * k, x - 8.6 * k, top + (8.2 + dy) * k, x - 8.4 * k, top + (13 + dy) * k, x - 5.4 * k, top + (8 + dy) * k], shade(c, -0.25));
    line(ctx, x - 9.8 * k, top + (8.6 + dy) * k, x - 8.4 * k, top + (13 + dy) * k, GOLD, 0.6 * k);
  };
  if (kind === 'giant') {
    // the king's crenellated crown: a gold cylinder with turquoise inlay set on a jewelled brow-ring, merlons on top and the winged sun on its face
    tail(0, P_PINK);
    box(ctx, x, top + 4.4 * k, hw + 2 * k, 4.4 * k, GOLD);
    bandTrim(top + 4.4 * k, hw + 2 * k, 4.4 * k);
    faceQuad(ctx, 'R', x, top + 4.4 * k, hw + 2 * k, 4.4 * k, 0.42, 0.58, 0.3, 0.8, P_TURQ);
    box(ctx, x, top, 9.4 * k, 9 * k, P_GILD);
    for (const u of [0.12, 0.72]) faceQuad(ctx, 'R', x, top, 9.4 * k, 9 * k, u, u + 0.16, 0.08, 0.92, P_TURQ);
    faceQuad(ctx, 'L', x, top, 9.4 * k, 9 * k, 0.4, 0.56, 0.08, 0.92, P_TURQ);
    band(ctx, x, top, 9.4 * k, 9 * k, 0.9, 1, shade(P_GILD, 0.3));
    for (const [mx, my] of [[0, -11.2], [-3.6, -9], [3.6, -9], [0, -6.8]] as const) box(ctx, x + mx * k, top + my * k, 1.9 * k, 2.2 * k, GOLD);
    wingedDisc(ctx, x + 2.3 * k, top - 3.6 * k, 0.36 * k, P_CREAM, GOLD);
    return;
  }
  if (kind === 'immortal' || kind === 'defender') {
    // a tall fluted felt tiara on a turquoise band: pink for the line troops, cream and gold for the King's Immortals
    const im = kind === 'immortal';
    const cap = im ? P_CREAM : shade(P_PINK, 0.12);
    tail(0.4, im ? P_PINK : P_TURQ);
    box(ctx, x, top + 3.8 * k, hw + 1.2 * k, 3.2 * k, P_TURQ);
    bandTrim(top + 3.8 * k, hw + 1.2 * k, 3.2 * k);
    box(ctx, x, top + 0.6 * k, hw * 0.86, 10 * k, cap);
    for (const u of [0.18, 0.4, 0.62, 0.84]) faceQuad(ctx, 'R', x, top + 0.6 * k, hw * 0.86, 10 * k, u, u + 0.06, 0.06, 0.94, im ? '#e2b64a' : P_DPINK);
    for (const u of [0.15, 0.4, 0.65, 0.9]) faceQuad(ctx, 'L', x, top + 0.6 * k, hw * 0.86, 10 * k, u, u + 0.06, 0.06, 0.94, im ? '#e2b64a' : P_DPINK);
    box(ctx, x, top - 8.6 * k, hw * 0.98, 1.6 * k, GOLD); // the flared, gilded crown-rim
    if (im) for (const [mx, my] of [[0, -12.2], [-3.8, -10], [3.8, -10], [0, -7.9]] as const) box(ctx, x + mx * k, top + my * k, 1.6 * k, 1.8 * k, GOLD); // little merlons
    if (im) {
      poly(ctx, [x - 3.4 * k, top - 0.4 * k, x + 3.4 * k, top - 3.8 * k, x + 4.6 * k, top - 2.6 * k, x - 2.6 * k, top + 1.2 * k], P_PINK); // a sash wound across the tiara
      line(ctx, x - 3.4 * k, top - 0.2 * k, x + 4 * k, top - 3.4 * k, GOLD, 0.5 * k);
    }
    return;
  }
  if (kind === 'swordsman' || kind === 'knight') {
    // a gilded (or steel) domed helm with a turquoise horsehair plume, cheek plates and a scale aventail
    const kn = kind === 'knight';
    const m = kn ? '#c7d0dc' : P_GILD;
    const ax = x - 0.4 * k, hgt = kn ? 1.3 : 1, ay = top - 7.6 * k * hgt;
    const plume = kn ? P_PINK : P_TURQ;
    poly(ctx, [ax, ay, ax - 3.6 * k, ay + 0.4 * k, ax - 8.4 * k, ay + 4.6 * k, ax - 8.6 * k, ay + 11 * k, ax - 5 * k, ay + 6.2 * k, ax - 2.2 * k, ay + 3.4 * k], plume);
    poly(ctx, [ax, ay, ax - 3.6 * k, ay + 0.4 * k, ax - 6 * k, ay + 2.6 * k, ax - 2.4 * k, ay + 2.4 * k], shade(plume, 0.3));
    for (const t of [0.3, 0.55, 0.8]) line(ctx, ax - 2 * k - t * 5 * k, ay + 2 * k + t * 2 * k, ax - 4.4 * k - t * 3.4 * k, ay + 4 * k + t * 7 * k, shade(plume, -0.35), 0.4 * k);
    box(ctx, x, top + 3.8 * k, hw + 1.2 * k, 4.6 * k, m);
    const dome = [x - 5.6 * k, top - 0.6 * k, x - 5.2 * k, top - 3.4 * k * hgt, x - 3.2 * k, top - 5.8 * k * hgt, ax, ay, x + 3.2 * k, top - 5.6 * k * hgt, x + 5.2 * k, top - 3.2 * k * hgt, x + 5.6 * k, top - 0.6 * k, x, top + 2.4 * k];
    poly(ctx, dome, shade(m, 0.12));
    poly(ctx, [ax, ay, x + 3.2 * k, top - 5.6 * k * hgt, x + 5.2 * k, top - 3.2 * k * hgt, x + 5.6 * k, top - 0.6 * k, x, top + 2.4 * k], shade(m, -0.26));
    line(ctx, ax, ay, x - 0.2 * k, top + 2.4 * k, GOLD, 0.8 * k); // ridge
    line(ctx, ax, ay, ax, ay - 2.6 * k, GOLD, 0.9 * k);
    ellipse(ctx, ax, ay - 3 * k, 1.1 * k, 1.1 * k, GOLD);
    faceQuad(ctx, 'R', x, top + 3.8 * k, hw + 1.2 * k, 4.6 * k, 0, 1, 0, 0.2, GOLD);
    faceQuad(ctx, 'L', x, top + 3.8 * k, hw + 1.2 * k, 4.6 * k, 0, 1, 0, 0.2, GOLD);
    faceQuad(ctx, 'R', x, top + 3.8 * k, hw + 1.2 * k, 4.6 * k, 0.42, 0.58, 0.4, 0.85, P_TURQ);
    for (const u of [0.15, 0.78]) faceQuad(ctx, 'R', x, top + 3.8 * k, hw + 1.2 * k, 4.6 * k, u, u + 0.08, 0.5, 0.7, shade(m, 0.5)); // rivets
    hq('R', 0.84, 1, 0.3, 0.72, m); // cheek plates
    hq('L', 0.88, 1, 0.3, 0.72, m);
    hq('L', 0, 0.55, 0.26, 0.6, shade(m, -0.15)); // the aventail of scales across the neck
    for (const v of [0.34, 0.44, 0.54]) hq('L', 0, 0.55, v, v + 0.025, shade(m, -0.5));
    return;
  }
  if (kind === 'archer' || kind === 'horsearcher') {
    // a Scythian pointed hood, its tip bent back, with a long neck-cloth and gold-trimmed edge
    tail(-0.6, P_TURQ);
    box(ctx, x, top + 3.4 * k, hw + 0.8 * k, 3.2 * k, P_PINK);
    bandTrim(top + 3.4 * k, hw + 0.8 * k, 3.2 * k);
    poly(ctx, [x - 5.4 * k, top + 0.2 * k, x - 4.6 * k, top - 6.6 * k, x - 9.6 * k, top - 11.4 * k, x - 2.4 * k, top - 9.6 * k, x + 1.6 * k, top - 4.6 * k, x + 5.4 * k, top + 0.2 * k, x, top + 3.1 * k], P_TURQ);
    poly(ctx, [x - 2.4 * k, top - 9.6 * k, x + 1.6 * k, top - 4.6 * k, x + 5.4 * k, top + 0.2 * k, x, top + 3.1 * k, x - 0.8 * k, top - 1 * k], shade(P_TURQ, -0.26));
    line(ctx, x - 4.6 * k, top - 6.6 * k, x - 9.6 * k, top - 11.4 * k, P_PINK, 0.9 * k); // pink piping along the crest
    line(ctx, x - 5.4 * k, top + 0.2 * k, x - 4.6 * k, top - 6.6 * k, P_PINK, 0.9 * k);
    ellipse(ctx, x - 9.6 * k, top - 11.4 * k, 0.8 * k, 0.8 * k, GOLD);
    hq('L', 0, 0.5, 0.3, 0.78, P_DTURQ, 0.8); // the hood covers the ear
    hq('R', 0.9, 1, 0.4, 0.75, P_TURQ, 0.8);
    return;
  }
  if (kind === 'explorer') {
    // a courier's wrapped cream turban with a pink cloth wound through and a feathered gold brooch
    tail(0, P_PINK);
    box(ctx, x, top + 4.6 * k, hw + 1.6 * k, 6 * k, P_CREAM);
    for (const v of [0.3, 0.66]) {
      faceQuad(ctx, 'R', x, top + 4.6 * k, hw + 1.6 * k, 6 * k, 0, 1, v, v + 0.08, shade(P_CREAM, -0.18));
      faceQuad(ctx, 'L', x, top + 4.6 * k, hw + 1.6 * k, 6 * k, 0, 1, v, v + 0.08, shade(P_CREAM, -0.18));
    }
    facePoly(ctx, 'R', x, top + 4.6 * k, hw + 1.6 * k, 6 * k, [[0.05, 0], [0.3, 0], [0.98, 1], [0.72, 1]], P_PINK);
    facePoly(ctx, 'L', x, top + 4.6 * k, hw + 1.6 * k, 6 * k, [[0.2, 0], [0.5, 0], [0.98, 1], [0.7, 1]], P_PINK);
    ellipse(ctx, x, top - 1.6 * k, 5.6 * k, 3.1 * k, P_CREAM);
    ellipse(ctx, x - 1.2 * k, top - 2.4 * k, 3.4 * k, 1.5 * k, shade(P_CREAM, 0.4));
    line(ctx, x - 4.6 * k, top - 1.2 * k, x + 3.6 * k, top - 3 * k, P_PINK, 0.9 * k);
    faceQuad(ctx, 'R', x, top + 4.6 * k, hw + 1.6 * k, 6 * k, 0.4, 0.6, 0.35, 0.8, GOLD);
    faceQuad(ctx, 'R', x, top + 4.6 * k, hw + 1.6 * k, 6 * k, 0.46, 0.54, 0.45, 0.7, P_TURQ);
    feather(ctx, x + 1 * k, top + 1.6 * k, x + 2.4 * k, top - 8 * k, 1.1 * k, P_PINK, P_CREAM);
    return;
  }
  // the warrior's soft Median cap: felt, pink, its tip flopped forward, a turquoise band and a neck-cloth
  tail(0, P_TURQ);
  box(ctx, x, top + 3.8 * k, hw + 1.2 * k, 3.4 * k, P_TURQ);
  bandTrim(top + 3.8 * k, hw + 1.2 * k, 3.4 * k);
  poly(ctx, [x - 5.6 * k, top + 0.4 * k, x - 4.4 * k, top - 5 * k, x + 0.6 * k, top - 9.6 * k, x + 7.6 * k, top - 6.6 * k, x + 3.8 * k, top - 5.4 * k, x + 5.6 * k, top + 0.4 * k, x, top + 3.45 * k], shade(P_PINK, 0.06));
  poly(ctx, [x, top + 3.45 * k, x + 2 * k, top - 6.6 * k, x + 0.6 * k, top - 9.6 * k, x + 7.6 * k, top - 6.6 * k, x + 3.8 * k, top - 5.4 * k, x + 5.6 * k, top + 0.4 * k], shade(P_PINK, -0.24));
  line(ctx, x + 3.8 * k, top - 5.4 * k, x + 2 * k, top - 7.6 * k, shade(P_PINK, -0.5), 0.6 * k); // the fold of the drooping tip
  ellipse(ctx, x + 7.6 * k, top - 6.6 * k, 0.9 * k, 0.9 * k, GOLD); // a gold bead on the tip
  for (const [dx, dy] of [[-2.6, -3], [-1, -6.6], [-3.4, 0]] as const) ellipse(ctx, x + dx * k, top + dy * k, 0.55 * k, 0.55 * k, P_CREAM); // embroidered dots
  hq('L', 0, 0.3, 0.3, 0.7, P_DTURQ); // a turned-down flap over the ear
}

/** The Persian arms: returns true when it drew the weapon (or its stand-in) for this unit. */
function persiaWeapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  switch (kind) {
    case 'warrior': {
      // the akinakes: a short curved blade with a gold guard and a ram's-head pommel, its lobed scabbard slung behind
      poly(ctx, [x - 4.6 * k, y + 6.4 * k, x - 3.6 * k, y + 5.4 * k, x - 8.6 * k, y + 9.6 * k, x - 9.8 * k, y + 9.2 * k], P_GILD);
      poly(ctx, [x - 4.6 * k, y + 6.4 * k, x - 4.1 * k, y + 5.9 * k, x - 9.2 * k, y + 9.4 * k, x - 9.8 * k, y + 9.2 * k], shade(P_GILD, -0.3));
      ellipse(ctx, x - 9.2 * k, y + 9.6 * k, 1.1 * k, 0.9 * k, P_TURQ);
      ellipse(ctx, x - 6.4 * k, y + 7.4 * k, 0.6 * k, 0.6 * k, P_TURQ);
      line(ctx, x, y + 1.6 * k, x + 0.4 * k, y - 2.2 * k, '#3a2416', 1.9 * k);
      for (const t of [0, 0.4, 0.8]) line(ctx, x - 0.8 * k + t * 0.4 * k, y + 1.2 * k - t * 3 * k, x + 1 * k + t * 0.4 * k, y + 0.8 * k - t * 3 * k, GOLD, 0.5 * k);
      curvedBlade(ctx, x + 0.4 * k, y - 2.6 * k, x + 1.6 * k, y - 8.4 * k, x + 5 * k, y - 12.6 * k, 2.7 * k, '#dfe7f0', k);
      line(ctx, x - 2 * k, y - 2.6 * k, x + 2.8 * k, y - 2.6 * k, GOLD, 1.4 * k);
      ellipse(ctx, x - 2 * k, y - 2.6 * k, 0.9 * k, 0.9 * k, P_TURQ);
      ellipse(ctx, x + 2.8 * k, y - 2.6 * k, 0.9 * k, 0.9 * k, P_TURQ);
      ellipse(ctx, x - 0.1 * k, y + 2.6 * k, 1.4 * k, 1.2 * k, GOLD);
      ring(ctx, x - 1.6 * k, y + 3.2 * k, 0.8 * k, 0.8 * k, GOLD, 0.5 * k); // the curling ram horns
      ring(ctx, x + 1.4 * k, y + 3.2 * k, 0.8 * k, 0.8 * k, GOLD, 0.5 * k);
      return true;
    }
    case 'swordsman': {
      // a long curved sabre with a lion-head pommel and a pink-and-turquoise tassel
      curvedBlade(ctx, x + 0.4 * k, y - 2.6 * k, x + 0.4 * k, y - 11 * k, x + 6.4 * k, y - 17.6 * k, 2.8 * k, '#e2e9f2', k);
      line(ctx, x, y + 1.8 * k, x + 0.4 * k, y - 2.2 * k, '#3a2416', 2 * k);
      for (const t of [0, 0.4, 0.8]) line(ctx, x - 0.8 * k, y + 1.2 * k - t * 3 * k, x + 1 * k, y + 0.8 * k - t * 3 * k, GOLD, 0.5 * k);
      line(ctx, x - 2.4 * k, y - 2.6 * k, x + 3 * k, y - 2.6 * k, GOLD, 1.5 * k);
      for (const dx of [-2.4, 3]) ellipse(ctx, x + dx * k, y - 2.6 * k, 0.9 * k, 0.9 * k, P_TURQ);
      ellipse(ctx, x - 0.1 * k, y + 2.6 * k, 1.5 * k, 1.4 * k, GOLD); // the lion head
      poly(ctx, [x - 1.6 * k, y + 1.8 * k, x - 1.4 * k, y + 0.6 * k, x - 0.6 * k, y + 1.6 * k], shade(GOLD, -0.2));
      poly(ctx, [x + 1.4 * k, y + 1.8 * k, x + 1.2 * k, y + 0.6 * k, x + 0.6 * k, y + 1.6 * k], shade(GOLD, -0.2));
      ellipse(ctx, x + 0.5 * k, y + 2.4 * k, 0.4 * k, 0.4 * k, P_TURQ);
      line(ctx, x - 0.2 * k, y + 3.6 * k, x - 1.6 * k, y + 7.4 * k, P_PINK, 0.9 * k);
      line(ctx, x + 0.2 * k, y + 3.6 * k, x + 0.4 * k, y + 7.6 * k, P_TURQ, 0.9 * k);
      return true;
    }
    case 'giant': {
      // a great gilded mace crowned with a lion's head, its shaft wound in gold wire
      line(ctx, x - 0.4 * k, y + 5 * k, x + 2.4 * k, y - 15 * k, '#6b4424', 2.2 * k);
      line(ctx, x - 0.8 * k, y + 5 * k, x + 2 * k, y - 15 * k, shade('#6b4424', 0.4), 0.6 * k);
      for (let i = 0; i < 6; i++) line(ctx, x - 0.2 * k + i * 0.5 * k - 1.2 * k, y + 3.6 * k - i * 3.2 * k, x - 0.2 * k + i * 0.5 * k + 1.2 * k, y + 3 * k - i * 3.2 * k, GOLD, 0.5 * k);
      pomegranate(ctx, x - 0.4 * k, y + 5.8 * k, 1.5 * k);
      const hx = x + 2.6 * k, hy = y - 19 * k;
      ellipse(ctx, hx, hy, 5.4 * k, 5.4 * k, shade(P_GILD, -0.3)); // mane
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; poly(ctx, [hx + Math.cos(a - 0.3) * 4.6 * k, hy + Math.sin(a - 0.3) * 4.6 * k, hx + Math.cos(a) * 6.6 * k, hy + Math.sin(a) * 6.6 * k, hx + Math.cos(a + 0.3) * 4.6 * k, hy + Math.sin(a + 0.3) * 4.6 * k], i % 2 ? P_GILD : shade(P_GILD, -0.2)); }
      ellipse(ctx, hx, hy, 3.6 * k, 3.8 * k, P_GILD);
      ellipse(ctx, hx - 0.8 * k, hy - 1 * k, 1.6 * k, 1.4 * k, shade(P_GILD, 0.5));
      poly(ctx, [hx - 3 * k, hy - 2.6 * k, hx - 2.4 * k, hy - 4.8 * k, hx - 1 * k, hy - 3 * k], P_GILD); // ears
      poly(ctx, [hx + 3 * k, hy - 2.6 * k, hx + 2.4 * k, hy - 4.8 * k, hx + 1 * k, hy - 3 * k], P_GILD);
      for (const ex of [-1.4, 1.4]) { ellipse(ctx, hx + ex * k, hy - 0.6 * k, 0.8 * k, 0.7 * k, P_TURQ); ellipse(ctx, hx + ex * k, hy - 0.6 * k, 0.3 * k, 0.3 * k, DARK); }
      ellipse(ctx, hx, hy + 1 * k, 0.8 * k, 0.6 * k, DARK); // nose
      line(ctx, hx, hy + 1.4 * k, hx, hy + 2.6 * k, DARK, 0.4 * k);
      for (const dx of [-1, 1]) poly(ctx, [hx + dx * 0.6 * k, hy + 2.4 * k, hx + dx * 1.2 * k, hy + 3.8 * k, hx + dx * 1.7 * k, hy + 2.4 * k], P_CREAM); // fangs
      return true;
    }
    case 'archer':
    case 'horsearcher': {
      // a recurved composite bow of horn and sinew: gilded tips, a turquoise-wrapped grip, a pink-fletched arrow
      const wood = '#7a4a24';
      const path = () => {
        ctx.beginPath();
        ctx.moveTo(x + 8.2 * k, y - 12.8 * k);
        ctx.bezierCurveTo(x + 5.4 * k, y - 10.8 * k, x + 10.6 * k, y - 8.6 * k, x + 10.2 * k, y - 5.4 * k);
        ctx.lineTo(x + 10.2 * k, y - 0.6 * k);
        ctx.bezierCurveTo(x + 10.6 * k, y + 2.6 * k, x + 5.4 * k, y + 4.8 * k, x + 8.2 * k, y + 6.8 * k);
      };
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      path();
      ctx.strokeStyle = ink(shade(wood, -0.2));
      ctx.lineWidth = 2.1 * k;
      ctx.stroke();
      path();
      ctx.strokeStyle = ink(shade(wood, 0.35));
      ctx.lineWidth = 0.7 * k;
      ctx.stroke();
      for (const [tx, ty] of [[8.2, -12.8], [8.2, 6.8]] as const) { ellipse(ctx, x + tx * k, y + ty * k, 1.1 * k, 1.1 * k, GOLD); ellipse(ctx, x + tx * k, y + ty * k, 0.5 * k, 0.5 * k, P_TURQ); }
      line(ctx, x + 8.2 * k, y - 12.8 * k, x - 3.5 * k, y - 3 * k, P_CREAM, 0.7 * k); // the string, drawn to the nock
      line(ctx, x + 8.2 * k, y + 6.8 * k, x - 3.5 * k, y - 3 * k, P_CREAM, 0.7 * k);
      line(ctx, x + 10.2 * k, y - 5.4 * k, x + 10.2 * k, y - 0.6 * k, P_TURQ, 2.7 * k);
      for (const t of [-4.8, -3.4, -2, -0.8]) line(ctx, x + 9.2 * k, y + t * k, x + 11.2 * k, y + (t - 0.5) * k, GOLD, 0.4 * k);
      line(ctx, x - 3.5 * k, y - 3 * k, x + 8 * k, y - 3 * k, '#6b4424', 1.1 * k);
      poly(ctx, [x + 8 * k, y - 4.8 * k, x + 11.6 * k, y - 3 * k, x + 8 * k, y - 1.2 * k], STEEL);
      line(ctx, x + 8 * k, y - 3 * k, x + 10.6 * k, y - 3 * k, shade(STEEL, -0.35), 0.5 * k);
      poly(ctx, [x - 3.6 * k, y - 3 * k, x - 6.6 * k, y - 5.2 * k, x - 4.2 * k, y - 3 * k], P_PINK);
      poly(ctx, [x - 3.6 * k, y - 3 * k, x - 6.6 * k, y - 0.8 * k, x - 4.2 * k, y - 3 * k], P_DPINK);
      return true;
    }
    case 'defender':
    case 'immortal': {
      // a long spear: a leaf head in bright steel, a gold socket, a tassel, and a butt-spike or a golden pomegranate
      const im = kind === 'immortal';
      line(ctx, x + 1 * k, y + 5 * k, x + 2 * k, y - 18 * k, '#6b4424', 1.8 * k);
      line(ctx, x + 0.6 * k, y + 5 * k, x + 1.6 * k, y - 18 * k, shade('#6b4424', 0.35), 0.5 * k);
      for (const t of [0.05, 0.4, 0.75]) line(ctx, x + 0.2 * k + t * 0.6 * k, y + 3 * k - t * 19 * k, x + 2 * k + t * 0.6 * k, y + 2.6 * k - t * 19 * k, GOLD, 0.6 * k);
      if (im) pomegranate(ctx, x + 0.9 * k, y + 6.6 * k, 1.9 * k);
      else { poly(ctx, [x + 0.4 * k, y + 5 * k, x + 1.6 * k, y + 5 * k, x + 1 * k, y + 8 * k], shade(STEEL, -0.2)); ellipse(ctx, x + 1 * k, y + 5 * k, 1.2 * k, 0.8 * k, P_GILD); }
      poly(ctx, [x + 2 * k, y - 23.5 * k, x + 0 * k, y - 17.5 * k, x + 2 * k, y - 16.5 * k], shade(STEEL, 0.28));
      poly(ctx, [x + 2 * k, y - 23.5 * k, x + 4 * k, y - 17.5 * k, x + 2 * k, y - 16.5 * k], shade(STEEL, -0.22));
      line(ctx, x + 2 * k, y - 23 * k, x + 2 * k, y - 17 * k, shade(STEEL, -0.45), 0.5 * k);
      ellipse(ctx, x + 1.95 * k, y - 16.4 * k, 1.6 * k, 1 * k, GOLD);
      poly(ctx, [x + 1.4 * k, y - 16 * k, x + 0.2 * k, y - 11.4 * k, x + 1.4 * k, y - 12.4 * k, x + 2.4 * k, y - 11 * k, x + 2.6 * k, y - 16 * k], P_PINK);
      poly(ctx, [x + 1.8 * k, y - 15.6 * k, x + 2.8 * k, y - 10.6 * k, x + 3.6 * k, y - 15.6 * k], P_TURQ);
      if (im) { // a pennant with the winged sun
        poly(ctx, [x + 2.4 * k, y - 14.4 * k, x + 9 * k, y - 13.4 * k, x + 7.2 * k, y - 11.6 * k, x + 9 * k, y - 9.8 * k, x + 2.2 * k, y - 10.4 * k], P_TURQ);
        wingedDisc(ctx, x + 5.2 * k, y - 12.2 * k, 0.32 * k, P_CREAM, GOLD);
      }
      return true;
    }
    case 'explorer': {
      // a herald's staff with a gilded winged-sun finial and a pink pennant; a waterskin at the hip
      line(ctx, x + 1 * k, y + 6 * k, x + 2.5 * k, y - 12 * k, '#7a4a24', 1.6 * k);
      line(ctx, x + 0.6 * k, y + 6 * k, x + 2.1 * k, y - 12 * k, shade('#7a4a24', 0.4), 0.5 * k);
      for (const t of [0.3, 0.6]) line(ctx, x + 1 * k + t * 1.5 * k - 1 * k, y + 6 * k - t * 18 * k, x + 1 * k + t * 1.5 * k + 1 * k, y + 6 * k - t * 18 * k, GOLD, 0.6 * k);
      wingedDisc(ctx, x + 2.7 * k, y - 15.4 * k, 0.5 * k, P_CREAM, GOLD);
      line(ctx, x + 2 * k, y - 8 * k, x + 4.5 * k, y - 7 * k, P_CREAM, 0.7 * k);
      poly(ctx, [x + 4.5 * k, y - 7 * k, x + 9 * k, y - 8.4 * k, x + 7.6 * k, y - 6.6 * k, x + 9 * k, y - 4.6 * k, x + 4.4 * k, y - 5.6 * k], P_PINK);
      lionMark(ctx, x + 6.8 * k, y - 6.2 * k, 0.32 * k, GOLD);
      ellipse(ctx, x - 6.8 * k, y - 3 * k, 1.5 * k, 2 * k, '#8a5a2b');
      line(ctx, x - 6.8 * k, y - 5 * k, x - 5.2 * k, y - 7.6 * k, P_TURQ, 0.6 * k);
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------- Celtic dress, arms and ornament

const CG = '#3f7a3a', CGD = '#2a5a2c', CR = '#b02e28', CY = '#e2bb4c', CW = '#2f56a8', CL = '#efe2b8', CI = '#a3abb4', CLE = '#6b4424', CT = '#b07a3a';

/** Checked cloth on one side of a box: a ground colour, broad bands both ways, thin pinstripes and darker squares where the broad bands cross. */
function tartan(ctx: Ctx, f: 'L' | 'R', cx: number, cy: number, w: number, h: number, u0: number, u1: number, v0: number, v1: number, base: string, a: string, b: string) {
  const q = (p0: number, p1: number, r0: number, r1: number, c: string) =>
    faceQuad(ctx, f, cx, cy, w, h, u0 + (u1 - u0) * p0, u0 + (u1 - u0) * p1, v0 + (v1 - v0) * r0, v0 + (v1 - v0) * r1, c);
  q(0, 1, 0, 1, base);
  const wa = mix(base, a, 0.6), wb = mix(base, b, 0.7), cross = mix(base, a, 0.9);
  for (const [s, e] of [[0.08, 0.28], [0.6, 0.8]]) q(0, 1, s, e, wa);
  for (const [s, e] of [[0.08, 0.28], [0.6, 0.8]]) q(s, e, 0, 1, wa);
  for (const s of [0.4, 0.9]) { q(0, 1, s, s + 0.06, wb); q(s, s + 0.06, 0, 1, wb); }
  for (const [s, e] of [[0.08, 0.28], [0.6, 0.8]]) for (const [r, t] of [[0.08, 0.28], [0.6, 0.8]]) q(s, e, r, t, cross);
}

/** The triskele: three spiral arms turning about one point. */
function triskele(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string, w: number) {
  ctx.strokeStyle = ink(color);
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
    const cx = x + Math.cos(a) * rx * 0.5, cy = y + Math.sin(a) * ry * 0.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.5, ry * 0.5, 0, a + Math.PI, a + Math.PI * 2.55);
    ctx.stroke();
  }
}

/** A row of spikes stiffened with lime and swept back from the crown: red at the root, pale straw at the tips. */
function limeSpikes(ctx: Ctx, x: number, top: number, k: number, n: number, h: number, hair: string, lean = 1.6) {
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const bx = x - 5 * k + t * 10 * k, by = top + (pass ? 0.9 : -0.5) * k;
    const hh = h * (0.72 + 0.28 * Math.sin(i * 2.3 + 1 + pass)) * (1 - Math.abs(t - 0.45) * 0.35);
    const tx = bx - lean * k - (1 - t) * 0.8 * k, ty = by - hh * k;
    const c = pass ? CL : shade(CL, -0.22);
    poly(ctx, [bx - 1.35 * k, by, tx, ty, bx + 1.35 * k, by], c);
    const f = pass ? 0.26 : 0.22;
    poly(ctx, [bx - 1.35 * k, by, bx + 1.35 * k, by, bx + 1.35 * k + (tx - bx - 1.35 * k) * f, by + (ty - by) * f, bx - 1.35 * k + (tx - bx + 1.35 * k) * f, by + (ty - by) * f], pass ? hair : shade(hair, -0.2));
  }
}

function celtTorso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const k = w / 10;
  const F = (f: 'L' | 'R', u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, f, x, y, w, h, u0, u1, v0, v1, c);
  if (kind === 'explorer') {
    // a druid's white robe: a green hem, a gold-clasped sash, oak-leaf trim at the neck and a sickle at the hip
    band(ctx, x, y, w, h, 0, 0.1, CG);
    for (let i = 0; i < 5; i++) { F('R', 0.05 + i * 0.2, 0.15 + i * 0.2, 0.1, 0.18, CGD); F('L', 0.05 + i * 0.2, 0.15 + i * 0.2, 0.1, 0.18, CGD); }
    for (const u of [0.2, 0.55, 0.85]) F('R', u, u + 0.05, 0.2, 0.6, '#cfc8ae'); // folds
    band(ctx, x, y, w, h, 0.5, 0.6, CG);
    F('R', 0.42, 0.58, 0.48, 0.62, GOLD);
    band(ctx, x, y, w, h, 0.84, 0.94, CG);
    for (const u of [0.1, 0.3, 0.5, 0.7, 0.9]) F('R', u, u + 0.08, 0.86, 0.96, '#5fae4a');
    ellipse(ctx, x - 3.6 * k, y - 2.2 * k, 2 * k, 1.6 * k, GOLD); // the sickle of the mistletoe
    ellipse(ctx, x - 3.6 * k, y - 1.8 * k, 1.2 * k, 1 * k, '#cfc8ae');
    return;
  }
  const mail = kind === 'swordsman' || kind === 'knight' || kind === 'giant' || kind === 'defender';
  // the tartan tunic and its fringed hem
  for (const f of ['L', 'R'] as const) tartan(ctx, f, x, y, w, h, 0, 1, 0, 1, CT, CG, CR);
  for (let i = 0; i < 6; i++) { F('R', 0.02 + i * 0.16, 0.1 + i * 0.16, 0, 0.07, i % 2 ? CR : CG); if (i < 4) F('L', 0.02 + i * 0.25, 0.12 + i * 0.25, 0, 0.07, i % 2 ? CR : CG); }
  if (mail) {
    // a ring-mail shirt: dark rows of links with pale glints, and a scalloped hem over the tunic skirt
    for (const f of ['L', 'R'] as const) F(f, 0, 1, 0.42, 1, mix(CI, '#5a616a', 0.25));
    for (const v of [0.5, 0.6, 0.7, 0.8, 0.9]) band(ctx, x, y, w, h, v, v + 0.035, '#4f565f');
    for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
      const u = 0.08 + c * 0.24 + (r % 2 ? 0.12 : 0), v = 0.47 + r * 0.1;
      F('R', u, u + 0.07, v, v + 0.04, '#e4e9ee');
      if (c < 3) F('L', u + 0.02, u + 0.09, v, v + 0.04, '#e4e9ee');
    }
    for (let i = 0; i < 5; i++) { F('R', 0.02 + i * 0.2, 0.16 + i * 0.2, 0.36, 0.44, i % 2 ? '#7e858e' : '#9aa2ab'); F('L', 0.02 + i * 0.2, 0.16 + i * 0.2, 0.36, 0.44, i % 2 ? '#7e858e' : '#9aa2ab'); }
  }
  // belt with a bronze plate; the swordsmen wear a chain of ring links for the scabbard
  band(ctx, x, y, w, h, 0.3, 0.4, CLE);
  F('R', 0.4, 0.6, 0.29, 0.41, BRONZE);
  F('R', 0.45, 0.55, 0.32, 0.38, CR);
  if (kind === 'swordsman' || kind === 'knight') F('L', 0.1, 0.9, 0.3, 0.34, GOLD);
  if (kind === 'giant') { // studded leather baldrics crossed over the chest
    facePoly(ctx, 'R', x, y, w, h, [[0.02, 0.98], [0.24, 0.98], [0.98, 0.44], [0.78, 0.42]], CLE);
    facePoly(ctx, 'R', x, y, w, h, [[0.74, 0.98], [0.96, 0.98], [0.3, 0.44], [0.1, 0.44]], CLE);
    for (const t of [0.2, 0.42, 0.64, 0.86]) F('R', 0.1 + t * 0.7, 0.16 + t * 0.7, 0.9 - t * 0.44, 0.94 - t * 0.44, GOLD);
    F('R', 0.42, 0.58, 0.62, 0.78, GOLD); // where the straps cross
    band(ctx, x, y, w, h, 0.84, 1, '#6a4a2a'); // boar-hide mantle
    for (let i = 0; i < 6; i++) F(i % 2 ? 'L' : 'R', (i % 3) * 0.32 + 0.04, (i % 3) * 0.32 + 0.22, 0.74, 0.86, '#3a2616');
  }
  // the gold torc about the neck, its two knobbed ends meeting at the throat
  band(ctx, x, y, w, h, 0.78, 0.9, GOLD);
  F('R', 0, 1, 0.84, 0.88, shade(GOLD, 0.45));
  F('L', 0, 1, 0.78, 0.81, shade(GOLD, -0.25));
  ellipse(ctx, x - 0.9 * k, y + w / 4 - h * 0.86, 0.9 * k, 0.9 * k, shade(GOLD, 0.35));
  ellipse(ctx, x + 0.9 * k, y + w / 4 - h * 0.86, 0.9 * k, 0.9 * k, GOLD);
  if (kind === 'knight' || kind === 'swordsman' || kind === 'giant') F('R', 0.8, 0.94, 0.62, 0.74, GOLD); // a penannular brooch pinning the cloak
}

/** Bronze bands on the arms; the sleeves themselves are cut from the same checked wool. */
function celtSleeve(ctx: Ctx, cx: number, cy: number, k: number, kind: UnitKind, heavy: boolean, back: boolean) {
  const A = (v0: number, v1: number, c: string) => faceQuad(ctx, 'R', cx, cy, 2.8 * k, 7 * k, 0, 1, v0, v1, c);
  if (kind === 'explorer') { A(0.05, 0.16, CG); return; }
  if (!heavy) {
    A(0.3, 0.36, CG);
    A(0.52, 0.58, CR);
  }
  A(0.13, 0.25, BRONZE); // wrist torc-bracelet
  A(0.15, 0.19, shade(BRONZE, 0.5));
  if (!back || heavy) { A(0.6, 0.72, BRONZE); A(0.66, 0.7, shade(BRONZE, 0.5)); } // armlet
}

function celtFace(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const hair = LOOK.celts.hair;
  const F = (f: 'L' | 'R', u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, f, x, y, w, h, u0, u1, v0, v1, c);
  const druid = kind === 'explorer';
  const mc = druid ? '#efece2' : hair;
  // a long drooping moustache: a bar beneath the nose and two ends hanging below the lip
  F('R', 0.2, 0.8, 0.2, 0.29, mc);
  F('R', 0.14, 0.24, -0.02, 0.26, mc);
  F('R', 0.76, 0.86, -0.02, 0.26, mc);
  F('R', 0.15, 0.22, -0.1, -0.02, shade(mc, -0.2));
  F('R', 0.78, 0.85, -0.1, -0.02, shade(mc, -0.2));
  F('L', 0.62, 1, 0.1, 0.3, mc);
  F('R', 0.3, 0.7, 0.29, 0.31, shade(mc, -0.3)); // shadow under the nose
  if (druid) {
    F('R', 0.02, 0.98, -0.42, 0.14, mc); // a long white beard
    F('L', 0.3, 1, -0.3, 0.14, mc);
    for (const u of [0.22, 0.42, 0.62, 0.8]) F('R', u, u + 0.03, -0.4, 0.08, '#cfc8ae');
    F('R', 0.14, 0.86, 0.72, 0.78, '#efece2'); // bushy white brows
    return;
  }
  if (kind === 'defender' || kind === 'swordsman' || kind === 'knight' || kind === 'giant') {
    F('R', 0.08, 0.92, -0.02, 0.14, hair); // a short red beard
    F('L', 0.5, 1, 0, 0.16, hair);
  }
  if (kind === 'giant') { // a braided beard tied with bronze
    F('R', 0.3, 0.7, -0.4, -0.02, shade(hair, 0.12));
    for (const v of [-0.14, -0.28]) F('R', 0.3, 0.7, v, v + 0.04, BRONZE);
    for (const u of [0.42, 0.55]) F('R', u, u + 0.03, -0.4, -0.02, shade(hair, -0.3));
  }
  if (kind === 'clansman') { // woad war-paint: cheek bars, a spiralling brow and a striped chin
    for (const [a, b] of [[0.04, 0.3], [0.7, 0.96]]) { F('R', a, b, 0.4, 0.48, CW); F('R', a + 0.04, b - 0.04, 0.3, 0.36, CW); }
    F('R', 0.06, 0.16, 0.54, 0.66, CW);
    F('R', 0.84, 0.94, 0.54, 0.66, CW);
    F('R', 0.12, 0.88, 0.8, 0.86, CW);
    F('L', 0.5, 0.9, 0.4, 0.46, CW);
  } else if (kind === 'warrior' || kind === 'rider') {
    F('R', 0.7, 0.96, 0.4, 0.47, CW); // one blue bar across the cheek
    F('L', 0.55, 0.85, 0.4, 0.45, CW);
  } else if (kind === 'archer') {
    for (const [u, v] of [[0.08, 0.36], [0.2, 0.32], [0.72, 0.36], [0.84, 0.32], [0.14, 0.42]] as const) F('R', u, u + 0.04, v, v + 0.03, shade(LOOK.celts.skin, -0.28)); // freckles
  }
}

/** A bronze helm: Montefortino (a peaked dome with a button), Coolus (a rounded bowl with a brim), crested, or the great bird-crowned iron helm. */
function celtHelm(ctx: Ctx, x: number, top: number, k: number, hw: number, style: 'monte' | 'coolus' | 'crest' | 'bird') {
  const metal = style === 'bird' ? '#8d949c' : BRONZE;
  const HW = hw + 1.2 * k;
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, top + 10.5 * k, HW, 10.5 * k, u0, u1, v0, v1, c);
  const L = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'L', x, top + 10.5 * k, HW, 10.5 * k, u0, u1, v0, v1, c);
  // the flared neck guard behind, then the bowl of the helm
  poly(ctx, [x - 5.4 * k, top + 2.6 * k, x - 8.6 * k, top + 9.6 * k, x - 4.6 * k, top + 10.4 * k, x - 2.4 * k, top + 6 * k], shade(metal, -0.32));
  poly(ctx, [x - 5.4 * k, top + 2.6 * k, x - 8.6 * k, top + 9.6 * k, x - 7.6 * k, top + 9.8 * k, x - 4.8 * k, top + 3.4 * k], shade(metal, -0.1));
  box(ctx, x, top + 3.6 * k, HW, 4 * k, metal, metal);
  const cy = top - 0.4 * k, rx = HW / 2, ry = style === 'monte' ? 5.2 * k : style === 'coolus' ? 4.6 * k : 4.2 * k;
  const dome = (side: -1 | 1, c: string) => {
    const pts: number[] = [];
    for (let i = 0; i <= 10; i++) { const a = Math.PI * 1.5 + side * (i / 10) * (Math.PI / 2); pts.push(x + Math.cos(a) * rx, cy + Math.sin(a) * ry); }
    poly(ctx, [...pts, x, cy + rx / 2], c);
  };
  dome(-1, shade(metal, 0.2));
  dome(1, shade(metal, -0.16));
  poly(ctx, [x - 2.6 * k, cy - ry * 0.7, x - 4 * k, cy - ry * 0.2, x - 3 * k, cy - ry * 0.05, x - 1 * k, cy - ry * 0.6], shade(metal, 0.55)); // glint
  R(0, 1, 0.78, 1, shade(metal, 0.12));
  R(0, 1, 0.74, 0.79, shade(metal, -0.45)); // the brim's shadow
  L(0, 1, 0.78, 1, shade(metal, -0.05));
  for (const u of [0.1, 0.3, 0.5, 0.7, 0.9]) R(u, u + 0.06, 0.84, 0.92, GOLD); // rivets along the rim
  R(0.02, 0.18, 0.2, 0.72, metal); // cheek plates hang down each side of the face
  R(0.82, 0.98, 0.2, 0.72, metal);
  R(0.02, 0.18, 0.2, 0.25, shade(metal, -0.35));
  R(0.82, 0.98, 0.2, 0.25, shade(metal, -0.35));
  R(0.06, 0.14, 0.5, 0.62, style === 'bird' ? BRONZE : GOLD);
  R(0.86, 0.94, 0.5, 0.62, style === 'bird' ? BRONZE : GOLD);
  L(0.3, 1, 0.16, 0.72, shade(metal, -0.12)); // ear-guard on the far side
  L(0.5, 0.8, 0.34, 0.5, shade(metal, -0.4));
  const ax = x, ay = cy - ry;
  if (style === 'monte') { // the peaked button
    poly(ctx, [ax - 1.5 * k, ay + 1.2 * k, ax, ay - 3 * k, ax + 1.5 * k, ay + 1.2 * k], shade(metal, -0.1));
    poly(ctx, [ax - 1.5 * k, ay + 1.2 * k, ax, ay - 3 * k, ax - 0.2 * k, ay + 1.2 * k], shade(metal, 0.3));
    ellipse(ctx, ax, ay - 3.4 * k, 1.1 * k, 1.1 * k, GOLD);
  }
  if (style === 'crest' || style === 'coolus') { // a bronze boss and a red horsehair plume
    ellipse(ctx, ax, ay + 0.6 * k, 1.4 * k, 1 * k, GOLD);
    if (style === 'crest') {
      poly(ctx, [ax - 1 * k, ay + 0.6 * k, ax - 5.5 * k, ay - 3 * k, ax - 7 * k, ay + 3 * k, ax - 4 * k, ay + 0.6 * k], CR);
      poly(ctx, [ax - 1 * k, ay + 0.6 * k, ax - 0.4 * k, ay - 7 * k, ax + 2.4 * k, ay - 4.6 * k, ax + 1.6 * k, ay + 0.6 * k], shade(CR, 0.2));
      poly(ctx, [ax - 1 * k, ay + 0.6 * k, ax - 0.4 * k, ay - 7 * k, ax - 4.6 * k, ay - 5 * k, ax - 5.5 * k, ay - 3 * k], shade(CR, -0.18));
      line(ctx, ax + 0.4 * k, ay - 5.6 * k, ax + 0.6 * k, ay + 0.2 * k, shade(CR, -0.4), 0.5 * k);
    } else poly(ctx, [ax - 1 * k, ay + 0.6 * k, ax - 0.4 * k, ay - 3.4 * k, ax + 1 * k, ay + 0.6 * k], CR);
  }
  if (style === 'bird') { // a great raven with spread wings crouches on the crown
    const dk = '#23262e';
    poly(ctx, [ax - 1 * k, ay + 0.8 * k, ax - 8 * k, ay - 2 * k, ax - 9.6 * k, ay + 0.6 * k, ax - 5.6 * k, ay + 1.6 * k], shade(dk, 0.1));
    poly(ctx, [ax + 1 * k, ay + 0.8 * k, ax + 8 * k, ay - 2.4 * k, ax + 9.6 * k, ay, ax + 5.6 * k, ay + 1.8 * k], shade(dk, 0.2));
    for (const s of [-1, 1]) for (const t of [0.35, 0.6, 0.85]) line(ctx, ax + s * 2 * k, ay + 0.6 * k, ax + s * (2 + 7.6 * t) * k, ay - (2 - t * 2.2) * k + 2 * k, dk, 0.5 * k);
    ellipse(ctx, ax, ay - 0.6 * k, 2.6 * k, 1.9 * k, dk);
    ellipse(ctx, ax - 0.6 * k, ay - 1.1 * k, 1.5 * k, 0.9 * k, '#3a3f4a');
    poly(ctx, [ax + 1.6 * k, ay - 2 * k, ax + 4.8 * k, ay - 1.2 * k, ax + 1.8 * k, ay - 0.2 * k], GOLD); // beak
    ellipse(ctx, ax + 1.4 * k, ay - 1.6 * k, 0.4 * k, 0.4 * k, GOLD);
    band(ctx, x, top + 3.6 * k, HW, 4 * k, 0.6, 0.85, GOLD);
    R(0.42, 0.58, 0.6, 0.84, BRONZE);
  }
}

function celtHeadgear(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  const hair = LOOK.celts.hair;
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, top + 10.5 * k, hw, 10.5 * k, u0, u1, v0, v1, c);
  const L = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'L', x, top + 10.5 * k, hw, 10.5 * k, u0, u1, v0, v1, c);
  const longHair = () => {
    poly(ctx, [x - 5.4 * k, top + 2 * k, x - 7.6 * k, top + 8 * k, x - 8 * k, top + 17 * k, x - 5.4 * k, top + 16 * k, x - 4.4 * k, top + 7 * k], shade(hair, -0.12));
    poly(ctx, [x - 5.4 * k, top + 2 * k, x - 4.4 * k, top + 7 * k, x - 5.4 * k, top + 16 * k, x - 3.4 * k, top + 12 * k, x - 3.2 * k, top + 5 * k], hair);
    for (const v of [11, 13.4, 15.8]) line(ctx, x - 7.6 * k, top + v * k, x - 5.4 * k, top + (v + 0.3) * k, shade(hair, -0.4), 0.5 * k); // the plait's crossings
    ellipse(ctx, x - 6.6 * k, top + 17 * k, 0.9 * k, 0.9 * k, BRONZE); // bronze bead
  };
  switch (kind) {
    case 'defender': celtHelm(ctx, x, top, k, hw, 'monte'); break;
    case 'swordsman': celtHelm(ctx, x, top, k, hw, 'coolus'); break;
    case 'knight': celtHelm(ctx, x, top, k, hw, 'crest'); break;
    case 'giant': celtHelm(ctx, x, top, k, hw, 'bird'); break;
    case 'explorer': {
      // a hooded druid crowned with oak and mistletoe
      const hc = '#e4dfc8', hd = '#b9b294';
      poly(ctx, [x - 5.6 * k, top + 2 * k, x - 7.4 * k, top + 12 * k, x - 3 * k, top + 13.6 * k, x - 3 * k, top + 4 * k], hd);
      box(ctx, x, top + 3.8 * k, hw + 1.6 * k, 5.8 * k, hc, hc);
      poly(ctx, [x - 1 * k, top - 1.2 * k, x - 5.4 * k, top - 3.6 * k, x - 7.6 * k, top + 0.6 * k, x - 5 * k, top + 2.2 * k], hc);
      poly(ctx, [x - 1 * k, top - 1.2 * k, x - 5.4 * k, top - 3.6 * k, x - 4.6 * k, top - 1.6 * k, x - 2 * k, top + 0.2 * k], shade(hc, 0.18));
      R(0.02, 0.98, 0.9, 1, hd);
      band(ctx, x, top + 3.8 * k, hw + 1.6 * k, 5.8 * k, 0, 0.1, hd);
      for (let i = 0; i < 5; i++) ellipse(ctx, x - 4.4 * k + i * 2.2 * k, top + 4.2 * k + Math.abs(i - 2) * 0.35 * k, 1.5 * k, 0.9 * k, i % 2 ? '#5fae4a' : CGD);
      for (const dx of [-2.2, 0.1, 2.4]) ellipse(ctx, x + dx * k, top + 3.6 * k + Math.abs(dx) * 0.2 * k, 0.55 * k, 0.55 * k, '#f4efe0'); // mistletoe berries
      break;
    }
    case 'archer': {
      longHair();
      limeSpikes(ctx, x, top, k, 5, 3.2, hair, 1);
      R(0.02, 0.98, 0.82, 0.9, CG); // a woollen headband
      L(0, 1, 0.82, 0.9, CGD);
      R(0.42, 0.58, 0.8, 0.92, BRONZE);
      feather(ctx, x - 3 * k, top + 1.4 * k, x - 5.4 * k, top - 5 * k, 1.3 * k, CR, CL);
      break;
    }
    case 'rider': {
      longHair();
      limeSpikes(ctx, x, top, k, 6, 4.4, hair, 2.2);
      R(0.02, 0.98, 0.84, 0.91, BRONZE);
      L(0, 1, 0.84, 0.91, shade(BRONZE, -0.3));
      R(0.42, 0.58, 0.82, 0.94, CR);
      break;
    }
    case 'clansman': {
      limeSpikes(ctx, x, top, k, 9, 8.4, hair, 2.4);
      R(0.02, 0.98, 0.9, 1, hair);
      R(0.02, 0.98, 0.78, 0.86, BRONZE);
      L(0, 1, 0.78, 0.86, shade(BRONZE, -0.3));
      for (const u of [0.12, 0.36, 0.6, 0.84]) R(u, u + 0.06, 0.8, 0.84, shade(BRONZE, 0.5));
      R(0.42, 0.58, 0.74, 0.9, CR);
      break;
    }
    default: {
      // warrior: bare head, hair limed into spikes, a red fillet
      limeSpikes(ctx, x, top, k, 7, 5.8, hair, 1.8);
      R(0.02, 0.98, 0.9, 1, hair);
      R(0.02, 0.98, 0.8, 0.87, CR);
      L(0, 1, 0.8, 0.87, shade(CR, -0.3));
      break;
    }
  }
}

/** A La Tene scroll: a spiral winding inward. */
function spiral(ctx: Ctx, x: number, y: number, r: number, dir: number, color: string, w: number, start = 0) {
  ctx.strokeStyle = ink(color);
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 22; i++) {
    const t = i / 22, a = start + dir * t * Math.PI * 3.2, rr = r * (1 - t * 0.82);
    if (i) ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.stroke();
}

function celtShield(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  const dots = (cx: number, cy: number, rx: number, ry: number, n: number, c: string) => {
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + 0.3; ellipse(ctx, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, 0.45 * k, 0.45 * k, c); }
  };
  if (kind === 'clansman' || kind === 'defender' || kind === 'swordsman') {
    // a tall oval shield with a long bronze spine, its face painted and its rim studded
    const cx = x - 1.4 * k, cy = y - 6 * k, rx = kind === 'clansman' ? 4.6 * k : 4.4 * k, ry = 8.4 * k;
    const field = kind === 'clansman' ? CR : kind === 'defender' ? CG : CT;
    const paint = kind === 'defender' ? CY : kind === 'swordsman' ? CR : CL;
    ellipse(ctx, cx, cy, rx + 0.9 * k, ry + 0.9 * k, shade(CLE, -0.2));
    ellipse(ctx, cx, cy, rx, ry, field);
    ctx.save();
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.clip();
    poly(ctx, [cx, cy - ry, cx + rx, cy - ry, cx + rx, cy + ry, cx, cy + ry], shade(field, -0.2)); // the shaded half
    ctx.restore();
    ring(ctx, cx, cy, rx, ry, BRONZE, 0.9 * k);
    ctx.save();
    ctx.setLineDash([1 * k, 1 * k]);
    ring(ctx, cx, cy, rx - 0.9 * k, ry - 0.9 * k, paint, 0.5 * k);
    ctx.restore();
    // the spine
    poly(ctx, [cx - 0.7 * k, cy - ry + 0.6 * k, cx + 0.7 * k, cy - ry + 0.6 * k, cx + 0.9 * k, cy + ry - 0.6 * k, cx - 0.9 * k, cy + ry - 0.6 * k], BRONZE);
    poly(ctx, [cx - 0.7 * k, cy - ry + 0.6 * k, cx - 0.1 * k, cy - ry + 0.6 * k, cx - 0.3 * k, cy + ry - 0.6 * k, cx - 0.9 * k, cy + ry - 0.6 * k], shade(BRONZE, 0.35));
    if (kind === 'clansman') { // a white boar, bristled and tusked, charging above the boss
      const bx = cx, by = cy - 4.6 * k;
      ellipse(ctx, bx - 0.6 * k, by, 3 * k, 1.7 * k, CL);
      poly(ctx, [bx + 1.8 * k, by - 2 * k, bx + 4.4 * k, by - 0.2 * k, bx + 1.8 * k, by + 1 * k], CL);
      poly(ctx, [bx + 3.6 * k, by + 0.2 * k, bx + 4.6 * k, by - 1.4 * k, bx + 3.2 * k, by - 0.4 * k], '#ffffff');
      for (const dx of [-2, -0.8, 0.6, 1.6]) line(ctx, bx + dx * k, by + 0.6 * k, bx + (dx - 0.3) * k, by + 2.6 * k, CL, 0.7 * k);
      for (let i = 0; i < 5; i++) line(ctx, bx - 3 * k + i * 1.3 * k, by - 1.2 * k, bx - 2.6 * k + i * 1.3 * k, by - 2.6 * k, CL, 0.5 * k); // the bristling ridge
      ellipse(ctx, bx + 2.6 * k, by - 1 * k, 0.45 * k, 0.45 * k, '#101010');
      spiral(ctx, cx - 2.2 * k, cy + 4.6 * k, 1.7 * k, 1, CL, 0.5 * k);
      spiral(ctx, cx + 2.2 * k, cy + 4.6 * k, 1.7 * k, -1, CL, 0.5 * k);
    } else {
      for (const oy of [-4.6, 4.8]) { spiral(ctx, cx - 2.3 * k, cy + oy * k, 1.8 * k, 1, paint, 0.6 * k); spiral(ctx, cx + 2.3 * k, cy + oy * k, 1.8 * k, -1, paint, 0.6 * k); }
    }
    ellipse(ctx, cx, cy - 0.6 * k, 1.8 * k, 2.4 * k, BRONZE); // the boss
    ellipse(ctx, cx - 0.5 * k, cy - 1.2 * k, 0.7 * k, 1 * k, shade(BRONZE, 0.6));
    dots(cx, cy, rx + 0.1 * k, ry + 0.1 * k, 12, shade(BRONZE, 0.4));
    return;
  }
  // a round bronze-rimmed target on a green field with a triskele
  const cx = x - 1 * k, cy = y - 5.4 * k, r = 5.6 * k;
  ellipse(ctx, cx, cy, r + 0.8 * k, r + 0.8 * k, shade(CLE, -0.2));
  ellipse(ctx, cx, cy, r, r, CG);
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  poly(ctx, [cx + 0.6 * k, cy - r, cx + r, cy - r, cx + r, cy + r, cx + 0.6 * k, cy + r], shade(CG, -0.2));
  ctx.restore();
  ring(ctx, cx, cy, r, r, BRONZE, 0.9 * k);
  ring(ctx, cx, cy, r * 0.62, r * 0.62, CY, 0.5 * k);
  triskele(ctx, cx, cy, r * 0.62, r * 0.62, CR, 0.7 * k);
  dots(cx, cy, r * 0.83, r * 0.83, 12, shade(BRONZE, 0.4));
  ellipse(ctx, cx, cy, 1.5 * k, 1.5 * k, BRONZE);
  ellipse(ctx, cx - 0.4 * k, cy - 0.5 * k, 0.6 * k, 0.6 * k, shade(BRONZE, 0.6));
}

/** A sword: a long iron blade, gold inlay, a bronze guard and an anthropoid crescent pommel. */
function celtSword(ctx: Ctx, x: number, y: number, k: number, len: number, wid: number) {
  const x1 = x + (0.2 + len * 0.17) * k, y1 = y - (len + 1) * k;
  blade(ctx, x + 0.2 * k, y - 1 * k, x1, y1, wid * k, CI);
  line(ctx, x + 0.6 * k, y - 4 * k, x1 - 0.3 * k, y1 + 2 * k, GOLD, 0.4 * k); // inlaid line in the fuller
  hilt(ctx, x + 0.2 * k, y - 1 * k, 0.2, -1, k, BRONZE, CR);
}

/** The carnyx: a tall bronze war-horn ending in a boar's open-jawed head. */
function carnyx(ctx: Ctx, x: number, y: number, k: number, hgt: number) {
  const px = x + 2.4 * k, py = y - hgt * k;
  line(ctx, x, y + 3 * k, px, py, shade(BRONZE, -0.3), 2 * k);
  line(ctx, x - 0.6 * k, y + 3 * k, px - 0.6 * k, py, shade(BRONZE, 0.3), 0.7 * k);
  for (const t of [0.15, 0.4, 0.62]) line(ctx, x + (px - x) * t - 1.3 * k, y + 3 * k + (py - y - 3 * k) * t, x + (px - x) * t + 1.3 * k, y + 3 * k + (py - y - 3 * k) * t - 0.2 * k, GOLD, 0.6 * k); // bands
  // the boar head, seen in profile with its jaws agape
  poly(ctx, [px - 2.4 * k, py + 1.4 * k, px - 2 * k, py - 4 * k, px + 1.6 * k, py - 5 * k, px + 5.4 * k, py - 3.4 * k, px + 6.4 * k, py - 1.2 * k, px + 2 * k, py - 0.4 * k], BRONZE); // skull and upper jaw
  poly(ctx, [px - 2.4 * k, py + 1.4 * k, px + 2 * k, py - 0.4 * k, px + 5.6 * k, py + 2.6 * k, px + 1.6 * k, py + 3.6 * k], shade(BRONZE, -0.3)); // lower jaw
  poly(ctx, [px + 2 * k, py - 0.4 * k, px + 6.4 * k, py - 1.2 * k, px + 5.6 * k, py + 2.6 * k], '#6a1a1a'); // gaping mouth
  ellipse(ctx, px + 6.4 * k, py - 2.2 * k, 1.5 * k, 1.9 * k, shade(BRONZE, 0.1)); // the flat snout disc
  ellipse(ctx, px + 6.9 * k, py - 2.6 * k, 0.3 * k, 0.45 * k, '#3a2410');
  ellipse(ctx, px + 6.9 * k, py - 1.6 * k, 0.3 * k, 0.45 * k, '#3a2410');
  poly(ctx, [px + 5.2 * k, py + 0.6 * k, px + 6.6 * k, py - 2 * k, px + 4.6 * k, py - 0.2 * k], CL); // curling tusk
  poly(ctx, [px + 4.4 * k, py + 2.4 * k, px + 5.8 * k, py + 0.4 * k, px + 3.6 * k, py + 1.6 * k], CL);
  poly(ctx, [px - 1.4 * k, py - 4.4 * k, px - 0.2 * k, py - 8 * k, px + 1.4 * k, py - 4.8 * k], shade(BRONZE, -0.1)); // ear
  poly(ctx, [px - 1.4 * k, py - 4.4 * k, px - 0.2 * k, py - 8 * k, px, py - 4.6 * k], shade(BRONZE, 0.4));
  ellipse(ctx, px + 2.6 * k, py - 2.4 * k, 0.65 * k, 0.65 * k, '#101010');
  ellipse(ctx, px + 2.4 * k, py - 2.6 * k, 0.25 * k, 0.25 * k, '#ffffff');
  for (let i = 0; i < 5; i++) line(ctx, px - 2 * k + i * 0.9 * k, py - 4.4 * k, px - 2.4 * k + i * 0.9 * k, py - 6 * k, shade(BRONZE, -0.5), 0.5 * k); // bristled mane
  poly(ctx, [px - 1.6 * k, py + 1.2 * k, px - 6 * k, py + 3 * k, px - 5 * k, py + 6 * k, px - 2.4 * k, py + 4.2 * k], CR); // a red-and-green streamer tied below
  poly(ctx, [px - 1.6 * k, py + 1.2 * k, px - 3.4 * k, py + 2 * k, px - 2.8 * k, py + 4.6 * k, px - 2.4 * k, py + 4.2 * k], CG);
}

function celtSpear(ctx: Ctx, hx: number, hy: number, k: number, tall: number) {
  const bx = hx + 1 * k, by = hy + 5 * k, tx = hx + 2 * k, ty = hy - tall * k;
  line(ctx, bx, by, tx, ty, WOOD, 1.7 * k);
  line(ctx, bx - 0.4 * k, by, tx - 0.4 * k, ty, shade(WOOD, 0.35), 0.5 * k);
  ellipse(ctx, bx, by + 0.2 * k, 1.1 * k, 0.8 * k, shade(BRONZE, -0.3)); // ferrule
  poly(ctx, [tx, ty - 8 * k, tx - 2 * k, ty - 2.6 * k, tx, ty + 0.4 * k], shade(CI, 0.22)); // a long leaf blade, lit side
  poly(ctx, [tx, ty - 8 * k, tx + 2 * k, ty - 2.6 * k, tx, ty + 0.4 * k], shade(CI, -0.25));
  line(ctx, tx, ty - 7 * k, tx, ty - 0.4 * k, shade(CI, -0.5), 0.5 * k);
  poly(ctx, [tx - 1.2 * k, ty + 0.2 * k, tx + 1.2 * k, ty + 0.2 * k, tx + 1 * k, ty + 2 * k, tx - 1 * k, ty + 2 * k], BRONZE); // bronze socket
  poly(ctx, [tx + 0.4 * k, ty + 2.4 * k, tx + 6.6 * k, ty + 3.6 * k, tx + 4.8 * k, ty + 5.4 * k, tx + 6.6 * k, ty + 7.4 * k, tx + 0.2 * k, ty + 6.4 * k], CR); // a swallow-tailed pennon
  poly(ctx, [tx + 0.4 * k, ty + 4.4 * k, tx + 5.6 * k, ty + 5 * k, tx + 5.4 * k, ty + 5.9 * k, tx + 0.3 * k, ty + 5.4 * k], CG);
}

function celtWeapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  const x0 = x - 6.3 * k, hip = y + 5.2 * k; // the body's own centre
  switch (kind) {
    case 'warrior':
      celtSword(ctx, x, y, k, 12.5, 2.5);
      return true;
    case 'clansman':
      // a bundle of javelins over the back, and a long sword
      for (const [dx, tip] of [[0, 18], [2, 16], [-2, 15]] as const) {
        line(ctx, x0 - 3 * k + dx * 0.3 * k, hip - 1 * k, x0 - 9 * k + dx * 0.5 * k, hip - tip * k, WOOD, 0.8 * k);
        poly(ctx, [x0 - 9 * k + dx * 0.5 * k, hip - (tip + 3.4) * k, x0 - 10 * k + dx * 0.5 * k, hip - (tip - 0.6) * k, x0 - 8 * k + dx * 0.5 * k, hip - (tip - 0.6) * k], CI);
      }
      celtSword(ctx, x, y, k, 16, 2.7);
      return true;
    case 'swordsman': {
      // a scabbard hangs from the belt behind the hip
      poly(ctx, [x0 - 3 * k, hip + 0.5 * k, x0 - 5.2 * k, hip + 1.2 * k, x0 - 9 * k, hip + 4.6 * k, x0 - 7.4 * k, hip + 5.4 * k], shade(CLE, -0.2));
      poly(ctx, [x0 - 8 * k, hip + 4 * k, x0 - 9.4 * k, hip + 4.8 * k, x0 - 7.6 * k, hip + 6 * k], BRONZE);
      celtSword(ctx, x, y, k, 15, 2.9);
      return true;
    }
    case 'defender':
      celtSpear(ctx, x, y, k, 18);
      return true;
    case 'giant':
      carnyx(ctx, x, y, k * 0.95, 21);
      return true;
    case 'explorer': {
      // a gnarled oak staff crowned with the golden sickle; a bunch of mistletoe hangs from it
      line(ctx, x + 1 * k, y + 6 * k, x + 2.2 * k, y - 14 * k, '#5a3f26', 1.7 * k);
      line(ctx, x + 0.6 * k, y + 6 * k, x + 1.8 * k, y - 14 * k, shade('#5a3f26', 0.35), 0.5 * k);
      for (const t of [0.2, 0.5, 0.75]) line(ctx, x + 1 * k + 1.2 * k * t, y + 6 * k - 20 * k * t, x + 2.6 * k + 1.2 * k * t, y + 5.4 * k - 20 * k * t, shade('#5a3f26', -0.3), 0.6 * k);
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 1.4 * k;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(x + 2.6 * k, y - 16.4 * k, 3.2 * k, 0.15 * Math.PI, 0.95 * Math.PI, false);
      ctx.stroke();
      ctx.strokeStyle = shade(GOLD, 0.55);
      ctx.lineWidth = 0.5 * k;
      ctx.beginPath();
      ctx.arc(x + 2.6 * k, y - 16.9 * k, 3.2 * k, 0.2 * Math.PI, 0.9 * Math.PI, false);
      ctx.stroke();
      for (let i = 0; i < 4; i++) ellipse(ctx, x + 1.4 * k + (i % 2) * 1.8 * k, y - 6.4 * k - i * 0.8 * k, 1.1 * k, 0.8 * k, i % 2 ? '#5fae4a' : CGD);
      for (const [dx, dy] of [[1.6, -6.8], [2.8, -7.6], [1.2, -8.6]] as const) ellipse(ctx, x + dx * k, y + dy * k, 0.45 * k, 0.45 * k, '#f4efe0');
      line(ctx, x + 2 * k, y - 8 * k, x + 4.5 * k, y - 7 * k, '#f4efe0', 0.6 * k);
      poly(ctx, [x + 4.5 * k, y - 7 * k, x + 8 * k, y - 8.2 * k, x + 7.4 * k, y - 5.8 * k], CR);
      return true;
    }
  }
  return false;
}

/** A Persian shield: the tall wicker spara of the line, a gilded lion roundel for the Immortals, and small painted rounds for the riders. */
function persiaShield(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  if (kind === 'defender') {
    const cx = x - 1.2 * k;
    const out = [cx - 3.9 * k, y + 2 * k, cx - 3.9 * k, y - 10 * k, cx - 2.4 * k, y - 11.8 * k, cx + 2.4 * k, y - 13 * k, cx + 3.9 * k, y - 11.6 * k, cx + 3.9 * k, y - 0.2 * k, cx + 2.4 * k, y + 1.6 * k, cx - 2.4 * k, y + 2.4 * k];
    poly(ctx, out, P_DWICK);
    poly(ctx, out.map((v, i) => (i % 2 ? v + (i > 8 ? -0.4 * k : 0.4 * k) : v + (v < cx ? 0.5 * k : -0.5 * k))), P_WICK);
    for (let i = 0; i < 8; i++) { // basket-weave: courses of darker reed, with staggered ticks
      const yy = y + 1 * k - i * 1.6 * k;
      line(ctx, cx - 3.4 * k, yy + 0.4 * k, cx + 3.4 * k, yy - 0.6 * k, shade(P_WICK, -0.28), 0.5 * k);
      for (let j = 0; j < 4; j++) line(ctx, cx - 2.7 * k + j * 1.9 * k + (i % 2) * 0.9 * k, yy - 0.2 * k, cx - 2.7 * k + j * 1.9 * k + (i % 2) * 0.9 * k, yy - 1.4 * k, shade(P_WICK, 0.25), 0.4 * k);
    }
    poly(ctx, [cx - 3.9 * k, y - 8.4 * k, cx + 3.9 * k, y - 9.6 * k, cx + 3.9 * k, y - 11.6 * k, cx + 2.4 * k, y - 13 * k, cx - 2.4 * k, y - 11.8 * k, cx - 3.9 * k, y - 10 * k], P_PINK); // a pink painted crest band
    for (const t of [-2.6, 0, 2.6]) ellipse(ctx, cx + t * k, y - 10.6 * k - t * 0.15 * k, 0.55 * k, 0.55 * k, GOLD);
    ellipse(ctx, cx, y - 4.4 * k, 2.2 * k, 2.4 * k, P_TURQ);
    ring(ctx, cx, y - 4.4 * k, 2.2 * k, 2.4 * k, GOLD, 0.6 * k);
    ellipse(ctx, cx, y - 4.4 * k, 0.9 * k, 0.9 * k, GOLD);
    ctx.strokeStyle = ink(P_DPINK);
    ctx.lineWidth = 0.9 * k;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(out[0], out[1]);
    for (let i = 2; i < out.length; i += 2) ctx.lineTo(out[i], out[i + 1]);
    ctx.closePath();
    ctx.stroke();
    for (const [rx, ry] of [[-3.7, 1.4], [3.7, -0.6], [-3.7, -9.8], [3.7, -11]] as const) ellipse(ctx, cx + rx * k, y + ry * k, 0.5 * k, 0.5 * k, GOLD);
    return;
  }
  if (kind === 'immortal') {
    const cx = x - 1 * k, cy = y - 5.2 * k;
    ellipse(ctx, cx, cy, 5.6 * k, 6.2 * k, shade(P_GILD, -0.25));
    ellipse(ctx, cx, cy, 4.8 * k, 5.4 * k, P_DTURQ);
    ellipse(ctx, cx, cy, 3.6 * k, 4.1 * k, P_TURQ);
    ring(ctx, cx, cy, 4.8 * k, 5.4 * k, GOLD, 0.7 * k);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; ellipse(ctx, cx + Math.cos(a) * 5.2 * k, cy + Math.sin(a) * 5.8 * k, 0.5 * k, 0.5 * k, P_PINK); }
    lionMark(ctx, cx - 0.2 * k, cy - 0.4 * k, 0.62 * k, P_GILD);
    ellipse(ctx, cx - 1.8 * k, cy - 3.8 * k, 1.3 * k, 0.9 * k, shade(P_TURQ, 0.5)); // sheen
    return;
  }
  // the rider's round wicker target, painted in the empire's colours
  const cx = x - 1 * k, cy = y - 5 * k, kn = kind === 'knight';
  ellipse(ctx, cx, cy, 5 * k, 5.6 * k, kn ? P_DPINK : P_DWICK);
  ellipse(ctx, cx, cy, 4.4 * k, 5 * k, kn ? P_PINK : P_WICK);
  for (const r of [3.2, 2]) ring(ctx, cx, cy, r * k, r * 1.12 * k, kn ? P_DPINK : P_DWICK, 0.5 * k);
  ring(ctx, cx, cy, 4.7 * k, 5.3 * k, GOLD, 0.7 * k);
  ellipse(ctx, cx, cy, 1.5 * k, 1.6 * k, P_TURQ);
  ellipse(ctx, cx, cy, 0.6 * k, 0.6 * k, GOLD);
  for (const a of [0.4, 2, 3.6, 5.2]) ellipse(ctx, cx + Math.cos(a) * 3.2 * k, cy + Math.sin(a) * 3.6 * k, 0.5 * k, 0.5 * k, P_CREAM);
}

/** The gorytos: a patterned bow-and-arrow case with a gilded rim, arrows fletched in pink and cream. */
function persiaQuiver(ctx: Ctx, x: number, y: number, k: number) {
  const qx = x - 7 * k, qy = y - 8 * k, w = 4 * k, h = 8 * k;
  band(ctx, qx, qy, w, h, 0.84, 1, GOLD);
  band(ctx, qx, qy, w, h, 0, 0.12, GOLD);
  band(ctx, qx, qy, w, h, 0.68, 0.76, P_PINK);
  for (const v of [0.18, 0.4]) for (const u of [0.1, 0.5]) {
    faceQuad(ctx, 'R', qx, qy, w, h, u, u + 0.34, v, v + 0.16, P_TURQ);
    faceQuad(ctx, 'L', qx, qy, w, h, u, u + 0.34, v, v + 0.16, P_DTURQ);
    faceQuad(ctx, 'R', qx, qy, w, h, u + 0.12, u + 0.22, v + 0.05, v + 0.11, P_CREAM);
  }
  for (const i of [-1.5, -0.5, 0.5, 1.5]) {
    const tx = qx - 1.4 * k + i * 1.1 * k;
    line(ctx, qx + i * 0.8 * k, qy - 4.4 * k, tx, qy - 10.6 * k, '#c9b58a', 0.6 * k);
    poly(ctx, [tx, qy - 10.6 * k, tx - 1 * k, qy - 13.2 * k, tx + 0.3 * k, qy - 11.4 * k], i % 2 ? P_CREAM : P_PINK);
    poly(ctx, [tx, qy - 10.6 * k, tx + 1.1 * k, qy - 13 * k, tx + 0.3 * k, qy - 11.4 * k], shade(i % 2 ? P_CREAM : P_PINK, -0.3));
  }
  ellipse(ctx, qx, qy - 2.6 * k, 0.9 * k, 0.9 * k, GOLD);
}

/** The Persian horse furniture: a lion-blazoned saddle cloth, plumes and a gilded frontlet. */
function persiaHorseGear(ctx: Ctx, kind: UnitKind, x: number, y: number, saddle: { x: number; y: number }) {
  const kh = 0.95, hx0 = x - 1, hy0 = y + 3;
  const hx = hx0 + 10.5 * kh, hy = hy0 - 15 * kh;
  const knight = kind === 'knight';
  const sx = saddle.x, sy = saddle.y;
  if (!knight) {
    // a hanging saddle cloth: pink, turquoise-bordered, its hem set with gold triangles
    poly(ctx, [sx - 6.6, sy - 1, sx + 4.2, sy - 1, sx + 3.6, sy + 6.8, sx - 1.4, sy + 5.4, sx - 5.4, sy + 8.4], P_PINK);
    poly(ctx, [sx - 6.6, sy - 1, sx - 1.6, sy - 1, sx - 1.4, sy + 5.4, sx - 5.4, sy + 8.4], shade(P_PINK, 0.14));
    for (const [a, b, c, d] of [[-5.4, 8.4, -1.4, 5.4], [-1.4, 5.4, 3.6, 6.8]] as const) line(ctx, sx + a, sy + b, sx + c, sy + d, P_TURQ, 1.5);
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      const px = i < 3 ? sx - 5.2 + t * 2 * 4 * 0.5 * 2 : sx - 1.4 + (t - 0.5) * 2 * 5, py = i < 3 ? sy + 8.4 - t * 6 : sy + 5.4 + (t - 0.5) * 2 * 1.4;
      poly(ctx, [px - 0.9, py + 0.6, px + 0.9, py + 0.9, px, py + 2.6], GOLD);
    }
    lionMark(ctx, sx - 1.6, sy + 2.4, 0.46, GOLD);
    line(ctx, sx - 6.6, sy - 1, sx + 4.2, sy - 1, GOLD, 0.8);
  } else {
    // the cataphract's caparison: turquoise stripes down the pink cloth, a gold-lion roundel, a fringe of gold triangles
    for (let i = 0; i < 6; i++) {
      faceQuad(ctx, 'R', hx0, hy0 - 6 * kh, 17 * kh, 7 * kh, 0.06 + i * 0.16, 0.12 + i * 0.16, 0.14, 0.62, P_TURQ);
      faceQuad(ctx, 'L', hx0, hy0 - 6 * kh, 17 * kh, 7 * kh, 0.06 + i * 0.16, 0.12 + i * 0.16, 0.14, 0.62, P_DTURQ);
    }
    band(ctx, hx0, hy0 - 6 * kh, 17 * kh, 7 * kh, 0.62, 0.7, P_DPINK);
    for (let i = 0; i < 7; i++) faceQuad(ctx, 'R', hx0, hy0 - 6 * kh, 17 * kh, 7 * kh, 0.04 + i * 0.14, 0.11 + i * 0.14, 0.02, 0.1, P_CREAM);
    ellipse(ctx, hx0 + 4.4, hy0 - 6.6, 2.7, 2.7, P_DPINK);
    ring(ctx, hx0 + 4.4, hy0 - 6.6, 2.7, 2.7, GOLD, 0.6);
    lionMark(ctx, hx0 + 4.2, hy0 - 6.4, 0.36, GOLD);
    wingedDisc(ctx, sx + 5.4, sy + 1, 0.42, P_CREAM, GOLD);
  }
  // the horse's head: a gold frontlet with a turquoise gem, twin plumes and hanging tassels
  faceQuad(ctx, 'R', hx, hy, 7 * kh, 5 * kh, 0.3, 0.7, 0.78, 0.96, GOLD);
  faceQuad(ctx, 'R', hx, hy, 7 * kh, 5 * kh, 0.44, 0.56, 0.8, 0.94, P_TURQ);
  poly(ctx, [hx + 0.4, hy - 4.4, hx - 1.6, hy - 11.4, hx + 2.6, hy - 5.2], P_PINK);
  poly(ctx, [hx + 1.6, hy - 4.6, hx + 3.2, hy - 11, hx + 4.4, hy - 4.6], P_TURQ);
  poly(ctx, [hx + 0.4, hy - 4.4, hx - 0.6, hy - 9, hx + 1.4, hy - 5], shade(P_PINK, 0.4));
  ellipse(ctx, hx + 1.4, hy - 4.2, 1.3, 1, GOLD);
  for (const [tx, ty] of [[hx + 3.6, hy + 2.2], [hx + 5.6, hy + 3]] as const) { line(ctx, tx, ty, tx - 0.4, ty + 2.6, P_PINK, 0.8); ellipse(ctx, tx - 0.4, ty + 3, 0.8, 0.9, GOLD); }
  // a turquoise breast collar hung with gold discs
  line(ctx, x + 3.4, y - 9.6, x + 8.4, y - 3.8, P_TURQ, 1.4);
  for (const t of [0.15, 0.45, 0.75]) { ellipse(ctx, x + 3.4 + 5 * t, y - 9.6 + 5.8 * t + 1.2, 1.2, 1.2, GOLD); ellipse(ctx, x + 3.4 + 5 * t, y - 9.6 + 5.8 * t + 1.2, 0.5, 0.5, P_PINK); }
  // the mane braided with gold ribbons, the tail tied up in turquoise
  for (const [mx, my] of [[9.4, -19.6], [8.2, -17], [7, -14.4]] as const) line(ctx, x - 1 + mx * kh - 1.2, y + 3 + my * kh, x - 1 + mx * kh + 1.2, y + 3 + my * kh, GOLD, 0.7);
  line(ctx, hx0 - 10.6 * kh, hy0 - 9.6 * kh, hx0 - 8.6 * kh, hy0 - 8.2 * kh, P_TURQ, 1.6);
}

/** A great arm-sling engine on a turquoise-painted carriage: tiled gable, winged-sun finial, a lion-headed arm. */
function persiaCatapult(ctx: Ctx, x: number, y: number, wheels: (hub: string) => void, flag: (fx: number, fy: number, color: string) => void) {
  box(ctx, x, y - 2, 18, 4, '#7a5230');
  band(ctx, x, y - 2, 18, 4, 0.48, 0.76, P_TURQ);
  for (const u of [0.1, 0.3, 0.5, 0.7, 0.9]) faceQuad(ctx, 'R', x, y - 2, 18, 4, u - 0.04, u + 0.04, 0.54, 0.7, GOLD);
  wheels(P_TURQ);
  for (const [ox, oy] of [[-7, 1], [6, 3]]) ring(ctx, x + ox, y + oy, 3.4, 3.8, P_PINK, 0.8); // pink-painted wheel rims
  // two tile-painted uprights, a cross-beam and a gable roof
  line(ctx, x - 5.4, y - 2, x - 2, y - 20, P_TURQ, 2.9);
  line(ctx, x + 5.4, y - 1, x + 2, y - 20, P_DTURQ, 2.9);
  line(ctx, x - 5.8, y - 2, x - 2.4, y - 20, P_LTURQ, 0.6);
  for (const t of [0.2, 0.4, 0.6, 0.8]) { line(ctx, x - 5.4 + 3.4 * t - 1.4, y - 2 - 18 * t, x - 5.4 + 3.4 * t + 1.4, y - 2 - 18 * t, P_CREAM, 0.5); line(ctx, x + 5.4 - 3.4 * t - 1.4, y - 1 - 19 * t, x + 5.4 - 3.4 * t + 1.4, y - 1 - 19 * t, P_CREAM, 0.5); } // tile courses
  line(ctx, x - 3.8, y - 10, x + 3.8, y - 10, GOLD, 1.2);
  poly(ctx, [x - 5.2, y - 20.4, x, y - 25.4, x + 5.2, y - 20.4, x, y - 18], P_TURQ);
  poly(ctx, [x, y - 25.4, x + 5.2, y - 20.4, x, y - 18], shade(P_TURQ, -0.28));
  line(ctx, x - 5.2, y - 20.4, x, y - 18, GOLD, 0.7);
  line(ctx, x, y - 18, x + 5.2, y - 20.4, shade(GOLD, -0.3), 0.7);
  wingedDisc(ctx, x, y - 27.6, 0.5, P_CREAM, GOLD);
  // the throwing arm ends in a lion's head that holds the stone in its open jaws
  line(ctx, x - 8, y - 11, x + 12, y - 30, '#6b4424', 3.2);
  line(ctx, x - 8, y - 11.7, x + 12, y - 30.7, shade('#6b4424', 0.4), 0.6);
  for (const t of [0.25, 0.5, 0.75]) line(ctx, x - 8 + 20 * t - 1, y - 11 - 19 * t + 1.6, x - 8 + 20 * t + 1, y - 11 - 19 * t - 1.6, GOLD, 0.7);
  ellipse(ctx, x - 1.6, y - 16.6, 1.5, 1.5, GOLD); // the pivot
  line(ctx, x - 8, y - 11, x - 8.6, y - 8.6, '#5a3a22', 1);
  box(ctx, x - 8.6, y - 5.4, 5, 3.6, P_PINK, shade(P_PINK, 0.2)); // the counterweight box
  band(ctx, x - 8.6, y - 5.4, 5, 3.6, 0.4, 0.6, GOLD);
  const hx = x + 13, hy = y - 31.4;
  ellipse(ctx, hx, hy, 4.4, 4.2, shade(P_GILD, -0.3));
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.2; poly(ctx, [hx + Math.cos(a - 0.3) * 3.8, hy + Math.sin(a - 0.3) * 3.6, hx + Math.cos(a) * 5.6, hy + Math.sin(a) * 5.4, hx + Math.cos(a + 0.3) * 3.8, hy + Math.sin(a + 0.3) * 3.6], i % 2 ? P_GILD : shade(P_GILD, -0.2)); }
  ellipse(ctx, hx, hy, 3, 3, P_GILD);
  poly(ctx, [hx - 0.4, hy + 0.6, hx + 3.6, hy + 2.6, hx + 3.2, hy + 4.4, hx - 0.4, hy + 3], shade(P_GILD, -0.25)); // the lower jaw
  ellipse(ctx, hx + 1.4, hy - 0.8, 0.7, 0.7, P_TURQ);
  ellipse(ctx, hx + 3.2, hy + 0.8, 0.6, 0.5, DARK);
  ellipse(ctx, hx + 1.6, hy + 2.6, 2.1, 1.7, '#8a8a90'); // the stone in its jaws
  ellipse(ctx, hx + 1.2, hy + 2.2, 0.8, 0.5, '#b4b4bc');
  line(ctx, x + 12, y - 27, x + 8, y - 7, '#c9b58a', 0.7); // sling rope
  flag(x + 8, y + 1, P_PINK);
  // a striped awning pole at the rear shading the crew's stores
  line(ctx, x - 12.4, y - 1, x - 12.4, y - 15, '#5a3b1e', 1);
  poly(ctx, [x - 12.4, y - 15, x - 5.6, y - 13.4, x - 12.4, y - 10.6], P_TURQ);
  poly(ctx, [x - 12.4, y - 15, x - 8.6, y - 14.2, x - 12.4, y - 12.8], P_CREAM);
  ellipse(ctx, x - 12.4, y - 15.6, 0.9, 0.9, GOLD);
}

/** The Persian navy: painted galleys with a gilded lion's-head prow and a fan-tailed stern, sails blazoned with the winged sun. */
function drawPersianBoat(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  const T = TRIBES.persia;
  const tier = kind === 'warship' ? 2 : kind === 'ship' ? 1 : 0;
  const s = 1 + tier * 0.14, w = 19 * s;
  const hullC = '#7a2a56';
  const at = (t: number) => ({ l: { x: x - w + w * 0.3 * t, y: y - 5 + 8 * t }, r: { x: x + w + 3 - (w * 0.28 + 3) * t, y: y - 6 + 9 * t } });
  // the fan-tailed stern: turned-up planking with a spray of gilded feathers
  poly(ctx, [x - w, y - 5, x - w - 1.6, y - 12, x - w - 3.4, y - 15.6, x - w + 2.6, y - 9, x - w + 3, y - 6], shade(hullC, 0.2));
  for (let i = 0; i < 4; i++) {
    const a = -2.5 + i * 0.32;
    poly(ctx, [x - w - 1, y - 12, x - w - 1 + Math.cos(a) * 8.6, y - 12 + Math.sin(a) * 8.6, x - w - 1 + Math.cos(a + 0.28) * 7.6, y - 12 + Math.sin(a + 0.28) * 7.6], i % 2 ? P_TURQ : GOLD);
  }
  ellipse(ctx, x - w - 1, y - 12, 1.3, 1.3, P_PINK);
  // hull, painted plum below a pink strake
  poly(ctx, [x - w, y - 5, x + w + 3, y - 6, x + w * 0.72, y + 3, x - w * 0.7, y + 3], hullC);
  poly(ctx, [x - w, y - 5, x + w + 3, y - 6, x + w * 0.9, y - 8.5, x - w * 0.9, y - 8], P_PINK);
  poly(ctx, [x - w, y - 5, x + w + 3, y - 6, x + w + 2.4, y - 6.9, x - w + 0.4, y - 5.9], shade(P_PINK, -0.3));
  // a turquoise frieze along the hull, with cream rosettes and gold edging
  const a0 = at(0.16), a1 = at(0.5);
  poly(ctx, [a0.l.x, a0.l.y, a0.r.x, a0.r.y, a1.r.x, a1.r.y, a1.l.x, a1.l.y], P_TURQ);
  line(ctx, a0.l.x, a0.l.y, a0.r.x, a0.r.y, GOLD, 0.8);
  line(ctx, a1.l.x, a1.l.y, a1.r.x, a1.r.y, GOLD, 0.8);
  const mid = at(0.33);
  const n = 6 + tier * 2;
  for (let i = 0; i < n; i++) {
    const f = 0.06 + (i / (n - 1)) * 0.88, px = mid.l.x + (mid.r.x - mid.l.x) * f, py = mid.l.y + (mid.r.y - mid.l.y) * f;
    ellipse(ctx, px, py, 1.4, 1.4, P_CREAM);
    ellipse(ctx, px, py, 0.6, 0.6, i % 2 ? P_PINK : GOLD);
  }
  for (let i = 0; i < 6; i++) line(ctx, x - w * 0.8 + i * (w * 0.32), y - 1, x - w * 0.8 + i * (w * 0.32) - 0.8, y + 2.6, shade(hullC, -0.35), 0.5); // ribs
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y + 3.4, w * 0.8, 2.3, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.stroke();
  // the bow: a bronze ram at the waterline and a gilded lion's-head figurehead on a curving neck
  poly(ctx, [x + w * 0.7, y + 0.6, x + w + 6, y + 2.6, x + w * 0.7, y + 3.4], BRONZE);
  poly(ctx, [x + w * 0.7, y + 0.6, x + w + 6, y + 2.6, x + w * 0.9, y + 1.8], shade(BRONZE, 0.35));
  ctx.strokeStyle = ink(P_GILD);
  ctx.lineWidth = 2.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + w + 1.4, y - 6);
  ctx.quadraticCurveTo(x + w + 2.2, y - 13, x + w + 4.2, y - 14.6);
  ctx.stroke();
  const fx = x + w + 4.4, fy = y - 15.6;
  ellipse(ctx, fx, fy, 3.6, 3.6, shade(P_GILD, -0.3));
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; poly(ctx, [fx + Math.cos(a - 0.35) * 3, fy + Math.sin(a - 0.35) * 3, fx + Math.cos(a) * 4.8, fy + Math.sin(a) * 4.8, fx + Math.cos(a + 0.35) * 3, fy + Math.sin(a + 0.35) * 3], i % 2 ? P_GILD : shade(P_GILD, -0.2)); }
  ellipse(ctx, fx, fy, 2.6, 2.6, P_GILD);
  poly(ctx, [fx + 0.4, fy + 0.8, fx + 3.6, fy + 1.8, fx + 3, fy + 3.2, fx + 0.4, fy + 2.6], shade(P_GILD, -0.28)); // open jaw
  poly(ctx, [fx + 1.4, fy + 1.4, fx + 3.2, fy + 1.8, fx + 2.6, fy + 2.4], '#c8372d');
  ellipse(ctx, fx + 1.1, fy - 0.6, 0.7, 0.7, P_TURQ);
  ellipse(ctx, fx + 2.8, fy + 0.6, 0.55, 0.45, DARK);
  poly(ctx, [fx - 1, fy - 2.6, fx - 0.6, fy - 4.4, fx + 0.8, fy - 2.8], P_GILD);
  // oars: a bank along the hull, a second above it on the war fleet
  const bank = 4 + tier * 2;
  for (let i = 0; i < bank; i++) {
    const ox = x - w * 0.62 + i * ((w * 1.24) / (bank - 1));
    line(ctx, ox, y - 1, ox - 3, y + 6, '#6b4424', 1.1);
    ellipse(ctx, ox - 3.4, y + 6.6, 1.7, 0.8, P_TURQ);
    ellipse(ctx, ox - 3.4, y + 6.6, 0.6, 0.4, P_PINK);
  }
  // mast and sails
  const mt = y - (34 + tier * 6);
  line(ctx, x, y - 6, x, mt, '#5a3b1e', 2);
  const top = mt + 2;
  if (tier === 0) {
    // a pink lateen sail with a cream border and a little gold sun
    poly(ctx, [x + 0.8, top, x + 15, y - 11.4, x + 0.8, y - 10.4], P_PINK);
    poly(ctx, [x + 0.8, top, x + 15, y - 11.4, x + 0.8, y - 10.4], P_PINK);
    poly(ctx, [x - 0.8, top + 3, x - 10, y - 12, x - 0.8, y - 10.6], shade(P_PINK, -0.2));
    line(ctx, x + 0.8, top, x + 15, y - 11.4, P_CREAM, 0.9);
    line(ctx, x + 15, y - 11.4, x + 0.8, y - 10.4, P_CREAM, 0.9);
    ellipse(ctx, x + 5.4, y - 19, 2.4, 2.4, GOLD);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; line(ctx, x + 5.4 + Math.cos(a) * 2.8, y - 19 + Math.sin(a) * 2.8, x + 5.4 + Math.cos(a) * 4, y - 19 + Math.sin(a) * 4, GOLD, 0.5); }
  } else {
    // a square sail striped pink and cream, blazoned with the winged sun, on a gilded yard
    const yw = 14 * s, sy0 = top + 5, sy1 = y - 12;
    poly(ctx, [x - yw, sy0, x + yw, sy0, x + yw - 1, sy1, x - yw + 1, sy1], P_CREAM);
    poly(ctx, [x, sy0, x + yw, sy0, x + yw - 1, sy1, x, sy1], shade(P_CREAM, -0.1));
    for (const f of [-0.76, -0.4, 0.4, 0.76]) poly(ctx, [x + yw * f - 1.6, sy0, x + yw * f + 1.6, sy0, x + yw * f + 1.4, sy1, x + yw * f - 1.4, sy1], P_PINK);
    for (let i = 0; i < 6; i++) line(ctx, x - yw + 1 + i * (yw * 2 - 2) / 5, sy1 - 0.4, x - yw + 1 + i * (yw * 2 - 2) / 5, sy1 + 1.8, GOLD, 0.7); // hem tassels
    wingedDisc(ctx, x, (sy0 + sy1) / 2 - 0.4, 0.8 * s, P_CREAM, GOLD);
    line(ctx, x - yw - 1, sy0, x + yw + 1, sy0, GOLD, 1.3);
    ellipse(ctx, x - yw - 1, sy0, 0.9, 0.9, P_TURQ);
    ellipse(ctx, x + yw + 1, sy0, 0.9, 0.9, P_TURQ);
    for (const f of [0.4, 0.7]) line(ctx, x - yw + 0.5 * f, sy0 + (sy1 - sy0) * f, x + yw - 0.5 * f, sy0 + (sy1 - sy0) * f, shade(P_CREAM, -0.32), 0.4); // battens
  }
  // a swallow-tailed royal pennant and a gold finial at the masthead
  poly(ctx, [x, mt - 2, x + 10, mt - 0.4, x + 7.6, mt + 1.4, x + 10, mt + 3.2, x, mt + 1.6], T.color);
  poly(ctx, [x, mt - 2, x + 10, mt - 0.4, x + 9, mt + 0.4, x, mt - 0.4], shade(T.color, 0.35));
  ellipse(ctx, x + 3.4, mt + 0.6, 0.9, 0.9, GOLD);
  ellipse(ctx, x, mt - 2.6, 1.3, 1.3, GOLD);
  // rigging
  line(ctx, x, mt - 1, x + w + 3, y - 7.4, '#3a2a1a', 0.6);
  line(ctx, x, mt - 1, x - w, y - 6.4, '#3a2a1a', 0.6);
  // a round-shield rail: gold-rimmed wicker and painted rounds
  if (tier >= 1) for (let i = 0; i < 4 + tier; i++) {
    const sx = x - w * 0.62 + i * ((w * 1.24) / (3 + tier));
    ellipse(ctx, sx, y - 7.6, 2.3, 2.3, i % 2 ? P_TURQ : P_WICK);
    ring(ctx, sx, y - 7.6, 2.3, 2.3, GOLD, 0.6);
    ellipse(ctx, sx, y - 7.6, 0.7, 0.7, i % 2 ? GOLD : P_PINK);
  }
  if (tier < 2) { // stores on deck
    box(ctx, x + w * 0.45, y - 7.2, 4, 3, '#7a5230');
    band(ctx, x + w * 0.45, y - 7.2, 4, 3, 0.4, 0.55, P_TURQ);
  }
  if (tier >= 1) {
    // a stern pavilion: a turquoise onion dome on a little pink kiosk
    const kx = x - w * 0.66, ky = y - 8.2;
    box(ctx, kx, ky, 7, 4.6, '#f0dfb8');
    faceQuad(ctx, 'R', kx, ky, 7, 4.6, 0.3, 0.7, 0.1, 0.8, DARK);
    band(ctx, kx, ky, 7, 4.6, 0.86, 1, P_PINK);
    ctx.fillStyle = ink(P_TURQ);
    ctx.beginPath();
    ctx.moveTo(kx - 4, ky - 5.2);
    ctx.bezierCurveTo(kx - 5.4, ky - 9.4, kx - 1, ky - 10.4, kx, ky - 14.6);
    ctx.bezierCurveTo(kx + 1, ky - 10.4, kx + 5.4, ky - 9.4, kx + 4, ky - 5.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ink(shade(P_TURQ, -0.28));
    ctx.beginPath();
    ctx.moveTo(kx, ky - 14.6);
    ctx.bezierCurveTo(kx + 1, ky - 10.4, kx + 5.4, ky - 9.4, kx + 4, ky - 5.2);
    ctx.lineTo(kx, ky - 4.6);
    ctx.closePath();
    ctx.fill();
    line(ctx, kx, ky - 14.6, kx, ky - 17.4, GOLD, 0.8);
    ellipse(ctx, kx, ky - 17.8, 0.9, 0.9, GOLD);
    line(ctx, kx - 4, ky - 5.2, kx + 4, ky - 5.2, GOLD, 0.8);
  }
  if (tier === 2) { // a fighting-top for the lookout and a lion banner
    box(ctx, x, top + 9, 6.4, 2.6, '#5a3b1e', GOLD);
    line(ctx, x - 3.2, top + 6.8, x + 3.2, top + 6.8, '#3a2a1a', 0.6);
    line(ctx, x + w * 0.5, y - 8.4, x + w * 0.5, y - 20, '#5a3b1e', 1);
    poly(ctx, [x + w * 0.5, y - 20, x + w * 0.5 + 8, y - 18.6, x + w * 0.5 + 8, y - 12.6, x + w * 0.5, y - 14], P_TURQ);
    lionMark(ctx, x + w * 0.5 + 3.8, y - 15.8, 0.5, GOLD);
  }
  // the crew: bowmen and spearmen at the rail
  const crew: [UnitKind, number, number][] = tier === 0 ? [['warrior', -8, 0.42]] : tier === 1 ? [['warrior', -8, 0.4], ['archer', 9, 0.4]] : [['defender', -12, 0.38], ['archer', 3, 0.38], ['immortal', 12, 0.4]];
  for (const [ck, cx, cs] of crew) figure(ctx, ck, 'persia', x + cx, y - 6, cs, true);
}

/** The Asiatic lion of the Persian plains: a tawny cat with a shaggy dark mane and a tufted tail. */
function persiaLion(ctx: Ctx, x: number, y: number, k: number, body: string) {
  const mane = '#6b3c1e';
  for (const lx of [-6, -2.5, 3, 6.5]) {
    box(ctx, x + lx * k, y + (lx > 0 ? 0.5 : -0.5) * k, 2.2 * k, 6 * k, shade(body, -0.28));
    box(ctx, x + lx * k, y + (lx > 0 ? 0.5 : -0.5) * k, 2.6 * k, 1.4 * k, shade(body, -0.45)); // paws
  }
  ctx.strokeStyle = ink(shade(body, -0.1)); // the tail with its dark tuft
  ctx.lineWidth = 1.5 * k;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 7.6 * k, y - 6 * k);
  ctx.quadraticCurveTo(x - 13 * k, y - 8 * k, x - 12 * k, y - 14 * k);
  ctx.stroke();
  ellipse(ctx, x - 12 * k, y - 15 * k, 1.6 * k, 2.2 * k, mane);
  box(ctx, x, y - 5 * k, 16 * k, 7 * k, body);
  band(ctx, x, y - 5 * k, 16 * k, 7 * k, 0, 0.18, shade(body, -0.3));
  faceQuad(ctx, 'R', x, y - 5 * k, 16 * k, 7 * k, 0.55, 0.95, 0.3, 0.85, shade(body, 0.1)); // shoulder
  faceQuad(ctx, 'L', x, y - 5 * k, 16 * k, 7 * k, 0.1, 0.5, 0.3, 0.85, shade(body, 0.06));
  ellipse(ctx, x + 8 * k, y - 11.6 * k, 6.6 * k, 7 * k, shade(mane, -0.2)); // the mane rings the head and drapes over the shoulders
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; poly(ctx, [x + 8 * k + Math.cos(a - 0.3) * 5.4 * k, y - 11.6 * k + Math.sin(a - 0.3) * 5.6 * k, x + 8 * k + Math.cos(a) * 7.6 * k, y - 11.6 * k + Math.sin(a) * 7.8 * k, x + 8 * k + Math.cos(a + 0.3) * 5.4 * k, y - 11.6 * k + Math.sin(a + 0.3) * 5.6 * k], i % 2 ? mane : shade(mane, 0.2)); }
  ellipse(ctx, x + 6.4 * k, y - 6.6 * k, 4.6 * k, 2.4 * k, mane);
  box(ctx, x + 9 * k, y - 8.6 * k, 7 * k, 6.8 * k, shade(body, 0.06)); // the face
  box(ctx, x + 13 * k, y - 8.2 * k, 3.4 * k, 3 * k, shade(body, 0.28)); // muzzle
  faceQuad(ctx, 'R', x + 13 * k, y - 8.2 * k, 3.4 * k, 3 * k, 0.4, 0.7, 0.55, 0.85, '#2a1a10'); // nose
  faceQuad(ctx, 'R', x + 9 * k, y - 8.6 * k, 7 * k, 6.8 * k, 0.42, 0.62, 0.5, 0.68, '#3a2410'); // eye
  faceQuad(ctx, 'R', x + 9 * k, y - 8.6 * k, 7 * k, 6.8 * k, 0.46, 0.54, 0.56, 0.64, '#f2c53a');
  faceQuad(ctx, 'R', x + 9 * k, y - 8.6 * k, 7 * k, 6.8 * k, 0.4, 0.8, 0.72, 0.78, shade(body, -0.3)); // brow
  box(ctx, x + 6.4 * k, y - 15.6 * k, 1.8 * k, 2 * k, mane); // ears
  box(ctx, x + 11.6 * k, y - 15.2 * k, 1.8 * k, 2 * k, mane);
  poly(ctx, [x + 15 * k, y - 4.6 * k, x + 15.6 * k, y - 2.6 * k, x + 16.2 * k, y - 4.6 * k], '#f4f0e2'); // a fang
}

// ---------------------------------------------------------------- Inca: unku, llautu, macana, llamas, reed boats

const I_WINE = '#7b2145', I_WINE_D = '#3f0f26', I_CREAM = '#efe6d2', I_TURQ = '#2fb5a8', I_TURQ_D = '#1f8a82', I_INK = '#1a1418', I_COPPER = '#c98a4a', I_REED = '#d6c07a', I_RED = '#c8372d';

/** A line drawn on one visible face of a box, in the same (u, v) coordinates as faceQuad. */
function faceLine(ctx: Ctx, face: 'L' | 'R', cx: number, cy: number, w: number, h: number, u0: number, v0: number, u1: number, v1: number, color: string, lw: number) {
  const P = (u: number, v: number) => face === 'R'
    ? [cx + (u * w) / 2, cy + (w / 4) * (1 - u) - v * h]
    : [cx - w / 2 + (u * w) / 2, cy + (w / 4) * u - v * h];
  const a = P(u0, v0), b = P(u1, v1);
  line(ctx, a[0], a[1], b[0], b[1], color, lw);
}

/** A tocapu checkerboard band across both visible faces of a box. */
function tocapu(ctx: Ctx, x: number, y: number, w: number, h: number, v0: number, v1: number, cols: number, rows: number, a: string, b: string) {
  for (const f of ['L', 'R'] as const) for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
    faceQuad(ctx, f, x, y, w, h, c / cols, (c + 1) / cols, v0 + ((v1 - v0) * r) / rows, v0 + ((v1 - v0) * (r + 1)) / rows, (c + r) % 2 ? b : a);
  }
}

/** The unku: a checkerboard waist of tocapu, a stepped hem, and quilted cotton armour over it for the heavy ranks. */
function incaTorso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const heavy = isHeavy(kind);
  const k = w / 10;
  band(ctx, x, y, w, h, 0, 0.13, I_CREAM); // pale hem
  for (let i = 0; i < 4; i++) for (const f of ['L', 'R'] as const) {
    faceQuad(ctx, f, x, y, w, h, i * 0.25 + 0.05, i * 0.25 + 0.13, 0.02, 0.1, I_WINE_D); // stepped fret on the hem
    faceQuad(ctx, f, x, y, w, h, i * 0.25 + 0.13, i * 0.25 + 0.21, 0.06, 0.12, I_TURQ);
  }
  band(ctx, x, y, w, h, 0.13, 0.17, I_WINE_D);
  tocapu(ctx, x, y, w, h, 0.36, 0.56, 4, 2, I_INK, I_CREAM); // the checkerboard waist band
  band(ctx, x, y, w, h, 0.34, 0.36, GOLD);
  band(ctx, x, y, w, h, 0.56, 0.58, GOLD);
  if (heavy) {
    // quilted cotton armour: cream, with diamond stitching and a gilded collar
    band(ctx, x, y, w, h, 0.58, 1, '#eadfc4');
    for (const f of ['L', 'R'] as const) for (let i = 0; i < 4; i++) {
      faceLine(ctx, f, x, y, w, h, i * 0.25, 0.58, i * 0.25 + 0.25, 1, '#b6a57e', 0.5 * k);
      faceLine(ctx, f, x, y, w, h, i * 0.25, 1, i * 0.25 + 0.25, 0.58, '#b6a57e', 0.5 * k);
    }
    band(ctx, x, y, w, h, 0.93, 1, GOLD);
    faceQuad(ctx, 'R', x, y, w, h, 0.32, 0.68, 0.6, 0.9, GOLD); // sun disc on the chest
    faceQuad(ctx, 'R', x, y, w, h, 0.4, 0.6, 0.66, 0.84, I_TURQ);
    faceQuad(ctx, 'R', x, y, w, h, 0.46, 0.54, 0.72, 0.78, shade(GOLD, 0.5));
    for (const u of [0.04, 0.86]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.1, 0.62, 0.72, I_WINE); // crimson quilting knots
  } else {
    // a crimson unku with a turquoise-edged neck and a gold sun pendant
    for (const [u0, u1] of [[0.06, 0.12], [0.84, 0.9]]) faceQuad(ctx, 'R', x, y, w, h, u0, u1, 0.58, 1, I_WINE_D);
    for (const [u0, u1] of [[0.12, 0.18], [0.8, 0.86]]) faceQuad(ctx, 'L', x, y, w, h, u0, u1, 0.58, 1, I_WINE_D);
    facePoly(ctx, 'R', x, y, w, h, [[0, 1], [0.34, 1], [0, 0.6]], I_TURQ);
    facePoly(ctx, 'L', x, y, w, h, [[0.66, 1], [1, 1], [1, 0.6]], I_TURQ);
    facePoly(ctx, 'R', x, y, w, h, [[0, 1], [0.24, 1], [0, 0.7]], LOOK.inca.skin);
    facePoly(ctx, 'L', x, y, w, h, [[0.76, 1], [1, 1], [1, 0.7]], LOOK.inca.skin);
    faceQuad(ctx, 'R', x, y, w, h, 0.3, 0.6, 0.6, 0.78, GOLD);
    faceQuad(ctx, 'R', x, y, w, h, 0.4, 0.5, 0.65, 0.72, shade(GOLD, 0.5));
  }
}

/** Ear spools (the orejones), red face paint and a tiny gold nose ring. */
function incaFace(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  for (const u of [0.12, 0.78]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.07, 0.17, 0.4, I_RED); // cheek paint
  faceQuad(ctx, 'L', x, y, w, h, 0.64, 0.9, 0.3, 0.58, GOLD); // ear spool
  faceQuad(ctx, 'L', x, y, w, h, 0.71, 0.83, 0.37, 0.51, I_TURQ);
  faceQuad(ctx, 'L', x, y, w, h, 0.75, 0.79, 0.42, 0.46, shade(GOLD, 0.5));
  if (kind === 'swordsman' || kind === 'knight' || kind === 'giant' || kind === 'defender') {
    faceQuad(ctx, 'R', x, y, w, h, 0.44, 0.56, 0.26, 0.32, GOLD); // nose ring
    faceQuad(ctx, 'R', x, y, w, h, 0.05, 0.13, 0.5, 0.56, I_WINE_D); // brow paint
  }
}

/** A fan of feathers rising from (x, y). */
function incaPlume(ctx: Ctx, x: number, y: number, k: number, n: number, len: number, spread: number, cols: string[]) {
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i - (n - 1) / 2) * spread;
    feather(ctx, x, y, x + Math.cos(a) * len * k, y + Math.sin(a) * len * 0.95 * k, 1.5 * k, cols[i % cols.length], i % 2 ? I_INK : undefined);
  }
}

function incaHeadgear(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  const hair = LOOK.inca.hair;
  const rank = kind === 'swordsman' || kind === 'knight' || kind === 'giant' || kind === 'defender';
  const cap = kind === 'archer' || kind === 'slinger' || kind === 'explorer' || kind === 'catapult';
  if (cap) {
    // a knitted chullo with ear flaps, woven stripes, dangling ties and a pompom
    const bw = hw + 1.3 * k, cy = top + 3.7 * k, bh = 4.4 * k;
    box(ctx, x, cy, bw, bh, I_WINE, shade(I_WINE, 0.12));
    band(ctx, x, cy, bw, bh, 0.55, 0.72, I_CREAM);
    band(ctx, x, cy, bw, bh, 0.2, 0.36, I_TURQ);
    band(ctx, x, cy, bw, bh, 0.36, 0.42, GOLD);
    for (const f of ['L', 'R'] as const) for (let i = 0; i < 5; i++) faceQuad(ctx, f, x, cy, bw, bh, i * 0.2 + 0.04, i * 0.2 + 0.12, 0.72, 0.86, I_TURQ_D);
    faceQuad(ctx, 'L', x, cy + 4.2 * k, bw, bh, 0.52, 0.86, -0.12, 0.72, I_WINE); // ear flap
    faceQuad(ctx, 'L', x, cy + 4.2 * k, bw, bh, 0.52, 0.86, 0.5, 0.62, I_CREAM);
    faceQuad(ctx, 'L', x, cy + 4.2 * k, bw, bh, 0.52, 0.86, 0.22, 0.3, I_TURQ);
    const tx = x - bw / 2 + 0.69 * (bw / 2);
    line(ctx, tx, cy + 4.6 * k, tx, cy + 8 * k, I_CREAM, 0.7 * k); // braided tie
    ellipse(ctx, tx, cy + 8.6 * k, 0.9 * k, 0.9 * k, I_RED);
    ellipse(ctx, x, cy - bh - 1.2 * k, 1.9 * k, 1.7 * k, I_CREAM);
    ellipse(ctx, x + 0.5 * k, cy - bh - 1.3 * k, 1 * k, 0.9 * k, I_RED);
    for (const dx of [-1.4, 0, 1.4]) line(ctx, x + dx * k, cy - bh - 0.4 * k, x + dx * 1.5 * k, cy - bh + 1.4 * k, I_TURQ, 0.5 * k);
    if (kind === 'explorer') feather(ctx, x + 1.6 * k, cy - bh, x + 3.4 * k, cy - bh - 8 * k, 1.1 * k, '#f4efe0', I_INK); // a curiquinque quill in the cap
    return;
  }
  if (kind === 'defender' || kind === 'knight') {
    // a cane-and-wood helmet: woven cross-hatch, crimson rim, gold sun boss and a tall plume
    const bw = hw + 1.4 * k, cy = top + 3.4 * k, bh = 4.6 * k;
    box(ctx, x, cy, bw, bh, '#c9a86a', '#ddc088');
    for (const f of ['L', 'R'] as const) for (let i = 0; i < 4; i++) {
      faceLine(ctx, f, x, cy, bw, bh, i * 0.25, 0.1, i * 0.25 + 0.25, 0.7, '#8a6a3a', 0.5 * k);
      faceLine(ctx, f, x, cy, bw, bh, i * 0.25, 0.7, i * 0.25 + 0.25, 0.1, '#8a6a3a', 0.5 * k);
    }
    band(ctx, x, cy, bw, bh, 0.0, 0.2, I_WINE);
    band(ctx, x, cy, bw, bh, 0.2, 0.26, GOLD);
    faceQuad(ctx, 'R', x, cy, bw, bh, 0.4, 0.6, 0.3, 0.9, GOLD);
    faceQuad(ctx, 'R', x, cy, bw, bh, 0.46, 0.54, 0.45, 0.75, I_TURQ);
    if (kind === 'knight') faceQuad(ctx, 'L', x, cy + 3.6 * k, bw, bh, 0.5, 0.9, 0, 0.9, '#c9a86a'); // cheek flap
    incaPlume(ctx, x - 1 * k, top - 0.6 * k, k, kind === 'knight' ? 5 : 3, kind === 'knight' ? 12 : 8.5, 0.34, ['#f4efe0', I_WINE, I_TURQ]);
    return;
  }
  // llautu: the wound woollen headband of the Inca, a red mascaipacha fringe and a pair of curiquinque feathers
  const bw = hw + 0.9 * k, cy = top + 3.0 * k, bh = 2.7 * k;
  box(ctx, x, cy, bw, bh, I_WINE, hair);
  band(ctx, x, cy, bw, bh, 0.62, 0.84, I_CREAM);
  band(ctx, x, cy, bw, bh, 0.22, 0.4, I_TURQ);
  band(ctx, x, cy, bw, bh, 0.42, 0.6, GOLD);
  for (const f of ['L', 'R'] as const) for (let i = 0; i < 6; i++) faceQuad(ctx, f, x, cy, bw, bh, i / 6 + 0.03, i / 6 + 0.1, 0.02, 0.2, i % 2 ? I_CREAM : GOLD);
  faceQuad(ctx, 'R', x, cy, bw, bh, 0.28, 0.72, -0.62, 0.05, I_RED); // the fringe on the brow
  for (const u of [0.36, 0.5, 0.64]) faceQuad(ctx, 'R', x, cy, bw, bh, u, u + 0.02, -0.62, 0.05, shade(I_RED, -0.4));
  if (rank) {
    faceQuad(ctx, 'R', x, cy, bw, bh, 0.38, 0.62, 0.1, 1.0, GOLD); // a gold plaque
    faceQuad(ctx, 'R', x, cy, bw, bh, 0.46, 0.54, 0.35, 0.75, I_TURQ);
  }
  const by = top + 0.6 * k;
  if (kind === 'giant') incaPlume(ctx, x, by, k, 9, 13, 0.3, [I_WINE, '#f4efe0', I_TURQ, GOLD]);
  else if (kind === 'swordsman') incaPlume(ctx, x, by, k, 5, 11, 0.36, ['#f4efe0', I_WINE, GOLD]);
  else {
    feather(ctx, x - 2.4 * k, by, x - 3.4 * k, top - 9 * k, 1.4 * k, '#f4efe0', I_INK);
    feather(ctx, x - 0.4 * k, by, x + 0.6 * k, top - 10 * k, 1.4 * k, I_INK, '#f4efe0');
  }
}

/** Champi/macana: a wooden haft crowned with a star-shaped bronze head, a leather wrist thong and a tassel. */
function incaMace(ctx: Ctx, x: number, y: number, k: number, big: boolean) {
  const hx = x + 1.6 * k, hy = y - 10 * k;
  line(ctx, x - 0.4 * k, y + 2.4 * k, hx, hy, WOOD, 1.7 * k);
  line(ctx, x - 0.8 * k, y + 2.4 * k, hx - 0.4 * k, hy, shade(WOOD, 0.35), 0.5 * k);
  for (let i = 0; i < 4; i++) {
    const t = 0.05 + i * 0.09;
    line(ctx, x - 1.4 * k + 2.2 * t * k, y + 1.4 * k - 11 * t * k, x + 0.6 * k + 2.2 * t * k, y + 1 * k - 11 * t * k, i % 2 ? I_CREAM : I_RED, 0.8 * k); // grip wraps
  }
  line(ctx, x - 0.4 * k, y + 2.6 * k, x - 1.6 * k, y + 5.6 * k, I_RED, 0.8 * k); // tassel from the butt
  line(ctx, x - 0.4 * k, y + 2.6 * k, x - 0.2 * k, y + 5.8 * k, I_CREAM, 0.7 * k);
  ellipse(ctx, x - 0.9 * k, y + 6.2 * k, 1 * k, 0.9 * k, I_TURQ);
  // the star head: eight points, a lit upper-left half and a hub
  const R = (big ? 5.4 : 4.2) * k, r = R * 0.5, n = 8;
  const star = (cx: number, cy: number, sc: number) => {
    const pts: number[] = [];
    for (let i = 0; i < n * 2; i++) {
      const rr = (i % 2 ? r : R) * sc, a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
      pts.push(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.95);
    }
    return pts;
  };
  poly(ctx, star(hx + 0.4 * k, hy + 0.4 * k, 1), shade(I_COPPER, -0.35));
  poly(ctx, star(hx, hy, 0.94), I_COPPER);
  poly(ctx, star(hx - 0.5 * k, hy - 0.5 * k, 0.5), shade(I_COPPER, 0.28));
  ellipse(ctx, hx, hy, r * 0.62, r * 0.6, shade(I_COPPER, -0.2));
  ellipse(ctx, hx - 0.3 * k, hy - 0.4 * k, r * 0.35, r * 0.32, shade(I_COPPER, 0.55));
  if (big) for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 - Math.PI / 2 + Math.PI / n; ellipse(ctx, hx + Math.cos(a) * r * 1.3, hy + Math.sin(a) * r * 1.3, 0.55 * k, 0.55 * k, GOLD); }
}

/** The bronze chambi axe: a crescent blade on a long haft, gold-inlaid and tasselled. */
function incaAxe(ctx: Ctx, x: number, y: number, k: number) {
  line(ctx, x - 0.6 * k, y + 4.4 * k, x + 2.4 * k, y - 15 * k, WOOD, 1.7 * k);
  line(ctx, x - 1 * k, y + 4.4 * k, x + 2 * k, y - 15 * k, shade(WOOD, 0.35), 0.5 * k);
  for (let i = 0; i < 4; i++) line(ctx, x - 0.4 * k + i * 0.55 * k, y + 1 * k - i * 3.4 * k, x + 1.6 * k + i * 0.55 * k, y + 0.5 * k - i * 3.4 * k, i % 2 ? I_CREAM : I_RED, 0.8 * k);
  ctx.beginPath();
  ctx.moveTo(x + 2.2 * k, y - 16.6 * k);
  ctx.quadraticCurveTo(x + 13 * k, y - 15 * k, x + 2.8 * k, y - 6.6 * k);
  ctx.quadraticCurveTo(x + 6.6 * k, y - 11.6 * k, x + 2.2 * k, y - 16.6 * k);
  ctx.fillStyle = ink(I_COPPER);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 2.2 * k, y - 16.6 * k);
  ctx.quadraticCurveTo(x + 6.6 * k, y - 11.6 * k, x + 2.8 * k, y - 6.6 * k);
  ctx.lineTo(x + 2.4 * k, y - 11 * k);
  ctx.fillStyle = ink(shade(I_COPPER, -0.3));
  ctx.fill();
  ctx.strokeStyle = ink(shade(I_COPPER, 0.65)); // the bright edge
  ctx.lineWidth = 0.6 * k;
  ctx.beginPath();
  ctx.moveTo(x + 2.4 * k, y - 16.6 * k);
  ctx.quadraticCurveTo(x + 12.4 * k, y - 15 * k, x + 3 * k, y - 6.8 * k);
  ctx.stroke();
  ellipse(ctx, x + 5 * k, y - 12.2 * k, 0.9 * k, 0.9 * k, GOLD);
  ellipse(ctx, x + 2.6 * k, y - 11.6 * k, 1.3 * k, 1.5 * k, '#3a2a1a'); // socket binding
  poly(ctx, [x + 2.8 * k, y - 16.8 * k, x + 2.6 * k, y - 20.6 * k, x + 4.2 * k, y - 16.6 * k], shade(I_COPPER, 0.15)); // spike
  line(ctx, x + 1.6 * k, y - 9 * k, x + 0.6 * k, y - 5.6 * k, I_RED, 0.9 * k); // tassel
  ellipse(ctx, x + 0.5 * k, y - 4.8 * k, 0.9 * k, 0.9 * k, I_TURQ);
}

/** A copper-headed spear bound in wool, with a woven checker pennant and a black-and-white curiquinque feather. */
function incaSpear(ctx: Ctx, x: number, y: number, k: number) {
  line(ctx, x + 1 * k, y + 5 * k, x + 2 * k, y - 17 * k, WOOD, 1.7 * k);
  line(ctx, x + 0.6 * k, y + 5 * k, x + 1.6 * k, y - 17 * k, shade(WOOD, 0.35), 0.5 * k);
  ellipse(ctx, x + 1 * k, y + 5.2 * k, 1.2 * k, 0.9 * k, shade(I_COPPER, -0.2));
  for (let i = 0; i < 5; i++) line(ctx, x + 0.1 * k, y - 1 * k - i * 2.3 * k, x + 2.1 * k, y - 1.4 * k - i * 2.3 * k, i % 2 ? I_CREAM : I_RED, 0.8 * k);
  poly(ctx, [x + 2 * k, y - 23 * k, x + 0.1 * k, y - 17.6 * k, x + 2 * k, y - 16.6 * k], shade(I_COPPER, 0.2));
  poly(ctx, [x + 2 * k, y - 23 * k, x + 3.9 * k, y - 17.6 * k, x + 2 * k, y - 16.6 * k], shade(I_COPPER, -0.25));
  line(ctx, x + 2 * k, y - 22 * k, x + 2 * k, y - 17.2 * k, shade(I_COPPER, -0.5), 0.5 * k);
  ellipse(ctx, x + 1.95 * k, y - 16.4 * k, 1.5 * k, 0.9 * k, '#3a2a1a');
  const px = x + 1.6 * k, py = y - 15.8 * k; // pennant: crimson with a checker edge, swallow-tailed
  poly(ctx, [px, py, px + 7.4 * k, py + 0.8 * k, px + 5.4 * k, py + 2.6 * k, px + 7.4 * k, py + 4.6 * k, px, py + 4 * k], I_WINE);
  for (let i = 0; i < 4; i++) poly(ctx, [px + i * 1.7 * k, py + 0.2 * k + i * 0.2 * k, px + (i + 1) * 1.7 * k, py + 0.4 * k + i * 0.2 * k, px + (i + 1) * 1.7 * k, py + 1.4 * k + i * 0.2 * k, px + i * 1.7 * k, py + 1.2 * k + i * 0.2 * k], i % 2 ? I_CREAM : I_INK);
  line(ctx, px, py + 2.6 * k, px + 5 * k, py + 3 * k, GOLD, 0.6 * k);
  feather(ctx, x + 1.4 * k, y - 17 * k, x - 0.6 * k, y - 24 * k, 1.1 * k, '#f4efe0', I_INK);
}

/** A shield of woven cotton over wood: crimson field, a diamond lattice, a gold sun boss and a fringe. */
function incaShield(ctx: Ctx, x: number, y: number, k: number) {
  const cx = x - 1 * k, cy = y - 6 * k;
  const oct = (rx: number, ry: number) => {
    const c = 0.4;
    return [cx - rx * c, cy - ry, cx + rx * c, cy - ry, cx + rx, cy - ry * c, cx + rx, cy + ry * c, cx + rx * c, cy + ry, cx - rx * c, cy + ry, cx - rx, cy + ry * c, cx - rx, cy - ry * c];
  };
  poly(ctx, oct(5.6 * k, 6.6 * k), '#8a6a3a');
  poly(ctx, oct(4.9 * k, 5.9 * k), I_CREAM);
  poly(ctx, oct(4.2 * k, 5.2 * k), I_WINE);
  poly(ctx, [cx, cy - 4.6 * k, cx + 3.6 * k, cy, cx, cy + 4.6 * k, cx - 3.6 * k, cy], I_TURQ); // the woven diamond
  poly(ctx, [cx, cy - 3.4 * k, cx + 2.6 * k, cy, cx, cy + 3.4 * k, cx - 2.6 * k, cy], I_WINE_D);
  for (const [dx, dy] of [[-2.6, -3.4], [2.6, -3.4], [-2.6, 3.4], [2.6, 3.4]] as const) ellipse(ctx, cx + dx * k, cy + dy * k, 0.7 * k, 0.7 * k, I_CREAM);
  ellipse(ctx, cx, cy, 1.9 * k, 2 * k, GOLD); // sun boss
  ellipse(ctx, cx, cy, 1 * k, 1.1 * k, I_TURQ);
  ellipse(ctx, cx - 0.4 * k, cy - 0.5 * k, 0.4 * k, 0.4 * k, shade(GOLD, 0.6));
  for (let i = 0; i < 6; i++) { // a fringe of wool tassels along the lower rim
    const tx = cx - 3.9 * k + i * 1.56 * k;
    line(ctx, tx, cy + 6.2 * k, tx + 0.1 * k, cy + 9.2 * k, i % 2 ? I_CREAM : I_RED, 0.8 * k);
  }
}

/** A woven sling whirling overhead: a pouch of stones at the end of a wool cord, with a motion trail. */
function incaSling(ctx: Ctx, b: Body, k: number) {
  const { x, y } = b.hand;
  const cx = x + 0.6 * k, cy = y - 14 * k, rx = 8.4 * k, ry = 3.4 * k;
  const a0 = -0.55;
  const P = (a: number) => ({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
  ctx.lineCap = 'round';
  for (const [from, to, al, lw] of [[a0 - 3.2, a0 - 1.9, 0.14, 1.3], [a0 - 1.9, a0 - 1, 0.28, 1.7], [a0 - 1, a0 - 0.5, 0.42, 1.9]] as const) { // a fading motion trail
    ctx.strokeStyle = `rgba(255,255,255,${al})`;
    ctx.lineWidth = lw * k;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, from, to);
    ctx.stroke();
  }
  const pouch = P(a0), tail = P(a0 - 0.55);
  line(ctx, x - 0.2 * k, y - 1.4 * k, pouch.x, pouch.y, I_CREAM, 0.95 * k); // the held cord
  line(ctx, x - 0.2 * k, y - 1.4 * k, pouch.x, pouch.y, I_WINE, 0.25 * k);
  ctx.strokeStyle = '#e6d3ad'; // the free cord, streaming behind
  ctx.lineWidth = 0.6 * k;
  ctx.beginPath();
  ctx.moveTo(pouch.x, pouch.y);
  ctx.quadraticCurveTo((pouch.x + tail.x) / 2, (pouch.y + tail.y) / 2 - 2 * k, tail.x, tail.y);
  ctx.stroke();
  ellipse(ctx, tail.x, tail.y, 0.7 * k, 0.7 * k, I_WINE); // its knotted finger loop
  const px = pouch.x, py = pouch.y; // the pouch: a woven diamond of crimson, cream and turquoise, with a stone in it
  poly(ctx, [px - 3.2 * k, py, px, py - 1.9 * k, px + 3.2 * k, py, px, py + 1.9 * k], I_WINE);
  poly(ctx, [px - 1.8 * k, py, px, py - 1 * k, px + 1.8 * k, py, px, py + 1 * k], I_TURQ);
  line(ctx, px - 3.2 * k, py, px + 3.2 * k, py, I_CREAM, 0.4 * k);
  ellipse(ctx, px, py - 1.5 * k, 1.6 * k, 1.4 * k, '#8a8a92');
  ellipse(ctx, px - 0.5 * k, py - 1.9 * k, 0.6 * k, 0.5 * k, '#c4c4cc');
  ellipse(ctx, px + 4.2 * k, py - 1.8 * k, 0.5 * k, 0.5 * k, '#b4b4bc'); // a stone in flight
  for (const [dx, dy] of [[0, 0], [1.6, 0.5], [0.7, -1.5]] as const) { // a fistful of spare stones in the other hand
    ellipse(ctx, b.off.x + dx * k, b.off.y + 2.4 * k + dy * k, 1.1 * k, 1 * k, '#8a8a92');
    ellipse(ctx, b.off.x + (dx - 0.3) * k, b.off.y + 2 * k + dy * k, 0.4 * k, 0.35 * k, '#c4c4cc');
  }
}

/** The slinger's chuspa: a woven bag of stones carried on the back. */
function incaBag(ctx: Ctx, x: number, y: number, k: number) {
  const bx = x - 7 * k;
  box(ctx, bx, y - 7.4 * k, 4.4 * k, 7 * k, I_WINE);
  tocapu(ctx, bx, y - 7.4 * k, 4.4 * k, 7 * k, 0.5, 0.72, 2, 2, I_INK, I_CREAM);
  band(ctx, bx, y - 7.4 * k, 4.4 * k, 7 * k, 0.2, 0.32, I_TURQ);
  band(ctx, bx, y - 7.4 * k, 4.4 * k, 7 * k, 0.32, 0.36, GOLD);
  for (const [dx, dy, r] of [[-1, -14.6, 1.5], [0.8, -15.2, 1.7], [2, -14.4, 1.3]] as const) { // round stones peeking out
    ellipse(ctx, bx + dx * k - 0.6 * k, y + dy * k, r * k, r * 0.9 * k, '#8a8a92');
    ellipse(ctx, bx + dx * k - 1 * k, y + (dy - 0.4) * k, r * 0.4 * k, r * 0.35 * k, '#c4c4cc');
  }
  for (const dx of [-1.4, 0, 1.4]) line(ctx, bx + dx * k, y - 7.2 * k, bx + dx * k - 0.4 * k, y - 4.6 * k, dx ? I_RED : I_CREAM, 0.7 * k); // tassels
}

/** A quipu: a knotted cord record hung from the explorer's staff. */
function incaQuipu(ctx: Ctx, x: number, y: number, k: number) {
  line(ctx, x - 4.4 * k, y - 0.6 * k, x + 0.4 * k, y + 0.4 * k, '#3a2a1a', 0.9 * k);
  const cols = [I_WINE, I_CREAM, I_TURQ, GOLD, I_INK, I_RED];
  for (let i = 0; i < 6; i++) {
    const cx = x - 4 * k + i * 0.86 * k, cy = y - 0.4 * k + i * 0.16 * k, len = (3.6 + ((i * 7) % 3)) * k;
    line(ctx, cx, cy, cx - 0.3 * k, cy + len, cols[i], 0.6 * k);
    for (const t of [0.35, 0.7]) ellipse(ctx, cx - 0.2 * k * t, cy + len * t, 0.5 * k, 0.5 * k, shade(cols[i], -0.2));
  }
}

// ---- llama mounts and wildlife

/**
 * A llama: woolly body with patches, a long neck, banana ears with yarn tassels, a halter and (optionally) a woven
 * blanket. Returns the saddle point.
 */
export function drawLlama(ctx: Ctx, x: number, y: number, k: number, wool: string, patch: string, cloth?: string, caparison = false, tack = true) {
  const leg = shade(patch, -0.1);
  const legs: [number, number][] = [[-5.4, -1.4], [-2.8, 0.4], [4, -0.4], [6.6, 1.4]];
  for (const [lx, ly] of legs) {
    box(ctx, x + lx * k, y + ly * k, 1.9 * k, 8.4 * k, leg);
    faceQuad(ctx, 'R', x + lx * k, y + ly * k, 1.9 * k, 8.4 * k, 0, 1, 0.36, 0.5, shade(wool, -0.05)); // woolly knee tuft
    faceQuad(ctx, 'L', x + lx * k, y + ly * k, 1.9 * k, 8.4 * k, 0, 1, 0.36, 0.5, shade(wool, -0.05));
    box(ctx, x + lx * k, y + ly * k, 2.3 * k, 1.1 * k, '#3a2a1a'); // padded toes
  }
  ellipse(ctx, x - 8.6 * k, y - 14.2 * k, 1.6 * k, 2.4 * k, shade(wool, -0.1)); // tail
  ellipse(ctx, x - 9.2 * k, y - 15.6 * k, 1 * k, 1.5 * k, patch);
  box(ctx, x, y - 8.2 * k, 15.6 * k, 7.6 * k, wool);
  band(ctx, x, y - 8.2 * k, 15.6 * k, 7.6 * k, 0, 0.14, shade(wool, -0.28)); // shaded belly
  faceQuad(ctx, 'R', x, y - 8.2 * k, 15.6 * k, 7.6 * k, 0.5, 0.96, 0.3, 0.9, patch); // a brown patch over the shoulder
  faceQuad(ctx, 'L', x, y - 8.2 * k, 15.6 * k, 7.6 * k, 0.1, 0.44, 0.4, 0.95, patch);
  for (const [ox, oy] of [[-6, -15.8], [-2.6, -16.6], [1.4, -16.4], [5, -15.4]] as const) ellipse(ctx, x + ox * k, y + oy * k + 0.6 * k, 2.4 * k, 1.5 * k, shade(wool, 0.06)); // a woolly, lumpy back
  if (cloth) {
    band(ctx, x - 0.6 * k, y - 8.2 * k, 10 * k, 7.6 * k, 0.24, 0.94, cloth);
    band(ctx, x - 0.6 * k, y - 8.2 * k, 10 * k, 7.6 * k, 0.24, 0.32, GOLD);
    tocapu(ctx, x - 0.6 * k, y - 8.2 * k, 10 * k, 7.6 * k, 0.32, 0.52, 5, 2, I_INK, I_CREAM);
    band(ctx, x - 0.6 * k, y - 8.2 * k, 10 * k, 7.6 * k, 0.86, 0.94, I_TURQ);
    for (let i = 0; i < 6; i++) line(ctx, x - 5.2 * k + i * 1.6 * k, y - 2.9 * k + i * 0.4 * k, x - 5.3 * k + i * 1.6 * k, y - 0.6 * k + i * 0.4 * k, i % 2 ? I_CREAM : GOLD, 0.7 * k); // tassels along the hem
  }
  // the neck rises in a long, gentle S
  box(ctx, x + 7 * k, y - 13.4 * k, 4.8 * k, 8 * k, wool);
  box(ctx, x + 8.8 * k, y - 19.4 * k, 4.2 * k, 8 * k, wool);
  faceQuad(ctx, 'R', x + 8.8 * k, y - 19.4 * k, 4.2 * k, 8 * k, 0, 1, 0.1, 0.9, shade(wool, 0.07));
  faceQuad(ctx, 'L', x + 8.8 * k, y - 19.4 * k, 4.2 * k, 8 * k, 0.15, 0.6, 0.2, 0.7, shade(patch, 0.2)); // a darker patch on the neck
  for (const [ox, oy] of [[6.4, -14.2], [8, -17.8], [9.4, -21.2]] as const) ellipse(ctx, x + ox * k, y + oy * k, 2.4 * k, 1.7 * k, shade(wool, 0.08)); // ruff
  if (!tack) { /* wild: no collar */ } else if (caparison) {
    band(ctx, x + 7 * k, y - 13.4 * k, 4.8 * k, 8 * k, 0.3, 0.5, I_WINE); // a woven collar
    band(ctx, x + 7 * k, y - 13.4 * k, 4.8 * k, 8 * k, 0.5, 0.56, GOLD);
  } else band(ctx, x + 7 * k, y - 13.4 * k, 4.8 * k, 8 * k, 0.3, 0.42, I_RED); // a red yarn collar
  // the head
  const hx = x + 11.4 * k, hy = y - 26.8 * k;
  box(ctx, hx, hy, 5.8 * k, 5 * k, shade(wool, 0.04));
  box(ctx, hx + 3.6 * k, hy + 0.8 * k, 3.4 * k, 3 * k, shade(patch, 0.1)); // the muzzle
  faceQuad(ctx, 'R', hx + 3.6 * k, hy + 0.8 * k, 3.4 * k, 3 * k, 0.5, 0.75, 0.3, 0.55, '#1a1010'); // nostril
  faceQuad(ctx, 'R', hx, hy, 5.8 * k, 5 * k, 0.4, 0.6, 0.45, 0.75, '#101010'); // eye
  faceQuad(ctx, 'R', hx, hy, 5.8 * k, 5 * k, 0.48, 0.54, 0.62, 0.72, '#ffffff');
  ellipse(ctx, hx, hy - 5.2 * k, 2.6 * k, 1.5 * k, shade(wool, 0.1)); // a topknot of wool
  for (const [ex, ec] of [[-1.1, I_WINE], [1.9, I_RED]] as const) { // banana ears with yarn tassels
    poly(ctx, [hx + ex * k, hy - 5 * k, hx + (ex + 0.4) * k, hy - 10.6 * k, hx + (ex + 1.9) * k, hy - 5.6 * k], shade(patch, 0.08));
    poly(ctx, [hx + (ex + 0.4) * k, hy - 10.6 * k, hx + (ex + 1.9) * k, hy - 5.6 * k, hx + (ex + 1.2) * k, hy - 5 * k], shade(patch, -0.2));
    ellipse(ctx, hx + (ex + 0.6) * k, hy - 7 * k, 0.7 * k, 0.7 * k, ec);
  }
  if (tack) {
    line(ctx, hx + 2.6 * k, hy - 2.8 * k, hx + 4.2 * k, hy - 0.4 * k, I_RED, 0.8 * k); // halter: cheek strap and noseband
    line(ctx, hx + 1.4 * k, hy - 3.6 * k, hx + 2.6 * k, hy - 2.8 * k, I_CREAM, 0.6 * k);
    ctx.strokeStyle = ink(I_CREAM);
    ctx.lineWidth = 0.55 * k;
    ctx.beginPath();
    ctx.moveTo(hx + 5 * k, hy);
    ctx.quadraticCurveTo(x + 10 * k, y - 11 * k, x + 2.4 * k, y - 12.6 * k);
    ctx.stroke();
  }
  return { x: x - 0.6 * k, y: y - 15.6 * k };
}

/** Riders on llamas: a crimson unku, a cane helm, a copper-headed spear and a woven shield. */
function drawIncaRider(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  const knight = kind === 'knight';
  const saddle = drawLlama(ctx, x - 1, y + 4, 1.14, knight ? '#f3ecdc' : '#dccca6', knight ? '#c9b48a' : '#8a6a44', knight ? I_WINE : undefined, knight);
  if (!knight) { // a striped woollen blanket for the scouts
    const sx = saddle.x, sy = saddle.y;
    poly(ctx, [sx - 6, sy - 1, sx + 4, sy - 1, sx + 3.6, sy + 6.8, sx - 1.4, sy + 5, sx - 5.4, sy + 8], I_WINE);
    poly(ctx, [sx - 6, sy - 1, sx + 4, sy - 1, sx + 3.9, sy + 0.6, sx - 5.8, sy + 0.6], GOLD);
    for (let i = 0; i < 4; i++) line(ctx, sx - 4.6 + i * 2.4, sy + 2 + i * 0.3, sx - 4.6 + i * 2.4, sy + 6.6 - i * 0.3, i % 2 ? I_CREAM : I_TURQ, 1);
    for (let i = 0; i < 5; i++) line(ctx, sx - 5 + i * 1.8, sy + 7.6 - i * 0.6, sx - 5 + i * 1.8, sy + 9.4 - i * 0.6, i % 2 ? I_CREAM : I_RED, 0.6);
  }
  const b = figure(ctx, kind, 'inca', saddle.x, saddle.y, 0.82, true);
  drawShield(ctx, 'inca', kind, b.off.x - 1, b.off.y - 0.5, 0.64);
  incaSpear(ctx, b.hand.x, b.hand.y, knight ? 0.95 : 0.88);
}

/** A wooden log-sledge frame that hurls stones from a sling of woven rope. */
function incaCatapult(ctx: Ctx, x: number, y: number) {
  const wood = '#8a5a2b', dk = '#5a3b1e', rope = '#e6d3ad';
  for (const rx of [-9, -1, 7]) { // log rollers under the sledge
    ellipse(ctx, x + rx, y + 3.2, 4.4, 1.7, '#3f2814');
    ellipse(ctx, x + rx - 0.3, y + 2.8, 3.8, 1.3, '#7a5230');
    ellipse(ctx, x + rx + 2.4, y + 3.2, 1.1, 0.95, '#c9a878');
  }
  box(ctx, x, y - 1, 19, 3, wood);
  band(ctx, x, y - 1, 19, 3, 0.3, 0.7, I_WINE);
  tocapu(ctx, x, y - 1, 19, 3, 0.7, 1, 6, 1, I_INK, I_CREAM);
  line(ctx, x - 7, y - 2, x - 0.5, y - 22, dk, 3); // the A-frame
  line(ctx, x + 6, y + 0, x - 0.5, y - 22, shade(dk, 0.1), 3);
  line(ctx, x - 7.6, y - 2, x - 1.1, y - 22, shade(wood, 0.3), 0.6);
  line(ctx, x - 4.6, y - 10.6, x + 3.6, y - 9.6, dk, 2.2); // crossbar
  for (const [cx0, cy0] of [[-3.6, -17], [2.6, -17]] as const) { // cross-lashings
    line(ctx, x + cx0 - 1.4, y + cy0, x + cx0 + 1.4, y + cy0 + 3.4, rope, 0.9);
    line(ctx, x + cx0 + 1.4, y + cy0, x + cx0 - 1.4, y + cy0 + 3.4, rope, 0.9);
  }
  for (const [sx, sy] of [[-3.2, -10.2], [3.2, -9.4]] as const) { // twisted skeins of rope wound on the crossbar
    ellipse(ctx, x + sx, y + sy, 3.1, 1.9, '#d8c8a0');
    for (let i = -2; i <= 2; i++) line(ctx, x + sx + i * 1.1 - 0.5, y + sy - 1.6, x + sx + i * 1.1 + 0.5, y + sy + 1.6, '#8a7a56', 0.55);
    ring(ctx, x + sx, y + sy, 3.1, 1.9, '#8a7a56', 0.5);
  }
  line(ctx, x - 9, y - 6, x + 12, y - 30, '#6b4424', 3); // the throwing arm
  line(ctx, x - 9, y - 7, x + 11.6, y - 30.8, shade('#6b4424', 0.35), 0.7);
  ellipse(ctx, x - 0.4, y - 20.4, 1.8, 1.8, GOLD); // a gilded pivot pin
  ellipse(ctx, x - 0.8, y - 20.8, 0.6, 0.6, shade(GOLD, 0.6));
  for (const t of [0.72, 0.8, 0.88]) line(ctx, x - 9 + 21 * t - 1, y - 6 - 24 * t + 1, x - 9 + 21 * t + 1, y - 6 - 24 * t - 1, t > 0.78 ? I_RED : I_CREAM, 0.9); // wool wraps
  const T = { x: x + 12, y: y - 30 }; // the woven sling: two cords into a net basket carrying a stone
  line(ctx, T.x, T.y, T.x + 4, T.y + 3.4, rope, 0.8);
  line(ctx, T.x, T.y, T.x - 1.4, T.y + 4.4, rope, 0.8);
  ellipse(ctx, T.x + 1.4, T.y + 4.8, 4.2, 2.6, '#c9b88a');
  for (let i = -3; i <= 3; i++) line(ctx, T.x + 1.4 + i * 1.1, T.y + 2.6, T.x + 1.4 + i * 0.9, T.y + 7, '#8a7a56', 0.4);
  ring(ctx, T.x + 1.4, T.y + 4.8, 4.2, 2.6, I_WINE, 0.7);
  ellipse(ctx, T.x + 1.4, T.y + 2.4, 2.8, 2.6, '#8a8a92');
  ellipse(ctx, T.x + 0.6, T.y + 1.6, 1, 0.9, '#c4c4cc');
  line(ctx, x - 9, y - 6, x - 12, y + 3, rope, 1.6); // the pull cable to a stake, barber-pole wound
  for (let i = 0; i < 4; i++) line(ctx, x - 9.4 - i * 0.7, y - 4.6 + i * 2.2, x - 10.8 - i * 0.7, y - 3.8 + i * 2.2, i % 2 ? I_RED : I_CREAM, 1.2);
  ellipse(ctx, x - 12, y + 3.6, 1.5, 1.2, '#5a3b1e');
  const fx = x + 7, fy = y - 1; // a standard: crimson checker banner under a gold sun
  line(ctx, fx, fy, fx, fy - 19, '#5a3b1e', 1.2);
  poly(ctx, [fx, fy - 18, fx + 8, fy - 16.4, fx + 6.4, fy - 13.6, fx + 8, fy - 11, fx, fy - 12], I_WINE);
  for (let i = 0; i < 4; i++) poly(ctx, [fx + i * 1.7, fy - 18 + i * 0.4, fx + (i + 1) * 1.7, fy - 17.7 + i * 0.4, fx + (i + 1) * 1.7, fy - 16.5 + i * 0.4, fx + i * 1.7, fy - 16.8 + i * 0.4], i % 2 ? I_CREAM : I_INK);
  ellipse(ctx, fx, fy - 20, 1.7, 1.7, GOLD);
  ellipse(ctx, fx - 0.4, fy - 20.4, 0.6, 0.6, shade(GOLD, 0.6));
}

/** Reed (totora) boats: bundles lashed with wool, both ends curling up, a woven square sail, and warriors aboard. */
function drawIncaBoat(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  const tier = kind === 'warship' ? 2 : kind === 'ship' ? 1 : 0;
  const s = 1 + tier * 0.14;
  const w = 16 + tier * 3;
  const N = 16;
  const rail = (t: number) => y - 6 - 9 * Math.pow(Math.abs(2 * t - 1), 2.3) * (t > 0.5 ? 1.3 : 0.9);
  const keel = (t: number) => rail(t) + 0.4 + (tier === 2 ? 12.4 : 11) * Math.pow(Math.sin(Math.PI * t), 0.75);
  const X = (t: number) => x - w + (2 * w + 4) * t;
  const at = (f: number) => { const p: number[] = []; for (let i = 0; i <= N; i++) { const t = i / N; p.push(X(t), rail(t) + (keel(t) - rail(t)) * f); } return p; };
  const rev = (p: number[]) => { const o: number[] = []; for (let i = p.length - 2; i >= 0; i -= 2) o.push(p[i], p[i + 1]); return o; };
  poly(ctx, [...at(0), ...rev(at(1))], shade(I_REED, -0.28)); // the lower bundle, in shadow
  poly(ctx, [...at(0), ...rev(at(0.6))], shade(I_REED, 0.05));
  poly(ctx, [...at(0), ...rev(at(0.22))], shade(I_REED, 0.3));
  ctx.strokeStyle = shade(I_REED, -0.45);
  ctx.lineWidth = 0.5;
  for (const f of [0.22, 0.6]) { // the seams between bundles
    ctx.beginPath();
    const p = at(f);
    for (let i = 0; i < p.length; i += 2) i ? ctx.lineTo(p[i], p[i + 1]) : ctx.moveTo(p[i], p[i + 1]);
    ctx.stroke();
  }
  for (let i = 1; i < 10; i++) { // wool lashings around the bundles
    const t = i / 10;
    line(ctx, X(t) - 0.4, rail(t) - 0.2, X(t) - 1, keel(t) + 0.2, i % 2 ? I_RED : I_CREAM, 1.1);
    if (i % 2) line(ctx, X(t) - 0.4, rail(t) - 0.2, X(t) - 1, keel(t) + 0.2, I_TURQ, 0.4);
  }
  const curl = (bx: number, by: number, dir: number, len: number) => { // the bundles are tied off and sweep up
    ctx.lineCap = 'round';
    ctx.strokeStyle = ink(shade(I_REED, 0.05));
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + dir * 1.8, by - len * 0.6, bx + dir * 0.6, by - len);
    ctx.quadraticCurveTo(bx - dir * 1.4, by - len - 2.2, bx - dir * 3.4, by - len + 1.2); // the curled tip
    ctx.stroke();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = ink(shade(I_REED, 0.4));
    ctx.beginPath();
    ctx.moveTo(bx - 0.5, by);
    ctx.quadraticCurveTo(bx + dir * 1.2, by - len * 0.6, bx + dir * 0.2, by - len);
    ctx.quadraticCurveTo(bx - dir * 1.4, by - len - 2.6, bx - dir * 3.4, by - len + 0.8);
    ctx.stroke();
    line(ctx, bx + dir * 0.6, by - len * 0.32, bx + dir * 1.2, by - len * 0.4, I_RED, 1.5);
    line(ctx, bx + dir * 0.7, by - len * 0.6, bx + dir * 0.3, by - len * 0.7, I_CREAM, 1.3);
    ellipse(ctx, bx - dir * 3.4, by - len + 1.4, 1.3, 1.3, I_RED);
  };
  curl(X(1) - 0.6, rail(1) + 0.4, 1, 9 + tier * 1.5);
  curl(X(0) + 0.4, rail(0) + 0.4, -1, 6.5 + tier);
  if (tier === 2) { // a gilded sun at the bow, tassels streaming
    ellipse(ctx, X(1) - 1.6, rail(1) - 6.4, 2.2, 2.2, GOLD);
    ellipse(ctx, X(1) - 1.6, rail(1) - 6.4, 1.1, 1.1, I_TURQ);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; // foam
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x + 2, y + 3.4, w * 0.72, 2.3, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.stroke();
  for (let i = 0; i < 2 + tier; i++) { // paddles dipping in the water
    const px = x - w * 0.4 + i * 9;
    line(ctx, px + 2, y - 5, px - 3, y + 5.6, '#6b4424', 0.9);
    ellipse(ctx, px - 3.4, y + 6.2, 1, 1.7, '#8a5a2b');
    ellipse(ctx, px - 3.4, y + 6.2, 0.4, 0.9, I_RED);
  }
  if (tier >= 1) for (let i = 0; i < 3 + tier; i++) { // round shields hung along the rail
    const t = 0.26 + i * (0.5 / (2 + tier)), sx = X(t), sy = rail(t) + 0.4;
    ellipse(ctx, sx, sy, 2.1, 2.1, i % 2 ? I_CREAM : I_WINE);
    ellipse(ctx, sx, sy, 1.2, 1.2, I_TURQ);
    ellipse(ctx, sx, sy, 0.5, 0.5, GOLD);
  }
  if (tier >= 1) { // a thatched deckhouse at the stern
    const hx = x - w * 0.5;
    box(ctx, hx, y - 5.6, 7, 4.2, '#9a8a70');
    tocapu(ctx, hx, y - 5.6, 7, 4.2, 0.5, 0.75, 3, 1, I_INK, I_CREAM);
    roof(ctx, hx, y - 9.8, 9, 4.6, '#c9a45a');
  }
  const mt = y - (36 + tier * 6), mx = x - 1;
  line(ctx, mx, y - 5, mx, mt - 1, '#5a3b1e', 2);
  line(ctx, mx - 12 * s, mt + 3.4, mx + 14 * s, mt + 1.6, '#6b4424', 1.5); // the yard
  const bot = y - 15 - tier * 1.5;
  poly(ctx, [mx + 0.6, mt + 2.4, mx + 14 * s, mt + 2, mx + 13 * s, bot - 1.6, mx + 0.6, bot], I_CREAM);
  poly(ctx, [mx - 0.6, mt + 2.6, mx - 12 * s, mt + 3.8, mx - 11 * s, bot - 1, mx - 0.6, bot], shade(I_CREAM, -0.12));
  for (const f of [0.2, 0.52, 0.84]) { // crimson warp stripes
    line(ctx, mx + 0.6 + 12.4 * s * f, mt + 2.4, mx + 0.6 + 12.4 * s * f, bot - 1.6 * f - 0.4 + 0.6, I_WINE, 1.7 * s);
    line(ctx, mx - 0.6 - 10.4 * s * f, mt + 3, mx - 0.6 - 10.4 * s * f, bot - f, shade(I_WINE, -0.15), 1.5 * s);
  }
  const cy0 = mt + 2.6 + (bot - mt) * 0.42;
  for (let i = 0; i < 5; i++) { // a tocapu checker band across the sail
    const x0 = mx + 0.6 + i * 2.5 * s, x1 = mx + 0.6 + (i + 1) * 2.5 * s;
    poly(ctx, [x0, cy0 - 1.6 + i * 0.05, x1, cy0 - 1.6 + (i + 1) * 0.05, x1, cy0 + 1.4 + (i + 1) * 0.05, x0, cy0 + 1.4 + i * 0.05], i % 2 ? I_CREAM : I_INK);
  }
  ellipse(ctx, mx + 6.6 * s, cy0 + 7, 2.8, 2.8, GOLD); // a sun disc
  ellipse(ctx, mx + 6.6 * s, cy0 + 7, 1.5, 1.5, I_TURQ);
  for (let i = 0; i < 6; i++) line(ctx, mx + 0.8 + i * 2.2 * s, bot - 0.2, mx + 0.8 + i * 2.2 * s, bot + 2.4, i % 2 ? I_CREAM : I_RED, 0.7); // the fringe
  poly(ctx, [mx, mt - 2, mx + 9, mt - 0.4, mx + 7.4, mt + 0.6, mx + 9, mt + 1.8, mx, mt + 1], I_WINE); // a pennant with a checker end
  poly(ctx, [mx + 4.4, mt - 1.3, mx + 6.2, mt - 1, mx + 6.2, mt + 0.5, mx + 4.4, mt + 0.3], I_CREAM);
  ellipse(ctx, mx, mt - 2.6, 1.2, 1.2, GOLD);
  line(ctx, mx, mt + 1, X(1) - 1, rail(1) - 1, '#3a2a1a', 0.5);
  line(ctx, mx, mt + 1, X(0) + 1, rail(0) - 1, '#3a2a1a', 0.5);
  const spots = tier === 0 ? [-9] : tier === 1 ? [-3, 9] : [-6, 3, 11]; // the crew
  spots.forEach((px, i) => {
    const kind2: UnitKind = tier === 2 && i === spots.length - 1 ? 'swordsman' : i % 2 ? 'warrior' : 'slinger';
    figure(ctx, kind2, 'inca', x + px, rail((px + w) / (2 * w + 4)) + 0.2, 0.46, true);
  });
}

/** A llama in the wild: a woolly, patched, banana-eared grazer for the map. */
function drawWildLlama(ctx: Ctx, x: number, y: number, k: number, wool: string) {
  drawLlama(ctx, x, y, 0.8 * k, wool, shade('#9a7448', 0.05), undefined, false, false);
}

/** The checked cloak: green and red bands across the back, a red hem. */
function celtCloak(ctx: Ctx, x: number, top: number, hip: number, k: number) {
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const quad = (p: number[], base: string) => {
    // p: TL, TR, BR, BL as x,y pairs; weft and warp bands laid across it
    const at = (u: number, v: number) => [lerp(lerp(p[0], p[2], u), lerp(p[6], p[4], u), v), lerp(lerp(p[1], p[3], u), lerp(p[7], p[5], u), v)];
    for (const [u0, u1] of [[0.2, 0.36], [0.62, 0.78]]) poly(ctx, [...at(u0, 0), ...at(u1, 0), ...at(u1, 1), ...at(u0, 1)], mix(base, CG, 0.75));
    for (const [v0, v1] of [[0.22, 0.4], [0.66, 0.8]]) poly(ctx, [...at(0, v0), ...at(1, v0), ...at(1, v1), ...at(0, v1)], mix(base, CR, 0.7));
    for (const u of [0.46, 0.9]) poly(ctx, [...at(u, 0), ...at(u + 0.04, 0), ...at(u + 0.04, 1), ...at(u, 1)], mix(base, CY, 0.7));
    poly(ctx, [...at(0, 0.9), ...at(1, 0.9), ...at(1, 1), ...at(0, 1)], CR);
  };
  quad([x - 4 * k, top, x + 1 * k, top - 0.5 * k, x - 2 * k, hip + 8.5 * k, x - 9.5 * k, hip + 6.5 * k], shade('#a8743a', -0.22));
  quad([x - 4 * k, top, x - 6.5 * k, top + 3 * k, x - 9.5 * k, hip + 6.5 * k, x - 7 * k, hip + 2 * k], '#a8743a');
  line(ctx, x - 4 * k, top + 0.5 * k, x - 8.6 * k, hip + 6.2 * k, shade('#5a3a18', -0.2), 0.6 * k);
}

/** Trews: wool trousers checked in red and yellow over green, gathered at the ankle. */
function celtTrews(ctx: Ctx, f: 'L' | 'R', cx: number, cy: number, k: number, legs: string, sv: number, robe: boolean) {
  const A = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, f, cx, cy, 3.6 * k, 5.2 * k, u0, u1, v0, v1, c);
  if (robe) { A(0, 1, sv + 0.07, 1, legs); A(0, 1, 0.9, 1, CG); return; }
  A(0, 1, sv + 0.07, 1, legs);
  A(0.08, 0.34, sv + 0.07, 1, mix(legs, CR, 0.65));
  A(0.62, 0.7, sv + 0.07, 1, mix(legs, CY, 0.65));
  A(0, 1, 0.44, 0.52, mix(legs, CR, 0.6));
  A(0, 1, 0.72, 0.78, mix(legs, CY, 0.6));
  A(0.08, 0.34, 0.44, 0.52, mix(legs, CR, 0.95));
  A(0, 1, 0.92, 1, shade(legs, -0.28));
  A(0, 1, sv, sv + 0.07, '#8a5a2b'); // the leather ankle wrapping
}

/** Harness for the Celtic horse: a checked saddle cloth, a chest strap hung with enamelled bronze discs, a bronze frontlet and a plume. */
function celtHorseGear(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  const X = x - 1, Y = y + 3, k = 0.95;
  const knight = kind === 'knight';
  if (knight) for (const f of ['L', 'R'] as const) tartan(ctx, f, X, Y - 6 * k, 17 * k, 7 * k, 0, 1, 0.1, 0.56, CT, CG, CR); // the full checked caparison
  for (const f of ['L', 'R'] as const) tartan(ctx, f, X - 1 * k, Y - 6 * k, 9 * k, 7 * k, 0, 1, 0.62, 0.92, CT, CG, CR);
  line(ctx, x + 3.5, y - 9.6, x + 8, y - 3.4, CLE, 0.9);
  for (const t of [0.12, 0.5, 0.88]) { ellipse(ctx, x + 3.5 + 4.5 * t, y - 9.6 + 6.2 * t, 1.2, 1.2, BRONZE); ellipse(ctx, x + 3.5 + 4.5 * t, y - 9.6 + 6.2 * t, 0.55, 0.55, CR); }
  const hx = X + 10.5 * k, hy = Y - 15 * k;
  faceQuad(ctx, 'R', hx, hy, 7 * k, 5 * k, 0.4, 0.62, 0.55, 1, BRONZE); // the frontlet
  faceQuad(ctx, 'R', hx, hy, 7 * k, 5 * k, 0.46, 0.56, 0.8, 0.94, CR);
  poly(ctx, [hx - 0.4, hy - 4.6, hx - 1.6, hy - 9.4, hx + 0.4, hy - 8, hx + 1.4, hy - 10, hx + 2, hy - 4.6], CR); // a tall plume between the ears
  poly(ctx, [hx + 0.4, hy - 8, hx + 1.4, hy - 10, hx + 2, hy - 4.6, hx + 0.9, hy - 4.6], shade(CR, 0.3));
  ellipse(ctx, hx + 3.4 * k, hy + 3 * k, 0.8, 0.8, CY); // a bridle tassel at the muzzle
}

/** A riding spear: a bronze leaf blade, a red horsehair tuft and a checked pennon. */
function celtLance(ctx: Ctx, hx: number, hy: number, thick: number) {
  const tx = hx + 8, ty = hy - 20;
  line(ctx, hx - 3, hy + 6, tx, ty, WOOD, thick);
  line(ctx, hx - 3.6, hy + 6, tx - 0.6, ty, shade(WOOD, 0.35), 0.5);
  for (const t of [0.1, 0.16, 0.22]) line(ctx, hx - 3 + 11 * t - 1, hy + 6 - 26 * t + 0.4, hx - 3 + 11 * t + 1, hy + 6 - 26 * t - 0.4, CR, 0.8); // grip wraps
  ellipse(ctx, hx - 0.4, hy + 0.4, 2.4, 1.4, BRONZE);
  poly(ctx, [tx + 0.6, ty - 7, tx - 1.8, ty - 1.2, tx + 0.4, ty + 0.8], shade(CI, 0.25));
  poly(ctx, [tx + 0.6, ty - 7, tx + 2.4, ty - 1.2, tx + 0.4, ty + 0.8], shade(CI, -0.25));
  poly(ctx, [tx - 1, ty + 0.6, tx + 1.8, ty + 0.4, tx + 1.4, ty + 2.4, tx - 0.8, ty + 2.6], BRONZE);
  poly(ctx, [tx + 0.4, ty + 2.6, tx + 7.6, ty + 3.4, tx + 5.2, ty + 5.4, tx + 7.6, ty + 7.6, tx - 0.2, ty + 6.6], CR);
  poly(ctx, [tx + 0.2, ty + 4.4, tx + 6.2, ty + 5, tx + 6, ty + 6, tx + 0, ty + 5.4], CG);
  poly(ctx, [tx + 0.2, ty + 3.2, tx + 6.6, ty + 3.8, tx + 6.4, ty + 4.3, tx + 0.1, ty + 3.7], CY);
}

/** Antlers: two branching beams rising from a point. */
function antlerPair(ctx: Ctx, x: number, y: number, k: number, color: string, w: number) {
  for (const s of [-1, 1]) {
    line(ctx, x, y, x + s * 3 * k, y - 5 * k, color, w);
    line(ctx, x + s * 3 * k, y - 5 * k, x + s * 2.4 * k, y - 10 * k, color, w * 0.9);
    line(ctx, x + s * 3 * k, y - 5 * k, x + s * 6.4 * k, y - 8 * k, color, w * 0.8);
    line(ctx, x + s * 2.4 * k, y - 10 * k, x + s * 4.6 * k, y - 12 * k, color, w * 0.7);
    line(ctx, x + s * 2.4 * k, y - 10 * k, x + s * 1.2 * k, y - 12.6 * k, color, w * 0.7);
    line(ctx, x + s * 1.6 * k, y - 2.6 * k, x + s * 4 * k, y - 3 * k, color, w * 0.7);
  }
}

/** The Celtic siege engine: a sling-beam between two oak trunks, a wicker basket of stones, a net of boulders as counterweight, stag antlers on top. */
function celtCatapult(ctx: Ctx, x: number, y: number, wheels: (hub: string) => void) {
  const bark = '#5a3f26', barkL = '#7a5a38';
  box(ctx, x, y - 2, 19, 4, '#6b4424');
  band(ctx, x, y - 2, 19, 4, 0.35, 0.6, CR); // painted panels along the sledge
  for (const u of [0.15, 0.4, 0.65, 0.9]) { faceQuad(ctx, 'R', x, y - 2, 19, 4, u, u + 0.08, 0.35, 0.6, CL); faceQuad(ctx, 'L', x, y - 2, 19, 4, u, u + 0.08, 0.35, 0.6, CL); }
  wheels(BRONZE);
  for (const [wx, wy] of [[-7, 1], [6, 3]]) { ring(ctx, x + wx, y + wy, 3.7, 4.1, '#6a7078', 0.8); ring(ctx, x + wx, y + wy, 2.3, 2.6, shade('#7a5230', -0.1), 0.4); } // iron tyres
  // the two oak uprights, their bark furrowed, meeting at the top
  line(ctx, x - 6, y - 3, x - 1, y - 22, bark, 3.6);
  line(ctx, x - 6.7, y - 3, x - 1.7, y - 22, barkL, 0.9);
  line(ctx, x + 5, y - 1, x + 0.6, y - 22, shade(bark, 0.12), 3.6);
  line(ctx, x + 4.2, y - 1, x - 0.2, y - 22, barkL, 0.9);
  for (const t of [0.25, 0.45, 0.65, 0.85]) { line(ctx, x - 6 + 5 * t - 1.4, y - 3 - 19 * t, x - 6 + 5 * t + 1.4, y - 3 - 19 * t - 0.4, '#3a2616', 0.6); line(ctx, x + 5 - 4.4 * t - 1.4, y - 1 - 21 * t, x + 5 - 4.4 * t + 1.4, y - 1 - 21 * t - 0.4, '#3a2616', 0.6); }
  // a carved cross-beam with bronze end caps and knotwork
  line(ctx, x - 4.6, y - 17.4, x + 3.4, y - 14.6, '#8a5a2b', 2.2);
  line(ctx, x - 4.6, y - 18, x + 3.4, y - 15.2, shade('#8a5a2b', 0.4), 0.5);
  ellipse(ctx, x - 5, y - 17.6, 1.4, 1.4, BRONZE);
  ellipse(ctx, x + 3.8, y - 14.4, 1.4, 1.4, BRONZE);
  spiral(ctx, x - 0.6, y - 16, 1.1, 1, CL, 0.4);
  // the throwing beam, its basket at the tip and the boulder net at the butt
  line(ctx, x - 10, y - 6, x + 10.5, y - 27, '#6b4a2a', 3);
  line(ctx, x - 10, y - 7, x + 10.5, y - 28, shade('#6b4a2a', 0.4), 0.6);
  for (const t of [0.3, 0.55, 0.8]) line(ctx, x - 10 + 20.5 * t - 0.6, y - 6 - 21 * t + 1.2, x - 10 + 20.5 * t + 0.6, y - 6 - 21 * t - 1.2, CR, 1.4); // red-painted bands
  ellipse(ctx, x + 10.6, y - 28, 3.8, 2.6, '#c9a45a'); // wicker basket
  ellipse(ctx, x + 10.6, y - 29, 3, 1.9, '#8a6a34');
  for (let i = -2; i <= 2; i++) line(ctx, x + 10.6 + i * 1.3, y - 30, x + 10.6 + i * 1.5, y - 26.4, '#8a6a34', 0.5);
  ellipse(ctx, x + 10.6, y - 30.4, 2.4, 2.1, '#8a8a90');
  ellipse(ctx, x + 10.2, y - 31, 0.9, 0.7, '#b8b8c0');
  line(ctx, x - 9.6, y - 6, x - 11, y - 1, '#c9b58a', 0.8);
  line(ctx, x - 10.4, y - 6, x - 13.6, y - 1.6, '#c9b58a', 0.8);
  ellipse(ctx, x - 12, y + 0.4, 3.4, 3, '#8a6a44'); // the net of stones
  for (const [sx, sy] of [[-13.2, -0.4], [-11, 0.6], [-12.6, 1.8], [-10.6, -0.6]] as const) ellipse(ctx, x + sx, y + sy, 1.3, 1.1, '#8a8a90');
  line(ctx, x - 14.5, y - 0.4, x - 9.6, y + 1.4, '#c9b58a', 0.4);
  line(ctx, x - 13.4, y - 2.4, x - 10.6, y + 3, '#c9b58a', 0.4);
  // a stag's skull and antlers crown the frame; a checked banner flies from the sledge
  antlerPair(ctx, x - 0.4, y - 23.4, 0.9, '#e6d3ad', 1);
  ellipse(ctx, x - 0.4, y - 22.8, 2, 1.6, '#efe6cf');
  ellipse(ctx, x - 1, y - 22.6, 0.5, 0.6, '#1a1a1a');
  ellipse(ctx, x + 0.2, y - 22.6, 0.5, 0.6, '#1a1a1a');
  line(ctx, x - 9, y - 1, x - 9, y - 18, '#5a3b1e', 1.3);
  poly(ctx, [x - 9, y - 18, x + 0, y - 16, x - 2, y - 13.6, x + 0, y - 11.2, x - 9, y - 12.6], CR);
  poly(ctx, [x - 9, y - 16.4, x - 1, y - 14.8, x - 1.6, y - 14.2, x - 9, y - 15.4], CG);
  poly(ctx, [x - 9, y - 13.8, x - 1.2, y - 12.6, x - 1.6, y - 12, x - 9, y - 13], CY);
  ellipse(ctx, x - 9, y - 18.6, 1, 1, BRONZE);
  // a round shield with a bronze boss hung on the sledge
  ellipse(ctx, x + 2, y + 0.6, 2.4, 2.4, CG);
  ring(ctx, x + 2, y + 0.6, 2.4, 2.4, BRONZE, 0.5);
  ellipse(ctx, x + 2, y + 0.6, 0.8, 0.8, BRONZE);
}

/** A Celtic chariot: a wicker car on iron-tyred wheels, two ponies abreast, a charioteer with his spear. */
function drawCeltChariot(ctx: Ctx, x: number, y: number) {
  drawHorse(ctx, x + 6, y + 1, 0.76, '#c9a878', '#3a2214', undefined, CR); // the far pony
  drawHorse(ctx, x + 10, y + 5, 0.8, '#8a4f2a', '#2a1a10', undefined, CR); // the near one
  for (const [hx, hy] of [[x + 6 + 10.5 * 0.76, y + 1 - 15 * 0.76], [x + 10 + 10.5 * 0.8, y + 5 - 15 * 0.8]] as const) {
    poly(ctx, [hx - 0.4, hy - 4, hx - 1.4, hy - 8.4, hx + 1.4, hy - 7, hx + 1.8, hy - 4], CR);
  }
  line(ctx, x - 2, y - 4, x + 10, y - 3, WOOD, 1.6);
  line(ctx, x - 2, y - 4.6, x + 10, y - 3.6, shade(WOOD, 0.4), 0.5);
  line(ctx, x + 9, y - 10, x + 14, y - 8.2, '#5a3a1e', 1.2);
  ellipse(ctx, x + 11.6, y - 9, 1, 1, BRONZE);
  box(ctx, x - 4, y - 1, 12, 7, '#b98a48', '#8a6a34');
  for (const f of ['L', 'R'] as const) for (let i = 0; i < 6; i++) faceQuad(ctx, f, x - 4, y - 1, 12, 7, 0.08 + i * 0.17, 0.12 + i * 0.17, 0.05, 0.95, '#8a6a34'); // wicker staves
  for (const v of [0.3, 0.6]) band(ctx, x - 4, y - 1, 12, 7, v, v + 0.06, '#8a6a34');
  band(ctx, x - 4, y - 1, 12, 7, 0.86, 1, CR);
  for (const u of [0.15, 0.4, 0.65, 0.9]) faceQuad(ctx, 'R', x - 4, y - 1, 12, 7, u - 0.03, u + 0.03, 0.88, 0.98, CL);
  // a bundle of javelins hung on the rail
  for (const i of [-1, 0, 1]) line(ctx, x - 7.4 + i, y - 8, x - 9.4 + i * 1.6, y - 19, WOOD, 0.7);
  for (const i of [-1, 0, 1]) poly(ctx, [x - 9.4 + i * 1.6, y - 21.6, x - 10.4 + i * 1.6, y - 18.6, x - 8.4 + i * 1.6, y - 18.6], CI);
  const b = figure(ctx, 'rider', 'celts', x - 4, y - 8, 0.85, true);
  celtLance(ctx, b.hand.x, b.hand.y, 1.4);
  celtShield(ctx, 'rider', b.off.x - 1, b.off.y + 1.5, 0.66);
  const cx = x - 7, cy = y - 1;
  ctx.strokeStyle = '#6a7078';
  ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.ellipse(cx, cy, 4.4, 5.8, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.ellipse(cx, cy, 4.4, 5.8, 0, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4 + 0.2; line(ctx, cx, cy, cx + Math.cos(a) * 4.2, cy + Math.sin(a) * 5.6, '#6b4424', 0.8); }
  ellipse(ctx, cx, cy, 1.4, 1.7, BRONZE);
  ellipse(ctx, cx - 0.4, cy - 0.5, 0.5, 0.6, shade(BRONZE, 0.6));
}

/** Celtic boats: the hide-and-wicker curragh (boat), a sailing curragh with leather sail (ship) and an oak-planked, high-sided sea-going warship after the Veneti. */
function drawCurragh(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  const tier = kind === 'warship' ? 2 : kind === 'ship' ? 1 : 0;
  const s = 1 + tier * 0.14, w = 18 * s;
  const bez = (p0: number, c: number, p1: number, t: number) => (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * c + t * t * p1;
  const sx = x - w, ex = x + w + 3, sy = y - 9 - tier * 0.6, ey = y - 11 - tier * 1;
  const G = (t: number) => ({ x: bez(sx, x - 0.05 * w, ex, t), y: bez(sy, y + 1, ey, t) });
  const K = (t: number) => ({ x: bez(sx, x, ex, t), y: bez(sy, y + 17 + tier, ey, t) });
  const P = (t: number, f: number) => { const g = G(t), kk = K(t); return { x: g.x + (kk.x - g.x) * f, y: g.y + (kk.y - g.y) * f }; };
  const N = 18;
  const ts = Array.from({ length: N + 1 }, (_, i) => i / N);
  const planked = tier === 2;
  const dark = planked ? '#5a3a20' : '#4e3220', mid = planked ? '#7a5230' : '#6a4426', lit = planked ? '#9a6a3a' : '#8a5a30';
  const pts = (fa: number, fb: number) => [...ts.map((t) => P(t, fa)), ...[...ts].reverse().map((t) => P(t, fb))].flatMap((p) => [p.x, p.y]);
  // hull: three tones, lit near the rail and dark toward the keel
  poly(ctx, pts(0, 1), dark);
  poly(ctx, pts(0, 0.62), mid);
  poly(ctx, pts(0, 0.3), lit);
  // seams: cream stitching and lashings on a hide boat, dark planking lines and iron nails on the oak ship
  for (const f of [0.3, 0.62]) {
    ctx.strokeStyle = ink(shade(dark, -0.3));
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ts.forEach((t, i) => { const p = P(t, f); if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
    ctx.stroke();
  }
  for (let i = 1; i < 16; i++) {
    const t = i / 16;
    if (planked) ellipse(ctx, P(t, 0.3).x, P(t, 0.3).y, 0.35, 0.35, '#c9d0d8');
    else { const a = P(t, 0.22), b = P(t, 0.4); line(ctx, a.x, a.y, b.x, b.y, '#e6d3a8', 0.5); }
  }
  if (!planked) for (let i = 1; i < 8; i++) { const t = i / 8, a = P(t, 0.42), b = P(t, 0.9); line(ctx, a.x, a.y, b.x, b.y, shade(dark, -0.25), 0.4); } // ribs showing through the hide
  if (planked) { // a painted red-and-cream strake below the rail
    const band = [...ts.map((t) => P(t, 0.06)), ...[...ts].reverse().map((t) => P(t, 0.2))].flatMap((p) => [p.x, p.y]);
    poly(ctx, band, CR);
    for (let i = 1; i < 12; i++) { const t = i / 12, p = P(t, 0.13); ellipse(ctx, p.x, p.y, 0.7, 0.55, CL); }
  }
  // the woven wicker gunwale
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const rail = (color: string, wd: number, dash: number[] = []) => {
    ctx.setLineDash(dash);
    ctx.strokeStyle = ink(color);
    ctx.lineWidth = wd;
    ctx.beginPath();
    ts.forEach((t, i) => { const p = G(t); if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
    ctx.stroke();
    ctx.setLineDash([]);
  };
  rail(planked ? '#7a5230' : '#d0aa5c', 2.3);
  rail(planked ? '#9a6a3a' : '#8a6a34', 2.3, [0.9, 1.1]);
  // foam along the waterline
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y + 3.6, w * 0.78, 2.2, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.stroke();
  // the painted eye on the bow
  const eye = P(0.86, 0.36);
  ellipse(ctx, eye.x, eye.y, 1.7, 1.2, CL);
  ellipse(ctx, eye.x + 0.3, eye.y, 0.8, 0.8, CW);
  ellipse(ctx, eye.x + 0.3, eye.y, 0.35, 0.35, '#101010');
  // the carved prow: a swan-necked stem ending in a spiral, and a low curl at the stern
  const curve = (x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, color: string, wd: number) => {
    ctx.strokeStyle = ink(color);
    ctx.lineWidth = wd;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.stroke();
  };
  const bh = 8 + tier * 3;
  curve(ex, ey, ex + 4.4, ey - 2, ex + 3.4, ey - bh, '#3a2416', 2.2);
  curve(ex - 0.4, ey, ex + 4, ey - 2, ex + 3, ey - bh, shade('#3a2416', 0.4), 0.6);
  spiral(ctx, ex + 1.4, ey - bh - 0.8, 2.3, -1, BRONZE, 1, 0);
  ellipse(ctx, ex + 3.4, ey - bh + 0.4, 1.1, 1.1, GOLD);
  if (tier === 2) { // a bronze boar's head glares from the stem
    poly(ctx, [ex + 3.4, ey - bh - 1.6, ex + 8.4, ey - bh - 0.4, ex + 8.6, ey - bh + 1.6, ex + 3.6, ey - bh + 1.8], BRONZE);
    poly(ctx, [ex + 3.6, ey - bh + 1.8, ex + 8.6, ey - bh + 1.6, ex + 7.4, ey - bh + 3.2, ex + 3.4, ey - bh + 3.4], shade(BRONZE, -0.3));
    poly(ctx, [ex + 7.2, ey - bh + 1.8, ex + 8.6, ey - bh - 0.4, ex + 7, ey - bh + 0.6], CL);
    ellipse(ctx, ex + 5, ey - bh, 0.5, 0.5, '#101010');
  }
  curve(sx, sy, sx - 3, sy - 1, sx - 2.4, sy - 6 - tier * 1.5, '#3a2416', 2);
  ellipse(ctx, sx - 2.4, sy - 6.6 - tier * 1.5, 1, 1, BRONZE);
  // oars (a paddle pair on the little boat)
  const blade = (bx: number, by: number, c: string) => { ellipse(ctx, bx, by, 1.7, 0.85, '#9a6a3a'); ellipse(ctx, bx, by, 0.7, 0.4, c); };
  if (tier === 0) for (const t of [0.28, 0.55]) {
    const g = G(t);
    line(ctx, g.x + 1, g.y + 1, g.x - 5, g.y + 12, '#6b4424', 1);
    blade(g.x - 5.4, g.y + 12.6, CR);
  } else for (let i = 0; i < 4 + tier * 2; i++) {
    const t = 0.16 + i * (0.68 / (3 + tier * 2)), g = G(t);
    line(ctx, g.x, g.y + 3, g.x - 3.4, g.y + 11.5, '#6b4424', 1.1);
    blade(g.x - 3.8, g.y + 12, CR);
  }
  // round shields hung along the rail
  if (tier >= 1) for (let i = 0; i < 4 + tier; i++) {
    const t = 0.22 + i * (0.6 / (3 + tier)), g = G(t), sy2 = g.y + 1.2;
    ellipse(ctx, g.x, sy2, 2.4, 2.4, i % 2 ? CG : CR);
    ring(ctx, g.x, sy2, 2.4, 2.4, BRONZE, 0.5);
    ellipse(ctx, g.x, sy2, 0.8, 0.8, shade(BRONZE, 0.3));
  }
  if (tier === 2) { // a raised stern deck with a carnyx sounding over the water
    box(ctx, x - w * 0.7, y - 9, 8, 3, '#6a4426');
    band(ctx, x - w * 0.7, y - 9, 8, 3, 0.5, 0.8, CR);
    carnyx(ctx, x - w * 0.7 - 1, y - 12, 0.5, 14);
  }
  // mast and leather sail
  const top = y - (29 + tier * 5), H = 12 + tier * 3;
  line(ctx, x, y - 6, x, top - 1, '#5a3b1e', 2);
  const hide = '#c8a06a';
  poly(ctx, [x + 1, top, x + 14 * s, top + 3, x + 14 * s, top + 3 + H, x + 1, top + H + 1], hide);
  poly(ctx, [x - 1, top + 0.5, x - 11 * s, top - 0.6, x - 11 * s, top - 0.6 + H * 0.96, x - 1, top + H + 0.6], shade(hide, -0.14));
  for (const f of [0.34, 0.68]) {
    line(ctx, x + 1 + (14 * s - 1) * f, top + 3 * f, x + 1 + (14 * s - 1) * f, top + (3 + H) * f + 1 - f, shade(hide, -0.3), 0.5); // seams between the hides
    line(ctx, x - 1 - (11 * s - 1) * f, top + 0.5 - 1.1 * f, x - 1 - (11 * s - 1) * f, top + (H * 0.96 - 0.6) * f + 0.6 + 0.4 * (1 - f), shade(hide, -0.4), 0.5);
  }
  poly(ctx, [x + 1, top + H - 3, x + 14 * s, top + H, x + 14 * s, top + 3 + H, x + 1, top + H + 1], CR); // a red foot band
  poly(ctx, [x - 1, top + H - 3.2, x - 11 * s, top + H - 4, x - 11 * s, top - 0.6 + H * 0.96, x - 1, top + H + 0.6], shade(CR, -0.2));
  triskele(ctx, x + 7.6 * s, top + 3 + H * 0.42, 3.4, 3.4, tier === 2 ? CG : CR, 0.9);
  ellipse(ctx, x + 7.6 * s, top + 3 + H * 0.42, 0.8, 0.8, CY);
  line(ctx, x - 11 * s, top - 0.5, x + 14 * s, top + 3, '#4a3020', 1.1); // the yard
  poly(ctx, [x, top - 2, x + 9, top - 0.6, x + 7.4, top - 1.4, x, top - 0.6], CR); // pennant
  poly(ctx, [x, top - 3.4, x + 9, top - 1.2, x, top + 0.6], CG);
  poly(ctx, [x, top - 1.6, x + 6, top - 0.6, x, top + 0.2], CY);
  line(ctx, x, top - 1, ex, ey - 1, '#3a2a1a', 0.6); // stays
  line(ctx, x, top - 1, sx, sy - 1, '#3a2a1a', 0.6);
  figure(ctx, 'warrior', 'celts', x - 9, y - 5, 0.5, true);
  if (tier >= 1) figure(ctx, 'archer', 'celts', x + 6, y - 6, 0.5, true);
}

/** The red deer: a slim russet body, a pale rump, a shaggy neck and a great spread of antlers. */
function drawStag(ctx: Ctx, x: number, y: number, k: number) {
  const body = '#96502a', dark = shade(body, -0.32);
  for (const lx of [-6.5, -2.6, 3.2, 6.8]) { // slender legs, darker at the hooves
    box(ctx, x + lx * k, y + (lx > 0 ? 0.5 : -0.5) * k, 1.8 * k, 7 * k, shade(body, -0.3));
    faceQuad(ctx, 'R', x + lx * k, y + (lx > 0 ? 0.5 : -0.5) * k, 1.8 * k, 7 * k, 0, 1, 0, 0.16, '#2a1a10');
    faceQuad(ctx, 'L', x + lx * k, y + (lx > 0 ? 0.5 : -0.5) * k, 1.8 * k, 7 * k, 0, 1, 0, 0.16, '#2a1a10');
  }
  poly(ctx, [x - 8 * k, y - 10 * k, x - 10.6 * k, y - 8.4 * k, x - 8.4 * k, y - 7 * k], '#e8d2a8'); // the short tail
  box(ctx, x, y - 5 * k, 16 * k, 7 * k, body);
  band(ctx, x, y - 5 * k, 16 * k, 7 * k, 0, 0.22, '#dcc094'); // pale belly
  faceQuad(ctx, 'L', x, y - 5 * k, 16 * k, 7 * k, 0, 0.3, 0.32, 0.86, '#ecdcb6'); // the cream rump patch
  faceQuad(ctx, 'L', x, y - 5 * k, 16 * k, 7 * k, 0.04, 0.26, 0.5, 0.56, dark);
  for (const [u, v] of [[0.35, 0.6], [0.5, 0.42], [0.65, 0.66], [0.78, 0.5]] as const) faceQuad(ctx, 'R', x, y - 5 * k, 16 * k, 7 * k, u, u + 0.06, v, v + 0.1, shade(body, 0.22)); // summer dapple
  faceQuad(ctx, 'R', x, y - 5 * k, 16 * k, 7 * k, 0.55, 0.95, 0.3, 0.85, shade(body, 0.08));
  box(ctx, x + 8.4 * k, y - 9 * k, 5 * k, 8 * k, shade(body, -0.05)); // neck
  faceQuad(ctx, 'R', x + 8.4 * k, y - 9 * k, 5 * k, 8 * k, 0, 1, 0.5, 1, dark); // the thick, shaggy mane
  faceQuad(ctx, 'L', x + 8.4 * k, y - 9 * k, 5 * k, 8 * k, 0, 1, 0.5, 1, shade(dark, 0.1));
  for (let i = 0; i < 4; i++) line(ctx, x + 7 * k + i * 1.2 * k, y - 8.8 * k, x + 6.6 * k + i * 1.2 * k, y - 6.4 * k, shade(dark, -0.2), 0.6 * k);
  box(ctx, x + 11.6 * k, y - 15.4 * k, 6 * k, 4.6 * k, shade(body, 0.05)); // head
  box(ctx, x + 15.4 * k, y - 15 * k, 3.4 * k, 2.8 * k, '#4a3428'); // dark muzzle
  faceQuad(ctx, 'R', x + 15.4 * k, y - 15 * k, 3.4 * k, 2.8 * k, 0.5, 0.85, 0.5, 0.9, '#141010');
  faceQuad(ctx, 'R', x + 11.6 * k, y - 15.4 * k, 6 * k, 4.6 * k, 0.42, 0.62, 0.42, 0.72, '#101010'); // eye
  faceQuad(ctx, 'R', x + 11.6 * k, y - 15.4 * k, 6 * k, 4.6 * k, 0.48, 0.55, 0.6, 0.7, '#ffffff');
  poly(ctx, [x + 8.6 * k, y - 20.4 * k, x + 7 * k, y - 23.4 * k, x + 10.6 * k, y - 21 * k], shade(body, -0.1)); // ear
  poly(ctx, [x + 8.6 * k, y - 20.4 * k, x + 8 * k, y - 22.4 * k, x + 9.8 * k, y - 20.9 * k], '#c98a6a');
  // antlers sweeping up and back, each with brow, bez and crown tines
  const a0x = x + 11.6 * k, a0y = y - 19.6 * k, bone = '#eadbb4', boneD = '#b8a47a';
  for (const [dx, sh, c] of [[-1.4, -1, boneD], [1.4, 1, bone]] as const) {
    const bx = a0x + dx * k;
    ctx.strokeStyle = ink(c); ctx.lineWidth = 1.3 * k; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx, a0y); ctx.quadraticCurveTo(bx - 3.6 * k + sh * 0.6 * k, a0y - 6 * k, bx - 6 * k + sh * 1.2 * k, a0y - 13.4 * k); ctx.stroke(); // the main beam
    line(ctx, bx - 0.4 * k, a0y - 1.4 * k, bx + 2.4 * k, a0y - 4.2 * k, c, 1 * k); // brow tine
    line(ctx, bx - 2 * k + sh * 0.4 * k, a0y - 5 * k, bx + 1.6 * k + sh * 0.8 * k, a0y - 8.2 * k, c, 1 * k); // bez tine
    line(ctx, bx - 3.6 * k + sh * 0.6 * k, a0y - 8.6 * k, bx - 0.4 * k + sh * 1 * k, a0y - 12 * k, c, 0.9 * k);
    line(ctx, bx - 6 * k + sh * 1.2 * k, a0y - 13.4 * k, bx - 8.6 * k + sh * 1.2 * k, a0y - 15.6 * k, c, 0.9 * k); // crown
    line(ctx, bx - 6 * k + sh * 1.2 * k, a0y - 13.4 * k, bx - 4 * k + sh * 1.4 * k, a0y - 17 * k, c, 0.9 * k);
    line(ctx, bx - 5.2 * k + sh * 1 * k, a0y - 11.4 * k, bx - 7.6 * k + sh * 1 * k, a0y - 11.2 * k, c, 0.8 * k);
  }
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
  if (tribe === 'inca') return drawIncaRider(ctx, kind, x, y);
  const knight = kind === 'knight';
  if (tribe === 'inuit') {
    // the Inuit ride caribou, hung with white fur pads and beaded harness
    const seat = drawCaribou(ctx, x - 1, y + 3, 0.95, { saddle: true, armour: knight });
    const bi = figure(ctx, kind, tribe, seat.x, seat.y, 0.9, true);
    if (kind === 'horsearcher') return drawWeapon(ctx, 'archer', tribe, bi, 0.9);
    drawShield(ctx, tribe, kind, bi.off.x - 1.5, bi.off.y + 1.5, 0.7);
    inuitLance(ctx, bi.hand.x, bi.hand.y, knight ? 2 : 1.6);
    return;
  }
  const T = TRIBES[tribe];
  const ab = isAbo(tribe);
  const coat = ab ? (knight ? '#d3bd94' : '#9a6238') : knight ? '#eeeeee' : tribe === 'pirates' ? '#3a2a22' : tribe === 'mongols' ? '#a07845' : '#8a5a33';
  const saddle = drawHorse(ctx, x - 1, y + 3, 0.95, coat, knight && !ab ? '#9aa3ad' : '#2a1a10', knight && !ab ? T.color : undefined, ab ? AB_FUR : T.color);
  if (knight && !ab) {
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
  if (tribe === 'persia') persiaHorseGear(ctx, kind, x, y, saddle);
  if (ab) aboHorse(ctx, kind, x, y, saddle);
  if (tribe === 'polynesia') {
    // a woven flax saddle blanket: black with a red taniko border, white diamonds and a hanging tassel fringe
    const sx = saddle.x, sy = saddle.y;
    poly(ctx, [sx - 6.4, sy - 1, sx + 4, sy - 1, sx + 3.4, sy + 6.6, sx - 1.4, sy + 5, sx - 5.4, sy + 8], '#1a1a20');
    poly(ctx, [sx - 6.4, sy - 1, sx + 4, sy - 1, sx + 3.9, sy + 0.8, sx - 6.2, sy + 0.8], '#b3302a');
    line(ctx, sx - 5.4, sy + 8, sx - 1.4, sy + 5, '#b3302a', 1.1);
    line(ctx, sx - 1.4, sy + 5, sx + 3.4, sy + 6.6, '#b3302a', 1.1);
    for (const [dx, dy] of [[-4, 2.4], [-1, 3], [1.6, 3.4]] as const) poly(ctx, [sx + dx, sy + dy - 1.2, sx + dx + 1.2, sy + dy, sx + dx, sy + dy + 1.2, sx + dx - 1.2, sy + dy], '#f4efe0');
    for (const [dx, dy] of [[-4, 2.4], [-1, 3], [1.6, 3.4]] as const) ellipse(ctx, sx + dx, sy + dy, 0.4, 0.4, '#b3302a');
    for (let i = 0; i < 5; i++) line(ctx, sx - 4.8 + i * 1.7, sy + 7.6 - i * 0.6, sx - 4.8 + i * 1.7, sy + 9.2 - i * 0.6, i % 2 ? '#f4efe0' : '#b3302a', 0.6);
    line(ctx, sx - 2.6, sy + 5, sx - 2.6, sy + 11, '#c9b27a', 0.6); // a flax-rope girth
    const hx = x - 1 + 10.5 * 0.95, hy = y + 3 - 15 * 0.95;
    faceQuad(ctx, 'R', hx, hy, 7 * 0.95, 5 * 0.95, 0.1, 0.9, 0.62, 0.78, '#b3302a'); // red ochre face paint
    faceQuad(ctx, 'R', hx, hy, 7 * 0.95, 5 * 0.95, 0.1, 0.9, 0.78, 0.9, '#22222a'); // a carved pare across the brow
    for (const u of [0.2, 0.5, 0.8]) faceQuad(ctx, 'R', hx, hy, 7 * 0.95, 5 * 0.95, u - 0.06, u + 0.06, 0.8, 0.88, '#f4efe0');
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
  if (tribe === 'polynesia') {
    // a pounamu pendant on a cord at the horse's neck and a heron feather between its ears
    const hx = x - 1 + 10.5 * 0.95, hy = y + 3 - 15 * 0.95;
    line(ctx, x + 5, y - 9, x + 9, y - 4.6, '#4a3a22', 0.7);
    ellipse(ctx, x + 7.2, y - 5.8, 1.3, 1.6, '#3f9a6a');
    ellipse(ctx, x + 6.9, y - 6.2, 0.5, 0.6, '#8fd6a8');
    poly(ctx, [hx + 0.4, hy - 4, hx - 0.6, hy - 10.4, hx + 2, hy - 4.4], '#f4efe0');
    poly(ctx, [hx + 1.2, hy - 4, hx + 1.4, hy - 9, hx + 3, hy - 4.2], '#1a1a1e');
  } else if (tribe === 'rome') {
    // phalerae: a harness strap across the chest hung with gilded discs, and a bronze frontlet
    const hx = x - 1 + 10.5 * 0.95, hy = y + 3 - 15 * 0.95;
    line(ctx, x + 3.5, y - 9.6, x + 8, y - 3.4, '#4a2e16', 0.9);
    for (const t of [0.15, 0.5, 0.85]) ellipse(ctx, x + 3.5 + 4.5 * t, y - 9.6 + 6.2 * t, 1.1, 1.1, GOLD);
    faceQuad(ctx, 'R', hx, hy, 7 * 0.95, 5 * 0.95, 0.45, 0.6, 0.6, 1, BRONZE);
  }
  if (tribe === 'greeks') {
    // a chlamys streams back over the horse's rump, and a crested frontlet crowns the horse
    const sx = saddle.x, sy = saddle.y;
    poly(ctx, [sx - 3, sy - 8, sx + 1, sy - 8, sx - 7, sy + 2, sx - 17, sy - 1, sx - 14, sy - 6], shade(T.colorDark, -0.05));
    poly(ctx, [sx - 3, sy - 8, sx - 5.4, sy - 5.6, sx - 15, sy - 1.6, sx - 14, sy - 6], T.color);
    line(ctx, sx - 3.4, sy - 6.6, sx - 13, sy - 2, shade(T.color, -0.35), 0.6);
    band(ctx, sx - 12.6, sy - 0.6, 4, 1.5, 0, 1, GOLD);
    if (!knight) poly(ctx, [x - 1 + 9.4, y + 3 - 19.6, x - 1 + 9.6, y + 3 - 25, x - 1 + 13, y + 3 - 21, x - 1 + 11.4, y + 3 - 18.8], T.color);
  }
  if (tribe === 'zulu') {
    // a spotted cowhide saddle blanket and a black-and-white plume between the horse's ears
    const hx = x - 1, hy = y + 3;
    band(ctx, hx - 0.95, hy - 5.7, 8.55, 6.65, 0.62, 0.92, '#f4efe0');
    for (const [u, v] of [[0.66, 0.2], [0.78, 0.5], [0.7, 0.66]] as const) faceQuad(ctx, 'R', hx - 0.95, hy - 5.7, 8.55, 6.65, u, u + 0.09, v, v + 0.16, '#2a1a10');
    poly(ctx, [hx + 9.2, hy - 18.8, hx + 8.6, hy - 26, hx + 11.4, hy - 19.4], '#f4efe0');
    poly(ctx, [hx + 10.4, hy - 19, hx + 12.6, hy - 25, hx + 12.6, hy - 18.4], '#1a1a1a');
    ellipse(ctx, hx + 14.4, hy - 16.6, 0.7, 0.7, '#c8372d'); // red bridle tassel at the muzzle
  }
  if (tribe === 'ethiopia') {
    // a striped tibeb saddle cloth with a lime-gold border, a gilt-studded chest strap and a tasselled brow
    const sx = saddle.x, sy = saddle.y;
    const hx = x - 1 + 10.5 * 0.95, hy = y + 3 - 15 * 0.95;
    poly(ctx, [sx - 6.4, sy - 1, sx + 4, sy - 1, sx + 3.4, sy + 6.6, sx - 1.4, sy + 5, sx - 5.4, sy + 8], '#f3eedd');
    poly(ctx, [sx - 6.4, sy - 1, sx + 4, sy - 1, sx + 3.9, sy + 0.8, sx - 6.2, sy + 0.8], T_LIME);
    for (const [i, c] of [[0, AK_G], [1, AK_Y], [2, AK_R]] as const) {
      line(ctx, sx - 6 + i * 0.4, sy + 1.6 + i * 1.3, sx + 3.7 - i * 0.2, sy + 1.6 + i * 1.3, c, 0.8);
    }
    line(ctx, sx - 5.4, sy + 8, sx - 1.4, sy + 5, T_DARK, 1.1);
    line(ctx, sx - 1.4, sy + 5, sx + 3.4, sy + 6.6, T_DARK, 1.1);
    for (let i = 0; i < 5; i++) line(ctx, sx - 4.8 + i * 1.7, sy + 7.6 - i * 0.6, sx - 4.8 + i * 1.7, sy + 9.4 - i * 0.6, i % 2 ? AK_Y : AK_R, 0.7); // fringe
    line(ctx, x + 3.5, y - 9.6, x + 8, y - 3.4, '#4a2e16', 0.9); // chest strap hung with gilt discs
    for (const t of [0.15, 0.5, 0.85]) ellipse(ctx, x + 3.5 + 4.5 * t, y - 9.6 + 6.2 * t, 1.1, 1.1, GOLD);
    line(ctx, x + 7.8, y - 3.6, x + 7.6, y - 0.4, AK_R, 0.8);
    ellipse(ctx, hx + 0.6, hy - 4.6, 1.5, 1.5, T_LIME); // a lime-gold pom-pom between the ears
    ellipse(ctx, hx + 0.2, hy - 5, 0.6, 0.6, shade(T_LIME, 0.6));
    faceQuad(ctx, 'R', hx, hy, 7 * 0.95, 5 * 0.95, 0.1, 0.9, 0.86, 0.96, GOLD); // a brow band
    line(ctx, hx + 6.6, hy + 1.6, hx + 6.8, hy + 4.6, AK_R, 0.9); // cheek tassels
    line(ctx, hx + 5.4, hy + 1.8, hx + 5.4, hy + 4.4, AK_G, 0.9);
    if (knight) for (const [i, c] of [[0, AK_R], [1, AK_G]] as const) band(ctx, x - 1 + 0, y + 3 - 6 * 0.95, 17 * 0.95, 7 * 0.95, 0.08 + i * 0.06, 0.13 + i * 0.06, c); // tibeb hem on the caparison
  }
  if (tribe === 'celts') celtHorseGear(ctx, kind, x, y);
  const b = figure(ctx, kind, tribe, saddle.x, saddle.y, 0.9, true);
  if (kind === 'horsearcher') return drawWeapon(ctx, 'archer', tribe, b, 0.9);
  if (kind === 'knight' || kind === 'rider') drawShield(ctx, tribe, kind, b.off.x - 1.5, b.off.y + 1.5, 0.7);
  if (tribe === 'celts') celtLance(ctx, b.hand.x, b.hand.y, knight ? 2 : 1.6);
  else if (tribe === 'polynesia') maoriSpear(ctx, b.hand.x, b.hand.y, knight ? 2 : 1.6, knight);
  else if (ab) aboRiderSpear(ctx, b.hand.x, b.hand.y, knight ? 2 : 1.6);
  else {
    lance(ctx, b.hand.x, b.hand.y, tribe === 'pirates' ? '#15151a' : T.color, knight ? 2 : 1.6, tribe !== 'ethiopia');
    if (tribe === 'ethiopia') { // three streamers of the tibeb colours below the spearhead
      const tx = b.hand.x + 8, ty = b.hand.y - 20;
      for (const [i, c] of [[0, AK_G], [1, AK_Y], [2, AK_R]] as const) {
        ctx.strokeStyle = c;
        ctx.lineWidth = 1.1;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tx - 0.2, ty + 1.6 + i * 0.9);
        ctx.quadraticCurveTo(tx + 4.4, ty + 1.2 + i * 2.4, tx + 8.6 - i * 0.6, ty + 4.4 + i * 3);
        ctx.stroke();
      }
      ellipse(ctx, tx + 0.2, ty + 1.2, 1.1, 0.8, GOLD);
    }
  }
  if (tribe === 'pirates') ellipse(ctx, b.hand.x + 12.6, b.hand.y - 15.6, 1, 0.9, '#ffffff'); // skull on the black pennant
  if (tribe === 'persia') { // a winged sun on the pennant and gilded bands on the lance
    wingedDisc(ctx, b.hand.x + 11.4, b.hand.y - 15.2, 0.42, P_CREAM, GOLD);
    for (const t of [0.3, 0.38, 0.6]) line(ctx, b.hand.x - 3 + 11 * t - 1, b.hand.y + 6 - 26 * t, b.hand.x - 3 + 11 * t + 1, b.hand.y + 6 - 26 * t, GOLD, 0.8);
  }
  if (tribe === 'vikings') for (const t of [0.34, 0.42]) line(ctx, b.hand.x - 3 + 11 * t - 1, b.hand.y + 6 - 26 * t, b.hand.x - 3 + 11 * t + 1, b.hand.y + 6 - 26 * t, GOLD, 0.8); // gilt bands on the lance
}

function drawChariot(ctx: Ctx, tribe: TribeId, x: number, y: number) {
  if (tribe === 'celts') return drawCeltChariot(ctx, x, y);
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
  if (tribe === 'inuit') return inuitCatapult(ctx, x, y);
  if (tribe === 'aboriginal') return aboCatapult(ctx, x, y);
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
    case 'inca':
      incaCatapult(ctx, x, y);
      break;
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
      // carved timber sling frame lashed with flax, rounded stones, tiki post-tops
      box(ctx, x, y - 1, 17, 3, '#6b4424', '#8a5a2b');
      band(ctx, x, y - 1, 17, 3, 0.55, 0.8, '#b3302a');
      for (const ox of [-6, 5]) {
        line(ctx, x + ox, y - 1, x + ox * 0.3, y - 19, '#5a3320', 2.6);
        line(ctx, x + ox - 0.8, y - 1, x + ox * 0.3 - 0.8, y - 19, '#8a5a2b', 0.6);
      }
      line(ctx, x - 7, y - 19, x + 6, y - 19, '#5a3320', 2.4);
      line(ctx, x - 1, y - 19, x + 12, y - 29, '#8a5a2b', 1.6);
      ellipse(ctx, x + 12, y - 29, 3, 2.6, '#6b4424');
      ellipse(ctx, x + 12, y - 30.4, 2.4, 2.2, '#8a8a90'); // the stone in the sling
      ellipse(ctx, x + 11.4, y - 31, 0.8, 0.6, '#b4b4bc');
      for (const [bx, by] of [[-12, 4], [-9, 5], [-10.5, 2]]) {
        ellipse(ctx, x + bx, y + by, 2.3, 2.1, '#77777e');
        ellipse(ctx, x + bx - 0.6, y + by - 0.6, 0.7, 0.6, '#a8a8b0');
      }
      flag(x + 7, y + 1, T.color);
      for (const [px, py] of [[-6, -1], [-3, -8], [-0.5, -14]] as const) { line(ctx, x + px - 1.6, y + py - 0.6, x + px + 1.8, y + py + 0.8, '#c9b27a', 0.9); line(ctx, x + px - 1.6, y + py + 0.8, x + px + 1.8, y + py - 0.6, '#c9b27a', 0.9); } // flax lashings
      line(ctx, x + 4, y - 19, x + 12, y - 29, '#c9b58a', 0.6); // the sling
      // carved tiki heads on the post tops, and a taniko band with hanging tufts along the top beam
      for (const tx of [-6.6, 5.4]) {
        box(ctx, x + tx, y - 19.6, 4.2, 4.4, '#7a4a26', '#a86c38');
        ellipse(ctx, x + tx - 0.8, y - 18.2, 0.7, 0.7, '#f4efe0');
        ellipse(ctx, x + tx + 1, y - 17.8, 0.7, 0.7, '#f4efe0');
        line(ctx, x + tx - 1, y - 16.2, x + tx + 1.2, y - 15.8, '#b3302a', 0.9);
      }
      line(ctx, x - 5, y - 15.6, x + 4, y - 15.6, '#b3302a', 1.1);
      for (let i = 0; i < 4; i++) { ellipse(ctx, x - 4 + i * 2.6, y - 15.6, 0.5, 0.5, i % 2 ? '#f4efe0' : '#1a1a1e'); poly(ctx, [x - 4.6 + i * 2.6, y - 15, x - 3.4 + i * 2.6, y - 15, x - 4 + i * 2.6, y - 12], i % 2 ? '#f4efe0' : '#b3302a'); }
      // tiki details: paua-shell eyes with green pupils, protruding red tongues, feather crests, carved pare brow
      for (const tx of [-6.6, 5.4]) {
        ellipse(ctx, x + tx - 0.8, y - 18.2, 0.35, 0.35, '#3f9a6a');
        ellipse(ctx, x + tx + 1, y - 17.8, 0.35, 0.35, '#3f9a6a');
        line(ctx, x + tx - 1.4, y - 20.6, x + tx + 1.6, y - 20.2, '#b3302a', 0.8);
        poly(ctx, [x + tx - 0.3, y - 15.6, x + tx + 1.3, y - 15.4, x + tx + 0.6, y - 13.2], '#b3302a');
        feather(ctx, x + tx, y - 22, x + tx - 1.6, y - 29, 1.1, '#f4efe0', '#1a1a1e');
        feather(ctx, x + tx + 0.4, y - 22, x + tx + 2.2, y - 28.4, 1, '#1a1a1e', '#f4efe0');
      }
      // koru carved into the timber bed, flax-rope bindings where the arm meets the frame, and a feather streamer on the flag
      koru(ctx, x - 3.6, y + 0.1, 1.1, '#f4efe0', 0.45);
      koru(ctx, x + 3.4, y + 0.7, 1.1, '#f4efe0', 0.45, -1);
      for (let i = 0; i < 4; i++) line(ctx, x - 2.4 + i * 0.8, y - 19.9 + i * 0.6, x - 1 + i * 0.8, y - 18.4 + i * 0.6, i % 2 ? '#b3302a' : '#c9b27a', 1.1);
      for (const [fx, fy] of [[7.6, -15.4], [9, -13.2], [7.4, -11.6]] as const) line(ctx, x + 7, y - 15, x + fx, y + fy, fx > 8 ? '#f4efe0' : '#b3302a', 0.9);
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
    case 'greeks': {
      // a torsion bolt-thrower: twin rope-spring skeins, bow arms, a grooved slider and a bronze-headed bolt
      box(ctx, x, y - 2, 18, 4, '#a9773f');
      band(ctx, x, y - 2, 18, 4, 0.55, 0.7, T.color); // painted teal rail
      wheels(BRONZE);
      line(ctx, x + 1.6, y - 24.5, x + 1.6, y - 10.5, T.color, 3); // the frame between the two spring housings
      line(ctx, x + 1.6, y - 10.5, x + 2, y - 2, '#8a5a2b', 3);
      line(ctx, x - 9, y - 10, x + 13, y - 17, '#a9773f', 3.4); // slider
      line(ctx, x - 9, y - 11.2, x + 13, y - 18.2, shade('#a9773f', 0.4), 0.6);
      for (const oy of [-24.5, -10.5]) { // the coiled skeins
        ellipse(ctx, x + 1.6, y + oy, 3.4, 2.6, '#c9b58a');
        ellipse(ctx, x + 1.6, y + oy, 2.2, 1.6, shade('#c9b58a', -0.3));
        line(ctx, x - 1.4, y + oy - 1.5, x + 4.6, y + oy + 1.5, '#8a6a3a', 0.6);
        line(ctx, x - 1.4, y + oy + 1.5, x + 4.6, y + oy - 1.5, '#8a6a3a', 0.6);
      }
      ctx.strokeStyle = '#5a3b1e'; // bow arms flexing forward from the skeins
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 26);
      ctx.quadraticCurveTo(x + 9, y - 16, x - 5, y - 6);
      ctx.stroke();
      line(ctx, x - 6, y - 26, x - 5, y - 6, '#f4efe0', 0.7); // the bowstring
      line(ctx, x - 5, y - 16, x + 14, y - 19.4, '#6b4424', 1.3); // the bolt
      poly(ctx, [x + 14, y - 21.4, x + 18, y - 19.4, x + 14, y - 17.6], BRONZE);
      poly(ctx, [x - 5.4, y - 16, x - 8, y - 18.2, x - 6.4, y - 15.6], T.color);
      flag(x - 10, y - 1, T.color);
      for (const ox of [-6, -1, 4, 9]) ellipse(ctx, x + ox, y - 0.4, 0.6, 0.6, GOLD); // bronze studs along the rail
      break;
    }
    case 'persia':
      persiaCatapult(ctx, x, y, wheels, flag);
      break;
    case 'ethiopia': {
      // an Aksumite counterweight thrower: a stepped stone-and-timber plinth, a monkey-head-beamed A-frame, a carved stele for ballast
      box(ctx, x, y - 2, 20, 4, '#5a3a22'); // timber sledge
      band(ctx, x, y - 2, 20, 4, 0.55, 0.75, '#c9c0ae'); // a course of pale granite
      for (const u of [0.12, 0.34, 0.56, 0.78]) faceQuad(ctx, 'R', x, y - 2, 20, 4, u, u + 0.012, 0.55, 0.75, '#8a8272');
      band(ctx, x, y - 2, 20, 4, 0.2, 0.32, T_LIME);
      band(ctx, x, y - 2, 20, 4, 0.32, 0.4, AK_R);
      for (const [wx, wy] of [[-7, 1], [6, 3]]) { // solid disc cartwheels, iron-shod, with a gold hub
        ellipse(ctx, x + wx, y + wy, 3.8, 4.2, '#2a1a10');
        ellipse(ctx, x + wx, y + wy, 3.1, 3.5, '#8a5a33');
        ring(ctx, x + wx, y + wy, 2, 2.3, '#5a3a22', 0.6);
        ring(ctx, x + wx, y + wy, 3.4, 3.8, '#6a6a72', 0.7);
        ellipse(ctx, x + wx, y + wy, 1.1, 1.3, GOLD);
      }
      // the A-frame, its crossbeams ending in round "monkey-head" beam ends
      line(ctx, x - 6, y - 2, x + 0, y - 22, '#4a2e16', 2.8);
      line(ctx, x + 6, y - 1, x + 0, y - 22, '#5a3a22', 2.8);
      line(ctx, x - 6.4, y - 2.6, x - 0.4, y - 22.4, shade('#4a2e16', 0.35), 0.5);
      for (const [by, bx0, bx1] of [[-8, -4.2, 4.2], [-14.4, -2.4, 2.6]] as const) {
        line(ctx, x + bx0, y + by, x + bx1, y + by, '#3f2814', 1.6);
        for (const ex of [bx0, bx1]) { ellipse(ctx, x + ex + (ex < 0 ? -0.6 : 0.6), y + by, 1.3, 1.3, '#6a4426'); ellipse(ctx, x + ex + (ex < 0 ? -0.6 : 0.6), y + by, 0.55, 0.55, '#2a1a10'); }
      }
      line(ctx, x - 9, y - 4, x + 10, y - 26, '#3f2814', 3); // the throwing arm
      line(ctx, x - 9, y - 5, x + 10, y - 27.2, shade('#5a3a22', 0.4), 0.6);
      for (const t of [0.3, 0.55]) ellipse(ctx, x - 9 + 19 * t, y - 4 - 22 * t, 1.5, 1.2, T_LIME); // lime-gold bindings on the arm
      // the ballast: a small carved stele hung from the short arm
      const sx0 = x - 12, sy0 = y + 6;
      line(ctx, x - 9.4, y - 4, sx0 - 2, sy0 - 8, '#c9b58a', 0.7);
      line(ctx, x - 9.4, y - 4, sx0 + 2, sy0 - 8, '#c9b58a', 0.7);
      poly(ctx, [sx0 - 3, sy0, sx0 - 2.4, sy0 - 8.6, sx0, sy0 - 10, sx0, sy0 + 1.4], '#b8b0a0');
      poly(ctx, [sx0, sy0 - 10, sx0 + 2.4, sy0 - 8.6, sx0 + 3, sy0, sx0, sy0 + 1.4], '#8a8272');
      for (const [wy0, c] of [[-2.6, '#4a4438'], [-5.2, '#4a4438'], [-7.8, '#4a4438']] as const) { ellipse(ctx, sx0 - 1.2, sy0 + wy0, 0.6, 0.7, c); ellipse(ctx, sx0 + 1.2, sy0 + wy0 + 0.4, 0.6, 0.7, shade(c, -0.3)); } // carved false windows
      line(ctx, sx0 + 0.2, sy0 - 9.2, sx0 + 0.2, sy0 - 6.8, GOLD, 0.7); // a tiny gold cross
      line(ctx, sx0 - 0.5, sy0 - 8.3, sx0 + 0.9, sy0 - 8.3, GOLD, 0.7);
      // the sling and its stone
      ellipse(ctx, x + 10.5, y - 27, 3.6, 2.6, '#a8865a');
      ellipse(ctx, x + 10.5, y - 29, 2.4, 2.2, '#b9b0a0');
      line(ctx, x + 9, y - 24.6, x + 5, y - 6, '#c9b58a', 0.8);
      // a gilded cross finial and tricolour streamers on the apex
      line(ctx, x, y - 22, x, y - 30, GOLD, 1.2);
      line(ctx, x - 2, y - 27.6, x + 2, y - 27.6, GOLD, 1.2);
      for (const [i, c] of [[0, AK_G], [1, AK_Y], [2, AK_R]] as const) line(ctx, x + 2, y - 26.6 + i * 1.3, x + 8.4, y - 25.6 + i * 1.6 + 1.2, c, 1.1);
      ellipse(ctx, x, y - 30.6, 1, 1, shade(GOLD, 0.4));
      break;
    }
    case 'celts':
      celtCatapult(ctx, x, y, wheels);
      break;
    case 'zulu': {
      // a sapling A-frame lever thrower: cowhide lashings, a stone-filled hide sling, an ox skull and feathers
      box(ctx, x, y - 2, 18, 4, '#6b4424');
      for (const [ox, oy] of [[-7, 1], [6, 3]]) { // rolling logs in place of wheels
        ellipse(ctx, x + ox, y + oy, 3.4, 3.8, '#3f2814');
        ellipse(ctx, x + ox, y + oy, 2.6, 3, '#8a5a33');
        ring(ctx, x + ox, y + oy, 1.4, 1.7, '#5a3a22', 0.6);
        ellipse(ctx, x + ox, y + oy, 0.5, 0.6, '#f4efe0');
      }
      for (const nx of [-4, 1, 6]) ellipse(ctx, x + nx, y - 0.4, 1.3, 0.8, '#f4efe0'); // hide patches on the sledge
      line(ctx, x - 6, y - 2, x + 0, y - 22, '#7a5230', 2.6);
      line(ctx, x + 6, y - 1, x + 0, y - 22, '#8a6238', 2.6);
      line(ctx, x - 9, y - 4, x + 10, y - 27, '#5a3a22', 2.8); // the throwing arm
      line(ctx, x - 9, y - 5, x + 10, y - 28, shade('#5a3a22', 0.35), 0.6);
      ellipse(ctx, x - 10, y - 3, 3, 2.6, '#8a5a33'); // a counterweight sack of stones
      ellipse(ctx, x - 10.6, y - 3.8, 1, 0.8, '#c8b8a0');
      for (const [ax, ay, bx, by] of [[-3.4, -13.6, 2.6, -9], [3.4, -13.6, -2.8, -9], [-1.6, -20, 1.6, -19]] as const) line(ctx, x + ax, y + ay, x + bx, y + by, '#f4efe0', 1); // hide lashings on the frame
      ellipse(ctx, x + 0, y - 23, 2.1, 1.7, '#f4efe0'); // an ox skull on the apex
      line(ctx, x - 3.6, y - 25, x - 2, y - 22.6, '#e8e0cc', 1); // ...with its horns
      line(ctx, x + 3.6, y - 25, x + 2, y - 22.6, '#e8e0cc', 1);
      ellipse(ctx, x + 10.5, y - 27, 3.6, 2.6, '#a8865a'); // the sling bag
      ellipse(ctx, x + 10.5, y - 29, 2.4, 2.2, '#8a8a90');
      line(ctx, x + 9, y - 24.6, x + 5, y - 6, '#c9b58a', 0.8); // sling rope
      poly(ctx, [x + 10.6, y - 27.6, x + 11.6, y - 34, x + 13, y - 27.6], '#f4efe0'); // plumes at the arm's tip
      poly(ctx, [x + 12, y - 27.6, x + 14.8, y - 33, x + 14, y - 27], '#1a1a1a');
      poly(ctx, [x + 9.2, y - 27.6, x + 8.4, y - 32, x + 10.6, y - 27.8], '#c8372d');
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
      if (tribe === 'rome') {
        // torsion skeins of sinew rope bound around each upright, gilded bands and a legion plaque
        for (const [cx0, cy0] of [[-1.5, -1.5], [4.5, 0]] as const) {
          ellipse(ctx, x + cx0, y + cy0, 3, 1.5, '#d8c8a0');
          line(ctx, x + cx0 - 2.4, y + cy0 - 0.4, x + cx0 + 2.4, y + cy0 + 0.4, '#8a7a56', 0.5);
        }
        line(ctx, x - 9, y - 2.6, x + 9, y - 2.6, GOLD, 0.7);
        box(ctx, x + 5, y - 6.2, 2.6, 2.6, GOLD);
        line(ctx, x + 5.4, y - 7, x + 6.6, y - 8.4, '#6b1c18', 0.6);
      }
      break;
    }
  }
}

/** A thin highlight along a beam so wooden parts read as solid. */
function faceQuadLine(ctx: Ctx, x0: number, y0: number, x1: number, y1: number) {
  line(ctx, x0, y0 - 1, x1, y1 - 1, 'rgba(255,255,255,0.25)', 0.8);
}

// ---------------------------------------------------------------- boats


/** A carved tauihu prow board facing right, its base at (x, y): tiki face, red tongue, koru curls and a feather plume. */
function tauihu(ctx: Ctx, x: number, y: number, sc: number) {
  poly(ctx, [x - 3 * sc, y - 1 * sc, x + 6 * sc, y - 4 * sc, x + 8 * sc, y - 12 * sc, x + 5 * sc, y - 18 * sc, x + 1 * sc, y - 13 * sc], '#b3302a');
  poly(ctx, [x - 3 * sc, y - 1 * sc, x + 6 * sc, y - 4 * sc, x + 6.4 * sc, y - 6.4 * sc, x - 2 * sc, y - 3.4 * sc], shade('#b3302a', -0.28));
  poly(ctx, [x + 1 * sc, y - 13 * sc, x + 5 * sc, y - 18 * sc, x + 3.4 * sc, y - 12 * sc], shade('#b3302a', 0.25));
  ellipse(ctx, x + 4.4 * sc, y - 12 * sc, 1.9 * sc, 1.9 * sc, '#f4efe0'); // paua-shell eye
  ellipse(ctx, x + 4.6 * sc, y - 12 * sc, 0.8 * sc, 0.8 * sc, '#3f9a6a');
  ellipse(ctx, x + 4.7 * sc, y - 12 * sc, 0.35 * sc, 0.35 * sc, '#0e0e13');
  poly(ctx, [x + 6.4 * sc, y - 9.4 * sc, x + 10.4 * sc, y - 6.4 * sc, x + 6.6 * sc, y - 6.6 * sc], '#e8574a'); // protruding tongue
  koru(ctx, x + 2 * sc, y - 6.6 * sc, 1.6 * sc, '#f4efe0', 0.6 * sc);
  koru(ctx, x + 6 * sc, y - 15.6 * sc, 1.2 * sc, '#f4efe0', 0.5 * sc, -1);
  feather(ctx, x + 4.6 * sc, y - 17 * sc, x + 2 * sc, y - 26 * sc, 1.4 * sc, '#f4efe0', '#1a1a1e');
  feather(ctx, x + 4.8 * sc, y - 17 * sc, x + 8 * sc, y - 25 * sc, 1.3 * sc, '#1a1a1e', '#f4efe0');
  feather(ctx, x + 4.8 * sc, y - 17 * sc, x + 5.4 * sc, y - 27 * sc, 1.2 * sc, '#f4efe0', '#b3302a');
}

/** A tall openwork taurapa sternpost leaning back from (x, y), with spirals, a feather crest and streamers. */
function taurapa(ctx: Ctx, x: number, y: number, sc: number) {
  poly(ctx, [x + 2 * sc, y - 1 * sc, x - 1 * sc, y - 20 * sc, x - 5 * sc, y - 23 * sc, x - 4.4 * sc, y - 14 * sc, x - 2 * sc, y - 1 * sc], '#b3302a');
  poly(ctx, [x + 2 * sc, y - 1 * sc, x - 1 * sc, y - 20 * sc, x - 2.4 * sc, y - 19 * sc, x - 0.4 * sc, y - 1 * sc], shade('#b3302a', 0.28));
  koru(ctx, x - 2.4 * sc, y - 16 * sc, 1.5 * sc, '#f4efe0', 0.6 * sc);
  koru(ctx, x - 1.2 * sc, y - 9 * sc, 1.3 * sc, '#f4efe0', 0.6 * sc, -1);
  feather(ctx, x - 3 * sc, y - 22 * sc, x - 5.6 * sc, y - 31 * sc, 1.4 * sc, '#f4efe0', '#1a1a1e');
  feather(ctx, x - 2 * sc, y - 21 * sc, x - 1.4 * sc, y - 30 * sc, 1.3 * sc, '#1a1a1e', '#f4efe0');
  for (const [dx, dy, c] of [[-4, 6, '#b3302a'], [-2.6, 7.6, '#f4efe0'], [-1.2, 8, '#1a1a1e']] as const) line(ctx, x - 3.6 * sc, y - 20 * sc, x + (-3.6 + dx * 0.5) * sc, y + (-20 + dy * 1.8) * sc, c, 1 * sc); // hanging streamers
}

/** The Maori sea craft: a canoe, galley and war fleet under a crab-claw sail of black flax with red taniko bands. */
function drawMaoriBoat(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  const tier = kind === 'warship' ? 2 : kind === 'ship' ? 1 : 0;
  const s = 1 + tier * 0.14;
  const w = 19 + tier * 2;
  poly(ctx, [x - w, y - 5, x + w + 3, y - 6, x + w * 0.72, y + 3.5, x - w * 0.7, y + 3.5], '#2a1a12'); // hull
  poly(ctx, [x - w, y - 5, x + w + 3, y - 6, x + w * 0.9, y - 8.5, x - w * 0.9, y - 8], '#4a2c1a'); // upper strake
  poly(ctx, [x - w, y - 5, x + w + 3, y - 6, x + w + 2.2, y - 7.4, x - w + 0.4, y - 6.4], '#b3302a'); // red painted rail
  for (let i = 0; i < 7 + tier * 2; i++) { // white koru carved along the hull side
    const cx = x - w * 0.82 + i * ((w * 1.55) / (6 + tier * 2));
    koru(ctx, cx, y - 2, 1.5, i % 2 ? '#f4efe0' : '#b3302a', 0.55, i % 2 ? 1 : -1);
  }
  line(ctx, x - w * 0.76, y + 1.6, x + w * 0.66, y + 1.2, '#f4efe0', 0.5);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; // foam
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y + 3.6, w * 0.78, 2.3, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.stroke();
  // paddles dipping in the water
  for (let i = 0; i < 3 + tier * 2; i++) {
    const px = x - w * 0.6 + i * (w * 1.2 / (2 + tier * 2));
    line(ctx, px + 2, y - 4, px - 3, y + 5, '#6b4424', 0.9);
    ellipse(ctx, px - 3.4, y + 5.8, 1, 1.8, '#8a5a2b');
    ellipse(ctx, px - 3.4, y + 5.8, 0.4, 1, '#b3302a');
  }
  taurapa(ctx, x - w, y - 5, 0.9 + tier * 0.1);
  tauihu(ctx, x + w + 1, y - 5, 0.95 + tier * 0.1);
  // crab-claw sail: two curved spars in a V, black flax with red bands and white feather fringe
  const mt = y - (33 + tier * 6);
  line(ctx, x, y - 6, x, mt - 1, '#5a3b1e', 2);
  const tl = { x: x - 11 * s, y: mt + 2 }, tr = { x: x + 13 * s, y: mt + 5 }, ap = { x: x + 1.5, y: y - 9.5 };
  poly(ctx, [ap.x, ap.y, tl.x, tl.y, x - 4 * s, mt + 6, x + 1, mt + 7.4, x + 7 * s, mt + 7.4, tr.x, tr.y], '#24242c');
  poly(ctx, [ap.x, ap.y, x + 1, mt + 7.4, x + 7 * s, mt + 7.4, tr.x, tr.y], '#33333d');
  for (const t of [0.28, 0.52, 0.76]) { // red taniko bands radiating from the apex
    const ex = tl.x + (tr.x - tl.x) * t, ey = mt + 5.6 - Math.sin(t * Math.PI) * 2.4;
    line(ctx, ap.x + (ex - ap.x) * 0.12, ap.y + (ey - ap.y) * 0.12, ex, ey, '#b3302a', 1.5 * s);
    line(ctx, ap.x + (ex - ap.x) * 0.3, ap.y + (ey - ap.y) * 0.3, ex, ey, '#f4efe0', 0.45);
  }
  const cx = x + 1.5, cy = (mt + 6 + ap.y) / 2 + 1;
  ellipse(ctx, cx, cy, 2.8 * s, 2.8 * s, '#b3302a');
  ellipse(ctx, cx, cy, 1.8 * s, 1.8 * s, '#f4efe0');
  koru(ctx, cx, cy, 1.1 * s, '#1a1a1e', 0.5 * s);
  line(ctx, ap.x, ap.y, tl.x, tl.y, '#7a4a26', 1.5); // spars
  line(ctx, ap.x, ap.y, tr.x, tr.y, '#7a4a26', 1.5);
  for (let i = 0; i < 6; i++) { // feather fringe along the top of both spars
    const t = i / 5;
    const fx = tl.x + (x + 1.5 - tl.x) * t, fy = tl.y + (mt + 6.6 - tl.y) * t;
    const gx = tr.x + (x + 4 - tr.x) * t, gy = tr.y + (mt + 6.6 - tr.y) * t;
    feather(ctx, fx, fy, fx - 0.6, fy - 4, 0.9, i % 2 ? '#f4efe0' : '#b3302a');
    feather(ctx, gx, gy, gx + 0.6, gy - 4, 0.9, i % 2 ? '#b3302a' : '#f4efe0');
  }
  line(ctx, x - w, y - 6.4, tl.x, tl.y, '#3a2a1a', 0.5); // rigging
  line(ctx, x + w + 1, y - 7, tr.x, tr.y, '#3a2a1a', 0.5);
  line(ctx, x, mt, x + w * 0.4, y - 7.6, '#3a2a1a', 0.5);
  // a long feather banner at the masthead
  poly(ctx, [x, mt - 2, x + 12, mt - 0.4, x + 10, mt + 1, x + 12, mt + 2.8, x, mt + 1.6], '#b3302a');
  poly(ctx, [x, mt - 1, x + 9, mt, x, mt + 0.6], '#f4efe0');
  ellipse(ctx, x, mt - 2.6, 1.3, 1.3, '#3f9a6a');
  feather(ctx, x, mt - 3, x - 1.4, mt - 10, 1.2, '#f4efe0', '#1a1a1e');
  // the crew
  const spots = tier === 0 ? [-12, 11] : tier === 1 ? [-14, -8, 11] : [-17, -11, 10, 16];
  for (const px of spots) figure(ctx, px === spots[spots.length - 1] && tier === 2 ? 'swordsman' : 'warrior', 'polynesia', x + px, y - 7, tier === 2 && px === 16 ? 0.5 : 0.44, true);
  if (tier === 2) { // a carved fighting stage with a tiki post amidships
    box(ctx, x - w * 0.5, y - 8, 7, 3.4, '#4a2c1a', '#8a5a2b');
    band(ctx, x - w * 0.5, y - 8, 7, 3.4, 0.45, 0.7, '#b3302a');
  }
}

/** A Red Sea trading dhow of Adulis: a tall pointed prow, a lateen sail on a long slanting yard, tibeb stripes along the sheer. */
function drawAksumBoat(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  const tier = kind === 'warship' ? 2 : kind === 'ship' ? 1 : 0;
  const s = 1 + tier * 0.14;
  const w = 18.5 * s;
  const hull = '#6a3f22', plank = '#e8dcb8';
  // stern castle behind the hull
  if (tier >= 1) {
    box(ctx, x - w * 0.72, y - 8, 8 * s, 4.4, '#8a5a33');
    band(ctx, x - w * 0.72, y - 8, 8 * s, 4.4, 0.6, 0.78, T_LIME);
    line(ctx, x - w * 0.72 - 4 * s, y - 12.4, x - w * 0.72 + 4 * s, y - 12.4, '#3f2814', 0.8);
  }
  // steering oar over the quarter
  line(ctx, x - w + 1, y - 9, x - w - 3, y + 4.6, '#5a3b1e', 1.1);
  ellipse(ctx, x - w - 3.2, y + 5.4, 1, 1.8, '#8a5a33');
  // hull: dark timber below, pale planks above, a raised stem and a long pointed prow
  poly(ctx, [x - w - 1, y - 8, x + w, y - 7.6, x + w - 6, y + 3.6, x - w + 4, y + 3.6], hull);
  poly(ctx, [x - w - 1, y - 8, x + w, y - 7.6, x + w - 1.6, y - 4, x - w + 0.6, y - 4.2], plank);
  poly(ctx, [x + w, y - 7.6, x + w + 9, y - 14.6, x + w + 10, y - 12.6, x + w - 1.6, y - 4], shade(hull, 0.12)); // the raised, pointed prow
  poly(ctx, [x + w + 9, y - 14.6, x + w + 10, y - 12.6, x + w + 8.4, y - 12.8], GOLD);
  poly(ctx, [x - w - 1, y - 8, x - w - 2.6, y - 12.6, x - w + 3.4, y - 8.4], shade(hull, 0.12)); // the stern post
  line(ctx, x - w - 1, y - 8, x + w, y - 7.6, '#3f2814', 1.1); // sheer rail
  for (const [i, c] of [[0, AK_G], [1, AK_Y], [2, AK_R]] as const) line(ctx, x - w + 0.4, y - 5.8 + i * 0.9 - 0.2, x + w - 1.6, y - 5.6 + i * 0.9 - 0.4, c, 0.8); // tibeb stripes on the planking
  for (let i = 0; i < 7; i++) line(ctx, x - w + 4 + i * (w * 0.28), y - 3.6, x - w + 3 + i * (w * 0.28), y + 3, shade(hull, -0.3), 0.5); // frames
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) ellipse(ctx, x - w * 0.7 + i * (w * 0.36), y - 8.4, 0.9, 0.9, '#6a4426'); // monkey-head beam ends along the rail
  // the mast, and the lateen yard rising from the bow to a high peak aft
  const my = y - (26 + tier * 4);
  line(ctx, x + w * 0.1, y - 7, x + w * 0.1, my, '#4a2e16', 2);
  const tack = { x: x + w * 0.78, y: y - 9 }, peak = { x: x - w * 0.74, y: y - (36 + tier * 5) };
  const clew = { x: x - w * 0.62, y: y - 10.4 };
  poly(ctx, [tack.x, tack.y, peak.x, peak.y, clew.x, clew.y], '#f7f2e2'); // the sail
  poly(ctx, [tack.x, tack.y, peak.x, peak.y, x + w * 0.1, peak.y + (tack.y - peak.y) * 0.62 + 1], '#e6dfc8'); // a shaded panel near the yard
  poly(ctx, [tack.x, tack.y, x - w * 0.15, y - 10.3, clew.x, clew.y], '#e2dbc2'); // foot panel
  for (const f of [0.3, 0.55, 0.8]) line(ctx, tack.x + (peak.x - tack.x) * f, tack.y + (peak.y - tack.y) * f, tack.x + (clew.x - tack.x) * f, tack.y + (clew.y - tack.y) * f, shade('#f7f2e2', -0.22), 0.5); // cloth seams
  for (const [i, c] of [[0, AK_R], [1, AK_Y], [2, AK_G]] as const) line(ctx, clew.x + 0.6, clew.y - 0.4 - i * 1.5, tack.x - 0.6, tack.y - 0.4 - i * 1.5, c, 1); // tibeb stripes along the foot
  const ex = x - w * 0.1, ey = y - (22 + tier * 4.4); // a gold cross in a lime ring on the sail
  ellipse(ctx, ex, ey, 4.2, 4.2, T_LIME);
  ellipse(ctx, ex, ey, 3.3, 3.3, '#f7f2e2');
  line(ctx, ex, ey - 2.6, ex, ey + 2.6, shade(GOLD, -0.1), 1.1);
  line(ctx, ex - 2.6, ey, ex + 2.6, ey, shade(GOLD, -0.1), 1.1);
  line(ctx, tack.x + 3, tack.y + 1, peak.x - 3, peak.y - 1.2, '#5a3b1e', 1.7); // the long yard
  line(ctx, tack.x + 3, tack.y + 0.4, peak.x - 3, peak.y - 1.8, shade('#5a3b1e', 0.35), 0.5);
  line(ctx, peak.x - 3, peak.y - 1.2, peak.x - 3, peak.y - 8, '#3a2a1a', 0.7); // pennant staff
  poly(ctx, [peak.x - 3, peak.y - 8, peak.x + 4.6, peak.y - 6.4, peak.x - 3, peak.y - 4], T_LIME);
  poly(ctx, [peak.x - 3, peak.y - 8, peak.x + 4.6, peak.y - 6.4, peak.x + 3.6, peak.y - 7.4, peak.x - 3, peak.y - 7], shade(T_LIME, 0.35));
  // rigging: stays to the prow, the stern and the deck
  line(ctx, x + w * 0.1, my, x + w + 8, y - 13.6, '#3a2a1a', 0.6);
  line(ctx, x + w * 0.1, my, x - w, y - 8, '#3a2a1a', 0.6);
  line(ctx, x + w * 0.1, my + 3, tack.x, tack.y, '#3a2a1a', 0.5);
  // a foresail on the bigger ships
  if (tier >= 1) {
    poly(ctx, [x + w + 8.6, y - 13.2, x + w * 0.4, y - 9.6, x + w * 0.44, y - 22 - tier * 2], '#efe8d2');
    line(ctx, x + w * 0.44, y - 22 - tier * 2, x + w + 8.6, y - 13.2, shade('#efe8d2', -0.3), 0.6);
    line(ctx, x + w * 0.52, y - 12.4, x + w + 4.6, y - 12, AK_R, 0.9);
  }
  // deck cargo, crew and shields
  if (tier === 0) {
    ellipse(ctx, x + w * 0.42, y - 9, 2.6, 1.9, '#c9a45a'); // sacks of frankincense
    ellipse(ctx, x + w * 0.42, y - 9.5, 1.6, 0.8, '#e0c47a');
    ellipse(ctx, x + w * 0.62, y - 8.8, 2, 1.6, '#b8894a');
    poly(ctx, [x + w * 0.05, y - 8.6, x + w * 0.3, y - 13.4, x + w * 0.36, y - 12, x + w * 0.16, y - 8.4], '#f4efe0'); // a pair of ivory tusks
    poly(ctx, [x + w * 0.16, y - 8.6, x + w * 0.4, y - 12.2, x + w * 0.44, y - 11, x + w * 0.24, y - 8.4], '#e0d8c0');
  } else {
    for (let i = 0; i < 4 + tier * 2; i++) {
      const sxx = x - w * 0.6 + i * ((w * 1.3) / (3 + tier * 2));
      ellipse(ctx, sxx, y - 8.2, 2.2, 2.4, i % 2 ? '#efe6cc' : '#7a4a2a'); // round gasha shields hung on the rail
      ellipse(ctx, sxx, y - 8.2, 0.8, 0.9, GOLD);
      ring(ctx, sxx, y - 8.2, 2.2, 2.4, T_LIME, 0.5);
    }
    if (tier === 1) { // jars of oil and wine on the deck
      for (const ox of [0, 3.4]) { ellipse(ctx, x + w * 0.3 + ox, y - 11.6, 1.7, 2.4, '#b8703a'); ellipse(ctx, x + w * 0.3 + ox, y - 13.6, 0.9, 0.5, '#8a5028'); }
    }
  }
  if (tier === 2) { // a bronze-shod ram at the bow and a lookout's basket
    poly(ctx, [x + w - 5, y + 0.4, x + w + 5, y + 2.6, x + w - 5, y + 3.4], BRONZE);
    poly(ctx, [x + w - 5, y + 0.4, x + w + 5, y + 2.6, x + w - 1, y + 1.4], shade(BRONZE, 0.3));
    box(ctx, x + w * 0.1, my + 2, 5, 2.4, '#5a3b1e');
  }
  // the crew
  figure(ctx, 'warrior', 'ethiopia', x - w * 0.62, y - 7.6, tier ? 0.44 : 0.5, true);
  if (tier >= 1) figure(ctx, 'archer', 'ethiopia', x + w * 0.62, y - 7.6, 0.42, true);
  if (tier === 2) figure(ctx, 'shotelai', 'ethiopia', x - w * 0.02, y - 7.6, 0.42, true);
  // water: a foam line under the hull
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y + 3.4, w * 0.72, 2.1, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.stroke();
}


function drawBoat(ctx: Ctx, kind: UnitKind, tribe: TribeId, x: number, y: number) {
  const T = TRIBES[tribe];
  const tier = kind === 'warship' ? 2 : kind === 'ship' ? 1 : 0;
  const s = 1 + tier * 0.14;
  if (kind === 'waka') {
    // waka taua: a long dark carved war canoe, paddled; red-painted tauihu prow and tall taurapa sternpost
    const wa = 22;
    poly(ctx, [x - wa, y - 5, x + wa - 1, y - 6, x + wa - 7, y + 3.5, x - wa + 5, y + 3.5], '#2a1a12'); // hull
    poly(ctx, [x - wa, y - 5, x + wa - 1, y - 6, x + wa - 2, y - 8.6, x - wa + 1, y - 8], '#4a2c1a'); // upper strake
    taurapa(ctx, x - wa + 1, y - 5, 1.15);
    tauihu(ctx, x + wa - 2, y - 5, 1.2);
    // paddlers, one paddle each, and a row of paddle blades on the water
    for (const px of [-15, -7, 1, 9]) {
      line(ctx, x + px + 2, y - 8, x + px - 4, y + 5, '#6b4424', 0.9);
      ellipse(ctx, x + px - 4.4, y + 5.6, 1.1, 1.9, '#8a5a2b');
      ellipse(ctx, x + px - 4.4, y + 5.6, 0.4, 1, '#b3302a');
    }
    for (const px of [-15, -7, 1, 9]) figure(ctx, 'warrior', tribe, x + px, y - 7, 0.44, true);
    figure(ctx, 'swordsman', tribe, x + 16, y - 6, 0.46, true); // the toa at the bow with his tewhatewha
    poly(ctx, [x - wa + 1, y - 8, x + wa - 2, y - 8.6, x + wa - 3, y - 6.6, x - wa + 2, y - 6], '#b3302a'); // red rail over the paddlers' laps
    for (let i = 0; i < 10; i++) poly(ctx, [x - wa + 4 + i * 4.2, y - 5, x - wa + 7.2 + i * 4.2, y - 5.2, x - wa + 5.6 + i * 4.2, y - 2.2], i % 2 ? '#f4efe0' : '#b3302a'); // taniko triangles down the hull
    for (let i = 0; i < 8; i++) koru(ctx, x - wa + 7 + i * 4.6, y - 0.4, 1.4, i % 2 ? '#f4efe0' : '#b3302a', 0.5, i % 2 ? 1 : -1); // carved koru frieze
    line(ctx, x - wa + 4, y + 1.6, x + wa - 6, y + 1.2, '#f4efe0', 0.5); // white pinstripe
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y + 3.6, wa * 0.75, 2.2, 0, 0.08 * Math.PI, 0.92 * Math.PI);
    ctx.stroke();
    return;
  }
  if (tribe === 'polynesia') return drawMaoriBoat(ctx, kind, x, y);
  if (tribe === 'persia') return drawPersianBoat(ctx, kind, x, y);
  if (tribe === 'inuit') return drawInuitBoat(ctx, kind, x, y);
  if (tribe === 'inca') return drawIncaBoat(ctx, kind, x, y);
  if (tribe === 'ethiopia') return drawAksumBoat(ctx, kind, x, y);
  if (tribe === 'celts') return drawCurragh(ctx, kind, x, y);
  if (tribe === 'aboriginal') return drawAboriginalCanoe(ctx, kind, x, y);
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
  if (tribe === 'rome') {
    // bronze ram at the waterline, a gilded eagle standard and a painted eye on the bow
    poly(ctx, [x + w * 0.7, y + 0.6, x + w + 6, y + 2.6, x + w * 0.7, y + 3.4], BRONZE);
    poly(ctx, [x + w * 0.7, y + 0.6, x + w + 6, y + 2.6, x + w * 0.9, y + 1.8], shade(BRONZE, 0.35));
    ellipse(ctx, x + w - 1, y - 3, 1.5, 1.1, '#f4efe0');
    ellipse(ctx, x + w - 0.8, y - 3, 0.6, 0.6, '#101010');
    if (tier < 2) for (let i = 0; i < 4; i++) { box(ctx, x - w * 0.5 + i * 7, y - 6.4, 3.2, 3, '#b3302a', GOLD); }
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
  if (tribe === 'greeks') {
    // a trireme: bronze ram at the waterline, a painted eye on the bow, a curled aphlaston at the stern
    poly(ctx, [x + w * 0.74, y + 0.4, x + w + 4.6, y + 2.4, x + w * 0.72, y + 3.6], BRONZE);
    poly(ctx, [x + w * 0.74, y + 0.4, x + w + 4.6, y + 2.4, x + w * 0.8, y + 1.6], shade(BRONZE, 0.3));
    ellipse(ctx, x + w * 0.78, y - 3.6, 1.9, 1.3, '#f4f1ea');
    ellipse(ctx, x + w * 0.8, y - 3.6, 0.9, 0.9, T.color);
    ellipse(ctx, x + w * 0.8, y - 3.6, 0.4, 0.4, '#101010');
    poly(ctx, [x - w, y - 5, x - w - 1, y - 13, x - w - 4, y - 16, x - w - 3, y - 11.6, x - w + 3, y - 7], shade(hull, 0.1));
    poly(ctx, [x - w - 1, y - 13, x - w - 4, y - 16, x - w - 5.6, y - 14.6, x - w - 3.4, y - 12.4], GOLD); // curled tip
    line(ctx, x - w * 0.9, y - 5.6, x + w + 2, y - 6.6, BRONZE, 0.8); // bronze-capped rail
    if (tier === 0) for (let i = 0; i < 4; i++) { // a single bank of oars
      line(ctx, x - w * 0.6 + i * 5, y - 1, x - w * 0.6 + i * 5 - 3, y + 6, '#6b4424', 1.1);
      ellipse(ctx, x - w * 0.6 + i * 5 - 3.3, y + 6.6, 1.7, 0.8, '#9a6a3a');
    }
    if (tier < 2) for (let i = 0; i < 4; i++) ellipse(ctx, x - w * 0.5 + i * 7, y - 7.4, 2, 2, i % 2 ? BRONZE : T.color); // round shields on the rail
  }
  if (tribe === 'zulu') {
    // an ox-horn prow, lashed hide seams and a fringe of cow tails at the stern
    for (const [dx, tipx, tipy] of [[0, 5.6, -14], [2.2, 8, -12]] as const) {
      poly(ctx, [x + w + dx, y - 6, x + w + dx + 1.6, y - 6.4, x + w + tipx, y + tipy, x + w + dx + 0.6, y - 9], '#f4efe0');
      poly(ctx, [x + w + dx + 1.6, y - 6.4, x + w + tipx, y + tipy, x + w + dx + 0.6, y - 9], shade('#f4efe0', -0.22));
    }
    for (let i = 0; i < 5; i++) line(ctx, x - w * 0.8 + i * (w * 0.4), y - 8, x - w * 0.8 + i * (w * 0.4) - 0.6, y - 4, '#f4efe0', 0.8); // hide lashings over the strake
    for (let i = 0; i < 4; i++) { // cow tails along the stern rail
      line(ctx, x - w + 1 + i * 1.6, y - 6.4 + i * 0.1, x - w + 0.6 + i * 1.6, y - 2.6, i % 2 ? '#2a1a10' : '#f4efe0', 1);
    }
    if (tier < 2) for (let i = 0; i < 4; i++) { ellipse(ctx, x - w * 0.5 + i * 7, y - 7.4, 1.6, 2.4, '#f4efe0'); ellipse(ctx, x - w * 0.5 + i * 7 + 0.2, y - 7.2, 0.6, 1, '#2a1a10'); } // oval war shields hung on the rail
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
  if (tribe === 'rome') { // aquila atop the mast
    ellipse(ctx, x, top - 4.4, 1.4, 1.4, GOLD);
    poly(ctx, [x, top - 3.4, x - 4.2, top - 6.6, x - 2.4, top - 3.6], GOLD);
    poly(ctx, [x, top - 3.4, x + 4.2, top - 6.6, x + 2.4, top - 3.6], shade(GOLD, -0.2));
  }
  poly(ctx, [x, top - 2, x + 9, top, x, top + 2], T.color); // pennant
  poly(ctx, [x, top - 2, x + 9, top, x + 7.6, top - 0.8, x, top - 1.2], shade(T.color, 0.35));
  for (const f of [0.3, 0.62]) { // battens across the sails
    line(ctx, x + 1, top + (y - 11 - top) * f, x + 1 + (14 * s - 1) * f, top + (y - 14 - top) * f, shade(sail, -0.3), 0.5);
    line(ctx, x - 1, top + 2 + (y - 11 - top - 2) * f, x - 1 - (12 * s - 1) * f, top + 2 + (y - 14 - top - 2) * f, shade(sail, -0.4), 0.5);
  }
  if (tribe === 'greeks') {
    // a striped square-rigged sail with a bronze sun disc
    for (const f of [0.35, 0.7]) line(ctx, x - 1, top + 2 + (y - 11 - top - 2) * f, x - 1 - (12 * s - 1) * f, top + 2 + (y - 14 - top - 2) * f, T.color, 1.6);
    ellipse(ctx, x + 5.4 * s, y - 20 - tier * 2, 2.2, 2.2, GOLD);
    ellipse(ctx, x + 5 * s, y - 20.4 - tier * 2, 0.8, 0.8, shade(GOLD, 0.6));
  }
  if (tribe === 'zulu') {
    // a hide sail patched in cow-spots, a plume at the masthead
    for (const [sx, sy] of [[5, 22], [8.5, 16.5], [-6, 19], [-9, 15]] as const) ellipse(ctx, x + sx * s, y - sy - tier * 2, 1.9, 1.5, '#2a1a10');
    poly(ctx, [x, top - 2, x + 1.4, top - 9, x + 2.8, top - 1.4], '#f4efe0');
    poly(ctx, [x + 1.4, top - 1.8, x + 4.6, top - 8, x + 4.8, top - 0.6], '#1a1a1a');
    poly(ctx, [x - 1.4, top - 1.6, x - 2.4, top - 7, x + 0.4, top - 1.2], '#c8372d');
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

// ---------------------------------------------------------------- Inuit: bone arms, sled, caribou and skin boats

const I_FUR = '#f4f8fb', I_FUR2 = '#c5d4de', I_BONE = '#e8e0c8', I_BONE2 = '#b8ad90', I_BROWN = '#5a3e2b';
const I_SLATE = '#8fa5b5', I_SINEW = '#d9c9a0', I_DEEP = '#2f6f94', I_ICE = '#7fd0f5';

/** A sealskin kamik: a white fur cuff, a red-and-white mosaic band and (for the heavy ranks) lashed bone shin guards. */
function inuitLeg(ctx: Ctx, f: 'L' | 'R', cx: number, cy: number, w: number, h: number, heavy: boolean) {
  const q = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, f, cx, cy, w, h, u0, u1, v0, v1, c);
  q(0, 1, 0.13, 0.2, I_RED); // mosaic band
  for (const u of [0.08, 0.4, 0.72]) q(u, u + 0.2, 0.13, 0.2, I_FUR);
  q(0, 1, 0.2, 0.23, I_BROWN);
  q(0, 1, 0.42, 0.55, I_FUR); // fur cuff
  for (const u of [0.1, 0.4, 0.7]) q(u, u + 0.12, 0.42, 0.47, I_FUR2);
  if (heavy) q(0.1, 0.9, 0.66, 0.7, I_RED); // sinew lashing on the shin guard
}

/** A husky in harness: grey coat, pale belly and mask, pricked ears and a curled tail. `face` flips it. */
function inuitDog(ctx: Ctx, x: number, y: number, k: number, coat: string, patch: string) {
  for (const lx of [-3.6, -1.8, 2.4, 4]) line(ctx, x + lx * k, y - 3 * k, x + (lx + 0.3) * k, y + 0.4 * k, shade(coat, -0.35), 1.3 * k);
  poly(ctx, [x - 5.4 * k, y - 6.6 * k, x - 8.6 * k, y - 10.2 * k, x - 9.4 * k, y - 7 * k, x - 6.6 * k, y - 4.6 * k], coat); // curled tail
  poly(ctx, [x - 8.6 * k, y - 10.2 * k, x - 9.4 * k, y - 7 * k, x - 8.4 * k, y - 8 * k], I_FUR);
  box(ctx, x, y - 3 * k, 10 * k, 4.2 * k, coat);
  band(ctx, x, y - 3 * k, 10 * k, 4.2 * k, 0, 0.3, patch);
  faceQuad(ctx, 'R', x, y - 3 * k, 10 * k, 4.2 * k, 0.5, 0.95, 0.4, 0.9, shade(coat, 0.1));
  line(ctx, x - 2 * k, y - 7 * k, x + 4 * k, y - 4.6 * k, I_RED, 0.8 * k); // harness
  box(ctx, x + 5.6 * k, y - 6.4 * k, 4.4 * k, 3.8 * k, coat);
  faceQuad(ctx, 'R', x + 5.6 * k, y - 6.4 * k, 4.4 * k, 3.8 * k, 0.15, 0.95, 0, 0.5, patch); // pale muzzle
  faceQuad(ctx, 'R', x + 5.6 * k, y - 6.4 * k, 4.4 * k, 3.8 * k, 0.7, 0.95, 0.3, 0.5, '#1a1a1e'); // nose
  faceQuad(ctx, 'R', x + 5.6 * k, y - 6.4 * k, 4.4 * k, 3.8 * k, 0.32, 0.5, 0.58, 0.8, '#101010'); // eye
  poly(ctx, [x + 4 * k, y - 10 * k, x + 4.4 * k, y - 12.8 * k, x + 6 * k, y - 10.2 * k], shade(coat, -0.2));
  poly(ctx, [x + 6.6 * k, y - 10.2 * k, x + 8 * k, y - 12.6 * k, x + 8.8 * k, y - 9.6 * k], coat);
}

/** A branching caribou antler rooted at (bx, by), leaning back and up; `s` mirrors the tines. */
function antler(ctx: Ctx, bx: number, by: number, k: number, col: string, w: number, lean = 1) {
  const P = (dx: number, dy: number) => [bx + dx * k * lean, by + dy * k] as const;
  const seg = (a: readonly [number, number], b: readonly [number, number], t: number) => line(ctx, a[0], a[1], b[0], b[1], col, t * k);
  const p0 = P(0, 0), p1 = P(-1, -5), p2 = P(-3.4, -9.6), p3 = P(-3.6, -15.4);
  seg(p0, p1, w); seg(p1, p2, w * 0.9); seg(p2, p3, w * 0.75);
  seg(p1, P(3.4, -7.8), w * 0.7); // brow tine reaching forward
  seg(P(3.4, -7.8), P(4.2, -10.4), w * 0.5);
  seg(p2, P(0.6, -13.6), w * 0.6);
  seg(p3, P(-7, -18), w * 0.6);
  seg(p3, P(-1.8, -20.4), w * 0.55);
  seg(P(-3.5, -12), P(-6.4, -13), w * 0.5);
}

/**
 * A caribou: shaggy brown coat with a white mane, belly and rump, dark flank stripe, big hooves and a great rack of antlers.
 * With `saddle` it wears a white fur pad edged in red and a beaded harness; `armour` adds lashed bone plates.
 * Returns the point where a rider sits (the same seat as drawHorse).
 */
function drawCaribou(ctx: Ctx, x: number, y: number, k: number, o: { saddle?: boolean; armour?: boolean } = {}) {
  const coat = '#8a6a4c', dark = '#5e4530', pale = '#f1ede2';
  const legs: [number, number][] = [[-6, -1.5], [-3, 0.5], [4, -0.5], [7, 1.5]];
  antler(ctx, x + 8.8 * k, y - 20 * k, k * 0.7, '#cbbd9a', 1, 1); // the far antler, paler and behind
  for (const [lx, ly] of legs) {
    box(ctx, x + lx * k, y + ly * k, 2.6 * k, 7 * k, dark);
    faceQuad(ctx, 'R', x + lx * k, y + ly * k, 2.6 * k, 7 * k, 0, 1, 0.14, 0.34, pale); // pale fetlocks
    faceQuad(ctx, 'L', x + lx * k, y + ly * k, 2.6 * k, 7 * k, 0, 1, 0.14, 0.34, pale);
    box(ctx, x + lx * k, y + ly * k, 3 * k, 1.5 * k, '#2a1c14'); // broad, splayed hooves
  }
  poly(ctx, [x - 9 * k, y - 11 * k, x - 11 * k, y - 8.2 * k, x - 9.4 * k, y - 8 * k], pale); // stub of a tail
  box(ctx, x, y - 6 * k, 17 * k, 7 * k, coat);
  band(ctx, x, y - 6 * k, 17 * k, 7 * k, 0, 0.2, pale); // pale belly
  faceQuad(ctx, 'R', x, y - 6 * k, 17 * k, 7 * k, 0.1, 0.95, 0.24, 0.42, dark); // dark flank stripe
  faceQuad(ctx, 'L', x, y - 6 * k, 17 * k, 7 * k, 0.05, 0.9, 0.24, 0.42, dark);
  faceQuad(ctx, 'L', x, y - 6 * k, 17 * k, 7 * k, 0.02, 0.28, 0.42, 0.92, pale); // white rump
  faceQuad(ctx, 'R', x, y - 6 * k, 17 * k, 7 * k, 0.5, 0.94, 0.6, 1, shade(coat, 0.1)); // shoulder
  for (let i = 0; i < 6; i++) faceQuad(ctx, 'R', x, y - 6 * k, 17 * k, 7 * k, 0.06 + i * 0.15, 0.1 + i * 0.15, 0.04, 0.14, I_FUR2); // shaggy belly fringe
  if (o.armour) {
    band(ctx, x, y - 6 * k, 17 * k, 7 * k, 0, 0.7, I_FUR);
    band(ctx, x, y - 6 * k, 17 * k, 7 * k, 0.1, 0.18, I_RED);
    for (let i = 0; i < 6; i++) {
      faceQuad(ctx, 'R', x, y - 6 * k, 17 * k, 7 * k, 0.08 + i * 0.15, 0.17 + i * 0.15, 0.22, 0.66, I_BONE); // bone barding plates
      faceQuad(ctx, 'R', x, y - 6 * k, 17 * k, 7 * k, 0.08 + i * 0.15, 0.09 + i * 0.15, 0.22, 0.66, I_BONE2);
    }
    band(ctx, x, y - 6 * k, 17 * k, 7 * k, 0.44, 0.48, I_RED);
    band(ctx, x, y - 6 * k, 17 * k, 7 * k, 0.62, 0.66, I_DEEP);
  } else if (o.saddle) {
    band(ctx, x - 1 * k, y - 6 * k, 9 * k, 7 * k, 0.62, 0.9, I_FUR); // white fur saddle pad
    band(ctx, x - 1 * k, y - 6 * k, 9 * k, 7 * k, 0.62, 0.7, I_RED);
    for (const u of [0.15, 0.4, 0.65, 0.88]) faceQuad(ctx, 'R', x - 1 * k, y - 6 * k, 9 * k, 7 * k, u, u + 0.1, 0.63, 0.69, I_FUR);
  }
  box(ctx, x - 1 * k, y - 12.6 * k, 6 * k, 1.5 * k, I_BROWN); // saddle
  box(ctx, x - 4 * k, y - 12.8 * k, 1.6 * k, 2.4 * k, '#3a2a1e');
  box(ctx, x + 2.4 * k, y - 12.6 * k, 1.4 * k, 2 * k, '#3a2a1e');
  // thick neck under a great white mane
  box(ctx, x + 7.8 * k, y - 10.4 * k, 5.4 * k, 8 * k, coat);
  box(ctx, x + 8 * k, y - 8.8 * k, 6.4 * k, 5.6 * k, pale);
  for (const [mx, my] of [[5.2, -5.4], [6.6, -3.6], [9.4, -3.2], [12, -4.4], [11.6, -6.8]] as const) poly(ctx, [x + mx * k, y + my * k, x + (mx + 1.6) * k, y + (my + 0.3) * k, x + (mx + 0.4) * k, y + (my + 2.2) * k], I_FUR2); // ragged mane points
  box(ctx, x + 11 * k, y - 15.6 * k, 7 * k, 5.6 * k, shade(coat, -0.05)); // head
  box(ctx, x + 14.8 * k, y - 14.8 * k, 3.8 * k, 3.6 * k, '#d9d1c0'); // pale muzzle
  faceQuad(ctx, 'R', x + 14.8 * k, y - 14.8 * k, 3.8 * k, 3.6 * k, 0.4, 0.78, 0.25, 0.5, '#1a1010'); // nostril
  faceQuad(ctx, 'R', x + 11 * k, y - 15.6 * k, 7 * k, 5.6 * k, 0.42, 0.6, 0.45, 0.75, '#101010'); // eye
  faceQuad(ctx, 'R', x + 11 * k, y - 15.6 * k, 7 * k, 5.6 * k, 0.47, 0.53, 0.62, 0.72, '#ffffff');
  poly(ctx, [x + 9.2 * k, y - 20 * k, x + 8.4 * k, y - 23.4 * k, x + 11 * k, y - 20.6 * k], shade(coat, -0.2)); // ear
  antler(ctx, x + 12 * k, y - 20.4 * k, k * 0.82, '#eadfc2', 1.4, 1); // the near antler, thick with velvet
  if (o.saddle || o.armour) {
    // beaded harness: a strap across the chest hung with bone discs, a red-and-white browband and reins
    line(ctx, x + 4.4 * k, y - 10 * k, x + 9.6 * k, y - 3.6 * k, I_RED, 1.2 * k);
    for (const t of [0.15, 0.5, 0.85]) ellipse(ctx, x + 4.4 * k + 5.2 * k * t, y - 10 * k + 6.4 * k * t, 1.1 * k, 1.1 * k, I_BONE);
    faceQuad(ctx, 'R', x + 11 * k, y - 15.6 * k, 7 * k, 5.6 * k, 0.05, 0.95, 0.82, 0.96, I_RED);
    for (const u of [0.16, 0.42, 0.68]) faceQuad(ctx, 'R', x + 11 * k, y - 15.6 * k, 7 * k, 5.6 * k, u, u + 0.12, 0.84, 0.94, I_FUR);
    line(ctx, x + 15.6 * k, y - 14.6 * k, x + 12 * k, y - 16.4 * k, I_BROWN, 0.6 * k);
    ctx.strokeStyle = I_BROWN;
    ctx.lineWidth = 0.6 * k;
    ctx.beginPath();
    ctx.moveTo(x + 15.6 * k, y - 14.6 * k);
    ctx.quadraticCurveTo(x + 9 * k, y - 8.6 * k, x + 2.6 * k, y - 12.2 * k);
    ctx.stroke();
  }
  if (o.armour) {
    faceQuad(ctx, 'R', x + 11 * k, y - 15.6 * k, 7 * k, 5.6 * k, 0.1, 0.9, 0.5, 0.8, I_BONE); // a bone chamfron
    faceQuad(ctx, 'R', x + 11 * k, y - 15.6 * k, 7 * k, 5.6 * k, 0.46, 0.54, 0.5, 0.8, I_BONE2);
  }
  return { x: x - 1 * k, y: y - 13 * k };
}

/** A harpoon-lance for the mounted hunters: a long shaft, an ivory foreshaft with a slate blade, and fur tassels. */
function inuitLance(ctx: Ctx, hx: number, hy: number, thick: number) {
  const tx = hx + 8, ty = hy - 20;
  line(ctx, hx - 3, hy + 6, tx, ty, '#8a6a44', thick);
  line(ctx, hx - 3.6, hy + 6, tx - 0.6, ty, shade('#8a6a44', 0.35), 0.5);
  for (const t of [0.1, 0.16, 0.22]) line(ctx, hx - 3 + 11 * t - 1, hy + 6 - 26 * t + 0.4, hx - 3 + 11 * t + 1, hy + 6 - 26 * t - 0.4, I_RED, 0.8); // sinew grip
  ellipse(ctx, hx - 0.4, hy + 0.4, 2.4, 1.4, I_FUR); // a fur mitt-guard
  poly(ctx, [tx + 0.4, ty - 6, tx - 1.6, ty + 0.6, tx + 0.4, ty + 1.2], shade(I_BONE, 0.1)); // ivory head
  poly(ctx, [tx + 0.4, ty - 6, tx + 2.4, ty + 0.4, tx + 0.4, ty + 1.2], shade(I_BONE, -0.25));
  poly(ctx, [tx + 0.4, ty - 4, tx - 0.6, ty - 0.4, tx + 1.4, ty - 0.4], I_SLATE); // slate blade
  poly(ctx, [tx - 1, ty + 0.6, tx - 3.2, ty + 2.6, tx - 0.6, ty + 1.8], I_BONE); // a barb
  poly(ctx, [tx - 0.4, ty + 2.4, tx + 7, ty + 3.4, tx + 4.6, ty + 5.2, tx + 7, ty + 7, tx - 0.8, ty + 6], I_DEEP); // swallow-tailed pennant
  poly(ctx, [tx - 0.4, ty + 2.4, tx + 7, ty + 3.4, tx + 6, ty + 4, tx - 0.5, ty + 3.6], I_ICE);
  ellipse(ctx, tx + 1.6, ty + 4.4, 0.7, 0.7, I_FUR);
}

/** Inuit hand weapons. Called with the weapon hand at (x, y). */
function inuitMelee(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  const wrap = (x0: number, y0: number, x1: number, y1: number, n: number, color: string, w: number) => {
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      line(ctx, x0 + (x1 - x0) * t - 0.9 * k, y0 + (y1 - y0) * t + 0.3 * k, x0 + (x1 - x0) * t + 0.9 * k, y0 + (y1 - y0) * t - 0.3 * k, color, w);
    }
  };
  if (kind === 'giant') {
    // a whale-rib great-club: a curved rib as thick as an arm, a slate-edged head and a polar-bear-fur tassel
    curvedBlade(ctx, x - 0.5 * k, y + 4 * k, x + 1.5 * k, y - 8 * k, x + 7.6 * k, y - 16.6 * k, 3.2 * k, I_BONE, k);
    ellipse(ctx, x + 7.8 * k, y - 16.8 * k, 2.6 * k, 2.2 * k, shade(I_BONE, -0.1));
    ellipse(ctx, x + 7.2 * k, y - 17.4 * k, 1.2 * k, 0.9 * k, shade(I_BONE, 0.35));
    for (const [dx, dy] of [[9.6, -18.8], [10.4, -15.6], [6.8, -19.6]] as const) poly(ctx, [x + (dx - 1.2) * k, y + (dy + 1.6) * k, x + dx * k, y + dy * k, x + (dx + 1) * k, y + (dy + 1.8) * k], I_SLATE); // slate teeth
    wrap(x - 0.3 * k, y + 3 * k, x + 0.8 * k, y - 3 * k, 4, I_RED, 1 * k);
    poly(ctx, [x - 0.4 * k, y + 4 * k, x - 3 * k, y + 8 * k, x - 0.6 * k, y + 7 * k, x + 0.8 * k, y + 8.4 * k, x + 1 * k, y + 4 * k], I_FUR);
    return;
  }
  // a walrus-tusk war pick: a hafted, curved tusk with a slate tip and a round stone counterweight behind
  line(ctx, x - 0.6 * k, y + 2.4 * k, x + 1.8 * k, y - 9 * k, '#8a6a44', 1.9 * k);
  line(ctx, x - 0.9 * k, y + 2.4 * k, x + 1.5 * k, y - 9 * k, shade('#8a6a44', 0.4), 0.5 * k);
  wrap(x - 0.4 * k, y + 1.6 * k, x + 0.6 * k, y - 2.4 * k, 3, I_RED, 0.8 * k);
  curvedBlade(ctx, x - 0.4 * k, y - 8.6 * k, x + 5.4 * k, y - 15.4 * k, x + 10 * k, y - 9.2 * k, 2.8 * k, I_BONE, k);
  poly(ctx, [x + 10 * k, y - 9.2 * k, x + 11.2 * k, y - 6.2 * k, x + 8.6 * k, y - 8.6 * k], I_SLATE); // slate tip
  ellipse(ctx, x - 1.8 * k, y - 9.6 * k, 1.9 * k, 1.9 * k, '#7d8c98'); // the counterweight stone
  ellipse(ctx, x - 2.3 * k, y - 10.2 * k, 0.7 * k, 0.7 * k, '#b6c4ce');
  ellipse(ctx, x + 1.8 * k, y - 9 * k, 1.5 * k, 1.2 * k, I_RED); // sinew lashing
  poly(ctx, [x - 0.6 * k, y + 2.6 * k, x - 2.8 * k, y + 5.6 * k, x - 0.2 * k, y + 4.6 * k], I_FUR); // a fur tassel on the wrist loop
}

/** The bone sword of the heavy ranks: a flat whalebone blade with a slate edge and a tusk cross-guard. */
function inuitSword(ctx: Ctx, x: number, y: number, k: number) {
  blade(ctx, x + 0.2 * k, y - 1 * k, x + 3 * k, y - 14 * k, 3 * k, I_BONE);
  line(ctx, x + 1.2 * k, y - 4 * k, x + 2.8 * k, y - 12 * k, I_SLATE, 0.7 * k); // slate inlay
  for (const t of [0.35, 0.55, 0.75]) line(ctx, x + (0.2 + 2.8 * t) * k + 1.2 * k, y + (-1 - 13 * t) * k, x + (0.2 + 2.8 * t) * k + 2 * k, y + (-1 - 13 * t) * k - 0.4 * k, I_BONE2, 0.6 * k); // notches
  hilt(ctx, x + 0.2 * k, y - 1 * k, 0.2, -1, k, I_BONE, I_BROWN);
  line(ctx, x - 0.4 * k, y - 0.4 * k, x + 1.2 * k, y - 0.6 * k, I_RED, 0.9 * k);
  poly(ctx, [x + 0.2 * k, y + 2.4 * k, x - 1.6 * k, y + 6 * k, x + 0.4 * k, y + 4.8 * k], I_FUR); // fur tassel on the pommel
}

/** A leister-spear for the shield-bearers: bone head with a slate blade and side barbs, red-wrapped shaft, fur tassel. */
function inuitSpear(ctx: Ctx, x: number, y: number, k: number) {
  line(ctx, x + 1 * k, y + 5 * k, x + 2 * k, y - 18 * k, '#8a6a44', 1.7 * k);
  line(ctx, x + 0.6 * k, y + 5 * k, x + 1.6 * k, y - 18 * k, shade('#8a6a44', 0.4), 0.5 * k);
  ellipse(ctx, x + 1 * k, y + 5.2 * k, 1.2 * k, 0.9 * k, I_BONE2);
  poly(ctx, [x + 2 * k, y - 24 * k, x + 0.4 * k, y - 17.6 * k, x + 2 * k, y - 16.4 * k], shade(I_BONE, 0.15)); // ivory head, lit side
  poly(ctx, [x + 2 * k, y - 24 * k, x + 3.8 * k, y - 17.6 * k, x + 2 * k, y - 16.4 * k], shade(I_BONE, -0.28));
  poly(ctx, [x + 2 * k, y - 22.4 * k, x + 1.2 * k, y - 19 * k, x + 2.9 * k, y - 19 * k], I_SLATE); // slate blade
  for (const s of [-1, 1]) poly(ctx, [x + 2 * k, y - 17 * k, x + (2 + s * 3.4) * k, y - 20.2 * k, x + (2 + s * 2.6) * k, y - 16.6 * k], I_BONE); // barbs
  ellipse(ctx, x + 1.95 * k, y - 16.2 * k, 1.5 * k, 0.9 * k, I_RED);
  for (const t of [0.05, 0.1, 0.15, 0.2]) line(ctx, x + 1 * k + 1 * k * t * 4 - 0.9 * k, y + 5 * k - 23 * k * t * 1.6, x + 1 * k + 1 * k * t * 4 + 0.9 * k, y + 5 * k - 23 * k * t * 1.6 - 0.3 * k, I_RED, 0.5 * k);
  poly(ctx, [x + 1.4 * k, y - 15.8 * k, x - 0.4 * k, y - 11 * k, x + 1.2 * k, y - 12.4 * k, x + 2.4 * k, y - 10.6 * k, x + 2.8 * k, y - 15.8 * k], I_FUR); // fur tassel
  line(ctx, x + 0.6 * k, y - 13.4 * k, x + 0.4 * k, y - 11.4 * k, I_FUR2, 0.4 * k);
}

/** The toggling harpoon: ivory foreshaft, a barbed bone head with slate blade, and the line coiled back to the hand and a float. */
function inuitHarpoon(ctx: Ctx, hx: number, hy: number, k: number) {
  const ux = 0.42, uy = -0.9;
  const P = (t: number) => [hx + ux * t * k, hy + uy * t * k] as const;
  const butt = P(-9), tip = P(17);
  line(ctx, butt[0], butt[1], tip[0], tip[1], '#7a5a3a', 1.9 * k);
  line(ctx, butt[0] - 0.4 * k, butt[1], tip[0] - 0.4 * k, tip[1], shade('#7a5a3a', 0.4), 0.5 * k);
  for (const t of [-6, -4.6, -3.2, -1.8]) { const p = P(t); line(ctx, p[0] - 1 * k, p[1] + 0.3 * k, p[0] + 1 * k, p[1] - 0.3 * k, I_RED, 0.7 * k); } // red-wrapped grip
  const b0 = P(-9);
  ellipse(ctx, b0[0], b0[1], 1.3 * k, 1 * k, I_BONE2); // ivory butt cap
  const f0 = P(15.4), f1 = P(19.4);
  line(ctx, f0[0], f0[1], f1[0], f1[1], I_BONE, 2.4 * k); // the foreshaft
  const h1 = P(24.4);
  poly(ctx, [f1[0], f1[1], f1[0] - 2.6 * k, f1[1] - 1.2 * k, h1[0], h1[1], f1[0] + 2.6 * k, f1[1] + 0.4 * k], shade(I_BONE, 0.05)); // the toggle head
  poly(ctx, [f1[0], f1[1], f1[0] + 2.6 * k, f1[1] + 0.4 * k, h1[0], h1[1]], shade(I_BONE, -0.28));
  const s1 = P(23);
  poly(ctx, [h1[0], h1[1], s1[0] - 1 * k, s1[1] + 0.6 * k, s1[0] + 1.2 * k, s1[1] + 0.8 * k], I_SLATE); // slate blade
  ellipse(ctx, f1[0], f1[1], 1.4 * k, 0.9 * k, I_RED);
  // the line: from the head, sagging down to a coil in the hand and a trailing loop
  ctx.strokeStyle = I_SINEW;
  ctx.lineWidth = 0.7 * k;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(f1[0] + 0.6 * k, f1[1] + 1 * k);
  ctx.quadraticCurveTo(hx + 8.4 * k, hy - 4 * k, hx + 1.8 * k, hy + 3 * k);
  ctx.stroke();
  for (const [ox, oy] of [[0, 3.6], [-0.8, 4.6], [0.6, 5.4]] as const) ring(ctx, hx + 2 * k + ox * k, hy + oy * k, 2 * k, 1.1 * k, I_SINEW, 0.6 * k); // coiled line
}

/** A sealskin float (avataq): a taut inflated bladder with a bone plug and a painted band. */
function inuitFloat(ctx: Ctx, x: number, y: number, k: number) {
  ellipse(ctx, x, y, 3.2 * k, 3.8 * k, '#7a6a5a');
  ellipse(ctx, x - 0.8 * k, y - 1 * k, 1.9 * k, 2.3 * k, '#a89886');
  ring(ctx, x, y, 3.2 * k, 3.8 * k, '#4a3a2c', 0.5 * k);
  line(ctx, x - 3 * k, y + 0.2 * k, x + 3 * k, y + 0.6 * k, I_RED, 0.9 * k);
  ellipse(ctx, x + 0.4 * k, y - 4 * k, 0.9 * k, 0.7 * k, I_BONE);
}

/** A round hide shield stretched on a bone hoop, painted with a six-armed snow crystal. */
function inuitShieldFace(ctx: Ctx, x: number, y: number, k: number) {
  const cx = x - 1 * k, cy = y - 5 * k;
  ellipse(ctx, cx, cy, 5 * k, 5.5 * k, I_BONE); // hoop
  ellipse(ctx, cx, cy, 4.1 * k, 4.6 * k, '#e9f0f4'); // hide
  ring(ctx, cx, cy, 3.6 * k, 4 * k, I_RED, 0.8 * k);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const ex = cx + Math.cos(a) * 3.3 * k, ey = cy + Math.sin(a) * 3.6 * k;
    line(ctx, cx, cy, ex, ey, I_DEEP, 0.9 * k);
    const mx = cx + Math.cos(a) * 2 * k, my = cy + Math.sin(a) * 2.2 * k;
    for (const s of [-0.6, 0.6]) line(ctx, mx, my, mx + Math.cos(a + s) * 1.4 * k, my + Math.sin(a + s) * 1.5 * k, I_DEEP, 0.5 * k);
  }
  ellipse(ctx, cx, cy, 1.1 * k, 1.2 * k, I_RED);
  ellipse(ctx, cx - 0.3 * k, cy - 0.4 * k, 0.4 * k, 0.4 * k, I_FUR);
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; ellipse(ctx, cx + Math.cos(a) * 4.7 * k, cy + Math.sin(a) * 5.2 * k, 0.4 * k, 0.4 * k, I_BONE2); } // lashing knots
  ellipse(ctx, cx - 2.2 * k, cy - 3 * k, 1 * k, 0.7 * k, 'rgba(255,255,255,0.7)'); // sheen
}

/**
 * The sled catapult: a bone-and-sinew torsion engine on a runnered sled, whale-rib uprights bound with twisted
 * sinew skeins, a tusk throwing arm with a sealskin sling, and a pair of huskies in harness. It flings ice.
 */
function inuitCatapult(ctx: Ctx, x: number, y: number) {
  // huskies pulling ahead, each on a trace to the sled
  line(ctx, x + 15, y + 1, x + 22, y + 2.4, I_SINEW, 0.7);
  line(ctx, x + 14, y + 5, x + 26, y + 6.6, I_SINEW, 0.7);
  inuitDog(ctx, x + 22, y + 3.6, 0.72, '#8e9aa3', '#e9e4d8');
  inuitDog(ctx, x + 27, y + 8, 0.72, '#e9e4d8', '#b59a78');
  // runners, curled up at the front, joined by stanchions
  ctx.lineCap = 'round';
  for (const [dx, dy, w] of [[3.4, -2.2, 1.6], [0, 0, 2.2]] as const) {
    for (const c of ['#3a2a1c', '#8a6a44']) {
      ctx.strokeStyle = c;
      ctx.lineWidth = c === '#3a2a1c' ? w : 0.7;
      ctx.beginPath();
      ctx.moveTo(x - 17 + dx, y + 7 + dy - (c === '#3a2a1c' ? 0 : 0.5));
      ctx.lineTo(x + 11 + dx, y + 6 + dy - (c === '#3a2a1c' ? 0 : 0.5));
      ctx.quadraticCurveTo(x + 17 + dx, y + 5.6 + dy, x + 16 + dx, y + 0.6 + dy);
      ctx.stroke();
    }
  }
  for (const sx of [-12, -2, 8]) line(ctx, x + sx, y + 2.6, x + sx, y + 6.6, '#5a4632', 1.6);
  for (const sx of [-10, 0, 10]) line(ctx, x + sx + 3.4, y + 0.4, x + sx + 3.4, y + 4.4, '#4a3828', 1.2);
  // the deck: driftwood boards lashed with sinew
  poly(ctx, [x - 16, y + 1.6, x + 12, y + 0.4, x + 16, y - 3.2, x - 12, y - 2.4], '#c9b48e');
  poly(ctx, [x - 16, y + 1.6, x + 12, y + 0.4, x + 12, y + 3.4, x - 16, y + 4.6], '#8a7250');
  poly(ctx, [x + 12, y + 0.4, x + 16, y - 3.2, x + 16, y - 0.4, x + 12, y + 3.4], '#6a5438');
  for (const t of [0.2, 0.42, 0.64, 0.86]) line(ctx, x - 16 + 28 * t, y + 1.6 - 1.2 * t, x - 12 + 28 * t, y - 2.4 - 0.8 * t, '#a08a66', 0.5); // board seams
  for (const t of [0.12, 0.5, 0.88]) line(ctx, x - 16 + 28 * t, y + 1.8 - 1.2 * t, x - 16 + 28 * t, y + 4.2 - 0.5 * t, I_SINEW, 0.6); // lashings on the deck edge
  for (const [ax, ay, ar] of [[-13.4, -0.4, 2.2], [-10, 0.4, 2.1], [-11.8, -2.6, 2]] as const) { // ice-ball ammunition stacked on the deck
    ellipse(ctx, x + ax, y + ay, ar, ar * 0.92, '#cfe6f2');
    ellipse(ctx, x + ax - ar * 0.3, y + ay - ar * 0.3, ar * 0.45, ar * 0.38, '#ffffff');
  }
  // whale-rib uprights: a pair of curved ribs bound to the deck, a cross-brace and twisted sinew skeins
  for (const [ux, uy, lean] of [[-6, 0.8, -0.6], [1.6, -0.4, -0.6], [4.6, -2, 0]] as const) {
    ctx.strokeStyle = I_BONE2;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + ux, y + uy);
    ctx.quadraticCurveTo(x + ux + lean * 3 - 1, y + uy - 6, x + ux + lean * 6, y + uy - 12.4);
    ctx.stroke();
    ctx.strokeStyle = I_BONE;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x + ux - 0.5, y + uy);
    ctx.quadraticCurveTo(x + ux + lean * 3 - 1.5, y + uy - 6, x + ux + lean * 6 - 0.5, y + uy - 12.4);
    ctx.stroke();
    ellipse(ctx, x + ux, y + uy + 0.3, 1.6, 0.8, I_SINEW);
  }
  line(ctx, x - 9, y - 11.6, x + 2.6, y - 12.4, I_BONE, 1.8); // top cross-brace
  ellipse(ctx, x - 9, y - 11.6, 1.3, 1.3, I_RED);
  ellipse(ctx, x + 2.6, y - 12.4, 1.3, 1.3, I_RED);
  for (const [cx, cy] of [[-4.2, -5.4], [2.6, -5.2]] as const) { // torsion skeins
    ellipse(ctx, x + cx, y + cy, 3.6, 3.2, '#e6d8b0');
    ellipse(ctx, x + cx, y + cy, 3.6, 3.2, 'rgba(0,0,0,0)');
    for (let i = 0; i < 4; i++) line(ctx, x + cx - 3 + i * 0.4, y + cy - 2.6 + i * 1.5, x + cx + 3.2 + i * 0.1, y + cy - 1.6 + i * 1.5, '#8a7a56', 0.6);
    ring(ctx, x + cx, y + cy, 3.6, 3.2, '#8a7a56', 0.6);
    ellipse(ctx, x + cx - 1, y + cy - 1, 1, 0.8, '#fff6dc');
  }
  // the arm: a long walrus tusk seated in the skein, curving forward, tipped with a sealskin sling
  ctx.strokeStyle = I_BONE2;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 1.4, y - 4.6);
  ctx.quadraticCurveTo(x + 3, y - 16, x + 12.4, y - 22.4);
  ctx.stroke();
  ctx.strokeStyle = I_BONE;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x - 1.8, y - 4.8);
  ctx.quadraticCurveTo(x + 2.6, y - 16.4, x + 12, y - 22.8);
  ctx.stroke();
  ellipse(ctx, x + 12.6, y - 22.4, 1.5, 1.5, I_BONE2);
  line(ctx, x + 12.4, y - 22.2, x + 10.6, y - 17, I_SINEW, 0.7); // sling cords
  line(ctx, x + 12.6, y - 22.2, x + 15.2, y - 17.4, I_SINEW, 0.7);
  poly(ctx, [x + 9.6, y - 17.4, x + 16.2, y - 17.6, x + 15, y - 14, x + 11, y - 14], I_BROWN); // the sling pouch
  poly(ctx, [x + 9.6, y - 17.4, x + 16.2, y - 17.6, x + 15.8, y - 16.4, x + 10, y - 16.2], shade(I_BROWN, 0.3));
  ellipse(ctx, x + 12.8, y - 19, 3.3, 3.3, '#cfe6f2'); // the ice ball ready to fly
  ellipse(ctx, x + 12, y - 19.8, 1.3, 1.2, '#ffffff');
  ring(ctx, x + 12.8, y - 19, 3.3, 3.3, '#8fb8d4', 0.5);
  // a padded stop-bar at the front, a tent-pole flag of antler and a fur ruff
  line(ctx, x + 8, y - 2.6, x + 8.6, y - 8.4, '#7a5a3a', 1.6);
  ellipse(ctx, x + 8.6, y - 8.8, 2.4, 1.3, I_FUR);
  line(ctx, x - 12.6, y - 0.6, x - 12.6, y - 15.6, '#cbbd9a', 1.3);
  line(ctx, x - 12.6, y - 9, x - 15, y - 12, '#cbbd9a', 0.9); // a tine
  poly(ctx, [x - 12.6, y - 15.6, x - 5.4, y - 13.8, x - 12.6, y - 10.4], I_ICE);
  poly(ctx, [x - 12.6, y - 15.6, x - 5.4, y - 13.8, x - 7, y - 14.6, x - 12.6, y - 13.6], shade(I_ICE, 0.4));
  ellipse(ctx, x - 5, y - 13.8, 1.3, 1.2, I_FUR); // fur tassel at the flag's tip
  for (const [nx, ny] of [[-13, 0.6], [-6, 0.4], [3, -0.6], [10, -1.4]] as const) ellipse(ctx, x + nx, y + ny, 0.55, 0.55, I_BONE); // bone toggles
}

/** The paddle of a kayak: a long shaft with a leaf-shaped blade at each end, painted ice-blue with a red edge. */
function inuitPaddle(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, sc: number) {
  line(ctx, x0, y0, x1, y1, '#8a6a44', 1 * sc);
  line(ctx, x0, y0 - 0.4, x1, y1 - 0.4, shade('#8a6a44', 0.4), 0.35 * sc);
  const a = Math.atan2(y1 - y0, x1 - x0);
  for (const [px, py, s] of [[x0, y0, -1], [x1, y1, 1]] as const) {
    const bx = px + Math.cos(a) * 1.8 * s * sc, by = py + Math.sin(a) * 1.8 * s * sc;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.6 * sc, 1.3 * sc, 0, 0, Math.PI * 2);
    ctx.fillStyle = ink(I_ICE);
    ctx.fill();
    ctx.strokeStyle = ink(I_RED);
    ctx.lineWidth = 0.5 * sc;
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Inuit craft. The kayak is a slim sealskin decked hull with a lashed cockpit ring, a hunter in a hooded anorak,
 * a double-bladed paddle and a harpoon with float lying on the foredeck. The umiak (ship) is a big open skin boat
 * with a driftwood gunwale, a crew paddling and a steersman; the warship adds a walrus-tusk stem, a painted snow-crystal
 * sail, rail shields and a harpooner crew.
 */
function drawInuitBoat(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  const tier = kind === 'warship' ? 2 : kind === 'ship' ? 1 : 0;
  const foam = (w: number) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y + 3.6, w, 2.2, 0, 0.06 * Math.PI, 0.94 * Math.PI);
    ctx.stroke();
  };
  if (tier === 0) {
    // ------------------------------------------------------------ kayak
    const w = 23;
    ctx.beginPath(); // dark hull side
    ctx.moveTo(x - w, y - 5);
    ctx.quadraticCurveTo(x - 4, y - 10, x + w + 1, y - 6.6);
    ctx.quadraticCurveTo(x + 3, y + 6, x - w, y - 5);
    ctx.fillStyle = ink('#3e2f26');
    ctx.fill();
    ctx.beginPath(); // sealskin deck
    ctx.moveTo(x - w, y - 5);
    ctx.quadraticCurveTo(x - 4, y - 10.6, x + w + 1, y - 6.8);
    ctx.quadraticCurveTo(x + 2, y - 2, x - w, y - 5);
    ctx.fillStyle = ink('#8a6f52');
    ctx.fill();
    ctx.beginPath(); // pale highlight along the deck
    ctx.moveTo(x - w * 0.8, y - 5.6);
    ctx.quadraticCurveTo(x - 4, y - 9.6, x + w * 0.8, y - 7);
    ctx.quadraticCurveTo(x + 2, y - 5.2, x - w * 0.8, y - 5.6);
    ctx.fillStyle = ink('#b39a76');
    ctx.fill();
    line(ctx, x - w + 1, y - 4.8, x + w, y - 6.6, I_BONE, 0.6); // keel-strip along the gunwale
    for (const t of [-0.66, -0.4, 0.2, 0.46, 0.7]) line(ctx, x + t * w, y - 7.6 + Math.abs(t) * 1.6, x + t * w - 0.8, y - 3.4 + Math.abs(t) * 1.4, '#5e4a38', 0.7); // ribs showing through the skin
    for (const s of [-1, 1]) { // bone caps on the upturned ends
      poly(ctx, [x + s * w, y - 5.2 - (s > 0 ? 1.6 : 0), x + s * (w + 3.4), y - 8.4 - (s > 0 ? 1.4 : 0), x + s * (w + 1), y - 4 - (s > 0 ? 1.6 : 0)], I_BONE);
    }
    poly(ctx, [x + w + 1, y - 8.2, x + w + 3, y - 12, x + w + 4, y - 8.6, x + w + 1.4, y - 6.6], I_BONE); // a bone-tipped bow
    ellipse(ctx, x + w * 0.62, y - 6.2, 0.7, 0.7, I_RED);
    line(ctx, x + w * 0.5, y - 6.6, x + w * 0.74, y - 5.8, I_RED, 0.9); // painted stripe near the bow
    foam(w * 0.78);
    // harpoon and float lashed on the foredeck under sinew cords
    line(ctx, x + 6, y - 8.6, x + w - 1, y - 8.6, '#7a5a3a', 1.2);
    poly(ctx, [x + w - 1, y - 8.6, x + w - 4, y - 10, x + w - 3.4, y - 7.6], I_BONE);
    for (const t of [10, 15]) line(ctx, x + t, y - 9.6, x + t, y - 7, I_SINEW, 0.6);
    inuitFloat(ctx, x - w * 0.6, y - 9.4, 0.6);
    // the cockpit: a lashed bone coaming and the hunter
    ellipse(ctx, x + 0.6, y - 6.4, 5.6, 2.3, '#241a14');
    figure(ctx, 'harpooner', 'inuit', x + 0.6, y - 5.6, 0.52, true);
    ring(ctx, x + 0.6, y - 5.4, 5.6, 2.2, I_BONE, 1);
    ring(ctx, x + 0.6, y - 5.4, 5.6, 2.2, I_RED, 0.3);
    // the double-bladed paddle, held across the body
    inuitPaddle(ctx, x - 9, y + 2, x + 11, y - 14, 0.95);
    return;
  }
  // -------------------------------------------------------------- umiak / war umiak
  const w = tier === 2 ? 25 : 22;
  const hull = '#c9bc9c', hullDk = '#7f6e55', rail = '#7a5a3a';
  const bowY = y - 7 - tier, sternY = y - 6 - tier * 0.4;
  ctx.beginPath(); // the skin hull
  ctx.moveTo(x - w, sternY);
  ctx.lineTo(x + w + 3, bowY);
  ctx.quadraticCurveTo(x + w * 0.7, y + 3.4, x + w * 0.35, y + 3.6);
  ctx.lineTo(x - w * 0.55, y + 3.6);
  ctx.quadraticCurveTo(x - w * 0.9, y + 2, x - w, sternY);
  ctx.fillStyle = ink(hull);
  ctx.fill();
  ctx.beginPath(); // dark waterline where the skin is wet
  ctx.moveTo(x - w * 0.86, y - 0.4);
  ctx.lineTo(x + w * 0.96, y - 1.6);
  ctx.quadraticCurveTo(x + w * 0.7, y + 3.4, x + w * 0.35, y + 3.6);
  ctx.lineTo(x - w * 0.55, y + 3.6);
  ctx.quadraticCurveTo(x - w * 0.8, y + 2.4, x - w * 0.86, y - 0.4);
  ctx.fillStyle = ink(hullDk);
  ctx.fill();
  for (let i = 0; i < 9; i++) { // ribs pressing through the skin, and sinew stitching along the seam
    const t = i / 8, rx = x - w * 0.86 + t * w * 1.8;
    line(ctx, rx, y - 5.4 - tier * 0.6 - t * 0.6, rx - 0.7, y + 1.6, shade(hull, -0.28), 0.7);
    ellipse(ctx, rx, y - 1 - t * 0.6, 0.45, 0.45, I_SINEW);
  }
  poly(ctx, [x - w, sternY, x + w + 3, bowY, x + w + 3, bowY + 1.2, x - w, sternY + 1.2], rail); // gunwale beam
  poly(ctx, [x - w, sternY, x + w + 3, bowY, x + w + 2.6, bowY - 0.6, x - w, sternY - 0.8], shade(rail, 0.3));
  // a painted band under the rail: ice-blue with red triangles
  poly(ctx, [x - w + 1, sternY + 1.2, x + w + 2, bowY + 1.2, x + w + 1.6, bowY + 3.2, x - w + 1.4, sternY + 3.2], I_ICE);
  for (let i = 0; i < 9; i++) {
    const t = (i + 0.5) / 9, px = x - w + 2 + t * (2 * w), py = sternY + 1.6 + (bowY - sternY) * t;
    poly(ctx, [px - 1.6, py, px + 1.6, py - 0.2, px, py + 1.9], i % 2 ? I_RED : I_FUR);
  }
  // stem and stern-post: the bow rises to a carved walrus head with tusks on the war umiak
  poly(ctx, [x + w + 3, bowY + 1, x + w + 4.4, bowY - 6 - tier * 1.4, x + w + 6.6, bowY - 6.4 - tier * 1.4, x + w + 4.6, bowY + 0.4], rail);
  if (tier === 2) {
    const hx = x + w + 6.4, hy = bowY - 9;
    ellipse(ctx, hx, hy, 3.4, 2.8, '#8a6a4a');
    ellipse(ctx, hx + 1.2, hy + 1.2, 2.4, 1.7, '#b09070');
    ellipse(ctx, hx + 2.4, hy + 0.6, 1, 0.8, '#1a1a1e');
    ellipse(ctx, hx - 0.4, hy - 0.8, 0.7, 0.7, '#101010');
    for (const [tx, ty] of [[2.4, 1.4], [3.4, 0.8]] as const) poly(ctx, [hx + tx, hy + ty, hx + tx + 0.8, hy + ty + 0.2, hx + tx + 0.2, hy + ty + 4.8], I_BONE); // tusks
  } else {
    poly(ctx, [x + w + 4.4, bowY - 6, x + w + 6.6, bowY - 6.4, x + w + 5.6, bowY - 9.4], I_BONE);
  }
  poly(ctx, [x - w, sternY, x - w - 1.2, sternY - 5.6, x - w + 1.4, sternY - 6.2, x - w + 1.8, sternY - 0.4], rail); // stern-post
  ellipse(ctx, x - w + 0.2, sternY - 6.6, 1.5, 1.5, I_BONE);
  foam(w * 0.78);
  // thwarts and, on the war umiak, a row of round painted shields on the gunwale
  const nCrew = tier === 2 ? 5 : 3;
  const px = (i: number) => x - w * 0.6 + i * ((w * 1.4) / (nCrew - 1));
  const gy = (xx: number) => sternY + (bowY - sternY) * ((xx - (x - w)) / (2 * w + 3));
  // crew, seated low, paddling with single-bladed paddles (harpooners standing tall in the warship)
  for (let i = 0; i < nCrew; i++) {
    const cxp = px(i);
    const kindF: UnitKind = tier === 2 && (i === 1 || i === nCrew - 1) ? 'swordsman' : tier === 2 ? 'harpooner' : i === nCrew - 1 ? 'harpooner' : 'warrior';
    figure(ctx, kindF, 'inuit', cxp, gy(cxp) + 2.6, 0.5, true);
  }
  for (let i = 0; i < nCrew; i++) {
    const cxp = px(i);
    if (tier === 2 && (i === nCrew - 1 || i === 1)) {
      line(ctx, cxp + 2, gy(cxp) - 6, cxp + 4.6, gy(cxp) - 26, '#7a5a3a', 0.9); // upright harpoons
      poly(ctx, [cxp + 4.6, gy(cxp) - 26, cxp + 3.6, gy(cxp) - 23.4, cxp + 5.6, gy(cxp) - 23.4], I_BONE);
      continue;
    }
    if (tier === 2 || i < nCrew - 1) {
      line(ctx, cxp + 2, gy(cxp) - 8, cxp - 4.6, y + 5.4, '#8a6a44', 0.9);
      ellipse(ctx, cxp - 5, y + 6, 1, 1.8, I_ICE);
      ellipse(ctx, cxp - 5, y + 6, 0.4, 1, I_RED);
    }
  }
  if (tier === 2) {
    for (let i = 0; i < 5; i++) {
      const sx = x - w * 0.7 + i * (w * 0.36), sy = gy(sx) + 4.2;
      ellipse(ctx, sx, sy, 2.5, 2.6, I_BONE);
      ellipse(ctx, sx, sy, 1.9, 2, i % 2 ? '#dbe8f0' : I_ICE);
      line(ctx, sx - 1.5, sy, sx + 1.5, sy, I_RED, 0.5);
      line(ctx, sx, sy - 1.6, sx, sy + 1.6, I_RED, 0.5);
    }
  }
  // cargo: a heap of walrus hides and a float on the stern thwart
  if (tier === 1) {
    ellipse(ctx, x - w * 0.36, y - 8.4, 4.6, 2, '#8a6a4a');
    ellipse(ctx, x - w * 0.36, y - 9.4, 3.4, 1.4, '#b09070');
    inuitFloat(ctx, x - w * 0.86, y - 8.6, 0.6);
  }
  // mast and a skin sail: pale gut-skin with brown seams and a painted snow-crystal
  const top = y - (33 + tier * 6);
  const mx = x + 1;
  line(ctx, mx, y - 6, mx, top, '#5e4530', 1.9);
  line(ctx, mx - 0.6, y - 6, mx - 0.6, top, '#8a6a4a', 0.5);
  const sw = 11 + tier * 3.4;
  const sailC = '#f1f5f7';
  poly(ctx, [mx + 1, top + 2, mx + sw, y - 14, mx + 1, y - 11], sailC);
  poly(ctx, [mx - 1, top + 3, mx - sw + 1, y - 14.4, mx - 1, y - 11], shade(sailC, -0.14));
  poly(ctx, [mx + 1, top + 2, mx + sw, y - 14, mx + sw - 1.4, y - 15.2, mx + 1, top + 4], I_ICE);
  for (const f of [0.3, 0.55, 0.8]) { // seams of stitched panels
    line(ctx, mx + 1, top + 2 + (y - 11 - top - 2) * f, mx + 1 + (sw - 1) * f, top + 2 + (y - 14 - top - 2) * f + (y - 12 - top) * 0.02, '#a89a80', 0.5);
    line(ctx, mx - 1, top + 3 + (y - 11 - top - 3) * f, mx - 1 - (sw - 2) * f, top + 3 + (y - 14.4 - top - 3) * f, '#8a7c62', 0.5);
  }
  const sx0 = mx + sw * 0.42, sy0 = top + (y - 12 - top) * 0.56;
  for (let i = 0; i < 6; i++) { // a snow crystal on the sail
    const a = (i / 6) * Math.PI;
    line(ctx, sx0 - Math.cos(a) * 3.4, sy0 - Math.sin(a) * 3.4, sx0 + Math.cos(a) * 3.4, sy0 + Math.sin(a) * 3.4, I_DEEP, 0.8);
  }
  ellipse(ctx, sx0, sy0, 1, 1, I_RED);
  poly(ctx, [mx, top - 2, mx + 9, top, mx, top + 2], I_ICE); // pennant with a white fur tuft
  poly(ctx, [mx, top - 2, mx + 9, top, mx + 7.6, top - 0.8, mx, top - 1.2], shade(I_ICE, 0.35));
  ellipse(ctx, mx + 9.4, top, 1.5, 1.3, I_FUR);
  ellipse(ctx, mx, top - 3.4, 1.3, 1.3, I_BONE);
  line(ctx, mx, top, mx + w + 3, bowY - 0.6, '#5e4530', 0.5); // stays
  line(ctx, mx, top, mx - w, sternY - 0.6, '#5e4530', 0.5);
  if (tier === 2) {
    box(ctx, mx, top + 7, 5.6, 2.4, '#5e4530'); // a lookout's perch
    line(ctx, mx - 3, top + 4.8, mx + 3, top + 4.8, '#3a2a1a', 0.6);
  }
}

/** The Inuit anorak: a white-furred hem, a beaded red yoke, a belt with a bone toggle and slate ulu, and bone plates for the heavy ranks. */
function inuitTorso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const Q = (f: 'L' | 'R', u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, f, x, y, w, h, u0, u1, v0, v1, c);
  const armoured = kind === 'swordsman' || kind === 'knight' || kind === 'giant' || kind === 'defender';
  // hem: white fur with dark-tipped strands, a red trim and a blue-and-white beaded line
  band(ctx, x, y, w, h, 0, 0.12, I_FUR);
  for (const u of [0.06, 0.3, 0.54, 0.78]) { Q('R', u, u + 0.1, 0, 0.07, I_FUR2); Q('L', u, u + 0.1, 0, 0.07, I_FUR2); }
  band(ctx, x, y, w, h, 0.12, 0.17, I_RED);
  for (const u of [0.05, 0.3, 0.55, 0.8]) { Q('R', u, u + 0.12, 0.12, 0.17, I_FUR); Q('L', u, u + 0.12, 0.12, 0.17, I_FUR); }
  if (!armoured) {
    // a hanging pouch-front and a beaded chest yoke: red band with white and blue diamonds
    Q('R', 0.24, 0.76, 0.2, 0.42, shade(kind === 'harpooner' ? I_DEEP : '#5fb4dc', -0.14));
    Q('R', 0.24, 0.76, 0.4, 0.42, I_BROWN);
    Q('R', 0.5, 0.52, 0.2, 0.4, I_BROWN); // the front seam
    band(ctx, x, y, w, h, 0.62, 0.78, I_RED);
    for (let i = 0; i < 4; i++) {
      Q('R', 0.06 + i * 0.24, 0.16 + i * 0.24, 0.66, 0.74, i % 2 ? I_ICE : I_FUR);
      Q('L', 0.06 + i * 0.24, 0.16 + i * 0.24, 0.66, 0.74, i % 2 ? I_ICE : I_FUR);
    }
  } else {
    // lamellar armour: vertical bone slats side by side, lashed with red sinew, over a hide belt
    band(ctx, x, y, w, h, 0.2, 0.84, I_BONE2);
    for (let i = 0; i < 6; i++) {
      Q('R', 0.02 + i * 0.165, 0.15 + i * 0.165, 0.22, 0.82, i % 2 ? I_BONE : shade(I_BONE, 0.12));
      Q('L', 0.02 + i * 0.165, 0.15 + i * 0.165, 0.22, 0.82, i % 2 ? I_BONE : shade(I_BONE, 0.12));
    }
    for (const v of [0.34, 0.54, 0.72]) band(ctx, x, y, w, h, v, v + 0.05, I_RED);
    Q('R', 0.4, 0.6, 0.52, 0.74, I_BROWN); // a hide chest-strap patch
    Q('R', 0.44, 0.56, 0.56, 0.7, I_ICE);
  }
  // belt with a bone toggle, and a slate-bladed ulu hanging in a hide sheath
  band(ctx, x, y, w, h, 0.2, 0.28, I_BROWN);
  Q('R', 0.42, 0.58, 0.19, 0.3, I_BONE);
  Q('R', 0.47, 0.53, 0.2, 0.29, I_BROWN);
  if (kind !== 'archer' && kind !== 'harpooner' && kind !== 'explorer') {
    Q('R', 0.72, 0.9, 0.02, 0.2, '#9fb2bf'); // ulu blade
    Q('R', 0.72, 0.9, 0.02, 0.05, I_FUR2);
    Q('R', 0.78, 0.84, 0.2, 0.32, I_BONE); // its handle
  }
  if (kind === 'harpooner') {
    // a coil of line across the chest and a bone line-toggle on the belt
    facePoly(ctx, 'R', x, y, w, h, [[0.02, 0.98], [0.2, 0.98], [0.98, 0.4], [0.8, 0.36]], I_SINEW);
    facePoly(ctx, 'R', x, y, w, h, [[0.08, 0.98], [0.12, 0.98], [0.92, 0.4], [0.88, 0.38]], shade(I_SINEW, -0.3));
  }
  if (kind === 'giant') {
    band(ctx, x, y, w, h, 0.7, 1, I_FUR); // a polar-bear pelt mantle
    for (const u of [0.08, 0.34, 0.6, 0.84]) { Q('R', u, u + 0.12, 0.64, 0.74, I_FUR2); Q('L', u, u + 0.12, 0.64, 0.74, I_FUR2); }
    for (const u of [0.22, 0.52, 0.8]) Q('R', u, u + 0.06, 0.76, 0.9, I_FUR2);
  } else if (kind === 'knight' || kind === 'swordsman') {
    band(ctx, x, y, w, h, 0.84, 1, I_BROWN); // a caribou fur ruff
    for (const u of [0.1, 0.4, 0.7]) { Q('R', u, u + 0.14, 0.9, 1, I_FUR2); Q('L', u, u + 0.14, 0.9, 1, I_FUR2); }
  } else band(ctx, x, y, w, h, 0.88, 1, I_FUR); // white fur collar
}

/** Squints the eyes into almond slits, warms the nose, adds goggles or chin-lines by rank. */
function inuitFace(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const skin = LOOK.inuit.skin;
  const Q = (f: 'L' | 'R', u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, f, x, y, w, h, u0, u1, v0, v1, c);
  for (const u of [0.2, 0.6]) Q('R', u, u + 0.24, 0.55, 0.64, skin); // upper lids narrow the eyes
  for (const u of [0.2, 0.6]) Q('R', u, u + 0.24, 0.4, 0.44, shade(skin, -0.08)); // lower lids
  Q('R', 0.44, 0.58, 0.3, 0.36, mix(skin, '#e0605a', 0.4)); // the nose, red from the cold
  Q('R', 0.04, 0.22, 0.24, 0.36, mix(skin, '#e0605a', 0.4)); // windburnt cheeks
  Q('R', 0.78, 0.96, 0.24, 0.36, mix(skin, '#e0605a', 0.4));
  if (kind === 'harpooner' || kind === 'explorer') {
    // bone snow goggles: a carved band across the eyes with two narrow slits
    Q('R', 0.04, 0.96, 0.36, 0.7, I_BONE);
    Q('R', 0.04, 0.96, 0.64, 0.7, I_BONE2);
    Q('R', 0.16, 0.42, 0.5, 0.56, '#0e0e12');
    Q('R', 0.58, 0.84, 0.5, 0.56, '#0e0e12');
    Q('R', 0.46, 0.54, 0.44, 0.64, I_BONE2); // the bridge
    Q('L', 0.3, 1, 0.5, 0.58, I_BROWN); // the thong round the hood
    Q('R', 0.06, 0.94, 0.36, 0.39, I_RED); // painted lower edge
  }
  if (kind === 'swordsman' || kind === 'knight' || kind === 'giant') {
    // chin tattoos: three fine lines running down from the lower lip
    for (const u of [0.36, 0.48, 0.6]) Q('R', u, u + 0.03, 0.0, 0.14, '#243a5c');
  }
}

/**
 * The hood: a fur-framed cap over the back and top of the head. Each rank has its own furs: caribou browns for archers and
 * scouts, seal-hide with bone brow plates for defenders, polar-bear white with ears and a bear-head cowl for the heavy ranks.
 */
function inuitHead(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  const hy = top + 10.5 * k, hh = 10.5 * k;
  const bear = kind === 'swordsman' || kind === 'knight' || kind === 'giant';
  const brown = kind === 'archer' || kind === 'explorer';
  const seal = kind === 'defender';
  const hc = bear ? '#eef3f6' : brown ? '#6a4a34' : seal ? '#4a3a32' : kind === 'harpooner' ? I_DEEP : '#7fd0f5';
  const rc = bear ? '#ffffff' : brown ? '#cfc2b0' : seal ? '#9a7a58' : I_FUR;
  const Q = (f: 'L' | 'R', u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, f, x, hy, hw, hh, u0, u1, v0, v1, c);
  // the hood over back, side and crown
  Q('L', 0, 1, 0.2, 1, hc);
  Q('L', 0, 1, 0.2, 0.27, shade(hc, -0.25)); // the hood's lower edge
  for (const u of [0.1, 0.4, 0.7]) Q('L', u, u + 0.1, 0.5, 0.9, shade(hc, -0.08)); // quilting seams
  const hw2 = hw / 2;
  poly(ctx, [x, top - hw2 * 0.5 - 0.6 * k, x + hw2 + 0.5 * k, top + 0.2 * k, x, top + hw2 * 0.5 + 0.4 * k, x - hw2 - 0.5 * k, top + 0.2 * k], shade(hc, 0.16)); // rounded crown
  ellipse(ctx, x - 0.4 * k, top - 0.2 * k, hw2 * 0.7, 2.2 * k, shade(hc, 0.06)); ellipse(ctx, x - 1.4 * k, top - 0.8 * k, hw2 * 0.4, 1.1 * k, shade(hc, 0.3));
  // the fur ruff framing the face
  Q('R', 0, 1, 0.84, 1.02, rc);
  Q('R', 0, 0.11, 0.06, 0.9, rc);
  Q('R', 0.89, 1, 0.06, 0.9, rc);
  Q('L', 0.86, 1, 0.08, 0.9, rc);
  Q('R', 0.12, 0.88, 0.8, 0.84, shade(LOOK.inuit.skin, -0.32)); // shadow under the ruff
  for (let i = 0; i < 5; i++) { // fur strands standing out along the crown
    const fx = x - hw2 + 0.6 * k + i * (hw * 0.24);
    poly(ctx, [fx, top + 1 * k, fx + 1.1 * k, top - 1.6 * k, fx + 1.8 * k, top + 1.2 * k], i % 2 ? shade(rc, -0.08) : rc);
  }
  for (const [ux, vy] of [[0.94, 0.3], [0.94, 0.6], [0.04, 0.5], [0.5, 0.9], [0.24, 0.92], [0.74, 0.92]] as const) Q('R', ux, ux + 0.05, vy, vy + 0.06, shade(rc, -0.18)); // speckle of darker hairs
  if (!bear) {
    // a beaded browband of red and white under the ruff
    for (let i = 0; i < 4; i++) Q('R', 0.14 + i * 0.19, 0.24 + i * 0.19, 0.74, 0.82, i % 2 ? I_FUR : I_RED);
  }
  if (brown) {
    // a snow-goose feather stuck in the hood and dangling earflaps
    poly(ctx, [x + 1 * k, top + 0.4 * k, x + 3.6 * k, top - 8 * k, x + 4.4 * k, top - 3 * k, x + 2.4 * k, top + 0.6 * k], '#f4f8fb');
    poly(ctx, [x + 3.6 * k, top - 8 * k, x + 4.4 * k, top - 3 * k, x + 4 * k, top - 5 * k], '#c5d4de');
    line(ctx, x + 1.2 * k, top + 0.6 * k, x + 3.6 * k, top - 7 * k, '#a0a8b0', 0.4 * k);
    Q('L', 0.3, 0.8, 0.02, 0.24, hc);
    Q('L', 0.3, 0.8, 0.02, 0.07, rc);
  }
  if (seal) {
    // three ivory brow plates on a hide cap, lashed with red sinew
    for (let i = 0; i < 3; i++) {
      Q('R', 0.1 + i * 0.29, 0.34 + i * 0.29, 0.73, 0.9, I_BONE);
      Q('R', 0.1 + i * 0.29, 0.14 + i * 0.29, 0.73, 0.9, I_BONE2);
      Q('R', 0.2 + i * 0.29, 0.24 + i * 0.29, 0.78, 0.86, I_BROWN);
    }
    Q('R', 0.1, 0.9, 0.7, 0.74, I_RED);
    Q('L', 0.1, 0.9, 0.7, 0.76, I_BONE); // a bone band round the cap
    for (const u of [0.2, 0.5, 0.8]) Q('L', u, u + 0.08, 0.72, 0.9, I_BONE2);
  }
  if (bear) {
    // round white ears with pink insides, and a black-nosed bear snout resting on the brow for the higher ranks
    for (const [ex, ey] of [[-3.6, -2.6], [3.6, -2.4]] as const) {
      ellipse(ctx, x + ex * k, top + ey * k, 2 * k, 1.8 * k, '#ffffff');
      ellipse(ctx, x + ex * k + 0.2 * k, top + ey * k + 0.2 * k, 1.1 * k, 1 * k, '#d9a8a8');
    }
    if (kind !== 'swordsman') {
      const bx = x + 2.4 * k, by = top + 4.4 * k;
      box(ctx, bx, by, 5 * k, 2.6 * k, '#f4f8fb');
      faceQuad(ctx, 'R', bx, by, 5 * k, 2.6 * k, 0.6, 1, 0.25, 0.85, '#101014'); // the black nose
      faceQuad(ctx, 'R', bx, by, 5 * k, 2.6 * k, 0.05, 0.6, 0, 0.12, '#f4efe0'); // teeth
      for (const u of [0.14, 0.3, 0.46]) faceQuad(ctx, 'R', bx, by, 5 * k, 2.6 * k, u, u + 0.06, 0, 0.16, '#d7cfb8');
      // a pair of walrus tusks rising from the cowl
      for (const dx of [-3.4, 4.4]) poly(ctx, [x + dx * k, top + 1.2 * k, x + (dx + 1.4) * k, top + 0.6 * k, x + (dx + (dx < 0 ? -0.4 : 1.2)) * k, top - 6.4 * k], I_BONE);
    } else {
      Q('R', 0.06, 0.94, 0.8, 0.86, I_BONE); // a bone brow-band lashed round the fur
      for (const u of [0.2, 0.5, 0.8]) Q('R', u, u + 0.08, 0.8, 0.86, I_RED);
    }
  }
}

// ---------------------------------------------------------------- Aboriginal arms, paint and country
// Everyday hunting and fighting gear only: ochre and white-clay body paint, string and cane bands, possum-skin
// cloaks, boomerangs, waddies, spears and woomeras, carved parrying shields and broad bark shields.

const AB_OCH = '#b8502e', AB_OCH_D = '#7a3018', AB_YOCH = '#d9a441', AB_CLAY = '#f1ead8', AB_CHAR = '#1a1410';
const AB_FUR = '#8a6a4a', AB_FUR_D = '#5a3f2a', AB_BARK = '#a7703f', AB_BARK_D = '#6f4526';
const AB_CANE = '#d3b26a', AB_CANE_D = '#8f6f30', AB_WOOD = '#8a5a34', AB_WOOD_D = '#4f2f18', AB_STRING = '#e6d6b0';

const isAbo = (t: TribeId) => t === 'aboriginal';

/** A rotated ellipse (kangaroo bodies, dilly bags). */
function aboEll(ctx: Ctx, x: number, y: number, rx: number, ry: number, rot: number, color: string) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2);
  ctx.fillStyle = ink(color);
  ctx.fill();
}

/** A boomerang from its end a1 through its elbow e to its end a2: a darker body, a lit edge and painted dots. */
function aboBoomerangPts(ctx: Ctx, a1: { x: number; y: number }, e: { x: number; y: number }, a2: { x: number; y: number }, w: number, color: string, dots: string | null) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [col, wid, off] of [[shade(color, -0.4), w, 0], [color, w * 0.66, -w * 0.08], [shade(color, 0.35), w * 0.2, -w * 0.22]] as const) {
    ctx.strokeStyle = ink(col);
    ctx.lineWidth = wid;
    ctx.beginPath();
    ctx.moveTo(a1.x, a1.y + off);
    ctx.lineTo(e.x, e.y + off);
    ctx.lineTo(a2.x, a2.y + off);
    ctx.stroke();
  }
  if (dots) for (const [p, q, ts] of [[a1, e, [0.3, 0.55, 0.8]], [e, a2, [0.2, 0.45, 0.7]]] as const) for (const t of ts) ellipse(ctx, p.x + (q.x - p.x) * t, p.y + (q.y - p.y) * t, w * 0.2, w * 0.2, dots);
}

/** A boomerang whose elbow is at (x, y) and whose arms open towards `rot`. */
function aboBoomerang(ctx: Ctx, x: number, y: number, rot: number, len: number, open: number, w: number, color: string, dots: string | null) {
  aboBoomerangPts(ctx, { x: x + Math.cos(rot - open / 2) * len, y: y + Math.sin(rot - open / 2) * len }, { x, y }, { x: x + Math.cos(rot + open / 2) * len, y: y + Math.sin(rot + open / 2) * len }, w, color, dots);
}

/** A spear from (x0, y0) to (x1, y1): a fire-hardened shaft, a barbed head bound on with ochre string and a tuft of white feathers. */
function aboSpearLine(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, k: number, w: number, head = 6.4) {
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  const ux = (x1 - x0) / len, uy = (y1 - y0) / len, nx = -uy, ny = ux;
  line(ctx, x0, y0, x1, y1, '#8a6a3c', w);
  line(ctx, x0 - nx * w * 0.3, y0 - ny * w * 0.3, x1 - nx * w * 0.3, y1 - ny * w * 0.3, '#cfae74', w * 0.35);
  const hx = x1 + ux * head * k, hy = y1 + uy * head * k;
  poly(ctx, [x1 - nx * 0.8 * k, y1 - ny * 0.8 * k, hx, hy, x1 + nx * 0.8 * k, y1 + ny * 0.8 * k], '#e6d8b4'); // the head
  poly(ctx, [x1, y1, hx, hy, x1 + nx * 0.8 * k, y1 + ny * 0.8 * k], '#b8a880');
  for (const t of [0.32, 0.62]) { // barbs cut into the head
    const bx = x1 + ux * head * k * t, by = y1 + uy * head * k * t;
    poly(ctx, [bx, by, bx - nx * 1.7 * k - ux * 1.5 * k, by - ny * 1.7 * k - uy * 1.5 * k, bx - nx * 0.5 * k, by - ny * 0.5 * k], '#e6d8b4');
    poly(ctx, [bx, by, bx + nx * 1.7 * k - ux * 1.5 * k, by + ny * 1.7 * k - uy * 1.5 * k, bx + nx * 0.5 * k, by + ny * 0.5 * k], '#b8a880');
  }
  for (const [t, c] of [[0, AB_OCH], [1, AB_CLAY], [2, AB_OCH]] as const) line(ctx, x1 - ux * (0.6 + t * 0.9) * k - nx * 1 * k, y1 - uy * (0.6 + t * 0.9) * k - ny * 1 * k, x1 - ux * (0.6 + t * 0.9) * k + nx * 1 * k, y1 - uy * (0.6 + t * 0.9) * k + ny * 1 * k, c, 0.7 * k); // binding
  for (const [s, c] of [[-1, AB_OCH], [0, '#ffffff'], [1, AB_STRING]] as const) line(ctx, x1 - ux * 2.6 * k, y1 - uy * 2.6 * k, x1 - ux * 2.6 * k + s * nx * 1 * k, y1 - uy * 2.6 * k + s * ny * 1 * k + 2.4 * k, c, 0.6 * k); // a small hanging tassel
}

/** A waddy (nulla-nulla): a heavy hardwood club, thin at the grip and swelling to a knobbed head, with burnt and painted bands. */
function aboClub(ctx: Ctx, x: number, y: number, k: number, big = false) {
  const g = { x: x - 0.8 * k, y: y + 2.8 * k }, h = { x: x + 3.4 * k, y: y - 14.6 * k };
  const len = Math.hypot(h.x - g.x, h.y - g.y), ux = (h.x - g.x) / len, uy = (h.y - g.y) / len, nx = -uy, ny = ux;
  const wg = 0.75 * k, wh = (big ? 2.2 : 1.7) * k;
  poly(ctx, [g.x - nx * wg, g.y - ny * wg, h.x - nx * wh, h.y - ny * wh, h.x, h.y, g.x, g.y], '#a5703c');
  poly(ctx, [g.x + nx * wg, g.y + ny * wg, h.x + nx * wh, h.y + ny * wh, h.x, h.y, g.x, g.y], AB_WOOD_D);
  aboEll(ctx, h.x + ux * 0.6 * k, h.y + uy * 0.6 * k, wh * 1.05, wh * 1.35, Math.atan2(uy, ux) + Math.PI / 2, AB_WOOD_D); // the knob
  aboEll(ctx, h.x + ux * 0.9 * k - nx * 0.3 * k, h.y + uy * 0.9 * k - ny * 0.3 * k, wh * 0.8, wh * 1.0, Math.atan2(uy, ux) + Math.PI / 2, '#b07a44');
  for (const t of [0.5, 0.66, 0.8]) { // burnt-in rings, and an ochre band with clay dots
    const px = g.x + (h.x - g.x) * t, py = g.y + (h.y - g.y) * t, hw = wg + (wh - wg) * t;
    line(ctx, px - nx * hw, py - ny * hw, px + nx * hw, py + ny * hw, t === 0.66 ? AB_OCH : AB_CHAR, 0.7 * k);
  }
  for (let i = 0; i < 3; i++) { const t = 0.55 + i * 0.075; ellipse(ctx, g.x + (h.x - g.x) * t + nx * 0.2 * k, g.y + (h.y - g.y) * t + ny * 0.2 * k, 0.28 * k, 0.28 * k, AB_CLAY); }
  for (const t of [0.04, 0.12, 0.2, 0.28]) line(ctx, g.x + (h.x - g.x) * t - nx * wg * 1.1, g.y + (h.y - g.y) * t - ny * wg * 1.1, g.x + (h.x - g.x) * t + nx * wg * 1.1, g.y + (h.y - g.y) * t + ny * wg * 1.1, AB_STRING, 0.6 * k); // string-bound grip
}

/** A woomera (spear-thrower): a long leaf-shaped board with a resin grip and a hooked peg at its tail. */
function aboWoomera(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, k: number) {
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  const ux = (x1 - x0) / len, uy = (y1 - y0) / len, nx = -uy, ny = ux;
  const P = (t: number, s: number) => [x0 + (x1 - x0) * t + nx * s * k, y0 + (y1 - y0) * t + ny * s * k];
  poly(ctx, [...P(0, 0.4), ...P(0.3, 1.5), ...P(0.7, 1.5), ...P(1, 0.5), ...P(1, -0.5), ...P(0.7, -1.5), ...P(0.3, -1.5), ...P(0, -0.4)], '#b07a44');
  poly(ctx, [...P(0, 0), ...P(0.3, 0), ...P(0.7, 0), ...P(1, 0), ...P(1, -0.5), ...P(0.7, -1.5), ...P(0.3, -1.5), ...P(0, -0.4)], AB_WOOD_D);
  const a = P(0.12, 0), b = P(0.9, 0);
  line(ctx, a[0], a[1], b[0], b[1], '#5a3418', 0.5 * k); // a carved groove for the spear
  for (const t of [0.42, 0.52, 0.62]) { const p = P(t, 0.9), q = P(t + 0.04, -0.9); line(ctx, p[0], p[1], q[0], q[1], AB_CLAY, 0.4 * k); } // incised cross-hatching
  const hk = P(1, 0);
  poly(ctx, [hk[0], hk[1], hk[0] + nx * 1.2 * k - ux * 0.2 * k, hk[1] + ny * 1.2 * k - uy * 0.2 * k - 1.8 * k, hk[0] + ux * 0.6 * k, hk[1] + uy * 0.6 * k], '#e6d8b4'); // the peg
  const g = P(0.06, 0);
  ellipse(ctx, g[0], g[1], 1.5 * k, 1.3 * k, '#3a2412'); // spinifex-resin grip
  ellipse(ctx, g[0] - 0.4 * k, g[1] - 0.4 * k, 0.6 * k, 0.5 * k, '#6a4a2a');
}

/** A parrying shield: a long narrow slab of carved wood, incised in bands and chevrons, with a hand-hole at the middle. */
function aboParry(ctx: Ctx, x: number, y: number, k: number, tone = AB_WOOD) {
  const cx = x - 1.4 * k, cy = y - 5.4 * k, rx = 2.5 * k, ry = 8 * k;
  ellipse(ctx, cx + 0.6 * k, cy + 0.5 * k, rx, ry, AB_WOOD_D); // its thickness
  ellipse(ctx, cx, cy, rx, ry, shade(tone, -0.1));
  poly(ctx, [cx, cy - ry, cx + rx * 0.98, cy - 1 * k, cx + rx * 0.7, cy + ry * 0.55, cx, cy + ry], shade(tone, -0.26)); // shaded half
  poly(ctx, [cx, cy - ry, cx - rx * 0.98, cy - 1 * k, cx - rx * 0.7, cy + ry * 0.55, cx, cy + ry], tone);
  line(ctx, cx, cy - ry * 0.92, cx, cy + ry * 0.92, shade(tone, -0.4), 0.5 * k); // the ridge
  for (const [t, c] of [[-0.78, AB_CLAY], [-0.62, AB_OCH], [0.5, AB_OCH], [0.66, AB_CLAY]] as const) {
    const wy = cy + ry * t, ww = rx * Math.sqrt(Math.max(0, 1 - t * t)) * 0.92;
    line(ctx, cx - ww, wy, cx + ww, wy, c, 0.7 * k);
  }
  for (let i = 0; i < 4; i++) { // incised chevrons between the bands
    const wy = cy - ry * 0.5 + i * ry * 0.22;
    const ww = rx * Math.sqrt(Math.max(0, 1 - (0.5 - i * 0.22) ** 2)) * 0.8;
    line(ctx, cx - ww, wy - 0.9 * k, cx, wy + 0.5 * k, AB_CLAY, 0.45 * k);
    line(ctx, cx, wy + 0.5 * k, cx + ww, wy - 0.9 * k, AB_CLAY, 0.45 * k);
  }
  ellipse(ctx, cx, cy + 0.4 * k, 0.8 * k, 1.3 * k, '#2a1a10'); // the grip hole
  ellipse(ctx, cx - rx * 0.5, cy - ry * 0.35, 0.5 * k, 1.6 * k, 'rgba(255,255,255,0.2)');
}

/** A broad bark-and-wood shield painted in ochre and clay bands and diamonds. */
function aboBroadShield(ctx: Ctx, x: number, y: number, k: number, kind: UnitKind) {
  const cx = x - 1 * k, cy = y - 5.2 * k, rx = 5.4 * k, ry = 6.6 * k;
  ellipse(ctx, cx + 0.7 * k, cy + 0.6 * k, rx, ry, AB_BARK_D);
  ellipse(ctx, cx, cy, rx, ry, AB_BARK);
  ellipse(ctx, cx, cy, rx * 0.86, ry * 0.88, AB_OCH);
  ring(ctx, cx, cy, rx, ry, shade(AB_BARK_D, -0.2), 0.8 * k);
  ring(ctx, cx, cy, rx * 0.86, ry * 0.88, AB_CLAY, 0.7 * k);
  // painted diamond rows down the face
  const dia = (px: number, py: number, s: number, c: string) => poly(ctx, [px, py - s * 1.2, px + s, py, px, py + s * 1.2, px - s, py], c);
  for (const [dy, s] of [[-3.6, 1.2], [3.6, 1.2]] as const) dia(cx, cy + dy * k, s * k, AB_CLAY);
  dia(cx, cy, 2 * k, AB_YOCH);
  dia(cx, cy, 1.2 * k, AB_OCH_D);
  for (const sx of [-1, 1]) for (const [dy, c] of [[-2.2, AB_CLAY], [0, AB_YOCH], [2.2, AB_CLAY]] as const) ellipse(ctx, cx + sx * 3.1 * k, cy + dy * k, 0.5 * k, 0.5 * k, c);
  line(ctx, cx, cy - ry * 0.84, cx, cy - 2.4 * k, AB_CLAY, 0.6 * k);
  line(ctx, cx, cy + 2.4 * k, cx, cy + ry * 0.84, AB_CLAY, 0.6 * k);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + 0.2; ellipse(ctx, cx + Math.cos(a) * rx * 0.93, cy + Math.sin(a) * ry * 0.93, 0.36 * k, 0.36 * k, AB_CLAY); } // rim dots
  ellipse(ctx, cx - 2.2 * k, cy - 3 * k, 1 * k, 1.5 * k, 'rgba(255,255,255,0.2)');
  void kind;
}

function aboShield(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  if (kind === 'defender') aboBroadShield(ctx, x, y, k, kind);
  else aboParry(ctx, x, y, k, kind === 'knight' || kind === 'giant' ? '#9a6a3c' : AB_WOOD);
}

/** A woven dilly bag with a diamond pattern and an ochre band. */
function aboDilly(ctx: Ctx, x: number, y: number, k: number) {
  line(ctx, x + 1.4 * k, y - 4 * k, x + 4 * k, y - 10 * k, AB_FUR_D, 0.7 * k); // the cord over the shoulder
  aboEll(ctx, x, y, 3 * k, 3.5 * k, 0, shade(AB_CANE, -0.25));
  aboEll(ctx, x - 0.3 * k, y - 0.2 * k, 2.7 * k, 3.2 * k, 0, AB_CANE);
  for (let i = -1; i <= 1; i++) { line(ctx, x + i * 1.6 * k - 1.2 * k, y - 2.4 * k, x + i * 1.6 * k + 1.2 * k, y + 2.6 * k, AB_CANE_D, 0.4 * k); line(ctx, x + i * 1.6 * k + 1.2 * k, y - 2.4 * k, x + i * 1.6 * k - 1.2 * k, y + 2.6 * k, AB_CANE_D, 0.4 * k); }
  line(ctx, x - 2.7 * k, y - 0.8 * k, x + 2.5 * k, y - 0.8 * k, AB_OCH, 0.9 * k);
  ellipse(ctx, x, y - 3 * k, 1.6 * k, 0.6 * k, AB_FUR_D);
}

function aboBack(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  if (kind === 'woomera') { // a fan of spare spears carried behind the shoulder
    for (const [dx, tx, ty] of [[0, -11.6, -27], [1.4, -8.6, -28.6], [2.8, -5.4, -27.6], [-1.2, -14, -24]] as const) aboSpearLine(ctx, x - 6.4 * k + dx * k, y - 7 * k, x + tx * k, y + ty * k, k, 0.85 * k, 5.2);
  } else if (kind === 'archer') { // two spare boomerangs thrust through the belt cord, and a dilly bag
    aboBoomerangPts(ctx, { x: x - 5.4 * k, y: y - 7 * k }, { x: x - 9 * k, y: y - 14 * k }, { x: x - 6.6 * k, y: y - 21 * k }, 1.5 * k, AB_WOOD, AB_CLAY);
    aboBoomerangPts(ctx, { x: x - 4.4 * k, y: y - 8 * k }, { x: x - 6.6 * k, y: y - 15 * k }, { x: x - 3.6 * k, y: y - 20 * k }, 1.3 * k, '#9a6a3c', null);
    aboDilly(ctx, x - 6.6 * k, y - 5 * k, k * 0.95);
  } else { // the wanderer: a rolled possum-skin rug, a dilly bag and a digging stick
    ellipse(ctx, x - 4.5 * k, y - 16.6 * k, 3.6 * k, 1.8 * k, AB_FUR_D);
    ellipse(ctx, x - 4.5 * k, y - 16.9 * k, 3.6 * k, 1.5 * k, AB_FUR);
    for (const ox of [-1.8, 1.8]) line(ctx, x - 4.5 * k + ox * k, y - 18 * k, x - 4.5 * k + ox * k, y - 8.4 * k, AB_STRING, 0.6 * k);
    aboDilly(ctx, x - 6.8 * k, y - 4.6 * k, k);
    line(ctx, x - 8.6 * k, y + 1.4 * k, x - 6.4 * k, y - 21 * k, '#a5723e', 0.9 * k);
  }
}

/** All of the Aboriginal empire's weapons. Returns true when it drew the unit's weapon. */
function aboWeapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  switch (kind) {
    case 'warrior':
      aboBoomerang(ctx, b.off.x - 3.4 * k, b.off.y - 0.8 * k, -0.9, 6 * k, 1.8, 1.7 * k, AB_WOOD, AB_CLAY); // a war boomerang thrust through the hair-string belt
      aboClub(ctx, x, y, k);
      return true;
    case 'archer': { // the returning-boomerang hunter, arm cocked to throw
      aboBoomerangPts(ctx, { x: x + 0.2 * k, y: y + 0.6 * k }, { x: x + 1.4 * k, y: y - 9 * k }, { x: x + 9.6 * k, y: y - 12 * k }, 1.5 * k, '#b07a44', AB_CLAY);
      line(ctx, x - 0.4 * k, y + 0.8 * k, x + 0.4 * k, y - 2.8 * k, AB_STRING, 1 * k); // the string-wrapped grip
      return true;
    }
    case 'woomera': { // a spear seated on the woomera, arm drawn back
      aboWoomera(ctx, x - 1.6 * k, y + 1.6 * k, x + 6.6 * k, y - 4.6 * k, k);
      aboSpearLine(ctx, x - 0.8 * k, y + 2.4 * k, x + 16 * k, y - 15.6 * k, k, 1.1 * k, 7);
      return true;
    }
    case 'defender': // a long stabbing spear
      aboSpearLine(ctx, x - 1.8 * k, y + 6.2 * k, x + 3 * k, y - 22.4 * k, k, 1.4 * k, 8);
      return true;
    case 'swordsman': // a heavy non-returning war boomerang held like a blade
      aboBoomerangPts(ctx, { x: x - 0.4 * k, y: y + 1.8 * k }, { x: x + 2 * k, y: y - 10.6 * k }, { x: x + 11.4 * k, y: y - 16.4 * k }, 2.1 * k, '#a5703c', AB_CLAY);
      line(ctx, x - 0.6 * k, y + 2 * k, x + 0.2 * k, y - 3 * k, AB_STRING, 1.7 * k);
      return true;
    case 'giant': // the champion: a great club in the hand, a spear thrust through the belt
      aboClub(ctx, x, y, k, true);
      return true;
    case 'explorer': { // a walking stick with a fire-hardened tip and a tuft of feathers
      line(ctx, x + 1 * k, y + 6 * k, x + 2.5 * k, y - 15 * k, '#a5723e', 1.5 * k);
      line(ctx, x + 0.6 * k, y + 6 * k, x + 2.1 * k, y - 15 * k, shade('#a5723e', 0.4), 0.5 * k);
      for (const [t, c] of [[-13, AB_OCH], [-11.4, AB_CLAY], [-9.8, AB_OCH]] as const) line(ctx, x + 1.4 * k, y + t * k, x + 3.6 * k, y + (t - 0.4) * k, c, 0.9 * k);
      feather(ctx, x + 2.6 * k, y - 15 * k, x + 0.6 * k, y - 21.6 * k, 1.1 * k, '#f6f3ea', AB_YOCH);
      feather(ctx, x + 2.6 * k, y - 15 * k, x + 4.6 * k, y - 21.4 * k, 1.1 * k, '#e8dcc0');
      return true;
    }
  }
  return false;
}

/** Clothing details on the torso: skin apron, string and bark belts, body paint and necklaces. */
function aboTorso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const skin = LOOK.aboriginal.skin;
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const Lf = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'L', x, y, w, h, u0, u1, v0, v1, c);
  const B = (v0: number, v1: number, c: string) => band(ctx, x, y, w, h, v0, v1, c);
  const elder = kind === 'giant', bare = kind === 'explorer';
  const belted = kind === 'defender' || kind === 'swordsman' || elder;
  const hunter = kind === 'woomera' || kind === 'archer';
  // an ochre wash over the chest
  if (!bare) B(0.36, 1, mix(skin, AB_OCH, hunter ? 0.34 : 0.62));
  // a short kangaroo-skin apron with a string fringe
  B(0, 0.3, AB_FUR);
  for (const u of [0.1, 0.36, 0.62, 0.86]) R(u, u + 0.12, 0.04, 0.26, AB_FUR_D);
  for (const u of [0.15, 0.55]) Lf(u, u + 0.14, 0.04, 0.26, AB_FUR_D);
  for (const u of [0.05, 0.22, 0.4, 0.58, 0.76, 0.92]) R(u, u + 0.06, -0.09, 0.05, AB_STRING);
  for (const u of [0.1, 0.34, 0.6, 0.84]) Lf(u, u + 0.06, -0.09, 0.05, AB_STRING);
  // the belt: hair-string, or a broad belt of stitched bark for the shield-bearers
  if (belted) {
    B(0.27, 0.46, AB_BARK);
    B(0.27, 0.3, AB_BARK_D);
    B(0.43, 0.46, AB_BARK_D);
    for (const u of [0.1, 0.3, 0.5, 0.7, 0.9]) R(u - 0.03, u + 0.03, 0.31, 0.42, AB_BARK_D);
    for (const u of [0.2, 0.6]) Lf(u - 0.03, u + 0.03, 0.31, 0.42, AB_BARK_D);
    for (const u of [0.2, 0.4, 0.6, 0.8]) R(u - 0.025, u + 0.025, 0.35, 0.39, AB_CLAY);
  } else {
    B(0.29, 0.39, AB_STRING);
    for (let i = 0; i < 6; i++) { R(0.02 + i * 0.16, 0.08 + i * 0.16, 0.3, 0.38, i % 2 ? AB_FUR : '#f6ecd0'); Lf(0.03 + i * 0.16, 0.09 + i * 0.16, 0.3, 0.38, i % 2 ? AB_FUR : '#f6ecd0'); }
    R(0.4, 0.6, 0.24, 0.42, AB_FUR_D); // the knot and the hanging ends
    R(0.44, 0.5, 0.12, 0.26, AB_STRING);
  }
  // body paint in white clay
  const teeth = (n: number, v: number, sz: number) => { // kangaroo-tooth necklace on a cord
    B(v + 0.02, v + 0.07, AB_FUR_D);
    for (let i = 0; i < n; i++) {
      const u = 0.1 + i * (0.8 / (n - 1)), d = Math.sin((i / (n - 1)) * Math.PI) * 0.06;
      facePoly(ctx, 'R', x, y, w, h, [[u - 0.045, v + 0.03], [u + 0.045, v + 0.03], [u, v - sz - d]], AB_CLAY);
    }
  };
  if (kind === 'warrior' || kind === 'knight') {
    for (const v of [0.5, 0.62, 0.74]) { B(v, v + 0.05, AB_CLAY); }
    for (const [i, u] of [0.16, 0.36, 0.56, 0.76].entries()) { R(u, u + 0.05, 0.56 + (i % 2) * 0.12 - 0.02, 0.6 + (i % 2) * 0.12 - 0.02, AB_CLAY); Lf(u, u + 0.05, 0.56 + (i % 2) * 0.12 - 0.02, 0.6 + (i % 2) * 0.12 - 0.02, AB_CLAY); }
    R(0.47, 0.53, 0.42, 0.8, AB_CLAY); // a stripe down the breastbone
    teeth(5, 0.8, 0.2);
  } else if (kind === 'defender') {
    for (const u of [0.1, 0.3, 0.5, 0.7, 0.88]) R(u, u + 0.07, 0.46, 0.8, AB_CLAY); // ladder of rib stripes
    for (const u of [0.15, 0.45, 0.75]) Lf(u, u + 0.08, 0.46, 0.8, AB_CLAY);
    B(0.8, 0.86, AB_YOCH);
    teeth(5, 0.84, 0.16);
  } else if (kind === 'swordsman' || elder) {
    facePoly(ctx, 'R', x, y, w, h, [[0.02, 0.98], [0.18, 0.98], [0.98, 0.5], [0.98, 0.42]], AB_CLAY); // crossed chest stripes
    facePoly(ctx, 'R', x, y, w, h, [[0.82, 0.98], [0.98, 0.98], [0.2, 0.42], [0.04, 0.5]], AB_CLAY);
    for (const [u, v] of [[0.12, 0.6], [0.86, 0.6], [0.5, 0.6], [0.5, 0.8], [0.3, 0.84], [0.7, 0.84]] as const) R(u - 0.03, u + 0.03, v - 0.03, v + 0.03, AB_CLAY);
    for (const u of [0.2, 0.55]) Lf(u, u + 0.08, 0.56, 0.62, AB_CLAY);
    teeth(elder ? 7 : 5, 0.8, 0.16);
    if (elder) { B(0.9, 0.96, '#f6ecd0'); for (let i = 0; i < 6; i++) R(0.06 + i * 0.15, 0.13 + i * 0.15, 0.86, 0.92, i % 2 ? '#e6d0b0' : '#ffffff'); } // a second necklace of shells
  } else if (kind === 'woomera' || kind === 'archer') {
    facePoly(ctx, 'R', x, y, w, h, [[0.04, 0.98], [0.24, 0.98], [0.98, 0.4], [0.8, 0.4]], AB_STRING); // a possum-string bandolier
    for (const t of [0.1, 0.3, 0.5, 0.7, 0.9]) faceQuad(ctx, 'R', x, y, w, h, 0.04 + t * 0.9 - 0.02, 0.04 + t * 0.9 + 0.03, 0.98 - t * 0.55 - 0.05, 0.98 - t * 0.55 + 0.02, AB_FUR_D);
    for (const [u, v] of [[0.6, 0.86], [0.78, 0.7], [0.3, 0.56], [0.5, 0.52], [0.7, 0.54], [0.4, 0.7]] as const) R(u - 0.03, u + 0.03, v - 0.03, v + 0.03, AB_CLAY); // clay dots
    for (const [u, v] of [[0.2, 0.56], [0.5, 0.7]] as const) Lf(u, u + 0.06, v, v + 0.06, AB_CLAY);
    B(0.9, 0.95, AB_FUR_D);
    for (let i = 0; i < 6; i++) R(0.06 + i * 0.15, 0.12 + i * 0.15, 0.86, 0.92, i % 2 ? '#e6d0b0' : '#ffffff'); // a shell necklace
  } else if (bare) {
    // a possum-skin cloak over the shoulders, stitched panels and a fur collar
    B(0.66, 1, AB_FUR);
    for (const u of [0.2, 0.5, 0.8]) R(u, u + 0.03, 0.5, 1, AB_FUR_D);
    for (const u of [0.12, 0.34, 0.56, 0.78]) R(u, u + 0.12, 0.52, 0.68, AB_FUR_D);
    for (const u of [0.3, 0.7]) Lf(u, u + 0.03, 0.66, 1, AB_FUR_D);
    B(0.92, 1, '#a58862');
    for (let i = 0; i < 5; i++) R(0.06 + i * 0.2, 0.12 + i * 0.2, 0.5, 0.6, AB_FUR_D);
    B(0.62, 0.66, AB_CLAY); // an incised hem
    for (const [u, v] of [[0.3, 0.74], [0.62, 0.8]] as const) R(u - 0.03, u + 0.03, v - 0.03, v + 0.03, AB_CLAY);
  }
}

/** Legs: white-clay shin stripes and a possum-string anklet. */
function aboLeg(ctx: Ctx, f: 'L' | 'R', cx: number, cy: number, k: number, kind: UnitKind) {
  const q = (v0: number, v1: number, c: string) => faceQuad(ctx, f, cx, cy, 3.6 * k, 5.2 * k, 0.05, 0.95, v0, v1, c);
  q(0.14, 0.22, AB_STRING); // string anklet
  q(0.16, 0.19, AB_FUR_D);
  if (kind === 'explorer') return;
  if (kind === 'woomera' || kind === 'archer') { for (const [u, v] of [[0.3, 0.5], [0.6, 0.62], [0.42, 0.74]] as const) faceQuad(ctx, f, cx, cy, 3.6 * k, 5.2 * k, u, u + 0.12, v, v + 0.1, AB_CLAY); return; }
  q(0.42, 0.49, AB_CLAY); // shin stripes
  q(0.58, 0.64, AB_CLAY);
  q(0.7, 0.9, mix(LOOK.aboriginal.skin, AB_OCH, 0.5));
}

/** Arms: a plaited cane armband above the elbow, a possum-string band and clay stripes on the forearm. */
function aboArm(ctx: Ctx, cx: number, cy: number, k: number, front: boolean, kind: UnitKind) {
  const skin = LOOK.aboriginal.skin;
  const q = (v0: number, v1: number, c: string) => faceQuad(ctx, 'R', cx, cy, 2.8 * k, 7 * k, 0, 1, v0, v1, c);
  q(0.16, 0.3, skin); // overpaints the shared cuff band
  q(0.6, 0.82, AB_CANE); // the plaited armband: two tones and a woven diamond row
  q(0.6, 0.64, AB_CANE_D);
  q(0.78, 0.82, AB_CANE_D);
  for (const u of [0.15, 0.55]) faceQuad(ctx, 'R', cx, cy, 2.8 * k, 7 * k, u, u + 0.28, 0.66, 0.76, AB_OCH);
  if (front) { q(0.38, 0.44, AB_STRING); q(0.08, 0.14, AB_CLAY); if (kind !== 'explorer') { q(0.24, 0.29, AB_CLAY); } }
  else { q(0.34, 0.4, AB_STRING); q(0.1, 0.15, AB_CLAY); }
}

/** A face: white-clay lines under the eyes and across the brow, a full beard for the senior ranks. */
function aboFace(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const skin = LOOK.aboriginal.skin, hair = LOOK.aboriginal.hair;
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const Lf = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'L', x, y, w, h, u0, u1, v0, v1, c);
  const bearded = kind === 'defender' || kind === 'swordsman' || kind === 'giant' || kind === 'knight' || kind === 'explorer';
  const strong = kind === 'warrior' || kind === 'defender' || kind === 'swordsman' || kind === 'giant' || kind === 'knight';
  R(0.02, 0.98, 0.3, 0.35, strong ? AB_CLAY : mix(skin, AB_CLAY, 0.7)); // a clay line under the eyes
  if (strong) { R(0.02, 0.98, 0.18, 0.22, AB_OCH); Lf(0.5, 1, 0.3, 0.35, AB_CLAY); Lf(0.4, 1, 0.18, 0.22, AB_OCH); }
  else { for (const u of [0.1, 0.3, 0.7, 0.86]) R(u, u + 0.06, 0.2, 0.26, AB_CLAY); } // dotted cheeks
  R(0.4, 0.62, 0.5, 0.66, mix(skin, AB_OCH, 0.35)); // an ochre bridge over the nose
  R(0.42, 0.6, 0.28, 0.5, shade(skin, -0.16));
  for (const u of [0.2, 0.42, 0.64]) R(u, u + 0.08, 0.8, 0.86, AB_CLAY); // a row of brow dots
  if (bearded) {
    R(0.02, 0.98, -0.02, 0.15, hair);
    Lf(0.3, 1, 0, 0.16, hair);
    R(0.9, 1, 0.14, 0.4, hair); // beard running up into the sideburn
    R(0.3, 0.7, 0.1, 0.13, shade(hair, 0.22));
    if (kind === 'giant' || kind === 'swordsman') R(0.28, 0.72, -0.2, -0.02, hair); // a longer beard
    if (kind === 'giant') R(0.4, 0.6, -0.26, -0.18, shade(hair, 0.18)); // a white-flecked tip
  } else R(0.4, 0.6, 0.06, 0.13, hair); // a chin tuft
  if (kind === 'giant' || kind === 'explorer') { R(0.16, 0.42, 0.7, 0.75, '#c9c2b4'); R(0.58, 0.83, 0.7, 0.75, '#c9c2b4'); } // greying brows
}

/** Hair, a woven headband and feathers, by rank. */
function aboHead(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  const hair = LOOK.aboriginal.hair;
  const bw = hw + 1.4 * k, by = top + 2.1 * k;
  const wide = kind === 'woomera' || kind === 'swordsman' || kind === 'giant';
  const bh = (wide ? 2.9 : 2.2) * k;
  const cord = wide ? AB_CANE : AB_STRING;
  // hair falling behind
  poly(ctx, [x - 5.4 * k, top + 2 * k, x - 7 * k, top + 6 * k, x - 6.4 * k, top + 10 * k, x - 4 * k, top + 9 * k, x - 3.6 * k, top + 3 * k], shade(hair, 0.06));
  poly(ctx, [x - 5.4 * k, top + 6 * k, x - 6.8 * k, top + 8.6 * k, x - 5.4 * k, top + 10.4 * k, x - 4.4 * k, top + 8 * k], shade(hair, 0.22));
  // the headband
  box(ctx, x, by, bw, bh, cord);
  for (let i = 0; i < 6; i++) { // twisted possum-fur string
    const c = i % 2 ? AB_OCH : '#f6ecd0';
    faceQuad(ctx, 'R', x, by, bw, bh, i / 6, i / 6 + 1 / 12, 0.1, 0.9, c);
    faceQuad(ctx, 'L', x, by, bw, bh, i / 6 + 0.04, i / 6 + 1 / 12 + 0.04, 0.1, 0.9, c);
  }
  if (wide) { faceQuad(ctx, 'R', x, by, bw, bh, 0, 1, 0.42, 0.58, AB_OCH); faceQuad(ctx, 'L', x, by, bw, bh, 0, 1, 0.42, 0.58, AB_OCH); }
  // curly hair over the crown, and a fringe above the band
  ellipse(ctx, x + 0.2 * k, top + 0.1 * k, hw * 0.5, 2.7 * k, hair);
  for (const [dx, dy, r] of [[-5.2, 0.6, 1.7], [-3.6, -1.6, 1.6], [-0.6, -2.5, 1.7], [2.4, -1.9, 1.6], [4.8, -0.2, 1.6], [-5.9, 2.6, 1.3], [1.4, 1.2, 1.5]] as const) ellipse(ctx, x + dx * k, top + dy * k, r * k, r * 0.9 * k, hair);
  ellipse(ctx, x - 1.4 * k, top - 0.9 * k, 3 * k, 1.2 * k, shade(hair, 0.22));
  for (const [dx, dy] of [[-3.6, -1.9], [-0.6, -2.7], [2.4, -2.1]] as const) ellipse(ctx, x + dx * k, top + dy * k, 0.9 * k, 0.6 * k, shade(hair, 0.38));
  faceQuad(ctx, 'R', x, by, bw, bh, 0, 1, 1, 1.32, hair);
  faceQuad(ctx, 'L', x, by, bw, bh, 0, 1, 1, 1.32, hair);
  const plume = (bx: number, ty: number, lean: number, c: string, tip?: string) => // cockatoo crest feathers sweep up and back from the band
    feather(ctx, bx, top + 1.8 * k, bx + (lean - 1.4) * k, top + (ty - 1.6 - Math.abs(lean) * 0.2) * k * 0.78 + 0.2 * k, 1.25 * k, c, tip);
  switch (kind) {
    case 'warrior':
      plume(x - 2.6 * k, -7, -1.4, '#f6f3ea');
      plume(x - 0.6 * k, -8, 0.6, '#f6f3ea');
      break;
    case 'archer': // a single emu feather trailing back, hair gathered in a bun
      ellipse(ctx, x - 4.8 * k, top + 0.6 * k, 2.3 * k, 2.1 * k, hair);
      ellipse(ctx, x - 5.2 * k, top + 0.2 * k, 1.2 * k, 1 * k, shade(hair, 0.25));
      for (const [dx, dy] of [[-0.4, -6.4], [0.6, -7]] as const) line(ctx, x - 1.6 * k, top + 1.4 * k, x + dx * k - 3 * k, top + dy * k, '#6a5238', 0.8 * k);
      break;
    case 'woomera': // a hair-string tuft and one white feather
      plume(x - 1.6 * k, -6.6, 1.2, '#f6f3ea');
      for (const [dx, dy] of [[-6.4, 2.6], [-6.8, 4.6]] as const) ellipse(ctx, x + dx * k, top + dy * k, 0.7 * k, 0.7 * k, AB_CLAY); // shell beads in the hair
      break;
    case 'defender': // a fan of white cockatoo feathers
      for (const [dx, ty, lean] of [[-4, -5.6, -3.2], [-2, -7.6, -1.6], [0, -8.4, 0], [2, -7.6, 1.6], [4, -5.6, 3.2]] as const) plume(x + dx * k, ty, lean, '#f6f3ea', AB_YOCH);
      break;
    case 'swordsman': // yellow-crested feathers and a bone through the hair
      plume(x - 3 * k, -8, -2, '#f6f3ea', AB_YOCH);
      plume(x - 0.4 * k, -9.4, 0.4, '#f6f3ea', AB_YOCH);
      plume(x + 2.4 * k, -7.6, 2.2, AB_OCH);
      break;
    case 'knight': // a tall fan of cockatoo feathers with a red centre
      for (const [dx, ty, lean, c] of [[-4.4, -6.6, -3.4, '#f6f3ea'], [-2.2, -9, -1.6, '#f6f3ea'], [0, -10.4, 0, AB_OCH], [2.2, -9, 1.6, '#f6f3ea'], [4.4, -6.6, 3.4, '#f6f3ea']] as const) plume(x + dx * k, ty, lean, c, AB_YOCH);
      break;
    case 'giant': // a crown of white and yellow-crested feathers on a wide cane band
      for (const [dx, ty, lean, c] of [[-5.4, -4, -4, '#f6f3ea'], [-3.6, -7.4, -2.6, AB_YOCH], [-1.8, -9.4, -1.2, '#f6f3ea'], [0, -10.2, 0, AB_OCH], [1.8, -9.4, 1.2, '#f6f3ea'], [3.6, -7.4, 2.6, AB_YOCH], [5.4, -4, 4, '#f6f3ea']] as const) plume(x + dx * k, ty, lean, c, '#ffffff');
      break;
    case 'explorer': // hair tied up, one small tuft
      plume(x - 1.6 * k, -4.6, 1, '#e8dcc0');
      break;
    default:
      plume(x - 1.6 * k, -6, 1, '#f6f3ea');
  }
  ellipse(ctx, x + 3 * k, by - 0.4 * k, 0.5 * k, 0.5 * k, AB_CLAY);
}

/** The possum-skin cloak's detail on the cape hanging behind the higher ranks. */
function aboCloak(ctx: Ctx, x: number, top: number, hip: number, k: number) {
  const hem = (t: number) => ({ x: x - 9.5 * k + 7.5 * k * t, y: hip + 6.5 * k + 2 * k * t });
  for (const t of [0.15, 0.5, 0.85]) { // stitched seams between the skins
    const h = hem(t);
    line(ctx, x - 3.6 * k - t * 1.2 * k, top + 0.8 * k, h.x, h.y, AB_FUR_D, 0.6 * k);
  }
  for (const t of [0.3, 0.6]) { // cross seams
    line(ctx, x - 4.6 * k - t * 3.8 * k, top + (hip + 6 * k - top) * t, x - 2.6 * k - t * 3.4 * k, top + (hip + 6.6 * k - top) * t + 0.4 * k, shade(AB_FUR_D, -0.2), 0.5 * k);
  }
  for (let i = 0; i < 6; i++) { // an incised zigzag of clay along the hem
    const a = hem(i / 6), b = hem((i + 1) / 6);
    line(ctx, a.x, a.y - 1.4 * k, (a.x + b.x) / 2, a.y - 2.8 * k + 1 * k, AB_CLAY, 0.5 * k);
    line(ctx, (a.x + b.x) / 2, a.y - 2.8 * k + 1 * k, b.x, b.y - 1.4 * k, AB_CLAY, 0.5 * k);
  }
  for (let i = 0; i < 7; i++) { const a = hem(i / 6); line(ctx, a.x, a.y, a.x - 0.3 * k, a.y + 1.6 * k, '#a58862', 0.7 * k); } // fur tufts on the hem
  ellipse(ctx, x - 3.6 * k, top + 0.6 * k, 2.6 * k, 1 * k, '#a58862'); // fur collar
}

// ----- horses: ochre stripes on the flanks and legs, a possum-fur blanket and a woven browband

function aboHorse(ctx: Ctx, kind: UnitKind, x: number, y: number, saddle: { x: number; y: number }) {
  const hx0 = x - 1, hy0 = y + 3, kh = 0.95;
  const bx = hx0, by = hy0 - 6 * kh, bw = 17 * kh, bh = 7 * kh;
  for (const [u, c] of [[0.6, AB_OCH], [0.68, AB_CLAY], [0.76, AB_OCH]] as const) faceQuad(ctx, 'R', bx, by, bw, bh, u, u + 0.05, 0.2, 0.94, c); // shoulder stripes
  for (const [u, c] of [[0.16, AB_OCH], [0.24, AB_CLAY]] as const) faceQuad(ctx, 'L', bx, by, bw, bh, u, u + 0.06, 0.2, 0.94, c); // haunch stripes
  for (const [lx, ly] of [[-6, -1.5], [-3, 0.5], [4, -0.5], [7, 1.5]] as const) { // clay rings on the lower legs
    faceQuad(ctx, 'R', hx0 + lx * kh, hy0 + ly * kh, 2.2 * kh, 7 * kh, 0, 1, 0.22, 0.3, AB_CLAY);
    faceQuad(ctx, 'R', hx0 + lx * kh, hy0 + ly * kh, 2.2 * kh, 7 * kh, 0, 1, 0.32, 0.38, AB_OCH);
  }
  const sx = saddle.x, sy = saddle.y;
  // a possum-fur blanket, edged in tufts and dotted in clay
  poly(ctx, [sx - 6.4, sy - 1, sx + 4, sy - 1, sx + 3.4, sy + 6.6, sx - 1.4, sy + 5, sx - 5.4, sy + 8], AB_FUR);
  poly(ctx, [sx - 6.4, sy - 1, sx + 4, sy - 1, sx + 3.9, sy + 0.8, sx - 6.2, sy + 0.8], '#a58862');
  poly(ctx, [sx - 1.4, sy + 5, sx + 3.4, sy + 6.6, sx + 3.9, sy + 4, sx - 0.4, sy + 2.6], AB_FUR_D);
  for (const [dx, dy] of [[-4.4, 2.2], [-2.4, 4], [0, 1.8], [1.8, 3.6], [-0.6, 5.2]] as const) ellipse(ctx, sx + dx, sy + dy, 0.5, 0.5, AB_CLAY);
  for (let i = 0; i < 6; i++) line(ctx, sx - 5.2 + i * 1.7, sy + 7.6 - i * 0.6, sx - 5.4 + i * 1.7, sy + 9.4 - i * 0.6, i % 2 ? '#a58862' : AB_FUR_D, 0.8); // tufted hem
  line(ctx, sx - 2.6, sy + 5, sx - 2.6, sy + 11, AB_STRING, 0.7); // a string girth
  const hx = x - 1 + 10.5 * 0.95, hy = y + 3 - 15 * 0.95;
  faceQuad(ctx, 'R', hx, hy, 7 * 0.95, 5 * 0.95, 0.1, 0.9, 0.62, 0.74, AB_OCH); // red ochre across the face
  faceQuad(ctx, 'R', hx, hy, 7 * 0.95, 5 * 0.95, 0.1, 0.9, 0.86, 0.96, AB_CANE); // a plaited browband
  for (const u of [0.22, 0.5, 0.78]) faceQuad(ctx, 'R', hx, hy, 7 * 0.95, 5 * 0.95, u - 0.05, u + 0.05, 0.88, 0.94, AB_CANE_D);
  feather(ctx, hx + 0.8, hy - 3.6, hx - 3.6, hy - 8.4, 1.1, '#f6f3ea', AB_YOCH); // a cockatoo feather swept back from the browband
  line(ctx, x + 5, y - 9, x + 9, y - 4.6, AB_FUR_D, 0.7); // a shell pendant on a cord at the neck
  ellipse(ctx, x + 7.2, y - 5.8, 1.3, 1.5, '#f4ecd8');
  ellipse(ctx, x + 6.9, y - 6.2, 0.5, 0.6, '#ffffff');
  if (kind === 'knight') for (const [i, c] of [[0, AB_CLAY], [1, AB_OCH]] as const) band(ctx, bx, by, bw, bh, 0.08 + i * 0.06, 0.13 + i * 0.06, c);
}

/** The rider's long spear: fire-hardened, barbed and tufted, with a bark-string wrap at the grip. */
function aboRiderSpear(ctx: Ctx, hx: number, hy: number, thick: number) {
  aboSpearLine(ctx, hx - 3, hy + 6, hx + 8, hy - 20, 0.85, thick * 0.9, 6);
  for (const t of [0.1, 0.16, 0.22]) line(ctx, hx - 3 + 11 * t - 1, hy + 6 - 26 * t + 0.4, hx - 3 + 11 * t + 1, hy + 6 - 26 * t - 0.4, AB_STRING, 0.8);
}

// ----- the great wooden spear-thrower (catapult)

function aboCatapult(ctx: Ctx, x: number, y: number) {
  const wood = '#8a5a34', woodD = '#4f2f18', woodL = '#b07a44';
  const rope = (x0: number, y0: number, x1: number, y1: number) => line(ctx, x0, y0, x1, y1, AB_STRING, 0.9);
  // a heap of stones for the counterweight and spare spears leaning at the front
  for (const [ax, ay, ar] of [[-15, 5, 2.4], [-12, 6.4, 2.1], [-13.4, 3.2, 2], [-10, 3.8, 1.6]] as const) {
    ellipse(ctx, x + ax, y + ay, ar, ar * 0.85, '#7d746a');
    ellipse(ctx, x + ax - ar * 0.3, y + ay - ar * 0.3, ar * 0.45, ar * 0.35, '#b0a698');
  }
  // log rollers and the timber sledge
  for (const [wx, wy] of [[-7, 2.8], [6, 4.4]] as const) {
    ellipse(ctx, x + wx, y + wy, 2.8, 3.2, woodD);
    ellipse(ctx, x + wx, y + wy, 2.2, 2.6, woodL);
    ring(ctx, x + wx, y + wy, 1.3, 1.6, woodD, 0.5);
    ring(ctx, x + wx, y + wy, 0.6, 0.8, woodD, 0.4);
  }
  box(ctx, x, y - 1.6, 20, 3.2, woodD, shade(wood, 0.05));
  band(ctx, x, y - 1.6, 20, 3.2, 0.62, 0.78, AB_OCH);
  for (const u of [0.15, 0.35, 0.55, 0.75, 0.92]) faceQuad(ctx, 'R', x, y - 1.6, 20, 3.2, u, u + 0.03, 0, 1, woodD); // bound logs
  for (const u of [0.25, 0.5, 0.8]) { faceQuad(ctx, 'L', x, y - 1.6, 20, 3.2, u, u + 0.05, 0.62, 0.78, AB_CLAY); }
  // the A-frame: two great poles crossed and lashed, a cross-pole for the pivot
  line(ctx, x - 6, y - 3, x + 2, y - 24, woodD, 3.6);
  line(ctx, x - 6.4, y - 3, x + 1.6, y - 24, wood, 2.4);
  line(ctx, x + 7, y - 3, x - 0.4, y - 24, woodD, 3.6);
  line(ctx, x + 6.6, y - 3, x - 0.8, y - 24, shade(wood, 0.12), 2.4);
  for (const t of [0.35, 0.5]) { const py = y - 3 - 21 * t; line(ctx, x - 5.6 + 8.2 * t, py, x + 6.4 - 6.8 * t, py + 0.4, AB_CLAY, 0.7); } // clay stripes
  line(ctx, x - 5.4, y - 6.8, x + 5.4, y - 6.2, woodL, 1.4); // a low cross-brace
  const px = x + 0.6, py = y - 22; // the pivot: lashed with string, a crossbar through it
  line(ctx, px - 5, py + 1.4, px + 5, py - 0.8, woodD, 2);
  for (const dx of [-1.6, 0, 1.6]) line(ctx, px + dx - 0.8, py - 1.6 + dx * -0.2, px + dx + 0.8, py + 2.2 + dx * -0.2, AB_STRING, 0.8);
  // the throwing arm: a huge woomera, hooked at the long end; its stone-filled net at the short end
  ctx.lineCap = 'round';
  for (const [c, wid, dy] of [[woodD, 3.4, 0], [woodL, 2.1, -0.3]] as const) {
    ctx.strokeStyle = ink(c);
    ctx.lineWidth = wid;
    ctx.beginPath();
    ctx.moveTo(px - 10.4, py + 8.4 + dy);
    ctx.quadraticCurveTo(px + 1, py - 1 + dy, px + 14.6, py - 9 + dy);
    ctx.stroke();
  }
  for (const t of [0.5, 0.62, 0.74]) { const bx = px - 10.4 + 25 * t, by = py + 8.4 - 17.4 * t - 2; line(ctx, bx - 0.8, by + 1.6, bx + 0.8, by - 0.4, t === 0.62 ? AB_OCH : AB_CLAY, 0.7); }
  poly(ctx, [px + 14.6, py - 9, px + 16.2, py - 12.6, px + 13.4, py - 10.2], '#e6d8b4'); // the hook
  const nx = px - 11.4, ny = py + 11.6; // the counterweight net
  line(ctx, px - 10.4, py + 8.4, nx - 2, ny - 1, AB_STRING, 0.6);
  line(ctx, px - 10.4, py + 8.4, nx + 2, ny - 1, AB_STRING, 0.6);
  aboEll(ctx, nx, ny + 1.6, 3.6, 3.9, 0, '#5a4a3a');
  aboEll(ctx, nx - 0.3, ny + 1.3, 3.2, 3.5, 0, '#8a7a68');
  for (const [dx, dy, r, c] of [[-1.2, 0.6, 1.3, '#a89e90'], [1.2, 1.8, 1.2, '#7a7062'], [-0.4, 3, 1.2, '#98907e']] as const) ellipse(ctx, nx + dx, ny + dy, r, r * 0.9, c);
  for (let i = -1; i <= 1; i++) { line(ctx, nx + i * 1.4 - 1, ny - 1.4, nx + i * 1.4 + 1, ny + 4.6, AB_STRING, 0.4); line(ctx, nx + i * 1.4 + 1, ny - 1.4, nx + i * 1.4 - 1, ny + 4.6, AB_STRING, 0.4); }
  // a great spear seated on the hook, aimed skyward
  aboSpearLine(ctx, px - 1.4, py + 0.4, px + 15.4, py - 15, 1.2, 1.3, 8);
  // a bundle of feathers and a painted spear rest at the front
  for (const [dx, tx] of [[10, 6.4], [11.6, 8.4], [13.2, 10.6]] as const) aboSpearLine(ctx, x + dx, y + 2.6, x + tx, y - 13, 0.8, 0.9, 4.4);
  rope(x - 5.4, y - 2.8, x - 3, y - 4.2);
  for (const dx of [-1.4, 0.4, 2.2]) line(ctx, px + dx, py - 2.4, px + dx + 0.6, py - 6.6, dx > 0 ? AB_YOCH : '#f6f3ea', 1); // cockatoo feathers on the pivot
}

// ----- bark canoes

/** One sewn-bark canoe: pointed, upswept ends, stitched seams, a dark hollow inside. `fill` draws the crew and hearth between the far and near walls. */
function aboCanoe(ctx: Ctx, cx: number, cy: number, w: number, fill: () => void) {
  const bark = '#a9703f', barkD = '#6f4526', barkL = '#cb975c';
  const rim = (dy: number): [number, number][] => [[cx - w, cy - 9 + dy], [cx - w * 0.66, cy - 6.6 + dy], [cx - w * 0.3, cy - 5.6 + dy], [cx, cy - 5.4 + dy], [cx + w * 0.3, cy - 5.8 + dy], [cx + w * 0.66, cy - 6.8 + dy], [cx + w + 1, cy - 10 + dy]];
  const near = rim(0), far = rim(-2.8).map(([px, py], i) => [px + (i === 0 ? 2.6 : i === 6 ? -2.4 : 0), py] as [number, number]);
  // the hollow
  poly(ctx, [...near.flatMap(([a, b]) => [a, b]), ...[...far].reverse().flatMap(([a, b]) => [a, b])], '#3f2414');
  poly(ctx, [...far.flatMap(([a, b]) => [a, b]), ...[...far].reverse().map(([a, b]) => [a, b + 1.6]).flatMap(([a, b]) => [a, b])], barkD); // the inside of the far wall
  fill();
  // the outer hull
  const hull = [...near, [cx + w * 0.78, cy - 1], [cx + w * 0.42, cy + 2.8], [cx, cy + 3.4], [cx - w * 0.42, cy + 3], [cx - w * 0.8, cy - 1]] as [number, number][];
  poly(ctx, hull.flatMap(([a, b]) => [a, b]), bark);
  poly(ctx, [...near.flatMap(([a, b]) => [a, b]), cx + w * 0.7, cy - 3.8, cx, cy - 2.6, cx - w * 0.7, cy - 3.4], barkL); // the sunlit strip under the rim
  poly(ctx, [cx - w * 0.8, cy - 1, cx - w * 0.42, cy + 3, cx, cy + 3.4, cx + w * 0.42, cy + 2.8, cx + w * 0.78, cy - 1, cx + w * 0.4, cy - 0.4, cx, cy + 0.4, cx - w * 0.4, cy - 0.2], barkD); // the shaded belly
  ctx.lineCap = 'round';
  ctx.strokeStyle = ink(shade(barkL, 0.15)); // the rolled rim
  ctx.lineWidth = 1;
  ctx.beginPath();
  near.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)));
  ctx.stroke();
  for (const t of [-0.5, -0.2, 0.15, 0.5]) { // sewn seams: a dark line with cream stitches
    const sx = cx + t * w;
    line(ctx, sx, cy - 5.6, sx - 0.6, cy + 2.6, shade(barkD, -0.3), 0.5);
    for (const s of [0.1, 0.4, 0.7]) line(ctx, sx - 0.8 - 0.6 * s, cy - 5 + s * 7.6, sx + 0.8 - 0.6 * s, cy - 4.4 + s * 7.6, AB_STRING, 0.4);
  }
  for (const e of [-1, 1]) { // the bark is gathered and lashed at each pointed end, and painted with clay bands
    const ex = cx + e * w, ey = cy - (e < 0 ? 9 : 10);
    for (let i = 0; i < 3; i++) line(ctx, ex - e * (1.6 + i * 1.4), ey + 1.6 + i * 0.5, ex - e * (2.2 + i * 1.4), ey + 4.2 + i * 0.4, AB_STRING, 0.7);
    line(ctx, ex, ey, ex + e * 1.6, ey - 1.8, barkD, 1.1);
    ellipse(ctx, ex + e * 1.6, ey - 2, 0.7, 0.7, AB_OCH);
  }
  for (const [i, c] of [[0, AB_CLAY], [1, AB_OCH], [2, AB_CLAY]] as const) line(ctx, cx - w * 0.24 + i * 1.6, cy - 3.8 + i * 0.1, cx - w * 0.2 + i * 1.6, cy + 1.6, c, 0.6); // painted band on the hull
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; // foam along the waterline
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 3.4, w * 0.74, 2.2, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.stroke();
}

/** A small cooking fire on a mound of clay: stones, logs, flames, a fish on a stick and a curl of smoke. */
function aboCanoeFire(ctx: Ctx, x: number, y: number, fish: boolean) {
  ellipse(ctx, x, y + 0.6, 4.2, 1.7, '#7a5a3a');
  ellipse(ctx, x, y, 3.8, 1.5, '#c39a68');
  ellipse(ctx, x - 0.4, y - 0.3, 2.6, 0.9, '#d6b285');
  for (const a of [0.2, 1.4, 2.6, 3.8, 5.1]) ellipse(ctx, x + Math.cos(a) * 3, y + Math.sin(a) * 1.1, 0.7, 0.55, '#8a8378');
  line(ctx, x - 2.2, y + 0.2, x + 1.6, y - 1, '#3a2418', 0.9);
  line(ctx, x - 1.4, y - 0.8, x + 2.2, y + 0.2, '#4a2e18', 0.9);
  poly(ctx, [x - 1.6, y - 0.6, x - 0.4, y - 5.4, x + 0.5, y - 2.6, x + 1.7, y - 4.6, x + 2, y - 0.8], '#e8642a');
  poly(ctx, [x - 0.9, y - 0.6, x + 0.1, y - 3.6, x + 1.1, y - 0.8], '#f6c33a');
  ellipse(ctx, x + 0.1, y - 0.8, 0.9, 0.5, '#fff0a0');
  if (fish) {
    line(ctx, x - 4, y + 1, x - 2.6, y - 5.4, '#7a5230', 0.6);
    aboEll(ctx, x - 2.8, y - 4.2, 1.9, 0.8, -1.1, '#c9c9c0');
    poly(ctx, [x - 3.4, y - 6.2, x - 2.2, y - 6.8, x - 2.6, y - 5.4], '#8a8a84');
  }
  ctx.strokeStyle = 'rgba(200,200,205,0.55)';
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 0.4, y - 5);
  ctx.bezierCurveTo(x + 2.6, y - 8, x - 1.4, y - 10, x + 1.6, y - 14);
  ctx.stroke();
}

function drawAboriginalCanoe(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  const tier = kind === 'warship' ? 2 : kind === 'ship' ? 1 : 0;
  const w = 14.5 + tier * 3.6;
  const paddle = (px: number, py: number, dir: number) => { // a long paddle with a leaf-shaped blade dipping in the water
    line(ctx, px + dir * 2.6, py - 9, px - dir * 3.8, py + 5.2, '#7a5230', 0.9);
    aboEll(ctx, px - dir * 4.4, py + 6.2, 1.1, 2.1, dir * 0.5, AB_WOOD);
    aboEll(ctx, px - dir * 4.4, py + 6.2, 0.4, 1.1, dir * 0.5, AB_OCH);
  };
  const crew = (cx: number, cy: number, at: number, kd: UnitKind, kk: number) => figure(ctx, kd, 'aboriginal', cx + at, cy - 6.6, kk, true);
  if (tier === 2) {
    // a war party: two canoes lashed together with poles, a platform of bark between, warriors with shields and a feathered standard
    const bx = x - 5, by = y - 5.2;
    aboCanoe(ctx, bx, by, w * 0.9, () => {
      crew(bx, by, -w * 0.3, 'woomera', 0.42);
      crew(bx, by, w * 0.34, 'warrior', 0.42);
    });
    for (const t of [-0.55, 0, 0.55]) { // cross poles lashed over both hulls
      const ax = bx + t * w * 0.8, ay = by - 7.4, ex = x + 3 + t * w * 0.8, ey = y - 6.2;
      line(ctx, ax, ay, ex, ey, '#5a3a1e', 1.5);
      line(ctx, ax, ay - 0.3, ex, ey - 0.3, '#8a6a3c', 0.5);
      for (const p of [0.08, 0.92]) ellipse(ctx, ax + (ex - ax) * p, ay + (ey - ay) * p, 0.7, 0.7, AB_STRING);
    }
    aboCanoe(ctx, x + 3, y, w, () => {
      aboCanoeFire(ctx, x + 3 - w * 0.06, y - 6.2, true);
      crew(x + 3, y, -w * 0.62, 'warrior', 0.46);
      crew(x + 3, y, w * 0.5, 'swordsman', 0.46);
      crew(x + 3, y, w * 0.86 - 3, 'defender', 0.44);
    });
    for (const [i, t] of [-0.5, -0.2, 0.15, 0.5].entries()) { // parrying shields hung along the rim
      const sx = x + 3 + t * w, sy = y - 6;
      aboEll(ctx, sx, sy + 0.6, 1.6, 3.6, 0, AB_WOOD_D);
      aboEll(ctx, sx - 0.2, sy + 0.2, 1.4, 3.3, 0, i % 2 ? '#9a6a3c' : AB_WOOD);
      line(ctx, sx, sy - 2.6, sx, sy + 3, AB_CLAY, 0.4);
      line(ctx, sx - 1, sy - 0.6, sx, sy + 0.4, AB_OCH, 0.5);
      line(ctx, sx + 1, sy - 0.6, sx, sy + 0.4, AB_OCH, 0.5);
    }
    // a standard of white cockatoo feathers on a pole at the bow, spears bristling behind
    const px = x + 3 + w + 0.6, py = y - 10;
    line(ctx, px, py, px + 0.6, py - 20, '#5a3a1e', 1.1);
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.42; poly(ctx, [px + 0.6, py - 19, px + 0.6 + Math.cos(a) * 6, py - 19 + Math.sin(a) * 6.4, px + 0.6 + Math.cos(a + 0.2) * 2.4, py - 19 + Math.sin(a + 0.2) * 2.4], i % 3 === 1 ? AB_YOCH : '#f6f3ea'); }
    ellipse(ctx, px + 0.6, py - 19.4, 1.1, 1.1, AB_OCH);
    for (const [ox, tx] of [[-8, -12], [-4, -5], [-1, 2]] as const) aboSpearLine(ctx, x + 3 + ox, y - 8, x + 3 + tx * 0.4 + ox, y - 26, 0.8, 0.8, 4.4); // spears upright
    return;
  }
  aboCanoe(ctx, x, y, w, () => {
    aboCanoeFire(ctx, x - w * 0.14, y - 6.2, tier === 1);
    if (tier === 1) { // a second paddler, a bundle of spears and a dilly bag of catch
      crew(x, y, -w * 0.62, 'woomera', 0.46);
      for (const [dx, ex] of [[-w * 0.2, w * 0.6], [-w * 0.24, w * 0.56], [-w * 0.28, w * 0.5]] as const) line(ctx, x + dx, y - 5.8, x + ex, y - 8.2, '#8a6a3c', 0.7); // spears lying across
      aboDilly(ctx, x + w * 0.16, y - 6.6, 0.6);
    }
    crew(x, y, w * 0.52, 'archer', tier ? 0.46 : 0.5);
  });
  // paddles over the near gunwale
  paddle(x + w * 0.52 + 3.4, y - 5, 1);
  if (tier === 1) paddle(x - w * 0.62 + 3.4, y - 5, 1);
  else { // a lone paddler's spear and a coil of string lying across the bow
    line(ctx, x + w * 0.2, y - 8.6, x + w * 0.8, y - 11.4, '#8a6a3c', 0.8);
  }
}

// ----- the kangaroo

function aboKangaroo(ctx: Ctx, x: number, y: number, k: number, body: string) {
  const dk = shade(body, -0.3), pale = '#ecd9b6';
  // the long, thick tail sweeps back and down to the ground
  poly(ctx, [x - 4 * k, y - 9 * k, x - 9 * k, y - 4.6 * k, x - 15.6 * k, y - 0.6 * k, x - 15 * k, y + 0.8 * k, x - 8 * k, y - 1.4 * k, x - 3 * k, y - 3.4 * k], dk);
  poly(ctx, [x - 4 * k, y - 9 * k, x - 9 * k, y - 5.6 * k, x - 15.2 * k, y - 0.6 * k, x - 8.4 * k, y - 3.4 * k, x - 3.6 * k, y - 6 * k], body);
  // the great hind leg: a heavy thigh and a long foot lying forward
  aboEll(ctx, x - 3 * k, y - 5.6 * k, 4.4 * k, 5 * k, -0.3, dk);
  aboEll(ctx, x - 3.4 * k, y - 6.2 * k, 3.8 * k, 4.4 * k, -0.3, shade(body, -0.08));
  poly(ctx, [x - 4 * k, y - 3.4 * k, x - 1 * k, y - 3 * k, x + 0.4 * k, y - 0.6 * k, x - 0.6 * k, y + 0.2 * k, x - 3.4 * k, y - 1 * k], dk); // the shin
  poly(ctx, [x - 3 * k, y - 0.4 * k, x + 4.6 * k, y - 0.8 * k, x + 5.6 * k, y + 0.5 * k, x - 3.6 * k, y + 0.5 * k], '#3a2418'); // the foot
  ellipse(ctx, x + 5.4 * k, y - 0.1 * k, 0.6 * k, 0.5 * k, '#1a1410'); // the claw
  // the torso, leaning forward, and a pale chest
  aboEll(ctx, x - 0.4 * k, y - 11.6 * k, 4.4 * k, 7.4 * k, 0.32, body);
  aboEll(ctx, x + 1.6 * k, y - 11.4 * k, 2.8 * k, 5.6 * k, 0.32, pale);
  aboEll(ctx, x - 1.4 * k, y - 14.4 * k, 2.4 * k, 4.2 * k, 0.32, shade(body, 0.14));
  // the small forearm, held up at the chest
  line(ctx, x + 2.6 * k, y - 11.4 * k, x + 5.6 * k, y - 9 * k, dk, 1.3 * k);
  for (const t of [0, 0.5]) line(ctx, x + 5.6 * k, y - 9 * k, x + 7 * k, y - (8.2 - t * 1.2) * k, '#1a1410', 0.5 * k);
  // neck and head with long ears
  aboEll(ctx, x + 2.6 * k, y - 18.4 * k, 2.2 * k, 3.2 * k, 0.3, body);
  aboEll(ctx, x + 4.4 * k, y - 21.6 * k, 2.6 * k, 2.4 * k, 0, shade(body, 0.06));
  poly(ctx, [x + 5.6 * k, y - 22.8 * k, x + 10.2 * k, y - 20.8 * k, x + 10.4 * k, y - 19.4 * k, x + 6.4 * k, y - 19.2 * k], shade(body, 0.16)); // the long muzzle
  poly(ctx, [x + 6 * k, y - 19.6 * k, x + 10.2 * k, y - 19.6 * k, x + 9.6 * k, y - 18.6 * k, x + 6.6 * k, y - 18.6 * k], pale);
  ellipse(ctx, x + 10.4 * k, y - 20.6 * k, 0.9 * k, 0.75 * k, '#1a1410'); // the black nose
  ellipse(ctx, x + 5.4 * k, y - 22 * k, 0.6 * k, 0.6 * k, '#101010');
  line(ctx, x + 6.4 * k, y - 21 * k, x + 9 * k, y - 20.2 * k, dk, 0.4 * k); // the dark mouth line
  for (const [bx, tx, ty] of [[3.4, 2.2, -29.4], [4.8, 5.8, -29.8]] as const) {
    poly(ctx, [x + bx * k - 0.9 * k, y - 23 * k, x + tx * k, y + ty * k, x + bx * k + 1.1 * k, y - 23.4 * k], body);
    poly(ctx, [x + bx * k - 0.3 * k, y - 23.4 * k, x + (tx + 0.1) * k, y + (ty + 2) * k, x + bx * k + 0.6 * k, y - 23.6 * k], '#e0a08c');
  }
  line(ctx, x + 6.4 * k, y - 23.6 * k, x + 9 * k, y - 22.2 * k, pale, 0.5 * k); // a pale cheek stripe
}

// ---------------------------------------------------------------- wildlife (map resources)

const CRITTER: Record<TribeId, { body: string; feature: 'hump' | 'antlers' | 'snout' | 'horns' | 'tusks' | 'stripes' | 'kiwi' | 'lion' | 'caribou' | 'llama' | 'ibex' | 'kangaroo' }> = {
  egypt: { body: '#d0a45e', feature: 'hump' },
  aztec: { body: '#9c6236', feature: 'antlers' },
  polynesia: { body: '#7a5a3a', feature: 'kiwi' },
  rome: { body: '#34343b', feature: 'horns' },
  pirates: { body: '#5a4235', feature: 'tusks' },
  vikings: { body: '#8a7a66', feature: 'antlers' },
  japan: { body: '#6a5040', feature: 'tusks' },
  mongols: { body: '#4a3628', feature: 'horns' },
  greeks: { body: '#e6e0d0', feature: 'horns' },
  zulu: { body: '#f4f1ea', feature: 'stripes' },
  persia: { body: '#d2a458', feature: 'lion' },
  celts: { body: '#8a4a2a', feature: 'antlers' },
  inuit: { body: '#8a6a4c', feature: 'caribou' },
  inca: { body: '#e8dcc0', feature: 'llama' },
  ethiopia: { body: '#7a4530', feature: 'ibex' },
  aboriginal: { body: '#b5623a', feature: 'kangaroo' }, // a red kangaroo
  china: { body: '#e8e8e2', feature: 'snout' },
  india: { body: '#7a7a80', feature: 'tusks' },
  mali: { body: '#c9a06a', feature: 'horns' },
  lakota: { body: '#4a3428', feature: 'horns' },
  ottoman: { body: '#8a6a4a', feature: 'horns' },
};

export function drawCritter(ctx: Ctx, x: number, y: number, biome: TribeId, k = 1) {
  const spec = CRITTER[biome];
  const body = spec.body;
  ellipse(ctx, x + 2 * k, y + 1, 11 * k, 3 * k, 'rgba(0,0,0,0.2)');
  if (spec.feature === 'caribou') {
    drawCaribou(ctx, x, y, 0.9 * k);
    return;
  }
  if (biome === 'celts') return drawStag(ctx, x, y, k);
  if (spec.feature === 'kiwi') {
    // a kiwi: round shaggy brown body, no wings, a long thin curved beak and sturdy legs
    for (const lx of [-1, 4]) line(ctx, x + lx * k, y - 3 * k, x + (lx + 0.4) * k, y, '#c9a06a', 1.4 * k);
    ellipse(ctx, x + 1 * k, y - 8 * k, 9 * k, 6.6 * k, shade(body, -0.15));
    ellipse(ctx, x + 0 * k, y - 9 * k, 8.2 * k, 5.8 * k, body);
    ellipse(ctx, x - 2 * k, y - 11 * k, 4 * k, 2.4 * k, shade(body, 0.14));
    for (const [fx, fy] of [[-5, -8], [-2, -6], [1, -9], [3, -6.4], [-6, -11]] as const) line(ctx, x + fx * k, y + fy * k, x + (fx + 2.6) * k, y + (fy + 1.4) * k, shade(body, -0.35), 0.6 * k); // feather streaks
    ellipse(ctx, x + 7.2 * k, y - 11 * k, 3 * k, 2.8 * k, shade(body, 0.05));
    line(ctx, x + 9 * k, y - 10.8 * k, x + 17 * k, y - 5.6 * k, '#e8d9a8', 1.3 * k);
    line(ctx, x + 9 * k, y - 11.4 * k, x + 16.6 * k, y - 6.4 * k, '#fff6d0', 0.4 * k);
    ellipse(ctx, x + 8 * k, y - 11.8 * k, 0.7 * k, 0.7 * k, '#101010');
    return;
  }
  if (spec.feature === 'lion') return persiaLion(ctx, x, y, k, body);
  if (spec.feature === 'llama') return drawWildLlama(ctx, x, y, k, body);
  if (spec.feature === 'kangaroo') return aboKangaroo(ctx, x, y, 0.9 * k, body);
  if (spec.feature === 'ibex') {
    // a walia ibex of the Simien highlands: a stocky chestnut body, pale belly, a shaggy neck and great ridged scimitar horns
    const dk = '#3a2418';
    for (const lx of [-5.6, -2.4, 3.4, 6.4]) {
      box(ctx, x + lx * k, y + (lx > 0 ? 0.5 : -0.5) * k, 2.2 * k, 6.4 * k, shade(body, -0.35));
      faceQuad(ctx, 'R', x + lx * k, y + (lx > 0 ? 0.5 : -0.5) * k, 2.2 * k, 6.4 * k, 0, 1, 0.3, 0.5, '#e8dcc6'); // pale lower legs
      box(ctx, x + lx * k, y + (lx > 0 ? 0.5 : -0.5) * k, 2.3 * k, 1.2 * k, dk);
    }
    poly(ctx, [x - 8 * k, y - 8 * k, x - 10.4 * k, y - 4.6 * k, x - 8 * k, y - 5.4 * k], dk); // short tail
    box(ctx, x, y - 5 * k, 16 * k, 7.4 * k, body);
    band(ctx, x, y - 5 * k, 16 * k, 7.4 * k, 0, 0.26, '#efe4cc'); // white belly
    faceQuad(ctx, 'R', x, y - 5 * k, 16 * k, 7.4 * k, 0.5, 0.96, 0.3, 0.9, shade(body, 0.1)); // shoulder
    faceQuad(ctx, 'R', x, y - 5 * k, 16 * k, 7.4 * k, 0.04, 0.5, 0.86, 1, dk); // a dark saddle stripe down the back
    faceQuad(ctx, 'L', x, y - 5 * k, 16 * k, 7.4 * k, 0, 1, 0.86, 1, dk);
    box(ctx, x + 7.6 * k, y - 8 * k, 5.6 * k, 7.4 * k, shade(body, -0.05)); // the thick neck
    for (const dy of [-13.6, -11.4, -9.2]) poly(ctx, [x + 5.4 * k, y + dy * k, x + 4 * k, y + (dy + 1.6) * k, x + 6 * k, y + (dy + 2.2) * k], dk); // a shaggy mane
    box(ctx, x + 11.4 * k, y - 10.2 * k, 6.8 * k, 6.2 * k, '#b07a52'); // the head, paler than the body
    faceQuad(ctx, 'R', x + 11.4 * k, y - 10.2 * k, 6.8 * k, 6.2 * k, 0.05, 0.4, 0.05, 0.5, '#efe4cc'); // white cheek patch
    box(ctx, x + 14.8 * k, y - 9.6 * k, 3 * k, 3.4 * k, '#d8b898'); // muzzle
    faceQuad(ctx, 'R', x + 14.8 * k, y - 9.6 * k, 3 * k, 3.4 * k, 0.4, 0.7, 0.35, 0.6, dk);
    faceQuad(ctx, 'R', x + 11.4 * k, y - 10.2 * k, 6.8 * k, 6.2 * k, 0.5, 0.68, 0.5, 0.78, '#101010'); // eye
    faceQuad(ctx, 'R', x + 11.4 * k, y - 10.2 * k, 6.8 * k, 6.2 * k, 0.55, 0.61, 0.68, 0.76, '#ffffff');
    poly(ctx, [x + 15 * k, y - 6.4 * k, x + 15.6 * k, y - 3.6 * k, x + 14 * k, y - 5.4 * k], dk); // beard
    poly(ctx, [x + 11.6 * k, y - 15.6 * k, x + 10.4 * k, y - 18 * k, x + 13 * k, y - 16 * k], shade(body, -0.2)); // ear
    // the horns sweep up and far back over the shoulders, ringed with growth ridges
    const hb = { x: x + 12.4 * k, y: y - 16 * k };
    ctx.lineCap = 'round';
    for (const [c, w, dx] of [[shade('#d9c9a0', -0.3), 3.6, 0], [shade('#e8dab4', 0.1), 1.5, -0.6]] as const) {
      ctx.strokeStyle = c;
      ctx.lineWidth = w * k;
      ctx.beginPath();
      ctx.moveTo(hb.x + dx * k, hb.y);
      ctx.bezierCurveTo(hb.x - 1 * k, hb.y - 9 * k, hb.x - 8 * k, hb.y - 12 * k, hb.x - 15 * k, hb.y - 3 * k);
      ctx.stroke();
    }
    for (const t of [0.14, 0.28, 0.42, 0.56, 0.7]) { // growth rings along the horn
      const u = 1 - t;
      const px = u * u * u * hb.x + 3 * u * u * t * (hb.x - 1 * k) + 3 * u * t * t * (hb.x - 8 * k) + t * t * t * (hb.x - 15 * k);
      const py = u * u * u * hb.y + 3 * u * u * t * (hb.y - 9 * k) + 3 * u * t * t * (hb.y - 12 * k) + t * t * t * (hb.y - 3 * k);
      line(ctx, px - 1.2 * k, py - 0.6 * k, px + 1.2 * k, py + 0.6 * k, '#6a5a3a', 0.5 * k);
    }
    return;
  }
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

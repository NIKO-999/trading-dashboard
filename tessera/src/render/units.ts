// Voxel-style unit figures: chunky big-headed people whose outfit, headgear and weapons
// come from their empire, and whose silhouette comes from their class.
import { TRIBES } from '../data/tribes';
import { UNITS } from '../data/units';
import type { TribeId, UnitKind } from '../game/types';
import { band, box, drawStar, ellipse, faceQuad, line, poly, shade, softShadow, type Ctx } from './prims';

interface Look { skin: string; hair: string }
const LOOK: Record<TribeId, Look> = {
  egypt: { skin: '#c98d55', hair: '#1d1a17' },
  aztec: { skin: '#b8743f', hair: '#1a1410' },
  polynesia: { skin: '#a5673a', hair: '#1b130d' },
  rome: { skin: '#e8bf93', hair: '#4a3222' },
  pirates: { skin: '#e5b387', hair: '#3b2616' },
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
function figure(ctx: Ctx, kind: UnitKind, tribe: TribeId, x: number, y: number, k: number, seated = false): Body {
  const L = LOOK[tribe];
  const T = TRIBES[tribe];
  const armoured = kind === 'swordsman' || kind === 'knight' || kind === 'giant' || kind === 'legionary';
  let torso = T.color, legs = shade(T.colorDark, 0.1), sleeves = L.skin;
  switch (tribe) {
    case 'egypt': torso = L.skin; legs = L.skin; break;
    case 'aztec': torso = kind === 'jaguar' ? '#e3a53a' : '#efe6d2'; legs = kind === 'jaguar' ? '#e3a53a' : L.skin; sleeves = kind === 'jaguar' ? '#e3a53a' : L.skin; break;
    case 'polynesia': torso = L.skin; legs = L.skin; break;
    case 'rome': torso = '#b3302a'; legs = L.skin; break;
    case 'pirates': torso = '#f1efe6'; legs = '#3b3b46'; sleeves = '#f1efe6'; break;
  }

  // Legs (hidden when riding).
  const hip = seated ? y : y - 5 * k;
  if (!seated) {
    box(ctx, x - 2.2 * k, y - 0.3 * k, 3.6 * k, 5.2 * k, legs);
    box(ctx, x + 2.2 * k, y + 0.7 * k, 3.6 * k, 5.2 * k, legs);
    const shoe = tribe === 'pirates' ? DARK : '#6b4424';
    faceQuad(ctx, 'L', x - 2.2 * k, y - 0.3 * k, 3.6 * k, 5.2 * k, 0, 1, 0, tribe === 'pirates' ? 0.45 : 0.2, shoe);
    faceQuad(ctx, 'R', x + 2.2 * k, y + 0.7 * k, 3.6 * k, 5.2 * k, 0, 1, 0, tribe === 'pirates' ? 0.45 : 0.2, shoe);
    faceQuad(ctx, 'L', x + 2.2 * k, y + 0.7 * k, 3.6 * k, 5.2 * k, 0, 1, 0, tribe === 'pirates' ? 0.45 : 0.2, shoe);
  }

  // Back arm, torso, front arm.
  const tw = 10 * k, th = 8.5 * k;
  box(ctx, x - 5.9 * k, hip - 1 * k, 2.8 * k, 7 * k, sleeves);
  box(ctx, x - 5.9 * k, hip + 0.9 * k, 2.4 * k, 2 * k, L.skin);
  box(ctx, x, hip, tw, th, torso);
  dressTorso(ctx, tribe, kind, x, hip, tw, th, armoured);
  box(ctx, x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, sleeves);
  box(ctx, x + 6 * k, hip + 2.5 * k, 2.4 * k, 2 * k, L.skin);
  if (tribe === 'polynesia') faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.55, 0.75, '#2a1a10');
  if (tribe === 'egypt') faceQuad(ctx, 'R', x + 6 * k, hip + 0.6 * k, 2.8 * k, 7 * k, 0, 1, 0.62, 0.78, GOLD);
  if (tribe === 'rome' || armoured) box(ctx, x + 6 * k, hip - 5 * k, 3.4 * k, 2.2 * k, tribe === 'egypt' ? BRONZE : STEEL);

  // Head.
  const hy = hip - th;
  const hw = 11 * k, hh = 10.5 * k;
  box(ctx, x, hy, hw, hh, L.skin, L.hair);
  drawFace(ctx, tribe, kind, x, hy, hw, hh);
  const top = hy - hh;
  drawHeadgear(ctx, tribe, kind, x, top, k, hw);
  return { hand: { x: x + 6.3 * k, y: hip - 5.2 * k }, off: { x: x - 4 * k, y: hip + 1 * k }, top };
}

function dressTorso(ctx: Ctx, tribe: TribeId, kind: UnitKind, x: number, y: number, w: number, h: number, armoured: boolean) {
  switch (tribe) {
    case 'egypt':
      band(ctx, x, y, w, h, 0, 0.42, '#f4efe0'); // linen kilt
      band(ctx, x, y, w, h, 0.38, 0.48, GOLD); // belt
      if (armoured) band(ctx, x, y, w, h, 0.5, 0.75, BRONZE);
      band(ctx, x, y, w, h, 0.76, 1, GOLD); // broad collar
      band(ctx, x, y, w, h, 0.84, 0.9, '#2b5fb8');
      break;
    case 'aztec':
      if (kind === 'jaguar') {
        for (let i = 0; i < 6; i++) faceQuad(ctx, i % 2 ? 'R' : 'L', x, y, w, h, 0.15 + (i % 3) * 0.28, 0.27 + (i % 3) * 0.28, 0.2 + (i % 2) * 0.4, 0.32 + (i % 2) * 0.4, '#3a2410');
      } else {
        band(ctx, x, y, w, h, 0, 0.28, '#c8372d'); // loincloth
        band(ctx, x, y, w, h, 0.5, 0.62, '#1faa9b'); // woven turquoise band
        faceQuad(ctx, 'R', x, y, w, h, 0.2, 0.4, 0.66, 0.9, '#c8372d');
        faceQuad(ctx, 'R', x, y, w, h, 0.6, 0.8, 0.66, 0.9, '#c8372d');
        if (armoured) band(ctx, x, y, w, h, 0.3, 0.48, GOLD);
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
      break;
  }
}

function drawFace(ctx: Ctx, tribe: TribeId, kind: UnitKind, x: number, y: number, w: number, h: number) {
  // Eyes on the right-hand (viewer-facing) side.
  for (const u of [0.22, 0.62]) {
    faceQuad(ctx, 'R', x, y, w, h, u, u + 0.2, 0.42, 0.64, '#ffffff');
    faceQuad(ctx, 'R', x, y, w, h, u + 0.07, u + 0.17, 0.44, 0.6, '#101010');
    faceQuad(ctx, 'R', x, y, w, h, u + 0.08, u + 0.11, 0.54, 0.59, '#ffffff');
  }
  switch (tribe) {
    case 'egypt':
      faceQuad(ctx, 'R', x, y, w, h, 0.18, 0.86, 0.62, 0.67, '#101010'); // kohl line
      break;
    case 'aztec':
      if (kind !== 'jaguar') faceQuad(ctx, 'R', x, y, w, h, 0.1, 0.95, 0.3, 0.38, '#1a1a1a'); // face paint
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
        break;
      }
      // striped royal headcloth with lappets over the ears
      box(ctx, x, top + 3.4 * k, hw + 1.4 * k, 4.4 * k, GOLD, '#f6d86a');
      for (const u of [0.1, 0.4, 0.7]) faceQuad(ctx, 'R', x, top + 3.4 * k, hw + 1.4 * k, 4.4 * k, u, u + 0.14, 0, 1, '#2b5fb8');
      for (const u of [0.15, 0.45, 0.75]) faceQuad(ctx, 'L', x, top + 3.4 * k, hw + 1.4 * k, 4.4 * k, u, u + 0.14, 0, 1, '#2b5fb8');
      faceQuad(ctx, 'L', x, top + 10.5 * k, hw + 1.4 * k, 10 * k, 0, 0.32, 0.25, 0.72, GOLD);
      faceQuad(ctx, 'L', x, top + 10.5 * k, hw + 1.4 * k, 10 * k, 0.1, 0.2, 0.25, 0.72, '#2b5fb8');
      ellipse(ctx, x + 1 * k, top - 1.5 * k, 1.5 * k, 1.5 * k, '#2b5fb8');
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
        if (kind === 'giant' || kind === 'knight') poly(ctx, [x + 3 * k, top - 1 * k, x + 9 * k, top - 9 * k, x + 5 * k, top - 0.5 * k], '#d6453b');
      } else {
        box(ctx, x, top + 2.4 * k, hw + 0.6 * k, 2.6 * k, '#c8372d');
        faceQuad(ctx, 'L', x, top + 2.4 * k, hw + 0.6 * k, 2.6 * k, 0.2, 0.3, 0, 1, '#ffffff');
        poly(ctx, [x - 5.5 * k, top + 2 * k, x - 9 * k, top + 6 * k, x - 7 * k, top + 6.5 * k], '#c8372d');
      }
      break;
    }
  }
  if (kind === 'giant') drawStar(ctx, x, top - (tribe === 'egypt' ? 14 : 8) * k, 2.4 * k);
}

function drawFootUnit(ctx: Ctx, kind: UnitKind, tribe: TribeId, x: number, y: number, k: number) {
  // Things carried on the back go first.
  if (kind === 'archer' || kind === 'explorer') box(ctx, x - 4.5 * k, y - 8 * k, 4 * k, 8 * k, kind === 'explorer' ? '#8a5a2b' : '#6b4424');
  const shieldFirst = kind === 'defender' || kind === 'legionary' || kind === 'jaguar';
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
      meleeWeapon(ctx, tribe, kind, x, y, k);
      break;
    case 'swordsman':
      line(ctx, x, y + 1 * k, x + 3 * k, y - 14 * k, tribe === 'egypt' ? BRONZE : STEEL, 2.4 * k);
      line(ctx, x - 2.4 * k, y - 0.5 * k, x + 2.4 * k, y + 0.4 * k, WOOD, 1.8 * k);
      break;
    case 'archer': {
      ctx.strokeStyle = tribe === 'egypt' ? '#5a3b1e' : '#8a5a2b';
      ctx.lineWidth = 1.9 * k;
      ctx.beginPath();
      ctx.arc(x + 1 * k, y - 3 * k, 9 * k, -1.15, 1.15);
      ctx.stroke();
      line(ctx, x + 1 * k + Math.cos(-1.15) * 9 * k, y - 3 * k + Math.sin(-1.15) * 9 * k, x + 1 * k + Math.cos(1.15) * 9 * k, y - 3 * k + Math.sin(1.15) * 9 * k, '#f4efe0', 0.7);
      line(ctx, x - 4 * k, y - 3 * k, x + 8 * k, y - 3 * k, '#6b4424', 1.1 * k);
      poly(ctx, [x + 8 * k, y - 4.6 * k, x + 10.5 * k, y - 3 * k, x + 8 * k, y - 1.4 * k], STEEL);
      break;
    }
    case 'buccaneer':
      line(ctx, x - 5 * k, y + 2 * k, x + 11 * k, y - 6 * k, '#4a3322', 2.6 * k);
      line(ctx, x + 3 * k, y - 2 * k, x + 13 * k, y - 7 * k, '#3a3a40', 1.6 * k);
      ellipse(ctx, x + 13 * k, y - 7 * k, 1.1 * k, 1.1 * k, '#1a1a1a');
      break;
    case 'defender':
      line(ctx, x + 1 * k, y + 5 * k, x + 2 * k, y - 18 * k, WOOD, 1.7 * k);
      poly(ctx, [x + 2 * k, y - 22 * k, x + 0.4 * k, y - 17 * k, x + 3.6 * k, y - 17 * k], tribe === 'egypt' ? BRONZE : STEEL);
      break;
    case 'explorer':
      line(ctx, x + 1 * k, y + 6 * k, x + 2.5 * k, y - 12 * k, '#8a5a2b', 1.6 * k);
      break;
  }
}

function meleeWeapon(ctx: Ctx, tribe: TribeId, kind: UnitKind, x: number, y: number, k: number) {
  switch (tribe) {
    case 'egypt': {
      // sickle-sword
      line(ctx, x, y + 1 * k, x + 1 * k, y - 5 * k, WOOD, 1.8 * k);
      ctx.strokeStyle = BRONZE;
      ctx.lineWidth = 2.4 * k;
      ctx.beginPath();
      ctx.moveTo(x + 1 * k, y - 5 * k);
      ctx.quadraticCurveTo(x + 2 * k, y - 13 * k, x + 7 * k, y - 12 * k);
      ctx.stroke();
      break;
    }
    case 'aztec': {
      // flat wooden club edged with dark stone blades
      poly(ctx, [x - 1 * k, y + 2 * k, x + 1.2 * k, y + 2 * k, x + 3.5 * k, y - 14 * k, x + 0.5 * k, y - 14 * k], '#8a5a2b');
      for (let i = 0; i < 4; i++) {
        const py = y - 3 * k - i * 3 * k;
        poly(ctx, [x + 2.5 * k + i * 0.3 * k, py, x + 4.6 * k + i * 0.3 * k, py - 1 * k, x + 2.7 * k + i * 0.3 * k, py - 2 * k], '#1a1a22');
      }
      break;
    }
    case 'polynesia': {
      // paddle club set with shark teeth
      line(ctx, x, y + 2 * k, x + 1.5 * k, y - 4 * k, '#6b4424', 1.8 * k);
      poly(ctx, [x + 1.5 * k, y - 4 * k, x - 1.5 * k, y - 10 * k, x + 2 * k, y - 16 * k, x + 5 * k, y - 10 * k], '#8a5a2b');
      for (let i = 0; i < 3; i++) poly(ctx, [x + 4.2 * k - i * 0.6 * k, y - 8 * k - i * 2.5 * k, x + 6 * k - i * 0.6 * k, y - 9 * k - i * 2.5 * k, x + 4.4 * k - i * 0.6 * k, y - 10 * k - i * 2.5 * k], '#f4efe0');
      break;
    }
    case 'rome':
      line(ctx, x, y + 1 * k, x + 2.5 * k, y - 10 * k, STEEL, 2.4 * k);
      line(ctx, x - 1.8 * k, y - 0.4 * k, x + 2 * k, y + 0.4 * k, BRONZE, 1.6 * k);
      break;
    case 'pirates': {
      line(ctx, x - 1.5 * k, y, x + 1.8 * k, y + 1 * k, GOLD, 1.6 * k);
      ctx.strokeStyle = STEEL;
      ctx.lineWidth = 2.4 * k;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 1 * k, y - 8 * k, x + 6 * k, y - 12 * k);
      ctx.stroke();
      break;
    }
  }
  void kind;
}

function drawShield(ctx: Ctx, tribe: TribeId, kind: UnitKind, x: number, y: number, k: number) {
  const T = TRIBES[tribe];
  switch (tribe) {
    case 'rome': {
      // tall curved rectangular shield with a boss
      box(ctx, x, y, 3 * k, 13 * k, '#b3302a', GOLD);
      faceQuad(ctx, 'R', x, y, 3 * k, 13 * k, 0, 1, 0.9, 1, GOLD);
      faceQuad(ctx, 'R', x, y, 3 * k, 13 * k, 0, 1, 0, 0.08, GOLD);
      faceQuad(ctx, 'L', x, y, 3 * k, 13 * k, 0, 1, 0, 1, '#b3302a');
      faceQuad(ctx, 'L', x, y, 3 * k, 13 * k, 0.3, 0.7, 0.45, 0.6, GOLD);
      break;
    }
    case 'aztec': {
      ellipse(ctx, x - 1 * k, y - 6 * k, 5.2 * k, 6 * k, '#efe6d2');
      ellipse(ctx, x - 1 * k, y - 6 * k, 3.6 * k, 4.3 * k, T.color);
      for (let i = 0; i < 5; i++) poly(ctx, [x - 4 * k + i * 1.6 * k, y - 0.5 * k, x - 3.4 * k + i * 1.6 * k, y + 3 * k, x - 2.6 * k + i * 1.6 * k, y - 0.5 * k], ['#1faa6b', '#d6453b', GOLD][i % 3]);
      break;
    }
    case 'egypt': {
      poly(ctx, [x - 4.5 * k, y + 1 * k, x - 4.5 * k, y - 9 * k, x - 1 * k, y - 13 * k, x + 2.5 * k, y - 9 * k, x + 2.5 * k, y + 3 * k], '#f4efe0');
      ellipse(ctx, x - 2 * k, y - 6 * k, 1.4 * k, 1.8 * k, '#6b4424');
      ellipse(ctx, x, y - 2 * k, 1.2 * k, 1.5 * k, '#6b4424');
      break;
    }
    case 'polynesia':
      poly(ctx, [x - 4 * k, y + 1 * k, x - 3.5 * k, y - 11 * k, x + 2 * k, y - 12 * k, x + 2.5 * k, y + 2.5 * k], '#8a5a2b');
      for (const v of [2, 5, 8]) line(ctx, x - 3.5 * k, y - v * k, x + 2 * k, y - v * k - 0.6 * k, '#2a1a10', 0.9 * k);
      break;
    case 'pirates':
      ellipse(ctx, x - 1 * k, y - 5 * k, 4.8 * k, 5.4 * k, '#5a4a3a');
      ellipse(ctx, x - 1 * k, y - 5 * k, 1.4 * k, 1.4 * k, STEEL);
      break;
  }
  void kind;
}

// ---------------------------------------------------------------- mounts & machines

/** A voxel horse (also used for chariots). Returns the saddle point. */
export function drawHorse(ctx: Ctx, x: number, y: number, k: number, coat: string, mane: string, cloth?: string) {
  const leg = shade(coat, -0.25);
  for (const [lx, ly] of [[-6, -1.5], [-3, 0.5], [4, -0.5], [7, 1.5]]) box(ctx, x + lx * k, y + ly * k, 2.2 * k, 7 * k, leg);
  poly(ctx, [x - 9 * k, y - 11 * k, x - 12 * k, y - 4 * k, x - 10 * k, y - 4 * k], mane); // tail
  box(ctx, x, y - 6 * k, 17 * k, 7 * k, coat);
  if (cloth) {
    band(ctx, x, y - 6 * k, 17 * k, 7 * k, 0, 0.7, cloth);
    band(ctx, x, y - 6 * k, 17 * k, 7 * k, 0, 0.12, GOLD);
  }
  box(ctx, x + 7.5 * k, y - 10 * k, 5 * k, 7 * k, coat); // neck
  box(ctx, x + 10.5 * k, y - 15 * k, 7 * k, 5 * k, coat); // head
  faceQuad(ctx, 'R', x + 10.5 * k, y - 15 * k, 7 * k, 5 * k, 0.45, 0.62, 0.45, 0.75, '#101010');
  box(ctx, x + 7 * k, y - 17 * k, 3 * k, 6 * k, mane); // mane
  box(ctx, x + 9 * k, y - 20 * k, 1.6 * k, 2.4 * k, coat); // ear
  return { x: x - 1 * k, y: y - 13 * k };
}

function drawRider(ctx: Ctx, kind: UnitKind, tribe: TribeId, x: number, y: number) {
  const knight = kind === 'knight';
  const T = TRIBES[tribe];
  const saddle = drawHorse(ctx, x - 1, y + 3, 0.95, knight ? '#eeeeee' : tribe === 'pirates' ? '#3a2a22' : '#8a5a33', knight ? '#9aa3ad' : '#2a1a10', knight ? T.color : undefined);
  const b = figure(ctx, kind, tribe, saddle.x, saddle.y, 0.9, true);
  // lance with a pennant
  const { x: hx, y: hy } = b.hand;
  line(ctx, hx - 3, hy + 6, hx + 8, hy - 20, WOOD, knight ? 2 : 1.6);
  if (knight) poly(ctx, [hx + 6.5, hy - 16, hx + 12, hy - 15, hx + 7.4, hy - 13], T.color);
  else poly(ctx, [hx + 8, hy - 23, hx + 6.6, hy - 18.5, hx + 9.6, hy - 18], STEEL);
}

function drawChariot(ctx: Ctx, tribe: TribeId, x: number, y: number) {
  drawHorse(ctx, x + 9, y + 4, 0.8, '#efe6d2', '#c9974a');
  line(ctx, x - 2, y - 4, x + 9, y - 3, WOOD, 1.6);
  box(ctx, x - 4, y - 1, 12, 7, '#c9974a', '#8a5a2b');
  const b = figure(ctx, 'archer', tribe, x - 4, y - 8, 0.85, true);
  drawWeapon(ctx, 'archer', tribe, b, 0.85);
  // spoked wheel on the near side
  ctx.strokeStyle = '#6b4424';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x - 7, y - 1, 4.2, 5.6, 0, 0, Math.PI * 2);
  ctx.stroke();
  line(ctx, x - 7, y - 6.6, x - 7, y + 4.6, '#6b4424', 1);
  line(ctx, x - 11.2, y - 1, x - 2.8, y - 1, '#6b4424', 1);
}

/** Each empire fields its own siege engine. */
function drawCatapult(ctx: Ctx, tribe: TribeId, x: number, y: number) {
  const T = TRIBES[tribe];
  const wheels = (hub: string) => {
    for (const [wx, wy] of [[-7, 1], [6, 3]]) {
      ellipse(ctx, x + wx, y + wy, 3.4, 3.8, '#5a3b1e');
      ellipse(ctx, x + wx, y + wy, 1.2, 1.4, hub);
    }
  };
  const flag = (fx: number, fy: number, color: string) => {
    line(ctx, fx, fy, fx, fy - 15, '#5a3b1e', 1.4);
    poly(ctx, [fx, fy - 15, fx + 7, fy - 13, fx, fy - 10], color);
  };
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
      break;
    }
    case 'rome':
    default: {
      // heavy red-painted onager with bronze fittings
      box(ctx, x, y - 2, 18, 4, '#8a5a2b');
      faceQuadLine(ctx, x - 9, y - 4, x + 9, y - 4);
      wheels(BRONZE);
      box(ctx, x - 3, y - 6, 3, 8, '#b3302a');
      box(ctx, x + 3, y - 4.5, 3, 8, '#b3302a');
      line(ctx, x - 2, y - 11, x + 11, y - 26, '#6b4424', 3);
      ellipse(ctx, x + 11.5, y - 27, 4.2, 3, '#8a5a2b');
      ellipse(ctx, x + 11.5, y - 29, 2.8, 2.6, '#8a8a90');
      flag(x - 8, y - 5, T.color);
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
    poly(ctx, [x - 2, y - 6, x - 12, y - 34, x + 1, y - 26, x + 10, y - 35, x + 3, y - 6], T.color);
    poly(ctx, [x - 2, y - 6, x - 7, y - 25, x + 1, y - 22, x + 5, y - 26, x + 3, y - 6], shade(T.color, 0.25));
    figure(ctx, 'warrior', tribe, x + 8, y - 5, 0.55, true);
    return;
  }
  const hull = tribe === 'pirates' ? '#3b2a1e' : tribe === 'egypt' ? '#c9b36a' : '#8a5a2b';
  const w = 19 * s;
  if (tribe === 'egypt') {
    // papyrus boat with curled ends
    poly(ctx, [x - w, y - 12, x - w + 4, y - 5, x + w - 4, y - 5, x + w, y - 12, x + w * 0.7, y + 3, x - w * 0.7, y + 3], hull);
    for (let i = -2; i <= 2; i++) line(ctx, x + i * 6, y - 4, x + i * 6 - 1, y + 2, shade(hull, -0.2), 0.8);
  } else {
    poly(ctx, [x - w, y - 5, x + w + 3, y - 6, x + w * 0.72, y + 3, x - w * 0.7, y + 3], hull);
    poly(ctx, [x - w, y - 5, x + w + 3, y - 6, x + w * 0.9, y - 8.5, x - w * 0.9, y - 8], shade(hull, 0.25));
  }
  if (tier >= 1 || tribe === 'rome') for (let i = 0; i < 4 + tier * 2; i++) line(ctx, x - w * 0.6 + i * 5, y - 1, x - w * 0.6 + i * 5 - 3, y + 6, '#6b4424', 1.1); // oars
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
  poly(ctx, [x, top - 2, x + 9, top, x, top + 2], T.color); // pennant
  if (tier === 2 && tribe === 'pirates') for (const ox of [-10, -3, 4, 11]) ellipse(ctx, x + ox, y - 2, 1.6, 1.6, '#111');
  figure(ctx, 'warrior', tribe, x - 9, y - 6, 0.5, true);
}

// ---------------------------------------------------------------- wildlife (map resources)

const CRITTER: Record<TribeId, { body: string; feature: 'hump' | 'antlers' | 'snout' | 'horns' | 'tusks' }> = {
  egypt: { body: '#d0a45e', feature: 'hump' },
  aztec: { body: '#9c6236', feature: 'antlers' },
  polynesia: { body: '#e99aa2', feature: 'snout' },
  rome: { body: '#34343b', feature: 'horns' },
  pirates: { body: '#5a4235', feature: 'tusks' },
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
    case 'hump':
      break;
  }
}

// England: billmen and men-at-arms in white tabards with the red cross of St George over mail, under kettle hats,
// bascinets and sallets; archers in russet and Lincoln green with hoods and tall yew longbows, quivers of white-fletched
// arrows; knights in plate on horses caparisoned in red and gold; heater shields with the three gold lions passant of the
// royal arms; Tudor doublets and flat caps for the officers, and a crowned king for the giant. A hooped iron bombard; a
// cog, a carrack and a tall race-built galleon flying the St George cross. Half-timbered Tudor houses, thatched cottages,
// a Perpendicular parish church, and for the capital a square white keep with four onion-capped corner turrets. Oaks,
// hawthorn hedgerows and apple orchards.
import { registerArt, type Body } from '../tribeart';
import { drawHorse, figure } from '../units';
import type { BiomePalette } from '../../data/tribes';
import type { UnitKind } from '../../game/types';
import { band, box, ellipse, faceQuad, ink, line, mix, poly, rand, shade, type Ctx } from '../prims';

const RED = '#c4202a';
const RED_L = '#e04048';
const RED_D = '#7a1018';
const WHITE = '#f4f1e8';
const WHITE_D = '#d4d0c4';
const GOLD = '#e8b830';
const GOLD_L = '#fadc78';
const GOLD_D = '#9a7018';
const STEEL = '#c4cad2';
const STEEL_L = '#eef2f6';
const STEEL_D = '#6a727c';
const MAIL = '#8a929c';
const MAIL_D = '#5a626c';
const GREEN = '#3e6e2c';
const GREEN_L = '#5a8e3a';
const GREEN_D = '#26461a';
const RUSSET = '#8a4a24';
const RUSSET_D = '#5a2e16';
const JACK = '#cdb88a';
const BLACK = '#1e1a1c';
const WOOD = '#7a5230';
const WOOD_D = '#4a3018';
const YEW_D = '#8a5a28';
const IRON = '#5a5e68';
const IRON_L = '#7a7e88';
const PLASTER = '#f2ecdc';
const BEAM = '#2a2220';
const THATCH = '#c8a45a';
const THATCH_D = '#94743a';
const STONE = '#b8b2a4';
const STONE_L = '#e8e2d2';
const LEAD = '#6a7480';
const HAIR = '#5a3a1e';
const GINGER = '#b0602a';

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

/** A rounded dome (a helmet bowl): the rim is the ellipse at (x, y), the crown rises `h` above it. */
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

const clipPoly = (ctx: Ctx, pts: number[]) => {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.clip();
};

/** One lion passant guardant, walking to the left, drawn as a few simple shapes (s = its length / 6). */
function lionPassant(ctx: Ctx, cx: number, cy: number, s: number, c: string) {
  ellipse(ctx, cx, cy, 2.2 * s, 0.85 * s, c); // body
  ellipse(ctx, cx - 2.4 * s, cy - 0.5 * s, 0.95 * s, 0.95 * s, c); // head, facing out
  ellipse(ctx, cx - 1.6 * s, cy - 0.2 * s, 0.9 * s, 1 * s, c); // the mane
  for (const [lx, d] of [[-1.5, -0.5], [-0.8, 0.3], [1, -0.4], [1.7, 0.3]] as const) line(ctx, cx + lx * s, cy + 0.4 * s, cx + (lx + d) * s, cy + 1.6 * s, c, 0.5 * s); // legs
  curve(ctx, cx + 2 * s, cy - 0.2 * s, cx + 3.2 * s, cy - 0.4 * s, cx + 2.6 * s, cy - 1.8 * s, 0.4 * s, c); // tail curled over the back
  ellipse(ctx, cx + 2.5 * s, cy - 1.9 * s, 0.4 * s, 0.4 * s, c);
}

/** The royal arms: three gold lions passant one above another on red, inside the caller's clip. */
function threeLions(ctx: Ctx, cx: number, cy: number, h: number) {
  const s = h * 0.085;
  for (const [i, w] of [[-1, 1], [0, 0.92], [1, 0.8]] as const) lionPassant(ctx, cx + 0.2 * s, cy + i * h * 0.29, s * w, GOLD);
}

/** The St George's flag: white with a red cross, streaming from (x, y) on the staff. */
function stGeorge(ctx: Ctx, x: number, y: number, w: number, h: number, wave = 0, tail = false) {
  const pts = tail
    ? [x, y, x + w * 0.5, y + 0.6 + wave, x + w * 1.6, y + h * 0.35 + wave * 0.6, x + w * 1.55, y + h * 0.55 + wave * 0.6, x + w * 0.5, y + h + 0.4 - wave, x, y + h]
    : [x, y, x + w * 0.5, y + 0.6 + wave, x + w, y + 0.2, x + w, y + h - 0.2, x + w * 0.5, y + h + 0.4 - wave, x, y + h];
  poly(ctx, pts, WHITE);
  ctx.save();
  clipPoly(ctx, pts);
  poly(ctx, [x, y + h * 0.4, x + w * 2, y + h * 0.4 + wave * 0.4, x + w * 2, y + h * 0.62 + wave * 0.4, x, y + h * 0.62], RED);
  poly(ctx, [x + w * 0.4, y - 2, x + w * 0.58, y - 2, x + w * 0.58, y + h + 2, x + w * 0.4, y + h + 2], RED);
  poly(ctx, [x + w * 0.5, y + 0.6 + wave, x + w, y + 0.2, x + w, y + h, x + w * 0.5, y + h], 'rgba(0,0,0,0.08)');
  ctx.restore();
}

/** The royal banner: the three lions on red. */
function royalBanner(ctx: Ctx, x: number, y: number, w: number, h: number, wave = 0) {
  const pts = [x, y, x + w * 0.5, y + 0.6 + wave, x + w, y + 0.2, x + w, y + h - 0.2, x + w * 0.5, y + h + 0.4 - wave, x, y + h];
  poly(ctx, pts, RED);
  ctx.save();
  clipPoly(ctx, pts);
  threeLions(ctx, x + w * 0.5, y + h * 0.5, h * 0.9);
  poly(ctx, [x + w * 0.5, y + 0.6 + wave, x + w, y + 0.2, x + w, y + h, x + w * 0.5, y + h], 'rgba(0,0,0,0.12)');
  ctx.restore();
}

// ---------------------------------------------------------------- dress

const TABARD = (k: UnitKind) => k === 'warrior' || k === 'defender' || k === 'swordsman';

function dress(kind: UnitKind): [string, string, string] | null {
  switch (kind) {
    case 'warrior': return [WHITE, '#5a4a3a', MAIL];
    case 'defender': return [WHITE, MAIL, MAIL];
    case 'swordsman': return [WHITE, STEEL_D, STEEL];
    case 'archer': return [GREEN, RUSSET, RUSSET];
    case 'longbowman': return [JACK, RUSSET, JACK];
    case 'rider': case 'knight': return [STEEL, STEEL_D, STEEL];
    case 'explorer': return [BLACK, '#2a2228', RED];
    case 'giant': return [RED, BLACK, RED];
    default: return [WHITE, '#5a4a3a', MAIL];
  }
}

/** A mail skirt hanging below the tabard. */
function mailSkirt(ctx: Ctx, x: number, y: number, w: number, h: number, metal = MAIL) {
  const k = w / 10;
  for (const f of ['L', 'R'] as const) {
    faceQuad(ctx, f, x, y + 2.6 * k, w * 1.06, 3 * k, 0, 1, 0, 1, metal);
    for (let i = 0; i < 3; i++) faceQuad(ctx, f, x, y + 2.6 * k, w * 1.06, 3 * k, 0, 1, 0.2 + i * 0.28, 0.28 + i * 0.28, shade(metal, -0.25)); // rows of rings
  }
  void h;
}

function torso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const L = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'L', x, y, w, h, u0, u1, v0, v1, c);
  const B = (v0: number, v1: number, c: string) => band(ctx, x, y, w, h, v0, v1, c);
  if (TABARD(kind)) {
    // mail at the shoulders and below the hem; a white tabard over it with the red cross of St George
    mailSkirt(ctx, x, y, w, h, kind === 'swordsman' ? STEEL : MAIL);
    B(0.86, 1, kind === 'swordsman' ? STEEL : MAIL); // the mail (or plate gorget) at the neck
    R(0.4, 0.6, 0, 0.86, RED); // the cross, upright...
    R(0, 1, 0.48, 0.64, RED); // ...and across
    L(0.38, 0.62, 0, 0.86, RED); // the same cross on the side
    R(0, 0.04, 0, 0.86, WHITE_D); // the tabard's open side edge
    B(0.1, 0.16, RUSSET_D); // the sword belt
    R(0.62, 0.72, 0.08, 0.18, GOLD); // its buckle
    if (kind === 'swordsman') for (const u of [0.1, 0.88]) R(u - 0.04, u + 0.04, 0.72, 0.78, GOLD_L); // gilt rivets of a brigandine
    return;
  }
  switch (kind) {
    case 'archer': // a Lincoln-green jerkin laced at the front, a russet belt with a purse and an arming dagger
      R(0.46, 0.54, 0.16, 1, GREEN_D);
      for (let i = 0; i < 4; i++) R(0.42, 0.58, 0.3 + i * 0.16, 0.34 + i * 0.16, '#d8c8a0'); // laces
      B(0.1, 0.18, RUSSET_D);
      R(0.66, 0.8, -0.06, 0.12, RUSSET); // the purse
      B(0.9, 1, GREEN_L); // a collar of the hood's colour
      return;
    case 'longbowman': // a padded jack, quilted in rows, belted, with a green hood-cape over the shoulders
      for (let i = 1; i < 6; i++) B(i * 0.15, i * 0.15 + 0.03, shade(JACK, -0.18));
      for (const u of [0.25, 0.5, 0.75]) R(u, u + 0.02, 0.18, 0.86, shade(JACK, -0.12));
      B(0.08, 0.16, RUSSET_D);
      R(0.44, 0.56, 0.08, 0.16, '#c0b090');
      R(0.7, 0.84, -0.08, 0.1, RUSSET); // a purse of spare strings
      B(0.82, 1, GREEN);
      return;
    case 'explorer': // a black Tudor doublet slashed to show red, gold buttons, a short gown with fur at the collar
      for (const [u, v] of [[0.12, 0.5], [0.22, 0.66], [0.74, 0.5], [0.84, 0.66], [0.16, 0.3], [0.8, 0.3]] as const) R(u, u + 0.05, v, v + 0.16, RED);
      for (let i = 0; i < 5; i++) R(0.47, 0.53, 0.16 + i * 0.16, 0.22 + i * 0.16, GOLD);
      L(0, 1, 0, 1, '#3a2a22'); // the gown over the back
      L(0.7, 1, 0.1, 1, '#4a382c');
      B(0.86, 1, '#8a6a4a'); // the fur collar
      return;
    case 'giant': // Henry's broad Tudor doublet: red and gold, paned and puffed, a great gold collar of state
      for (let i = 0; i < 6; i++) R(0.08 + i * 0.15, 0.13 + i * 0.15, 0.12, 0.84, GOLD); // panes
      for (let i = 0; i < 6; i++) R(0.13 + i * 0.15, 0.16 + i * 0.15, 0.12, 0.84, '#f4ecd8'); // the shirt puffed through
      for (let i = 0; i < 4; i++) L(0.1 + i * 0.22, 0.16 + i * 0.22, 0.12, 0.84, GOLD);
      B(0.04, 0.12, GOLD_D);
      for (let i = 0; i < 7; i++) { const u = 0.08 + i * 0.14, v = 0.86 - Math.sin((i / 6) * Math.PI) * 0.22; R(u, u + 0.1, v, v + 0.08, GOLD_L); } // the collar of SS
      R(0.44, 0.56, 0.5, 0.62, '#c84a6a'); // a jewel pendant
      L(0, 1, 0.84, 1, '#6a4a2a'); // the fur of the gown at the shoulder
      return;
    default: // plate: a breastplate with a ridge, a fauld, and a red-and-gold sash
      if (kind === 'rider' || kind === 'knight') {
        R(0.06, 0.46, 0.2, 0.86, shade(STEEL, 0.22));
        R(0.46, 0.52, 0.1, 0.9, STEEL_L);
        R(0.52, 0.56, 0.1, 0.9, shade(STEEL, -0.25));
        for (let i = 0; i < 2; i++) B(-0.06 - i * 0.12, 0.04 - i * 0.12, shade(STEEL, -0.1 * i)); // fauld lames
        B(0.3, 0.4, RED);
        R(0.1, 0.22, 0.12, 0.34, GOLD);
        return;
      }
  }
}

/** English faces: a short beard for the grown ranks; the king's ginger beard. */
function face(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  if (kind === 'giant') {
    R(0.14, 0.86, -0.06, 0.2, GINGER); // a full, square beard
    R(0.3, 0.7, 0.2, 0.26, GINGER);
    R(0.4, 0.6, 0.12, 0.16, '#8a3a2a'); // the mouth
    return;
  }
  if (kind === 'swordsman' || kind === 'explorer' || kind === 'knight') {
    R(0.3, 0.7, -0.04, 0.12, HAIR); // a trimmed beard
    R(0.26, 0.46, 0.18, 0.24, HAIR); // a moustache
    R(0.54, 0.74, 0.18, 0.24, HAIR);
  } else if (kind === 'warrior' || kind === 'defender') {
    R(0.2, 0.8, 0, 0.1, shade(HAIR, 0.2)); // stubble
  }
}

// ---------------------------------------------------------------- headgear

/** A kettle hat: a round steel bowl with a broad brim all round. */
function kettleHat(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const by = top + 1.6 * k, rx = hw / 2 + 3.4 * k;
  ellipse(ctx, x + 0.4 * k, by + 0.8 * k, rx, 2.6 * k, shade(STEEL, -0.4));
  ellipse(ctx, x, by, rx, 2.6 * k, STEEL);
  ring(ctx, x, by, rx, 2.6 * k, STEEL_D, 0.45 * k);
  ellipse(ctx, x - rx * 0.4, by - 0.6 * k, rx * 0.4, 0.9 * k, STEEL_L);
  dome(ctx, x, by - 0.6 * k, hw / 2 + 0.4 * k, 5.6 * k, STEEL);
  line(ctx, x, by - 6 * k, x + 0.2 * k, by - 0.8 * k, STEEL_D, 0.5 * k); // the riveted seam over the crown
  for (const d of [-2.6, 0, 2.6]) ellipse(ctx, x + d * k, by - 0.8 * k, 0.4 * k, 0.4 * k, STEEL_L);
}

/** A bascinet: a tall pointed bowl with a mail aventail falling to the shoulders. */
function bascinet(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const hh = 10.5 * k, hy = top + hh;
  // the aventail over the sides and back of the head and onto the shoulders
  faceQuad(ctx, 'L', x, hy, hw, hh, 0, 1, -0.06, 0.8, MAIL);
  for (let i = 0; i < 4; i++) faceQuad(ctx, 'L', x, hy, hw, hh, 0, 1, 0.08 + i * 0.18, 0.12 + i * 0.18, MAIL_D);
  faceQuad(ctx, 'R', x, hy, hw, hh, 0, 0.16, -0.06, 0.8, MAIL);
  faceQuad(ctx, 'R', x, hy, hw, hh, 0.84, 1, -0.06, 0.8, MAIL);
  faceQuad(ctx, 'R', x, hy, hw, hh, 0, 1, -0.06, 0.06, MAIL); // the chin of the aventail
  // the pointed bowl, its peak swept slightly back
  const by = top + 3 * k, bx = hw / 2 + 0.6 * k;
  poly(ctx, [x - bx, by, x - bx * 0.9, by - 4 * k, x - 1.6 * k, by - 9.4 * k, x - 0.6 * k, by - 10.2 * k, x + bx * 0.7, by - 5 * k, x + bx, by], STEEL);
  poly(ctx, [x + 0.4 * k, by + 0.6 * k, x - 0.6 * k, by - 10.2 * k, x + bx * 0.7, by - 5 * k, x + bx, by], shade(STEEL, -0.22));
  line(ctx, x - bx * 0.6, by - 1.4 * k, x - 1.6 * k, by - 8 * k, STEEL_L, 0.6 * k);
  line(ctx, x - bx, by, x + bx, by, STEEL_D, 0.6 * k); // the vervelles that hold the mail
  for (const d of [-3.4, -1.2, 1.2, 3.4]) ellipse(ctx, x + d * k, by, 0.35 * k, 0.35 * k, GOLD_L);
}

/** A sallet: a rounded bowl drawn out into a long tail behind, a narrow sight across the brow. */
function sallet(ctx: Ctx, x: number, top: number, k: number, hw: number, plume?: string) {
  const by = top + 3.6 * k, bx = hw / 2 + 0.8 * k;
  // the tail sweeping back over the neck
  poly(ctx, [x - bx * 0.4, by - 4 * k, x - bx - 4.6 * k, by + 2.4 * k, x - bx - 3.6 * k, by + 3.4 * k, x - bx * 0.2, by + 0.6 * k], shade(STEEL, -0.1));
  poly(ctx, [x - bx - 4.6 * k, by + 2.4 * k, x - bx - 3.6 * k, by + 3.4 * k, x - bx * 0.2, by + 0.6 * k, x - bx * 0.3, by - 0.2 * k], shade(STEEL, -0.32));
  dome(ctx, x, by, bx, 7.2 * k, STEEL);
  // the visor: a band across the face with the sight cut in it
  poly(ctx, [x - bx * 0.2, by - 1.4 * k, x + bx, by - 2.2 * k, x + bx * 1.02, by + 1.6 * k, x - bx * 0.1, by + 2.2 * k], shade(STEEL, -0.08));
  line(ctx, x + 0.2 * k, by - 0.6 * k, x + bx * 0.96, by - 1 * k, '#1a1a20', 0.8 * k);
  line(ctx, x - bx * 0.4, by - 6 * k, x - bx * 0.1, by - 2.4 * k, STEEL_L, 0.6 * k);
  if (plume) for (let i = 0; i < 3; i++) curve(ctx, x - 1 * k, by - 6.6 * k, x - 3 * k - i * 0.6 * k, by - 12 * k + i * k, x - 7.4 * k - i * 0.6 * k, by - 7 * k + i * 1.2 * k, 1.4 * k, i % 2 ? WHITE : plume);
}

/** A great bascinet with a visor (the knight's): a smooth steel head with breaths, and a crest of red and white plumes. */
function armet(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const hh = 10.5 * k, hy = top + hh;
  faceQuad(ctx, 'L', x, hy, hw, hh, 0, 1, -0.04, 1, STEEL);
  faceQuad(ctx, 'R', x, hy, hw, hh, 0, 1, -0.04, 1, shade(STEEL, -0.1));
  faceQuad(ctx, 'R', x, hy, hw, hh, 0.1, 0.9, 0.5, 0.58, '#1a1a20'); // the sight
  for (let i = 0; i < 3; i++) faceQuad(ctx, 'R', x, hy, hw, hh, 0.6 + i * 0.1, 0.64 + i * 0.1, 0.16, 0.36, '#2a2a30'); // breaths
  faceQuad(ctx, 'R', x, hy, hw, hh, 0.46, 0.54, 0, 1, STEEL_L); // the ridge of the visor
  dome(ctx, x, top + 0.6 * k, hw / 2, 4 * k, STEEL);
  // the crest: a gold torse and a spray of plumes
  ellipse(ctx, x, top - 2.8 * k, 2.4 * k, 1 * k, GOLD);
  for (let i = 0; i < 4; i++) curve(ctx, x, top - 3 * k, x - 2 * k - i * 0.4 * k, top - 10 * k + i * 0.8 * k, x - 7.6 * k - i * 0.6 * k, top - 5.4 * k + i * 1.2 * k, 1.5 * k, i % 2 ? WHITE : RED);
}

/** A cloth hood (chaperon): it frames the face, covers the head and shoulders, and ends in a long liripipe tail. */
function hood(ctx: Ctx, x: number, top: number, k: number, hw: number, cloth: string) {
  const hh = 10.5 * k, hy = top + hh;
  // the liripipe hanging down the back
  curve(ctx, x - hw * 0.3, top + 1 * k, x - hw * 0.9, top + 4 * k, x - hw * 0.75, top + 13 * k, 1.6 * k, shade(cloth, -0.18));
  faceQuad(ctx, 'L', x, hy, hw, hh, 0, 1, 0.08, 1.04, cloth);
  faceQuad(ctx, 'L', x, hy, hw, hh, 0.7, 1, 0.08, 1.04, shade(cloth, -0.08));
  faceQuad(ctx, 'R', x, hy, hw, hh, 0, 0.14, 0.08, 1.04, shade(cloth, -0.05));
  faceQuad(ctx, 'R', x, hy, hw, hh, 0.86, 1, 0.08, 1.04, shade(cloth, -0.05));
  faceQuad(ctx, 'R', x, hy, hw, hh, 0, 1, 0.84, 1.04, cloth);
  faceQuad(ctx, 'R', x, hy, hw, hh, 0.1, 0.9, 0.82, 0.86, shade(cloth, -0.3)); // the shadow of the brim on the brow
  dome(ctx, x - 0.2 * k, top + 0.4 * k, hw / 2 + 0.4 * k, 3.6 * k, cloth);
  // the shoulder cape, its edge dagged (cut in scallops)
  const cy = hy + 1.4 * k, rx = hw / 2 + 2.6 * k;
  ellipse(ctx, x, cy + 0.6 * k, rx, 3 * k, shade(cloth, -0.25));
  ellipse(ctx, x, cy, rx, 2.8 * k, cloth);
  for (let i = 0; i < 7; i++) { const a = Math.PI * (0.06 + (i / 6) * 0.88); ellipse(ctx, x + Math.cos(a) * rx * 0.94, cy + Math.sin(a) * 2.7 * k, 1 * k, 0.8 * k, cloth); }
}

/** A flat Tudor bonnet of black velvet with a white feather and a gold brooch. */
function flatCap(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const by = top + 1.4 * k, rx = hw / 2 + 1.2 * k;
  ellipse(ctx, x + 0.3 * k, by + 0.5 * k, rx, 1.8 * k, '#0e0c0e'); // the narrow brim
  ellipse(ctx, x, by, rx, 1.8 * k, BLACK);
  ellipse(ctx, x + 0.6 * k, by - 2 * k, rx * 0.95, 2.6 * k, '#141214'); // the soft, puffed crown, set at an angle
  ellipse(ctx, x - 0.2 * k, by - 2.6 * k, rx * 0.8, 2 * k, '#2e2a2e');
  ellipse(ctx, x - 1.4 * k, by - 3.4 * k, rx * 0.36, 0.8 * k, '#4a444a');
  ellipse(ctx, x + rx * 0.62, by - 0.6 * k, 0.8 * k, 0.8 * k, GOLD); // a gold brooch
  ellipse(ctx, x + rx * 0.62, by - 0.6 * k, 0.35 * k, 0.35 * k, RED_L);
  curve(ctx, x + rx * 0.5, by - 1 * k, x - 1 * k, by - 4 * k, x - rx - 0.6 * k, by - 1.4 * k, 1 * k, WHITE); // a small white plume
}

/** The king's crown: a gold circlet of crosses and fleurs-de-lis, arched, over a red velvet cap. */
function crown(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const by = top + 2.4 * k, rx = hw / 2 + 0.6 * k;
  dome(ctx, x, by - 1.6 * k, rx * 0.9, 4.6 * k, RED);
  poly(ctx, [x - rx, by + 0.6 * k, x + rx, by + 0.6 * k, x + rx, by - 2.4 * k, x - rx, by - 2.4 * k], GOLD);
  poly(ctx, [x + 0.4 * k, by + 0.6 * k, x + rx, by + 0.6 * k, x + rx, by - 2.4 * k, x + 0.4 * k, by - 2.4 * k], shade(GOLD, -0.18));
  for (let i = 0; i < 5; i++) {
    const fx = x - rx + (i / 4) * rx * 2, c = i > 2 ? shade(GOLD, -0.12) : GOLD;
    if (i % 2 === 0) { // a cross pattée
      poly(ctx, [fx - 0.5 * k, by - 2.4 * k, fx + 0.5 * k, by - 2.4 * k, fx + 0.5 * k, by - 5.6 * k, fx - 0.5 * k, by - 5.6 * k], c);
      poly(ctx, [fx - 1.4 * k, by - 4.4 * k, fx + 1.4 * k, by - 4.4 * k, fx + 1.4 * k, by - 3.6 * k, fx - 1.4 * k, by - 3.6 * k], c);
    } else { // a fleur-de-lis
      poly(ctx, [fx - 0.5 * k, by - 2.4 * k, fx + 0.5 * k, by - 2.4 * k, fx, by - 5.4 * k], c);
      ellipse(ctx, fx - 0.9 * k, by - 3.8 * k, 0.6 * k, 0.9 * k, c);
      ellipse(ctx, fx + 0.9 * k, by - 3.8 * k, 0.6 * k, 0.9 * k, c);
    }
  }
  for (const [d, c] of [[-0.6, RED_L], [0, '#2a6ac8'], [0.6, '#2a9a5a']] as const) ellipse(ctx, x + d * rx, by - 0.9 * k, 0.7 * k, 0.8 * k, c);
  for (const d of [-0.8, -0.27, 0.27, 0.8]) ellipse(ctx, x + d * rx, by + 0.2 * k, 0.35 * k, 0.35 * k, WHITE); // pearls
  curve(ctx, x - rx * 0.9, by - 2.4 * k, x, by - 10 * k, x + rx * 0.9, by - 2.4 * k, 0.8 * k, GOLD); // the arch
  ellipse(ctx, x, by - 6.4 * k, 1.1 * k, 1.1 * k, GOLD_L); // the orb
  line(ctx, x, by - 7.4 * k, x, by - 9.6 * k, GOLD, 0.7 * k);
  line(ctx, x - 0.9 * k, by - 8.8 * k, x + 0.9 * k, by - 8.8 * k, GOLD, 0.7 * k);
}

function head(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  switch (kind) {
    case 'warrior': kettleHat(ctx, x, top, k, hw); return;
    case 'defender': bascinet(ctx, x, top, k, hw); return;
    case 'swordsman': sallet(ctx, x, top, k, hw, RED); return;
    case 'rider': sallet(ctx, x, top, k, hw); return;
    case 'knight': armet(ctx, x, top, k, hw); return;
    case 'archer': hood(ctx, x, top, k, hw, GREEN); return;
    case 'longbowman': hood(ctx, x, top, k, hw, GREEN_L); return;
    case 'explorer': flatCap(ctx, x, top, k, hw); return;
    case 'giant': crown(ctx, x, top, k, hw); return;
    default: return;
  }
}

// ---------------------------------------------------------------- weapons and shields

/** A heater shield with the three lions of England (or St George's cross), its top edge at y - 11k. */
function heater(ctx: Ctx, x: number, y: number, k: number, arms: 'lions' | 'cross' = 'lions', size = 1) {
  const s = k * size;
  const cx = x - 1.6 * s, top = y - 11 * s, w = 5.4 * s, h = 12.4 * s;
  const pts: number[] = [cx - w, top, cx + w, top + 0.8 * s];
  // the curved sides meeting at the point
  for (let i = 1; i <= 8; i++) { const t = i / 8; pts.push(cx + w * (1 - t * t), top + 0.8 * s + (h - 0.8 * s) * t); }
  for (let i = 7; i >= 1; i--) { const t = i / 8; pts.push(cx - w * (1 - t * t) - 0.3 * s * t, top + h * t); }
  const edge = pts.map((v, i) => (i % 2 ? v + 0.8 * s : v + 1 * s));
  poly(ctx, edge, shade(arms === 'lions' ? RED : WHITE, -0.5)); // its thickness
  poly(ctx, pts, arms === 'lions' ? RED : WHITE);
  ctx.save();
  clipPoly(ctx, pts);
  if (arms === 'lions') threeLions(ctx, cx - 0.4 * s, top + h * 0.4, h * 0.82);
  else {
    poly(ctx, [cx - 1.2 * s, top - 1, cx + 1.2 * s, top - 1, cx + 1.2 * s, top + h + 1, cx - 1.2 * s, top + h + 1], RED);
    poly(ctx, [cx - w - 1, top + 3.4 * s, cx + w + 1, top + 3.6 * s, cx + w + 1, top + 5.8 * s, cx - w - 1, top + 5.6 * s], RED);
  }
  poly(ctx, [cx - w, top, cx - w * 0.4, top + 0.2 * s, cx - w * 0.3, top + h, cx - w, top + h], 'rgba(255,255,255,0.12)'); // the light on the near half
  ctx.restore();
  ctx.strokeStyle = ink(arms === 'lions' ? GOLD_D : STEEL_D);
  ctx.lineWidth = 0.6 * s;
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.stroke();
}

/** An English bill: a long ash haft, a hooked blade with a back spike and a top spike. */
function bill(ctx: Ctx, x: number, y: number, k: number, len = 32) {
  const x0 = x - 2.4 * k, y0 = y + 7 * k, x1 = x + 3.4 * k, y1 = y - (len - 7) * k;
  line(ctx, x0, y0, x1, y1, WOOD, 1.2 * k);
  line(ctx, x0 - 0.4 * k, y0, x1 - 0.4 * k, y1, shade(WOOD, 0.4), 0.4 * k);
  // the blade: a broad chopper curving forward into a hook
  poly(ctx, [x1 - 0.4 * k, y1 + 3 * k, x1 + 3.4 * k, y1 + 2 * k, x1 + 4.6 * k, y1 - 2 * k, x1 + 3 * k, y1 - 5.6 * k, x1 + 4.2 * k, y1 - 6.2 * k, x1 + 1.6 * k, y1 - 7 * k, x1, y1 - 4 * k], STEEL);
  poly(ctx, [x1 + 3.4 * k, y1 + 2 * k, x1 + 4.6 * k, y1 - 2 * k, x1 + 3 * k, y1 - 5.6 * k, x1 + 2.6 * k, y1 - 2 * k], STEEL_D);
  line(ctx, x1 + 3.6 * k, y1 + 1.6 * k, x1 + 4.4 * k, y1 - 1.8 * k, STEEL_L, 0.5 * k);
  // the top spike and the back spike
  poly(ctx, [x1 + 0.6 * k, y1 - 6 * k, x1 + 1.4 * k, y1 - 6.4 * k, x1 + 1.8 * k, y1 - 12 * k], STEEL_L);
  poly(ctx, [x1 - 0.2 * k, y1 - 1.6 * k, x1 - 0.4 * k, y1 - 0.4 * k, x1 - 3.8 * k, y1 - 0.4 * k], STEEL);
  line(ctx, x1 - 0.2 * k, y1 + 3 * k, x1 - 0.6 * k, y1 + 5.4 * k, STEEL_D, 0.7 * k); // the socket's langets
}

/** A straight arming sword (or the king's great sword) with a cross hilt and a wheel pommel. */
function sword(ctx: Ctx, x: number, y: number, k: number, len = 15, broad = 1) {
  const tx = x + len * 0.24 * k, ty = y - len * k, wd = 0.9 * broad * k;
  poly(ctx, [x - wd, y - 1.6 * k, tx - 0.2 * k, ty + 1.6 * k, tx + 0.2 * k, ty - 0.6 * k, x + 0.1 * k, y - 2 * k], STEEL_L);
  poly(ctx, [x + wd, y - 1.4 * k, tx + 0.5 * k, ty + 1.6 * k, tx + 0.2 * k, ty - 0.6 * k, x + 0.1 * k, y - 2 * k], '#98a0aa');
  line(ctx, x + 0.1 * k, y - 2.6 * k, tx, ty + 2.4 * k, STEEL_D, 0.3 * k);
  line(ctx, x - 3.4 * k, y - 1 * k, x + 3.4 * k, y - 2.4 * k, GOLD_D, 1 * k); // the cross-guard
  line(ctx, x, y - 1.6 * k, x - 0.6 * k, y + 2.4 * k, '#3a2a20', 1.4 * k);
  ellipse(ctx, x - 0.7 * k, y + 3 * k, 1.2 * k, 1.2 * k, GOLD);
  ellipse(ctx, x - 1 * k, y + 2.7 * k, 0.4 * k, 0.4 * k, GOLD_L);
}

function weapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  switch (kind) {
    case 'warrior': bill(ctx, x, y, k, 30); return true;
    case 'defender': bill(ctx, x, y, k, 36); return true; // the heater shield is drawn by the shield hook
    case 'swordsman':
      sword(ctx, x, y, k, 15);
      heater(ctx, b.off.x, b.off.y, k, 'lions');
      return true;
    case 'giant':
      sword(ctx, x, y, k, 20, 1.4);
      heater(ctx, b.off.x, b.off.y, k, 'lions', 1.1);
      return true;
    case 'explorer': // a walking staff and a rolled chart
      line(ctx, x - 1 * k, y + 6 * k, x + 1.6 * k, y - 12 * k, WOOD, 1 * k);
      return true;
    default: return false;
  }
}

// ---------------------------------------------------------------- the longbow

/** A quiver of white-fletched arrows hung at the hip (or a sheaf stuck through the belt). */
function quiver(ctx: Ctx, x: number, y: number, k: number) {
  box(ctx, x, y, 3.4 * k, 8 * k, RUSSET);
  band(ctx, x, y, 3.4 * k, 8 * k, 0.78, 0.88, RUSSET_D);
  band(ctx, x, y, 3.4 * k, 8 * k, 0.2, 0.28, RUSSET_D);
  for (const i of [-1, -0.3, 0.4, 1]) {
    const tx = x - 1.4 * k + i * 1.4 * k, ty = y - 13.6 * k - Math.abs(i) * 0.4 * k;
    line(ctx, x + i * 0.8 * k, y - 8.2 * k, tx, ty + 1 * k, '#d8c49a', 0.6 * k);
    poly(ctx, [tx, ty + 1.4 * k, tx - 1 * k, ty - 1.4 * k, tx + 0.3 * k, ty - 0.2 * k], WHITE); // the grey-goose fletching
    poly(ctx, [tx, ty + 1.4 * k, tx + 1.1 * k, ty - 1.2 * k, tx + 0.3 * k, ty - 0.2 * k], WHITE_D);
  }
}

/** A tall yew stave: pale sapwood on the back, red heartwood on the belly, horn nocks, a waxed hemp string. */
function longbow(ctx: Ctx, gx: number, gy: number, k: number, half: number, draw: number, sx: number) {
  // gx, gy: the grip; half: the bow's half height; draw: how far the limbs bend forward; sx: where the string is drawn to
  const tipT = { x: gx - draw * 0.55, y: gy - half }, tipB = { x: gx - draw * 0.55, y: gy + half };
  curve(ctx, tipT.x, tipT.y, gx + draw * 0.6, gy - half * 0.4, gx, gy, 1.5 * k, YEW_D);
  curve(ctx, gx, gy, gx + draw * 0.6, gy + half * 0.4, tipB.x, tipB.y, 1.5 * k, YEW_D);
  curve(ctx, tipT.x - 0.3 * k, tipT.y, gx + draw * 0.6 - 0.4 * k, gy - half * 0.4, gx - 0.4 * k, gy, 0.6 * k, '#e8c890');
  curve(ctx, gx - 0.4 * k, gy, gx + draw * 0.6 - 0.4 * k, gy + half * 0.4, tipB.x - 0.3 * k, tipB.y, 0.6 * k, '#e8c890');
  for (const t of [tipT, tipB]) ellipse(ctx, t.x, t.y, 0.6 * k, 0.8 * k, '#f0e8d0'); // horn nocks
  line(ctx, gx, gy - 1.6 * k, gx, gy + 1.6 * k, '#3a2a1a', 1.8 * k); // the leather grip
  // the string
  line(ctx, tipT.x, tipT.y, sx, gy, '#e8e2d0', 0.4 * k);
  line(ctx, tipB.x, tipB.y, sx, gy, '#e8e2d0', 0.4 * k);
}

/** The English archer: a hooded man in green and russet with a yew bow as tall as he is, a quiver at his hip. */
function archer(ctx: Ctx, x: number, y: number) {
  quiver(ctx, x - 6.4, y - 3.4, 0.9);
  const b = figure(ctx, 'archer', 'england', x, y, 1);
  // the bow held upright at his side, strung, taller than the man
  longbow(ctx, b.hand.x + 1.2, b.hand.y, 1, 16, 2.6, b.hand.x + 1.2 - 2.6 * 0.55 + 0.1);
  ellipse(ctx, b.hand.x + 1.2, b.hand.y + 0.4, 1.1, 1.1, '#e8b890'); // the hand round the grip
  // a nocked arrow held along the bow
  line(ctx, b.hand.x + 0.2, b.hand.y + 4, b.hand.x + 2.4, b.hand.y - 12, '#d8c49a', 0.6);
  poly(ctx, [b.hand.x + 2.4, b.hand.y - 12, b.hand.x + 2, b.hand.y - 14.4, b.hand.x + 3, b.hand.y - 12.2], STEEL_D);
}

/** Arrows stuck point-down in the ground before the bowman, ready to hand. */
function groundArrows(ctx: Ctx, x: number, y: number) {
  for (const [dx, dy, lean] of [[0, 0, -0.8], [2.6, 1.2, 0.4], [5, -0.2, -0.2], [7.4, 1, 0.9], [3.6, 3, -0.5]] as const) {
    const bx = x + dx, by = y + dy, tx = bx + lean * 2, ty = by - 9;
    ellipse(ctx, bx, by + 0.3, 0.9, 0.35, 'rgba(60,40,20,0.35)');
    line(ctx, bx, by, tx, ty, '#d8c49a', 0.6);
    poly(ctx, [tx, ty + 1.6, tx - 1, ty - 1.2, tx + 0.2, ty - 0.2], WHITE);
    poly(ctx, [tx, ty + 1.6, tx + 1.1, ty - 1, tx + 0.2, ty - 0.2], WHITE_D);
  }
}

/** The Longbowman: green hood, padded jack, a huge yew bow at full draw, a row of arrows stuck in the ground before him. */
function longbowman(ctx: Ctx, x: number, y: number) {
  quiver(ctx, x - 6.6, y - 3, 0.9);
  const b = figure(ctx, 'longbowman', 'england', x, y, 1);
  // the bow arm thrust out at the target, the draw hand at the cheek
  const sh = { x: x + 4.4, y: y - 14.2 }, grip = { x: x + 11.4, y: y - 15.6 }, nock = { x: x + 2.4, y: y - 17.2 };
  line(ctx, sh.x, sh.y, grip.x - 0.8, grip.y + 0.2, JACK, 2.6);
  line(ctx, sh.x, sh.y + 0.8, grip.x - 0.8, grip.y + 1, shade(JACK, -0.2), 1);
  ellipse(ctx, grip.x, grip.y, 1.1, 1.2, '#e8b890');
  longbow(ctx, grip.x, grip.y, 1, 19, 5.4, nock.x);
  // the arrow drawn to the ear: shaft, steel bodkin point, white fletching at the nock
  line(ctx, nock.x, nock.y + 0.1, grip.x + 3.6, grip.y - 0.2, '#d8c49a', 0.7);
  poly(ctx, [grip.x + 3.4, grip.y - 0.9, grip.x + 6, grip.y - 0.3, grip.x + 3.4, grip.y + 0.4], STEEL_D);
  poly(ctx, [nock.x + 0.4, nock.y, nock.x + 3, nock.y - 1.4, nock.x + 2.6, nock.y], WHITE);
  poly(ctx, [nock.x + 0.4, nock.y + 0.2, nock.x + 3, nock.y + 1.4, nock.x + 2.6, nock.y + 0.2], WHITE_D);
  ellipse(ctx, nock.x, nock.y + 0.3, 1.1, 1.1, '#e8b890'); // the draw hand
  line(ctx, nock.x - 0.4, nock.y + 0.8, x + 1, y - 12, JACK, 2); // the draw arm, elbow back
  groundArrows(ctx, x + 6, y + 6);
  void b;
}

// ---------------------------------------------------------------- horsemen

const HK = 0.95;

/** Gear over drawHorse: a long caparison quartered in red and gold with the lions, or a red saddle cloth; a steel chamfron. */
function horseGear(ctx: Ctx, x: number, y: number, saddle: { x: number; y: number }, full: boolean) {
  const hx0 = x - 1, hy0 = y + 3;
  const bx = hx0, by = hy0 - 6 * HK, bw = 17 * HK, bh = 7 * HK;
  if (full) {
    for (const f of ['L', 'R'] as const) {
      faceQuad(ctx, f, bx, by, bw, bh, 0, 0.5, -0.62, 0.98, f === 'R' ? RED : GOLD);
      faceQuad(ctx, f, bx, by, bw, bh, 0.5, 1, -0.62, 0.98, f === 'R' ? GOLD : RED);
      faceQuad(ctx, f, bx, by, bw, bh, 0, 1, -0.62, -0.52, GOLD_D);
      for (let i = 0; i < 10; i++) faceQuad(ctx, f, bx, by, bw, bh, i / 10 + 0.02, i / 10 + 0.07, -0.7, -0.62, i % 2 ? RED_D : GOLD_D); // fringe
    }
    // a lion on each red quarter of the near side
    const P = (u: number, v: number): [number, number] => [bx + (u * bw) / 2, by + (bw / 4) * (1 - u) - v * bh];
    const [lx, ly] = P(0.25, 0.2);
    lionPassant(ctx, lx, ly, 0.75, GOLD);
    const [mx, my] = P(0.75, 0.2);
    lionPassant(ctx, mx, my, 0.7, RED);
    // the chamfron and a red plume
    const hhx = hx0 + 10.5 * HK, hhy = hy0 - 15 * HK;
    faceQuad(ctx, 'R', hhx, hhy, 7 * HK, 5 * HK, 0.08, 0.72, 0.3, 0.98, STEEL);
    faceQuad(ctx, 'R', hhx, hhy, 7 * HK, 5 * HK, 0.36, 0.46, 0.3, 0.98, GOLD);
    for (let i = -1; i <= 1; i++) curve(ctx, hhx + 0.4, hhy - 4.6, hhx + i * 1.2 - 0.6, hhy - 8.6, hhx + i * 1.6 - 2.6, hhy - 10.6, 0.9, i ? RED : WHITE);
  } else {
    const sx = saddle.x, sy = saddle.y;
    poly(ctx, [sx - 6, sy - 0.6, sx + 4, sy - 0.6, sx + 3.6, sy + 6.4, sx - 5.6, sy + 7.2], RED);
    poly(ctx, [sx - 6, sy - 0.6, sx - 1, sy - 0.6, sx - 0.8, sy + 6.8, sx - 5.6, sy + 7.2], WHITE);
    line(ctx, sx - 5.6, sy + 7, sx + 3.6, sy + 6.2, GOLD, 0.8);
  }
  line(ctx, x + 3.5, y - 9.6, x + 8, y - 3.4, RED_D, 1.2);
  for (let i = 0; i < 3; i++) { const t = (i + 0.5) / 3; ellipse(ctx, x + 3.5 + 4.5 * t, y - 9.6 + 6.2 * t, 0.5, 0.5, GOLD_L); }
}

/** A leg in plate (sabaton and greave) hanging in the stirrup. */
function plateLeg(ctx: Ctx, sx: number, sy: number) {
  poly(ctx, [sx + 0.4, sy + 0.4, sx + 4, sy + 0.6, sx + 4.6, sy + 5, sx + 2.2, sy + 5.4], STEEL);
  ellipse(ctx, sx + 3.6, sy + 5.2, 1.4, 1.1, STEEL_L); // the poleyn at the knee
  poly(ctx, [sx + 2.2, sy + 5.4, sx + 4.6, sy + 5, sx + 4.4, sy + 10, sx + 2.2, sy + 10.2], shade(STEEL, -0.12));
  poly(ctx, [sx + 2.2, sy + 10, sx + 4.8, sy + 9.8, sx + 6.6, sy + 11, sx + 2.2, sy + 11.2], STEEL_D);
  line(ctx, sx + 1.8, sy + 11.4, sx + 5, sy + 11.2, IRON, 0.6);
}

/** A lance with a St George pennon (forked) below the head. */
function lance(ctx: Ctx, x: number, y: number, len: number) {
  const x0 = x - 3, y0 = y + 8, x1 = x + 5, y1 = y - len;
  line(ctx, x0, y0, x1, y1, '#8a5a30', 1.3);
  for (let i = 0; i < 5; i++) { const t = 0.2 + i * 0.14; line(ctx, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, x0 + (x1 - x0) * (t + 0.06), y0 + (y1 - y0) * (t + 0.06), RED, 1.4); } // painted spiral
  poly(ctx, [x1 + 0.6, y1 - 5, x1 - 0.8, y1 - 0.4, x1 + 0.2, y1 + 0.8, x1 + 1.4, y1 - 0.2], STEEL_L);
  poly(ctx, [x1 + 0.6, y1 - 5, x1 + 1.4, y1 - 0.2, x1 + 0.2, y1 + 0.8], STEEL_D);
  ellipse(ctx, x - 0.4, y + 1, 1.8, 1.1, STEEL); // the vamplate
  stGeorge(ctx, x1 - 0.2, y1 + 1.4, 6, 5, 0.6, true);
}

/** The English horseman: a rider in a sallet on a bay with a red-and-white saddle cloth, or a knight in plate on a
 *  caparisoned grey, with a lion shield and a St George pennon. */
function horseman(ctx: Ctx, kind: 'rider' | 'knight', x: number, y: number) {
  const knight = kind === 'knight';
  const saddle = drawHorse(ctx, x - 1, y + 3, HK, knight ? '#e2ded6' : '#7a4a2a', knight ? '#c8c4bc' : '#1a120c', undefined, RED);
  horseGear(ctx, x, y, saddle, knight);
  const b = figure(ctx, kind, 'england', saddle.x, saddle.y, 0.9, true);
  plateLeg(ctx, saddle.x, saddle.y);
  heater(ctx, b.off.x - 0.6, b.off.y + 3, 0.62, knight ? 'lions' : 'cross');
  lance(ctx, b.hand.x, b.hand.y, knight ? 32 : 28);
}

// ---------------------------------------------------------------- the bombard

function bombard(ctx: Ctx, x: number, y: number) {
  // a pile of stone shot, a powder barrel, a St George flag on a staff
  for (const [ax, ay, ar] of [[-14, 6, 2], [-11, 6.8, 2], [-12.6, 4.4, 1.9]] as const) {
    ellipse(ctx, x + ax, y + ay, ar, ar * 0.95, '#a8a294');
    ellipse(ctx, x + ax - 0.6, y + ay - 0.6, ar * 0.4, ar * 0.35, '#d8d2c4');
  }
  box(ctx, x + 13, y + 5, 3.8, 4.2, '#7a5230', '#9a6a40');
  band(ctx, x + 13, y + 5, 3.8, 4.2, 0.2, 0.3, IRON);
  band(ctx, x + 13, y + 5, 3.8, 4.2, 0.72, 0.82, IRON);
  line(ctx, x + 16.4, y + 5, x + 16.4, y - 16, WOOD_D, 0.8);
  stGeorge(ctx, x + 16.4, y - 16, 7, 5, 0.4);
  // the timber bed it lies in, wedged up at the front
  poly(ctx, [x - 11, y + 4, x + 9, y - 6, x + 11, y - 4, x - 9, y + 6], WOOD_D);
  poly(ctx, [x - 11, y + 4, x + 9, y - 6, x + 9.6, y - 5.2, x - 10.4, y + 4.8], WOOD);
  box(ctx, x + 6, y - 2.4, 3, 2.6, '#6a4a2a'); // the wedge
  // the barrel: wrought-iron staves held by many hoops, a wide mouth; a narrower powder chamber behind
  const b0: [number, number] = [x - 9, y + 0.6], b1: [number, number] = [x + 10, y - 9.4];
  const dx = b1[0] - b0[0], dy = b1[1] - b0[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const P = (t: number, o: number): [number, number] => [b0[0] + ux * t + nx * o, b0[1] + uy * t + ny * o];
  const ch = len * 0.32;
  poly(ctx, [...P(0, -3), ...P(ch, -3), ...P(ch, 3), ...P(0, 3)], IRON); // the chamber
  poly(ctx, [...P(0, -3), ...P(ch, -3), ...P(ch, -1.2), ...P(0, -1.2)], IRON_L);
  poly(ctx, [...P(ch, -4.6), ...P(len, -4.8), ...P(len, 4.8), ...P(ch, 4.6)], IRON); // the barrel
  poly(ctx, [...P(ch, -4.6), ...P(len, -4.8), ...P(len, -2), ...P(ch, -2)], IRON_L);
  poly(ctx, [...P(ch, 3), ...P(len, 3.2), ...P(len, 4.8), ...P(ch, 4.6)], shade(IRON, -0.3));
  for (let i = 0; i <= 4; i++) { const t = ch + (len - ch) * (i / 4.3); line(ctx, ...P(t, -5), ...P(t, 5), '#2a2a30', 1.3); line(ctx, ...P(t + 0.8, -4.8), ...P(t + 0.8, -2), IRON_L, 0.5); } // hoops
  for (const o of [-2.4, 0.4]) line(ctx, ...P(ch + 0.5, o), ...P(len - 0.5, o), 'rgba(20,20,24,0.4)', 0.3); // the seams of the staves
  for (let i = 0; i <= 3; i++) { const t = (ch * i) / 3.2; line(ctx, ...P(t, -3.2), ...P(t, 3.2), '#2a2a30', 0.9); }
  ellipse(ctx, ...P(len, 0), 2.4, 5, '#2a2a30'); // the gaping mouth
  ellipse(ctx, ...P(len + 0.3, 0), 1.8, 4, '#121214');
  ellipse(ctx, ...P(len - 0.2, -1.4), 1.2, 2, '#9a9488'); // a stone ball loaded in the mouth
  for (const t of [ch * 0.5, len * 0.75]) { const [rx, ry] = P(t, -5.4); ring(ctx, rx, ry - 0.4, 0.9, 0.7, IRON_L, 0.5); } // lifting rings
  // the gunner, in a kettle hat, with a linstock
  const g = figure(ctx, 'warrior', 'england', x - 15, y + 1, 0.56);
  line(ctx, g.hand.x - 1, g.hand.y + 4, g.hand.x + 3, g.hand.y - 7, WOOD, 0.7);
  ellipse(ctx, g.hand.x + 3.2, g.hand.y - 7.4, 0.6, 0.6, '#ff7a2a');
  curve(ctx, g.hand.x + 3.2, g.hand.y - 8, g.hand.x + 1.6, g.hand.y - 10.6, g.hand.x + 3.2, g.hand.y - 13, 0.6, 'rgba(220,220,220,0.6)');
}

// ---------------------------------------------------------------- ships

function foam(ctx: Ctx, x: number, y: number, w: number) {
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y, w, 2.2, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.stroke();
}

/** A square sail on its yard, bellied out, with the red cross of St George (or plain canvas). */
function squareSail(ctx: Ctx, mx: number, yTop: number, w: number, h: number, cross: boolean) {
  const l = mx - w / 2, r = mx + w / 2, b = yTop + h;
  line(ctx, l - 1.4, yTop - 0.4, r + 1.4, yTop + 0.4, WOOD_D, 1);
  const pts = [l, yTop, r, yTop + 0.4, r + 1.4, b - h * 0.45, r + 0.4, b, mx, b + 1.8, l - 0.4, b - 0.2, l - 1.4, b - h * 0.45];
  poly(ctx, pts, '#f4eedc');
  poly(ctx, [mx, yTop + 0.2, r, yTop + 0.4, r + 1.4, b - h * 0.45, r + 0.4, b, mx, b + 1.8], '#e0d8c2');
  if (cross) {
    ctx.save();
    clipPoly(ctx, pts);
    const cw = Math.max(1.2, w * 0.16);
    poly(ctx, [mx - cw / 2, yTop - 1, mx + cw / 2, yTop - 1, mx + cw / 2, b + 3, mx - cw / 2, b + 3], RED);
    poly(ctx, [l - 2, yTop + h * 0.4, r + 2, yTop + h * 0.42, r + 2, yTop + h * 0.4 + cw, l - 2, yTop + h * 0.38 + cw], RED);
    poly(ctx, [mx + cw / 2, yTop, r + 2, yTop, r + 2, b + 3, mx + cw / 2, b + 3], 'rgba(0,0,0,0.08)');
    ctx.restore();
  }
  for (const t of [0.2, 0.8]) line(ctx, l + t * w, yTop + 1, l + t * w + (t - 0.5) * 2, b, 'rgba(0,0,0,0.1)', 0.5);
}

/** A lateen mizzen: a triangle hung from a slanting yard. */
function lateen(ctx: Ctx, mx: number, my: number, h: number, span: number) {
  const ya: [number, number] = [mx - span * 0.55, my + h * 0.15], yb: [number, number] = [mx + span * 0.5, my - h * 0.9];
  line(ctx, ya[0], ya[1], yb[0], yb[1], WOOD_D, 0.9);
  const foot: [number, number] = [mx + span * 0.42, my + h * 0.02];
  poly(ctx, [ya[0] + 0.6, ya[1] - 0.2, yb[0] - 0.4, yb[1] + 0.6, foot[0] + 1.6, foot[1] - 0.8], '#f4eedc');
  poly(ctx, [mx, my - h * 0.4, yb[0] - 0.4, yb[1] + 0.6, foot[0] + 1.6, foot[1] - 0.8], '#e0d8c2');
}

type HullPaint = 'clinker' | 'tudor' | 'galleon';

/** A curved hull seen side-on; `top(t)` is the gunwale height along it (t from -1 stern to 1 bow). */
function hull(ctx: Ctx, x: number, y: number, w: number, top: (t: number) => number, paint: HullPaint) {
  const near: [number, number][] = [];
  for (let i = 0; i <= 12; i++) { const t = -1 + i / 6; near.push([x + t * w, top(t)]); }
  const far = near.map(([a, b], i) => [a + (i === 0 ? 1.8 : i === 12 ? -1.8 : 0), b - 2] as [number, number]);
  poly(ctx, [...near.flat(), ...[...far].reverse().flat()], '#3a2414');
  const keel = [...near, [x + w * 0.86, y - 0.6], [x + w * 0.5, y + 2.6], [x, y + 3.2], [x - w * 0.5, y + 2.8], [x - w * 0.96, y - 0.4]] as [number, number][];
  const side = paint === 'galleon' ? '#3a2a20' : '#7a4a26';
  return {
    near, draw: () => {
      poly(ctx, keel.flat(), shade(side, -0.25));
      poly(ctx, [...near.flat(), x + w * 0.9, y - 2.6, x, y - 2, x - w * 0.9, y - 2.4], side);
      line(ctx, x - w * 0.94, y - 0.6, x + w * 0.86, y - 0.8, '#1a120a', 0.7); // the waterline wale
      const stroke = (dy: number, c: string, wd: number) => {
        ctx.strokeStyle = ink(c);
        ctx.lineWidth = wd;
        ctx.beginPath();
        near.forEach(([a, b], i) => (i ? ctx.lineTo(a, b + dy) : ctx.moveTo(a, b + dy)));
        ctx.stroke();
      };
      if (paint === 'clinker') for (const dy of [1.4, 2.8, 4.2]) stroke(dy, 'rgba(30,18,8,0.55)', 0.4); // the overlapping strakes
      if (paint === 'tudor') { stroke(1.2, '#2a6a3a', 1.4); stroke(2.4, WHITE, 0.6); } // Tudor green and white
      if (paint === 'galleon') { stroke(1, GOLD, 0.6); stroke(4.4, GOLD, 0.5); } // ochre wales on the black hull
    },
  };
}

/** A castle on the deck: timber, a rail, painted in Tudor green-and-white chevrons (or plain). */
function deckCastle(ctx: Ctx, x: number, y: number, w: number, h: number, windows: boolean, tudor: boolean) {
  box(ctx, x, y, w, h, '#7a4a26', '#9a6a40');
  if (tudor) for (let i = 0; i < 6; i++) for (const f of ['L', 'R'] as const) faceQuad(ctx, f, x, y, w, h, i / 6 + 0.02, i / 6 + 0.1, 0.56, 0.84, i % 2 ? WHITE : '#2a6a3a');
  else band(ctx, x, y, w, h, 0.66, 0.78, '#5a3418');
  if (windows) for (const u of [0.25, 0.6]) faceQuad(ctx, 'R', x, y, w, h, u, u + 0.14, 0.18, 0.42, '#f0c860');
  for (let i = 0; i < 5; i++) faceQuad(ctx, 'L', x, y - h, w, 1.6, i / 5 + 0.04, i / 5 + 0.1, 0, 1, '#5a3418'); // the rail
}

/** A pennant streaming from a masthead. */
const streamer = (ctx: Ctx, x: number, y: number, len: number) => {
  poly(ctx, [x, y, x + len, y + 1.2, x, y + 2.2], WHITE);
  poly(ctx, [x, y + 0.7, x + len * 0.9, y + 1.25, x, y + 1.5], RED);
};

/** The cog: one mast with a single great square sail bearing the cross, castles fore and aft, a clinker-built hull. */
function cog(ctx: Ctx, x: number, y: number) {
  const w = 16;
  const top = (t: number) => y - 5 - (t < 0 ? Math.pow(-t, 4) * 2 : Math.pow(t, 4) * 2.4);
  const h = hull(ctx, x, y, w, top, 'clinker');
  line(ctx, x, y - 4, x, y - 30, WOOD_D, 1.2);
  for (const [a, b] of [[x - 15, y - 7], [x + 17, y - 7]] as const) line(ctx, a, b, x, y - 29, 'rgba(60,40,24,0.55)', 0.4);
  squareSail(ctx, x, y - 26, 17, 14, true);
  streamer(ctx, x, y - 31, 9);
  h.draw();
  deckCastle(ctx, x - w * 0.74, y - 5.2, 7, 3.6, false, false);
  deckCastle(ctx, x + w * 0.78, y - 5.4, 6, 3.4, false, false);
  figure(ctx, 'archer', 'england', x + w * 0.78, y - 9, 0.34, true);
  line(ctx, x - w + 1.4, top(-1) + 1.4, x - w - 1.4, y + 4.4, WOOD, 1); // the stern rudder
  foam(ctx, x, y + 3.2, w * 0.86);
}

/** The carrack: a round hull with a high forecastle and sterncastle in Tudor colours, two square sails and a lateen. */
function carrack(ctx: Ctx, x: number, y: number) {
  const w = 21;
  const top = (t: number) => y - 4.8 - (t < 0 ? Math.pow(-t, 2) * 5 : Math.pow(t, 2.4) * 4.4);
  const h = hull(ctx, x, y, w, top, 'tudor');
  line(ctx, x + 2, y - 5, x + 2, y - 36, WOOD_D, 1.2);
  line(ctx, x + 12, y - 6, x + 12.6, y - 26, WOOD_D, 1);
  line(ctx, x - 10, y - 6, x - 10, y - 24, WOOD_D, 0.9);
  for (const [a, b] of [[x - 18, y - 6], [x + 20, y - 7]] as const) line(ctx, a, b, x + 2, y - 35, 'rgba(60,40,24,0.55)', 0.4);
  ellipse(ctx, x + 2, y - 36.6, 2, 0.9, '#5a3418');
  lateen(ctx, x - 10, y - 12, 10, 10);
  squareSail(ctx, x + 2, y - 33, 13, 8, false);
  squareSail(ctx, x + 2, y - 23, 18, 12, true);
  squareSail(ctx, x + 12.3, y - 23, 9, 9, true);
  line(ctx, x + 2, y - 37, x + 2, y - 41, WOOD_D, 0.7);
  stGeorge(ctx, x + 2, y - 41, 7, 4.6, 0.4);
  streamer(ctx, x - 10, y - 24.6, 8);
  h.draw();
  deckCastle(ctx, x - w * 0.72, y - 5.2, 9, 5.4, true, true);
  deckCastle(ctx, x + w * 0.72, y - 5.6, 7, 4.4, false, true);
  figure(ctx, 'defender', 'england', x - w * 0.72, y - 10.8, 0.36, true);
  line(ctx, x + w * 0.9, top(0.9) - 3, x + w + 6, top(1) - 8, WOOD_D, 0.9);
  line(ctx, x - w + 1.4, top(-1) + 1.4, x - w - 1.4, y + 4.4, WOOD, 1.1);
  foam(ctx, x, y + 3.2, w * 0.86);
}

/** The galleon: long, low-waisted and tall-sterned, a black hull with ochre wales, two tiers of gunports, three masts of
 *  cross-marked sails, the royal banner at the main and St George flags fore and aft. */
function galleon(ctx: Ctx, x: number, y: number) {
  const w = 27;
  const top = (t: number) => y - 5.6 - (t < 0 ? Math.pow(-t, 2.4) * 6.4 : Math.pow(t, 3) * 2.4);
  const h = hull(ctx, x, y, w, top, 'galleon');
  line(ctx, x + 1, y - 5, x + 1, y - 47, WOOD_D, 1.4);
  line(ctx, x + 14, y - 6, x + 14.4, y - 37, WOOD_D, 1.1);
  line(ctx, x - 13, y - 7, x - 13, y - 33, WOOD_D, 1);
  for (const [a, b, c, d] of [[x - 26, y - 8, x + 1, y - 46], [x + 31, y - 9, x + 14.4, y - 36], [x + 31, y - 9, x + 1, y - 46], [x - 26, y - 8, x - 13, y - 32]] as const) line(ctx, a, b, c, d, 'rgba(60,40,24,0.55)', 0.4);
  ellipse(ctx, x + 1, y - 35.6, 2.4, 1, '#3a2418'); // the tops, behind the sails
  ellipse(ctx, x + 14.2, y - 26.4, 2, 0.9, '#3a2418');
  lateen(ctx, x - 13, y - 17, 12, 12);
  squareSail(ctx, x - 13, y - 31, 8, 6, false);
  squareSail(ctx, x + 1, y - 44, 13, 8, false);
  squareSail(ctx, x + 1, y - 33, 21, 14, true);
  squareSail(ctx, x + 14.2, y - 34, 10, 7, false);
  squareSail(ctx, x + 14, y - 25, 14, 10, true);
  line(ctx, x + 1, y - 47, x + 1, y - 52, WOOD_D, 0.8);
  royalBanner(ctx, x + 1, y - 52.6, 9, 6.4, 0.6);
  line(ctx, x + 14.4, y - 37, x + 14.4, y - 41, WOOD_D, 0.7);
  stGeorge(ctx, x + 14.4, y - 41.6, 6.4, 4.4, 0.4);
  streamer(ctx, x - 13, y - 33, 12);
  h.draw();
  // two tiers of gunports, the guns run out
  for (const [row, n, t0] of [[3.2, 7, -0.6], [6.4, 6, -0.5]] as const) {
    for (let i = 0; i < n; i++) {
      const t = t0 + i * 0.19, px = x + t * w, py = top(t) + row;
      if (py > y - 1.4) continue;
      poly(ctx, [px - 1.1, py - 0.9, px + 1.1, py - 0.9, px + 1.1, py + 0.9, px - 1.1, py + 0.9], '#0e0a08');
      poly(ctx, [px - 1.1, py - 1.5, px + 1.1, py - 1.5, px + 1.1, py - 0.9, px - 1.1, py - 0.9], RED_D); // the port lid, red inside
      line(ctx, px + 0.2, py, px + 1.6, py + 0.7, '#2a2a30', 0.9);
    }
  }
  deckCastle(ctx, x - w * 0.72, y - 6.6, 12, 6.4, true, true);
  deckCastle(ctx, x - w * 0.82, y - 13, 8, 4, true, true);
  for (const d of [-1, 1]) {
    const lx = x - w * 0.82 + d * 3.4, ly = y - 19.6;
    line(ctx, lx, ly + 2.4, lx, ly + 0.8, '#3a2a20', 0.5);
    ellipse(ctx, lx, ly, 1, 1.4, '#ffd060');
    ellipse(ctx, lx, ly - 1.4, 0.8, 0.4, GOLD_D);
  }
  deckCastle(ctx, x + w * 0.66, y - 5.8, 7, 3.6, false, true);
  figure(ctx, 'swordsman', 'england', x - w * 0.82, y - 17, 0.34, true);
  figure(ctx, 'archer', 'england', x + w * 0.66, y - 9.4, 0.34, true);
  // the beak-head with a gilt lion figurehead, and the bowsprit with its spritsail
  poly(ctx, [x + w * 0.9, top(0.9) + 1, x + w + 5.4, top(1) + 1.6, x + w + 5, top(1) + 3, x + w * 0.88, top(0.88) + 4], '#3a2a20');
  ellipse(ctx, x + w + 4.6, top(1) + 1.2, 1.4, 1.2, GOLD);
  line(ctx, x + w * 0.9, top(0.9) - 2, x + w + 9, top(1) - 10, WOOD_D, 1);
  squareSail(ctx, x + w + 5.4, top(1) - 6, 6, 4, false);
  line(ctx, x - w + 1.4, top(-1) + 2, x - w - 1.6, y + 4.6, WOOD, 1.2);
  foam(ctx, x, y + 3.2, w * 0.88);
}

function ship(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  if (kind === 'boat') cog(ctx, x, y);
  else if (kind === 'ship') carrack(ctx, x, y);
  else galleon(ctx, x, y);
}

// ---------------------------------------------------------------- buildings

/** A point on one face of a box(x, y, w, h), as faceQuad's (u, v). */
const fp = (f: 'L' | 'R', x: number, y: number, w: number, h: number, u: number, v: number): [number, number] => f === 'R'
  ? [x + (u * w) / 2, y + (w / 4) * (1 - u) - v * h]
  : [x - w / 2 + (u * w) / 2, y + (w / 4) * u - v * h];

/** A line drawn on a face of a box, from (u0, v0) to (u1, v1). */
function faceLine(ctx: Ctx, f: 'L' | 'R', x: number, y: number, w: number, h: number, u0: number, v0: number, u1: number, v1: number, c: string, wd: number) {
  line(ctx, ...fp(f, x, y, w, h, u0, v0), ...fp(f, x, y, w, h, u1, v1), c, wd);
}

/** A gabled roof with the gable end facing right (the ridge running back to the left), over a box (x, y, w) whose walls
 *  top out at y. Returns nothing; draws the near slope, the gable and the ridge. */
function gable(ctx: Ctx, x: number, y: number, w: number, rh: number, c: string, gableC: string, over = 1.2) {
  const hw = w / 2, hh = w / 4;
  const L0: [number, number] = [x - hw - over, y + over * 0.5], F0: [number, number] = [x, y + hh + over * 0.5], R0: [number, number] = [x + hw + over, y - over * 0.5], B0: [number, number] = [x, y - hh];
  // the ridge runs from the middle of the back-left edge to the middle of the front-right edge
  const ridgeA: [number, number] = [(L0[0] + B0[0]) / 2, (L0[1] + B0[1]) / 2 - rh], ridgeB: [number, number] = [(F0[0] + R0[0]) / 2, (F0[1] + R0[1]) / 2 - rh];
  // the gable end wall (a triangle over the right face)
  poly(ctx, [x, y + hh, x + hw, y, ridgeB[0], ridgeB[1] + 0.6], gableC);
  // the far slope just showing, then the near slope
  poly(ctx, [B0[0], B0[1] - 0.4, R0[0], R0[1], ridgeB[0], ridgeB[1], ridgeA[0], ridgeA[1]], shade(c, -0.25));
  poly(ctx, [L0[0], L0[1], F0[0], F0[1], ridgeB[0], ridgeB[1], ridgeA[0], ridgeA[1]], c);
  line(ctx, ridgeA[0], ridgeA[1], ridgeB[0], ridgeB[1], shade(c, -0.35), 0.7);
  return { ridgeA, ridgeB, L0, F0, R0 };
}

/** A half-timbered Tudor house: white plaster, black oak beams with braces, a jettied upper storey and a tiled gable. */
function tudorHouse(ctx: Ctx, x: number, y: number, w: number, h: number, roofC: string) {
  const g = h * 0.48;
  box(ctx, x, y, w, g, PLASTER, '#e6dfcc'); // the ground floor
  band(ctx, x, y, w, g, 0, 0.14, '#8a4a34'); // a brick plinth
  // the upper floor, jettied out over the lower
  const ux = x + 0.6, uy = y - g + 0.3, uw = w + 1.4, uh = h - g;
  box(ctx, ux, uy, uw, uh, PLASTER, '#e6dfcc');
  for (const [bx, by, bw, bh] of [[x, y, w, g], [ux, uy, uw, uh]] as const) {
    for (const f of ['L', 'R'] as const) {
      faceQuad(ctx, f, bx, by, bw, bh, 0, 1, 0, 0.1, BEAM); // the sill
      faceQuad(ctx, f, bx, by, bw, bh, 0, 1, 0.92, 1, BEAM); // the plate
      for (const u of [0, 0.32, 0.66, 0.96]) faceQuad(ctx, f, bx, by, bw, bh, u, u + 0.06, 0, 1, BEAM); // posts
    }
  }
  // braces on the upper storey, and close studding below
  for (const f of ['L', 'R'] as const) {
    faceLine(ctx, f, ux, uy, uw, uh, 0.06, 0.1, 0.32, 0.9, BEAM, 0.7);
    faceLine(ctx, f, ux, uy, uw, uh, 0.96, 0.1, 0.7, 0.9, BEAM, 0.7);
    for (const u of [0.16, 0.48, 0.82]) faceQuad(ctx, f, x, y, w, g, u, u + 0.04, 0.1, 0.92, BEAM);
  }
  // leaded windows and a plank door
  faceQuad(ctx, 'R', ux, uy, uw, uh, 0.4, 0.62, 0.3, 0.72, '#4a5a6a');
  faceLine(ctx, 'R', ux, uy, uw, uh, 0.4, 0.51, 0.62, 0.51, '#c8c0a8', 0.3);
  faceQuad(ctx, 'R', x, y, w, g, 0.56, 0.78, 0, 0.78, '#5a3a22');
  faceQuad(ctx, 'L', x, y, w, g, 0.38, 0.6, 0.36, 0.72, '#4a5a6a');
  faceQuad(ctx, 'L', ux, uy, uw, uh, 0.4, 0.58, 0.32, 0.7, '#4a5a6a');
  // the steep gable, its end wall also half-timbered
  const r = gable(ctx, ux, uy - uh, uw, w * 0.46, roofC, PLASTER);
  line(ctx, ux + uw / 4, uy - uh + uw / 8, r.ridgeB[0], r.ridgeB[1] + 0.6, BEAM, 0.7);
  line(ctx, ux, uy - uh + uw / 4, ux + uw / 2, uy - uh, BEAM, 0.7);
  for (let i = 1; i < 4; i++) { const t = i / 4; line(ctx, r.L0[0] + (r.ridgeA[0] - r.L0[0]) * t, r.L0[1] + (r.ridgeA[1] - r.L0[1]) * t, r.F0[0] + (r.ridgeB[0] - r.F0[0]) * t, r.F0[1] + (r.ridgeB[1] - r.F0[1]) * t, shade(roofC, -0.18), 0.35); } // tile courses
  // a tall brick chimney stack
  const cx = r.ridgeA[0] + 1.6, cy = r.ridgeA[1] + 2.4;
  box(ctx, cx, cy, 2.2, 3.6, '#9a4a34');
  band(ctx, cx, cy, 2.2, 3.6, 0.82, 0.9, '#6a2e20');
  ellipse(ctx, cx + 0.6, cy - 5, 1.2, 0.6, 'rgba(200,200,200,0.4)');
}

/** A thatched cottage: low cob walls washed cream, a deep rounded thatch with a ridge pattern, a little porch and roses. */
function cottage(ctx: Ctx, x: number, y: number, w: number, h: number) {
  box(ctx, x, y, w, h, '#efe2c0', '#e0d2ae');
  faceQuad(ctx, 'R', x, y, w, h, 0.3, 0.48, 0, 0.74, '#3a5a3a'); // a green door
  faceQuad(ctx, 'R', x, y, w, h, 0.66, 0.86, 0.36, 0.7, '#4a5a6a');
  faceQuad(ctx, 'L', x, y, w, h, 0.4, 0.6, 0.36, 0.7, '#4a5a6a');
  for (const [u, v] of [[0.6, 0.1], [0.92, 0.2], [0.16, 0.16]] as const) { const [px, py] = fp('R', x, y, w, h, u, v); ellipse(ctx, px, py, 1.4, 1.2, '#3a7a34'); ellipse(ctx, px - 0.3, py - 0.4, 0.5, 0.5, '#e05070'); } // climbing roses
  // the thatch: a rounded hipped roof, thick at the eaves
  const hw = w / 2 + 1.6, hh = w / 4 + 0.8, ty = y - h + 1, rh = w * 0.5;
  poly(ctx, [x - hw, ty, x, ty + hh, x + hw, ty, x + hw * 0.3, ty - rh, x - hw * 0.3, ty - rh - hh * 0.4], THATCH);
  poly(ctx, [x, ty + hh, x + hw, ty, x + hw * 0.3, ty - rh, x + 0.4, ty - rh * 0.4], THATCH_D);
  ctx.save();
  clipPoly(ctx, [x - hw, ty, x, ty + hh, x + hw, ty, x + hw * 0.3, ty - rh, x - hw * 0.3, ty - rh - hh * 0.4]);
  for (let i = 0; i < 14; i++) { const t = i / 13; line(ctx, x - hw + 2 * hw * t, ty + (t < 0.5 ? hh * t * 2 : hh * (2 - t * 2)), x - hw * 0.3 + hw * 0.6 * t, ty - rh - hh * 0.4 * (1 - t), 'rgba(90,60,20,0.25)', 0.35); }
  ctx.restore();
  // the eaves' thick edge and the patterned ridge
  ctx.strokeStyle = ink(shade(THATCH, 0.2));
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x - hw, ty); ctx.quadraticCurveTo(x - hw / 2, ty + hh * 0.9, x, ty + hh); ctx.quadraticCurveTo(x + hw / 2, ty + hh * 0.9, x + hw, ty);
  ctx.stroke();
  line(ctx, x - hw * 0.3, ty - rh - hh * 0.4, x + hw * 0.3, ty - rh, shade(THATCH, -0.3), 1.6);
  for (let i = 0; i < 5; i++) { const t = (i + 0.5) / 5; const px = x - hw * 0.3 + hw * 0.6 * t, py = ty - rh - hh * 0.4 * (1 - t); poly(ctx, [px - 0.8, py + 0.6, px + 0.8, py + 0.6, px, py + 2], shade(THATCH, -0.3)); }
  // a brick chimney through the thatch
  box(ctx, x - hw * 0.2, ty - rh + 0.4, 2, 3.6, '#9a4a34');
}

/** A Perpendicular parish church: a grey flint-and-stone nave with a lead roof and a square battlemented west tower
 *  with corner pinnacles, a weathercock, and a yew in the churchyard. */
function church(ctx: Ctx, x: number, y: number) {
  box(ctx, x - 2, y + 1, 15, 8, STONE, '#cac4b4');
  for (let i = 0; i < 3; i++) faceQuad(ctx, 'L', x - 2, y + 1, 15, 8, 0.12 + i * 0.3, 0.24 + i * 0.3, 0.3, 0.78, '#3a3a44'); // tall windows
  for (let i = 0; i < 3; i++) faceQuad(ctx, 'L', x - 2, y + 1, 15, 8, 0.17 + i * 0.3, 0.19 + i * 0.3, 0.3, 0.78, STONE);
  faceQuad(ctx, 'R', x - 2, y + 1, 15, 8, 0.36, 0.64, 0.3, 0.8, '#3a3a44'); // the east window
  faceLine(ctx, 'R', x - 2, y + 1, 15, 8, 0.5, 0.3, 0.5, 0.8, STONE, 0.5);
  gable(ctx, x - 2, y - 7, 15, 6, LEAD, STONE, 0.8);
  line(ctx, x + 5.5, y - 3.4, x + 5.5, y - 9, STONE, 0.6); // the cross on the east gable
  line(ctx, x + 4.6, y - 8, x + 6.4, y - 8, STONE, 0.6);
  // the west tower behind, to the left
  const tx = x - 8, ty = y - 2, tw = 7, th = 21;
  box(ctx, tx, ty, tw, th, STONE, '#cac4b4');
  for (const v of [0.3, 0.62]) band(ctx, tx, ty, tw, th, v, v + 0.03, shade(STONE, -0.2)); // string courses
  for (const f of ['L', 'R'] as const) {
    faceQuad(ctx, f, tx, ty, tw, th, 0.34, 0.66, 0.68, 0.86, '#2a2a30'); // belfry louvres
    for (let i = 0; i < 3; i++) faceQuad(ctx, f, tx, ty, tw, th, 0.34, 0.66, 0.7 + i * 0.05, 0.72 + i * 0.05, '#7a7468');
    faceQuad(ctx, f, tx, ty, tw, th, 0, 0.1, 0, 1, shade(STONE, 0.08)); // buttresses at the corners
    faceQuad(ctx, f, tx, ty, tw, th, 0.9, 1, 0, 1, shade(STONE, 0.08));
  }
  faceQuad(ctx, 'R', tx, ty, tw, th, 0.36, 0.64, 0, 0.18, '#3a2a20'); // the west door
  // battlements and four pinnacles
  const hw = tw / 2, hh = tw / 4, top = ty - th;
  for (let i = 0; i < 3; i++) {
    const t = (i + 0.5) / 3;
    box(ctx, tx - hw + hw * t, top + hh * t + 0.2, tw * 0.18, 1.6, STONE);
    box(ctx, tx + hw * t, top + hh * (1 - t) + 0.2, tw * 0.18, 1.6, STONE);
  }
  for (const [px, py] of [[tx - hw, top], [tx, top + hh], [tx + hw, top], [tx, top - hh]] as const) {
    box(ctx, px, py + 0.2, 1.2, 2.4, STONE);
    poly(ctx, [px - 0.7, py - 2.2, px + 0.7, py - 2.2, px, py - 5.4], shade(STONE, -0.1));
  }
  line(ctx, tx, top - hh, tx, top - hh - 6, '#2a2a30', 0.5);
  poly(ctx, [tx - 1.6, top - hh - 5.8, tx + 1.4, top - hh - 6.6, tx + 0.6, top - hh - 5], GOLD); // the weathercock
  // the churchyard yew and a headstone
  ellipse(ctx, x + 9.6, y + 5, 3.4, 4.6, '#1e3a24');
  ellipse(ctx, x + 9, y + 3.6, 1.8, 2, '#2e5034');
  box(ctx, x + 5, y + 8, 1.6, 2, '#a8a294');
}

/** The capital: a square white keep with four corner turrets under lead onion cupolas, a battlemented curtain wall with
 *  drum towers and a gatehouse, the royal banner over the keep. */
function keep(ctx: Ctx, x: number, y: number) {
  ellipse(ctx, x, y + 7, 27, 8, 'rgba(0,0,0,0.14)');
  // the curtain wall and its towers
  const wallC = '#c8c0ae';
  box(ctx, x, y + 3, 30, 5, wallC, '#d8d0be');
  for (const f of ['L', 'R'] as const) for (let i = 0; i < 10; i++) faceQuad(ctx, f, x, y - 2, 30, 1.6, i / 10 + 0.02, i / 10 + 0.07, 0, 1, wallC);
  const drum = (dx: number, dy: number, r: number, hgt: number) => {
    const cx = x + dx, cy = y + dy;
    ellipse(ctx, cx, cy, r, r * 0.5, shade(wallC, -0.2));
    poly(ctx, [cx - r, cy, cx - r, cy - hgt, cx + r, cy - hgt, cx + r, cy], wallC);
    poly(ctx, [cx + r * 0.2, cy + r * 0.5, cx + r * 0.2, cy - hgt, cx + r, cy - hgt, cx + r, cy], shade(wallC, -0.18));
    ellipse(ctx, cx, cy - hgt, r, r * 0.5, shade(wallC, 0.12));
    for (let i = 0; i < 5; i++) { const a = Math.PI * (0.05 + i * 0.22); box(ctx, cx + Math.cos(a) * r * 0.8, cy - hgt + Math.sin(a) * r * 0.4, 1.1, 1.4, wallC); }
    line(ctx, cx - r * 0.3, cy - hgt * 0.7, cx - r * 0.3, cy - hgt * 0.45, '#2a2a30', 0.6); // an arrow slit
  };
  drum(-15, 3, 3, 9);
  drum(15, 3, 3, 9);
  drum(0, 10.5, 3.2, 8);
  // the gatehouse, a portcullis
  faceQuad(ctx, 'R', x, y + 3, 30, 5, 0.3, 0.4, 0, 0.9, '#2a2420');
  for (const u of [0.32, 0.35, 0.38]) faceQuad(ctx, 'R', x, y + 3, 30, 5, u, u + 0.008, 0.1, 0.9, '#6a6a70');
  // the keep: tall, square, pale Caen stone, with pilaster strips and round-headed windows
  const kx = x - 1, ky = y - 1, kw = 19, kh = 15;
  box(ctx, kx, ky, kw, kh, STONE_L, '#f0ead8');
  for (const f of ['L', 'R'] as const) {
    for (const u of [0, 0.33, 0.66, 0.94]) faceQuad(ctx, f, kx, ky, kw, kh, u, u + 0.06, 0, 1, shade(STONE_L, 0.06)); // pilasters
    for (const u of [0.13, 0.46, 0.76]) for (const v of [0.4, 0.72]) {
      faceQuad(ctx, f, kx, ky, kw, kh, u, u + 0.09, v, v + 0.1, '#3a3a44');
      const [ax, ay] = fp(f, kx, ky, kw, kh, u + 0.045, v + 0.1);
      ellipse(ctx, ax, ay, kw * 0.022, 0.7, '#3a3a44');
    }
  }
  band(ctx, kx, ky, kw, kh, 0, 0.08, shade(STONE_L, -0.12)); // the battered plinth
  // battlements
  const hw = kw / 2, hh = kw / 4, top = ky - kh;
  for (let i = 0; i < 5; i++) {
    const t = (i + 0.5) / 5;
    box(ctx, kx - hw + hw * t, top + hh * t + 0.2, kw * 0.1, 1.8, STONE_L);
    box(ctx, kx + hw * t, top + hh * (1 - t) + 0.2, kw * 0.1, 1.8, STONE_L);
  }
  // the four corner turrets: square shafts rising above the walls, capped by lead onion domes with gilt vanes
  const turret = (px: number, py: number, s: number) => {
    box(ctx, px, py + 1, 3.4 * s, 6 * s, STONE_L);
    faceQuad(ctx, 'R', px, py + 1, 3.4 * s, 6 * s, 0.4, 0.6, 0.4, 0.66, '#3a3a44');
    const cy = py + 1 - 6 * s;
    ellipse(ctx, px, cy, 2.2 * s, 1 * s, shade(LEAD, -0.2));
    ctx.beginPath();
    ctx.moveTo(px - 2.2 * s, cy);
    ctx.bezierCurveTo(px - 2.8 * s, cy - 2.6 * s, px - 0.4 * s, cy - 3 * s, px, cy - 5 * s);
    ctx.bezierCurveTo(px + 0.4 * s, cy - 3 * s, px + 2.8 * s, cy - 2.6 * s, px + 2.2 * s, cy);
    ctx.closePath();
    ctx.fillStyle = ink(LEAD);
    ctx.fill();
    poly(ctx, [px + 0.2 * s, cy - 4.6 * s, px + 2.2 * s, cy, px + 0.4 * s, cy + 0.6 * s], shade(LEAD, -0.25));
    ellipse(ctx, px - 0.9 * s, cy - 1.6 * s, 0.5 * s, 0.9 * s, shade(LEAD, 0.35));
    line(ctx, px, cy - 5 * s, px, cy - 7.4 * s, GOLD_D, 0.5);
    poly(ctx, [px, cy - 7.4 * s, px + 1.8 * s, cy - 7 * s, px, cy - 6.4 * s], GOLD);
  };
  turret(kx, top - hh, 0.9); // the back corner
  turret(kx - hw, top, 1);
  turret(kx + hw, top, 1);
  turret(kx, top + hh, 1.08); // the front corner
  // the royal banner on the roof, St George on a drum tower
  line(ctx, kx - 3, top + 1, kx - 3, top - 15, WOOD_D, 0.8);
  royalBanner(ctx, kx - 3, top - 15, 10, 7, 0.8);
  line(ctx, x + 15, y - 6, x + 15, y - 14, WOOD_D, 0.6);
  stGeorge(ctx, x + 15, y - 14, 5.4, 3.6, 0.3);
}

function building(ctx: Ctx, x: number, y: number, big: boolean, roofC: string, capital: boolean) {
  if (big && capital) {
    ctx.save();
    ctx.translate(x, y + 2);
    ctx.scale(0.8, 0.8);
    keep(ctx, 0, 0);
    ctx.restore();
    return;
  }
  if (big) { church(ctx, x, y); return; }
  const v = ((Math.round(x) * 7 + Math.round(y) * 3) % 4 + 4) % 4;
  if (v === 0) tudorHouse(ctx, x, y, 10, 8.4, roofC);
  else if (v === 1) cottage(ctx, x, y, 10, 5);
  else if (v === 2) { tudorHouse(ctx, x - 2.6, y - 1.4, 8, 7, roofC); cottage(ctx, x + 4.6, y + 2.8, 7, 4.2); }
  else tudorHouse(ctx, x, y, 10.4, 9, mix(roofC, '#5a5a62', 0.35));
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
  const type = ['oak', 'hedge', 'apple', 'oak', 'oak', 'apple', 'hedge', 'oak', 'apple'][variant % 9];
  if (type === 'oak') {
    // an English oak: a short massive trunk, crooked spreading limbs, a broad billowing crown, acorns at its feet
    const bk = '#5a4a3a', g = mix(P.forest, '#3a6a2a', 0.5);
    line(ctx, x, y, x, y - 7 * k, shade(bk, -0.2), 3.6 * k);
    line(ctx, x - 0.9 * k, y, x - 0.9 * k, y - 7 * k, bk, 1.4 * k);
    for (const [ex, ey] of [[-7, -11], [7, -12], [-3, -14], [3.4, -15]] as const) curve(ctx, x, y - 6 * k, x + ex * 0.3 * k, y - 10 * k, x + ex * k, y + ey * k, 1.3 * k, bk);
    clumps(ctx, x, y, k, g, [[-7, -12, 4.4, 3.4, -0.12], [7, -12.6, 4.4, 3.4, -0.16], [0, -13, 6.4, 4, -0.04], [-4, -16.6, 4.6, 3.2, 0.06], [3.6, -17, 4.4, 3.2, 0.03], [0, -19.6, 3.8, 2.6, 0.12]]);
    for (let i = 0; i < 4; i++) { const a = rand(variant + 2, i) * Math.PI * 2; ellipse(ctx, x + Math.cos(a) * 4 * k, y + 1 * k + Math.sin(a) * 1.2 * k, 0.4 * k, 0.5 * k, '#8a6a3a'); }
    return;
  }
  if (type === 'hedge') {
    // a hawthorn hedgerow: a long low hedge laid along a bank, starred with white may blossom, a hawthorn standing out of it
    const g = mix(P.forest, '#3a6a2a', 0.4);
    ellipse(ctx, x, y + 0.6 * k, 10 * k, 3 * k, 'rgba(60,40,20,0.25)');
    for (let i = 0; i < 6; i++) {
      const t = i / 5, hx = x - 9 * k + t * 18 * k, hy = y - 2.4 * k + (t - 0.5) * 4 * k;
      ellipse(ctx, hx, hy + 1 * k, 3.2 * k, 2.6 * k, shade(g, -0.3));
      ellipse(ctx, hx, hy, 3.2 * k, 2.6 * k, shade(g, -0.05 + (i % 2) * 0.06));
      ellipse(ctx, hx - 0.8 * k, hy - 1 * k, 1.6 * k, 1 * k, shade(g, 0.16));
    }
    // the hawthorn tree rising from it
    line(ctx, x + 1 * k, y - 2 * k, x + 0.6 * k, y - 8 * k, '#4a3a30', 1.4 * k);
    clumps(ctx, x + 0.6 * k, y, k, g, [[-2.6, -9.6, 3, 2.4, -0.06], [2.6, -10, 3, 2.4, -0.1], [0, -12.4, 3.4, 2.6, 0.04]]);
    for (let i = 0; i < 26; i++) { // may blossom
      const a = rand(variant + 3, i), b = rand(variant + 7, i);
      const px = i < 14 ? x - 9 * k + a * 18 * k : x + 0.6 * k + (a - 0.5) * 7 * k;
      const py = i < 14 ? y - 3 * k + (a - 0.5) * 4 * k - b * 3 * k : y - 9 * k - b * 4.6 * k;
      ellipse(ctx, px, py, 0.5 * k, 0.45 * k, i % 5 ? '#fbf6ee' : '#f4c8d0');
    }
    return;
  }
  // an apple tree in an orchard: a low, open, rounded crown on a short trunk, red apples, windfalls in the grass
  const bk = '#6a5040', g = mix(P.forest, '#4a8a3a', 0.55);
  line(ctx, x, y, x - 0.4 * k, y - 5 * k, bk, 1.8 * k);
  curve(ctx, x - 0.4 * k, y - 4.6 * k, x - 3 * k, y - 6 * k, x - 4.6 * k, y - 8.6 * k, 1 * k, bk);
  curve(ctx, x - 0.4 * k, y - 4.6 * k, x + 2.6 * k, y - 6 * k, x + 4.4 * k, y - 9 * k, 1 * k, bk);
  clumps(ctx, x, y, k, g, [[-4, -9.4, 3.6, 2.8, -0.1], [4, -9.8, 3.6, 2.8, -0.14], [0, -11.4, 4.6, 3.4, 0], [-1.6, -13.8, 3, 2.2, 0.1], [2, -13.4, 2.8, 2.2, 0.08]]);
  for (let i = 0; i < 10; i++) {
    const a = rand(variant + 5, i) * Math.PI * 2, r = 1.4 + rand(variant + 11, i) * 4.4;
    const ox = x + Math.cos(a) * r * k, oy = y - 11 * k + Math.sin(a) * r * 0.6 * k;
    ellipse(ctx, ox, oy, 0.8 * k, 0.8 * k, i % 4 ? '#d0302a' : '#d8b030');
    ellipse(ctx, ox - 0.25 * k, oy - 0.3 * k, 0.3 * k, 0.3 * k, '#ff9a80');
  }
  for (const [dx, dy] of [[2.8, 0.8], [-3.2, 1.4], [0.6, 2]] as const) ellipse(ctx, x + dx * k, y + dy * k, 0.7 * k, 0.6 * k, '#c0302a');
}

// ---------------------------------------------------------------- whole units

function unit(ctx: Ctx, kind: UnitKind, x: number, y: number): boolean {
  switch (kind) {
    case 'archer': archer(ctx, x, y); return true;
    case 'longbowman': longbowman(ctx, x, y); return true;
    case 'rider': horseman(ctx, 'rider', x, y); return true;
    case 'knight': horseman(ctx, 'knight', x, y); return true;
    case 'catapult': bombard(ctx, x, y); return true;
    case 'boat': case 'ship': case 'warship': ship(ctx, kind, x, y); return true;
    default: return false;
  }
}

registerArt('england', {
  unit,
  dress: (kind) => dress(kind),
  torso,
  face,
  head,
  weapon,
  shield: (ctx, kind, x, y, k) => { heater(ctx, x, y, k, kind === 'defender' ? 'lions' : 'cross'); return true; },
  building,
  tree,
});

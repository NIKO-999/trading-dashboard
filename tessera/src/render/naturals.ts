// Drawing side of the Natural Wonders (see game/naturals): eight landmarks, each drawn from flat-shaded polygons in the
// map's own style (original art, nothing traced). They are part of the static map layer, so they show in the cached
// map and in the iOS photo. Every one carries a small gold glint so it reads as something special at phone size, and
// a wonder glimpsed past the known map shows as a pillar of light rising through the clouds over it.
import { naturalAt } from '../data/naturals';
import { glimpsed } from '../game/naturals';
import type { GameState, Tile } from '../game/types';
import { TH, WATER_DROP, tileTop } from './camera';
import { HH, HW } from './common';
import { ellipse, line, poly, shade, softShadow, type Ctx } from './prims';

/** How far above its tile centre each wonder reaches (world px), for fitting icons. */
const HEIGHT: Record<string, number> = { falls: 38, grotto: 30, peak: 62, elder: 54, reef: 12, flats: 12, springs: 46, glacier: 58 };

/** A four-pointed gold glint: the mark of a wonder. */
function glint(ctx: Ctx, x: number, y: number, r: number, color = '#ffe27a') {
  poly(ctx, [x, y - r, x + r * 0.26, y - r * 0.26, x + r, y, x + r * 0.26, y + r * 0.26, x, y + r, x - r * 0.26, y + r * 0.26, x - r, y, x - r * 0.26, y - r * 0.26], color);
  ellipse(ctx, x, y, r * 0.22, r * 0.22, '#ffffff');
}

/** A crystal prism leaning by `lean`, lit from the left. */
function crystal(ctx: Ctx, x: number, y: number, h: number, w: number, col: string, lean = 0) {
  const tx = x + lean, ty = y - h;
  poly(ctx, [x - w, y, x - w * 0.9 + lean * 0.8, y - h * 0.7, tx, ty, x + lean * 0.3, y + w * 0.35], shade(col, 0.2));
  poly(ctx, [x + lean * 0.3, y + w * 0.35, tx, ty, x + w * 0.9 + lean * 0.8, y - h * 0.7, x + w, y], shade(col, -0.22));
  line(ctx, x - w * 0.45 + lean * 0.4, y - h * 0.25, tx - lean * 0.1, ty + h * 0.2, shade(col, 0.6), Math.max(0.5, w * 0.18));
}

/** A puff of steam or spray. */
function puff(ctx: Ctx, x: number, y: number, r: number, alpha: number) {
  ctx.globalAlpha = alpha;
  ellipse(ctx, x, y, r, r * 0.8, '#ffffff');
  ellipse(ctx, x - r * 0.55, y + r * 0.2, r * 0.7, r * 0.55, '#ffffff');
  ellipse(ctx, x + r * 0.6, y + r * 0.25, r * 0.65, r * 0.5, '#ffffff');
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- the eight wonders (feet at the tile centre)

/** Thundermantle Falls: a mossy cliff with a white veil of water pouring into a green-blue pool. */
function falls(ctx: Ctx, x: number, y: number) {
  softShadow(ctx, x, y + 6, 28, 11, 0.22);
  const rock = '#8d8472';
  poly(ctx, [x - 27, y + 3, x - 25, y - 20, x - 13, y - 31, x - 2, y - 27, x - 2, y + 7], shade(rock, 0.06));
  poly(ctx, [x - 2, y - 27, x + 10, y - 35, x + 24, y - 22, x + 27, y + 3, x - 2, y + 7], shade(rock, -0.26));
  // strata on the faces
  for (const k of [0.35, 0.65]) {
    line(ctx, x - 26, y + 3 - 23 * k, x - 2, y + 7 - 34 * k, shade(rock, -0.12), 0.8);
    line(ctx, x - 2, y + 7 - 34 * k, x + 26, y + 3 - 25 * k, shade(rock, -0.42), 0.8);
  }
  // moss and ferns along the top
  poly(ctx, [x - 25, y - 20, x - 13, y - 31, x - 2, y - 27, x + 10, y - 35, x + 24, y - 22, x + 12, y - 25, x - 2, y - 22, x - 14, y - 25], '#5a9a45');
  poly(ctx, [x - 13, y - 31, x - 2, y - 27, x + 10, y - 35, x + 3, y - 29, x - 6, y - 27], '#79b95a');
  for (const [ox, oy] of [[-19, -24], [17, -27], [-8, -27]] as const) {
    ellipse(ctx, x + ox, y + oy, 4, 2.6, '#3f7f3a');
    ellipse(ctx, x + ox - 1, y + oy - 1, 2.6, 1.6, '#62a64d');
  }
  // the pool
  ellipse(ctx, x + 1, y + 10, 15, 5.4, '#2f8fb8');
  ellipse(ctx, x + 1, y + 9.4, 13.5, 4.5, '#4fc0e0');
  ellipse(ctx, x + 5, y + 10, 5, 1.6, '#8fe3f5');
  // the veil of water: a broad ribbon with streaks, lit on its left
  poly(ctx, [x - 8, y - 27, x + 4, y - 29, x + 6, y + 6, x - 8, y + 6], '#e3f7ff');
  poly(ctx, [x + 0, y - 28, x + 4, y - 29, x + 6, y + 6, x + 1, y + 6], '#b9e6f7');
  for (const ox of [-5, -2, 2]) line(ctx, x + ox, y - 26, x + ox + 0.6, y + 4, '#9ed6ee', 0.7);
  line(ctx, x - 8, y - 27, x + 4, y - 29, '#ffffff', 1.4); // the lip
  // foam and spray at the foot
  for (const [ox, oy, r] of [[-7, 6, 3.4], [-1, 7.5, 4], [6, 6.5, 3.2], [2, 4.5, 2.6]] as const) ellipse(ctx, x + ox, y + oy, r, r * 0.55, '#ffffff');
  puff(ctx, x - 10, y + 1, 4, 0.55);
  puff(ctx, x + 10, y, 3.4, 0.45);
  glint(ctx, x + 19, y - 32, 4.2);
}

/** Glimmerdeep Grotto: a low rock dome split by a dark cave mouth, bristling with bright crystals. */
function grotto(ctx: Ctx, x: number, y: number) {
  softShadow(ctx, x, y + 5, 28, 11, 0.22);
  const rock = '#8b8499';
  poly(ctx, [x - 28, y + 4, x - 20, y - 14, x - 6, y - 22, x + 1, y - 20, x + 1, y + 10], shade(rock, 0.08));
  poly(ctx, [x + 1, y - 20, x + 12, y - 21, x + 24, y - 11, x + 28, y + 4, x + 1, y + 10], shade(rock, -0.24));
  poly(ctx, [x - 20, y - 14, x - 6, y - 22, x + 12, y - 21, x + 2, y - 17, x - 9, y - 17], shade(rock, 0.24));
  // the cave mouth, lit from inside
  ctx.beginPath();
  ctx.moveTo(x - 10, y + 7);
  ctx.quadraticCurveTo(x - 10, y - 12, x + 1, y - 12);
  ctx.quadraticCurveTo(x + 12, y - 12, x + 11, y + 8);
  ctx.closePath();
  ctx.fillStyle = '#2a2140';
  ctx.fill();
  ellipse(ctx, x + 0.5, y + 4, 7, 3.2, '#4a3a78');
  crystal(ctx, x - 3, y + 5, 9, 2.2, '#b58cf2', -1);
  crystal(ctx, x + 3, y + 6, 7, 1.9, '#6fe3f2', 1);
  crystal(ctx, x + 0.5, y + 6.5, 11, 2.4, '#e9d8ff', 0);
  // crystals breaking out of the rock
  crystal(ctx, x - 17, y + 2, 15, 3.4, '#6fe3f2', -3);
  crystal(ctx, x - 12, y + 5, 10, 2.6, '#b58cf2', -1);
  crystal(ctx, x + 17, y + 3, 17, 3.6, '#b58cf2', 3);
  crystal(ctx, x + 22, y + 6, 9, 2.4, '#f29ce0', 2);
  crystal(ctx, x + 8, y - 17, 13, 3, '#6fe3f2', 1.5);
  crystal(ctx, x - 5, y - 18, 9, 2.4, '#f29ce0', -1);
  glint(ctx, x + 12, y - 34, 4);
}

/** Mount Halcyra: a lone violet-grey spire with a snow crown, wreathed in cloud and circled by a ring of light. */
function peak(ctx: Ctx, x: number, y: number) {
  softShadow(ctx, x, y + 6, 28, 11, 0.24);
  const L = '#b0aac4', R = '#7d7694';
  const ring = (a0: number, a1: number) => {
    ctx.beginPath();
    ctx.ellipse(x + 1, y - 46, 13, 4, -0.08, a0, a1);
    ctx.strokeStyle = '#ffd54a';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  };
  ring(Math.PI, Math.PI * 2); // the back of the ring, behind the peak
  // two shoulders, then the spire
  poly(ctx, [x - 28, y + 3, x - 18, y - 16, x - 8, y + 8], shade(L, -0.04));
  poly(ctx, [x - 18, y - 16, x - 8, y + 8, x - 4, y - 2], shade(R, 0.04));
  poly(ctx, [x + 28, y + 2, x + 19, y - 13, x + 8, y + 9], shade(R, -0.08));
  poly(ctx, [x + 19, y - 13, x + 14, y - 2, x + 8, y + 9], shade(L, -0.1));
  poly(ctx, [x + 1, y - 62, x - 17, y + 6, x + 1, y + 13], L);
  poly(ctx, [x + 1, y - 62, x + 1, y + 13, x + 18, y + 5], R);
  // the snow crown, with a ragged hem
  poly(ctx, [x + 1, y - 62, x - 6.5, y - 34, x - 3, y - 36, x + 1, y - 31], '#f6f8ff');
  poly(ctx, [x + 1, y - 62, x + 1, y - 31, x + 4, y - 35, x + 7.5, y - 33], '#c9d8f2');
  // a band of cloud around the waist
  puff(ctx, x - 10, y - 16, 5.5, 0.85);
  puff(ctx, x + 11, y - 12, 4.5, 0.75);
  ring(0, Math.PI); // the front of the ring
  ellipse(ctx, x + 1, y - 62, 2.2, 2.2, '#fff3b0');
  glint(ctx, x + 14, y - 52, 4.4);
}

/** The Hollowcrown Elder: a vast old tree on flared roots, with a hollow in its trunk and a wide layered crown. */
function elder(ctx: Ctx, x: number, y: number) {
  softShadow(ctx, x + 1, y + 6, 27, 11, 0.28);
  const bark = '#80532f';
  // roots
  for (const [ex, ey] of [[-16, 8], [15, 7], [-6, 12], [8, 12]] as const) poly(ctx, [x - 4, y - 4, x + ex, y + ey, x + ex * 0.6 + 3, y + ey - 1.5, x + 4, y - 4], ex < 0 ? shade(bark, 0.08) : shade(bark, -0.2));
  // the trunk
  poly(ctx, [x - 8, y + 6, x - 5, y - 26, x + 1, y - 26, x + 1, y + 8], shade(bark, 0.08));
  poly(ctx, [x + 1, y + 8, x + 1, y - 26, x + 6, y - 26, x + 8, y + 6], shade(bark, -0.22));
  for (const oy of [-4, -12, -19]) line(ctx, x - 5, y + oy, x - 2, y + oy - 3, shade(bark, -0.25), 0.8);
  // the hollow
  ellipse(ctx, x - 1.5, y - 6, 3.2, 4.6, '#3a2415');
  ellipse(ctx, x - 1.2, y - 4.6, 2, 2.4, '#1f130a');
  // limbs
  line(ctx, x - 3, y - 22, x - 16, y - 32, shade(bark, 0.05), 3);
  line(ctx, x + 3, y - 22, x + 17, y - 30, shade(bark, -0.18), 3);
  // the crown: dark back, mid and lit front layers
  const blobs: [number, number, number, number, string][] = [
    [-15, -36, 14, 9, '#2f6b39'], [15, -35, 14, 9, '#285f33'], [0, -46, 17, 10, '#2f6b39'],
    [-12, -38, 12, 7.5, '#3f8a45'], [12, -37, 12, 7.5, '#357a3e'], [0, -44, 14, 8, '#46964b'], [0, -33, 16, 8, '#3f8a45'],
    [-10, -41, 7, 4, '#5eab52'], [4, -48, 8, 4.4, '#6cb85c'], [-3, -35, 7, 3.6, '#5eab52'],
  ];
  for (const [ox, oy, rx, ry, c] of blobs) ellipse(ctx, x + ox, y + oy, rx, ry, c);
  // golden leaves of great age
  for (const [ox, oy] of [[-18, -35], [9, -42], [16, -33], [-6, -49], [3, -31], [-13, -30]] as const) ellipse(ctx, x + ox, y + oy, 1.3, 1, '#f2d25a');
  glint(ctx, x + 20, y - 49, 4.2);
}

/** The Opaline Reef: a bright lagoon ringed with surf, full of coral in every colour. */
function reef(ctx: Ctx, x: number, y: number) {
  const wy = y + WATER_DROP;
  ctx.globalAlpha = 0.85;
  ellipse(ctx, x, wy + 1, 24, 11, '#9ff0e2');
  ctx.globalAlpha = 1;
  ellipse(ctx, x + 2, wy + 1.5, 16, 7, '#c8f7ec');
  // a broken ring of surf
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const a0 = (i / 7) * Math.PI * 2 + 0.2, a1 = a0 + 0.55;
    ctx.beginPath();
    ctx.ellipse(x, wy + 1, 24, 11, 0, a0, a1);
    ctx.stroke();
  }
  // brain coral mounds
  for (const [ox, oy, r, c] of [[-11, -1, 4.4, '#f7a35c'], [9, 4, 3.8, '#c59cf0'], [-2, 6, 3.4, '#ffd25a']] as const) {
    ellipse(ctx, x + ox, wy + oy + 0.8, r, r * 0.55, shade(c, -0.3));
    ellipse(ctx, x + ox, wy + oy, r, r * 0.6, c);
    line(ctx, x + ox - r * 0.6, wy + oy - 0.3, x + ox + r * 0.6, wy + oy - 0.8, shade(c, -0.25), 0.6);
  }
  // branching staghorn and fan corals
  const stag = (bx: number, by: number, c: string) => {
    for (const [dx, dy] of [[-3.5, -7], [0, -9], [3.5, -6.5], [-1.5, -4]] as const) {
      line(ctx, x + bx, wy + by, x + bx + dx, wy + by + dy, c, 1.5);
      ellipse(ctx, x + bx + dx, wy + by + dy, 1.1, 1.1, shade(c, 0.35));
    }
  };
  stag(-4, 1, '#ff7fa8');
  stag(13, -2, '#ff9f4a');
  stag(-15, 5, '#b07ce8');
  poly(ctx, [x + 4, wy - 1, x + 1, wy - 8, x + 5, wy - 11, x + 9, wy - 7], '#ff6f91'); // a sea fan
  line(ctx, x + 5, wy - 1, x + 5, wy - 9, shade('#ff6f91', -0.3), 0.6);
  glint(ctx, x + 17, wy - 12, 3.8);
}

/** The Skymirror Flats: a plate of white salt cracked into cells, holding a reflected sky with a cloud in it. */
function flats(ctx: Ctx, x: number, y: number) {
  const k = 0.86;
  poly(ctx, [x, y - HH * k, x + HW * k, y, x, y + HH * k, x - HW * k, y], '#f3efe6');
  poly(ctx, [x, y + HH * k, x + HW * k, y, x + HW * k, y + 1.4, x, y + HH * k + 1.4], '#d8cfbf'); // a thin lip on the near edges
  poly(ctx, [x, y + HH * k, x - HW * k, y, x - HW * k, y + 1.4, x, y + HH * k + 1.4], '#e4dccd');
  // the mirror: the sky and a cloud lying on the ground
  ellipse(ctx, x + 2, y + 1, 17, 7.4, '#a9d8f2');
  ellipse(ctx, x + 1, y + 0.4, 13, 5.2, '#c9e8f8');
  ellipse(ctx, x - 2, y + 2.4, 9, 2.4, '#f4d6ea'); // a blush of dawn
  for (const [ox, oy, r] of [[-3, -0.5, 3.4], [1.5, -1.2, 2.6], [5, -0.2, 2.2]] as const) ellipse(ctx, x + ox, y + oy, r, r * 0.5, '#ffffff');
  // salt cells: a net of fine cracks
  const cracks: [number, number, number, number][] = [
    [-22, -1, -13, 3], [-13, 3, -10, 9], [-13, 3, -9, -4], [-9, -4, 0, -8], [-9, -4, -6, -10],
    [14, -5, 21, 0], [14, -5, 10, -10], [14, -5, 17, 5], [17, 5, 9, 9], [17, 5, 23, 1],
  ];
  for (const [a, b, c, d] of cracks) line(ctx, x + a, y + b, x + c, y + d, '#d2c8b6', 0.7);
  // little cones of raked salt at the back
  for (const [ox, oy] of [[-14, -6], [-9, -8.5]] as const) {
    poly(ctx, [x + ox - 3.4, y + oy, x + ox, y + oy - 5.5, x + ox, y + oy + 1.2], '#ffffff');
    poly(ctx, [x + ox, y + oy - 5.5, x + ox + 3.4, y + oy, x + ox, y + oy + 1.2], '#d9d3c8');
  }
  glint(ctx, x + 9, y - 7, 3.2, '#ffffff');
  glint(ctx, x + 18, y - 12, 3.8);
}

/** Emberbreath Springs: stepped pools of cream travertine with turquoise water, a geyser plume and drifting steam. */
function springs(ctx: Ctx, x: number, y: number) {
  softShadow(ctx, x, y + 5, 27, 10, 0.18);
  const tiers: [number, number, number, number][] = [[3, -6, 14, 6], [-7, 1, 13, 5.6], [8, 5, 11, 4.8]];
  for (const [ox, oy, rx, ry] of tiers) {
    ellipse(ctx, x + ox, y + oy + 3, rx, ry, '#c99a62'); // the stepped rim's side
    ellipse(ctx, x + ox, y + oy + 1.5, rx, ry, '#e4c28c');
    ellipse(ctx, x + ox, y + oy, rx, ry, '#f1e3c4');
    ellipse(ctx, x + ox + 0.5, y + oy - 0.2, rx * 0.78, ry * 0.7, '#3fbcc8');
    ellipse(ctx, x + ox - rx * 0.2, y + oy - ry * 0.25, rx * 0.35, ry * 0.25, '#8fe6ea');
    line(ctx, x + ox + rx * 0.55, y + oy + ry * 0.7, x + ox + rx * 0.5, y + oy + ry + 2.5, '#e07f3a', 1.1); // mineral streaks
  }
  // the geyser: a white jet from the top pool, opening into a plume
  poly(ctx, [x + 1.4, y - 7, x + 4.6, y - 7, x + 5, y - 34, x + 1, y - 34], '#f4fbff');
  poly(ctx, [x + 3, y - 7, x + 4.6, y - 7, x + 5, y - 34, x + 3.2, y - 34], '#d2e8f2');
  puff(ctx, x + 3, y - 36, 6, 0.95);
  puff(ctx, x + 6, y - 43, 4.6, 0.7);
  puff(ctx, x - 2, y - 30, 4, 0.6);
  // steam off the lower pools
  puff(ctx, x - 12, y - 6, 3.6, 0.5);
  puff(ctx, x + 14, y - 1, 3, 0.45);
  glint(ctx, x - 16, y - 20, 3.8);
}

/** The Lanternveil Glacier: blue-white seracs under curtains of green and violet light. */
function glacier(ctx: Ctx, x: number, y: number) {
  // the aurora first, behind the ice
  const curtain = (x0: number, x1: number, base: number, h: number, c: string, ph: number) => {
    const n = 16;
    const pts = Array.from({ length: n + 1 }, (_, i) => {
      const f = i / n;
      return { x: x0 + (x1 - x0) * f, y: base + Math.sin(f * Math.PI * 2 + ph) * 3.5, h: h * (0.75 + 0.25 * Math.sin(f * Math.PI * 3 + ph)) };
    });
    const g = ctx.createLinearGradient(0, base + 4, 0, base - h);
    g.addColorStop(0, c + 'e8');
    g.addColorStop(0.45, c + '90');
    g.addColorStop(1, c + '00');
    ctx.fillStyle = g;
    ctx.beginPath(); // a ribbon: the wavy hem, then its top edge back
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    for (let i = n; i >= 0; i--) ctx.lineTo(pts[i].x + 2, pts[i].y - pts[i].h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#eafff4'; // the bright lower hem
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
  };
  curtain(x - 26, x + 20, y - 30, 26, '#b27cf0', 1.4);
  curtain(x - 20, x + 26, y - 26, 30, '#4ff0a6', 0);
  softShadow(ctx, x, y + 6, 28, 11, 0.2);
  // seracs: tilted blocks of ice
  const serac = (bx: number, by: number, w: number, h: number, lean: number) => {
    poly(ctx, [bx - w, by, bx - w + lean, by - h, bx + lean, by - h - w * 0.35, bx, by + w * 0.35], '#eaf7ff');
    poly(ctx, [bx, by + w * 0.35, bx + lean, by - h - w * 0.35, bx + w + lean, by - h, bx + w, by], '#9fcfe8');
    poly(ctx, [bx - w + lean, by - h, bx + lean, by - h - w * 0.35, bx + w + lean, by - h, bx + lean, by - h + w * 0.35], '#ffffff');
    line(ctx, bx + w * 0.4, by - 1, bx + w * 0.45 + lean, by - h * 0.7, '#6fb0d4', 0.7); // a crevasse
  };
  serac(x - 12, y - 2, 7, 18, -1);
  serac(x + 12, y - 1, 7, 15, 1.5);
  serac(x + 1, y + 2, 9, 26, 0.5);
  serac(x - 18, y + 7, 5, 8, -0.5);
  serac(x + 19, y + 7, 5, 7, 0.5);
  // meltwater at the snout
  ellipse(ctx, x + 2, y + 11, 9, 2.4, '#7fd0ee');
  glint(ctx, x - 22, y - 42, 4);
}

const ART: Record<string, (ctx: Ctx, x: number, y: number) => void> = { falls, grotto, peak, elder, reef, flats, springs, glacier };

/** A wonder's art centred on a tile at (x, y) (the tile's top-face centre). */
export function drawNaturalArt(ctx: Ctx, id: string, x: number, y: number) {
  (ART[id] ?? grotto)(ctx, x, y);
}

/** The wonder standing on this tile, if any (called by the map's scenery pass). Returns true if one was drawn. */
export function drawNaturalTile(ctx: Ctx, s: GameState, t: Tile, x: number, y: number): boolean {
  const n = naturalAt(s, t.x, t.y);
  if (!n) return false;
  drawNaturalArt(ctx, n.id, x, y);
  return true;
}

/** Over a cloud-covered tile: a pillar of light, if a wonder lies under it that `viewer` has glimpsed. */
export function drawNaturalGlimpse(ctx: Ctx, s: GameState, t: Tile, viewer: number, lift: number) {
  if (viewer < 0 || !s.naturals) return;
  const n = naturalAt(s, t.x, t.y);
  if (!n || !glimpsed(s, viewer, n)) return;
  const { x, y: top } = tileTop(t.x, t.y);
  const y = top - lift + TH / 2;
  const g = ctx.createLinearGradient(0, y, 0, y - 46);
  g.addColorStop(0, 'rgba(255,226,122,0.75)');
  g.addColorStop(1, 'rgba(255,226,122,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - 5, y);
  ctx.lineTo(x - 2, y - 46);
  ctx.lineTo(x + 2, y - 46);
  ctx.lineTo(x + 5, y);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.6;
  ellipse(ctx, x, y, 9, 4, '#fff1b8');
  ctx.globalAlpha = 1;
  glint(ctx, x, y - 12, 6);
}

/** Ground colour under each wonder in an icon. */
const ICON_GROUND: Record<string, string> = {
  falls: '#79c257', grotto: '#b9b09a', peak: '#8fa27a', elder: '#5caa45', reef: '#4cc6e0', flats: '#e6dac0', springs: '#cdb68a', glacier: '#dfeef4',
};

/** A wonder for a list or a card, on a little tile of its ground, fitted into a box about `size` px across centred on (x, y). */
export function drawNaturalIcon(ctx: Ctx, id: string, x: number, y: number, size = 54) {
  const k = (size / 64) * Math.min(1, 40 / (HEIGHT[id] ?? 40));
  ctx.save();
  ctx.translate(x, y + size * 0.16);
  ctx.scale(k, k);
  const c = ICON_GROUND[id] ?? '#79c257';
  const water = id === 'reef';
  poly(ctx, [-HW, water ? 0 : 0, 0, HH, 0, HH + 7, -HW, 7], shade(c, -0.25));
  poly(ctx, [HW, 0, 0, HH, 0, HH + 7, HW, 7], shade(c, -0.4));
  poly(ctx, [0, -HH, HW, 0, 0, HH, -HW, 0], c);
  drawNaturalArt(ctx, id, 0, water ? -WATER_DROP : 0);
  ctx.restore();
}

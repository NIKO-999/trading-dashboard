// Drawing side of tile levels and Districts (see game/levels): pastures and orchards, what each level adds on top of
// an improvement (bigger and richer at every level: a sawmill's saw shed, a great temple's colonnade, a foundry's
// furnace stacks...), gold level pips at the tile's front corner, and each District's linked outline and banner. All
// of it is drawn into the cached map layers, so it shows on the resting (photographed) map too. Original, procedural art.
import { TRIBES } from '../data/tribes';
import { cityById } from '../game/rules';
import { DISTRICTS, districtsOf, tileLevel, type District } from '../game/levels';
import type { GameState, Tile, TribeId } from '../game/types';
import { TH, tileCenter, tileTop, WATER_DROP } from './camera';
import { HH, HW, isWaterTile, uv } from './common';
import { box, ellipse, line, poly, rand, roof, shade, softShadow, type Ctx } from './prims';
import { drawCritter } from './units';

const GOLD = '#f0c43a';
const WOOD = '#7a5230';
const DWOOD = '#5a3a22';
const STONE = '#c9c4b6';

const colorOf = (s: GameState, t: Tile) => {
  const c = t.owner !== null ? cityById(s, t.owner) : undefined;
  return TRIBES[c ? s.players[c.owner].tribe : t.biome].color;
};

/** A small fruit tree: a trunk and a round crown dotted with fruit. */
function fruitTree(ctx: Ctx, x: number, y: number, k: number, leaf: string, fruit: string, seed: number) {
  line(ctx, x, y, x, y - 5 * k, DWOOD, 1.2 * k);
  ellipse(ctx, x, y - 8 * k, 5 * k, 4.2 * k, leaf);
  ellipse(ctx, x - 1.4 * k, y - 9.2 * k, 2.6 * k, 2 * k, shade(leaf, 0.15));
  for (let i = 0; i < 3; i++) ellipse(ctx, x - 3 * k + rand(seed, i) * 6 * k, y - 10 * k + rand(seed, i + 5) * 5 * k, 0.9 * k, 0.9 * k, fruit);
}

/** A low rail fence along the front edges of a paddock. */
function paddock(ctx: Ctx, cx: number, cy: number, k: number) {
  const a = uv(cx, cy, -k, k), b = uv(cx, cy, k, k), c = uv(cx, cy, k, -k);
  for (const [p, q] of [[a, b], [b, c]] as const) {
    for (let i = 0; i <= 4; i++) { const x = p.x + (q.x - p.x) * i / 4, y = p.y + (q.y - p.y) * i / 4; line(ctx, x, y, x, y - 4, WOOD, 1); }
    line(ctx, p.x, p.y - 3.2, q.x, q.y - 3.2, WOOD, 0.8);
    line(ctx, p.x, p.y - 1.6, q.x, q.y - 1.6, WOOD, 0.7);
  }
}

/** Gold pips at the front corner of a raised tile: two for level 2, three for level 3. */
function pips(ctx: Ctx, cx: number, cy: number, lvl: number) {
  const y = cy + HH - 5;
  for (let i = 0; i < lvl; i++) {
    const x = cx - (lvl - 1) * 3 + i * 6;
    poly(ctx, [x, y - 2.6, x + 2.4, y, x, y + 2.6, x - 2.4, y], '#6a4a10');
    poly(ctx, [x, y - 1.9, x + 1.7, y, x, y + 1.9, x - 1.7, y], GOLD);
  }
}

/** What a raised tile adds on top of its improvement, the pasture or orchard itself, and its level pips (called from render/draw). */
export function drawLevelTile(ctx: Ctx, s: GameState, t: Tile, cx: number, cy: number) {
  const l = tileLevel(t);
  if (l < 2) return;
  const color = colorOf(s, t);
  const big = l === 3;
  switch (t.improvement) {
    case 'pasture': {
      softShadow(ctx, cx, cy + 4, 20, 8, 0.12);
      paddock(ctx, cx, cy, 0.4);
      drawCritter(ctx, cx - 9, cy + 3, t.biome, 0.8);
      drawCritter(ctx, cx + 5, cy + 7, t.biome, 0.75);
      if (big) { // Stables: a long timber stable with a hay loft
        box(ctx, cx + 4, cy - 3, 16, 7, '#b88a52');
        roof(ctx, cx + 4, cy - 10, 18, 6, shade(color, -0.1));
        box(ctx, cx + 4, cy - 1, 4, 5, DWOOD);
        ellipse(ctx, cx - 12, cy - 2, 4, 3, '#e2c46a'); // a haystack
      }
      break;
    }
    case 'orchard': {
      const fruit = big ? '#7b3a8f' : '#e8542e'; // a Vineyard's grapes
      const spots = big ? [[-0.3, -0.25], [0.05, -0.3], [-0.25, 0.1], [0.15, 0.05], [-0.05, 0.3], [0.32, 0.25]] : [[-0.25, -0.2], [0.15, -0.15], [-0.15, 0.2], [0.25, 0.25]];
      const pts = spots.map(([u, v]) => uv(cx, cy, u, v)).sort((a, b) => a.y - b.y);
      pts.forEach((p, i) => (big ? vine(ctx, p.x, p.y, fruit) : fruitTree(ctx, p.x, p.y + 3, 1, '#4f9a3a', fruit, t.seed + i)));
      if (big) { box(ctx, cx + 13, cy - 5, 8, 6, STONE); roof(ctx, cx + 13, cy - 10, 9, 4, color); } // a press house
      break;
    }
    case 'lumber': // Sawmill: a saw shed with a water wheel; Timberworks: a second shed, stacked beams and a crane
      box(ctx, cx - 11, cy + 2, 10, 6, '#a0703f');
      roof(ctx, cx - 11, cy - 4, 12, 5, shade(color, -0.1));
      ctx.strokeStyle = DWOOD; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.ellipse(cx - 17, cy + 3, 3.6, 3.6, 0, 0, Math.PI * 2); ctx.stroke();
      if (big) {
        for (let i = 0; i < 3; i++) box(ctx, cx + 11, cy + 8 - i * 2.4, 11, 2.2, i % 2 ? '#c89560' : '#b07a45');
        line(ctx, cx + 16, cy + 6, cx + 16, cy - 14, DWOOD, 1.3);
        line(ctx, cx + 16, cy - 14, cx + 6, cy - 10, DWOOD, 1.1);
      }
      break;
    case 'temple': // Great Temple: a colonnade in front; Sanctuary: a gilded dome and a healing spring
      for (let i = 0; i < 4; i++) box(ctx, cx - 9 + i * 6, cy + 10, 1.8, 6, '#f4efe0');
      box(ctx, cx, cy + 6, 22, 1.6, STONE);
      if (big) {
        ctx.fillStyle = GOLD;
        ctx.beginPath(); ctx.ellipse(cx, cy - 16, 5, 5, 0, Math.PI, 0); ctx.fill();
        line(ctx, cx, cy - 21, cx, cy - 25, GOLD, 1);
        ellipse(ctx, cx + 15, cy + 10, 5, 2.2, '#7fd6f0');
      }
      break;
    case 'farm':
      if (big) { // Granary Fields: a round granary and a second barn
        box(ctx, cx + 12, cy - 2, 7, 8, '#e8dcc0');
        poly(ctx, [cx + 8, cy - 6, cx + 12, cy - 12, cx + 16, cy - 6], shade(color, -0.1));
        box(ctx, cx - 1, cy - 7, 6, 5, '#c9a06a');
        roof(ctx, cx - 1, cy - 11, 7, 4, '#8a6038');
      }
      break;
    case 'mine':
      if (big) { // Foundry: two furnace stacks glowing at the foot
        for (const dx of [-14, -8]) { box(ctx, cx + dx, cy - 2, 4, 14, '#5a5560'); ellipse(ctx, cx + dx, cy - 10, 2.4, 1.2, '#2a2a30'); }
        ellipse(ctx, cx - 11, cy + 5, 4, 1.6, '#ff8a3a');
      }
      break;
    case 'port':
      if (big) { // Great Harbour: a stone lighthouse tower
        const d = WATER_DROP;
        box(ctx, cx - 14, cy + d - 4, 5, 16, STONE);
        ellipse(ctx, cx - 14, cy + d - 21, 2.4, 2, '#ffe08a');
        roof(ctx, cx - 14, cy + d - 24, 6, 3, color);
      }
      break;
    case 'market':
      if (big) { // Exchange: a columned hall with a gilded roof
        for (let i = 0; i < 3; i++) box(ctx, cx - 16 + i * 4, cy + 4, 1.6, 7, '#f4efe0');
        roof(ctx, cx - 12, cy - 5, 14, 5, GOLD);
      }
      break;
  }
  pips(ctx, cx, cy + (isWaterTile(t) ? WATER_DROP : 0), l);
}

/** A trellis row of vines hung with grapes. */
function vine(ctx: Ctx, x: number, y: number, grape: string) {
  line(ctx, x - 4, y, x - 4, y - 7, DWOOD, 0.9);
  line(ctx, x + 4, y, x + 4, y - 7, DWOOD, 0.9);
  ellipse(ctx, x, y - 6, 5.5, 2.6, '#4f8a34');
  ellipse(ctx, x - 1.5, y - 3.6, 1.2, 1.6, grape);
  ellipse(ctx, x + 2, y - 3.8, 1.1, 1.5, grape);
}

/** The Districts on screen, worked out once per map picture. */
function visibleDistricts(s: GameState, explored: (x: number, y: number) => boolean): District[] {
  return districtsOf(s).filter((d) => d.tiles.some((i) => explored(i % s.size, Math.floor(i / s.size))));
}

/** On the ground: a District's tiles linked by one outline in its colour (inner edges left out). Called from render/draw. */
export function drawDistrictGround(ctx: Ctx, s: GameState, explored: (x: number, y: number) => boolean) {
  for (const d of visibleDistricts(s, explored)) {
    const set = new Set(d.tiles);
    const col = DISTRICTS[d.kind].color;
    for (const i of d.tiles) {
      const x = i % s.size, y = Math.floor(i / s.size);
      if (!explored(x, y)) continue;
      const { x: tx, y: ty0 } = tileTop(x, y);
      const ty = ty0 + (isWaterTile(s.tiles[i]) ? WATER_DROP : 0);
      const T = { x: tx, y: ty }, R = { x: tx + HW, y: ty + HH }, B = { x: tx, y: ty + TH }, L = { x: tx - HW, y: ty + HH };
      // edges: top-right (y-1), bottom-right (x+1), bottom-left (y+1), top-left (x-1)
      const edges: [number, number, { x: number; y: number }, { x: number; y: number }][] = [[0, -1, T, R], [1, 0, R, B], [0, 1, B, L], [-1, 0, L, T]];
      ctx.fillStyle = `${col}22`;
      ctx.beginPath(); ctx.moveTo(T.x, T.y); ctx.lineTo(R.x, R.y); ctx.lineTo(B.x, B.y); ctx.lineTo(L.x, L.y); ctx.closePath(); ctx.fill();
      for (const [dx, dy, a, b] of edges) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < s.size && ny < s.size && set.has(ny * s.size + nx)) continue;
        line(ctx, a.x, a.y, b.x, b.y, 'rgba(40,30,10,0.45)', 3);
        line(ctx, a.x, a.y, b.x, b.y, col, 1.5);
      }
    }
  }
}

/** Over the scenery: each District's banner, a tall pole flying a swallow-tailed flag in its colour. */
export function drawDistrictBanners(ctx: Ctx, s: GameState, explored: (x: number, y: number) => boolean) {
  for (const d of visibleDistricts(s, explored)) {
    // the banner stands on the District's front-most tile
    const i = [...d.tiles].sort((a, b) => (Math.floor(b / s.size) + (b % s.size)) - (Math.floor(a / s.size) + (a % s.size)) || a - b)[0];
    const x = i % s.size, y = Math.floor(i / s.size);
    if (!explored(x, y)) continue;
    const c = tileCenter(x, y);
    const px = c.x + 14, py = c.y + 8 + (isWaterTile(s.tiles[i]) ? WATER_DROP : 0);
    const col = DISTRICTS[d.kind].color;
    const own = TRIBES[s.players[d.owner].tribe].color;
    ellipse(ctx, px, py, 3, 1.3, 'rgba(0,0,0,0.3)');
    line(ctx, px, py, px, py - 30, DWOOD, 1.4);
    ellipse(ctx, px, py - 31, 1.4, 1.4, GOLD);
    poly(ctx, [px, py - 29, px + 13, py - 29, px + 9, py - 24, px + 13, py - 19, px, py - 19], col);
    poly(ctx, [px, py - 29, px + 13, py - 29, px + 12, py - 27.5, px, py - 27.5], own);
    ellipse(ctx, px + 5, py - 23.5, 2, 2, shade(col, -0.35));
  }
}

/** Icons for the level actions: an upward arrow over a little building, a paddock, an orchard. */
export function drawLevelIcon(ctx: Ctx, icon: string, tribe: TribeId, x: number, y: number): boolean {
  const T = TRIBES[tribe];
  switch (icon) {
    case 'level:up':
      box(ctx, x - 5, y + 10, 12, 8, '#e8dcc0');
      roof(ctx, x - 5, y + 1, 14, 7, T.color);
      poly(ctx, [x + 10, y - 14, x + 16, y - 5, x + 12.5, y - 5, x + 12.5, y + 7, x + 7.5, y + 7, x + 7.5, y - 5, x + 4, y - 5], GOLD);
      for (let i = 0; i < 3; i++) poly(ctx, [x - 12 + i * 6, y + 18, x - 10 + i * 6, y + 20, x - 12 + i * 6, y + 22, x - 14 + i * 6, y + 20], GOLD);
      return true;
    case 'level:pasture':
      paddock(ctx, x, y + 6, 0.45);
      drawCritter(ctx, x - 6, y + 10, tribe, 1);
      return true;
    case 'level:orchard':
      fruitTree(ctx, x - 7, y + 12, 1.3, '#4f9a3a', '#e8542e', 3);
      fruitTree(ctx, x + 7, y + 15, 1.3, '#4f9a3a', '#e8542e', 9);
      return true;
  }
  return false;
}

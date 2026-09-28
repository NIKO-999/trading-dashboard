// All game art is drawn procedurally here: low-poly tiles, scenery, cities and units.
import { TRIBES } from '../data/tribes';
import { UNITS } from '../data/units';
import { tileAt } from '../game/grid';
import { cityById, maxHp, tileOwnerPlayer } from '../game/rules';
import type { City, GameState, Tile, TribeId, Unit, UnitKind } from '../game/types';
import { Camera, LAND_DEPTH, TH, TW, WATER_DROP, tileCenter, tileTop } from './camera';

type Ctx = CanvasRenderingContext2D;

export interface Overlay {
  selected: { x: number; y: number } | null;
  moves: { x: number; y: number }[];
  attacks: { x: number; y: number }[];
  anims: Map<number, { fx: number; fy: number; t0: number }>;
  floaters: { x: number; y: number; text: string; color: string; t0: number }[];
  now: number;
}

export const ANIM_MS = 220;
export const FLOAT_MS = 1100;

// ---------------------------------------------------------------- colour utils

export function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const rand = (seed: number, i: number) => {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

function poly(ctx: Ctx, pts: number[], fill: string, stroke?: string) {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

/** An isometric box standing on (cx, cy) with footprint w (world px), height h. */
function box(ctx: Ctx, cx: number, cy: number, w: number, h: number, color: string, top?: string) {
  const hw = w / 2, hh = w / 4;
  poly(ctx, [cx - hw, cy - h, cx, cy + hh - h, cx, cy + hh, cx - hw, cy], shade(color, 0.08));
  poly(ctx, [cx + hw, cy - h, cx, cy + hh - h, cx, cy + hh, cx + hw, cy], shade(color, -0.22));
  poly(ctx, [cx, cy - hh - h, cx + hw, cy - h, cx, cy + hh - h, cx - hw, cy - h], top ?? shade(color, 0.25));
}

function roof(ctx: Ctx, cx: number, cy: number, w: number, h: number, color: string) {
  const hw = w / 2, hh = w / 4;
  poly(ctx, [cx - hw, cy, cx, cy + hh, cx, cy - h], shade(color, 0.1));
  poly(ctx, [cx + hw, cy, cx, cy + hh, cx, cy - h], shade(color, -0.2));
}

function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, fill: string) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

// ---------------------------------------------------------------- background

let stars: { x: number; y: number; s: number; a: number }[] = [];
export function drawBackground(ctx: Ctx, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#05060d');
  g.addColorStop(1, '#0d1024');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  if (!stars.length) stars = Array.from({ length: 140 }, (_, i) => ({ x: rand(i, 1), y: rand(i, 2), s: rand(i, 3) < 0.85 ? 1.5 : 3, a: 0.3 + rand(i, 4) * 0.7 }));
  for (const s of stars) {
    ctx.fillStyle = `rgba(255,255,255,${s.a})`;
    ctx.fillRect(s.x * w, s.y * h, s.s, s.s);
  }
}

// ---------------------------------------------------------------- main render

export function renderWorld(ctx: Ctx, s: GameState, viewer: number, cam: Camera, ov: Overlay, vw: number, vh: number) {
  drawBackground(ctx, vw, vh);
  ctx.save();
  ctx.translate(cam.x, cam.y);
  ctx.scale(cam.zoom, cam.zoom);

  const explored = (x: number, y: number) => viewer < 0 || s.players[viewer].explored[y * s.size + x];
  const order: Tile[] = [];
  for (let d = 0; d <= (s.size - 1) * 2; d++)
    for (let x = 0; x < s.size; x++) {
      const y = d - x;
      if (y >= 0 && y < s.size) order.push(s.tiles[y * s.size + x]);
    }

  // Viewport culling in world space.
  const w0 = cam.toWorld(-TW * 2, -TH * 6);
  const w1 = cam.toWorld(vw + TW * 2, vh + TH * 4);
  const visible = (t: Tile) => {
    const c = tileCenter(t.x, t.y);
    return c.x > w0.x && c.x < w1.x && c.y > w0.y && c.y < w1.y;
  };
  const shown = order.filter(visible);

  // Pass 1: tile bases.
  for (const t of shown) explored(t.x, t.y) ? drawBase(ctx, s, t) : drawFogBase(ctx, t);
  // Pass 2: territory borders and highlights on the ground.
  for (const t of shown) if (explored(t.x, t.y)) drawBorders(ctx, s, t, explored);
  if (ov.selected) outlineTile(ctx, s, ov.selected.x, ov.selected.y, 'rgba(255,255,255,0.95)', 2.5);
  for (const m of ov.moves) {
    const t = tileAt(s, m.x, m.y)!;
    const c = tileCenter(m.x, m.y);
    const dy = t.terrain === 'shallow' || t.terrain === 'ocean' ? WATER_DROP : 0;
    ellipse(ctx, c.x, c.y + dy, 7, 3.5, 'rgba(255,255,255,0.85)');
  }

  // Pass 3: scenery, cities, units in painter's order.
  const unitsByTile = new Map<number, Unit>();
  for (const u of s.units) unitsByTile.set(u.y * s.size + u.x, u);
  for (const t of shown) {
    if (!explored(t.x, t.y)) {
      drawFogPuffs(ctx, t);
      continue;
    }
    drawScenery(ctx, s, t);
    const u = unitsByTile.get(t.y * s.size + t.x);
    if (u) drawUnitAt(ctx, s, u, ov, viewer);
  }

  // Pass 4: attack markers, labels and floating numbers on top of everything.
  for (const a of ov.attacks) {
    const c = tileCenter(a.x, a.y);
    ctx.strokeStyle = '#ff3b3b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, 16, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const c of s.cities) if (explored(c.x, c.y) && visible(tileAt(s, c.x, c.y)!)) drawCityLabel(ctx, s, c);
  for (const f of ov.floaters) {
    const k = (ov.now - f.t0) / FLOAT_MS;
    if (k < 0 || k > 1) continue;
    const c = tileCenter(f.x, f.y);
    ctx.globalAlpha = 1 - k * k;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.strokeText(f.text, c.x, c.y - 30 - k * 22);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, c.x, c.y - 30 - k * 22);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ---------------------------------------------------------------- tiles

function drawBase(ctx: Ctx, s: GameState, t: Tile) {
  const p = TRIBES[t.biome].palette;
  const { x, y } = tileTop(t.x, t.y);
  const hw = TW / 2, hh = TH / 2;
  if (t.terrain === 'shallow' || t.terrain === 'ocean') {
    const base = t.terrain === 'shallow' ? p.shallow : p.ocean;
    const yy = y + WATER_DROP;
    poly(ctx, [x, yy, x + hw, yy + hh, x, yy + TH, x - hw, yy + hh], base);
    // gentle facet shading for a low-poly look
    poly(ctx, [x, yy, x + hw, yy + hh, x, yy + hh], shade(base, 0.06));
    poly(ctx, [x - hw, yy + hh, x, yy + TH, x, yy + hh], shade(base, -0.05));
    const r = rand(t.seed, 1);
    ctx.strokeStyle = shade(base, 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    const wx = x - 10 + r * 16, wy = yy + 10 + rand(t.seed, 2) * 10;
    ctx.moveTo(wx, wy);
    ctx.quadraticCurveTo(wx + 4, wy - 2, wx + 8, wy);
    ctx.stroke();
    return;
  }
  const top = t.terrain === 'mountain' ? shade(p.field, -0.08) : t.terrain === 'forest' ? shade(p.field, -0.04) : p.field;
  // sides
  poly(ctx, [x - hw, y + hh, x, y + TH, x, y + TH + LAND_DEPTH, x - hw, y + hh + LAND_DEPTH], shade(p.fieldSide, 0.05));
  poly(ctx, [x + hw, y + hh, x, y + TH, x, y + TH + LAND_DEPTH, x + hw, y + hh + LAND_DEPTH], shade(p.fieldSide, -0.25));
  // top with two-tone facets
  poly(ctx, [x, y, x + hw, y + hh, x, y + TH, x - hw, y + hh], top);
  poly(ctx, [x, y, x + hw, y + hh, x + (rand(t.seed, 3) - 0.5) * 12, y + hh], shade(top, 0.05));
  poly(ctx, [x - hw, y + hh, x, y + TH, x + (rand(t.seed, 3) - 0.5) * 12, y + hh], shade(top, -0.04));

  if (t.improvement === 'farm') {
    ctx.strokeStyle = '#e8c547';
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(x - hw / 2 + i * 6 + 4, y + hh / 2 + i * 3 + 2);
      ctx.lineTo(x + hw / 2 + i * 6 - 4, y + hh * 1.5 + i * 3 - 2);
      ctx.stroke();
    }
  }
  if (t.road || t.cityId !== null) drawRoads(ctx, s, t);
}

function drawRoads(ctx: Ctx, s: GameState, t: Tile) {
  const c = tileCenter(t.x, t.y);
  ctx.strokeStyle = '#b9925c';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  let any = false;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
    const n = tileAt(s, t.x + dx, t.y + dy);
    if (!n || !(n.road || n.cityId !== null)) continue;
    if (t.cityId !== null && n.cityId !== null) continue;
    const nc = tileCenter(n.x, n.y);
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo((c.x + nc.x) / 2, (c.y + nc.y) / 2);
    ctx.stroke();
    any = true;
  }
  if (!any && t.road) ellipse(ctx, c.x, c.y, 5, 2.5, '#b9925c');
}

function drawFogBase(ctx: Ctx, t: Tile) {
  const { x, y } = tileTop(t.x, t.y);
  const hw = TW / 2, hh = TH / 2;
  const lift = -6;
  const base = rand(t.seed, 9) < 0.5 ? '#dfe4f4' : '#d3d9ef';
  poly(ctx, [x, y + lift, x + hw, y + hh + lift, x, y + TH + lift, x - hw, y + hh + lift], base);
  // soft facet triangles give the cloud cover a quilted feel
  const k = rand(t.seed, 10);
  poly(ctx, [x, y + lift, x + hw, y + hh + lift, x - hw * 0.2 + k * 10, y + hh + lift], '#eef1fb');
  poly(ctx, [x - hw, y + hh + lift, x, y + TH + lift, x - hw * 0.2 + k * 10, y + hh + lift], '#c3cbe8');
}

function drawFogPuffs(ctx: Ctx, t: Tile) {
  const c = tileCenter(t.x, t.y);
  const n = 2 + Math.floor(rand(t.seed, 11) * 2);
  for (let i = 0; i < n; i++) {
    const px = c.x + (rand(t.seed, 20 + i) - 0.5) * 30;
    const py = c.y - 8 + (rand(t.seed, 30 + i) - 0.5) * 12;
    const r = 7 + rand(t.seed, 40 + i) * 6;
    ellipse(ctx, px, py + 2, r, r * 0.6, '#c6cde8');
    ellipse(ctx, px, py, r, r * 0.62, '#eef1fb');
  }
}

function drawBorders(ctx: Ctx, s: GameState, t: Tile, explored: (x: number, y: number) => boolean) {
  const owner = tileOwnerPlayer(s, t);
  if (owner === null) return;
  const color = TRIBES[s.players[owner].tribe].color;
  const { x, y } = tileTop(t.x, t.y);
  const dy = t.terrain === 'shallow' || t.terrain === 'ocean' ? WATER_DROP : 0;
  const hw = TW / 2, hh = TH / 2;
  const edges: [number, number, number[]][] = [
    [-1, 0, [x, y, x - hw, y + hh]], // upper-left edge, shared with (x-1, y)
    [0, -1, [x, y, x + hw, y + hh]], // upper-right edge, shared with (x, y-1)
    [1, 0, [x + hw, y + hh, x, y + TH]], // lower-right edge, shared with (x+1, y)
    [0, 1, [x - hw, y + hh, x, y + TH]], // lower-left edge, shared with (x, y+1)
  ];
  const dirs: [number, number][] = [[-1, 0], [0, -1], [1, 0], [0, 1]];
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.setLineDash([4, 3]);
  edges.forEach((e, i) => {
    const [ddx, ddy] = dirs[i];
    const n = tileAt(s, t.x + ddx, t.y + ddy);
    if (n && tileOwnerPlayer(s, n) === owner && explored(n.x, n.y)) return;
    const [x1, y1, x2, y2] = e[2];
    ctx.beginPath();
    ctx.moveTo(x1, y1 + dy + 1);
    ctx.lineTo(x2, y2 + dy + 1);
    ctx.stroke();
  });
  ctx.setLineDash([]);
}

export function outlineTile(ctx: Ctx, s: GameState, tx: number, ty: number, color: string, width: number) {
  const t = tileAt(s, tx, ty);
  if (!t) return;
  const { x, y } = tileTop(tx, ty);
  const dy = t.terrain === 'shallow' || t.terrain === 'ocean' ? WATER_DROP : 0;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y + dy);
  ctx.lineTo(x + TW / 2, y + TH / 2 + dy);
  ctx.lineTo(x, y + TH + dy);
  ctx.lineTo(x - TW / 2, y + TH / 2 + dy);
  ctx.closePath();
  ctx.stroke();
}

// ---------------------------------------------------------------- scenery

function drawScenery(ctx: Ctx, s: GameState, t: Tile) {
  const c = tileCenter(t.x, t.y);
  const p = TRIBES[t.biome].palette;
  const biome = t.biome;

  if (t.terrain === 'forest' && t.improvement !== 'lumber') {
    const spots = [[-12, -2], [8, -4], [-2, 4], [14, 3], [-16, 5], [2, -7]];
    const n = 4 + Math.floor(rand(t.seed, 5) * 3);
    const trees = spots.slice(0, n).map(([ox, oy], i) => ({ x: c.x + ox + (rand(t.seed, 50 + i) - 0.5) * 4, y: c.y + oy + (rand(t.seed, 60 + i) - 0.5) * 3, i }));
    trees.sort((a, b) => a.y - b.y);
    for (const tr of trees) drawTree(ctx, biome, tr.x, tr.y, 0.8 + rand(t.seed, 70 + tr.i) * 0.4, p.forest, p.trunk);
  }
  if (t.terrain === 'mountain') drawMountain(ctx, t, c.x, c.y, p);
  if (t.resource) drawResource(ctx, t, c.x, c.y, biome);
  if (t.improvement && t.improvement !== 'farm') drawImprovement(ctx, s, t, c.x, c.y);
  if (t.village) drawVillage(ctx, c.x, c.y);
  if (t.ruin) drawRuin(ctx, t, c.x, c.y);
  if (t.cityId !== null) {
    const city = cityById(s, t.cityId);
    if (city) drawCity(ctx, s, city, c.x, c.y);
  }
}

function drawTree(ctx: Ctx, biome: TribeId, x: number, y: number, k: number, leaf: string, trunk: string) {
  ellipse(ctx, x + 2, y + 1, 5 * k, 2 * k, 'rgba(0,0,0,0.15)');
  if (biome === 'egypt' || biome === 'polynesia') {
    // palm
    ctx.strokeStyle = trunk;
    ctx.lineWidth = 2.2 * k;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 3 * k, y - 9 * k, x + 1 * k, y - 18 * k);
    ctx.stroke();
    const tx = x + 1 * k, ty = y - 18 * k;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.75;
      const ex = tx + Math.cos(a) * 9 * k, ey = ty + Math.sin(a) * 5 * k + 5 * k;
      poly(ctx, [tx, ty, ex, ey, tx + Math.cos(a) * 4 * k, ty + 2 * k], i % 2 ? leaf : shade(leaf, 0.2));
    }
    return;
  }
  ctx.fillStyle = trunk;
  ctx.fillRect(x - 1 * k, y - 4 * k, 2 * k, 4 * k);
  if (biome === 'aztec') {
    // broad jungle canopy
    ellipse(ctx, x, y - 10 * k, 7 * k, 5 * k, shade(leaf, -0.1));
    ellipse(ctx, x - 2 * k, y - 12 * k, 5 * k, 4 * k, leaf);
    ellipse(ctx, x + 2 * k, y - 14 * k, 4 * k, 3 * k, shade(leaf, 0.18));
    return;
  }
  const h = biome === 'rome' ? 20 : 16;
  const w = biome === 'rome' ? 4.5 : 6.5;
  poly(ctx, [x, y - h * k, x - w * k, y - 3 * k, x, y - 1.5 * k], shade(leaf, 0.15));
  poly(ctx, [x, y - h * k, x + w * k, y - 3 * k, x, y - 1.5 * k], shade(leaf, -0.15));
}

function drawMountain(ctx: Ctx, t: Tile, cx: number, cy: number, p: (typeof TRIBES)['rome']['palette']) {
  const peaks = [
    { ox: -9, oy: 2, h: 22, w: 14 },
    { ox: 7, oy: -2, h: 30, w: 17 },
    { ox: 12, oy: 6, h: 16, w: 11 },
  ].slice(0, 2 + (t.seed % 2));
  peaks.sort((a, b) => a.oy - b.oy);
  for (const pk of peaks) {
    const x = cx + pk.ox, y = cy + pk.oy, h = pk.h * (0.85 + rand(t.seed, pk.ox + 99) * 0.3);
    const apexX = x + (rand(t.seed, pk.oy + 5) - 0.5) * 4;
    poly(ctx, [apexX, y - h, x - pk.w, y + 3, x + 1, y + 6], p.mountain);
    poly(ctx, [apexX, y - h, x + pk.w, y + 2, x + 1, y + 6], p.mountainShade);
    if (t.biome !== 'egypt') {
      const f = 0.32;
      poly(ctx, [apexX, y - h, apexX - pk.w * f, y - h + h * f, apexX - 1, y - h + h * f * 1.25, apexX + pk.w * f * 0.4, y - h + h * f * 0.9], p.snow);
      poly(ctx, [apexX, y - h, apexX + pk.w * f, y - h + h * f, apexX + pk.w * f * 0.4, y - h + h * f * 0.9], shade(p.snow, -0.15));
    }
  }
}

const ANIMAL_COLORS: Record<TribeId, string> = { egypt: '#c49a5a', aztec: '#9b6a3c', polynesia: '#e7a6a0', rome: '#efeee6', pirates: '#5e5146' };

function drawResource(ctx: Ctx, t: Tile, x: number, y: number, biome: TribeId) {
  switch (t.resource) {
    case 'fruit': {
      for (const [ox, oy] of [[-8, 0], [7, 3]]) {
        ellipse(ctx, x + ox, y + oy + 1, 7, 3, 'rgba(0,0,0,0.15)');
        ellipse(ctx, x + ox, y + oy - 4, 7, 6, '#3f9e3a');
        ellipse(ctx, x + ox - 2, y + oy - 6, 4, 3.5, '#57bb4b');
        for (let i = 0; i < 4; i++) ellipse(ctx, x + ox - 4 + (i % 2) * 6 + (i > 1 ? 1 : 0), y + oy - 7 + (i > 1 ? 4 : 0), 1.8, 1.8, biome === 'egypt' ? '#7b3f1d' : '#e0314b');
      }
      break;
    }
    case 'crop': {
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 9; i++) {
        const px = x - 12 + (i % 3) * 10 + (Math.floor(i / 3) - 1) * 3, py = y - 2 + Math.floor(i / 3) * 4;
        ctx.strokeStyle = '#b8912e';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, py - 10);
        ctx.stroke();
        ellipse(ctx, px, py - 11, 1.8, 3.5, '#f2c94c');
      }
      break;
    }
    case 'animal': drawAnimal(ctx, x - 4, y + 2, ANIMAL_COLORS[biome], biome === 'egypt'); break;
    case 'fish': {
      for (const [ox, oy, f] of [[-8, 4, 1], [8, 7, -1]] as const) {
        const fx = x + ox, fy = y + oy + WATER_DROP;
        ellipse(ctx, fx, fy, 6, 2.2, 'rgba(255,255,255,0.75)');
        poly(ctx, [fx - 6 * f, fy, fx - 10 * f, fy - 3, fx - 10 * f, fy + 3], 'rgba(255,255,255,0.75)');
      }
      break;
    }
    case 'ore': {
      for (const [ox, oy, h] of [[-4, 8, 9], [2, 10, 12], [7, 9, 7]]) {
        poly(ctx, [x + ox, y + oy - h, x + ox - 3, y + oy, x + ox, y + oy + 1], '#b9f0ff');
        poly(ctx, [x + ox, y + oy - h, x + ox + 3, y + oy, x + ox, y + oy + 1], '#5fb7d6');
      }
      break;
    }
    case 'whale': {
      const wy = y + WATER_DROP + 2;
      ellipse(ctx, x, wy, 13, 5, '#2b3a55');
      ellipse(ctx, x - 2, wy - 2, 10, 3, '#3f5378');
      poly(ctx, [x + 11, wy - 1, x + 18, wy - 6, x + 17, wy + 2], '#2b3a55');
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 6, wy - 4);
      ctx.quadraticCurveTo(x - 9, wy - 12, x - 12, wy - 13);
      ctx.moveTo(x - 6, wy - 4);
      ctx.quadraticCurveTo(x - 3, wy - 12, x, wy - 13);
      ctx.stroke();
      break;
    }
  }
}

function drawAnimal(ctx: Ctx, x: number, y: number, color: string, hump: boolean) {
  ellipse(ctx, x + 2, y + 1, 9, 2.5, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = shade(color, -0.25);
  for (const lx of [-5, -2, 3, 6]) ctx.fillRect(x + lx, y - 5, 2, 6);
  box(ctx, x, y - 4, 13, 6, color);
  if (hump) ellipse(ctx, x - 1, y - 11, 4, 3, shade(color, 0.1));
  box(ctx, x + 8, y - 9, 6, 6, shade(color, 0.05));
  ctx.fillStyle = '#111';
  ctx.fillRect(x + 9, y - 13, 1.5, 1.5);
}

function drawImprovement(ctx: Ctx, s: GameState, t: Tile, x: number, y: number) {
  const owner = tileOwnerPlayer(s, t);
  const tribe = owner !== null ? TRIBES[s.players[owner].tribe] : TRIBES[t.biome];
  switch (t.improvement) {
    case 'mine':
      poly(ctx, [x - 7, y + 8, x - 7, y, x, y - 5, x + 7, y, x + 7, y + 8], '#3a3a40');
      poly(ctx, [x - 4, y + 8, x - 4, y + 2, x, y - 1, x + 4, y + 2, x + 4, y + 8], '#111');
      break;
    case 'lumber':
      box(ctx, x - 2, y + 2, 16, 8, '#8a5a2b');
      roof(ctx, x - 2, y - 6, 16, 8, '#6b3f1c');
      for (let i = 0; i < 3; i++) ellipse(ctx, x + 12, y + 6 - i * 3, 3, 1.5, '#c89560');
      break;
    case 'port':
      for (let i = 0; i < 4; i++) poly(ctx, [x - 12 + i * 5, y + WATER_DROP - 4 + i * 2.5, x - 8 + i * 5, y + WATER_DROP - 6 + i * 2.5, x + 4 + i * 5, y + WATER_DROP + i * 2.5, x + i * 5, y + WATER_DROP + 2 + i * 2.5], i % 2 ? '#a0703f' : '#8a5f33');
      ctx.fillStyle = '#5a3b1e';
      ctx.fillRect(x - 12, y + WATER_DROP - 4, 2, 8);
      ctx.fillRect(x + 12, y + WATER_DROP + 6, 2, 8);
      break;
    case 'temple': {
      if (t.terrain === 'mountain' || t.terrain === 'forest') {
        box(ctx, x, y + 4, 12, 6, '#e8e2d0');
        roof(ctx, x, y - 2, 12, 7, tribe.color);
      } else {
        box(ctx, x, y + 6, 22, 4, '#d8d2c0');
        box(ctx, x, y + 2, 16, 4, '#e8e2d0');
        box(ctx, x, y - 2, 10, 5, '#f4efe0');
        roof(ctx, x, y - 7, 10, 6, tribe.color);
      }
      break;
    }
    case 'market':
      for (const [ox, col] of [[-7, tribe.color], [7, '#f5d76e']] as const) {
        box(ctx, x + ox, y + 5, 10, 5, '#a07850');
        roof(ctx, x + ox, y, 12, 7, col);
      }
      break;
  }
}

function drawVillage(ctx: Ctx, x: number, y: number) {
  for (const [ox, oy] of [[-8, -2], [8, 0], [0, 6]]) {
    box(ctx, x + ox, y + oy, 11, 6, '#d9c09a');
    roof(ctx, x + ox, y + oy - 6, 13, 8, '#9b7a45');
  }
}

function drawRuin(ctx: Ctx, t: Tile, x: number, y: number) {
  const water = t.terrain === 'ocean' || t.terrain === 'shallow';
  const dy = water ? WATER_DROP : 0;
  box(ctx, x, y + 4 + dy, 20, 3, '#9fa4a8');
  for (const [ox, h] of [[-6, 14], [0, 8], [6, 11]]) box(ctx, x + ox, y + 3 + dy + ox / 3, 4, h, '#c8ccd0');
  ellipse(ctx, x - 6, y - 9 + dy, 3, 2, '#5b9b3f');
}

// ---------------------------------------------------------------- cities

function drawCity(ctx: Ctx, s: GameState, city: City, x: number, y: number) {
  const tribe = TRIBES[s.players[city.owner].tribe];
  const spots = [[0, -2], [-10, 2], [10, 2], [0, 8], [-6, -8], [7, -7], [-14, -3], [14, -2]];
  const n = Math.min(spots.length, city.level + 1);
  const bs = spots.slice(0, n).map(([ox, oy], i) => ({ x: x + ox, y: y + oy, i })).sort((a, b) => a.y - b.y);
  for (const b of bs) {
    const big = b.i === 0;
    drawBuilding(ctx, tribe.id, b.x, b.y, big, tribe.roof, tribe.color, city.capital && big);
  }
  if (city.walls) {
    ctx.strokeStyle = '#8d8d8d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 25, 12.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (city.parks) {
    ellipse(ctx, x + 16, y + 8, 4, 3, '#4caf50');
    ellipse(ctx, x - 16, y + 8, 4, 3, '#4caf50');
  }
}

function drawBuilding(ctx: Ctx, tribe: TribeId, x: number, y: number, big: boolean, roofC: string, color: string, capital: boolean) {
  const w = big ? 16 : 11;
  const h = big ? 12 : 7;
  switch (tribe) {
    case 'egypt':
      box(ctx, x, y, w, h, '#e9d8a6');
      if (big) {
        poly(ctx, [x + 4, y - h - 14, x + 2, y - h, x + 6, y - h], '#f2e2b0');
        poly(ctx, [x + 4, y - h - 14, x + 6, y - h, x + 7, y - h + 1], '#c9b07a');
      }
      break;
    case 'aztec':
      if (big) {
        box(ctx, x, y, w + 4, 5, '#c9b99a');
        box(ctx, x, y - 5, w - 2, 5, '#d8c9a9');
        box(ctx, x, y - 10, w - 8, 5, '#e6d8ba');
        box(ctx, x, y - 15, 5, 4, roofC);
      } else {
        box(ctx, x, y, w, h, '#e0cfae');
        roof(ctx, x, y - h, w + 2, 5, roofC);
      }
      break;
    case 'polynesia':
      box(ctx, x, y, w, h - 2, '#c8a36a');
      roof(ctx, x, y - h + 2, w + 5, big ? 12 : 9, '#a8864a');
      break;
    case 'rome':
      box(ctx, x, y, w, h, '#f4f1ea');
      roof(ctx, x, y - h, w + 2, 6, roofC);
      if (big) for (const ox of [-5, 0, 5]) { ctx.fillStyle = '#dcd6c8'; ctx.fillRect(x + ox - 0.8, y - h + 3, 1.6, h - 2); }
      break;
    case 'pirates':
      box(ctx, x, y, w, h, '#8a6440');
      roof(ctx, x, y - h, w + 2, 6, roofC);
      break;
  }
  if (capital) {
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - 1, y - h - 6);
    ctx.lineTo(x - 1, y - h - 24);
    ctx.stroke();
    poly(ctx, [x - 1, y - h - 24, x + 10, y - h - 21, x - 1, y - h - 17], tribe === 'pirates' ? '#111' : color);
    if (tribe === 'pirates') ellipse(ctx, x + 3, y - h - 21, 1.6, 1.6, '#fff');
  }
}

function drawCityLabel(ctx: Ctx, s: GameState, c: City) {
  const tribe = TRIBES[s.players[c.owner].tribe];
  const p = tileCenter(c.x, c.y);
  const y = p.y + 14;
  ctx.font = '600 11px system-ui, sans-serif';
  const label = `${c.capital ? '♛ ' : ''}${c.name}`;
  const tw = ctx.measureText(label).width;
  const inc = `★${c.level + (c.capital ? 1 : 0) + (c.workshop ? 1 : 0)}`;
  ctx.font = '600 10px system-ui, sans-serif';
  const iw = ctx.measureText(inc).width;
  const w = tw + iw + 16;
  ctx.fillStyle = shade(tribe.color, -0.1);
  ctx.globalAlpha = 0.92;
  roundRect(ctx, p.x - w / 2, y, w, 15, 3);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillText(label, p.x - w / 2 + 5, y + 8);
  ctx.font = '600 10px system-ui, sans-serif';
  ctx.fillStyle = '#ffd54a';
  ctx.fillText(inc, p.x + w / 2 - iw - 5, y + 8);
  ctx.textBaseline = 'alphabetic';
  // population pips
  const segs = c.level + 1;
  const bw = Math.max(28, segs * 7);
  const bx = p.x - bw / 2, by = y + 17;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  roundRect(ctx, bx, by, bw, 5, 2.5);
  ctx.fill();
  for (let i = 0; i < segs; i++) {
    const sx = bx + (bw / segs) * i;
    if (i < c.pop) {
      ctx.fillStyle = shade(tribe.color, 0.1);
      ctx.fillRect(sx + 1, by + 1, bw / segs - 2, 3);
    }
    if (i > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(sx - 0.5, by, 1, 5);
    }
  }
  if (c.pendingRewards.length && s.players[c.owner].human) {
    ellipse(ctx, p.x + w / 2 + 6, y + 7, 6, 6, '#ffd54a');
    ctx.fillStyle = '#3a2a00';
    ctx.font = 'bold 10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('!', p.x + w / 2 + 6, y + 11);
  }
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---------------------------------------------------------------- UI icons

/** Draws a small scene for an action button / info panel, centred at (x, y). */
export function drawIcon(ctx: Ctx, icon: string, tribe: TribeId, x: number, y: number) {
  const fake = (over: Partial<Tile>): Tile => ({
    x: 0, y: 0, terrain: 'field', biome: tribe, resource: null, improvement: null, road: false,
    village: false, ruin: false, cityId: null, owner: null, seed: 7, ...over,
  });
  const P = TRIBES[tribe].palette;
  if (icon in UNITS) return drawUnitSprite(ctx, icon as UnitKind, tribe, x, y + 10);
  switch (icon) {
    case 'fruit': case 'crop': case 'animal': case 'ore':
      if (icon === 'ore') drawMountain(ctx, fake({ terrain: 'mountain' }), x, y + 6, P);
      return drawResource(ctx, fake({ resource: icon }), x, y + 4, tribe);
    case 'fish': case 'whale':
      ellipse(ctx, x, y + 6, 20, 10, P.shallow);
      return drawResource(ctx, fake({ resource: icon }), x, y - 2, tribe);
    case 'farm':
      ctx.strokeStyle = '#e8c547';
      ctx.lineWidth = 3;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x - 14, y + i * 7 + 4); ctx.lineTo(x + 14, y + i * 7 - 2); ctx.stroke(); }
      return;
    case 'mine': return drawImprovementIcon(ctx, 'mine', tribe, x, y);
    case 'lumber': return drawImprovementIcon(ctx, 'lumber', tribe, x, y);
    case 'port': return drawImprovementIcon(ctx, 'port', tribe, x, y - 4);
    case 'temple': return drawImprovementIcon(ctx, 'temple', tribe, x, y + 2);
    case 'market': return drawImprovementIcon(ctx, 'market', tribe, x, y + 2);
    case 'axe': return drawTree(ctx, tribe, x, y + 10, 1.1, P.forest, P.trunk);
    case 'road':
      ctx.strokeStyle = '#b9925c'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 14, y + 8); ctx.lineTo(x + 14, y - 6); ctx.stroke();
      return;
    case 'ship': return drawBoat(ctx, 'ship', tribe, x, y + 12);
    case 'flag':
      ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - 6, y - 14, 2, 26);
      return poly(ctx, [x - 4, y - 14, x + 12, y - 9, x - 4, y - 4], TRIBES[tribe].color);
    case 'heal':
      ctx.fillStyle = '#4caf50'; ctx.fillRect(x - 3, y - 10, 6, 20); ctx.fillRect(x - 10, y - 3, 20, 6);
      return;
  }
}

function drawImprovementIcon(ctx: Ctx, imp: Tile['improvement'], tribe: TribeId, x: number, y: number) {
  const s = { players: [], cities: [] } as unknown as GameState;
  drawImprovement(ctx, s, { x: 0, y: 0, terrain: 'field', biome: tribe, resource: null, improvement: imp, road: false, village: false, ruin: false, cityId: null, owner: null, seed: 1 }, x, y);
}

/** Full-size city preview for panels. */
export function drawCityIcon(ctx: Ctx, tribe: TribeId, x: number, y: number, capital: boolean) {
  const T = TRIBES[tribe];
  drawBuilding(ctx, tribe, x - 8, y + 2, false, T.roof, T.color, false);
  drawBuilding(ctx, tribe, x + 4, y + 6, true, T.roof, T.color, capital);
}

// ---------------------------------------------------------------- units

function drawUnitAt(ctx: Ctx, s: GameState, u: Unit, ov: Overlay, viewer: number) {
  let { x, y } = tileCenter(u.x, u.y);
  const a = ov.anims.get(u.id);
  if (a) {
    const k = Math.min(1, (ov.now - a.t0) / ANIM_MS);
    const e = 1 - (1 - k) * (1 - k);
    const f = tileCenter(a.fx, a.fy);
    x = f.x + (x - f.x) * e;
    y = f.y + (y - f.y) * e;
  }
  const t = tileAt(s, u.x, u.y)!;
  if (t.terrain === 'shallow' || t.terrain === 'ocean') y += WATER_DROP - 2;
  const tribe = s.players[u.owner].tribe;
  const spent = u.owner === viewer && s.current === viewer && u.moved && u.attacked;
  ctx.globalAlpha = spent ? 0.6 : 1;
  ctx.save();
  ctx.translate(x, y + 4);
  ctx.scale(1.2, 1.2);
  drawUnitSprite(ctx, u.kind, tribe, 0, 0);
  ctx.restore();
  ctx.globalAlpha = 1;
  drawHpBadge(ctx, s, u, x, y);
}

const SKIN: Record<TribeId, string> = { egypt: '#c68a52', aztec: '#b87445', polynesia: '#a8683a', rome: '#e6b88e', pirates: '#e2ae84' };

/** Draws a unit centred on (x, y) (tile centre). Exported for UI portraits. */
export function drawUnitSprite(ctx: Ctx, kind: UnitKind, tribe: TribeId, x: number, y: number) {
  const T = TRIBES[tribe];
  const naval = UNITS[kind].naval;
  ellipse(ctx, x, y + 2, naval ? 16 : 10, naval ? 5 : 4, 'rgba(0,0,0,0.22)');
  if (naval) return drawBoat(ctx, kind, tribe, x, y);
  if (kind === 'catapult') return drawCatapult(ctx, T.color, x, y);

  const scale = kind === 'giant' ? 1.7 : 1;
  const mount = kind === 'rider' || kind === 'knight' || kind === 'chariot' || kind === 'jaguar';
  let by = y;
  if (mount) {
    if (kind === 'chariot') {
      box(ctx, x, y - 3, 14, 6, '#c9a14a');
      ellipse(ctx, x - 5, y - 2, 4, 5, '#6b4a1e');
      ellipse(ctx, x - 5, y - 2, 2, 3, '#c9a14a');
      drawAnimal(ctx, x + 9, y + 2, '#e7dcc5', false);
      by = y - 7;
    } else if (kind === 'jaguar') {
      drawAnimal(ctx, x, y + 3, '#e0a93b', false);
      for (let i = 0; i < 4; i++) ellipse(ctx, x - 4 + i * 3, y - 3 + (i % 2), 1, 1, '#3a2a10');
      by = y - 7;
    } else {
      drawAnimal(ctx, x, y + 3, kind === 'knight' ? '#eeeeee' : '#8a5a33', false);
      by = y - 7;
    }
  }

  const bw = 10 * scale, bh = 9 * scale;
  // legs
  if (!mount) {
    ctx.fillStyle = shade(T.colorDark, 0.1);
    ctx.fillRect(x - 3 * scale, by - 4 * scale, 2.5 * scale, 4 * scale);
    ctx.fillRect(x + 0.5 * scale, by - 4 * scale, 2.5 * scale, 4 * scale);
  }
  const bodyY = by - (mount ? 0 : 3 * scale);
  box(ctx, x, bodyY, bw, bh, kind === 'legionary' ? '#b33a2a' : T.color);
  if (tribe === 'polynesia') {
    ctx.fillStyle = '#2a1a10';
    for (let i = 0; i < 3; i++) ctx.fillRect(x - 4 * scale + i * 3 * scale, bodyY - bh + 3 * scale, 1.2 * scale, 4 * scale);
  }
  const hy = bodyY - bh;
  box(ctx, x, hy, 8 * scale, 7 * scale, SKIN[tribe]);
  // eyes
  ctx.fillStyle = '#111';
  ctx.fillRect(x + 0.5 * scale, hy - 4.5 * scale, 1.4 * scale, 1.6 * scale);
  ctx.fillRect(x + 3 * scale, hy - 3.8 * scale, 1.4 * scale, 1.6 * scale);
  drawHeadgear(ctx, tribe, kind, x, hy - 7 * scale, scale);
  drawWeapon(ctx, kind, tribe, x, bodyY, scale);
}

function drawHeadgear(ctx: Ctx, tribe: TribeId, kind: UnitKind, x: number, y: number, k: number) {
  switch (tribe) {
    case 'egypt': {
      // striped royal headcloth
      poly(ctx, [x - 5 * k, y + 1 * k, x, y - 3 * k, x + 5 * k, y + 1 * k, x + 5 * k, y + 8 * k, x - 5 * k, y + 8 * k], '#f0c43a');
      ctx.fillStyle = '#2b5fb8';
      for (let i = 0; i < 3; i++) ctx.fillRect(x - 5 * k, y + (2 + i * 2.2) * k, 1.4 * k, 1.1 * k);
      for (let i = 0; i < 3; i++) ctx.fillRect(x + 3.6 * k, y + (2 + i * 2.2) * k, 1.4 * k, 1.1 * k);
      break;
    }
    case 'aztec': {
      const cols = ['#1faa6b', '#f0c43a', '#d6453b', '#1faa6b', '#3a8ee0'];
      cols.forEach((c, i) => {
        const a = -Math.PI / 2 + (i - 2) * 0.38;
        poly(ctx, [x - 1 * k, y + 1 * k, x + 1 * k, y + 1 * k, x + Math.cos(a) * 10 * k, y + Math.sin(a) * 10 * k], c);
      });
      box(ctx, x, y + 2 * k, 8.5 * k, 2 * k, '#f0c43a');
      break;
    }
    case 'polynesia': {
      ellipse(ctx, x - 1 * k, y + 0.5 * k, 4.5 * k, 3 * k, '#2a1a10');
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ellipse(ctx, x + 4 * k + Math.cos(a) * 1.6 * k, y + 2 * k + Math.sin(a) * 1.6 * k, 1.3 * k, 1.3 * k, '#ffffff');
      }
      ellipse(ctx, x + 4 * k, y + 2 * k, 0.9 * k, 0.9 * k, '#ffd54a');
      break;
    }
    case 'rome': {
      box(ctx, x, y + 3 * k, 9 * k, 3 * k, '#9ea3a8');
      const plume = kind === 'legionary' || kind === 'swordsman' || kind === 'knight' ? '#d82a2a' : '#c9352c';
      ellipse(ctx, x, y - 1 * k, 5.5 * k, 2.4 * k, plume);
      break;
    }
    case 'pirates': {
      poly(ctx, [x - 7 * k, y + 2 * k, x, y - 4 * k, x + 7 * k, y + 2 * k, x, y + 4 * k], '#1b1b1f');
      poly(ctx, [x - 3 * k, y, x, y - 7 * k, x + 3 * k, y], '#26262b');
      ellipse(ctx, x, y - 1 * k, 1.3 * k, 1.1 * k, '#ffffff');
      break;
    }
  }
}

function drawWeapon(ctx: Ctx, kind: UnitKind, tribe: TribeId, x: number, bodyY: number, k: number) {
  const hx = x + 6 * k, hy = bodyY - 5 * k;
  ctx.lineCap = 'round';
  switch (kind) {
    case 'warrior':
    case 'legionary':
    case 'giant':
      ctx.strokeStyle = '#6b4a2b';
      ctx.lineWidth = 2 * k;
      ctx.beginPath();
      ctx.moveTo(hx, hy + 3 * k);
      ctx.lineTo(hx + 2 * k, hy - 9 * k);
      ctx.stroke();
      if (tribe === 'aztec') {
        ctx.fillStyle = '#222';
        for (let i = 0; i < 3; i++) ctx.fillRect(hx + 2 * k, hy - (7 - i * 2.5) * k, 1.6 * k, 1.4 * k);
      }
      if (kind === 'legionary') {
        box(ctx, x - 6 * k, bodyY + 1 * k, 4 * k, 10 * k, '#c9352c', '#f0c43a');
      }
      break;
    case 'archer':
    case 'buccaneer':
      if (kind === 'buccaneer') {
        ctx.strokeStyle = '#3a2a1a';
        ctx.lineWidth = 2 * k;
        ctx.beginPath();
        ctx.moveTo(hx - 3 * k, hy);
        ctx.lineTo(hx + 7 * k, hy - 4 * k);
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#8a5a2b';
        ctx.lineWidth = 1.6 * k;
        ctx.beginPath();
        ctx.arc(hx, hy - 2 * k, 7 * k, -1.1, 1.1);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(hx + Math.cos(-1.1) * 7 * k, hy - 2 * k + Math.sin(-1.1) * 7 * k);
        ctx.lineTo(hx + Math.cos(1.1) * 7 * k, hy - 2 * k + Math.sin(1.1) * 7 * k);
        ctx.stroke();
      }
      break;
    case 'defender':
      box(ctx, x + 5 * k, bodyY + 2 * k, 5 * k, 11 * k, '#8d98a5', TRIBES[tribe].color);
      break;
    case 'swordsman':
    case 'knight':
      ctx.strokeStyle = '#d6dde5';
      ctx.lineWidth = 2 * k;
      ctx.beginPath();
      ctx.moveTo(hx, hy + 2 * k);
      ctx.lineTo(hx + 4 * k, hy - 11 * k);
      ctx.stroke();
      ctx.strokeStyle = '#6b4a2b';
      ctx.beginPath();
      ctx.moveTo(hx - 2 * k, hy + 0.5 * k);
      ctx.lineTo(hx + 2.5 * k, hy + 1.5 * k);
      ctx.stroke();
      break;
    case 'rider':
    case 'chariot':
    case 'jaguar':
      ctx.strokeStyle = '#6b4a2b';
      ctx.lineWidth = 1.5 * k;
      ctx.beginPath();
      ctx.moveTo(hx - 2 * k, hy + 4 * k);
      ctx.lineTo(hx + 6 * k, hy - 10 * k);
      ctx.stroke();
      poly(ctx, [hx + 6 * k, hy - 13 * k, hx + 4.5 * k, hy - 9 * k, hx + 7.5 * k, hy - 9 * k], '#d6dde5');
      break;
  }
}

function drawCatapult(ctx: Ctx, color: string, x: number, y: number) {
  box(ctx, x, y - 1, 16, 4, '#8a5a2b');
  ellipse(ctx, x - 6, y, 3, 3, '#5a3b1e');
  ellipse(ctx, x + 6, y + 2, 3, 3, '#5a3b1e');
  ctx.strokeStyle = '#6b4a2b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - 2, y - 5);
  ctx.lineTo(x + 8, y - 20);
  ctx.stroke();
  ellipse(ctx, x + 8, y - 21, 3.5, 2.5, '#777');
  poly(ctx, [x - 7, y - 5, x - 3, y - 13, x + 1, y - 5], color);
}

function drawBoat(ctx: Ctx, kind: UnitKind, tribe: TribeId, x: number, y: number) {
  const T = TRIBES[tribe];
  const big = kind === 'warship' ? 1.3 : kind === 'ship' ? 1.12 : 1;
  const hull = tribe === 'pirates' ? '#3b2a1e' : '#8a5a2b';
  if (kind === 'waka') {
    for (const oy of [-3, 4]) {
      poly(ctx, [x - 16, y + oy - 3, x + 16, y + oy - 3, x + 12, y + oy + 1, x - 12, y + oy + 1], '#7a4a22');
      poly(ctx, [x - 16, y + oy - 3, x + 16, y + oy - 3, x + 14, y + oy - 5, x - 14, y + oy - 5], '#a86c38');
    }
    poly(ctx, [x, y - 30, x - 10, y - 4, x + 6, y - 6], T.color);
  } else {
    const w = 18 * big;
    poly(ctx, [x - w, y - 5, x + w, y - 5, x + w * 0.7, y + 3, x - w * 0.7, y + 3], hull);
    poly(ctx, [x - w, y - 5, x + w, y - 5, x + w * 0.9, y - 8, x - w * 0.9, y - 8], shade(hull, 0.25));
    ctx.fillStyle = '#5a3b1e';
    ctx.fillRect(x - 1, y - 34 * big, 2, 28 * big);
    const sail = tribe === 'pirates' ? '#1b1b1f' : '#f4f1e6';
    poly(ctx, [x + 1, y - 32 * big, x + 14 * big, y - 12, x + 1, y - 10], sail);
    poly(ctx, [x - 1, y - 30 * big, x - 12 * big, y - 12, x - 1, y - 10], shade(sail, -0.1));
    if (tribe === 'pirates') ellipse(ctx, x + 6, y - 20 * big, 2.2, 2, '#fff');
    else poly(ctx, [x + 1, y - 34 * big, x + 9, y - 32 * big, x + 1, y - 30 * big], T.color);
    if (kind === 'warship') for (const ox of [-10, -3, 4, 11]) ellipse(ctx, x + ox, y - 2, 1.5, 1.5, '#111');
  }
}

function drawHpBadge(ctx: Ctx, s: GameState, u: Unit, x: number, y: number) {
  const tribe = TRIBES[s.players[u.owner].tribe];
  const bx = x - 16, by = y - 30;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = tribe.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx - 6, by - 6);
  ctx.lineTo(bx + 6, by - 6);
  ctx.lineTo(bx + 6, by + 3);
  ctx.lineTo(bx, by + 7);
  ctx.lineTo(bx - 6, by + 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const hp = Math.ceil(u.hp);
  const low = hp <= maxHp(u) * 0.35;
  ctx.fillStyle = low ? '#d62828' : '#222';
  ctx.font = `bold ${hp >= 10 ? 8 : 9}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(String(hp), bx, by + 2.5);
  if (u.veteran) {
    ctx.fillStyle = '#ffd54a';
    ctx.font = 'bold 9px system-ui';
    ctx.fillText('★', bx, by - 8);
  }
}

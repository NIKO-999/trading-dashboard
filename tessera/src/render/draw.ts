// All game art is drawn procedurally here in a flat, low-poly isometric style:
// seamless terrain, faceted cloud cover, cone forests, ice-capped peaks and voxel units.
import { TRIBES, type BiomePalette } from '../data/tribes';
import { UNITS } from '../data/units';
import { tileAt } from '../game/grid';
import { cityById, cityIncome, maxHp, tileOwnerPlayer } from '../game/rules';
import type { City, GameState, Tile, TribeId, Unit, UnitKind } from '../game/types';
import { Camera, LAND_DEPTH, TH, TW, WATER_DROP, tileCenter, tileTop } from './camera';

type Ctx = CanvasRenderingContext2D;

export const FONT = '"Josefin Sans", "Avenir Next", system-ui, sans-serif';

export interface Overlay {
  selected: { x: number; y: number } | null;
  moves: { x: number; y: number }[];
  attacks: { x: number; y: number }[];
  glow: Set<number>; // tiles (y*size+x) holding something the viewer can harvest right now
  anims: Map<number, { fx: number; fy: number; t0: number }>;
  floaters: { x: number; y: number; text: string; color: string; t0: number }[];
  now: number;
}

export const ANIM_MS = 220;
export const FLOAT_MS = 1100;
const HW = TW / 2;
const HH = TH / 2;
const FOG_LIFT = 8;
const FOG = ['#ffffff', '#e4e8f8', '#c9d1f2', '#a8b5ea'];
const UNIT_SCALE = 1.3;

// ---------------------------------------------------------------- colour & shape utils

export function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function mix(a: string, b: string, k: number) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
}

const rand = (seed: number, i: number) => {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const isWaterTile = (t: Tile) => t.terrain === 'shallow' || t.terrain === 'ocean';

function poly(ctx: Ctx, pts: number[], fill: string) {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

/** An isometric box standing on (cx, cy) with footprint w (world px), height h. */
function box(ctx: Ctx, cx: number, cy: number, w: number, h: number, color: string, top?: string) {
  const hw = w / 2, hh = w / 4;
  poly(ctx, [cx - hw, cy - h, cx, cy + hh - h, cx, cy + hh, cx - hw, cy], shade(color, 0.06));
  poly(ctx, [cx + hw, cy - h, cx, cy + hh - h, cx, cy + hh, cx + hw, cy], shade(color, -0.2));
  poly(ctx, [cx, cy - hh - h, cx + hw, cy - h, cx, cy + hh - h, cx - hw, cy - h], top ?? shade(color, 0.22));
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

function diamond(ctx: Ctx, x: number, y: number, fill: string) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + HW, y + HH);
  ctx.lineTo(x, y + TH);
  ctx.lineTo(x - HW, y + HH);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  // A hairline stroke in the same colour hides anti-aliasing seams between tiles.
  ctx.strokeStyle = fill;
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

function sides(ctx: Ctx, x: number, y: number, depth: number, left: string, right: string) {
  poly(ctx, [x - HW, y + HH, x, y + TH, x, y + TH + depth, x - HW, y + HH + depth], left);
  poly(ctx, [x + HW, y + HH, x, y + TH, x, y + TH + depth, x + HW, y + HH + depth], right);
}

/** Screen point for tile-local coords (u along +x, v along +y, both -0.5..0.5) around a tile centre. */
const uv = (cx: number, cy: number, u: number, v: number) => ({ x: cx + (u - v) * HW, y: cy + (u + v) * HH });

export function drawStar(ctx: Ctx, x: number, y: number, r: number, fill = '#ffcf33') {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.48 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = '#b87a00';
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

// ---------------------------------------------------------------- background

let stars: { x: number; y: number; s: number; a: number }[] = [];
export function drawBackground(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  if (!stars.length) stars = Array.from({ length: 120 }, (_, i) => ({ x: rand(i, 1), y: rand(i, 2), s: rand(i, 3) < 0.8 ? 2 : 3, a: 0.35 + rand(i, 4) * 0.65 }));
  for (const s of stars) {
    ctx.fillStyle = `rgba(255,255,255,${s.a})`;
    ctx.fillRect(Math.round(s.x * w), Math.round(s.y * h), s.s, s.s);
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

  // Viewport culling in world space (generous margins for tall scenery).
  const w0 = cam.toWorld(-TW * 2, -TH * 6);
  const w1 = cam.toWorld(vw + TW * 2, vh + TH * 4);
  const visible = (t: Tile) => {
    const c = tileCenter(t.x, t.y);
    return c.x > w0.x && c.x < w1.x && c.y > w0.y && c.y < w1.y;
  };
  const shown = order.filter(visible);

  // Pass 1: ground.
  for (const t of shown) if (explored(t.x, t.y)) drawGround(ctx, s, t);
  // Pass 2: territory fences and ground highlights.
  for (const t of shown) if (explored(t.x, t.y)) drawBorders(ctx, s, t, explored);
  if (ov.selected) outlineTile(ctx, s, ov.selected.x, ov.selected.y, '#ffffff', 2.5);
  for (const m of ov.moves) {
    const t = tileAt(s, m.x, m.y)!;
    const c = tileCenter(m.x, m.y);
    ellipse(ctx, c.x, c.y + (isWaterTile(t) ? WATER_DROP : 0), 9, 4.5, 'rgba(255,255,255,0.8)');
  }

  // Pass 3: scenery, units and cloud cover in painter's order.
  const unitsByTile = new Map<number, Unit>();
  for (const u of s.units) unitsByTile.set(u.y * s.size + u.x, u);
  for (const t of shown) {
    const i = t.y * s.size + t.x;
    if (!explored(t.x, t.y)) {
      drawFog(ctx, s, t, explored);
      continue;
    }
    drawScenery(ctx, s, t, ov.glow.has(i));
    const u = unitsByTile.get(i);
    if (u) drawUnitAt(ctx, s, u, ov, viewer);
  }

  // Pass 4: overlays that always sit on top.
  for (const a of ov.attacks) {
    const t = tileAt(s, a.x, a.y)!;
    const c = tileCenter(a.x, a.y);
    const y = c.y + (isWaterTile(t) ? WATER_DROP : 0);
    ctx.strokeStyle = '#ff3030';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(c.x, y, 18, 9, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const c of s.cities) if (explored(c.x, c.y) && visible(tileAt(s, c.x, c.y)!)) drawCityLabel(ctx, s, c);
  for (const f of ov.floaters) {
    const k = (ov.now - f.t0) / FLOAT_MS;
    if (k < 0 || k > 1) continue;
    const c = tileCenter(f.x, f.y);
    ctx.globalAlpha = 1 - k * k;
    ctx.font = `700 15px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    ctx.strokeText(f.text, c.x, c.y - 40 - k * 22);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, c.x, c.y - 40 - k * 22);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ---------------------------------------------------------------- ground

function drawGround(ctx: Ctx, s: GameState, t: Tile) {
  const P = TRIBES[t.biome].palette;
  const { x, y } = tileTop(t.x, t.y);
  if (isWaterTile(t)) {
    const col = t.terrain === 'shallow' ? P.shallow : P.ocean;
    const yy = y + WATER_DROP;
    sides(ctx, x, yy, LAND_DEPTH - WATER_DROP + 2, shade(col, -0.2), shade(col, -0.35));
    diamond(ctx, x, yy, col);
    if (t.terrain === 'ocean' && rand(t.seed, 1) < 0.5) {
      const c = uv(x, yy + HH, rand(t.seed, 2) * 0.5 - 0.25, rand(t.seed, 3) * 0.5 - 0.25);
      poly(ctx, [c.x - 7, c.y, c.x, c.y - 1.6, c.x + 7, c.y, c.x, c.y + 1.6], shade(col, 0.14));
    }
    return;
  }
  sides(ctx, x, y, LAND_DEPTH, P.fieldSide, shade(P.fieldSide, -0.25));
  diamond(ctx, x, y, P.field);
  if (t.improvement === 'farm') drawFarm(ctx, x, y + HH);
  if (t.road || t.cityId !== null) drawRoads(ctx, s, t);
}

function drawFarm(ctx: Ctx, cx: number, cy: number) {
  const k = 0.42;
  const a = uv(cx, cy, -k, -k), b = uv(cx, cy, k, -k), c = uv(cx, cy, k, k), d = uv(cx, cy, -k, k);
  poly(ctx, [a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y], '#e2c65a');
  ctx.strokeStyle = '#b8942f';
  ctx.lineWidth = 1.6;
  for (let i = 1; i < 5; i++) {
    const v = -k + (i * 2 * k) / 5;
    const p = uv(cx, cy, -k, v), q = uv(cx, cy, k, v);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.stroke();
  }
}

function drawRoads(ctx: Ctx, s: GameState, t: Tile) {
  const c = tileCenter(t.x, t.y);
  ctx.strokeStyle = '#c9a36b';
  ctx.lineWidth = 4;
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
  if (!any && t.road) ellipse(ctx, c.x, c.y, 6, 3, '#c9a36b');
}

// ---------------------------------------------------------------- cloud cover

function drawFog(ctx: Ctx, s: GameState, t: Tile, explored: (x: number, y: number) => boolean) {
  const { x, y: gy } = tileTop(t.x, t.y);
  const y = gy - FOG_LIFT;
  // Walls where the cloud layer ends: towards revealed land or off the map edge.
  const r = tileAt(s, t.x + 1, t.y);
  const l = tileAt(s, t.x, t.y + 1);
  if (!r || explored(r.x, r.y)) {
    const d = FOG_LIFT + (r ? 0 : LAND_DEPTH);
    poly(ctx, [x + HW, y + HH, x, y + TH, x, y + TH + d, x + HW, y + HH + d], '#95a3dc');
  }
  if (!l || explored(l.x, l.y)) {
    const d = FOG_LIFT + (l ? 0 : LAND_DEPTH);
    poly(ctx, [x - HW, y + HH, x, y + TH, x, y + TH + d, x - HW, y + HH + d], '#b4bee9');
  }
  // Faceted top: each tile is split into eight triangles. The eight triangles that meet at a
  // tile corner (from four neighbouring tiles) are shaded as one pinwheel around that corner.
  const T = { x, y }, R = { x: x + HW, y: y + HH }, B = { x, y: y + TH }, L = { x: x - HW, y: y + HH };
  const C = { x, y: y + HH };
  const m = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const tr = m(T, R), rb = m(R, B), bl = m(B, L), lt = m(L, T);
  // [triangle, lattice corner it touches]
  const tris: [{ x: number; y: number }[], number, number][] = [
    [[T, tr, C], t.x, t.y], [[T, C, lt], t.x, t.y],
    [[R, C, tr], t.x + 1, t.y], [[R, rb, C], t.x + 1, t.y],
    [[B, C, rb], t.x + 1, t.y + 1], [[B, bl, C], t.x + 1, t.y + 1],
    [[L, C, bl], t.x, t.y + 1], [[L, lt, C], t.x, t.y + 1],
  ];
  for (const [tri, cx, cy] of tris) {
    const corner = tri[0];
    const gx = (tri[1].x + tri[2].x) / 2 - corner.x, gy = (tri[1].y + tri[2].y) / 2 - corner.y;
    const sector = Math.floor(((Math.atan2(gy * 2, gx) + Math.PI) / (Math.PI * 2)) * 8) & 7;
    const hash = (cx * 7 + cy * 13 + ((cx * cy) & 3)) & 3;
    const col = FOG[(sector + hash) & 3];
    ctx.beginPath();
    ctx.moveTo(tri[0].x, tri[0].y);
    ctx.lineTo(tri[1].x, tri[1].y);
    ctx.lineTo(tri[2].x, tri[2].y);
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
}

// ---------------------------------------------------------------- territory

function drawBorders(ctx: Ctx, s: GameState, t: Tile, explored: (x: number, y: number) => boolean) {
  const owner = tileOwnerPlayer(s, t);
  if (owner === null) return;
  const color = TRIBES[s.players[owner].tribe].color;
  const { x, y: ty } = tileTop(t.x, t.y);
  const y = ty + (isWaterTile(t) ? WATER_DROP : 0);
  const c = { x, y: y + HH };
  const T = { x, y }, R = { x: x + HW, y: y + HH }, B = { x, y: y + TH }, L = { x: x - HW, y: y + HH };
  const edges: [number, number, { x: number; y: number }, { x: number; y: number }][] = [
    [-1, 0, T, L], // upper-left edge, shared with (x-1, y)
    [0, -1, T, R], // upper-right edge, shared with (x, y-1)
    [1, 0, R, B], // lower-right edge, shared with (x+1, y)
    [0, 1, L, B], // lower-left edge, shared with (x, y+1)
  ];
  for (const [dx, dy, a, b] of edges) {
    const n = tileAt(s, t.x + dx, t.y + dy);
    if (n && tileOwnerPlayer(s, n) === owner && explored(n.x, n.y)) continue;
    const inset = (p: { x: number; y: number }) => ({ x: p.x + (c.x - p.x) * 0.1, y: p.y + (c.y - p.y) * 0.1 });
    fence(ctx, inset(a), inset(b), color);
  }
}

/** A row of raised, block-like fence posts along a territory edge. */
function fence(ctx: Ctx, a: { x: number; y: number }, b: { x: number; y: number }, color: string) {
  const n = 6;
  const h = 5;
  const top = shade(color, 0.3);
  for (let i = 0; i < n; i++) {
    const f0 = (i + 0.2) / n, f1 = (i + 0.8) / n;
    const x0 = a.x + (b.x - a.x) * f0, y0 = a.y + (b.y - a.y) * f0;
    const x1 = a.x + (b.x - a.x) * f1, y1 = a.y + (b.y - a.y) * f1;
    poly(ctx, [x0, y0 + 2, x1, y1 + 2, x1, y1 - h, x0, y0 - h], shade(color, -0.35));
    poly(ctx, [x0, y0 + 0.5, x1, y1 + 0.5, x1, y1 - h, x0, y0 - h], color);
    ctx.strokeStyle = top;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x0, y0 - h);
    ctx.lineTo(x1, y1 - h);
    ctx.stroke();
  }
}

export function outlineTile(ctx: Ctx, s: GameState, tx: number, ty: number, color: string, width: number) {
  const t = tileAt(s, tx, ty);
  if (!t) return;
  const { x, y } = tileTop(tx, ty);
  const dy = isWaterTile(t) ? WATER_DROP : 0;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y + dy);
  ctx.lineTo(x + HW, y + HH + dy);
  ctx.lineTo(x, y + TH + dy);
  ctx.lineTo(x - HW, y + HH + dy);
  ctx.closePath();
  ctx.stroke();
}

// ---------------------------------------------------------------- scenery

function drawScenery(ctx: Ctx, s: GameState, t: Tile, glow: boolean) {
  const c = tileCenter(t.x, t.y);
  const P = TRIBES[t.biome].palette;
  if (glow) drawGlow(ctx, c.x, c.y + (isWaterTile(t) ? WATER_DROP : 0));
  if (t.terrain === 'forest' && t.improvement !== 'lumber') drawForest(ctx, t, c.x, c.y, P);
  if (t.terrain === 'mountain') drawMountains(ctx, t, c.x, c.y, P);
  if (t.resource) drawResource(ctx, t, c.x, c.y, t.biome);
  if (t.improvement && t.improvement !== 'farm') drawImprovement(ctx, s, t, c.x, c.y);
  if (t.village) drawVillage(ctx, c.x, c.y);
  if (t.ruin) drawRuin(ctx, t, c.x, c.y);
  if (t.cityId !== null) {
    const city = cityById(s, t.cityId);
    if (city) drawCity(ctx, s, city, c.x, c.y);
  }
}

function drawGlow(ctx: Ctx, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, 0.5);
  const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 30);
  g.addColorStop(0, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.55, 'rgba(170,245,255,0.45)');
  g.addColorStop(1, 'rgba(170,245,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const TREE_SPOTS: [number, number][] = [
  [-0.28, -0.28], [0.02, -0.31], [0.3, -0.26], [-0.31, 0.02], [0, 0], [0.29, 0.04], [-0.26, 0.3], [0.05, 0.29], [0.31, 0.31],
];

function drawForest(ctx: Ctx, t: Tile, cx: number, cy: number, P: BiomePalette) {
  const n = 6 + Math.floor(rand(t.seed, 5) * 3);
  const trees = TREE_SPOTS.map((p, i) => ({ p, i, r: rand(t.seed, 80 + i) }))
    .sort((a, b) => a.r - b.r)
    .slice(0, n)
    .map(({ p, i }) => ({ ...uv(cx, cy, p[0] + (rand(t.seed, 50 + i) - 0.5) * 0.1, p[1] + (rand(t.seed, 60 + i) - 0.5) * 0.1), i }))
    .sort((a, b) => a.y - b.y);
  for (const tr of trees) drawTree(ctx, t.biome, tr.x, tr.y, 0.85 + rand(t.seed, 70 + tr.i) * 0.35, P, tr.i);
}

function drawTree(ctx: Ctx, biome: TribeId, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  ellipse(ctx, x + 1.5, y, 4.5 * k, 1.8 * k, 'rgba(0,0,0,0.16)');
  if (biome === 'egypt' || biome === 'polynesia') {
    // palm: segmented trunk and a star of fronds
    ctx.strokeStyle = P.trunk;
    ctx.lineWidth = 2.4 * k;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 3 * k, y - 11 * k, x + 1.5 * k, y - 21 * k);
    ctx.stroke();
    const tx = x + 1.5 * k, ty = y - 21 * k;
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.62;
      const ex = tx + Math.cos(a) * 11 * k, ey = ty + Math.sin(a) * 5 * k + 5.5 * k;
      poly(ctx, [tx, ty - 1, ex, ey, tx + Math.cos(a) * 4 * k, ty + 2.5 * k], i % 2 ? P.forest : shade(P.forest, 0.22));
    }
    if (biome === 'polynesia') ellipse(ctx, tx, ty + 2 * k, 1.8 * k, 1.8 * k, '#6b4a1e');
    return;
  }
  const trunk = () => {
    ctx.fillStyle = P.trunk;
    ctx.fillRect(x - 1 * k, y - 4 * k, 2 * k, 4 * k);
  };
  const cone = (bx: number, by: number, h: number, w: number, col: string) => {
    poly(ctx, [bx, by - h, bx - w / 2, by - 1, bx, by + w * 0.18], shade(col, 0.12));
    poly(ctx, [bx, by - h, bx + w / 2, by - 1, bx, by + w * 0.18], shade(col, -0.2));
  };
  if (biome === 'aztec' && variant % 3 === 0) {
    // broad jungle canopy on a tall trunk
    ctx.fillStyle = P.trunk;
    ctx.fillRect(x - 1.1 * k, y - 11 * k, 2.2 * k, 11 * k);
    const cy = y - 15 * k, r = 7.5 * k;
    const pts: number[] = [];
    for (let i = 0; i < 8; i++) pts.push(x + Math.cos((i / 8) * Math.PI * 2) * r, cy + Math.sin((i / 8) * Math.PI * 2) * r * 0.75);
    poly(ctx, pts, shade(P.forest, -0.12));
    poly(ctx, [x, cy - r * 0.75, x - r, cy, x - r * 0.7, cy + r * 0.5, x, cy + r * 0.2], shade(P.forest, 0.12));
    return;
  }
  trunk();
  if (biome === 'pirates') {
    for (let i = 0; i < 3; i++) cone(x, y - 3 * k - i * 6 * k, 11 * k, (11 - i * 2.5) * k, P.forest);
    return;
  }
  const h = biome === 'aztec' ? 28 : 25;
  cone(x, y - 2 * k, h * k, 8.5 * k, P.forest);
}

function drawMountains(ctx: Ctx, t: Tile, cx: number, cy: number, P: BiomePalette) {
  const peaks = [
    { u: -0.16, v: -0.1, h: 30, w: 30 },
    { u: 0.12, v: -0.22, h: 40, w: 36 },
    { u: 0.14, v: 0.16, h: 22, w: 24 },
  ].slice(0, 2 + (t.seed % 2));
  const placed = peaks.map((p, i) => ({ ...uv(cx, cy, p.u, p.v), h: p.h * (0.88 + rand(t.seed, 90 + i) * 0.24), w: p.w, i }))
    .sort((a, b) => a.y - b.y);
  for (const p of placed) peak(ctx, p.x, p.y + 4, p.h, p.w, P, t.biome, t.seed + p.i * 17);
}

function peak(ctx: Ctx, x: number, y: number, h: number, w: number, P: BiomePalette, biome: TribeId, seed: number) {
  const A = [x + (rand(seed, 1) - 0.5) * w * 0.15, y - h];
  const L = [x - w / 2, y - w * 0.04];
  const F = [x + (rand(seed, 2) - 0.5) * w * 0.12, y + w * 0.2];
  const R = [x + w / 2, y - w * 0.07];
  poly(ctx, [A[0], A[1], L[0], L[1], F[0], F[1]], P.mountain);
  poly(ctx, [A[0], A[1], F[0], F[1], R[0], R[1]], P.mountainShade);
  const lerp = (p: number[], q: number[], k: number) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
  if (biome === 'egypt') {
    // sun-bleached crown instead of ice
    const l = lerp(A, L, 0.22), f = lerp(A, F, 0.24), r = lerp(A, R, 0.22);
    poly(ctx, [A[0], A[1], l[0], l[1], f[0], f[1]], P.snow);
    poly(ctx, [A[0], A[1], f[0], f[1], r[0], r[1]], shade(P.snow, -0.14));
    return;
  }
  const k = 0.36;
  const l = lerp(A, L, k), f = lerp(A, F, k * 1.08), r = lerp(A, R, k);
  const lm = lerp(l, f, 0.5), rm = lerp(f, r, 0.5);
  lm[1] += h * 0.07;
  rm[1] += h * 0.05;
  poly(ctx, [A[0], A[1], l[0], l[1], lm[0], lm[1], f[0], f[1]], P.snow);
  poly(ctx, [A[0], A[1], f[0], f[1], rm[0], rm[1], r[0], r[1]], mix(P.snow, '#7fd3ea', 0.35));
}

const FRUIT: Record<TribeId, string> = { egypt: '#8e3f1c', aztec: '#f29a2e', polynesia: '#f2c53a', rome: '#e2324a', pirates: '#78c43e' };
const CRITTER: Record<TribeId, { body: string; feature: 'hump' | 'antlers' | 'snout' | 'horns' | 'tusks' }> = {
  egypt: { body: '#d0a45e', feature: 'hump' },
  aztec: { body: '#9c6236', feature: 'antlers' },
  polynesia: { body: '#e99aa2', feature: 'snout' },
  rome: { body: '#34343b', feature: 'horns' },
  pirates: { body: '#5a4235', feature: 'tusks' },
};

function drawFruit(ctx: Ctx, x: number, y: number, col: string) {
  ellipse(ctx, x + 1, y + 0.5, 5, 2, 'rgba(0,0,0,0.18)');
  poly(ctx, [x, y - 10, x - 5, y - 7, x - 5, y - 2.5, x, y], shade(col, 0.1));
  poly(ctx, [x, y - 10, x + 5, y - 7, x + 5, y - 2.5, x, y], shade(col, -0.18));
  poly(ctx, [x, y - 10, x - 5, y - 7, x, y - 5.5, x + 5, y - 7], shade(col, 0.28));
  ctx.strokeStyle = '#5a3b1e';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y - 9);
  ctx.lineTo(x + 0.5, y - 12);
  ctx.stroke();
  poly(ctx, [x + 0.5, y - 11.5, x + 5, y - 14, x + 2, y - 10.5], '#3fae3a');
}

function drawCritter(ctx: Ctx, x: number, y: number, biome: TribeId, k = 1, override?: string) {
  const spec = CRITTER[biome];
  const body = override ?? spec.body;
  ellipse(ctx, x + 2 * k, y + 1, 11 * k, 3 * k, 'rgba(0,0,0,0.2)');
  ctx.fillStyle = shade(body, -0.3);
  for (const lx of [-6, -2.5, 3, 6.5]) ctx.fillRect(x + lx * k, y - 6 * k, 2.2 * k, 7 * k);
  box(ctx, x, y - 5 * k, 16 * k, 7 * k, body);
  if (!override && spec.feature === 'hump') box(ctx, x - 1 * k, y - 12 * k, 6 * k, 4 * k, shade(body, 0.05));
  box(ctx, x + 9 * k, y - 10 * k, 7.5 * k, 7.5 * k, shade(body, 0.04));
  ctx.fillStyle = override ? '#111' : spec.feature === 'horns' ? '#f4f0e2' : '#111';
  ctx.fillRect(x + 10.5 * k, y - 15 * k, 1.6 * k, 1.6 * k);
  if (override) return;
  switch (spec.feature) {
    case 'horns':
      poly(ctx, [x + 7 * k, y - 20 * k, x + 6 * k, y - 25 * k, x + 9 * k, y - 20 * k], '#e8e2cf');
      poly(ctx, [x + 10 * k, y - 20 * k, x + 11 * k, y - 25 * k, x + 12.5 * k, y - 19.5 * k], '#d2cab4');
      break;
    case 'antlers':
      ctx.strokeStyle = '#e6d3ad';
      ctx.lineWidth = 1.2 * k;
      ctx.beginPath();
      ctx.moveTo(x + 8 * k, y - 20 * k); ctx.lineTo(x + 6 * k, y - 26 * k); ctx.lineTo(x + 4 * k, y - 27 * k);
      ctx.moveTo(x + 11 * k, y - 20 * k); ctx.lineTo(x + 13 * k, y - 26 * k); ctx.lineTo(x + 15 * k, y - 27 * k);
      ctx.stroke();
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

function drawResource(ctx: Ctx, t: Tile, x: number, y: number, biome: TribeId) {
  switch (t.resource) {
    case 'fruit':
      for (const [u, v] of [[-0.2, -0.14], [0.18, -0.06], [-0.02, 0.2]]) {
        const p = uv(x, y, u, v);
        drawFruit(ctx, p.x, p.y + 2, FRUIT[biome]);
      }
      break;
    case 'crop':
      for (const [u, v] of [[-0.2, -0.12], [0.2, -0.1], [0, 0.2]]) {
        const p = uv(x, y, u, v);
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
          const px = p.x - 4.5 + i * 3, py = p.y + 2 + (i % 2);
          ctx.strokeStyle = '#b8912e';
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + (i - 1.5) * 0.8, py - 12);
          ctx.stroke();
          ellipse(ctx, px + (i - 1.5) * 0.8, py - 13, 1.9, 3.8, '#f2c94c');
        }
      }
      break;
    case 'animal':
      drawCritter(ctx, x - 5, y + 4, biome, 1.1);
      break;
    case 'fish':
      for (const [u, v, f] of [[-0.18, -0.1, 1], [0.16, 0.12, -1]] as const) {
        const p = uv(x, y + WATER_DROP, u, v);
        ctx.globalAlpha = 0.85;
        ellipse(ctx, p.x, p.y, 7, 2.6, '#dff7ff');
        poly(ctx, [p.x - 6 * f, p.y, p.x - 11 * f, p.y - 3.5, p.x - 11 * f, p.y + 3.5], '#dff7ff');
        ctx.globalAlpha = 1;
      }
      break;
    case 'ore':
      for (const [ox, oy, h] of [[-5, 11, 10], [1, 13, 14], [7, 11, 8]]) {
        poly(ctx, [x + ox, y + oy - h, x + ox - 3.5, y + oy, x + ox, y + oy + 1.5], '#c6f4ff');
        poly(ctx, [x + ox, y + oy - h, x + ox + 3.5, y + oy, x + ox, y + oy + 1.5], '#5fb7d6');
      }
      break;
    case 'whale': {
      const wy = y + WATER_DROP + 2;
      ellipse(ctx, x, wy, 15, 5.5, '#26344f');
      ellipse(ctx, x - 2, wy - 2, 11, 3, '#3b4f75');
      poly(ctx, [x + 13, wy - 1, x + 21, wy - 7, x + 20, wy + 2], '#26344f');
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x - 6, wy - 4);
      ctx.quadraticCurveTo(x - 9, wy - 13, x - 13, wy - 14);
      ctx.moveTo(x - 6, wy - 4);
      ctx.quadraticCurveTo(x - 3, wy - 13, x + 1, wy - 14);
      ctx.stroke();
      break;
    }
  }
}

function drawImprovement(ctx: Ctx, s: GameState, t: Tile, x: number, y: number) {
  const owner = tileOwnerPlayer(s, t);
  const tribe = owner !== null && s.players[owner] ? TRIBES[s.players[owner].tribe] : TRIBES[t.biome];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.25, 1.25);
  switch (t.improvement) {
    case 'mine':
      poly(ctx, [-7, 8, -7, 0, 0, -5, 7, 0, 7, 8], '#3a3a40');
      poly(ctx, [-4, 8, -4, 2, 0, -1, 4, 2, 4, 8], '#111');
      box(ctx, 9, 9, 5, 3, '#8a5a2b');
      break;
    case 'lumber':
      box(ctx, -2, 2, 16, 8, '#8a5a2b');
      roof(ctx, -2, -6, 16, 8, '#6b3f1c');
      for (let i = 0; i < 3; i++) ellipse(ctx, 12, 6 - i * 3, 3, 1.5, '#c89560');
      break;
    case 'port': {
      const d = WATER_DROP / 1.25;
      for (let i = 0; i < 4; i++) poly(ctx, [-12 + i * 5, d - 4 + i * 2.5, -8 + i * 5, d - 6 + i * 2.5, 4 + i * 5, d + i * 2.5, i * 5, d + 2 + i * 2.5], i % 2 ? '#a0703f' : '#8a5f33');
      ctx.fillStyle = '#5a3b1e';
      ctx.fillRect(-12, d - 4, 2, 8);
      ctx.fillRect(12, d + 6, 2, 8);
      break;
    }
    case 'temple':
      if (t.terrain === 'mountain' || t.terrain === 'forest') {
        box(ctx, 0, 4, 12, 6, '#e8e2d0');
        roof(ctx, 0, -2, 12, 7, tribe.color);
      } else {
        box(ctx, 0, 6, 22, 4, '#d8d2c0');
        box(ctx, 0, 2, 16, 4, '#e8e2d0');
        box(ctx, 0, -2, 10, 5, '#f4efe0');
        roof(ctx, 0, -7, 10, 6, tribe.color);
      }
      break;
    case 'market':
      for (const [ox, col] of [[-7, tribe.color], [7, '#f5d76e']] as const) {
        box(ctx, ox, 5, 10, 5, '#a07850');
        roof(ctx, ox, 0, 12, 7, col);
      }
      break;
  }
  ctx.restore();
}

function drawVillage(ctx: Ctx, x: number, y: number) {
  ellipse(ctx, x, y + 2, 20, 9, 'rgba(120,90,50,0.25)');
  for (const [u, v] of [[-0.2, -0.16], [0.2, -0.12], [0, 0.18]]) {
    const p = uv(x, y, u, v);
    // conical thatch hut
    poly(ctx, [p.x, p.y - 16, p.x - 8, p.y, p.x, p.y + 3], '#b88a52');
    poly(ctx, [p.x, p.y - 16, p.x + 8, p.y, p.x, p.y + 3], '#8e6536');
    poly(ctx, [p.x + 1, p.y - 5, p.x + 4, p.y - 3, p.x + 4, p.y + 1.5, p.x + 1, p.y + 2.5], '#3a2a18');
  }
}

function drawRuin(ctx: Ctx, t: Tile, x: number, y: number) {
  const dy = isWaterTile(t) ? WATER_DROP : 0;
  box(ctx, x, y + 5 + dy, 24, 3, '#9fa4a8');
  for (const [ox, h] of [[-7, 16], [0, 9], [7, 13]]) box(ctx, x + ox, y + 4 + dy + ox / 3, 5, h, '#c8ccd0');
  ellipse(ctx, x - 7, y - 11 + dy, 3.5, 2.2, '#5b9b3f');
}

// ---------------------------------------------------------------- cities

function drawCity(ctx: Ctx, s: GameState, city: City, x: number, y: number) {
  const tribe = TRIBES[s.players[city.owner].tribe];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.3, 1.3);
  const spots = [[0, -2], [-10, 2], [10, 2], [0, 8], [-6, -8], [7, -7], [-14, -3], [14, -2]];
  const n = Math.min(spots.length, city.level + 1);
  const bs = spots.slice(0, n).map(([ox, oy], i) => ({ x: ox, y: oy, i })).sort((a, b) => a.y - b.y);
  if (city.walls) {
    for (const [u, v] of [[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.42], [0.42, 0.42]]) {
      const p = uv(0, 0, u, v);
      box(ctx, p.x / 1.3, p.y / 1.3, 5, 7, '#9a9aa2');
    }
  }
  for (const b of bs) drawBuilding(ctx, tribe.id, b.x, b.y, b.i === 0, tribe.roof, tribe.color, city.capital && b.i === 0);
  if (city.parks) {
    drawTree(ctx, 'rome', 15, 9, 0.5, tribe.palette, 1);
    drawTree(ctx, 'rome', -15, 9, 0.5, tribe.palette, 1);
  }
  ctx.restore();
}

function drawBuilding(ctx: Ctx, tribe: TribeId, x: number, y: number, big: boolean, roofC: string, color: string, capital: boolean) {
  const w = big ? 16 : 11;
  const h = big ? 13 : 8;
  switch (tribe) {
    case 'egypt':
      box(ctx, x, y, w, h, '#ecdcaa');
      if (big) {
        poly(ctx, [x + 4, y - h - 15, x + 2, y - h, x + 6, y - h], '#f6e7b8');
        poly(ctx, [x + 4, y - h - 15, x + 6, y - h, x + 7, y - h + 1], '#c9b07a');
      }
      break;
    case 'aztec':
      if (big) {
        box(ctx, x, y, w + 4, 5, '#c9b99a');
        box(ctx, x, y - 5, w - 2, 5, '#d8c9a9');
        box(ctx, x, y - 10, w - 8, 5, '#e6d8ba');
        box(ctx, x, y - 15, 5, 4, roofC);
      } else {
        box(ctx, x, y, w, h, '#e6d6b5');
        roof(ctx, x, y - h, w + 2, 5, roofC);
      }
      break;
    case 'polynesia':
      box(ctx, x, y, w, h - 2, '#c8a36a');
      roof(ctx, x, y - h + 2, w + 5, big ? 13 : 9, '#a8864a');
      break;
    case 'rome':
      box(ctx, x, y, w, h, '#f7f4ee');
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
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x - 1, y - h - 6);
    ctx.lineTo(x - 1, y - h - 26);
    ctx.stroke();
    poly(ctx, [x - 1, y - h - 26, x + 11, y - h - 23, x - 1, y - h - 19], tribe === 'pirates' ? '#15151a' : color);
    if (tribe === 'pirates') ellipse(ctx, x + 3.5, y - h - 23, 1.6, 1.6, '#fff');
  }
}

function drawCityLabel(ctx: Ctx, s: GameState, c: City) {
  const T = TRIBES[s.players[c.owner].tribe];
  const p = tileCenter(c.x, c.y);
  const y = p.y + 13;
  const nameFont = `600 13px ${FONT}`;
  ctx.font = nameFont;
  const nw = ctx.measureText(c.name).width;
  const inc = String(cityIncome(s, c));
  ctx.font = `400 13px ${FONT}`;
  const iw = ctx.measureText(inc).width;
  const crownW = c.capital ? 20 : 0;
  const w = 8 + crownW + nw + 8 + 12 + iw + 8;
  const x0 = p.x - w / 2;
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = T.color;
  ctx.fillRect(x0, y, w, 19);
  ctx.globalAlpha = 1;
  let cx = x0 + 8;
  if (c.capital) {
    ellipse(ctx, cx + 7, y + 9.5, 8, 8, shade(T.color, -0.35));
    poly(ctx, [cx + 2.5, y + 13, cx + 2.5, y + 7, cx + 5, y + 9.5, cx + 7, y + 5.5, cx + 9, y + 9.5, cx + 11.5, y + 7, cx + 11.5, y + 13], '#ffcf33');
    cx += crownW;
  }
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = nameFont;
  ctx.fillText(c.name, cx, y + 11);
  if (c.capital) ctx.fillRect(cx, y + 16, nw, 1.2);
  cx += nw + 8;
  drawStar(ctx, cx + 5, y + 9.5, 6);
  ctx.font = `400 13px ${FONT}`;
  ctx.fillStyle = '#fff';
  ctx.fillText(inc, cx + 12, y + 11);
  ctx.textBaseline = 'alphabetic';

  // Population capsule: one segment per population needed for the next level.
  const segs = c.level + 1;
  const bw = Math.max(36, segs * 10);
  const bx = p.x - bw / 2, by = y + 22;
  ctx.fillStyle = '#f4f4f4';
  roundRect(ctx, bx, by, bw, 8, 4);
  ctx.fill();
  for (let i = 0; i < segs; i++) {
    const sx = bx + (bw / segs) * i;
    if (i > 0) {
      ctx.fillStyle = '#b9b9b9';
      ctx.fillRect(sx - 0.5, by + 1, 1, 6);
    }
    if (i < c.pop) ellipse(ctx, sx + bw / segs / 2, by + 4, 2, 2, '#1d1d1d');
  }
  if (c.pendingRewards.length && s.players[c.owner].human) {
    ellipse(ctx, p.x + w / 2 + 8, y + 9.5, 7, 7, '#ffcf33');
    ctx.fillStyle = '#3a2a00';
    ctx.font = `700 11px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('!', p.x + w / 2 + 8, y + 13.5);
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
  if (icon in UNITS) return drawUnitSprite(ctx, icon as UnitKind, tribe, x, y + 12);
  switch (icon) {
    case 'fruit':
    case 'crop':
      return drawResource(ctx, fake({ resource: icon }), x, y + 4, tribe);
    case 'animal':
      return drawCritter(ctx, x - 5, y + 9, tribe, 1.1);
    case 'ore':
      drawMountains(ctx, fake({ terrain: 'mountain', seed: 2 }), x, y + 2, P);
      return drawResource(ctx, fake({ resource: 'ore' }), x, y - 2, tribe);
    case 'mountain':
      return drawMountains(ctx, fake({ terrain: 'mountain', seed: 3 }), x, y + 4, P);
    case 'fish':
    case 'whale':
      ellipse(ctx, x, y + 4, 21, 10, P.shallow);
      return drawResource(ctx, fake({ resource: icon }), x, y - 4, tribe);
    case 'farm':
      return drawFarm(ctx, x, y + 2);
    case 'mine':
    case 'lumber':
    case 'temple':
    case 'market':
      return drawImprovement(ctx, { players: [] } as unknown as GameState, fake({ improvement: icon }), x, y + 2);
    case 'port':
      return drawImprovement(ctx, { players: [] } as unknown as GameState, fake({ improvement: 'port' }), x, y - 5);
    case 'axe':
    case 'forest':
      drawTree(ctx, tribe, x - 7, y + 10, 0.9, P, 1);
      return drawTree(ctx, tribe, x + 6, y + 13, 0.9, P, 2);
    case 'road':
      ctx.strokeStyle = '#c9a36b'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 15, y + 8); ctx.lineTo(x + 15, y - 7); ctx.stroke();
      return;
    case 'ship':
      return drawBoat(ctx, 'ship', tribe, x, y + 13);
    case 'flag':
      ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - 6, y - 14, 2, 27);
      return poly(ctx, [x - 4, y - 14, x + 12, y - 9, x - 4, y - 4], TRIBES[tribe].color);
    case 'heal':
      ctx.fillStyle = '#4caf50'; ctx.fillRect(x - 3, y - 10, 6, 20); ctx.fillRect(x - 10, y - 3, 20, 6);
      return;
    case 'star':
    case 'resources':
      return drawStar(ctx, x, y, 13);
    case 'village':
      return drawVillage(ctx, x, y + 4);
    case 'workshop':
      box(ctx, x, y + 9, 18, 10, '#c79a62');
      roof(ctx, x, y - 1, 20, 9, TRIBES[tribe].roof);
      ellipse(ctx, x + 11, y - 6, 5, 5, '#9aa3ad');
      ellipse(ctx, x + 11, y - 6, 2, 2, '#5b636b');
      return;
    case 'walls':
      for (const ox of [-10, 0, 10]) box(ctx, x + ox, y + 8 + ox / 4, 9, 12, '#a3a3ab');
      return;
    case 'growth':
      drawFruit(ctx, x - 7, y + 6, FRUIT[tribe]);
      drawFruit(ctx, x + 7, y + 8, FRUIT[tribe]);
      return;
    case 'borders':
      fence(ctx, { x: x - 16, y: y + 8 }, { x: x + 16, y: y - 6 }, TRIBES[tribe].color);
      return;
    case 'park':
      drawTree(ctx, 'rome', x - 8, y + 10, 0.8, P, 1);
      drawTree(ctx, 'rome', x + 8, y + 12, 0.8, P, 1);
      return ellipse(ctx, x, y + 14, 6, 2.5, '#6fd3f0');
    case 'explorer':
      return drawUnitSprite(ctx, 'explorer', tribe, x, y + 12);
  }
}

/** City preview for panels and modals. */
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
  if (isWaterTile(t)) y += WATER_DROP - 1;
  const tribe = s.players[u.owner].tribe;
  const spent = u.owner === viewer && s.current === viewer && u.moved && u.attacked;
  ctx.globalAlpha = spent ? 0.6 : 1;
  ctx.save();
  ctx.translate(x, y + 5);
  ctx.scale(UNIT_SCALE, UNIT_SCALE);
  drawUnitSprite(ctx, u.kind, tribe, 0, 0);
  ctx.restore();
  ctx.globalAlpha = 1;
  drawHpBadge(ctx, s, u, x, y);
}

const SKIN: Record<TribeId, string> = { egypt: '#c68a52', aztec: '#b87445', polynesia: '#a8683a', rome: '#ecc39a', pirates: '#e7b58c' };
const CLOTHES: Partial<Record<UnitKind, string>> = { legionary: '#b3302a' };

/** Draws a unit standing on (x, y). Exported for UI portraits. */
export function drawUnitSprite(ctx: Ctx, kind: UnitKind, tribe: TribeId, x: number, y: number) {
  const T = TRIBES[tribe];
  const naval = UNITS[kind].naval;
  ellipse(ctx, x, y + 1, naval ? 17 : 9, naval ? 5.5 : 3.6, 'rgba(0,0,0,0.25)');
  if (naval) return drawBoat(ctx, kind, tribe, x, y);
  if (kind === 'catapult') return drawCatapult(ctx, T.color, x, y);

  const k = kind === 'giant' ? 1.35 : 1;
  const mounted = kind === 'rider' || kind === 'knight' || kind === 'chariot' || kind === 'jaguar';
  let by = y;
  if (mounted) {
    if (kind === 'chariot') {
      box(ctx, x - 2, y - 3, 13, 6, '#c9a14a');
      ellipse(ctx, x - 7, y - 2, 4, 5.5, '#6b4a1e');
      ellipse(ctx, x - 7, y - 2, 2, 3, '#c9a14a');
      drawCritter(ctx, x + 8, y + 3, 'rome', 0.8, '#efe6d2');
      by = y - 7;
    } else if (kind === 'jaguar') {
      drawCritter(ctx, x - 1, y + 3, 'rome', 0.9, '#e3a53a');
      for (let i = 0; i < 4; i++) ellipse(ctx, x - 5 + i * 3, y - 4 + (i % 2), 1.1, 1.1, '#3a2a10');
      by = y - 8;
    } else {
      drawCritter(ctx, x - 1, y + 3, 'rome', 0.9, kind === 'knight' ? '#f0f0f0' : '#8a5a33');
      by = y - 8;
    }
  }
  const clothes = CLOTHES[kind] ?? T.color;
  if (!mounted) {
    ctx.fillStyle = shade(T.colorDark, 0.15);
    ctx.fillRect(x - 3.4 * k, by - 4 * k, 2.8 * k, 4.5 * k);
    ctx.fillRect(x + 0.6 * k, by - 3 * k, 2.8 * k, 4.5 * k);
  }
  const bodyY = by - (mounted ? 0 : 3.5 * k);
  box(ctx, x, bodyY, 11 * k, 8.5 * k, clothes);
  if (tribe === 'polynesia') {
    ctx.fillStyle = '#2a1a10';
    for (let i = 0; i < 3; i++) ctx.fillRect(x + (1 + i * 1.6) * k, bodyY - 7 * k + i * 0.8 * k, 0.9 * k, 5 * k);
  }
  // Big blocky head with the face on the right-hand (viewer-facing) side.
  const hy = bodyY - 8.5 * k;
  const hw = 11 * k, hh = 10 * k;
  box(ctx, x, hy, hw, hh, SKIN[tribe]);
  ctx.fillStyle = '#141414';
  for (const f of [0.3, 0.72]) {
    const ex = x + f * (hw / 2);
    const ey = hy + (hw / 4) * (1 - f) - hh * 0.55;
    ctx.fillRect(ex - 0.8 * k, ey - 1.4 * k, 1.8 * k, 2.6 * k);
  }
  drawHeadgear(ctx, tribe, kind, x, hy - hh, k);
  drawWeapon(ctx, kind, tribe, x, bodyY, k);
}

/** Headgear drawn around the top-face centre (x, top) of a head of footprint 11k. */
function drawHeadgear(ctx: Ctx, tribe: TribeId, kind: UnitKind, x: number, top: number, k: number) {
  switch (tribe) {
    case 'egypt': {
      // striped royal headcloth
      box(ctx, x, top + 4.5 * k, 12.5 * k, 5.5 * k, '#f0c43a', '#f6d86a');
      ctx.fillStyle = '#2b5fb8';
      for (let i = 0; i < 3; i++) {
        const f = 0.2 + i * 0.3;
        ctx.fillRect(x + f * 6.25 * k - 0.6 * k, top + 4.5 * k + 3.1 * k * (1 - f) - 5 * k, 1.3 * k, 5 * k);
        ctx.fillRect(x - f * 6.25 * k - 0.6 * k, top + 4.5 * k + 3.1 * k * (1 - f) - 5 * k, 1.3 * k, 5 * k);
      }
      ellipse(ctx, x, top - 2 * k, 1.8 * k, 1.8 * k, '#2b5fb8');
      break;
    }
    case 'aztec': {
      const cols = ['#1faa6b', '#f0c43a', '#d6453b', '#3a8ee0', '#1faa6b', '#f0c43a', '#d6453b'];
      cols.forEach((c, i) => {
        const a = -Math.PI / 2 + (i - 3) * 0.32;
        poly(ctx, [x - 1.4 * k, top + 1 * k, x + 1.4 * k, top + 1 * k, x + Math.cos(a) * 13 * k, top + Math.sin(a) * 12 * k], c);
      });
      box(ctx, x, top + 3 * k, 11.8 * k, 2.6 * k, '#f0c43a');
      break;
    }
    case 'polynesia': {
      box(ctx, x, top + 2 * k, 11.6 * k, 3 * k, '#2a1a10');
      ellipse(ctx, x - 1 * k, top - 2.5 * k, 3.5 * k, 2.6 * k, '#2a1a10');
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ellipse(ctx, x + 5.5 * k + Math.cos(a) * 1.8 * k, top + 1 * k + Math.sin(a) * 1.8 * k, 1.4 * k, 1.4 * k, '#ffffff');
      }
      ellipse(ctx, x + 5.5 * k, top + 1 * k, 1 * k, 1 * k, '#ffd54a');
      break;
    }
    case 'rome': {
      box(ctx, x, top + 3.5 * k, 12.2 * k, 4.5 * k, '#b9bfc7');
      const plume = kind === 'legionary' || kind === 'swordsman' || kind === 'knight' ? '#d82a2a' : '#c9352c';
      poly(ctx, [x - 5 * k, top - 0.5 * k, x - 3 * k, top - 5 * k, x + 3 * k, top - 5 * k, x + 5 * k, top - 0.5 * k, x, top + 1 * k], plume);
      break;
    }
    case 'pirates': {
      poly(ctx, [x - 8 * k, top + 2 * k, x, top - 3.5 * k, x + 8 * k, top + 2 * k, x, top + 5.5 * k], '#18181c');
      poly(ctx, [x - 3.5 * k, top + 0.5 * k, x, top - 8 * k, x + 3.5 * k, top + 0.5 * k], '#26262b');
      ellipse(ctx, x, top - 2 * k, 1.4 * k, 1.2 * k, '#ffffff');
      break;
    }
  }
}

function drawWeapon(ctx: Ctx, kind: UnitKind, tribe: TribeId, x: number, bodyY: number, k: number) {
  const hx = x + 6.5 * k, hy = bodyY - 4.5 * k;
  ctx.lineCap = 'round';
  switch (kind) {
    case 'warrior':
    case 'legionary':
    case 'giant':
      ctx.strokeStyle = '#6b4a2b';
      ctx.lineWidth = 2.2 * k;
      ctx.beginPath();
      ctx.moveTo(hx, hy + 3 * k);
      ctx.lineTo(hx + 2 * k, hy - 10 * k);
      ctx.stroke();
      if (tribe === 'aztec') {
        ctx.fillStyle = '#1a1a1a';
        for (let i = 0; i < 3; i++) ctx.fillRect(hx + 2.2 * k, hy - (8 - i * 2.6) * k, 1.8 * k, 1.5 * k);
      }
      if (kind === 'legionary') box(ctx, x - 6.5 * k, bodyY + 1.5 * k, 4.5 * k, 11 * k, '#c9352c', '#f0c43a');
      break;
    case 'archer':
    case 'buccaneer':
      if (kind === 'buccaneer') {
        ctx.strokeStyle = '#3a2a1a';
        ctx.lineWidth = 2.2 * k;
        ctx.beginPath();
        ctx.moveTo(hx - 3 * k, hy);
        ctx.lineTo(hx + 8 * k, hy - 4.5 * k);
        ctx.stroke();
        ellipse(ctx, hx + 8 * k, hy - 4.5 * k, 1.3 * k, 1.3 * k, '#9aa3ad');
      } else {
        ctx.strokeStyle = '#8a5a2b';
        ctx.lineWidth = 1.8 * k;
        ctx.beginPath();
        ctx.arc(hx, hy - 2 * k, 8 * k, -1.1, 1.1);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(hx + Math.cos(-1.1) * 8 * k, hy - 2 * k + Math.sin(-1.1) * 8 * k);
        ctx.lineTo(hx + Math.cos(1.1) * 8 * k, hy - 2 * k + Math.sin(1.1) * 8 * k);
        ctx.stroke();
      }
      break;
    case 'defender':
      box(ctx, x + 5.5 * k, bodyY + 2.5 * k, 6 * k, 12 * k, '#8d98a5', TRIBES[tribe].color);
      break;
    case 'swordsman':
    case 'knight':
      ctx.strokeStyle = '#dfe5ec';
      ctx.lineWidth = 2.2 * k;
      ctx.beginPath();
      ctx.moveTo(hx, hy + 2 * k);
      ctx.lineTo(hx + 4 * k, hy - 12 * k);
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
      ctx.lineWidth = 1.6 * k;
      ctx.beginPath();
      ctx.moveTo(hx - 2 * k, hy + 4 * k);
      ctx.lineTo(hx + 6 * k, hy - 11 * k);
      ctx.stroke();
      poly(ctx, [hx + 6.5 * k, hy - 14 * k, hx + 4.8 * k, hy - 10 * k, hx + 8 * k, hy - 10 * k], '#dfe5ec');
      break;
  }
}

function drawCatapult(ctx: Ctx, color: string, x: number, y: number) {
  box(ctx, x, y - 1, 17, 4, '#8a5a2b');
  ellipse(ctx, x - 6, y, 3.2, 3.2, '#5a3b1e');
  ellipse(ctx, x + 6, y + 2, 3.2, 3.2, '#5a3b1e');
  ctx.strokeStyle = '#6b4a2b';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(x - 2, y - 5);
  ctx.lineTo(x + 8, y - 21);
  ctx.stroke();
  ellipse(ctx, x + 8, y - 22, 3.8, 2.7, '#777');
  poly(ctx, [x - 7, y - 5, x - 3, y - 14, x + 1, y - 5], color);
}

function drawBoat(ctx: Ctx, kind: UnitKind, tribe: TribeId, x: number, y: number) {
  const T = TRIBES[tribe];
  const big = kind === 'warship' ? 1.3 : kind === 'ship' ? 1.12 : 1;
  const hull = tribe === 'pirates' ? '#3b2a1e' : '#8a5a2b';
  if (kind === 'waka') {
    for (const oy of [-3, 4]) {
      poly(ctx, [x - 17, y + oy - 3, x + 17, y + oy - 3, x + 13, y + oy + 1, x - 13, y + oy + 1], '#7a4a22');
      poly(ctx, [x - 17, y + oy - 3, x + 17, y + oy - 3, x + 15, y + oy - 5, x - 15, y + oy - 5], '#a86c38');
    }
    poly(ctx, [x, y - 32, x - 11, y - 4, x + 6, y - 6], T.color);
    return;
  }
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

function drawHpBadge(ctx: Ctx, s: GameState, u: Unit, x: number, y: number) {
  const tribe = TRIBES[s.players[u.owner].tribe];
  const bx = x - 19, by = y - 36;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = tribe.color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(bx - 7, by - 7);
  ctx.lineTo(bx + 7, by - 7);
  ctx.lineTo(bx + 7, by + 3);
  ctx.lineTo(bx, by + 8);
  ctx.lineTo(bx - 7, by + 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const hp = Math.ceil(u.hp);
  ctx.fillStyle = hp <= maxHp(u) * 0.35 ? '#d62828' : '#1d1d1d';
  ctx.font = `700 ${hp >= 10 ? 9 : 10}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(String(hp), bx, by + 2.5);
  if (u.veteran) drawStar(ctx, bx, by - 11, 4.5);
}

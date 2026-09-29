// World rendering in a flat, low-poly isometric style. The terrain, scenery and cloud cover are
// drawn into a cached layer that is only rebuilt when the game state or camera changes; units,
// effects and labels are drawn on top every frame so they can animate cheaply.
import { TRIBES, type BiomePalette } from '../data/tribes';
import { UNITS } from '../data/units';
import { tileAt } from '../game/grid';
import { cityById, tileOwnerPlayer } from '../game/rules';
import type { City, GameState, Tile, TribeId, UnitKind } from '../game/types';
import { Camera, LAND_DEPTH, TH, TW, WATER_DROP, tileCenter, tileTop } from './camera';
import { band, box, drawStar, ellipse, faceQuad, ink, line, mix, poly, polyGrad, rand, roof, shade, softShadow, type Ctx, type Pt } from './prims';
import { drawCritter, drawUnitSprite } from './units';
import { HH, HW, isWaterTile, REDUCED_MOTION, uv, type Overlay } from './common';
import { drawDynamic, drawFish, drawWaterLife, FISH } from './dynamic';
import { isDirectDraw } from './sprites';

const FISH_ICON = FISH;
const T_LIME_C = '#c9d43a'; // Aksumite lime-gold

export { drawUnitSprite } from './units';
export { drawStar } from './prims';

export { FLASH_MS, FLOAT_MS, GHOST_MS, HOP_MS, LUNGE_MS, SAIL_MS, newFx, type Fx, type Overlay } from './common';

const FOG_LIFT = 8;
// Cloud facets: soft white to pale blue-grey, calm enough to fill most of the early screen.
const FOG = ['#ffffff', '#edf0f9', '#dbe2f3', '#c3cde9'];
const FOG_WALL = { right: '#a5b3da', left: '#c6cfea' };

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



// ---------------------------------------------------------------- background

interface SkyStar { x: number; y: number; r: number; a: number; tw: number; ph: number }
let sky: SkyStar[] = [];
const SKY_PATCH = 520; // the star pattern repeats every this many CSS px
const SKY_PARALLAX = 0.06; // stars drift at this fraction of the map's speed, so they read as far away

/**
 * The night sky around the map, drawn every frame in screen space: small round stars, a few
 * of them twinkling, that drift slower than the map. (Baked into the cached map layer they were
 * pinned to its edges and jumped whenever the layer was rebuilt during a pan.)
 */
function drawSky(ctx: Ctx, cam: Camera, vw: number, vh: number, now: number) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, vw, vh);
  if (!sky.length) {
    sky = Array.from({ length: 60 }, (_, i) => ({
      x: rand(i, 1), y: rand(i, 2),
      r: 0.5 + Math.pow(rand(i, 3), 3) * 0.85, // mostly pinpricks, a few brighter
      a: 0.28 + rand(i, 4) * 0.55,
      tw: rand(i, 5) < 0.35 ? 0.25 + rand(i, 6) * 0.5 : 0, // twinkles per second (0 = steady)
      ph: rand(i, 7) * Math.PI * 2,
    }));
  }
  const P = SKY_PATCH;
  const ox = (((cam.x * SKY_PARALLAX) % P) + P) % P, oy = (((cam.y * SKY_PARALLAX) % P) + P) % P;
  ctx.fillStyle = '#fff';
  for (let py = oy - P; py < vh; py += P) {
    for (let px = ox - P; px < vw; px += P) {
      for (const st of sky) {
        const x = px + st.x * P, y = py + st.y * P;
        if (x < -2 || y < -2 || x > vw + 2 || y > vh + 2) continue;
        const twinkle = st.tw && !REDUCED_MOTION ? 0.62 + 0.38 * Math.sin((now / 1000) * st.tw * Math.PI * 2 + st.ph) : 1;
        ctx.globalAlpha = st.a * twinkle;
        ctx.beginPath();
        ctx.arc(x, y, st.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- renderer

/** Keeps each map layer within this many device pixels (iOS caps canvas size and memory). */
const LAYER_PIXEL_BUDGET = 10_000_000;
/** Extra map rendered beyond each screen edge, so short pans only shift the cached layers. */
const LAYER_MARGIN = 0.22;
/** ...but never more than this (CSS px), so tablets and laptops keep full sharpness too. */
const LAYER_MARGIN_MAX = 180;

/**
 * Two cached layers: the ground (terrain, water, borders) and everything standing on it
 * (scenery, cities, cloud cover). Swimming fish are drawn between them, so they stay in the
 * water and never paint over a mountain in front; units and effects go on top every frame.
 */
export class WorldRenderer {
  private ground = document.createElement('canvas');
  private top = document.createElement('canvas');
  private version = -1;
  private cam = { x: 0, y: 0, zoom: 1 };
  private size = { vw: 0, vh: 0, mx: 0, my: 0, dpr: 0 };

  render(ctx: Ctx, s: GameState, viewer: number, cam: Camera, ov: Overlay, vw: number, vh: number, dpr: number, version: number, interacting = false) {
    if (isDirectDraw()) {
      // no hidden layers: paint the whole map straight onto the screen every frame
      drawSky(ctx, cam, vw, vh, ov.now);
      drawStaticGround(ctx, s, viewer, cam, ov, vw, vh);
      drawWaterLife(ctx, s, viewer, cam, ov, vw, vh);
      drawStaticTop(ctx, s, viewer, cam, ov, vw, vh);
      drawDynamic(ctx, s, viewer, cam, ov, vw, vh, dpr);
      return;
    }
    const mx = Math.round(Math.min(LAYER_MARGIN_MAX, vw * LAYER_MARGIN)), my = Math.round(Math.min(LAYER_MARGIN_MAX, vh * LAYER_MARGIN));
    const W = vw + mx * 2, H = vh + my * 2;
    const L = this.cam;
    const scale = cam.zoom / L.zoom;
    const tx = cam.x - (L.x + this.size.mx) * scale;
    const ty = cam.y - (L.y + this.size.my) * scale;
    const lw = (this.size.vw + this.size.mx * 2) * scale, lh = (this.size.vh + this.size.my * 2) * scale;
    const covers = tx <= 0.5 && ty <= 0.5 && tx + lw >= vw - 0.5 && ty + lh >= vh - 0.5;
    const fresh = version === this.version && this.size.vw === vw && this.size.vh === vh && this.size.dpr === dpr;
    const zoomSame = Math.abs(scale - 1) < 1e-6;
    const reuse = fresh && covers && (zoomSame || (interacting && Math.abs(Math.log(scale)) < 0.35));

    let blit: (layer: HTMLCanvasElement) => void;
    let exact = false; // copied 1:1 onto whole device pixels, so no smoothing is wanted
    if (!reuse) {
      const layerDpr = Math.min(dpr, Math.sqrt(LAYER_PIXEL_BUDGET / (W * H)));
      const PW = Math.round(W * layerDpr), PH = Math.round(H * layerDpr);
      const lc = new Camera();
      lc.x = cam.x + mx;
      lc.y = cam.y + my;
      lc.zoom = cam.zoom;
      for (const [layer, draw] of [[this.ground, drawStaticGround], [this.top, drawStaticTop]] as const) {
        if (layer.width !== PW || layer.height !== PH) {
          layer.width = PW;
          layer.height = PH;
        }
        const lctx = layer.getContext('2d')!;
        lctx.setTransform(1, 0, 0, 1, 0, 0);
        lctx.clearRect(0, 0, PW, PH);
        lctx.setTransform(PW / W, 0, 0, PH / H, 0, 0);
        draw(lctx, s, viewer, lc, ov, W, H);
      }
      this.version = version;
      this.cam = { x: cam.x, y: cam.y, zoom: cam.zoom };
      this.size = { vw, vh, mx, my, dpr };
      blit = (layer) => ctx.drawImage(layer, -mx, -my, W, H);
      exact = true;
    } else if (zoomSame) {
      // shift by whole device pixels so the cached layers stay pin-sharp while panning
      const sx = Math.round(tx * dpr) / dpr, sy = Math.round(ty * dpr) / dpr;
      blit = (layer) => ctx.drawImage(layer, sx, sy, W, H);
      exact = true;
    } else {
      blit = (layer) => ctx.drawImage(layer, tx, ty, lw, lh);
    }
    // Only a pinch stretches the cached layers (by 0.7-1.4x): plain bilinear looks the same there and
    // is several times cheaper than 'high' on a full-screen bitmap. Everything else is copied 1:1.
    ctx.imageSmoothingQuality = 'low';
    ctx.imageSmoothingEnabled = !exact; // a 1:1 copy must not be blurred; a pinch stretch still is
    drawSky(ctx, cam, vw, vh, ov.now);
    blit(this.ground);
    ctx.imageSmoothingEnabled = true;
    drawWaterLife(ctx, s, viewer, cam, ov, vw, vh);
    ctx.imageSmoothingEnabled = !exact;
    blit(this.top);
    ctx.imageSmoothingEnabled = true;
    drawDynamic(ctx, s, viewer, cam, ov, vw, vh, dpr);
  }
}

function visibleTiles(s: GameState, cam: Camera, vw: number, vh: number) {
  const w0 = cam.toWorld(-TW * 2, -TH * 6);
  const w1 = cam.toWorld(vw + TW * 2, vh + TH * 4);
  const out: Tile[] = [];
  for (let d = 0; d <= (s.size - 1) * 2; d++)
    for (let x = 0; x < s.size; x++) {
      const y = d - x;
      if (y < 0 || y >= s.size) continue;
      const c = tileCenter(x, y);
      if (c.x > w0.x && c.x < w1.x && c.y > w0.y && c.y < w1.y) out.push(s.tiles[y * s.size + x]);
    }
  return out;
}

function drawStaticGround(ctx: Ctx, s: GameState, viewer: number, cam: Camera, _ov: Overlay, vw: number, vh: number) {
  ctx.save();
  ctx.translate(cam.x, cam.y);
  ctx.scale(cam.zoom, cam.zoom);
  const explored = (x: number, y: number) => viewer < 0 || s.players[viewer].explored[y * s.size + x];
  const shown = visibleTiles(s, cam, vw, vh);
  for (const t of shown) if (explored(t.x, t.y)) drawGround(ctx, s, t, explored);
  for (const t of shown) if (explored(t.x, t.y)) drawBorders(ctx, s, t, explored);
  ctx.restore();
}

function drawStaticTop(ctx: Ctx, s: GameState, viewer: number, cam: Camera, ov: Overlay, vw: number, vh: number) {
  ctx.save();
  ctx.translate(cam.x, cam.y);
  ctx.scale(cam.zoom, cam.zoom);
  const explored = (x: number, y: number) => viewer < 0 || s.players[viewer].explored[y * s.size + x];
  for (const t of visibleTiles(s, cam, vw, vh)) {
    if (!explored(t.x, t.y)) drawFog(ctx, s, t, explored);
    else drawScenery(ctx, s, t, ov.glow.has(t.y * s.size + t.x));
  }
  ctx.restore();
}

// ---------------------------------------------------------------- ground

function drawGround(ctx: Ctx, s: GameState, t: Tile, explored: (x: number, y: number) => boolean) {
  const P = TRIBES[t.biome].palette;
  const { x, y } = tileTop(t.x, t.y);
  const water = isWaterTile(t);
  const top = y + (water ? WATER_DROP : 0);
  if (water) {
    const col = t.terrain === 'shallow' ? P.shallow : P.ocean;
    sidesGrad(ctx, x, top, LAND_DEPTH - WATER_DROP + 2, shade(col, -0.2), shade(col, -0.35));
    diamond(ctx, x, top, col);
    if (t.terrain === 'ocean' && rand(t.seed, 1) < 0.5) {
      const c = uv(x, top + HH, rand(t.seed, 2) * 0.5 - 0.25, rand(t.seed, 3) * 0.5 - 0.25);
      poly(ctx, [c.x - 7, c.y, c.x, c.y - 1.6, c.x + 7, c.y, c.x, c.y + 1.6], shade(col, 0.14));
    }
    // surf where the water meets land behind it
    const T = { x, y: top }, R = { x: x + HW, y: top + HH }, L = { x: x - HW, y: top + HH };
    for (const [dx, dy, a, b] of [[-1, 0, T, L], [0, -1, T, R]] as const) {
      const n = tileAt(s, t.x + dx, t.y + dy);
      if (!n || isWaterTile(n) || !explored(n.x, n.y)) continue; // no surf giving away land under the clouds
      surf(ctx, a, b, x, top + HH, t.seed + dx * 7 + dy * 13);
    }
  } else {
    sidesGrad(ctx, x, y, LAND_DEPTH, P.fieldSide, shade(P.fieldSide, -0.25));
    diamond(ctx, x, y, P.field);
    facets(ctx, x, y, t.seed);
    if (t.improvement === 'farm') drawFarm(ctx, x, y + HH);
    if (t.road || t.cityId !== null) drawRoads(ctx, s, t);
  }
  // the cloud layer behind this tile casts a soft shadow onto it
  const T = { x, y: top }, R = { x: x + HW, y: top + HH }, L = { x: x - HW, y: top + HH }, C = { x, y: top + HH };
  for (const [dx, dy, a, b] of [[-1, 0, T, L], [0, -1, T, R]] as const) {
    const n = tileAt(s, t.x + dx, t.y + dy);
    if (!n || explored(n.x, n.y)) continue;
    const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const k = 0.55;
    const g = ctx.createLinearGradient(m.x, m.y, m.x + (C.x - m.x) * k * 2, m.y + (C.y - m.y) * k * 2);
    g.addColorStop(0, 'rgba(40,52,110,0.38)');
    g.addColorStop(1, 'rgba(40,52,110,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(b.x + (C.x - b.x) * k, b.y + (C.y - b.y) * k);
    ctx.lineTo(a.x + (C.x - a.x) * k, a.y + (C.y - a.y) * k);
    ctx.closePath();
    ctx.fill();
  }
}

/** Faint light and dark triangles across a land tile, so the ground reads as faceted low-poly rock and turf. */
function facets(ctx: Ctx, x: number, y: number, seed: number) {
  const corners = [{ x, y }, { x: x + HW, y: y + HH }, { x, y: y + TH }, { x: x - HW, y: y + HH }];
  for (let i = 0; i < 3; i++) {
    const k = Math.floor(rand(seed, 200 + i) * 4);
    const a = corners[k], b = corners[(k + 1) % 4];
    const p = uv(x, y + HH, (rand(seed, 210 + i) - 0.5) * 0.7, (rand(seed, 220 + i) - 0.5) * 0.7);
    poly(ctx, [a.x, a.y, b.x, b.y, p.x, p.y], i % 2 ? 'rgba(0,0,0,0.055)' : 'rgba(255,255,255,0.075)');
  }
}

/** Tile sides that darken toward the base. */
function sidesGrad(ctx: Ctx, x: number, y: number, depth: number, left: string, right: string) {
  polyGrad(ctx, [x - HW, y + HH, x, y + TH, x, y + TH + depth, x - HW, y + HH + depth], shade(left, 0.08), shade(left, -0.25), y + HH, y + TH + depth);
  polyGrad(ctx, [x + HW, y + HH, x, y + TH, x, y + TH + depth, x + HW, y + HH + depth], shade(right, 0.05), shade(right, -0.25), y + HH, y + TH + depth);
}

/** A band of white surf along a shoreline edge, slightly broken up so it looks natural. */
function surf(ctx: Ctx, a: Pt, b: Pt, cx: number, cy: number, seed: number) {
  const inward = (p: Pt, k: number) => ({ x: p.x + (cx - p.x) * k, y: p.y + (cy - p.y) * k });
  ctx.lineCap = 'round';
  for (const [k, alpha, width] of [[0.05, 0.85, 1.8], [0.2, 0.35, 1.2]] as const) {
    const p = inward(a, k), q = inward(b, k);
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = width;
    const n = 4;
    for (let i = 0; i < n; i++) {
      const f0 = (i + 0.08 + rand(seed, i + k * 10) * 0.12) / n;
      const f1 = (i + 0.72 + rand(seed, i + 20 + k * 10) * 0.2) / n;
      ctx.beginPath();
      ctx.moveTo(p.x + (q.x - p.x) * f0, p.y + (q.y - p.y) * f0);
      ctx.lineTo(p.x + (q.x - p.x) * f1, p.y + (q.y - p.y) * f1);
      ctx.stroke();
    }
  }
}

/** A farm's tilled plot: a sunken bed of soil with furrows (its wheat stands in the scenery layer). */
function drawFarm(ctx: Ctx, cx: number, cy: number) {
  const k = 0.43;
  const a = uv(cx, cy, -k, -k), b = uv(cx, cy, k, -k), c = uv(cx, cy, k, k), d = uv(cx, cy, -k, k);
  poly(ctx, [a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y], '#c99a4b');
  // a darker rim along the back edges reads as the bed sitting a little below the field
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#9a6f33';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(d.x, d.y);
  ctx.lineTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.strokeStyle = '#e4c27a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.stroke();
  // furrows between the rows of wheat
  ctx.strokeStyle = '#a97a3a';
  ctx.lineWidth = 1.1;
  for (const v of FARM_ROWS.slice(0, -1).map((r, i) => (r + FARM_ROWS[i + 1]) / 2)) {
    const p = uv(cx, cy, -k + 0.04, v), q = uv(cx, cy, k - 0.04, v);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.stroke();
  }
}

const FARM_ROWS = [-0.3, -0.1, 0.1, 0.3];

/** Neat rows of ripe wheat standing on a farm plot, drawn back to front. */
function drawFarmCrops(ctx: Ctx, cx: number, cy: number, seed: number) {
  const tufts: { x: number; y: number; i: number }[] = [];
  FARM_ROWS.forEach((v, r) => {
    for (let j = 0; j < 5; j++) {
      const u = -0.32 + j * 0.16 + (rand(seed, 300 + r * 5 + j) - 0.5) * 0.03;
      tufts.push({ ...uv(cx, cy, u, v), i: r * 5 + j });
    }
  });
  tufts.sort((p, q) => p.y - q.y);
  ctx.lineCap = 'round';
  for (const p of tufts) {
    for (let j = -1; j <= 1; j++) {
      const h = 6.5 + rand(seed, 400 + p.i * 3 + j) * 2.5;
      const lean = j * 0.9 + (rand(seed, 500 + p.i * 3 + j) - 0.5) * 0.8;
      const x0 = p.x + j * 1.4, top = p.y - h;
      ctx.strokeStyle = '#b08a2c';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(x0, p.y);
      ctx.lineTo(x0 + lean, top);
      ctx.stroke();
      ellipse(ctx, x0 + lean, top - 1.4, 1.35, 2.7, j === 0 ? '#f6d35e' : '#eec14a');
    }
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
  // (in front of explored water the wall reaches down to the lower water line, leaving no gap)
  if (!r || explored(r.x, r.y)) {
    const d = FOG_LIFT + (r ? (isWaterTile(r) ? WATER_DROP : 0) : LAND_DEPTH);
    poly(ctx, [x + HW, y + HH, x, y + TH, x, y + TH + d, x + HW, y + HH + d], FOG_WALL.right);
  }
  if (!l || explored(l.x, l.y)) {
    const d = FOG_LIFT + (l ? (isWaterTile(l) ? WATER_DROP : 0) : LAND_DEPTH);
    poly(ctx, [x - HW, y + HH, x, y + TH, x, y + TH + d, x - HW, y + HH + d], FOG_WALL.left);
  }
  // Faceted top: each tile is split into eight triangles. The eight triangles that meet at a
  // tile corner (from four neighbouring tiles) are shaded as one pinwheel around that corner.
  const T = { x, y }, R = { x: x + HW, y: y + HH }, B = { x, y: y + TH }, L = { x: x - HW, y: y + HH };
  const C = { x, y: y + HH };
  const m = (a: Pt, b: Pt) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const tr = m(T, R), rb = m(R, B), bl = m(B, L), lt = m(L, T);
  const tris: [Pt[], number, number][] = [
    [[T, tr, C], t.x, t.y], [[T, C, lt], t.x, t.y],
    [[R, C, tr], t.x + 1, t.y], [[R, rb, C], t.x + 1, t.y],
    [[B, C, rb], t.x + 1, t.y + 1], [[B, bl, C], t.x + 1, t.y + 1],
    [[L, C, bl], t.x, t.y + 1], [[L, lt, C], t.x, t.y + 1],
  ];
  for (const [tri, cx, cy] of tris) {
    const corner = tri[0];
    const gx = (tri[1].x + tri[2].x) / 2 - corner.x, gyy = (tri[1].y + tri[2].y) / 2 - corner.y;
    const sector = Math.floor(((Math.atan2(gyy * 2, gx) + Math.PI) / (Math.PI * 2)) * 8) & 7;
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
  const edges: [number, number, Pt, Pt][] = [
    [-1, 0, T, L], // upper-left edge, shared with (x-1, y)
    [0, -1, T, R], // upper-right edge, shared with (x, y-1)
    [1, 0, R, B], // lower-right edge, shared with (x+1, y)
    [0, 1, L, B], // lower-left edge, shared with (x, y+1)
  ];
  for (const [dx, dy, a, b] of edges) {
    const n = tileAt(s, t.x + dx, t.y + dy);
    if (n && tileOwnerPlayer(s, n) === owner && explored(n.x, n.y)) continue;
    const inset = (p: Pt) => ({ x: p.x + (c.x - p.x) * 0.1, y: p.y + (c.y - p.y) * 0.1 });
    fence(ctx, inset(a), inset(b), color);
  }
}

/** A row of raised, block-like fence posts along a territory edge. */
function fence(ctx: Ctx, a: Pt, b: Pt, color: string) {
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
  // once a farm or mine is built it replaces the wild crop or ore it was built on
  if (t.resource && !t.improvement && t.resource !== 'fish' && t.resource !== 'whale') drawResource(ctx, t, c.x, c.y, t.biome);
  if (t.improvement === 'farm') drawFarmCrops(ctx, c.x, c.y, t.seed);
  else if (t.improvement) drawImprovement(ctx, s, t, c.x, c.y);
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

// ---------------------------------------------------------------- Inca trees and stonework

/** The mountain trees of the Andes: gnarled queñua (polylepis), a tall eucalyptus, and a columnar San Pedro cactus. */
function incaTree(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  const v = variant % 3;
  if (v === 0) {
    // queñua: a twisted trunk of peeling red paper-bark under low, dense clumps of small dark leaves
    const bark = '#a3532c';
    ctx.lineCap = 'round';
    ctx.strokeStyle = bark;
    ctx.lineWidth = 3.2 * k;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x - 3.4 * k, y - 6 * k, x + 1 * k, y - 11 * k);
    ctx.stroke();
    ctx.strokeStyle = shade(bark, 0.35);
    ctx.lineWidth = 0.9 * k;
    ctx.beginPath();
    ctx.moveTo(x - 0.8 * k, y);
    ctx.quadraticCurveTo(x - 4.2 * k, y - 6 * k, x + 0.2 * k, y - 11 * k);
    ctx.stroke();
    for (const [dx, dy] of [[-2.6, -3], [-2.2, -7], [0.4, -9.4], [-0.6, -5]] as const) poly(ctx, [x + dx * k, y + dy * k, x + (dx + 1.6) * k, y + (dy - 0.6) * k, x + (dx + 0.6) * k, y + (dy + 1.6) * k], '#e0a470'); // peeling flakes
    for (const [tx, ty] of [[-7, -15], [8, -14], [1, -18]] as const) line(ctx, x + 1 * k, y - 10 * k, x + tx * k, y + ty * k, bark, 1.5 * k);
    const clumps: [number, number, number, number][] = [[-7, -15, 5.4, 3.4], [8, -14, 5.2, 3.2], [1, -19, 5.8, 3.6], [-2, -13.6, 5, 3.2], [4.4, -11.6, 4.4, 2.8]];
    for (const [cx, cy, rx, ry] of clumps) {
      ellipse(ctx, x + cx * k, y + cy * k + 1.2 * k, rx * k, ry * k, shade(P.forest, -0.28));
      ellipse(ctx, x + cx * k - 0.4 * k, y + cy * k, rx * 0.94 * k, ry * 0.9 * k, shade(P.forest, -0.06));
      ellipse(ctx, x + cx * k - rx * 0.22 * k, y + cy * k - ry * 0.3 * k, rx * 0.56 * k, ry * 0.5 * k, shade(P.forest, 0.14));
    }
    for (let i = 0; i < 5; i++) ellipse(ctx, x + (rand(variant + 9, i) - 0.5) * 16 * k, y - (12 + rand(variant + 4, i) * 8) * k, 0.55 * k, 0.5 * k, shade(P.forest, 0.4));
  } else if (v === 1) {
    // eucalyptus, brought to the highlands: a tall pale trunk streaked with bark and a thin crown of drooping leaves
    line(ctx, x, y, x + 0.8 * k, y - 25 * k, '#cdb992', 2.4 * k);
    line(ctx, x + 0.5 * k, y, x + 1.4 * k, y - 25 * k, '#a08a64', 0.9 * k);
    for (const [ty, dx] of [[-6, -0.8], [-11, 0.6], [-16, -0.6], [-20, 0.4]] as const) line(ctx, x + dx * k, y + ty * k, x + (dx + 0.9) * k, y + (ty - 2.4) * k, '#8a7654', 0.6 * k); // bark strips
    const tips: [number, number][] = [[-7, -22], [7, -24], [0, -29], [-3, -17], [6, -18]];
    for (const [tx, ty] of tips) {
      line(ctx, x + 0.8 * k, y - (Math.abs(ty) > 24 ? 21 : 15) * k, x + tx * k, y + ty * k, '#a08a64', 1 * k);
      for (let i = 0; i < 5; i++) {
        const dx = (i - 2) * 2.1 * k;
        poly(ctx, [x + tx * k, y + ty * k, x + tx * k + dx - 0.9 * k, y + ty * k + 7.4 * k, x + tx * k + dx + 0.6 * k, y + ty * k + 7 * k], i % 2 ? mix(P.forest, '#6fa8a0', 0.45) : mix(P.forest, '#8fbfae', 0.35));
      }
    }
  } else {
    // San Pedro cactus: a ribbed green column with two upturned arms, white spines and a flower
    const g = '#5f9a4a';
    ctx.lineCap = 'round';
    for (const [dx, h, w] of [[0, 20, 5]] as const) {
      line(ctx, x + dx * k, y - 1 * k, x + dx * k, y - h * k, shade(g, -0.22), w * k);
      line(ctx, x + (dx - 0.9) * k, y - 1 * k, x + (dx - 0.9) * k, y - (h - 0.4) * k, g, (w - 1.9) * k);
      line(ctx, x + (dx - 1.4) * k, y - 2 * k, x + (dx - 1.4) * k, y - (h - 1) * k, shade(g, 0.3), 0.8 * k);
    }
    for (const s of [-1, 1]) { // arms
      const ay = y - (9 + (s > 0 ? 2.4 : 0)) * k;
      ctx.strokeStyle = shade(g, s > 0 ? -0.22 : -0.1);
      ctx.lineWidth = 3.2 * k;
      ctx.beginPath();
      ctx.moveTo(x + s * 1.5 * k, ay);
      ctx.quadraticCurveTo(x + s * 7 * k, ay + 1 * k, x + s * 7 * k, ay - 6.4 * k);
      ctx.stroke();
      line(ctx, x + s * 6.6 * k, ay - 1 * k, x + s * 6.6 * k, ay - 6 * k, shade(g, s > 0 ? 0.04 : 0.24), 1 * k);
    }
    for (const [dx, dy] of [[-1.4, -4], [0.8, -7], [-0.6, -11], [1.2, -14], [-1.2, -17], [-6.4, -13], [6.4, -14], [6.8, -18], [-6.8, -16]] as const) ellipse(ctx, x + dx * k, y + dy * k, 0.4 * k, 0.4 * k, '#f4efe0'); // spines
    ellipse(ctx, x, y - 20.4 * k, 1.9 * k, 1.5 * k, '#f8f2e8'); // a night-blooming flower
    ellipse(ctx, x, y - 20.6 * k, 0.8 * k, 0.6 * k, '#f2c53a');
  }
}

/** A fitted-stone Inca wall: a trapezoid block (its sides lean in), coursed masonry, and optional trapezoid door and niches. */
function incaWall(ctx: Ctx, x: number, y: number, w: number, h: number, taper: number, color: string, lid: string, door = false, niches = 0) {
  const hw = w / 2, hh = w / 4, th = 1 - taper, hwt = hw * th, hht = hh * th;
  const Lb = { x: x - hw, y }, Fb = { x, y: y + hh }, Rb = { x: x + hw, y };
  const Lt = { x: x - hwt, y: y - h }, Ft = { x, y: y - h + hht }, Rt = { x: x + hwt, y: y - h }, Bt = { x, y: y - h - hht };
  poly(ctx, [Lb.x, Lb.y, Fb.x, Fb.y, Ft.x, Ft.y, Lt.x, Lt.y], shade(color, 0.08));
  poly(ctx, [Fb.x, Fb.y, Rb.x, Rb.y, Rt.x, Rt.y, Ft.x, Ft.y], shade(color, -0.18));
  poly(ctx, [Lt.x, Lt.y, Ft.x, Ft.y, Rt.x, Rt.y, Bt.x, Bt.y], lid);
  const lerp = (a: { x: number; y: number }, b: { x: number; y: number }, t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const rows = Math.max(2, Math.round(h / 2.4));
  for (const [face, A0, A1, B0, B1, d] of [['L', Lb, Fb, Lt, Ft, -0.32], ['R', Fb, Rb, Ft, Rt, -0.42]] as const) {
    const pt = (u: number, v: number) => lerp(lerp(A0, A1, u), lerp(B0, B1, u), v);
    for (let r = 1; r < rows; r++) { // courses
      const a = pt(0, r / rows), b = pt(1, r / rows);
      line(ctx, a.x, a.y, b.x, b.y, shade(color, d), 0.45);
    }
    for (let r = 0; r < rows; r++) for (const s of [0.28, 0.6, 0.86]) { // staggered joints
      const u = Math.min(0.95, s + (r % 2 ? 0.12 : 0) - (r % 3 === 0 ? 0.05 : 0));
      const a = pt(u, r / rows), b = pt(u, (r + 1) / rows);
      line(ctx, a.x, a.y, b.x, b.y, shade(color, d), 0.35);
    }
    if (face === 'R' && door) { // the trapezoid doorway, a narrow lintel above
      const p = [pt(0.34, 0), pt(0.7, 0), pt(0.64, 0.66), pt(0.4, 0.66)];
      poly(ctx, p.flatMap((q) => [q.x, q.y]), '#241610');
      const l0 = pt(0.3, 0.7), l1 = pt(0.74, 0.7), l2 = pt(0.74, 0.8), l3 = pt(0.3, 0.8);
      poly(ctx, [l0.x, l0.y, l1.x, l1.y, l2.x, l2.y, l3.x, l3.y], shade(color, 0.22));
    }
    if (face === 'L' && niches > 0) for (let n = 0; n < niches; n++) { // trapezoid niches
      const u0 = 0.2 + n * 0.32, p = [pt(u0, 0.42), pt(u0 + 0.2, 0.42), pt(u0 + 0.17, 0.74), pt(u0 + 0.03, 0.74)];
      poly(ctx, p.flatMap((q) => [q.x, q.y]), shade(color, -0.55));
    }
  }
  return { Lt, Ft, Rt, Bt };
}

/** A thatched roof of golden ichu grass: bundled strands down each slope, a lashed ridge and a ragged eave. */
function incaThatch(ctx: Ctx, x: number, y: number, w: number, rh: number, roofC: string) {
  roof(ctx, x, y, w, rh, roofC);
  const hw = w / 2, hh = w / 4, ax = x, ay = y - rh;
  const mixp = (px: number, py: number, f: number) => ({ x: px + (ax - px) * f, y: py + (ay - py) * f });
  for (let i = 1; i < 6; i++) { // bundled strands down each slope
    const t = i / 6;
    line(ctx, ax, ay, x - hw + hw * t, y + hh * t, shade(roofC, -0.22), 0.5);
    line(ctx, ax, ay, x + hw * t, y + hh * (1 - t), shade(roofC, -0.4), 0.5);
  }
  for (const f of [0.34, 0.66]) { // horizontal thatch tiers
    const a = mixp(x - hw, y, f), b = mixp(x, y + hh, f), c = mixp(x + hw, y, f);
    line(ctx, a.x, a.y, b.x, b.y, shade(roofC, -0.3), 0.6);
    line(ctx, b.x, b.y, c.x, c.y, shade(roofC, -0.45), 0.6);
  }
  line(ctx, x - hw, y, x, y + hh, shade(roofC, -0.5), 0.9); // eave shadow
  line(ctx, x, y + hh, x + hw, y, shade(roofC, -0.65), 0.9);
  for (let i = 0; i < 7; i++) { // ragged fringe along the eave
    const t = i / 6;
    line(ctx, x - hw + hw * t, y + hh * t, x - hw + hw * t - 0.2, y + hh * t + 1.2, shade(roofC, -0.2), 0.5);
    line(ctx, x + hw * t, y + hh * (1 - t), x + hw * t, y + hh * (1 - t) + 1.2, shade(roofC, -0.35), 0.5);
  }
  line(ctx, ax - 1.6, ay - 1.6, ax + 0.2, ay + 1.8, '#7a5230', 0.8); // crossed ridge poles
  line(ctx, ax + 1.6, ay - 1.6, ax - 0.2, ay + 1.8, '#7a5230', 0.8);
}

function incaBuilding(ctx: Ctx, x: number, y: number, big: boolean, roofC: string, w: number, h: number) {
  const stone = '#b9ad98', stoneWarm = '#c4b298';
  const green = '#8fbf4f', greenD = '#6f9f42';
  if (big) {
    // a stepped terrace of fitted stone with green crop rows, and a thatched hall on top with a golden sun on its ridge
    const t1 = incaWall(ctx, x, y + 2, w + 14, 4.2, 0.05, stone, green);
    for (const f of [0.3, 0.55, 0.8]) line(ctx, t1.Lt.x + (t1.Bt.x - t1.Lt.x) * f, t1.Lt.y + (t1.Bt.y - t1.Lt.y) * f, t1.Ft.x + (t1.Rt.x - t1.Ft.x) * f, t1.Ft.y + (t1.Rt.y - t1.Ft.y) * f, greenD, 0.7);
    const t2 = incaWall(ctx, x, y - 2.2, w + 6, 4.2, 0.07, stoneWarm, mix(green, '#e0c860', 0.35));
    for (const f of [0.3, 0.6]) line(ctx, t2.Lt.x + (t2.Bt.x - t2.Lt.x) * f, t2.Lt.y + (t2.Bt.y - t2.Lt.y) * f, t2.Ft.x + (t2.Rt.x - t2.Ft.x) * f, t2.Ft.y + (t2.Rt.y - t2.Ft.y) * f, '#a88a3a', 0.7);
    const t3 = incaWall(ctx, x, y - 6.4, w - 4, 6.4, 0.16, stone, shade(stone, 0.1), true, 2);
    void t3;
    incaThatch(ctx, x, y - 12.8, w - 1, 8.4, roofC);
    ellipse(ctx, x, y - 22.2, 2, 2, '#f0c43a');
    ellipse(ctx, x, y - 22.2, 1, 1, '#2fb5a8');
  } else {
    incaWall(ctx, x, y, w, h - 1, 0.16, stone, shade(stone, 0.1), true, 1);
    incaThatch(ctx, x, y - h + 1, w + 3.6, 6.2, roofC);
  }
}

// ---------------------------------------------------------------- Aboriginal country: trees and camps

/** Trees of the red country: ghost gum, bloodwood, grass tree (xanthorrhoea) and desert oak. */
function aboriginalTree(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  const v = variant % 4;
  ctx.lineCap = 'round';
  const curve = (x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, w: number, c: string) => {
    ctx.strokeStyle = ink(c);
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx, cy, x1, y1);
    ctx.stroke();
  };
  if (v === 0) {
    // ghost gum: a smooth chalk-white trunk that leans and forks, a pink-orange flush at the base, sparse silver-green boughs
    const wh = P.trunk;
    curve(x, y, x - 1.6 * k, y - 8 * k, x + 0.4 * k, y - 15 * k, 3.4 * k, shade(wh, -0.16));
    curve(x - 0.5 * k, y, x - 2 * k, y - 8 * k, x - 0.2 * k, y - 15 * k, 1.9 * k, wh);
    curve(x - 0.9 * k, y - 1 * k, x - 2.2 * k, y - 8 * k, x - 0.7 * k, y - 14 * k, 0.6 * k, shade(wh, 0.4)); // a lit edge
    ellipse(ctx, x, y - 0.6 * k, 2.6 * k, 1 * k, '#c99a76'); // warm flush where the bark meets the ground
    for (const [dx, dy] of [[-1.6, -5], [-0.8, -9.4], [0.2, -12]] as const) line(ctx, x + dx * k - 0.9 * k, y + dy * k, x + dx * k + 0.5 * k, y + (dy - 0.3) * k, '#8a7a68', 0.5 * k); // dark scars
    curve(x + 0.4 * k, y - 14 * k, x + 4 * k, y - 17 * k, x + 8 * k, y - 22 * k, 1.5 * k, wh);
    curve(x + 0.2 * k, y - 14.6 * k, x - 4.6 * k, y - 18 * k, x - 8.4 * k, y - 21 * k, 1.5 * k, shade(wh, -0.08));
    curve(x + 0.2 * k, y - 15 * k, x + 0.6 * k, y - 20 * k, x - 0.4 * k, y - 26 * k, 1.3 * k, wh);
    const leaf = P.forest;
    const clump = (cx: number, cy: number, r: number, c: number) => {
      const lf = mix(leaf, '#9fb8a4', 0.35);
      for (const [dx, dy, rr, cc] of [[0, 0.7, 1, -0.24], [-0.55, 0.1, 0.62, -0.1], [0.55, 0.3, 0.6, -0.16], [0, -0.2, 0.8, 0]] as const) ellipse(ctx, cx + dx * r * k, cy + dy * k, r * rr * k, r * rr * 0.5 * k, shade(lf, c + cc)); // lobed, uneven clumps
      ellipse(ctx, cx - r * 0.25 * k, cy - 0.7 * k, r * 0.5 * k, r * 0.2 * k, shade(mix(lf, '#dfe8c8', 0.5), c + 0.1));
      for (let i = 0; i < 6; i++) { // long, thin leaves hang below
        const lx = cx + (i - 2.5) * r * 0.32 * k, ly = cy + (0.8 + (i % 2) * 0.6) * k;
        poly(ctx, [lx - 0.35 * k, ly, lx + 0.35 * k, ly, lx + (i % 2 ? 0.5 : -0.4) * k, ly + (2.6 + (i % 3) * 0.9) * k], shade(leaf, i % 2 ? -0.1 : 0.08));
      }
    };
    clump(x + 8 * k, y - 22.4 * k, 5.4, 0);
    clump(x - 8.4 * k, y - 21.4 * k, 5.6, -0.06);
    clump(x - 0.4 * k, y - 26.6 * k, 6.2, 0.04);
    clump(x + 4 * k, y - 18 * k, 3.6, -0.1);
    return;
  }
  if (v === 1) {
    // bloodwood: a thick, dark, tessellated trunk, a wide dense crown and tiny red gum-nut blossoms
    const bk = '#6e3f2b';
    curve(x, y, x + 0.6 * k, y - 6 * k, x - 0.3 * k, y - 11 * k, 4.4 * k, shade(bk, -0.25));
    curve(x - 0.5 * k, y, x + 0.1 * k, y - 6 * k, x - 0.8 * k, y - 11 * k, 2.6 * k, bk);
    for (let i = 0; i < 6; i++) { // rough, tessellated bark plates
      const o = (i % 2) * 0.9;
      line(ctx, x - 1.8 * k + o * k, y - (1 + i * 1.7) * k, x - 0.4 * k + o * k, y - (0.4 + i * 1.7) * k, shade(bk, -0.42), 0.5 * k);
      line(ctx, x - 0.4 * k + o * k, y - (0.4 + i * 1.7) * k, x + 0.5 * k + o * k * 0.4, y - (1.3 + i * 1.7) * k, shade(bk, -0.42), 0.5 * k);
      line(ctx, x - 1.1 * k - o * 0.4 * k, y - (1.8 + i * 1.7) * k, x - 1 * k - o * 0.4 * k, y - (0.7 + i * 1.7) * k, shade(bk, -0.3), 0.4 * k);
    }
    curve(x - 0.4 * k, y - 10 * k, x - 4.4 * k, y - 12 * k, x - 6.6 * k, y - 15 * k, 2 * k, bk);
    curve(x - 0.4 * k, y - 10 * k, x + 4.4 * k, y - 12 * k, x + 7 * k, y - 15 * k, 2 * k, shade(bk, -0.1));
    const g = mix(P.forest, '#4f6a34', 0.5);
    for (const [dx, dy, rx, ry, c] of [[-5.4, -15, 6, 3.6, -0.14], [5.8, -15, 6.4, 3.8, -0.2], [0, -18.6, 8, 4.4, -0.06], [-1.6, -21, 5.4, 3, 0.08]] as const) {
      ellipse(ctx, x + dx * k, y + (dy + 1) * k, rx * k, ry * k, shade(g, c - 0.16));
      ellipse(ctx, x + dx * k, y + dy * k, rx * k, ry * k, shade(g, c));
      ellipse(ctx, x + (dx - rx * 0.25) * k, y + (dy - ry * 0.35) * k, rx * 0.6 * k, ry * 0.4 * k, shade(g, c + 0.16));
    }
    for (const [dx, dy] of [[-4, -16.6], [3, -19.4], [6.4, -14.6], [-6.6, -13.4], [-0.6, -22.6], [1.4, -16]] as const) { ellipse(ctx, x + dx * k, y + dy * k, 0.9 * k, 0.8 * k, '#d8442e'); ellipse(ctx, x + (dx - 0.2) * k, y + (dy - 0.2) * k, 0.4 * k, 0.35 * k, '#f2a070'); }
    return;
  }
  if (v === 2) {
    // grass tree: a squat black trunk, a shaggy skirt of drooping blades and a tall flower spear
    const tr = '#2c2118';
    curve(x, y, x + 0.8 * k, y - 4 * k, x + 0.4 * k, y - 8.4 * k, 3.6 * k, shade(tr, 0.12));
    curve(x - 0.7 * k, y, x + 0.1 * k, y - 4 * k, x - 0.3 * k, y - 8.4 * k, 1 * k, shade(tr, 0.4));
    for (let i = 0; i < 4; i++) line(ctx, x - 1.4 * k, y - (1.2 + i * 2) * k, x + 1.8 * k, y - (0.6 + i * 2) * k, '#0e0a06', 0.5 * k); // charred bands
    // the flower spear
    line(ctx, x + 0.4 * k, y - 9 * k, x + 1 * k, y - 26 * k, '#6a4a2a', 1.3 * k);
    line(ctx, x + 0.4 * k, y - 15.6 * k, x + 1 * k, y - 26 * k, '#c9a878', 1.7 * k);
    line(ctx, x + 0.9 * k, y - 16 * k, x + 1.4 * k, y - 25.6 * k, '#e6d6b0', 0.6 * k);
    const cx = x + 0.4 * k, cy = y - 8.4 * k;
    const G = mix(P.forest, '#7ea04a', 0.35);
    for (let i = 0; i < 21; i++) {
      const a = Math.PI + (i / 20) * Math.PI;
      const len = (8.6 + rand(variant + 5, i) * 2.6) * k;
      const ex = cx + Math.cos(a) * len, ey = cy - Math.sin(a) * len * 0.7 + len * 0.42;
      ctx.strokeStyle = ink(i % 3 === 0 ? shade(G, 0.2) : i % 3 === 1 ? G : shade(G, -0.2));
      ctx.lineWidth = 0.6 * k;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(cx + Math.cos(a) * len * 0.7, cy - Math.sin(a) * len * 1.0 - 1.4 * k, ex, ey);
      ctx.stroke();
    }
    ellipse(ctx, cx, cy - 0.6 * k, 2 * k, 1.2 * k, shade(G, -0.32));
    return;
  }
  // desert oak: a slim dark trunk under a soft, weeping mass of fine grey-green needles
  const tk = '#5c4a3a';
  curve(x, y, x + 0.8 * k, y - 8 * k, x, y - 15 * k, 2.4 * k, shade(tk, -0.1));
  curve(x - 0.4 * k, y, x + 0.3 * k, y - 8 * k, x - 0.5 * k, y - 15 * k, 1 * k, shade(tk, 0.25));
  for (let i = 0; i < 5; i++) line(ctx, x - 1 * k, y - (2 + i * 2.6) * k, x + 1.2 * k, y - (1.4 + i * 2.6) * k, shade(tk, -0.36), 0.5 * k); // corky ridges
  const nd = mix(P.forest, '#7a8a6a', 0.55);
  ellipse(ctx, x + 0.2 * k, y - 18 * k, 8.4 * k, 4.4 * k, shade(nd, -0.2));
  ellipse(ctx, x - 0.2 * k, y - 19.4 * k, 7.2 * k, 3.7 * k, nd);
  ellipse(ctx, x - 1.6 * k, y - 21 * k, 4.6 * k, 2 * k, shade(nd, 0.16));
  for (let i = 0; i < 22; i++) { // drooping needle strands
    const a = (i / 21) * Math.PI * 2, r = (1.4 + rand(variant + 9, i) * 5.6) * k;
    const bx = x + Math.cos(a) * r * 1.3, by = y - 18 * k + Math.sin(a) * r * 0.45;
    line(ctx, bx, by, bx + Math.cos(a) * 0.9 * k, by + (3 + rand(variant + 11, i) * 3.4) * k, i % 2 ? shade(nd, 0.2) : shade(nd, -0.28), 0.5 * k);
  }
}

/** Bark humpies, grass domes, windbreaks, drying racks, a rock-art wall and an everyday fire ring. */
function aboriginalBuilding(ctx: Ctx, x: number, y: number, big: boolean, roofC: string) {
  const bark = '#a56a3c', barkD = '#6d4326', barkL = '#c98f58', clay = '#f1ead8', ochre = '#b8502e', string = '#e6d6b0';
  const spot: Record<string, number> = { '-10,2': 1, '10,2': 0, '0,8': 3, '-6,-8': 2, '7,-7': 1, '-14,-3': 0, '14,-2': 2 }; // which camp goes on which building spot
  const seed = spot[`${Math.round(x)},${Math.round(y)}`] ?? ((Math.round(x) * 7 + Math.round(y) * 3) % 4 + 4) % 4;
  const stones = (cx: number, cy: number, rx: number, ry: number, n: number, r: number) => { // a ring of hearth stones
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.3, sx = cx + Math.cos(a) * rx, sy = cy + Math.sin(a) * ry;
      ellipse(ctx, sx, sy + 0.4, r, r * 0.7, '#5f5a52');
      ellipse(ctx, sx, sy, r, r * 0.7, i % 2 ? '#a39c90' : '#b8b0a2');
      ellipse(ctx, sx - r * 0.3, sy - r * 0.25, r * 0.4, r * 0.28, '#d8d2c4');
    }
  };
  const flame = (fx: number, fy: number, s: number) => {
    poly(ctx, [fx - 1.4 * s, fy, fx - 0.2 * s, fy - 4.4 * s, fx + 0.4 * s, fy - 2 * s, fx + 1.4 * s, fy], '#e8642a');
    poly(ctx, [fx - 0.8 * s, fy, fx + 0.2 * s, fy - 3 * s, fx + 0.9 * s, fy], '#f6c33a');
    ellipse(ctx, fx, fy, 1 * s, 0.5 * s, '#fff0a0');
  };
  const smoke = (sx: number, sy: number, s: number) => {
    ctx.strokeStyle = 'rgba(190,190,195,0.5)';
    ctx.lineWidth = 1.3 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(sx + 2 * s, sy - 3 * s, sx - 2 * s, sy - 5 * s, sx + 1.6 * s, sy - 8 * s);
    ctx.stroke();
  };
  /** A gunyah / humpy: a gabled frame of poles under overlapping sheets of bark, ridge poles poking out at both ends, a dark doorway in the gable. */
  const humpy = (cx: number, cy: number, w: number, rh: number) => {
    const hw = w / 2, hh = w / 4;
    const Lc = [cx - hw, cy], Fc = [cx, cy + hh], Rc = [cx + hw, cy];
    const rL = [cx - hw / 2, cy - hh / 2 - rh], rF = [cx + hw / 2, cy + hh / 2 - rh];
    poly(ctx, [Fc[0], Fc[1], Rc[0], Rc[1], rF[0], rF[1]], barkD); // the gable end
    for (const t of [0.3, 0.55, 0.8]) line(ctx, Fc[0] * (1 - t) + rF[0] * t, Fc[1] * (1 - t) + rF[1] * t, Rc[0] * (1 - t) + rF[0] * t, Rc[1] * (1 - t) + rF[1] * t, shade(barkD, -0.3), 0.5); // battens across the gable
    poly(ctx, [Lc[0], Lc[1], Fc[0], Fc[1], rF[0], rF[1], rL[0], rL[1]], bark); // the sunlit roof plane of bark sheets
    for (const t of [0.34, 0.68]) line(ctx, Lc[0] * (1 - t) + rL[0] * t, Lc[1] * (1 - t) + rL[1] * t, Fc[0] * (1 - t) + rF[0] * t, Fc[1] * (1 - t) + rF[1] * t, shade(bark, -0.4), 0.6); // courses of overlapping sheets
    for (let i = 1; i < 4; i++) { const f = i / 4; line(ctx, Lc[0] + (Fc[0] - Lc[0]) * f, Lc[1] + (Fc[1] - Lc[1]) * f, rL[0] + (rF[0] - rL[0]) * f, rL[1] + (rF[1] - rL[1]) * f, shade(bark, -0.22), 0.45); }
    line(ctx, Lc[0], Lc[1], Fc[0], Fc[1], barkL, 1); // the lit eave
    line(ctx, Fc[0], Fc[1], Rc[0], Rc[1], barkD, 0.8);
    line(ctx, rL[0] - 1.6, rL[1] - 0.8, rF[0] + 2.2, rF[1] + 1.1, '#4a2e16', 1.1); // the ridge pole, ends poking out
    for (const f of [0.28, 0.5, 0.72]) line(ctx, rL[0] + (rF[0] - rL[0]) * f - 0.2, rL[1] + (rF[1] - rL[1]) * f - 1.2, rL[0] + (rF[0] - rL[0]) * f + 0.2, rL[1] + (rF[1] - rL[1]) * f + 0.8, string, 0.5); // ties
    const m = [(Fc[0] + Rc[0]) / 2, (Fc[1] + Rc[1]) / 2];
    poly(ctx, [m[0] - 2.2, m[1] + 1.1, m[0] + 2.2, m[1] - 1.1, m[0] + 2.2, m[1] - 5, m[0] + 0.4, m[1] - 6.6, m[0] - 2.2, m[1] - 4.6], '#2a1a10'); // the doorway
    line(ctx, m[0] - 2.2, m[1] + 1.1, m[0] + 2.2, m[1] - 1.1, '#c9a878', 0.6); // a threshold log
  };
  if (big) {
    // the great camp: a rock-art wall of red stone behind, a big bark gunyah, a fire ring and a drying rack
    const rk = [[-8.4, -0.4], [-9, -7], [-6.6, -12.4], [-2.4, -14.4], [1.8, -12.2], [4.4, -8.4], [4.8, -2.6], [0.6, 1.4], [-4, 1.6]] as [number, number][];
    poly(ctx, rk.flatMap(([a, b]) => [x + a, y + b]), '#a8523a'); // a face of red rock
    poly(ctx, [x + 0.6, y + 1.4, x + 4.8, y - 2.6, x + 4.4, y - 8.4, x + 1.8, y - 12.2, x - 0.6, y - 9, x - 0.4, y - 3], '#8a3f2a'); // its shaded flank
    poly(ctx, [x - 9, y - 7, x - 6.6, y - 12.4, x - 2.4, y - 14.4, x - 4.6, y - 9.6], '#c67a58'); // the lit shoulder
    for (const [ya, ha] of [[-3, 0.5], [-6.4, -0.5], [-9.6, 0.4]] as const) line(ctx, x - 8.6, y + ya, x + 4.6, y + ya + ha, '#8a3f2a', 0.6); // strata
    for (const [hx, hy] of [[-6, -6.2], [-3.4, -7.6], [-0.4, -6.2]] as const) { // ochre-and-clay hand stencils
      const px = x + hx, py = y + hy;
      ellipse(ctx, px, py, 0.95, 1.1, clay);
      for (let i = 0; i < 4; i++) line(ctx, px - 0.9 + i * 0.6, py - 0.7, px - 1.2 + i * 0.75, py - 2.7, clay, 0.42);
      line(ctx, px + 0.9, py - 0.2, px + 2, py - 1.4, clay, 0.42);
    }
    ctx.strokeStyle = clay; // a small kangaroo outline
    ctx.lineWidth = 0.55;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 6.4, y - 1.8); ctx.lineTo(x - 5.6, y - 4.2); ctx.lineTo(x - 4.4, y - 4.6); ctx.lineTo(x - 3.6, y - 3.8); ctx.lineTo(x - 4.2, y - 3); ctx.lineTo(x - 4.4, y - 1.6);
    ctx.stroke();
    line(ctx, x - 5.4, y - 2.6, x - 7.4, y - 1.2, clay, 0.5); // its tail
    for (const [dx, dy] of [[-2, -2.6], [-1, -2.2], [0, -1.8], [1, -1.4], [2, -1]] as const) ellipse(ctx, x + dx, y + dy, 0.45, 0.4, ochre); // a row of ochre dots
    humpy(x + 7, y + 3.4, 14, 8.6);
    ellipse(ctx, x - 5, y + 6.4, 4, 1.8, '#9c7a54'); // scraped clay under the hearth
    stones(x - 5, y + 6.2, 3, 1.3, 8, 0.8);
    flame(x - 5, y + 6.2, 1);
    smoke(x - 5, y + 3.4, 0.7);
    return;
  }
  if (seed === 0) {
    humpy(x, y, 11, 7);
    line(ctx, x + 6.6, y - 6, x + 7.4, y + 1.6, '#c9a878', 0.6); // a spear left leaning by the door
    poly(ctx, [x + 6.6, y - 6, x + 6, y - 7.6, x + 7.4, y - 7], '#e0d0a8');
  } else if (seed === 1) {
    // a dome of woven boughs and thatched grass, banded with ties, sticks poking from the crown
    const r = 6.2;
    ellipse(ctx, x, y + 0.6, r + 1.4, (r + 1.4) * 0.5, '#8a6a42');
    ctx.beginPath();
    ctx.moveTo(x - r, y);
    ctx.bezierCurveTo(x - r, y - r * 1.75, x + r, y - r * 1.75, x + r, y);
    ctx.ellipse(x, y, r, r * 0.5, 0, 0, Math.PI, false);
    ctx.closePath();
    ctx.fillStyle = ink(shade(roofC, -0.08));
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(70,40,10,0.24)';
    ctx.fillRect(x, y - 12, 8, 14); // the shaded half
    for (const f of [0.28, 0.5, 0.72]) { // ties round the dome
      ctx.strokeStyle = ink(shade(roofC, -0.42));
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.ellipse(x, y - r * 1.2 * f * 1.25 + 1.4, r * (1 - f * 0.78), r * 0.42 * (1 - f * 0.5), 0, 0.02 * Math.PI, 0.98 * Math.PI);
      ctx.stroke();
    }
    for (let i = 0; i < 7; i++) line(ctx, x - r + i * r * 0.32, y - 0.6, x + (i - 3) * 0.4, y - r * 1.2, shade(roofC, 0.14), 0.4); // grass strands
    ctx.restore();
    ctx.strokeStyle = ink(shade(roofC, -0.5));
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.5, 0, 0.02 * Math.PI, 0.98 * Math.PI);
    ctx.stroke();
    poly(ctx, [x + 0.6, y + 2.4, x + 0.6, y - 1.2, x + 2.4, y - 2.4, x + 4.2, y - 1.2, x + 4.2, y + 1.4], '#2a1a10'); // a low doorway
    for (const dx of [-1.6, 0, 1.4]) line(ctx, x + dx * 0.6, y - r * 1.25 + 0.6, x + dx, y - r * 1.25 - 2.4, '#7a5230', 0.6);
    ellipse(ctx, x, y - r * 1.25 + 0.6, 1.2, 0.6, shade(roofC, -0.3));
  } else if (seed === 2) {
    // a brush windbreak curved round a hearth, a rack of drying meat and skins
    ellipse(ctx, x + 1, y + 1.4, 6.6, 2.8, '#9c7a54'); // scraped ground
    for (let i = 0; i < 9; i++) {
      const t = i / 8, sx = x - 7 + t * 12, sy = y - 3.2 + Math.sin(t * Math.PI) * -1.2 + t * 1.4;
      line(ctx, sx, sy + 2.4, sx + (t - 0.5) * 1.4, sy - 5.8, '#6a4a2a', 0.8); // upright forked stakes
      ellipse(ctx, sx, sy - 3.6, 2.1, 3.6, i % 2 ? '#8a9a4a' : '#6f8a3a'); // leafy brush
      ellipse(ctx, sx - 0.5, sy - 4.8, 1, 1.9, i % 2 ? '#a5b45a' : '#8aa04a');
    }
    stones(x + 1.4, y + 2.6, 2.2, 1, 7, 0.65);
    flame(x + 1.4, y + 2.6, 0.9);
    smoke(x + 1.4, y - 0.4, 0.8);
    const rx = x + 8, ry = y + 4;
    line(ctx, rx - 3.4, ry - 8, rx - 3.6, ry + 0.4, '#5a3a1e', 0.9);
    line(ctx, rx + 3.4, ry - 8.4, rx + 3.6, ry + 0.6, '#5a3a1e', 0.9);
    line(ctx, rx - 4.2, ry - 7.6, rx + 4.2, ry - 8.4, '#7a5230', 0.9);
    for (const [i, c] of [[0, '#8a3a2a'], [1, '#c9a878'], [2, '#8a3a2a'], [3, '#a5563a']] as const) poly(ctx, [rx - 3 + i * 2, ry - 7.8 - i * 0.2, rx - 2 + i * 2, ry - 7.9 - i * 0.2, rx - 1.8 + i * 2, ry - 3.8, rx - 2.9 + i * 2, ry - 3.4], c);
  } else {
    // a yarning place: a ring of stones round a small fire, log seats, a wooden dish and a digging stick
    ellipse(ctx, x, y + 1, 8.4, 3.6, '#a5825a');
    ellipse(ctx, x, y + 0.6, 7, 3, '#93724a');
    for (const [dx, dy] of [[-6.4, -2.4], [6.2, 0.8], [-3, 3]] as const) {
      box(ctx, x + dx, y + dy, 5, 1.7, '#7a5230');
      ellipse(ctx, x + dx - 2.4, y + dy - 0.8, 0.9, 0.5, '#c9a878');
    }
    stones(x, y + 0.6, 3.4, 1.5, 9, 0.9);
    ellipse(ctx, x, y + 0.6, 2.4, 1, '#3a2418');
    flame(x, y + 0.8, 1.2);
    smoke(x + 0.6, y - 3, 1);
    ellipse(ctx, x + 5.2, y + 3.4, 1.7, 0.75, '#8a5a34'); // a coolamon
    ellipse(ctx, x + 5.2, y + 3.2, 1.3, 0.5, '#4a2e18');
    line(ctx, x - 8, y + 1, x - 10.4, y - 7, '#a5723e', 0.8); // a digging stick
  }
}

// ---------------------------------------------------------------- Great Plains: cottonwoods, prairie, sage and the painted tipi camp

const LK_HIDE = '#d9c9a0', LK_HIDE_D = '#a8956a', LK_RED = '#b8402e', LK_BLUE = '#2f5f9a', LK_YEL = '#e2b43a', LK_WHITE = '#f6f1e4';
const LK_POLE = '#6a4a2c', LK_POLE_L = '#a57a48', LK_DOOR = '#5a4632';

/** Trees and scrub of the plains: cottonwoods along the creeks, prairie-grass clumps, sparse ponderosa pines and sage. */
function lkTree(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  const type = ['cottonwood', 'grass', 'pine', 'cottonwood', 'sage', 'grass', 'cottonwood', 'sage', 'pine', 'grass'][variant % 10];
  ctx.lineCap = 'round';
  const curve = (x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, w: number, c: string) => {
    ctx.strokeStyle = ink(c);
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx, cy, x1, y1);
    ctx.stroke();
  };
  if (type === 'cottonwood') {
    // a broad cottonwood: a pale, deeply furrowed trunk that forks low, and a wide crown of green and gold leaves
    const bk = '#a09078';
    curve(x, y, x - 0.6 * k, y - 7 * k, x + 0.2 * k, y - 12 * k, 3.8 * k, shade(bk, -0.28));
    curve(x - 0.6 * k, y, x - 1.2 * k, y - 7 * k, x - 0.4 * k, y - 12 * k, 2.3 * k, bk);
    curve(x - 1.3 * k, y - 0.6 * k, x - 1.8 * k, y - 7 * k, x - 1 * k, y - 11.6 * k, 0.6 * k, shade(bk, 0.4));
    for (let i = 0; i < 5; i++) line(ctx, x - 1.8 * k + (i % 2) * 0.8 * k, y - (1.2 + i * 2) * k, x - 0.2 * k + (i % 2) * 0.5 * k, y - (0.4 + i * 2) * k, shade(bk, -0.5), 0.45 * k); // furrows
    curve(x + 0.1 * k, y - 10 * k, x + 3 * k, y - 12 * k, x + 5.6 * k, y - 16 * k, 1.8 * k, shade(bk, -0.12));
    curve(x - 0.3 * k, y - 10.6 * k, x - 3.4 * k, y - 12.6 * k, x - 5.8 * k, y - 16 * k, 1.8 * k, shade(bk, -0.18));
    const g = mix(P.forest, '#8fbe4a', 0.42);
    for (const [dx, dy, rx, ry, c] of [[-6, -16.4, 6.2, 4.4, -0.14], [5.8, -16.8, 6.4, 4.6, -0.18], [0, -21, 7.8, 5, -0.04], [-3.2, -25, 4.8, 3.2, 0.06], [3.6, -24, 4.8, 3.2, 0.02]] as const) {
      ellipse(ctx, x + dx * k, y + (dy + 1.3) * k, rx * k, ry * k, shade(g, c - 0.18)); // the shadowed underside
      ellipse(ctx, x + dx * k, y + dy * k, rx * k, ry * k, shade(g, c));
      ellipse(ctx, x + (dx - rx * 0.28) * k, y + (dy - ry * 0.34) * k, rx * 0.58 * k, ry * 0.42 * k, shade(g, c + 0.17)); // sunlit top
    }
    for (let i = 0; i < 14; i++) { // fluttering leaves, a few turning gold
      const a = rand(variant + 3, i) * Math.PI * 2, r = 3 + rand(variant + 7, i) * 6.4;
      const lx = x + Math.cos(a) * r * 1.15 * k, ly = y - 20.4 * k + Math.sin(a) * r * 0.72 * k;
      ellipse(ctx, lx, ly, 0.75 * k, 0.6 * k, i % 4 === 0 ? '#d8c24a' : shade(g, 0.28));
    }
    return;
  }
  if (type === 'grass') {
    // tall prairie grass: two clumps of bowed, gold-green blades with feathery seed heads and a few coneflowers
    for (const [ox, oy, s, seed] of [[0, 0, 1, 1], [5.2, 1.4, 0.7, 2], [-5, 1, 0.6, 3]] as const) {
      const n = seed === 1 ? 17 : 10;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + ((i / (n - 1)) - 0.5) * 2.1;
        const len = (8.4 + rand(variant + seed, i) * 5.4) * s * k;
        const bx = x + ox * k + (i / (n - 1) - 0.5) * 3.6 * s * k, by = y + oy * k;
        const ex = bx + Math.cos(a) * len * 0.75 + (i % 2 ? 1.6 : -1.2) * s * k, ey = by + Math.sin(a) * len;
        const c = i % 3 === 0 ? '#c9b04a' : i % 3 === 1 ? '#8faa48' : '#a9b455';
        curve(bx, by, bx + Math.cos(a) * len * 0.3, by + Math.sin(a) * len * 0.8, ex, ey, 0.75 * s * k, shade(c, i % 4 === 0 ? 0.16 : -0.06));
        if (i % 3 === 0) { ellipse(ctx, ex, ey - 0.4 * k, 0.55 * s * k, 1.4 * s * k, '#d9c56a'); ellipse(ctx, ex - 0.1 * k, ey - 0.9 * k, 0.28 * s * k, 0.8 * s * k, '#f0e2a0'); } // seed head
      }
    }
    for (const [dx, dy, c] of [[-3.6, 1.2, '#a04a8a'], [3.4, 1.6, '#d8783a'], [0.6, 2.2, '#a04a8a']] as const) { // coneflowers
      line(ctx, x + dx * k, y + dy * k, x + dx * k, y + (dy - 4) * k, '#6a8a3a', 0.5 * k);
      ellipse(ctx, x + dx * k, y + (dy - 4.4) * k, 1 * k, 0.7 * k, c);
      ellipse(ctx, x + dx * k, y + (dy - 4.6) * k, 0.4 * k, 0.4 * k, '#5a3a20');
    }
    return;
  }
  if (type === 'pine') {
    // a sparse ponderosa pine: a tall orange-plated trunk, bare below, with tufts of long needles on upswept limbs
    const bk = '#8a4e2c';
    curve(x, y, x + 0.4 * k, y - 13 * k, x + 0.2 * k, y - 26 * k, 2.6 * k, shade(bk, -0.3));
    curve(x - 0.4 * k, y, x - 0.1 * k, y - 13 * k, x - 0.3 * k, y - 26 * k, 1.5 * k, bk);
    curve(x - 0.8 * k, y, x - 0.5 * k, y - 13 * k, x - 0.7 * k, y - 25 * k, 0.5 * k, shade(bk, 0.34));
    for (let i = 0; i < 8; i++) line(ctx, x - 1 * k, y - (1.4 + i * 2.9) * k, x + 1 * k, y - (0.8 + i * 2.9) * k, '#5a2f18', 0.45 * k); // bark plates
    const nd = mix(P.forest, '#3a6a3a', 0.4);
    const tuft = (tx: number, ty: number, r: number, c: number) => { // a bottlebrush of long needles
      ellipse(ctx, tx, ty + 0.4 * k, r * 0.38 * k, r * 0.26 * k, shade(nd, c - 0.25));
      for (let i = 0; i < 15; i++) {
        const a = -Math.PI * 1.08 + (i / 14) * Math.PI * 1.16, len = r * (0.85 + (i % 3) * 0.14) * k;
        line(ctx, tx, ty, tx + Math.cos(a) * len, ty + Math.sin(a) * len * 0.8 + 0.3 * k, shade(nd, c + (i % 2 ? 0.14 : -0.1)), 0.6 * k);
      }
      ellipse(ctx, tx - 0.4 * k, ty - 0.6 * k, r * 0.3 * k, r * 0.2 * k, shade(nd, c + 0.2));
    };
    for (const [dy, dir, len] of [[-13, -1, 5], [-15.6, 1, 5.6], [-18.4, -1, 4.6], [-21, 1, 4.4]] as const) {
      curve(x + 0.2 * k, y + dy * k, x + dir * len * 0.5 * k, y + (dy - 0.6) * k, x + dir * len * k, y + (dy - 2.2) * k, 0.9 * k, shade(bk, -0.1));
      tuft(x + dir * len * k, y + (dy - 2.6) * k, 3.8, dir * 0.03);
    }
    tuft(x + 0.2 * k, y - 26.4 * k, 4.4, 0.06);
    tuft(x - 1.2 * k, y - 23.6 * k, 3, -0.04);
    return;
  }
  // sage: a rounded, silver-grey mound of aromatic leaves on woody stems, with yellow flower spikes
  for (const [dx, dy, rx, ry, c] of [[-3, 0, 3.4, 2.4, -0.1], [3.2, 0.6, 3.2, 2.2, -0.16], [0, -1.2, 4.2, 3, 0]] as const) {
    ellipse(ctx, x + dx * k, y + (dy - 1.6) * k + 0.8 * k, rx * k, ry * k, shade('#8a9c86', c - 0.2));
    ellipse(ctx, x + dx * k, y + (dy - 1.6) * k, rx * k, ry * k, shade('#93a58a', c));
    ellipse(ctx, x + (dx - 0.8) * k, y + (dy - 2.4) * k, rx * 0.55 * k, ry * 0.4 * k, shade('#b4c4a8', c + 0.05));
  }
  for (let i = 0; i < 7; i++) {
    const sx = x + (i - 3) * 1.3 * k, sy = y - (3.4 + rand(variant + 4, i) * 1.6) * k;
    line(ctx, sx, sy, sx + (i % 2 ? 0.5 : -0.4) * k, sy - 2.4 * k, '#a9b89a', 0.45 * k);
    ellipse(ctx, sx + (i % 2 ? 0.5 : -0.4) * k, sy - 2.6 * k, 0.5 * k, 0.4 * k, '#d8cc5a');
  }
  line(ctx, x - 1 * k, y - 0.4 * k, x - 2 * k, y + 0.6 * k, '#6a5a44', 0.5 * k);
  line(ctx, x + 1.4 * k, y - 0.4 * k, x + 2.4 * k, y + 0.5 * k, '#6a5a44', 0.5 * k);
}

/** A painted hide tipi: a cone of stitched hides, crossed pole tips, smoke flaps, a laced door and painted bands. */
function lkTipi(ctx: Ctx, x: number, y: number, r: number, h: number, paint: number, poles = true) {
  const ry = r * 0.5, ax = x - r * 0.14, ay = y - h;
  ellipse(ctx, x, y + 0.6, r * 1.06, ry * 1.1, 'rgba(0,0,0,0.2)');
  const cone = () => {
    ctx.beginPath();
    ctx.moveTo(x - r, y);
    ctx.lineTo(ax, ay);
    ctx.lineTo(x + r, y);
    ctx.ellipse(x, y, r, ry, 0, 0, Math.PI);
    ctx.closePath();
  };
  const hide = paint === 3 ? '#c8b78a' : LK_HIDE;
  // the ring of the cone at fraction t of the way up, and a point on its front half at angle a (0 = right, PI = left)
  const ring = (t: number, a: number) => [x + (ax - x) * t + Math.cos(a) * r * (1 - t), y + (ay - y) * t + Math.sin(a) * ry * (1 - t)] as const;
  const bandBetween = (t0: number, t1: number, color: string) => {
    ctx.beginPath();
    const s0 = ring(t0, 0);
    ctx.moveTo(s0[0], s0[1]);
    ctx.ellipse(x + (ax - x) * t0, y + (ay - y) * t0, r * (1 - t0), ry * (1 - t0), 0, 0, Math.PI);
    const e1 = ring(t1, Math.PI);
    ctx.lineTo(e1[0], e1[1]);
    ctx.ellipse(x + (ax - x) * t1, y + (ay - y) * t1, r * (1 - t1), ry * (1 - t1), 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fillStyle = ink(color);
    ctx.fill();
  };
  const tris = (t0: number, t1: number, n: number, color: string, up = true) => {
    for (let i = 0; i < n; i++) {
      const a = ((i + 0.5) / n) * Math.PI, da = (Math.PI / n) * 0.42;
      const p0 = ring(up ? t0 : t1, a - da), p1 = ring(up ? t0 : t1, a + da), p2 = ring(up ? t1 : t0, a);
      poly(ctx, [p0[0], p0[1], p1[0], p1[1], p2[0], p2[1]], color);
    }
  };
  const dots = (t: number, n: number, rad: number, color: string) => {
    for (let i = 0; i < n; i++) {
      const p = ring(t, ((i + 0.5) / n) * Math.PI);
      ellipse(ctx, p[0], p[1], rad, rad * 0.8, color);
    }
  };
  ctx.save();
  cone();
  ctx.fillStyle = ink(hide);
  ctx.fill();
  cone();
  ctx.clip();
  poly(ctx, [ax, ay, x + r + 3, y - 1, x + r + 3, y + ry + 3, x, y + ry + 3], 'rgba(70,45,20,0.24)'); // the shaded side
  poly(ctx, [ax, ay, x - r - 3, y - 1, x - r - 3, y + ry * 0.4, x - r * 0.72, y + ry * 0.74], 'rgba(255,250,225,0.16)'); // the lit edge
  const g = ctx.createLinearGradient(0, ay, 0, ay + h * 0.46);
  g.addColorStop(0, 'rgba(50,34,20,0.62)'); // smoke-stained top
  g.addColorStop(1, 'rgba(50,34,20,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r - 2, ay - 1, r * 2 + 4, h * 0.5);
  for (const a of [0.24, 0.5, 0.78]) { const p = ring(0, a * Math.PI); line(ctx, ax, ay, p[0], p[1], 'rgba(90,64,34,0.28)', 0.5); } // stitched hide seams
  if (paint === 0 || paint === 4) {
    bandBetween(0, 0.1, LK_RED);
    tris(0.1, 0.22, 9, paint === 4 ? LK_WHITE : LK_YEL);
    bandBetween(0.09, 0.11, '#3a2418');
  }
  if (paint === 2) {
    bandBetween(0, 0.15, LK_BLUE);
    dots(0.075, 9, r * 0.05, LK_WHITE);
    bandBetween(0.15, 0.18, LK_RED);
  }
  if (paint === 1 || paint === 4) {
    bandBetween(0.5, 0.58, paint === 4 ? LK_BLUE : LK_RED);
    dots(0.4, 7, r * 0.055, paint === 4 ? LK_YEL : LK_BLUE);
    dots(0.54, 9, r * 0.03, LK_WHITE);
  }
  if (paint === 3) dots(0.24, 8, r * 0.045, LK_RED);
  ctx.restore();
  // the laced front seam and door
  const fb = [x, y + ry] as const;
  const seam = (t: number) => [fb[0] + (ax - fb[0]) * t, fb[1] + (ay - fb[1]) * t] as const;
  for (const t of [0.42, 0.52, 0.62, 0.72, 0.82]) { const p = seam(t); ellipse(ctx, p[0], p[1], 0.45, 0.4, '#efe3c0'); }
  const d0 = seam(0), d1 = seam(0.27), hw0 = r * 0.15, hw1 = r * 0.07;
  poly(ctx, [d0[0] - hw0, d0[1] + 0.6, d1[0] - hw1, d1[1], d1[0] + hw1, d1[1], d0[0] + hw0, d0[1] + 0.6], LK_DOOR);
  poly(ctx, [d0[0] - hw0, d0[1] + 0.6, d1[0] - hw1, d1[1], d1[0], d1[1], d0[0], d0[1] + 0.6], shade(LK_DOOR, 0.16));
  line(ctx, d1[0] - hw1 - 0.5, d1[1] + 0.2, d1[0] + hw1 + 0.5, d1[1] + 0.2, LK_POLE_L, 0.6); // the stick that holds the flap
  // pole tips crossing at the smoke hole, and the two smoke flaps
  if (poles) {
    const s = r / 5.4;
    for (let i = -2; i <= 2; i++) {
      line(ctx, ax - i * 0.45 * s, ay + 3.2 * s, ax + i * 0.8 * s, ay - (3.6 + (2 - Math.abs(i)) * 0.5) * s, LK_POLE, 0.75);
      line(ctx, ax - i * 0.45 * s - 0.2, ay + 3 * s, ax + i * 0.8 * s - 0.2, ay - (3.4 + (2 - Math.abs(i)) * 0.5) * s, LK_POLE_L, 0.25);
    }
    poly(ctx, [ax - 0.3, ay + 3 * s, ax - 3.4 * s, ay - 0.8 * s, ax - 1.6 * s, ay - 2.4 * s, ax - 0.2, ay + 0.2], hide);
    poly(ctx, [ax - 0.3, ay + 3 * s, ax - 3.4 * s, ay - 0.8 * s, ax - 2.3 * s, ay + 0.2 * s, ax - 0.3, ay + 1.8 * s], LK_HIDE_D);
    poly(ctx, [ax + 0.3, ay + 3 * s, ax + 3.4 * s, ay - 0.6 * s, ax + 1.8 * s, ay - 2.6 * s, ax + 0.4, ay + 0.2], shade(hide, -0.2));
  }
}

/** A cooking fire with a ring of stones and a curl of smoke. */
function lkFire(ctx: Ctx, x: number, y: number, s: number) {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.3, sx = x + Math.cos(a) * 3.2 * s, sy = y + Math.sin(a) * 1.4 * s;
    ellipse(ctx, sx, sy + 0.4, 0.9 * s, 0.65 * s, '#5f5a52');
    ellipse(ctx, sx, sy, 0.9 * s, 0.65 * s, i % 2 ? '#a39c90' : '#b8b0a2');
  }
  ellipse(ctx, x, y, 2.4 * s, 1 * s, '#3a2418');
  line(ctx, x - 2 * s, y + 0.2, x + 1.6 * s, y - 0.8 * s, '#4a2e18', 0.9);
  poly(ctx, [x - 1.5 * s, y, x - 0.3 * s, y - 4.4 * s, x + 0.4 * s, y - 2 * s, x + 1.5 * s, y], '#e8642a');
  poly(ctx, [x - 0.8 * s, y, x + 0.1 * s, y - 3 * s, x + 0.9 * s, y], '#f6c33a');
}

/** A small pony for the corral, seen from the same angle as the unit sprites. */
function lkPony(ctx: Ctx, x: number, y: number, s: number, coat: string, patch: string | null, mane: string) {
  const leg = shade(coat, -0.28);
  for (const [lx, ly] of [[-3.6, -0.6], [-1.6, 0.4], [2.4, -0.3], [4, 0.7]] as const) box(ctx, x + lx * s, y + ly * s, 1.3 * s, 4 * s, leg);
  poly(ctx, [x - 5.4 * s, y - 6.4 * s, x - 7.6 * s, y - 1.4 * s, x - 6.4 * s, y - 2 * s], mane); // tail
  box(ctx, x, y - 3.4 * s, 10 * s, 4 * s, coat);
  if (patch) faceQuad(ctx, 'R', x, y - 3.4 * s, 10 * s, 4 * s, 0.3, 0.75, 0.25, 0.9, patch);
  box(ctx, x + 4.4 * s, y - 5.6 * s, 3 * s, 4 * s, coat); // neck
  box(ctx, x + 6.2 * s, y - 8.6 * s, 4 * s, 3 * s, coat); // head
  box(ctx, x + 8.3 * s, y - 8.4 * s, 1.9 * s, 1.8 * s, shade(coat, 0.15));
  poly(ctx, [x + 4 * s, y - 9.8 * s, x + 3 * s, y - 6.4 * s, x + 4.8 * s, y - 7 * s], mane);
}

/** A meat-and-hide drying rack: two A-frames, a rail hung with dark strips of meat, and a hide stretched in a frame. */
function lkRack(ctx: Ctx, x: number, y: number) {
  ellipse(ctx, x, y + 0.6, 8, 3.2, 'rgba(0,0,0,0.16)');
  // the stretched hide, laced into a frame at the back
  const hx = x + 3, hy = y - 1;
  poly(ctx, [hx - 1.2, hy - 12, hx + 5.4, hy - 10.2, hx + 5.4, hy - 1.4, hx - 1.2, hy - 3.2], LK_HIDE);
  poly(ctx, [hx - 1.2, hy - 12, hx + 1.8, hy - 11.2, hx + 1.8, hy - 2.4, hx - 1.2, hy - 3.2], shade(LK_HIDE, 0.1));
  for (const [ax, ay, bx, by] of [[-1.2, -12, 5.4, -10.2], [5.4, -10.2, 5.4, -1.4], [5.4, -1.4, -1.2, -3.2], [-1.2, -3.2, -1.2, -12]] as const) line(ctx, hx + ax, hy + ay, hx + bx, hy + by, LK_POLE, 0.8);
  for (let i = 0; i < 5; i++) { const t = i / 4; line(ctx, hx - 1.2 + t * 6.6, hy - 12 + t * 1.8, hx - 2 + t * 6.6, hy - 12 + t * 1.8 - 0.4, '#efe3c0', 0.3); }
  ellipse(ctx, hx + 2.4, hy - 6.4, 1.4, 1.1, LK_RED); // a painted mark
  // the A-frames and the rail
  for (const fx of [-7.4, 2.2]) {
    line(ctx, x + fx, y + 1.4, x + fx + 2, y - 10, LK_POLE, 1);
    line(ctx, x + fx + 4.2, y + 1.4, x + fx + 2, y - 10, shade(LK_POLE, -0.15), 1);
  }
  line(ctx, x - 5.6, y - 8, x + 4.4, y - 8.6, LK_POLE_L, 0.9);
  for (let i = 0; i < 7; i++) { // strips of drying meat
    const t = i / 6, sx = x - 5 + t * 9, sy = y - 8.2 - t * 0.5;
    poly(ctx, [sx - 0.6, sy, sx + 0.6, sy, sx + 0.4, sy + 4.2 + (i % 3) * 0.8, sx - 0.5, sy + 3.8], i % 2 ? '#8a3a2a' : '#a24a34');
  }
  lkFire(ctx, x - 8.6, y + 3, 0.6);
}

/** A rope-and-pole horse corral with two ponies inside. */
function lkCorral(ctx: Ctx, x: number, y: number) {
  const rx = 9.4, ry = 4.8;
  const post = (a: number) => {
    const px = x + Math.cos(a) * rx, py = y + Math.sin(a) * ry;
    line(ctx, px, py, px, py - 5.2, LK_POLE, 1);
    line(ctx, px - 0.3, py - 0.4, px - 0.3, py - 5, LK_POLE_L, 0.3);
    return [px, py] as const;
  };
  const rail = (a0: number, a1: number) => {
    for (const [h, c] of [[2, LK_POLE_L], [4, LK_POLE]] as const) {
      ctx.strokeStyle = ink(c);
      ctx.lineWidth = 0.55;
      ctx.beginPath();
      ctx.ellipse(x, y - h, rx, ry, 0, a0, a1);
      ctx.stroke();
    }
  };
  ellipse(ctx, x, y + 0.8, rx + 1.4, ry + 1.2, 'rgba(90,64,34,0.28)'); // trampled ground
  rail(Math.PI, Math.PI * 2);
  for (let i = 0; i < 6; i++) post(Math.PI + (i / 5) * Math.PI);
  lkPony(ctx, x - 2.8, y - 0.2, 0.86, '#f2eadb', '#8a5a33', '#3a2418'); // a pinto
  lkPony(ctx, x + 3, y + 1.4, 0.86, '#8a5a33', null, '#2a1a10');
  rail(0, Math.PI);
  for (let i = 1; i < 6; i++) post((i / 6) * Math.PI);
}

/** The buildings of a Plains camp: painted tipis, a drying rack, a horse corral, and a council circle for the capital. */
function lkBuilding(ctx: Ctx, x: number, y: number, big: boolean, capital: boolean) {
  const wisp = (sx: number, sy: number, s: number) => {
    ctx.strokeStyle = 'rgba(200,200,205,0.5)';
    ctx.lineWidth = 1.2 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(sx + 2 * s, sy - 3 * s, sx - 1.6 * s, sy - 5 * s, sx + 1.4 * s, sy - 8.4 * s);
    ctx.stroke();
  };
  if (big && capital) {
    // the council circle: six tipis round an open ground with a fire, log seats and a tall painted standard
    const ring = Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2 + 0.5;
      return { px: x + Math.cos(a) * 15, py: y + 3 + Math.sin(a) * 7.6, i };
    }).sort((a, b) => a.py - b.py);
    const draw = (t: { px: number; py: number; i: number }) => lkTipi(ctx, t.px, t.py, 4.4, 11 + (t.i % 2), [0, 2, 1, 4, 3, 0][t.i]);
    ellipse(ctx, x, y + 3, 12.6, 6.2, 'rgba(120,90,50,0.3)');
    ring.filter((t) => t.py < y + 3).forEach(draw);
    lkFire(ctx, x, y + 3.6, 0.9);
    for (const [lx, ly, ang] of [[-6.6, 1.2, 0], [6.4, 1, 0], [-3, 8, 0]] as const) { // log seats
      ellipse(ctx, x + lx, y + 3 + ly - 0.4, 2.6, 1.1, '#7a5230');
      ellipse(ctx, x + lx - 0.6, y + 3 + ly - 0.6, 1.4, 0.55, '#b98e58');
      void ang;
    }
    line(ctx, x - 1, y + 2.6, x - 1, y - 19, LK_POLE, 1.3); // the standard
    line(ctx, x - 1.4, y + 2, x - 1.4, y - 18, LK_POLE_L, 0.4);
    for (const [dy, c] of [[-8, LK_RED], [-11, LK_WHITE], [-14, LK_BLUE]] as const) line(ctx, x - 1, y + dy, x + 1.8, y + dy + 0.2, c, 1);
    for (const [fx, fy, c] of [[-2.4, -17, LK_WHITE], [-3.2, -14.6, '#1c1614'], [-2.6, -12.4, LK_WHITE]] as const) poly(ctx, [x - 1, fy, x + fx, fy + 4.4, x + fx + 1.2, fy + 4.2], c); // eagle feathers hanging from it
    ring.filter((t) => t.py >= y + 3).forEach(draw);
    wisp(x - 12, y - 8, 0.8);
    return;
  }
  if (big) {
    // a great painted tipi with a second beside it, poles crossed high, and the cook fire
    lkTipi(ctx, x + 7, y - 2, 4.4, 10.4, 2);
    lkFire(ctx, x + 10.2, y + 3, 0.6);
    lkTipi(ctx, x - 1, y + 1, 7.4, 17.5, 4);
    wisp(x - 2.6, y - 16, 0.9);
    return;
  }
  const spot: Record<string, number> = { '-10,2': 0, '10,2': 2, '0,8': 1, '-6,-8': 3, '7,-7': 0, '-14,-3': 2, '14,-2': 1 };
  const v = spot[`${Math.round(x)},${Math.round(y)}`] ?? ((Math.round(x) * 7 + Math.round(y) * 3) % 4 + 4) % 4;
  if (v === 0) { lkTipi(ctx, x, y, 5.2, 12.6, 0); wisp(x - 1, y - 11.4, 0.6); }
  else if (v === 1) {
    lkTipi(ctx, x, y, 5.2, 12.6, 1);
    for (const s of [-1, 1]) line(ctx, x + s * 6.4, y + 3.4, x + s * 5.4, y - 2, LK_POLE, 0.7); // a tripod for a backrest and a bag
    line(ctx, x + 6.4, y + 3.4, x + 5.2, y - 2, LK_POLE, 0.7);
    poly(ctx, [x - 8.6, y + 3, x - 6.4, y + 2.4, x - 6, y + 4.6, x - 8.4, y + 5], LK_HIDE); // a parfleche resting beside the door
    poly(ctx, [x - 8.6, y + 3, x - 7.4, y + 2.8, x - 7.2, y + 4.8, x - 8.4, y + 5], LK_RED);
  } else if (v === 2) lkRack(ctx, x, y);
  else lkCorral(ctx, x, y);
}

function drawTree(ctx: Ctx, biome: TribeId, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  ellipse(ctx, x + 1.5, y, 4.5 * k, 1.8 * k, 'rgba(0,0,0,0.16)');
  if (biome === 'persia') return drawPersianTree(ctx, x, y, k, P, variant);
  if (biome === 'ottoman') return drawOttomanTree(ctx, x, y, k, P, variant);
  if (biome === 'india') return indianTree(ctx, x, y, k, P, variant);
  if (biome === 'inuit') return drawTundraTree(ctx, x, y, k, P, variant);
  if (biome === 'inca') return incaTree(ctx, x, y, k, P, variant);
  if (biome === 'aboriginal') return aboriginalTree(ctx, x, y, k, P, variant);
  if (biome === 'lakota') return lkTree(ctx, x, y, k, P, variant);
  if (biome === 'celts') return drawCeltTree(ctx, x, y, k, P, variant);
  if (biome === 'china') return drawChinaTree(ctx, x, y, k, P, variant);
  if (biome === 'mali') return mlTree(ctx, x, y, k, P, variant);
  if (biome === 'polynesia') {
    if (variant % 2 === 0) {
      // ponga, the silver tree fern: a straight scaly trunk, a skirt of dead fronds and a crown of long drooping ones
      line(ctx, x, y, x + 0.4 * k, y - 15 * k, P.trunk, 2.4 * k);
      line(ctx, x - 0.6 * k, y, x - 0.2 * k, y - 15 * k, shade(P.trunk, 0.3), 0.7 * k);
      for (let i = 0; i < 4; i++) line(ctx, x - 1.4 * k, y - (3 + i * 3) * k, x + 1.6 * k, y - (2.4 + i * 3) * k, shade(P.trunk, -0.35), 0.5 * k);
      const cx = x + 0.4 * k, cy = y - 15.5 * k;
      for (const dx of [-1, 1]) poly(ctx, [cx, cy + 1 * k, cx + dx * 5 * k, cy + 7 * k, cx + dx * 3 * k, cy + 3 * k], '#8a6a3a'); // dead fronds
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + (i - 3.5) * 0.44;
        const ex = cx + Math.cos(a) * 11 * k, ey = cy + Math.sin(a) * 5 * k + 5 * k;
        poly(ctx, [cx, cy - 1, ex, ey, cx + Math.cos(a) * 4 * k, cy + 2 * k], i % 2 ? P.forest : shade(P.forest, 0.25));
        line(ctx, cx, cy, ex, ey, shade(P.forest, -0.3), 0.4 * k);
      }
    } else {
      // tī kōuka, the cabbage tree: a thick trunk that forks into spiky tufts
      line(ctx, x, y, x + 0.5 * k, y - 8 * k, P.trunk, 3.4 * k);
      for (const [dx, dy] of [[-4, -13], [0.6, -16], [5, -12]] as const) {
        line(ctx, x + 0.5 * k, y - 7 * k, x + dx * k, y + dy * k + 3 * k, P.trunk, 1.6 * k);
        for (let i = 0; i < 7; i++) {
          const a = -Math.PI / 2 + (i - 3) * 0.5;
          poly(ctx, [x + dx * k, y + dy * k + 3 * k, x + dx * k + Math.cos(a) * 6.5 * k, y + dy * k + 3 * k + Math.sin(a) * 6.5 * k, x + dx * k + Math.cos(a + 0.22) * 2 * k, y + dy * k + 3 * k + Math.sin(a + 0.22) * 2 * k], i % 2 ? shade(P.forest, 0.2) : P.forest);
        }
      }
    }
    return;
  }
  if (biome === 'egypt') {
    // palm: curved trunk and a star of fronds
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
    return;
  }
  const cone = (bx: number, by: number, h: number, w: number, col: string) => {
    poly(ctx, [bx, by - h, bx - w / 2, by - 1, bx, by + w * 0.18], shade(col, 0.12));
    poly(ctx, [bx, by - h, bx + w / 2, by - 1, bx, by + w * 0.18], shade(col, -0.2));
  };
  const canopy = (top: number, r: number, flat: number, col: string) => {
    const pts: number[] = [];
    for (let i = 0; i < 8; i++) pts.push(x + Math.cos((i / 8) * Math.PI * 2) * r, top + Math.sin((i / 8) * Math.PI * 2) * r * flat);
    poly(ctx, pts, shade(col, -0.12));
    poly(ctx, [x, top - r * flat, x - r, top, x - r * 0.7, top + r * flat * 0.66, x, top + r * flat * 0.27], shade(col, 0.12));
  };
  const trunk = (h: number, w = 2.2) => {
    ctx.fillStyle = P.trunk;
    ctx.fillRect(x - (w / 2) * k, y - h * k, w * k, h * k);
  };
  if (biome === 'japan') {
    // cherry blossom: dark crooked trunk under a cloud of pink petals
    trunk(10, 2);
    line(ctx, x, y - 8 * k, x + 4 * k, y - 12 * k, P.trunk, 1.4 * k);
    canopy(y - 14 * k, 7 * k, 0.72, P.forest);
    for (let i = 0; i < 4; i++) ellipse(ctx, x + (rand(variant + 3, i) - 0.5) * 10 * k, y - 14 * k + (rand(variant + 5, i) - 0.5) * 7 * k, 1.3 * k, 1.1 * k, '#fff0f5');
    return;
  }
  if (biome === 'ethiopia') {
    if (variant % 3 === 0) {
      // flat-topped acacia: a slim trunk forking under a broad layered umbrella
      line(ctx, x, y, x + 0.4 * k, y - 9 * k, P.trunk, 1.8 * k);
      line(ctx, x + 0.4 * k, y - 8 * k, x + 5.4 * k, y - 13.4 * k, P.trunk, 1.3 * k);
      line(ctx, x + 0.4 * k, y - 8.6 * k, x - 5 * k, y - 13.6 * k, P.trunk, 1.3 * k);
      line(ctx, x + 0.4 * k, y - 9 * k, x + 0.6 * k, y - 14 * k, P.trunk, 1.2 * k);
      for (const [dx, dy, r, c] of [[-4.6, -14.6, 6.2, -0.2], [4.8, -14.2, 6.4, -0.14], [0.4, -16.2, 7.6, -0.08]] as const) {
        ellipse(ctx, x + dx * k, y + dy * k + 1 * k, r * k, r * 0.34 * k, shade(P.forest, c - 0.2)); // shaded underside
        ellipse(ctx, x + dx * k, y + dy * k, r * k, r * 0.3 * k, shade(P.forest, c));
        ellipse(ctx, x + (dx - 0.8) * k, y + (dy - 0.8) * k, r * 0.7 * k, r * 0.16 * k, shade(P.forest, c + 0.24)); // sunlit top
      }
      return;
    }
    if (variant % 3 === 1) {
      // juniper (African pencil cedar): a straight red-brown trunk and drooping dark tiers
      ctx.fillStyle = shade(P.trunk, 0.1);
      ctx.fillRect(x - 1 * k, y - 5 * k, 2 * k, 5 * k);
      const jc = shade(P.forest, -0.42);
      for (let i = 0; i < 5; i++) {
        const by = y - 3 * k - i * 4.6 * k, w = (9.6 - i * 1.7) * k;
        poly(ctx, [x, by - 6.4 * k, x - w / 2, by, x - w * 0.15, by + 1.2 * k, x, by + 0.4 * k], shade(jc, 0.14 + i * 0.03));
        poly(ctx, [x, by - 6.4 * k, x + w / 2, by, x + w * 0.15, by + 1.2 * k, x, by + 0.4 * k], shade(jc, -0.16));
      }
      poly(ctx, [x, y - 27 * k, x - 1 * k, y - 22 * k, x + 1 * k, y - 22 * k], shade(jc, 0.2));
      return;
    }
    // candelabra euphorbia: a squat trunk and ribbed, upturned green arms
    line(ctx, x, y, x, y - 6 * k, shade(P.trunk, 0.05), 2.6 * k);
    const ec = '#5c9a62';
    for (const [dx, tx, ty, w] of [[-1, -7, -15, 2.6], [1, 7, -15.6, 2.6], [-0.4, -3, -21, 2.8], [0.4, 3.4, -22, 2.8], [0, 0.4, -24, 3.2]] as const) {
      ctx.strokeStyle = shade(ec, -0.22);
      ctx.lineWidth = w * k;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x + dx * k, y - 5 * k); ctx.quadraticCurveTo(x + tx * 0.9 * k, y - 8.6 * k, x + tx * k, y + ty * k); ctx.stroke();
      ctx.strokeStyle = ec;
      ctx.lineWidth = w * 0.62 * k;
      ctx.beginPath(); ctx.moveTo(x + dx * k - 0.3 * k, y - 5.2 * k); ctx.quadraticCurveTo(x + tx * 0.9 * k - 0.3 * k, y - 8.8 * k, x + tx * k - 0.3 * k, y + ty * k); ctx.stroke();
      ctx.strokeStyle = shade(ec, 0.35);
      ctx.lineWidth = 0.5 * k;
      ctx.beginPath(); ctx.moveTo(x + dx * k - 0.8 * k, y - 5.4 * k); ctx.quadraticCurveTo(x + tx * 0.9 * k - 0.8 * k, y - 9 * k, x + tx * k - 0.8 * k, y + ty * k); ctx.stroke(); // a lit rib
      ellipse(ctx, x + tx * k, y + ty * k - 0.6 * k, 1 * k, 0.8 * k, '#d8c84a'); // a yellow flower cap
    }
    return;
  }
  if (biome === 'zulu') {
    // acacia: slim forked trunk and a flat, wide crown
    line(ctx, x, y, x - 1 * k, y - 10 * k, P.trunk, 1.8 * k);
    line(ctx, x - 1 * k, y - 8 * k, x + 4 * k, y - 13 * k, P.trunk, 1.4 * k);
    line(ctx, x - 1 * k, y - 10 * k, x - 4 * k, y - 13 * k, P.trunk, 1.4 * k);
    canopy(y - 15 * k, 10 * k, 0.28, P.forest);
    return;
  }
  if (biome === 'greeks' || biome === 'mongols') {
    if (biome === 'greeks' && variant % 2 === 0) {
      // slim cypress
      trunk(3, 1.6);
      poly(ctx, [x, y - 26 * k, x - 3.6 * k, y - 8 * k, x, y - 1.5 * k], shade('#3f6a34', 0.1));
      poly(ctx, [x, y - 26 * k, x + 3.6 * k, y - 8 * k, x, y - 1.5 * k], shade('#3f6a34', -0.2));
      return;
    }
    // olive or steppe tree: short trunk, round crown
    trunk(biome === 'greeks' ? 7 : 6, 2.4);
    canopy(y - 11 * k, 6.5 * k, 0.7, P.forest);
    if (biome === 'greeks') for (let i = 0; i < 3; i++) ellipse(ctx, x + (i - 1) * 3.4 * k, y - 10 * k + (i % 2) * 2 * k, 0.9 * k, 0.9 * k, '#3a3a2a');
    return;
  }
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
  ctx.fillStyle = P.trunk;
  ctx.fillRect(x - 1 * k, y - 4 * k, 2 * k, 4 * k);
  if (biome === 'pirates' || biome === 'vikings') {
    for (let i = 0; i < 3; i++) cone(x, y - 3 * k - i * 6 * k, 11 * k, (11 - i * 2.5) * k, P.forest);
    if (biome === 'vikings') {
      // snow resting on the upper boughs
      poly(ctx, [x, y - 26 * k, x - 3 * k, y - 20 * k, x, y - 19 * k, x + 3 * k, y - 20.5 * k], '#ffffff');
      poly(ctx, [x - 5 * k, y - 10 * k, x - 1 * k, y - 11.5 * k, x - 2 * k, y - 9.5 * k], '#f2f6fb');
    }
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

const FRUIT: Record<TribeId, string> = {
  egypt: '#8e3f1c', aztec: '#f29a2e', polynesia: '#f2c53a', rome: '#e2324a', pirates: '#78c43e',
  vikings: '#3a4fb8', japan: '#f28a2e', mongols: '#d23a3a', greeks: '#5a3a6a', zulu: '#f2b33a',
  persia: '#d7443a', celts: '#7a2a5a', inuit: '#e85a6a', inca: '#f2c53a', ethiopia: '#b8324a', aboriginal: '#7a2a4a',
  china: '#e8423a', india: '#e8a02a', mali: '#f2b33a', lakota: '#8a2a4a', ottoman: '#c8244a',
  maya: '#f2b33a', korea: '#e8423a', khmer: '#f28a2a', swahili: '#e8423a', tibet: '#d8402a',
};

/** A round, softly lit fruit with a stalk and a leaf. */
function drawFruit(ctx: Ctx, x: number, y: number, col: string) {
  softShadow(ctx, x + 1, y + 0.5, 6, 2.4, 0.28);
  const r = 5;
  const cy = y - r;
  const g = ctx.createRadialGradient(x - r * 0.35, cy - r * 0.4, r * 0.15, x, cy, r * 1.05);
  g.addColorStop(0, shade(col, 0.45));
  g.addColorStop(0.55, col);
  g.addColorStop(1, shade(col, -0.3));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ellipse(ctx, x - 1.8, cy - 2.2, 1.4, 0.9, 'rgba(255,255,255,0.55)');
  ctx.strokeStyle = '#5a3b1e';
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, cy - r + 0.5);
  ctx.lineTo(x + 0.6, cy - r - 2.5);
  ctx.stroke();
  poly(ctx, [x + 0.6, cy - r - 2, x + 5.5, cy - r - 4.5, x + 2.4, cy - r - 0.6], '#3fae3a');
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

// ---------------------------------------------------------------- Inuit dwellings and scrub


/** A snow-block dome (igloo): two lit-and-shaded halves, staggered courses of blocks, an ice window and a tunnel entrance. */
function drawIgloo(ctx: Ctx, x: number, y: number, r: number, snow: string, tunnel: boolean, window = true) {
  const hgt = r * 0.95, fl = r * 0.46;
  ellipse(ctx, x + 1.5, y + 1.2, r * 1.08, fl * 1.05, 'rgba(60,90,120,0.22)');
  ellipse(ctx, x, y, r, fl, shade(snow, -0.2)); // the trampled base ring
  ctx.beginPath(); // lit left half of the dome
  ctx.moveTo(x, y);
  ctx.lineTo(x - r, y);
  ctx.ellipse(x, y, r, hgt, 0, Math.PI, Math.PI * 1.5);
  ctx.closePath();
  ctx.fillStyle = ink(shade(snow, 0.02));
  ctx.fill();
  ctx.beginPath(); // shaded right half
  ctx.moveTo(x, y);
  ctx.lineTo(x + r, y);
  ctx.ellipse(x, y, r, hgt, 0, 0, -Math.PI / 2, true);
  ctx.closePath();
  ctx.fillStyle = ink(shade(snow, -0.16));
  ctx.fill();
  ctx.beginPath(); // the front lip that rounds the base
  ctx.ellipse(x, y, r, fl, 0, 0, Math.PI);
  ctx.fillStyle = ink(shade(snow, -0.05));
  ctx.fill();
  if (tunnel) {
    // a low barrel-vaulted entrance tunnel poking out front and to the right
    const tx = x + r * 0.62, ty = y + fl * 0.86, tr = r * 0.44;
    ctx.beginPath();
    ctx.moveTo(tx - tr, ty);
    ctx.lineTo(tx - tr * 0.9, ty - tr * 0.2);
    ctx.ellipse(tx, ty - tr * 0.2, tr * 0.9, tr * 0.9, 0, Math.PI, 0);
    ctx.lineTo(tx + tr, ty);
    ctx.closePath();
    ctx.fillStyle = ink(shade(snow, -0.06));
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + tr, ty);
    ctx.lineTo(tx + tr * 0.9, ty - tr * 0.2);
    ctx.ellipse(tx, ty - tr * 0.2, tr * 0.9, tr * 0.9, 0, 0, -Math.PI / 2, true);
    ctx.closePath();
    ctx.fillStyle = ink(shade(snow, -0.2));
    ctx.fill();
    ellipse(ctx, tx, ty, tr, tr * 0.5, shade(snow, -0.12));
    ellipse(ctx, tx, ty - tr * 0.1, tr * 0.6, tr * 0.62, '#1b2632'); // the doorway
    ellipse(ctx, tx, ty + tr * 0.1, tr * 0.6, tr * 0.28, '#3a4a5a');
  }
  // courses of snow blocks, each row offset from the last
  ctx.strokeStyle = ink('#aec4d6');
  ctx.lineWidth = 0.55;
  const rows = r > 7 ? 4 : 3;
  for (let j = 0; j < rows; j++) {
    const t0 = j / (rows + 0.6), t1 = (j + 1) / (rows + 0.6);
    const w0 = r * Math.sqrt(1 - t0 * t0), w1 = r * Math.sqrt(1 - t1 * t1);
    const y0 = y - t0 * hgt, y1 = y - t1 * hgt;
    ctx.beginPath();
    ctx.ellipse(x, y1, w1, w1 * 0.46, 0, 0.04 * Math.PI, 0.96 * Math.PI);
    ctx.stroke();
    const n = 4 + (r > 7 ? 1 : 0) - j;
    if (n < 1) continue;
    for (let m = 0; m <= n; m++) {
      const a = Math.PI * ((m + (j % 2 ? 0.5 : 0)) / n);
      if (a > Math.PI || a < 0.02) continue;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * w0, y0 + Math.sin(a) * w0 * 0.46);
      ctx.lineTo(x + Math.cos(a) * w1, y1 + Math.sin(a) * w1 * 0.46);
      ctx.stroke();
    }
  }
  poly(ctx, [x - r * 0.24, y - hgt + 0.4, x + r * 0.05, y - hgt - 1.4, x + r * 0.26, y - hgt + 0.6, x, y - hgt + r * 0.14], shade(snow, 0.1)); // the capstone
  ellipse(ctx, x - r * 0.5, y - hgt * 0.42, r * 0.34, r * 0.16, shade(snow, 0.16)); // sunlit sheen
  if (window) {
    ellipse(ctx, x - r * 0.42, y - hgt * 0.56, r * 0.2, r * 0.22, '#7fbfe0'); // an ice-slab window glowing from the lamp within
    ellipse(ctx, x - r * 0.46, y - hgt * 0.62, r * 0.08, r * 0.09, '#eafaff');
    ctx.strokeStyle = ink('#8eaac0');
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.ellipse(x - r * 0.42, y - hgt * 0.56, r * 0.2, r * 0.22, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** An inuksuk: stacked stones in the shape of a person, with a long arm-slab. */
function drawInuksuk(ctx: Ctx, x: number, y: number, s: number) {
  ellipse(ctx, x + 0.6 * s, y + 0.6 * s, 4.6 * s, 1.6 * s, 'rgba(50,80,110,0.2)');
  box(ctx, x - 1.8 * s, y, 3 * s, 2.8 * s, '#8b98a3');
  box(ctx, x + 1.8 * s, y + 0.2 * s, 3 * s, 2.4 * s, '#a3afb9');
  box(ctx, x, y - 2.6 * s, 3.4 * s, 3.2 * s, '#7d8b96');
  box(ctx, x, y - 5.6 * s, 3 * s, 3 * s, '#9aa7b2');
  box(ctx, x, y - 8.2 * s, 8.4 * s, 2 * s, '#8b98a3'); // the arms
  box(ctx, x + 0.2 * s, y - 10.4 * s, 2.4 * s, 2.4 * s, '#a9b5bf'); // the head-stone
  poly(ctx, [x - 2.6 * s, y - 12.4 * s, x + 0.6 * s, y - 13.4 * s, x + 1.4 * s, y - 12 * s], '#ffffff'); // a cap of snow
}

/** A turf-and-snow qarmaq with a whale-rib doorway and a hide door flap. */
function drawSodHouse(ctx: Ctx, x: number, y: number, w: number, snow: string) {
  ellipse(ctx, x + 1.5, y + 1.2, w * 0.66, w * 0.3, 'rgba(60,90,120,0.2)');
  box(ctx, x, y, w, 3.6, '#6b5a40', '#7c8a52'); // turf walls with a moss top
  // the roof: a low turf mound, thick snow on top
  const rh = 6;
  poly(ctx, [x - w / 2, y - 3.6, x, y - 3.6 + w / 4, x, y - 3.6 - rh], shade('#7c8a52', 0.02));
  poly(ctx, [x + w / 2, y - 3.6, x, y - 3.6 + w / 4, x, y - 3.6 - rh], shade('#7c8a52', -0.22));
  poly(ctx, [x - w / 2 + 1, y - 3.6 - 0.6, x, y - 3.6 - rh, x + 0.4, y - 3.6 - rh + 1.6, x - w * 0.16, y - 3.6 - rh * 0.4], snow);
  poly(ctx, [x + w / 2 - 1, y - 3.6 - 0.6, x, y - 3.6 - rh, x, y - 3.6 - rh + 1.8, x + w * 0.26, y - 3.6 - rh * 0.34], shade(snow, -0.14));
  for (const [dx, dy] of [[-3, -3.4], [1.6, -2.6], [4, -1.2]] as const) line(ctx, x + dx, y + dy, x + dx - 1.6, y + dy - 3, '#e8e0c8', 0.9); // rafter ribs sticking out through the roof
  // the doorway: a rib arch with a dark opening and a red-banded hide flap
  ellipse(ctx, x + w * 0.3, y + w * 0.02, 2.2, 2.4, '#1b2632');
  ctx.strokeStyle = ink('#efe8d2');
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.3, y + w * 0.02, 2.5, 2.9, 0, Math.PI, 0);
  ctx.stroke();
  poly(ctx, [x + w * 0.3 - 3, y + 1.6, x + w * 0.3 + 3, y + 2.2, x + w * 0.3 + 2.4, y + 3.6, x + w * 0.3 - 2.6, y + 3.4], '#a48a68');
  line(ctx, x + w * 0.3 - 2.8, y + 2.2, x + w * 0.3 + 2.8, y + 2.6, '#c8372d', 0.7);
}

/** A skin tent (tupiq) of pale hide on crossed poles, with a rack of drying fish beside it. */
function drawSkinTent(ctx: Ctx, x: number, y: number, r: number, snow: string) {
  ellipse(ctx, x + 1.4, y + 1, r * 1.1, r * 0.5, 'rgba(60,90,120,0.2)');
  const top = y - r * 1.35;
  poly(ctx, [x - r, y, x, y + r * 0.45, x + 0.4, top], '#d8ccb0');
  poly(ctx, [x + r, y, x, y + r * 0.45, x + 0.4, top], '#a99c7e');
  poly(ctx, [x - r, y, x - r * 0.4, y + r * 0.34, x + 0.4, top], '#e5dcc4'); // lit skin panel
  line(ctx, x - r * 0.5, y + r * 0.2, x + 0.4, top, '#8a7c62', 0.6); // seams
  line(ctx, x + r * 0.5, y + r * 0.2, x + 0.4, top, '#7a6c54', 0.6);
  line(ctx, x - r * 0.9, y - r * 0.44, x + r * 0.9, y - r * 0.44, '#c8372d', 0.9); // a painted band
  for (const s of [-1, 1]) line(ctx, x + 0.4 + s * 0.4, top - 0.4, x + 0.4 + s * 3.2, top - 5, '#8a6a44', 1.1); // pole tips crossing at the apex
  poly(ctx, [x - 1.6, y + r * 0.44, x + 1, y + r * 0.46, x + 1.6, y - r * 0.24, x - 0.4, y - r * 0.34], '#2a3846'); // the door flap, tied back
  poly(ctx, [x - r * 0.9, y - r * 0.1, x - r * 0.6, y + r * 0.2, x - r * 0.3, y - r * 0.1], snow); // snow drift
  // the drying rack: two poles under a rail, hung with split fish
  const rx = x + r * 1.5, ry = y + 2.6;
  for (const s of [-1, 1]) line(ctx, rx + s * 4.6, ry, rx + s * 3, ry - 7.4, '#7a5a3a', 1.1);
  line(ctx, rx - 4.6, ry - 6.8, rx + 4.4, ry - 7.6, '#8a6a44', 1.2);
  for (const [fx, c] of [[-3, '#e8845a'], [-0.6, '#b9c8d4'], [1.8, '#e8845a'], [3.6, '#b9c8d4']] as const) {
    line(ctx, rx + fx, ry - 7.2, rx + fx, ry - 6, '#5a4632', 0.5);
    poly(ctx, [rx + fx, ry - 6.2, rx + fx - 1, ry - 3.6, rx + fx, ry - 1.4, rx + fx + 1, ry - 3.6], c);
    poly(ctx, [rx + fx, ry - 1.4, rx + fx - 0.9, ry - 0.4, rx + fx + 0.9, ry - 0.4], shade(c, -0.2));
  }
}

/** A whale-rib arch: two great ribs leaning together, lashed at the top with sinew. */
function drawBoneArch(ctx: Ctx, x: number, y: number, s: number) {
  for (const [c, w, o] of [['#b8ad90', 2.4, 0], ['#efe8d2', 1.5, -0.5]] as const) {
    ctx.strokeStyle = ink(c);
    ctx.lineWidth = w * s;
    ctx.lineCap = 'round';
    for (const d of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + d * 6 * s + o, y);
      ctx.quadraticCurveTo(x + d * 5.6 * s + o, y - 13 * s, x + d * 0.6 * s + o, y - 15 * s);
      ctx.stroke();
    }
  }
  ellipse(ctx, x, y - 14.6 * s, 1.5 * s, 1.1 * s, '#c8372d'); // sinew lashing
  ellipse(ctx, x - 6 * s, y + 0.4 * s, 1.5 * s, 0.8 * s, '#a89e82');
  ellipse(ctx, x + 6 * s, y + 0.4 * s, 1.5 * s, 0.8 * s, '#a89e82');
}

/** Sparse subarctic scrub: stunted black spruce, willow thickets and dwarf birch, snow clinging to them. */
function drawTundraTree(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  const kind = variant % 3;
  if (kind === 0) {
    // a stunted black spruce: a thin, slightly leaning trunk under ragged tiers with snow on their upper sides
    const lean = ((variant % 4) - 1.5) * 0.35 * k;
    line(ctx, x, y, x + lean, y - 6 * k, P.trunk, 1.8 * k);
    for (let i = 0; i < 4; i++) {
      const by = y - (2.4 + i * 3.7) * k, hw = (5.4 - i * 1.15) * k, th = 5.6 * k, cx = x + lean * (0.4 + i * 0.25);
      poly(ctx, [cx, by - th, cx - hw, by, cx - hw * 0.5, by - 0.8 * k, cx - hw * 0.3, by + 0.9 * k, cx, by + 0.4 * k], shade(P.forest, 0.1));
      poly(ctx, [cx, by - th, cx + hw, by, cx + hw * 0.55, by - 0.6 * k, cx + hw * 0.25, by + 1.1 * k, cx, by + 0.4 * k], shade(P.forest, -0.26));
      poly(ctx, [cx, by - th, cx - hw * 0.62, by - th * 0.4, cx - hw * 0.1, by - th * 0.5, cx + hw * 0.4, by - th * 0.34], '#ffffff'); // snow on the boughs
    }
    const tx = x + lean * 1.25, ty = y - 17.4 * k;
    poly(ctx, [tx, ty - 2.6 * k, tx - 0.9 * k, ty + 0.4 * k, tx + 0.9 * k, ty + 0.4 * k], shade(P.forest, -0.1));
    return;
  }
  if (kind === 1) {
    // willow scrub: a thicket of thin red-brown stems, bare but for a few grey-green leaves and clumps of snow
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.3;
      const len = (8.4 - Math.abs(i - 3) * 0.9) * k;
      const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len * 1.05;
      line(ctx, x + (i - 3) * 0.3 * k, y, ex, ey, i % 2 ? '#8a4a3a' : '#6a3a2e', 0.85 * k);
      line(ctx, (x + ex) / 2, (y + ey) / 2, ex + (i % 2 ? 2.4 : -2.4) * k, ey + 1.6 * k, '#8a4a3a', 0.5 * k);
      for (const t of [0.5, 0.8, 1]) ellipse(ctx, x + (ex - x) * t + (i - 3) * 0.2 * k, y + (ey - y) * t, 0.9 * k, 0.6 * k, i % 2 ? '#9db08a' : '#b8c49c');
    }
    ellipse(ctx, x, y - 0.4 * k, 4.4 * k, 1.4 * k, '#f7fbfd');
    ellipse(ctx, x - 2.4 * k, y - 5.4 * k, 1.6 * k, 0.8 * k, '#ffffff');
    return;
  }
  // dwarf birch: a low, knee-high thicket of coppery leaves on pale stems, snow lying in its crown
  for (const dx of [-3, -1, 1.4, 3.2]) line(ctx, x + dx * k, y, x + dx * 1.3 * k, y - 2.6 * k, '#d8d0c0', 0.8 * k);
  ellipse(ctx, x + 3 * k, y - 3.2 * k, 3 * k, 2.2 * k, '#8e4f24');
  ellipse(ctx, x - 3 * k, y - 3.4 * k, 3.2 * k, 2.4 * k, '#a8622c');
  ellipse(ctx, x, y - 4.8 * k, 4 * k, 2.8 * k, '#c8843a');
  ellipse(ctx, x - 1.2 * k, y - 5.6 * k, 2.4 * k, 1.5 * k, '#dea04a');
  for (const [dx, dy] of [[-3.6, -3.4], [1.4, -5.6], [3.6, -3], [-0.8, -3], [-1.8, -6]] as const) ellipse(ctx, x + dx * k, y + dy * k, 0.8 * k, 0.7 * k, '#e9b95e');
  ellipse(ctx, x + 0.4 * k, y - 7 * k, 2.4 * k, 0.8 * k, '#ffffff');
  ellipse(ctx, x - 3.4 * k, y - 0.4 * k, 2.6 * k, 0.8 * k, '#f7fbfd');
}

function drawBuilding(ctx: Ctx, tribe: TribeId, x: number, y: number, big: boolean, roofC: string, color: string, capital: boolean) {
  const w = big ? 16 : 11;
  const h = big ? (tribe === 'ethiopia' ? 19 : 13) : 8;
  switch (tribe) {
    case 'inuit': {
      if (big) {
        // the great snow house: a tall dome with a tunnel, a smaller dome joined behind it, an inuksuk and a smoke-hole plume
        drawIgloo(ctx, x + 5, y - 3.4, 5.4, roofC, false, false);
        drawIgloo(ctx, x, y, 9.4, roofC, true);
        drawInuksuk(ctx, x - 12, y + 1.6, 0.85);
        line(ctx, x + 1, y - 9.6, x + 1.4, y - 13, 'rgba(120,140,160,0.35)', 1.4); // lamp smoke
        ellipse(ctx, x + 1.8, y - 14, 1.6, 1.2, 'rgba(150,165,180,0.28)');
      } else {
        const v = Math.abs(Math.round(x * 3 + y)) % 3;
        if (v === 0) drawIgloo(ctx, x, y, 6.6, roofC, true);
        else if (v === 1) { drawSodHouse(ctx, x, y, 11, roofC); drawBoneArch(ctx, x + 6, y + 3.4, 0.5); }
        else drawSkinTent(ctx, x - 2, y, 6, roofC);
      }
      break;
    }
    case 'inca':
      incaBuilding(ctx, x, y, big, roofC, w, h);
      break;
    case 'aboriginal':
      aboriginalBuilding(ctx, x, y, big, roofC);
      break;
    case 'lakota':
      lkBuilding(ctx, x, y, big, capital);
      break;
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
    case 'polynesia': {
      // a whare: carved timber walls under a steep thatched roof, red carved barge-boards and a tekoteko at the apex
      const rh = big ? 13 : 9;
      box(ctx, x, y, w, h - 2, '#7a5230');
      for (const v of [0.35, 0.7]) ctx.fillStyle = '#5a3a1e', ctx.fillRect(x - w / 2, y - (h - 2) * v, w, 0.8);
      roof(ctx, x, y - h + 2, w + 5, rh, '#c9a45a');
      const ay = y - h + 2 - rh, ex = (w + 5) / 2, ey = y - h + 2;
      line(ctx, x, ay, x - ex, ey, '#b3302a', 1.4);
      line(ctx, x, ay, x + ex, ey, '#8f2222', 1.4);
      for (const t of [0.35, 0.65]) { ellipse(ctx, x - ex * t, ay + (ey - ay) * t, 0.9, 0.9, '#f4efe0'); ellipse(ctx, x + ex * t, ay + (ey - ay) * t, 0.9, 0.9, '#f4efe0'); }
      ellipse(ctx, x, ay - 1.6, 1.3, 1.4, '#a5673a'); // tekoteko
      line(ctx, x - 1.6, ay - 0.4, x + 1.6, ay - 0.4, '#a5673a', 0.9);
      if (big) {
        for (const ox of [-w * 0.38, w * 0.38]) box(ctx, x + ox, y + 1, 1.6, h - 1, '#5a3a1e'); // verandah posts
        ellipse(ctx, x, y - 1.6, 2.2, 3, '#2a1a10'); // the doorway
        line(ctx, x - 2.6, y - 4.6, x + 2.6, y - 4.6, '#b3302a', 1.2);
      }
      break;
    }
    case 'rome':
      box(ctx, x, y, w, h, '#f7f4ee');
      roof(ctx, x, y - h, w + 2, 6, roofC);
      if (big) for (const ox of [-5, 0, 5]) { ctx.fillStyle = '#dcd6c8'; ctx.fillRect(x + ox - 0.8, y - h + 3, 1.6, h - 2); }
      break;
    case 'pirates':
      box(ctx, x, y, w, h, '#8a6440');
      roof(ctx, x, y - h, w + 2, 6, roofC);
      break;
    case 'vikings':
      // timber longhouse under a steep turf-dark roof, crossed gable beams on the great hall
      box(ctx, x, y, w + 2, h - 1, '#8a5a33');
      for (const ox of [-0.3, 0.05, 0.4]) { ctx.fillStyle = '#5a3a1e'; ctx.fillRect(x + ox * w - 0.6, y - h + 2, 1.2, h - 2); }
      roof(ctx, x, y - h + 1, w + 5, big ? 12 : 9, roofC);
      if (big) {
        line(ctx, x - 3, y - h - 14, x + 1, y - h - 9, '#5a3a1e', 1.4);
        line(ctx, x + 5, y - h - 14, x + 1, y - h - 9, '#5a3a1e', 1.4);
      }
      break;
    case 'japan':
      box(ctx, x, y, w, h, '#f4f1ea');
      ctx.fillStyle = '#6a4a32';
      ctx.fillRect(x - w / 2 + 1, y - h * 0.45, w - 2, 1.2);
      roof(ctx, x, y - h, w + 6, 5, roofC);
      if (big) {
        // pagoda: two more shrinking tiers
        box(ctx, x, y - h - 3, w - 5, 5, '#f4f1ea');
        roof(ctx, x, y - h - 8, w + 1, 4.5, roofC);
        box(ctx, x, y - h - 11, w - 9, 4, '#f4f1ea');
        roof(ctx, x, y - h - 15, w - 3, 4, roofC);
        line(ctx, x, y - h - 18, x, y - h - 25, '#c9974a', 1.2);
      }
      break;
    case 'mongols': {
      // round felt yurts with a coloured band and a smoke-hole crown
      const r = big ? 9 : 6.5;
      ellipse(ctx, x, y, r, r * 0.5, '#d8d0bc');
      ctx.fillStyle = '#f2ecde';
      ctx.fillRect(x - r, y - h * 0.8, r * 2, h * 0.8);
      ellipse(ctx, x, y, r, r * 0.5, '#f2ecde');
      ctx.fillStyle = color;
      ctx.fillRect(x - r, y - h * 0.5, r * 2, 1.6);
      poly(ctx, [x - r - 0.5, y - h * 0.8, x, y - h * 0.8 - r * 0.9, x + r + 0.5, y - h * 0.8], '#e6dcc4');
      poly(ctx, [x, y - h * 0.8 - r * 0.9, x + r + 0.5, y - h * 0.8, x, y - h * 0.8 + r * 0.3], '#cfc3a8');
      ellipse(ctx, x, y - h * 0.8 - r * 0.85, 1.6, 0.9, '#8a5a33');
      ctx.fillStyle = '#b3302a';
      ctx.fillRect(x + r * 0.2, y - h * 0.45, 2.4, h * 0.45);
      break;
    }
    case 'greeks':
      box(ctx, x, y, w, h, '#fbfaf6');
      roof(ctx, x, y - h, w + 2, big ? 7 : 5, big ? '#e9e4d8' : roofC);
      if (big) for (const ox of [-6, -2, 2, 6]) { ctx.fillStyle = '#dcd6c8'; ctx.fillRect(x + ox - 0.7, y - h + 2, 1.4, h - 2); }
      break;
    case 'persia':
      drawPersianBuilding(ctx, x, y, big, capital);
      break;
    case 'ottoman':
      drawOttomanBuilding(ctx, x, y, big, capital);
    case 'india':
      indianBuilding(ctx, x, y, big, roofC, color, capital);
      break;
    case 'ethiopia': {
      // Aksum: carved granite stelae, stepped stone-and-timber towers with monkey-head beam ends, and round churches
      const stone = '#c9bfa8', beam = '#4a2e16', G = '#2f9a4a', Y = '#e8c21a', R = '#c8372d';
      const heads = (cx: number, cy: number, bw: number, bh: number, v: number, n: number) => { // the round beam ends that stick out of both walls
        for (let i = 0; i < n; i++) {
          const u = (i + 0.5) / n;
          for (const [px, py] of [[cx + (u * bw) / 2, cy + (bw / 4) * (1 - u) - v * bh], [cx - bw / 2 + (u * bw) / 2, cy + (bw / 4) * u - v * bh]] as const) {
            ellipse(ctx, px, py, 0.7, 0.7, '#3a2414');
            ellipse(ctx, px - 0.12, py - 0.15, 0.4, 0.4, '#9a6a3c');
          }
        }
      };
      const window_ = (cx: number, cy: number, bw: number, bh: number, u: number, v: number) => {
        faceQuad(ctx, 'R', cx, cy, bw, bh, u, u + 0.12, v, v + 0.24, '#e8dcb8');
        faceQuad(ctx, 'R', cx, cy, bw, bh, u + 0.025, u + 0.095, v + 0.04, v + 0.2, '#2a1a10');
        faceQuad(ctx, 'L', cx, cy, bw, bh, 1 - u - 0.12, 1 - u, v, v + 0.24, '#e8dcb8');
        faceQuad(ctx, 'L', cx, cy, bw, bh, 1 - u - 0.095, 1 - u - 0.025, v + 0.04, v + 0.2, '#2a1a10');
      };
      const v = ((Math.round(x) * 7 + Math.round(y) * 3) % 3 + 3) % 3;
      if (big) {
        // a stepped palace of three storeys
        box(ctx, x, y, 22, 8, stone, '#8a6a3a');
        band(ctx, x, y, 22, 8, 0.28, 0.4, beam);
        band(ctx, x, y, 22, 8, 0.8, 0.9, beam);
        band(ctx, x, y, 22, 8, 0.9, 1, T_LIME_C);
        heads(x, y, 22, 8, 0.34, 4);
        faceQuad(ctx, 'R', x, y, 22, 8, 0.18, 0.32, 0, 0.56, '#2a1a10'); // a great doorway
        faceQuad(ctx, 'R', x, y, 22, 8, 0.2, 0.3, 0.44, 0.6, '#e8dcb8');
        window_(x, y, 22, 8, 0.58, 0.46);
        box(ctx, x, y - 8, 16, 7, '#d8cfb8', '#8a6a3a');
        band(ctx, x, y - 8, 16, 7, 0.28, 0.4, beam);
        band(ctx, x, y - 8, 16, 7, 0.9, 1, T_LIME_C);
        heads(x, y - 8, 16, 7, 0.34, 3);
        window_(x, y - 8, 16, 7, 0.5, 0.5);
        window_(x, y - 8, 16, 7, 0.22, 0.5);
        box(ctx, x, y - 15, 10, 6, '#e6ddc6', '#8a6a3a');
        band(ctx, x, y - 15, 10, 6, 0.3, 0.42, beam);
        heads(x, y - 15, 10, 6, 0.36, 2);
        window_(x, y - 15, 10, 6, 0.4, 0.5);
        box(ctx, x, y - 21, 12, 1.6, roofC, shade(roofC, -0.2)); // a flat dark-timber roof with an overhang
        for (const [dx, dy] of [[-5.4, -21.8], [5.4, -21.8], [0, -20.3], [0, -24]] as const) box(ctx, x + dx, y + dy + 1.6, 1.6, 1.6, shade(stone, 0.2)); // corner merlons
        band(ctx, x, y - 21, 12, 1.6, 0.4, 0.6, R);
      } else if (v === 2) {
        // a great carved stele: a tapering granite shaft with false windows, a doorway at its foot and a rounded top
        box(ctx, x, y, 8, 2.4, '#9a9280');
        poly(ctx, [x - 3.4, y - 1.6, x - 2.4, y - 26, x, y - 27.4, x, y - 0.6], '#bfb6a2');
        poly(ctx, [x + 3.4, y - 1.6, x + 2.4, y - 26, x, y - 27.4, x, y - 0.6], '#8f8776');
        ellipse(ctx, x, y - 27, 2.5, 1.4, '#a89f8a'); // the rounded top
        ellipse(ctx, x + 0.2, y - 28.6, 1.6, 1.6, '#cfc6b0');
        ellipse(ctx, x + 0.2, y - 28.6, 0.9, 0.9, '#8f8776'); // the carved sun disc
        for (let i = 0; i < 6; i++) {
          const wy = y - 5 - i * 3.5;
          line(ctx, x - 3.2 + i * 0.16, wy + 1.3, x, wy + 2.1, '#8a8270', 0.6); // storey lines
          line(ctx, x + 3.2 - i * 0.16, wy + 1.3, x, wy + 2.1, '#6a6252', 0.6);
          ellipse(ctx, x - 1.6 + i * 0.05, wy + 0.8, 0.7, 0.9, '#4a4438');
          ellipse(ctx, x + 1.6 - i * 0.05, wy + 0.8, 0.7, 0.9, '#33302a');
          ellipse(ctx, x - 3 + i * 0.1, wy + 1.2, 0.5, 0.5, beam); // a beam end
          ellipse(ctx, x + 3 - i * 0.1, wy + 1.2, 0.5, 0.5, beam);
        }
        poly(ctx, [x - 1.4, y - 0.8, x - 1.4, y - 4.4, x, y - 5.2, x, y - 0.2], '#2a2418'); // a false door
        poly(ctx, [x + 1.4, y - 0.8, x + 1.4, y - 4.4, x, y - 5.2, x, y - 0.2], '#1a160f');
      } else if (v === 1) {
        // a round church: a whitewashed drum with a tibeb band, a conical thatched roof and a cross
        const r = 6.4;
        ellipse(ctx, x, y, r + 1.4, (r + 1.4) * 0.5, '#a89f8a'); // stone plinth
        ctx.fillStyle = '#f3eedd';
        ctx.fillRect(x - r, y - 8, r * 2, 8);
        ctx.fillStyle = '#d9d2bc';
        ctx.fillRect(x, y - 8, r, 8); // the shaded half
        ellipse(ctx, x, y, r, r * 0.5, '#efe8d2');
        for (const [dy, c] of [[-2.6, G], [-3.6, Y], [-4.6, R]] as const) { ctx.fillStyle = c; ctx.fillRect(x - r, y + dy, r * 2, 1); }
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(x, y - 4.6, r, 3);
        for (const wx of [-4, -1.4, 3.4]) ellipse(ctx, x + wx, y - 6.6, 0.75, 1, '#3a2a1a'); // arched windows
        poly(ctx, [x + 1.4, y - 0.4, x + 1.4, y - 4, x + 2.8, y - 4.8, x + 4.2, y - 4, x + 4.2, y - 0.4 + 0.6], '#2a1a10'); // the doorway
        ellipse(ctx, x, y - 8, r, r * 0.5, '#d8cfb8');
        poly(ctx, [x, y - 19, x - r - 1.6, y - 8, x, y - 4.6], shade(roofC, 0.08)); // the conical thatched roof
        poly(ctx, [x, y - 19, x + r + 1.6, y - 8, x, y - 4.6], shade(roofC, -0.24));
        for (const f of [0.35, 0.65]) { ctx.strokeStyle = shade(roofC, -0.32); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(x, y - 19 + 14.4 * f - 0.2, (r + 1.6) * f, (r + 1.6) * f * 0.5, 0, 0.05 * Math.PI, 0.95 * Math.PI); ctx.stroke(); }
        ellipse(ctx, x, y - 19.6, 1.1, 1.3, '#f4efe0'); // an ostrich egg
        line(ctx, x, y - 21, x, y - 25.6, '#e8b830', 1); // a gold cross
        line(ctx, x - 1.6, y - 23.6, x + 1.6, y - 23.6, '#e8b830', 1);
      } else {
        // a stone-and-timber house with monkey-head beams and a flat roof
        box(ctx, x, y, 11, 8, stone, '#8a6a3a');
        band(ctx, x, y, 11, 8, 0.36, 0.48, beam);
        band(ctx, x, y, 11, 8, 0.86, 1, T_LIME_C);
        heads(x, y, 11, 8, 0.42, 2);
        faceQuad(ctx, 'R', x, y, 11, 8, 0.28, 0.46, 0, 0.5, '#2a1a10'); // door
        window_(x, y, 11, 8, 0.6, 0.5);
        box(ctx, x, y - 8.6, 12.4, 1.2, roofC, shade(roofC, -0.2));
        band(ctx, x, y - 8.6, 12.4, 1.2, 0.3, 0.6, R);
      }
      break;
    }
    case 'celts':
      drawCeltBuilding(ctx, x, y, big, roofC, capital);
      break;
    case 'china':
      drawChinaBuilding(ctx, x, y, big, roofC, capital);
    case 'mali':
      mlBuilding(ctx, x, y, big, roofC, capital);
      break;
    case 'zulu': {
      // woven grass beehive huts
      const r = big ? 9 : 6.5;
      ellipse(ctx, x, y, r, r * 0.5, shade(roofC, -0.2));
      ctx.fillStyle = roofC;
      ctx.beginPath();
      ctx.ellipse(x, y - 1, r, r * 1.05, 0, Math.PI, 0);
      ctx.fill();
      ellipse(ctx, x, y - 1, r, r * 0.5, roofC);
      for (const v of [0.35, 0.65]) {
        ctx.strokeStyle = shade(roofC, -0.15);
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(x, y - 1 - r * v, r * Math.sqrt(1 - v * v), r * 0.35, 0, 0, Math.PI);
        ctx.stroke();
      }
      ellipse(ctx, x + r * 0.3, y - 0.5, 1.7, 2.2, '#3a2412');
      break;
    }
  }
  if (capital) {
    const fo = tribe === 'persia' && big ? 10 : tribe === 'china' && big ? 12 : tribe === 'mali' && big ? (capital ? 12 : 8) : tribe === 'ottoman' && big ? 7 : tribe === 'india' && big ? 9 : 0; // the flag rides on the dome
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x - 1, y - h - 6 - fo);
    ctx.lineTo(x - 1, y - h - 26 - fo);
    ctx.stroke();
    poly(ctx, [x - 1, y - h - 26 - fo, x + 11, y - h - 23 - fo, x - 1, y - h - 19 - fo], tribe === 'pirates' ? '#15151a' : color);
    if (tribe === 'pirates') ellipse(ctx, x + 3.5, y - h - 23 - fo, 1.6, 1.6, '#fff');
  }
}

// ---------------------------------------------------------------- Indian trees and buildings

/**
 * The trees of the Indian plains and jungle: a banyan with aerial roots that drop from its boughs into pillars,
 * a round dark mango heavy with fruit, a tall coconut palm, a buttressed jungle fig hung with vines, and a
 * feathery neem in flower.
 */
function indianTree(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  const v = variant % 5;
  const leaf = P.forest, bark = P.trunk;
  const clump = (cx: number, cy: number, r: number, c: string, lit = 0) => {
    ellipse(ctx, cx + 0.5 * k, cy + 0.8 * k, r * 1.02, r * 0.8, shade(c, -0.32));
    ellipse(ctx, cx, cy, r, r * 0.8, shade(c, -0.1 + lit));
    ellipse(ctx, cx - r * 0.2, cy - r * 0.26, r * 0.66, r * 0.5, shade(c, 0.1 + lit));
    ellipse(ctx, cx - r * 0.36, cy - r * 0.42, r * 0.3, r * 0.2, shade(c, 0.28 + lit));
  };
  ctx.lineCap = 'round';
  if (v === 0) {
    // banyan: a broad flat crown, its prop roots hanging down and rooting as extra trunks
    ctx.fillStyle = shade(bark, 0.05);
    ctx.fillRect(x - 1.6 * k, y - 9 * k, 3.2 * k, 9 * k);
    for (const [rx, sw, th] of [[-9.6, 1.4, 1.1], [-5, -0.8, 1.5], [4.6, 0.6, 1.6], [9.4, -1.2, 1.1], [0.8, 0, 1]] as const) { // aerial roots
      ctx.strokeStyle = ink(rx % 2 ? shade(bark, 0.12) : shade(bark, -0.05));
      ctx.lineWidth = th * k;
      ctx.beginPath();
      ctx.moveTo(x + rx * k, y - 12 * k);
      ctx.quadraticCurveTo(x + (rx + sw * 3) * k, y - 6 * k, x + (rx + sw) * k, y);
      ctx.stroke();
    }
    for (const rx of [-7.6, -2.6, 2.8, 7.2, -11.4, 11]) line(ctx, x + rx * k, y - 11.4 * k, x + (rx + 0.4) * k, y - (rx % 2 ? 6.6 : 5.2) * k, shade(bark, 0.2), 0.45 * k); // thin hanging roots
    clump(x - 7.4 * k, y - 15.6 * k, 6.6 * k, leaf);
    clump(x + 7.2 * k, y - 15.4 * k, 6.8 * k, leaf, -0.04);
    clump(x - 0.4 * k, y - 18 * k, 8.4 * k, leaf, 0.04);
    clump(x - 3.6 * k, y - 21 * k, 5 * k, leaf, 0.1);
    clump(x + 4.4 * k, y - 20.6 * k, 4.6 * k, leaf, 0.06);
    for (const [fx, fy] of [[-8, -13.6], [-1, -14.6], [5.4, -13], [9.6, -15]] as const) ellipse(ctx, x + fx * k, y + fy * k, 0.7 * k, 0.55 * k, '#d8503a'); // red figs
    return;
  }
  if (v === 1) {
    // mango: a short trunk under a dense round crown, new leaves coppery, golden fruit hanging
    ctx.fillStyle = bark;
    ctx.fillRect(x - 1.5 * k, y - 8 * k, 3 * k, 8 * k);
    line(ctx, x, y - 6 * k, x - 4.6 * k, y - 10.6 * k, bark, 1.3 * k);
    line(ctx, x, y - 6.4 * k, x + 4.6 * k, y - 10.2 * k, bark, 1.3 * k);
    const mc = shade(leaf, -0.14);
    clump(x - 4.6 * k, y - 12.6 * k, 5.6 * k, mc);
    clump(x + 4.6 * k, y - 12.4 * k, 5.8 * k, mc, -0.03);
    clump(x, y - 15.6 * k, 7 * k, mc, 0.05);
    for (const [fx, fy] of [[-5, -18], [-1, -20.2], [3.6, -18.6], [6, -14.4]] as const) ellipse(ctx, x + fx * k, y + fy * k, 1.4 * k, 0.9 * k, '#c9782a'); // copper flush of new leaves
    for (const [fx, fy, c] of [[-4.2, -9.6, '#f2b33a'], [-1.4, -10.4, '#e8862a'], [3.2, -9.8, '#f2b33a'], [5.8, -11, '#e8862a'], [0.8, -12.6, '#f2b33a']] as const) {
      line(ctx, x + fx * k, y + (fy - 2.6) * k, x + fx * k, y + (fy - 0.6) * k, shade(leaf, -0.4), 0.4 * k);
      ellipse(ctx, x + fx * k, y + fy * k, 0.95 * k, 1.2 * k, c);
      ellipse(ctx, x + (fx - 0.3) * k, y + (fy - 0.4) * k, 0.3 * k, 0.4 * k, shade(c, 0.5));
    }
    return;
  }
  if (v === 2) {
    // coconut palm: a tall curved, ringed trunk and a crown of long arching fronds over a knot of nuts
    const lean = (variant % 2 ? 1 : -1) * 3.4 * k;
    ctx.strokeStyle = ink(shade(bark, 0.14));
    ctx.lineWidth = 2.6 * k;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + lean * 0.4, y - 13 * k, x + lean, y - 26 * k);
    ctx.stroke();
    ctx.strokeStyle = ink(shade(bark, 0.42));
    ctx.lineWidth = 0.8 * k;
    ctx.beginPath();
    ctx.moveTo(x - 0.8 * k, y);
    ctx.quadraticCurveTo(x + lean * 0.4 - 0.8 * k, y - 13 * k, x + lean - 0.8 * k, y - 26 * k);
    ctx.stroke();
    for (let i = 1; i < 9; i++) { // the growth rings
      const t = i / 9.6, bx = x + lean * (2 * t * (1 - t) * 0.4 + t * t), by = y - 26 * k * t;
      line(ctx, bx - 1.5 * k, by + 0.2 * k, bx + 1.5 * k, by - 0.4 * k, shade(bark, -0.36), 0.5 * k);
    }
    const tx = x + lean, ty = y - 26 * k;
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (i - 4) * 0.5 + (i % 2 ? 0.08 : -0.08);
      const ex = tx + Math.cos(a) * 12 * k, ey = ty + Math.sin(a) * 5.4 * k + 6 * k + Math.abs(i - 4) * 0.6 * k;
      const mx = tx + Math.cos(a) * 6.4 * k, my = ty + Math.sin(a) * 6.6 * k - 1.4 * k;
      ctx.strokeStyle = ink(i % 2 ? leaf : shade(leaf, 0.2));
      ctx.lineWidth = 2.3 * k;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(mx, my, ex, ey);
      ctx.stroke();
      ctx.strokeStyle = ink(shade(leaf, -0.4));
      ctx.lineWidth = 0.4 * k;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(mx, my, ex, ey);
      ctx.stroke();
    }
    for (const [dx, dy] of [[-1.2, 1.6], [0.8, 2], [1.8, 1]] as const) ellipse(ctx, tx + dx * k, ty + dy * k, 1.3 * k, 1.3 * k, '#7a5a2a'); // the nuts
    ellipse(ctx, tx + 0.4 * k, ty + 1.6 * k, 0.5 * k, 0.5 * k, '#a98a4a');
    return;
  }
  if (v === 3) {
    // jungle fig: a huge buttressed trunk, buttress roots flaring out, a tall untidy crown hung with vines
    ctx.fillStyle = shade(bark, -0.05);
    ctx.fillRect(x - 2.2 * k, y - 12 * k, 4.4 * k, 12 * k);
    poly(ctx, [x - 2.2 * k, y - 10 * k, x - 6.4 * k, y + 0.4 * k, x - 1.4 * k, y], shade(bark, 0.12)); // buttresses
    poly(ctx, [x + 2.2 * k, y - 9 * k, x + 6.8 * k, y + 0.4 * k, x + 1.4 * k, y], shade(bark, -0.22));
    line(ctx, x - 1 * k, y - 11 * k, x - 1.2 * k, y - 1 * k, shade(bark, 0.4), 0.6 * k);
    clump(x - 4.6 * k, y - 16 * k, 5.6 * k, leaf, 0.04);
    clump(x + 5 * k, y - 15.6 * k, 5.4 * k, leaf, -0.04);
    clump(x - 0.6 * k, y - 20 * k, 7 * k, leaf, 0.1);
    clump(x + 1.4 * k, y - 25 * k, 4.4 * k, leaf, 0.16);
    for (const [vx, vy, l] of [[-7, -13, 8], [-3.4, -12.6, 6], [2.4, -13.4, 7], [7, -12.6, 8], [4.4, -12.6, 5]] as const) { // hanging vines
      line(ctx, x + vx * k, y + vy * k, x + (vx + 0.4) * k, y + (vy + l) * k, '#4a7a34', 0.5 * k);
    }
    for (const [fx, fy] of [[-6, -17], [2, -18], [7, -15.6], [-1, -23]] as const) ellipse(ctx, x + fx * k, y + fy * k, 0.75 * k, 0.75 * k, '#d8503a');
    return;
  }
  // neem: a slender trunk, a light feathery crown of small leaflets and sprays of tiny white flowers
  ctx.fillStyle = shade(bark, 0.05);
  ctx.fillRect(x - 1.1 * k, y - 9 * k, 2.2 * k, 9 * k);
  line(ctx, x, y - 7 * k, x - 4 * k, y - 11.4 * k, bark, 1 * k);
  line(ctx, x, y - 7.4 * k, x + 4 * k, y - 11 * k, bark, 1 * k);
  const nc = shade(leaf, 0.2);
  for (const [cx, cy, r] of [[-5, -13, 4.4], [5, -12.6, 4.6], [-1, -16, 5.4], [-4.4, -17.6, 3.4], [3.6, -18, 3.8], [0, -20.6, 3.2]] as const) {
    ellipse(ctx, x + cx * k + 0.4 * k, y + cy * k + 0.7 * k, r * k, r * 0.78 * k, shade(nc, -0.3));
    ellipse(ctx, x + cx * k, y + cy * k, r * k, r * 0.78 * k, shade(nc, -0.06));
    for (let i = 0; i < 7; i++) { // leaflets
      const a = (i / 7) * Math.PI * 2 + variant;
      line(ctx, x + cx * k, y + cy * k, x + cx * k + Math.cos(a) * r * 0.9 * k, y + cy * k + Math.sin(a) * r * 0.66 * k, shade(nc, i % 2 ? 0.2 : -0.22), 0.55 * k);
    }
    ellipse(ctx, x + (cx - r * 0.3) * k, y + (cy - r * 0.34) * k, r * 0.5 * k, r * 0.28 * k, shade(nc, 0.28));
  }
  for (const [fx, fy] of [[-6, -13.6], [-2, -19], [4, -16], [6.4, -12], [0.6, -22.4], [-4.6, -18.4]] as const) ellipse(ctx, x + fx * k, y + fy * k, 0.6 * k, 0.5 * k, '#fdfaf0'); // the white blossom
}

/** A half-dome on a base of radius r and height h, plastered and lit on the left, with a curved ridge line. */
function indDome(ctx: Ctx, x: number, y: number, r: number, h: number, col: string) {
  ctx.beginPath();
  ctx.ellipse(x, y, r, h, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = ink(shade(col, -0.2));
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, y, r, h, 0, Math.PI, Math.PI * 1.5);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fillStyle = ink(shade(col, 0.06));
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.42, 0, 0, Math.PI);
  ctx.fillStyle = ink(shade(col, -0.32));
  ctx.fill();
  ellipse(ctx, x - r * 0.4, y - h * 0.5, r * 0.16, h * 0.32, 'rgba(255,255,255,0.4)');
  ctx.strokeStyle = ink(shade(col, -0.4));
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.98, h * 0.98, 0, Math.PI * 1.02, Math.PI * 1.98);
  ctx.stroke();
}

/** A cusped (ogee) arch on the right-hand face of a box at (x, y): a frame colour and a dark inner. */
function indArch(ctx: Ctx, x: number, y: number, w: number, h: number, u0: number, u1: number, v0: number, v1: number, frame: string, inner: string) {
  const P = (u: number, v: number) => [x + (u * w) / 2, y + (w / 4) * (1 - u) - v * h];
  const um = (u0 + u1) / 2, vs = v1 - (v1 - v0) * 0.28;
  poly(ctx, [...P(u0, v0), ...P(u1, v0), ...P(u1, vs), ...P(um + (u1 - u0) * 0.2, vs + (v1 - vs) * 0.5), ...P(um, v1), ...P(um - (u1 - u0) * 0.2, vs + (v1 - vs) * 0.5), ...P(u0, vs)], frame);
  const du = (u1 - u0) * 0.2, dv = (v1 - v0) * 0.08;
  poly(ctx, [...P(u0 + du, v0), ...P(u1 - du, v0), ...P(u1 - du, vs - dv), ...P(um, v1 - dv * 2.2), ...P(u0 + du, vs - dv)], inner);
}

/** A little four-pillared chhatri kiosk under an ochre dome and a gold finial, standing at (x, y) with pillars `h` high. */
function indKiosk(ctx: Ctx, x: number, y: number, w: number, h: number, dome: string) {
  box(ctx, x, y, w, 1, '#d3b27a');
  for (const [px, py] of [[-w * 0.36, 0.2], [w * 0.36, 0.2], [0, w * 0.18 + 0.2]] as const) line(ctx, x + px, y + py, x + px, y + py - h, '#f0e4c4', Math.max(0.8, w * 0.1));
  box(ctx, x, y - h, w, 0.9, '#e8d6a8');
  indDome(ctx, x, y - h - 0.6, w * 0.5, w * 0.42, dome);
  line(ctx, x, y - h - 0.6 - w * 0.42, x, y - h - w * 0.42 - 2.4, '#f0c43a', 0.7);
  ellipse(ctx, x, y - h - w * 0.42 - 2.8, 0.6, 0.7, '#f0c43a');
}

/**
 * Indian city buildings: stupa-domed shrines under a chhatra mast, hipped-roof houses with cusped doorways and
 * a corner kiosk, striped market stalls; the great building is a stepped temple tower (a gopuram), and the
 * capital a tiered palace with an arcaded hall, corner kiosks and its own tower.
 */
function indianBuilding(ctx: Ctx, x: number, y: number, big: boolean, roofC: string, color: string, capital: boolean) {
  const SAND = '#ecd5a4', SAND2 = '#d3b27a', SAND3 = '#b98f58', PLASTER = '#f6efdc', GOLDC = '#f0c43a', DOOR = '#3a2418', TERRA = '#b8683e', MAROON = '#8c2a3a';
  if (big) {
    const S = capital ? 1 : 0;
    // the terraced platform
    box(ctx, x, y + 3.2 + S * 1.4, 22 + S * 8, 2.6, SAND3);
    box(ctx, x, y + 1.2 + S * 0.8, 19 + S * 6, 2.6, SAND2);
    for (const f of ['L', 'R'] as const) for (let i = 0; i < 5 + S * 2; i++) { // the balustrade of little posts
      const u = 0.1 + i * (0.8 / (4 + S * 2));
      faceQuad(ctx, f, x, y + 1.2 + S * 0.8, 19 + S * 6, 2.6, u, u + 0.04, 0.5, 1, SAND);
    }
    const hw = 15 + S * 5, hh = 8 + S * 1;
    const hy = y - 0.4 - S * 0.2;
    box(ctx, x, hy, hw, hh, SAND);
    // right face: an arcade of cusped arches; left face: carved panels
    const nA = capital ? 4 : 3;
    for (let i = 0; i < nA; i++) {
      const u0 = 0.08 + i * (0.86 / nA), u1 = u0 + (0.86 / nA) * 0.72;
      indArch(ctx, x, hy, hw, hh, u0, u1, 0.06, 0.74, capital ? '#2fb8a0' : TERRA, DOOR);
      faceQuad(ctx, 'R', x, hy, hw, hh, u0 - 0.02, u1 + 0.02, 0.76, 0.8, SAND3);
    }
    for (let i = 0; i < 3; i++) {
      const u0 = 0.1 + i * 0.3, u1 = u0 + 0.22;
      faceQuad(ctx, 'L', x, hy, hw, hh, u0, u1, 0.16, 0.72, SAND3);
      faceQuad(ctx, 'L', x, hy, hw, hh, u0 + 0.03, u1 - 0.03, 0.2, 0.68, capital ? color : MAROON);
      faceQuad(ctx, 'L', x, hy, hw, hh, u0 + 0.08, u1 - 0.08, 0.36, 0.52, GOLDC);
    }
    for (const f of ['L', 'R'] as const) { // a carved cornice: teal frieze and gold line under the roof edge
      faceQuad(ctx, f, x, hy, hw, hh, 0, 1, 0.84, 0.94, capital ? color : MAROON);
      faceQuad(ctx, f, x, hy, hw, hh, 0, 1, 0.94, 1, GOLDC);
      faceQuad(ctx, f, x, hy, hw, hh, 0, 1, 0, 0.05, SAND3);
    }
    let ty = hy - hh;
    if (capital) {
      // corner chhatri kiosks on the hall's roof edge, and the great tower rising between them
      for (const [kx, ky] of [[-hw / 2, 0.4], [hw / 2, 0.4], [0, hw / 4 + 0.6]] as const) indKiosk(ctx, x + kx * 0.86, ty + ky + 0.6, 3.6, 3.4, roofC);
    }
    // the tower: shrinking tiers, each with a row of little niches under a projecting eave, a barrel-vaulted crest
    const tiers = capital ? 3 : 4;
    for (let i = 0; i < tiers; i++) {
      const tw = (capital ? 11 : 12.4) - i * (capital ? 2.6 : 2.5), th = capital ? 3.6 : 3.4;
      box(ctx, x, ty, tw, th, i % 2 ? SAND : SAND2);
      const nn = Math.max(1, 3 - Math.floor(i * 0.7));
      for (let j = 0; j < nn; j++) {
        const u0 = 0.14 + j * (0.72 / nn), u1 = u0 + (0.72 / nn) * 0.66;
        indArch(ctx, x, ty, tw, th, u0, u1, 0.16, 0.86, TERRA, '#5a2a1e');
      }
      band(ctx, x, ty, tw, th, 0.9, 1, i % 2 ? roofC : MAROON);
      band(ctx, x, ty, tw, th, 0, 0.06, SAND3);
      for (const f of ['L', 'R'] as const) faceQuad(ctx, f, x, ty, tw, th, 0.02, 0.98, 0.82, 0.9, shade(GOLDC, -0.1));
      ty -= th;
    }
    // the crest: a barrel roof (a sala) with its gilded finial pots
    box(ctx, x, ty, (capital ? 5 : 6.4), 2.2, roofC);
    ellipse(ctx, x, ty - 2.2, (capital ? 2.5 : 3.2), 1.4, shade(roofC, 0.2));
    faceQuad(ctx, 'R', x, ty, capital ? 5 : 6.4, 2.2, 0.1, 0.9, 0.3, 0.6, GOLDC);
    for (const dx of capital ? [0] : [-2.2, 0, 2.2]) {
      ellipse(ctx, x + dx, ty - 2.8, 0.9, 1.1, GOLDC);
      line(ctx, x + dx, ty - 3.6, x + dx, ty - 5, GOLDC, 0.7);
    }
    ellipse(ctx, x, ty - 5.6, 0.7, 0.9, shade(GOLDC, 0.2));
    return;
  }
  const v = Math.abs(Math.round(x * 1.7 + y * 2.9)) % 3;
  if (v === 0) {
    // a stupa shrine: a railed sandstone drum under a white dome, a square harmika and a mast of stacked parasols
    box(ctx, x, y, 11, 2.6, SAND2);
    for (const f of ['L', 'R'] as const) for (let i = 0; i < 6; i++) faceQuad(ctx, f, x, y, 11, 2.6, 0.06 + i * 0.16, 0.12 + i * 0.16, 0.2, 0.9, SAND3);
    band(ctx, x, y, 11, 2.6, 0.9, 1, SAND);
    indDome(ctx, x, y - 2.6, 4.9, 5.8, PLASTER);
    ctx.strokeStyle = ink(TERRA); // a painted band around the drum of the dome
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.ellipse(x, y - 4.2, 4.3, 1.8, 0, 0.05 * Math.PI, 0.95 * Math.PI);
    ctx.stroke();
    box(ctx, x, y - 8.4, 3, 1.4, SAND);
    band(ctx, x, y - 8.4, 3, 1.4, 0.7, 1, SAND3);
    line(ctx, x, y - 9.8, x, y - 16, '#7a5230', 0.9);
    for (const [yy, rr, c] of [[-11, 2.6, GOLDC], [-13.2, 2, roofC], [-15.2, 1.4, GOLDC]] as const) {
      ellipse(ctx, x, y + yy + 0.5, rr, rr * 0.4, shade(c, -0.25));
      ellipse(ctx, x, y + yy, rr, rr * 0.4, c);
    }
    faceQuad(ctx, 'R', x, y, 11, 2.6, 0.4, 0.6, 0, 0.7, DOOR); // a low gate
    return;
  }
  if (v === 1) {
    // a house: whitewashed walls, a cusped doorway framed in teal, latticed window, a hipped tile roof with a little kiosk on the ridge
    box(ctx, x, y, 10.6, 5.6, PLASTER);
    indArch(ctx, x, y, 10.6, 5.6, 0.3, 0.66, 0, 0.78, color, DOOR);
    faceQuad(ctx, 'L', x, y, 10.6, 5.6, 0.3, 0.7, 0.3, 0.72, DOOR);
    for (const u of [0.42, 0.5, 0.58]) faceQuad(ctx, 'L', x, y, 10.6, 5.6, u, u + 0.02, 0.3, 0.72, GOLDC);
    faceQuad(ctx, 'L', x, y, 10.6, 5.6, 0.3, 0.7, 0.5, 0.52, GOLDC);
    for (const f of ['L', 'R'] as const) { faceQuad(ctx, f, x, y, 10.6, 5.6, 0, 1, 0.9, 1, TERRA); faceQuad(ctx, f, x, y, 10.6, 5.6, 0, 1, 0, 0.08, SAND3); }
    roof(ctx, x, y - 5.6, 13, 5.2, roofC);
    line(ctx, x - 6.4, y - 5.6, x, y - 3, shade(roofC, -0.4), 0.6);
    line(ctx, x, y - 3, x + 6.4, y - 5.6, shade(roofC, -0.5), 0.6);
    indKiosk(ctx, x, y - 8.6, 3.2, 2.2, roofC);
    return;
  }
  // a market stall: a shop under a striped awning, baskets of spice and fruit at the front
  box(ctx, x - 1, y - 0.6, 8.6, 6.4, PLASTER);
  faceQuad(ctx, 'R', x - 1, y - 0.6, 8.6, 6.4, 0.16, 0.7, 0, 0.66, DOOR);
  for (const f of ['L', 'R'] as const) faceQuad(ctx, f, x - 1, y - 0.6, 8.6, 6.4, 0, 1, 0.92, 1, TERRA);
  const P = (u: number, vv: number) => [x - 1 + (u * 8.6) / 2, y - 0.6 + (8.6 / 4) * (1 - u) - vv * 6.4];
  const A = P(0.02, 0.76), B = P(0.98, 0.76);
  for (let i = 0; i < 4; i++) { // the awning: alternating stripes, sloping down and out over the counter
    const t0 = i / 4, t1 = (i + 1) / 4;
    const a0 = [A[0] + (B[0] - A[0]) * t0, A[1] + (B[1] - A[1]) * t0], a1 = [A[0] + (B[0] - A[0]) * t1, A[1] + (B[1] - A[1]) * t1];
    poly(ctx, [a0[0], a0[1], a1[0], a1[1], a1[0] + 3.6, a1[1] + 4.6, a0[0] + 3.6, a0[1] + 4.6], i % 2 ? color : '#e8a02a');
    ellipse(ctx, (a0[0] + a1[0]) / 2 + 3.6, (a0[1] + a1[1]) / 2 + 4.8, (B[0] - A[0]) / 8, 1, i % 2 ? color : '#e8a02a');
  }
  for (const [px, py] of [[A[0] + 3.6, A[1] + 5.4], [B[0] + 3.6, B[1] + 5.4]] as const) line(ctx, px, py, px, py + 5.2, '#7a5230', 0.9);
  box(ctx, x + 1.4, y + 5.6, 7, 1.6, '#c9a56f'); // the counter
  for (const [bx, c1, c2] of [[-0.8, '#c8372d', '#e8862a'], [1.8, '#e8a02a', '#f2c53a'], [4, '#5a9a3a', '#c8372d']] as const) {
    ellipse(ctx, x + bx + 0.6, y + 4.4, 1.5, 0.7, '#8a5a2b');
    ellipse(ctx, x + bx + 0.6, y + 3.8, 1.3, 0.8, c1);
    ellipse(ctx, x + bx + 0.2, y + 3.5, 0.6, 0.4, c2);
  }
}

// ---------------------------------------------------------------- Persian trees and buildings

/** The Persian garden: tall flame-shaped cypresses, broad mottled-barked plane trees and pink-blossomed almond trees. */
function drawPersianTree(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  const v = variant % 4;
  if (v === 0 || v === 2) {
    // cypress: a dark green flame, swelling low and drawn to a point, its lit flank on the left
    const H = (v === 0 ? 31 : 26) * k, W = (v === 0 ? 3.8 : 3.3) * k;
    ctx.fillStyle = P.trunk;
    ctx.fillRect(x - 0.8 * k, y - 3 * k, 1.6 * k, 3 * k);
    const half = (t: number) => W * (0.3 + 0.7 * Math.sin(Math.PI * Math.pow(t, 0.62))) * (1 - Math.pow(t, 3));
    const N = 12, L: number[] = [], R: number[] = [], C: number[] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, yy = y - 2 * k - t * H, sway = Math.sin(variant * 1.7 + t * 3) * 0.5 * k * t;
      L.push(x + sway - half(t), yy);
      R.push(x + sway + half(t), yy);
      C.push(x + sway, yy);
    }
    const rev = (a: number[]) => { const o: number[] = []; for (let i = a.length - 2; i >= 0; i -= 2) o.push(a[i], a[i + 1]); return o; };
    const dark = shade('#2f6a3c', -0.12), mid = '#2f6a3c';
    poly(ctx, [...L, ...rev(R)], dark);
    poly(ctx, [...L, ...rev(C)], shade(mid, 0.14));
    for (let i = 2; i < N - 1; i += 2) { // clustered foliage tufts
      const t = i / N, yy = y - 2 * k - t * H;
      line(ctx, x - half(t) * 0.7, yy + 0.6 * k, x - half(t) * 0.1, yy - 1 * k, shade(mid, 0.34), 0.7 * k);
      line(ctx, x + half(t) * 0.1, yy + 1 * k, x + half(t) * 0.7, yy - 0.2 * k, shade(dark, -0.2), 0.6 * k);
    }
    return;
  }
  if (v === 1) {
    // plane tree (chinar): a thick trunk of peeling, mottled bark under a broad, layered crown
    const bark = '#8c7f68';
    line(ctx, x, y, x + 0.4 * k, y - 10 * k, bark, 3.6 * k);
    for (const [dx, dy, r] of [[-0.6, -3, 0.9], [0.8, -5, 0.8], [-0.4, -7.4, 0.7], [0.6, -9, 0.6]] as const) ellipse(ctx, x + dx * k, y + dy * k, r * k, r * 0.8 * k, i2c(dy));
    line(ctx, x + 0.4 * k, y - 8 * k, x - 3.6 * k, y - 13 * k, bark, 1.6 * k);
    line(ctx, x + 0.4 * k, y - 8 * k, x + 4 * k, y - 12.6 * k, bark, 1.6 * k);
    ellipse(ctx, x + 0.4 * k, y - 15 * k, 8.8 * k, 6.2 * k, shade(P.forest, -0.28));
    ellipse(ctx, x + 3.6 * k, y - 14 * k, 5.2 * k, 4 * k, shade(P.forest, -0.12));
    ellipse(ctx, x - 3.4 * k, y - 16 * k, 5.4 * k, 4.4 * k, shade(P.forest, 0.1));
    ellipse(ctx, x + 0.2 * k, y - 19.4 * k, 4.6 * k, 3.4 * k, shade(P.forest, 0.22));
    for (const [dx, dy] of [[-5, -17], [-2, -21], [2, -18], [5, -15], [-1, -14]] as const) ellipse(ctx, x + dx * k, y + dy * k, 1.5 * k, 1 * k, shade(P.forest, 0.42));
    for (const [dx, dy] of [[3, -12], [-2, -11.6], [6, -13]] as const) ellipse(ctx, x + dx * k, y + dy * k, 1.6 * k, 0.9 * k, shade(P.forest, -0.4));
    return;
  }
  // almond tree: a gnarled trunk under a cloud of leaves scattered with pink blossom
  ctx.strokeStyle = P.trunk;
  ctx.lineWidth = 2.2 * k;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - 2 * k, y - 6 * k, x + 0.6 * k, y - 10 * k);
  ctx.stroke();
  line(ctx, x + 0.2 * k, y - 7.6 * k, x + 4 * k, y - 11.4 * k, P.trunk, 1.3 * k);
  ellipse(ctx, x + 0.6 * k, y - 13.6 * k, 7 * k, 5.4 * k, shade(P.forest, -0.16));
  ellipse(ctx, x - 1.8 * k, y - 14.6 * k, 4.6 * k, 3.6 * k, shade(P.forest, 0.12));
  for (let i = 0; i < 12; i++) {
    const a = rand(variant + 7, i) * Math.PI * 2, r = 1.5 + rand(variant + 9, i) * 5;
    ellipse(ctx, x + 0.6 * k + Math.cos(a) * r * k, y - 13.6 * k + Math.sin(a) * r * 0.72 * k, 1.1 * k, 0.9 * k, i % 3 === 0 ? '#fff0f6' : i % 3 === 1 ? '#f7a8cc' : '#e0559c');
  }
}
const i2c = (dy: number) => (Math.round(-dy) % 2 ? '#c9c2ae' : '#6a5a44'); // alternating patches on plane-tree bark

/** A Persian onion dome: a swelling bulb narrowing to a point, glazed tile with a lit flank, gold rim, ribs and finial. */
function persianDome(ctx: Ctx, x: number, y: number, r: number, h: number, col: string, flame = false) {
  const half = (s: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y + r * 0.3);
    ctx.lineTo(x + s * r, y);
    ctx.bezierCurveTo(x + s * r * 1.3, y - h * 0.48, x + s * r * 0.36, y - h * 0.72, x, y - h);
    ctx.closePath();
  };
  half(-1);
  ctx.fillStyle = ink(shade(col, 0.14));
  ctx.fill();
  half(1);
  ctx.fillStyle = ink(shade(col, -0.24));
  ctx.fill();
  ctx.lineCap = 'round';
  for (const [s, c] of [[-0.5, shade(col, -0.1)], [0.5, shade(col, -0.4)]] as const) { // glazed ribs
    ctx.strokeStyle = ink(c);
    ctx.lineWidth = Math.max(0.4, r * 0.06);
    ctx.beginPath();
    ctx.moveTo(x + s * r * 0.9, y + r * 0.04);
    ctx.bezierCurveTo(x + s * r * 1.1, y - h * 0.4, x + s * r * 0.2, y - h * 0.7, x, y - h);
    ctx.stroke();
  }
  ctx.strokeStyle = ink('#f0c43a'); // gilded rim at the base
  ctx.lineWidth = Math.max(0.7, r * 0.13);
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.3, 0, 0, Math.PI);
  ctx.stroke();
  ellipse(ctx, x - r * 0.38, y - h * 0.4, r * 0.18, r * 0.36, 'rgba(255,255,255,0.4)'); // sheen
  line(ctx, x, y - h, x, y - h - Math.max(2, h * 0.25), '#f0c43a', Math.max(0.8, r * 0.12));
  ellipse(ctx, x, y - h - Math.max(2, h * 0.25), Math.max(0.7, r * 0.17), Math.max(0.7, r * 0.17), '#f0c43a');
  if (flame) { // the sacred fire burning above the fire temple
    const fy = y - h - Math.max(2, h * 0.25);
    poly(ctx, [x - 1.6, fy - 0.4, x - 0.2, fy - 5.4, x + 0.6, fy - 3, x + 1.9, fy - 6.4, x + 2, fy - 0.4], '#ff8a2e');
    poly(ctx, [x - 0.8, fy - 0.4, x + 0.2, fy - 3.8, x + 1.2, fy - 0.4], '#ffe36a');
  }
}

/** An arched niche or doorway on the right-hand face of a box at (x, y) of width w and height h. */
function persianArch(ctx: Ctx, x: number, y: number, w: number, h: number, u0: number, u1: number, v0: number, v1: number, frame: string, inner: string) {
  const P = (u: number, v: number) => [x + (u * w) / 2, y + (w / 4) * (1 - u) - v * h];
  const um = (u0 + u1) / 2, vm = v1 - (u1 - u0) * 0.22 * (w / h) * 1.2;
  poly(ctx, [...P(u0, v0), ...P(u1, v0), ...P(u1, vm), ...P(um, v1 + (v1 - vm) * 0.2), ...P(u0, vm)], frame);
  const du = (u1 - u0) * 0.2, dv = (v1 - v0) * 0.08;
  poly(ctx, [...P(u0 + du, v0), ...P(u1 - du, v0), ...P(u1 - du, vm - dv), ...P(um, v1 - dv * 0.6), ...P(u0 + du, vm - dv)], inner);
}

/** Persian city buildings: domed houses, wind-tower houses and an iwan house; the grand one is a domed fire temple. */
function drawPersianBuilding(ctx: Ctx, x: number, y: number, big: boolean, capital: boolean) {
  const SAND = '#ecd7ad', SAND2 = '#dcc08e', TURQ = '#3fa9c9', GOLD = '#f0c43a', DOOR = '#3a2418';
  if (big) {
    // a terraced platform, an arcaded hall, corner turrets and the turquoise dome of the fire temple
    box(ctx, x, y + 2, 25, 3, '#d9c08f');
    box(ctx, x, y - 1, 17, 11, SAND);
    // right face: an arcade of turquoise-framed niches
    for (const u of [0.1, 0.38, 0.66]) persianArch(ctx, x, y - 1, 17, 11, u, u + 0.24, 0.06, 0.7, TURQ, DOOR);
    // left face: a tiled panel of turquoise with cream diamonds
    const P = (u: number, v: number) => [x - 8.5 + (u * 17) / 2, y - 1 + (17 / 4) * u - v * 11];
    poly(ctx, [...P(0.12, 0.12), ...P(0.88, 0.12), ...P(0.88, 0.7), ...P(0.12, 0.7)], shade(TURQ, -0.05));
    for (const [u, v] of [[0.28, 0.41], [0.5, 0.41], [0.72, 0.41]] as const) poly(ctx, [...P(u, v - 0.16), ...P(u + 0.1, v), ...P(u, v + 0.16), ...P(u - 0.1, v)], '#f4efe0');
    for (const [u, v] of [[0.28, 0.41], [0.5, 0.41], [0.72, 0.41]] as const) poly(ctx, [...P(u, v - 0.07), ...P(u + 0.05, v), ...P(u, v + 0.07), ...P(u - 0.05, v)], GOLD);
    for (const f of ['L', 'R'] as const) {
      const fq = (u0: number, u1: number, v0: number, v1: number, c: string) => poly(ctx, f === 'R' ? [x + (u0 * 17) / 2, y - 1 + (17 / 4) * (1 - u0) - v0 * 11, x + (u1 * 17) / 2, y - 1 + (17 / 4) * (1 - u1) - v0 * 11, x + (u1 * 17) / 2, y - 1 + (17 / 4) * (1 - u1) - v1 * 11, x + (u0 * 17) / 2, y - 1 + (17 / 4) * (1 - u0) - v1 * 11] : [x - 8.5 + (u0 * 17) / 2, y - 1 + (17 / 4) * u0 - v0 * 11, x - 8.5 + (u1 * 17) / 2, y - 1 + (17 / 4) * u1 - v0 * 11, x - 8.5 + (u1 * 17) / 2, y - 1 + (17 / 4) * u1 - v1 * 11, x - 8.5 + (u0 * 17) / 2, y - 1 + (17 / 4) * u0 - v1 * 11], c);
      fq(0, 1, 0.86, 1, TURQ);
      fq(0, 1, 0.84, 0.87, GOLD);
      fq(0, 1, 0, 0.05, SAND2);
    }
    // the turrets on the corners, each under a little dome
    for (const tx of [-8.4, 8.4]) {
      box(ctx, x + tx, y + 1, 4, 9, SAND2);
      ctx.fillStyle = 'rgba(58,36,24,0.85)';
      ctx.fillRect(x + tx - 0.6, y - 4.6, 1.2, 2.6);
      persianDome(ctx, x + tx, y - 8.4, 2.6, 4.6, TURQ);
    }
    // the drum and the great dome
    box(ctx, x, y - 12, 9.6, 3.6, '#f3e2bd');
    band(ctx, x, y - 12, 9.6, 3.6, 0.5, 0.8, TURQ);
    persianDome(ctx, x, y - 15.6, 6.4, 10.4, TURQ, !capital);
    return;
  }
  const v = Math.abs(Math.round(x * 1.7 + y * 2.9)) % 3;
  const w = 11, h = 8;
  const faceR = (u0: number, u1: number, v0: number, v1: number, bh: number, c: string) => poly(ctx, [x + (u0 * w) / 2, y + (w / 4) * (1 - u0) - v0 * bh, x + (u1 * w) / 2, y + (w / 4) * (1 - u1) - v0 * bh, x + (u1 * w) / 2, y + (w / 4) * (1 - u1) - v1 * bh, x + (u0 * w) / 2, y + (w / 4) * (1 - u0) - v1 * bh], c);
  const faceL = (u0: number, u1: number, v0: number, v1: number, bh: number, c: string) => poly(ctx, [x - w / 2 + (u0 * w) / 2, y + (w / 4) * u0 - v0 * bh, x - w / 2 + (u1 * w) / 2, y + (w / 4) * u1 - v0 * bh, x - w / 2 + (u1 * w) / 2, y + (w / 4) * u1 - v1 * bh, x - w / 2 + (u0 * w) / 2, y + (w / 4) * u0 - v1 * bh], c);
  if (v === 0) {
    // a domed house: a glazed dome on a short drum, a pointed arched doorway
    box(ctx, x, y, w, h - 1, SAND);
    persianArch(ctx, x, y, w, h - 1, 0.32, 0.68, 0, 0.62, TURQ, DOOR);
    faceL(0.3, 0.6, 0.35, 0.68, h - 1, DOOR);
    faceR(0, 1, 0.88, 1, h - 1, TURQ);
    faceL(0, 1, 0.88, 1, h - 1, shade(TURQ, -0.1));
    box(ctx, x, y - h + 1, 6.2, 2, '#f3e2bd');
    persianDome(ctx, x, y - h - 1, 3.6, 6.4, TURQ);
  } else if (v === 1) {
    // a house with a badgir wind tower rising over its flat roof: slatted vents, a stepped cap
    box(ctx, x, y, w, h - 2, SAND);
    faceR(0, 1, 0.86, 1, h - 2, SAND2);
    persianArch(ctx, x, y, w, h - 2, 0.6, 0.86, 0, 0.6, TURQ, DOOR);
    faceL(0.25, 0.5, 0.3, 0.64, h - 2, DOOR);
    box(ctx, x - 1.2, y - h + 2, 5.4, 10, '#e5cb9a');
    for (const u of [0.22, 0.58]) for (const [a, b] of [[0.2, 0.42], [0.5, 0.72]] as const) {
      poly(ctx, [x - 1.2 + (u * 5.4) / 2, y - h + 2 + (5.4 / 4) * (1 - u) - a * 10, x - 1.2 + ((u + 0.2) * 5.4) / 2, y - h + 2 + (5.4 / 4) * (1 - u - 0.2) - a * 10, x - 1.2 + ((u + 0.2) * 5.4) / 2, y - h + 2 + (5.4 / 4) * (1 - u - 0.2) - b * 10, x - 1.2 + (u * 5.4) / 2, y - h + 2 + (5.4 / 4) * (1 - u) - b * 10], DOOR);
    }
    box(ctx, x - 1.2, y - h - 8.4, 6.8, 1.4, SAND2);
    box(ctx, x - 1.2, y - h - 9.6, 4.4, 1.2, TURQ);
  } else {
    // an iwan house: a tall tiled arch on the facade beside a small dome
    box(ctx, x, y, w, h, SAND);
    persianArch(ctx, x, y, w, h, 0.18, 0.62, 0, 0.92, TURQ, shade(TURQ, -0.45));
    persianArch(ctx, x, y, w, h, 0.3, 0.5, 0, 0.5, '#f4efe0', DOOR);
    faceR(0, 1, 0.9, 1, h, '#f4efe0');
    faceL(0.2, 0.8, 0.28, 0.62, h, TURQ);
    faceL(0.4, 0.6, 0.36, 0.54, h, '#f4efe0');
    persianDome(ctx, x - 2.6, y - h + 0.4, 2.6, 4.6, TURQ);
  }
}

// ---------------------------------------------------------------- Ottoman trees and buildings

/** The Anatolian hillside: dark cypresses, broad plane trees (çınar), silvery olives and flat-topped stone pines. */
function drawOttomanTree(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  const v = variant % 4;
  if (v === 0) {
    // cypress: a slim, dark, ragged column of stacked foliage drawn to a needle point
    const H = 30 * k;
    ctx.fillStyle = P.trunk;
    ctx.fillRect(x - 0.7 * k, y - 3 * k, 1.4 * k, 3 * k);
    const dark = '#1f4a34', mid = '#2c6647';
    for (let i = 0; i < 9; i++) {
      const t = i / 9, yy = y - 4 * k - t * H * 0.9, r = (3.6 * Math.pow(1 - t, 0.62) + 0.5) * k, sway = Math.sin(variant * 2.1 + t * 4) * 0.5 * k * t;
      ellipse(ctx, x + sway + 0.5 * k, yy + 0.6 * k, r * 1.05, 3.4 * k, shade(dark, -0.15));
      ellipse(ctx, x + sway, yy, r, 3.4 * k, dark);
      ellipse(ctx, x + sway - r * 0.3, yy - 0.5 * k, r * 0.6, 2.6 * k, mid);
      ellipse(ctx, x + sway - r * 0.42, yy - 1 * k, r * 0.26, 1.5 * k, shade(mid, 0.3));
    }
    poly(ctx, [x - 1.1 * k, y - H * 0.9 - 2 * k, x, y - H - 3 * k, x + 1.1 * k, y - H * 0.9 - 2 * k], dark);
    return;
  }
  if (v === 1) {
    // plane tree (çınar): a vast mottled trunk splitting into great limbs under a broad, layered crown
    const bark = '#9a8e76';
    line(ctx, x, y, x + 0.4 * k, y - 9 * k, bark, 4.2 * k);
    line(ctx, x - 1.4 * k, y, x - 1 * k, y - 8 * k, shade(bark, 0.22), 0.9 * k);
    for (const [dx, dy, r] of [[-0.6, -2.6, 1], [0.9, -4.6, 0.9], [-0.6, -6.6, 0.8]] as const) ellipse(ctx, x + dx * k, y + dy * k, r * k, r * 0.8 * k, '#6a5a44'); // peeling patches
    line(ctx, x + 0.4 * k, y - 8 * k, x - 4.4 * k, y - 13 * k, bark, 1.8 * k);
    line(ctx, x + 0.4 * k, y - 8 * k, x + 4.6 * k, y - 12.6 * k, bark, 1.8 * k);
    const leaf = mix(P.forest, '#b8c84a', 0.22);
    ellipse(ctx, x + 0.4 * k, y - 15 * k, 10 * k, 6.4 * k, shade(leaf, -0.34));
    ellipse(ctx, x + 4.2 * k, y - 14 * k, 5.6 * k, 4.2 * k, shade(leaf, -0.18));
    ellipse(ctx, x - 4 * k, y - 16 * k, 5.8 * k, 4.6 * k, shade(leaf, 0));
    ellipse(ctx, x + 0.2 * k, y - 19.6 * k, 5.6 * k, 3.8 * k, shade(leaf, 0.14));
    ellipse(ctx, x - 1.6 * k, y - 20.4 * k, 3 * k, 1.9 * k, shade(leaf, 0.34));
    for (const [dx, dy] of [[-6, -17], [-3, -21.6], [3, -19], [6.4, -15.4], [-1, -13.6], [8, -13]] as const) ellipse(ctx, x + dx * k, y + dy * k, 1.7 * k, 1.1 * k, shade(leaf, 0.4));
    for (const [dx, dy] of [[3, -11.6], [-3, -11.4], [6.6, -12.6]] as const) ellipse(ctx, x + dx * k, y + dy * k, 1.8 * k, 0.9 * k, shade(leaf, -0.5));
    return;
  }
  if (v === 2) {
    // olive: a short, twisted, hollow trunk under a low silver-green crown flecked with black olives
    ctx.strokeStyle = '#6e5a44';
    ctx.lineWidth = 2.6 * k;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 0.4 * k, y);
    ctx.bezierCurveTo(x - 3 * k, y - 3 * k, x + 2.4 * k, y - 5 * k, x - 0.6 * k, y - 8 * k);
    ctx.stroke();
    line(ctx, x - 0.4 * k, y - 5.6 * k, x + 3.8 * k, y - 10 * k, '#6e5a44', 1.4 * k);
    line(ctx, x - 0.6 * k, y - 7.6 * k, x - 3.8 * k, y - 11 * k, '#6e5a44', 1.3 * k);
    ellipse(ctx, x - 0.2 * k, y - 2.6 * k, 0.6 * k, 1 * k, '#2e241a'); // the hollow
    const c = '#8fa07a';
    ellipse(ctx, x + 0.6 * k, y - 13 * k, 8.2 * k, 5 * k, shade(c, -0.3));
    ellipse(ctx, x + 3.4 * k, y - 12.4 * k, 4.4 * k, 3.2 * k, shade(c, -0.14));
    ellipse(ctx, x - 3 * k, y - 13.6 * k, 4.8 * k, 3.6 * k, c);
    ellipse(ctx, x, y - 16 * k, 4.6 * k, 2.8 * k, shade(c, 0.18));
    for (let i = 0; i < 14; i++) { // leaf-flecks in silver and grey-green
      const a = rand(variant + 3, i) * Math.PI * 2, r = 1 + rand(variant + 5, i) * 6.6;
      ellipse(ctx, x + 0.6 * k + Math.cos(a) * r * k, y - 13.6 * k + Math.sin(a) * r * 0.5 * k, 1.1 * k, 0.5 * k, i % 3 ? shade(c, 0.42) : shade(c, -0.36));
    }
    for (const [dx, dy] of [[-4, -11.4], [1, -10.4], [4.6, -12], [-1.6, -14.6]] as const) ellipse(ctx, x + dx * k, y + dy * k, 0.6 * k, 0.7 * k, '#2a2a30');
    return;
  }
  // stone pine: a tall reddish trunk crowned with a flat, spreading umbrella of dark needles
  line(ctx, x, y, x + 0.8 * k, y - 15 * k, '#8a5a3a', 2.4 * k);
  line(ctx, x - 0.6 * k, y, x + 0.2 * k, y - 15 * k, '#b57a52', 0.7 * k);
  for (const t of [0.2, 0.4, 0.6]) line(ctx, x - 1 * k + t * 0.8 * k, y - t * 15 * k, x + 1 * k + t * 0.8 * k, y - t * 15 * k + 0.4 * k, '#5a3a22', 0.5 * k);
  line(ctx, x + 0.8 * k, y - 13 * k, x - 4 * k, y - 16.4 * k, '#8a5a3a', 1.2 * k);
  line(ctx, x + 0.8 * k, y - 13 * k, x + 5 * k, y - 16 * k, '#8a5a3a', 1.2 * k);
  const g = '#3a6a3a';
  for (const [dx, dy, rx, ry, c] of [[0.8, -17.4, 10, 4, shade(g, -0.3)], [6, -16.6, 5.6, 3, shade(g, -0.12)], [-4.6, -17, 6, 3.2, g], [0.4, -20, 6.6, 3.2, shade(g, 0.14)], [-2, -21.2, 3.4, 1.7, shade(g, 0.32)]] as const) ellipse(ctx, x + dx * k, y + dy * k, rx * k, ry * k, c);
  for (const [dx, dy] of [[-6, -16], [-2, -18.4], [3, -18.8], [6.6, -16.4], [0.6, -15.4]] as const) line(ctx, x + dx * k, y + dy * k, x + (dx + 1.6) * k, y + (dy + 0.6) * k, shade(g, 0.4), 0.6 * k); // needle sprays
  ellipse(ctx, x + 2 * k, y - 14.6 * k, 0.9 * k, 1.2 * k, '#7a4a2a'); // a cone
}

/** A hemispherical Ottoman dome: a lit flank, a shaded flank, a gilt rim and ribs, and (optionally) a crescent finial. */
function otDome(ctx: Ctx, x: number, y: number, r: number, h: number, col: string, finial = true, skylights = 0) {
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(x - r, y);
    ctx.bezierCurveTo(x - r, y - h * 1.34, x + r, y - h * 1.34, x + r, y);
    ctx.lineTo(x - r, y);
    ctx.closePath();
  };
  shape();
  ctx.fillStyle = ink(shade(col, 0.1));
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  ctx.fillStyle = ink(shade(col, -0.26));
  ctx.fillRect(x + r * 0.05, y - h * 1.2, r, h * 1.3);
  ctx.fillStyle = ink(shade(col, -0.08));
  ctx.fillRect(x - r * 0.45, y - h * 1.2, r * 0.5, h * 1.3);
  ctx.restore();
  ctx.lineCap = 'round';
  for (const [f, c] of [[-0.62, shade(col, -0.04)], [-0.28, shade(col, -0.18)], [0.3, shade(col, -0.4)], [0.64, shade(col, -0.44)]] as const) { // ribs
    ctx.strokeStyle = ink(c);
    ctx.lineWidth = Math.max(0.4, r * 0.05);
    ctx.beginPath();
    ctx.moveTo(x + f * r, y - 0.2);
    ctx.bezierCurveTo(x + f * r * 1.05, y - h * 0.7, x + f * r * 0.5, y - h * 0.98, x, y - h);
    ctx.stroke();
  }
  ctx.strokeStyle = ink('#f0c43a'); // a gilt ring at the base
  ctx.lineWidth = Math.max(0.7, r * 0.1);
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.26, 0, 0, Math.PI);
  ctx.stroke();
  ellipse(ctx, x - r * 0.4, y - h * 0.62, r * 0.18, r * 0.3, 'rgba(255,255,255,0.4)');
  for (let i = 0; i < skylights; i++) { const a = (i + 0.5) / skylights; ellipse(ctx, x - r * 0.6 + a * r * 1.2, y - h * (0.34 + 0.34 * Math.sin(a * Math.PI)), Math.max(0.4, r * 0.09), Math.max(0.4, r * 0.09), '#23303a'); } // star-shaped skylights of a bath
  if (finial) {
    line(ctx, x, y - h, x, y - h - r * 0.4, '#f0c43a', Math.max(0.7, r * 0.1));
    const cy = y - h - r * 0.7;
    ctx.strokeStyle = ink('#f0c43a');
    ctx.lineWidth = Math.max(0.6, r * 0.11);
    ctx.beginPath();
    ctx.arc(x, cy, r * 0.28, -0.35 * Math.PI, 1.35 * Math.PI, false);
    ctx.stroke();
    ellipse(ctx, x + r * 0.06, cy, Math.max(0.4, r * 0.09), Math.max(0.4, r * 0.09), '#f0c43a');
  }
}

/** A slender pencil minaret: a fluted shaft on a square plinth, a balcony (şerefe) with a rail, and a needle cap topped with a crescent. */
function otMinaret(ctx: Ctx, x: number, y: number, h: number, cap = '#3f9ab5') {
  const w = 1.5;
  box(ctx, x, y, 4.4, 3.4, '#eadfc6'); // the plinth
  const top = y - 3.4;
  const bal = top - h * 0.66, hh = h * 0.66;
  // the lower shaft, lit on the left and shaded on the right, with an ablaq band
  poly(ctx, [x - w, top, x - w * 0.86, bal, x, bal, x, top], '#f4ecd6');
  poly(ctx, [x + w, top, x + w * 0.86, bal, x, bal, x, top], '#cfc2a2');
  line(ctx, x, top, x, bal, '#b8ab8a', 0.4);
  for (const t of [0.3, 0.6]) line(ctx, x - w, top - hh * t, x + w, top - hh * t, '#c8244a', 0.6);
  // the balcony: a flared corbel, a floor and a lattice rail
  poly(ctx, [x - w, bal + 0.2, x - 2.9, bal - 0.8, x + 2.9, bal - 0.8, x + w, bal + 0.2], '#d8cbaa');
  ellipse(ctx, x, bal - 0.8, 3.1, 1.1, '#efe6cc');
  for (let i = 0; i < 6; i++) line(ctx, x - 2.6 + i * 1.04, bal - 0.8, x - 2.6 + i * 1.04, bal - 2.4, '#8a7c5c', 0.4);
  line(ctx, x - 2.8, bal - 2.4, x + 2.8, bal - 2.4, '#8a7c5c', 0.5);
  // the upper shaft, thinner, and a sharp conical cap
  const bt = bal - 2.4, ut = bt - h * 0.12;
  poly(ctx, [x - 1, bt, x - 0.9, ut, x, ut, x, bt], '#f4ecd6');
  poly(ctx, [x + 1, bt, x + 0.9, ut, x, ut, x, bt], '#cfc2a2');
  poly(ctx, [x - 1.5, ut, x, ut - h * 0.24, x, ut + 0.3], shade(cap, 0.1));
  poly(ctx, [x + 1.5, ut, x, ut - h * 0.24, x, ut + 0.3], shade(cap, -0.28));
  line(ctx, x - 1.6, ut + 0.1, x + 1.6, ut + 0.1, '#f0c43a', 0.6);
  const tip = ut - h * 0.24;
  line(ctx, x, tip, x, tip - 1.8, '#f0c43a', 0.5);
  ctx.strokeStyle = ink('#f0c43a');
  ctx.lineWidth = 0.55;
  ctx.beginPath();
  ctx.arc(x, tip - 2.7, 0.95, -0.35 * Math.PI, 1.35 * Math.PI, false);
  ctx.stroke();
}

/** A pointed-arch window or doorway on the right (or left) face of a box at (x, y) of width w and height h. */
function otArch(ctx: Ctx, face: 'L' | 'R', x: number, y: number, w: number, h: number, u0: number, u1: number, v0: number, v1: number, frame: string, inner: string) {
  const P = (u: number, v: number) => (face === 'R' ? [x + (u * w) / 2, y + (w / 4) * (1 - u) - v * h] : [x - w / 2 + (u * w) / 2, y + (w / 4) * u - v * h]);
  const um = (u0 + u1) / 2, vm = v1 - (u1 - u0) * 0.5 * (w / h) * 0.7;
  poly(ctx, [...P(u0, v0), ...P(u1, v0), ...P(u1, vm), ...P(um, v1), ...P(u0, vm)], frame);
  const du = (u1 - u0) * 0.2, dv = (v1 - v0) * 0.07;
  poly(ctx, [...P(u0 + du, v0), ...P(u1 - du, v0), ...P(u1 - du, vm - dv), ...P(um, v1 - dv * 1.6), ...P(u0 + du, vm - dv)], inner);
}

/** Ottoman city buildings: a stone hamam with clustered domes, timber-and-plaster houses with overhanging upper storeys, a bazaar with striped awnings and a small mosque; the grand one is a mosque complex with half-domes and pencil minarets. */
function drawOttomanBuilding(ctx: Ctx, x: number, y: number, big: boolean, capital: boolean) {
  const STONE = '#eadfc6', STONE2 = '#d5c7a4', TQ = '#3f9ab5', RED = '#c8244a', GOLD = '#f0c43a', DOOR = '#2c1c14', LEAD = '#8e9caa', PLASTER = '#f1e6c8', TIMBER = '#5a3a24', TILE = '#b5523a';
  const faces = (w: number, h: number, base: number) => ({
    R: (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, base, w, h, u0, u1, v0, v1, c),
    L: (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'L', x, base, w, h, u0, u1, v0, v1, c),
  });
  if (big) {
    const cw = capital ? 20 : 16, ch = capital ? 10 : 9; // the prayer hall
    const by = y + 1;
    // a courtyard platform under everything
    box(ctx, x, y + 4, capital ? 30 : 25, 2.6, '#d9ccab');
    const ax = capital ? [[-12, 1], [12, 1], [-7, -6], [7, -6]] : [[-11, 2], [11, 2]];
    const mh = capital ? 36 : 32;
    // the back minarets stand behind the hall
    if (capital) for (const [dx, dy] of ax.slice(2)) otMinaret(ctx, x + dx, y + dy + 2, mh);
    // the hall, its walls banded in cream and rose stone, arched windows in two tiers
    box(ctx, x, by, cw, ch, STONE);
    for (const f of [faces(cw, ch, by).R, faces(cw, ch, by).L]) {
      f(0, 1, 0.06, 0.1, STONE2);
      f(0, 1, 0.3, 0.34, '#e6b7a8');
      f(0, 1, 0.9, 1, STONE2);
      f(0, 1, 0.9, 0.925, RED);
    }
    const n = capital ? 4 : 3;
    for (let i = 0; i < n; i++) {
      const u0 = 0.08 + i * (0.86 / n), u1 = u0 + 0.86 / n - 0.06;
      otArch(ctx, 'R', x, by, cw, ch, u0, u1, 0.42, 0.86, TQ, shade(TQ, -0.5));
      otArch(ctx, 'L', x, by, cw, ch, u0, u1, 0.42, 0.86, TQ, shade(TQ, -0.5));
      otArch(ctx, 'R', x, by, cw, ch, u0 + 0.02, u1 - 0.02, 0.06, 0.28, '#c9bb98', '#5a4a36');
    }
    otArch(ctx, 'R', x, by, cw, ch, 0.42, 0.6, 0.06, 0.34, GOLD, DOOR); // the portal
    // half-domes cascade down from the great dome
    const dy0 = by - ch;
    otDome(ctx, x - cw * 0.4, dy0 + 1.6, cw * 0.3, cw * 0.25, LEAD, false);
    otDome(ctx, x + cw * 0.4, dy0 + 1.6, cw * 0.3, cw * 0.25, LEAD, false);
    if (capital) { otDome(ctx, x - cw * 0.22, dy0 - 1.2, cw * 0.2, cw * 0.18, shade(TQ, -0.08), false); otDome(ctx, x + cw * 0.22, dy0 - 1.2, cw * 0.2, cw * 0.18, shade(TQ, -0.08), false); }
    // the drum, pierced with windows, and the great dome
    const dr = capital ? 11 : 9.4;
    box(ctx, x, dy0 - 1.4, dr, 4.2, '#f3e8cc');
    for (const f of ['R', 'L'] as const) for (let i = 0; i < 3; i++) otArch(ctx, f, x, dy0 - 1.4, dr, 4.2, 0.12 + i * 0.29, 0.3 + i * 0.29, 0.22, 0.86, GOLD, '#2a4a5a');
    band(ctx, x, dy0 - 1.4, dr, 4.2, 0.9, 1, GOLD);
    otDome(ctx, x, dy0 - 5.6, capital ? 7.4 : 6.2, capital ? 11 : 9.2, TQ, !capital);
    // the front minarets stand in front of the hall's corners
    for (const [dx, dy] of ax.slice(0, 2)) otMinaret(ctx, x + dx, y + dy + 2.4, mh);
    return;
  }
  const v = Math.abs(Math.round(x * 1.7 + y * 2.9)) % 4;
  if (v === 0) {
    // a hamam: a low stone bath under a cluster of lead domes pricked with skylights, and a wisp of steam
    box(ctx, x, y, 12.4, 5, STONE);
    const f = faces(12.4, 5, y);
    for (const b of [f.R, f.L]) { b(0, 1, 0.3, 0.42, '#e6b7a8'); b(0, 1, 0.66, 0.78, '#e6b7a8'); b(0, 1, 0.9, 1, STONE2); }
    otArch(ctx, 'R', x, y, 12.4, 5, 0.38, 0.62, 0, 0.7, STONE2, DOOR);
    for (const u of [0.12, 0.74]) otArch(ctx, 'R', x, y, 12.4, 5, u, u + 0.14, 0.4, 0.86, '#c9bb98', '#3a4a56');
    otArch(ctx, 'L', x, y, 12.4, 5, 0.4, 0.58, 0.36, 0.86, '#c9bb98', '#3a4a56');
    otDome(ctx, x - 4.2, y - 4.6, 3, 3.2, LEAD, false, 3);
    otDome(ctx, x + 4.6, y - 4, 3.2, 3.4, LEAD, false, 3);
    otDome(ctx, x + 0.2, y - 5.2, 4.4, 5.2, shade(LEAD, 0.06), true, 5);
    ellipse(ctx, x - 5.6, y - 14.6, 1.6, 1.1, 'rgba(255,255,255,0.55)');
    ellipse(ctx, x - 4.6, y - 17.4, 2.1, 1.3, 'rgba(255,255,255,0.4)');
  } else if (v === 1 || v === 2) {
    // a timber-and-plaster house: a stone ground floor, an upper storey jutting out on carved brackets, half-timbering, lattice windows
    const w = 9.4, h1 = 4.6, h2 = 5.6, ow = 12.8;
    box(ctx, x, y, w, h1, '#ddd0ae');
    otArch(ctx, 'R', x, y, w, h1, 0.38, 0.66, 0, 0.72, TIMBER, DOOR);
    otArch(ctx, 'R', x, y, w, h1, 0.08, 0.26, 0.3, 0.72, TIMBER, '#3a4a56');
    faceQuad(ctx, 'L', x, y, w, h1, 0.3, 0.6, 0.3, 0.72, DOOR);
    const uy = y - h1;
    box(ctx, x, uy, ow, h2, PLASTER);
    faceQuad(ctx, 'R', x, uy, ow, h2, 0, 1, 0, 0.1, TIMBER); // the sill beam over the brackets
    faceQuad(ctx, 'L', x, uy, ow, h2, 0, 1, 0, 0.1, TIMBER);
    for (const f of ['R', 'L'] as const) {
      for (const u of [0.02, 0.34, 0.66, 0.96]) faceQuad(ctx, f, x, uy, ow, h2, u - 0.02, u + 0.03, 0, 1, TIMBER); // posts
      faceQuad(ctx, f, x, uy, ow, h2, 0, 1, 0.94, 1, TIMBER);
      faceQuad(ctx, f, x, uy, ow, h2, 0, 1, 0.5, 0.55, TIMBER);
    }
    for (const u of [0.12, 0.44, 0.76]) { // lattice windows with turquoise shutters on the right face
      faceQuad(ctx, 'R', x, uy, ow, h2, u, u + 0.16, 0.6, 0.9, v === 1 ? TQ : '#8a3a30');
      faceQuad(ctx, 'R', x, uy, ow, h2, u + 0.025, u + 0.135, 0.64, 0.86, '#2a3a44');
      faceQuad(ctx, 'R', x, uy, ow, h2, u + 0.075, u + 0.085, 0.64, 0.86, TIMBER);
    }
    faceQuad(ctx, 'L', x, uy, ow, h2, 0.3, 0.5, 0.6, 0.9, '#2a3a44');
    faceQuad(ctx, 'L', x, uy, ow, h2, 0.3, 0.5, 0.6, 0.9, '#2a3a44');
    for (const u of [0.1, 0.4, 0.7, 0.9]) ellipse(ctx, x + (u * ow) / 2, uy + (ow / 4) * (1 - u) + 0.6, 0.55, 0.9, '#3a2418'); // bracket ends under the overhang
    roof(ctx, x, uy - h2, ow + 2.6, 5.2, TILE);
    line(ctx, x - (ow + 2.6) / 2, uy - h2, x, uy - h2 + (ow + 2.6) / 4, shade(TILE, -0.45), 0.6);
    line(ctx, x + (ow + 2.6) / 2, uy - h2, x, uy - h2 + (ow + 2.6) / 4, shade(TILE, -0.55), 0.6);
    if (v === 2) { box(ctx, x + 3.4, uy - h2 - 3.6, 2.2, 3, '#d8ccb0'); box(ctx, x + 3.4, uy - h2 - 6.2, 2.8, 0.9, TIMBER); } // a chimney
  } else if (v === 3 && (Math.round(x) + Math.round(y)) % 2 === 0) {
    // a small neighbourhood mosque: a domed cube with one slender minaret
    box(ctx, x, y, 9.4, 6, STONE);
    const f = faces(9.4, 6, y);
    for (const b of [f.R, f.L]) { b(0, 1, 0.88, 1, RED); b(0, 1, 0.3, 0.34, '#e6b7a8'); }
    otArch(ctx, 'R', x, y, 9.4, 6, 0.36, 0.64, 0, 0.64, TQ, DOOR);
    for (const u of [0.08, 0.72]) otArch(ctx, 'R', x, y, 9.4, 6, u, u + 0.2, 0.38, 0.78, GOLD, '#2a4a5a');
    otArch(ctx, 'L', x, y, 9.4, 6, 0.34, 0.62, 0.34, 0.8, GOLD, '#2a4a5a');
    box(ctx, x, y - 6, 6, 2, '#f3e8cc');
    otDome(ctx, x, y - 8, 4.2, 5, TQ, true);
    otMinaret(ctx, x + 6.6, y + 1.8, 22);
  } else {
    // a bazaar: a row of arched shops under scalloped awnings striped crimson and cream, carpets and lanterns hanging out
    const w = 12.4, h = 6.6;
    box(ctx, x, y, w, h, '#e6d6ae');
    const f = faces(w, h, y);
    f.R(0, 1, 0.92, 1, STONE2); f.L(0, 1, 0.92, 1, STONE2);
    for (let i = 0; i < 3; i++) otArch(ctx, 'R', x, y, w, h, 0.06 + i * 0.32, 0.32 + i * 0.32, 0, 0.6, '#c9b58a', DOOR);
    otArch(ctx, 'L', x, y, w, h, 0.2, 0.46, 0, 0.58, '#c9b58a', DOOR);
    otArch(ctx, 'L', x, y, w, h, 0.56, 0.82, 0, 0.58, '#c9b58a', DOOR);
    // the awnings: slanted strips of striped cloth jutting out over the shopfronts
    const P = (face: 'L' | 'R', u: number, v0: number) => (face === 'R' ? [x + (u * w) / 2, y + (w / 4) * (1 - u) - v0 * h] : [x - w / 2 + (u * w) / 2, y + (w / 4) * u - v0 * h]);
    for (const face of ['R', 'L'] as const) {
      const dx = face === 'R' ? 2 : -2;
      const n = 8;
      for (let i = 0; i < n; i++) {
        const u0 = i / n, u1 = (i + 1) / n, a = P(face, u0, 0.7), b = P(face, u1, 0.7);
        const c = i % 2 ? '#f4ecd6' : face === 'R' ? RED : shade(RED, 0.05);
        poly(ctx, [a[0], a[1], b[0], b[1], b[0] + dx, b[1] + 2.8, a[0] + dx, a[1] + 2.8], face === 'L' ? shade(c, 0.06) : shade(c, -0.16));
        poly(ctx, [a[0] + dx, a[1] + 2.8, (a[0] + b[0]) / 2 + dx, a[1] + 3.8 + (b[1] - a[1]) / 2, b[0] + dx, b[1] + 2.8], face === 'L' ? shade(c, -0.04) : shade(c, -0.26)); // the scalloped valance
      }
    }
    // hanging carpets, lanterns and pots
    const pr = P('R', 0.14, 0.4), pl = P('L', 0.34, 0.4);
    poly(ctx, [pr[0] + 1.2, pr[1] + 2.4, pr[0] + 4.4, pr[1] + 1.2, pr[0] + 4.4, pr[1] + 6.4, pr[0] + 1.2, pr[1] + 7.6], TQ);
    poly(ctx, [pr[0] + 1.2, pr[1] + 4, pr[0] + 4.4, pr[1] + 2.8, pr[0] + 4.4, pr[1] + 3.8, pr[0] + 1.2, pr[1] + 5], '#f4ecd6');
    ellipse(ctx, pl[0] - 1.6, pl[1] + 5, 0.9, 1.2, '#e8a02a');
    ellipse(ctx, pl[0] - 1.6, pl[1] + 4.1, 0.4, 0.4, GOLD);
    ellipse(ctx, x + 5.6, y + 3.6, 1, 0.7, '#b8503a'); // pots
    ellipse(ctx, x + 6.6, y + 4.1, 0.8, 0.6, '#8a5a34');
    // a small dome on the flat roof
    otDome(ctx, x - 1.6, y - h - 0.4, 3.4, 3.6, TQ, true);
  }
}

// ---------------------------------------------------------------- Celtic scenery
const celtInk = (c: string) => c;
function celtRing(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string, w: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
}


/**
 * The sacred grove: gnarled oaks with a flared root-plate, a hollow in the bark, limbs that
 * reach into lumpy clumps of leaf, and balls of mistletoe hanging from the boughs; now and
 * then a dark yew heavy with red berries.
 */
function drawCeltTree(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  const leaf = P.forest, bark = P.trunk;
  const clump = (cx: number, cy: number, r: number, lit = 0) => {
    ellipse(ctx, cx + 0.6 * k, cy + 0.9 * k, r * 1.02, r * 0.82, shade(leaf, -0.34));
    ellipse(ctx, cx, cy, r, r * 0.8, shade(leaf, -0.12 + lit));
    ellipse(ctx, cx - r * 0.22, cy - r * 0.26, r * 0.66, r * 0.5, shade(leaf, 0.1 + lit));
    ellipse(ctx, cx - r * 0.36, cy - r * 0.42, r * 0.3, r * 0.2, shade(leaf, 0.3 + lit));
    for (let i = 0; i < 4; i++) ellipse(ctx, cx + (rand(variant + 7, i + cx) - 0.5) * r * 1.2, cy + (rand(variant + 3, i + cy) - 0.2) * r * 0.7, r * 0.12, r * 0.09, shade(leaf, -0.4)); // leaf-gaps in shadow
  };
  const mistletoe = (mx: number, my: number, r: number) => {
    line(ctx, mx, my - r * 1.6, mx, my - r * 0.4, shade(bark, 0.1), 0.5 * k);
    ellipse(ctx, mx, my, r, r * 0.9, '#7f9a2a');
    ellipse(ctx, mx - r * 0.25, my - r * 0.25, r * 0.7, r * 0.6, '#b4d04a');
    for (const [dx, dy] of [[-0.5, 0.2], [0.4, -0.1], [0.1, 0.6]] as const) ellipse(ctx, mx + dx * r, my + dy * r, r * 0.16, r * 0.16, '#fbfbf0'); // pearly berries
  };
  if (variant % 4 === 3) {
    // a yew: a squat trunk under a dense, dark, rounded crown dotted with red arils
    const yc = shade(leaf, -0.36);
    ctx.fillStyle = shade(bark, -0.2);
    ctx.fillRect(x - 1.2 * k, y - 4 * k, 2.4 * k, 4 * k);
    ellipse(ctx, x, y - 6 * k, 6.2 * k, 5 * k, shade(yc, -0.2));
    ellipse(ctx, x - 0.4 * k, y - 8.6 * k, 5.6 * k, 5.6 * k, yc);
    ellipse(ctx, x + 0.2 * k, y - 12.4 * k, 4.2 * k, 4.6 * k, shade(yc, 0.06));
    ellipse(ctx, x - 1.4 * k, y - 13.4 * k, 1.9 * k, 2 * k, shade(yc, 0.22));
    for (const [dx, dy] of [[-3, -6], [2.6, -8], [-1, -10.5], [3, -5], [0.6, -13], [-3.6, -9]] as const) ellipse(ctx, x + dx * k, y + dy * k, 0.55 * k, 0.55 * k, '#d8382e');
    return;
  }
  const young = variant % 4 === 2;
  const s = young ? 0.72 : 1;
  const H = 11.5 * s * k;
  // the root-plate and trunk, lit on the left and dark on the right
  poly(ctx, [x - 3.6 * s * k, y + 0.7 * k, x - 1.8 * s * k, y - 3 * k, x - 2.4 * s * k, y - 7.4 * s * k, x - 1.3 * s * k, y - H, x, y - H, x, y + 1.4 * k], shade(bark, 0.08));
  poly(ctx, [x, y - H, x + 1.5 * s * k, y - H, x + 1.1 * s * k, y - 7.4 * s * k, x + 2.1 * s * k, y - 3 * k, x + 3.8 * s * k, y + 0.9 * k, x, y + 1.4 * k], shade(bark, -0.22));
  ellipse(ctx, x - 0.5 * s * k, y - 5.4 * s * k, 0.9 * s * k, 1.3 * s * k, '#231509'); // the hollow
  ellipse(ctx, x - 0.5 * s * k, y - 6.2 * s * k, 0.7 * s * k, 0.5 * s * k, shade(bark, -0.5));
  for (const [dx, dy] of [[-1.6, -3], [1.2, -8], [-1.4, -9.4], [1.6, -4.4]] as const) line(ctx, x + dx * s * k, y + dy * s * k, x + (dx + 0.3) * s * k, y + (dy - 1.6) * s * k, shade(bark, -0.5), 0.5 * k); // furrows
  line(ctx, x - 3.4 * s * k, y + 0.6 * k, x - 5 * s * k, y + 1.2 * k, shade(bark, -0.1), 1 * k); // roots gripping the ground
  line(ctx, x + 3.6 * s * k, y + 0.8 * k, x + 5.4 * s * k, y + 1.4 * k, shade(bark, -0.3), 1 * k);
  ellipse(ctx, x - 4 * s * k, y + 0.6 * k, 1.6 * k, 0.6 * k, '#4f8a3a'); // moss at the foot
  // limbs that twist out to the clumps
  const top = y - H;
  line(ctx, x - 0.4 * k, top + 1 * k, x - 6.6 * s * k, top - 4.4 * s * k, bark, 2 * s * k);
  line(ctx, x + 0.6 * k, top + 1 * k, x + 6.4 * s * k, top - 3.4 * s * k, shade(bark, -0.2), 1.8 * s * k);
  line(ctx, x, top, x + 0.6 * k, top - 6 * s * k, bark, 1.8 * s * k);
  const back = [x - 0.6 * k, top - 10.2 * s * k, 6.4 * s * k] as const;
  clump(back[0], back[1], back[2], -0.04);
  clump(x - 7.2 * s * k, top - 3.6 * s * k, 6 * s * k);
  clump(x + 7.2 * s * k, top - 2.4 * s * k, 5.8 * s * k, -0.05);
  if (!young) clump(x + 0.4 * k, top - 3.6 * k, 6.6 * k, 0.02);
  else clump(x + 0.2 * k, top - 3 * k, 5 * k, 0.02);
  if (!young) { mistletoe(x + 4.6 * k, top + 2.6 * k, 1.6 * k); mistletoe(x - 5 * k, top + 3 * k, 1.4 * k); mistletoe(x + 0.6 * k, top - 8.4 * k, 1.2 * k); }
  else mistletoe(x + 3.6 * k * s, top + 2.4 * k, 1.3 * k);
  if (!young) for (const [dx, dy] of [[-3, 0.6], [3, 1.6], [7.6, -0.6]] as const) ellipse(ctx, x + dx * k, top + dy * k, 0.55 * k, 0.75 * k, '#8a6a2a'); // acorns
}

/** Stones set in a ring: grey, lichen-crowned and leaning a little. */
function standingStones(ctx: Ctx, x: number, y: number, k: number) {
  const n = 6;
  const stones = Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 + 0.4; return { a, sx: x + Math.cos(a) * 7 * k, sy: y + Math.sin(a) * 3.5 * k, h: (5 + ((i * 7) % 4)) * k, w: (1.9 + (i % 2) * 0.7) * k, lean: ((i % 3) - 1) * 0.5 * k }; }).sort((p, q) => p.sy - q.sy);
  ellipse(ctx, x, y + 0.6 * k, 9.4 * k, 4.6 * k, '#5b9a44'); // trodden grass
  ellipse(ctx, x, y + 0.4 * k, 8 * k, 3.8 * k, '#6fb04f');
  let altar = false;
  for (const s of stones) {
    if (!altar && s.sy > y) { altar = true; box(ctx, x, y + 0.6 * k, 4.4 * k, 1.6 * k, '#9aa0a0'); } // a low altar slab in the middle
    const l = s.sx - s.w, r = s.sx + s.w, bY = s.sy + 0.8 * k, tY = bY - s.h;
    poly(ctx, [l, bY, l + s.lean * 0.4, tY + 1.4 * k, s.sx + s.lean, tY, s.sx, bY + 0.6 * k], '#b6bbb8');
    poly(ctx, [s.sx, bY + 0.6 * k, s.sx + s.lean, tY, r + s.lean * 0.4, tY + 1.6 * k, r, bY], '#8b9290');
    ellipse(ctx, s.sx + s.lean, tY + 0.6 * k, s.w * 0.6, 0.7 * k, '#7fa05a'); // lichen on the crown
    line(ctx, s.sx - s.w * 0.2, bY - s.h * 0.35, s.sx - s.w * 0.1, bY - s.h * 0.7, '#6a716f', 0.4 * k); // a weathered crack
  }
  if (!altar) box(ctx, x, y + 0.6 * k, 4.4 * k, 1.6 * k, '#9aa0a0');
}

/** A carved high cross: a ringed head, a tapering shaft and a stepped plinth, its faces covered with knotwork. */
function highCross(ctx: Ctx, x: number, y: number) {
  const lit = '#b4b9b6', dk = '#8b9290', kn = '#6a716f';
  box(ctx, x, y + 1, 9, 2.4, '#9aa0a0');
  box(ctx, x, y - 1.2, 6, 2.4, '#a6acaa');
  poly(ctx, [x - 1.8, y - 3.6, x - 1.4, y - 17, x, y - 17, x, y - 3.6], lit); // shaft
  poly(ctx, [x, y - 3.6, x, y - 17, x + 1.4, y - 17, x + 1.8, y - 3.6], dk);
  poly(ctx, [x - 5.6, y - 13.8, x - 5.6, y - 10.6, x, y - 10.6, x, y - 13.8], lit); // arms
  poly(ctx, [x, y - 13.8, x, y - 10.6, x + 5.6, y - 10.6, x + 5.6, y - 13.8], dk);
  poly(ctx, [x - 1.4, y - 20.4, x - 1.4, y - 17, x, y - 17, x, y - 20.4], lit); // head
  poly(ctx, [x, y - 20.4, x, y - 17, x + 1.4, y - 17, x + 1.4, y - 20.4], dk);
  ctx.strokeStyle = lit;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x, y - 12.2, 4.4, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke(); // the ring: lit half...
  ctx.strokeStyle = dk;
  ctx.beginPath(); ctx.arc(x, y - 12.2, 4.4, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke(); // ...dark half
  ctx.strokeStyle = kn;
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.arc(x, y - 12.2, 2.2, 0, Math.PI * 2); ctx.stroke(); // a boss of interlace at the crossing
  for (const t of [0.15, 0.35, 0.55, 0.75]) { // knotwork down the shaft
    line(ctx, x - 1, y - 4.4 - t * 11, x + 1, y - 5.6 - t * 11, kn, 0.5);
    line(ctx, x + 1, y - 4.4 - t * 11, x - 1, y - 5.6 - t * 11, kn, 0.5);
  }
  ellipse(ctx, x, y - 12.2, 0.9, 0.9, kn);
  ellipse(ctx, x - 4, y + 1.6, 2.2, 0.7, '#5b9a44'); // moss on the plinth
}

/** A round thatched house: a whitewashed wattle-and-daub drum under a steep thatch cone. */
function roundHouse(ctx: Ctx, x: number, y: number, r: number, wallH: number, roofH: number, thatch: string, opts: { wall?: string; band?: string; big?: boolean } = {}) {
  const wall = opts.wall ?? '#efe4c8';
  const R = r * 1.24; // the thatch overhangs the wall
  // wall drum
  ellipse(ctx, x, y + 0.4, r + 0.6, r * 0.5 + 0.4, shade(wall, -0.42));
  ctx.fillStyle = celtInk(shade(wall, 0.04));
  ctx.fillRect(x - r, y - wallH, r, wallH);
  ctx.fillStyle = celtInk(shade(wall, -0.2));
  ctx.fillRect(x, y - wallH, r, wallH);
  ellipse(ctx, x, y, r, r * 0.5, shade(wall, 0.02));
  ctx.save();
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.5, 0, 0, Math.PI); ctx.lineTo(x - r, y - wallH); ctx.ellipse(x, y - wallH, r, r * 0.5, 0, Math.PI, 0, true); ctx.closePath(); ctx.clip();
  ctx.fillStyle = celtInk(shade(wall, -0.2));
  ctx.fillRect(x, y - wallH - r, r + 1, wallH + r * 2);
  ctx.fillStyle = celtInk(shade(wall, 0.04));
  ctx.fillRect(x - r - 1, y - wallH - r, r + 1, wallH + r * 2);
  // timber posts and a wattle panel bound between them
  for (let i = -3; i <= 3; i++) {
    const a = (i / 3) * 1.25, px = x + Math.sin(a) * r, py = y + Math.cos(a) * r * 0.5;
    line(ctx, px, py, px, py - wallH, '#6a4a2a', Math.max(0.6, r * 0.09));
  }
  ctx.strokeStyle = celtInk('#9a7a4a');
  ctx.lineWidth = 0.5;
  for (const f of [0.3, 0.6]) { ctx.beginPath(); ctx.ellipse(x, y - wallH * f, r, r * 0.5, 0, 0.1, Math.PI - 0.1); ctx.stroke(); }
  if (opts.band) { ctx.fillStyle = celtInk(opts.band); ctx.beginPath(); ctx.ellipse(x, y - wallH + 0.6, r, r * 0.5, 0, 0, Math.PI); ctx.lineTo(x - r, y - wallH - 0.8); ctx.ellipse(x, y - wallH - 0.8, r, r * 0.5, 0, Math.PI, 0, true); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  // the doorway: a dark arch under a lintel
  const dx = x + r * 0.34, dy = y + r * 0.47;
  ctx.fillStyle = celtInk('#2a1a10');
  ctx.beginPath(); ctx.moveTo(dx - r * 0.2, dy); ctx.lineTo(dx - r * 0.2, dy - wallH * 0.66); ctx.quadraticCurveTo(dx, dy - wallH * 0.92, dx + r * 0.2, dy - wallH * 0.66); ctx.lineTo(dx + r * 0.2, dy); ctx.closePath(); ctx.fill();
  line(ctx, dx - r * 0.28, dy - wallH * 0.7, dx + r * 0.28, dy - wallH * 0.7, '#6a4a2a', 0.9);
  // the thatched cone
  const ey = y - wallH, ay = ey - roofH;
  const cone = (c: string, side: number) => {
    ctx.fillStyle = celtInk(c);
    ctx.beginPath();
    if (side <= 0) { ctx.moveTo(x, ay); ctx.lineTo(x - R, ey); ctx.ellipse(x, ey, R, R * 0.5, 0, Math.PI, Math.PI / 2, true); ctx.lineTo(x, ay); }
    else { ctx.moveTo(x, ay); ctx.lineTo(x + R, ey); ctx.ellipse(x, ey, R, R * 0.5, 0, 0, Math.PI / 2, false); ctx.lineTo(x, ay); }
    ctx.closePath(); ctx.fill();
  };
  ctx.fillStyle = celtInk(shade(thatch, -0.3));
  ellipse(ctx, x, ey + 0.6, R + 0.4, R * 0.5 + 0.4, shade(thatch, -0.35));
  cone(shade(thatch, 0.1), -1);
  cone(shade(thatch, -0.24), 1);
  // rows of straw laid down the slope, bound with rings of withy
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI, ex = x - Math.cos(a) * R, ey2 = ey + Math.sin(a) * R * 0.5;
    ctx.strokeStyle = celtInk(shade(thatch, i > 5 ? -0.42 : -0.32));
    ctx.beginPath(); ctx.moveTo(x, ay + roofH * 0.05); ctx.lineTo(ex, ey2); ctx.stroke();
  }
  for (const f of [0.38, 0.68]) {
    ctx.strokeStyle = celtInk(shade(thatch, -0.45));
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    const rr = R * f;
    ctx.ellipse(x, ey - roofH * (1 - f) + 0, rr + 0.2, rr * 0.5, 0, 0.12, Math.PI - 0.12);
    ctx.stroke();
  }
  // ragged eave and a smoke-blackened crown
  ctx.strokeStyle = celtInk(shade(thatch, -0.5));
  ctx.lineWidth = 0.6;
  for (let i = 1; i < 12; i++) { const a = (i / 12) * Math.PI, ex = x - Math.cos(a) * R, ey2 = ey + Math.sin(a) * R * 0.5; ctx.beginPath(); ctx.moveTo(ex, ey2 - 0.4); ctx.lineTo(ex + (i % 2 ? 0.3 : -0.3), ey2 + 1.3); ctx.stroke(); }
  ellipse(ctx, x, ay + 0.8, r * 0.18, r * 0.1, '#3a2a18');
  // crossed finial sticks
  line(ctx, x - 1.4, ay - 1.6, x + 1.4, ay + 0.2, '#5a3a1e', 0.8);
  line(ctx, x + 1.4, ay - 1.6, x - 1.4, ay + 0.2, '#5a3a1e', 0.9);
}

/** A ring of pointed stakes, front half only: the palisade. */
function palisade(ctx: Ctx, x: number, y: number, r: number, h: number, from = 0.12, to = 0.88) {
  const n = Math.max(8, Math.round(r * 1.5));
  for (let i = 0; i <= n; i++) {
    const t = from + (to - from) * (i / n), a = t * Math.PI, px = x - Math.cos(a) * r, py = y + Math.sin(a) * r * 0.5;
    const hh = h * (0.85 + ((i * 5) % 3) * 0.12);
    poly(ctx, [px - 0.9, py, px - 0.9, py - hh, px, py - hh - 1.6, px + 0.9, py - hh, px + 0.9, py], i % 2 ? '#8a6a3f' : '#a58250');
    poly(ctx, [px, py - hh - 1.6, px + 0.9, py - hh, px + 0.9, py, px, py], '#5e4425');
  }
  ctx.strokeStyle = celtInk('#4a3320');
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) { const t = from + (to - from) * (i / n), a = t * Math.PI, px = x - Math.cos(a) * r, py = y + Math.sin(a) * r * 0.5 - h * 0.45; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
  ctx.stroke(); // the binding rail
}

function drawCeltBuilding(ctx: Ctx, x: number, y: number, big: boolean, roofC: string, capital: boolean) {
  const key = `${x},${y}`;
  if (big) {
    // the great hall: a broad roundhouse under a tall thatch cone with a painted tartan band and shields by the door, inside a palisade
    roundHouse(ctx, x, y, 9, 8.5, 11, roofC, { band: '#b02e28', big: true });
    for (const [sx, sy, c] of [[x + 3.4, y + 3.6, '#3f7a3a'], [x + 7.2, y + 2.4, '#b02e28']] as const) { ellipse(ctx, sx, sy, 1.7, 1.7, c); celtRing(ctx, sx, sy, 1.7, 1.7, "#c9974a", 0.5); ellipse(ctx, sx, sy, 0.5, 0.5, '#e8c25a'); }
    palisade(ctx, x, y + 1, 12.5, 4.4, 0.1, 0.9);
    if (capital) return;
    ellipse(ctx, x + 0.4, y - 25, 2.2, 1.4, 'rgba(230,230,235,0.55)'); // a wisp of hearth smoke
    ellipse(ctx, x + 1.6, y - 28, 1.6, 1.1, 'rgba(230,230,235,0.4)');
    return;
  }
  switch (key) {
    case '0,8': standingStones(ctx, x, y, 0.9); break;
    case '7,-7': highCross(ctx, x, y); break;
    case '10,2':
      roundHouse(ctx, x, y, 5.4, 6.4, 7.6, roofC, { wall: '#e6d9b8' });
      palisade(ctx, x, y + 1, 8.4, 3, 0.05, 0.95); // a stake-fenced yard
      break;
    case '-14,-3': { // a granary: a straw stack beside a small thatched store on staddle stones
      for (const [px, py] of [[-3, 1.5], [3, 1.5], [0, 3]] as const) ellipse(ctx, x + px, y + py, 1.3, 0.7, '#8a9090');
      roundHouse(ctx, x - 1.4, y - 1, 4.6, 4, 6.5, roofC, { wall: '#c9a878' });
      ellipse(ctx, x + 6.4, y + 1.4, 3.4, 1.6, shade(roofC, -0.3));
      poly(ctx, [x + 3, y + 1.2, x + 6.4, y - 8, x + 9.8, y + 1.2], shade(roofC, 0.08));
      poly(ctx, [x + 6.4, y - 8, x + 9.8, y + 1.2, x + 6.4, y + 2.6], shade(roofC, -0.26));
      line(ctx, x + 6.4, y - 8, x + 6.4, y - 10.4, '#5a3a1e', 0.8);
      break;
    }
    default:
      roundHouse(ctx, x, y, key === '-6,-8' ? 4.8 : 5.4, 6.4, key === '-6,-8' ? 6.8 : 7.6, roofC, { band: key === '-10,2' ? '#3f7a3a' : undefined });
  }
}

// ---------------------------------------------------------------- Chinese trees and buildings (Han dynasty)

const CNB_RED = '#b8281f', CNB_LAC = '#7a1d18', CNB_GOLD = '#e8c25a', CNB_WALL = '#eee4cc', CNB_CAP = '#4a4e5a', CNB_STONE = '#c4c0b4', CNB_JADE = '#3a8a7a';

/** A red paper lantern on a cord. */
function cnLantern(ctx: Ctx, x: number, y: number, s: number) {
  line(ctx, x, y - 2 * s, x, y, '#3a2a1a', 0.4);
  ellipse(ctx, x, y + 1.3 * s, 1.15 * s, 1.5 * s, CNB_RED);
  ellipse(ctx, x - 0.3 * s, y + 0.9 * s, 0.45 * s, 0.7 * s, '#f08a6a');
  line(ctx, x - 0.9 * s, y + 0.2 * s, x + 0.9 * s, y + 0.2 * s, CNB_GOLD, 0.4);
  line(ctx, x, y + 2.8 * s, x, y + 4.2 * s, CNB_GOLD, 0.4);
}

/**
 * The Chinese landscape: dense groves of bamboo, gnarled pines pruned into layered clouds,
 * weeping willows, and plum trees in blossom.
 */
function drawChinaTree(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  const kind = [0, 1, 0, 2, 3, 0, 1, 3][((variant % 8) + 8) % 8];
  const leaf = P.forest, bark = P.trunk;
  if (kind === 0) {
    // bamboo: tall jointed green culms, each with drooping plumes of narrow leaves near the top
    ctx.fillStyle = 'rgba(70,120,50,0.35)';
    ellipse(ctx, x, y + 0.4 * k, 6 * k, 1.8 * k, 'rgba(70,120,50,0.35)');
    const culms = [[-4.4, 17], [-2.2, 24], [0, 20], [2.2, 26], [4.4, 18]] as const;
    culms.forEach(([dx, hh], i) => {
      const bx = x + dx * k, h = (hh + (rand(variant + 2, i) - 0.5) * 3) * k, lean = (i - 2) * 0.35 * k;
      line(ctx, bx, y, bx + lean, y - h, i % 2 ? '#4f9a44' : '#62ae52', 1.5 * k);
      line(ctx, bx - 0.5 * k, y, bx - 0.5 * k + lean, y - h, '#a8dc7c', 0.45 * k);
      for (let n = 1; n * 4.2 * k < h; n++) {
        const t = (n * 4.2 * k) / h, nx = bx + lean * t, ny = y - n * 4.2 * k;
        line(ctx, nx - 1 * k, ny + 0.2 * k, nx + 1 * k, ny - 0.2 * k, '#2f6a30', 0.5 * k);
      }
      const tx = bx + lean, ty = y - h;
      for (const [ox, oy] of [[0, 0], [-0.4, 3.4], [0.4, 6.4]] as const) for (let j = 0; j < 4; j++) {
        const a = (j - 1.5) * 0.7 + (i % 2 ? 0.2 : -0.2);
        const lx = tx + Math.sin(a) * 4.4 * k, ly = ty + oy * k + Math.abs(Math.cos(a)) * 1.2 * k + 1.6 * k + Math.abs(a) * 2 * k;
        poly(ctx, [tx + ox * k, ty + oy * k, lx, ly, tx + ox * k + Math.sin(a) * 1.6 * k, ty + oy * k + 1.4 * k], (j + i) % 2 ? shade(leaf, 0.18) : shade(leaf, -0.02));
      }
    });
    return;
  }
  if (kind === 1) {
    // a pine pruned in layered clouds on a twisted trunk
    line(ctx, x - 0.4 * k, y, x + 1 * k, y - 6 * k, bark, 2.4 * k);
    line(ctx, x + 1 * k, y - 6 * k, x - 1 * k, y - 13 * k, bark, 2 * k);
    line(ctx, x - 1 * k, y - 13 * k, x + 0.4 * k, y - 19 * k, bark, 1.6 * k);
    line(ctx, x - 1.2 * k, y, x - 1.2 * k, y - 5 * k, shade(bark, 0.3), 0.6 * k);
    for (const t of [3, 8, 14]) line(ctx, x - 1 * k, y - t * k, x + 1 * k, y - (t - 0.5) * k, shade(bark, -0.4), 0.5 * k); // bark plates
    const pad = (px: number, py: number, r: number, c: number) => {
      ellipse(ctx, px + 0.5 * k, py + 1.1 * k, r, r * 0.42, shade(leaf, -0.42));
      ellipse(ctx, px, py, r, r * 0.42, shade(leaf, -0.2 + c));
      ellipse(ctx, px - r * 0.2, py - r * 0.12, r * 0.72, r * 0.26, shade(leaf, 0.02 + c));
      ellipse(ctx, px - r * 0.34, py - r * 0.22, r * 0.34, r * 0.12, shade(leaf, 0.22 + c));
      for (let i = 0; i < 5; i++) line(ctx, px - r * 0.7 + i * r * 0.35, py + r * 0.05, px - r * 0.7 + i * r * 0.35 + 0.6 * k, py + r * 0.36, shade(leaf, -0.4), 0.4 * k);
    };
    pad(x - 5.4 * k, y - 8 * k, 6 * k, -0.04);
    pad(x + 5 * k, y - 12.4 * k, 5.6 * k, 0);
    pad(x - 3.4 * k, y - 16.6 * k, 5.2 * k, 0.04);
    pad(x + 1.4 * k, y - 21 * k, 4.4 * k, 0.08);
    return;
  }
  if (kind === 2) {
    // a weeping willow: a stout trunk, a mound of leaf, and long pale strands sweeping down
    line(ctx, x, y, x + 0.6 * k, y - 9 * k, bark, 3 * k);
    line(ctx, x - 0.8 * k, y, x - 0.2 * k, y - 9 * k, shade(bark, 0.3), 0.6 * k);
    line(ctx, x + 0.4 * k, y - 8 * k, x - 4 * k, y - 12.6 * k, bark, 1.5 * k);
    line(ctx, x + 0.6 * k, y - 8.4 * k, x + 4.6 * k, y - 12.4 * k, bark, 1.4 * k);
    ellipse(ctx, x, y - 13 * k, 8 * k, 4.6 * k, shade(leaf, 0.06));
    ellipse(ctx, x - 1.6 * k, y - 14.2 * k, 5.2 * k, 3 * k, shade(leaf, 0.24));
    for (let i = 0; i < 15; i++) {
      const t = i / 14, sx = x + (t - 0.5) * 15.2 * k, sy = y - 12.6 * k + Math.abs(t - 0.5) * 3 * k;
      const len = (10 - Math.abs(t - 0.5) * 6 + rand(variant, i) * 2.4) * k, sway = ((t - 0.5) * 2.6 + (rand(variant + 1, i) - 0.5) * 1.6) * k;
      ctx.strokeStyle = ink(i % 2 ? shade(leaf, 0.3) : shade(leaf, 0.12));
      ctx.lineWidth = 0.75 * k;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx + sway * 0.4, sy + len * 0.5, sx + sway, sy + len);
      ctx.stroke();
    }
    return;
  }
  // a plum tree in blossom: black twisted limbs starred with pink and white flowers
  line(ctx, x, y, x - 0.6 * k, y - 5 * k, shade(bark, -0.35), 2.6 * k);
  const br: [number, number, number, number, number][] = [[-0.6, -5, -6, -10, 1.5], [-0.6, -5, 4.4, -9.6, 1.5], [-2.4, -8, -3, -15, 1.1], [2.2, -8.6, 6.6, -14, 1.1], [-3.6, -11, 1, -17.6, 1]];
  for (const [ax, ay, bx, by, w] of br) line(ctx, x + ax * k, y + ay * k, x + bx * k, y + by * k, shade(bark, -0.35), w * k);
  const blossoms = [[-6, -10], [-4.4, -13], [-3, -15.6], [-1.4, -12], [1, -17.6], [3, -14.4], [4.6, -10], [6.6, -13.6], [2, -11], [-2.4, -9], [5.4, -16], [-5.6, -15], [0.2, -14.6]] as const;
  for (const [bx, by] of blossoms) ellipse(ctx, x + bx * k, y + by * k, 2.6 * k, 2.1 * k, 'rgba(240,150,175,0.6)');
  blossoms.forEach(([bx, by], i) => {
    ellipse(ctx, x + bx * k, y + by * k, 1.5 * k, 1.3 * k, i % 3 === 0 ? '#f8d2dc' : i % 3 === 1 ? '#f2a2b8' : '#ffffff');
    ellipse(ctx, x + (bx + 0.3) * k, y + (by + 0.2) * k, 0.4 * k, 0.4 * k, '#c8506a');
  });
  for (const [dx, dy] of [[-4, 0.8], [2, 1.4], [5, 0.4], [-1, 1.8]] as const) ellipse(ctx, x + dx * k, y + dy * k, 0.7 * k, 0.35 * k, '#f8d2dc'); // fallen petals
}

/** A hipped roof of grey-and-vermilion tiles: the eaves sag in a curve and the corners flick upward. */
function cnRoof(ctx: Ctx, x: number, y: number, hw: number, h: number, color: string, curl = 2) {
  const hh = hw / 2;
  const face = (s: -1 | 1, c: string) => {
    ctx.fillStyle = ink(c);
    ctx.beginPath();
    ctx.moveTo(x + s * (hw + curl), y - curl * 1.1);
    ctx.quadraticCurveTo(x + s * hw * 0.5, y + hh * 0.7, x, y + hh + 0.8);
    ctx.lineTo(x, y - h);
    ctx.closePath();
    ctx.fill();
  };
  face(-1, shade(color, 0.12));
  face(1, shade(color, -0.24));
  for (const s of [-1, 1] as const) {
    for (const t of [0.2, 0.4, 0.6, 0.8]) {
      const P0x = x + s * (hw + curl), P0y = y - curl * 1.1, Cx = x + s * hw * 0.5, Cy = y + hh * 0.7, P2x = x, P2y = y + hh + 0.8;
      const px = (1 - t) * (1 - t) * P0x + 2 * (1 - t) * t * Cx + t * t * P2x, py = (1 - t) * (1 - t) * P0y + 2 * (1 - t) * t * Cy + t * t * P2y;
      line(ctx, x, y - h, px, py, shade(color, s < 0 ? -0.2 : -0.42), 0.4);
    }
    ctx.strokeStyle = ink(shade(color, s < 0 ? -0.5 : -0.62));
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x + s * (hw + curl), y - curl * 1.1);
    ctx.quadraticCurveTo(x + s * hw * 0.5, y + hh * 0.7, x, y + hh + 0.8);
    ctx.stroke();
    poly(ctx, [x + s * (hw + curl), y - curl * 1.1, x + s * (hw + curl + 1.2), y - curl * 1.1 - 2.4, x + s * (hw + curl - 2.6), y - curl * 0.2], shade(color, s < 0 ? 0.1 : -0.3)); // the upturned corner
  }
  line(ctx, x, y - h, x, y + hh + 0.8, shade(color, -0.55), 0.7);
  ellipse(ctx, x, y - h - 0.6, 0.9, 0.9, CNB_GOLD);
  line(ctx, x, y - h - 1, x, y - h - 3, CNB_GOLD, 0.6);
}

/** A tiled-roofed pavilion of red pillars: a wall of pale plaster, timber beams, a doorway, a latticed window. */
function cnHouse(ctx: Ctx, x: number, y: number, w: number, h: number, roofC: string, roofH: number, door = true) {
  box(ctx, x, y, w, h, CNB_WALL, shade(CNB_WALL, 0.05));
  for (const f of ['L', 'R'] as const) {
    faceQuad(ctx, f, x, y, w, h, 0, 1, 0.86, 1, CNB_LAC); // the beam under the eaves
    for (let i = 0; i < 4; i++) faceQuad(ctx, f, x, y, w, h, 0.08 + i * 0.25, 0.16 + i * 0.25, 0.86, 0.96, CNB_JADE); // blue-green bracket sets
    faceQuad(ctx, f, x, y, w, h, 0, 0.07, 0, 0.86, CNB_RED); // red corner pillars
    faceQuad(ctx, f, x, y, w, h, 0.93, 1, 0, 0.86, CNB_RED);
  }
  faceQuad(ctx, 'R', x, y, w, h, 0, 0.06, 0, 0.86, CNB_RED);
  if (door) {
    faceQuad(ctx, 'R', x, y, w, h, 0.28, 0.56, 0, 0.6, CNB_LAC);
    faceQuad(ctx, 'R', x, y, w, h, 0.31, 0.53, 0, 0.56, '#2a1410');
    faceQuad(ctx, 'R', x, y, w, h, 0.42, 0.44, 0, 0.56, CNB_GOLD);
  }
  faceQuad(ctx, 'L', x, y, w, h, 0.3, 0.72, 0.28, 0.66, CNB_RED);
  faceQuad(ctx, 'L', x, y, w, h, 0.35, 0.67, 0.33, 0.61, '#c9974a');
  for (const u of [0.46, 0.56]) faceQuad(ctx, 'L', x, y, w, h, u, u + 0.02, 0.33, 0.61, CNB_LAC);
  faceQuad(ctx, 'L', x, y, w, h, 0.35, 0.67, 0.46, 0.48, CNB_LAC);
  cnRoof(ctx, x, y - h, w * 0.5 + 2.2, roofH, roofC);
}

/** A tiered pagoda: storeys that shrink as they rise, each under its own upturned roof, and a gilded spire. */
function cnPagoda(ctx: Ctx, x: number, y: number, roofC: string, tiers: number, base: number) {
  box(ctx, x, y + 0.6, base + 3, 2, CNB_STONE, shade(CNB_STONE, 0.2));
  let cy = y;
  for (let i = 0; i < tiers; i++) {
    const w = base - i * 1.7, h = 4.4;
    box(ctx, x, cy, w, h, i % 2 ? '#f1e8d2' : CNB_WALL, '#e0d4b4');
    for (const f of ['L', 'R'] as const) {
      faceQuad(ctx, f, x, cy, w, h, 0, 0.1, 0, 1, CNB_RED);
      faceQuad(ctx, f, x, cy, w, h, 0.9, 1, 0, 1, CNB_RED);
      faceQuad(ctx, f, x, cy, w, h, 0.36, 0.64, 0.2, 0.78, '#3a1a12');
    }
    faceQuad(ctx, 'R', x, cy, w, h, 0.4, 0.6, 0.24, 0.74, CNB_GOLD);
    cnRoof(ctx, x, cy - h, w * 0.5 + 3.4 - i * 0.3, 3.4, roofC, 1.8);
    cy -= h + 2.6;
  }
  line(ctx, x, cy + 2.4, x, cy - 3, '#7a5a1e', 1.1);
  for (const t of [0.2, 0.5, 0.8]) ellipse(ctx, x, cy + 2 - t * 4, 1.5 - t * 0.6, 0.5, CNB_GOLD);
  ellipse(ctx, x, cy - 3.6, 0.9, 0.9, CNB_GOLD);
}

/** A low whitewashed wall, capped in grey tile, along one side of a courtyard. */
function cnWall(ctx: Ctx, ax: number, ay: number, bx: number, by: number, h: number, shadeAmt: number) {
  poly(ctx, [ax, ay, bx, by, bx, by - h, ax, ay - h], shade(CNB_WALL, shadeAmt));
  poly(ctx, [ax, ay - h, bx, by - h, bx, by - h - 1.2, ax, ay - h - 1.2], shade(CNB_CAP, shadeAmt * 0.6));
  for (let i = 1; i < 4; i++) line(ctx, ax + (bx - ax) * i / 4, ay + (by - ay) * i / 4 - h, ax + (bx - ax) * i / 4, ay + (by - ay) * i / 4 - h - 1.2, shade(CNB_CAP, -0.4), 0.3);
}

/** A courtyard house: a walled yard with a red-pillared gate in its front wall, and a hall behind. */
function cnCourtyard(ctx: Ctx, x: number, y: number, roofC: string) {
  const a = 9.4, hh = a / 2, wh = 3.2;
  const N = [x, y - hh], E = [x + a, y], S = [x, y + hh], W = [x - a, y];
  ellipse(ctx, x, y + 0.6, a + 0.6, hh + 0.6, '#c9b98e');
  cnWall(ctx, W[0], W[1], N[0], N[1], wh, 0.02); // back walls
  cnWall(ctx, N[0], N[1], E[0], E[1], wh, -0.16);
  cnHouse(ctx, x - 0.6, y - 0.4, 8, 5.4, roofC, 4.4);
  cnWall(ctx, W[0], W[1], S[0], S[1], wh, 0.06); // front walls, the right one holding the gate
  const gx = x + a * 0.5, gy = y + hh * 0.5;
  cnWall(ctx, S[0], S[1], x + a * 0.28, y + hh * 0.72, wh, -0.2);
  cnWall(ctx, x + a * 0.72, y + hh * 0.28, E[0], E[1], wh, -0.2);
  box(ctx, x + a * 0.32, y + hh * 0.68, 1.5, 6, CNB_RED, shade(CNB_RED, 0.2)); // the gate pillars
  box(ctx, x + a * 0.68, y + hh * 0.32, 1.5, 6, CNB_RED, shade(CNB_RED, 0.2));
  cnRoof(ctx, gx, gy - 5.6, 5.6, 2.6, roofC, 1.4);
  cnLantern(ctx, gx - 2.6, gy - 5.4, 0.8);
}

/** An open pavilion: four red pillars under a high roof, with a hanging lantern. */
function cnPavilion(ctx: Ctx, x: number, y: number, roofC: string) {
  ellipse(ctx, x, y + 0.4, 6.4, 3.2, CNB_STONE);
  box(ctx, x, y, 11, 1.6, '#d6d2c6', '#e4e0d4');
  for (const [px, py] of [[x - 4.4, y - 1.2], [x + 4.4, y - 1.2], [x, y - 3.4], [x, y + 1.4]] as const) box(ctx, px, py, 1.4, 6.6, CNB_RED, shade(CNB_RED, 0.2));
  line(ctx, x - 4.4, y - 7, x, y - 5.4, CNB_LAC, 0.9);
  line(ctx, x + 4.4, y - 7, x, y - 5.4, CNB_LAC, 0.9);
  cnRoof(ctx, x, y - 7.6, 8, 4.8, roofC, 2);
  cnLantern(ctx, x, y - 5.2, 0.8);
}

/** The palace hall: a stone terrace with steps, a red-pillared hall under a double roof, and (for the capital) a third storey crowned in gold. */
function cnPalace(ctx: Ctx, x: number, y: number, roofC: string, capital: boolean) {
  box(ctx, x, y + 1, 26, 3, '#b9b5a8', '#d2cec2'); // lower terrace
  box(ctx, x, y - 1.2, 22, 2.6, CNB_STONE, '#dcd8cc');
  faceQuad(ctx, 'R', x, y - 1.2, 22, 2.6, 0.06, 0.94, 0.86, 1, '#e4e0d4');
  for (let i = 0; i < 4; i++) faceQuad(ctx, 'R', x, y + 1, 26, 3, 0.02 + i * 0.05, 0.05 + i * 0.05, 0.06, 0.04 + i * 0.22, '#9a968a'); // the stair
  poly(ctx, [x + 0.4, y + 4.4, x + 4.4, y + 2.4, x + 4.4, y + 0.6, x + 0.4, y + 2.6], CNB_RED); // a red carpet up the steps
  box(ctx, x, y - 3.4, 17, 8.4, CNB_WALL, '#e8dcc0'); // the hall
  for (const f of ['L', 'R'] as const) {
    faceQuad(ctx, f, x, y - 3.4, 17, 8.4, 0, 1, 0.84, 1, CNB_LAC);
    for (let i = 0; i < 5; i++) faceQuad(ctx, f, x, y - 3.4, 17, 8.4, 0.05 + i * 0.19, 0.16 + i * 0.19, 0.86, 0.97, CNB_JADE);
    for (let i = 0; i <= 5; i++) faceQuad(ctx, f, x, y - 3.4, 17, 8.4, i * 0.19 - 0.02, i * 0.19 + 0.04, 0, 0.84, CNB_RED); // a colonnade of red pillars
  }
  for (const [u0, u1] of [[0.2, 0.36], [0.6, 0.78]] as const) { faceQuad(ctx, 'R', x, y - 3.4, 17, 8.4, u0 + 0.04, u1 - 0.02, 0.06, 0.64, '#3a1a12'); faceQuad(ctx, 'R', x, y - 3.4, 17, 8.4, u0 + 0.04, u1 - 0.02, 0.6, 0.64, CNB_GOLD); }
  faceQuad(ctx, 'R', x, y - 3.4, 17, 8.4, 0.4, 0.58, 0.04, 0.7, '#1c0e0a');
  faceQuad(ctx, 'R', x, y - 3.4, 17, 8.4, 0.42, 0.56, 0.6, 0.66, CNB_GOLD); // the great door and its gilt lintel
  for (let i = 0; i < 3; i++) faceQuad(ctx, 'L', x, y - 3.4, 17, 8.4, 0.16 + i * 0.28, 0.32 + i * 0.28, 0.24, 0.64, '#c9974a');
  cnRoof(ctx, x, y - 11.8, 17.4, 6.4, roofC, 2.6); // the lower eaves
  cnLantern(ctx, x - 9.4, y - 5.6, 0.85);
  cnLantern(ctx, x + 9.4, y - 5.4, 0.85);
  box(ctx, x, y - 14.4, 10, 4, '#f1e8d2', '#e0d4b4');
  faceQuad(ctx, 'R', x, y - 14.4, 10, 4, 0.1, 0.9, 0.7, 1, CNB_LAC);
  for (const f of ['L', 'R'] as const) for (let i = 0; i < 3; i++) faceQuad(ctx, f, x, y - 14.4, 10, 4, 0.06 + i * 0.4, 0.12 + i * 0.4, 0, 0.7, CNB_RED);
  cnRoof(ctx, x, y - 18.2, 11.4, 5.6, roofC, 2.2); // the upper eaves
  if (capital) {
    box(ctx, x, y - 20.6, 6.2, 3, '#f7f0dc', '#e0d4b4');
    faceQuad(ctx, 'R', x, y - 20.6, 6.2, 3, 0.4, 0.6, 0.2, 0.8, CNB_GOLD);
    cnRoof(ctx, x, y - 23.2, 7.4, 4.8, '#d8a838', 1.8); // a gilded crowning roof
    for (const s of [-1, 1]) ellipse(ctx, x + s * 9.8, y - 12.6, 0.8, 1.1, CNB_GOLD);
  } else {
    for (const s of [-1, 1]) ellipse(ctx, x + s * 12, y - 12.8, 0.8, 1.1, CNB_GOLD);
  }
}

function drawChinaBuilding(ctx: Ctx, x: number, y: number, big: boolean, roofC: string, capital: boolean) {
  if (big) return cnPalace(ctx, x, y, roofC, capital);
  const v = ((Math.round(x * 3 + y * 5) % 4) + 4) % 4;
  if (v === 0) cnHouse(ctx, x, y, 10, 6.4, roofC, 5);
  else if (v === 1) cnPagoda(ctx, x, y, roofC, 3, 8.4);
  else if (v === 2) cnCourtyard(ctx, x, y, roofC);
  else cnPavilion(ctx, x, y, roofC);
}

// ---------------------------------------------------------------- Mali: Sahel trees and sun-baked mud-brick (banco) towns

const ML_WALL = '#cf9d6a', ML_WALL_D = '#b07f4e', ML_TORON = '#4a2e1a', ML_EGG = '#f6eedb', ML_INDIGO = '#2d43a0', ML_GOLDC = '#e3ac2a';

/** The Sahel: baobabs, flat-topped acacias, date and doum palms, shea trees and dry thorn scrub. */
function mlTree(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  const kind = ['acacia', 'date', 'baobab', 'shea', 'scrub', 'doum', 'scrub'][variant % 7];
  ctx.lineCap = 'round';
  const curve = (x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, w: number, c: string) => {
    ctx.strokeStyle = ink(c);
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx, cy, x1, y1);
    ctx.stroke();
  };
  const leaf = P.forest;
  const clump = (cx: number, cy: number, r: number, c: string) => {
    ellipse(ctx, cx + 0.5 * k, cy + 0.8 * k, r * 1.02, r * 0.6, shade(c, -0.3));
    ellipse(ctx, cx, cy, r, r * 0.6, c);
    ellipse(ctx, cx - r * 0.25, cy - r * 0.22, r * 0.62, r * 0.36, shade(c, 0.18));
  };
  if (kind === 'baobab') {
    // a great swollen bottle trunk with fissured grey-brown bark and a handful of stubby, tangled limbs
    const bark = '#8a7460';
    poly(ctx, [x - 4.8 * k, y, x - 4.4 * k, y - 6 * k, x - 3.2 * k, y - 11 * k, x - 3.6 * k, y - 14 * k, x, y - 14.6 * k, x, y + 1.6 * k], shade(bark, 0.08));
    poly(ctx, [x + 4.8 * k, y, x + 4.4 * k, y - 6 * k, x + 3.2 * k, y - 11 * k, x + 3.6 * k, y - 14 * k, x, y - 14.6 * k, x, y + 1.6 * k], shade(bark, -0.26));
    ellipse(ctx, x, y + 0.6 * k, 5 * k, 1.8 * k, shade(bark, -0.32));
    for (const [dx, dy, l] of [[-3, -2, 9], [-1.4, -3, 10], [1.6, -2.4, 9], [3.2, -3.6, 8]] as const) line(ctx, x + dx * k, y + dy * k, x + (dx + 0.3) * k, y + (dy - l) * k, shade(bark, -0.36), 0.5 * k); // fissures
    for (const [dx, dy] of [[-2, -6.4], [2.2, -8.4]] as const) line(ctx, x + dx * k - 1 * k, y + dy * k, x + dx * k + 1 * k, y + (dy + 0.3) * k, shade(bark, -0.4), 0.5 * k);
    ellipse(ctx, x + 1.6 * k, y - 5 * k, 0.9 * k, 1.5 * k, '#3a2a1e'); // a hollow
    const top = { x, y: y - 14.4 * k };
    for (const [ex, ey, w] of [[-8, -6.4, 1.9], [-3.4, -8.6, 1.6], [3, -9, 1.6], [8.4, -5.6, 1.9], [0.6, -5, 1.4]] as const) {
      curve(top.x, top.y, top.x + ex * 0.5 * k, top.y + ey * 0.5 * k - 1 * k, top.x + ex * k, top.y + ey * k, w * k, shade(bark, -0.1));
      line(ctx, top.x + ex * k, top.y + ey * k, top.x + (ex + Math.sign(ex || 1) * 1.6) * k, top.y + (ey - 2.2) * k, shade(bark, -0.1), 0.9 * k);
    }
    for (const [ex, ey, r] of [[-8.6, -7.6, 3], [-3.4, -10.6, 2.6], [3, -11, 2.6], [8.4, -7.2, 3], [0, -8.2, 2.2]] as const) clump(top.x + ex * k, top.y + ey * k, r * k, shade(leaf, -0.02));
    for (const [ex, ey] of [[-7, -4], [6.4, -3.4]] as const) { line(ctx, top.x + ex * k, top.y + ey * k, top.x + ex * k, top.y + (ey + 2) * k, '#4a3a2a', 0.4 * k); ellipse(ctx, top.x + ex * k, top.y + (ey + 3.4) * k, 0.8 * k, 1.5 * k, '#7a6244'); } // hanging pods
    return;
  }
  if (kind === 'acacia') {
    // a flat-topped umbrella thorn: a slender, forking trunk under a wide, layered canopy
    const bark = shade(P.trunk, -0.1);
    curve(x, y, x - 1 * k, y - 6 * k, x + 0.6 * k, y - 11 * k, 2.2 * k, bark);
    curve(x + 0.6 * k, y - 10 * k, x - 3 * k, y - 12 * k, x - 6 * k, y - 15 * k, 1.2 * k, bark);
    curve(x + 0.6 * k, y - 10 * k, x + 3.6 * k, y - 12 * k, x + 6.6 * k, y - 14.6 * k, 1.2 * k, bark);
    line(ctx, x - 0.2 * k, y, x + 0.1 * k, y - 9 * k, shade(bark, 0.3), 0.5 * k);
    const c0 = '#8fa845';
    ellipse(ctx, x + 0.6 * k, y - 15.6 * k, 12.6 * k, 3.6 * k, shade(c0, -0.34));
    ellipse(ctx, x + 0.2 * k, y - 16.4 * k, 12 * k, 3.4 * k, shade(c0, -0.1));
    ellipse(ctx, x - 0.8 * k, y - 17.6 * k, 9.6 * k, 2.6 * k, c0);
    ellipse(ctx, x - 2.4 * k, y - 18.2 * k, 6 * k, 1.6 * k, shade(c0, 0.22));
    for (const [dx, dy] of [[-7, -14], [-2, -14], [4, -14.4], [8, -15]] as const) ellipse(ctx, x + dx * k, y + dy * k, 1.2 * k, 0.6 * k, shade(c0, -0.42)); // the shaded underside
    return;
  }
  if (kind === 'date' || kind === 'doum') {
    const doum = kind === 'doum';
    const bark = '#7a5a3a';
    const frond = (cx: number, cy: number, a: number, len: number, c: string) => {
      const tx = cx + Math.cos(a) * len * k, ty = cy + Math.sin(a) * len * 0.55 * k + len * 0.34 * k;
      const mx = cx + Math.cos(a) * len * 0.55 * k, my = cy + Math.sin(a) * len * 0.5 * k - 0.4 * k;
      poly(ctx, [cx, cy - 0.6 * k, mx, my - 1.5 * k, tx, ty, mx, my + 1.3 * k], c);
      poly(ctx, [cx, cy - 0.6 * k, mx, my - 1.5 * k, tx, ty], shade(c, 0.16));
      line(ctx, cx, cy, tx, ty, shade(c, -0.34), 0.4 * k);
    };
    if (!doum) {
      // a date palm: a tall ringed trunk leaning gently, a crown of arched pinnate fronds and hanging date clusters
      curve(x, y, x + 2.4 * k, y - 11 * k, x + 1.4 * k, y - 21 * k, 2.4 * k, bark);
      for (let i = 0; i < 7; i++) line(ctx, x + (0.8 + i * 0.26) * k - 1.2 * k, y - (2.4 + i * 2.8) * k, x + (0.8 + i * 0.26) * k + 1.2 * k, y - (2 + i * 2.8) * k, shade(bark, -0.36), 0.5 * k);
      const cx = x + 1.4 * k, cy = y - 21.4 * k;
      for (let i = 0; i < 9; i++) frond(cx, cy, -Math.PI / 2 + (i - 4) * 0.52, 11, i % 2 ? shade(leaf, -0.12) : shade(leaf, 0.04));
      for (const [dx, dy] of [[-1.2, 2.2], [0.4, 3], [1.6, 2.2]] as const) { line(ctx, cx + dx * k, cy + 1 * k, cx + dx * k, cy + dy * k, '#4a3a20', 0.4 * k); ellipse(ctx, cx + dx * k, cy + (dy + 0.6) * k, 0.9 * k, 1.1 * k, '#c8641e'); }
      return;
    }
    // a doum palm: the trunk forks in two, each crowned with a stiff fan of leaves
    curve(x, y, x, y - 7 * k, x, y - 9 * k, 2.6 * k, bark);
    for (const [s, h] of [[-1, 18], [1, 22]] as const) {
      curve(x, y - 8 * k, x + s * 3 * k, y - 12 * k, x + s * 5 * k, y - h * k, 1.7 * k, bark);
      const cx = x + s * 5 * k, cy = y - h * k;
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.44, ex = cx + Math.cos(a) * 8 * k, ey = cy + Math.sin(a) * 6.4 * k;
        poly(ctx, [cx, cy, ex - 1 * k, ey, ex + 1 * k, ey + 0.4 * k], i % 2 ? leaf : shade(leaf, 0.2));
      }
      ellipse(ctx, cx + 0.8 * k, cy + 1.6 * k, 1.1 * k, 1.1 * k, '#a8642a'); // hard doum nuts
    }
    return;
  }
  if (kind === 'shea') {
    // a shea (karité) tree: a short rough trunk under a dense rounded crown, with plum-like fruit
    ctx.fillStyle = shade(P.trunk, -0.1);
    ctx.fillRect(x - 1.6 * k, y - 6 * k, 3.2 * k, 6 * k);
    ctx.fillStyle = shade(P.trunk, -0.35);
    ctx.fillRect(x, y - 6 * k, 1.6 * k, 6 * k);
    for (const [dx, dy, r] of [[-4.4, -11.4, 4.6], [4.4, -11.4, 4.6], [0, -14.4, 5.4], [-1, -9.6, 4.6], [3, -8.8, 3.6]] as const) clump(x + dx * k, y + dy * k, r * k, shade(leaf, -0.14));
    for (const [dx, dy] of [[-2.6, -8.4], [3.2, -10.6], [0.4, -12.6], [-4.6, -11]] as const) ellipse(ctx, x + dx * k, y + dy * k, 0.7 * k, 0.7 * k, '#c9b23a');
    return;
  }
  // sparse Sahel scrub: a thorny bush and tufts of dry straw-coloured grass
  const straw = '#c9b060';
  for (const [dx, dy, l, c] of [[-3, 0, 6, straw], [-1.6, 0.4, 8, shade(straw, -0.14)], [0.4, 0, 7, straw], [2, 0.4, 5, shade(straw, 0.18)], [3.4, 0, 6.4, shade(straw, -0.1)], [-4.4, 0.2, 4.6, shade(straw, 0.12)]] as const)
    line(ctx, x + dx * k, y + dy * k, x + (dx + (dx > 0 ? 1.6 : -1.6)) * k, y - l * k, c, 0.8 * k);
  for (const [dx, dy] of [[-5, -2.4], [-2, -4.4], [1.6, -3.4], [5, -2.8]] as const) line(ctx, x + dx * k, y + dy * k + 3 * k, x + dx * k, y + dy * k, shade(straw, -0.3), 0.4 * k);
  curve(x + 5 * k, y, x + 6.4 * k, y - 4 * k, x + 9.4 * k, y - 6 * k, 0.9 * k, '#6a5238'); // a thorn bush
  curve(x + 6.2 * k, y - 2 * k, x + 4.6 * k, y - 5 * k, x + 4 * k, y - 7.4 * k, 0.7 * k, '#6a5238');
  for (const [dx, dy] of [[9, -6.4], [7.6, -4.6], [4.2, -7.6], [6, -3.4], [5, -5.4]] as const) ellipse(ctx, x + dx * k, y + dy * k, 1 * k, 0.7 * k, i8(dx));
}
const i8 = (n: number) => (Math.abs(Math.round(n)) % 2 ? '#8fa845' : '#a0b455');

/** A pointed pinnacle capped with an ostrich egg. */
function mlPinnacle(ctx: Ctx, x: number, y: number, w: number, h: number, c: string) {
  poly(ctx, [x - w / 2, y, x, y + w / 4, x, y - h], shade(c, 0.06));
  poly(ctx, [x + w / 2, y, x, y + w / 4, x, y - h], shade(c, -0.2));
  ellipse(ctx, x, y - h - 0.8, 0.85, 1.15, ML_EGG);
  ellipse(ctx, x - 0.25, y - h - 1.1, 0.3, 0.4, '#ffffff');
}

/** Toron: the palm-wood beams that bristle from banco walls, drawn as short stubs with round ends. */
function mlToron(ctx: Ctx, face: 'L' | 'R', cx: number, cy: number, w: number, h: number, v: number, n: number, u0 = 0.12, u1 = 0.88) {
  for (let i = 0; i < n; i++) {
    const u = u0 + ((u1 - u0) * (n === 1 ? 0.5 : i / (n - 1)));
    const px = face === 'R' ? cx + (u * w) / 2 : cx - w / 2 + (u * w) / 2;
    const py = face === 'R' ? cy + (w / 4) * (1 - u) - v * h : cy + (w / 4) * u - v * h;
    const dx = face === 'R' ? 1.2 : -1.2;
    line(ctx, px, py, px + dx, py + 0.6, ML_TORON, 0.9);
    ellipse(ctx, px + dx, py + 0.6, 0.5, 0.5, '#2a1a0e');
  }
}

/** A tapering banco tower with rows of toron beams and a conical, egg-topped cap. */
function mlTower(ctx: Ctx, cx: number, cy: number, bw: number, tw: number, h: number, capH: number, wall: string, rows: number, beamsPerRow = 2) {
  const hb = bw / 2, ht = tw / 2;
  poly(ctx, [cx - hb, cy, cx, cy + bw / 4, cx, cy + tw / 4 - h, cx - ht, cy - h], shade(wall, 0.06));
  poly(ctx, [cx + hb, cy, cx, cy + bw / 4, cx, cy + tw / 4 - h, cx + ht, cy - h], shade(wall, -0.2));
  line(ctx, cx, cy + bw / 4, cx, cy + tw / 4 - h, shade(wall, 0.3), 0.5);
  for (let r = 0; r < rows; r++) {
    const f = (r + 0.7) / (rows + 0.4);
    const half = hb + (ht - hb) * f, fy = cy + bw / 4 + (tw / 4 - bw / 4 - h) * f, ly = cy - h * f;
    for (const face of ['L', 'R'] as const) {
      for (let i = 0; i < beamsPerRow; i++) {
        const u = beamsPerRow === 1 ? 0.5 : 0.25 + i * (0.5 / (beamsPerRow - 1));
        const px = face === 'R' ? cx + half * u : cx - half * (1 - u);
        const py = face === 'R' ? fy + u * (ly - fy) : ly + u * (fy - ly);
        const dx = face === 'R' ? 1 : -1;
        line(ctx, px, py, px + dx, py + 0.5, ML_TORON, 0.8);
        ellipse(ctx, px + dx, py + 0.5, 0.45, 0.45, '#2a1a0e');
      }
    }
  }
  mlPinnacle(ctx, cx, cy - h + tw / 4 * 0.35, tw + 0.8, capH, shade(wall, 0.04));
}

/** A little arched doorway cut into a wall. */
function mlDoor(ctx: Ctx, face: 'L' | 'R', cx: number, cy: number, w: number, h: number, u0: number, u1: number, v1: number) {
  faceQuad(ctx, face, cx, cy, w, h, u0 - 0.03, u1 + 0.03, 0, v1 + 0.04, shade(ML_WALL, 0.2)); // a pale plastered frame
  faceQuad(ctx, face, cx, cy, w, h, u0, u1, 0, v1, '#2a1a10');
  const um = (u0 + u1) / 2;
  const px = face === 'R' ? cx + (um * w) / 2 : cx - w / 2 + (um * w) / 2;
  const py = face === 'R' ? cy + (w / 4) * (1 - um) - v1 * h : cy + (w / 4) * um - v1 * h;
  ellipse(ctx, px, py, ((u1 - u0) * w) / 4, ((u1 - u0) * w) / 5, '#2a1a10');
}

function mlHouse(ctx: Ctx, x: number, y: number, w: number, h: number, roofC: string, tall: boolean) {
  box(ctx, x, y, w, h, ML_WALL, shade(ML_WALL, 0.22));
  for (const u of [0.1, 0.55]) { faceQuad(ctx, 'R', x, y, w, h, u, u + 0.05, 0.05, 0.96, shade(ML_WALL, 0.14)); faceQuad(ctx, 'L', x, y, w, h, u + 0.15, u + 0.2, 0.05, 0.96, shade(ML_WALL, 0.14)); } // plastered pilaster strips
  faceQuad(ctx, 'R', x, y, w, h, 0.62, 0.68, 0.32, 0.44, '#2a1a10'); // a slit window
  faceQuad(ctx, 'L', x, y, w, h, 0.3, 0.36, 0.46, 0.6, '#2a1a10');
  mlToron(ctx, 'R', x, y, w, h, 0.72, 3, 0.1, 0.9);
  mlToron(ctx, 'L', x, y, w, h, 0.72, 3, 0.1, 0.9);
  mlDoor(ctx, 'R', x, y, w, h, 0.22, 0.44, 0.5);
  for (const [dx, dy] of [[-w * 0.44, 0.1], [w * 0.44, 0.1], [0, -w * 0.22]] as const) mlPinnacle(ctx, x + dx, y - h + dy + 0.4, 2.4, 2.6, ML_WALL);
  if (tall) { // a second, smaller storey with a domed lookout
    box(ctx, x - 1, y - h - 0.4, w * 0.56, h * 0.7, ML_WALL, shade(ML_WALL, 0.22));
    mlToron(ctx, 'R', x - 1, y - h - 0.4, w * 0.56, h * 0.7, 0.66, 2, 0.2, 0.8);
    mlPinnacle(ctx, x - 1, y - h - 0.4 - h * 0.7 + 0.4, 3.4, 4, ML_WALL);
  }
  void roofC;
}

/** The mosque: a long banco hall with tall buttress towers along its front, a rear minaret and rows of toron beams. */
function mlMosque(ctx: Ctx, x: number, y: number, capital: boolean) {
  const W = capital ? 24 : 18, H = capital ? 8.5 : 7;
  box(ctx, x, y + 2, W + 4, 2.4, '#a9895c', '#c4a878'); // a plinth
  box(ctx, x, y, W, H, ML_WALL, shade(ML_WALL, 0.22));
  for (let i = 0; i < 4; i++) faceQuad(ctx, 'L', x, y, W, H, 0.06 + i * 0.26, 0.1 + i * 0.26, 0.05, 0.95, shade(ML_WALL, 0.1)); // plastered pilaster strips
  mlToron(ctx, 'L', x, y, W, H, 0.78, capital ? 5 : 4, 0.1, 0.9);
  mlDoor(ctx, 'L', x, y, W, H, 0.4, 0.58, 0.5); // the main portal
  faceQuad(ctx, 'L', x, y, W, H, 0.36, 0.62, 0.6, 0.66, shade(ML_WALL, 0.28));
  // the flat terraced roof carries a stout rear minaret and egg-tipped pinnacles along the parapet
  mlTower(ctx, x - 2.4, y - H + 1, capital ? 9 : 7, capital ? 6.2 : 5, capital ? 15 : 11, capital ? 4.4 : 3.6, ML_WALL, 2);
  for (const [dx, dy] of [[-W * 0.46, 0.2], [W * 0.46, 0.2], [0, -W * 0.24]] as const) mlPinnacle(ctx, x + dx, y - H + dy + 0.6, 3.2, 3.4, ML_WALL);
  // the stout buttress towers along the front (right-hand) wall
  const us = capital ? [0.16, 0.5, 0.84] : [0.24, 0.76];
  for (const u of us) {
    const bx = x + (u * W) / 2, by = y + (W / 4) * (1 - u) + 0.2;
    mlTower(ctx, bx, by, capital ? 6.2 : 5.4, capital ? 4.6 : 4, H + (capital ? 4 : 3.4), capital ? 3.8 : 3.2, ML_WALL, 2, 1);
  }
}

/** A round mud-plastered granary raised on stones, with a conical thatch. */
function mlGranary(ctx: Ctx, x: number, y: number, r: number, hgt: number, thatch: string) {
  ellipse(ctx, x, y + 0.4, r + 0.4, (r + 0.4) * 0.5, '#a89878'); // stone footing
  ctx.fillStyle = ML_WALL;
  ctx.beginPath();
  ctx.moveTo(x - r, y - 2);
  ctx.lineTo(x - r * 0.92, y - hgt);
  ctx.lineTo(x + r * 0.92, y - hgt);
  ctx.lineTo(x + r, y - 2);
  ctx.ellipse(x, y - 2, r, r * 0.5, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = ML_WALL_D;
  ctx.beginPath();
  ctx.moveTo(x + r * 0.18, y - 2 + r * 0.49);
  ctx.lineTo(x + r * 0.18, y - hgt + r * 0.46);
  ctx.lineTo(x + r * 0.92, y - hgt);
  ctx.lineTo(x + r, y - 2);
  ctx.ellipse(x, y - 2, r, r * 0.5, 0, 0, Math.PI * 0.4);
  ctx.closePath();
  ctx.fill();
  ellipse(ctx, x, y - hgt, r * 0.92, r * 0.46, shade(ML_WALL, 0.16));
  for (const [dx, dy] of [[-r * 0.5, -hgt * 0.55], [r * 0.1, -hgt * 0.35]] as const) ellipse(ctx, x + dx, y + dy, 0.9, 0.6, shade(ML_WALL, -0.2)); // plaster patches
  poly(ctx, [x - r * 0.24, y - 1.4, x - r * 0.24, y - 4.8, x, y - 5.6, x + r * 0.24, y - 4.8, x + r * 0.24, y - 1.2], '#2a1a10'); // the little door
  poly(ctx, [x, y - hgt - r * 0.95, x - r - 1, y - hgt + 0.4, x, y - hgt + r * 0.5], shade(thatch, 0.1));
  poly(ctx, [x, y - hgt - r * 0.95, x + r + 1, y - hgt + 0.4, x, y - hgt + r * 0.5], shade(thatch, -0.24));
  for (const f of [0.4, 0.7]) { ctx.strokeStyle = shade(thatch, -0.34); ctx.lineWidth = 0.5; ctx.beginPath(); ctx.ellipse(x, y - hgt - r * 0.95 * (1 - f) + 0.2, (r + 1) * f, (r + 1) * f * 0.5, 0, 0.05 * Math.PI, 0.95 * Math.PI); ctx.stroke(); }
  ellipse(ctx, x, y - hgt - r * 0.95 - 0.8, 0.7, 0.9, ML_EGG);
}

/** A Tuareg caravan tent of striped indigo and gold cloth over leather, salt slabs stacked beside it and a kneeling camel. */
function mlTent(ctx: Ctx, x: number, y: number, roofC: string) {
  // the camel, kneeling behind
  const camel = '#c9a06a';
  ellipse(ctx, x + 8.4, y + 1.8, 4.6, 1.6, 'rgba(0,0,0,0.16)');
  ellipse(ctx, x + 8.4, y - 2.2, 4.4, 2.4, shade(camel, -0.18));
  ellipse(ctx, x + 8, y - 2.8, 4.2, 2.2, camel);
  ellipse(ctx, x + 7, y - 5.6, 1.6, 1.8, shade(camel, 0.05)); // hump
  poly(ctx, [x + 10.8, y - 3.4, x + 12, y - 8.4, x + 13.4, y - 8.6, x + 12.4, y - 3], camel); // neck
  ellipse(ctx, x + 14, y - 8.6, 1.5, 0.9, shade(camel, 0.06)); // head
  line(ctx, x + 12.6, y - 8.8, x + 13.2, y - 9.6, shade(camel, -0.3), 0.5);
  poly(ctx, [x + 5, y - 1.6, x + 4.8, y + 0.8, x + 6, y + 0.8], shade(camel, -0.3)); // folded legs
  poly(ctx, [x + 10, y - 1, x + 10.2, y + 1, x + 11.4, y + 0.6], shade(camel, -0.3));
  poly(ctx, [x + 6, y - 4.8, x + 9.6, y - 4.4, x + 9.2, y - 2.8, x + 6.4, y - 3], ML_INDIGO); // a striped saddle blanket
  line(ctx, x + 6.4, y - 4, x + 9.4, y - 3.7, ML_GOLDC, 0.6);
  // salt slabs
  box(ctx, x - 9.4, y + 3, 4.4, 2.4, '#ece9e0');
  box(ctx, x - 8.6, y + 0.8, 3.6, 2, '#dedad0');
  // the tent: a stout pyramid of woven stripes
  const tx = x - 2, hw = 6.6, ap = y - 10;
  roof(ctx, tx, y, hw * 2, 10, shade(roofC, -0.1));
  const along = (t: number, side: 'L' | 'R') => side === 'L' ? [tx - hw + hw * t, y + (hw / 2) * t] : [tx + hw * t, y + hw / 2 - (hw / 2) * t];
  for (let i = 0; i < 4; i++) {
    const t0 = 0.08 + i * 0.24, t1 = t0 + 0.13, c = i % 2 ? ML_INDIGO : ML_GOLDC;
    for (const side of ['L', 'R'] as const) { const p0 = along(t0, side), p1 = along(t1, side); poly(ctx, [tx, ap, p0[0], p0[1], p1[0], p1[1]], side === 'L' ? c : shade(c, -0.24)); }
  }
  poly(ctx, [tx - 1.6, y + hw / 2 - 0.6, tx, y + hw / 2 - 5, tx + 1.6, y + hw / 2 - 0.6, tx, y + hw / 2 + 0.2], '#2a1a10'); // the door flap
  line(ctx, tx, ap, tx, ap - 3, '#4a2e16', 0.9);
  ellipse(ctx, tx, ap - 3.4, 0.9, 0.9, ML_GOLDC);
  line(ctx, tx - hw, y, tx - hw - 2.4, y + 2.8, '#4a2e16', 0.6); // guy ropes
  line(ctx, tx + hw, y, tx + hw + 1.8, y + 2.6, '#4a2e16', 0.6);
  ellipse(ctx, tx + 3.6, y + 3.8, 1.3, 1, '#a3722c'); // a water bag
}

/** A walled family compound: a low banco wall with a gateway, and a house and a big water jar inside. */
function mlCompound(ctx: Ctx, x: number, y: number, roofC: string) {
  const W = 16, wy = y - 1.4; // wy: the floor's mid line
  box(ctx, x, y, W, 1.4, '#a48660', '#d6b483'); // the trodden floor
  const P = { l: [x - W / 2, wy], b: [x, wy - W / 4], r: [x + W / 2, wy], f: [x, wy + W / 4] };
  const wall = (p0: number[], p1: number[], hgt: number, c: string) => poly(ctx, [p0[0], p0[1], p1[0], p1[1], p1[0], p1[1] - hgt, p0[0], p0[1] - hgt], c);
  wall(P.l, P.b, 4.2, shade(ML_WALL, 0.06)); // the back walls
  wall(P.b, P.r, 4.2, shade(ML_WALL, -0.14));
  mlPinnacle(ctx, P.l[0] + 0.6, P.l[1] - 4, 2.2, 2.2, ML_WALL);
  mlPinnacle(ctx, P.b[0], P.b[1] - 4 + 0.6, 2.4, 2.4, ML_WALL);
  mlPinnacle(ctx, P.r[0] - 0.6, P.r[1] - 4, 2.2, 2.2, ML_WALL);
  // the house inside
  box(ctx, x + 0.4, y - 1.4, 8, 6, ML_WALL, shade(ML_WALL, 0.22));
  mlToron(ctx, 'R', x + 0.4, y - 1.4, 8, 6, 0.72, 2, 0.2, 0.8);
  mlToron(ctx, 'L', x + 0.4, y - 1.4, 8, 6, 0.72, 2, 0.2, 0.8);
  mlDoor(ctx, 'R', x + 0.4, y - 1.4, 8, 6, 0.3, 0.5, 0.5);
  mlPinnacle(ctx, x + 0.4, y - 1.4 - 6 + 0.6, 2.8, 3.2, ML_WALL);
  ellipse(ctx, x - 5.4, wy + 0.8, 1.4, 1.6, '#a3722c'); // a big water jar
  ellipse(ctx, x - 5.4, wy - 0.6, 0.8, 0.4, '#6a3a12');
  // the low front walls, with a gap for the gateway
  wall(P.l, P.f, 2.4, shade(ML_WALL, 0.14));
  wall(P.f, P.r, 2.4, shade(ML_WALL, -0.1));
  const g0 = 0.56, g1 = 0.84, gp = (t: number) => [P.l[0] + (P.f[0] - P.l[0]) * t, P.l[1] + (P.f[1] - P.l[1]) * t];
  poly(ctx, [gp(g0)[0], gp(g0)[1], gp(g1)[0], gp(g1)[1], gp(g1)[0], gp(g1)[1] - 2.4, gp(g0)[0], gp(g0)[1] - 2.4], '#2a1a10'); // the gateway
  void roofC;
}

function mlBuilding(ctx: Ctx, x: number, y: number, big: boolean, roofC: string, capital: boolean) {
  if (big) return mlMosque(ctx, x, y, capital);
  const spot: Record<string, number> = { '-10,2': 0, '10,2': 1, '0,8': 4, '-6,-8': 2, '7,-7': 3, '-14,-3': 0, '14,-2': 2 };
  const v = spot[`${Math.round(x)},${Math.round(y)}`] ?? ((Math.round(x) * 7 + Math.round(y) * 3) % 5 + 5) % 5;
  switch (v) {
    case 1: return mlHouse(ctx, x, y, 10, 7, roofC, true);
    case 2:
      mlGranary(ctx, x - 3.4, y - 1.4, 3.6, 6, roofC);
      mlGranary(ctx, x + 3.8, y + 1.4, 3, 5, roofC);
      return;
    case 3: return mlTent(ctx, x, y, roofC);
    case 4: return mlCompound(ctx, x, y, roofC);
    default: return mlHouse(ctx, x, y, 11, 7, roofC, false);
  }
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
      ellipse(ctx, x, y + 4, 21, 10, P.shallow);
      ellipse(ctx, x, y + 4, 15, 6.5, shade(P.shallow, 0.12));
      drawFish(ctx, x - 5, y + 1, -0.5, ...FISH_ICON[tribe], 0.6, 1.35);
      return drawFish(ctx, x + 7, y + 7, 2.5, ...FISH_ICON[tribe], 2.1, 1.15);
    case 'whale':
      ellipse(ctx, x, y + 4, 21, 10, P.shallow);
      return drawResource(ctx, fake({ resource: icon }), x, y - 4, tribe);
    case 'farm':
      drawFarm(ctx, x, y + 2);
      return drawFarmCrops(ctx, x, y + 2, 7);
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
  }
}

/** City preview for panels and modals. */
export function drawCityIcon(ctx: Ctx, tribe: TribeId, x: number, y: number, capital: boolean) {
  const T = TRIBES[tribe];
  drawBuilding(ctx, tribe, x - 8, y + 2, false, T.roof, T.color, false);
  drawBuilding(ctx, tribe, x + 4, y + 6, true, T.roof, T.color, capital);
}

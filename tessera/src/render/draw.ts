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

function drawTree(ctx: Ctx, biome: TribeId, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  ellipse(ctx, x + 1.5, y, 4.5 * k, 1.8 * k, 'rgba(0,0,0,0.16)');
  if (biome === 'persia') return drawPersianTree(ctx, x, y, k, P, variant);
  if (biome === 'inuit') return drawTundraTree(ctx, x, y, k, P, variant);
  if (biome === 'inca') return incaTree(ctx, x, y, k, P, variant);
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
  persia: '#d7443a', celts: '#7a2a5a', inuit: '#e85a6a', inca: '#f2c53a', ethiopia: '#b8324a',
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
    const fo = tribe === 'persia' && big ? 10 : 0; // the flag rides on the fire temple's dome
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

// Everything on the map that moves: units walking tile by tile, swimming fish and whales,
// water glints, selection rings, combat effects, plus the crisp screen-space labels on top.
import { cityVisibleTo, unitVisibleTo } from '../game/mech';
import { MECH_RENDER } from './mech';
import { TRIBES } from '../data/tribes';
import { UNITS } from '../data/units';
import { dist, tileAt } from '../game/grid';
import { hostile } from '../game/diplomacy';
import { attackRange, cityIncome, maxHp, popNeeded } from '../game/rules';
import type { City, GameState, Tile, TribeId, Unit, UnitKind } from '../game/types';
import { Camera, WATER_DROP, tileCenter } from './camera';
import { FLASH_MS, FLOAT_MS, FONT, GHOST_MS, HH, HW, isWaterTile, LUNGE_MS, REDUCED_MOTION, UNIT_SCALE, uv, type Fx, type Overlay } from './common';
import { drawStar, ellipse, mix, poly, rand, roundRect, shade, softShadow, type Ctx, type Pt } from './prims';
import { drawFigure, figureHit } from './sprites';
import { drawWildOverlay, WILD_COLOR } from './wild';
import { isRogueCity, isRogueUnit, rogueLook } from '../game/rebels';
import { drawRebelOverlay, drawUnrestBadge, REBEL_COLOR } from './rebels';
import { floaterPose } from './combatfx';
import { drawHeroGround } from './heroes';
import { drawRoleGround } from './roles';
import { drawArmyGround } from './army';
import { drawAuxGround } from './auxiliaries';
import { CLAN_COLOR, drawClanGround } from './clans';
import { isRaider } from '../game/clans';
import { drawTradeRoutes } from './trade';
import { isHero } from '../game/heroes';

export interface Motion { x: number; y: number; lift: number; sx: number; sy: number; facing: number; water: boolean }

const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

export function ground(s: GameState, x: number, y: number) {
  const c = tileCenter(x, y);
  const t = tileAt(s, x, y);
  return { x: c.x, y: c.y + (t && isWaterTile(t) ? WATER_DROP - 1 : 0), water: !!t && isWaterTile(t) };
}

/** Where a unit is drawn right now: walking its path, lunging, bobbing on water or idling (`idle` off: at rest, as in a still picture). */
export function unitMotion(s: GameState, u: Unit, fx: Fx, now: number, ready: boolean, idle = true): Motion {
  let p = ground(s, u.x, u.y);
  let lift = 0, sx = 1, sy = 1;
  const mv = fx.moves.get(u.id);
  if (mv && mv.path.length > 1) {
    const n = mv.path.length - 1;
    const k = Math.max(0, Math.min(1, (now - mv.t0) / mv.dur));
    const f = k * n;
    const seg = Math.min(n - 1, Math.floor(f));
    const local = f - seg;
    const a = ground(s, mv.path[seg].x, mv.path[seg].y);
    const b = ground(s, mv.path[seg + 1].x, mv.path[seg + 1].y);
    const e = ease(local);
    p = { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, water: local < 0.5 ? a.water : b.water };
    const sailing = a.water && b.water;
    const air = Math.sin(Math.PI * local);
    if (k < 1) {
      lift = air * (sailing ? 2 : 9);
      // stretch in the air, squash for a moment on landing
      sy = 1 + (sailing ? 0 : 0.09 * air);
      sx = 1 - (sailing ? 0 : 0.05 * air);
      if (!sailing && seg > 0 && local < 0.14) {
        const q = 1 - local / 0.14;
        sy -= 0.13 * q;
        sx += 0.09 * q;
      }
    }
  }
  const lg = fx.lunges.get(u.id);
  if (lg) {
    const k = (now - lg.t0) / LUNGE_MS;
    if (k >= 0 && k <= 1) {
      const target = tileCenter(lg.tx, lg.ty);
      const amt = Math.sin(Math.PI * k) * 0.42;
      p = { ...p, x: p.x + (target.x - p.x) * amt, y: p.y + (target.y - p.y) * amt };
      lift += Math.sin(Math.PI * k) * 4;
      sx *= 1 + Math.sin(Math.PI * k) * 0.06;
    }
  }
  if (!REDUCED_MOTION && idle) {
    if (p.water) p = { ...p, y: p.y + Math.sin(now / 520 + u.id) * 1.2 };
    else if (ready && !mv) lift += (Math.sin(now / 380 + u.id * 1.7) + 1) * 0.9;
  }
  return { x: p.x, y: p.y, lift, sx, sy, facing: fx.facing.get(u.id) ?? 1, water: p.water };
}

let lastZoom = 0;
let zoomChangedAt = 0;

export function drawDynamic(ctx: Ctx, s: GameState, viewer: number, cam: Camera, ov: Overlay, vw: number, vh: number, dpr: number) {
  const now = ov.now;
  const fx = ov.fx;
  // unit bitmaps are made at the exact on-screen scale once the zoom has settled
  if (cam.zoom !== lastZoom) {
    lastZoom = cam.zoom;
    zoomChangedAt = now;
  }
  const exact = now - zoomChangedAt > 160;
  const explored = (x: number, y: number) => viewer < 0 || s.players[viewer].explored[y * s.size + x];
  const w0 = cam.toWorld(-90, -140), w1 = cam.toWorld(vw + 90, vh + 140);
  const onScreen = (p: Pt) => p.x > w0.x && p.x < w1.x && p.y > w0.y && p.y < w1.y;

  ctx.save();
  ctx.translate(cam.x, cam.y);
  ctx.scale(cam.zoom, cam.zoom);

  drawTradeRoutes(ctx, s, viewer); // dotted caravan trails and sea lanes between trading cities (see render/trade)
  drawSelection(ctx, s, ov, now, explored);
  drawHeroGround(ctx, s, viewer, now); // hero auras and ability marks (see render/heroes)
  drawRoleGround(ctx, s, viewer); // rings under units stationed in a city (see render/roles)
  drawArmyGround(ctx, s, viewer); // formation cords and out-of-supply marks (see render/army)
  drawAuxGround(ctx, s, viewer); // healers' rings and the wounded they tend (see render/auxiliaries)
  drawClanGround(ctx, s, viewer); // rough rust rings under the Raider Clans' raiders (see render/clans)

  const units = shownUnits(s, viewer, cam, vw, vh);
  const motion = new Map<number, Motion>();
  for (const u of units) motion.set(u.id, unitMotion(s, u, fx, now, unitReady(s, u, viewer), !ov.still));
  // Zoomed far out, units are drawn a little larger than the map so they don't shrink to specks.
  const us = unitScale(cam.zoom);
  // ground shadows first so no unit's shadow lands on another unit
  for (const u of units) {
    const m = motion.get(u.id)!;
    const naval = UNITS[u.kind].naval;
    const shrink = 1 - Math.min(0.45, m.lift / 22);
    softShadow(ctx, m.x, m.y + 6, (naval ? 21 : 12) * us * 0.78 * shrink, (naval ? 6.5 : 4.6) * us * 0.78 * shrink, naval ? 0.22 : 0.34);
  }
  ctx.restore();

  // City labels go under the units, so a unit standing in front of a city is never hidden.
  drawCityLabels(ctx, s, viewer, cam, dpr, explored, onScreen, now, !ov.still, ov.hudBottom ?? 0);

  ctx.save();
  ctx.translate(cam.x, cam.y);
  ctx.scale(cam.zoom, cam.zoom);
  const pxScale = us * cam.zoom * dpr;
  if (!ov.living) for (const u of units) drawUnit(ctx, s, u, motion.get(u.id)!, ov, viewer, pxScale, exact, us);

  for (const g of fx.ghosts) {
    const k = (now - g.t0) / (g.dur ?? GHOST_MS);
    if (k < 0 || k > 1) continue;
    if (g.lead) { drawCaptive(ctx, g, k, pxScale, exact, us); continue; }
    const c = tileCenter(g.x, g.y);
    const y = c.y + 5 + k * 8;
    drawFigure(ctx, g.kind, g.tribe, pxScale, 'base', exact, c.x, y, us, 1 + k * 0.1, 1 - k * 0.35, g.facing < 0, 1 - k);
    const white = Math.max(0, 0.9 - k * 2.5);
    if (white > 0) drawFigure(ctx, g.kind, g.tribe, pxScale, 'white', exact, c.x, y, us, 1 + k * 0.1, 1 - k * 0.35, g.facing < 0, white);
  }

  for (const p of fx.projectiles) drawProjectile(ctx, p, now);
  for (const p of fx.particles) drawParticle(ctx, p, now);

  for (const a of ov.attacks) {
    const t = tileAt(s, a.x, a.y)!;
    const c = tileCenter(a.x, a.y);
    const y = c.y + (isWaterTile(t) ? WATER_DROP : 0);
    const pulse = 1 + Math.sin(now / 160) * 0.07;
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(255,48,48,0.25)';
    ctx.beginPath();
    ctx.ellipse(c.x, y, 19 * pulse, 9.5 * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = '#ff4040';
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2 + now / 900;
      const ex = c.x + Math.cos(ang) * 19 * pulse, ey = y + Math.sin(ang) * 9.5 * pulse;
      poly(ctx, [ex, ey, ex - Math.cos(ang) * 6 - Math.sin(ang) * 2.5, ey - Math.sin(ang) * 3 + Math.cos(ang) * 1.2, ex - Math.cos(ang) * 6 + Math.sin(ang) * 2.5, ey - Math.sin(ang) * 3 - Math.cos(ang) * 1.2], '#ff4040');
    }
  }
  for (const m of Object.values(MECH_RENDER)) m?.overlay?.(ctx, s, viewer, cam, ov, now);
  drawWildOverlay(ctx, s, viewer, cam, ov, now); // smoke, lava glow, the Kraken's arms (see game/wild)
  if (!ov.living) drawRebelOverlay(ctx, s, viewer, now); // the Rogue States' war banners (see game/rebels)
  ctx.restore();

  drawScreenOverlay(ctx, s, viewer, cam, ov, dpr, units, motion);
}

/**
 * A captive of the Aztecs, led away rather than slain: it stumbles in small hops toward its captor on a
 * taut rope, bowed and greying, and fades out as it reaches the captor's side.
 */
function drawCaptive(ctx: Ctx, g: Fx['ghosts'][number], k: number, pxScale: number, exact: boolean, us: number) {
  const a = tileCenter(g.x, g.y), b = tileCenter(g.lead!.x, g.lead!.y);
  const walk = Math.min(1, k / 0.85) * 0.62; // it stops at the captor's side, not on top of it
  const hop = REDUCED_MOTION ? 0 : Math.abs(Math.sin(k * Math.PI * 5)) * 3;
  const x = a.x + (b.x - a.x) * walk, y = a.y + (b.y - a.y) * walk + 5 - hop;
  const fade = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
  const facing = b.x - a.x >= 0 ? 1 : -1;
  // the rope, from the captor's hand to the captive's waist
  ctx.globalAlpha = fade;
  ctx.strokeStyle = '#6b4423';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(b.x - facing * 6, b.y - 8);
  ctx.quadraticCurveTo((x + b.x) / 2, Math.max(y, b.y) - 2 + (1 - walk) * 4, x, y - 8);
  ctx.stroke();
  ctx.globalAlpha = 1;
  drawFigure(ctx, g.kind, g.tribe, pxScale, 'base', exact, x, y, us, 1, 0.9, facing < 0, fade);
  const pale = Math.min(0.3, k * 0.6) * fade;
  if (pale > 0) drawFigure(ctx, g.kind, g.tribe, pxScale, 'white', exact, x, y, us, 1, 0.9, facing < 0, pale);
}

// ---------------------------------------------------------------- units

/** The units drawn on screen, back to front: explored, visible to the viewer and near the view. */
export function shownUnits(s: GameState, viewer: number, cam: Camera, vw: number, vh: number): Unit[] {
  const w0 = cam.toWorld(-90, -140), w1 = cam.toWorld(vw + 90, vh + 140);
  return s.units
    .filter((u) => {
      if (viewer >= 0 && !s.players[viewer].explored[u.y * s.size + u.x]) return false;
      const p = tileCenter(u.x, u.y);
      return p.x > w0.x && p.x < w1.x && p.y > w0.y && p.y < w1.y && (viewer < 0 || unitVisibleTo(s, viewer, u));
    })
    .sort((a, b) => a.x + a.y - (b.x + b.y) || a.x - b.x);
}

/** A unit of the viewer's that can still move this turn: it idles (breathes) while it waits. */
export const unitReady = (s: GameState, u: Unit, viewer: number) => u.owner === viewer && s.current === viewer && !u.moved;
/** A unit of the viewer's that has done everything this turn: drawn greyed out. */
export const unitSpent = (s: GameState, u: Unit, viewer: number) => u.owner === viewer && s.current === viewer && u.moved && u.attacked;

/** World units per unit-art unit: the normal size, growing a little (up to 22%) when zoomed far out. */
export const unitScale = (zoom: number) => UNIT_SCALE * (zoom < 1 ? Math.min(1.22, Math.pow(1 / zoom, 0.28)) : 1);

function drawUnit(ctx: Ctx, s: GameState, u: Unit, m: Motion, ov: Overlay, viewer: number, pxScale: number, exact: boolean, us: number) {
  const now = ov.now;
  const tribe = rogueLook(s, u) ?? s.players[u.owner].tribe; // rebels wear their own people's colours (see game/rebels)
  const spent = unitSpent(s, u, viewer);
  const fl = ov.fx.flashes.get(u.id);
  const flashK = fl === undefined ? -1 : (now - fl) / FLASH_MS;
  const flashing = flashK >= 0 && flashK <= 1;
  const shake = flashing ? Math.sin(flashK * 42) * 2.2 * (1 - flashK) : 0;
  const x = m.x + shake, y = m.y - m.lift + 5;
  // mid-trip a unit that boarded or landed shows as whatever fits the tile it's crossing (boat on water)
  const before = ov.fx.moves.get(u.id)?.before;
  const fits = (k: UnitKind) => !!UNITS[k].naval === m.water;
  const kind = before && !fits(u.kind) && fits(before) ? before : u.kind;
  drawFigure(ctx, kind, tribe, pxScale, spent ? 'spent' : isRaider(s, u) ? 'raider' : 'base', exact, x, y, us, m.sx, m.sy, m.facing < 0); // raiders in drab hides (see render/clans)
  if (flashing) drawFigure(ctx, kind, tribe, pxScale, 'white', exact, x, y, us, m.sx, m.sy, m.facing < 0, (1 - flashK) * 0.85);
}

// ---------------------------------------------------------------- water life

export const FISH: Record<TribeId, [string, string]> = {
  egypt: ['#f2c45a', '#c98a1e'],
  aztec: ['#ff8a3d', '#c4481a'],
  polynesia: ['#ffe04a', '#2f8fd8'],
  rome: ['#c9d6e2', '#6f8aa3'],
  pirates: ['#5fd1c1', '#1f7f86'],
  vikings: ['#d8e2ec', '#4a6a8a'],
  japan: ['#ff6a4a', '#f4f1ea'],
  mongols: ['#c9b27a', '#6a7a4a'],
  greeks: ['#8ad0f0', '#2a5f9a'],
  zulu: ['#f2a24a', '#6a3a1a'],
  persia: ['#f4d05a', '#2a7ab8'],
  celts: ['#c9d6d0', '#4a7a6a'],
  inuit: ['#e8f0f4', '#3a6a8a'],
  inca: ['#ffb45a', '#2a8a7a'],
  ethiopia: ['#9ad4c0', '#2a6a5a'],
  aboriginal: ['#f2d28a', '#6a4a2a'],
  china: ['#ff8a5a', '#f4f0e6'],
  india: ['#ffd06a', '#2a8a7a'],
  mali: ['#8ad0c4', '#2a6a7a'],
  lakota: ['#c9d6a0', '#5a7a3a'],
  ottoman: ['#8ad4f0', '#2a5f9a'],
  maya: ['#7ae0c0', '#2a6a5a'],
  korea: ['#ffb08a', '#c94a2a'],
  khmer: ['#c9d6a0', '#5a7a3a'],
  swahili: ['#ffd06a', '#2a7ab8'],
  tibet: ['#8ad0f0', '#5a6a8a'],
};

/** Fish, whales and glints, drawn between the ground and scenery layers. */
export function drawWaterLife(ctx: Ctx, s: GameState, viewer: number, cam: Camera, ov: Overlay, vw: number, vh: number) {
  const explored = (x: number, y: number) => viewer < 0 || s.players[viewer].explored[y * s.size + x];
  const w0 = cam.toWorld(-60, -60), w1 = cam.toWorld(vw + 60, vh + 60);
  const onScreen = (p: Pt) => p.x > w0.x && p.x < w1.x && p.y > w0.y && p.y < w1.y;
  const t0 = REDUCED_MOTION ? 0 : ov.now;
  ctx.save();
  ctx.translate(cam.x, cam.y);
  ctx.scale(cam.zoom, cam.zoom);
  for (const t of s.tiles) {
    if (!isWaterTile(t) || !explored(t.x, t.y)) continue;
    const c = tileCenter(t.x, t.y);
    if (!onScreen(c)) continue;
    const cy = c.y + WATER_DROP;
    if (ov.living) {
      // the fish, whales and glints swim in the living layer; only the whale's still ring stays in the picture
      if (t.resource === 'whale') whaleRing(ctx, c.x, cy);
      continue;
    }
    if (t.resource === 'fish') drawFishSchool(ctx, t, c.x, cy, t0);
    else if (t.resource === 'whale') drawWhale(ctx, t, c.x, cy, t0);
    // a glint that twinkles now and then
    const tw = glintAlpha(t0, t.seed);
    if (tw > 0.02) {
      const g = glintAt(t, c.x, cy);
      ctx.globalAlpha = tw;
      drawGlint(ctx, g.x, g.y);
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}

/** How bright a water tile's glint is at time `now` (it flashes briefly every ~4.4 s). */
export const glintAlpha = (now: number, seed: number) => Math.pow(Math.max(0, Math.sin(now / 700 + seed)), 12);
/** Where on a water tile (top-face centre (cx, cy)) its glint twinkles. */
export const glintAt = (t: Tile, cx: number, cy: number) => uv(cx, cy, rand(t.seed, 31) * 0.6 - 0.3, rand(t.seed, 32) * 0.6 - 0.3);
/** A four-pointed white glint centred on (x, y). */
export function drawGlint(ctx: Ctx, x: number, y: number) {
  poly(ctx, [x, y - 3.2, x + 0.8, y - 0.6, x + 3.2, y, x + 0.8, y + 0.6, x, y + 3.2, x - 0.8, y + 0.6, x - 3.2, y, x - 0.8, y - 0.6], '#ffffff');
}

/** The shape of a tile's fish school: its loop around the tile, its speed and direction, and its fish. */
export function fishSchool(t: Tile) {
  const dir = rand(t.seed, 201) < 0.5 ? 1 : -1;
  return {
    dir,
    rate: (0.45 + rand(t.seed, 202) * 0.15) * dir, // radians a second around the loop
    spin0: rand(t.seed, 203) * 6.28,
    ou: rand(t.seed, 204) * 0.08 - 0.04, ov: rand(t.seed, 205) * 0.08 - 0.04,
    ru: 0.26 + rand(t.seed, 206) * 0.04, rv: 0.17 + rand(t.seed, 207) * 0.03,
    sizes: [0, 1, 2].map((i) => 0.8 + rand(t.seed, 260 + i) * 0.2),
  };
}

const LEAP_MS = 760;
const LEAP_ARC = 1.5; // how far round its loop a leaping fish lands (radians)

/**
 * Three fish circling just under the surface (tinted by the water, so they read as submerged),
 * and every few seconds one of them leaps clear with a splash going in and coming out.
 */
function drawFishSchool(ctx: Ctx, t: Tile, cx: number, cy: number, now: number) {
  const [body, back] = FISH[t.biome];
  const water = waterColor(t);
  const { dir, rate, spin0, ou, ov, ru, rv, sizes } = fishSchool(t);
  const spin = (now / 1000) * rate + spin0;
  // the leap: which fish, and where along its loop it happens
  const period = 6000 + rand(t.seed, 208) * 3000;
  const clock = now + rand(t.seed, 209) * period;
  const cycle = Math.floor(clock / period);
  const since = clock - cycle * period; // ms into this cycle; the leap is its first LEAP_MS
  const leaper = REDUCED_MOTION ? -1 : cycle % 3;

  // a lazy ripple where the school is feeding
  const rk = ((now + t.seed * 37) % 2600) / 2600;
  const rp = uv(cx, cy, ou, ov);
  ctx.strokeStyle = `rgba(255,255,255,${0.4 * (1 - rk)})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(rp.x, rp.y, 4 + rk * 13, (4 + rk * 13) * 0.5, 0, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 3; i++) {
    const ph = spin + (i * Math.PI * 2) / 3;
    const wob = 1 + Math.sin(now / 900 + i * 2.1 + t.seed) * 0.08;
    const k = sizes[i];
    const at = (a: number) => uv(cx, cy, ou + Math.cos(a) * ru * wob, ov + Math.sin(a) * rv * wob);
    // it jumps LEAP_ARC ahead along its loop, then stays under until the loop catches up with
    // where it splashed down, so it resurfaces exactly there
    if (i === leaper && since < (LEAP_ARC / Math.abs(rate)) * 1000) {
      const ph0 = ph - (since / 1000) * rate;
      drawLeap(ctx, at(ph0), at(ph0 + LEAP_ARC * dir), Math.min(1, since / LEAP_MS), since, body, back, k);
      continue;
    }
    const p = at(ph);
    // heading on the ground plane (before the 2:1 isometric squash)
    const du = -Math.sin(ph) * ru * dir, dv = Math.cos(ph) * rv * dir;
    const heading = Math.atan2(du + dv, du - dv);
    drawFish(ctx, p.x, p.y, heading, body, back, now / 110 + i * 2, k, water);
  }
}

/** One fish arcing out of the water from `a` to `b` (k = 0..1), with splashes in and out. */
function drawLeap(ctx: Ctx, a: Pt, b: Pt, k: number, ms: number, body: string, back: string, size: number) {
  const splash = (p: Pt, t: number) => {
    if (t < 0 || t > 1) return;
    ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - t)})`;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 3 + t * 11, (3 + t * 11) * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();
    // droplets thrown up and falling back
    for (let d = 0; d < 4; d++) {
      const ang = -Math.PI / 2 + (d - 1.5) * 0.55;
      const r = t * (6 + d * 1.5);
      const dx = p.x + Math.cos(ang) * r, dy = p.y + Math.sin(ang) * r * 1.2 + t * t * 10;
      ctx.globalAlpha = 1 - t;
      ellipse(ctx, dx, dy, 1.1, 1.3, '#ffffff');
    }
    ctx.globalAlpha = 1;
  };
  splash(a, ms / 520);
  splash(b, (ms - LEAP_MS) / 520);
  if (k >= 1) return;
  const h = 10 * size;
  const x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k - Math.sin(Math.PI * k) * h;
  const dx = b.x - a.x, dy = b.y - a.y - Math.PI * h * Math.cos(Math.PI * k);
  // a little under the surface at both ends
  ctx.save();
  ctx.globalAlpha = Math.min(1, Math.sin(Math.PI * k) * 3.5);
  ctx.translate(x, y);
  ctx.rotate(Math.atan2(dy, dx));
  if (dx < 0) ctx.scale(1, -1); // keep the fin on top when heading left
  ctx.scale(size * 0.72, size * 0.72);
  // tail
  poly(ctx, [-6, 0, -11, -4, -9.5, 0, -11, 4], shade(back, 0.05));
  // body in profile: darker back, pale belly
  ctx.beginPath();
  ctx.moveTo(8, 0.4);
  ctx.bezierCurveTo(6, -4.2, -2, -4.4, -6.5, -0.8);
  ctx.lineTo(-6.5, 0.8);
  ctx.bezierCurveTo(-2, 3.6, 5.5, 3.8, 8, 0.4);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -4.2, 0, 3.8);
  g.addColorStop(0, shade(back, 0.08));
  g.addColorStop(0.45, shade(body, 0.12));
  g.addColorStop(1, shade(body, 0.55));
  ctx.fillStyle = g;
  ctx.fill();
  poly(ctx, [1.5, -3.6, -2.5, -6.2, -3.5, -2.8], back); // dorsal fin
  ellipse(ctx, 4.8, -1.1, 0.9, 0.9, '#ffffff');
  ellipse(ctx, 5, -1.1, 0.55, 0.55, '#0d1a22');
  ctx.restore();
}

/**
 * A small fish seen from above, lying on the water plane: `heading` is measured on the ground
 * plane and the drawing is squashed 2:1 like the tiles, so it turns naturally as it swims.
 * With `water` set it is tinted by that water, as if just below the surface.
 */
export function drawFish(ctx: Ctx, x: number, y: number, heading: number, body: string, back: string, wiggle: number, k: number, water?: string) {
  if (water) {
    // its shadow on the sandy bottom, straight below (light from above), then the fish itself
    // a little washed out by the water it swims in
    ctx.save();
    ctx.translate(x, y + 2.2);
    ctx.scale(1, 0.5);
    ctx.rotate(heading);
    ctx.scale(k * 0.85, k * 0.85);
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.bezierCurveTo(7, -3.8, 0, -3.6, -7, -1);
    ctx.lineTo(-12, -3.6);
    ctx.lineTo(-10.5, 0);
    ctx.lineTo(-12, 3.6);
    ctx.lineTo(-7, 1);
    ctx.bezierCurveTo(0, 3.6, 7, 3.8, 9, 0);
    ctx.closePath();
    ctx.fillStyle = shade(water, -0.45);
    ctx.globalAlpha *= 0.22;
    ctx.fill();
    ctx.restore();
    body = mix(body, water, 0.22);
    back = mix(back, shade(water, -0.3), 0.3);
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, 0.5);
  ctx.rotate(heading);
  ctx.scale(k * 0.85, k * 0.85);
  const alpha = ctx.globalAlpha;
  ctx.globalAlpha = alpha * (water ? 0.9 : 0.95);
  // tail, swishing from side to side
  ctx.save();
  ctx.translate(-6.5, 0);
  ctx.rotate(Math.sin(wiggle) * 0.45);
  poly(ctx, [0.5, 0, -5.5, -3.8, -4, 0, -5.5, 3.8], shade(back, 0.1));
  ctx.restore();
  // small side fins
  poly(ctx, [2, -2.3, -1.2, -4.4, -0.6, -1.8], shade(back, 0.15));
  poly(ctx, [2, 2.3, -1.2, 4.4, -0.6, 1.8], shade(back, 0.15));
  // slim body, lit from above
  ctx.beginPath();
  ctx.moveTo(9, 0);
  ctx.bezierCurveTo(7, -3.6, 0, -3.4, -6.8, -0.9);
  ctx.lineTo(-6.8, 0.9);
  ctx.bezierCurveTo(0, 3.4, 7, 3.6, 9, 0);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -3.4, 0, 3.4);
  g.addColorStop(0, shade(body, -0.05));
  g.addColorStop(0.45, shade(body, 0.3));
  g.addColorStop(1, shade(body, -0.12));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.globalAlpha = alpha * 0.45;
  ctx.strokeStyle = back;
  ctx.lineWidth = 0.9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(5.5, 0);
  ctx.lineTo(-5.5, 0);
  ctx.stroke();
  ctx.globalAlpha = alpha;
  if (!water) {
    ellipse(ctx, 6.3, -1.4, 0.6, 0.6, '#0d1a22');
    ellipse(ctx, 6.3, 1.4, 0.6, 0.6, '#0d1a22');
  }
  ctx.restore();
}

/** The colour of a water tile's surface. */
export const waterColor = (t: Tile) => (t.terrain === 'shallow' ? TRIBES[t.biome].palette.shallow : TRIBES[t.biome].palette.ocean);

/** How far a whale has risen out of the water (world units) at time `now`. */
export const whaleRise = (now: number, seed: number) => Math.sin(now / 1100 + seed) * 1.6;
/** How far a whale's flukes are lifted (world units) at time `now`. */
export const whaleTail = (now: number, seed: number) => Math.sin(now / 500 + seed) * 2;
/** A whale spouts every few seconds. */
export const WHALE_SPOUT_MS = 3600;
/** How far through its spout a whale is: 0..1 while spouting, -1 between spouts. */
export function whaleSpout(now: number, seed: number) {
  const k = ((now + seed * 53) % WHALE_SPOUT_MS) / WHALE_SPOUT_MS;
  return k < 0.35 ? k / 0.35 : -1;
}

function drawWhale(ctx: Ctx, t: Tile, x: number, y: number, now: number) {
  const wy = y + 3 - whaleRise(now, t.seed);
  whaleRing(ctx, x, y);
  whaleBody(ctx, x, wy, whaleTail(now, t.seed));
  const q = whaleSpout(now, t.seed);
  if (q >= 0) whaleSpoutAt(ctx, x, wy, q);
}

/** The still ring of ripples round a whale (water tile's top-face centre at (x, y)). */
export function whaleRing(ctx: Ctx, x: number, y: number) {
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 18, 6, 0, 0, Math.PI * 2);
  ctx.stroke();
}

/** A whale's back and tail centred on (x, wy); `tail` lifts the flukes. */
export function whaleBody(ctx: Ctx, x: number, wy: number, tail: number) {
  ellipse(ctx, x, wy, 15, 5.6, '#25344f');
  ellipse(ctx, x - 2, wy - 2.2, 11, 3, '#3d5378');
  ellipse(ctx, x - 5, wy - 2.8, 4, 1.2, '#5a739c');
  poly(ctx, [x + 13, wy - 1, x + 21, wy - 7 + tail, x + 17.5, wy - 1.5, x + 21, wy + 3 + tail], '#25344f');
}

/** A whale's spout, `q` (0..1) of the way through, over a whale centred on (x, wy). */
export function whaleSpoutAt(ctx: Ctx, x: number, wy: number, q: number) {
  ctx.globalAlpha = 1 - q;
  for (let i = -2; i <= 2; i++) {
    const dx = i * 2.2 * q, h = 14 * Math.sin(Math.PI * Math.min(1, q * 1.4)) * (1 - Math.abs(i) * 0.15);
    ellipse(ctx, x - 7 + dx * 2, wy - 5 - h, 1.4, 1.4, '#eaf8ff');
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- selection

function diamondPath(ctx: Ctx, x: number, y: number, k: number) {
  const top = { x, y: y - HH * k };
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(x + HW * k, y);
  ctx.lineTo(x, y + HH * k);
  ctx.lineTo(x - HW * k, y);
  ctx.closePath();
}

/** The whole territory of a selected city, outlined along its outer edge in the empire's colour. */
function drawCityBorder(ctx: Ctx, s: GameState, cityId: number, now: number, explored: (x: number, y: number) => boolean) {
  const city = s.cities.find((c) => c.id === cityId);
  if (!city) return;
  const col = isRogueCity(s, city) ? REBEL_COLOR : TRIBES[s.players[city.owner].tribe].color;
  const pulse = (Math.sin(now / 300) + 1) / 2;
  const tiles = s.tiles.filter((t) => t.owner === cityId && explored(t.x, t.y));
  const edges: [number, number, number, number, number, number][] = [
    [-1, 0, 0, -HH, -HW, 0], // upper-left edge: T to L
    [0, -1, 0, -HH, HW, 0], // upper-right edge: T to R
    [1, 0, HW, 0, 0, HH], // lower-right edge: R to B
    [0, 1, -HW, 0, 0, HH], // lower-left edge: L to B
  ];
  const outer: [number, number, number, number][] = [];
  for (const t of tiles) {
    const c = tileCenter(t.x, t.y);
    const y = c.y + (isWaterTile(t) ? WATER_DROP : 0);
    for (const [dx, dy, ax, ay, bx, by] of edges) {
      const n = tileAt(s, t.x + dx, t.y + dy);
      if (n && n.owner === cityId && explored(n.x, n.y)) continue;
      outer.push([c.x + ax, y + ay, c.x + bx, y + by]);
    }
  }
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const trace = () => { ctx.beginPath(); for (const [x0, y0, x1, y1] of outer) { ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); } };
  trace();
  ctx.strokeStyle = `rgba(255,255,255,${0.22 + pulse * 0.16})`;
  ctx.lineWidth = 9;
  ctx.stroke();
  trace();
  ctx.strokeStyle = col;
  ctx.lineWidth = 4;
  ctx.stroke();
  trace();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
}

function drawSelection(ctx: Ctx, s: GameState, ov: Overlay, now: number, explored: (x: number, y: number) => boolean) {
  if (ov.selected) {
    const t = tileAt(s, ov.selected.x, ov.selected.y);
    if (t && t.cityId !== null) drawCityBorder(ctx, s, t.cityId, now, explored);
    if (t && s.units.some((u) => u.x === t.x && u.y === t.y)) {
      // a unit is selected: a glowing ring at its feet
      const c = tileCenter(t.x, t.y);
      const y = c.y + (isWaterTile(t) ? WATER_DROP : 0) + 3;
      const pulse = (Math.sin(now / 320) + 1) / 2;
      glowDisc(ctx, c.x, y, 22, 'rgba(70,210,255,', 0.55 + pulse * 0.2);
      ctx.strokeStyle = `rgba(160,240,255,${0.75 + pulse * 0.2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(c.x, y, 15 + pulse * 1.5, 7.5 + pulse * 0.75, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (t) {
      const c = tileCenter(t.x, t.y);
      const y = c.y + (isWaterTile(t) ? WATER_DROP : 0);
      const pulse = (Math.sin(now / 260) + 1) / 2;
      ctx.lineJoin = 'round';
      diamondPath(ctx, c.x, y, 0.98);
      ctx.strokeStyle = `rgba(255,255,255,${0.18 + pulse * 0.18})`;
      ctx.lineWidth = 7;
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.4;
      ctx.stroke();
    }
  }
  ov.moves.forEach((m, i) => {
    const t = tileAt(s, m.x, m.y)!;
    const c = tileCenter(m.x, m.y);
    const y = c.y + (isWaterTile(t) ? WATER_DROP : 0);
    // a glowing blue ring: a soft halo, a bright band with a dark hole, and a slow pulse outward
    const k = ((now / 1300) + i * 0.05) % 1;
    glowDisc(ctx, c.x, y + 0.5, 21, 'rgba(90,180,255,', 0.5);
    ctx.beginPath();
    ctx.ellipse(c.x, y, 14, 7, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x, y, 6.5, 3.25, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(150,205,255,0.78)';
    ctx.fill('evenodd');
    ctx.beginPath();
    ctx.ellipse(c.x, y, 6.5, 3.25, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(16,52,120,0.42)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(c.x, y, 14, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(190,225,255,${0.6 * (1 - k)})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(c.x, y, 14 + k * 8, 7 + k * 4, 0, 0, Math.PI * 2);
    ctx.stroke();
  });
}

/** A soft round glow on the ground: `rgb` is 'rgba(r,g,b,' and `alpha` its strength at the centre. */
function glowDisc(ctx: Ctx, x: number, y: number, rx: number, rgb: string, alpha: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, 0.5);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `${rgb}${alpha})`);
  g.addColorStop(0.6, `${rgb}${alpha * 0.4})`);
  g.addColorStop(1, `${rgb}0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- effects

function drawProjectile(ctx: Ctx, p: Fx['projectiles'][number], now: number) {
  const k = (now - p.t0) / p.dur;
  if (k < 0 || k > 1) return;
  const a = tileCenter(p.fx, p.fy), b = tileCenter(p.tx, p.ty);
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const arc = p.kind === 'shot' ? dist * 0.06 : dist * 0.38;
  const at = (q: number) => ({ x: a.x + (b.x - a.x) * q, y: a.y - 22 + (b.y - a.y) * q - Math.sin(Math.PI * q) * arc });
  const pt = at(k), nx = at(Math.min(1, k + 0.02));
  const ang = Math.atan2(nx.y - pt.y, nx.x - pt.x);
  if (p.kind === 'arrow' || p.kind === 'bolt') {
    const L = p.kind === 'bolt' ? 1.8 : 1;
    ctx.strokeStyle = '#5a3b1e';
    ctx.lineWidth = 1.6 * L;
    ctx.beginPath();
    ctx.moveTo(pt.x - Math.cos(ang) * 8 * L, pt.y - Math.sin(ang) * 8 * L);
    ctx.lineTo(pt.x + Math.cos(ang) * 4 * L, pt.y + Math.sin(ang) * 4 * L);
    ctx.stroke();
    const tip = { x: pt.x + Math.cos(ang) * 4 * L, y: pt.y + Math.sin(ang) * 4 * L };
    poly(ctx, [tip.x + Math.cos(ang) * 3 * L, tip.y + Math.sin(ang) * 3 * L, tip.x + Math.cos(ang + 2.3) * 2.6 * L, tip.y + Math.sin(ang + 2.3) * 2.6 * L, tip.x + Math.cos(ang - 2.3) * 2.6 * L, tip.y + Math.sin(ang - 2.3) * 2.6 * L], p.kind === 'bolt' ? '#c9974a' : '#dfe5ec');
  } else if (p.kind === 'stone') {
    ellipse(ctx, pt.x, pt.y, 3.6, 3.2, '#77777e');
    ellipse(ctx, pt.x - 1, pt.y - 1, 1.6, 1.3, '#a3a3aa');
  } else if (p.kind === 'nut') {
    ellipse(ctx, pt.x, pt.y, 3.4, 3.1, '#6b4424');
    ellipse(ctx, pt.x - 0.8, pt.y - 0.8, 0.9, 0.9, '#2a1a10');
  } else if (p.kind === 'ball') {
    for (let i = 1; i <= 3; i++) {
      const q = at(Math.max(0, k - i * 0.05));
      ellipse(ctx, q.x, q.y, 2 + i, 1.6 + i, `rgba(220,220,220,${0.35 - i * 0.08})`);
    }
    ellipse(ctx, pt.x, pt.y, 3.2, 3.2, '#16161a');
  } else {
    ellipse(ctx, pt.x, pt.y, 2, 2, '#1a1a1a');
    ctx.strokeStyle = 'rgba(255,220,120,0.8)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(pt.x - Math.cos(ang) * 9, pt.y - Math.sin(ang) * 9);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  }
}

function drawParticle(ctx: Ctx, p: Fx['particles'][number], now: number) {
  const t = (now - p.t0) / 1000;
  if (t < 0 || t > p.life) return;
  const a = 1 - t / p.life;
  // light things (petals, leaves, feathers) flutter from side to side and slow down in the air
  const drag = p.sway ? 1 / (1 + t * 2.5) : 1;
  const x = p.x + p.vx * t * drag + (p.sway ? Math.sin(t * 7 + p.vx) * p.sway * Math.min(1, t * 3) : 0);
  const y = p.y + p.vy * t * drag + 0.5 * p.g * t * t;
  ctx.globalAlpha = Math.min(1, a * 1.4);
  const spin = t * 8 + p.vx;
  switch (p.shape) {
    case 'petal':
    case 'leaf':
    case 'feather':
    case 'shard':
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(p.shape === 'shard' ? spin * 1.4 : Math.sin(spin * 0.6) * 1.2 + p.vx * 0.05);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      if (p.shape === 'shard') { ctx.moveTo(-p.size * 0.5, p.size * 0.4); ctx.lineTo(p.size * 0.6, p.size * 0.2); ctx.lineTo(-p.size * 0.1, -p.size * 0.6); }
      else if (p.shape === 'petal') { ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.cos(spin))); ctx.ellipse(0, 0, p.size * 0.55, p.size * 0.9, 0, 0, Math.PI * 2); }
      else if (p.shape === 'leaf') { ctx.moveTo(0, -p.size); ctx.quadraticCurveTo(p.size * 0.7, 0, 0, p.size); ctx.quadraticCurveTo(-p.size * 0.7, 0, 0, -p.size); }
      else ctx.ellipse(0, 0, p.size * 0.28, p.size, 0, 0, Math.PI * 2);
      ctx.fill();
      if (p.shape === 'feather' || p.shape === 'leaf') {
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(0, p.size * 1.2);
        ctx.stroke();
      }
      ctx.restore();
      break;
    case 'coin': {
      const w = Math.max(0.3, Math.abs(Math.cos(spin * 1.3))) * p.size; // spinning edge-on and back
      ellipse(ctx, x, y, w, p.size, shade(p.color, -0.25));
      ellipse(ctx, x, y, w * 0.72, p.size * 0.72, p.color);
      break;
    }
    case 'ankh': {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size * 0.28;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.ellipse(x, y - p.size * 0.55, p.size * 0.3, p.size * 0.4, 0, 0, Math.PI * 2);
      ctx.moveTo(x, y - p.size * 0.15);
      ctx.lineTo(x, y + p.size);
      ctx.moveTo(x - p.size * 0.55, y + p.size * 0.05);
      ctx.lineTo(x + p.size * 0.55, y + p.size * 0.05);
      ctx.stroke();
      ctx.lineCap = 'butt';
      break;
    }
    case 'star': drawStar(ctx, x, y, p.size); break;
    case 'square':
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t * 8 + p.vx);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
      break;
    case 'drop': ellipse(ctx, x, y, p.size * 0.7, p.size, p.color); break;
    case 'ring':
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size * (1 + t * 6), p.size * 0.5 * (1 + t * 6), 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    default: ellipse(ctx, x, y, p.size * (1 + t * 2), p.size * 0.6 * (1 + t * 2), p.color);
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- screen-space overlay

/** How big city labels and health badges are drawn, and how much a label shows, at this zoom. */
export function overlayScale(zoom: number) {
  // They shrink with the map (more slowly, so they stay legible) and show less further out: the
  // full label close up, name and population in the middle distance, just the name far out,
  // where only wounded units keep their health badge.
  return {
    k: Math.max(0.58, Math.min(1.25, 0.2 + 0.8 * zoom)),
    kh: Math.max(0.52, Math.min(1.25, 0.15 + 0.85 * zoom)),
    detail: (zoom >= 0.8 ? 'full' : zoom >= 0.6 ? 'mid' : 'name') as LabelDetail,
  };
}

export type BubbleKind = 'attack' | 'heal' | 'capture';
let bubbleRects: { kind: BubbleKind; x: number; y: number; r: number }[] = [];

/** The action bubble under screen point (sx, sy), if any. */
export function bubbleAt(sx: number, sy: number): BubbleKind | null {
  for (const b of bubbleRects) if (Math.hypot(sx - b.x, sy - b.y) <= b.r + 3) return b.kind;
  return null;
}

const BUBBLE_COLORS: Record<BubbleKind, [string, string]> = { attack: ['#8fd4ff', '#2f86e6'], heal: ['#ffa3cc', '#e8467f'], capture: ['#95eaa0', '#2ea84a'] };

/** Round pin-shaped buttons above the selected unit showing what it can do: strike, heal or claim. */
function drawActionBubbles(ctx: Ctx, ov: Overlay, cam: Camera, units: Unit[], motion: Map<number, Motion>, k: number, us: number, snap: (v: number) => number) {
  const spots = bubbleSpots(ov, cam, units, motion, k, us);
  const rects: typeof bubbleRects = [];
  if (!ov.still) bubbleRects = rects; // a still picture keeps the live screen's tap areas
  for (const b of spots) {
    const cx = snap(b.x), cy = snap(b.y + Math.sin(ov.now / 380) * 1.6 * k);
    if (!ov.living) drawBubble(ctx, b.kind, b.off, cx, cy, b.r, k);
    rects.push({ kind: b.kind, x: cx, y: cy, r: b.r });
  }
}

/** Where the selected unit's action bubbles go (screen space, before their bob), left to right. */
export function bubbleSpots(ov: Overlay, cam: Camera, units: Unit[], motion: Map<number, Motion>, k: number, us: number) {
  const kinds = ov.bubbles;
  if (!kinds?.length || !ov.selected) return [];
  const u = units.find((v) => v.x === ov.selected!.x && v.y === ov.selected!.y);
  const m = u && motion.get(u.id);
  if (!u || !m) return [];
  const R = 15 * k, gap = 5 * k;
  const total = kinds.length * R * 2 + (kinds.length - 1) * gap;
  const tip = cam.toScreen(m.x, m.y - m.lift - 40 * us / 1.3);
  return kinds.map((kind, i) => ({
    unit: u, kind, off: !!ov.bubblesOff?.includes(kind), r: R,
    x: tip.x - total / 2 + R + i * (R * 2 + gap),
    y: tip.y - R - 27 * k, // well clear of the tile above the unit, which a tap may be aiming for
  }));
}

/** One action bubble centred on (cx, cy) with radius R; `off` greys it out. */
export function drawBubble(ctx: Ctx, kind: BubbleKind, off: boolean, cx: number, cy: number, R: number, k: number) {
  {
    const [hi, lo] = off ? ['#cfd4dc', '#8d95a3'] : BUBBLE_COLORS[kind];
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 6 * k;
    ctx.shadowOffsetY = 2 * k;
    ctx.beginPath();
    ctx.arc(cx, cy, R, Math.PI * 0.72, Math.PI * 0.28, false); // the circle, open at the bottom
    ctx.lineTo(cx, cy + R + 7 * k); // ...into a pointed tail
    ctx.closePath();
    const g = ctx.createLinearGradient(0, cy - R, 0, cy + R);
    g.addColorStop(0, hi);
    g.addColorStop(1, lo);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 2 * k;
    ctx.beginPath();
    ctx.arc(cx, cy, R, Math.PI * 0.72, Math.PI * 0.28, false);
    ctx.lineTo(cx, cy + R + 7 * k);
    ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = off ? 0.8 : 1;
    drawBubbleIcon(ctx, kind, cx, cy, R * 0.55);
    ctx.globalAlpha = 1;
  }
}

function drawBubbleIcon(ctx: Ctx, kind: BubbleKind, x: number, y: number, s: number) {
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#fff';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (kind === 'attack') {
    // two crossed swords
    for (const d of [-1, 1]) {
      ctx.lineWidth = s * 0.34;
      ctx.beginPath();
      ctx.moveTo(x - d * s, y - s);
      ctx.lineTo(x + d * s * 0.55, y + s * 0.55);
      ctx.stroke();
      ctx.lineWidth = s * 0.3;
      ctx.beginPath();
      ctx.moveTo(x + d * s * 0.05, y + s * 0.15);
      ctx.lineTo(x + d * s * 0.85, y - s * 0.45);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + d * s * 0.55, y + s * 0.55);
      ctx.lineTo(x + d * s * 0.85, y + s * 0.85);
      ctx.stroke();
    }
  } else if (kind === 'heal') {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.95);
    ctx.bezierCurveTo(x - s * 1.6, y - s * 0.1, x - s * 0.9, y - s * 1.1, x, y - s * 0.35);
    ctx.bezierCurveTo(x + s * 0.9, y - s * 1.1, x + s * 1.6, y - s * 0.1, x, y + s * 0.95);
    ctx.fill();
  } else {
    // a flag
    ctx.lineWidth = s * 0.3;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.6, y + s);
    ctx.lineTo(x - s * 0.6, y - s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - s * 0.6, y - s);
    ctx.lineTo(x + s * 0.95, y - s * 0.4);
    ctx.lineTo(x - s * 0.6, y + s * 0.15);
    ctx.closePath();
    ctx.fill();
  }
}

/** Screen rectangles of the city labels drawn this frame, for tapping a label to open its city. */
let labelRects: { id: number; x0: number; y0: number; x1: number; y1: number }[] = [];

/** The city whose label is under screen point (sx, sy), if any. */
export function cityLabelAt(sx: number, sy: number): number | null {
  for (let i = labelRects.length - 1; i >= 0; i--) {
    const r = labelRects[i];
    if (sx >= r.x0 && sx <= r.x1 && sy >= r.y0 && sy <= r.y1) return r.id;
  }
  return null;
}

/**
 * The unit whose figure is drawn under screen point (sx, sy), front-most first, among units the
 * viewer can see. Units stand about a tile's height above their tile, so tapping a figure should
 * pick the unit rather than whatever tile lies behind it.
 */
export function unitAtScreen(s: GameState, viewer: number, cam: Camera, sx: number, sy: number, facing?: Map<number, number>): Unit | null {
  const w = cam.toWorld(sx, sy);
  const us = unitScale(cam.zoom);
  const slack = 5 / (cam.zoom * us); // about 5 screen px of fingertip around the figure
  let best: Unit | null = null;
  let bestFeet = -Infinity;
  for (const u of s.units) {
    if (viewer >= 0 && !s.players[viewer].explored[u.y * s.size + u.x]) continue;
    const g = ground(s, u.x, u.y);
    const feet = g.y + 5;
    if (!figureHit(u.kind, rogueLook(s, u) ?? s.players[u.owner].tribe, (w.x - g.x) / us, (w.y - feet) / us, slack, (facing?.get(u.id) ?? 1) < 0)) continue;
    if (feet > bestFeet) {
      bestFeet = feet;
      best = u;
    }
  }
  return best;
}

function drawCityLabels(ctx: Ctx, s: GameState, viewer: number, cam: Camera, dpr: number, explored: (x: number, y: number) => boolean, onScreen: (p: Pt) => boolean, now: number, record: boolean, hudBottom: number) {
  const snap = (v: number) => Math.round(v * dpr) / dpr;
  const { k, detail } = overlayScale(cam.zoom);
  const rects: typeof labelRects = [];
  if (record) labelRects = rects;
  const boxes: LabelBox[] = [];
  for (const c of s.cities) {
    const p = tileCenter(c.x, c.y);
    if (!explored(c.x, c.y) || !onScreen(p) || !cityVisibleTo(s, viewer, c)) continue;
    const sp = cam.toScreen(p.x, p.y + 12);
    const mine = c.owner === viewer;
    const { w, h } = cityLabelSize(ctx, s, c, k, detail, mine);
    boxes.push({ id: c.id, x: snap(sp.x), y: snap(sp.y), w, h, pri: labelPriority(c, mine) });
  }
  // lesser labels first, so the ones that matter are drawn (and tapped) on top
  for (const b of declutterLabels(boxes, 3 * k).reverse()) {
    const c = s.cities.find((x) => x.id === b.id)!;
    ctx.globalAlpha = b.alpha * underHud(b.y + b.dy, hudBottom);
    const r = drawCityLabel(ctx, s, c, b.x, snap(b.y + b.dy), k, snap, detail, c.owner === viewer);
    ctx.globalAlpha = 1;
    if (c.owner === viewer) drawUnrestBadge(ctx, s, c, r, k, now); // a restless conquered city (see game/rebels)
    rects.push({ id: c.id, ...r });
  }
}

/** How strongly a label whose top is at screen y shows: faint while it sits up under the score bar, full below it. */
export const underHud = (y: number, hudBottom: number) => (hudBottom <= 0 ? 1 : Math.max(0.2, Math.min(1, (y - hudBottom + 24) / 24)));

/** A city label waiting to be placed: centred on x, its top at y, `w` x `h` CSS px, and how much it matters. */
export interface LabelBox { id: number; x: number; y: number; w: number; h: number; pri: number }
/** Where a label ends up: nudged down or up by `dy`, and faded to `alpha` when it still sits on a more important one. */
export interface PlacedLabel extends LabelBox { dy: number; alpha: number }
/** How faint a label is drawn when it can't get clear of a more important one. */
export const LABEL_FADE = 0.28;

/** Your own cities first, then capitals, then the biggest. */
export const labelPriority = (c: City, mine: boolean) => (mine ? 1000 : 0) + (c.capital ? 100 : 0) + c.level * 10 + Math.min(9, c.pop);

/**
 * City labels that would overlap on screen: the more important one (see labelPriority) stays put, the lesser one is
 * nudged a little down or up when that clears it, or else faded. Returns the labels most important first.
 */
export function declutterLabels(boxes: LabelBox[], gap: number): PlacedLabel[] {
  const placed: PlacedLabel[] = [];
  const hits = (b: LabelBox, dy: number) => placed.some((p) => p.alpha === 1
    && b.x - b.w / 2 < p.x + p.w / 2 + gap && p.x - p.w / 2 < b.x + b.w / 2 + gap
    && b.y + dy < p.y + p.dy + p.h + gap && p.y + p.dy < b.y + dy + b.h + gap);
  for (const b of [...boxes].sort((a, c) => c.pri - a.pri || a.id - c.id)) {
    // a short nudge keeps the label by its city; a longer one would leave it pointing at the wrong place
    const reach = b.h * 0.9;
    const dy = [0, reach / 2, -reach / 2, reach, -reach].find((d) => !hits(b, d));
    placed.push({ ...b, dy: dy ?? 0, alpha: dy === undefined ? LABEL_FADE : 1 });
  }
  return placed;
}

/** The size of a city's label: its pill, and under it the population bar of one of your own cities. */
function cityLabelSize(ctx: Ctx, s: GameState, c: City, k: number, detail: LabelDetail, mine: boolean) {
  ctx.font = `600 ${13 * k}px ${FONT}`;
  const nw = ctx.measureText(c.name).width;
  const iw = detail === 'full' ? ctx.measureText(String(cityIncome(s, c))).width : 0;
  const badge = c.capital ? 18 * k : 0;
  const w = 16 * k + badge + (badge ? 5 * k : 0) + nw + (detail === 'full' ? 20 * k + iw : 0) + (c.pendingRewards.length ? 18 * k : 0);
  return { w, h: 21 * k + (detail !== 'name' && mine ? POP_GAP * k + POP_H * k : 0) };
}

function drawScreenOverlay(ctx: Ctx, s: GameState, viewer: number, cam: Camera, ov: Overlay, dpr: number,
  units: Unit[], motion: Map<number, Motion>) {
  const snap = (v: number) => Math.round(v * dpr) / dpr;
  const { k, kh, detail } = overlayScale(cam.zoom);
  const us = unitScale(cam.zoom);

  if (!ov.living) {
    for (const u of units) {
      const b = hpBadge(s, u, ov, cam, motion.get(u.id)!, detail, kh, us);
      if (b) drawHpBadge(ctx, b.color, b.hp, b.low, b.veteran, snap(b.x), snap(b.y), kh, b.hero, b.lvl);
    }
  }
  drawActionBubbles(ctx, ov, cam, units, motion, k, us, snap);
  for (const f of ov.fx.floaters) {
    const q = (ov.now - f.t0) / FLOAT_MS;
    if (q < 0 || q > 1) continue;
    const c = tileCenter(f.x, f.y);
    const sp = cam.toScreen(c.x, c.y);
    const pose = floaterPose(q, !!f.hit, !!f.big);
    const size = Math.max(1, Math.round((f.hit ? 21 : 17) * pose.scale * k));
    const x = snap(sp.x + (f.dx ?? 0) * k), y = snap(sp.y - pose.rise * k);
    ctx.globalAlpha = pose.alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    if (f.label) { // the name of a critical blow, in small capitals above the number
      ctx.font = `800 ${Math.round(11 * Math.min(1.2, pose.scale / 1.3) * k)}px ${FONT}`;
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(60,0,0,0.85)';
      ctx.strokeText(f.label, x, y - size * 0.95);
      ctx.fillStyle = '#fff4c2';
      ctx.fillText(f.label, x, y - size * 0.95);
    }
    ctx.font = `${f.hit ? 900 : 700} ${size}px ${FONT}`;
    ctx.lineWidth = f.hit ? Math.max(3, size * 0.22) : 4;
    ctx.strokeStyle = f.big ? 'rgba(120,0,0,0.9)' : 'rgba(0,0,0,0.7)';
    ctx.strokeText(f.text, x, y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, x, y);
    ctx.globalAlpha = 1;
  }
}

export type LabelDetail = 'full' | 'mid' | 'name';

function drawCityLabel(ctx: Ctx, s: GameState, c: City, x: number, y: number, k: number, snap: (v: number) => number, detail: LabelDetail, mine: boolean): { x0: number; y0: number; x1: number; y1: number } {
  const T = { color: isRogueCity(s, c) ? REBEL_COLOR : TRIBES[s.players[c.owner].tribe].color }; // Rogue States fly crimson
  const fs = 13 * k;
  ctx.font = `600 ${fs}px ${FONT}`;
  const nw = ctx.measureText(c.name).width;
  const showIncome = detail === 'full';
  const inc = String(cityIncome(s, c));
  const iw = showIncome ? ctx.measureText(inc).width : 0;
  const pad = 8 * k, h = 21 * k, badge = c.capital ? 18 * k : 0;
  const w = pad + badge + (badge ? 5 * k : 0) + nw + (showIncome ? 8 * k + 12 * k + iw : 0) + pad;
  const x0 = snap(x - w / 2), y0 = y;
  // drop shadow, body with a soft top highlight, darker rim
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  roundRect(ctx, x0 + 1, y0 + 2.5 * k, w, h, 6 * k);
  ctx.fill();
  const grad = ctx.createLinearGradient(0, y0, 0, y0 + h);
  grad.addColorStop(0, shade(T.color, 0.18));
  grad.addColorStop(1, shade(T.color, -0.12));
  ctx.fillStyle = grad;
  roundRect(ctx, x0, y0, w, h, 6 * k);
  ctx.fill();
  ctx.strokeStyle = shade(T.color, -0.35);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ctx.moveTo(x0 + 6 * k, y0 + 1.2);
  ctx.lineTo(x0 + w - 6 * k, y0 + 1.2);
  ctx.stroke();
  let cx = x0 + pad;
  const mid = y0 + h / 2;
  if (c.capital) {
    ellipse(ctx, cx + badge / 2, mid, badge / 2, badge / 2, shade(T.color, -0.4));
    const bx = cx + badge / 2, s1 = badge * 0.3;
    poly(ctx, [bx - s1, mid + s1 * 0.8, bx - s1, mid - s1 * 0.3, bx - s1 * 0.5, mid + s1 * 0.2, bx, mid - s1 * 0.9, bx + s1 * 0.5, mid + s1 * 0.2, bx + s1, mid - s1 * 0.3, bx + s1, mid + s1 * 0.8], '#ffcf33');
    cx += badge + 5 * k;
  }
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowOffsetY = 1;
  ctx.fillText(c.name, snap(cx), snap(mid + 1.2 * k));
  ctx.shadowColor = 'transparent';
  ctx.shadowOffsetY = 0;
  if (c.capital) ctx.fillRect(snap(cx), snap(mid + fs * 0.52), nw, Math.max(1, 1.2 * k));
  if (showIncome) {
    cx += nw + 8 * k;
    drawStar(ctx, cx + 6 * k, mid, 6.5 * k);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(inc, snap(cx + 13 * k), snap(mid + 1.2 * k));
  }
  ctx.textBaseline = 'alphabetic';
  const bar = detail !== 'name' && mine; // only your own cities show how near they are to growing
  if (bar) drawPopulation(ctx, c, x, y0 + h + POP_GAP * k, k, snap, T.color);
  if (c.pendingRewards.length && s.players[c.owner].human) {
    const px = x0 + w + 9 * k, py = mid;
    ellipse(ctx, px, py + 1.5, 8 * k, 8 * k, 'rgba(0,0,0,0.3)');
    ellipse(ctx, px, py, 8 * k, 8 * k, '#ffcf33');
    ctx.fillStyle = '#3a2a00';
    ctx.font = `700 ${Math.round(12 * k)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', px, py + 1);
    ctx.textBaseline = 'alphabetic';
  }
  // the area a tap on this label should count for (pill, reward badge and population bar)
  const bottom = bar ? y0 + h + POP_GAP * k + POP_H * k + 1 : y0 + h + 2.5 * k;
  return { x0, y0, x1: x0 + w + (c.pendingRewards.length ? 18 * k : 0), y1: bottom };
}

/** The population bar under a label: its height and its gap below the pill (times the label scale). */
const POP_H = 5, POP_GAP = 3;

/** The slim bar under one of your cities' names: one pip per population needed for the next level. */
function drawPopulation(ctx: Ctx, c: City, x: number, by: number, k: number, snap: (v: number) => number, color: string) {
  const segs = popNeeded(c.level);
  const bw = Math.max(36 * k, Math.min(segs * 9 * k, 80 * k)), bh = POP_H * k; // wide levels squeeze their pips rather than the label
  const bx = snap(x - bw / 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, bx, by + 1, bw, bh, bh / 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(247,247,247,0.92)';
  roundRect(ctx, bx, by, bw, bh, bh / 2);
  ctx.fill();
  const sw = bw / segs, inset = Math.max(0.8, bh * 0.18);
  for (let i = 0; i < segs; i++) {
    const sx = bx + sw * i;
    if (i < c.pop) {
      ctx.fillStyle = shade(color, 0.12);
      roundRect(ctx, sx + inset, by + inset, sw - inset * 2, bh - inset * 2, (bh - inset * 2) / 2);
      ctx.fill();
    }
    if (i > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      ctx.fillRect(snap(sx) - 0.5, by + inset, 1, bh - inset * 2);
    }
  }
}

/**
 * Does `u` wear its health badge (showing `hp`)? Only when there is something to read: it is hurt, selected, a veteran
 * or a hero, or an enemy the selected unit could strike. A healthy rank-and-file unit shows none, so a busy map stays
 * clear. Far out (`detail` 'name') only the hurt and the selected keep theirs.
 */
export function badgeShown(s: GameState, u: Unit, ov: Overlay, hp: number, detail: LabelDetail = 'full'): boolean {
  const selected = ov.selected?.x === u.x && ov.selected?.y === u.y;
  if (hp < maxHp(u) || selected) return true;
  if (detail === 'name') return false;
  if (u.veteran || isHero(s, u)) return true;
  if (ov.attacks.some((a) => a.x === u.x && a.y === u.y)) return true;
  const sel = ov.selected && s.units.find((v) => v.x === ov.selected!.x && v.y === ov.selected!.y);
  return !!sel && sel.owner !== u.owner && hostile(s, sel.owner, u.owner) && dist(sel.x, sel.y, u.x, u.y) <= attackRange(s, sel);
}

/** A unit's health badge, if it shows (see badgeShown): its look and where it goes (screen space). */
export function hpBadge(s: GameState, u: Unit, ov: Overlay, cam: Camera, m: Motion, detail: LabelDetail, kh: number, us: number) {
  const hold = ov.fx.hpHold.get(u.id);
  const hp = Math.ceil(hold && ov.now < hold.until ? hold.hp : u.hp);
  if (!badgeShown(s, u, ov, hp, detail)) return null;
  const sp = cam.toScreen(m.x - 18 * us / 1.3, m.y - m.lift - 36 * us / 1.3);
  if (ov.hudBottom && sp.y < ov.hudBottom) return null; // up under the score bar it would only muddle the numbers
  const color = isRogueUnit(s, u) ? REBEL_COLOR : isRaider(s, u) ? CLAN_COLOR : s.players[u.owner].neutral ? WILD_COLOR : TRIBES[s.players[u.owner].tribe].color;
  return { x: sp.x, y: sp.y, color, hp, low: hp <= maxHp(u) * 0.35, veteran: !!u.veteran, k: kh, hero: isHero(s, u), lvl: s.players[u.owner].hero?.lvl ?? 1 };
}

/** A shield-shaped health badge centred on (x, y): `low` shows the number in red, `veteran` adds a star. */
export function drawHpBadge(ctx: Ctx, color: string, hp: number, low: boolean, veteran: boolean, x: number, y: number, k: number, hero = false, lvl = 1) {
  const w = 16 * k, h = 18 * k;
  const shield = (ox: number, oy: number) => {
    ctx.beginPath();
    ctx.moveTo(ox - w / 2, oy - h / 2);
    ctx.lineTo(ox + w / 2, oy - h / 2);
    ctx.lineTo(ox + w / 2, oy + h * 0.12);
    ctx.quadraticCurveTo(ox + w / 2, oy + h * 0.38, ox, oy + h / 2);
    ctx.quadraticCurveTo(ox - w / 2, oy + h * 0.38, ox - w / 2, oy + h * 0.12);
    ctx.closePath();
  };
  shield(x + 0.8, y + 1.8);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fill();
  shield(x, y);
  const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#e3e6ee');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = hero ? '#e0a820' : color; // a hero's shield is edged in gold
  ctx.lineWidth = (hero ? 2.8 : 2.2) * k;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fillStyle = low ? '#d62828' : '#1d1d24';
  ctx.font = `700 ${Math.round((hp >= 10 ? 10 : 11) * k)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(hp), x, y + 0.5 * k);
  ctx.textBaseline = 'alphabetic';
  if (veteran) drawStar(ctx, x, y - h / 2 - 4 * k, 4.5 * k);
  if (hero) { // the hero's level on a gold star above the shield
    drawStar(ctx, x, y - h / 2 - 5 * k, 7 * k);
    ctx.fillStyle = '#5a3200';
    ctx.font = `800 ${Math.round(7.5 * k)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(lvl), x, y - h / 2 - 4.4 * k);
    ctx.textBaseline = 'alphabetic';
  }
}

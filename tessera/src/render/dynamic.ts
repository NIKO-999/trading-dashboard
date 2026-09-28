// Everything on the map that moves: units walking tile by tile, swimming fish and whales,
// water glints, selection rings, combat effects, plus the crisp screen-space labels on top.
import { TRIBES } from '../data/tribes';
import { UNITS } from '../data/units';
import { tileAt } from '../game/grid';
import { cityIncome, maxHp } from '../game/rules';
import type { City, GameState, Tile, TribeId, Unit } from '../game/types';
import { Camera, WATER_DROP, tileCenter } from './camera';
import { FLASH_MS, FLOAT_MS, FONT, GHOST_MS, HH, HW, isWaterTile, LUNGE_MS, REDUCED_MOTION, UNIT_SCALE, uv, type Fx, type Overlay } from './common';
import { drawStar, ellipse, poly, rand, roundRect, shade, softShadow, type Ctx, type Pt } from './prims';
import { drawSprite, unitSprite } from './sprites';

interface Motion { x: number; y: number; lift: number; sx: number; sy: number; facing: number; water: boolean }

const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

function ground(s: GameState, x: number, y: number) {
  const c = tileCenter(x, y);
  const t = tileAt(s, x, y);
  return { x: c.x, y: c.y + (t && isWaterTile(t) ? WATER_DROP - 1 : 0), water: !!t && isWaterTile(t) };
}

/** Where a unit is drawn right now: walking its path, lunging, bobbing on water or idling. */
export function unitMotion(s: GameState, u: Unit, fx: Fx, now: number, ready: boolean): Motion {
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
  if (!REDUCED_MOTION) {
    if (p.water) p = { ...p, y: p.y + Math.sin(now / 520 + u.id) * 1.2 };
    else if (ready && !mv) lift += (Math.sin(now / 380 + u.id * 1.7) + 1) * 0.9;
  }
  return { x: p.x, y: p.y, lift, sx, sy, facing: fx.facing.get(u.id) ?? 1, water: p.water };
}

export function drawDynamic(ctx: Ctx, s: GameState, viewer: number, cam: Camera, ov: Overlay, vw: number, vh: number, dpr: number) {
  const now = ov.now;
  const fx = ov.fx;
  const explored = (x: number, y: number) => viewer < 0 || s.players[viewer].explored[y * s.size + x];
  const w0 = cam.toWorld(-90, -140), w1 = cam.toWorld(vw + 90, vh + 140);
  const onScreen = (p: Pt) => p.x > w0.x && p.x < w1.x && p.y > w0.y && p.y < w1.y;

  ctx.save();
  ctx.translate(cam.x, cam.y);
  ctx.scale(cam.zoom, cam.zoom);

  drawSelection(ctx, s, ov, now);

  const units = s.units
    .filter((u) => explored(u.x, u.y) && onScreen(tileCenter(u.x, u.y)))
    .sort((a, b) => a.x + a.y - (b.x + b.y) || a.x - b.x);
  const motion = new Map<number, Motion>();
  for (const u of units) {
    const ready = u.owner === viewer && s.current === viewer && !u.moved;
    motion.set(u.id, unitMotion(s, u, fx, now, ready));
  }
  // ground shadows first so no unit's shadow lands on another unit
  for (const u of units) {
    const m = motion.get(u.id)!;
    const naval = UNITS[u.kind].naval;
    const shrink = 1 - Math.min(0.45, m.lift / 22);
    softShadow(ctx, m.x, m.y + 6, (naval ? 21 : 12) * UNIT_SCALE * 0.78 * shrink, (naval ? 6.5 : 4.6) * UNIT_SCALE * 0.78 * shrink, naval ? 0.22 : 0.34);
  }
  const pxScale = UNIT_SCALE * cam.zoom * dpr;
  for (const u of units) drawUnit(ctx, s, u, motion.get(u.id)!, ov, viewer, pxScale);

  for (const g of fx.ghosts) {
    const k = (now - g.t0) / GHOST_MS;
    if (k < 0 || k > 1) continue;
    const c = tileCenter(g.x, g.y);
    const y = c.y + 5 + k * 8;
    drawSprite(ctx, unitSprite(g.kind, g.tribe, pxScale, 'base'), c.x, y, UNIT_SCALE, 1 + k * 0.1, 1 - k * 0.35, g.facing < 0, 1 - k);
    const white = Math.max(0, 0.9 - k * 2.5);
    if (white > 0) drawSprite(ctx, unitSprite(g.kind, g.tribe, pxScale, 'white'), c.x, y, UNIT_SCALE, 1 + k * 0.1, 1 - k * 0.35, g.facing < 0, white);
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
  ctx.restore();

  drawScreenOverlay(ctx, s, viewer, cam, ov, vw, vh, dpr, units, motion, explored, onScreen);
}

// ---------------------------------------------------------------- units

function drawUnit(ctx: Ctx, s: GameState, u: Unit, m: Motion, ov: Overlay, viewer: number, pxScale: number) {
  const now = ov.now;
  const tribe = s.players[u.owner].tribe;
  const spent = u.owner === viewer && s.current === viewer && u.moved && u.attacked;
  const fl = ov.fx.flashes.get(u.id);
  const flashK = fl === undefined ? -1 : (now - fl) / FLASH_MS;
  const flashing = flashK >= 0 && flashK <= 1;
  const shake = flashing ? Math.sin(flashK * 42) * 2.2 * (1 - flashK) : 0;
  const x = m.x + shake, y = m.y - m.lift + 5;
  drawSprite(ctx, unitSprite(u.kind, tribe, pxScale, spent ? 'spent' : 'base'), x, y, UNIT_SCALE, m.sx, m.sy, m.facing < 0);
  if (flashing) drawSprite(ctx, unitSprite(u.kind, tribe, pxScale, 'white'), x, y, UNIT_SCALE, m.sx, m.sy, m.facing < 0, (1 - flashK) * 0.85);
}

// ---------------------------------------------------------------- water life

export const FISH: Record<TribeId, [string, string]> = {
  egypt: ['#f2c45a', '#c98a1e'],
  aztec: ['#ff8a3d', '#c4481a'],
  polynesia: ['#ffe04a', '#2f8fd8'],
  rome: ['#c9d6e2', '#6f8aa3'],
  pirates: ['#5fd1c1', '#1f7f86'],
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
    if (t.resource === 'fish') drawFishSchool(ctx, t, c.x, cy, t0);
    else if (t.resource === 'whale') drawWhale(ctx, t, c.x, cy, t0);
    // a glint that twinkles now and then
    const tw = Math.pow(Math.max(0, Math.sin(t0 / 700 + t.seed)), 12);
    if (tw > 0.02) {
      const g = uv(c.x, cy, rand(t.seed, 31) * 0.6 - 0.3, rand(t.seed, 32) * 0.6 - 0.3);
      ctx.globalAlpha = tw;
      poly(ctx, [g.x, g.y - 3.2, g.x + 0.8, g.y - 0.6, g.x + 3.2, g.y, g.x + 0.8, g.y + 0.6, g.x, g.y + 3.2, g.x - 0.8, g.y + 0.6, g.x - 3.2, g.y, g.x - 0.8, g.y - 0.6], '#ffffff');
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}

function drawFishSchool(ctx: Ctx, t: Tile, cx: number, cy: number, now: number) {
  const [body, back] = FISH[t.biome];
  // ripples spreading from where the fish are feeding
  const period = 2600;
  const rk = ((now + t.seed * 37) % period) / period;
  const rp = uv(cx, cy, rand(t.seed, 41) * 0.3 - 0.15, rand(t.seed, 42) * 0.3 - 0.15);
  ctx.strokeStyle = `rgba(255,255,255,${0.55 * (1 - rk)})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(rp.x, rp.y, 3 + rk * 12, (3 + rk * 12) * 0.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const speed = 0.32 + rand(t.seed, 200 + i) * 0.22;
    const dir = i % 2 ? 1 : -1;
    const ph = (now / 1000) * speed * dir + rand(t.seed, 210 + i) * 6.28;
    const ru = 0.16 + rand(t.seed, 220 + i) * 0.08, rv = 0.1 + rand(t.seed, 230 + i) * 0.06;
    const ou = rand(t.seed, 240 + i) * 0.1 - 0.05, ov = rand(t.seed, 250 + i) * 0.1 - 0.05;
    const p = uv(cx, cy, ou + Math.cos(ph) * ru, ov + Math.sin(ph) * rv);
    // heading on the ground plane (before the 2:1 isometric squash)
    const du = -Math.sin(ph) * ru * dir, dv = Math.cos(ph) * rv * dir;
    const heading = Math.atan2(du + dv, du - dv);
    drawFish(ctx, p.x, p.y, heading, body, back, now / 110 + i * 2, 0.95 + rand(t.seed, 260 + i) * 0.3);
  }
}

/**
 * A small fish seen from above, lying on the water plane: `heading` is measured on the ground
 * plane and the drawing is squashed 2:1 like the tiles, so it turns naturally as it swims.
 */
export function drawFish(ctx: Ctx, x: number, y: number, heading: number, body: string, back: string, wiggle: number, k: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, 0.5);
  ctx.rotate(heading);
  ctx.scale(k * 0.85, k * 0.85);
  ellipse(ctx, 1.5, 7.5, 9, 3, 'rgba(0,40,90,0.14)'); // shadow on the sea floor
  const alpha = ctx.globalAlpha;
  ctx.globalAlpha = alpha * 0.9;
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
  ellipse(ctx, 6.3, -1.4, 0.6, 0.6, '#0d1a22');
  ellipse(ctx, 6.3, 1.4, 0.6, 0.6, '#0d1a22');
  ctx.restore();
}

function drawWhale(ctx: Ctx, t: Tile, x: number, y: number, now: number) {
  const rise = Math.sin(now / 1100 + t.seed) * 1.6;
  const wy = y + 3 - rise;
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 18, 6, 0, 0, Math.PI * 2);
  ctx.stroke();
  ellipse(ctx, x, wy, 15, 5.6, '#25344f');
  ellipse(ctx, x - 2, wy - 2.2, 11, 3, '#3d5378');
  ellipse(ctx, x - 5, wy - 2.8, 4, 1.2, '#5a739c');
  const tail = Math.sin(now / 500 + t.seed) * 2;
  poly(ctx, [x + 13, wy - 1, x + 21, wy - 7 + tail, x + 17.5, wy - 1.5, x + 21, wy + 3 + tail], '#25344f');
  // spout every few seconds
  const period = 3600;
  const k = ((now + t.seed * 53) % period) / period;
  if (k < 0.35) {
    const q = k / 0.35;
    ctx.globalAlpha = 1 - q;
    for (let i = -2; i <= 2; i++) {
      const dx = i * 2.2 * q, h = 14 * Math.sin(Math.PI * Math.min(1, q * 1.4)) * (1 - Math.abs(i) * 0.15);
      ellipse(ctx, x - 7 + dx * 2, wy - 5 - h, 1.4, 1.4, '#eaf8ff');
    }
    ctx.globalAlpha = 1;
  }
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

function drawSelection(ctx: Ctx, s: GameState, ov: Overlay, now: number) {
  if (ov.selected) {
    const t = tileAt(s, ov.selected.x, ov.selected.y);
    if (t) {
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
    const k = ((now / 1100) + i * 0.07) % 1;
    ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - k)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(c.x, y, 8 + k * 7, (8 + k * 7) * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    softShadow(ctx, c.x, y + 1, 9, 4.5, 0.18);
    ellipse(ctx, c.x, y, 7.5, 3.8, 'rgba(255,255,255,0.88)');
    ellipse(ctx, c.x, y - 0.6, 5.5, 2.4, '#ffffff');
  });
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
  const x = p.x + p.vx * t, y = p.y + p.vy * t + 0.5 * p.g * t * t;
  ctx.globalAlpha = Math.min(1, a * 1.4);
  switch (p.shape) {
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

function drawScreenOverlay(ctx: Ctx, s: GameState, viewer: number, cam: Camera, ov: Overlay, vw: number, vh: number, dpr: number,
  units: Unit[], motion: Map<number, Motion>, explored: (x: number, y: number) => boolean, onScreen: (p: Pt) => boolean) {
  const snap = (v: number) => Math.round(v * dpr) / dpr;
  const k = Math.max(0.78, Math.min(1.25, cam.zoom));

  // gentle vignette for depth
  const g = ctx.createRadialGradient(vw / 2, vh * 0.45, Math.min(vw, vh) * 0.35, vw / 2, vh * 0.45, Math.max(vw, vh) * 0.8);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.32)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, vw, vh);

  for (const c of s.cities) {
    const p = tileCenter(c.x, c.y);
    if (!explored(c.x, c.y) || !onScreen(p)) continue;
    const sp = cam.toScreen(p.x, p.y + 12);
    drawCityLabel(ctx, s, c, snap(sp.x), snap(sp.y), k, snap);
  }
  for (const u of units) {
    const m = motion.get(u.id)!;
    const sp = cam.toScreen(m.x - 18 * UNIT_SCALE / 1.3, m.y - m.lift - 36 * UNIT_SCALE / 1.3);
    const hold = ov.fx.hpHold.get(u.id);
    drawHpBadge(ctx, s, u, snap(sp.x), snap(sp.y), k, hold && ov.now < hold.until ? hold.hp : u.hp);
  }
  for (const f of ov.fx.floaters) {
    const q = (ov.now - f.t0) / FLOAT_MS;
    if (q < 0 || q > 1) continue;
    const c = tileCenter(f.x, f.y);
    const sp = cam.toScreen(c.x, c.y);
    const pop = q < 0.15 ? 0.6 + (q / 0.15) * 0.5 : 1.1 - Math.min(0.1, q - 0.15);
    const size = Math.round(17 * pop * k);
    const y = sp.y - (54 + q * 26) * k;
    ctx.globalAlpha = 1 - q * q;
    ctx.font = `700 ${size}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.strokeText(f.text, snap(sp.x), snap(y));
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, snap(sp.x), snap(y));
    ctx.globalAlpha = 1;
  }
}

function drawCityLabel(ctx: Ctx, s: GameState, c: City, x: number, y: number, k: number, snap: (v: number) => number) {
  const T = TRIBES[s.players[c.owner].tribe];
  const fs = 13 * k;
  ctx.font = `600 ${fs}px ${FONT}`;
  const nw = ctx.measureText(c.name).width;
  const inc = String(cityIncome(s, c));
  const iw = ctx.measureText(inc).width;
  const pad = 8 * k, h = 21 * k, badge = c.capital ? 18 * k : 0;
  const w = pad + badge + (badge ? 5 * k : 0) + nw + 8 * k + 12 * k + iw + pad;
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
  cx += nw + 8 * k;
  drawStar(ctx, cx + 6 * k, mid, 6.5 * k);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(inc, snap(cx + 13 * k), snap(mid + 1.2 * k));
  ctx.textBaseline = 'alphabetic';

  // population: one pip per population needed for the next level
  const segs = c.level + 1;
  const bw = Math.max(40 * k, segs * 11 * k), bh = 9 * k;
  const bx = snap(x - bw / 2), by = y0 + h + 4 * k;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  roundRect(ctx, bx, by + 1.5, bw, bh, bh / 2);
  ctx.fill();
  ctx.fillStyle = '#f7f7f7';
  roundRect(ctx, bx, by, bw, bh, bh / 2);
  ctx.fill();
  const sw = bw / segs;
  for (let i = 0; i < segs; i++) {
    const sx = bx + sw * i;
    if (i < c.pop) {
      const pg = ctx.createLinearGradient(0, by, 0, by + bh);
      pg.addColorStop(0, shade(T.color, 0.25));
      pg.addColorStop(1, shade(T.color, -0.1));
      ctx.fillStyle = pg;
      roundRect(ctx, sx + 1.5, by + 1.5, sw - 3, bh - 3, (bh - 3) / 2);
      ctx.fill();
    }
    if (i > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(snap(sx) - 0.5, by + 2, 1, bh - 4);
    }
  }
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
}

function drawHpBadge(ctx: Ctx, s: GameState, u: Unit, x: number, y: number, k: number, shownHp: number) {
  const tribe = TRIBES[s.players[u.owner].tribe];
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
  ctx.strokeStyle = tribe.color;
  ctx.lineWidth = 2.2 * k;
  ctx.lineJoin = 'round';
  ctx.stroke();
  const hp = Math.ceil(shownHp);
  ctx.fillStyle = hp <= maxHp(u) * 0.35 ? '#d62828' : '#1d1d24';
  ctx.font = `700 ${Math.round((hp >= 10 ? 10 : 11) * k)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(hp), x, y + 0.5 * k);
  ctx.textBaseline = 'alphabetic';
  if (u.veteran) drawStar(ctx, x, y - h / 2 - 4 * k, 4.5 * k);
}

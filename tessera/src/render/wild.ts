// Drawing side of the wild events (see game/wild): the Kraken rising from the deep, active volcanoes with their lava
// and ash, and the mercenary camps. Static parts go on the cached map layers; smoke, glowing lava, swaying tentacles
// and the camp's hire sign are redrawn every frame.
import { unitVisibleTo } from '../game/mech';
import { campAt, isAsh, isLava, isBeast, volcanoDue } from '../game/wild';
import type { GameState, Tile } from '../game/types';
import type { Camera } from './camera';
import { tileCenter, WATER_DROP } from './camera';
import { HH, HW, REDUCED_MOTION, type Overlay } from './common';
import { drawStar, ellipse, ink, line, mix, poly, rand, shade, softShadow, type Ctx } from './prims';

/** The colour of things that belong to no empire (badges, chips). */
export const WILD_COLOR = '#7b6f86';

const BASALT = '#4a3d3b';
const LAVA = '#f2672a';
const LAVA_HOT = '#ffc34a';
const ASH = '#9a9095';
const KRAKEN = '#7a3f78';
const KRAKEN_BELLY = '#e0a3b8';

// ---------------------------------------------------------------- the Kraken

/** A tapering tentacle rising from (x, y), curling over at the tip. `sway` bends it (-1..1). */
function tentacle(ctx: Ctx, x: number, y: number, h: number, w: number, curl: number, sway: number, color: string) {
  const n = 9;
  const left: number[] = [], right: number[] = [];
  const mid: { x: number; y: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    // up the stalk, then over into a hook at the tip
    const px = x + sway * h * 0.25 * k * k + curl * h * 0.42 * Math.pow(k, 3);
    const py = y - h * Math.sin(k * Math.PI * 0.62) * (1 - 0.15 * k * k);
    const r = w * (1 - k * 0.82) / 2;
    mid.push({ x: px, y: py });
    left.push(px - r, py);
    right.unshift(px + r, py);
  }
  poly(ctx, [...left, ...right], color);
  // pale suckers along the inner side
  for (let i = 1; i < n - 1; i += 2) {
    const k = i / n;
    ellipse(ctx, mid[i].x + curl * w * 0.22, mid[i].y, Math.max(0.7, w * 0.16 * (1 - k)), Math.max(0.6, w * 0.12 * (1 - k)), KRAKEN_BELLY);
  }
}

/** The Kraken's figure: a domed mantle breaking the surface with glaring eyes and a crown of arms. Feet at (x, y). */
export function drawKraken(ctx: Ctx, x: number, y: number) {
  // the churned water around it
  ellipse(ctx, x, y - 1, 30, 9, 'rgba(18,40,70,0.35)');
  ellipse(ctx, x, y - 2, 25, 6.5, '#2d5f8a');
  // arms behind the body
  tentacle(ctx, x - 20, y - 2, 26, 6, -1, -0.4, shade(KRAKEN, -0.18));
  tentacle(ctx, x + 21, y - 2, 30, 6.4, 1, 0.3, shade(KRAKEN, -0.22));
  // the mantle: a lopsided dome, lit from the left
  const dome = (x0: number, x1: number, color: string) => {
    ctx.beginPath();
    ctx.moveTo(x - 15, y - 3);
    ctx.bezierCurveTo(x - 18, y - 22, x - 10, y - 40, x + 2, y - 38);
    ctx.bezierCurveTo(x + 14, y - 36, x + 18, y - 20, x + 14, y - 3);
    ctx.closePath();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = ink(color);
    ctx.fillRect(x0, y - 42, x1 - x0, 42);
    ctx.restore();
  };
  dome(x - 20, x + 20, KRAKEN);
  dome(x + 2, x + 20, shade(KRAKEN, -0.22)); // the shaded side
  poly(ctx, [x - 12, y - 25, x - 6, y - 34, x - 2, y - 33, x - 9, y - 22], shade(KRAKEN, 0.22)); // a wet highlight
  for (const [ox, oy, r] of [[-7, -17, 2.2], [6, -24, 1.8], [-2, -28, 1.4], [9, -12, 1.6]] as const) ellipse(ctx, x + ox, y + oy, r, r * 0.8, shade(KRAKEN, 0.3)); // warts
  // eyes: slit-pupilled and gold
  for (const ox of [-6, 5]) {
    ellipse(ctx, x + ox, y - 11, 3.6, 2.8, '#ffd24a');
    ellipse(ctx, x + ox, y - 11, 0.9, 2.4, '#1a0f14');
  }
  poly(ctx, [x - 10, y - 14.5, x - 2, y - 13, x - 3, y - 12, x - 10, y - 13.2], shade(KRAKEN, -0.4)); // a brooding brow
  poly(ctx, [x + 9, y - 14.5, x + 1, y - 13, x + 2, y - 12, x + 9, y - 13.2], shade(KRAKEN, -0.4));
  // arms in front, breaking the water
  tentacle(ctx, x - 11, y + 1, 17, 5.4, 1, -0.6, shade(KRAKEN, 0.06));
  tentacle(ctx, x + 10, y + 2, 14, 5, -1, 0.5, KRAKEN);
  // foam where the arms cut the surface
  for (const ox of [-20, -11, 10, 21]) ellipse(ctx, x + ox, y + (Math.abs(ox) > 15 ? -2 : 1.5), 4, 1.4, 'rgba(235,250,255,0.85)');
}

/** Extra arms thrashing in the water around a Kraken, and slow rings spreading from it. */
function krakenWake(ctx: Ctx, cx: number, cy: number, now: number, seed: number) {
  const y = cy + WATER_DROP;
  for (let i = 0; i < 2; i++) {
    const k = ((now / 2400 + i * 0.5 + seed * 0.13) % 1);
    ctx.strokeStyle = `rgba(230,248,255,${0.45 * (1 - k)})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(cx, y + 2, 16 + k * 20, 6 + k * 9, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // two arms rising and sinking at the tile's edges, out of step with each other
  for (const [u, v, dir, ph] of [[-0.42, 0.1, -1, 0], [0.12, 0.42, 1, 2.2]] as const) {
    const px = cx + (u - v) * HW, py = y + (u + v) * HH;
    const rise = REDUCED_MOTION ? 0.7 : 0.5 + 0.5 * Math.sin(now / 700 + ph + seed);
    if (rise < 0.12) continue;
    tentacle(ctx, px, py, 16 * rise, 4.4, dir, Math.sin(now / 420 + ph) * 0.6, shade(KRAKEN, -0.08));
    ellipse(ctx, px, py + 0.5, 4.5, 1.5, 'rgba(235,250,255,0.8)');
  }
}

// ---------------------------------------------------------------- volcanoes, lava and ash

/** Paints lava or ash over a land tile's ground (cached layer). (x, y) is the tile's top corner. */
export function drawWildGround(ctx: Ctx, t: Tile, x: number, y: number) {
  const D = [x, y, x + HW, y + HH, x, y + HH * 2, x - HW, y + HH];
  if (isLava(t)) {
    poly(ctx, D, BASALT);
    // glowing cracks between crusted plates
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const a = rand(t.seed, 40 + i) * Math.PI * 2;
      const cx = x + (rand(t.seed, 50 + i) - 0.5) * HW * 0.9, cy = y + HH + (rand(t.seed, 60 + i) - 0.5) * HH * 0.9;
      const dx = Math.cos(a) * 11, dy = Math.sin(a) * 5.5;
      line(ctx, cx - dx, cy - dy, cx + dx * 0.4, cy + dy * 0.4 + 2, LAVA, 2.6);
      line(ctx, cx + dx * 0.4, cy + dy * 0.4 + 2, cx + dx, cy + dy - 1, LAVA, 1.8);
    }
    ctx.restore();
    return;
  }
  if (!isAsh(t)) return;
  ctx.save();
  ctx.globalAlpha = 0.62;
  poly(ctx, [x, y + 3, x + HW - 5, y + HH, x, y + HH * 2 - 3, x - HW + 5, y + HH], ASH);
  ctx.restore();
  for (let i = 0; i < 9; i++) { // dark cinders and pale drifts
    const px = x + (rand(t.seed, 70 + i) - 0.5) * HW * 1.1, py = y + HH + (rand(t.seed, 80 + i) - 0.5) * HH * 1.1;
    ellipse(ctx, px, py, 1.8 + rand(t.seed, 90 + i) * 2, 0.9 + rand(t.seed, 95 + i), i % 3 ? '#5f5559' : '#c9c2c4');
  }
  for (let i = 0; i < 3; i++) { // the first shoots coming through
    const px = x + (rand(t.seed, 100 + i) - 0.5) * HW * 0.8, py = y + HH + (rand(t.seed, 110 + i) - 0.5) * HH * 0.8;
    poly(ctx, [px, py, px - 2.2, py - 3.5, px - 0.4, py - 0.6], '#6fbf4a');
    poly(ctx, [px, py, px + 2.4, py - 3, px + 0.4, py - 0.5], '#8fd35a');
  }
}

/** An active volcano in place of the usual peaks (cached layer). Returns false for any other tile. */
export function drawVolcano(ctx: Ctx, t: Tile, cx: number, cy: number): boolean {
  if (volcanoDue(t) === null) return false;
  const y = cy + 6, top = y - 30;
  // a broad, slightly lopsided cone cut off at the crater
  poly(ctx, [cx - 27, y, cx - 9, top, cx, top + 2, cx + 1, y + 8], shade(BASALT, 0.16));
  poly(ctx, [cx + 1, y + 8, cx, top + 2, cx + 10, top - 1, cx + 26, y - 2], shade(BASALT, -0.14));
  // old flows streaking the flanks
  poly(ctx, [cx - 6, top + 2, cx - 3, top + 3, cx - 9, y - 12, cx - 14, y - 3, cx - 17, y - 3, cx - 11, y - 14], mix(BASALT, '#1f1515', 0.5));
  poly(ctx, [cx + 5, top + 2, cx + 8, top + 1, cx + 14, y - 10, cx + 13, y - 1, cx + 10, y - 1, cx + 10, y - 11], mix(BASALT, '#1f1515', 0.5));
  poly(ctx, [cx - 4, top + 3, cx - 2, top + 3, cx - 6, y - 16, cx - 9, y - 9, cx - 10, y - 9, cx - 7, y - 17], LAVA);
  // the crater's rim and its glowing throat
  ellipse(ctx, cx + 0.5, top + 1, 10.5, 4, shade(BASALT, 0.3));
  ellipse(ctx, cx + 0.5, top + 1.4, 8, 2.8, '#2a1a18');
  ellipse(ctx, cx + 0.5, top + 1.8, 5.5, 1.6, LAVA);
  ellipse(ctx, cx + 0.5, top + 1.9, 2.6, 0.8, LAVA_HOT);
  // scree at the foot
  for (let i = 0; i < 4; i++) ellipse(ctx, cx - 18 + i * 12, y + 2 + (i % 2) * 2, 2.4, 1.3, shade(BASALT, 0.05));
  return true;
}

// ---------------------------------------------------------------- mercenary camps

/** A striped canvas tent with its door flap tied back. */
function tent(ctx: Ctx, x: number, y: number, w: number, h: number, a: string, b: string) {
  poly(ctx, [x - w / 2, y, x, y - h, x, y + w / 4], a);
  poly(ctx, [x, y - h, x + w / 2, y, x, y + w / 4], shade(a, -0.24));
  for (const k of [0.33, 0.66]) poly(ctx, [x + (w / 2) * (k - 0.07), y - h * (1 - k) + (w / 4) * (k - 0.07) * 0.2, x + (w / 2) * k, y - h * (1 - k) + (w / 4) * k * 0.2 - 0.5, x + (w / 2) * k, y + (w / 4) * (1 - k) * 0.9, x + (w / 2) * (k - 0.07), y + (w / 4) * (1 - k + 0.07) * 0.9], shade(b, -0.2));
  poly(ctx, [x - w * 0.2, y + w * 0.02, x - w * 0.02, y - h * 0.62, x - w * 0.02, y + w * 0.22], '#2b1d17'); // the doorway
  poly(ctx, [x - w * 0.02, y - h * 0.62, x - w * 0.28, y + w * 0.02, x - w * 0.34, y - w * 0.03], b); // flap
  line(ctx, x, y - h, x, y - h - 4, '#5a3d22', 1.2);
}

/** The camp: tents, a fire, a rack of spears and a banner of no nation (cached layer). */
export function drawCamp(ctx: Ctx, s: GameState, t: Tile, cx: number, cy: number) {
  if (!campAt(s, t.x, t.y)) return;
  ellipse(ctx, cx, cy + 2, 24, 10, 'rgba(120,96,60,0.3)'); // trampled earth
  tent(ctx, cx + 10, cy - 5, 19, 16, '#d8c69e', '#35506b'); // back to front
  tent(ctx, cx - 11, cy - 2, 22, 18, '#e6d6b0', '#8a3b2e');
  // spear rack
  for (let i = 0; i < 3; i++) line(ctx, cx + 13 + i * 2.5, cy + 8 - i, cx + 11 + i * 2.5, cy - 7 - i, '#6b4a2a', 1.1);
  line(ctx, cx + 10, cy + 3, cx + 20, cy, '#6b4a2a', 1.3);
  for (let i = 0; i < 3; i++) poly(ctx, [cx + 11 + i * 2.5, cy - 7 - i, cx + 10 + i * 2.5, cy - 11 - i, cx + 12 + i * 2.5, cy - 8 - i], '#c9ced6');
  // the camp fire's stones
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ellipse(ctx, cx - 1 + Math.cos(a) * 4, cy + 8 + Math.sin(a) * 1.8, 1.5, 1, '#8d8a86'); }
  // a banner pole with a pennant of no nation
  line(ctx, cx - 1, cy + 1, cx - 1, cy - 30, '#4a3320', 1.6);
  poly(ctx, [cx - 0.3, cy - 30, cx + 12, cy - 27, cx + 7, cy - 24.5, cx + 12, cy - 22, cx - 0.3, cy - 22], WILD_COLOR);
  ellipse(ctx, cx + 4, cy - 26, 1.6, 1.6, '#f0c43a'); // a coin sewn on: they fight for pay
}

// ---------------------------------------------------------------- every frame

function smoke(ctx: Ctx, x: number, y: number, now: number, heavy: boolean, seed: number) {
  const n = heavy ? 6 : 3;
  for (let i = 0; i < n; i++) {
    const k = (now / (heavy ? 1500 : 2600) + i / n + seed * 0.07) % 1;
    const r = 3 + k * (heavy ? 11 : 7);
    const drift = Math.sin(k * 3 + i) * 4 + k * 6;
    ctx.fillStyle = heavy ? `rgba(70,62,64,${0.55 * (1 - k)})` : `rgba(150,146,150,${0.4 * (1 - k)})`;
    ctx.beginPath();
    ctx.arc(x + drift, y - k * (heavy ? 38 : 26), r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Smoke over the craters, glowing lava, the Kraken's arms and the camps' hire signs. */
export function drawWildOverlay(ctx: Ctx, s: GameState, viewer: number, _cam: Camera, ov: Overlay, now: number) {
  if (!s.wild) return;
  const seen = (x: number, y: number) => viewer < 0 || !!s.players[viewer]?.explored[y * s.size + x];
  const t0 = REDUCED_MOTION ? 0 : now;
  for (const t of s.tiles) {
    if (!seen(t.x, t.y)) continue;
    const c = tileCenter(t.x, t.y);
    const due = volcanoDue(t);
    if (due !== null) {
      const rumbling = due - s.turn <= 1;
      const pulse = 0.5 + 0.5 * Math.sin(t0 / (rumbling ? 180 : 600));
      ctx.save();
      ctx.globalAlpha = (rumbling ? 0.5 : 0.25) + 0.25 * pulse;
      ellipse(ctx, c.x + 0.5, c.y - 23, 9, 3.5, LAVA_HOT);
      ctx.restore();
      smoke(ctx, c.x + 1, c.y - 26, t0, rumbling, t.seed);
    } else if (isLava(t)) {
      const pulse = 0.5 + 0.5 * Math.sin(t0 / 350 + t.seed);
      ctx.save();
      ctx.globalAlpha = 0.18 + 0.14 * pulse;
      ellipse(ctx, c.x, c.y, 26, 12, LAVA_HOT);
      ctx.restore();
      for (let i = 0; i < 2; i++) { // a bubble swells and pops
        const k = (t0 / 1300 + i * 0.5 + rand(t.seed, i)) % 1;
        const bx = c.x + (rand(t.seed, 10 + i) - 0.5) * 30, by = c.y + (rand(t.seed, 20 + i) - 0.5) * 12;
        ellipse(ctx, bx, by - k * 2, 1 + k * 2.4, 0.6 + k * 1.3, k > 0.85 ? LAVA_HOT : LAVA);
      }
    }
    const camp = campAt(s, t.x, t.y);
    if (camp?.offer) { // a bobbing sign: someone is for hire
      const bob = Math.sin(t0 / 500 + t.seed) * 1.6;
      const y = c.y - 44 + bob;
      softShadow(ctx, c.x + 14, c.y - 18, 5, 2, 0.2);
      ellipse(ctx, c.x + 14, y, 7.5, 7.5, '#2c2433');
      ellipse(ctx, c.x + 14, y, 6.2, 6.2, WILD_COLOR);
      drawStar(ctx, c.x + 14, y, 5);
    }
  }
  for (const u of s.units) {
    if (!isBeast(s, u) || !seen(u.x, u.y) || (viewer >= 0 && !unitVisibleTo(s, viewer, u))) continue;
    const mv = ov.fx.moves.get(u.id);
    if (mv && now - mv.t0 < mv.dur) continue; // it is swimming: the arms show once it settles
    const c = tileCenter(u.x, u.y);
    krakenWake(ctx, c.x, c.y, t0, u.id);
  }
}

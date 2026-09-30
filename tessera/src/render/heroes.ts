// Drawing side of the heroes (see game/heroes): the gold aura around each hero, the Admiral's turtle ship under him on
// the water, and the marks a hero's ability leaves on units (a gold ring for a blessing, a red one for a curse, a rope
// for a trapped foe). All of it is part of the map picture, so it shows on the resting (photographed) map too.
import { heroMarks, heroUnit, isHero } from '../game/heroes';
import { unitVisibleTo } from '../game/mech';
import { isWater } from '../game/grid';
import type { GameState, Unit } from '../game/types';
import { tileCenter, WATER_DROP } from './camera';
import { HH, HW, REDUCED_MOTION } from './common';
import { drawStar, ellipse, poly, shade, type Ctx } from './prims';

const GOLD = '#f0c43a';

function diamond(ctx: Ctx, x: number, y: number, k: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - HH * k);
  ctx.lineTo(x + HW * k, y);
  ctx.lineTo(x, y + HH * k);
  ctx.lineTo(x - HW * k, y);
  ctx.closePath();
}

/** The Admiral's turtle ship: a low armoured hull with a spiked roof and a dragon head, under the hero's feet. */
function turtleShip(ctx: Ctx, x: number, y: number) {
  poly(ctx, [x - 20, y - 2, x + 18, y - 2, x + 14, y + 6, x - 16, y + 6], '#5a3a22');
  poly(ctx, [x - 20, y - 2, x + 18, y - 2, x + 16, y + 1, x - 18, y + 1], '#7a5230');
  poly(ctx, [x - 16, y - 2, x + 14, y - 2, x + 10, y - 7, x - 12, y - 7], '#3f5a4a'); // the plated roof
  for (let i = -10; i <= 10; i += 4) poly(ctx, [x + i - 1, y - 6.5, x + i + 1, y - 6.5, x + i, y - 9], '#bcc3cc'); // iron spikes
  poly(ctx, [x + 18, y - 2, x + 24, y - 6, x + 25, y - 3, x + 20, y + 1], '#c8372d'); // the dragon head
  ellipse(ctx, x + 23, y - 4.6, 0.8, 0.8, '#f0c43a');
  for (let i = -12; i <= 8; i += 5) ellipse(ctx, x + i, y + 2.5, 1.2, 0.8, '#1b1b1f'); // oar ports
}

/** Ground layer, drawn under the units. */
export function drawHeroGround(ctx: Ctx, s: GameState, viewer: number, now: number) {
  const seen = (u: Unit) => viewer < 0 || (s.players[viewer].explored[u.y * s.size + u.x] && unitVisibleTo(s, viewer, u));
  const pulse = REDUCED_MOTION ? 0.5 : (Math.sin(now / 420) + 1) / 2;
  for (const p of s.players) {
    if (!p.alive || p.hero?.unit == null) continue;
    const h = heroUnit(s, p.id);
    if (!h || !seen(h)) continue;
    const c = tileCenter(h.x, h.y);
    ctx.save();
    // the aura: the hero's own tile glows, the eight around it are traced in dashed gold
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = `rgba(240,196,58,${0.35 + pulse * 0.2})`;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const n = tileCenter(h.x + dx, h.y + dy);
      if (h.x + dx < 0 || h.y + dy < 0 || h.x + dx >= s.size || h.y + dy >= s.size) continue;
      diamond(ctx, n.x, n.y, 0.8);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    diamond(ctx, c.x, c.y, 0.92);
    ctx.fillStyle = `rgba(255,214,90,${0.16 + pulse * 0.1})`;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = GOLD;
    ctx.stroke();
    ctx.restore();
    const t = s.tiles[h.y * s.size + h.x];
    if (typeof h.data?.turtle === 'number' && isWater(t)) turtleShip(ctx, c.x, c.y + WATER_DROP + 3);
  }
  // marks left by abilities
  for (const u of s.units) {
    if (!u.data || !seen(u) || isHero(s, u)) continue;
    const m = heroMarks(u);
    if (!m.buff && !m.curse && !m.trapped) continue;
    const t = s.tiles[u.y * s.size + u.x];
    const c = tileCenter(u.x, u.y);
    const y = c.y + (isWater(t) ? WATER_DROP : 0) + 4;
    ctx.save();
    if (m.buff) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(240,196,58,${0.6 + pulse * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(c.x, y, 15, 7, 0, 0, Math.PI * 2);
      ctx.stroke();
      drawStar(ctx, c.x + 14, y - 2, 3.2);
    }
    if (m.curse) {
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = 'rgba(214,40,40,0.8)';
      ctx.beginPath();
      ctx.ellipse(c.x, y, 16, 7.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (m.trapped) { // a coil of rope around the feet, knotted in front
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#8a6433';
      for (const r of [0, 2.4]) {
        ctx.beginPath();
        ctx.ellipse(c.x, y - 2 - r, 11, 5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ellipse(ctx, c.x, y + 3, 2, 1.4, shade('#8a6433', -0.3));
    }
    ctx.restore();
  }
}

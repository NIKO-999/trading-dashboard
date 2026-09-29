import type { Ctx } from '../prims';
import { tileCenter } from '../camera';
import { isExplored } from '../../game/rules';
import type { MechRender } from './types';

const burning = (t: { data?: Record<string, unknown> }) => typeof t.data?.fire === 'number' && (t.data.fire as number) > 0;

function flame(ctx: Ctx, x: number, y: number, size: number, phase: number) {
  const sway = Math.sin(phase) * size * 0.25;
  const lick = 0.8 + 0.25 * Math.sin(phase * 1.7);
  for (const [k, color] of [[1, '#e8552a'], [0.68, '#ff9a2e'], [0.36, '#ffe27a']] as const) {
    const w = size * 0.5 * k, h = size * 1.5 * k * lick;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.quadraticCurveTo(x - w, y - h * 0.5, x + sway, y - h);
    ctx.quadraticCurveTo(x + w, y - h * 0.5, x + w, y);
    ctx.closePath();
    ctx.fill();
  }
}

export const render: MechRender = {
  overlay(ctx, s, viewer, _cam, _ov, now) {
    for (const t of s.tiles) {
      if (!burning(t) || (viewer >= 0 && !isExplored(s, viewer, t.x, t.y))) continue;
      const c = tileCenter(t.x, t.y);
      ctx.save();
      ctx.fillStyle = 'rgba(70,20,10,0.22)'; // scorched ground
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 24, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 3; i++) {
        const ox = (i - 1) * 11, oy = (i === 1 ? -3 : 3);
        flame(ctx, c.x + ox, c.y + oy, 9 + (i === 1 ? 4 : 0), now / 170 + t.seed * 0.001 + i * 2.1);
      }
      ctx.restore();
    }
  },
};

import { tileCenter } from '../camera';
import type { MechRender } from './types';

export const render: MechRender = {
  overlay(ctx, s, _viewer, _cam, _ov, now) {
    for (const u of s.units) {
      if (s.players[u.owner].tribe !== 'japan') continue;
      const c = tileCenter(u.x, u.y);
      if (u.hp === 1) { // Last Stand: a red aura
        const pulse = 1 + Math.sin(now / 200) * 0.12;
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255,40,40,0.35)';
        ctx.beginPath();
        ctx.ellipse(c.x, c.y + 4, 20 * pulse, 10 * pulse, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ff3030';
        ctx.stroke();
      }
      if (u.data?.kiai === s.turn) { // Kiai! flash
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000';
        ctx.strokeText('Kiai!', c.x, c.y - 30);
        ctx.fillStyle = '#ffd23f';
        ctx.fillText('Kiai!', c.x, c.y - 30);
      }
    }
  },
};

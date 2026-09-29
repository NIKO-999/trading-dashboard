// Celts: a Sacred Grove (standing stones round a glowing sapling), ley pulses on groves and grown forest, roots on entangled units.
import { tileCenter } from '../camera';
import { box, ellipse, line, softShadow } from '../prims';
import type { MechRender } from './types';

export const render: MechRender = {
  tile(ctx, _s, t, cx, cy) {
    if (t.improvement !== 'grove') return;
    softShadow(ctx, cx, cy + 8, 16, 6, 0.25);
    for (const [dx, dy] of [[-13, 6], [-7, 11], [7, 11], [13, 6]] as const) box(ctx, cx + dx, cy + dy, 4, 8, '#8f9a92', '#b7c1b9'); // standing stones
    ellipse(ctx, cx, cy + 4, 5, 2.5, 'rgba(150,255,170,0.35)');
    ellipse(ctx, cx, cy + 3, 2.5, 1.2, 'rgba(230,255,210,0.7)');
  },

  overlay(ctx, s, _viewer, _cam, _ov, now) {
    for (const t of s.tiles) {
      if (t.improvement === 'grove' && t.data?.ley !== undefined) {
        const c = tileCenter(t.x, t.y);
        const k = Math.sin(now / 400 + t.x + t.y);
        ctx.strokeStyle = `rgba(140,255,170,${0.4 + k * 0.2})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(c.x, c.y + 4, 16 + k * 2, 8 + k, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (t.data?.grown) {
        const c = tileCenter(t.x, t.y);
        ctx.fillStyle = `rgba(150,255,170,${0.5 + 0.3 * Math.sin(now / 500 + t.x * 2)})`;
        ctx.beginPath();
        ctx.arc(c.x, c.y + 10, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (const u of s.units) {
      const r = u.data?.rootT as number | undefined;
      if (r === undefined || s.turn > r + 1) continue;
      const c = tileCenter(u.x, u.y);
      for (let i = -2; i <= 2; i++) line(ctx, c.x + i * 5, c.y + 14, c.x + i * 4 + Math.sin(now / 300 + i) * 2, c.y - 2, '#3f7a3a', 2);
    }
  },
};

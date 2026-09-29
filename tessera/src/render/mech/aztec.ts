import { tileCenter } from '../camera';
import { carried } from '../../game/mech/aztec';
import { isExplored } from '../../game/rules';
import type { MechRender } from './types';

// A stepped blood altar beside the city on every altar tile; a rope-and-captive mark over each unit dragging prisoners;
// a golden pulse over the Aztec cities while a Sun Age burns.
export const render: MechRender = {
  tile(ctx, _s, t, cx, cy) {
    if (t.improvement !== 'altar') return;
    ctx.save();
    ctx.translate(cx + 15, cy + 7);
    ctx.fillStyle = '#8f8676';
    ctx.fillRect(-8, 0, 16, 4);
    ctx.fillStyle = '#a49b88';
    ctx.fillRect(-6, -4, 12, 4);
    ctx.fillStyle = '#b8af9a';
    ctx.fillRect(-4, -8, 8, 4);
    ctx.fillStyle = '#9d2b22'; // blood on the sacrificial stone
    ctx.fillRect(-3, -9, 6, 2);
    ctx.fillStyle = '#e8892a'; // brazier flame
    ctx.beginPath();
    ctx.moveTo(-2.5, -9);
    ctx.quadraticCurveTo(-3, -14, 0, -17);
    ctx.quadraticCurveTo(3, -14, 2.5, -9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },

  overlay(ctx, s, viewer, _cam, _ov, now) {
    for (const u of s.units) {
      const n = carried(u);
      if (!n || (viewer >= 0 && u.owner !== viewer && !isExplored(s, viewer, u.x, u.y))) continue;
      const c = tileCenter(u.x, u.y);
      ctx.save();
      ctx.translate(c.x + 13, c.y - 18 + Math.sin(now / 300 + u.id) * 1.2);
      ctx.strokeStyle = '#6b3f1c'; // rope
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-8, 8);
      ctx.quadraticCurveTo(-4, 12, 0, 6);
      ctx.stroke();
      for (let i = 0; i < n; i++) { // captives: little bowed figures in red-brown
        const x = i * 7 - (n - 1) * 3.5;
        ctx.fillStyle = '#b3402a';
        ctx.beginPath();
        ctx.arc(x, 0, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x - 2.4, 2, 4.8, 6);
      }
      ctx.restore();
    }
    for (const c of s.cities) {
      const pl = s.players[c.owner];
      const sun = pl.tribe === 'aztec' && typeof pl.mech?.sun === 'number' ? (pl.mech.sun as number) : 0;
      if (sun <= 0 || (viewer >= 0 && !isExplored(s, viewer, c.x, c.y))) continue;
      const p = tileCenter(c.x, c.y);
      ctx.save();
      const pulse = 0.5 + 0.5 * Math.sin(now / 420 + c.id);
      ctx.strokeStyle = `rgba(255,205,70,${0.25 + 0.3 * pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 6, 30 + pulse * 5, 14 + pulse * 2.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,215,90,0.18)';
      ctx.fill();
      ctx.restore();
    }
  },
};

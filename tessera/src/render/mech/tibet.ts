import { tileCenter } from '../camera';
import { hasMist } from '../../game/mech/tibet';
import type { MechRender } from './types';

// A whitewashed chorten on every stupa tile, and a drifting veil of Sky Mist over the owner's misted cities.
export const render: MechRender = {
  tile(ctx, _s, t, cx, cy) {
    if (t.improvement !== 'stupa') return;
    ctx.save();
    ctx.translate(cx, cy + 4);
    ctx.fillStyle = '#f4f0e6';
    ctx.fillRect(-7, 0, 14, 4); // plinth
    ctx.fillRect(-5, -3, 10, 3);
    ctx.beginPath(); // bell
    ctx.ellipse(0, -6, 5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9a2f30'; // red band
    ctx.fillRect(-3, -12, 6, 3);
    ctx.fillStyle = '#d9ac2e'; // gilded spire
    ctx.beginPath();
    ctx.moveTo(-2.5, -12);
    ctx.lineTo(0, -21);
    ctx.lineTo(2.5, -12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },

  overlay(ctx, s, viewer, _cam, _ov, now) {
    for (const c of s.cities) {
      if (viewer < 0 || c.owner !== viewer || s.players[c.owner].tribe !== 'tibet' || !hasMist(s, c)) continue;
      const p = tileCenter(c.x, c.y);
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const a = now / 2600 + i * 2.1 + c.id;
        ctx.fillStyle = 'rgba(235,242,250,0.22)';
        ctx.beginPath();
        ctx.ellipse(p.x + Math.cos(a) * 16, p.y + 8 + Math.sin(a * 1.3) * 3, 22, 7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  },
};

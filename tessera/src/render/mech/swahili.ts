// Swahili: a whitewashed coral-stone lighthouse with a lit lantern, and drifting wind arrows over the sea.
import { tileCenter } from '../camera';
import { isWater } from '../../game/grid';
import { DIRS, windDir } from '../../game/mech/swahili';
import type { MechRender } from './types';

export const render: MechRender = {
  tile(ctx, _s, t, cx, cy) {
    if (t.improvement !== 'lighthouse') return;
    ctx.save();
    ctx.translate(cx, cy + 5);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(0, 3, 9, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2ead8'; // tapering tower
    ctx.beginPath(); ctx.moveTo(-6, 3); ctx.lineTo(6, 3); ctx.lineTo(3.5, -16); ctx.lineTo(-3.5, -16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c2453a'; // red bands
    ctx.fillRect(-4.9, -6, 9.8, 3); ctx.fillRect(-4.2, -12, 8.4, 2.4);
    ctx.fillStyle = '#5b3a24'; ctx.fillRect(-4.5, -18, 9, 2.5); // gallery
    ctx.fillStyle = '#ffd66b'; ctx.fillRect(-2.5, -22, 5, 4); // lantern
    ctx.fillStyle = '#5b3a24';
    ctx.beginPath(); ctx.moveTo(-3.5, -22); ctx.lineTo(0, -26); ctx.lineTo(3.5, -22); ctx.closePath(); ctx.fill();
    ctx.restore();
  },

  // Animated wind: a sparse lattice of arrows drifting across visible water tiles in the wind's direction.
  overlay(ctx, s, viewer, cam, _ov, now) {
    const d = DIRS[windDir(s)];
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1600, vh = typeof window !== 'undefined' ? window.innerHeight : 1000;
    const p = viewer >= 0 ? s.players[viewer] : null;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const t of s.tiles) {
      if ((t.x + t.y * 2) % 3 !== 0 || !isWater(t)) continue;
      if (p && !p.explored[t.y * s.size + t.x]) continue;
      const c = tileCenter(t.x, t.y);
      const sc = cam.toScreen(c.x, c.y);
      if (sc.x < -80 || sc.y < -80 || sc.x > vw + 80 || sc.y > vh + 80) continue;
      // wind steps in tile space; convert to isometric world offset
      const ph = ((now / 1800 + t.x * 0.13 + t.y * 0.29) % 1);
      const off = (ph - 0.5) * 0.9;
      const wx = ((d.dx * off) - (d.dy * off)) * 32, wy = ((d.dx * off) + (d.dy * off)) * 16;
      const ax = ((d.dx - d.dy) * 32), ay = ((d.dx + d.dy) * 16);
      const len = Math.hypot(ax, ay) || 1;
      const ux = ax / len, uy = ay / len;
      const x = c.x + wx, y = c.y + wy;
      ctx.strokeStyle = `rgba(255,255,255,${0.5 * Math.sin(ph * Math.PI)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x - ux * 8, y - uy * 8); ctx.lineTo(x + ux * 8, y + uy * 8);
      ctx.moveTo(x + ux * 8 - ux * 4 - uy * 3, y + uy * 8 - uy * 4 + ux * 3);
      ctx.lineTo(x + ux * 8, y + uy * 8);
      ctx.lineTo(x + ux * 8 - ux * 4 + uy * 3, y + uy * 8 - uy * 4 - ux * 3);
      ctx.stroke();
    }
    ctx.restore();
  },
};

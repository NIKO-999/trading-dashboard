import { tileCenter } from '../camera';
import type { MechRender } from './types';

// Songline Tracks are invisible to everyone but the Aboriginal player: an ochre dotted trail joining adjacent tracks,
// drawn only in the overlay for that viewer (the cached tile layer is shared and the base renderer draws nothing for them).
export const render: MechRender = {
  overlay(ctx, s, viewer, _cam, _ov, now) {
    if (viewer < 0 || s.players[viewer]?.tribe !== 'aboriginal') return;
    ctx.save();
    for (const t of s.tiles) {
      if (t.improvement !== 'songline' || !s.players[viewer].explored[t.y * s.size + t.x]) continue;
      const c = tileCenter(t.x, t.y);
      const pulse = 0.5 + 0.5 * Math.sin(now / 500 + t.x + t.y);
      ctx.fillStyle = `rgba(224,150,60,${0.55 + pulse * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y + 2, 7, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f6e3b4';
      for (const [dx, dy] of [[-3, 0], [0, -1], [3, 0], [0, 2]]) {
        ctx.beginPath();
        ctx.arc(c.x + dx, c.y + 2 + dy, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const [nx, ny] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
        const x = t.x + nx, y = t.y + ny;
        if (x >= s.size || y < 0 || y >= s.size) continue;
        const n = s.tiles[y * s.size + x];
        if (n.improvement !== 'songline') continue;
        const q = tileCenter(n.x, n.y);
        ctx.strokeStyle = 'rgba(224,150,60,0.75)';
        ctx.setLineDash([2, 3]);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(c.x, c.y + 2); ctx.lineTo(q.x, q.y + 2); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.restore();
  },
};

// China: Great Wall segments (a crenellated tower on the tile) joined to neighbouring segments by wall bands.
import { tileCenter } from '../camera';
import { box, line, poly, softShadow } from '../prims';
import { activeWall, isWall } from '../../game/mech/china';
import { isExplored } from '../../game/rules';
import { tileAt } from '../../game/grid';
import type { MechRender } from './types';

export const render: MechRender = {
  tile(ctx, _s, t, cx, cy) {
    if (!isWall(t)) return;
    softShadow(ctx, cx, cy + 8, 14, 6, 0.3);
    box(ctx, cx, cy + 8, 22, 14, '#9a8f7a', '#b9ad95'); // stone watchtower
    for (let i = 0; i < 3; i++) box(ctx, cx - 8 + i * 8, cy - 5, 4, 4, '#8a7f6b', '#a89c84'); // crenellations
    poly(ctx, [cx - 8, cy - 5, cx, cy - 15, cx + 8, cy - 5], '#c9532f'); // a pagoda roof
    line(ctx, cx - 8, cy - 5, cx + 8, cy - 5, '#7a3a20', 1);
  },

  overlay(ctx, s, viewer) {
    ctx.save();
    ctx.lineCap = 'round';
    for (const t of s.tiles) {
      if (!isWall(t) || (viewer >= 0 && !isExplored(s, viewer, t.x, t.y))) continue;
      for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) { // each pair once
        const n = tileAt(s, t.x + dx, t.y + dy);
        if (!n || !isWall(n) || n.data!.wall !== t.data!.wall || !activeWall(s, n, n.data!.wall as number)) continue;
        const a = tileCenter(t.x, t.y), b = tileCenter(n.x, n.y);
        ctx.strokeStyle = '#6f6552'; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(a.x, a.y + 2); ctx.lineTo(b.x, b.y + 2); ctx.stroke();
        ctx.strokeStyle = '#b9ad95'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    ctx.restore();
  },
};

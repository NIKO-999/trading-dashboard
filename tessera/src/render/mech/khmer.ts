// Khmer: barays (reservoir pools with lotus and a laterite bank), dams (a stone sluice gate) and the surge of a flood.
import { tileCenter } from '../camera';
import { box, ellipse, line, poly, softShadow } from '../prims';
import type { MechRender } from './types';

export const render: MechRender = {
  tile(ctx, _s, t, cx, cy) {
    if (t.improvement === 'baray') {
      softShadow(ctx, cx, cy + 6, 18, 8, 0.2);
      ellipse(ctx, cx, cy + 5, 19, 9.5, '#b0714a'); // laterite bank
      ellipse(ctx, cx, cy + 4, 16.5, 8, '#3f9ec4');
      ellipse(ctx, cx - 3, cy + 3, 9, 4, '#5cbadb');
      for (const [dx, dy] of [[-6, 4], [5, 6], [2, 1]] as const) ellipse(ctx, cx + dx, cy + dy, 2.6, 1.3, '#2a8f5a'); // pads
      ellipse(ctx, cx - 6, cy + 3, 1.3, 0.9, '#f6a9c6'); // a lotus bloom
      return;
    }
    if (t.improvement === 'dam') {
      softShadow(ctx, cx, cy + 8, 14, 6, 0.3);
      box(ctx, cx - 8, cy + 6, 8, 7, '#cdb891', '#e4d3ae'); // two stone piers
      box(ctx, cx + 8, cy + 6, 8, 7, '#cdb891', '#e4d3ae');
      poly(ctx, [cx - 5, cy + 4, cx + 5, cy + 4, cx + 5, cy + 10, cx - 5, cy + 10], '#6b4a2a'); // the timber gate
      for (let i = -3; i <= 3; i += 3) line(ctx, cx + i, cy + 4, cx + i, cy + 10, '#4a331c', 1);
      ellipse(ctx, cx, cy + 12, 6, 2, '#5cbadb'); // water seeping through
    }
  },

  overlay(ctx, s, _viewer, _cam, _ov, now) {
    for (const t of s.tiles) {
      if (!t.data?.flood) continue;
      const c = tileCenter(t.x, t.y);
      const k = Math.sin(now / 260 + t.x * 1.7 + t.y * 1.3);
      ctx.strokeStyle = `rgba(230,250,255,${0.45 + k * 0.2})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y + 3, 15 + k * 2, 7 + k, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  },
};

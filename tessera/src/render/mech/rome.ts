// Rome: a castra, the little palisaded fort a legion digs on a paved road.
import { box, ellipse, line, poly, softShadow } from '../prims';
import type { MechRender } from './types';

export const render: MechRender = {
  tile(ctx, _s, t, cx, cy) {
    if (t.improvement !== 'fort' || typeof t.data?.castra !== 'number') return;
    softShadow(ctx, cx, cy + 8, 16, 7, 0.3);
    box(ctx, cx, cy + 9, 26, 5, '#b9a98a', '#d2c4a4'); // the earth rampart
    for (let i = 0; i < 5; i++) { // sharpened stakes along the front
      const x = cx - 10 + i * 5;
      poly(ctx, [x - 1.6, cy + 6, x, cy - 3, x + 1.6, cy + 6], i % 2 ? '#7a5230' : '#8a5f38');
    }
    box(ctx, cx + 4, cy + 3, 9, 8, '#a02a22', '#c0392b'); // a red tent
    line(ctx, cx - 9, cy + 2, cx - 9, cy - 13, '#5a3b1e', 1.4); // standard pole
    poly(ctx, [cx - 9, cy - 13, cx - 2, cy - 11, cx - 9, cy - 8], '#c0392b');
    ellipse(ctx, cx - 9, cy - 14, 1.6, 1.6, '#e8c14a');
  },
};

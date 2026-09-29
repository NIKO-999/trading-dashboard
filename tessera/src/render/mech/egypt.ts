// Egypt: obelisk-like megaliths, fallen-hero cairns, and silt farms with their flood countdown.
import { box, ellipse, line, poly, softShadow } from '../prims';
import type { MechRender } from './types';

export const render: MechRender = {
  tile(ctx, _s, t, cx, cy) {
    if (t.improvement === 'monolith') {
      softShadow(ctx, cx, cy + 9, 14, 6, 0.3);
      box(ctx, cx, cy + 9, 18, 5, '#c9b07a', '#dcc590');
      poly(ctx, [cx - 5, cy + 7, cx - 3.5, cy - 12, cx + 3.5, cy - 12, cx + 5, cy + 7], '#d8c08a');
      poly(ctx, [cx - 3.5, cy - 12, cx, cy - 18, cx + 3.5, cy - 12], '#e8c14a'); // gilded tip
      line(ctx, cx, cy - 8, cx, cy + 2, '#8a6d3b', 1.2);
      return;
    }
    if (t.data?.fallen === true) { // a small cairn for the fallen
      ellipse(ctx, cx, cy + 6, 7, 3, '#8f8a7a');
      ellipse(ctx, cx - 2, cy + 3, 3.5, 2.5, '#a9a390');
      ellipse(ctx, cx + 2, cy + 4, 3, 2.2, '#b5af9b');
      return;
    }
    if (t.improvement === 'farm' && typeof t.data?.silt === 'number') {
      const ph = t.data.silt as number;
      for (let i = 0; i < 4; i++) ellipse(ctx, cx - 9 + i * 6, cy + 11, 1.8, 1.8, i < ph ? '#2f8fbf' : '#8a6d3b'); // flood countdown pips
      if (ph === 3) line(ctx, cx - 12, cy + 14, cx + 12, cy + 14, '#5fb4de', 1.5); // the waters are rising
    }
  },
};

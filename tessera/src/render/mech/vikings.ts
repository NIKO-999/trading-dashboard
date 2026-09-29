// Vikings: a Danelaw haven, a beached longship's prow and a red raiding banner on the shore.
import { box, ellipse, line, poly, softShadow } from '../prims';
import type { MechRender } from './types';

export const render: MechRender = {
  tile(ctx, _s, t, cx, cy) {
    if (typeof t.data?.danelaw !== 'number') return;
    softShadow(ctx, cx, cy + 8, 15, 6, 0.3);
    poly(ctx, [cx - 12, cy + 4, cx + 10, cy + 4, cx + 14, cy - 2, cx - 10, cy + 8], '#6b4a2b'); // hull
    poly(ctx, [cx + 10, cy + 4, cx + 15, cy - 9, cx + 13, cy - 9, cx + 8, cy - 1], '#8a5f38'); // prow
    ellipse(ctx, cx + 15, cy - 10, 1.8, 1.8, '#e8c14a');
    box(ctx, cx - 6, cy + 9, 8, 4, '#4a3a2a', '#6a5238'); // a stack of loot
    line(ctx, cx - 6, cy + 3, cx - 6, cy - 14, '#4a3524', 1.4);
    poly(ctx, [cx - 6, cy - 14, cx + 3, cy - 11, cx - 6, cy - 7], '#b02a2a');
  },
};

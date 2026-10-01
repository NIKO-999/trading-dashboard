// Portugal: a padrão on every padrão tile. A white limestone pillar on a stepped plinth, a plain moulded capital and a
// square cube on top (kept secular: no cross), weathered and lichened, with a little green-and-red pennant on a staff
// beside it and a few stones and tufts round its foot.
import { box, ellipse, line, poly, shade, softShadow } from '../prims';
import type { Ctx } from '../prims';
import type { MechRender } from './types';

const STONE = '#f2eee4';
const STONE_D = '#c8c0ae';
const GREEN = '#1a7a4a';
const RED = '#c4262e';
const LICHEN = '#a8a868';

/** The padrão, standing on (x, y). */
export function padrao(ctx: Ctx, x: number, y: number) {
  softShadow(ctx, x + 2, y + 1.5, 11, 4.4, 0.3);
  // a few stones and grass tufts round the foot
  for (const [dx, dy, r] of [[-7, 2, 1.2], [6, 3, 1], [-4, 4.4, 0.8], [8.4, 0.4, 0.7]] as const) {
    ellipse(ctx, x + dx, y + dy + 0.4, r * 1.3, r * 0.8, '#8a8476');
    ellipse(ctx, x + dx, y + dy, r * 1.3, r * 0.8, '#bab4a4');
  }
  for (const [dx, dy] of [[-8.6, 0], [4.6, 4.4], [-2, 5]] as const) {
    for (const a of [-0.5, 0, 0.5]) line(ctx, x + dx, y + dy, x + dx + a * 2, y + dy - 2.2, '#5a7a3a', 0.5);
  }
  // the stepped plinth
  box(ctx, x, y + 2, 10, 2, STONE_D);
  box(ctx, x, y, 7.4, 1.8, shade(STONE, -0.06));
  // the shaft: a round column, lit from the left
  const sy = y - 1.8, top = sy - 17, r = 1.9;
  poly(ctx, [x - r, sy, x - r * 0.9, top, x + r * 0.9, top, x + r, sy], STONE);
  poly(ctx, [x + 0.2, sy + 0.6, x + 0.2, top, x + r * 0.9, top, x + r, sy], shade(STONE, -0.16));
  line(ctx, x - r * 0.5, sy - 1, x - r * 0.45, top + 1, '#ffffff', 0.5);
  ellipse(ctx, x + 0.6, sy - 4, 0.9, 1.4, LICHEN); // weathering
  ellipse(ctx, x - 0.8, sy - 1.4, 0.7, 0.6, shade(LICHEN, -0.1));
  for (const v of [0.35, 0.68]) line(ctx, x - r * 0.95, sy - (sy - top) * v, x + r * 0.95, sy - (sy - top) * v + 0.4, 'rgba(0,0,0,0.12)', 0.3); // joints
  // the capital: a flared moulding, then the cube
  poly(ctx, [x - r * 0.9, top, x - 2.9, top - 1.4, x + 2.9, top - 1.4, x + r * 0.9, top], shade(STONE, -0.08));
  poly(ctx, [x + 0.2, top, x + 0.2, top - 1.4, x + 2.9, top - 1.4, x + r * 0.9, top], shade(STONE, -0.24));
  box(ctx, x, top - 1.2, 6, 0.8, shade(STONE, -0.04));
  box(ctx, x, top - 2, 5, 4.6, STONE);
  // a carved plain disc on the cube's faces (an emblem worn smooth by the sea wind)
  ellipse(ctx, x - 1.25, top - 4, 0.9, 1.1, shade(STONE, -0.14));
  ellipse(ctx, x + 1.25, top - 4, 0.9, 1.1, shade(STONE, -0.32));
  box(ctx, x, top - 6.6, 3.6, 0.6, shade(STONE, -0.04)); // the cap-stone
  // the pennant on its staff beside the pillar
  const px = x + 6.4, py = y + 2.2, pt = py - 22;
  line(ctx, px, py, px, pt, '#5a3a20', 0.8);
  ellipse(ctx, px, pt - 0.4, 0.6, 0.6, '#e2b443');
  poly(ctx, [px + 0.3, pt + 0.6, px + 4, pt + 1, px + 4, pt + 4.4, px + 0.3, pt + 4.8], GREEN);
  poly(ctx, [px + 4, pt + 1, px + 9.6, pt + 2.2, px + 7.6, pt + 3.3, px + 9.4, pt + 4.4, px + 4, pt + 4.4], RED);
  poly(ctx, [px + 0.3, pt + 0.6, px + 9.6, pt + 2.2, px + 9.3, pt + 2.6, px + 0.3, pt + 1.6], 'rgba(255,255,255,0.25)');
  ellipse(ctx, px + 4, pt + 2.7, 1.1, 1.1, '#f0c43a'); // a gold armillary sphere at the seam
  ellipse(ctx, px + 4, pt + 2.7, 0.6, 0.6, RED);
}

export const render: MechRender = {
  tile(ctx, _s, t, cx, cy) {
    if (t.improvement !== 'padrao') return;
    padrao(ctx, cx, cy + 1);
  },
};

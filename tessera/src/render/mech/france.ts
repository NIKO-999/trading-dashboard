// France: a gilded Salon cartouche over every city that holds a Salon. An oval medallion in a carved gold frame with
// scrolls at its sides, a royal-blue enamel ground and a white quill crossed over an open book, crowned by a tiny gold
// fleur-de-lis: the drawing room where philosophers, wits and patrons meet.
import { ellipse, line, poly } from '../prims';
import type { Ctx } from '../prims';
import type { MechRender } from './types';

const GOLD = '#e8c050';
const GOLD_D = '#a87a20';
const BLUE = '#2a46b8';

/** A tiny fleur-de-lis: three petals on a band. */
function fleur(ctx: Ctx, x: number, y: number, k: number, c: string) {
  poly(ctx, [x, y - 3.2 * k, x + 0.8 * k, y - 1.2 * k, x, y + 0.2 * k, x - 0.8 * k, y - 1.2 * k], c);
  poly(ctx, [x - 0.4 * k, y - 0.6 * k, x - 2.4 * k, y - 2 * k, x - 2.2 * k, y - 0.2 * k, x - 0.6 * k, y + 0.4 * k], c);
  poly(ctx, [x + 0.4 * k, y - 0.6 * k, x + 2.4 * k, y - 2 * k, x + 2.2 * k, y - 0.2 * k, x + 0.6 * k, y + 0.4 * k], c);
  ctx.fillStyle = c;
  ctx.fillRect(x - 1.4 * k, y + 0.3 * k, 2.8 * k, 0.7 * k);
  poly(ctx, [x - 0.5 * k, y + 1 * k, x + 0.5 * k, y + 1 * k, x, y + 2.2 * k], c);
}

/** The Salon cartouche, centred on (x, y). */
export function salonMark(ctx: Ctx, x: number, y: number) {
  ctx.save();
  line(ctx, x, y + 6, x, y + 12, GOLD_D, 1); // the little gilt stand
  ellipse(ctx, x, y + 12.2, 2.4, 0.9, GOLD_D);
  // scrolls at the sides
  for (const d of [-1, 1]) {
    ellipse(ctx, x + d * 6.6, y + 2.6, 1.6, 1.6, GOLD_D);
    ellipse(ctx, x + d * 6.4, y + 2.4, 1, 1, GOLD);
  }
  ellipse(ctx, x, y + 0.6, 6.6, 7.4, 'rgba(0,0,0,0.25)');
  ellipse(ctx, x, y, 6.4, 7.2, GOLD_D);
  ellipse(ctx, x - 0.2, y - 0.3, 5.8, 6.6, GOLD);
  ellipse(ctx, x, y, 4.4, 5.2, BLUE);
  ellipse(ctx, x - 1, y - 1.6, 2.2, 1.4, 'rgba(255,255,255,0.18)');
  // an open book and a white quill
  poly(ctx, [x - 3, y + 1.8, x, y + 2.6, x, y + 0.6, x - 3, y - 0.2], '#f4efe0');
  poly(ctx, [x + 3, y + 1.8, x, y + 2.6, x, y + 0.6, x + 3, y - 0.2], '#dcd4c0');
  line(ctx, x - 1.8, y + 1.4, x + 2.4, y - 3.6, '#ffffff', 0.8);
  poly(ctx, [x + 2.4, y - 3.6, x + 1.2, y - 1.6, x + 0.4, y - 2, x + 1.6, y - 3.8], '#ffffff');
  fleur(ctx, x, y - 8.2, 0.9, GOLD); // the crest
  ctx.restore();
}

export const render: MechRender = {
  tile(ctx, s, t, cx, cy) {
    if (t.cityId === null) return;
    const c = s.cities.find((k) => k.id === t.cityId);
    if (!c || c.x !== t.x || c.y !== t.y || !c.data?.salon || s.players[c.owner]?.tribe !== 'france') return;
    ctx.save();
    ctx.translate(cx - 21, cy - 20);
    ctx.scale(0.78, 0.78);
    salonMark(ctx, 0, 0);
    ctx.restore();
  },
};

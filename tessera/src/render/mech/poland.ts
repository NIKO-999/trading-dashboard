// Poland: the Royal Election. While a king reigns, a tall staff stands beside the capital flying the swallow-tailed
// banner of the Commonwealth, white over crimson, with a gold crown floating over it; the banner's emblem shows the
// platform (a sabre for the Hussar King, a coin for the Merchant King, a book for the Scholar King).
import { tileCenter } from '../camera';
import { isExplored } from '../../game/rules';
import { kingOf, sejmCity } from '../../game/mech/poland';
import { ellipse, line, poly } from '../prims';
import type { Ctx } from '../prims';
import type { MechRender } from './types';

const CRIMSON = '#c8203a', WHITE = '#f4f0e8', GOLD = '#e8c040', GOLD_D = '#a07818';

function crown(ctx: Ctx, x: number, y: number) {
  poly(ctx, [x - 4, y, x + 4, y, x + 4.6, y - 3.6, x + 2.2, y - 1.8, x, y - 4.6, x - 2.2, y - 1.8, x - 4.6, y - 3.6], GOLD);
  poly(ctx, [x - 4, y, x + 4, y, x + 4, y - 1.1, x - 4, y - 1.1], GOLD_D);
  for (const d of [-2.4, 0, 2.4]) ellipse(ctx, x + d, y - 0.55, 0.55, 0.45, d ? '#3070d0' : CRIMSON);
  for (const [dx, dy] of [[-4.6, -3.6], [0, -4.6], [4.6, -3.6]]) ellipse(ctx, x + dx, y + dy - 0.4, 0.6, 0.6, '#fff4c0');
}

function banner(ctx: Ctx, x: number, y: number, king: number, now: number) {
  line(ctx, x, y, x, y - 30, '#5a3a1e', 1);
  ellipse(ctx, x, y - 30.5, 0.9, 0.9, GOLD);
  const w = (k: number) => Math.sin(now / 420 + k * 2.2) * 1.4 * k; // the flutter, growing toward the fly
  const top = y - 28, mid = top + 4, bot = top + 8, L = 14;
  // white over crimson, swallow-tailed
  poly(ctx, [x, top, x + L * 0.5, top + w(0.5), x + L, top + w(1), x + L * 0.78, mid + w(0.8), x, mid], WHITE);
  poly(ctx, [x, mid, x + L * 0.78, mid + w(0.8), x + L, bot + w(1), x + L * 0.5, bot + w(0.5), x, bot], CRIMSON);
  const ex = x + 5, ey = mid + w(0.35);
  if (king === 0) line(ctx, ex - 2.4, ey + 2, ex + 2.4, ey - 2, GOLD, 0.8); // a karabela
  else if (king === 1) { ellipse(ctx, ex, ey, 1.6, 1.6, GOLD); ellipse(ctx, ex, ey, 0.7, 0.7, GOLD_D); } // a ducat
  else { poly(ctx, [ex - 2.2, ey - 1.4, ex, ey - 0.8, ex + 2.2, ey - 1.4, ex + 2.2, ey + 1.4, ex, ey + 2, ex - 2.2, ey + 1.4], GOLD); line(ctx, ex, ey - 0.8, ex, ey + 2, GOLD_D, 0.4); } // a book
  crown(ctx, x + 6, top - 4 + Math.sin(now / 600) * 0.8);
}

export const render: MechRender = {
  overlay(ctx, s, viewer, _cam, _ov, now) {
    for (const p of s.players) {
      if (p.tribe !== 'poland' || !p.alive) continue;
      const k = kingOf(s, p.id);
      const c = sejmCity(s, p.id);
      if (k === null || !c || (viewer >= 0 && !isExplored(s, viewer, c.x, c.y))) continue;
      const m = tileCenter(c.x, c.y);
      ctx.save();
      banner(ctx, m.x + 20, m.y + 4, k, now);
      ctx.restore();
    }
  },
};

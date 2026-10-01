// The Holy Roman Empire: the Imperial Diet. Over each Elector city (level 4+) a tall staff flies the Imperial banner, the
// black eagle on gold, fluttering; while a Landfrieden holds, a white pennant of the peace streams beneath it.
import { tileCenter } from '../camera';
import { isExplored } from '../../game/rules';
import { electors, landfriedenLeft } from '../../game/mech/germany';
import { eagle } from '../tribes/germany';
import { ellipse, line, poly } from '../prims';
import type { Ctx } from '../prims';
import type { MechRender } from './types';

const GOLD = '#e8b830', GOLD_D = '#9a7018';

function banner(ctx: Ctx, x: number, y: number, now: number, phase: number, peace: boolean) {
  line(ctx, x, y, x, y - 30, '#3a2418', 1);
  ellipse(ctx, x, y - 30.6, 1, 1, GOLD);
  const w = (k: number) => Math.sin(now / 420 + phase + k * 2.2) * 1.3 * k; // the flutter, growing toward the fly
  const top = y - 29, L = 12, H = 8;
  const pts = [x, top, x + L * 0.5, top + w(0.5), x + L, top + w(1), x + L, top + H + w(1), x + L * 0.5, top + H + w(0.5), x, top + H];
  poly(ctx, pts, GOLD);
  poly(ctx, [x + L * 0.5, top + w(0.5), x + L, top + w(1), x + L, top + H + w(1), x + L * 0.5, top + H + w(0.5)], 'rgba(0,0,0,0.1)');
  line(ctx, x, top + H, x + L, top + H + w(1), GOLD_D, 0.5);
  eagle(ctx, x + L * 0.5, top + H * 0.42 + w(0.5), 0.78);
  if (peace) poly(ctx, [x, top + H + 1.4, x + 9, top + H + 2.6 + w(0.8), x, top + H + 3.8], '#f4f1e8'); // the Landfrieden
}

export const render: MechRender = {
  overlay(ctx, s, viewer, _cam, _ov, now) {
    for (const p of s.players) {
      if (p.tribe !== 'germany' || !p.alive) continue;
      const peace = landfriedenLeft(s, p.id) > 0;
      for (const c of electors(s, p.id)) {
        if (viewer >= 0 && !isExplored(s, viewer, c.x, c.y)) continue;
        const m = tileCenter(c.x, c.y);
        ctx.save();
        banner(ctx, m.x - 22, m.y + 6, now, c.id, peace);
        ctx.restore();
      }
    }
  },
};

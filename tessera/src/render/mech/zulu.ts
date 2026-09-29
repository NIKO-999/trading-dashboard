// Chest & Horns: trapped enemies get a pulsing red ring and spear-lines from the Zulu units hemming them in.
import { tileCenter } from '../camera';
import { dist } from '../../game/grid';
import { hornsAround, trappedBy } from '../../game/mech/zulu';
import { isExplored } from '../../game/rules';
import { unitVisibleTo } from '../../game/mech';
import { line } from '../prims';
import type { MechRender } from './types';

export const render: MechRender = {
  overlay(ctx, s, viewer, _cam, _ov, now) {
    for (const u of s.units) {
      const by = trappedBy(s, u);
      if (by < 0) continue;
      if (viewer >= 0 && (!isExplored(s, viewer, u.x, u.y) || !unitVisibleTo(s, viewer, u))) continue;
      const c = tileCenter(u.x, u.y);
      for (const h of hornsAround(s, by, u.x, u.y)) {
        if (dist(h.x, h.y, u.x, u.y) !== 1) continue;
        const p = tileCenter(h.x, h.y);
        line(ctx, p.x, p.y - 6, c.x, c.y - 6, 'rgba(214,60,40,0.75)', 2);
      }
      const k = 1 + 0.08 * Math.sin(now / 200);
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(1, 0.5);
      ctx.beginPath();
      ctx.arc(0, 0, 24 * k, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(214,60,40,0.9)';
      ctx.stroke();
      ctx.restore();
    }
  },
};

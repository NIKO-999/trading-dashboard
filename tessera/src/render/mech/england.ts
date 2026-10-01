// England: while the Letters of Marque run, every English fighting vessel trails a privateer's pennant (the St George
// cross at the hoist, a red swallow-tailed fly) on a marker staff off its stern, so the privateers are known at a glance.
import { tileCenter, WATER_DROP } from '../camera';
import { UNITS } from '../../data/units';
import { marqueActive } from '../../game/mech/england';
import { unitVisibleTo } from '../../game/mech';
import { isExplored } from '../../game/rules';
import { ellipse, line, poly } from '../prims';
import type { MechRender } from './types';

const RED = '#c4242c';
const WHITE = '#f4f2ec';

export const render: MechRender = {
  overlay(ctx, s, viewer, _cam, ov, now) {
    for (const u of s.units) {
      if (!UNITS[u.kind]?.naval || UNITS[u.kind].atk <= 0 || s.players[u.owner]?.tribe !== 'england' || !marqueActive(s, u.owner)) continue;
      if (viewer >= 0 && (!isExplored(s, viewer, u.x, u.y) || !unitVisibleTo(s, viewer, u))) continue;
      if (ov.fx.moves.get(u.id)) continue; // not while sailing
      const c = tileCenter(u.x, u.y);
      // beside the stern, clear of the hull and sails (the ship itself is drawn above the overlay in the still picture)
      const bx = c.x - 31, by = c.y + WATER_DROP + 2;
      const wave = ov.still ? 0.6 : Math.sin(now / 240 + u.id) * 1.1;
      ctx.save();
      ellipse(ctx, bx, by, 2.4, 1, 'rgba(255,255,255,0.5)'); // the buoy's ripple
      ellipse(ctx, bx, by - 0.6, 1.6, 1.1, '#7a4a26'); // a little marker buoy
      line(ctx, bx, by - 1, bx, by - 20, '#3a2614', 1.2);
      ellipse(ctx, bx, by - 20.5, 1.2, 1.2, '#d8b04a');
      // a long swallow-tailed pennant streaming astern: the St George cross at the hoist, red fly
      const pts = [bx - 0.5, by - 19.5, bx - 15, by - 17.6 + wave, bx - 11.6, by - 16 + wave * 0.6, bx - 15, by - 14.2 + wave, bx - 0.5, by - 12.6];
      poly(ctx, pts, RED);
      poly(ctx, [bx - 0.5, by - 19.5, bx - 6, by - 18.8 + wave * 0.4, bx - 6, by - 13.3 + wave * 0.4, bx - 0.5, by - 12.6], WHITE);
      line(ctx, bx - 3.2, by - 19 + wave * 0.2, bx - 3.2, by - 13 + wave * 0.2, RED, 1.3);
      line(ctx, bx - 0.6, by - 16.1, bx - 6, by - 16.1 + wave * 0.4, RED, 1.3);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
      ctx.stroke();
      ctx.restore();
    }
  },
};

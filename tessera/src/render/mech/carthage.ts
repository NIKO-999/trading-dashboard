// Carthage: a round cothon basin with its island tower beside each Carthaginian port, and a small Tyrian-purple pennant
// over every hired mercenary, so contracts are told apart from the city-raised army at a glance.
import { tileCenter, WATER_DROP } from '../camera';
import { isWater, tileAt } from '../../game/grid';
import { isMerc } from '../../game/mech/carthage';
import { unitVisibleTo } from '../../game/mech';
import { isExplored, tileOwnerPlayer } from '../../game/rules';
import { box, ellipse, line, poly, roof } from '../prims';
import type { MechRender } from './types';

const PURPLE = '#6a2484';
const PURPLE_HI = '#9a4ab8';
const LINEN = '#efe4c8';

export const render: MechRender = {
  tile(ctx, s, t, cx, cy) {
    if (t.improvement !== 'port') return;
    const o = tileOwnerPlayer(s, t);
    if (o === null || s.players[o]?.tribe !== 'carthage') return;
    // the round war-harbour: a stone ring of quays around a basin, the admiral's tower on its island
    const x = cx + 9, y = cy + WATER_DROP / 1.25 - 3;
    ctx.save();
    ellipse(ctx, x, y + 1, 10, 5, 'rgba(0,0,0,0.18)');
    ellipse(ctx, x, y, 10, 5, '#d9ccb0');
    ellipse(ctx, x, y - 0.6, 9.2, 4.5, '#efe5cc');
    ellipse(ctx, x, y + 0.2, 7, 3.4, '#2a7aa8');
    ellipse(ctx, x, y - 0.3, 6.2, 2.9, '#3a92bc');
    // the channel opening to the sea at the front
    poly(ctx, [x - 1.6, y + 3.4, x + 1.6, y + 3.4, x + 1.8, y + 5.2, x - 1.8, y + 5.2], '#3a92bc');
    // ship-sheds round the rim
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (1.08 + i * 0.105);
      line(ctx, x + Math.cos(a) * 6.6, y + Math.sin(a) * 3.2, x + Math.cos(a) * 9, y + Math.sin(a) * 4.4, '#b8a888', 0.7);
    }
    // the island and its round tower
    ellipse(ctx, x, y, 2.8, 1.4, '#e8dcc0');
    box(ctx, x, y + 0.6, 3.4, 6, '#f2ead6');
    roof(ctx, x, y - 5.4, 4, 2.6, PURPLE);
    line(ctx, x, y - 8, x, y - 11, '#4a3420', 0.6);
    poly(ctx, [x, y - 11, x + 3, y - 10.2, x, y - 9.4], PURPLE_HI);
    ctx.restore();
  },

  // A purple pennant on a short staff above each mercenary's shoulder.
  overlay(ctx, s, viewer, _cam, ov, now) {
    for (const u of s.units) {
      if (!isMerc(u) || s.players[u.owner]?.tribe !== 'carthage') continue;
      if (viewer >= 0 && (!isExplored(s, viewer, u.x, u.y) || !unitVisibleTo(s, viewer, u))) continue;
      if (ov.fx.moves.get(u.id)) continue; // not while marching
      const c = tileCenter(u.x, u.y);
      const t = tileAt(s, u.x, u.y);
      const bx = c.x + 13, by = c.y + (t && isWater(t) ? WATER_DROP : 0) - 4;
      const wave = ov.still ? 0.6 : Math.sin(now / 260 + u.id) * 1.2; // the still picture holds the cloth mid-flutter
      ctx.save();
      line(ctx, bx, by, bx, by - 24, '#3a2614', 1.3);
      ellipse(ctx, bx, by - 24.5, 1.3, 1.3, '#d8b04a');
      // a swallow-tailed pennant, purple with a linen crescent-disc
      poly(ctx, [bx + 0.5, by - 23, bx + 11, by - 21.5 + wave, bx + 7.5, by - 19 + wave * 0.6, bx + 11, by - 16.5 + wave, bx + 0.5, by - 15], PURPLE);
      poly(ctx, [bx + 0.5, by - 23, bx + 11, by - 21.5 + wave, bx + 9, by - 20.6 + wave * 0.8, bx + 0.5, by - 21.6], PURPLE_HI);
      ellipse(ctx, bx + 4.2, by - 19.2 + wave * 0.4, 1.4, 1.4, LINEN);
      ctx.beginPath();
      ctx.arc(bx + 4.2, by - 21.4 + wave * 0.4, 1.6, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.strokeStyle = LINEN;
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();
    }
  },
};

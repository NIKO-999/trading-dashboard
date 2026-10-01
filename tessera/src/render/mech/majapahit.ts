// Majapahit: the Spice Trade. Over every jong lying beside a foreign port right now floats a little cargo: a roped
// bale of cloves and nutmeg with a gold coin bobbing above it (a red-rimmed coin and a torn bale when the visit is a raid),
// so the player can see which ships will pay at the start of the next turn.
import { WATER_DROP, tileCenter } from '../camera';
import { unitVisibleTo } from '../../game/mech';
import { portVisits } from '../../game/mech/majapahit';
import { isExplored } from '../../game/rules';
import { drawStar, ellipse, line, poly, shade } from '../prims';
import type { Ctx } from '../prims';
import type { MechRender } from './types';

const BURLAP = '#c9a46a', ROPE = '#6a4a26', GOLD = '#f2c23a', GOLD_D = '#b0821a', CLOVE = '#7a3a1e', NUTMEG = '#b05a24';

/** A roped spice bale on (x, y), its mouth open with cloves and nutmeg heaped in it. */
function bale(ctx: Ctx, x: number, y: number, raid: boolean) {
  ellipse(ctx, x, y + 0.6, 4.6, 1.6, 'rgba(0,0,0,0.25)');
  poly(ctx, [x - 4, y, x - 4.4, y - 5, x - 2.6, y - 7, x + 2.6, y - 7, x + 4.4, y - 5, x + 4, y], BURLAP);
  poly(ctx, [x + 0.6, y, x + 1, y - 7, x + 2.6, y - 7, x + 4.4, y - 5, x + 4, y], shade(BURLAP, -0.18));
  line(ctx, x - 4.2, y - 3.4, x + 4.2, y - 3.4, ROPE, 0.8); // the rope round its belly
  line(ctx, x - 0.4, y, x - 0.6, y - 7, ROPE, 0.6);
  ellipse(ctx, x, y - 7, 2.8, 1, shade(BURLAP, -0.3)); // the open mouth
  ellipse(ctx, x - 1, y - 7.5, 1, 0.8, CLOVE); // spices heaped in it
  ellipse(ctx, x + 0.9, y - 7.6, 1, 0.8, NUTMEG);
  ellipse(ctx, x, y - 8.2, 0.8, 0.7, shade(CLOVE, 0.15));
  if (raid) { // a slash in the sacking where the raiders cut it open
    line(ctx, x - 2.4, y - 1.4, x + 1.6, y - 5.2, '#3a2010', 0.9);
    ellipse(ctx, x - 1.8, y + 0.4, 0.8, 0.5, CLOVE);
    ellipse(ctx, x - 0.4, y + 0.9, 0.7, 0.45, NUTMEG);
  }
}

/** A gold coin with a star, seen turning a little (w in 0..1 is its width). */
function coin(ctx: Ctx, x: number, y: number, w: number, raid: boolean) {
  const rx = 3.6 * Math.max(0.25, w);
  ellipse(ctx, x + 0.5, y + 0.4, rx, 3.6, GOLD_D);
  ellipse(ctx, x, y, rx, 3.6, raid ? '#c83a1a' : GOLD_D);
  ellipse(ctx, x, y, rx * 0.82, 3, GOLD);
  if (w > 0.55) drawStar(ctx, x, y, 1.9 * w, '#fff2b0');
}

export const render: MechRender = {
  overlay(ctx, s, viewer, _cam, ov, now) {
    const t0 = ov.still ? 0 : now;
    for (const p of s.players) {
      if (p.tribe !== 'majapahit' || !p.alive) continue;
      const visits = portVisits(s, p.id);
      if (!visits.length) continue;
      for (const v of visits) {
        const u = s.units.find((e) => e.id === v.unit);
        if (!u || ov.fx.moves.get(u.id)) continue;
        if (viewer >= 0 && (!isExplored(s, viewer, u.x, u.y) || !unitVisibleTo(s, viewer, u))) continue;
        const c = tileCenter(u.x, u.y);
        // float the cargo over the masthead, leaning toward the port (the jong's sails would hide it lower down)
        const side = v.cx - v.cy > u.x - u.y ? 1 : v.cx - v.cy < u.x - u.y ? -1 : 1;
        const bx = c.x + side * 8, by = c.y + WATER_DROP - 64;
        const bob = Math.sin(t0 / 420 + u.id) * 1.4;
        ctx.save();
        ctx.translate(bx, by);
        ctx.scale(1.35, 1.35); // big enough to read at a glance over the sails
        ctx.translate(-bx, -by);
        bale(ctx, bx, by, v.raid);
        coin(ctx, bx, by - 13 + bob, Math.abs(Math.cos(t0 / 650 + u.id * 0.7)), v.raid);
        ctx.restore();
      }
    }
  },
};

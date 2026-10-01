// Sweden: Winter March and Falun Copper. Under every Swedish land unit standing on tundra or ice (ready to march +1)
// frost glitters: a pale rime ring on the ground and small four-pointed sparkles that wink in and out around its feet.
// Over a city that sold Falun copper this turn, a few copper-red and verdigris flakes drift up like sparks from a smelter.
import { tileCenter } from '../camera';
import { copperNow, onWinter } from '../../game/mech/sweden';
import { unitVisibleTo } from '../../game/mech';
import { isExplored } from '../../game/rules';
import { ellipse, line } from '../prims';
import type { Ctx } from '../prims';
import type { MechRender } from './types';

/** A small four-pointed glint at (x, y), `r` long, of alpha `a`. */
function glint(ctx: Ctx, x: number, y: number, r: number, a: number) {
  if (a <= 0.02) return;
  ctx.globalAlpha = a;
  line(ctx, x - r, y, x + r, y, '#ffffff', 0.7);
  line(ctx, x, y - r, x, y + r, '#ffffff', 0.7);
  line(ctx, x - r * 0.4, y - r * 0.4, x + r * 0.4, y + r * 0.4, '#cfe8ff', 0.5);
  line(ctx, x - r * 0.4, y + r * 0.4, x + r * 0.4, y - r * 0.4, '#cfe8ff', 0.5);
  ctx.globalAlpha = 1;
}

export const render: MechRender = {
  overlay(ctx, s, viewer, cam, ov, now) {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1600, vh = typeof window !== 'undefined' ? window.innerHeight : 1000;
    ctx.save();
    ctx.lineCap = 'round';
    for (const u of s.units) {
      if (s.players[u.owner]?.tribe !== 'sweden' || !onWinter(s, u)) continue;
      if (viewer >= 0 && (!isExplored(s, viewer, u.x, u.y) || !unitVisibleTo(s, viewer, u))) continue;
      if (ov.fx.moves.get(u.id)) continue; // not while marching
      const c = tileCenter(u.x, u.y);
      const sc = cam.toScreen(c.x, c.y);
      if (sc.x < -60 || sc.y < -60 || sc.x > vw + 60 || sc.y > vh + 60) continue;
      const fx = c.x, fy = c.y + 9;
      ctx.globalAlpha = 0.4; // a thin ring of rime round its feet (the overlay lies over the figures, so no solid fill)
      ctx.strokeStyle = '#eaf6ff';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(fx, fy, 12, 4, 0, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
      ctx.globalAlpha = 1;
      for (let k = 0; k < 5; k++) {
        const ph = ov.still ? 0.5 + k * 0.1 : (now / 1400 + k * 0.23 + u.id * 0.37) % 1;
        const ang = k * 1.31 + u.id;
        const x = fx + Math.cos(ang) * (8 + (k % 2) * 4), y = fy + Math.sin(ang) * 3 - ph * 3;
        glint(ctx, x, y, 1.4 + (k % 3) * 0.5, Math.sin(ph * Math.PI) * 0.95);
      }
    }
    for (const c of s.cities) {
      if (s.players[c.owner]?.tribe !== 'sweden' || !copperNow(s, c)) continue;
      if (viewer >= 0 && !isExplored(s, viewer, c.x, c.y)) continue;
      const p = tileCenter(c.x, c.y);
      for (let k = 0; k < 10; k++) {
        const ph = ov.still ? (k / 10) : (now / 2600 + k / 10) % 1;
        const x = p.x - 18 + ((k * 37) % 36) + Math.sin(ph * 6 + k) * 2.4, y = p.y - 14 - ph * 34;
        ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.95;
        ellipse(ctx, x, y, 1.9, 1.2, k % 3 === 0 ? '#5fb59a' : '#d0682e');
        ellipse(ctx, x - 0.5, y - 0.4, 0.7, 0.45, k % 3 === 0 ? '#a8e8cc' : '#ffb070');
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  },
};

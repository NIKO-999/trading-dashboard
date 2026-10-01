// Rus: while General Winter holds, a frosty sheen lies over the land of Rus and snow drifts gently down on it.
import { tileCenter, tileTop, TH } from '../camera';
import { HH, HW } from '../common';
import { poly, rand } from '../prims';
import { isWinter } from '../../game/mech/rus';
import { tileOwnerPlayer } from '../../game/rules';
import type { MechRender } from './types';

const FLAKES = 6; // per tile: enough to read as snowfall, cheap to draw

export const render: MechRender = {
  overlay(ctx, s, viewer, _cam, ov, now) {
    const rus = s.players.filter((p) => p.alive && p.tribe === 'rus' && isWinter(s, p.id)).map((p) => p.id);
    if (!rus.length) return;
    const t0 = ov.still ? 0 : now;
    ctx.save();
    for (const t of s.tiles) {
      if (t.owner === null || (viewer >= 0 && !s.players[viewer].explored[t.y * s.size + t.x])) continue;
      const o = tileOwnerPlayer(s, t);
      if (o === null || !rus.includes(o)) continue;
      const top = tileTop(t.x, t.y);
      poly(ctx, [top.x, top.y, top.x + HW, top.y + HH, top.x, top.y + TH, top.x - HW, top.y + HH], 'rgba(226,238,252,0.24)'); // frost
      const c = tileCenter(t.x, t.y);
      for (let i = 0; i < 3; i++) { // drifts of snow lying on the ground
        ctx.fillStyle = 'rgba(250,252,255,0.55)';
        ctx.beginPath();
        ctx.ellipse(c.x + (rand(t.seed, 740 + i) - 0.5) * 34, c.y + (rand(t.seed, 750 + i) - 0.5) * 14, 4 + rand(t.seed, 760 + i) * 4, 1.6 + rand(t.seed, 770 + i) * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < FLAKES; i++) {
        const fall = 56; // the height a flake drifts through over one tile
        const sp = 0.012 + rand(t.seed, 700 + i) * 0.01;
        const k = ((t0 * sp) / 16 + rand(t.seed, 710 + i) * fall) % fall;
        const x = c.x + (rand(t.seed, 720 + i) - 0.5) * 44 + Math.sin(t0 / 700 + i * 2 + t.seed) * 3;
        const y = c.y - 46 + k;
        const a = k < 8 ? k / 8 : k > fall - 8 ? (fall - k) / 8 : 1; // fade in at the top, out on the ground
        ctx.fillStyle = `rgba(255,255,255,${0.92 * a})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.1 + rand(t.seed, 730 + i) * 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  },
};

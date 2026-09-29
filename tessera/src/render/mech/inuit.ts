// Inuit: `ground` draws frozen water as pale, cracked ice (raised like land); `tile` marks thawed fish/whale nodes with a
// dark open hole and ready ones with a frost rim; `overlay` glints on the ice.
import { tileCenter, LAND_DEPTH, TH } from '../camera';
import { HH, HW } from '../common';
import { line, poly, polyGrad, rand, shade } from '../prims';
import { restLeft } from '../../game/mech/inuit';
import type { MechRender } from './types';

export const render: MechRender = {
  ground(ctx, _s, t, x, y) {
    if (t.terrain !== 'ice') return false;
    const side = '#9cc3dc';
    polyGrad(ctx, [x - HW, y + HH, x, y + TH, x, y + TH + LAND_DEPTH, x - HW, y + HH + LAND_DEPTH], shade(side, 0.1), shade(side, -0.25), y + HH, y + TH + LAND_DEPTH);
    polyGrad(ctx, [x + HW, y + HH, x, y + TH, x, y + TH + LAND_DEPTH, x + HW, y + HH + LAND_DEPTH], shade(side, 0.02), shade(side, -0.3), y + HH, y + TH + LAND_DEPTH);
    poly(ctx, [x, y, x + HW, y + HH, x, y + TH, x - HW, y + HH], '#dff1fb');
    poly(ctx, [x, y, x + HW, y + HH, x, y + TH], 'rgba(255,255,255,0.35)');
    const cx = x, cy = y + HH;
    for (let i = 0; i < 3; i++) { // cracks
      const a = rand(t.seed, 300 + i) * 6.28, r = 6 + rand(t.seed, 310 + i) * 10;
      line(ctx, cx, cy, cx + Math.cos(a) * r * 1.5, cy + Math.sin(a) * r * 0.75, 'rgba(90,140,180,0.55)', 1);
    }
    return true;
  },

  tile(ctx, _s, t, cx, cy) {
    if (t.resource !== 'whale' && t.resource !== 'fish') return;
    const y = cy + 7;
    ctx.save();
    if (restLeft(t) > 0) { // thawed: an open dark hole ringed with broken ice
      ctx.fillStyle = '#e8f6ff';
      ctx.beginPath(); ctx.ellipse(cx, y, 15, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#123a58';
      ctx.beginPath(); ctx.ellipse(cx, y, 11, 5, 0, 0, Math.PI * 2); ctx.fill();
    } else { // ready: a thin frost rim
      ctx.strokeStyle = 'rgba(235,248,255,0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(cx, y, 17, 8, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  },

  overlay(ctx, s, viewer, _cam, _ov, now) {
    for (const t of s.tiles) {
      if (t.terrain !== 'ice' || (viewer >= 0 && !s.players[viewer].explored[t.y * s.size + t.x])) continue;
      const c = tileCenter(t.x, t.y);
      const k = (Math.sin(now / 500 + t.seed) + 1) / 2;
      ctx.fillStyle = `rgba(255,255,255,${0.15 + k * 0.5})`;
      ctx.fillRect(c.x + (rand(t.seed, 5) - 0.5) * 24, c.y + (rand(t.seed, 6) - 0.5) * 10, 2, 2);
    }
  },
};

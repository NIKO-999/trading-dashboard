import { tileCenter } from '../camera';
import { inflationOf, isExplored } from '../../game/rules';
import { isCaravan, payout } from '../../game/mech/mali';
import type { MechRender } from './types';

export const render: MechRender = {
  overlay(ctx, s, viewer, _cam, _ov, now) {
    // gold coins swirling over flooded cities
    for (const c of s.cities) {
      if (!inflationOf(s, c.owner) || (viewer >= 0 && !isExplored(s, viewer, c.x, c.y))) continue;
      const p = tileCenter(c.x, c.y);
      ctx.save();
      for (let i = 0; i < 5; i++) {
        const a = now / 600 + (i * Math.PI * 2) / 5;
        ctx.fillStyle = '#f2c230'; ctx.strokeStyle = '#8a6a10'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(p.x + Math.cos(a) * 20, p.y - 12 + Math.sin(a) * 8, 5, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    }
    // pending toll over each of the viewer's caravans
    for (const u of s.units) {
      if (!isCaravan(u) || (viewer >= 0 && u.owner !== viewer)) continue;
      const n = payout(u);
      if (!n) continue;
      const p = tileCenter(u.x, u.y);
      ctx.save();
      ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#f2c230'; ctx.strokeStyle = '#3a2a00'; ctx.lineWidth = 3;
      ctx.strokeText(`+${n}★`, p.x, p.y - 30); ctx.fillText(`+${n}★`, p.x, p.y - 30);
      ctx.restore();
    }
  },
};

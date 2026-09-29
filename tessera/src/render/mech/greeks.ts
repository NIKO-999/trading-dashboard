// Greeks: a gold ring on the seat of the polis (the moving capital) and a blue ring on cities in the Amphictyony.
import { TH, TW, tileTop } from '../camera';
import { alignedCities, seatOf } from '../../game/mech/greeks';
import type { MechRender } from './types';

export const render: MechRender = {
  overlay(ctx, s, viewer, _cam, _ov, now) {
    for (const p of s.players) {
      if (p.tribe !== 'greeks' || !p.alive) continue;
      const seat = seatOf(s, p.id);
      const aligned = alignedCities(s, p.id);
      for (const c of aligned.concat(seat && !aligned.includes(seat) ? [seat] : [])) {
        if (viewer >= 0 && c.owner !== viewer && !s.players[viewer]?.explored[c.y * s.size + c.x]) continue;
        const t = tileTop(c.x, c.y);
        const isSeat = c === seat;
        const pulse = 0.65 + Math.sin(now / 450) * 0.2;
        const inset = isSeat ? 2 : 5;
        ctx.beginPath();
        ctx.moveTo(t.x, t.y + inset);
        ctx.lineTo(t.x + TW / 2 - inset - 1, t.y + TH / 2);
        ctx.lineTo(t.x, t.y + TH - inset);
        ctx.lineTo(t.x - TW / 2 + inset + 1, t.y + TH / 2);
        ctx.closePath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = isSeat ? `rgba(232,193,74,${pulse})` : `rgba(90,170,230,${pulse})`;
        ctx.stroke();
        if (isSeat && aligned.includes(c)) { ctx.lineWidth = 1; ctx.strokeStyle = `rgba(90,170,230,${pulse})`; ctx.stroke(); }
      }
    }
  },
};

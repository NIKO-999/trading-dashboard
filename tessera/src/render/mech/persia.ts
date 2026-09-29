// Persia: a gold ring on satrapies (turns red while ungarrisoned and bleeding population).
import { TH, TW, tileTop } from '../camera';
import { garrisoned, isSatrapy } from '../../game/mech/persia';
import type { MechRender } from './types';

export const render: MechRender = {
  overlay(ctx, s, viewer, _cam, _ov, now) {
    for (const c of s.cities) {
      if (!isSatrapy(c) || s.players[c.owner].tribe !== 'persia') continue;
      if (viewer >= 0 && c.owner !== viewer && !s.players[viewer]?.explored[c.y * s.size + c.x]) continue;
      const t = tileTop(c.x, c.y);
      const bare = !garrisoned(s, c);
      const pulse = 0.6 + Math.sin(now / 400) * 0.2;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y + 2);
      ctx.lineTo(t.x + TW / 2 - 3, t.y + TH / 2);
      ctx.lineTo(t.x, t.y + TH - 2);
      ctx.lineTo(t.x - TW / 2 + 3, t.y + TH / 2);
      ctx.closePath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = bare ? `rgba(200,60,50,${pulse})` : 'rgba(232,193,74,0.85)';
      ctx.stroke();
    }
  },
};

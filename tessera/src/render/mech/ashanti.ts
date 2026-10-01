// Asante: gold dust glitters over every Asante mine, a few bright motes rising and twinkling out above the workings.
import { tileCenter } from '../camera';
import { isExplored, tileOwnerPlayer } from '../../game/rules';
import type { MechRender } from './types';

export const render: MechRender = {
  overlay(ctx, s, viewer, _cam, _ov, now) {
    if (!s.players.some((p) => p.tribe === 'ashanti')) return;
    for (const t of s.tiles) {
      if (t.improvement !== 'mine') continue;
      const o = tileOwnerPlayer(s, t);
      if (o === null || s.players[o]?.tribe !== 'ashanti' || (viewer >= 0 && !isExplored(s, viewer, t.x, t.y))) continue;
      const p = tileCenter(t.x, t.y);
      ctx.save();
      for (let i = 0; i < 6; i++) {
        const seed = t.x * 13 + t.y * 7 + i * 31;
        const ph = ((now / 1700 + (seed % 97) / 97) % 1); // 0..1: a mote rises and fades
        const x = p.x - 14 + ((seed * 37) % 28) + Math.sin(now / 400 + i) * 1.5, y = p.y - 4 - ph * 22;
        const a = Math.sin(ph * Math.PI), r = 0.8 + a * 1.4;
        ctx.globalAlpha = a * 0.95;
        ctx.fillStyle = '#ffe27a';
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        if (i % 2 === 0) { // a four-pointed glint
          ctx.strokeStyle = '#fff6c8'; ctx.lineWidth = 0.7;
          ctx.beginPath(); ctx.moveTo(x - r * 2.4, y); ctx.lineTo(x + r * 2.4, y); ctx.moveTo(x, y - r * 2.4); ctx.lineTo(x, y + r * 2.4); ctx.stroke();
        }
      }
      ctx.restore();
    }
  },
};

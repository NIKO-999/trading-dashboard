import { TH, TW, tileTop } from '../camera';
import { ERAS, activeEra, tempOrig } from '../../game/mech/maya';
import type { MechRender } from './types';

// While an Era is in force the whole explored map takes its tint (a faint diamond over every tile), and the seabed the
// Great Ebb has laid bare shows ripple marks.
export const render: MechRender = {
  overlay(ctx, s, viewer, _cam, _ov, now) {
    const id = activeEra(s);
    if (!id) return;
    const color = ERAS.find((e) => e.id === id)!.color;
    const ex = viewer >= 0 ? s.players[viewer].explored : null;
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.07 + 0.03 * Math.sin(now / 700);
    for (const t of s.tiles) {
      if (ex && !ex[t.y * s.size + t.x]) continue;
      const p = tileTop(t.x, t.y);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + TW / 2, p.y + TH / 2);
      ctx.lineTo(p.x, p.y + TH);
      ctx.lineTo(p.x - TW / 2, p.y + TH / 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#7a5b25';
    ctx.lineWidth = 1;
    for (const t of s.tiles) {
      if (!tempOrig(t) || (ex && !ex[t.y * s.size + t.x])) continue;
      const p = tileTop(t.x, t.y);
      ctx.beginPath();
      ctx.moveTo(p.x - 10, p.y + TH / 2);
      ctx.quadraticCurveTo(p.x - 5, p.y + TH / 2 - 3, p.x, p.y + TH / 2);
      ctx.quadraticCurveTo(p.x + 5, p.y + TH / 2 + 3, p.x + 10, p.y + TH / 2);
      ctx.stroke();
    }
    ctx.restore();
  },
};

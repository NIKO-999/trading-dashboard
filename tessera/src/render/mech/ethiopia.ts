// Aksum: carved granite stelae and the laser grid that links them.
import { tileCenter } from '../camera';
import { ellipse, line, poly, softShadow } from '../prims';
import { gridLinks, isStele } from '../../game/mech/ethiopia';
import { isExplored } from '../../game/rules';
import type { MechRender } from './types';

export const render: MechRender = {
  tile(ctx, _s, t, cx, cy) {
    if (!isStele(t)) return;
    softShadow(ctx, cx, cy + 8, 10, 5, 0.3);
    poly(ctx, [cx - 5, cy + 8, cx - 3.5, cy - 22, cx, cy - 24, cx, cy + 9], '#bfb6a2');
    poly(ctx, [cx + 5, cy + 8, cx + 3.5, cy - 22, cx, cy - 24, cx, cy + 9], '#8f8776');
    ellipse(ctx, cx, cy - 24, 3.6, 2, '#a89f8a');
    for (let i = 0; i < 4; i++) line(ctx, cx - 3, cy + 3 - i * 6, cx + 3, cy + 4.5 - i * 6, '#6a6252', 0.7);
    ellipse(ctx, cx, cy - 27, 2.2, 2.2, '#ffe9a0'); // the sun-disc crystal
  },

  overlay(ctx, s, viewer, _cam, _ov, now) {
    const seen = (t: { x: number; y: number }) => viewer < 0 || isExplored(s, viewer, t.x, t.y);
    for (const p of s.players) {
      if (p.tribe !== 'ethiopia' || !p.alive) continue;
      const pulse = 0.55 + 0.35 * Math.sin(now / 260);
      ctx.save();
      ctx.lineCap = 'round';
      for (const l of gridLinks(s, p.id)) {
        if (!seen(l.a) || !seen(l.b)) continue;
        const a = tileCenter(l.a.x, l.a.y), b = tileCenter(l.b.x, l.b.y);
        ctx.strokeStyle = `rgba(255,214,90,${0.25 * pulse})`;
        ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(a.x, a.y - 27); ctx.lineTo(b.x, b.y - 27); ctx.stroke();
        ctx.strokeStyle = `rgba(255,244,190,${0.85 * pulse})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(a.x, a.y - 27); ctx.lineTo(b.x, b.y - 27); ctx.stroke();
      }
      ctx.restore();
    }
  },
};

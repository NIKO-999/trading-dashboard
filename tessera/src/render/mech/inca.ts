import { tileCenter } from '../camera';
import { outpostsOf } from '../../game/mech/inca';
import type { MechRender } from './types';

// Chaski outposts: a stone relay hut with a rope post; terrace farms: stepped green stone walls. Rope lines swing
// between the viewer's own outposts.
export const render: MechRender = {
  tile(ctx, _s, t, cx, cy) {
    if (t.improvement === 'chaski') {
      ctx.save();
      ctx.translate(cx, cy + 4);
      ctx.fillStyle = '#8a7a62';
      ctx.fillRect(-8, -2, 16, 8); // stone hut
      ctx.fillStyle = '#c9a45a';
      ctx.beginPath(); // thatch
      ctx.moveTo(-10, -2); ctx.lineTo(0, -12); ctx.lineTo(10, -2); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#5a4030'; // rope post with a pennant
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(9, 6); ctx.lineTo(9, -16); ctx.stroke();
      ctx.fillStyle = '#7b2145';
      ctx.beginPath(); ctx.moveTo(9, -16); ctx.lineTo(16, -13); ctx.lineTo(9, -10); ctx.closePath(); ctx.fill();
      ctx.restore();
    } else if (t.data?.terrace === true) {
      ctx.save();
      ctx.translate(cx, cy + 4);
      for (let i = 0; i < 3; i++) {
        const w = 22 - i * 5;
        ctx.fillStyle = i % 2 ? '#7fb24a' : '#5f9a3c';
        ctx.fillRect(-w / 2, -i * 5, w, 4);
        ctx.fillStyle = '#9a8a70';
        ctx.fillRect(-w / 2, -i * 5 + 4, w, 1.5);
      }
      ctx.restore();
    }
  },

  overlay(ctx, s, viewer, _cam, _ov, now) {
    if (viewer < 0 || s.players[viewer]?.tribe !== 'inca') return;
    const posts = outpostsOf(s, viewer);
    ctx.save();
    ctx.strokeStyle = 'rgba(201,164,90,0.75)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.lineDashOffset = -now / 90;
    for (let i = 0; i < posts.length; i++) {
      for (let j = i + 1; j < posts.length; j++) {
        const a = tileCenter(posts[i].x, posts[i].y), b = tileCenter(posts[j].x, posts[j].y);
        const sag = Math.min(24, Math.hypot(a.x - b.x, a.y - b.y) / 6);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y - 8);
        ctx.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 - 8 + sag, b.x, b.y - 8);
        ctx.stroke();
      }
    }
    ctx.restore();
  },
};

// Mongols: marks the ambush zones of waiting archers (see game/mech/mongols).
import { TH, TW, tileCenter, tileTop } from '../camera';
import { ambushers, ambushRange } from '../../game/mech/mongols';
import { isWater, tileAt } from '../../game/grid';
import { isExplored } from '../../game/rules';
import type { MechRender } from './types';

const WATER_DROP = 5; // matches the camera's water drop

export const render: MechRender = {
  overlay(ctx, s, viewer, _cam, _ov, now) {
    for (const p of s.players) {
      if (!p.alive || p.tribe !== 'mongols') continue;
      const zone = new Map<number, boolean>(); // tile index -> some archer there still has its shot
      const posts: { x: number; y: number; ready: boolean }[] = [];
      for (const { u, ready } of ambushers(s, p.id)) {
        if (viewer >= 0 && u.owner !== viewer && !isExplored(s, viewer, u.x, u.y)) continue;
        posts.push({ x: u.x, y: u.y, ready });
        const r = ambushRange(u);
        for (let y = u.y - r; y <= u.y + r; y++) for (let x = u.x - r; x <= u.x + r; x++) {
          if (!tileAt(s, x, y) || (x === u.x && y === u.y)) continue;
          const i = y * s.size + x;
          zone.set(i, (zone.get(i) ?? false) || ready);
        }
      }
      const pulse = 0.55 + Math.sin(now / 420) * 0.15;
      for (const [i, ready] of zone) {
        const x = i % s.size, y = Math.floor(i / s.size);
        const drop = isWater(tileAt(s, x, y)!) ? WATER_DROP : 0;
        const t = tileTop(x, y);
        ctx.beginPath();
        ctx.moveTo(t.x, t.y + drop);
        ctx.lineTo(t.x + TW / 2, t.y + TH / 2 + drop);
        ctx.lineTo(t.x, t.y + TH + drop);
        ctx.lineTo(t.x - TW / 2, t.y + TH / 2 + drop);
        ctx.closePath();
        ctx.fillStyle = ready ? `rgba(214,72,40,${0.13 * pulse + 0.06})` : 'rgba(150,150,150,0.08)';
        ctx.fill();
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = ready ? 'rgba(232,96,56,0.7)' : 'rgba(170,170,170,0.35)';
        ctx.stroke();
        ctx.setLineDash([]);
      }
      for (const a of posts) { // a ring under each waiting archer
        const c = tileCenter(a.x, a.y);
        ctx.lineWidth = 2;
        ctx.strokeStyle = a.ready ? '#e86038' : '#aaaaaa';
        ctx.beginPath();
        ctx.ellipse(c.x, c.y + 5, 15, 7.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  },
};

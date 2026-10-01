// Scotland: the Highland Games. Over a city whose games ran this turn a pole flies the saltire, a white St Andrew's
// cross on blue, fluttering; beside it a caber (a long pine log) tumbles end over end through the air above the green.
import { tileCenter } from '../camera';
import { isExplored } from '../../game/rules';
import { gamesNow } from '../../game/mech/scotland';
import { line, poly } from '../prims';
import type { Ctx } from '../prims';
import type { MechRender } from './types';

const BLUE = '#1f5ab8', WHITE = '#f4f4f0', POLE = '#5a4030', LOG = '#9a6a3a', LOG_D = '#5a3a1c';

/** The saltire on a pole planted at (x, y), its fly waving with time. */
function saltire(ctx: Ctx, x: number, y: number, now: number) {
  line(ctx, x, y, x, y - 22, POLE, 1);
  const w = 11, h = 7, top = y - 22;
  const wav = (k: number) => Math.sin(now / 260 + k * 3) * 1.2 * k;
  const p = (u: number, v: number): [number, number] => [x + u * w, top + v * h + wav(u)];
  poly(ctx, [...p(0, 0), ...p(1, 0), ...p(1, 1), ...p(0, 1)], BLUE);
  ctx.save();
  ctx.lineCap = 'butt';
  for (const [a, b] of [[[0, 0], [1, 1]], [[0, 1], [1, 0]]] as const) {
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const t = i / 6, [px, py] = p(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t);
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = '#e8c060';
  ctx.beginPath();
  ctx.arc(x, top - 0.8, 0.9, 0, Math.PI * 2);
  ctx.fill();
}

/** A caber turning end over end in a slow arc over (x, y). */
function caber(ctx: Ctx, x: number, y: number, now: number) {
  const ph = (now / 2200) % 1;
  const cx = x - 4 + ph * 10, cy = y - 18 - Math.sin(ph * Math.PI) * 10;
  const a = -Math.PI / 2 + ph * Math.PI;
  const dx = Math.cos(a) * 8, dy = Math.sin(a) * 8;
  line(ctx, cx - dx, cy - dy, cx + dx, cy + dy, LOG_D, 2.6);
  line(ctx, cx - dx, cy - dy - 0.5, cx + dx, cy + dy - 0.5, LOG, 1.6);
  ctx.fillStyle = '#d8b07a';
  ctx.beginPath();
  ctx.arc(cx + dx, cy + dy, 1.1, 0, Math.PI * 2); // the cut end
  ctx.fill();
  // its shadow on the ground
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(cx, y + 1, 6 * Math.abs(Math.cos(a)) + 1.5, 1.2, 0, 0, Math.PI * 2);
  ctx.fill();
}

export const render: MechRender = {
  overlay(ctx, s, viewer, cam, _ov, now) {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1600, vh = typeof window !== 'undefined' ? window.innerHeight : 1000;
    for (const c of s.cities) {
      if (s.players[c.owner]?.tribe !== 'scotland' || !gamesNow(s, c)) continue;
      if (viewer >= 0 && !isExplored(s, viewer, c.x, c.y)) continue;
      const p = tileCenter(c.x, c.y);
      const sc = cam.toScreen(p.x, p.y);
      if (sc.x < -60 || sc.y < -80 || sc.x > vw + 60 || sc.y > vh + 60) continue;
      ctx.save();
      ctx.lineCap = 'round';
      saltire(ctx, p.x + 20, p.y + 4, now);
      caber(ctx, p.x - 16, p.y + 6, now);
      ctx.restore();
    }
  },
};

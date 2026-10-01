// Vietnam: the Stakes of Bạch Đằng. Iron-tipped wooden stakes poke out of the shallows in a staggered row, the water
// rippling round each one. They are drawn only for the empire that planted them: an enemy never sees the trap.
import { WATER_DROP, tileCenter } from '../camera';
import { line, poly, shade } from '../prims';
import type { Ctx } from '../prims';
import { stakesVisibleTo } from '../../game/mech/vietnam';
import type { MechRender } from './types';

const WOOD = '#7a5432', WOOD_D = '#4a3018', IRON = '#5a5e66', IRON_L = '#a8b0ba';

/** One sharpened stake leaning `lean` px, standing in the water at (x, y), `h` tall, its tip shod in iron. */
function stake(ctx: Ctx, x: number, y: number, h: number, lean: number, now: number, i: number) {
  const tx = x + lean, ty = y - h;
  // the ripple ring where it breaks the surface
  const ph = (now / 900 + i * 0.37) % 1;
  ctx.strokeStyle = `rgba(255,255,255,${0.55 * (1 - ph)})`;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(x, y + 0.4, 2 + ph * 3, 0.9 + ph * 1.3, 0, 0, Math.PI * 2);
  ctx.stroke();
  // a darker reflection under the surface
  line(ctx, x, y + 0.6, x - lean * 0.4, y + h * 0.35, 'rgba(30,40,40,0.35)', 1.8);
  // the shaft: a lit face and a shaded face
  poly(ctx, [x - 1.2, y, x + 1.2, y, tx + 0.7, ty + 3.2, tx - 0.7, ty + 3.2], WOOD);
  poly(ctx, [x + 0.1, y, x + 1.2, y, tx + 0.7, ty + 3.2, tx + 0.05, ty + 3.2], WOOD_D);
  line(ctx, x - 0.7, y - 0.4, tx - 0.4, ty + 3.4, shade(WOOD, 0.35), 0.4); // the grain catching the light
  // the iron tip
  poly(ctx, [tx - 0.8, ty + 3.4, tx + 0.8, ty + 3.4, tx, ty], IRON);
  poly(ctx, [tx - 0.8, ty + 3.4, tx - 0.1, ty + 3.4, tx, ty], IRON_L);
  line(ctx, tx - 0.85, ty + 3.4, tx + 0.85, ty + 3.4, '#2a2a2e', 0.5); // the binding
  // a wet band at the waterline
  line(ctx, x - 1.2, y - 0.3, x + 1.2, y - 0.3, 'rgba(20,30,30,0.5)', 0.7);
}

export const render: MechRender = {
  overlay(ctx, s, viewer, cam, _ov, now) {
    if (viewer < 0) return;
    const p = s.players[viewer];
    if (!p || p.tribe !== 'vietnam') return;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1600, vh = typeof window !== 'undefined' ? window.innerHeight : 1000;
    ctx.save();
    ctx.lineCap = 'round';
    for (const t of s.tiles) {
      if (!stakesVisibleTo(t, viewer)) continue;
      const c = tileCenter(t.x, t.y);
      const sc = cam.toScreen(c.x, c.y);
      if (sc.x < -60 || sc.y < -60 || sc.x > vw + 60 || sc.y > vh + 60) continue;
      const cy = c.y + WATER_DROP;
      // two staggered rows of stakes leaning out to sea, the far row first
      const rows: [number, number, number, number][] = [];
      for (let i = 0; i < 5; i++) rows.push([c.x - 14 + i * 7, cy - 5 + (i % 2) * 1.5 - i * 0.6, 8 + ((t.seed + i) % 3) * 1.4, 1.6 + (i % 2) * 0.6]);
      for (let i = 0; i < 4; i++) rows.push([c.x - 10.5 + i * 7, cy + 2.5 + (i % 2) * 1.2 - i * 0.6, 9 + ((t.seed + i * 2) % 3) * 1.4, 1.2 + (i % 2) * 0.8]);
      rows.sort((a, b) => a[1] - b[1]);
      // a ship of our own riding over the stakes: they show faintly so it is not hidden behind them
      ctx.globalAlpha = s.units.some((u) => u.x === t.x && u.y === t.y) ? 0.45 : 1;
      rows.forEach(([x, y, h, lean], i) => stake(ctx, x, y, h, lean, now, i));
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  },
};

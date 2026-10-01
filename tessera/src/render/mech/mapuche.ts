// Mapuche: while a Toqui leads, the signs of the war council stand beside the capital: a kultrun (the wooden bowl drum
// with its hide head, painted simply with the four-part cross) on the ground, and the toki kura, the stone axe that is
// the toqui's insignia, raised on a colihue pole with a streamer of red wool. Drawn small and plain.
import { ellipse, line, poly, softShadow } from '../prims';
import type { Ctx } from '../prims';
import { toquiActive } from '../../game/mech/mapuche';
import type { MechRender } from './types';

const WOOD = '#6a4428', WOOD_D = '#3e2614', HIDE = '#e8dcc0', PAINT = '#2a3a8a';
const CANE = '#cdb878', CANE_D = '#8e7a44', STONE = '#3a4a44', STONE_L = '#6a7e74', RED = '#b0242a';

/** A kultrun standing on (x, y), `k` its scale (about 6 px across at 1). */
export function kultrun(ctx: Ctx, x: number, y: number, k = 1) {
  softShadow(ctx, x + 0.6 * k, y + 0.4 * k, 3.6 * k, 1.4 * k, 0.3);
  // the bowl
  ctx.fillStyle = WOOD;
  ctx.beginPath();
  ctx.ellipse(x, y - 2.4 * k, 3.2 * k, 3 * k, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
  ellipse(ctx, x + 1 * k, y - 1 * k, 1.4 * k, 1 * k, WOOD_D);
  // the hide head, its lacing, and the painted cross with four small marks
  ellipse(ctx, x, y - 2.4 * k, 3.2 * k, 1.4 * k, HIDE);
  line(ctx, x - 2.6 * k, y - 2.4 * k, x + 2.6 * k, y - 2.4 * k, PAINT, 0.35 * k);
  line(ctx, x, y - 3.5 * k, x, y - 1.3 * k, PAINT, 0.35 * k);
  for (const [dx, dy] of [[-1.4, -0.6], [1.4, -0.6], [-1.4, 0.6], [1.4, 0.6]] as const) ellipse(ctx, x + dx * k, y - 2.4 * k + dy * k, 0.3 * k, 0.2 * k, PAINT);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI; line(ctx, x - Math.cos(a) * 3 * k, y - 2.2 * k, x - Math.cos(a) * 2.4 * k, y - 0.4 * k + Math.sin(a) * 0.4 * k, WOOD_D, 0.25 * k); }
  // the beater leaning on it
  line(ctx, x + 2.4 * k, y - 0.2 * k, x + 3.6 * k, y - 4.4 * k, WOOD_D, 0.4 * k);
  ellipse(ctx, x + 3.6 * k, y - 4.6 * k, 0.6 * k, 0.6 * k, HIDE);
}

/** The toki kura raised on a pole at (x, y), with a red streamer. */
export function tokiKura(ctx: Ctx, x: number, y: number, k = 1) {
  softShadow(ctx, x, y, 1.6 * k, 0.7 * k, 0.3);
  line(ctx, x, y, x, y - 16 * k, CANE_D, 0.8 * k);
  line(ctx, x - 0.25 * k, y, x - 0.25 * k, y - 16 * k, CANE, 0.3 * k);
  // the stone: a polished crescent blade, its butt bound to the pole
  const hy = y - 15 * k;
  poly(ctx, [x - 0.4 * k, hy - 0.8 * k, x + 2.8 * k, hy - 2.6 * k, x + 4 * k, hy, x + 2.8 * k, hy + 2.6 * k, x - 0.4 * k, hy + 0.8 * k], STONE);
  poly(ctx, [x + 0.6 * k, hy - 0.8 * k, x + 2.8 * k, hy - 2.6 * k, x + 3.6 * k, hy - 0.8 * k, x + 1.4 * k, hy - 0.2 * k], STONE_L);
  line(ctx, x - 0.6 * k, hy - 1 * k, x + 0.6 * k, hy + 1 * k, '#5e3a1c', 0.8 * k);
  // the red wool streamer
  poly(ctx, [x, y - 13 * k, x - 4.6 * k, y - 11.6 * k, x - 3.6 * k, y - 10.8 * k, x - 4.8 * k, y - 9.6 * k, x, y - 11 * k], RED);
}

export const render: MechRender = {
  tile(ctx, s, t, cx, cy) {
    if (t.cityId === null) return;
    const c = s.cities.find((k) => k.id === t.cityId);
    if (!c || !c.capital || c.x !== t.x || c.y !== t.y || s.players[c.owner]?.tribe !== 'mapuche' || !toquiActive(s, c.owner)) return;
    tokiKura(ctx, cx + 22, cy + 6, 1);
    kultrun(ctx, cx + 18, cy + 12, 1.1);
  },
};

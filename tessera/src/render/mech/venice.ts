// Venice: red-and-white striped mooring poles (paline) in the water beside every Venetian city, and a little crimson
// gonfalon with the golden winged lion of St Mark flying over each city whose Arsenal is ready to launch a ship.
import { tileCenter, WATER_DROP } from '../camera';
import { dist, isWater } from '../../game/grid';
import { arsenalReady } from '../../game/mech/venice';
import { isExplored } from '../../game/rules';
import { ellipse, line, poly, type Ctx } from '../prims';
import type { MechRender } from './types';

const RED = '#a8102a';
const RED_L = '#d0304a';
const GOLD = '#e8b83a';
const GOLD_L = '#fbe08a';
const GOLD_D = '#9a6a14';

/** One mooring pole: a post striped red and white with a gilt knob, its reflection in the water. */
export function palo(ctx: Ctx, x: number, y: number, h: number, c = RED) {
  line(ctx, x + 0.6, y + 0.6, x + 0.6, y + 3.4, 'rgba(255,255,255,0.25)', 1.4); // reflection
  line(ctx, x, y, x, y - h, '#f6f0e4', 1.6);
  const n = Math.round(h / 2.4);
  for (let i = 0; i < n; i += 2) line(ctx, x, y - (i * h) / n, x, y - ((i + 1) * h) / n, c, 1.6);
  line(ctx, x - 0.5, y, x - 0.5, y - h, 'rgba(255,255,255,0.35)', 0.4);
  ellipse(ctx, x, y - h - 0.6, 1.1, 1, GOLD);
  ellipse(ctx, x, y + 0.2, 1.4, 0.5, 'rgba(255,255,255,0.45)'); // the ripple at its foot
}

/** The lion of St Mark, simply: a gold winged lion passant with a halo, a paw on the open book. (x, y) is its middle. */
export function lionOfStMark(ctx: Ctx, x: number, y: number, s: number) {
  ellipse(ctx, x - 1.6 * s, y - 2.6 * s, 1.5 * s, 1.5 * s, GOLD_L); // halo
  poly(ctx, [x - 0.6 * s, y - 0.6 * s, x + 1.6 * s, y - 4.6 * s, x + 3 * s, y - 3.6 * s, x + 2.2 * s, y - 2 * s, x + 3.2 * s, y - 1.6 * s, x + 1.2 * s, y], GOLD_D); // far wing
  poly(ctx, [x - 0.2 * s, y - 0.4 * s, x + 0.6 * s, y - 4.2 * s, x + 2 * s, y - 3.4 * s, x + 1.2 * s, y - 2 * s, x + 2.4 * s, y - 1.2 * s, x + 0.8 * s, y + 0.2 * s], GOLD); // near wing
  ellipse(ctx, x + 0.2 * s, y + 0.2 * s, 2.2 * s, 1.1 * s, GOLD); // body
  ellipse(ctx, x - 1.8 * s, y - 0.6 * s, 1.1 * s, 1.1 * s, GOLD); // maned head
  ellipse(ctx, x - 2.5 * s, y - 0.4 * s, 0.5 * s, 0.45 * s, GOLD_D); // muzzle
  for (const dx of [-1.4, -0.6, 1, 1.8]) line(ctx, x + dx * s, y + 0.8 * s, x + dx * s, y + 2.2 * s, GOLD, 0.6 * s); // legs
  line(ctx, x + 2.2 * s, y, x + 3.4 * s, y - 1.4 * s, GOLD, 0.4 * s); // tail
  poly(ctx, [x - 3.6 * s, y + 0.4 * s, x - 2.2 * s, y + 0.2 * s, x - 2.2 * s, y + 1.6 * s, x - 3.6 * s, y + 1.8 * s], '#f6f0e4'); // the open book
  line(ctx, x - 2.9 * s, y + 0.3 * s, x - 2.9 * s, y + 1.7 * s, GOLD_D, 0.3 * s);
}

/** A swallow-tailed gonfalon of St Mark on a gilt staff, the six tails fluttering with `wave`. (x, y) is the staff foot. */
export function gonfalon(ctx: Ctx, x: number, y: number, wave: number) {
  line(ctx, x, y, x, y - 26, '#5a3a1a', 1.3);
  ellipse(ctx, x, y - 26.6, 1.3, 1.3, GOLD);
  line(ctx, x - 0.4, y - 24, x + 12, y - 24, GOLD_D, 0.8); // the cross-bar it hangs from
  const top = y - 23.6, bot = y - 13.6;
  const pts = [x + 0.4, top, x + 12, top];
  for (let i = 0; i <= 6; i++) { // six tails along the fly's foot
    const tx = x + 12 - (i * 11.6) / 6, w = Math.sin(wave + i * 0.9) * 0.8;
    pts.push(tx, bot + (i % 2 ? 0 : 3.4) + w);
  }
  poly(ctx, pts, RED);
  poly(ctx, [x + 0.4, top, x + 12, top, x + 12, top + 2, x + 0.4, top + 2], RED_L);
  line(ctx, x + 0.4, top + 0.2, x + 12, top + 0.2, GOLD, 0.6);
  lionOfStMark(ctx, x + 6.6, top + 5.2, 1.05);
}

export const render: MechRender = {
  // Paline: two or three striped mooring poles in each water tile beside a Venetian city, on the side facing it.
  tile(ctx, s, t, cx, cy) {
    if (!isWater(t)) return;
    const c = s.cities.find((k) => dist(k.x, k.y, t.x, t.y) === 1 && s.players[k.owner]?.tribe === 'venice');
    if (!c) return;
    const cc = tileCenter(c.x, c.y);
    const dx = cc.x - cx, dy = cc.y - (cy - WATER_DROP);
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const bx = cx + ux * 13, by = cy + WATER_DROP + uy * 6;
    const n = (t.x * 3 + t.y * 5) % 2 ? 3 : 2;
    ctx.save();
    for (let i = 0; i < n; i++) {
      const o = (i - (n - 1) / 2) * 5;
      palo(ctx, bx - uy * o, by + ux * o * 0.5, 9 + ((t.x + i) % 2) * 2.4, i % 2 && (t.y % 2) ? '#2a5a9a' : RED);
    }
    ctx.restore();
  },

  // The gonfalon of St Mark over each of the viewer's cities whose Arsenal can launch now.
  overlay(ctx, s, viewer, _cam, ov, now) {
    for (let pid = 0; pid < s.players.length; pid++) {
      if (s.players[pid]?.tribe !== 'venice' || (viewer >= 0 && viewer !== pid)) continue;
      for (const c of arsenalReady(s, pid)) {
        if (viewer >= 0 && !isExplored(s, viewer, c.x, c.y)) continue;
        const p = tileCenter(c.x, c.y);
        const wave = ov.still ? 0.8 : now / 240 + c.id;
        ctx.save();
        gonfalon(ctx, p.x - 20, p.y - 8, wave);
        ctx.restore();
      }
    }
  },
};

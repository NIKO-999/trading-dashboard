// Pirates: floating platforms (a timber deck over the sea, seams and lashings where decks join) and gold rings on the ships
// that owe the Brethren a toll.
import { LAND_DEPTH, TH, tileCenter } from '../camera';
import { HH, HW } from '../common';
import { TRIBES } from '../../data/tribes';
import { ellipse, line, poly, polyGrad, rand, shade, softShadow } from '../prims';
import { tileAt } from '../../game/grid';
import { def } from '../../game/rules';
import type { MechRender } from './types';

const isDeck = (s: Parameters<typeof tileAt>[0], x: number, y: number) => tileAt(s, x, y)?.terrain === 'platform';

export const render: MechRender = {
  ground(ctx, s, t, x, y) {
    if (t.terrain !== 'platform') return false;
    const sea = TRIBES[t.biome].palette.ocean;
    const wood = '#9a6b3f';
    const side = '#5c3d24';
    // the sea shows under the deck
    poly(ctx, [x, y + 5, x + HW, y + HH + 5, x, y + TH + 5, x - HW, y + HH + 5], shade(sea, -0.1));
    // the hull: two planked sides, darker toward the waterline
    polyGrad(ctx, [x - HW, y + HH, x, y + TH, x, y + TH + LAND_DEPTH, x - HW, y + HH + LAND_DEPTH], shade(side, 0.1), shade(side, -0.3), y + HH, y + TH + LAND_DEPTH);
    polyGrad(ctx, [x + HW, y + HH, x, y + TH, x, y + TH + LAND_DEPTH, x + HW, y + HH + LAND_DEPTH], shade(side, 0), shade(side, -0.35), y + HH, y + TH + LAND_DEPTH);
    line(ctx, x - HW, y + HH + 4, x, y + TH + 4, shade(side, -0.4), 1);
    line(ctx, x + HW, y + HH + 4, x, y + TH + 4, shade(side, -0.45), 1);
    // the deck
    poly(ctx, [x, y, x + HW, y + HH, x, y + TH, x - HW, y + HH], wood);
    for (let i = 1; i < 4; i++) { // planks along one diagonal
      const k = i / 4;
      line(ctx, x - HW * k, y + HH * k, x - HW * k + HW, y + HH * k + HH, shade(wood, -0.16), 0.9);
    }
    for (let i = 0; i < 3; i++) {
      const a = rand(t.seed, 40 + i);
      poly(ctx, [x - 10 + a * 20, y + 9 + i * 4, x - 2 + a * 20, y + 11 + i * 4, x - 10 + a * 20, y + 13 + i * 4], i % 2 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)');
    }
    // where a neighbouring deck joins, the edge is lashed: a rope seam instead of an open side
    const edges: [number, number, number, number, number, number][] = [
      [-1, 0, x, y, x - HW, y + HH], [0, -1, x, y, x + HW, y + HH], [1, 0, x + HW, y + HH, x, y + TH], [0, 1, x - HW, y + HH, x, y + TH],
    ];
    for (const [dx, dy, ax, ay, bx, by] of edges) {
      if (!isDeck(s, t.x + dx, t.y + dy)) continue;
      line(ctx, ax, ay, bx, by, '#d9c08a', 2);
      for (let i = 1; i < 4; i++) {
        const k = i / 4;
        const px = ax + (bx - ax) * k, py = ay + (by - ay) * k;
        line(ctx, px - 1.5, py - 1.5, px + 1.5, py + 1.5, '#6b4a2a', 1.2);
      }
    }
    return true;
  },

  tile(ctx, _s, t, cx, cy) {
    if (t.terrain !== 'platform' || t.cityId !== null) return;
    const k = rand(t.seed, 7);
    softShadow(ctx, cx, cy + 4, 10, 4, 0.25);
    if (k < 0.5) { // a mooring post and a coil of rope
      line(ctx, cx + 8, cy + 4, cx + 8, cy - 5, '#4a3020', 3);
      ellipse(ctx, cx + 8, cy - 6, 2.4, 1.3, '#d9c08a');
      ellipse(ctx, cx - 6, cy + 5, 4, 1.8, '#c7ad74');
    } else { // a barrel and a lantern
      poly(ctx, [cx - 8, cy + 2, cx - 2, cy + 2, cx - 2, cy + 8, cx - 8, cy + 8], '#7a4a25');
      ellipse(ctx, cx - 5, cy + 2, 3, 1.4, '#a06a38');
      line(ctx, cx + 7, cy + 5, cx + 7, cy - 6, '#3a2a1c', 1.6);
      ellipse(ctx, cx + 7, cy - 7, 2.2, 2.6, '#f5c542');
    }
  },

  overlay(ctx, s, viewer, _cam, _ov, now) {
    if (viewer < 0 || s.players[viewer]?.tribe !== 'pirates') return;
    const mine = s.units.filter((u) => u.owner === viewer && def(u).naval);
    for (const f of s.units) {
      if (f.owner === viewer || !def(f).naval || !s.players[viewer].explored[f.y * s.size + f.x]) continue;
      const near = mine.some((m) => Math.max(Math.abs(m.x - f.x), Math.abs(m.y - f.y)) <= 1)
        || s.cities.some((c) => c.owner === viewer && tileAt(s, f.x, f.y)!.owner === c.id);
      if (!near) continue;
      const c = tileCenter(f.x, f.y);
      const pulse = Math.sin(now / 300 + f.id) * 0.5 + 0.5;
      ctx.save();
      ctx.strokeStyle = `rgba(245,197,66,${0.55 + pulse * 0.35})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.ellipse(c.x, c.y + 6, 19 + pulse * 2, 9 + pulse, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  },
};

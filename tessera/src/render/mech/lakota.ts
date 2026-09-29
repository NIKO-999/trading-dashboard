// Lakota: herds on the move (a dusty trail behind the bison), a packed caravan (travois and pony) on the city tile,
// enriched soil (green shoots) where a camp used to stand, and the tiles a packed camp can roll to.
import { tileCenter } from '../camera';
import { campReach, isHerd, isPacked, soilOf } from '../../game/mech/lakota';
import { cityById, isExplored } from '../../game/rules';
import { ellipse, line, poly, softShadow } from '../prims';
import type { Ctx } from '../prims';
import type { MechRender } from './types';

function bison(ctx: Ctx, x: number, y: number, k: number) {
  ellipse(ctx, x, y + 1 * k, 5 * k, 2 * k, 'rgba(0,0,0,0.18)');
  ellipse(ctx, x, y - 3 * k, 5.5 * k, 3.6 * k, '#4a3428');
  ellipse(ctx, x - 3 * k, y - 5 * k, 3.2 * k, 3 * k, '#3a281e'); // the hump
  ellipse(ctx, x + 5 * k, y - 2.6 * k, 2.4 * k, 2.1 * k, '#2e1f17'); // the head
  line(ctx, x - 3 * k, y - 1 * k, x - 3 * k, y + 1.5 * k, '#2e1f17', 1);
  line(ctx, x + 3 * k, y - 1 * k, x + 3 * k, y + 1.5 * k, '#2e1f17', 1);
}

export const render: MechRender = {
  tile(ctx, s, t, cx, cy) {
    const soil = soilOf(t);
    if (soil && t.cityId === null) {
      const a = 0.25 + 0.35 * (soil.n / 8);
      ellipse(ctx, cx, cy + 5, 17, 8, `rgba(120,190,70,${a})`);
      for (const [dx, dy] of [[-8, 3], [-2, 8], [7, 5], [3, 1], [-11, 8]] as const) {
        line(ctx, cx + dx, cy + dy + 3, cx + dx, cy + dy - 1, '#5a9a3a', 1.2);
        line(ctx, cx + dx - 2, cy + dy, cx + dx, cy + dy - 1, '#7ec24e', 1);
      }
    }
    if (isHerd(t)) { // a small herd around the drawn animal, so the marked herds read at a glance
      ellipse(ctx, cx, cy + 12, 14, 3, 'rgba(190,150,90,0.35)'); // trampled ground
      bison(ctx, cx + 11, cy + 9, 0.8);
      bison(ctx, cx - 12, cy + 10, 0.7);
    }
    if (t.cityId !== null) {
      const c = cityById(s, t.cityId);
      if (c && isPacked(c)) { // tipis struck: a pony hauling a travois, poles lashed
        softShadow(ctx, cx, cy + 10, 18, 6, 0.3);
        ellipse(ctx, cx, cy + 9, 16, 6, 'rgba(120,90,50,0.55)');
        poly(ctx, [cx - 12, cy + 6, cx - 3, cy + 1, cx + 2, cy + 2, cx - 8, cy + 9], '#8a6a42'); // travois bed
        line(ctx, cx - 14, cy + 9, cx + 6, cy - 1, '#5a4030', 1.5);
        line(ctx, cx - 14, cy + 6, cx + 6, cy - 4, '#5a4030', 1.5);
        poly(ctx, [cx - 10, cy + 2, cx - 4, cy - 2, cx - 1, cy + 1, cx - 7, cy + 5], '#d9c9a0'); // hide bundle
        ellipse(ctx, cx + 9, cy + 1, 5, 3, '#a8683a'); // the pony
        ellipse(ctx, cx + 14, cy - 2, 2, 2.4, '#a8683a');
        line(ctx, cx + 7, cy + 3, cx + 7, cy + 8, '#5a3a20', 1.2);
        line(ctx, cx + 11, cy + 3, cx + 11, cy + 8, '#5a3a20', 1.2);
      }
    }
  },

  overlay(ctx, s, viewer, _cam, _ov, now) {
    const seen = (x: number, y: number) => viewer < 0 || isExplored(s, viewer, x, y);
    for (const t of s.tiles) {
      const herd = t.data?.herd as { fx?: number; fy?: number; t?: number } | undefined;
      if (!herd || t.resource !== 'animal' || !seen(t.x, t.y)) continue;
      const c = tileCenter(t.x, t.y);
      if (herd.fx !== undefined && herd.fy !== undefined && herd.t !== undefined && s.turn - herd.t <= 1) { // the trail it just walked
        const f = tileCenter(herd.fx, herd.fy);
        line(ctx, f.x, f.y + 6, c.x, c.y + 6, 'rgba(200,160,100,0.45)', 3);
      }
      const k = (now / 500 + t.x * 1.3 + t.y * 0.7) % 1; // dust drifting up from the hooves
      ctx.fillStyle = `rgba(210,180,130,${0.4 * (1 - k)})`;
      ctx.beginPath();
      ctx.ellipse(c.x - 8 + k * 16, c.y + 9 - k * 7, 3 + k * 3, 1.5 + k * 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const c of s.cities) {
      if (!isPacked(c) || !seen(c.x, c.y)) continue;
      const p = tileCenter(c.x, c.y);
      const k = 1 + 0.06 * Math.sin(now / 240);
      ctx.save();
      ctx.translate(p.x, p.y + 4);
      ctx.scale(1, 0.5);
      ctx.beginPath();
      ctx.arc(0, 0, 26 * k, 0, Math.PI * 2);
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(230,200,120,0.9)';
      ctx.stroke();
      ctx.restore();
      if (c.owner === viewer) for (const t of campReach(s, c)) { // where the caravan can roll this turn
        const q = tileCenter(t.x, t.y);
        ctx.fillStyle = 'rgba(230,200,120,0.75)';
        ctx.beginPath();
        ctx.ellipse(q.x, q.y + 4, 6 + Math.sin(now / 300) * 1, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },
};

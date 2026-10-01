// Haudenosaunee: the Great League of Peace. Each League city is tied to the member that brought it in by a thin
// wampum belt lying on the land: a dark purple band strung with white shell beads, a white diamond at the middle as on
// the Hiawatha Belt, and a white bead tying off each end. Only belts between cities the viewer has explored show.
import { tileCenter } from '../camera';
import { dist } from '../../game/grid';
import { isExplored } from '../../game/rules';
import { leagueOf } from '../../game/mech/haudenosaunee';
import type { City } from '../../game/types';
import type { Ctx } from '../prims';
import type { MechRender } from './types';

const PURPLE = '#3a2a72', PURPLE_D = '#1e1446', SHELL = '#f4efe0';

/** Each member after the first, paired with the nearest member that joined before it. */
function links(league: City[]): [City, City][] {
  const out: [City, City][] = [];
  for (let i = 1; i < league.length; i++) {
    const c = league[i];
    let best = league[0];
    for (let j = 1; j < i; j++) if (dist(league[j].x, league[j].y, c.x, c.y) < dist(best.x, best.y, c.x, c.y)) best = league[j];
    out.push([best, c]);
  }
  return out;
}

function belt(ctx: Ctx, ax: number, ay: number, bx: number, by: number, now: number) {
  const len = Math.hypot(bx - ax, by - ay);
  if (len < 1) return;
  const ux = (bx - ax) / len, uy = (by - ay) / len;
  // the belt sags a little across the land, bowing away from its line (downward, or sideways when it runs north-south)
  const sag = Math.min(10, len * 0.06);
  const flip = ux >= 0 ? 1 : -1;
  const sx = -uy * flip * sag, sy = Math.abs(ux) * sag;
  const at = (k: number) => { const b = Math.sin(Math.PI * k); return { x: ax + (bx - ax) * k + sx * b, y: ay + (by - ay) * k + sy * b }; };
  const mx = (ax + bx) / 2 + sx * 2, my = (ay + by) / 2 + sy * 2;
  // the band: a soft shadow, then the purple
  ctx.strokeStyle = 'rgba(20,12,40,0.3)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(ax, ay + 1.4); ctx.quadraticCurveTo(mx, my + 1.4, bx, by + 1.4);
  ctx.stroke();
  ctx.strokeStyle = PURPLE;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx, my, bx, by);
  ctx.stroke();
  // white shell beads along it, a slow shimmer running from the elder city to the younger
  const n = Math.floor(len / 7);
  for (let i = 1; i < n; i++) {
    const k = i / n;
    if (Math.abs(k - 0.5) < 0.06) continue;
    const p = at(k);
    const glint = 0.55 + 0.45 * Math.max(0, Math.sin(now / 700 - i * 0.5));
    ctx.fillStyle = `rgba(244,239,224,${glint.toFixed(2)})`;
    ctx.fillRect(p.x - 0.75, p.y - 0.75, 1.5, 1.5);
  }
  // the white diamond at the middle
  const m = at(0.5);
  const px = -uy, py = ux;
  ctx.fillStyle = SHELL;
  ctx.beginPath();
  ctx.moveTo(m.x + ux * 3.4, m.y + uy * 3.4);
  ctx.lineTo(m.x + px * 2.2, m.y + py * 2.2);
  ctx.lineTo(m.x - ux * 3.4, m.y - uy * 3.4);
  ctx.lineTo(m.x - px * 2.2, m.y - py * 2.2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PURPLE_D;
  ctx.lineWidth = 0.6;
  ctx.stroke();
  // the belt's ends, tied off with a white shell bead and a short fringe
  for (const [ex, ey] of [[ax, ay], [bx, by]]) {
    ctx.fillStyle = SHELL;
    ctx.beginPath();
    ctx.arc(ex, ey, 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PURPLE_D;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}

export const render: MechRender = {
  overlay(ctx, s, viewer, cam, _ov, now) {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1600, vh = typeof window !== 'undefined' ? window.innerHeight : 1000;
    const seen = (c: City) => viewer < 0 || isExplored(s, viewer, c.x, c.y);
    for (let pid = 0; pid < s.players.length; pid++) {
      if (s.players[pid].tribe !== 'haudenosaunee' || !s.players[pid].alive) continue;
      const league = leagueOf(s, pid);
      if (!league.length) continue;
      ctx.save();
      ctx.lineCap = 'round';
      for (const [a, b] of links(league)) {
        if (!seen(a) || !seen(b)) continue;
        const pa = tileCenter(a.x, a.y), pb = tileCenter(b.x, b.y);
        const sa = cam.toScreen(pa.x, pa.y), sb = cam.toScreen(pb.x, pb.y);
        if (Math.max(sa.x, sb.x) < -40 || Math.min(sa.x, sb.x) > vw + 40 || Math.max(sa.y, sb.y) < -40 || Math.min(sa.y, sb.y) > vh + 40) continue;
        // start and end a little in front of each town so the belt runs between them, not over the houses; an end that
        // leaves its town northward (up the screen) starts further out, past the houses that rise over it
        const dx = pb.x - pa.x, dy = pb.y - pa.y, l = Math.hypot(dx, dy) || 1;
        const cutA = Math.min(24 + 18 * Math.max(0, -dy / l), l * 0.36), cutB = Math.min(24 + 18 * Math.max(0, dy / l), l * 0.36);
        ctx.globalAlpha = 0.72;
        belt(ctx, pa.x + (dx / l) * cutA, pa.y + 8 + (dy / l) * cutA, pb.x - (dx / l) * cutB, pb.y + 8 - (dy / l) * cutB, now);
      }
      ctx.restore();
    }
  },
};

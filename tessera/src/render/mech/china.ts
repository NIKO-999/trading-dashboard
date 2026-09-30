// China: the Great Wall. Each segment is a low, slim stone wall with small crenellations along the edges of its tile
// that face land outside the empire, so neighbouring segments join into one line along the border.
import { HH, HW } from '../common';
import { line, poly, softShadow, type Ctx } from '../prims';
import { isWall } from '../../game/mech/china';
import { isLand, tileAt } from '../../game/grid';
import { tileOwnerPlayer } from '../../game/rules';
import type { GameState, Tile } from '../../game/types';
import type { MechRender } from './types';

/** The four edges of a tile's diamond, as corners relative to its centre, by the neighbour across each. */
const EDGES: [number, number, number, number, number, number][] = [
  [0, -1, 0, -HH, HW, 0], // upper right
  [-1, 0, -HW, 0, 0, -HH], // upper left
  [1, 0, HW, 0, 0, HH], // lower right
  [0, 1, 0, HH, -HW, 0], // lower left
];
const H = 4; // how tall the wall stands (world px)
const INSET = 0.14; // drawn a little inside the edge, on the wall's own side
const FACE = '#958a73', TOP = '#cdc1a4', FOOT = '#6c624f', MERLON = '#b3a78c';

/** The edges of wall tile `t` that face land outside its builder's empire. */
export function wallEdges(s: GameState, t: Tile): typeof EDGES {
  const owner = t.data!.wall as number;
  return EDGES.filter(([dx, dy]) => {
    const n = tileAt(s, t.x + dx, t.y + dy);
    return !!n && isLand(n) && tileOwnerPlayer(s, n) !== owner;
  });
}

/** A low stretch of wall from (ax, ay) to (bx, by): its face, a lighter walkway on top and small merlons. */
function wallRun(ctx: Ctx, ax: number, ay: number, bx: number, by: number) {
  poly(ctx, [ax, ay, bx, by, bx, by - H, ax, ay - H], FACE);
  line(ctx, ax, ay, bx, by, FOOT, 1);
  line(ctx, ax, ay - H, bx, by - H, TOP, 1.6);
  const len = Math.hypot(bx - ax, by - ay), n = Math.max(3, Math.round(len / 4.5));
  const ux = ((bx - ax) / len) * 1.3, uy = ((by - ay) / len) * 1.3; // half a merlon along the wall
  for (let i = 1; i < n; i += 2) { // merlons on every other step
    const x = ax + ((bx - ax) * i) / n, y = ay + ((by - ay) * i) / n - H;
    poly(ctx, [x - ux, y - uy, x + ux, y + uy, x + ux, y + uy - 2, x - ux, y - uy - 2], MERLON);
  }
}

export const render: MechRender = {
  tile(ctx, s, t, cx, cy) {
    if (!isWall(t)) return;
    const edges = tileOwnerPlayer(s, t) === t.data!.wall ? wallEdges(s, t) : [];
    const k = 1 - INSET;
    if (!edges.length) {
      // a lone segment (only corners touch the outside, or the land was lost): one short run across the tile
      softShadow(ctx, cx, cy + 1, 10, 3, 0.18);
      wallRun(ctx, cx - HW * 0.35, cy - HH * 0.35 + 2, cx + HW * 0.35, cy + HH * 0.35 + 2);
      return;
    }
    // back edges first, so a front edge stands in front of them
    for (const [, , x0, y0, x1, y1] of [...edges].sort((a, b) => a[3] + a[5] - (b[3] + b[5]))) {
      wallRun(ctx, cx + x0 * k, cy + y0 * k, cx + x1 * k, cy + y1 * k);
    }
  },
};

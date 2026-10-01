// Spain: a Mission on every mission tile. A whitewashed adobe church with a red-tile roof and a bell gable (espadaña)
// over its portal, a low arcaded convent wing beside it, and a walled yard with a well, an orange tree and a prickly pear.
import { ellipse, line, poly, shade, softShadow } from '../prims';
import type { Ctx } from '../prims';
import type { MechRender } from './types';

const WASH = '#f6f1e6';
const ADOBE = '#c89a68';
const TILE = '#c8582a';
const BRONZE = '#c8903a';
const DOOR = '#5a3418';
const DARK = '#3a2a22';

/** A point on the plan: u runs to the lower right, v to the lower left, h is height. */
const P = (x: number, y: number, u: number, v: number, h = 0): [number, number] => [x + (u - v), y + (u + v) / 2 - h];

/** A quad given by four plan points (u, v, h). */
function quad(ctx: Ctx, x: number, y: number, pts: [number, number, number][], c: string) {
  poly(ctx, pts.flatMap(([u, v, h]) => P(x, y, u, v, h)), c);
}

/** An arched opening on a wall of constant u (face 'u') or constant v (face 'v'), from a0 to a1 along the wall. */
function archOn(ctx: Ctx, x: number, y: number, face: 'u' | 'v', at: number, a0: number, a1: number, h0: number, h1: number, c: string) {
  const pt = (a: number, h: number) => (face === 'u' ? P(x, y, at, a, h) : P(x, y, a, at, h));
  const pts: number[] = [...pt(a0, h0), ...pt(a1, h0), ...pt(a1, h1)];
  const r = (a1 - a0) / 2, m = (a0 + a1) / 2;
  for (let i = 1; i < 8; i++) { const t = (i / 8) * Math.PI; pts.push(...pt(m + Math.cos(t) * r, h1 + Math.sin(t) * r * 0.9)); }
  pts.push(...pt(a0, h1));
  poly(ctx, pts, c);
}

/** A few patches where the whitewash has flaked off the adobe. */
function flakes(ctx: Ctx, x: number, y: number, face: 'u' | 'v', at: number, spots: [number, number][]) {
  for (const [a, h] of spots) {
    const pt = (da: number, dh: number) => (face === 'u' ? P(x, y, at, a + da, h + dh) : P(x, y, a + da, at, h + dh));
    poly(ctx, [...pt(0, 0), ...pt(1.2, 0.2), ...pt(1.4, 0.9), ...pt(0.4, 1.1), ...pt(-0.2, 0.6)], ADOBE);
  }
}

/** The Mission, standing on (x, y). */
export function mission(ctx: Ctx, x: number, y: number) {
  softShadow(ctx, x + 1, y + 2, 24, 10, 0.26);
  // the yard: packed earth inside a low adobe wall
  quad(ctx, x, y, [[-1, -3, 0], [10, -3, 0], [10, 9, 0], [-1, 9, 0]], '#d8bc8c');
  quad(ctx, x, y, [[2, 1.6, 0], [8, 1.6, 0], [8, 3, 0], [2, 3, 0]], '#cbae7e'); // a worn path to the door
  // ---- the church: nave u -10..6, v -10..-3
  const H = 8, R = 3.6, U0 = -10, U1 = 6, V0 = -10, V1 = -3, VM = (V0 + V1) / 2;
  quad(ctx, x, y, [[U0, V0, H], [U1, V0, H], [U1, VM, H + R], [U0, VM, H + R]], shade(TILE, -0.35)); // far slope
  quad(ctx, x, y, [[U0, V1, 0], [U1, V1, 0], [U1, V1, H], [U0, V1, H]], shade(WASH, 0.02)); // the long side
  flakes(ctx, x, y, 'v', V1, [[-8, 1], [-3, 0.4], [2, 5.4]]);
  for (const u of [-7, -2]) archOn(ctx, x, y, 'v', V1, u, u + 1.4, 4.4, 6, DARK); // high little windows
  quad(ctx, x, y, [[U1, V0, 0], [U1, V1, 0], [U1, V1, H], [U1, V0, H]], shade(WASH, -0.12)); // the façade
  quad(ctx, x, y, [[U1, V0, H], [U1, V1, H], [U1, VM, H + R]], shade(WASH, -0.1)); // its gable
  flakes(ctx, x, y, 'u', U1, [[-9.4, 0.6], [-4.4, 2.4]]);
  // the portal: an arched door in a moulded surround, a round window over it
  archOn(ctx, x, y, 'u', U1, VM - 2.2, VM + 2.2, 0, 3.8, shade(WASH, -0.24));
  archOn(ctx, x, y, 'u', U1, VM - 1.6, VM + 1.6, 0, 3.6, DOOR);
  line(ctx, ...P(x, y, U1, VM, 0), ...P(x, y, U1, VM, 4.8), shade(DOOR, -0.3), 0.5);
  const [ox, oy] = P(x, y, U1, VM, 8.2);
  ellipse(ctx, ox, oy, 1.1, 1.3, DARK);
  // the near roof slope, red pantiles in rows
  quad(ctx, x, y, [[U0 - 0.4, V1 + 0.6, H - 0.4], [U1 + 0.6, V1 + 0.6, H - 0.4], [U1 + 0.6, VM, H + R], [U0 - 0.4, VM, H + R]], TILE);
  for (let i = 1; i < 4; i++) { const t = i / 4; line(ctx, ...P(x, y, U0 - 0.4, V1 + 0.6 - t * (V1 + 0.6 - VM), H - 0.4 + t * (R + 0.4)), ...P(x, y, U1 + 0.6, V1 + 0.6 - t * (V1 + 0.6 - VM), H - 0.4 + t * (R + 0.4)), shade(TILE, -0.22), 0.45); }
  for (let u = U0 + 1; u < U1; u += 1.6) line(ctx, ...P(x, y, u, V1 + 0.6, H - 0.4), ...P(x, y, u, VM, H + R), shade(TILE, 0.16), 0.3);
  line(ctx, ...P(x, y, U0 - 0.4, VM, H + R), ...P(x, y, U1 + 0.6, VM, H + R), shade(TILE, -0.4), 0.9); // the ridge
  // ---- the espadaña: a bell gable rising from the façade, two arched openings with bronze bells
  const gb = H + R - 1.6;
  const g: [number, number][] = [[VM - 3.4, gb], [VM - 3.4, gb + 4], [VM - 2.6, gb + 5.6], [VM - 1.2, gb + 6.2], [VM - 0.8, gb + 8.4], [VM, gb + 9.4], [VM + 0.8, gb + 8.4], [VM + 1.2, gb + 6.2], [VM + 2.6, gb + 5.6], [VM + 3.4, gb + 4], [VM + 3.4, gb]];
  poly(ctx, g.flatMap(([v, h]) => P(x, y, U1 + 0.3, v, h)), shade(WASH, -0.06));
  line(ctx, ...P(x, y, U1 + 0.3, VM - 3.4, gb + 4), ...P(x, y, U1 + 0.3, VM + 3.4, gb + 4), shade(WASH, -0.24), 0.5); // a cornice line
  for (const v of [VM - 2.6, VM + 0.8]) {
    archOn(ctx, x, y, 'u', U1 + 0.3, v, v + 1.8, gb + 0.6, gb + 2.6, DARK);
    const [bx, by] = P(x, y, U1 + 0.3, v + 0.9, gb + 2.4);
    poly(ctx, [bx - 0.8, by + 1.6, bx + 0.8, by + 1.6, bx + 0.5, by + 0.2, bx, by - 0.2, bx - 0.5, by + 0.2], BRONZE);
    ellipse(ctx, bx, by + 1.6, 0.8, 0.3, shade(BRONZE, -0.3));
    line(ctx, bx, by - 0.2, bx, by - 0.8, '#2a2020', 0.4);
  }
  archOn(ctx, x, y, 'u', U1 + 0.3, VM - 0.6, VM + 0.6, gb + 5, gb + 6.2, DARK); // a little top opening
  const [cx, cy] = P(x, y, U1 + 0.3, VM, gb + 9.4); // an iron finial
  line(ctx, cx, cy, cx, cy - 3, '#2a2424', 0.6);
  line(ctx, cx - 1, cy - 2, cx + 1, cy - 2, '#2a2424', 0.6);
  // ---- the convent wing: u -10..-1, v -2..8, a cloister arcade along its front
  const H2 = 5, W0 = -10, W1 = -1, Z0 = -2, Z1 = 8, WM = (W0 + W1) / 2;
  quad(ctx, x, y, [[W0, Z1, 0], [W1, Z1, 0], [W1, Z1, H2], [W0, Z1, H2]], shade(WASH, 0.03));
  quad(ctx, x, y, [[W0, Z1, H2], [W1, Z1, H2], [WM, Z1, H2 + 2.6]], shade(WASH, 0.03));
  flakes(ctx, x, y, 'v', Z1, [[-8.4, 0.8], [-4, 2.4]]);
  archOn(ctx, x, y, 'v', Z1, -6.4, -4.6, 1.6, 3, DARK); // a window
  quad(ctx, x, y, [[W1, Z0, 0], [W1, Z1, 0], [W1, Z1, H2], [W1, Z0, H2]], shade(WASH, -0.12));
  for (let i = 0; i < 4; i++) archOn(ctx, x, y, 'u', W1, Z0 + 0.6 + i * 2.4, Z0 + 2.2 + i * 2.4, 0, 2.6, '#7a5a42'); // the cloister arches
  quad(ctx, x, y, [[WM, Z0 - 0.4, H2 + 2.6], [WM, Z1 + 0.4, H2 + 2.6], [W1 + 0.6, Z1 + 0.4, H2 - 0.3], [W1 + 0.6, Z0 - 0.4, H2 - 0.3]], shade(TILE, -0.12));
  for (let v = Z0 + 0.4; v < Z1; v += 1.5) line(ctx, ...P(x, y, WM, v, H2 + 2.6), ...P(x, y, W1 + 0.6, v, H2 - 0.3), shade(TILE, -0.34), 0.3);
  line(ctx, ...P(x, y, WM, Z0 - 0.4, H2 + 2.6), ...P(x, y, WM, Z1 + 0.4, H2 + 2.6), shade(TILE, -0.4), 0.8);
  // ---- the yard: a stone well, an orange tree in a whitewashed ring, a prickly pear
  const [wx, wy] = P(x, y, 4, 6, 0);
  ellipse(ctx, wx, wy, 2.4, 1.3, shade(ADOBE, -0.2));
  ellipse(ctx, wx, wy - 1.4, 2.4, 1.3, WASH);
  ellipse(ctx, wx, wy - 1.4, 1.5, 0.8, '#2a5a7a');
  line(ctx, wx - 2, wy - 1.4, wx - 2, wy - 4.6, DOOR, 0.6);
  line(ctx, wx + 2, wy - 1.4, wx + 2, wy - 4.6, DOOR, 0.6);
  line(ctx, wx - 2.4, wy - 4.6, wx + 2.4, wy - 4.6, DOOR, 0.8);
  const [tx, ty] = P(x, y, 8, -1, 0);
  ellipse(ctx, tx, ty, 2, 0.9, WASH);
  line(ctx, tx, ty, tx, ty - 4, '#6a4a32', 1.1);
  for (const [dx, dy, r, c] of [[-1.6, -5, 2.4, '#2a6a2a'], [1.6, -5.4, 2.4, '#24602a'], [0, -6.8, 2.8, '#2f7a32'], [-0.6, -7.6, 1.4, '#4a9a42']] as const) ellipse(ctx, tx + dx, ty + dy, r, r * 0.85, c);
  for (const [dx, dy] of [[-1.8, -5.6], [1.2, -6.6], [0.2, -4.8], [2, -4.8], [-0.8, -7.4]] as const) ellipse(ctx, tx + dx, ty + dy, 0.6, 0.6, '#f08a1a');
  const [px, py] = P(x, y, 1, 7.6, 0);
  for (const [dx, dy, rx, ry, c] of [[0, -1.6, 1.3, 1.8, '#5a8a4a'], [-1.4, -3.4, 1.1, 1.5, '#6a9a52'], [1.2, -3.8, 1, 1.4, '#4a7a3e'], [0, -5, 0.9, 1.2, '#6a9a52']] as const) ellipse(ctx, px + dx, py + dy, rx, ry, c);
  ellipse(ctx, px + 1.2, py - 5.2, 0.4, 0.4, '#d8405a');
  // the low yard wall along the front, with a gateway
  const yardWall = (u0: number, v0: number, u1: number, v1: number, c: string) => {
    quad(ctx, x, y, [[u0, v0, 0], [u1, v1, 0], [u1, v1, 2], [u0, v0, 2]], c);
    line(ctx, ...P(x, y, u0, v0, 2), ...P(x, y, u1, v1, 2), WASH, 1);
  };
  yardWall(10, -3, 10, 0.8, shade(ADOBE, -0.12));
  yardWall(10, 4.2, 10, 9, shade(ADOBE, -0.12));
  yardWall(-1, 9, 10, 9, ADOBE);
  for (const v of [0.8, 4.2]) { // the gate posts
    const [gx, gy] = P(x, y, 10, v, 0);
    poly(ctx, [gx - 0.8, gy, gx + 0.8, gy + 0.4, gx + 0.8, gy - 3.4, gx - 0.8, gy - 3.8], WASH);
    ellipse(ctx, gx, gy - 3.8, 0.9, 0.5, TILE);
  }
}

export const render: MechRender = {
  tile(ctx, _s, t, cx, cy) {
    if (t.improvement !== 'mission') return;
    mission(ctx, cx, cy + 2);
  },
};

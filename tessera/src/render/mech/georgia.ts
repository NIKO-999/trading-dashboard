// Georgia: a qvevri cellar (marani) on every qvevri tile. A low earthen mound with the clay mouths of great buried wine
// jars set in it, their lids of stone and wood beside them; a small open wooden shelter with a shingle roof over the
// near jars; a vine trellis (pergola) of poles and wires along the back. The cellar ages with its wine: young cellars
// have fresh clay and bare trellis, after 5 turns the vine leafs out and moss creeps over the mound, and after 10 the
// clay is dark with age, grapes hang purple from the pergola and a wine-stained amphora rests by the door.
import { box, ellipse, line, mix, poly, shade, softShadow } from '../prims';
import type { Ctx } from '../prims';
import { qvevriAge } from '../../game/mech/georgia';
import type { MechRender } from './types';

const EARTH = '#8a6a48', EARTH_L = '#a8845a', EARTH_D = '#5e4630';
const CLAY = '#c4733e', CLAY_D = '#8a4a26';
const WOOD = '#7a5434', WOOD_D = '#4a3020', SHINGLE = '#6e5e4e';
const STONE = '#b8b0a2', LEAF = '#4f8a32', LEAF_L = '#7ab048', GRAPE = '#4a1e48', GRAPE_L = '#7a3a6e', WINE = '#6a1428';

/** A jar's mouth set in the ground: a thick clay rim round a dark opening, sealed with a stone lid when `sealed`. */
function jarMouth(ctx: Ctx, x: number, y: number, r: number, clay: string, sealed: boolean) {
  ellipse(ctx, x, y + 0.5, r + 0.9, (r + 0.9) * 0.5, shade(EARTH_D, -0.1)); // the dug ring round it
  ellipse(ctx, x, y, r, r * 0.5, clay);
  ellipse(ctx, x - 0.3, y - 0.2, r * 0.8, r * 0.38, shade(clay, 0.18));
  if (sealed) {
    ellipse(ctx, x, y - 0.3, r * 0.68, r * 0.32, STONE);
    ellipse(ctx, x - 0.3, y - 0.5, r * 0.45, r * 0.2, shade(STONE, 0.2));
    line(ctx, x - r * 0.3, y - 0.4, x + r * 0.3, y - 0.4, shade(STONE, -0.35), 0.4); // the lid's handle
  } else {
    ellipse(ctx, x, y - 0.1, r * 0.62, r * 0.28, '#1e0e10');
    ellipse(ctx, x + 0.2, y + 0.05, r * 0.42, r * 0.16, WINE); // wine glinting inside
  }
}

/** The cellar standing on (x, y), aged `age` turns. */
export function qvevriCellar(ctx: Ctx, x: number, y: number, age = 0) {
  const old = age >= 10, mid = age >= 5;
  const clay = old ? mix(CLAY, '#5a3a28', 0.45) : mid ? mix(CLAY, '#6a4a30', 0.2) : CLAY;
  softShadow(ctx, x + 1.5, y + 2, 15, 5.4, 0.28);

  // the vine trellis along the back: posts, cross-poles and wires
  const posts: [number, number][] = [[-12, -5], [-4, -9], [4, -9], [12, -5]];
  for (const [px, py] of posts) {
    line(ctx, x + px, y + py, x + px, y + py - 12, WOOD_D, 1);
    line(ctx, x + px - 0.3, y + py, x + px - 0.3, y + py - 12, shade(WOOD, 0.2), 0.4);
  }
  for (let i = 0; i < posts.length - 1; i++) {
    const [ax, ay] = posts[i], [bx, by] = posts[i + 1];
    line(ctx, x + ax, y + ay - 12, x + bx, y + by - 12, WOOD, 0.8); // the top pole
    line(ctx, x + ax, y + ay - 7, x + bx, y + by - 7, '#8a8a80', 0.3); // a wire
  }
  // the vine: a twisted trunk at each post climbing to the pole, leaves along it (fuller with age)
  const leaves = old ? 9 : mid ? 6 : 3;
  for (let i = 0; i < posts.length; i++) {
    const [px, py] = posts[i];
    line(ctx, x + px + 0.8, y + py, x + px + 0.5, y + py - 11, '#5a3a24', 0.7);
    if (i === posts.length - 1) continue;
    const [qx, qy] = posts[i + 1];
    for (let j = 0; j < leaves; j++) {
      const t = (j + 0.5) / leaves, lx = x + px + (qx - px) * t, ly = y + py - 12 + (qy - py) * t + (j % 2 ? 0.8 : -0.4);
      ellipse(ctx, lx, ly + 0.4, 1.7, 1.1, shade(LEAF, -0.25));
      ellipse(ctx, lx - 0.2, ly, 1.5, 1, j % 3 ? LEAF : LEAF_L);
      if (old && j % 2 === 0) { // bunches of Saperavi grapes
        for (const [gx, gy] of [[0, 1.6], [-0.6, 2.4], [0.6, 2.4], [0, 3.2], [-0.3, 3.9]] as const) {
          ellipse(ctx, lx + gx, ly + gy, 0.55, 0.55, GRAPE);
          ellipse(ctx, lx + gx - 0.15, ly + gy - 0.15, 0.22, 0.22, GRAPE_L);
        }
      }
    }
  }

  // the mound: an earthen hump, lighter on top, with a grass rim
  poly(ctx, [x - 15, y + 1, x - 11, y - 3.6, x - 4, y - 6, x + 5, y - 6, x + 12, y - 3.6, x + 15, y + 1, x + 8, y + 5, x - 8, y + 5], EARTH_D);
  poly(ctx, [x - 14, y, x - 10.4, y - 3.8, x - 4, y - 5.8, x + 5, y - 5.8, x + 11.4, y - 3.8, x + 14, y, x + 7.6, y + 3.6, x - 7.6, y + 3.6], EARTH);
  poly(ctx, [x - 9, y - 2.8, x - 3.6, y - 4.8, x + 4.4, y - 4.8, x + 9.6, y - 2.6, x + 4, y + 0.2, x - 4, y + 0.2], EARTH_L);
  if (mid) for (const [mx, my, r] of [[-11, -1, 2.2], [9.6, 1.6, 2], [-2, 3, 1.6], [12, -1.4, 1.4]] as const) { // moss and grass creeping over
    ellipse(ctx, x + mx, y + my, r, r * 0.5, old ? '#5e7a36' : '#7a9a44');
  }
  for (const [gx, gy] of [[-14, 0.6], [14, 0.4], [-6, 4.4], [6.6, 4.2]] as const) for (const a of [-0.5, 0, 0.5]) line(ctx, x + gx, y + gy, x + gx + a * 2, y + gy - 2, '#5a8a34', 0.45);

  // the jar mouths in rows across the mound: the oldest one left open, wine showing
  const jars: [number, number, number][] = [[-7, -2.6, 2.1], [-1, -3.6, 2.4], [5.6, -2.4, 2.1], [-4, 0.6, 1.9], [2.6, 0.8, 2]];
  jars.forEach(([jx, jy, r], i) => jarMouth(ctx, x + jx, y + jy, r, clay, i !== 1));
  // a lid leaning against the open jar, and a wooden ladle
  ellipse(ctx, x - 1 + 3.4, y - 3.2, 1.2, 1.6, STONE);
  line(ctx, x - 1.6, y - 4.2, x - 4.6, y - 7.2, WOOD, 0.6);
  ellipse(ctx, x - 1.4, y - 4, 0.7, 0.4, WOOD_D);

  // the shelter: four posts and a little shingle roof over the front jars, pitched toward us
  const sx = x + 8.4, sy = y + 1.6;
  for (const [dx, dy] of [[-4.4, -2.2], [4.4, -2.2], [-4.4, 2.2], [4.4, 2.2]] as const) {
    line(ctx, sx + dx, sy + dy, sx + dx, sy + dy - 9, WOOD_D, 0.9);
    line(ctx, sx + dx - 0.3, sy + dy, sx + dx - 0.3, sy + dy - 9, shade(WOOD, 0.15), 0.35);
  }
  box(ctx, sx, sy + 2.2, 6.4, 1.6, STONE); // a low stone step under it
  jarMouth(ctx, sx, sy + 0.4, 1.6, clay, true);
  const rx0 = sx - 6, rx1 = sx + 6, ry = sy - 10;
  poly(ctx, [rx0, ry + 1, sx, ry - 2.6, rx1, ry + 1, sx, ry + 4.6], shade(SHINGLE, 0.1));
  poly(ctx, [sx, ry + 4.6, rx1, ry + 1, rx1, ry + 2.2, sx, ry + 5.8], shade(SHINGLE, -0.3));
  poly(ctx, [rx0, ry + 1, sx, ry + 4.6, sx, ry + 5.8, rx0, ry + 2.2], shade(SHINGLE, -0.1));
  for (let i = 1; i < 4; i++) { const t = i / 4; line(ctx, rx0 + (sx - rx0) * t, ry + 1 - 3.6 * t, sx + (rx1 - sx) * t, ry + 4.6 - 3.6 * t, shade(SHINGLE, -0.25), 0.35); }
  line(ctx, rx0, ry + 1, sx, ry - 2.6, shade(SHINGLE, 0.35), 0.5);

  // a churchkhela string hanging from the shelter's beam (walnuts dipped in grape must), and with age an amphora by it
  for (let i = 0; i < 3; i++) {
    const hx = sx - 3 + i * 1.6, hy = ry + 5.6 + i * 0.6;
    line(ctx, hx, hy - 0.6, hx, hy + 3.2, i % 2 ? '#8a2a3a' : '#a0522d', 0.9);
  }
  if (old) {
    const ax = x - 12, ay = y + 3.4;
    ellipse(ctx, ax, ay, 1.8, 2.6, CLAY_D);
    ellipse(ctx, ax - 0.5, ay - 0.6, 0.8, 1.6, shade(CLAY, 0.1));
    line(ctx, ax, ay - 2.6, ax, ay - 3.8, CLAY_D, 1);
    ellipse(ctx, ax + 0.8, ay + 2.4, 1.6, 0.5, 'rgba(106,20,40,0.45)'); // a wine stain
  }
}

export const render: MechRender = {
  tile(ctx, s, t, cx, cy) {
    if (t.improvement !== 'qvevri') return;
    ctx.save();
    ctx.translate(cx, cy + 3);
    ctx.scale(1.35, 1.35);
    qvevriCellar(ctx, 0, 0, qvevriAge(s, t));
    ctx.restore();
  },
};

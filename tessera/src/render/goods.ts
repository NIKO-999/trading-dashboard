// The six luxuries on the map (see game/goods), drawn procedurally: a deposit in the wild, and the same deposit with
// a little worked frame once developed (a fence of posts on land, a marker float on the pearl beds).
import type { Luxury } from '../game/goods';
import { WATER_DROP } from './camera';
import { ellipse, poly, type Ctx } from './prims';

function stroke(ctx: Ctx, color: string, w: number, path: () => void) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  path();
  ctx.stroke();
}

function silk(ctx: Ctx, x: number, y: number) {
  for (const [ox, oy, r] of [[-7, 4, 7], [6, 6, 6]] as const) {
    ellipse(ctx, x + ox, y + oy + 5, r * 0.8, r * 0.3, 'rgba(0,0,0,0.18)');
    ellipse(ctx, x + ox, y + oy - 2, r, r * 0.8, '#3f7d3a');
    ellipse(ctx, x + ox - 1.5, y + oy - 4, r * 0.6, r * 0.45, '#5aa04e');
    for (const [cx, cy] of [[-2, -1], [2, -4], [1, 2]]) ellipse(ctx, x + ox + cx, y + oy + cy - 2, 1.8, 1.2, '#fbf6ea');
  }
  // a skein of dyed silk hung between the bushes
  stroke(ctx, '#e0569a', 2.2, () => { ctx.moveTo(x - 4, y - 1); ctx.quadraticCurveTo(x, y + 6, x + 4, y + 1); });
  stroke(ctx, '#ffa6cf', 1, () => { ctx.moveTo(x - 3.5, y - 1.5); ctx.quadraticCurveTo(x, y + 5, x + 3.5, y + 0.5); });
}

function spices(ctx: Ctx, x: number, y: number) {
  for (const [ox, oy, c, hi] of [[-8, 6, '#c3432a', '#e8745a'], [7, 7, '#e3a21a', '#f7cf62'], [0, 1, '#8a4f24', '#b87a45']] as const) {
    ellipse(ctx, x + ox, y + oy + 1, 6.5, 2.4, 'rgba(0,0,0,0.2)');
    poly(ctx, [x + ox - 6, y + oy, x + ox, y + oy - 8, x + ox + 6, y + oy], c);
    poly(ctx, [x + ox - 2, y + oy - 5, x + ox, y + oy - 8, x + ox + 1.5, y + oy - 5.5], hi);
    ellipse(ctx, x + ox, y + oy, 6, 1.8, c);
  }
  // a cinnamon bundle
  stroke(ctx, '#a0562a', 1.8, () => { ctx.moveTo(x - 3, y + 11); ctx.lineTo(x + 3, y + 9); ctx.moveTo(x - 3, y + 12.5); ctx.lineTo(x + 3, y + 10.5); });
}

function wine(ctx: Ctx, x: number, y: number) {
  for (const ox of [-7, 6]) {
    stroke(ctx, '#6b4a2b', 1.6, () => { ctx.moveTo(x + ox, y + 9); ctx.lineTo(x + ox, y - 8); });
    ellipse(ctx, x + ox + 3, y - 6, 4, 2.6, '#4f8f3a');
    ellipse(ctx, x + ox - 3, y - 3, 3.4, 2.2, '#63a547');
    for (const [gx, gy] of [[0, 0], [2.2, 0], [-2.2, 0], [1.1, 2], [-1.1, 2], [0, 4]]) ellipse(ctx, x + ox + gx + 1, y + gy, 1.4, 1.4, '#6b2a6e');
    ellipse(ctx, x + ox + 0.5, y - 0.5, 0.6, 0.6, '#c58bd0');
  }
  stroke(ctx, '#6b4a2b', 1, () => { ctx.moveTo(x - 7, y - 6); ctx.quadraticCurveTo(x, y - 3, x + 6, y - 6); });
}

function ivory(ctx: Ctx, x: number, y: number) {
  ellipse(ctx, x, y + 8, 11, 3, 'rgba(0,0,0,0.18)');
  for (const f of [-1, 1]) {
    stroke(ctx, '#8d8166', 4.4, () => { ctx.moveTo(x - 9 * f, y + 7); ctx.quadraticCurveTo(x - 2 * f, y - 6, x + 8 * f, y - 8); });
    stroke(ctx, '#f4ecd6', 3.2, () => { ctx.moveTo(x - 9 * f, y + 7); ctx.quadraticCurveTo(x - 2 * f, y - 6, x + 8 * f, y - 8); });
  }
  stroke(ctx, '#fffaf0', 1, () => { ctx.moveTo(x - 7, y + 4); ctx.quadraticCurveTo(x - 2, y - 4, x + 5, y - 6); });
}

function incense(ctx: Ctx, x: number, y: number, t = 0) {
  ellipse(ctx, x - 2, y + 9, 9, 2.6, 'rgba(0,0,0,0.18)');
  // a gnarled frankincense tree
  stroke(ctx, '#7a5a3a', 2.4, () => { ctx.moveTo(x - 2, y + 9); ctx.quadraticCurveTo(x - 5, y + 2, x - 1, y - 3); });
  stroke(ctx, '#7a5a3a', 1.4, () => { ctx.moveTo(x - 2, y + 2); ctx.lineTo(x - 8, y - 2); });
  for (const [ox, oy, r] of [[-1, -5, 5], [-8, -3, 3.5], [3, -2, 3]] as const) ellipse(ctx, x + ox, y + oy, r, r * 0.6, '#8a9a4a');
  // a smoking burner and its curls of fragrant smoke
  ellipse(ctx, x + 8, y + 8, 3.5, 1.4, '#6d5230');
  poly(ctx, [x + 5, y + 8, x + 11, y + 8, x + 10, y + 5, x + 6, y + 5], '#9a7444');
  ctx.globalAlpha = 0.75;
  stroke(ctx, '#e9e6f0', 1.3, () => { ctx.moveTo(x + 8, y + 4); ctx.bezierCurveTo(x + 5 + t, y - 1, x + 11, y - 5, x + 7, y - 11); });
  ctx.globalAlpha = 1;
}

function pearls(ctx: Ctx, x: number, y: number) {
  const wy = y + WATER_DROP;
  for (const [ox, oy] of [[-6, 0], [7, 4]] as const) {
    ellipse(ctx, x + ox, wy + oy + 1, 7, 3, 'rgba(10,40,60,0.35)');
    ellipse(ctx, x + ox, wy + oy, 6.5, 3.2, '#8d86a3'); // lower shell
    ellipse(ctx, x + ox, wy + oy - 0.5, 5, 2.2, '#d8d2e8'); // nacre
    ellipse(ctx, x + ox + 0.5, wy + oy - 1, 1.9, 1.9, '#fdfbff'); // the pearl
    ellipse(ctx, x + ox + 0, wy + oy - 1.6, 0.7, 0.7, '#ffffff');
    // the upper shell, tipped open
    poly(ctx, [x + ox - 6, wy + oy - 1, x + ox - 3, wy + oy - 7, x + ox + 5, wy + oy - 6, x + ox + 6, wy + oy - 1.5], '#a69fbd');
  }
}

/** A luxury deposit, centred on a tile at (x, y). */
export function drawLuxury(ctx: Ctx, kind: Luxury, x: number, y: number) {
  switch (kind) {
    case 'silk': return silk(ctx, x, y);
    case 'spices': return spices(ctx, x, y);
    case 'wine': return wine(ctx, x, y);
    case 'ivory': return ivory(ctx, x, y);
    case 'incense': return incense(ctx, x, y);
    case 'pearls': return pearls(ctx, x, y);
  }
}

/** A developed luxury: the deposit, worked (a fence of posts, or a marker float on the pearl beds), in the owner's colour. */
export function drawEstate(ctx: Ctx, kind: Luxury, x: number, y: number, color: string) {
  drawLuxury(ctx, kind, x, y);
  if (kind === 'pearls') {
    const wy = y + WATER_DROP;
    stroke(ctx, '#5b4630', 1.4, () => { ctx.moveTo(x + 14, wy + 2); ctx.lineTo(x + 14, wy - 9); });
    ellipse(ctx, x + 14, wy + 2, 3, 1.3, '#e9dcc0');
    poly(ctx, [x + 14, wy - 9, x + 20, wy - 7, x + 14, wy - 5], color);
    return;
  }
  // a low fence of three posts and a rail, and a pennant
  for (const [px, py] of [[-12, 12], [0, 15], [12, 12]]) stroke(ctx, '#6b4a2b', 1.8, () => { ctx.moveTo(x + px, y + py); ctx.lineTo(x + px, y + py - 5); });
  stroke(ctx, '#8b6a45', 1.2, () => { ctx.moveTo(x - 12, y + 9); ctx.lineTo(x, y + 12); ctx.lineTo(x + 12, y + 9); });
  stroke(ctx, '#5b4630', 1.2, () => { ctx.moveTo(x + 12, y + 7); ctx.lineTo(x + 12, y - 4); });
  poly(ctx, [x + 12, y - 4, x + 18, y - 2, x + 12, y], color);
}

// Babylon: a ziggurat on every ziggurat tile. A stepped temple-tower of sun-dried mud brick in three terraces, each one
// set back and painted a different colour (bitumen-dark, madder-red, pale brick), with shallow buttresses, reed-mat
// courses and weep holes; a great stair runs straight up the front to the high shrine, glazed in lapis blue under a
// gold frieze, where an astronomer-priest watches the sky beside the star of Shamash. Two date palms grow at its foot.
import { ellipse, line, mix, poly, shade, softShadow } from '../prims';
import type { Ctx } from '../prims';
import type { MechRender } from './types';

const BRICK = '#cfa46a';
const BITUMEN = '#5a4636';
const MADDER = '#b0583a';
const PALE = '#e2c28c';
const LAPIS = '#2a4fc8';
const GOLD = '#e8c060';
const DARK = '#2a1c14';

/** A point on the ground plan: u runs to the lower right, v to the lower left, h is height. */
const P = (x: number, y: number, u: number, v: number, h = 0): [number, number] => [x + (u - v), y + (u + v) / 2 - h];

/** A rectangular block centred on (u0, v0) of the plan, half-extents A along u and B along v, from height h0 up `h`. */
function slab(ctx: Ctx, x: number, y: number, u0: number, v0: number, A: number, B: number, h0: number, h: number, color: string, lid?: string) {
  const c = (u: number, v: number, z: number) => P(x, y, u0 + u, v0 + v, h0 + z);
  poly(ctx, [...c(-A, B, 0), ...c(A, B, 0), ...c(A, B, h), ...c(-A, B, h)], shade(color, 0.06)); // the lit front-left face
  poly(ctx, [...c(A, B, 0), ...c(A, -B, 0), ...c(A, -B, h), ...c(A, B, h)], shade(color, -0.24)); // the shaded front-right face
  poly(ctx, [...c(-A, -B, h), ...c(A, -B, h), ...c(A, B, h), ...c(-A, B, h)], lid ?? shade(color, 0.2));
  const e = c(-A, B, h), f = c(A, B, h), g = c(A, -B, h);
  line(ctx, e[0], e[1], f[0], f[1], shade(color, 0.36), 0.5);
  line(ctx, f[0], f[1], g[0], g[1], shade(color, 0.1), 0.5);
}

/** Buttresses, brick courses, reed-mat layers and weep holes on the two faces of a terrace. */
function terraceFaces(ctx: Ctx, x: number, y: number, u0: number, v0: number, A: number, B: number, h0: number, h: number, color: string, piers: number) {
  const c = (u: number, v: number, z: number) => P(x, y, u0 + u, v0 + v, h0 + z);
  for (const [face, len] of [['L', A], ['R', B]] as const) {
    const at = (t: number, z: number) => (face === 'L' ? c(-A + 2 * A * t, B, z) : c(A, B - 2 * B * t, z));
    const lit = face === 'L' ? shade(color, 0.16) : shade(color, -0.14);
    const sh = face === 'L' ? shade(color, -0.08) : shade(color, -0.36);
    for (let i = 1; i < piers; i++) { // shallow buttresses: a lit strip and a shadow beside it
      const t = i / piers, d = 0.5 / len;
      const a0 = at(t - d, 0), a1 = at(t + d, 0), b1 = at(t + d, h), b0 = at(t - d, h);
      poly(ctx, [...a0, ...a1, ...b1, ...b0], lit);
      const s0 = at(t + d, 0), s1 = at(t + d * 2.2, 0), s2 = at(t + d * 2.2, h), s3 = at(t + d, h);
      poly(ctx, [...s0, ...s1, ...s2, ...s3], sh);
    }
    for (const z of [h * 0.3, h * 0.62]) { const a = at(0, z), b = at(1, z); line(ctx, a[0], a[1], b[0], b[1], shade(color, -0.3), 0.35); } // reed-mat courses
    for (let i = 0; i < piers; i++) { const p = at((i + 0.5) / piers, h * 0.46); ellipse(ctx, p[0], p[1], 0.35, 0.45, DARK); } // weep holes
  }
}

/** A flight of steps from (vFoot, hFoot) up to (vTop, hTop) along the v axis, `w` wide either side of u = uc. */
function stair(ctx: Ctx, x: number, y: number, uc: number, w: number, vFoot: number, hFoot: number, vTop: number, hTop: number, color: string) {
  const a = P(x, y, uc - w, vFoot, hFoot), b = P(x, y, uc + w, vFoot, hFoot), c = P(x, y, uc + w, vTop, hTop), d = P(x, y, uc - w, vTop, hTop);
  // the stair's right flank, down to the ground line under it
  const bf = P(x, y, uc + w, vFoot, hFoot), cf = P(x, y, uc + w, vTop, hFoot);
  poly(ctx, [...bf, ...cf, ...c], shade(color, -0.3));
  poly(ctx, [...a, ...b, ...c, ...d], shade(color, 0.12));
  const n = Math.max(4, Math.round((hTop - hFoot) / 1.1));
  for (let i = 1; i < n; i++) { // the treads: a dark riser under a pale edge
    const t = i / n, v = vFoot + (vTop - vFoot) * t, h = hFoot + (hTop - hFoot) * t;
    const p = P(x, y, uc - w, v, h), q = P(x, y, uc + w, v, h);
    line(ctx, p[0], p[1] + 0.35, q[0], q[1] + 0.35, shade(color, -0.28), 0.45);
    line(ctx, p[0], p[1], q[0], q[1], shade(color, 0.32), 0.3);
  }
  // the parapets either side
  line(ctx, a[0], a[1], d[0], d[1], shade(color, -0.18), 0.8);
  line(ctx, b[0], b[1], c[0], c[1], shade(color, -0.35), 0.8);
}

/** A date palm: a straight trunk patterned with the diamond stubs of old leaf bases, stiff feathered fronds and hanging bunches of dates. */
export function datePalm(ctx: Ctx, x: number, y: number, k: number, variant = 0, green = '#4a8a40') {
  const lean = ((variant % 3) - 1) * 1.4 * k, h = (19 + (variant % 4)) * k;
  const tx = x + lean, ty = y - h;
  // the trunk, tapering, with a lit left edge
  poly(ctx, [x - 1.5 * k, y, x + 1.5 * k, y, tx + 1 * k, ty, tx - 1 * k, ty], '#8a6a44');
  poly(ctx, [x + 0.2 * k, y, x + 1.5 * k, y, tx + 1 * k, ty, tx + 0.1 * k, ty], '#6a4e30');
  const n = Math.round(h / (1.6 * k));
  for (let i = 1; i < n; i++) { // the criss-cross of old leaf bases
    const t = i / n, px = x + (tx - x) * t, py = y + (ty - y) * t, w = (1.5 - 0.5 * t) * k;
    line(ctx, px - w, py, px + w * 0.2, py - 1.1 * k, '#4a3420', 0.4 * k);
    line(ctx, px + w, py - 0.2 * k, px - w * 0.2, py - 1.1 * k, '#a8885a', 0.35 * k);
  }
  // a skirt of dead fronds hanging under the crown
  for (const d of [-1, -0.4, 0.4, 1]) line(ctx, tx, ty + 0.6 * k, tx + d * 3.2 * k, ty + 6 * k, '#9a7a4a', 0.7 * k);
  const leaf = shade(green, 0.04), leafL = mix(green, '#b8d070', 0.35), leafD = shade(green, -0.25);
  const frond = (a: number, len: number, c: string) => {
    const ex = tx + Math.cos(a) * len * k, ey = ty + Math.sin(a) * len * 0.7 * k + Math.max(0, Math.cos(a) ** 2) * len * 0.28 * k;
    const mx = tx + Math.cos(a) * len * 0.5 * k, my = ty + Math.sin(a) * len * 0.5 * k - 1.2 * k;
    ctx.strokeStyle = c;
    ctx.lineWidth = 0.7 * k;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();
    for (let i = 1; i < 8; i++) { // stiff leaflets in a V along the rib
      const t = i / 8, u = 1 - t;
      const px = u * u * tx + 2 * u * t * mx + t * t * ex, py = u * u * ty + 2 * u * t * my + t * t * ey;
      const l = (2.4 - t * 1.2) * k, n2 = a + Math.PI / 2;
      line(ctx, px, py, px + Math.cos(n2 - 0.5) * l, py + Math.sin(n2 - 0.5) * l * 0.6 - 0.5 * k, c, 0.45 * k);
      line(ctx, px, py, px - Math.cos(n2 + 0.5) * l, py - Math.sin(n2 + 0.5) * l * 0.6 - 0.5 * k, shade(c, -0.12), 0.45 * k);
    }
  };
  const fronds: [number, number, string][] = [
    [Math.PI + 0.35, 8, leafD], [-0.35, 8, leafD], [Math.PI - 0.1, 9, leaf], [0.1, 9, leaf], [Math.PI + 0.9, 8, leaf], [-0.9, 8, leaf],
    [-Math.PI / 2 - 0.35, 7, leafL], [-Math.PI / 2 + 0.35, 7, leafL], [Math.PI / 2 + 0.6, 6, leafD], [Math.PI / 2 - 0.6, 6, leafD],
  ];
  for (const [a, len, c] of fronds) frond(a, len, c);
  // bunches of dates on orange stalks, amber, ripening to red
  for (const [d, c] of [[-1, '#d8902a'], [1, '#b8441c'], [0.2, '#e8a83a']] as const) {
    if (d === 0.2 && variant % 2) continue;
    const bx = tx + d * 1.8 * k, by = ty + 2.6 * k;
    line(ctx, tx, ty + 0.6 * k, bx, by - 0.6 * k, '#e8a040', 0.5 * k);
    for (let i = 0; i < 5; i++) ellipse(ctx, bx + ((i % 3) - 1) * 0.7 * k, by + Math.floor(i / 3) * 0.9 * k, 0.6 * k, 0.7 * k, i % 2 ? shade(c, -0.15) : c);
  }
  ellipse(ctx, tx, ty, 1 * k, 0.8 * k, leafL);
}

/** The ziggurat standing on (x, y): about 24 world px from its centre to each corner of the bottom terrace. */
export function ziggurat(ctx: Ctx, x: number, y: number) {
  softShadow(ctx, x + 2, y + 3, 28, 12, 0.3);
  datePalm(ctx, ...P(x, y, -14, -4), 0.8, 1);
  datePalm(ctx, ...P(x, y, 2, -14), 0.72, 2);
  // the platform the tower stands on: a low brick kerb
  slab(ctx, x, y, 0, 0, 13, 13, 0, 1.2, shade(BRICK, -0.1));
  // terrace one: dark with bitumen
  const T1 = { A: 11, B: 11, h: 7 };
  slab(ctx, x, y, -0.5, -0.5, T1.A, T1.B, 1.2, T1.h, BITUMEN, shade(BITUMEN, 0.25));
  terraceFaces(ctx, x, y, -0.5, -0.5, T1.A, T1.B, 1.2, T1.h, BITUMEN, 5);
  stair(ctx, x, y, -0.5, 1.7, 15.2, 1.2, 10.5, 8.2, BRICK);
  // terrace two: madder red, set back
  slab(ctx, x, y, -1.5, -1.5, 7.4, 7.4, 8.2, 5.4, MADDER, shade(MADDER, 0.22));
  terraceFaces(ctx, x, y, -1.5, -1.5, 7.4, 7.4, 8.2, 5.4, MADDER, 4);
  stair(ctx, x, y, -0.5, 1.3, 9.8, 8.2, 5.9, 13.6, shade(BRICK, 0.08));
  // terrace three: pale brick
  slab(ctx, x, y, -2.3, -2.3, 4.6, 4.6, 13.6, 4.2, PALE, shade(PALE, 0.18));
  terraceFaces(ctx, x, y, -2.3, -2.3, 4.6, 4.6, 13.6, 4.2, PALE, 3);
  stair(ctx, x, y, -0.8, 1, 5.4, 13.6, 2.3, 17.8, shade(PALE, 0.08));
  // the high shrine: glazed in lapis blue, a gold frieze of rosettes, a dark door, gold horns at its corners
  const sh = { u: -2.6, v: -2.6, A: 2.8, B: 2.8, h0: 17.8, h: 5 };
  slab(ctx, x, y, sh.u, sh.v, sh.A, sh.B, sh.h0, sh.h, LAPIS, shade(LAPIS, 0.25));
  for (const z of [0.6, 4.2]) { // gold bands round the foot and the top
    const a = P(x, y, sh.u - sh.A, sh.v + sh.B, sh.h0 + z), b = P(x, y, sh.u + sh.A, sh.v + sh.B, sh.h0 + z), c = P(x, y, sh.u + sh.A, sh.v - sh.B, sh.h0 + z);
    line(ctx, a[0], a[1], b[0], b[1], GOLD, 0.7);
    line(ctx, b[0], b[1], c[0], c[1], shade(GOLD, -0.25), 0.7);
  }
  for (const t of [-0.55, 0.55]) { const p = P(x, y, sh.u + t * sh.A, sh.v + sh.B, sh.h0 + 3.2); ellipse(ctx, p[0], p[1], 0.55, 0.55, '#f4e8b0'); }
  for (const t of [-0.4, 0.4]) { const p = P(x, y, sh.u + sh.A, sh.v + t * sh.B, sh.h0 + 3.2); ellipse(ctx, p[0], p[1], 0.5, 0.5, shade(GOLD, -0.15)); }
  const dr = P(x, y, sh.u, sh.v + sh.B, sh.h0);
  poly(ctx, [dr[0] - 1.1, dr[1] - 0.55, dr[0] + 1.1, dr[1] + 0.55, dr[0] + 1.1, dr[1] - 2.6, dr[0], dr[1] - 3.6, dr[0] - 1.1, dr[1] - 3.2], DARK); // the arched door
  for (const [u, v] of [[-sh.A, sh.B], [sh.A, sh.B], [sh.A, -sh.B], [-sh.A, -sh.B]] as const) { // horns of divinity at the corners
    const p = P(x, y, sh.u + u, sh.v + v, sh.h0 + sh.h);
    poly(ctx, [p[0] - 0.6, p[1], p[0] + 0.6, p[1], p[0] + 0.2, p[1] - 1.8], GOLD);
  }
  // the star of Shamash on a pole, and an astronomer-priest in a white robe on the roof pointing at the sky
  const top = P(x, y, sh.u - 1, sh.v - 1, sh.h0 + sh.h);
  line(ctx, top[0], top[1], top[0], top[1] - 6, '#8a6a3a', 0.6);
  const sx = top[0], sy = top[1] - 7.4;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, r = i % 2 ? 1.4 : 2.4;
    poly(ctx, [sx, sy, sx + Math.cos(a - 0.3) * 0.8, sy + Math.sin(a - 0.3) * 0.8, sx + Math.cos(a) * r, sy + Math.sin(a) * r, sx + Math.cos(a + 0.3) * 0.8, sy + Math.sin(a + 0.3) * 0.8], i % 2 ? shade(GOLD, -0.15) : GOLD);
  }
  ellipse(ctx, sx, sy, 0.8, 0.8, '#fff4c0');
  const pr = P(x, y, sh.u + 1.2, sh.v + 1.4, sh.h0 + sh.h);
  poly(ctx, [pr[0] - 1.1, pr[1], pr[0] + 1.1, pr[1], pr[0] + 0.7, pr[1] - 3.4, pr[0] - 0.7, pr[1] - 3.4], '#f0e8d4'); // the robe
  poly(ctx, [pr[0] + 0.1, pr[1], pr[0] + 1.1, pr[1], pr[0] + 0.7, pr[1] - 3.4, pr[0] + 0.1, pr[1] - 3.4], '#c8bca4');
  ellipse(ctx, pr[0], pr[1] - 4.1, 0.75, 0.8, '#c99060');
  ellipse(ctx, pr[0] - 0.1, pr[1] - 4.7, 0.8, 0.45, LAPIS); // a blue fillet
  line(ctx, pr[0] + 0.6, pr[1] - 3, pr[0] + 1.6, pr[1] - 5.6, '#c99060', 0.45); // the pointing arm
  // a bronze brazier smoking on the first terrace, and one more palm in front
  const br = P(x, y, 7, 4, 8.2);
  ellipse(ctx, br[0], br[1] - 0.6, 1.1, 0.6, '#8a5a2a');
  line(ctx, br[0], br[1] - 1, br[0] + 0.8, br[1] - 5, 'rgba(200,200,200,0.45)', 0.8);
  datePalm(ctx, ...P(x, y, 15, 6), 0.68, 3);
}

export const render: MechRender = {
  tile(ctx, _s, t, cx, cy) {
    if (t.improvement !== 'ziggurat') return;
    ziggurat(ctx, cx, cy + 2);
  },
};

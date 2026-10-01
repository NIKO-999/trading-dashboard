// The Polish–Lithuanian Commonwealth: its own art (see render/tribeart).
// Sarmatian dress of the sixteenth and seventeenth centuries: a long żupan under a kontusz overcoat whose slit sleeves
// (wyloty) are thrown back over the shoulder, a woven silk sash (pas kontuszowy) in crimson and gold, the fur kołpak with
// a heron-feather plume in a jewelled clasp, shaved sides and long drooping moustaches; mail, scale (karacena) and the
// lobster-tailed szyszak for the heavy ranks; the curved karabela sabre with its eagle-head pommel, the bardiche, the
// Tatar bow and the painted pavise. The Winged Hussar rides an armoured horse in plate and a leopard skin, a long
// hollow lance with a red-and-white pennant in his hand and tall feathered wings on a wooden frame at his back.
// Brick towns with steep roofs and Polish attics around a market square and its town hall, wooden manors with
// columned porches, and Wawel: a castle on its hill with the gold dome of the royal chapel. Birch, oak and lime woods.
import { drawHorse, figure } from '../units';
import { registerArt } from '../tribeart';
import type { Body } from '../tribeart';
import type { BiomePalette } from '../../data/tribes';
import type { UnitKind } from '../../game/types';
import { band, box, ellipse, faceQuad, ink, line, mix, poly, rand, shade } from '../prims';
import type { Ctx } from '../prims';

const CRIMSON = '#a8203a', CRIMSON_D = '#6a1024', CRIMSON_L = '#d04058';
const GOLD = '#e2b443', GOLD_L = '#f6dc84', GOLD_D = '#9a7020';
const WHITE = '#f4f0e6';
const NAVY = '#2c3e7a', SKY = '#8ab4d8', YELLOW = '#e8c860', GREEN = '#3a6a42', HAJDUK = '#3e5a9a';
const STEEL = '#c2c8d0', STEEL_L = '#eef2f6', STEEL_D = '#6e7680', MAIL = '#8e949c';
const FUR = '#3a2a20', FUR_L = '#6a4a34';
const WOOD = '#7a5230', WOOD_D = '#4a3018', WOOD_L = '#a87a48';
const HAIR = '#6a4a2a', SKIN = '#f0caa6';
const BRICK = '#b0583a', BRICK_D = '#7a3420', BRICK_L = '#d07a54', PLASTER = '#f2ead8';
const COPPER = '#5aa088';

/** A curved stroke through three points. */
function curve(ctx: Ctx, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, w: number, c: string) {
  ctx.strokeStyle = ink(c);
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx, cy, x1, y1);
  ctx.stroke();
}

/** A point on one visible side of a box, in the (u, v) coordinates of faceQuad. */
function pt(face: 'L' | 'R', cx: number, cy: number, w: number, h: number, u: number, v: number): [number, number] {
  return face === 'R' ? [cx + (u * w) / 2, cy + (w / 4) * (1 - u) - v * h] : [cx - w / 2 + (u * w) / 2, cy + (w / 4) * u - v * h];
}

/** A flat polygon on one side of a box. */
function facePoly(ctx: Ctx, face: 'L' | 'R', x: number, y: number, w: number, h: number, pts: [number, number][], color: string) {
  poly(ctx, pts.flatMap(([u, v]) => pt(face, x, y, w, h, u, v)), color);
}

/** The White Eagle: a crowned eagle with spread wings, drawn small. */
function eagle(ctx: Ctx, cx: number, cy: number, s: number, c = WHITE, crown = GOLD) {
  for (const d of [-1, 1]) { // the wings, raised, with three feather tips each
    poly(ctx, [cx + d * 0.6 * s, cy - 0.8 * s, cx + d * 3.2 * s, cy - 2.8 * s, cx + d * 3.4 * s, cy - 1.4 * s, cx + d * 3 * s, cy - 0.6 * s, cx + d * 3.2 * s, cy + 0.4 * s, cx + d * 2.4 * s, cy + 0.6 * s, cx + d * 0.8 * s, cy + 0.8 * s], c);
  }
  ellipse(ctx, cx, cy, 0.9 * s, 1.5 * s, c); // the body
  poly(ctx, [cx - 0.9 * s, cy + 1 * s, cx + 0.9 * s, cy + 1 * s, cx + 1.4 * s, cy + 2.8 * s, cx, cy + 2.2 * s, cx - 1.4 * s, cy + 2.8 * s], c); // the tail
  for (const d of [-1, 1]) line(ctx, cx + d * 0.6 * s, cy + 1.2 * s, cx + d * 1.4 * s, cy + 2 * s, crown, 0.35 * s); // golden talons
  ellipse(ctx, cx + 0.2 * s, cy - 1.9 * s, 0.6 * s, 0.6 * s, c); // the head, turned to the right
  poly(ctx, [cx + 0.6 * s, cy - 2 * s, cx + 1.3 * s, cy - 1.8 * s, cx + 0.6 * s, cy - 1.5 * s], crown); // the beak
  poly(ctx, [cx - 0.5 * s, cy - 2.5 * s, cx - 0.4 * s, cy - 3.3 * s, cx, cy - 2.9 * s, cx + 0.3 * s, cy - 3.4 * s, cx + 0.6 * s, cy - 2.9 * s, cx + 0.9 * s, cy - 3.3 * s, cx + 0.9 * s, cy - 2.5 * s], crown); // the crown
}

/** A swallow-tailed pennant flying from (x, y): red over white (the colours of the Commonwealth), `L` long, `h` deep. */
function pennant(ctx: Ctx, x: number, y: number, L: number, h: number, wave = 1) {
  const w = (t: number) => Math.sin(t * 5 + 0.6) * wave * t;
  const top = (t: number): [number, number] => [x + L * t, y + w(t) + t * h * 0.15];
  const mid = (t: number): [number, number] => [x + L * t, y + h / 2 + w(t) + t * h * 0.3];
  const bot = (t: number): [number, number] => [x + L * t, y + h + w(t) + t * h * 0.45];
  const N = 8, cut = 0.68; // the swallow tail is cut back to 68% of the length along the middle
  const red: number[] = [], white: number[] = [];
  for (let i = 0; i <= N; i++) red.push(...top(i / N));
  for (let i = N; i >= 0; i--) red.push(...mid((i / N) * cut));
  for (let i = 0; i <= N; i++) white.push(...mid((i / N) * cut));
  for (let i = N; i >= 0; i--) white.push(...bot(i / N));
  poly(ctx, red, CRIMSON_L);
  poly(ctx, white, WHITE);
  line(ctx, ...mid(0), ...mid(cut), 'rgba(0,0,0,0.12)', 0.3);
  line(ctx, ...top(0), ...top(0.4), shade(CRIMSON_L, 0.3), 0.4);
}

// ---------------------------------------------------------------- dress

const MAIL_KINDS: UnitKind[] = ['defender', 'knight'];
const SCALE_KINDS: UnitKind[] = ['swordsman', 'giant'];
const PLATE_KINDS: UnitKind[] = ['wingedhussar'];

/** [torso, legs, sleeves]: a kontusz over a żupan for the gentry, the hajduk's blue coat, mail, scale or plate for the heavy ranks. */
function dress(kind: UnitKind): [string, string, string] | null {
  switch (kind) {
    case 'warrior': return [HAJDUK, shade(HAJDUK, -0.2), HAJDUK];
    case 'archer': return [CRIMSON, YELLOW, YELLOW];
    case 'rider': return [NAVY, CRIMSON, CRIMSON];
    case 'explorer': return ['#7a6a4a', '#5a4a3a', '#c8b890'];
    case 'defender': return [MAIL, NAVY, MAIL];
    case 'knight': return [MAIL, CRIMSON_D, MAIL];
    case 'swordsman': return [STEEL, CRIMSON, MAIL];
    case 'giant': return [GOLD, CRIMSON, CRIMSON];
    case 'wingedhussar': return [STEEL, CRIMSON, STEEL];
    default: return [CRIMSON, NAVY, SKY];
  }
}

/** The żupan showing at the front opening of the kontusz, and the colour of the kontusz itself. */
const COATS: Partial<Record<UnitKind, { coat: string; zupan: string; sash: string }>> = {
  warrior: { coat: HAJDUK, zupan: shade(HAJDUK, -0.12), sash: CRIMSON },
  archer: { coat: CRIMSON, zupan: YELLOW, sash: GOLD },
  rider: { coat: NAVY, zupan: CRIMSON, sash: GOLD },
  explorer: { coat: '#7a6a4a', zupan: '#c8b890', sash: CRIMSON },
};

/** Rows of mail rings over a box between heights v0 and v1. */
function mail(ctx: Ctx, x: number, y: number, w: number, h: number, v0: number, v1: number, base: string, rows = 6) {
  band(ctx, x, y, w, h, v0, v1, base);
  const dv = (v1 - v0) / rows, s = w / 10;
  for (let r = 0; r < rows; r++) {
    const v = v0 + (r + 0.5) * dv;
    for (let i = 0; i < 6; i++) {
      const u = (i + 0.25 + (r % 2) * 0.5) / 6.2;
      for (const f of ['L', 'R'] as const) {
        const [px, py] = pt(f, x, y, w, h, u, v);
        ellipse(ctx, px, py + 0.25 * s, 0.42 * s, 0.3 * s, shade(base, f === 'L' ? -0.3 : -0.45));
        ellipse(ctx, px, py - 0.1 * s, 0.32 * s, 0.22 * s, shade(base, f === 'L' ? 0.4 : 0.15));
      }
    }
  }
}

/** Karacena: overlapping scales like a fish's, each with a lit edge and a rivet. */
function scales(ctx: Ctx, x: number, y: number, w: number, h: number, v0: number, v1: number, metal: string, rows = 5) {
  band(ctx, x, y, w, h, v0, v1, shade(metal, -0.3));
  const dv = (v1 - v0) / rows, s = w / 10;
  for (let r = rows - 1; r >= 0; r--) { // from the top down, so each lower row overlaps the one above
    const v = v0 + (r + 0.6) * dv;
    for (let i = 0; i < 5; i++) {
      const u = (i + 0.5 + (r % 2) * 0.5) / 5.4;
      for (const f of ['L', 'R'] as const) {
        const [px, py] = pt(f, x, y, w, h, u, v);
        ellipse(ctx, px, py + 0.4 * s, 0.95 * s, 0.85 * s, shade(metal, f === 'L' ? -0.25 : -0.42));
        ellipse(ctx, px, py, 0.9 * s, 0.75 * s, shade(metal, f === 'L' ? 0.08 : -0.18));
        ellipse(ctx, px - 0.25 * s, py - 0.25 * s, 0.4 * s, 0.25 * s, shade(metal, 0.45));
      }
    }
  }
}

/** The pas kontuszowy: a broad silk sash in bands of crimson and gold, knotted with fringed ends hanging at the front. */
function sash(ctx: Ctx, x: number, y: number, w: number, h: number, k: number, main: string, ends = true) {
  const other = main === GOLD ? CRIMSON : GOLD;
  band(ctx, x, y, w, h, 0.26, 0.42, main);
  band(ctx, x, y, w, h, 0.29, 0.31, other);
  band(ctx, x, y, w, h, 0.37, 0.39, other);
  band(ctx, x, y, w, h, 0.335, 0.345, shade(main, 0.35));
  if (!ends) return;
  const [kx, ky] = pt('R', x, y, w, h, 0.2, 0.32);
  poly(ctx, [kx - 0.6 * k, ky, kx + 1 * k, ky + 0.3 * k, kx + 0.8 * k, ky + 5 * k, kx - 0.8 * k, ky + 4.6 * k], main);
  poly(ctx, [kx + 1 * k, ky + 0.3 * k, kx + 2.2 * k, ky + 0.2 * k, kx + 2.2 * k, ky + 4.2 * k, kx + 0.8 * k, ky + 4.4 * k], shade(main, -0.2));
  for (const t of [0.35, 0.7]) line(ctx, kx - 0.6 * k, ky + 5 * t * k, kx + 2.2 * k, ky + 4.4 * t * k, other, 0.45 * k); // woven bands across the ends
  for (let i = 0; i < 5; i++) line(ctx, kx - 0.7 * k + i * 0.7 * k, ky + 4.7 * k - i * 0.1 * k, kx - 0.8 * k + i * 0.72 * k, ky + 6.2 * k - i * 0.1 * k, i % 2 ? other : shade(main, 0.2), 0.32 * k); // the fringe
}

function torso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const k = w / 10;
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const B = (v0: number, v1: number, c: string) => band(ctx, x, y, w, h, v0, v1, c);
  if (PLATE_KINDS.includes(kind)) { // a hussar's breastplate: a ridged cuirass over a mail shirt, gilt rivets and a skirt of lames
    for (let i = 0; i < 3; i++) { // the tassets: steel lames over the hips
      B(-0.32 + i * 0.12, -0.22 + i * 0.12, shade(STEEL, -0.08 - i * 0.04));
      B(-0.24 + i * 0.12, -0.22 + i * 0.12, shade(STEEL, 0.35));
      for (const u of [0.15, 0.5, 0.85]) { const [rx, ry] = pt('R', x, y, w, h, u, -0.27 + i * 0.12); ellipse(ctx, rx, ry, 0.35 * k, 0.35 * k, GOLD); }
    }
    B(0, 1, STEEL);
    faceQuad(ctx, 'L', x, y, w, h, 0.5, 1, 0.1, 0.95, shade(STEEL, 0.2)); // the lit flank
    facePoly(ctx, 'R', x, y, w, h, [[0, 0.95], [0.12, 0.95], [0.18, 0.1], [0, 0.1]], shade(STEEL, 0.25)); // the ridge down the front, lit on one side
    line(ctx, ...pt('R', x, y, w, h, 0.02, 0.95), ...pt('R', x, y, w, h, 0.02, 0.05), STEEL_L, 0.6 * k);
    for (const v of [0.08, 0.92]) B(v - 0.04, v + 0.03, GOLD); // gilt edging top and bottom
    for (const u of [0.12, 0.35, 0.6, 0.85]) for (const v of [0.08, 0.92]) { const [rx, ry] = pt('R', x, y, w, h, u, v); ellipse(ctx, rx, ry, 0.36 * k, 0.36 * k, GOLD_L); }
    const [cx, cy] = pt('R', x, y, w, h, 0.45, 0.55); // a gilt cross (the Virgin's) embossed on the breast
    line(ctx, cx, cy - 1.8 * k, cx, cy + 1.6 * k, GOLD, 0.6 * k);
    line(ctx, cx - 1.1 * k, cy - 0.4 * k, cx + 1.1 * k, cy - 0.9 * k, GOLD, 0.6 * k);
    B(0.95, 1, MAIL); // the mail collar
    return;
  }
  if (SCALE_KINDS.includes(kind)) { // karacena: a coat of scales, with a gilt breast-sun
    const metal = kind === 'giant' ? GOLD : STEEL;
    B(-0.3, 0.02, CRIMSON); // the żupan's skirt below
    B(-0.3, -0.24, GOLD);
    scales(ctx, x, y, w, h, 0, 0.92, metal, 5);
    sash(ctx, x, y, w, h, k, kind === 'giant' ? CRIMSON : GOLD);
    const [sx, sy] = pt('R', x, y, w, h, 0.5, 0.68);
    ellipse(ctx, sx, sy, 1.4 * k, 1.4 * k, GOLD_D);
    ellipse(ctx, sx, sy, 1 * k, 1 * k, GOLD_L);
    B(0.92, 1, CRIMSON); // the collar
    return;
  }
  if (MAIL_KINDS.includes(kind)) { // a mail shirt over a long żupan
    const under = kind === 'knight' ? CRIMSON : NAVY;
    B(-0.4, 0.2, under);
    B(-0.4, -0.34, GOLD);
    mail(ctx, x, y, w, h, 0.16, 0.92, MAIL, 6);
    B(0.14, 0.2, shade(MAIL, -0.35));
    sash(ctx, x, y, w, h, k, kind === 'knight' ? GOLD : CRIMSON);
    B(0.92, 1, under);
    return;
  }
  const c = COATS[kind] ?? { coat: dress(kind)?.[0] ?? CRIMSON, zupan: SKY, sash: GOLD };
  // the long kontusz skirt falling to the calf, flaring a little
  for (const f of ['L', 'R'] as const) facePoly(ctx, f, x, y, w, h, [[-0.04, -0.6], [1.04, -0.6], [1, 0.05], [0, 0.05]], f === 'L' ? shade(c.coat, 0.04) : shade(c.coat, -0.2));
  for (const u of [0.3, 0.7]) faceQuad(ctx, 'L', x, y, w, h, u, u + 0.03, -0.58, 0, shade(c.coat, -0.22)); // folds
  // the front opening: the żupan shows from the collar to the hem, closed by a row of little buttons
  facePoly(ctx, 'R', x, y, w, h, [[0.44, 1], [0.66, 1], [0.7, -0.6], [0.4, -0.6]], shade(c.zupan, -0.12));
  for (const v of [0.84, 0.7, 0.56, 0.16, 0.02]) { const [bx, by] = pt('R', x, y, w, h, 0.55, v); ellipse(ctx, bx, by, 0.36 * k, 0.36 * k, kind === 'warrior' ? '#d8d0b8' : GOLD_L); }
  R(0.4, 0.44, -0.6, 1, shade(c.coat, -0.35)); // the kontusz's edges either side of the opening
  R(0.66, 0.7, -0.6, 1, shade(c.coat, 0.2));
  if (kind === 'warrior') { // a hajduk's coat: frogging (braided loops) across the chest
    for (const v of [0.56, 0.68, 0.8]) { R(0.1, 0.42, v, v + 0.03, '#d8d0b8'); R(0.68, 0.94, v, v + 0.03, '#d8d0b8'); }
  }
  sash(ctx, x, y, w, h, k, c.sash);
  B(0.9, 1, c.zupan); // the żupan's standing collar
  B(0.9, 0.93, shade(c.zupan, -0.3));
  // the kontusz's slit sleeve (wylot), thrown back over the shoulder and hanging behind the arm, lined in a bright silk
  const sx = x - w / 2 - 0.4 * k, sy = y - h * 0.92;
  poly(ctx, [sx + 0.6 * k, sy, sx + 2.2 * k, sy + 0.4 * k, sx - 0.4 * k, sy + 12.4 * k, sx - 2.4 * k, sy + 11.6 * k], c.coat);
  poly(ctx, [sx + 0.6 * k, sy, sx - 0.4 * k, sy + 0.6 * k, sx - 2.4 * k, sy + 11.6 * k, sx - 1.4 * k, sy + 11.2 * k], kind === 'archer' ? SKY : kind === 'rider' ? YELLOW : CRIMSON_L);
  line(ctx, sx - 2.4 * k, sy + 11.6 * k, sx - 0.4 * k, sy + 12.4 * k, GOLD, 0.4 * k);
}

/** Long drooping moustaches, a shaven chin and ruddy cheeks; the elders' are grey. */
function face(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  const hair = kind === 'giant' || kind === 'explorer' ? '#b8b0a0' : HAIR;
  R(0.06, 0.22, 0.3, 0.4, '#e8a090'); R(0.78, 0.94, 0.3, 0.4, '#e8a090'); // ruddy cheeks
  R(0.22, 0.78, 0.22, 0.28, hair); // the moustache, full across the lip
  facePoly(ctx, 'R', x, y, w, h, [[0.22, 0.28], [0.32, 0.26], [0.2, -0.06], [0.12, -0.1]], shade(hair, -0.12)); // its long ends, drooping past the chin
  facePoly(ctx, 'R', x, y, w, h, [[0.68, 0.26], [0.78, 0.28], [0.88, -0.1], [0.8, -0.06]], shade(hair, -0.12));
  R(0.3, 0.46, 0.25, 0.27, shade(hair, 0.3));
  R(0.38, 0.62, 0.14, 0.18, '#c07060'); // the lip
  R(0.3, 0.42, 0.62, 0.66, shade(hair, -0.1)); R(0.58, 0.7, 0.62, 0.66, shade(hair, -0.1)); // heavy brows
}

// ---------------------------------------------------------------- headgear

/** The kołpak: a tall cylinder of fur with a coloured cloth crown, a jewelled clasp at the front and a heron-feather plume. */
function kolpak(ctx: Ctx, x: number, top: number, k: number, hw: number, cloth: string, fur: string, plume: boolean, tall = 5.4) {
  const yb = top + 2.4 * k, fw = hw + 1.6 * k;
  ellipse(ctx, x + 0.6 * k, yb - tall * k + 0.2 * k, fw * 0.42, fw * 0.24, cloth); // the cloth crown, puffed over the fur
  ellipse(ctx, x + 0.2 * k, yb - tall * k - 0.3 * k, fw * 0.36, fw * 0.2, shade(cloth, 0.2));
  box(ctx, x, yb, fw, tall * k, fur, shade(fur, 0.1));
  for (const u of [0.1, 0.32, 0.55, 0.78]) { // the fur's long nap
    faceQuad(ctx, 'R', x, yb, fw, tall * k, u, u + 0.05, 0.1, 0.95, shade(fur, 0.22));
    faceQuad(ctx, 'L', x, yb, fw, tall * k, u + 0.04, u + 0.09, 0.1, 0.9, shade(fur, 0.18));
  }
  band(ctx, x, yb, fw, tall * k, 0, 0.12, shade(fur, -0.3));
  // the front slit, and over it the clasp: a gold setting with a ruby, holding the plume
  const [cx, cy] = pt('R', x, yb, fw, tall * k, 0.32, 0.55);
  line(ctx, cx, cy + 2 * k, cx, cy - 2.4 * k, shade(fur, -0.4), 0.5 * k);
  if (!plume) return;
  ellipse(ctx, cx, cy, 1.1 * k, 1.1 * k, GOLD_D);
  ellipse(ctx, cx, cy, 0.8 * k, 0.8 * k, GOLD);
  ellipse(ctx, cx, cy, 0.45 * k, 0.45 * k, '#c01830');
  for (let i = 0; i < 5; i++) { // the heron feathers (czapla): fine plumes, white with dark tips, rising and sweeping back
    const ex = cx - (1.5 + i * 1.3) * k, ey = cy - (9.5 - i * 0.7) * k;
    curve(ctx, cx, cy - 0.6 * k, cx + (0.6 - i * 0.3) * k, cy - 6 * k, ex, ey, 0.55 * k, i % 2 ? '#e8e4dc' : '#fbfaf6');
    ellipse(ctx, ex, ey, 0.32 * k, 0.28 * k, '#5a5a62');
  }
}

/** Shaved sides and back (the podgolony cut), the hair left only on the crown in a forelock (czupryna). */
function shaved(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const hh = 10.5 * k, y = top + hh;
  const stub = mix(SKIN, '#8a7a70', 0.28);
  faceQuad(ctx, 'L', x, y, hw, hh, 0, 0.62, 0.42, 1, stub); // the shaven side and back
  poly(ctx, [x, top - hw / 4, x + hw / 2, top, x, top + hw / 4, x - hw / 2, top], stub); // the shaven scalp
  ellipse(ctx, x + 0.8 * k, top + 0.2 * k, hw * 0.22, hw * 0.12, shade(HAIR, -0.1)); // the forelock on the crown
  curve(ctx, x + 1 * k, top + 0.2 * k, x + 4 * k, top - 0.4 * k, x + 4.4 * k, top + 3 * k, 1.1 * k, HAIR);
  curve(ctx, x + 0.4 * k, top, x + 2.6 * k, top - 0.6 * k, x + 3.4 * k, top + 1.8 * k, 0.4 * k, shade(HAIR, 0.3));
}

/** The szyszak: a fluted round bowl with a peak and a sliding nasal bar, cheek-pieces and a lobster tail of lames down the neck. */
function szyszak(ctx: Ctx, x: number, top: number, k: number, hw: number, metal: string, gilt: boolean, plume?: string) {
  const yb = top + 2 * k, rx = hw / 2 + 0.8 * k, ry = 5.2 * k;
  // the lobster tail: four lames stepping down the back of the neck, behind the head
  for (let i = 0; i < 4; i++) {
    const lx = x - hw / 2 - 0.6 * k - i * 0.5 * k, ly = yb + 0.6 * k + i * 2.1 * k;
    poly(ctx, [lx, ly, lx + 4.6 * k, ly + 1.2 * k, lx + 4.4 * k, ly + 3.2 * k, lx - 0.6 * k, ly + 2.2 * k], shade(metal, -0.12 - i * 0.04));
    line(ctx, lx - 0.6 * k, ly + 2.2 * k, lx + 4.4 * k, ly + 3.2 * k, gilt ? GOLD : shade(metal, 0.35), 0.45 * k);
  }
  // the cheek-piece on the near side, hanging from the brim, pierced with a little heart
  const [chx, chy] = [x + hw * 0.28, yb + 2.2 * k];
  poly(ctx, [chx - 1.6 * k, chy - 1.6 * k, chx + 2 * k, chy - 0.8 * k, chx + 1.6 * k, chy + 4.4 * k, chx - 0.2 * k, chy + 5.4 * k, chx - 1.6 * k, chy + 3.8 * k], shade(metal, -0.1));
  ellipse(ctx, chx, chy + 1.8 * k, 0.5 * k, 0.5 * k, '#2a2a30');
  if (gilt) line(ctx, chx - 1.6 * k, chy + 3.8 * k, chx - 0.2 * k, chy + 5.4 * k, GOLD, 0.4 * k);
  // the bowl: a half dome, lit on the left
  ctx.beginPath();
  ctx.ellipse(x, yb, rx, ry, 0, Math.PI, 0);
  ctx.lineTo(x + rx, yb + 0.8 * k);
  ctx.quadraticCurveTo(x, yb + rx * 0.5, x - rx, yb + 0.8 * k);
  ctx.closePath();
  ctx.fillStyle = ink(shade(metal, -0.08));
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, yb, rx, ry, 0, Math.PI, Math.PI * 1.5);
  ctx.lineTo(x, yb + rx * 0.3);
  ctx.closePath();
  ctx.fillStyle = ink(shade(metal, 0.16));
  ctx.fill();
  for (const a of [-0.55, -0.2, 0.2, 0.55]) curve(ctx, x + a * rx * 1.6, yb + 0.4 * k, x + a * rx * 1.1, yb - ry * 0.8, x, yb - ry + 0.2 * k, 0.4 * k, gilt ? GOLD : shade(metal, -0.3)); // the flutes
  ellipse(ctx, x - rx * 0.4, yb - ry * 0.55, 0.8 * k, 1.6 * k, 'rgba(255,255,255,0.5)');
  band(ctx, x, yb + 0.9 * k, hw + 1.4 * k, 1.1 * k, 0, 1, gilt ? GOLD : shade(metal, -0.2)); // the brow band
  // the peak, jutting forward over the eyes, and the nasal bar sliding through it
  poly(ctx, [x + 0.4 * k, yb + 0.4 * k, x + rx + 1.2 * k, yb + 1.6 * k, x + rx + 0.4 * k, yb + 2.6 * k, x + 0.6 * k, yb + 1.8 * k], shade(metal, 0.05));
  line(ctx, x + rx * 0.62, yb - 2.4 * k, x + rx * 0.62, yb + 6.6 * k, gilt ? GOLD : STEEL_L, 0.8 * k);
  ellipse(ctx, x + rx * 0.62, yb + 6.8 * k, 0.6 * k, 0.5 * k, gilt ? GOLD : STEEL_L);
  // the finial, with a plume holder
  ellipse(ctx, x, yb - ry - 0.4 * k, 0.8 * k, 0.8 * k, gilt ? GOLD : metal);
  if (plume) for (let i = 0; i < 4; i++) curve(ctx, x, yb - ry - 0.8 * k, x - (1 + i) * k, yb - ry - 5 * k, x - (3 + i * 1.4) * k, yb - ry - (5.4 - i * 0.9) * k, 0.8 * k, i % 2 ? shade(plume, -0.15) : plume);
}

/** The misiurka: a small steel cap with a curtain of mail hanging all round, worn by the pancerni. */
function misiurka(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const yb = top + 2.2 * k;
  poly(ctx, [x - hw / 2 - 1 * k, yb, x - hw / 2 - 0.4 * k, yb + 8.6 * k, x + 0.4 * k, yb + 10.4 * k, x - 0.4 * k, yb + 2 * k], shade(MAIL, -0.2)); // the mail down the side and back
  for (let r = 0; r < 4; r++) for (let i = 0; i < 3; i++) ellipse(ctx, x - hw / 2 + i * 1.6 * k + (r % 2) * 0.7 * k, yb + 1.6 * k + r * 2 * k + i * 0.6 * k, 0.34 * k, 0.26 * k, shade(MAIL, 0.35));
  ctx.beginPath();
  ctx.ellipse(x, yb, hw / 2 + 0.2 * k, 3.4 * k, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = ink(STEEL);
  ctx.fill();
  ellipse(ctx, x - 1.4 * k, yb - 1.6 * k, 1 * k, 0.8 * k, 'rgba(255,255,255,0.5)');
  ellipse(ctx, x, yb - 3.4 * k, 0.6 * k, 0.6 * k, GOLD);
  band(ctx, x, yb + 0.6 * k, hw + 0.6 * k, 0.8 * k, 0, 1, GOLD_D);
}

function head(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  switch (kind) {
    case 'warrior': return shaved(ctx, x, top, k, hw);
    case 'archer': return kolpak(ctx, x, top, k, hw, CRIMSON, FUR, true);
    case 'rider': return kolpak(ctx, x, top, k, hw, CRIMSON, FUR_L, true, 4.8);
    case 'explorer': return kolpak(ctx, x, top, k, hw, GREEN, FUR_L, false, 4.4);
    case 'defender': return szyszak(ctx, x, top, k, hw, '#9aa2ac', false);
    case 'swordsman': return szyszak(ctx, x, top, k, hw, STEEL, true, WHITE);
    case 'knight': return misiurka(ctx, x, top, k, hw);
    case 'wingedhussar': return szyszak(ctx, x, top, k, hw, STEEL, true);
    case 'giant': // the hetman: a sable kołpak with a great heron plume and a jewelled clasp
      return kolpak(ctx, x, top, k, hw, CRIMSON, '#2a1e18', true, 6.2);
    default: return kolpak(ctx, x, top, k, hw, CRIMSON, FUR, false, 4.6);
  }
}

// ---------------------------------------------------------------- weapons

/** The karabela: a curved sabre with short quillons and the open eagle-head pommel bent forward. */
function karabela(ctx: Ctx, x: number, y: number, k: number, gilt = true) {
  const hx = x, hy = y + 0.4 * k, tx = x + 10.4 * k, ty = y - 14 * k;
  for (const [c, wd, dx] of [[STEEL_D, 2.2, 0.5], [STEEL, 1.4, 0], [STEEL_L, 0.45, -0.45]] as const) curve(ctx, hx + dx * k, hy - 2 * k, x + 1 * k + dx * k, y - 10 * k, tx + dx * k, ty, wd * k, c);
  line(ctx, hx - 2.4 * k, hy - 1.2 * k, hx + 2.2 * k, hy - 2.6 * k, gilt ? GOLD : STEEL_D, 0.9 * k); // the cross-guard
  ellipse(ctx, hx - 2.4 * k, hy - 1.2 * k, 0.5 * k, 0.5 * k, gilt ? GOLD_L : STEEL);
  line(ctx, hx, hy - 1.8 * k, hx - 0.6 * k, hy + 2.2 * k, gilt ? CRIMSON_D : '#3a2418', 1.4 * k); // the grip
  // the pommel: bent sharply forward like an eagle's head
  line(ctx, hx - 0.6 * k, hy + 2.2 * k, hx + 1.2 * k, hy + 3 * k, gilt ? GOLD : STEEL_D, 1.2 * k);
  ellipse(ctx, hx + 1.4 * k, hy + 3.1 * k, 0.5 * k, 0.5 * k, gilt ? GOLD_L : STEEL);
}

/** The bardiche (berdysz): a long crescent axe blade on a tall haft, the hajduk's arm. */
function berdysz(ctx: Ctx, x: number, y: number, k: number) {
  const x0 = x - 1.4 * k, y0 = y + 6 * k, x1 = x + 2.6 * k, y1 = y - 22 * k;
  line(ctx, x0, y0, x1, y1, WOOD, 1.3 * k);
  line(ctx, x0 - 0.35 * k, y0, x1 - 0.35 * k, y1, shade(WOOD, 0.4), 0.35 * k);
  // the blade: a long crescent fixed at two points along the haft, its lower tail tied on
  const p = (t: number): [number, number] => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
  const [ax, ay] = p(0.62), [bx, by] = p(1);
  const blade = [ax, ay, ax + 3 * k, ay - 1 * k, bx + 5.6 * k, by + 2 * k, bx + 4.6 * k, by - 3.4 * k, bx + 1.6 * k, by - 4.2 * k, bx, by + 0.6 * k];
  poly(ctx, blade, STEEL_D);
  poly(ctx, [ax + 0.6 * k, ay - 0.6 * k, ax + 2.8 * k, ay - 1.4 * k, bx + 4.4 * k, by + 1.2 * k, bx + 3.4 * k, by - 3 * k, bx + 1 * k, by - 3 * k, bx + 0.2 * k, by + 0.4 * k], STEEL);
  curve(ctx, ax + 3 * k, ay - 1 * k, bx + 6.4 * k, (ay + by) / 2, bx + 4.6 * k, by - 3.4 * k, 0.45 * k, STEEL_L); // the edge
  for (const t of [0.6, 0.66]) { const [px, py] = p(t); line(ctx, px - 0.8 * k, py, px + 0.8 * k, py - 0.3 * k, CRIMSON, 0.6 * k); }
  ellipse(ctx, x0 + 0.2 * k, y0, 0.7 * k, 0.5 * k, STEEL_D); // the iron butt
}

/** A Tatar-style recurve bow with an arrow on the string. */
function bow(ctx: Ctx, x: number, y: number, k: number) {
  const bx = x - 3.4 * k, top = { x: bx + 2.4 * k, y: y - 13.6 * k }, bot = { x: bx + 2.4 * k, y: y + 10.4 * k }, ctl = { x: bx + 10.4 * k, y: y - 1.6 * k };
  const nock = { x: bx - 3 * k, y: y - 1.6 * k };
  for (const [c, wd, dx] of [['#2a1810', 2, 0], [CRIMSON_D, 1.2, -0.35], [GOLD, 0.35, -0.7]] as const) curve(ctx, top.x + dx * k, top.y, ctl.x + dx * k, ctl.y, bot.x + dx * k, bot.y, wd * k, c);
  line(ctx, top.x, top.y, top.x + 1.6 * k, top.y - 2.2 * k, '#e8dcc0', 1 * k); // the bone ears
  line(ctx, bot.x, bot.y, bot.x + 1.6 * k, bot.y + 2.2 * k, '#e8dcc0', 1 * k);
  ctx.strokeStyle = ink('#e8e0c8');
  ctx.lineWidth = 0.4 * k;
  ctx.beginPath();
  ctx.moveTo(top.x + 1.6 * k, top.y - 2.2 * k);
  ctx.lineTo(nock.x, nock.y);
  ctx.lineTo(bot.x + 1.6 * k, bot.y + 2.2 * k);
  ctx.stroke();
  const tx = x + 9.4 * k, ty = y - 3.6 * k;
  line(ctx, nock.x, nock.y, tx, ty, '#c9a06a', 0.7 * k);
  poly(ctx, [tx, ty - 1 * k, tx + 3 * k, ty + 0.2 * k, tx, ty + 1 * k], STEEL_D);
  for (const t of [0.05, 0.13]) { const px = nock.x + (tx - nock.x) * t, py = nock.y + (ty - nock.y) * t; poly(ctx, [px, py, px + 2.2 * k, py - 1.6 * k, px + 2.6 * k, py - 0.4 * k], t < 0.1 ? WHITE : CRIMSON); }
}

/** The saadak: an embroidered quiver and bow case hung at the hip. */
function saadak(ctx: Ctx, x: number, y: number, k: number) {
  poly(ctx, [x - 1.6 * k, y - 1 * k, x + 1.8 * k, y - 0.2 * k, x + 1.2 * k, y + 7 * k, x - 1.8 * k, y + 6.4 * k], CRIMSON_D);
  poly(ctx, [x - 1 * k, y + 0.4 * k, x + 1.2 * k, y + 0.8 * k, x + 0.8 * k, y + 5.6 * k, x - 1.2 * k, y + 5.2 * k], CRIMSON);
  for (const v of [1.6, 3.2, 4.8]) ellipse(ctx, x, y + v * k, 0.45 * k, 0.45 * k, GOLD_L);
  for (const i of [-1, 0, 1]) { line(ctx, x + i * 0.6 * k, y - 1 * k, x + i * 0.8 * k - 1 * k, y - 4.4 * k, '#c9b58a', 0.5 * k); poly(ctx, [x + i * 0.8 * k - 1 * k, y - 4.4 * k, x + i * 0.8 * k - 1.8 * k, y - 6 * k, x + i * 0.8 * k - 0.4 * k, y - 5.2 * k], i ? WHITE : CRIMSON); }
}

/** A long spear (spisa) with a slim blade and a red tassel. */
function spear(ctx: Ctx, x: number, y: number, k: number, len = 30) {
  const x0 = x - 1.8 * k, y0 = y + 6.2 * k, x1 = x + 3 * k, y1 = y + (6.2 - len) * k;
  line(ctx, x0, y0, x1, y1, WOOD, 1.3 * k);
  line(ctx, x0 - 0.4 * k, y0, x1 - 0.4 * k, y1, shade(WOOD, 0.4), 0.35 * k);
  poly(ctx, [x1 + 0.5 * k, y1 - 6.6 * k, x1 - 1 * k, y1 - 1.6 * k, x1, y1], shade(STEEL, 0.15));
  poly(ctx, [x1 + 0.5 * k, y1 - 6.6 * k, x1 + 1.6 * k, y1 - 1.6 * k, x1, y1], STEEL_D);
  for (let i = -1; i <= 1; i++) line(ctx, x1, y1 + 0.4 * k, x1 + i * 0.6 * k - 0.4 * k, y1 + 3 * k, CRIMSON, 0.5 * k);
}

/** The buława: the hetman's mace of office, a gilt ball-head set with stones. */
function bulawa(ctx: Ctx, x: number, y: number, k: number) {
  const x0 = x - 0.4 * k, y0 = y + 3 * k, x1 = x + 3.6 * k, y1 = y - 11 * k;
  line(ctx, x0, y0, x1, y1, GOLD_D, 1.4 * k);
  for (const t of [0.2, 0.4, 0.6]) { const px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t; line(ctx, px - 0.8 * k, py, px + 0.8 * k, py - 0.3 * k, GOLD_L, 0.5 * k); }
  ellipse(ctx, x1 + 0.4 * k, y1 - 2 * k, 3 * k, 3.1 * k, GOLD_D);
  ellipse(ctx, x1, y1 - 2.4 * k, 2.4 * k, 2.5 * k, GOLD);
  for (const [dx, dy, c] of [[-1, -2, '#c01830'], [1.2, -1.2, '#2a6ac0'], [0.2, -3.6, '#30a050'], [-0.6, 0, '#c01830']] as const) ellipse(ctx, x1 + dx * k, y1 + dy * k, 0.55 * k, 0.55 * k, c);
  ellipse(ctx, x1 - 1 * k, y1 - 3.4 * k, 0.7 * k, 0.5 * k, '#fff4c0');
  ellipse(ctx, x1 + 0.4 * k, y1 + 1 * k, 1.2 * k, 0.6 * k, GOLD_L);
}

/** A round shield (tarcza) of leather on wicker, painted crimson with the White Eagle and a gilt rim. */
function tarcza(ctx: Ctx, x: number, y: number, r: number, k: number) {
  ellipse(ctx, x + 0.7 * k, y + 0.5 * k, r, r * 1.1, '#4a2a18');
  ellipse(ctx, x, y, r, r * 1.1, GOLD_D);
  ellipse(ctx, x, y, r - 0.6 * k, (r - 0.6 * k) * 1.1, CRIMSON);
  ellipse(ctx, x - r * 0.25, y - r * 0.3, r * 0.5, r * 0.45, shade(CRIMSON, 0.12));
  eagle(ctx, x, y - 0.3 * k, r / 4.6);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ellipse(ctx, x + Math.cos(a) * (r - 0.3 * k), y + Math.sin(a) * (r - 0.3 * k) * 1.1, 0.3 * k, 0.3 * k, GOLD_L); }
}

/** A pavise: a tall wooden shield with a raised ridge down the middle, painted half red, half white, with the eagle on it. */
function pavise(ctx: Ctx, x: number, y: number, k: number) {
  const w = 5.4 * k, top = y - 15 * k, bot = y + 6 * k;
  poly(ctx, [x - w + 0.8 * k, top + 1.6 * k, x + w + 0.8 * k, top + 0.6 * k, x + w + 0.8 * k, bot + 0.6 * k, x - w + 0.8 * k, bot + 1.4 * k], WOOD_D); // its thickness
  poly(ctx, [x - w, top + 1 * k, x - w * 0.3, top - 0.6 * k, x + w * 0.4, top - 0.8 * k, x + w, top, x + w, bot, x - w, bot + 0.8 * k], '#3a2a20'); // the rim
  const inner = [x - w + 0.6 * k, top + 1.4 * k, x - w * 0.3, top, x + w * 0.4, top - 0.2 * k, x + w - 0.6 * k, top + 0.6 * k, x + w - 0.6 * k, bot - 0.6 * k, x - w + 0.6 * k, bot + 0.2 * k];
  poly(ctx, inner, WHITE);
  poly(ctx, [x - w + 0.6 * k, (top + bot) / 2 + 0.6 * k, x + w - 0.6 * k, (top + bot) / 2, x + w - 0.6 * k, bot - 0.6 * k, x - w + 0.6 * k, bot + 0.2 * k], CRIMSON); // the lower half red
  poly(ctx, [x - 0.8 * k, top - 0.4 * k, x + 0.8 * k, top - 0.5 * k, x + 0.8 * k, bot - 0.2 * k, x - 0.8 * k, bot + 0.1 * k], 'rgba(0,0,0,0.18)'); // the ridge's shadow
  line(ctx, x - 0.6 * k, top - 0.4 * k, x - 0.6 * k, bot, 'rgba(255,255,255,0.45)', 0.5 * k);
  eagle(ctx, x - w * 0.42, top + 5.2 * k, 0.75 * k, CRIMSON, GOLD_D);
  eagle(ctx, x + w * 0.46, (top + bot) / 2 + 4.6 * k, 0.75 * k, WHITE, GOLD);
  for (const [px, py] of [[x - w + 1.2 * k, top + 2 * k], [x + w - 1.2 * k, top + 1.2 * k], [x - w + 1.2 * k, bot - 0.6 * k], [x + w - 1.2 * k, bot - 1.2 * k]] as const) ellipse(ctx, px, py, 0.4 * k, 0.4 * k, GOLD_D);
}

function weapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  switch (kind) {
    case 'warrior': berdysz(ctx, x, y, k); return true;
    case 'archer': bow(ctx, x, y, k); return true;
    case 'defender': spear(ctx, x, y, k, 32); return true; // the pavise comes afterwards
    case 'swordsman': karabela(ctx, x, y, k); tarcza(ctx, b.off.x - 1 * k, b.off.y - 2 * k, 4.4 * k, k); return true;
    case 'giant': bulawa(ctx, x, y, k); karabela(ctx, b.off.x - 1 * k, b.off.y + 3.6 * k, 0.6 * k); return true;
    case 'explorer': spear(ctx, x, y, k, 22); return true;
  }
  return false;
}

// ---------------------------------------------------------------- horsemen

const HK = 0.92; // drawHorse scale used by the horsemen

/** The czaprak (saddle cloth) in crimson with a gold fringe, a breast strap hung with brass, and a studded bridle. */
function czaprak(ctx: Ctx, x: number, y: number, saddle: { x: number; y: number }, cloth: string, rich: boolean) {
  const sx = saddle.x, sy = saddle.y + 1.2;
  poly(ctx, [sx - 6.4, sy - 0.6, sx + 4, sy + 1.2, sx + 3.6, sy + 7.4, sx - 6, sy + 6.2], cloth);
  poly(ctx, [sx - 6, sy + 6.2, sx + 3.6, sy + 7.4, sx + 3.6, sy + 8.2, sx - 6, sy + 7], rich ? GOLD : shade(cloth, -0.3));
  if (rich) for (let i = 0; i < 9; i++) line(ctx, sx - 5.6 + i * 1.1, sy + 7.1 + i * 0.14, sx - 5.6 + i * 1.1, sy + 8.4 + i * 0.14, GOLD_D, 0.4); // the fringe
  if (rich) { // a gold crescent and star embroidered on the cloth
    ctx.beginPath();
    ctx.arc(sx - 1.4, sy + 3.6, 1.6, 0.4, Math.PI * 1.6);
    ctx.strokeStyle = ink(GOLD);
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
  line(ctx, x + 3.5, y - 9.4, x + 8, y - 3.6, rich ? CRIMSON_D : '#4a2e16', 1.1); // the breast strap
  for (let i = 0; i < 3; i++) { const t = (i + 0.5) / 3; ellipse(ctx, x + 3.5 + 4.5 * t, y - 9.4 + 5.8 * t + 0.6, 0.55, 0.55, GOLD); }
  const hhx = x - 1 + 10.5 * HK, hhy = y + 3 - 15 * HK;
  for (const [dx, dy] of [[1.6, 0.2], [0.6, -2.2], [-0.8, -3.6]] as const) ellipse(ctx, hhx + dx, hhy + dy, 0.5, 0.5, GOLD);
}

/** The horse's armour: a steel chamfron over the face, a crinet of lames down the neck and a peytral over the chest. */
function horseArmour(ctx: Ctx, x: number, y: number) {
  const hx0 = x - 1, hy0 = y + 3;
  const hhx = hx0 + 10.5 * HK, hhy = hy0 - 15 * HK;
  faceQuad(ctx, 'R', hhx, hhy, 7 * HK, 5 * HK, 0.06, 0.74, 0.25, 0.98, STEEL); // the chamfron
  faceQuad(ctx, 'R', hhx, hhy, 7 * HK, 5 * HK, 0.38, 0.46, 0.25, 0.98, GOLD);
  ellipse(ctx, hhx + 1.6, hhy - 3.6, 0.9, 0.9, GOLD); // a boss between the eyes
  for (let i = 0; i < 4; i++) { // the crinet: lames down the crest of the neck
    const px = hx0 + (5.4 + i * 1.3) * HK, py = hy0 - (10.4 + i * 2) * HK;
    poly(ctx, [px, py, px + 2.6, py + 0.6, px + 2.8, py + 2.4, px + 0.2, py + 1.8], i % 2 ? shade(STEEL, -0.15) : STEEL);
    line(ctx, px + 0.2, py + 1.8, px + 2.8, py + 2.4, GOLD, 0.35);
  }
  // the peytral across the chest, scalloped, with gilt rivets
  poly(ctx, [x + 6, y - 9.8, x + 10, y - 8, x + 10.4, y - 3.4, x + 8.8, y - 2.2, x + 7.2, y - 3.6, x + 5.6, y - 3], STEEL);
  poly(ctx, [x + 8, y - 9, x + 10, y - 8, x + 10.4, y - 3.4, x + 8.8, y - 2.2], shade(STEEL, -0.22));
  line(ctx, x + 5.6, y - 3, x + 7.2, y - 3.6, GOLD, 0.45);
  line(ctx, x + 7.2, y - 3.6, x + 8.8, y - 2.2, GOLD, 0.45);
  for (const [dx, dy] of [[7, -8], [9, -6.6], [7.4, -5]] as const) ellipse(ctx, x + dx, y + dy, 0.4, 0.4, GOLD_L);
}

/** A rider's booted leg in the stirrup: yellow Morocco leather boots. */
function boot(ctx: Ctx, sx: number, sy: number, hose: string) {
  poly(ctx, [sx + 0.4, sy + 0.4, sx + 4, sy + 0.6, sx + 4.4, sy + 4.6, sx + 2, sy + 5], hose);
  poly(ctx, [sx + 2, sy + 5, sx + 4.4, sy + 4.6, sx + 4.4, sy + 9.6, sx + 2.2, sy + 9.8], '#d8a83a');
  poly(ctx, [sx + 2.2, sy + 9.6, sx + 4.6, sy + 9.4, sx + 6.2, sy + 10.4, sx + 2.2, sy + 10.8], '#a8782a');
  line(ctx, sx + 1.8, sy + 11, sx + 5, sy + 10.8, STEEL_D, 0.6);
}

/** The towarzysz's kopia: a long hollow lance painted in a spiral, a gilt ball at the grip, and a long red-and-white pennant. */
function kopia(ctx: Ctx, hx: number, hy: number, len: number, flag: number) {
  const x0 = hx - 3.4, y0 = hy + 7, x1 = hx + len * 0.3, y1 = hy - len;
  line(ctx, x0, y0, x1, y1, '#e8dcc0', 1.4);
  const n = Math.round(len / 2.6);
  for (let i = 1; i < n; i++) { // the painted spiral
    const t = i / n, px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t;
    line(ctx, px - 0.6, py + 0.3, px + 0.6, py - 0.5, CRIMSON, 0.7);
  }
  ellipse(ctx, hx - 0.2, hy + 0.8, 1.6, 1.3, GOLD); // the gałka: a ball guarding the hand
  ellipse(ctx, hx - 0.6, hy + 0.4, 0.6, 0.5, GOLD_L);
  poly(ctx, [x1 + 0.4, y1 - 5, x1 - 0.7, y1 + 0.2, x1 + 0.9, y1 + 0.4], STEEL_L);
  poly(ctx, [x1 + 0.4, y1 - 5, x1 + 1.4, y1, x1 + 0.9, y1 + 0.4], STEEL_D);
  if (flag > 0) pennant(ctx, x1 - 0.2, y1 + 1, flag, 3.6, 1.2);
}

/** A hussar wing: a curved wooden spar fixed to the back, set with a dense row of eagle feathers, rising over the head. */
function wing(ctx: Ctx, bx: number, by: number, s: number, far: boolean) {
  const tipx = bx + 5 * s, tipy = by - 34 * s; // the spar curves up and forward over the rider
  const cx = bx - 8 * s, cy = by - 17 * s;
  const at = (t: number): [number, number] => {
    const u = 1 - t;
    return [u * u * bx + 2 * u * t * cx + t * t * tipx, u * u * by + 2 * u * t * cy + t * t * tipy];
  };
  const dark = far ? 0.25 : 0;
  const n = 24;
  for (let i = n; i >= 1; i--) { // the feathers point back from the spar, longest in the middle; drawn top first so lower ones overlap
    const t = i / n, [px, py] = at(t), [qx, qy] = at(Math.max(0, t - 0.04));
    let nx = -(py - qy), ny = px - qx; // the spar's normal, toward the back
    const l = Math.hypot(nx, ny) || 1;
    nx /= -l; ny /= -l;
    const dx = nx * 0.9 - 0.25, dy = ny * 0.9 - 0.35, dl = Math.hypot(dx, dy); // swept back and a little up
    const ux = dx / dl, uy = dy / dl, vx = -uy, vy = ux;
    const len = (5 + Math.sin(t * Math.PI) * 4.2) * s, wd = 1.1 * s;
    const ex = px + ux * len, ey = py + uy * len;
    const c = shade(i % 3 === 0 ? '#e4e0d6' : '#f8f6f0', -dark);
    poly(ctx, [px + vx * wd * 0.5, py + vy * wd * 0.5, px + ux * len * 0.5 + vx * wd, py + uy * len * 0.5 + vy * wd, ex, ey, px + ux * len * 0.55 - vx * wd * 0.7, py + uy * len * 0.55 - vy * wd * 0.7, px - vx * wd * 0.4, py - vy * wd * 0.4], c);
    poly(ctx, [px + ux * len * 0.75 + vx * wd * 0.7, py + uy * len * 0.75 + vy * wd * 0.7, ex, ey, px + ux * len * 0.78 - vx * wd * 0.5, py + uy * len * 0.78 - vy * wd * 0.5], shade('#6a6a74', -dark)); // the dark tip
    line(ctx, px, py, px + ux * len * 0.85, py + uy * len * 0.85, shade('#c8c0b0', -dark), 0.22 * s); // the quill
  }
  ctx.strokeStyle = ink(shade(WOOD_D, -dark));
  ctx.lineWidth = 1.6 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.quadraticCurveTo(cx, cy, tipx, tipy);
  ctx.stroke();
  ctx.strokeStyle = ink(shade(CRIMSON, -dark)); // the spar is covered in crimson velvet with gilt bands
  ctx.lineWidth = 1 * s;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.quadraticCurveTo(cx, cy, tipx, tipy);
  ctx.stroke();
  for (const t of [0.2, 0.45, 0.7, 0.9]) { const [px, py] = at(t); ellipse(ctx, px, py, 0.75 * s, 0.6 * s, shade(GOLD, -dark)); }
  const [ex, ey] = at(1);
  ellipse(ctx, ex, ey, 0.9 * s, 0.9 * s, shade(GOLD, -dark)); // a gilt finial
}

/** The leopard skin worn over the left shoulder: a tawny pelt with black rosettes, a paw hanging down and its head at the shoulder. */
function leopard(ctx: Ctx, x: number, y: number, s: number) {
  const pts = [x + 1.2 * s, y - 8 * s, x + 3 * s, y - 6.4 * s, x + 1.4 * s, y + 0.6 * s, x - 1 * s, y + 4.6 * s, x - 5.4 * s, y + 5.6 * s, x - 7.6 * s, y + 2.4 * s, x - 5.6 * s, y - 2 * s, x - 3.8 * s, y - 7 * s];
  poly(ctx, pts, '#d89a40');
  poly(ctx, [x - 7.6 * s, y + 2.4 * s, x - 5.4 * s, y + 5.6 * s, x - 1 * s, y + 4.6 * s, x - 3.6 * s, y + 3 * s], '#b87a2a');
  for (const [dx, dy] of [[-3, -4], [-1, -1.6], [-4.6, 0.4], [-2.4, 2.4], [0.4, -5], [-5.2, 3.6], [0.2, 1.6], [-3.6, -1.6]] as const) { // rosettes
    ellipse(ctx, x + dx * s, y + dy * s, 0.75 * s, 0.6 * s, '#3a2410');
    ellipse(ctx, x + dx * s, y + dy * s, 0.35 * s, 0.28 * s, '#c88a34');
  }
  poly(ctx, [x - 6.6 * s, y + 4.6 * s, x - 5.2 * s, y + 5.4 * s, x - 6 * s, y + 9 * s, x - 7.4 * s, y + 8.6 * s], '#d89a40'); // a hanging paw
  for (const d of [0, 0.5, 1]) line(ctx, x - 7.4 * s + d * 1.2 * s, y + 8.8 * s, x - 7.5 * s + d * 1.2 * s, y + 9.6 * s, '#f4f0e6', 0.3 * s);
  // the head, at the shoulder, clasped with a gold brooch
  ellipse(ctx, x + 1.8 * s, y - 7.4 * s, 1.8 * s, 1.5 * s, '#d89a40');
  ellipse(ctx, x + 2.6 * s, y - 6.8 * s, 0.9 * s, 0.7 * s, '#e8c890');
  for (const d of [-1, 1]) ellipse(ctx, x + 1.4 * s + d * 0.8 * s, y - 8.8 * s, 0.5 * s, 0.6 * s, '#b87a2a');
  ellipse(ctx, x + 2.2 * s, y - 7.8 * s, 0.3 * s, 0.25 * s, '#1a1208');
  ellipse(ctx, x + 0.6 * s, y - 6.2 * s, 0.9 * s, 0.9 * s, GOLD);
  ellipse(ctx, x + 0.6 * s, y - 6.2 * s, 0.4 * s, 0.4 * s, '#c01830');
}

/** The Winged Hussar: a towarzysz in plate and a leopard skin on an armoured horse, wings on his back, kopia in hand. */
function hussar(ctx: Ctx, x: number, y: number) {
  const saddle = drawHorse(ctx, x - 1, y + 3, HK, '#e2ded6', '#b8b2a8', undefined, CRIMSON);
  for (const [dx, dy] of [[-5, -7], [-2, -5], [2, -8], [5, -6], [-4, -4]] as const) ellipse(ctx, x + dx, y + dy, 1.1, 0.7, '#c8c2b8'); // a dappled grey
  czaprak(ctx, x, y, saddle, CRIMSON, true);
  horseArmour(ctx, x, y);
  wing(ctx, saddle.x - 3.4, saddle.y - 3, 0.9, true); // the far wing, a little behind
  wing(ctx, saddle.x - 2.2, saddle.y - 2, 1, false);
  const b = figure(ctx, 'wingedhussar', 'poland', saddle.x, saddle.y, 0.9, true);
  boot(ctx, saddle.x, saddle.y, CRIMSON);
  leopard(ctx, saddle.x - 3.6, saddle.y - 3.4, 0.8);
  kopia(ctx, b.hand.x, b.hand.y, 40, 15);
}

/** A light horseman (lekki): kołpak and kontusz, a karabela raised, a small round shield, the saadak at the saddle. */
function rider(ctx: Ctx, x: number, y: number) {
  const saddle = drawHorse(ctx, x - 1, y + 3, HK, '#9a5a2c', '#1a120c', undefined, NAVY);
  czaprak(ctx, x, y, saddle, NAVY, false);
  saadak(ctx, saddle.x - 4.2, saddle.y + 2.4, 0.8);
  const b = figure(ctx, 'rider', 'poland', saddle.x, saddle.y, 0.88, true);
  boot(ctx, saddle.x, saddle.y, CRIMSON);
  tarcza(ctx, b.off.x - 1.4, b.off.y - 1.6, 3, 0.62);
  karabela(ctx, b.hand.x, b.hand.y, 0.95);
}

/** A pancerny: a mailed horseman in a misiurka on a dark bay, with a round shield and a lance with a small pennant. */
function pancerny(ctx: Ctx, x: number, y: number) {
  const saddle = drawHorse(ctx, x - 1, y + 3, HK, '#5a3420', '#120c08', undefined, CRIMSON);
  czaprak(ctx, x, y, saddle, CRIMSON_D, true);
  const b = figure(ctx, 'knight', 'poland', saddle.x, saddle.y, 0.9, true);
  boot(ctx, saddle.x, saddle.y, CRIMSON_D);
  tarcza(ctx, b.off.x - 1.6, b.off.y - 2.4, 3.4, 0.7);
  kopia(ctx, b.hand.x, b.hand.y, 30, 8);
}

// ---------------------------------------------------------------- the siege engine

/** A counterweight trebuchet on a timber frame: a weighted box, a long arm with its sling, a red-and-white banner and a crewman. */
function trebuchet(ctx: Ctx, x: number, y: number) {
  for (const [ax, ay, ar] of [[15, 6, 2], [18, 5, 1.8], [16.6, 3.2, 1.6]] as const) { // a heap of shot stones
    ellipse(ctx, x + ax, y + ay, ar, ar * 0.85, '#8a8478');
    ellipse(ctx, x + ax - ar * 0.3, y + ay - ar * 0.3, ar * 0.45, ar * 0.35, '#c0b8aa');
  }
  // the base: two sill beams and a cross beam
  for (const [ox, oy] of [[-4, -2], [4, 2]] as const) {
    box(ctx, x + ox, y + oy, 24, 2.2, WOOD, shade(WOOD, 0.2));
    for (const u of [0.3, 0.7]) faceQuad(ctx, 'R', x + ox, y + oy, 24, 2.2, u, u + 0.03, 0, 1, WOOD_D);
  }
  const A: [number, number] = [x + 1, y - 22]; // the axle
  for (const [bx, by] of [[x - 7, y + 0.4], [x + 10, y + 1.6], [x - 2, y - 2.6], [x + 6, y + 4]] as const) {
    line(ctx, bx, by, A[0] + (bx < x ? -1.4 : 1.4), A[1] + 0.4, WOOD_D, 2.2);
    line(ctx, bx - 0.5, by, A[0] + (bx < x ? -1.4 : 1.4) - 0.5, A[1] + 0.4, WOOD_L, 1.1);
  }
  line(ctx, x - 5, y - 8, x + 8, y - 7, WOOD_D, 1.1);
  // the arm: long to the back (left, raised), short to the front with the counterweight hanging below
  const tip: [number, number] = [x - 17, y - 38], cw: [number, number] = [x + 8, y - 14];
  line(ctx, cw[0], cw[1], tip[0], tip[1], WOOD_D, 2.6);
  line(ctx, cw[0] - 0.3, cw[1] - 0.6, tip[0] + 0.3, tip[1] - 0.4, WOOD_L, 1.2);
  for (const t of [0.3, 0.55]) { const px = cw[0] + (tip[0] - cw[0]) * t, py = cw[1] + (tip[1] - cw[1]) * t; line(ctx, px - 1.1, py + 0.6, px + 1.1, py - 0.6, t < 0.4 ? CRIMSON : WHITE, 1); } // painted bands
  line(ctx, A[0] - 4, A[1] + 0.3, A[0] + 4, A[1] - 0.3, '#3a2a1a', 2.2);
  // the counterweight: an iron-bound box of stones hung from the short end
  line(ctx, cw[0], cw[1], cw[0] - 1, cw[1] + 4, '#3a2a1a', 0.8);
  line(ctx, cw[0], cw[1], cw[0] + 1.4, cw[1] + 4, '#3a2a1a', 0.8);
  box(ctx, cw[0], cw[1] + 9.6, 6.4, 6, WOOD, shade(WOOD, 0.1));
  band(ctx, cw[0], cw[1] + 9.6, 6.4, 6, 0.1, 0.18, STEEL_D);
  band(ctx, cw[0], cw[1] + 9.6, 6.4, 6, 0.8, 0.88, STEEL_D);
  for (const [dx, dy] of [[-1, -6.6], [1, -6.2], [0, -7]] as const) ellipse(ctx, cw[0] + dx, cw[1] + 9.6 + dy, 1, 0.7, '#8a8478');
  // the sling hanging from the tip, a stone in its pouch
  const pouch: [number, number] = [x - 14, y - 4];
  curve(ctx, tip[0], tip[1], tip[0] - 4, (tip[1] + pouch[1]) / 2, pouch[0] - 2.2, pouch[1] - 1, 0.55, '#a89060');
  curve(ctx, tip[0], tip[1], tip[0] + 4.4, (tip[1] + pouch[1]) / 2, pouch[0] + 2.4, pouch[1] - 1, 0.55, '#a89060');
  ellipse(ctx, pouch[0], pouch[1] + 0.3, 3.2, 1.8, '#5a3a20');
  ellipse(ctx, pouch[0], pouch[1] - 0.8, 1.7, 1.4, '#8a8478');
  // a banner on a staff beside the frame: red and white, swallow-tailed
  const fx = x + 14, fy = y - 1;
  line(ctx, fx, fy + 2, fx, fy - 30, WOOD_D, 0.9);
  pennant(ctx, fx, fy - 29, 11, 6, 0.8);
  poly(ctx, [fx - 0.8, fy - 30, fx, fy - 32.4, fx + 0.8, fy - 30], GOLD);
  figure(ctx, 'catapult', 'poland', x + 1, y + 8, 0.62);
}

// ---------------------------------------------------------------- boats

function foam(ctx: Ctx, x: number, y: number, w: number) {
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y, w, 2.2, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.stroke();
}

/** A square sail on a yard, bellied by the wind, in canvas with (or without) red-and-white bands. */
function squareSail(ctx: Ctx, mx: number, yTop: number, w: number, h: number, look: 'plain' | 'bands' | 'eagle') {
  const l = mx - w / 2, r = mx + w / 2, b = yTop + h;
  line(ctx, l - 1.4, yTop - 0.4, r + 1.4, yTop + 0.4, WOOD_D, 1);
  const pts = [l, yTop, r, yTop + 0.4, r + 1.4, b - h * 0.45, r + 0.4, b, mx, b + 1.8, l - 0.4, b - 0.2, l - 1.4, b - h * 0.45];
  poly(ctx, pts, '#f2ead6');
  poly(ctx, [mx, yTop + 0.2, r, yTop + 0.4, r + 1.4, b - h * 0.45, r + 0.4, b, mx, b + 1.8], '#dcd2ba');
  if (look !== 'plain') {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath();
    ctx.clip();
    if (look === 'bands') ctx.fillStyle = ink(CRIMSON), ctx.fillRect(l - 2, yTop + h * 0.55, w + 4, h);
    else { ctx.fillStyle = ink(CRIMSON); ctx.beginPath(); ctx.ellipse(mx, yTop + h * 0.5, w * 0.24, h * 0.3, 0, 0, Math.PI * 2); ctx.fill(); eagle(ctx, mx, yTop + h * 0.52, Math.min(w, h) * 0.09); }
    ctx.restore();
  }
  for (const t of [0.2, 0.8]) line(ctx, l + t * w, yTop + 1, l + t * w + (t - 0.5) * 2, b, 'rgba(0,0,0,0.1)', 0.5);
}

/** A flag on a staff: red with the White Eagle (or plain red over white). */
function flag(ctx: Ctx, x: number, y: number, w: number, h: number, look: 'eagle' | 'bicolour', wave = 0.6) {
  const top = (t: number) => y + Math.sin(t * 4) * wave * t;
  const pts: number[] = [];
  for (let i = 0; i <= 6; i++) pts.push(x + (w * i) / 6, top(i / 6));
  for (let i = 6; i >= 0; i--) pts.push(x + (w * i) / 6, top(i / 6) + h);
  if (look === 'bicolour') {
    poly(ctx, pts, CRIMSON_L);
    const up: number[] = [];
    for (let i = 0; i <= 6; i++) up.push(x + (w * i) / 6, top(i / 6));
    for (let i = 6; i >= 0; i--) up.push(x + (w * i) / 6, top(i / 6) + h / 2);
    poly(ctx, up, WHITE);
    return;
  }
  poly(ctx, pts, CRIMSON);
  eagle(ctx, x + w * 0.5, top(0.5) + h * 0.5, h / 7);
}

/** A Vistula grain barge (szkuta, dubas): a long flat-bottomed hull with square ends, sacks of grain, a deckhouse, one square sail and a great steering sweep. */
function barge(ctx: Ctx, x: number, y: number, big: boolean) {
  const w = big ? 24 : 16, hd = big ? 5.4 : 4.2; // half-length and the hull's depth
  const sheer = (t: number) => y - hd - Math.max(0, Math.abs(t) - 0.7) * (big ? 6 : 4.6); // flat, with the ends raked up
  const near: [number, number][] = [];
  for (let i = 0; i <= 10; i++) { const t = -1 + i * 0.2; near.push([x + t * w, sheer(t)]); }
  const far = near.map(([a, b], i) => [a + (i === 0 ? 1.6 : i === 10 ? -1.6 : 0), b - 3] as [number, number]);
  poly(ctx, [...near.flat(), ...[...far].reverse().flat()], '#3a2614'); // the inside of the far wall
  poly(ctx, [x - w * 0.9, y - hd - 0.4, x + w * 0.9, y - hd - 0.4, x + w * 0.9, y - hd - 2.8, x - w * 0.9, y - hd - 2.8], '#a88a5a'); // the deck boards
  // the cargo: a heap of grain sacks amidships, tied down
  for (let i = 0; i < (big ? 7 : 4); i++) {
    const sx = x - w * 0.42 + i * (big ? 3.2 : 3.4) + (i % 2) * 0.8, sy = y - hd - 2.4 - (i % 3 === 1 ? 1.6 : 0);
    ellipse(ctx, sx, sy, 2, 1.6, '#c8b088');
    ellipse(ctx, sx - 0.5, sy - 0.5, 1.1, 0.8, '#e2d0a8');
    line(ctx, sx + 1.1, sy - 1.4, sx + 1.6, sy - 2, '#8a7050', 0.5);
  }
  // the mast and its square sail
  const mx = x + (big ? 5 : 2), mh = big ? 30 : 24;
  line(ctx, mx, y - hd - 1, mx, y - hd - mh, WOOD_D, big ? 1.3 : 1.1);
  squareSail(ctx, mx, y - hd - mh + 3, big ? 15 : 11, big ? 14 : 11, big ? 'bands' : 'plain');
  line(ctx, mx, y - hd - mh, x + w - 1, sheer(1) - 1, 'rgba(60,40,24,0.55)', 0.4);
  line(ctx, mx, y - hd - mh, x - w + 1, sheer(-1) - 1, 'rgba(60,40,24,0.55)', 0.4);
  pennant(ctx, mx, y - hd - mh - 0.4, big ? 8 : 6, 2.4, 0.6);
  if (big) { // the boatmen's deckhouse (budka) at the stern, under a shingle roof
    const hx = x - w * 0.66, hy = y - hd - 1.4;
    box(ctx, hx, hy, 7, 4.4, '#b88a54', '#c89a64');
    faceQuad(ctx, 'R', hx, hy, 7, 4.4, 0.35, 0.6, 0, 0.75, '#3a2618');
    poly(ctx, [hx - 4.6, hy - 4.2, hx, hy - 9, hx + 4.6, hy - 4.2, hx, hy - 1.8], '#6a5a4a');
    poly(ctx, [hx, hy - 9, hx + 4.6, hy - 4.2, hx, hy - 1.8], '#4a3e34');
    line(ctx, hx + 1.4, hy - 7.4, hx + 1.6, hy - 11, '#5a4a3a', 0.8); // a stovepipe
    ellipse(ctx, hx + 2.2, hy - 12.4, 1.4, 0.9, 'rgba(210,214,220,0.45)');
  }
  // the crew: a raftsman (flisak) at the sweep, another poling at the bow
  figure(ctx, 'warrior', 'poland', x - w * 0.86, y - hd - 1.2, 0.4, true);
  if (big) figure(ctx, 'archer', 'poland', x + w * 0.66, y - hd - 1.2, 0.38, true);
  // the hull's near side: planks and a dark wale, square-ended
  const hull = [...near, [x + w * 0.96, y - 1], [x + w * 0.9, y + 2.4], [x - w * 0.9, y + 2.4], [x - w * 0.96, y - 1]] as [number, number][];
  poly(ctx, hull.flat(), '#8a6038');
  poly(ctx, [...near.flat(), x + w * 0.94, y - hd + 2, x - w * 0.94, y - hd + 2], '#a87a48');
  for (const dv of [0.35, 0.65]) line(ctx, x - w * 0.95, y - hd + hd * dv * 1.4, x + w * 0.95, y - hd + hd * dv * 1.4, '#5a3c20', 0.45);
  line(ctx, x - w * 0.92, y + 2.2, x + w * 0.9, y + 2.2, '#3a2412', 0.9);
  ctx.strokeStyle = ink('#c89a64');
  ctx.lineWidth = 1;
  ctx.beginPath();
  near.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)));
  ctx.stroke();
  // the steering sweep: a long oar over the stern on a crutch
  const [sx, sy] = near[0];
  line(ctx, sx + 6, sy - 3.6, sx - 6, sy + 7, WOOD_D, 1.1);
  poly(ctx, [sx - 4.6, sy + 5.6, sx - 7.4, sy + 8.4, sx - 6.6, sy + 9.4, sx - 4, sy + 6.6], WOOD);
  if (big) { const [bx, by] = near[10]; line(ctx, bx - 2, by - 8, bx + 3, by + 5, WOOD_D, 0.8); } // a pole at the bow
  foam(ctx, x, y + 2.8, w * 0.92);
}

/** The Baltic galleon of the Commonwealth's fleet: a tall sterncastle, gunports, three masts, red flags with the White Eagle. */
function galleon(ctx: Ctx, x: number, y: number) {
  const w = 27;
  const top = (t: number) => y - 5.4 - (t < 0 ? Math.pow(-t, 2.4) * 6 : Math.pow(t, 3) * 2.6);
  const near: [number, number][] = [];
  for (let i = 0; i <= 12; i++) { const t = -1 + i / 6; near.push([x + t * w, top(t)]); }
  const far = near.map(([a, b], i) => [a + (i === 0 ? 1.8 : i === 12 ? -1.8 : 0), b - 2] as [number, number]);
  poly(ctx, [...near.flat(), ...[...far].reverse().flat()], '#3a2414');
  // masts and stays
  line(ctx, x + 1, y - 5, x + 1, y - 46, WOOD_D, 1.4);
  line(ctx, x + 14, y - 6, x + 14.4, y - 36, WOOD_D, 1.1);
  line(ctx, x - 13, y - 7, x - 13, y - 32, WOOD_D, 1);
  for (const [a, b, c, d] of [[x - 26, y - 8, x + 1, y - 45], [x + 30, y - 9, x + 14.4, y - 35], [x + 30, y - 9, x + 1, y - 45]] as const) line(ctx, a, b, c, d, 'rgba(60,40,24,0.55)', 0.4);
  squareSail(ctx, x - 13, y - 29, 10, 9, 'plain');
  squareSail(ctx, x + 1, y - 43, 15, 9, 'plain');
  squareSail(ctx, x + 1, y - 31.6, 21, 14, 'eagle');
  squareSail(ctx, x + 14.2, y - 33, 11, 7.4, 'plain');
  squareSail(ctx, x + 14, y - 24, 14, 10, 'bands');
  ellipse(ctx, x + 1, y - 34.4, 2.4, 1, '#5a3418'); // the tops
  ellipse(ctx, x + 14.2, y - 25.4, 2, 0.9, '#5a3418');
  // the ensign at the main, pennants at the fore and mizzen
  line(ctx, x + 1, y - 46, x + 1, y - 52, WOOD_D, 0.8);
  flag(ctx, x + 1, y - 52, 9, 6, 'eagle');
  pennant(ctx, x + 14.4, y - 36.4, 11, 2.4, 0.6);
  pennant(ctx, x - 13, y - 32.4, 8, 2, 0.5);
  // the hull: dark planking with red and gold strakes
  const keel = [...near, [x + w * 0.86, y - 0.6], [x + w * 0.5, y + 2.6], [x, y + 3.2], [x - w * 0.5, y + 2.8], [x - w * 0.96, y - 0.4]] as [number, number][];
  poly(ctx, keel.flat(), '#4a2a16');
  poly(ctx, [...near.flat(), x + w * 0.9, y - 2.6, x, y - 2, x - w * 0.9, y - 2.4], '#6a4024');
  line(ctx, x - w * 0.94, y - 0.6, x + w * 0.86, y - 0.8, '#2a1a0e', 0.7);
  for (const [dy, c, wd] of [[1.2, CRIMSON, 1.4], [2.4, GOLD, 0.6]] as const) {
    ctx.strokeStyle = ink(c);
    ctx.lineWidth = wd;
    ctx.beginPath();
    near.forEach(([a, b], i) => (i ? ctx.lineTo(a, b + dy) : ctx.moveTo(a, b + dy)));
    ctx.stroke();
  }
  for (let i = 0; i < 6; i++) { // gunports with the muzzles run out
    const t = -0.5 + i * 0.2, px = x + t * w, py = top(t) + 3.8;
    poly(ctx, [px - 1.2, py - 1, px + 1.2, py - 1, px + 1.2, py + 1, px - 1.2, py + 1], '#1a100a');
    poly(ctx, [px - 1.2, py - 1.6, px + 1.2, py - 1.6, px + 1.2, py - 1, px - 1.2, py - 1], CRIMSON);
    line(ctx, px + 0.2, py, px + 1.6, py + 0.8, '#3a3a40', 1);
  }
  // the sterncastle: two stepped decks with lit windows, a gilt eagle on the stern, lanterns
  const castle = (cx: number, cy: number, cw: number, ch: number, windows: boolean) => {
    box(ctx, cx, cy, cw, ch, '#6a4024', '#8a5a34');
    band(ctx, cx, cy, cw, ch, 0.62, 0.78, CRIMSON);
    band(ctx, cx, cy, cw, ch, 0.78, 0.84, GOLD);
    if (windows) for (const u of [0.25, 0.6]) faceQuad(ctx, 'R', cx, cy, cw, ch, u, u + 0.14, 0.24, 0.48, '#f0c860');
    for (let i = 0; i < 5; i++) faceQuad(ctx, 'L', cx, cy - ch, cw, 1.6, i / 5 + 0.04, i / 5 + 0.1, 0, 1, '#4a2a14');
  };
  castle(x - w * 0.7, y - 6.4, 12, 7, true);
  castle(x - w * 0.8, y - 13.4, 8, 4.4, true);
  eagle(ctx, x - w * 0.7 - 4.4, y - 9.6, 0.62, GOLD, GOLD_D);
  for (const d of [-1, 1]) {
    const lx = x - w * 0.8 + d * 3.4, ly = y - 20.4;
    line(ctx, lx, ly + 2.4, lx, ly + 0.8, '#3a2a20', 0.5);
    ellipse(ctx, lx, ly, 1, 1.4, '#ffd060');
    ellipse(ctx, lx, ly - 1.4, 0.8, 0.4, GOLD_D);
  }
  castle(x + w * 0.66, y - 5.8, 7, 3.8, false);
  figure(ctx, 'swordsman', 'poland', x - w * 0.8, y - 17.8, 0.34, true);
  figure(ctx, 'archer', 'poland', x + w * 0.66, y - 9.6, 0.34, true);
  poly(ctx, [x + w * 0.9, top(0.9) + 1, x + w + 5, top(1) + 1.6, x + w + 4.6, top(1) + 3, x + w * 0.88, top(0.88) + 4], '#6a4024'); // the beak-head
  line(ctx, x + w * 0.9, top(0.9) - 2, x + w + 8, top(1) - 9, WOOD_D, 1); // the bowsprit
  line(ctx, x - w + 1.4, top(-1) + 2, x - w - 1.6, y + 4.6, WOOD, 1.2); // the rudder
  foam(ctx, x, y + 3.2, w * 0.88);
}

function unit(ctx: Ctx, kind: UnitKind, x: number, y: number): boolean {
  switch (kind) {
    case 'wingedhussar': hussar(ctx, x, y); return true;
    case 'knight': pancerny(ctx, x, y); return true;
    case 'rider': rider(ctx, x, y); return true;
    case 'catapult': trebuchet(ctx, x, y); return true;
    case 'boat': barge(ctx, x, y, false); return true;
    case 'ship': barge(ctx, x, y, true); return true;
    case 'warship': galleon(ctx, x, y); return true;
  }
  return false;
}

// ---------------------------------------------------------------- buildings

/** A steep pitched roof over a box: the ridge runs back from the gable end on the left face. Returns its key points. */
function gableRoof(ctx: Ctx, x: number, y: number, w: number, h: number, rise: number, color: string, gableWall: string, eave = 1.2, tiles = true) {
  const hw = w / 2 + eave, hh = hw / 2;
  const L = [x - hw, y - h], F = [x, y + hh - h], Rr = [x + hw, y - h], Bk = [x, y - hh - h];
  const m1 = [(L[0] + F[0]) / 2, (L[1] + F[1]) / 2 - rise], m2 = [(Bk[0] + Rr[0]) / 2, (Bk[1] + Rr[1]) / 2 - rise];
  poly(ctx, [L[0], L[1], Bk[0], Bk[1], m2[0], m2[1], m1[0], m1[1]], shade(color, 0.14));
  const wl = [x - w / 2, y - h], wf = [x, y + w / 4 - h], ap = [m1[0], m1[1] + 1]; // the gable wall
  poly(ctx, [wl[0], wl[1], wf[0], wf[1], ap[0], ap[1]], shade(gableWall, 0.06));
  poly(ctx, [F[0], F[1], Rr[0], Rr[1], m2[0], m2[1], m1[0], m1[1]], shade(color, -0.1)); // the near slope
  if (tiles) for (let i = 1; i < 6; i++) { // rows of tiles
    const t = i / 6;
    line(ctx, F[0] + (m1[0] - F[0]) * t, F[1] + (m1[1] - F[1]) * t, Rr[0] + (m2[0] - Rr[0]) * t, Rr[1] + (m2[1] - Rr[1]) * t, shade(color, -0.3), 0.4);
  }
  line(ctx, m1[0], m1[1], m2[0], m2[1], shade(color, 0.3), 0.8);
  line(ctx, L[0], L[1], m1[0], m1[1], shade(color, -0.35), 0.6);
  line(ctx, F[0], F[1], m1[0], m1[1], shade(color, -0.35), 0.6);
  return { apex: m1, L, F, wl, wf, ap };
}

/** A window: a dark pane in a white surround, with a mullion and transom. */
function win(ctx: Ctx, face: 'L' | 'R', x: number, y: number, w: number, h: number, u: number, v: number, du: number, dv: number, frame = PLASTER) {
  faceQuad(ctx, face, x, y, w, h, u - 0.04, u + du + 0.04, v - 0.05, v + dv + 0.05, frame);
  faceQuad(ctx, face, x, y, w, h, u, u + du, v, v + dv, '#2a3040');
  faceQuad(ctx, face, x, y, w, h, u + du * 0.44, u + du * 0.56, v, v + dv, frame);
  faceQuad(ctx, face, x, y, w, h, u, u + du, v + dv * 0.6, v + dv * 0.68, frame);
}

/** Brick courses scored across a box. */
function brickwork(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  box(ctx, x, y, w, h, color, shade(color, 0.15));
  const n = Math.max(3, Math.round(h / 1.4));
  for (let i = 1; i < n; i++) {
    const v = i / n;
    faceQuad(ctx, 'L', x, y, w, h, 0, 1, v, v + 0.02, shade(color, -0.25));
    faceQuad(ctx, 'R', x, y, w, h, 0, 1, v, v + 0.02, shade(color, -0.3));
  }
  band(ctx, x, y, w, h, 0, 0.08, shade(color, -0.2)); // a plinth
}

/** A gothic brick house with a stepped gable and a steep tile roof. */
function brickHouse(ctx: Ctx, x: number, y: number, w: number, h: number, roofC: string) {
  brickwork(ctx, x, y, w, h, BRICK);
  win(ctx, 'R', x, y, w, h, 0.18, 0.4, 0.18, 0.36);
  win(ctx, 'R', x, y, w, h, 0.6, 0.4, 0.18, 0.36);
  faceQuad(ctx, 'L', x, y, w, h, 0.4, 0.62, 0, 0.5, '#4a2a1c'); // the arched door
  ellipse(ctx, ...pt('L', x, y, w, h, 0.51, 0.5), 1.1, 0.7, '#4a2a1c');
  const r = gableRoof(ctx, x, y, w, h, 10, roofC, BRICK, 1, true);
  // the stepped gable rising above the roof line, in brick with white blind niches
  const { wl, wf, ap } = r;
  const steps = 4, stepPts: number[] = [];
  for (let i = 0; i <= steps; i++) { // up the left side
    const t = i / steps, px = wl[0] + (ap[0] - wl[0]) * t, py = wl[1] + (ap[1] - wl[1]) * t;
    stepPts.push(px, py - 1.6, px + (ap[0] - wl[0]) / steps, py - 1.6);
  }
  for (let i = steps; i >= 0; i--) {
    const t = i / steps, px = wf[0] + (ap[0] - wf[0]) * t, py = wf[1] + (ap[1] - wf[1]) * t;
    stepPts.push(px, py - 1.6);
  }
  poly(ctx, [wl[0], wl[1], ...stepPts, wf[0], wf[1]], shade(BRICK, 0.08));
  for (const t of [0.25, 0.5, 0.75]) { // blind niches in the gable
    const px = wl[0] + (wf[0] - wl[0]) * t, py = wl[1] + (wf[1] - wl[1]) * t - 1;
    const hgt = (1 - Math.abs(t - 0.5) * 1.6) * 5;
    poly(ctx, [px - 0.6, py, px + 0.6, py + 0.3, px + 0.6, py - hgt + 0.3, px, py - hgt - 0.4, px - 0.6, py - hgt], '#f0e4cc');
  }
  ellipse(ctx, ap[0], ap[1] - 2.2, 0.6, 0.6, GOLD); // a gilt finial
}

/** The Polish attic (attyka): a decorative parapet of blind arcades and pinnacles crowning a wall and hiding the roof. */
function attic(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  box(ctx, x, y - h, w, 2.4, color, '#7a6a5a');
  for (const f of ['L', 'R'] as const) {
    for (let i = 0; i < 4; i++) { // blind arcades
      const u = (i + 0.3) / 4;
      faceQuad(ctx, f, x, y - h, w, 2.4, u, u + 0.12, 0.2, 0.8, shade(color, -0.25));
    }
    for (let i = 0; i <= 4; i++) { // pinnacles and little volutes along the top
      const [px, py] = pt(f, x, y - h, w, 2.4, i / 4, 1);
      poly(ctx, [px - 0.5, py, px, py - 2.8, px + 0.5, py], shade(color, f === 'L' ? 0.1 : -0.15));
      ellipse(ctx, px, py - 3, 0.45, 0.45, GOLD);
    }
  }
}

/** A burgher's house on the square (kamienica): plastered in a bright colour, three rows of windows, a portal, and a Polish attic. */
function kamienica(ctx: Ctx, x: number, y: number, w: number, h: number, wall: string) {
  box(ctx, x, y, w, h, wall, shade(wall, 0.2));
  band(ctx, x, y, w, h, 0, 0.08, shade(wall, -0.3));
  for (const v of [0.36, 0.66]) band(ctx, x, y, w, h, v - 0.04, v - 0.02, shade(wall, 0.25)); // cornices
  for (const v of [0.4, 0.7]) { win(ctx, 'R', x, y, w, h, 0.14, v, 0.16, 0.18, '#f8f4ea'); win(ctx, 'R', x, y, w, h, 0.62, v, 0.16, 0.18, '#f8f4ea'); win(ctx, 'L', x, y, w, h, 0.4, v, 0.18, 0.18, '#f8f4ea'); }
  faceQuad(ctx, 'R', x, y, w, h, 0.38, 0.56, 0.02, 0.28, '#e8dcc0'); // a stone portal
  faceQuad(ctx, 'R', x, y, w, h, 0.41, 0.53, 0.02, 0.24, '#4a2e1c');
  // a low roof behind the parapet, then the attic in front
  poly(ctx, [x - w / 2 + 1, y - h - 1, x, y - h - w / 4 - 4, x + w / 2 - 1, y - h - 1, x, y - h + w / 4 - 1], '#a85a3a');
  attic(ctx, x, y, w, h, '#f0e8d6');
}

/** A wooden manor house (dworek): white walls, a porch of four white columns under a pediment, and a tall broken shingle roof. */
function dworek(ctx: Ctx, x: number, y: number, roofC: string) {
  const w = 13, h = 5.6;
  box(ctx, x, y, w, h, '#f4eee2', '#e8e0d0');
  band(ctx, x, y, w, h, 0, 0.1, '#b0a088');
  win(ctx, 'R', x, y, w, h, 0.08, 0.3, 0.12, 0.42, '#6a5040');
  win(ctx, 'R', x, y, w, h, 0.8, 0.3, 0.12, 0.42, '#6a5040');
  win(ctx, 'L', x, y, w, h, 0.25, 0.3, 0.14, 0.42, '#6a5040');
  win(ctx, 'L', x, y, w, h, 0.62, 0.3, 0.14, 0.42, '#6a5040');
  // the broken (mansard) roof: a steep lower slope, then a gentler upper one, in grey-brown shingle
  const hw = w / 2 + 1.2, q = hw / 2;
  const P = (dx: number, dy: number, up: number): [number, number] => [x + dx, y - h + dy - up];
  const ring1 = [P(-hw, 0, 0), P(0, q, 0), P(hw, 0, 0), P(0, -q, 0)];
  const ring2 = [P(-hw * 0.72, 0, 5), P(0, q * 0.72, 5), P(hw * 0.72, 0, 5), P(0, -q * 0.72, 5)];
  const apex1 = P(-hw * 0.22, 0, 8.4), apex2 = P(hw * 0.22, 0, 8.4);
  poly(ctx, [...ring1[0], ...ring1[3], ...ring2[3], ...ring2[0]], shade(roofC, 0.12));
  poly(ctx, [...ring1[0], ...ring1[1], ...ring2[1], ...ring2[0]], shade(roofC, 0.02));
  poly(ctx, [...ring1[1], ...ring1[2], ...ring2[2], ...ring2[1]], shade(roofC, -0.22));
  poly(ctx, [...ring2[0], ...ring2[1], ...apex1], shade(roofC, 0.16));
  poly(ctx, [...ring2[1], ...ring2[2], ...apex2, ...apex1], shade(roofC, -0.08));
  line(ctx, ...apex1, ...apex2, shade(roofC, 0.35), 0.7);
  for (const t of [0.3, 0.6]) line(ctx, ring1[1][0] + (ring2[1][0] - ring1[1][0]) * t, ring1[1][1] + (ring2[1][1] - ring1[1][1]) * t, ring1[2][0] + (ring2[2][0] - ring1[2][0]) * t, ring1[2][1] + (ring2[2][1] - ring1[2][1]) * t, shade(roofC, -0.35), 0.35);
  // a dormer window in the roof
  const [dx, dy] = [(ring1[1][0] + ring2[2][0]) / 2 + 1, (ring1[1][1] + ring2[2][1]) / 2];
  poly(ctx, [dx - 1.4, dy, dx + 1.4, dy - 0.7, dx + 1.4, dy - 2.6, dx, dy - 4, dx - 1.4, dy - 1.9], '#f4eee2');
  poly(ctx, [dx - 0.7, dy - 0.6, dx + 0.7, dy - 1, dx + 0.7, dy - 2.4, dx - 0.7, dy - 2], '#2a3040');
  // the columned porch (ganek) at the front of the near face, under a white triangular pediment
  const [px, py] = pt('R', x, y, w, h, 0.5, 0);
  const pw = 6, pd = 3; // its width along the face, and how far it stands out
  const ox = pd * 0.9, oy = pd * 0.45;
  // the porch floor: a low stone platform with a step
  const f0: [number, number] = [px - pw / 2 - 0.6, py + pw / 4 + 0.3], f1: [number, number] = [px + pw / 2 + 0.6, py - pw / 4 - 0.3];
  const fl = 1.1;
  poly(ctx, [f0[0], f0[1] - fl, f1[0], f1[1] - fl, f1[0] + ox + 0.6, f1[1] + oy + 0.3 - fl, f0[0] + ox + 0.6, f0[1] + oy + 0.3 - fl], '#d8d0c0');
  poly(ctx, [f0[0] + ox + 0.6, f0[1] + oy + 0.3 - fl, f1[0] + ox + 0.6, f1[1] + oy + 0.3 - fl, f1[0] + ox + 0.6, f1[1] + oy + 0.3, f0[0] + ox + 0.6, f0[1] + oy + 0.3], '#a89c88');
  for (const t of [-0.5, -0.17, 0.17, 0.5]) { // the four columns
    const cx = px + t * pw + ox, cy = py - t * pw * 0.5 + oy - fl;
    line(ctx, cx, cy, cx, cy - h + 0.4, '#d8d0c0', 1.1);
    line(ctx, cx - 0.3, cy, cx - 0.3, cy - h + 0.4, '#ffffff', 0.4);
    line(ctx, cx - 0.7, cy - 0.2, cx + 0.7, cy - 0.5, '#c8bca8', 0.6); // the base
  }
  const L0: [number, number] = [px - pw / 2 + ox, py + pw / 4 + oy - h - 0.6], R0: [number, number] = [px + pw / 2 + ox, py - pw / 4 + oy - h - 0.6];
  poly(ctx, [L0[0] - 0.6, L0[1] + 0.3, R0[0] + 0.6, R0[1] - 0.3, R0[0] + 0.6, R0[1] - 1.3, L0[0] - 0.6, L0[1] - 0.7], '#e8e0d0'); // the entablature
  poly(ctx, [L0[0] - 0.8, L0[1] - 0.7, R0[0] + 0.8, R0[1] - 1.3, (L0[0] + R0[0]) / 2, (L0[1] + R0[1]) / 2 - 5.4], '#f8f4ea'); // the pediment
  poly(ctx, [L0[0] - 0.8, L0[1] - 0.7, (L0[0] + R0[0]) / 2, (L0[1] + R0[1]) / 2 - 5.4, (L0[0] + R0[0]) / 2 - 1.6, (L0[1] + R0[1]) / 2 - 5.2, L0[0] - 2.6, L0[1] + 0.2], shade(roofC, 0.1)); // its little roof edge
  ellipse(ctx, (L0[0] + R0[0]) / 2, (L0[1] + R0[1]) / 2 - 2.6, 0.8, 0.8, '#c0b0a0'); // an oculus
  faceQuad(ctx, 'R', x, y, w, h, 0.42, 0.58, 0.02, 0.58, '#6a4428'); // the door behind the columns
}

/** A baroque tower helmet: a swelling copper cap, a waist, a lantern, and a smaller cap with a gilt cross. */
function helmet(ctx: Ctx, x: number, y: number, r: number, color = COPPER) {
  const bulb = (cy: number, rr: number, hh: number) => {
    ctx.beginPath();
    ctx.moveTo(x - rr, cy);
    ctx.bezierCurveTo(x - rr * 1.15, cy - hh * 0.6, x - rr * 0.3, cy - hh * 0.8, x, cy - hh);
    ctx.bezierCurveTo(x + rr * 0.3, cy - hh * 0.8, x + rr * 1.15, cy - hh * 0.6, x + rr, cy);
    ctx.closePath();
    ctx.fillStyle = ink(shade(color, -0.18));
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = ink(shade(color, 0.1));
    ctx.fillRect(x - rr * 1.2, cy - hh, rr * 1.1, hh);
    ctx.restore();
  };
  bulb(y, r, r * 1.5);
  const ly = y - r * 1.3;
  poly(ctx, [x - r * 0.32, ly, x + r * 0.32, ly, x + r * 0.32, ly - r * 0.8, x - r * 0.32, ly - r * 0.8], '#f0e8d6'); // the open lantern
  line(ctx, x, ly, x, ly - r * 0.8, '#3a3a40', r * 0.18);
  bulb(ly - r * 0.8, r * 0.4, r * 0.7);
  const cy = ly - r * 1.5;
  line(ctx, x, cy, x, cy - r * 0.9, GOLD_D, Math.max(0.5, r * 0.12));
  line(ctx, x - r * 0.25, cy - r * 0.6, x + r * 0.25, cy - r * 0.6, GOLD_D, Math.max(0.4, r * 0.1));
  ellipse(ctx, x, cy - 0.2, r * 0.12, r * 0.12, GOLD_L);
}

/** The town hall (ratusz) on the market square: a brick hall with an attic and a tall tower with a clock and a baroque helmet. */
function ratusz(ctx: Ctx, x: number, y: number, roofC: string) {
  // the cloth hall: a long plastered hall with an arcade at its foot and an attic
  const hx = x + 4, hy = y + 2;
  box(ctx, hx, hy, 14, 7, '#e8dcc0', '#d8c8a8');
  for (const f of ['L', 'R'] as const) for (const u of [0.12, 0.38, 0.64]) { // the arcade's round arches
    faceQuad(ctx, f, hx, hy, 14, 7, u, u + 0.18, 0, 0.36, '#5a4030');
    const [ax, ay] = pt(f, hx, hy, 14, 7, u + 0.09, 0.36);
    ellipse(ctx, ax, ay, 1.2, 0.8, '#5a4030');
  }
  for (const u of [0.2, 0.5, 0.8]) win(ctx, 'R', hx, hy, 14, 7, u - 0.06, 0.52, 0.12, 0.28);
  poly(ctx, [hx - 6, hy - 7.6, hx, hy - 7 - 7.2, hx + 6, hy - 7.6, hx, hy - 7 + 3.2], roofC);
  attic(ctx, hx, hy, 14, 7, '#efe6d2');
  // the tower: gothic brick, a clock face, a gallery, and the copper helmet
  const tx = x - 5, ty = y - 1;
  brickwork(ctx, tx, ty, 6, 20, BRICK);
  for (const v of [0.3, 0.55]) { win(ctx, 'R', tx, ty, 6, 20, 0.35, v, 0.3, 0.1, '#f0e4cc'); win(ctx, 'L', tx, ty, 6, 20, 0.35, v, 0.3, 0.1, '#f0e4cc'); }
  const [ccx, ccy] = pt('R', tx, ty, 6, 20, 0.5, 0.82);
  ellipse(ctx, ccx, ccy, 1.6, 1.8, '#f4f0e0'); // the clock
  ellipse(ctx, ccx, ccy, 1.2, 1.4, '#2a3a6a');
  line(ctx, ccx, ccy, ccx, ccy - 1, GOLD, 0.35);
  line(ctx, ccx, ccy, ccx + 0.8, ccy + 0.2, GOLD, 0.35);
  box(ctx, tx, ty - 20, 7.4, 1.4, '#c8bca8', '#e0d4c0'); // the gallery
  for (let i = 0; i < 4; i++) { faceQuad(ctx, 'R', tx, ty - 20, 7.4, 1.4, i / 4 + 0.05, i / 4 + 0.12, 0, 1, '#6a5a4a'); faceQuad(ctx, 'L', tx, ty - 20, 7.4, 1.4, i / 4 + 0.05, i / 4 + 0.12, 0, 1, '#6a5a4a'); }
  helmet(ctx, tx, ty - 22.4, 3.2);
  // a well in the square before the hall
  ellipse(ctx, x + 9, y + 6.4, 1.8, 0.9, '#8a8478');
  ellipse(ctx, x + 9, y + 6, 1.2, 0.5, '#2a4a6a');
  line(ctx, x + 7.8, y + 6.2, x + 7.8, y + 3, WOOD_D, 0.5); line(ctx, x + 10.2, y + 6.2, x + 10.2, y + 3, WOOD_D, 0.5);
  poly(ctx, [x + 7.2, y + 3.2, x + 9, y + 1.9, x + 10.8, y + 3.2, x + 9, y + 4], roofC);
}

/** Wawel: a castle on its hill above the river, brick walls and a round tower, the cathedral with the gold dome of the royal chapel. */
function wawel(ctx: Ctx, x: number, y0: number, roofC: string) {
  // the hill: a limestone rock rising in a low cliff, grass on its shoulders
  const y = y0 - 3; // everything on the hill stands this much higher
  poly(ctx, [x - 20, y0 + 9, x - 17, y - 1, x - 8, y - 5, x + 6, y - 6, x + 17, y - 2, x + 21, y0 + 7, x + 6, y0 + 12, x - 10, y0 + 12], '#a8a898');
  poly(ctx, [x + 6, y - 6, x + 17, y - 2, x + 21, y0 + 7, x + 6, y0 + 12, x + 3, y0 + 3], '#7a7a6c');
  poly(ctx, [x - 20, y0 + 9, x - 10, y0 + 12, x + 6, y0 + 12, x + 3, y0 + 3, x - 8, y0 + 4, x - 17, y0 + 2], '#8e8e80'); // the cliff face
  for (const [a, b, c2, d] of [[-16, 4, -8, 7], [8, 2, 15, 6], [-5, 8, 3, 10], [-12, 8, -6, 10], [10, 7, 16, 8]] as const) line(ctx, x + a, y0 + b, x + c2, y0 + d, '#62625a', 0.5);
  poly(ctx, [x - 19, y0 + 2, x - 17, y - 1, x - 8, y - 5, x + 2, y - 5.6, x - 4, y - 1.4, x - 12, y + 2, x - 17, y0 + 3], '#6a9a4a');
  poly(ctx, [x + 14, y - 1, x + 17, y - 2, x + 20, y0 + 4, x + 17, y0 + 4], '#5a8a3e');
  // the walls along the hilltop, with a round tower (the Sandomierz tower) at one end
  const wy = y - 2;
  poly(ctx, [x - 15, wy + 2, x - 2, wy + 7, x + 12, wy + 2, x + 12, wy - 2, x - 2, wy + 3, x - 15, wy - 2], BRICK);
  for (let i = 0; i < 8; i++) { const px = x - 15 + i * 1.8, py = wy - 2 + i * 0.7; poly(ctx, [px, py, px + 1, py + 0.4, px + 1, py - 1, px, py - 1.4], BRICK_L); }
  for (let i = 0; i < 7; i++) { const px = x - 1 + i * 2, py = wy + 3 - i * 0.7; poly(ctx, [px, py, px + 1, py - 0.4, px + 1, py - 1.8, px, py - 1.4], BRICK_D); }
  const rtx = x - 15, rty = wy + 3;
  poly(ctx, [rtx - 2.6, rty, rtx - 2.6, rty - 11, rtx, rty - 10, rtx, rty + 1], BRICK_L);
  poly(ctx, [rtx + 2.6, rty, rtx + 2.6, rty - 11, rtx, rty - 10, rtx, rty + 1], BRICK);
  poly(ctx, [rtx - 3.2, rty - 10.8, rtx, rty - 17, rtx + 3.2, rty - 10.8, rtx, rty - 9.6], roofC);
  poly(ctx, [rtx, rty - 17, rtx + 3.2, rty - 10.8, rtx, rty - 9.6], shade(roofC, -0.25));
  for (const d of [-1.4, 1]) ellipse(ctx, rtx + d, rty - 6, 0.4, 0.7, '#2a2020');
  // the royal palace: a plastered block with rows of windows and a steep roof
  const px = x + 7, py = y - 4;
  box(ctx, px, py, 11, 7, '#ece2cc', '#ddd0b4');
  for (const v of [0.24, 0.6]) for (const u of [0.15, 0.45, 0.75]) { faceQuad(ctx, 'R', px, py, 11, 7, u, u + 0.12, v, v + 0.22, '#3a3040'); faceQuad(ctx, 'L', px, py, 11, 7, u, u + 0.12, v, v + 0.22, '#3a3040'); }
  gableRoof(ctx, px, py, 11, 7, 6, roofC, '#ece2cc', 0.8);
  // the cathedral: a gothic brick nave, a tall tower with a copper helmet, and the gold-domed Sigismund chapel
  const cx = x - 4, cy = y - 3;
  brickwork(ctx, cx, cy, 9, 9, BRICK);
  for (const u of [0.2, 0.6]) { faceQuad(ctx, 'R', cx, cy, 9, 9, u, u + 0.14, 0.3, 0.8, '#3a3040'); ellipse(ctx, ...pt('R', cx, cy, 9, 9, u + 0.07, 0.8), 0.6, 0.5, '#3a3040'); }
  gableRoof(ctx, cx, cy, 9, 9, 7, '#3a7a6a', BRICK, 0.6, false);
  const tcx = cx - 6, tcy = cy + 1; // the Sigismund bell tower
  brickwork(ctx, tcx, tcy, 5, 17, '#c8a070');
  faceQuad(ctx, 'R', tcx, tcy, 5, 17, 0.3, 0.7, 0.72, 0.9, '#2a2020');
  faceQuad(ctx, 'L', tcx, tcy, 5, 17, 0.3, 0.7, 0.72, 0.9, '#2a2020');
  helmet(ctx, tcx, tcy - 18.2, 2.8);
  // the chapel: a square drum and the gilded dome with a lantern
  const scx = cx + 5.4, scy = cy + 4.4;
  box(ctx, scx, scy, 5.6, 7, '#e8dcc0', '#d8ccb0');
  faceQuad(ctx, 'R', scx, scy, 5.6, 7, 0.3, 0.7, 0.4, 0.8, '#3a3040');
  box(ctx, scx, scy - 7, 4.6, 2, '#e0d4b8');
  const dy = scy - 9.4, r = 3.8;
  ctx.beginPath();
  ctx.ellipse(scx, dy, r, r * 1.05, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = ink(GOLD_D);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(scx, dy, r, r * 1.05, 0, Math.PI, Math.PI * 1.5);
  ctx.lineTo(scx, dy);
  ctx.closePath();
  ctx.fillStyle = ink(GOLD);
  ctx.fill();
  for (const a of [-0.5, 0, 0.5]) curve(ctx, scx + a * r * 1.6, dy, scx + a * r, dy - r * 0.8, scx, dy - r, 0.3, GOLD_D); // its ribs
  ellipse(ctx, scx - r * 0.45, dy - r * 0.5, 0.6, 1, GOLD_L);
  poly(ctx, [scx - 0.7, dy - r, scx + 0.7, dy - r, scx + 0.7, dy - r - 1.8, scx - 0.7, dy - r - 1.8], GOLD_L); // the lantern
  ellipse(ctx, scx, dy - r - 2, 1, 0.6, GOLD);
  line(ctx, scx, dy - r - 2.4, scx, dy - r - 4.4, GOLD_D, 0.5);
  ellipse(ctx, scx, dy - r - 3.6, 0.4, 0.4, GOLD_L);
  // the royal standard over the palace
  line(ctx, px + 1, py - 13, px + 1, py - 24, WOOD_D, 0.7);
  flag(ctx, px + 1, py - 24, 7, 4.6, 'eagle', 0.5);
}

/** A wooden church with a shingled roof and a slender belfry (as in the villages of Little Poland). */
function woodenChurch(ctx: Ctx, x: number, y: number, roofC: string) {
  box(ctx, x, y, 10, 6, '#8a5a34', '#9a6a40');
  for (let i = 1; i < 6; i++) { faceQuad(ctx, 'R', x, y, 10, 6, i / 6, i / 6 + 0.02, 0, 1, '#6a4428'); faceQuad(ctx, 'L', x, y, 10, 6, i / 6, i / 6 + 0.02, 0, 1, '#6a4428'); } // vertical boards
  faceQuad(ctx, 'R', x, y, 10, 6, 0.4, 0.6, 0, 0.6, '#3a2618');
  gableRoof(ctx, x, y, 10, 6, 7, '#6a5a4a', '#8a5a34', 1.2, true);
  // the belfry: a square timber tower with a sloping skirt and a little onion-less spire
  const bx = x - 4, by = y - 1;
  box(ctx, bx, by, 4.4, 15, '#8a5a34', '#9a6a40');
  poly(ctx, [bx - 3.2, by - 9, bx, by - 7.4, bx + 3.2, by - 9, bx, by - 11.6], '#5a4a3a');
  faceQuad(ctx, 'R', bx, by, 4.4, 15, 0.3, 0.7, 0.8, 0.92, '#2a1a10');
  poly(ctx, [bx - 2.8, by - 15, bx, by - 13.6, bx + 2.8, by - 15, bx, by - 22], '#5a4a3a');
  poly(ctx, [bx, by - 13.6, bx + 2.8, by - 15, bx, by - 22], '#3a2e24');
  line(ctx, bx, by - 22, bx, by - 25, '#3a3a40', 0.5);
  line(ctx, bx - 1, by - 24, bx + 1, by - 24, '#3a3a40', 0.5);
  void roofC;
}

function building(ctx: Ctx, x: number, y: number, big: boolean, roofC: string, capital: boolean) {
  if (big && capital) return wawel(ctx, x, y, roofC);
  if (big) return ratusz(ctx, x, y, roofC);
  const spot: Record<string, number> = { '-10,2': 0, '10,2': 1, '0,8': 2, '-6,-8': 3, '7,-7': 1, '-14,-3': 4, '14,-2': 0 };
  const v = spot[`${Math.round(x)},${Math.round(y)}`] ?? ((Math.round(x) * 7 + Math.round(y) * 3) % 5 + 5) % 5;
  const walls = ['#e8b84a', '#d88a8a', '#8ab08a', '#e8d8b0'];
  if (v === 0) brickHouse(ctx, x, y, 9, 7, roofC);
  else if (v === 1) kamienica(ctx, x, y, 10, 8.4, walls[(Math.abs(Math.round(x + y)) % 4)]);
  else if (v === 2) dworek(ctx, x, y, '#6a5a4a');
  else if (v === 3) woodenChurch(ctx, x, y, roofC);
  else { kamienica(ctx, x - 2.6, y - 1.3, 8, 8, walls[1]); kamienica(ctx, x + 3.4, y + 1.7, 8, 9, walls[2]); }
}

// ---------------------------------------------------------------- trees

/** Birch, oak and lime: the woods of the Polish plain. */
function tree(ctx: Ctx, x: number, y: number, k: number, P: BiomePalette, variant: number) {
  const type = ['oak', 'birch', 'lime', 'birches', 'oak', 'lime', 'birch', 'oak'][variant % 8];
  if (type === 'oak') { // a broad oak: a thick, forking trunk and a wide crown of lobed clumps
    const g = shade(mix(P.forest, '#2a5a20', 0.4), -0.04);
    poly(ctx, [x - 2 * k, y, x + 2 * k, y, x + 1.4 * k, y - 8 * k, x - 1.2 * k, y - 8 * k], '#5a4030');
    poly(ctx, [x + 0.3 * k, y, x + 2 * k, y, x + 1.4 * k, y - 8 * k, x + 0.2 * k, y - 8 * k], '#3e2c20');
    curve(ctx, x - 0.6 * k, y - 7 * k, x - 3 * k, y - 10 * k, x - 5.6 * k, y - 12 * k, 1.4 * k, '#4a3424');
    curve(ctx, x + 0.6 * k, y - 7 * k, x + 3 * k, y - 10.4 * k, x + 5 * k, y - 13 * k, 1.3 * k, '#4a3424');
    for (const [dx, dy] of [[-1.4, -3], [0.8, -5.4]] as const) ellipse(ctx, x + dx * k, y + dy * k, 0.5 * k, 0.8 * k, '#2a1c14'); // knots in the bark
    const clumps: [number, number, number, number, number][] = [[-6, -13, 4.4, 3.6, -0.12], [6, -13.4, 4.4, 3.6, -0.18], [0, -15, 5.4, 4.2, -0.04], [-3.4, -18.4, 4, 3.2, 0.04], [3.6, -18.6, 4, 3.2, 0], [0, -21, 3.6, 2.8, 0.1]];
    for (const [dx, dy, rx, ry, c] of clumps) {
      ellipse(ctx, x + dx * k, y + (dy + 1) * k, rx * k, ry * k, shade(g, c - 0.22));
      ellipse(ctx, x + dx * k, y + dy * k, rx * k, ry * k, shade(g, c));
      for (let i = 0; i < 4; i++) { // the lobed leaves catching the light
        const a = rand(variant + dx, i) * Math.PI * 2;
        ellipse(ctx, x + (dx + Math.cos(a) * rx * 0.5) * k, y + (dy - 0.6 + Math.sin(a) * ry * 0.4) * k, 1 * k, 0.7 * k, shade(g, c + 0.18));
      }
    }
    if (variant % 3 === 0) for (const [dx, dy] of [[-4, -11], [3, -12.4], [1, -16]] as const) { ellipse(ctx, x + dx * k, y + dy * k, 0.5 * k, 0.6 * k, '#9a7030'); ellipse(ctx, x + dx * k, y + (dy - 0.5) * k, 0.55 * k, 0.3 * k, '#5a4020'); } // acorns
    return;
  }
  if (type === 'lime') { // a lime (lipa): a tall rounded dome of bright heart-shaped leaves, with pale yellow blossom
    const g = mix(P.forest, '#6aa040', 0.45);
    line(ctx, x, y, x, y - 9 * k, '#6a5444', 2.2 * k);
    line(ctx, x - 0.5 * k, y, x - 0.5 * k, y - 9 * k, '#8a7464', 0.7 * k);
    const clumps: [number, number, number, number, number][] = [[-4, -11, 4, 4, -0.12], [4, -11.4, 4, 4, -0.18], [0, -14, 5.4, 5, -0.04], [-2.4, -19, 4.2, 3.8, 0.04], [2.6, -19.2, 4, 3.6, 0], [0, -22.4, 3.2, 2.8, 0.1]];
    for (const [dx, dy, rx, ry, c] of clumps) {
      ellipse(ctx, x + dx * k, y + (dy + 1) * k, rx * k, ry * k, shade(g, c - 0.22));
      ellipse(ctx, x + dx * k, y + dy * k, rx * k, ry * k, shade(g, c));
    }
    for (let i = 0; i < 12; i++) { // the blossom
      const a = rand(variant + 11, i) * Math.PI * 2, r = rand(variant + 13, i) * 5;
      ellipse(ctx, x + Math.cos(a) * r * k, y - 15 * k + Math.sin(a) * r * 1.3 * k, 0.6 * k, 0.45 * k, '#f0e090');
    }
    return;
  }
  const birch = (bx: number, by: number, s: number, lean: number, seed: number) => { // white bark ringed with black, a light drooping crown
    const tx = bx + lean * s, ty = by - 17 * s;
    curve(ctx, bx, by, bx + lean * 0.3 * s, by - 9 * s, tx, ty, 1.8 * s, '#c8c0b0');
    curve(ctx, bx - 0.45 * s, by, bx + lean * 0.3 * s - 0.45 * s, by - 9 * s, tx - 0.4 * s, ty, 0.8 * s, '#f8f6f0');
    for (let i = 0; i < 7; i++) { const t = (i + 0.4) / 8, px = bx + (tx - bx) * t, py = by + (ty - by) * t; line(ctx, px - 0.8 * s, py, px + (0.2 + rand(seed, i) * 0.5) * s, py - 0.3 * s, '#2a2624', 0.5 * s); }
    const g = mix(P.forest, '#a8c050', 0.55);
    for (const [dx, dy, rx, ry, c] of [[-3.2, -15, 3, 3.8, -0.1], [3.2, -14.4, 3, 3.6, -0.14], [0.2, -18.6, 3.4, 3.8, 0], [-0.6, -22.4, 2.4, 2.6, 0.08]] as const) {
      ellipse(ctx, tx - lean * s + dx * s, by + (dy + 1) * s, rx * s, ry * s, shade(g, c - 0.2));
      ellipse(ctx, tx - lean * s + dx * s, by + dy * s, rx * s, ry * s, shade(g, c));
    }
    for (let i = 0; i < 10; i++) { // the hanging twigs and catkins
      const a = rand(seed + 3, i) * Math.PI * 2, r = 2.6 + rand(seed + 5, i) * 2.6, px = tx - lean * s + Math.cos(a) * r * s, py = by - 17 * s + Math.sin(a) * r * 0.9 * s;
      line(ctx, px, py, px + 0.2 * s, py + 2.4 * s, shade(g, -0.25), 0.35 * s);
      ellipse(ctx, px + 0.2 * s, py + 2.6 * s, 0.3 * s, 0.6 * s, '#c8b060');
    }
  };
  if (type === 'birch') return birch(x, y, k, 0.6, variant);
  birch(x - 3 * k, y - 1 * k, 0.78 * k, -1, variant);
  birch(x + 2.6 * k, y + 0.6 * k, 0.88 * k, 1, variant + 7);
}

registerArt('poland', {
  unit,
  dress: (kind) => dress(kind),
  torso,
  face,
  head,
  weapon,
  shield: (ctx, kind, x, y, k) => {
    if (kind !== 'defender') return false;
    pavise(ctx, x - 1.4 * k, y, k);
    return true;
  },
  building,
  tree,
});

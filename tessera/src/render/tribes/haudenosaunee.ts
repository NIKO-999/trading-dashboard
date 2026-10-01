// The Haudenosaunee Confederacy of the Eastern Woodlands (the League of the Mohawk, Oneida, Onondaga, Cayuga and Seneca,
// later the Tuscarora), drawn from its material culture: deerskin leggings with beaded side seams and garters, a
// breechcloth of purple wool stroud, soft puckered-toe moccasins; deerskin or calico shirts trimmed with ribbon and
// white-and-purple beadwork; wooden rod-and-slat armour laced with rawhide for the heavy ranks. On the head the
// gustoweh: a fitted cap on a splint frame covered with small feathers, a beaded band, and eagle feathers set in a
// socket (three upright for the Mohawk, one upright for the Seneca, one angled for the Cayuga...), or a roach of red deer
// hair on a shaved scalp. Ball-headed war clubs (gajewa), self bows and bark quivers, rawhide shields painted with a
// clan turtle, and later iron trade tomahawks. Elm- and birch-bark canoes; a log battering ram under a bark mantlet.
// Barrel-roofed elm-bark longhouses with smoke holes along the ridge, behind log palisades; Three Sisters fields of
// maize, beans and squash; a council longhouse and a palisaded gate under a white pine for the capital. Forests of sugar
// maple (some in autumn red and orange), white pine and elm. No masks or other sacred objects are drawn.
import type { BiomePalette } from '../../data/tribes';
import type { UnitKind } from '../../game/types';
import { band, box, ellipse, faceQuad, ink, line, mix, poly, rand, shade, softShadow, type Ctx } from '../prims';
import { registerArt, type Body } from '../tribeart';
import { drawHorse, figure } from '../units';

// ---------------------------------------------------------------- palette

const PURPLE = '#4a3a8a', PURPLE_D = '#2a1e5a', PURPLE_L = '#7a6ab8'; // wampum purple, and the wool stroud dyed to match
const SHELL = '#f4efe0'; // white shell beads
const DEER = '#b08a5a', DEER_D = '#8a6a40', DEER_L = '#d4b282'; // smoked deerskin
const CALICO = '#e8dcc0';
const STROUD = '#8a2a2a'; // red trade wool
const SLAT = '#c0a06a', SLAT_D = '#8a6a3a', SLAT_L = '#dcc08a'; // wooden slats
const HIDE = '#d8c09a', HIDE_D = '#a88a60'; // rawhide
const WOOD = '#6a4226', WOOD_D = '#3e2614', WOOD_L = '#9a6a42';
const BARK = '#8a6a4a', BARK_D = '#5a4430'; // elm bark
const BIRCH = '#ece4d0', BIRCH_D = '#b8ac94';
const IRON = '#6a6e76', IRON_L = '#c8ccd2';
const SKIN = '#b07648', HAIR = '#100c0a';
const ROACH = '#b8281e', ROACH_D = '#7a1810';
const MAIZE = '#e8c040', STALK = '#7aa040', STALK_D = '#4a7028', SQUASH = '#e08a20';
const LOG = '#7a5a3a', LOG_D = '#4e3820', LOG_L = '#a08060';

// ---------------------------------------------------------------- small helpers

/** A point on one visible side of a box, in faceQuad's (u, v) coordinates. */
function pt(face: 'L' | 'R', cx: number, cy: number, w: number, h: number, u: number, v: number): [number, number] {
  return face === 'R' ? [cx + (u * w) / 2, cy + (w / 4) * (1 - u) - v * h] : [cx - w / 2 + (u * w) / 2, cy + (w / 4) * u - v * h];
}
/** A flat polygon on one side of a box. */
function facePoly(ctx: Ctx, face: 'L' | 'R', cx: number, cy: number, w: number, h: number, pts: [number, number][], color: string) {
  poly(ctx, pts.flatMap(([u, v]) => pt(face, cx, cy, w, h, u, v)), face === 'L' ? shade(color, 0.06) : shade(color, -0.2));
}
/** A quadratic stroke. */
function curve(ctx: Ctx, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, w: number, c: string) {
  ctx.strokeStyle = ink(c);
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx, cy, x1, y1);
  ctx.stroke();
}
/** An elliptical outline, or part of one. */
function ring(ctx: Ctx, x: number, y: number, rx: number, ry: number, c: string, w: number, a0 = 0, a1 = Math.PI * 2) {
  ctx.strokeStyle = ink(c);
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, a0, a1);
  ctx.stroke();
}
/** A row of alternating purple and white beads along a line. */
function beads(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, n: number, r: number, start = 0) {
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    ellipse(ctx, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, r, (i + start) % 2 ? PURPLE : SHELL);
  }
}
/** An eagle feather from its quill at (x0, y0) to its tip (x1, y1): white with a dark tip, a fine shaft. */
function feather(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, w: number, tip = '#2a1e16') {
  const len = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
  const at = (t: number, s: number) => [x0 + (x1 - x0) * t + nx * w * s, y0 + (y1 - y0) * t + ny * w * s];
  poly(ctx, [...at(0.08, 0), ...at(0.2, 0.55), ...at(0.7, 0.5), ...at(1, 0), ...at(0.7, -0.45), ...at(0.2, -0.5)], SHELL);
  poly(ctx, [...at(0.66, 0.5), ...at(1, 0), ...at(0.66, -0.45)], tip); // the dark tip of a young eagle's feather
  poly(ctx, [...at(0.2, 0), ...at(0.2, -0.5), ...at(0.66, -0.45), ...at(0.66, 0)], 'rgba(150,140,120,0.35)');
  line(ctx, x0, y0, x0 + (x1 - x0) * 0.95, y0 + (y1 - y0) * 0.95, '#d8d0c0', Math.max(0.3, w * 0.18));
  line(ctx, x0, y0, x0 + (x1 - x0) * 0.12, y0 + (y1 - y0) * 0.12, ROACH, w * 0.5); // a red-wrapped quill
}

// ---------------------------------------------------------------- dress

const HEAVY: UnitKind[] = ['defender', 'swordsman', 'knight', 'giant'];
const isHeavy = (k: UnitKind) => HEAVY.includes(k);

function dress(kind: UnitKind): [string, string, string] {
  switch (kind) {
    case 'mohawk': return [SKIN, DEER, SKIN]; // bare-chested under a wampum sash
    case 'warrior': return [DEER, DEER, DEER]; // a deerskin shirt
    case 'archer': case 'explorer': case 'rider': return [CALICO, DEER, CALICO]; // a calico trade shirt
    case 'swordsman': return [SLAT, DEER, STROUD];
    case 'giant': return [SLAT, DEER_D, PURPLE];
    default: return isHeavy(kind) ? [SLAT, DEER, DEER] : [CALICO, DEER, CALICO];
  }
}

/** Rod-and-slat armour: upright wooden slats laced together with rawhide in rows, between heights v0 and v1. */
function slats(ctx: Ctx, x: number, y: number, w: number, h: number, v0: number, v1: number, n = 6) {
  for (const f of ['L', 'R'] as const) {
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = u0 + 1 / n - 0.02;
      faceQuad(ctx, f, x, y, w, h, u0, u1, v0, v1, i % 2 ? SLAT : SLAT_L);
      faceQuad(ctx, f, x, y, w, h, u1 - 0.03, u1 + 0.02, v0, v1, SLAT_D); // the gap between slats
    }
    for (const t of [0.15, 0.5, 0.85]) { // the rawhide lacing woven across
      const v = v0 + (v1 - v0) * t;
      faceQuad(ctx, f, x, y, w, h, 0, 1, v - 0.03, v + 0.03, HIDE_D);
      for (let i = 0; i < n; i++) faceQuad(ctx, f, x, y, w, h, i / n + 0.05, i / n + 0.1, v - 0.035, v + 0.035, HIDE);
    }
  }
}

/** The breechcloth's front flap of purple stroud hanging below the belt, edged with white ribbon and beads. */
function breechcloth(ctx: Ctx, x: number, y: number, w: number, h: number, c = PURPLE) {
  facePoly(ctx, 'R', x, y, w, h, [[0.26, 0.12], [0.74, 0.12], [0.72, -0.5], [0.28, -0.5]], c);
  facePoly(ctx, 'R', x, y, w, h, [[0.28, -0.4], [0.72, -0.4], [0.72, -0.5], [0.28, -0.5]], SHELL);
  for (const u of [0.34, 0.44, 0.54, 0.64]) facePoly(ctx, 'R', x, y, w, h, [[u, -0.2], [u + 0.05, -0.2], [u + 0.05, -0.28], [u, -0.28]], SHELL); // a beaded band
}

function torso(ctx: Ctx, kind: UnitKind, x: number, y: number, w: number, h: number) {
  const k = w / 10;
  const B = (v0: number, v1: number, c: string) => band(ctx, x, y, w, h, v0, v1, c);
  const R = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, 'R', x, y, w, h, u0, u1, v0, v1, c);
  if (kind === 'mohawk') {
    // bare chest; a sash of wampum purple worn over the right shoulder, beaded white, and a woven belt-sash
    facePoly(ctx, 'R', x, y, w, h, [[0.3, 0.86], [0.42, 0.7], [0.4, 0.5], [0.3, 0.6]], shade(SKIN, -0.08)); // the chest's shading
    // the sash crosses the chest from the right shoulder (the front edge) down to the left hip
    facePoly(ctx, 'L', x, y, w, h, [[0.6, 1], [0.94, 1], [0.32, 0.14], [0, 0.14], [0, 0.32]], PURPLE);
    for (let i = 0; i < 7; i++) { const t = 0.05 + i * 0.15; const [px, py] = pt('L', x, y, w, h, 0.78 - t * 0.66, 1 - t * 0.84); ellipse(ctx, px, py, 0.5 * k, 0.5 * k, SHELL); }
    for (let i = 0; i < 6; i++) { const t = 0.12 + i * 0.15; const [px, py] = pt('L', x, y, w, h, 0.78 - t * 0.66, 1 - t * 0.84); ellipse(ctx, px, py, 0.28 * k, 0.28 * k, PURPLE_L); }
    facePoly(ctx, 'R', x, y, w, h, [[0, 1], [0.3, 1], [0, 0.7]], PURPLE);
    B(0.1, 0.26, PURPLE_D);
    B(0.16, 0.2, SHELL);
    breechcloth(ctx, x, y, w, h);
    // the sash's fringed ends hanging at the hip
    const [kx, ky] = pt('R', x, y, w, h, 0.82, 0.16);
    poly(ctx, [kx - 1 * k, ky, kx + 0.8 * k, ky - 0.3 * k, kx + 1.2 * k, ky + 4.4 * k, kx - 0.4 * k, ky + 4.2 * k], PURPLE);
    for (let i = 0; i < 4; i++) line(ctx, kx - 0.3 * k + i * 0.45 * k, ky + 4.2 * k, kx - 0.3 * k + i * 0.45 * k, ky + 5.6 * k, i % 2 ? SHELL : PURPLE_L, 0.3 * k);
    return;
  }
  if (isHeavy(kind)) {
    B(0, 0.2, kind === 'swordsman' ? STROUD : DEER_D); // the shirt below the armour
    slats(ctx, x, y, w, h, 0.18, 0.92, kind === 'giant' ? 7 : 6);
    B(0.92, 1, kind === 'giant' ? PURPLE : HIDE_D); // a rawhide collar
    B(0.14, 0.22, PURPLE_D); // a woven sash
    B(0.17, 0.19, SHELL);
    if (kind === 'giant' || kind === 'knight') { // a wampum band across the chest
      for (let i = 0; i < 6; i++) R(0.08 + i * 0.15, 0.2 + i * 0.15, 0.62, 0.72, i % 2 ? SHELL : PURPLE);
    }
    breechcloth(ctx, x, y, w, h, kind === 'swordsman' ? STROUD : PURPLE);
    return;
  }
  // shirts: smoked deerskin with a fringed hem, or calico; both with a ribbon-and-bead trim in purple and white
  const base = kind === 'warrior' ? DEER : CALICO;
  if (base === CALICO) for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) R(0.1 + c * 0.24 + (r % 2) * 0.1, 0.15 + c * 0.24 + (r % 2) * 0.1, 0.3 + r * 0.17, 0.36 + r * 0.17, STROUD); // the print
  // the slit neck opening, edged with ribbon
  facePoly(ctx, 'R', x, y, w, h, [[0.38, 1], [0.62, 1], [0.5, 0.72]], SKIN);
  B(0.9, 1, PURPLE);
  B(0.93, 0.96, SHELL);
  // ribbonwork across the chest
  B(0.62, 0.7, PURPLE);
  for (let i = 0; i < 6; i++) { R(0.06 + i * 0.16, 0.12 + i * 0.16, 0.64, 0.68, SHELL); faceQuad(ctx, 'L', x, y, w, h, 0.06 + i * 0.16, 0.12 + i * 0.16, 0.64, 0.68, SHELL); }
  B(0.14, 0.24, PURPLE_D); // a finger-woven sash at the waist
  B(0.18, 0.2, kind === 'archer' ? ROACH : SHELL);
  if (kind === 'warrior') { // a fringed hem below the sash
    for (const f of ['L', 'R'] as const) for (let i = 0; i < 8; i++) faceQuad(ctx, f, x, y, w, h, i / 8 + 0.02, i / 8 + 0.08, -0.12, 0.14, i % 2 ? DEER_D : DEER_L);
  }
  breechcloth(ctx, x, y, w, h);
  if (kind === 'explorer') facePoly(ctx, 'R', x, y, w, h, [[0.1, 1], [0.26, 1], [0.92, 0.26], [0.78, 0.22]], HIDE_D); // a pack strap
}

// ---------------------------------------------------------------- headgear

/**
 * The gustoweh: a fitted cap on a splint frame covered with small turkey feathers, a band of beadwork round the brow,
 * and eagle feathers in a socket on top. `up`: upright feathers; `angled`: feathers laid back at an angle.
 */
function gustoweh(ctx: Ctx, x: number, top: number, k: number, hw: number, up: number, angled: number, bandC = PURPLE) {
  const w = hw + 0.7 * k;
  // the hair under the cap: cut to the neck at the back, the temple and ear left clear
  const hy = top + 10.5 * k;
  faceQuad(ctx, 'L', x, hy, hw, 10.5 * k, 0, 0.62, 0.42, 1, SKIN);
  faceQuad(ctx, 'L', x, hy, hw, 10.5 * k, 0, 0.32, 0.36, 1, HAIR);
  faceQuad(ctx, 'L', x, hy, hw, 10.5 * k, 0.32, 0.4, 0.62, 1, shade(HAIR, 0.15));
  // the brow band, beaded white on purple (or bright trade silver)
  box(ctx, x, top + 2.6 * k, w, 2.6 * k, bandC, shade(bandC, 0.2));
  for (const f of ['L', 'R'] as const) for (let i = 0; i < 5; i++) {
    faceQuad(ctx, f, x, top + 2.6 * k, w, 2.6 * k, 0.08 + i * 0.19, 0.16 + i * 0.19, 0.3, 0.7, i % 2 ? PURPLE_L : SHELL);
  }
  // the domed cap of small feathers over the splint frame
  const cy = top - 0.2 * k, rx = w / 2, ry = w / 4;
  ctx.beginPath();
  ctx.ellipse(x, cy, rx, ry + 2.4 * k, 0, Math.PI, 0);
  ctx.ellipse(x, cy, rx, ry, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fillStyle = ink('#8a6a48');
  ctx.fill();
  for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) { // rows of overlapping feather tips
    const a = Math.PI * (0.05 + i * 0.15), f = 1 - r * 0.3;
    const px = x + Math.cos(a) * rx * f * 0.95, py = cy + Math.sin(a) * ry * f * 0.8 - r * 1 * k - (1 - Math.abs(Math.cos(a))) * 0.6 * k;
    poly(ctx, [px - 0.8 * k, py - 0.6 * k, px + 0.8 * k, py - 0.6 * k, px, py + 1 * k], (i + r) % 3 === 0 ? '#c8b088' : (i + r) % 3 === 1 ? '#6a4a30' : '#a08058');
  }
  ellipse(ctx, x - rx * 0.35, cy - ry * 0.6, rx * 0.25, ry * 0.4, 'rgba(255,255,255,0.18)');
  // the swivel socket on top
  const sx = x, sy = cy - ry - 1.6 * k;
  ellipse(ctx, sx, sy + 0.4 * k, 1.1 * k, 0.7 * k, '#d8d8dc');
  // angled feathers go behind, upright ones in front
  for (let i = 0; i < angled; i++) feather(ctx, sx - 0.2 * k, sy, sx - (7 + i) * k, sy - (4.4 - i * 1.6) * k, 1.5 * k);
  for (let i = 0; i < up; i++) {
    const dx = (i - (up - 1) / 2) * 1.4 * k;
    feather(ctx, sx + dx * 0.4, sy + 0.2 * k, sx + dx * 1.5 + 0.4 * k, sy - (9.6 - Math.abs(dx) * 0.3) * k, 1.5 * k);
  }
  // a little tuft of down at the socket
  ellipse(ctx, sx, sy, 0.9 * k, 0.7 * k, '#ffffff');
}

/** A roach of red-dyed deer hair along a shaved scalp, a spreader of antler at its base and a scalp lock behind. */
function roach(ctx: Ctx, x: number, top: number, k: number, hw: number) {
  const hy = top + 10.5 * k;
  // shave the head: skin on the crown and the sides, the hair kept only along the ridge
  poly(ctx, [x, top - hw / 4, x + hw / 2, top, x, top + hw / 4, x - hw / 2, top], SKIN);
  faceQuad(ctx, 'L', x, hy, hw, 10.5 * k, 0, 0.62, 0.42, 1, shade(SKIN, -0.06));
  const f = [x + hw / 4, top + hw / 8], b = [x - hw / 4, top - hw / 8];
  line(ctx, f[0], f[1], b[0], b[1], HAIR, 1.6 * k);
  // the roach: bristles standing up along the ridge, taller at the back, red outside and darker within
  for (let i = 0; i <= 9; i++) {
    const t = i / 9, px = f[0] + (b[0] - f[0]) * t, py = f[1] + (b[1] - f[1]) * t;
    const hgt = (3 + t * 3.6) * k;
    line(ctx, px, py, px - 0.6 * k - t * 1.6 * k, py - hgt, i % 2 ? ROACH_D : ROACH, 1.1 * k);
    line(ctx, px, py, px - 0.2 * k - t * 0.8 * k, py - hgt * 0.7, '#e8d8b0', 0.35 * k); // the pale porcupine guard hair inside
  }
  ellipse(ctx, f[0] - 0.4 * k, f[1] - 0.6 * k, 1 * k, 0.6 * k, '#e8e0cc'); // the antler spreader's front
  // a single eagle feather in the spreader, swivelling back
  feather(ctx, b[0] + 1 * k, b[1] - 2 * k, b[0] - 5 * k, b[1] - 8 * k, 1.3 * k);
  // the scalp lock hanging behind, wrapped with a purple cord
  curve(ctx, b[0] - 0.4 * k, b[1] + 0.4 * k, b[0] - 1.8 * k, b[1] + 1.4 * k, b[0] - 2 * k, b[1] + 4.2 * k, 0.7 * k, HAIR);
  ellipse(ctx, b[0] - 1.7 * k, b[1] + 1.8 * k, 0.5 * k, 0.5 * k, PURPLE);
}

function head(ctx: Ctx, kind: UnitKind, x: number, top: number, k: number, hw: number) {
  // the figure's shoulder guard would be steel: re-dress it in wood (the head is drawn after the front shoulder)
  if (isHeavy(kind)) {
    const hip = top + 19 * k;
    box(ctx, x + 6 * k, hip - 5 * k, 3.6 * k, 2.2 * k, SLAT, SLAT_L);
    for (const u of [0.3, 0.6]) faceQuad(ctx, 'R', x + 6 * k, hip - 5 * k, 3.6 * k, 2.2 * k, u, u + 0.06, 0, 1, SLAT_D);
    faceQuad(ctx, 'R', x + 6 * k, hip - 5 * k, 3.6 * k, 2.2 * k, 0, 1, 0.45, 0.6, HIDE_D);
  }
  switch (kind) {
    case 'mohawk': gustoweh(ctx, x, top, k, hw, 3, 0); break; // the Mohawk: three upright feathers
    case 'warrior': roach(ctx, x, top, k, hw); break;
    case 'archer': gustoweh(ctx, x, top, k, hw, 1, 0); break; // the Seneca: a single upright feather
    case 'explorer': // hair tied back under a tumpline across the brow
      band(ctx, x, top + 3.4 * k, hw + 0.3 * k, 1.6 * k, 0, 1, HIDE_D);
      ellipse(ctx, x - hw / 2 - 0.6 * k, top + 1 * k, 1.2 * k, 2 * k, HAIR);
      break;
    case 'defender': gustoweh(ctx, x, top, k, hw, 1, 1); break; // the Onondaga: one up, one laid back
    case 'swordsman': gustoweh(ctx, x, top, k, hw, 2, 1, '#c8ccd2'); break; // the Oneida, on a trade-silver band
    case 'rider': gustoweh(ctx, x, top, k, hw, 0, 1); break; // the Cayuga: one angled feather
    case 'knight': gustoweh(ctx, x, top, k, hw, 1, 1, '#c8ccd2'); break;
    case 'giant': gustoweh(ctx, x, top, k, hw, 3, 2, '#c8ccd2'); break;
    default: gustoweh(ctx, x, top, k, hw, 0, 1); break;
  }
}

// ---------------------------------------------------------------- weapons and shields

/** The gajewa: a ball-headed war club of ironwood, its ball held in the curve of the neck, a purple-beaded grip. */
function gajewa(ctx: Ctx, x: number, y: number, k: number, s = 1) {
  const x0 = x - 1 * k, y0 = y + 3.4 * k, x1 = x + 2.6 * k * s, y1 = y - 9 * k * s;
  curve(ctx, x0, y0, x + 0.4 * k, y - 3 * k, x1, y1, 1.6 * k, WOOD_D);
  curve(ctx, x0 - 0.3 * k, y0, x + 0.1 * k, y - 3 * k, x1 - 0.3 * k, y1, 0.6 * k, WOOD_L);
  // the neck curls forward into the ball
  const bx = x1 + 3 * k * s, by = y1 - 1.6 * k * s, r = 2.3 * k * s;
  curve(ctx, x1, y1, x1 + 0.6 * k, y1 - 2.4 * k * s, bx - r * 0.6, by + r * 0.2, 1.5 * k, WOOD_D);
  ellipse(ctx, bx + 0.3 * k, by + 0.3 * k, r, r, WOOD_D);
  ellipse(ctx, bx, by, r * 0.95, r * 0.95, WOOD);
  ellipse(ctx, bx - r * 0.35, by - r * 0.35, r * 0.35, r * 0.3, 'rgba(255,230,200,0.45)');
  // the grip: beaded bands and a purple wrap; an eagle feather tied at the butt
  beads(ctx, x - 0.7 * k, y + 1 * k, x - 0.4 * k, y - 0.8 * k, 3, 0.55 * k);
  line(ctx, x0, y0, x0 - 0.2 * k, y0 + 1.6 * k, PURPLE, 1.4 * k);
  feather(ctx, x0 - 0.2 * k, y0 + 1.4 * k, x0 - 2 * k, y0 + 6.6 * k, 1.1 * k);
}

/** An iron trade tomahawk on a hide-wrapped haft, with a purple-and-white quilled band and a hanging feather. */
function tomahawk(ctx: Ctx, x: number, y: number, k: number) {
  const x0 = x - 1.4 * k, y0 = y + 3.6 * k, x1 = x + 2.4 * k, y1 = y - 11 * k;
  line(ctx, x0, y0, x1, y1, WOOD_D, 1.4 * k);
  line(ctx, x0 - 0.3 * k, y0, x1 - 0.3 * k, y1, WOOD_L, 0.45 * k);
  for (let i = 0; i < 4; i++) { const t = 0.15 + i * 0.08; const px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t; line(ctx, px - 0.8 * k, py, px + 0.8 * k, py - 0.2 * k, i % 2 ? PURPLE : SHELL, 0.6 * k); }
  // the iron head: a narrow socket flaring to a broad curved bit, facing forward
  const hx = x1 - 0.2 * k, hy = y1 + 1.2 * k;
  poly(ctx, [hx - 1.2 * k, hy - 1.2 * k, hx + 1 * k, hy - 1.4 * k, hx + 5.6 * k, hy - 3.4 * k, hx + 6 * k, hy + 1.4 * k, hx + 1 * k, hy + 0.8 * k, hx - 1.2 * k, hy + 1 * k], IRON);
  poly(ctx, [hx + 1 * k, hy - 1.4 * k, hx + 5.6 * k, hy - 3.4 * k, hx + 5.6 * k, hy - 1 * k, hx + 1 * k, hy - 0.2 * k], IRON_L);
  curve(ctx, hx + 5.6 * k, hy - 3.4 * k, hx + 6.6 * k, hy - 1 * k, hx + 6 * k, hy + 1.4 * k, 0.5 * k, '#f0f2f4'); // the bright edge
  poly(ctx, [hx - 1.2 * k, hy - 1.2 * k, hx - 3 * k, hy - 0.4 * k, hx - 1.2 * k, hy + 0.6 * k], IRON); // a short spike behind
  line(ctx, hx + 0.6 * k, hy + 1 * k, hx + 0.6 * k, hy + 4 * k, HIDE_D, 0.4 * k);
  feather(ctx, hx + 0.6 * k, hy + 3.8 * k, hx + 1.6 * k, hy + 8.6 * k, 1 * k);
}

/** A self bow of hickory, strung, with an arrow nocked across it. */
function bow(ctx: Ctx, x: number, y: number, k: number) {
  const bx = x + 3.6 * k, top = y - 12.6 * k, bot = y + 7.4 * k;
  curve(ctx, bx - 1 * k, top, bx + 5.2 * k, (top + bot) / 2, bx - 1 * k, bot, 1.4 * k, WOOD_D);
  curve(ctx, bx - 1.3 * k, top, bx + 4.6 * k, (top + bot) / 2, bx - 1.3 * k, bot, 0.5 * k, WOOD_L);
  ellipse(ctx, bx + 2.1 * k, (top + bot) / 2, 0.9 * k, 1.6 * k, PURPLE); // a wrapped grip
  line(ctx, bx - 1 * k, top, x - 2.4 * k, y - 2.4 * k, '#e8e0cc', 0.4 * k); // the string drawn back
  line(ctx, bx - 1 * k, bot, x - 2.4 * k, y - 2.4 * k, '#e8e0cc', 0.4 * k);
  line(ctx, x - 3.4 * k, y - 2.2 * k, bx + 6 * k, y - 3.4 * k, '#c8a878', 0.6 * k); // the arrow
  poly(ctx, [bx + 6 * k, y - 4.2 * k, bx + 8.2 * k, y - 3.5 * k, bx + 6 * k, y - 2.6 * k], '#5a5048'); // a chert point
  poly(ctx, [x - 3.4 * k, y - 2.2 * k, x - 1.4 * k, y - 2.6 * k, x - 1.6 * k, y - 3.6 * k], SHELL);
  poly(ctx, [x - 3.4 * k, y - 2.2 * k, x - 1.4 * k, y - 2.4 * k, x - 1.8 * k, y - 1.2 * k], '#6a4a30');
}

/** A long spear: an ash shaft, a chipped point, and a small spray of feathers below it. */
function spear(ctx: Ctx, x: number, y: number, k: number) {
  const x0 = x - 1.8 * k, y0 = y + 6.4 * k, x1 = x + 3 * k, y1 = y - 19 * k;
  line(ctx, x0, y0, x1, y1, WOOD, 1.2 * k);
  line(ctx, x0 - 0.3 * k, y0, x1 - 0.3 * k, y1, WOOD_L, 0.4 * k);
  poly(ctx, [x1 - 1.2 * k, y1 + 0.6 * k, x1 + 1.2 * k, y1 + 0.2 * k, x1 + 0.6 * k, y1 - 5.6 * k], '#4a4644');
  poly(ctx, [x1 - 0.1 * k, y1 + 0.4 * k, x1 + 1.2 * k, y1 + 0.2 * k, x1 + 0.6 * k, y1 - 5.6 * k], '#7a7470');
  beads(ctx, x1 - 0.2 * k, y1 + 1.4 * k, x1 - 0.5 * k, y1 + 3.2 * k, 3, 0.5 * k);
  feather(ctx, x1 - 0.4 * k, y1 + 2 * k, x1 - 3.4 * k, y1 + 6.4 * k, 1 * k);
}

/** A round rawhide shield with laced rim, painted with the turtle of the Turtle Clan and a ring of purple. */
function hideShield(ctx: Ctx, cx: number, cy: number, r: number, k: number) {
  ellipse(ctx, cx + 0.8 * k, cy + 0.6 * k, r, r * 1.04, HIDE_D);
  ellipse(ctx, cx, cy, r, r * 1.04, HIDE);
  ellipse(ctx, cx - r * 0.3, cy - r * 0.35, r * 0.45, r * 0.4, 'rgba(255,250,230,0.35)');
  ring(ctx, cx, cy, r * 0.82, r * 0.86, PURPLE, 0.9 * k);
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; ellipse(ctx, cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.96, 0.3 * k, 0.3 * k, '#5a4028'); } // the lacing holes
  // the turtle, head up
  const s = r / (5.5 * k);
  for (const [dx, dy] of [[-1.9, -1.4], [1.9, -1.4], [-1.9, 1.5], [1.9, 1.5]] as const) ellipse(ctx, cx + dx * k * s, cy + dy * k * s, 0.8 * k * s, 0.6 * k * s, '#3a2a1a');
  ellipse(ctx, cx, cy - 2.6 * k * s, 0.75 * k * s, 0.9 * k * s, '#3a2a1a');
  ellipse(ctx, cx, cy + 0.1 * k * s, 1.9 * k * s, 2.2 * k * s, '#3a2a1a');
  ellipse(ctx, cx, cy, 1.3 * k * s, 1.5 * k * s, '#5a4028');
  line(ctx, cx, cy + 2.2 * k * s, cx, cy + 3.2 * k * s, '#3a2a1a', 0.5 * k * s);
  ring(ctx, cx, cy, r, r * 1.04, '#5a4028', 0.6 * k);
  // hanging feathers at the bottom
  for (const d of [-0.4, 0.4]) feather(ctx, cx + d * r, cy + r * 0.9, cx + d * r * 1.3, cy + r * 0.9 + 4 * k, 0.9 * k);
}

/** A bark quiver on the back with its arrows. */
function quiver(ctx: Ctx, x: number, y: number, k: number) {
  const qx = x - 6.6 * k;
  box(ctx, qx, y - 8 * k, 3.4 * k, 9 * k, BARK);
  for (const v of [0.3, 0.62]) band(ctx, qx, y - 8 * k, 3.4 * k, 9 * k, v, v + 0.06, BARK_D);
  band(ctx, qx, y - 8 * k, 3.4 * k, 9 * k, 0.86, 0.96, PURPLE);
  for (const i of [-1, 0, 1]) {
    const tx = qx - 1.2 * k + i * 1.1 * k;
    line(ctx, qx + i * 0.7 * k, y - 17.2 * k, tx, y - 21.4 * k, '#c8a878', 0.6 * k);
    poly(ctx, [tx, y - 21.4 * k, tx - 0.9 * k, y - 23.4 * k, tx + 0.4 * k, y - 22.2 * k], i ? SHELL : '#6a4a30');
  }
}

/** A pack basket of black-ash splints, carried with a tumpline. */
function packBasket(ctx: Ctx, x: number, y: number, k: number) {
  const bx = x - 5.8 * k, by = y - 5.6 * k;
  box(ctx, bx, by, 5 * k, 8 * k, '#c8a86a', '#a8884a');
  for (let i = 1; i < 6; i++) band(ctx, bx, by, 5 * k, 8 * k, i / 6, i / 6 + 0.05, '#8a6a3a');
  for (const f of ['L', 'R'] as const) for (const u of [0.25, 0.5, 0.75]) faceQuad(ctx, f, bx, by, 5 * k, 8 * k, u, u + 0.06, 0, 1, '#a8884a');
  band(ctx, bx, by, 5 * k, 8 * k, 0.4, 0.5, PURPLE); // a dyed splint
  ellipse(ctx, bx, by - 8.4 * k, 2.4 * k, 1.1 * k, '#6a5030'); // a bedroll on top
}

function weapon(ctx: Ctx, kind: UnitKind, b: Body, k: number): boolean {
  const { x, y } = b.hand;
  switch (kind) {
    case 'warrior': case 'mohawk': gajewa(ctx, x, y, k); return true;
    case 'giant': gajewa(ctx, x, y, k, 1.25); return true;
    case 'archer': bow(ctx, x, y, k); return true;
    case 'defender': spear(ctx, x, y, k); return true;
    case 'swordsman': tomahawk(ctx, x, y, k); return true;
    case 'explorer': line(ctx, x - 1 * k, y + 6 * k, x + 2 * k, y - 14 * k, WOOD_L, 0.9 * k); return true; // a walking staff
  }
  return false;
}

function shield(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number): boolean {
  hideShield(ctx, x - 1.4 * k, y - 5.6 * k, (kind === 'defender' ? 6.6 : 5.4) * k, k);
  return true;
}

// ---------------------------------------------------------------- figures on foot

const LEGS = [[-2.2, -0.3, 'L'], [2.2, 0.7, 'R'], [2.2, 0.7, 'L']] as const;

/** Deerskin leggings with a beaded seam flap and garters below the knee, and puckered-toe moccasins. */
function legs(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  const leg = dress(kind)[1];
  for (const [dx, dy, f] of LEGS) {
    const q = (u0: number, u1: number, v0: number, v1: number, c: string) => faceQuad(ctx, f, x + dx * k, y + dy * k, 3.6 * k, 5.2 * k, u0, u1, v0, v1, c);
    q(0, 1, 0.2, 1, leg); // covers the steel greaves the shared figure gives the heavy ranks
    q(0, 1, 0.82, 0.88, shade(leg, -0.2));
    q(0, 1, 0.6, 0.7, PURPLE); // a finger-woven garter
    q(0.3, 0.6, 0.62, 0.68, SHELL);
    if (f === 'L') { q(0, 0.18, 0.2, 0.6, shade(leg, 0.12)); for (const v of [0.26, 0.38, 0.5]) q(0.02, 0.14, v, v + 0.05, v === 0.38 ? PURPLE : SHELL); } // the side flap with its beading
    q(0, 1, 0, 0.22, DEER_L); // the moccasin
    q(0, 1, 0.16, 0.24, PURPLE); // its cuff, with ribbon
    q(0.25, 0.7, 0.18, 0.22, SHELL);
  }
  faceQuad(ctx, 'R', x + 2.2 * k, y + 0.7 * k, 3.6 * k, 5.2 * k, 0, 0.35, 0, 0.13, shade(DEER_L, -0.25)); // the puckered toe
  faceQuad(ctx, 'R', x + 2.2 * k, y + 0.7 * k, 3.6 * k, 5.2 * k, 0.08, 0.26, 0.06, 0.11, PURPLE_L); // a little beaded vamp
}

function footUnit(ctx: Ctx, kind: UnitKind, x: number, y: number, k: number) {
  if (kind === 'archer') quiver(ctx, x, y, k);
  if (kind === 'explorer') packBasket(ctx, x, y, k);
  const b = figure(ctx, kind, 'haudenosaunee', x, y, k);
  legs(ctx, kind, x, y, k);
  if (kind === 'explorer') { // the tumpline from the brow back to the basket
    line(ctx, x - 5 * k, b.top + 4.2 * k, x - 7.4 * k, y - 11 * k, HIDE_D, 0.7 * k);
  }
  weapon(ctx, kind, b, k);
  if (kind === 'defender' || kind === 'giant') shield(ctx, kind, b.off.x, b.off.y, k);
}

// ---------------------------------------------------------------- riders (after contact, on small hardy horses)

function rider(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  const knight = kind === 'knight';
  const saddle = drawHorse(ctx, x - 1, y + 3, 0.92, knight ? '#3a2a1e' : '#7a4a2a', '#140c08', undefined, PURPLE);
  // a trade blanket of purple wool with a white stripe, a pad saddle
  poly(ctx, [saddle.x - 4, saddle.y + 1.2, saddle.x + 3.2, saddle.y + 0.8, saddle.x + 3.6, saddle.y + 5, saddle.x - 3.6, saddle.y + 5.6], PURPLE);
  line(ctx, saddle.x - 3.7, saddle.y + 4.4, saddle.x + 3.5, saddle.y + 3.8, SHELL, 0.9);
  for (let i = 0; i < 6; i++) line(ctx, saddle.x - 3.4 + i * 1.3, saddle.y + 5.5 - i * 0.1, saddle.x - 3.4 + i * 1.3, saddle.y + 6.6 - i * 0.1, PURPLE_D, 0.4); // fringe
  // an eagle feather tied in the horse's forelock, a beaded bridle
  feather(ctx, x + 7.6, y - 17.6, x + 5.4, y - 22.6, 1);
  beads(ctx, x + 6.6, y - 15.4, x + 10.6, y - 12.6, 5, 0.45);
  const b = figure(ctx, kind, 'haudenosaunee', saddle.x, saddle.y, 0.9, true);
  if (knight) {
    hideShield(ctx, b.off.x - 2.2, b.off.y - 3, 4.4, 0.72);
    spear(ctx, b.hand.x, b.hand.y + 1, 0.95);
  } else {
    gajewa(ctx, b.hand.x, b.hand.y + 0.6, 0.85);
  }
}

// ---------------------------------------------------------------- the log ram under a bark mantlet

function ram(ctx: Ctx, x: number, y: number) {
  softShadow(ctx, x, y + 2, 20, 6, 0.28);
  const P3 = (u: number, v: number, z: number): [number, number] => [x + u - v, y + (u + v) / 2 - z];
  const A = 9, H = 13, W = 5; // half-length, ridge height, half-width at the feet
  // log rollers under the frame
  for (const u of [-8, 0, 8]) {
    const [a, b] = P3(u, W + 1.5, 0), [c, d] = P3(u, -W - 1.5, 0);
    line(ctx, a, b, c, d, LOG_D, 2.6);
    line(ctx, a, b - 0.6, c, d - 0.6, LOG, 1.5);
    ellipse(ctx, a, b, 1.3, 1.3, LOG_L);
  }
  // the far legs of the two A-frames, and the far slope of the bark mantlet
  for (const u of [-A, A]) { const [a, b] = P3(u, -W, 0), [c, d] = P3(u, 0, H); line(ctx, a, b, c, d, LOG_D, 1.4); }
  poly(ctx, [...P3(-A - 1.5, 0, H + 0.6), ...P3(A + 1.5, 0, H + 0.6), ...P3(A + 1.5, -W - 1, H - 6), ...P3(-A - 1.5, -W - 1, H - 6)], BARK_D);
  // the hanging log: slung on two ropes from the ridge, its sharpened end out in front
  const l0 = P3(-A - 2, 0, 5), l1 = P3(A + 7, 0, 5);
  for (const u of [-4, 4]) { const [a, b] = P3(u, 0, H), [c, d] = P3(u, 0, 5.8); line(ctx, a, b, c, d, '#c8b088', 0.6); }
  line(ctx, l0[0], l0[1], l1[0], l1[1], LOG_D, 4);
  line(ctx, l0[0], l0[1] - 0.9, l1[0], l1[1] - 0.9, LOG, 2.4);
  line(ctx, l0[0], l0[1] - 1.7, l1[0], l1[1] - 1.7, LOG_L, 0.6);
  for (const t of [0.2, 0.45, 0.7]) { const px = l0[0] + (l1[0] - l0[0]) * t, py = l0[1] + (l1[1] - l0[1]) * t; line(ctx, px - 0.6, py - 2, px + 0.2, py + 1.4, LOG_D, 0.5); } // the bark's ridges
  poly(ctx, [l1[0] - 1.2, l1[1] - 2.4, l1[0] + 3.6, l1[1] + 0.8, l1[0] - 0.8, l1[1] + 1.8], '#c8a878'); // the hewn point
  ellipse(ctx, l0[0], l0[1] - 0.6, 1.3, 2, LOG_L);
  // the near legs, then the near slope: slabs of elm bark to turn arrows and stones, held by two poles
  for (const u of [-A, A]) { const [a, b] = P3(u, W, 0), [c, d] = P3(u, 0, H); line(ctx, a, b, c, d, LOG, 1.5); }
  const nearSlope = [P3(-A - 1.5, 0, H + 0.6), P3(A + 1.5, 0, H + 0.6), P3(A + 1.5, W + 1, H - 6), P3(-A - 1.5, W + 1, H - 6)];
  poly(ctx, nearSlope.flat(), BARK);
  for (let i = 1; i < 6; i++) { const u = -A - 1.5 + (i * (2 * A + 3)) / 6; line(ctx, ...P3(u, 0, H + 0.6), ...P3(u, W + 1, H - 6), BARK_D, 0.5); }
  for (const t of [0.35, 0.8]) line(ctx, ...P3(-A - 1.5, (W + 1) * t, H + 0.6 - 6.6 * t), ...P3(A + 1.5, (W + 1) * t, H + 0.6 - 6.6 * t), LOG_D, 0.8);
  line(ctx, ...P3(-A - 2, 0, H + 0.8), ...P3(A + 2, 0, H + 0.8), LOG_D, 1.3); // the ridge pole
  // a pennant of purple and white strips on the front
  const [fx, fy] = P3(A + 2, 0, H + 0.8);
  line(ctx, fx, fy, fx, fy - 7, WOOD_D, 0.7);
  for (let i = 0; i < 3; i++) line(ctx, fx, fy - 6.6 + i * 1.2, fx + 4.6, fy - 6 + i * 1.2 + (i % 2) * 0.6, i % 2 ? SHELL : PURPLE, 1);
  // the crew: two warriors in front, hauling the log back on its ropes
  for (const [u, v] of [[-5, 10], [3, 11]] as const) {
    const [px, py] = P3(u, v, 0);
    const b = figure(ctx, 'warrior', 'haudenosaunee', px, py, 0.55);
    legs(ctx, 'warrior', px, py, 0.55);
    const [lx, ly] = P3(u - 2, 0, 5);
    line(ctx, b.hand.x, b.hand.y, lx, ly - 1, '#c8b088', 0.5);
  }
}

// ---------------------------------------------------------------- canoes

/** A paddle dipping into the water from the gunwale. */
function paddle(ctx: Ctx, x: number, y: number, len: number, phase: number) {
  const ex = x - 2 - phase * 1.6, ey = y + len;
  line(ctx, x + 0.8, y - 2.4, ex, ey, WOOD_L, 0.7);
  ellipse(ctx, ex - 0.3, ey + 0.3, 0.9, 1.7, WOOD);
  ellipse(ctx, ex - 0.3, ey + 1.6, 1.8, 0.6, 'rgba(255,255,255,0.55)');
}

/** A bark canoe, `w` its half-length: high curved ends, a stitched gunwale, the crew drawn inside by `crew`. */
function canoe(ctx: Ctx, x: number, y: number, w: number, birch: boolean, crew: (top: (t: number) => number) => void) {
  const bark = birch ? BIRCH : BARK, barkD = birch ? BIRCH_D : BARK_D;
  const lift = birch ? 7 : 4.6;
  const top = (t: number) => y - 3.4 - Math.pow(Math.abs(t), 4) * lift;
  const near: [number, number][] = [];
  for (let i = 0; i <= 16; i++) { const t = -1 + i / 8; near.push([x + t * w, top(t)]); }
  const far = near.map(([px, py], i): [number, number] => [px + (i === 0 ? 1.4 : i === 16 ? -1.4 : 0), py - 2]);
  poly(ctx, [...near.flat(), ...[...far].reverse().flat()], '#3a2818'); // the inside of the far wall
  for (let i = 1; i < 6; i++) { const t = -0.8 + i * 0.27; line(ctx, x + t * w, top(t) - 1.8, x + t * w + 0.6, top(t) + 0.4, WOOD_L, 0.7); } // thwarts
  crew(top);
  // the near side: bark, lit above, a dark seam below, with the curved ends rising
  const hull = [...near, [x + w * 0.9, y - 0.2], [x + w * 0.5, y + 1.8], [x, y + 2.2], [x - w * 0.5, y + 1.8], [x - w * 0.9, y - 0.2]] as [number, number][];
  poly(ctx, hull.flat(), barkD);
  poly(ctx, [...near.flat(), x + w * 0.85, y - 1.6, x, y - 1, x - w * 0.85, y - 1.6], bark);
  ctx.strokeStyle = ink(birch ? '#4a3a2a' : WOOD_L); // the gunwale
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  near.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)));
  ctx.stroke();
  // the root lacing along the gunwale and the bark panel seams; birch bark's dark lenticels
  for (let i = 1; i < 16; i++) { const [a, b] = near[i]; line(ctx, a, b, a + 0.3, b + 1.2, birch ? '#6a5a4a' : BARK_D, 0.35); }
  for (const t of [-0.55, -0.15, 0.25, 0.62]) line(ctx, x + t * w, top(t) + 1, x + t * w - 0.3, y + 1.6, birch ? '#8a7a64' : shade(BARK_D, -0.2), 0.45);
  if (birch) for (let i = 0; i < 14; i++) { const t = -0.85 + (i / 13) * 1.7; const py = top(t) + 1.6 + (i % 3) * 0.8; line(ctx, x + t * w - 0.7, py, x + t * w + 0.7, py, '#5a4a3a', 0.35); }
  // the curved end pieces, painted with a purple band and white dots
  for (const s of [-1, 1]) {
    const ex = x + s * w, ey = top(s);
    curve(ctx, ex - s * 2.2, ey + 3.6, ex + s * 0.8, ey + 1, ex - s * 0.2, ey - 0.6, 1.1, birch ? '#4a3a2a' : BARK_D);
    ellipse(ctx, ex - s * 2.4, ey + 3, 1.2, 1, PURPLE);
    ellipse(ctx, ex - s * 2.4, ey + 3, 0.45, 0.45, SHELL);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y + 2.2, w * 0.8, 1.8, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.stroke();
}

function boats(ctx: Ctx, kind: UnitKind, x: number, y: number) {
  if (kind === 'boat') {
    // an elm-bark canoe with two paddlers
    const w = 15;
    canoe(ctx, x, y, w, false, (top) => {
      for (const [t, kd] of [[-0.45, 'warrior'], [0.4, 'archer']] as const) figure(ctx, kd, 'haudenosaunee', x + t * w, top(t) + 2.4, 0.46, true);
    });
    paddle(ctx, x - 0.45 * w + 2.6, y - 6, 8, 0);
    paddle(ctx, x + 0.4 * w + 2.6, y - 6, 8, 1);
    return;
  }
  if (kind === 'ship') {
    // a larger birch-bark canoe: four paddlers and a load of bundled furs
    const w = 21;
    canoe(ctx, x, y, w, true, (top) => {
      box(ctx, x + 0.05 * w, top(0.05) + 1.4, 4, 2.6, '#6a4a30', '#8a6a48');
      band(ctx, x + 0.05 * w, top(0.05) + 1.4, 4, 2.6, 0.4, 0.6, PURPLE);
      for (const [t, kd] of [[-0.66, 'warrior'], [-0.32, 'archer'], [0.32, 'warrior'], [0.64, 'archer']] as const) figure(ctx, kd, 'haudenosaunee', x + t * w, top(t) + 2.4, 0.44, true);
    });
    for (const [t, p] of [[-0.66, 0], [-0.32, 1], [0.32, 0], [0.64, 1]] as const) paddle(ctx, x + t * w + 2.4, y - 5.8, 8, p);
    return;
  }
  // the warship: a great war canoe with seven paddlers, a war chief at the stern and a purple-and-white pennant
  const w = 28;
  canoe(ctx, x, y, w, true, (top) => {
    const ts = [-0.62, -0.42, -0.22, -0.02, 0.18, 0.38, 0.58];
    ts.forEach((t, i) => figure(ctx, i % 3 === 1 ? 'archer' : 'warrior', 'haudenosaunee', x + t * w, top(t) + 2.4, 0.44, true));
    const c = figure(ctx, 'swordsman', 'haudenosaunee', x - 0.82 * w, top(-0.82) + 3.6, 0.46, true);
    line(ctx, c.hand.x, c.hand.y, c.hand.x + 3, c.hand.y + 7, WOOD_L, 0.8); // the steering paddle
  });
  for (let i = 0; i < 7; i++) paddle(ctx, x + (-0.62 + i * 0.2) * w + 2.4, y - 5.8, 8, i % 2);
  // the pennant at the bow: strips of purple and white, like a wampum belt
  const px = x + w * 0.86, py = y - 10;
  line(ctx, px, py + 6, px, py - 12, WOOD_D, 0.8);
  for (let i = 0; i < 4; i++) poly(ctx, [px, py - 12 + i * 1.6, px + 7.6 - i * 0.4, py - 11.4 + i * 1.6, px + 7.2 - i * 0.4, py - 10 + i * 1.6, px, py - 10.4 + i * 1.6], i % 2 ? SHELL : PURPLE);
  ellipse(ctx, px + 3.6, py - 9.2, 0.9, 0.7, SHELL);
}

// ---------------------------------------------------------------- buildings

type Pt2 = [number, number];
/** Iso point at (u, v, z) from the centre: u runs down to the right, v down to the left, z up. */
const P = (cx: number, cy: number, u: number, v: number, z = 0): Pt2 => [cx + u - v, cy + (u + v) / 2 - z];

/**
 * A longhouse: a long frame of saplings bent into a barrel roof and sheathed in slabs of elm bark held down by poles,
 * a door hung with a hide at the visible end, smoke holes along the ridge. Half-length A along u, half-width B, low
 * walls of height H under a roof rising R more.
 */
function longhouse(ctx: Ctx, cx: number, cy: number, A: number, B: number, H: number, R: number, roofC: string, holes = 3) {
  ellipse(ctx, cx + 2, cy + 2, A * 1.25, B * 1.1 + A * 0.2, 'rgba(0,0,0,0.16)');
  const bark = roofC;
  const Q = (u: number, th: number): Pt2 => P(cx, cy, u, B * Math.cos(th), H + R * Math.sin(th));
  // the long side wall facing us, and its bark panels
  poly(ctx, [...P(cx, cy, -A, B), ...P(cx, cy, A, B), ...P(cx, cy, A, B, H), ...P(cx, cy, -A, B, H)], shade(bark, 0.02));
  for (let i = 1; i < 6; i++) { const u = -A + (2 * A * i) / 6; line(ctx, ...P(cx, cy, u, B), ...P(cx, cy, u, B, H), shade(bark, -0.3), 0.5); }
  // the barrel roof, strip by strip from the far side to the near side
  const n = 10;
  for (let i = n; i > 0; i--) {
    const t0 = (Math.PI * i) / n, t1 = (Math.PI * (i - 1)) / n, tm = (t0 + t1) / 2;
    const lit = 0.12 * Math.sin(tm) + 0.1 * Math.cos(tm) - 0.06;
    poly(ctx, [...Q(-A, t0), ...Q(A, t0), ...Q(A, t1), ...Q(-A, t1)], shade(bark, lit));
    if (i % 2 === 0 && tm < Math.PI * 0.8) line(ctx, ...Q(-A, t1), ...Q(A, t1), shade(bark, lit - 0.18), 0.45); // the slab seams
  }
  // the outer poles that pin the bark down, bent over the roof
  const poles = Math.max(4, Math.round(A / 2.6));
  for (let j = 0; j <= poles; j++) {
    const u = -A + 0.6 + ((2 * A - 1.2) * j) / poles;
    ctx.strokeStyle = ink(shade(bark, -0.38));
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let s = 0; s <= 10; s++) { const th = (Math.PI * 0.78 * (10 - s)) / 10 + 0.0; const [px, py] = Q(u, th); s ? ctx.lineTo(px, py - 0.2) : ctx.moveTo(px, py - 0.2); }
    ctx.stroke();
  }
  // a ridge pole, and the smoke holes with their bark covers propped open
  line(ctx, ...Q(-A, Math.PI / 2), ...Q(A, Math.PI / 2), shade(bark, -0.32), 0.8);
  for (let j = 0; j < holes; j++) {
    const u = -A + (2 * A * (j + 0.5)) / holes;
    const [hx, hy] = Q(u, Math.PI / 2);
    ellipse(ctx, hx, hy, 1.5, 0.75, '#1e140c');
    poly(ctx, [hx - 1.6, hy - 0.4, hx + 1.4, hy - 1.2, hx + 2.2, hy - 3, hx - 0.8, hy - 2.4], shade(bark, 0.15)); // the propped cover
    for (let s = 0; s < 3; s++) ellipse(ctx, hx - 0.6 - s * 1.2, hy - 2.6 - s * 2.4, 1.1 + s * 0.5, 0.9 + s * 0.4, `rgba(220,220,225,${0.4 - s * 0.11})`);
  }
  // the near end: the wall under the arch, a doorway hung with a hide, a porch post on each side
  const endPts = [P(cx, cy, A, B), P(cx, cy, A, -B), P(cx, cy, A, -B, H), ...Array.from({ length: 13 }, (_, s) => Q(A, Math.PI * (s / 12))).reverse(), P(cx, cy, A, B, H)];
  poly(ctx, endPts.flat(), shade(bark, -0.22));
  for (const v of [-B * 0.5, B * 0.5]) line(ctx, ...P(cx, cy, A, v), ...P(cx, cy, A, v, H + R * Math.sqrt(1 - 0.25) * 0.98), shade(bark, -0.42), 0.5);
  const dw = Math.min(1.8, B * 0.4), dh = H + R * 0.62;
  poly(ctx, [...P(cx, cy, A, dw), ...P(cx, cy, A, -dw), ...P(cx, cy, A, -dw, dh), ...P(cx, cy, A, dw, dh)], '#1e140c');
  poly(ctx, [...P(cx, cy, A, dw), ...P(cx, cy, A, dw * 0.1), ...P(cx, cy, A, dw * 0.1, dh), ...P(cx, cy, A, dw, dh)], DEER_D); // the hide door, half drawn aside
  // the clan's turtle painted over the door
  const [tx, ty] = P(cx, cy, A, 0, dh + R * 0.22);
  ellipse(ctx, tx, ty, 1.1, 0.8, '#2a1a10');
  for (const [dx, dy] of [[-1, -0.6], [1, -0.6], [-1, 0.6], [1, 0.6]] as const) ellipse(ctx, tx + dx, ty + dy, 0.35, 0.3, '#2a1a10');
  // the end arch's rim
  ctx.strokeStyle = ink(shade(bark, -0.45));
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  for (let s = 0; s <= 12; s++) { const [px, py] = Q(A, Math.PI * (s / 12)); s ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.stroke();
}

/** A run of palisade stakes from (u0, v0) to (u1, v1): logs with sharpened tops, lashed to a rail. */
function palisade(ctx: Ctx, cx: number, cy: number, u0: number, v0: number, u1: number, v1: number, h: number, seed = 0) {
  const len = Math.hypot(u1 - u0, v1 - v0), n = Math.max(2, Math.round(len / 1.5));
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = u0 + (u1 - u0) * t, v = v0 + (v1 - v0) * t;
    const hh = h + (rand(seed + 7, i) - 0.5) * 1.6;
    const [bx, by] = P(cx, cy, u, v), [, ty] = P(cx, cy, u, v, hh);
    line(ctx, bx, by, bx, ty + 0.8, LOG_D, 1.5);
    line(ctx, bx - 0.35, by, bx - 0.35, ty + 0.8, i % 2 ? LOG : LOG_L, 0.7);
    poly(ctx, [bx - 0.75, ty + 1, bx + 0.75, ty + 1, bx, ty - 0.6], LOG_L);
  }
  for (const f of [0.3, 0.72]) line(ctx, ...P(cx, cy, u0, v0, h * f), ...P(cx, cy, u1, v1, h * f), LOG_D, 0.7);
}

/** A Three Sisters field: hills of maize, the bean vines climbing the stalks, broad squash leaves on the ground. */
function maizeField(ctx: Ctx, cx: number, cy: number, cols: number, rows: number, sp = 4, seed = 0) {
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const u = (c - (cols - 1) / 2) * sp, v = (r - (rows - 1) / 2) * sp;
    const [x, y] = P(cx, cy, u, v);
    ellipse(ctx, x, y, 2, 1, '#7a5a34'); // the hill
    ellipse(ctx, x - 0.3, y - 0.3, 1.5, 0.7, '#9a7444');
    // squash leaves and a squash
    ellipse(ctx, x + 1.8, y + 0.6, 1.4, 0.8, '#3a7028');
    ellipse(ctx, x - 1.8, y + 0.4, 1.2, 0.7, '#4a8030');
    if ((r + c + seed) % 3 === 0) ellipse(ctx, x + 1.2, y + 1, 0.9, 0.7, SQUASH);
    // two or three stalks
    for (let s = 0; s < 3; s++) {
      if (s === 2 && (r + c + seed) % 2) continue;
      const sx = x + (s - 1) * 0.9, h = 7 + rand(seed + r * 7 + c, s) * 2.4;
      line(ctx, sx, y, sx + 0.3, y - h, STALK_D, 0.7);
      for (const t of [0.35, 0.6]) { // the leaves arching out
        const ly = y - h * t, d = (s + (t > 0.5 ? 1 : 0)) % 2 ? 1 : -1;
        curve(ctx, sx, ly, sx + d * 2, ly - 1.4, sx + d * 3, ly + 0.6, 0.6, STALK);
      }
      ellipse(ctx, sx + 0.8, y - h * 0.5, 0.5, 1.1, MAIZE); // an ear in its husk
      line(ctx, sx + 0.3, y - h, sx + 0.9, y - h - 1.6, '#d8b860', 0.4); // the tassel
      line(ctx, sx + 0.3, y - h, sx - 0.4, y - h - 1.4, '#d8b860', 0.4);
      for (let b = 0; b < 3; b++) ellipse(ctx, sx + (b % 2 ? 0.5 : -0.5), y - 1.6 - b * 1.8, 0.45, 0.35, '#5a9a3a'); // the bean vine
    }
  }
}

/** A drying rack of poles with braided maize hanging from it. */
function dryingRack(ctx: Ctx, cx: number, cy: number) {
  const a = P(cx, cy, -3, 0), b = P(cx, cy, 3, 0);
  for (const p of [a, b]) line(ctx, p[0], p[1], p[0], p[1] - 6, WOOD, 0.8);
  line(ctx, a[0], a[1] - 6, b[0], b[1] - 6, WOOD_D, 0.8);
  for (let i = 0; i < 5; i++) {
    const t = (i + 0.5) / 5, px = a[0] + (b[0] - a[0]) * t, py = a[1] - 6 + (b[1] - a[1]) * t;
    for (let j = 0; j < 3; j++) ellipse(ctx, px + (j % 2 ? 0.4 : -0.4), py + 1 + j * 1.2, 0.6, 0.8, j === 1 ? '#d89a30' : MAIZE);
  }
}

/** A white pine: the Great Tree of Peace stands by the council house. */
function whitePine(ctx: Ctx, x: number, y: number, k: number, g = '#2e5a46', seed = 0) {
  const h = 26 * k;
  line(ctx, x, y, x + 0.4 * k, y - h, '#4a3a2c', 1.6 * k);
  line(ctx, x - 0.4 * k, y, x, y - h, '#6a5a48', 0.5 * k);
  // the long horizontal tiers, swept a little to one side as old pines are, each a soft tuft of needles
  const tiers = 6;
  for (let i = 0; i < tiers; i++) {
    const ty = y - h * (0.3 + (i / tiers) * 0.7), span = (1 - i / tiers) * 8 * k + 2.6 * k;
    const lean = (rand(seed, i) - 0.3) * 2 * k;
    line(ctx, x, ty + 1 * k, x + span * 0.9 + lean, ty - 0.4 * k, '#4a3a2c', 0.6 * k);
    line(ctx, x, ty + 1 * k, x - span * 0.7 + lean, ty, '#4a3a2c', 0.6 * k);
    for (const [dx, sc] of [[-span * 0.6 + lean, 0.8], [0, 1], [span * 0.75 + lean, 0.9]] as const) {
      ellipse(ctx, x + dx + 0.6 * k, ty + 0.6 * k, 3.4 * k * sc, 1.7 * k * sc, shade(g, -0.25));
      ellipse(ctx, x + dx, ty, 3 * k * sc, 1.4 * k * sc, g);
      ellipse(ctx, x + dx - 0.8 * k, ty - 0.5 * k, 1.6 * k * sc, 0.7 * k * sc, mix(g, '#8ac0a0', 0.35));
    }
  }
}

/** The council longhouse at the capital, its palisaded gate, a Three Sisters plot and the Great Tree of Peace. */
function capital(ctx: Ctx, x: number, y: number, roofC: string) {
  // the palisade behind
  palisade(ctx, x, y, -18, -9, 16, -9, 9, 3);
  palisade(ctx, x, y, -18, -9, -18, 8, 9, 5);
  whitePine(ctx, x - 14, y - 14, 1, '#2e5a46', 2);
  longhouse(ctx, x, y - 1, 13, 4.6, 2.6, 5.4, shade(roofC, 0.05), 4);
  // a little cooking fire and a drying rack outside the door
  dryingRack(ctx, x + 6, y + 11);
  const [fx, fy] = P(x, y, 18, 2);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ellipse(ctx, fx + Math.cos(a) * 1.6, fy + Math.sin(a) * 0.8, 0.5, 0.4, '#8a8478'); }
  poly(ctx, [fx - 0.8, fy, fx, fy - 2.6, fx + 0.8, fy], '#e86a1a');
  poly(ctx, [fx - 0.4, fy, fx, fy - 1.6, fx + 0.4, fy], '#f8c040');
  for (let s = 0; s < 3; s++) ellipse(ctx, fx - s * 0.8, fy - 4 - s * 2.4, 1 + s * 0.4, 0.8 + s * 0.3, `rgba(220,220,225,${0.35 - s * 0.1})`);
  // the front palisade with the gate: the two walls overlap so the way in turns between them, a lookout platform above
  palisade(ctx, x, y, -18, 9, -6, 9, 9, 11);
  palisade(ctx, x, y, -3, 12, 16, 12, 9, 13);
  palisade(ctx, x, y, -6, 9, -6, 13, 8, 17);
  // the gallery over the gate
  const g0 = P(x, y, -7, 10.5, 7.4), g1 = P(x, y, -2, 10.5, 7.4);
  line(ctx, g0[0], g0[1], g1[0], g1[1], WOOD_D, 1.4);
  for (const g of [g0, g1]) line(ctx, g[0], g[1], g[0], g[1] - 3.2, WOOD, 0.7);
  line(ctx, g0[0], g0[1] - 3, g1[0], g1[1] - 3, WOOD, 0.6);
  // a banner like a wampum belt on a pole by the gate: purple, with white diamonds
  const [bx, by] = P(x, y, -2, 13);
  line(ctx, bx, by, bx, by - 17, WOOD_D, 0.8);
  poly(ctx, [bx, by - 17, bx + 9, by - 16.4, bx + 9, by - 13, bx, by - 13.6], PURPLE);
  for (let i = 0; i < 3; i++) { const dx = bx + 1.8 + i * 2.8, dy = by - 15.2 + i * 0.2; poly(ctx, [dx - 1, dy, dx, dy - 1, dx + 1, dy, dx, dy + 1], SHELL); }
}

function building(ctx: Ctx, x: number, y: number, big: boolean, roofC: string, isCapital: boolean) {
  if (big && isCapital) return capital(ctx, x, y, roofC);
  if (big) {
    palisade(ctx, x, y, -14, -7, 12, -7, 7.5, 1);
    palisade(ctx, x, y, -14, -7, -14, 6, 7.5, 2);
    longhouse(ctx, x, y, 10.5, 4, 2.4, 4.8, roofC, 3);
    return;
  }
  const spot: Record<string, number> = { '-10,2': 5, '10,2': 1, '0,8': 2, '-6,-8': 3, '7,-7': 0, '-14,-3': 2, '14,-2': 4 };
  const v = spot[`${Math.round(x)},${Math.round(y)}`] ?? ((Math.round(x) * 7 + Math.round(y) * 3) % 6 + 6) % 6;
  if (v === 5) { // a longhouse turned the other way, so the town's houses do not run together into one
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    longhouse(ctx, 0, 0, 7, 3.3, 2, 3.9, shade(roofC, 0.04), 2);
    ctx.restore();
  } else if (v === 0) longhouse(ctx, x, y, 7.5, 3.4, 2, 4, roofC, 2);
  else if (v === 1) {
    palisade(ctx, x, y, -9, -5, 7, -5, 6.5, Math.round(x));
    longhouse(ctx, x, y, 6.5, 3.2, 2, 3.8, roofC, 2);
  } else if (v === 2) maizeField(ctx, x, y, 3, 2, 4.2, Math.round(x + y));
  else if (v === 3) {
    longhouse(ctx, x, y, 6, 3, 1.8, 3.6, shade(roofC, -0.06), 2);
    dryingRack(ctx, x + 9, y + 3);
  } else {
    maizeField(ctx, x - 2, y + 1, 2, 2, 4, 3);
    longhouse(ctx, x + 3, y - 3, 5, 2.8, 1.8, 3.4, roofC, 1);
  }
}

// ---------------------------------------------------------------- trees

const AUTUMN = ['#c8321e', '#e07a1a', '#e8b030', '#b02a2a', '#d85a1a'];

/** Sugar maples (green, or turned red and orange), white pines and vase-shaped elms. */
function tree(ctx: Ctx, x: number, y: number, k: number, Pal: BiomePalette, variant: number) {
  const h = rand(Math.round(x) * 13 + Math.round(y) * 7, 3);
  const type = ['maple', 'pine', 'elm', 'maple', 'pine', 'maple', 'elm', 'pine', 'maple'][(variant + Math.floor(h * 9)) % 9];
  const g = Pal.forest ?? '#2f7a3a';
  if (type === 'pine') return whitePine(ctx, x, y, k * 0.82, mix(g, '#2a4a52', 0.45), variant + Math.floor(h * 20));
  if (type === 'maple') {
    const autumn = h < 0.42;
    const base = autumn ? AUTUMN[Math.floor(h * 100) % AUTUMN.length] : g;
    const th = 7 * k;
    line(ctx, x, y, x, y - th, '#4a3828', 1.6 * k);
    line(ctx, x, y - th * 0.6, x - 2.4 * k, y - th - 2 * k, '#4a3828', 0.8 * k);
    line(ctx, x, y - th * 0.6, x + 2.4 * k, y - th - 2.4 * k, '#4a3828', 0.8 * k);
    // a round, dense crown built of clustered lobes, lit on the upper left
    const lobes: [number, number, number][] = [[-3.2, -9.6, 3.4], [3.2, -10, 3.4], [0, -13.4, 3.8], [-1.8, -8, 3], [2, -7.8, 3], [0, -10.4, 4]];
    for (const [dx, dy, r] of lobes) ellipse(ctx, x + dx * k + 0.6 * k, y + dy * k + 0.6 * k, r * k, r * 0.9 * k, shade(base, -0.3));
    for (const [dx, dy, r] of lobes) ellipse(ctx, x + dx * k, y + dy * k, r * 0.92 * k, r * 0.84 * k, base);
    for (const [dx, dy, r] of lobes.slice(0, 3)) ellipse(ctx, x + (dx - 0.9) * k, y + (dy - 0.9) * k, r * 0.45 * k, r * 0.38 * k, shade(base, autumn ? 0.18 : 0.14));
    if (autumn) for (let i = 0; i < 7; i++) { // mixed leaves: flecks of the next colour
      const a = rand(variant + 9, i) * Math.PI * 2, rr = rand(variant + 4, i) * 4.4 * k;
      ellipse(ctx, x + Math.cos(a) * rr, y - 10.6 * k + Math.sin(a) * rr * 0.8, 0.9 * k, 0.7 * k, AUTUMN[(Math.floor(h * 100) + 1 + (i % 2)) % AUTUMN.length]);
    }
    else for (let i = 0; i < 5; i++) { const a = rand(variant + 9, i) * Math.PI * 2, rr = rand(variant + 4, i) * 4 * k; ellipse(ctx, x + Math.cos(a) * rr, y - 10.6 * k + Math.sin(a) * rr * 0.8, 0.8 * k, 0.6 * k, shade(g, 0.22)); }
    return;
  }
  // elm: a tall trunk forking low into arching limbs, a vase-shaped crown, broad and domed above, its edges weeping
  const c = mix(g, '#4a8a3a', 0.3);
  line(ctx, x, y, x, y - 6 * k, '#5a4a3a', 1.7 * k);
  for (const d of [-1, -0.4, 0.4, 1]) curve(ctx, x, y - 5.6 * k, x + d * 1.6 * k, y - 11 * k, x + d * 4.4 * k, y - 15 * k, 0.8 * k, '#5a4a3a');
  const crown: [number, number, number, number][] = [
    [-5.6, -14.6, 3, 3.2], [5.6, -14.8, 3, 3.2], [-3.4, -18.4, 3.6, 3], [3.4, -18.6, 3.6, 3], [0, -20.6, 4.2, 2.8], [0, -16.6, 3.6, 2.8],
  ];
  for (const [dx, dy, rx, ry] of crown) ellipse(ctx, x + dx * k + 0.5 * k, y + dy * k + 0.7 * k, rx * k, ry * k, shade(c, -0.28));
  for (const [dx, dy, rx, ry] of crown) ellipse(ctx, x + dx * k, y + dy * k, rx * 0.94 * k, ry * 0.9 * k, c);
  for (const d of [-1, 1]) { // the weeping outer sprays
    ellipse(ctx, x + d * 7.4 * k, y - 12.4 * k, 1.5 * k, 2.6 * k, shade(c, -0.18));
    ellipse(ctx, x + d * 6.6 * k, y - 11.2 * k, 1.1 * k, 2 * k, shade(c, -0.08));
  }
  ellipse(ctx, x - 2 * k, y - 21.2 * k, 2.4 * k, 1.1 * k, shade(c, 0.18));
  ellipse(ctx, x - 5.8 * k, y - 16 * k, 1.4 * k, 0.9 * k, shade(c, 0.14));
}

// ---------------------------------------------------------------- registration

registerArt('haudenosaunee', {
  unit(ctx, kind, x, y) {
    switch (kind) {
      case 'mohawk': case 'warrior': case 'archer': case 'defender': case 'swordsman': case 'explorer':
        footUnit(ctx, kind, x, y, 1);
        return true;
      case 'giant': footUnit(ctx, kind, x, y, 1.4); return true;
      case 'rider': case 'knight': rider(ctx, kind, x, y); return true;
      case 'catapult': ram(ctx, x, y); return true;
      case 'boat': case 'ship': case 'warship': boats(ctx, kind, x, y); return true;
      default: return false;
    }
  },
  dress,
  torso,
  head,
  weapon,
  shield,
  building,
  tree,
});

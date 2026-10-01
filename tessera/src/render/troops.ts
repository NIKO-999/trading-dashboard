// Every empire's extra ground units (see data/units): the Axeman, Javelineer, Ranger and Pikeman on foot in the
// empire's own dress (render/units `figure`), with their own gear, and three siege engines (Battering Ram, Ballista,
// Cannon) built of timber and trimmed in the empire's colour. The Musketeer carries a long matchlock. All original,
// all procedural.
import { TRIBES } from '../data/tribes';
import type { TribeId, UnitKind } from '../game/types';
import { box, ellipse, line, poly, roof, shade, type Ctx } from './prims';
import { figure } from './units';

const WOOD = '#7a5230';
const DWOOD = '#4e331c';
const STEEL = '#c3cad2';
const IRON = '#3a3a42';
const BRONZE = '#c9974a';
const metal = (t: TribeId) => (t === 'egypt' || t === 'greeks' || t === 'inca' || t === 'khmer' || t === 'maya' || t === 'aztec' ? BRONZE : STEEL);

export const TROOP_KINDS: UnitKind[] = ['axeman', 'javelineer', 'ranger', 'pikeman', 'musketeer', 'ram', 'ballista', 'cannon'];
export const isTroopKind = (k: UnitKind) => TROOP_KINDS.includes(k);

export function drawTroop(ctx: Ctx, kind: UnitKind, tribe: TribeId, x: number, y: number) {
  switch (kind) {
    case 'axeman': return axeman(ctx, tribe, x, y);
    case 'javelineer': return javelineer(ctx, tribe, x, y);
    case 'ranger': return ranger(ctx, tribe, x, y);
    case 'pikeman': return pikeman(ctx, tribe, x, y);
    case 'musketeer': return musketeer(ctx, tribe, x, y);
    case 'ram': return ram(ctx, tribe, x, y);
    case 'ballista': return ballista(ctx, tribe, x, y);
    case 'cannon': return cannon(ctx, tribe, x, y);
  }
}

/** A two-handed bearded axe, raised over the shoulder. */
function axeman(ctx: Ctx, tribe: TribeId, x: number, y: number) {
  const b = figure(ctx, 'warrior', tribe, x, y, 1);
  const hx = b.hand.x, hy = b.hand.y;
  line(ctx, hx - 1, hy + 6, hx + 4, hy - 16, WOOD, 1.6);
  const m = metal(tribe);
  poly(ctx, [hx + 2.8, hy - 11, hx + 9.5, hy - 15.5, hx + 10.5, hy - 9.5, hx + 7, hy - 7.5, hx + 3.6, hy - 9], m);
  poly(ctx, [hx + 9.5, hy - 15.5, hx + 10.5, hy - 9.5, hx + 9.6, hy - 9.6, hx + 8.8, hy - 14.8], shade(m, 0.35));
}

/** A bundle of light javelins on the back and one ready to throw. */
function javelineer(ctx: Ctx, tribe: TribeId, x: number, y: number) {
  const T = TRIBES[tribe];
  for (let i = 0; i < 3; i++) line(ctx, x - 7 + i * 1.2, y - 2, x - 3 + i * 1.2, y - 22, WOOD, 0.9); // the bundle behind
  const b = figure(ctx, 'archer', tribe, x, y, 0.96);
  const hx = b.hand.x, hy = b.hand.y;
  line(ctx, hx - 8, hy + 2, hx + 9, hy - 7, shade(WOOD, 0.1), 1.1);
  poly(ctx, [hx + 8.4, hy - 8, hx + 12.6, hy - 9.4, hx + 9.6, hy - 6], metal(tribe));
  poly(ctx, [hx - 8, hy + 2, hx - 10, hy + 0.5, hx - 9.4, hy + 3.4], T.color); // a fletch of the empire's colour
}

/** A hooded woodsman in a leaf-green cloak with a short bow. */
function ranger(ctx: Ctx, tribe: TribeId, x: number, y: number) {
  const cloak = '#3f6b3a';
  poly(ctx, [x - 7, y - 18, x + 1, y - 21, x + 5, y - 4, x - 8, y - 2], shade(cloak, -0.15)); // the cloak behind
  const b = figure(ctx, 'archer', tribe, x, y, 0.96);
  // the hood over the head
  poly(ctx, [x - 5.5, b.top + 6, x - 1, b.top - 1.5, x + 4, b.top + 2.5, x + 4.5, b.top + 7, x - 5.5, b.top + 8], cloak);
  poly(ctx, [x - 1, b.top - 1.5, x + 4, b.top + 2.5, x + 1.6, b.top + 3], shade(cloak, 0.2));
  // a leaf clasp and a short bow
  ellipse(ctx, x - 1.5, b.top + 10, 1.2, 0.9, '#9ac46a');
  ctx.strokeStyle = DWOOD; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.arc(b.hand.x + 2, b.hand.y - 2, 6.5, -1.3, 1.3); ctx.stroke();
  line(ctx, b.hand.x + 2 + 6.5 * Math.cos(-1.3), b.hand.y - 2 + 6.5 * Math.sin(-1.3), b.hand.x + 2 + 6.5 * Math.cos(1.3), b.hand.y - 2 + 6.5 * Math.sin(1.3), '#e8e0c8', 0.5);
}

/** A very long pike held upright, a small round shield, and a steel cap. */
function pikeman(ctx: Ctx, tribe: TribeId, x: number, y: number) {
  const b = figure(ctx, 'defender', tribe, x, y, 0.98);
  // held upright in the weapon hand, rising a head's height above the helmet
  const bx = b.hand.x - 0.6, by = b.hand.y + 7, tx = b.hand.x + 1.6, ty = b.top - 9;
  line(ctx, bx, by, tx, ty, shade(WOOD, 0.05), 1.4);
  poly(ctx, [tx - 0.9, ty + 1, tx + 0.3, ty - 5.5, tx + 1.2, ty + 1], metal(tribe));
  line(ctx, tx - 1.1, ty + 2, tx + 1.3, ty + 2, TRIBES[tribe].color, 1.4); // a tassel band
}

/** A long matchlock musket held across the body, a powder flask and a wide-brimmed hat. */
function musketeer(ctx: Ctx, tribe: TribeId, x: number, y: number) {
  const T = TRIBES[tribe];
  const b = figure(ctx, 'swordsman', tribe, x, y, 0.98);
  const hx = b.hand.x, hy = b.hand.y;
  line(ctx, hx - 6, hy + 7, hx + 8, hy - 15, DWOOD, 2.2); // the stock
  line(ctx, hx - 1, hy - 1, hx + 9.5, hy - 17.5, IRON, 1.5); // the barrel
  ellipse(ctx, hx + 9.6, hy - 17.6, 0.9, 0.9, '#111');
  ellipse(ctx, x - 4.5, y - 7, 1.6, 2.2, '#c9a06a'); // powder flask
  // the brimmed hat with a feather in the empire's colour
  ellipse(ctx, x - 0.5, b.top + 2, 7.5, 2.2, shade(T.color, -0.35));
  poly(ctx, [x - 4, b.top + 2, x - 3, b.top - 3, x + 2.5, b.top - 3.5, x + 3.5, b.top + 1.5], shade(T.color, -0.25));
  poly(ctx, [x + 2, b.top - 2, x + 7, b.top - 7, x + 4, b.top - 1.5], T.color);
}

function wheel(ctx: Ctx, x: number, y: number, r: number, hub: string) {
  ellipse(ctx, x, y, r, r * 1.1, '#3f2814');
  ellipse(ctx, x, y, r * 0.8, r * 0.9, WOOD);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 4 + 0.2;
    line(ctx, x - Math.cos(a) * r * 0.8, y - Math.sin(a) * r * 0.9, x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.9, '#3f2814', 0.6);
  }
  ellipse(ctx, x, y, r * 0.35, r * 0.4, hub);
}

/** A roofed timber shed on wheels, a capped log hanging inside it, the roof hides hung in the empire's colour. */
function ram(ctx: Ctx, tribe: TribeId, x: number, y: number) {
  const T = TRIBES[tribe];
  ellipse(ctx, x, y + 5, 15, 5, 'rgba(0,0,0,0.22)');
  for (const [wx, wy] of [[-8, 3], [7, 5]]) wheel(ctx, x + wx, y + wy, 3.4, IRON);
  box(ctx, x, y + 1, 20, 3, DWOOD);
  for (const px of [-8, 7]) line(ctx, x + px, y, x + px + 1, y - 12, WOOD, 1.6);
  line(ctx, x - 11, y - 6, x + 15, y - 1, '#6b4a2b', 3.4); // the log
  ellipse(ctx, x + 15, y - 1, 2.6, 2.4, IRON); // its iron cap
  roof(ctx, x, y - 12, 22, 8, T.color);
  roof(ctx, x, y - 13, 18, 5, shade(T.color, 0.2));
}

/** A great crossbow on a swivel stand, a bolt laid in, its arms bound in the empire's colour. */
function ballista(ctx: Ctx, tribe: TribeId, x: number, y: number) {
  const T = TRIBES[tribe];
  ellipse(ctx, x, y + 5, 13, 4.5, 'rgba(0,0,0,0.22)');
  for (const [lx, ly] of [[-7, 5], [6, 6], [0, 3]]) line(ctx, x, y - 4, x + lx, y + ly, DWOOD, 1.6); // the tripod
  line(ctx, x - 9, y - 1, x + 11, y - 8, WOOD, 2.6); // the stock
  ctx.strokeStyle = WOOD; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(x + 2, y - 13); ctx.quadraticCurveTo(x + 6, y - 6, x + 2, y + 0.5); ctx.stroke(); // the bow arms
  line(ctx, x + 2, y - 13, x - 6, y - 3, '#e8e0c8', 0.6);
  line(ctx, x + 2, y + 0.5, x - 6, y - 3, '#e8e0c8', 0.6);
  line(ctx, x - 6, y - 3, x + 14, y - 9.5, '#4a3420', 1); // the bolt
  poly(ctx, [x + 14, y - 10.5, x + 17, y - 10, x + 14, y - 8.5], STEEL);
  for (const [bx, by] of [[3.4, -10], [3.4, -1.6]]) ellipse(ctx, x + bx, y + by, 1.4, 1.6, T.color); // the bindings
}

/** A cast bronze or iron cannon on a two-wheeled carriage, with a small pile of shot and a pennant. */
function cannon(ctx: Ctx, tribe: TribeId, x: number, y: number) {
  const T = TRIBES[tribe];
  const barrel = tribe === 'japan' || tribe === 'korea' || tribe === 'china' ? IRON : BRONZE;
  ellipse(ctx, x, y + 5, 14, 4.5, 'rgba(0,0,0,0.22)');
  box(ctx, x - 2, y + 1, 15, 4, DWOOD); // the trail
  line(ctx, x - 9, y - 4, x + 12, y - 11, shade(barrel, -0.35), 6.4);
  line(ctx, x - 8, y - 5.6, x + 11, y - 12, shade(barrel, 0.25), 1.6);
  ellipse(ctx, x + 12.4, y - 11.3, 3.3, 3.3, shade(barrel, -0.2));
  ellipse(ctx, x + 12.4, y - 11.3, 1.7, 1.7, '#0b0b0e');
  ellipse(ctx, x - 9.5, y - 3.8, 2, 2, shade(barrel, -0.3)); // the cascabel
  wheel(ctx, x + 1, y + 2, 4.6, T.color);
  for (const [sx, sy] of [[-12, 5], [-9.5, 6], [-10.8, 3.6]]) ellipse(ctx, x + sx, y + sy, 1.7, 1.6, '#2a2a30');
  line(ctx, x - 6, y - 1, x - 6, y - 15, '#4a3420', 1);
  poly(ctx, [x - 6, y - 15, x - 0.5, y - 13.5, x - 6, y - 11.5], T.color);
}

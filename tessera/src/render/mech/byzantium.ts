// Greek Fire: burning units wrapped in licking flames, sparks and a plume of black smoke; units bought off by Imperial
// Diplomacy carry a little spinning gold solidus over their heads; coastal Byzantine cities show a bronze siphon on the
// seaward wall.
import { tileCenter } from '../camera';
import { isWater, neighbors } from '../../game/grid';
import { isExplored } from '../../game/rules';
import { unitVisibleTo } from '../../game/mech';
import { burning, underTribute } from '../../game/mech/byzantium';
import type { Ctx } from '../prims';
import type { MechRender } from './types';

/** One tongue of flame, three layers from red to white-gold, swaying with `phase`. */
function flame(ctx: Ctx, x: number, y: number, size: number, phase: number) {
  const sway = Math.sin(phase) * size * 0.3;
  const lick = 0.75 + 0.3 * Math.sin(phase * 1.9) + 0.1 * Math.sin(phase * 4.3);
  for (const [k, color] of [[1, '#c8361c'], [0.7, '#f28a1e'], [0.4, '#ffe48a']] as const) {
    const w = size * 0.45 * k, h = size * 1.6 * k * lick;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.quadraticCurveTo(x - w * 1.1, y - h * 0.55, x + sway * k, y - h);
    ctx.quadraticCurveTo(x + w * 1.1, y - h * 0.55, x + w, y);
    ctx.quadraticCurveTo(x, y + w * 0.4, x - w, y);
    ctx.fill();
  }
}

function fireOn(ctx: Ctx, x: number, y: number, now: number, seed: number) {
  ctx.save();
  // the glow on the ground
  const g = ctx.createRadialGradient(x, y, 2, x, y, 26);
  g.addColorStop(0, 'rgba(255,150,40,0.45)');
  g.addColorStop(1, 'rgba(255,90,20,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, 26, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  // smoke rising and drifting
  for (let i = 0; i < 4; i++) {
    const t = ((now / 1400 + i / 4 + seed * 0.13) % 1);
    const r = 4 + t * 9;
    ctx.fillStyle = `rgba(40,34,32,${0.38 * (1 - t)})`;
    ctx.beginPath();
    ctx.arc(x + Math.sin(t * 5 + i) * 6 + t * 8, y - 30 - t * 30, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // tongues of fire around the figure's feet and up its sides
  const spots: [number, number, number][] = [[-11, 3, 8], [11, 2, 8], [-6, -1, 11], [6, 0, 10], [0, 4, 7], [-13, -12, 6], [13, -14, 6]];
  spots.forEach(([dx, dy, sz], i) => flame(ctx, x + dx, y + dy, sz, now / 140 + i * 1.7 + seed));
  // sparks
  for (let i = 0; i < 5; i++) {
    const t = ((now / 900 + i * 0.21 + seed * 0.07) % 1);
    ctx.fillStyle = `rgba(255,${200 - Math.round(t * 120)},80,${1 - t})`;
    ctx.fillRect(x + Math.sin(i * 2.3 + t * 4) * 12, y - 6 - t * 34, 1.6, 1.6);
  }
  ctx.restore();
}

/** A gold solidus turning in the air above a bribed unit. */
function coin(ctx: Ctx, x: number, y: number, now: number) {
  const turn = Math.abs(Math.cos(now / 380));
  const bob = Math.sin(now / 300) * 1.5;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = '#8a6312';
  ctx.beginPath();
  ctx.ellipse(0, 0.8, 5.5 * turn + 0.6, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2c94c';
  ctx.beginPath();
  ctx.ellipse(0, 0, 5 * turn + 0.4, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  if (turn > 0.45) { // the emperor's cross stamped on its face
    ctx.fillStyle = '#a77a1a';
    ctx.fillRect(-0.6 * turn, -3, 1.2 * turn, 6);
    ctx.fillRect(-2.2 * turn, -1.2, 4.4 * turn, 1.2);
  }
  ctx.restore();
}

export const render: MechRender = {
  // a bronze siphon on the walls of a coastal Byzantine city, pointing out to sea
  tile(ctx, s, t, cx, cy) {
    if (t.cityId === null) return;
    const c = s.cities.find((k) => k.id === t.cityId);
    if (!c || c.x !== t.x || c.y !== t.y || s.players[c.owner]?.tribe !== 'byzantium') return;
    const sea = neighbors(s, t.x, t.y).find(isWater);
    if (!sea) return;
    const p = tileCenter(t.x, t.y), q = tileCenter(sea.x, sea.y);
    const dx = Math.sign(q.x - p.x) || 1, dy = Math.sign(q.y - p.y) || 1;
    const x = cx + dx * 22, y = cy + dy * 9;
    ctx.save();
    ctx.fillStyle = '#9b8a6a'; // a bit of wall
    ctx.fillRect(x - 5, y - 6, 10, 7);
    ctx.fillStyle = '#7f7057';
    ctx.fillRect(x - 5, y - 8, 3, 2);
    ctx.fillRect(x + 2, y - 8, 3, 2);
    ctx.strokeStyle = '#b8742a'; // the bronze tube
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y - 5);
    ctx.lineTo(x + dx * 7, y - 7 + dy * 2);
    ctx.stroke();
    ctx.fillStyle = '#e0a145'; // its lion-mouth nozzle
    ctx.beginPath();
    ctx.arc(x + dx * 7.5, y - 7 + dy * 2, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  overlay(ctx, s, viewer, _cam, ov, now) {
    if (ov.still) now = 0; // a still photo of the map: the flames hold one pose
    for (const u of s.units) {
      const fire = burning(u) > 0;
      const paid = underTribute(s, u);
      if (!fire && !paid) continue;
      if (viewer >= 0 && (!isExplored(s, viewer, u.x, u.y) || !unitVisibleTo(s, viewer, u))) continue;
      const c = tileCenter(u.x, u.y);
      if (fire) fireOn(ctx, c.x, c.y + 2, now, u.id);
      if (paid) coin(ctx, c.x + 14, c.y - 40, now + u.id * 97);
    }
  },
};

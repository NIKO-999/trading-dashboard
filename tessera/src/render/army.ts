// Drawing side of the army mechanics (see game/army): a thin cord on the ground between units standing in formation,
// with a small glyph at its middle (a shield for a shield wall, an arrowhead for a volley, a chevron for a charge),
// and an amber "out of supply" roundel at the feet of a unit that has run short. Both are drawn on the ground layer of
// the map, so they are part of the photographed resting map too.
import { formationLinks, outOfSupply, type FormationKind } from '../game/army';
import { unitVisibleTo } from '../game/mech';
import { TRIBES } from '../data/tribes';
import type { GameState, Unit } from '../game/types';
import { tileCenter, WATER_DROP } from './camera';
import { isWaterTile } from './common';
import { ellipse, line, poly, shade, type Ctx } from './prims';

const GLYPH: Record<FormationKind, string> = { shield: '#e9eef5', volley: '#f0c43a', charge: '#ff9a3c', fleet: '#7fd6ff' };
const AMBER = '#e8a23a';
const DARK = '#2a2118';

const seen = (s: GameState, viewer: number, u: Unit) => viewer < 0 || (s.players[viewer].explored[u.y * s.size + u.x] && unitVisibleTo(s, viewer, u));
function feet(s: GameState, u: Unit) {
  const c = tileCenter(u.x, u.y);
  const t = s.tiles[u.y * s.size + u.x];
  return { x: c.x, y: c.y + 3 + (t && isWaterTile(t) ? WATER_DROP - 1 : 0) };
}

/** Formation cords and out-of-supply marks for every unit the viewer can see. */
export function drawArmyGround(ctx: Ctx, s: GameState, viewer: number) {
  for (const { a, b, kind } of formationLinks(s)) {
    if (!seen(s, viewer, a) || !seen(s, viewer, b)) continue;
    formationCord(ctx, feet(s, a), feet(s, b), kind, TRIBES[s.players[a.owner].tribe].color);
  }
  for (const u of s.units) if (outOfSupply(u) && seen(s, viewer, u)) supplyMark(ctx, feet(s, u));
}

function formationCord(ctx: Ctx, a: { x: number; y: number }, b: { x: number; y: number }, kind: FormationKind, color: string) {
  // stop short of each unit's feet, so the cord reads as a link between them rather than a line under them
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len, cut = Math.min(12, len * 0.3);
  const x0 = a.x + ux * cut, y0 = a.y + uy * cut, x1 = b.x - ux * cut, y1 = b.y - uy * cut;
  ctx.save();
  ctx.lineCap = 'round';
  line(ctx, x0, y0, x1, y1, 'rgba(20,16,10,0.45)', 3);
  line(ctx, x0, y0, x1, y1, shade(color, 0.25), 1.4);
  ctx.restore();
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  ellipse(ctx, mx, my, 4.6, 4.2, DARK);
  const g = GLYPH[kind];
  if (kind === 'shield') poly(ctx, [mx - 2.6, my - 2.8, mx + 2.6, my - 2.8, mx + 2.6, my + 0.2, mx, my + 3, mx - 2.6, my + 0.2], g);
  else if (kind === 'fleet') { // a little anchor: Line of Battle
    line(ctx, mx, my - 2.8, mx, my + 2.2, g, 1.2);
    line(ctx, mx - 1.6, my - 1.6, mx + 1.6, my - 1.6, g, 1);
    ctx.strokeStyle = g; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(mx, my + 0.4, 2.4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  } else if (kind === 'volley') poly(ctx, [mx, my - 3.2, mx + 2.6, my + 1.8, mx, my + 0.6, mx - 2.6, my + 1.8], g);
  else { poly(ctx, [mx - 2.8, my - 2.6, mx + 0.4, my, mx - 2.8, my + 2.6, mx - 1.6, my], g); poly(ctx, [mx - 0.2, my - 2.6, mx + 3, my, mx - 0.2, my + 2.6, mx + 1, my], g); }
}

/** A small amber roundel with an exclamation mark, at the front-left of the unit's feet. */
function supplyMark(ctx: Ctx, p: { x: number; y: number }) {
  const x = p.x - 14, y = p.y + 6;
  ellipse(ctx, x, y, 5.2, 5.2, DARK);
  ellipse(ctx, x, y, 4.1, 4.1, AMBER);
  poly(ctx, [x - 0.8, y - 2.8, x + 0.8, y - 2.8, x + 0.5, y + 0.8, x - 0.5, y + 0.8], '#fffaf0');
  ellipse(ctx, x, y + 2.1, 0.8, 0.8, '#fffaf0');
}

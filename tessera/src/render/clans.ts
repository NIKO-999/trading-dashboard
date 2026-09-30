// Drawing side of the Raider Clans (see game/clans): the outlaw camps (hide tents, a bonfire and a tattered banner
// with the clan's sign) and a rough mark at the feet of every raider. The camp goes on the cached map layer and the
// marks on the ground layer under the units, so both are part of the photographed resting map; nothing here moves.
import { unitVisibleTo } from '../game/mech';
import { clanCampAt, clanOf, isGuard, isRaider } from '../game/clans';
import type { ClanKind, GameState, Tile } from '../game/types';
import { tileCenter, WATER_DROP } from './camera';
import { isWaterTile } from './common';
import { ellipse, line, poly, rand, shade, type Ctx } from './prims';

/** The colour of the Raider Clans: banners, raider marks, health badges and the unit panel's chip. */
export const CLAN_COLOR = '#9a4a1e';
const HIDE = '#9a7550';
const HIDE_DARK = '#6e5036';
const BONE = '#eadfc8';
const POLE = '#4a3320';
const SOOT = '#2a1d16';

// ---------------------------------------------------------------- signs

/** The clan's sign, painted in bone on its banner and on its raiders' marks: centred on (x, y), `r` its size. */
function sign(ctx: Ctx, kind: ClanKind, x: number, y: number, r: number, color = BONE) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(0.9, r * 0.32);
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (kind === 'horse') { // a horseshoe
    ctx.arc(x, y - r * 0.1, r * 0.72, Math.PI * 0.85, Math.PI * 2.15, false);
  } else if (kind === 'sea') { // two waves
    for (const dy of [-0.35, 0.4]) {
      ctx.moveTo(x - r, y + dy * r);
      ctx.quadraticCurveTo(x - r * 0.5, y + (dy - 0.55) * r, x, y + dy * r);
      ctx.quadraticCurveTo(x + r * 0.5, y + (dy + 0.55) * r, x + r, y + dy * r);
    }
  } else if (kind === 'hill') { // twin peaks
    ctx.moveTo(x - r, y + r * 0.6);
    ctx.lineTo(x - r * 0.35, y - r * 0.6);
    ctx.lineTo(x, y);
    ctx.lineTo(x + r * 0.4, y - r * 0.75);
    ctx.lineTo(x + r, y + r * 0.6);
  } else { // three claw slashes
    for (const k of [-0.55, 0, 0.55]) { ctx.moveTo(x + k * r - r * 0.3, y - r * 0.75); ctx.lineTo(x + k * r + r * 0.3, y + r * 0.75); }
  }
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- the camp

/** A hide tent: a lopsided cone of stitched skins with its poles poking out of the smoke hole. Foot centre at (x, y). */
function hideTent(ctx: Ctx, x: number, y: number, w: number, h: number, seed: number) {
  const top = y - h;
  poly(ctx, [x - w / 2, y, x - 1, top, x + 1, y + w * 0.2], HIDE);
  poly(ctx, [x + 1, y + w * 0.2, x - 1, top, x + w / 2, y - 1], shade(HIDE, -0.25));
  // skins of other colours patched in, and a stitched seam
  for (let i = 0; i < 3; i++) {
    const k = 0.25 + rand(seed, i) * 0.5, side = i % 2 ? 1 : -1;
    const px = x + side * w * 0.22 * (1 - k * 0.6), py = y - h * k * 0.8;
    poly(ctx, [px - 2.6, py + 1.6, px - 0.4, py - 2.6, px + 2.4, py - 1.2, px + 1.4, py + 2.4], i === 1 ? '#c2a077' : HIDE_DARK);
  }
  for (let k = 0.2; k < 0.9; k += 0.14) line(ctx, x - 1 + (k * 2 - 1) * 0.6, y - h * k + 0.5, x + 0.8 + (k * 2 - 1) * 0.6, y - h * k - 0.5, SOOT, 0.6);
  // the doorway and its hanging flap
  poly(ctx, [x - w * 0.24, y + 1, x - w * 0.1, y - h * 0.46, x - w * 0.02, y + w * 0.14], SOOT);
  poly(ctx, [x - w * 0.1, y - h * 0.46, x - w * 0.3, y + 0.5, x - w * 0.36, y - 0.5], '#b48e62');
  // poles through the smoke hole
  line(ctx, x - 1, top + 1, x - 4.5, top - 5, POLE, 1.1);
  line(ctx, x - 0.5, top + 1, x + 0.5, top - 6, POLE, 1.1);
  line(ctx, x, top + 1, x + 4, top - 4.5, POLE, 1.1);
}

/** The bonfire: a ring of stones, crossed logs and a still flame with its glow. Centre at (x, y). */
function bonfire(ctx: Ctx, x: number, y: number) {
  ellipse(ctx, x, y + 0.5, 10, 4.6, 'rgba(255,150,60,0.22)'); // glow on the earth
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; ellipse(ctx, x + Math.cos(a) * 5, y + Math.sin(a) * 2.2, 1.6, 1.1, i % 2 ? '#8d8a86' : '#6f6c69'); }
  ellipse(ctx, x, y, 3.6, 1.6, SOOT);
  line(ctx, x - 4, y + 1, x + 3.5, y - 1.5, '#5a3a22', 1.6);
  line(ctx, x + 4, y + 1, x - 3.5, y - 1.5, '#6b4526', 1.6);
  poly(ctx, [x - 3.4, y - 0.5, x - 1.8, y - 6, x - 0.6, y - 3.4, x + 0.4, y - 9.5, x + 1.6, y - 4, x + 2.6, y - 6.5, x + 3.4, y - 0.5], '#e8612a');
  poly(ctx, [x - 1.8, y - 0.6, x - 0.6, y - 4.2, x + 0.4, y - 6.8, x + 1.2, y - 3.2, x + 1.9, y - 0.6], '#ffb13b');
  poly(ctx, [x - 0.7, y - 0.8, x + 0.2, y - 3.8, x + 0.9, y - 0.8], '#fff0b0');
}

/** A crooked pole with a horned skull on top and a torn hide banner painted with the clan's sign. Pole foot at (x, y). */
function clanBanner(ctx: Ctx, x: number, y: number, kind: ClanKind) {
  line(ctx, x, y, x - 1, y - 18, POLE, 1.8);
  line(ctx, x - 1, y - 18, x + 0.5, y - 36, POLE, 1.8);
  // the banner: a rust-dyed hide with a ragged foot, hung from a cross-bar
  line(ctx, x - 1, y - 33, x + 15, y - 31, POLE, 1.3);
  const top = y - 32.5;
  poly(ctx, [x, top, x + 14, top + 1.6, x + 14.5, top + 13, x + 12, top + 10.5, x + 10, top + 14.5, x + 7.5, top + 11, x + 5, top + 15.5, x + 2.5, top + 11.5, x, top + 14], CLAN_COLOR);
  poly(ctx, [x, top + 8, x + 14.3, top + 9, x + 14.5, top + 13, x + 12, top + 10.5, x + 10, top + 14.5, x + 7.5, top + 11, x + 5, top + 15.5, x + 2.5, top + 11.5, x, top + 14], shade(CLAN_COLOR, -0.22));
  sign(ctx, kind, x + 7.2, top + 6.6, 3.8);
  // the horned skull
  const sx = x + 0.4, sy = y - 38;
  line(ctx, sx - 2.5, sy - 0.5, sx - 6, sy - 4.5, BONE, 1.3);
  line(ctx, sx + 2.5, sy - 0.5, sx + 6, sy - 4.5, BONE, 1.3);
  ellipse(ctx, sx, sy, 3.2, 2.8, BONE);
  poly(ctx, [sx - 1.8, sy + 1.5, sx + 1.8, sy + 1.5, sx + 1.2, sy + 4, sx - 1.2, sy + 4], BONE);
  ellipse(ctx, sx - 1.2, sy, 0.8, 0.9, SOOT);
  ellipse(ctx, sx + 1.2, sy, 0.8, 0.9, SOOT);
}

/** An outlaw camp on its tile (cached layer): tents, a bonfire, a drying rack and the clan's banner. */
export function drawClanCamp(ctx: Ctx, s: GameState, t: Tile, cx: number, cy: number) {
  const c = clanCampAt(s, t.x, t.y);
  if (!c) return;
  ellipse(ctx, cx, cy + 2, 25, 10.5, 'rgba(92,64,38,0.34)'); // trampled, scorched earth
  ellipse(ctx, cx + 2, cy + 5, 12, 4.5, 'rgba(40,28,20,0.22)');
  hideTent(ctx, cx + 6, cy - 7, 17, 15, t.seed); // back to front
  hideTent(ctx, cx - 12, cy - 2, 20, 18, t.seed + 7);
  // a rack of drying hides at the front left
  line(ctx, cx - 25, cy + 6, cx - 25, cy - 3, POLE, 1.2);
  line(ctx, cx - 17, cy + 10, cx - 17, cy + 1, POLE, 1.2);
  line(ctx, cx - 25.5, cy - 2.5, cx - 16.5, cy + 1.5, POLE, 1.1);
  poly(ctx, [cx - 24.5, cy - 1.5, cx - 21.5, cy, cx - 21.8, cy + 6, cx - 24.2, cy + 5], '#b08a60');
  poly(ctx, [cx - 21, cy + 0.2, cx - 17.8, cy + 1.8, cx - 18, cy + 7.5, cx - 20.8, cy + 6.2], HIDE_DARK);
  bonfire(ctx, cx + 1, cy + 8);
  // the banner stands at the camp's right edge, so it shows beside the guard standing in the middle
  clanBanner(ctx, cx + 16, cy + 2, c.kind);
}

// ---------------------------------------------------------------- raiders' marks

/**
 * A rough rust ring around each raider's feet, broken like a daub of paint, and a small roundel with the clan's sign
 * at its front right (a guard's roundel is edged in bone). Drawn on the ground layer, under the units.
 */
export function drawClanGround(ctx: Ctx, s: GameState, viewer: number) {
  if (!s.clans) return;
  for (const u of s.units) {
    if (!isRaider(s, u)) continue;
    if (viewer >= 0 && (!s.players[viewer]?.explored[u.y * s.size + u.x] || !unitVisibleTo(s, viewer, u))) continue;
    const c = clanOf(s, u);
    if (!c) continue;
    const p = tileCenter(u.x, u.y);
    const t = s.tiles[u.y * s.size + u.x];
    const y = p.y + 3 + (t && isWaterTile(t) ? WATER_DROP - 1 : 0);
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) { // seven daubs round an ellipse
      const a0 = (i / 7) * Math.PI * 2 + 0.2, a1 = a0 + 0.62;
      ctx.strokeStyle = i % 2 ? CLAN_COLOR : shade(CLAN_COLOR, -0.18);
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(p.x, y, 17, 8.2, 0, a0, a1);
      ctx.stroke();
    }
    ctx.restore();
    const x = p.x + 14, my = y + 6;
    ellipse(ctx, x, my, 5.4, 5.4, isGuard(s, u) ? BONE : SOOT);
    ellipse(ctx, x, my, 4.3, 4.3, CLAN_COLOR);
    sign(ctx, c.kind, x, my, 2.4);
  }
}

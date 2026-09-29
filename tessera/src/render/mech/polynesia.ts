// Maori: the Great Waka (a big carved double-hulled canoe drawn in place of a city on the water), its wake, the tiles it can
// sail or anchor to (shown to its owner on their turn), and a tiny koru on wild tiles under Tane's Tapu.
import { tileCenter, WATER_DROP } from '../camera';
import { isWater, neighbors } from '../../game/grid';
import { anchorCheck, isWaka, isWild, hasSailed, sailTargets, wakasOf } from '../../game/mech/polynesia';
import { tileOwnerPlayer } from '../../game/rules';
import { TRIBES } from '../../data/tribes';
import { ellipse, line, poly, shade, softShadow } from '../prims';
import type { Ctx } from '../prims';
import type { MechRender } from './types';

const WOOD = '#7a3b1f', WOOD_HI = '#a8552b', RED = '#b3261e', BONE = '#efe4c8', SAIL = '#e8d2a2';

/** Draw a spiral (koru / moko curl) centred at (x, y). */
function koru(ctx: Ctx, x: number, y: number, r: number, color: string, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let a = 0; a <= Math.PI * 3.2; a += 0.3) {
    const k = r * (1 - a / (Math.PI * 3.6));
    const px = x + Math.cos(a) * k, py = y + Math.sin(a) * k * 0.8;
    if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

/** The Great Waka: two carved hulls joined by a lashed deck, a crab-claw sail, a whare and a tall stern post. */
function drawWaka(ctx: Ctx, cx: number, cy: number, level: number, color: string) {
  const oy = cy + WATER_DROP + 2;
  // along the tile's x axis (l) and across it (w), in tile units; z is height in px
  const P = (l: number, w: number, z: number) => ({ x: cx + (l - w) * 30, y: oy + (l + w) * 15 - z });
  const pts = (list: { x: number; y: number }[]) => list.flatMap((p) => [p.x, p.y]);
  const sheer = (l: number) => 3 + 11 * Math.pow(Math.abs(l) / 0.6, 3); // the hull curves up to bow and stern
  const ls = [-0.6, -0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45, 0.6];

  softShadow(ctx, cx, oy + 4, 40, 13, 0.25);
  ellipse(ctx, cx, oy + 5, 42, 14, 'rgba(255,255,255,0.28)'); // foam ring

  const hull = (w: number) => {
    const top = ls.map((l) => P(l, w, sheer(l) + 6));
    const bottom = [...ls].reverse().map((l) => P(l, w, 0));
    poly(ctx, pts([...top, ...bottom]), w > 0 ? WOOD : shade(WOOD, -0.25));
    poly(ctx, pts([...top, ...[...ls].reverse().map((l) => P(l, w, sheer(l) + 3.5))]), w > 0 ? WOOD_HI : WOOD); // gunwale
    for (let i = 1; i < ls.length - 1; i += 2) { // carved panels along the side
      const p = P(ls[i], w, sheer(ls[i]) + 1.5);
      poly(ctx, [p.x - 3, p.y - 1, p.x + 3, p.y + 1.5, p.x + 3, p.y + 4.5, p.x - 3, p.y + 2], i % 4 === 1 ? RED : BONE);
    }
  };
  hull(-0.16); // far hull first

  // lashed deck between the hulls
  poly(ctx, pts([P(-0.45, -0.16, 9), P(0.45, -0.16, 9), P(0.45, 0.16, 9), P(-0.45, 0.16, 9)]), '#c9a06a');
  for (let l = -0.4; l <= 0.4; l += 0.16) line(ctx, P(l, -0.16, 9).x, P(l, -0.16, 9).y, P(l, 0.16, 9).x, P(l, 0.16, 9).y, '#8d6338', 1.1);

  // the whare (hut): a thatched roof on a low wall; a second one as the city grows
  const hut = (l: number, big: number) => {
    const e = 0.1 * big;
    poly(ctx, pts([P(l - e, e, 9), P(l + e, e, 9), P(l + e, e, 9 + 9 * big), P(l - e, e, 9 + 9 * big)]), '#8a5f38');
    poly(ctx, pts([P(l + e, -e, 9), P(l + e, e, 9), P(l + e, e, 9 + 9 * big), P(l + e, -e, 9 + 9 * big)]), '#5e3a1e');
    const ridge = P(l, 0, 9 + 17 * big);
    const eaves = [P(l - 1.4 * e, -1.3 * e, 9 + 8 * big), P(l + 1.4 * e, -1.3 * e, 9 + 8 * big), P(l + 1.4 * e, 1.3 * e, 9 + 8 * big), P(l - 1.4 * e, 1.3 * e, 9 + 8 * big)];
    poly(ctx, pts([eaves[3], eaves[2], ridge]), '#d9b45a');
    poly(ctx, pts([eaves[2], eaves[1], ridge]), '#b48a3c');
    poly(ctx, pts([eaves[3], eaves[0], ridge]), '#c9a24a');
  };
  hut(-0.22, 1);
  if (level >= 3) hut(0.32, 0.8);

  // mast and crab-claw sail
  const mast = P(0.04, 0, 9), top = P(0.04, 0, 46 + level);
  line(ctx, mast.x, mast.y, top.x, top.y, '#4a2e17', 1.8);
  const sp = [P(-0.36, 0, 14), P(0.04, 0, 46 + level), P(0.52, 0, 17), P(0.1, 0, 12)];
  poly(ctx, pts(sp), SAIL);
  poly(ctx, pts([sp[0], sp[1], P(0.04, 0, 30)]), '#d8bd86');
  line(ctx, sp[0].x, sp[0].y, sp[1].x, sp[1].y, '#7a4f2a', 1.6); // the spars
  line(ctx, sp[1].x, sp[1].y, sp[2].x, sp[2].y, '#7a4f2a', 1.6);
  koru(ctx, (sp[0].x + sp[1].x + sp[2].x) / 3, (sp[0].y + sp[1].y + sp[2].y) / 3 + 3, 5, RED, 1.4); // a painted koru
  poly(ctx, [top.x, top.y, top.x + 11, top.y + 2.5, top.x, top.y + 6], color); // the owner's pennant
  poly(ctx, [top.x, top.y + 1, top.x + 9, top.y + 3, top.x, top.y + 5], shade(color, 0.3));

  hull(0.16); // near hull over the deck

  // tall carved stern post (taurapa) and the prow (tauihu) with its spiral
  const s0 = P(-0.6, 0, sheer(-0.6) + 6);
  poly(ctx, [s0.x - 3, s0.y + 3, s0.x + 3, s0.y + 3, s0.x + 4, s0.y - 15, s0.x - 4, s0.y - 15], WOOD);
  poly(ctx, [s0.x - 2, s0.y - 1, s0.x + 2, s0.y - 1, s0.x + 2.5, s0.y - 13, s0.x - 2.5, s0.y - 13], RED);
  koru(ctx, s0.x, s0.y - 7, 2.2, BONE, 1);
  const p0 = P(0.6, 0, sheer(0.6) + 6);
  poly(ctx, [p0.x - 3, p0.y + 4, p0.x + 3, p0.y + 2, p0.x + 6, p0.y - 9, p0.x + 1, p0.y - 8], WOOD_HI);
  ellipse(ctx, p0.x + 3, p0.y - 9, 2.6, 2.6, BONE); // the carved face
  ellipse(ctx, p0.x + 3, p0.y - 9.4, 1, 1, RED);
  koru(ctx, p0.x + 1, p0.y - 2, 3.2, BONE, 1.1);
  if (level >= 5) for (let i = 0; i < 3; i++) { // a rail of paddles
    const a = P(-0.3 + i * 0.3, 0.16, 12), b = P(-0.3 + i * 0.3, 0.16, 21);
    line(ctx, a.x, a.y, b.x, b.y, BONE, 1);
  }
}

export const render: MechRender = {
  tile(ctx, s, t, cx, cy) {
    if (t.cityId !== null) {
      const c = s.cities.find((k) => k.id === t.cityId);
      if (c && isWaka(c)) drawWaka(ctx, cx, cy, c.level, TRIBES[s.players[c.owner].tribe].color);
      return;
    }
    // Tane's Tapu: a small koru marks land the Maori leave wild
    if (isWater(t) || t.owner === null || t.resource || !isWild(t) || t.terrain === 'mountain') return;
    const host = tileOwnerPlayer(s, t);
    if (host !== null && s.players[host].tribe === 'polynesia') koru(ctx, cx + 17, cy + 5, 3, 'rgba(255,224,120,0.85)', 1.1);
  },

  overlay(ctx, s, viewer, _cam, _ov, now) {
    for (const c of s.cities) {
      if (!isWaka(c) || (viewer >= 0 && !s.players[viewer].explored[c.y * s.size + c.x])) continue;
      const p = tileCenter(c.x, c.y);
      const k = Math.sin(now / 500 + c.id);
      ctx.strokeStyle = `rgba(255,255,255,${0.35 + k * 0.12})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + WATER_DROP + 8, 34 + k * 3, 12 + k, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // on its owner's turn: where the Great Waka can sail (cyan rings) and settle (gold flags)
    if (viewer < 0 || s.current !== viewer || s.players[viewer].tribe !== 'polynesia') return;
    for (const c of wakasOf(s, viewer)) {
      const pulse = 0.55 + 0.25 * Math.sin(now / 320);
      if (!hasSailed(s, c)) for (const t of sailTargets(s, c)) {
        const q = tileCenter(t.x, t.y);
        ctx.strokeStyle = `rgba(120,230,255,${pulse})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(q.x, q.y + WATER_DROP, 8, 4, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (const t of neighbors(s, c.x, c.y)) {
        if (anchorCheck(s, c, t)) continue;
        const q = tileCenter(t.x, t.y);
        line(ctx, q.x, q.y + 2, q.x, q.y - 12, '#5a3b1e', 1.4);
        poly(ctx, [q.x, q.y - 12, q.x + 8, q.y - 9, q.x, q.y - 6], `rgba(255,214,90,${pulse + 0.3})`);
      }
    }
  },
};

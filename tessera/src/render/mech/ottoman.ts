import type { MechRender } from './types';

/** A gold crescent over each conquered city: it pays tribute and trains its old people's elite. */
export const render: MechRender = {
  tile(ctx, s, t, cx, cy) {
    const c = t.cityId === null ? undefined : s.cities.find((k) => k.id === t.cityId);
    if (!c || c.data?.conquered !== true || s.players[c.owner]?.tribe !== 'ottoman') return;
    const x = cx + 18, y = cy - 26;
    ctx.save();
    ctx.fillStyle = '#e8b93a';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a1a30';
    ctx.beginPath();
    ctx.arc(x + 2.5, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8b93a';
    ctx.beginPath();
    ctx.arc(x + 4, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },
};

import { h } from '../dom';
import { signedStars } from '../hudchips';
import { inflationOf } from '../../game/rules';
import { isPaused, isCaravan, payout, state } from '../../game/mech/mali';
import type { MechUi } from './types';

export const ui: MechUi = {
  hud(v) {
    const cars = v.s.units.filter((u) => u.owner === v.me && isCaravan(u));
    const next = cars.reduce((n, u) => n + payout(u), 0);
    const sick = v.s.players.filter((p) => p.id !== v.me && inflationOf(v.s, p.id)).map((p) => `${p.tribe}${isPaused(v.s, p.id) ? ' (halted)' : ''}`);
    return h('div', { class: 'mali' }, `Caravans ${cars.length} · tolls +${next}★ next turn · earned ${state(v.s).tolls}★${sick.length ? ` · inflation: ${sick.join(', ')}` : ''}`);
  },
  chip(v) {
    return { icon: '🐪', text: signedStars(v.s.units.filter((u) => u.owner === v.me && isCaravan(u)).reduce((n, u) => n + payout(u), 0)) };
  },
};

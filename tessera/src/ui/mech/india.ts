import { h } from '../dom';
import { karmaOf } from '../../game/mech/india';
import type { MechUi } from './types';

export const ui: MechUi = {
  hud(v) {
    const k = karmaOf(v.s, v.me);
    const state = k >= 5 ? 'Radiant' : k >= 3 ? 'Blessed' : k <= -3 ? 'Burdened' : 'Balanced';
    return h('div', { class: 'karma' }, `☸ Karma ${k > 0 ? '+' : ''}${k} · ${state}`);
  },
};

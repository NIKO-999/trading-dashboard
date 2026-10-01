import { h } from '../dom';
import { pyramidCost, pyramidIncome, pyramids } from '../../game/mech/nubia';
import type { MechUi } from './types';

export const ui: MechUi = {
  hud(v) {
    const n = pyramids(v.s, v.me).length;
    return h('div', { class: 'karma' }, `🔺 Pyramids ${n} · +${pyramidIncome(v.s, v.me)}★ a turn · next ${pyramidCost(v.s, v.me)}★ · archers beside one shoot +1 tile · Land of the Bow: ranged units 1★ less`);
  },
  chip(v) {
    return { icon: '🔺', text: `${pyramids(v.s, v.me).length} · +${pyramidIncome(v.s, v.me)}★` };
  },
};

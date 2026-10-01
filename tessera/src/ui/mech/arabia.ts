import { h } from '../dom';
import { caravanIncome, caravanseraiCost, caravanserais } from '../../game/mech/arabia';
import type { MechUi } from './types';

export const ui: MechUi = {
  hud(v) {
    const n = caravanserais(v.s, v.me).length;
    return h('div', { class: 'karma' }, `🐪 Caravanserais ${n} · +${caravanIncome(v.s, v.me)}★ a turn · next ${caravanseraiCost(v.s, v.me)}★ · House of Wisdom: met empires' techs 40% off`);
  },
  chip(v) {
    return { icon: '🐪', text: `${caravanserais(v.s, v.me).length} · +${caravanIncome(v.s, v.me)}★` };
  },
};

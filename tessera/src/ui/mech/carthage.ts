import { h } from '../dom';
import { dyeIncome, mercCap, mercsOf, mercUpkeep } from '../../game/mech/carthage';
import type { MechUi } from './types';

// HUD readout: mercenaries under contract against the cap, their wage bill, and what the purple dye pays.
export const ui: MechUi = {
  hud(v) {
    const n = mercsOf(v.s, v.me).length;
    return h('div', { class: 'karma', title: 'Hire veterans from any city for 1.5x the price. Each costs 1★ a turn and deserts when unpaid.' },
      `Mercenaries ${n}/${mercCap(v.s, v.me)} · wages −${mercUpkeep(v.s, v.me)}★ · Purple Dye +${dyeIncome(v.s, v.me)}★`);
  },
  chip(v) {
    const wage = mercUpkeep(v.s, v.me);
    return { icon: '⚔', text: `${mercsOf(v.s, v.me).length}/${mercCap(v.s, v.me)}${wage ? ` · −${wage}★` : ''}` };
  },
};

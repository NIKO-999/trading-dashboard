import { h } from '../dom';
import { TECH_OFF_MAX, zigguratIncome, ziggurats, zigguratTechOff, ZIGGURAT_COST } from '../../game/mech/babylon';
import { citiesOf } from '../../game/rules';
import type { MechUi } from './types';

export const ui: MechUi = {
  hud(v) {
    const n = ziggurats(v.s, v.me).length;
    const cities = citiesOf(v.s, v.me).length;
    return h('div', { class: 'karma' }, `🔭 Ziggurats ${n}/${cities} · +${zigguratIncome(v.s, v.me)}★ a turn · techs −${zigguratTechOff(v.s, v.me)}★ (max ${TECH_OFF_MAX}) · next ${ZIGGURAT_COST}★ · Clay Tablets: Eurekas 60% off`);
  },
  chip(v) {
    return { icon: '🔭', text: `${ziggurats(v.s, v.me).length} · −${zigguratTechOff(v.s, v.me)}★` };
  },
};

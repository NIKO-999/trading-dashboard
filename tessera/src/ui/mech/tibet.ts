import { h } from '../dom';
import { hasMist, solitudeIncome } from '../../game/mech/tibet';
import type { MechUi } from './types';

export const ui: MechUi = {
  hud(v) {
    const cities = v.s.cities.filter((c) => c.owner === v.me);
    const veiled = cities.filter((c) => hasMist(v.s, c)).length;
    return h('div', { class: 'karma' }, `Mist ${veiled}/${cities.length} cities · Solitude +${solitudeIncome(v.s, v.me)}★`);
  },
};

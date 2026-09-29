import { h } from '../dom';
import { counter, levelsWorked, multiplierOf, outpostsOf, totalIncome } from '../../game/mech/inca';
import type { MechUi } from './types';

export const ui: MechUi = {
  hud(v) {
    const cities = v.s.cities.filter((c) => c.owner === v.me);
    const best = cities.reduce((m, c) => Math.max(m, levelsWorked(v.s, c).length), 0);
    return h('div', { class: 'karma' },
      `Chaski ${outpostsOf(v.s, v.me).length} · Zips ${counter(v.s, v.me, 'zips')} · Terraces ${counter(v.s, v.me, 'terraces')} · Staircase x${multiplierOf(best)} (+${totalIncome(v.s, v.me)}★)`);
  },
};

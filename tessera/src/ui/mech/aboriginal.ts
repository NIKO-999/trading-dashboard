import { h } from '../dom';
import { landmarkTotals, memOf, songlineCount } from '../../game/mech/aboriginal';
import type { MechUi } from './types';

export const ui: MechUi = {
  hud(v) {
    const m = memOf(v.s, v.me);
    const lm = landmarkTotals(v.s, v.me);
    return h('div', { class: 'aboriginal' }, `Songlines ${songlineCount(v.s)} · Landmarks ${lm.reached}/${lm.known} · Pilgrimages ${m.trips} (+${m.tripStars}★)`);
  },
};

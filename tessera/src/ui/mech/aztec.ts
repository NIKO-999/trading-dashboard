import { h } from '../dom';
import { altarCities, carried, st, sunCost } from '../../game/mech/aztec';
import type { MechUi } from './types';

export const ui: MechUi = {
  hud(v) {
    const m = st(v.s, v.me);
    const roped = v.s.units.reduce((n, u) => n + (u.owner === v.me ? carried(u) : 0), 0);
    const altars = altarCities(v.s, v.me).length;
    const sun = m.sun > 0 ? ` · Sun Age ${m.sun} turn${m.sun === 1 ? '' : 's'}` : '';
    return h('div', { class: 'aztec' }, `Captives ${m.captives}/${sunCost(v.s, v.me)} at altars${roped ? ` (+${roped} on the march)` : ''} · Altars ${altars} · Bounty +${m.bounty}★${sun}`);
  },
};

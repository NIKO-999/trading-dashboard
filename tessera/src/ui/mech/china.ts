import { h } from '../dom';
import { WALL_PER_CITY, activeWalls, chinaState, improvedTiles, mandate, mandateIncome, wallCap } from '../../game/mech/china';
import type { MechUi } from './types';

const LABEL = { blessed: 'Mandate holds', mourning: 'Mandate withdrawn (new dynasty)', invaded: 'INVADED: income halved' } as const;

export const ui: MechUi = {
  hud(v) {
    if (v.s.players[v.me]?.tribe !== 'china') return null;
    const m = mandate(v.s, v.me), d = mandateIncome(v.s, v.me), st = chinaState(v.s, v.me);
    return h('div', { class: 'china' },
      `${LABEL[m]} ${d >= 0 ? '+' : ''}${d}★ · ${improvedTiles(v.s, v.me)} improved tiles · Great Wall ${activeWalls(v.s, v.me).length}/${wallCap(v.s, v.me)} (${WALL_PER_CITY}/city)${st.shifts ? ` · Shifts ${st.shifts}` : ''}`);
  },
};

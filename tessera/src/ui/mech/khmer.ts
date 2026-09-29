import { h } from '../dom';
import { citiesOf } from '../../game/rules';
import { hydraulics } from '../../game/mech/khmer';
import type { MechUi } from './types';

export const ui: MechUi = {
  hud(v) {
    let stars = 0, barays = 0;
    for (const c of citiesOf(v.s, v.me)) { const r = hydraulics(v.s, c); stars += r.total; barays += r.barays; }
    const floods = v.s.tiles.filter((t) => (t.data?.flood as { by?: number } | undefined)?.by === v.me).length;
    return h('div', { class: 'khmer' }, `Barays ${barays} · Hydraulics +${stars}★${floods ? ` · ${floods} tiles in flood` : ''}`);
  },
};

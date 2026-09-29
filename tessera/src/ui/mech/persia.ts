import { h } from '../dom';
import { fallenCount, garrisoned, satrapies } from '../../game/mech/persia';
import type { MechUi } from './types';

export const ui: MechUi = {
  hud(v) {
    const sat = satrapies(v.s, v.me);
    const bare = sat.filter((c) => !garrisoned(v.s, c)).length;
    const back = fallenCount(v.s, v.me);
    return h('div', { class: 'karma' }, `⚜ Immortals returning ${back} · Satrapies ${sat.length}${bare ? ` (${bare} ungarrisoned)` : ''}`);
  },
};

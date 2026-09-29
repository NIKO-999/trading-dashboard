import { h } from '../dom';
import { captivesOf, havens, plunderOf } from '../../game/mech/vikings';
import type { MechUi } from './types';

export const ui: MechUi = {
  hud(v) {
    return h('div', { class: 'karma' }, `⚓ Havens ${havens(v.s, v.me).length} · Plunder ${plunderOf(v.s, v.me)}★ · Captives ${captivesOf(v.s, v.me)}`);
  },
};

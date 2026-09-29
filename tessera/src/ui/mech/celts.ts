import { h } from '../dom';
import { citiesOf } from '../../game/rules';
import { counter, groveCount, vowForests, vowIncome } from '../../game/mech/celts';
import type { MechUi } from './types';

export const ui: MechUi = {
  hud(v) {
    const groves = groveCount(v.s, v.me);
    const forests = citiesOf(v.s, v.me).reduce((n, c) => n + vowForests(v.s, c).length, 0);
    const rooted = v.s.units.filter((u) => u.owner !== v.me && u.data?.rootBy === v.me && v.s.turn <= (u.data?.rootT as number) + 1).length;
    return h('div', { class: 'celts' }, `Groves ${groves} · Grown forest ${counter(v.s, v.me, 'grown')} · Vow forests ${forests} (+${vowIncome(v.s, v.me)}★)${rooted ? ` · ${rooted} foes rooted` : ''}`);
  },
};

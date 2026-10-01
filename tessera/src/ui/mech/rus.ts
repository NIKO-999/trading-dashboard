import { h } from '../dom';
import { isWinter, winterIn, winterLeft } from '../../game/mech/rus';
import type { MechUi } from './types';

const plural = (n: number) => `${n} turn${n === 1 ? '' : 's'}`;

// The winter calendar: how long the snows still lie, or how soon they come.
export const ui: MechUi = {
  hud(v) {
    const text = isWinter(v.s, v.me) ? `❄ Winter ${plural(winterLeft(v.s, v.me))}` : `❄ in ${plural(winterIn(v.s, v.me))}`;
    return h('div', { class: 'karma' }, text);
  },
  chip(v) {
    return isWinter(v.s, v.me) ? { icon: '❄', text: `${winterLeft(v.s, v.me)}`, tone: 'surge' } : { icon: '❄', text: `in ${winterIn(v.s, v.me)}` };
  },
};

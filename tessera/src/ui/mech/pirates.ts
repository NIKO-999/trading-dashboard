import { h } from '../dom';
import { citiesOf } from '../../game/rules';
import { platformsOf, statsOf } from '../../game/mech/pirates';
import type { MechUi } from './types';

export const ui: MechUi = {
  hud(v) {
    const st = statsOf(v.s, v.me);
    const last = st.lastTollTurn >= v.s.turn - 1 && st.lastToll > 0 ? ` (+${st.lastToll}★ last)` : '';
    return h('div', { class: 'karma' },
      `⚓ Platforms ${platformsOf(v.s, v.me).length} · Sea-cities ${citiesOf(v.s, v.me).length} · Tolls ${st.tolls}★${last} · Raids ${st.raided}★ · Prizes ${st.prizes} · Recruited ${st.recruited}`);
  },
  chip(v) {
    return { icon: '⚓', text: `${statsOf(v.s, v.me).tolls}★ tolls` };
  },
};

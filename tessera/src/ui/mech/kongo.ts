import { h } from '../dom';
import { citiesOf } from '../../game/rules';
import { BOLT_STARS, MAX_BOLTS, NKISI_ATK, NKISI_COST, ORCHARD_STARS, WEAVE_COST, boltIncome, bolts, nkisiCities, orchardIncome } from '../../game/mech/kongo';
import type { MechUi } from './types';

// HUD readout: bolts of raffia in the treasury, what cloth and orchards pay, and how many cities have an nkisi.
export const ui: MechUi = {
  hud(v) {
    const n = bolts(v.s, v.me), pay = boltIncome(v.s, v.me) + orchardIncome(v.s, v.me);
    const guarded = nkisiCities(v.s, v.me).length, of = citiesOf(v.s, v.me).length;
    return h('div', { class: 'karma', title: `Raffia Treasury: weave ${WEAVE_COST}★ into a bolt at the capital (up to ${MAX_BOLTS}); each pays +${BOLT_STARS}★ a turn, all lost if the capital falls. Kingdom of Cloth: each orchard +${ORCHARD_STARS}★. Nkisi (${NKISI_COST}★ per city): enemies beside the city attack −${NKISI_ATK}.` },
      `🧶 Raffia ${n}/${MAX_BOLTS} · cloth & orchards +${pay}★ · nkisi ${guarded}/${of}`);
  },
  chip(v) {
    return { icon: '🧶', text: `${bolts(v.s, v.me)}/${MAX_BOLTS} · +${boltIncome(v.s, v.me) + orchardIncome(v.s, v.me)}★` };
  },
};

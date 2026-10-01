import { h } from '../dom';
import { coutureIncome, salonsOf, salonTechOff, SALON_COST, SALON_LEVEL, SALON_TECH_MAX, TOUR_MAX, tourIncome } from '../../game/mech/france';
import type { MechUi } from './types';

export const ui: MechUi = {
  hud(v) {
    const n = salonsOf(v.s, v.me).length;
    return h('div', { class: 'karma' },
      `🖋️ Salons ${n} · techs −${salonTechOff(v.s, v.me)}★ (max ${SALON_TECH_MAX}) · next ${SALON_COST}★ in a level ${SALON_LEVEL}+ city · 👗 Haute Couture +${coutureIncome(v.s, v.me)}★ · 🧳 Grand Tour +${tourIncome(v.s, v.me)}★ (max ${TOUR_MAX})`);
  },
  chip(v) {
    const n = salonsOf(v.s, v.me).length, off = salonTechOff(v.s, v.me), inc = coutureIncome(v.s, v.me) + tourIncome(v.s, v.me);
    return { icon: '🖋️', text: [`${n} salon${n === 1 ? '' : 's'}`, off ? `−${off}★` : '', inc ? `+${inc}★` : ''].filter(Boolean).join(' · ').slice(0, 16) };
  },
};

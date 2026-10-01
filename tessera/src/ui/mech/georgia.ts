import { h } from '../dom';
import { citiesOf } from '../../game/rules';
import { GOLDEN_STARS, SUPRA_COOLDOWN, SUPRA_COST, goldenAge, goldenIncome, intruders, qvevriCost, qvevriIncome, qvevris, supraCooldown } from '../../game/mech/georgia';
import type { MechUi } from './types';

// HUD readout: whether the Golden Age of Tamar holds, the qvevri cellars and what they pay, and the next supra.
export const ui: MechUi = {
  hud(v) {
    const on = goldenAge(v.s, v.me), n = qvevris(v.s, v.me).length;
    const pay = goldenIncome(v.s, v.me) + qvevriIncome(v.s, v.me);
    const cd = supraCooldown(v.s, v.me);
    const age = on ? `Golden Age +${GOLDEN_STARS * citiesOf(v.s, v.me).length}★` : `Golden Age broken (${intruders(v.s, v.me).length} enemy in borders)`;
    return h('div', { class: 'karma', title: `Golden Age of Tamar: while no enemy stands in your borders, every city pays +${GOLDEN_STARS}★. Qvevri: +1★ a turn, +2★ after 5 turns, +3★ after 10; the next costs ${qvevriCost(v.s, v.me)}★. Supra at the capital: ${SUPRA_COST}★, every ${SUPRA_COOLDOWN} turns.` },
      `🍷 ${age} · qvevri ${n} +${qvevriIncome(v.s, v.me)}★ · supra ${cd ? `in ${cd}` : 'ready'} · total +${pay}★`);
  },
  chip(v) {
    const on = goldenAge(v.s, v.me);
    return { icon: on ? '🍷' : '⚔️', text: `${qvevris(v.s, v.me).length} · +${goldenIncome(v.s, v.me) + qvevriIncome(v.s, v.me)}★`, tone: on ? 'gold' : 'warn' };
  },
};

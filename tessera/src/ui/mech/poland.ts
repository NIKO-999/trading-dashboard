import { h } from '../dom';
import { ELECT_COST, GOLDEN_LEVEL, INTERREGNUM, KINGS, TERM, electCost, goldenIncome, interregnumLeft, kingOf, reignLeft } from '../../game/mech/poland';
import type { MechView } from './types';
import type { MechUi } from './types';

// HUD readout: the reigning king and the turns left, the interregnum, or a call to the Sejm; plus Golden Liberty's pay.
function status(v: MechView): { short: string; long: string } {
  const k = kingOf(v.s, v.me);
  if (k !== null) {
    const n = reignLeft(v.s, v.me);
    return { short: `${KINGS[k].name.split(' ')[0]} ${n}`, long: `${KINGS[k].name} · ${n} turn${n === 1 ? '' : 's'}` };
  }
  const i = interregnumLeft(v.s, v.me);
  if (i > 0) return { short: `Interregnum ${i}`, long: `Interregnum ${i}` };
  const c = electCost(v.s, v.me);
  return { short: 'Elect!', long: `Sejm may elect a king (${c ? `${c}★` : 'free'})` };
}

export const ui: MechUi = {
  hud(v) {
    return h('div', { class: 'karma', title: `The Sejm elects a king at the capital for ${TERM} turns (first election free, then ${ELECT_COST}★), then ${INTERREGNUM} turns of interregnum. ${KINGS.map((k) => `${k.name}: ${k.desc}`).join(' ')} Golden Liberty: every city of level ${GOLDEN_LEVEL}+ pays +1★.` },
      `👑 ${status(v).long} · Golden Liberty +${goldenIncome(v.s, v.me)}★`);
  },
  chip(v) {
    return { icon: '👑', text: status(v).short };
  },
};

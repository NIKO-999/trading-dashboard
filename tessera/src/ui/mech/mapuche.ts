import { h } from '../dom';
import { HOME_DEF, PARL_COST, PARL_EVERY, TOQUI_ATK, TOQUI_COST, TOQUI_EVERY, TOQUI_MOVE, TOQUI_TURNS, atWar, parlIn, toquiFree, toquiIn, toquiLeft } from '../../game/mech/mapuche';
import type { MechUi } from './types';

// HUD readout: whether a toqui leads (and for how long), when the next election and koyang may be held.
export const ui: MechUi = {
  hud(v) {
    const left = toquiLeft(v.s, v.me), wait = toquiIn(v.s, v.me), parl = parlIn(v.s, v.me);
    const toqui = left > 0 ? `Toqui leads: +${TOQUI_MOVE} move, +${TOQUI_ATK} attack (${left} turn${left > 1 ? 's' : ''})`
      : wait > 0 ? `next toqui in ${wait}` : atWar(v.s, v.me) ? `toqui ready${toquiFree(v.s, v.me) ? ' (free)' : ''}` : 'at peace: no toqui';
    return h('div', { class: 'karma', title: `Toqui (${TOQUI_COST}★, every ${TOQUI_EVERY} turns, only in war): ${TOQUI_TURNS} turns of +${TOQUI_MOVE} move and +${TOQUI_ATK} attack. Parlamento (${PARL_COST}★, every ${PARL_EVERY} turns): court your enemies, or rest the army and make the next toqui free. Unconquered: +${HOME_DEF} defence inside your borders.` },
      `🪓 ${toqui} · koyang ${parl > 0 ? `in ${parl}` : 'ready'}`);
  },
  chip(v) {
    const left = toquiLeft(v.s, v.me), wait = toquiIn(v.s, v.me);
    return { icon: '🪓', tone: left > 0 ? 'hot' : undefined, text: left > 0 ? `Toqui ${left}` : wait > 0 ? `${wait}t` : atWar(v.s, v.me) ? 'ready' : 'peace' };
  },
};

import { h } from '../dom';
import { STAKE_COST, STAKE_DAMAGE, stakeCap, stakesOf } from '../../game/mech/vietnam';
import type { MechUi } from './types';

// HUD readout: stakes planted against the cap, and how many have sprung.
export const ui: MechUi = {
  hud(v) {
    const n = stakesOf(v.s, v.me).length, cap = stakeCap(v.s, v.me);
    const sprung = (v.s.players[v.me].mech?.sprung as number | undefined) ?? 0;
    return h('div', { class: 'karma', title: `Plant stakes on shallow water in or beside your land (${STAKE_COST}★). An enemy ship that sails onto them stops and takes ${STAKE_DAMAGE} damage.` },
      `🪵 ${n}/${cap} stakes · sprung ${sprung}`);
  },
  chip(v) {
    return { icon: '🪵', text: `${stakesOf(v.s, v.me).length}/${stakeCap(v.s, v.me)}` };
  },
};

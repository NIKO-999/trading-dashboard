import { h } from '../dom';
import { DIRS, lighthouses, tradeReport, turnsToShift, windDir } from '../../game/mech/swahili';
import type { MechUi } from './types';

// HUD readout: the wind arrow with turns until it shifts, lighthouses, and the trade pay due next turn.
export const ui: MechUi = {
  hud(v) {
    const d = DIRS[windDir(v.s)];
    const r = tradeReport(v.s, v.me);
    const lh = lighthouses(v.s, v.me).length;
    return h('div', { class: 'swahili', title: 'Sail with the wind for double trade; Lighthouses call the wind.' },
      `Wind ${d.arrow} ${d.name} (${turnsToShift(v.s)}t) · Lighthouses ${lh} · Trade +${r.total}★`);
  },
};

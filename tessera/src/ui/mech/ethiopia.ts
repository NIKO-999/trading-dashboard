import { h } from '../dom';
import { STELE_PER_CITY, activeSteles, gridLinks, steleCap, tariff } from '../../game/mech/ethiopia';
import type { MechUi } from './types';

export const ui: MechUi = {
  hud(v) {
    if (v.s.players[v.me]?.tribe !== 'ethiopia') return null;
    const n = activeSteles(v.s, v.me).length;
    return h('div', { class: 'karma' }, `Stelae ${n}/${steleCap(v.s, v.me)} (${STELE_PER_CITY}/city) · Grid ${gridLinks(v.s, v.me).length} · Tariff +${tariff(v.s, v.me)}★`);
  },
};

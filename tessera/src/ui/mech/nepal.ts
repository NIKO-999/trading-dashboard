import { h } from '../dom';
import { citiesOf } from '../../game/rules';
import { BRIDGE_COST, BRIDGE_STEP, HIMALAYA_ATK, RECRUIT_COOLDOWN, bridgesOf, hillCity, recruitReady } from '../../game/mech/nepal';
import type { MechUi } from './types';

// HUD readout: rope bridges slung, and how many hill cities are ready to send a veteran Gurkha.
export const ui: MechUi = {
  hud(v) {
    const bridges = bridgesOf(v.s, v.me).length;
    const hills = citiesOf(v.s, v.me).filter((c) => hillCity(v.s, c));
    const ready = hills.filter((c) => !recruitReady(v.s, c)).length;
    return h('div', { class: 'karma', title: `Rope Bridges (${BRIDGE_COST}★ on a mountain in your borders): your units step on and off at ${BRIDGE_STEP} move without stopping. Gurkha Recruits: a city on or beside a mountain raises a veteran Gurkha for the normal price, once every ${RECRUIT_COOLDOWN} turns. Himalayan Kingdom: units on or next to a mountain attack +${HIMALAYA_ATK}.` },
      `🌉 Rope bridges ${bridges} · 🗡️ Gurkha levies ready ${ready}/${hills.length} hill cities · ⛰️ +${HIMALAYA_ATK} attack by the peaks`);
  },
  chip(v) {
    const hills = citiesOf(v.s, v.me).filter((c) => hillCity(v.s, c));
    const ready = hills.filter((c) => !recruitReady(v.s, c)).length;
    return { icon: '🌉', text: `${bridgesOf(v.s, v.me).length} · 🗡️${ready}/${hills.length}` };
  },
};

import { h } from '../dom';
import { ablaze, tributeWait } from '../../game/mech/byzantium';
import type { MechUi } from './types';

// HUD readout: how many foes burn with Greek fire, and how many cities may send envoys with tribute right now.
export const ui: MechUi = {
  hud(v) {
    const fire = ablaze(v.s, v.me).length;
    const cities = v.s.cities.filter((c) => c.owner === v.me);
    const ready = cities.filter((c) => tributeWait(v.s, c) === 0).length;
    return h('div', { class: 'karma', title: 'Ships and coastal walls set foes ablaze: 2 damage a turn for 2 turns. Pay tribute from a city to blunt the enemies near it.' },
      `🔥 ${fire} ablaze · Envoys ready ${ready}/${cities.length} · Walls +1`);
  },
  chip(v) {
    const fire = ablaze(v.s, v.me).length;
    return { icon: '🔥', text: `${fire} ablaze`, tone: fire > 0 ? 'hot' : undefined };
  },
};

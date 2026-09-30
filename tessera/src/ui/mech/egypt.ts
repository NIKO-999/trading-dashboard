import { h } from '../dom';
import { siltPhase, wondersOf } from '../../game/mech/egypt';
import type { MechUi } from './types';

export const ui: MechUi = {
  hud(v) {
    const mine = (owner: number | null) => owner !== null && v.s.cities.find((c) => c.id === owner)?.owner === v.me;
    const silt = v.s.tiles.filter((t) => siltPhase(t) !== null && mine(t.owner));
    const next = silt.length ? 4 - Math.max(...silt.map((t) => siltPhase(t)!)) : 0;
    return h('div', { class: 'karma' }, `Wonders ${wondersOf(v.s, v.me)} · Silt fields ${silt.length}${silt.length ? ` · Flood in ${next}` : ''}`);
  },
  chip(v) {
    const mine = (owner: number | null) => owner !== null && v.s.cities.find((c) => c.id === owner)?.owner === v.me;
    const silt = v.s.tiles.filter((t) => siltPhase(t) !== null && mine(t.owner));
    return silt.length ? { icon: '🌊', text: `flood ${4 - Math.max(...silt.map((t) => siltPhase(t)!))}t` } : { icon: '🏛', text: String(wondersOf(v.s, v.me)) };
  },
};

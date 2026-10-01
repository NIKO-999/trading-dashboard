import { h } from '../dom';
import { fleet, fleetIncome, missionIncome, missions, plundered } from '../../game/mech/spain';
import type { MechUi } from './types';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// HUD readout: the treasure fleet and what it pays, the Missions and their tithe, and the plunder taken so far.
export const ui: MechUi = {
  hud(v) {
    const ships = fleet(v.s, v.me).length, ms = missions(v.s, v.me).length;
    const loot = plundered(v.s, v.me);
    return h('div', { class: 'karma', title: 'Every ship and warship pays +1★ a turn. Missions pay +1★ (+2★ beside a conquered city) and heal your wounded. Taking a city plunders 3★ per level.' },
      `⚓ ${plural(ships, 'galleon', 'galleons')} · +${fleetIncome(v.s, v.me)}★ · ⛪ ${plural(ms, 'Mission', 'Missions')} · +${missionIncome(v.s, v.me)}★${loot ? ` · plunder ${loot}★` : ''}`);
  },
  chip(v) {
    return { icon: '⚓', text: `${fleet(v.s, v.me).length} · +${fleetIncome(v.s, v.me) + missionIncome(v.s, v.me)}★` };
  },
};

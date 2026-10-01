import { h } from '../dom';
import { MARQUE_COOLDOWN, inDock, marqueActive, marqueLeft, marqueWait, navy } from '../../game/mech/england';
import type { MechUi } from './types';

const plural = (n: number) => `${n} turn${n === 1 ? '' : 's'}`;

// The Royal Navy at a glance: the privateer commission (running, ready, or cooling down) and the ships in dock.
export const ui: MechUi = {
  hud(v) {
    const { s, me } = v;
    const ships = navy(s, me);
    const docked = ships.filter((u) => inDock(s, me, u)).length;
    const p = s.players[me].mech as { prizes?: number; stolen?: number } | undefined;
    const marque = marqueActive(s, me) ? `⚓ Marque ${plural(marqueLeft(s, me))} left` : marqueWait(s, me) ? `⚓ Marque in ${plural(marqueWait(s, me))}` : '⚓ Marque ready';
    return h('div', { class: 'karma', title: `Letters of Marque (at the capital, every ${MARQUE_COOLDOWN} turns): enemy ships your ships damage lose 1★ to you. Ships in or beside your ports repair fully each turn; a sunk enemy vessel pays 3★.` },
      `${marque} · Fleet ${ships.length} (${docked} in dock) · Prizes +${(p?.prizes ?? 0) + (p?.stolen ?? 0)}★`);
  },
  chip(v) {
    if (marqueActive(v.s, v.me)) return { icon: '⚓', text: `${marqueLeft(v.s, v.me)}`, tone: 'surge' };
    const w = marqueWait(v.s, v.me);
    return { icon: '⚓', text: w ? `in ${w}` : 'ready' };
  },
};

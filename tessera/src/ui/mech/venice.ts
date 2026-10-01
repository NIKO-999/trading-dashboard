import { h } from '../dom';
import { ARSENAL_COOLDOWN, arsenalReady, convoyIncome, convoyShips, CONVOY_CAP, interest, INTEREST_CAP } from '../../game/mech/venice';
import type { MechUi } from './types';

// HUD readout: the treasury's interest, the convoy unloading at the quays, and how many Arsenals are ready to launch.
export const ui: MechUi = {
  hud(v) {
    const ready = arsenalReady(v.s, v.me).length;
    const ships = convoyShips(v.s, v.me).length;
    return h('div', { class: 'karma', title: `Every 10★ held earns +1★ a turn (at most +${INTEREST_CAP}★). Ships beside your cities unload +1★ each (at most +${CONVOY_CAP}★). A city with a Port launches a half-price warship from the Arsenal once every ${ARSENAL_COOLDOWN} turns.` },
      `🏦 Interest +${interest(v.s, v.me)}★ · ⚓ Convoy ${Math.min(ships, CONVOY_CAP)}/${CONVOY_CAP} +${convoyIncome(v.s, v.me)}★ · ⚒ Arsenal ${ready ? `${ready} ready` : 'refitting'}`);
  },
  chip(v) {
    const ready = arsenalReady(v.s, v.me).length;
    return { icon: '🦁', text: `+${interest(v.s, v.me) + convoyIncome(v.s, v.me)}★${ready ? ` · ⚒${ready}` : ''}` };
  },
};

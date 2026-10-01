import { h } from '../dom';
import { GOLD_PER_MINE, HEAL_HP, MAX_GOLD, ROAD_STARS, SPEND, SPEND_STARS, STOOL_DEF, dustPerTurn, gold, roadCities, roadIncome } from '../../game/mech/ashanti';
import type { MechUi } from './types';

// HUD readout: gold dust in the treasury and what the mines add each turn, and how many cities the Great Roads join.
export const ui: MechUi = {
  hud(v) {
    const g = gold(v.s, v.me), per = dustPerTurn(v.s, v.me), linked = roadCities(v.s, v.me).length;
    return h('div', { class: 'karma', title: `Gold dust: each mine yields ${GOLD_PER_MINE} a turn (up to ${MAX_GOLD}). Spend it at the capital: ${SPEND[0].dust} for +${SPEND_STARS}★, ${SPEND[1].dust} to heal all units ${HEAL_HP}, ${SPEND[2].dust} for +1 pop in every city. Great Roads: each city joined to the capital by road pays +${ROAD_STARS}★. Golden Stool: units in the capital defend +${STOOL_DEF}.` },
      `⚖️ Gold dust ${g}/${MAX_GOLD} (+${per}/turn) · Great Roads ${linked} cit${linked === 1 ? 'y' : 'ies'} +${roadIncome(v.s, v.me)}★`);
  },
  chip(v) {
    return { icon: '⚖️', text: `${gold(v.s, v.me)}/${MAX_GOLD} · +${roadIncome(v.s, v.me)}★` };
  },
};

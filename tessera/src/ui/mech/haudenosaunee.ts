import { h } from '../dom';
import { COUNCIL_COST, COUNCIL_EVERY, LEAGUE_DEF, LEAGUE_MAX, LEAGUE_RANGE, councilIn, leagueIncome, leagueOf } from '../../game/mech/haudenosaunee';
import type { MechUi } from './types';

// HUD readout: League members against the cap, the income they pay, and when the Condolence Council may sit again.
export const ui: MechUi = {
  hud(v) {
    const n = leagueOf(v.s, v.me).length, wait = councilIn(v.s, v.me);
    return h('div', { class: 'karma', title: `Cities within ${LEAGUE_RANGE} tiles of the League join it, growing out from your capital (at most ${LEAGUE_MAX}). Each member beyond the first pays +1★; your units defend +${LEAGUE_DEF} in League land. Condolence Council at the capital (${COUNCIL_COST}★, every ${COUNCIL_EVERY} turns) heals every unit.` },
      `🪶 League ${n}/${LEAGUE_MAX} · +${leagueIncome(v.s, v.me)}★ · council ${wait ? `in ${wait}` : 'ready'}`);
  },
  chip(v) {
    return { icon: '🪶', text: `${leagueOf(v.s, v.me).length}/${LEAGUE_MAX}` };
  },
};

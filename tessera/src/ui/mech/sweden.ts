import { h } from '../dom';
import { citiesOf } from '../../game/rules';
import { STOCK_CAP, stockOf } from '../../game/goods';
import { COPPER_COST, COPPER_EVERY, COPPER_IRON, COPPER_STARS, VETERAN_KILLS, WINTER_MOVE, copperWhy, onWinter } from '../../game/mech/sweden';
import type { MechUi } from './types';

// HUD readout: how many cities could sell Falun copper now, the iron stockpile, and units ready for a Winter March.
function counts(v: { s: Parameters<typeof citiesOf>[0]; me: number }) {
  const cs = citiesOf(v.s, v.me);
  return {
    ready: cs.filter((c) => !copperWhy(v.s, v.me, c)).length,
    marching: v.s.units.filter((u) => u.owner === v.me && onWinter(v.s, u)).length,
    iron: stockOf(v.s.players[v.me]).iron,
  };
}

export const ui: MechUi = {
  hud(v) {
    const n = counts(v);
    return h('div', { class: 'karma', title: `Carolean Drill: veterans after ${VETERAN_KILLS} kills. Winter March: land units starting on tundra or ice move +${WINTER_MOVE}. Falun Copper (${COPPER_COST}★ in a city with a Mine, every ${COPPER_EVERY} turns): +${COPPER_IRON} Iron and +${COPPER_STARS}★.` },
      `👑 Copper ready in ${n.ready} cit${n.ready === 1 ? 'y' : 'ies'} · ⛏ ${n.iron}/${STOCK_CAP} · ❄ ${n.marching} on the winter march`);
  },
  chip(v) {
    const n = counts(v);
    return { icon: '👑', text: n.marching ? `${n.ready} copper · ❄${n.marching}` : `${n.ready} copper` };
  },
};

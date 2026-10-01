import { h } from '../dom';
import { citiesOf } from '../../game/rules';
import { ENLIGHT_LEVEL, ENLIGHT_MAX, GAMES_COST, GAMES_EVERY, GAMES_RANGE, MOUNTAIN_DEF, MOURN_STARS, enlightenmentTechOff, gamesIn } from '../../game/mech/scotland';
import type { MechUi } from './types';

// HUD readout: the Enlightenment's tech discount and how many cities could hold the Highland Games now.
function ready(v: { s: Parameters<typeof citiesOf>[0]; me: number }) {
  const cs = citiesOf(v.s, v.me);
  return { n: cs.filter((c) => gamesIn(v.s, c) === 0).length, of: cs.length };
}

export const ui: MechUi = {
  hud(v) {
    const off = enlightenmentTechOff(v.s, v.me), r = ready(v);
    return h('div', { class: 'karma', title: `Scottish Enlightenment: each city of level ${ENLIGHT_LEVEL}+ makes techs 1★ cheaper (at most ${ENLIGHT_MAX}★). Highland Games (${GAMES_COST}★ in a city, every ${GAMES_EVERY} turns): units within ${GAMES_RANGE} gain a kill toward veteran, the city +1 pop. Units on or beside mountains defend +${MOUNTAIN_DEF}; each one fallen in battle sends +${MOURN_STARS}★.` },
      `🏴󠁧󠁢󠁳󠁣󠁴󠁿 Techs −${off}★ · games ready in ${r.n}/${r.of} cities`);
  },
  chip(v) {
    return { icon: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', text: `−${enlightenmentTechOff(v.s, v.me)}★ · ${ready(v).n}` };
  },
};

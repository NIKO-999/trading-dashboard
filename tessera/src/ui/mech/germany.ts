import { h } from '../dom';
import {
  DIET_COOLDOWN, DIET_ELECTORS, EDICTS, ELECTOR_LEVEL, FREE_CITY_STARS, HANSE_PORT, HANSE_STARS, dietCooldown, dietWhy, electors,
  freeCityIncome, hanseIncome, landfriedenLeft,
} from '../../game/mech/germany';
import type { MechUi, MechView } from './types';

// HUD readout: the Electors, the Diet (ready, or the turns until it may sit), a Landfrieden in force, and the Hanse's pay.
function status(v: MechView): { short: string; long: string; tone?: 'gold' } {
  const n = electors(v.s, v.me).length;
  const lf = landfriedenLeft(v.s, v.me);
  const peace = lf > 0 ? ` · Landfrieden ${lf}` : '';
  if (!dietWhy(v.s, v.me)) return { short: `Diet! ${n}E`, tone: 'gold' as const, long: `${n} Electors · the Diet may sit${peace}` };
  const cd = dietCooldown(v.s, v.me);
  if (cd > 0) return { short: `Diet ${cd}`, long: `${n} Electors · Diet in ${cd} turn${cd === 1 ? '' : 's'}${peace}` };
  return { short: `${n}/${DIET_ELECTORS} Electors`, long: `${n}/${DIET_ELECTORS} Electors${peace}` };
}

export const ui: MechUi = {
  hud(v) {
    const pay = hanseIncome(v.s, v.me) + freeCityIncome(v.s, v.me);
    return h('div', {
      class: 'karma',
      title: `Hanseatic League: every market pays +${HANSE_STARS}★, +${HANSE_PORT}★ more beside a port. Free Imperial Cities: every city but the capital with a market pays +${FREE_CITY_STARS}★. Cities of level ${ELECTOR_LEVEL}+ are Electors; with ${DIET_ELECTORS} of them the capital may call a free Imperial Diet every ${DIET_COOLDOWN} turns. ${EDICTS.map((e) => `${e.name}: ${e.desc}`).join(' ')}`,
    }, `🦅 ${status(v).long} · Hanse +${pay}★`);
  },
  chip(v) {
    const st = status(v);
    return { icon: '🦅', text: st.short, tone: st.tone };
  },
};

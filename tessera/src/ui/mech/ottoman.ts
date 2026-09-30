import { h } from '../dom';
import { signedStars } from '../hudchips';
import { LEVY_CAP, TRIBUTE_CAP, conqueredCities, eliteOf, levies, tributeTotal } from '../../game/mech/ottoman';
import { UNITS } from '../../data/units';
import type { MechUi } from './types';

export const ui: MechUi = {
  hud(v) {
    const cities = conqueredCities(v.s, v.me);
    const elites = [...new Set(cities.map((c) => eliteOf(c)).filter((k): k is NonNullable<typeof k> => !!k))].map((k) => UNITS[k].name);
    return h('div', { class: 'ottoman' },
      `Devshirme +${tributeTotal(v.s, v.me)}★/${TRIBUTE_CAP} · Levies ${levies(v.s, v.me)}/${LEVY_CAP} · ${cities.length} conquered${elites.length ? ` (elites: ${elites.join(', ')})` : ''}`);
  },
  chip(v) {
    return { icon: '⚔', text: `${signedStars(tributeTotal(v.s, v.me))} · ${levies(v.s, v.me)}/${LEVY_CAP}` };
  },
};

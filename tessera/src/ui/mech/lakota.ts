import { h } from '../dom';
import { citiesOf } from '../../game/rules';
import { herdersOf, herdIncome, herdsIn, isHerd, isPacked, soilOf } from '../../game/mech/lakota';
import type { MechUi } from './types';

// Lakota: the camp's state (settled or packed), the herds and what following them pays, and the enriched soil left behind.
export const ui: MechUi = {
  hud(v) {
    const cities = citiesOf(v.s, v.me);
    if (!cities.length) return null;
    const herds = v.s.tiles.filter(isHerd).length;
    const soil = v.s.tiles.filter((t) => soilOf(t)?.by === v.me).length;
    const stars = cities.reduce((n, c) => n + herdIncome(v.s, c), 0);
    const herders = cities.reduce((n, c) => n + herdersOf(c), 0);
    const near = cities.reduce((n, c) => n + herdsIn(v.s, c).length, 0);
    const packed = cities.filter(isPacked);
    const camp = packed.length ? `${packed.length} packed: tap a plains tile to move, then Settle` : 'camps settled';
    return h('div', { class: 'lakota' }, `Herds ${herds} (${near} in reach) · herders ${herders} +${stars}★ · ${camp}${soil ? ` · soil ${soil}` : ''}`);
  },
};

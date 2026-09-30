import { h } from '../dom';
import { signedStars } from '../hudchips';
import { citiesOf } from '../../game/rules';
import { counter, hasSailed, isWaka, tapuIncome, wakasOf, wildTiles } from '../../game/mech/polynesia';
import type { MechUi } from './types';

export const ui: MechUi = {
  hud(v) {
    const wakas = wakasOf(v.s, v.me);
    const afloat = wakas.length
      ? `Great Waka ${wakas.map((c) => `${c.name} ${hasSailed(v.s, c) ? '(sailed)' : '(ready to sail)'}`).join(', ')}`
      : `Anchored (${citiesOf(v.s, v.me).filter((c) => !isWaka(c)).length} on land)`;
    return h('div', { class: 'polynesia' }, `${afloat} · Tapu +${tapuIncome(v.s, v.me)}★ from ${wildTiles(v.s, v.me)} wild tiles · fed ${counter(v.s, v.me, 'absorbed')}`);
  },
  chip(v) {
    return wakasOf(v.s, v.me).some((c) => !hasSailed(v.s, c)) ? { icon: '🛶', text: 'ready', tone: 'hot' } : { icon: '🛶', text: signedStars(tapuIncome(v.s, v.me)) };
  },
  dock(v) {
    const c = wakasOf(v.s, v.me)[0];
    if (!c) return null;
    return { label: 'Waka', icon: 'globe', open: () => v.focus(c.x, c.y) };
  },
};

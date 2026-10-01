import { h } from '../dom';
import { TECH_BY_ID } from '../../data/techs';
import { TRIBUTE_COOLDOWN, TRIBUTE_MAX, deportedOf, libraryOf, tributeTotal, tributeWait } from '../../game/mech/assyria';
import type { MechUi } from './types';

export const ui: MechUi = {
  hud(v) {
    const wait = tributeWait(v.s, v.me);
    const books = libraryOf(v.s, v.me).map((id) => TECH_BY_ID[id]?.name ?? id);
    const trib = wait > 0 ? `Terror Tribute in ${wait} turn${wait === 1 ? '' : 's'}` : `Terror Tribute ready (+${tributeTotal(v.s, v.me)}★ of ${TRIBUTE_MAX}, every ${TRIBUTE_COOLDOWN} turns)`;
    return h('div', { class: 'karma' }, `🦁 ${trib} · 📜 Library: ${books.length ? books.join(', ') : 'no tablets taken yet'} · ⛓️ ${deportedOf(v.s, v.me)} deported · Siege Masters: siege engines 2★ less`);
  },
  chip(v) {
    const wait = tributeWait(v.s, v.me);
    return { icon: '🦁', text: `${wait > 0 ? `${wait}t` : 'ready'} · 📜${libraryOf(v.s, v.me).length}` };
  },
};

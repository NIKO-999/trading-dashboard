import { h } from '../dom';
import { padraoCap, padraoIncome, padroes, portIncome, ports } from '../../game/mech/portugal';
import type { MechUi } from './types';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// HUD readout: the feitorias (ports) and what they pay, and the padrões raised against the cap of one per city.
export const ui: MechUi = {
  hud(v) {
    const p = ports(v.s, v.me).length, n = padroes(v.s, v.me).length, cap = padraoCap(v.s, v.me);
    return h('div', { class: 'karma', title: 'Feitorias: every port pays +1★ a turn. A boat or ship beside unclaimed land 5+ tiles from your cities can raise a padrão (3★, one per city): +1★ a turn, +1★ more on the coast, and you see 2 tiles around it.' },
      `⚓ ${plural(p, 'feitoria', 'feitorias')} · +${portIncome(v.s, v.me)}★ · 🗿 ${n}/${cap} padrões · +${padraoIncome(v.s, v.me)}★`);
  },
  chip(v) {
    return { icon: '🗿', text: `${padroes(v.s, v.me).length}/${padraoCap(v.s, v.me)} · +${portIncome(v.s, v.me) + padraoIncome(v.s, v.me)}★` };
  },
};

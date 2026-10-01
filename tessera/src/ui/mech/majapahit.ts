import { h } from '../dom';
import { MANDALA_COST, MANDALA_TURNS, RAID_LOSS, TRADE_STARS, mandalaLeft, portVisits } from '../../game/mech/majapahit';
import type { MechUi } from './types';

// HUD readout: foreign ports your jongs lie beside now and what they will pay next turn, and any mandala tribute.
export const ui: MechUi = {
  hud(v) {
    const visits = portVisits(v.s, v.me);
    const raids = visits.filter((e) => e.raid).length;
    const left = mandalaLeft(v.s, v.me);
    const tribute = left ? (v.s.players[v.me].mech?.mandala as { n: number } | undefined)?.n ?? 0 : 0;
    return h('div', { class: 'karma', title: `A galley or warship beside another empire's coastal city at the start of your turn trades for ${TRADE_STARS}★ (one ship per port). At war it is a raid: the owner also loses ${RAID_LOSS}★. Mandala tribute at the capital (${MANDALA_COST}★): +1★ a turn per visited port for ${MANDALA_TURNS} turns.` },
      `⛵ ${visits.length} port${visits.length === 1 ? '' : 's'} · +${visits.length * TRADE_STARS}★${raids ? ` · ${raids} raid${raids === 1 ? '' : 's'}` : ''}${left && tribute ? ` · mandala +${tribute}★ (${left})` : ''}`);
  },
  chip(v) {
    const n = portVisits(v.s, v.me).length;
    return { icon: '⛵', text: `+${n * TRADE_STARS}★`, tone: n ? 'gold' : undefined };
  },
};

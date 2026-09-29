import { h } from '../dom';
import { modal } from '../modal';
import { doAction } from '../../game/rules';
import { activeEdict, alignedCities, alignmentIncome, edictLeft, EDICTS, EDICT_PREFIX, EDICT_TURNS, offered, REPEAL_COST, seatOf, seatTileOf, votes } from '../../game/mech/greeks';
import type { MechUi, MechView } from './types';

// The Edict dock button opens the assembly: three offered edicts with the cities' votes; each button runs the same
// `mech:edict:<id>` tile action through doAction (free when no edict runs, REPEAL_COST to replace a running one).
function openEdicts(v: MechView) {
  const cur = activeEdict(v.s, v.me);
  const tally = votes(v.s, v.me);
  const cost = cur ? REPEAL_COST : 0;
  const myTurn = v.s.current === v.me;
  const stars = v.s.players[v.me].stars;
  const seat = seatOf(v.s, v.me);
  const offer = offered(v.s, v.me);
  const body: (Node | string)[] = [
    h('p', {}, `Seat of the polis: ${seat ? seat.name : 'none'} (the largest city). ${cur ? `In force: ${EDICTS[cur].name}, ${edictLeft(v.s, v.me)} turns left. Replacing it costs ${REPEAL_COST} stars.` : `No edict in force. Choose one (free); it lasts ${EDICT_TURNS} turns.`}`),
    ...offer.map((id) => h('p', {}, h('b', {}, EDICTS[id].name), ` - ${EDICTS[id].desc} (${tally[id] ?? 0} city votes)`)),
  ];
  const t = seatTileOf(v.s, v.me);
  const top = Math.max(...offer.map((k) => tally[k] ?? 0));
  const buttons = offer.map((id) => ({
    label: `${EDICTS[id].name}${cost ? ` (${cost}★)` : ''}`,
    primary: (tally[id] ?? 0) === top,
    onClick: () => { if (t && myTurn && cur !== id && stars >= cost) v.act(() => doAction(v.s, v.me, t, EDICT_PREFIX + id)); },
  }));
  modal({ title: 'Assembly of the Polis', body, buttons: [...buttons, { label: 'Close' }], dismissable: true });
}

export const ui: MechUi = {
  hud(v) {
    const cur = activeEdict(v.s, v.me);
    const seat = seatOf(v.s, v.me);
    const al = alignedCities(v.s, v.me).length;
    const edict = cur ? `${EDICTS[cur].name} (${edictLeft(v.s, v.me)})` : 'none - use the Edict button';
    return h('div', { class: 'karma' }, `Seat ${seat?.name ?? '-'} · Edict ${edict} · Amphictyony ${al ? `${al} cities +${alignmentIncome(v.s, v.me)}★` : 'unbalanced'}`);
  },
  dock(v) {
    return { label: activeEdict(v.s, v.me) ? 'Edict' : 'Edict!', icon: 'crown', open: () => openEdicts(v) };
  },
};

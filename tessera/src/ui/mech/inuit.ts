import { h } from '../dom';
import { isIce, restLeft, stats } from '../../game/mech/inuit';
import { tileOwnerPlayer } from '../../game/rules';
import type { MechUi } from './types';

export const ui: MechUi = {
  hud(v) {
    const ice = v.s.tiles.filter((t) => isIce(t)).length;
    const nodes = v.s.tiles.filter((t) => (t.resource === 'whale' || t.resource === 'fish') && tileOwnerPlayer(v.s, t) === v.me);
    const thawed = nodes.filter((t) => restLeft(t) > 0).length;
    const st = stats(v.s, v.me);
    return h('div', { class: 'inuit' }, `Ice ${ice} · Nodes ${nodes.length - thawed} ready${thawed ? ` / ${thawed} thawing` : ''} · Harvests ${st.whales + st.fish}`);
  },
  chip(v) {
    const nodes = v.s.tiles.filter((t) => (t.resource === 'whale' || t.resource === 'fish') && tileOwnerPlayer(v.s, t) === v.me);
    return { icon: '❄', text: `${nodes.filter((t) => restLeft(t) <= 0).length} ready` };
  },
};

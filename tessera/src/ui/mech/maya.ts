import { h } from '../dom';
import { ERAS, ERA_TURNS, PROPHECY_COST, activeEra, eraFor, eraName, katunIncome, nextEpoch, prophecyFor, turnsToEra, turnsToGreat, turnsToKatun, wantedEra } from '../../game/mech/maya';
import type { MechUi } from './types';

// The Long Count clock: the era in force, the countdown to the next one, the Katun peak and the Great Cycle.
export const ui: MechUi = {
  hud(v) {
    const s = v.s;
    const isMaya = s.players[v.me]?.tribe === 'maya';
    const now = activeEra(s);
    const want = wantedEra(s);
    const n = turnsToEra(s);
    const k = nextEpoch(s);
    const set = prophecyFor(s, k);
    let next = `Next Era in ${n} turn${n === 1 ? '' : 's'}`;
    if (set) next += ` - ${eraName(set)} (prophesied)`;
    else if (n <= 3) next += ` - omen: ${eraName(eraFor(s, k))}`;
    const era = now ? `ERA: ${eraName(now)} (${want?.left ?? 0}/${ERA_TURNS} turns) | ` : '';
    let line = `\u{1F55B} Long Count: ${era}${next}`;
    if (isMaya) {
      const kt = katunIncome(s, v.me);
      const peak = turnsToKatun(s) === 0 && s.turn > 0;
      line += ` | Katun ${peak ? `PEAK NOW (x2 = +${kt.total}★, build today for full yield)` : `peak in ${turnsToKatun(s)}`} | Great Cycle in ${turnsToGreat(s)}`;
      if (!set) line += ` | Tap your capital to prophesy (${PROPHECY_COST}★)`;
    }
    const color = now ? ERAS.find((e) => e.id === now)!.color : undefined;
    return h('div', { class: 'maya', style: color ? { color } : {} }, line);
  },
  chip(v) {
    const s = v.s;
    if (s.players[v.me]?.tribe === 'maya' && turnsToKatun(s) === 0 && s.turn > 0) return { icon: '🕛', text: 'Katun peak', tone: 'gold' };
    const now = activeEra(s);
    return now ? { icon: '🕛', text: eraName(now), tone: 'hot' } : { icon: '🕛', text: `era in ${turnsToEra(s)}t` };
  },
};

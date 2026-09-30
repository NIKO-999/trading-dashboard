// The Free Cities on screen (see game/citystates): the city panel's envoys, suzerain and bonus table, and the Free
// Cities chip under the score bar with every city the viewer has found.
import { TRIBES } from '../data/tribes';
import { cityOfFree, envoyCost, envoysOf, freeDescribe, FREE_KINDS, metFree, tierOf, TIER2 } from '../game/citystates';
import type { City, GameState } from '../game/types';
import { h } from './dom';
import type { HudLine } from './hudchips';

const STANDING = ['no favour yet', 'the small favour', 'the bigger favour', 'suzerain'];
const who = (s: GameState, pid: number) => TRIBES[s.players[pid].tribe].people;
const dot = (s: GameState, pid: number) => h('span', { class: 'free-dot', style: { '--tc': TRIBES[s.players[pid].tribe].color } as Record<string, string> });

/** The Free City part of the city panel: what it is, who keeps envoys there, the suzerain and the bonus table. */
export function freeCityInfo(s: GameState, c: City, me: number): HTMLElement | null {
  const v = freeDescribe(s, c, me);
  if (!v) return null;
  const K = FREE_KINDS[v.kind];
  return h('div', { class: 'free-info' },
    h('div', {}, v.line),
    h('div', { class: 'free-envoys' }, h('b', {}, 'Envoys: '),
      ...(v.envoys.length ? v.envoys.flatMap((e, i) => [i ? ', ' : '', dot(s, e.pid), `${who(s, e.pid)} ${e.n}`]) : ['none yet'])),
    h('div', {}, h('b', {}, 'Suzerain: '), ...(v.suz !== null ? [dot(s, v.suz), `the ${who(s, v.suz)} empire`] : [`none (needs ${TIER2}+ envoys and strictly the most)`])),
    h('table', { class: 'free-table' }, ...v.table.map(([k, b], i) => h('tr', { class: v.tier === i + 1 ? 'on' : '' }, h('td', {}, k), h('td', {}, b)))),
    h('div', { class: 'free-you' }, `${K.icon} You: ${v.mine} envoy${v.mine === 1 ? '' : 's'} (${STANDING[v.tier]}). Next envoy ${envoyCost(s, me)}★.`),
    v.quest ? h('div', { class: 'free-quest' }, `Quest: ${v.quest}`) : null,
    v.foe ? h('div', { class: 'free-foe' }, v.foe) : null);
}

/** The Free Cities chip: how many envoys the viewer keeps and its suzerainties; a tap opens the list of every city found. */
export function freeHudLine(s: GameState, me: number): HudLine | null {
  if (!s.free) return null;
  const found = s.free.cities.filter((f) => metFree(s, me, f));
  if (!found.length) return null;
  const envoys = found.reduce((n, f) => n + envoysOf(f, me), 0);
  const suz = found.filter((f) => f.suz === me).length;
  return {
    key: 'free', icon: '🏳', text: suz ? `${envoys} env · ${suz} suz` : `${envoys} envoy${envoys === 1 ? '' : 's'}`, tone: suz ? 'gold' : undefined,
    full: h('div', { class: 'skill-hud' },
      h('div', {}, h('b', {}, 'Free Cities: '), `${envoys} envoy${envoys === 1 ? '' : 's'}${suz ? `, suzerain of ${suz}` : ''}. Tap a Free City to send an envoy (${envoyCost(s, me)}★).`),
      ...found.map((f) => {
        const c = cityOfFree(s, f);
        const t = tierOf(s, f, me);
        return h('div', {}, `${FREE_KINDS[f.kind].icon} `, h('b', {}, c.name), ` (${FREE_KINDS[f.kind].name}): you ${envoysOf(f, me)}, ${STANDING[t]}${f.suz !== null && f.suz !== me ? `; suzerain ${who(s, f.suz)}` : ''}${t ? ` → ${FREE_KINDS[f.kind].bonus[t - 1]}` : ''}.`);
      })),
  };
}

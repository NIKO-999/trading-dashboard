// Interface of the Natural Wonders (see game/naturals): their section of the Wonders tab on the Empires screen, listing
// the ones you have found (who found them first, who holds them, what they give) and the lights glimpsed over the
// clouds. Runs only in the browser.
import { naturalDef, naturalHolder, naturalSites } from '../data/naturals';
import { TRIBES } from '../data/tribes';
import { FIRST_SCORE, FIRST_STARS, glimpsed, hasFound, holderText, LATER_SCORE } from '../game/naturals';
import type { GameState } from '../game/types';
import { drawNaturalIcon } from '../render/naturals';
import { h, paint } from './dom';

const art = (id: string, size: number) => paint(size, size, (ctx) => drawNaturalIcon(ctx, id, size / 2, size / 2, size), `natural:${id}:${size}`);

/** The Natural Wonders of this map as `me` knows them. `go(x, y)` looks at a tile on the map (and closes the screen). */
export function naturalsList(s: GameState, me: number, go: (x: number, y: number) => void): HTMLElement | null {
  const sites = naturalSites(s);
  if (!sites.length) return null; // an older game, from before there were any
  const found = sites.filter((n) => hasFound(n, me));
  const seen = sites.filter((n) => glimpsed(s, me, n));
  const hidden = sites.length - found.length - seen.length;
  const held = found.filter((n) => naturalHolder(s, n) === me).length;
  const intro = h('p', { class: 'muted small' },
    `Rare landmarks of the world. The first empire to see one gets +${FIRST_STARS}★ and +${FIRST_SCORE} score (later finders +${LATER_SCORE}); while one lies inside your borders its bonus is yours. They cannot be built on or harvested.`);
  const rows = found.map((n) => {
    const d = naturalDef(n);
    const holder = naturalHolder(s, n);
    const first = s.players[n.found[0]];
    const color = holder === null ? '#444' : (s.players[me].met ?? []).includes(holder) || holder === me ? TRIBES[s.players[holder].tribe].color : '#777';
    return h('div', { class: 'stat-row wonder-row', style: { '--tc': color } as Record<string, string> },
      art(n.id, 52),
      h('div', { class: 'wonder-text' },
        h('b', {}, d.name),
        h('div', { class: 'small muted' }, d.lore),
        h('div', { class: 'small' }, d.bonus),
        h('div', { class: `wonder-status${holder === me ? ' done' : ''}` }, holderText(s, me, n)),
        h('div', { class: 'muted small' }, first.id === me ? `You found it first (turn ${n.turn ?? 0}).` : `First found by the ${TRIBES[first.tribe].people}s.`),
        h('button', { class: 'mini-btn', onclick: () => go(n.x, n.y) }, 'Show on map'),
      ));
  });
  for (const n of seen) {
    const mapped = s.players[me].explored[n.y * s.size + n.x]; // on a shared map, but never seen by your own people
    rows.push(h('div', { class: 'stat-row wonder-row', style: { '--tc': '#ffe27a' } as Record<string, string> },
      mapped ? art(n.id, 52) : h('div', { class: 'stat-unknown' }, '✦'),
      h('div', { class: 'wonder-text' },
        h('b', {}, mapped ? naturalDef(n).name : 'A light over the clouds'),
        h('div', { class: 'small' }, mapped ? 'On your map, but none of your people has seen it yet. Send a unit to find it.' : 'Something wondrous lies just past the edge of your map. Send a unit to find it.'),
        h('button', { class: 'mini-btn', onclick: () => go(n.x, n.y) }, 'Look'))));
  }
  const summary = `${found.length} of ${sites.length} found${held ? ` · ${held} in your borders` : ''}${hidden > 0 ? ` · ${hidden} still hidden` : ''}`;
  return h('div', { class: 'wonder-list natural-list' },
    h('div', { class: 'natural-head' }, h('b', {}, 'Natural Wonders'), h('span', { class: 'muted small' }, ` · ${summary}`)),
    intro, ...rows,
    h('div', { class: 'natural-head' }, h('b', {}, 'World Wonders')));
}

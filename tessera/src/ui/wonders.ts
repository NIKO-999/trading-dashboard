// Interface of the World Wonders (see game/wonders): the Wonders tab of the Empires screen, the readout under the score
// bar while you raise one, and the celebration card when anyone you know finishes one. Runs only in the browser.
import { TRIBES } from '../data/tribes';
import { WONDER_BY_ID, WONDERS, wonderHolder, wondersHeldBy } from '../data/wonders';
import { hasTech } from '../game/rules';
import type { GameState } from '../game/types';
import { builtWonder, INVEST_CAP, investRoom, isHomeWonder, knows, siteOf, sitesOf, wonderBonus, wonderCost, wonderNeeds } from '../game/wonders';
import { drawWonderIcon } from '../render/wonders';
import { h, paint } from './dom';
import { modal } from './modal';
import type { HudChip } from './hudchips';

const art = (id: string, size: number) => paint(size, size, (ctx) => drawWonderIcon(ctx, id, size / 2, size / 2 - 2, size), `wonder:${id}:${size}`);
const peopleOf = (s: GameState, me: number, pid: number) => (pid === me ? 'You' : knows(s, me, pid) ? `${TRIBES[s.players[pid].tribe].people}s` : 'An unknown empire');
const colorOf = (s: GameState, me: number, pid: number) => (knows(s, me, pid) ? TRIBES[s.players[pid].tribe].color : '#777');

/** A thin progress bar in an empire's colour. */
function bar(paid: number, cost: number, color: string) {
  return h('div', { class: 'wonder-bar' }, h('span', { style: { width: `${Math.min(100, Math.round((paid / cost) * 100))}%`, background: color } }));
}

/**
 * Every wonder of the world: what it gives, what it needs, who built it or who is raising it and how far along.
 * `go(x, y)` looks at a tile on the map (and closes the screen).
 */
export function wondersList(s: GameState, me: number, go: (x: number, y: number) => void): HTMLElement {
  const mine = siteOf(s, me);
  const intro = h('p', { class: 'muted small' },
    `One-of-a-kind great works: only the first empire to finish each gets it. Begin one from the menu of an empty tile of your land; put up to ${INVEST_CAP}★ a turn into it from its tile. If a rival finishes first, half of what you put in comes back. Your own people's wonder costs a quarter less; each wonder you already hold makes the next a quarter dearer.`);
  const rows = WONDERS.map((w) => {
    const b = builtWonder(s, w.id);
    const status: (Node | string)[] = [];
    if (b) {
      const holder = wonderHolder(s, b);
      status.push(h('div', { class: 'wonder-status done' }, `Built by ${peopleOf(s, me, b.pid).replace(/^You$/, 'you')} on turn ${b.turn}${holder !== b.pid ? ` · now held by ${peopleOf(s, me, holder).toLowerCase()}` : ''}`));
    } else {
      const sites = sitesOf(s, w.id).sort((a, c) => c.paid / wonderCost(s, c.pid, c.id) - a.paid / wonderCost(s, a.pid, a.id));
      if (!sites.length) status.push(h('div', { class: 'wonder-status' }, 'Not yet begun.'));
      for (const site of sites) {
        const cost = wonderCost(s, site.pid, site.id);
        status.push(h('div', { class: 'wonder-status' }, `${peopleOf(s, me, site.pid)}: ${site.paid}/${cost}★`, bar(site.paid, cost, colorOf(s, me, site.pid))));
      }
    }
    const cost = wonderCost(s, me, w.id);
    const need = h('div', { class: 'muted small' }, `Needs ${wonderNeeds(w)}${hasTech(s, me, w.tech) ? ' ✓' : ''} · ${cost}★${isHomeWonder(s, me, w.id) ? ' (your heritage)' : ''}`);
    const home = w.home.map((t) => TRIBES[t].people).join(', ');
    const here = b ?? (mine?.id === w.id ? mine : undefined);
    return h('div', { class: 'stat-row wonder-row', style: { '--tc': b ? colorOf(s, me, wonderHolder(s, b)) : mine?.id === w.id ? TRIBES[s.players[me].tribe].color : '#444' } as Record<string, string> },
      art(w.id, 52),
      h('div', { class: 'wonder-text' },
        h('b', {}, w.name), h('span', { class: 'muted small' }, ` · ${home}`),
        h('div', { class: 'small' }, wonderBonus(w)),
        need,
        ...status,
        here && s.players[me].explored[here.y * s.size + here.x]
          ? h('button', { class: 'mini-btn', onclick: () => go(here.x, here.y) }, b ? 'Show on map' : 'Go to your site') : null,
      ));
  });
  return h('div', { class: 'wonder-list' }, intro, ...rows);
}

/** A tappable line under the score bar while you raise a wonder or hold some, e.g. "🏛 Colosseum 20/32★ · invest 10★". */
export function wonderHud(s: GameState, me: number, open: () => void): HTMLElement | null {
  const site = siteOf(s, me);
  const held = wondersHeldBy(s, me);
  if (!site && !held.length) return null;
  const bits: string[] = [];
  let hot = false;
  if (site) {
    const room = investRoom(s, site);
    hot = room > 0 && s.players[me].stars >= room;
    bits.push(`${WONDER_BY_ID[site.id].name} ${site.paid}/${wonderCost(s, me, site.id)}★${room > 0 ? ` · invest up to ${room}★` : ' · invested this turn'}`);
  }
  if (held.length) bits.push(held.length === 1 ? WONDER_BY_ID[held[0]].name : `${held.length} wonders held`);
  return h('button', { class: `wonder-hud${hot ? ' hot' : ''}`, onclick: open }, bits.join(' · '));
}

/** The same readout as a chip: the wonder going up ("40/43★", bright when Stars can go in now) or the wonders held. */
export function wonderChip(s: GameState, me: number): HudChip | null {
  const site = siteOf(s, me);
  if (site) {
    const room = investRoom(s, site);
    return { icon: '🏛', text: `${site.paid}/${wonderCost(s, me, site.id)}★`, tone: room > 0 && s.players[me].stars >= room ? 'hot' : undefined };
  }
  const held = wondersHeldBy(s, me).length;
  return held ? { icon: '🏛', text: `${held} held`, tone: 'gold' } : null;
}

/** The celebration card for a finished wonder, shown to everyone who knows its builder. */
export function celebrateWonder(s: GameState, me: number, pid: number, id: string) {
  const w = WONDER_BY_ID[id];
  const T = TRIBES[s.players[pid].tribe];
  modal({
    title: pid === me ? 'A Wonder Is Yours!' : 'A Wonder of the World',
    art: art(id, 96),
    body: [
      h('p', {}, pid === me ? `Your people have completed the ${w.name}!` : `The ${T.people}s have completed the ${w.name}.`),
      h('p', { class: 'small' }, pid === me ? wonderBonus(w) : w.flavor),
    ],
    cls: 'wonder-card',
  });
}

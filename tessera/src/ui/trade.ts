// Interface of trade routes (see game/trade): the Trade tab of the Empires screen, listing every route of yours with what
// it pays, and the routes you know of between other empires. Runs only in the browser.
import { TRIBES } from '../data/tribes';
import { cityById, citiesOf, isExplored } from '../game/rules';
import { liveRoutes, MAX_ROUTES, routeCap, routeIncome, routesOfCity, routesOpenedBy, routesPerCity, routeYield, traderName } from '../game/trade';
import type { GameState, TradeRoute } from '../game/types';
import { h } from './dom';

/** Every route touching `me`, then the ones between others that `me` has seen; `go(x, y)` looks at a city on the map. */
export function tradeList(s: GameState, me: number, go: (x: number, y: number) => void): HTMLElement {
  const tribe = s.players[me].tribe;
  const intro = h('p', { class: 'muted small' },
    `Train a ${traderName(tribe, 'trader')} (Roads) or a ${traderName(tribe, 'tradeship')} (Sailing) in a city, take it into or beside another city — yours, or a foreign one you are not at war with — and choose “Establish Trade Route”. The route pays both cities every turn: more for long routes and for foreign partners. A city holds more routes as it grows; your empire runs up to ${routeCap(s, me)} (at most ${MAX_ROUTES}). Routes are cut when a city changes hands, when war is declared between the owners, or when an enemy pillages the trail.`);
  const name = (id: number) => cityById(s, id)?.name ?? '?';
  const row = (r: TradeRoute) => {
    const mineA = r.pa === me, mineB = r.pb === me;
    const pay = (mineA ? routeYield(s, r, r.a) : 0) + (mineB ? routeYield(s, r, r.b) : 0);
    const other = mineA && mineB ? null : mineA ? r.pb : mineB ? r.pa : null;
    const color = TRIBES[s.players[r.by].tribe].color;
    const who = mineA || mineB
      ? other === null ? 'Within your empire' : `With the ${TRIBES[s.players[other].tribe].people}s (they earn +${routeYield(s, r, mineA ? r.b : r.a)}★)`
      : `${TRIBES[s.players[r.pa].tribe].people} ⇄ ${TRIBES[s.players[r.pb].tribe].people}`;
    const c = cityById(s, mineA ? r.a : r.b) ?? cityById(s, r.a);
    return h('div', { class: 'stat-row', style: { '--tc': color } as Record<string, string> },
      h('div', {},
        h('b', {}, `${name(r.a)} ⇄ ${name(r.b)}`),
        h('span', { class: 'muted small' }, ` · ${r.sea ? 'sea lane' : 'caravan trail'}, ${r.path.length - 1} steps · since turn ${r.since}`),
        h('div', { class: 'small' }, mineA || mineB ? `+${pay}★ a turn to you · ${who}` : who),
        c ? h('button', { class: 'mini-btn', onclick: () => go(c.x, c.y) }, 'Show on map') : null,
      ));
  };
  const all = liveRoutes(s);
  const mine = all.filter((r) => r.pa === me || r.pb === me);
  const seen = all.filter((r) => r.pa !== me && r.pb !== me && r.path.some((i) => isExplored(s, me, i % s.size, Math.floor(i / s.size))));
  const cities = citiesOf(s, me).map((c) => `${c.name} ${routesOfCity(s, c).length}/${routesPerCity(c)}`).join(' · ');
  const head = h('div', { class: 'small' }, h('b', {}, `Route income: +${routeIncome(s, me)}★ a turn`), ` · routes opened ${routesOpenedBy(s, me).length}/${routeCap(s, me)}`, h('br'), h('span', { class: 'muted' }, cities));
  return h('div', { class: 'wonder-list' }, intro, head,
    ...(mine.length ? mine.map(row) : [h('p', { class: 'muted small' }, 'You have no trade routes yet.')]),
    ...(seen.length ? [h('p', { class: 'small' }, h('b', {}, 'Routes of other empires you have seen')), ...seen.map(row)] : []));
}

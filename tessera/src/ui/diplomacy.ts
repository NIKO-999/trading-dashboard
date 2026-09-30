// Interface of Diplomacy (see game/diplomacy): the Diplomacy screen (opened from the Empires screen) and the envoy card
// that shows an offer waiting for the player at the start of their turn. Runs only in the browser.
import { portraitKind, TRIBES } from '../data/tribes';
import {
  declareCheck, declareWar, DEMAND, DEMAND_TURNS, diploNews, GIFT, offerCheck, opinionWhy, opinionWord, pactOf, propose, relation, TRADE_CAP, tradeIncome, tradeValue, type OfferKind,
} from '../game/diplomacy';
import { citiesOf } from '../game/rules';
import type { DiploOffer, GameState } from '../game/types';
import { h } from './dom';
import { unitPortrait } from './menu';
import { modal, toast } from './modal';

const people = (s: GameState, pid: number) => TRIBES[s.players[pid].tribe].people;
const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

export interface DiploView {
  s: GameState;
  me: number;
  /** Whether the player may act now (their own turn, nothing animating). */
  canAct: () => boolean;
  /** Runs a state change through the game view (events, redraw, save). */
  act: (fn: () => unknown) => void;
}

/** The Diplomacy screen: every empire met, its relation and feelings towards you, and what you can offer or demand. */
export function showDiplomacy(v: DiploView) {
  const { s, me } = v;
  let close = () => {};
  const reopen = () => { close(); showDiplomacy(v); };
  const met = (s.players[me].met ?? []).filter((id) => !s.players[id].neutral).sort((a, b) => Number(s.players[b].alive) - Number(s.players[a].alive) || a - b);
  const rows = met.map((b) => row(v, b, reopen));
  const news = diploNews(s, me);
  close = modal({
    title: 'Diplomacy',
    body: [
      met.length ? '' : h('p', { class: 'muted' }, 'You have not met another empire yet. Explore to find them.'),
      tradeIncome(s, me) ? h('p', { class: 'small' }, `Trade brings you +${tradeIncome(s, me)}★ a turn (at most ${TRADE_CAP}).`) : '',
      ...rows,
      news.length ? h('div', { class: 'diplo-news' }, h('b', {}, 'News'), ...news.map((n) => h('div', { class: 'muted small' }, `Turn ${n.turn}: ${n.text}`))) : '',
    ],
    dismissable: true,
    buttons: [{ label: 'Close', primary: true }],
    cls: 'stats diplo',
  });
}

function row(v: DiploView, b: number, reopen: () => void): HTMLElement {
  const { s, me } = v;
  const p = s.players[b];
  const T = TRIBES[p.tribe];
  if (!p.alive) {
    return h('div', { class: 'stat-row', style: { '--tc': T.color } as Record<string, string> },
      unitPortrait(portraitKind(p.tribe), p.tribe, 44), h('div', {}, h('b', {}, T.people), h('div', { class: 'muted small' }, 'Destroyed')));
  }
  const rel = relation(s, me, b);
  const pact = pactOf(s, me, b);
  const feel = opinionWhy(s, b, me); // how THEY feel about us: that is what decides their answers
  const status = pact?.declared !== undefined ? 'War declared' : rel === 'alliance' ? 'Alliance' : rel === 'peace' ? 'Peace' : 'War';
  const bits: string[] = [];
  if (pact?.trade !== undefined) bits.push(`Trade +${tradeValue(s, me, b)}★ a turn each`);
  for (const t of s.diplo!.tribute) {
    if (t.from === b && t.to === me) bits.push(`They pay you ${t.stars}★ a turn (until turn ${t.until})`);
    if (t.from === me && t.to === b) bits.push(`You pay them ${t.stars}★ a turn (until turn ${t.until})`);
  }
  const btn = (label: string, kind: OfferKind) => {
    const why = offerCheck(s, me, b, kind) ?? (v.canAct() ? null : 'Wait for your turn');
    return h('button', {
      class: `mini-btn${why ? ' off' : ''}`,
      title: why ?? '',
      onclick: () => {
        if (why) return toast(`${label}: ${why}`);
        v.act(() => propose(s, me, b, kind)); // the answer arrives as a toast
        reopen();
      },
    }, label);
  };
  const war = () => {
    const why = declareCheck(s, me, b) ?? (v.canAct() ? null : 'Wait for your turn');
    return h('button', {
      class: `mini-btn war${why ? ' off' : ''}`,
      title: why ?? '',
      onclick: () => {
        if (why) return toast(`Declare war: ${why}`);
        modal({
          title: `War on the ${T.people}s?`,
          body: [h('p', {}, `Breaking the ${rel === 'alliance' ? 'alliance' : 'treaty'} costs you trust with every empire, and the ${T.people}s will not forget. The war begins at your next turn.`)],
          buttons: [
            { label: 'Declare war', primary: true, onClick: () => { v.act(() => declareWar(s, me, b)); reopen(); } },
            { label: 'Cancel', onClick: reopen },
          ],
        });
      },
    }, 'Declare war');
  };
  const actions = [
    rel === 'war' ? btn('Propose peace', 'peace') : null,
    rel === 'peace' ? btn('Propose alliance', 'alliance') : null,
    rel !== 'war' && pact?.trade === undefined ? btn('Propose trade', 'trade') : null,
    btn(`Gift ${GIFT}★`, 'gift'),
    btn(`Demand ${DEMAND}★`, 'demand'),
    btn(`Demand ${DEMAND_TURNS.stars}★×${DEMAND_TURNS.turns}`, 'demandTurns'),
    rel !== 'war' ? war() : null,
  ];
  return h('div', { class: `stat-row diplo-row rel-${rel}`, style: { '--tc': T.color } as Record<string, string> },
    unitPortrait(portraitKind(p.tribe), p.tribe, 44),
    h('div', { class: 'diplo-body' },
      h('div', {}, h('b', {}, T.people), h('span', { class: `diplo-rel ${rel}` }, status)),
      h('div', { class: 'small' }, `They feel ${opinionWord(feel.n)} (${signed(feel.n)}) · ${citiesOf(s, b).length} cities`),
      feel.why.length ? h('div', { class: 'muted small' }, feel.why.map(([k, n]) => `${k} ${signed(n)}`).join(' · ')) : null,
      bits.length ? h('div', { class: 'small' }, bits.join(' · ')) : null,
      h('div', { class: 'diplo-acts' }, ...actions),
    ),
  );
}

/** What an offer to `me` says, for the envoy card. */
function offerText(s: GameState, o: DiploOffer): { title: string; text: string } {
  const who = people(s, o.from);
  switch (o.kind) {
    case 'peace': return { title: `${who} envoy`, text: `The ${who}s propose peace: neither of you may attack the other or enter the other's borders.` };
    case 'alliance': return { title: `${who} envoy`, text: `The ${who}s propose an alliance: shared maps, open borders, and a promise to stand by each other in war.` };
    case 'trade': return { title: `${who} envoy`, text: `The ${who}s propose a trade deal: +${tradeValue(s, o.from, o.to)}★ a turn for each of you while the peace holds.` };
    case 'demand': return { title: `${who} demand`, text: `The ${who}s demand ${o.stars}★ in tribute. Refusing will anger them.` };
    case 'demandTurns': return { title: `${who} demand`, text: `The ${who}s demand ${o.stars}★ a turn for ${o.turns} turns. Refusing will anger them.` };
    case 'call': return { title: 'A call to arms', text: `Your ally, the ${who}s, has been attacked by the ${people(s, o.enemy!)}s. Join the war against them? Declining will anger your ally (honouring the call costs no trust).` };
    case 'gift': return { title: `${who} gift`, text: `The ${who}s send a gift.` };
  }
}

/** The envoy card for one offer waiting for `me`. `answer(yes)` must carry it out through the game view. */
export function showOffer(s: GameState, o: DiploOffer, answer: (yes: boolean) => void) {
  const { title, text } = offerText(s, o);
  const p = s.players[o.from];
  modal({
    title,
    art: unitPortrait(portraitKind(p.tribe), p.tribe, 80),
    body: [h('p', {}, text)],
    buttons: [
      { label: o.kind === 'call' ? 'Join the war' : o.kind.startsWith('demand') ? 'Pay' : 'Accept', primary: true, onClick: () => answer(true) },
      { label: o.kind.startsWith('demand') ? 'Refuse' : 'Decline', onClick: () => answer(false) },
    ],
    cls: 'diplo-offer',
  });
}

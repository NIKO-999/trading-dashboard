// Interface of Governments and Policy Cards (see game/government): the Government screen (the "Govern" dock button and
// the HUD chip open it) and the chip itself. Tap a card to pick it up, then tap a glowing slot to put it there (a card
// with exactly one free slot that takes it goes straight in). Runs only in the browser.
import { CARDS, GOVS, type CardDef, type CardType } from '../data/governments';
import { TECH_BY_ID } from '../data/techs';
import { ERAS } from '../game/eras';
import {
  adoptGov, canSwap, cardsOf, cardUnlocked, fits, govCost, govOf, govState, govUnlocked, govWaitLeft, govWhy, GOV_BASE, GOV_PER_CITY, GOV_WAIT, slotCard, slotLive, slotWhy,
} from '../game/government';
import type { GameState } from '../game/types';
import { h } from './dom';
import type { HudChip } from './hudchips';
import { modal, toast } from './modal';

export interface GovView {
  s: GameState;
  me: number;
  /** Whether the player may act now (their own turn, nothing animating). */
  canAct: () => boolean;
  /** Runs a state change through the game view (events, redraw, save). */
  act: (fn: () => unknown) => void;
}

const TYPE_NAME: Record<CardType, string> = { military: 'Military', economic: 'Economic', wild: 'Wild' };
const TYPE_ICON: Record<CardType, string> = { military: '⚔', economic: '⚖', wild: '✦' };

/** Where a locked card comes from: "Masonry" or "Classical Era". */
const unlockText = (c: CardDef) => (c.tech ? TECH_BY_ID[c.tech]?.name ?? c.tech : `${ERAS[c.era ?? 0].name} Era`);

/** The Government screen: the government in force, its slots, the cards in hand and the governments to change to. */
export function showGovernment(v: GovView) {
  const { s, me } = v;
  let held: string | null = null; // the card picked up, waiting for a slot
  const body = h('div', { class: 'gov' });
  const close = modal({ title: 'Government', body: [body], dismissable: true, buttons: [{ label: 'Close', primary: true }], cls: 'stats gov-card' });

  const run = (fn: () => boolean, fail: string | null) => {
    if (!v.canAct()) return toast('Wait for your turn');
    if (fail) return toast(fail);
    v.act(fn);
    held = null;
    render();
  };
  const put = (i: number, card: string | null) => run(() => slotCard(s, me, i, card), slotWhy(s, me, i, card));

  function render() {
    const g = govState(s, me);
    const def = govOf(s, me);
    const inHand = cardsOf(s, me).filter((c) => !g.slots.includes(c.id));
    const heldCard = held ? CARDS.find((c) => c.id === held) : undefined;

    const head = h('div', { class: 'gov-head' },
      h('div', { class: 'gov-name' }, def.name),
      h('div', { class: 'gov-bonus' }, def.bonus),
      h('div', { class: 'muted small gov-flavor' }, def.flavor));

    const slots = h('div', { class: 'gov-slots' }, ...def.slots.map((type, i) => {
      const id = g.slots[i];
      const c = id ? CARDS.find((k) => k.id === id) : undefined;
      const target = !!heldCard && fits(type, heldCard) && !slotWhy(s, me, i, heldCard.id);
      const pending = !!c && !slotLive(s, me, i);
      const el = h('div', {
        class: `gov-slot ${type}${c ? ' full' : ''}${target ? ' target' : ''}${pending ? ' pending' : ''}`,
        onclick: () => { if (heldCard) put(i, heldCard.id); },
      },
        h('div', { class: 'gov-slot-type' }, `${TYPE_ICON[type]} ${TYPE_NAME[type]}`),
        c ? h('div', { class: 'gov-card-name' }, c.name) : h('div', { class: 'gov-empty' }, target ? 'Tap to place' : 'Empty'),
        c ? h('div', { class: 'gov-card-desc' }, c.desc) : null,
        pending ? h('div', { class: 'gov-badge' }, 'From next turn') : null,
        c ? h('button', { class: 'gov-x', title: 'Remove', onclick: (e: Event) => { e.stopPropagation(); put(i, null); } }, '×') : null);
      return el;
    }));

    const note = h('p', { class: 'muted small gov-note' }, heldCard
      ? `Tap a glowing slot to place ${heldCard.name}${def.slots.some((t, i) => g.slots[i] && fits(t, heldCard)) ? canSwap(s, me) ? ' (replacing a card: it takes effect next turn)' : ' (no more swaps this turn)' : ''}.`
      : `Filling an empty slot is free and immediate. Replacing or removing a card: once a turn, and the new card works from next turn${canSwap(s, me) ? '' : ' (used this turn)'}.`);

    const cardEl = (c: CardDef, open: boolean) => h('button', {
      class: `gov-cardbtn ${c.type}${held === c.id ? ' held' : ''}${open ? '' : ' locked'}`,
      onclick: () => {
        if (!open) return toast(`${c.name}: unlocked by ${unlockText(c)}`);
        if (held === c.id) { held = null; return render(); }
        // one free slot that takes it: straight in
        const free = def.slots.map((t, i) => i).filter((i) => g.slots[i] === null && fits(def.slots[i], c) && !slotWhy(s, me, i, c.id));
        if (free.length === 1 && !def.slots.some((t, i) => g.slots[i] !== null && fits(t, c))) return put(free[0], c.id);
        if (!def.slots.some((t) => fits(t, c))) return toast(`${c.name} needs a ${c.type === 'wild' ? 'Wild' : `${TYPE_NAME[c.type]} or Wild`} slot`);
        held = c.id;
        render();
      },
    },
      h('div', { class: 'gov-card-top' }, h('span', { class: 'gov-card-name' }, c.name), h('span', { class: 'gov-card-type' }, TYPE_ICON[c.type])),
      h('div', { class: 'gov-card-desc' }, c.desc),
      open ? null : h('div', { class: 'gov-card-lock' }, `🔒 ${unlockText(c)}`));
    const locked = CARDS.filter((c) => !cardUnlocked(s, me, c));
    const hand = h('div', { class: 'gov-hand' }, ...inHand.map((c) => cardEl(c, true)), ...locked.map((c) => cardEl(c, false)));

    const wait = govWaitLeft(s, me);
    const cost = govCost(s, me);
    const govs = h('div', { class: 'gov-list' }, ...GOVS.map((d) => {
      const why = govWhy(s, me, d.id);
      const mine = d.id === def.id;
      return h('div', { class: `gov-row${mine ? ' mine' : ''}` },
        h('div', { class: 'gov-row-text' },
          h('b', {}, d.name), h('span', { class: 'gov-pips' }, ...d.slots.map((t) => h('span', { class: `gov-pip ${t}`, title: TYPE_NAME[t] }, TYPE_ICON[t]))),
          h('div', { class: 'small' }, d.bonus),
          d.era > 0 ? h('div', { class: 'muted small' }, `${ERAS[d.era].name} Era`) : null),
        mine ? h('span', { class: 'gov-now' }, 'In force')
          // a blocked change says why in a word: the era it needs, the turns to wait, or the price
          : h('button', { class: `mini-btn${why ? ' off' : ''}`, onclick: () => run(() => adoptGov(s, me, d.id), why) },
            !why ? `Adopt ${cost}★` : !govUnlocked(s, me, d) ? `🔒 ${ERAS[d.era].name}` : wait ? `Wait ${wait}t` : `${cost}★`));
    }));

    body.replaceChildren(
      head,
      h('div', { class: 'gov-h' }, 'Policy slots'),
      slots,
      note,
      h('div', { class: 'gov-h' }, `Cards (${inHand.length} in hand)`),
      hand,
      h('div', { class: 'gov-h' }, 'Change government'),
      h('p', { class: 'muted small gov-note' }, `Costs ${cost}★ (${GOV_BASE}★ + ${GOV_PER_CITY}★ a city), takes effect at once, then ${GOV_WAIT} turns before the next change.${wait ? ` Next change in ${wait} turn${wait === 1 ? '' : 's'}.` : ''} Slotted cards move into the new slots that still take them.`),
      govs,
    );
  }
  render();
  return close;
}

/** The Government chip: the government and its filled slots, warm when a free slot could take a card. */
export function govChip(s: GameState, me: number): HudChip {
  const g = s.players[me].gov;
  const def = govOf(s, me);
  const slots = g?.slots ?? def.slots.map(() => null);
  const filled = slots.filter(Boolean).length;
  const short = def.id === 'republic' ? 'Republic' : def.id === 'merchant' ? 'Merchants' : def.name;
  const open = cardsOf(s, me).filter((c) => !slots.includes(c.id));
  const room = def.slots.some((t, i) => !slots[i] && open.some((c) => fits(t, c)));
  return { icon: '⚖', text: `${short} ${filled}/${def.slots.length}`, tone: room ? 'warn' : undefined };
}

/** The chip's full line in the popover. */
export function govHud(s: GameState, me: number): HTMLElement {
  const def = govOf(s, me);
  const g = s.players[me].gov;
  const cards = (g?.slots ?? []).map((id, i) => (id ? `${CARDS.find((c) => c.id === id)?.name}${slotLive(s, me, i) ? '' : ' (next turn)'}` : null)).filter(Boolean);
  return h('div', { class: 'skill-hud' },
    h('div', {}, h('b', {}, def.name), ` · ${def.bonus}`),
    h('div', {}, cards.length ? `Cards: ${cards.join(', ')}.` : 'No policy cards slotted: tap to choose some.'));
}

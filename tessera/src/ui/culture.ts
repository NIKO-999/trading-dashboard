// Interface of Culture Blending (see game/culture): the choice card after a capture, and the adopted traditions listed on
// the Empires screen. Runs only in the browser.
import { TRIBES } from '../data/tribes';
import { adoptedOf, describeSubTrait, MAX_ADOPTED, offersOf, subTrait, type SubTrait } from '../game/culture';
import type { GameState, TribeId } from '../game/types';
import { drawIcon } from '../render/draw';
import { h, paint } from './dom';
import { modal } from './modal';

/** A picture for a sub-trait, drawn in the colours of the people it comes from. */
function iconFor(t: SubTrait): string {
  if (t.hook) return TRIBES[t.from].unique;
  const p = t.perks[0];
  switch (p?.k) {
    case 'atk': return p.who === 'naval' ? 'ship' : p.who === 'mounted' ? 'rider' : p.who === 'ranged' ? 'archer' : p.who === 'siege' ? 'catapult' : 'swordsman';
    case 'def': case 'terrain': return 'defender';
    case 'move': return p.who === 'naval' ? 'ship' : 'rider';
    case 'income': return p.per === 'farm' || p.per === 'mine' || p.per === 'temple' || p.per === 'port' || p.per === 'market' ? p.per : 'star';
    case 'grow': return p.on === 'farm' || p.on === 'mine' || p.on === 'temple' || p.on === 'port' || p.on === 'lumber' ? p.on : p.on === 'fish' ? 'fish' : p.on === 'animal' ? 'animal' : 'fruit';
    case 'cost': return p.of === 'road' ? 'road' : p.of === 'temple' ? 'temple' : 'star';
    case 'heal': return 'heal';
    case 'vision': return 'flag';
    default: return 'star';
  }
}

const art = (t: SubTrait, size: number) => {
  const icon = iconFor(t);
  return paint(size, size, (ctx) => drawIcon(ctx, icon, t.from, size / 2, size / 2 - 1), `culture:${icon}:${t.from}:${size}`);
};

/**
 * Opens the choice for the first pending offer of `me`, if any. `pick(from, id)` must adopt it (through the game view, so
 * the change animates and saves) and is called once. Returns false when nothing was waiting.
 */
export function showCultureOffer(s: GameState, me: number, pick: (from: TribeId, id: string) => void): boolean {
  const offer = offersOf(s, me)[0];
  if (!offer) return false;
  const opts = offer.options.map(subTrait).filter((t): t is SubTrait => !!t);
  const people = TRIBES[offer.from].people;
  let close = () => {};
  const btn = (t: SubTrait) => h('button', { class: 'rbtn big', onclick: () => { close(); pick(offer.from, t.id); } },
    h('span', { class: 'rbtn-circle' }, art(t, 66)),
    h('span', { class: 'rbtn-label' }, t.name),
    h('span', { class: 'rbtn-sub' }, describeSubTrait(t)),
  );
  const held = adoptedOf(s, me).length;
  close = modal({
    title: `${people} Ways`,
    body: [
      h('p', {}, `The people of ${offer.city} keep their ${people} traditions. Adopt one (${held + 1}/${MAX_ADOPTED}; once per people):`),
      h('div', { class: 'reward-row culture' }, ...opts.map(btn)),
    ],
    buttons: [],
    cls: 'reward',
  });
  return true;
}

/** "Adopted from X" lines for the Empires screen (null when the empire adopted nothing). */
export function adoptedLines(s: GameState, pid: number): HTMLElement | null {
  const list = adoptedOf(s, pid);
  if (!list.length) return null;
  return h('div', { class: 'adopted' }, ...list.map((a) => {
    const t = subTrait(a.id);
    if (!t) return null;
    return h('div', { class: 'adopted-row' },
      art(t, 26),
      h('div', {},
        h('div', {}, h('b', {}, t.name), ` · Adopted from the ${TRIBES[a.from].people}s (${a.city})`),
        h('div', { class: 'muted small' }, describeSubTrait(t))),
    );
  }));
}

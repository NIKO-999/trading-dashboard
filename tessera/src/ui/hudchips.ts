// The readouts under the score bar (the empire mechanic, surging Wildcards, unrest, a wonder going up), folded into
// one row of small chips: an icon and a short value each, at most MAX_CHIPS of them and "+N" for the rest. Tapping a
// chip with its own job (unrest: look at the city; wonder: the Wonders tab) does that job; any other chip opens a
// small popover listing every readout in full. The chip summaries are pure, so they can be tested without a page.
import { onBrink, unrestOf, UNREST_MAX, UNREST_WARN } from '../game/rebels';
import { hasTech, paxHolds } from '../game/rules';
import { districtsOf, levelIncome, upgradeCount } from '../game/levels';
import { surgingNodes } from '../game/skills';
import type { City, GameState } from '../game/types';
import { h } from './dom';

/** How one readout looks as a chip. `tone` tints it: 'warn' and 'brink' for trouble, 'hot' and 'gold' for good news. */
export interface HudChip { icon: string; text: string; tone?: 'warn' | 'brink' | 'hot' | 'gold' | 'surge' }

/** One readout: its chip, its full line (an element, so a mechanic keeps its own colours) and its tap, if it has one. */
export interface HudLine extends HudChip { key: string; full: HTMLElement | null; onTap?: () => void }

/** Never more chips than this in the row; the rest collapse into a "+N" chip. */
export const MAX_CHIPS = 3;
/** The longest chip value, in characters, before it is cut short. */
export const CHIP_CHARS = 11;

/** Which lines show as chips and how many fold into "+N". */
export function packChips<T>(lines: readonly T[], max = MAX_CHIPS): { shown: T[]; more: number } {
  return { shown: lines.slice(0, max), more: Math.max(0, lines.length - max) };
}

/**
 * A short chip value for a readout that brings no summary of its own: its first part (before a " · " or " | "),
 * without a leading symbol, cut to `max` characters.
 */
export function shortChip(text: string, max = CHIP_CHARS): string {
  const first = text.split(/ · | \| /)[0].replace(/^[^\p{L}\p{N}+\-]+/u, '').trim();
  return first.length <= max ? first : `${first.slice(0, max - 1).trimEnd()}…`;
}

/** Signed Stars, as a chip shows them: "+21★", "-3★". */
export const signedStars = (n: number) => `${n >= 0 ? '+' : ''}${n}★`;

/** The skill tree's passive states as a chip: surging Wildcards first, then Pax Romana, then the Mercenaries' cost. */
export function skillChip(s: GameState, me: number): HudChip | null {
  const surging = surgingNodes(s, me).length;
  if (surging) return { icon: '✦', text: `${surging} surging`, tone: 'surge' };
  if (hasTech(s, me, 'rome:3')) return paxHolds(s, me) ? { icon: '🏛', text: 'Pax holds', tone: 'gold' } : { icon: '🏛', text: 'Pax broken', tone: 'warn' };
  if (hasTech(s, me, 'fork:mercenary')) return { icon: '⚔', text: 'growth ½' };
  return null;
}

/** The Economy chip: what raised tiles and Districts pay a turn ("+6★ · 1 dist"), gold once a District stands (see game/levels). */
export function economyChip(s: GameState, me: number): HudChip | null {
  if (!upgradeCount(s, me)) return null;
  const d = districtsOf(s, me).length;
  return { icon: '⚒', text: `+${levelIncome(s, me)}★${d ? ` · ${d} dist` : ''}`, tone: d ? 'gold' : undefined };
}

/** A restless conquered city as a chip: "Kyoto 3/6", red when it revolts next turn. */
export function unrestChip(c: City): HudChip {
  return { icon: '🔥', text: `${shortChip(c.name, 8)} ${unrestOf(c)}/${UNREST_MAX}`, tone: onBrink(c) ? 'brink' : unrestOf(c) >= UNREST_WARN ? 'warn' : undefined };
}

/** The chip row and its popover. `row` goes under the score bar; it redraws itself with `set`. */
export class ChipRow {
  readonly row = h('div', { class: 'chip-row' });
  private pop = h('div', { class: 'chip-pop hidden' });
  private lines: HudLine[] = [];
  private offDoc: (() => void) | null = null;

  constructor() {
    this.row.append(this.pop);
  }

  /** Show these readouts (in order of importance). */
  set(lines: HudLine[]) {
    this.lines = lines;
    const { shown, more } = packChips(lines);
    const chips = shown.map((l) => this.chip(l.icon, l.text, l.tone, () => (l.onTap ? (this.close(), l.onTap()) : this.toggle())));
    if (more) chips.push(this.chip('', `+${more}`, undefined, () => this.toggle(), 'more'));
    this.row.replaceChildren(...chips, this.pop);
    this.row.classList.toggle('hidden', !lines.length);
    if (!lines.length) this.close();
    else if (!this.pop.classList.contains('hidden')) this.fill();
  }

  private chip(icon: string, text: string, tone: HudChip['tone'], onclick: () => void, extra = '') {
    return h('button', { class: `hud-chip${tone ? ` ${tone}` : ''}${extra ? ` ${extra}` : ''}`, onclick: (e: Event) => { e.stopPropagation(); onclick(); } },
      icon ? h('span', { class: 'chip-ico' }, icon) : null, h('span', { class: 'chip-txt' }, text));
  }

  /** The popover: every readout in full, each still doing its job when tapped. */
  private fill() {
    this.pop.replaceChildren(...this.lines.map((l) => {
      const body = l.full ?? h('div', {}, l.text);
      body.classList.add('chip-full');
      // the line's own leading symbol would repeat the icon beside it
      const first = body.firstChild;
      if (first?.nodeType === Node.TEXT_NODE && first.textContent!.startsWith(l.icon)) first.textContent = first.textContent!.slice(l.icon.length).trimStart();
      return h('div', { class: `chip-line${l.onTap ? ' tap' : ''}`, onclick: l.onTap ? () => { this.close(); l.onTap!(); } : undefined },
        h('span', { class: 'chip-ico' }, l.icon), body);
    }));
  }

  private toggle() {
    if (this.pop.classList.contains('hidden')) this.open();
    else this.close();
  }

  private open() {
    this.fill();
    this.pop.classList.remove('hidden');
    // a tap anywhere else puts it away
    const away = (e: Event) => { if (!this.row.contains(e.target as Node)) this.close(); };
    document.addEventListener('pointerdown', away, true);
    this.offDoc = () => document.removeEventListener('pointerdown', away, true);
  }

  close() {
    this.pop.classList.add('hidden');
    this.offDoc?.();
    this.offDoc = null;
  }
}

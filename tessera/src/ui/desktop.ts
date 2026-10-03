// Desktop layout: on a wide screen with a mouse, the page gets a `desktop` class and the CSS turns the phone's bottom
// sheets into a side panel, lays New Game out in two columns, and shows keyboard hints. Settings can force either
// layout. The game's keyboard shortcuts (see ui/game `onKey`) work in both layouts; only their hints are desktop-only.
import { loadSettings } from '../save';
import { modal } from './modal';
import { h } from './dom';

export type LayoutPref = 'auto' | 'desktop' | 'phone';

const WIDE = '(min-width: 1024px) and (hover: hover) and (pointer: fine)';
let mq: MediaQueryList | null = null;

/** Whether the desktop layout is in use right now. */
export const isDesktop = () => document.documentElement.classList.contains('desktop');

/** Apply the layout preference, and follow the window (a resize, a docked laptop) while it is on Auto. */
export function applyLayout(pref: LayoutPref = loadSettings().layout ?? 'auto') {
  const set = () => document.documentElement.classList.toggle('desktop', pref === 'desktop' || (pref === 'auto' && !!mq?.matches));
  if (!mq && typeof window.matchMedia === 'function') {
    mq = window.matchMedia(WIDE);
    mq.addEventListener?.('change', () => applyLayout());
  }
  set();
}

/** True when a key press is meant for a text field or a dialog, not the map. */
export function keyIsForPage(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  if (e.ctrlKey || e.metaKey || e.altKey) return true;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return true;
  return false;
}

export const SHORTCUTS: [string, string][] = [
  ['Enter', 'End turn (twice if units are left)'],
  ['Shift + Enter', 'End turn without the check'],
  ['Space', 'Next unit that can still act'],
  ['1 – 9', 'Press an action in the side panel'],
  ['Esc / right-click', 'Close the panel or a window'],
  ['W A S D / arrows', 'Pan the map'],
  ['+ − / mouse wheel', 'Zoom'],
  ['C', 'Centre on your capital'],
  ['T', 'Tech tree'],
  ['G', 'Govern'],
  ['E', 'Empires'],
  ['M', 'Menu'],
  ['?', 'This list'],
];

export function showShortcuts() {
  modal({
    title: 'Keyboard',
    cls: 'keys-card',
    dismissable: true,
    body: [h('div', { class: 'keys' }, ...SHORTCUTS.flatMap(([k, what]) => [h('kbd', {}, k), h('span', {}, what)]))],
  });
}

// Interface side of an empire's mechanic (see game/mech). Runs only in the browser.
import type { GameState } from '../../game/types';

/** What a mechanic's interface may ask of the running game view. */
export interface MechView {
  s: GameState;
  me: number;
  /** Redraw the HUD and map after the state changed. */
  refresh(): void;
  /** Run a state change with animations, then redraw. */
  act(fn: () => unknown): void;
  /** Move the camera over a tile. */
  focus(x: number, y: number): void;
}

export interface MechUi {
  /** A small live readout under the score bar (a calendar, a counter...). Called on every refresh; return null for nothing. */
  hud?(v: MechView): HTMLElement | null;
  /** An extra button in the bottom dock that opens the mechanic's own screen. */
  dock?(v: MechView): { label: string; icon: string; open(): void } | null;
}

export type MechUiRegistry = Partial<Record<string, MechUi>>;

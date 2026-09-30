// Transient events the rules engine emits for the UI (popups, floating numbers).
// They are not part of the saved game state.
import type { UnitKind } from './types';

export type GameEvent =
  | { type: 'toast'; player: number; text: string }
  | { type: 'attack'; unitId: number; kind: UnitKind; player: number; from: { x: number; y: number }; to: { x: number; y: number }; ranged: boolean }
  // counter: a counter-blow (shown in its own colour); crit: the label of a critical or bonus blow (shown big)
  | { type: 'damage'; unitId: number; x: number; y: number; amount: number; counter?: boolean; crit?: string }
  // captor: taken alive (Aztec captives) by the unit standing there, rather than slain
  | { type: 'death'; unitId: number; x: number; y: number; owner: number; kind: UnitKind; captor?: { x: number; y: number } }
  | { type: 'harvest'; player: number; x: number; y: number; pop: number }
  | { type: 'move'; unitId: number; owner: number; path: { x: number; y: number }[]; embark: boolean; disembark: boolean; before?: UnitKind }
  | { type: 'levelup'; player: number; cityId: number; level: number }
  | { type: 'ruin'; player: number; title: string; text: string }
  | { type: 'heal'; unitId: number; x: number; y: number; amount: number }
  | { type: 'capture'; player: number; cityId: number; from: number | null }
  | { type: 'eliminated'; player: number; by: number }
  | { type: 'stars'; player: number; x: number; y: number; amount: number }
  | { type: 'wonder'; player: number; id: string; x: number; y: number }; // a World Wonder was finished (see game/wonders)

const queue: GameEvent[] = [];
export const emit = (e: GameEvent) => void queue.push(e);
export const drain = (): GameEvent[] => queue.splice(0, queue.length);

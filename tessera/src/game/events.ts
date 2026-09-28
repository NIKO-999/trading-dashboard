// Transient events the rules engine emits for the UI (popups, floating numbers).
// They are not part of the saved game state.
import type { UnitKind } from './types';

export type GameEvent =
  | { type: 'toast'; player: number; text: string }
  | { type: 'attack'; unitId: number; kind: UnitKind; player: number; from: { x: number; y: number }; to: { x: number; y: number }; ranged: boolean }
  | { type: 'damage'; unitId: number; x: number; y: number; amount: number }
  | { type: 'death'; unitId: number; x: number; y: number; owner: number; kind: UnitKind }
  | { type: 'harvest'; player: number; x: number; y: number; pop: number }
  | { type: 'move'; unitId: number; owner: number; path: { x: number; y: number }[]; embark: boolean; disembark: boolean }
  | { type: 'levelup'; player: number; cityId: number; level: number }
  | { type: 'ruin'; player: number; title: string; text: string }
  | { type: 'capture'; player: number; cityId: number; from: number | null }
  | { type: 'eliminated'; player: number; by: number }
  | { type: 'stars'; player: number; x: number; y: number; amount: number };

const queue: GameEvent[] = [];
export const emit = (e: GameEvent) => void queue.push(e);
export const drain = (): GameEvent[] => queue.splice(0, queue.length);

// Transient events the rules engine emits for the UI (popups, floating numbers).
// They are not part of the saved game state.
export type GameEvent =
  | { type: 'toast'; player: number; text: string }
  | { type: 'damage'; x: number; y: number; amount: number }
  | { type: 'death'; x: number; y: number; owner: number }
  | { type: 'levelup'; player: number; cityId: number; level: number }
  | { type: 'ruin'; player: number; title: string; text: string }
  | { type: 'capture'; player: number; cityId: number; from: number | null }
  | { type: 'eliminated'; player: number; by: number }
  | { type: 'stars'; player: number; x: number; y: number; amount: number };

const queue: GameEvent[] = [];
export const emit = (e: GameEvent) => void queue.push(e);
export const drain = (): GameEvent[] => queue.splice(0, queue.length);

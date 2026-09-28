import type { GameState, Tile } from './types';

export const idx = (s: GameState, x: number, y: number) => y * s.size + x;
export const inBounds = (s: GameState, x: number, y: number) => x >= 0 && y >= 0 && x < s.size && y < s.size;
export const tileAt = (s: GameState, x: number, y: number): Tile | undefined =>
  inBounds(s, x, y) ? s.tiles[y * s.size + x] : undefined;
export const dist = (ax: number, ay: number, bx: number, by: number) => Math.max(Math.abs(ax - bx), Math.abs(ay - by));
export const isWater = (t: Tile) => t.terrain === 'shallow' || t.terrain === 'ocean';
export const isLand = (t: Tile) => !isWater(t);

export function neighbors(s: GameState, x: number, y: number, r = 1): Tile[] {
  const out: Tile[] = [];
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      if (!dx && !dy) continue;
      const t = tileAt(s, x + dx, y + dy);
      if (t) out.push(t);
    }
  return out;
}

export function area(s: GameState, x: number, y: number, r: number): Tile[] {
  return [tileAt(s, x, y)!, ...neighbors(s, x, y, r)].filter(Boolean);
}

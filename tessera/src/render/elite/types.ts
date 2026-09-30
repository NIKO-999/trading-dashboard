import type { Ctx } from '../prims';

/** Draws one elite unit standing at (x, y) (its feet), in unit-art units like render/units. */
export type EliteArt = Record<string, (ctx: Ctx, x: number, y: number) => void>;

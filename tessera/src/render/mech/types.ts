// Drawing side of an empire's mechanic (see game/mech). Runs only in the browser.
import type { Camera } from '../camera';
import type { Overlay } from '../common';
import type { Ctx } from '../prims';
import type { GameState, Tile, TribeId } from '../../game/types';

export interface MechRender {
  /** Draw this tile's ground when it is one of the mechanic's own (e.g. ice, a floating platform). Return true if drawn. */
  ground?(ctx: Ctx, s: GameState, t: Tile, x: number, y: number): boolean;
  /** Scenery on a tile: the empire's own buildings and marks (world coordinates; (cx, cy) is the tile centre). Cached. */
  tile?(ctx: Ctx, s: GameState, t: Tile, cx: number, cy: number): void;
  /** Animated effects over the whole map, drawn every frame in world coordinates. */
  overlay?(ctx: Ctx, s: GameState, viewer: number, cam: Camera, ov: Overlay, now: number): void;
}

export type MechRenderRegistry = Partial<Record<TribeId, MechRender>>;

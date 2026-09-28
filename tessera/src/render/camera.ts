export const TW = 64; // tile width in world px
export const TH = 32; // tile height in world px
export const LAND_DEPTH = 10;
export const WATER_DROP = 5;

/** World position of the top corner of tile (x, y). */
export const tileTop = (x: number, y: number) => ({ x: (x - y) * (TW / 2), y: (x + y) * (TH / 2) });
/** World position of the centre of tile (x, y)'s top face. */
export const tileCenter = (x: number, y: number) => ({ x: (x - y) * (TW / 2), y: (x + y) * (TH / 2) + TH / 2 });

export class Camera {
  x = 0; // screen offset of world origin (css px)
  y = 0;
  zoom = 1;

  toScreen(wx: number, wy: number) {
    return { x: wx * this.zoom + this.x, y: wy * this.zoom + this.y };
  }

  toWorld(sx: number, sy: number) {
    return { x: (sx - this.x) / this.zoom, y: (sy - this.y) / this.zoom };
  }

  /** Tile coordinates under a screen point (not clamped to the map). */
  pickTile(sx: number, sy: number) {
    const w = this.toWorld(sx, sy);
    const a = w.x / (TW / 2);
    const b = w.y / (TH / 2);
    return { x: Math.floor((a + b) / 2), y: Math.floor((b - a) / 2) };
  }

  centerOn(tx: number, ty: number, vw: number, vh: number) {
    const c = tileCenter(tx, ty);
    this.x = vw / 2 - c.x * this.zoom;
    this.y = vh / 2 - c.y * this.zoom;
  }

  zoomAt(factor: number, sx: number, sy: number) {
    const before = this.toWorld(sx, sy);
    this.zoom = Math.min(3, Math.max(0.45, this.zoom * factor));
    this.x = sx - before.x * this.zoom;
    this.y = sy - before.y * this.zoom;
  }
}

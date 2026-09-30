// The living layer: the moving parts of a resting map, shown as sharp page elements over the still picture of the map
// (see ui/game: photo, and render/living for what goes where). Each figure is a picture drawn once and cached (units
// come straight from their cached bitmaps), placed on whole device pixels, and moved by the page's own animations,
// which keep running while the game thinks. Taps go through to the map underneath (pointer-events: none).
import type { Camera } from '../render/camera';
import { bobSamples, sampleWave, type LivingScene, type Wave } from '../render/living';
import { drawBubble, drawFish, drawGlint, drawHpBadge, whaleBody, whaleSpoutAt } from '../render/dynamic';
import { rebelBanner } from '../render/rebels';
import { unitSprite } from '../render/sprites';
import type { Ctx } from '../render/prims';

/** Where a picture of the map was taken: the camera then, and the spare border (CSS px) drawn round the screen. */
export interface PictureAt { x: number; y: number; zoom: number; mx: number; my: number }

/**
 * Where a picture taken at `at` goes on screen now, for the camera `cam`: its top-left corner (on a whole device
 * pixel, which keeps it sharp) and its scale (1 unless mid-pinch).
 */
export function picturePlace(at: PictureAt, cam: Camera, dpr: number) {
  const k = cam.zoom / at.zoom;
  const snap = (v: number) => Math.round(v * dpr) / dpr;
  const left = snap(cam.x - k * (at.x + at.mx)), top = snap(cam.y - k * (at.y + at.my));
  return { left, top, k, transform: Math.abs(k - 1) < 1e-6 ? `translate(${left}px, ${top}px)` : `translate(${left}px, ${top}px) scale(${k})` };
}

/** A cached picture: `url`, its CSS size, and where its drawing origin sits inside it (CSS px). `fw` is one frame's width. */
interface Stamp { url: string; w: number; h: number; ox: number; oy: number; fw: number }
const stamps = new Map<string, Stamp>();
const MAX_STAMPS = 240;

function remember(key: string, st: Stamp) {
  stamps.set(key, st);
  while (stamps.size > MAX_STAMPS) stamps.delete(stamps.keys().next().value as string);
  return st;
}
function recall(key: string) {
  const hit = stamps.get(key);
  if (hit) {
    stamps.delete(key);
    stamps.set(key, hit);
  }
  return hit;
}

/**
 * A drawing turned into a picture: `box` (x0, y0, x1, y1) is the area it covers in drawing units, `scale` CSS px per
 * drawing unit. With `frames`, `draw` is called once per frame and the frames are laid side by side (a flipbook).
 */
function stamp(key: string, dpr: number, scale: number, box: [number, number, number, number], draw: (ctx: Ctx, frame: number) => void, frames = 1): Stamp {
  const full = `${key}|${scale.toFixed(4)}|${dpr}`;
  const hit = recall(full);
  if (hit) return hit;
  const q = scale * dpr;
  // the origin on a whole device pixel, so placing it on one lines every pixel up
  const ox = Math.ceil(-box[0] * q), oy = Math.ceil(-box[1] * q);
  const fw = ox + Math.ceil(box[2] * q), fh = oy + Math.ceil(box[3] * q);
  const c = document.createElement('canvas');
  c.width = fw * frames;
  c.height = fh;
  const ctx = c.getContext('2d')!;
  for (let f = 0; f < frames; f++) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(f * fw, 0, fw, fh);
    ctx.clip();
    ctx.setTransform(q, 0, 0, q, f * fw + ox, oy);
    draw(ctx, f);
    ctx.restore();
  }
  const st = { url: c.toDataURL('image/png'), w: c.width / dpr, h: fh / dpr, ox: ox / dpr, oy: oy / dpr, fw: fw / dpr };
  c.width = c.height = 0;
  return remember(full, st);
}

/** A unit's figure: its cached bitmap (render/sprites), made at exactly the on-screen size, as a picture. */
function unitStamp(u: LivingScene['units'][number], pxScale: number, dpr: number): Stamp {
  const key = `unit|${u.kind}|${u.tribe}|${u.variant}|${pxScale.toFixed(4)}|${dpr}`;
  const hit = recall(key);
  if (hit) return hit;
  const sp = unitSprite(u.kind, u.tribe, pxScale, u.variant, true);
  const w = sp.canvas.width / dpr;
  return remember(key, { url: sp.canvas.toDataURL('image/png'), w, h: sp.canvas.height / dpr, ox: sp.ox / dpr, oy: sp.oy / dpr, fw: w });
}

const SPOUT_FRAMES = 8; // plus a blank one after them, for between spouts
const BANNER_FRAMES = 16;

/** An empty element placed at (x, y) in the layer: its children are laid out round that point. */
function box(x: number, y: number) {
  const el = document.createElement('div');
  el.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:0;height:0;`;
  return el;
}
function pic(st: Stamp, imgs: HTMLImageElement[]) {
  const img = document.createElement('img');
  img.alt = '';
  img.draggable = false;
  img.src = st.url;
  img.style.cssText = `position:absolute;left:${-st.ox}px;top:${-st.oy}px;width:${st.w}px;height:${st.h}px;max-width:none;`;
  imgs.push(img);
  return img;
}

/**
 * Plays a wave on an element, in step with the canvas: the animation clock starts at page time 0, the same clock the
 * canvas draws by. `stepped` holds each sample until the next (whole-pixel moves and flipbook frames stay crisp).
 */
function play(el: HTMLElement, w: Wave, n: number, frame: (v: number) => Keyframe, stepped: boolean, dpr?: number) {
  if (typeof el.animate !== 'function') return;
  const vals = sampleWave(w, n, dpr);
  const frames: Keyframe[] = vals.map((v, i) => ({ ...frame(v), offset: i / n, easing: stepped ? 'steps(1, end)' : 'linear' }));
  frames.push({ ...frame(stepped ? vals[n - 1] : w.at(w.period - 0.01)), offset: 1 });
  const a = el.animate(frames, { duration: w.period, iterations: Infinity });
  a.startTime = 0;
}
const bob = (el: HTMLElement, w: Wave | null, dpr: number) => {
  if (w) play(el, w, bobSamples(w, dpr), (v) => ({ transform: `translateY(${v}px)` }), true, dpr);
};

export class LivingLayer {
  /** Slid and scaled with the camera exactly like the picture it belongs to. */
  readonly el = document.createElement('div');
  private at: (PictureAt & { version: number }) | null = null;
  private next: { inner: HTMLElement; at: PictureAt & { version: number } } | null = null;

  constructor(after: Element) {
    this.el.className = 'living';
    this.el.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;visibility:hidden;transform-origin:0 0;will-change:transform;';
    after.after(this.el);
  }

  /** Builds the layer for a picture (off screen) and waits until every image in it is ready to show. */
  async prepare(scene: LivingScene, at: PictureAt & { version: number }) {
    const { dpr, zoom } = scene;
    const imgs: HTMLImageElement[] = [];
    const inner = document.createElement('div');
    const water = document.createElement('div'), units = document.createElement('div'), banners = document.createElement('div'), over = document.createElement('div');
    inner.append(water, units, banners, over);

    const glint = stamp('glint', dpr, zoom, [-3.5, -3.5, 3.5, 3.5], (ctx) => drawGlint(ctx, 0, 0));
    for (const g of scene.glints) {
      const el = box(g.x, g.y);
      el.style.opacity = '0';
      el.append(pic(glint, imgs));
      play(el, g.alpha, 64, (v) => ({ opacity: String(Math.round(v * 1000) / 1000) }), false);
      water.append(el);
    }
    for (const f of scene.schools) {
      // the ground plane: the loop is drawn unsquashed, then the whole school is squashed 2:1 like the tiles
      const plane = box(f.x, f.y);
      plane.style.transform = 'scaleY(0.5)';
      const ripple = document.createElement('div');
      const R = 17 * zoom;
      ripple.style.cssText = `position:absolute;left:${-R}px;top:${-R}px;width:${2 * R}px;height:${2 * R}px;border:${Math.max(1 / dpr, zoom)}px solid #fff;border-radius:50%;box-sizing:border-box;`;
      play(ripple, f.ripple, 26, (v) => ({ transform: `scale(${(4 + v * 13) / 17})`, opacity: String(0.4 * (1 - v)) }), false);
      const spin = box(0, 0);
      play(spin, f.spin, 2, (v) => ({ transform: `rotate(${v}deg)` }), false); // a steady turn: half way round at mid-period
      f.sizes.forEach((k, i) => {
        const fish = stamp(`fish|${f.body}|${f.back}|${f.water}`, dpr, zoom, [-12, -6, 10, 10], (ctx) => {
          ctx.scale(1, 2); // drawFish squashes 2:1 itself; the plane above does it here
          drawFish(ctx, 0, 0, 0, f.body, f.back, 0, 1, f.water);
        });
        const el = box(0, 0);
        el.style.transform = `rotate(${f.angle0 + i * 120}deg) translateX(${f.r}px) rotate(${f.dir * 90}deg) scale(${k})`;
        el.append(pic(fish, imgs));
        spin.append(el);
      });
      plane.append(ripple, spin);
      water.append(plane);
    }
    for (const wh of scene.whales) {
      const el = box(wh.x, wh.y);
      const body = stamp('whale', dpr, zoom, [-18, -20, 23, 12], (ctx) => whaleBody(ctx, 0, 3, 0));
      const spout = stamp('spout', dpr, zoom, [-18, -20, 23, 12], (ctx, f) => { if (f < SPOUT_FRAMES) whaleSpoutAt(ctx, 0, 3, (f + 0.5) / SPOUT_FRAMES); }, SPOUT_FRAMES + 1);
      el.append(pic(body, imgs), this.flipbook(spout, wh.spout, (q) => (q < 0 ? SPOUT_FRAMES : Math.min(SPOUT_FRAMES - 1, Math.floor(q * SPOUT_FRAMES))), 72, imgs));
      bob(el, wh.bob, dpr);
      water.append(el);
    }
    for (const u of scene.units) {
      const el = box(u.x, u.y);
      const st = unitStamp(u, scene.pxScale, dpr);
      const img = pic(st, imgs);
      if (u.flip) {
        // mirrored about the feet, which sit on a whole device pixel
        img.style.transformOrigin = `${st.ox}px 0`;
        img.style.transform = 'scaleX(-1)';
      }
      el.dataset.unit = String(u.id);
      el.append(img);
      bob(el, u.bob, dpr);
      units.append(el);
    }
    for (const b of scene.banners) {
      const st = stamp('banner', dpr, zoom, [-6, -45, 22, 4], (ctx, f) => rebelBanner(ctx, 0, 0, (f / BANNER_FRAMES) * Math.PI * 2), BANNER_FRAMES);
      const el = box(b.x, b.y);
      el.append(this.flipbook(st, b.wave, (v) => Math.floor(v * BANNER_FRAMES) % BANNER_FRAMES, BANNER_FRAMES * 2, imgs));
      banners.append(el);
    }
    for (const b of scene.badges) {
      const k = b.k;
      const st = stamp(`badge|${b.color}|${b.hp}|${b.low}|${b.veteran}|${b.hero ? b.lvl : 0}|${k.toFixed(3)}`, dpr, 1, [-8 * k - 2, -24 * k - 2, 8 * k + 3, 9 * k + 4],
        (ctx) => drawHpBadge(ctx, b.color, b.hp, b.low, b.veteran, 0, 0, k, b.hero, b.lvl));
      const el = box(b.x, b.y);
      el.dataset.badge = String(b.id);
      el.append(pic(st, imgs));
      bob(el, b.bob, dpr);
      over.append(el);
    }
    for (const b of scene.bubbles) {
      const pad = 8 * b.k + 2;
      const st = stamp(`bubble|${b.kind}|${b.off}|${b.k.toFixed(3)}`, dpr, 1, [-b.r - pad, -b.r - pad, b.r + pad, b.r + 7 * b.k + pad + 4],
        (ctx) => drawBubble(ctx, b.kind, b.off, 0, 0, b.r, b.k));
      const el = box(b.x, b.y);
      el.append(pic(st, imgs));
      bob(el, b.bob, dpr);
      over.append(el);
    }
    this.next = { inner, at };
    await Promise.all(imgs.map((i) => i.decode().catch(() => undefined)));
    return this.next?.inner === inner;
  }

  /** A window one frame wide onto a flipbook, showing frame `frame(wave)` at each moment. */
  private flipbook(st: Stamp, w: Wave, frame: (v: number) => number, n: number, imgs: HTMLImageElement[]) {
    const win = document.createElement('div');
    win.style.cssText = `position:absolute;left:${-st.ox}px;top:${-st.oy}px;width:${st.fw}px;height:${st.h}px;overflow:hidden;`;
    const strip = pic(st, imgs);
    strip.style.left = strip.style.top = '0';
    win.append(strip);
    play(strip, { period: w.period, at: (now) => frame(w.at(now)) }, n, (f) => ({ transform: `translateX(${-f * st.fw}px)` }), true);
    return win;
  }

  /** Swaps in the layer made by the last prepare(), for a picture now on screen. */
  commit() {
    if (!this.next) return;
    this.el.replaceChildren(this.next.inner);
    this.at = this.next.at;
    this.next = null;
  }

  /** Follows the camera like the picture; shows only over a picture of the same game state. */
  place(cam: Camera, dpr: number, visible: boolean, version: number) {
    const on = visible && !!this.at && this.at.version === version;
    if (on) this.el.style.transform = picturePlace(this.at!, cam, dpr).transform;
    this.el.style.visibility = on ? 'visible' : 'hidden';
  }

  /** Empties the layer (the picture no longer needs it). */
  clear() {
    this.next = null;
    this.at = null;
    this.el.replaceChildren();
    this.el.style.visibility = 'hidden';
  }

  destroy() {
    this.clear();
    this.el.remove();
  }
}

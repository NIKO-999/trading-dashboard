// The living map, for the still-picture display (see ui/game: photo). The resting map is shown as a picture
// because iOS shows pictures pin-sharp but a live canvas soft. The picture leaves out whatever moves on its own:
// units (with their health badges and action buttons), fish, whales, water glints and the Rogue States' banners.
// This works out where each of those goes and how it moves, and ui/living shows them as sharp page elements on top,
// each animated by a Wave that the page's animation clock plays in step with the canvas (both run on
// performance.now()). Pure: no page or canvas access, so it can be tested directly.
import { cityVisibleTo } from '../game/mech';
import { isRogueCity, rogueLook } from '../game/rebels';
import type { GameState, TribeId, UnitKind } from '../game/types';
import { Camera, TW, WATER_DROP, tileCenter } from './camera';
import { isWaterTile, REDUCED_MOTION, uv, type Overlay } from './common';
import type { SpriteVariant } from './sprites';
import {
  bubbleSpots, FISH, fishSchool, glintAlpha, glintAt, hpBadge, overlayScale, shownUnits, unitMotion, unitReady, unitScale, unitSpent,
  waterColor, whaleRise, whaleSpout, WHALE_SPOUT_MS, type BubbleKind, type Motion,
} from './dynamic';

/**
 * Something that changes over time, repeating every `period` ms: `at(now)` is its value at `performance.now()` time
 * `now` (a CSS-pixel offset, an opacity or a frame number).
 */
export interface Wave { period: number; at: (now: number) => number }

/** A unit standing still on the map. (x, y) is where its feet go (CSS px, on a whole device pixel). */
export interface LivingUnit { id: number; kind: UnitKind; tribe: TribeId; variant: SpriteVariant; x: number; y: number; flip: boolean; bob: Wave | null }
export interface LivingBadge { id: number; x: number; y: number; color: string; hp: number; low: boolean; veteran: boolean; hero?: boolean; lvl?: number; k: number; bob: Wave | null }
export interface LivingBubble { kind: BubbleKind; off: boolean; x: number; y: number; r: number; k: number; bob: Wave }
/** A glint on the water: `alpha` its brightness. */
export interface LivingGlint { x: number; y: number; alpha: Wave }
/**
 * A school of three fish circling a point (x, y). The loop is drawn on the ground plane: `r` is its radius (CSS px)
 * before the 2:1 squash, `angle0` (degrees) where the first fish is at time 0, `spin` the loop's turning.
 */
export interface LivingSchool { x: number; y: number; r: number; angle0: number; dir: 1 | -1; spin: Wave; sizes: number[]; body: string; back: string; water: string; ripple: Wave }
/** A whale on its tile: (x, y) the tile's water centre; its back rises and sinks (`bob`) and it spouts (`spout`: 0..1, -1 = none). */
export interface LivingWhale { x: number; y: number; bob: Wave; spout: Wave }
/** A war banner planted at (x, y); `wave` is how far through its ripple the cloth is (0..1). */
export interface LivingBanner { x: number; y: number; wave: Wave }

export interface LivingScene {
  zoom: number;
  dpr: number;
  /** Device pixels per unit-art unit: the scale unit bitmaps are made at (see render/sprites). */
  pxScale: number;
  units: LivingUnit[];
  badges: LivingBadge[];
  bubbles: LivingBubble[];
  glints: LivingGlint[];
  schools: LivingSchool[];
  whales: LivingWhale[];
  banners: LivingBanner[];
}

/** How a unit breathes (on land, while it waits for orders) or bobs (afloat): 2π·380 ms and 2π·520 ms. */
export const LAND_BOB_MS = 2 * Math.PI * 380;
export const WATER_BOB_MS = 2 * Math.PI * 520;
export const GLINT_MS = 2 * Math.PI * 700;
export const WHALE_BOB_MS = 2 * Math.PI * 1100;
export const BANNER_MS = 2 * Math.PI * 260;
export const RIPPLE_MS = 2600;
/** Never more glints than this in the layer (a sea view would otherwise hold hundreds of elements). */
export const MAX_GLINTS = 90;

/**
 * Everything the living layer shows for a picture of the map taken through `cam` (a `vw` x `vh` CSS-px view drawn
 * at `dpr`). Positions are in that view's CSS pixels, snapped to whole device pixels like the canvas snaps them.
 */
export function livingScene(s: GameState, viewer: number, cam: Camera, ov: Overlay, vw: number, vh: number, dpr: number): LivingScene {
  const snap = (v: number) => Math.round(v * dpr) / dpr;
  const zoom = cam.zoom;
  const us = unitScale(zoom);
  const { k, kh, detail } = overlayScale(zoom);
  const scene: LivingScene = { zoom, dpr, pxScale: us * zoom * dpr, units: [], badges: [], bubbles: [], glints: [], schools: [], whales: [], banners: [] };
  const units = shownUnits(s, viewer, cam, vw, vh);
  const rest = new Map<number, Motion>();
  for (const u of units) {
    const ready = unitReady(s, u, viewer);
    const m = unitMotion(s, u, ov.fx, ov.now, ready, false);
    rest.set(u.id, m);
    // how far (CSS px) the figure is from its resting place at any moment: the canvas's own idle motion
    const lift = (mm: Motion) => mm.y - mm.lift;
    const bob: Wave | null = REDUCED_MOTION || (!m.water && !ready) ? null
      : { period: m.water ? WATER_BOB_MS : LAND_BOB_MS, at: (now) => (lift(unitMotion(s, u, ov.fx, now, ready)) - lift(m)) * zoom };
    const feet = cam.toScreen(m.x, m.y - m.lift + 5);
    scene.units.push({
      id: u.id, kind: u.kind, tribe: rogueLook(s, u) ?? s.players[u.owner].tribe, variant: unitSpent(s, u, viewer) ? 'spent' : 'base',
      x: snap(feet.x), y: snap(feet.y), flip: (ov.fx.facing.get(u.id) ?? 1) < 0, bob,
    });
    const b = hpBadge(s, u, ov, cam, m, detail, kh, us);
    if (b) scene.badges.push({ id: u.id, x: snap(b.x), y: snap(b.y), color: b.color, hp: b.hp, low: b.low, veteran: b.veteran, hero: b.hero, lvl: b.lvl, k: kh, bob });
  }
  for (const b of bubbleSpots(ov, cam, units, rest, k, us)) {
    // the buttons bob on their own, and with a unit breathing on land (the same rhythm) as well
    const ub = scene.units.find((x) => x.id === b.unit.id)?.bob;
    const own = (now: number) => Math.sin(now / 380) * 1.6 * k;
    const bob: Wave = { period: LAND_BOB_MS, at: ub && ub.period === LAND_BOB_MS ? (now) => own(now) + ub.at(now) : own };
    scene.bubbles.push({ kind: b.kind, off: b.off, x: snap(b.x), y: snap(b.y), r: b.r, k, bob });
  }

  // water life, over the same stretch of map the canvas draws it for
  const explored = (x: number, y: number) => viewer < 0 || s.players[viewer].explored[y * s.size + x];
  const w0 = cam.toWorld(-60, -60), w1 = cam.toWorld(vw + 60, vh + 60);
  const glints: LivingGlint[] = [];
  for (const t of s.tiles) {
    if (!isWaterTile(t) || !explored(t.x, t.y)) continue;
    const c = tileCenter(t.x, t.y);
    if (c.x <= w0.x || c.x >= w1.x || c.y <= w0.y || c.y >= w1.y) continue;
    const cy = c.y + WATER_DROP;
    if (t.resource === 'fish') {
      const f = fishSchool(t);
      const o = cam.toScreen(uv(c.x, cy, f.ou, f.ov).x, uv(c.x, cy, f.ou, f.ov).y);
      const [body, back] = FISH[t.biome];
      scene.schools.push({
        x: snap(o.x), y: snap(o.y),
        // the loop is an ellipse on the tile; the layer runs it as a circle of the same mean size, turned 45°
        // like the tile's diamond, so the fish can simply be carried round by one spinning element
        r: ((f.ru + f.rv) / 2) * Math.SQRT2 * (TW / 2) * zoom,
        angle0: (f.spin0 * 180) / Math.PI + 45, dir: f.dir as 1 | -1,
        spin: { period: (2 * Math.PI * 1000) / Math.abs(f.rate), at: (now) => (((now / 1000) * f.rate * 180) / Math.PI) % 360 },
        sizes: f.sizes, body, back, water: waterColor(t),
        ripple: { period: RIPPLE_MS, at: (now) => ((now + t.seed * 37) % RIPPLE_MS) / RIPPLE_MS },
      });
    } else if (t.resource === 'whale') {
      const o = cam.toScreen(c.x, cy);
      scene.whales.push({
        x: snap(o.x), y: snap(o.y),
        bob: { period: WHALE_BOB_MS, at: (now) => -whaleRise(now, t.seed) * zoom },
        spout: { period: WHALE_SPOUT_MS, at: (now) => whaleSpout(now, t.seed) },
      });
    }
    const g = glintAt(t, c.x, cy);
    const p = cam.toScreen(g.x, g.y);
    glints.push({ x: snap(p.x), y: snap(p.y), alpha: { period: GLINT_MS, at: (now) => glintAlpha(now, t.seed) } });
  }
  // a wide sea keeps an even sprinkling of glints rather than hundreds of elements
  const step = glints.length / MAX_GLINTS;
  scene.glints = step <= 1 ? glints : Array.from({ length: MAX_GLINTS }, (_, i) => glints[Math.floor(i * step)]);

  for (const c of s.cities) {
    if (!isRogueCity(s, c) || c.data?.waka) continue;
    if (viewer >= 0 && (!s.players[viewer]?.explored[c.y * s.size + c.x] || !cityVisibleTo(s, viewer, c))) continue;
    const p = tileCenter(c.x, c.y);
    const o = cam.toScreen(p.x + 16, p.y - 2);
    if (o.x < -60 || o.y < -60 || o.x > vw + 60 || o.y > vh + 120) continue;
    scene.banners.push({ x: snap(o.x), y: snap(o.y), wave: { period: BANNER_MS, at: (now) => (((now / 260 + c.id) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / (2 * Math.PI) } });
  }
  return scene;
}

/**
 * A wave sampled `n` times over one period, from time 0 (a whole number of periods ago, so it lines up with a page
 * animation clock started at time 0). With `dpr`, each value is rounded to a whole device pixel.
 */
export function sampleWave(w: Wave, n: number, dpr?: number): number[] {
  return Array.from({ length: n }, (_, i) => {
    const v = w.at((i * w.period) / n);
    return dpr ? Math.round(v * dpr) / dpr : v;
  });
}

/** How many samples a bob of up to `amp` CSS px needs so that no step skips a device pixel (at least 24, at most 96). */
export function bobSamples(w: Wave, dpr: number) {
  const s = sampleWave(w, 24);
  const amp = (Math.max(...s) - Math.min(...s)) / 2;
  return Math.max(24, Math.min(96, Math.ceil(2 * Math.PI * amp * dpr * 1.2)));
}

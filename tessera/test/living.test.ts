import assert from 'node:assert/strict';
import test from 'node:test';
import { aiStep } from '../src/game/ai';
import { tileAt } from '../src/game/grid';
import { createGame, spawnUnit } from '../src/game/mapgen';
import { endTurn, isHumanTurn, startTurn } from '../src/game/turn';
import type { GameState } from '../src/game/types';
import { Camera, tileCenter } from '../src/render/camera';
import { isWaterTile, newFx, type Overlay } from '../src/render/common';
import { drawDynamic, drawWaterLife, ground, shownUnits, unitMotion, unitReady, unitScale } from '../src/render/dynamic';
import { bobSamples, LAND_BOB_MS, livingScene, MAX_GLINTS, sampleWave, WATER_BOB_MS } from '../src/render/living';

const DPR = 3;
const VW = 390 + 2 * 136, VH = 844 + 2 * 253; // a picture of an iPhone screen with its spare border

function game(opts: Partial<Parameters<typeof createGame>[0]> = {}) {
  const s = createGame({ seed: 5, human: 'rome', opponents: ['egypt', 'vikings'], mode: 'perfection', mapSize: 'normal', ...opts });
  startTurn(s); // the human's units are ready for orders
  return s;
}
const overlay = (now = 12_345): Overlay => ({ selected: null, moves: [], attacks: [], glow: new Set(), fx: newFx(), now });

/** A camera looking at the viewer's capital, as the game starts. */
function camOn(s: GameState, zoom = 1.6) {
  const cap = s.cities.find((c) => c.owner === 0 && c.capital)!;
  const cam = new Camera();
  cam.zoom = zoom;
  cam.centerOn(cap.x, cap.y, VW, VH);
  // an awkward sub-pixel camera, like a real pan leaves it
  cam.x += 0.137;
  cam.y -= 0.291;
  return cam;
}
const onGrid = (v: number) => Math.abs(v * DPR - Math.round(v * DPR)) < 1e-6;

test('the living layer shows exactly the units the canvas would, feet on whole device pixels', () => {
  const s = game();
  const cam = camOn(s);
  const ov = overlay();
  const scene = livingScene(s, 0, cam, ov, VW, VH, DPR);
  const shown = shownUnits(s, 0, cam, VW, VH);
  assert.ok(shown.length >= 1);
  assert.deepEqual(scene.units.map((u) => u.id), shown.map((u) => u.id), 'same units, same back-to-front order');
  for (const lu of scene.units) {
    const u = s.units.find((v) => v.id === lu.id)!;
    const g = ground(s, u.x, u.y);
    const p = cam.toScreen(g.x, g.y + 5);
    assert.ok(Math.abs(lu.x - p.x) <= 0.5 / DPR + 1e-9 && Math.abs(lu.y - p.y) <= 0.5 / DPR + 1e-9, 'feet where the canvas puts them');
    assert.ok(onGrid(lu.x) && onGrid(lu.y), 'on a whole device pixel');
  }
  assert.equal(scene.pxScale, unitScale(cam.zoom) * cam.zoom * DPR);
});

test('a waiting unit breathes in step with the canvas, in whole device pixels', () => {
  const s = game();
  const cam = camOn(s);
  const ov = overlay();
  const u = s.units.find((v) => v.owner === 0)!;
  assert.ok(unitReady(s, u, 0));
  const lu = livingScene(s, 0, cam, ov, VW, VH, DPR).units.find((v) => v.id === u.id)!;
  assert.ok(lu.bob, 'a ready unit bobs');
  assert.equal(lu.bob.period, LAND_BOB_MS);
  const rest = unitMotion(s, u, ov.fx, 0, true, false);
  for (const now of [0, 700, 1234.5, 99_999]) {
    const m = unitMotion(s, u, ov.fx, now, true);
    assert.ok(Math.abs(lu.bob.at(now) - (rest.lift - m.lift) * cam.zoom) < 1e-9, 'the same lift as the canvas');
    assert.ok(lu.bob.at(now) <= 1e-9, 'it only ever rises from where the picture rests it');
  }
  const n = bobSamples(lu.bob, DPR);
  const samples = sampleWave(lu.bob, n, DPR);
  assert.ok(samples.every(onGrid), 'every step lands on a device pixel');
  for (let i = 1; i < n; i++) assert.ok(Math.abs(samples[i] - samples[i - 1]) <= 1 / DPR + 1e-9, 'no step skips a pixel');
  // repeats every period, so the page's clock and the canvas's agree forever
  assert.ok(Math.abs(lu.bob.at(500) - lu.bob.at(500 + lu.bob.period * 7)) < 1e-6);

  // once it has moved it stands still (and its badge with it); a spent unit is greyed
  u.moved = true;
  u.attacked = true;
  const spent = livingScene(s, 0, cam, ov, VW, VH, DPR);
  assert.equal(spent.units.find((v) => v.id === u.id)!.bob, null);
  assert.equal(spent.units.find((v) => v.id === u.id)!.variant, 'spent');
});

test('boats bob on the water; badges and action buttons move with their unit', () => {
  const s = game();
  for (const p of s.players) p.explored.fill(true);
  const cam = camOn(s, 1);
  const inView = (x: number, y: number) => { const c = cam.toScreen(tileCenter(x, y).x, tileCenter(x, y).y); return c.x > 0 && c.y > 0 && c.x < VW && c.y < VH; };
  const water = s.tiles.find((t) => isWaterTile(t) && !s.units.some((u) => u.x === t.x && u.y === t.y) && inView(t.x, t.y));
  assert.ok(water, 'some water in view');
  const boat = spawnUnit(s, 'boat', 0, water.x, water.y, null);
  boat.hp = 3; // wounded: its badge shows at any zoom
  const ov = overlay();
  ov.selected = { x: boat.x, y: boat.y };
  ov.bubbles = ['attack', 'heal'];
  ov.bubblesOff = ['heal'];
  const scene = livingScene(s, 0, cam, ov, VW, VH, DPR);
  const lb = scene.units.find((u) => u.id === boat.id)!;
  assert.equal(lb.bob?.period, WATER_BOB_MS);
  const badge = scene.badges.find((b) => b.id === boat.id)!;
  assert.ok(badge, 'the wounded boat has a badge');
  assert.equal(badge.hp, 3);
  assert.ok(badge.low);
  assert.equal(badge.bob, lb.bob, 'the badge rides with its boat');
  assert.deepEqual(scene.bubbles.map((b) => [b.kind, b.off]), [['attack', false], ['heal', true]]);
  assert.ok(scene.bubbles[0].x < scene.bubbles[1].x && scene.bubbles.every((b) => b.y < lb.y), 'buttons side by side above the boat');
});

test('fish, whales and glints come from the water in view, glints capped', () => {
  const s = game({ mapSize: 'huge', seed: 9 });
  for (const p of s.players) p.explored.fill(true);
  const cam = camOn(s, 0.6);
  const scene = livingScene(s, 0, cam, overlay(), VW, VH, DPR);
  const w0 = cam.toWorld(-60, -60), w1 = cam.toWorld(VW + 60, VH + 60);
  const inView = s.tiles.filter((t) => { const c = tileCenter(t.x, t.y); return isWaterTile(t) && c.x > w0.x && c.x < w1.x && c.y > w0.y && c.y < w1.y; });
  assert.equal(scene.schools.length, inView.filter((t) => t.resource === 'fish').length);
  assert.equal(scene.whales.length, inView.filter((t) => t.resource === 'whale').length);
  assert.equal(scene.glints.length, Math.min(MAX_GLINTS, inView.length));
  assert.ok(scene.schools.length > 0);
  for (const f of scene.schools) {
    // the loop turns at the canvas's rate: a whole turn per period
    assert.ok(Math.abs(Math.abs(f.spin.at(f.spin.period - 1e-6)) - 360) < 1e-3);
    assert.ok(f.ripple.at(0) >= 0 && f.ripple.at(0) < 1);
  }
  for (const g of scene.glints) for (const a of sampleWave(g.alpha, 16)) assert.ok(a >= 0 && a <= 1);
});

test('panning moves every element by exactly the pan', () => {
  const s = game();
  const cam = camOn(s);
  const ov = overlay();
  const a = livingScene(s, 0, cam, ov, VW, VH, DPR);
  cam.x += 17 / DPR;
  cam.y -= 40 / DPR;
  const b = livingScene(s, 0, cam, ov, VW, VH, DPR);
  a.units.forEach((u, i) => {
    assert.ok(Math.abs(b.units[i].x - u.x - 17 / DPR) < 1e-9);
    assert.ok(Math.abs(b.units[i].y - u.y + 40 / DPR) < 1e-9);
  });
});

// ---- the still picture leaves out what the living layer shows (a recording stand-in for the canvas)

/** A 2D context that draws nothing and counts unit bitmaps copied onto it. */
function fakeCtx() {
  const calls = { drawImage: 0, fills: 0 };
  const grad = { addColorStop() {} };
  let m = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  const target: Record<string, unknown> = {
    drawImage: () => { calls.drawImage++; },
    fill: () => { calls.fills++; },
    getTransform: () => m,
    setTransform: (a: number, b: number, c: number, d: number, e: number, f: number) => { m = { a, b, c, d, e, f }; },
    createLinearGradient: () => grad, createRadialGradient: () => grad,
    measureText: (t: string) => ({ width: t.length * 6 }),
    getImageData: (_x: number, _y: number, w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
  };
  const ctx = new Proxy(target, { get: (t, k) => (k in t ? t[k as string] : () => undefined), set: (t, k, v) => { t[k as string] = v; return true; } });
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

test('the still picture leaves units, fish and glints to the living layer', () => {
  const g = globalThis as { document?: unknown };
  const had = g.document;
  g.document = { createElement: () => ({ width: 0, height: 0, getContext: () => fakeCtx().ctx }), documentElement: { classList: { toggle() {} } } };
  try {
    const s = game();
    const cam = camOn(s);
    const live = fakeCtx();
    drawDynamic(live.ctx, s, 0, cam, overlay(), VW, VH, DPR);
    assert.ok(live.calls.drawImage >= 1, 'the live canvas copies the unit bitmaps');
    const still = fakeCtx();
    drawDynamic(still.ctx, s, 0, cam, { ...overlay(), still: true, living: true }, VW, VH, DPR);
    assert.equal(still.calls.drawImage, 0, 'no unit in the picture');
    // water life: nothing but whale rings in the picture
    for (const p of s.players) p.explored.fill(true);
    const fishy = s.tiles.find((t) => t.resource === 'fish')!;
    const c = new Camera();
    c.centerOn(fishy.x, fishy.y, VW, VH);
    const wl = fakeCtx(), ws = fakeCtx();
    drawWaterLife(wl.ctx, s, 0, c, overlay(), VW, VH);
    drawWaterLife(ws.ctx, s, 0, c, { ...overlay(), still: true, living: true }, VW, VH);
    assert.ok(wl.calls.fills > 0);
    assert.equal(ws.calls.fills, 0);
  } finally {
    g.document = had;
  }
});

test('a 30-turn all-AI game: the living layer always matches the units on screen', () => {
  const s = createGame({ seed: 21, human: null, opponents: ['rome', 'egypt', 'vikings', 'pirates'], mode: 'perfection', mapSize: 'normal' });
  let checks = 0;
  while (s.turn < 30 && !s.over) {
    for (let guard = 0; guard < 400 && !isHumanTurn(s) && aiStep(s); guard++);
    const viewer = s.current;
    const cap = s.cities.find((c) => c.owner === viewer) ?? s.cities[0];
    const cam = new Camera();
    cam.zoom = 1.2;
    if (cap) cam.centerOn(cap.x, cap.y, VW, VH);
    const scene = livingScene(s, viewer, cam, overlay(s.turn * 1000), VW, VH, DPR);
    assert.deepEqual(scene.units.map((u) => u.id), shownUnits(s, viewer, cam, VW, VH).map((u) => u.id));
    for (const u of scene.units) {
      assert.ok(onGrid(u.x) && onGrid(u.y));
      const t = tileAt(s, s.units.find((v) => v.id === u.id)!.x, s.units.find((v) => v.id === u.id)!.y)!;
      if (u.bob) assert.equal(u.bob.period, isWaterTile(t) ? WATER_BOB_MS : LAND_BOB_MS);
    }
    checks++;
    endTurn(s);
  }
  assert.ok(checks >= 20, `checked ${checks} turns`);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { doAction, moveOptions, moveUnit, tileActions } from '../../src/game/rules';
import { tileAt } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { hookIncome } from '../../src/game/mech';
import { mech, counter, levelsWorked, staircaseBonus, zipDestinations } from '../../src/game/mech/inca';
import type { GameState, Tile } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 5, human: 'inca', opponents: ['japan'], mode: 'perfection' });
  for (const p of s.players) p.explored.fill(true);
  const city = s.cities.find((c) => c.owner === 0)!;
  s.players[0].techs.push('farming');
  s.players[0].stars = 100;
  return { s, city };
}

/** Make a clean, owned tile of the given terrain near the city. */
function plot(s: GameState, city: { id: number; x: number; y: number }, dx: number, dy: number, terrain: Tile['terrain']): Tile {
  const t = tileAt(s, city.x + dx, city.y + dy)!;
  t.terrain = terrain;
  t.resource = null;
  t.improvement = null;
  t.village = false;
  t.ruin = false;
  t.owner = city.id;
  s.units = s.units.filter((u) => !(u.x === t.x && u.y === t.y));
  return t;
}

test('chaski outpost and terrace farm are enabled tile actions run through doAction', () => {
  const { s, city } = setup();
  const m = plot(s, city, 1, 0, 'mountain');
  const f = plot(s, city, -1, 0, 'forest');
  const chaski = tileActions(s, 0, m).find((a) => a.id === 'mech:chaski');
  assert.ok(chaski && chaski.enabled);
  const before = s.players[0].stars;
  assert.ok(doAction(s, 0, m, 'mech:chaski'));
  assert.equal(m.improvement, 'chaski');
  assert.equal(s.players[0].stars, before - chaski.cost);
  const terr = tileActions(s, 0, f).find((a) => a.id === 'mech:terrace');
  assert.ok(terr && terr.enabled && terr.cost === 5);
  assert.ok(doAction(s, 0, f, 'mech:terrace'));
  assert.equal(f.improvement, 'farm');
  assert.equal(f.data?.terrace, true);
  assert.equal(tileActions(s, 0, f).some((a) => a.id === 'mech:terrace'), false, 'already built');
  // needs Farming
  const { s: s2, city: c2 } = setup();
  s2.players[0].techs = s2.players[0].techs.filter((x) => x !== 'farming');
  const f2 = plot(s2, c2, -1, 0, 'forest');
  const a2 = tileActions(s2, 0, f2).find((a) => a.id === 'mech:terrace')!;
  assert.equal(a2.enabled, false);
  JSON.parse(JSON.stringify(s));
});

test('mountains cost 1 and do not end an Inca unit move', () => {
  const { s, city } = setup();
  const peak = plot(s, city, 1, 0, 'mountain');
  const u = spawnUnit(s, 'warrior', 0, city.x, city.y, null);
  const ctx = { cost: 1, stop: true, forbid: false, opt: { x: peak.x, y: peak.y } };
  mech.moveStep!(s, 0, u, tileAt(s, city.x, city.y)!, peak, ctx);
  assert.equal(ctx.stop, false);
  assert.equal(ctx.cost, 1);
  // an enemy next to the peak still stops the unit there
  spawnUnit(s, 'warrior', 1, peak.x + 1, peak.y, null);
  const ctx2 = { cost: 1, stop: true, forbid: false, opt: { x: peak.x, y: peak.y } };
  mech.moveStep!(s, 0, u, tileAt(s, city.x, city.y)!, peak, ctx2);
  assert.equal(ctx2.stop, true);
});

test('zipline: slung from next to an outpost to another outpost and across 4+ mountains', () => {
  const { s, city } = setup();
  s.units = s.units.filter((u) => u.owner !== 1 && !(u.owner === 0));
  const a = plot(s, city, 1, 1, 'mountain');
  const b = plot(s, city, -1, -1, 'mountain');
  a.improvement = 'chaski'; b.improvement = 'chaski';
  const u = spawnUnit(s, 'warrior', 0, a.x + 1, a.y, null);
  u.x = a.x; u.y = a.y; // standing ON the outpost
  u.moved = false; u.attacked = false;
  const dest = zipDestinations(s, 0, u.x, u.y);
  assert.ok(dest.some((o) => o.x === b.x && o.y === b.y), 'to the other outpost');
  const opts = moveOptions(s, u);
  assert.ok(opts.some((o) => o.x === b.x && o.y === b.y));
  // line of 4 mountains then a field, along +x from the outpost
  for (let k = 1; k <= 4; k++) { const t = tileAt(s, a.x + k, a.y)!; t.terrain = 'mountain'; t.cityId = null; t.village = false; }
  const land = tileAt(s, a.x + 5, a.y)!;
  land.terrain = 'field'; land.cityId = null; land.village = false;
  assert.ok(moveOptions(s, u).some((o) => o.x === land.x && o.y === land.y), 'across four mountains');
  const short = tileAt(s, a.x, a.y + 4)!; // only 3 mountains would not be enough
  for (let k = 1; k <= 3; k++) tileAt(s, a.x, a.y + k)!.terrain = 'mountain';
  short.terrain = 'field';
  assert.ok(!moveOptions(s, u).some((o) => o.x === short.x && o.y === short.y) || zipDestinations(s, 0, u.x, u.y).every((o) => !(o.x === short.x && o.y === short.y)));
  // a unit far from any outpost has no zip
  const lone = spawnUnit(s, 'warrior', 0, city.x - 3, city.y + 3, null);
  assert.equal(zipDestinations(s, 0, lone.x, lone.y).length, 0);
  // do it for real
  assert.ok(moveUnit(s, u, b.x, b.y));
  assert.equal(u.x, b.x);
  assert.equal(counter(s, 0, 'zips'), 1);
  assert.equal(u.moved, true);
});

test('staircase: income multiplies with the number of elevations worked', () => {
  const { s, city } = setup();
  for (const t of s.tiles) if (t.owner === city.id && t.improvement) t.improvement = null;
  for (const t of s.tiles) if (t.owner === city.id && t.cityId === null) { t.terrain = 'field'; t.resource = null; }
  assert.equal(levelsWorked(s, city).length, 0);
  const field = plot(s, city, 1, 0, 'field');
  field.improvement = 'market';
  assert.equal(levelsWorked(s, city).length, 1);
  assert.equal(staircaseBonus(s, city), 0);
  const base = hookIncome(s, 0);
  const f = plot(s, city, -1, 0, 'forest');
  assert.ok(doAction(s, 0, f, 'mech:terrace'));
  assert.deepEqual(levelsWorked(s, city), ['lowland', 'hill']);
  const two = staircaseBonus(s, city);
  assert.ok(two >= 1, 'x1.5 gives extra stars');
  const m = plot(s, city, 0, 1, 'mountain');
  assert.ok(doAction(s, 0, m, 'mech:terrace'));
  assert.deepEqual(levelsWorked(s, city), ['lowland', 'hill', 'peak']);
  const three = staircaseBonus(s, city);
  assert.ok(three > two, 'x2 beats x1.5');
  assert.ok(hookIncome(s, 0) > base, 'income hook pays it (peak +1 too)');
  assert.ok(three <= 6);
});

test('AI builds terraces and outposts', () => {
  const { s } = setup();
  s.players[0].human = false;
  aiTurn(s);
  assert.ok(counter(s, 0, 'terraces') + counter(s, 0, 'outposts') >= 1);
});

test('all-AI 20-turn game with Inca completes and the AI uses the mechanic', () => {
  let used = 0, zips = 0;
  for (const seed of [11, 3, 7]) {
    const s: GameState = createGame({ seed, human: null, opponents: ['inca', 'japan', 'mongols'], mode: 'perfection' });
    startTurn(s);
    let guard = 0;
    while (!s.over && s.turn < 20 && guard++ < 1000) {
      aiTurn(s);
      endTurn(s);
    }
    assert.ok(s.turn >= 20 || s.over);
    const inca = s.players.findIndex((p) => p.tribe === 'inca');
    used += counter(s, inca, 'terraces') + counter(s, inca, 'outposts');
    zips += counter(s, inca, 'zips');
  }
  assert.ok(used >= 1, 'AI built terraces or outposts');
  assert.ok(zips >= 1, 'AI slung a unit by zipline at least once');
});

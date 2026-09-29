import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { doAction, tileActions } from '../../src/game/rules';
import { tileAt } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { cityVisibleTo, hookIncome } from '../../src/game/mech';
import { SOLITUDE_CAP, hasMist, solitudeIncome, solitudeStars, stupasOf } from '../../src/game/mech/tibet';
import type { GameState } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 5, human: 'tibet', opponents: ['japan'], mode: 'perfection' });
  const city = s.cities.find((c) => c.owner === 0)!;
  // strip mountains near the city so the tests control the mist
  for (const t of s.tiles) if (t.terrain === 'mountain' && Math.max(Math.abs(t.x - city.x), Math.abs(t.y - city.y)) <= 3) t.terrain = 'field';
  return { s, city };
}

test('mist hides a city from the enemy until they stand on an adjacent peak', () => {
  const { s, city } = setup();
  assert.ok(!hasMist(s, city));
  assert.equal(cityVisibleTo(s, 1, city), true, 'no peaks, no mist');
  const peak = tileAt(s, city.x + 1, city.y)!;
  peak.terrain = 'mountain';
  assert.ok(hasMist(s, city));
  assert.equal(cityVisibleTo(s, 1, city), false, 'hidden');
  assert.equal(cityVisibleTo(s, 0, city), true, 'owner sees it');
  const flat = tileAt(s, city.x, city.y + 1)!;
  const e = spawnUnit(s, 'warrior', 1, flat.x, flat.y, null);
  assert.equal(cityVisibleTo(s, 1, city), false, 'adjacent on flat ground is not enough');
  e.x = peak.x;
  e.y = peak.y;
  assert.equal(cityVisibleTo(s, 1, city), true, 'enemy on the adjacent peak parts the mist');
});

test('stupa extends the mist and is raised by an action', () => {
  const { s, city } = setup();
  const t = s.tiles.find((x) => x.owner === city.id && x.cityId === null && !x.village && !x.ruin && !x.resource && !x.improvement && x.terrain === 'field' && !s.units.some((u) => u.x === x.x && u.y === x.y))!;
  assert.ok(t, 'a free tile inside borders');
  s.players[0].stars = 20;
  const act = tileActions(s, 0, t).find((a) => a.id === 'mech:stupa');
  assert.ok(act && act.enabled);
  assert.ok(doAction(s, 0, t, 'mech:stupa'));
  assert.equal(t.improvement, 'stupa');
  assert.equal(s.players[0].stars, 20 - act.cost);
  assert.equal(stupasOf(s, city).length, 1);
  assert.ok(hasMist(s, city));
  assert.equal(cityVisibleTo(s, 1, city), false);
  JSON.parse(JSON.stringify(s));
});

test('solitude: remote highland resources pay more stars, capped', () => {
  const { s, city } = setup();
  const t = tileAt(s, city.x + 1, city.y)!;
  t.terrain = 'mountain';
  t.resource = 'ore';
  t.owner = city.id;
  // no enemy anywhere
  s.units = s.units.filter((u) => u.owner === 0);
  for (const o of s.tiles) if (o.owner !== null && s.cities.find((c) => c.id === o.owner)!.owner !== 0) o.owner = null;
  assert.equal(solitudeStars(s, 0, t), 2, 'isolated: maximum');
  const e = spawnUnit(s, 'warrior', 1, t.x, t.y + 1, null);
  assert.equal(solitudeStars(s, 0, t), 0, 'enemy next door: nothing');
  e.y = t.y + 2;
  assert.equal(solitudeStars(s, 0, t), 1, 'floor(2/2)');
  e.y = t.y + 4;
  assert.equal(solitudeStars(s, 0, t), 2);
  e.y = t.y + 8;
  assert.equal(solitudeStars(s, 0, t), 2, 'capped at 2');
  assert.ok(hookIncome(s, 0) >= 2 && hookIncome(s, 0) <= SOLITUDE_CAP);
  // an enemy border also counts
  const near = tileAt(s, t.x, t.y + 2)!;
  const foe = s.cities.find((c) => c.owner === 1)!;
  near.owner = foe.id;
  assert.equal(solitudeStars(s, 0, t), 1);
  // the forest analogue pays less
  const f = tileAt(s, city.x - 1, city.y)!;
  f.terrain = 'forest';
  f.resource = 'animal';
  f.owner = city.id;
  near.owner = null;
  s.units = s.units.filter((u) => u.owner === 0);
  assert.equal(solitudeStars(s, 0, f), 1, 'isolated forest: maximum 1');
  const e2 = spawnUnit(s, 'warrior', 1, f.x, f.y + 2, null);
  assert.equal(solitudeStars(s, 0, f), 0, 'floor(2/3)');
  s.units = s.units.filter((u) => u !== e2);
  // mountain 2 + forest 1 exceed the per-player cap
  assert.equal(solitudeStars(s, 0, t) + solitudeStars(s, 0, f), 3);
  assert.equal(solitudeIncome(s, 0), SOLITUDE_CAP);
});

test('AI raises a stupa where the mist is thin', () => {
  const { s, city } = setup();
  s.players[0].stars = 30;
  assert.ok(!hasMist(s, city));
  aiTurn(s);
  assert.ok(s.tiles.some((t) => t.improvement === 'stupa'), 'stupa built');
});

test('20-turn all-AI game with Tibet completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['tibet', 'japan', 'mongols'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 20 && guard++ < 1000) {
    aiTurn(s);
    endTurn(s);
  }
  assert.ok(s.turn >= 20 || s.over);
});

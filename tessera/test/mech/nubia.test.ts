import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { attackRange, doAction, tileActions, tileOwnerPlayer, trainCost } from '../../src/game/rules';
import { neighbors, tileAt } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { hookIncome } from '../../src/game/mech';
import { UNITS } from '../../src/data/units';
import {
  PYRAMID_BASE, PYRAMID_STEP, byPyramid, mech, pyramidCost, pyramidIncome, pyramidWhy, pyramids,
} from '../../src/game/mech/nubia';
import type { GameState, Tile } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 5, human: 'nubia', opponents: ['japan', 'mongols'], mode: 'perfection' });
  for (const p of s.players) p.explored.fill(true);
  const city = s.cities.find((c) => c.owner === 0 && c.capital)!;
  // clear the land round the capital so the tests control it: plain desert, no roads, no resources
  for (const t of s.tiles) {
    if (t.owner !== city.id || t.cityId !== null) continue;
    t.terrain = 'desert'; t.resource = null; t.improvement = null; t.road = false; t.village = false; t.ruin = false;
  }
  s.units = s.units.filter((u) => u.owner !== 0 || (u.x === city.x && u.y === city.y));
  return { s, city };
}

const freeTiles = (s: GameState, cid: number): Tile[] =>
  s.tiles.filter((t) => t.owner === cid && t.cityId === null && !s.units.some((u) => u.x === t.x && u.y === t.y));

test('Land of the Bow: Kush trains ranged units 1★ cheaper; others and non-ranged pay full', () => {
  const s = createGame({ seed: 7, human: 'nubia', opponents: ['japan', 'mongols'], mode: 'domination' });
  assert.equal(trainCost(s, 0, 'pitati'), UNITS.pitati.cost - 1, 'Pitati Archer');
  assert.equal(trainCost(s, 0, 'archer'), UNITS.archer.cost - 1, 'Archer');
  assert.equal(trainCost(s, 0, 'horsearcher'), UNITS.horsearcher.cost - 1, 'a mounted bowman is ranged too');
  assert.equal(trainCost(s, 1, 'archer'), UNITS.archer.cost, 'Japan pays full');
  assert.equal(trainCost(s, 2, 'archer'), UNITS.archer.cost, 'Mongols pay full for archers');
  for (const k of ['warrior', 'swordsman', 'rider', 'catapult', 'defender'] as const) {
    assert.equal(trainCost(s, 0, k), UNITS[k].cost, `${k}: no discount`);
  }
});

test('pyramid: raised by an action, cost grows by 2 for each one held', () => {
  const { s, city } = setup();
  const p = s.players[0];
  p.stars = 100;
  const tiles = freeTiles(s, city.id);
  const a = tiles[0];
  const act = tileActions(s, 0, a).find((x) => x.id === 'mech:pyramid');
  assert.ok(act && act.enabled, 'offered on free desert in the borders');
  assert.equal(act.cost, PYRAMID_BASE);
  assert.ok(doAction(s, 0, a, 'mech:pyramid'));
  assert.equal(a.improvement, 'pyramid');
  assert.equal(p.stars, 100 - PYRAMID_BASE);
  assert.equal(pyramidCost(s, 0), PYRAMID_BASE + PYRAMID_STEP);
  const b = tiles.find((t) => !pyramidWhy(s, 0, t))!;
  assert.equal(tileActions(s, 0, b).find((x) => x.id === 'mech:pyramid')!.cost, 8);
  assert.ok(doAction(s, 0, b, 'mech:pyramid'));
  assert.equal(pyramids(s, 0).length, 2);
  assert.equal(pyramidCost(s, 0), 10);
  JSON.parse(JSON.stringify(s));
});

test('pyramid: placement limits', () => {
  const { s, city } = setup();
  s.players[0].stars = 100;
  const a = freeTiles(s, city.id)[0];
  assert.ok(doAction(s, 0, a, 'mech:pyramid'));
  const next = neighbors(s, a.x, a.y).find((n) => n.owner === city.id && n.cityId === null)!;
  assert.match(pyramidWhy(s, 0, next)!, /close/);
  assert.equal(tileActions(s, 0, next).find((x) => x.id === 'mech:pyramid')?.enabled, false);
  const t = freeTiles(s, city.id).find((x) => !pyramidWhy(s, 0, x))!;
  t.terrain = 'forest';
  assert.ok(pyramidWhy(s, 0, t), 'not on forest');
  t.terrain = 'mountain';
  assert.ok(pyramidWhy(s, 0, t), 'not on a mountain');
  t.terrain = 'field';
  assert.equal(pyramidWhy(s, 0, t), null, 'field is fine');
  t.resource = 'fruit';
  assert.ok(pyramidWhy(s, 0, t), 'not on a resource');
  t.resource = null;
  t.improvement = 'farm';
  assert.ok(pyramidWhy(s, 0, t), 'not on an improvement');
  t.improvement = null;
  t.village = true;
  assert.ok(pyramidWhy(s, 0, t), 'not on a village');
  t.village = false;
  assert.ok(pyramidWhy(s, 0, tileAt(s, city.x, city.y)!), 'not on the city');
  const outside = s.tiles.find((x) => tileOwnerPlayer(s, x) === null && x.terrain === 'field' && !x.village)!;
  assert.match(pyramidWhy(s, 0, outside)!, /borders/);
  assert.ok(!doAction(s, 0, outside, 'mech:pyramid'));
  // only Kush raises them
  const japan = s.tiles.find((x) => tileOwnerPlayer(s, x) === 1 && x.cityId === null)!;
  assert.equal(tileActions(s, 1, japan).some((x) => x.id === 'mech:pyramid'), false);
});

test('pyramid income: +1★ a turn each', () => {
  const { s, city } = setup();
  s.players[0].stars = 100;
  const base = hookIncome(s, 0);
  assert.equal(pyramidIncome(s, 0), 0);
  const a = freeTiles(s, city.id)[0];
  assert.ok(doAction(s, 0, a, 'mech:pyramid'));
  assert.equal(pyramidIncome(s, 0), 1);
  assert.equal(hookIncome(s, 0), base + 1);
  const b = freeTiles(s, city.id).find((t) => !pyramidWhy(s, 0, t))!;
  assert.ok(doAction(s, 0, b, 'mech:pyramid'));
  assert.equal(hookIncome(s, 0), base + 2);
  assert.equal(pyramidIncome(s, 1), 0, 'other empires hold none');
});

test('high ground: ranged units on or beside a pyramid shoot 1 tile further; not siege or melee', () => {
  const { s, city } = setup();
  s.players[0].stars = 100;
  const a = freeTiles(s, city.id)[0];
  assert.ok(doAction(s, 0, a, 'mech:pyramid'));
  const beside = neighbors(s, a.x, a.y).find((n) => n.cityId === null && n.terrain !== 'ocean' && n.terrain !== 'shallow')!;
  const far = s.tiles.find((t) => !byPyramid(s, 0, t.x, t.y) && t.terrain === 'field')!;
  const range = (kind: Parameters<typeof spawnUnit>[1], owner: number, t: Tile) => {
    const u = spawnUnit(s, kind, owner, t.x, t.y, null);
    const r = attackRange(s, u);
    s.units = s.units.filter((e) => e !== u);
    return r;
  };
  assert.equal(range('pitati', 0, a), 3, 'on the pyramid');
  assert.equal(range('pitati', 0, beside), 3, 'beside it');
  assert.equal(range('archer', 0, beside), 3, 'a plain archer too');
  assert.equal(range('pitati', 0, far), 2, 'away from it');
  assert.equal(range('catapult', 0, beside), UNITS.catapult.range, 'no bonus for siege');
  assert.equal(range('warrior', 0, beside), 1, 'no bonus for melee');
  assert.equal(range('archer', 1, beside), 2, "an enemy archer gets no help from Kush's pyramid");
});

test('AI raises pyramids when it has stars to spare', () => {
  const { s } = setup();
  s.players[0].human = false;
  s.players[0].stars = 40;
  aiTurn(s);
  const n = pyramids(s, 0).length;
  assert.ok(n >= 1, 'built at least one');
  assert.ok(n <= 5, 'but only a few');
});

test('AI posts an idle archer beside a threatened pyramid', () => {
  const { s, city } = setup();
  s.players[0].human = false;
  s.players[0].stars = 0;
  const d = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
  // clear a quiet patch of open field round the capital
  s.units = s.units.filter((e) => d(e, city) > 7);
  for (const t of s.tiles) if (d(t, city) <= 6 && t.cityId === null) { t.terrain = 'field'; t.improvement = null; t.resource = null; t.village = false; t.ruin = false; }
  const a = neighbors(s, city.x, city.y).find((t) => t.cityId === null && !pyramidWhy(s, 0, t))!;
  a.improvement = 'pyramid';
  // an archer two tiles off the pyramid; a foe within 4 of the pyramid but beyond the archer's reach
  const spot = s.tiles.find((t) => d(t, a) === 2 && t.cityId === null && d(t, city) <= 6)!;
  const u = spawnUnit(s, 'pitati', 0, spot.x, spot.y, null);
  u.moved = false; u.attacked = false;
  assert.ok(!byPyramid(s, 0, u.x, u.y));
  const ft = s.tiles.find((t) => d(t, a) === 4 && d(t, u) >= 4 && t.cityId === null)!;
  spawnUnit(s, 'warrior', 1, ft.x, ft.y, null);
  s.players[0].met = [1]; s.players[1].met = [0];
  assert.ok(mech.ai!(s, 0), 'the AI acted');
  assert.ok(byPyramid(s, 0, u.x, u.y), `archer moved onto the high ground (${u.x},${u.y})`);
});

test('20-turn all-AI game with Kush completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['nubia', 'japan', 'mongols'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 20 && guard++ < 1000) {
    aiTurn(s);
    endTurn(s);
  }
  assert.ok(s.turn >= 20 || s.over);
  JSON.parse(JSON.stringify(s));
});

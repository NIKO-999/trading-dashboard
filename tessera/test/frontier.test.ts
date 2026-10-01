import assert from 'node:assert/strict';
import test from 'node:test';
import { FRONTIER_BASE, FRONTIER_PER_CITY, FRONTIER_STEP } from '../src/game/frontier';
import { area } from '../src/game/grid';
import { createGame, spawnUnit } from '../src/game/mapgen';
import { doAction, tileActions, tileOwnerPlayer } from '../src/game/rules';
import type { GameState, Tile } from '../src/game/types';

function board() {
  const s = createGame({ seed: 7, human: 'china', opponents: ['greeks'], mapSize: 'large', mode: 'onecity' });
  for (const t of s.tiles) { t.terrain = 'field'; t.resource = null; t.improvement = null; t.village = false; t.ruin = false; }
  s.units = [];
  s.players[0].stars = 100;
  return s;
}
/** An unclaimed tile `d` steps out from the capital's border, along a row. */
function outside(s: GameState, d: number): Tile {
  const c = s.cities.find((k) => k.owner === 0)!;
  const r = Math.max(...s.tiles.filter((t) => t.owner === c.id).map((t) => Math.abs(t.x - c.x)));
  const dir = c.x < s.size / 2 ? 1 : -1;
  return s.tiles[c.y * s.size + c.x + dir * (r + d)];
}

test('a frontier camp claims the land around it for the nearest city, even in One City', () => {
  const s = board();
  const [t, t2, t3] = [outside(s, 1), outside(s, 3), outside(s, 5)];
  assert.equal(t.owner, null);
  spawnUnit(s, 'warrior', 0, t.x, t.y, null).attacked = false;
  const a = tileActions(s, 0, t).find((x) => x.id === 'frontier')!;
  assert.ok(a.enabled && a.cost === FRONTIER_BASE);
  assert.ok(doAction(s, 0, t, 'frontier'));
  assert.equal(t.improvement, 'frontier');
  assert.ok(area(s, t.x, t.y, 1).every((x) => tileOwnerPlayer(s, x) === 0 || x.owner !== null));
  assert.equal(tileOwnerPlayer(s, t), 0);
  assert.equal(s.cities.filter((c) => c.owner === 0).length, 1, 'still one city');
  // the next costs more; a city holds at most FRONTIER_PER_CITY
  spawnUnit(s, 'warrior', 0, t2.x, t2.y, null).attacked = false;
  assert.equal(tileActions(s, 0, t2).find((x) => x.id === 'frontier')!.cost, FRONTIER_BASE + FRONTIER_STEP);
  assert.ok(doAction(s, 0, t2, 'frontier'));
  spawnUnit(s, 'warrior', 0, t3.x, t3.y, null).attacked = false;
  const third = tileActions(s, 0, t3).find((x) => x.id === 'frontier')!;
  assert.ok(!third.enabled && new RegExp(`${FRONTIER_PER_CITY} camps`).test(third.reason!));
});

test('no camp far from your borders', () => {
  const s = board();
  const t = outside(s, 5);
  spawnUnit(s, 'warrior', 0, t.x, t.y, null).attacked = false;
  assert.equal(tileActions(s, 0, t).find((x) => x.id === 'frontier'), undefined);
});

test('homestead needs no tech', () => {
  const s = board();
  const c = s.cities.find((k) => k.owner === 0)!;
  const t = s.tiles.find((x) => x.owner === c.id && x.cityId === null)!;
  s.players[0].techs = [];
  assert.ok(tileActions(s, 0, t).find((x) => x.id === 'homestead')!.enabled);
});

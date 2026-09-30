import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { attackOptions, doAction, moveOptions, moveUnit, tileActions } from '../../src/game/rules';
import { tileAt } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { unitVisibleTo } from '../../src/game/mech';
import { MAX_PAY, memOf } from '../../src/game/mech/aboriginal';
import type { GameState, Tile } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 5, human: 'aboriginal', opponents: ['japan'], mode: 'perfection', naturals: false }); // exact star counts: no Natural Wonder to discover (see test/naturals)
  // a stretch of 8 free tiles (no city or unit near), levelled into plain field for the test
  let spot: { x: number; y: number } | null = null;
  for (let y = 1; y < s.size - 1 && !spot; y++)
    for (let x = 0; x + 9 < s.size && !spot; x++)
      if (![...s.cities, ...s.units].some((e) => Math.abs(e.y - y) <= 1 && e.x >= x - 1 && e.x <= x + 10)) spot = { x, y };
  assert.ok(spot);
  for (let i = 0; i < 10; i++) {
    const t = tileAt(s, spot.x + i, spot.y)!;
    Object.assign(t, { terrain: 'field', resource: null, village: false, ruin: false, improvement: null });
    s.players[0].explored[spot.y * s.size + spot.x + i] = true;
  }
  return { s, spot, row: (i: number) => tileAt(s, spot!.x + i, spot!.y)! };
}

test('painting a Songline is an enabled tile action that costs stars and needs an explored tile', () => {
  const { s, row } = setup();
  s.players[0].stars = 5;
  const t = row(0);
  const act = tileActions(s, 0, t).find((a) => a.id === 'mech:songline');
  assert.ok(act && act.enabled);
  assert.ok(doAction(s, 0, t, 'mech:songline'));
  assert.equal(t.improvement, 'songline');
  assert.equal(s.players[0].stars, 5 - act.cost);
  assert.ok(tileActions(s, 0, t).some((a) => a.id === 'mech:unsong'));
  // unexplored tiles cannot be painted
  const far = s.tiles.find((x) => x.terrain === 'field' && !x.resource && !x.improvement && !s.players[0].explored[x.y * s.size + x.x])!;
  assert.ok(!tileActions(s, 0, far).some((a) => a.id === 'mech:songline'));
  assert.ok(doAction(s, 0, t, 'mech:unsong'));
  assert.equal(t.improvement, null);
  JSON.parse(JSON.stringify(s));
});

test('units cross Songlines for free', () => {
  const { s, spot, row } = setup();
  const u = spawnUnit(s, 'warrior', 0, spot.x, spot.y, null);
  u.moved = false;
  const before = moveOptions(s, u).find((o) => o.x === spot.x + 6 && o.y === spot.y);
  assert.ok(!before, 'six tiles is out of range normally');
  s.players[0].stars = 20;
  for (let i = 1; i <= 6; i++) assert.ok(doAction(s, 0, row(i), 'mech:songline'));
  const after = moveOptions(s, u).find((o) => o.x === spot.x + 6 && o.y === spot.y);
  assert.ok(after, 'reachable along the track');
});

test('a unit on a Songline is invisible to other empires only', () => {
  const { s, spot, row } = setup();
  const u = spawnUnit(s, 'warrior', 0, spot.x + 1, spot.y, null);
  const e = spawnUnit(s, 'warrior', 1, spot.x + 2, spot.y, null);
  e.attacked = false;
  s.players[1].explored[spot.y * s.size + spot.x + 1] = true;
  assert.ok(unitVisibleTo(s, 1, u));
  assert.ok(attackOptions(s, e).includes(u));
  row(1).improvement = 'songline';
  assert.ok(!unitVisibleTo(s, 1, u));
  assert.ok(unitVisibleTo(s, 0, u));
  assert.ok(!attackOptions(s, e).includes(u), 'cannot be targeted');
});

test('explored fog never re-covers over a whole game', () => {
  const s: GameState = createGame({ seed: 3, human: null, opponents: ['aboriginal', 'japan'], mode: 'perfection' });
  startTurn(s);
  const prev = s.players.map((p) => [...p.explored]);
  for (let g = 0; !s.over && s.turn < 15 && g < 1000; g++) {
    aiTurn(s); endTurn(s);
    s.players.forEach((p, i) => { p.explored.forEach((v, k) => { if (prev[i][k]) assert.ok(v, 'explored tile re-covered'); prev[i][k] = prev[i][k] || v; }); });
  }
});

function landmarkSetup() {
  const { s, spot } = setup();
  const stage = (t: Tile) => { t.terrain = 'mountain'; t.resource = null; t.data = { ...t.data, lm: 1 }; s.players[0].explored[t.y * s.size + t.x] = true; };
  const a = tileAt(s, spot.x, spot.y)!, b = tileAt(s, spot.x + 4, spot.y)!, c = tileAt(s, spot.x + 8, spot.y)!;
  for (const t of [a, b, c]) { t.cityId = null; t.village = false; t.ruin = false; t.improvement = null; stage(t); }
  return { s, a, b, c };
}

test('pilgrimage between distant landmarks pays stars by distance and grows the nearest city', () => {
  const { s, a, b, c } = landmarkSetup();
  s.players[0].techs.push('climbing');
  const u = spawnUnit(s, 'rider', 0, a.x, a.y, null);
  const city = s.cities.find((x) => x.owner === 0)!;
  const pop0 = city.pop + city.level * 100;
  const stars0 = s.players[0].stars;
  // first arrival: sets the origin, no payout, +1 pop for the new landmark
  const { afterMove } = require_mech();
  afterMove(s, 0, u, { x: 0, y: 0 }, a);
  assert.equal(s.players[0].stars, stars0);
  assert.equal(memOf(s, 0).reached.length, 1);
  assert.ok(city.pop + city.level * 100 > pop0);
  afterMove(s, 0, u, a, b); // 4 tiles
  assert.equal(s.players[0].stars, stars0 + 2);
  afterMove(s, 0, u, b, c); // 4 more
  assert.equal(s.players[0].stars, stars0 + 4);
  afterMove(s, 0, u, c, b); // straight back pays nothing
  assert.equal(s.players[0].stars, stars0 + 4);
  assert.equal(memOf(s, 0).trips, 2);
  assert.equal(memOf(s, 0).reached.length, 3);
  JSON.parse(JSON.stringify(s));
});

test('a real move onto a landmark triggers the pilgrimage', () => {
  const { s, a, c } = landmarkSetup();
  s.players[0].techs.push('climbing');
  const u = spawnUnit(s, 'rider', 0, c.x - 1, c.y, null);
  u.data = { last: { x: a.x, y: a.y } };
  u.moved = false;
  const stars0 = s.players[0].stars;
  assert.ok(moveUnit(s, u, c.x, c.y));
  assert.equal(s.players[0].stars, stars0 + Math.min(MAX_PAY, 4)); // 8 tiles: floor(8/2), capped at MAX_PAY
});

import { mech } from '../../src/game/mech/aboriginal';
function require_mech() { return mech as Required<typeof mech>; }

test('20-turn all-AI game with Aboriginal completes and the AI paints and makes pilgrimages', () => {
  let painted = 0, trips = 0;
  for (const seed of [11, 4, 7]) {
    const s: GameState = createGame({ seed, human: null, opponents: ['aboriginal', 'japan', 'mongols'], mode: 'perfection' });
    startTurn(s);
    let guard = 0;
    while (!s.over && s.turn < 20 && guard++ < 1000) { aiTurn(s); endTurn(s); }
    assert.ok(s.turn >= 20 || s.over);
    const pid = s.players.findIndex((p) => p.tribe === 'aboriginal');
    painted += memOf(s, pid).painted;
    trips += memOf(s, pid).trips;
    JSON.parse(JSON.stringify(s));
  }
  assert.ok(painted > 0, 'AI paints Songlines');
  assert.ok(trips > 0, 'AI completes a pilgrimage');
});

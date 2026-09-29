import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { citiesOf, doAction, income, moveOptions, moveUnit, techCost, tileActions } from '../../src/game/rules';
import { tileAt } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { hookCityCaptured, hookIncome } from '../../src/game/mech';
import { endTurn, startTurn } from '../../src/game/turn';
import { MOURNING_TURNS, TREASURY, WALL_COST, activeWall, chinaState, improvedTiles, isBorder, isWall, mandate, mandateIncome } from '../../src/game/mech/china';
import type { GameState, Tile } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 5, human: 'china', opponents: ['japan'], mapSize: 'huge', mode: 'perfection' });
  for (const p of s.players) p.explored.fill(true);
  const city = s.cities.find((c) => c.owner === 0)!;
  return { s, city };
}

/** A clean, china-owned field tile. */
function own(s: GameState, x: number, y: number): Tile {
  const cid = s.cities.find((c) => c.owner === 0)!.id;
  const t = tileAt(s, x, y)!;
  t.terrain = 'field'; t.resource = null; t.improvement = null; t.cityId = null; t.village = false; t.ruin = false; t.owner = cid; delete t.data;
  s.units = s.units.filter((e) => !(e.x === x && e.y === y));
  return t;
}
const wall = (s: GameState, x: number, y: number) => { const t = own(s, x, y); t.improvement = 'wall'; t.data = { wall: 0 }; return t; };
const ready = (s: GameState) => { for (const u of s.units) { u.moved = false; u.attacked = false; } };
const wild = (s: GameState, x: number, y: number) => { const t = own(s, x, y); t.owner = null; return t; };

test('a wall can be raised on a border tile through the tile menu', () => {
  const { s } = setup();
  own(s, 10, 10); wild(s, 11, 10); wild(s, 9, 10); own(s, 10, 9); own(s, 10, 11);
  s.players[0].stars = 5;
  const t = tileAt(s, 10, 10)!;
  assert.ok(isBorder(s, 0, t));
  const act = tileActions(s, 0, t).find((a) => a.id === 'mech:wall');
  assert.ok(act && act.enabled);
  assert.ok(doAction(s, 0, t, 'mech:wall'));
  assert.equal(s.players[0].stars, 5 - WALL_COST);
  assert.ok(isWall(t) && activeWall(s, t, 0));
  assert.equal(chinaState(s, 0).built, 1);
  // an inland tile has no wall action
  const inland = own(s, 3, 3);
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) own(s, 3 + dx, 3 + dy);
  assert.ok(!tileActions(s, 0, inland).some((a) => a.id === 'mech:wall'));
  JSON.parse(JSON.stringify(s));
});

test('enemy land units cannot cross the wall, siege can and breaches it', () => {
  const { s } = setup();
  for (let y = 8; y <= 12; y++) for (let x = 8; x <= 12; x++) wild(s, x, y);
  const w = wall(s, 10, 10);
  const foe = spawnUnit(s, 'warrior', 1, 9, 10, null);
  ready(s);
  assert.ok(!moveOptions(s, foe).some((o) => o.x === 10 && o.y === 10));
  const mine = spawnUnit(s, 'warrior', 0, 11, 10, null);
  ready(s);
  assert.ok(moveOptions(s, mine).some((o) => o.x === 10 && o.y === 10)); // own units pass
  assert.ok(!moveUnit(s, foe, 10, 10));
  const siege = spawnUnit(s, 'catapult', 1, 9, 11, null);
  ready(s);
  assert.ok(moveOptions(s, siege).some((o) => o.x === 10 && o.y === 10));
  assert.ok(moveUnit(s, siege, 10, 10));
  assert.ok(!isWall(w));
  assert.equal(chinaState(s, 0).breached, 1);
});

test('linked wall tiles also close the diagonal gap', () => {
  const { s } = setup();
  for (let y = 8; y <= 12; y++) for (let x = 8; x <= 12; x++) wild(s, x, y);
  wall(s, 10, 9); wall(s, 9, 10);
  const foe = spawnUnit(s, 'warrior', 1, 9, 9, null);
  ready(s);
  assert.ok(!moveOptions(s, foe).some((o) => o.x === 10 && o.y === 10));
  s.tiles[10 * s.size + 9].improvement = null; // open one segment: the diagonal is free again
  assert.ok(moveOptions(s, foe).some((o) => o.x === 10 && o.y === 10));
});

test('Mandate of Heaven: +1 star per improved tile, none when mourning, half income when invaded', () => {
  const { s } = setup();
  const farms = [own(s, 4, 13), own(s, 5, 13), own(s, 6, 13)];
  for (const t of farms) t.improvement = 'farm';
  const wallT = wall(s, 7, 13);
  assert.equal(improvedTiles(s, 0), 3); // walls do not count
  assert.equal(mandate(s, 0), 'blessed');
  assert.equal(mandateIncome(s, 0), 3);
  assert.equal(hookIncome(s, 0), 3 + TREASURY * citiesOf(s, 0).length);
  const base = income(s, 0);
  spawnUnit(s, 'explorer', 1, 4, 14, null); // explorers do not invade
  assert.equal(mandate(s, 0), 'blessed');
  own(s, 5, 14);
  spawnUnit(s, 'warrior', 1, 5, 14, null);
  assert.equal(mandate(s, 0), 'invaded');
  assert.equal(mandateIncome(s, 0), -Math.floor(base / 2));
  assert.ok(wallT);
  // paid through the real turn start
  s.current = 0; s.turn = 3; s.players[0].stars = 0;
  startTurn(s);
  assert.equal(s.players[0].stars, base - Math.floor(base / 2));
});

test('losing a city triggers a Dynastic Shift: tech refund and mandate reset', () => {
  const { s, city } = setup();
  const p = s.players[0];
  p.techs = ['gathering', 'hunting', 'farming'];
  const tile = own(s, 4, 13); tile.improvement = 'farm';
  const before = p.stars;
  s.turn = 4;
  hookCityCaptured(s, city, 0); // the hook is told the city changed hands, from player 0
  assert.equal(p.stars, before + techCost(s, 0, 'farming'));
  const m = chinaState(s, 0);
  assert.equal(m.shifts, 1);
  assert.deepEqual(m.refunded, ['farming']);
  assert.equal(mandate(s, 0), 'mourning');
  assert.equal(mandateIncome(s, 0), 0);
  hookCityCaptured(s, city, 0); // a second loss refunds the next most recent tech
  assert.deepEqual(m.refunded, ['farming', 'hunting']);
  s.turn = 4 + MOURNING_TURNS;
  assert.equal(mandate(s, 0), 'blessed');
  assert.equal(mandateIncome(s, 0), 1);
  hookCityCaptured(s, city, 1); // capturing someone else's city changes nothing
  assert.equal(m.shifts, 2);
  JSON.parse(JSON.stringify(s));
});

test('the AI raises walls', () => {
  const { s } = setup();
  const t = own(s, 10, 10); wild(s, 11, 10); own(s, 10, 9);
  s.players[0].stars = 10;
  s.current = 0;
  let built = 0;
  for (let i = 0; i < 20 && s.players[0].stars >= 5; i++) { if (!(s.players[0].tribe === 'china') || !aiStep(s)) break; built++; }
  assert.ok(built > 0);
  assert.ok(chinaState(s, 0).built > 0);
  assert.ok(t);
});

import { aiStep } from '../../src/game/ai';

test('20-turn all-AI game with China completes and the wall is used', () => {
  let built = 0;
  for (const seed of [11, 12, 13]) {
    const s: GameState = createGame({ seed, human: null, opponents: ['china', 'japan', 'mongols'], mode: 'perfection' });
    startTurn(s);
    let guard = 0;
    while (!s.over && s.turn < 20 && guard++ < 1000) { aiTurn(s); endTurn(s); }
    assert.ok(s.turn >= 20 || s.over);
    for (const p of s.players) if (p.tribe === 'china') built += chinaState(s, p.id).built;
    JSON.parse(JSON.stringify(s));
  }
  assert.ok(built > 0, 'the AI built at least one wall segment');
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aiTurn } from '../src/game/ai.ts';
import { drain } from '../src/game/events.ts';
import { isLand, isWater, tileAt } from '../src/game/grid.ts';
import { createGame } from '../src/game/mapgen.ts';
import { applyReward, attack, cityIncome, citiesOf, def, defenseBonus, doAction, maxHp, moveOptions, moveUnit, score, tileActions } from '../src/game/rules.ts';
import { spawnUnit } from '../src/game/mapgen.ts';
import { endTurn, startTurn } from '../src/game/turn.ts';
import { TRIBE_IDS } from '../src/data/tribes.ts';
import type { GameState } from '../src/game/types.ts';

function checkInvariants(s: GameState) {
  const seen = new Set<string>();
  for (const u of s.units) {
    const k = `${u.x},${u.y}`;
    assert.ok(!seen.has(k), `two units stacked on ${k}`);
    seen.add(k);
    const t = tileAt(s, u.x, u.y)!;
    assert.ok(t, 'unit off the map');
    if (def(u).naval) assert.ok(isWater(t), `${u.kind} on land at ${k}`);
    else if (!def(u).skills.includes('amphibious')) assert.ok(isLand(t) || t.improvement === 'port', `${u.kind} in water at ${k}`);
    assert.ok(u.hp > 0, 'dead unit left on the board');
  }
  for (const p of s.players) assert.ok(p.stars >= 0, `${p.tribe} has negative stars`);
  for (const c of s.cities) assert.ok(c.pop >= 0 && c.level >= 1);
}

for (const seed of [1, 7, 42, 1234, 99999]) {
  test(`5-empire AI game, seed ${seed}, runs 30 turns cleanly`, () => {
    const s = createGame({ seed, human: null, opponents: [...TRIBE_IDS], mode: 'perfection' });
    startTurn(s);
    let guard = 0;
    while (!s.over && guard++ < 1000) {
      aiTurn(s);
      checkInvariants(s);
      endTurn(s);
      drain();
    }
    assert.ok(s.over, 'game should end by the turn limit');
    const grew = s.cities.some((c) => c.level >= 3);
    assert.ok(grew, 'at least one city should reach level 3');
    const totalCities = s.cities.length;
    assert.ok(totalCities > 5, 'villages should get captured');
    const summary = s.players.map((p) => `${p.tribe}:${score(s, p.id)}/${citiesOf(s, p.id).length}c/${p.techs.length}t`).join(' ');
    console.log(`seed ${seed} winner=${s.players[s.winner!].tribe} ${summary}`);
  });
}

test('huge 5-empire map runs 30 AI turns cleanly', () => {
  const s = createGame({ seed: 77, human: null, opponents: [...TRIBE_IDS], mode: 'perfection', mapSize: 'huge' });
  assert.equal(s.size, 26);
  startTurn(s);
  let guard = 0;
  const t0 = Date.now();
  while (!s.over && guard++ < 1000) {
    aiTurn(s);
    checkInvariants(s);
    endTurn(s);
    drain();
  }
  assert.ok(s.over);
  console.log(`huge map: ${s.cities.length} cities, ${s.units.length} units, ${Date.now() - t0}ms`);
});

test('pass & play seats several humans and ends when every human is gone', () => {
  const s = createGame({ seed: 5, human: null, humans: ['rome', 'egypt'], opponents: ['pirates'], mode: 'domination' });
  assert.deepEqual(s.players.map((p) => p.human), [true, true, false]);
  startTurn(s);
  // humans take their turns too (driven by the AI here), and the game keeps going between them
  for (let i = 0; i < 9 && !s.over; i++) {
    aiTurn(s);
    endTurn(s);
    drain();
  }
  // wiping out both human empires ends the game even though an AI is still alive
  for (const p of s.players.filter((q) => q.human)) {
    s.cities = s.cities.filter((c) => c.owner !== p.id);
    for (const t of s.tiles) if (t.owner !== null && !s.cities.some((c) => c.id === t.owner)) t.owner = null;
  }
  endTurn(s);
  assert.ok(s.over, 'game should end once every human empire is gone');
});

test('pirates get their Sea Raiders bonus on the water', () => {
  const s = createGame({ seed: 11, human: 'pirates', opponents: ['rome'], mode: 'domination' });
  const cap = citiesOf(s, 0)[0];
  const ring = s.tiles.filter((t) => Math.max(Math.abs(t.x - cap.x), Math.abs(t.y - cap.y)) === 1);
  // use a bare shallow tile next to the capital (the starting fish sit on the others)
  const shore = ring.find((t) => t.terrain === 'shallow' && !t.resource) ?? ring.find((t) => t.cityId === null && !t.village)!;
  shore.terrain = 'shallow';
  shore.resource = null;
  shore.improvement = null;
  s.players[0].stars = 50;
  const port = tileActions(s, 0, shore).find((a) => a.id === 'port')!;
  assert.equal(port.cost, 4, 'pirate ports are cheaper');
  const before = cityIncome(s, cap);
  assert.ok(doAction(s, 0, shore, 'port'));
  assert.equal(cityIncome(s, cap), before + 1, 'each pirate port pays +1 star');
  // a pirate canoe moves 3 tiles; a Roman one would move 2
  for (const t of s.tiles) { t.terrain = 'shallow'; t.cityId = null; t.village = false; t.ruin = false; }
  s.players[0].explored.fill(true);
  s.players[1].explored.fill(true);
  s.units = [];
  const mine = spawnUnit(s, 'boat', 0, 5, 5, null);
  const theirs = spawnUnit(s, 'boat', 1, 5, 9, null);
  mine.moved = theirs.moved = false;
  const reach = (u: typeof mine) => Math.max(...moveOptions(s, u).map((o) => Math.max(Math.abs(o.x - u.x), Math.abs(o.y - u.y))));
  assert.equal(reach(mine), 3);
  assert.equal(reach(theirs), 2);
});

test('a farm or a mine can only be built once on a tile', () => {
  const s = createGame({ seed: 5, human: 'egypt', opponents: ['rome'], mode: 'domination' });
  const cap = citiesOf(s, 0)[0];
  const ring = s.tiles.filter((t) => Math.max(Math.abs(t.x - cap.x), Math.abs(t.y - cap.y)) === 1 && t.cityId === null && !t.village);
  const [field, hill] = ring;
  Object.assign(field, { terrain: 'field', resource: 'crop', improvement: null, road: false });
  Object.assign(hill, { terrain: 'mountain', resource: 'ore', improvement: null, road: false });
  s.players[0].techs.push('farming', 'climbing', 'mining');
  s.players[0].stars = 100;
  for (const [t, id] of [[field, 'farm'], [hill, 'mine']] as const) {
    assert.ok(doAction(s, 0, t, id), `the first ${id} gets built`);
    assert.equal(t.improvement, id);
    assert.ok(!tileActions(s, 0, t).some((a) => a.id === id), `no second ${id} is offered on the same tile`);
    assert.equal(doAction(s, 0, t, id), false, `a second ${id} can't be bought`);
  }
});

/** A small two-empire game with the capital's neighbours cleared to plain fields. */
function sandbox() {
  const s = createGame({ seed: 21, human: 'rome', opponents: ['egypt'], mode: 'domination' });
  const cap = citiesOf(s, 0)[0];
  const ring = s.tiles.filter((t) => Math.max(Math.abs(t.x - cap.x), Math.abs(t.y - cap.y)) === 1);
  for (const t of ring) Object.assign(t, { terrain: 'field', resource: null, improvement: null, village: false, ruin: false, road: false });
  s.units = s.units.filter((u) => u.owner !== 0);
  for (const c of s.cities) c.units = 0;
  s.players[0].explored.fill(true);
  s.players[1].explored.fill(true);
  return { s, cap, ring };
}

test('boarding and leaving a boat keeps a unit\'s health as it is', () => {
  const { s, cap, ring } = sandbox();
  const land = ring.find((t) => t.x === cap.x || t.y === cap.y)!;
  const port = ring.find((t) => t !== land && Math.max(Math.abs(t.x - land.x), Math.abs(t.y - land.y)) === 1)!;
  Object.assign(port, { terrain: 'shallow', improvement: 'port' });
  const u = spawnUnit(s, 'defender', 0, land.x, land.y, null);
  u.hp = 12;
  for (let trip = 0; trip < 4; trip++) {
    u.moved = u.attacked = false;
    assert.ok(moveUnit(s, u, port.x, port.y), 'boards at the port');
    assert.equal(u.hp, 12);
    assert.equal(maxHp(u), 15, 'a boat has its passenger\'s full health');
    u.moved = u.attacked = false;
    assert.ok(moveUnit(s, u, land.x, land.y), 'lands again');
    assert.equal(u.kind, 'defender');
    assert.equal(u.hp, 12, 'no health gained or lost on the round trip');
  }
});

test('Grand Gardens add a star of income even with a workshop', () => {
  const { s, cap } = sandbox();
  applyReward(s, cap, 'workshop');
  const before = cityIncome(s, cap);
  cap.pendingRewards = [5];
  applyReward(s, cap, 'park');
  assert.equal(cityIncome(s, cap), before + 1);
});

test('units with Escape can move again after attacking, even if they moved first', () => {
  const { s, cap } = sandbox();
  s.players[0].techs.push('riding');
  const rider = spawnUnit(s, 'rider', 0, cap.x + 2, cap.y, null);
  const foe = spawnUnit(s, 'warrior', 1, cap.x + 4, cap.y, null);
  for (const t of s.tiles) if (Math.abs(t.y - cap.y) <= 1 && t.x > cap.x) Object.assign(t, { terrain: 'field', cityId: null, village: false, ruin: false });
  rider.moved = rider.attacked = false;
  assert.ok(moveUnit(s, rider, cap.x + 3, cap.y), 'rider moves up');
  assert.ok(attack(s, rider, foe), 'then attacks');
  assert.ok(moveOptions(s, rider).length > 0, 'and can still retreat');
  const warrior = spawnUnit(s, 'warrior', 0, cap.x + 3, cap.y + 1, null);
  warrior.moved = warrior.attacked = false;
  if (s.units.includes(foe)) {
    assert.ok(attack(s, warrior, foe));
    assert.equal(moveOptions(s, warrior).length, 0, 'a unit without Escape stops after attacking');
  }
});

test('only units that can fortify get the city defence bonus', () => {
  const { s, cap } = sandbox();
  const w = spawnUnit(s, 'warrior', 0, cap.x, cap.y, null);
  assert.equal(defenseBonus(s, w), 1.5);
  s.units = s.units.filter((u) => u !== w);
  const sw = spawnUnit(s, 'swordsman', 0, cap.x, cap.y, null);
  assert.ok(!def(sw).skills.includes('fortify'));
  assert.equal(defenseBonus(s, sw), 1);
});

test('nothing can be harvested under an enemy unit', () => {
  const { s, ring } = sandbox();
  const fruit = ring[0];
  fruit.resource = 'fruit';
  s.players[0].techs.push('gathering');
  s.players[0].stars = 20;
  assert.ok(tileActions(s, 0, fruit).some((a) => a.id === 'harvest' && a.enabled));
  spawnUnit(s, 'warrior', 1, fruit.x, fruit.y, null);
  assert.ok(!tileActions(s, 0, fruit).some((a) => a.id === 'harvest'));
  assert.equal(doAction(s, 0, fruit, 'harvest'), false);
});

test('Recover heals 4 HP at home and 2 away', () => {
  const { s, cap, ring } = sandbox();
  const home = spawnUnit(s, 'warrior', 0, ring[0].x, ring[0].y, null);
  home.hp = 3;
  home.moved = home.attacked = false;
  assert.ok(doAction(s, 0, ring[0], 'recover'));
  assert.equal(home.hp, 7);
  const far = s.tiles.find((t) => t.owner === null && t.terrain === 'field' && !t.village && !t.ruin && t.cityId === null && !s.units.some((u) => u.x === t.x && u.y === t.y) && Math.max(Math.abs(t.x - cap.x), Math.abs(t.y - cap.y)) > 3)!;
  const away = spawnUnit(s, 'warrior', 0, far.x, far.y, null);
  away.hp = 3;
  away.moved = away.attacked = false;
  assert.ok(doAction(s, 0, far, 'recover'));
  assert.equal(away.hp, 5);
});

test('capturing the last rival city ends the game at once, and the captor joins that city', () => {
  const { s, cap } = sandbox();
  const theirs = citiesOf(s, 1)[0];
  s.units = s.units.filter((u) => u.owner !== 1);
  const u = spawnUnit(s, 'warrior', 0, theirs.x, theirs.y, cap.id);
  cap.units = 1;
  u.moved = u.attacked = false;
  assert.ok(doAction(s, 0, tileAt(s, theirs.x, theirs.y)!, 'capture'));
  assert.equal(theirs.owner, 0);
  assert.equal(u.homeCity, theirs.id, 'the captor now belongs to the captured city');
  assert.equal(cap.units, 0, 'its old city slot is free again');
  assert.equal(theirs.units, 1);
  assert.equal(s.players[1].alive, false);
  assert.equal(s.over, true, 'victory is declared straight away');
  assert.equal(s.winner, 0);
});

test('every empire gets its starting tech, unique unit and capital', () => {
  for (const tribe of TRIBE_IDS) {
    const s = createGame({ seed: 3, human: tribe, opponents: TRIBE_IDS.filter((t) => t !== tribe).slice(0, 1), mode: 'domination' });
    const me = s.players[0];
    assert.equal(citiesOf(s, 0).length, 1);
    assert.equal(me.techs.length, 1);
    const cap = citiesOf(s, 0)[0];
    assert.equal(tileAt(s, cap.x, cap.y)!.terrain, 'field');
    assert.equal(s.units.filter((u) => u.owner === 0).length, 1);
  }
});

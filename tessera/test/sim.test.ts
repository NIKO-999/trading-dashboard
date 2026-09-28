import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aiTurn } from '../src/game/ai.ts';
import { drain } from '../src/game/events.ts';
import { isLand, isWater, tileAt } from '../src/game/grid.ts';
import { createGame } from '../src/game/mapgen.ts';
import { cityIncome, citiesOf, def, doAction, moveOptions, score, tileActions } from '../src/game/rules.ts';
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

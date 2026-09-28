import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aiTurn } from '../src/game/ai.ts';
import { drain } from '../src/game/events.ts';
import { isLand, isWater, tileAt } from '../src/game/grid.ts';
import { createGame } from '../src/game/mapgen.ts';
import { citiesOf, def, score } from '../src/game/rules.ts';
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

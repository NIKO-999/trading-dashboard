import assert from 'node:assert/strict';
import test from 'node:test';
import { TRIBE_IDS } from '../src/data/tribes';
import { aiTurn } from '../src/game/ai';
import { drain } from '../src/game/events';
import { tileAt } from '../src/game/grid';
import { createGame, spawnUnit } from '../src/game/mapgen';
import { doAction, RAZE_SCORE, tileActions } from '../src/game/rules';
import { endTurn, startTurn } from '../src/game/turn';
import type { TribeId } from '../src/game/types';

const oneCity = (me: TribeId = 'rome', foes: TribeId[] = ['vikings'], seed = 7) =>
  createGame({ seed, human: me, opponents: foes, mode: 'onecity' });

test('One City: no villages on the map, and a 30-turn limit', () => {
  const s = oneCity('rome', ['vikings', 'greeks', 'zulu']);
  assert.equal(s.tiles.filter((t) => t.village).length, 0);
  assert.equal(s.cities.length, 4);
  assert.equal(s.maxTurns, 30);
});

test('One City: a Voyager, a Great Waka or a sea-city cannot found a new city', () => {
  for (const tribe of ['polynesia', 'pirates', 'rome'] as TribeId[]) {
    const s = oneCity(tribe);
    s.players[0].stars = 999;
    for (const t of s.tiles) for (const a of tileActions(s, 0, t)) {
      if (a.id === 'mech:waka' || a.id === 'mech:found' || a.id.startsWith('role:outpost:')) assert.ok(!a.enabled, `${tribe}: ${a.id} is barred`);
    }
  }
});

test('One City: capturing a rival capital razes it and knocks the empire out', () => {
  const s = oneCity('rome', ['vikings', 'greeks']);
  const foe = s.cities.find((c) => c.owner === 1)!;
  const t = tileAt(s, foe.x, foe.y)!;
  s.units = s.units.filter((u) => !(u.x === t.x && u.y === t.y));
  const u = spawnUnit(s, 'warrior', 0, t.x, t.y, null);
  u.moved = u.attacked = false;
  const before = s.players[0].bonusScore;
  assert.ok(doAction(s, 0, t, 'capture'));
  drain();
  assert.ok(!s.cities.some((c) => c.id === foe.id), 'the city is gone');
  assert.equal(s.cities.filter((c) => c.owner === 0).length, 1, 'the conqueror still has one city');
  assert.equal(t.cityId, null);
  assert.ok(!s.tiles.some((x) => x.owner === foe.id), 'its lands are unclaimed');
  assert.equal(s.players[0].bonusScore - before, RAZE_SCORE);
  assert.ok(!s.players[1].alive, 'the razed empire is out');
});

test('One City: AI games keep every empire at one city at most and end by turn 30', () => {
  for (let seed = 1; seed <= 6; seed++) {
    const four = TRIBE_IDS.slice(seed * 3, seed * 3 + 4) as TribeId[];
    const s = createGame({ seed, human: null, opponents: four, mode: 'onecity' });
    startTurn(s);
    let guard = 0;
    while (!s.over && guard++ < 1000) {
      aiTurn(s);
      for (const p of s.players) assert.ok(s.cities.filter((c) => c.owner === p.id).length <= 1, `seed ${seed}: ${p.tribe} has more than one city`);
      endTurn(s);
      drain();
    }
    assert.ok(s.over && s.turn <= 30, `seed ${seed}: game over by turn 30 (turn ${s.turn})`);
  }
});

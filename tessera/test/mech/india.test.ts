import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame } from '../../src/game/mapgen';
import { spawnUnit } from '../../src/game/mapgen';
import { aiTurn } from '../../src/game/ai';
import { endTurn, startTurn } from '../../src/game/turn';
import { removeUnit } from '../../src/game/rules';
import { hookIncome, hookStat } from '../../src/game/mech';
import { karmaOf } from '../../src/game/mech/india';

const setup = () => createGame({ seed: 4, human: 'india', opponents: ['rome'], mode: 'domination' });

test('unprovoked kill costs karma, provoked kill builds it and summons an elephant', () => {
  const s = setup();
  const ind = s.players.findIndex((p) => p.tribe === 'india');
  const foe = 1 - ind;
  assert.equal(karmaOf(s, ind), 0);
  // far from any border: unprovoked
  const far = s.tiles.find((t) => t.owner === null && t.terrain === 'field' && !t.cityId)!;
  const killer = spawnUnit(s, 'warrior', ind, far.x, far.y, null);
  const v1 = spawnUnit(s, 'warrior', foe, far.x, far.y, null);
  removeUnit(s, v1, killer);
  assert.equal(karmaOf(s, ind), -1);
  // provoked (attacked us) with wildlife nearby
  const spot = s.tiles.find((t) => t.terrain === 'field' && !t.cityId && !t.resource && t.owner === null)!;
  const animal = s.tiles.find((t) => t.x === spot.x + 1 && t.y === spot.y) ?? spot;
  animal.resource = 'animal';
  const v2 = spawnUnit(s, 'warrior', foe, spot.x, spot.y, null);
  v2.data = { aggr: ind };
  const k2 = spawnUnit(s, 'warrior', ind, spot.x, spot.y, null);
  const before = s.units.filter((u) => u.kind === 'elephant' && u.owner === ind).length;
  removeUnit(s, v2, k2);
  assert.equal(karmaOf(s, ind), 0);
  assert.equal(s.units.filter((u) => u.kind === 'elephant' && u.owner === ind).length, before + 1);
  assert.equal(animal.resource, null);
  JSON.stringify(s);
});

test('karma modifies income and attack', () => {
  const s = setup();
  const ind = s.players.findIndex((p) => p.tribe === 'india');
  const u = s.units.find((x) => x.owner === ind)!;
  s.players[ind].mech = { karma: 9 };
  assert.equal(hookIncome(s, ind), 2);
  assert.equal(hookStat(s, u, 'atk'), 0.5);
  s.players[ind].mech = { karma: -4 };
  assert.equal(hookIncome(s, ind), -1);
  assert.equal(hookStat(s, u, 'atk'), -0.5);
});

test('20-turn all-AI game with India completes', () => {
  const s = createGame({ seed: 11, human: null, opponents: ['india', 'rome', 'zulu'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn <= 20 && guard++ < 500) { aiTurn(s); endTurn(s); }
  assert.ok(s.turn > 20 || s.over);
});

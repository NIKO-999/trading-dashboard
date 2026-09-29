import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { doAction, income, tileActions, trainCost } from '../../src/game/rules';
import { hookIncome } from '../../src/game/mech';
import { tileAt } from '../../src/game/grid';
import { createGame } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { isCaravan, mech, payout, state } from '../../src/game/mech/mali';
import type { GameState } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 5, human: 'mali', opponents: ['japan'], mode: 'perfection' });
  s.players[0].stars = 50;
  s.players[1].stars = 50;
  const mine = s.cities.find((c) => c.owner === 0)!;
  const theirs = s.cities.find((c) => c.owner === 1)!;
  for (const c of s.cities) {
    for (const u of s.units.filter((e) => e.x === c.x && e.y === c.y)) { s.units.splice(s.units.indexOf(u), 1); c.units = Math.max(0, c.units - 1); }
  }
  s.players[0].explored.fill(true);
  return { s, mine, theirs };
}

test('flood market: enabled on a foreign city, doubles cost and pauses training', () => {
  const { s, theirs } = setup();
  const tt = tileAt(s, theirs.x, theirs.y)!;
  const act = tileActions(s, 0, tt).find((a) => a.id === 'mech:flood-market');
  assert.ok(act?.enabled);
  const base = trainCost(s, 1, 'warrior');
  const stars = s.players[0].stars;
  assert.ok(doAction(s, 0, tt, 'mech:flood-market'));
  assert.equal(s.players[0].stars, stars - act.cost);
  assert.equal(trainCost(s, 1, 'warrior'), base * 2);
  const trainOf = () => tileActions(s, 1, tt).find((a) => a.id.startsWith('train:'))!;
  assert.ok(!trainOf().enabled);
  assert.match(trainOf().reason ?? '', /inflation/i);
  assert.ok(!tileActions(s, 0, tt).find((a) => a.id === 'mech:flood-market')!.enabled, 'no double flooding');
  s.turn += 1; // Japan plays after Mali: its turns T and T+1 are halted
  assert.ok(!trainOf().enabled);
  s.turn += 1;
  assert.ok(trainOf().enabled);
  assert.equal(trainCost(s, 1, 'warrior'), base * 2);
  s.turn += 3;
  assert.equal(trainCost(s, 1, 'warrior'), base);
  JSON.parse(JSON.stringify(s));
});

test('caravan tolls: paid from foreign/neutral tiles only, via income', () => {
  const { s, mine } = setup();
  const ct = tileAt(s, mine.x, mine.y)!;
  const a = tileActions(s, 0, ct).find((x) => x.id === 'mech:caravan');
  assert.ok(a?.enabled);
  assert.ok(doAction(s, 0, ct, 'mech:caravan'));
  const u = s.units.find(isCaravan)!;
  assert.equal(payout(u), 0);
  const spot = s.tiles.find((t) => t.terrain === 'field' && t.owner === null && t.cityId === null && !s.units.some((e) => e.x === t.x && e.y === t.y))!;
  mech.afterMove!(s, 0, u, { x: spot.x - 2, y: spot.y }, spot);
  const before = payout(u);
  assert.ok(before >= 1);
  assert.equal(hookIncome(s, 0), before);
  const st = s.players[0].stars;
  s.current = 0; s.turn = 1;
  const inc = income(s, 0) + hookIncome(s, 0);
  startTurn(s);
  assert.equal(s.players[0].stars, st + inc);
  assert.equal(payout(u), 0);
  assert.equal(state(s).tolls, before);
  const own = s.tiles.find((t) => t.owner === mine.id && t.cityId === null)!;
  mech.afterMove!(s, 0, u, { x: own.x, y: own.y }, own);
  assert.equal(payout(u), 0);
  JSON.parse(JSON.stringify(s));
});

test('AI uses both parts; all-AI game completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['mali', 'japan', 'mongols'], mode: 'perfection' });
  startTurn(s);
  let guard = 0, cars = 0;
  while (!s.over && s.turn < 30 && guard++ < 1000) { aiTurn(s); cars = Math.max(cars, s.units.filter(isCaravan).length); endTurn(s); }
  assert.ok(s.turn >= 30 || s.over);
  assert.ok(cars > 0, 'AI raised caravans');
  assert.ok(state(s).tolls > 0, 'tolls were paid');
  assert.ok(state(s).floods > 0, 'AI flooded a market');
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { drain } from '../src/game/events';
import { REQ_BASE, REQ_STEP, stockOf } from '../src/game/goods';
import { tileAt } from '../src/game/grid';
import { createGame, spawnUnit } from '../src/game/mapgen';
import { doAction, removeUnit, tileActions } from '../src/game/rules';
import { startTurn } from '../src/game/turn';

const game = () => createGame({ seed: 7, human: 'rome', opponents: ['greeks'], mode: 'perfection' });

test('royal stables and forges: the capital adds iron and horses from the Classical era', () => {
  const s = game();
  const p = s.players[0];
  p.era = { n: 1, snap: { sparks: 0, kills: 0, levels: 0, wonders: 0 }, age: null, until: 0 };
  s.current = 0;
  s.turn = 2; startTurn(s);
  s.turn = 3; startTurn(s);
  drain();
  assert.deepEqual([stockOf(p).iron, stockOf(p).horses], [1, 1], 'once in two turns in the Classical era');
  p.era.n = 2;
  s.turn = 4; startTurn(s);
  s.turn = 5; startTurn(s);
  drain();
  assert.deepEqual([stockOf(p).iron, stockOf(p).horses], [3, 3], 'every turn from the Medieval era');
});

test('requisition: a big city buys iron or horses, dearer each time, cooling each turn', () => {
  const s = game();
  const p = s.players[0];
  const c = s.cities.find((k) => k.owner === 0)!;
  const t = tileAt(s, c.x, c.y)!;
  p.stars = 100;
  const buy = () => tileActions(s, 0, t).find((a) => a.id === 'req:iron')!;
  assert.ok(!buy().enabled && /level-3/.test(buy().reason!));
  c.level = 3;
  assert.equal(buy().cost, REQ_BASE);
  assert.ok(doAction(s, 0, t, 'req:iron'));
  assert.equal(stockOf(p).iron, 1);
  assert.equal(buy().cost, REQ_BASE + REQ_STEP);
  assert.ok(doAction(s, 0, t, 'req:horses'));
  assert.equal(tileActions(s, 0, t).find((a) => a.id === 'req:horses')!.cost, REQ_BASE + 2 * REQ_STEP);
  s.current = 0; s.turn = 1; startTurn(s); drain();
  assert.equal(buy().cost, REQ_BASE + REQ_STEP, 'eases a step a turn');
});

test('spoils of war: defeating an iron or horse unit leaves one for the victor', () => {
  const s = game();
  const knight = spawnUnit(s, 'knight', 1, 3, 3, null);
  const mine = spawnUnit(s, 'warrior', 0, 3, 4, null);
  removeUnit(s, knight, mine);
  assert.equal(stockOf(s.players[0]).horses, 1);
  const w = spawnUnit(s, 'warrior', 1, 5, 5, null);
  removeUnit(s, w, mine);
  assert.equal(stockOf(s.players[0]).iron, 0, 'a warrior used nothing');
});

test('from the Medieval era a mine or pasture can be cultivated without having seen one', () => {
  const s = game();
  const p = s.players[0];
  p.stars = 100;
  p.techs.push('climbing', 'mining');
  const c = s.cities.find((k) => k.owner === 0)!;
  const t = s.tiles.find((x) => x.owner === c.id && x.cityId === null)!;
  t.terrain = 'field'; t.resource = null; t.improvement = null;
  s.units = s.units.filter((u) => !(u.x === t.x && u.y === t.y));
  assert.equal(tileActions(s, 0, t).find((a) => a.id === 'cultivate:iron'), undefined);
  p.era = { n: 2, snap: { sparks: 0, kills: 0, levels: 0, wonders: 0 }, age: null, until: 0 };
  assert.ok(tileActions(s, 0, t).find((a) => a.id === 'cultivate:iron')!.enabled);
});

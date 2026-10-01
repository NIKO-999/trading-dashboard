import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { doAction, tileActions, trainCost, maxHp } from '../../src/game/rules';
import { tileAt } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { hookIncome } from '../../src/game/mech';
import { mech, dyeIncome, isMerc, mercCost, mercsOf, payMercs } from '../../src/game/mech/carthage';
import { drain } from '../../src/game/events';
import type { GameState } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 5, human: 'carthage', opponents: ['japan'], mode: 'perfection' });
  const city = s.cities.find((c) => c.owner === 0)!;
  const p = s.players[0];
  for (const t of ['riding', 'archery', 'smithing', 'chivalry']) if (!p.techs.includes(t)) p.techs.push(t);
  p.stock = { iron: 10, horses: 10 };
  // an empty city tile to hire on
  s.units = s.units.filter((u) => !(u.x === city.x && u.y === city.y));
  return { s, city, p, ct: tileAt(s, city.x, city.y)! };
}

test('Purple Dye: every port and market inside the borders pays +1 star', () => {
  const { s, city } = setup();
  const own = s.tiles.filter((t) => t.owner === city.id && t.cityId === null);
  for (const t of s.tiles) if (t.improvement === 'port' || t.improvement === 'market') t.improvement = null;
  assert.equal(dyeIncome(s, 0), 0);
  const before = hookIncome(s, 0);
  own[0].improvement = 'port';
  own[1].improvement = 'market';
  own[2].improvement = 'farm';
  assert.equal(dyeIncome(s, 0), 2);
  assert.equal(hookIncome(s, 0) - before, 2);
  // a market outside Carthage's borders pays nothing
  const far = s.tiles.find((t) => t.owner === null)!;
  far.improvement = 'market';
  assert.equal(dyeIncome(s, 0), 2);
  assert.equal(mech.income!(s, 1), 0, 'other empires earn nothing from it');
});

test('hiring: 1.5x price, veteran, no unit slot, once per city per turn, capped by cities', () => {
  const { s, city, p, ct } = setup();
  p.stars = 100;
  const slots = city.units;
  const acts = tileActions(s, 0, ct).filter((a) => a.id.startsWith('mech:merc:'));
  for (const k of ['warrior', 'archer', 'rider', 'sacredband', 'swordsman', 'knight']) assert.ok(acts.some((a) => a.id === `mech:merc:${k}`), k);
  assert.ok(!acts.some((a) => a.id === 'mech:merc:defender'), 'the Sacred Band stands in for the defender');
  const sw = acts.find((a) => a.id === 'mech:merc:swordsman')!;
  assert.equal(sw.cost, Math.ceil(trainCost(s, 0, 'swordsman') * 1.5));
  assert.equal(mercCost(s, 0, 'warrior'), Math.ceil(trainCost(s, 0, 'warrior') * 1.5));
  const iron = p.stock!.iron;
  assert.ok(doAction(s, 0, ct, 'mech:merc:swordsman'));
  assert.equal(p.stars, 100 - sw.cost);
  assert.equal(p.stock!.iron, iron - 2, 'uses Iron like training');
  const u = s.units.find((x) => x.owner === 0 && x.kind === 'swordsman')!;
  assert.ok(u && isMerc(u));
  assert.equal(u.veteran, true);
  assert.equal(u.hp, maxHp(u));
  assert.equal(u.homeCity, null);
  assert.equal(city.units, slots, 'no unit slot taken');
  assert.ok(u.moved && u.attacked, 'ready next turn');
  // the same city can't hire again this turn
  const again = tileActions(s, 0, ct).find((a) => a.id === 'mech:merc:warrior')!;
  assert.equal(again.enabled, false);
  assert.ok(!doAction(s, 0, ct, 'mech:merc:warrior'));
  // next turn: the cap is one mercenary per city
  s.turn++;
  const capped = tileActions(s, 0, ct).find((a) => a.id === 'mech:merc:warrior')!;
  assert.equal(capped.enabled, false, 'one city, one mercenary');
  assert.match(capped.reason!, /At most 1/);
  // a second city raises the cap; the unit steps out beside the occupied city tile
  const c2 = s.cities.find((c) => c.owner !== 0)!;
  c2.owner = 0;
  assert.ok(doAction(s, 0, ct, 'mech:merc:warrior'));
  const w = s.units.find((x) => x.kind === 'warrior' && x.owner === 0 && isMerc(x))!;
  assert.ok(Math.max(Math.abs(w.x - city.x), Math.abs(w.y - city.y)) === 1, 'beside the city');
  assert.equal(mercsOf(s, 0).length, 2);
  JSON.parse(JSON.stringify(s));
});

test('tech and horses gate contracts like training', () => {
  const { s, p, ct } = setup();
  p.stars = 100;
  p.techs = p.techs.filter((t) => t !== 'chivalry');
  assert.ok(!tileActions(s, 0, ct).some((a) => a.id === 'mech:merc:knight'));
  p.techs.push('chivalry');
  p.stock = { iron: 0, horses: 0 };
  const k = tileActions(s, 0, ct).find((a) => a.id === 'mech:merc:knight')!;
  assert.equal(k.enabled, false);
  assert.match(k.reason!, /Horses/);
});

test('upkeep: 1 star per mercenary, and the newest deserts when unpaid', () => {
  const { s, city, p, ct } = setup();
  const c2 = s.cities.find((c) => c.owner !== 0)!;
  c2.owner = 0;
  p.stars = 100;
  assert.ok(doAction(s, 0, ct, 'mech:merc:warrior'));
  s.turn++;
  assert.ok(doAction(s, 0, ct, 'mech:merc:archer'));
  assert.equal(mercsOf(s, 0).length, 2);
  p.stars = 10;
  payMercs(s, 0);
  assert.equal(p.stars, 8);
  assert.equal(mercsOf(s, 0).length, 2);
  drain();
  p.stars = 1;
  payMercs(s, 0);
  const toasts = drain().flatMap((e) => (e.type === 'toast' ? [e.text] : []));
  assert.equal(mercsOf(s, 0).length, 1, 'one deserted');
  assert.equal(mercsOf(s, 0)[0].kind, 'warrior', 'the newest (archer) left');
  assert.equal(p.stars, 0);
  assert.ok(toasts.some((t) => /deserts/.test(t)));
  void city;
  // through the real turn start too
  p.stars = 0;
  for (const c of s.cities) if (c.owner === 0) c.level = 1;
  s.current = 0;
  const before = mercsOf(s, 0).length;
  spawnUnit(s, 'warrior', 1, 0, 0, null);
  startTurn(s);
  assert.ok(mercsOf(s, 0).length <= before);
});

test('AI hires a mercenary when a city is threatened', () => {
  const { s, city, p } = setup();
  p.stars = 40;
  const n = tileAt(s, city.x + 2, city.y) ?? tileAt(s, city.x - 2, city.y)!;
  s.units = s.units.filter((u) => !(u.x === n.x && u.y === n.y));
  spawnUnit(s, 'warrior', 1, n.x, n.y, null);
  assert.ok(mech.ai!(s, 0));
  assert.equal(mercsOf(s, 0).length, 1);
  assert.ok(p.stars < 40);
  assert.ok(!mech.ai!(s, 0), 'capped at one per city');
});

test('AI keeps its stars when nothing threatens it', () => {
  const { s, p } = setup();
  p.stars = 40;
  s.units = s.units.filter((u) => u.owner === 0);
  assert.ok(!mech.ai!(s, 0));
});

test('25-turn all-AI game with Carthage completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['carthage', 'japan', 'mongols'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 25 && guard++ < 1500) {
    aiTurn(s);
    endTurn(s);
  }
  assert.ok(s.turn >= 25 || s.over);
  const cid = s.players.findIndex((p) => p.tribe === 'carthage');
  assert.ok(mercsOf(s, cid).length <= s.cities.filter((c) => c.owner === cid).length);
  JSON.parse(JSON.stringify(s));
});

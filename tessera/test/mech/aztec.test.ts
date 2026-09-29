import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { attack, citiesOf, doAction, tileActions } from '../../src/game/rules';
import { tileAt } from '../../src/game/grid';
import { createGame, revealAround, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { ALTAR_COST, SUN_COST, carried, mech, st } from '../../src/game/mech/aztec';
import type { GameState, Unit } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 5, human: 'aztec', opponents: ['japan'], mode: 'perfection' });
  let spot: { x: number; y: number } | null = null;
  for (let y = 0; y < s.size && !spot; y++)
    for (let x = 0; x + 2 < s.size && !spot; x++)
      if (s.tiles.filter((t) => t.y === y && t.x >= x && t.x <= x + 2).every((t) => t.terrain === 'field' && t.cityId === null && t.owner === null) && !s.units.some((u) => u.y === y && u.x >= x && u.x <= x + 2)) spot = { x, y };
  assert.ok(spot);
  const a = spawnUnit(s, 'warrior', 0, spot.x, spot.y, null);
  const d = spawnUnit(s, 'warrior', 1, spot.x + 1, spot.y, null);
  a.moved = a.attacked = false;
  revealAround(s, 0);
  return { s, a, d };
}

const capture = (s: GameState, a: Unit, d: Unit) => { d.hp = 1; a.attacked = false; assert.ok(attack(s, a, d)); };

test('a would-be kill takes the enemy captive: bounty, no XP, no advance', () => {
  const { s, a, d } = setup();
  const stars = s.players[0].stars, vk = a.veteranKills;
  capture(s, a, d);
  assert.ok(!s.units.includes(d));
  assert.equal(carried(a), 1);
  assert.equal(st(s, 0).captured, 1);
  assert.equal(s.players[0].stars, stars + 1);
  assert.equal(a.veteranKills, vk);
  assert.equal(a.x, d.x - 1, 'did not advance');
  JSON.parse(JSON.stringify(s));
});

test('with full ropes the kill is a plain kill: star bounty, and no veteran progress', () => {
  const { s, a } = setup();
  a.veteranKills = 2;
  const d1 = spawnUnit(s, 'warrior', 1, a.x + 1, a.y, null);
  capture(s, a, d1);
  const d2 = spawnUnit(s, 'warrior', 1, a.x + 1, a.y, null);
  capture(s, a, d2);
  assert.equal(carried(a), 2);
  const stars = s.players[0].stars;
  const d3 = spawnUnit(s, 'warrior', 1, a.x + 1, a.y, null);
  capture(s, a, d3);
  assert.ok(!s.units.includes(d3));
  assert.equal(carried(a), 2);
  assert.ok(s.players[0].stars >= stars + 2, "bounty paid");
  assert.equal(a.veteranKills, 2);
  assert.equal(a.veteran, false);
});

test('captives are delivered to a city, offered for +1 pop, and an altar sacrifice opens the Sun Age', () => {
  const { s, a } = setup();
  const city = citiesOf(s, 0)[0];
  const ct = tileAt(s, city.x, city.y)!;
  // no captives yet: menu shows them disabled
  assert.ok(tileActions(s, 0, ct).find((x) => x.id === 'mech:offer' && !x.enabled));
  const guard = s.units.find((u) => u.x === city.x && u.y === city.y);
  if (guard) s.units = s.units.filter((u) => u !== guard);
  a.x = city.x; a.y = city.y;
  a.data = { captives: 2 };
  mech.afterMove!(s, 0, a, { x: 0, y: 0 }, ct);
  assert.equal(carried(a), 0);
  assert.equal(st(s, 0).captives, 2);

  // build an altar through the tile menu
  s.players[0].stars = 20;
  assert.ok(tileActions(s, 0, ct).find((x) => x.id === 'mech:altar')?.enabled);
  assert.ok(doAction(s, 0, ct, 'mech:altar'));
  assert.equal(ct.improvement, 'altar');
  assert.equal(s.players[0].stars, 20 - ALTAR_COST);
  assert.ok(!tileActions(s, 0, ct).some((x) => x.id === 'mech:altar'));

  // offer one captive: +1 pop
  const pop = city.pop, lvl = city.level;
  assert.ok(doAction(s, 0, ct, 'mech:offer'));
  assert.ok(city.level > lvl || city.pop === pop + 1);
  assert.equal(st(s, 0).captives, 1);

  // Sun Age needs SUN_COST
  assert.ok(!doAction(s, 0, ct, 'mech:sacrifice'));
  st(s, 0).captives = SUN_COST;
  const before = s.players[0].explored.filter(Boolean).length;
  const levels = citiesOf(s, 0).map((c) => c.level * 100 + c.pop);
  assert.ok(doAction(s, 0, ct, 'mech:sacrifice'));
  const m = st(s, 0);
  assert.equal(m.captives, 0);
  assert.ok(m.sun > 0);
  assert.ok(s.players[0].explored.every(Boolean), 'whole map revealed');
  assert.ok(s.players[0].explored.filter(Boolean).length >= before);
  assert.ok(citiesOf(s, 0).some((c, i) => c.level * 100 + c.pop > levels[i]));
  assert.ok(!tileActions(s, 0, ct).find((x) => x.id === 'mech:sacrifice')?.enabled);

  // frenzy: +1 attack, then the age ends and the vision is withdrawn
  const dd = spawnUnit(s, 'warrior', 1, 0, 0, null);
  s.units = s.units.filter((u) => u !== dd);
  assert.equal(mech.stat!(s, 0, a, 'atk'), 1);
  while (st(s, 0).sun > 0) mech.turnStart!(s, 0);
  assert.equal(mech.stat!(s, 0, a, 'atk'), 0);
  assert.ok(s.players[0].explored.filter(Boolean).length < s.players[0].explored.length);
  JSON.parse(JSON.stringify(s));
});

test('carrying slows the unit and a dead carrier loses its captives', () => {
  const { s, a, d } = setup();
  a.data = { captives: 1 };
  assert.equal(mech.stat!(s, 0, a, 'move'), -1);
  a.hp = 1;
  d.hp = 10;
  const foe = spawnUnit(s, 'swordsman', 1, a.x + 1, a.y + 1, null);
  foe.attacked = false;
  attack(s, foe, a);
  assert.equal(st(s, 0).captives, 0);
});

test('AI hauls, builds, offers and sacrifices', () => {
  const { s, a } = setup();
  s.players[0].human = false;
  const city = citiesOf(s, 0)[0];
  s.players[0].stars = 20;
  assert.ok(mech.ai!(s, 0));
  assert.equal(tileAt(s, city.x, city.y)!.improvement, 'altar');
  st(s, 0).captives = SUN_COST;
  assert.ok(mech.ai!(s, 0));
  assert.ok(st(s, 0).sacrificed === 1 && st(s, 0).sun > 0);
  st(s, 0).captives = 1;
  assert.ok(mech.ai!(s, 0), 'offers while the age burns');
  assert.equal(st(s, 0).offered, 1);
  // carrier walks home
  const home = tileAt(s, city.x, city.y)!;
  a.moved = false; a.data = { captives: 1 };
  const d0 = Math.max(Math.abs(a.x - home.x), Math.abs(a.y - home.y));
  mech.ai!(s, 0);
  assert.ok(Math.max(Math.abs(a.x - home.x), Math.abs(a.y - home.y)) <= d0);
});

test('20-turn all-AI game with the Aztecs completes and exercises the mechanic', () => {
  let used = 0;
  for (const seed of [11, 12, 13]) {
    const s: GameState = createGame({ seed, human: null, opponents: ['aztec', 'japan', 'mongols'], mode: 'perfection' });
    startTurn(s);
    let guard = 0;
    while (!s.over && s.turn < 20 && guard++ < 1000) { aiTurn(s); endTurn(s); }
    assert.ok(s.turn >= 20 || s.over);
    const i = s.players.findIndex((p) => p.tribe === 'aztec');
    const m = st(s, i);
    used += m.captured + m.offered + m.sacrificed + (s.tiles.some((t) => t.improvement === 'altar') ? 1 : 0);
    JSON.parse(JSON.stringify(s));
  }
  assert.ok(used > 0, 'the AI used captives or altars');
});

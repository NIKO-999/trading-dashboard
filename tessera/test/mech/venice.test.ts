import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { doAction, tileActions, trainCost, unitCap } from '../../src/game/rules';
import { dist, isWater, neighbors, tileAt } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { hookIncome } from '../../src/game/mech';
import { mech, arsenalCost, convoyIncome, interest, launchTile, portsOf } from '../../src/game/mech/venice';
import type { GameState, Tile } from '../../src/game/types';

/** A Venetian capital with a port on the shore beside it and open water around the port. */
function setup() {
  const s = createGame({ seed: 7, human: 'venice', opponents: ['japan'], mode: 'perfection' });
  const city = s.cities.find((c) => c.owner === 0)!;
  const p = s.players[0];
  s.units = s.units.filter((u) => dist(u.x, u.y, city.x, city.y) > 4);
  for (const t of s.tiles) if (t.improvement === 'port') t.improvement = null;
  // shape the coast: the column two east of the city is shore with a port, everything further east is water
  const portT = tileAt(s, city.x + 1, city.y)!;
  for (const t of s.tiles) {
    if (dist(t.x, t.y, city.x, city.y) > 3 || t.cityId !== null) continue;
    if (t.x >= city.x + 2) { t.terrain = 'shallow'; t.resource = null; t.improvement = null; t.village = false; }
  }
  portT.terrain = 'field';
  portT.resource = null;
  portT.village = false;
  portT.owner = city.id;
  portT.improvement = 'port';
  p.stars = 0;
  return { s, city, p, ct: tileAt(s, city.x, city.y)!, portT };
}

test('Merchant Republic: +1 star per 10 in the treasury, at most +4', () => {
  const { s, p } = setup();
  for (const [stars, want] of [[0, 0], [9, 0], [10, 1], [19, 1], [20, 2], [39, 3], [40, 4], [55, 4], [200, 4]] as const) {
    p.stars = stars;
    assert.equal(interest(s, 0), want, `${stars}★`);
    assert.equal(mech.income!(s, 0), want, 'no convoy here');
  }
  p.stars = 30;
  assert.equal(hookIncome(s, 0), 3);
  s.players[1].stars = 50;
  assert.equal(mech.income!(s, 1), 0, 'only Venice earns it');
});

test('interest is counted on the treasury at the start of the turn', () => {
  const { s, p } = setup();
  for (const c of s.cities) if (c.owner === 0) c.level = 1;
  s.current = 0;
  s.turn = 3;
  // what the hooks pay besides the interest, read with an empty treasury
  p.stars = 0;
  const base = hookIncome(s, 0);
  p.stars = 27;
  const before = p.stars;
  const expected = base + 2;
  assert.equal(hookIncome(s, 0), expected);
  startTurn(s);
  assert.ok(p.stars - before >= expected, 'the interest was paid');
});

test('the Arsenal: half price, a unit slot, launched beside the port, once every 4 turns', () => {
  const { s, city, p, ct, portT } = setup();
  p.techs = p.techs.filter((t) => t !== 'navigation');
  if (!p.techs.includes('sailing')) p.techs.push('sailing');
  city.level = 3;
  city.units = 0;
  p.stars = 100;
  // a Galley before Navigation
  let a = tileActions(s, 0, ct).find((x) => x.id === 'mech:arsenal')!;
  assert.ok(a && a.enabled, a?.reason ?? "");
  assert.equal(a.cost, Math.ceil(trainCost(s, 0, 'ship') * 0.5));
  // a Trireme with Navigation
  p.techs.push('navigation');
  a = tileActions(s, 0, ct).find((x) => x.id === 'mech:arsenal')!;
  assert.equal(a.cost, Math.ceil(trainCost(s, 0, 'warship') * 0.5));
  assert.equal(arsenalCost(s, 0), a.cost);
  const sea = launchTile(s, city)!;
  assert.ok(sea && isWater(sea) && neighbors(s, portT.x, portT.y).includes(sea));
  assert.ok(doAction(s, 0, ct, 'mech:arsenal'));
  assert.equal(p.stars, 100 - a.cost);
  const w = s.units.find((u) => u.owner === 0 && u.kind === 'warship')!;
  assert.ok(w);
  assert.equal(w.x, sea.x);
  assert.equal(w.y, sea.y);
  assert.equal(w.homeCity, city.id);
  assert.equal(city.units, 1, 'takes a unit slot');
  assert.equal(w.carrying, null);
  // cooldown: not again for 4 turns
  for (let i = 1; i < 4; i++) {
    s.turn++;
    a = tileActions(s, 0, ct).find((x) => x.id === 'mech:arsenal')!;
    assert.equal(a.enabled, false, `turn +${i}`);
    assert.match(a.reason!, /refitting/);
    assert.ok(!doAction(s, 0, ct, 'mech:arsenal'));
  }
  s.turn++;
  a = tileActions(s, 0, ct).find((x) => x.id === 'mech:arsenal')!;
  assert.ok(a.enabled, a.reason ?? "");
  const sea2 = launchTile(s, city)!;
  assert.ok(!(sea2.x === sea.x && sea2.y === sea.y), 'the first ship still holds its tile');
  assert.ok(doAction(s, 0, ct, 'mech:arsenal'));
  assert.equal(s.units.filter((u) => u.owner === 0 && u.kind === 'warship').length, 2);
  // a full city cannot launch
  s.turn += 4;
  city.units = unitCap(city);
  a = tileActions(s, 0, ct).find((x) => x.id === 'mech:arsenal')!;
  assert.equal(a.enabled, false);
  assert.match(a.reason!, /supports/);
  JSON.parse(JSON.stringify(s));
});

test('the Arsenal needs Sailing, a port and free water', () => {
  const { s, city, p, ct, portT } = setup();
  p.techs = p.techs.filter((t) => t !== 'sailing' && t !== 'navigation');
  p.stars = 100;
  city.units = 0;
  let a = tileActions(s, 0, ct).find((x) => x.id === 'mech:arsenal')!;
  assert.equal(a.enabled, false);
  assert.match(a.reason!, /Needs/);
  assert.equal(a.needs, 'sailing');
  assert.ok(!doAction(s, 0, ct, 'mech:arsenal'));
  p.techs.push('sailing');
  // water beside the port all taken
  const blockers: Tile[] = neighbors(s, portT.x, portT.y).filter(isWater);
  for (const t of blockers) spawnUnit(s, 'boat', 1, t.x, t.y, null);
  a = tileActions(s, 0, ct).find((x) => x.id === 'mech:arsenal')!;
  assert.equal(a.enabled, false);
  assert.match(a.reason!, /free water/);
  s.units = s.units.filter((u) => u.owner !== 1 || u.kind !== 'boat');
  // no port: no Arsenal at all
  portT.improvement = null;
  assert.ok(!tileActions(s, 0, ct).some((x) => x.id === 'mech:arsenal'));
  assert.equal(portsOf(s, city).length, 0);
});

test('mercantile convoy: +1 star per ship beside a city, at most 3', () => {
  const { s, city, p, portT } = setup();
  p.stars = 0;
  // the city on an island: water all round it but for the port
  for (const t of neighbors(s, city.x, city.y)) if (t !== portT) { t.terrain = 'shallow'; t.resource = null; t.improvement = null; t.village = false; }
  assert.equal(convoyIncome(s, 0), 0);
  const water = s.tiles.filter((t) => isWater(t) && dist(t.x, t.y, city.x, city.y) === 1 && !s.units.some((u) => u.x === t.x && u.y === t.y));
  assert.ok(water.length >= 2);
  spawnUnit(s, 'boat', 0, water[0].x, water[0].y, null);
  assert.equal(convoyIncome(s, 0), 1);
  assert.equal(mech.income!(s, 0), 1);
  spawnUnit(s, 'ship', 0, water[1].x, water[1].y, null);
  assert.equal(convoyIncome(s, 0), 2);
  // ships two tiles out don't unload
  const far = s.tiles.find((t) => isWater(t) && dist(t.x, t.y, city.x, city.y) === 2 && !s.units.some((u) => u.x === t.x && u.y === t.y))!;
  spawnUnit(s, 'warship', 0, far.x, far.y, null);
  assert.equal(convoyIncome(s, 0), 2);
  // another empire's ship beside the city pays nothing
  const extra = s.tiles.filter((t) => isWater(t) && dist(t.x, t.y, city.x, city.y) === 1 && !s.units.some((u) => u.x === t.x && u.y === t.y));
  spawnUnit(s, 'boat', 1, extra[0].x, extra[0].y, null);
  assert.equal(convoyIncome(s, 0), 2);
  s.units = s.units.filter((u) => u.owner === 0);
  // fill every free water tile beside the city: the cap is 3
  for (const t of s.tiles.filter((t) => isWater(t) && dist(t.x, t.y, city.x, city.y) === 1 && !s.units.some((u) => u.x === t.x && u.y === t.y))) spawnUnit(s, 'boat', 0, t.x, t.y, null);
  assert.ok(s.units.filter((u) => u.owner === 0 && dist(u.x, u.y, city.x, city.y) === 1).length > 3);
  assert.equal(convoyIncome(s, 0), 3);
  p.stars = 45;
  assert.equal(mech.income!(s, 0), 7, 'interest 4 + convoy 3');
});

test('AI launches from a ready Arsenal and keeps a reserve', () => {
  const { s, city, p } = setup();
  for (const t of ['sailing', 'navigation']) if (!p.techs.includes(t)) p.techs.push(t);
  city.level = 3;
  city.units = 0;
  p.stars = 12;
  const n0 = s.units.filter((u) => u.owner === 0 && u.kind === 'warship').length;
  mech.ai!(s, 0);
  assert.equal(s.units.filter((u) => u.owner === 0 && u.kind === 'warship').length, n0, 'too poor to launch and keep 10 stars');
  p.stars = 30;
  assert.ok(mech.ai!(s, 0));
  assert.equal(s.units.filter((u) => u.owner === 0 && u.kind === 'warship').length, n0 + 1);
  assert.equal(p.stars, 30 - arsenalCost(s, 0));
});

test('25-turn all-AI game with Venice completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['venice', 'japan', 'vikings'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 25 && guard++ < 1500) {
    aiTurn(s);
    endTurn(s);
  }
  assert.ok(s.turn >= 25 || s.over);
  const vid = s.players.findIndex((p) => p.tribe === 'venice');
  assert.ok(convoyIncome(s, vid) <= 3);
  assert.ok(interest(s, vid) <= 4);
  JSON.parse(JSON.stringify(s));
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { doAction, maxHp, tileActions, tileOwnerPlayer } from '../../src/game/rules';
import { neighbors, tileAt } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { hookIncome } from '../../src/game/mech';
import {
  FLEET_PAY, MISSION_COST, MISSION_HEAL, MISSION_PAY, MISSION_PAY_TAKEN, PLUNDER_PER_LEVEL,
  fleet, fleetIncome, hasMission, mech, missionIncome, missionStars, missionWhy, missions, plundered,
} from '../../src/game/mech/spain';
import type { City, GameState, Tile } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 7, human: 'spain', opponents: ['rome'], mode: 'perfection' });
  const me = s.players.findIndex((p) => p.tribe === 'spain');
  for (const p of s.players) p.explored.fill(true);
  const city = s.cities.find((c) => c.owner === me && c.capital)!;
  // the ring round the capital: plain field, nothing on it, no units
  for (const t of neighbors(s, city.x, city.y)) {
    t.terrain = 'field'; t.resource = null; t.improvement = null; t.village = false; t.ruin = false; t.owner = city.id;
  }
  s.units = s.units.filter((u) => Math.max(Math.abs(u.x - city.x), Math.abs(u.y - city.y)) > 1);
  s.players[me].stars = 50;
  s.current = me;
  return { s, me, foe: 1 - me, city };
}

/** Take an enemy city the real way: a soldier standing on it uses the Capture action. */
function conquer(s: GameState, me: number, city: City) {
  const t = tileAt(s, city.x, city.y)!;
  s.units = s.units.filter((u) => !(u.x === t.x && u.y === t.y));
  const u = spawnUnit(s, 'warrior', me, t.x, t.y, null);
  u.moved = u.attacked = false;
  assert.ok(doAction(s, me, t, 'capture'));
  return t;
}
const ring = (s: GameState, c: City): Tile[] => neighbors(s, c.x, c.y).filter((t) => t.cityId === null);
const backToMe = (s: GameState, me: number) => { endTurn(s); for (let i = 0; i < 4 && s.current !== me; i++) endTurn(s); };

test('Treasure Fleets: each ship and warship pays +1★, boats do not', () => {
  const { s, me, foe, city } = setup();
  const water = s.tiles.filter((t) => t.terrain === 'shallow' || t.terrain === 'ocean');
  const at = (i: number) => water[i];
  assert.equal(fleetIncome(s, me), 0);
  const boat = spawnUnit(s, 'warrior', me, at(0).x, at(0).y, city.id);
  boat.carrying = 'warrior'; boat.kind = 'boat';
  assert.equal(fleetIncome(s, me), 0, 'a boat is no galleon');
  const ship = spawnUnit(s, 'warrior', me, at(1).x, at(1).y, city.id);
  ship.carrying = 'warrior'; ship.kind = 'ship';
  spawnUnit(s, 'warship', me, at(2).x, at(2).y, city.id);
  assert.equal(fleet(s, me).length, 2);
  assert.equal(fleetIncome(s, me), 2 * FLEET_PAY, 'a laden ship and a warship');
  assert.equal(mech.income!(s, me), 2);
  assert.ok(hookIncome(s, me) >= 2);
  spawnUnit(s, 'warship', foe, at(3).x, at(3).y, null);
  assert.equal(fleetIncome(s, me), 2, 'only your own ships');
  assert.equal(mech.income!(s, foe), 0, 'only Spain gets it');
});

test('Plunder: taking a city pays 3★ per level', () => {
  const { s, me, foe } = setup();
  const c = s.cities.find((x) => x.owner === foe)!;
  c.level = 3;
  const before = s.players[me].stars;
  conquer(s, me, c);
  assert.equal(c.owner, me);
  assert.equal(plundered(s, me), PLUNDER_PER_LEVEL * 3);
  assert.ok(s.players[me].stars - before >= 9, 'the loot is paid at once');
  // Rome taking a Spanish city plunders nothing for Spain
  const mine = s.cities.find((x) => x.owner === me && x !== c)!;
  conquer(s, foe, mine);
  assert.equal(plundered(s, me), 9);
});

test('Missions: placement rules and one per city', () => {
  const { s, me, foe, city } = setup();
  const [a, b] = ring(s, city);
  const act = tileActions(s, me, a).find((x) => x.id === 'mech:mission');
  assert.ok(act && act.enabled, 'offered next to the city');
  assert.equal(act.cost, MISSION_COST);
  const before = s.players[me].stars;
  assert.ok(doAction(s, me, a, 'mech:mission'));
  assert.equal(a.improvement, 'mission');
  assert.equal(s.players[me].stars, before - MISSION_COST);
  assert.ok(hasMission(s, city));
  // the cap: a second one beside the same city is refused
  assert.match(missionWhy(s, me, b)!, /One Mission per city/);
  assert.equal(tileActions(s, me, b).find((x) => x.id === 'mech:mission')?.enabled, false);
  assert.ok(!doAction(s, me, b, 'mech:mission'));
  // not on water, a resource, an improvement, the city, or outside the borders, or far from a city
  const t = ring(s, city).find((x) => x !== a)!;
  for (const x of s.cities) if (x !== city && x.owner === me) x.owner = foe; // only the capital is Spanish
  if (a.improvement) a.improvement = null;
  assert.equal(missionWhy(s, me, t), null);
  t.resource = 'fruit'; assert.ok(missionWhy(s, me, t)); t.resource = null;
  t.terrain = 'shallow'; assert.ok(missionWhy(s, me, t)); t.terrain = 'mountain'; assert.ok(missionWhy(s, me, t)); t.terrain = 'field';
  assert.ok(missionWhy(s, me, tileAt(s, city.x, city.y)!), 'not on the city');
  const far = tileAt(s, city.x + (city.x + 2 < s.size ? 2 : -2), city.y)!;
  far.terrain = 'field'; far.resource = null; far.improvement = null; far.village = false; far.ruin = false; far.owner = city.id;
  s.units = s.units.filter((u) => !(u.x === far.x && u.y === far.y));
  assert.match(missionWhy(s, me, far)!, /next to/);
  const outside = s.tiles.find((x) => tileOwnerPlayer(s, x) === null && x.terrain === 'field')!;
  assert.match(missionWhy(s, me, outside)!, /borders/);
  // only Spain founds them
  assert.equal(tileActions(s, foe, outside).some((x) => x.id === 'mech:mission'), false);
});

test('Mission income: +1★, +2★ beside a captured city', () => {
  const { s, me, foe, city } = setup();
  const a = ring(s, city)[0];
  assert.ok(doAction(s, me, a, 'mech:mission'));
  assert.equal(missionStars(s, a), MISSION_PAY);
  assert.equal(missionIncome(s, me), 1);
  // take Rome's city and found one beside it
  const c = s.cities.find((x) => x.owner === foe)!;
  conquer(s, me, c);
  const t = ring(s, c).find((x) => tileOwnerPlayer(s, x) === me && x.terrain !== 'mountain' && x.terrain !== 'shallow' && x.terrain !== 'ocean')!;
  t.resource = null; t.improvement = null; t.village = false; t.ruin = false;
  s.units = s.units.filter((u) => !(u.x === t.x && u.y === t.y));
  assert.equal(missionWhy(s, me, t), null);
  assert.ok(doAction(s, me, t, 'mech:mission'));
  assert.equal(missionStars(s, t), MISSION_PAY_TAKEN);
  assert.equal(missions(s, me).length, 2);
  assert.equal(missionIncome(s, me), 1 + 2);
  assert.equal(mech.income!(s, me), 3 + fleetIncome(s, me));
});

test('Missions heal Spanish units on or beside them 2 HP more at turn start', () => {
  const { s, me, foe, city } = setup();
  const a = ring(s, city)[0];
  assert.ok(doAction(s, me, a, 'mech:mission'));
  const on = spawnUnit(s, 'swordsman', me, a.x, a.y, null);
  on.hp = 4;
  const next = neighbors(s, a.x, a.y).find((t) => t.cityId === null && t !== a && !s.units.some((u) => u.x === t.x && u.y === t.y))!;
  next.terrain = 'field';
  const by = spawnUnit(s, 'warrior', me, next.x, next.y, null);
  by.hp = 3;
  const fx = city.x + (a.x > city.x ? -3 : 3), fy = city.y + (a.y > city.y ? -3 : 3);
  const farT = tileAt(s, Math.max(0, Math.min(s.size - 1, fx)), Math.max(0, Math.min(s.size - 1, fy)))!;
  farT.terrain = 'field';
  s.units = s.units.filter((u) => !(u.x === farT.x && u.y === farT.y));
  const away = spawnUnit(s, 'warrior', me, farT.x, farT.y, null);
  away.hp = 3;
  const foeU = spawnUnit(s, 'warrior', foe, a.x, a.y + (a.y > city.y ? 1 : -1), null);
  foeU.hp = 3;
  const before = { on: on.hp, by: by.hp, away: away.hp, foe: foeU.hp };
  mech.turnStart!(s, me);
  assert.equal(on.hp, before.on + MISSION_HEAL, 'on the Mission');
  assert.equal(by.hp, before.by + MISSION_HEAL, 'beside it');
  assert.equal(away.hp, before.away, 'not far away');
  assert.equal(foeU.hp, before.foe, 'not the enemy');
  on.hp = maxHp(on) - 1;
  mech.turnStart!(s, me);
  assert.equal(on.hp, maxHp(on), 'never past full health');
  // and through a real turn cycle
  by.hp = 3;
  backToMe(s, me);
  assert.ok(by.hp >= 3 + MISSION_HEAL);
});

test('AI founds Missions when it has stars to spare, one per city', () => {
  const { s, me } = setup();
  s.players[me].human = false;
  s.players[me].stars = 60;
  aiTurn(s);
  const ms = missions(s, me);
  assert.ok(ms.length >= 1, 'founded at least one');
  for (const c of s.cities.filter((x) => x.owner === me)) {
    assert.ok(neighbors(s, c.x, c.y).filter((t) => t.improvement === 'mission').length <= 1);
  }
  JSON.parse(JSON.stringify(s));
});

test('20-turn all-AI game with Spain completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['spain', 'rome', 'vikings'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 20 && guard++ < 1000) {
    aiTurn(s);
    endTurn(s);
  }
  assert.ok(s.turn >= 20 || s.over);
});

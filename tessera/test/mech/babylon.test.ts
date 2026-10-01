import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { doAction, techCost, tileActions, tileOwnerPlayer } from '../../src/game/rules';
import { area, neighbors, tileAt } from '../../src/game/grid';
import { createGame } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { hookIncome } from '../../src/game/mech';
import { EUREKA_OFF } from '../../src/game/sparks';
import {
  REVEAL_RANGE, TABLET_OFF, TECH_OFF_MAX, ZIGGURAT_COST, zigguratIncome, ziggurats, zigguratTechOff, zigguratWhy,
} from '../../src/game/mech/babylon';
import type { City, GameState, Tile } from '../../src/game/types';

function setup(seed = 5) {
  const s = createGame({ seed, human: 'babylon', opponents: ['japan', 'mongols'], mode: 'perfection' });
  const city = s.cities.find((c) => c.owner === 0 && c.capital)!;
  // clear the land round the capital: plain field, no roads, no resources
  for (const t of s.tiles) {
    if (t.owner !== city.id || t.cityId !== null) continue;
    t.terrain = 'field'; t.resource = null; t.improvement = null; t.road = false; t.village = false; t.ruin = false;
  }
  s.units = s.units.filter((u) => u.owner !== 0 || (u.x === city.x && u.y === city.y));
  return { s, city };
}

/** Free tiles next to `c`, in its own territory. */
const ring = (s: GameState, c: City): Tile[] => neighbors(s, c.x, c.y).filter((t) => t.owner === c.id && t.cityId === null);

test('Clay Tablets: a Eureka takes 60% off for Babylon, 40% for others', () => {
  const s = createGame({ seed: 7, human: 'babylon', opponents: ['japan', 'mongols'], mode: 'domination' });
  const tech = 'farming';
  for (const pid of [0, 1]) assert.ok(!s.players[pid].techs.includes(tech));
  const fullB = techCost(s, 0, tech), fullJ = techCost(s, 1, tech);
  s.players[0].sparks = [tech];
  s.players[1].sparks = [tech];
  assert.equal(TABLET_OFF, 0.6);
  assert.equal(EUREKA_OFF, 0.4);
  assert.equal(techCost(s, 0, tech), Math.max(1, Math.ceil(fullB * (1 - TABLET_OFF))), 'Babylon: 60% off');
  assert.equal(techCost(s, 1, tech), Math.max(1, Math.ceil(fullJ * (1 - EUREKA_OFF))), 'others: 40% off');
});

test('ziggurat: built by the tile action for 7★, beside the city, one per city', () => {
  const { s, city } = setup();
  const p = s.players[0];
  p.stars = 100;
  const [a, b] = ring(s, city);
  const act = tileActions(s, 0, a).find((x) => x.id === 'mech:ziggurat');
  assert.ok(act && act.enabled, 'offered next to the capital');
  assert.equal(act.cost, ZIGGURAT_COST);
  assert.equal(ZIGGURAT_COST, 7);
  assert.ok(doAction(s, 0, a, 'mech:ziggurat'));
  assert.equal(a.improvement, 'ziggurat');
  assert.equal(p.stars, 100 - ZIGGURAT_COST);
  // the cap: one per city
  assert.match(zigguratWhy(s, 0, b)!, /already/);
  const act2 = tileActions(s, 0, b).find((x) => x.id === 'mech:ziggurat');
  assert.equal(act2?.enabled, false);
  assert.ok(!doAction(s, 0, b, 'mech:ziggurat'));
  assert.equal(ziggurats(s, 0).length, 1);
  assert.equal(p.stars, 100 - ZIGGURAT_COST, 'a refused action is not charged');
  JSON.parse(JSON.stringify(s));
});

test('ziggurat: placement limits', () => {
  const { s, city } = setup();
  s.players[0].stars = 100;
  const t = ring(s, city)[0];
  assert.equal(zigguratWhy(s, 0, t), null);
  t.terrain = 'forest'; assert.ok(zigguratWhy(s, 0, t), 'not on forest');
  t.terrain = 'mountain'; assert.ok(zigguratWhy(s, 0, t), 'not on a mountain');
  t.terrain = 'desert'; assert.equal(zigguratWhy(s, 0, t), null, 'desert is fine');
  t.resource = 'fruit'; assert.ok(zigguratWhy(s, 0, t), 'not on a resource');
  t.resource = null;
  t.improvement = 'farm'; assert.ok(zigguratWhy(s, 0, t), 'not on an improvement');
  t.improvement = null;
  assert.ok(zigguratWhy(s, 0, tileAt(s, city.x, city.y)!), 'not on the city');
  // two steps from the city, still inside the borders: too far
  const far = s.tiles.find((x) => x.owner === city.id && Math.max(Math.abs(x.x - city.x), Math.abs(x.y - city.y)) === 2);
  if (far) assert.match(zigguratWhy(s, 0, far)!, /next to the city/);
  const outside = s.tiles.find((x) => tileOwnerPlayer(s, x) === null && x.terrain === 'field' && !x.village)!;
  assert.match(zigguratWhy(s, 0, outside)!, /borders/);
  assert.ok(!doAction(s, 0, outside, 'mech:ziggurat'));
  // a foreign unit on it blocks
  s.units.push({ ...s.units.find((u) => u.owner === 1)!, id: 9999, x: t.x, y: t.y });
  assert.match(zigguratWhy(s, 0, t)!, /foreign/);
  s.units = s.units.filter((u) => u.id !== 9999);
  // only Babylon builds them
  const enemy = s.cities.find((c) => c.owner === 1)!;
  const et = ring(s, enemy).find((x) => !x.improvement && !x.resource && x.terrain === 'field');
  if (et) assert.equal(tileActions(s, 1, et).some((x) => x.id === 'mech:ziggurat'), false);
});

test('ziggurat income: +1★ a turn each', () => {
  const { s, city } = setup();
  s.players[0].stars = 100;
  assert.equal(zigguratIncome(s, 0), 0);
  const before = hookIncome(s, 0);
  assert.ok(doAction(s, 0, ring(s, city)[0], 'mech:ziggurat'));
  assert.equal(zigguratIncome(s, 0), 1);
  assert.equal(hookIncome(s, 0), before + 1);
  assert.equal(zigguratIncome(s, 1), 0, 'other empires hold none');
});

test('star-gazers: raising a ziggurat reveals every tile within 3', () => {
  const { s, city } = setup();
  const p = s.players[0];
  p.stars = 100;
  p.explored.fill(false);
  const t = ring(s, city)[0];
  assert.ok(doAction(s, 0, t, 'mech:ziggurat'));
  const zone = area(s, t.x, t.y, REVEAL_RANGE);
  assert.ok(zone.length >= 16);
  for (const n of zone) assert.ok(p.explored[n.y * s.size + n.x], `(${n.x},${n.y}) revealed`);
  const beyond = s.tiles.find((n) => Math.max(Math.abs(n.x - t.x), Math.abs(n.y - t.y)) === REVEAL_RANGE + 2)!;
  assert.equal(p.explored[beyond.y * s.size + beyond.x], false, 'but no further');
});

test('ziggurats make every tech 1★ cheaper each, at most 3★, never below 1★', () => {
  const { s, city } = setup();
  const tech = 'farming';
  const full = techCost(s, 0, tech);
  // put four ziggurats on Babylonian land (by hand: more cities than the capital are not needed for the discount)
  const spots = s.tiles.filter((t) => t.owner === city.id && t.cityId === null).slice(0, 4);
  for (let i = 0; i < 4; i++) {
    spots[i].improvement = 'ziggurat';
    assert.equal(zigguratTechOff(s, 0), Math.min(i + 1, TECH_OFF_MAX));
    assert.equal(techCost(s, 0, tech), Math.max(1, full - Math.min(i + 1, TECH_OFF_MAX)));
  }
  assert.equal(techCost(s, 0, tech), full - 3, 'capped at −3');
  // never below 1: a tech already very cheap from a Eureka
  s.players[0].sparks = [tech];
  assert.ok(techCost(s, 0, tech) >= 1);
  // another empire gets nothing from them
  assert.equal(zigguratTechOff(s, 1), 0);
});

test('AI raises ziggurats when it can afford one and keep a reserve', () => {
  const { s } = setup();
  s.players[0].human = false;
  s.players[0].stars = 8; // 7 + reserve not met
  aiTurn(s);
  assert.equal(ziggurats(s, 0).length, 0, 'keeps its reserve');
  const { s: s2 } = setup();
  s2.players[0].human = false;
  s2.players[0].stars = 40;
  aiTurn(s2);
  const n = ziggurats(s2, 0).length;
  assert.ok(n >= 1, 'built one');
  assert.ok(n <= s2.cities.filter((c) => c.owner === 0).length, 'one per city at most');
});

test('20-turn all-AI game with Babylon completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['babylon', 'japan', 'mongols'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 20 && guard++ < 1000) {
    aiTurn(s);
    endTurn(s);
  }
  assert.ok(s.turn >= 20 || s.over);
});

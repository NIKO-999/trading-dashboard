import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { doAction, moveOptions, techCost, tileActions, tileOwnerPlayer, WISDOM_OFF, CONTACT_OFF } from '../../src/game/rules';
import { neighbors, tileAt } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { hookIncome } from '../../src/game/mech';
import {
  CARAVANSERAI_BASE, CARAVANSERAI_STEP, caravanIncome, caravanseraiCost, caravanseraiStars, caravanseraiWhy, caravanserais,
} from '../../src/game/mech/arabia';
import type { GameState, Tile } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 5, human: 'arabia', opponents: ['japan', 'mongols'], mode: 'perfection' });
  for (const p of s.players) p.explored.fill(true);
  const city = s.cities.find((c) => c.owner === 0 && c.capital)!;
  // clear the land round the capital so the tests control it: plain desert, no roads, no resources
  for (const t of s.tiles) {
    if (t.owner !== city.id || t.cityId !== null) continue;
    t.terrain = 'desert'; t.resource = null; t.improvement = null; t.road = false; t.village = false; t.ruin = false;
  }
  s.units = s.units.filter((u) => u.owner !== 0 || (u.x === city.x && u.y === city.y));
  return { s, city };
}

/** Free tiles of the capital's territory, nearest first. */
const freeTiles = (s: GameState, cid: number): Tile[] =>
  s.tiles.filter((t) => t.owner === cid && t.cityId === null && !s.units.some((u) => u.x === t.x && u.y === t.y));

test('House of Wisdom: a tech a met empire knows costs 40% less for Arabia, 20% for others', () => {
  const s = createGame({ seed: 7, human: 'arabia', opponents: ['japan', 'mongols'], mode: 'domination' });
  const tech = 'farming';
  for (const pid of [0, 1]) assert.ok(!s.players[pid].techs.includes(tech));
  const fullA = techCost(s, 0, tech), fullJ = techCost(s, 1, tech);
  s.players[2].techs.push(tech);
  assert.equal(techCost(s, 0, tech), fullA, 'not before meeting them');
  s.players[0].met = [2];
  s.players[1].met = [2];
  assert.equal(WISDOM_OFF, 0.4);
  assert.equal(techCost(s, 0, tech), Math.ceil(fullA * (1 - WISDOM_OFF)), 'Arabia: 40% off');
  assert.equal(techCost(s, 1, tech), Math.ceil(fullJ * (1 - CONTACT_OFF)), 'others: 20% off');
  assert.ok(techCost(s, 0, tech) < techCost(s, 1, tech) || fullA < fullJ);
});

test('caravanserai: built by an action, cost grows by 2 for each one held', () => {
  const { s, city } = setup();
  const p = s.players[0];
  p.stars = 100;
  const tiles = freeTiles(s, city.id);
  const a = tiles[0];
  const act = tileActions(s, 0, a).find((x) => x.id === 'mech:caravanserai');
  assert.ok(act && act.enabled, 'offered on free desert in the borders');
  assert.equal(act.cost, CARAVANSERAI_BASE);
  assert.ok(doAction(s, 0, a, 'mech:caravanserai'));
  assert.equal(a.improvement, 'caravanserai');
  assert.equal(p.stars, 100 - CARAVANSERAI_BASE);
  assert.equal(caravanseraiCost(s, 0), CARAVANSERAI_BASE + CARAVANSERAI_STEP);
  const b = tiles.find((t) => !caravanseraiWhy(s, 0, t))!;
  assert.ok(b);
  const act2 = tileActions(s, 0, b).find((x) => x.id === 'mech:caravanserai')!;
  assert.equal(act2.cost, 8);
  assert.ok(doAction(s, 0, b, 'mech:caravanserai'));
  assert.equal(caravanserais(s, 0).length, 2);
  assert.equal(caravanseraiCost(s, 0), 10);
  JSON.parse(JSON.stringify(s));
});

test('caravanserai: placement limits', () => {
  const { s, city } = setup();
  s.players[0].stars = 100;
  const a = freeTiles(s, city.id)[0];
  assert.ok(doAction(s, 0, a, 'mech:caravanserai'));
  // not beside another one
  const next = neighbors(s, a.x, a.y).find((n) => n.owner === city.id && n.cityId === null)!;
  assert.match(caravanseraiWhy(s, 0, next)!, /close/);
  assert.equal(tileActions(s, 0, next).find((x) => x.id === 'mech:caravanserai')?.enabled, false);
  // only on open desert or field, empty, inside the borders
  const t = freeTiles(s, city.id).find((x) => !caravanseraiWhy(s, 0, x))!;
  t.terrain = 'forest';
  assert.ok(caravanseraiWhy(s, 0, t));
  t.terrain = 'field';
  assert.equal(caravanseraiWhy(s, 0, t), null, 'field is fine');
  t.resource = 'fruit';
  assert.ok(caravanseraiWhy(s, 0, t), 'not on a resource');
  t.resource = null;
  t.improvement = 'farm';
  assert.ok(caravanseraiWhy(s, 0, t), 'not on an improvement');
  t.improvement = null;
  assert.ok(caravanseraiWhy(s, 0, tileAt(s, city.x, city.y)!), 'not on the city');
  const outside = s.tiles.find((x) => tileOwnerPlayer(s, x) === null && x.terrain === 'field' && !x.village)!;
  assert.match(caravanseraiWhy(s, 0, outside)!, /borders/);
  assert.ok(!doAction(s, 0, outside, 'mech:caravanserai'));
  // only Arabia builds them
  assert.equal(tileActions(s, 1, outside).some((x) => x.id === 'mech:caravanserai'), false);
});

test('caravanserai income: +1 each, +1 more beside a road or trade route', () => {
  const { s, city } = setup();
  s.players[0].stars = 100;
  const a = freeTiles(s, city.id)[0];
  assert.ok(doAction(s, 0, a, 'mech:caravanserai'));
  assert.equal(caravanseraiStars(s, a), 1);
  assert.equal(caravanIncome(s, 0), 1);
  assert.equal(hookIncome(s, 0) >= 1, true);
  const n = neighbors(s, a.x, a.y)[0];
  n.road = true;
  assert.equal(caravanseraiStars(s, a), 2, 'a road beside it');
  n.road = false;
  s.trade = { routes: [{ id: 1, a: city.id, b: city.id, pa: 0, pb: 0, by: 0, sea: false, path: [a.y * s.size + a.x], since: 0 }] };
  assert.equal(caravanseraiStars(s, a), 2, 'a trade route over it');
  s.trade = { routes: [] };
  const b = freeTiles(s, city.id).find((t) => !caravanseraiWhy(s, 0, t))!;
  assert.ok(doAction(s, 0, b, 'mech:caravanserai'));
  b.road = true;
  assert.equal(caravanIncome(s, 0), 1 + 2);
  assert.equal(caravanIncome(s, 1), 0, 'other empires hold none');
});

test('desert roads: Arabian camels cross desert at half cost; others and horses do not', () => {
  const { s, city } = setup();
  // nobody else nearby (an enemy beside a tile stops a move there)
  s.units = s.units.filter((u) => Math.max(Math.abs(u.x - city.x), Math.abs(u.y - city.y)) > 8);
  const reach = (kind: 'camelrider' | 'rider', owner: number) => {
    const u = spawnUnit(s, kind, owner, city.x, city.y, null);
    u.moved = false;
    const opts = moveOptions(s, u);
    s.units = s.units.filter((e) => e !== u);
    return { n: opts.length, far: Math.max(0, ...opts.map((o) => Math.max(Math.abs(o.x - city.x), Math.abs(o.y - city.y)))) };
  };
  const camel = reach('camelrider', 0), rider = reach('rider', 0);
  assert.ok(rider.n > 0);
  assert.ok(camel.n > rider.n, `camel ${camel.n} > rider ${rider.n}`);
  assert.ok(camel.far >= 3, 'a 2-move camel covers 3+ tiles of sand');
  assert.equal(rider.far, 2, 'a horse walks the sand at full cost');
  // the same unit for another empire gets no such help
  const foe = reach('camelrider', 1);
  assert.equal(foe.far, 2, 'a foreign camel rider walks normally');
});

test('AI builds a few caravanserais when it has stars to spare', () => {
  const { s } = setup();
  s.players[0].human = false;
  s.players[0].stars = 40;
  aiTurn(s);
  const n = caravanserais(s, 0).length;
  assert.ok(n >= 1, 'built at least one');
  assert.ok(n <= 5, 'but only a few');
});

test('20-turn all-AI game with Arabia completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['arabia', 'japan', 'mongols'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 20 && guard++ < 1000) {
    aiTurn(s);
    endTurn(s);
  }
  assert.ok(s.turn >= 20 || s.over);
});

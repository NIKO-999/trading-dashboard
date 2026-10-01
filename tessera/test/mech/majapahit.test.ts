import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { doAction, tileActions } from '../../src/game/rules';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { dist, isLand, neighbors, tileAt } from '../../src/game/grid';
import { endTurn, startTurn } from '../../src/game/turn';
import { hookIncome } from '../../src/game/mech';
import {
  MANDALA_COOLDOWN, MANDALA_COST, MANDALA_TURNS, RAID_LOSS, TRADE_STARS, mandalaCount, mandalaIncome, mech, portVisits,
} from '../../src/game/mech/majapahit';
import type { City, GameState, Tile } from '../../src/game/types';

function setup(diplomacy = true) {
  const s = createGame({ seed: 7, human: 'majapahit', opponents: ['vikings'], mode: 'perfection', diplomacy });
  const me = s.players.findIndex((p) => p.tribe === 'majapahit');
  const foe = s.players.findIndex((p) => p.tribe === 'vikings');
  for (const p of s.players) p.explored.fill(true);
  const city = s.cities.find((c) => c.owner === me)!;
  const port = s.cities.find((c) => c.owner === foe)!;
  s.players[me].stars = 50;
  s.players[foe].stars = 10;
  s.turn = 3;
  return { s, me, foe, city, port };
}

/** Make `n` tiles beside city `c` open shallow water, clear of units, and return them. */
function coast(s: GameState, c: City, n: number): Tile[] {
  const out = neighbors(s, c.x, c.y).filter((t) => t.cityId === null).slice(0, n);
  for (const t of out) {
    t.terrain = 'shallow';
    t.resource = null; t.improvement = null; t.village = false; t.ruin = false; t.data = undefined;
  }
  s.units = s.units.filter((u) => !out.some((t) => t.x === u.x && t.y === u.y));
  return out;
}

const peace = (s: GameState, a: number, b: number) => { s.diplo!.pacts.push({ a, b, kind: 'peace', since: 0 }); };

test('Spice Islands: fish and fruit harvests pay +1 star', () => {
  const { s, me, city } = setup();
  s.players[me].techs.push('gathering', 'fishing');
  const land = s.tiles.find((t) => t.owner === city.id && t.cityId === null && isLand(t) && t.terrain !== 'mountain' && !s.units.some((u) => u.x === t.x && u.y === t.y))!;
  land.terrain = 'field'; land.resource = 'fruit'; land.improvement = null;
  const fruit = tileActions(s, me, land).find((a) => a.id === 'harvest')!;
  assert.ok(fruit?.enabled);
  assert.match(fruit.desc, /Spice Islands/);
  s.players[me].stars = 10;
  assert.ok(doAction(s, me, land, 'harvest'));
  assert.equal(s.players[me].stars, 10 - fruit.cost + 1);

  const sea = coast(s, city, 1)[0];
  sea.owner = city.id; sea.resource = 'fish';
  const fish = tileActions(s, me, sea).find((a) => a.id === 'harvest')!;
  assert.ok(fish?.enabled);
  assert.ok(doAction(s, me, sea, 'harvest'));
  assert.equal(s.players[me].stars, 10 - fruit.cost + 1 - fish.cost + 1);
});

test('a jong beside a friendly foreign port trades for 2 stars; the owner loses nothing', () => {
  const { s, me, foe, port } = setup();
  peace(s, me, foe);
  const [w] = coast(s, port, 1);
  spawnUnit(s, 'ship', me, w.x, w.y, null);
  const v = portVisits(s, me);
  assert.equal(v.length, 1);
  assert.equal(v[0].raid, false);
  mech.turnStart!(s, me);
  assert.equal(s.players[me].stars, 50 + TRADE_STARS);
  assert.equal(s.players[foe].stars, 10);
  assert.equal(s.players[me].mech?.lastTrade, TRADE_STARS);
  // a warship and a trade ship are jongs too; a canoe is not
  s.units = s.units.filter((u) => !(u.x === w.x && u.y === w.y));
  spawnUnit(s, 'boat', me, w.x, w.y, null);
  assert.equal(portVisits(s, me).length, 0, 'canoes do not trade');
  s.units = s.units.filter((u) => !(u.x === w.x && u.y === w.y));
  spawnUnit(s, 'warship', me, w.x, w.y, null);
  assert.equal(portVisits(s, me).length, 1);
});

test('one ship per city, one city per ship', () => {
  const { s, me, foe, port } = setup();
  peace(s, me, foe);
  const ws = coast(s, port, 3);
  for (const w of ws) spawnUnit(s, 'ship', me, w.x, w.y, null);
  assert.equal(portVisits(s, me).length, 1, 'three ships, one port: one pays');
  mech.turnStart!(s, me);
  assert.equal(s.players[me].stars, 50 + TRADE_STARS);
  // a second foreign port beside one of the ships: two ships now each take one
  const w = ws[0];
  const other = neighbors(s, w.x, w.y).find((t) => t.cityId === null && dist(t.x, t.y, port.x, port.y) >= 2 && !s.units.some((u) => u.x === t.x && u.y === t.y))!;
  other.terrain = 'field';
  const c2: City = { ...port, id: 999, name: 'Second', x: other.x, y: other.y, capital: false };
  s.cities.push(c2);
  other.cityId = c2.id;
  const v = portVisits(s, me);
  assert.equal(v.length, 2);
  assert.notEqual(v[0].unit, v[1].unit);
  assert.notEqual(v[0].city, v[1].city);
});

test('at war the visit is a raid: the owner loses 1 star, never below 0', () => {
  const { s, me, foe, port } = setup();
  const [w] = coast(s, port, 1);
  spawnUnit(s, 'ship', me, w.x, w.y, null);
  assert.equal(portVisits(s, me)[0].raid, true);
  mech.turnStart!(s, me);
  assert.equal(s.players[me].stars, 50 + TRADE_STARS);
  assert.equal(s.players[foe].stars, 10 - RAID_LOSS);
  s.players[foe].stars = 0;
  mech.turnStart!(s, me);
  assert.equal(s.players[me].stars, 50 + 2 * TRADE_STARS, 'still paid');
  assert.equal(s.players[foe].stars, 0, 'never below 0');
  assert.equal(s.players[me].mech?.raids, 2);
});

test('no income from your own coast, empty coasts, or ships far from ports', () => {
  const { s, me, city, port } = setup();
  const [own] = coast(s, city, 1);
  spawnUnit(s, 'ship', me, own.x, own.y, null);
  // empty sea far from any city
  const far = s.tiles.find((t) => s.cities.every((c) => dist(c.x, c.y, t.x, t.y) > 3) && !s.units.some((u) => u.x === t.x && u.y === t.y))!;
  far.terrain = 'shallow';
  spawnUnit(s, 'ship', me, far.x, far.y, null);
  // two tiles off the foreign port
  coast(s, port, 1);
  assert.equal(portVisits(s, me).length, 0);
  mech.turnStart!(s, me);
  assert.equal(s.players[me].stars, 50);
  assert.equal(mech.income!(s, me), 0);
});

test('Mandala tribute: +1 star a turn per visited port for 5 turns, every 6 turns', () => {
  const { s, me, foe, city, port } = setup();
  peace(s, me, foe);
  const capT = tileAt(s, city.x, city.y)!;
  let act = tileActions(s, me, capT).find((a) => a.id === 'mech:mandala')!;
  assert.ok(act && !act.enabled && /foreign port/.test(act.reason ?? ''), 'needs a ship at a port');
  const [w] = coast(s, port, 1);
  spawnUnit(s, 'ship', me, w.x, w.y, null);
  assert.equal(mandalaCount(s, me), 1);
  act = tileActions(s, me, capT).find((a) => a.id === 'mech:mandala')!;
  assert.ok(act.enabled);
  assert.equal(act.cost, MANDALA_COST);
  assert.ok(doAction(s, me, capT, 'mech:mandala'));
  assert.equal(s.players[me].stars, 50 - MANDALA_COST);
  assert.equal(mandalaIncome(s, me), 0, 'starts next turn');
  const t0 = s.turn;
  for (let i = 1; i <= MANDALA_TURNS; i++) { s.turn = t0 + i; assert.equal(mandalaIncome(s, me), 1); assert.ok(hookIncome(s, me) >= 1); }
  s.turn = t0 + MANDALA_TURNS + 1;
  assert.equal(mandalaIncome(s, me), 0);
  s.turn = t0 + MANDALA_COOLDOWN - 1;
  assert.ok(!tileActions(s, me, capT).find((a) => a.id === 'mech:mandala')!.enabled, 'cooling down');
  s.turn = t0 + MANDALA_COOLDOWN;
  assert.ok(tileActions(s, me, capT).find((a) => a.id === 'mech:mandala')!.enabled);
  // not elsewhere, not for others
  assert.ok(!tileActions(s, foe, tileAt(s, port.x, port.y)!).some((a) => a.id === 'mech:mandala'));
  JSON.parse(JSON.stringify(s));
});

test('AI: idle jongs sail to lie beside a foreign port, and the game plays on', () => {
  const { s, me, foe, port } = setup();
  peace(s, me, foe);
  s.players[me].human = false;
  // a lane of shallow water running up to the foreign port
  const [w] = coast(s, port, 1);
  const dx = Math.sign(w.x - port.x) || 1, dy = Math.sign(w.y - port.y);
  const lane: Tile[] = [];
  for (let i = 1; i <= 3; i++) {
    const t = tileAt(s, w.x + dx * i, w.y + dy * i);
    if (!t || t.cityId !== null) break;
    t.terrain = 'shallow'; t.resource = null; t.improvement = null; t.village = false; t.ruin = false;
    s.units = s.units.filter((u) => !(u.x === t.x && u.y === t.y));
    lane.push(t);
  }
  assert.ok(lane.length >= 2, 'room for a lane');
  const end = lane[lane.length - 1];
  const ship = spawnUnit(s, 'ship', me, end.x, end.y, null);
  ship.moved = false;
  assert.equal(portVisits(s, me).length, 0);
  s.current = me;
  let n = 0;
  while (mech.ai!(s, me) && n++ < 20);
  assert.ok(dist(ship.x, ship.y, port.x, port.y) < dist(end.x, end.y, port.x, port.y), 'sailed toward the port');
  // a few full AI turns run without trouble
  for (const p of s.players) p.human = false;
  for (let i = 0; i < 6; i++) { startTurn(s); aiTurn(s); endTurn(s); }
  JSON.parse(JSON.stringify(s));
});

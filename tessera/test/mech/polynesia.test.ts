import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { aiTurn } from '../../src/game/ai';
import { attack, citiesOf, doAction, moveOptions, moveUnit, tileActions, unitAt } from '../../src/game/rules';
import { endTurn, startTurn } from '../../src/game/turn';
import { dist, isLand, isWater, neighbors, tileAt } from '../../src/game/grid';
import { counter, isWaka, isWild, sailTargets, tapuIncome, wakasOf, wildIncome } from '../../src/game/mech/polynesia';
import type { GameState, Tile } from '../../src/game/types';

function setup(seed = 7, terrain?: 'balanced' | 'islands' | 'pangaea') {
  const s = createGame({ seed, human: 'polynesia', opponents: ['japan'], mode: 'perfection', terrain });
  const me = s.players.findIndex((p) => p.tribe === 'polynesia');
  for (const p of s.players) p.explored.fill(true);
  const city = s.cities.find((c) => c.owner === me)!;
  s.players[me].stars = 50;
  return { s, me, city };
}
const nextMine = (s: GameState, me: number) => { do endTurn(s); while (s.current !== me); };
const free = (s: GameState, ts: Tile[]) => { s.units = s.units.filter((u) => !ts.some((t) => t.x === u.x && t.y === u.y)); };

test('a human Maori game starts with NO land capital: the capital is a Great Waka on the sea', () => {
  for (const seed of [1, 2, 3, 7, 11, 23]) for (const terrain of [undefined, 'islands', 'pangaea'] as const) {
    const { s, me, city } = setup(seed, terrain);
    const t = tileAt(s, city.x, city.y)!;
    assert.ok(isWater(t), `capital on water (seed ${seed}, ${terrain})`);
    assert.ok(city.capital && isWaka(city));
    assert.equal(t.cityId, city.id);
    assert.equal(citiesOf(s, me).filter((c) => isLand(tileAt(s, c.x, c.y)!)).length, 0, 'no land city at all');
    assert.ok(t.owner === city.id && neighbors(s, city.x, city.y).every((n) => n.owner === city.id || n.owner !== null), 'borders follow the waka');
    const u = s.units.find((k) => k.owner === me)!;
    assert.equal(dist(u.x, u.y, city.x, city.y), 1, 'the first unit is beside the waka');
    assert.ok(s.players[me].explored[city.y * s.size + city.x]);
    JSON.parse(JSON.stringify(s));
  }
});

test('the waka city trains units onto a tile beside it, even when the city tile holds a boat', () => {
  const { s, me, city } = setup();
  s.units = s.units.filter((u) => u.owner !== me);
  city.units = 0;
  const acts = tileActions(s, me, tileAt(s, city.x, city.y)!).filter((a) => a.id.startsWith('train:'));
  assert.ok(acts.some((a) => a.enabled), 'training is offered');
  const a = acts.find((x) => x.enabled)!;
  assert.ok(doAction(s, me, tileAt(s, city.x, city.y)!, a.id));
  const u = s.units.find((k) => k.owner === me)!;
  assert.equal(dist(u.x, u.y, city.x, city.y), 1);
  assert.equal(u.homeCity, city.id);
  if (isWater(tileAt(s, u.x, u.y)!)) assert.ok(u.carrying && u.data?.voyager, 'afloat as a boat carrying the recruit');
  else assert.ok(!u.carrying);
});

test('mech:sail moves the city and its borders up to 3 water tiles, once a turn', () => {
  const { s, me, city } = setup();
  const start = tileAt(s, city.x, city.y)!;
  const targets = sailTargets(s, city);
  assert.ok(targets.length > 0);
  const far = targets.find((t) => dist(t.x, t.y, city.x, city.y) >= 2 && !unitAt(s, t.x, t.y)) ?? targets[0];
  assert.ok(dist(far.x, far.y, city.x, city.y) <= 3);
  const act = tileActions(s, me, far).find((a) => a.id === 'mech:sail');
  assert.ok(act?.enabled, 'the human sees an enabled Sail action on a water tile');
  assert.ok(doAction(s, me, far, 'mech:sail'));
  assert.equal(start.cityId, null);
  assert.equal(far.cityId, city.id);
  assert.deepEqual([city.x, city.y], [far.x, far.y]);
  assert.equal(far.owner, city.id);
  assert.ok(s.tiles.filter((t) => t.owner === city.id).every((t) => dist(t.x, t.y, city.x, city.y) <= city.borderRadius), 'borders moved with it');
  assert.equal(counter(s, me, 'sails'), 1);
  const again = sailTargets(s, city)[0];
  assert.equal(tileActions(s, me, again).find((a) => a.id === 'mech:sail')?.enabled, false, 'once per turn');
  nextMine(s, me);
  assert.equal(tileActions(s, me, sailTargets(s, city)[0]).find((a) => a.id === 'mech:sail')?.enabled, true, 'ready again next turn');
});

test('enemy units block the sailing lane', () => {
  const { s, me, city } = setup();
  const targets = sailTargets(s, city);
  const t = targets.find((k) => dist(k.x, k.y, city.x, city.y) === 1)!;
  spawnUnit(s, 'boat', 1 - me, t.x, t.y, null);
  assert.ok(!sailTargets(s, city).includes(t));
});

test('a floating city drinks fish and whales in its borders into its population, no port needed', () => {
  const { s, me, city } = setup();
  for (const n of neighbors(s, city.x, city.y)) n.resource = null;
  for (const n of neighbors(s, city.x, city.y).slice(0, 3)) n.terrain = 'shallow';
  const ring = neighbors(s, city.x, city.y).filter(isWater);
  ring[0].resource = 'fish'; ring[1].resource = 'fish'; ring[2].resource = 'whale';
  const before = city.level * 100 + city.pop;
  s.current = me;
  s.turn = 5;
  startTurn(s);
  assert.equal(ring[0].resource, null);
  assert.equal(ring[2].resource, null);
  assert.ok(city.level * 100 + city.pop > before, 'the people grew');
  assert.equal(counter(s, me, 'absorbed'), 4, 'fish 1+1, whale 2');
});

test('mech:anchor settles the waka on an adjacent coast as a normal land city, and it stops floating', () => {
  const { s, me, city } = setup();
  const shore = neighbors(s, city.x, city.y)[0];
  shore.terrain = 'field'; shore.resource = null; shore.village = false; shore.improvement = null; shore.owner = null;
  free(s, [shore]);
  const act = tileActions(s, me, shore).find((a) => a.id === 'mech:anchor');
  assert.ok(act?.enabled);
  assert.ok(doAction(s, me, shore, 'mech:anchor'));
  assert.ok(!isWaka(city) && city.capital);
  assert.equal(shore.cityId, city.id);
  assert.ok(isLand(tileAt(s, city.x, city.y)!));
  assert.equal(counter(s, me, 'anchors'), 1);
  assert.ok(!tileActions(s, me, neighbors(s, city.x, city.y).find(isWater)!).some((a) => a.id === 'mech:sail'), 'cannot sail any more');
  // a new Great Waka can be built in a harbour for stars
  const h = neighbors(s, city.x, city.y, 2).find((t) => dist(t.x, t.y, city.x, city.y) === 2 && t.cityId === null)!;
  h.terrain = 'shallow'; h.resource = null; h.owner = city.id;
  for (const n of neighbors(s, h.x, h.y)) if (dist(n.x, n.y, city.x, city.y) === 1) { n.terrain = 'field'; n.owner = city.id; }
  free(s, [h]);
  const w = tileActions(s, me, h).find((a) => a.id === 'mech:waka');
  assert.ok(w?.enabled, w?.reason ?? 'no waka action');
  const stars = s.players[me].stars;
  assert.ok(doAction(s, me, h, 'mech:waka'));
  assert.equal(s.players[me].stars, stars - w!.cost);
  assert.equal(wakasOf(s, me).length, 1);
  assert.ok(isWater(tileAt(s, wakasOf(s, me)[0].x, wakasOf(s, me)[0].y)!));
  assert.equal(counter(s, me, 'wakas'), 1);
});

test("Tane's Tapu: no farms, mines, lumber huts or ports", () => {
  const { s, me, city } = setup();
  const t = neighbors(s, city.x, city.y, 1).find((n) => isLand(n)) ?? neighbors(s, city.x, city.y, 2).find((n) => isLand(n))!;
  t.owner = city.id; t.terrain = 'field'; t.resource = 'crop'; t.improvement = null; t.village = false;
  free(s, [t]);
  s.players[me].techs.push('farming', 'forestry', 'mining', 'fishing');
  const farm = tileActions(s, me, t).find((a) => a.id === 'farm');
  assert.equal(farm?.enabled, false);
  assert.match(farm?.reason ?? '', /Tapu/);
  assert.equal(doAction(s, me, t, 'farm'), false);
  const sea = neighbors(s, city.x, city.y).find(isWater)!;
  sea.owner = city.id; sea.terrain = 'shallow'; sea.resource = null;
  assert.equal(tileActions(s, me, sea).find((a) => a.id === 'port')?.enabled ?? false, false);
  t.terrain = 'forest'; t.resource = null;
  assert.equal(tileActions(s, me, t).find((a) => a.id === 'lumber')?.enabled ?? false, false);
});

test("Tane's Tapu: wild tiles pay stars by adjacent pairs, capped by level; working a tile ends its payout", () => {
  const { s, me, city } = setup();
  assert.ok(neighbors(s, city.x, city.y).every((n) => isWild(n) || n.owner !== city.id || n.village));
  const inc = tapuIncome(s, me);
  assert.equal(inc, wildIncome(s, city));
  assert.equal(inc, 1, 'level 1: cap 1');
  city.level = 3;
  assert.equal(wildIncome(s, city), 3);
  city.level = 9;
  assert.equal(wildIncome(s, city), 4, 'capped');
  // the cap is the ceiling; strip the wild tiles and the income goes
  for (const t of s.tiles) if (t.owner === city.id) t.improvement = 'temple';
  assert.equal(wildIncome(s, city), 0);
});

test('a ship on an enemy waka city captures it; an occupied city tile is protected', () => {
  const { s, me, city } = setup();
  const foe = 1 - me;
  s.units = s.units.filter((u) => u.owner !== foe);
  const spot = neighbors(s, city.x, city.y).find(isWater)!;
  free(s, [spot]);
  const ship = spawnUnit(s, 'ship', foe, spot.x, spot.y, null);
  ship.moved = false; ship.attacked = false;
  s.current = foe;
  assert.ok(moveOptions(s, ship).some((o) => o.x === city.x && o.y === city.y), 'the ship can sail onto the city tile');
  assert.ok(moveUnit(s, ship, city.x, city.y));
  ship.moved = false; ship.attacked = false;
  assert.ok(tileActions(s, foe, tileAt(s, city.x, city.y)!).some((a) => a.id === 'capture' && a.enabled));
  assert.ok(doAction(s, foe, tileAt(s, city.x, city.y)!, 'capture'));
  assert.equal(city.owner, foe);
  void attack;
});

test('AI Maori sail toward fish, and a 20-turn all-AI game completes with sailing', () => {
  const s = createGame({ seed: 11, human: 'polynesia', opponents: ['japan', 'zulu'], mode: 'perfection' });
  for (const p of s.players) p.human = false;
  const me = s.players.findIndex((p) => p.tribe === 'polynesia');
  for (let i = 0; i < 20 * s.players.length && !s.over; i++) { aiTurn(s); endTurn(s); }
  assert.ok(s.turn >= 10);
  assert.ok(counter(s, me, 'sails') > 0, 'the AI sailed');
  JSON.parse(JSON.stringify(s));
});

test('AI Maori anchor on a fertile coast when grown, then launch another waka', () => {
  const { s, me, city } = setup();
  s.players[me].human = false;
  s.turn = 10;
  city.level = 3;
  const shore = neighbors(s, city.x, city.y)[0];
  shore.terrain = 'field'; shore.resource = null; shore.village = false; shore.owner = null;
  free(s, [shore]);
  const lands = neighbors(s, shore.x, shore.y).filter((n) => n.cityId === null && n !== tileAt(s, city.x, city.y)).slice(0, 4);
  for (const n of lands) { n.terrain = 'field'; n.resource = 'fruit'; }
  s.current = me;
  aiTurn(s, 5);
  assert.ok(counter(s, me, 'anchors') >= 1 || counter(s, me, 'sails') >= 1, 'the AI sailed or anchored');
});

test('other empires are unaffected: a non-Maori capital stays on land', () => {
  const s = createGame({ seed: 7, human: 'japan', opponents: ['polynesia'], mode: 'perfection' });
  const jp = s.cities.find((c) => s.players[c.owner].tribe === 'japan')!;
  assert.ok(isLand(tileAt(s, jp.x, jp.y)!));
  const mp = s.cities.find((c) => s.players[c.owner].tribe === 'polynesia')!;
  assert.ok(isWater(tileAt(s, mp.x, mp.y)!), 'AI Maori also start afloat');
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { doAction, moveOptions, moveUnit, tileActions } from '../../src/game/rules';
import { isLand, neighbors } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { havenOwner, mech, razeValue } from '../../src/game/mech/vikings';
import type { GameState, Tile } from '../../src/game/types';

/** A shore of the enemy's: land tile L owned by the enemy's first city with open water W beside it, and a Viking ship on W. */
function setup() {
  const s = createGame({ seed: 5, human: 'vikings', opponents: ['japan'], mode: 'perfection' });
  s.players[0].explored.fill(true);
  const city = s.cities.find((c) => c.owner === 1)!;
  let land: Tile | undefined;
  let water: Tile | undefined;
  for (const t of s.tiles) {
    if (!isLand(t) || t.cityId !== null || t.village || t.terrain === 'mountain' || s.units.some((u) => u.x === t.x && u.y === t.y)) continue;
    const w = neighbors(s, t.x, t.y).find((n) => !isLand(n) && !s.units.some((u) => u.x === n.x && u.y === n.y));
    if (w && !neighbors(s, t.x, t.y).some((n) => n.cityId !== null)) { land = t; water = w; break; }
  }
  assert.ok(land && water);
  land.owner = city.id;
  land.terrain = 'field';
  land.resource = null;
  land.improvement = null;
  water.terrain = 'shallow';
  const ship = spawnUnit(s, 'ship', 0, water.x, water.y, null);
  ship.carrying = 'warrior';
  ship.moved = false;
  ship.attacked = false;
  s.players[0].stars = 30;
  return { s, city, land, water, ship };
}

test('a ship beaches on the shore and stays a ship', () => {
  const { s, land, ship } = setup();
  const opt = moveOptions(s, ship).find((o) => o.x === land.x && o.y === land.y);
  assert.ok(opt?.beach);
  assert.ok(moveUnit(s, ship, land.x, land.y));
  assert.equal(ship.kind, 'ship');
  assert.equal(ship.carrying, 'warrior');
  assert.equal(ship.attacked, false, 'raiders keep their strike');
  assert.ok(tileActions(s, 0, land).some((a) => a.id === 'mech:unload'));
  assert.ok(doAction(s, 0, land, 'mech:unload'));
  assert.equal(ship.kind, 'warrior');
  assert.equal(ship.carrying, null);
  assert.equal(ship.attacked, true);
});

test("another empire's ship still disembarks normally", () => {
  const { s, land, ship } = setup();
  ship.owner = 1;
  s.players[1].explored.fill(true);
  const opt = moveOptions(s, ship).find((o) => o.x === land.x && o.y === land.y)!;
  assert.ok(!opt.beach);
  moveUnit(s, ship, land.x, land.y);
  assert.equal(ship.kind, 'warrior');
});

test('Danelaw haven siphons 20% of the host city gold and lapses when abandoned', () => {
  const { s, land } = setup();
  const act = tileActions(s, 0, land).find((a) => a.id === 'mech:danelaw');
  assert.ok(act?.enabled);
  const before = s.players[0].stars;
  assert.ok(doAction(s, 0, land, 'mech:danelaw'));
  assert.equal(s.players[0].stars, before - act!.cost);
  assert.equal(havenOwner(land), 0);
  assert.ok(!tileActions(s, 0, land).some((a) => a.id === 'mech:danelaw' && a.enabled), 'one haven per city');
  const cities = s.cities.filter((c) => c.owner === 1).length;
  s.players[1].stars = 20 * cities; // 20 per city -> 4 taken
  const mine = s.players[0].stars;
  mech.turnStart!(s, 0);
  assert.equal(s.players[1].stars, 20 * cities - 4);
  assert.equal(s.players[0].stars, mine + 4);
  s.units = s.units.filter((u) => u.owner !== 0); // fleet gone: haven lapses
  mech.turnStart!(s, 0);
  assert.equal(havenOwner(land), null);
  JSON.parse(JSON.stringify(s));
});

test('an enemy stepping onto a haven evicts it', () => {
  const { s, land } = setup();
  doAction(s, 0, land, 'mech:danelaw');
  const e = spawnUnit(s, 'warrior', 1, land.x, land.y, null);
  mech.afterMove!(s, 0, e, { x: land.x, y: land.y }, land);
  assert.equal(havenOwner(land), null);
});

test('markets and temples are blocked for Vikings only', () => {
  const s = createGame({ seed: 5, human: 'vikings', opponents: ['japan'], mode: 'perfection' });
  const t = s.tiles[0];
  assert.equal(mech.block!(s, 0, 0, 'market', t), 'Vikings raid instead of trading');
  assert.notEqual(mech.block!(s, 0, 0, 'temple', t), undefined);
  assert.equal(mech.block!(s, 0, 1, 'market', t), undefined);
  assert.equal(mech.block!(s, 0, 0, 'farm', t), undefined);
});

test('razing pays 3x the cost, costs the host a citizen and gives a captive', () => {
  const { s, city, land } = setup();
  land.improvement = 'market'; // 8 stars -> 24
  const raider = spawnUnit(s, 'warrior', 0, land.x, land.y, null);
  raider.moved = raider.attacked = false;
  const home = s.cities.find((c) => c.owner === 0)!;
  raider.homeCity = home.id;
  city.level = 2; city.pop = 2;
  home.pop = 0;
  const stars = s.players[0].stars;
  const act = tileActions(s, 0, land).find((a) => a.id === 'mech:raze');
  assert.ok(act?.enabled);
  assert.ok(doAction(s, 0, land, 'mech:raze'));
  assert.equal(razeValue('market'), 24);
  assert.equal(s.players[0].stars, stars + 24);
  assert.equal(land.improvement, null);
  assert.equal(city.pop, 1);
  assert.equal(home.pop, 1);
  assert.ok(!tileActions(s, 0, land).some((a) => a.id === 'mech:raze'));
  assert.equal(s.players[0].mech?.captives, 1);
});

test('AI razes, founds havens and unloads', () => {
  const { s, land, ship } = setup();
  land.improvement = 'farm';
  const raider = spawnUnit(s, 'warrior', 0, land.x, land.y, null);
  raider.moved = raider.attacked = false;
  const stars = s.players[0].stars;
  assert.ok(mech.ai!(s, 0));
  assert.equal(land.improvement, null);
  assert.equal(s.players[0].stars, stars + 15);
  s.units = s.units.filter((u) => u !== raider);
  assert.ok(mech.ai!(s, 0)); // ship next to enemy shore: haven
  assert.equal(havenOwner(land), 0);
  moveUnit(s, ship, land.x, land.y);
  ship.moved = false;
  assert.ok(mech.ai!(s, 0));
  assert.equal(ship.kind, 'warrior');
});

test('20-turn all-AI game with Vikings completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['vikings', 'japan', 'mongols'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 20 && guard++ < 1000) { aiTurn(s); endTurn(s); }
  assert.ok(s.turn >= 20 || s.over);
  JSON.parse(JSON.stringify(s));
});

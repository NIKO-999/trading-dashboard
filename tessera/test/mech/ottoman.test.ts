import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { aiTurn } from '../../src/game/ai';
import { doAction, income, previewCombat, tileActions } from '../../src/game/rules';
import { endTurn } from '../../src/game/turn';
import { dist, tileAt } from '../../src/game/grid';
import { LEVY_CAP, TRIBUTE_CAP, eliteOf, elitesTrained, levies, originOf, tributeTotal } from '../../src/game/mech/ottoman';
import { hookIncome } from '../../src/game/mech';
import type { City, GameState } from '../../src/game/types';

function setup(opp: 'persia' | 'rome' = 'persia', third = false) {
  const s = createGame({ seed: 7, human: 'ottoman', opponents: third ? [opp, 'zulu'] : [opp], mode: 'perfection' });
  const me = s.players.findIndex((p) => p.tribe === 'ottoman');
  for (const p of s.players) p.explored.fill(true);
  s.players[me].stars = 50;
  return { s, me, foe: 1 - me };
}

/** Take an enemy city the real way: a soldier standing on it starts a turn and uses the Capture action. */
function conquer(s: GameState, me: number, city: City) {
  const t = tileAt(s, city.x, city.y)!;
  s.units = s.units.filter((u) => !(u.x === t.x && u.y === t.y));
  const u = spawnUnit(s, 'warrior', me, t.x, t.y, null);
  u.moved = u.attacked = false;
  assert.ok(doAction(s, me, t, 'capture'));
  return t;
}
const enemyCity = (s: GameState, foe: number) => s.cities.find((c) => c.owner === foe)!;

test('capture records the origin and the conquered city trains its old people’s elite through the tile menu', () => {
  const { s, me, foe } = setup();
  const c = enemyCity(s, foe);
  const t = conquer(s, me, c);
  assert.equal(c.owner, me);
  assert.equal(originOf(c), 'persia');
  assert.equal(c.data?.conquered, true);
  assert.equal(eliteOf(c), 'immortal');
  s.units = s.units.filter((u) => !(u.x === t.x && u.y === t.y));
  c.units = 0;
  const act = tileActions(s, me, t).find((a) => a.id === 'mech:train-elite')!;
  assert.ok(act && act.enabled, 'enabled in the tile menu');
  assert.ok(!s.players[me].techs.includes('smithing'), 'no tech needed');
  const before = s.players[me].stars;
  assert.ok(doAction(s, me, t, 'mech:train-elite'));
  assert.equal(s.players[me].stars, before - act.cost);
  assert.ok(s.units.some((u) => u.kind === 'immortal' && u.owner === me && u.x === t.x && u.y === t.y));
  assert.equal(elitesTrained(s, me), 1);
  assert.equal(tileActions(s, me, t).find((a) => a.id === 'mech:train-elite')!.enabled, false, 'tile is occupied now');
  const home = s.cities.find((k) => k.owner === me && k !== c)!;
  assert.equal(tileActions(s, me, tileAt(s, home.x, home.y)!).some((a) => a.id === 'mech:train-elite'), false, 'own cities offer no elite');
});

test('Great Bombards ignore walls; other empires’ catapults do not', () => {
  const { s, me, foe } = setup('rome');
  const c = enemyCity(s, foe);
  c.walls = true;
  const ct = tileAt(s, c.x, c.y)!;
  s.units = s.units.filter((u) => !(u.x === ct.x && u.y === ct.y));
  const inCity = spawnUnit(s, 'warrior', foe, ct.x, ct.y, c.id);
  const spot = s.tiles.find((t) => t.terrain === 'field' && t.cityId === null && !t.resource && !t.improvement && dist(t.x, t.y, c.x, c.y) >= 4
    && t.owner === null && !s.units.some((u) => u.x === t.x && u.y === t.y))!;
  const open = spawnUnit(s, 'warrior', foe, spot.x, spot.y, null);
  const bomb = spawnUnit(s, 'catapult', me, ct.x + 1, ct.y, null);
  const walled = previewCombat(s, bomb, inCity).dmg;
  assert.equal(walled, previewCombat(s, bomb, open).dmg, 'walls and garrison no longer help the defender');
  c.walls = false;
  assert.equal(previewCombat(s, bomb, inCity).dmg, walled);
  // control: an ordinary catapult is blunted by the walls
  c.walls = true;
  const plain = spawnUnit(s, 'catapult', foe, ct.x - 1, ct.y, null);
  const mine = spawnUnit(s, 'warrior', me, ct.x, ct.y + 1, null);
  const myWalls = createGame({ seed: 7, human: 'rome', opponents: ['persia'], mode: 'perfection' });
  const rc = myWalls.cities.find((k) => k.owner === 1)!;
  rc.walls = true;
  const w = spawnUnit(myWalls, 'warrior', 1, rc.x, rc.y, rc.id);
  const cat = spawnUnit(myWalls, 'catapult', 0, rc.x + 1, rc.y, null);
  const field = spawnUnit(myWalls, 'warrior', 1, 0, 0, null);
  myWalls.tiles[0].terrain = 'field'; myWalls.tiles[0].improvement = null;
  assert.ok(previewCombat(myWalls, cat, w).dmg < previewCombat(myWalls, cat, field).dmg, 'walls work against non-Ottoman siege');
  assert.ok(plain && mine);
});

test('Devshirme: tribute scales with level and is capped; the first capture levies +1 population on the nearest Ottoman city', () => {
  const { s, me, foe } = setup('persia', true); // a third empire keeps the game running
  const home = s.cities.find((k) => k.owner === me)!;
  const c = enemyCity(s, foe);
  const beforePop = home.pop + home.level * 100;
  conquer(s, me, c);
  assert.equal(levies(s, me), 1);
  assert.ok(home.pop + home.level * 100 > beforePop, 'nearest Ottoman city grew');
  assert.equal(c.data?.levied, true);
  assert.equal(tributeTotal(s, me), Math.ceil(c.level / 2));
  assert.equal(hookIncome(s, me), tributeTotal(s, me));
  c.level = 3;
  assert.equal(tributeTotal(s, me), 2);
  s.current = 2;
  s.players[me].stars = 10;
  endTurn(s); // the tribute is paid at the start of the Ottoman turn with the ordinary income
  assert.equal(s.current, me);
  assert.equal(s.players[me].stars, 10 + income(s, me) + 2);
  // capturing the same city again does not levy twice
  c.owner = foe; c.data!.conquered = false;
  conquer(s, me, c);
  assert.equal(levies(s, me), 1);
  // cap on the whole empire
  for (let i = 0; i < 5; i++) s.cities.push({ ...c, id: 900 + i, owner: me, level: 9, data: { origin: 'persia', conquered: true } });
  assert.equal(tributeTotal(s, me), TRIBUTE_CAP);
  assert.ok(LEVY_CAP >= 1);
});

test('20-turn all-AI game with Ottoman completes and the AI uses the elite training', () => {
  const s = createGame({ seed: 11, human: 'ottoman', opponents: ['persia', 'zulu'], mode: 'perfection' });
  for (const p of s.players) { p.human = false; p.explored.fill(true); }
  const me = s.players.findIndex((p) => p.tribe === 'ottoman');
  const c = s.cities.find((k) => k.owner !== me)!; // an early conquest gives the AI's mechanic something to work with
  conquer(s, me, c);
  s.units = s.units.filter((u) => !(u.x === c.x && u.y === c.y));
  c.units = 0;
  s.players[me].stars = 20;
  s.current = me;
  for (let i = 0; i < 20 * s.players.length && !s.over; i++) { aiTurn(s); endTurn(s); }
  assert.ok(s.turn >= 10);
  assert.ok(elitesTrained(s, me) >= 1, 'the AI trained an elite');
  assert.ok(levies(s, me) >= 1);
  JSON.parse(JSON.stringify(s));
});

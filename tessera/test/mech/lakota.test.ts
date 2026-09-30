import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { aiTurn } from '../../src/game/ai';
import { applyReward, cityById, doAction, rewardOptions, tileActions } from '../../src/game/rules';
import { endTurn, startTurn } from '../../src/game/turn';
import { hookBlock, hookIncome } from '../../src/game/mech';
import { dist, neighbors, tileAt } from '../../src/game/grid';
import {
  camp, campReach, counter, herdIncome, herdsIn, isHerd, isPacked, mech, MOVE_RANGE, migrateHerds, SOIL_TURNS, soilOf,
} from '../../src/game/mech/lakota';
import type { City, GameState, Tile } from '../../src/game/types';

function setup(seed = 7) {
  const s = createGame({ seed, human: 'lakota', opponents: ['japan'], mode: 'perfection', naturals: false }); // exact star counts: no Natural Wonder to discover (see test/naturals)
  const me = s.players.findIndex((p) => p.tribe === 'lakota');
  for (const p of s.players) p.explored.fill(true);
  const city = s.cities.find((c) => c.owner === me)!;
  s.players[me].stars = 50;
  return { s, me, city };
}

/** A clean 9x9 patch of open plains around the city, so the tests do not depend on the generated terrain. */
function plains(s: GameState, c: City) {
  for (let dy = -6; dy <= 6; dy++)
    for (let dx = -6; dx <= 6; dx++) {
      const t = tileAt(s, c.x + dx, c.y + dy);
      if (!t || t.cityId !== null) continue;
      t.terrain = 'field'; t.resource = null; t.improvement = null; t.village = false; t.ruin = false; t.data = undefined;
      if (t.owner !== c.id) t.owner = null;
    }
}
const clearUnits = (s: GameState) => { s.units = s.units.filter((u) => u.owner !== 0 || u.homeCity === null); s.units.length = 0; };
const act = (s: GameState, me: number, t: Tile, id: string) => {
  const a = tileActions(s, me, t).find((x) => x.id === id);
  assert.ok(a, `${id} is offered on the tile menu`);
  assert.ok(a.enabled, `${id} is enabled (${a.reason})`);
  assert.ok(doAction(s, me, t, id), `${id} runs`);
};
const nextTurn = (s: GameState, me: number) => { do endTurn(s); while (s.current !== me && !s.over); };
const cityTile = (s: GameState, c: City) => tileAt(s, c.x, c.y)!;

test('pack, move-camp and settle relocate the whole city through the tile menu', () => {
  const { s, me, city } = setup();
  plains(s, city); clearUnits(s);
  city.level = 3; city.pop = 1; city.capital = true; city.units = 2; city.data = { keep: 'me' };
  const id = city.id, oldX = city.x, oldY = city.y;
  const ring = s.tiles.filter((t) => t.owner === id && t.cityId === null);
  assert.ok(ring.length >= 8);
  // pack: territory is released and becomes soil
  act(s, me, cityTile(s, city), 'mech:pack');
  assert.ok(isPacked(city));
  assert.equal(s.tiles.filter((t) => t.owner === id).length, 1, 'a packed camp keeps only its own tile');
  assert.ok(ring.every((t) => soilOf(t)?.n === SOIL_TURNS));
  assert.equal(tileActions(s, me, cityTile(s, city)).find((a) => a.id === 'train:warrior')?.enabled, false);
  // move: range 3 only, and once per turn
  const far = tileAt(s, oldX + 4, oldY)!;
  assert.equal(tileActions(s, me, far).find((a) => a.id === 'mech:move-camp'), undefined, 'not offered beyond range 3');
  const to = tileAt(s, oldX + 3, oldY)!;
  assert.equal(tileActions(s, me, to).find((a) => a.id === 'mech:move-camp')?.enabled, true);
  const before = s.players[me].stars;
  act(s, me, to, 'mech:move-camp');
  assert.equal(s.players[me].stars, before - 1);
  assert.deepEqual([city.x, city.y], [oldX + 3, oldY]);
  assert.equal(cityById(s, id), city, 'same City object and id');
  assert.equal(to.cityId, id);
  assert.equal(tileAt(s, oldX, oldY)!.cityId, null);
  assert.equal(tileAt(s, oldX, oldY)!.owner, null);
  assert.ok(soilOf(tileAt(s, oldX, oldY)!));
  const again = tileAt(s, oldX + 4, oldY)!;
  assert.equal(tileActions(s, me, again).find((a) => a.id === 'mech:move-camp')?.enabled, false, 'once per turn');
  assert.equal(doAction(s, me, again, 'mech:move-camp'), false);
  // settle: territory around the new tile, everything else intact
  act(s, me, to, 'mech:settle');
  assert.ok(!isPacked(city));
  assert.ok(s.tiles.filter((t) => t.owner === id).length >= 9);
  assert.equal(s.tiles.filter((t) => t.owner === id && dist(t.x, t.y, oldX, oldY) <= 1 && dist(t.x, t.y, city.x, city.y) > 1).length, 0, 'old tiles are not held');
  assert.equal(city.level, 3);
  assert.equal(city.pop, 1);
  assert.ok(city.capital);
  assert.equal(city.units, 2);
  assert.deepEqual(city.data!.keep, 'me');
  // cannot pack again straight away
  assert.equal(tileActions(s, me, to).find((a) => a.id === 'mech:pack')?.enabled, false);
  assert.equal(counter(s, me, 'moves'), 1);
  JSON.stringify(s);
});

test('a caravan crosses only open plains and cannot land on cities, resources or enemies', () => {
  const { s, me, city } = setup();
  plains(s, city); clearUnits(s);
  act(s, me, cityTile(s, city), 'mech:pack');
  const reach = campReach(s, city);
  assert.ok(reach.length > 20 && reach.every((t) => dist(t.x, t.y, city.x, city.y) <= MOVE_RANGE));
  const wall = [-1, 0, 1].flatMap((dy) => [tileAt(s, city.x + 1, city.y + dy)!]);
  for (const t of wall) t.terrain = 'forest';
  assert.ok(!campReach(s, city).some((t) => t.x === city.x + 3 && t.y === city.y), 'forest blocks the way east');
  const goal = tileAt(s, city.x - 2, city.y)!;
  goal.resource = 'fruit';
  assert.equal(tileActions(s, me, goal).find((a) => a.id === 'mech:move-camp')?.enabled, false);
  goal.resource = null;
  spawnUnit(s, 'warrior', 1, goal.x, goal.y, null);
  assert.equal(tileActions(s, me, goal).find((a) => a.id === 'mech:move-camp'), undefined);
  s.units.length = 0;
  s.players[me].stars = 0;
  assert.equal(tileActions(s, me, goal).find((a) => a.id === 'mech:move-camp')?.enabled, false, 'needs 1 star');
});

test('workshop and walls are blocked, and the level rewards are swapped', () => {
  const { s, me, city } = setup();
  const t = cityTile(s, city);
  for (const id of ['workshop', 'walls', 'temple', 'market']) assert.ok(hookBlock(s, me, id, t), `${id} blocked`);
  const ids = (lv: number) => rewardOptions(lv, 'lakota').map((o) => o.id);
  assert.ok(!ids(2).includes('workshop') && !ids(3).includes('walls'));
  assert.ok(rewardOptions(2).some((o) => o.id === 'workshop'), 'other empires keep them');
  city.pendingRewards = [2];
  applyReward(s, city, 'workshop');
  assert.equal(city.workshop, false);
  city.pendingRewards = [3];
  applyReward(s, city, 'walls');
  assert.equal(city.walls, false);
});

test('returning to abandoned ground pays once it has ripened; young soil pays nothing', () => {
  const { s, me, city } = setup();
  plains(s, city); clearUnits(s);
  const ox = city.x, oy = city.y;
  act(s, me, cityTile(s, city), 'mech:pack');
  act(s, me, tileAt(s, ox + 3, oy)!, 'mech:move-camp');
  act(s, me, cityTile(s, city), 'mech:settle');
  // settled elsewhere: the soil left behind ages 1 turn per Lakota turn
  nextTurn(s, me); nextTurn(s, me); nextTurn(s, me);
  assert.ok(s.tiles.some((t) => soilOf(t)?.by === me && soilOf(t)!.n < SOIL_TURNS - 1));
  act(s, me, cityTile(s, city), 'mech:pack');
  const back = tileAt(s, ox + 1, oy)!;
  act(s, me, back, 'mech:move-camp');
  const stars = s.players[me].stars, pop = city.pop + city.level * 10;
  act(s, me, cityTile(s, city), 'mech:settle');
  assert.ok(counter(s, me, 'soilTiles') >= 3, 'soil paid');
  assert.ok(s.players[me].stars > stars - 2, 'settling cost 2 and the soil paid back');
  assert.ok(city.pop + city.level * 10 > pop - 1);
  // young soil: pack and settle at once, nothing ripe yet
  const { s: s2, me: me2, city: c2 } = setup();
  plains(s2, c2); clearUnits(s2);
  act(s2, me2, cityTile(s2, c2), 'mech:pack');
  act(s2, me2, tileAt(s2, c2.x + 1, c2.y)!, 'mech:move-camp');
  act(s2, me2, cityTile(s2, c2), 'mech:settle');
  assert.equal(counter(s2, me2, 'soilTiles'), 0);
});

test('herds are marked, walk deterministically, keep to free land and never cross into another empire', () => {
  const a = setup(11), b = setup(11);
  const herds = (s: GameState) => s.tiles.filter(isHerd);
  assert.ok(herds(a.s).length >= 2, 'the map has marked herds');
  const unmarked = a.s.tiles.filter((t) => t.resource === 'animal' && !t.data?.herd).map((t) => `${t.x},${t.y}`);
  const key = (s: GameState) => herds(s).map((t) => `${t.x},${t.y}`).join('|');
  const before = key(a.s);
  for (let i = 0; i < 6; i++) { a.s.turn++; b.s.turn++; migrateHerds(a.s); migrateHerds(b.s); }
  assert.equal(key(a.s), key(b.s), 'same seed, same migration');
  assert.notEqual(key(a.s), before, 'herds actually moved');
  assert.equal(herds(a.s).length, before.split('|').length, 'no herd lost or duplicated');
  assert.deepEqual(a.s.tiles.filter((t) => t.resource === 'animal' && !t.data?.herd).map((t) => `${t.x},${t.y}`), unmarked, 'unmarked animals never move');
  for (const t of herds(a.s)) {
    assert.ok(t.cityId === null && t.terrain !== 'mountain' && t.terrain !== 'shallow' && t.terrain !== 'ocean');
    const owner = t.owner === null ? null : cityById(a.s, t.owner)!.owner;
    assert.ok(owner === null || owner === a.me);
  }
  // a herd inside the Japanese borders stays put
  const jp = a.s.cities.find((c) => c.owner !== a.me)!;
  const pen = neighbors(a.s, jp.x, jp.y).find((t) => t.owner === jp.id && t.terrain === 'field' && t.cityId === null)!;
  pen.resource = 'animal'; pen.data = { herd: { dx: 0, dy: 0 } };
  for (let i = 0; i < 10; i++) { a.s.turn++; migrateHerds(a.s); }
  assert.ok(isHerd(pen), 'penned herd did not leave');
});

test('Follow Herds: a herder on a herd tile in the territory pays double stars; a herd that leaves stops paying', () => {
  const { s, me, city } = setup();
  plains(s, city); clearUnits(s);
  city.level = 2;
  const spot = neighbors(s, city.x, city.y)[0];
  spot.resource = 'animal'; spot.data = { herd: { dx: 0, dy: 0 } };
  assert.equal(herdsIn(s, city).length, 1);
  assert.equal(hookIncome(s, me), 0, 'no herder, no stars');
  const before = s.players[me].stars;
  act(s, me, cityTile(s, city), 'mech:follow');
  assert.equal(s.players[me].stars, before - 1);
  assert.equal(camp(city).herders, 1);
  assert.equal(herdIncome(s, city), 2);
  assert.equal(hookIncome(s, me), 2);
  // hunting a followed herd is blocked; recalling the herders allows it
  assert.equal(tileActions(s, me, spot).find((a) => a.id === 'harvest')?.enabled, false);
  // a second herder has no second herd to work
  act(s, me, cityTile(s, city), 'mech:follow');
  assert.equal(hookIncome(s, me), 2);
  // the herd walks out of the borders: nothing to earn
  spot.resource = null; spot.data = undefined;
  const far = tileAt(s, city.x + 4, city.y)!;
  far.resource = 'animal'; far.data = { herd: { dx: 0, dy: 0 } };
  assert.equal(hookIncome(s, me), 0);
  // follow it: the camp packs, rolls and settles beside it, and the herders earn again
  act(s, me, cityTile(s, city), 'mech:pack');
  assert.equal(herdIncome(s, city), 0);
  act(s, me, tileAt(s, city.x + 3, city.y)!, 'mech:move-camp');
  act(s, me, cityTile(s, city), 'mech:settle');
  assert.ok(herdsIn(s, city).includes(far));
  assert.equal(hookIncome(s, me), 2);
  act(s, me, cityTile(s, city), 'mech:unfollow');
  assert.equal(hookIncome(s, me), 0);
});

test('capturing a packed camp gives an ordinary city to the conqueror', () => {
  const { s, me, city } = setup();
  plains(s, city); clearUnits(s);
  act(s, me, cityTile(s, city), 'mech:pack');
  const foe = s.players.findIndex((p) => p.id !== me);
  const t = cityTile(s, city);
  const u = spawnUnit(s, 'warrior', foe, t.x, t.y, null);
  u.moved = false; u.attacked = false;
  s.players[foe].explored.fill(true);
  assert.ok(doAction(s, foe, t, 'capture'));
  assert.equal(city.owner, foe);
  assert.equal(camp(city).packed, undefined);
  assert.ok(s.tiles.filter((x) => x.owner === city.id).length > 1, 'the conqueror claims territory');
});

test('a road network follows the moving city without paying twice', () => {
  const { s, me, city } = setup();
  plains(s, city); clearUnits(s);
  s.players[me].techs.push('roads');
  for (let i = 1; i <= 7; i++) tileAt(s, city.x + i, city.y)!.road = true;
  city.roadStage = 0;
  act(s, me, cityTile(s, city), 'mech:pack');
  act(s, me, tileAt(s, city.x + 3, city.y)!, 'mech:move-camp');
  assert.ok((city.roadStage ?? 0) >= 1, 'milestones already counted, so moving is no windfall');
  const lvl = city.level + city.pop;
  act(s, me, cityTile(s, city), 'mech:settle');
  assert.ok(city.level + city.pop >= lvl);
});

test('all-AI game: the Lakota AI packs, moves, settles and follows herds; 20 turns complete', () => {
  let packs = 0, moves = 0, follows = 0, settles = 0, steps = 0;
  for (const seed of [3, 11, 21, 33]) {
    const s = createGame({ seed, human: null, opponents: ['lakota', 'rome', 'zulu'], mode: 'perfection' });
    const me = s.players.findIndex((p) => p.tribe === 'lakota');
    startTurn(s);
    let guard = 0;
    while (!s.over && s.turn <= 20 && guard++ < 500) { aiTurn(s); endTurn(s); }
    assert.ok(s.turn > 20 || s.over);
    packs += counter(s, me, 'packs'); moves += counter(s, me, 'moves'); follows += counter(s, me, 'follows');
    settles += counter(s, me, 'settles'); steps += counter(s, me, 'herdSteps');
    for (const c of s.cities.filter((x) => x.owner === me)) {
      const t = tileAt(s, c.x, c.y)!;
      assert.equal(t.cityId, c.id, 'every city sits on its own tile');
      assert.equal(s.cities.filter((k) => k.x === c.x && k.y === c.y).length, 1);
    }
    JSON.stringify(s);
  }
  assert.ok(follows > 0, 'AI assigns herders');
  assert.ok(steps > 0, 'herds migrate');
  console.log(`lakota AI: packs ${packs} moves ${moves} settles ${settles} follows ${follows} herdSteps ${steps}`);
  assert.ok(packs > 0 && moves > 0 && settles > 0, `AI migrates (packs ${packs}, moves ${moves}, settles ${settles})`);
});

test('mechanic describes both layers', () => {
  assert.ok(mech.name.length > 0 && mech.blurb.split('. ').length <= 2);
});

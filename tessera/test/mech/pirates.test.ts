import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { attack, doAction, moveOptions, moveUnit, tileActions, tileOwnerPlayer } from '../../src/game/rules';
import { dist, isLand, neighbors, tileAt } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { LAUNCH_COST, RECRUIT_GAP, RECRUIT_POP, TOLL, TOLL_CAP, WAGE_CAP, WAGE_STEP, cluster, mech, platformsOf, recruitCost, statsOf } from '../../src/game/mech/pirates';
import { popNeeded } from '../../src/game/rules';
import type { GameState, Tile } from '../../src/game/types';

const has = (s: GameState, t: Tile, id: string, enabled = true) => tileActions(s, 0, t).some((a) => a.id === id && a.enabled === enabled);

function game(opp: Parameters<typeof createGame>[0]['opponents'] = ['rome'], seed = 5) {
  const s = createGame({ seed, human: 'pirates', opponents: opp, mode: 'perfection', naturals: false }); // exact star counts: no Natural Wonder to discover (see test/naturals)
  s.players[0].explored.fill(true);
  s.players[0].stars = 40;
  return s;
}
const cap = (s: GameState) => s.cities.find((c) => c.owner === 0 && c.capital)!;
/** A free water tile next to (not on) a platform of the capital cluster. */
const freeWater = (s: GameState, from: Tile, skip: Tile[] = []) =>
  neighbors(s, from.x, from.y).find((n) => !isLand(n) && !skip.includes(n) && !s.units.some((u) => u.x === n.x && u.y === n.y) && !n.resource)!;

test('the capital starts as a floating platform on the sea and the Flotilla owns no land', () => {
  for (const seed of [1, 5, 9, 21]) {
    const s = game(['rome', 'japan'], seed);
    const c = cap(s);
    const t = tileAt(s, c.x, c.y)!;
    assert.equal(t.terrain, 'platform');
    assert.equal(t.cityId, c.id);
    assert.ok(platformsOf(s, 0).length >= 2, 'stitched cluster at the start');
    assert.equal(cluster(s, t, 0).length, platformsOf(s, 0).length);
    const owned = s.tiles.filter((x) => tileOwnerPlayer(s, x) === 0);
    assert.ok(owned.length > 4);
    assert.ok(owned.every((x) => !isLand(x) || x.terrain === 'platform'), 'no land territory');
    assert.ok(s.units.some((u) => u.owner === 0 && u.kind === 'ship'), 'a starting galley');
    assert.ok(s.units.filter((u) => u.owner === 0).every((u) => dist(u.x, u.y, c.x, c.y) <= 1));
    JSON.parse(JSON.stringify(s));
  }
});

test('platforms: built next to a platform, merge into the sea-city and extend its borders', () => {
  const s = game();
  const c = cap(s);
  const home = tileAt(s, c.x, c.y)!;
  const unowned = (t: Tile) => neighbors(s, t.x, t.y).filter((n) => !isLand(n) && n.owner === null).length;
  const w = platformsOf(s, 0).flatMap((p) => neighbors(s, p.x, p.y)).filter((n) => !isLand(n) && !n.resource && !s.units.some((u) => u.x === n.x && u.y === n.y))
    .sort((a, b) => unowned(b) - unowned(a) || a.y - b.y || a.x - b.x)[0];
  assert.ok(unowned(w) > 0, 'open sea beyond the borders');
  assert.ok(has(s, w, 'mech:platform'));
  const owned = s.tiles.filter((t) => t.owner === c.id).length;
  const stars = s.players[0].stars;
  // walk a chain of platforms outwards
  let at = w;
  assert.ok(doAction(s, 0, at, 'mech:platform'));
  assert.equal(w.terrain, 'platform');
  assert.ok(s.players[0].stars < stars);
  assert.ok(cluster(s, home, 0).includes(w), 'merged into one cluster');
  assert.ok(s.tiles.filter((t) => t.owner === c.id).length >= owned);
  for (let i = 0; i < 3; i++) {
    const next = neighbors(s, at.x, at.y).filter((n) => !isLand(n) && !n.resource && !s.units.some((u) => u.x === n.x && u.y === n.y) && dist(n.x, n.y, c.x, c.y) > dist(at.x, at.y, c.x, c.y))
      .sort((p, q) => p.y - q.y || p.x - q.x)[0];
    if (!next) break;
    assert.ok(has(s, next, 'mech:platform'));
    doAction(s, 0, next, 'mech:platform');
    at = next;
    assert.equal(tileOwnerPlayer(s, at), 0, 'new deck is inside the sea-city borders');
  }
  assert.ok(s.tiles.filter((t) => t.owner === c.id).length > owned, 'borders grew');
  assert.ok(s.tiles.filter((t) => t.owner === c.id).every((t) => !isLand(t) || t.terrain === 'platform'));
  // not next to any platform or ship: not offered
  const far = s.tiles.find((t) => !isLand(t) && dist(t.x, t.y, c.x, c.y) > 4 && !s.units.some((u) => dist(u.x, u.y, t.x, t.y) <= 1));
  assert.ok(far);
  assert.ok(!tileActions(s, 0, far!).some((a) => a.id === 'mech:platform'));
  JSON.parse(JSON.stringify(s));
});

test('a raft beside a ship becomes a new sea-city', () => {
  const s = game();
  const ship = s.units.find((u) => u.owner === 0 && u.kind === 'ship')!;
  const spot = s.tiles.find((t) => !isLand(t) && !t.resource && !t.owner && dist(t.x, t.y, ship.x, ship.y) <= 8 && s.cities.every((c) => dist(c.x, c.y, t.x, t.y) >= 3))!;
  ship.x = spot.x + 1 < s.size && !isLand(tileAt(s, spot.x + 1, spot.y)!) ? spot.x + 1 : spot.x - 1;
  ship.y = spot.y;
  assert.ok(dist(ship.x, ship.y, spot.x, spot.y) === 1);
  assert.ok(has(s, spot, 'mech:platform'));
  doAction(s, 0, spot, 'mech:platform');
  assert.ok(has(s, spot, 'mech:found'));
  assert.ok(doAction(s, 0, spot, 'mech:found'));
  assert.equal(spot.terrain, 'platform');
  const city = s.cities.find((c) => c.x === spot.x && c.y === spot.y)!;
  assert.equal(city.owner, 0);
  assert.equal(tileOwnerPlayer(s, spot), 0);
  assert.ok(!has(s, spot, 'mech:found'));
  assert.equal(statsOf(s, 0).colonies, 1);
});

test('pirate ships sail over platforms; other ships land on them', () => {
  const s = game();
  const c = cap(s);
  const home = tileAt(s, c.x, c.y)!;
  const ship = s.units.find((u) => u.owner === 0 && u.kind === 'ship')!;
  ship.moved = ship.attacked = false;
  const deck = platformsOf(s, 0).find((t) => t.cityId === null && !s.units.some((u) => u.x === t.x && u.y === t.y))!;
  const berth = neighbors(s, deck.x, deck.y).find((n) => !isLand(n) && !s.units.some((u) => u.x === n.x && u.y === n.y))!;
  ship.x = berth.x; ship.y = berth.y;
  const opt = moveOptions(s, ship).find((o) => o.x === deck!.x && o.y === deck!.y);
  assert.ok(opt && !opt.disembark, 'no landing');
  assert.ok(moveUnit(s, ship, deck!.x, deck!.y));
  assert.equal(ship.kind, 'ship');
  assert.ok(home);
  // an enemy ship would disembark
  const enemy = spawnUnit(s, 'ship', 1, ship.x, ship.y + 5 < s.size ? ship.y : ship.y, null);
  enemy.x = deck!.x; enemy.y = deck!.y;
  enemy.x = freeWater(s, deck!).x; enemy.y = freeWater(s, deck!).y;
  s.players[1].explored.fill(true);
  const o2 = moveOptions(s, enemy).find((o) => o.x === deck!.x && o.y === deck!.y);
  assert.ok(!o2 || o2.disembark, 'enemy ships land');
});

test('tow drifts a city 1-2 tiles, once a turn', () => {
  const s = game();
  const c = cap(s);
  const from = tileAt(s, c.x, c.y)!;
  const dest = s.tiles.find((t) => !isLand(t) && dist(t.x, t.y, c.x, c.y) === 2 && !t.resource && t.owner === null && !s.units.some((u) => u.x === t.x && u.y === t.y))!;
  assert.ok(dest);
  const act = tileActions(s, 0, dest).find((a) => a.id === 'mech:tow');
  assert.ok(act?.enabled);
  const stars = s.players[0].stars;
  const garrison = s.units.find((u) => u.owner === 0 && u.x === c.x && u.y === c.y)!;
  assert.ok(doAction(s, 0, dest, 'mech:tow'));
  assert.equal(s.players[0].stars, stars - act!.cost);
  assert.equal(c.x, dest.x);
  assert.equal(c.y, dest.y);
  assert.equal(dest.cityId, c.id);
  assert.equal(dest.terrain, 'platform');
  assert.equal(from.cityId, null);
  assert.equal(from.terrain, 'platform', 'the old deck stays');
  assert.equal(garrison.x, dest.x);
  assert.ok(s.tiles.filter((t) => t.owner === c.id).every((t) => !isLand(t) || t.terrain === 'platform'));
  const again = s.tiles.find((t) => !isLand(t) && dist(t.x, t.y, c.x, c.y) === 1 && !t.resource && !s.units.some((u) => u.x === t.x && u.y === t.y))!;
  assert.ok(!tileActions(s, 0, again).some((a) => a.id === 'mech:tow'), 'once a turn');
  s.turn++;
  assert.ok(tileActions(s, 0, again).some((a) => a.id === 'mech:tow'));
  // farther than 2 is not offered
  const far = s.tiles.find((t) => !isLand(t) && dist(t.x, t.y, c.x, c.y) === 4 && !t.resource)!;
  assert.ok(!tileActions(s, 0, far).some((a) => a.id === 'mech:tow'));
});

test('launch turns a land crew standing on a platform into a galley', () => {
  const s = game();
  const c = cap(s);
  const u = s.units.find((x) => x.owner === 0 && x.kind !== 'ship')!;
  u.moved = u.attacked = false;
  assert.equal(u.x, c.x);
  const stars = s.players[0].stars;
  assert.ok(has(s, tileAt(s, u.x, u.y)!, 'mech:launch'));
  assert.ok(doAction(s, 0, tileAt(s, u.x, u.y)!, 'mech:launch'));
  assert.equal(u.kind, 'ship');
  assert.ok(u.carrying);
  assert.equal(s.players[0].stars, stars - LAUNCH_COST);
  assert.ok(!has(s, tileAt(s, u.x, u.y)!, 'mech:launch'));
});

function duel(hp: number) {
  const s = game();
  s.players[1].explored.fill(true);
  const mine = s.units.find((u) => u.owner === 0 && u.kind === 'ship')!;
  const w = neighbors(s, mine.x, mine.y).find((n) => !isLand(n) && !s.units.some((u) => u.x === n.x && u.y === n.y))!;
  const prey = spawnUnit(s, 'ship', 1, w.x, w.y, null);
  prey.hp = hp;
  mine.moved = mine.attacked = false;
  return { s, mine, prey, w };
}

test('boarding: a wounded adjacent enemy ship changes owner', () => {
  const { s, mine, prey, w } = duel(4);
  const act = tileActions(s, 0, w).find((a) => a.id === 'mech:board');
  assert.ok(act?.enabled);
  assert.ok(doAction(s, 0, w, 'mech:board'));
  assert.equal(prey.owner, 0);
  assert.ok(mine.attacked);
  assert.equal(statsOf(s, 0).prizes, 1);
  const healthy = duel(10);
  const a2 = tileActions(healthy.s, 0, healthy.w).find((a) => a.id === 'mech:board');
  assert.ok(a2 && !a2.enabled);
});

test('a strike that would sink an enemy ship takes it alive', () => {
  const { s, mine, prey } = duel(1);
  const dmg = mine.hp;
  assert.ok(dmg > 0);
  assert.ok(attack(s, mine, prey));
  assert.ok(s.units.includes(prey), 'not sunk');
  assert.equal(prey.owner, 0);
  assert.ok(prey.hp >= 1);
  assert.equal(statsOf(s, 0).prizes, 1);
  assert.equal(prey.data?.boarded, undefined);
  JSON.parse(JSON.stringify(s));
});

test('tolls: foreign ships beside a pirate ship or in platform waters pay at the start of the pirate turn', () => {
  const s = game();
  s.players[1].explored.fill(true);
  s.players[1].stars = 10;
  const mine = s.units.find((u) => u.owner === 0 && u.kind === 'ship')!;
  const w = neighbors(s, mine.x, mine.y).find((n) => !isLand(n) && !s.units.some((u) => u.x === n.x && u.y === n.y))!;
  spawnUnit(s, 'ship', 1, w.x, w.y, null);
  const before = s.players[0].stars;
  mech.turnStart!(s, 0);
  assert.equal(s.players[0].stars, before + TOLL);
  assert.equal(s.players[1].stars, 10 - TOLL);
  assert.equal(statsOf(s, 0).tolls, TOLL);
  // a distant foreign ship pays nothing
  const far = s.tiles.find((t) => !isLand(t) && dist(t.x, t.y, mine.x, mine.y) > 4 && t.owner === null)!;
  s.units = s.units.filter((u) => u.owner !== 1);
  spawnUnit(s, 'ship', 1, far.x, far.y, null);
  const b2 = s.players[0].stars;
  mech.turnStart!(s, 0);
  assert.equal(s.players[0].stars, b2);
  // the cap per victim
  s.units = s.units.filter((u) => u.owner !== 1);
  const victims = Math.ceil(TOLL_CAP / TOLL) + 2; // enough ships to exceed the cap
  for (let i = 0; i < victims; i++) {
    const t = neighbors(s, mine.x, mine.y).concat(neighbors(s, mine.x, mine.y, 2)).find((n) => !isLand(n) && !s.units.some((u) => u.x === n.x && u.y === n.y))!;
    spawnUnit(s, 'ship', 1, t.x, t.y, null);
  }
  s.players[1].stars = 50;
  const b3 = s.players[0].stars;
  mech.turnStart!(s, 0);
  assert.ok(victims * TOLL > TOLL_CAP);
  assert.equal(s.players[0].stars - b3, TOLL_CAP);
});

test('crew wages: every ship of the fleet costs upkeep, capped and never below zero stars', () => {
  const s = game();
  const ships = () => s.units.filter((u) => u.owner === 0 && u.kind === 'ship').length;
  const expected = () => -Math.min(WAGE_CAP, s.players[0].stars, Math.floor(ships() / WAGE_STEP));
  assert.ok(ships() > 0);
  assert.equal(mech.income!(s, 0), expected());
  assert.ok(mech.income!(s, 0) < 0, 'a fleet costs wages');
  s.players[0].stars = 0;
  assert.ok(mech.income!(s, 0) === 0, 'an empty chest pays nothing');
  s.players[0].stars = 100;
  s.units = s.units.filter((u) => !(u.owner === 0 && u.kind === 'ship'));
  assert.ok(mech.income!(s, 0) === 0, 'no ships, no wages');
});

test('raiding a coastal improvement pays 2x its cost and costs the host a citizen', () => {
  const s = game();
  const city = s.cities.find((c) => c.owner === 1)!;
  const shore = s.tiles.find((t) => isLand(t) && t.terrain !== 'mountain' && t.cityId === null && !t.village && dist(t.x, t.y, city.x, city.y) <= 3 && !s.units.some((u) => u.x === t.x && u.y === t.y))!;
  const bay = neighbors(s, shore.x, shore.y).find((n) => isLand(n) && n.cityId === null && n.terrain !== 'platform' && !s.units.some((u) => u.x === n.x && u.y === n.y))!;
  bay.terrain = 'shallow'; bay.resource = null; bay.improvement = null; bay.owner = null;
  shore.owner = city.id;
  shore.improvement = 'market';
  const w = neighbors(s, shore.x, shore.y).find((n) => !isLand(n) && !s.units.some((u) => u.x === n.x && u.y === n.y))!;
  const ship = s.units.find((u) => u.owner === 0 && u.kind === 'ship')!;
  ship.x = w.x; ship.y = w.y; ship.moved = ship.attacked = false;
  city.level = 2; city.pop = 2;
  const stars = s.players[0].stars;
  assert.ok(has(s, shore, 'mech:raid'));
  assert.ok(doAction(s, 0, shore, 'mech:raid'));
  assert.equal(s.players[0].stars, stars + 16);
  assert.equal(shore.improvement, null);
  assert.equal(city.pop, 1);
  assert.equal(statsOf(s, 0).raided, 16);
  assert.ok(!has(s, shore, 'mech:raid'));
});

test('recruit turns stars into population, once every RECRUIT_GAP turns per city', () => {
  const s = game();
  const c = cap(s);
  const t = tileAt(s, c.x, c.y)!;
  c.level = 1; c.pop = popNeeded(1) - RECRUIT_POP;
  const cost = recruitCost(c);
  const stars = s.players[0].stars;
  assert.ok(has(s, t, 'mech:recruit'));
  assert.ok(doAction(s, 0, t, 'mech:recruit'));
  assert.equal(s.players[0].stars, stars - cost);
  assert.equal(c.level, 2, 'the recruits level up a city one short of growing');
  assert.equal(c.pop, 0);
  assert.ok(has(s, t, 'mech:recruit', false));
  s.players[0].stars = 100;
  s.turn += RECRUIT_GAP - 1;
  assert.ok(has(s, t, 'mech:recruit', false), 'the crew is still settling in');
  s.turn++;
  assert.ok(has(s, t, 'mech:recruit'), 'the gap has passed');
  s.players[0].stars = 0;
  assert.ok(has(s, t, 'mech:recruit', false), 'no stars, no crew');
});

test('no tile farming, no markets, no roads, no village claims', () => {
  const s = game();
  assert.notEqual(mech.block!(s, 0, 0, 'farm', s.tiles[0]), undefined);
  assert.notEqual(mech.block!(s, 0, 0, 'market', s.tiles[0]), undefined);
  assert.notEqual(mech.block!(s, 0, 0, 'road', s.tiles[0]), undefined);
  assert.equal(mech.block!(s, 0, 1, 'farm', s.tiles[0]), undefined);
  assert.equal(mech.block!(s, 0, 0, 'port', s.tiles[0]), undefined);
  const v = { ...s.tiles[0], village: true };
  assert.notEqual(mech.block!(s, 0, 0, 'capture', v), undefined);
});

test('AI uses the platform, recruit, launch and raid actions', () => {
  const s = game();
  s.players[0].human = false;
  s.players[0].stars = 60;
  const before = { ...statsOf(s, 0) };
  let n = 0;
  while (mech.ai!(s, 0) && n++ < 40) {
    for (const u of s.units) if (u.owner === 0) { u.moved = u.attacked = false; }
  }
  const after = statsOf(s, 0);
  assert.ok(n > 0);
  assert.ok(after.recruited > before.recruited, 'recruited');
  assert.ok(after.built > before.built || after.launched > before.launched, 'built or launched');
});

test('20-turn all-AI games with Pirates complete and the AI raids, launches, recruits and builds', () => {
  const total = { built: 0, recruited: 0, launched: 0, raided: 0, colonies: 0 };
  for (const seed of [7, 1, 9, 8]) {
    const s: GameState = createGame({ seed, human: null, opponents: ['pirates', 'rome', 'japan', 'mongols'], mode: 'perfection' });
    startTurn(s);
    let guard = 0;
    while (!s.over && s.turn < 20 && guard++ < 1000) { aiTurn(s); endTurn(s); }
    assert.ok(s.turn >= 20 || s.over);
    const st = statsOf(s, 0);
    for (const k of Object.keys(total) as (keyof typeof total)[]) total[k] += st[k];
    JSON.parse(JSON.stringify(s));
  }
  assert.ok(total.recruited > 0, 'recruited');
  assert.ok(total.launched > 0, 'launched');
  assert.ok(total.raided > 0, 'raided');
  assert.ok(total.built + total.colonies > 0, 'built platforms');
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aiTurn } from '../src/game/ai.ts';
import { drain } from '../src/game/events.ts';
import { isLand, isWater, tileAt } from '../src/game/grid.ts';
import { createGame, foundCity } from '../src/game/mapgen.ts';
import { popNeeded, rewardOptions, payRoadBonuses, applyReward, attack, cityIncome, citiesOf, def, defenseBonus, doAction, maxHp, moveOptions, moveUnit, previewCombat, score, techCost, tileActions, trainCost } from '../src/game/rules.ts';
import { spawnUnit } from '../src/game/mapgen.ts';
import { endTurn, startTurn } from '../src/game/turn.ts';
import { TRIBE_IDS } from '../src/data/tribes.ts';
import type { GameState } from '../src/game/types.ts';

function checkInvariants(s: GameState) {
  const seen = new Set<string>();
  for (const u of s.units) {
    const k = `${u.x},${u.y}`;
    assert.ok(!seen.has(k), `two units stacked on ${k}`);
    seen.add(k);
    const t = tileAt(s, u.x, u.y)!;
    assert.ok(t, 'unit off the map');
    if (def(u).naval) assert.ok(isWater(t), `${u.kind} on land at ${k}`);
    else if (!def(u).skills.includes('amphibious')) assert.ok(isLand(t) || t.improvement === 'port', `${u.kind} in water at ${k}`);
    assert.ok(u.hp > 0, 'dead unit left on the board');
  }
  for (const p of s.players) assert.ok(p.stars >= 0, `${p.tribe} has negative stars`);
  for (const c of s.cities) assert.ok(c.pop >= 0 && c.level >= 1);
}

for (const [i, seed] of [1, 7, 42, 1234, 99999].entries()) {
  // each seed plays a different line-up of five, so every empire gets exercised
  const five = [0, 1, 2, 3, 4].map((j) => TRIBE_IDS[(i * 3 + j * 2) % TRIBE_IDS.length]).filter((t, j, a) => a.indexOf(t) === j);
  test(`5-empire AI game, seed ${seed} (${five.join(', ')}), runs 30 turns cleanly`, () => {
    const s = createGame({ seed, human: null, opponents: five, mode: 'perfection' });
    startTurn(s);
    let guard = 0;
    while (!s.over && guard++ < 1000) {
      aiTurn(s);
      checkInvariants(s);
      endTurn(s);
      drain();
    }
    assert.ok(s.over, 'game should end by the turn limit');
    const grew = s.cities.some((c) => c.level >= 3);
    assert.ok(grew, 'at least one city should reach level 3');
    const totalCities = s.cities.length;
    assert.ok(totalCities > five.length, 'villages should get captured');
    const summary = s.players.map((p) => `${p.tribe}:${score(s, p.id)}/${citiesOf(s, p.id).length}c/${p.techs.length}t`).join(' ');
    console.log(`seed ${seed} winner=${s.players[s.winner!].tribe} ${summary}`);
  });
}

test('every capital and village starts with enough resources to level up', () => {
  const pop = { fruit: 1, animal: 1, fish: 1, crop: 2, ore: 2, whale: 0 } as const;
  let checked = 0;
  for (const mapSize of ['normal', 'large', 'huge'] as const) {
    for (let seed = 1; seed <= 40; seed++) {
      const tribes = TRIBE_IDS.slice(seed % 5, (seed % 5) + 2 + (seed % 4));
      const s = createGame({ seed, human: tribes[0], opponents: tribes.slice(1), mode: 'domination', mapSize });
      const spots = [...s.tiles.filter((t) => t.village), ...s.cities.map((c) => tileAt(s, c.x, c.y)!)];
      for (const t of spots) {
        const ring = s.tiles.filter((n) => Math.max(Math.abs(n.x - t.x), Math.abs(n.y - t.y)) === 1);
        const worth = ring.reduce((a, n) => a + (n.resource ? pop[n.resource] : 0), 0);
        assert.ok(worth >= 3, `${mapSize} seed ${seed}: ${t.village ? 'village' : 'capital'} at ${t.x},${t.y} only has ${worth} population of resources`);
        checked++;
      }
    }
  }
  assert.ok(checked > 500, `checked ${checked} settlements`);
});

test('a 15-empire game runs 30 AI turns cleanly', () => {
  const s = createGame({ seed: 5, human: null, opponents: [...TRIBE_IDS], mode: 'perfection' });
  assert.equal(s.players.length, 15);
  assert.equal(new Set(s.cities.map((c) => `${c.x},${c.y}`)).size, 15, 'every empire gets its own capital');
  startTurn(s);
  let guard = 0;
  while (!s.over && guard++ < 2000) {
    aiTurn(s);
    checkInvariants(s);
    endTurn(s);
    drain();
  }
  assert.ok(s.over);
});

test('the new empires\' bonuses', () => {
  // Greeks: Academy makes research 1★ cheaper
  const g = createGame({ seed: 3, human: 'greeks', opponents: ['rome'], mode: 'domination' });
  const r = createGame({ seed: 3, human: 'rome', opponents: ['greeks'], mode: 'domination' });
  assert.equal(techCost(g, 0, 'hunting'), techCost(r, 0, 'hunting') - 1);
  // Mongols: mounted units cost 1★ less
  const m = createGame({ seed: 3, human: 'mongols', opponents: ['rome'], mode: 'domination' });
  assert.equal(trainCost(m, 0, 'rider'), 2);
  assert.equal(trainCost(m, 0, 'horsearcher'), 3);
  assert.equal(trainCost(m, 0, 'warrior'), 2);
  // Zulu: hunting grows the city by 2
  const z = createGame({ seed: 3, human: 'zulu', opponents: ['rome'], mode: 'domination' });
  const cap = citiesOf(z, 0)[0];
  const game = [...z.tiles].find((t) => t.owner === cap.id && t.resource === 'animal')!;
  assert.ok(game, 'zulu start with game nearby');
  z.players[0].stars = 10;
  const grown = () => cap.pop + Array.from({ length: cap.level - 1 }, (_, i) => popNeeded(i + 1)).reduce((a, b) => a + b, 0);
  const before = grown();
  assert.ok(doAction(z, 0, game, 'harvest'));
  assert.equal(grown() - before, 2);
  // Japanese: +1 defence inside their borders
  const j = createGame({ seed: 3, human: 'japan', opponents: ['rome'], mode: 'domination' });
  const jc = citiesOf(j, 0)[0];
  const home = j.tiles.find((t) => t.owner === jc.id && isLand(t) && t.terrain === 'field' && t.cityId === null && !j.units.some((u) => u.x === t.x && u.y === t.y))!;
  const defender = spawnUnit(j, 'warrior', 0, home.x, home.y, null);
  const raider = spawnUnit(j, 'warrior', 1, home.x + 1, home.y, null);
  const jr = createGame({ seed: 3, human: 'rome', opponents: ['japan'], mode: 'domination' });
  jr.tiles = j.tiles.map((t) => ({ ...t }));
  jr.cities = j.cities.map((c) => ({ ...c }));
  const d2 = spawnUnit(jr, 'warrior', 0, home.x, home.y, null);
  const r2 = spawnUnit(jr, 'warrior', 1, home.x + 1, home.y, null);
  assert.ok(previewCombat(j, raider, defender).dmg < previewCombat(jr, r2, d2).dmg, 'home ground blunts the attack');
  // Vikings: a winning attacker heals 3
  const v = createGame({ seed: 3, human: 'vikings', opponents: ['rome'], mode: 'domination' });
  const vc = citiesOf(v, 0)[0];
  const spot = v.tiles.find((t) => isLand(t) && t.terrain === 'field' && t.cityId === null && Math.abs(t.x - vc.x) + Math.abs(t.y - vc.y) > 3 && tileAt(v, t.x + 1, t.y)?.terrain === 'field' && !v.units.some((u) => Math.abs(u.x - t.x) < 3 && Math.abs(u.y - t.y) < 3))!;
  const axe = spawnUnit(v, 'berserker', 0, spot.x, spot.y, null);
  const foe = spawnUnit(v, 'warrior', 1, spot.x + 1, spot.y, null);
  v.players[0].explored.fill(true);
  axe.hp = 8;
  foe.hp = 1;
  axe.moved = axe.attacked = false;
  assert.ok(attack(v, axe, foe));
  assert.equal(axe.hp, 11);
});

test('huge 5-empire map runs 30 AI turns cleanly', () => {
  const s = createGame({ seed: 77, human: null, opponents: TRIBE_IDS.slice(0, 5), mode: 'perfection', mapSize: 'huge' });
  assert.equal(s.size, 26);
  startTurn(s);
  let guard = 0;
  const t0 = Date.now();
  while (!s.over && guard++ < 1000) {
    aiTurn(s);
    checkInvariants(s);
    endTurn(s);
    drain();
  }
  assert.ok(s.over);
  console.log(`huge map: ${s.cities.length} cities, ${s.units.length} units, ${Date.now() - t0}ms`);
});

test('pass & play seats several humans and ends when every human is gone', () => {
  const s = createGame({ seed: 5, human: null, humans: ['rome', 'egypt'], opponents: ['pirates'], mode: 'domination' });
  assert.deepEqual(s.players.map((p) => p.human), [true, true, false]);
  startTurn(s);
  // humans take their turns too (driven by the AI here), and the game keeps going between them
  for (let i = 0; i < 9 && !s.over; i++) {
    aiTurn(s);
    endTurn(s);
    drain();
  }
  // wiping out both human empires ends the game even though an AI is still alive
  for (const p of s.players.filter((q) => q.human)) {
    s.cities = s.cities.filter((c) => c.owner !== p.id);
    for (const t of s.tiles) if (t.owner !== null && !s.cities.some((c) => c.id === t.owner)) t.owner = null;
  }
  endTurn(s);
  assert.ok(s.over, 'game should end once every human empire is gone');
});

test('pirates get their Sea Raiders bonus on the water', () => {
  const s = createGame({ seed: 11, human: 'pirates', opponents: ['rome'], mode: 'domination' });
  const cap = citiesOf(s, 0)[0];
  const ring = s.tiles.filter((t) => Math.max(Math.abs(t.x - cap.x), Math.abs(t.y - cap.y)) === 1);
  // use a bare shallow tile next to the capital (the starting fish sit on the others)
  const shore = ring.find((t) => t.terrain === 'shallow' && !t.resource) ?? ring.find((t) => t.cityId === null && !t.village)!;
  shore.terrain = 'shallow';
  shore.resource = null;
  shore.improvement = null;
  s.players[0].stars = 50;
  const port = tileActions(s, 0, shore).find((a) => a.id === 'port')!;
  assert.equal(port.cost, 4, 'pirate ports are cheaper');
  const before = cityIncome(s, cap);
  assert.ok(doAction(s, 0, shore, 'port'));
  assert.equal(cityIncome(s, cap), before + 1, 'each pirate port pays +1 star');
  // a pirate canoe moves 3 tiles; a Roman one would move 2
  for (const t of s.tiles) { t.terrain = 'shallow'; t.cityId = null; t.village = false; t.ruin = false; }
  s.players[0].explored.fill(true);
  s.players[1].explored.fill(true);
  s.units = [];
  const mine = spawnUnit(s, 'boat', 0, 5, 5, null);
  const theirs = spawnUnit(s, 'boat', 1, 5, 9, null);
  mine.moved = theirs.moved = false;
  const reach = (u: typeof mine) => Math.max(...moveOptions(s, u).map((o) => Math.max(Math.abs(o.x - u.x), Math.abs(o.y - u.y))));
  assert.equal(reach(mine), 3);
  assert.equal(reach(theirs), 2);
});

test('a farm or a mine can only be built once on a tile', () => {
  const s = createGame({ seed: 5, human: 'egypt', opponents: ['rome'], mode: 'domination' });
  const cap = citiesOf(s, 0)[0];
  const ring = s.tiles.filter((t) => Math.max(Math.abs(t.x - cap.x), Math.abs(t.y - cap.y)) === 1 && t.cityId === null && !t.village);
  const [field, hill] = ring;
  Object.assign(field, { terrain: 'field', resource: 'crop', improvement: null, road: false });
  Object.assign(hill, { terrain: 'mountain', resource: 'ore', improvement: null, road: false });
  s.players[0].techs.push('farming', 'climbing', 'mining');
  s.players[0].stars = 100;
  for (const [t, id] of [[field, 'farm'], [hill, 'mine']] as const) {
    assert.ok(doAction(s, 0, t, id), `the first ${id} gets built`);
    assert.equal(t.improvement, id);
    assert.ok(!tileActions(s, 0, t).some((a) => a.id === id), `no second ${id} is offered on the same tile`);
    assert.equal(doAction(s, 0, t, id), false, `a second ${id} can't be bought`);
  }
});

/** A small two-empire game with the capital's neighbours cleared to plain fields. */
function sandbox() {
  const s = createGame({ seed: 21, human: 'rome', opponents: ['egypt'], mode: 'domination' });
  const cap = citiesOf(s, 0)[0];
  const ring = s.tiles.filter((t) => Math.max(Math.abs(t.x - cap.x), Math.abs(t.y - cap.y)) === 1);
  for (const t of ring) Object.assign(t, { terrain: 'field', resource: null, improvement: null, village: false, ruin: false, road: false });
  s.units = s.units.filter((u) => u.owner !== 0);
  for (const c of s.cities) c.units = 0;
  s.players[0].explored.fill(true);
  s.players[1].explored.fill(true);
  return { s, cap, ring };
}

test('boarding and leaving a boat keeps a unit\'s health as it is', () => {
  const { s, cap, ring } = sandbox();
  const land = ring.find((t) => t.x === cap.x || t.y === cap.y)!;
  const port = ring.find((t) => t !== land && Math.max(Math.abs(t.x - land.x), Math.abs(t.y - land.y)) === 1)!;
  Object.assign(port, { terrain: 'shallow', improvement: 'port' });
  const u = spawnUnit(s, 'defender', 0, land.x, land.y, null);
  u.hp = 12;
  for (let trip = 0; trip < 4; trip++) {
    u.moved = u.attacked = false;
    assert.ok(moveUnit(s, u, port.x, port.y), 'boards at the port');
    assert.equal(u.hp, 12);
    assert.equal(maxHp(u), 15, 'a boat has its passenger\'s full health');
    u.moved = u.attacked = false;
    assert.ok(moveUnit(s, u, land.x, land.y), 'lands again');
    assert.equal(u.kind, 'defender');
    assert.equal(u.hp, 12, 'no health gained or lost on the round trip');
  }
});

test('Grand Gardens add a star of income even with a workshop', () => {
  const { s, cap } = sandbox();
  applyReward(s, cap, 'workshop');
  const before = cityIncome(s, cap);
  cap.pendingRewards = [5];
  applyReward(s, cap, 'park');
  assert.equal(cityIncome(s, cap), before + 1);
});

test('units with Escape can move again after attacking, even if they moved first', () => {
  const { s, cap } = sandbox();
  s.players[0].techs.push('riding');
  const rider = spawnUnit(s, 'rider', 0, cap.x + 2, cap.y, null);
  const foe = spawnUnit(s, 'warrior', 1, cap.x + 4, cap.y, null);
  for (const t of s.tiles) if (Math.abs(t.y - cap.y) <= 1 && t.x > cap.x) Object.assign(t, { terrain: 'field', cityId: null, village: false, ruin: false });
  rider.moved = rider.attacked = false;
  assert.ok(moveUnit(s, rider, cap.x + 3, cap.y), 'rider moves up');
  assert.ok(attack(s, rider, foe), 'then attacks');
  assert.ok(moveOptions(s, rider).length > 0, 'and can still retreat');
  const warrior = spawnUnit(s, 'warrior', 0, cap.x + 3, cap.y + 1, null);
  warrior.moved = warrior.attacked = false;
  if (s.units.includes(foe)) {
    assert.ok(attack(s, warrior, foe));
    assert.equal(moveOptions(s, warrior).length, 0, 'a unit without Escape stops after attacking');
  }
});

test('only units that can fortify get the city defence bonus', () => {
  const { s, cap } = sandbox();
  const w = spawnUnit(s, 'warrior', 0, cap.x, cap.y, null);
  assert.equal(defenseBonus(s, w), 1.5);
  s.units = s.units.filter((u) => u !== w);
  const sw = spawnUnit(s, 'swordsman', 0, cap.x, cap.y, null);
  assert.ok(!def(sw).skills.includes('fortify'));
  assert.equal(defenseBonus(s, sw), 1);
});

test('nothing can be harvested under an enemy unit', () => {
  const { s, ring } = sandbox();
  const fruit = ring[0];
  fruit.resource = 'fruit';
  s.players[0].techs.push('gathering');
  s.players[0].stars = 20;
  assert.ok(tileActions(s, 0, fruit).some((a) => a.id === 'harvest' && a.enabled));
  spawnUnit(s, 'warrior', 1, fruit.x, fruit.y, null);
  assert.ok(!tileActions(s, 0, fruit).some((a) => a.id === 'harvest'));
  assert.equal(doAction(s, 0, fruit, 'harvest'), false);
});

test('Recover heals 4 HP at home and 2 away', () => {
  const { s, cap, ring } = sandbox();
  const home = spawnUnit(s, 'warrior', 0, ring[0].x, ring[0].y, null);
  home.hp = 3;
  home.moved = home.attacked = false;
  assert.ok(doAction(s, 0, ring[0], 'recover'));
  assert.equal(home.hp, 7);
  const far = s.tiles.find((t) => t.owner === null && t.terrain === 'field' && !t.village && !t.ruin && t.cityId === null && !s.units.some((u) => u.x === t.x && u.y === t.y) && Math.max(Math.abs(t.x - cap.x), Math.abs(t.y - cap.y)) > 3)!;
  const away = spawnUnit(s, 'warrior', 0, far.x, far.y, null);
  away.hp = 3;
  away.moved = away.attacked = false;
  assert.ok(doAction(s, 0, far, 'recover'));
  assert.equal(away.hp, 5);
});

test('capturing the last rival city ends the game at once, and the captor joins that city', () => {
  const { s, cap } = sandbox();
  const theirs = citiesOf(s, 1)[0];
  s.units = s.units.filter((u) => u.owner !== 1);
  const u = spawnUnit(s, 'warrior', 0, theirs.x, theirs.y, cap.id);
  cap.units = 1;
  u.moved = u.attacked = false;
  assert.ok(doAction(s, 0, tileAt(s, theirs.x, theirs.y)!, 'capture'));
  assert.equal(theirs.owner, 0);
  assert.equal(u.homeCity, theirs.id, 'the captor now belongs to the captured city');
  assert.equal(cap.units, 0, 'its old city slot is free again');
  assert.equal(theirs.units, 1);
  assert.equal(s.players[1].alive, false);
  assert.equal(s.over, true, 'victory is declared straight away');
  assert.equal(s.winner, 0);
});

test('a Buccaneer boards a boat at its own port', () => {
  const { s, cap, ring } = sandbox();
  s.players[0].tribe = 'pirates';
  const land = ring.find((t) => t.x === cap.x || t.y === cap.y)!;
  const port = ring.find((t) => t !== land && Math.max(Math.abs(t.x - land.x), Math.abs(t.y - land.y)) === 1)!;
  Object.assign(port, { terrain: 'shallow', improvement: 'port' });
  const b = spawnUnit(s, 'buccaneer', 0, land.x, land.y, null);
  b.moved = b.attacked = false;
  const opt = moveOptions(s, b).find((o) => o.x === port.x && o.y === port.y);
  assert.ok(opt?.embark, 'stepping onto the port boards a boat');
});

test('the AI plays its first turn after a new game at the same turn and seat', () => {
  const play = () => {
    const s = createGame({ seed: 3, human: 'egypt', opponents: ['rome'], mode: 'domination' });
    endTurn(s); // the AI's turn 0
    const before = s.units.filter((u) => u.owner === 1).map((u) => `${u.x},${u.y}`).join();
    aiTurn(s);
    drain();
    return before !== s.units.filter((u) => u.owner === 1).map((u) => `${u.x},${u.y}`).join() || s.units.filter((u) => u.owner === 1).length > 1;
  };
  assert.ok(play(), 'first game: the AI acts');
  assert.ok(play(), 'second game: the AI still acts');
});

test('every empire gets its starting tech, unique unit and capital', () => {
  for (const tribe of TRIBE_IDS) {
    const s = createGame({ seed: 3, human: tribe, opponents: TRIBE_IDS.filter((t) => t !== tribe).slice(0, 1), mode: 'domination' });
    const me = s.players[0];
    assert.equal(citiesOf(s, 0).length, 1);
    assert.equal(me.techs.length, 1);
    const cap = citiesOf(s, 0)[0];
    assert.equal(tileAt(s, cap.x, cap.y)!.terrain, 'field');
    assert.equal(s.units.filter((u) => u.owner === 0).length, 1);
  }
});

// ---------------------------------------------------------------- growth bonuses

function growthSetup(tribe: 'rome' | 'egypt' = 'rome') {
  const s = createGame({ seed: 8, human: tribe, opponents: [tribe === 'rome' ? 'egypt' : 'rome'], mode: 'domination' });
  const p = s.players[0];
  p.stars = 200;
  p.techs.push('roads', 'forestry', 'gathering', 'farming', 'fishing', 'masonry', 'carpentry');
  const city = citiesOf(s, 0)[0];
  const ring = s.tiles.filter((t) => t.owner === city.id && t.cityId === null).map((t) => { Object.assign(t, { terrain: 'field', resource: null, improvement: null, road: false, village: false, ruin: false }); return t; });
  s.units = []; // nothing standing in the way
  const total = () => city.pop + Array.from({ length: city.level - 1 }, (_, i) => popNeeded(i + 1)).reduce((a, b) => a + b, 0);
  return { s, p, city, ring, total };
}

test('lumber huts next to each other give bonus population', () => {
  const { s, city, ring, total } = growthSetup();
  const [a] = ring;
  const b = ring.find((t) => t !== a && Math.max(Math.abs(t.x - a.x), Math.abs(t.y - a.y)) === 1)!;
  a.terrain = b.terrain = 'forest';
  let before = total();
  assert.ok(doAction(s, 0, a, 'lumber'));
  assert.equal(total() - before, 1, 'the first hut has no neighbours');
  before = total();
  assert.ok(tileActions(s, 0, b).find((x) => x.id === 'lumber')!.desc.startsWith('+2 population'), 'the card promises the bonus');
  assert.ok(doAction(s, 0, b, 'lumber'));
  assert.equal(total() - before, 2, 'the second hut is next to one');
  assert.ok(city.level >= 1);
});

test('ports, temples and markets cluster too, but farms and mines do not need to', () => {
  const { s, ring, total } = growthSetup();
  const [a] = ring;
  const b = ring.find((t) => t !== a && Math.max(Math.abs(t.x - a.x), Math.abs(t.y - a.y)) === 1)!;
  const c = ring.find((t) => t !== a && t !== b && Math.max(Math.abs(t.x - a.x), Math.abs(t.y - a.y)) === 1 && Math.max(Math.abs(t.x - b.x), Math.abs(t.y - b.y)) === 1)!;
  for (const [id, kind] of [['temple', 'temple'], ['market', 'market']] as const) {
    for (const t of [a, b, c]) t.improvement = null;
    let before = total();
    assert.ok(doAction(s, 0, a, id));
    const first = total() - before;
    before = total();
    assert.ok(doAction(s, 0, b, id));
    const second = total() - before;
    assert.equal(second - first, 1, `${kind}: a neighbour adds one`);
    before = total();
    assert.ok(doAction(s, 0, c, id));
    assert.equal(total() - before - first, 2, `${kind}: two neighbours add two`);
    for (const t of [a, b, c]) t.improvement = null;
  }
  // a farm already gives 2, so an adjacent farm adds nothing
  for (const t of [a, b]) { t.resource = 'crop'; t.improvement = null; }
  const before = total();
  assert.ok(doAction(s, 0, a, 'farm'));
  assert.ok(doAction(s, 0, b, 'farm'));
  assert.equal(total() - before, 4);
});

test('harvesting next to a road gives no extra population', () => {
  const { s, ring, total } = growthSetup();
  const [a] = ring;
  const b = ring.find((t) => t !== a && Math.max(Math.abs(t.x - a.x), Math.abs(t.y - a.y)) === 1)!;
  a.resource = b.resource = 'fruit';
  b.road = true;
  const before = total();
  assert.ok(doAction(s, 0, a, 'harvest'));
  assert.equal(total() - before, 1, 'a fruit is worth one population, road or no road');
});

test('roads joined to a city pay milestones and stars, once each', () => {
  const { s, city, ring, total } = growthSetup();
  const chain = ring.slice(0, 8).sort((p, q) => Math.atan2(p.y - city.y, p.x - city.x) - Math.atan2(q.y - city.y, q.x - city.x));
  const base = total();
  const inc0 = cityIncome(s, city), level0 = city.level;
  for (let i = 0; i < 5; i++) assert.ok(doAction(s, 0, chain[i], 'road'));
  assert.equal(total() - base, 0, 'five roads pay nothing yet');
  assert.ok(doAction(s, 0, chain[5], 'road'));
  assert.equal(total() - base, 1, '6 connected roads: +1');
  for (let i = 6; i < 8; i++) assert.ok(doAction(s, 0, chain[i], 'road'));
  assert.equal(total() - base, 1, '8 roads: still just the first milestone');
  assert.equal(cityIncome(s, city) - inc0 - (city.level - level0), 0, 'no road income below 15 roads');
  payRoadBonuses(s, 0);
  assert.equal(total() - base, 1, 'nothing is paid twice');
});

test('linking two of your cities by road gives both population and income', () => {
  const { s, city, total } = growthSetup();
  // a second city three tiles away, joined to the capital by a line of roads
  const spot = s.tiles.find((t) => isLand(t) && Math.abs(t.x - city.x) === 3 && t.y === city.y && t.cityId === null)!;
  const dx = Math.sign(spot.x - city.x);
  spot.terrain = 'field';
  spot.village = false;
  const other = foundCity(s, spot.x, spot.y, 0, false);
  const inc = [cityIncome(s, city), cityIncome(s, other)]; // road income is live: measure before the roads exist
  const level0 = city.level, otherLevel0 = other.level;
  const before = [total(), other.pop + Array.from({ length: other.level - 1 }, (_, i) => popNeeded(i + 1)).reduce((a, b) => a + b, 0)];
  for (let i = 1; i <= 2; i++) Object.assign(tileAt(s, city.x + dx * i, city.y)!, { terrain: 'field', road: true, village: false, ruin: false, resource: null });
  payRoadBonuses(s, 0);
  const after = [total(), other.pop + Array.from({ length: other.level - 1 }, (_, i) => popNeeded(i + 1)).reduce((a, b) => a + b, 0)];
  assert.equal(after[0] - before[0], 1);
  assert.equal(after[1] - before[1], 1);
  assert.equal(cityIncome(s, city) - inc[0] - (city.level - level0), 1);
  assert.equal(cityIncome(s, other) - inc[1] - (other.level - otherLevel0), 1);
  payRoadBonuses(s, 0);
  assert.equal(total() - before[0], 1, 'a link pays once');
});

test('rival empires build roads to link their own cities', () => {
  let linked = 0;
  for (const seed of [3, 7, 21, 42]) {
    const s = createGame({ seed, human: null, opponents: TRIBE_IDS.slice(0, 4), mode: 'perfection', mapSize: 'large' });
    startTurn(s);
    let guard = 0;
    while (!s.over && guard++ < 1000) {
      aiTurn(s);
      checkInvariants(s);
      endTurn(s);
      drain();
    }
    linked += s.cities.filter((c) => (c.linked?.length ?? 0) > 0).length;
  }
  assert.ok(linked > 0, 'at least one AI city ends up linked by road');
});

test('units on a mountain get a x2 defence bonus and take less damage', () => {
  const s = createGame({ seed: 12, human: 'rome', opponents: ['egypt'], mode: 'domination' });
  const cap = citiesOf(s, 0)[0];
  const free = s.tiles.filter((t) => t.cityId === null && Math.abs(t.x - cap.x) > 2 && Math.abs(t.y - cap.y) > 2 && !s.units.some((u) => u.x === t.x && u.y === t.y));
  const spot = free.find((t) => tileAt(s, t.x + 1, t.y) && !s.units.some((u) => u.x === t.x + 1 && u.y === t.y))!;
  const next = tileAt(s, spot.x + 1, spot.y)!;
  spot.terrain = next.terrain = 'field';
  const defender = spawnUnit(s, 'warrior', 1, spot.x, spot.y, null);
  const attacker = spawnUnit(s, 'warrior', 0, next.x, next.y, null);
  s.players[0].explored.fill(true);
  const flat = previewCombat(s, attacker, defender).dmg;
  assert.equal(defenseBonus(s, defender), 1);
  spot.terrain = 'mountain';
  assert.equal(defenseBonus(s, defender), 2, 'mountain: x2, no matter the tech');
  assert.ok(previewCombat(s, attacker, defender).dmg < flat, 'the same attack hurts less on a mountain');
});

test('a level costs more population as a city grows, and Colossi are rarer', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(popNeeded), [2, 4, 6, 8, 10, 12]);
  const giantAt = (l: number) => rewardOptions(l).some((o) => o.id === 'giant');
  assert.deepEqual([2, 3, 4, 5, 6, 7, 8, 9].map(giantAt), [false, false, false, true, false, false, true, false]);
  assert.ok(rewardOptions(6).some((o) => o.id === 'resources'), 'in between, gold instead');
});

test('claiming a city that already sits on your road network is not a windfall', () => {
  const { s, city, total } = growthSetup();
  const spot = s.tiles.find((t) => isLand(t) && Math.abs(t.x - city.x) === 3 && t.y === city.y && t.cityId === null)!;
  const dx = Math.sign(spot.x - city.x);
  Object.assign(spot, { terrain: 'field', village: true, ruin: false, resource: null, owner: null });
  for (let i = 1; i <= 2; i++) Object.assign(tileAt(s, city.x + dx * i, city.y)!, { terrain: 'field', road: true, village: false, ruin: false, resource: null });
  const before = total();
  const claimer = spawnUnit(s, 'warrior', 0, spot.x, spot.y, city.id);
  claimer.moved = claimer.attacked = false;
  assert.ok(doAction(s, 0, spot, 'capture'));
  const founded = citiesOf(s, 0).find((c) => c.x === spot.x && c.y === spot.y)!;
  assert.equal(founded.pop + 0, 0, 'the new city starts empty');
  assert.ok(total() - before <= 1, 'the old city gets at most the one-pop link reward, nothing more');
  assert.equal(founded.level, 1);
});

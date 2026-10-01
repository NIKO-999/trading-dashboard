import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aiStep } from '../src/game/ai.ts';
import { drain } from '../src/game/events.ts';
import { tileAt, neighbors, isLand } from '../src/game/grid.ts';
import { createGame, foundCity, spawnUnit } from '../src/game/mapgen.ts';
import {
  addPop, attack, attackOptions, cityIncome, defenseBonus, doAction, income, moveOptions, previewCombat, research, researchStatus, score, tileActions, trainCost,
  transmute, transmuteCheck, transmuteCost,
} from '../src/game/rules.ts';
import { endTurn, startTurn } from '../src/game/turn.ts';
import { TECHS, TECH_BY_ID, techsFor } from '../src/data/techs.ts';
import { SKILLS } from '../src/data/skills.ts';
import { UNIQUE_TECHS } from '../src/data/uniqueTechs.ts';
import { TRIBE_IDS } from '../src/data/tribes.ts';
import { unitVisibleTo } from '../src/game/mech/index.ts';
import { condActive } from '../src/game/alignment.ts';
import { harvestOf, WHALE } from '../src/game/mech/inuit.ts';
import { st as aztecState } from '../src/game/mech/aztec.ts';
import { skyLayout, STAR_GAP } from '../src/ui/constellation.ts';
import type { GameState, Tile, TribeId } from '../src/game/types.ts';

const game = (tribe: TribeId, opp: TribeId = 'japan', seed = 11) => {
  const s = createGame({ seed, human: tribe, opponents: [opp], mode: 'domination' });
  for (const p of s.players) p.explored.fill(true);
  return s;
};
const learn = (s: GameState, pid: number, ...ids: string[]) => { for (const id of ids) if (!s.players[pid].techs.includes(id)) s.players[pid].techs.push(id); };
const freeLand = (s: GameState, near: { x: number; y: number }) =>
  neighbors(s, near.x, near.y).find((t) => isLand(t) && t.terrain !== 'mountain' && t.cityId === null && !s.units.some((u) => u.x === t.x && u.y === t.y))!;
/** A unit ready to act this turn. */
const spawn = (...a: Parameters<typeof spawnUnit>) => { const u = spawnUnit(...a); u.moved = u.attacked = false; return u; };
const clearUnits = (s: GameState) => { s.units = []; for (const c of s.cities) c.units = 0; };

// ------------------------------------------------------------------ the three rings

test('three rings: 25 core techs, a 3-node culture line per empire off a base tech, links, forks and 6-8 wildcards', () => {
  assert.equal(TECHS.length, 25);
  assert.equal(UNIQUE_TECHS.length, TRIBE_IDS.length * 3);
  for (const u of UNIQUE_TECHS) assert.ok(TECH_BY_ID[u.parent], `${u.id} grows from a real tech`);
  for (const id of TRIBE_IDS) assert.equal(TECH_BY_ID[`${id}:1`].ring, 'culture');
  assert.equal(TECH_BY_ID['aztec:1'].parent, 'hunting');
  assert.equal(TECH_BY_ID['rome:1'].parent, 'roads');
  assert.equal(TECH_BY_ID['inuit:1'].parent, 'sailing');
  assert.deepEqual(['aztec', 'rome', 'inuit'].map((t) => TECH_BY_ID[`${t}:1`].name), ['Sacrificial Rites', 'Paved Highways', 'Glacial Footing']);
  const wild = SKILLS.filter((k) => k.ring === 'wild');
  assert.ok(wild.length >= 6 && wild.length <= 8);
  assert.equal(SKILLS.filter((k) => k.ring === 'aether').length, 5);
  assert.deepEqual(SKILLS.filter((k) => k.fork).map((k) => k.id), ['fork:clearcut', 'fork:canopy', 'fork:caravan', 'fork:mercenary']);
  // every old id still resolves
  for (const id of ['gathering', 'philosophy', 'trade', 'rome:1', 'aztec:3', 'inuit:2', 'tibet:3']) assert.ok(TECH_BY_ID[id], id);
});

test('the constellation fits: no two stars overlap for any empire', () => {
  for (const id of TRIBE_IDS) {
    const sky = skyLayout(id, 720);
    assert.equal(sky.stars.length, techsFor(id).length);
    for (const a of sky.stars) {
      assert.ok(a.x > 0 && a.y > 0 && a.x < 720 && a.y < 720, `${id} ${a.id} on the board`);
      for (const b of sky.stars) if (a !== b) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= STAR_GAP - 0.01, `${id}: ${a.id} / ${b.id}`);
    }
  }
});

test('an empire line opens only once its base tech is known', () => {
  const s = game('rome');
  s.players[0].techs = ['riding'];
  assert.equal(researchStatus(s, 0, 'rome:1'), 'locked');
  learn(s, 0, 'roads');
  assert.equal(researchStatus(s, 0, 'rome:1'), 'available');
  // an old save that already knew the line keeps it working, whatever the parent
  const old = game('inuit');
  old.players[0].techs = ['fishing', 'inuit:1'];
  assert.equal(researchStatus(old, 0, 'inuit:1'), 'owned');
  assert.equal(researchStatus(old, 0, 'inuit:2'), 'available');
});

// ------------------------------------------------------------------ Master Culture: Aztec, Rome, Inuit

test('Aztec Sacrificial Rites: a defeated enemy refunds 20% of its star cost', () => {
  const run = (rites: boolean) => {
    const s = game('aztec');
    clearUnits(s);
    const c = s.cities.find((k) => k.owner === 0)!;
    const spot = freeLand(s, c);
    const a = spawn(s, 'swordsman', 0, c.x, c.y, null);
    const d = spawn(s, 'knight', 1, spot.x, spot.y, null); // an 8★ unit
    d.hp = 1;
    if (rites) learn(s, 0, 'hunting', 'aztec:1');
    const before = s.players[0].stars;
    assert.ok(attack(s, a, d));
    return s.players[0].stars - before;
  };
  assert.equal(run(true) - run(false), 2); // round(8 × 0.2)
});

test('Aztec Solar Ascension: a cheaper Sun Age that pays every city while it burns', () => {
  const s = game('aztec');
  const c = s.cities.find((k) => k.owner === 0)!;
  tileAt(s, c.x, c.y)!.improvement = 'altar';
  aztecState(s, 0).captives = 2;
  assert.equal(tileActions(s, 0, tileAt(s, c.x, c.y)!).find((a) => a.id === 'mech:sacrifice')!.enabled, false);
  learn(s, 0, 'hunting', 'aztec:1', 'aztec:2', 'aztec:3');
  assert.ok(doAction(s, 0, tileAt(s, c.x, c.y)!, 'mech:sacrifice'));
  assert.equal(aztecState(s, 0).captives, 0);
  const cities = s.cities.filter((k) => k.owner === 0).length;
  s.players[0].stars = 0;
  s.turn = 1;
  s.current = 0;
  startTurn(s);
  assert.equal(s.players[0].stars, income(s, 0) + 2 * cities + cities); // Triple Alliance tribute + Solar Ascension
});

test('Roman Paved Highways: a road through forest never stops the march', () => {
  const s = game('rome');
  clearUnits(s);
  const c = s.cities.find((k) => k.owner === 0)!;
  const u = spawn(s, 'warrior', 0, c.x, c.y, null);
  const t = freeLand(s, c);
  t.terrain = 'forest';
  t.road = true;
  const beyond = neighbors(s, t.x, t.y).find((n) => isLand(n) && n.cityId === null && n.terrain !== 'mountain' && Math.max(Math.abs(n.x - c.x), Math.abs(n.y - c.y)) === 2)!;
  beyond.terrain = 'field';
  beyond.road = true;
  s.players[0].techs = ['riding', 'roads'];
  // without the perk: from the city a forest road tile is reached... and the next road tile too (road to road)
  const reach = () => moveOptions(s, u).some((o) => o.x === beyond.x && o.y === beyond.y);
  beyond.road = false;
  assert.equal(reach(), false, 'a warrior must stop in the forest');
  learn(s, 0, 'rome:1');
  beyond.road = true;
  assert.equal(reach(), true, 'with Paved Highways it walks on');
});

test('Roman Pax Romana: +1★ per road-linked city until a city is lost', () => {
  const s = game('rome');
  const cap = s.cities.find((k) => k.owner === 0)!;
  const spot = s.tiles.find((t) => isLand(t) && t.cityId === null && Math.abs(t.x - cap.x) === 3 && t.y === cap.y && t.terrain !== 'mountain')
    ?? s.tiles.find((t) => isLand(t) && t.cityId === null && Math.max(Math.abs(t.x - cap.x), Math.abs(t.y - cap.y)) === 3 && t.terrain !== 'mountain')!;
  const other = foundCity(s, spot.x, spot.y, 0, false);
  // pave a straight-ish road between them
  let x = cap.x, y = cap.y;
  while (x !== other.x || y !== other.y) {
    x += Math.sign(other.x - x); y += Math.sign(other.y - y);
    const t = tileAt(s, x, y)!;
    if (t.cityId === null) { t.terrain = 'field'; t.road = true; }
  }
  learn(s, 0, 'riding', 'roads', 'rome:1', 'rome:2');
  const before = cityIncome(s, cap);
  learn(s, 0, 'rome:3');
  assert.equal(cityIncome(s, cap), before + 1);
  s.players[0].skill = { lost: s.turn };
  assert.equal(cityIncome(s, cap), before, 'broken while a city was lost lately');
  s.turn += 6;
  assert.equal(cityIncome(s, cap), before + 1, 'and back after 5 turns');
});

test('Roman Castra Outposts: forts are free, stronger and pay', () => {
  const s = game('rome');
  clearUnits(s);
  const c = s.cities.find((k) => k.owner === 0)!;
  const t = freeLand(s, c);
  t.road = true;
  const u = spawn(s, 'legionary', 0, t.x, t.y, null);
  learn(s, 0, 'riding', 'roads', 'rome:1', 'rome:2');
  s.players[0].stars = 0;
  const act = tileActions(s, 0, t).find((a) => a.id === 'mech:castra')!;
  assert.equal(act.cost, 0);
  assert.ok(doAction(s, 0, t, 'mech:castra'));
  assert.ok(u.fortified);
  s.turn = 1; s.current = 0;
  const inc = income(s, 0);
  startTurn(s);
  assert.equal(s.players[0].stars, inc + 1); // the fort pays
});

test('Inuit Glacial Footing, Deep Whaling and Sub-Zero Aura', () => {
  const s = game('inuit');
  const whale = { resource: 'whale' } as Tile;
  assert.deepEqual(harvestOf(s, 0, whale), WHALE);
  learn(s, 0, 'fishing', 'sailing', 'inuit:1', 'inuit:2', 'inuit:3');
  assert.deepEqual(harvestOf(s, 0, whale), { stars: Math.round(WHALE.stars * 1.5), pop: WHALE.pop, rest: WHALE.rest - 2 });
  // freezing pays
  clearUnits(s);
  const water = s.tiles.find((t) => t.terrain === 'shallow' && !t.resource && !t.improvement && t.cityId === null
    && neighbors(s, t.x, t.y).some((n) => isLand(n) && n.cityId === null && n.terrain !== 'mountain'))!;
  const shore = neighbors(s, water.x, water.y).find((n) => isLand(n) && n.cityId === null && n.terrain !== 'mountain')!;
  const u = spawn(s, 'warrior', 0, shore.x, shore.y, null);
  s.players[0].stars = 5;
  assert.ok(doAction(s, 0, water, 'mech:freeze'));
  assert.equal(water.terrain, 'ice');
  assert.equal(s.players[0].stars, 5 - 1 + 1);
  // units on ice defend better
  const onIce = spawn(s, 'warrior', 0, water.x, water.y, null);
  const withFooting = defenseBonus(s, onIce);
  s.players[0].techs = s.players[0].techs.filter((x) => x !== 'inuit:1');
  assert.equal(withFooting - defenseBonus(s, onIce), 0.5);
  void u;
});

// ------------------------------------------------------------------ Aether Links

test('Aether Links open only when both branches are complete', () => {
  const s = game('greeks');
  learn(s, 0, 'fishing', 'sailing', 'navigation');
  assert.equal(researchStatus(s, 0, 'aether:bombard'), 'locked');
  learn(s, 0, 'gathering', 'tactics', 'engineering');
  assert.equal(researchStatus(s, 0, 'aether:bombard'), 'available');
  s.players[0].stars = 99;
  assert.ok(research(s, 0, 'aether:bombard'));
});

test('Naval Bombardment: ships hit tiles 3 away, over land', () => {
  const s = game('greeks');
  clearUnits(s);
  const ship = s.tiles.find((t) => t.terrain === 'shallow' && t.cityId === null)!;
  const target = s.tiles.find((t) => isLand(t) && t.cityId === null && Math.max(Math.abs(t.x - ship.x), Math.abs(t.y - ship.y)) === 3)!;
  const boat = spawn(s, 'ship', 0, ship.x, ship.y, null);
  const foe = spawn(s, 'warrior', 1, target.x, target.y, null);
  assert.equal(attackOptions(s, boat).includes(foe), false);
  learn(s, 0, 'fishing', 'sailing', 'navigation', 'gathering', 'tactics', 'engineering', 'aether:bombard');
  assert.equal(attackOptions(s, boat).includes(foe), true);
});

test('Highland Snipers: ranged units on a mountain shoot 2 further and see through the fog', () => {
  const s = createGame({ seed: 11, human: 'greeks', opponents: ['japan'], mode: 'domination' });
  clearUnits(s);
  const peak = s.tiles.find((t) => isLand(t) && t.cityId === null && t.x < s.size - 5 && tileAt(s, t.x + 4, t.y)!.cityId === null)!;
  peak.terrain = 'mountain';
  const archer = spawn(s, 'archer', 0, peak.x, peak.y, null);
  const far = tileAt(s, peak.x + 4, peak.y)!;
  far.terrain = 'field';
  const foe = spawn(s, 'warrior', 1, far.x, far.y, null);
  s.players[0].explored.fill(false);
  learn(s, 0, 'climbing', 'mining', 'hunting', 'archery', 'spiritualism', 'aether:snipers');
  s.current = 0;
  endTurn(s); endTurn(s); // back to us: the reveal runs at turn start
  assert.ok(s.players[0].explored[far.y * s.size + far.x], 'sees 4 tiles from the peak');
  assert.ok(attackOptions(s, archer).includes(foe), 'and shoots that far');
});

test('Grain Supply Lines: a levelling city spills its surplus to a smaller road-linked city', () => {
  const s = game('greeks');
  const cap = s.cities.find((k) => k.owner === 0)!;
  const spot = s.tiles.find((t) => isLand(t) && t.cityId === null && t.terrain !== 'mountain' && Math.max(Math.abs(t.x - cap.x), Math.abs(t.y - cap.y)) === 2)!;
  const small = foundCity(s, spot.x, spot.y, 0, false);
  const mid = tileAt(s, (cap.x + small.x) >> 1, (cap.y + small.y) >> 1)!;
  if (mid.cityId === null) { mid.terrain = 'field'; mid.road = true; }
  cap.level = 3; cap.pop = 5; // needs 6 for level 4
  learn(s, 0, 'riding', 'roads', 'trade', 'gathering', 'farming', 'masonry', 'aether:grain');
  addPop(s, cap, 3); // levels up with 2 over
  assert.equal(cap.level, 4);
  assert.equal(cap.pop, 0);
  assert.equal(small.level, 2, 'the 2 surplus grew the small city a level');
});

// ------------------------------------------------------------------ forks

test('Forestry fork: Clear Cutting pays big and seals Sacred Canopy', () => {
  const s = game('greeks');
  const c = s.cities.find((k) => k.owner === 0)!;
  const t = s.tiles.find((x) => x.owner === c.id && x.cityId === null)!;
  t.terrain = 'forest'; t.resource = null; t.improvement = null;
  learn(s, 0, 'hunting', 'forestry');
  s.players[0].stars = 50;
  assert.ok(research(s, 0, 'fork:clearcut'));
  assert.equal(researchStatus(s, 0, 'fork:canopy'), 'sealed');
  assert.equal(research(s, 0, 'fork:canopy'), false);
  const before = s.players[0].stars;
  assert.ok(doAction(s, 0, t, 'clear'));
  assert.equal(s.players[0].stars - before, 4);
});

test('Sacred Canopy: no cutting, forests pay, units in forest hide from distant enemies', () => {
  const s = game('greeks');
  clearUnits(s);
  const c = s.cities.find((k) => k.owner === 0)!;
  const woods = s.tiles.filter((x) => x.owner === c.id && x.cityId === null).slice(0, 2);
  for (const w of woods) { w.terrain = 'forest'; w.resource = null; w.improvement = null; }
  const base = cityIncome(s, c);
  learn(s, 0, 'hunting', 'forestry', 'fork:canopy');
  assert.equal(researchStatus(s, 0, 'fork:clearcut'), 'sealed');
  assert.equal(cityIncome(s, c) - base, Math.min(Math.ceil(c.level / 2), s.tiles.filter((x) => x.owner === c.id && x.terrain === 'forest').length));
  const clear = tileActions(s, 0, woods[0]).find((a) => a.id === 'clear')!;
  assert.equal(clear.enabled, false);
  const u = spawn(s, 'warrior', 0, woods[0].x, woods[0].y, null);
  assert.equal(unitVisibleTo(s, 1, u), false);
  const spot = neighbors(s, u.x, u.y).find((n) => n.cityId === null && !s.units.some((x) => x.x === n.x && x.y === n.y))!;
  spawn(s, 'warrior', 1, spot.x, spot.y, null);
  assert.equal(unitVisibleTo(s, 1, u), true, 'seen from right beside it');
});

test('Trade fork: Caravan Monopoly doubles trade stars and dearer units; Mercenary Contracts cheap units, halved growth', () => {
  const s = game('greeks');
  const c = s.cities.find((k) => k.owner === 0)!;
  learn(s, 0, 'riding', 'roads', 'trade');
  const inc = cityIncome(s, c), sword = trainCost(s, 0, 'swordsman');
  learn(s, 0, 'fork:caravan');
  assert.equal(cityIncome(s, c), inc + 1, 'the Trade bonus paid twice');
  assert.equal(trainCost(s, 0, 'swordsman'), sword + 1);
  assert.equal(researchStatus(s, 0, 'fork:mercenary'), 'sealed');

  const m = game('greeks');
  const mc = m.cities.find((k) => k.owner === 0)!;
  learn(m, 0, 'riding', 'roads', 'fork:mercenary');
  assert.equal(trainCost(m, 0, 'catapult'), 6); // 8 less 25%
  mc.level = 1; mc.pop = 0;
  addPop(m, mc, 1);
  assert.equal(mc.pop, 0, 'half a population is banked');
  addPop(m, mc, 1);
  assert.equal(mc.pop, 1);
});

// ------------------------------------------------------------------ wildcards

test('Wildcards surge with the map: Tidecaller on a water world, War Host at war', () => {
  const s = createGame({ seed: 5, human: 'greeks', opponents: ['japan'], mode: 'domination', terrain: 'archipelago' });
  learn(s, 0, 'fishing', 'sailing', 'navigation', 'wild:tide');
  assert.ok(condActive(s, 0, 'water'), 'an archipelago is mostly water');
  const boat = spawn(s, 'ship', 0, 0, 0, null);
  const land = createGame({ seed: 5, human: 'greeks', opponents: ['japan'], mode: 'domination', terrain: 'pangaea' });
  learn(land, 0, 'fishing', 'sailing', 'navigation', 'wild:tide');
  const boat2 = spawn(land, 'ship', 0, 0, 0, null);
  const foe = spawn(s, 'warrior', 1, 1, 1, null), foe2 = spawn(land, 'warrior', 1, 1, 1, null);
  assert.ok(previewCombat(s, boat, foe).dmg > previewCombat(land, boat2, foe2).dmg, 'the surge adds attack');

  const w = game('greeks');
  learn(w, 0, 'riding', 'horsemanship', 'chivalry', 'wild:warhost');
  assert.equal(condActive(w, 0, 'war'), false);
  clearUnits(w);
  const c = w.cities.find((k) => k.owner === 0)!;
  const spot = freeLand(w, c);
  const a = spawn(w, 'warrior', 0, c.x, c.y, null), d = spawn(w, 'warrior', 1, spot.x, spot.y, null);
  const calm = previewCombat(w, a, d).dmg;
  attack(w, a, d);
  assert.ok(condActive(w, 0, 'war'));
  d.hp = 10; a.hp = 10;
  assert.ok(previewCombat(w, a, d).dmg > calm, 'War Host surges: +0.5 attack');
  drain();
  w.current = 0;
  startTurn(w);
  assert.ok(drain().some((e) => e.type === 'toast' && /War Host surges/.test(e.text)), 'the player is told');
});

// ------------------------------------------------------------------ transmutation shift

test('Transmutation Shift: pay about 30★ to unlearn a sub-branch and get its price back', () => {
  const s = game('greeks');
  learn(s, 0, 'hunting', 'forestry', 'fork:clearcut', 'carpentry');
  s.players[0].stars = 10;
  assert.equal(transmuteCheck(s, 0, 'forestry'), 'Not enough stars');
  assert.equal(transmuteCheck(s, 0, 'hunting'), 'The roots of the tree cannot be transmuted');
  const cost = transmuteCost(s, 0);
  assert.ok(cost >= 27 && cost <= 33);
  s.players[0].stars = 40;
  const r = transmute(s, 0, 'fork:clearcut')!;
  assert.deepEqual(r.removed, ['fork:clearcut']);
  assert.equal(s.players[0].stars, 40 - cost + r.refund);
  assert.equal(researchStatus(s, 0, 'fork:canopy'), 'available', 'the fork is open again');
  s.players[0].stars = 60;
  const r2 = transmute(s, 0, 'forestry')!;
  assert.deepEqual(r2.removed.sort(), ['carpentry', 'forestry']);
});

// ------------------------------------------------------------------ saves and the AI

test('old saves load: no skill field, JSON round trip keeps the new state', () => {
  const s = game('rome');
  delete (s.players[0] as { skill?: unknown }).skill;
  s.current = 0;
  startTurn(s);
  endTurn(s);
  const back = JSON.parse(JSON.stringify(s)) as GameState;
  assert.equal(score(back, 0), score(s, 0));
  learn(back, 0, 'riding', 'roads', 'fork:mercenary');
  addPop(back, back.cities[0], 1);
  assert.deepEqual(JSON.parse(JSON.stringify(back)).cities[0].data?.halfPop, back.cities[0].data?.halfPop);
});

test('the AI takes one side of each fork, links and wildcards, and never both sides (30-turn all-AI game)', () => {
  const picked: Record<string, number> = {};
  for (const seed of [3, 4]) {
    const s = createGame({ seed, human: null, opponents: ['celts', 'rome', 'aztec', 'inuit', 'mongols'], mode: 'perfection', maxTurns: 30 });
    let guard = 0;
    while (!s.over && guard++ < 400) { let n = 0; while (aiStep(s) && n++ < 400); endTurn(s); drain(); }
    assert.ok(s.over);
    for (const p of s.players) {
      assert.ok(!(p.techs.includes('fork:clearcut') && p.techs.includes('fork:canopy')), `${p.tribe} forest fork`);
      assert.ok(!(p.techs.includes('fork:caravan') && p.techs.includes('fork:mercenary')), `${p.tribe} market fork`);
      for (const id of p.techs) {
        const t = TECH_BY_ID[id];
        if (t.ring !== 'core' && t.ring !== 'culture') picked[t.ring] = (picked[t.ring] ?? 0) + 1;
      }
      if (p.tribe === 'celts' && p.techs.includes('forestry')) assert.equal(p.techs.includes('fork:clearcut'), false, 'Celts never take the axe');
    }
  }
  assert.ok(picked.fork, 'a fork was chosen');
  assert.ok(picked.aether || picked.wild, 'a link or wildcard was learned');
});


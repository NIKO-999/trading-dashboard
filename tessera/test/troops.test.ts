import assert from 'node:assert/strict';
import test from 'node:test';
import { TRIBE_IDS } from '../src/data/tribes';
import { upgradeTarget } from '../src/game/army';
import { createGame, spawnUnit } from '../src/game/mapgen';
import { previewCombat, tileActions, trainableKinds } from '../src/game/rules';
import { family, trioOf } from '../src/game/troops';
import type { TribeId } from '../src/game/types';
import { tileAt } from '../src/game/grid';

function board(me: TribeId = 'greeks') {
  const s = createGame({ seed: 7, human: me, opponents: ['vikings'], mapSize: 'large', mode: 'perfection' });
  for (const t of s.tiles) { t.terrain = 'field'; t.resource = null; t.improvement = null; t.village = false; t.ruin = false; t.owner = null; t.cityId = t.cityId; }
  s.units = [];
  for (const p of s.players) p.explored.fill(true);
  return s;
}

test('every empire can field all eight new troops', () => {
  for (const tribe of TRIBE_IDS) {
    const s = createGame({ seed: 3, human: tribe, opponents: [tribe === 'rome' ? 'greeks' : 'rome'], mode: 'perfection' });
    for (const k of ['axeman', 'javelineer', 'ranger', 'pikeman', 'musketeer', 'ram', 'ballista', 'cannon'] as const) assert.ok(trainableKinds(s, 0).includes(k), `${tribe}: ${k}`);
  }
});

test('the Axeman breaks shields; against anything else a Warrior trio does as well', () => {
  const s = board();
  const axe = spawnUnit(s, 'axeman', 0, 5, 5, null);
  const wall = spawnUnit(s, 'defender', 1, 6, 5, null);
  const war = spawnUnit(s, 'warrior', 0, 6, 6, null);
  const vsWall = previewCombat(s, axe, wall);
  assert.ok(vsWall.formation.some((n) => /Shield-breaker/.test(n)));
  assert.ok(vsWall.dmg > previewCombat(s, war, wall).dmg, 'the axe hits the shield harder');
});

test('Pikemen double their defence against cavalry, and Lancers ride down archers', () => {
  const s = board();
  const pike = spawnUnit(s, 'pikeman', 1, 6, 5, null);
  const knight = spawnUnit(s, 'knight', 0, 5, 5, null);
  const sword = spawnUnit(s, 'swordsman', 0, 7, 6, null);
  assert.ok(previewCombat(s, knight, pike).formation.some((n) => /Pikes vs cavalry/.test(n)));
  assert.ok(!previewCombat(s, sword, pike).formation.some((n) => /Pikes/.test(n)));
  const archer = spawnUnit(s, 'archer', 1, 10, 10, null);
  const lancer = spawnUnit(s, 'lancer', 0, 11, 10, null);
  assert.ok(previewCombat(s, lancer, archer).formation.some((n) => /Lancer vs archers/.test(n)));
});

test('the Ram triples against a city and the Musketeer ignores cover', () => {
  const s = board();
  const c = s.cities.find((k) => k.owner === 1)!;
  const guard = spawnUnit(s, 'defender', 1, c.x, c.y, c.id);
  const ram = spawnUnit(s, 'ram', 0, c.x + 1, c.y, null);
  assert.ok(previewCombat(s, ram, guard).formation.some((n) => /×3 vs city/.test(n)));
  const field = spawnUnit(s, 'warrior', 1, 3, 3, null);
  const ram2 = spawnUnit(s, 'ram', 0, 4, 3, null);
  assert.ok(!previewCombat(s, ram2, field).formation.some((n) => /city/.test(n)), 'no bonus in the open');
  const musket = spawnUnit(s, 'musketeer', 0, c.x + 2, c.y, null);
  assert.ok(previewCombat(s, musket, guard).formation.some((n) => /ignores cover/.test(n)));
});

test('trios: three of a family side by side; a unique counts as the unit it replaces', () => {
  const s = board('rome');
  const a = spawnUnit(s, 'warrior', 0, 5, 5, null);
  spawnUnit(s, 'warrior', 0, 6, 5, null);
  assert.equal(trioOf(s, a), null, 'two are not a trio');
  spawnUnit(s, 'legionary', 0, 5, 6, null);
  assert.equal(family('legionary'), 'warrior');
  assert.equal(trioOf(s, a)?.name, 'Warband');
  const foe = spawnUnit(s, 'warrior', 1, 4, 5, null);
  assert.ok(previewCombat(s, a, foe).formation.some((n) => /Warband/.test(n)));
});

test('Pikemen need the Medieval era, Musketeers and Cannon the Renaissance; upgrades wait for them too', () => {
  const s = createGame({ seed: 3, human: 'greeks', opponents: ['vikings'], mode: 'perfection' });
  const p = s.players[0];
  p.stars = 100;
  p.techs.push('tactics', 'climbing', 'mining', 'smithing', 'hunting', 'archery');
  const c = s.cities.find((k) => k.owner === 0)!;
  s.units = s.units.filter((u) => !(u.x === c.x && u.y === c.y));
  const t = tileAt(s, c.x, c.y)!;
  const act = (id: string) => tileActions(s, 0, t).find((a) => a.id === id)!;
  assert.match(act('train:pikeman').reason ?? '', /Medieval/);
  assert.match(act('train:musketeer').reason ?? '', /Renaissance/);
  const archer = spawnUnit(s, 'archer', 0, 1, 1, null);
  assert.equal(upgradeTarget(s, archer), null);
  p.era = { n: 3, snap: { sparks: 0, kills: 0, levels: 0, wonders: 0 }, age: null, until: 0 };
  assert.equal(upgradeTarget(s, archer), 'musketeer');
  assert.ok(!/era/.test(act('train:pikeman').reason ?? ''));
});

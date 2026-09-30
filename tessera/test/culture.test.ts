import assert from 'node:assert/strict';
import test from 'node:test';
import { TRIBE_IDS } from '../src/data/tribes';
import { aiStep, aiTurn } from '../src/game/ai';
import {
  adopt, adoptedOf, cultureOf, HORNS_MULT, isKiaiLite, MAX_ADOPTED, offersOf, PILLAGE_MULT, scoreSubTrait, subTrait, subTraitsOf, TRIBUTE_LITE,
} from '../src/game/culture';
import { drain } from '../src/game/events';
import { tileAt } from '../src/game/grid';
import { createGame, spawnUnit } from '../src/game/mapgen';
import { hookActions } from '../src/game/mech';
import { perksOf } from '../src/game/perks';
import { attack, doAction, moveOptions, moveUnit, previewCombat, tileActions } from '../src/game/rules';
import { endTurn } from '../src/game/turn';
import type { City, GameState, TribeId, UnitKind } from '../src/game/types';

function setup(me: TribeId = 'rome', foes: TribeId[] = ['vikings']) {
  const s = createGame({ seed: 7, human: me, opponents: foes, mode: 'perfection' });
  for (const p of s.players) p.explored.fill(true);
  s.players[0].stars = 50;
  return s;
}

/** Take a city the real way: a soldier standing on it starts a turn and uses the Capture action. */
function conquer(s: GameState, pid: number, city: City) {
  const t = tileAt(s, city.x, city.y)!;
  s.units = s.units.filter((u) => !(u.x === t.x && u.y === t.y));
  const u = spawnUnit(s, 'warrior', pid, t.x, t.y, null);
  u.moved = u.attacked = false;
  assert.ok(doAction(s, pid, t, 'capture'));
}
const cityOf = (s: GameState, pid: number) => s.cities.find((c) => c.owner === pid)!;

/** A flat, fully explored map with no units. */
function arena(me: TribeId = 'rome', foe: TribeId = 'greeks') {
  const s = createGame({ seed: 7, human: me, opponents: [foe], mapSize: 'large', mode: 'perfection' });
  for (const t of s.tiles) { t.terrain = 'field'; t.resource = null; t.improvement = null; t.village = false; t.ruin = false; }
  for (const p of s.players) p.explored.fill(true);
  s.units = [];
  return s;
}
const at = (s: GameState, kind: UnitKind, owner: number, x: number, y: number) => {
  const u = spawnUnit(s, kind, owner, x, y, null);
  u.moved = u.attacked = false;
  return u;
};
/** Hand a player a tradition directly (as if chosen after a capture). */
const give = (s: GameState, pid: number, id: string) => cultureOf(s, pid).adopted.push({ id, from: subTrait(id)!.from, turn: s.turn, city: 'Test', perks: subTrait(id)!.perks });

test('every empire offers 2-3 adoptable sub-traits, and six carry a light version of their mechanic', () => {
  const ids = new Set<string>();
  for (const tribe of TRIBE_IDS) {
    const list = subTraitsOf(tribe);
    assert.ok(list.length >= 2 && list.length <= 3, `${tribe} has ${list.length}`);
    for (const t of list) {
      assert.equal(t.from, tribe);
      assert.ok(!ids.has(t.id), `duplicate ${t.id}`);
      ids.add(t.id);
      assert.ok(t.perks.length || t.hook, `${t.id} does something`);
      assert.ok(!t.perks.some((p) => 'who' in p && p.who === 'unique'), `${t.id} names no unique unit`);
    }
  }
  for (const id of ['vikings:pillage', 'zulu:horns', 'japan:kiai', 'mongols:feint', 'persia:tribute', 'ottoman:levy']) assert.ok(subTrait(id)?.hook, id);
});

test('capturing a foreign city records its origin, offers that people’s traits, and the pick applies through the perk system', () => {
  const s = setup('rome', ['vikings']);
  const c = cityOf(s, 1);
  drain();
  conquer(s, 0, c);
  assert.equal(c.data?.origin, 'vikings');
  const offer = offersOf(s, 0)[0];
  assert.equal(offer.from, 'vikings');
  assert.deepEqual(offer.options, subTraitsOf('vikings').map((t) => t.id));
  assert.ok(drain().some((e) => e.type === 'toast' && e.player === 0 && e.text.includes('Viking ways')), 'a toast on capture');
  const pro = offer.options.find((id) => subTrait(id)!.perks.length)!;
  const before = perksOf(s, 0).length;
  assert.equal(adopt(s, 0, 'vikings', 'rome:pro0'), false, 'only an offered option');
  assert.ok(adopt(s, 0, 'vikings', pro));
  assert.equal(perksOf(s, 0).length, before + subTrait(pro)!.perks.length);
  assert.deepEqual(adoptedOf(s, 0).map((a) => [a.id, a.from, a.city]), [[pro, 'vikings', c.name]]);
  assert.equal(offersOf(s, 0).length, 0);
  assert.ok(s.log.some((l) => l.text.includes('adopt')));
});

test('each origin people once, recapturing your own city offers nothing, and at most MAX_ADOPTED traditions', () => {
  const s = setup('rome', ['vikings', 'zulu', 'japan', 'mongols']);
  const vik = s.cities.filter((c) => c.owner === 1);
  conquer(s, 0, vik[0]);
  adopt(s, 0, 'vikings', offersOf(s, 0)[0].options[0]);
  // a second Viking-founded city: no new offer
  const spot = s.tiles.find((t) => t.terrain === 'field' && t.cityId === null && !t.village && !s.units.some((u) => u.x === t.x && u.y === t.y))!;
  const extra: City = { ...vik[0], id: s.nextId++, name: 'Second Hall', owner: 1, x: spot.x, y: spot.y, capital: false, data: undefined };
  s.cities.push(extra);
  spot.cityId = extra.id;
  conquer(s, 0, extra);
  assert.equal(offersOf(s, 0).length, 0);
  // Vikings retake one of their own cities: no offer for them either (its origin is Viking)
  conquer(s, 1, extra);
  assert.equal(offersOf(s, 1).length, 0);
  assert.equal(extra.data?.origin, 'vikings');
  // a Roman city taken by the Zulu then retaken by Rome is Roman at heart
  const home = cityOf(s, 0);
  conquer(s, 2, home);
  assert.equal(home.data?.origin, 'rome');
  assert.equal(offersOf(s, 2)[0].from, 'rome');
  conquer(s, 0, home);
  assert.equal(offersOf(s, 0).length, 0);
  // fill up to the cap
  for (const pid of [2, 3]) { conquer(s, 0, cityOf(s, pid)); adopt(s, 0, s.players[pid].tribe, offersOf(s, 0)[0].options[0]); }
  assert.equal(adoptedOf(s, 0).length, MAX_ADOPTED);
  conquer(s, 0, cityOf(s, 4));
  assert.equal(offersOf(s, 0).length, 0, 'no offers past the cap');
});

test('old saves without a culture record load and play', () => {
  const s = setup('rome', ['vikings']);
  const old = JSON.parse(JSON.stringify(s)) as GameState;
  for (const p of old.players) delete p.culture;
  assert.ok(perksOf(old, 0).length > 0);
  assert.deepEqual(adoptedOf(old, 0), []);
  conquer(old, 0, cityOf(old, 1));
  assert.equal(offersOf(old, 0).length, 1);
  const again = JSON.parse(JSON.stringify(old)) as GameState;
  assert.deepEqual(again.players[0].culture, old.players[0].culture, 'JSON-safe');
});

test('Coastal Pillage (from the Vikings) appears in the tile menu and razes an enemy coastal improvement', () => {
  const s = arena('rome', 'greeks');
  const foe = cityOf(s, 1);
  const t = s.tiles.find((x) => x.owner === foe.id && x.cityId === null)!;
  t.improvement = 'farm';
  assert.equal(tileActions(s, 0, t).some((a) => a.id === 'mech:pillage'), false);
  at(s, 'warrior', 0, t.x, t.y);
  give(s, 0, 'vikings:pillage');
  assert.equal(hookActions(s, 0, t).some((a) => a.id === 'mech:pillage'), false, 'inland: nothing to pillage');
  const water = s.tiles.find((x) => Math.max(Math.abs(x.x - t.x), Math.abs(x.y - t.y)) === 1 && x.cityId === null)!;
  water.terrain = 'shallow';
  const act = tileActions(s, 0, t).find((a) => a.id === 'mech:pillage');
  assert.ok(act?.enabled);
  foe.pop = 1;
  const stars = s.players[0].stars;
  assert.ok(doAction(s, 0, t, 'mech:pillage'));
  assert.equal(s.players[0].stars, stars + PILLAGE_MULT * 5);
  assert.equal(t.improvement, null);
  assert.equal(foe.pop, 0);
});

test('Horns of the Buffalo (from the Zulu) add damage against a hemmed-in enemy', () => {
  const s = arena('rome', 'greeks');
  const e = at(s, 'defender', 1, 10, 10);
  const a = at(s, 'warrior', 0, 9, 10);
  at(s, 'warrior', 0, 11, 10);
  at(s, 'warrior', 0, 10, 9);
  const plain = previewCombat(s, a, e).dmg;
  give(s, 0, 'zulu:horns');
  assert.equal(previewCombat(s, a, e).dmg, Math.round(plain * HORNS_MULT));
});

test('Kiai Strike (from Japan) sometimes denies the counter-blow, the same in preview and in battle', () => {
  const s = arena('rome', 'greeks');
  const a = at(s, 'warrior', 0, 9, 10);
  let d = at(s, 'defender', 1, 10, 10);
  for (let i = 0; i < 40 && !isKiaiLite(s, a, d); i++) { s.units = s.units.filter((u) => u !== d); d = at(s, 'defender', 1, 10, 10); }
  assert.ok(isKiaiLite(s, a, d));
  assert.ok(previewCombat(s, a, d).ret > 0);
  give(s, 0, 'japan:kiai');
  assert.equal(previewCombat(s, a, d).ret, 0);
  const hp = a.hp;
  assert.ok(attack(s, a, d));
  assert.equal(a.hp, hp);
});

test('Feigned Retreat (from the Mongols) lets riders and archers step back one tile after striking, and the AI uses it', () => {
  const s = arena('rome', 'greeks');
  const x = at(s, 'archer', 0, 8, 8);
  assert.ok(attack(s, x, at(s, 'defender', 1, 10, 8)));
  assert.deepEqual(moveOptions(s, x), [], 'without the tradition an archer stands after shooting');
  give(s, 0, 'mongols:feint');
  const a = at(s, 'knight', 0, 9, 10); // moves 3, but may only pull back 1
  const e = at(s, 'defender', 1, 10, 10);
  e.hp = 15;
  assert.ok(attack(s, a, e));
  const opts = moveOptions(s, a);
  assert.ok(opts.length > 0);
  for (const o of opts) assert.ok(Math.max(Math.abs(o.x - a.x), Math.abs(o.y - a.y)) <= 1);
  assert.ok(moveUnit(s, a, opts[0].x, opts[0].y));
  assert.deepEqual(moveOptions(s, a), []);
  // the AI pulls back away from the enemy
  const b = at(s, 'archer', 0, 8, 12);
  const f = at(s, 'defender', 1, 10, 12);
  f.hp = 15;
  s.players[0].human = false;
  assert.ok(attack(s, b, f));
  for (let i = 0; i < 60 && !b.moved; i++) aiStep(s);
  assert.equal(b.x, 7, 'stepped away');
});

test('Royal Tribute (Persia) and Devşirme Levy (Ottoman) pay on each capture', () => {
  const s = setup('rome', ['greeks', 'celts']);
  give(s, 0, 'persia:tribute');
  give(s, 0, 'ottoman:levy');
  const home = cityOf(s, 0);
  const pop = home.pop + home.level * 100;
  const stars = s.players[0].stars;
  conquer(s, 0, cityOf(s, 1));
  assert.ok(s.players[0].stars >= stars + TRIBUTE_LITE);
  assert.ok(home.pop + home.level * 100 > pop, 'the nearest city grew');
});

test('the AI settles an offer with its best-scoring option', () => {
  const s = setup('rome', ['vikings']);
  s.players[0].human = false;
  conquer(s, 0, cityOf(s, 1));
  const options = offersOf(s, 0)[0].options.map((id) => subTrait(id)!);
  const best = [...options].sort((a, b) => scoreSubTrait(s, 0, b) - scoreSubTrait(s, 0, a))[0];
  assert.ok(aiStep(s));
  assert.equal(offersOf(s, 0).length, 0);
  assert.equal(adoptedOf(s, 0)[0].id, best.id);
});

test('30-turn all-AI game with traditions in play completes and keeps the rules', () => {
  const tribes: TribeId[] = ['rome', 'vikings', 'zulu', 'japan', 'mongols'];
  const s = createGame({ seed: 11, human: null, opponents: tribes, mode: 'perfection', maxTurns: 30 });
  // every AI starts with one mechanic tradition and a choice to make, so the hooks and the AI flow all run
  const hooks = ['japan:kiai', 'mongols:feint', 'vikings:pillage', 'zulu:horns', 'persia:tribute'];
  s.players.forEach((p, i) => {
    give(s, i, hooks[i]);
    cultureOf(s, i).offers.push({ from: 'ottoman', city: 'Test', options: subTraitsOf('ottoman').map((t) => t.id) });
  });
  let guard = 0;
  while (!s.over && guard++ < 4000) { aiTurn(s); endTurn(s); }
  assert.ok(s.over);
  for (const p of s.players) {
    const list = adoptedOf(s, p.id);
    assert.ok(list.length <= MAX_ADOPTED);
    assert.equal(new Set(list.map((a) => a.from)).size, list.length, 'once per people');
    assert.ok(!list.some((a) => a.from === p.tribe));
    if (p.alive) assert.ok(list.some((a) => a.from === 'ottoman'), `${p.tribe} settled its offer`);
  }
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(s)));
});

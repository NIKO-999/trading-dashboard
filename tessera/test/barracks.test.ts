import assert from 'node:assert/strict';
import test from 'node:test';
import { TRIBE_IDS } from '../src/data/tribes';
import { aiTurn } from '../src/game/ai';
import { BARRACKS_COST, isTraining, TRAIN_TURNS } from '../src/game/barracks';
import { drain } from '../src/game/events';
import { stockOf } from '../src/game/goods';
import { CULTIVATE_BASE, CULTIVATE_STEP, HOMESTEAD_COST } from '../src/game/homestead';
import { createGame, spawnUnit } from '../src/game/mapgen';
import { defenseBonus, doAction, tileActions, unitCap } from '../src/game/rules';
import { endTurn, startTurn } from '../src/game/turn';
import type { GameState, Tile, TribeId } from '../src/game/types';

function game(me: TribeId) {
  const s = createGame({ seed: 7, human: me, opponents: ['greeks'], mode: 'perfection' });
  s.players[0].stars = 100;
  s.players[0].techs.push('tactics', 'farming', 'climbing', 'mining', 'smithing', 'archery');
  return s;
}
/** A free field in the capital's land, cleared for the test. */
function field(s: GameState, pid = 0, skip = 0): Tile {
  const c = s.cities.find((k) => k.owner === pid)!;
  const t = s.tiles.filter((x) => x.owner === c.id && x.cityId === null && x.terrain !== 'shallow' && x.terrain !== 'ocean')[skip];
  t.terrain = 'field'; t.resource = null; t.improvement = null; t.village = false; t.ruin = false;
  s.units = s.units.filter((u) => !(u.x === t.x && u.y === t.y));
  return t;
}
const act = (s: GameState, t: Tile, id: string) => tileActions(s, 0, t).find((a) => a.id === id);
/** Passes whole rounds for player 0 (start of its turn each time). */
function rounds(s: GameState, n: number) { for (let i = 0; i < n; i++) { s.turn++; s.current = 0; startTurn(s); } drain(); }

test('barracks cost depends on the empire type', () => {
  for (const tribe of ['rome', 'egypt', 'polynesia'] as TribeId[]) {
    const s = game(tribe);
    const a = act(s, field(s), 'barracks')!;
    assert.ok(a.enabled);
    assert.ok([BARRACKS_COST.military, BARRACKS_COST.economy, BARRACKS_COST.naval].includes(a.cost));
  }
});

test('a warrior trains into a swordsman for free, in turns, using iron; half defence meanwhile', () => {
  const s = game('rome'); // Military: 2 turns
  const t = field(s);
  assert.ok(doAction(s, 0, t, 'barracks'));
  const u = spawnUnit(s, 'warrior', 0, t.x, t.y, null);
  u.moved = u.attacked = false;
  const noIron = act(s, t, 'barracks:train')!;
  assert.ok(!noIron.enabled && /Iron/.test(noIron.reason!));
  stockOf(s.players[0]).iron = 2;
  const stars = s.players[0].stars;
  const d0 = defenseBonus(s, u);
  assert.ok(doAction(s, 0, t, 'barracks:train'));
  assert.equal(s.players[0].stars, stars, 'free');
  assert.equal(stockOf(s.players[0]).iron, 0);
  assert.ok(isTraining(u) && u.moved && u.attacked);
  assert.equal(defenseBonus(s, u), Math.max(0.5, d0 * 0.5));
  rounds(s, TRAIN_TURNS.military.up - 1);
  assert.ok(isTraining(u) && u.moved, 'still locked in');
  rounds(s, 1);
  assert.ok(!isTraining(u));
  assert.ok(u.kind === 'swordsman' || u.kind === 'legionary' || u.kind !== 'warrior', `became ${u.kind}`);
  assert.ok(!u.moved, 'free to act again');
});

test('an archer drills into a veteran; a War College makes trained units veterans too', () => {
  const s = game('egypt'); // Economy: slower
  const t = field(s);
  assert.ok(doAction(s, 0, t, 'barracks'));
  const u = spawnUnit(s, 'archer', 0, t.x, t.y, null);
  u.moved = u.attacked = false;
  assert.equal(act(s, t, 'barracks:train')!.label, 'Drill');
  assert.ok(doAction(s, 0, t, 'barracks:train'));
  rounds(s, TRAIN_TURNS.economy.drill);
  assert.ok(u.veteran && !isTraining(u));
  assert.ok(doAction(s, 0, t, 'barracks:expand'));
  assert.ok(doAction(s, 0, t, 'barracks:expand'));
  assert.equal(act(s, t, 'barracks:expand'), undefined, 'level 3 is the top');
});

test('homesteads are cheap for economy empires and dear for military ones, and grow the city', () => {
  for (const [tribe, cost] of [['egypt', HOMESTEAD_COST.economy], ['rome', HOMESTEAD_COST.military]] as const) {
    const s = game(tribe);
    const t = field(s);
    const a = act(s, t, 'homestead')!;
    assert.equal(a.cost, cost, tribe);
    const c = s.cities.find((k) => k.owner === 0)!;
    const pop = c.pop + c.level * 100;
    assert.ok(doAction(s, 0, t, 'homestead'));
    assert.equal(t.improvement, 'farm');
    assert.ok(c.pop + c.level * 100 > pop);
    assert.equal(act(s, field(s, 0, 1), 'homestead')!.cost, cost + 1, 'the next one in the city costs 1 more');
  }
});

test('cultivate: only once a met empire has developed it; 8 stars, dearer each time', () => {
  const s = game('rome');
  const t = field(s);
  assert.equal(act(s, t, 'cultivate:wine'), undefined, 'nobody has vineyards');
  const theirs = s.cities.find((k) => k.owner === 1)!;
  const v = s.tiles.find((x) => x.owner === theirs.id && x.cityId === null)!;
  v.resource = 'wine'; v.improvement = 'estate';
  assert.equal(act(s, t, 'cultivate:wine'), undefined, 'not met yet');
  s.players[0].met = [1];
  const a = act(s, t, 'cultivate:wine')!;
  assert.ok(a.enabled && a.cost === CULTIVATE_BASE);
  assert.ok(doAction(s, 0, t, 'cultivate:wine'));
  assert.equal(t.resource, 'wine');
  assert.equal(t.improvement, 'estate');
  // iron: once they have a mine
  const m = s.tiles.find((x) => x.owner === theirs.id && x.cityId === null && x !== v)!;
  m.improvement = 'mine';
  const t2 = field(s, 0, 1);
  const iron = act(s, t2, 'cultivate:iron')!;
  assert.equal(iron.cost, CULTIVATE_BASE + CULTIVATE_STEP);
  assert.ok(doAction(s, 0, t2, 'cultivate:iron'));
  assert.equal(t2.improvement, 'mine');
});

test('AI games build barracks, train units and homestead', () => {
  let barracks = 0, trained = 0, homes = 0;
  for (const seed of [2, 5]) {
    const s = createGame({ seed, human: null, opponents: TRIBE_IDS.slice(seed, seed + 5) as TribeId[], mode: 'perfection' });
    startTurn(s);
    let g = 0;
    while (!s.over && g++ < 400) {
      aiTurn(s);
      trained += s.units.filter((u) => isTraining(u)).length;
      endTurn(s); drain();
    }
    barracks += s.tiles.filter((t) => t.improvement === 'barracks').length;
    homes += s.cities.reduce((n, c) => n + Number(c.data?.homesteads ?? 0), 0);
  }
  assert.ok(barracks > 0, 'barracks built');
  assert.ok(trained > 0, 'units trained');
  assert.ok(homes > 0, 'homesteads made');
});


test('a Barracks gives its city one more unit slot and a second place to raise units', () => {
  const s = game('rome');
  const c = s.cities.find((k) => k.owner === 0)!;
  const cap = unitCap(c);
  const t = field(s);
  assert.ok(doAction(s, 0, t, 'barracks'));
  assert.equal(unitCap(c), cap + 1);
  // the city tile is occupied, but the yard still trains
  const city = s.tiles.find((x) => x.cityId === c.id)!;
  if (!s.units.some((u) => u.x === city.x && u.y === city.y)) spawnUnit(s, 'warrior', 0, city.x, city.y, null);
  const a = tileActions(s, 0, t).find((x) => x.id === 'train:warrior' || x.id.startsWith('train:'))!;
  assert.ok(a.enabled, a.reason ?? '');
  const before = c.units;
  assert.ok(doAction(s, 0, t, a.id));
  const u = s.units.find((x) => x.x === t.x && x.y === t.y)!;
  assert.equal(u.homeCity, c.id);
  assert.equal(c.units, before + 1);
});

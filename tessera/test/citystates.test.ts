import assert from 'node:assert/strict';
import test from 'node:test';
import { aiStep } from '../src/game/ai';
import {
  ANGER, CAPITAL_GAP, cityOfFree, envoyCost, ENVOY_BASE, envoysOf, FOE_ROUNDS, FREE_KIND_IDS, FREE_RAZE_SCORE, freeAi, freeCampBurned, freeCityOf,
  freeCount, freeDescribe, freeFoes, freeIncome, freeRound, freeTechOff, freeTurnStart, GIFT_EVERY, guardsOf, isFreeCity, isFreeUnit, leaderOf, tierOf,
} from '../src/game/citystates';
import { isRogueCity } from '../src/game/rebels';
import { drain } from '../src/game/events';
import { dist, isLand, neighbors, tileAt } from '../src/game/grid';
import { createGame, spawnUnit } from '../src/game/mapgen';
import { attack, citiesOf, cityById, doAction, income, score, techCost, tileActions, unitAt } from '../src/game/rules';
import { endTurn, startTurn } from '../src/game/turn';
import type { FreeCity, GameState } from '../src/game/types';
import { empires, isNeutral, neutralId } from '../src/game/wild';
import { stockOf } from '../src/game/goods';

const game = (opts: Partial<Parameters<typeof createGame>[0]> = {}) =>
  createGame({ seed: 7, human: 'rome', opponents: ['egypt', 'vikings', 'japan'], mode: 'perfection', mapSize: 'large', freeCities: true, ...opts });

/** Lets `pid` see the Free City. */
const find = (s: GameState, pid: number, f: FreeCity) => { const c = cityOfFree(s, f); s.players[pid].explored[c.y * s.size + c.x] = true; };
const cityTile = (s: GameState, f: FreeCity) => { const c = cityOfFree(s, f); return tileAt(s, c.x, c.y)!; };
/** Sends an envoy through the tile menu, as a player would. */
function envoy(s: GameState, pid: number, f: FreeCity): boolean {
  find(s, pid, f);
  s.players[pid].stars += 100;
  return doAction(s, pid, cityTile(s, f), `free:envoy:${f.id}`);
}
/** Puts `n` envoys of `pid` in `f` (one a round, as the rules allow). */
function envoys(s: GameState, pid: number, f: FreeCity, n: number) {
  for (let i = 0; i < n; i++) { f.last = {}; assert.ok(envoy(s, pid, f), `envoy ${i + 1}`); }
}
const byKind = (s: GameState, kind: FreeCity['kind']): FreeCity => {
  const f = s.free!.cities[0];
  f.kind = kind;
  return f;
};

test('Free Cities are off unless asked for, and older saves without them still play', () => {
  const s = game({ freeCities: false });
  assert.equal(s.free, undefined);
  assert.equal(neutralId(s), -1);
  freeRound(s); // no-ops
  freeTurnStart(s, 0);
  assert.equal(freeIncome(s, 0), 0);
  startTurn(s);
  for (let i = 0; i < 12; i++) endTurn(s);
  assert.equal(s.free, undefined);
});

test('about one Free City per two empires (2 to 6), on land at least 4 tiles from any capital, owned by the one neutral player', () => {
  assert.deepEqual([2, 3, 4, 5, 8, 12, 20].map(freeCount), [2, 2, 2, 3, 4, 6, 6]);
  for (const seed of [1, 2, 3, 7]) {
    const s = game({ seed, wild: true, rebels: true, clans: true });
    const n = s.free!.cities.length;
    assert.equal(n, freeCount(4), `seed ${seed}: ${n} Free Cities`);
    assert.equal(s.players.filter((p) => p.neutral).length, 1, 'a single neutral player, shared with the wild');
    const caps = s.cities.filter((c) => c.capital);
    for (const f of s.free!.cities) {
      const c = cityOfFree(s, f);
      assert.ok(isNeutral(s, c.owner) && isFreeCity(s, c) && !isRogueCity(s, c));
      assert.ok(caps.every((k) => dist(k.x, k.y, c.x, c.y) >= CAPITAL_GAP), `${c.name} is far from the capitals`);
      assert.ok(isLand(tileAt(s, c.x, c.y)!));
      assert.equal(c.level, 3);
      assert.ok(c.walls);
      const g = guardsOf(s, f);
      assert.equal(g.length, 1);
      assert.equal(g[0].kind, 'defender');
      assert.deepEqual([g[0].x, g[0].y], [c.x, c.y]);
      assert.ok(FREE_KIND_IDS.includes(f.kind));
      if (f.kind === 'maritime') assert.ok(neighbors(s, c.x, c.y).some((t) => t.terrain === 'shallow'), 'a Maritime city is on a coast');
    }
    assert.equal(new Set(s.free!.cities.map((f) => cityOfFree(s, f).name)).size, n, 'names are distinct');
  }
});

test('an envoy is sent from the city\'s tile menu once found: its cost grows with each one, one a round', () => {
  const s = game();
  startTurn(s);
  const f = s.free!.cities[0];
  const t = cityTile(s, f);
  s.players[0].explored.fill(false);
  assert.ok(!tileActions(s, 0, t).some((a) => a.id.startsWith('free:')), 'not before it is found');
  find(s, 0, f);
  s.players[0].stars = 50;
  const act = tileActions(s, 0, t).find((a) => a.id === `free:envoy:${f.id}`)!;
  assert.ok(act && act.enabled);
  assert.equal(act.cost, ENVOY_BASE);
  assert.ok(doAction(s, 0, t, act.id));
  assert.equal(s.players[0].stars, 50 - ENVOY_BASE);
  assert.equal(envoysOf(f, 0), 1);
  assert.equal(envoyCost(s, 0), ENVOY_BASE + 1, 'the next one costs a star more');
  const again = tileActions(s, 0, t).find((a) => a.id === `free:envoy:${f.id}`)!;
  assert.ok(!again.enabled && /One envoy a round/.test(again.reason!));
  // a unit of yours next to the city offers it too
  const spot = neighbors(s, t.x, t.y).find((n) => isLand(n) && n.terrain !== 'mountain' && !unitAt(s, n.x, n.y) && n.cityId === null)!;
  spawnUnit(s, 'warrior', 1, spot.x, spot.y, null);
  find(s, 1, f);
  s.players[1].stars = 20;
  assert.ok(tileActions(s, 1, spot).some((a) => a.id === `free:envoy:${f.id}` && a.enabled), 'from a unit standing beside it');
  assert.ok(doAction(s, 1, spot, `free:envoy:${f.id}`));
  assert.equal(envoysOf(f, 1), 1);
  const view = freeDescribe(s, cityOfFree(s, f), 0)!;
  assert.deepEqual(view.envoys.map((e) => [e.pid, e.n]), [[0, 1], [1, 1]], 'envoys per empire are shown');
});

test('1 envoy, 3 envoys and suzerain: the most (at least 3, strictly more than anyone)', () => {
  const s = game();
  startTurn(s);
  const f = s.free!.cities[0];
  envoys(s, 0, f, 2);
  assert.equal(tierOf(s, f, 0), 1);
  assert.equal(f.suz, null);
  envoys(s, 0, f, 1);
  assert.equal(f.suz, 0, 'three envoys and nobody else: suzerain');
  assert.equal(tierOf(s, f, 0), 3);
  envoys(s, 1, f, 3);
  assert.equal(f.suz, null, 'a tie: nobody');
  assert.equal(tierOf(s, f, 1), 2);
  envoys(s, 1, f, 1);
  assert.equal(f.suz, 1);
  assert.equal(leaderOf(s, f), 1);
  assert.equal(tierOf(s, f, 0), 2);
});

test('the bonuses: Trade pays, Science cheapens techs, Culture scores, Maritime grows the capital, Military gives Iron and units', () => {
  const s = game();
  startTurn(s);
  // Trade
  let f = byKind(s, 'trade');
  const before = income(s, 0);
  envoys(s, 0, f, 1);
  assert.equal(freeIncome(s, 0), 1);
  envoys(s, 0, f, 2);
  assert.equal(freeIncome(s, 0), 2 + 0, 'suzerain with no routes: +2');
  assert.equal(income(s, 0), before + 2, 'counted in the income the HUD shows');
  // Science
  f.kind = 'science';
  assert.equal(freeIncome(s, 0), 0);
  assert.equal(freeTechOff(s, 0), 3);
  const tech = 'riding';
  f.envoys = {};
  f.suz = null;
  const full = techCost(s, 0, tech);
  envoys(s, 0, f, 1);
  assert.equal(techCost(s, 0, tech), full - 1);
  // Culture
  f.kind = 'culture';
  const bonus = s.players[0].bonusScore;
  s.turn = 7;
  freeTurnStart(s, 0);
  assert.equal(s.players[0].bonusScore, bonus + 50);
  // Maritime
  f.kind = 'maritime';
  const cap = citiesOf(s, 0).find((c) => c.capital)!;
  const lvl = cap.level * 100 + cap.pop;
  s.turn = 10;
  freeTurnStart(s, 0);
  assert.ok(cap.level * 100 + cap.pop > lvl, 'the capital grew');
  // Military
  f = byKind(s, 'military');
  f.envoys = {};
  f.suz = null;
  envoys(s, 0, f, 3);
  assert.equal(f.suz, 0);
  stockOf(s.players[0]).iron = 0;
  const mine = s.units.filter((u) => u.owner === 0).length;
  f.since = 0;
  s.turn = GIFT_EVERY * 2; // a multiple of 3 too
  freeTurnStart(s, 0);
  assert.equal(stockOf(s.players[0]).iron, 1);
  assert.equal(stockOf(s.players[0]).horses, 1);
  assert.equal(s.units.filter((u) => u.owner === 0).length, mine + 1, 'a gift unit');
  drain();
});

test('attacking a Free City sends your envoys home and it takes none from you for a while', () => {
  const s = game();
  startTurn(s);
  const f = s.free!.cities[0];
  envoys(s, 0, f, 3);
  assert.equal(f.suz, 0);
  const c = cityOfFree(s, f);
  const spot = neighbors(s, c.x, c.y).find((n) => isLand(n) && n.terrain !== 'mountain' && !unitAt(s, n.x, n.y) && n.cityId === null)!;
  const a = spawnUnit(s, 'swordsman', 0, spot.x, spot.y, null);
  a.moved = a.attacked = false;
  assert.ok(attack(s, a, guardsOf(s, f)[0]));
  assert.equal(envoysOf(f, 0), 0);
  assert.equal(f.suz, null);
  assert.ok(freeFoes(s, f).includes(0));
  s.players[0].stars = 50;
  const act = tileActions(s, 0, cityTile(s, f)).find((x) => x.id === `free:envoy:${f.id}`)!;
  assert.ok(!act.enabled && /attacked/.test(act.reason!));
  s.turn += FOE_ROUNDS;
  assert.ok(!freeFoes(s, f).includes(0), 'it forgets in time');
  drain();
});

test('a suzerain\'s Free City strikes the suzerain\'s foes nearby, and never the suzerain', () => {
  const s = game();
  startTurn(s);
  const f = s.free!.cities[0];
  envoys(s, 1, f, 3);
  assert.equal(f.suz, 1);
  const c = cityOfFree(s, f);
  const spots = neighbors(s, c.x, c.y).filter((n) => isLand(n) && n.terrain !== 'mountain' && !unitAt(s, n.x, n.y) && n.cityId === null);
  const friend = spawnUnit(s, 'warrior', 1, spots[0].x, spots[0].y, null);
  const foe = spawnUnit(s, 'warrior', 2, spots[1].x, spots[1].y, null);
  foe.hp = 3;
  freeRound(s);
  assert.equal(friend.hp, 10, 'the suzerain is safe');
  assert.equal(foe.hp, 3, 'no war with the suzerain yet: left alone');
  // the foe's empire fights the suzerain
  const x = spawnUnit(s, 'archer', 2, 0, 0, null);
  const y = spawnUnit(s, 'warrior', 1, 1, 0, null);
  x.moved = x.attacked = false;
  s.players[2].explored.fill(true);
  assert.ok(attack(s, x, y));
  assert.ok(freeFoes(s, f).includes(2) && !freeFoes(s, f).includes(1));
  freeRound(s);
  assert.ok(!s.units.includes(foe) || foe.hp < 3, 'the suzerain\'s foe is struck');
  assert.ok(s.units.includes(friend) && friend.hp === 10);
  assert.ok(guardsOf(s, f).some((u) => u.data!.levy), 'a suzerain\'s city raises a levy');
  drain();
});

test('conquest: the Free City becomes an ordinary city of the conqueror, and envoy holders are angered', () => {
  const s = game({ diplomacy: true });
  startTurn(s);
  const f = s.free!.cities[0];
  envoys(s, 1, f, 2);
  envoys(s, 2, f, 1);
  const c = cityOfFree(s, f);
  for (const g of guardsOf(s, f)) s.units = s.units.filter((u) => u !== g);
  const u = spawnUnit(s, 'warrior', 0, c.x, c.y, null);
  u.moved = u.attacked = false;
  assert.ok(doAction(s, 0, tileAt(s, c.x, c.y)!, 'capture'));
  assert.equal(c.owner, 0);
  assert.ok(!isFreeCity(s, c));
  assert.ok(!s.free!.cities.includes(f));
  assert.equal(s.diplo!.mood['1:0'], -ANGER);
  assert.equal(s.diplo!.mood['2:0'], -ANGER);
  freeRound(s); // nothing left of it
  assert.equal(cityById(s, c.id)!.owner, 0);
  drain();
});

test('One City Challenge: a captured Free City is razed', () => {
  const s = game({ mode: 'onecity' });
  startTurn(s);
  const f = s.free!.cities[0];
  const c = cityOfFree(s, f);
  for (const g of guardsOf(s, f)) s.units = s.units.filter((u) => u !== g);
  const u = spawnUnit(s, 'warrior', 0, c.x, c.y, null);
  u.moved = u.attacked = false;
  const sc = s.players[0].bonusScore;
  assert.ok(doAction(s, 0, tileAt(s, c.x, c.y)!, 'capture'));
  assert.ok(!cityById(s, c.id), 'razed');
  assert.equal(citiesOf(s, 0).length, 1, 'still one city');
  assert.equal(s.players[0].bonusScore, sc + FREE_RAZE_SCORE);
  assert.ok(!s.free!.cities.includes(f));
  assert.ok(!s.over);
  drain();
});

test('Free Cities never grow or expand, rearm a lost guard, and are not Rogue States', () => {
  const s = game({ rebels: true });
  startTurn(s);
  const f = s.free!.cities[0];
  const c = cityOfFree(s, f);
  const land = s.tiles.filter((t) => t.owner === c.id).length;
  for (const g of guardsOf(s, f)) s.units = s.units.filter((u) => u !== g);
  for (let i = 0; i < 4 * 8; i++) endTurn(s);
  assert.equal(c.level, 3);
  assert.equal(s.tiles.filter((t) => t.owner === c.id).length, land);
  if (isFreeCity(s, c)) assert.ok(guardsOf(s, f).some((g) => g.kind === 'defender'), 'a new guard');
  assert.ok(!s.units.some((u) => isNeutral(s, u.owner) && u.data?.rogue === c.id), 'no rebels');
  drain();
});

test('quests reward envoys: grow a city, burn a raider camp', () => {
  const s = game();
  startTurn(s);
  const f = s.free!.cities[0];
  find(s, 0, f);
  f.quest = { kind: 'level', level: 2, until: s.turn + 5, done: [] };
  citiesOf(s, 0)[0].level = 2;
  freeRound(s);
  assert.equal(envoysOf(f, 0), 1);
  freeRound(s);
  assert.equal(envoysOf(f, 0), 1, 'once');
  f.quest = { kind: 'camp', camp: 42, until: s.turn + 5, done: [] };
  freeCampBurned(s, 42, 1);
  assert.equal(envoysOf(f, 1), 1);
  assert.equal(f.quest, null);
  drain();
});

test('computer empires send envoys when rich', () => {
  const s = game();
  startTurn(s);
  s.turn = 5;
  for (const f of s.free!.cities) find(s, 1, f);
  s.players[1].stars = 40;
  s.current = 1;
  assert.ok(freeAi(s, 1));
  assert.equal(s.free!.cities.reduce((n, f) => n + envoysOf(f, 1), 0), 1);
  s.players[1].stars = 3;
  s.free!.cities.forEach((f) => { f.last = {}; });
  assert.ok(!freeAi(s, 1), 'not when poor');
});

test('saves: the state is plain JSON', () => {
  const s = game();
  startTurn(s);
  envoys(s, 0, s.free!.cities[0], 2);
  const back = JSON.parse(JSON.stringify(s)) as GameState;
  assert.deepEqual(back.free, s.free);
  assert.equal(freeCityOf(back, cityById(back, s.free!.cities[0].id))!.envoys[0], 2);
  assert.ok(isFreeUnit(back, back.units.find((u) => u.data?.free !== undefined)!));
});

test('a 30-turn all-AI game: envoys are sent and a suzerain emerges', () => {
  const s = createGame({ seed: 3, human: null, opponents: ['rome', 'egypt', 'aztec', 'vikings', 'japan'], mode: 'perfection', maxTurns: 30, freeCities: true, clans: true, diplomacy: true });
  startTurn(s);
  let suzerains = 0;
  let guard = 0;
  while (!s.over && guard++ < 4000) {
    let n = 0;
    while (aiStep(s) && n++ < 400);
    endTurn(s);
    drain();
    suzerains = Math.max(suzerains, s.free!.cities.filter((f) => f.suz !== null).length);
  }
  const sent = Object.values(s.free!.sent).reduce((a, b) => a + b, 0);
  assert.ok(sent >= 5, `envoys sent: ${sent}`);
  assert.ok(Object.keys(s.free!.sent).length >= 2, 'several empires send envoys');
  assert.ok(suzerains >= 1 || s.log.some((l) => /suzerain/.test(l.text)), 'a suzerain emerged');
  assert.ok(empires(s).every((p) => score(s, p.id) >= 0));
});

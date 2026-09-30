import assert from 'node:assert/strict';
import test from 'node:test';
import { aiStep } from '../src/game/ai';
import { adopt, cultureOf, subTraitsOf } from '../src/game/culture';
import { drain } from '../src/game/events';
import { dist, isLand, neighbors, tileAt } from '../src/game/grid';
import { createGame, foundCity, meet, spawnUnit } from '../src/game/mapgen';
import { roadNetwork } from '../src/game/network';
import { checkGameOver, cityById, citiesOf, doAction, income, livingPlayers, score, unitAt } from '../src/game/rules';
import {
  cultureUnrest, FAR, garrison, holdsPost, isRogueCity, isRogueUnit, onBrink, rebelAi, REARM, revolt, rogueGarrison, rogueRound, subject,
  unrestFactors, unrestLine, unrestOf, UNREST_MAX,
} from '../src/game/rebels';
import { endTurn, startTurn } from '../src/game/turn';
import type { City, GameState, TribeId } from '../src/game/types';
import { empires, isNeutral, neutralId, wildRound } from '../src/game/wild';

const game = (opts: Partial<Parameters<typeof createGame>[0]> = {}) =>
  createGame({ seed: 11, human: 'rome', opponents: ['egypt', 'vikings'], mode: 'perfection', mapSize: 'huge', rebels: true, ...opts });

/**
 * A conquered city of `pid` (origin people `origin`) at distance `d` (or more) from its capital, on open field, with
 * no units on or around it.
 */
function conquered(s: GameState, pid: number, d: number, origin: TribeId = 'egypt'): City {
  const cap = citiesOf(s, pid).find((c) => c.capital)!;
  const t = s.tiles
    .filter((x) => isLand(x) && x.terrain !== 'mountain' && x.cityId === null && x.owner === null && dist(x.x, x.y, cap.x, cap.y) >= d
      && neighbors(s, x.x, x.y).every((n) => n.cityId === null && n.owner === null && isLand(n) && n.terrain !== 'mountain')
      && s.cities.every((c) => dist(c.x, c.y, x.x, x.y) >= 3))
    .sort((a, b) => dist(a.x, a.y, cap.x, cap.y) - dist(b.x, b.y, cap.x, cap.y) || a.y - b.y || a.x - b.x)[0];
  assert.ok(t, 'a free spot for the city');
  const c = foundCity(s, t.x, t.y, pid, false);
  c.data = { ...c.data, origin };
  s.units = s.units.filter((u) => dist(u.x, u.y, c.x, c.y) > 1);
  return c;
}

const toasts = (pid: number) => drain().filter((e) => e.type === 'toast' && e.player === pid).map((e) => (e as { text: string }).text);

test('rebellions are off unless asked for; older saves never rebel', () => {
  const s = game({ rebels: false });
  assert.equal(s.rebels, undefined);
  const c = conquered(s, 0, FAR);
  assert.ok(!subject(s, c));
  for (let i = 0; i < 10; i++) cultureUnrest(s, 0);
  assert.equal(unrestOf(c), 0);
  assert.equal(neutralId(s), -1, 'no neutral player is added');
  assert.equal(game().rebels, true);
});

test('who can grow restless: conquered, non-capital cities only', () => {
  const s = game();
  const cap = citiesOf(s, 0)[0];
  assert.ok(!subject(s, cap), 'the capital never rebels');
  const own = conquered(s, 0, FAR, 'rome');
  assert.ok(!subject(s, own), 'a city of your own people is loyal');
  const c = conquered(s, 0, FAR);
  assert.ok(subject(s, c));
});

test('the meter: ungarrisoned and far adds, garrisons, roads, temples and adopted ways calm', () => {
  const s = game();
  const far = conquered(s, 0, FAR);
  assert.equal(garrison(s, far), null);
  assert.equal(unrestFactors(s, far).delta, 2, 'ungarrisoned +1, far from the capital +1');
  cultureUnrest(s, 0);
  assert.equal(unrestOf(far), 2);
  assert.match(unrestLine(s, far)!, /^Unrest 2\/6 \(\+2\/turn\) — garrison it$/);

  // a unit next to it calms it by 1, one on it by 2
  const edge = neighbors(s, far.x, far.y).find((t) => isLand(t) && t.terrain !== 'mountain')!;
  const g = spawnUnit(s, 'warrior', 0, edge.x, edge.y, null);
  assert.equal(garrison(s, far), 'near');
  assert.equal(unrestFactors(s, far).delta, -1);
  g.x = far.x; g.y = far.y;
  assert.equal(garrison(s, far), 'on');
  assert.equal(unrestFactors(s, far).delta, -2);
  cultureUnrest(s, 0);
  assert.equal(unrestOf(far), 0);
  s.units = s.units.filter((u) => u !== g);

  // a temple in its land and the conquered people's ways adopted
  const land = s.tiles.find((t) => t.owner === far.id && t.cityId === null)!;
  land.improvement = 'temple';
  assert.equal(unrestFactors(s, far).delta, 1);
  cultureOf(s, 0).offers.push({ from: 'egypt', city: far.name, options: subTraitsOf('egypt').map((t) => t.id) });
  assert.ok(adopt(s, 0, 'egypt', subTraitsOf('egypt')[0].id));
  assert.equal(unrestFactors(s, far).delta, 0);
  assert.ok(unrestFactors(s, far).why.some((w) => /Egyptian ways adopted/.test(w)));

  // a city near the capital only gains 1, and a road link to the capital calms it
  const near = conquered(s, 0, 2, 'vikings');
  assert.ok(dist(near.x, near.y, citiesOf(s, 0)[0].x, citiesOf(s, 0)[0].y) < FAR);
  assert.equal(unrestFactors(s, near).delta, 1);
  const cap = citiesOf(s, 0).find((c) => c.capital)!;
  s.players[0].techs.push('roads');
  for (let x = Math.min(cap.x, near.x); x <= Math.max(cap.x, near.x); x++) { const t = tileAt(s, x, cap.y)!; if (t.cityId === null) { t.terrain = 'field'; t.road = true; } }
  for (let y = Math.min(cap.y, near.y); y <= Math.max(cap.y, near.y); y++) { const t = tileAt(s, near.x, y)!; if (t.cityId === null) { t.terrain = 'field'; t.road = true; } }
  assert.ok(roadNetwork(s, near).linked.includes(cap.id));
  assert.equal(unrestFactors(s, near).delta, 0);
});

test('a full meter warns first; a turn later the city revolts into a Rogue State', () => {
  const s = game();
  const c = conquered(s, 0, FAR);
  c.level = 3;
  drain();
  cultureUnrest(s, 0); cultureUnrest(s, 0);
  assert.equal(unrestOf(c), 4);
  assert.ok(toasts(0).some((t) => /Unrest is rising in/.test(t)));
  cultureUnrest(s, 0);
  assert.equal(unrestOf(c), UNREST_MAX);
  assert.ok(onBrink(c));
  assert.equal(c.owner, 0, 'no revolt without a warning');
  assert.ok(toasts(0).some((t) => /on the brink of revolt/.test(t)));
  assert.match(unrestLine(s, c)!, /revolts next turn/);

  cultureUnrest(s, 0);
  assert.ok(isNeutral(s, c.owner), 'it broke away');
  assert.ok(isRogueCity(s, c));
  assert.equal(c.data?.origin, 'egypt');
  const rebels = s.units.filter((u) => isRogueUnit(s, u) && u.data!.rogue === c.id);
  assert.deepEqual(rebels.map((u) => u.kind).sort(), [...rogueGarrison(3)].sort(), 'a level-3 city raises two defenders');
  assert.ok(rebels.every((u) => dist(u.x, u.y, c.x, c.y) <= 1));
  assert.ok(toasts(0).some((t) => /revolts!/.test(t)));
  assert.ok(s.log.some((l) => /becomes a Rogue State/.test(l.text)));
  assert.ok(s.tiles.filter((t) => t.owner === c.id).length > 0, 'it keeps its land');
  const back = JSON.parse(JSON.stringify(s)) as GameState;
  assert.deepEqual(back.cities.find((k) => k.id === c.id), c);
  assert.equal(rogueGarrison(1).length, 1);
});

test('answering the warning with a garrison saves the city', () => {
  const s = game();
  const c = conquered(s, 0, FAR);
  for (let i = 0; i < 3; i++) cultureUnrest(s, 0);
  assert.ok(onBrink(c));
  spawnUnit(s, 'warrior', 0, c.x, c.y, null);
  cultureUnrest(s, 0);
  assert.equal(c.owner, 0);
  assert.equal(unrestOf(c), UNREST_MAX - 2);
  assert.ok(!onBrink(c));
});

test('an empire\'s last city never breaks away, and a captured city starts calm', () => {
  const s = game();
  const c = conquered(s, 0, FAR);
  const cap = citiesOf(s, 0).find((k) => k.capital)!;
  cap.owner = 1; // the capital is lost: this is now Rome's only city, and far from any capital
  for (let i = 0; i < 8; i++) cultureUnrest(s, 0);
  assert.equal(c.owner, 0);
  assert.ok(!onBrink(c));
  // the meter belongs to its owner: when the city changes hands it starts again
  c.data = { ...c.data, unrest: { pid: 0, n: 5, brink: false } };
  c.owner = 2;
  assert.equal(unrestOf(c), 0);
});

test('Rogue States strike units next to them, go back to their post, and rearm once emptied', () => {
  const s = game(); // no wild events: the rebels still act in the neutral round
  assert.equal(s.wild, undefined);
  const c = conquered(s, 0, FAR);
  revolt(s, c);
  const n = neutralId(s);
  assert.ok(n >= 0 && isNeutral(s, n));
  const rebel = s.units.find((u) => isRogueUnit(s, u))!;
  assert.equal(rebel.x, c.x);
  const spot = neighbors(s, c.x, c.y).find((t) => isLand(t) && t.terrain !== 'mountain' && !unitAt(s, t.x, t.y))!;
  const prey = spawnUnit(s, 'warrior', 1, spot.x, spot.y, null);
  prey.hp = 2;
  drain();
  wildRound(s);
  assert.ok(!s.units.includes(prey), 'the rebel cut it down');
  assert.deepEqual([rebel.x, rebel.y], [c.x, c.y], 'and went back to its city');
  assert.ok(toasts(1).some((t) => /Rebels cut down/.test(t)));

  // all its defenders gone: after REARM rounds it musters a warrior
  s.units = s.units.filter((u) => !isRogueUnit(s, u));
  rogueRound(s);
  const due = c.data!.rearm as number;
  assert.equal(due, s.turn + REARM);
  s.turn = due;
  rogueRound(s);
  assert.equal(s.units.filter((u) => isRogueUnit(s, u)).length, 1);
});

test('a Rogue State breaks nothing: income, score, elimination, rankings, meetings and capture', () => {
  const s = game();
  const c = conquered(s, 0, FAR);
  startTurn(s);
  const before = income(s, 0);
  revolt(s, c);
  const n = neutralId(s);
  assert.ok(income(s, 0) < before, 'its income is gone');
  assert.equal(empires(s).length, 3);
  assert.equal(livingPlayers(s).length, 3);
  assert.ok(Number.isFinite(score(s, n)));
  meet(s, 1, n);
  assert.ok(!(s.players[1].met ?? []).includes(n));
  checkGameOver(s);
  assert.ok(!s.over);
  // turns skip the neutral player, and its city pays it nothing
  for (let i = 0; i < 6; i++) { endTurn(s); assert.notEqual(s.current, n); }
  assert.equal(s.players[n].stars, 0);

  // Egypt captures it the ordinary way: clear the rebels, stand on it, start a turn there
  s.units = s.units.filter((u) => !isRogueUnit(s, u));
  const u = spawnUnit(s, 'warrior', 1, c.x, c.y, null);
  u.moved = u.attacked = false;
  s.players[1].explored.fill(true);
  assert.ok(doAction(s, 1, tileAt(s, c.x, c.y)!, 'capture'));
  assert.equal(c.owner, 1);
  assert.ok(s.players[n].alive === false && !s.over);
  assert.equal(cityById(s, c.id)!.data?.origin, 'egypt');
  assert.ok(!subject(s, c), 'back with its own people it is loyal');
});

test('the AI garrisons a restless city, trains a guard when no one is near, and holds the post', () => {
  const s = game({ human: null, opponents: ['rome', 'egypt'] });
  startTurn(s);
  const c = conquered(s, 0, FAR);
  c.data = { ...c.data, unrest: { pid: 0, n: 3, brink: false } };
  // nobody near and no stars: nothing to do
  s.players[0].stars = 0;
  s.units = s.units.filter((u) => u.owner !== 0);
  assert.ok(!rebelAi(s, 0));
  // stars to spare: it trains a guard in the city
  s.players[0].stars = 10;
  assert.ok(rebelAi(s, 0));
  const guard = unitAt(s, c.x, c.y)!;
  assert.equal(guard.owner, 0);
  assert.ok(holdsPost(s, guard));
  assert.ok(!rebelAi(s, 0), 'garrisoned: nothing more to do');

  // a unit nearby walks in
  s.units = s.units.filter((u) => u !== guard);
  c.units = 0;
  s.players[0].stars = 0;
  const edge = neighbors(s, c.x, c.y).find((t) => isLand(t) && t.terrain !== 'mountain')!;
  const w = spawnUnit(s, 'warrior', 0, edge.x, edge.y, null);
  w.moved = w.attacked = false;
  s.players[0].explored.fill(true);
  assert.ok(rebelAi(s, 0));
  assert.deepEqual([w.x, w.y], [c.x, c.y]);
  // and the ordinary AI keeps it there while the city is restless
  for (let i = 0; i < 50 && aiStep(s); i++);
  assert.deepEqual([w.x, w.y], [c.x, c.y]);
});

test('a 30-turn all-AI game with rebellions and a Rogue State plays cleanly', () => {
  const s = createGame({ seed: 9, human: null, opponents: ['rome', 'mongols', 'zulu', 'vikings', 'persia'], mode: 'perfection', mapSize: 'normal', rebels: true });
  // a Rogue State in the middle of the map from the start, and a restless city for the Romans
  const rogue = conquered(s, 1, 4, 'aztec');
  rogue.level = 3;
  revolt(s, rogue);
  const restless = conquered(s, 0, FAR, 'aztec');
  restless.data = { ...restless.data, unrest: { pid: 0, n: 4, brink: false } };
  const n = neutralId(s);
  startTurn(s);
  const texts: string[] = [];
  let takenFromRebels = false;
  let guardedEarly = false;
  let guard = 0;
  while (!s.over && guard++ < 1000) {
    assert.notEqual(s.current, n);
    let k = 0;
    while (aiStep(s) && k++ < 400);
    if (s.current === 0 && s.turn <= 1 && garrison(s, restless) !== null) guardedEarly = true;
    endTurn(s);
    for (const e of drain()) {
      if (e.type === 'toast') texts.push(e.text);
      if (e.type === 'capture' && e.from === n) takenFromRebels = true;
    }
  }
  assert.ok(s.over);
  assert.ok(s.winner !== null && !isNeutral(s, s.winner));
  assert.ok(texts.some((t) => /Rebels (strike|cut down)/.test(t)) || takenFromRebels, 'the Rogue State fought or fell');
  assert.ok(guardedEarly, 'the Romans sent a garrison to their restless city at once');
  assert.ok(!isNeutral(s, restless.owner), 'so it never broke away');
  for (const p of s.players) assert.ok(Number.isFinite(p.stars) && p.stars >= 0);
  JSON.parse(JSON.stringify(s));
});

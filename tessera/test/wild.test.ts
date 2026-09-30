import assert from 'node:assert/strict';
import test from 'node:test';
import { aiStep, aiTurn } from '../src/game/ai';
import { drain } from '../src/game/events';
import { dist, tileAt } from '../src/game/grid';
import { createGame, meet, spawnUnit } from '../src/game/mapgen';
import { attack, citiesOf, doAction, livingPlayers, maxHp, moveOptions, tileActions } from '../src/game/rules';
import { endTurn, startTurn } from '../src/game/turn';
import type { GameState, Tile } from '../src/game/types';
import {
  ASH_POP, ASH_STARS, BEAST_RESPAWN, BEASTS, campAt, empires, ensureNeutral, erupt, isAsh, isLava, isNeutral, minBid, neutralId,
  RESTOCK, spawnNeutral, volcanoDue, wildAi, wildRound,
} from '../src/game/wild';
import { TRIBE_IDS } from '../src/data/tribes';
import { perkSum } from '../src/game/perks';

const game = (opts: Partial<Parameters<typeof createGame>[0]> = {}) =>
  createGame({ seed: 11, human: 'rome', opponents: ['egypt', 'vikings'], mode: 'perfection', mapSize: 'huge', wild: true, ...opts });

/** A square of tiles (radius r) far from every city and unit, rebuilt as `terrain`. */
function clearing(s: GameState, r: number, terrain: Tile['terrain']): Tile {
  for (const t of s.tiles) {
    if (t.x < r || t.y < r || t.x >= s.size - r || t.y >= s.size - r) continue;
    const block = s.tiles.filter((n) => dist(n.x, n.y, t.x, t.y) <= r);
    if (s.cities.some((c) => dist(c.x, c.y, t.x, t.y) <= r + 1) || s.units.some((u) => dist(u.x, u.y, t.x, t.y) <= r)) continue;
    if (block.some((n) => n.village || n.ruin || campAt(s, n.x, n.y) || volcanoDue(n) !== null)) continue;
    for (const n of block) { n.terrain = terrain; n.resource = null; n.improvement = null; n.road = false; n.data = undefined; }
    return t;
  }
  throw new Error('no clearing');
}

test('the neutral player is hidden: last, never alive, no turns, no meetings, not an empire', () => {
  const s = game();
  const n = neutralId(s);
  assert.equal(n, s.players.length - 1);
  assert.ok(isNeutral(s, n) && !isNeutral(s, 0) && !isNeutral(s, 99));
  assert.equal(s.players[n].alive, false);
  assert.equal(empires(s).length, 3);
  assert.equal(livingPlayers(s).length, 3);
  assert.equal(ensureNeutral(s), n, 'ensureNeutral is idempotent');
  meet(s, 0, n);
  assert.ok(!(s.players[0].met ?? []).includes(n));
  startTurn(s);
  for (let i = 0; i < 12; i++) { endTurn(s); assert.notEqual(s.current, n); }
  assert.equal(s.turn, 4);
  // saves: the whole wild survives JSON
  const back = JSON.parse(JSON.stringify(s)) as GameState;
  assert.deepEqual(back.wild, s.wild);
  assert.equal(back.players[n].neutral, true);
});

test('wild events are off unless asked for, and older saves without them still play', () => {
  const s = game({ wild: false });
  assert.equal(s.wild, undefined);
  assert.equal(neutralId(s), -1);
  assert.equal(s.players.length, 3);
  wildRound(s); // a no-op
  // the neutral owner can still be added to such a game later (e.g. by rebel cities)
  const t = clearing(s, 1, 'ocean');
  const k = spawnNeutral(s, 'kraken', t.x, t.y);
  assert.equal(k.owner, 3);
  assert.equal(empires(s).length, 3);
  startTurn(s);
  for (let i = 0; i < 6; i++) endTurn(s);
  assert.ok(!s.over);
});

test('the map gets a few wild sites, kept away from capitals', () => {
  for (const [n, size] of [[2, 'normal'], [8, 'large']] as const) {
    const s = createGame({ seed: 3, human: null, opponents: TRIBE_IDS.slice(0, n), mode: 'perfection', mapSize: size, wild: true });
    const volcanoes = s.tiles.filter((t) => volcanoDue(t) !== null);
    assert.ok(volcanoes.length >= 1 && volcanoes.length <= 4);
    assert.ok(s.wild!.camps.length >= 1 && s.wild!.camps.length <= 4);
    for (const v of volcanoes) assert.ok(s.cities.filter((c) => c.capital).every((c) => dist(c.x, c.y, v.x, v.y) >= 3));
    const krakens = s.units.filter((u) => u.kind === 'kraken');
    assert.ok(krakens.length <= 3);
    for (const k of krakens) assert.equal(tileAt(s, k.x, k.y)!.terrain, 'ocean');
  }
});

test('the Kraken drags down a ship beside it, whoever owns it, and stays in the deep', () => {
  const s = game();
  s.units = s.units.filter((u) => u.kind !== 'kraken');
  const t = clearing(s, 2, 'ocean');
  const k = spawnNeutral(s, 'kraken', t.x, t.y);
  const ship = spawnUnit(s, 'ship', 0, t.x + 1, t.y, null);
  ship.carrying = 'warrior';
  wildRound(s);
  assert.ok(!s.units.includes(ship), 'the galley is sunk');
  assert.equal(tileAt(s, k.x, k.y)!.terrain, 'ocean');
  assert.ok(drain().some((e) => e.type === 'toast' && e.player === 0 && /Kraken/.test(e.text)));
});

test('the Kraken swims toward ships nearby', () => {
  const s = game();
  s.units = s.units.filter((u) => u.kind !== 'kraken');
  const t = clearing(s, 3, 'ocean');
  const k = spawnNeutral(s, 'kraken', t.x - 2, t.y);
  const ship = spawnUnit(s, 'warship', 1, t.x + 2, t.y, null);
  const before = dist(k.x, k.y, ship.x, ship.y);
  wildRound(s);
  assert.ok(dist(k.x, k.y, ship.x, ship.y) < before);
});

test('slaying the Kraken pays a big bounty, and another rises later', () => {
  const s = game();
  s.units = s.units.filter((u) => u.kind !== 'kraken');
  const t = clearing(s, 3, 'ocean');
  const k = spawnNeutral(s, 'kraken', t.x, t.y);
  const tri = spawnUnit(s, 'warship', 0, t.x + 2, t.y, null);
  tri.moved = tri.attacked = false;
  s.players[0].explored.fill(true);
  k.hp = 2;
  const stars = s.players[0].stars;
  assert.ok(attack(s, tri, k));
  assert.ok(!s.units.includes(k));
  assert.equal(s.players[0].stars, stars + BEASTS.kraken! + perkSum(s, 0, 'kill')); // and the Chiefdom's +1★ a kill (see game/government)
  assert.equal(s.wild!.respawn.length, 1);
  s.turn += BEAST_RESPAWN;
  wildRound(s);
  assert.equal(s.units.filter((u) => u.kind === 'kraken').length, 1, 'a new Kraken rises');
});

test('a Great Beast cannot be taken alive or boarded', () => {
  const s = createGame({ seed: 11, human: 'pirates', opponents: ['egypt'], mode: 'perfection', mapSize: 'huge', wild: true });
  s.units = s.units.filter((u) => u.kind !== 'kraken');
  const t = clearing(s, 2, 'ocean');
  const k = spawnNeutral(s, 'kraken', t.x, t.y);
  const tri = spawnUnit(s, 'warship', 0, t.x + 1, t.y, null);
  tri.moved = tri.attacked = false;
  s.players[0].explored.fill(true);
  k.hp = 3;
  assert.ok(tileActions(s, 0, tileAt(s, k.x, k.y)!).filter((a) => a.id.startsWith('mech:')).every((a) => !a.enabled));
  attack(s, tri, k);
  assert.ok(!s.units.includes(k), 'sunk, not captured');
});

test('a volcano rumbles, erupts, buries improvements in lava, and the ash grows crops', () => {
  const s = game();
  startTurn(s);
  const cap = citiesOf(s, 0)[0];
  // make a mountain beside the capital's farmland an active volcano due now
  const v = tileAt(s, cap.x + (cap.x + 2 < s.size ? 2 : -2), cap.y)!;
  v.terrain = 'mountain';
  const farm = s.tiles.find((t) => dist(t.x, t.y, v.x, v.y) === 1 && t.cityId === null && !t.village && !t.ruin && t.terrain !== 'mountain' && t.terrain !== 'shallow' && t.terrain !== 'ocean' && !s.units.some((u) => u.x === t.x && u.y === t.y))!;
  farm.terrain = 'field';
  farm.improvement = 'farm';
  farm.owner = cap.id;
  v.data = { volcano: s.turn + 1 };
  drain();
  wildRound(s);
  assert.ok(drain().some((e) => e.type === 'toast' && /rumbles/.test(e.text)), 'a warning the round before');
  s.turn++;
  wildRound(s);
  assert.equal(farm.improvement, null, 'the farm is gone');
  assert.ok(isLava(farm));
  assert.ok(!isLava(v) && volcanoDue(v)! > s.turn);
  assert.ok(drain().some((e) => e.type === 'toast' && e.player === 0 && /Lava destroyed your farm/.test(e.text)));
  // lava can't be entered
  const walker = spawnUnit(s, 'warrior', 0, cap.x, cap.y, null);
  walker.moved = false;
  assert.ok(!moveOptions(s, walker).some((o) => o.x === farm.x && o.y === farm.y));
  // it cools into ash at the end of the next round
  s.turn++;
  wildRound(s);
  assert.ok(!isLava(farm) && isAsh(farm));
  // the first development on ash grows the city more and pays stars
  farm.resource = 'crop';
  s.players[0].techs.push('farming');
  s.players[0].stars = 20;
  const pop = cap.pop + cap.level * 100;
  assert.ok(doAction(s, 0, farm, 'farm'));
  const grown = cap.pop + cap.level * 100 - pop;
  assert.ok(grown >= 2 + ASH_POP || cap.level > 1);
  assert.equal(s.players[0].stars, 20 - 5 + ASH_STARS);
  assert.ok(!isAsh(farm), 'the ash is used up');
});

test('lava burns units standing around the volcano', () => {
  const s = game();
  const t = clearing(s, 1, 'field');
  t.terrain = 'mountain';
  t.data = { volcano: s.turn };
  const u = spawnUnit(s, 'warrior', 1, t.x + 1, t.y, null);
  erupt(s, t);
  assert.equal(u.hp, maxHp(u) - 5);
});

test('mercenary camps: sealed bids, highest wins on the spot, the rest are refunded', () => {
  const s = game();
  const t = clearing(s, 1, 'field');
  s.wild!.camps = [{ x: t.x, y: t.y, offer: 'knight', restock: 0, bids: [] }];
  for (const p of s.players) p.explored.fill(true);
  s.players[0].stars = 30;
  s.players[1].stars = 30;
  s.players[2].stars = 30;
  const min = minBid('knight');
  const ids = (pid: number) => tileActions(s, pid, t).map((a) => a.id);
  assert.deepEqual(ids(0).filter((i) => i.startsWith('wild:')), [`wild:bid:${min}`, `wild:bid:${min + 3}`, `wild:bid:${min + 6}`]);
  assert.ok(doAction(s, 0, t, `wild:bid:${min}`));
  assert.ok(doAction(s, 1, t, `wild:bid:${min + 3}`));
  assert.ok(doAction(s, 2, t, `wild:bid:${min}`));
  assert.equal(s.players[1].stars, 30 - min - 3, 'stars are held in escrow');
  // player 0 raises to match player 1: a tie goes to the earlier bidder, player 0
  assert.ok(doAction(s, 0, t, `wild:bid:${min + 3}`));
  assert.equal(s.players[0].stars, 30 - min - 3);
  // player 2 withdraws and gets everything back
  assert.ok(doAction(s, 2, t, 'wild:withdraw'));
  assert.equal(s.players[2].stars, 30);
  wildRound(s);
  const hired = s.units.find((u) => u.owner === 0 && u.kind === 'knight');
  assert.ok(hired && hired.veteran && hired.homeCity === null && dist(hired.x, hired.y, t.x, t.y) <= 2);
  assert.equal(s.players[0].stars, 30 - min - 3);
  assert.equal(s.players[1].stars, 30, 'the loser is refunded');
  const camp = s.wild!.camps[0];
  assert.equal(camp.offer, null);
  // the camp restocks some rounds later
  s.turn += RESTOCK;
  wildRound(s);
  assert.ok(camp.offer);
});

test('only empires that have seen the camp can bid', () => {
  const s = game();
  const t = clearing(s, 1, 'field');
  s.wild!.camps = [{ x: t.x, y: t.y, offer: 'swordsman', restock: 0, bids: [] }];
  s.players[0].stars = 30;
  s.players[0].explored[t.y * s.size + t.x] = false;
  assert.ok(!tileActions(s, 0, t).some((a) => a.id.startsWith('wild:')));
  s.players[0].explored[t.y * s.size + t.x] = true;
  assert.ok(tileActions(s, 0, t).some((a) => a.id.startsWith('wild:') && a.enabled));
  assert.ok(!tileActions(s, 0, t).some((a) => a.id === 'temple' || a.id === 'market'), 'nothing is built on a camp');
});

test('the AI bids at a camp near its cities when it has stars to spare', () => {
  const s = game({ human: null, opponents: ['rome', 'egypt'] });
  startTurn(s);
  const cap = citiesOf(s, 0)[0];
  const spot = s.tiles.find((t) => dist(t.x, t.y, cap.x, cap.y) === 2 && t.cityId === null && !t.village)!;
  s.wild!.camps = [{ x: spot.x, y: spot.y, offer: 'swordsman', restock: 0, bids: [] }];
  s.players[0].explored.fill(true);
  s.turn = 5;
  s.players[0].stars = 4;
  assert.ok(!wildAi(s, 0), 'too poor');
  s.players[0].stars = 30;
  assert.ok(wildAi(s, 0));
  assert.equal(s.wild!.camps[0].bids[0].pid, 0);
  assert.ok(!wildAi(s, 0), 'one bid per offer');
});

test('a 30-turn all-AI game with wild events plays cleanly', () => {
  const s = createGame({ seed: 7, human: null, opponents: ['vikings', 'polynesia', 'rome', 'pirates', 'inca'], mode: 'perfection', mapSize: 'large', terrain: 'islands', wild: true });
  const n = neutralId(s);
  startTurn(s);
  const texts: string[] = [];
  let guard = 0;
  while (!s.over && guard++ < 1000) {
    assert.notEqual(s.current, n, 'the neutral player never takes a turn');
    let k = 0;
    while (aiStep(s) && k++ < 400);
    endTurn(s);
    for (const e of drain()) if (e.type === 'toast') texts.push(e.text);
  }
  assert.ok(s.over);
  assert.ok(s.winner !== null && !isNeutral(s, s.winner));
  assert.ok(texts.some((x) => /volcano erupts/.test(x)), 'a volcano erupted');
  assert.ok(texts.some((x) => /bid of \d+★ wins/.test(x)), 'someone hired mercenaries');
  assert.ok(s.tiles.some((t) => isAsh(t) || isLava(t)));
  for (const p of s.players) assert.ok(Number.isFinite(p.stars) && p.stars >= 0);
  JSON.parse(JSON.stringify(s));
});

test('a 26-empire game keeps its neutral player out of the way', () => {
  const s = createGame({ seed: 5, human: null, opponents: [...TRIBE_IDS], mode: 'perfection', wild: true });
  assert.equal(s.players.length, 27);
  assert.equal(empires(s).length, 26);
  startTurn(s);
  for (let i = 0; i < 26 * 3 && !s.over; i++) { aiTurn(s); endTurn(s); }
  assert.ok(!s.over || !isNeutral(s, s.winner ?? 0));
});

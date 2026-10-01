import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { doAction, maxHp, tileActions } from '../../src/game/rules';
import { tileAt } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { hookIncome, hookStat } from '../../src/game/mech';
import { HEAL_HP, MAX_GOLD, ROAD_STARS, SPEND, SPEND_STARS, STOOL_DEF, gold, mech, roadCities } from '../../src/game/mech/ashanti';
import type { City, GameState, Tile } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 5, human: 'ashanti', opponents: ['japan', 'rome'], mapSize: 'huge', mode: 'perfection' });
  const me = s.players.findIndex((p) => p.tribe === 'ashanti');
  for (const p of s.players) p.explored.fill(true);
  const cap = s.cities.find((c) => c.owner === me)!;
  cap.capital = true;
  s.players[me].stars = 100;
  s.units = s.units.filter((u) => Math.max(Math.abs(u.x - cap.x), Math.abs(u.y - cap.y)) > 6);
  for (const t of s.tiles) {
    if (t.improvement === 'mine' && t.owner !== null) t.improvement = null;
    if (Math.max(Math.abs(t.x - cap.x), Math.abs(t.y - cap.y)) <= 6) t.road = false;
  }
  const foes = s.players.filter((p) => p.id !== me && !p.neutral).map((p) => p.id);
  return { s, me, foe: foes[0], cap };
}

const dirOf = (s: GameState, c: City) => ({ dx: c.x < s.size / 2 ? 1 : -1, dy: c.y < s.size / 2 ? 1 : -1 });

function plot(s: GameState, x: number, y: number, terrain: Tile['terrain'] = 'field'): Tile {
  const t = tileAt(s, x, y)!;
  Object.assign(t, { terrain, resource: null, improvement: null, village: false, ruin: false });
  return t;
}

function city(s: GameState, pid: number, x: number, y: number): City {
  const t = plot(s, x, y);
  s.units = s.units.filter((u) => !(u.x === x && u.y === y));
  const id = Math.max(...s.cities.map((c) => c.id)) + 1;
  const c = { ...s.cities[0], id, owner: pid, x, y, capital: false, level: 1, pop: 0, name: `C${id}`, data: undefined, pendingRewards: [] } as City;
  s.cities.push(c);
  t.cityId = id;
  t.owner = id;
  return c;
}

const act = (s: GameState, me: number, c: City, id: string) => tileActions(s, me, tileAt(s, c.x, c.y)!).find((a) => a.id === id);
const setGold = (s: GameState, me: number, n: number) => { (s.players[me].mech ??= {}).gold = n; };

test('Golden Stool: Asante units in the capital defend +2', () => {
  const { s, me, foe, cap } = setup();
  const { dx } = dirOf(s, cap);
  const inCap = spawnUnit(s, 'warrior', me, cap.x, cap.y, null);
  const out = spawnUnit(s, 'warrior', me, cap.x + dx, cap.y, null);
  assert.equal(mech.stat!(s, me, inCap, 'def'), STOOL_DEF);
  assert.equal(mech.stat!(s, me, inCap, 'atk'), 0, 'defence only');
  assert.equal(mech.stat!(s, me, out, 'def'), 0, 'outside the capital');
  const outDef = hookStat(s, out, 'def');
  assert.equal(hookStat(s, inCap, 'def') - outDef, STOOL_DEF);
  // a second city is not the capital
  const other = city(s, me, cap.x + dx * 5, cap.y);
  const there = spawnUnit(s, 'warrior', me, other.x, other.y, null);
  assert.equal(mech.stat!(s, me, there, 'def'), 0);
  // an enemy standing in the Asante capital gets nothing
  s.units = s.units.filter((u) => u !== inCap);
  const e = spawnUnit(s, 'warrior', foe, cap.x, cap.y, null);
  assert.equal(mech.stat!(s, me, e, 'def'), 0);
});

test('Gold dust: 1 per mine a turn, capped at 20', () => {
  const { s, me, foe, cap } = setup();
  const { dx, dy } = dirOf(s, cap);
  const a = plot(s, cap.x + dx, cap.y, 'mountain'), b = plot(s, cap.x, cap.y + dy, 'mountain');
  a.owner = b.owner = cap.id;
  a.improvement = b.improvement = 'mine';
  const far = plot(s, cap.x + dx * 8, cap.y + dy * 8, 'mountain'); // outside the borders: no dust
  far.owner = null;
  far.improvement = 'mine';
  assert.equal(gold(s, me), 0);
  mech.turnStart!(s, me);
  assert.equal(gold(s, me), 2);
  mech.turnStart!(s, me);
  assert.equal(gold(s, me), 4);
  for (let i = 0; i < 20; i++) mech.turnStart!(s, me);
  assert.equal(gold(s, me), MAX_GOLD);
  // through the real turn
  setGold(s, me, 0);
  s.current = me;
  startTurn(s);
  assert.equal(gold(s, me), 2);
  // the other empires mine none
  mech.turnStart!(s, foe);
  assert.equal(gold(s, foe), 0);
  JSON.parse(JSON.stringify(s));
});

test('Spend gold dust: stars, a heal, a festival', () => {
  const { s, me, foe, cap } = setup();
  const { dx } = dirOf(s, cap);
  const second = city(s, me, cap.x + dx * 5, cap.y);
  const capT = tileAt(s, cap.x, cap.y)!;
  assert.equal(act(s, me, second, 'mech:gold:0'), undefined, 'only at the capital');
  // too little dust
  setGold(s, me, SPEND[0].dust - 1);
  const poor = act(s, me, cap, 'mech:gold:0')!;
  assert.ok(poor && !poor.enabled);
  assert.ok(!doAction(s, me, capT, 'mech:gold:0'));
  // 0: 5 dust → +8★
  setGold(s, me, 20);
  const stars = s.players[me].stars;
  assert.equal(act(s, me, cap, 'mech:gold:0')!.cost, 0);
  assert.ok(doAction(s, me, capT, 'mech:gold:0'));
  assert.equal(s.players[me].stars, stars + SPEND_STARS);
  assert.equal(gold(s, me), 20 - SPEND[0].dust);
  // 1: 8 dust → heal all units by 5 (no more than full); refused when no one is hurt
  setGold(s, me, 20);
  const u1 = spawnUnit(s, 'warrior', me, cap.x + dx, cap.y, null), u2 = spawnUnit(s, 'warrior', me, cap.x + dx * 3, cap.y, null);
  assert.ok(!act(s, me, cap, 'mech:gold:1')!.enabled, 'no one is hurt');
  u1.hp = 2; u2.hp = maxHp(u2) - 1;
  const e = spawnUnit(s, 'warrior', foe, cap.x + dx * 9, cap.y, null);
  e.hp = 2;
  assert.ok(doAction(s, me, capT, 'mech:gold:1'));
  assert.equal(u1.hp, 2 + HEAL_HP);
  assert.equal(u2.hp, maxHp(u2));
  assert.equal(e.hp, 2, 'enemies are not healed');
  assert.equal(gold(s, me), 20 - SPEND[1].dust);
  // 2: 10 dust → +1 population in every city
  setGold(s, me, 20);
  const pops = [cap, second].map((c) => c.level * 100 + c.pop);
  const foeCap = s.cities.find((c) => c.owner === foe)!, foePop = foeCap.level * 100 + foeCap.pop;
  assert.ok(doAction(s, me, capT, 'mech:gold:2'));
  assert.equal(gold(s, me), 20 - SPEND[2].dust);
  for (const [i, c] of [cap, second].entries()) assert.ok(c.level * 100 + c.pop > pops[i], `${c.name} grew`);
  assert.equal(foeCap.level * 100 + foeCap.pop, foePop);
  // other empires get no gold actions
  assert.equal(tileActions(s, foe, tileAt(s, foeCap.x, foeCap.y)!).find((x) => x.id.startsWith('mech:gold')), undefined);
});

test('Great Roads: +1★ for each city joined to the capital by road', () => {
  const { s, me, cap } = setup();
  const { dx, dy } = dirOf(s, cap);
  const a = city(s, me, cap.x + dx * 4, cap.y);
  city(s, me, cap.x, cap.y + dy * 4);
  const base = hookIncome(s, me);
  assert.equal(mech.income!(s, me), 0);
  // a broken road pays nothing
  for (let i = 1; i <= 2; i++) plot(s, cap.x + dx * i, cap.y).road = true;
  assert.equal(roadCities(s, me).length, 0);
  plot(s, cap.x + dx * 3, cap.y).road = true;
  assert.deepEqual(roadCities(s, me).map((c) => c.id), [a.id]);
  assert.equal(mech.income!(s, me), ROAD_STARS);
  for (let i = 1; i <= 3; i++) plot(s, cap.x, cap.y + dy * i).road = true;
  assert.equal(mech.income!(s, me), 2 * ROAD_STARS);
  assert.equal(hookIncome(s, me), base + 2 * ROAD_STARS);
  // cut one road
  tileAt(s, cap.x + dx * 2, cap.y)!.road = false;
  assert.equal(mech.income!(s, me), ROAD_STARS);
});

test('AI spends gold dust sensibly', () => {
  const { s, me, cap } = setup();
  s.players[me].human = false;
  const { dx } = dirOf(s, cap);
  setGold(s, me, 4);
  assert.equal(mech.ai!(s, me), false, 'too little dust');
  // a hurt army is healed first
  setGold(s, me, 12);
  for (let i = 1; i <= 3; i++) { const u = spawnUnit(s, 'warrior', me, cap.x + dx * i, cap.y, null); u.hp = 3; }
  assert.ok(mech.ai!(s, me));
  assert.equal(gold(s, me), 12 - SPEND[1].dust);
  // a small empire sells its dust
  s.units = s.units.filter((u) => u.owner !== me);
  setGold(s, me, 6);
  const stars = s.players[me].stars;
  assert.ok(mech.ai!(s, me));
  assert.equal(s.players[me].stars, stars + SPEND_STARS);
  // a wide empire holds a festival
  city(s, me, cap.x + dx * 5, cap.y);
  city(s, me, cap.x + dx * 8, cap.y);
  setGold(s, me, 10);
  assert.ok(mech.ai!(s, me));
  assert.equal(gold(s, me), 0);
  assert.equal(mech.ai!(s, me), false);
});

test('20-turn all-AI game with Asante completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['ashanti', 'kongo', 'japan'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 20 && guard++ < 1000) {
    aiTurn(s);
    endTurn(s);
  }
  assert.ok(s.turn >= 20 || s.over);
  const me = s.players.findIndex((p) => p.tribe === 'ashanti');
  assert.ok(gold(s, me) >= 0 && gold(s, me) <= MAX_GOLD);
  JSON.parse(JSON.stringify(s));
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { doAction, tileActions } from '../../src/game/rules';
import { tileAt } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { hookIncome, hookStat } from '../../src/game/mech';
import { BOLT_STARS, MAX_BOLTS, NKISI_ATK, NKISI_COST, ORCHARD_STARS, WEAVE_COST, bolts, hasNkisi, mech } from '../../src/game/mech/kongo';
import type { City, GameState, Tile } from '../../src/game/types';

function setup(diplomacy = false) {
  const s = createGame({ seed: 5, human: 'kongo', opponents: ['japan', 'rome'], mapSize: 'huge', mode: 'perfection', diplomacy });
  const me = s.players.findIndex((p) => p.tribe === 'kongo');
  for (const p of s.players) p.explored.fill(true);
  const cap = s.cities.find((c) => c.owner === me)!;
  cap.capital = true;
  s.players[me].stars = 100;
  s.units = s.units.filter((u) => Math.max(Math.abs(u.x - cap.x), Math.abs(u.y - cap.y)) > 4);
  for (const t of s.tiles) if (Math.max(Math.abs(t.x - cap.x), Math.abs(t.y - cap.y)) <= 4 && t.improvement === 'orchard') t.improvement = null;
  const foes = s.players.filter((p) => p.id !== me && !p.neutral).map((p) => p.id);
  return { s, me, foe: foes[0], other: foes[1], cap };
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

test('Kingdom of Cloth: every orchard in Kongo borders pays +1★', () => {
  const { s, me, foe, cap } = setup();
  const { dx, dy } = dirOf(s, cap);
  const base = mech.income!(s, me);
  const a = plot(s, cap.x + dx, cap.y), b = plot(s, cap.x, cap.y + dy);
  a.owner = b.owner = cap.id;
  a.improvement = 'orchard';
  assert.equal(mech.income!(s, me), base + ORCHARD_STARS);
  b.improvement = 'orchard';
  assert.equal(mech.income!(s, me), base + 2 * ORCHARD_STARS);
  // an orchard outside the borders pays nothing
  const out = plot(s, cap.x + dx * 6, cap.y + dy * 6);
  out.owner = null;
  out.improvement = 'orchard';
  assert.equal(mech.income!(s, me), base + 2 * ORCHARD_STARS);
  // nobody else is paid by Kongo's mechanic
  assert.equal(mech.income!(s, foe), 0);
  // and it reaches the treasury through the turn
  const before = hookIncome(s, me);
  b.improvement = null;
  assert.equal(hookIncome(s, me), before - ORCHARD_STARS);
});

test('Nkisi: 5★, once per city, enemies beside it attack −1', () => {
  const { s, me, foe, cap } = setup();
  const { dx, dy } = dirOf(s, cap);
  const a = act(s, me, cap, 'mech:nkisi');
  assert.ok(a && a.enabled);
  assert.equal(a.cost, NKISI_COST);
  const e = spawnUnit(s, 'warrior', foe, cap.x + dx, cap.y + dy, null);
  const far = spawnUnit(s, 'warrior', foe, cap.x + dx * 2, cap.y, null);
  const mine = spawnUnit(s, 'warrior', me, cap.x, cap.y + dy, null);
  const atkE = hookStat(s, e, 'atk'), atkF = hookStat(s, far, 'atk'), atkM = hookStat(s, mine, 'atk');
  assert.ok(doAction(s, me, tileAt(s, cap.x, cap.y)!, 'mech:nkisi'));
  assert.equal(s.players[me].stars, 100 - NKISI_COST);
  assert.ok(hasNkisi(cap));
  assert.equal(hookStat(s, e, 'atk'), atkE - NKISI_ATK, 'adjacent enemy is weakened');
  assert.equal(hookStat(s, far, 'atk'), atkF, 'two tiles away is not');
  assert.equal(hookStat(s, mine, 'atk'), atkM, 'Kongo units are untouched');
  assert.equal(hookStat(s, e, 'def'), 0, 'attack only');
  // once per city
  assert.equal(act(s, me, cap, 'mech:nkisi'), undefined);
  assert.ok(!doAction(s, me, tileAt(s, cap.x, cap.y)!, 'mech:nkisi'));
  assert.equal(s.players[me].stars, 100 - NKISI_COST);
  // another city may have its own
  const other = city(s, me, cap.x + dx * 5, cap.y);
  s.players[me].stars = NKISI_COST - 1;
  const poor = act(s, me, other, 'mech:nkisi')!;
  assert.ok(!poor.enabled);
  s.players[me].stars = 20;
  assert.ok(act(s, me, other, 'mech:nkisi')!.enabled);
  // other empires don't get it
  const foeCap = s.cities.find((c) => c.owner === foe)!;
  assert.equal(tileActions(s, foe, tileAt(s, foeCap.x, foeCap.y)!).find((x) => x.id === 'mech:nkisi'), undefined);
  JSON.parse(JSON.stringify(s));
});

test('Nkisi spares allies and peace partners', () => {
  const { s, me, foe, other, cap } = setup(true);
  const { dx, dy } = dirOf(s, cap);
  cap.data = { nkisi: s.turn };
  const e = spawnUnit(s, 'warrior', foe, cap.x + dx, cap.y, null);
  const f = spawnUnit(s, 'warrior', other, cap.x, cap.y + dy, null);
  const eAtk = hookStat(s, e, 'atk'), fAtk = hookStat(s, f, 'atk');
  s.diplo!.pacts.push({ a: me, b: foe, kind: 'alliance', since: s.turn } as never);
  assert.equal(hookStat(s, e, 'atk'), eAtk + NKISI_ATK, 'allies are not cursed');
  assert.equal(hookStat(s, f, 'atk'), fAtk, 'the enemy still is');
});

test('Raffia Treasury: 5★ a bolt, at most 5, +1★ each a turn, lost with the capital', () => {
  const { s, me, foe, cap } = setup();
  const { dx } = dirOf(s, cap);
  const second = city(s, me, cap.x + dx * 5, cap.y);
  assert.equal(act(s, me, second, 'mech:weave'), undefined, 'only at the capital');
  const a = act(s, me, cap, 'mech:weave')!;
  assert.ok(a.enabled);
  assert.equal(a.cost, WEAVE_COST);
  const base = mech.income!(s, me);
  const capT = tileAt(s, cap.x, cap.y)!;
  for (let i = 1; i <= MAX_BOLTS; i++) {
    assert.ok(doAction(s, me, capT, 'mech:weave'));
    assert.equal(bolts(s, me), i);
    assert.equal(mech.income!(s, me), base + i * BOLT_STARS);
  }
  assert.equal(s.players[me].stars, 100 - MAX_BOLTS * WEAVE_COST);
  const full = act(s, me, cap, 'mech:weave')!;
  assert.ok(!full.enabled && /5 bolts/.test(full.reason ?? ''));
  assert.ok(!doAction(s, me, capT, 'mech:weave'));
  assert.equal(bolts(s, me), MAX_BOLTS);
  // paid at the start of the turn
  s.players[me].stars = 0;
  s.current = me;
  const inc = hookIncome(s, me);
  assert.ok(inc >= MAX_BOLTS * BOLT_STARS);
  // losing a non-capital city keeps the cloth
  for (const id of [second]) {
    s.units = s.units.filter((u) => !(u.x === id.x && u.y === id.y));
    const u = spawnUnit(s, 'warrior', foe, id.x, id.y, null);
    u.moved = u.attacked = false;
    assert.ok(doAction(s, foe, tileAt(s, id.x, id.y)!, 'capture'));
  }
  assert.equal(bolts(s, me), MAX_BOLTS);
  // re-own a spare city so the capture of the capital doesn't end the empire
  city(s, me, cap.x, cap.y + (cap.y < s.size / 2 ? 5 : -5));
  s.units = s.units.filter((u) => !(u.x === cap.x && u.y === cap.y));
  const u = spawnUnit(s, 'warrior', foe, cap.x, cap.y, null);
  u.moved = u.attacked = false;
  assert.ok(doAction(s, foe, capT, 'capture'));
  assert.equal(cap.owner, foe);
  assert.equal(bolts(s, me), 0, 'the treasury fell with the capital');
  assert.equal(bolts(s, foe), 0, 'the conqueror gains no cloth');
});

test('AI raises nkisi at threatened cities and weaves when rich', () => {
  const { s, me, foe, cap } = setup();
  s.players[me].human = false;
  const { dx } = dirOf(s, cap);
  s.players[me].stars = 6;
  assert.equal(mech.ai!(s, me), false, 'no threat, not rich');
  spawnUnit(s, 'warrior', foe, cap.x + dx * 2, cap.y, null);
  s.players[me].stars = NKISI_COST + 2;
  assert.ok(mech.ai!(s, me));
  assert.ok(hasNkisi(cap));
  assert.equal(s.players[me].stars, 2);
  assert.equal(mech.ai!(s, me), false);
  s.players[me].stars = 40;
  let n = 0;
  while (mech.ai!(s, me) && n < 20) n++;
  assert.ok(n >= 1 && bolts(s, me) >= 1 && bolts(s, me) <= MAX_BOLTS);
  assert.ok(s.players[me].stars >= 13, 'keeps a reserve');
});

test('20-turn all-AI game with Kongo completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['kongo', 'zulu', 'japan'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 20 && guard++ < 1000) {
    aiTurn(s);
    endTurn(s);
  }
  assert.ok(s.turn >= 20 || s.over);
  JSON.parse(JSON.stringify(s));
});

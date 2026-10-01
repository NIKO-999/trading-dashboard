import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { doAction, maxHp, tileActions } from '../../src/game/rules';
import { tileAt } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { hookIncome, hookStat } from '../../src/game/mech';
import { COUNCIL_COST, COUNCIL_EVERY, LEAGUE_DEF, LEAGUE_MAX, councilIn, leagueIncome, leagueOf, mech } from '../../src/game/mech/haudenosaunee';
import type { City, GameState, Tile } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 5, human: 'haudenosaunee', opponents: ['japan'], mapSize: 'huge', mode: 'perfection' });
  const me = s.players.findIndex((p) => p.tribe === 'haudenosaunee');
  for (const p of s.players) p.explored.fill(true);
  const cap = s.cities.find((c) => c.owner === me)!;
  cap.capital = true;
  s.players[me].stars = 100;
  return { s, me, foe: 1 - me, cap };
}

/** Make a clean, owned tile of the given terrain at (x, y). */
function plot(s: GameState, x: number, y: number, owner: number | null, terrain: Tile['terrain'] = 'field'): Tile {
  const t = tileAt(s, x, y)!;
  Object.assign(t, { terrain, resource: null, improvement: null, village: false, ruin: false, owner });
  s.units = s.units.filter((u) => !(u.x === t.x && u.y === t.y));
  return t;
}

/** Hand a city to `pid` at (x, y) (made from scratch: other cities of the map are moved out of the way first). */
function city(s: GameState, pid: number, x: number, y: number): City {
  const t = plot(s, x, y, null);
  const id = Math.max(...s.cities.map((c) => c.id)) + 1;
  const c = { ...s.cities[0], id, owner: pid, x, y, capital: false, name: `C${id}`, data: undefined } as City;
  s.cities.push(c);
  t.cityId = id;
  t.owner = id;
  return c;
}

/** Leaves `pid` only its capital, at a spot with room around it. */
function alone(s: GameState, me: number, cap: City) {
  s.cities = s.cities.filter((c) => c.owner !== me || c === cap);
}

test('Three Sisters: building a farm on a crop grows a Haudenosaunee city by 3 (others by 2)', () => {
  const { s, me, foe, cap } = setup();
  for (const [pid, c] of [[me, cap], [foe, s.cities.find((e) => e.owner === foe)!]] as const) {
    s.players[pid].techs.push('farming');
    s.players[pid].stars = 50;
    const t = plot(s, c.x + 1, c.y, c.id);
    t.resource = 'crop';
    const act = tileActions(s, pid, t).find((a) => a.id === 'farm');
    assert.ok(act && act.enabled, 'farm offered');
    c.level = 8; c.pop = 0; // far from the next level, so the growth shows in pop
    assert.ok(doAction(s, pid, t, 'farm'));
    assert.equal(c.pop, pid === me ? 3 : 2, s.players[pid].tribe);
    if (pid === me) assert.match(act.desc, /\+3/);
  }
});

test('League: grows from the capital through cities within 4 tiles, at most 5 members', () => {
  const { s, me, cap } = setup();
  alone(s, me, cap);
  assert.deepEqual(leagueOf(s, me), [], 'a lone capital is not yet a League');
  const dir = cap.x < s.size / 2 ? 1 : -1;
  const far = city(s, me, cap.x + dir * 9, cap.y);
  assert.deepEqual(leagueOf(s, me), [], 'too far away');
  const b = city(s, me, cap.x + dir * 4, cap.y);
  assert.deepEqual(leagueOf(s, me).map((c) => c.id), [cap.id, b.id], 'b joins at 4 tiles');
  // b brings the far city within reach (5 tiles from b): still too far; one more link chains it in
  const mid = city(s, me, cap.x + dir * 7, cap.y);
  const ids = leagueOf(s, me).map((c) => c.id);
  assert.deepEqual(ids, [cap.id, b.id, mid.id, far.id], 'a chain of cities within 4 tiles');
  // a captured enemy-style city of another empire never joins
  const other = city(s, 1 - me, cap.x, cap.y + (cap.y < s.size / 2 ? 2 : -2));
  assert.ok(!leagueOf(s, me).includes(other));
  // the cap: five members
  city(s, me, cap.x, cap.y + (cap.y < s.size / 2 ? 4 : -4));
  city(s, me, cap.x + dir * 2, cap.y + (cap.y < s.size / 2 ? 4 : -4));
  assert.equal(s.cities.filter((c) => c.owner === me).length, 6);
  assert.equal(leagueOf(s, me).length, LEAGUE_MAX);
  assert.equal(leagueOf(s, me)[0], cap, 'the capital keeps the council fire');
  assert.equal(leagueIncome(s, me), LEAGUE_MAX - 1, 'the sixth city adds nothing');
  // other empires have no League
  assert.deepEqual(leagueOf(s, 1 - me), []);
});

test('League income: +1★ a turn for each member beyond the first', () => {
  const { s, me, cap } = setup();
  alone(s, me, cap);
  assert.equal(leagueIncome(s, me), 0);
  assert.equal(mech.income!(s, me), 0);
  const dir = cap.x < s.size / 2 ? 1 : -1;
  city(s, me, cap.x + dir * 3, cap.y);
  assert.equal(mech.income!(s, me), 1);
  city(s, me, cap.x + dir * 6, cap.y);
  assert.equal(mech.income!(s, me), 2);
  assert.equal(hookIncome(s, me), 2, 'through the hooks');
});

test('League defence: +0.5 for Haudenosaunee units inside League borders only', () => {
  const { s, me, foe, cap } = setup();
  alone(s, me, cap);
  const t = plot(s, cap.x, cap.y + (cap.y < s.size / 2 ? 1 : -1), cap.id);
  const u = spawnUnit(s, 'warrior', me, t.x, t.y, null);
  assert.equal(hookStat(s, u, 'def'), 0, 'no League yet');
  const dir = cap.x < s.size / 2 ? 1 : -1;
  const b = city(s, me, cap.x + dir * 4, cap.y);
  assert.equal(hookStat(s, u, 'def'), LEAGUE_DEF, 'inside a League city');
  t.owner = null;
  assert.equal(hookStat(s, u, 'def'), 0, 'outside the borders');
  t.owner = b.id;
  assert.equal(hookStat(s, u, 'def'), LEAGUE_DEF, 'any member city');
  t.owner = cap.id;
  const e = spawnUnit(s, 'warrior', foe, cap.x + dir, cap.y, null);
  tileAt(s, e.x, e.y)!.owner = cap.id;
  assert.equal(hookStat(s, e, 'def'), 0, 'an enemy gets nothing');
  assert.equal(hookStat(s, u, 'atk'), 0, 'defence only');
});

test('Condolence Council: at the capital, heals every unit to full, then waits 5 turns', () => {
  const { s, me, cap } = setup();
  const capT = tileAt(s, cap.x, cap.y)!;
  const other = plot(s, cap.x + (cap.x < s.size / 2 ? 2 : -2), cap.y, cap.id);
  assert.ok(!tileActions(s, me, other).some((a) => a.id === 'mech:council'), 'only at the capital');
  const a = spawnUnit(s, 'warrior', me, other.x, other.y, null);
  const b = spawnUnit(s, 'archer', me, cap.x, cap.y + (cap.y < s.size / 2 ? 3 : -3), null);
  a.hp = 2; b.hp = 1;
  const act = tileActions(s, me, capT).find((x) => x.id === 'mech:council');
  assert.ok(act && act.enabled);
  assert.equal(act.cost, COUNCIL_COST);
  assert.ok(doAction(s, me, capT, 'mech:council'));
  assert.equal(s.players[me].stars, 100 - COUNCIL_COST);
  assert.equal(a.hp, maxHp(a));
  assert.equal(b.hp, maxHp(b));
  // the cooldown
  assert.equal(councilIn(s, me), COUNCIL_EVERY);
  a.hp = 1;
  const again = tileActions(s, me, capT).find((x) => x.id === 'mech:council');
  assert.ok(again && !again.enabled && /again in 5/.test(again.reason ?? ''));
  assert.ok(!doAction(s, me, capT, 'mech:council'));
  s.turn += COUNCIL_EVERY - 1;
  assert.ok(!tileActions(s, me, capT).find((x) => x.id === 'mech:council')!.enabled);
  s.turn += 1;
  assert.ok(doAction(s, me, capT, 'mech:council'));
  assert.equal(a.hp, maxHp(a));
  // nobody else holds the council
  const foeCap = s.cities.find((c) => c.owner !== me)!;
  assert.ok(!tileActions(s, 1 - me, tileAt(s, foeCap.x, foeCap.y)!).some((x) => x.id === 'mech:council'));
  JSON.parse(JSON.stringify(s));
});

test('AI calls the council with 2+ wounded units and the stars for it', () => {
  const { s, me, cap } = setup();
  s.players[me].human = false;
  for (const u of s.units) if (u.owner === me) u.hp = maxHp(u);
  const a = spawnUnit(s, 'warrior', me, cap.x, cap.y, null);
  a.hp = 3;
  assert.equal(mech.ai!(s, me), false, 'one wounded unit is not enough');
  const b = spawnUnit(s, 'archer', me, cap.x + (cap.x < s.size / 2 ? 1 : -1), cap.y, null);
  b.hp = 2;
  s.players[me].stars = COUNCIL_COST - 1;
  assert.equal(mech.ai!(s, me), false, 'too poor');
  s.players[me].stars = 10;
  assert.ok(mech.ai!(s, me));
  assert.equal(s.players[me].stars, 10 - COUNCIL_COST);
  assert.equal(a.hp, maxHp(a));
  assert.equal(b.hp, maxHp(b));
  a.hp = b.hp = 1;
  assert.equal(mech.ai!(s, me), false, 'cooling down');
});

test('20-turn all-AI game with the Haudenosaunee completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['haudenosaunee', 'vikings', 'japan'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 20 && guard++ < 1000) {
    aiTurn(s);
    endTurn(s);
  }
  assert.ok(s.turn >= 20 || s.over);
  JSON.parse(JSON.stringify(s));
});

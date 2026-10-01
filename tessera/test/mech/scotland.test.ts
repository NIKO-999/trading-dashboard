import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { doAction, maxHp, removeUnit, techCost, tileActions } from '../../src/game/rules';
import { tileAt } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { hookStat } from '../../src/game/mech';
import { ENLIGHT_MAX, GAMES_COST, GAMES_EVERY, MOUNTAIN_DEF, MOURN_STARS, enlightenmentTechOff, gamesIn, mech } from '../../src/game/mech/scotland';
import type { City, GameState, Tile } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 5, human: 'scotland', opponents: ['japan'], mapSize: 'huge', mode: 'perfection' });
  const me = s.players.findIndex((p) => p.tribe === 'scotland');
  for (const p of s.players) p.explored.fill(true);
  const cap = s.cities.find((c) => c.owner === me)!;
  cap.capital = true;
  s.players[me].stars = 100;
  // a clean slate around the capital: no mountains, no units
  for (const t of s.tiles) if (Math.max(Math.abs(t.x - cap.x), Math.abs(t.y - cap.y)) <= 4 && t.terrain === 'mountain') t.terrain = 'field';
  s.units = s.units.filter((u) => Math.max(Math.abs(u.x - cap.x), Math.abs(u.y - cap.y)) > 4);
  return { s, me, foe: 1 - me, cap };
}

/** Make a clean, owned tile of the given terrain at (x, y). */
function plot(s: GameState, x: number, y: number, owner: number | null, terrain: Tile['terrain'] = 'field'): Tile {
  const t = tileAt(s, x, y)!;
  Object.assign(t, { terrain, resource: null, improvement: null, village: false, ruin: false, owner });
  s.units = s.units.filter((u) => !(u.x === t.x && u.y === t.y));
  return t;
}

function city(s: GameState, pid: number, x: number, y: number): City {
  const t = plot(s, x, y, null);
  const id = Math.max(...s.cities.map((c) => c.id)) + 1;
  const c = { ...s.cities[0], id, owner: pid, x, y, capital: false, level: 1, pop: 0, name: `C${id}`, data: undefined, pendingRewards: [] } as City;
  s.cities.push(c);
  t.cityId = id;
  t.owner = id;
  return c;
}

const dirOf = (s: GameState, c: City) => ({ dx: c.x < s.size / 2 ? 1 : -1, dy: c.y < s.size / 2 ? 1 : -1 });

test('Scottish Enlightenment: each city of level 3+ makes techs 1★ cheaper, at most 3★', () => {
  const { s, me, foe, cap } = setup();
  s.cities = s.cities.filter((c) => c.owner !== me || c === cap);
  const { dx, dy } = dirOf(s, cap);
  const cs = [cap, ...[[3, 0], [6, 0], [0, 3], [3, 3]].map(([a, b]) => city(s, me, cap.x + dx * a, cap.y + dy * b))];
  for (const c of cs) c.level = 1;
  const tech = 'farming';
  const full = techCost(s, me, tech);
  assert.ok(full >= 6);
  assert.equal(enlightenmentTechOff(s, me), 0);
  cs[1].level = 2;
  assert.equal(techCost(s, me, tech), full, 'level 2 is not enough');
  for (let i = 0; i < cs.length; i++) {
    cs[i].level = 3 + i;
    const want = Math.min(i + 1, ENLIGHT_MAX);
    assert.equal(enlightenmentTechOff(s, me), want);
    assert.equal(techCost(s, me, tech), full - want);
  }
  assert.equal(techCost(s, me, tech), full - 3, 'capped at −3');
  // never below 1★
  s.players[me].sparks = [tech];
  assert.ok(techCost(s, me, tech) >= 1);
  // another empire's big cities do nothing for it
  for (const c of s.cities) if (c.owner === foe) c.level = 5;
  assert.equal(enlightenmentTechOff(s, foe), 0);
});

test('Highland Games: veteran progress for units within 2, +1 pop, 4★, once every 6 turns', () => {
  const { s, me, cap } = setup();
  const { dx, dy } = dirOf(s, cap);
  const capT = tileAt(s, cap.x, cap.y)!;
  cap.level = 6; cap.pop = 0;
  const near = spawnUnit(s, 'warrior', me, cap.x + dx, cap.y, null);
  const edge = spawnUnit(s, 'archer', me, cap.x + dx * 2, cap.y + dy * 2, null);
  const nearly = spawnUnit(s, 'warrior', me, cap.x, cap.y + dy, null);
  nearly.veteranKills = 2; nearly.hp = 3;
  const far = spawnUnit(s, 'warrior', me, cap.x + dx * 3, cap.y, null);
  const act = tileActions(s, me, capT).find((a) => a.id === 'mech:games');
  assert.ok(act && act.enabled, 'offered in the city');
  assert.equal(act.cost, GAMES_COST);
  assert.ok(!tileActions(s, me, tileAt(s, cap.x + dx, cap.y)!).some((a) => a.id === 'mech:games'), 'only on a city tile');
  assert.ok(doAction(s, me, capT, 'mech:games'));
  assert.equal(s.players[me].stars, 100 - GAMES_COST, 'charged 4★');
  assert.equal(near.veteranKills, 1);
  assert.equal(edge.veteranKills, 1, 'two tiles away counts');
  assert.equal(far.veteranKills, 0, 'three tiles away does not');
  assert.ok(nearly.veteran, 'the third kill makes a veteran');
  assert.equal(nearly.hp, maxHp(nearly), 'healed to its new full health, as in battle');
  assert.ok(!near.veteran);
  assert.equal(cap.pop, 1, '+1 pop');
  // the cooldown
  assert.equal(gamesIn(s, cap), GAMES_EVERY);
  const again = tileActions(s, me, capT).find((a) => a.id === 'mech:games')!;
  assert.ok(!again.enabled && /6 turns/.test(again.reason ?? ''));
  assert.ok(!doAction(s, me, capT, 'mech:games'));
  s.turn += GAMES_EVERY - 1;
  assert.ok(!tileActions(s, me, capT).find((a) => a.id === 'mech:games')!.enabled);
  s.turn += 1;
  assert.ok(tileActions(s, me, capT).find((a) => a.id === 'mech:games')!.enabled);
  // each city keeps its own cooldown
  const other = city(s, me, cap.x + dx * 6, cap.y);
  s.turn -= 1;
  assert.ok(tileActions(s, me, tileAt(s, other.x, other.y)!).find((a) => a.id === 'mech:games')!.enabled);
  // too poor
  s.players[me].stars = GAMES_COST - 1;
  assert.ok(!tileActions(s, me, tileAt(s, other.x, other.y)!).find((a) => a.id === 'mech:games')!.enabled);
  // nobody else holds them
  const foeCap = s.cities.find((c) => c.owner !== me)!;
  assert.ok(!tileActions(s, 1 - me, tileAt(s, foeCap.x, foeCap.y)!).some((a) => a.id === 'mech:games'));
  JSON.parse(JSON.stringify(s));
});

test('Clan Gathering: Scottish units on or beside a mountain defend +0.5', () => {
  const { s, me, foe, cap } = setup();
  const { dx, dy } = dirOf(s, cap);
  const t = plot(s, cap.x + dx * 2, cap.y + dy * 2, null);
  const u = spawnUnit(s, 'warrior', me, t.x, t.y, null);
  assert.equal(hookStat(s, u, 'def'), 0, 'open ground');
  const m = plot(s, t.x + dx, t.y, null, 'mountain');
  assert.equal(hookStat(s, u, 'def'), MOUNTAIN_DEF, 'beside a mountain');
  assert.equal(hookStat(s, u, 'atk'), 0, 'defence only');
  u.x = m.x; u.y = m.y;
  assert.equal(hookStat(s, u, 'def'), MOUNTAIN_DEF, 'on the mountain');
  const e = spawnUnit(s, 'warrior', foe, t.x, t.y, null);
  assert.equal(hookStat(s, e, 'def'), 0, 'not for the enemy');
});

test('Clan mourning: a Scot fallen in battle sends +1★ from the nearest city', () => {
  const { s, me, foe, cap } = setup();
  const { dx } = dirOf(s, cap);
  const u = spawnUnit(s, 'warrior', me, cap.x + dx, cap.y, null);
  const killer = spawnUnit(s, 'warrior', foe, cap.x + dx * 2, cap.y, null);
  const before = s.players[me].stars;
  removeUnit(s, u, killer);
  assert.equal(s.players[me].stars, before + MOURN_STARS);
  // disbanded or otherwise removed: no gift
  const v = spawnUnit(s, 'warrior', me, cap.x + dx, cap.y, null);
  removeUnit(s, v, null);
  assert.equal(s.players[me].stars, before + MOURN_STARS);
  // the enemy's losses send nothing to anyone
  const fb = s.players[foe].stars;
  removeUnit(s, killer, spawnUnit(s, 'warrior', me, cap.x + dx, cap.y, null));
  assert.equal(s.players[foe].stars, fb);
  assert.equal(s.players[me].stars, before + MOURN_STARS);
});

test('AI holds the games with 3+ units near a city and the stars for it', () => {
  const { s, me, cap } = setup();
  s.players[me].human = false;
  const { dx, dy } = dirOf(s, cap);
  spawnUnit(s, 'warrior', me, cap.x + dx, cap.y, null);
  spawnUnit(s, 'warrior', me, cap.x, cap.y + dy, null);
  assert.equal(mech.ai!(s, me), false, 'two units are not enough');
  spawnUnit(s, 'archer', me, cap.x + dx, cap.y + dy, null);
  s.players[me].stars = GAMES_COST;
  assert.equal(mech.ai!(s, me), false, 'keeps a reserve');
  s.players[me].stars = 20;
  assert.ok(mech.ai!(s, me));
  assert.equal(s.players[me].stars, 20 - GAMES_COST);
  assert.equal(gamesIn(s, cap), GAMES_EVERY);
  assert.equal(mech.ai!(s, me), false, 'cooling down');
});

test('20-turn all-AI game with Scotland completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['scotland', 'vikings', 'japan'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 20 && guard++ < 1000) {
    aiTurn(s);
    endTurn(s);
  }
  assert.ok(s.turn >= 20 || s.over);
  JSON.parse(JSON.stringify(s));
});

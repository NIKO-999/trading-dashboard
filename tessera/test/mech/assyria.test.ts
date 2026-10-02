import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { doAction, tileActions, trainCost } from '../../src/game/rules';
import { neighbors, tileAt } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { UNITS } from '../../src/data/units';
import {
  SIEGE_OFF, TRIBUTE_COOLDOWN, TRIBUTE_MAX, deportedOf, libraryOf, libraryPick, mech, tributeTotal, tributeWait, tributeWhy,
} from '../../src/game/mech/assyria';
import type { City, GameState } from '../../src/game/types';

function setup(diplomacy = false) {
  const s = createGame({ seed: 7, human: 'assyria', opponents: ['rome'], mode: 'perfection', diplomacy });
  const me = s.players.findIndex((p) => p.tribe === 'assyria');
  const foe = 1 - me;
  for (const p of s.players) p.explored.fill(true);
  const cap = s.cities.find((c) => c.owner === me && c.capital)!;
  s.players[me].stars = 20;
  s.current = me;
  s.turn = 3;
  return { s, me, foe, cap };
}

/** Take an enemy city the real way: a soldier standing on it uses the Capture action. */
function conquer(s: GameState, me: number, city: City) {
  const t = tileAt(s, city.x, city.y)!;
  s.units = s.units.filter((u) => !(u.x === t.x && u.y === t.y));
  const u = spawnUnit(s, 'warrior', me, t.x, t.y, null);
  u.moved = u.attacked = false;
  assert.ok(doAction(s, me, t, 'capture'));
}

/** `n` extra enemy cities for the tribute tests, placed on free land tiles. */
function foeCities(s: GameState, foe: number, n: number): City[] {
  const base = s.cities.find((c) => c.owner === foe)!;
  const out: City[] = [base];
  let id = Math.max(...s.cities.map((c) => c.id)) + 1;
  for (const t of s.tiles) {
    if (out.length >= n) break;
    if (t.cityId !== null || t.terrain === 'ocean' || t.terrain === 'shallow' || t.terrain === 'mountain') continue;
    if (s.cities.some((c) => Math.max(Math.abs(c.x - t.x), Math.abs(c.y - t.y)) < 2)) continue;
    const c: City = { ...base, id: id++, x: t.x, y: t.y, capital: false, name: `Foe ${id}`, data: undefined, pendingRewards: [] };
    s.cities.push(c);
    t.cityId = c.id;
    out.push(c);
  }
  return out;
}

/** Put an Assyrian unit beside every city given (within the tribute range). */
function besiege(s: GameState, me: number, cs: City[]) {
  for (const c of cs) {
    const t = neighbors(s, c.x, c.y).find((n) => n.cityId === null && !s.units.some((u) => u.x === n.x && u.y === n.y))!;
    spawnUnit(s, 'warrior', me, t.x, t.y, null);
  }
}

test('Siege Masters: siege engines cost 2★ less for Assyria only', () => {
  const { s, me, foe } = setup();
  assert.equal(trainCost(s, me, 'siegetower'), UNITS.siegetower.cost - SIEGE_OFF);
  assert.equal(trainCost(s, me, 'catapult'), UNITS.catapult.cost - SIEGE_OFF);
  assert.equal(trainCost(s, foe, 'catapult'), UNITS.catapult.cost - 1, 'Rome gets only its own 1★ civilization bonus');
  for (const k of ['warrior', 'archer', 'rider', 'swordsman'] as const) assert.equal(trainCost(s, me, k), UNITS[k].cost, `${k}: no discount`);
});

test('Deportation: a captured city sends 1 pop to the capital, keeping its level', () => {
  const { s, me, foe, cap } = setup();
  const c = s.cities.find((x) => x.owner === foe)!;
  c.level = 3; c.pop = 2;
  cap.level = 1; cap.pop = 0;
  conquer(s, me, c);
  assert.equal(c.owner, me);
  assert.equal(c.pop, 1);
  assert.equal(c.level, 3);
  assert.equal(cap.pop, 1);
  assert.equal(deportedOf(s, me), 1);
});

test('Deportation: nobody moves from a city with no pop progress', () => {
  const { s, me, foe, cap } = setup();
  const c = s.cities.find((x) => x.owner === foe)!;
  c.level = 2; c.pop = 0;
  cap.level = 1; cap.pop = 0;
  conquer(s, me, c);
  assert.equal(c.level, 2);
  assert.equal(c.pop, 0);
  assert.equal(cap.pop, 0);
  assert.equal(deportedOf(s, me), 0);
});

test('Library: a capture teaches the cheapest tech the old owner knew whose parent Assyria knows', () => {
  const { s, me, foe } = setup();
  s.players[me].techs = ['gathering'];
  s.players[foe].techs = ['gathering', 'farming', 'tactics', 'engineering', 'riding'];
  assert.equal(libraryPick(s, me, foe), 'riding', 'a tier-1 root is cheapest');
  s.players[foe].techs = ['gathering', 'farming', 'engineering'];
  assert.equal(libraryPick(s, me, foe), 'farming', 'engineering is out of reach (Tactics unknown)');
  s.players[foe].techs = ['gathering', 'farming', 'tactics', 'engineering', 'riding'];
  const c = s.cities.find((x) => x.owner === foe)!;
  conquer(s, me, c);
  assert.ok(s.players[me].techs.includes('riding'));
  assert.deepEqual(libraryOf(s, me), ['riding']);
  // nothing new to learn: nothing is taken
  s.players[foe].techs = ['gathering'];
  assert.equal(libraryPick(s, me, foe), null);
  JSON.parse(JSON.stringify(s));
});

test('Other empires capturing cities neither deport nor learn', () => {
  const s = createGame({ seed: 7, human: 'rome', opponents: ['assyria'], mode: 'perfection' });
  const me = s.players.findIndex((p) => p.tribe === 'rome');
  const foe = 1 - me;
  s.current = me;
  s.players[me].techs = ['gathering'];
  s.players[foe].techs = ['gathering', 'riding'];
  const c = s.cities.find((x) => x.owner === foe)!;
  c.pop = 1;
  conquer(s, me, c);
  assert.ok(!s.players[me].techs.includes('riding'));
  assert.equal(c.pop, 1);
});

test('Terror Tribute: 1★ per nearby enemy city, a cooldown, never below 0, capped at 6', () => {
  const { s, me, foe, cap } = setup();
  const capTile = tileAt(s, cap.x, cap.y)!;
  const cs = foeCities(s, foe, 3);
  const act = () => tileActions(s, me, capTile).find((a) => a.id === 'mech:tribute');
  // no army near them: nothing to demand
  s.units = s.units.filter((u) => u.owner !== me || (u.x === cap.x && u.y === cap.y));
  if (cs.every((c) => !s.units.some((u) => u.owner === me && Math.max(Math.abs(u.x - c.x), Math.abs(u.y - c.y)) <= 4))) {
    assert.match(tributeWhy(s, me)!, /No enemy city/);
    assert.equal(act()!.enabled, false);
  }
  besiege(s, me, cs);
  s.players[foe].stars = 10;
  assert.equal(tributeTotal(s, me), 3);
  const a = act()!;
  assert.ok(a.enabled);
  assert.equal(a.cost, 0);
  const before = s.players[me].stars;
  assert.ok(doAction(s, me, capTile, 'mech:tribute'));
  assert.equal(s.players[me].stars, before + 3);
  assert.equal(s.players[foe].stars, 7);
  // cooldown
  assert.equal(tributeWait(s, me), TRIBUTE_COOLDOWN);
  assert.equal(act()!.enabled, false);
  assert.ok(!doAction(s, me, capTile, 'mech:tribute'));
  s.turn += TRIBUTE_COOLDOWN - 1;
  assert.equal(tributeWait(s, me), 1);
  s.turn += 1;
  assert.equal(tributeWait(s, me), 0);
  // never below 0: a foe with 2 stars pays 2 though 3 cities are near
  s.players[foe].stars = 2;
  assert.equal(tributeTotal(s, me), 2);
  assert.ok(doAction(s, me, capTile, 'mech:tribute'));
  assert.equal(s.players[foe].stars, 0);
  // an empty treasury pays nothing at all
  s.turn += TRIBUTE_COOLDOWN;
  assert.equal(tributeTotal(s, me), 0);
  assert.match(tributeWhy(s, me)!, /empty/);
  // cap: many cities pay at most 6
  const more = foeCities(s, foe, 9);
  besiege(s, me, more);
  s.players[foe].stars = 50;
  assert.ok(more.length > TRIBUTE_MAX);
  assert.equal(tributeTotal(s, me), TRIBUTE_MAX);
  const b = s.players[me].stars;
  assert.ok(doAction(s, me, capTile, 'mech:tribute'));
  assert.equal(s.players[me].stars, b + TRIBUTE_MAX);
  assert.equal(s.players[foe].stars, 50 - TRIBUTE_MAX);
});

test('Terror Tribute angers the victims when diplomacy is on; peace partners do not pay', () => {
  const { s, me, foe, cap } = setup(true);
  s.players[me].met = [foe]; s.players[foe].met = [me];
  const cs = foeCities(s, foe, 2);
  besiege(s, me, cs);
  s.players[foe].stars = 10;
  const k = `${foe}:${me}`;
  const mood = s.diplo!.mood[k] ?? 0;
  assert.ok(doAction(s, me, tileAt(s, cap.x, cap.y)!, 'mech:tribute'));
  assert.ok((s.diplo!.mood[k] ?? 0) < mood);
  s.turn += TRIBUTE_COOLDOWN;
  s.diplo!.pacts.push({ a: me, b: foe, kind: 'peace', since: s.turn });
  assert.equal(tributeTotal(s, me), 0);
});

test('AI demands tribute when it pays, and not on cooldown', () => {
  const { s, me, foe } = setup();
  s.players[me].human = false;
  const cs = foeCities(s, foe, 3);
  besiege(s, me, cs);
  s.players[foe].stars = 10;
  const before = s.players[me].stars;
  assert.ok(mech.ai!(s, me));
  assert.equal(s.players[me].stars, before + 3);
  assert.equal(mech.ai!(s, me), false, 'on cooldown now');
});

test('20-turn all-AI game with Assyria completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['assyria', 'rome', 'mongols'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 20 && guard++ < 1000) {
    aiTurn(s);
    endTurn(s);
  }
  assert.ok(s.turn >= 20 || s.over);
  JSON.parse(JSON.stringify(s));
});

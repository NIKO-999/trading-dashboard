import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { attack, doAction, previewCombat, tileActions, unitDef } from '../../src/game/rules';
import { neighbors, tileAt } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { hookStat } from '../../src/game/mech';
import { FIRE_DMG, FIRE_TURNS, TRIBUTE_COOLDOWN, ablaze, burnTick, burning, coastalCity, mech, tributeCost } from '../../src/game/mech/byzantium';
import type { GameState, Unit } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 9, human: 'byzantium', opponents: ['japan'], mode: 'perfection' });
  const city = s.cities.find((c) => c.owner === 0)!;
  // a clean stage: no other units near the city, everything explored, flat land around it
  s.units = s.units.filter((u) => Math.max(Math.abs(u.x - city.x), Math.abs(u.y - city.y)) > 5);
  for (const p of s.players) p.explored = p.explored.map(() => true);
  for (const t of s.tiles) if (Math.max(Math.abs(t.x - city.x), Math.abs(t.y - city.y)) <= 4 && t.cityId === null) { t.terrain = 'field'; t.resource = null as never; t.improvement = null as never; }
  return { s, city };
}

/** A fresh unit may act at once. */
function ready(u: Unit) {
  u.moved = false;
  u.attacked = false;
  return u;
}

/** Put water east of the city: the tile beside it and the one beyond. */
function coast(s: GameState, x: number, y: number) {
  tileAt(s, x + 1, y)!.terrain = 'shallow';
  tileAt(s, x + 2, y)!.terrain = 'shallow';
}

test('Theodosian Walls: +1 defence for Byzantine units in their own city only', () => {
  const { s, city } = setup();
  const u = spawnUnit(s, 'warrior', 0, city.x, city.y, null);
  assert.equal(mech.stat!(s, 0, u, 'def'), 1);
  assert.equal(mech.stat!(s, 0, u, 'atk'), 0, 'defence only');
  assert.ok(hookStat(s, u, 'def') >= 1);
  u.x = city.x - 1;
  assert.equal(mech.stat!(s, 0, u, 'def'), 0, 'outside the city: no walls');
  const foe = s.cities.find((c) => c.owner === 1)!;
  const e = spawnUnit(s, 'warrior', 1, foe.x, foe.y, null);
  assert.equal(mech.stat!(s, 0, e, 'def'), 0, 'an enemy in its own city gets nothing from Byzantium');
  assert.ok(unitDef(s, u) > 0);
});

test('Greek fire: a ship sets its target ablaze, the fire burns 2 a turn and goes out', () => {
  const { s, city } = setup();
  coast(s, city.x, city.y);
  const ship = spawnUnit(s, 'warship', 0, city.x + 1, city.y, null);
  const e = spawnUnit(s, 'defender', 1, city.x + 1, city.y + 2, null);
  e.hp = 15;
  s.current = 0;
  assert.ok(attack(s, ready(ship), e), 'ship attacks');
  assert.ok(s.units.includes(e), 'target survives the blow');
  assert.equal(burning(e), FIRE_TURNS);
  assert.equal(ablaze(s, 0).length, 1);
  e.hp = 10; // a fresh target, so the burns alone are measured
  const hp = e.hp;
  burnTick(s, 0);
  assert.equal(e.hp, hp - FIRE_DMG);
  assert.equal(burning(e), FIRE_TURNS - 1);
  burnTick(s, 0);
  assert.equal(e.hp, hp - 2 * FIRE_DMG);
  assert.equal(burning(e), 0, 'the fire went out');
  assert.equal(e.data?.fireBy, undefined);
  burnTick(s, 0);
  assert.equal(e.hp, hp - 2 * FIRE_DMG, 'no more burning');
  JSON.parse(JSON.stringify(s));
});

test('Greek fire burns through the turn cycle and can kill', () => {
  const { s, city } = setup();
  s.current = 0;
  // the target stands at home, in supply, so only the fire hurts it
  const foe = s.cities.find((c) => c.owner === 1)!;
  s.units = s.units.filter((u) => u.x !== foe.x || u.y !== foe.y);
  const e = spawnUnit(s, 'warrior', 1, foe.x, foe.y, null);
  mech.afterAttack!(s, 0, spawnUnit(s, 'boat', 0, city.x - 3, city.y, null), e, { dmg: 1, ret: 0, killed: false, ranged: true });
  assert.equal(burning(e), FIRE_TURNS, 'a canoe is a ship too');
  e.hp = 3;
  const kills = s.players[0].kills;
  endTurn(s); // Japan's turn
  endTurn(s); // Byzantium's turn starts: the fire burns
  assert.equal(s.current, 0);
  assert.equal(e.hp, 1);
  assert.equal(burning(e), 1);
  endTurn(s);
  endTurn(s);
  assert.ok(!s.units.includes(e), 'burnt to death');
  assert.equal(s.players[0].kills, kills + 1, 'the kill is Byzantium\'s');
});

test('land attacks do not set fire; allies never burn', () => {
  const { s, city } = setup();
  const sw = spawnUnit(s, 'warrior', 0, city.x - 1, city.y, null);
  const e = spawnUnit(s, 'defender', 1, city.x - 2, city.y, null);
  s.current = 0;
  assert.ok(attack(s, ready(sw), e));
  assert.equal(burning(e), 0);
  // a treaty partner is never set on fire
  s.diplo = { pacts: [{ a: 0, b: 1, kind: 'alliance', since: 0 }] } as never;
  const boat = spawnUnit(s, 'ship', 0, city.x - 3, city.y, null);
  mech.afterAttack!(s, 0, boat, e, { dmg: 1, ret: 0, killed: false, ranged: true });
  assert.equal(burning(e), 0);
});

test('siphons on a coastal city set its attacker ablaze', () => {
  const { s, city } = setup();
  const g = spawnUnit(s, 'varangian', 0, city.x, city.y, null);
  const e = spawnUnit(s, 'archer', 1, city.x - 2, city.y, null);
  s.current = 1;
  // inland: no siphons
  assert.ok(!coastalCity(s, city));
  assert.ok(attack(s, ready(e), g));
  assert.equal(burning(e), 0, 'an inland city has no siphons');
  coast(s, city.x, city.y);
  assert.ok(coastalCity(s, city));
  e.attacked = false;
  e.moved = false;
  assert.ok(attack(s, ready(e), g));
  assert.equal(burning(e), FIRE_TURNS, 'the walls answer with fire');
  // a Byzantine unit outside the city does not have them
  const f = spawnUnit(s, 'warrior', 0, city.x - 1, city.y + 1, null);
  const e2 = spawnUnit(s, 'archer', 1, city.x - 3, city.y + 1, null);
  assert.ok(attack(s, ready(e2), f));
  assert.equal(burning(e2), 0);
});

test('tribute: pay off the enemies near a city; their next blows are empty; once every 5 turns', () => {
  const { s, city } = setup();
  s.current = 0;
  const ct = tileAt(s, city.x, city.y)!;
  s.players[0].stars = 100;
  assert.ok(!tileActions(s, 0, ct).find((a) => a.id === 'mech:tribute')!.enabled, 'no enemy, no tribute');
  const e1 = spawnUnit(s, 'swordsman', 1, city.x - 1, city.y, null);
  const e2 = spawnUnit(s, 'archer', 1, city.x - 3, city.y + 2, null);
  const far = spawnUnit(s, 'warrior', 1, city.x - 4, city.y, null);
  const g = spawnUnit(s, 'warrior', 0, city.x, city.y, null);
  const act = tileActions(s, 0, ct).find((a) => a.id === 'mech:tribute')!;
  assert.ok(act.enabled);
  assert.equal(act.cost, tributeCost(2));
  assert.equal(act.cost, 9, '5 + 2 per enemy unit within 3 tiles');
  assert.ok(doAction(s, 0, ct, 'mech:tribute'));
  assert.equal(s.players[0].stars, 100 - 9);
  assert.ok(e1.data?.bribe !== undefined && e2.data?.bribe !== undefined);
  assert.equal(far.data?.bribe, undefined, 'out of reach');
  assert.ok(!tileActions(s, 0, ct).find((a) => a.id === 'mech:tribute')!.enabled, 'cooldown');
  endTurn(s); // Japan's turn: the bribed units' blows deal nothing
  assert.equal(s.current, 1);
  const pv = previewCombat(s, e1, g);
  assert.equal(pv.dmg, 0);
  const hp = g.hp;
  assert.ok(attack(s, ready(e1), g));
  assert.equal(g.hp, hp, 'no damage');
  assert.ok(previewCombat(s, far, g).dmg > 0, 'an unbribed unit still strikes');
  endTurn(s);
  endTurn(s); // the next Japanese turn: the bribe has been spent
  assert.equal(s.current, 1);
  assert.ok(previewCombat(s, e2, g).dmg > 0);
  // the city may pay again only after the cooldown
  s.current = 0;
  s.turn += TRIBUTE_COOLDOWN;
  if (!s.units.includes(e1)) spawnUnit(s, 'warrior', 1, city.x - 1, city.y, null); // someone must still be near
  assert.ok(tileActions(s, 0, ct).find((a) => a.id === 'mech:tribute')!.enabled);
  JSON.parse(JSON.stringify(s));
});

test('AI pays tribute when an army gathers at the gates', () => {
  const { s, city } = setup();
  s.current = 0;
  s.players[0].human = false;
  s.players[0].stars = 40;
  const free = neighbors(s, city.x, city.y).filter((t) => !s.units.some((u) => u.x === t.x && u.y === t.y));
  const foes: Unit[] = free.slice(0, 3).map((t) => spawnUnit(s, 'swordsman', 1, t.x, t.y, null));
  assert.ok(mech.ai!(s, 0), 'the AI pays');
  assert.ok(foes.every((u) => u.data?.bribe !== undefined));
  assert.equal(s.players[0].stars, 40 - tributeCost(3));
  assert.ok(!mech.ai!(s, 0), 'not twice');
});

test('20-turn all-AI game with Byzantium completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['byzantium', 'japan', 'vikings'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 20 && guard++ < 1000) {
    aiTurn(s);
    endTurn(s);
  }
  assert.ok(s.turn >= 20 || s.over);
  JSON.parse(JSON.stringify(s));
});

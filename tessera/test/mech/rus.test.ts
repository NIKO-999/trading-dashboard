import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { doAction, moveOptions, previewCombat, tileActions } from '../../src/game/rules';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { isLand } from '../../src/game/grid';
import { endTurn, startTurn } from '../../src/game/turn';
import { hookStat, hookTurnStart } from '../../src/game/mech';
import { EARLY_COST, EARLY_LENGTH, FROST_DAMAGE, WINTER_DEF, isWinter, seasonWinter, winterIn, winterLeft } from '../../src/game/mech/rus';
import type { GameState, Tile } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 5, human: 'rus', opponents: ['japan'], mode: 'perfection' });
  const city = s.cities.find((c) => c.owner === 0)!;
  s.units = s.units.filter((u) => u.owner === 0 || Math.max(Math.abs(u.x - city.x), Math.abs(u.y - city.y)) > 4);
  return { s, city };
}

/** A free land tile inside the Rus city's borders. */
const freeTile = (s: GameState, cityId: number): Tile =>
  s.tiles.find((t) => t.owner === cityId && t.cityId === null && isLand(t) && t.terrain !== 'mountain' && !s.units.some((u) => u.x === t.x && u.y === t.y))!;

test('Fur Trade: a hunt pays +1 star', () => {
  const { s, city } = setup();
  const t = freeTile(s, city.id);
  t.terrain = 'forest';
  t.resource = 'animal';
  t.improvement = null;
  s.players[0].techs.push('hunting');
  s.players[0].stars = 10;
  const act = tileActions(s, 0, t).find((a) => a.id === 'harvest');
  assert.ok(act && act.enabled, 'hunt offered');
  assert.match(act.desc, /Fur Trade/);
  assert.ok(doAction(s, 0, t, 'harvest'));
  assert.equal(s.players[0].stars, 10 - act.cost + 1);
});

test('winter season: turns 10-12, 20-22, ...', () => {
  const on = Array.from({ length: 35 }, (_, t) => t).filter(seasonWinter);
  assert.deepEqual(on, [10, 11, 12, 20, 21, 22, 30, 31, 32]);
  const { s } = setup();
  s.turn = 4;
  assert.equal(winterIn(s, 0), 6);
  s.turn = 11;
  assert.ok(isWinter(s, 0));
  assert.equal(winterLeft(s, 0), 2);
  s.turn = 15;
  assert.equal(winterIn(s, 0), 5);
});

test('frost wounds only hostile units inside the borders, never below 1', () => {
  const { s, city } = setup();
  s.turn = 10;
  const inside = freeTile(s, city.id);
  const foe = spawnUnit(s, 'warrior', 1, inside.x, inside.y, null);
  const outside = s.tiles.find((t) => t.owner === null && t.terrain === 'field' && !s.units.some((u) => u.x === t.x && u.y === t.y))!;
  const far = spawnUnit(s, 'warrior', 1, outside.x, outside.y, null);
  const mine = s.units.find((u) => u.owner === 0)!;
  const hp = { foe: foe.hp, far: far.hp, mine: mine.hp };
  hookTurnStart(s, 0);
  assert.equal(foe.hp, hp.foe - FROST_DAMAGE, 'invader frozen');
  assert.equal(far.hp, hp.far, 'outside the borders: untouched');
  assert.equal(mine.hp, hp.mine, 'own units: untouched');
  foe.hp = 2;
  hookTurnStart(s, 0);
  assert.equal(foe.hp, 1, 'never below 1');
  hookTurnStart(s, 0);
  assert.equal(foe.hp, 1);
  // no damage out of season
  s.turn = 14;
  foe.hp = 8;
  hookTurnStart(s, 0);
  assert.equal(foe.hp, 8);
});

test('winter slows invaders and steadies the Rus defence at home', () => {
  const { s, city } = setup();
  const inside = freeTile(s, city.id);
  const foe = spawnUnit(s, 'rider', 1, inside.x, inside.y, null);
  const mine = s.units.find((u) => u.owner === 0 && s.tiles[u.y * s.size + u.x].owner === city.id)!;
  s.turn = 5;
  assert.equal(hookStat(s, foe, 'move'), 0);
  const hit0 = previewCombat(s, foe, mine).dmg;
  s.turn = 20;
  assert.equal(hookStat(s, foe, 'move'), -1, 'one move less');
  assert.equal(hookStat(s, mine, 'def'), WINTER_DEF);
  assert.equal(hookStat(s, foe, 'def'), 0, 'invaders get no defence');
  assert.ok(previewCombat(s, foe, mine).dmg <= hit0, 'the defence bonus reaches combat');
  // a unit that moves 1 keeps its single step (the core's floor)
  const slow = spawnUnit(s, 'warrior', 1, inside.x, inside.y, null);
  s.units = s.units.filter((u) => u !== foe);
  s.current = 1;
  slow.moved = slow.attacked = false;
  s.players[1].explored.fill(true);
  assert.ok(moveOptions(s, slow).length > 0, 'still moves');
});

test('early winter: a capital action once per era', () => {
  const { s, city } = setup();
  s.turn = 3;
  const cap = s.tiles[city.y * s.size + city.x];
  s.players[0].stars = 30;
  const act = tileActions(s, 0, cap).find((a) => a.id === 'mech:winter');
  assert.ok(act && act.enabled, 'offered at the capital');
  assert.equal(act.cost, EARLY_COST);
  assert.ok(!tileActions(s, 0, freeTile(s, city.id)).some((a) => a.id === 'mech:winter'), 'only at the capital');
  assert.ok(doAction(s, 0, cap, 'mech:winter'));
  assert.equal(s.players[0].stars, 30 - EARLY_COST);
  assert.ok(isWinter(s, 0));
  assert.equal(winterLeft(s, 0), EARLY_LENGTH);
  s.turn = 3 + EARLY_LENGTH;
  assert.ok(!isWinter(s, 0), 'over after two turns');
  const again = tileActions(s, 0, cap).find((a) => a.id === 'mech:winter')!;
  assert.ok(!again.enabled, 'once per era');
  // a new era allows another
  s.players[0].era = { ...(s.players[0].era ?? { snap: { sparks: 0, kills: 0, levels: 0, wonders: 0 }, age: null, until: 0 }), n: (s.players[0].era?.n ?? 0) + 1 };
  assert.ok(tileActions(s, 0, cap).find((a) => a.id === 'mech:winter')!.enabled);
  JSON.parse(JSON.stringify(s));
});

test('AI calls the early winter when enemies stand in its land', () => {
  const { s, city } = setup();
  s.turn = 3;
  s.players[0].human = false;
  s.players[0].stars = 30;
  const inside = freeTile(s, city.id);
  spawnUnit(s, 'warrior', 1, inside.x, inside.y, null);
  aiTurn(s);
  assert.ok(isWinter(s, 0), 'winter called');
});

test('25-turn all-AI game with Rus completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['rus', 'japan', 'mongols'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 25 && guard++ < 1500) {
    aiTurn(s);
    endTurn(s);
  }
  assert.ok(s.turn >= 25 || s.over);
});

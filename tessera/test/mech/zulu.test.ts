import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { drain } from '../../src/game/events';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { hookAi } from '../../src/game/mech';
import { isTrapped } from '../../src/game/mech/zulu';
import { attack, moveOptions, previewCombat } from '../../src/game/rules';
import { endTurn, startTurn } from '../../src/game/turn';
import type { GameState, Unit } from '../../src/game/types';

/** A Zulu (0) vs Rome (1) game on open ground with no units, the enemy warrior at (8,8). */
function arena() {
  const s = createGame({ seed: 4, human: 'zulu', opponents: ['rome'], mode: 'domination' });
  s.units = [];
  for (const t of s.tiles) if (Math.abs(t.x - 8) <= 4 && Math.abs(t.y - 8) <= 4) { t.terrain = 'field'; t.cityId = null; t.village = false; t.ruin = false; t.improvement = null; t.resource = null; }
  for (const p of s.players) p.explored = p.explored.map(() => true);
  const foe = spawnUnit(s, 'warrior', 1, 8, 8, null);
  return { s, foe };
}
const ready = (u: Unit) => { u.moved = false; u.attacked = false; return u; };
const impi = (s: GameState, x: number, y: number) => ready(spawnUnit(s, 'impi', 0, x, y, null));

test('three adjacent Zulu melee units trap an enemy; two do not', () => {
  const { s, foe } = arena();
  impi(s, 7, 8); impi(s, 9, 8);
  assert.equal(isTrapped(s, foe), false);
  impi(s, 8, 7);
  assert.equal(isTrapped(s, foe), true);
});

test('a trapped enemy cannot move or counter-attack, and takes triple damage', () => {
  const { s, foe } = arena();
  const a = impi(s, 7, 8);
  ready(foe);
  assert.ok(moveOptions(s, foe).length > 0, 'a free enemy can retreat');
  const before = previewCombat(s, a, foe);
  assert.ok(before.ret > 0, 'a free enemy hits back');
  impi(s, 9, 8); impi(s, 8, 7);
  assert.equal(moveOptions(s, foe).length, 0);
  const after = previewCombat(s, a, foe);
  assert.equal(after.ret, 0);
  assert.ok(after.kills || after.dmg === before.dmg * 3);
  const hp = foe.hp;
  assert.ok(attack(s, a, foe));
  assert.ok(!s.units.includes(foe) || foe.hp < hp);
});

test('ranged Zulu units do not get the triple damage, and a lone Zulu unit does not trap', () => {
  const { s, foe } = arena();
  impi(s, 7, 8); impi(s, 9, 8); impi(s, 8, 7);
  const archer = ready(spawnUnit(s, 'archer', 0, 8, 6, null));
  const plain = arena();
  const archer2 = ready(spawnUnit(plain.s, 'archer', 0, 8, 6, null));
  assert.equal(previewCombat(s, archer, foe).dmg, previewCombat(plain.s, archer2, plain.foe).dmg);
  const solo = arena();
  const zw = impi(solo.s, 7, 8);
  assert.ok(!isTrapped(solo.s, solo.foe));
  assert.ok(previewCombat(solo.s, zw, solo.foe).ret > 0);
});

test('the Zulu AI closes a V around an enemy, then strikes', () => {
  const { s, foe } = arena();
  s.current = 0;
  const us = [impi(s, 5, 8), impi(s, 6, 6), impi(s, 6, 10)];
  let steps = 0;
  while (hookAi(s, 0) && steps++ < 20) { /* one step per call */ }
  assert.ok(steps > 0 && steps < 20);
  const dead = !s.units.includes(foe);
  assert.ok(dead || foe.hp < 10, 'the trap was sprung');
  assert.ok(us.every((u) => Math.max(Math.abs(u.x - 8), Math.abs(u.y - 8)) <= 1), 'all three closed in');
});

test('20-turn all-AI game with Zulu completes', () => {
  const s = createGame({ seed: 11, human: null, opponents: ['zulu', 'rome', 'japan'], mode: 'perfection' });
  s.maxTurns = 20;
  startTurn(s);
  let guard = 0;
  while (!s.over && guard++ < 500) { aiTurn(s); endTurn(s); drain(); }
  assert.ok(s.over);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { ambushers, canRetreat } from '../../src/game/mech/mongols';
import { attack, moveOptions, moveUnit } from '../../src/game/rules';
import { endTurn } from '../../src/game/turn';
import type { GameState, UnitKind } from '../../src/game/types';

/** A flat, fully explored map with Mongols (0) against Rome (1) and no units. */
function arena(): GameState {
  const s = createGame({ seed: 7, human: 'mongols', opponents: ['rome'], mapSize: 'large', mode: 'perfection' });
  for (const t of s.tiles) { t.terrain = 'field'; t.resource = null; t.improvement = null; t.village = false; t.ruin = false; }
  for (const p of s.players) p.explored = p.explored.map(() => true);
  s.units = [];
  return s;
}
const at = (s: GameState, kind: UnitKind, owner: number, x: number, y: number) => {
  const u = spawnUnit(s, kind, owner, x, y, null);
  u.moved = u.attacked = false;
  return u;
};

test('a mounted unit may pull back up to 2 tiles after attacking, once', () => {
  const s = arena();
  const r = at(s, 'knight', 0, 8, 8);
  const e = at(s, 'archer', 1, 9, 8);
  e.hp = 30; e.veteran = true;
  assert.equal(canRetreat(s, r), false);
  assert.ok(attack(s, r, e));
  assert.equal(canRetreat(s, r), true);
  const opts = moveOptions(s, r);
  assert.ok(opts.length > 0);
  for (const o of opts) assert.ok(Math.max(Math.abs(o.x - r.x), Math.abs(o.y - r.y)) <= 2);
  assert.ok(moveUnit(s, r, opts[0].x, opts[0].y));
  assert.equal(canRetreat(s, r), false);
  assert.deepEqual(moveOptions(s, r), []);
  assert.ok(r.attacked);
});

test('non-Mongol units get no retreat', () => {
  const s = arena();
  const r = at(s, 'knight', 1, 8, 8);
  const e = at(s, 'archer', 0, 9, 8);
  e.hp = 30; e.veteran = true;
  attack(s, r, e);
  assert.equal(r.moved, true);
});

test('an enemy stepping into a waiting archer zone is ambushed, once per archer per round', () => {
  const s = arena();
  const a = at(s, 'archer', 0, 8, 8);
  assert.equal(ambushers(s, 0).length, 1);
  s.current = 1;
  const e = at(s, 'knight', 1, 8, 12);
  e.hp = 30;
  const hp0 = e.hp;
  assert.ok(moveUnit(s, e, 8, 10));
  assert.ok(e.hp < hp0, 'the enemy was shot');
  assert.equal(a.data?.ambush, s.turn);
  const hp = e.hp;
  e.moved = false;
  assert.ok(moveUnit(s, e, 8, 9));
  assert.equal(e.hp, hp, 'the archer has spent its shot this round');
});

test('an enemy outside the archer range is left alone', () => {
  const s = arena();
  at(s, 'archer', 0, 8, 8);
  s.current = 1;
  const e = at(s, 'knight', 1, 8, 13);
  const hp0 = e.hp;
  assert.ok(moveUnit(s, e, 8, 11));
  assert.equal(e.hp, hp0);
});

test('an archer that acted is not waiting; the shot is restored at the Mongol turn', () => {
  const s = arena();
  const a = at(s, 'archer', 0, 8, 8);
  a.moved = true;
  assert.equal(ambushers(s, 0).length, 0);
  a.moved = false;
  a.data = { ambush: s.turn };
  s.current = 0;
  endTurn(s);
  endTurn(s); // back to the Mongols
  assert.equal(a.data?.ambush, undefined);
  JSON.stringify(s);
});

test('the AI strikes and pulls back; archers hold while enemies are near', () => {
  const s = arena();
  s.players[0].human = false;
  s.current = 0;
  const r = at(s, 'knight', 0, 8, 8);
  const bow = at(s, 'archer', 0, 5, 5);
  const e = at(s, 'archer', 1, 9, 8);
  e.hp = 30; e.veteran = true;
  aiTurn(s);
  assert.equal(r.attacked, true);
  assert.equal(r.moved, true);
  assert.ok(e.hp < 30, 'the rider struck');
  assert.ok(r.x < 8 || r.y !== 8, 'and pulled back');
  assert.deepEqual([bow.x, bow.y], [5, 5]);
});

test('a 20-turn all-AI game with Mongols completes', () => {
  const s = createGame({ seed: 11, human: 'mongols', opponents: ['rome', 'vikings'], mode: 'perfection' });
  for (const p of s.players) p.human = false;
  for (let i = 0; i < 20 * s.players.length && !s.over; i++) {
    aiTurn(s);
    endTurn(s);
  }
  assert.ok(s.turn >= 1);
  JSON.stringify(s);
});

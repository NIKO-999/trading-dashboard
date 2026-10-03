import assert from 'node:assert/strict';
import test from 'node:test';
import { dist } from '../src/game/grid.ts';
import { createGame, spawnUnit } from '../src/game/mapgen.ts';
import { clearRally, isRallying, orderRally, rallyCandidates, rallyOf, rallyStep, setRally, stopRally } from '../src/game/rally.ts';
import type { GameState } from '../src/game/types.ts';

/** Open fields for 6 tiles round the middle of the map (any city there stays), no units, everything explored. */
function field() {
  const s = createGame({ seed: 31, human: 'rome', opponents: ['egypt'], mode: 'domination', mapSize: 'huge' });
  const cx = Math.floor(s.size / 2), cy = Math.floor(s.size / 2);
  for (const t of s.tiles) {
    if (Math.abs(t.x - cx) > 6 || Math.abs(t.y - cy) > 6 || t.cityId !== null) continue;
    Object.assign(t, { terrain: 'field', resource: null, improvement: null, village: false, ruin: false, road: false });
  }
  s.units = [];
  for (const p of s.players) p.explored.fill(true);
  s.current = 0;
  const unit = (s2: GameState, x: number, y: number, owner = 0, kind: 'warrior' | 'rider' = 'warrior') => {
    const u = spawnUnit(s2, kind, owner, cx + x, cy + y, null);
    u.moved = u.attacked = false;
    return u;
  };
  return { s, cx, cy, unit };
}

test('units in range march a full move towards the flag each turn and stop when they reach it', () => {
  const { s, cx, cy, unit } = field();
  const a = unit(s, -4, 0), b = unit(s, -3, 2, 0, 'rider'), far = unit(s, 6, 6);
  setRally(s, 0, cx + 1, cy, 5);
  const cands = rallyCandidates(s, 0, cx + 1, cy, 5).map((u) => u.id);
  assert.deepEqual(cands.sort(), [a.id, b.id].sort(), 'only units within the range can be called');
  orderRally(s, 0, cands);
  const r1 = rallyStep(s, 0);
  assert.equal(r1.moved, 2);
  assert.equal(dist(a.x, a.y, cx + 1, cy), 4, 'a warrior steps one tile closer');
  assert.ok(dist(b.x, b.y, cx + 1, cy) <= 2, 'a rider covers two tiles');
  assert.ok(!isRallying(far));
  // next turns: they keep coming until they stand next to the flag, then their orders end
  for (let turn = 0; turn < 6; turn++) { for (const u of s.units) u.moved = u.attacked = false; rallyStep(s, 0); }
  for (const u of [a, b]) {
    assert.ok(dist(u.x, u.y, cx + 1, cy) <= 1, 'arrived');
    assert.ok(!isRallying(u), 'orders end on arrival');
  }
});

test('a unit that can strike an enemy stops for its player; taking the flag down or moving one by hand ends its march', () => {
  const { s, cx, cy, unit } = field();
  const a = unit(s, -4, 0), b = unit(s, 0, 3);
  unit(s, -5, 0, 1); // an Egyptian right beside the first one
  setRally(s, 0, cx + 2, cy, 6);
  orderRally(s, 0, [a.id, b.id]);
  const r = rallyStep(s, 0);
  assert.deepEqual(r.halted.map((u) => u.id), [a.id], 'contact: it waits for orders');
  assert.equal(a.x, cx - 4, 'and it did not move');
  assert.ok(!isRallying(a));
  assert.ok(isRallying(b));
  stopRally(b);
  assert.ok(!isRallying(b), 'moving it by hand cancels the march');
  orderRally(s, 0, [b.id]);
  clearRally(s, 0);
  assert.equal(rallyOf(s, 0), null);
  assert.ok(!isRallying(b), 'no flag, no march');
  // the flag survives a save
  setRally(s, 0, cx, cy, 3);
  orderRally(s, 0, [b.id]);
  const copy = JSON.parse(JSON.stringify(s)) as GameState;
  assert.deepEqual(rallyOf(copy, 0), { x: cx, y: cy, r: 3 });
  assert.ok(isRallying(copy.units.find((u) => u.id === b.id)!));
});

test('moving the flag out of a unit\'s range ends its old orders; a land unit never boards a boat to get there', () => {
  const { s, cx, cy, unit } = field();
  const a = unit(s, -2, 0);
  setRally(s, 0, cx, cy, 3);
  orderRally(s, 0, [a.id]);
  setRally(s, 0, cx + 6, cy + 6, 2);
  assert.ok(!isRallying(a), 'the new flag is too far for it');
  // water between a unit and the flag: it walks to the shore and waits there
  for (let y = cy - 6; y <= cy + 6; y++) Object.assign(s.tiles[y * s.size + cx], { terrain: 'shallow', improvement: null });
  const w = unit(s, -1, 0);
  setRally(s, 0, cx + 2, cy, 4);
  orderRally(s, 0, [w.id]);
  for (let turn = 0; turn < 4; turn++) { w.moved = w.attacked = false; rallyStep(s, 0); }
  assert.equal(w.carrying, null, 'never embarked');
  assert.ok(!isRallying(w), 'it gives up when it can get no closer');
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { attackOptions, doAction, tileActions } from '../../src/game/rules';
import { tileAt } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { fireLeft, mech } from '../../src/game/mech/korea';
import type { GameState } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 5, human: 'korea', opponents: ['japan'], mode: 'perfection' });
  // a clear stretch of field: the hwacha and a victim three tiles apart
  let spot: { x: number; y: number } | null = null;
  for (let y = 0; y < s.size && !spot; y++)
    for (let x = 0; x + 3 < s.size && !spot; x++)
      if (s.tiles.filter((t) => t.y === y && t.x >= x && t.x <= x + 3).every((t) => t.terrain === 'field' && t.cityId === null) && !s.units.some((u) => u.y === y && u.x >= x && u.x <= x + 3)) spot = { x, y };
  assert.ok(spot);
  const a = spawnUnit(s, 'hwacha', 0, spot.x, spot.y, null);
  const d = spawnUnit(s, 'warrior', 1, spot.x + 3, spot.y, null);
  for (const u of [a, d]) { u.attacked = false; u.moved = false; }
  return { s, a, d, tile: tileAt(s, d.x, d.y)! };
}

test('salvo hits an unexplored tile and sets it on fire', () => {
  const { s, a, d, tile } = setup();
  s.players[0].explored[d.y * s.size + d.x] = false;
  assert.ok(attackOptions(s, a).includes(d), 'fogged enemy is targetable');
  const empty = tileAt(s, a.x + 1, a.y)!;
  assert.ok(tileActions(s, 0, empty).some((x) => x.id === 'mech:salvo'));
  const hp = d.hp;
  assert.ok(doAction(s, 0, tile, 'mech:salvo'));
  assert.ok(!s.units.includes(d) || d.hp < hp);
  assert.equal(fireLeft(tile), 3);
  assert.ok(a.attacked);
  assert.ok(!tileActions(s, 0, tile).some((x) => x.id === 'mech:salvo'), 'spent');
});

test('fire burns a unit each Korean turn and burns out', () => {
  const { s, d, tile } = setup();
  tile.data = { fire: 2, fireBy: 0 };
  d.hp = 10;
  mech.turnStart!(s, 0);
  assert.equal(d.hp, 8);
  assert.equal(fireLeft(tile), 1);
  mech.turnStart!(s, 0);
  assert.equal(d.hp, 6);
  assert.equal(fireLeft(tile), 0);
  mech.turnStart!(s, 0);
  assert.equal(d.hp, 6);
  JSON.parse(JSON.stringify(s));
});

test('AI fires a salvo', () => {
  const { s, a, d } = setup();
  assert.ok(mech.ai!(s, 0));
  assert.ok(a.attacked);
  assert.ok(fireLeft(tileAt(s, d.x, d.y)!) > 0);
});

test('20-turn all-AI game with Korea completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['korea', 'japan', 'mongols'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 20 && guard++ < 1000) { aiTurn(s); endTurn(s); }
  assert.ok(s.turn >= 20 || s.over);
});

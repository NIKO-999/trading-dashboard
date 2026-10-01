import assert from 'node:assert/strict';
import test from 'node:test';
import { DRILLED, FLEET, formation, HOMETOWN, SHIELD_MAX, TESTUDO_MAX, TESTUDO_RANGED } from '../src/game/army';
import { createGame, spawnUnit } from '../src/game/mapgen';
import type { GameState, TribeId } from '../src/game/types';

/** A flat open board, everyone met, no units. */
function board(me: TribeId, foe: TribeId = 'greeks') {
  const s = createGame({ seed: 7, human: me, opponents: [foe], mapSize: 'large', mode: 'perfection' });
  for (const t of s.tiles) { t.terrain = 'field'; t.resource = null; t.improvement = null; t.village = false; t.ruin = false; t.owner = null; }
  s.units = [];
  return s;
}
const notes = (s: GameState, a: Parameters<typeof formation>[1], d: Parameters<typeof formation>[2]) => formation(s, a, d);

test('Military: Drilled Ranks add attack to a unit in formation', () => {
  const s = board('mongols');
  const a = spawnUnit(s, 'archer', 0, 5, 5, null);
  spawnUnit(s, 'archer', 0, 5, 6, null);
  const d = spawnUnit(s, 'warrior', 1, 7, 5, null);
  const f = notes(s, a, d);
  assert.ok(f.notes.some((n) => /Drilled Ranks/.test(n)));
  assert.ok(f.atk >= DRILLED + 0.5);
});

test('Economy: Hometown Guard adds defence in formation on its own land', () => {
  const s = board('egypt', 'mongols');
  const c = s.cities.find((k) => k.owner === 0)!;
  const d = spawnUnit(s, 'defender', 0, c.x + 1, c.y, null);
  spawnUnit(s, 'defender', 0, c.x + 1, c.y + 1, null);
  for (const t of s.tiles) if (Math.max(Math.abs(t.x - c.x), Math.abs(t.y - c.y)) <= 2) t.owner = c.id;
  const a = spawnUnit(s, 'warrior', 1, c.x + 2, c.y, null);
  const f = notes(s, a, d);
  assert.ok(f.notes.some((n) => /Hometown Guard/.test(n)));
  assert.ok(f.def >= HOMETOWN);
});

test('Rome: Testudo raises the shield wall and holds against missiles', () => {
  const s = board('rome');
  const d = spawnUnit(s, 'defender', 0, 5, 5, null);
  for (const [x, y] of [[5, 6], [6, 6], [4, 6]]) spawnUnit(s, 'defender', 0, x, y, null);
  const melee = spawnUnit(s, 'warrior', 1, 5, 4, null);
  const archer = spawnUnit(s, 'archer', 1, 5, 2, null);
  assert.equal(notes(s, melee, d).def, TESTUDO_MAX);
  assert.ok(TESTUDO_MAX > SHIELD_MAX);
  assert.equal(notes(s, archer, d).def, TESTUDO_MAX + TESTUDO_RANGED);
  // anyone else's wall stops at the ordinary cap
  const g = board('greeks');
  const gd = spawnUnit(g, 'defender', 0, 5, 5, null);
  for (const [x, y] of [[5, 6], [6, 6], [4, 6]]) spawnUnit(g, 'defender', 0, x, y, null);
  assert.equal(notes(g, spawnUnit(g, 'warrior', 1, 5, 4, null), gd).def, SHIELD_MAX);
});

test('Naval: warships side by side form a Line of Battle', () => {
  const s = board('vikings');
  for (const t of s.tiles) if (t.y >= 8) t.terrain = 'ocean';
  const a = spawnUnit(s, 'warship', 0, 5, 9, null);
  spawnUnit(s, 'warship', 0, 6, 9, null);
  const d = spawnUnit(s, 'warship', 1, 5, 11, null);
  const f = notes(s, a, d);
  assert.ok(f.notes.some((n) => /Line of Battle/.test(n)));
  assert.ok(f.atk >= FLEET);
  // a land empire's ships have no such line
  const r = board('rome');
  for (const t of r.tiles) if (t.y >= 8) t.terrain = 'ocean';
  const ra = spawnUnit(r, 'warship', 0, 5, 9, null);
  spawnUnit(r, 'warship', 0, 6, 9, null);
  assert.ok(!notes(r, ra, spawnUnit(r, 'warship', 1, 5, 11, null)).notes.some((n) => /Line of Battle/.test(n)));
});

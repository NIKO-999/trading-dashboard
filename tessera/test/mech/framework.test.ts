import assert from 'node:assert/strict';
import test from 'node:test';
import { MECH_IDS, mechOf } from '../../src/game/mech';
import { createGame } from '../../src/game/mapgen';

test('every empire has a named mechanic', () => {
  assert.equal(MECH_IDS.length, 26);
  const s = createGame({ seed: 1, human: 'zulu', opponents: ['japan'], mode: 'perfection' });
  assert.ok(mechOf(s, 0).name);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame } from '../../src/game/mapgen';
import { aiTurn } from '../../src/game/ai';
import { endTurn, startTurn } from '../../src/game/turn';
import { previewCombat, attack } from '../../src/game/rules';
import { isKiai, lastStand, KIAI_CHANCE } from '../../src/game/mech/japan';
import type { GameState, Unit } from '../../src/game/types';

function duel() {
  const s = createGame({ seed: 5, human: 'japan', opponents: ['zulu'], mode: 'perfection' });
  const a = s.units.find((u) => u.owner === 0)!;
  const d = s.units.find((u) => u.owner === 1)!;
  d.x = a.x + 1; d.y = a.y; // adjacent
  d.kind = 'warrior'; a.kind = 'warrior'; a.attacked = false;
  for (const p of s.players) p.explored.fill(true);
  return { s, a, d };
}
const findCrit = (s: GameState, a: Unit, d: Unit, want: boolean) => {
  for (let t = 0; t < 200; t++) { s.turn = t; if (isKiai(s, a, d) === want) return true; }
  return false;
};

test('crit is deterministic and takes no counter-damage', () => {
  const { s, a, d } = duel();
  d.hp = 10; a.hp = 10;
  assert.ok(findCrit(s, a, d, true));
  assert.equal(isKiai(s, a, d), isKiai(s, a, d));
  assert.equal(previewCombat(s, a, d).ret, 0);
  const before = a.hp;
  assert.ok(attack(s, a, d));
  assert.equal(a.hp, before);
  assert.equal(a.data?.kiai, s.turn);
  assert.ok(s.log.some((l) => l.text.startsWith('Kiai!')));
});

test('non-crit attacks still take a counter-blow, and crit rate is sane', () => {
  const { s, a, d } = duel();
  d.hp = 10; a.hp = 10;
  assert.ok(findCrit(s, a, d, false));
  assert.ok(previewCombat(s, a, d).ret > 0);
  let n = 0;
  for (let t = 0; t < 1000; t++) { s.turn = t; if (isKiai(s, a, d)) n++; }
  assert.ok(Math.abs(n / 1000 - KIAI_CHANCE) < 0.06);
});

test('last stand multiplies attack at 1 HP', () => {
  const { s, a, d } = duel();
  d.hp = 20;
  findCrit(s, a, d, false);
  a.hp = 10;
  const full = previewCombat(s, a, d).dmg;
  a.hp = 1;
  assert.ok(lastStand(s, a));
  const stand = previewCombat(s, a, d).dmg;
  // a 1-HP unit normally scales to a tenth of its force; the Last Stand makes it hit far harder than that
  assert.ok(stand >= 1 && stand > full * 0.1);
  assert.ok(!lastStand(s, d));
});

test('20-turn all-AI game with Japan completes', () => {
  const s = createGame({ seed: 11, human: null, opponents: ['japan', 'zulu', 'vikings'], mode: 'perfection' });
  startTurn(s);
  for (let i = 0; i < 20 * 3 && !s.over; i++) { aiTurn(s); endTurn(s); }
  assert.ok(s.turn >= 5);
});

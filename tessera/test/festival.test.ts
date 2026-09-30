import assert from 'node:assert/strict';
import test from 'node:test';
import { tileAt } from '../src/game/grid';
import { FEST_BASE, FEST_SCORE, FEST_STEP, festCost } from '../src/game/festival';
import { createGame } from '../src/game/mapgen';
import { doAction, tileActions } from '../src/game/rules';

test('a City Festival grows the city and scores, once a turn, dearer each time', () => {
  const s = createGame({ seed: 7, human: 'rome', opponents: ['greeks'], mode: 'perfection' });
  const c = s.cities.find((k) => k.owner === 0)!;
  const t = tileAt(s, c.x, c.y)!;
  s.players[0].stars = 100;
  assert.equal(festCost(c), FEST_BASE);
  const pop = c.pop + c.level * 100, score = s.players[0].bonusScore;
  assert.ok(doAction(s, 0, t, 'fest'));
  assert.equal(s.players[0].stars, 100 - FEST_BASE);
  assert.ok(c.pop + c.level * 100 > pop);
  assert.equal(s.players[0].bonusScore, score + FEST_SCORE);
  const again = tileActions(s, 0, t).find((a) => a.id === 'fest')!;
  assert.ok(!again.enabled && /this turn/.test(again.reason!));
  s.turn++;
  assert.equal(tileActions(s, 0, t).find((a) => a.id === 'fest')!.cost, FEST_BASE + FEST_STEP);
});

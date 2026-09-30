import assert from 'node:assert/strict';
import test from 'node:test';
import { TRIBE_IDS } from '../src/data/tribes';
import { aiTurn } from '../src/game/ai';
import { drain } from '../src/game/events';
import { tileAt } from '../src/game/grid';
import { APPOINT_COST, govOf, govsOf, govSlots, RANK_TURNS } from '../src/game/governors';
import { createGame } from '../src/game/mapgen';
import { cityIncome, defenseBonus, doAction, techCost, tileActions } from '../src/game/rules';
import { endTurn, startTurn } from '../src/game/turn';
import type { GameState, TribeId } from '../src/game/types';

function game(me: TribeId = 'rome') {
  const s = createGame({ seed: 7, human: me, opponents: ['greeks'], mode: 'domination' });
  s.players[0].stars = 100;
  return s;
}
const cap = (s: GameState) => s.cities.find((c) => c.owner === 0 && c.capital)!;
const capTile = (s: GameState) => tileAt(s, cap(s).x, cap(s).y)!;

test('governors: a Treasurer pays; a second governor needs a second slot (the next era)', () => {
  const s = game();
  const before = cityIncome(s, cap(s));
  const a = tileActions(s, 0, capTile(s)).find((x) => x.id === 'gov:treasurer')!;
  assert.ok(a.enabled && a.cost === APPOINT_COST);
  assert.ok(doAction(s, 0, capTile(s), 'gov:treasurer'));
  assert.equal(s.players[0].stars, 100 - APPOINT_COST);
  assert.equal(govOf(cap(s))!.k, 'treasurer');
  assert.equal(cityIncome(s, cap(s)), before + 2);
  assert.equal(govSlots(s, 0), 1);
});

test('governors: a Scholar makes techs cheaper and ranks up after serving', () => {
  const s = game();
  const full = techCost(s, 0, 'fishing');
  assert.ok(doAction(s, 0, capTile(s), 'gov:scholar'));
  assert.equal(techCost(s, 0, 'fishing'), full - 1);
  s.turn += RANK_TURNS;
  assert.equal(techCost(s, 0, 'fishing'), full - 2);
});

test('governors: a Marshal steadies the garrison and trains units cheaper', () => {
  const s = game();
  const t = capTile(s);
  const u = s.units.find((x) => x.owner === 0)!;
  const d0 = defenseBonus(s, u);
  const c0 = tileActions(s, 0, t).find((a) => a.id === 'train:archer' || a.id.startsWith('train:'))!;
  assert.ok(doAction(s, 0, t, 'gov:marshal'));
  assert.equal(defenseBonus(s, u), d0 + 0.5);
  const c1 = tileActions(s, 0, t).find((a) => a.id === c0.id)!;
  assert.ok(c1.cost === Math.max(1, c0.cost - 1) || c0.cost <= 1);
});

test('governors: a Steward grows the city every few turns', () => {
  const s = game();
  assert.ok(doAction(s, 0, capTile(s), 'gov:steward'));
  const c = cap(s);
  const before = c.pop + c.level * 100;
  s.current = 0;
  for (let i = 0; i < 3; i++) { s.turn++; startTurn(s); }
  drain();
  assert.ok(c.pop + c.level * 100 > before);
});

test('AI empires appoint governors', () => {
  const s = createGame({ seed: 4, human: null, opponents: TRIBE_IDS.slice(2, 7) as TribeId[], mode: 'perfection' });
  startTurn(s);
  let g = 0;
  while (!s.over && g++ < 400) { aiTurn(s); endTurn(s); drain(); }
  const n = s.players.reduce((a, p) => a + (p.neutral ? 0 : govsOf(s, p.id).length), 0);
  assert.ok(n >= 3, `governors appointed: ${n}`);
});

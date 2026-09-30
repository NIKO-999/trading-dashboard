import assert from 'node:assert/strict';
import test from 'node:test';
import { TRIBE_IDS } from '../src/data/tribes';
import { aiTurn } from '../src/game/ai';
import { drain } from '../src/game/events';
import { ageOf, AGE_TURNS, ERAS, eraState, GOLDEN_AT } from '../src/game/eras';
import { LUX_FIRST, luxuryIncome, monopoliesOf, MONOPOLY_AT } from '../src/game/goods';
import { createGame } from '../src/game/mapgen';
import { CONTACT_OFF, doAction, income, research, techCost } from '../src/game/rules';
import { endTurn, startTurn } from '../src/game/turn';
import type { GameState, TribeId } from '../src/game/types';

function game(me: TribeId = 'rome', foes: TribeId[] = ['greeks']) {
  const s = createGame({ seed: 7, human: me, opponents: foes, mode: 'domination' });
  for (const p of s.players) p.explored.fill(true);
  return s;
}
const cap = (s: GameState, pid = 0) => s.cities.find((c) => c.owner === pid && c.capital)!;

test('eras: learning enough techs enters the Classical era, with its bonus and the news', () => {
  const s = game();
  const p = s.players[0];
  p.met = [1]; s.players[1].met = [0];
  eraState(s, 0);
  p.techs = ['gathering', 'hunting', 'fishing', 'riding', 'climbing'];
  p.stars = 100;
  const pop = cap(s).pop + cap(s).level * 100;
  assert.ok(research(s, 0, 'farming'));
  assert.equal(eraState(s, 0).n, 1);
  assert.equal(ERAS[1].name, 'Classical');
  const ev = drain();
  assert.ok(ev.some((e) => e.type === 'toast' && e.player === 0 && /Classical Era/.test(e.text)));
  assert.ok(ev.some((e) => e.type === 'toast' && e.player === 1 && /entered the Classical Era/.test(e.text)), 'a rival who met them hears');
  assert.ok(cap(s).pop + cap(s).level * 100 > pop, 'cities grew');
});

test('eras: a high Era Score brings a Golden Age that pays every city, for a while', () => {
  const s = game();
  const p = s.players[0];
  eraState(s, 0);
  p.sparks = Array.from({ length: GOLDEN_AT }, (_, i) => `x${i}`);
  p.techs = ['gathering', 'hunting', 'fishing', 'riding', 'climbing'];
  p.stars = 100;
  const before = income(s, 0);
  assert.ok(research(s, 0, 'farming'));
  assert.equal(ageOf(s, 0), 'golden');
  assert.ok(income(s, 0) > before);
  s.turn += AGE_TURNS;
  assert.equal(ageOf(s, 0), null, 'the Age ends');
});

test('eras: a quiet era ends in a Dark Age, which makes techs cheaper', () => {
  const s = game();
  const p = s.players[0];
  eraState(s, 0);
  p.techs = ['gathering', 'hunting', 'fishing', 'riding', 'climbing'];
  p.stars = 100;
  const before = techCost(s, 0, 'mining');
  assert.ok(research(s, 0, 'farming'));
  assert.equal(ageOf(s, 0), 'dark');
  assert.ok(techCost(s, 0, 'mining') < before + 1);
});

test('contact: a tech a met rival knows costs less', () => {
  const s = game();
  const full = techCost(s, 0, 'fishing');
  s.players[1].techs.push('fishing');
  assert.equal(techCost(s, 0, 'fishing'), full, 'not before meeting them');
  s.players[0].met = [1];
  assert.ok(techCost(s, 0, 'fishing') <= Math.ceil(full * (1 - CONTACT_OFF)));
});

test('monopolies: three of one luxury pay every copy in full', () => {
  const s = game();
  const c = cap(s);
  const spots = s.tiles.filter((t) => t.owner === c.id && t.cityId === null && t.terrain !== 'shallow' && t.terrain !== 'ocean').slice(0, MONOPOLY_AT);
  for (const t of spots) { t.terrain = 'field'; t.resource = 'wine'; t.improvement = null; }
  s.players[0].techs.push('farming');
  s.players[0].stars = 100;
  for (const t of spots) assert.ok(doAction(s, 0, t, 'luxury'));
  assert.deepEqual(monopoliesOf(s, 0), ['wine']);
  assert.equal(luxuryIncome(s, 0), MONOPOLY_AT * LUX_FIRST);
  assert.ok(drain().some((e) => e.type === 'toast' && /Monopoly/.test(e.text)));
});

test('AI games move through the eras', () => {
  const s = createGame({ seed: 5, human: null, opponents: TRIBE_IDS.slice(4, 9) as TribeId[], mode: 'perfection' });
  startTurn(s);
  let g = 0;
  while (!s.over && g++ < 400) { aiTurn(s); endTurn(s); drain(); }
  const top = Math.max(...s.players.filter((p) => !p.neutral).map((p) => p.era?.n ?? 0));
  assert.ok(top >= 2, `someone reaches the Medieval era (best ${top})`);
});

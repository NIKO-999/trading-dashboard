import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { doAction, techCost, tileActions } from '../../src/game/rules';
import { createGame } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { hookIncome, hookStat } from '../../src/game/mech';
import {
  ELECT_COST, GOLDEN_LEVEL, HUSSAR_ATK, INTERREGNUM, SCHOLAR_OFF, TERM, aiChoice, electCost, electWhy, goldenIncome, interregnumLeft,
  kingOf, mech, merchantIncome, reignLeft, scholarTechOff,
} from '../../src/game/mech/poland';
import type { GameState, Tile } from '../../src/game/types';

function setup(seed = 5) {
  const s = createGame({ seed, human: 'poland', opponents: ['japan', 'mongols'], mode: 'perfection' });
  const city = s.cities.find((c) => c.owner === 0 && c.capital)!;
  const cap: Tile = s.tiles[city.y * s.size + city.x];
  return { s, city, cap };
}

test('Golden Liberty: +1★ a turn per city of level 3 or more', () => {
  const { s, city } = setup();
  city.level = 2;
  assert.equal(goldenIncome(s, 0), 0);
  const before = hookIncome(s, 0);
  city.level = GOLDEN_LEVEL;
  assert.equal(goldenIncome(s, 0), 1);
  assert.equal(hookIncome(s, 0), before + 1);
  city.level = 6;
  assert.equal(goldenIncome(s, 0), 1, 'one star per city, not per level');
  assert.equal(goldenIncome(s, 1), 0, 'only Poland');
});

test('the election: three platforms at the capital, the first is free, later ones 3★', () => {
  const { s, cap } = setup();
  const p = s.players[0];
  p.stars = 10;
  const acts = tileActions(s, 0, cap).filter((a) => a.id.startsWith('mech:elect:'));
  assert.deepEqual(acts.map((a) => a.id), ['mech:elect:0', 'mech:elect:1', 'mech:elect:2']);
  assert.ok(acts.every((a) => a.enabled && a.cost === 0));
  assert.ok(doAction(s, 0, cap, 'mech:elect:2'));
  assert.equal(p.stars, 10, 'the first election is free');
  assert.equal(kingOf(s, 0), 2);
  // no second vote while he reigns
  const busy = tileActions(s, 0, cap).find((a) => a.id === 'mech:elect:0')!;
  assert.equal(busy.enabled, false);
  assert.match(busy.reason!, /reigns/);
  assert.ok(!doAction(s, 0, cap, 'mech:elect:0'));
  // after the term and the interregnum, the next costs 3★
  s.turn += TERM + INTERREGNUM;
  assert.equal(electCost(s, 0), ELECT_COST);
  const next = tileActions(s, 0, cap).find((a) => a.id === 'mech:elect:1')!;
  assert.ok(next.enabled);
  assert.equal(next.cost, ELECT_COST);
  assert.ok(doAction(s, 0, cap, 'mech:elect:1'));
  assert.equal(p.stars, 10 - ELECT_COST);
  assert.equal(kingOf(s, 0), 1);
  // not offered off the capital, nor to other empires
  const other = s.tiles.find((t) => t.cityId === null && t.owner !== null)!;
  assert.equal(tileActions(s, 0, other).some((a) => a.id.startsWith('mech:elect')), false);
  const ec = s.cities.find((c) => c.owner === 1)!;
  assert.equal(tileActions(s, 1, s.tiles[ec.y * s.size + ec.x]).some((a) => a.id.startsWith('mech:elect')), false);
  JSON.parse(JSON.stringify(s));
});

test('a reign lasts 8 turns, then a 2-turn interregnum greys the vote out', () => {
  const { s, cap } = setup();
  s.players[0].stars = 20;
  const t0 = s.turn;
  assert.ok(doAction(s, 0, cap, 'mech:elect:0'));
  for (let i = 0; i < TERM; i++) {
    s.turn = t0 + i;
    assert.equal(kingOf(s, 0), 0, `reigns on turn ${i}`);
    assert.equal(reignLeft(s, 0), TERM - i);
  }
  s.turn = t0 + TERM;
  assert.equal(kingOf(s, 0), null);
  assert.equal(interregnumLeft(s, 0), INTERREGNUM);
  const a = tileActions(s, 0, cap).find((x) => x.id === 'mech:elect:2')!;
  assert.equal(a.enabled, false);
  assert.match(a.reason!, /Interregnum/);
  s.turn = t0 + TERM + 1;
  assert.equal(interregnumLeft(s, 0), 1);
  assert.ok(electWhy(s, 0));
  s.turn = t0 + TERM + INTERREGNUM;
  assert.equal(interregnumLeft(s, 0), 0);
  assert.equal(electWhy(s, 0), null);
});

test('Hussar King: mounted units +1 attack, foot soldiers not', () => {
  const { s, cap } = setup();
  const base = s.units.find((u) => u.owner === 0)!;
  const rider = { ...base, id: 9001, kind: 'rider' as const };
  const hussar = { ...base, id: 9002, kind: 'wingedhussar' as const };
  const foot = { ...base, id: 9003, kind: 'warrior' as const };
  s.units.push(rider, hussar, foot);
  const before = [rider, hussar, foot].map((u) => hookStat(s, u, 'atk'));
  assert.ok(doAction(s, 0, cap, 'mech:elect:0'));
  const after = [rider, hussar, foot].map((u) => hookStat(s, u, 'atk'));
  assert.equal(after[0] - before[0], HUSSAR_ATK);
  assert.equal(after[1] - before[1], HUSSAR_ATK);
  assert.equal(after[2], before[2]);
  s.turn += TERM;
  assert.equal(hookStat(s, rider, 'atk'), before[0], 'gone when the reign ends');
});

test('Merchant King: +1★ a turn per city', () => {
  const { s, cap } = setup();
  const before = hookIncome(s, 0);
  assert.ok(doAction(s, 0, cap, 'mech:elect:1'));
  const n = s.cities.filter((c) => c.owner === 0).length;
  assert.equal(merchantIncome(s, 0), n);
  assert.equal(hookIncome(s, 0), before + n);
});

test('Scholar King: techs 2★ cheaper, never below 1★', () => {
  const { s, cap } = setup();
  const tech = 'farming';
  const full = techCost(s, 0, tech);
  assert.equal(scholarTechOff(s, 0), 0);
  assert.ok(doAction(s, 0, cap, 'mech:elect:2'));
  assert.equal(scholarTechOff(s, 0), SCHOLAR_OFF);
  assert.equal(techCost(s, 0, tech), Math.max(1, full - SCHOLAR_OFF));
  s.players[0].sparks = [tech];
  assert.ok(techCost(s, 0, tech) >= 1);
  assert.equal(scholarTechOff(s, 1), 0, 'only Poland');
});

test('AI: Hussar King under threat, Merchant King when poor, else Scholar King', () => {
  const { s, city } = setup();
  s.players[0].stars = 2;
  s.units = s.units.filter((u) => u.owner === 0);
  assert.equal(aiChoice(s, 0), 1);
  s.players[0].stars = 20;
  assert.equal(aiChoice(s, 0), 2);
  const foe = { ...s.units[0], id: 9100, owner: 1, x: city.x + 1, y: city.y };
  s.units.push(foe);
  assert.equal(aiChoice(s, 0), 0);
  // the hook elects, and pays from the second time on
  s.players[0].human = false;
  assert.ok(mech.ai!(s, 0));
  assert.equal(kingOf(s, 0), 0);
  assert.equal(s.players[0].stars, 20);
  assert.equal(mech.ai!(s, 0), false, 'no second vote mid-reign');
});

test('20-turn all-AI game with Poland completes, and Poland elects kings', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['poland', 'japan', 'mongols'], mode: 'perfection' });
  const pid = s.players.findIndex((p) => p.tribe === 'poland');
  startTurn(s);
  let guard = 0, reigned = 0;
  while (!s.over && s.turn < 20 && guard++ < 1000) {
    aiTurn(s);
    if (s.current === pid && kingOf(s, pid) !== null) reigned++;
    endTurn(s);
  }
  assert.ok(s.turn >= 20 || s.over);
  if (s.players[pid].alive) assert.ok(reigned > 0, 'a king was elected');
});

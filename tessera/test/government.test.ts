import assert from 'node:assert/strict';
import test from 'node:test';
import { CARDS, CARD_BY_ID, GOVS } from '../src/data/governments';
import { aiTurn } from '../src/game/ai';
import { eraCheck, eraState } from '../src/game/eras';
import { drain } from '../src/game/events';
import {
  activeCards, adoptGov, cardsOf, govAi, govCost, govOf, govState, govWaitLeft, govWhy, GOV_WAIT, raidHeal, slotCard, slotLive, slotWhy,
} from '../src/game/government';
import { stockYield } from '../src/game/goods';
import { createGame, spawnUnit } from '../src/game/mapgen';
import { perksOf, perkSum, perkUnit } from '../src/game/perks';
import { addPop, cityIncome, defenseBonus, income, maxHp, popNeeded, trainCost } from '../src/game/rules';
import { cityRouteIncome } from '../src/game/trade';
import { endTurn, startTurn } from '../src/game/turn';
import type { GameState, TribeId } from '../src/game/types';
import { wonderCost } from '../src/game/wonders';

function game(me: TribeId = 'rome', foes: TribeId[] = ['greeks']) {
  const s = createGame({ seed: 7, human: me, opponents: foes, mode: 'domination', diplomacy: false } as never);
  for (const p of s.players) p.explored.fill(true);
  return s;
}
const cap = (s: GameState, pid = 0) => s.cities.find((c) => c.owner === pid && c.capital)!;
/** Enough techs for the Classical era (and the cards those techs unlock). */
function classical(s: GameState, pid = 0, extra: string[] = []) {
  const p = s.players[pid];
  for (const t of ['gathering', 'hunting', 'fishing', 'riding', 'climbing', 'farming', 'roads', 'tactics', ...extra]) if (!p.techs.includes(t)) p.techs.push(t);
  eraCheck(s, pid);
  drain();
}

test('government: an old save without one is a Chiefdom with two empty slots, and its bonus is a perk', () => {
  const s = game();
  delete s.players[0].gov;
  assert.equal(govOf(s, 0).id, 'chiefdom');
  assert.ok(perksOf(s, 0).some((p) => p.k === 'kill' && p.n === 1), 'the Chiefdom bonus counts before any state exists');
  const g = govState(s, 0);
  assert.deepEqual(g.slots, [null, null]);
  assert.deepEqual(JSON.parse(JSON.stringify(s.players[0].gov)), g, 'JSON-safe');
});

test('government: seven governments, eighteen cards, each unlocked by a tech or an era', () => {
  assert.equal(GOVS.length, 7);
  assert.equal(CARDS.length, 18);
  for (const t of ['military', 'economic', 'wild']) assert.ok(CARDS.some((c) => c.type === t));
  for (const c of CARDS) assert.ok(c.tech || c.era !== undefined, c.id);
  assert.deepEqual(GOVS.filter((g) => g.era === 1).map((g) => g.id), ['autocracy', 'oligarchy', 'republic']);
  assert.ok(GOVS.filter((g) => g.era === 2).length >= 2);
});

test('government: the Classical era opens new governments; a change costs stars, is immediate, then must wait', () => {
  const s = game();
  const p = s.players[0];
  p.stars = 100;
  assert.match(govWhy(s, 0, 'autocracy')!, /Classical/);
  classical(s);
  p.stars = 100;
  assert.equal(eraState(s, 0).n, 1);
  assert.match(govWhy(s, 0, 'monarchy')!, /Medieval/);
  const before = cityIncome(s, cap(s));
  const cost = govCost(s, 0);
  assert.ok(adoptGov(s, 0, 'autocracy'));
  assert.equal(p.stars, 100 - cost);
  assert.equal(govOf(s, 0).id, 'autocracy');
  assert.equal(cityIncome(s, cap(s)), before + 1, 'Autocracy: the capital pays +1★ at once');
  assert.equal(govState(s, 0).slots.length, 3);
  assert.ok(drain().some((e) => e.type === 'toast' && /Autocracy/.test(e.text)));
  assert.match(govWhy(s, 0, 'oligarchy')!, /wait/);
  s.turn += GOV_WAIT;
  assert.equal(govWaitLeft(s, 0), 0);
  assert.equal(govWhy(s, 0, 'oligarchy'), null);
  p.stars = 0;
  assert.match(govWhy(s, 0, 'oligarchy')!, /Needs/);
});

test('government: Autocracy guards the capital, Oligarchy arms foot soldiers, the Republic pays big cities', () => {
  const s = game();
  classical(s);
  const p = s.players[0];
  const c = cap(s);
  const w = s.units.find((u) => u.owner === 0 && u.x === c.x && u.y === c.y) ?? spawnUnit(s, 'warrior', 0, c.x, c.y, c.id);
  const def0 = defenseBonus(s, w), atk0 = perkUnit(s, w, 'atk');
  p.stars = 200;
  assert.ok(adoptGov(s, 0, 'autocracy'));
  assert.equal(defenseBonus(s, w), def0 + 0.5);
  s.turn += GOV_WAIT;
  assert.ok(adoptGov(s, 0, 'oligarchy'));
  assert.equal(perkUnit(s, w, 'atk'), atk0 + 0.5);
  s.turn += GOV_WAIT;
  c.level = 3;
  const inc = cityIncome(s, c);
  assert.ok(adoptGov(s, 0, 'republic'));
  assert.equal(cityIncome(s, c), inc + 1, '+1★ from a level-3 city');
});

test('government: a card in an empty slot works at once and flows through the perks (Tribute Rolls, Conscription)', () => {
  const s = game();
  classical(s);
  const inc = income(s, 0);
  assert.ok(slotCard(s, 0, 1, 'tribute'));
  assert.equal(income(s, 0), inc + 1);
  const cost = trainCost(s, 0, 'warrior');
  const rider = trainCost(s, 0, 'rider');
  assert.ok(slotCard(s, 0, 0, 'conscription'));
  assert.equal(trainCost(s, 0, 'rider'), rider - 1);
  assert.ok(trainCost(s, 0, 'warrior') >= 1 && trainCost(s, 0, 'warrior') <= cost);
  assert.deepEqual(activeCards(s, 0).map((c) => c.id), ['conscription', 'tribute']);
});

test('government: slots take only their type (Wild takes any), locked cards and duplicates are refused', () => {
  const s = game();
  classical(s);
  assert.match(slotWhy(s, 0, 1, 'levee')!, /military card needs/i);
  assert.match(slotWhy(s, 0, 0, 'bloomery')!, /tech/); // Mining not known
  assert.match(slotWhy(s, 0, 0, 'tolls')!, /Wild/);
  s.players[0].stars = 100;
  assert.ok(adoptGov(s, 0, 'autocracy')); // Military, Economic, Wild
  assert.ok(slotCard(s, 0, 2, 'levee'), 'a Wild slot takes a Military card');
  assert.match(slotWhy(s, 0, 0, 'levee')!, /Already slotted/);
  assert.ok(slotCard(s, 0, 0, 'conscription'));
});

test('government: replacing a card is once a turn and the new card only counts from next turn', () => {
  const s = game();
  classical(s);
  assert.ok(slotCard(s, 0, 1, 'tribute'));
  assert.ok(slotCard(s, 0, 0, 'levee'));
  drain();
  const inc = income(s, 0);
  assert.ok(slotCard(s, 0, 0, 'conscription'), 'the swap itself is free');
  assert.equal(slotLive(s, 0, 0), false);
  assert.ok(!activeCards(s, 0).some((c) => c.id === 'conscription'));
  assert.ok(!perksOf(s, 0).some((p) => p.k === 'unitcost'));
  assert.match(slotWhy(s, 0, 1, 'urban')!, /One card change a turn/);
  assert.match(slotWhy(s, 0, 1, null)!, /One card change a turn/);
  assert.equal(income(s, 0), inc);
  // removing and refilling can't dodge the wait
  s.turn++;
  assert.ok(slotLive(s, 0, 0));
  assert.ok(slotCard(s, 0, 1, null));
  assert.ok(slotCard(s, 0, 1, 'urban'));
  assert.equal(slotLive(s, 0, 1), false);
  s.turn++;
  s.current = 0;
  startTurn(s);
  assert.ok(drain().some((e) => e.type === 'toast' && e.player === 0 && /Urban Planning is now in force/.test(e.text)));
  assert.ok(slotLive(s, 0, 1));
});

test('government: changing government keeps the cards that still fit and drops the rest', () => {
  const s = game();
  classical(s, 0, ['archery']);
  s.players[0].stars = 100;
  assert.ok(adoptGov(s, 0, 'oligarchy')); // Military, Military, Economic
  assert.ok(slotCard(s, 0, 0, 'levee'));
  assert.ok(slotCard(s, 0, 1, 'bounty'));
  assert.ok(slotCard(s, 0, 2, 'tribute'));
  s.turn += GOV_WAIT;
  assert.ok(adoptGov(s, 0, 'autocracy')); // Military, Economic, Wild
  assert.deepEqual(govState(s, 0).slots, ['levee', 'tribute', 'bounty'], 'the second Military card moves to the Wild slot');
  s.turn += GOV_WAIT;
  assert.ok(adoptGov(s, 0, 'republic')); // Economic, Economic, Wild
  assert.deepEqual(govState(s, 0).slots, ['tribute', null, 'levee']);
});

test('government: the economic cards reach their rules (Caravan Guilds, Bloomery, Stockyards, Urban Planning, Patronage, Pilgrims)', () => {
  const s = game();
  classical(s, 0, ['mining', 'horsemanship', 'masonry']);
  const p = s.players[0];
  p.stars = 200;
  assert.ok(adoptGov(s, 0, 'republic')); // Economic, Economic, Wild
  // a trade route to the rival's capital
  const a = cap(s, 0), b = cap(s, 1);
  s.trade = { routes: [{ id: 1, a: a.id, b: b.id, pa: 0, pb: 1, by: 0, sea: false, path: [a.y * s.size + a.x, b.y * s.size + b.x], since: 0 }] };
  const route = cityRouteIncome(s, a);
  assert.ok(route > 0);
  assert.ok(slotCard(s, 0, 0, 'caravan'));
  assert.equal(cityRouteIncome(s, a), Math.floor(route * 1.5));
  // strategic resources
  const y = stockYield(s, 0);
  assert.ok(slotCard(s, 0, 1, 'bloomery'));
  assert.ok(slotCard(s, 0, 2, 'stockyards'));
  assert.deepEqual(stockYield(s, 0), { iron: y.iron + 1, horses: y.horses + 1 });
  // growth, wonders, temples
  s.turn += 1;
  assert.ok(slotCard(s, 0, 1, 'urban'));
  s.turn += 1;
  const c = cap(s);
  c.pop = 0;
  const lvl = c.level;
  addPop(s, c, popNeeded(c.level));
  assert.equal(c.level, lvl + 1);
  assert.equal(c.pop, 1, 'Urban Planning: +1 population on level-up');
  const wc = wonderCost(s, 0, 'pyramids');
  assert.ok(slotCard(s, 0, 0, 'patronage'));
  s.turn += 1;
  assert.equal(wonderCost(s, 0, 'pyramids'), Math.round(wc * 0.8));
  assert.equal(perkSum(s, 0, 'income', (pk) => pk.per === 'temple'), 0);
  assert.ok(slotCard(s, 0, 2, 'pilgrims'));
  s.turn += 1;
  assert.equal(perkSum(s, 0, 'income', (pk) => pk.per === 'temple'), 1);
});

test('government: Scorched Earth heals a raider; Survey Corps speeds scouts', () => {
  const s = game();
  classical(s, 0, ['roads']);
  s.players[0].stars = 100;
  assert.ok(adoptGov(s, 0, 'autocracy'));
  const c = cap(s);
  const w = spawnUnit(s, 'warrior', 0, c.x, c.y + 1, c.id);
  w.hp = 3;
  raidHeal(s, w);
  assert.equal(w.hp, 3, 'no card, no healing');
  assert.ok(slotCard(s, 0, 0, 'scorched'));
  raidHeal(s, w);
  assert.equal(w.hp, Math.min(maxHp(w), 8));
  const scout = spawnUnit(s, 'scout', 0, c.x + 1, c.y, c.id);
  const m = perkUnit(s, scout, 'move');
  assert.ok(slotCard(s, 0, 2, 'survey'));
  assert.equal(perkUnit(s, scout, 'move'), m + 1);
  assert.equal(perkUnit(s, w, 'move'), 0, 'only scouts and voyagers');
});

test('government: the AI takes military cards at war and economic ones at peace', () => {
  const peace = game('rome', ['greeks']);
  classical(peace, 1);
  peace.players[1].stars = 0; // no government change, just cards
  peace.current = 1;
  while (govAi(peace, 1));
  const war = game('rome', ['greeks']);
  classical(war, 1);
  war.players[1].stars = 0;
  war.current = 1;
  (war.players[1].skill ??= {}).war = war.turn; // it fought this turn
  while (govAi(war, 1));
  const cards = (s: GameState) => govState(s, 1).slots;
  assert.equal(cards(war)[0], 'conscription', 'war: Conscription for the Military slot');
  assert.equal(cards(peace)[0], 'conscription', 'the Military slot takes the best military card either way');
  // with stars, at war it picks a military government; at peace an economic one
  for (const s of [war, peace]) { s.players[1].stars = 60; s.players[1].gov!.since = -99; s.turn++; } // the next turn (war is remembered for one)
  while (govAi(war, 1));
  while (govAi(peace, 1));
  assert.equal(govOf(war, 1).id, 'oligarchy');
  assert.equal(govOf(peace, 1).id, 'republic');
  assert.ok(govState(war, 1).slots.filter((id) => id && CARD_BY_ID[id].type === 'military').length >= 2);
  assert.ok(govState(peace, 1).slots.filter((id) => id && CARD_BY_ID[id].type === 'economic').length >= 2);
});

test('government: a 30-turn all-AI game changes governments and slots cards, and saves cleanly', () => {
  const s = createGame({ seed: 3, human: null, opponents: ['rome', 'mongols', 'egypt', 'greeks'], mode: 'perfection', maxTurns: 30 } as never);
  startTurn(s);
  let g = 0;
  const swaps = new Set<string>();
  while (!s.over && g++ < 400) {
    aiTurn(s);
    for (const p of s.players) for (const id of p.gov?.slots ?? []) if (id) swaps.add(`${p.id}:${id}`);
    endTurn(s);
    drain();
  }
  assert.ok(s.over);
  const changes = s.log.filter((l) => /adopt (Autocracy|Oligarchy|Classical Republic|Monarchy|Merchant Republic|Theocracy)\./.test(l.text));
  assert.ok(changes.length >= 4, `governments changed (${changes.length})`);
  assert.ok(new Set(s.players.map((p) => p.gov?.id)).size >= 1);
  assert.ok(s.players.every((p) => p.gov && p.gov.id !== 'chiefdom'), 'everyone left the Chiefdom');
  assert.ok(swaps.size >= 12, `many cards were used (${swaps.size})`);
  assert.ok(s.players.every((p) => activeCards(s, p.id).length >= 2), 'every empire has cards in force');
  assert.ok(cardsOf(s, 0).length > 10);
  const back = JSON.parse(JSON.stringify(s)) as GameState;
  assert.deepEqual(back.players.map((p) => p.gov), s.players.map((p) => p.gov));
});

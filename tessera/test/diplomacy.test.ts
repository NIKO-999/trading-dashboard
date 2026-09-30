import assert from 'node:assert/strict';
import test from 'node:test';
import { stockOf } from '../src/game/goods';
import { aiStep } from '../src/game/ai';
import {
  aiAnswer, allies, answer, BETRAYAL, canDeal, declareCheck, declareWar, diploAi, diploIncome, diploTurnStart, GIFT, hostile, mayStep, NEAR, nearness,
  offersFor, opinion, opinionWhy, PACT_LOCK, pactOf, power, propose, relation, tradeValue,
  BARTER, offerCheck,
} from '../src/game/diplomacy';
import { drain } from '../src/game/events';
import { dist, isLand, neighbors, tileAt } from '../src/game/grid';
import { createGame, foundCity, meet, spawnUnit } from '../src/game/mapgen';
import { attack, attackOptions, checkGameOver, citiesOf, moveOptions, tileActions, tileOwnerPlayer, unitAt } from '../src/game/rules';
import { endTurn, startTurn } from '../src/game/turn';
import type { GameState, Tile, TribeId, Unit } from '../src/game/types';
import { ensureNeutral, spawnNeutral } from '../src/game/wild';

/** Two humans sharing a device (so offers wait for an answer) and one computer rival, with diplomacy on. */
const hotseat = (opts: Partial<Parameters<typeof createGame>[0]> = {}) =>
  createGame({ seed: 5, human: null, humans: ['rome', 'egypt'], opponents: ['vikings'], mode: 'perfection', diplomacy: true, ...opts });

const reveal = (s: GameState) => { for (const p of s.players) p.explored.fill(true); };

/** Signs a treaty between two humans through the real offer flow: proposed, then accepted on the other's turn. */
function sign(s: GameState, a: number, b: number, kind: 'peace' | 'alliance') {
  meet(s, a, b);
  if (kind === 'alliance' && relation(s, a, b) === 'war') sign(s, a, b, 'peace');
  assert.equal(propose(s, a, b, kind), 'sent');
  const o = offersFor(s, b).find((x) => x.kind === kind)!;
  assert.ok(o, 'the offer waits for the other human');
  assert.ok(answer(s, o.id, true));
  assert.equal(relation(s, a, b), kind);
}

/** A free land tile outside every border, right beside `pid`'s territory. */
function besideBorder(s: GameState, pid: number): Tile {
  const t = s.tiles.find((x) => isLand(x) && x.terrain !== 'mountain' && x.owner === null && !unitAt(s, x.x, x.y) && !x.village && !x.ruin
    && neighbors(s, x.x, x.y).some((n) => isLand(n) && n.terrain !== 'mountain' && n.cityId === null && tileOwnerPlayer(s, n) === pid && !unitAt(s, n.x, n.y)));
  assert.ok(t, 'a spot beside the border');
  return t!;
}
const place = (s: GameState, u: Unit, t: Tile) => { u.x = t.x; u.y = t.y; u.moved = u.attacked = false; };
const warrior = (s: GameState, pid: number) => s.units.find((u) => u.owner === pid)!;
const toasts = (pid: number) => drain().filter((e) => e.type === 'toast' && e.player === pid).map((e) => (e as { text: string }).text);

test('off unless asked for; older saves and games without it keep everyone at war', () => {
  const off = createGame({ seed: 5, human: 'rome', opponents: ['egypt'], mode: 'perfection' });
  assert.equal(off.diplo, undefined);
  meet(off, 0, 1);
  assert.equal(relation(off, 0, 1), 'war');
  assert.ok(hostile(off, 0, 1) && !hostile(off, 0, 0));
  assert.ok(!canDeal(off, 0, 1));
  assert.equal(propose(off, 0, 1, 'peace'), null);
  assert.equal(diploIncome(off, 0), 0);
  // a save from before diplomacy (no `diplo`) loads and plays on
  const old = JSON.parse(JSON.stringify(off)) as GameState;
  startTurn(old);
  for (let i = 0; i < 8; i++) { for (let n = 0; n < 300 && !old.players[old.current].human && aiStep(old); n++); endTurn(old); }
  assert.equal(old.diplo, undefined);
  // and the state of a game with diplomacy survives a save
  const on = hotseat();
  sign(on, 0, 1, 'peace');
  const back = JSON.parse(JSON.stringify(on)) as GameState;
  assert.equal(relation(back, 0, 1), 'peace');
  assert.ok(!hostile(back, 1, 0));
});

test('a peace treaty blocks attacks, entering borders and capture', () => {
  const s = hotseat();
  reveal(s);
  const u = warrior(s, 0);
  place(s, u, besideBorder(s, 1));
  const foe = warrior(s, 1);
  const next = neighbors(s, u.x, u.y).find((n) => isLand(n) && n.terrain !== 'mountain' && !unitAt(s, n.x, n.y) && n.cityId === null && tileOwnerPlayer(s, n) !== 1)!;
  place(s, foe, next);
  meet(s, 0, 1);
  const into1 = (o: { x: number; y: number }) => tileOwnerPlayer(s, tileAt(s, o.x, o.y)!) === 1;
  assert.ok(attackOptions(s, u).includes(foe), 'at war they can fight');
  assert.ok(moveOptions(s, u).some(into1), 'at war the border is open');
  sign(s, 0, 1, 'peace');
  assert.ok(!attackOptions(s, u).includes(foe), 'no attacking a peace partner');
  assert.ok(!attack(s, u, foe));
  assert.ok(!moveOptions(s, u).some(into1), 'no entering their borders');
  assert.ok(!moveOptions(s, foe).some((o) => tileAt(s, o.x, o.y)!.cityId !== null && tileOwnerPlayer(s, tileAt(s, o.x, o.y)!) === 0));
  // a unit caught inside when the treaty is signed may still walk out
  const inside = s.tiles.find((t) => tileOwnerPlayer(s, t) === 1 && t.cityId === null && isLand(t) && t.terrain !== 'mountain' && !unitAt(s, t.x, t.y)
    && neighbors(s, t.x, t.y).some((n) => n.owner === null && isLand(n) && n.terrain !== 'mountain'))!;
  place(s, u, inside);
  assert.ok(moveOptions(s, u).length > 0);
  assert.ok(mayStep(s, 0, inside, inside) && !mayStep(s, 0, null, inside));
  // no capturing a partner's city, even standing in it
  const cap = citiesOf(s, 1)[0];
  s.units = s.units.filter((x) => !(x.x === cap.x && x.y === cap.y));
  place(s, u, tileAt(s, cap.x, cap.y)!);
  assert.ok(!tileActions(s, 0, tileAt(s, cap.x, cap.y)!).some((a) => a.id === 'capture'));
});

test('breaking a treaty: locked at first, then a declaration that bites a turn later and costs trust', () => {
  const s = hotseat();
  sign(s, 0, 1, 'peace');
  meet(s, 1, 2); meet(s, 0, 2);
  assert.match(declareCheck(s, 0, 1)!, /holds/);
  assert.ok(!declareWar(s, 0, 1));
  s.turn += PACT_LOCK;
  const before = opinion(s, 2, 0);
  assert.ok(declareWar(s, 0, 1));
  assert.equal(relation(s, 0, 1), 'peace', 'the treaty binds until the declarer\'s next turn');
  assert.ok(toasts(1).some((t) => /declare war on you/.test(t)));
  assert.equal(s.diplo!.rep[0], -BETRAYAL);
  assert.ok(opinion(s, 2, 0) < before, 'everyone trusts a treaty-breaker less');
  assert.ok(opinionWhy(s, 1, 0).why.some(([k]) => k === 'Past deeds'));
  // the war starts at player 0's next turn
  s.current = 1; startTurn(s);
  assert.equal(relation(s, 0, 1), 'peace');
  s.current = 0; startTurn(s);
  assert.equal(relation(s, 0, 1), 'war');
  assert.ok(s.log.some((l) => /War between the Romans and the Egyptians/.test(l.text)));
  assert.equal(propose(s, 0, 1, 'peace'), null, 'no peace straight after the war began');
});

test('an alliance opens borders (not cities), shares maps and calls allies to arms', () => {
  const s = hotseat();
  const u = warrior(s, 0);
  place(s, u, besideBorder(s, 1));
  reveal(s);
  s.players[1].explored.fill(false);
  sign(s, 0, 1, 'alliance');
  assert.deepEqual(allies(s, 0), [1]);
  assert.ok(s.players[1].explored.every(Boolean), 'allies share their maps');
  const opts = moveOptions(s, u);
  assert.ok(opts.some((o) => tileOwnerPlayer(s, tileAt(s, o.x, o.y)!) === 1 && tileAt(s, o.x, o.y)!.cityId === null), 'allied land is open');
  assert.ok(!opts.some((o) => tileAt(s, o.x, o.y)!.cityId !== null), 'but not allied cities');
  // Egypt (1) is at peace with the Vikings (2), who attack Rome (0): Egypt is called to arms
  meet(s, 1, 2); meet(s, 0, 2);
  s.diplo!.pacts.push({ a: 1, b: 2, kind: 'peace', since: s.turn });
  const v = warrior(s, 2);
  const spot = neighbors(s, u.x, u.y).find((n) => isLand(n) && n.terrain !== 'mountain' && !unitAt(s, n.x, n.y) && tileOwnerPlayer(s, n) !== 1)!;
  place(s, v, spot);
  assert.ok(attack(s, v, u));
  const call = offersFor(s, 1).find((o) => o.kind === 'call');
  assert.ok(call && call.enemy === 2 && call.from === 0);
  s.turn += 1;
  assert.ok(answer(s, call!.id, true));
  assert.equal(pactOf(s, 1, 2)!.by, 1, 'Egypt declares war to stand by its ally');
  assert.equal(s.diplo!.rep[1] ?? 0, 0, 'honouring an alliance costs no trust');
});

test('trade deals and tribute pay every turn', () => {
  const s = hotseat();
  sign(s, 0, 1, 'peace');
  assert.equal(propose(s, 0, 1, 'trade'), 'sent');
  answer(s, offersFor(s, 1)[0].id, true);
  const n = tradeValue(s, 0, 1);
  assert.ok(n >= 1 && n <= 5);
  assert.equal(diploIncome(s, 0), n);
  s.turn = 3;
  s.players[1].stars = 20;
  assert.equal(propose(s, 0, 1, 'demandTurns'), 'sent');
  answer(s, offersFor(s, 1)[0].id, true);
  assert.equal(diploIncome(s, 1), n - 2);
  const [a, b] = [s.players[0].stars, s.players[1].stars];
  diploTurnStart(s, 1); // Egypt trades and pays its tribute
  diploTurnStart(s, 0);
  assert.equal(s.players[1].stars - b, n - 2);
  assert.equal(s.players[0].stars - a, n + 2);
  assert.ok(toasts(1).some((t) => /tribute/.test(t)));
  // a gift is given at once and warms them up
  const before = opinion(s, 1, 0);
  const stars = s.players[0].stars;
  assert.equal(propose(s, 0, 1, 'gift'), 'given');
  assert.equal(s.players[0].stars, stars - GIFT);
  assert.ok(opinion(s, 1, 0) > before);
});

test('Rogue States and Great Beasts are never offered diplomacy and stay hostile', () => {
  const s = hotseat({ wild: true });
  const n = ensureNeutral(s);
  meet(s, 0, n);
  assert.ok(!canDeal(s, 0, n));
  assert.equal(propose(s, 0, n, 'peace'), null);
  const t = s.tiles.find((x) => x.cityId === null && !unitAt(s, x.x, x.y))!;
  const k = spawnNeutral(s, 'kraken', t.x, t.y);
  assert.ok(hostile(s, 0, k.owner) && hostile(s, k.owner, 0));
});

test('the AI signs by opinion and strength, and breaks a treaty when strong and the other side weak and near', () => {
  const s = createGame({ seed: 8, human: 'india', opponents: ['mongols', 'tibet'], mode: 'perfection', diplomacy: true });
  meet(s, 0, 1); meet(s, 0, 2); meet(s, 1, 2);
  s.turn = 4;
  // peaceful Tibet takes peace; the Mongols, far stronger and close, refuse it
  assert.ok(aiAnswer(s, { id: 1, from: 0, to: 2, kind: 'peace', turn: s.turn }));
  const cap0 = citiesOf(s, 0)[0];
  const near = s.tiles.filter((t) => isLand(t) && t.terrain !== 'mountain' && !unitAt(s, t.x, t.y) && t.cityId === null && dist(t.x, t.y, cap0.x, cap0.y) <= 3);
  for (let i = 0; i < 8; i++) spawnUnit(s, 'knight', 1, near[i].x, near[i].y, null);
  if (nearness(s, 0, 1) > NEAR) foundCity(s, near[9].x, near[9].y, 1, false); // a Mongol town close by
  assert.ok(power(s, 1) > power(s, 0) * 2);
  assert.ok(!aiAnswer(s, { id: 2, from: 0, to: 1, kind: 'peace', turn: s.turn }), 'the strong and warlike keep their war');
  // a treaty the strong Mongols no longer need: they break it once the lock has passed
  s.diplo!.pacts.push({ a: 0, b: 1, kind: 'peace', since: s.turn - PACT_LOCK });
  s.current = 1;
  assert.ok(diploAi(s, 1));
  assert.equal(pactOf(s, 0, 1)!.by, 1);
  assert.ok(toasts(0).some((t) => /Mongols declare war on you/.test(t)));
  // their AI proposes to humans through the envoy card
  const s2 = createGame({ seed: 8, human: 'india', opponents: ['tibet'], mode: 'perfection', diplomacy: true });
  meet(s2, 0, 1);
  s2.turn = 3; s2.current = 1;
  assert.ok(diploAi(s2, 1));
  assert.equal(offersFor(s2, 0)[0]?.kind, 'peace');
  assert.ok(!diploAi(s2, 1), 'one initiative a turn');
});

test('the AI never attacks or marches on its treaty partners', () => {
  const s = createGame({ seed: 5, human: null, opponents: ['vikings', 'egypt'], mode: 'perfection', diplomacy: true });
  reveal(s);
  meet(s, 0, 1);
  s.diplo!.pacts.push({ a: 0, b: 1, kind: 'alliance', since: 0 });
  const v = warrior(s, 0), e = warrior(s, 1);
  place(s, v, besideBorder(s, 1));
  const spot = neighbors(s, v.x, v.y).find((n) => isLand(n) && n.terrain !== 'mountain' && !unitAt(s, n.x, n.y) && n.cityId === null)!;
  place(s, e, spot);
  e.hp = 3; // easy prey, if it were an enemy
  s.diplo!.pacts = [];
  assert.ok(attackOptions(s, v).includes(e), 'at war it would be a target');
  s.diplo!.pacts.push({ a: 0, b: 1, kind: 'alliance', since: 0 });
  s.current = 0;
  for (let i = 0; i < 200 && aiStep(s); i++);
  assert.equal(e.hp, 3);
  assert.ok(s.units.includes(e));
  assert.ok(citiesOf(s, 1).every((c) => c.owner === 1));
});

test('Domination: allied survivors win together', () => {
  const s = createGame({ seed: 5, human: null, opponents: ['rome', 'egypt', 'vikings'], mode: 'domination', diplomacy: true });
  meet(s, 0, 1);
  s.diplo!.pacts.push({ a: 0, b: 1, kind: 'alliance', since: 0 });
  checkGameOver(s);
  assert.ok(!s.over, 'the Vikings still stand');
  s.cities = s.cities.filter((c) => c.owner !== 2);
  s.players[2].alive = false;
  checkGameOver(s);
  assert.ok(s.over);
  assert.deepEqual(s.diplo!.victors, [0, 1]);
  assert.ok(s.winner === 0 || s.winner === 1);
});

test('a 30-turn all-AI game signs and breaks treaties, and still ends', () => {
  let signed = 0, broken = 0, trade = 0;
  for (const seed of [1, 2, 3]) {
    const tribes: TribeId[] = ['mongols', 'swahili', 'tibet', 'rome', 'mali'];
    const s = createGame({ seed, human: null, opponents: tribes, mode: 'perfection', maxTurns: 30, diplomacy: true, wild: true, rebels: true });
    for (let guard = 0; !s.over && guard < 400; guard++) { for (let n = 0; n < 400 && aiStep(s); n++); endTurn(s); }
    assert.ok(s.over, 'the game ends');
    assert.ok(s.turn <= 30); // the turn limit, or a conquest before it
    const news = s.log.filter((l) => l.text.startsWith('diplo:')).map((l) => l.text);
    signed += news.filter((t) => /sign a peace treaty|form an alliance/.test(t)).length;
    broken += news.filter((t) => /declare war/.test(t)).length;
    trade += news.filter((t) => /open trade/.test(t)).length;
    assert.doesNotThrow(() => JSON.parse(JSON.stringify(s)));
    // no two treaty partners ever share a city
    for (const p of s.diplo!.pacts) assert.ok(s.players[p.a].alive && s.players[p.b].alive);
  }
  assert.ok(signed >= 3, `treaties signed: ${signed}`);
  assert.ok(broken >= 1, `treaties broken: ${broken}`);
  assert.ok(trade >= 1, `trade deals: ${trade}`);
});

test('barter: buy Iron from an empire at peace; an AI sells only what it can spare', () => {
  const s = hotseat();
  reveal(s);
  meet(s, 0, 1);
  assert.equal(offerCheck(s, 0, 1, 'buyIron'), 'Not while at war');
  sign(s, 0, 1, 'peace');
  s.players[0].stars = 20;
  stockOf(s.players[1]).iron = 1;
  assert.match(offerCheck(s, 0, 1, 'buyIron')!, /no Iron/);
  stockOf(s.players[1]).iron = 6;
  const before = s.players[1].stars;
  assert.equal(propose(s, 0, 1, 'buyIron'), 'sent');
  const o = offersFor(s, 1).find((x) => x.kind === 'buyIron')!;
  assert.ok(answer(s, o.id, true));
  assert.equal(stockOf(s.players[0]).iron, BARTER.amount);
  assert.equal(stockOf(s.players[1]).iron, 6 - BARTER.amount);
  assert.equal(s.players[0].stars, 20 - BARTER.price);
  assert.equal(s.players[1].stars, before + BARTER.price);
  // an AI (the Vikings) that needs its iron for swordsmen keeps it, and sells a surplus
  const ask = { id: 99, from: 0, to: 2, kind: 'buyIron' as const, turn: s.turn, stars: BARTER.price };
  s.players[2].techs.push('smithing');
  stockOf(s.players[2]).iron = 4;
  assert.equal(aiAnswer(s, ask), false);
  stockOf(s.players[2]).iron = 8;
  assert.equal(aiAnswer(s, ask), true);
});

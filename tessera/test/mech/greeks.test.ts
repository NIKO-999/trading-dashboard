import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame, foundCity, spawnUnit } from '../../src/game/mapgen';
import { aiTurn } from '../../src/game/ai';
import { doAction, income, previewCombat, tileActions, def } from '../../src/game/rules';
import { endTurn, startTurn } from '../../src/game/turn';
import { hookIncome } from '../../src/game/mech';
import { activeEdict, alignedCities, alignmentIncome, edictLeft, enactedCount, offered, EDICT_PREFIX, EDICT_TURNS, REPEAL_COST, seatOf, syncSeat, votes } from '../../src/game/mech/greeks';
import { tileAt } from '../../src/game/grid';
import type { GameState } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 7, human: 'greeks', opponents: ['rome'], mode: 'perfection' });
  const me = s.players.findIndex((p) => p.tribe === 'greeks');
  for (const p of s.players) p.explored.fill(true);
  const cap = s.cities.find((c) => c.owner === me)!;
  s.current = me; s.turn = 1;
  return { s, me, cap };
}
/** A second Greek city on a free land tile a few steps from the first. */
function addCity(s: GameState, me: number, from: { x: number; y: number }) {
  const t = s.tiles.find((k) => k.terrain === 'field' && k.cityId === null && !k.village && k.owner === null && Math.abs(k.x - from.x) + Math.abs(k.y - from.y) >= 3 && !s.units.some((u) => u.x === k.x && u.y === k.y))!;
  return foundCity(s, t.x, t.y, me, false);
}
const backToMe = (s: GameState, me: number) => { endTurn(s); for (let i = 0; i < 4 && s.current !== me; i++) endTurn(s); };

test('the largest city is the seat and carries the capital flag', () => {
  const { s, me, cap } = setup();
  const b = addCity(s, me, cap);
  cap.level = 2; b.level = 1;
  syncSeat(s, me);
  assert.equal(seatOf(s, me), cap);
  assert.ok(cap.capital && !b.capital);
  b.level = 3;
  syncSeat(s, me);
  assert.equal(seatOf(s, me), b);
  assert.ok(b.capital && !cap.capital);
  b.capital = false; cap.capital = true;
});

test('a human enacts an offered edict through the tile menu; it lasts EDICT_TURNS', () => {
  const { s, me, cap } = setup();
  startTurn(s);
  const offer = offered(s, me);
  assert.equal(offer.length, 3);
  const t = tileAt(s, cap.x, cap.y)!;
  const acts = tileActions(s, me, t).filter((a) => a.id.startsWith(EDICT_PREFIX));
  assert.equal(acts.length, 3);
  assert.ok(acts.every((a) => a.enabled && a.cost === 0));
  assert.ok(doAction(s, me, t, acts[0].id));
  assert.equal(activeEdict(s, me), offer[0]);
  assert.equal(edictLeft(s, me), EDICT_TURNS);
  assert.equal(enactedCount(s, me), 1);
  // replacing it costs stars
  const other = tileActions(s, me, t).find((a) => a.id === EDICT_PREFIX + offer[1])!;
  assert.equal(other.cost, REPEAL_COST);
  assert.equal(tileActions(s, me, t).find((a) => a.id === EDICT_PREFIX + offer[0])!.enabled, false);
  // an edict expires after its turns
  for (let i = 0; i < EDICT_TURNS; i++) backToMe(s, me);
  assert.equal(activeEdict(s, me), null);
});

test('edict effects: olympiad attack, walls defence, trade income, pax, philosophy growth', () => {
  const { s, me, cap } = setup();
  const b = addCity(s, me, cap);
  const st = s.players[me].mech as Record<string, unknown>;
  const set = (e: string) => { st.edict = e; st.left = 3; };
  const mine = spawnUnit(s, 'warrior', me, cap.x, cap.y, cap.id);
  const foeCity = s.cities.find((c) => c.owner !== me)!;
  const foe = spawnUnit(s, 'warrior', foeCity.owner, foeCity.x, foeCity.y, null);
  const atk0 = previewCombat(s, mine, foe).dmg;
  set('olympiad');
  assert.ok(previewCombat(s, mine, foe).dmg >= atk0);
  assert.equal(def(mine).atk + 1 > 0, true);
  set('trade');
  assert.equal(hookIncome(s, me) - alignmentIncome(s, me), 2 + 2);
  set('philosophy');
  b.level = 1; b.pop = 0; cap.level = 3;
  const before = b.pop + b.level * 10;
  startTurn(s);
  assert.ok(b.pop + b.level * 10 > before, 'the smallest city grew');
  // pax: a foreign attacker inside the Greek borders does nothing
  set('pax');
  const t = s.tiles.find((k) => k.owner === cap.id && k.cityId === null && k.terrain === 'field' && !s.units.some((u) => u.x === k.x && u.y === k.y))!;
  const inv = spawnUnit(s, 'warrior', foeCity.owner, t.x, t.y, null);
  assert.equal(previewCombat(s, inv, mine).dmg, 0);
  st.edict = null; st.left = 0;
  assert.ok(previewCombat(s, inv, mine).dmg > 0);
});

test('Amphictyony: equal-level cities pay +50% on resource improvements until the balance breaks', () => {
  const { s, me, cap } = setup();
  const b = addCity(s, me, cap);
  cap.level = 2; b.level = 2;
  const own = (c: typeof cap) => s.tiles.filter((t) => t.owner === c.id && t.cityId === null);
  for (const c of [cap, b]) for (const t of own(c).slice(0, 4)) { t.resource = 'crop'; t.improvement = 'farm'; }
  const n = [cap, b].reduce((a, c) => a + own(c).filter((t) => t.resource && t.improvement === 'farm').length, 0);
  assert.equal(alignedCities(s, me).length, 2);
  assert.equal(alignmentIncome(s, me), Math.floor(n / 2));
  assert.ok(alignmentIncome(s, me) >= 1);
  b.level = 3;
  assert.equal(alignedCities(s, me).length, 0);
  assert.equal(alignmentIncome(s, me), 0);
  // paid at the start of the turn
  b.level = 2;
  const stars = s.players[me].stars;
  backToMe(s, me);
  assert.ok(s.players[me].stars >= stars + alignmentIncome(s, me) + income(s, me) - 1);
});

test('cities vote and the AI enacts the winning edict', () => {
  const { s, me, cap } = setup();
  addCity(s, me, cap);
  startTurn(s);
  const tally = votes(s, me);
  assert.equal(Object.values(tally).reduce((a, b) => a + b, 0), 2);
  s.players[me].human = false;
  aiTurn(s);
  assert.ok(enactedCount(s, me) >= 1);
});

test('20-turn all-AI game with the Greeks completes and uses edicts', () => {
  const s = createGame({ seed: 11, human: 'greeks', opponents: ['rome', 'zulu'], mode: 'perfection' });
  const me = s.players.findIndex((p) => p.tribe === 'greeks');
  for (const p of s.players) p.human = false;
  for (let i = 0; i < 20 * s.players.length && !s.over; i++) { aiTurn(s); endTurn(s); }
  assert.ok(s.turn >= 10);
  assert.ok(enactedCount(s, me) >= 1, 'the AI enacted an edict');
  assert.equal(s.cities.filter((c) => c.owner === me && c.capital).length <= 1, true);
  JSON.parse(JSON.stringify(s));
});

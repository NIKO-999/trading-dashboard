import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { doAction, tileActions } from '../../src/game/rules';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { hookIncome } from '../../src/game/mech';
import { neighbors } from '../../src/game/grid';
import {
  DIET_COOLDOWN, DIET_ELECTORS, ELECTOR_LEVEL, LF_HEAL, LF_TURNS, REICH_TAX, aiEdict, dietCooldown, dietWhy, electors, freeCityIncome,
  hanseIncome, landfriedenLeft, levyKind, mech,
} from '../../src/game/mech/germany';
import type { City, GameState, Tile } from '../../src/game/types';

function setup(seed = 5) {
  const s = createGame({ seed, human: 'germany', opponents: ['japan', 'mongols'], mode: 'perfection' });
  const city = s.cities.find((c) => c.owner === 0 && c.capital)!;
  const cap: Tile = s.tiles[city.y * s.size + city.x];
  return { s, city, cap };
}

/** Clear the capital's land of improvements so the counts are exact. */
const land = (s: GameState, c: City) => s.tiles.filter((t) => t.owner === c.id && t.cityId === null);

/** Give Germany `n` more cities (copies of the capital's record, owning nothing) and set all their levels. */
function electorsOf(s: GameState, city: City, n: number, level = ELECTOR_LEVEL) {
  city.level = level;
  for (let i = 1; i < n; i++) s.cities.push({ ...city, id: 900 + i, capital: false, name: `Elector ${i}`, level, x: city.x, y: city.y });
}

test('Hanseatic League: +1★ per market, +1★ more beside a port', () => {
  const { s, city } = setup();
  for (const t of land(s, city)) t.improvement = null;
  assert.equal(hanseIncome(s, 0), 0);
  const before = hookIncome(s, 0);
  const tiles = land(s, city);
  const a = tiles[0];
  a.improvement = 'market';
  assert.equal(hanseIncome(s, 0), 1, 'a market inland pays +1★');
  assert.equal(hookIncome(s, 0), before + 1, 'the capital is no free city');
  const n = neighbors(s, a.x, a.y)[0];
  n.improvement = 'port';
  assert.equal(hanseIncome(s, 0), 2, 'beside a port it pays +2★');
  const far = tiles.find((t) => t !== a && t !== n && Math.max(Math.abs(t.x - n.x), Math.abs(t.y - n.y)) > 1)!;
  far.improvement = 'market';
  assert.equal(hanseIncome(s, 0), 3);
  assert.equal(hanseIncome(s, 1), 0, 'only Germany');
});

test('Free Imperial Cities: +1★ per non-capital city with a market', () => {
  const { s, city } = setup();
  for (const t of land(s, city)) t.improvement = null;
  const t = land(s, city)[0];
  t.improvement = 'market';
  assert.equal(freeCityIncome(s, 0), 0, 'the capital is not a free city');
  city.capital = false;
  assert.equal(freeCityIncome(s, 0), 1);
  land(s, city)[3].improvement = 'market';
  assert.equal(freeCityIncome(s, 0), 1, 'one star per city, not per market');
});

test('Electors: cities of level 4 or more', () => {
  const { s, city } = setup();
  city.level = ELECTOR_LEVEL - 1;
  assert.equal(electors(s, 0).length, 0);
  city.level = ELECTOR_LEVEL;
  assert.equal(electors(s, 0).length, 1);
  electorsOf(s, city, 3);
  s.cities.find((c) => c.id === 902)!.level = 2;
  assert.equal(electors(s, 0).length, 2);
  assert.equal(electors(s, 1).length, 0, 'only Germany');
});

test('the Diet: needs 3 Electors, is free, then a 10-turn cooldown', () => {
  const { s, city, cap } = setup();
  electorsOf(s, city, DIET_ELECTORS - 1);
  const acts = tileActions(s, 0, cap).filter((a) => a.id.startsWith('mech:diet:'));
  assert.deepEqual(acts.map((a) => a.id), ['mech:diet:0', 'mech:diet:1', 'mech:diet:2']);
  assert.ok(acts.every((a) => !a.enabled && a.cost === 0));
  assert.match(acts[1].reason!, /Electors/);
  assert.ok(!doAction(s, 0, cap, 'mech:diet:1'));
  electorsOf(s, city, DIET_ELECTORS);
  const stars = s.players[0].stars;
  assert.ok(tileActions(s, 0, cap).find((a) => a.id === 'mech:diet:1')!.enabled);
  assert.ok(doAction(s, 0, cap, 'mech:diet:1'));
  assert.equal(s.players[0].stars, stars + REICH_TAX * electors(s, 0).length, 'free, and the tax paid');
  assert.equal(dietCooldown(s, 0), DIET_COOLDOWN);
  const busy = tileActions(s, 0, cap).find((a) => a.id === 'mech:diet:2')!;
  assert.equal(busy.enabled, false);
  assert.match(busy.reason!, /sits again/);
  assert.ok(!doAction(s, 0, cap, 'mech:diet:2'));
  s.turn += DIET_COOLDOWN - 1;
  assert.ok(dietWhy(s, 0));
  s.turn += 1;
  assert.equal(dietWhy(s, 0), null);
  // only at the capital, only for Germany
  const other = s.tiles.find((t) => t.cityId === null && t.owner !== null)!;
  assert.equal(tileActions(s, 0, other).some((a) => a.id.startsWith('mech:diet')), false);
  const ec = s.cities.find((c) => c.owner === 1)!;
  assert.equal(tileActions(s, 1, s.tiles[ec.y * s.size + ec.x]).some((a) => a.id.startsWith('mech:diet')), false);
  JSON.parse(JSON.stringify(s));
});

test('Imperial Levy: a free veteran of the best melee kind, with no home city', () => {
  const { s, city, cap } = setup();
  electorsOf(s, city, DIET_ELECTORS);
  assert.equal(levyKind(s, 0), 'warrior');
  s.players[0].techs.push('riding', 'smithing');
  assert.equal(levyKind(s, 0), 'landsknecht', 'the Landsknecht stands in for the swordsman');
  const n = s.units.length, slots = city.units, stars = s.players[0].stars;
  assert.ok(doAction(s, 0, cap, 'mech:diet:0'));
  assert.equal(s.units.length, n + 1);
  const u = s.units[s.units.length - 1];
  assert.equal(u.kind, 'landsknecht');
  assert.ok(u.veteran);
  assert.equal(u.homeCity, null);
  assert.equal(city.units, slots, 'takes no unit slot');
  assert.equal(s.players[0].stars, stars, 'free');
  assert.ok(Math.max(Math.abs(u.x - city.x), Math.abs(u.y - city.y)) <= 1, 'on or beside the capital');
});

test('Landfrieden: +2 HP a turn inside the borders for 5 turns', () => {
  const { s, city, cap } = setup();
  electorsOf(s, city, DIET_ELECTORS);
  const home = spawnUnit(s, 'warrior', 0, city.x, city.y, null);
  const t0 = s.turn;
  assert.ok(doAction(s, 0, cap, 'mech:diet:2'));
  assert.equal(landfriedenLeft(s, 0), LF_TURNS);
  let heals = 0;
  for (let i = 1; i <= LF_TURNS + 2; i++) {
    s.turn = t0 + i;
    home.hp = 2;
    mech.turnStart!(s, 0);
    if (home.hp > 2) { assert.equal(home.hp, 2 + LF_HEAL); heals++; }
  }
  assert.equal(heals, LF_TURNS);
  assert.equal(landfriedenLeft(s, 0), 0);
  // not outside the borders
  s.turn = t0 + DIET_COOLDOWN;
  assert.ok(doAction(s, 0, cap, 'mech:diet:2'));
  const away = s.tiles.find((t) => t.owner === null && t.terrain !== 'ocean' && t.terrain !== 'shallow' && t.terrain !== 'mountain')!;
  const out = spawnUnit(s, 'warrior', 0, away.x, away.y, null);
  out.hp = 2;
  s.turn += 1;
  mech.turnStart!(s, 0);
  assert.equal(out.hp, 2);
});

test('AI: the Levy under threat, the Landfrieden with wounded, else the Tax; it calls the Diet', () => {
  const { s, city } = setup();
  electorsOf(s, city, DIET_ELECTORS);
  s.units = s.units.filter((u) => u.owner === 0);
  assert.equal(aiEdict(s, 0), 1);
  for (let i = 0; i < 3; i++) { const u = spawnUnit(s, 'warrior', 0, city.x, city.y, null); u.hp = 3; }
  assert.equal(aiEdict(s, 0), 2);
  const foe = spawnUnit(s, 'warrior', 1, city.x + 1, city.y, null);
  assert.equal(aiEdict(s, 0), 0);
  void foe;
  s.players[0].human = false;
  assert.ok(mech.ai!(s, 0));
  assert.equal(dietCooldown(s, 0), DIET_COOLDOWN);
  assert.equal(mech.ai!(s, 0), false, 'no second Diet in the cooldown');
});

test('20-turn all-AI game with Germany completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['germany', 'japan', 'mongols'], mode: 'perfection' });
  const pid = s.players.findIndex((p) => p.tribe === 'germany');
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 20 && guard++ < 1000) {
    aiTurn(s);
    endTurn(s);
  }
  assert.ok(s.turn >= 20 || s.over);
  assert.ok(pid >= 0);
  JSON.parse(JSON.stringify(s));
});

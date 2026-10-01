import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { attack, doAction, moveOptions, tileActions, veteranAt } from '../../src/game/rules';
import { dist, tileAt } from '../../src/game/grid';
import { STOCK_CAP, stockOf } from '../../src/game/goods';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { hookStat } from '../../src/game/mech';
import { COPPER_COST, COPPER_EVERY, COPPER_IRON, COPPER_STARS, WINTER_MOVE, copperIn, mech } from '../../src/game/mech/sweden';
import type { GameState, Tile, TribeId } from '../../src/game/types';

function setup(tribe: TribeId = 'sweden') {
  const s = createGame({ seed: 5, human: tribe, opponents: ['japan'], mapSize: 'huge', mode: 'perfection' });
  const me = s.players.findIndex((p) => p.tribe === tribe);
  for (const p of s.players) p.explored.fill(true);
  const cap = s.cities.find((c) => c.owner === me)!;
  s.players[me].stars = 100;
  // a clean slate around the capital: open fields, no units, no improvements
  for (const t of s.tiles) {
    if (Math.max(Math.abs(t.x - cap.x), Math.abs(t.y - cap.y)) > 5 || t.cityId !== null) continue;
    Object.assign(t, { terrain: 'field', resource: null, improvement: null, village: false, ruin: false });
  }
  s.units = s.units.filter((u) => Math.max(Math.abs(u.x - cap.x), Math.abs(u.y - cap.y)) > 6);
  const dx = cap.x < s.size / 2 ? 1 : -1, dy = cap.y < s.size / 2 ? 1 : -1;
  return { s, me, foe: 1 - me, cap, dx, dy };
}

const at = (s: GameState, x: number, y: number): Tile => tileAt(s, x, y)!;

test('Carolean Drill: Swedish units become veterans after 2 kills, everyone else after 3', () => {
  for (const [tribe, need] of [['sweden', 2], ['japan', 3], ['scotland', 3]] as const) {
    const { s, me, foe, cap, dx } = setup(tribe);
    assert.equal(veteranAt(s, me), need, tribe);
    const x = cap.x + dx * 3, y = cap.y;
    const u = spawnUnit(s, 'swordsman', me, x, y, null);
    u.veteranKills = need - 2;
    for (let k = 1; k <= 2; k++) {
      const e = spawnUnit(s, 'warrior', foe, u.x + dx, u.y, null);
      e.hp = 1;
      u.attacked = false; u.moved = false;
      assert.ok(attack(s, u, e), `${tribe} kill ${k}`);
      assert.equal(u.veteranKills, need - 2 + k);
      assert.equal(u.veteran, k === 2, `${tribe}: veteran after ${need - 2 + k} kills?`);
    }
  }
});

test('Winter March: +1 move starting on tundra or ice; ice is walkable', () => {
  const { s, me, cap, dx, dy } = setup();
  const x = cap.x + dx * 3, y = cap.y + dy * 3;
  const u = spawnUnit(s, 'warrior', me, x, y, null);
  u.moved = false; u.attacked = false;
  assert.ok(moveOptions(s, u).some((o) => dist(o.x, o.y, x, y) === 1), 'can move at all');
  const far = () => moveOptions(s, u).some((o) => dist(o.x, o.y, x, y) === 2);
  assert.equal(hookStat(s, u, 'move'), 0, 'not on fields');
  assert.equal(far(), false);
  at(s, x, y).terrain = 'tundra';
  assert.equal(hookStat(s, u, 'move'), WINTER_MOVE);
  assert.equal(far(), true, 'two steps from tundra');
  at(s, x, y).terrain = 'ice';
  assert.equal(hookStat(s, u, 'move'), WINTER_MOVE);
  assert.equal(far(), true, 'two steps from ice');
  // the tile it stands on counts, not where it goes
  at(s, x, y).terrain = 'field';
  at(s, x + dx, y).terrain = 'ice';
  assert.equal(hookStat(s, u, 'move'), 0);
  assert.ok(moveOptions(s, u).some((o) => o.x === x + dx && o.y === y), 'walks onto ice');
  // ships and other empires get nothing
  const { s: s2, me: j, cap: c2, dx: ex } = setup('japan');
  const w = spawnUnit(s2, 'warrior', j, c2.x + ex * 3, c2.y, null);
  at(s2, w.x, w.y).terrain = 'tundra';
  assert.equal(hookStat(s2, w, 'move'), 0);
});

test('Falun Copper: 3★ for +1 Iron and +3★, needs a mine, once every 5 turns, respects the cap', () => {
  const { s, me, cap, dx } = setup();
  const p = s.players[me];
  const capT = at(s, cap.x, cap.y);
  const find = () => tileActions(s, me, capT).find((a) => a.id === 'mech:copper');
  let a = find()!;
  assert.ok(a, 'offered in the city');
  assert.equal(a.cost, COPPER_COST);
  assert.equal(a.enabled, false, 'no mine yet');
  const mineT = at(s, cap.x + dx, cap.y);
  Object.assign(mineT, { terrain: 'mountain', improvement: 'mine', owner: cap.id });
  a = find()!;
  assert.ok(a.enabled, a.reason ?? "");
  stockOf(p).iron = 4;
  p.stars = 10;
  assert.ok(doAction(s, me, capT, 'mech:copper'));
  assert.equal(stockOf(p).iron, 4 + COPPER_IRON);
  assert.equal(p.stars, 10 - COPPER_COST + COPPER_STARS);
  assert.equal(copperIn(s, cap), COPPER_EVERY);
  assert.equal(find()!.enabled, false, 'cooling down');
  assert.equal(doAction(s, me, capT, 'mech:copper'), false);
  s.turn += COPPER_EVERY - 1;
  assert.equal(find()!.enabled, false);
  s.turn += 1;
  assert.ok(find()!.enabled);
  // a full stockpile blocks it; one short of full tops it up to the cap
  stockOf(p).iron = STOCK_CAP;
  assert.equal(find()!.enabled, false);
  assert.match(find()!.reason ?? '', /full/);
  stockOf(p).iron = STOCK_CAP - 1;
  assert.ok(doAction(s, me, capT, 'mech:copper'));
  assert.equal(stockOf(p).iron, STOCK_CAP);
  // not enough stars
  s.turn += COPPER_EVERY;
  stockOf(p).iron = 0;
  p.stars = COPPER_COST - 1;
  assert.equal(find()!.enabled, false);
  // other empires get no copper
  const { s: s2, me: j, cap: c2 } = setup('japan');
  assert.equal(tileActions(s2, j, at(s2, c2.x, c2.y)).some((x) => x.id === 'mech:copper'), false);
});

test('Falun Copper AI: works a ready mine city and pays for it', () => {
  const { s, me, cap, dx } = setup();
  const p = s.players[me];
  assert.equal(mech.ai!(s, me), false, 'no mine');
  Object.assign(at(s, cap.x + dx, cap.y), { terrain: 'mountain', improvement: 'mine', owner: cap.id });
  p.stars = COPPER_COST - 1;
  assert.equal(mech.ai!(s, me), false, 'too poor');
  p.stars = 5;
  stockOf(p).iron = 0;
  assert.ok(mech.ai!(s, me));
  assert.equal(p.stars, 5 - COPPER_COST + COPPER_STARS);
  assert.equal(stockOf(p).iron, COPPER_IRON);
  assert.equal(mech.ai!(s, me), false, 'cooling down');
});

test('20-turn all-AI game with Sweden completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['sweden', 'vikings', 'inuit'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 20 && guard++ < 1000) {
    aiTurn(s);
    endTurn(s);
  }
  assert.ok(s.turn >= 20 || s.over);
  JSON.parse(JSON.stringify(s));
});

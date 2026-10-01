import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { citiesOf, doAction, maxHp, tileActions } from '../../src/game/rules';
import { tileAt } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { hookIncome } from '../../src/game/mech';
import {
  GOLDEN_STARS, QVEVRI_BASE, QVEVRI_STEP, SUPRA_COOLDOWN, SUPRA_COST, SUPRA_HEAL, SUPRA_POP,
  goldenAge, goldenIncome, mech, qvevriCost, qvevriIncome, qvevriStars, qvevris, supraCooldown,
} from '../../src/game/mech/georgia';
import type { City, GameState, Tile } from '../../src/game/types';

function setup(diplomacy = false) {
  const s = createGame({ seed: 5, human: 'georgia', opponents: ['japan', 'rome'], mapSize: 'huge', mode: 'perfection', diplomacy });
  const me = s.players.findIndex((p) => p.tribe === 'georgia');
  for (const p of s.players) p.explored.fill(true);
  const cap = s.cities.find((c) => c.owner === me)!;
  cap.capital = true;
  s.players[me].stars = 100;
  // no strangers anywhere near, nor in the borders
  s.units = s.units.filter((u) => u.owner === me || Math.max(Math.abs(u.x - cap.x), Math.abs(u.y - cap.y)) > 6);
  s.units = s.units.filter((u) => { const t = tileAt(s, u.x, u.y)!; return u.owner === me || t.owner === null || s.cities.find((c) => c.id === t.owner)?.owner !== me; });
  for (const t of s.tiles) if (t.improvement === 'qvevri') t.improvement = null;
  const foes = s.players.filter((p) => p.id !== me && !p.neutral).map((p) => p.id);
  return { s, me, foe: foes[0], other: foes[1], cap };
}

const dirOf = (s: GameState, c: City) => ({ dx: c.x < s.size / 2 ? 1 : -1, dy: c.y < s.size / 2 ? 1 : -1 });

function plot(s: GameState, x: number, y: number, owner: number | null, terrain: Tile['terrain'] = 'field'): Tile {
  const t = tileAt(s, x, y)!;
  Object.assign(t, { terrain, resource: null, improvement: null, village: false, ruin: false, owner, data: undefined });
  s.units = s.units.filter((u) => !(u.x === x && u.y === y));
  return t;
}

const actOn = (s: GameState, me: number, t: Tile, id: string) => tileActions(s, me, t).find((a) => a.id === id);

test('Golden Age of Tamar: +1★ per city while no enemy is in the borders', () => {
  const { s, me, foe, other, cap } = setup(true);
  const { dx, dy } = dirOf(s, cap);
  const n = citiesOf(s, me).length;
  assert.ok(goldenAge(s, me));
  assert.equal(goldenIncome(s, me), GOLDEN_STARS * n);
  assert.equal(mech.income!(s, me), GOLDEN_STARS * n);
  // an enemy inside the borders breaks it
  const inside = plot(s, cap.x + dx, cap.y + dy, cap.id);
  const e = spawnUnit(s, 'warrior', foe, inside.x, inside.y, null);
  assert.ok(!goldenAge(s, me));
  assert.equal(goldenIncome(s, me), 0);
  // a treaty partner doesn't
  s.diplo!.pacts.push({ a: me, b: foe, kind: 'peace', since: s.turn } as never);
  assert.ok(goldenAge(s, me), 'peace partners may pass');
  // an enemy outside the borders doesn't
  s.units = s.units.filter((u) => u !== e);
  const out = plot(s, cap.x + dx * 6, cap.y + dy * 6, null);
  spawnUnit(s, 'warrior', other, out.x, out.y, null);
  assert.ok(goldenAge(s, me));
  // wild beasts and raiders (the neutral owner) don't count
  const wild = s.players.findIndex((p) => p.neutral);
  if (wild >= 0) {
    spawnUnit(s, 'warrior', wild, inside.x, inside.y, null);
    assert.ok(goldenAge(s, me), 'beasts are not an invasion');
  }
  // nobody else is paid
  assert.equal(mech.income!(s, foe), 0);
  // and it reaches the treasury through the hooks
  assert.equal(hookIncome(s, me) >= GOLDEN_STARS * n, true);
});

test('Qvevri: empty field in the borders, 4★ +1★ each, not adjacent; ages to 2★ and 3★', () => {
  const { s, me, foe, cap } = setup();
  const { dx, dy } = dirOf(s, cap);
  const a = plot(s, cap.x + dx, cap.y, cap.id);
  const act = actOn(s, me, a, 'mech:qvevri')!;
  assert.ok(act && act.enabled);
  assert.equal(act.cost, QVEVRI_BASE);
  assert.ok(doAction(s, me, a, 'mech:qvevri'));
  assert.equal(a.improvement, 'qvevri');
  assert.equal(a.data?.qvevri, s.turn);
  assert.equal(s.players[me].stars, 100 - QVEVRI_BASE);
  // not next to another
  const b = plot(s, cap.x + dx * 2, cap.y, cap.id);
  const nb = actOn(s, me, b, 'mech:qvevri')!;
  assert.ok(!nb.enabled && /close/.test(nb.reason ?? ''));
  // the second costs one more
  const c = plot(s, cap.x, cap.y + dy * 2, cap.id);
  assert.equal(qvevriCost(s, me), QVEVRI_BASE + QVEVRI_STEP);
  assert.equal(actOn(s, me, c, 'mech:qvevri')!.cost, QVEVRI_BASE + QVEVRI_STEP);
  assert.ok(doAction(s, me, c, 'mech:qvevri'));
  assert.equal(s.players[me].stars, 100 - 2 * QVEVRI_BASE - QVEVRI_STEP);
  assert.equal(qvevris(s, me).length, 2);
  // only on an empty field inside the borders
  const forest = plot(s, cap.x - dx, cap.y - dy, cap.id, 'forest');
  assert.equal(actOn(s, me, forest, 'mech:qvevri'), undefined);
  const res = plot(s, cap.x - dx, cap.y + dy * 2, cap.id);
  res.resource = 'fruit';
  assert.equal(actOn(s, me, res, 'mech:qvevri'), undefined);
  const outside = plot(s, cap.x + dx * 7, cap.y + dy * 7, null);
  assert.equal(actOn(s, me, outside, 'mech:qvevri'), undefined);
  assert.ok(!doAction(s, me, outside, 'mech:qvevri'));
  // other empires can't
  const foeCap = s.cities.find((k) => k.owner === foe)!;
  const fT = plot(s, foeCap.x + 1, foeCap.y, foeCap.id);
  assert.equal(actOn(s, foe, fT, 'mech:qvevri'), undefined);
  // ageing
  const base = goldenIncome(s, me);
  assert.equal(qvevriIncome(s, me), 2);
  assert.equal(mech.income!(s, me), base + 2);
  s.turn += 4;
  assert.equal(qvevriStars(s, a), 1);
  s.turn += 1;
  assert.equal(qvevriStars(s, a), 2);
  assert.equal(qvevriIncome(s, me), 4);
  s.turn += 5;
  assert.equal(qvevriStars(s, a), 3);
  assert.equal(qvevriIncome(s, me), 6);
  s.turn += 20;
  assert.equal(qvevriStars(s, a), 3, 'caps at aged wine');
  assert.equal(mech.income!(s, foe), 0);
  JSON.parse(JSON.stringify(s));
});

test('Supra: 3★ at the capital, heals 3 HP, +1 pop in cellar cities, cooldown 6', () => {
  const { s, me, cap } = setup();
  const { dx, dy } = dirOf(s, cap);
  const capT = tileAt(s, cap.x, cap.y)!;
  const w = spawnUnit(s, 'warrior', me, cap.x + dx, cap.y + dy, null);
  w.hp = maxHp(w) - 5;
  const near = spawnUnit(s, 'archer', me, cap.x - dx, cap.y, null);
  near.hp = maxHp(near) - 1;
  const act = actOn(s, me, capT, 'mech:supra')!;
  assert.ok(act.enabled);
  assert.equal(act.cost, SUPRA_COST);
  // without a qvevri the capital doesn't grow
  const lv = cap.level, pop = cap.pop;
  assert.ok(doAction(s, me, capT, 'mech:supra'));
  assert.equal(s.players[me].stars, 100 - SUPRA_COST);
  assert.equal(w.hp, maxHp(w) - 5 + SUPRA_HEAL);
  assert.equal(near.hp, maxHp(near), 'never above max');
  assert.equal(cap.level === lv && cap.pop === pop, true);
  // cooldown
  const cd = actOn(s, me, capT, 'mech:supra')!;
  assert.ok(!cd.enabled && /turn/.test(cd.reason ?? ''));
  assert.ok(!doAction(s, me, capT, 'mech:supra'));
  assert.equal(supraCooldown(s, me), SUPRA_COOLDOWN);
  s.turn += SUPRA_COOLDOWN;
  assert.equal(supraCooldown(s, me), 0);
  // with a qvevri in its borders the capital grows
  const q = plot(s, cap.x + dx, cap.y, cap.id);
  assert.ok(doAction(s, me, q, 'mech:qvevri'));
  const before = cap.level * 100 + cap.pop;
  assert.ok(doAction(s, me, capT, 'mech:supra'));
  assert.ok(cap.level * 100 + cap.pop > before, `grew +${SUPRA_POP}`);
  // only at the capital
  const second = s.cities.find((c) => c.owner === me && !c.capital);
  if (second) assert.equal(actOn(s, me, tileAt(s, second.x, second.y)!, 'mech:supra'), undefined);
});

test('AI buries qvevri and holds a supra', () => {
  const { s, me, cap } = setup();
  s.players[me].human = false;
  s.players[me].stars = 2;
  assert.equal(mech.ai!(s, me), false, 'too poor');
  s.players[me].stars = 30;
  let n = 0;
  while (mech.ai!(s, me) && n < 30) n++;
  assert.ok(qvevris(s, me).length >= 1);
  assert.ok(s.players[me].stars >= 3, 'keeps a reserve');
  // wounded army → supra
  const { dx, dy } = dirOf(s, cap);
  const u = spawnUnit(s, 'warrior', me, cap.x + dx, cap.y + dy, null);
  u.hp = 2;
  const u2 = spawnUnit(s, 'warrior', me, cap.x - dx, cap.y - dy, null);
  u2.hp = 2;
  s.players[me].stars = 10;
  assert.ok(mech.ai!(s, me));
  assert.ok(supraCooldown(s, me) > 0);
  assert.equal(u.hp, 2 + SUPRA_HEAL);
});

test('20-turn all-AI game with Georgia completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['georgia', 'zulu', 'japan'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 20 && guard++ < 1000) {
    aiTurn(s);
    endTurn(s);
  }
  assert.ok(s.turn >= 20 || s.over);
  const g = s.players.findIndex((p) => p.tribe === 'georgia');
  assert.ok(g >= 0);
  JSON.parse(JSON.stringify(s));
});

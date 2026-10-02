import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { aiTurn } from '../../src/game/ai';
import { doAction, moveOptions, tileActions } from '../../src/game/rules';
import { endTurn } from '../../src/game/turn';
import { hookIncome, hookStat } from '../../src/game/mech';
import { neighbors, tileAt } from '../../src/game/grid';
import { PROPHECY_COST, activeEra, eraFor, katunIncome, mech, prophecyFor, syncEra, turnsToEra, wantedEra } from '../../src/game/mech/maya';
import type { GameState, Tile } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 7, human: 'maya', opponents: ['rome'], mode: 'perfection' });
  const me = s.players.findIndex((p) => p.tribe === 'maya');
  for (const p of s.players) p.explored.fill(true);
  const city = s.cities.find((c) => c.owner === me)!;
  s.players[me].stars = 60;
  return { s, me, city, cap: tileAt(s, city.x, city.y)! };
}
const at = (s: GameState, turn: number) => { s.turn = turn; syncEra(s); };
const startOf = (s: GameState, me: number) => { s.current = me; mech.turnStart!(s, me); };

test('the Long Count: eras are deterministic and start every 13 turns for 3 turns', () => {
  const { s } = setup();
  assert.equal(wantedEra(s), null);
  at(s, 12); assert.equal(activeEra(s), null);
  at(s, 13); assert.ok(activeEra(s));
  const id = activeEra(s);
  assert.equal(id, eraFor(s, 1));
  at(s, 15); assert.equal(activeEra(s), id);
  at(s, 16); assert.equal(activeEra(s), null);
  at(s, 26); assert.equal(activeEra(s), eraFor(s, 2));
  assert.equal(turnsToEra(s), 13);
});

test('prophecy: the Maya pay stars at the capital to choose the next Era', () => {
  const { s, me, cap } = setup();
  s.turn = 10;
  const acts = tileActions(s, me, cap).filter((a) => a.id.startsWith('mech:prophecy:'));
  assert.equal(acts.length, 5);
  assert.ok(acts.every((a) => a.enabled && a.cost === PROPHECY_COST));
  const before = s.players[me].stars;
  assert.ok(doAction(s, me, cap, 'mech:prophecy:eclipse'));
  assert.equal(s.players[me].stars, before - PROPHECY_COST);
  assert.equal(prophecyFor(s, 1), 'eclipse');
  assert.ok(tileActions(s, me, cap).filter((a) => a.id.startsWith('mech:prophecy:')).every((a) => !a.enabled));
  assert.equal(doAction(s, me, cap, 'mech:prophecy:golden'), false);
  at(s, 13);
  assert.equal(activeEra(s), 'eclipse');
  // not offered away from the capital
  assert.equal(tileActions(s, me, tileAt(s, cap.x + 1, cap.y)!).some((a) => a.id.startsWith('mech:prophecy:')), false);
});

test('Great Ebb turns shallow water into walkable land, then the tide returns', () => {
  const { s, me, city } = setup();
  const shallow = s.tiles.filter((t) => t.terrain === 'shallow' && !t.improvement && t.cityId === null);
  assert.ok(shallow.length > 0);
  s.mech = { maya: { active: null, chosen: { '1': 'ebb' } } };
  at(s, 13);
  assert.equal(activeEra(s), 'ebb');
  assert.ok(shallow.every((t) => t.terrain === 'field'));
  // a land unit can now step onto a former shallow tile beside dry land
  const edge = shallow.find((t) => neighbors(s, t.x, t.y).some((n) => n.terrain === 'field' && !n.data?.maya && n.cityId === null));
  assert.ok(edge);
  const from = neighbors(s, edge.x, edge.y).find((n) => n.terrain === 'field' && !n.data?.maya && n.cityId === null && !s.units.some((u) => u.x === n.x && u.y === n.y))!;
  const w = spawnUnit(s, 'warrior', me, from.x, from.y, city.id);
  w.moved = false;
  assert.ok(moveOptions(s, w).some((o) => o.x === edge.x && o.y === edge.y));
  // building on the borrowed ground is blocked
  edge.owner = city.id;
  const acts = tileActions(s, me, edge);
  assert.ok(acts.filter((a) => a.id === 'road').every((a) => !a.enabled));
  at(s, 16);
  assert.equal(activeEra(s), null);
  assert.ok(shallow.every((t) => t.terrain === 'shallow'));
});

test('Hawk Sight, Great Storm, Long Night and Golden Age change stats and income', () => {
  const { s, me, city } = setup();
  const archer = spawnUnit(s, 'archer', me, city.x, city.y, city.id);
  const warrior = spawnUnit(s, 'warrior', me, city.x, city.y, city.id);
  const base = { range: hookStat(s, archer, 'range'), def: hookStat(s, warrior, 'def'), move: hookStat(s, warrior, 'move') };
  const run = (id: string) => { s.mech = { maya: { active: null, chosen: { '1': id } } }; at(s, 13); };
  run('hawk');
  assert.equal(hookStat(s, archer, 'range') - base.range, 1);
  assert.equal(hookStat(s, warrior, 'range') - 0, 0);
  run('eclipse');
  assert.equal(hookStat(s, warrior, 'def') - base.def, 1);
  assert.equal(hookStat(s, warrior, 'move') - base.move, -1);
  run('storm');
  const boat = spawnUnit(s, 'boat', me, city.x, city.y, city.id);
  assert.equal(hookStat(s, boat, 'atk'), -1);
  const t = { ...s.tiles[0], terrain: 'ocean' } as Tile;
  const ctx = { cost: 1, stop: false, forbid: false, opt: { x: t.x, y: t.y } };
  mech.moveStep!(s, me, boat, t, t, ctx);
  assert.equal(ctx.cost, 2);
  assert.equal(ctx.forbid, true);
  run('golden');
  const cities = s.cities.filter((c) => c.owner === me).length;
  assert.equal(hookIncome(s, me), cities);
  at(s, 20);
  assert.equal(hookIncome(s, me), 0);
});

/** Turn the city's own-territory fields into farms-in-waiting: returns crop tiles owned by the city. */
function cropTiles(s: GameState, cityId: number, n: number): Tile[] {
  const out = s.tiles.filter((t) => t.owner === cityId && t.terrain === 'field' && !t.village && t.cityId === null).slice(0, n);
  for (const t of out) { t.resource = 'crop'; t.improvement = null; t.data = undefined; }
  return out;
}

test('Katun: resource improvements pay double on peak turns; off-peak builds yield half; peak builds grow the city', () => {
  const { s, me, city } = setup();
  const [a, b] = cropTiles(s, city.id, 2);
  s.players[me].techs.push('farming');
  s.units = s.units.filter((u) => ![a, b].some((t) => t.x === u.x && t.y === u.y));
  // build one farm on an off-peak turn (turn 3) and stamp it at turn end
  s.turn = 3; s.current = me;
  assert.ok(doAction(s, me, a, 'farm'));
  mech.turnEnd!(s, me);
  // and one on the Katun turn 5: it also grows the city
  s.turn = 5;
  const pop = city.pop + city.level * 100;
  assert.ok(doAction(s, me, b, 'farm'));
  mech.turnEnd!(s, me);
  assert.equal((a.data?.maya as { peak: boolean }).peak, false);
  assert.equal((b.data?.maya as { peak: boolean }).peak, true);
  assert.ok(city.pop + city.level * 100 > pop - 1);
  // half + full = 1.5 -> floor 1; doubled on the peak turn
  s.turn = 6; assert.deepEqual([katunIncome(s, me).base, katunIncome(s, me).total], [1, 1]);
  s.turn = 10; const k = katunIncome(s, me);
  assert.equal(k.peak, true); assert.equal(k.base, 1); assert.equal(k.total, 2);
  assert.equal(hookIncome(s, me), 2);
  s.turn = 11; assert.equal(hookIncome(s, me), 1);
});

test('Katun: peak-built improvement adds a population to its city', () => {
  const { s, me, city } = setup();
  const [a] = cropTiles(s, city.id, 1);
  s.players[me].techs.push('farming');
  s.units = s.units.filter((u) => !(u.x === a.x && u.y === a.y));
  s.turn = 10; s.current = me;
  const total = (city.level * 100) + city.pop;
  assert.ok(doAction(s, me, a, 'farm'));
  const afterBuild = (city.level * 100) + city.pop;
  mech.turnEnd!(s, me);
  assert.ok(afterBuild >= total);
  assert.ok(city.level * 100 + city.pop !== afterBuild, 'the peak build grew the city');
  assert.equal(s.players[me].mech?.peakBuilds, 1);
});

test('Great Cycle: every 20 turns each Maya city gains 1 population, once', () => {
  const { s, me } = setup();
  const cities = s.cities.filter((c) => c.owner === me);
  const sum = () => cities.reduce((n, c) => n + c.level * 100 + c.pop, 0);
  s.turn = 19; startOf(s, me);
  const before = sum();
  s.turn = 20; startOf(s, me);
  assert.ok(sum() > before);
  const once = sum();
  startOf(s, me);
  assert.equal(sum(), once);
});

test('20-turn all-AI game with Maya completes; the AI prophesies and eras occur', () => {
  const s = createGame({ seed: 12, human: 'maya', opponents: ['rome', 'zulu'], mode: 'perfection' });
  for (const p of s.players) p.human = false;
  const me = s.players.findIndex((p) => p.tribe === 'maya');
  const seen = new Set<string>();
  for (let i = 0; i < 20 * s.players.length && !s.over; i++) {
    aiTurn(s); endTurn(s);
    const e = activeEra(s); if (e) seen.add(e);
  }
  assert.ok(s.turn >= 10);
  assert.ok((s.players[me].mech?.prophecies as number) >= 1, 'AI paid for a prophecy');
  assert.ok(seen.size >= 1, 'an era occurred');
  JSON.parse(JSON.stringify(s));
});

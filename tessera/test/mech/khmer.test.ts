import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { aiTurn } from '../../src/game/ai';
import { doAction, moveOptions, tileActions } from '../../src/game/rules';
import { endTurn } from '../../src/game/turn';
import { dist, neighbors, tileAt } from '../../src/game/grid';
import { CITY_CAP, floodLeft, hydraulics, isBaray, mech } from '../../src/game/mech/khmer';
import type { GameState, Tile } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 7, human: 'khmer', opponents: ['japan'], mode: 'perfection' });
  const me = s.players.findIndex((p) => p.tribe === 'khmer');
  for (const p of s.players) p.explored.fill(true);
  const city = s.cities.find((c) => c.owner === me)!;
  s.players[me].stars = 50;
  return { s, me, city };
}

/**
 * Carve out a clean test site: a centre tile with a 5x5 patch of plain own-territory fields around it (the test edits the
 * map so the site does not depend on the generated terrain).
 */
function pad(s: GameState, cityId: number): Tile {
  const city = s.cities.find((c) => c.id === cityId)!;
  const spots = s.tiles.filter((c) => dist(c.x, c.y, city.x, city.y) >= 3 && dist(c.x, c.y, city.x, city.y) <= 5
    && c.x >= 2 && c.y >= 2 && c.x < s.size - 2 && c.y < s.size - 2
    && neighbors(s, c.x, c.y, 2).concat(c).every((n) => n.cityId === null));
  const t = spots[0];
  assert.ok(t, 'a site near the city');
  for (const n of neighbors(s, t.x, t.y, 2).concat(t)) {
    n.terrain = 'field'; n.resource = null; n.improvement = null; n.owner = cityId; n.village = false; n.data = undefined;
  }
  return t;
}
const clear = (s: GameState, ts: Tile[]) => { s.units = s.units.filter((u) => !ts.some((t) => t.x === u.x && t.y === u.y)); };
const nextKhmerTurn = (s: GameState, me: number) => { do endTurn(s); while (s.current !== me); };

test('barays and dams are built through the tile menu; dams need a baray beside them', () => {
  const { s, me, city } = setup();
  const t = pad(s, city.id);
  clear(s, neighbors(s, t.x, t.y, 2).concat(t));
  const damWithout = tileActions(s, me, t).find((a) => a.id === 'mech:dam');
  assert.equal(damWithout?.enabled, false);
  assert.ok(doAction(s, me, t, 'mech:baray'));
  assert.equal(t.improvement, 'baray');
  const d = neighbors(s, t.x, t.y)[0];
  assert.ok(tileActions(s, me, d).find((a) => a.id === 'mech:dam')?.enabled);
  assert.ok(doAction(s, me, d, 'mech:dam'));
  assert.equal(d.improvement, 'dam');
  assert.ok(tileActions(s, me, d).some((a) => a.id === 'mech:flood'));
});

test('blowing a dam floods radius 2 for 2 turns, washes away enemies and spares Khmer units', () => {
  const { s, me, city } = setup();
  const b = pad(s, city.id);
  clear(s, neighbors(s, b.x, b.y, 2).concat(b));
  b.improvement = 'baray'; b.data = { khmer: me };
  const dam = tileAt(s, b.x + 1, b.y)!;
  dam.improvement = 'dam'; dam.data = { khmer: me };
  const ft = tileAt(s, b.x + 2, b.y + 2)!, ft2 = tileAt(s, b.x - 2, b.y - 1)!, own = tileAt(s, b.x, b.y + 2)!;
  const foe = spawnUnit(s, 'warrior', 1 - me, ft.x, ft.y, null);
  const siege = spawnUnit(s, 'catapult', 1 - me, ft2.x, ft2.y, null);
  const mine = spawnUnit(s, 'warrior', me, own.x, own.y, null);
  const far = tileAt(s, b.x + 4, b.y)!;
  const before = far.terrain;
  s.players[me].stars = 5;
  assert.ok(doAction(s, me, dam, 'mech:flood'));
  assert.equal(s.players[me].stars, 4);
  assert.equal(ft.terrain, 'shallow');
  assert.equal(far.terrain, before, 'outside the radius nothing floods');
  assert.equal(dam.improvement, null, 'the dam is spent');
  assert.ok(!s.units.includes(siege) && !s.units.includes(foe), 'enemy soldiers and siege are swept away');
  assert.ok(s.units.includes(mine) && own.terrain === 'field', 'Khmer unit spared and dry');
  assert.equal(floodLeft(ft), 2);
  s.current = me;
  nextKhmerTurn(s, me);
  assert.equal(ft.terrain, 'shallow');
  assert.equal(floodLeft(ft), 1);
  nextKhmerTurn(s, me);
  assert.equal(ft.terrain, 'field');
  assert.equal(ft.data?.flood, undefined);
});

test('a flooded tile cannot be walked into', () => {
  const { s, me, city } = setup();
  const b = pad(s, city.id);
  clear(s, neighbors(s, b.x, b.y, 3).concat(b));
  b.improvement = 'baray'; b.data = { khmer: me };
  const dam = tileAt(s, b.x + 1, b.y)!;
  dam.improvement = 'dam'; dam.data = { khmer: me };
  const t = tileAt(s, b.x + 2, b.y + 2)!;
  const u = spawnUnit(s, 'warrior', 1 - me, b.x + 3, b.y + 3, null);
  u.moved = false; u.attacked = false;
  assert.ok(moveOptions(s, u).some((m) => m.x === t.x && m.y === t.y), 'walkable before');
  doAction(s, me, dam, 'mech:flood');
  assert.ok(!moveOptions(s, u).some((m) => m.x === t.x && m.y === t.y), 'blocked by water after');
});

test('hydraulics: touching resources pay, canals compound, the city cap holds', () => {
  const { s, me, city } = setup();
  const base = hydraulics(s, city).total;
  const t = pad(s, city.id);
  const ns = neighbors(s, t.x, t.y);
  ns[0].resource = 'crop'; ns[1].resource = 'fruit';
  t.improvement = 'baray'; t.data = { khmer: me };
  const one = hydraulics(s, city);
  assert.equal(one.total - base, 2, '+1 per touched resource tile');
  // a second baray linked to the first: a two-baray network earns x1.5 on what both touch
  const other = ns.find((n) => !n.resource)!;
  other.improvement = 'baray'; other.data = { khmer: me };
  assert.ok(hydraulics(s, city).canals > one.canals, 'linked barays earn more');
  // saturate the neighbourhood: the city total stops at the cap
  for (const n of neighbors(s, t.x, t.y, 2)) if (!n.improvement && n.cityId === null) n.resource = 'animal';
  const capped = hydraulics(s, city);
  assert.equal(capped.capped, true);
  assert.equal(capped.total, CITY_CAP);
  assert.ok(mech.income!(s, me) >= CITY_CAP);
});

test('AI Khmer digs a baray next to resources', () => {
  const { s, me, city } = setup();
  s.players[me].human = false;
  const t = pad(s, city.id);
  for (const n of neighbors(s, t.x, t.y).slice(0, 4)) n.resource = 'fruit';
  s.players[me].stars = 30;
  s.current = me;
  aiTurn(s, 1);
  assert.ok(s.tiles.some((x) => isBaray(x) && x.owner === city.id));
});

test('AI Khmer blows a dam when enemies stand in the flood zone', () => {
  const { s, me, city } = setup();
  s.players[me].human = false;
  const b = pad(s, city.id);
  clear(s, neighbors(s, b.x, b.y, 2).concat(b));
  b.improvement = 'baray'; b.data = { khmer: me };
  const dam = tileAt(s, b.x + 1, b.y)!;
  dam.improvement = 'dam'; dam.data = { khmer: me };
  const zoneT = tileAt(s, b.x + 2, b.y + 2)!;
  const foe = spawnUnit(s, 'warrior', 1 - me, zoneT.x, zoneT.y, null);
  s.players[me].stars = 3;
  s.current = me;
  aiTurn(s, 1);
  assert.ok(!s.units.includes(foe), 'the AI drowned the intruder');
  assert.equal(floodLeft(zoneT), 2);
});

test('20-turn all-AI game with Khmer completes', () => {
  const s = createGame({ seed: 11, human: 'khmer', opponents: ['japan', 'zulu'], mode: 'perfection' });
  for (const p of s.players) p.human = false;
  for (let i = 0; i < 20 * s.players.length && !s.over; i++) { aiTurn(s); endTurn(s); }
  assert.ok(s.turn >= 10);
  assert.ok(s.tiles.some((t) => isBaray(t)), 'the AI dug barays');
  JSON.parse(JSON.stringify(s));
});

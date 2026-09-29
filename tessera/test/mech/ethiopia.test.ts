import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { doAction, tileActions } from '../../src/game/rules';
import { tileAt } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { GRID_DAMAGE, RAY_DAMAGE, RAY_CAP, TARIFF_CAP, STELE_COST, fireSpires, gridLinks, isStele, mech, tariff } from '../../src/game/mech/ethiopia';
import type { GameState, Tile } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 5, human: 'ethiopia', opponents: ['japan'], mode: 'perfection' });
  const city = s.cities.find((c) => c.owner === 0)!;
  return { s, city };
}

/** Make a clear row of own-territory field tiles. */
function row(s: GameState, owner: number, x0: number, y: number, n: number): Tile[] {
  const cid = s.cities.find((c) => c.owner === owner)!.id;
  const out: Tile[] = [];
  for (let i = 0; i < n; i++) {
    const t = tileAt(s, x0 + i, y)!;
    t.terrain = 'field'; t.resource = null; t.improvement = null; t.cityId = null; t.owner = cid; delete t.data;
    s.units = s.units.filter((e) => !(e.x === t.x && e.y === t.y));
    out.push(t);
  }
  return out;
}

test('a stele can be raised on own land and rays enemies within 3 tiles', () => {
  const { s } = setup();
  const r = row(s, 0, 1, 1, 9);
  s.players[0].stars = 20;
  assert.ok(tileActions(s, 0, r[0]).some((a) => a.id === 'mech:stele' && a.enabled));
  assert.ok(doAction(s, 0, r[0], 'mech:stele'));
  assert.equal(s.players[0].stars, 20 - STELE_COST);
  assert.ok(isStele(r[0]));
  const near = spawnUnit(s, 'warrior', 1, r[3].x, 1, null);
  const far = spawnUnit(s, 'warrior', 1, r[5].x, 1, null);
  const [hn, hf] = [near.hp, far.hp];
  mech.turnEnd!(s, 0);
  assert.equal(near.hp, hn - RAY_DAMAGE);
  assert.equal(far.hp, hf);
  JSON.parse(JSON.stringify(s));
});

test('linked stelae burn enemies on the beam, mountains break the link', () => {
  const { s } = setup();
  const r = row(s, 0, 1, 2, 9);
  for (const i of [0, 6]) { r[i].improvement = 'stele'; r[i].data = { stele: 0 }; }
  assert.equal(gridLinks(s, 0).length, 1);
  const e = spawnUnit(s, 'warrior', 1, r[3].x, 2, null); // within ray range of both steles, and on the beam
  e.hp = 30;
  fireSpires(s, 0);
  assert.equal(e.hp, 30 - RAY_CAP - GRID_DAMAGE);
  r[3].terrain = 'mountain';
  assert.equal(gridLinks(s, 0).length, 0);
});

test('tariffs pay for foreign units near the border and are capped', () => {
  const { s, city } = setup();
  s.players[0].mech = { seen: [] };
  s.units = s.units.filter((u) => u.owner === 0);
  assert.equal(tariff(s, 0), 0);
  const t = s.tiles.find((x) => x.owner === city.id && !x.cityId)!;
  spawnUnit(s, 'warrior', 1, t.x, t.y, null);
  assert.ok(tariff(s, 0) >= 1);
  for (let i = 0; i < 12; i++) spawnUnit(s, 'warrior', 1, t.x, t.y, null);
  assert.equal(tariff(s, 0), TARIFF_CAP);
  JSON.parse(JSON.stringify(s));
});

test('choke points pay double and passers-by are remembered', () => {
  const { s, city } = setup();
  s.units = s.units.filter((u) => u.owner === 0);
  const own = s.tiles.filter((x) => x.owner === city.id && !x.cityId);
  const c = own[0];
  for (const n of s.tiles.filter((x) => Math.max(Math.abs(x.x - c.x), Math.abs(x.y - c.y)) === 1)) n.terrain = 'field';
  s.players[0].mech = { seen: [] };
  spawnUnit(s, 'warrior', 1, c.x, c.y, null);
  const open = tariff(s, 0);
  for (const n of s.tiles.filter((x) => Math.max(Math.abs(x.x - c.x), Math.abs(x.y - c.y)) === 1 && !x.cityId && !(x.x === c.x && x.y === c.y))) n.terrain = 'mountain';
  assert.ok(tariff(s, 0) >= open);
  s.units = s.units.filter((u) => u.owner === 0);
  s.players[0].mech = { seen: [99999, 99998] };
  assert.equal(tariff(s, 0), 1); // two passers-by: 2 points, 1 star
});

test('income hook feeds startTurn and resets the traveller record', () => {
  const { s } = setup();
  s.players[0].mech = { seen: [1, 2, 3, 4] };
  mech.turnStart!(s, 0);
  assert.deepEqual((s.players[0].mech as { seen: number[] }).seen, []);
});

test('AI raises a stele when enemies are near', () => {
  const { s, city } = setup();
  s.players[0].stars = 30;
  const t = s.tiles.find((x) => x.owner === city.id && !x.cityId && x.terrain !== 'mountain' && x.terrain !== 'shallow' && x.terrain !== 'ocean' && !x.improvement)!;
  spawnUnit(s, 'warrior', 1, t.x, t.y, null);
  assert.ok(mech.ai!(s, 0));
  assert.ok(s.tiles.some(isStele));
});

test('20-turn all-AI game with Ethiopia completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['ethiopia', 'japan', 'mongols'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 20 && guard++ < 1000) { aiTurn(s); endTurn(s); }
  assert.ok(s.turn >= 20 || s.over);
});

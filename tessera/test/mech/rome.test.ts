import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { aiTurn } from '../../src/game/ai';
import { doAction, moveOptions, moveUnit, previewCombat, tileActions } from '../../src/game/rules';
import { endTurn } from '../../src/game/turn';
import { isLand, tileAt } from '../../src/game/grid';
import type { GameState, Unit } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 7, human: 'rome', opponents: ['japan'], mode: 'perfection' });
  const me = s.players.findIndex((p) => p.tribe === 'rome');
  const u = s.units.find((x) => x.owner === me && x.kind === 'legionary') ?? s.units.find((x) => x.owner === me)!;
  for (const p of s.players) p.explored.fill(true);
  for (const x of s.units) { x.moved = false; x.attacked = false; }
  return { s, me, u };
}

const free = (s: GameState, x: number, y: number) => {
  const t = tileAt(s, x, y)!;
  return isLand(t) && t.terrain !== 'mountain' && t.cityId === null && !t.road;
};

function march(s: GameState, u: Unit) {
  const o = moveOptions(s, u).find((m) => free(s, m.x, m.y));
  assert.ok(o, 'a free tile to march to');
  assert.ok(moveUnit(s, u, o.x, o.y));
  return tileAt(s, o.x, o.y)!;
}

test('Roman soldiers pave the tile they end a move on', () => {
  const { s, u } = setup();
  const t = march(s, u);
  assert.equal(t.road, false); // laid when the game next looks at the unit
  tileActions(s, u.owner, t);
  assert.equal(t.road, true);
});

test('roads are also laid at turn end', () => {
  const { s, u } = setup();
  const t = march(s, u);
  endTurn(s);
  assert.equal(t.road, true);
});

test('a unit on a road can fortify; the fort gives defence and lasts only while it stays', () => {
  const { s, me, u } = setup();
  const t = march(s, u);
  s.players[me].stars = 5;
  assert.ok(tileActions(s, me, t).find((a) => a.id === 'mech:castra')?.enabled);
  assert.ok(doAction(s, me, t, 'mech:castra'));
  assert.equal(s.players[me].stars, 4);
  assert.equal(t.improvement, 'fort');
  assert.equal(u.fortified, true);
  assert.equal(tileActions(s, me, t).some((a) => a.id === 'mech:castra'), false); // already dug in

  const foe = spawnUnit(s, 'warrior', 1 - me, u.x, u.y, null);
  const fortified = previewCombat(s, foe, u).dmg;
  u.fortified = false;
  const open = previewCombat(s, foe, u).dmg;
  u.fortified = true;
  assert.ok(fortified < open, 'the fort cuts the damage taken');
  s.units.splice(s.units.indexOf(foe), 1);

  // walk away: the fort is dismantled, the road stays
  u.moved = false;
  const dest = moveOptions(s, u).find((m) => free(s, m.x, m.y))!;
  moveUnit(s, u, dest.x, dest.y);
  s.current = me;
  endTurn(s);
  assert.equal(t.improvement, null);
  assert.equal(t.data?.castra, undefined);
  assert.equal(u.fortified, false);
  assert.equal(t.road, true);
});

test('cannot fortify off-road or as another empire; fort dies with its unit', () => {
  const { s, me, u } = setup();
  s.players[me].stars = 5;
  const off = moveOptions(s, u).find((m) => free(s, m.x, m.y))!;
  assert.equal(doAction(s, me, tileAt(s, off.x, off.y)!, 'mech:castra'), false);
  const foe = s.units.find((x) => x.owner !== me)!;
  assert.equal(tileActions(s, foe.owner, tileAt(s, foe.x, foe.y)!).some((a) => a.id.startsWith('mech:')), false);
  const t = march(s, u);
  assert.ok(doAction(s, me, t, 'mech:castra'));
  s.units.splice(s.units.indexOf(u), 1);
  endTurn(s);
  assert.equal(t.improvement, null);
});

test('AI Rome digs in when an enemy is near', () => {
  const { s, me, u } = setup();
  s.players[me].human = false;
  s.players[me].stars = 5;
  const t = march(s, u);
  const foe = spawnUnit(s, 'warrior', 1 - me, u.x, u.y, null);
  const spot = [[2, 0], [-2, 0], [0, 2], [0, -2]].map(([dx, dy]) => tileAt(s, u.x + dx, u.y + dy)).find((x) => x && isLand(x) && !s.units.some((e) => e.x === x.x && e.y === x.y))!;
  foe.x = spot.x; foe.y = spot.y;
  s.current = me;
  aiTurn(s, 1);
  assert.equal(t.improvement, 'fort');
  assert.equal(u.fortified, true);
});

test('20-turn all-AI game with Rome completes', () => {
  const s = createGame({ seed: 11, human: 'rome', opponents: ['japan', 'zulu'], mode: 'perfection' });
  for (const p of s.players) p.human = false;
  for (let i = 0; i < 20 * s.players.length && !s.over; i++) { aiTurn(s); endTurn(s); }
  assert.ok(s.turn >= 10);
  assert.ok(s.tiles.some((t) => t.road), 'roads exist');
  JSON.parse(JSON.stringify(s));
});

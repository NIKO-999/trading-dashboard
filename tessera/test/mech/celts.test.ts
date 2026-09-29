import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { aiTurn } from '../../src/game/ai';
import { doAction, moveOptions, moveUnit, tileActions } from '../../src/game/rules';
import { endTurn } from '../../src/game/turn';
import { dist, neighbors, tileAt } from '../../src/game/grid';
import { counter, groveCount, isGrove, vowIncome, vowStars } from '../../src/game/mech/celts';
import type { GameState, Tile } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 7, human: 'celts', opponents: ['japan'], mode: 'perfection' });
  const me = s.players.findIndex((p) => p.tribe === 'celts');
  for (const p of s.players) p.explored.fill(true);
  const city = s.cities.find((c) => c.owner === me)!;
  s.players[me].stars = 50;
  s.players[me].techs.push('forestry');
  return { s, me, city };
}

/** A clean 5x5 patch of own fields around a centre tile away from every city. */
function pad(s: GameState, cityId: number): Tile {
  const city = s.cities.find((c) => c.id === cityId)!;
  const t = s.tiles.find((c) => dist(c.x, c.y, city.x, city.y) >= 3 && dist(c.x, c.y, city.x, city.y) <= 5
    && c.x >= 2 && c.y >= 2 && c.x < s.size - 2 && c.y < s.size - 2
    && neighbors(s, c.x, c.y, 2).concat(c).every((n) => n.cityId === null))!;
  assert.ok(t);
  for (const n of neighbors(s, t.x, t.y, 2).concat(t)) {
    n.terrain = 'field'; n.resource = null; n.improvement = null; n.owner = cityId; n.village = false; n.ruin = false; n.road = false; n.data = undefined;
  }
  s.units = s.units.filter((u) => dist(u.x, u.y, t.x, t.y) > 3);
  return t;
}
const nextTurnOf = (s: GameState, pid: number) => { do endTurn(s); while (s.current !== pid); };

test('groves are planted through the tile menu on empty forest, and forest cannot be cleared or lumbered', () => {
  const { s, me, city } = setup();
  const t = pad(s, city.id);
  t.terrain = 'forest';
  const acts = tileActions(s, me, t);
  assert.equal(acts.find((a) => a.id === 'mech:grove')?.enabled, true);
  for (const id of ['clear', 'lumber']) {
    const a = acts.find((x) => x.id === id);
    assert.ok(a && !a.enabled, `${id} is blocked`);
    assert.match(a!.reason ?? '', /Sacred Grove Vow/);
    assert.equal(doAction(s, me, t, id), false);
  }
  assert.equal(tileActions(s, me, neighbors(s, t.x, t.y)[0]).some((a) => a.id === 'mech:grove'), false, 'not on a field');
  const before = s.players[me].stars;
  assert.ok(doAction(s, me, t, 'mech:grove'));
  assert.equal(s.players[me].stars, before - 4);
  assert.ok(isGrove(t));
  assert.equal(counter(s, me, 'planted'), 1);
});

test('a grove spreads forest onto adjacent fields over time', () => {
  const { s, me, city } = setup();
  const t = pad(s, city.id);
  t.terrain = 'forest';
  doAction(s, me, t, 'mech:grove');
  const ring = neighbors(s, t.x, t.y);
  for (let i = 0; i < 3; i++) nextTurnOf(s, me);
  const grown = ring.filter((n) => n.terrain === 'forest');
  assert.equal(grown.length, 1);
  assert.equal(grown[0].data?.grown, true);
  assert.equal(counter(s, me, 'grown'), 1);
  for (let i = 0; i < 6; i++) nextTurnOf(s, me);
  assert.equal(ring.filter((n) => n.terrain === 'forest').length, 3);
});

test('an enemy entering grown forest is rooted for its next turn only', () => {
  const { s, me, city } = setup();
  const t = pad(s, city.id);
  t.terrain = 'forest';
  doAction(s, me, t, 'mech:grove');
  const trap = tileAt(s, t.x + 1, t.y)!;
  trap.terrain = 'forest'; trap.data = { ley: me, grown: true };
  const foe = 1 - me;
  const u = spawnUnit(s, 'warrior', foe, t.x + 2, t.y, null);
  s.current = foe;
  u.moved = false; u.attacked = false;
  assert.ok(moveOptions(s, u).some((o) => o.x === trap.x && o.y === trap.y));
  assert.ok(moveUnit(s, u, trap.x, trap.y));
  assert.equal(counter(s, me, 'rooted'), 1);
  do endTurn(s); while (s.current !== foe);
  assert.equal(u.moved, false);
  assert.equal(moveOptions(s, u).length, 0, 'entangled: cannot move');
  do endTurn(s); while (s.current !== foe);
  assert.ok(moveOptions(s, u).length > 0, 'free again a turn later');
});

test('Grove Vow: forests beside a grove pay stars (capped) and slowly grow the city', () => {
  const { s, me, city } = setup();
  const t = pad(s, city.id);
  t.terrain = 'forest'; t.improvement = 'grove'; t.data = { ley: me, grow: 0 };
  const ring = neighbors(s, t.x, t.y);
  assert.equal(vowStars(s, city), 0);
  ring[0].terrain = 'forest'; ring[1].terrain = 'forest';
  const base = vowIncome(s, me);
  assert.equal(base, 2);
  for (const n of ring.slice(2, 7)) n.terrain = 'forest';
  assert.equal(vowIncome(s, me), 4, 'capped per city');
  // population: 4 forests -> +1 pop every 2 turns
  const total = () => city.level * 100 + city.pop;
  const t0 = total();
  for (let i = 0; i < 4; i++) nextTurnOf(s, me);
  assert.ok(total() > t0, 'the city grew');
});

test('AI Celts plants groves; a 20-turn all-AI game completes and exercises both layers', () => {
  const s = createGame({ seed: 11, human: 'celts', opponents: ['japan', 'zulu'], mode: 'perfection' });
  for (const p of s.players) p.human = false;
  const me = s.players.findIndex((p) => p.tribe === 'celts');
  for (let i = 0; i < 20 * s.players.length && !s.over; i++) { aiTurn(s); endTurn(s); }
  assert.ok(s.turn >= 10);
  assert.ok(counter(s, me, 'planted') > 0, 'the AI planted groves');
  assert.ok(groveCount(s, me) > 0);
  assert.ok(counter(s, me, 'grown') > 0, 'forest grew');
  JSON.parse(JSON.stringify(s));
});

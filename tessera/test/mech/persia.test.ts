import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { aiTurn } from '../../src/game/ai';
import { removeUnit } from '../../src/game/rules';
import { endTurn, startTurn } from '../../src/game/turn';
import { fallenCount, isSatrapy, mechIncome, MAX_RESPAWN } from '../../src/game/mech/persia';
import { hookCityCaptured } from '../../src/game/mech';

function setup() {
  const s = createGame({ seed: 7, human: 'persia', opponents: ['rome'], mode: 'perfection' });
  const me = s.players.findIndex((p) => p.tribe === 'persia');
  for (const p of s.players) p.explored.fill(true);
  const cap = s.cities.find((c) => c.owner === me && c.capital)!;
  for (const u of s.units.filter((x) => x.owner === me)) removeUnit(s, u);
  cap.units = 0;
  s.current = me; s.turn = 1;
  return { s, me, cap };
}
type S = ReturnType<typeof setup>['s'];
const backToMe = (s: S, me: number) => { endTurn(s); for (let i = 0; i < 4 && s.current !== me; i++) endTurn(s); };
const immortals = (s: S, me: number) => s.units.filter((u) => u.owner === me && u.kind === 'immortal');

test('a fallen Immortal respawns at the capital next turn', () => {
  const { s, me, cap } = setup();
  cap.level = 3;
  removeUnit(s, spawnUnit(s, 'immortal', me, cap.x, cap.y, cap.id), null);
  assert.equal(fallenCount(s, me), 1);
  const stars = s.players[me].stars;
  backToMe(s, me);
  assert.equal(fallenCount(s, me), 0);
  const back = immortals(s, me)[0];
  assert.ok(back);
  assert.ok(Math.abs(back.x - cap.x) <= 2 && Math.abs(back.y - cap.y) <= 2);
  assert.equal(back.homeCity, cap.id);
  assert.ok(s.players[me].stars >= stars, 'respawn is free');
});

test('respawns at most MAX_RESPAWN per turn', () => {
  const { s, me, cap } = setup();
  cap.level = 6;
  for (let i = 0; i < 4; i++) removeUnit(s, spawnUnit(s, 'immortal', me, cap.x, cap.y, cap.id));
  assert.equal(fallenCount(s, me), 4);
  backToMe(s, me);
  assert.equal(immortals(s, me).length, MAX_RESPAWN);
  assert.equal(fallenCount(s, me), 4 - MAX_RESPAWN);
});

test('a full army cap blocks the respawn, and the queue waits', () => {
  const { s, me, cap } = setup();
  cap.level = 1; // supports 2
  removeUnit(s, spawnUnit(s, 'immortal', me, cap.x, cap.y, cap.id));
  cap.units = 2;
  backToMe(s, me);
  assert.equal(fallenCount(s, me), 1);
  assert.equal(immortals(s, me).length, 0);
});

test('other units and other empires do not queue', () => {
  const { s, me, cap } = setup();
  removeUnit(s, spawnUnit(s, 'warrior', me, cap.x, cap.y, cap.id));
  const foeCity = s.cities.find((k) => k.owner !== me)!;
  removeUnit(s, spawnUnit(s, 'immortal', foeCity.owner, foeCity.x, foeCity.y, null));
  assert.equal(fallenCount(s, me), 0);
});

test('conquered cities are satrapies: doubled tile yield, drain unless garrisoned', () => {
  const { s, me } = setup();
  const c = s.cities.find((k) => k.owner !== me)!;
  const from = c.owner;
  c.owner = me; c.capital = false; c.level = 4; c.pop = 3;
  hookCityCaptured(s, c, from);
  assert.ok(isSatrapy(c));
  const own = s.tiles.filter((t) => t.owner === c.id && t.cityId === null);
  own[0].improvement = 'market'; own[1].improvement = 'mine'; own[2].improvement = 'port';
  const doubled = mechIncome(s, me);
  delete c.data!.satrap;
  const plain = mechIncome(s, me);
  c.data!.satrap = true;
  assert.equal(plain, 2); // a mine and a port at the home rate (the market is paid by the core)
  assert.equal(doubled, 2 + 2 + 1); // mine and port again, plus the market star again
  for (const u of s.units.filter((x) => x.x === c.x && x.y === c.y)) removeUnit(s, u);
  startTurn(s);
  assert.equal(c.pop, 1); // level 4 drains 1 + floor(4/3) = 2
  assert.equal(c.level, 4);
  spawnUnit(s, 'warrior', me, c.x, c.y, null);
  startTurn(s);
  assert.equal(c.pop, 1); // garrisoned: nothing lost
});

test('home cities are never drained; an enemy retaking a satrapy clears it', () => {
  const { s, me, cap } = setup();
  cap.pop = 2;
  startTurn(s);
  assert.equal(cap.pop, 2);
  const c = s.cities.find((k) => k.owner !== me)!;
  const from = c.owner;
  c.owner = me; hookCityCaptured(s, c, from);
  assert.ok(isSatrapy(c));
  c.owner = from; hookCityCaptured(s, c, me);
  assert.equal(isSatrapy(c), false);
});

test('20-turn all-AI game with Persia completes', () => {
  const s = createGame({ seed: 11, human: 'persia', opponents: ['rome', 'zulu'], mode: 'perfection' });
  for (const p of s.players) p.human = false;
  for (let i = 0; i < 20 * s.players.length && !s.over; i++) { aiTurn(s); endTurn(s); }
  assert.ok(s.turn >= 10);
  JSON.parse(JSON.stringify(s));
});

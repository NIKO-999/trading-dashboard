import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { aiTurn } from '../../src/game/ai';
import { endTurn, startTurn } from '../../src/game/turn';
import { doAction, removeUnit, tileActions, unitAt } from '../../src/game/rules';
import { hookTurnStart } from '../../src/game/mech';
import { isWater, tileAt } from '../../src/game/grid';
import { FLOOD_STARS, wondersOf } from '../../src/game/mech/egypt';

const setup = () => {
  const s = createGame({ seed: 4, human: 'egypt', opponents: ['rome'], mode: 'domination' });
  return { s, eg: s.players.findIndex((p) => p.tribe === 'egypt') };
};

test('silt farm is free, dry 3 turns, floods on the 4th with stars and +1 pop', () => {
  const { s, eg } = setup();
  const city = s.cities.find((c) => c.owner === eg)!;
  const t = s.tiles.find((x) => x.owner === city.id && x.terrain === 'field' && !x.cityId && !x.resource && !x.improvement && !unitAt(s, x.x, x.y) && tileAt(s, x.x + 1, x.y) && !tileAt(s, x.x + 1, x.y)!.cityId)!;
  const w = tileAt(s, t.x + 1, t.y)!;
  w.terrain = 'shallow'; w.resource = null; w.improvement = null; w.owner = null; w.village = false; w.ruin = false;
  assert.ok(isWater(w));
  s.players[eg].stars = 0;
  assert.ok(tileActions(s, eg, t).some((a) => a.id === 'mech:silt' && a.cost === 0 && a.enabled));
  assert.ok(doAction(s, eg, t, 'mech:silt'));
  assert.equal(t.improvement, 'farm');
  assert.equal(s.players[eg].stars, 0);
  const pop = () => city.pop + city.level * 100;
  const p0 = pop();
  for (let i = 0; i < 3; i++) { hookTurnStart(s, eg); assert.equal(s.players[eg].stars, 0); assert.equal(pop(), p0); }
  hookTurnStart(s, eg);
  assert.equal(s.players[eg].stars, FLOOD_STARS);
  assert.ok(pop() > p0);
  assert.equal(t.data!.silt, 0);
  JSON.stringify(s);
});

test('megalith over the fallen; golden guardian returns to the capital', () => {
  const { s, eg } = setup();
  const foe = 1 - eg;
  const cap = s.cities.find((c) => c.owner === eg && c.capital)!;
  const t = s.tiles.find((x) => x.owner === cap.id && x.terrain === 'field' && !x.cityId && !x.resource && !x.improvement && !unitAt(s, x.x, x.y))!;
  const k = spawnUnit(s, 'knight', eg, t.x, t.y, null);
  const killer = spawnUnit(s, 'warrior', foe, t.x, t.y, null);
  removeUnit(s, k, killer);
  assert.equal(t.data?.fallen, true);
  const gs = s.units.filter((u) => u.kind === 'guardian' && u.owner === eg && u.data?.golden);
  assert.equal(gs.length, 1);
  assert.ok(Math.max(Math.abs(gs[0].x - cap.x), Math.abs(gs[0].y - cap.y)) <= 1);
  s.units = s.units.filter((u) => u !== killer);
  s.players[eg].stars = 20;
  const lvl = cap.level * 100 + cap.pop;
  assert.ok(doAction(s, eg, t, 'mech:monolith'));
  assert.equal(t.improvement, 'monolith');
  assert.equal(s.players[eg].stars, 15);
  assert.equal(wondersOf(s, eg), 1);
  assert.ok(cap.level * 100 + cap.pop > lvl);
  const other = s.tiles.find((x) => x.owner === cap.id && x !== t && !x.cityId && !x.data?.fallen)!;
  assert.ok(!tileActions(s, eg, other).some((a) => a.id === 'mech:monolith'));
});

test('20-turn all-AI game with Egypt completes', () => {
  const s = createGame({ seed: 11, human: null, opponents: ['egypt', 'rome', 'zulu'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn <= 20 && guard++ < 500) { aiTurn(s); endTurn(s); }
  assert.ok(s.turn > 20 || s.over);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { doAction, moveOptions, moveUnit, previewCombat, tileActions, unitDef } from '../../src/game/rules';
import { tileAt } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { hookStat } from '../../src/game/mech';
import { STAKE_COST, STAKE_DAMAGE, mech, stakeCap, stakesOf, stakesOn, stakesVisibleTo } from '../../src/game/mech/vietnam';
import type { GameState, Tile } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 5, human: 'vietnam', opponents: ['vikings'], mode: 'perfection', diplomacy: true });
  const me = s.players.findIndex((p) => p.tribe === 'vietnam');
  for (const p of s.players) p.explored.fill(true);
  const city = s.cities.find((c) => c.owner === me)!;
  s.players[me].stars = 50;
  return { s, me, foe: 1 - me, city };
}
const fresh = <T extends { moved: boolean; attacked: boolean }>(u: T): T => { u.moved = false; u.attacked = false; return u; };

/** A horizontal strip of shallow water (row y, the whole map wide) in the city's territory, cleared of units. */
function lane(s: GameState, cityId: number): number {
  const city = s.cities.find((c) => c.id === cityId)!;
  const y = city.y + 2 < s.size ? city.y + 2 : city.y - 2;
  s.units = s.units.filter((u) => Math.abs(u.y - y) > 1);
  for (let x = 0; x < s.size; x++) for (const dy of [-1, 0, 1]) {
    const t = tileAt(s, x, y + dy);
    if (!t || t.cityId !== null) continue;
    t.terrain = dy === 0 ? 'shallow' : t.terrain === 'shallow' || t.terrain === 'ocean' ? 'field' : t.terrain;
    if (dy === 0) { t.resource = null; t.improvement = null; t.village = false; t.ruin = false; t.data = undefined; t.owner = cityId; }
  }
  return y;
}

test('Guerrilla War: Vietnamese units in forest or swamp defend +1', () => {
  const { s, me, foe, city } = setup();
  const t = tileAt(s, city.x + 1, city.y)!;
  s.units = s.units.filter((u) => !(u.x === t.x && u.y === t.y));
  t.terrain = 'field';
  const u = spawnUnit(s, 'warrior', me, t.x, t.y, null);
  assert.equal(hookStat(s, u, 'def'), 0, 'open ground: nothing');
  t.terrain = 'forest';
  assert.equal(hookStat(s, u, 'def'), 1, 'forest');
  t.terrain = 'swamp';
  assert.equal(hookStat(s, u, 'def'), 1, 'swamp');
  // the enemy gets no such cover
  const e = spawnUnit(s, 'warrior', foe, t.x, t.y + 3 < s.size ? t.y + 3 : t.y - 3, null);
  tileAt(s, e.x, e.y)!.terrain = 'forest';
  assert.equal(hookStat(s, e, 'def'), 0);
  // and the bonus really softens a blow
  const a = spawnUnit(s, 'swordsman', foe, t.x, t.y - 1, null);
  t.terrain = 'swamp';
  const inSwamp = previewCombat(s, a, u).dmg;
  assert.ok(unitDef(s, u) >= 1);
  const saved = mech.stat;
  mech.stat = undefined;
  const without = previewCombat(s, a, u).dmg;
  mech.stat = saved;
  assert.ok(inSwamp < without, `swamp ${inSwamp} < bare ${without}`);
});

test('stakes go on free shallow water in or beside Vietnamese land, capped per city', () => {
  const { s, me, city } = setup();
  const y = lane(s, city.id);
  const free = (): Tile[] => s.tiles.filter((t) => t.y === y && t.terrain === 'shallow' && stakesOn(t) === null);
  const t0 = free()[0];
  const act = tileActions(s, me, t0).find((a) => a.id === 'mech:stakes');
  assert.ok(act && act.enabled, 'offered on own shallows');
  assert.equal(act.cost, STAKE_COST);
  assert.ok(doAction(s, me, t0, 'mech:stakes'));
  assert.equal(stakesOn(t0), me);
  assert.equal(s.players[me].stars, 50 - STAKE_COST);
  assert.ok(!tileActions(s, me, t0).some((a) => a.id === 'mech:stakes'), 'not twice on one tile');
  // deep ocean, land and an occupied tile are refused
  const deep = free()[1];
  deep.terrain = 'ocean';
  assert.ok(!tileActions(s, me, deep).some((a) => a.id === 'mech:stakes'), 'not in deep water');
  deep.terrain = 'shallow';
  const busy = free()[1];
  const boat = spawnUnit(s, 'boat', me, busy.x, busy.y, null);
  assert.ok(!tileActions(s, me, busy).some((a) => a.id === 'mech:stakes'), 'not under a unit');
  s.units = s.units.filter((u) => u !== boat);
  // outside the borders, only next to Vietnamese land
  const out = free()[2];
  out.owner = null;
  for (const n of [tileAt(s, out.x, out.y - 1), tileAt(s, out.x, out.y + 1), tileAt(s, out.x - 1, out.y - 1), tileAt(s, out.x + 1, out.y - 1), tileAt(s, out.x - 1, out.y + 1), tileAt(s, out.x + 1, out.y + 1)]) if (n) n.owner = null;
  assert.ok(!tileActions(s, me, out).some((a) => a.id === 'mech:stakes'), 'open sea away from our land');
  tileAt(s, out.x, out.y - 1)!.owner = city.id;
  assert.ok(tileActions(s, me, out).find((a) => a.id === 'mech:stakes')?.enabled, 'beside our land');
  // the cap: 2 per living city
  const cap = stakeCap(s, me);
  assert.equal(cap, 2 * s.cities.filter((c) => c.owner === me).length);
  while (stakesOf(s, me).length < cap) assert.ok(doAction(s, me, free()[0], 'mech:stakes'));
  const over = tileActions(s, me, free()[0]).find((a) => a.id === 'mech:stakes');
  assert.ok(over && !over.enabled && /per city/.test(over.reason ?? ''), 'capped');
  assert.ok(!doAction(s, me, free()[0], 'mech:stakes'));
  // other empires have no such action
  assert.ok(!tileActions(s, 1 - me, free()[0]).some((a) => a.id === 'mech:stakes'));
  JSON.parse(JSON.stringify(s));
});

test('a hostile ship is stopped by the stakes, takes damage, and the stakes are spent', () => {
  const { s, me, foe, city } = setup();
  const y = lane(s, city.id);
  const x0 = 1;
  const trap = tileAt(s, x0 + 2, y)!;
  assert.ok(doAction(s, me, trap, 'mech:stakes'));
  const ship = fresh(spawnUnit(s, 'ship', foe, x0, y, null));
  const hp = ship.hp;
  const opts = moveOptions(s, ship).filter((o) => o.y === y);
  assert.ok(opts.some((o) => o.x === trap.x), 'can sail onto the stakes');
  assert.ok(!opts.some((o) => o.x > trap.x), 'but not past them');
  assert.ok(moveUnit(s, ship, trap.x, trap.y));
  assert.equal(ship.hp, hp - STAKE_DAMAGE);
  assert.equal(stakesOn(trap), null, 'spent');
  assert.equal(s.players[me].mech?.sprung, 1);
  // a weak hull sinks
  const trap2 = tileAt(s, x0 + 6, y)!;
  assert.ok(doAction(s, me, trap2, 'mech:stakes'));
  const boat = fresh(spawnUnit(s, 'boat', foe, x0 + 5, y, null));
  boat.hp = 3;
  assert.ok(moveUnit(s, boat, trap2.x, trap2.y));
  assert.ok(!s.units.includes(boat), 'sunk');
  assert.equal(stakesOn(trap2), null);
});

test('Vietnamese and allied ships sail over the stakes unharmed', () => {
  const { s, me, foe, city } = setup();
  const y = lane(s, city.id);
  const trap = tileAt(s, 3, y)!;
  assert.ok(doAction(s, me, trap, 'mech:stakes'));
  const own = fresh(spawnUnit(s, 'ship', me, 1, y, null));
  const ownHp = own.hp;
  assert.ok(moveOptions(s, own).some((o) => o.y === y && o.x > trap.x), 'own ship passes');
  assert.ok(moveUnit(s, own, trap.x, trap.y));
  assert.equal(own.hp, ownHp, 'unharmed');
  assert.equal(stakesOn(trap), me, 'still waiting');
  s.units = s.units.filter((u) => u !== own);
  // a treaty partner's ship is not caught either
  s.diplo!.pacts.push({ a: me, b: foe, kind: 'alliance', since: 0 });
  const ally = fresh(spawnUnit(s, 'ship', foe, 1, y, null));
  const hp = ally.hp;
  assert.ok(moveOptions(s, ally).some((o) => o.y === y && o.x > trap.x), 'ally passes');
  assert.ok(moveUnit(s, ally, trap.x, trap.y));
  assert.equal(ally.hp, hp);
  assert.equal(stakesOn(trap), me);
  // a land unit never springs them
  s.diplo!.pacts = [];
  s.units = s.units.filter((u) => u !== ally);
  const w = spawnUnit(s, 'warrior', foe, trap.x, trap.y, null);
  mech.afterMove!(s, me, w, { x: trap.x - 1, y: trap.y }, trap);
  assert.equal(stakesOn(trap), me);
});

test('stakes are hidden from everyone but their owner', () => {
  const { s, me, foe, city } = setup();
  const y = lane(s, city.id);
  const trap = tileAt(s, 3, y)!;
  assert.ok(doAction(s, me, trap, 'mech:stakes'));
  assert.equal(stakesVisibleTo(trap, me), true);
  assert.equal(stakesVisibleTo(trap, foe), false);
  assert.equal(stakesVisibleTo(trap, -1), false, 'a spectator sees nothing');
  assert.equal(stakesVisibleTo(tileAt(s, 4, y)!, me), false);
});

test('AI plants stakes beside its coastal cities and keeps a reserve', () => {
  const { s, me, city } = setup();
  s.players[me].human = false;
  // ring the city with shallow water
  for (const dx of [-1, 0, 1]) {
    const t = tileAt(s, city.x + dx, city.y + 1) ?? tileAt(s, city.x + dx, city.y - 1)!;
    if (t.cityId !== null) continue;
    t.terrain = 'shallow'; t.resource = null; t.improvement = null; t.village = false; t.data = undefined; t.owner = city.id;
    s.units = s.units.filter((u) => !(u.x === t.x && u.y === t.y));
  }
  s.players[me].stars = STAKE_COST + 4; // too poor: keeps the reserve
  assert.equal(mech.ai!(s, me), false);
  s.players[me].met = [1 - me]; // the Vikings are seafarers
  s.players[me].stars = 40;
  assert.ok(mech.ai!(s, me));
  assert.equal(stakesOf(s, me).length, 1);
  assert.equal(s.players[me].stars, 40 - STAKE_COST);
  while (mech.ai!(s, me)) { /* plant up to the cap */ }
  assert.ok(stakesOf(s, me).length <= stakeCap(s, me));
  assert.ok(s.players[me].stars >= 5, 'a reserve is kept');
});

test('20-turn all-AI game with Vietnam completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['vietnam', 'vikings', 'japan'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 20 && guard++ < 1000) {
    aiTurn(s);
    endTurn(s);
  }
  assert.ok(s.turn >= 20 || s.over);
  JSON.parse(JSON.stringify(s));
});

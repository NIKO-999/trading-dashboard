import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { doAction, maxHp, moveOptions, tileActions, trainCost, unitCap } from '../../src/game/rules';
import { tileAt } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { hookStat } from '../../src/game/mech';
import { BRIDGE_COST, BRIDGE_STEP, HIMALAYA_ATK, RECRUIT_COOLDOWN, hasBridge, mech } from '../../src/game/mech/nepal';
import type { MoveCtx } from '../../src/game/mech/types';
import type { City, GameState, Tile } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 5, human: 'nepal', opponents: ['japan', 'rome'], mapSize: 'huge', mode: 'perfection' });
  const me = s.players.findIndex((p) => p.tribe === 'nepal');
  for (const p of s.players) p.explored.fill(true);
  const cap = s.cities.find((c) => c.owner === me)!;
  s.players[me].stars = 100;
  s.units = s.units.filter((u) => Math.max(Math.abs(u.x - cap.x), Math.abs(u.y - cap.y)) > 6);
  for (const t of s.tiles) {
    if (Math.max(Math.abs(t.x - cap.x), Math.abs(t.y - cap.y)) > 5 || t.cityId !== null) continue;
    Object.assign(t, { terrain: 'field', resource: null, improvement: null, village: false, ruin: false, road: false, data: undefined });
  }
  const foes = s.players.filter((p) => p.id !== me && !p.neutral).map((p) => p.id);
  return { s, me, foe: foes[0], cap };
}

const dirOf = (s: GameState, c: City) => ({ dx: c.x < s.size / 2 ? 1 : -1, dy: c.y < s.size / 2 ? 1 : -1 });
const at = (s: GameState, x: number, y: number) => tileAt(s, x, y)!;
const mountain = (s: GameState, x: number, y: number): Tile => Object.assign(at(s, x, y), { terrain: 'mountain' as const });
const act = (s: GameState, me: number, t: Tile, id: string) => tileActions(s, me, t).find((a) => a.id === id);
const ready = (u: { moved: boolean; attacked: boolean }) => { u.moved = false; u.attacked = false; };

test('Himalayan Kingdom: units on or next to a mountain attack +0.5, only Nepal\'s', () => {
  const { s, me, foe, cap } = setup();
  const { dx, dy } = dirOf(s, cap);
  const x = cap.x + dx * 3, y = cap.y + dy * 3;
  const u = spawnUnit(s, 'archer', me, x, y, null);
  assert.equal(mech.stat!(s, me, u, 'atk'), 0, 'no mountain nearby');
  mountain(s, x + dx, y);
  assert.equal(mech.stat!(s, me, u, 'atk'), HIMALAYA_ATK, 'next to a mountain');
  assert.equal(mech.stat!(s, me, u, 'def'), 0, 'attack only');
  assert.equal(hookStat(s, u, 'atk'), HIMALAYA_ATK, 'reaches the combat numbers');
  const top = spawnUnit(s, 'archer', me, x + dx, y, null);
  assert.equal(mech.stat!(s, me, top, 'atk'), HIMALAYA_ATK, 'on the mountain');
  const e = spawnUnit(s, 'warrior', foe, x, y + dy, null);
  assert.equal(mech.stat!(s, me, e, 'atk'), 0, 'enemies get nothing');
});

test('Nepali units climb mountains without the Climbing tech; others cannot', () => {
  const { s, me, foe, cap } = setup();
  const { dx, dy } = dirOf(s, cap);
  s.players[me].techs = s.players[me].techs.filter((t) => t !== 'climbing');
  s.players[foe].techs = s.players[foe].techs.filter((t) => t !== 'climbing');
  const x = cap.x + dx * 3, y = cap.y + dy * 3;
  mountain(s, x + dx, y);
  const u = spawnUnit(s, 'archer', me, x, y, null);
  ready(u);
  assert.ok(moveOptions(s, u).some((o) => o.x === x + dx && o.y === y), 'Nepal climbs');
  s.units = s.units.filter((k) => k !== u);
  const e = spawnUnit(s, 'archer', foe, x, y, null);
  ready(e);
  assert.ok(!moveOptions(s, e).some((o) => o.x === x + dx && o.y === y), 'a foe without Climbing does not');
});

test('Rope bridge: 3★ on a mountain in your borders; Nepali units cross it at road cost without stopping', () => {
  const { s, me, foe, cap } = setup();
  const { dx } = dirOf(s, cap);
  // a mountain beside the capital, inside its borders
  const m = mountain(s, cap.x + dx, cap.y);
  m.owner = cap.id;
  const out = at(s, cap.x + dx * 4, cap.y);
  mountain(s, out.x, out.y).owner = null;
  assert.equal(act(s, me, out, 'mech:ropebridge'), undefined, 'not outside the borders');
  assert.equal(act(s, me, at(s, cap.x, cap.y + 1), 'mech:ropebridge'), undefined, 'not on flat ground');
  assert.equal(act(s, foe, m, 'mech:ropebridge'), undefined, 'not for other empires');
  const a = act(s, me, m, 'mech:ropebridge');
  assert.ok(a && a.enabled);
  assert.equal(a.cost, BRIDGE_COST);

  // before the bridge: an archer (move 1) beside the mountain stops on it
  const x0 = cap.x, y0 = cap.y + 1; // a unit off the city tile, so roads do not interfere
  const start = at(s, x0, y0), peak = mountain(s, x0 + dx, y0), beyond = at(s, x0 + dx * 2, y0);
  peak.owner = cap.id;
  for (const t of [start, beyond]) t.road = false;
  const u = spawnUnit(s, 'archer', me, x0, y0, null);
  ready(u);
  const opts = () => moveOptions(s, u).map((o) => `${o.x},${o.y}`);
  assert.ok(opts().includes(`${peak.x},${peak.y}`));
  assert.ok(!opts().includes(`${beyond.x},${beyond.y}`), 'the mountain stops the move');

  assert.ok(doAction(s, me, peak, 'mech:ropebridge'));
  assert.ok(hasBridge(peak));
  assert.equal(s.players[me].stars, 100 - BRIDGE_COST);
  assert.equal(act(s, me, peak, 'mech:ropebridge'), undefined, 'one bridge per peak');
  assert.ok(opts().includes(`${beyond.x},${beyond.y}`), 'over the bridge and off the far side in one move');

  // the step itself: onto and off the bridge at road cost, not stopping
  const ctx = (): MoveCtx => ({ cost: 1, stop: true, forbid: false, opt: { x: peak.x, y: peak.y } });
  const on = ctx();
  mech.moveStep!(s, me, u, start, peak, on);
  assert.equal(on.cost, BRIDGE_STEP);
  assert.equal(on.stop, false);
  const off = { ...ctx(), stop: false };
  mech.moveStep!(s, me, u, peak, beyond, off);
  assert.equal(off.cost, BRIDGE_STEP);
  // an enemy beside the bridge still stops the crossing
  spawnUnit(s, 'warrior', foe, peak.x, peak.y + 1, null);
  const zoc = ctx();
  mech.moveStep!(s, me, u, start, peak, zoc);
  assert.equal(zoc.stop, true);
  // other empires' units get nothing from it
  const e = spawnUnit(s, 'archer', foe, x0, y0 - 1, null);
  const theirs = ctx();
  mech.moveStep!(s, me, e, start, peak, theirs);
  assert.equal(theirs.cost, 1);
  assert.equal(theirs.stop, true);
});

test('Gurkha recruits: a hill city raises a veteran Gurkha for the normal price, every 4 turns, within its slots', () => {
  const { s, me, cap } = setup();
  const { dx } = dirOf(s, cap);
  const ct = at(s, cap.x, cap.y);
  assert.equal(act(s, me, ct, 'mech:recruit'), undefined, 'not a hill city yet');
  mountain(s, cap.x + dx, cap.y);
  cap.units = 0;
  const a = act(s, me, ct, 'mech:recruit');
  assert.ok(a && a.enabled, a?.reason ?? 'disabled');
  const cost = trainCost(s, me, 'gurkha');
  assert.equal(a.cost, cost);
  const n = s.units.length;
  assert.ok(doAction(s, me, ct, 'mech:recruit'));
  assert.equal(s.players[me].stars, 100 - cost);
  assert.equal(s.units.length, n + 1);
  const g = s.units[s.units.length - 1];
  assert.equal(g.kind, 'gurkha');
  assert.equal(g.veteran, true);
  assert.equal(g.hp, maxHp(g));
  assert.equal(g.hp, 12 + 5 + 2); // veteran, plus Nepal's +2 health for foot soldiers (a civilization bonus)
  assert.equal(cap.units, 1);
  // step the Gurkha off the city tile; the levy is still on cooldown
  g.x = cap.x; g.y = cap.y + 1;
  for (let i = 1; i < RECRUIT_COOLDOWN; i++) {
    s.turn++;
    const b = act(s, me, ct, 'mech:recruit')!;
    assert.equal(b.enabled, false);
    assert.match(b.reason ?? '', /Next levy/);
  }
  s.turn++;
  assert.ok(act(s, me, ct, 'mech:recruit')!.enabled, 'ready again after 4 turns');
  // a full city has no slot for him
  cap.units = unitCap(cap);
  const full = act(s, me, ct, 'mech:recruit')!;
  assert.equal(full.enabled, false);
  assert.match(full.reason ?? '', /supports/);
  cap.units = 0;
  // nor does an occupied city tile
  spawnUnit(s, 'archer', me, cap.x, cap.y, null);
  assert.equal(act(s, me, ct, 'mech:recruit')!.enabled, false);
});

test('AI recruits Gurkhas at threatened hill cities and slings bridges when rich', () => {
  const { s, me, foe, cap } = setup();
  s.players[me].human = false;
  const { dx, dy } = dirOf(s, cap);
  cap.units = 0;
  s.players[me].stars = 1;
  assert.equal(mech.ai!(s, me), false, 'poor and no mountains');
  const m = mountain(s, cap.x + dx, cap.y);
  m.owner = cap.id;
  spawnUnit(s, 'warrior', foe, cap.x + dx * 3, cap.y + dy * 2, null);
  s.players[me].stars = trainCost(s, me, 'gurkha');
  assert.ok(mech.ai!(s, me));
  assert.ok(s.units.some((u) => u.owner === me && u.kind === 'gurkha' && u.veteran));
  assert.equal(s.players[me].stars, 0);
  s.players[me].stars = 30;
  let n = 0;
  while (mech.ai!(s, me) && n < 10) n++;
  assert.ok(hasBridge(m), 'a bridge on the peak by the capital');
  assert.ok(n <= 3);
});

test('20-turn all-AI game with Nepal completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['nepal', 'tibet', 'japan'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 20 && guard++ < 1000) {
    aiTurn(s);
    endTurn(s);
  }
  assert.ok(s.turn >= 20 || s.over);
  JSON.parse(JSON.stringify(s));
});

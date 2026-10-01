import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { doAction, maxHp, tileActions } from '../../src/game/rules';
import { tileAt } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { hookStat } from '../../src/game/mech';
import { offersFor, relation } from '../../src/game/diplomacy';
import {
  HOME_DEF, MOOD_CAP, PARL_COST, PARL_EVERY, PARL_HEAL, PARL_MOOD, TOQUI_ATK, TOQUI_COST, TOQUI_EVERY, TOQUI_MOVE, TOQUI_TURNS,
  atWar, mech, parlIn, toquiFree, toquiIn, toquiLeft,
} from '../../src/game/mech/mapuche';
import type { GameState, Tile } from '../../src/game/types';

function setup(diplomacy = false) {
  const s = createGame({ seed: 5, human: 'mapuche', opponents: ['japan'], mapSize: 'huge', mode: 'perfection', diplomacy });
  const me = s.players.findIndex((p) => p.tribe === 'mapuche');
  const foe = s.players.findIndex((p) => p.tribe === 'japan');
  for (const p of s.players) p.explored.fill(true);
  const cap = s.cities.find((c) => c.owner === me)!;
  cap.capital = true;
  s.players[me].stars = 100;
  // nobody near the Mapuche to start with
  s.units = s.units.filter((u) => u.owner === me || Math.max(Math.abs(u.x - cap.x), Math.abs(u.y - cap.y)) > 8);
  const capT = tileAt(s, cap.x, cap.y)!;
  return { s, me, foe, cap, capT };
}

/** Make a clean tile of the given owner (a city id, or null) at (x, y). */
function plot(s: GameState, x: number, y: number, owner: number | null): Tile {
  const t = tileAt(s, x, y)!;
  Object.assign(t, { terrain: 'field', resource: null, improvement: null, village: false, ruin: false, owner });
  s.units = s.units.filter((u) => !(u.x === t.x && u.y === t.y));
  return t;
}

const act = (s: GameState, me: number, t: Tile, id: string) => tileActions(s, me, t).find((a) => a.id === id);

test('Unconquered: Mapuche units inside their own borders defend +0.5, nowhere else and nobody else', () => {
  const { s, me, foe, cap } = setup();
  const dy = cap.y < s.size / 2 ? 1 : -1;
  const t = plot(s, cap.x, cap.y + dy, cap.id);
  const u = spawnUnit(s, 'warrior', me, t.x, t.y, null);
  assert.equal(hookStat(s, u, 'def'), HOME_DEF);
  assert.equal(hookStat(s, u, 'atk'), 0, 'defence only');
  assert.equal(hookStat(s, u, 'move'), 0);
  t.owner = null;
  assert.equal(hookStat(s, u, 'def'), 0, 'outside the borders');
  const foeCity = s.cities.find((c) => c.owner === foe)!;
  t.owner = foeCity.id;
  assert.equal(hookStat(s, u, 'def'), 0, 'in enemy land');
  t.owner = cap.id;
  const e = spawnUnit(s, 'warrior', foe, cap.x + (cap.x < s.size / 2 ? 1 : -1), cap.y, null);
  tileAt(s, e.x, e.y)!.owner = cap.id;
  assert.equal(hookStat(s, e, 'def'), 0, 'an invader gets nothing');
});

test('Toqui (no diplomacy): only with an enemy within 4 tiles of a city; +1 move and +0.5 attack for 3 turns; every 10 turns', () => {
  const { s, me, foe, cap, capT } = setup();
  const dx = cap.x < s.size / 2 ? 1 : -1;
  const u = spawnUnit(s, 'warrior', me, cap.x, cap.y, null);
  let a = act(s, me, capT, 'mech:toqui');
  assert.ok(a && !a.enabled && /enemies are near/.test(a.reason ?? ''), 'no enemy near: no toqui');
  assert.ok(!atWar(s, me));
  const far = spawnUnit(s, 'warrior', foe, cap.x + dx * 5, cap.y, null);
  assert.ok(!atWar(s, me), '5 tiles is too far');
  far.x = cap.x + dx * 4;
  assert.ok(atWar(s, me), '4 tiles is war');
  a = act(s, me, capT, 'mech:toqui');
  assert.ok(a && a.enabled);
  assert.equal(a.cost, TOQUI_COST);
  // only at the capital
  const other = plot(s, cap.x, cap.y + (cap.y < s.size / 2 ? 2 : -2), cap.id);
  assert.ok(!act(s, me, other, 'mech:toqui'));
  assert.ok(doAction(s, me, capT, 'mech:toqui'));
  assert.equal(s.players[me].stars, 100 - TOQUI_COST);
  assert.equal(hookStat(s, u, 'atk'), TOQUI_ATK);
  assert.equal(hookStat(s, u, 'move'), TOQUI_MOVE);
  assert.equal(hookStat(s, far, 'atk'), 0, 'the enemy is not led by our toqui');
  assert.equal(hookStat(s, far, 'move'), 0);
  // the reign: this turn and the next two
  const t0 = s.turn;
  for (let i = 0; i < TOQUI_TURNS; i++) {
    s.turn = t0 + i;
    assert.equal(toquiLeft(s, me), TOQUI_TURNS - i);
    assert.equal(hookStat(s, u, 'atk'), TOQUI_ATK, `turn +${i}`);
  }
  s.turn = t0 + TOQUI_TURNS;
  assert.equal(toquiLeft(s, me), 0);
  assert.equal(hookStat(s, u, 'atk'), 0, 'the toqui steps down');
  assert.equal(hookStat(s, u, 'move'), 0);
  // the cooldown, counted from the election
  s.turn = t0 + TOQUI_EVERY - 1;
  assert.equal(toquiIn(s, me), 1);
  a = act(s, me, capT, 'mech:toqui');
  assert.ok(a && !a.enabled && /again in 1 turn/.test(a.reason ?? ''));
  assert.ok(!doAction(s, me, capT, 'mech:toqui'));
  s.turn = t0 + TOQUI_EVERY;
  assert.ok(doAction(s, me, capT, 'mech:toqui'));
  // the threat gone, no new toqui even when the council could sit
  s.turn += TOQUI_EVERY;
  s.units = s.units.filter((x) => x !== far);
  assert.ok(!act(s, me, capT, 'mech:toqui')!.enabled);
  // other empires can't elect one
  const foeCap = s.cities.find((c) => c.owner === foe)!;
  foeCap.capital = true;
  assert.ok(!act(s, foe, tileAt(s, foeCap.x, foeCap.y)!, 'mech:toqui'));
  JSON.parse(JSON.stringify(s));
});

test('Toqui (diplomacy): only while at war with an empire the Mapuche have met', () => {
  const { s, me, foe, capT } = setup(true);
  s.players[me].met = [];
  s.players[foe].met = [];
  assert.ok(!atWar(s, me), 'nobody met: no war');
  assert.ok(!act(s, me, capT, 'mech:toqui')!.enabled);
  s.players[me].met = [foe];
  s.players[foe].met = [me];
  assert.equal(relation(s, me, foe), 'war');
  assert.ok(atWar(s, me), 'met and no treaty: war');
  assert.ok(act(s, me, capT, 'mech:toqui')!.enabled, 'no unit needs to be near');
  s.diplo!.pacts.push({ a: Math.min(me, foe), b: Math.max(me, foe), kind: 'peace', since: s.turn });
  assert.ok(!atWar(s, me), 'at peace');
  assert.ok(/only in war/.test(act(s, me, capT, 'mech:toqui')!.reason ?? ''));
});

test('Parlamento (no war to settle): heals 4 HP, makes the next Toqui free, every 8 turns', () => {
  const { s, me, foe, cap, capT } = setup();
  const dx = cap.x < s.size / 2 ? 1 : -1;
  const a = spawnUnit(s, 'warrior', me, cap.x, cap.y, null);
  const b = spawnUnit(s, 'archer', me, cap.x + dx, cap.y, null);
  a.hp = 2; b.hp = maxHp(b) - 1;
  const p = act(s, me, capT, 'mech:parlamento');
  assert.ok(p && p.enabled);
  assert.equal(p.cost, PARL_COST);
  assert.ok(doAction(s, me, capT, 'mech:parlamento'));
  assert.equal(s.players[me].stars, 100 - PARL_COST);
  assert.equal(a.hp, 2 + PARL_HEAL);
  assert.equal(b.hp, maxHp(b), 'never above the maximum');
  assert.ok(toquiFree(s, me));
  assert.equal(parlIn(s, me), PARL_EVERY);
  assert.ok(!act(s, me, capT, 'mech:parlamento')!.enabled);
  // the free election: war comes, and the toqui costs nothing (once)
  spawnUnit(s, 'warrior', foe, cap.x + dx * 3, cap.y, null);
  const t = act(s, me, capT, 'mech:toqui')!;
  assert.equal(t.cost, 0);
  assert.ok(t.enabled);
  const before = s.players[me].stars;
  assert.ok(doAction(s, me, capT, 'mech:toqui'));
  assert.equal(s.players[me].stars, before);
  assert.ok(!toquiFree(s, me));
  s.turn += TOQUI_EVERY;
  assert.equal(act(s, me, capT, 'mech:toqui')!.cost, TOQUI_COST, 'the next one is paid again');
  s.turn = s.turn - TOQUI_EVERY + PARL_EVERY;
  assert.ok(act(s, me, capT, 'mech:parlamento')!.enabled, 'the koyang may meet again');
});

test('Parlamento (diplomacy, at war): every enemy warms by 15 and is offered peace through the normal route', () => {
  const { s, me, foe, cap, capT } = setup(true);
  s.players[me].met = [foe];
  s.players[foe].met = [me];
  s.players[foe].human = true; // so the offer waits for an answer instead of being judged on the spot
  const u = spawnUnit(s, 'warrior', me, cap.x, cap.y, null);
  u.hp = 1;
  const p = act(s, me, capT, 'mech:parlamento')!;
  assert.ok(p.enabled && /peace offer/.test(p.desc));
  assert.ok(doAction(s, me, capT, 'mech:parlamento'));
  assert.equal(s.diplo!.mood[`${foe}:${me}`], PARL_MOOD);
  const offers = offersFor(s, foe);
  assert.equal(offers.length, 1);
  assert.equal(offers[0].kind, 'peace');
  assert.equal(offers[0].from, me);
  assert.equal(u.hp, 1, 'no healing on the diplomatic path');
  assert.ok(!toquiFree(s, me));
  assert.equal(relation(s, me, foe), 'war', 'nothing is forced');
  // the mood is capped like a gift's
  s.diplo!.mood[`${foe}:${me}`] = MOOD_CAP - 5;
  s.diplo!.offers = [];
  s.turn += PARL_EVERY;
  assert.ok(doAction(s, me, capT, 'mech:parlamento'));
  assert.equal(s.diplo!.mood[`${foe}:${me}`], MOOD_CAP);
  JSON.parse(JSON.stringify(s));
});

test('AI: elects a toqui when enemies close in, holds a koyang to rest a battered army', () => {
  const { s, me, foe, cap } = setup();
  s.players[me].human = false;
  const dx = cap.x < s.size / 2 ? 1 : -1;
  s.players[me].stars = 10;
  for (const u of s.units) if (u.owner === me) u.hp = maxHp(u);
  assert.equal(mech.ai!(s, me), false, 'no threat, nobody hurt');
  spawnUnit(s, 'warrior', foe, cap.x + dx * 2, cap.y, null);
  assert.ok(mech.ai!(s, me));
  assert.equal(toquiLeft(s, me), TOQUI_TURNS);
  assert.equal(s.players[me].stars, 10 - TOQUI_COST);
  assert.equal(mech.ai!(s, me), false, 'one toqui at a time; nobody hurt');
  for (let i = 0; i < 3; i++) spawnUnit(s, 'warrior', me, cap.x, cap.y + (cap.y < s.size / 2 ? i + 1 : -i - 1), null).hp = 3;
  assert.ok(mech.ai!(s, me), 'three badly wounded: a koyang');
  assert.equal(s.players[me].stars, 10 - TOQUI_COST - PARL_COST);
  assert.equal(mech.ai!(s, me), false);
});

test('20-turn all-AI game with the Mapuche completes', () => {
  for (const diplomacy of [false, true]) {
    const s: GameState = createGame({ seed: 11, human: null, opponents: ['mapuche', 'vikings', 'japan'], mode: 'perfection', diplomacy });
    startTurn(s);
    let guard = 0;
    while (!s.over && s.turn < 20 && guard++ < 1000) {
      aiTurn(s);
      endTurn(s);
    }
    assert.ok(s.turn >= 20 || s.over);
    JSON.parse(JSON.stringify(s));
  }
});

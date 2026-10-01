import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { doAction, techCost, tileActions, tileOwnerPlayer } from '../../src/game/rules';
import { tileAt } from '../../src/game/grid';
import { createGame } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { hookIncome, MECH } from '../../src/game/mech';
import {
  coutureIncome, mech, SALON_COST, SALON_LEVEL, SALON_TECH_MAX, salonsOf, salonTechOff, salonWhy, TOUR_MAX, tourIncome, touristsOf,
} from '../../src/game/mech/france';
import type { City, GameState, Unit } from '../../src/game/types';

function setup(seed = 5) {
  const s = createGame({ seed, human: 'france', opponents: ['japan', 'mongols'], mode: 'perfection', diplomacy: true });
  const city = s.cities.find((c) => c.owner === 0 && c.capital)!;
  return { s, city };
}

const peace = (s: GameState, a: number, b: number) => { s.diplo!.pacts.push({ a, b, kind: 'peace', since: 0 } as never); };
const french = (s: GameState) => s.tiles.filter((t) => tileOwnerPlayer(s, t) === 0 && t.cityId === null);
let nextId = 50000;
/** A copy of one of `pid`'s units standing on (x, y). */
function unitOf(s: GameState, pid: number, x: number, y: number): Unit {
  const u: Unit = { ...s.units.find((k) => k.owner === pid)!, id: nextId++, x, y };
  s.units.push(u);
  return u;
}
/** Extra French cities (by hand), so several salons can be opened. */
function moreCities(s: GameState, base: City, n: number): City[] {
  const out: City[] = [];
  for (let i = 0; i < n; i++) {
    const c: City = { ...JSON.parse(JSON.stringify(base)), id: 9000 + i, capital: false, name: `Ville ${i}`, data: {} };
    s.cities.push(c);
    out.push(c);
  }
  return out;
}

test('Haute Couture: every developed luxury pays +1★ a turn', () => {
  const { s } = setup();
  const land = french(s).filter((t) => t.terrain !== 'mountain');
  for (const t of land) if (t.improvement === 'estate') t.improvement = null;
  assert.equal(coutureIncome(s, 0), 0);
  const before = hookIncome(s, 0);
  land[0].resource = 'wine'; land[0].improvement = 'estate';
  land[1].resource = 'silk'; land[1].improvement = 'estate';
  land[2].resource = 'wine'; land[2].improvement = 'estate';
  assert.equal(coutureIncome(s, 0), 3, 'counts every copy');
  assert.equal(hookIncome(s, 0), before + 3);
  land[3].resource = 'spices'; // wild, not developed
  assert.equal(coutureIncome(s, 0), 3, 'an undeveloped luxury pays nothing');
  assert.equal(coutureIncome(s, 1), 0, 'other empires get nothing');
});

test('Salon: level 3+, 6★, once per city', () => {
  const { s, city } = setup();
  const p = s.players[0];
  p.stars = 100;
  const tile = tileAt(s, city.x, city.y)!;
  city.level = SALON_LEVEL - 1;
  let act = tileActions(s, 0, tile).find((a) => a.id === 'mech:salon');
  assert.ok(act && !act.enabled, 'offered but locked below level 3');
  assert.match(act.reason!, /level/);
  assert.ok(!doAction(s, 0, tile, 'mech:salon'));
  assert.equal(p.stars, 100, 'a refused action is not charged');
  city.level = SALON_LEVEL;
  act = tileActions(s, 0, tile).find((a) => a.id === 'mech:salon');
  assert.ok(act && act.enabled);
  assert.equal(act.cost, SALON_COST);
  assert.equal(SALON_COST, 6);
  assert.ok(doAction(s, 0, tile, 'mech:salon'));
  assert.equal(p.stars, 100 - SALON_COST);
  assert.ok(city.data?.salon !== undefined);
  assert.equal(salonsOf(s, 0).length, 1);
  // once per city
  assert.match(salonWhy(s, 0, city)!, /already/);
  assert.equal(tileActions(s, 0, tile).some((a) => a.id === 'mech:salon'), false, 'no longer offered');
  assert.ok(!doAction(s, 0, tile, 'mech:salon'));
  assert.equal(p.stars, 100 - SALON_COST);
  // too poor
  p.stars = 5;
  const [c2] = moreCities(s, city, 1);
  c2.level = 4;
  assert.equal(mech.actions!(s, 0, { ...tile, cityId: c2.id })[0].enabled, false);
  // only France
  const other = s.cities.find((c) => c.owner === 1)!;
  other.level = 5;
  assert.equal(tileActions(s, 1, tileAt(s, other.x, other.y)!).some((a) => a.id === 'mech:salon'), false);
  JSON.parse(JSON.stringify(s));
});

test('Salons make every tech 1★ cheaper each, at most 3★, never below 1★', () => {
  const { s, city } = setup();
  const all = [city, ...moreCities(s, city, 3)];
  const tech = 'farming';
  const full = techCost(s, 0, tech);
  for (let i = 0; i < 4; i++) {
    all[i].data = { ...(all[i].data ?? {}), salon: true };
    assert.equal(salonTechOff(s, 0), Math.min(i + 1, SALON_TECH_MAX));
    assert.equal(techCost(s, 0, tech), Math.max(1, full - Math.min(i + 1, SALON_TECH_MAX)));
  }
  assert.equal(techCost(s, 0, tech), Math.max(1, full - 3), 'capped at −3');
  // never below 1: the cheapest tech, with a Eureka
  s.players[0].sparks = ['fishing', 'farming', 'riding', 'climbing', 'hunting'];
  for (const t of s.players[0].sparks) assert.ok(techCost(s, 0, t) >= 1);
  assert.equal(salonTechOff(s, 1), 0, 'others get nothing');
});

test('Grand Tour: units of empires at peace inside French borders pay 1★ each, up to 3★', () => {
  const { s } = setup();
  s.units = s.units.filter((u) => u.owner === 0 || !french(s).some((t) => t.x === u.x && t.y === u.y));
  const spots = french(s).filter((t) => !s.units.some((u) => u.x === t.x && u.y === t.y));
  const p = s.players[0];
  // a hostile unit (no treaty) pays nothing
  unitOf(s, 1, spots[0].x, spots[0].y);
  assert.equal(tourIncome(s, 0), 0, 'hostile units are not tourists');
  p.stars = 10;
  mech.turnStart!(s, 0);
  assert.equal(p.stars, 10);
  // at peace: one tourist
  peace(s, 0, 1);
  assert.equal(touristsOf(s, 0).length, 1);
  const theirs = s.players[1].stars;
  mech.turnStart!(s, 0);
  assert.equal(p.stars, 11);
  assert.equal(s.players[1].stars, theirs, 'the visitors are not charged');
  // five tourists pay only the cap
  for (let i = 1; i < 5; i++) unitOf(s, 1, spots[i].x, spots[i].y);
  assert.equal(touristsOf(s, 0).length, 5);
  assert.equal(tourIncome(s, 0), TOUR_MAX);
  mech.turnStart!(s, 0);
  assert.equal(p.stars, 11 + TOUR_MAX);
  // units outside the borders don't count; a third, hostile empire's units don't count
  const outside = s.tiles.find((t) => tileOwnerPlayer(s, t) === null && !s.units.some((u) => u.x === t.x && u.y === t.y))!;
  s.units = s.units.filter((u) => u.owner !== 1);
  unitOf(s, 1, outside.x, outside.y);
  unitOf(s, 2, spots[6].x, spots[6].y);
  assert.equal(tourIncome(s, 0), 0);
  // only France's turn start pays
  mech.turnStart!(s, 1);
  assert.equal(p.stars, 11 + TOUR_MAX);
});

test('AI opens salons in its big cities, keeping a reserve', () => {
  const { s, city } = setup();
  s.players[0].human = false;
  city.level = 2;
  s.players[0].stars = 40;
  assert.equal(mech.ai!(s, 0), false, 'no city is big enough');
  city.level = 4;
  s.players[0].stars = SALON_COST + 1;
  assert.equal(mech.ai!(s, 0), false, 'keeps its reserve');
  s.players[0].stars = 40;
  aiTurn(s);
  assert.equal(salonsOf(s, 0).length, 1);
  assert.equal(MECH.france, mech);
});

test('20-turn all-AI game with France completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['france', 'japan', 'mongols'], mode: 'perfection', diplomacy: true });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 20 && guard++ < 1000) {
    aiTurn(s);
    endTurn(s);
  }
  assert.ok(s.turn >= 20 || s.over);
});

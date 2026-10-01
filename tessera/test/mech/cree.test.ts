import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { doAction, maxHp, tileActions, tileOwnerPlayer } from '../../src/game/rules';
import { neighbors, tileAt } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import {
  CONTACT_CAP, PEMMICAN_HEAL, POST_CAP, POST_COST, POST_STEP,
  contactIncome, hardWinter, mech, postCost, postIncome, postStars, postWhy, posts, visitors, winters,
} from '../../src/game/mech/cree';
import type { City, GameState, Tile } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 7, human: 'cree', opponents: ['rome'], mode: 'perfection' });
  const me = s.players.findIndex((p) => p.tribe === 'cree');
  for (const p of s.players) p.explored.fill(true);
  const city = s.cities.find((c) => c.owner === me && c.capital)!;
  // the two rings round the capital: forest, nothing on it, no units, all Cree
  for (const t of neighbors(s, city.x, city.y, 2)) {
    if (t.cityId !== null) continue;
    t.terrain = 'forest'; t.resource = null; t.improvement = null; t.village = false; t.ruin = false; t.owner = city.id;
  }
  s.units = s.units.filter((u) => Math.max(Math.abs(u.x - city.x), Math.abs(u.y - city.y)) > 2);
  s.players[me].stars = 50;
  s.current = me;
  return { s, me, foe: 1 - me, city };
}
const at = (s: GameState, c: City, dx: number, dy: number): Tile => tileAt(s, c.x + dx, c.y + dy)!;
/** A tile of the capital's 5x5 square, mirrored inward if it would leave the map. */
const near = (s: GameState, c: City, dx: number, dy: number): Tile =>
  at(s, c, c.x + dx < 0 || c.x + dx >= s.size ? -dx : dx, c.y + dy < 0 || c.y + dy >= s.size ? -dy : dy);

test('Pemmican: Cree wounded heal 2 HP outside their borders, not inside', () => {
  const { s, me, foe, city } = setup();
  const home = near(s, city, 1, 0);
  const inU = spawnUnit(s, 'warrior', me, home.x, home.y, null);
  inU.hp = 3;
  const out = s.tiles.find((t) => t.owner === null && t.terrain === 'field' && !s.units.some((u) => u.x === t.x && u.y === t.y))!;
  const outU = spawnUnit(s, 'warrior', me, out.x, out.y, null);
  outU.hp = 3;
  const out2 = s.tiles.find((t) => t.owner === null && t.terrain === 'field' && t !== out && !s.units.some((u) => u.x === t.x && u.y === t.y))!;
  const foeU = spawnUnit(s, 'warrior', foe, out2.x, out2.y, null);
  foeU.hp = 3;
  mech.turnStart!(s, me);
  assert.equal(outU.hp, 3 + PEMMICAN_HEAL, 'outside the borders');
  assert.equal(inU.hp, 3, 'not at home');
  assert.equal(foeU.hp, 3, 'not the enemy');
  outU.hp = maxHp(outU) - 1;
  mech.turnStart!(s, me);
  assert.equal(outU.hp, maxHp(outU), 'never past full');
  mech.turnStart!(s, foe);
  assert.equal(foeU.hp, 3, 'only the Cree carry pemmican');
});

test('Trading posts: placement, rising cost, and spacing', () => {
  const { s, me, foe, city } = setup();
  const a = near(s, city, 1, 1);
  const act = tileActions(s, me, a).find((x) => x.id === 'mech:post');
  assert.ok(act && act.enabled, 'offered on forest in the borders');
  assert.equal(act.cost, POST_COST);
  const before = s.players[me].stars;
  assert.ok(doAction(s, me, a, 'mech:post'));
  assert.equal(a.improvement, 'tradingpost');
  assert.equal(s.players[me].stars, before - POST_COST);
  assert.equal(postCost(s, me), POST_COST + POST_STEP);
  // not next to another post
  const b = near(s, city, 2, 2);
  assert.match(postWhy(s, me, b)!, /Too close/);
  const c = near(s, city, -1, -1);
  const act2 = tileActions(s, me, c).find((x) => x.id === 'mech:post')!;
  assert.equal(act2.cost, POST_COST + POST_STEP);
  assert.ok(doAction(s, me, c, 'mech:post'));
  assert.equal(postCost(s, me), POST_COST + 2 * POST_STEP);
  assert.equal(posts(s, me).length, 2);
  // a field away from water is no place for one; a field on the shore is
  const d = near(s, city, -2, 2);
  d.terrain = 'field';
  for (const n of neighbors(s, d.x, d.y)) if (n.terrain === 'shallow' || n.terrain === 'ocean') n.terrain = 'field';
  assert.match(postWhy(s, me, d)!, /forest or shore/);
  const w = neighbors(s, d.x, d.y).find((n) => n.cityId === null && n.improvement === null && n !== a && n !== c)!;
  w.terrain = 'shallow';
  assert.equal(postWhy(s, me, d), null, 'a shore field');
  // not on a resource, a city, an improvement, or outside the borders
  d.resource = 'fruit'; assert.ok(postWhy(s, me, d)); d.resource = null;
  assert.ok(postWhy(s, me, tileAt(s, city.x, city.y)!));
  d.improvement = 'farm'; assert.ok(postWhy(s, me, d)); d.improvement = null;
  const outside = s.tiles.find((x) => tileOwnerPlayer(s, x) === null && x.terrain === 'forest')!;
  assert.match(postWhy(s, me, outside)!, /borders/);
  assert.equal(tileActions(s, foe, d).some((x) => x.id === 'mech:post'), false, 'only the Cree build them');
});

test('Trading post income: +1★, +1★ per animal, at most 3★', () => {
  const { s, me, city } = setup();
  const a = near(s, city, 1, 1);
  assert.ok(doAction(s, me, a, 'mech:post'));
  assert.equal(postStars(s, a), 1);
  assert.equal(postIncome(s, me), 1);
  const ring = neighbors(s, a.x, a.y).filter((t) => t.cityId === null && t !== a);
  ring[0].resource = 'animal';
  assert.equal(postStars(s, a), 2);
  ring[1].resource = 'animal'; ring[2].resource = 'animal'; ring[3].resource = 'animal';
  assert.equal(postStars(s, a), POST_CAP, 'capped');
  assert.equal(mech.income!(s, me), POST_CAP);
});

test('Contact: foreign units and traders beside a post pay +1★ each, at most 3★, and lose nothing', () => {
  const { s, me, foe, city } = setup();
  const a = near(s, city, 1, 1);
  assert.ok(doAction(s, me, a, 'mech:post'));
  assert.equal(contactIncome(s, me), 0);
  const ring = neighbors(s, a.x, a.y).filter((t) => t.cityId === null && t !== a);
  const foeStars = s.players[foe].stars;
  const t1 = spawnUnit(s, 'trader', foe, ring[0].x, ring[0].y, null);
  const hp = t1.hp;
  assert.equal(contactIncome(s, me), 1);
  spawnUnit(s, 'warrior', me, ring[1].x, ring[1].y, null);
  assert.equal(contactIncome(s, me), 1, 'your own units are no visitors');
  spawnUnit(s, 'warrior', foe, ring[2].x, ring[2].y, null);
  spawnUnit(s, 'archer', foe, ring[3].x, ring[3].y, null);
  spawnUnit(s, 'rider', foe, ring[4].x, ring[4].y, null);
  assert.equal(visitors(s, me).length, 4);
  assert.equal(contactIncome(s, me), CONTACT_CAP, 'capped');
  assert.equal(mech.income!(s, me), 1 + CONTACT_CAP);
  s.turn = 3;
  mech.turnStart!(s, me);
  assert.equal(s.players[foe].stars, foeStars, 'the visitors pay nothing');
  assert.equal(t1.hp, hp);
});

test('Winter Count: every 10 turns each city grows, unless a city was lost', () => {
  const { s, me, foe, city } = setup();
  const pop = city.pop, lvl = city.level;
  s.turn = 9;
  mech.turnStart!(s, me);
  assert.equal(winters(s, me).length, 0, 'not yet');
  s.turn = 10;
  mech.turnStart!(s, me);
  assert.equal(winters(s, me).length, 1);
  assert.equal(winters(s, me)[0].good, true);
  assert.ok(city.pop === pop + 1 || city.level > lvl, 'the city grew');
  // a city is lost in the next ten turns: a hard winter
  const other = s.cities.find((c) => c.owner === foe)!;
  other.owner = me; // a second Cree city, then lost
  s.turn = 14;
  const before = other.owner;
  other.owner = foe;
  mech.cityCaptured!(s, me, other, before);
  assert.equal(hardWinter(s, me), true);
  const pop2 = city.pop, lvl2 = city.level;
  s.turn = 20;
  mech.turnStart!(s, me);
  assert.equal(winters(s, me).length, 2);
  assert.equal(winters(s, me)[1].good, false, 'denied');
  assert.equal(city.pop, pop2);
  assert.equal(city.level, lvl2);
  // the next count is a good one again
  assert.equal(hardWinter(s, me), false);
  s.turn = 30;
  mech.turnStart!(s, me);
  assert.equal(winters(s, me)[2].good, true);
  JSON.parse(JSON.stringify(s));
});

test('AI builds trading posts when it has stars to spare', () => {
  const { s, me } = setup();
  s.players[me].human = false;
  s.players[me].stars = 60;
  aiTurn(s);
  const ps = posts(s, me);
  assert.ok(ps.length >= 1, 'built at least one');
  for (const p of ps) assert.ok(!neighbors(s, p.x, p.y).some((n) => n.improvement === 'tradingpost'), 'spaced apart');
  JSON.parse(JSON.stringify(s));
});

test('20-turn all-AI game with the Cree completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['cree', 'rome', 'vikings'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 20 && guard++ < 1000) {
    aiTurn(s);
    endTurn(s);
  }
  assert.ok(s.turn >= 20 || s.over);
  const me = s.players.findIndex((p) => p.tribe === 'cree');
  assert.ok(winters(s, me).length >= 1 || !s.cities.some((c) => c.owner === me), 'the count was kept');
});

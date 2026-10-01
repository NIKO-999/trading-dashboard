import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { doAction, tileActions, tileOwnerPlayer } from '../../src/game/rules';
import { dist, neighbors, tileAt } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { hookIncome } from '../../src/game/mech';
import {
  FEITORIA_PAY, PADRAO_COST, PADRAO_MIN_DIST, PADRAO_PAY, PADRAO_SIGHT, PORT_PAY,
  mech, padraoCap, padraoIncome, padraoStars, padraoWhy, padroes, portIncome, ports,
} from '../../src/game/mech/portugal';
import type { GameState, Tile, Unit } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 7, human: 'portugal', opponents: ['rome'], mode: 'perfection', mapSize: 'huge' });
  const me = s.players.findIndex((p) => p.tribe === 'portugal');
  s.players[me].stars = 50;
  s.current = me;
  return { s, me, foe: 1 - me };
}

const myCities = (s: GameState, me: number) => s.cities.filter((c) => c.owner === me);
const farFromAll = (s: GameState, t: Tile, d: number) => s.cities.every((c) => dist(c.x, c.y, t.x, t.y) >= d);

/** A clean far shore: an open unowned field `land`, with shallow water `sea` beside it and nothing standing on either. */
function shore(s: GameState, me: number, skip: Tile[] = []): { land: Tile; sea: Tile } {
  const land = s.tiles.find((t) => t.x > 0 && t.y > 0 && t.x < s.size - 1 && t.y < s.size - 1 && !skip.some((k) => dist(k.x, k.y, t.x, t.y) <= 2)
    && t.owner === null && farFromAll(s, t, PADRAO_MIN_DIST + 1) && neighbors(s, t.x, t.y).every((n) => n.owner === null && n.cityId === null))!;
  assert.ok(land, 'the map has a far shore');
  land.terrain = 'field'; land.resource = null; land.improvement = null; land.village = false; land.ruin = false;
  const sea = neighbors(s, land.x, land.y)[0];
  sea.terrain = 'shallow'; sea.resource = null; sea.improvement = null; sea.village = false; sea.ruin = false;
  s.units = s.units.filter((u) => !((u.x === land.x && u.y === land.y) || (u.x === sea.x && u.y === sea.y)));
  return { land, sea };
}

function boatAt(s: GameState, me: number, t: Tile): Unit {
  const u = spawnUnit(s, 'warrior', me, t.x, t.y, null);
  u.carrying = 'warrior'; u.kind = 'boat';
  return u;
}

test('Feitorias: every Portuguese port pays +1★ a turn', () => {
  const { s, me, foe } = setup();
  const own = s.tiles.filter((t) => tileOwnerPlayer(s, t) === me && t.cityId === null).slice(0, 2);
  assert.equal(portIncome(s, me), 0);
  own[0].improvement = 'port';
  own[1].improvement = 'port';
  assert.equal(ports(s, me).length, 2);
  assert.equal(portIncome(s, me), 2 * PORT_PAY);
  assert.equal(mech.income!(s, me), 2);
  assert.ok(hookIncome(s, me) >= 2);
  const theirs = s.tiles.find((t) => tileOwnerPlayer(s, t) === foe && t.cityId === null)!;
  theirs.improvement = 'port';
  assert.equal(portIncome(s, me), 2, 'only ports in your borders');
  assert.equal(mech.income!(s, foe), 0, 'only Portugal gets it');
});

test('Padrões: placement needs a ship beside unclaimed land far from your cities', () => {
  const { s, me, foe } = setup();
  const { land, sea } = shore(s, me);
  // no ship yet: not offered at all
  assert.equal(tileActions(s, me, land).some((a) => a.id === 'mech:padrao'), false);
  assert.match(padraoWhy(s, me, land)!, /ships beside/);
  const boat = boatAt(s, me, sea);
  const act = tileActions(s, me, land).find((a) => a.id === 'mech:padrao');
  assert.ok(act && act.enabled, 'offered beside the boat');
  assert.equal(act.cost, PADRAO_COST);
  // an enemy ship does not count
  boat.owner = foe;
  assert.ok(padraoWhy(s, me, land));
  boat.owner = me;
  // claimed land is refused
  land.owner = s.cities.find((c) => c.owner === foe)!.id;
  assert.match(padraoWhy(s, me, land)!, /claimed/);
  land.owner = null;
  // too close to a Portuguese city is refused
  const c = myCities(s, me)[0];
  const [cx, cy] = [c.x, c.y];
  c.x = land.x + PADRAO_MIN_DIST - 1; c.y = land.y;
  assert.match(padraoWhy(s, me, land)!, /tiles from your cities/);
  c.x = land.x + PADRAO_MIN_DIST; // exactly the minimum is fine
  assert.equal(padraoWhy(s, me, land), null);
  c.x = cx; c.y = cy;
  // not on water or a mountain
  land.terrain = 'mountain'; assert.ok(padraoWhy(s, me, land)); land.terrain = 'field';
  assert.ok(padraoWhy(s, me, sea), 'not at sea');
  // raise it
  const before = s.players[me].stars;
  assert.ok(doAction(s, me, land, 'mech:padrao'));
  assert.equal(land.improvement, 'padrao');
  assert.equal(s.players[me].stars, before - PADRAO_COST);
  assert.equal(padroes(s, me).length, 1);
  assert.equal(tileOwnerPlayer(s, land), null, 'it claims no border');
  // only Portugal raises them
  assert.equal(tileActions(s, foe, land).some((a) => a.id === 'mech:padrao'), false);
  JSON.parse(JSON.stringify(s));
});

test('Padrões: at most one per Portuguese city', () => {
  const { s, me } = setup();
  const cap = padraoCap(s, me);
  assert.equal(cap, myCities(s, me).length);
  const used: Tile[] = [];
  for (let i = 0; i < cap; i++) {
    const { land, sea } = shore(s, me, used);
    boatAt(s, me, sea);
    assert.ok(doAction(s, me, land, 'mech:padrao'), `padrão ${i + 1}`);
    used.push(land);
  }
  const { land, sea } = shore(s, me, used);
  boatAt(s, me, sea);
  assert.match(padraoWhy(s, me, land)!, /One padrão per city/);
  assert.equal(tileActions(s, me, land).find((a) => a.id === 'mech:padrao')?.enabled, false);
  assert.ok(!doAction(s, me, land, 'mech:padrao'));
  assert.equal(padroes(s, me).length, cap);
});

test('Padrões pay +1★, +1★ more on the coast, and keep the land around them in sight', () => {
  const { s, me, foe } = setup();
  const { land, sea } = shore(s, me);
  boatAt(s, me, sea);
  assert.ok(doAction(s, me, land, 'mech:padrao'));
  assert.equal(padraoStars(s, land), PADRAO_PAY + FEITORIA_PAY, 'a coastal feitoria');
  assert.equal(padraoIncome(s, me), 2);
  // inland it pays the base only
  for (const n of neighbors(s, land.x, land.y)) { n.terrain = 'field'; }
  assert.equal(padraoStars(s, land), PADRAO_PAY);
  sea.terrain = 'shallow';
  // vision: forget the area, then the turn start charts it again
  const p = s.players[me];
  const ring = s.tiles.filter((t) => dist(t.x, t.y, land.x, land.y) <= PADRAO_SIGHT);
  const beyond = s.tiles.filter((t) => dist(t.x, t.y, land.x, land.y) === PADRAO_SIGHT + 1 && s.units.every((u) => u.owner !== me || dist(u.x, u.y, t.x, t.y) > 3) && farFromAll(s, t, 4));
  for (const t of [...ring, ...beyond]) p.explored[t.y * s.size + t.x] = false;
  mech.turnStart!(s, me);
  assert.ok(ring.every((t) => p.explored[t.y * s.size + t.x]), 'all within 2 tiles is seen');
  assert.ok(beyond.every((t) => !p.explored[t.y * s.size + t.x]), 'not further');
  // through a real turn: income is paid
  const before = p.stars;
  endTurn(s); for (let i = 0; i < 4 && s.current !== me; i++) endTurn(s);
  assert.ok(p.stars - before >= padraoIncome(s, me));
  // another empire claiming the land pulls the pillar down
  land.owner = s.cities.find((c) => c.owner === foe)!.id;
  mech.turnStart!(s, me);
  assert.equal(land.improvement, null);
  assert.equal(padraoIncome(s, me), 0);
});

test('AI raises a padrão from a boat beside a far shore', () => {
  const { s, me } = setup();
  s.players[me].human = false;
  const { sea } = shore(s, me);
  const b = boatAt(s, me, sea);
  b.moved = b.attacked = false;
  s.players[me].stars = 20;
  assert.ok(mech.ai!(s, me));
  assert.ok(padroes(s, me).length === 1);
  assert.equal(s.players[me].stars, 20 - PADRAO_COST);
  assert.equal(dist(padroes(s, me)[0].x, padroes(s, me)[0].y, b.x, b.y), 1, 'beside the boat');
  aiTurn(s);
  JSON.parse(JSON.stringify(s));
});

test('20-turn all-AI game with Portugal completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['portugal', 'rome', 'vikings'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 20 && guard++ < 1000) {
    aiTurn(s);
    endTurn(s);
  }
  assert.ok(s.turn >= 20 || s.over);
  const pid = s.players.findIndex((p) => p.tribe === 'portugal');
  for (const t of padroes(s, pid)) assert.equal(tileOwnerPlayer(s, t) === null || tileOwnerPlayer(s, t) === pid, true);
  console.log(`portugal raised ${Number(s.players[pid].mech?.raised ?? 0)} padrões in 20 turns`);
});

test('AI steers an idle boat toward a far shore', () => {
  const { s, me } = setup();
  s.players[me].human = false;
  const { land } = shore(s, me);
  // open water three tiles off the shore
  const path: Tile[] = [];
  for (let d = 1; d <= 3; d++) {
    const t = tileAt(s, land.x, land.y + d) ?? tileAt(s, land.x, land.y - d)!;
    t.terrain = 'shallow'; t.resource = null; t.village = false; t.ruin = false; t.improvement = null; t.owner = null;
    s.units = s.units.filter((u) => !(u.x === t.x && u.y === t.y));
    path.push(t);
  }
  // the boat starts in open sea: nothing but water round its first two stops
  for (const t of [path[1], path[2]]) for (const n of neighbors(s, t.x, t.y)) if (n !== land && dist(n.x, n.y, land.x, land.y) > 1) { n.terrain = 'shallow'; n.owner = null; n.improvement = null; n.village = false; n.ruin = false; s.units = s.units.filter((u) => !(u.x === n.x && u.y === n.y)); }
  for (const p of s.players) p.explored.fill(true);
  const b = boatAt(s, me, path[2]);
  b.moved = b.attacked = false;
  s.players[me].stars = 20;
  const d0 = dist(b.x, b.y, land.x, land.y);
  assert.ok(mech.ai!(s, me), 'a step was taken');
  assert.ok(dist(b.x, b.y, land.x, land.y) < d0, 'closer to the shore');
  // keep going until the pillar is up (raising needs no move)
  assert.equal(mech.ai!(s, me) && padroes(s, me).length === 0, false, 'one steer a turn');
  // next turn it closes in and raises the pillar
  s.turn++; b.moved = b.attacked = false;
  for (let i = 0; i < 4 && mech.ai!(s, me); i++);
  assert.equal(padroes(s, me).length, 1);
});

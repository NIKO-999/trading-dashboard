import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { aiTurn } from '../../src/game/ai';
import { doAction, moveOptions, moveUnit, tileActions } from '../../src/game/rules';
import { endTurn } from '../../src/game/turn';
import { neighbors, tileAt } from '../../src/game/grid';
import { SEASON, alignment, lighthouses, mech, seasonDir, tradeReport, windDir } from '../../src/game/mech/swahili';
import type { GameState, Tile } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 7, human: 'swahili', opponents: ['japan', 'zulu'], mode: 'perfection' });
  const me = s.players.findIndex((p) => p.tribe === 'swahili');
  for (const p of s.players) p.explored.fill(true);
  const city = s.cities.find((c) => c.owner === me)!;
  s.players[me].stars = 50;
  return { s, me, city };
}
const fresh = <T extends { moved: boolean; attacked: boolean }>(u: T): T => { u.moved = false; u.attacked = false; return u; };
const setWind = (s: GameState, dir: number) => { s.mech = { ...(s.mech ?? {}), wind: { epoch: Math.floor(s.turn / SEASON), dir } }; };

/** A horizontal sea lane (row y, x from x0 to x0+n) far from cities, all in Swahili territory. */
function lane(s: GameState, cityId: number, n = s.size) {
  const y = Math.floor(s.size / 2), x0 = 0;
  s.units = s.units.filter((u) => u.y !== y && u.y !== y - 1 && u.y !== y + 1);
  for (let dy = -1; dy <= 1; dy++) for (let x = x0; x < x0 + n; x++) {
    const t = tileAt(s, x, y + dy)!;
    t.terrain = 'shallow'; t.resource = null; t.improvement = null; t.village = false; t.cityId = null; t.owner = cityId; t.data = undefined;
  }
  return { y, x0, n };
}
/** A coastal open field inside the city's borders. */
function coast(s: GameState, cityId: number): Tile {
  const city = s.cities.find((c) => c.id === cityId)!;
  const t = tileAt(s, city.x + 2, city.y) ?? tileAt(s, city.x - 2, city.y)!;
  const sea = tileAt(s, t.x + (t.x > city.x ? 1 : -1), t.y)!;
  for (const n of [t, sea]) { n.resource = null; n.improvement = null; n.village = false; n.data = undefined; n.owner = cityId; n.cityId = null; }
  t.terrain = 'field';
  sea.terrain = 'shallow';
  s.units = s.units.filter((u) => !(u.x === t.x && u.y === t.y) && !(u.x === sea.x && u.y === sea.y));
  return t;
}
const nextTurnOf = (s: GameState, me: number) => { do endTurn(s); while (s.current !== me); };

test('the wind is deterministic, one of four directions, and turns every season', () => {
  const { s } = setup();
  const seen = new Set<number>();
  for (let e = 0; e < 12; e++) {
    const d = seasonDir(s.seed, e);
    assert.ok(d >= 0 && d < 4);
    if (e > 0) assert.notEqual(d, seasonDir(s.seed, e - 1), 'the wind turns');
    assert.equal(d, seasonDir(s.seed, e));
    seen.add(d);
  }
  assert.ok(seen.size >= 3);
  assert.equal(windDir(s), seasonDir(s.seed, 0));
  s.turn = SEASON;
  assert.equal(windDir(s), seasonDir(s.seed, 1));
  assert.equal(alignment(1, 1, 1), 1);
  assert.equal(alignment(1, -1, 0), -1);
  assert.equal(alignment(1, 0, 1), 0);
});

test('ships sail farther with the wind than against it (Swahili most)', () => {
  const { s, me, city } = setup();
  const { y, x0 } = lane(s, city.id);
  const ship = fresh(spawnUnit(s, 'ship', me, x0 + 5, y, null));
  setWind(s, 1); // east
  const reach = (dx: number) => Math.max(0, ...moveOptions(s, ship).filter((o) => o.y === y && Math.sign(o.x - ship.x) === dx).map((o) => Math.abs(o.x - ship.x)));
  const withWind = reach(1), against = reach(-1);
  assert.ok(withWind > against, `with ${withWind} > against ${against}`);
  assert.ok(withWind >= 5, 'a 3-move galley (+1 Swahili) covers 5+ tiles with the wind');
  setWind(s, 3); // west
  assert.ok(reach(-1) > reach(1), 'and westward with a west wind');
  // a foreign ship is helped and hindered less
  s.units = [];
  const foe = fresh(spawnUnit(s, 'ship', 1 - me, x0 + 5, y + 1, null));
  setWind(s, 1);
  const fr = (dx: number) => Math.max(0, ...moveOptions(s, foe).filter((o) => o.y === y + 1 && Math.sign(o.x - foe.x) === dx).map((o) => Math.abs(o.x - foe.x)));
  assert.ok(fr(1) > fr(-1), `foe with ${fr(1)} against ${fr(-1)}`);
  assert.ok(fr(1) < withWind, `foe ${fr(1)} swahili ${withWind}`);
});

test('a human builds a lighthouse on the coast, then calls the wind from it', () => {
  const { s, me, city } = setup();
  const t = coast(s, city.id);
  const act = tileActions(s, me, t).find((a) => a.id === 'mech:lighthouse');
  assert.ok(act?.enabled, 'lighthouse offered on a coastal tile');
  const before = s.players[me].stars;
  assert.ok(doAction(s, me, t, 'mech:lighthouse'));
  assert.equal(t.improvement, 'lighthouse');
  assert.equal(s.players[me].stars, before - act!.cost, 'the core charged the cost');
  assert.equal(lighthouses(s, me).length, 1);
  const cur = windDir(s);
  const acts = tileActions(s, me, t).filter((a) => a.id.startsWith('mech:wind:'));
  assert.equal(acts.length, 3);
  const want = (cur + 2) % 4;
  const a = acts.find((x) => x.id === `mech:wind:${want}`)!;
  assert.ok(a.enabled);
  assert.ok(doAction(s, me, t, a.id));
  assert.equal(windDir(s), want);
  assert.equal(s.players[me].stars, before - act!.cost - a.cost);
  assert.equal(tileActions(s, me, t).find((x) => x.id.startsWith('mech:wind:'))?.enabled, false, 'once per turn per lighthouse');
  // and the next season resets it
  s.turn += SEASON;
  assert.equal(windDir(s), seasonDir(s.seed, Math.floor(s.turn / SEASON)));
});

test('inland or foreign ground gets no lighthouse', () => {
  const { s, me, city } = setup();
  const t = coast(s, city.id);
  for (const n of neighbors(s, t.x, t.y)) if (n.terrain === 'shallow') n.terrain = 'field';
  assert.equal(tileActions(s, me, t).find((a) => a.id === 'mech:lighthouse')?.enabled, false);
  assert.equal(doAction(s, me, t, 'mech:lighthouse'), false);
});

test('trade pays x2 with the wind, x0.5 against, x1 across, from the ship\'s last move', () => {
  const { s, me, city } = setup();
  const { y, x0 } = lane(s, city.id);
  const fish = tileAt(s, x0 + 8, y)!;
  fish.resource = 'fish';
  const run = (dir: number) => {
    const ship = fresh(spawnUnit(s, 'boat', me, x0 + 5, y + 1, null));
    setWind(s, dir);
    ship.moved = false;
    assert.ok(moveUnit(s, ship, x0 + 7, y + 1), 'sails toward the fish');
    return { ship, r: tradeReport(s, me) };
  };
  let o = run(1); // east: with the wind
  assert.equal(o.r.total, 4);
  assert.equal(mech.income!(s, me), 4 + 3 * s.cities.filter((k) => k.owner === me).length);
  s.units = s.units.filter((u) => u !== o.ship);
  o = run(3); // against
  assert.equal(o.r.total, 1);
  s.units = s.units.filter((u) => u !== o.ship);
  o = run(0); // north: across
  assert.equal(o.r.total, 2);
  // a ship that stood still last turn earns nothing
  s.turn += 3;
  assert.equal(tradeReport(s, me).total, 0);
  s.turn -= 3;
  // two ships beside the same tile pay once
  const twin = fresh(spawnUnit(s, 'boat', me, x0 + 5, y - 1, null));
  assert.ok(moveUnit(s, twin, x0 + 7, y - 1));
  assert.equal(tradeReport(s, me).serves.length, 1);
});

test('trade income is paid into the treasury at the start of the Swahili turn', () => {
  const { s, me, city } = setup();
  const { y, x0 } = lane(s, city.id);
  tileAt(s, x0 + 8, y)!.resource = 'whale';
  setWind(s, 1);
  const ship = fresh(spawnUnit(s, 'boat', me, x0 + 5, y + 1, null));
  s.current = me;
  assert.ok(moveUnit(s, ship, x0 + 7, y + 1));
  const stars = s.players[me].stars;
  const others = 0;
  setWind(s, 1);
  nextTurnOf(s, me);
  const gained = s.players[me].stars - stars;
  assert.ok(gained >= 6 + others, `whale x2 = 6 stars (gained ${gained})`);
  assert.equal(s.players[me].mech?.trades, 1);
});

test('AI Swahili sails to trade, and calls the wind from a lighthouse when it helps', () => {
  const { s, me, city } = setup();
  s.players[me].human = false;
  const { y, x0 } = lane(s, city.id);
  const h = coast(s, city.id);
  h.improvement = 'lighthouse';
  tileAt(s, x0 + 8, y)!.resource = 'fish';
  s.units = [];
  const ship = fresh(spawnUnit(s, 'ship', me, x0 + 5, y + 1, null));
  setWind(s, 3); // west: away from the fish
  s.players[me].stars = 3; // enough for the wind, too little for the AI's ordinary economy to harvest the fish
  s.current = me;
  aiTurn(s);
  assert.equal(s.players[me].mech?.windCalls, 1, 'the AI called the wind');
  assert.ok([0, 1].includes(windDir(s)), 'north or east both favour a diagonal run to the fish');
  assert.ok(ship.data?.trade, 'the ship sailed to trade');
  assert.equal(tradeReport(s, me).total, 4);
});

test('20-turn all-AI game with Swahili completes and trades', () => {
  const s = createGame({ seed: 11, human: 'swahili', opponents: ['japan', 'zulu'], mode: 'perfection' });
  for (const p of s.players) p.human = false;
  const me = s.players.findIndex((p) => p.tribe === 'swahili');
  for (let i = 0; i < 20 * s.players.length && !s.over; i++) { aiTurn(s); endTurn(s); }
  assert.ok(s.turn >= 10);
  const m = s.players[me].mech!;
  assert.ok((m.trades as number) > 0 || (m.windCalls as number) > 0 || lighthouses(s, me).length > 0, `the AI used the mechanic ${JSON.stringify(m)}`);
  JSON.parse(JSON.stringify(s));
});

test('a human launches a dhow from a port into the sea beside it', () => {
  const { s, me, city } = setup();
  const t = coast(s, city.id);
  t.improvement = 'port';
  const act = tileActions(s, me, t).find((a) => a.id === 'mech:dhow');
  assert.ok(act?.enabled, 'Launch Dhow offered on the port');
  const before = s.players[me].stars, ships = s.units.filter((u) => u.owner === me).length;
  assert.ok(doAction(s, me, t, 'mech:dhow'));
  assert.equal(s.players[me].stars, before - act!.cost);
  const boat = s.units.filter((u) => u.owner === me).slice(ships)[0];
  assert.ok(boat && boat.kind === 'boat');
  assert.equal(tileAt(s, boat.x, boat.y)!.terrain, 'shallow');
});

test('all-AI games: Swahili ships actually earn trade income', () => {
  let trades = 0, calls = 0;
  for (const seed of [3, 11, 21]) {
    const s = createGame({ seed, human: 'swahili', opponents: ['japan', 'zulu'], mode: 'perfection' });
    for (const p of s.players) p.human = false;
    const me = s.players.findIndex((p) => p.tribe === 'swahili');
    for (let i = 0; i < 20 * s.players.length && !s.over; i++) { aiTurn(s); endTurn(s); }
    trades += (s.players[me].mech?.trades as number) ?? 0;
    calls += (s.players[me].mech?.windCalls as number) ?? 0;
  }
  assert.ok(trades > 0, `trades ${trades}, wind calls ${calls}`);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { aiStep } from '../src/game/ai';
import { drain } from '../src/game/events';
import { createGame, foundCity, spawnUnit } from '../src/game/mapgen';
import { attackOptions, cityIncome, doAction, income, moveOptions, tileActions, trainCost, unitAt } from '../src/game/rules';
import { endTurn, startTurn } from '../src/game/turn';
import type { GameState, TribeId, Unit, UnitKind } from '../src/game/types';
import {
  allRoutes, FOREIGN_BONUS, liveRoutes, MAX_ROUTES, RAID_BASE, routeCap, routeIncome, routesPerCity, routeYield, TRADERS, traderName, tradeSweep,
} from '../src/game/trade';
import { UNITS } from '../src/data/units';
import { TRIBE_IDS } from '../src/data/tribes';
import { drawUnitSprite } from '../src/render/units';
import { drawTradeRoutes } from '../src/render/trade';

/** A blank field map (every city, unit, resource and border cleared) with `tribes` knowing Roads and Sailing and rich. */
function sandbox(tribes: TribeId[], opts: Partial<Parameters<typeof createGame>[0]> = {}): GameState {
  const s = createGame({ seed: 5, human: tribes[0], opponents: tribes.slice(1), mode: 'perfection', naturals: false, ...opts }); // exact star counts: no Natural Wonder to discover
  for (const t of s.tiles) Object.assign(t, { terrain: 'field', resource: null, improvement: null, road: false, village: false, ruin: false, cityId: null, owner: null, data: undefined });
  s.cities = [];
  s.units = [];
  for (const p of s.players) { p.explored.fill(true); p.stars = 100; p.techs.push('riding', 'roads', 'fishing', 'sailing'); }
  return s;
}
const tile = (s: GameState, x: number, y: number) => s.tiles[y * s.size + x];
const acts = (s: GameState, pid: number, x: number, y: number) => tileActions(s, pid, tile(s, x, y));
function merchant(s: GameState, pid: number, kind: UnitKind, x: number, y: number, home: number): Unit {
  const u = spawnUnit(s, kind, pid, x, y, home);
  u.moved = u.attacked = false;
  return u;
}
/** Two cities of player 0 seven steps apart on one row, and a Trader from the first standing beside the second. */
function twoCities(tribes: TribeId[] = ['egypt', 'rome']) {
  const s = sandbox(tribes);
  const a = foundCity(s, 1, 1, 0, true);
  const b = foundCity(s, 8, 1, 0, false);
  const u = merchant(s, 0, 'trader', 7, 1, a.id);
  return { s, a, b, u };
}
const toasts = () => drain().filter((e) => e.type === 'toast').map((e) => (e as { text: string }).text);

test('merchants: a Trader (Roads) and a Trade Ship (Sailing), weak, never capturing, trained in a city', () => {
  assert.equal(UNITS.trader.atk, 0);
  assert.equal(UNITS.tradeship.atk, 0);
  assert.ok(UNITS.trader.def <= 1 && UNITS.tradeship.def <= 1);
  const s = sandbox(['egypt', 'rome']);
  const a = foundCity(s, 1, 1, 0, true);
  s.players[0].techs = [];
  let train = acts(s, 0, 1, 1).find((x) => x.id === 'train:trader')!;
  assert.equal(train.needs, 'roads');
  s.players[0].techs.push('roads');
  train = acts(s, 0, 1, 1).find((x) => x.id === 'train:trader')!;
  assert.ok(train.enabled && train.label === 'Camel Caravan');
  assert.ok(doAction(s, 0, tile(s, 1, 1), 'train:trader'));
  assert.equal(unitAt(s, 1, 1)?.kind, 'trader');
  assert.equal(a.units, 1);
  // no coast: no Trade Ship; with a shallow beside the city it is launched onto the water
  s.players[0].techs.push('sailing');
  assert.equal(acts(s, 0, 1, 1).find((x) => x.id === 'train:tradeship')?.reason, 'No free water beside the city');
  tile(s, 2, 2).terrain = 'shallow';
  assert.ok(doAction(s, 0, tile(s, 1, 1), 'train:tradeship'));
  assert.equal(unitAt(s, 2, 2)?.kind, 'tradeship');
  // weak in combat and can't take anything
  const t = unitAt(s, 1, 1)!;
  t.moved = t.attacked = false;
  spawnUnit(s, 'warrior', 1, 1, 2, null);
  assert.deepEqual(attackOptions(s, t), []);
  tile(s, 5, 5).village = true;
  const v = merchant(s, 0, 'trader', 5, 5, a.id);
  assert.ok(!acts(s, 0, v.x, v.y).some((x) => x.id === 'capture'), 'a merchant claims no village');
  // a Trade Ship stays on the water
  const ship = unitAt(s, 2, 2)!;
  ship.moved = false;
  assert.ok(moveOptions(s, ship).length === 0, 'no water to sail and no landing');
});

test('route creation and payout: the trader settles, a dotted trail is stored, both ends are paid every turn', () => {
  const { s, a, b, u } = twoCities();
  const incA = cityIncome(s, a), incB = cityIncome(s, b), total = income(s, 0);
  const act = acts(s, 0, u.x, u.y).find((x) => x.id === `trade:route:${b.id}`)!;
  assert.ok(act.enabled, act.reason ?? '');
  assert.equal(act.label, 'Establish Trade Route');
  assert.match(act.desc, /\+2★/);
  drain();
  assert.ok(doAction(s, 0, tile(s, u.x, u.y), act.id));
  assert.ok(!s.units.includes(u), 'the trader is used up');
  assert.equal(a.units, 0, 'its slot is freed');
  const [r] = allRoutes(s);
  assert.equal(r.path.length - 1, 7);
  assert.equal(r.path[0], 1 * s.size + 1);
  assert.equal(r.path.at(-1), 1 * s.size + 8);
  // seven steps: 1 base + 1 for a long trail at each end
  assert.equal(routeYield(s, r, a.id), 2);
  assert.equal(cityIncome(s, a), incA + 2);
  assert.equal(cityIncome(s, b), incB + 2);
  assert.equal(income(s, 0), total + 4);
  assert.equal(routeIncome(s, 0), 4);
  assert.ok(toasts().some((t) => t.startsWith('Trade route opened')));
  // paid at the start of the turn
  s.current = 0;
  s.turn = 1;
  const before = s.players[0].stars;
  startTurn(s);
  assert.equal(s.players[0].stars - before, total + 4);
  JSON.parse(JSON.stringify(s));
});

test('foreign routes pay more; with Diplomacy on they need a treaty, and a declared war cuts them', () => {
  // Diplomacy off: any foreign city trades
  const s = sandbox(['egypt', 'rome']);
  const a = foundCity(s, 1, 1, 0, true);
  const f = foundCity(s, 5, 1, 1, true);
  const u = merchant(s, 0, 'trader', 4, 1, a.id);
  assert.ok(doAction(s, 0, tile(s, 4, 1), `trade:route:${f.id}`));
  const [r] = allRoutes(s);
  assert.equal(routeYield(s, r, a.id), 1 + FOREIGN_BONUS);
  assert.equal(routeYield(s, r, f.id), 1 + FOREIGN_BONUS);
  assert.ok(!s.units.includes(u));

  // Diplomacy on: at war, no route; at peace, a route; war declared, cut
  const d = sandbox(['egypt', 'rome'], { diplomacy: true });
  const da = foundCity(d, 1, 1, 0, true);
  const df = foundCity(d, 5, 1, 1, true);
  const du = merchant(d, 0, 'trader', 4, 1, da.id);
  assert.match(acts(d, 0, 4, 1).find((x) => x.id === `trade:route:${df.id}`)!.reason!, /At war/);
  d.diplo!.pacts.push({ a: 0, b: 1, kind: 'peace', since: 0 });
  assert.ok(doAction(d, 0, tile(d, du.x, du.y), `trade:route:${df.id}`));
  assert.equal(liveRoutes(d).length, 1);
  drain();
  d.diplo!.pacts[0].declared = d.turn;
  d.diplo!.pacts[0].by = 1;
  assert.equal(routeIncome(d, 0), 0, 'a declared war stops the trade at once');
  tradeSweep(d);
  assert.equal(allRoutes(d).length, 0);
  assert.ok(toasts().some((t) => /cut: war was declared/.test(t)));
});

test('merchants cross a peace partner\'s closed borders to reach its city', () => {
  const d = sandbox(['egypt', 'rome'], { diplomacy: true });
  const da = foundCity(d, 1, 1, 0, true);
  foundCity(d, 6, 1, 1, true);
  d.diplo!.pacts.push({ a: 0, b: 1, kind: 'peace', since: 0 });
  const w = merchant(d, 0, 'warrior', 4, 1, da.id);
  w.kind = 'rider';
  assert.ok(!moveOptions(d, w).some((o) => o.x === 5 && o.y === 1), 'soldiers are kept out');
  const u = merchant(d, 0, 'trader', 4, 2, da.id);
  assert.ok(moveOptions(d, u).some((o) => o.x === 5 && o.y === 2), 'the caravan passes');
  assert.ok(!moveOptions(d, u).some((o) => o.x === 6 && o.y === 1), 'but never into the city itself');
});

test('caps: routes per city grow with its level, and each empire runs a limited number', () => {
  const { s, a, b, u } = twoCities();
  assert.equal(routesPerCity(a), 1);
  assert.ok(doAction(s, 0, tile(s, u.x, u.y), `trade:route:${b.id}`));
  const c = foundCity(s, 4, 6, 0, false);
  const u2 = merchant(s, 0, 'trader', 5, 6, a.id);
  const why = acts(s, 0, u2.x, u2.y).find((x) => x.id === `trade:route:${c.id}`)!.reason!;
  assert.match(why, /can hold 1 route/);
  a.level = 3;
  assert.equal(routesPerCity(a), 2);
  assert.ok(acts(s, 0, u2.x, u2.y).find((x) => x.id === `trade:route:${c.id}`)!.enabled);
  // the same two cities never trade twice
  a.level = 6; b.level = 6;
  const u3 = merchant(s, 0, 'trader', 7, 2, a.id);
  assert.match(acts(s, 0, u3.x, u3.y).find((x) => x.id === `trade:route:${b.id}`)!.reason!, /already trades/);
  // the empire cap: one more than its cities, never above MAX_ROUTES
  assert.equal(routeCap(s, 0), 4);
  for (let i = 0; i < 10; i++) foundCity(s, i, 9, 0, false);
  assert.equal(routeCap(s, 0), MAX_ROUTES);
});

test('capture cuts a route: a city changing hands ends its trade', () => {
  const { s, b, u } = twoCities();
  assert.ok(doAction(s, 0, tile(s, u.x, u.y), `trade:route:${b.id}`));
  const w = merchant(s, 1, 'warrior', b.x, b.y, null as unknown as number);
  w.homeCity = null;
  drain();
  assert.ok(doAction(s, 1, tile(s, b.x, b.y), 'capture'));
  assert.equal(allRoutes(s).length, 0);
  assert.ok(toasts().some((t) => /changed hands/.test(t)));
});

test('raid: an enemy soldier on the trail pillages it for Stars (Pirates loot double); merchants can be killed', () => {
  for (const tribe of ['vikings', 'pirates'] as TribeId[]) {
    const { s, a, b, u } = twoCities(['egypt', tribe]);
    assert.ok(doAction(s, 0, tile(s, u.x, u.y), `trade:route:${b.id}`));
    const r = allRoutes(s)[0];
    const loot = (RAID_BASE + routeYield(s, r, a.id) + routeYield(s, r, b.id)) * (tribe === 'pirates' ? 2 : 1);
    const raider = merchant(s, 1, 'warrior', 4, 1, null as unknown as number);
    raider.homeCity = null;
    assert.ok(!acts(s, 0, 4, 1).some((x) => x.id === 'trade:raid'), 'the owner does not raid its own trail');
    const act = acts(s, 1, 4, 1).find((x) => x.id === 'trade:raid')!;
    assert.ok(act.enabled);
    const before = s.players[1].stars;
    assert.ok(doAction(s, 1, tile(s, 4, 1), 'trade:raid'));
    assert.equal(s.players[1].stars - before, loot);
    assert.equal(allRoutes(s).length, 0);
    assert.ok(raider.attacked && raider.moved);
  }
  // a merchant on the road dies like anyone else
  const { s, u } = twoCities();
  const w = merchant(s, 1, 'warrior', 6, 1, null as unknown as number);
  w.homeCity = null;
  assert.ok(attackOptions(s, w).includes(u));
});

test('empire flavour: Mali salt tolls, Swahili monsoon, Persia Royal Road, Roman caravans, Swahili ships', () => {
  const yieldFor = (tribe: TribeId, roads = false) => {
    const { s, a, b, u } = twoCities([tribe, 'vikings']);
    if (roads) for (let x = 2; x < 8; x++) tile(s, x, 1).road = true;
    doAction(s, 0, tile(s, u.x, u.y), `trade:route:${b.id}`);
    return routeYield(s, allRoutes(s)[0], a.id);
  };
  assert.equal(yieldFor('egypt'), 2);
  assert.equal(yieldFor('mali'), 3);
  assert.equal(yieldFor('persia'), 2);
  assert.equal(yieldFor('persia', true), 3);
  assert.equal(yieldFor('swahili'), 2, 'the monsoon speeds only sea trade');
  // a sea route for the Swahili
  const s = sandbox(['swahili', 'vikings']);
  for (let x = 0; x < s.size; x++) tile(s, x, 3).terrain = 'shallow';
  const a = foundCity(s, 1, 2, 0, true);
  const b = foundCity(s, 8, 2, 0, false);
  merchant(s, 0, 'tradeship', 7, 3, a.id);
  assert.ok(doAction(s, 0, tile(s, 7, 3), `trade:route:${b.id}`));
  const r = allRoutes(s)[0];
  assert.ok(r.sea && r.path.slice(1, -1).every((i) => s.tiles[i].terrain === 'shallow'), 'the lane runs over water');
  assert.equal(routeYield(s, r, a.id), 3);
  assert.equal(trainCost(s, 0, 'tradeship'), UNITS.tradeship.cost - 2);
  const rs = sandbox(['rome', 'vikings']);
  assert.equal(trainCost(rs, 0, 'trader'), UNITS.trader.cost - 1);
  assert.equal(trainCost(rs, 1, 'trader'), UNITS.trader.cost);
});

test('per-empire art: every empire has its own named caravan and ship, and all of it draws', () => {
  assert.deepEqual(Object.keys(TRADERS).sort(), [...TRIBE_IDS].sort());
  assert.equal(TRADERS.egypt.landLook, 'camel');
  assert.equal(TRADERS.mali.landLook, 'saltcamel');
  assert.equal(TRADERS.inca.landLook, 'llama');
  assert.equal(TRADERS.inuit.landLook, 'dogsled');
  assert.equal(TRADERS.lakota.landLook, 'travois');
  assert.equal(TRADERS.mongols.landLook, 'bactrian');
  assert.equal(TRADERS.aztec.landLook, 'pochteca');
  assert.equal(TRADERS.rome.landLook, 'oxcart');
  assert.equal(TRADERS.vikings.seaLook, 'knarr');
  assert.equal(TRADERS.swahili.seaLook, 'dhow');
  assert.equal(TRADERS.pirates.seaLook, 'sloop');
  assert.equal(TRADERS.polynesia.seaLook, 'waka');
  assert.equal(TRADERS.china.seaLook, 'junk');
  assert.equal(traderName('china', 'trader'), 'Silk Porter');
  assert.equal(new Set(TRIBE_IDS.map((t) => TRADERS[t].land)).size >= 20, true, 'names are (nearly) all distinct');
  let fills = 0;
  const ctx = new Proxy({}, {
    get: (_t, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => { if (k === 'fill' || k === 'stroke') fills++; }),
    set: () => true,
  }) as unknown as CanvasRenderingContext2D;
  for (const tribe of TRIBE_IDS) for (const k of ['trader', 'tradeship'] as UnitKind[]) {
    const before = fills;
    drawUnitSprite(ctx, k, tribe, 0, 0);
    assert.ok(fills - before > 10, `${tribe} ${k}`);
  }
  const { s, b, u } = twoCities();
  doAction(s, 0, tile(s, u.x, u.y), `trade:route:${b.id}`);
  const before = fills;
  drawTradeRoutes(ctx, s, 0);
  assert.ok(fills - before >= 14, 'the dotted trail is drawn');
});

test('old saves load: no trade state, no routes, nothing breaks', () => {
  const { s } = twoCities();
  const old = JSON.parse(JSON.stringify(s)) as GameState;
  delete old.trade;
  assert.equal(routeIncome(old, 0), 0);
  tradeSweep(old);
  assert.ok(income(old, 0) > 0);
  assert.ok(acts(old, 0, 7, 1).some((a) => a.id.startsWith('trade:route:')));
  old.current = 0;
  startTurn(old);
});

test('the computer pillages an enemy trail its soldier stands on, and walks its merchant to a market', () => {
  const { s, b, u } = twoCities(['egypt', 'vikings']);
  assert.ok(doAction(s, 0, tile(s, u.x, u.y), `trade:route:${b.id}`));
  const home = foundCity(s, 4, 8, 1, true);
  const raider = merchant(s, 1, 'warrior', 4, 1, home.id);
  s.current = 1;
  for (let i = 0; i < 60 && allRoutes(s).length; i++) aiStep(s);
  assert.equal(allRoutes(s).length, 0, 'the trail was pillaged');
  assert.ok(raider.attacked);
  // a merchant heads for the best city it can trade with and opens the route there
  const t = sandbox(['egypt', 'vikings']);
  const ta = foundCity(t, 1, 1, 1, true);
  foundCity(t, 8, 1, 1, false);
  foundCity(t, 1, 8, 0, true);
  const m = merchant(t, 1, 'trader', 1, 2, ta.id);
  t.current = 1;
  for (let turn = 0; turn < 6 && !allRoutes(t).length; turn++) {
    for (let i = 0; i < 100 && aiStep(t); i++);
    m.moved = m.attacked = false;
    t.turn++;
  }
  assert.equal(allRoutes(t).length, 1, 'the AI opened a route');
});

test('a 30-turn all-AI game: merchants are trained and routes opened, and the Stars stay in range', () => {
  let routes = 0, trained = 0, share = 0, n = 0;
  for (const [seed, tribes, diplomacy] of [[3, ['mali', 'rome', 'china', 'vikings'], false], [8, ['swahili', 'persia', 'egypt', 'inca'], true]] as const) {
    const s = createGame({ seed, human: null, opponents: [...tribes], mode: 'perfection', maxTurns: 30, diplomacy });
    const seen = new Set<number>();
    for (let guard = 0; !s.over && guard < 4000; guard++) {
      for (let i = 0; i < 400 && aiStep(s); i++);
      for (const u of s.units) if ((u.kind === 'trader' || u.kind === 'tradeship') && !seen.has(u.id)) { seen.add(u.id); trained++; }
      for (const r of liveRoutes(s)) {
        assert.ok(routeYield(s, r, r.a) >= 1 && routeYield(s, r, r.a) <= 5, 'an end earns 1-5★');
        assert.ok(routeYield(s, r, r.b) >= 1 && routeYield(s, r, r.b) <= 5);
      }
      endTurn(s);
      drain();
    }
    assert.ok(s.over);
    routes += s.log.filter((l) => /open a (sea|caravan) route/.test(l.text)).length;
    for (const p of s.players) if (p.alive && !p.neutral) { share += routeIncome(s, p.id) / Math.max(1, income(s, p.id)); n++; }
    JSON.parse(JSON.stringify(s));
  }
  assert.ok(trained >= 3, `merchants trained: ${trained}`);
  assert.ok(routes >= 3, `routes opened: ${routes}`);
  assert.ok(share / n < 0.25, `trade is a side income, not the economy: ${(share / n).toFixed(2)}`);
});

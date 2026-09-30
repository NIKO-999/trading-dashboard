import assert from 'node:assert/strict';
import test from 'node:test';
import { aiStep } from '../src/game/ai';
import { drain } from '../src/game/events';
import { createGame, foundCity, revealAround, spawnUnit } from '../src/game/mapgen';
import { hookIncome, hookStat } from '../src/game/mech';
import {
  cityIncome, defenseBonus, doAction, garrisonBonus, income, moveOptions, moveUnit, removeUnit, tileActions, trainCost, unitAt, unitCap, type Action,
} from '../src/game/rules';
import { endTurn, startTurn } from '../src/game/turn';
import type { GameState, TribeId, Unit, UnitKind } from '../src/game/types';
import {
  BOUNTY, BRIDGE_COST, RECRUIT_DISCOUNT, CATCH, cityTax, FLEET_STARS, FORT_COST, FORT_DEF, isSapperFort, isUpgraded, outpostRoom, RALLY_COOLDOWN, ROLE_KINDS, ROLE_NAMES, roleKindsOf, roleName,
  roleParts, UNDERMINE_TURNS,
} from '../src/game/roles';
import { UNITS } from '../src/data/units';
import { LEVEL_COST, LEVELS, tileLevel } from '../src/game/levels';
import { CATEGORIES, TRIBE_IDS, TRIBES } from '../src/data/tribes';
import { drawUnitSprite } from '../src/render/units';
import { drawBridgeGround, drawRoleGround, drawRoleIcon, drawRoleTile } from '../src/render/roles';

/** A blank field map (every city, unit, resource and border cleared) with everyone rich and knowing every tech it needs. */
function sandbox(tribes: TribeId[], opts: Partial<Parameters<typeof createGame>[0]> = {}): GameState {
  const s = createGame({ seed: 5, human: tribes[0], opponents: tribes.slice(1), mode: 'perfection', ...opts });
  for (const t of s.tiles) Object.assign(t, { terrain: 'field', resource: null, improvement: null, road: false, village: false, ruin: false, cityId: null, owner: null, data: undefined });
  s.cities = [];
  s.units = [];
  for (const p of s.players) { p.explored.fill(true); p.stars = 100; p.techs.push('tactics', 'roads', 'farming', 'fishing', 'sailing', 'trade', 'riding', 'mining', 'smithing'); }
  return s;
}
const tile = (s: GameState, x: number, y: number) => s.tiles[y * s.size + x];
const acts = (s: GameState, pid: number, x: number, y: number) => tileActions(s, pid, tile(s, x, y));
const find = (s: GameState, pid: number, x: number, y: number, verb: string): Action | undefined => acts(s, pid, x, y).find((a) => a.id.startsWith(`role:${verb}:`));
function unit(s: GameState, pid: number, kind: UnitKind, x: number, y: number, home: number | null = null): Unit {
  const u = spawnUnit(s, kind, pid, x, y, home);
  u.moved = u.attacked = false;
  return u;
}
const run = (s: GameState, pid: number, x: number, y: number, verb: string) => {
  const a = find(s, pid, x, y, verb);
  assert.ok(a, `no ${verb} action at ${x},${y}`);
  assert.ok(a.enabled, `${verb}: ${a.reason}`);
  return doAction(s, pid, tile(s, x, y), a.id);
};

test('three empire types: every empire has one, each type has two role units', () => {
  const count = (c: string) => TRIBE_IDS.filter((id) => TRIBES[id].category === c).length;
  assert.equal(count('military'), 8);
  assert.equal(count('economy'), 11);
  assert.equal(count('naval'), 7);
  assert.deepEqual(CATEGORIES.map((c) => c.id), ['military', 'economy', 'naval']);
  assert.deepEqual(CATEGORIES.flatMap((c) => c.units).sort(), [...ROLE_KINDS].sort());
  assert.deepEqual(roleKindsOf('rome'), ['recruiter', 'sapper']);
  assert.deepEqual(roleKindsOf('mali'), ['builder', 'collector']);
  assert.deepEqual(roleKindsOf('polynesia'), ['fishfleet', 'voyager']);
  // every empire names its own two, and they mostly don't fight
  for (const id of TRIBE_IDS) for (const k of roleKindsOf(id)) assert.ok(ROLE_NAMES[id][k], `${id} ${k}`);
  for (const k of ROLE_KINDS) assert.ok(UNITS[k].atk <= 1 && UNITS[k].tech, k);
  assert.equal(roleName('ottoman', 'sapper'), 'Lağımcı Miners');
});

test('only an empire of the type can train its role units, each behind a tech', () => {
  const s = sandbox(['rome', 'egypt', 'vikings']);
  const r = foundCity(s, 1, 1, 0, true), e = foundCity(s, 6, 1, 1, true), v = foundCity(s, 1, 6, 2, true);
  tile(s, 2, 7).terrain = 'shallow';
  const trains = (pid: number, c: typeof r) => acts(s, pid, c.x, c.y).filter((a) => a.id.startsWith('train:')).map((a) => a.id.slice(6));
  const roles = (pid: number, c: typeof r) => trains(pid, c).filter((k) => ROLE_KINDS.includes(k as UnitKind));
  assert.deepEqual(roles(0, r), ['recruiter', 'sapper']);
  assert.deepEqual(roles(1, e), ['builder', 'collector']);
  assert.deepEqual(roles(2, v), ['fishfleet', 'voyager']);
  assert.equal(doAction(s, 0, tile(s, 1, 1), 'train:builder'), false, 'a military empire has no builder');
  // named in the empire's own words, and waiting for the tech
  const rec = acts(s, 0, 1, 1).find((a) => a.id === 'train:recruiter')!;
  assert.equal(rec.label, 'Conquisitor');
  s.players[0].techs = s.players[0].techs.filter((t) => t !== 'tactics');
  assert.equal(acts(s, 0, 1, 1).find((a) => a.id === 'train:recruiter')!.needs, 'tactics');
  // ships are launched onto the water beside the city
  assert.ok(doAction(s, 2, tile(s, 1, 6), 'train:fishfleet'));
  assert.equal(unitAt(s, 2, 7)?.kind, 'fishfleet');
  // role units never capture
  tile(s, 3, 3).village = true;
  unit(s, 1, 'builder', 3, 3, e.id);
  assert.ok(!acts(s, 1, 3, 3).some((a) => a.id === 'capture'));
});

test('Recruiter: stationed in a city it cuts training costs, adds a unit slot, rallies militia and pays a bounty', () => {
  const s = sandbox(['rome', 'egypt']);
  for (const p of s.players) p.stock = { iron: 12, horses: 12 }; // Iron-age units need Iron (see game/goods)
  const c = foundCity(s, 3, 3, 0, true);
  const cap = unitCap(c), cost = acts(s, 0, 3, 3).find((a) => a.id === 'train:swordsman')!.cost;
  const u = unit(s, 0, 'recruiter', 3, 3, c.id);
  // before it is stationed, it blocks the city like any unit
  assert.equal(acts(s, 0, 3, 3).find((a) => a.id === 'train:swordsman')!.reason, 'City tile is occupied');
  assert.ok(run(s, 0, 3, 3, 'station'));
  assert.equal(u.data?.post, c.id);
  assert.equal(unitCap(c), cap + 1);
  const sw = acts(s, 0, 3, 3).find((a) => a.id === 'train:swordsman')!;
  assert.equal(sw.cost, cost - RECRUIT_DISCOUNT);
  assert.ok(sw.enabled, 'a stationed unit does not block training');
  const stars = s.players[0].stars;
  assert.ok(doAction(s, 0, tile(s, 3, 3), 'train:swordsman'));
  assert.equal(s.players[0].stars, stars - (cost - RECRUIT_DISCOUNT));
  assert.ok(s.units.some((x) => x.kind === 'swordsman' && Math.max(Math.abs(x.x - 3), Math.abs(x.y - 3)) === 1), 'the recruit steps out beside the city');
  // Rally Militia: only with an enemy within 3, then every RALLY_COOLDOWN turns
  assert.equal(find(s, 0, 3, 3, 'rally')!.enabled, false);
  unit(s, 1, 'warrior', 6, 6);
  const before = s.units.filter((x) => x.owner === 0).length;
  assert.ok(run(s, 0, 3, 3, 'rally'));
  const militia = s.units.find((x) => x.data?.militia)!;
  assert.equal(militia.kind, 'legionary', 'the empire’s own warrior');
  assert.equal(militia.homeCity, null);
  assert.equal(militia.moved, false, 'ready to fight at once');
  assert.equal(s.units.filter((x) => x.owner === 0).length, before + 1);
  assert.equal(find(s, 0, 3, 3, 'rally')!.reason, `Ready in ${RALLY_COOLDOWN} turns`);
  s.turn += RALLY_COOLDOWN;
  assert.ok(find(s, 0, 3, 3, 'rally')!.enabled);
  // leaving the city ends it; a killer collects the bounty
  u.moved = false;
  const out = moveOptions(s, u).find((o) => !unitAt(s, o.x, o.y))!;
  assert.ok(moveUnit(s, u, out.x, out.y));
  assert.equal(unitCap(c), cap);
  assert.equal(u.data?.post, undefined);
  const killer = unit(s, 1, 'warrior', 9, 9);
  const loot = s.players[1].stars;
  removeUnit(s, u, killer);
  assert.equal(s.players[1].stars, loot + BOUNTY.recruiter!);
});

test('Sappers: roads as they march, forts, bridges and undermined walls (Rome’s castra keep working)', () => {
  const s = sandbox(['mongols', 'egypt', 'rome']);
  const home = foundCity(s, 1, 1, 0, true);
  const sp = unit(s, 0, 'sapper', 4, 4, home.id);
  assert.ok(moveUnit(s, sp, 5, 4));
  assert.ok(tile(s, 4, 4).road && tile(s, 5, 4).road, 'a road on the tile left and the tile reached');
  // a fort: FORT_COST, +FORT_DEF to their own units standing on it
  const stars = s.players[0].stars;
  const defBefore = hookStat(s, sp, 'def');
  assert.ok(run(s, 0, 5, 4, 'fort'));
  assert.equal(s.players[0].stars, stars - FORT_COST);
  assert.equal(tile(s, 5, 4).improvement, 'fort');
  assert.equal(hookStat(s, sp, 'def'), defBefore + FORT_DEF);
  assert.equal(sp.attacked, true, 'it uses the turn');
  // Rome's castra sweep leaves a sappers' fort standing when nobody holds it
  sp.moved = false;
  assert.ok(moveUnit(s, sp, 6, 4));
  s.current = 2;
  startTurn(s);
  assert.equal(tile(s, 5, 4).improvement, 'fort');
  // a bridge: the shallow becomes a road land units walk over
  sp.moved = sp.attacked = false;
  s.current = 0;
  tile(s, 7, 4).terrain = 'shallow';
  const w = unit(s, 0, 'warrior', 6, 5);
  assert.ok(!moveOptions(s, w).some((o) => o.x === 7 && o.y === 4 && !o.embark));
  const stars2 = s.players[0].stars;
  assert.ok(run(s, 0, 7, 4, 'bridge'));
  assert.equal(s.players[0].stars, stars2 - BRIDGE_COST);
  assert.equal(tile(s, 7, 4).terrain, 'bridge');
  assert.ok(tile(s, 7, 4).road);
  assert.ok(moveOptions(s, w).some((o) => o.x === 7 && o.y === 4), 'land units cross the bridge');
  // undermine an enemy city beside them: its walls count for nothing for UNDERMINE_TURNS turns
  const enemy = foundCity(s, 8, 8, 1, true);
  enemy.walls = true;
  const d = unit(s, 1, 'defender', 8, 8, enemy.id);
  assert.equal(garrisonBonus(s, enemy), 4);
  const bx = unit(s, 0, 'sapper', 7, 7, home.id);
  assert.ok(find(s, 0, 7, 7, 'undermine'));
  assert.ok(run(s, 0, 7, 7, 'undermine'));
  assert.equal(garrisonBonus(s, enemy), 1);
  assert.equal(defenseBonus(s, d), 1);
  bx.attacked = false;
  assert.match(find(s, 0, 7, 7, 'undermine')!.reason!, /Already undermined/);
  s.turn += UNDERMINE_TURNS;
  assert.equal(garrisonBonus(s, enemy), 4, 'the walls stand again');
});

test('Master Builder: half-price builds beside it, and half-price level upgrades that pay a Star a turn', () => {
  const s = sandbox(['india', 'rome']);
  const c = foundCity(s, 4, 4, 0, true);
  const b = unit(s, 0, 'builder', 5, 5, c.id);
  tile(s, 5, 4).resource = 'crop';
  const build = acts(s, 0, 5, 4).find((a) => a.id.startsWith('role:build:') && a.id.endsWith(':farm'))!;
  assert.equal(build.cost, 3, 'half of 5, rounded up');
  assert.ok(acts(s, 0, 5, 4).some((a) => a.id === 'farm' && a.cost === 5), 'the full-price farm is still offered');
  assert.equal(roleParts(build.id)!.unit, b.id);
  // the builder's own panel lists it too (it stands beside the tile)
  assert.ok(acts(s, 0, 5, 5).some((a) => a.id === build.id));
  const stars = s.players[0].stars, pop = c.pop, level = c.level;
  assert.ok(doAction(s, 0, tile(s, 5, 4), build.id));
  assert.equal(s.players[0].stars, stars - 3);
  assert.equal(tile(s, 5, 4).improvement, 'farm');
  assert.ok(c.level > level || c.pop > pop, 'the city grows as from any farm');
  assert.ok(b.attacked, 'one action a turn');
  assert.ok(!find(s, 0, 5, 4, 'build')?.enabled);
  // a port on the shallow beside it
  b.moved = b.attacked = false;
  tile(s, 4, 5).terrain = 'shallow';
  const port = acts(s, 0, 4, 5).find((a) => a.id.endsWith(':port'))!;
  assert.equal(port.cost, 4);
  // raise the farm to an Estate (level 2, see game/levels) at half price: +1★ a turn and a little growth
  const inc = cityIncome(s, c);
  const st = s.players[0].stars;
  const up = find(s, 0, 5, 4, 'upgrade')!;
  assert.equal(up.label, 'Upgrade to Estate (½) ↗', 'an arrow points to the tile beside the builder');
  assert.equal(up.cost, Math.ceil(LEVEL_COST[2] / 2));
  assert.ok(doAction(s, 0, tile(s, 5, 4), up.id));
  assert.equal(s.players[0].stars, st - Math.ceil(LEVEL_COST[2] / 2));
  assert.ok(isUpgraded(tile(s, 5, 4)));
  assert.equal(tileLevel(tile(s, 5, 4)), 2);
  assert.equal(cityIncome(s, c), inc + LEVELS.farm.stars[1]);
  // it counts only while the farm stands
  tile(s, 5, 4).improvement = null;
  assert.equal(cityIncome(s, c), inc);
});

test('Tax Collector: +50% Stars in the city it is stationed in, shown in the HUD income, and a bounty', () => {
  const s = sandbox(['mali', 'rome']);
  const c = foundCity(s, 4, 4, 0, true);
  c.level = 4;
  const base = cityIncome(s, c), total = income(s, 0);
  const u = unit(s, 0, 'collector', 4, 4, c.id);
  assert.ok(run(s, 0, 4, 4, 'station'));
  assert.equal(cityIncome(s, c), base + Math.ceil(base / 2));
  assert.equal(cityTax(s, c), Math.ceil(base / 2));
  assert.equal(income(s, 0), total + Math.ceil(base / 2), 'the Stars (+N) readout counts it');
  // a second collector has nowhere to stand: one counts per city
  const v = unit(s, 0, 'collector', 5, 4, c.id);
  assert.ok(!find(s, 0, 5, 4, 'station'));
  void v;
  // it earns at the start of the turn
  s.current = 0;
  s.turn = 1;
  const stars = s.players[0].stars;
  startTurn(s);
  assert.ok(s.players[0].stars >= stars + base + Math.ceil(base / 2));
  // killing it pays the enemy
  const k = unit(s, 1, 'warrior', 9, 9);
  const loot = s.players[1].stars;
  removeUnit(s, u, k);
  assert.equal(s.players[1].stars, loot + BOUNTY.collector!);
  assert.equal(cityIncome(s, c), base);
});

test('Fishing Fleet: brings in fish and whales anywhere at sea, earns a Star a turn and sees 2 tiles', () => {
  const s = sandbox(['vikings', 'rome']);
  for (const t of s.tiles) if (t.x >= 3) t.terrain = t.x >= 6 ? 'ocean' : 'shallow';
  const c = foundCity(s, 1, 4, 0, true);
  const f = unit(s, 0, 'fishfleet', 3, 4, c.id);
  // it crosses the ocean but never goes ashore
  assert.ok(moveOptions(s, f).some((o) => tile(s, o.x, o.y).terrain === 'ocean'));
  assert.ok(!moveOptions(s, f).some((o) => tile(s, o.x, o.y).terrain === 'field'));
  // fish far outside the borders
  tile(s, 5, 7).resource = 'fish';
  assert.ok(moveUnit(s, f, 5, 7));
  assert.equal(tile(s, 5, 7).owner, null);
  const stars = s.players[0].stars, pop = c.pop + c.level * 10;
  assert.ok(run(s, 0, 5, 7, 'fish'));
  assert.equal(s.players[0].stars, stars + CATCH.fish.stars);
  assert.ok(c.pop + c.level * 10 > pop, 'the nearest city grows');
  assert.equal(tile(s, 5, 7).resource, null);
  // a whale pays more
  f.moved = f.attacked = false;
  tile(s, 7, 7).resource = 'whale';
  assert.ok(moveUnit(s, f, 7, 7));
  const s2 = s.players[0].stars;
  assert.ok(run(s, 0, 7, 7, 'fish'));
  assert.equal(s.players[0].stars, s2 + CATCH.whale.stars);
  // FLEET_STARS a turn, part of the turn-start income
  assert.equal(hookIncome(s, 0), FLEET_STARS);
  // vision 2
  s.players[0].explored.fill(false);
  revealAround(s, 0);
  assert.ok(s.players[0].explored[9 * s.size + 7], 'two tiles away');
  assert.ok(!s.players[0].explored[10 * s.size + 7], 'not three');
});

test('Voyager: crosses the ocean, sees 3, and founds an outpost on an unclaimed coast (one per 2 cities)', () => {
  const s = sandbox(['polynesia', 'rome', 'egypt']);
  for (const t of s.tiles) if (t.x >= 4 && !(t.x >= 9 && t.y >= 9)) t.terrain = 'ocean';
  const a = foundCity(s, 1, 1, 0, true);
  const v = unit(s, 0, 'voyager', 4, 1, a.id);
  const units = a.units;
  assert.equal(UNITS.voyager.move, 4);
  assert.ok(moveOptions(s, v).some((o) => o.x === 8), 'four tiles over open ocean');
  v.x = 8; v.y = 9;
  // one city: no room for an outpost yet
  assert.equal(outpostRoom(s, 0), 0);
  assert.match(find(s, 0, 9, 9, 'outpost')!.reason!, /2 cities/);
  foundCity(s, 1, 6, 0, false);
  assert.equal(outpostRoom(s, 0), 1);
  // not too close to another city
  const near = foundCity(s, 11, 11, 1, true);
  assert.match(acts(s, 0, 9, 9).find((x) => x.id.startsWith('role:outpost'))!.reason!, /Too close/);
  s.cities = s.cities.filter((c) => c !== near);
  for (const t of s.tiles) if (t.owner === near.id) t.owner = null;
  tile(s, 11, 11).cityId = null;
  const n = s.cities.length;
  assert.ok(run(s, 0, 9, 9, 'outpost'));
  assert.equal(s.cities.length, n + 1);
  const o = s.cities[s.cities.length - 1];
  assert.equal(o.owner, 0);
  assert.equal(o.level, 1);
  assert.ok(o.data?.outpost);
  assert.ok(!s.units.includes(v), 'the ship is used up');
  assert.equal(a.units, units - 1, 'its slot is freed');
  // vision 3
  s.players[0].explored.fill(false);
  const w = unit(s, 0, 'voyager', 6, 5, a.id);
  revealAround(s, 0);
  assert.ok(s.players[0].explored[5 * s.size + 9] && !s.players[0].explored[5 * s.size + 10]);
  void w;
});

test('role unit art for every empire, and the map marks, draw without throwing', () => {
  let fills = 0;
  const ctx = new Proxy({}, {
    get: (_t, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => { if (k === 'fill' || k === 'stroke') fills++; }),
    set: () => true,
  }) as unknown as CanvasRenderingContext2D;
  for (const id of TRIBE_IDS) for (const k of [...ROLE_KINDS]) {
    const before = fills;
    drawUnitSprite(ctx, k, id, 0, 0);
    assert.ok(fills - before > 8, `${id} ${k}`);
  }
  for (const icon of ['role:banner', 'role:coins', 'role:fort', 'role:bridge', 'role:undermine', 'role:upgrade', 'role:outpost']) assert.ok(drawRoleIcon(ctx, icon, 'rome', 0, 0));
  const s = sandbox(['mongols', 'egypt']);
  const c = foundCity(s, 2, 2, 1, true);
  c.data = { mined: s.turn + 2 };
  tile(s, 4, 4).improvement = 'fort';
  tile(s, 4, 4).data = { sfort: 0 };
  tile(s, 3, 2).improvement = 'farm';
  tile(s, 3, 2).data = { up: 'farm' };
  tile(s, 6, 6).terrain = 'bridge';
  const before = fills;
  for (const t of [tile(s, 2, 2), tile(s, 4, 4), tile(s, 3, 2)]) drawRoleTile(ctx, s, t, 0, 0);
  drawBridgeGround(ctx, s, tile(s, 6, 6), 0, 0);
  const col = unit(s, 1, 'collector', 2, 2, c.id);
  col.data = { post: c.id };
  drawRoleGround(ctx, s, -1);
  assert.ok(fills - before > 20);
});

test('old saves load: no role state anywhere, nothing breaks', () => {
  const s = createGame({ seed: 9, human: null, opponents: ['rome', 'mali', 'vikings'], mode: 'perfection' });
  const old = JSON.parse(JSON.stringify(s)) as GameState;
  for (const u of old.units) delete u.data;
  for (const c of old.cities) delete c.data;
  assert.equal(unitCap(old.cities[0]), old.cities[0].level + 1);
  assert.ok(income(old, 0) > 0);
  startTurn(old);
  for (let t = 0; t < 6; t++) { for (let i = 0; i < 300 && aiStep(old); i++); endTurn(old); drain(); }
  JSON.parse(JSON.stringify(old));
  // a Roman castra is not a sappers' fort
  const r = sandbox(['rome', 'egypt']);
  const home = foundCity(r, 1, 1, 0, true);
  const leg = unit(r, 0, 'legionary', 4, 4, home.id);
  tile(r, 4, 4).road = true;
  leg.moved = true;
  assert.ok(doAction(r, 0, tile(r, 4, 4), 'mech:castra'));
  assert.equal(tile(r, 4, 4).improvement, 'fort');
  assert.equal(isSapperFort(tile(r, 4, 4)), false);
  assert.equal(trainCost(r, 0, 'recruiter'), UNITS.recruiter.cost);
});

test('a 30-turn all-AI game: every type trains and uses its role units', () => {
  const trained = new Set<UnitKind>();
  const used: Record<string, number> = {};
  const lineups: [number, TribeId[], boolean][] = [[3, ['rome', 'egypt', 'vikings', 'mali', 'mongols'], true], [8, ['persia', 'china', 'greeks', 'swahili', 'zulu'], false]];
  for (const [seed, tribes, on] of lineups) {
    const s = createGame({ seed, human: null, opponents: tribes, mode: 'perfection', maxTurns: 30, diplomacy: on, wild: on, rebels: on });
    for (let guard = 0; !s.over && guard < 4000; guard++) {
      for (let i = 0; i < 400 && aiStep(s); i++);
      for (const u of s.units) if (ROLE_KINDS.includes(u.kind)) trained.add(u.kind);
      endTurn(s);
      drain();
    }
    assert.ok(s.over);
    for (const l of s.log) for (const [k, re] of [['station', /stationed in/], ['rally', /rally militia/], ['fort', /raise a fort/], ['bridge', /bridge the/], ['undermine', / undermine /], ['build', /builds a /], ['upgrade', /raises an? /], ['outpost', /found an outpost/]] as const) if (re.test(l.text)) used[k] = (used[k] ?? 0) + 1;
    JSON.parse(JSON.stringify(s));
  }
  assert.ok(trained.size >= 5, `role units trained: ${[...trained].join(', ')}`);
  assert.ok((used.station ?? 0) >= 2, `stationed: ${JSON.stringify(used)}`);
  assert.ok((used.upgrade ?? 0) + (used.build ?? 0) >= 2, `builders at work: ${JSON.stringify(used)}`);
  assert.ok(Object.keys(used).length >= 4, `actions used: ${JSON.stringify(used)}`);
});

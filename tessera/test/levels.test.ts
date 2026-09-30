import assert from 'node:assert/strict';
import test from 'node:test';
import { aiStep } from '../src/game/ai';
import { drain } from '../src/game/events';
import { createGame, foundCity, spawnUnit } from '../src/game/mapgen';
import { hookStat } from '../src/game/mech';
import { addPop, cityIncome, doAction, score, tileActions, trainCost, type Action } from '../src/game/rules';
import { endTurn, startTurn } from '../src/game/turn';
import type { GameState, TribeId, Unit, UnitKind } from '../src/game/types';
import {
  DISTRICT_STARS, districtsOf, HOLY_SCORE, L3_CITY, LEVEL_COST, LEVEL_COST_STEP, LEVELS, levelCityIncome, levelIncome, migrateLevels, SANCTUARY_HEAL, SPECIAL_PCT, SPECIALITY, tileLevel, upgradeCount,
} from '../src/game/levels';
import { TRIBE_IDS } from '../src/data/tribes';
import { drawDistrictBanners, drawDistrictGround, drawLevelIcon, drawLevelTile } from '../src/render/levels';
import { economyChip } from '../src/ui/hudchips';

/** A blank field map (every city, unit, resource and border cleared) with everyone rich; `techs` are known. */
function sandbox(tribes: TribeId[], techs: string[] = []): GameState {
  const s = createGame({ seed: 5, human: tribes[0], opponents: tribes.slice(1), mode: 'perfection' });
  for (const t of s.tiles) Object.assign(t, { terrain: 'field', resource: null, improvement: null, road: false, village: false, ruin: false, cityId: null, owner: null, data: undefined });
  s.cities = [];
  s.units = [];
  for (const p of s.players) { p.explored.fill(true); p.stars = 200; p.techs = [...new Set([...p.techs, ...techs])]; }
  return s;
}
const tile = (s: GameState, x: number, y: number) => s.tiles[y * s.size + x];
const up = (s: GameState, pid: number, x: number, y: number): Action | undefined => tileActions(s, pid, tile(s, x, y)).find((a) => a.id.startsWith('level:'));
const raise = (s: GameState, pid: number, x: number, y: number) => {
  const a = up(s, pid, x, y);
  assert.ok(a, `no level action at ${x},${y}`);
  assert.ok(a.enabled, `${a.label}: ${a.reason}`);
  return doAction(s, pid, tile(s, x, y), a.id);
};
/** Put an improvement on a tile (as if built). */
const put = (s: GameState, x: number, y: number, imp: 'farm' | 'mine' | 'lumber' | 'port' | 'market' | 'temple', lvl = 1) => {
  const t = tile(s, x, y);
  t.improvement = imp;
  if (imp === 'mine') t.resource = 'ore';
  if (imp === 'farm') t.resource = 'crop';
  if (imp === 'port') t.terrain = 'shallow';
  if (imp === 'lumber') t.terrain = 'forest';
  if (lvl > 1) t.data = { lvl, lvk: imp };
  return t;
};
function unit(s: GameState, pid: number, kind: UnitKind, x: number, y: number, home: number | null = null): Unit {
  const u = spawnUnit(s, kind, pid, x, y, home);
  u.moved = u.attacked = false;
  return u;
}
const ALL = ['farming', 'masonry', 'mining', 'smithing', 'forestry', 'carpentry', 'fishing', 'sailing', 'navigation', 'roads', 'trade', 'meditation', 'philosophy', 'hunting', 'horsemanship', 'chivalry', 'gathering', 'riding', 'engineering', 'climbing'];

test('a farm rises to an Estate, then Granary Fields: Stars, growth, techs and city level', () => {
  const s = sandbox(['rome', 'egypt'], ['farming']);
  const c = foundCity(s, 4, 4, 0, true);
  const t = put(s, 5, 4, 'farm');
  put(s, 5, 5, 'farm'); // a farm beside it, for the Granary Fields
  assert.equal(tileLevel(t), 1);
  let a = up(s, 0, 5, 4)!;
  assert.equal(a.label, 'Upgrade to Estate');
  assert.equal(a.cost, LEVEL_COST[2]);
  assert.match(a.desc, /Level 2 of 3: \+1★ a turn, \+1 population/);
  const inc = cityIncome(s, c), stars = s.players[0].stars, pop = c.pop + c.level * 10;
  assert.ok(raise(s, 0, 5, 4));
  assert.equal(tileLevel(t), 2);
  assert.equal(t.improvement, 'farm', 'it is still a farm');
  assert.equal(s.players[0].stars, stars - LEVEL_COST[2]);
  assert.equal(cityIncome(s, c), inc + 1);
  assert.ok(c.pop + c.level * 10 > pop, 'the Estate grows the city');
  // level 3 is locked on the tech (a tap opens it) and then on the city's level
  a = up(s, 0, 5, 4)!;
  assert.equal(a.label, 'Upgrade to Granary Fields');
  assert.equal(a.cost, LEVEL_COST[3] + LEVEL_COST_STEP, 'each tile raised makes the next dearer');
  assert.ok(!a.enabled && a.needs === 'masonry' && /Masonry/.test(a.reason!));
  s.players[0].techs.push('masonry');
  a = up(s, 0, 5, 4)!;
  assert.ok(!a.enabled && !a.needs && /level-4 city/.test(a.reason!), a.reason ?? "");
  c.level = L3_CITY;
  c.pop = 0;
  assert.ok(raise(s, 0, 5, 4));
  assert.equal(tileLevel(t), 3);
  assert.equal(levelCityIncome(s, c), 2);
  assert.equal(c.pop, LEVELS.farm.pop[2] + 1, 'Granary Fields: +2, and +1 for the farm beside it');
  assert.equal(up(s, 0, 5, 4), undefined, 'nothing above level 3');
  // it counts only while the farm stands
  t.improvement = null;
  assert.equal(tileLevel(t), 0);
  assert.equal(levelCityIncome(s, c), 0);
});

test('a raised tile still counts as its improvement (Khmer farms, Mali mines)', () => {
  const s = sandbox(['khmer', 'mali'], ALL);
  const k = foundCity(s, 2, 2, 0, true);
  const m = foundCity(s, 8, 8, 1, true);
  put(s, 3, 2, 'farm');
  put(s, 9, 8, 'mine');
  const ki = cityIncome(s, k), mi = cityIncome(s, m);
  tile(s, 3, 2).data = { lvl: 3, lvk: 'farm' };
  tile(s, 9, 8).data = { lvl: 2, lvk: 'mine' };
  assert.equal(cityIncome(s, k), ki + 2, 'Baray Reservoirs still pays for the farm, and the level adds on top');
  assert.equal(cityIncome(s, m), mi + 1, 'Gold of the Sahel still pays for the mine');
});

test('the level-3 extras: Foundry, Timberworks, Great Harbour, Exchange, Sanctuary, Stables, Vineyard', () => {
  const s = sandbox(['rome', 'egypt'], ALL);
  const c = foundCity(s, 4, 4, 0, true);
  c.level = 5;
  const tile0 = (k: UnitKind) => tileActions(s, 0, tile(s, 4, 4)).find((a) => a.id === `train:${k}`)!.cost;
  const sw = tile0('legionary'), cat = tile0('catapult');
  put(s, 5, 4, 'mine', 3); // Foundry
  assert.equal(tile0('legionary'), sw - 1);
  put(s, 3, 4, 'lumber', 3); // Timberworks
  assert.equal(tile0('catapult'), cat - 1 - 2);
  assert.equal(trainCost(s, 0, 'catapult'), cat, 'the discount is the city’s, not the empire’s');
  // Great Harbour: the city's boats move 1 further
  const boat = unit(s, 0, 'boat', 6, 6, c.id);
  boat.carrying = 'warrior';
  tile(s, 6, 6).terrain = 'shallow';
  assert.equal(hookStat(s, boat, 'move'), 0);
  put(s, 4, 5, 'port', 3);
  assert.equal(hookStat(s, boat, 'move'), 1);
  // Stables: mounted units of the city defend +1
  const rider = unit(s, 0, 'rider', 7, 7, c.id);
  assert.equal(hookStat(s, rider, 'def'), 0);
  tile(s, 3, 3).resource = 'animal';
  tile(s, 3, 3).improvement = 'pasture';
  tile(s, 3, 3).data = { lvl: 3, lvk: 'pasture' };
  assert.equal(hookStat(s, rider, 'def'), 1);
  // Sanctuary: units in the city's land heal
  const w = unit(s, 0, 'legionary', 5, 3, c.id);
  w.hp = 4;
  put(s, 5, 3, 'temple', 3);
  s.current = 0;
  startTurn(s);
  assert.equal(w.hp, 4 + SANCTUARY_HEAL);
  // Vineyard: +1 growth each level-up
  tile(s, 3, 5).resource = 'fruit';
  tile(s, 3, 5).improvement = 'orchard';
  tile(s, 3, 5).data = { lvl: 3, lvk: 'orchard' };
  const lvl = c.level;
  c.pop = 0;
  const need = lvl + 1 + Math.max(0, lvl - 1);
  addPop(s, c, need);
  assert.equal(c.level, lvl + 1);
  assert.equal(c.pop, 1, 'the Vineyard grew the city once more');
});

test('the Exchange: its city’s trade routes pay +1★ each', () => {
  const s = sandbox(['rome', 'egypt'], ALL);
  const a = foundCity(s, 2, 2, 0, true);
  const b = foundCity(s, 8, 2, 0, false);
  s.trade = { routes: [{ id: 1, a: a.id, b: b.id, pa: 0, pb: 0, by: 0, sea: false, path: [], since: 0 }] };
  put(s, 3, 2, 'market', 2);
  const before = cityIncome(s, a);
  tile(s, 3, 2).data = { lvl: 3, lvk: 'market' };
  assert.equal(cityIncome(s, a), before + 1 + 1, 'a level more, and +1★ for the one route');
});

test('Pasture and Orchard: tamed instead of hunted, planted instead of harvested', () => {
  const s = sandbox(['rome', 'egypt'], ['hunting', 'gathering']);
  const c = foundCity(s, 4, 4, 0, true);
  tile(s, 5, 4).resource = 'animal';
  tile(s, 5, 4).terrain = 'forest';
  tile(s, 3, 4).resource = 'fruit';
  const acts = tileActions(s, 0, tile(s, 5, 4));
  assert.ok(acts.some((a) => a.id === 'harvest' && a.enabled), 'the one-off hunt is still there');
  const p = acts.find((a) => a.id === 'level:pasture')!;
  assert.ok(p && !p.enabled && p.needs === 'horsemanship', 'a pasture waits on Horsemanship');
  s.players[0].techs.push('horsemanship', 'farming');
  const inc = cityIncome(s, c);
  assert.ok(raise(s, 0, 5, 4));
  assert.equal(tile(s, 5, 4).improvement, 'pasture');
  assert.equal(tile(s, 5, 4).resource, 'animal', 'the herd stays');
  assert.equal(tileLevel(tile(s, 5, 4)), 2);
  assert.equal(up(s, 0, 3, 4)!.label, 'Plant an Orchard');
  assert.ok(raise(s, 0, 3, 4));
  assert.equal(cityIncome(s, c), inc + 2);
  assert.ok(!tileActions(s, 0, tile(s, 3, 4)).some((a) => a.id === 'harvest'), 'no harvest once planted');
  assert.equal(up(s, 0, 5, 4)!.label, 'Upgrade to Stables');
});

test('Districts: three touching level-3 tiles of a kind, +2★ and a themed extra, drawn on the map', () => {
  const s = sandbox(['rome', 'egypt'], ALL);
  const c = foundCity(s, 4, 4, 0, true);
  c.borderRadius = 2;
  for (const t of s.tiles) if (Math.max(Math.abs(t.x - 4), Math.abs(t.y - 4)) <= 2) t.owner = c.id;
  c.level = 5;
  put(s, 5, 4, 'mine', 3);
  put(s, 6, 4, 'mine', 3);
  put(s, 2, 2, 'mine', 3); // not touching
  assert.equal(districtsOf(s, 0).length, 0);
  const inc = levelCityIncome(s, c);
  const sw = tileActions(s, 0, tile(s, 4, 4)).find((a) => a.id === 'train:legionary')!.cost;
  put(s, 6, 5, 'mine', 2);
  assert.ok(raise(s, 0, 6, 5));
  const ds = districtsOf(s, 0);
  assert.equal(ds.length, 1);
  assert.equal(ds[0].kind, 'mine');
  assert.match(ds[0].name, /^Industrial District of /);
  assert.equal(ds[0].tiles.length, 3);
  assert.equal(levelCityIncome(s, c), inc + LEVELS.mine.stars[2] + DISTRICT_STARS, 'the new Foundry, and the District');
  assert.equal(tileActions(s, 0, tile(s, 4, 4)).find((a) => a.id === 'train:legionary')!.cost, Math.max(1, sw - 1), 'Industrial District: 1★ more off');
  assert.ok(drain().some((e) => e.type === 'toast' && /A District is born/.test(e.text)));
  // a Holy District scores
  const sc = score(s, 0);
  put(s, 2, 4, 'temple', 3); put(s, 2, 5, 'temple', 3); put(s, 3, 6, 'temple', 3);
  assert.equal(score(s, 0), sc + HOLY_SCORE);
  // the Economy chip and the map drawing
  assert.match(economyChip(s, 0)!.text, /2 dist/);
  let fills = 0;
  const ctx = new Proxy({}, {
    get: (_t, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => { if (k === 'fill' || k === 'stroke') fills++; }),
    set: () => true,
  }) as unknown as CanvasRenderingContext2D;
  drawDistrictGround(ctx, s, () => true);
  drawDistrictBanners(ctx, s, () => true);
  for (const t of s.tiles) drawLevelTile(ctx, s, t, 0, 0);
  for (const icon of ['level:up', 'level:pasture', 'level:orchard']) assert.ok(drawLevelIcon(ctx, icon, 'rome', 0, 0));
  assert.ok(fills > 50);
});

test('specialities: every empire has one; some build straight at level 2, others upgrade cheap', () => {
  for (const id of TRIBE_IDS) assert.ok(SPECIALITY[id] && LEVELS[SPECIALITY[id].kind], id);
  assert.equal(SPECIALITY.egypt.kind, 'farm');
  assert.equal(SPECIALITY.mali.kind, 'mine');
  // Egypt: farms are built straight as Estates
  const s = sandbox(['egypt', 'rome', 'aztec', 'mongols'], ['farming']);
  const e = foundCity(s, 2, 2, 0, true);
  tile(s, 3, 2).resource = 'crop';
  const f = tileActions(s, 0, tile(s, 3, 2)).find((a) => a.id === 'farm')!;
  assert.match(f.desc, /Nile Estates: built straight as an Estate/);
  assert.ok(doAction(s, 0, tile(s, 3, 2), 'farm'));
  assert.equal(tileLevel(tile(s, 3, 2)), 2);
  assert.equal(levelCityIncome(s, e), 1);
  // Rome builds an ordinary farm
  const r = foundCity(s, 8, 2, 1, true);
  tile(s, 9, 2).resource = 'crop';
  assert.ok(doAction(s, 1, tile(s, 9, 2), 'farm'));
  assert.equal(tileLevel(tile(s, 9, 2)), 1);
  assert.equal(up(s, 1, 9, 2)!.cost, LEVEL_COST[2]);
  void r;
  // Aztec: farm upgrades a third off
  foundCity(s, 2, 8, 2, true);
  put(s, 3, 8, 'farm');
  assert.equal(up(s, 2, 3, 8)!.cost, Math.ceil(LEVEL_COST[2] * SPECIAL_PCT));
  // Mongols: pastures need no Horsemanship and cost a third less
  foundCity(s, 8, 8, 3, true);
  tile(s, 9, 8).resource = 'animal';
  const p = up(s, 3, 9, 8)!;
  assert.ok(p.enabled && p.cost === Math.ceil(LEVEL_COST[2] * SPECIAL_PCT), `${p.reason}`);
});

test('Master Builder: half price, and one tech skip per city', () => {
  const s = sandbox(['india', 'rome'], ['farming']);
  const c = foundCity(s, 4, 4, 0, true);
  c.level = L3_CITY;
  const b = unit(s, 0, 'builder', 5, 5, c.id);
  put(s, 5, 4, 'farm', 2);
  put(s, 3, 4, 'farm', 2);
  const role = () => tileActions(s, 0, tile(s, 5, 4)).find((a) => a.id.startsWith('role:upgrade:'))!;
  const a = role();
  assert.equal(a.label, 'Upgrade to Granary Fields (½) ↗');
  assert.equal(a.cost, Math.ceil(LEVEL_COST[3] / 2));
  assert.ok(a.enabled, a.reason ?? "");
  assert.match(a.desc, /skips Masonry/);
  assert.ok(!up(s, 0, 5, 4)!.enabled, 'without the builder it still needs Masonry');
  assert.ok(doAction(s, 0, tile(s, 5, 4), a.id));
  assert.equal(tileLevel(tile(s, 5, 4)), 3);
  assert.ok(c.data?.mbSkip);
  // the next one in the same city needs the tech again
  b.x = 3; b.y = 5; b.moved = b.attacked = false;
  const again = tileActions(s, 0, tile(s, 3, 4)).find((x) => x.id.startsWith('role:upgrade:'))!;
  assert.ok(!again.enabled && again.needs === 'masonry');
});

test('old saves: a Master Builder’s upgrade (data.up) is level 2, and migrates', () => {
  const s = sandbox(['india', 'rome'], ['farming']);
  const c = foundCity(s, 4, 4, 0, true);
  const t = put(s, 5, 4, 'farm');
  const inc = cityIncome(s, c);
  t.data = { up: 'farm' };
  assert.equal(tileLevel(t), 2);
  assert.equal(cityIncome(s, c), inc + 1);
  tile(s, 3, 4).data = { up: 'mine' }; // a stale marker (the mine is gone)
  migrateLevels(s);
  assert.deepEqual(t.data, { lvl: 2, lvk: 'farm' });
  assert.equal(tile(s, 3, 4).data?.up, undefined);
  assert.equal(up(s, 0, 5, 4)!.label, 'Upgrade to Granary Fields');
  // a save with no level state at all plays on
  const g = createGame({ seed: 4, human: null, opponents: ['egypt', 'mali', 'china'], mode: 'perfection' });
  const old = JSON.parse(JSON.stringify(g)) as GameState;
  migrateLevels(old);
  startTurn(old);
  for (let turn = 0; turn < 4; turn++) { for (let i = 0; i < 300 && aiStep(old); i++); endTurn(old); drain(); }
  assert.equal(levelIncome(old, 0) >= 0, true);
});

test('a 30-turn all-AI game: the computer raises tiles, its specialities among them', () => {
  let raised = 0, special = 0, l3 = 0;
  const lineups: [number, TribeId[], boolean][] = [[3, ['egypt', 'mali', 'china', 'rome', 'mongols'], true], [11, ['greeks', 'maya', 'khmer', 'swahili', 'inca'], false]];
  for (const [seed, tribes, on] of lineups) {
    const s = createGame({ seed, human: null, opponents: tribes, mode: 'perfection', maxTurns: 30, diplomacy: on, wild: on, rebels: on });
    for (let guard = 0; !s.over && guard < 4000; guard++) {
      for (let i = 0; i < 400 && aiStep(s); i++);
      endTurn(s);
      drain();
    }
    assert.ok(s.over);
    for (const p of s.players) {
      if (p.neutral) continue;
      raised += upgradeCount(s, p.id);
      special += s.tiles.filter((t) => tileLevel(t) >= 2 && t.improvement === SPECIALITY[p.tribe].kind && t.owner !== null && s.cities.find((c) => c.id === t.owner)?.owner === p.id).length;
      l3 += s.tiles.filter((t) => tileLevel(t) === 3 && t.owner !== null && s.cities.find((c) => c.id === t.owner)?.owner === p.id).length;
    }
    JSON.parse(JSON.stringify(s));
  }
  assert.ok(raised >= 6, `raised tiles: ${raised}`);
  assert.ok(special >= 2, `speciality tiles: ${special}`);
  console.log(`30-turn AI games: ${raised} raised tiles, ${special} of them specialities, ${l3} at level 3`);
});

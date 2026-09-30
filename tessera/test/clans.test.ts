import assert from 'node:assert/strict';
import test from 'node:test';
import { aiStep } from '../src/game/ai';
import { drain } from '../src/game/events';
import { dist, neighbors, tileAt } from '../src/game/grid';
import { createGame } from '../src/game/mapgen';
import { attack, citiesOf, doAction, maxHp, moveUnit, tileActions, tileOwnerPlayer, unitAt } from '../src/game/rules';
import { endTurn, startTurn } from '../src/game/turn';
import type { ClanCamp, GameState, Tile, Unit, UnitKind } from '../src/game/types';
import {
  bribeCost, CAMP_FROM, CAMP_SCORE, campReward, campSite, CITY_GAP, clanAi, clanCampAt, clanDescribe, clanRound, clanTier, CLANS,
  isGuard, isRaider, maxCamps, pitchCamp, raidKind, raidersOf, RAIDER_BOUNTY, recruitCost, TRUCE,
} from '../src/game/clans';
import { tileLevel } from '../src/game/levels';
import { empires, isNeutral, neutralId, spawnNeutral, wildRound } from '../src/game/wild';

const game = (opts: Partial<Parameters<typeof createGame>[0]> = {}) =>
  createGame({ seed: 5, human: 'rome', opponents: ['egypt', 'vikings'], mode: 'perfection', mapSize: 'huge', clans: true, ...opts });

/** Pitches a camp of `kind` on the first free site (or one given). */
function camp(s: GameState, kind: ClanCamp['kind'] = 'wolf', at?: Tile): ClanCamp {
  const site = at ?? s.tiles.find((t) => campSite(s, t))!;
  assert.ok(site, 'a camp site');
  return pitchCamp(s, site, kind)!;
}

/** A raider of camp `c` standing at (x, y). */
function raider(s: GameState, c: ClanCamp, kind: UnitKind, x: number, y: number): Unit {
  const u = spawnNeutral(s, kind, x, y);
  u.data = { clan: c.id };
  return u;
}

/** A field of `pid`'s land (not a city) with no unit near it; the empire's own units are sent away. */
function quietLand(s: GameState, pid: number): Tile {
  s.units = s.units.filter((u) => u.owner !== pid);
  const t = s.tiles.find((x) => tileOwnerPlayer(s, x) === pid && x.cityId === null && x.terrain === 'field'
    && !s.units.some((u) => dist(u.x, u.y, x.x, x.y) <= 2));
  assert.ok(t, 'quiet land');
  return t!;
}

test('raider clans are off unless asked for, and older saves without them still play', () => {
  const s = game({ clans: false });
  assert.equal(s.clans, undefined);
  clanRound(s); // a no-op
  assert.equal(neutralId(s), -1);
  startTurn(s);
  for (let i = 0; i < 18; i++) endTurn(s);
  assert.equal(neutralId(s), -1, 'no camps, no neutral owner');
  assert.equal(s.clans, undefined);
});

test('camps appear from round 4 in unseen, unclaimed land, never near a city, each with a guard and a temper', () => {
  const s = game();
  startTurn(s);
  while (s.turn < CAMP_FROM) { endTurn(s); assert.equal(s.clans!.camps.length, 0); }
  for (let i = 0; i < 3 * 12; i++) endTurn(s);
  const camps = s.clans!.camps;
  assert.ok(camps.length >= 1 && camps.length <= maxCamps(s), `camps: ${camps.length}`);
  for (const c of camps) {
    const t = tileAt(s, c.x, c.y)!;
    assert.ok(CLANS[c.kind]);
    const d = clanDescribe(s, t, 0)!;
    assert.match(d.title, /Outlaw Camp/);
    assert.ok(d.desc.includes(CLANS[c.kind].name), 'the temper is shown on tap');
  }
  // at the moment a camp is pitched, no empire is watching the spot
  const s2 = game();
  const site = s2.tiles.find((t) => campSite(s2, t))!;
  assert.equal(site.owner, null);
  assert.ok(s2.cities.every((k) => dist(k.x, k.y, site.x, site.y) > CITY_GAP));
  assert.ok(s2.units.every((u) => dist(u.x, u.y, site.x, site.y) > 2));
  const c = camp(s2, 'hill', site);
  const g = unitAt(s2, c.x, c.y)!;
  assert.ok(isGuard(s2, g) && isNeutral(s2, g.owner));
  assert.equal(g.kind, 'defender', 'a Hill clan is held by shield-bearers');
  assert.equal(empires(s2).length, 3, 'the one neutral owner, no second');
  const back = JSON.parse(JSON.stringify(s2)) as GameState;
  assert.deepEqual(back.clans, s2.clans);
});

test('a camp sends out raiders on its own schedule, stronger ones later in the game', () => {
  const s = game();
  const c = camp(s, 'wolf');
  assert.equal(raidersOf(s, c).length, 1, 'just the guard at first');
  s.turn = c.spawn;
  clanRound(s);
  const out = raidersOf(s, c).filter((u) => !isGuard(s, u));
  assert.equal(out.length, 1);
  assert.ok(['archer', 'warrior'].includes(out[0].kind));
  assert.ok(dist(out[0].x, out[0].y, c.x, c.y) === 1);
  // escalation
  assert.equal(clanTier(s), 0);
  s.turn = 25;
  assert.equal(clanTier(s), 2);
  assert.ok(CLANS.wolf.raiders[2].includes(raidKind(s, c)));
  assert.ok(CLANS.horse.raiders[0].includes('rider'), 'a Horse clan rides from the start');
  assert.ok(bribeCost(s) > 5 && recruitCost(s, c) > bribeCost(s));
});

test('raiders head for empire land and pillage it: a level lost, an improvement torn down, a road torn up', () => {
  const s = game();
  const c = camp(s, 'wolf');
  const t = quietLand(s, 0);
  t.improvement = 'farm';
  t.data = { ...t.data, lvl: 2, lvk: 'farm' };
  t.road = true;
  const r = raider(s, c, 'warrior', t.x, t.y);
  c.spawn = 99;
  drain();
  clanRound(s);
  assert.equal(tileLevel(t), 1, 'first a level');
  assert.ok(drain().some((e) => e.type === 'toast' && e.player === 0 && /Raiders/.test(e.text)), 'the owner is told');
  clanRound(s);
  assert.equal(t.improvement, null, 'then the farm');
  clanRound(s);
  assert.equal(t.road, false, 'then the road');
  assert.ok(s.units.includes(r));
  // a raider out of reach walks toward land to wreck
  const far = raider(s, c, 'rider', c.x + (c.x > 2 ? -1 : 1), c.y);
  const before = Math.min(...s.tiles.filter((x) => tileOwnerPlayer(s, x) !== null).map((x) => dist(x.x, x.y, far.x, far.y)));
  clanRound(s);
  const after = Math.min(...s.tiles.filter((x) => tileOwnerPlayer(s, x) !== null).map((x) => dist(x.x, x.y, far.x, far.y)));
  assert.ok(after <= before);
});

test('raiders attack weak units but never take a city, and never set foot on a capital', () => {
  const s = game();
  const c = camp(s, 'wolf');
  c.spawn = 999;
  const cap = citiesOf(s, 0).find((k) => k.capital)!;
  for (const u of s.units.filter((u) => u.owner === 0)) s.units.splice(s.units.indexOf(u), 1);
  const spot = neighbors(s, cap.x, cap.y).find((n) => n.terrain === 'field' && !unitAt(s, n.x, n.y) && n.cityId === null)!;
  const r = raider(s, c, 'swordsman', spot.x, spot.y);
  for (let i = 0; i < 30; i++) { s.turn = i; clanRound(s); }
  assert.equal(cap.owner, 0, 'the capital is never taken');
  assert.ok(!(r.x === cap.x && r.y === cap.y), 'nor stood on');
  // a weak unit next to a raider is struck
  const n2 = neighbors(s, r.x, r.y).find((n) => n.terrain === 'field' && !unitAt(s, n.x, n.y) && n.cityId === null)!;
  const s0 = s.units.length;
  const victim = spawnNeutral(s, 'warrior', n2.x, n2.y);
  victim.owner = 0;
  victim.hp = 2;
  clanRound(s);
  assert.ok(!s.units.includes(victim), 'a weak unit is cut down');
  assert.equal(s.units.length, s0);
});

test('destroying a camp: defeat the guard, step on it, collect the reward; the clan scatters', () => {
  const s = game();
  const c = camp(s, 'wolf');
  s.turn = c.spawn;
  clanRound(s);
  const out = raidersOf(s, c).find((u) => !isGuard(s, u))!;
  assert.ok(out);
  const g = unitAt(s, c.x, c.y)!;
  s.units.splice(s.units.indexOf(g), 1); // the guard falls
  const t = tileAt(s, c.x, c.y)!;
  const next = neighbors(s, c.x, c.y).find((n) => n.terrain === 'field' && !unitAt(s, n.x, n.y))!;
  const mine = spawnNeutral(s, 'warrior', next.x, next.y);
  mine.owner = 0;
  mine.moved = mine.attacked = false;
  s.current = 0;
  const p = s.players[0];
  p.explored[c.y * s.size + c.x] = true;
  const stars = p.stars, bonus = p.bonusScore, kills = p.kills;
  const clear = tileActions(s, 0, t).find((a) => a.id === 'wild:clan:clear')!;
  assert.ok(clear.enabled, 'Clear Camp is offered');
  assert.ok(doAction(s, 0, t, 'wild:clan:clear'));
  assert.equal(clanCampAt(s, c.x, c.y), undefined);
  assert.equal(mine.x, c.x);
  assert.equal(p.stars, stars + campReward(s, 0));
  assert.ok(campReward(s, 0) >= 8);
  assert.equal(p.bonusScore, bonus + CAMP_SCORE);
  assert.equal(p.kills, kills + 1);
  assert.equal(s.clans!.cleared, 1);
  clanRound(s);
  assert.ok(!s.units.includes(out), 'its raiders scatter');
});

test('walking onto a camp burns it too, and the guard must fall first', () => {
  const s = game();
  const c = camp(s, 'hill');
  const t = tileAt(s, c.x, c.y)!;
  const next = neighbors(s, c.x, c.y).find((n) => n.terrain === 'field' && !unitAt(s, n.x, n.y))!;
  const mine = spawnNeutral(s, 'rider', next.x, next.y);
  mine.owner = 1;
  mine.moved = mine.attacked = false;
  s.players[1].explored[c.y * s.size + c.x] = true;
  const clear = tileActions(s, 1, t).find((a) => a.id === 'wild:clan:clear')!;
  assert.ok(!clear.enabled && /guard/.test(clear.reason!));
  s.units.splice(s.units.indexOf(unitAt(s, c.x, c.y)!), 1);
  assert.ok(moveUnit(s, mine, c.x, c.y));
  assert.equal(s.clans!.camps.length, 0);
  // a slain raider pays a small bounty
  const c2 = camp(s, 'wolf');
  const spot = neighbors(s, c2.x, c2.y).find((n) => n.terrain === 'field' && !unitAt(s, n.x, n.y))!;
  const r = raider(s, c2, 'warrior', spot.x, spot.y);
  r.hp = 1;
  const hunter = neighbors(s, spot.x, spot.y).find((n) => n.terrain === 'field' && !unitAt(s, n.x, n.y) && !clanCampAt(s, n.x, n.y))!;
  const h = spawnNeutral(s, 'archer', hunter.x, hunter.y);
  h.owner = 1;
  h.moved = h.attacked = false;
  s.players[1].explored.fill(true);
  const before = s.players[1].stars;
  assert.ok(attack(s, h, r));
  assert.ok(!s.units.includes(r));
  assert.equal(s.players[1].stars, before + RAIDER_BOUNTY + 1); // and Chiefdom's +1★ a kill (see game/government)
});

test('bribe: the clan leaves you alone for a while and raids someone else', () => {
  const s = game();
  const c = camp(s, 'wolf');
  c.spawn = 999;
  const t = quietLand(s, 0);
  t.improvement = 'mine';
  const r = raider(s, c, 'warrior', t.x, t.y);
  const ct = tileAt(s, c.x, c.y)!;
  s.players[0].explored[c.y * s.size + c.x] = true;
  s.players[0].stars = 30;
  const bribe = tileActions(s, 0, ct).find((a) => a.id === 'wild:clan:bribe')!;
  assert.ok(bribe.enabled);
  assert.ok(doAction(s, 0, ct, 'wild:clan:bribe'));
  assert.equal(s.players[0].stars, 30 - bribeCost(s));
  assert.equal(c.truce[0].until, s.turn + TRUCE);
  clanRound(s);
  assert.equal(t.improvement, 'mine', 'paid off: nothing is pillaged');
  assert.ok(!tileActions(s, 0, ct).find((a) => a.id === 'wild:clan:bribe')!.enabled, 'no paying twice');
  s.turn += TRUCE;
  if (r.x !== t.x || r.y !== t.y) { r.x = t.x; r.y = t.y; }
  clanRound(s);
  assert.equal(t.improvement, null, 'the truce is over');
  // the AI pays off a clan whose raiders are in its land while it has no one to fight them
  const s2 = game();
  const c2 = camp(s2, 'horse');
  c2.spawn = 999;
  for (const u of s2.units.filter((u) => u.owner === 1)) s2.units.splice(s2.units.indexOf(u), 1);
  const land = quietLand(s2, 1);
  raider(s2, c2, 'rider', land.x, land.y);
  s2.players[1].explored[c2.y * s2.size + c2.x] = true;
  s2.players[1].stars = 20;
  s2.current = 1;
  assert.ok(clanAi(s2, 1));
  assert.equal(c2.truce[0].pid, 1);
});

test('recruit: pay to take one of the clan’s raiders as your own', () => {
  const s = game();
  const c = camp(s, 'wolf');
  const ct = tileAt(s, c.x, c.y)!;
  s.players[2].explored[c.y * s.size + c.x] = true;
  s.players[2].stars = 40;
  const cost = recruitCost(s, c);
  const n = s.units.filter((u) => u.owner === 2).length;
  assert.ok(doAction(s, 2, ct, 'wild:clan:recruit'), 'with no raider out, a fresh one steps out beside the camp');
  assert.equal(s.players[2].stars, 40 - cost);
  assert.equal(s.units.filter((u) => u.owner === 2).length, n + 1);
  // with a raider out, that one defects
  s.turn = c.spawn;
  clanRound(s);
  const out = raidersOf(s, c).find((u) => !isGuard(s, u))!;
  assert.ok(doAction(s, 2, ct, 'wild:clan:recruit'));
  assert.equal(out.owner, 2);
  assert.ok(!isRaider(s, out));
  assert.equal(out.homeCity, null);
});

test('a Sea clan raids from canoes on a coast', () => {
  const s = game();
  const site = s.tiles.find((t) => campSite(s, t) && neighbors(s, t.x, t.y).filter((n) => n.terrain === 'shallow').length >= 2);
  if (!site) return; // no coast free on this map
  const c = camp(s, 'sea', site);
  s.turn = c.spawn;
  clanRound(s);
  const out = raidersOf(s, c).find((u) => !isGuard(s, u))!;
  assert.equal(out.kind, 'boat');
  assert.ok(out.carrying && CLANS.sea.raiders[0].includes(out.carrying));
  assert.equal(out.hp, maxHp(out));
});

test('a 30-turn all-AI game: camps spawn, raid and get cleared, and no capital falls to them', () => {
  const s = createGame({ seed: 2, human: null, opponents: ['rome', 'egypt', 'mongols', 'celts', 'maya'], mode: 'perfection', maxTurns: 30, clans: true, wild: true, rebels: true, diplomacy: true });
  startTurn(s);
  let pillaged = 0, raided = 0, bribes = 0, pitched = 0;
  const seen = new Set<number>();
  let guard = 0;
  while (!s.over && guard++ < 4000) {
    let n = 0;
    while (aiStep(s) && n++ < 400);
    endTurn(s);
    for (const e of drain()) {
      if (e.type !== 'toast') continue;
      if (/Raiders .*(tear|knock|besiege)/.test(e.text)) pillaged++;
      if (/Raiders .*(attack|cut down)/.test(e.text)) raided++;
      if (/and will leave you alone/.test(e.text)) bribes++;
    }
    for (const c of s.clans?.camps ?? []) if (!seen.has(c.id)) { seen.add(c.id); pitched++; }
    for (const u of s.units) if (isRaider(s, u)) {
      const t = tileAt(s, u.x, u.y)!;
      assert.ok(!(t.cityId !== null && s.cities.find((k) => k.id === t.cityId)!.capital), 'raiders never stand on a capital');
    }
  }
  assert.ok(s.over);
  assert.ok(pitched >= 1, 'camps appeared');
  assert.ok(pillaged + raided >= 1, `they raided (${pillaged} pillaged, ${raided} attacks)`);
  assert.ok(s.clans!.cleared >= 1, 'and at least one was burned');
  assert.ok(s.cities.filter((k) => isNeutral(s, k.owner)).every((k) => k.data?.rogue), 'only Rogue States belong to no empire');
  void bribes; void wildRound; void empires;
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { TRIBE_IDS } from '../src/data/tribes';
import { aiTurn } from '../src/game/ai';
import { drain } from '../src/game/events';
import { tileAt } from '../src/game/grid';
import { needWhy, stockYield, LUX_EXTRA, LUX_FIRST, isLuxury, luxuryIncome, STOCK_CAP, stockOf } from '../src/game/goods';
import { createGame, spawnUnit } from '../src/game/mapgen';
import { doAction, income, techCost, tileActions } from '../src/game/rules';
import { checkSparks, EUREKA_OFF, EUREKAS } from '../src/game/sparks';
import { endTurn, startTurn } from '../src/game/turn';
import type { GameState, TribeId } from '../src/game/types';
import type { Luxury } from '../src/game/goods';
import { TECHS } from '../src/data/techs';


function game(me: TribeId = 'rome', foes: TribeId[] = ['greeks'], seed = 7) {
  const s = createGame({ seed, human: me, opponents: foes, mode: 'domination' });
  for (const p of s.players) p.explored.fill(true);
  return s;
}
const cap = (s: GameState, pid = 0) => s.cities.find((c) => c.owner === pid && c.capital)!;

test('luxuries: deposits on every map, and one near every capital', () => {
  for (let seed = 1; seed <= 10; seed++) {
    const s = game('rome', ['vikings', 'egypt', 'inca'], seed);
    const lux = s.tiles.filter((t) => isLuxury(t.resource));
    assert.ok(lux.length >= 6, `seed ${seed}: only ${lux.length} luxuries`);
    for (const t of lux) assert.ok(!t.village && t.cityId === null && !t.improvement);
    const near = s.cities.filter((c) => lux.some((t) => Math.max(Math.abs(t.x - c.x), Math.abs(t.y - c.y)) <= 2)).length;
    assert.ok(near >= s.cities.length - 1, `seed ${seed}: capitals near a luxury ${near}/${s.cities.length}`);
  }
});

test('luxuries: developing one grows the city and pays; a new kind pays more than a copy', () => {
  const s = game();
  const c = cap(s);
  const spots = s.tiles.filter((t) => t.owner === c.id && t.cityId === null && t.terrain !== 'shallow' && t.terrain !== 'ocean').slice(0, 3);
  for (const t of spots) { t.terrain = 'field'; t.resource = null; t.improvement = null; }
  assert.equal(spots.length, 3);
  const kinds: Luxury[] = ['wine', 'wine', 'ivory'];
  spots.forEach((t, i) => { t.resource = kinds[i]; });
  s.players[0].techs.push('farming', 'hunting');
  s.players[0].stars = 100;
  const base = income(s, 0);
  const pop = c.pop + c.level * 100;
  const act = tileActions(s, 0, spots[0]).find((a) => a.id === 'luxury')!;
  assert.ok(act?.enabled, 'a Vineyard can be built');
  assert.ok(doAction(s, 0, spots[0], 'luxury'));
  assert.equal(spots[0].improvement, 'estate');
  assert.ok(c.pop + c.level * 100 > pop, 'the city grew');
  assert.equal(luxuryIncome(s, 0), LUX_FIRST);
  assert.ok(doAction(s, 0, spots[1], 'luxury'));
  assert.equal(luxuryIncome(s, 0), LUX_FIRST + LUX_EXTRA, 'a second vineyard pays the extra');
  assert.ok(doAction(s, 0, spots[2], 'luxury'));
  assert.equal(luxuryIncome(s, 0), 2 * LUX_FIRST + LUX_EXTRA);
  assert.ok(income(s, 0) >= base + 2 * LUX_FIRST + LUX_EXTRA);
});

test('luxuries: need their tech', () => {
  const s = game();
  const c = cap(s);
  const t = s.tiles.find((x) => x.owner === c.id && !x.resource && !x.improvement && x.cityId === null && x.terrain === 'field')!;
  t.resource = 'wine';
  s.players[0].stars = 100;
  s.players[0].techs = s.players[0].techs.filter((x) => x !== 'farming');
  const a = tileActions(s, 0, t).find((x) => x.id === 'luxury')!;
  assert.ok(!a.enabled && a.needs === 'farming');
});

test('iron and horses: mines and pastures fill the stockpile, capped', () => {
  const s = game();
  const c = cap(s);
  const tiles = s.tiles.filter((t) => t.owner === c.id && t.cityId === null).slice(0, 3);
  tiles[0].improvement = 'mine';
  tiles[1].improvement = 'mine';
  tiles[2].improvement = 'pasture';
  s.current = 0; s.turn = 1;
  startTurn(s);
  drain();
  assert.deepEqual(stockOf(s.players[0]), { iron: 2, horses: 1 });
  for (let i = 0; i < 20; i++) startTurn(s);
  drain();
  assert.equal(stockOf(s.players[0]).iron, STOCK_CAP);
});

test('swordsmen need iron; knights need horses; training spends them', () => {
  const s = game();
  const c = cap(s);
  const t = tileAt(s, c.x, c.y)!;
  s.units = s.units.filter((u) => !(u.x === c.x && u.y === c.y));
  s.players[0].techs.push('climbing', 'mining', 'smithing', 'riding', 'horsemanship', 'chivalry');
  s.players[0].stars = 100;
  const sw = () => tileActions(s, 0, t).find((a) => a.id === 'train:swordsman')!;
  let a = sw();
  assert.ok(a && !a.enabled && /Iron/.test(a.reason!), `no iron: ${a?.reason}`);
  stockOf(s.players[0]).iron = 3;
  a = sw();
  assert.ok(a.enabled);
  assert.ok(doAction(s, 0, t, 'train:swordsman'));
  assert.equal(stockOf(s.players[0]).iron, 1);
  assert.match(needWhy(s, 0, 'knight') ?? '', /Horses/);
  stockOf(s.players[0]).horses = 2;
  assert.equal(needWhy(s, 0, 'knight'), undefined);
});

test('a unique unit needs what the unit it replaces needs', () => {
  const s = game('japan');
  const c = cap(s);
  const t = tileAt(s, c.x, c.y)!;
  s.units = s.units.filter((u) => !(u.x === c.x && u.y === c.y));
  s.players[0].techs.push('climbing', 'mining', 'smithing');
  s.players[0].stars = 100;
  const acts = tileActions(s, 0, t).filter((a) => a.id.startsWith('train:') && a.needs === undefined && /Iron/.test(a.reason ?? ''));
  assert.ok(acts.length >= 1, 'something iron-age is blocked without iron');
});

test('eurekas: every shared tech has one, and earning it makes the tech cheaper', () => {
  for (const t of TECHS) assert.ok(EUREKAS[t.id], `${t.id} has a Eureka`);
  const s = game();
  const before = techCost(s, 0, 'philosophy');
  s.players[0].techs.push('climbing', 'meditation', 'gathering', 'hunting', 'fishing', 'riding', 'farming', 'forestry');
  const got = checkSparks(s, 0);
  assert.ok(got.includes('philosophy'));
  const ev = drain();
  assert.ok(ev.some((e) => e.type === 'toast' && /Eureka/.test(e.text)));
  assert.ok(techCost(s, 0, 'philosophy') <= Math.ceil(before * (1 - EUREKA_OFF)) + 1);
  assert.deepEqual(checkSparks(s, 0), [], 'a Eureka is only awarded once');
});

test('eurekas: a unit on a mountain sparks Meditation', () => {
  const s = game();
  const m = s.tiles.find((t) => t.terrain === 'mountain' && !s.units.some((u) => u.x === t.x && u.y === t.y))!;
  assert.ok(!s.players[0].sparks?.includes('meditation'));
  spawnUnit(s, 'warrior', 0, m.x, m.y, null);
  checkSparks(s, 0);
  assert.ok(s.players[0].sparks!.includes('meditation'));
});

test('AI games run cleanly with resources: stocks stay within the cap', () => {
  for (const seed of [3, 11]) {
    const five = TRIBE_IDS.slice(seed % 20, seed % 20 + 5) as TribeId[];
    const s = createGame({ seed, human: null, opponents: five, mode: 'perfection' });
    startTurn(s);
    let g = 0, estates = 0, sparks = 0;
    while (!s.over && g++ < 400) { aiTurn(s); endTurn(s); drain(); }
    for (const p of s.players) {
      const st = stockOf(p);
      assert.ok(st.iron >= 0 && st.iron <= STOCK_CAP && st.horses >= 0 && st.horses <= STOCK_CAP);
      sparks += p.sparks?.length ?? 0;
    }
    estates = s.tiles.filter((t) => t.improvement === 'estate').length;
    assert.ok(estates > 0, `seed ${seed}: the AI develops luxuries`);
    assert.ok(sparks > 0, `seed ${seed}: the AI earns Eurekas`);
  }
});

test('horse nations breed more at each pasture; pirates smuggle iron through their ports', () => {
  for (const [tribe, imp, key, want] of [['mongols', 'pasture', 'horses', 2], ['rome', 'pasture', 'horses', 1], ['pirates', 'port', 'iron', 1], ['rome', 'port', 'iron', 0]] as const) {
    const s = game(tribe);
    const c = cap(s);
    const t = s.tiles.find((x) => x.owner === c.id && x.cityId === null)!;
    for (const x of s.tiles) if (x.owner === c.id && (x.improvement === 'mine' || x.improvement === 'pasture' || x.improvement === 'port')) x.improvement = null;
    t.improvement = imp;
    assert.equal(stockYield(s, 0)[key], want, `${tribe} ${imp}`);
  }
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { FLATS_STARS, NATURAL_IDS, NATURALS, naturalAt, naturalHolder, PEAK_DEF, type NaturalId } from '../src/data/naturals';
import { aiTurn } from '../src/game/ai';
import { drain } from '../src/game/events';
import { dist, isWater, neighbors, tileAt } from '../src/game/grid';
import { createGame, revealAround, spawnUnit } from '../src/game/mapgen';
import {
  CAPITAL_GAP, FIRST_SCORE, FIRST_STARS, glimpsed, LATER_SCORE, MIN_NATURALS, naturalDescribe, naturalGoals, naturalTurnStart,
} from '../src/game/naturals';
import { perkSum } from '../src/game/perks';
import { cityIncome, maxHp, moveOptions, techCost, tileActions, unitDef } from '../src/game/rules';
import { endTurn } from '../src/game/turn';
import type { GameState, Tile } from '../src/game/types';
import { drawNaturalArt, drawNaturalGlimpse, drawNaturalIcon } from '../src/render/naturals';

const game = (seed = 7, n = 3) => createGame({ seed, human: null, opponents: (['rome', 'greeks', 'vikings', 'egypt', 'inca', 'celts'] as const).slice(0, n), mode: 'domination' });
const cap = (s: GameState, pid = 0) => s.cities.find((c) => c.owner === pid && c.capital)!;

/** Puts wonder `id` on a plain tile of player 0's capital land (right terrain forced), replacing any others. */
function plant(s: GameState, id: NaturalId): Tile {
  const c = cap(s);
  const t = neighbors(s, c.x, c.y, 1).find((x) => !x.village && x.cityId === null && !s.units.some((u) => u.x === x.x && u.y === x.y))!;
  t.terrain = NATURALS[id].terrain[0];
  t.resource = null;
  t.improvement = null;
  s.naturals = { sites: [{ id, x: t.x, y: t.y, found: [0] }] };
  return t;
}

test('placement: at least two on every map, about one per 150 tiles, each kind once, on suitable free tiles far from capitals', () => {
  for (let seed = 1; seed <= 12; seed++) {
    for (const [n, size] of [[2, 'normal'], [4, 'large'], [8, 'huge']] as const) {
      const s = createGame({ seed, human: null, opponents: (['rome', 'greeks', 'vikings', 'egypt', 'inca', 'celts', 'zulu', 'japan'] as const).slice(0, n), mode: 'domination', mapSize: size, wild: true });
      const sites = s.naturals!.sites;
      const want = Math.min(8, Math.max(MIN_NATURALS, Math.round((s.size * s.size) / 150)));
      assert.ok(sites.length >= MIN_NATURALS, `seed ${seed} ${size}: ${sites.length} wonders`);
      assert.ok(sites.length <= want, `seed ${seed}: too many`);
      assert.equal(new Set(sites.map((x) => x.id)).size, sites.length, 'each kind at most once');
      for (const x of sites) {
        const t = tileAt(s, x.x, x.y)!;
        const d = NATURALS[x.id as NaturalId];
        assert.ok(d.terrain.includes(t.terrain), `${x.id} on ${t.terrain}`);
        assert.ok(!t.village && !t.ruin && !t.resource && !t.improvement && t.cityId === null);
        if (d.coast) assert.ok(neighbors(s, t.x, t.y).some(isWater));
        for (const c of s.cities) assert.ok(dist(c.x, c.y, t.x, t.y) > CAPITAL_GAP, 'not near a capital');
        assert.deepEqual(x.found, [], 'nobody starts next to one');
      }
    }
  }
});

test('placement uses its own random stream: the rest of the map is unchanged, and a seed always gives the same wonders', () => {
  const a = createGame({ seed: 42, human: 'rome', opponents: ['greeks', 'vikings'], mode: 'domination', wild: true });
  const b = createGame({ seed: 42, human: 'rome', opponents: ['greeks', 'vikings'], mode: 'domination', wild: true, naturals: false });
  const c = createGame({ seed: 42, human: 'rome', opponents: ['greeks', 'vikings'], mode: 'domination', wild: true });
  assert.equal(b.naturals, undefined);
  assert.deepEqual(a.naturals, c.naturals);
  for (let i = 0; i < a.tiles.length; i++) {
    const ta = a.tiles[i], tb = b.tiles[i];
    if (naturalAt(a, ta.x, ta.y)) { assert.equal(ta.terrain, tb.terrain); continue; } // only a resource may be cleared from under one
    assert.deepEqual(ta, tb);
  }
  assert.deepEqual(a.units, b.units);
  assert.deepEqual(a.cities, b.cities);
});

test('discovery: the first empire to see a wonder gets stars and score, later finders a little score; a toast says so', () => {
  const s = game();
  const n = s.naturals!.sites[0];
  drain();
  const p0 = s.players[0], p1 = s.players[1];
  const stars = p0.stars, score = p0.bonusScore;
  p0.explored.fill(true); // a map is not a sighting
  revealAround(s, 0);
  assert.equal(p0.stars, stars, 'a map alone finds nothing');
  assert.ok(glimpsed(s, 0, n), 'but the wonder is somewhere to go');
  spawnUnit(s, 'warrior', 0, n.x, n.y, null).x = n.x;
  revealAround(s, 0);
  assert.deepEqual(n.found, [0]);
  assert.equal(p0.stars, stars + FIRST_STARS);
  assert.equal(p0.bonusScore, score + FIRST_SCORE);
  const ev = drain();
  assert.ok(ev.some((e) => e.type === 'toast' && e.player === 0 && e.text.includes(`You discovered ${NATURALS[n.id as NaturalId].name}`)));
  assert.ok(s.log.some((l) => l.text.includes('discover')));
  revealAround(s, 0);
  assert.equal(p0.stars, stars + FIRST_STARS, 'found only once');
  const s1 = p1.stars, sc1 = p1.bonusScore;
  s.units = s.units.filter((u) => !(u.x === n.x && u.y === n.y));
  spawnUnit(s, 'warrior', 1, n.x, n.y, null);
  revealAround(s, 1);
  assert.deepEqual(n.found, [0, 1]);
  assert.equal(p1.stars, s1, 'no stars for a later finder');
  assert.equal(p1.bonusScore, sc1 + LATER_SCORE);
  assert.ok(!glimpsed(s, 1, n));
});

test('glimpse: a wonder just past the known map shows as a light over the clouds, and the computer goes for it', () => {
  const s = game();
  const n = s.naturals!.sites[0];
  const p = s.players[0];
  p.explored.fill(false);
  assert.ok(!glimpsed(s, 0, n));
  p.explored[(n.y) * s.size + Math.min(s.size - 1, n.x + 2)] = true;
  assert.ok(glimpsed(s, 0, n));
  assert.ok(naturalGoals(s, 0).includes(n));
  let fills = 0;
  const ctx = new Proxy({}, { get: (_t, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => { if (k === 'fill') fills++; }), set: () => true }) as unknown as CanvasRenderingContext2D;
  drawNaturalGlimpse(ctx, s, tileAt(s, n.x, n.y)!, 0, 8);
  assert.ok(fills > 0, 'the light is drawn');
});

test('art: every wonder, its icon and the glimpse light draw without throwing', () => {
  let fills = 0;
  const ctx = new Proxy({}, { get: (_t, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => { if (k === 'fill' || k === 'stroke') fills++; }), set: () => true }) as unknown as CanvasRenderingContext2D;
  for (const id of NATURAL_IDS) {
    const before = fills;
    drawNaturalArt(ctx, id, 0, 0);
    drawNaturalIcon(ctx, id, 30, 30, 52);
    assert.ok(fills - before > 20, `${id} draws a real picture`);
  }
});

test('a wonder tile cannot be built on, harvested, roaded or settled', () => {
  const s = game();
  const t = plant(s, 'flats');
  t.terrain = 'field';
  s.players[0].techs.push('masonry', 'carpentry', 'roads', 'farming');
  s.players[0].stars = 99;
  const ids = tileActions(s, 0, t).map((a) => a.id);
  for (const id of ['temple', 'market', 'road']) assert.ok(!ids.includes(id), `${id} is blocked`);
  s.naturals = { sites: [] };
  const plain = tileActions(s, 0, t).map((a) => a.id);
  assert.ok(plain.includes('temple') && plain.includes('road'), 'the same tile without a wonder offers them');
});

test('holding: news when it comes inside your borders; the holder is whoever owns its land', () => {
  const s = game();
  const t = plant(s, 'flats');
  drain();
  naturalTurnStart(s, 0);
  assert.equal(naturalHolder(s, s.naturals!.sites[0]), 0);
  assert.ok(drain().some((e) => e.type === 'toast' && e.player === 0 && e.text.includes('within your borders')));
  t.owner = cap(s, 1).id;
  naturalTurnStart(s, 1);
  assert.equal(naturalHolder(s, s.naturals!.sites[0]), 1);
  const ev = drain();
  assert.ok(ev.some((e) => e.type === 'toast' && e.player === 0 && e.text.includes('passed out of your borders')));
  const d = naturalDescribe(s, t, 0)!;
  assert.match(d.title, /Skymirror/);
  assert.match(d.desc, /Held by|unknown empire/);
});

test('Skymirror Flats: its city earns +2★ a turn', () => {
  const s = game();
  const c = cap(s);
  s.naturals = { sites: [] };
  const base = cityIncome(s, c);
  plant(s, 'flats');
  assert.equal(cityIncome(s, c), base + FLATS_STARS);
});

test('Glimmerdeep Grotto: research is cheaper', () => {
  const s = game();
  s.naturals = { sites: [] };
  const base = techCost(s, 0, 'riding');
  plant(s, 'grotto');
  assert.ok(techCost(s, 0, 'riding') < base);
});

test('Mount Halcyra: +1 defence for your units on its city’s land, none elsewhere', () => {
  const s = game();
  const u = s.units.find((x) => x.owner === 0)!;
  s.naturals = { sites: [] };
  const base = unitDef(s, u);
  plant(s, 'peak');
  assert.equal(unitDef(s, u), base + PEAK_DEF);
  const e = s.units.find((x) => x.owner === 1)!;
  const eb = unitDef(s, e);
  s.naturals = { sites: [] };
  assert.equal(unitDef(s, e), eb, 'an enemy far away gets nothing');
});

test('Thundermantle Falls: your wounded units on its city’s land heal fully at the start of your turn', () => {
  const s = game();
  plant(s, 'falls');
  const u = s.units.find((x) => x.owner === 0)!;
  u.hp = 2;
  naturalTurnStart(s, 0);
  assert.equal(u.hp, maxHp(u));
});

test('the Hollowcrown Elder: +1 population to its city every 5 turns', () => {
  const s = game();
  plant(s, 'elder');
  const c = cap(s);
  const pop = () => c.pop + c.level * 100;
  const before = pop();
  s.turn = 4;
  naturalTurnStart(s, 0);
  assert.equal(pop(), before);
  s.turn = 5;
  naturalTurnStart(s, 0);
  assert.ok(pop() > before);
});

test('Emberbreath Springs: a land unit starting next to it moves further', () => {
  const s = game();
  const t = plant(s, 'springs');
  const c = cap(s);
  const u = s.units.find((x) => x.owner === 0)!;
  u.x = c.x; u.y = c.y; u.moved = false;
  assert.ok(dist(t.x, t.y, u.x, u.y) <= 1);
  s.players[0].explored.fill(true);
  const near = moveOptions(s, u).length;
  s.naturals = { sites: [] };
  const plain = moveOptions(s, u).length;
  assert.ok(near > plain, `${near} > ${plain}`);
});

test('the Opaline Reef and the Lanternveil Glacier: empire-wide perks while held', () => {
  const s = game();
  plant(s, 'reef');
  assert.equal(perkSum(s, 0, 'grow', (p) => p.on === 'fish'), 1);
  assert.equal(perkSum(s, 0, 'income', (p) => p.per === 'port'), 1);
  assert.equal(perkSum(s, 1, 'grow', (p) => p.on === 'fish'), 0, 'only for its holder');
  s.naturals = { sites: [] };
  const sight = perkSum(s, 0, 'vision');
  plant(s, 'glacier');
  assert.equal(perkSum(s, 0, 'vision'), sight + 1);
  assert.equal(perkSum(s, 0, 'levelstar'), 2);
});

test('old saves without wonders load and play', () => {
  const s = game(11);
  delete s.naturals;
  const back = JSON.parse(JSON.stringify(s)) as GameState;
  for (let i = 0; i < back.players.length * 3; i++) { aiTurn(back); endTurn(back); }
  assert.equal(back.naturals, undefined);
  assert.equal(naturalDescribe(back, back.tiles[0], 0), null);
});

test('a 30-turn all-AI game: wonders are found, some are held, and nothing breaks', () => {
  let found = 0, held = 0, firsts = 0;
  for (const seed of [3, 8]) {
    const s = createGame({ seed, human: null, opponents: ['rome', 'greeks', 'vikings', 'egypt'], mode: 'perfection', maxTurns: 30, mapSize: 'large' });
    let guard = 0;
    while (!s.over && guard++ < 400) { aiTurn(s); endTurn(s); }
    drain();
    assert.ok(s.turn >= 29, 'the game ran its course');
    for (const n of s.naturals!.sites) {
      found += n.found.length;
      if (n.found.length) firsts++;
      if (naturalHolder(s, n) !== null) held++;
      assert.deepEqual(n.found, [...new Set(n.found)], 'each empire finds it once');
    }
    assert.ok(JSON.parse(JSON.stringify(s.naturals)));
  }
  console.log(`# naturals: ${firsts} wonders found (${found} finds), ${held} held at the end`);
  assert.ok(firsts >= 3, `wonders were discovered (${firsts})`);
});

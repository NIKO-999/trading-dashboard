import assert from 'node:assert/strict';
import test from 'node:test';
import { TRIBE_IDS } from '../src/data/tribes';
import { FORGE_MAX, FORGE_TIERS, forgeBonus } from '../src/data/forge';
import { aiTurn } from '../src/game/ai';
import { drain } from '../src/game/events';
import { goodsOf, stockOf } from '../src/game/goods';
import { createGame, spawnUnit } from '../src/game/mapgen';
import { attackRange, doAction, moveOptions, previewCombat, tileActions } from '../src/game/rules';
import { endTurn, startTurn } from '../src/game/turn';
import type { GameState, Tile, TribeId } from '../src/game/types';

function setup(me: TribeId = 'greeks') {
  const s = createGame({ seed: 7, human: me, opponents: ['vikings'], mapSize: 'large', mode: 'perfection' });
  for (const t of s.tiles) { t.terrain = 'field'; t.resource = null; t.improvement = null; t.village = false; t.ruin = false; }
  s.units = [];
  for (const q of s.players) q.explored.fill(true);
  const p = s.players[0];
  p.stars = 200;
  p.techs.push('tactics', 'hunting', 'archery');
  const c = s.cities.find((k) => k.owner === 0)!;
  const yard = s.tiles.find((t) => t.owner === c.id && t.cityId === null)!;
  assert.ok(doAction(s, 0, yard, 'barracks'));
  stockOf(p).goods = 15; // all five tiers: 1+2+3+4+5
  return { s, yard };
}
const act = (s: GameState, t: Tile, id: string) => tileActions(s, 0, t).find((a) => a.id === id);

test('the Armoury: a tier costs stars and luxury goods and lifts every unit of that type, for good', () => {
  const { s, yard } = setup();
  const a = spawnUnit(s, 'archer', 0, 3, 3, null);
  const foe = spawnUnit(s, 'warrior', 1, 5, 3, null);
  const before = previewCombat(s, a, foe).dmg;
  const r0 = attackRange(s, a);
  const tier = act(s, yard, 'forge:archer')!;
  assert.ok(tier.enabled && tier.cost === FORGE_TIERS[0].stars);
  assert.ok(doAction(s, 0, yard, 'forge:archer'));
  assert.equal(goodsOf(s.players[0]), 15 - FORGE_TIERS[0].goods);
  assert.equal(forgeBonus(s.players[0], 'archer', 'atk'), 0.5);
  assert.ok(previewCombat(s, a, foe).dmg >= before);
  // tier 2: +1 movement, also for archers trained later
  assert.ok(doAction(s, 0, yard, 'forge:archer'));
  const late = spawnUnit(s, 'archer', 0, 10, 10, null);
  late.moved = false;
  assert.ok(Math.max(...moveOptions(s, late).map((o) => Math.max(Math.abs(o.x - 10), Math.abs(o.y - 10)))) >= 2);
  assert.ok(doAction(s, 0, yard, 'forge:archer'));
  // tier 4 needs a Drill Yard, and gives an archer +1 range
  const t4 = act(s, yard, 'forge:archer')!;
  assert.ok(!t4.enabled && /Drill Yard/.test(t4.reason!));
  assert.ok(doAction(s, 0, yard, 'barracks:expand'));
  assert.ok(doAction(s, 0, yard, 'forge:archer'));
  assert.equal(attackRange(s, a), r0 + 1);
  assert.ok(doAction(s, 0, yard, 'barracks:expand'));
  assert.ok(doAction(s, 0, yard, 'forge:archer'));
  assert.equal(act(s, yard, 'forge:archer'), undefined, `${FORGE_MAX} tiers at most`);
});

test('no goods, no upgrade; melee units get attack at tier 4 instead of range', () => {
  const { s, yard } = setup();
  stockOf(s.players[0]).goods = 0;
  const a = act(s, yard, 'forge:warrior') ?? act(s, yard, tileActions(s, 0, yard).find((x) => x.id.startsWith('forge:'))!.id)!;
  assert.ok(!a.enabled && /luxury goods/.test(a.reason!));
  s.players[0].forge = { warrior: 4 };
  assert.equal(forgeBonus(s.players[0], 'warrior', 'range'), 0);
  assert.equal(forgeBonus(s.players[0], 'warrior', 'atk'), 1.5);
});

test('developed luxuries make goods each turn', () => {
  const s = createGame({ seed: 7, human: 'rome', opponents: ['vikings'], mode: 'perfection' });
  const c = s.cities.find((k) => k.owner === 0)!;
  const t = s.tiles.find((x) => x.owner === c.id && x.cityId === null)!;
  t.resource = 'wine'; t.improvement = 'estate';
  s.turn = 1; s.current = 0; startTurn(s); drain();
  assert.equal(goodsOf(s.players[0]), 1);
});

test('AI empires buy Armoury tiers', () => {
  let tiers = 0;
  for (const seed of [2, 9]) {
    const s = createGame({ seed, human: null, opponents: TRIBE_IDS.slice(seed, seed + 5) as TribeId[], mode: 'perfection' });
    startTurn(s);
    let g = 0;
    while (!s.over && g++ < 400) { aiTurn(s); endTurn(s); drain(); }
    for (const p of s.players) tiers += Object.values(p.forge ?? {}).reduce((a, n) => a + (n ?? 0), 0);
  }
  assert.ok(tiers > 0, 'the AI uses the Armoury');
});

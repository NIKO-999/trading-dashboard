import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { doAction, moveOptions, moveUnit, tileActions } from '../../src/game/rules';
import { isLand, neighbors, tileAt } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { FREEZE_DAMAGE, HARVEST_COST, mech, restLeft, stats, WHALE } from '../../src/game/mech/inuit';
import type { GameState } from '../../src/game/types';

function setup() {
  const s = createGame({ seed: 5, human: 'inuit', opponents: ['japan'], mode: 'perfection' });
  // a field tile with open water to its east, far from everything
  let spot: { x: number; y: number } | null = null;
  for (let y = 1; y < s.size - 1 && !spot; y++)
    for (let x = 1; x + 2 < s.size && !spot; x++) {
      const box = [-1, 0, 1].flatMap((dy) => [0, 1, 2].map((dx) => tileAt(s, x + dx, y + dy)!));
      if (box.every((t) => t.cityId === null && !t.village) && !s.units.some((u) => u.x >= x && u.x <= x + 2 && Math.abs(u.y - y) <= 1)) spot = { x, y };
    }
  assert.ok(spot);
  const land = tileAt(s, spot.x, spot.y)!;
  for (const t of [-1, 0, 1].flatMap((dy) => [0, 1, 2].map((dx) => tileAt(s, spot!.x + dx, spot!.y + dy)!))) { t.resource = null; t.improvement = null; t.ruin = false; }
  land.terrain = 'field';
  const water = tileAt(s, spot.x + 1, spot.y)!;
  water.terrain = 'shallow';
  const far = tileAt(s, spot.x + 2, spot.y)!;
  far.terrain = 'ocean';
  const u = spawnUnit(s, 'warrior', 0, spot.x, spot.y, null);
  u.moved = u.attacked = false;
  return { s, u, land, water, far };
}

test('walking onto water freezes it into permanent ice, a land bridge', () => {
  const { s, u, water } = setup();
  assert.ok(moveOptions(s, u).some((o) => o.x === water.x && o.y === water.y), 'water is a highlighted move');
  assert.ok(moveUnit(s, u, water.x, water.y));
  assert.equal(water.terrain, 'ice');
  assert.ok(isLand(water));
  assert.equal(stats(s, 0).walked, 1);
  JSON.parse(JSON.stringify(s));
  // next turn the bridge lets the unit continue onto the next water tile
  u.moved = u.attacked = false;
  const next = tileAt(s, water.x + 1, water.y)!;
  assert.ok(moveOptions(s, u).some((o) => o.x === next.x && o.y === next.y));
});

test('Freeze water action works from the tile menu and costs a star', () => {
  const { s, u, water } = setup();
  s.players[0].stars = 5;
  const a = tileActions(s, 0, water).find((x) => x.id === 'mech:freeze');
  assert.ok(a && a.enabled);
  assert.ok(doAction(s, 0, water, 'mech:freeze'));
  assert.equal(water.terrain, 'ice');
  assert.equal(s.players[0].stars, 4);
  assert.ok(u.moved);
});

test('enemies on ice take freeze damage unless they have fire techs', () => {
  const { s, water } = setup();
  water.terrain = 'ice';
  const foe = spawnUnit(s, 'warrior', 1, water.x, water.y, null);
  foe.hp = 10;
  s.players[1].techs = [];
  mech.turnStart!(s, 0);
  assert.equal(foe.hp, 10 - FREEZE_DAMAGE);
  s.players[1].techs = ['smithing'];
  mech.turnStart!(s, 0);
  assert.equal(foe.hp, 10 - FREEZE_DAMAGE);
  s.players[1].techs = [];
  foe.hp = 1;
  mech.turnStart!(s, 0);
  assert.equal(foe.hp, 1, 'never lethal');
});

function whaleSetup() {
  const s = createGame({ seed: 5, human: 'inuit', opponents: ['japan'], mode: 'perfection' });
  const city = s.cities.find((c) => c.owner === 0)!;
  const t = neighbors(s, city.x, city.y).find((n) => n.terrain === 'shallow' || n.terrain === 'field')!;
  t.terrain = 'shallow'; t.resource = 'whale'; t.improvement = null; t.owner = city.id;
  s.players[0].techs.push('whaling');
  s.players[0].stars = 20;
  return { s, city, t };
}

test('Whale Harvest pays a lump sum, grows the city, depletes, and re-freezes', () => {
  const { s, city, t } = whaleSetup();
  assert.ok(!tileActions(s, 0, t).find((a) => a.id === 'harvest')?.enabled, 'one-shot harvest is blocked');
  const a = tileActions(s, 0, t).find((x) => x.id === 'mech:harvest');
  assert.ok(a && a.enabled, 'enabled for the human');
  const before = { stars: s.players[0].stars, pop: city.pop + city.level * 100 };
  assert.ok(doAction(s, 0, t, 'mech:harvest'));
  assert.equal(s.players[0].stars, before.stars - HARVEST_COST + WHALE.stars);
  assert.ok(city.pop + city.level * 100 > before.pop);
  assert.equal(t.resource, 'whale', 'the node stays');
  assert.equal(restLeft(t), WHALE.rest);
  const again = tileActions(s, 0, t).find((x) => x.id === 'mech:harvest')!;
  assert.ok(!again.enabled);
  for (let i = 0; i < WHALE.rest; i++) mech.turnStart!(s, 0);
  assert.equal(restLeft(t), 0);
  assert.ok(tileActions(s, 0, t).find((x) => x.id === 'mech:harvest')!.enabled);
  JSON.parse(JSON.stringify(s));
});

test('AI harvests nodes and bridges to unreachable enemy cities', () => {
  const { s, t } = whaleSetup();
  assert.ok(mech.ai!(s, 0));
  assert.equal(stats(s, 0).whales, 1);
  assert.ok(restLeft(t) > 0);
  // a separate island: our warrior beside water, an enemy city across it
  const w = setup();
  const enemy = w.s.cities.find((c) => c.owner === 1)!;
  w.s.players[0].explored.fill(true);
  const far = tileAt(w.s, w.water.x + 1, w.water.y)!;
  enemy.x = far.x; enemy.y = far.y; // (only the AI's view of geography matters here)
  const before = stats(w.s, 0).walked;
  let guard = 0;
  while (mech.ai!(w.s, 0) && guard++ < 5);
  assert.ok(stats(w.s, 0).walked > before, 'AI froze a bridge');
});

test('20-turn all-AI game with the Inuit completes and uses the mechanic', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['inuit', 'japan', 'mongols'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 20 && guard++ < 1000) { aiTurn(s); endTurn(s); }
  assert.ok(s.turn >= 20 || s.over);
  const id = s.players.findIndex((p) => p.tribe === 'inuit');
  const st = stats(s, id);
  assert.ok(st.whales + st.fish + st.walked > 0, JSON.stringify(st));
});

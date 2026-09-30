import assert from 'node:assert/strict';
import test from 'node:test';
import { aiStep } from '../src/game/ai';
import { drain } from '../src/game/events';
import { neighbors } from '../src/game/grid';
import { createGame, meet } from '../src/game/mapgen';
import { perkSum, perkUnit } from '../src/game/perks';
import { cityIncome, citiesOf, defenseBonus, doAction, income, score, tileActions, tileOwnerPlayer, unitAt } from '../src/game/rules';
import { endTurn, startTurn } from '../src/game/turn';
import type { GameState, Terrain, Tile } from '../src/game/types';
import {
  builtAt, HELD_SURCHARGE, HOME_DISCOUNT, INVEST_CAP, investRoom, REFUND_SHARE, siteOf, wonderCost, wonderTurnStart,
} from '../src/game/wonders';
import { WONDER_BY_ID, WONDER_SCORE, WONDERS, wondersHeldBy } from '../src/data/wonders';
import { drawWonderIcon, drawWonderTile } from '../src/render/wonders';
import { TRIBE_IDS } from '../src/data/tribes';
import { TECH_BY_ID } from '../src/data/techs';

const game = () => createGame({ seed: 5, human: 'egypt', opponents: ['rome', 'celts'], mode: 'perfection' });

/** A tile of `pid`'s capital territory made into an empty tile of `terrain` (touching water when `coast`). */
function plot(s: GameState, pid: number, terrain: Terrain, coast = false, skip: Tile[] = []): Tile {
  const cap = citiesOf(s, pid).find((c) => c.capital)!;
  const t = s.tiles.find((x) => x.owner === cap.id && x.cityId === null && !unitAt(s, x.x, x.y) && !skip.includes(x)
    && neighbors(s, x.x, x.y).some((n) => n.cityId === null && n.owner === cap.id && !skip.includes(n)))!;
  Object.assign(t, { terrain, resource: null, improvement: null, village: false, ruin: false });
  for (const n of neighbors(s, t.x, t.y)) if (n.cityId === null && !unitAt(s, n.x, n.y) && !skip.includes(n) && !builtAt(s, n.x, n.y)) n.terrain = coast ? 'shallow' : n.terrain === 'shallow' || n.terrain === 'ocean' ? 'field' : n.terrain;
  return t;
}

const learn = (s: GameState, pid: number, ...techs: string[]) => s.players[pid].techs.push(...techs);
const acts = (s: GameState, pid: number, t: Tile) => tileActions(s, pid, t).map((a) => a.id);
const begin = (s: GameState, pid: number, t: Tile, id: string) => doAction(s, pid, t, `wonder:begin:${id}`);

test('sixteen distinct wonders, each with a tech of the tree, terrain, a home empire and a bonus', () => {
  assert.equal(WONDERS.length, 16);
  assert.equal(new Set(WONDERS.map((w) => w.id)).size, 16);
  for (const w of WONDERS) {
    assert.ok(w.perks.length > 0 && w.terrain.length > 0 && w.home.length > 0, w.id);
    assert.ok(w.home.every((t) => TRIBE_IDS.includes(t)), w.id);
    assert.equal(TECH_BY_ID[w.tech]?.ring, 'core', `${w.id} is unlocked by a tech of the shared tree`);
  }
  // no two wonders give the same bundle
  assert.equal(new Set(WONDERS.map((w) => JSON.stringify(w.perks))).size, 16);
});

test('requirements: the tech, your own empty land, the right terrain, a coast for the Lighthouse', () => {
  const s = game();
  s.players[0].stars = 100;
  const field = plot(s, 0, 'field');
  assert.ok(!acts(s, 0, field).includes('wonder:begin:pyramids'), 'no Masonry yet');
  learn(s, 0, 'masonry');
  assert.ok(acts(s, 0, field).includes('wonder:begin:pyramids'));
  assert.ok(!acts(s, 1, field).some((a) => a.startsWith('wonder:')), 'not on someone else\'s land');
  field.resource = 'fruit';
  assert.ok(!acts(s, 0, field).includes('wonder:begin:pyramids'), 'the tile must be empty');
  field.resource = null;
  const cap = citiesOf(s, 0)[0];
  assert.ok(!acts(s, 0, s.tiles[cap.y * s.size + cap.x]).some((a) => a.startsWith('wonder:')), 'not on a city');
  // Machu Picchu wants a mountain, the Lighthouse a coast
  learn(s, 0, 'climbing', 'meditation', 'fishing', 'sailing');
  assert.ok(!acts(s, 0, field).includes('wonder:begin:machupicchu'));
  const peak = plot(s, 0, 'mountain', false, [field]);
  assert.ok(acts(s, 0, peak).includes('wonder:begin:machupicchu'));
  assert.ok(!acts(s, 0, peak).includes('wonder:begin:pyramids'));
  if (!neighbors(s, field.x, field.y).some((n) => n.terrain === 'shallow' || n.terrain === 'ocean')) assert.ok(!acts(s, 0, field).includes('wonder:begin:lighthouse'), 'inland: no Lighthouse');
  const shore = plot(s, 0, 'field', true, [field, peak]);
  assert.ok(acts(s, 0, shore).includes('wonder:begin:lighthouse'));
  // one great work at a time
  assert.ok(begin(s, 0, peak, 'machupicchu'));
  assert.equal(siteOf(s, 0)!.id, 'machupicchu');
  assert.ok(!acts(s, 0, shore).some((a) => a.startsWith('wonder:begin:')));
  // nothing else can be built on a wonder's tile
  learn(s, 0, 'mining');
  peak.resource = 'ore';
  assert.ok(!acts(s, 0, peak).includes('mine'));
  assert.ok(acts(s, 0, peak).some((a) => a.startsWith('wonder:invest:')) || investRoom(s, siteOf(s, 0)!) === 0);
});

test('investment: the first chunk on beginning, then up to the cap a turn, until the cost is reached', () => {
  const s = game();
  learn(s, 0, 'masonry');
  s.players[0].stars = 200;
  const t = plot(s, 0, 'desert');
  const cost = wonderCost(s, 0, 'pyramids');
  assert.equal(cost, Math.round(WONDER_BY_ID.pyramids.cost * (1 - HOME_DISCOUNT)), 'Egypt\'s own Pyramids are cheaper');
  assert.equal(wonderCost(s, 1, 'pyramids'), WONDER_BY_ID.pyramids.cost);
  const before = s.players[0].stars;
  assert.ok(begin(s, 0, t, 'pyramids'));
  assert.equal(s.players[0].stars, before - INVEST_CAP);
  const site = siteOf(s, 0)!;
  assert.equal(site.paid, INVEST_CAP);
  assert.equal(investRoom(s, site), 0, 'the cap is spent this turn');
  assert.ok(!tileActions(s, 0, t).some((a) => a.id.startsWith('wonder:invest:') && a.enabled));
  s.turn++;
  assert.equal(investRoom(s, site), INVEST_CAP);
  assert.ok(doAction(s, 0, t, `wonder:invest:${INVEST_CAP / 2}`));
  assert.ok(doAction(s, 0, t, `wonder:invest:${INVEST_CAP / 2}`), 'two halves fill the same turn');
  assert.equal(investRoom(s, site), 0);
  s.turn++;
  const left = cost - site.paid;
  assert.ok(left > 0 && left <= INVEST_CAP);
  drain();
  assert.ok(doAction(s, 0, t, `wonder:invest:${left}`));
  assert.equal(siteOf(s, 0), undefined);
  assert.equal(builtAt(s, t.x, t.y)!.id, 'pyramids');
  assert.ok(drain().some((e) => e.type === 'wonder' && e.id === 'pyramids' && e.player === 0), 'a celebration event');
  assert.ok(s.log.some((l) => l.text.includes('Great Pyramids')));
});

test('uniqueness and refunds: the first to finish takes it; rivals get half back; abandoning and losing the land refund too', () => {
  const s = game();
  meet(s, 0, 1);
  for (const pid of [0, 1, 2]) { learn(s, pid, 'tactics'); s.players[pid].stars = 200; }
  const a = plot(s, 0, 'field'), b = plot(s, 1, 'field'), c = plot(s, 2, 'field');
  assert.ok(begin(s, 0, a, 'colosseum'));
  assert.ok(begin(s, 1, b, 'colosseum'), 'rivals may race for the same wonder');
  assert.ok(begin(s, 2, c, 'colosseum'));
  const romeCost = wonderCost(s, 1, 'colosseum');
  assert.ok(romeCost < wonderCost(s, 0, 'colosseum'), 'Rome\'s own Colosseum is cheaper');
  const egyptBefore = s.players[0].stars, celtsBefore = s.players[2].stars;
  for (let paid = INVEST_CAP; paid < romeCost;) {
    s.turn++;
    const n = Math.min(INVEST_CAP, romeCost - paid);
    assert.ok(doAction(s, 1, b, `wonder:invest:${n}`));
    paid += n;
  }
  assert.equal(builtAt(s, b.x, b.y)!.id, 'colosseum');
  assert.equal(s.wonders!.sites.length, 0, 'every rival site closed');
  assert.equal(s.players[0].stars, egyptBefore + Math.floor(INVEST_CAP * REFUND_SHARE));
  assert.equal(s.players[2].stars, celtsBefore + Math.floor(INVEST_CAP * REFUND_SHARE));
  assert.ok(!acts(s, 0, a).some((x) => x.startsWith('wonder:')), 'it cannot be begun again anywhere');
  // abandoning gives half back
  learn(s, 0, 'masonry');
  assert.ok(begin(s, 0, a, 'pyramids'));
  const st = s.players[0].stars;
  assert.ok(doAction(s, 0, a, 'wonder:abandon'));
  assert.equal(s.players[0].stars, st + Math.floor(INVEST_CAP * REFUND_SHARE));
  // a site on land that changes hands is closed at its builder's next turn
  assert.ok(begin(s, 0, a, 'pyramids'));
  a.owner = citiesOf(s, 2)[0].id;
  const st2 = s.players[0].stars;
  wonderTurnStart(s, 0);
  assert.equal(siteOf(s, 0), undefined);
  assert.equal(s.players[0].stars, st2 + Math.floor(INVEST_CAP * REFUND_SHARE));
});

/** Finishes wonder `id` for `pid` on `t` (paying turn by turn). */
function finish(s: GameState, pid: number, t: Tile, id: string) {
  s.players[pid].stars += 500;
  assert.ok(begin(s, pid, t, id), `begin ${id}`);
  while (siteOf(s, pid)) {
    s.turn++;
    const room = investRoom(s, siteOf(s, pid)!);
    assert.ok(doAction(s, pid, t, `wonder:invest:${room}`));
  }
  assert.equal(builtAt(s, t.x, t.y)?.id, id);
}

test('bonuses: income, defence, attack, vision, gifts and score, held by whoever holds the land', () => {
  const s = game();
  learn(s, 0, 'climbing', 'meditation', 'tactics', 'engineering', 'spiritualism', 'farming', 'archery', 'hunting', 'gathering');
  const cap = citiesOf(s, 0)[0];
  const inc0 = cityIncome(s, cap), score0 = score(s, 0);
  const peak = plot(s, 0, 'mountain');
  finish(s, 0, peak, 'machupicchu');
  assert.equal(cityIncome(s, cap), inc0 + 1, 'Machu Picchu: +1★ from every city');
  assert.ok(score(s, 0) >= score0 + WONDER_SCORE);
  // the next one costs more
  assert.equal(wonderCost(s, 0, 'greatwall'), Math.round(WONDER_BY_ID.greatwall.cost * (1 + HELD_SURCHARGE)));
  const warrior = s.units.find((u) => u.owner === 0)!;
  const def0 = defenseBonus(s, warrior), atk0 = perkUnit(s, warrior, 'atk');
  finish(s, 0, plot(s, 0, 'field', false, [peak]), 'greatwall');
  assert.equal(defenseBonus(s, warrior), def0 + 0.5, 'Great Wall: units on your own land defend better');
  const col = plot(s, 0, 'field', false, s.tiles.filter((t) => builtAt(s, t.x, t.y)));
  finish(s, 0, col, 'colosseum');
  assert.equal(perkUnit(s, warrior, 'atk'), atk0 + 0.5, 'Colosseum: foot soldiers hit harder');
  const vis0 = perkSum(s, 0, 'vision');
  finish(s, 0, plot(s, 0, 'field', false, s.tiles.filter((t) => builtAt(s, t.x, t.y))), 'stonehenge');
  assert.equal(perkSum(s, 0, 'vision'), vis0 + 1, 'Stonehenge: see further');
  assert.deepEqual(wondersHeldBy(s, 0).sort(), ['colosseum', 'greatwall', 'machupicchu', 'stonehenge']);
  // the Hanging Gardens grow every city by 2 at once
  const pop0 = cap.pop + cap.level * 100;
  const g = plot(s, 0, 'field', false, s.tiles.filter((t) => builtAt(s, t.x, t.y)));
  finish(s, 0, g, 'gardens');
  assert.ok(cap.pop + cap.level * 100 > pop0);
  // wonders change hands with their land: take Egypt's capital and Rome holds them all
  const inc1 = income(s, 1);
  cap.owner = 1;
  assert.deepEqual(wondersHeldBy(s, 0), []);
  assert.equal(wondersHeldBy(s, 1).length, 5);
  assert.ok(income(s, 1) > inc1);
  assert.equal(tileOwnerPlayer(s, peak), 1);
});

test('the Great Library teaches a free tech', () => {
  const s = game();
  learn(s, 0, 'climbing', 'meditation', 'philosophy');
  const n = s.players[0].techs.length;
  finish(s, 0, plot(s, 0, 'field'), 'library');
  assert.equal(s.players[0].techs.length, n + 1);
});

test('older saves without wonders load and play; the state survives JSON', () => {
  const s = game();
  delete s.wonders;
  const old = JSON.parse(JSON.stringify(s)) as GameState;
  assert.equal(old.wonders, undefined);
  assert.equal(wondersHeldBy(old, 0).length, 0);
  assert.ok(score(old, 0) > 0);
  startTurn(old);
  for (let i = 0; i < 6; i++) endTurn(old);
  learn(old, old.current, 'masonry');
  old.players[old.current].stars = 50;
  const t = plot(old, old.current, 'field');
  assert.ok(begin(old, old.current, t, 'pyramids'));
  const back = JSON.parse(JSON.stringify(old)) as GameState;
  assert.deepEqual(back.wonders, old.wonders);
  assert.equal(siteOf(back, old.current)!.id, 'pyramids');
});

test('the art draws finished and rising wonders and their icons (canvas stubbed)', () => {
  const s = game();
  learn(s, 0, 'masonry');
  s.players[0].stars = 100;
  const t = plot(s, 0, 'field');
  let fills = 0;
  const ctx = new Proxy({}, {
    get: (_t, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => { if (k === 'fill' || k === 'stroke') fills++; }),
    set: () => true,
  }) as unknown as CanvasRenderingContext2D;
  assert.equal(drawWonderTile(ctx, s, t, 0, 0), false);
  begin(s, 0, t, 'pyramids');
  assert.ok(drawWonderTile(ctx, s, t, 0, 0), 'a rising site');
  for (const w of WONDERS) drawWonderIcon(ctx, w.id, 27, 26);
  doAction(s, 0, t, 'wonder:abandon');
  const h = plot(s, 0, 'field', false, [t]);
  finish(s, 0, h, 'hagia');
  assert.ok(drawWonderTile(ctx, s, h, 0, 0), 'a finished wonder');
  assert.ok(fills > 200);
});

test('computer players build wonders in a 30-turn all-AI game', () => {
  const s = createGame({ seed: 1, human: null, opponents: TRIBE_IDS.slice(0, 5), mode: 'perfection', maxTurns: 30 });
  let guard = 0;
  while (!s.over && guard++ < 4000) {
    for (let n = 0; aiStep(s) && n < 400; n++);
    endTurn(s);
  }
  drain();
  assert.ok(s.over);
  const built = s.wonders?.built ?? [];
  assert.ok(built.length >= 1, 'at least one wonder was finished');
  assert.equal(new Set(built.map((b) => b.id)).size, built.length, 'each wonder once');
  for (const b of built) assert.ok(s.tiles[b.y * s.size + b.x].owner !== null);
  // no site of a finished wonder is left open
  for (const site of s.wonders!.sites) assert.ok(!built.some((b) => b.id === site.id));
});

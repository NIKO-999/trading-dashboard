import assert from 'node:assert/strict';
import test from 'node:test';
import { aiStep } from '../src/game/ai';
import {
  AUX_KINDS, AUX_NAMES, auxAi, auxName, auxParts, braceOf, CONVERT_COOLDOWN, convertBar, convertLeft, HEAL_HP, isMounted, SCOUT_RUIN, SPEAR_BRACE,
} from '../src/game/auxiliaries';
import { drain, type GameEvent } from '../src/game/events';
import { createGame, foundCity, revealAround, spawnUnit } from '../src/game/mapgen';
import { doAction, moveOptions, moveUnit, previewCombat, tileActions, unitAt, type Action } from '../src/game/rules';
import { endTurn, startTurn } from '../src/game/turn';
import type { GameState, TribeId, Unit, UnitKind } from '../src/game/types';
import { spawnNeutral } from '../src/game/wild';
import { UNITS } from '../src/data/units';
import { TECH_BY_ID } from '../src/data/techs';
import { TRIBE_IDS } from '../src/data/tribes';
import { drawUnitSprite } from '../src/render/units';
import { drawAuxGround, drawAuxIcon } from '../src/render/auxiliaries';

/** A blank field map (every city, unit, resource and border cleared) with everyone rich and knowing the techs it needs. */
function sandbox(tribes: TribeId[], opts: Partial<Parameters<typeof createGame>[0]> = {}): GameState {
  const s = createGame({ seed: 5, human: tribes[0], opponents: tribes.slice(1), mode: 'perfection', ...opts });
  for (const t of s.tiles) Object.assign(t, { terrain: 'field', resource: null, improvement: null, road: false, village: false, ruin: false, cityId: null, owner: null, data: undefined });
  s.cities = [];
  s.units = [];
  for (const p of s.players) { p.explored.fill(true); p.stars = 100; p.techs.push('hunting', 'climbing', 'meditation', 'riding', 'chivalry', 'horsemanship', 'engineering', 'tactics', 'gathering'); }
  return s;
}
const tile = (s: GameState, x: number, y: number) => s.tiles[y * s.size + x];
const acts = (s: GameState, pid: number, x: number, y: number) => tileActions(s, pid, tile(s, x, y));
const converts = (s: GameState, pid: number, x: number, y: number): Action[] => acts(s, pid, x, y).filter((a) => a.id.startsWith('aux:convert:'));
function unit(s: GameState, pid: number, kind: UnitKind, x: number, y: number, home: number | null = null): Unit {
  const u = spawnUnit(s, kind, pid, x, y, home);
  u.moved = u.attacked = false;
  return u;
}

test('every empire trains a Spearman, a Scout and a Healer, in its own name, behind the right tech', () => {
  assert.deepEqual(AUX_KINDS, ['spearman', 'scout', 'healer']);
  for (const id of TRIBE_IDS) for (const k of AUX_KINDS) assert.ok(AUX_NAMES[id][k as 'scout'] && auxName(id, k) === AUX_NAMES[id][k as 'scout'], `${id} ${k}`);
  assert.equal(auxName('rome', 'spearman'), 'Triarius');
  // in line with the other foot units, and the two helpers never fight
  assert.deepEqual([UNITS.spearman.hp, UNITS.spearman.atk, UNITS.spearman.def, UNITS.spearman.move, UNITS.spearman.cost], [10, 1.5, 2, 1, 3]);
  assert.deepEqual([UNITS.scout.atk, UNITS.scout.move, UNITS.scout.vision, UNITS.scout.cost], [0, 3, 3, 2]);
  assert.ok(UNITS.scout.skills.includes('forestwalk'));
  assert.equal(UNITS.healer.atk, 0);
  assert.equal(UNITS.spearman.tech, 'hunting');
  assert.equal(UNITS.scout.tech, null);
  assert.equal(UNITS.healer.tech, 'meditation');
  // the tech cards name them
  assert.match(TECH_BY_ID.hunting.unlocks, /Spearmen/);
  assert.match(TECH_BY_ID.meditation.unlocks, /Healers/);
  const s = sandbox(['japan', 'zulu', 'pirates']);
  for (const [pid, x] of [[0, 1], [1, 5], [2, 9]] as const) {
    const c = foundCity(s, x, 1, pid, true);
    const trains = acts(s, pid, c.x, c.y).filter((a) => a.id.startsWith('train:'));
    for (const k of AUX_KINDS) {
      const a = trains.find((t) => t.id === `train:${k}`);
      assert.ok(a && a.enabled, `${s.players[pid].tribe} ${k}`);
      assert.equal(a.label, auxName(s.players[pid].tribe, k));
    }
  }
  assert.ok(doAction(s, 0, tile(s, 1, 1), 'train:healer'));
  assert.equal(unitAt(s, 1, 1)?.kind, 'healer');
  // waiting for the tech
  s.players[1].techs = s.players[1].techs.filter((t) => t !== 'hunting' && t !== 'meditation');
  const zulu = acts(s, 1, 5, 1);
  assert.equal(zulu.find((a) => a.id === 'train:spearman')!.needs, 'hunting');
  assert.equal(zulu.find((a) => a.id === 'train:healer')!.needs, 'meditation');
  assert.ok(zulu.find((a) => a.id === 'train:scout')!.enabled);
});

test('Spearman: double defence against mounted attackers, +50% against mounted defenders', () => {
  const s = sandbox(['greeks', 'mongols', 'rome']);
  const spear = unit(s, 0, 'spearman', 5, 5);
  const warrior = unit(s, 0, 'warrior', 5, 8); // the same 10 HP and defence 2, without the brace
  const knight = unit(s, 1, 'knight', 6, 5);
  const knight2 = unit(s, 1, 'knight', 6, 8);
  const sword = unit(s, 1, 'swordsman', 4, 5);
  const sword2 = unit(s, 1, 'swordsman', 4, 8);
  assert.equal(braceOf(s, knight, spear), SPEAR_BRACE);
  assert.equal(braceOf(s, sword, spear), 1);
  const braced = previewCombat(s, knight, spear), plain = previewCombat(s, knight2, warrior);
  assert.ok(braced.dmg < plain.dmg && braced.ret > plain.ret, `${JSON.stringify(braced)} vs ${JSON.stringify(plain)}`);
  assert.deepEqual(previewCombat(s, sword, spear), previewCombat(s, sword2, warrior), 'no brace against foot');
  // on the attack: round(1.5 / 2.5 × 1.5 × 4.5) = 4, ×1.5 = 6 against a knight (defence 1, +1 Horsemanship for the Mongols)
  s.players[1].techs = s.players[1].techs.filter((t) => t !== 'horsemanship');
  const hit = previewCombat(s, spear, knight);
  assert.equal(hit.dmg, 6);
  assert.equal(hit.tag, 'Spears!');
  assert.equal(previewCombat(s, spear, sword).tag, undefined);
  // who counts as mounted: the MOUNTED list and the riding heroes, never a unit in a boat
  for (const k of ['rider', 'knight', 'chariot', 'horsearcher', 'elephant', 'buffalorider', 'khampa', 'jaguar'] as UnitKind[]) assert.ok(isMounted(s, unit(s, 1, k, 0, 0)), k);
  for (const k of ['warrior', 'swordsman', 'archer', 'catapult', 'spearman'] as UnitKind[]) assert.ok(!isMounted(s, unit(s, 1, k, 0, 0)), k);
  assert.ok(isMounted(s, { ...knight, kind: 'hero' }), 'Genghis Khan rides');
  assert.ok(!isMounted(s, { ...knight, kind: 'hero', owner: 2 }), 'Caesar fights on foot');
  assert.ok(!isMounted(s, { ...knight, kind: 'boat', carrying: 'knight' }));
});

test('Scout: moves 3 through forest, sees 3, cannot capture, and finds 3★ more in a ruin', () => {
  const s = sandbox(['vikings', 'egypt']);
  for (const t of s.tiles) t.terrain = 'forest';
  const sc = unit(s, 0, 'scout', 5, 5);
  const rider = unit(s, 0, 'rider', 9, 9);
  assert.ok(moveOptions(s, sc).some((o) => Math.max(Math.abs(o.x - 5), Math.abs(o.y - 5)) === 3), 'three tiles through the woods');
  assert.ok(moveOptions(s, rider).every((o) => Math.max(Math.abs(o.x - 9), Math.abs(o.y - 9)) === 1), 'a rider stops in the first forest');
  s.players[0].explored.fill(false);
  revealAround(s, 0);
  assert.ok(s.players[0].explored[5 * s.size + 8] && s.players[0].explored[2 * s.size + 2], 'sees three tiles');
  // no capturing
  tile(s, 5, 5).village = true;
  assert.ok(!acts(s, 0, 5, 5).some((a) => a.id === 'capture'));
  const sp = unit(s, 0, 'spearman', 1, 9);
  tile(s, 1, 9).village = true;
  assert.ok(acts(s, 0, 1, 9).some((a) => a.id === 'capture'), 'a spearman captures');
  void sp;
  // a ruin
  tile(s, 7, 5).ruin = true;
  drain();
  const before = s.players[0].stars;
  assert.ok(moveUnit(s, sc, 7, 5));
  const evs = drain();
  assert.ok(evs.some((e) => e.type === 'stars' && e.amount === SCOUT_RUIN && e.x === 7), 'the scout bonus');
  assert.ok(s.players[0].stars >= before + SCOUT_RUIN);
  assert.equal(tile(s, 7, 5).ruin, false);
});

test('Healer: heals every unit of its empire beside it by 2 at the start of the turn', () => {
  const s = sandbox(['india', 'celts']);
  const h = unit(s, 0, 'healer', 5, 5);
  const a = unit(s, 0, 'warrior', 6, 5);
  const b = unit(s, 0, 'swordsman', 4, 4);
  const far = unit(s, 0, 'warrior', 8, 5);
  const foe = unit(s, 1, 'warrior', 5, 6);
  const full = unit(s, 0, 'defender', 5, 4);
  for (const u of [a, b, far, foe]) u.hp = 4;
  h.hp = 3;
  s.current = 0;
  drain();
  startTurn(s);
  assert.equal(a.hp, 4 + HEAL_HP);
  assert.equal(b.hp, 4 + HEAL_HP);
  assert.equal(far.hp, 4, 'too far');
  assert.equal(foe.hp, 4, 'not an enemy');
  assert.equal(full.hp, UNITS.defender.hp);
  assert.equal(h.hp, 3, 'not itself');
  const heals = drain().filter((e): e is Extract<GameEvent, { type: 'heal' }> => e.type === 'heal');
  assert.deepEqual(heals.map((e) => e.unitId).sort(), [a.id, b.id].sort());
  // the map shows the healer's ring and marks the wounded beside it
  let fills = 0;
  const ctx = new Proxy({}, { get: (_t, k) => () => { if (k === 'fill' || k === 'stroke') fills++; }, set: () => true }) as unknown as CanvasRenderingContext2D;
  a.hp = 5;
  drawAuxGround(ctx, s, 0);
  assert.ok(fills >= 4);
});

test('Healer: Convert turns a badly wounded enemy beside it, then rests 5 turns', () => {
  const s = sandbox(['aztec', 'persia']);
  const home = foundCity(s, 10, 10, 1, true);
  const h = unit(s, 0, 'healer', 5, 5);
  const e = unit(s, 1, 'swordsman', 6, 5, home.id);
  const e2 = unit(s, 1, 'warrior', 4, 5);
  assert.equal(home.units, 1);
  // too healthy: the button is there, greyed, saying why
  let c = converts(s, 0, 5, 5);
  assert.equal(c.length, 2);
  assert.ok(c.every((a) => !a.enabled && /half health/.test(a.reason!)));
  e.hp = 7; // 7 of 15: under half
  c = converts(s, 0, 5, 5);
  const act = c.find((a) => auxParts(a.id)!.target === 5 * s.size + 6)!;
  assert.ok(act.enabled, act.reason ?? '');
  // the same action shows on the enemy's own tile
  assert.ok(converts(s, 0, 6, 5).some((a) => a.id === act.id && a.enabled));
  assert.ok(doAction(s, 0, tile(s, 5, 5), act.id));
  assert.equal(e.owner, 0);
  assert.equal(e.homeCity, null);
  assert.equal(home.units, 0, 'its old city no longer supports it');
  assert.ok(e.moved && e.attacked && h.moved && h.attacked);
  assert.equal(convertLeft(s, h), CONVERT_COOLDOWN);
  assert.ok(s.log.some((l) => /converts/.test(l.text)));
  // cooling down
  e2.hp = 2;
  h.moved = h.attacked = false;
  c = converts(s, 0, 5, 5);
  assert.equal(c.length, 1);
  assert.equal(c[0].enabled, false);
  assert.equal(c[0].reason, `Ready in ${CONVERT_COOLDOWN} turns`);
  s.turn += CONVERT_COOLDOWN;
  assert.ok(converts(s, 0, 5, 5)[0].enabled);
  // alone: a single greyed button that still shows the cooldown
  s.units = s.units.filter((u) => u !== e2);
  h.data = { conv: s.turn + 2 };
  c = converts(s, 0, 5, 5);
  assert.ok(c.length === 1 && !c[0].enabled && c[0].reason === 'Ready in 2 turns');
  assert.equal(doAction(s, 0, tile(s, 5, 5), c[0].id), false);
});

test('Convert never takes heroes, Great Beasts, Rogue State units, siege, or a treaty partner’s units', () => {
  const s = sandbox(['maya', 'korea', 'ottoman'], { diplomacy: true });
  const h = unit(s, 0, 'healer', 5, 5);
  const hero = unit(s, 1, 'hero', 6, 5);
  s.players[1].hero = { unit: hero.id, lvl: 1, xp: 0, ready: 0, back: null, joined: true };
  const hwacha = unit(s, 1, 'hwacha', 4, 5);
  const cat = unit(s, 1, 'catapult', 4, 4);
  const beast = spawnNeutral(s, 'kraken', 6, 6);
  const rebel = spawnNeutral(s, 'warrior', 5, 6);
  rebel.data = { rogue: 1 };
  const ally = unit(s, 2, 'warrior', 5, 4);
  s.diplo!.pacts.push({ a: 0, b: 2, kind: 'peace', since: 0 });
  for (const u of [hero, hwacha, cat, beast, rebel, ally]) u.hp = 1;
  assert.match(convertBar(s, 0, hero)!, /hero/);
  assert.match(convertBar(s, 0, hwacha)!, /siege/);
  assert.match(convertBar(s, 0, cat)!, /siege/);
  assert.match(convertBar(s, 0, beast)!, /Great Beast/);
  assert.match(convertBar(s, 0, rebel)!, /Rogue State/);
  assert.match(convertBar(s, 0, ally)!, /treaty/);
  const c = converts(s, 0, 5, 5);
  assert.equal(c.length, 6);
  assert.ok(c.every((a) => !a.enabled));
  // at war again: the treaty partner's man may be won over
  s.diplo!.pacts = [];
  assert.equal(convertBar(s, 0, ally), null);
  assert.ok(doAction(s, 0, tile(s, 5, 5), converts(s, 0, 5, 5).find((a) => a.enabled)!.id));
  assert.equal(ally.owner, 0);
  void h;
});

test('art for every empire’s auxiliaries and the Convert icon draw without throwing', () => {
  let fills = 0;
  const ctx = new Proxy({}, {
    get: (_t, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => { if (k === 'fill' || k === 'stroke') fills++; }),
    set: () => true,
  }) as unknown as CanvasRenderingContext2D;
  for (const id of TRIBE_IDS) for (const k of AUX_KINDS) {
    const before = fills;
    drawUnitSprite(ctx, k, id, 0, 0);
    assert.ok(fills - before > 8, `${id} ${k}`);
  }
  assert.ok(drawAuxIcon(ctx, 'aux:convert', 'tibet', 0, 0));
  assert.equal(drawAuxIcon(ctx, 'aux:other', 'tibet', 0, 0), false);
});

test('the computer trains spearmen against cavalry and converts with its healers', () => {
  const s = sandbox(['mongols', 'rome']);
  const rc = foundCity(s, 4, 4, 1, true);
  rc.level = 3;
  for (const [x, y] of [[7, 4], [8, 5], [7, 7]]) unit(s, 0, 'knight', x, y);
  s.current = 1;
  assert.ok(auxAi(s, 1));
  assert.equal(unitAt(s, 4, 4)?.kind, 'spearman');
  // a healer beside a badly hurt knight wins it over
  const h = unit(s, 1, 'healer', 6, 4);
  const k = unitAt(s, 7, 4)!;
  k.hp = 3;
  for (let i = 0; i < 20 && auxAi(s, 1); i++);
  assert.equal(k.owner, 1);
  assert.equal(convertLeft(s, h), CONVERT_COOLDOWN);
});

test('old saves load: no auxiliary state anywhere, nothing breaks', () => {
  const s = createGame({ seed: 9, human: null, opponents: ['rome', 'mali', 'vikings'], mode: 'perfection' });
  const old = JSON.parse(JSON.stringify(s)) as GameState;
  for (const u of old.units) delete u.data;
  const h = spawnUnit(old, 'healer', 0, old.cities[0].x, old.cities[0].y, null);
  assert.equal(convertLeft(old, h), 0);
  startTurn(old);
  for (let t = 0; t < 4; t++) { for (let i = 0; i < 300 && aiStep(old); i++); endTurn(old); drain(); }
  JSON.parse(JSON.stringify(old));
});

test('a 30-turn all-AI game: scouts explore early, spearmen and healers join the armies', () => {
  const trained: Record<string, number> = {};
  let converted = 0;
  const lineups: [number, TribeId[], boolean][] = [[3, ['mongols', 'lakota', 'egypt', 'rome', 'greeks'], true], [8, ['tibet', 'india', 'japan', 'zulu', 'mali'], false]];
  for (const [seed, tribes, on] of lineups) {
    const s = createGame({ seed, human: null, opponents: tribes, mode: 'perfection', maxTurns: 30, diplomacy: on, wild: on, rebels: on });
    const seen = new Set<number>();
    for (let guard = 0; !s.over && guard < 4000; guard++) {
      for (let i = 0; i < 400 && aiStep(s); i++);
      for (const u of s.units) if (AUX_KINDS.includes(u.kind) && !seen.has(u.id)) { seen.add(u.id); trained[u.kind] = (trained[u.kind] ?? 0) + 1; }
      endTurn(s);
      drain();
    }
    assert.ok(s.over);
    converted += s.log.filter((l) => / converts an? /.test(l.text)).length;
    JSON.parse(JSON.stringify(s));
  }
  assert.ok((trained.scout ?? 0) >= 6, `trained: ${JSON.stringify(trained)}`);
  assert.ok((trained.spearman ?? 0) >= 1, `trained: ${JSON.stringify(trained)}`);
  assert.ok((trained.healer ?? 0) >= 1, `trained: ${JSON.stringify(trained)}`);
  console.log('auxiliaries in two AI games:', JSON.stringify(trained), 'converts:', converted);
});

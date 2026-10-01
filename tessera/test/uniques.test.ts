import assert from 'node:assert/strict';
import test from 'node:test';
import { aiStep } from '../src/game/ai';
import { drain } from '../src/game/events';
import { tileAt } from '../src/game/grid';
import { createGame, foundCity, spawnUnit } from '../src/game/mapgen';
import { doAction, attack, attackOptions, moveOptions, moveUnit, previewCombat, tileActions } from '../src/game/rules';
import { endTurn, startTurn } from '../src/game/turn';
import { UNITS } from '../src/data/units';
import { TRIBES, TRIBE_IDS } from '../src/data/tribes';
import { HOPLITE_COUNTER, IMMORTAL_HEAL, UNIQUE_ABILITY, uniqueEdge } from '../src/game/uniques';
import { unitVisibleTo } from '../src/game/mech';
import type { GameState, Terrain, TribeId, Unit, UnitKind } from '../src/game/types';

/** Player 0 plays `tribe`, player 1 (Rome, or Greece against Rome) is the enemy; open field around (8,8), no units. */
function arena(tribe: TribeId, foeTribe: TribeId = tribe === 'rome' ? 'greeks' : 'rome') {
  const s = createGame({ seed: 7, human: tribe, opponents: [foeTribe], mode: 'domination', mapSize: 'huge' });
  s.units = [];
  s.cities = s.cities.filter((c) => Math.abs(c.x - 8) > 5 || Math.abs(c.y - 8) > 5);
  for (const t of s.tiles) {
    if (Math.abs(t.x - 8) > 5 || Math.abs(t.y - 8) > 5) continue;
    Object.assign(t, { terrain: 'field', cityId: null, owner: null, village: false, ruin: false, improvement: null, resource: null, road: false, data: undefined });
  }
  for (const p of s.players) { p.explored = p.explored.map(() => true); p.techs.push('climbing'); }
  drain();
  return s;
}
const ready = (u: Unit) => { u.moved = false; u.attacked = false; return u; };
const put = (s: GameState, kind: UnitKind, owner: number, x: number, y: number) => ready(spawnUnit(s, kind, owner, x, y, null));
const ground = (s: GameState, x: number, y: number, terrain: Terrain) => { tileAt(s, x, y)!.terrain = terrain; };

test('every empire has a unique unit with a named ability, stated in its blurb', () => {
  for (const id of TRIBE_IDS) {
    const k = TRIBES[id].unique;
    const a = UNIQUE_ABILITY[k];
    assert.ok(a, `${k} has an ability`);
    assert.ok(UNITS[k].blurb.startsWith(`${a!.name}:`), `${k}'s blurb names ${a!.name}`);
  }
});

test('Legionary (testudo): +1 defence against ranged attacks only', () => {
  const s = arena('rome');
  const leg = put(s, 'legionary', 0, 8, 8);
  const far = put(s, 'catapult', 1, 8, 11);
  const near = put(s, 'catapult', 1, 9, 8);
  assert.equal(uniqueEdge(s, far, leg).def, 1);
  assert.equal(uniqueEdge(s, near, leg).def, 0);
  assert.ok(previewCombat(s, far, leg).dmg < previewCombat(s, near, leg).dmg);
});

test('Chariot (archer chariot): shoots from 2 tiles, takes no melee counter and drives on after shooting', () => {
  const s = arena('egypt');
  const ch = put(s, 'chariot', 0, 8, 8);
  const foe = put(s, 'warrior', 1, 8, 10);
  assert.ok(attackOptions(s, ch).includes(foe));
  assert.equal(previewCombat(s, ch, foe).ret, 0);
  assert.ok(moveUnit(s, ch, 7, 8), 'drives first...');
  assert.ok(attackOptions(s, ch).includes(foe), '...then shoots (dash)');
  assert.ok(attack(s, ch, foe));
  assert.equal(ch.moved, false, '...and drives on (escape)');
  assert.ok(moveOptions(s, ch).length > 0);
});

test('Jaguar Warrior (jungle pounce): a strike from forest takes no counter-blow', () => {
  const s = arena('aztec');
  const j = put(s, 'jaguar', 0, 8, 8);
  const foe = put(s, 'warrior', 1, 9, 8);
  assert.ok(previewCombat(s, j, foe).ret > 0);
  ground(s, 8, 8, 'forest');
  const p = previewCombat(s, j, foe);
  assert.equal(p.ret, 0);
  assert.equal(p.tag, 'Pounce!');
});

test('Buccaneer (plunder): wades shallows and loots +2 stars from a kill', () => {
  const s = arena('pirates');
  const b = put(s, 'buccaneer', 0, 8, 8);
  ground(s, 9, 8, 'shallow');
  assert.ok(moveOptions(s, b).some((o) => o.x === 9 && o.y === 8 && !o.embark), 'wades into the shallows');
  const foe = put(s, 'warrior', 1, 8, 10);
  foe.hp = 1;
  const stars = s.players[0].stars;
  assert.ok(attack(s, b, foe));
  assert.ok(!s.units.includes(foe));
  assert.ok(s.players[0].stars >= stars + 2);
});

test('Waka (ramming prow): +50% damage ramming an adjacent ship', () => {
  const s = arena('polynesia');
  for (const [x, y] of [[8, 8], [9, 8], [10, 8]]) ground(s, x, y, 'shallow');
  const w = put(s, 'waka', 0, 8, 8);
  const near = put(s, 'boat', 1, 9, 8);
  const p = previewCombat(s, w, near);
  assert.equal(p.tag, 'Ram!');
  w.kind = 'boat';
  const plain = previewCombat(s, w, near).dmg;
  w.kind = 'waka';
  assert.ok(p.dmg > plain, `${p.dmg} > ${plain}`);
});

test('Berserker (battle fury): its wounds never weaken its blow', () => {
  const s = arena('vikings');
  const b = put(s, 'berserker', 0, 8, 8);
  const foe = put(s, 'warrior', 1, 9, 8);
  const full = previewCombat(s, b, foe).dmg;
  b.hp = 4;
  assert.equal(previewCombat(s, b, foe).dmg, full);
  b.kind = 'swordsman';
  assert.ok(previewCombat(s, b, foe).dmg < full, 'a wounded swordsman hits softer');
});

test('Samurai (bushido): strikes again after a kill', () => {
  const s = arena('japan');
  const sm = put(s, 'samurai', 0, 8, 8);
  const a = put(s, 'warrior', 1, 9, 8); a.hp = 1;
  put(s, 'warrior', 1, 10, 9).hp = 1;
  assert.ok(attack(s, sm, a));
  assert.equal(sm.attacked, false);
  assert.ok(attackOptions(s, sm).length > 0);
});

test('Horse Archer (mounted archer): shoots from 2 tiles and rides on', () => {
  const s = arena('mongols');
  const h = put(s, 'horsearcher', 0, 8, 8);
  const foe = put(s, 'warrior', 1, 8, 10);
  assert.ok(attack(s, h, foe));
  assert.equal(h.moved, false);
  assert.ok(moveOptions(s, h).length > 0);
});

test('Hoplite (phalanx): hits back 50% harder than a defender', () => {
  const s = arena('greeks', 'rome');
  const h = put(s, 'hoplite', 0, 8, 8);
  const foe = put(s, 'warrior', 1, 9, 8);
  const ret = previewCombat(s, foe, h).ret;
  h.kind = 'defender';
  const plain = withStats('defender', 'hoplite', () => previewCombat(s, foe, h).ret);
  assert.ok(plain > 0);
  assert.equal(ret, Math.round(plain * HOPLITE_COUNTER));
});

test('Impi (bull horns): may still run one tile after attacking, not further', () => {
  const s = arena('zulu');
  const i = put(s, 'impi', 0, 8, 8);
  const foe = put(s, 'defender', 1, 9, 8);
  assert.ok(attack(s, i, foe));
  assert.ok(s.units.includes(i));
  const opts = moveOptions(s, i);
  assert.ok(opts.length > 0, 'can run on');
  assert.ok(opts.every((o) => Math.max(Math.abs(o.x - i.x), Math.abs(o.y - i.y)) <= 1));
  assert.ok(moveUnit(s, i, opts[0].x, opts[0].y));
  assert.equal(moveOptions(s, i).length, 0);
});

test('Immortal (undying): heals 3 HP at the start of its turn, anywhere', () => {
  const s = arena('persia');
  const im = put(s, 'immortal', 0, 8, 8);
  im.hp = 5;
  s.current = 0;
  s.turn = 1;
  startTurn(s);
  assert.equal(im.hp, 5 + IMMORTAL_HEAL);
  assert.ok(!UNITS.immortal.skills.includes('persist'));
});

test('Clansman (oak-grove warband): attacks +1 from forest', () => {
  const s = arena('celts');
  const c = put(s, 'clansman', 0, 8, 8);
  const foe = put(s, 'warrior', 1, 9, 8);
  const open = previewCombat(s, c, foe).dmg;
  ground(s, 8, 8, 'forest');
  assert.ok(previewCombat(s, c, foe).dmg > open);
});

/** Runs `f` with base unit `k` given the stats of unique `like`, so a test sees only the unique's ability. */
function withStats<T>(k: UnitKind, like: UnitKind, f: () => T): T {
  const d = UNITS[k], o = { atk: d.atk, def: d.def, hp: d.hp };
  Object.assign(d, { atk: UNITS[like].atk, def: UNITS[like].def, hp: UNITS[like].hp });
  try { return f(); } finally { Object.assign(d, o); }
}

test('Harpooner (harpoon): double damage to boats and Great Beasts', () => {
  const s = arena('inuit');
  ground(s, 8, 10, 'shallow');
  const h = put(s, 'harpooner', 0, 8, 8);
  const boat = put(s, 'boat', 1, 8, 10);
  const p = previewCombat(s, h, boat);
  h.kind = 'archer';
  const plain = withStats('archer', 'harpooner', () => previewCombat(s, h, boat).dmg);
  assert.equal(p.dmg, plain * 2);
  assert.equal(p.tag, 'Harpoon!');
});

test('Slinger (plunging stones): +1 attack from a mountain', () => {
  const s = arena('inca');
  const sl = put(s, 'slinger', 0, 8, 8);
  const foe = put(s, 'warrior', 1, 8, 10);
  const low = previewCombat(s, sl, foe).dmg;
  ground(s, 8, 8, 'mountain');
  assert.ok(previewCombat(s, sl, foe).dmg > low);
});

test('Shotelai (hooked blade): ignores the defender\'s fortify and terrain bonus', () => {
  const s = arena('ethiopia');
  const sh = put(s, 'shotelai', 0, 8, 8);
  const foe = put(s, 'warrior', 1, 9, 8);
  ground(s, 9, 8, 'mountain');
  const cut = previewCombat(s, sh, foe).dmg;
  sh.kind = 'swordsman'; // given the same stats, no hooked blade
  const plain = withStats('swordsman', 'shotelai', () => previewCombat(s, sh, foe).dmg);
  assert.ok(cut > plain, `${cut} > ${plain}`);
  ground(s, 9, 8, 'field');
  const flat = withStats('swordsman', 'shotelai', () => previewCombat(s, sh, foe).dmg);
  sh.kind = 'shotelai';
  assert.equal(previewCombat(s, sh, foe).dmg, flat, 'no edge on open ground');
});

test('Woomera Hunter (spear-thrower): throws 3 tiles', () => {
  const s = arena('aboriginal');
  const w = put(s, 'woomera', 0, 8, 8);
  const foe = put(s, 'warrior', 1, 8, 11);
  assert.ok(attackOptions(s, w).includes(foe));
  assert.equal(previewCombat(s, w, foe).ret, 0);
});

test('Crossbowman (siege bolts): +1 attack against units in a city or fort', () => {
  const s = arena('china');
  const cb = put(s, 'crossbowman', 0, 8, 8);
  const foe = put(s, 'warrior', 1, 8, 10);
  const open = previewCombat(s, cb, foe).dmg;
  tileAt(s, 8, 10)!.improvement = 'fort';
  assert.equal(uniqueEdge(s, cb, foe).atk, 1);
  assert.ok(previewCombat(s, cb, foe).dmg > open);
});

test('War Elephant (trample): the enemy behind the target takes half the damage', () => {
  const s = arena('india');
  const e = put(s, 'elephant', 0, 7, 8);
  const foe = put(s, 'defender', 1, 8, 8);
  const behind = put(s, 'warrior', 1, 9, 8);
  const side = put(s, 'warrior', 1, 8, 9);
  const { dmg } = previewCombat(s, e, foe);
  assert.ok(attack(s, e, foe));
  assert.equal(behind.hp, UNITS.warrior.hp - Math.round(dmg / 2));
  assert.equal(side.hp, UNITS.warrior.hp, 'only the one behind');
});

test('Sofa (Mansa\'s guard): +2 defence in its own cities', () => {
  const s = arena('mali');
  const c = foundCity(s, 8, 8, 0, false);
  const sofa = put(s, 'sofa', 0, 8, 8);
  const foe = put(s, 'warrior', 1, 9, 8);
  const inCity = previewCombat(s, foe, sofa).dmg;
  sofa.kind = 'warrior';
  sofa.hp = 10;
  const w = previewCombat(s, foe, sofa).dmg;
  assert.ok(c && inCity < w);
});

test('Horse Warrior (plains charge): +1 attack from open ground', () => {
  const s = arena('lakota');
  const r = put(s, 'buffalorider', 0, 8, 8);
  const foe = put(s, 'warrior', 1, 9, 8);
  const plain = previewCombat(s, r, foe).dmg;
  ground(s, 8, 8, 'forest');
  assert.ok(previewCombat(s, r, foe).dmg < plain);
});

test('Janissary (musket volley): +1 attack against melee units', () => {
  const s = arena('ottoman');
  const j = put(s, 'janissary', 0, 8, 8);
  const melee = put(s, 'warrior', 1, 8, 10);
  const archer = put(s, 'archer', 1, 10, 8);
  assert.equal(uniqueEdge(s, j, melee).atk, 1);
  assert.equal(uniqueEdge(s, j, archer).atk, 0);
});

test('Holcan (jungle ambush): hidden in forest from enemies not right beside it', () => {
  const s = arena('maya');
  const h = put(s, 'holcan', 0, 8, 8);
  const archer = put(s, 'archer', 1, 8, 10);
  assert.ok(attackOptions(s, archer).includes(h));
  ground(s, 8, 8, 'forest');
  assert.equal(unitVisibleTo(s, 1, h), false);
  assert.ok(!attackOptions(s, archer).includes(h));
  put(s, 'warrior', 1, 9, 9);
  assert.equal(unitVisibleTo(s, 1, h), true, 'seen from right beside it');
});

test('Hwacha (rocket volley): enemies next to the target take half the damage, in a shot and in a salvo', () => {
  const s = arena('korea');
  const hw = put(s, 'hwacha', 0, 8, 8);
  const foe = put(s, 'defender', 1, 8, 11);
  const nb = put(s, 'warrior', 1, 9, 11);
  const own = put(s, 'warrior', 0, 7, 11);
  const { dmg } = previewCombat(s, hw, foe);
  assert.ok(attack(s, hw, foe));
  assert.equal(nb.hp, UNITS.warrior.hp - Math.round(dmg / 2));
  assert.equal(own.hp, UNITS.warrior.hp, 'never its own side');
  // the Korean salvo (fired through the tile menu) spreads the same way
  const s2 = arena('korea');
  const h2 = put(s2, 'hwacha', 0, 8, 8);
  const f2 = put(s2, 'defender', 1, 8, 11);
  const n2 = put(s2, 'warrior', 1, 9, 11);
  const d2 = previewCombat(s2, h2, f2).dmg;
  assert.ok(tileActions(s2, 0, tileAt(s2, 8, 11)!).some((a) => a.id === 'mech:salvo' && a.enabled));
  assert.ok(doAction(s2, 0, tileAt(s2, 8, 11)!, 'mech:salvo'));
  assert.equal(n2.hp, UNITS.warrior.hp - Math.round(d2 / 2));
});

test('Temple Guardian (temple ward): takes a third of an adjacent friend\'s damage', () => {
  const s = arena('khmer');
  const w = put(s, 'warrior', 0, 8, 8);
  const foe = put(s, 'swordsman', 1, 9, 8);
  const alone = previewCombat(s, foe, w).dmg;
  const g = put(s, 'guardian', 0, 7, 8);
  const warded = previewCombat(s, foe, w).dmg;
  assert.ok(warded < alone);
  const share = alone - warded;
  assert.ok(attack(s, foe, w));
  assert.equal(w.hp, UNITS.warrior.hp - warded);
  assert.equal(g.hp, UNITS.guardian.hp - share);
  // the same when the guardian's empire comes later in the turn order than the attacker's
  const s2 = arena('rome', 'khmer');
  const w2 = put(s2, 'warrior', 1, 8, 8);
  const g2 = put(s2, 'guardian', 1, 7, 8);
  const f2 = put(s2, 'swordsman', 0, 9, 8);
  const d2 = previewCombat(s2, f2, w2).dmg;
  assert.ok(attack(s2, f2, w2));
  assert.equal(w2.hp, UNITS.warrior.hp - d2);
  assert.ok(g2.hp < UNITS.guardian.hp, 'the guardian paid its share');
});

test('Askari (coast guard): +1 defence on land beside water', () => {
  const s = arena('swahili');
  const a = put(s, 'askari', 0, 8, 8);
  const foe = put(s, 'warrior', 1, 9, 8);
  const inland = previewCombat(s, foe, a).dmg;
  ground(s, 7, 7, 'shallow');
  assert.ok(previewCombat(s, foe, a).dmg < inland);
});

test('Khampa Rider (highlander): mountains never stop its move', () => {
  const s = arena('tibet');
  for (const y of [7, 8, 9, 10, 11]) ground(s, 9, y, 'mountain');
  const k = put(s, 'khampa', 0, 8, 8);
  assert.ok(moveOptions(s, k).some((o) => o.x === 10), 'rides over the peaks');
  k.kind = 'rider';
  assert.ok(!moveOptions(s, k).some((o) => o.x === 10), 'a rider stops on the peak');
});

test('a 30-turn all-AI game with every unique unit plays through and uses them', () => {
  const tribes = ['egypt', 'mongols', 'zulu', 'korea', 'india', 'khmer'] as TribeId[];
  const s = createGame({ seed: 11, human: null, opponents: tribes, mode: 'perfection', maxTurns: 30 } as never);
  let guard = 0;
  let uniques = 0;
  while (!s.over && guard++ < 1000) {
    let n = 0;
    while (aiStep(s) && n++ < 400);
    uniques = Math.max(uniques, s.units.filter((u) => tribes.some((t) => TRIBES[t].unique === u.kind)).length);
    endTurn(s);
    drain();
  }
  assert.ok(s.over);
  assert.ok(uniques > 0, 'the AI trains its unique units');
  JSON.parse(JSON.stringify(s)); // state stays JSON-safe
});

test('startTurn leaves the impi charge flag behind', () => {
  const s = arena('zulu');
  const i = put(s, 'impi', 0, 8, 8);
  i.data = { horns: 0 };
  s.current = 0;
  startTurn(s);
  assert.equal(i.data?.horns, undefined);
});

test('every unique beats the unit it replaces in at least one stat', () => {
  for (const t of TRIBE_IDS) {
    const u = UNITS[TRIBES[t].unique], b = UNITS[TRIBES[t].replaces];
    const better = u.atk > b.atk || u.def > b.def || u.hp > b.hp || u.move > b.move || u.range > b.range;
    assert.ok(better, `${t}: ${u.name} has no stat edge over ${b.name}`);
  }
});

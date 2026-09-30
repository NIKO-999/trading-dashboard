import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../src/game/ai';
import { drain } from '../src/game/events';
import { tileAt } from '../src/game/grid';
import {
  abilityBlock, cooldownLeft, gainXp, HERO_JOIN_LEVEL, HERO_MAX_LEVEL, HERO_MECH, HERO_RESPAWN, HERO_XP, HEROES, heroState, heroUnit, isHero, useAbility,
} from '../src/game/heroes';
import { createGame, spawnUnit } from '../src/game/mapgen';
import { hookStat, unitVisibleTo } from '../src/game/mech';
import { attack, citiesOf, doAction, maxHp, moveOptions, moveUnit, previewCombat, removeUnit, tileActions } from '../src/game/rules';
import { endTurn, startTurn } from '../src/game/turn';
import { TRIBE_IDS } from '../src/data/tribes';
import { drawHeroGround } from '../src/render/heroes';
import { drawUnitSprite } from '../src/render/units';
import type { GameState, TribeId, Unit, UnitKind } from '../src/game/types';

/** Empire 0 (`tribe`) against empire 1, no units, open field around the capital, the whole map explored. */
function arena(tribe: TribeId, foe: TribeId = tribe === 'japan' ? 'rome' : 'japan') {
  const s = createGame({ seed: 4, human: tribe, opponents: [foe], mode: 'domination' });
  s.units = [];
  for (const c of s.cities) c.units = 0;
  const cap = citiesOf(s, 0).find((c) => c.capital)!;
  for (const t of s.tiles) {
    if (Math.max(Math.abs(t.x - cap.x), Math.abs(t.y - cap.y)) > 3 || t.cityId === cap.id) continue;
    Object.assign(t, { terrain: 'field', cityId: null, village: false, ruin: false, improvement: null, resource: null, data: undefined });
  }
  for (const p of s.players) p.explored = p.explored.map(() => true);
  return { s, cap };
}
const ready = (u: Unit) => { u.moved = false; u.attacked = false; return u; };
const put = (s: GameState, kind: UnitKind, owner: number, x: number, y: number) => ready(spawnUnit(s, kind, owner, x, y, null));

/** An arena whose hero has joined and stands two tiles from the capital, on the side (`dx`) with room to spare. */
function withHero(tribe: TribeId, foe?: TribeId) {
  const a = arena(tribe, foe);
  a.cap.level = HERO_JOIN_LEVEL;
  HERO_MECH.turnStart!(a.s, 0);
  const hero = heroUnit(a.s, 0)!;
  const dx = a.cap.x + 4 < a.s.size ? 1 : -1;
  hero.x = a.cap.x + 2 * dx;
  hero.y = a.cap.y;
  return { ...a, hero, dx };
}

test('the hero joins when the capital reaches level 3, and only once', () => {
  const { s, cap } = arena('zulu');
  cap.level = 2;
  HERO_MECH.turnStart!(s, 0);
  assert.equal(heroUnit(s, 0), undefined, 'not before level 3');
  drain();
  cap.level = 3;
  HERO_MECH.turnStart!(s, 0);
  const hero = heroUnit(s, 0)!;
  assert.ok(hero && isHero(s, hero) && hero.kind === 'hero');
  assert.ok(Math.max(Math.abs(hero.x - cap.x), Math.abs(hero.y - cap.y)) <= 2, 'at the capital');
  assert.ok(!hero.moved && !hero.attacked, 'ready to act on arrival');
  assert.equal(hero.homeCity, null, 'does not use a city slot');
  assert.ok(drain().some((e) => e.type === 'toast' && e.player === 0 && /Shaka/.test(e.text)), 'a toast announces the arrival');
  HERO_MECH.turnStart!(s, 0);
  HERO_MECH.turnStart!(s, 0);
  assert.equal(s.units.filter((u) => u.owner === 0 && u.kind === 'hero').length, 1, 'one hero per empire');
  JSON.parse(JSON.stringify(s));
});

test('heroes level up with XP to level 5, gaining health and attack', () => {
  const { s, hero } = withHero('celts');
  const hp0 = maxHp(hero), atk0 = hookStat(s, hero, 'atk');
  gainXp(s, 0, HERO_XP[2]);
  assert.equal(heroState(s, 0).lvl, 2);
  assert.equal(maxHp(hero), hp0 + 3);
  assert.equal(hookStat(s, hero, 'atk'), atk0 + 0.5);
  gainXp(s, 0, 999);
  assert.equal(heroState(s, 0).lvl, HERO_MAX_LEVEL);
  assert.equal(maxHp(hero), hp0 + 3 * (HERO_MAX_LEVEL - 1));
  assert.ok(drain().some((e) => e.type === 'toast' && /level 5/.test(e.text)));
});

test('fighting and killing earn XP; heroes never turn veteran', () => {
  const { s, hero, dx } = withHero('rome');
  const foe = put(s, 'warrior', 1, hero.x + dx, hero.y);
  foe.hp = 2;
  ready(hero);
  assert.ok(attack(s, hero, foe));
  assert.ok(!s.units.includes(foe));
  assert.equal(heroState(s, 0).xp, 3, '1 for the fight + 2 for the kill');
  hero.veteranKills = 5;
  const foe2 = put(s, 'warrior', 1, hero.x + dx, hero.y + 1);
  foe2.hp = 1;
  ready(hero);
  attack(s, hero, foe2);
  assert.equal(hero.veteran, false);
});

test('the ability is a tile action with a cooldown', () => {
  const { s, hero } = withHero('greeks');
  const t = tileAt(s, hero.x, hero.y)!;
  const act = tileActions(s, 0, t).find((a) => a.id === 'hero:ability')!;
  assert.ok(act && act.enabled && act.label === 'Hold the Pass');
  assert.ok(doAction(s, 0, t, 'hero:ability'));
  assert.equal(cooldownLeft(s, 0), HEROES.greeks.cd);
  const again = tileActions(s, 0, t).find((a) => a.id === 'hero:ability')!;
  assert.equal(again.enabled, false);
  assert.match(again.reason!, /Ready in 3 turns/);
  assert.equal(doAction(s, 0, t, 'hero:ability'), false);
  s.turn += HEROES.greeks.cd;
  assert.equal(abilityBlock(s, 0), null, 'ready again after the cooldown');
});

test('Leonidas: Hold the Pass gives the hero and his neighbours +3 defence until his next turn', () => {
  const { s, hero } = withHero('greeks');
  const ally = put(s, 'warrior', 0, hero.x, hero.y + 1);
  const far = put(s, 'warrior', 0, hero.x, hero.y + 3);
  const d0 = hookStat(s, ally, 'def'), f0 = hookStat(s, far, 'def');
  assert.equal(d0, 0.5, 'the passive aura steadies a unit beside the hero');
  assert.equal(f0, 0, 'but not one further away');
  assert.ok(useAbility(s, 0));
  assert.equal(hookStat(s, ally, 'def'), d0 + 3);
  assert.equal(hookStat(s, hero, 'def'), 3);
  assert.equal(hookStat(s, far, 'def'), 0);
  HERO_MECH.turnStart!(s, 0);
  assert.equal(hookStat(s, ally, 'def'), d0, 'fades at the start of the next turn');
});

test('Shaka: Horns of the Buffalo traps adjacent enemies, who cannot move or strike back', () => {
  const { s, hero, dx } = withHero('zulu');
  const foe = put(s, 'warrior', 1, hero.x + dx, hero.y);
  assert.ok(moveOptions(s, foe).length > 0);
  assert.ok(previewCombat(s, hero, foe).ret > 0 || previewCombat(s, hero, foe).kills);
  assert.ok(useAbility(s, 0));
  assert.equal(moveOptions(s, foe).length, 0, 'trapped');
  assert.equal(previewCombat(s, hero, foe).ret, 0, 'no counter-blow');
  HERO_MECH.turnEnd!(s, 1);
  assert.ok(moveOptions(s, foe).length > 0, 'free after its own turn');
});

test('Genghis Khan: Ride of the Horde gives every mounted unit +1 move', () => {
  const { s, hero, dx } = withHero('mongols');
  const rider = put(s, 'horsearcher', 0, hero.x - dx, hero.y + 2);
  const foot = put(s, 'warrior', 0, hero.x - dx, hero.y - 2);
  assert.ok(useAbility(s, 0));
  assert.equal(hookStat(s, rider, 'move'), 1);
  assert.equal(hookStat(s, foot, 'move'), 0);
  assert.equal(hookStat(s, hero, 'move'), 1);
});

test('Mansa Musa: Gift of Gold pays 15 stars and grows the capital', () => {
  const { s, cap } = withHero('mali');
  const stars = s.players[0].stars, pop = cap.pop + cap.level * 100;
  assert.ok(useAbility(s, 0));
  assert.equal(s.players[0].stars, stars + 15);
  assert.ok(cap.pop + cap.level * 100 > pop);
});

test('Suleiman: Imperial Largesse halves the next build, then is spent', () => {
  const { s, cap } = withHero('ottoman');
  s.players[0].stock = { iron: 12, horses: 12 }; // Iron-age units need Iron (see game/goods)
  s.players[0].stars = 20;
  s.players[0].techs.push('smithing');
  const t = tileAt(s, cap.x, cap.y)!;
  const full = tileActions(s, 0, t).find((a) => a.id === 'train:swordsman')!.cost;
  assert.ok(useAbility(s, 0));
  const half = tileActions(s, 0, t).find((a) => a.id === 'train:swordsman')!;
  assert.equal(half.cost, Math.ceil(full / 2));
  assert.ok(doAction(s, 0, t, 'train:swordsman'));
  assert.equal(s.players[0].stars, 20 - Math.ceil(full / 2));
  assert.equal(heroState(s, 0).discount, false);
});

test('Admiral Yi: the turtle ship sails the water with high defence until he lands', () => {
  const { s, hero, dx } = withHero('korea');
  const w = tileAt(s, hero.x + dx, hero.y)!;
  w.terrain = 'shallow';
  const w2 = tileAt(s, hero.x + 2 * dx, hero.y)!;
  w2.terrain = 'ocean';
  assert.ok(!moveOptions(s, hero).some((o) => o.x === w2.x && o.y === w2.y), 'no sailing before');
  assert.ok(useAbility(s, 0));
  assert.ok(moveOptions(s, hero).some((o) => o.x === w2.x && o.y === w2.y), 'sails over the water');
  assert.ok(moveUnit(s, hero, w2.x, w2.y));
  assert.equal(hookStat(s, hero, 'def'), 3);
  s.turn += 10;
  HERO_MECH.turnStart!(s, 0);
  assert.equal(typeof hero.data?.turtle, 'number', 'the ship stays while he is at sea');
  hero.x -= 3 * dx; // ashore
  HERO_MECH.turnStart!(s, 0);
  assert.equal(hero.data?.turtle, undefined);
});

test('Boudica heals and rallies; Cuauhtémoc strikes; the mist hides the Tibetans', () => {
  {
    const { s, hero } = withHero('celts');
    const ally = put(s, 'warrior', 0, hero.x, hero.y + 2);
    ally.hp = 4;
    assert.ok(useAbility(s, 0));
    assert.equal(ally.hp, 8);
    assert.equal(hookStat(s, ally, 'atk'), 1);
  }
  {
    const { s, hero, dx } = withHero('aztec');
    const foe = put(s, 'warrior', 1, hero.x + dx, hero.y);
    foe.hp = 3;
    const other = put(s, 'warrior', 1, hero.x - dx, hero.y);
    assert.ok(useAbility(s, 0));
    assert.ok(!s.units.includes(foe), 'the strike kills');
    assert.equal(other.hp, 6);
    assert.equal(heroState(s, 0).xp, 2, 'a kill by the ability is XP');
  }
  {
    const { s, hero } = withHero('tibet');
    const ally = put(s, 'warrior', 0, hero.x, hero.y + 1);
    assert.ok(unitVisibleTo(s, 1, ally));
    assert.ok(useAbility(s, 0));
    assert.equal(unitVisibleTo(s, 1, ally), false);
    assert.equal(unitVisibleTo(s, 0, ally), true);
  }
});

test('every one of the 26 heroes can use its ability, and the game stays JSON-safe', () => {
  for (const tribe of TRIBE_IDS) {
    const { s, hero, dx } = withHero(tribe);
    put(s, 'warrior', 1, hero.x + dx, hero.y);
    if (tribe === 'rome') hero.attacked = true;
    const stars = s.players[0].stars;
    assert.ok(useAbility(s, 0), `${tribe} ability`);
    assert.equal(cooldownLeft(s, 0), HEROES[tribe].cd, `${tribe} cooldown`);
    assert.ok(s.players[0].stars >= stars);
    if (tribe === 'rome') assert.equal(hero.attacked, false, 'Veni, vidi, vici: may strike again');
    const copy = JSON.parse(JSON.stringify(s)) as GameState;
    assert.equal(copy.players[0].hero!.unit, hero.id);
  }
});

test('a fallen hero returns to the capital after the respawn delay, keeping its level', () => {
  const { s, hero, dx } = withHero('vikings');
  gainXp(s, 0, HERO_XP[3]);
  const foe = put(s, 'warrior', 1, hero.x + dx, hero.y);
  drain();
  removeUnit(s, hero, foe);
  const h = heroState(s, 0);
  assert.equal(h.unit, null);
  assert.equal(h.back, s.turn + HERO_RESPAWN);
  const ev = drain();
  assert.ok(ev.some((e) => e.type === 'toast' && e.player === 0 && /has fallen/.test(e.text)));
  assert.ok(ev.some((e) => e.type === 'toast' && e.player === 1 && /struck down/.test(e.text)));
  s.turn += HERO_RESPAWN - 1;
  HERO_MECH.turnStart!(s, 0);
  assert.equal(heroUnit(s, 0), undefined, 'not yet');
  s.turn += 1;
  HERO_MECH.turnStart!(s, 0);
  const back = heroUnit(s, 0)!;
  assert.ok(back && back.id !== hero.id);
  assert.equal(h.lvl, 3);
  assert.equal(maxHp(back), 20 + 3 * 2);
  assert.equal(back.hp, maxHp(back));
});

test('a hero taken alive slips away and returns; older saves load without hero state', () => {
  const { s, hero } = withHero('india');
  s.units = s.units.filter((u) => u !== hero); // e.g. taken captive, with no death recorded
  HERO_MECH.turnStart!(s, 0);
  assert.equal(heroState(s, 0).back, s.turn + HERO_RESPAWN);
  const old = createGame({ seed: 3, human: 'egypt', opponents: ['aztec'], mode: 'perfection' });
  for (const p of old.players) delete p.hero;
  const loaded = JSON.parse(JSON.stringify(old)) as GameState;
  startTurn(loaded);
  endTurn(loaded);
  assert.ok(loaded.players.every((p) => p.hero === undefined || p.hero.unit === null));
});

test('30-turn all-AI game: heroes join, level up and use their abilities', () => {
  const five: TribeId[] = ['greeks', 'zulu', 'mongols', 'celts', 'mali'];
  // (seed 12: with role units in play, seed 11 became a game the Zulu won outright by turn 10, before most capitals grew)
  const s = createGame({ seed: 12, human: null, opponents: five, mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && guard++ < 1000) {
    aiTurn(s);
    for (const p of s.players) assert.ok(s.units.filter((u) => u.owner === p.id && (u.carrying ?? u.kind) === 'hero').length <= 1, 'one hero at a time');
    endTurn(s);
    drain();
  }
  assert.ok(s.over);
  const heroes = s.players.map((p) => p.hero).filter((h) => h?.joined);
  assert.ok(heroes.length >= 3, `heroes joined: ${heroes.length}`);
  assert.ok(heroes.reduce((n, h) => n + (h!.uses ?? 0), 0) >= 5, 'abilities used');
  assert.ok(heroes.some((h) => h!.lvl > 1), 'a hero levelled up');
  JSON.parse(JSON.stringify(s));
});

// The canvas is stubbed: this proves the hero art and the map marks run for every empire without throwing.
test('hero art for all 26 empires and the aura and marks overlay draw without throwing', () => {
  let fills = 0;
  const ctx = new Proxy({}, {
    get: (_t, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => { if (k === 'fill' || k === 'stroke') fills++; }),
    set: () => true,
  }) as unknown as CanvasRenderingContext2D;
  for (const tribe of TRIBE_IDS) drawUnitSprite(ctx, 'hero', tribe, 0, 0);
  const { s, hero, dx } = withHero('zulu');
  put(s, 'warrior', 1, hero.x + dx, hero.y);
  put(s, 'warrior', 0, hero.x, hero.y + 1);
  useAbility(s, 0);
  const before = fills;
  drawHeroGround(ctx, s, 0, 1000);
  assert.ok(fills > before + 8, 'aura and marks drawn');
});

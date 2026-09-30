import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../src/game/ai';
import { drain, type GameEvent } from '../src/game/events';
import { createGame, revealAround, spawnUnit } from '../src/game/mapgen';
import { isKiai } from '../src/game/mech/japan';
import { attack, previewCombat } from '../src/game/rules';
import { endTurn, startTurn } from '../src/game/turn';
import type { GameState, Unit } from '../src/game/types';
import { isNeutral, spawnNeutral } from '../src/game/wild';
import { TRIBE_IDS } from '../src/data/tribes';
import {
  COUNTER_COLOR, CRIT_COLOR, DAMAGE_COLOR, DEATH_PARTICLE_CAP, DEATH_STYLES, DEATH_THEMES, damageFloater, deathParticles, deathTheme,
  floaterPose, killShake, mergeShake, shakeOffset,
} from '../src/render/combatfx';

/** A seeded 0..1 stream, so the particle tests are deterministic. */
const seeded = (n = 1) => () => { n = (n * 16807) % 2147483647; return n / 2147483647; };

/** Two empires on open ground, units 0 and 1 side by side at (8,8)/(9,8), everything revealed. */
function arena(me: 'japan' | 'zulu' | 'aztec' | 'rome', foe: 'rome' | 'celts' = 'rome') {
  const s = createGame({ seed: 4, human: me, opponents: [foe], mode: 'domination' });
  s.units = [];
  for (const t of s.tiles) if (Math.abs(t.x - 8) <= 4 && Math.abs(t.y - 8) <= 4) { t.terrain = 'field'; t.cityId = null; t.owner = null; t.village = false; t.ruin = false; t.improvement = null; t.resource = null; }
  for (const p of s.players) p.explored = p.explored.map(() => true);
  drain();
  return s;
}
const ready = (u: Unit) => { u.moved = false; u.attacked = false; return u; };
const damages = (evs: GameEvent[]) => evs.filter((e): e is Extract<GameEvent, { type: 'damage' }> => e.type === 'damage');

test('every empire, plus beasts, rebels and captives, has its own named death effect', () => {
  assert.equal(DEATH_THEMES.length, TRIBE_IDS.length + 3);
  for (const t of TRIBE_IDS) assert.ok(DEATH_STYLES[t], `${t} has a death effect`);
  const names = DEATH_THEMES.map((t) => DEATH_STYLES[t].name);
  assert.equal(new Set(names).size, names.length, 'no two themes share an effect');
  // the brief's examples
  assert.match(DEATH_STYLES.zulu.name, /dust/i);
  assert.match(DEATH_STYLES.vikings.name, /splash.*shield/i);
  assert.match(DEATH_STYLES.japan.name, /cherry/i);
  assert.match(DEATH_STYLES.inuit.name, /ice/i);
  assert.match(DEATH_STYLES.egypt.name, /sand.*ankh/i);
  assert.match(DEATH_STYLES.celts.name, /leaves/i);
  assert.match(DEATH_STYLES.pirates.name, /coin/i);
  assert.match(DEATH_STYLES.beast.name, /ink/i);
  assert.ok(DEATH_STYLES.egypt.layers.some((l) => l.shape === 'ankh'));
  assert.ok(DEATH_STYLES.pirates.layers.some((l) => l.shape === 'coin'));
  assert.ok(DEATH_STYLES.japan.layers.every((l) => l.shape === 'petal'));
});

test('the death theme follows the fallen: its empire, a kraken, a rogue soldier, or an Aztec captive', () => {
  assert.equal(deathTheme('japan', 'samurai', false, false), 'japan');
  assert.equal(deathTheme('celts', 'warrior', false, false), 'celts');
  assert.equal(deathTheme('tibet', 'kraken', true, false), 'beast', 'the neutral owner borrows an empire look, but a kraken is a beast');
  assert.equal(deathTheme('tibet', 'swordsman', true, false), 'rebel');
  assert.equal(deathTheme('rome', 'warrior', false, true), 'captive', 'taken alive beats the empire effect');
});

test('death particles are cheap, deterministic and bigger for big units', () => {
  for (const t of DEATH_THEMES) {
    const a = deathParticles(t, 0, 0, 100, false, seeded(3));
    const b = deathParticles(t, 0, 0, 100, false, seeded(3));
    assert.deepEqual(a, b);
    assert.ok(a.length >= 3 && a.length <= DEATH_PARTICLE_CAP, `${t}: ${a.length} particles`);
    assert.ok(a.every((p) => p.t0 === 100 && p.life > 0 && p.life < 1.5), 'short-lived');
    const big = deathParticles(t, 0, 0, 100, true, seeded(3));
    assert.ok(big.length >= a.length && big.length <= DEATH_PARTICLE_CAP);
  }
  assert.ok(deathParticles('japan', 0, 0, 0, false, seeded()).every((p) => p.shape === 'petal' && p.sway), 'petals flutter');
});

test('damage numbers: counter-blows have their own colour, crits are big and labelled, and they bounce', () => {
  const plain = damageFloater(3, false, undefined, 1, 2, 0);
  const counter = damageFloater(2, true, undefined, 1, 2, 0);
  const crit = damageFloater(9, false, 'Kiai!', 1, 2, 0);
  assert.equal(plain.color, DAMAGE_COLOR);
  assert.equal(counter.color, COUNTER_COLOR);
  assert.notEqual(COUNTER_COLOR, DAMAGE_COLOR);
  assert.equal(crit.color, CRIT_COLOR);
  assert.equal(crit.label, 'KIAI!');
  assert.ok(crit.big && !plain.big && plain.hit);
  // pops out past full size, settles, rises the whole time and fades only at the end
  const p = (q: number) => floaterPose(q, true, false);
  assert.ok(p(0).scale < 1 && p(0.1).scale > 1.2 && Math.abs(p(0.4).scale - 1) < 1e-9);
  assert.ok(p(0.28).rise > p(0).rise && p(0.9).rise > p(0.28).rise);
  assert.ok(p(0.25).rise > p(0.35).rise - 3, 'overshoots then settles (a bounce)');
  assert.equal(p(0.5).alpha, 1);
  assert.ok(p(0.99).alpha < 0.1);
  assert.ok(floaterPose(0.5, true, true).scale > p(0.5).scale, 'a crit is bigger');
});

test('kills shake the screen a little, big units more, and never with reduced motion', () => {
  const small = killShake('warrior', 0, false)!, big = killShake('giant', 0, false)!, kraken = killShake('kraken', 0, false)!;
  assert.ok(small.mag > 0 && small.mag <= 3, 'subtle');
  assert.ok(big.mag > small.mag && kraken.mag > small.mag && big.dur > small.dur);
  assert.equal(killShake('giant', 0, true), null);
  const off = shakeOffset(big, 60);
  assert.ok(Math.abs(off.x) + Math.abs(off.y) > 0);
  assert.deepEqual(shakeOffset(big, big.dur + 1), { x: 0, y: 0 });
  assert.deepEqual(shakeOffset(big, -5), { x: 0, y: 0 }, 'a shake scheduled for later waits');
  assert.deepEqual(shakeOffset(null, 10), { x: 0, y: 0 });
  assert.equal(mergeShake(big, small, 10), big, 'a small kill does not cut a big shake short');
  assert.equal(mergeShake(small, big, 10), big);
  assert.equal(mergeShake(small, null, 10), small);
});

test('the counter-blow is flagged on its damage event', () => {
  const s = arena('rome');
  const a = ready(spawnUnit(s, 'warrior', 0, 8, 8, null));
  const d = spawnUnit(s, 'defender', 1, 9, 8, null);
  assert.ok(previewCombat(s, a, d).ret > 0);
  assert.ok(attack(s, a, d));
  const [hit, back] = damages(drain());
  assert.equal(hit.unitId, d.id);
  assert.ok(!hit.counter && !hit.crit);
  assert.equal(back.unitId, a.id);
  assert.equal(back.counter, true);
});

test('a Japanese Kiai names itself on the damage event', () => {
  const s = arena('japan');
  const a = ready(spawnUnit(s, 'warrior', 0, 8, 8, null));
  const d = spawnUnit(s, 'defender', 1, 9, 8, null);
  let t = 0;
  for (; t < 200; t++) { s.turn = t; if (isKiai(s, a, d)) break; }
  assert.ok(t < 200);
  assert.equal(previewCombat(s, a, d).tag, 'Kiai!');
  assert.ok(attack(s, a, d));
  assert.equal(damages(drain())[0].crit, 'Kiai!');
  // no crit on a plain blow
  const s2 = arena('japan');
  const a2 = ready(spawnUnit(s2, 'warrior', 0, 8, 8, null));
  const d2 = spawnUnit(s2, 'defender', 1, 9, 8, null);
  for (t = 0; t < 200; t++) { s2.turn = t; if (!isKiai(s2, a2, d2)) break; }
  assert.equal(previewCombat(s2, a2, d2).tag, undefined);
});

test('a sprung Zulu trap and a Great Beast strike are labelled bonus blows', () => {
  const s = arena('zulu');
  const foe = spawnUnit(s, 'warrior', 1, 8, 8, null);
  const a = ready(spawnUnit(s, 'impi', 0, 7, 8, null));
  assert.equal(previewCombat(s, a, foe).tag, undefined, 'no trap yet');
  ready(spawnUnit(s, 'impi', 0, 9, 8, null)); ready(spawnUnit(s, 'impi', 0, 8, 7, null));
  assert.equal(previewCombat(s, a, foe).tag, 'Trap!');
  assert.ok(attack(s, a, foe));
  assert.equal(damages(drain())[0].crit, 'Trap!');

  const w = createGame({ seed: 11, human: 'rome', opponents: ['egypt'], mode: 'perfection', wild: true });
  const k = spawnNeutral(w, 'kraken', 2, 2);
  const ship = spawnUnit(w, 'boat', 0, 3, 2, null);
  assert.equal(previewCombat(w, k, ship).tag, 'Kraken!');
  assert.equal(previewCombat(w, ship, k).tag, undefined, 'only the beast\'s own blow');
});

test('an Aztec capture reports the captor, so the captive is led away rather than slain', () => {
  const s = arena('aztec');
  const a = ready(spawnUnit(s, 'warrior', 0, 8, 8, null));
  const d = spawnUnit(s, 'warrior', 1, 9, 8, null);
  d.hp = 1;
  revealAround(s, 0);
  assert.ok(attack(s, a, d));
  const death = drain().find((e) => e.type === 'death');
  assert.ok(death && death.type === 'death');
  assert.deepEqual(death.captor, { x: 8, y: 8 });
  assert.equal(deathTheme(s.players[death.owner].tribe, death.kind, isNeutral(s, death.owner), !!death.captor), 'captive');
  // an ordinary kill has no captor
  const s2 = arena('rome');
  const a2 = ready(spawnUnit(s2, 'swordsman', 0, 8, 8, null));
  const d2 = spawnUnit(s2, 'warrior', 1, 9, 8, null);
  d2.hp = 1;
  assert.ok(attack(s2, a2, d2));
  const death2 = drain().find((e) => e.type === 'death');
  assert.ok(death2 && death2.type === 'death' && !death2.captor);
});

test('30-turn all-AI game: every blow and death maps to feedback the renderer can draw', () => {
  const s: GameState = createGame({ seed: 21, human: null, opponents: ['japan', 'zulu', 'aztec', 'vikings', 'pirates', 'inuit'], mode: 'perfection', wild: true, maxTurns: 30 });
  drain();
  startTurn(s);
  const evs: GameEvent[] = [];
  for (let i = 0; i < 30 * 6 && !s.over; i++) {
    aiTurn(s);
    evs.push(...drain());
    endTurn(s);
    evs.push(...drain());
  }
  assert.ok(s.turn >= 20, `reached turn ${s.turn}`);
  const hits = damages(evs);
  const deaths = evs.filter((e): e is Extract<GameEvent, { type: 'death' }> => e.type === 'death');
  assert.ok(hits.length > 5, `${hits.length} blows`);
  assert.ok(deaths.length > 0, `${deaths.length} deaths`);
  assert.ok(hits.some((e) => e.counter), 'counter-blows happen and are flagged');
  for (const e of hits) {
    const f = damageFloater(e.amount, !!e.counter, e.crit, e.x, e.y, 0);
    assert.ok(f.text.startsWith('-') && f.color);
  }
  const themes = new Set<string>();
  for (const e of deaths) {
    const theme = deathTheme(s.players[e.owner].tribe, e.kind, isNeutral(s, e.owner), !!e.captor);
    themes.add(theme);
    const ps = deathParticles(theme, 0, 0, 0, false, seeded(e.unitId + 1));
    assert.ok(ps.length > 0 && ps.length <= DEATH_PARTICLE_CAP);
  }
  assert.ok(themes.size >= 2, `several empires fell their own way: ${[...themes].join(', ')}`);
  JSON.parse(JSON.stringify(s));
});

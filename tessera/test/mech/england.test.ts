import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../../src/game/ai';
import { attack, doAction, maxHp, previewCombat, tileActions } from '../../src/game/rules';
import { isWater, tileAt } from '../../src/game/grid';
import { createGame, spawnUnit } from '../../src/game/mapgen';
import { endTurn, startTurn } from '../../src/game/turn';
import { hookStat, hookTurnStart } from '../../src/game/mech';
import { MARQUE_COOLDOWN, MARQUE_COST, MARQUE_TURNS, NAVY_ATK, PRIZE, capitalTile, marqueActive, mech } from '../../src/game/mech/england';
import { perkSum } from '../../src/game/perks';
import type { GameState, Tile } from '../../src/game/types';

/** A freshly launched unit, ready to act this turn. */
const fresh = (...a: Parameters<typeof spawnUnit>) => { const u = spawnUnit(...a); u.moved = false; u.attacked = false; return u; };

function setup(opp: 'japan' | 'vikings' = 'japan') {
  const s = createGame({ seed: 5, human: 'england', opponents: [opp], mode: 'perfection' });
  s.units = [];
  s.players[0].explored = s.players[0].explored.map(() => true); // the whole sea in sight
  return { s, city: s.cities.find((c) => c.owner === 0)! };
}

/** Two free water tiles side by side, far from any port. */
function waterPair(s: GameState): [Tile, Tile] {
  for (const t of s.tiles) {
    if (!isWater(t)) continue;
    const n = tileAt(s, t.x + 1, t.y);
    if (n && isWater(n)) return [t, n];
  }
  throw new Error('no water');
}

test('Royal Navy: English ships and warships attack +0.5, nothing else does', () => {
  const { s, city } = setup();
  const [a, b] = waterPair(s);
  const ship = spawnUnit(s, 'ship', 0, a.x, a.y, null);
  const war = spawnUnit(s, 'warship', 0, b.x, b.y, null);
  const boat = spawnUnit(s, 'boat', 0, a.x, a.y + 2, null);
  const arch = spawnUnit(s, 'longbowman', 0, city.x, city.y, null);
  const foe = spawnUnit(s, 'ship', 1, a.x, a.y + 3, null);
  assert.equal(hookStat(s, ship, 'atk'), NAVY_ATK);
  assert.equal(hookStat(s, war, 'atk'), NAVY_ATK);
  assert.equal(hookStat(s, ship, 'def'), 0);
  assert.equal(hookStat(s, boat, 'atk'), 0, 'boats do not count');
  assert.equal(hookStat(s, arch, 'atk'), 0, 'land units do not count');
  assert.equal(hookStat(s, foe, 'atk'), 0, 'enemy ships do not count');
});

test('prize money: sinking an enemy vessel pays 3 stars; a wounded one does not', () => {
  const { s } = setup();
  const [a, b] = waterPair(s);
  const war = fresh(s, 'warship', 0, a.x, a.y, null);
  const foe = spawnUnit(s, 'boat', 1, b.x, b.y, null);
  foe.hp = 1;
  s.players[0].stars = 0;
  assert.ok(attack(s, war, foe));
  assert.ok(!s.units.includes(foe));
  assert.equal(s.players[0].stars, PRIZE + perkSum(s, 0, 'kill'), 'the prize on top of any bounty perk');
  // a wounded but living foe pays nothing
  const { s: s2 } = setup();
  const [c, d] = waterPair(s2);
  const w2 = fresh(s2, 'ship', 0, c.x, c.y, null);
  const f2 = spawnUnit(s2, 'warship', 1, d.x, d.y, null);
  s2.players[0].stars = 0;
  attack(s2, w2, f2);
  assert.ok(s2.units.includes(f2));
  assert.equal(s2.players[0].stars, 0);
});

test('dockyards: ships in or beside an English port heal to full at turn start', () => {
  const { s, city } = setup();
  for (const t of s.tiles) if (t.improvement === 'port') t.improvement = null;
  const [a, b] = waterPair(s);
  const docked = spawnUnit(s, 'warship', 0, a.x, a.y, null);
  const far = s.tiles.find((t) => isWater(t) && Math.max(Math.abs(t.x - a.x), Math.abs(t.y - a.y)) > 3)!;
  const away = spawnUnit(s, 'ship', 0, far.x, far.y, null);
  docked.hp = 3;
  away.hp = 3;
  b.improvement = 'port';
  b.owner = city.id; // inside English borders
  hookTurnStart(s, 0);
  assert.equal(docked.hp, maxHp(docked), 'repaired beside the port');
  assert.equal(away.hp, 3, 'not near a port');
  // a foreign port does nothing
  docked.hp = 3;
  b.owner = s.cities.find((c) => c.owner === 1)!.id;
  hookTurnStart(s, 0);
  assert.equal(docked.hp, 3);
});

test('letters of marque: 5 stars, steals 1 star per hit for 4 turns, never below 0, 8-turn cooldown', () => {
  const { s } = setup();
  const cap = capitalTile(s, 0)!;
  const p = s.players[0], q = s.players[1];
  p.stars = 20;
  const act = tileActions(s, 0, cap).find((a) => a.id === 'mech:marque')!;
  assert.ok(act && act.enabled);
  assert.equal(act.cost, MARQUE_COST);
  assert.ok(doAction(s, 0, cap, 'mech:marque'));
  assert.equal(p.stars, 20 - MARQUE_COST);
  assert.ok(marqueActive(s, 0));
  const [a, b] = waterPair(s);
  const ship = fresh(s, 'ship', 0, a.x, a.y, null);
  const foe = spawnUnit(s, 'warship', 1, b.x, b.y, null);
  q.stars = 3;
  p.stars = 0;
  assert.ok(previewCombat(s, ship, foe).dmg > 0);
  attack(s, ship, foe);
  assert.equal(q.stars, 2);
  assert.equal(p.stars, 1);
  // never below 0
  q.stars = 0;
  ship.attacked = false;
  foe.hp = maxHp(foe);
  ship.hp = maxHp(ship);
  attack(s, ship, foe);
  assert.equal(q.stars, 0);
  assert.equal(p.stars, 1);
  // runs out after 4 turns
  s.turn += MARQUE_TURNS - 1;
  assert.ok(marqueActive(s, 0));
  s.turn += 1;
  assert.ok(!marqueActive(s, 0));
  q.stars = 5;
  ship.attacked = false;
  ship.hp = maxHp(ship);
  foe.hp = maxHp(foe);
  attack(s, ship, foe);
  assert.equal(q.stars, 5, 'no theft once it lapses');
  // cooldown
  p.stars = 50;
  const cool = tileActions(s, 0, cap).find((a) => a.id === 'mech:marque')!;
  assert.equal(cool.enabled, false);
  assert.match(cool.reason!, /Ready in/);
  assert.ok(!doAction(s, 0, cap, 'mech:marque'));
  s.turn = s.turn - MARQUE_TURNS + MARQUE_COOLDOWN;
  assert.ok(tileActions(s, 0, cap).find((a) => a.id === 'mech:marque')!.enabled);
  // only at the capital, only for England
  const other = s.tiles.find((t) => t !== cap)!;
  assert.ok(!tileActions(s, 0, other).some((a) => a.id === 'mech:marque'));
  assert.deepEqual(mech.actions!(s, 1, capitalTile(s, 1)!), []);
});

test('AI signs the letters at war with a naval empire, not otherwise', () => {
  {
    const { s } = setup('japan');
    const [a, b] = waterPair(s);
    spawnUnit(s, 'ship', 0, a.x, a.y, null);
    spawnUnit(s, 'warship', 1, b.x, b.y, null);
    s.players[0].stars = 30;
    assert.ok(!mech.ai!(s, 0), 'Japan is not a naval empire');
  }
  const { s } = setup('vikings');
  const [a, b] = waterPair(s);
  spawnUnit(s, 'ship', 0, a.x, a.y, null);
  spawnUnit(s, 'warship', 1, b.x, b.y, null);
  s.players[0].stars = 30;
  assert.ok(mech.ai!(s, 0));
  assert.equal(s.players[0].stars, 30 - MARQUE_COST);
  assert.ok(marqueActive(s, 0));
  assert.ok(!mech.ai!(s, 0), 'cooling down');
});

test('25-turn all-AI game with England completes', () => {
  const s: GameState = createGame({ seed: 11, human: null, opponents: ['england', 'vikings', 'carthage'], mode: 'perfection' });
  startTurn(s);
  let guard = 0;
  while (!s.over && s.turn < 25 && guard++ < 1500) {
    aiTurn(s);
    endTurn(s);
  }
  assert.ok(s.turn >= 25 || s.over);
  JSON.parse(JSON.stringify(s));
});

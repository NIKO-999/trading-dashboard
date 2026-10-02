import assert from 'node:assert/strict';
import test from 'node:test';
import { aiStep } from '../src/game/ai';
import {
  armyAi, AI_UPGRADE_RESERVE, formation, formationLinks, isShieldKind, lacksSupply, lineBase, outOfSupply, shieldWall, SUPPLY_NOTES, suppliedAt,
  supplyExempt, UPGRADE_FEE, upgradeTarget,
} from '../src/game/army';
import { drain } from '../src/game/events';
import { createGame, foundCity, spawnUnit } from '../src/game/mapgen';
import { doAction, maxHp, moveUnit, previewCombat, tileActions, trainCost, type Action } from '../src/game/rules';
import { endTurn, startTurn } from '../src/game/turn';
import type { GameState, TribeId, Unit, UnitKind } from '../src/game/types';
import { UNITS } from '../src/data/units';
import { drawArmyGround } from '../src/render/army';

/** A blank field map (every city, unit, resource and border cleared) with everyone rich and knowing the basic techs. */
function sandbox(tribes: TribeId[], opts: Partial<Parameters<typeof createGame>[0]> = {}): GameState {
  const s = createGame({ seed: 7, human: tribes[0], opponents: tribes.slice(1), mode: 'perfection', ...opts });
  for (const t of s.tiles) Object.assign(t, { terrain: 'field', resource: null, improvement: null, road: false, village: false, ruin: false, cityId: null, owner: null, data: undefined });
  s.cities = [];
  s.units = [];
  for (const p of s.players) { p.explored.fill(true); p.stars = 100; p.techs.push('tactics', 'roads', 'riding', 'archery', 'smithing'); }
  return s;
}
const tile = (s: GameState, x: number, y: number) => s.tiles[y * s.size + x];
function unit(s: GameState, pid: number, kind: UnitKind, x: number, y: number): Unit {
  const u = spawnUnit(s, kind, pid, x, y, null);
  u.moved = u.attacked = false;
  return u;
}
const upgradeAct = (s: GameState, u: Unit): Action | undefined => tileActions(s, u.owner, tile(s, u.x, u.y)).find((a) => a.id.startsWith('upgrade:'));

// ---------------------------------------------------------------- formations

test('shield wall: +0.5 defence for each shield unit beside it, up to +1, and it shows in the attack preview', () => {
  const s = sandbox(['greeks', 'japan']);
  assert.ok(isShieldKind('defender') && isShieldKind('hoplite') && isShieldKind('guardian') && isShieldKind('legionary'));
  assert.ok(!isShieldKind('warrior') && !isShieldKind('swordsman') && !isShieldKind('recruiter') && !isShieldKind('hero') && !isShieldKind('knight'));
  const foe = unit(s, 1, 'warrior', 4, 5);
  const d = unit(s, 0, 'hoplite', 5, 5);
  const alone = previewCombat(s, foe, d);
  assert.equal(shieldWall(s, d), 0);
  assert.deepEqual(alone.formation, []);
  unit(s, 0, 'defender', 6, 5); // any shield unit of the same empire joins the wall
  assert.equal(shieldWall(s, d), 0.5);
  unit(s, 0, 'hoplite', 5, 6);
  unit(s, 0, 'hoplite', 6, 6);
  assert.equal(shieldWall(s, d), 1, 'capped at +1');
  const walled = previewCombat(s, foe, d);
  assert.ok(walled.dmg < alone.dmg, `${walled.dmg} < ${alone.dmg}`);
  assert.ok(walled.ret > alone.ret, 'the wall hits back harder too');
  assert.ok(walled.formation.includes('Shield wall +1 def'));
  assert.ok(walled.formation.some((n) => /Iron Wall/.test(n)), 'three of the Defender family also form an Iron Wall trio (see game/troops)');
  // another empire's shields beside it don't count, nor does a warrior
  const s2 = sandbox(['greeks', 'japan']);
  const d2 = unit(s2, 0, 'hoplite', 5, 5);
  unit(s2, 1, 'defender', 6, 5);
  unit(s2, 0, 'warrior', 5, 6);
  assert.equal(shieldWall(s2, d2), 0);
});

test('volley: a ranged unit hits +0.5 harder with another friendly ranged unit beside it', () => {
  const s = sandbox(['greeks', 'japan']);
  const a = unit(s, 0, 'archer', 3, 3);
  const foe = unit(s, 1, 'warrior', 5, 3);
  const alone = previewCombat(s, a, foe);
  const b = unit(s, 0, 'archer', 3, 4);
  const volley = previewCombat(s, a, foe);
  assert.ok(volley.dmg > alone.dmg, `${volley.dmg} > ${alone.dmg}`);
  assert.deepEqual(volley.formation, ['Volley +0.5']);
  assert.equal(formation(s, a, foe).atk, 0.5);
  // a catapult is a siege engine, not a bow: no volley with it
  b.kind = 'catapult';
  assert.equal(formation(s, a, foe).atk, 0);
});

test('charge: a mounted unit hits +0.5 harder when another friendly mounted unit stands beside the target', () => {
  const s = sandbox(['greeks', 'japan']);
  const a = unit(s, 0, 'rider', 4, 5);
  const foe = unit(s, 1, 'warrior', 5, 5);
  const alone = previewCombat(s, a, foe);
  const b = unit(s, 0, 'rider', 6, 6); // beside the target, not beside the attacker
  const charge = previewCombat(s, a, foe);
  assert.ok(charge.dmg > alone.dmg);
  assert.deepEqual(charge.formation, ['Charge +0.5']);
  b.x = 2; b.y = 5; // beside the attacker but not the target: no charge
  assert.equal(formation(s, a, foe).atk, 0);
  // an enemy's rider beside the target is no help
  const e = unit(s, 1, 'rider', 6, 4);
  assert.equal(formation(s, a, foe).atk, 0);
  void e;
});

test('formation links pair friendly units of one line standing side by side, and the map draws them', () => {
  const s = sandbox(['greeks', 'japan']);
  const h1 = unit(s, 0, 'hoplite', 2, 2), h2 = unit(s, 0, 'hoplite', 3, 3);
  unit(s, 0, 'archer', 4, 4); // beside a hoplite, but not of its line
  const r1 = unit(s, 1, 'rider', 8, 8), r2 = unit(s, 1, 'rider', 8, 9);
  unit(s, 1, 'archer', 1, 8);
  const links = formationLinks(s);
  assert.equal(links.length, 2);
  assert.ok(links.some((l) => l.kind === 'shield' && [l.a, l.b].includes(h1) && [l.a, l.b].includes(h2)));
  assert.ok(links.some((l) => l.kind === 'charge' && [l.a, l.b].includes(r1) && [l.a, l.b].includes(r2)));
  let strokes = 0;
  const ctx = new Proxy({}, {
    get: (_t, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => { if (k === 'fill' || k === 'stroke') strokes++; }),
    set: () => true,
  }) as unknown as CanvasRenderingContext2D;
  drawArmyGround(ctx, s, -1);
  assert.ok(strokes >= 8, 'cords and glyphs drawn');
  const before = strokes;
  h1.data = { oos: true };
  drawArmyGround(ctx, s, 0);
  assert.ok(strokes - before > 8, 'and the out-of-supply mark');
});

// ---------------------------------------------------------------- upgrades

test('upgrade in a city: warrior → swordsman with Smithing, paying the difference plus 1, keeping rank and health', () => {
  const s = sandbox(['greeks', 'japan']);
  for (const p of s.players) p.stock = { iron: 12, horses: 12 }; // Iron-age units need Iron (see game/goods)
  const c = foundCity(s, 2, 2, 0, true);
  const u = unit(s, 0, 'warrior', 2, 2);
  u.hp = 5;
  u.veteran = true; u.veteranKills = 3;
  const a = upgradeAct(s, u)!;
  assert.equal(a.id, 'upgrade:swordsman');
  assert.equal(a.cost, UNITS.swordsman.cost - UNITS.warrior.cost + UPGRADE_FEE);
  assert.ok(a.enabled, String(a.reason));
  const ratio = u.hp / maxHp(u);
  const stars = s.players[0].stars;
  assert.ok(doAction(s, 0, tile(s, 2, 2), a.id));
  assert.equal(u.kind, 'swordsman');
  assert.equal(s.players[0].stars, stars - a.cost);
  assert.ok(u.veteran && u.veteranKills === 3, 'keeps its veteran rank');
  assert.equal(u.hp, Math.round(maxHp(u) * ratio), 'keeps its share of health');
  assert.ok(u.moved && u.attacked, 'uses its turn');
  assert.ok(s.log.some((l) => l.text.includes('upgraded to Swordsman')));
  assert.equal(c.units, 0, 'no new unit slot is used');
  // a swordsman is the top of its line
  assert.equal(upgradeTarget(s, u), null);
});

test('upgrade rules: needs the tech, your own city and an unspent turn; empires map their unique units', () => {
  const s = sandbox(['greeks', 'japan']);
  foundCity(s, 2, 2, 0, true);
  const u = unit(s, 0, 'warrior', 2, 2);
  s.players[0].techs = s.players[0].techs.filter((t) => t !== 'smithing');
  const a = upgradeAct(s, u)!;
  assert.ok(!a.enabled && a.needs === 'smithing');
  s.players[0].techs.push('smithing');
  u.moved = true;
  assert.equal(upgradeAct(s, u)!.reason, 'Unit has already acted');
  u.moved = false;
  // outside a city: no upgrade; in an enemy's city neither
  u.x = 4; u.y = 4;
  assert.equal(upgradeAct(s, u), undefined);
  foundCity(s, 7, 7, 1, true);
  u.x = 7; u.y = 7;
  assert.equal(upgradeAct(s, u), undefined);
  // lines through each empire's own units
  assert.equal(lineBase('legionary'), 'warrior');
  assert.equal(lineBase('horsearcher'), 'archer'); // the Mongols' mounted bowman stands in for the archer
  assert.equal(lineBase('chariot'), 'rider');
  const kindFor = (tribe: TribeId, k: UnitKind) => {
    const g = sandbox([tribe, 'greeks']);
    return upgradeTarget(g, unit(g, 0, k, 3, 3));
  };
  assert.equal(kindFor('vikings', 'warrior'), 'berserker');
  assert.equal(kindFor('rome', 'legionary'), 'swordsman');
  assert.equal(kindFor('japan', 'warrior'), 'samurai');
  assert.equal(kindFor('zulu', 'impi'), 'swordsman');
  assert.equal(kindFor('mongols', 'horsearcher'), null);
  assert.equal(kindFor('mongols', 'rider'), 'knight');
  assert.equal(kindFor('egypt', 'chariot'), 'knight');
  assert.equal(kindFor('greeks', 'rider'), 'knight');
  assert.equal(kindFor('india', 'rider'), 'elephant');
  assert.equal(kindFor('greeks', 'archer'), null, 'no stronger bow exists yet');
  assert.equal(kindFor('greeks', 'knight'), null);
  assert.equal(kindFor('greeks', 'hero'), null);
  assert.equal(kindFor('greeks', 'sapper'), null);
  // the price follows what the two cost this empire to train (Mongols' Steppe Riders)
  const m = sandbox(['mongols', 'greeks']);
  m.players[0].techs.push('chivalry');
  foundCity(m, 2, 2, 0, true);
  const ha = unit(m, 0, 'rider', 2, 2);
  assert.equal(upgradeAct(m, ha)!.cost, trainCost(m, 0, 'knight') - trainCost(m, 0, 'rider') + UPGRADE_FEE);
  // boats keep their own path
  const b = unit(m, 0, 'boat', 5, 5);
  assert.equal(upgradeTarget(m, b), null);
});

test('the computer upgrades a unit waiting in its city only when rich', () => {
  const s = sandbox(['greeks', 'japan']);
  for (const p of s.players) p.stock = { iron: 12, horses: 12 }; // Iron-age units need Iron (see game/goods)
  foundCity(s, 2, 2, 0, true);
  const u = unit(s, 0, 'warrior', 2, 2);
  const cost = upgradeAct(s, u)!.cost;
  s.players[0].stars = cost + AI_UPGRADE_RESERVE - 1;
  assert.ok(!armyAi(s, 0));
  assert.equal(u.kind, 'warrior');
  s.players[0].stars = cost + AI_UPGRADE_RESERVE;
  assert.ok(armyAi(s, 0));
  assert.equal(u.kind, 'swordsman');
  assert.ok(!armyAi(s, 0), 'one upgrade per unit and turn');
});

// ---------------------------------------------------------------- supply

test('supply: far beyond the borders a unit loses 1 HP a turn (never below 1) and cannot heal', () => {
  const s = sandbox(['greeks', 'japan']);
  foundCity(s, 1, 1, 0, true); // territory 0..2
  const near = unit(s, 0, 'warrior', 5, 5); // 3 tiles from (2, 2): in supply
  const far = unit(s, 0, 'warrior', 7, 7);
  far.hp = 6;
  assert.ok(suppliedAt(s, 0, 5, 5) && !suppliedAt(s, 0, 6, 6));
  s.turn = 1; s.current = 0;
  startTurn(s);
  assert.ok(!outOfSupply(near) && near.hp === 10);
  assert.ok(outOfSupply(far));
  assert.equal(far.hp, 5);
  const rec = tileActions(s, 0, tile(s, 7, 7)).find((a) => a.id === 'recover')!;
  assert.ok(!rec.enabled && /supply/i.test(rec.reason!), 'no healing out of supply');
  assert.ok(drain().some((e) => e.type === 'toast' && e.player === 0 && /out of supply/.test(e.text)));
  far.hp = 1;
  startTurn(s);
  assert.equal(far.hp, 1, 'never below 1');
  // the state is JSON-safe
  const back = JSON.parse(JSON.stringify(s)) as GameState;
  assert.ok(outOfSupply(back.units.find((u) => u.id === far.id)!));
  // walking back into supply takes the mark off at once
  far.moved = false;
  far.x = 6; far.y = 5;
  assert.ok(moveUnit(s, far, 5, 4));
  assert.ok(!outOfSupply(far));
  assert.equal(far.data, undefined, 'no empty data left behind');
});

test('supply: a road, your fort or an ally’s land beside the unit keeps it supplied', () => {
  const s = sandbox(['greeks', 'japan', 'zulu'], { diplomacy: true });
  foundCity(s, 1, 1, 0, true);
  const u = unit(s, 0, 'warrior', 8, 8);
  assert.ok(lacksSupply(s, u));
  tile(s, 9, 8).road = true;
  assert.ok(!lacksSupply(s, u), 'a road beside it');
  tile(s, 9, 8).road = false;
  Object.assign(tile(s, 7, 7), { improvement: 'fort', data: { sfort: 0 } });
  assert.ok(!lacksSupply(s, u), 'a Sappers’ fort of ours');
  tile(s, 7, 7).data = { sfort: 1 };
  assert.ok(lacksSupply(s, u), 'someone else’s fort is no help');
  tile(s, 7, 7).data = { castra: 0 };
  assert.ok(!lacksSupply(s, u), 'a Roman castra of ours');
  Object.assign(tile(s, 7, 7), { improvement: null, data: undefined });
  // an ally's land beside it
  foundCity(s, 9, 10, 1, true); // territory 8..10, 9..11
  assert.ok(lacksSupply(s, u), 'at war (no treaty): no help');
  s.diplo!.pacts.push({ a: 0, b: 1, kind: 'alliance', since: 0 });
  assert.ok(!lacksSupply(s, u), 'an ally');
  s.diplo!.pacts[0].kind = 'peace';
  assert.ok(lacksSupply(s, u), 'peace is not an alliance');
});

test('supply: heroes, boats, Pirates afloat and the peoples who live off the land are exempt', () => {
  const s = sandbox(['greeks', 'mongols', 'pirates']);
  foundCity(s, 1, 1, 0, true);
  const hero = unit(s, 0, 'hero', 8, 8);
  const boat = unit(s, 0, 'boat', 8, 5);
  boat.carrying = 'warrior';
  tile(s, 8, 5).terrain = 'ocean';
  assert.ok(supplyExempt(s, hero) && supplyExempt(s, boat));
  assert.ok(!supplyExempt(s, unit(s, 0, 'warrior', 9, 9)));
  const horde = unit(s, 1, 'horsearcher', 5, 9);
  assert.ok(supplyExempt(s, horde));
  for (const t of ['mongols', 'lakota', 'aboriginal'] as TribeId[]) {
    const g = sandbox([t, 'greeks']);
    assert.ok(supplyExempt(g, unit(g, 0, 'warrior', 5, 5)), t);
    assert.ok(SUPPLY_NOTES[t], `${t} note`);
  }
  const pirate = unit(s, 2, 'buccaneer', 3, 9);
  assert.ok(!supplyExempt(s, pirate), 'a pirate ashore needs supply');
  tile(s, 3, 9).terrain = 'shallow';
  assert.ok(supplyExempt(s, pirate), 'wading the shallows');
  tile(s, 3, 9).terrain = 'platform';
  assert.ok(supplyExempt(s, pirate), 'on a platform');
  assert.ok(SUPPLY_NOTES.pirates);
  // nothing exempt is ever marked
  s.turn = 1;
  for (const pid of [0, 1, 2]) { s.current = pid; startTurn(s); }
  assert.ok(!outOfSupply(hero) && !outOfSupply(boat) && !outOfSupply(horde) && !outOfSupply(pirate));
  assert.equal(hero.hp, maxHp(hero));
});

test('older saves without supply marks load and play', () => {
  const s = createGame({ seed: 3, human: null, opponents: ['rome', 'greeks', 'vikings'], mode: 'perfection', maxTurns: 30 });
  for (const u of s.units) delete u.data;
  const back = JSON.parse(JSON.stringify(s)) as GameState;
  for (let i = 0; i < 6; i++) { for (let n = 0; aiStep(back) && n < 400; n++); endTurn(back); }
  drain();
  assert.ok(back.turn >= 1);
});

// ---------------------------------------------------------------- the whole game

test('a 30-turn all-AI game uses formations, upgrades and supply', () => {
  const tribes: TribeId[] = ['zulu', 'persia', 'japan', 'aztec', 'celts'];
  const s = createGame({ seed: 7, human: null, opponents: tribes, mode: 'perfection', maxTurns: 30, difficulty: 'hard' });
  let links = 0, marked = 0, exemptMarked = 0, formed = 0;
  let guard = 0;
  while (!s.over && guard++ < 4000) {
    for (let n = 0; aiStep(s) && n < 400; n++);
    links += formationLinks(s).length;
    for (const u of s.units) {
      if (outOfSupply(u)) { marked++; if (supplyExempt(s, u)) exemptMarked++; }
      assert.ok(u.hp >= 1);
    }
    for (const a of s.units) for (const d of s.units) if (a.owner !== d.owner && Math.max(Math.abs(a.x - d.x), Math.abs(a.y - d.y)) <= 2 && formation(s, a, d).notes.length) formed++;
    endTurn(s);
  }
  drain();
  assert.ok(s.over);
  const upgrades = s.log.filter((l) => l.text.includes(' upgraded to ')).length;
  console.log(`army: ${upgrades} upgrades, ${links} formation links over the game, ${marked} unit-turns out of supply, ${formed} fights with a formation bonus in reach`);
  assert.ok(upgrades >= 1, 'the computer upgraded at least one unit');
  assert.ok(links >= 1, 'units stood in formation');
  assert.ok(marked >= 1, 'some unit ran out of supply');
  assert.equal(exemptMarked, 0, 'no exempt unit is ever marked');
});

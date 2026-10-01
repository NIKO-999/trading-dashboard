// Unique units: every empire's own unit has ONE signature ability that makes it play differently from the base unit it
// replaces (data/tribes: `unique` / `replaces`; stats in data/units). The abilities live here:
//  - `UNIQUE_ABILITY`: the name and plain rule of each ability, shown in the unit panel and on the empire screens;
//  - `uniqueEdge`: the matchup bonuses the combat formula reads (rules.previewCombat), so every preview is exact;
//  - `UNIQUE_MECH`: a mechanic (see game/mech) run for every empire, with the rest: stat bonuses by terrain, counter-blow
//    changes, splash and trample, a guardian's shielding, regeneration, hiding in forest, the impi's charge.
// Everything is passive: it fires by itself in real play, so the computer players use it through the ordinary moves and
// fights (the AI ranks its attacks with previewCombat, which includes all of it).
import { emit } from './events';
import { dist, isWater, neighbors, tileAt } from './grid';
import { def, maxHp, removeUnit, tileOwnerPlayer } from './rules';
import { hostile } from './diplomacy';
import { isBeast } from './wild';
import { MOUNTED_KINDS } from './perks';
import type { Mechanic } from './mech/types';
import type { GameState, Tile, Unit, UnitKind } from './types';

export interface UniqueAbility { name: string; desc: string }

/** Each unique unit's signature ability. */
export const UNIQUE_ABILITY: Partial<Record<UnitKind, UniqueAbility>> = {
  legionary: { name: 'Testudo', desc: 'Locks shields against missiles, +1 defence against ranged attacks.' },
  chariot: { name: 'Archer chariot', desc: 'Shoots from 2 tiles and can drive on after shooting.' },
  jaguar: { name: 'Jungle pounce', desc: 'Moves freely through forest; a strike from forest takes no counter-blow.' },
  buccaneer: { name: 'Plunder', desc: 'Wades through shallows and loots +2★ from every kill.' },
  waka: { name: 'Ramming prow', desc: 'The fastest boat (carries a unit); rams adjacent ships for +50% damage.' },
  berserker: { name: 'Battle fury', desc: 'Fights at full strength however wounded; its wounds never weaken its blows.' },
  samurai: { name: 'Bushidō', desc: 'Strikes again after every kill.' },
  horsearcher: { name: 'Mounted archer', desc: 'Shoots from 2 tiles and can ride on after shooting.' },
  hoplite: { name: 'Phalanx', desc: 'Its spear wall hits back 50% harder when attacked.' },
  impi: { name: 'Bull horns', desc: 'After attacking it may still run 1 tile to close the horns around the foe.' },
  immortal: { name: 'Undying', desc: 'Heals 3 HP at the start of every turn, wherever it stands.' },
  clansman: { name: 'Oak-grove warband', desc: 'Moves freely through forest and attacks +1 from forest.' },
  harpooner: { name: 'Harpoon', desc: 'Double damage to ships, boats and Great Beasts.' },
  slinger: { name: 'Plunging stones', desc: 'Shoots from 2 tiles; +1 attack when it slings from a mountain.' },
  shotelai: { name: 'Hooked blade', desc: 'Cuts around shields, so the defender gets no terrain, fortify or wall bonus.' },
  woomera: { name: 'Spear-thrower', desc: 'Throws 3 tiles, further than any archer; moves freely through forest.' },
  crossbowman: { name: 'Siege bolts', desc: 'Shoots from 2 tiles; +1 attack against units in a city or fort.' },
  elephant: { name: 'Trample', desc: 'A melee blow carries through, and the enemy behind the target takes half the damage.' },
  sofa: { name: 'Mansa\'s guard', desc: '+2 defence in its own cities.' },
  buffalorider: { name: 'Plains charge', desc: '+1 attack when it charges from open ground (field, desert or tundra).' },
  janissary: { name: 'Musket volley', desc: 'Fires from 2 tiles; +1 attack against melee units.' },
  holcan: { name: 'Jungle ambush', desc: 'Moves freely through forest and is hidden there from enemies not right beside it.' },
  hwacha: { name: 'Rocket volley', desc: 'Fires 3 tiles; every enemy next to the target takes half the damage too.' },
  guardian: { name: 'Temple ward', desc: 'Friendly units next to it take a third less damage, and the guardian takes that share instead.' },
  askari: { name: 'Coast guard', desc: '+1 defence on land beside water.' },
  khampa: { name: 'Highlander', desc: 'Mountains never stop its move; it rides over them like open ground.' },
  sacredband: { name: 'Sacred oath', desc: 'Defends at full strength however wounded.' },
  varangian: { name: 'Emperor\'s guard', desc: 'In or beside one of your cities: +1 defence, and it heals 2 HP at the start of every turn.' },
  camelrider: { name: 'Ship of the desert', desc: 'Horses shy from camels: +1.5 defence against mounted attackers; +1 attack from the desert.' },
  druzhina: { name: 'Winter host', desc: 'Forest never stops it; +1 attack and defence on tundra and ice.' },
  rattan: { name: 'Jungle guerrilla', desc: 'Moves freely through forest and swamp, and attacks +1 from them.' },
  sabum: { name: 'Royal levy', desc: '+1 attack against mounted units.' },
  pitati: { name: 'Eye-shooter', desc: '+1 attack against wounded units.' },
  kris: { name: 'Island raider', desc: 'Wades through shallows; +1 attack from a tile beside water.' },
  conquistador: { name: 'Conquest', desc: '+1 attack against units in a city or fort.' },
  mohawk: { name: 'Great Law', desc: 'Forest never stops it, and it heals 2 HP at the start of every turn inside your borders.' },
};

/** Tunables. */
export const IMMORTAL_HEAL = 3;
export const HOPLITE_COUNTER = 1.5;
export const HARPOON = 2;
export const RAM = 1.5;
export const SPLASH = 0.5; // share of the damage that splashes (hwacha) or tramples through (elephant)
export const WARD = 1 / 3; // share of an adjacent friend's damage a temple guardian takes on
export const VARANGIAN_HEAL = 2;
export const CAMEL_SHY = 1.5;
export const MOHAWK_HEAL = 2;

const OPEN = ['field', 'desert', 'tundra'];
const tileOf = (s: GameState, u: Unit) => tileAt(s, u.x, u.y)!;
const inForest = (s: GameState, u: Unit) => tileOf(s, u).terrain === 'forest';
const coastal = (s: GameState, t: Tile) => !isWater(t) && neighbors(s, t.x, t.y).some(isWater);
const ownCity = (s: GameState, u: Unit) => { const t = tileOf(s, u); return t.cityId !== null && s.cities.some((c) => c.id === t.cityId && c.owner === u.owner); };
/** A unit on a city tile or behind a fort (Roman Castra, Sappers' forts) or a wall. */
const fortified = (s: GameState, u: Unit) => { const t = tileOf(s, u); return t.cityId !== null || t.improvement === 'fort' || t.improvement === 'wall'; };
/** In or right beside one of its owner's cities. */
const byOwnCity = (s: GameState, u: Unit) => s.cities.some((c) => c.owner === u.owner && dist(c.x, c.y, u.x, u.y) <= 1);
const isMounted = (u: Unit) => MOUNTED_KINDS.includes(u.carrying ?? u.kind);
const isMelee = (u: Unit) => { const d = def(u); return d.range === 1 && !d.naval && d.atk > 0; };

/**
 * The matchup bonuses of one fight, read by the combat formula (rules.previewCombat): extra attack and defence that
 * depend on the opponent, `fury` (the attacker's wounds do not weaken it) and `pierce` (the defender's terrain, fortify
 * and wall bonus is ignored).
 */
export function uniqueEdge(s: GameState, a: Unit, d: Unit) {
  const ranged = dist(a.x, a.y, d.x, d.y) > 1;
  let atk = 0, dd = 0;
  if (d.kind === 'legionary' && ranged) dd += 1; // testudo
  if (a.kind === 'crossbowman' && fortified(s, d)) atk += 1;
  if (a.kind === 'janissary' && isMelee(d)) atk += 1;
  if (d.kind === 'camelrider' && isMounted(a)) dd += CAMEL_SHY; // horses shy from camels
  if (a.kind === 'sabum' && isMounted(d)) atk += 1;
  if (a.kind === 'pitati' && d.hp < maxHp(d)) atk += 1;
  if (a.kind === 'conquistador' && fortified(s, d)) atk += 1;
  return { atk, def: dd, fury: a.kind === 'berserker', pierce: a.kind === 'shotelai', steadfast: d.kind === 'sacredband' };
}

// ---------------------------------------------------------------- the temple guardian's ward and the elephant's trample

/** A friendly temple guardian beside `d` that can take on part of its damage (never the guardian itself). */
export function wardOf(s: GameState, d: Unit): Unit | undefined {
  if (d.kind === 'guardian' || def(d).naval) return undefined;
  return s.units.filter((g) => g.kind === 'guardian' && g.owner === d.owner && g !== d && dist(g.x, g.y, d.x, d.y) === 1 && g.hp > 1)
    .sort((x, y) => y.hp - x.hp || x.id - y.id)[0];
}

/**
 * What the last preview of each fight worked out, so the fight itself can finish the job once the blow has landed:
 * where the attacker stood (a trampling elephant may have stepped forward since) and what the guardian took on.
 * Keyed by `attacker:defender`; every preview rewrites it, so it is only read back for the fight just previewed; it
 * holds nothing that is saved and is emptied every turn.
 */
const lastFight = new Map<string, { ax?: number; ay?: number; guard?: number; share?: number }>();

/** Deal `amount` to an enemy of `a` standing at (x, y), if any: splash and trample. It can kill. */
function strike(s: GameState, a: Unit, x: number, y: number, amount: number, tag: string) {
  const e = s.units.find((u) => u.x === x && u.y === y);
  if (!e || e === a || !hostile(s, a.owner, e.owner) || amount <= 0) return;
  e.hp -= amount;
  emit({ type: 'damage', unitId: e.id, x: e.x, y: e.y, amount, crit: tag });
  if (e.hp > 0) return;
  removeUnit(s, e, a);
  emit({ type: 'death', unitId: e.id, x: e.x, y: e.y, owner: e.owner, kind: e.kind });
  s.players[a.owner].kills++;
  a.veteranKills++;
}

/** Hwacha rocket volley: every enemy next to (x, y) takes half of `dmg`. Called after a normal shot and a Korean salvo. */
export function rocketSplash(s: GameState, a: Unit, x: number, y: number, dmg: number) {
  const n = Math.round(dmg * SPLASH);
  if (n <= 0) return;
  for (const t of neighbors(s, x, y)) strike(s, a, t.x, t.y, n, 'Volley');
}

// ---------------------------------------------------------------- the mechanic

/** The impi may still run this far after attacking. */
export const HORNS_TILES = 1;
const charging = (s: GameState, u: Unit) => u.kind === 'impi' && u.data?.horns === s.turn && u.attacked;

export const UNIQUE_MECH: Mechanic = {
  name: 'Unique units',
  blurb: 'Every empire\'s own unit has a signature ability.',

  stat(s, owner, u, stat) {
    if (u.owner !== owner) return 0;
    switch (u.kind) {
      case 'clansman': return stat === 'atk' && inForest(s, u) ? 1 : 0;
      case 'slinger': return stat === 'atk' && tileOf(s, u).terrain === 'mountain' ? 1 : 0;
      case 'buffalorider': return stat === 'atk' && OPEN.includes(tileOf(s, u).terrain) ? 1 : 0;
      case 'sofa': return stat === 'def' && ownCity(s, u) ? 2 : 0;
      case 'askari': return stat === 'def' && coastal(s, tileOf(s, u)) ? 1 : 0;
      case 'varangian': return stat === 'def' && byOwnCity(s, u) ? 1 : 0;
      case 'camelrider': return stat === 'atk' && tileOf(s, u).terrain === 'desert' ? 1 : 0;
      case 'druzhina': return (stat === 'atk' || stat === 'def') && ['tundra', 'ice'].includes(tileOf(s, u).terrain) ? 1 : 0;
      case 'rattan': return stat === 'atk' && ['forest', 'swamp'].includes(tileOf(s, u).terrain) ? 1 : 0;
      case 'kris': return stat === 'atk' && coastal(s, tileOf(s, u)) ? 1 : 0;
      default: return 0;
    }
  },

  combat(s, owner, a, d, ctx) {
    if (a.owner === owner) {
      lastFight.set(`${a.id}:${d.id}`, { ...lastFight.get(`${a.id}:${d.id}`), ax: a.x, ay: a.y });
      if (a.kind === 'jaguar' && inForest(s, a)) { ctx.ret = 0; ctx.tag = 'Pounce!'; }
      if (a.kind === 'harpooner' && (def(d).naval || isBeast(s, d))) { ctx.dmg *= HARPOON; ctx.tag = 'Harpoon!'; }
      if (a.kind === 'waka' && def(d).naval && !ctx.ranged) { ctx.dmg *= RAM; ctx.tag = 'Ram!'; }
    }
    if (d.owner === owner) {
      if (d.kind === 'hoplite') ctx.ret *= HOPLITE_COUNTER; // phalanx
      const g = wardOf(s, d);
      const share = g ? Math.max(0, Math.min(Math.round(ctx.dmg * WARD), g.hp - 1)) : 0;
      ctx.dmg -= share;
      lastFight.set(`${a.id}:${d.id}`, { ...lastFight.get(`${a.id}:${d.id}`), guard: share ? g!.id : undefined, share });
    }
  },

  afterAttack(s, owner, a, d, info) {
    const f = lastFight.get(`${a.id}:${d.id}`);
    // the guardian takes the share it kept off its neighbour (once: the entry is spent)
    if (d.owner === owner && f?.guard !== undefined && f.share) {
      const g = s.units.find((u) => u.id === f.guard);
      const share = f.share;
      f.share = 0;
      if (g) {
        const n = Math.min(share, g.hp - 1);
        g.hp -= n;
        emit({ type: 'damage', unitId: g.id, x: g.x, y: g.y, amount: n, crit: 'Ward' });
      }
    }
    if (a.owner !== owner || !s.units.includes(a)) return;
    if (a.kind === 'hwacha' && info.ranged) rocketSplash(s, a, d.x, d.y, info.dmg);
    if (a.kind === 'elephant' && !info.ranged && f?.ax !== undefined && f.ay !== undefined) { // trample: the blow carries on through the target
      const bx = d.x + Math.sign(d.x - f.ax), by = d.y + Math.sign(d.y - f.ay);
      strike(s, a, bx, by, Math.round(info.dmg * SPLASH), 'Trample');
    }
    if (a.kind === 'impi' && a.attacked) { // bull horns: run on to close the V
      (a.data ??= {}).horns = s.turn;
      a.moved = false;
    }
  },

  moveStep(s, owner, u, _from, to, ctx) {
    if (u.owner !== owner) return;
    if (charging(s, u) && dist(u.x, u.y, to.x, to.y) > HORNS_TILES) ctx.forbid = true;
    // the khampa rides over the peaks without stopping (an enemy beside the peak still stops it)
    if (u.kind === 'khampa' && to.terrain === 'mountain' && !s.units.some((e) => hostile(s, owner, e.owner) && dist(e.x, e.y, to.x, to.y) === 1)) ctx.stop = false;
    // the rattan guard slips through the swamp as through the forest
    if (u.kind === 'rattan' && to.terrain === 'swamp' && !s.units.some((e) => hostile(s, owner, e.owner) && dist(e.x, e.y, to.x, to.y) === 1)) ctx.stop = false;
  },

  turnStart(s, owner) {
    lastFight.clear(); // a fight's preview never outlives the turn it was made in
    for (const u of s.units) {
      if (u.owner !== owner) continue;
      if (u.data?.horns !== undefined) delete u.data.horns;
      if (u.kind === 'immortal' && u.hp < maxHp(u)) { // undying
        const before = u.hp;
        u.hp = Math.min(maxHp(u), u.hp + IMMORTAL_HEAL);
        emit({ type: 'heal', unitId: u.id, x: u.x, y: u.y, amount: u.hp - before });
      }
      if (u.kind === 'mohawk' && u.hp < maxHp(u) && tileOwnerPlayer(s, tileOf(s, u)) === owner) { // the great law
        const before = u.hp;
        u.hp = Math.min(maxHp(u), u.hp + MOHAWK_HEAL);
        emit({ type: 'heal', unitId: u.id, x: u.x, y: u.y, amount: u.hp - before });
      }
      if (u.kind === 'varangian' && u.hp < maxHp(u) && byOwnCity(s, u)) { // the emperor's guard
        const before = u.hp;
        u.hp = Math.min(maxHp(u), u.hp + VARANGIAN_HEAL);
        emit({ type: 'heal', unitId: u.id, x: u.x, y: u.y, amount: u.hp - before });
      }
    }
  },

  // the holcan hides in the jungle: only an enemy right beside it (a unit or a city) sees it there
  unitVisible(s, owner, viewer, u) {
    if (u.owner !== owner || u.kind !== 'holcan' || !inForest(s, u)) return undefined;
    const near = (x: number, y: number) => dist(x, y, u.x, u.y) <= 1;
    return s.units.some((e) => e.owner === viewer && near(e.x, e.y)) || s.cities.some((c) => c.owner === viewer && near(c.x, c.y));
  },
};

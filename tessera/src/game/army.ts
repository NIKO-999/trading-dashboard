// Three army mechanics shared by every empire:
//
//  - Formations: units of one line standing side by side (the eight tiles around) help each other.
//      Shield wall: a shield unit (fortify, defence 3+, on foot: Defender, Hoplite, Temple Guardian, Legionary...)
//        defends +SHIELD_STEP for each friendly shield unit beside it, up to +SHIELD_MAX.
//      Volley: a ranged unit (range 2+, not siege, not afloat) attacks +VOLLEY when a friendly ranged unit is beside it.
//      Charge: a mounted unit attacks +CHARGE when another friendly mounted unit stands beside its target.
//    The bonus is added to the attack or defence stat in `previewCombat` (rules), so the attack preview shows it.
//  - Upgrades in cities: a land unit standing on one of its empire's cities may pay the difference in training cost
//    plus UPGRADE_FEE to become the next unit of its line (UPGRADE_LINE, mapped through each empire's unique
//    replacements with `unitFor`). It keeps its veteran rank and its share of health, and it uses the unit's turn.
//    Boats keep their own path (NAVAL_UPGRADE in data/units).
//  - Supply: at the start of its turn a land unit more than SUPPLY_RANGE tiles from its empire's borders, and not on or
//    beside a road, one of its empire's forts (a Sappers' fort or a Roman castra) or an ally's land, is out of supply
//    (`unit.data.oos`): it loses 1 HP (never below 1) and cannot heal until it is back in supply. Heroes and boats are
//    exempt, as are Pirates on the water and their platforms, and the peoples who lived off the land (LIVES_OFF_LAND).
//
// All state is the `oos` flag on a unit's `data` (JSON-safe; older saves simply have none).
import { categoryOf, TRIBES, unitFor } from '../data/tribes';
import { isTraderKind } from './trade';
import { UNITS } from '../data/units';
import { allies } from './diplomacy';
import { emit } from './events';
import { area, isWater, tileAt } from './grid';
import { MOUNTED_KINDS, unitMatches } from './perks';
import { citiesOf, def, doAction, tileActions, tileOwnerPlayer, trainCost } from './rules';
import type { GameState, TribeId, Unit, UnitKind } from './types';

// ---------------------------------------------------------------- formations

export const SHIELD_STEP = 0.5;
export const SHIELD_MAX = 1;
export const VOLLEY = 0.5;
export const CHARGE = 0.5;

/**
 * Doctrines: what standing in formation adds, by empire type (and Rome's own), on top of the line's bonus.
 *  - Military, Drilled Ranks: a unit in formation also attacks +DRILLED.
 *  - Economy, Hometown Guard: a unit in formation on its own land also defends +HOMETOWN.
 *  - Naval, Line of Battle: warships form a 'fleet' line of their own (two side by side: +FLEET attack and defence).
 *  - Rome, Testudo: a Roman shield wall rises to +TESTUDO_MAX, and holds +TESTUDO_RANGED more against arrows and stones.
 */
export const DRILLED = 0.5;
export const HOMETOWN = 0.5;
export const FLEET = 0.5;
export const TESTUDO_MAX = 1.5;
export const TESTUDO_RANGED = 1;

export type FormationKind = 'shield' | 'volley' | 'charge' | 'fleet';

/** A shield unit: holds the line on foot behind a big shield (fortify, defence 3 or more, melee, not mounted). */
export function isShieldKind(k: UnitKind): boolean {
  const d = UNITS[k];
  return !d.naval && d.range === 1 && d.def >= 3 && d.skills.includes('fortify') && !MOUNTED_KINDS.includes(k) && k !== 'hero' && k !== 'giant';
}
const isRanged = (s: GameState, u: Unit) => !def(u).naval && unitMatches(s.players[u.owner].tribe, u.kind, 'ranged');
const isMounted = (u: Unit) => MOUNTED_KINDS.includes(u.kind);
/** Which formation line a unit stands in, if any. */
export function formationOf(s: GameState, u: Unit): FormationKind | null {
  if (s.players[u.owner]?.neutral || u.carrying) return null;
  if (def(u).naval) return categoryOf(s.players[u.owner].tribe).id === 'naval' && def(u).atk > 0 && !isTraderKind(u.kind) ? 'fleet' : null; // Line of Battle
  if (isShieldKind(u.kind)) return 'shield';
  if (isMounted(u)) return 'charge';
  if (isRanged(s, u)) return 'volley';
  return null;
}
const beside = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) === 1;
/** Friendly units of the same formation line on the eight tiles around (x, y), `u` itself left out. */
const mates = (s: GameState, u: Unit, kind: FormationKind, x: number, y: number) =>
  s.units.filter((o) => o !== u && o.owner === u.owner && beside(o, { x, y }) && formationOf(s, o) === kind);

/** The shield wall's defence bonus for `u` where it stands. */
export function shieldWall(s: GameState, u: Unit): number {
  if (formationOf(s, u) !== 'shield') return 0;
  const max = s.players[u.owner].tribe === 'rome' ? TESTUDO_MAX : SHIELD_MAX; // Testudo
  return Math.min(max, SHIELD_STEP * mates(s, u, 'shield', u.x, u.y).length);
}

/** Is `u` standing in formation: beside a friendly unit of its own line? */
export const inFormation = (s: GameState, u: Unit) => { const k = formationOf(s, u); return !!k && mates(s, u, k, u.x, u.y).length > 0; };
const doctrine = (s: GameState, u: Unit) => categoryOf(s.players[u.owner].tribe).id;

/** What the unit's empire gains from standing in formation, in words (the unit panel). */
export function doctrineLine(s: GameState, u: Unit): string {
  const k = formationOf(s, u);
  if (k === 'fleet') return `⚓ Line of Battle: +${FLEET} attack and defence`;
  const rome = s.players[u.owner].tribe === 'rome' && k === 'shield' ? ` · Testudo: walls up to +${TESTUDO_MAX}, +${TESTUDO_RANGED} vs missiles` : '';
  switch (doctrine(s, u)) {
    case 'military': return `⚔️ Drilled Ranks: +${DRILLED} attack${rome}`;
    case 'economy': return `💰 Hometown Guard: +${HOMETOWN} defence on your land${rome}`;
    default: return `In formation${rome}`;
  }
}

/** The formation bonuses of one attack: `atk` for the attacker (volley, charge), `def` for the defender (shield wall). */
export function formation(s: GameState, a: Unit, d: Unit): { atk: number; def: number; notes: string[] } {
  const notes: string[] = [];
  let atk = 0;
  const line = formationOf(s, a);
  if (line === 'volley' && mates(s, a, 'volley', a.x, a.y).length) { atk += VOLLEY; notes.push(`Volley +${VOLLEY}`); }
  if (line === 'charge' && mates(s, a, 'charge', d.x, d.y).length) { atk += CHARGE; notes.push(`Charge +${CHARGE}`); }
  if (line === 'fleet' && mates(s, a, 'fleet', a.x, a.y).length) { atk += FLEET; notes.push(`Line of Battle +${FLEET}`); }
  if (doctrine(s, a) === 'military' && inFormation(s, a)) { atk += DRILLED; notes.push(`Drilled Ranks +${DRILLED}`); }
  let df = shieldWall(s, d);
  if (df) notes.push(`${s.players[d.owner].tribe === 'rome' ? 'Testudo' : 'Shield wall'} +${df} def`);
  if (df && s.players[d.owner].tribe === 'rome' && Math.max(Math.abs(a.x - d.x), Math.abs(a.y - d.y)) > 1) { df += TESTUDO_RANGED; notes.push(`Testudo vs missiles +${TESTUDO_RANGED} def`); }
  if (formationOf(s, d) === 'fleet' && mates(s, d, 'fleet', d.x, d.y).length) { df += FLEET; notes.push(`Line of Battle +${FLEET} def`); }
  if (doctrine(s, d) === 'economy' && inFormation(s, d) && tileOwnerPlayer(s, tileAt(s, d.x, d.y)!) === d.owner) { df += HOMETOWN; notes.push(`Hometown Guard +${HOMETOWN} def`); }
  return { atk, def: df, notes };
}

/** Pairs of friendly units standing in formation, for the map (each pair once). */
export function formationLinks(s: GameState): { a: Unit; b: Unit; kind: FormationKind }[] {
  const out: { a: Unit; b: Unit; kind: FormationKind }[] = [];
  const lined = s.units.map((u) => ({ u, k: formationOf(s, u) })).filter((x) => x.k);
  for (let i = 0; i < lined.length; i++)
    for (let j = i + 1; j < lined.length; j++) {
      const A = lined[i], B = lined[j];
      if (A.k === B.k && A.u.owner === B.u.owner && beside(A.u, B.u)) out.push({ a: A.u, b: B.u, kind: A.k! });
    }
  return out;
}

// ---------------------------------------------------------------- upgrades

/**
 * The next unit of each line, by the standard kinds. An empire's unique unit stands in for the kind it replaces at both
 * ends (a Legionary upgrades like a Warrior; a Viking Warrior becomes a Berserker). A line with no stronger unit yet has
 * no entry: the archers (the Catapult is a siege engine, not a stronger bow). New units slot in by adding an entry.
 */
export const UPGRADE_LINE: Partial<Record<UnitKind, UnitKind>> = {
  warrior: 'swordsman',
  rider: 'knight',
};
/** Stars paid on top of the difference in training cost. */
export const UPGRADE_FEE = 1;

/** The standard kind a unit counts as for its line: itself, or the kind an empire's unique unit replaces. */
export function lineBase(k: UnitKind): UnitKind {
  if (UPGRADE_LINE[k]) return k;
  for (const id of Object.keys(TRIBES) as TribeId[]) if (TRIBES[id].unique === k) return TRIBES[id].replaces;
  return k;
}

/** What `u` would become if upgraded by its owner, or null (heroes, boats, role units and the top of a line). */
export function upgradeTarget(s: GameState, u: Unit): UnitKind | null {
  if (u.carrying || def(u).naval || s.players[u.owner]?.neutral) return null;
  const next = UPGRADE_LINE[lineBase(u.kind)];
  if (!next) return null;
  const to = unitFor(s.players[u.owner].tribe, next);
  return to !== u.kind && UNITS[to].trainable ? to : null;
}

/** The price of an upgrade: the difference in what the two cost this empire to train, plus UPGRADE_FEE. */
export const upgradeCost = (s: GameState, pid: number, from: UnitKind, to: UnitKind) =>
  Math.max(0, trainCost(s, pid, to) - trainCost(s, pid, from)) + UPGRADE_FEE;

/** Why `u` can't be upgraded where it stands right now (the tech and the Stars are checked by the tile menu). */
export function upgradeWhy(s: GameState, u: Unit): string | undefined {
  const t = tileAt(s, u.x, u.y)!;
  if (t.cityId === null || tileOwnerPlayer(s, t) !== u.owner) return 'Only in one of your cities';
  if (u.moved || u.attacked) return 'Unit has already acted';
  return undefined;
}

/** The AI keeps this many Stars in hand after an upgrade: it only upgrades when rich. */
export const AI_UPGRADE_RESERVE = 10;

/** One AI upgrade: a unit waiting in one of its cities, when the treasury has plenty to spare. */
export function armyAi(s: GameState, pid: number): boolean {
  const p = s.players[pid];
  if (p.stars < AI_UPGRADE_RESERVE + 2) return false;
  const cities = new Set(citiesOf(s, pid).map((c) => c.id));
  for (const u of s.units) {
    if (u.owner !== pid || u.moved || u.attacked || !upgradeTarget(s, u)) continue;
    const t = tileAt(s, u.x, u.y)!;
    if (t.cityId === null || !cities.has(t.cityId)) continue;
    const a = tileActions(s, pid, t).find((x) => x.id.startsWith('upgrade:') && x.enabled);
    if (a && p.stars >= a.cost + AI_UPGRADE_RESERVE) return doAction(s, pid, t, a.id);
  }
  return false;
}

// ---------------------------------------------------------------- supply

/** How far from its empire's borders a land unit stays in supply. */
export const SUPPLY_RANGE = 3;
/** Peoples who lived off the land: their units are never out of supply. */
export const LIVES_OFF_LAND: TribeId[] = ['mongols', 'lakota', 'aboriginal'];
/** The line shown in these peoples' empire notes (and the Pirates', whose fleets carry their own stores). */
export const SUPPLY_NOTES: Partial<Record<TribeId, string>> = {
  mongols: 'Their riders live off the steppe and their herds: Mongol units are never out of supply.',
  lakota: 'The people follow the buffalo: Lakota units are never out of supply.',
  aboriginal: 'They know the Country and live off it: Aboriginal units are never out of supply.',
  pirates: 'Their fleets carry their own stores: Pirate units on the water or their platforms are never out of supply.',
};

/** Units that never need supply: heroes, boats and ships, the wild, the peoples who lived off the land, Pirates afloat. */
export function supplyExempt(s: GameState, u: Unit): boolean {
  const p = s.players[u.owner];
  if (!p || p.neutral || u.kind === 'hero' || u.carrying === 'hero' || u.kind === 'immortal' /* the Undying need no supply */ || def(u).naval) return true;
  if (LIVES_OFF_LAND.includes(p.tribe)) return true;
  const t = tileAt(s, u.x, u.y);
  return p.tribe === 'pirates' && !!t && (isWater(t) || t.terrain === 'platform');
}

/** Is (x, y) in supply for `pid`: within SUPPLY_RANGE of its land, or on or beside a road, its fort or an ally's land? */
export function suppliedAt(s: GameState, pid: number, x: number, y: number): boolean {
  for (const t of area(s, x, y, SUPPLY_RANGE)) if (t.owner !== null && tileOwnerPlayer(s, t) === pid) return true;
  const friends = allies(s, pid);
  for (const t of area(s, x, y, 1)) {
    if (t.road || t.terrain === 'bridge') return true;
    if (t.improvement === 'fort' && (t.data?.sfort === pid || t.data?.castra === pid)) return true;
    const o = t.owner === null ? null : tileOwnerPlayer(s, t);
    if (o !== null && friends.includes(o)) return true;
  }
  return false;
}

/** Does `u` need supply where it stands and lack it? (The live check; `outOfSupply` is the flag set at turn start.) */
export const lacksSupply = (s: GameState, u: Unit) => !supplyExempt(s, u) && !suppliedAt(s, u.owner, u.x, u.y);
/** Was `u` out of supply at the start of its turn (and not back in supply since)? It loses health and cannot heal. */
export const outOfSupply = (u: Unit) => !!u.data?.oos;

function setOos(u: Unit, on: boolean) {
  if (on) u.data = { ...(u.data ?? {}), oos: true };
  else if (u.data?.oos) {
    const { oos: _, ...rest } = u.data;
    u.data = Object.keys(rest).length ? rest : undefined;
  }
}

/** At the start of `pid`'s turn: mark its units out of supply, and each loses 1 HP (never below 1). */
export function supplyTurnStart(s: GameState, pid: number) {
  let n = 0;
  for (const u of s.units) {
    if (u.owner !== pid) continue;
    const out = lacksSupply(s, u);
    setOos(u, out);
    if (!out) continue;
    n++;
    if (u.hp > 1) {
      u.hp -= 1;
      emit({ type: 'damage', unitId: u.id, x: u.x, y: u.y, amount: 1 });
    }
  }
  if (n) emit({ type: 'toast', player: pid, text: `${n === 1 ? 'A unit is' : `${n} units are`} out of supply: −1 HP a turn and no healing until within ${SUPPLY_RANGE} tiles of your borders, or beside a road, fort or ally.` });
}

/** After a move: a unit back in supply loses its mark at once (it is only ever set at the start of a turn). */
export function supplyAfterMove(s: GameState, u: Unit) {
  if (outOfSupply(u) && !lacksSupply(s, u)) setOos(u, false);
}

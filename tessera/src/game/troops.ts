// Roles and trios: why pick one unit over another.
//  - COUNTERS: what each specialist is good (and bad) at, added to an attack in previewCombat (rules):
//      Axeman +1.5 attack against shield units; Lancer +1 against ranged units and siege engines; Pikeman doubles its
//      defence against mounted attackers; Ranger +1 attack and defence in forest; Cataphract −1 defence in forest or
//      swamp; Battering Ram triples its attack against a unit in a city; Cannon +50% against a unit in a city;
//      Musketeer shots ignore the defender's terrain and wall bonus.
//  - TRIOS: three of a kind standing together. A unit with two or more friendly units of the same family (an empire's
//    unique counts as the unit it replaces) on the eight tiles around it fights in its family's own formation (TRIOS).
//    Trios stack with the line formations (shield wall, volley, charge; see game/army).
import { TRIBES } from '../data/tribes';
import { UNITS } from '../data/units';
import { isShieldKind } from './army';
import { MOUNTED_KINDS } from './perks';
import { cityById } from './rules';
import type { GameState, TribeId, Unit, UnitKind } from './types';

export interface Trio { name: string; atk?: number; def?: number; note: string; vsMounted?: boolean; fromForest?: boolean }
export const TRIOS: Partial<Record<UnitKind, Trio>> = {
  warrior: { name: 'Warband', atk: 1, note: '+1 attack' },
  swordsman: { name: 'Blade Wall', def: 1, note: '+1 defence' },
  defender: { name: 'Iron Wall', def: 1, note: '+1 defence' },
  spearman: { name: 'Spear Hedge', def: 1, note: '+1 defence' },
  pikeman: { name: 'Hedgehog', def: 1.5, vsMounted: true, note: '+1.5 defence against cavalry' },
  axeman: { name: 'Shield-Breakers', atk: 1, note: '+1 attack' },
  archer: { name: 'Arrow Storm', atk: 1, note: '+1 attack' },
  javelineer: { name: 'Skirmish Screen', atk: 0.5, def: 0.5, note: '+0.5 attack and defence' },
  ranger: { name: 'Ambush', atk: 1.5, fromForest: true, note: '+1.5 attack striking from forest' },
  musketeer: { name: 'Volley Fire', atk: 1.5, note: '+1.5 attack' },
  rider: { name: 'Raiding Party', atk: 1, note: '+1 attack' },
  lancer: { name: 'Wedge', atk: 1, note: '+1 attack' },
  horsebow: { name: 'Parthian Circle', atk: 1, note: '+1 attack' },
  knight: { name: 'Lance Charge', atk: 1, note: '+1 attack' },
  cataphract: { name: 'Iron Avalanche', atk: 0.5, def: 0.5, note: '+0.5 attack and defence' },
  catapult: { name: 'Grand Battery', atk: 1, note: '+1 attack' },
  ballista: { name: 'Grand Battery', atk: 1, note: '+1 attack' },
  cannon: { name: 'Grand Battery', atk: 1, note: '+1 attack' },
  ram: { name: 'Siege Train', def: 1, note: '+1 defence' },
  ship: { name: 'Squadron', def: 1, note: '+1 defence' },
  warship: { name: 'Battle Fleet', atk: 1, note: '+1 attack' },
};

/** The family a unit fights in: its own kind, or the kind an empire's unique replaces (a Legionary is a Warrior). */
export function family(k: UnitKind): UnitKind {
  if (TRIOS[k]) return k;
  for (const id of Object.keys(TRIBES) as TribeId[]) if (TRIBES[id].unique === k) return TRIBES[id].replaces;
  return k;
}
const SIEGE: UnitKind[] = ['catapult', 'hwacha', 'ballista', 'cannon', 'ram'];
const famOf = (u: Unit) => family(u.carrying ?? u.kind);
const beside = (a: Unit, b: { x: number; y: number }) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) === 1;
const terrain = (s: GameState, u: Unit) => s.tiles[u.y * s.size + u.x]?.terrain;

/** The trio `u` stands in, if two or more friendly units of its family are beside it. */
export function trioOf(s: GameState, u: Unit): Trio | null {
  const p = s.players[u.owner];
  if (!p || p.neutral) return null;
  const f = famOf(u);
  const t = TRIOS[f];
  if (!t) return null;
  const mates = s.units.filter((o) => o !== u && o.owner === u.owner && beside(o, u) && famOf(o) === f).length;
  return mates >= 2 ? t : null;
}

const mounted = (u: Unit) => MOUNTED_KINDS.includes(u.carrying ?? u.kind);
const ranged = (u: Unit) => { const d = UNITS[u.carrying ?? u.kind]; return !d.naval && d.range > 1; };
const inCity = (s: GameState, u: Unit) => { const t = s.tiles[u.y * s.size + u.x]; return !!t && t.cityId !== null && cityById(s, t.cityId)?.owner === u.owner; };

/** The roles and trios in one attack: extra attack for `a`, extra defence for `d`, and whether `a`'s shot pierces. */
export function troopEdge(s: GameState, a: Unit, d: Unit, baseAtk: number, baseDef: number): { atk: number; def: number; pierce: boolean; notes: string[] } {
  const notes: string[] = [];
  let atk = 0, def = 0, pierce = false;
  const ak = a.carrying ?? a.kind, dk = d.carrying ?? d.kind;
  // the attacker's role
  if (ak === 'axeman' && isShieldKind(dk)) { atk += 1.5; notes.push('Shield-breaker +1.5'); }
  if (ak === 'lancer' && (ranged(d) || SIEGE.includes(dk))) { atk += 1; notes.push('Lancer vs archers +1'); }
  if (ak === 'ram' && inCity(s, d)) { atk += baseAtk * 2; notes.push('Battering Ram ×3 vs city'); }
  if (ak === 'cannon' && inCity(s, d)) { atk += baseAtk * 0.5; notes.push('Cannon +50% vs city'); }
  if (ak === 'ranger' && terrain(s, a) === 'forest') { atk += 1; notes.push('Ranger in forest +1'); }
  if (ak === 'musketeer') { pierce = true; notes.push('Musket ignores cover'); }
  // the defender's role
  if (dk === 'pikeman' && mounted(a)) { def += baseDef; notes.push('Pikes vs cavalry ×2 def'); }
  if (dk === 'ranger' && terrain(s, d) === 'forest') { def += 1; notes.push('Ranger in forest +1 def'); }
  if (dk === 'cataphract' && (terrain(s, d) === 'forest' || terrain(s, d) === 'swamp')) { def -= 1; notes.push('Cataphract bogged down −1 def'); }
  // trios
  const ta = trioOf(s, a);
  if (ta?.atk && (!ta.fromForest || terrain(s, a) === 'forest')) { atk += ta.atk; notes.push(`${ta.name} +${ta.atk}`); }
  const td = trioOf(s, d);
  if (td?.def && (!td.vsMounted || mounted(a))) { def += td.def; notes.push(`${td.name} +${td.def} def`); }
  return { atk, def, pierce, notes };
}

/** For the unit panel: its role and its trio, in words. */
export function roleLine(s: GameState, u: Unit): string | null {
  const t = TRIOS[famOf(u)];
  if (!t) return null;
  const on = trioOf(s, u);
  return `${on ? '✦' : '◇'} Trio — ${t.name}: ${t.note} ${on ? '(in formation now)' : '(3 side by side)'}`;
}

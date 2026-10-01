import { UNITS } from '../../data/units';
import { unitFor } from '../../data/tribes';
import { hostile } from '../diplomacy';
import { emit } from '../events';
import { dist, isLand, neighbors, tileAt } from '../grid';
import { spawnUnit } from '../mapgen';
import { citiesOf, eraWhy, hasTech, maxHp, tileOwnerPlayer, unitAt } from '../rules';
import type { Action } from '../rules';
import type { City, GameState, Tile, Unit, UnitKind } from '../types';
import type { Mechanic } from './types';

// Hanseatic League (empire bonus) + the Imperial Diet & Free Cities (core).
//
// Hanseatic League: every market inside German borders pays +HANSE_STARS★ a turn, and +HANSE_PORT★ more when a port
// lies on one of the eight tiles around it (the `income` hook).
//
// Free Imperial Cities: every German city other than the capital with at least one market in its land pays
// +FREE_CITY_STARS★ a turn more (a free city's tolls). It is counted per city, not per market, so it stays a small top-up
// to the Hanse: a non-capital city with one market beside a port pays 1 + 1 + 1 = 3★ from the two, a second market there
// only adds the Hanse's part.
//
// Prince-electors: every German city of level ELECTOR_LEVEL (4) or more is an Elector. While Germany holds at least
// DIET_ELECTORS (3) of them, the capital (else the oldest city) may call an Imperial Diet: the free tile actions
// `mech:diet:<n>`, then none for DIET_COOLDOWN (10) turns. The Diet resolves one of:
//  0 Imperial Levy: a free veteran of Germany's best melee kind it may field (Landsknecht, Knight, Rider or Warrior, by
//    attack; the tech and era are needed but no Iron or Horses) appears on the capital, or beside it when the capital
//    tile is taken. It is raised by the Empire, not by a city: it has no home city and takes no unit slot (like the free
//    spawns of other mechanics, e.g. Carthage's mercenaries), and costs no upkeep.
//  1 Reichstag Tax: +REICH_TAX★ per Elector, once.
//  2 Landfrieden: for LF_TURNS of Germany's turns, its wounded units standing inside German borders heal LF_HEAL more HP
//    at the start of each turn (the `turnStart` hook).

export const HANSE_STARS = 1;
export const HANSE_PORT = 1;
export const FREE_CITY_STARS = 1;
export const ELECTOR_LEVEL = 4;
export const DIET_ELECTORS = 3;
export const DIET_COOLDOWN = 10;
export const REICH_TAX = 2;
export const LF_TURNS = 5;
export const LF_HEAL = 2;
/** The levy's candidate kinds (Germany's own unique stands in for the swordsman). */
export const LEVY_BASES: UnitKind[] = ['swordsman', 'knight', 'rider', 'warrior'];

export type Edict = 0 | 1 | 2;
export const EDICTS: { name: string; icon: string; desc: string }[] = [
  { name: 'Imperial Levy', icon: 'swordsman', desc: 'A free veteran of your best melee kind musters at the capital (no unit slot).' },
  { name: 'Reichstag Tax', icon: 'market', desc: `+${REICH_TAX}★ per Elector, once.` },
  { name: 'Landfrieden', icon: 'heal', desc: `For ${LF_TURNS} turns your units inside your borders heal ${LF_HEAL} HP more a turn.` },
];

interface GermanyState { diet?: number; edict?: Edict; peaceUntil?: number; diets?: number; levied?: number; taxed?: number }

const isGermany = (s: GameState, pid: number) => s.players[pid]?.tribe === 'germany';
const st = (s: GameState, pid: number) => (s.players[pid].mech ?? {}) as GermanyState;
const put = (s: GameState, pid: number, patch: Partial<GermanyState>) => {
  const p = s.players[pid];
  p.mech = { ...(p.mech ?? {}), ...patch };
};

// ---------------------------------------------------------------- the Hanse and the free cities

/** Markets inside `owner`'s borders. */
export const marketsOf = (s: GameState, owner: number): Tile[] =>
  s.tiles.filter((t) => t.improvement === 'market' && tileOwnerPlayer(s, t) === owner);

/** Is a port on one of the eight tiles around `t`? */
export const besidePort = (s: GameState, t: Tile) => neighbors(s, t.x, t.y).some((n) => n.improvement === 'port');

/** The Hanseatic League: +1★ per market, +1★ more for each market beside a port. */
export const hanseIncome = (s: GameState, owner: number) =>
  isGermany(s, owner) ? marketsOf(s, owner).reduce((n, t) => n + HANSE_STARS + (besidePort(s, t) ? HANSE_PORT : 0), 0) : 0;

/** Free Imperial Cities: German cities, not the capital, with a market in their land. */
export const freeCities = (s: GameState, owner: number): City[] =>
  isGermany(s, owner) ? citiesOf(s, owner).filter((c) => !c.capital && s.tiles.some((t) => t.owner === c.id && t.improvement === 'market')) : [];

export const freeCityIncome = (s: GameState, owner: number) => freeCities(s, owner).length * FREE_CITY_STARS;

// ---------------------------------------------------------------- the electors and the Diet

/** The prince-electors: German cities of level 4 or more. */
export const electors = (s: GameState, owner: number): City[] =>
  isGermany(s, owner) ? citiesOf(s, owner).filter((c) => c.level >= ELECTOR_LEVEL) : [];

/** The city where the Diet sits: the capital, else the oldest city. */
export function dietCity(s: GameState, pid: number): City | undefined {
  const cs = citiesOf(s, pid);
  return cs.find((c) => c.capital) ?? [...cs].sort((a, b) => a.id - b.id)[0];
}
const dietTile = (s: GameState, pid: number): Tile | undefined => {
  const c = dietCity(s, pid);
  return c && tileAt(s, c.x, c.y);
};

/** Turns until the Diet may sit again (0 when it may). */
export function dietCooldown(s: GameState, pid: number): number {
  const d = st(s, pid).diet;
  return d === undefined ? 0 : Math.max(0, d + DIET_COOLDOWN - s.turn);
}

/** Why the Diet may not be called now (any edict), or null. */
export function dietWhy(s: GameState, pid: number): string | null {
  if (!isGermany(s, pid)) return 'Only the Holy Roman Empire holds Imperial Diets';
  if (!dietCity(s, pid)) return 'No city to hold the Diet';
  const n = electors(s, pid).length;
  if (n < DIET_ELECTORS) return `Needs ${DIET_ELECTORS} Electors (cities of level ${ELECTOR_LEVEL}+): you have ${n}`;
  const cd = dietCooldown(s, pid);
  if (cd > 0) return `The Diet sits again in ${cd} turn${cd === 1 ? '' : 's'}`;
  return null;
}

/** The levy's kind: the strongest melee kind Germany may field (tech and era; no goods needed), or undefined. */
export function levyKind(s: GameState, pid: number): UnitKind | undefined {
  const tribe = s.players[pid].tribe;
  return LEVY_BASES.map((k) => unitFor(tribe, k))
    .filter((k) => hasTech(s, pid, UNITS[k].tech) && !eraWhy(s, pid, k))
    .sort((a, b) => UNITS[b].atk - UNITS[a].atk)[0];
}

/** Where the levy musters: the capital tile if free, else a free land tile beside it. */
export function levySpot(s: GameState, c: City): Tile | undefined {
  const home = tileAt(s, c.x, c.y)!;
  if (!unitAt(s, home.x, home.y)) return home;
  return neighbors(s, c.x, c.y).filter((t) => isLand(t) && t.terrain !== 'mountain' && !unitAt(s, t.x, t.y)).sort((a, b) => a.y - b.y || a.x - b.x)[0];
}

/** Why this edict may not be chosen now, or null. */
export function edictWhy(s: GameState, pid: number, e: Edict): string | null {
  const why = dietWhy(s, pid);
  if (why) return why;
  if (e === 0) {
    if (!levyKind(s, pid)) return 'No melee unit to levy';
    if (!levySpot(s, dietCity(s, pid)!)) return 'No free tile in or beside the capital';
  }
  return null;
}

/** Turns of Landfrieden left (0 when none holds). */
export function landfriedenLeft(s: GameState, pid: number): number {
  const u = st(s, pid).peaceUntil;
  return u === undefined ? 0 : Math.max(0, u - s.turn);
}

/** The Diet sits and resolves the edict (it is free). */
export function callDiet(s: GameState, pid: number, e: Edict): boolean {
  if (edictWhy(s, pid, e)) return false;
  const m = st(s, pid);
  const n = electors(s, pid).length;
  let text = '';
  if (e === 0) {
    const k = levyKind(s, pid)!;
    const spot = levySpot(s, dietCity(s, pid)!)!;
    const u = spawnUnit(s, k, pid, spot.x, spot.y, null);
    u.veteran = true;
    u.hp = maxHp(u);
    u.data = { ...(u.data ?? {}), levy: true };
    put(s, pid, { levied: (m.levied ?? 0) + 1 });
    text = `the Imperial Levy: a veteran ${UNITS[k].name} musters at the capital.`;
  } else if (e === 1) {
    const stars = REICH_TAX * n;
    s.players[pid].stars += stars;
    put(s, pid, { taxed: (m.taxed ?? 0) + stars });
    text = `the Reichstag Tax: ${n} Electors pay ${stars}★.`;
  } else {
    put(s, pid, { peaceUntil: s.turn + LF_TURNS });
    text = `the Landfrieden: for ${LF_TURNS} turns your units heal ${LF_HEAL} HP more inside your borders.`;
  }
  put(s, pid, { diet: s.turn, edict: e, diets: (m.diets ?? 0) + 1 });
  emit({ type: 'toast', player: pid, text: `🦅 The Imperial Diet decrees ${text}` });
  return true;
}

/** Turn start: under the Landfrieden, German wounded inside German borders heal LF_HEAL more. */
export function landfriedenHeal(s: GameState, pid: number) {
  const m = st(s, pid);
  if (m.peaceUntil === undefined || m.diet === undefined || s.turn > m.peaceUntil || s.turn <= m.diet) return;
  for (const u of s.units) {
    if (u.owner !== pid || u.hp >= maxHp(u)) continue;
    const t = tileAt(s, u.x, u.y);
    if (!t || tileOwnerPlayer(s, t) !== pid) continue;
    const before = u.hp;
    u.hp = Math.min(maxHp(u), u.hp + LF_HEAL);
    emit({ type: 'heal', unitId: u.id, x: u.x, y: u.y, amount: u.hp - before });
  }
}

// ---------------------------------------------------------------- AI

/** A hostile, non-neutral unit within 3 tiles of a German city. */
export function underThreat(s: GameState, pid: number): boolean {
  const cs = citiesOf(s, pid);
  return s.units.some((u) => u.owner !== pid && !s.players[u.owner]?.neutral && hostile(s, pid, u.owner) && UNITS[u.kind].atk > 0
    && cs.some((c) => dist(u.x, u.y, c.x, c.y) <= 3));
}

/** German units hurt by 4 HP or more, inside German borders. */
const wounded = (s: GameState, pid: number): Unit[] =>
  s.units.filter((u) => u.owner === pid && maxHp(u) - u.hp >= 4 && tileOwnerPlayer(s, tileAt(s, u.x, u.y)!) === pid);

/** The computer's edict: the Levy under threat, the Landfrieden with three or more wounded at home, else the Tax. */
export function aiEdict(s: GameState, pid: number): Edict {
  if (underThreat(s, pid) && !edictWhy(s, pid, 0)) return 0;
  if (wounded(s, pid).length >= 3) return 2;
  return 1;
}

export const mech: Mechanic = {
  name: 'Imperial Diet & Free Cities',
  blurb: `Hanseatic League: every market pays +${HANSE_STARS}★ a turn, +${HANSE_PORT}★ more beside a port. Free Imperial Cities: every city but the capital with a market pays +${FREE_CITY_STARS}★ more. Cities of level ${ELECTOR_LEVEL}+ are Electors; with ${DIET_ELECTORS} of them the capital may call a free Imperial Diet every ${DIET_COOLDOWN} turns: the Imperial Levy (a free veteran of your best melee unit), the Reichstag Tax (+${REICH_TAX}★ per Elector) or the Landfrieden (your units heal +${LF_HEAL} HP at home for ${LF_TURNS} turns).`,

  income(s, owner) {
    return hanseIncome(s, owner) + freeCityIncome(s, owner);
  },

  turnStart(s, owner) {
    if (!isGermany(s, owner)) return;
    landfriedenHeal(s, owner);
    const m = st(s, owner);
    if (m.diet !== undefined && s.turn === m.diet + DIET_COOLDOWN && !dietWhy(s, owner))
      emit({ type: 'toast', player: owner, text: '🦅 The Electors may gather again: call an Imperial Diet at the capital.' });
  },

  actions(s, owner, t): Action[] {
    if (!isGermany(s, owner) || dietTile(s, owner) !== t) return [];
    return EDICTS.map((e, i) => {
      const why = edictWhy(s, owner, i as Edict);
      return {
        id: `mech:diet:${i}`, label: `Imperial Diet: ${e.name}`,
        desc: `The Electors gather (${electors(s, owner).length} of them; ${DIET_ELECTORS} needed) and decree ${e.desc} Then no Diet for ${DIET_COOLDOWN} turns.`,
        cost: 0, enabled: !why, reason: why ?? undefined, icon: i === 0 ? (levyKind(s, owner) ?? e.icon) : e.icon,
      };
    });
  },

  doAction(s, owner, t, id) {
    const m = /^mech:diet(?::([012]))?$/.exec(id);
    if (!m || !isGermany(s, owner) || dietTile(s, owner) !== t) return false;
    return callDiet(s, owner, (m[1] === undefined ? aiEdict(s, owner) : Number(m[1])) as Edict);
  },

  ai(s, owner) {
    if (!isGermany(s, owner) || dietWhy(s, owner)) return false;
    return callDiet(s, owner, aiEdict(s, owner));
  },
};

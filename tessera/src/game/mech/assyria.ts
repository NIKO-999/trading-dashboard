import { emit } from '../events';
import { dist, tileAt } from '../grid';
import { hostile } from '../diplomacy';
import { eraCheck } from '../eras';
import { addPop, citiesOf, researchStatus, techCost } from '../rules';
import type { Action } from '../rules';
import { TECH_BY_ID } from '../../data/techs';
import type { City, GameState, Tile } from '../types';
import type { Mechanic } from './types';

// Deportations & the Library of Ashurbanipal (core) + Siege Masters (military).
//
// Siege Masters: siege engines (catapults, the Siege Tower and the other `siege` kinds) cost SIEGE_OFF (2★) less to
// train. That is a tribe check in rules `trainCost` beside Nubia's ranged discount; it has no hook here.
//
// Deportation (`cityCaptured`): when Assyria takes a city from another empire, DEPORT_POP (1) population is marched
// from it to Assyria's capital (the oldest city when there is no capital). Only progress population moves: a city
// whose `pop` is 0 keeps its level and nobody is deported, so a capture never knocks a level off.
//
// The Library (`cityCaptured`): the scribes carry off the tablets: Assyria learns, for free, one tech that the city's
// former owner knew and Assyria lacks. Only a tech Assyria could research right now (its parent known, not another
// people's culture line, not the sealed side of a fork) is taken; the cheapest for Assyria wins, ties by tier then id.
// It is added to `techs` as research does (and the era is checked), without paying.
//
// Terror Tribute (`mech:tribute`, at the capital, free, once every TRIBUTE_COOLDOWN turns): every hostile city within
// TRIBUTE_RANGE tiles of an Assyrian unit pays 1★, taken from its owner's treasury (never below 0), at most TRIBUTE_MAX
// in all, nearest cities first. With diplomacy on, each paying empire's mood toward Assyria drops by TRIBUTE_ANGER.

export const SIEGE_OFF = 2;
export const DEPORT_POP = 1;
export const TRIBUTE_COOLDOWN = 6;
export const TRIBUTE_RANGE = 4;
export const TRIBUTE_PER_CITY = 1;
export const TRIBUTE_MAX = 6;
export const TRIBUTE_ANGER = 6;
/** The AI demands tribute once it would bring in at least this many stars. */
export const AI_MIN_TRIBUTE = 2;

const isAssyria = (s: GameState, pid: number) => s.players[pid]?.tribe === 'assyria';

const mechOf = (s: GameState, owner: number) => s.players[owner].mech ?? {};
const bump = (s: GameState, owner: number, k: string, n: number) => {
  const p = s.players[owner];
  p.mech = { ...(p.mech ?? {}), [k]: Number(p.mech?.[k] ?? 0) + n };
};

/** Assyria's seat: the capital, else its oldest city (never `except`). */
export function seatOf(s: GameState, owner: number, except?: City): City | undefined {
  const cs = citiesOf(s, owner).filter((c) => c !== except);
  return cs.find((c) => c.capital) ?? [...cs].sort((a, b) => a.id - b.id)[0];
}

const capitalTile = (s: GameState, owner: number): Tile | undefined => {
  const c = citiesOf(s, owner).find((e) => e.capital);
  return c && tileAt(s, c.x, c.y);
};

// ---------------------------------------------------------------- deportation

/** March DEPORT_POP population from captured city `c` to Assyria's seat. Returns the number moved. */
export function deport(s: GameState, owner: number, c: City): number {
  if (c.pop <= 0) return 0;
  const seat = seatOf(s, owner, c);
  if (!seat) return 0;
  const n = Math.min(DEPORT_POP, c.pop);
  c.pop -= n; // progress population only: the city keeps its level
  addPop(s, seat, n);
  bump(s, owner, 'deported', n);
  emit({ type: 'harvest', player: owner, x: seat.x, y: seat.y, pop: n });
  emit({ type: 'toast', player: owner, text: `⛓️ Deportation: ${n} of ${c.name}'s people are marched to ${seat.name}.` });
  return n;
}

// ---------------------------------------------------------------- the library

/** The tech the scribes would carry off from player `from`, or null. */
export function libraryPick(s: GameState, owner: number, from: number): string | null {
  const q = s.players[from];
  if (!q || from === owner) return null;
  const mine = s.players[owner].techs;
  const ok = q.techs.filter((id) => TECH_BY_ID[id] && !mine.includes(id) && researchStatus(s, owner, id) === 'available');
  if (!ok.length) return null;
  const key = (id: string) => [techCost(s, owner, id), TECH_BY_ID[id].tier] as const;
  ok.sort((a, b) => key(a)[0] - key(b)[0] || key(a)[1] - key(b)[1] || (a < b ? -1 : a > b ? 1 : 0));
  return ok[0];
}

/** Take one tech from `from`'s tablets without paying. Returns its id, or null. */
export function takeLibrary(s: GameState, owner: number, from: number, c?: City): string | null {
  const id = libraryPick(s, owner, from);
  if (!id) return null;
  const p = s.players[owner];
  p.techs.push(id);
  eraCheck(s, owner);
  const books = Array.isArray(p.mech?.library) ? (p.mech!.library as string[]) : [];
  p.mech = { ...(p.mech ?? {}), library: [...books, id] };
  emit({ type: 'toast', player: owner, text: `📜 The Library of Ashurbanipal: the tablets of ${c?.name ?? 'the city'} teach ${TECH_BY_ID[id].name}.` });
  return id;
}

/** Techs the Library has taken so far. */
export const libraryOf = (s: GameState, owner: number): string[] =>
  Array.isArray(s.players[owner]?.mech?.library) ? (s.players[owner].mech!.library as string[]) : [];

export const deportedOf = (s: GameState, owner: number) => Number(s.players[owner]?.mech?.deported ?? 0);

// ---------------------------------------------------------------- terror tribute

/** Turns until the tribute may be demanded again (0: ready). */
export function tributeWait(s: GameState, owner: number): number {
  const last = mechOf(s, owner).tribute;
  if (typeof last !== 'number') return 0;
  return Math.max(0, TRIBUTE_COOLDOWN - (s.turn - last));
}

/** Hostile cities within TRIBUTE_RANGE of one of `owner`'s units, nearest first. */
export function tributaries(s: GameState, owner: number): City[] {
  const army = s.units.filter((u) => u.owner === owner);
  const near = (c: City) => Math.min(...army.map((u) => dist(u.x, u.y, c.x, c.y)));
  return s.cities
    .filter((c) => c.owner !== owner && !s.players[c.owner]?.neutral && s.players[c.owner]?.alive && hostile(s, owner, c.owner))
    .map((c) => ({ c, d: army.length ? near(c) : Infinity }))
    .filter((e) => e.d <= TRIBUTE_RANGE)
    .sort((a, b) => a.d - b.d || a.c.id - b.c.id)
    .map((e) => e.c);
}

/** What each city would pay now: [city, stars], honouring the owners' treasuries and the cap. */
export function tributePlan(s: GameState, owner: number): { city: City; stars: number }[] {
  const left = new Map<number, number>();
  const plan: { city: City; stars: number }[] = [];
  let total = 0;
  for (const c of tributaries(s, owner)) {
    if (total >= TRIBUTE_MAX) break;
    const purse = left.get(c.owner) ?? Math.max(0, s.players[c.owner].stars);
    const pay = Math.min(TRIBUTE_PER_CITY, purse, TRIBUTE_MAX - total);
    if (pay <= 0) continue;
    left.set(c.owner, purse - pay);
    total += pay;
    plan.push({ city: c, stars: pay });
  }
  return plan;
}

export const tributeTotal = (s: GameState, owner: number) => tributePlan(s, owner).reduce((n, e) => n + e.stars, 0);

/** Why the tribute can't be demanded now, or null. */
export function tributeWhy(s: GameState, owner: number): string | null {
  const w = tributeWait(s, owner);
  if (w > 0) return `Ready again in ${w} turn${w === 1 ? '' : 's'}`;
  if (!tributaries(s, owner).length) return `No enemy city within ${TRIBUTE_RANGE} tiles of your army`;
  if (!tributeTotal(s, owner)) return 'Their treasuries are empty';
  return null;
}

/** Demand the tribute: returns the stars taken (0 if it could not be demanded). */
export function demandTribute(s: GameState, owner: number): number {
  if (tributeWhy(s, owner)) return 0;
  const p = s.players[owner];
  const plan = tributePlan(s, owner);
  const angered = new Set<number>();
  let total = 0;
  for (const { city, stars } of plan) {
    const victim = s.players[city.owner];
    victim.stars = Math.max(0, victim.stars - stars);
    p.stars += stars;
    total += stars;
    emit({ type: 'stars', player: owner, x: city.x, y: city.y, amount: stars });
    if (!angered.has(city.owner)) {
      angered.add(city.owner);
      emit({ type: 'toast', player: city.owner, text: `Assyrian envoys demand tribute: ${city.name} pays in fear.` });
      if (s.diplo) { // the victim thinks less of Assyria (diplomacy's own mood, clamped as it does)
        const k = `${city.owner}:${owner}`;
        s.diplo.mood[k] = Math.max(-60, (s.diplo.mood[k] ?? 0) - TRIBUTE_ANGER);
      }
    }
  }
  p.mech = { ...(p.mech ?? {}), tribute: s.turn, tributeStars: Number(p.mech?.tributeStars ?? 0) + total };
  emit({ type: 'toast', player: owner, text: `🦁 Terror Tribute: ${plan.length} cit${plan.length === 1 ? 'y pays' : 'ies pay'} +${total}★ to Ashur.` });
  return total;
}

export const mech: Mechanic = {
  name: 'Deportations & the Library',
  blurb: `Each city you capture loses ${DEPORT_POP} population to your capital, and its tablets teach you one tech its owner knew. Terror Tribute at the capital (free, every ${TRIBUTE_COOLDOWN} turns): every enemy city within ${TRIBUTE_RANGE} tiles of your army pays ${TRIBUTE_PER_CITY}★, up to ${TRIBUTE_MAX}★. Siege Masters: siege engines cost ${SIEGE_OFF}★ less.`,

  cityCaptured(s, owner, c, from) {
    if (!isAssyria(s, owner) || c.owner !== owner || from === owner) return;
    deport(s, owner, c);
    takeLibrary(s, owner, from, c);
  },

  actions(s, owner, t): Action[] {
    if (!isAssyria(s, owner) || capitalTile(s, owner) !== t) return [];
    const why = tributeWhy(s, owner);
    const n = tributeTotal(s, owner);
    return [{
      id: 'mech:tribute', label: 'Terror Tribute', cost: 0, icon: 'flag', enabled: !why, reason: why ?? undefined,
      desc: `Every enemy city within ${TRIBUTE_RANGE} tiles of your army pays ${TRIBUTE_PER_CITY}★ from its owner's treasury (up to ${TRIBUTE_MAX}★; ${n}★ now). It angers them. Once every ${TRIBUTE_COOLDOWN} turns.`,
    }];
  },

  doAction(s, owner, t, id) {
    if (id !== 'mech:tribute' || !isAssyria(s, owner) || capitalTile(s, owner) !== t) return false;
    return demandTribute(s, owner) > 0;
  },

  // Demand the tribute when the army stands near enough enemy cities to make it worth their anger.
  ai(s, owner) {
    if (!isAssyria(s, owner) || tributeWhy(s, owner) || !capitalTile(s, owner)) return false;
    if (tributeTotal(s, owner) < AI_MIN_TRIBUTE) return false;
    return demandTribute(s, owner) > 0;
  },
};

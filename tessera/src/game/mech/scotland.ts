import { emit } from '../events';
import { dist, neighbors } from '../grid';
import { addPop, citiesOf, maxHp } from '../rules';
import type { Action } from '../rules';
import type { City, GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// Highland Games & Clan Gatherings (core) + Scottish Enlightenment (economy).
//
// Economy (Scottish Enlightenment): every Scottish city of level ENLIGHT_LEVEL (3) or more makes each tech 1★ cheaper,
// at most ENLIGHT_MAX (3★), never below 1★. That is a tribe check in rules `techCost` (enlightenmentTechOff below).
//
// Core:
//  - Highland Games (`mech:games`, a city action, GAMES_COST★, each city once every GAMES_EVERY turns): every Scottish
//    unit within GAMES_RANGE tiles of the city gains one kill of veteran progress (`veteranKills + 1`) and becomes a
//    veteran at the usual 3 (heroes level up instead, so they only bank the kill, as in rules); the city gains +1 pop.
//    The turn the games ran is kept in `city.data.games`.
//  - Clan Gathering: Scottish land units standing on a mountain or next to one defend +MOUNTAIN_DEF (the `stat` hook).
//    When a Scottish unit falls in battle (a killer is named), the nearest Scottish city sends MOURN_STARS★ to the
//    treasury: the clan's mourning gift.

export const ENLIGHT_LEVEL = 3;
export const ENLIGHT_MAX = 3;
export const GAMES_COST = 4;
export const GAMES_EVERY = 6;
export const GAMES_RANGE = 2;
export const MOUNTAIN_DEF = 0.5;
export const MOURN_STARS = 1;
/** Units near a city the computer wants before it holds games there. */
export const AI_MIN_UNITS = 3;
/** Stars the computer keeps in hand after paying for the games. */
export const AI_RESERVE = 3;

const isScot = (s: GameState, pid: number) => s.players[pid]?.tribe === 'scotland';

/** Stars every Scottish tech is cheaper by: 1 per city of level 3+, at most 3 (0 for other empires). */
export const enlightenmentTechOff = (s: GameState, pid: number) =>
  isScot(s, pid) ? Math.min(ENLIGHT_MAX, citiesOf(s, pid).filter((c) => c.level >= ENLIGHT_LEVEL).length) : 0;

/** Turns until city `c` may hold the games again (0: now). */
export function gamesIn(s: GameState, c: City): number {
  const last = c.data?.games;
  return typeof last === 'number' ? Math.max(0, last + GAMES_EVERY - s.turn) : 0;
}

/** Did city `c` hold its games this turn? */
export const gamesNow = (s: GameState, c: City) => c.data?.games === s.turn;

/** The units of the city's owner that would take part in its games. */
export const competitors = (s: GameState, c: City): Unit[] =>
  s.units.filter((u) => u.owner === c.owner && dist(u.x, u.y, c.x, c.y) <= GAMES_RANGE);

const cityOn = (s: GameState, t: Tile): City | undefined => (t.cityId === null ? undefined : s.cities.find((c) => c.id === t.cityId));

/** Why the games can't be held at city `c`, or null. */
export function gamesWhy(s: GameState, owner: number, c: City | undefined): string | null {
  if (!isScot(s, owner)) return 'Only Scotland holds the Highland Games';
  if (!c || c.owner !== owner) return 'Only in your own city';
  const wait = gamesIn(s, c);
  if (wait > 0) return `The games return in ${wait} turn${wait > 1 ? 's' : ''}`;
  return null;
}

/** Hold the Highland Games at city `c`: veteran progress for every unit within 2, +1 pop. */
export function holdGames(s: GameState, owner: number, c: City): boolean {
  if (gamesWhy(s, owner, c)) return false;
  c.data = { ...(c.data ?? {}), games: s.turn };
  let vets = 0;
  for (const u of competitors(s, c)) {
    u.veteranKills++;
    if (u.veteranKills >= 3 && !u.veteran && (u.carrying ?? u.kind) !== 'hero') {
      u.veteran = true;
      u.hp = maxHp(u);
      vets++;
    }
  }
  addPop(s, c, 1);
  emit({ type: 'harvest', player: owner, x: c.x, y: c.y, pop: 1 });
  emit({ type: 'toast', player: owner, text: `🏴 Highland Games at ${c.name}: cabers tossed and stones thrown${vets ? `, ${vets} new veteran${vets > 1 ? 's' : ''}` : ''}.` });
  return true;
}

/** Is (x, y) a mountain or next to one? */
export function byMountain(s: GameState, x: number, y: number): boolean {
  const here = s.tiles[y * s.size + x];
  return !!here && [here, ...neighbors(s, x, y)].some((n) => n.terrain === 'mountain');
}

/** The Scottish city nearest (x, y), ties to the lower id. */
export function nearestCity(s: GameState, owner: number, x: number, y: number): City | undefined {
  let best: City | undefined, bd = Infinity;
  for (const c of citiesOf(s, owner)) {
    const d = dist(c.x, c.y, x, y);
    if (d < bd || (d === bd && best && c.id < best.id)) { best = c; bd = d; }
  }
  return best;
}

export const mech: Mechanic = {
  name: 'Highland Games & Clan Gatherings',
  blurb: `Highland Games (${GAMES_COST}★ in a city, once every ${GAMES_EVERY} turns): every unit within ${GAMES_RANGE} tiles gains a kill toward veteran and the city grows by 1. Clan Gathering: your units on or beside a mountain defend +${MOUNTAIN_DEF}, and each one that falls in battle sends +${MOURN_STARS}★ from the nearest city. Scottish Enlightenment: each city of level ${ENLIGHT_LEVEL}+ makes techs 1★ cheaper (at most ${ENLIGHT_MAX}★).`,

  stat(s, owner, u, stat) {
    if (stat !== 'def' || u.owner !== owner || !isScot(s, owner) || u.carrying) return 0;
    const t = s.tiles[u.y * s.size + u.x];
    if (!t || t.terrain === 'ocean' || t.terrain === 'shallow') return 0;
    return byMountain(s, u.x, u.y) ? MOUNTAIN_DEF : 0;
  },

  unitDied(s, owner, u, killer) {
    if (!killer || u.owner !== owner || !isScot(s, owner) || !s.players[owner].alive) return;
    const c = nearestCity(s, owner, u.x, u.y);
    if (!c) return;
    s.players[owner].stars += MOURN_STARS;
    emit({ type: 'stars', player: owner, x: c.x, y: c.y, amount: MOURN_STARS });
  },

  actions(s, owner, t): Action[] {
    const c = cityOn(s, t);
    if (!isScot(s, owner) || !c || c.owner !== owner) return [];
    const why = gamesWhy(s, owner, c) ?? (s.players[owner].stars < GAMES_COST ? 'Not enough stars' : null);
    const n = competitors(s, c).length;
    return [{
      id: 'mech:games', label: 'Highland Games', cost: GAMES_COST, icon: 'flag', enabled: !why, reason: why ?? undefined,
      desc: `Cabers, hammers and stones: every unit within ${GAMES_RANGE} tiles (${n} now) gains a kill toward veteran rank, and the city grows by 1. Once every ${GAMES_EVERY} turns per city.`,
    }];
  },

  doAction(s, owner, t, id) {
    if (id !== 'mech:games') return false;
    const c = cityOn(s, t);
    return !!c && holdGames(s, owner, c);
  },

  // Holds the games where most units gather (at least 3), keeping a small reserve; prefers units close to veteran.
  ai(s, owner) {
    if (!isScot(s, owner)) return false;
    const p = s.players[owner];
    if (p.stars < GAMES_COST + AI_RESERVE) return false;
    let best: City | null = null, bv = 0;
    for (const c of citiesOf(s, owner)) {
      if (gamesWhy(s, owner, c)) continue;
      const us = competitors(s, c).filter((u) => !u.veteran);
      if (us.length < AI_MIN_UNITS) continue;
      const v = us.length + us.filter((u) => u.veteranKills === 2).length * 0.5;
      if (v > bv) { bv = v; best = c; }
    }
    if (!best) return false;
    p.stars -= GAMES_COST; // the core charges only for human-issued actions; the AI pays here
    return holdGames(s, owner, best);
  },
};

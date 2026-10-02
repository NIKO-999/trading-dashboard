import { emit } from '../events';
import { dist } from '../grid';
import { citiesOf, cityById, maxHp } from '../rules';
import type { Action } from '../rules';
import type { City, GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// The Great League of Peace (core) + Three Sisters (economy).
//
// Economy (Three Sisters): every crop harvest (a Farm on a crop) grows the city by 1 more; that is a tribe check in
// rules.ts beside the Egyptian farm bonus.
//
// Core: the Haudenosaunee cities form the League, kindled from the council fire at the capital (Onondaga).
// THE RULE: the League grows out from the capital. A Haudenosaunee city joins when it lies within LEAGUE_RANGE tiles
// (the game's square distance) of a city already in the League; nearer cities join first (ties by city id), and the
// League holds at most LEAGUE_MAX members, like the Five (later Six) Nations. A capital standing alone is not yet a
// League: it needs at least two members. With no capital left, the oldest city keeps the fire.
//  - Income: +LEAGUE_STAR★ a turn for every member beyond the first.
//  - Defence: Haudenosaunee units inside the borders of a League city defend +LEAGUE_DEF.
//  - Condolence Council (`mech:council`, at the capital, COUNCIL_COST★, once every COUNCIL_EVERY turns): every
//    Haudenosaunee unit heals to full.
// Not done: the council's "units trained next turn cost 1★ less". The train price (rules.trainCost) has no mechanic
// hook, and the rules ask us not to graft one into shared code for this; the council is the heal alone.

export const LEAGUE_RANGE = 4;
export const LEAGUE_MAX = 4;
export const LEAGUE_STAR = 1;
export const LEAGUE_DEF = 0.5;
export const COUNCIL_COST = 4;
export const COUNCIL_EVERY = 5;

interface HState { council?: number }

const isHaud = (s: GameState, pid: number) => s.players[pid]?.tribe === 'haudenosaunee';

/** The city that keeps the council fire: the capital, else the oldest city. */
export function fireCity(s: GameState, owner: number): City | undefined {
  const cs = citiesOf(s, owner);
  return cs.find((c) => c.capital) ?? [...cs].sort((a, b) => a.id - b.id)[0];
}

/** The League's member cities, in the order they joined (capital first). Empty while fewer than two. */
export function leagueOf(s: GameState, owner: number): City[] {
  if (!isHaud(s, owner)) return [];
  const fire = fireCity(s, owner);
  if (!fire) return [];
  const rest = citiesOf(s, owner).filter((c) => c !== fire);
  const league: City[] = [fire];
  while (league.length < LEAGUE_MAX) {
    let best: { c: City; d: number } | null = null;
    for (const c of rest) {
      if (league.includes(c)) continue;
      const d = Math.min(...league.map((m) => dist(m.x, m.y, c.x, c.y)));
      if (d > LEAGUE_RANGE) continue;
      if (!best || d < best.d || (d === best.d && c.id < best.c.id)) best = { c, d };
    }
    if (!best) break;
    league.push(best.c);
  }
  return league.length >= 2 ? league : [];
}

/** Stars a turn the League pays. */
export const leagueIncome = (s: GameState, owner: number) => Math.max(0, leagueOf(s, owner).length - 1) * LEAGUE_STAR;

/** Is unit `u` standing inside the borders of one of its League's cities? */
export function inLeague(s: GameState, u: Unit): boolean {
  const t = s.tiles[u.y * s.size + u.x];
  if (!t || t.owner === null) return false;
  const c = cityById(s, t.owner);
  return !!c && c.owner === u.owner && leagueOf(s, u.owner).includes(c);
}

/** Turns until the Condolence Council may sit again (0: it may sit now). */
export function councilIn(s: GameState, owner: number): number {
  const last = (s.players[owner].mech as HState | undefined)?.council;
  return last === undefined ? 0 : Math.max(0, last + COUNCIL_EVERY - s.turn);
}

/** Haudenosaunee units not at full health. */
export const wounded = (s: GameState, owner: number): Unit[] => s.units.filter((u) => u.owner === owner && u.hp < maxHp(u));

const fireTile = (s: GameState, owner: number): Tile | undefined => {
  const c = fireCity(s, owner);
  return c && s.tiles[c.y * s.size + c.x];
};

/** The Condolence Council: the grief is wiped away, every unit heals to full. */
export function holdCouncil(s: GameState, owner: number): boolean {
  if (!isHaud(s, owner) || councilIn(s, owner) > 0 || !fireCity(s, owner)) return false;
  (s.players[owner].mech ??= {}).council = s.turn;
  for (const u of s.units) {
    if (u.owner !== owner || u.hp >= maxHp(u)) continue;
    const n = maxHp(u) - u.hp;
    u.hp = maxHp(u);
    emit({ type: 'heal', unitId: u.id, x: u.x, y: u.y, amount: n });
  }
  emit({ type: 'toast', player: owner, text: '🪶 The Condolence Council sits: the grief is wiped away and every warrior is made whole.' });
  return true;
}

export const mech: Mechanic = {
  name: 'Great League of Peace',
  blurb: `Cities within ${LEAGUE_RANGE} tiles of the League join it, growing out from your capital (at most ${LEAGUE_MAX}): +${LEAGUE_STAR}★ a turn for each member beyond the first, and your units defend +${LEAGUE_DEF} inside League borders. Condolence Council (${COUNCIL_COST}★, every ${COUNCIL_EVERY} turns): every unit heals to full. Three Sisters: every crop harvest grows the city by 1 more.`,

  income(s, owner) {
    return leagueIncome(s, owner);
  },

  stat(s, owner, u, stat) {
    if (stat !== 'def' || u.owner !== owner || !isHaud(s, owner)) return 0;
    return inLeague(s, u) ? LEAGUE_DEF : 0;
  },

  actions(s, owner, t): Action[] {
    if (!isHaud(s, owner) || fireTile(s, owner) !== t) return [];
    const wait = councilIn(s, owner);
    const why = wait > 0 ? `The council sits again in ${wait} turn${wait > 1 ? 's' : ''}` : s.players[owner].stars < COUNCIL_COST ? 'Not enough stars' : null;
    return [{
      id: 'mech:council', label: 'Condolence Council', cost: COUNCIL_COST, icon: 'flag', enabled: !why, reason: why ?? undefined,
      desc: `The League mourns its dead and wipes away the grief: every one of your units heals to full. Once every ${COUNCIL_EVERY} turns.`,
    }];
  },

  doAction(s, owner, t, id) {
    if (id !== 'mech:council' || fireTile(s, owner) !== t) return false;
    return holdCouncil(s, owner);
  },

  // Calls the council when two or more units are wounded and the treasury allows.
  ai(s, owner) {
    if (!isHaud(s, owner)) return false;
    const p = s.players[owner];
    if (p.stars < COUNCIL_COST || councilIn(s, owner) > 0 || !fireCity(s, owner)) return false;
    if (wounded(s, owner).length < 2) return false;
    p.stars -= COUNCIL_COST; // the core charges only for human-issued actions; the AI pays here
    return holdCouncil(s, owner);
  },
};

import { emit } from '../events';
import { hostile } from '../diplomacy';
import { citiesOf, tileOwnerPlayer } from '../rules';
import type { Action } from '../rules';
import type { GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// General Winter (core) + Fur Trade (economy).
//
// Core: winter comes to the land of Rus on a fixed calendar. From turn WINTER_FROM on, every WINTER_EVERY turns the
// snow lies for WINTER_LENGTH turns (turns 10-12, 20-22, 30-32...). While it is winter in Rus:
//  - every unit hostile to Rus (per the diplomacy rules; the wild counts as hostile) standing inside Rus borders loses
//    FROST_DAMAGE HP at the start of Rus's turn, but never below 1 (the frost wounds, it never kills);
//  - those hostile units move WINTER_SLOW less while they stand inside Rus borders (never below 1, the core's floor);
//  - Rus's own units get +WINTER_DEF defence anywhere inside Rus borders.
// Simplification: the frost bites once a round, at the start of Rus's own turn (the mechanic hooks only see their
// owner's turn start), like the Inuit freeze.
//
// Rus may also call an early winter (`mech:winter`, at the capital) for EARLY_COST stars: a winter of EARLY_LENGTH
// turns starting now. It can be called once per era (`player.era.n`), and not while winter already holds.
//
// Economy (Fur Trade): every hunt pays +1 star; that is a tribe check in rules.ts beside the Aztec Sacred Hunt.

export const WINTER_FROM = 10;
export const WINTER_EVERY = 10;
export const WINTER_LENGTH = 3;
export const FROST_DAMAGE = 2;
export const WINTER_SLOW = 1;
export const WINTER_DEF = 0.5;
export const EARLY_COST = 8;
export const EARLY_LENGTH = 2;
export const FUR_TRADE = 1;

interface RusState { early?: { from: number; until: number }; era?: number }

const state = (s: GameState, owner: number): RusState => (s.players[owner].mech ??= {}) as RusState;
const eraOf = (s: GameState, owner: number) => s.players[owner].era?.n ?? 0;

/** Is turn `turn` in the fixed winter season? */
export const seasonWinter = (turn: number) => turn >= WINTER_FROM && (turn - WINTER_FROM) % WINTER_EVERY < WINTER_LENGTH;

/** Is it winter in the land of `owner` this turn (the season, or an early winter called by Rus)? */
export function isWinter(s: GameState, owner: number): boolean {
  if (seasonWinter(s.turn)) return true;
  const e = (s.players[owner].mech as RusState | undefined)?.early;
  return !!e && s.turn >= e.from && s.turn <= e.until;
}

/** Turns of winter left, counting this one (0 when it is not winter). */
export function winterLeft(s: GameState, owner: number): number {
  let n = 0;
  const e = (s.players[owner].mech as RusState | undefined)?.early;
  for (let t = s.turn; seasonWinter(t) || (!!e && t >= e.from && t <= e.until); t++) n++;
  return n;
}

/** Turns until the next winter of the season (0 while it is winter). */
export function winterIn(s: GameState, owner: number): number {
  if (isWinter(s, owner)) return 0;
  if (s.turn < WINTER_FROM) return WINTER_FROM - s.turn;
  const k = (s.turn - WINTER_FROM) % WINTER_EVERY;
  return WINTER_EVERY - k;
}

/** May Rus call an early winter now? Returns the reason it may not, or null. */
export function earlyWhy(s: GameState, owner: number): string | null {
  const m = s.players[owner].mech as RusState | undefined;
  if (m?.era !== undefined && m.era >= eraOf(s, owner)) return 'Already called this era';
  if (isWinter(s, owner)) return 'It is already winter';
  return null;
}

/** Calls an early winter: EARLY_LENGTH turns from now. */
export function callWinter(s: GameState, owner: number): boolean {
  if (earlyWhy(s, owner)) return false;
  const m = state(s, owner);
  m.early = { from: s.turn, until: s.turn + EARLY_LENGTH - 1 };
  m.era = eraOf(s, owner);
  emit({ type: 'toast', player: owner, text: '❄ General Winter comes early: the snows fall on the land of Rus.' });
  return true;
}

const inLand = (s: GameState, owner: number, u: Unit) => {
  const t = s.tiles[u.y * s.size + u.x];
  return !!t && tileOwnerPlayer(s, t) === owner;
};

/** Hostile units standing inside `owner`'s borders. */
export const invaders = (s: GameState, owner: number): Unit[] =>
  s.units.filter((u) => u.owner !== owner && hostile(s, owner, u.owner) && inLand(s, owner, u));

const capitalTile = (s: GameState, owner: number): Tile | undefined => {
  const c = citiesOf(s, owner).find((e) => e.capital) ?? citiesOf(s, owner)[0];
  return c && s.tiles[c.y * s.size + c.x];
};

export const mech: Mechanic = {
  name: 'General Winter',
  blurb: 'Every 10 turns winter falls on your land for 3 turns: invaders lose 2 HP a turn (never below 1) and move 1 less, your troops get +0.5 defence at home. Once an era you may call an early winter.',

  turnStart(s, owner) {
    if (!isWinter(s, owner)) return;
    for (const u of invaders(s, owner)) {
      if (u.hp <= 1) continue;
      const n = Math.min(FROST_DAMAGE, u.hp - 1); // frost wounds, it never kills
      u.hp -= n;
      emit({ type: 'damage', unitId: u.id, x: u.x, y: u.y, amount: n, crit: 'Frost' });
    }
  },

  stat(s, owner, u, stat) {
    if ((stat !== 'move' && stat !== 'def') || !isWinter(s, owner) || !inLand(s, owner, u)) return 0;
    if (stat === 'def') return u.owner === owner ? WINTER_DEF : 0;
    return u.owner !== owner && hostile(s, owner, u.owner) ? -WINTER_SLOW : 0;
  },

  actions(s, owner, t): Action[] {
    const cap = capitalTile(s, owner);
    if (!cap || cap !== t) return [];
    const p = s.players[owner];
    const why = earlyWhy(s, owner) ?? (p.stars < EARLY_COST ? 'Not enough stars' : null);
    return [{
      id: 'mech:winter', label: 'Call General Winter',
      desc: `The snows come early: a ${EARLY_LENGTH}-turn winter starts now (invaders freeze and slow, your troops hold firm). Once per era.`,
      cost: EARLY_COST, enabled: !why, reason: why ?? undefined, icon: 'flag',
    }];
  },

  doAction(s, owner, t, id) {
    if (id !== 'mech:winter' || capitalTile(s, owner) !== t) return false;
    return callWinter(s, owner);
  },

  // Calls the early winter when enemies stand inside the borders and the treasury allows.
  ai(s, owner) {
    const p = s.players[owner];
    if (p.stars < EARLY_COST || earlyWhy(s, owner) || !capitalTile(s, owner)) return false;
    if (invaders(s, owner).filter((u) => !s.players[u.owner].neutral).length === 0) return false;
    p.stars -= EARLY_COST; // the core charges only for human-issued actions; the AI pays here
    return callWinter(s, owner);
  },
};

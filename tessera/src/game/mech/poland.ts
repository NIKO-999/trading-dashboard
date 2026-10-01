import { isMounted } from '../auxiliaries';
import { hostile } from '../diplomacy';
import { emit } from '../events';
import { citiesOf } from '../rules';
import type { Action } from '../rules';
import type { City, GameState, Tile } from '../types';
import type { Mechanic } from './types';

// Golden Liberty (empire bonus) + the Royal Election (core).
//
// Golden Liberty: every Polish city of level GOLDEN_LEVEL (3) or more pays +GOLDEN_STARS★ a turn (the `income` hook).
//
// The Royal Election (Sejm): the szlachta elects its king. At the capital (else the oldest city) the tile action
// `mech:elect:<n>` (n = 0, 1, 2) is offered whenever no king reigns and no interregnum holds. The first election is free;
// every later one costs ELECT_COST★. The king reigns TERM turns of Poland's own (the turn he is elected included), then
// INTERREGNUM turns pass with no king (the action is greyed out with that reason), then the Sejm may sit again.
// The three platforms:
//  0 Hussar King: Polish mounted units +HUSSAR_ATK attack (the `stat` hook);
//  1 Merchant King: +MERCHANT_STARS★ a turn per city (the `income` hook);
//  2 Scholar King: every tech SCHOLAR_OFF★ cheaper, never below 1★. A tribe check in rules `techCost` (scholarTechOff).

export const GOLDEN_LEVEL = 3;
export const GOLDEN_STARS = 1;
export const TERM = 8;
export const INTERREGNUM = 2;
export const ELECT_COST = 3;
export const HUSSAR_ATK = 1;
export const MERCHANT_STARS = 1;
export const SCHOLAR_OFF = 2;
/** Below this many stars the computer prefers the Merchant King. */
export const AI_POOR = 6;

export type King = 0 | 1 | 2;
export const KINGS: { name: string; desc: string }[] = [
  { name: 'Hussar King', desc: `Mounted units +${HUSSAR_ATK} attack.` },
  { name: 'Merchant King', desc: `+${MERCHANT_STARS}★ a turn per city.` },
  { name: 'Scholar King', desc: `Techs cost ${SCHOLAR_OFF}★ less (never below 1★).` },
];

interface PolandState { king?: King; from?: number; elections?: number }

const isPoland = (s: GameState, pid: number) => s.players[pid]?.tribe === 'poland';
const st = (s: GameState, pid: number) => (s.players[pid].mech ?? {}) as PolandState;

/** The reigning king's platform, or null (no king yet, or an interregnum). */
export function kingOf(s: GameState, pid: number): King | null {
  if (!isPoland(s, pid)) return null;
  const m = st(s, pid);
  if (m.king === undefined || m.from === undefined) return null;
  return s.turn < m.from + TERM ? m.king : null;
}

/** Turns of the reign left, counting this one (0 when no king reigns). */
export function reignLeft(s: GameState, pid: number): number {
  const m = st(s, pid);
  return kingOf(s, pid) === null || m.from === undefined ? 0 : m.from + TERM - s.turn;
}

/** Turns of interregnum left, counting this one (0 when none holds). */
export function interregnumLeft(s: GameState, pid: number): number {
  const m = st(s, pid);
  if (!isPoland(s, pid) || m.from === undefined) return 0;
  const end = m.from + TERM + INTERREGNUM;
  return s.turn >= m.from + TERM && s.turn < end ? end - s.turn : 0;
}

/** What the next election costs: free the first time, ELECT_COST★ after. */
export const electCost = (s: GameState, pid: number) => ((st(s, pid).elections ?? 0) > 0 ? ELECT_COST : 0);

/** Why the Sejm may not sit now, or null. */
export function electWhy(s: GameState, pid: number): string | null {
  if (!isPoland(s, pid)) return 'Only Poland elects its king';
  if (kingOf(s, pid) !== null) return `${KINGS[st(s, pid).king!].name} reigns ${reignLeft(s, pid)} more turn${reignLeft(s, pid) === 1 ? '' : 's'}`;
  const i = interregnumLeft(s, pid);
  if (i > 0) return `Interregnum: ${i} turn${i === 1 ? '' : 's'} until the Sejm sits`;
  return null;
}

/** Golden Liberty: +1★ a turn for every city of level 3 or more. */
export const goldenIncome = (s: GameState, pid: number) =>
  isPoland(s, pid) ? GOLDEN_STARS * citiesOf(s, pid).filter((c) => c.level >= GOLDEN_LEVEL).length : 0;

/** The Merchant King's stars a turn. */
export const merchantIncome = (s: GameState, pid: number) => (kingOf(s, pid) === 1 ? MERCHANT_STARS * citiesOf(s, pid).length : 0);

/** The Scholar King's discount on every tech (0 otherwise). Read by rules `techCost`. */
export const scholarTechOff = (s: GameState, pid: number) => (kingOf(s, pid) === 2 ? SCHOLAR_OFF : 0);

/** The city where the Sejm sits: the capital, else the oldest city. */
export function sejmCity(s: GameState, pid: number): City | undefined {
  const cs = citiesOf(s, pid);
  return cs.find((c) => c.capital) ?? [...cs].sort((a, b) => a.id - b.id)[0];
}
const sejmTile = (s: GameState, pid: number): Tile | undefined => {
  const c = sejmCity(s, pid);
  return c && s.tiles[c.y * s.size + c.x];
};

/** Crowns the elected king (the price is paid by the caller). */
export function elect(s: GameState, pid: number, king: King): boolean {
  if (electWhy(s, pid) || !sejmCity(s, pid)) return false;
  const m = (s.players[pid].mech ??= {}) as PolandState;
  m.king = king;
  m.from = s.turn;
  m.elections = (m.elections ?? 0) + 1;
  emit({ type: 'toast', player: pid, text: `👑 The Sejm elects the ${KINGS[king].name}: ${KINGS[king].desc} He reigns ${TERM} turns.` });
  return true;
}

/** Is a rival army pressing on Poland: a hostile, non-neutral unit within 2 tiles of a Polish city? */
export function underThreat(s: GameState, pid: number): boolean {
  const cs = citiesOf(s, pid);
  return s.units.some((u) => u.owner !== pid && !s.players[u.owner]?.neutral && hostile(s, pid, u.owner)
    && cs.some((c) => Math.max(Math.abs(c.x - u.x), Math.abs(c.y - u.y)) <= 2));
}

/** The computer's pick: at war the Hussar King, short of stars the Merchant King, else the Scholar King. */
export function aiChoice(s: GameState, pid: number): King {
  if (underThreat(s, pid)) return 0;
  if (s.players[pid].stars < AI_POOR) return 1;
  return 2;
}

export const mech: Mechanic = {
  name: 'Royal Election',
  blurb: `Golden Liberty: every city of level ${GOLDEN_LEVEL}+ pays +${GOLDEN_STARS}★ a turn. At the capital the Sejm elects a king for ${TERM} turns (first election free, then ${ELECT_COST}★): the Hussar King (mounted units +${HUSSAR_ATK} attack), the Merchant King (+${MERCHANT_STARS}★ a turn per city) or the Scholar King (techs ${SCHOLAR_OFF}★ cheaper). Each reign ends in a ${INTERREGNUM}-turn interregnum.`,

  income(s, owner) {
    return goldenIncome(s, owner) + merchantIncome(s, owner);
  },

  turnStart(s, owner) {
    if (!isPoland(s, owner)) return;
    const m = st(s, owner);
    if (m.from === undefined || m.king === undefined) return;
    if (s.turn === m.from + TERM) emit({ type: 'toast', player: owner, text: `👑 The ${KINGS[m.king].name} is dead. Interregnum: the Sejm sits again in ${INTERREGNUM} turns.` });
    else if (s.turn === m.from + TERM + INTERREGNUM) emit({ type: 'toast', player: owner, text: '👑 The interregnum is over: the Sejm may elect a new king at the capital.' });
  },

  stat(s, owner, u, stat) {
    if (stat !== 'atk' || u.owner !== owner || kingOf(s, owner) !== 0) return 0;
    return isMounted(s, u) ? HUSSAR_ATK : 0;
  },

  actions(s, owner, t): Action[] {
    if (!isPoland(s, owner) || sejmTile(s, owner) !== t) return [];
    const cost = electCost(s, owner);
    const why = electWhy(s, owner) ?? (s.players[owner].stars < cost ? 'Not enough stars' : null);
    return KINGS.map((k, i) => ({
      id: `mech:elect:${i}`, label: `Elect the ${k.name}`,
      desc: `The Sejm elects a king for ${TERM} turns: ${k.desc} Then a ${INTERREGNUM}-turn interregnum.${cost ? '' : ' The first election is free.'}`,
      cost, enabled: !why, reason: why ?? undefined, icon: 'crown',
    }));
  },

  doAction(s, owner, t, id) {
    const m = /^mech:elect:([012])$/.exec(id);
    if (!m || !isPoland(s, owner) || sejmTile(s, owner) !== t) return false;
    return elect(s, owner, Number(m[1]) as King);
  },

  ai(s, owner) {
    if (!isPoland(s, owner) || electWhy(s, owner) || !sejmCity(s, owner)) return false;
    const cost = electCost(s, owner);
    const p = s.players[owner];
    if (p.stars < cost) return false;
    const king = aiChoice(s, owner);
    p.stars -= cost; // the core charges only for human-issued actions; the AI pays here
    return elect(s, owner, king);
  },
};

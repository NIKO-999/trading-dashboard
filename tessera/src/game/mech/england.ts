import { TRIBES } from '../../data/tribes';
import { UNITS } from '../../data/units';
import { emit } from '../events';
import { hostile } from '../diplomacy';
import { citiesOf, maxHp, tileOwnerPlayer } from '../rules';
import type { Action } from '../rules';
import type { GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// Royal Navy (empire bonus) + Letters of Marque & Royal Dockyards (signature).
//
// Royal Navy: every English ship and warship (unit kinds `ship` / `warship`) attacks +NAVY_ATK.
//
// Prize money: an English ship or warship that sinks an enemy naval unit (any unit whose kind is naval) earns PRIZE★.
//
// Royal Dockyards: at the start of England's turn, every English ship or warship standing on or next to a port inside
// English borders is repaired to full HP.
//
// Privateer commission (`mech:marque`, at the capital, MARQUE_COST★): for MARQUE_TURNS turns (this one included), each
// time an English naval unit damages an enemy naval unit, the enemy's owner loses MARQUE_STEAL★ of cargo (never below
// 0; nothing is taken from an empty treasury) and England gains what was taken. It may be signed again MARQUE_COOLDOWN
// turns after it was last signed.
// Simplification: an English ship sunk by the return blow takes nothing (the theft is counted after the attack).

export const NAVY_ATK = 0.5;
export const PRIZE = 3;
export const MARQUE_COST = 5;
export const MARQUE_TURNS = 4;
export const MARQUE_COOLDOWN = 8;
export const MARQUE_STEAL = 1;

interface EnglandState { marqueFrom?: number; prizes?: number; stolen?: number; refits?: number }

const isEngland = (s: GameState, pid: number) => s.players[pid]?.tribe === 'england';
const state = (s: GameState, owner: number): EnglandState => (s.players[owner].mech ??= {}) as EnglandState;
const peek = (s: GameState, owner: number): EnglandState => (s.players[owner].mech ?? {}) as EnglandState;

/** A ship of the line: the kinds the Royal Navy bonus, prize money and the dockyards work on. */
export const isWarship = (u: Unit) => u.kind === 'ship' || u.kind === 'warship';
const naval = (u: Unit) => !!UNITS[u.kind]?.naval;

/** England's ships and warships. */
export const navy = (s: GameState, owner: number): Unit[] => s.units.filter((u) => u.owner === owner && isWarship(u));

// ---------------------------------------------------------------- dockyards

/** Ports inside `owner`'s borders. */
export const ports = (s: GameState, owner: number): Tile[] =>
  s.tiles.filter((t) => t.improvement === 'port' && tileOwnerPlayer(s, t) === owner);

/** Is `u` on or next to one of `owner`'s ports? */
export const inDock = (s: GameState, owner: number, u: Unit) =>
  ports(s, owner).some((t) => Math.max(Math.abs(t.x - u.x), Math.abs(t.y - u.y)) <= 1);

/** Repairs every English ship or warship in or beside an English port. Returns how many were repaired. */
export function refit(s: GameState, owner: number): number {
  const docks = ports(s, owner);
  if (!docks.length) return 0;
  let n = 0;
  for (const u of navy(s, owner)) {
    const full = maxHp(u);
    if (u.hp >= full || !docks.some((t) => Math.max(Math.abs(t.x - u.x), Math.abs(t.y - u.y)) <= 1)) continue;
    emit({ type: 'heal', unitId: u.id, x: u.x, y: u.y, amount: full - u.hp });
    u.hp = full;
    n++;
  }
  if (n) state(s, owner).refits = (peek(s, owner).refits ?? 0) + n;
  return n;
}

// ---------------------------------------------------------------- letters of marque

/** Is the privateer commission running this turn? */
export const marqueActive = (s: GameState, owner: number) => {
  const f = peek(s, owner).marqueFrom;
  return f !== undefined && s.turn >= f && s.turn < f + MARQUE_TURNS;
};
/** Turns of the commission left, counting this one (0 when none runs). */
export const marqueLeft = (s: GameState, owner: number) => (marqueActive(s, owner) ? peek(s, owner).marqueFrom! + MARQUE_TURNS - s.turn : 0);
/** Turns until a new commission may be signed (0 when it may be signed now). */
export const marqueWait = (s: GameState, owner: number) => {
  const f = peek(s, owner).marqueFrom;
  return f === undefined ? 0 : Math.max(0, f + MARQUE_COOLDOWN - s.turn);
};
/** Why the commission can't be signed now (stars aside), or null. */
export const marqueWhy = (s: GameState, owner: number): string | null => {
  const w = marqueWait(s, owner);
  return w > 0 ? `Ready in ${w} turn${w === 1 ? '' : 's'}` : null;
};

/** Signs the letters of marque (stars are paid by the caller). */
export function signMarque(s: GameState, owner: number): boolean {
  if (marqueWhy(s, owner)) return false;
  state(s, owner).marqueFrom = s.turn;
  emit({ type: 'toast', player: owner, text: `⚓ Letters of Marque: for ${MARQUE_TURNS} turns every enemy ship your ships damage loses ${MARQUE_STEAL}★ of cargo to the Crown.` });
  return true;
}

export const capitalTile = (s: GameState, owner: number): Tile | undefined => {
  const c = citiesOf(s, owner).find((e) => e.capital) ?? citiesOf(s, owner)[0];
  return c && s.tiles[c.y * s.size + c.x];
};

// ---------------------------------------------------------------- AI

/** A hostile, living naval empire (by its people's category) England is at war with and that has a fleet afloat. */
export const navalFoe = (s: GameState, owner: number) =>
  s.players.some((p) => p.id !== owner && p.alive && !p.neutral && TRIBES[p.tribe]?.category === 'naval' && hostile(s, owner, p.id)
    && s.units.some((u) => u.owner === p.id && naval(u) && UNITS[u.kind].atk > 0));

export const mech: Mechanic = {
  name: 'Letters of Marque & Royal Dockyards',
  blurb: `Royal Navy: ships and warships attack +${NAVY_ATK}. Sinking an enemy vessel pays ${PRIZE}★ prize money, and ships that start your turn in or beside your port are repaired to full. From the capital, sign Letters of Marque (${MARQUE_COST}★, every ${MARQUE_COOLDOWN} turns): for ${MARQUE_TURNS} turns each enemy ship your ships damage loses ${MARQUE_STEAL}★ of cargo to you.`,

  stat(s, owner, u, stat) {
    return stat === 'atk' && u.owner === owner && isEngland(s, owner) && isWarship(u) ? NAVY_ATK : 0;
  },

  turnStart(s, owner) {
    if (isEngland(s, owner)) refit(s, owner);
  },

  afterAttack(s, owner, a, d, info) {
    if (a.owner !== owner || !isEngland(s, owner) || !naval(d) || d.owner === owner) return;
    const me = s.players[owner];
    // prize money for a sunk enemy vessel
    if (info.killed && isWarship(a)) {
      me.stars += PRIZE;
      state(s, owner).prizes = (peek(s, owner).prizes ?? 0) + PRIZE;
      emit({ type: 'stars', player: owner, x: d.x, y: d.y, amount: PRIZE });
    }
    // stolen cargo under the letters of marque
    if (info.dmg > 0 && naval(a) && marqueActive(s, owner)) {
      const foe = s.players[d.owner];
      const n = Math.min(MARQUE_STEAL, Math.max(0, foe.stars));
      if (n > 0) {
        foe.stars -= n;
        me.stars += n;
        state(s, owner).stolen = (peek(s, owner).stolen ?? 0) + n;
        emit({ type: 'stars', player: owner, x: d.x, y: d.y, amount: n });
      }
    }
  },

  actions(s, owner, t): Action[] {
    if (!isEngland(s, owner) || capitalTile(s, owner) !== t) return [];
    const why = marqueWhy(s, owner) ?? (s.players[owner].stars < MARQUE_COST ? 'Not enough stars' : null);
    return [{
      id: 'mech:marque', label: 'Letters of Marque',
      desc: `Commission privateers: for ${MARQUE_TURNS} turns every enemy ship your ships damage loses ${MARQUE_STEAL}★ of cargo to you. Once every ${MARQUE_COOLDOWN} turns.`,
      cost: MARQUE_COST, enabled: !why, reason: why ?? undefined, icon: 'ship',
    }];
  },

  doAction(s, owner, t, id) {
    if (id !== 'mech:marque' || !isEngland(s, owner) || capitalTile(s, owner) !== t) return false;
    return signMarque(s, owner);
  },

  // Signs the letters when at war with a seafaring empire that has warships out, and England has a navy to use them.
  ai(s, owner) {
    if (!isEngland(s, owner)) return false;
    const p = s.players[owner];
    if (p.stars < MARQUE_COST + 2 || marqueWhy(s, owner) || !capitalTile(s, owner)) return false;
    if (!s.units.some((u) => u.owner === owner && naval(u) && UNITS[u.kind].atk > 0) || !navalFoe(s, owner)) return false;
    if (!signMarque(s, owner)) return false;
    p.stars -= MARQUE_COST; // the core charges only for human-issued actions; the AI pays here
    return true;
  },
};

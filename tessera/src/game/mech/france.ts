import { luxuriesOf } from '../goods';
import { hostile } from '../diplomacy';
import { cityById, citiesOf, tileOwnerPlayer } from '../rules';
import type { Action } from '../rules';
import type { City, GameState, Unit } from '../types';
import type { Mechanic } from './types';

// Haute Couture (the empire bonus) + Salons & the Grand Tour.
//
// Haute Couture: every developed luxury (silk, spices, wine, ivory, pearls, incense with its estate) France holds pays
// COUTURE_STARS (+1★) a turn, on top of the usual luxury income (the `income` hook).
//
// Salon: a French city of level SALON_LEVEL (3) or more may open a Salon (`mech:salon`, a city action) for SALON_COST
// (6★), once per city; the flag lives in `city.data.salon`. Each Salon city makes every tech 1★ cheaper, at most
// SALON_TECH_MAX (3★), never below 1★. That is a tribe check in rules `techCost` (salonTechOff below).
//
// Grand Tour: at the start of France's turn, every unit of another empire standing inside French borders while not
// hostile to France (a treaty partner: peace or alliance) is a party of tourists and pays France TOUR_STARS (1★), at
// most TOUR_MAX (3★) a turn. The stars are new money: the visitors' owners lose nothing.

export const COUTURE_STARS = 1;
export const SALON_LEVEL = 3;
export const SALON_COST = 6;
export const SALON_TECH_MAX = 3;
export const TOUR_STARS = 1;
export const TOUR_MAX = 3;
/** Stars the computer keeps in hand after paying for a salon. */
export const AI_RESERVE = 4;

const isFrance = (s: GameState, pid: number) => s.players[pid]?.tribe === 'france';

/** Developed luxuries France holds, all kinds together. */
export const coutureCount = (s: GameState, owner: number) => Object.values(luxuriesOf(s, owner)).reduce((a, n) => a + (n ?? 0), 0);
export const coutureIncome = (s: GameState, owner: number) => (isFrance(s, owner) ? COUTURE_STARS * coutureCount(s, owner) : 0);

export const hasSalon = (c: City) => !!c.data?.salon;
/** `owner`'s cities that hold a Salon. */
export const salonsOf = (s: GameState, owner: number): City[] => citiesOf(s, owner).filter(hasSalon);

/** The stars every French tech is cheaper by: 1 per Salon city, at most 3 (0 for other empires). */
export const salonTechOff = (s: GameState, pid: number) => (isFrance(s, pid) ? Math.min(SALON_TECH_MAX, salonsOf(s, pid).length) : 0);

/** Why city `c` can't open a Salon (stars aside), or null if it can. */
export function salonWhy(s: GameState, owner: number, c: City): string | null {
  if (!isFrance(s, owner)) return 'Only France holds salons';
  if (c.owner !== owner) return 'Not your city';
  if (hasSalon(c)) return 'This city already has its salon';
  if (c.level < SALON_LEVEL) return `Needs a city of level ${SALON_LEVEL}`;
  return null;
}

/** Open the salon (stars are paid by the caller). */
export function openSalon(s: GameState, owner: number, c: City): boolean {
  if (salonWhy(s, owner, c)) return false;
  c.data = { ...(c.data ?? {}), salon: true, salonTurn: s.turn };
  return true;
}

/** Foreign units inside `owner`'s borders whose empire is at peace (or allied) with it: the tourists. */
export const touristsOf = (s: GameState, owner: number): Unit[] =>
  s.units.filter((u) => {
    if (u.owner === owner || !s.players[u.owner]?.alive || s.players[u.owner].neutral) return false;
    if (hostile(s, owner, u.owner)) return false;
    const t = s.tiles[u.y * s.size + u.x];
    return !!t && tileOwnerPlayer(s, t) === owner;
  });

/** What the Grand Tour would pay `owner` right now. */
export const tourIncome = (s: GameState, owner: number) => (isFrance(s, owner) ? Math.min(TOUR_MAX, TOUR_STARS * touristsOf(s, owner).length) : 0);

export const mech: Mechanic = {
  name: 'Salons & the Grand Tour',
  blurb: `Haute Couture: every developed luxury pays +1★ a turn. A city of level ${SALON_LEVEL}+ may open a Salon (${SALON_COST}★, once): each makes every tech 1★ cheaper (up to ${SALON_TECH_MAX}★). Grand Tour: every unit of an empire at peace with France inside its borders pays it 1★ a turn (up to ${TOUR_MAX}★).`,

  income(s, owner) {
    return coutureIncome(s, owner);
  },

  turnStart(s, owner) {
    if (!isFrance(s, owner)) return;
    const gain = tourIncome(s, owner);
    const p = s.players[owner];
    p.stars += gain;
    p.mech = { ...(p.mech ?? {}), tour: gain, toured: Number(p.mech?.toured ?? 0) + gain };
  },

  actions(s, owner, t): Action[] {
    if (!isFrance(s, owner) || t.cityId === null) return [];
    const c = cityById(s, t.cityId);
    if (!c || c.owner !== owner || hasSalon(c)) return [];
    const why = salonWhy(s, owner, c);
    const poor = s.players[owner].stars < SALON_COST;
    return [{
      id: 'mech:salon', label: 'Open a Salon',
      desc: `Philosophers, wits and patrons gather in the city's finest drawing room: every tech costs 1★ less for each Salon city (up to ${SALON_TECH_MAX}★). Needs level ${SALON_LEVEL}. One per city.`,
      cost: SALON_COST, icon: 'temple', enabled: !why && !poor, reason: why ?? (poor ? 'Not enough stars' : undefined),
    }];
  },

  doAction(s, owner, t, id) {
    if (id !== 'mech:salon' || t.cityId === null) return false;
    const c = cityById(s, t.cityId);
    return !!c && openSalon(s, owner, c);
  },

  // open a salon in the biggest city that lacks one, while the discount is not yet full and a reserve is kept
  ai(s, owner) {
    if (!isFrance(s, owner)) return false;
    const p = s.players[owner];
    if (p.stars < SALON_COST + AI_RESERVE || salonsOf(s, owner).length >= SALON_TECH_MAX) return false;
    const c = citiesOf(s, owner).filter((x) => !salonWhy(s, owner, x)).sort((a, b) => b.level - a.level || a.id - b.id)[0];
    if (!c) return false;
    p.stars -= SALON_COST; // the core charges only for human-issued actions; the AI pays here
    return openSalon(s, owner, c);
  },
};

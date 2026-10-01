import { emit } from '../events';
import { citiesOf, maxHp, tileOwnerPlayer, addPop } from '../rules';
import type { Action } from '../rules';
import { roadNetwork } from '../network';
import type { City, GameState, Tile } from '../types';
import type { Mechanic } from './types';

// Golden Stool (empire bonus) + Gold Dust & the Great Roads (signature).
//
// Golden Stool (`stat`): the Sika Dwa Kofi, the soul of the Asante nation, rests at the capital: every Asante unit
// standing in its own capital defends +STOOL_DEF.
//
// Gold Dust (`turnStart`): every mine inside Asante borders also washes out GOLD_PER_MINE gold dust a turn, kept in
// `player.mech.gold` (at most MAX_GOLD). At the capital the dust is weighed out with brass weights (`mech:gold:<n>`):
//   0: SPEND[0].dust dust → +SPEND_STARS★ (sold to the traders);
//   1: SPEND[1].dust dust → every Asante unit heals HEAL_HP at once (the court pays the healers and the shrines);
//   2: SPEND[2].dust dust → +1 population in every Asante city (a great Odwira festival).
//
// Great Roads (`income`): the Asantehene's great roads ran out from Kumasi to every province: each Asante city linked
// to the capital by an unbroken road (see game/network `roadNetwork`) pays +ROAD_STARS★ a turn.

export const STOOL_DEF = 2;
export const GOLD_PER_MINE = 1;
export const MAX_GOLD = 20;
export const SPEND_STARS = 8;
export const HEAL_HP = 5;
export const ROAD_STARS = 1;
/** The three ways to spend gold dust at the capital, by index. */
export const SPEND: readonly { dust: number; label: string; icon: string }[] = [
  { dust: 5, label: 'Sell Gold Dust', icon: 'market' },
  { dust: 8, label: 'Pay the Healers', icon: 'heal' },
  { dust: 10, label: 'Odwira Festival', icon: 'temple' },
];
/** How hurt (total missing HP) the army must be before the computer pays the healers. */
export const AI_HEAL_AT = 15;
/** The computer holds a festival once it has at least this many cities. */
export const AI_FEAST_CITIES = 3;

interface AsanteState { gold?: number; mined?: number; spent?: number }

const isAsante = (s: GameState, pid: number) => s.players[pid]?.tribe === 'ashanti';
const state = (s: GameState, owner: number): AsanteState => (s.players[owner].mech ??= {}) as AsanteState;
const peek = (s: GameState, owner: number): AsanteState => (s.players[owner].mech ?? {}) as AsanteState;
const cityOn = (s: GameState, t: Tile): City | undefined => (t.cityId === null ? undefined : s.cities.find((c) => c.id === t.cityId));

/** `owner`'s capital. */
export const capitalOf = (s: GameState, owner: number): City | undefined => citiesOf(s, owner).find((c) => c.capital);

// ---------------------------------------------------------------- Golden Stool

/** Is (x, y) the tile of `owner`'s capital? */
export const onCapital = (s: GameState, owner: number, x: number, y: number) => {
  const c = capitalOf(s, owner);
  return !!c && c.x === x && c.y === y;
};

// ---------------------------------------------------------------- Gold dust

/** Gold dust in the treasury. */
export const gold = (s: GameState, owner: number) => peek(s, owner).gold ?? 0;

/** Mines inside `owner`'s borders. */
export const mines = (s: GameState, owner: number): Tile[] => s.tiles.filter((t) => t.improvement === 'mine' && tileOwnerPlayer(s, t) === owner);

/** Gold dust the mines wash out each turn. */
export const dustPerTurn = (s: GameState, owner: number) => (isAsante(s, owner) ? GOLD_PER_MINE * mines(s, owner).length : 0);

/** Add a turn's gold dust (capped); returns the amount gained. */
export function mineGold(s: GameState, owner: number): number {
  if (!isAsante(s, owner)) return 0;
  const st = state(s, owner), before = st.gold ?? 0;
  st.gold = Math.min(MAX_GOLD, before + dustPerTurn(s, owner));
  const got = st.gold - before;
  st.mined = (st.mined ?? 0) + got;
  return got;
}

/** Hurt HP that a heal would restore to `owner`'s army. */
export const missingHp = (s: GameState, owner: number) => s.units.filter((u) => u.owner === owner).reduce((n, u) => n + Math.max(0, Math.min(HEAL_HP, maxHp(u) - u.hp)), 0);

/** Why gold option `n` can't be spent at city `c`, or null. */
export function spendWhy(s: GameState, owner: number, c: City | undefined, n: number): string | null {
  if (!isAsante(s, owner)) return 'Only Asante weighs gold dust';
  if (!c || c.owner !== owner || !c.capital) return 'Only at your capital';
  const opt = SPEND[n];
  if (!opt) return 'Unknown';
  if (gold(s, owner) < opt.dust) return `Needs ${opt.dust} gold dust`;
  if (n === 1 && missingHp(s, owner) === 0) return 'No one is hurt';
  return null;
}

/** Spend gold dust on option `n` at the capital `c`. */
export function spendGold(s: GameState, owner: number, c: City, n: number): boolean {
  if (spendWhy(s, owner, c, n)) return false;
  const st = state(s, owner), opt = SPEND[n];
  st.gold = (st.gold ?? 0) - opt.dust;
  st.spent = (st.spent ?? 0) + opt.dust;
  const p = s.players[owner];
  if (n === 0) {
    p.stars += SPEND_STARS;
    emit({ type: 'stars', player: owner, x: c.x, y: c.y, amount: SPEND_STARS });
    emit({ type: 'toast', player: owner, text: `⚖️ ${opt.dust} gold dust weighed out to the traders at ${c.name}: +${SPEND_STARS}★.` });
  } else if (n === 1) {
    for (const u of s.units) if (u.owner === owner) u.hp = Math.min(maxHp(u), u.hp + HEAL_HP);
    emit({ type: 'toast', player: owner, text: `⚖️ The court pays the healers in gold dust: every Asante unit heals ${HEAL_HP} HP.` });
  } else {
    for (const k of citiesOf(s, owner)) { emit({ type: 'harvest', player: owner, x: k.x, y: k.y, pop: 1 }); addPop(s, k, 1); }
    emit({ type: 'toast', player: owner, text: `⚖️ An Odwira festival is paid for in gold dust: +1 population in every Asante city.` });
  }
  return true;
}

// ---------------------------------------------------------------- Great Roads

/** `owner`'s cities joined to the capital by an unbroken road (the capital itself not counted). */
export function roadCities(s: GameState, owner: number): City[] {
  const cap = capitalOf(s, owner);
  if (!cap) return [];
  const ids = new Set(roadNetwork(s, cap).linked);
  return citiesOf(s, owner).filter((c) => c.id !== cap.id && ids.has(c.id));
}

export const roadIncome = (s: GameState, owner: number) => (isAsante(s, owner) ? ROAD_STARS * roadCities(s, owner).length : 0);

const spendAction = (s: GameState, owner: number, c: City, n: number): Action => {
  const opt = SPEND[n], why = spendWhy(s, owner, c, n);
  const desc = n === 0 ? `Sell ${opt.dust} gold dust to the traders for +${SPEND_STARS}★.`
    : n === 1 ? `Pay the healers ${opt.dust} gold dust: every Asante unit heals ${HEAL_HP} HP at once.`
    : `Hold an Odwira festival for ${opt.dust} gold dust: +1 population in every Asante city.`;
  return { id: `mech:gold:${n}`, label: `${opt.label} (${opt.dust}✦)`, cost: 0, icon: opt.icon, enabled: !why, reason: why ?? undefined, desc: `${desc} Gold dust: ${gold(s, owner)}/${MAX_GOLD}.` };
};

export const mech: Mechanic = {
  name: 'Gold Dust & the Great Roads',
  blurb: `Every mine also yields ${GOLD_PER_MINE} gold dust a turn (up to ${MAX_GOLD}). At the capital, weigh it out: ${SPEND[0].dust} dust for +${SPEND_STARS}★, ${SPEND[1].dust} to heal every unit ${HEAL_HP} HP, or ${SPEND[2].dust} for +1 population in every city. Great Roads: each city joined to the capital by an unbroken road pays +${ROAD_STARS}★ a turn. Golden Stool: units in your capital defend +${STOOL_DEF}.`,

  turnStart(s, owner) {
    mineGold(s, owner);
  },

  income(s, owner) {
    return roadIncome(s, owner);
  },

  stat(s, owner, u, stat) {
    if (stat !== 'def' || u.owner !== owner || !isAsante(s, owner)) return 0;
    return onCapital(s, owner, u.x, u.y) ? STOOL_DEF : 0;
  },

  actions(s, owner, t): Action[] {
    const c = cityOn(s, t);
    if (!isAsante(s, owner) || !c || c.owner !== owner || !c.capital) return [];
    return SPEND.map((_, n) => spendAction(s, owner, c, n));
  },

  doAction(s, owner, t, id) {
    const m = /^mech:gold:(\d)$/.exec(id);
    if (!m) return false;
    const c = cityOn(s, t);
    return !!c && spendGold(s, owner, c, +m[1]);
  },

  // Heals a battered army first, then feasts once the empire is wide, else sells the dust before it overflows the cap.
  ai(s, owner) {
    if (!isAsante(s, owner)) return false;
    const cap = capitalOf(s, owner);
    if (!cap) return false;
    if (!spendWhy(s, owner, cap, 1) && missingHp(s, owner) >= AI_HEAL_AT) return spendGold(s, owner, cap, 1);
    if (!spendWhy(s, owner, cap, 2) && citiesOf(s, owner).length >= AI_FEAST_CITIES) return spendGold(s, owner, cap, 2);
    const g = gold(s, owner);
    if (!spendWhy(s, owner, cap, 0) && (g + dustPerTurn(s, owner) > MAX_GOLD || (citiesOf(s, owner).length < AI_FEAST_CITIES && g >= SPEND[0].dust))) return spendGold(s, owner, cap, 0);
    return false;
  },
};

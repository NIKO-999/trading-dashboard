import { UNITS } from '../../data/units';
import { TECH_BY_ID } from '../../data/techs';
import { emit } from '../events';
import { needWhy, spendNeeds } from '../goods';
import { dist, isWater, neighbors, tileAt } from '../grid';
import { spawnUnit } from '../mapgen';
import { citiesOf, cityById, def, eraWhy, hasTech, moveOptions, moveUnit, trainCost, unitCap } from '../rules';
import type { Action } from '../rules';
import type { City, GameState, Tile, Unit, UnitKind } from '../types';
import type { Mechanic } from './types';

// Merchant Republic & The Arsenal.
//
// Merchant Republic (the empire bonus): +1★ a turn for every full 10★ in the treasury, at most +4★. The treasury is
// read at the moment income is computed (the start of the Venetian turn, before that turn's income is added).
//
// The Arsenal: a Venetian city with a Port inside its borders may launch one warship (`mech:arsenal`) from the Arsenal,
// a Trireme once Navigation is known, else a Galley (Sailing). It costs half the normal price (trainCost, rounded up)
// and needs the same techs, era and stockpile as training. The ship is launched empty onto a free water tile beside one
// of the city's Ports (as the Swahili dhow), takes one of the city's unit slots like a trained unit, and each city may
// use its Arsenal once every 4 turns.
//
// Mercantile convoy: at the start of each Venetian turn, every Venetian ship (any naval unit) standing next to a
// Venetian city unloads for +1★, at most +3★ a turn. Counted in the same income as the interest.

export const INTEREST_STEP = 10;
export const INTEREST_CAP = 4;
export const ARSENAL_PCT = 0.5;
export const ARSENAL_COOLDOWN = 4;
export const CONVOY_CAP = 3;

const isVenice = (s: GameState, pid: number) => s.players[pid]?.tribe === 'venice';

// ---------------------------------------------------------------- the treasury

/** +1★ for every full 10★ held, at most +4★. */
export const interest = (s: GameState, owner: number) =>
  Math.min(INTEREST_CAP, Math.floor(Math.max(0, s.players[owner].stars) / INTEREST_STEP));

// ---------------------------------------------------------------- the convoy

/** Venetian ships beside one of their own cities, unloading this turn (all of them; only CONVOY_CAP pay). */
export const convoyShips = (s: GameState, owner: number): Unit[] => {
  const cities = citiesOf(s, owner);
  return s.units.filter((u) => u.owner === owner && def(u).naval && cities.some((c) => dist(c.x, c.y, u.x, u.y) === 1))
    .sort((a, b) => a.id - b.id);
};
export const convoyIncome = (s: GameState, owner: number) => Math.min(CONVOY_CAP, convoyShips(s, owner).length);

// ---------------------------------------------------------------- the arsenal

/** The ship the Arsenal builds now: a warship with Navigation, a ship with Sailing, else a ship still to be unlocked. */
export const arsenalKind = (s: GameState, owner: number): UnitKind => (hasTech(s, owner, UNITS.warship.tech) ? 'warship' : 'ship');
export const arsenalCost = (s: GameState, owner: number, k: UnitKind = arsenalKind(s, owner)) => Math.ceil(trainCost(s, owner, k) * ARSENAL_PCT);

/** Ports inside city `c`'s borders. */
export const portsOf = (s: GameState, c: City): Tile[] => s.tiles.filter((t) => t.improvement === 'port' && t.owner === c.id);

/** A free water tile beside one of the city's ports (the first, top-left first), where the new ship is launched. */
export function launchTile(s: GameState, c: City): Tile | undefined {
  for (const port of portsOf(s, c)) {
    const w = neighbors(s, port.x, port.y).filter((n) => isWater(n) && !s.units.some((u) => u.x === n.x && u.y === n.y)).sort((a, b) => a.y - b.y || a.x - b.x)[0];
    if (w) return w;
  }
  return undefined;
}

/** Turns until city `c` may use its Arsenal again (0 = ready). */
export const arsenalWait = (s: GameState, c: City) => {
  const last = c.data?.arsenal as number | undefined;
  return last === undefined ? 0 : Math.max(0, last + ARSENAL_COOLDOWN - s.turn);
};

/** Why `owner` can't use the Arsenal of city `c` now (stars aside), or null. */
export function arsenalCheck(s: GameState, owner: number, c: City): string | null {
  if (c.owner !== owner) return 'Not your city';
  if (!portsOf(s, c).length) return 'Needs a Port inside the city borders';
  const k = arsenalKind(s, owner);
  if (!hasTech(s, owner, UNITS[k].tech)) return `Needs ${TECH_BY_ID[UNITS[k].tech!]?.name ?? UNITS[k].tech}`;
  const era = eraWhy(s, owner, k) ?? needWhy(s, owner, k);
  if (era) return era;
  const wait = arsenalWait(s, c);
  if (wait) return `The Arsenal is refitting: ready in ${wait} turn${wait === 1 ? '' : 's'}`;
  if (c.units >= unitCap(c)) return `City supports ${unitCap(c)} units`;
  if (!launchTile(s, c)) return 'No free water beside the port';
  return null;
}

/** Launch the ship (stars are charged by the caller). */
export function launch(s: GameState, owner: number, c: City): Unit | null {
  if (arsenalCheck(s, owner, c)) return null;
  const k = arsenalKind(s, owner);
  const sea = launchTile(s, c)!;
  spendNeeds(s, owner, k);
  const u = spawnUnit(s, k, owner, sea.x, sea.y, c.id); // takes a unit slot, like a trained unit
  c.data = { ...(c.data ?? {}), arsenal: s.turn };
  const p = s.players[owner];
  p.mech = { ...(p.mech ?? {}), launched: Number(p.mech?.launched ?? 0) + 1 };
  emit({ type: 'harvest', player: owner, x: sea.x, y: sea.y, pop: 0 });
  return u;
}

/** Cities whose Arsenal is ready to launch (render and UI). */
export const arsenalReady = (s: GameState, owner: number): City[] => citiesOf(s, owner).filter((c) => !arsenalCheck(s, owner, c));

// ---------------------------------------------------------------- the mechanic

export const mech: Mechanic = {
  name: 'Merchant Republic & The Arsenal',
  blurb: 'Every 10★ in the treasury earns +1★ a turn (at most +4★). A city with a Port launches a warship from the Arsenal at half price, once every 4 turns. Ships beside your cities unload +1★ each (at most +3★).',

  income(s, owner) {
    if (!isVenice(s, owner)) return 0;
    return interest(s, owner) + convoyIncome(s, owner);
  },

  // Show the convoy unloading: a star over each paying ship, and remember the totals for the readout.
  turnStart(s, owner) {
    if (!isVenice(s, owner) || s.turn === 0) return;
    const paid = convoyShips(s, owner).slice(0, CONVOY_CAP);
    for (const u of paid) emit({ type: 'stars', player: owner, x: u.x, y: u.y, amount: 1 });
    const p = s.players[owner];
    p.mech = { ...(p.mech ?? {}), convoyStars: Number(p.mech?.convoyStars ?? 0) + paid.length };
  },

  actions(s, owner, t): Action[] {
    if (!isVenice(s, owner) || t.cityId === null) return [];
    const c = cityById(s, t.cityId);
    if (!c || c.owner !== owner || !portsOf(s, c).length) return [];
    const k = arsenalKind(s, owner);
    const cost = arsenalCost(s, owner, k);
    const tech = UNITS[k].tech;
    const why = arsenalCheck(s, owner, c) ?? (s.players[owner].stars < cost ? 'Not enough stars' : null);
    const d = UNITS[k];
    return [{
      id: 'mech:arsenal', label: `Arsenal: launch ${d.name}`, cost, icon: 'ship', enabled: !why, reason: why ?? undefined,
      needs: hasTech(s, owner, tech) ? undefined : tech ?? undefined,
      desc: `The Arsenal builds a ${d.name} (⚔${d.atk} 🛡${d.def} ❤${d.hp}) at half price, launched beside the port. Takes a unit slot; once every ${ARSENAL_COOLDOWN} turns per city.`,
    }];
  },

  doAction(s, owner, t, id) {
    if (id !== 'mech:arsenal' || !isVenice(s, owner) || t.cityId === null) return false;
    const c = cityById(s, t.cityId);
    return !!c && !!launch(s, owner, c);
  },

  ai(s, owner) {
    if (!isVenice(s, owner)) return false;
    const p = s.players[owner];
    // 1. Launch from a ready Arsenal, keeping 10★ back so the treasury still earns interest.
    const k = arsenalKind(s, owner);
    const cost = arsenalCost(s, owner, k);
    if (hasTech(s, owner, UNITS[k].tech) && p.stars >= cost + INTEREST_STEP) {
      const c = arsenalReady(s, owner)[0];
      if (c && launch(s, owner, c)) { p.stars -= cost; return true; } // the core charges only human actions
    }
    // 2. Bring an idle empty ship home to unload while the convoy has room.
    if (convoyShips(s, owner).length >= CONVOY_CAP) return false;
    const cities = citiesOf(s, owner);
    if (!cities.length) return false;
    const beside = (x: number, y: number) => cities.some((c) => dist(c.x, c.y, x, y) === 1);
    for (const u of s.units) {
      if (u.owner !== owner || !def(u).naval || u.moved || u.carrying || beside(u.x, u.y)) continue;
      if (s.units.some((e) => e.owner !== owner && dist(e.x, e.y, u.x, u.y) <= 2)) continue; // busy fighting
      const opt = moveOptions(s, u).find((o) => !o.embark && !o.disembark && isWater(tileAt(s, o.x, o.y)!) && beside(o.x, o.y));
      if (opt && moveUnit(s, u, opt.x, opt.y)) return true;
    }
    return false;
  },
};

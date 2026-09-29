// Persia: Royal Road Network & Immortals + Satrap Extraction.
//
// (A) Immortals: "when one falls, another takes his place". Every Immortal of Persia that dies is queued in
//     `player.mech.fallen` and, at the start of Persia's next turn, respawns at the capital (or the nearest free land tile
//     beside it) for free, at 2/3 health. It only happens while Persia's Star income is positive, at most MAX_RESPAWN per
//     turn, and only while a supply slot is free (the returning man takes the slot his predecessor freed, in his home city
//     or else the capital; with the army cap full nobody comes back and he waits in the queue). The queue is capped so a
//     long-dead army cannot flood back.
// (B) Satrap Extraction: a city Persia conquered (`city.data.satrap = true`) is a satrapy. Its tile Star yields are doubled:
//     every Persian city earns +1★ per mine and per port in its territory (markets pay through the core rules, +1★ each),
//     and a satrapy pays that again (its markets, mines and ports yield double). Order costs Population though: a satrapy
//     with no friendly unit standing in it loses `1 + floor(level/3)` population progress every turn (it never loses a
//     level, it just cannot grow). A garrison stops the drain.
//     Simplification: the game has no per-tile Star yields, so "resource tile" Star yield = market, mine, port improvements.
import { area, isLand, tileAt } from '../grid';
import { citiesOf, cityById, doAction, income, trainCost, trainableKinds, unitAt, unitCap } from '../rules';
import { spawnUnit } from '../mapgen';
import { UNITS } from '../../data/units';
import type { City, GameState } from '../types';
import type { Mechanic } from './types';

export const MAX_RESPAWN = 2;
export const MAX_QUEUE = 4;
export const RESPAWN_HP = 2 / 3;

interface PersiaState { fallen: number[] } // home city id (or -1) of each fallen Immortal, oldest first

export function stateOf(s: GameState, owner: number): PersiaState {
  const p = s.players[owner];
  p.mech ??= {};
  if (!Array.isArray(p.mech.fallen)) p.mech.fallen = [];
  return p.mech as unknown as PersiaState;
}

export const isSatrapy = (c: City) => c.data?.satrap === true;
export const garrisoned = (s: GameState, c: City) => { const u = unitAt(s, c.x, c.y); return !!u && u.owner === c.owner; };
export const drainOf = (c: City) => 1 + Math.floor(c.level / 3);
export const fallenCount = (s: GameState, owner: number) => stateOf(s, owner).fallen.length;
export const satrapies = (s: GameState, owner: number) => citiesOf(s, owner).filter(isSatrapy);

/** Stars per turn from the mines and ports of one city (markets are paid by the core). */
const yieldOf = (s: GameState, c: City) =>
  s.tiles.filter((t) => t.owner === c.id && (t.improvement === 'mine' || t.improvement === 'port')).length;
const marketsOf = (s: GameState, c: City) => s.tiles.filter((t) => t.owner === c.id && t.improvement === 'market').length;

export function mechIncome(s: GameState, owner: number): number {
  let n = 0;
  for (const c of citiesOf(s, owner)) {
    n += yieldOf(s, c);
    if (isSatrapy(c)) n += yieldOf(s, c) + marketsOf(s, c); // doubled: mines/ports again, and the core's market star again
  }
  return n;
}

/** A free land tile at or beside the capital. */
function spawnSpot(s: GameState, cap: City) {
  for (let r = 0; r <= 2; r++)
    for (const t of area(s, cap.x, cap.y, r))
      if (isLand(t) && t.terrain !== 'mountain' && !unitAt(s, t.x, t.y)) return t;
  return undefined;
}

function respawn(s: GameState, owner: number) {
  const st = stateOf(s, owner);
  const cap = citiesOf(s, owner).find((c) => c.capital) ?? citiesOf(s, owner)[0];
  if (!cap) { st.fallen = []; return; }
  if (!st.fallen.length || income(s, owner) + mechIncome(s, owner) <= 0) return;
  let done = 0;
  while (st.fallen.length && done < MAX_RESPAWN) {
    const t = spawnSpot(s, cap);
    if (!t) break;
    const wanted = cityById(s, st.fallen[0]);
    const home = [wanted, cap].find((c) => c && c.owner === owner && c.units < unitCap(c)) ?? null;
    if (!home) break; // the army cap is full: nobody comes back yet
    st.fallen.shift();
    const u = spawnUnit(s, 'immortal', owner, t.x, t.y, home.id);
    u.hp = Math.max(1, Math.ceil(UNITS.immortal.hp * RESPAWN_HP));
    u.moved = u.attacked = false;
    done++;
  }
}

/** Population lost to the unrest in every ungarrisoned satrapy (never a level). */
function unrest(s: GameState, owner: number) {
  for (const c of satrapies(s, owner)) {
    if (garrisoned(s, c)) continue;
    c.pop = Math.max(0, c.pop - drainOf(c));
  }
}

export const mech: Mechanic = {
  name: 'Royal Road Network & Satrap Extraction',
  blurb: 'A fallen Immortal returns at the capital next turn while Stars flow; conquered cities pay double from their tiles but bleed Population unless garrisoned.',

  setup(s, owner) { stateOf(s, owner); },

  turnStart(s, owner) {
    respawn(s, owner);
    unrest(s, owner);
  },

  unitDied(s, owner, u) {
    if (u.owner !== owner || u.kind !== 'immortal') return;
    const st = stateOf(s, owner);
    if (st.fallen.length < MAX_QUEUE) st.fallen.push(u.homeCity ?? -1);
  },

  cityCaptured(s, owner, c, from) {
    if (c.owner === owner) { c.data = { ...(c.data ?? {}), satrap: true }; return; }
    if (from === owner && c.data) delete c.data.satrap;
  },

  income(s, owner) { return mechIncome(s, owner); },

  // The AI garrisons its restless satrapies: train the cheapest soldier in an empty one.
  ai(s, owner) {
    const p = s.players[owner];
    for (const c of satrapies(s, owner)) {
      if (garrisoned(s, c) || c.units >= unitCap(c)) continue;
      const kinds = trainableKinds(s, owner)
        .filter((k) => trainCost(s, owner, k) <= p.stars - 1 && (UNITS[k].tech === null || p.techs.includes(UNITS[k].tech!)))
        .sort((a, b) => trainCost(s, owner, a) - trainCost(s, owner, b));
      const t = tileAt(s, c.x, c.y)!;
      for (const k of kinds) if (doAction(s, owner, t, `train:${k}`)) return true;
    }
    return false;
  },
};

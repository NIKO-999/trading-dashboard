import { emit } from '../events';
import { STOCK_CAP, stockOf } from '../goods';
import { citiesOf, def } from '../rules';
import type { Action } from '../rules';
import type { City, GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// Winter March & Falun Copper (Sweden).
//
// Empire bonus (Carolean Drill): Swedish units become veterans after 2 kills instead of 3. That is the tribe-aware
// threshold `veteranAt` in rules (the only shared edit); VETERAN_KILLS below documents the number.
//
// Winter March: a Swedish land unit that starts its move on tundra or ice moves +WINTER_MOVE (the `stat` hook, read off
// the tile it stands on). Ice (`ice` terrain, laid by the Inuit and frozen by heroes) is already land for everyone in
// this codebase (grid `isLand` is "not shallow/ocean"), so Swedish units walk onto it like any other ground; no move-step
// hook is needed for that.
//
// Falun Copper (`mech:copper`, a city action, COPPER_COST★, each city once every COPPER_EVERY turns): needs a Mine in the
// city's borders. The great copper mountain gives +COPPER_IRON Iron to the stockpile (never above STOCK_CAP; a full
// stockpile blocks the action) and the red copper roofs sold abroad pay back COPPER_STARS★. The turn it last ran is kept
// in `city.data.copper`.

export const VETERAN_KILLS = 2;
export const WINTER_MOVE = 1;
export const WINTER_TERRAIN: Tile['terrain'][] = ['tundra', 'ice'];
export const COPPER_COST = 3;
export const COPPER_EVERY = 5;
export const COPPER_IRON = 1;
export const COPPER_STARS = 3;

const isSwede = (s: GameState, pid: number) => s.players[pid]?.tribe === 'sweden';
const cityOn = (s: GameState, t: Tile): City | undefined => (t.cityId === null ? undefined : s.cities.find((c) => c.id === t.cityId));

/** Is unit `u` a land unit standing on tundra or ice (Winter March applies)? */
export function onWinter(s: GameState, u: Unit): boolean {
  if (u.carrying || def(u).naval) return false;
  const t = s.tiles[u.y * s.size + u.x];
  return !!t && WINTER_TERRAIN.includes(t.terrain);
}

/** Turns until city `c` may sell copper again (0: now). */
export function copperIn(s: GameState, c: City): number {
  const last = c.data?.copper;
  return typeof last === 'number' ? Math.max(0, last + COPPER_EVERY - s.turn) : 0;
}

/** Did city `c` sell copper this turn? */
export const copperNow = (s: GameState, c: City) => c.data?.copper === s.turn;

/** Does city `c` have a Mine in its borders? */
export const hasMine = (s: GameState, c: City) => s.tiles.some((t) => t.owner === c.id && t.improvement === 'mine');

/** Why Falun Copper can't run at city `c` (stars excluded), or null. */
export function copperWhy(s: GameState, owner: number, c: City | undefined): string | null {
  if (!isSwede(s, owner)) return 'Only Sweden works the Falun copper';
  if (!c || c.owner !== owner) return 'Only in your own city';
  if (!hasMine(s, c)) return 'Needs a Mine in the city\'s borders';
  const wait = copperIn(s, c);
  if (wait > 0) return `The copper returns in ${wait} turn${wait > 1 ? 's' : ''}`;
  if (stockOf(s.players[owner]).iron >= STOCK_CAP) return `Iron stockpile is full (${STOCK_CAP})`;
  return null;
}

/** Run Falun Copper at city `c` (the cost is already paid): +1 Iron (capped) and +3★. */
export function sellCopper(s: GameState, owner: number, c: City): boolean {
  if (copperWhy(s, owner, c)) return false;
  c.data = { ...(c.data ?? {}), copper: s.turn };
  const p = s.players[owner];
  const st = stockOf(p);
  st.iron = Math.min(STOCK_CAP, st.iron + COPPER_IRON);
  p.stars += COPPER_STARS;
  emit({ type: 'stars', player: owner, x: c.x, y: c.y, amount: COPPER_STARS });
  emit({ type: 'toast', player: owner, text: `⛏ Falun copper from ${c.name}: +${COPPER_IRON} Iron, and red copper roofs sold abroad for +${COPPER_STARS}★.` });
  return true;
}

export const mech: Mechanic = {
  name: 'Winter March & Falun Copper',
  blurb: `Carolean Drill: your units become veterans after ${VETERAN_KILLS} kills (not 3). Winter March: land units that start on tundra or ice move +${WINTER_MOVE}, and ice is open road to them. Falun Copper (${COPPER_COST}★ in a city with a Mine, once every ${COPPER_EVERY} turns): +${COPPER_IRON} Iron to the stockpile and +${COPPER_STARS}★ for the red copper roofs sold abroad.`,

  stat(s, owner, u, stat) {
    if (stat !== 'move' || u.owner !== owner || !isSwede(s, owner)) return 0;
    return onWinter(s, u) ? WINTER_MOVE : 0;
  },

  actions(s, owner, t): Action[] {
    const c = cityOn(s, t);
    if (!isSwede(s, owner) || !c || c.owner !== owner) return [];
    const why = copperWhy(s, owner, c) ?? (s.players[owner].stars < COPPER_COST ? 'Not enough stars' : null);
    return [{
      id: 'mech:copper', label: 'Falun Copper', cost: COPPER_COST, icon: 'mine', enabled: !why, reason: why ?? undefined,
      desc: `Work the great copper mountain: +${COPPER_IRON} Iron to the stockpile (max ${STOCK_CAP}) and +${COPPER_STARS}★ for red copper roofs sold abroad. Needs a Mine in the city's borders; once every ${COPPER_EVERY} turns per city.`,
    }];
  },

  doAction(s, owner, t, id) {
    if (id !== 'mech:copper') return false;
    const c = cityOn(s, t);
    return !!c && sellCopper(s, owner, c);
  },

  // Copper pays its own way back (3★ in, 3★ out), so the computer works every ready mine city while iron is short.
  ai(s, owner) {
    if (!isSwede(s, owner)) return false;
    const p = s.players[owner];
    if (p.stars < COPPER_COST) return false;
    const c = citiesOf(s, owner).find((c) => !copperWhy(s, owner, c));
    if (!c) return false;
    p.stars -= COPPER_COST; // the core charges only for human-issued actions; the AI pays here
    return sellCopper(s, owner, c);
  },
};

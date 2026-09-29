// Rome: Castra & Via Appia.
//  - Every tile a Roman land combat unit ends a move on becomes a stone road, free (the road is laid the moment the game
//    next looks at the unit: when its tile menu is built, when it fights, or at the end of the turn).
//  - A Roman unit standing on a paved road tile may dig in (`mech:castra`, 1★): the tile gets a fort (`improvement: 'fort'`,
//    `data.castra` = the owner) worth +2 defence to the Roman unit on it. The fort stands only while a Roman unit is on
//    it: when the unit leaves or dies the fort is dismantled (the road stays).
import { dist, isLand, tileAt } from '../grid';
import { def, unitAt } from '../rules';
import type { Action } from '../rules';
import type { GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

export const CASTRA_COST = 1;
export const CASTRA_DEFENCE = 2;

/** A tile holding a Roman fort. */
export const isCastra = (t: Tile) => t.improvement === 'fort' && typeof t.data?.castra === 'number';

const isRoman = (s: GameState, u: Unit, owner: number) => u.owner === owner && s.players[owner].tribe === 'rome';
const isCombat = (u: Unit) => { const d = def(u); return !d.naval && d.atk > 0 && u.kind !== 'explorer' && !u.carrying; };
const pavable = (t: Tile) => isLand(t) && t.terrain !== 'mountain' && t.cityId === null && !t.road;

/** Lay a road under every combat unit of `owner` that has moved this turn. */
function pave(s: GameState, owner: number) {
  for (const u of s.units) {
    if (u.owner !== owner || !u.moved || !isCombat(u)) continue;
    const t = tileAt(s, u.x, u.y);
    if (t && pavable(t)) t.road = true;
  }
}

/** Dismantle forts nobody holds, and unfortify units that left theirs. */
function sweep(s: GameState) {
  for (const t of s.tiles) {
    if (!isCastra(t)) continue;
    const u = unitAt(s, t.x, t.y);
    if (!u || u.owner !== t.data!.castra) { t.improvement = null; delete t.data!.castra; }
  }
  for (const u of s.units) {
    if (!u.fortified || s.players[u.owner].tribe !== 'rome') continue;
    const t = tileAt(s, u.x, u.y);
    if (!t || !isCastra(t)) u.fortified = false;
  }
}

/** Why this Roman unit cannot dig in where it stands (null when it can). */
function castraCheck(s: GameState, owner: number, t: Tile): string | null {
  const u = unitAt(s, t.x, t.y);
  if (!u || !isRoman(s, u, owner) || !isCombat(u)) return 'Needs a Roman soldier here';
  if (t.cityId !== null || !isLand(t) || t.terrain === 'mountain') return 'Cannot fortify here';
  if (!t.road) return 'Needs a paved road';
  if (t.improvement) return 'The tile is already built on';
  return null;
}

/** Raise the fort (the star cost is charged by the caller: core `doAction` does it before dispatching). */
function fortify(t: Tile, u: Unit, owner: number) {
  t.improvement = 'fort';
  t.data = { ...(t.data ?? {}), castra: owner };
  u.fortified = true;
  u.moved = true; // digging in takes the rest of the unit's move
  return true;
}

export const mech: Mechanic = {
  name: 'Castra & Via Appia',
  blurb: 'Soldiers pave roads as they march, and units on paved roads can dig in as mini-forts.',

  turnStart(s, owner) { sweep(s); pave(s, owner); },
  turnEnd(s, owner) { pave(s, owner); sweep(s); },

  stat(s, owner, u, stat) {
    if (stat !== 'def' || !isRoman(s, u, owner) || !u.fortified) return 0;
    const t = tileAt(s, u.x, u.y);
    return t && isCastra(t) && t.data!.castra === owner ? CASTRA_DEFENCE : 0;
  },

  afterAttack(s, owner) { pave(s, owner); sweep(s); },
  unitDied(s) { sweep(s); },

  actions(s, owner, t): Action[] {
    pave(s, owner); // a unit that just marched has its road by the time its tile is opened
    const u = unitAt(s, t.x, t.y);
    if (!u || !isRoman(s, u, owner) || !isCombat(u) || t.cityId !== null || !isLand(t) || t.terrain === 'mountain') return [];
    if (u.fortified && isCastra(t)) return [];
    const why = castraCheck(s, owner, t) ?? (s.players[owner].stars < CASTRA_COST ? 'Not enough stars' : null);
    return [{
      id: 'mech:castra', label: 'Build Castra', cost: CASTRA_COST, icon: 'road', enabled: !why, reason: why ?? undefined,
      desc: `Dig in as a mini-fort: +${CASTRA_DEFENCE} defence while this soldier holds the road. The fort is dismantled when it leaves.`,
    }];
  },

  doAction(s, owner, t, id) {
    if (id !== 'mech:castra' || castraCheck(s, owner, t)) return false;
    return fortify(t, unitAt(s, t.x, t.y)!, owner);
  },

  ai(s, owner) {
    pave(s, owner);
    const p = s.players[owner];
    if (p.stars < CASTRA_COST) return false;
    for (const u of s.units) {
      if (!isRoman(s, u, owner) || !u.moved || u.fortified || !isCombat(u)) continue;
      const t = tileAt(s, u.x, u.y)!;
      if (castraCheck(s, owner, t)) continue;
      if (s.units.some((e) => e.owner !== owner && dist(e.x, e.y, u.x, u.y) <= 3)) {
        p.stars -= CASTRA_COST; // the AI acts directly, not through the tile menu
        return fortify(t, u, owner);
      }
    }
    return false;
  },
};

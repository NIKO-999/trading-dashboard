import { emit } from '../events';
import { dist, isLand, neighbors } from '../grid';
import { hostile } from '../diplomacy';
import { citiesOf, def, isExplored, removeUnit, tileOwnerPlayer, unitAt } from '../rules';
import type { Action } from '../rules';
import { TRIBES } from '../../data/tribes';
import type { GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// The Stakes of Bạch Đằng, and Guerrilla War.
//
// Empire bonus (Guerrilla War): every Vietnamese unit standing in forest or swamp defends +1 (`stat` hook).
//
// Core: as Ngô Quyền in 938 and Trần Hưng Đạo in 1288 did on the Bạch Đằng river, Vietnam drives iron-tipped stakes into
// the shallows (`mech:stakes`, STAKE_COST★) on a free shallow tile inside its borders or next to its land, at most
// STAKES_PER_CITY for every Vietnamese city still standing. The stake tile keeps its owner in `tile.data.stakes`.
// A hostile ship or boat (any naval unit whose empire holds no treaty with the owner) that steps onto stakes is caught:
// it must end its move there (`moveStep`), takes STAKE_DAMAGE when it arrives (`afterMove`; it may sink), and the
// stakes are spent. The owner's own ships, and those of any treaty partner, float over them unharmed.
// Stakes lie under the water: only the owner ever sees them (the renderer draws them in `overlay`, for that viewer only).
// Simplification: an enemy's movement preview does stop at the stakes, as if the river ran shallow there; nothing marks why.

export const STAKE_COST = 4;
export const STAKES_PER_CITY = 2;
export const STAKE_DAMAGE = 4;
/** Stars the AI always keeps in hand after planting. */
export const STAKE_RESERVE = 5;

const isViet = (s: GameState, pid: number) => s.players[pid]?.tribe === 'vietnam';

/** The player whose stakes lie on this tile, or null. */
export const stakesOn = (t: Tile): number | null => (typeof t.data?.stakes === 'number' ? (t.data.stakes as number) : null);

/** May `viewer` see the stakes on this tile? Only their owner ever can. */
export const stakesVisibleTo = (t: Tile, viewer: number): boolean => viewer >= 0 && stakesOn(t) === viewer;

/** Stake tiles `owner` has planted that are still waiting. */
export const stakesOf = (s: GameState, owner: number): Tile[] => s.tiles.filter((t) => stakesOn(t) === owner);

/** How many stakes `owner` may have in the water at once. */
export const stakeCap = (s: GameState, owner: number): number => STAKES_PER_CITY * citiesOf(s, owner).length;

/** Is this a shallow tile `owner` could stake, ignoring the cap and the treasury? Returns why not, or null. */
function siteCheck(s: GameState, owner: number, t: Tile): string | null {
  if (t.terrain !== 'shallow') return 'Stakes need shallow water';
  if (t.cityId !== null || t.improvement) return 'Something is built here';
  const p = tileOwnerPlayer(s, t);
  const mine = p === owner;
  if (!mine && p !== null) return 'Inside another empire\'s borders';
  if (!mine && !neighbors(s, t.x, t.y).some((n) => isLand(n) && tileOwnerPlayer(s, n) === owner)) return 'Only inside your borders or next to your land';
  if (stakesOn(t) !== null) return 'Stakes are already planted here';
  if (unitAt(s, t.x, t.y)) return 'A unit is in the way';
  return null;
}

/** Why `owner` cannot plant stakes here right now (site, cap), or null. Stars are checked by the action itself. */
export function stakeCheck(s: GameState, owner: number, t: Tile): string | null {
  const why = siteCheck(s, owner, t);
  if (why) return why;
  if (stakesOf(s, owner).length >= stakeCap(s, owner)) return `At most ${STAKES_PER_CITY} stakes per city`;
  return null;
}

/** Does stepping onto `to` spring `owner`'s stakes under unit `u`? */
const caught = (s: GameState, owner: number, u: Unit, to: Tile) =>
  stakesOn(to) === owner && u.owner !== owner && def(u).naval && hostile(s, owner, u.owner);

function plant(s: GameState, owner: number, t: Tile) {
  t.data = { ...(t.data ?? {}), stakes: owner };
  const p = s.players[owner];
  p.mech = { ...(p.mech ?? {}), planted: ((p.mech?.planted as number) ?? 0) + 1 };
}

/** The stakes spring under a hostile hull: it takes STAKE_DAMAGE, may sink, and the stakes are spent. */
function spring(s: GameState, owner: number, u: Unit, t: Tile) {
  const rest = { ...(t.data ?? {}) };
  delete rest.stakes;
  t.data = Object.keys(rest).length ? rest : undefined;
  const p = s.players[owner];
  p.mech = { ...(p.mech ?? {}), sprung: ((p.mech?.sprung as number) ?? 0) + 1 };
  u.hp -= STAKE_DAMAGE;
  emit({ type: 'damage', unitId: u.id, x: u.x, y: u.y, amount: STAKE_DAMAGE, crit: 'Stakes of Bạch Đằng!' });
  emit({ type: 'toast', player: owner, text: 'Stakes of Bạch Đằng! An enemy hull is impaled on your stakes.' });
  emit({ type: 'toast', player: u.owner, text: 'Stakes of Bạch Đằng! Your ship runs onto hidden stakes.' });
  if (u.hp <= 0) {
    removeUnit(s, u, null);
    emit({ type: 'death', unitId: u.id, x: u.x, y: u.y, owner: u.owner, kind: u.kind });
    p.kills++;
  }
}

/** Has the AI cause to fear the sea: met a seafaring empire, or seen a hostile ship? */
function seaThreat(s: GameState, owner: number): boolean {
  const met = s.players[owner].met ?? [];
  if (met.some((o) => !s.players[o]?.neutral && s.players[o]?.alive && TRIBES[s.players[o].tribe].category === 'naval')) return true;
  return s.units.some((e) => e.owner !== owner && def(e).naval && hostile(s, owner, e.owner) && isExplored(s, owner, e.x, e.y));
}

export const mech: Mechanic = {
  name: 'Stakes of Bạch Đằng',
  blurb: `Plant hidden iron-tipped stakes in the shallows (${STAKE_COST}★, ${STAKES_PER_CITY} per city): an enemy ship that sails onto them is stopped dead and takes ${STAKE_DAMAGE} damage. Only you can see them. Guerrilla War: your units in forest or swamp defend +1.`,

  // Guerrilla War: cover in the jungle and the reeds
  stat(s, owner, u, stat) {
    if (stat !== 'def' || u.owner !== owner || !isViet(s, owner)) return 0;
    const t = s.tiles[u.y * s.size + u.x];
    return t && (t.terrain === 'forest' || t.terrain === 'swamp') ? 1 : 0;
  },

  // a hostile hull that reaches the stakes is held fast
  moveStep(s, owner, u, _from, to, ctx) {
    if (caught(s, owner, u, to)) ctx.stop = true;
  },

  afterMove(s, owner, u, _from, to) {
    if (!s.units.includes(u) || !caught(s, owner, u, to)) return;
    spring(s, owner, u, to);
  },

  actions(s, owner, t): Action[] {
    if (!isViet(s, owner) || siteCheck(s, owner, t)) return [];
    const left = stakeCap(s, owner) - stakesOf(s, owner).length;
    const why = stakeCheck(s, owner, t) ?? (s.players[owner].stars < STAKE_COST ? 'Not enough stars' : null);
    return [{ id: 'mech:stakes', label: 'Plant Stakes', cost: STAKE_COST, icon: 'port', enabled: !why, reason: why ?? undefined,
      desc: `Hidden iron-tipped stakes under the water. An enemy ship that sails here must stop and takes ${STAKE_DAMAGE} damage; then they are spent. Only you can see them. ${Math.max(0, left)} of ${stakeCap(s, owner)} left.` }];
  },

  doAction(s, owner, t, id) {
    if (id !== 'mech:stakes' || !isViet(s, owner) || stakeCheck(s, owner, t)) return false;
    plant(s, owner, t);
    return true;
  },

  // Plant stakes in the shallows beside coastal cities, keeping a reserve; eagerly once the sea looks dangerous.
  ai(s, owner) {
    if (!isViet(s, owner)) return false;
    const p = s.players[owner];
    const threat = seaThreat(s, owner);
    const reserve = threat ? STAKE_RESERVE : STAKE_RESERVE + 8;
    if (p.stars < STAKE_COST + reserve) return false;
    const have = stakesOf(s, owner).length;
    const cap = stakeCap(s, owner);
    if (have >= (threat ? cap : Math.ceil(cap / 2))) return false; // in quiet times only half the stakes go in
    const foes = s.units.filter((e) => e.owner !== owner && def(e).naval && hostile(s, owner, e.owner) && isExplored(s, owner, e.x, e.y));
    let best: { t: Tile; v: number } | null = null;
    for (const c of citiesOf(s, owner)) {
      for (const t of neighbors(s, c.x, c.y, 2)) {
        if (stakeCheck(s, owner, t)) continue;
        const d = dist(t.x, t.y, c.x, c.y);
        const near = foes.reduce((m, e) => Math.min(m, dist(e.x, e.y, t.x, t.y)), 9);
        // close to the city, near enemy ships, and not beside stakes already planted
        const v = (d === 1 ? 3 : 1) + Math.max(0, 6 - near) - (neighbors(s, t.x, t.y).some((n) => stakesOn(n) === owner) ? 2 : 0) + (t.resource ? 0.5 : 0);
        if (!best || v > best.v) best = { t, v };
      }
    }
    if (!best) return false;
    p.stars -= STAKE_COST; // the core charges only for human-issued actions; the AI pays here
    plant(s, owner, best.t);
    return true;
  },
};

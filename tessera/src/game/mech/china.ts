// China: Dynastic Mandate & Great Wall + Mandate of Heaven.
//
// (A) Great Wall. On an own-land BORDER tile (an owned land tile with a land neighbour outside the empire) a Chinese
//     player may raise a wall segment (`mech:wall`, WALL_COST stars; `improvement: 'wall'`, `data.wall` = owner). At most
//     WALL_PER_CITY segments per city. While the tile is still Chinese territory:
//       - enemy LAND units (and boats carrying one) cannot enter the wall tile (`moveStep` forbids the step), and cannot
//         squeeze diagonally between two wall tiles that touch edge to edge: that is how segments "link" into a wall;
//       - siege engines (catapult, hwacha; a boat carrying one counts) may cross, and breach the wall: the segment they
//         end their move on is torn down (`afterMove`).
//     Chinese units walk through their own wall freely. No wall can be raised under an enemy unit or on a mountain
//     (mountains already need Climbing). A wall on ground that has been conquered stops working.
//     Dynastic Shift: when a Chinese city is captured, the empire's dynasty falls and a new one is founded at once.
//     There are no tech cooldowns in this game, so the closest honest version is: the stars of the most recently
//     researched tech (not already refunded) are paid back, as a free research boost for the next tech, and the Mandate
//     is reset: it is withdrawn for MOURNING_TURNS full rounds (no +1 star bonus), then a clean mandate begins again.
// (B) Mandate of Heaven (Stars only; population is not touched). Every Chinese tile that has a productive improvement
//     (farm, mine, lumber hut or port: a harvested resource leaves no marker, so these are the "improved resource tiles")
//     pays +1 star at the start of the owner's turn while the Mandate is Blessed: no Dynastic Shift in the last
//     MOURNING_TURNS rounds and no enemy unit inside the borders. If an enemy unit (explorers excepted) stands on
//     Chinese land, the Mandate is Invaded: no bonus and the empire's whole star income is halved (rounded down).
import { emit } from '../events';
import { dist, isLand, tileAt } from '../grid';
import { citiesOf, income, techCost, tileOwnerPlayer, unitAt } from '../rules';
import type { Action } from '../rules';
import type { GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

export const WALL_COST = 1;
export const WALL_PER_CITY = 8;
/** Stars per turn per city from the Imperial treasury while the Mandate is not lost. */
export const TREASURY = 4;
export const MOURNING_TURNS = 2;
export const SIEGE: readonly string[] = ['catapult', 'hwacha'];
const PRODUCTIVE = ['farm', 'mine', 'lumber', 'port'];

export interface ChinaState {
  shifts: number; // Dynastic Shifts suffered
  brokenUntil: number; // the Mandate is withdrawn while s.turn < brokenUntil
  refunded: string[]; // techs already paid back
  built: number; // wall segments raised (a counter)
  breached: number; // wall segments torn down by siege
  refundStars: number; // stars paid back by Dynastic Shifts
}
export type Mandate = 'blessed' | 'mourning' | 'invaded';

export function chinaState(s: GameState, owner: number): ChinaState {
  const p = s.players[owner];
  const m = (p.mech ?? (p.mech = {})) as Partial<ChinaState>;
  m.shifts ??= 0; m.brokenUntil ??= 0; m.refunded ??= []; m.built ??= 0; m.breached ??= 0; m.refundStars ??= 0;
  return m as ChinaState;
}

export const isWall = (t: Tile) => t.improvement === 'wall' && typeof t.data?.wall === 'number';
/** A wall of `owner` that still stands on Chinese land (it works). */
export const activeWall = (s: GameState, t: Tile, owner: number) => isWall(t) && t.data!.wall === owner && tileOwnerPlayer(s, t) === owner;
const wallCount = (s: GameState, owner: number) => s.tiles.filter((t) => isWall(t) && t.data!.wall === owner).length;
export const wallCap = (s: GameState, owner: number) => citiesOf(s, owner).length * WALL_PER_CITY;
export const activeWalls = (s: GameState, owner: number) => s.tiles.filter((t) => activeWall(s, t, owner));

const isSiege = (u: Unit) => SIEGE.includes(u.carrying ?? u.kind);

/** An owned land tile with a land neighbour outside the empire. */
export function isBorder(s: GameState, owner: number, t: Tile): boolean {
  if (tileOwnerPlayer(s, t) !== owner || !isLand(t)) return false;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const n = (dx || dy) ? tileAt(s, t.x + dx, t.y + dy) : undefined;
      if (n && isLand(n) && tileOwnerPlayer(s, n) !== owner) return true;
    }
  return false;
}

/** Why a wall cannot be raised on `t` (null when it can). */
export function wallCheck(s: GameState, owner: number, t: Tile): string | null {
  if (tileOwnerPlayer(s, t) !== owner || !isLand(t)) return 'Must be on your own land';
  if (t.cityId !== null || t.village || t.improvement || t.terrain === 'mountain') return 'Tile is already used';
  if (!isBorder(s, owner, t)) return 'Only on the border of your land';
  const u = unitAt(s, t.x, t.y);
  if (u && u.owner !== owner) return 'An enemy stands here';
  if (wallCount(s, owner) >= wallCap(s, owner)) return `At most ${WALL_PER_CITY} wall segments per city`;
  return null;
}

// ------------------------------------------------------------ mandate

/** Enemy units (explorers excepted) standing on Chinese territory. */
export const invaders = (s: GameState, owner: number): Unit[] =>
  s.units.filter((u) => u.owner !== owner && u.kind !== 'explorer' && tileOwnerPlayer(s, tileAt(s, u.x, u.y)!) === owner);

export function mandate(s: GameState, owner: number): Mandate {
  if (invaders(s, owner).length) return 'invaded';
  return s.turn < chinaState(s, owner).brokenUntil ? 'mourning' : 'blessed';
}

/** Number of improved tiles that would pay the Mandate bonus. */
export const improvedTiles = (s: GameState, owner: number) =>
  s.tiles.filter((t) => t.improvement && PRODUCTIVE.includes(t.improvement) && tileOwnerPlayer(s, t) === owner).length;

/** The star change the Mandate adds to next turn's income: +improved tiles, 0 in mourning, -half of the base when invaded. */
export function mandateIncome(s: GameState, owner: number): number {
  const m = mandate(s, owner);
  if (m === 'blessed') return improvedTiles(s, owner);
  if (m === 'invaded') return -Math.floor(income(s, owner) / 2);
  return 0;
}

// ------------------------------------------------------------ wall / dynastic shift

function raise(s: GameState, owner: number, t: Tile) {
  t.improvement = 'wall';
  t.data = { ...(t.data ?? {}), wall: owner };
  chinaState(s, owner).built++;
  return true;
}

function dynasticShift(s: GameState, owner: number) {
  const p = s.players[owner];
  const m = chinaState(s, owner);
  m.shifts++;
  m.brokenUntil = s.turn + MOURNING_TURNS;
  const last = [...p.techs].slice(1).reverse().find((t) => !m.refunded.includes(t)); // techs[0] is the free starting tech
  let msg = `A Dynastic Shift: the Mandate is withdrawn for ${MOURNING_TURNS} rounds and a new dynasty begins.`;
  if (last) {
    const back = techCost(s, owner, last);
    m.refunded.push(last);
    m.refundStars += back;
    p.stars += back;
    msg = `A Dynastic Shift: ${back} stars are paid back for ${last}; the Mandate is withdrawn for ${MOURNING_TURNS} rounds.`;
  }
  emit({ type: 'toast', player: owner, text: msg });
}

export const mech: Mechanic = {
  name: 'Dynastic Mandate & Great Wall',
  blurb: 'Border walls stop every enemy but siege engines and improved tiles pay +1★ while the Mandate holds (no city lost, no invader). Losing a city brings a Dynastic Shift (a tech refund, then mourning), and invaders halve your income.',

  setup(s, owner) { s.players[owner].mech = { shifts: 0, brokenUntil: 0, refunded: [], built: 0, breached: 0, refundStars: 0 }; },

  moveStep(s, owner, u, from, to, ctx) {
    if (u.owner === owner || isSiege(u)) return;
    if (activeWall(s, to, owner)) { ctx.forbid = true; return; }
    if (from.x !== to.x && from.y !== to.y) { // a diagonal step through a linked pair of wall tiles
      const a = tileAt(s, to.x, from.y), b = tileAt(s, from.x, to.y);
      if (a && b && activeWall(s, a, owner) && activeWall(s, b, owner)) ctx.forbid = true;
    }
  },

  afterMove(s, owner, u, _from, to) {
    if (u.owner === owner || !isSiege(u) || !activeWall(s, to, owner)) return;
    to.improvement = null; // breached
    delete to.data!.wall;
    chinaState(s, owner).breached++;
  },

  // Imperial prestige: a blessed Mandate and a standing Great Wall add to the empire's glory each turn.
  turnStart(s, owner) {
    if (mandate(s, owner) === 'blessed') s.players[owner].bonusScore += 16 + 4 * Math.min(10, activeWalls(s, owner).length);
  },

  cityCaptured(s, owner, _c, from) { if (from === owner) dynasticShift(s, owner); },

  income(s, owner) { return mandateIncome(s, owner) + (mandate(s, owner) === 'invaded' ? 0 : TREASURY * citiesOf(s, owner).length); },

  actions(s, owner, t): Action[] {
    if (tileOwnerPlayer(s, t) !== owner || !isLand(t) || t.cityId !== null || t.improvement || !isBorder(s, owner, t)) return [];
    const why = wallCheck(s, owner, t) ?? (s.players[owner].stars < WALL_COST ? 'Not enough stars' : null);
    return [{
      id: 'mech:wall', label: 'Great Wall', cost: WALL_COST, icon: 'road', enabled: !why, reason: why ?? undefined,
      desc: 'A wall segment on the border: enemy land units cannot enter it or slip between linked segments. Siege engines can, and tear it down.',
    }];
  },

  doAction(s, owner, t, id) {
    if (id !== 'mech:wall' || wallCheck(s, owner, t)) return false;
    return raise(s, owner, t);
  },

  ai(s, owner) {
    const p = s.players[owner];
    if (p.stars < WALL_COST + 1 || wallCount(s, owner) >= wallCap(s, owner)) return false;
    const foes = s.cities.filter((c) => c.owner !== owner);
    const walls = activeWalls(s, owner);
    let best: { t: Tile; score: number } | null = null;
    for (const t of s.tiles) {
      if (tileOwnerPlayer(s, t) !== owner || wallCheck(s, owner, t)) continue;
      const near = Math.min(99, ...foes.map((c) => dist(c.x, c.y, t.x, t.y)));
      let score = Math.max(0, 14 - near) * 0.5 + s.units.filter((e) => e.owner !== owner && dist(e.x, e.y, t.x, t.y) <= 4).length * 2;
      if (walls.some((w) => dist(w.x, w.y, t.x, t.y) === 1)) score += 3; // extends the wall
      score -= ((t.x * 7 + t.y * 13) % 5) * 0.01; // deterministic tie-break
      if (!best || score > best.score) best = { t, score };
    }
    if (!best || best.score < 2) return false;
    p.stars -= WALL_COST; // the AI acts directly, not through the tile menu
    return raise(s, owner, best.t);
  },
};

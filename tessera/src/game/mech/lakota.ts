import { emit } from '../events';
import { dist, isLand, neighbors, tileAt } from '../grid';
import { claimTerritory, revealAround } from '../mapgen';
import { ROAD_MILESTONES, roadNetwork } from '../network';
import { makeRng } from '../rng';
import { addPop, cityById, citiesOf, doAction as act, isExplored, tileActions, tileOwnerPlayer, unitAt } from '../rules';
import type { Action } from '../rules';
import type { City, GameState, Tile } from '../types';
import type { Mechanic } from './types';

// Lakota: the Great Plains Migration and the Herding Movement.
//
// (A) Great Plains Migration. A Lakota city is a camp that can move. It keeps no permanent buildings (no Workshop, City
//     Walls, Temples, Markets: `block` refuses them and the level-up rewards for Workshop and Walls are swapped, see
//     rules.rewardOptions). The whole City object relocates, so its id, level, pop progress, capital flag, supported
//     units and `data` all travel with it:
//       mech:pack       (city tile, free)   the camp is struck. Its territory is released (the old ground turns into
//                                           enriched soil) and it keeps only its own tile. A packed camp cannot train.
//       mech:move-camp  (target tile, 1★)   a packed camp moves up to MOVE_RANGE (3) tiles over open plains (field tiles) in
//                                           one turn, once per turn. Target: an empty field tile, not next to another city.
//       mech:settle     (city tile, 2★)     the camp is re-founded: territory is claimed again around the new tile, the fog
//                                           lifts, and enriched soil nearby pays out (see below).
//     A camp cannot pack again for PACK_COOLDOWN turns after settling. Relocating resets the city's road-milestone
//     bookkeeping (as a capture does), so moving is never a road-bonus windfall; the road network itself is read live.
//     Enriched soil: every tile a camp abandons gets tile.data.soil = { n, by } for SOIL_TURNS turns (it ripens after
//     SOIL_RIPE turns). When a camp settles, ripe soil of its own making inside its new territory pays +1★ per tile
//     (up to SOIL_CAP tiles) and +1 population per SOIL_POP_PER tiles, and is used up. Returning to old ground pays.
//     Simplification: capturing a packed camp simply unpacks it for its new owner.
// (B) Herding Movement. `Follow Herds` (`mech:follow`, city tile, 1★ per herder) assigns one of a city's population (at
//     most `level` herders) to follow the herds: each herder works one herd tile inside the camp's territory for
//     HERD_STARS (2) ★ per turn (twice an ordinary resource's 1★), capped per city. A herd is a tile marked
//     tile.data.herd on an animal resource. Each Lakota turn start every herd may walk to an adjacent land tile (seeded,
//     with a heading that persists): only marked herds move, they never enter or leave another empire's borders, and
//     they slowly breed back up to the herd count the world started with. A herd that leaves the borders stops paying, so
//     the camp must follow it. Hunting a herd that is being followed is blocked.
//     State: city.data.lk = { packed, moved, settled, packedAt, herders }, player.mech = counters (moves, settles, ...),
//     s.mech.lakota = { cap, lastHerdTurn }, tile.data.herd / tile.data.soil.

export const MOVE_RANGE = 3;
export const PACK_COST = 0;
export const MOVE_COST = 1;
export const SETTLE_COST = 2;
export const FOLLOW_COST = 1;
export const PACK_COOLDOWN = 3;
export const SOIL_TURNS = 8;
export const SOIL_RIPE = 2;
export const SOIL_CAP = 4;
export const SOIL_POP_PER = 3;
export const HERD_STARS = 2;
export const HERD_CITY_CAP = 6;
export const HERD_MOVE_CHANCE = 0.7;
const GRAZE = ['field', 'forest', 'desert', 'tundra', 'swamp'];
const NO_BUILD = ['workshop', 'walls', 'temple', 'shrine', 'market'];

export interface CampState { packed?: boolean; moved?: number; settled?: number; packedAt?: number; herders?: number }
export interface Herd { dx: number; dy: number; fx?: number; fy?: number; t?: number }
export interface Soil { n: number; by: number }

const isLakota = (s: GameState, pid: number) => s.players[pid].tribe === 'lakota';
const seenBy = (s: GameState, pid: number, x: number, y: number) => isExplored(s, pid, x, y);

/** The camp state of a city (created on demand, so captured and older cities work). */
export function camp(c: City): CampState {
  const d = (c.data ??= {});
  return ((d.lk as CampState | undefined) ?? (d.lk = { settled: -99 })) as CampState;
}
export const isPacked = (c: City) => !!(c.data?.lk as CampState | undefined)?.packed;
export const herdersOf = (c: City) => (c.data?.lk as CampState | undefined)?.herders ?? 0;
export const isHerd = (t: Tile) => t.resource === 'animal' && !!t.data?.herd;
export const soilOf = (t: Tile): Soil | undefined => t.data?.soil as Soil | undefined;
const ripe = (sl: Soil) => SOIL_TURNS - sl.n >= SOIL_RIPE;

function counters(s: GameState, pid: number) {
  const p = s.players[pid];
  return (p.mech ??= {}) as Record<string, number>;
}
const bump = (s: GameState, pid: number, key: string, n = 1) => { const m = counters(s, pid); m[key] = (m[key] ?? 0) + n; };
/** How many times something happened (a counter kept in `player.mech`): moves, packs, settles, follows, herdSteps, soilTiles. */
export const counter = (s: GameState, pid: number, key: string) => (s.players[pid].mech?.[key] as number | undefined) ?? 0;

const setData = (t: Tile, key: string, v: unknown) => { t.data = { ...(t.data ?? {}), [key]: v }; };
const dropData = (t: Tile, key: string) => { if (t.data && key in t.data) { const { [key]: _x, ...rest } = t.data; t.data = rest; } };

// ---------------------------------------------------------------- herds

export const herdsIn = (s: GameState, c: City): Tile[] => s.tiles.filter((t) => t.owner === c.id && isHerd(t));

/** Stars per turn the herders of one city bring in: each follows one herd tile in the territory. */
export function herdIncome(s: GameState, c: City): number {
  if (isPacked(c)) return 0;
  return Math.min(HERD_CITY_CAP, HERD_STARS * Math.min(herdersOf(c), herdsIn(s, c).length));
}
export const totalHerdIncome = (s: GameState, pid: number) => citiesOf(s, pid).reduce((n, c) => n + herdIncome(s, c), 0);

const rngFor = (s: GameState, t: Tile, salt: number) => makeRng((s.seed ^ Math.imul(s.turn + 1, 7919) ^ Math.imul(t.x + 1, 104729) ^ Math.imul(t.y + 1, 1299709) ^ salt) >>> 0);

/** May a herd graze here? Free land, never another empire's ground. */
function canGraze(s: GameState, t: Tile): boolean {
  if (!isLand(t) || !GRAZE.includes(t.terrain) || t.cityId !== null || t.village || t.ruin || t.resource !== null || t.improvement !== null) return false;
  if (unitAt(s, t.x, t.y)) return false;
  const owner = tileOwnerPlayer(s, t);
  return owner === null || isLakota(s, owner);
}
const ownedByOthers = (s: GameState, t: Tile) => { const o = tileOwnerPlayer(s, t); return o !== null && !isLakota(s, o); };

/** Every herd may walk one tile. Deterministic for a given seed and turn. Returns how many moved. */
export function migrateHerds(s: GameState): number {
  let moved = 0;
  for (const t of s.tiles.filter(isHerd)) {
    if (ownedByOthers(s, t)) continue; // penned by another empire: it stays
    const rng = rngFor(s, t, 0xa11);
    if (!rng.chance(HERD_MOVE_CHANCE)) continue;
    const cands = neighbors(s, t.x, t.y).filter((n) => canGraze(s, n));
    if (!cands.length) continue;
    const h = t.data!.herd as Herd;
    const ahead = cands.find((n) => n.x - t.x === h.dx && n.y - t.y === h.dy);
    const to = ahead && rng.chance(0.6) ? ahead : rng.pick(cands);
    dropData(t, 'herd');
    t.resource = null;
    to.resource = 'animal';
    setData(to, 'herd', { dx: to.x - t.x, dy: to.y - t.y, fx: t.x, fy: t.y, t: s.turn } satisfies Herd);
    moved++;
  }
  return moved;
}

/** The herds slowly breed back up to the size the world started with. */
function breed(s: GameState) {
  const cap = ((s.mech?.lakota as { cap?: number } | undefined)?.cap) ?? 0;
  const herds = s.tiles.filter(isHerd);
  if (!herds.length || herds.length >= cap || s.turn % 4 !== 0) return;
  const mother = herds[(s.turn / 4) % herds.length];
  const to = neighbors(s, mother.x, mother.y).find((n) => canGraze(s, n));
  if (!to) return;
  to.resource = 'animal';
  setData(to, 'herd', { dx: 0, dy: 0, t: s.turn } satisfies Herd);
}

// ---------------------------------------------------------------- moving the camp

/** Can the camp pass over this tile? Open plains not held by another empire and not held by an enemy soldier. */
function passable(s: GameState, c: City, t: Tile): boolean {
  if (t.terrain !== 'field' || t.cityId !== null) return false;
  if (t.owner !== null && t.owner !== c.id) return false;
  const u = unitAt(s, t.x, t.y);
  return !(u && u.owner !== c.owner);
}
/** Can the camp be re-founded here? */
function landable(s: GameState, c: City, t: Tile): boolean {
  if (t.x === c.x && t.y === c.y) return false;
  if (!passable(s, c, t) || t.village || t.ruin || t.resource !== null || t.improvement !== null || unitAt(s, t.x, t.y)) return false;
  if (!seenBy(s, c.owner, t.x, t.y)) return false;
  return !s.cities.some((o) => o.id !== c.id && dist(o.x, o.y, t.x, t.y) <= 1);
}

/** Tiles a packed camp can reach this turn: up to MOVE_RANGE steps over open plains, ending on a free field tile. */
export function campReach(s: GameState, c: City): Tile[] {
  const start = tileAt(s, c.x, c.y)!;
  const depth = new Map<Tile, number>([[start, 0]]);
  const queue = [start];
  const out: Tile[] = [];
  while (queue.length) {
    const cur = queue.shift()!;
    const d = depth.get(cur)!;
    if (d >= MOVE_RANGE) continue;
    for (const n of neighbors(s, cur.x, cur.y)) {
      if (depth.has(n) || !passable(s, c, n)) continue;
      depth.set(n, d + 1);
      queue.push(n);
      if (landable(s, c, n)) out.push(n);
    }
  }
  return out;
}

const movedThisTurn = (s: GameState, c: City) => camp(c).moved === s.turn;

/** Why this packed camp cannot go to `t` (null when it can). */
function moveWhy(s: GameState, c: City, t: Tile): string | null {
  if (movedThisTurn(s, c)) return 'The caravan already moved this turn';
  if (s.players[c.owner].stars < MOVE_COST) return 'Not enough stars';
  if (t.terrain !== 'field') return 'A caravan crosses only open plains';
  if (!landable(s, c, t)) return 'Needs empty open ground, clear of cities';
  return campReach(s, c).includes(t) ? null : 'No open path within 3 tiles';
}

/** The packed camp that would go to `t`: the nearest one that can. */
function mover(s: GameState, owner: number, t: Tile): City | undefined {
  return citiesOf(s, owner)
    .filter((c) => isPacked(c) && !movedThisTurn(s, c) && dist(c.x, c.y, t.x, t.y) <= MOVE_RANGE && !moveWhy(s, c, t))
    .sort((a, b) => dist(a.x, a.y, t.x, t.y) - dist(b.x, b.y, t.x, t.y) || a.id - b.id)[0];
}

/** Leave `t` behind as enriched soil (the abandoned city tile too). */
const enrich = (t: Tile, by: number) => setData(t, 'soil', { n: SOIL_TURNS, by } satisfies Soil);

/** Pack the camp: release its territory (it becomes soil) and keep only the city's own tile. */
export function packCamp(s: GameState, c: City): boolean {
  const lk = camp(c);
  if (lk.packed) return false;
  for (const t of s.tiles) {
    if (t.owner !== c.id || (t.x === c.x && t.y === c.y)) continue;
    t.owner = null;
    if (isLand(t)) enrich(t, c.owner);
  }
  lk.packed = true;
  lk.packedAt = s.turn;
  bump(s, c.owner, 'packs');
  emit({ type: 'toast', player: c.owner, text: `${c.name} strikes camp.` });
  return true;
}

/** Relocate the City object to `to`: same id, level, pop, units, data. The old tile is released. */
export function relocate(s: GameState, c: City, to: Tile) {
  const from = tileAt(s, c.x, c.y)!;
  from.cityId = null;
  from.owner = null;
  enrich(from, c.owner);
  c.x = to.x;
  c.y = to.y;
  to.cityId = c.id;
  to.owner = c.id;
  to.resource = null;
  to.village = false;
  to.terrain = 'field';
  dropData(to, 'soil');
  // relocating is never a road-bonus windfall: count what the new spot already has as paid, as capturing a city does
  const net = roadNetwork(s, c);
  c.roadStage = ROAD_MILESTONES.filter((m) => net.roads >= m.roads).length;
  c.linked = [...net.linked];
  revealAround(s, c.owner);
}

export function moveCamp(s: GameState, c: City, to: Tile): boolean {
  if (!isPacked(c) || movedThisTurn(s, c)) return false;
  relocate(s, c, to);
  camp(c).moved = s.turn;
  bump(s, c.owner, 'moves');
  emit({ type: 'toast', player: c.owner, text: `${c.name} rolls on across the plains.` });
  return true;
}

/** Ripe soil this empire left in the camp's territory pays stars and population, and is used up. */
export function harvestSoil(s: GameState, c: City): { stars: number; pop: number } {
  const soil = s.tiles.filter((t) => t.owner === c.id && soilOf(t)?.by === c.owner && ripe(soilOf(t)!))
    .sort((a, b) => soilOf(a)!.n - soilOf(b)!.n).slice(0, SOIL_CAP);
  for (const t of soil) dropData(t, 'soil');
  const stars = soil.length;
  const pop = Math.floor(soil.length / SOIL_POP_PER);
  if (stars) {
    s.players[c.owner].stars += stars;
    emit({ type: 'stars', player: c.owner, x: c.x, y: c.y, amount: stars });
    bump(s, c.owner, 'soilTiles', stars);
  }
  if (pop) { emit({ type: 'harvest', player: c.owner, x: c.x, y: c.y, pop }); addPop(s, c, pop); }
  return { stars, pop };
}

/** Re-found the camp on its current tile: territory again, fog lifts, old ground pays. */
export function settleCamp(s: GameState, c: City): boolean {
  const lk = camp(c);
  if (!lk.packed) return false;
  lk.packed = false;
  lk.settled = s.turn;
  claimTerritory(s, c.id);
  revealAround(s, c.owner);
  bump(s, c.owner, 'settles');
  const got = harvestSoil(s, c);
  emit({ type: 'toast', player: c.owner, text: `${c.name} pitches its tipis${got.stars ? `: the old ground pays +${got.stars}★${got.pop ? ` and +${got.pop} pop` : ''}` : ''}.` });
  return true;
}

/** Soil ages: it disappears once its turns are up. */
function ageSoil(s: GameState, owner: number) {
  for (const t of s.tiles) {
    const sl = soilOf(t);
    if (!sl || sl.by !== owner) continue;
    if (sl.n <= 1) dropData(t, 'soil');
    else setData(t, 'soil', { ...sl, n: sl.n - 1 });
  }
}

// ---------------------------------------------------------------- actions

const settleWhy = (s: GameState, c: City): string | undefined => (s.players[c.owner].stars < SETTLE_COST ? 'Not enough stars' : undefined);
const packWhy = (s: GameState, c: City): string | undefined => {
  const since = s.turn - (camp(c).settled ?? -99);
  return since < PACK_COOLDOWN ? `The camp only just settled (${PACK_COOLDOWN - since} more turn${PACK_COOLDOWN - since === 1 ? '' : 's'})` : undefined;
};

export const mech: Mechanic = {
  name: 'Great Plains Migration',
  blurb: 'Camps pack up, roll up to 3 tiles a turn and re-settle, leaving enriched soil behind; assign herders to Follow Herds that wander the plains for double Stars.',

  setup(s, owner) {
    // every free animal tile is a herd (and the Lakota's own); herds inside another empire's borders stay penned
    let n = 0;
    for (const t of s.tiles) {
      if (t.resource !== 'animal' || !isLand(t) || t.terrain === 'mountain' || ownedByOthers(s, t)) continue;
      setData(t, 'herd', { dx: 0, dy: 0 } satisfies Herd);
      n++;
    }
    s.mech = { ...(s.mech ?? {}), lakota: { cap: n } };
    for (const c of citiesOf(s, owner)) camp(c);
  },

  turnStart(s, owner) {
    ageSoil(s, owner);
    const w = s.mech?.lakota as { cap: number; lastHerdTurn?: number } | undefined;
    if (w && w.lastHerdTurn !== s.turn) { // the herds walk once per round
      w.lastHerdTurn = s.turn;
      bump(s, owner, 'herdSteps', migrateHerds(s));
      breed(s);
    }
    for (const t of s.tiles) if (t.data?.herd && t.resource !== 'animal') dropData(t, 'herd'); // hunted out
    for (const c of citiesOf(s, owner)) {
      const lk = camp(c);
      lk.herders = Math.min(lk.herders ?? 0, c.level);
    }
  },

  income(s, owner) { return totalHerdIncome(s, owner); },

  cityCaptured(s, owner, c, from) {
    if (owner !== from) return;
    delete c.data?.lk; // a captured camp is an ordinary city of its new owner
    for (const t of s.tiles) if (t.owner === c.id && soilOf(t)?.by === from) dropData(t, 'soil');
  },

  block(s, owner, pid, id, t) {
    if (!isLakota(s, pid)) return undefined;
    if (NO_BUILD.includes(id)) return 'A moving camp keeps no permanent buildings';
    const c = cityById(s, t.cityId);
    if (id.startsWith('train:') && c && c.owner === pid && isPacked(c)) return 'The camp is packed up';
    if (id === 'harvest' && isHerd(t)) {
      const city = cityById(s, t.owner);
      if (city && city.owner === pid && herdersOf(city) >= herdsIn(s, city).length) return 'Your herders are following this herd';
    }
    return undefined;
  },

  actions(s, owner, t): Action[] {
    const out: Action[] = [];
    const stars = s.players[owner].stars;
    const city = t.cityId !== null ? cityById(s, t.cityId) : undefined;
    if (city && city.owner === owner) {
      const lk = camp(city);
      if (lk.packed) {
        const why = settleWhy(s, city);
        out.push({ id: 'mech:settle', label: 'Settle Camp', cost: SETTLE_COST, icon: 'flag', enabled: !why, reason: why,
          desc: `Pitch the tipis here: claim territory around this tile again. Ripe soil you left nearby pays +1★ per tile (up to ${SOIL_CAP}). Move first with a tap on a plains tile within ${MOVE_RANGE}.` });
      } else {
        const why = packWhy(s, city);
        out.push({ id: 'mech:pack', label: 'Pack Camp', cost: PACK_COST, icon: 'rider', enabled: !why, reason: why,
          desc: `Load the whole city onto a horse caravan. Its lands turn to enriched soil; it can then roll ${MOVE_RANGE} tiles a turn and settle elsewhere. No training while packed.` });
        const herds = herdsIn(s, city).length;
        const h = herdersOf(city);
        const fwhy = h >= city.level ? `Every one of the ${city.level} people is already herding` : stars < FOLLOW_COST ? 'Not enough stars' : undefined;
        out.push({ id: 'mech:follow', label: `Follow Herds (${h}/${city.level})`, cost: FOLLOW_COST, icon: 'animal', enabled: !fwhy, reason: fwhy,
          desc: `Send one more of the camp's people after the herds: each herder works a herd tile in your territory for ${HERD_STARS}★ a turn. ${herds} herd tile${herds === 1 ? '' : 's'} in reach now.` });
        if (h > 0) out.push({ id: 'mech:unfollow', label: 'Recall Herders', cost: 0, icon: 'road', enabled: true, desc: 'Bring every herder home (then herds may be hunted).' });
      }
    }
    if (t.terrain === 'field' && t.cityId === null) {
      const near = citiesOf(s, owner).filter((c) => isPacked(c) && dist(c.x, c.y, t.x, t.y) <= MOVE_RANGE);
      if (near.length && !unitAt(s, t.x, t.y)) {
        const best = mover(s, owner, t);
        const c = best ?? near[0];
        const why = best ? null : moveWhy(s, c, t);
        out.push({ id: 'mech:move-camp', label: 'Move Camp Here', cost: MOVE_COST, icon: 'road', enabled: !why, reason: why ?? undefined,
          desc: `${c.name} rolls to this tile (up to ${MOVE_RANGE} tiles over open plains, once a turn). Then settle it.` });
      }
    }
    return out;
  },

  doAction(s, owner, t, id) {
    if (!isLakota(s, owner)) return false;
    if (id === 'mech:move-camp') {
      const c = mover(s, owner, t);
      return !!c && moveCamp(s, c, t);
    }
    const c = t.cityId !== null ? cityById(s, t.cityId) : undefined;
    if (!c || c.owner !== owner) return false;
    if (id === 'mech:pack') return !packWhy(s, c) && packCamp(s, c);
    if (id === 'mech:settle') return settleCamp(s, c);
    if (id === 'mech:follow') {
      const lk = camp(c);
      if (lk.packed || (lk.herders ?? 0) >= c.level) return false;
      lk.herders = (lk.herders ?? 0) + 1;
      bump(s, owner, 'follows');
      emit({ type: 'harvest', player: owner, x: c.x, y: c.y, pop: 0 });
      return true;
    }
    if (id === 'mech:unfollow') { camp(c).herders = 0; return true; }
    return false;
  },

  // ---------------------------------------------------------------- AI

  ai(s, owner) {
    const p = s.players[owner];
    for (const c of citiesOf(s, owner)) {
      const t = tileAt(s, c.x, c.y)!;
      const go = (tile: Tile, id: string) => { const ok = actions(s, owner, tile).find((a) => a.id === id)?.enabled; return !!ok && act(s, owner, tile, id); };
      const lk = camp(c);
      const herds = nearestHerd(s, c);
      if (lk.packed) {
        const herdD = herds ? dist(c.x, c.y, herds.x, herds.y) : Infinity;
        const overdue = s.turn - (lk.packedAt ?? s.turn) >= 4;
        // roll toward the herd, three tiles a turn
        let closer: Tile | undefined;
        if (!movedThisTurn(s, c) && herds && herdD > c.borderRadius && p.stars >= MOVE_COST) {
          closer = campReach(s, c).sort((a, b) => dist(a.x, a.y, herds.x, herds.y) - dist(b.x, b.y, herds.x, herds.y) || a.y - b.y || a.x - b.x)[0];
          if (closer && dist(closer.x, closer.y, herds.x, herds.y) < herdD && go(closer, 'mech:move-camp')) return true;
        }
        // settle once the herd is inside the borders, or when there is nowhere better to go
        const stuck = !herds || overdue || (herdD > c.borderRadius && (movedThisTurn(s, c) ? false : !closer || dist(closer.x, closer.y, herds.x, herds.y) >= herdD));
        if ((herdD <= c.borderRadius || stuck) && p.stars >= SETTLE_COST && go(t, 'mech:settle')) return true;
        continue;
      }
      const inTerritory = herdsIn(s, c).length;
      // 1. put herders on the herds in the territory
      if (herdersOf(c) < Math.min(c.level, inTerritory) && p.stars >= FOLLOW_COST && go(t, 'mech:follow')) return true;
      // 2. no herd in the borders: follow the nearest one, if there is one within reach and nobody is at the gates
      if (!inTerritory && herds && dist(c.x, c.y, herds.x, herds.y) <= 12 && p.stars >= SETTLE_COST + MOVE_COST + 1
        && !s.units.some((u) => u.owner !== owner && dist(u.x, u.y, c.x, c.y) <= 3) && go(t, 'mech:pack')) return true;
    }
    return false;
  },
};

// the AI drives the same action path a player does
const actions = (s: GameState, owner: number, t: Tile): Action[] => tileActions(s, owner, t);

/** The nearest free herd (unowned or the camp's own ground) that the empire has seen. */
export function nearestHerd(s: GameState, c: City): Tile | undefined {
  let best: Tile | undefined;
  let bd = Infinity;
  for (const t of s.tiles) {
    if (!isHerd(t) || (t.owner !== null && t.owner !== c.id) || !seenBy(s, c.owner, t.x, t.y)) continue;
    const d = dist(c.x, c.y, t.x, t.y);
    if (d < bd) { bd = d; best = t; }
  }
  return best;
}

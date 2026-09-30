import { emit } from '../events';
import { dist, isLand, tileAt } from '../grid';
import { addPop, cityById, cityIncome, def, hasTech, isExplored, moveOptions, moveUnit, tileOwnerPlayer, unitAt } from '../rules';
import type { Action, MoveOption } from '../rules';
import type { City, GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// Inca: Highland Terracing & Rope Bridges (core) + Vertical Staircases (economy).
//
// Core. Chaski outposts (`mech:chaski`, improvement `chaski`) are built on a free mountain tile inside Inca borders. A
// land unit of the Inca standing ON or ADJACENT to one of their outposts may, in one turn and instead of walking, be
// slung by zipline (offered through `extraMoves`, so it is an ordinary highlighted move in the move UI):
//   - to any other Inca outpost tile that is empty (however far), or
//   - in a straight line (8 directions) from the outpost across at least ZIP_MOUNTAINS mountain tiles, landing on any empty
//     land tile up to ZIP_RANGE tiles away.
// A zip ends the unit's move (it is a normal move for the rules). Mountains are also never a wall for the Inca: a step
// onto a mountain costs 1 move and does not end the move (moveStep), unless an enemy stands next to the tile.
// Simplification: the zipline is a jump, so terrain in between (and units on it) does not matter.
//
// Economy. Terrace farms (`mech:terrace`) are farms built on empty mountain or forest tiles in borders for the standard
// farm price (5 stars, needs Farming) and give +2 population. A city's Star income is then multiplied by the number of
// different elevations that are worked (any improvement) inside its territory: lowland (field, desert, swamp, tundra),
// hill (forest) and peak (mountain): x1 / x1.5 / x2 (the extra is added by the `income` hook, capped per city). Improved
// mountain tiles also pay +1 star each (mountains feed the empire), capped at PEAK_CAP.
// State: tile.data.by = owner on outposts and terraces; tile.data.terrace = true on terraces;
// player.mech = { zips, terraces, outposts } (counters), aiTurn (last turn the AI built something).

export const CHASKI_COST = 6;
export const TERRACE_COST = 5;
export const TERRACE_POP = 1;
export const ZIP_MOUNTAINS = 4;
export const ZIP_RANGE = 9;
export const CITY_CAP = 3;
export const PEAK_CAP = 2;

export type Level = 'lowland' | 'hill' | 'peak';
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

const isInca = (s: GameState, owner: number) => s.players[owner].tribe === 'inca';
const isPeak = (t: Tile) => t.terrain === 'mountain';
/** Inca outposts standing in the territory of `owner`. */
export const outpostsOf = (s: GameState, owner: number): Tile[] => s.tiles.filter((t) => t.improvement === 'chaski' && tileOwnerPlayer(s, t) === owner);
const bump = (s: GameState, owner: number, k: string) => {
  const p = s.players[owner];
  p.mech = { ...p.mech, [k]: ((p.mech?.[k] as number | undefined) ?? 0) + 1 };
};
export const counter = (s: GameState, owner: number, k: string): number => (s.players[owner].mech?.[k] as number | undefined) ?? 0;

// ---------------------------------------------------------------- economy

/** The elevation of a worked tile, or null when it is not an improved land tile. */
export function levelOf(t: Tile): Level | null {
  if (!t.improvement || t.cityId !== null || !isLand(t)) return null;
  return t.terrain === 'mountain' ? 'peak' : t.terrain === 'forest' ? 'hill' : 'lowland';
}
/** Different elevations worked inside a city's territory. */
export function levelsWorked(s: GameState, c: City): Level[] {
  const seen = new Set<Level>();
  for (const t of s.tiles) if (t.owner === c.id) { const l = levelOf(t); if (l) seen.add(l); }
  return (['lowland', 'hill', 'peak'] as Level[]).filter((l) => seen.has(l));
}
/** Star multiplier of a city from its elevations: 1, 1.5, 2. */
export const multiplierOf = (n: number) => 1 + 0.5 * Math.max(0, n - 1);
/** Extra stars a city earns from the staircase (on top of its ordinary income). */
export function staircaseBonus(s: GameState, c: City): number {
  const n = levelsWorked(s, c).length;
  if (n < 2) return 0;
  return Math.min(CITY_CAP, Math.floor(cityIncome(s, c) * (multiplierOf(n) - 1)));
}
/** +1 star for every improved mountain tile in Inca territory (capped). */
export function peakIncome(s: GameState, owner: number): number {
  let n = 0;
  for (const t of s.tiles) if (isPeak(t) && t.improvement && tileOwnerPlayer(s, t) === owner) n++;
  return Math.min(PEAK_CAP, n);
}
export function totalIncome(s: GameState, owner: number): number {
  let n = peakIncome(s, owner);
  for (const c of s.cities) if (c.owner === owner) n += staircaseBonus(s, c);
  return n;
}

// ---------------------------------------------------------------- ziplines

const zipper = (s: GameState, u: Unit) => isInca(s, u.owner) && !def(u).naval && !u.carrying && isLand(tileAt(s, u.x, u.y)!);

/** Destinations a land unit of `owner` standing at (x,y) could be slung to. Pure function of the position. */
export function zipDestinations(s: GameState, owner: number, x: number, y: number, ignore?: Unit): MoveOption[] {
  const all = outpostsOf(s, owner);
  const posts = all.filter((o) => dist(o.x, o.y, x, y) <= 1);
  if (!posts.length) return [];
  const out = new Map<number, MoveOption>();
  const add = (t: Tile, path: { x: number; y: number }[]) => {
    if (dist(t.x, t.y, x, y) <= 1 || (unitAt(s, t.x, t.y) && unitAt(s, t.x, t.y) !== ignore) || !isLand(t)) return;
    if (t.cityId !== null && cityById(s, t.cityId)?.owner !== owner) return;
    if (!out.has(t.y * s.size + t.x)) out.set(t.y * s.size + t.x, { x: t.x, y: t.y, path });
  };
  for (const o of posts) {
    for (const d of all) if (d !== o) add(d, [{ x: o.x, y: o.y }, { x: d.x, y: d.y }]);
    for (const [dx, dy] of DIRS) {
      let mountains = 0;
      const line: { x: number; y: number }[] = [{ x: o.x, y: o.y }];
      for (let k = 1; k <= ZIP_RANGE; k++) {
        const t = tileAt(s, o.x + dx * k, o.y + dy * k);
        if (!t) break;
        line.push({ x: t.x, y: t.y });
        if (mountains >= ZIP_MOUNTAINS) add(t, [...line]);
        if (isPeak(t)) mountains++;
      }
    }
  }
  return [...out.values()];
}

// ---------------------------------------------------------------- building

const buildable = (t: Tile) => isLand(t) && !t.improvement && !t.resource && t.cityId === null && !t.village && !t.ruin;

function chaskiCheck(s: GameState, owner: number, t: Tile): string | null {
  if (!isPeak(t) || tileOwnerPlayer(s, t) !== owner || !buildable(t)) return 'Needs a free mountain in your borders';
  const u = unitAt(s, t.x, t.y);
  if (u && u.owner !== owner) return 'Enemy unit here';
  return null;
}
function terraceCheck(s: GameState, owner: number, t: Tile): string | null {
  if ((t.terrain !== 'mountain' && t.terrain !== 'forest') || tileOwnerPlayer(s, t) !== owner || !buildable(t)) return 'Needs a free mountain or forest in your borders';
  const u = unitAt(s, t.x, t.y);
  if (u && u.owner !== owner) return 'Enemy unit here';
  return null;
}

function buildChaski(s: GameState, owner: number, t: Tile) {
  t.improvement = 'chaski';
  t.data = { ...t.data, by: owner };
  bump(s, owner, 'outposts');
  emit({ type: 'harvest', player: owner, x: t.x, y: t.y, pop: 0 });
}
function buildTerrace(s: GameState, owner: number, t: Tile) {
  const c = cityById(s, t.owner)!;
  t.improvement = 'farm';
  t.data = { ...t.data, terrace: true, by: owner };
  bump(s, owner, 'terraces');
  emit({ type: 'harvest', player: owner, x: t.x, y: t.y, pop: TERRACE_POP });
  addPop(s, c, TERRACE_POP);
}

// ---------------------------------------------------------------- AI

/** Gap between a spot and the nearest enemy (unit or city). */
function enemyDist(s: GameState, owner: number, x: number, y: number): number {
  let d = 99;
  for (const u of s.units) if (u.owner !== owner) d = Math.min(d, dist(u.x, u.y, x, y));
  for (const c of s.cities) if (c.owner !== owner) d = Math.min(d, dist(c.x, c.y, x, y));
  return d;
}

export const mech: Mechanic = {
  name: 'Highland Terracing & Rope Bridges',
  blurb: 'Chaski outposts on peaks sling land units by zipline to other outposts or across 4+ mountains, and mountains never block the Inca. Terrace farms on peaks and forest raise Star income x1.5 or x2 for each extra elevation (lowland, hill, peak) a city works.',

  // Mountains are not a wall: a step onto one costs 1 and does not end the move (unless an enemy is adjacent to it).
  moveStep(s, owner, u, _from, to, ctx) {
    if (u.owner !== owner || !isInca(s, owner) || !isPeak(to) || def(u).naval) return;
    ctx.cost = Math.min(ctx.cost, 1);
    const enemyNear = s.units.some((e) => e.owner !== owner && dist(e.x, e.y, to.x, to.y) === 1 && isExplored(s, owner, e.x, e.y));
    if (!enemyNear) ctx.stop = false;
  },

  extraMoves(s, owner, u) {
    if (!zipper(s, u)) return [];
    return zipDestinations(s, owner, u.x, u.y);
  },

  afterMove(s, owner, u, from, to) {
    if (u.owner !== owner || !isInca(s, owner) || dist(from.x, from.y, to.x, to.y) < 2) return;
    if (zipDestinations(s, owner, from.x, from.y, u).some((o) => o.x === to.x && o.y === to.y)) bump(s, owner, 'zips');
  },

  income(s, owner) {
    return totalIncome(s, owner);
  },

  actions(s, owner, t): Action[] {
    const p = s.players[owner];
    const out: Action[] = [];
    if (!chaskiCheck(s, owner, t)) {
      out.push({
        id: 'mech:chaski', label: 'Chaski Outpost',
        desc: `A relay hut with rope lines. Your land units on or next to it can zipline to another outpost, or across ${ZIP_MOUNTAINS}+ mountains in a line, in one turn. Counts as a peak for the Staircase.`,
        cost: CHASKI_COST, enabled: p.stars >= CHASKI_COST, reason: p.stars >= CHASKI_COST ? undefined : 'Not enough stars', icon: 'flag',
      });
    }
    if (!terraceCheck(s, owner, t)) {
      const has = hasTech(s, owner, 'farming');
      const stars = p.stars >= TERRACE_COST;
      out.push({
        id: 'mech:terrace', label: 'Terrace Farm',
        desc: `+${TERRACE_POP} population. Worked ${t.terrain === 'mountain' ? 'peak' : 'hill'} tiles raise the city's Star income (x1.5 with two elevations, x2 with three).`,
        cost: TERRACE_COST, enabled: has && stars, reason: !has ? 'Needs Farming' : stars ? undefined : 'Not enough stars', icon: 'farm', needs: has ? undefined : 'farming',
      });
    }
    return out;
  },

  doAction(s, owner, t, id) {
    if (id === 'mech:chaski') { if (chaskiCheck(s, owner, t)) return false; buildChaski(s, owner, t); return true; }
    if (id === 'mech:terrace') { if (terraceCheck(s, owner, t)) return false; buildTerrace(s, owner, t); return true; }
    return false;
  },

  ai(s, owner) {
    const p = s.players[owner];
    // 1. Zipline: sling an idle unit to whichever destination gets it much closer to the enemy.
    for (const u of s.units) {
      if (u.owner !== owner || u.moved || !zipper(s, u) || u.kind === 'explorer' || u.hp < 5) continue;
      const here = enemyDist(s, owner, u.x, u.y);
      if (here <= 1) continue; // already in the fight
      let best: MoveOption | null = null;
      let bestD = here - 1; // worth a zip when it lands at least two tiles closer
      for (const o of zipDestinations(s, owner, u.x, u.y)) {
        if (!isExplored(s, owner, o.x, o.y)) continue;
        const d = enemyDist(s, owner, o.x, o.y);
        if (d >= 2 && d < bestD) { best = o; bestD = d; }
      }
      if (best && moveUnit(s, u, best.x, best.y)) return true;
    }
    // 1b. Rally: idle units far from the fight walk to a rear outpost, from where they can be slung to the front next turn.
    const posts = outpostsOf(s, owner);
    if (posts.length >= 2) {
      for (const u of s.units) {
        if (u.owner !== owner || u.moved || !zipper(s, u) || u.kind === 'explorer' || u.hp < 5) continue;
        const here = enemyDist(s, owner, u.x, u.y);
        if (here <= 3 || zipDestinations(s, owner, u.x, u.y).length) continue;
        const hub = posts.filter((o) => dist(o.x, o.y, u.x, u.y) <= 5 && enemyDist(s, owner, o.x, o.y) >= here - 1).sort((a, b) => dist(a.x, a.y, u.x, u.y) - dist(b.x, b.y, u.x, u.y))[0];
        if (!hub || !posts.some((o) => enemyDist(s, owner, o.x, o.y) + 2 <= enemyDist(s, owner, hub.x, hub.y))) continue; // a front outpost must exist
        const step = moveOptions(s, u).filter((o) => dist(o.x, o.y, hub.x, hub.y) < dist(u.x, u.y, hub.x, hub.y) && !o.embark)
          .sort((a, b) => dist(a.x, a.y, hub.x, hub.y) - dist(b.x, b.y, hub.x, hub.y))[0];
        if (step && moveUnit(s, u, step.x, step.y)) return true;
      }
    }
    // 2. Build: one project a turn, keeping a reserve; terraces first for a missing elevation.
    if (p.mech?.aiTurn === s.turn) return false;
    const mine = s.tiles.filter((t) => tileOwnerPlayer(s, t) === owner);
    const cities = s.cities.filter((c) => c.owner === owner);
    if (p.stars >= TERRACE_COST + 3 && hasTech(s, owner, 'farming')) {
      let pick: Tile | null = null;
      let bestScore = -1;
      for (const t of mine) {
        if (terraceCheck(s, owner, t)) continue;
        const have = levelsWorked(s, cityById(s, t.owner)!);
        const l: Level = t.terrain === 'mountain' ? 'peak' : 'hill';
        const score = (have.includes(l) ? 0 : 3) + (have.length >= 1 ? 1 : 0) + (t.terrain === 'forest' ? 0.5 : 0);
        if (score > bestScore) { pick = t; bestScore = score; }
      }
      if (pick && bestScore >= 3) {
        p.stars -= TERRACE_COST; // the core charges only human-issued actions
        p.mech = { ...p.mech, aiTurn: s.turn };
        buildTerrace(s, owner, pick);
        return true;
      }
    }
    if (p.stars >= CHASKI_COST + 4 && outpostsOf(s, owner).length < cities.length + 1) {
      let pick: Tile | null = null;
      let d0 = 1e9;
      const nearHome = posts.length === 0; // the first outpost is a rear hub beside the capital, later ones face the enemy
      const home = cities.find((c) => c.capital) ?? cities[0];
      for (const t of mine) {
        if (chaskiCheck(s, owner, t)) continue;
        if (posts.some((o) => dist(o.x, o.y, t.x, t.y) < 3)) continue; // spread the relay line out
        const d = nearHome && home ? dist(t.x, t.y, home.x, home.y) : enemyDist(s, owner, t.x, t.y);
        if (d < d0) { pick = t; d0 = d; }
      }
      if (pick) {
        p.stars -= CHASKI_COST;
        p.mech = { ...p.mech, aiTurn: s.turn };
        buildChaski(s, owner, pick);
        return true;
      }
    }
    return false;
  },
};

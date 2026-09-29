import { emit } from '../events';
import { spawnUnit } from '../mapgen';
import { dist, isLand, isWater, neighbors, tileAt } from '../grid';
import { def, moveOptions, moveUnit, tileOwnerPlayer } from '../rules';
import type { Action } from '../rules';
import type { GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// Monsoon Trade Currents.
// (A) Core: the sea has a seasonal wind (one of N/E/S/W). Every SEASON turns it turns to a new, deterministic direction
//     (`s.mech.wind` holds a Lighthouse override for the current season). Any ship sailing with the wind covers the water
//     much faster (a step costs 0.5 move points for Swahili, 0.75 for others), sailing against it is slower (1.25 / 1.5).
//     Swahili build Lighthouses (`mech:lighthouse`) on coastal land and, from one, call the wind map-wide (`mech:wind:<dir>`).
//     Simplification: "+4 movement" is a cost cut on every with-wind step (a 3-move galley sails ~6 tiles) instead of a flat bonus.
// (B) Economy: a Swahili ship remembers whether its last move was with/against/across the wind (unit.data.trade). At the
//     start of the next Swahili turn each such ship "serves" the best fish / whale / port tile beside it inside Swahili
//     borders, paying base stars (fish 2, port 2, whale 3) x2 with the wind, x0.5 against, x1 across; one ship per tile.
//     A Swahili port can launch a merchant dhow into the sea beside it (`mech:dhow`, a canoe) so trading needs no soldier to embark; at most 2 per port (max 4).
//     Simplification: "harvested by ships" is modelled as the ship standing next to (or on) the tile after moving.
// The core already charges `act.cost` for human `mech:` actions, so the checks below ignore stars; the AI pays by hand.

export const SEASON = 4; // turns per wind
export const LIGHTHOUSE_COST = 3;
export const WIND_COST = 3;
export const TRADE_CAP = 20;
export const DHOW_COST = 2;
export const DIRS = [
  { name: 'North', arrow: '↑', dx: 0, dy: -1 },
  { name: 'East', arrow: '→', dx: 1, dy: 0 },
  { name: 'South', arrow: '↓', dx: 0, dy: 1 },
  { name: 'West', arrow: '←', dx: -1, dy: 0 },
] as const;

const isSwahili = (s: GameState, pid: number) => s.players[pid]?.tribe === 'swahili';
export const epochOf = (s: GameState) => Math.floor(s.turn / SEASON);

export function seasonDir(seed: number, epoch: number): number {
  let h = (Math.imul(seed | 0, 2654435761) ^ Math.imul(epoch + 1, 40503)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
  const d = (h >>> 7) % 4;
  // never repeat the previous season's wind, so it visibly turns
  return epoch > 0 && d === seasonDir(seed, epoch - 1) ? (d + 1 + ((h >>> 3) % 3)) % 4 : d;
}
/** The wind blowing now: this season's Lighthouse setting if there is one, else the season's own direction. */
export function windDir(s: GameState): number {
  const w = s.mech?.wind as { epoch: number; dir: number } | undefined;
  if (w && w.epoch === epochOf(s)) return w.dir;
  return seasonDir(s.seed, epochOf(s));
}
export const turnsToShift = (s: GameState) => (epochOf(s) + 1) * SEASON - s.turn;

/** +1 sailing with the wind, -1 against it, 0 across. */
export function alignment(dir: number, dx: number, dy: number): -1 | 0 | 1 {
  const v = dx * DIRS[dir].dx + dy * DIRS[dir].dy;
  return v > 0 ? 1 : v < 0 ? -1 : 0;
}
export const mult = (al: number) => (al > 0 ? 2 : al < 0 ? 0.5 : 1);

// ---------------------------------------------------------------- lighthouses

const isMine = (s: GameState, owner: number, t: Tile) => t.improvement === 'lighthouse' && tileOwnerPlayer(s, t) === owner;
export const lighthouses = (s: GameState, owner: number) => s.tiles.filter((t) => isMine(s, owner, t));
const stampOf = (s: GameState) => s.turn * 16 + s.current;

function buildCheck(s: GameState, owner: number, t: Tile): string | null {
  if (tileOwnerPlayer(s, t) !== owner) return 'Only in your own territory';
  if (!isLand(t) || t.terrain === 'mountain' || t.cityId !== null || t.village || t.improvement || t.resource) return 'Needs open coastal ground';
  if (!neighbors(s, t.x, t.y).some(isWater)) return 'Must stand on the coast';
  const u = s.units.find((e) => e.x === t.x && e.y === t.y);
  if (u && u.owner !== owner) return 'Enemy on the tile';
  return null;
}
function windCheck(s: GameState, owner: number, t: Tile, dir: number): string | null {
  if (!isMine(s, owner, t)) return 'Not your lighthouse';
  if (t.data?.windTurn === stampOf(s)) return 'This lighthouse already signalled this turn';
  if (windDir(s) === dir) return `The wind already blows ${DIRS[dir].name}`;
  return null;
}
function callWind(s: GameState, owner: number, t: Tile, dir: number) {
  s.mech = { ...(s.mech ?? {}), wind: { epoch: epochOf(s), dir } };
  t.data = { ...(t.data ?? {}), windTurn: stampOf(s) };
  const p = s.players[owner];
  p.mech = { ...(p.mech ?? {}), windCalls: ((p.mech?.windCalls as number) ?? 0) + 1 };
  emit({ type: 'harvest', player: owner, x: t.x, y: t.y, pop: 0 });
}

// ---------------------------------------------------------------- trade

const baseOf = (t: Tile) => Math.max(t.resource === 'whale' ? 3 : t.resource === 'fish' ? 2 : 0, t.improvement === 'port' ? 2 : 0);
const shipTrade = (u: Unit) => u.data?.trade as { turn: number; al: number } | undefined;
const tradeLive = (s: GameState, u: Unit) => { const t = shipTrade(u); return !!t && t.turn >= s.turn - 1; };
const key = (s: GameState, t: Tile) => t.y * s.size + t.x;

export interface Serve { unit: number; x: number; y: number; base: number; al: number; stars: number }

/** What Swahili ships that sailed last turn will earn: each serves the best unclaimed fish/whale/port tile beside it. */
export function tradeReport(s: GameState, owner: number): { total: number; serves: Serve[] } {
  const claimed = new Set<number>();
  const serves: Serve[] = [];
  const ships = s.units.filter((u) => u.owner === owner && def(u).naval && tradeLive(s, u)).sort((a, b) => a.id - b.id);
  for (const u of ships) {
    const al = shipTrade(u)!.al;
    let best: Serve | null = null;
    for (const t of [tileAt(s, u.x, u.y)!, ...neighbors(s, u.x, u.y)]) {
      const base = baseOf(t);
      if (!base || claimed.has(key(s, t)) || tileOwnerPlayer(s, t) !== owner) continue;
      const stars = base * mult(al);
      if (!best || stars > best.stars) best = { unit: u.id, x: t.x, y: t.y, base, al, stars };
    }
    if (best) { claimed.add(key(s, tileAt(s, best.x, best.y)!)); serves.push(best); }
  }
  return { total: Math.min(TRADE_CAP, Math.round(serves.reduce((n, e) => n + e.stars, 0))), serves };
}

/** Best payout a ship of `owner` could earn by sailing from where it is to (x, y), under wind `dir` (AI). */
function optionValue(s: GameState, owner: number, u: Unit, x: number, y: number, dir: number, claimed: Set<number>): number {
  const al = alignment(dir, x - u.x, y - u.y);
  let best = 0;
  for (const t of [tileAt(s, x, y)!, ...neighbors(s, x, y)]) {
    const base = baseOf(t);
    if (!base || claimed.has(key(s, t)) || tileOwnerPlayer(s, t) !== owner) continue;
    best = Math.max(best, base * mult(al));
  }
  return best;
}

const portMine = (s: GameState, owner: number, t: Tile) => t.improvement === 'port' && tileOwnerPlayer(s, t) === owner;
const navalCount = (s: GameState, owner: number) => s.units.filter((u) => u.owner === owner && def(u).naval).length;
const dhowCap = (s: GameState, owner: number) => Math.min(4, 2 * s.tiles.filter((t) => portMine(s, owner, t)).length);
/** Ports stand on the shore: the dhow is launched into a free water tile beside it. */
const launchTile = (s: GameState, port: Tile) =>
  neighbors(s, port.x, port.y).filter((n) => isWater(n) && !s.units.some((u) => u.x === n.x && u.y === n.y)).sort((a, b) => a.y - b.y || a.x - b.x)[0];
function dhowCheck(s: GameState, owner: number, t: Tile): string | null {
  if (!portMine(s, owner, t)) return 'Needs one of your ports';
  if (!launchTile(s, t)) return 'No free water beside the port';
  if (navalCount(s, owner) >= dhowCap(s, owner)) return 'Your ports keep at most 2 ships each (4 in all)';
  return null;
}

/** Idle trading ships: no cargo, not yet moved, no enemy close. */
const fleetOf = (s: GameState, owner: number) =>
  s.units.filter((u) => u.owner === owner && def(u).naval && !u.carrying && !u.moved
    && !s.units.some((e) => e.owner !== owner && dist(e.x, e.y, u.x, u.y) <= 3));

/** Tiles already served this turn by ships that have sailed (so the AI spreads out). */
function claimedNow(s: GameState, owner: number): Set<number> {
  const c = new Set<number>();
  for (const u of s.units) {
    if (u.owner !== owner || !def(u).naval || shipTrade(u)?.turn !== s.turn) continue;
    for (const t of [tileAt(s, u.x, u.y)!, ...neighbors(s, u.x, u.y)]) if (baseOf(t)) c.add(key(s, t));
  }
  return c;
}

export const mech: Mechanic = {
  name: 'Monsoon Trade Currents',
  blurb: 'The sea wind turns each season: ships sail fast with it and slow against it, and Lighthouses call it. Ships that sail with the wind past fish, whale and port tiles earn double Stars (half against).',

  setup(s, owner) {
    const p = s.players[owner];
    p.mech = { ...(p.mech ?? {}), trades: 0, tradeStars: 0, windCalls: 0, lastTrade: 0 };
  },

  // With the wind a step costs less, against it more. Applies to every empire's ships on open water.
  moveStep(s, _owner, u, from, to, ctx) {
    if (!def(u).naval || !isWater(to) || !isWater(from)) return;
    const al = alignment(windDir(s), to.x - from.x, to.y - from.y);
    const own = isSwahili(s, u.owner);
    if (al > 0) ctx.cost = Math.min(ctx.cost, own ? 0.5 : 0.75);
    else if (al < 0) ctx.cost = Math.max(ctx.cost, own ? 1.25 : 1.5);
  },

  // Remember which way the ship sailed relative to the wind; the next turn's income reads it.
  afterMove(s, owner, u, from, to) {
    if (u.owner !== owner || !def(u).naval) return;
    const al = alignment(windDir(s), to.x - from.x, to.y - from.y);
    u.data = { ...(u.data ?? {}), trade: { turn: s.turn, al } };
  },

  income(s, owner) { return tradeReport(s, owner).total + 3 * s.cities.filter((c) => c.owner === owner).length; },

  turnStart(s, owner) {
    if (s.turn === 0) return;
    const r = tradeReport(s, owner);
    const p = s.players[owner];
    p.mech = { ...(p.mech ?? {}), trades: ((p.mech?.trades as number) ?? 0) + r.serves.length, tradeStars: ((p.mech?.tradeStars as number) ?? 0) + r.total, lastTrade: r.total };
    for (const e of r.serves) emit({ type: 'harvest', player: owner, x: e.x, y: e.y, pop: 0 });
  },

  actions(s, owner, t): Action[] {
    const stars = s.players[owner].stars;
    if (isMine(s, owner, t)) {
      const cur = windDir(s);
      const out: Action[] = [];
      DIRS.forEach((d, i) => {
        if (i === cur) return;
        const why = windCheck(s, owner, t, i) ?? (stars < WIND_COST ? 'Not enough stars' : null);
        out.push({ id: `mech:wind:${i}`, label: `Call the wind ${d.name} ${d.arrow}`, cost: WIND_COST, icon: 'port', enabled: !why, reason: why ?? undefined,
          desc: `Turn the monsoon to blow ${d.name} across the whole map until the season shifts (${turnsToShift(s)} turns). Ships sailing with it move faster and earn double.` });
      });
      return out;
    }
    if (portMine(s, owner, t)) {
      const why = dhowCheck(s, owner, t) ?? (stars < DHOW_COST ? 'Not enough stars' : null);
      return [{ id: 'mech:dhow', label: 'Launch Dhow', cost: DHOW_COST, icon: 'ship', enabled: !why, reason: why ?? undefined,
        desc: 'A merchant dhow. Sail it with the monsoon past fish, whale and port tiles for double Stars.' }];
    }
    if (tileOwnerPlayer(s, t) !== owner || !isLand(t) || t.improvement) return [];
    const why = buildCheck(s, owner, t) ?? (stars < LIGHTHOUSE_COST ? 'Not enough stars' : null);
    if (why === 'Needs open coastal ground' || why === 'Only in your own territory') return [];
    return [{ id: 'mech:lighthouse', label: 'Build Lighthouse', cost: LIGHTHOUSE_COST, icon: 'port', enabled: !why, reason: why ?? undefined,
      desc: `A coastal beacon. From it you can call the monsoon wind map-wide for ${WIND_COST}★, steering ships (and trade) your way.` }];
  },

  doAction(s, owner, t, id) {
    if (!isSwahili(s, owner)) return false;
    if (id === 'mech:lighthouse') {
      if (buildCheck(s, owner, t)) return false;
      t.improvement = 'lighthouse';
      t.data = { ...(t.data ?? {}), swahili: owner };
      emit({ type: 'harvest', player: owner, x: t.x, y: t.y, pop: 0 });
      return true;
    }
    if (id === 'mech:dhow') {
      if (dhowCheck(s, owner, t)) return false;
      const sea = launchTile(s, t)!;
      spawnUnit(s, 'boat', owner, sea.x, sea.y, null);
      return true;
    }
    if (id.startsWith('mech:wind:')) {
      const dir = Number(id.slice('mech:wind:'.length));
      if (!(dir >= 0 && dir < 4) || windCheck(s, owner, t, dir)) return false;
      callWind(s, owner, t, dir);
      return true;
    }
    return false;
  },

  ai(s, owner) {
    const p = s.players[owner];
    const cities = s.cities.filter((c) => c.owner === owner);

    // 1. A lighthouse or two once the treasury allows.
    if (lighthouses(s, owner).length < Math.min(2, cities.length) && p.stars >= LIGHTHOUSE_COST) {
      const sites = s.tiles.filter((t) => !buildCheck(s, owner, t))
        .map((t) => ({ t, v: neighbors(s, t.x, t.y, 2).filter((n) => baseOf(n) && tileOwnerPlayer(s, n) === owner).length }))
        .sort((a, b) => b.v - a.v || a.t.y - b.t.y || a.t.x - b.t.x);
      if (sites.length && mech.doAction!(s, owner, sites[0].t, 'mech:lighthouse')) { p.stars -= LIGHTHOUSE_COST; return true; }
    }

    // 1b. Launch a dhow from a free port.
    if (p.stars >= DHOW_COST + 1) {
      const port = s.tiles.find((t) => !dhowCheck(s, owner, t));
      if (port && mech.doAction!(s, owner, port, 'mech:dhow')) { p.stars -= DHOW_COST; return true; }
    }

    // 2. Call the wind that best serves the fleet this turn.
    const fleet = fleetOf(s, owner);
    const cl = claimedNow(s, owner);
    if (fleet.length && p.stars >= WIND_COST) {
      const cur = windDir(s);
      const lh = lighthouses(s, owner).find((t) => t.data?.windTurn !== stampOf(s));
      if (lh) {
        const reach = fleet.map((u) => moveOptions(s, u).filter((o) => isWater(tileAt(s, o.x, o.y)!) && !o.disembark && !o.embark).map((o) => ({ u, o })));
        const score = (dir: number) => reach.reduce((n, opts) => n + Math.max(0, ...opts.map(({ u, o }) => optionValue(s, owner, u, o.x, o.y, dir, cl))), 0);
        const curScore = score(cur);
        let bestDir = cur, best = curScore;
        for (let d = 0; d < 4; d++) { if (d === cur) continue; const v = score(d); if (v > best + 0.001) { best = v; bestDir = d; } }
        if (bestDir !== cur && best >= curScore + 2 && mech.doAction!(s, owner, lh, `mech:wind:${bestDir}`)) { p.stars -= WIND_COST; return true; }
      }
    }

    // 3. Send idle ships sailing past fish, whales and ports, preferably with the wind.
    const dir = windDir(s);
    for (const u of fleet) {
      let pick: { x: number; y: number; v: number } | null = null;
      for (const o of moveOptions(s, u)) {
        const t = tileAt(s, o.x, o.y)!;
        if (!isWater(t) || o.disembark || o.embark) continue;
        const v = optionValue(s, owner, u, o.x, o.y, dir, cl);
        if (v > 0 && (!pick || v > pick.v)) pick = { x: o.x, y: o.y, v };
      }
      if (pick && moveUnit(s, u, pick.x, pick.y)) return true;
    }
    return false;
  },
};

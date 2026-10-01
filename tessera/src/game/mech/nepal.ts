import { emit } from '../events';
import { hostile } from '../diplomacy';
import { neighbors, tileAt } from '../grid';
import { spawnUnit } from '../mapgen';
import { citiesOf, cityById, doAction, maxHp, tileActions, tileOwnerPlayer, trainCost, unitAt, unitCap } from '../rules';
import type { Action } from '../rules';
import type { City, GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// Himalayan Kingdom (empire bonus) + Rope Bridges & Gurkha Recruits (signature).
//
// Himalayan Kingdom (`stat`): a Nepali unit standing on a mountain, or on a tile next to one, attacks +HIMALAYA_ATK.
// Nepali units also scale mountains without the Climbing tech (the `canClimb` check in rules.ts names Nepal beside Tibet).
//
// Rope Bridges (`mech:ropebridge`, a tile action on a mountain inside Nepal's borders, BRIDGE_COST★): porters sling a
// sagging rope-and-plank bridge hung with prayer flags across the peak (`tile.data.ropebridge` = the builder's player id).
// Nepali units step onto and off a bridged mountain at road cost (BRIDGE_STEP move points) and are not stopped by it
// (`moveStep`), unless an enemy stands beside the bridge. Other empires' units gain nothing from the ropes.
//
// Gurkha Recruits (`mech:recruit`, a city action): a city on or next to a mountain may raise a Gurkha straight as a
// veteran (+5 HP) for the normal Gurkha price, once every RECRUIT_COOLDOWN turns per city (`city.data.recruited` = the
// turn of the last levy). It needs a free city tile and a free unit slot, like ordinary training.

export const HIMALAYA_ATK = 0.5;
export const BRIDGE_COST = 3;
export const BRIDGE_STEP = 0.5;
export const RECRUIT_COOLDOWN = 4;
/** Stars the computer keeps in hand after slinging a bridge. */
export const AI_BRIDGE_RESERVE = 6;
/** How close (tiles) an enemy must be for the computer to call a city threatened. */
export const AI_THREAT = 3;

const isNepal = (s: GameState, pid: number) => s.players[pid]?.tribe === 'nepal';
const near = (ax: number, ay: number, bx: number, by: number, r: number) => Math.max(Math.abs(ax - bx), Math.abs(ay - by)) <= r;
const isPeak = (t: Tile | undefined) => t?.terrain === 'mountain';

// ---------------------------------------------------------------- Himalayan Kingdom

/** Is (x, y) a mountain or next to one? */
export function byMountain(s: GameState, x: number, y: number): boolean {
  const t = tileAt(s, x, y);
  if (!t) return false;
  return isPeak(t) || neighbors(s, x, y).some(isPeak);
}

// ---------------------------------------------------------------- Rope Bridges

/** Does this tile carry a rope bridge? */
export const hasBridge = (t: Tile | undefined) => !!t && typeof t.data?.ropebridge === 'number' && t.terrain === 'mountain';

/** Rope bridges inside `owner`'s borders. */
export const bridgesOf = (s: GameState, owner: number): Tile[] => s.tiles.filter((t) => hasBridge(t) && tileOwnerPlayer(s, t) === owner);

/** Why a rope bridge can't be slung on `t` (stars aside), or null. */
export function bridgeWhy(s: GameState, owner: number, t: Tile): string | null {
  if (!isNepal(s, owner)) return 'Only Nepal slings rope bridges';
  if (t.terrain !== 'mountain') return 'Only across a mountain';
  if (tileOwnerPlayer(s, t) !== owner) return 'Only inside your borders';
  if (hasBridge(t)) return 'A bridge already spans this peak';
  const u = unitAt(s, t.x, t.y);
  if (u && u.owner !== owner) return 'An enemy holds the pass';
  return null;
}

/** Sling a rope bridge across mountain `t` (stars are paid by the caller). */
export function slingBridge(s: GameState, owner: number, t: Tile): boolean {
  if (bridgeWhy(s, owner, t)) return false;
  t.data = { ...(t.data ?? {}), ropebridge: owner };
  emit({ type: 'toast', player: owner, text: `🌉 Porters sling a rope bridge across the pass: Nepali units cross this mountain at road speed.` });
  return true;
}

// ---------------------------------------------------------------- Gurkha Recruits

/** Is city `c` a hill city (on or next to a mountain)? */
export const hillCity = (s: GameState, c: City) => byMountain(s, c.x, c.y);

/** The turn city `c` may next recruit, or 0 when it is ready. */
export function recruitReady(s: GameState, c: City): number {
  const last = c.data?.recruited;
  if (typeof last !== 'number') return 0;
  const at = last + RECRUIT_COOLDOWN;
  return s.turn >= at ? 0 : at;
}

/** Why city `c` can't recruit a Gurkha now (stars aside), or null. */
export function recruitWhy(s: GameState, owner: number, c: City | undefined): string | null {
  if (!isNepal(s, owner)) return 'Only Nepal recruits Gurkhas';
  if (!c || c.owner !== owner) return 'Only in your own city';
  if (!hillCity(s, c)) return 'Only a city on or beside a mountain';
  const at = recruitReady(s, c);
  if (at) return `Next levy on turn ${at}`;
  if (unitAt(s, c.x, c.y)) return 'City tile is occupied';
  if (c.units >= unitCap(c)) return `City supports ${unitCap(c)} units`;
  return null;
}

export const recruitCost = (s: GameState, owner: number) => trainCost(s, owner, 'gurkha');

/** Raise a veteran Gurkha at city `c` (stars are paid by the caller). */
export function recruit(s: GameState, owner: number, c: City): Unit | null {
  if (recruitWhy(s, owner, c)) return null;
  const u = spawnUnit(s, 'gurkha', owner, c.x, c.y, c.id);
  u.veteran = true;
  u.hp = maxHp(u);
  c.data = { ...(c.data ?? {}), recruited: s.turn };
  emit({ type: 'toast', player: owner, text: `🗡️ The hill villages round ${c.name} send a veteran Gurkha, kukri at his belt. Next levy in ${RECRUIT_COOLDOWN} turns.` });
  return u;
}

const cityOn = (s: GameState, t: Tile): City | undefined => {
  const c = cityById(s, t.cityId);
  return c && c.x === t.x && c.y === t.y ? c : undefined;
};

const foeNear = (s: GameState, owner: number, x: number, y: number, r: number) =>
  s.units.some((e) => e.owner !== owner && !s.players[e.owner]?.neutral && hostile(s, owner, e.owner) && near(e.x, e.y, x, y, r));

export const mech: Mechanic = {
  name: 'Rope Bridges & Gurkha Recruits',
  blurb: `Sling a rope bridge across a mountain in your borders (${BRIDGE_COST}★): your units cross it at road speed without stopping, and you climb mountains without Climbing. A city on or beside a mountain may raise a veteran Gurkha for the normal price once every ${RECRUIT_COOLDOWN} turns. Himalayan Kingdom: your units on or next to a mountain attack +${HIMALAYA_ATK}.`,

  stat(s, owner, u, stat) {
    if (stat !== 'atk' || u.owner !== owner || !isNepal(s, owner)) return 0;
    return byMountain(s, u.x, u.y) ? HIMALAYA_ATK : 0;
  },

  moveStep(s, owner, u, from, to, ctx) {
    if (u.owner !== owner || !isNepal(s, owner) || ctx.forbid) return;
    if (ctx.opt.embark || ctx.opt.disembark) return;
    const onto = hasBridge(to), off = hasBridge(from);
    if (!onto && !off) return;
    ctx.cost = Math.min(ctx.cost, BRIDGE_STEP);
    // the bridge itself never stops the crossing, but an enemy beside it still does
    if (onto && !foeNear(s, owner, to.x, to.y, 1)) ctx.stop = false;
  },

  actions(s, owner, t): Action[] {
    if (!isNepal(s, owner)) return [];
    const stars = s.players[owner].stars;
    const out: Action[] = [];
    if (t.terrain === 'mountain' && tileOwnerPlayer(s, t) === owner && !hasBridge(t)) {
      const why = bridgeWhy(s, owner, t) ?? (stars < BRIDGE_COST ? 'Not enough stars' : null);
      out.push({
        id: 'mech:ropebridge', label: 'Rope Bridge', cost: BRIDGE_COST, icon: 'road', enabled: !why, reason: why ?? undefined,
        desc: `Sling a rope-and-plank bridge hung with prayer flags across this peak: your units step onto and off it for ${BRIDGE_STEP} move without stopping.`,
      });
    }
    const c = cityOn(s, t);
    if (c && c.owner === owner && hillCity(s, c)) {
      const cost = recruitCost(s, owner);
      const why = recruitWhy(s, owner, c) ?? (stars < cost ? 'Not enough stars' : null);
      out.push({
        id: 'mech:recruit', label: 'Recruit Gurkha', cost, icon: 'gurkha', enabled: !why, reason: why ?? undefined,
        desc: `The hill villages send a veteran Gurkha (❤${12 + 5}, ⚔3 🛡2), no extra cost. Once every ${RECRUIT_COOLDOWN} turns per city; needs a free unit slot.`,
      });
    }
    return out;
  },

  doAction(s, owner, t, id) {
    if (id === 'mech:ropebridge') return slingBridge(s, owner, t);
    if (id === 'mech:recruit') {
      const c = cityOn(s, t);
      return !!c && !!recruit(s, owner, c);
    }
    return false;
  },

  // Recruits Gurkhas at threatened hill cities (or any ready hill city when rich), then slings a bridge on a peak
  // next to one of its cities when it has stars to spare.
  ai(s, owner) {
    if (!isNepal(s, owner)) return false;
    const p = s.players[owner];
    const cost = recruitCost(s, owner);
    const cities = citiesOf(s, owner);
    const threatened = (c: City) => foeNear(s, owner, c.x, c.y, AI_THREAT);
    const ready = cities.filter((c) => !recruitWhy(s, owner, c)).sort((a, b) => Number(threatened(b)) - Number(threatened(a)));
    for (const c of ready) {
      if (p.stars < cost + (threatened(c) ? 0 : 5)) continue;
      const t = tileAt(s, c.x, c.y)!;
      if (tileActions(s, owner, t).find((a) => a.id === 'mech:recruit')?.enabled && doAction(s, owner, t, 'mech:recruit')) return true;
    }
    if (p.stars < BRIDGE_COST + AI_BRIDGE_RESERVE) return false;
    for (const c of cities) {
      if (s.tiles.some((t) => hasBridge(t) && t.owner === c.id)) continue; // one bridge per city is plenty for the computer
      const spot = neighbors(s, c.x, c.y).find((t) => t.owner === c.id && !bridgeWhy(s, owner, t));
      if (!spot) continue;
      if (tileActions(s, owner, spot).find((a) => a.id === 'mech:ropebridge')?.enabled && doAction(s, owner, spot, 'mech:ropebridge')) return true;
    }
    return false;
  },
};

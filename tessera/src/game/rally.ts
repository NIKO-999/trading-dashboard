// Rally flag: a player plants a flag on a tile and orders nearby units to march to it. Units under orders take one
// step-of-a-turn towards the flag (their whole move) when ordered and again at the start of each of the player's turns,
// until they reach it, an enemy comes next to them, or they can get no closer. Moving one by hand cancels its order.
// The flag lives in the player's `mech` state and each unit's order in its `data`, so both survive a save.
import { dist, isWater, tileAt } from './grid';
import { attackOptions, isExplored, moveOptions, moveUnit } from './rules';
import type { GameState, Unit } from './types';

export interface Rally { x: number; y: number; r: number }

/** How far from the flag units can be called in: the picker offers these. */
export const RALLY_RANGES = [2, 3, 4, 5, 6] as const;
export const RALLY_DEFAULT = 4;

export const rallyOf = (s: GameState, pid: number): Rally | null => (s.players[pid].mech?.rally as Rally | undefined) ?? null;
export const isRallying = (u: Unit) => u.data?.rally === 1;

export function setRally(s: GameState, pid: number, x: number, y: number, r: number) {
  const p = s.players[pid];
  p.mech = { ...p.mech, rally: { x, y, r } };
  for (const u of s.units) if (u.owner === pid && isRallying(u) && dist(u.x, u.y, x, y) > r) stopRally(u); // the old orders were for the old flag
}

/** Take the flag down; every unit marching to it stands where it is. */
export function clearRally(s: GameState, pid: number) {
  const p = s.players[pid];
  if (p.mech) delete p.mech.rally;
  for (const u of s.units) if (u.owner === pid) stopRally(u);
}

export function stopRally(u: Unit) {
  if (!u.data) return;
  delete u.data.rally;
  delete u.data.rallyStuck;
}

/** The player's units that could be called to a flag at (x, y): within `r` tiles, and not already standing on it. */
export function rallyCandidates(s: GameState, pid: number, x: number, y: number, r: number): Unit[] {
  return s.units
    .filter((u) => u.owner === pid && dist(u.x, u.y, x, y) <= r && !(u.x === x && u.y === y) && u.kind !== 'explorer')
    .sort((a, b) => dist(a.x, a.y, x, y) - dist(b.x, b.y, x, y) || a.id - b.id);
}

/** Give the chosen units their orders (the rest keep whatever they had). */
export function orderRally(s: GameState, pid: number, ids: number[]) {
  for (const u of s.units) if (u.owner === pid && ids.includes(u.id)) u.data = { ...u.data, rally: 1, rallyStuck: 0 };
}

export interface RallyReport { moved: number; arrived: number; halted: Unit[]; stuck: number }

/**
 * March every unit under orders that has not moved yet this turn. Each takes the reachable tile closest to the flag
 * (never boarding a boat on the way, and never stepping onto ground it hasn't seen); one that can attack an enemy
 * stops and waits for its player instead.
 */
export function rallyStep(s: GameState, pid: number): RallyReport {
  const flag = rallyOf(s, pid);
  const out: RallyReport = { moved: 0, arrived: 0, halted: [], stuck: 0 };
  const marching = s.units.filter((u) => u.owner === pid && isRallying(u));
  if (!flag) { for (const u of marching) stopRally(u); return out; }
  // the closest go first, so they make room at the front for the rest
  marching.sort((a, b) => dist(a.x, a.y, flag.x, flag.y) - dist(b.x, b.y, flag.x, flag.y) || a.id - b.id);
  for (const u of marching) {
    if (!s.units.includes(u)) continue;
    const here = dist(u.x, u.y, flag.x, flag.y);
    if (here <= 1) { stopRally(u); out.arrived++; continue; }
    if (u.moved) continue;
    if (attackOptions(s, u).length) { stopRally(u); out.halted.push(u); continue; } // contact: the player decides
    const afloat = u.carrying !== null || isWater(tileAt(s, u.x, u.y)!); // a boat may keep sailing; a land unit never boards one
    const opts = moveOptions(s, u).filter((o) => (afloat || !o.embark) && isExplored(s, pid, o.x, o.y));
    let best: { x: number; y: number } | null = null;
    let bestD = here;
    for (const o of opts) {
      const d = dist(o.x, o.y, flag.x, flag.y);
      if (d < bestD || (best && d === bestD && o.x === flag.x && o.y === flag.y)) { best = o; bestD = d; }
    }
    if (!best) {
      const stuck = Number(u.data?.rallyStuck ?? 0) + 1;
      if (stuck >= 2) { stopRally(u); out.stuck++; } // two turns without getting closer: give up
      else u.data = { ...u.data, rallyStuck: stuck };
      continue;
    }
    if (!moveUnit(s, u, best.x, best.y)) continue;
    out.moved++;
    if (u.data) u.data.rallyStuck = 0;
    if (dist(u.x, u.y, flag.x, flag.y) <= 1) { stopRally(u); out.arrived++; }
  }
  return out;
}

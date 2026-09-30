// Chest & Horns Formation (Zulu). An enemy unit is TRAPPED while at least three Zulu melee units stand on the tiles
// around it: the chest (the attacker in front) and the two horns closing in on either side. A trapped unit cannot
// retreat (it may not move) and cannot counter-attack, and Zulu melee attackers deal triple damage to it.
// The rule is purely geometric, so there is no saved state: it is recomputed from the unit positions.
import { UNITS } from '../../data/units';
import { dist } from '../grid';
import { attack, attackOptions, isExplored, moveOptions, moveUnit, previewCombat } from '../rules';
import type { GameState, Unit } from '../types';
import type { Mechanic } from './types';

/** Zulu melee units needed around an enemy to trap it. */
export const TRAP_SIZE = 3;
/** Regiments drawn from the kraals: every UPKEEP_STEP melee units of a Zulu army cost 1 star a turn (at most UPKEEP_CAP). */
export const UPKEEP_STEP = 1;
export const UPKEEP_CAP = 8;

const isZulu = (s: GameState, pid: number) => s.players[pid]?.tribe === 'zulu';
const melee = (u: Unit) => { const d = UNITS[u.kind]; return d.atk > 0 && d.range === 1 && !d.naval; };

/** The melee units of `owner` that hem in tile (x, y). */
export function hornsAround(s: GameState, owner: number, x: number, y: number): Unit[] {
  return s.units.filter((e) => e.owner === owner && melee(e) && dist(e.x, e.y, x, y) === 1);
}

/** Is `u` trapped by a Zulu formation of some other empire? Returns the trapping empire's id, or -1. */
export function trappedBy(s: GameState, u: Unit): number {
  for (const p of s.players) {
    if (!p.alive || p.id === u.owner || !isZulu(s, p.id)) continue;
    if (hornsAround(s, p.id, u.x, u.y).length >= TRAP_SIZE) return p.id;
  }
  return -1;
}
export const isTrapped = (s: GameState, u: Unit) => trappedBy(s, u) >= 0;

/** Move melee units next to a target so that the V closes; returns true if anything moved. */
function formV(s: GameState, owner: number): boolean {
  const free = s.units.filter((u) => u.owner === owner && melee(u) && !u.moved)
    .map((u) => ({ u, opts: moveOptions(s, u) })).filter((m) => m.opts.length);
  if (!free.length) return false;
  let best: { plan: { u: Unit; x: number; y: number }[]; score: number } | null = null;
  for (const e of s.units) {
    if (e.owner === owner || !isExplored(s, owner, e.x, e.y)) continue;
    const have = hornsAround(s, owner, e.x, e.y).length;
    if (have >= TRAP_SIZE) continue;
    // greedy assignment of distinct tiles around the target, most constrained unit first
    const cands = free.map((m) => ({ u: m.u, tiles: m.opts.filter((o) => dist(o.x, o.y, e.x, e.y) === 1) }))
      .filter((c) => c.tiles.length).sort((a, b) => a.tiles.length - b.tiles.length);
    const used = new Set<string>();
    const plan: { u: Unit; x: number; y: number }[] = [];
    for (const c of cands) {
      const t = c.tiles.find((o) => !used.has(`${o.x},${o.y}`));
      if (!t) continue;
      used.add(`${t.x},${t.y}`);
      plan.push({ u: c.u, x: t.x, y: t.y });
      if (have + plan.length >= TRAP_SIZE) break;
    }
    if (have + plan.length < TRAP_SIZE) continue;
    const score = plan.length * 100 + e.hp; // fewest extra moves, then the weakest prey
    if (!best || score < best.score) best = { plan, score };
  }
  if (!best) return false;
  let moved = false;
  for (const p of best.plan) if (moveUnit(s, p.u, p.x, p.y)) moved = true;
  return moved;
}

export const mech: Mechanic = {
  name: 'Chest & Horns Formation',
  blurb: 'Melee units in a V around an enemy trap it, stopping its counter-attack and dealing triple damage.',

  // the regiments must be fed
  income(s, owner) {
    return -Math.min(UPKEEP_CAP, Math.max(0, s.players[owner].stars), Math.floor(s.units.filter((u) => u.owner === owner && melee(u)).length / UPKEEP_STEP));
  },

  // a trapped unit has nowhere to go
  moveStep(s, _owner, u, _from, _to, ctx) {
    if (isTrapped(s, u)) ctx.forbid = true;
  },

  combat(s, owner, a, d, ctx) {
    if (a.owner !== owner || !isZulu(s, owner) || !melee(a) || d.owner === owner) return;
    if (dist(a.x, a.y, d.x, d.y) !== 1 || hornsAround(s, owner, d.x, d.y).length < TRAP_SIZE) return;
    ctx.dmg *= 3; // the horns close: triple damage
    ctx.ret = 0; // ...and the trapped unit cannot hit back
    ctx.tag = 'Trap!';
  },

  ai(s, owner) {
    // 1. Spring the trap: strike any trapped enemy with the units that can still attack.
    for (const u of s.units) {
      if (u.owner !== owner || u.attacked || !melee(u)) continue;
      const prey = attackOptions(s, u).filter((e) => trappedBy(s, e) === owner && dist(u.x, u.y, e.x, e.y) === 1)
        .sort((x, y) => Number(previewCombat(s, u, y).kills) - Number(previewCombat(s, u, x).kills) || x.hp - y.hp)[0];
      if (prey && attack(s, u, prey)) return true;
    }
    // 2. Otherwise close a V around the enemy that needs the fewest extra units.
    return formV(s, owner);
  },
};

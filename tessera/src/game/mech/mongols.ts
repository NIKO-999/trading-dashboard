// Mongols: Feigned Retreat & Horde Steppe.
//  - Feigned Retreat: after a Mongol mounted unit attacks it may pull back up to RETREAT_TILES tiles (its `moved` flag is
//    reopened, but the move is capped; the unit cannot attack again). The offer lives in `unit.data.retreat` (the turn it was
//    earned) and is spent by moving or lapses with the turn.
//  - Horde Steppe: a Mongol unit with range that has neither moved nor attacked is "waiting". An enemy that ends a move within
//    the range of a waiting archer is ambushed: the archer fires one free shot (no return fire). Each archer ambushes once per
//    enemy round (`unit.data.ambush` holds the turn it fired; it is cleared at the start of the Mongols' own turn).
import { emit } from '../events';
import { dist, tileAt } from '../grid';
import { MOUNTED_KINDS } from '../perks';
import { attackOptions, def, moveOptions, moveUnit, previewCombat, removeUnit } from '../rules';
import type { GameState, Unit } from '../types';
import { citiesOf } from '../rules';
import type { Mechanic } from './types';

/** How far a unit may pull back after attacking. */
export const RETREAT_TILES = 2;
/** How far (in tiles) an AI archer looks for enemies before it digs in and waits. */
const WATCH_RANGE = 7;
/** Stars plundered for each enemy unit a Mongol unit kills. */
export const PLUNDER = 3;

const isMongol = (s: GameState, pid: number) => s.players[pid].tribe === 'mongols';

/** May this unit pull back right now? */
export function canRetreat(s: GameState, u: Unit): boolean {
  return isMongol(s, u.owner) && u.data?.retreat === s.turn && u.attacked && !u.moved;
}

/** A Mongol unit with range that has not acted this turn: it lies in wait. */
export function isWaiting(s: GameState, u: Unit): boolean {
  return isMongol(s, u.owner) && def(u).range > 1 && def(u).atk > 0 && !u.moved && !u.attacked && !def(u).naval;
}

/** How far a waiting archer covers (tiles). */
export const ambushRange = (u: Unit) => def(u).range;

/** Waiting archers of `pid`, and whether each still has its shot. */
export function ambushers(s: GameState, pid: number): { u: Unit; ready: boolean }[] {
  return s.units.filter((u) => u.owner === pid && isWaiting(s, u)).map((u) => ({ u, ready: u.data?.ambush !== s.turn }));
}

export const mech: Mechanic = {
  name: 'Feigned Retreat & Horde Steppe',
  blurb: 'Riders strike, pull back and lure the enemy into an ambush set by waiting archers.',

  turnStart(s, owner) {
    for (const u of s.units) if (u.owner === owner && u.data) { delete u.data.ambush; }
  },
  turnEnd(s, owner) {
    for (const u of s.units) if (u.owner === owner && u.data) { delete u.data.retreat; delete u.data.aiTurn; }
  },

  // ---- feigned retreat
  // Plunder & horde tribute: kills fill the coffers, and the steppe pays a tribute per city.
  income(s, owner) { return 3 + citiesOf(s, owner).length; },
  unitDied(s, owner, u, killer) {
    if (killer && killer.owner === owner && u.owner !== owner) s.players[owner].stars += PLUNDER;
  },
  afterAttack(s, owner, a) {
    if (a.owner !== owner || !MOUNTED_KINDS.includes(a.kind)) return;
    (a.data ??= {}).retreat = s.turn;
    a.moved = false; // reopen the move; moveStep caps it
    if (!s.players[owner].human) return;
    emit({ type: 'toast', player: owner, text: `Feigned retreat: pull back up to ${RETREAT_TILES} tiles.` });
  },
  moveStep(s, owner, u, _from, to, ctx) {
    if (u.owner !== owner) return;
    if (canRetreat(s, u) && dist(u.x, u.y, to.x, to.y) > RETREAT_TILES) ctx.forbid = true;
    // an AI archer that has dug in stays put
    if (!s.players[owner].human && u.data?.hold === s.turn && def(u).range > 1 && !MOUNTED_KINDS.includes(u.kind)) ctx.forbid = true;
  },

  // ---- horde steppe ambush
  afterMove(s, owner, u, _from, to) {
    if (u.owner === owner || s.units.indexOf(u) < 0) return;
    for (const { u: a, ready } of ambushers(s, owner)) {
      if (!ready || dist(a.x, a.y, to.x, to.y) > ambushRange(a)) continue;
      const { dmg, kills } = previewCombat(s, a, u);
      (a.data ??= {}).ambush = s.turn;
      emit({ type: 'attack', unitId: a.id, kind: a.kind, player: owner, from: { x: a.x, y: a.y }, to: { x: u.x, y: u.y }, ranged: true });
      u.hp -= Math.max(1, dmg); // a free shot: no return fire
      emit({ type: 'damage', unitId: u.id, x: u.x, y: u.y, amount: Math.max(1, dmg) });
      emit({ type: 'toast', player: owner, text: 'Ambush!' });
      if (kills || u.hp <= 0) {
        removeUnit(s, u, a);
        emit({ type: 'death', unitId: u.id, x: u.x, y: u.y, owner: u.owner, kind: u.kind });
        s.players[owner].kills++;
        a.veteranKills++;
        return;
      }
    }
  },

  ai(s, owner) {
    const enemies = s.units.filter((e) => e.owner !== owner);
    // 1. pull riders back after a strike, toward the waiting archers and away from the enemy
    for (const u of s.units) {
      if (u.owner !== owner || !canRetreat(s, u)) continue;
      const archers = s.units.filter((a) => a.owner === owner && a !== u && def(a).range > 1 && !MOUNTED_KINDS.includes(a.kind));
      const near = (list: { x: number; y: number }[], x: number, y: number) => list.reduce((m, e) => Math.min(m, dist(e.x, e.y, x, y)), 9);
      const score = (x: number, y: number) => near(enemies, x, y) * 2 - near(archers, x, y) + (tileAt(s, x, y)!.owner !== null ? 0.5 : 0);
      const here = score(u.x, u.y);
      const best = moveOptions(s, u).filter((o) => !o.embark && !o.disembark).map((o) => ({ o, v: score(o.x, o.y) })).sort((a, b) => b.v - a.v)[0];
      if (best && best.v > here) return moveUnit(s, u, best.o.x, best.o.y);
      u.moved = true; // nowhere better: hold this ground
      return true;
    }
    // 2. archers dig in and wait while an enemy is near and nothing is in reach to shoot
    for (const u of s.units) {
      if (u.owner !== owner || u.data?.aiTurn === s.turn || def(u).range <= 1 || MOUNTED_KINDS.includes(u.kind) || def(u).naval) continue;
      (u.data ??= {}).aiTurn = s.turn;
      const watching = enemies.some((e) => dist(e.x, e.y, u.x, u.y) <= WATCH_RANGE) && attackOptions(s, u).length === 0;
      if (watching) u.data.hold = s.turn;
      else delete u.data.hold;
    }
    return false;
  },
};

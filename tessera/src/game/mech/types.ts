// The framework for each empire's game-defining mechanic. An empire's file in this folder (e.g. mech/zulu.ts) fills in
// whichever hooks it needs; the rules call the hooks of EVERY empire in the game, so a mechanic can act on its owner
// (owner === the empire whose mechanic it is) or on everyone else (an ice bridge, a flood, a blockade...).
//
// Rules for writing a mechanic:
//  - keep its state in `player.mech`, `s.mech`, or the `data` field of a tile, city or unit (JSON-safe, so saves work);
//  - never import from ui/ or render/ here: this code runs in the tests without a browser;
//  - the AI plays too: give the mechanic an `ai` hook so computer players use it.
import type { Action, MoveOption } from '../rules';
import type { City, GameState, Tile, TribeId, Unit } from '../types';

/** Movement of one step, which a mechanic may alter. */
export interface MoveCtx {
  cost: number; // move points this step costs
  stop: boolean; // the unit must end its move here
  forbid: boolean; // the step is not allowed at all
  opt: MoveOption; // may be given embark/disembark flags
}

/** The numbers of one attack, which a mechanic may alter before they are applied. */
export interface CombatCtx {
  dmg: number; // damage the defender takes
  ret: number; // damage the attacker takes back
  ranged: boolean;
  kills: boolean; // recomputed from dmg after the hooks run
}

export interface AttackInfo {
  dmg: number;
  ret: number;
  killed: boolean;
  ranged: boolean;
}

export interface Mechanic {
  /** Shown to players on the empire screens. */
  name: string;
  blurb: string;

  /** Once, when the game is created (cities and units exist). Set up starting units, terrain, `player.mech`. */
  setup?(s: GameState, owner: number): void;
  /** At the start / end of `owner`'s own turn. */
  turnStart?(s: GameState, owner: number): void;
  turnEnd?(s: GameState, owner: number): void;

  /** Every step of every unit's movement; called for all empires' mechanics. */
  moveStep?(s: GameState, owner: number, u: Unit, from: Tile, to: Tile, ctx: MoveCtx): void;
  /** Extra places `u` (a unit of `owner`) may jump to besides its walking range (ziplines, portals...). */
  extraMoves?(s: GameState, owner: number, u: Unit): MoveOption[];
  /** A flat bonus to a unit's stat from this mechanic (called for all empires' mechanics; check `u.owner`). */
  stat?(s: GameState, owner: number, u: Unit, stat: 'atk' | 'def' | 'move' | 'range'): number;

  /** Which enemies `u` (a unit of `owner`) may attack. Return the list to use. */
  attackTargets?(s: GameState, owner: number, u: Unit, targets: Unit[]): Unit[];
  /** Adjust one attack before it happens (called for all empires' mechanics). */
  combat?(s: GameState, owner: number, a: Unit, d: Unit, ctx: CombatCtx): void;
  /** Return true to spare a defender who would die (a captive is taken, a unit is spared...): it keeps 1 HP and lives. */
  spare?(s: GameState, owner: number, a: Unit, d: Unit): boolean;
  /** After an attack has been applied. */
  afterAttack?(s: GameState, owner: number, a: Unit, d: Unit, info: AttackInfo): void;
  /** After a unit has been removed from the game (`killer` is null when it did not die in combat). */
  unitDied?(s: GameState, owner: number, u: Unit, killer: Unit | null): void;
  /** After a city changed hands. */
  cityCaptured?(s: GameState, owner: number, c: City, from: number): void;

  /** Extra stars per turn for `owner`. */
  income?(s: GameState, owner: number): number;
  /** Extra tile actions for `owner`'s tile menu. Give them ids starting with `mech:`. */
  actions?(s: GameState, owner: number, t: Tile): Action[];
  /** Perform one of this mechanic's `mech:` actions; return true if done. You must charge the cost yourself. */
  doAction?(s: GameState, owner: number, t: Tile, id: string): boolean;
  /** Called for all empires' mechanics: return a reason to stop `pid` taking this action (e.g. 'Hyper-inflation'). */
  block?(s: GameState, owner: number, pid: number, actionId: string, t: Tile): string | undefined;

  /** Return false to hide unit `u` from `viewer` (called for all empires' mechanics). */
  unitVisible?(s: GameState, owner: number, viewer: number, u: Unit): boolean | undefined;
  cityVisible?(s: GameState, owner: number, viewer: number, c: City): boolean | undefined;

  /** One AI action for `owner`; return true if something was done (it is called again until it returns false). */
  ai?(s: GameState, owner: number): boolean;
}

export type MechRegistry = Record<TribeId, Mechanic>;

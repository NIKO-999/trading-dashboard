// Registry and dispatch of the empire mechanics. The rules call these functions; each one walks every living empire's
// mechanic, so a mechanic can act on its owner or on the whole world.
import type { Action, MoveOption } from '../rules';
import type { City, GameState, Tile, TribeId, Unit } from '../types';
import { adoptedHooks } from '../culture';
import type { AttackInfo, CombatCtx, MechRegistry, MoveCtx, Mechanic } from './types';
import { mech as egypt } from './egypt';
import { mech as aztec } from './aztec';
import { mech as polynesia } from './polynesia';
import { mech as rome } from './rome';
import { mech as pirates } from './pirates';
import { mech as vikings } from './vikings';
import { mech as japan } from './japan';
import { mech as mongols } from './mongols';
import { mech as greeks } from './greeks';
import { mech as zulu } from './zulu';
import { mech as persia } from './persia';
import { mech as celts } from './celts';
import { mech as inuit } from './inuit';
import { mech as inca } from './inca';
import { mech as ethiopia } from './ethiopia';
import { mech as aboriginal } from './aboriginal';
import { mech as china } from './china';
import { mech as india } from './india';
import { mech as mali } from './mali';
import { mech as lakota } from './lakota';
import { mech as ottoman } from './ottoman';
import { mech as maya } from './maya';
import { mech as korea } from './korea';
import { mech as khmer } from './khmer';
import { mech as swahili } from './swahili';
import { mech as tibet } from './tibet';

export const MECH: MechRegistry = { egypt, aztec, polynesia, rome, pirates, vikings, japan, mongols, greeks, zulu, persia, celts, inuit, inca, ethiopia, aboriginal, china, india, mali, lakota, ottoman, maya, korea, khmer, swahili, tibet };
export type { Mechanic, MoveCtx, CombatCtx, AttackInfo } from './types';

/** The mechanic of an empire. */
export const mechOf = (s: GameState, pid: number): Mechanic => MECH[s.players[pid].tribe];

/** A player's own mechanic, then the light hooks of traditions it adopted from conquered peoples (see game/culture). */
const own = (s: GameState, pid: number): Mechanic[] => {
  const extra = adoptedHooks(s, pid);
  return extra.length ? [MECH[s.players[pid].tribe], ...extra] : [MECH[s.players[pid].tribe]];
};

const each = (s: GameState, fn: (m: Mechanic, owner: number) => void) => {
  for (const p of s.players) {
    if (!p.alive) continue;
    fn(MECH[p.tribe], p.id);
    if (p.culture?.adopted?.length) for (const m of adoptedHooks(s, p.id)) fn(m, p.id);
  }
};

export function hookSetup(s: GameState) { each(s, (m, o) => m.setup?.(s, o)); }
export function hookTurnStart(s: GameState, pid: number) { for (const m of own(s, pid)) m.turnStart?.(s, pid); }
export function hookTurnEnd(s: GameState, pid: number) { for (const m of own(s, pid)) m.turnEnd?.(s, pid); }

export function hookMoveStep(s: GameState, u: Unit, from: Tile, to: Tile, ctx: MoveCtx) { each(s, (m, o) => m.moveStep?.(s, o, u, from, to, ctx)); }
export function hookExtraMoves(s: GameState, u: Unit): MoveOption[] { return mechOf(s, u.owner).extraMoves?.(s, u.owner, u) ?? []; }
export function hookStat(s: GameState, u: Unit, stat: 'atk' | 'def' | 'move' | 'range'): number {
  let n = 0;
  each(s, (m, o) => { n += m.stat?.(s, o, u, stat) ?? 0; });
  return n;
}

export function hookAttackTargets(s: GameState, u: Unit, targets: Unit[]): Unit[] { return mechOf(s, u.owner).attackTargets?.(s, u.owner, u, targets) ?? targets; }
export function hookCombat(s: GameState, a: Unit, d: Unit, ctx: CombatCtx) { each(s, (m, o) => m.combat?.(s, o, a, d, ctx)); }
export function hookSpare(s: GameState, a: Unit, d: Unit): boolean {
  let spared = false;
  each(s, (m, o) => { if (!spared && m.spare?.(s, o, a, d)) spared = true; });
  return spared;
}
export function hookAfterMove(s: GameState, u: Unit, from: { x: number; y: number }, to: Tile) { each(s, (m, o) => m.afterMove?.(s, o, u, from, to)); }
export function hookAfterAttack(s: GameState, a: Unit, d: Unit, info: AttackInfo) { each(s, (m, o) => m.afterAttack?.(s, o, a, d, info)); }
export function hookUnitDied(s: GameState, u: Unit, killer: Unit | null) { each(s, (m, o) => m.unitDied?.(s, o, u, killer)); }
export function hookCityCaptured(s: GameState, c: City, from: number) { each(s, (m, o) => m.cityCaptured?.(s, o, c, from)); }

export function hookIncome(s: GameState, pid: number): number { return own(s, pid).reduce((n, m) => n + (m.income?.(s, pid) ?? 0), 0); }
export function hookActions(s: GameState, pid: number, t: Tile): Action[] { return own(s, pid).flatMap((m) => m.actions?.(s, pid, t) ?? []); }
export function hookDoAction(s: GameState, pid: number, t: Tile, id: string): boolean { return own(s, pid).some((m) => m.doAction?.(s, pid, t, id) ?? false); }
export function hookBlock(s: GameState, pid: number, actionId: string, t: Tile): string | undefined {
  let why: string | undefined;
  each(s, (m, o) => { why ??= m.block?.(s, o, pid, actionId, t); });
  return why;
}

/** Can `viewer` see this unit? (Fog of war is handled by exploration; this is for cloaking mechanics.) */
export function unitVisibleTo(s: GameState, viewer: number, u: Unit): boolean {
  if (viewer < 0 || u.owner === viewer) return true;
  let ok = true;
  each(s, (m, o) => { if (m.unitVisible?.(s, o, viewer, u) === false) ok = false; });
  return ok;
}
export function cityVisibleTo(s: GameState, viewer: number, c: City): boolean {
  if (viewer < 0 || c.owner === viewer) return true;
  let ok = true;
  each(s, (m, o) => { if (m.cityVisible?.(s, o, viewer, c) === false) ok = false; });
  return ok;
}

export function hookAi(s: GameState, pid: number): boolean { return own(s, pid).some((m) => m.ai?.(s, pid) ?? false); }
export const MECH_IDS = Object.keys(MECH) as TribeId[];

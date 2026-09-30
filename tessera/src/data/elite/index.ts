// Each empire's two extra elite units, gathered from the group files. Registered into UNITS by data/units.
import type { TribeId, UnitKind } from '../../game/types';
import { ELITES as G1 } from './g1';
import { ELITES as G2 } from './g2';
import { ELITES as G3 } from './g3';
import { ELITES as G4 } from './g4';
import type { EliteSpec } from './types';
export type { EliteSpec } from './types';

export const ELITE_LIST: EliteSpec[] = [...G1, ...G2, ...G3, ...G4];
export const ELITE_BY_KIND: Record<string, EliteSpec> = Object.fromEntries(ELITE_LIST.map((e) => [e.kind, e]));
export const isElite = (k: UnitKind) => k.startsWith('elite:');
/** The elite units only this empire can train. */
export const elitesFor = (tribe: TribeId): UnitKind[] => ELITE_LIST.filter((e) => e.tribe === tribe).map((e) => e.kind);

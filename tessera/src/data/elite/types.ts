import type { Skill } from '../units';
import type { TribeId, UnitKind } from '../../game/types';

/**
 * One of an empire's two extra elite units. `kind` must be `elite:<tribe>:<name>`. Only `tribe` can train it,
 * once it knows `tech` (null = from the start). Plain stats and existing skills; any special rule lives in
 * the empire's own mechanic file (game/mech/<tribe>.ts), keyed on the unit kind.
 */
export interface EliteSpec {
  kind: UnitKind;
  tribe: TribeId;
  name: string;
  cost: number;
  hp: number;
  atk: number;
  def: number;
  move: number;
  range: number;
  naval?: boolean;
  skills: Skill[];
  tech: string | null;
  blurb: string; // one line: what it is and what it's good at
  history: string; // one line of history for the empire screens
}

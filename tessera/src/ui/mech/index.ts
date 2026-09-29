// Registry of the interface parts of the empire mechanics. Each empire's file exports `ui` when it needs one.
import type { MechUiRegistry } from './types';
export type { MechUi, MechView } from './types';

import { ui as india } from './india';

export const MECH_UI: MechUiRegistry = { india };

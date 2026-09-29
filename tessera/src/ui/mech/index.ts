// Registry of the interface parts of the empire mechanics. Each empire's file exports `ui` when it needs one.
import type { MechUiRegistry } from './types';
export type { MechUi, MechView } from './types';

import { ui as ethiopia } from './ethiopia';
import { ui as india } from './india';
import { ui as persia } from './persia';

export const MECH_UI: MechUiRegistry = { ethiopia, india, persia };

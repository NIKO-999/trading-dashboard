// Registry of the interface parts of the empire mechanics. Each empire's file exports `ui` when it needs one.
import type { MechUiRegistry } from './types';
export type { MechUi, MechView } from './types';

import { ui as egypt } from './egypt';
import { ui as ethiopia } from './ethiopia';
import { ui as india } from './india';
import { ui as khmer } from './khmer';
import { ui as persia } from './persia';
import { ui as tibet } from './tibet';
import { ui as vikings } from './vikings';

export const MECH_UI: MechUiRegistry = { egypt, ethiopia, india, khmer, persia, tibet, vikings };

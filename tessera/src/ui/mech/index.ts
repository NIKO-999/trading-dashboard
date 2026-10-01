// Registry of the interface parts of the empire mechanics. Each empire's file exports `ui` when it needs one.
import type { MechUiRegistry } from './types';
export type { MechUi, MechView } from './types';

import { ui as aboriginal } from './aboriginal';
import { ui as aztec } from './aztec';
import { ui as celts } from './celts';
import { ui as china } from './china';
import { ui as egypt } from './egypt';
import { ui as ethiopia } from './ethiopia';
import { ui as greeks } from './greeks';
import { ui as inca } from './inca';
import { ui as india } from './india';
import { ui as inuit } from './inuit';
import { ui as khmer } from './khmer';
import { ui as lakota } from './lakota';
import { ui as mali } from './mali';
import { ui as maya } from './maya';
import { ui as ottoman } from './ottoman';
import { ui as persia } from './persia';
import { ui as pirates } from './pirates';
import { ui as polynesia } from './polynesia';
import { ui as swahili } from './swahili';
import { ui as tibet } from './tibet';
import { ui as carthage } from './carthage';
import { ui as byzantium } from './byzantium';
import { ui as arabia } from './arabia';
import { ui as rus } from './rus';
import { ui as vietnam } from './vietnam';
import { ui as vikings } from './vikings';

export const MECH_UI: MechUiRegistry = { aboriginal, aztec, celts, china, egypt, ethiopia, greeks, inca, india, inuit, khmer, lakota, mali, maya, ottoman, persia, pirates, polynesia, swahili, tibet, vikings, carthage, byzantium, arabia, rus, vietnam };

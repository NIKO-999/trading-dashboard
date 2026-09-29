// Registry of the drawing parts of the empire mechanics. Each empire's file exports `render` when it has something to draw.
import type { MechRenderRegistry } from './types';
export type { MechRender } from './types';

import { render as aboriginal } from './aboriginal';
import { render as aztec } from './aztec';
import { render as celts } from './celts';
import { render as china } from './china';
import { render as egypt } from './egypt';
import { render as ethiopia } from './ethiopia';
import { render as greeks } from './greeks';
import { render as inca } from './inca';
import { render as inuit } from './inuit';
import { render as japan } from './japan';
import { render as khmer } from './khmer';
import { render as korea } from './korea';
import { render as lakota } from './lakota';
import { render as mali } from './mali';
import { render as maya } from './maya';
import { render as mongols } from './mongols';
import { render as ottoman } from './ottoman';
import { render as persia } from './persia';
import { render as pirates } from './pirates';
import { render as rome } from './rome';
import { render as swahili } from './swahili';
import { render as tibet } from './tibet';
import { render as vikings } from './vikings';
import { render as zulu } from './zulu';

export const MECH_RENDER: MechRenderRegistry = { aboriginal, aztec, celts, china, egypt, ethiopia, greeks, inca, inuit, japan, khmer, korea, lakota, mali, maya, mongols, ottoman, persia, pirates, rome, swahili, tibet, vikings, zulu };

// Registry of the drawing parts of the empire mechanics. Each empire's file exports `render` when it has something to draw.
import type { MechRenderRegistry } from './types';
export type { MechRender } from './types';

import { render as celts } from './celts';
import { render as china } from './china';
import { render as egypt } from './egypt';
import { render as ethiopia } from './ethiopia';
import { render as greeks } from './greeks';
import { render as japan } from './japan';
import { render as khmer } from './khmer';
import { render as korea } from './korea';
import { render as mali } from './mali';
import { render as mongols } from './mongols';
import { render as ottoman } from './ottoman';
import { render as persia } from './persia';
import { render as rome } from './rome';
import { render as tibet } from './tibet';
import { render as vikings } from './vikings';
import { render as zulu } from './zulu';

export const MECH_RENDER: MechRenderRegistry = { celts, china, egypt, ethiopia, greeks, japan, khmer, korea, mali, mongols, ottoman, persia, rome, tibet, vikings, zulu };

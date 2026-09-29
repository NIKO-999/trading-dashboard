// Registry of the drawing parts of the empire mechanics. Each empire's file exports `render` when it has something to draw.
import type { MechRenderRegistry } from './types';
export type { MechRender } from './types';

import { render as japan } from './japan';
import { render as korea } from './korea';
import { render as mongols } from './mongols';
import { render as persia } from './persia';
import { render as rome } from './rome';
import { render as zulu } from './zulu';

export const MECH_RENDER: MechRenderRegistry = { japan, korea, mongols, persia, rome, zulu };

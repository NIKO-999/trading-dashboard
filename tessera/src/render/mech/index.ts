// Registry of the drawing parts of the empire mechanics. Each empire's file exports `render` when it has something to draw.
import type { MechRenderRegistry } from './types';
export type { MechRender } from './types';

import { render as japan } from './japan';
import { render as zulu } from './zulu';

export const MECH_RENDER: MechRenderRegistry = { japan, zulu };

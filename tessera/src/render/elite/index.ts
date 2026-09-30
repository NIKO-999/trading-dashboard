// Art registry for the elite units (see data/elite).
import { ART as G1 } from './g1';
import { ART as G2 } from './g2';
import { ART as G3 } from './g3';
import { ART as G4 } from './g4';
import type { EliteArt } from './types';

export const ELITE_ART: EliteArt = { ...G1, ...G2, ...G3, ...G4 };

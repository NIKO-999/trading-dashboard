/* ============================================================
   The custom-body outfit dispatcher.

   Standard-body outfits (Flight Suit) are decorations on Voyager's shared
   rig, handled entirely inside Voyager.tsx. Everything here has its own
   body — its own helmet, its own limbs, sometimes no visor at all — so each
   gets its own component instead of another branch in the shared rig's
   already-long conditional pile.
   ============================================================ */

import { Cryo } from './Cryo';
import { Herald } from './Herald';
import { Ironclad } from './Ironclad';
import { Outrider } from './Outrider';
import { Pathfinder } from './Pathfinder';
import { Pyro } from './Pyro';
import { Revenant } from './Revenant';
import { Sentinel } from './Sentinel';
import { Voidwalker } from './Voidwalker';

/** Each figure was authored in its own viewBox — proportions are part of the design. */
export const FIGURE_VIEWBOX: Record<string, string> = {
  revenant: '0 0 200 300',
  sentinel: '0 0 200 300',
  herald: '0 0 200 320',
  outrider: '0 0 200 300',
  pyro: '0 -55 200 335',
  cryo: '0 -55 200 335',
  pathfinder: '0 0 200 300',
  voidwalker: '0 0 200 300',
  ironclad: '0 0 220 280',
};

export function OutfitFigure({ figureId, uid }: { figureId: string; uid: string }) {
  switch (figureId) {
    case 'revenant':
      return <Revenant uid={uid} />;
    case 'sentinel':
      return <Sentinel uid={uid} />;
    case 'herald':
      return <Herald uid={uid} />;
    case 'outrider':
      return <Outrider uid={uid} />;
    case 'pyro':
      return <Pyro uid={uid} />;
    case 'cryo':
      return <Cryo uid={uid} />;
    case 'pathfinder':
      return <Pathfinder uid={uid} />;
    case 'voidwalker':
      return <Voidwalker uid={uid} />;
    case 'ironclad':
      return <Ironclad uid={uid} />;
    default:
      return null;
  }
}

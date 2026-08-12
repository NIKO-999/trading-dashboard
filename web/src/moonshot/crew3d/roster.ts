/* ============================================================
   The crew roster.

   One record per character. Adding a character is an entry here plus three
   .glb files — no component, no switch, no import. See types.ts for why that
   is the whole point of this module.

   Only Vigil exists so far, by explicit build order: the full pipeline is
   proven end to end on one character before the next is started.

   Budgets below are TARGETS, declared up front so the perf probe has
   something to fail against. They are not measurements. perf/ reports what
   the assets actually cost, and docs/crew3d/performance-budget.md quotes the
   probe rather than this file.
   ============================================================ */

import type { CrewCharacter, CrewId } from './types';

/**
 * Vigil — the wait. Not entering.
 *
 * SUPERSEDED DESIGN NOTICE: the record below (models, lights, particles,
 * clothChains) describes the original gothic reliquary-knight direction —
 * halo, cloak, reliquary casket. That design was redirected to a wasteland
 * "generator servant" concept (docs/crew3d/vigil-spec.md rev. 2), built as a
 * 2D SVG illustration in web/src/workshop/VigilFigure2D.tsx rather than a 3D
 * asset. This CrewCharacter record was NOT reworked for the redirect — the
 * 3D pipeline (loader/LOD/particles/perf) is generic scaffolding that isn't
 * in scope for the current 2D pass, per explicit build direction. Treat the
 * fields below as an example of the 3D shape, not a description of the
 * character as it exists today. If a 3D pass is ever done for the new
 * design, this whole record needs rewriting to match rev. 2's props (mask,
 * tubing/bulbs, shoulder armor, ceramic limbs) — none of which are halo,
 * cloak or reliquary.
 *
 * Full production spec: docs/crew3d/vigil-spec.md
 */
const VIGIL: CrewCharacter = {
  id: 'vigil',
  name: 'Vigil',
  discipline: 'The wait — not entering.',
  tagline: 'Stood so long it became architecture.',
  models: {
    0: 'vigil/vigil.lod0.glb',
    1: 'vigil/vigil.lod1.glb',
    2: 'vigil/vigil.lod2.glb',
  },
  budget: {
    lods: [
      { level: 0, triangles: 28_000, maxRenderPx: Infinity },
      { level: 1, triangles: 12_000, maxRenderPx: 260 },
      { level: 2, triangles: 4_000, maxRenderPx: 120 },
    ],
    drawCalls: 14,
    textureMemoryMb: 12,
    particlesLod0: 600,
    frameBudgetMs: 33.3,
  },
  // Fine ash drifting down through the halo light, and the low ground fog the
  // reference sits in. Deliberately not embers — nothing here burns.
  particles: ['ash-drift', 'ground-fog'],
  lights: [
    {
      node: 'halo_root',
      color: '#ffc53d',
      intensity: 2.4,
      distance: 3.2,
      // The halo is the read at every size — it earns its light even on LOD2.
      levels: [0, 1, 2],
    },
    {
      node: 'reliquary_casket',
      color: '#ffb020',
      intensity: 0.8,
      distance: 1.1,
      // A sternum-sized glow is invisible on a 120px avatar; not worth a
      // second light there.
      levels: [0, 1],
    },
  ],
  // Four chains down the cloak's torn tongues. The cowl is stiff and stays
  // static — it reads as heavy rolled cloth, and springing it made it read
  // as light instead.
  clothChains: ['cloak_chain_L', 'cloak_chain_ML', 'cloak_chain_MR', 'cloak_chain_R'],
  idleClip: 'idle',
  heightMeters: 2.4,
};

export const ROSTER: CrewCharacter[] = [VIGIL];

export function crewById(id: CrewId): CrewCharacter | undefined {
  return ROSTER.find((c) => c.id === id);
}

/**
 * Throwing rather than falling back to a default: a typo'd id should surface
 * in the workshop immediately, not render the wrong character quietly. The 2D
 * side falls back to 'standard' on purpose because a wardrobe must always
 * show something; a dev bench has the opposite obligation.
 */
export function requireCrew(id: CrewId): CrewCharacter {
  const found = crewById(id);
  if (!found) throw new Error(`[crew3d] no character with id "${id}" in the roster`);
  return found;
}

/** The level whose maxRenderPx the given on-screen size falls under. */
export function levelForSize(character: CrewCharacter, renderPx: number) {
  const ordered = [...character.budget.lods].sort((a, b) => a.maxRenderPx - b.maxRenderPx);
  return (ordered.find((l) => renderPx <= l.maxRenderPx) ?? ordered[ordered.length - 1]).level;
}

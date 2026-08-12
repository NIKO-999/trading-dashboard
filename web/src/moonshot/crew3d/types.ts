/* ============================================================
   Crew3D — shared contracts.

   Every other file in this module depends on this one and nothing here
   depends on them, so the pieces (loader, LOD, rig, particles, perf probe)
   can be built and tested independently against a fixed surface.

   The module is dev-only for now: nothing in the app imports it, so `three`
   and friends stay out of the production bundle the phone precaches. It is
   reached from the workshop entry (web/workshop.html) until the real assets
   exist and have been judged.

   One deliberate constraint runs through these types: a character is DATA,
   not code. Adding Ballast after Vigil should be a record in roster.ts plus
   three .glb files — never a new component, never a new branch. The 2D side
   of this app learned that lesson the expensive way (nine hand-authored
   figure components in components/outfitFigures/, each one a file), and this
   module starts on the other side of it.
   ============================================================ */

export type CrewId = 'vigil' | 'ballast' | 'tithe' | 'curfew';

/** 0 is the hero mesh, 2 is the phone-in-a-list mesh. */
export type LodLevel = 0 | 1 | 2;

/**
 * THE tier extension point.
 *
 * Rank/XP variants are a later pass and must not require a rebuild, so the
 * whole of "what changes between tiers" is squeezed through this one object.
 * A tier scales emissive and may retint the accent; it does not swap meshes,
 * materials or animations. If a future tier genuinely needs more than this,
 * that is a design conversation, not a quiet widening of the type.
 */
export type CrewTier = {
  /** multiplies every EmissiveLight's authored intensity. 1 = as authored. */
  emissiveIntensity: number;
  /** hex; undefined leaves each light on its own authored colour */
  accent?: string;
};

/** Tier 1 — what every character renders at until the rank pass lands. */
export const BASE_TIER: CrewTier = { emissiveIntensity: 1 };

/* ---------- budget ---------- */

export type LodBudget = {
  level: LodLevel;
  /** ceiling for this level, in triangles */
  triangles: number;
  /**
   * Rendered size in CSS pixels at or below which this level takes over.
   * Chosen by on-screen size rather than camera distance because these are
   * UI elements at a fixed camera — a 80px avatar in a list and a 400px hero
   * are the real cases, not a character walking away from you.
   */
  maxRenderPx: number;
};

export type CrewBudget = {
  lods: LodBudget[];
  /** whole character including its particle systems */
  drawCalls: number;
  /** GPU texture memory ceiling once transcoded, in MB */
  textureMemoryMb: number;
  particlesLod0: number;
  /** 16.7 = 60fps, 33.3 = 30fps. Mid-range phones are judged against 33.3. */
  frameBudgetMs: number;
};

/* ---------- assets ---------- */

export type ParticlePresetId =
  | 'ash-drift'
  | 'ground-fog'
  | 'ember-rise'
  | 'vapour-vent'
  | 'mote-glow';

/**
 * An emissive map alone only makes a surface look lit — it throws no light on
 * anything else. Every glowing element that should affect its surroundings
 * gets one of these, parented to a named node in the GLB so the light travels
 * with the bone it belongs to.
 */
export type EmissiveLight = {
  /** node name inside the GLB to parent to */
  node: string;
  color: string;
  /** authored intensity at tier 1 — CrewTier.emissiveIntensity scales it */
  intensity: number;
  /** falloff radius in world metres */
  distance: number;
  /** LOD levels at which this light is worth its cost */
  levels: LodLevel[];
};

export type CrewCharacter = {
  id: CrewId;
  name: string;
  /** the discipline this one embodies — the reason it exists */
  discipline: string;
  tagline: string;
  /** one .glb per level, resolved against the module asset root */
  models: Record<LodLevel, string>;
  budget: CrewBudget;
  particles: ParticlePresetId[];
  lights: EmissiveLight[];
  /**
   * Root bone of each secondary-motion chain. The rig solver walks each
   * chain to its tip, so only the root is named here.
   */
  clothChains: string[];
  /** name of the idle clip inside the GLB */
  idleClip: string;
  /**
   * Authored height in world metres. The runtime frames the camera from this
   * so a 2.4m Vigil and a 1.1m Tithe both fill the same `size` box correctly
   * without per-character camera tuning.
   */
  heightMeters: number;
};

/* ---------- runtime measurement ---------- */

/**
 * What perf/ actually measures. Kept separate from CrewBudget so a report is
 * never mistaken for a target — the doc quotes measurements, not hopes.
 */
export type BudgetReading = {
  characterId: CrewId;
  level: LodLevel;
  triangles: number;
  drawCalls: number;
  textureMemoryMb: number;
  /** rolling median over the sample window */
  frameMs: number;
  programs: number;
  sampledFrames: number;
};

export type BudgetVerdict = {
  reading: BudgetReading;
  budget: CrewBudget;
  /** one entry per breached ceiling; empty means the character is in budget */
  breaches: { metric: keyof BudgetReading; actual: number; ceiling: number }[];
  pass: boolean;
};

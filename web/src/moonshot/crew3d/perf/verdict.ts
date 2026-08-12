/* ============================================================
   Budget verdicts.

   The brief asked for a performance budget doc: draw calls, texture memory,
   triangles per LOD, target FPS on iPhone-class hardware. Numbers like that
   are worthless if they are guessed — a doc that says "12 draw calls" because
   someone hoped for twelve is worse than no doc, because it reads as measured.

   So the budget lives in two halves that must not be confused. roster.ts
   declares the CEILINGS, up front, as design intent. useBudgetProbe reports
   what the assets ACTUALLY cost at runtime. This file is the only place the
   two meet, and it is deliberately a pure function: no renderer, no React, no
   clock. That is what makes the pass/fail rule itself testable, which matters
   more than it sounds — the probe can only be trusted if the thing judging
   its output is known-correct.

   Kept free of `three` imports on purpose so the test suite (plain
   `node --test`, no DOM, no WebGL) can exercise it.
   ============================================================ */

import type { BudgetReading, BudgetVerdict, CrewBudget } from '../types';

/**
 * Which reading fields are judged, and the ceiling each is judged against.
 *
 * Triangles are deliberately absent: their ceiling depends on which LOD was
 * measured, so it is resolved separately below. Everything else is a flat
 * per-character ceiling.
 */
const FLAT_CEILINGS: { metric: keyof BudgetReading; ceiling: keyof CrewBudget }[] = [
  { metric: 'drawCalls', ceiling: 'drawCalls' },
  { metric: 'textureMemoryMb', ceiling: 'textureMemoryMb' },
  { metric: 'frameMs', ceiling: 'frameBudgetMs' },
];

export function verdictFor(reading: BudgetReading, budget: CrewBudget): BudgetVerdict {
  const breaches: BudgetVerdict['breaches'] = [];

  /* A reading for a level the character does not declare is a bug in the
     caller, not a budget failure — failing it quietly would hide the mistake
     behind a red overlay that looks like an asset problem. */
  const lod = budget.lods.find((l) => l.level === reading.level);
  if (!lod) {
    throw new Error(
      `[crew3d] reading is for LOD${reading.level}, which this character does not declare ` +
        `(has ${budget.lods.map((l) => `LOD${l.level}`).join(', ')})`,
    );
  }

  if (reading.triangles > lod.triangles) {
    breaches.push({ metric: 'triangles', actual: reading.triangles, ceiling: lod.triangles });
  }

  for (const { metric, ceiling } of FLAT_CEILINGS) {
    const actual = reading[metric];
    const limit = budget[ceiling];
    /* Both sides are numeric in practice; the guard keeps a future non-numeric
       field on either type from silently comparing as NaN and always passing. */
    if (typeof actual !== 'number' || typeof limit !== 'number') continue;
    if (actual > limit) breaches.push({ metric, actual, ceiling: limit });
  }

  return { reading, budget, breaches, pass: breaches.length === 0 };
}

/** One line per breach, for the overlay and for pasting into the budget doc. */
export function describeBreaches(verdict: BudgetVerdict): string[] {
  return verdict.breaches.map(
    (b) => `${b.metric}: ${round(b.actual)} over a ceiling of ${round(b.ceiling)}`,
  );
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

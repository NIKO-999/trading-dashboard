/* Budget verdicts — run with `npm test`. */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { BudgetReading, CrewBudget } from '../types.ts';
import { describeBreaches, verdictFor } from './verdict.ts';

/** Vigil's declared budget, mirrored from roster.ts. */
const BUDGET: CrewBudget = {
  lods: [
    { level: 0, triangles: 28_000, maxRenderPx: Infinity },
    { level: 1, triangles: 12_000, maxRenderPx: 260 },
    { level: 2, triangles: 4_000, maxRenderPx: 120 },
  ],
  drawCalls: 14,
  textureMemoryMb: 12,
  particlesLod0: 600,
  frameBudgetMs: 33.3,
};

/** A reading comfortably inside every ceiling, for tests to spoil one field of. */
function reading(over: Partial<BudgetReading> = {}): BudgetReading {
  return {
    characterId: 'vigil',
    level: 0,
    triangles: 26_000,
    drawCalls: 11,
    textureMemoryMb: 9.5,
    frameMs: 20,
    programs: 6,
    sampledFrames: 120,
    ...over,
  };
}

test('a reading inside every ceiling passes with no breaches', () => {
  const verdict = verdictFor(reading(), BUDGET);
  assert.equal(verdict.pass, true);
  assert.deepEqual(verdict.breaches, []);
});

test('each ceiling can breach on its own', () => {
  const cases: [Partial<BudgetReading>, string][] = [
    [{ triangles: 28_001 }, 'triangles'],
    [{ drawCalls: 15 }, 'drawCalls'],
    [{ textureMemoryMb: 12.1 }, 'textureMemoryMb'],
    [{ frameMs: 33.4 }, 'frameMs'],
  ];
  for (const [over, metric] of cases) {
    const verdict = verdictFor(reading(over), BUDGET);
    assert.equal(verdict.pass, false, `${metric} over budget still reported a pass`);
    assert.equal(verdict.breaches.length, 1);
    assert.equal(verdict.breaches[0].metric, metric);
  }
});

test('sitting exactly on a ceiling is within budget, not over it', () => {
  // A budget is a ceiling, not an exclusive bound — an asset that lands
  // precisely on 28,000 triangles has met the target, not missed it.
  const verdict = verdictFor(
    reading({ triangles: 28_000, drawCalls: 14, textureMemoryMb: 12, frameMs: 33.3 }),
    BUDGET,
  );
  assert.equal(verdict.pass, true);
});

test('every breach is reported, not just the first', () => {
  const verdict = verdictFor(
    reading({ triangles: 40_000, drawCalls: 30, textureMemoryMb: 20, frameMs: 60 }),
    BUDGET,
  );
  assert.equal(verdict.pass, false);
  assert.equal(verdict.breaches.length, 4);
  assert.deepEqual(
    verdict.breaches.map((b) => b.metric).sort(),
    ['drawCalls', 'frameMs', 'textureMemoryMb', 'triangles'],
  );
});

test('triangles are judged against the LOD that was actually measured', () => {
  // 13,000 triangles is fine for the hero mesh and far too many for LOD1 —
  // judging every reading against LOD0 would let the cheap meshes rot.
  const heavy = { triangles: 13_000 };
  assert.equal(verdictFor(reading({ ...heavy, level: 0 }), BUDGET).pass, true);

  const atLod1 = verdictFor(reading({ ...heavy, level: 1 }), BUDGET);
  assert.equal(atLod1.pass, false);
  assert.deepEqual(atLod1.breaches, [{ metric: 'triangles', actual: 13_000, ceiling: 12_000 }]);

  const atLod2 = verdictFor(reading({ ...heavy, level: 2 }), BUDGET);
  assert.equal(atLod2.breaches[0].ceiling, 4_000);
});

test('a reading for an undeclared LOD throws rather than quietly failing', () => {
  const sparse: CrewBudget = { ...BUDGET, lods: [BUDGET.lods[0]] };
  assert.throws(() => verdictFor(reading({ level: 2 }), sparse), /does not declare/);
});

test('breaches describe themselves in terms of actual against ceiling', () => {
  const verdict = verdictFor(reading({ drawCalls: 22 }), BUDGET);
  assert.deepEqual(describeBreaches(verdict), ['drawCalls: 22 over a ceiling of 14']);
});

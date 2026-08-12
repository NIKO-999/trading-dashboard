/* ============================================================
   The one place derived numbers are computed. Every page consumes
   this output rather than re-deriving R, outcome, or P/L itself.
   ============================================================ */

import type { Entry, GradedEntry, Outcome } from '../types';

/** Explicit outcome wins; otherwise infer from the dollar result. */
function deriveOutcome(entry: Entry): GradedEntry['grade'] {
  if (entry.outcome) return entry.outcome;
  if (typeof entry.result !== 'number' || Number.isNaN(entry.result)) return 'ungraded';
  if (entry.result > 0) return 'win';
  if (entry.result < 0) return 'loss';
  return 'be';
}

/** R-multiple: explicit override, else result / risk. */
function deriveR(entry: Entry): number {
  if (typeof entry.rMultiple === 'number' && !Number.isNaN(entry.rMultiple)) {
    return entry.rMultiple;
  }
  const { risk, result } = entry;
  if (typeof risk === 'number' && risk > 0 && typeof result === 'number') {
    return result / risk;
  }
  return 0;
}

/**
 * Resolve every entry's derived fields and sort newest first.
 * `includeUngraded` keeps trades with no result yet in the output.
 */
export function gradedEntries(entries: Entry[], includeUngraded = false): GradedEntry[] {
  return entries
    .map((entry): GradedEntry => {
      const grade = deriveOutcome(entry);
      return {
        ...entry,
        grade,
        r: deriveR(entry),
        pnl: typeof entry.result === 'number' ? entry.result : 0,
        // A missed setup had no position on it, so it cannot move P&L, win
        // rate or R. 'data' is the older name for the same exclusion.
        counts: grade !== 'ungraded' && grade !== 'data' && grade !== 'missed',
      };
    })
    .filter((e) => includeUngraded || e.grade !== 'ungraded')
    .sort((a, b) => (a.date === b.date ? (b.time || '').localeCompare(a.time || '') : b.date.localeCompare(a.date)));
}

export type Summary = {
  total: number;
  wins: number;
  losses: number;
  breakEven: number;
  dataTrades: number;
  winRate: number;
  netPnl: number;
  totalR: number;
  avgR: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  expectancy: number;
  bestStreak: number;
  worstStreak: number;
  currentStreak: number;
};

export function summarize(entries: GradedEntry[]): Summary {
  const counted = entries.filter((e) => e.counts);
  const wins = counted.filter((e) => e.grade === 'win');
  const losses = counted.filter((e) => e.grade === 'loss');
  const breakEven = counted.filter((e) => e.grade === 'be');

  const grossWin = wins.reduce((sum, e) => sum + e.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((sum, e) => sum + e.pnl, 0));
  const decided = wins.length + losses.length;
  const winRate = decided ? wins.length / decided : 0;

  const avgWin = wins.length ? grossWin / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;

  // Oldest → newest so streaks read in the direction they happened.
  const chrono = [...counted].reverse();
  let best = 0;
  let worst = 0;
  let run = 0;
  for (const e of chrono) {
    if (e.grade === 'win') run = run > 0 ? run + 1 : 1;
    else if (e.grade === 'loss') run = run < 0 ? run - 1 : -1;
    else run = 0;
    best = Math.max(best, run);
    worst = Math.min(worst, run);
  }

  return {
    total: counted.length,
    wins: wins.length,
    losses: losses.length,
    breakEven: breakEven.length,
    dataTrades: entries.filter((e) => e.grade === 'data').length,
    winRate,
    netPnl: counted.reduce((sum, e) => sum + e.pnl, 0),
    totalR: counted.reduce((sum, e) => sum + e.r, 0),
    avgR: counted.length ? counted.reduce((sum, e) => sum + e.r, 0) / counted.length : 0,
    avgWin,
    avgLoss,
    profitFactor: grossLoss ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0,
    expectancy: winRate * avgWin - (1 - winRate) * avgLoss,
    bestStreak: best,
    worstStreak: Math.abs(worst),
    currentStreak: run,
  };
}

export type CurvePoint = { date: string; pnl: number; r: number; trade: number };

/** Cumulative P/L and R, oldest first — what the equity chart plots. */
export function equityCurve(entries: GradedEntry[]): CurvePoint[] {
  const chrono = [...entries].filter((e) => e.counts).reverse();
  let pnl = 0;
  let r = 0;
  return chrono.map((e, i) => {
    pnl += e.pnl;
    r += e.r;
    return { date: e.date, pnl, r, trade: i + 1 };
  });
}

export type DayGroup = {
  date: string;
  entries: GradedEntry[];
  pnl: number;
  r: number;
  wins: number;
  losses: number;
};

/** Group by calendar day, newest day first. */
export function groupByDay(entries: GradedEntry[]): DayGroup[] {
  const map = new Map<string, GradedEntry[]>();
  for (const e of entries) {
    const list = map.get(e.date);
    if (list) list.push(e);
    else map.set(e.date, [e]);
  }
  return [...map.entries()]
    .map(([date, list]) => ({
      date,
      entries: list,
      pnl: list.reduce((sum, e) => sum + (e.counts ? e.pnl : 0), 0),
      r: list.reduce((sum, e) => sum + (e.counts ? e.r : 0), 0),
      wins: list.filter((e) => e.grade === 'win').length,
      losses: list.filter((e) => e.grade === 'loss').length,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/* ---------- formatting ---------- */

export function fmtMoney(n: number, showSign = true): string {
  const sign = n > 0 && showSign ? '+' : n < 0 ? '−' : '';
  const abs = Math.abs(n);
  const body = abs >= 1000 ? abs.toLocaleString('en-US', { maximumFractionDigits: 0 }) : abs.toFixed(abs % 1 === 0 ? 0 : 2);
  return `${sign}$${body}`;
}

export function fmtR(n: number): string {
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  return `${sign}${Math.abs(n).toFixed(2)}R`;
}

export function fmtPct(n: number): string {
  return `${(n * 100).toFixed(n >= 0.995 || n === 0 ? 0 : 1)}%`;
}

export const OUTCOME_LABEL: Record<Exclude<Outcome, null> | 'ungraded', string> = {
  win: 'WIN',
  loss: 'LOSS',
  be: 'BE',
  missed: 'MISSED',
  data: 'DATA',
  ungraded: 'OPEN',
};

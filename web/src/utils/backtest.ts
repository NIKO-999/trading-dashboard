/* ============================================================
   Back-testing — its own engine, deliberately isolated.

   This shares exactly one thing with the discipline module: the XP total. It
   does NOT feed clean days, the trajectory, the attendance / clean / calm /
   steady streaks, crew unlocks, or any trading statistic. Nothing here was
   risked, so nothing here is allowed to look like evidence that you held a
   rule with real money on it. Reps and discipline are different claims and
   the app must never let one stand in for the other.

   What it IS for: reps are the one thing that compounds without costing
   anything, and the reason they don't happen is that they pay nothing back
   on the day you do them. So this pays immediately, and pays more the longer
   the run goes — the streak is the whole mechanism.

   Pure functions only. No React, no I/O.
   ============================================================ */

import type { BacktestSession } from '../types';

/** What one day's reps are worth before any multiplier. */
export const BACKTEST_XP = {
  /** showing up and going through setups at all */
  session: 40,
  /** one of them written up properly — a chart and real reflection */
  journaled: 60,
} as const;

/**
 * The run multiplier. Steeper and earlier than the trading boost on purpose:
 * the trading one guards a rule that costs money to break, so it has to be
 * slow to earn. This one is trying to start a habit from zero, so it pays
 * back fast enough to be worth beginning.
 */
export const BACKTEST_BOOST = [
  { at: 7, multiplier: 2 },
  { at: 5, multiplier: 1.75 },
  { at: 3, multiplier: 1.5 },
  { at: 2, multiplier: 1.25 },
] as const;

/** The target: a full week of consecutive days. */
export const WEEK_TARGET = 7;

/** Rough floor for "wrote something real" — matches the trade journal's bar. */
const MIN_REFLECTION_LENGTH = 40;

export function backtestBoostFor(streak: number): number {
  return BACKTEST_BOOST.find((t) => streak >= t.at)?.multiplier ?? 1;
}

/** The next tier up, for showing what's within reach. */
export function nextBacktestBoost(streak: number): { at: number; multiplier: number } | null {
  const upcoming = [...BACKTEST_BOOST].reverse().find((t) => streak < t.at);
  return upcoming ? { at: upcoming.at, multiplier: upcoming.multiplier } : null;
}

/**
 * A session counts as journaled when it carries a chart AND real reflection —
 * the same bar a trade has to clear. A screenshot with no words is a file, not
 * a review.
 */
export function isJournaled(session: BacktestSession): boolean {
  return Boolean(session.image) && (session.notes ?? '').trim().length >= MIN_REFLECTION_LENGTH;
}

function shiftDay(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export type BacktestSummary = {
  /** distinct days with at least one session, ever */
  totalDays: number;
  /** sessions logged, ever — several on one day still only makes one day */
  totalSessions: number;
  /** consecutive days ending today or yesterday */
  streak: number;
  /** best run ever */
  longestStreak: number;
  /** multiplier the current run has earned */
  boost: number;
  /** XP from back-testing alone — added to the Mastery total, nothing else */
  xp: number;
  /** how many of the last 7 days (inclusive of today) have a session */
  daysThisWeek: number;
  /** at least one of this week's sessions is properly written up */
  journaledThisWeek: boolean;
  /** the week's goal is met: 7 days AND one real write-up */
  weekComplete: boolean;
};

/**
 * Everything the back-testing section shows, derived from the sessions alone.
 *
 * XP is walked oldest-first so the multiplier compounds in the order it was
 * actually earned — the same rule the trading boost uses: a run of two pays
 * the bonus on the third, so you have to hold it before it pays.
 */
export function summarizeBacktest(sessions: BacktestSession[], today: string): BacktestSummary {
  const byDate = new Map<string, BacktestSession[]>();
  for (const s of sessions) {
    const list = byDate.get(s.date) ?? [];
    list.push(s);
    byDate.set(s.date, list);
  }
  const dates = [...byDate.keys()].sort();

  let xp = 0;
  let run = 0;
  let longest = 0;
  let prev: string | null = null;

  for (const date of dates) {
    run = prev && shiftDay(prev, 1) === date ? run + 1 : 1;
    longest = Math.max(longest, run);

    // Paid on the run BEFORE this day, so the multiplier is what you had
    // already banked rather than one this day awards itself.
    const multiplier = backtestBoostFor(run - 1);
    const day = byDate.get(date)!;
    const base = BACKTEST_XP.session + (day.some(isJournaled) ? BACKTEST_XP.journaled : 0);
    xp += Math.round(base * multiplier);

    prev = date;
  }

  // Today not being logged yet is not a broken run — same grace the
  // attendance streak gives, for the same reason.
  const dateSet = new Set(dates);
  let cursor = dateSet.has(today) ? today : shiftDay(today, -1);
  let streak = 0;
  while (dateSet.has(cursor)) {
    streak++;
    cursor = shiftDay(cursor, -1);
  }

  // The rolling week is the last 7 days inclusive of today, not a calendar
  // week — a Sunday start would reset the goal mid-run for no reason.
  const weekStart = shiftDay(today, -(WEEK_TARGET - 1));
  const weekDates = dates.filter((d) => d >= weekStart && d <= today);
  const journaledThisWeek = weekDates.some((d) => byDate.get(d)!.some(isJournaled));

  return {
    totalDays: dates.length,
    totalSessions: sessions.length,
    streak,
    longestStreak: longest,
    boost: backtestBoostFor(streak),
    xp,
    daysThisWeek: weekDates.length,
    journaledThisWeek,
    weekComplete: weekDates.length >= WEEK_TARGET && journaledThisWeek,
  };
}

/**
 * What logging a session on `date` would pay right now — shown before you
 * commit, so the streak is visible as the reason rather than a surprise.
 */
export function xpPreview(
  sessions: BacktestSession[],
  date: string,
  journaled: boolean,
): { base: number; multiplier: number; total: number } {
  const dates = new Set(sessions.map((s) => s.date));
  // The run this day would land on top of.
  let run = 0;
  let cursor = shiftDay(date, -1);
  while (dates.has(cursor)) {
    run++;
    cursor = shiftDay(cursor, -1);
  }
  const multiplier = backtestBoostFor(run);
  const base = BACKTEST_XP.session + (journaled ? BACKTEST_XP.journaled : 0);
  return { base, multiplier, total: Math.round(base * multiplier) };
}

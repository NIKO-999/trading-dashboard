/* Back-testing engine tests — run with `npm test`. */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  BACKTEST_XP,
  WEEK_TARGET,
  backtestBoostFor,
  isJournaled,
  nextBacktestBoost,
  summarizeBacktest,
  xpPreview,
} from './backtest.ts';
import { judgeDayFromTrades, summarizeDiscipline } from './discipline.ts';
import type { Account, BacktestSession } from '../types.ts';

const REFLECTION = 'Swept the session low, two-stage SMT confirmed, gap retest held cleanly.';

function session(over: Partial<BacktestSession> = {}): BacktestSession {
  return {
    id: Math.random().toString(36).slice(2),
    date: '2026-03-02',
    setups: 3,
    createdAt: '2026-03-02T10:00:00Z',
    ...over,
  };
}

/** n consecutive days starting at 2026-03-01. */
function run(days: number, over: Partial<BacktestSession> = {}): BacktestSession[] {
  return Array.from({ length: days }, (_, i) =>
    session({ date: `2026-03-${String(i + 1).padStart(2, '0')}`, ...over }),
  );
}

/* ---------- journaled ---------- */

test('journaled needs a chart AND real reflection, not one or the other', () => {
  assert.equal(isJournaled(session({ image: '/media/x.png' })), false, 'a chart with no words is a file');
  assert.equal(isJournaled(session({ notes: REFLECTION })), false, 'words with no chart is not a review');
  assert.equal(isJournaled(session({ image: '/media/x.png', notes: REFLECTION })), true);
});

test('a stray word does not count as reflection', () => {
  assert.equal(isJournaled(session({ image: '/media/x.png', notes: 'good' })), false);
});

/* ---------- the boost ladder ---------- */

test('the boost ladder rises at 2, 3, 5 and 7 consecutive days', () => {
  assert.equal(backtestBoostFor(0), 1);
  assert.equal(backtestBoostFor(1), 1);
  assert.equal(backtestBoostFor(2), 1.25);
  assert.equal(backtestBoostFor(3), 1.5);
  assert.equal(backtestBoostFor(4), 1.5);
  assert.equal(backtestBoostFor(5), 1.75);
  assert.equal(backtestBoostFor(7), 2);
  assert.equal(backtestBoostFor(40), 2, 'it caps rather than running away');
});

test('nextBacktestBoost points at the tier being worked toward', () => {
  assert.deepEqual(nextBacktestBoost(0), { at: 2, multiplier: 1.25 });
  assert.deepEqual(nextBacktestBoost(4), { at: 5, multiplier: 1.75 });
  assert.equal(nextBacktestBoost(7), null, 'nothing left above the cap');
});

/* ---------- streaks ---------- */

test('consecutive days build the streak', () => {
  const s = summarizeBacktest(run(4), '2026-03-04');
  assert.equal(s.streak, 4);
  assert.equal(s.totalDays, 4);
});

test('a gap breaks the streak but never the best-ever run', () => {
  const sessions = [...run(3), session({ date: '2026-03-09' })];
  const s = summarizeBacktest(sessions, '2026-03-09');
  assert.equal(s.streak, 1, 'the gap reset the current run');
  assert.equal(s.longestStreak, 3, 'the best run is remembered');
});

test('today not being logged yet does not break the run', () => {
  // Same grace the attendance streak gives — the day is not over.
  const s = summarizeBacktest(run(3), '2026-03-04');
  assert.equal(s.streak, 3);
});

test('two days missed does break it', () => {
  const s = summarizeBacktest(run(3), '2026-03-05');
  assert.equal(s.streak, 0);
});

test('several sessions on one day is still one day of the habit', () => {
  const sessions = [session({ date: '2026-03-01' }), session({ date: '2026-03-01' })];
  const s = summarizeBacktest(sessions, '2026-03-01');
  assert.equal(s.totalSessions, 2);
  assert.equal(s.totalDays, 1, 'the streak counts days, not reps');
  assert.equal(s.streak, 1);
});

/* ---------- XP ---------- */

test('a single unjournaled day pays the flat session rate', () => {
  const s = summarizeBacktest([session({ date: '2026-03-01' })], '2026-03-01');
  assert.equal(s.xp, BACKTEST_XP.session);
});

test('journaling a day adds its bonus on top', () => {
  const s = summarizeBacktest(
    [session({ date: '2026-03-01', image: '/media/x.png', notes: REFLECTION })],
    '2026-03-01',
  );
  assert.equal(s.xp, BACKTEST_XP.session + BACKTEST_XP.journaled);
});

test('the multiplier is earned by the run already banked, not awarded by the day itself', () => {
  // Days 1 and 2 pay flat; day 3 lands on a run of 2, so it pays 1.25x.
  const s = summarizeBacktest(run(3), '2026-03-03');
  const flat = BACKTEST_XP.session;
  assert.equal(s.xp, flat + flat + Math.round(flat * 1.25));
});

test('a full week compounds all the way up the ladder', () => {
  const s = summarizeBacktest(run(7), '2026-03-07');
  const f = BACKTEST_XP.session;
  const expected =
    f + f + Math.round(f * 1.25) + Math.round(f * 1.5) + Math.round(f * 1.5) + Math.round(f * 1.75) + Math.round(f * 1.75);
  assert.equal(s.xp, expected);
  assert.ok(s.xp > f * 7, 'a held run is worth strictly more than the same days scattered');
});

test('xpPreview shows what today would pay, before committing to it', () => {
  const sessions = run(3); // Mar 1-3
  const preview = xpPreview(sessions, '2026-03-04', false);
  assert.equal(preview.multiplier, 1.5, 'landing on a run of 3');
  assert.equal(preview.total, Math.round(BACKTEST_XP.session * 1.5));
});

test('xpPreview includes the journaling bonus when it will be earned', () => {
  const withNote = xpPreview([], '2026-03-01', true);
  assert.equal(withNote.base, BACKTEST_XP.session + BACKTEST_XP.journaled);
  assert.equal(withNote.multiplier, 1, 'a first day has no run behind it');
});

/* ---------- the week goal ---------- */

test('the week needs seven days AND one real write-up', () => {
  const bare = summarizeBacktest(run(WEEK_TARGET), '2026-03-07');
  assert.equal(bare.daysThisWeek, 7);
  assert.equal(bare.journaledThisWeek, false);
  assert.equal(bare.weekComplete, false, 'seven days of clicking through is not the goal');

  const withWriteUp = summarizeBacktest(
    [...run(6), session({ date: '2026-03-07', image: '/media/x.png', notes: REFLECTION })],
    '2026-03-07',
  );
  assert.equal(withWriteUp.journaledThisWeek, true);
  assert.equal(withWriteUp.weekComplete, true);
});

test('the week is a rolling seven days, not a calendar week', () => {
  // Mar 5-11 is the window on Mar 11; Mar 1-4 are outside it.
  const sessions = run(11);
  const s = summarizeBacktest(sessions, '2026-03-11');
  assert.equal(s.daysThisWeek, 7, 'exactly the last seven days count');
  assert.equal(s.totalDays, 11, 'the lifetime total still sees all of them');
});

/* ---------- isolation: the whole point ---------- */

const ACCOUNT: Account = {
  id: 'a1',
  name: 'Live',
  type: 'live',
  startingBalance: 1000,
  riskPercent: 10,
  createdAt: '2026-01-01T00:00:00Z',
};

test('back-testing never produces a clean day, a streak, or any trading stat', () => {
  // A full journaled week of reps, and zero real trading activity.
  const week = run(7, { image: '/media/x.png', notes: REFLECTION });
  assert.ok(summarizeBacktest(week, '2026-03-07').xp > 0, 'the reps did pay XP');

  // The discipline engine takes trades and checks — backtests are not either,
  // so there is nothing to hand it. That is the isolation, structurally.
  const d = summarizeDiscipline(ACCOUNT, [], [], [], '2026-03-07');
  assert.equal(d.cleanDays, 0, 'reps are not clean days');
  assert.equal(d.cleanStreak, 0);
  assert.equal(d.attendanceStreak, 0);
  assert.equal(d.longestCalmStreak, 0);
  assert.equal(d.verdicts.length, 0, 'and they produce no day verdicts at all');
});

test('a back-tested day is not a logged trade — it cannot make a day judgeable', () => {
  const v = judgeDayFromTrades('2026-03-02', [], 100);
  assert.equal(v.checkedIn, false, 'no trade means no record, whatever was back-tested that day');
  assert.equal(v.clean, false);
});

test('backtest XP lifts the Mastery total and the rank, and nothing else', () => {
  const reps = summarizeBacktest(run(7, { image: '/media/x.png', notes: REFLECTION }), '2026-03-07');

  const without = summarizeDiscipline(ACCOUNT, [], [], [], '2026-03-07');
  const with_ = summarizeDiscipline(ACCOUNT, [], [], [], '2026-03-07', reps.xp);

  assert.equal(with_.xp, without.xp + reps.xp, 'the reps show up in the XP total');
  assert.ok(with_.level > without.level, 'and a big enough pile of them moves the rank');

  // Everything that is supposed to mean "real money, rule held" is untouched.
  assert.equal(with_.cleanDays, without.cleanDays);
  assert.equal(with_.cleanStreak, without.cleanStreak);
  assert.equal(with_.longestCleanStreak, without.longestCleanStreak);
  assert.equal(with_.attendanceStreak, without.attendanceStreak);
  assert.equal(with_.longestCalmStreak, without.longestCalmStreak);
  assert.equal(with_.longestSteadyStreak, without.longestSteadyStreak);
  assert.equal(with_.boost, without.boost);
  assert.deepEqual(with_.verdicts, without.verdicts);
});

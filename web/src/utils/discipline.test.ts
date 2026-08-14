/* Rule engine tests — run with `npm test`. */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  LEGS,
  XP,
  attendanceStreak,
  balanceOn,
  boostFor,
  comeback,
  detectLoops,
  hasLogContent,
  nextBoost,
  isDrifting,
  isFullyLogged,
  MISSED_XP_PER_DAY,
  isMissed,
  judgeDay,
  judgeDayAny,
  judgeDayFromTrades,
  longestAttendanceStreak,
  missingForLog,
  nextSequence,
  takenTrades,
  openingBalanceOn,
  plannedRisk,
  plannedRiskOn,
  riskBand,
  riskDrift,
  shiftDay,
  summarizeDiscipline,
  trajectory,
  voyagerMood,
  voyagerNote,
} from './discipline.ts';
import { isNonTradingDay } from './marketDays.ts';
import { SETUPS, findGate } from '../data/framework.ts';
import type { Account, BalanceAdjustment, DayCheck, Entry } from '../types.ts';

const ACCOUNT: Account = {
  id: 'a1',
  name: 'Live',
  type: 'live',
  startingBalance: 1000,
  riskPercent: 10,
  createdAt: '2026-01-01T00:00:00Z',
};

function entry(over: Partial<Entry> = {}): Entry {
  return {
    id: Math.random().toString(36).slice(2),
    date: '2026-03-02',
    outcome: null,
    tags: [],
    walkthrough: [],
    accountId: 'a1',
    ...over,
  };
}

function check(over: Partial<DayCheck> = {}): DayCheck {
  return {
    date: '2026-03-02',
    accountId: 'a1',
    tookTrade: true,
    setupValid: true,
    gatesPassed: [],
    emotions: [],
    note: '',
    createdAt: '2026-03-02T10:00:00Z',
    ...over,
  };
}

/* ---------- balance ---------- */

test('balance is starting + deposits + results', () => {
  const adj: BalanceAdjustment[] = [
    { id: 'd1', accountId: 'a1', date: '2026-03-01', amount: 500, kind: 'deposit' },
  ];
  const entries = [entry({ date: '2026-03-02', result: 200 })];
  assert.equal(balanceOn(ACCOUNT, adj, entries, '2026-03-02'), 1700);
});

test('balance on a past date ignores later deposits and later trades', () => {
  // The regression that would silently mis-flag every historical trade.
  const adj: BalanceAdjustment[] = [
    { id: 'd1', accountId: 'a1', date: '2026-03-10', amount: 5000, kind: 'deposit' },
  ];
  const entries = [
    entry({ date: '2026-03-02', result: 100 }),
    entry({ date: '2026-03-20', result: 900 }),
  ];
  assert.equal(balanceOn(ACCOUNT, adj, entries, '2026-03-02'), 1100);
  assert.equal(balanceOn(ACCOUNT, adj, entries, '2026-03-20'), 7000);
});

test('withdrawals reduce the balance', () => {
  const adj: BalanceAdjustment[] = [
    { id: 'w1', accountId: 'a1', date: '2026-03-01', amount: -300, kind: 'withdrawal' },
  ];
  assert.equal(balanceOn(ACCOUNT, adj, [], '2026-03-02'), 700);
});

test('another account never pools into this balance', () => {
  const adj: BalanceAdjustment[] = [
    { id: 'd1', accountId: 'other', date: '2026-03-01', amount: 9999, kind: 'deposit' },
  ];
  const entries = [entry({ accountId: 'other', date: '2026-03-01', result: 4444 })];
  assert.equal(balanceOn(ACCOUNT, adj, entries, '2026-03-02'), 1000);
});

/* ---------- risk ---------- */

test('planned risk is the configured percent of balance', () => {
  assert.equal(plannedRisk(1000, 10), 100);
  assert.equal(plannedRisk(2500, 10), 250);
});

test('planned risk rises after a deposit', () => {
  const adj: BalanceAdjustment[] = [
    { id: 'd1', accountId: 'a1', date: '2026-03-05', amount: 1000, kind: 'deposit' },
  ];
  const before = plannedRisk(balanceOn(ACCOUNT, adj, [], '2026-03-04'), 10);
  const after = plannedRisk(balanceOn(ACCOUNT, adj, [], '2026-03-06'), 10);
  assert.equal(before, 100);
  assert.equal(after, 200);
});

test('planned risk uses the balance BEFORE that day’s own result', () => {
  // The circularity bug: a winning trade inflates the balance its own risk is
  // judged against, so a perfectly on-plan trade reads as undersized.
  const entries = [entry({ date: '2026-03-02', risk: 100, result: 300 })];
  assert.equal(openingBalanceOn(ACCOUNT, [], entries, '2026-03-02'), 1000);
  assert.equal(balanceOn(ACCOUNT, [], entries, '2026-03-02'), 1300);

  const planned = plannedRiskOn(ACCOUNT, [], entries, '2026-03-02');
  assert.equal(planned, 100);
  assert.equal(isDrifting(entries[0], planned), false, 'an exactly-on-plan trade must never flag');
});

test('a deposit made the same day still counts toward that day’s planned risk', () => {
  const adj: BalanceAdjustment[] = [
    { id: 'd1', accountId: 'a1', date: '2026-03-02', amount: 1000, kind: 'deposit' },
  ];
  assert.equal(plannedRiskOn(ACCOUNT, adj, [], '2026-03-02'), 200);
});

test('yesterday’s results do count toward today’s planned risk', () => {
  const entries = [entry({ date: '2026-03-01', risk: 100, result: 1000 })];
  assert.equal(plannedRiskOn(ACCOUNT, [], entries, '2026-03-02'), 200);
});

test('risk drift is signed and tolerant within 20%', () => {
  assert.equal(riskDrift(entry({ risk: 150 }), 100), 0.5);
  assert.equal(riskDrift(entry({ risk: 50 }), 100), -0.5);
  assert.equal(riskDrift(entry({}), 100), null);
  assert.equal(isDrifting(entry({ risk: 115 }), 100), false);
  assert.equal(isDrifting(entry({ risk: 130 }), 100), true);
});

/* ---------- risk band — fixed percent-of-balance bands, not plan-relative ---------- */

test('green covers 8% to 12% of balance inclusive, on a 10% target', () => {
  assert.equal(riskBand(10, -0.20), 'green'); // 8%
  assert.equal(riskBand(10, 0), 'green'); // 10%
  assert.equal(riskBand(10, 0.20), 'green'); // 12%
});

test('yellow covers 5%–8% under and 12%–15% over', () => {
  assert.equal(riskBand(10, -0.50), 'yellow'); // 5%
  assert.equal(riskBand(10, -0.21), 'yellow'); // 7.9%
  assert.equal(riskBand(10, 0.21), 'yellow'); // 12.1%
  assert.equal(riskBand(10, 0.50), 'yellow'); // 15%
});

test('red is anything under 5% or over 15%, regardless of which side', () => {
  assert.equal(riskBand(10, -0.51), 'red'); // 4.9%
  assert.equal(riskBand(10, 0.51), 'red'); // 15.1%
  assert.equal(riskBand(10, -1), 'red'); // 0%
  assert.equal(riskBand(10, 5), 'red'); // 60%
});

test('the bands are absolute percent-of-balance, not relative to the target', () => {
  // 12% of a 10% target and 12% of a 5% target are the same real exposure —
  // both must land in the same band.
  assert.equal(riskBand(10, 0.20), 'green'); // 10% target, +20% drift = 12%
  assert.equal(riskBand(5, 1.4), 'green'); // 5% target, +140% drift = 12%
});

/* ---------- the clean day ---------- */

test('a single on-plan trade with no flags is clean', () => {
  const v = judgeDay('2026-03-02', check(), [entry({ risk: 100 })], 100);
  assert.equal(v.clean, true);
  assert.deepEqual(v.reasons, []);
});

test('two trades is not clean', () => {
  const v = judgeDay('2026-03-02', check(), [entry({ risk: 100 }), entry({ risk: 100 })], 100);
  assert.equal(v.clean, false);
  assert.match(v.reasons.join(' '), /the rule is one/);
});

test('moving a stop to break even is not clean', () => {
  const v = judgeDay('2026-03-02', check(), [entry({ risk: 100, movedToBE: true })], 100);
  assert.equal(v.clean, false);
  assert.match(v.reasons.join(' '), /break even/);
});

test('an emotional flag is not clean, but the day is still checked in', () => {
  const v = judgeDay('2026-03-02', check({ emotions: ['fomo'] }), [entry({ risk: 100 })], 100);
  assert.equal(v.clean, false);
  assert.equal(v.checkedIn, true);
});

test('a no-trade day with a check-in is clean', () => {
  const v = judgeDay('2026-03-02', check({ tookTrade: false, setupValid: null }), [], 100);
  assert.equal(v.clean, true);
});

test('no check-in is neither clean nor checked in', () => {
  const v = judgeDay('2026-03-02', undefined, [], 100);
  assert.equal(v.clean, false);
  assert.equal(v.checkedIn, false);
});

/* ---------- clean days derived from trades alone, no check-in needed ---------- */

test('a logged trade with no flags is clean without any check-in', () => {
  const v = judgeDayFromTrades('2026-03-02', [entry({ risk: 100 })], 100);
  assert.equal(v.checkedIn, true);
  assert.equal(v.clean, true);
  assert.deepEqual(v.reasons, []);
});

test('a trade-derived day with no trades at all is neither clean nor checked in', () => {
  const v = judgeDayFromTrades('2026-03-02', [], 100);
  assert.equal(v.checkedIn, false);
  assert.equal(v.clean, false);
});

test('moving a stop to break even fails a trade-derived day the same as a checked-in one', () => {
  const v = judgeDayFromTrades('2026-03-02', [entry({ risk: 100, movedToBE: true })], 100);
  assert.equal(v.clean, false);
  assert.match(v.reasons.join(' '), /break even/);
});

test('a trade taken despite the framework killing it is not clean', () => {
  // 'openDraw' is a real gate id, not a stand-in — killedBy only ever holds
  // ids that resolve through findGate() in real use, and the reason text now
  // IS that gate's own avoid sentence rather than a generic label.
  const v = judgeDayFromTrades('2026-03-02', [entry({ risk: 100, killedBy: ['openDraw'] })], 100);
  assert.equal(v.clean, false);
  assert.match(v.reasons.join(' '), /nothing left to aim at/);
});

test('a killedBy id that resolves to nothing adds no phantom reason', () => {
  // Defensive: an id that predates a framework rewrite, or a typo, must not
  // silently manufacture a reason out of nothing — and must not silently
  // clear the day either, since the id being unrecognised says nothing about
  // whether the setup was actually valid.
  const v = judgeDayFromTrades('2026-03-02', [entry({ risk: 100, killedBy: ['not-a-real-gate-id'] })], 100);
  assert.deepEqual(v.reasons, []);
});

/* ---------- the retroactive checklist — reviewed after the fact, same consequence as pre-flight ---------- */

const C2_REQUIRED = SETUPS.find((s) => s.id === 'C2')!.checks.filter((c) => !c.optional).map((c) => c.id);

test('a trade nobody has reviewed the checklist for is never treated as having failed it', () => {
  // gatesPassed is empty — unreviewed must read as neutral, not as missing.
  const v = judgeDayFromTrades('2026-03-02', [entry({ risk: 100, candleRole: 'C2' })], 100);
  assert.equal(v.clean, true);
});

test('leaving CONFIRMATION gates unticked is not a broken rule', () => {
  // The checklist is a reference, not an attendance sheet. With every
  // compulsory gate answered, leaving the confirmations blank means they were
  // never checked — not that they failed.
  const compulsory = SETUPS.find((s) => s.id === 'C2')!.checks.filter((c) => c.compulsory).map((c) => c.id);
  assert.ok(compulsory.length > 0, 'C2 must have compulsory gates for this test to mean anything');

  const v = judgeDayFromTrades(
    '2026-03-02',
    [entry({ risk: 100, candleRole: 'C2', gatesPassed: compulsory })],
    100,
  );
  assert.equal(v.clean, true, 'unticked confirmations must not dirty the day');
  assert.equal(v.reasons.length, 0);
  // signature and timeLeft are confirmations here — neither may be reported.
  for (const id of ['signature', 'timeLeft']) {
    assert.ok(!v.reasons.includes(findGate(id)!.avoid!), `${id} should not be reported`);
  }
});

test('leaving a COMPULSORY gate unticked IS a broken rule', () => {
  // Key level, open draw and SMT are the ones the trade cannot exist without.
  const v = judgeDayFromTrades(
    '2026-03-02',
    [entry({ risk: 100, candleRole: 'C2', gatesPassed: ['keyLevel'] })],
    100,
  );
  assert.equal(v.clean, false);
  for (const id of ['openDraw', 'smtStage1', 'smtStage2']) {
    assert.ok(v.reasons.includes(findGate(id)!.avoid!), `${id} should be reported`);
  }
  // keyLevel WAS ticked, so it must not appear.
  assert.ok(!v.reasons.includes(findGate('keyLevel')!.avoid!));
});

test('a trade nobody has reviewed yet reads as unreviewed, not failed', () => {
  // Nothing ticked at all — a trade logged before the checklist existed, or
  // one not yet gone over. It must not report every compulsory gate as missed.
  const v = judgeDayFromTrades('2026-03-02', [entry({ risk: 100, candleRole: 'C2' })], 100);
  assert.equal(v.clean, true);
  assert.equal(v.reasons.length, 0);
});

test('an explicitly killed gate still breaks the rule, even with everything else ticked', () => {
  // The other half of the same rule — this is the case that must keep working.
  const ticked = C2_REQUIRED.filter((id) => id !== 'signature');
  const v = judgeDayFromTrades(
    '2026-03-02',
    [entry({ risk: 100, candleRole: 'C2', gatesPassed: ticked, killedBy: ['signature'] })],
    100,
  );
  assert.equal(v.clean, false);
  assert.ok(v.reasons.includes(findGate('signature')!.avoid!));
  assert.ok(v.reasons.some((r) => r.includes('Take the continuation instead')));
});

test('ticking every required gate clears it', () => {
  const v = judgeDayFromTrades(
    '2026-03-02',
    [entry({ risk: 100, candleRole: 'C2', gatesPassed: C2_REQUIRED })],
    100,
  );
  assert.equal(v.clean, true);
});

test('the compulsory rule applies the same way on a checked-in day', () => {
  const compulsory = SETUPS.find((s) => s.id === 'C2')!.checks.filter((c) => c.compulsory).map((c) => c.id);
  const clean = judgeDay('2026-03-02', check(), [entry({ risk: 100, candleRole: 'C2', gatesPassed: compulsory })], 100);
  assert.equal(clean.clean, true, 'confirmations left blank stay clean');

  const dirty = judgeDay('2026-03-02', check(), [entry({ risk: 100, candleRole: 'C2', gatesPassed: ['keyLevel'] })], 100);
  assert.equal(dirty.clean, false, 'a missing compulsory gate still breaks it');
});

test('the checkpoint path reads killedBy off the trade too, not just the unused setupValid flag', () => {
  // Checkpoint.tsx never sets setupValid away from null — the trade's own
  // killedBy is the signal that actually exists, and judgeDay has to read it
  // the same way judgeDayFromTrades always has.
  const v = judgeDay('2026-03-02', check(), [entry({ risk: 100, killedBy: ['openDraw'] })], 100);
  assert.equal(v.clean, false);
  assert.match(v.reasons.join(' '), /nothing left to aim at/);
});

test('per-trade emotion flags fail a trade-derived day', () => {
  const v = judgeDayFromTrades('2026-03-02', [entry({ risk: 100, emotions: ['fomo'] })], 100);
  assert.equal(v.clean, false);
  assert.match(v.reasons.join(' '), /fomo/);
});

test('outcome tags explain a loss without ever touching the clean-day verdict', () => {
  const v = judgeDayFromTrades(
    '2026-03-02',
    [entry({ risk: 100, outcomeTags: ['consolidated instead of expanding', 'stopped before the move'] })],
    100,
  );
  assert.equal(v.clean, true);
  assert.deepEqual(v.reasons, []);
});

test('gave-back alone does not fail a trade-derived day — only moved-to-BE is the named rule', () => {
  const v = judgeDayFromTrades('2026-03-02', [entry({ risk: 100, gaveBack: true })], 100);
  assert.equal(v.clean, true);
});

test('two trades is not clean, derived from trades alone the same as checked-in', () => {
  const v = judgeDayFromTrades('2026-03-02', [entry({ risk: 100 }), entry({ risk: 100 })], 100);
  assert.equal(v.clean, false);
  assert.match(v.reasons.join(' '), /the rule is one/);
});

test('judgeDayAny prefers an explicit check-in over the trades when both exist', () => {
  // The check says an emotion was flagged even though the trade itself carries none —
  // the more deliberate record has to win, not silently be overridden by the trade.
  const v = judgeDayAny(
    '2026-03-02',
    check({ emotions: ['fomo'] }),
    [entry({ risk: 100 })],
    100,
  );
  assert.equal(v.clean, false);
});

test('judgeDayAny falls back to the trades when there is no check-in at all', () => {
  const v = judgeDayAny('2026-03-02', undefined, [entry({ risk: 100 })], 100);
  assert.equal(v.checkedIn, true);
  assert.equal(v.clean, true);
});

/* ---------- streaks and the ratchet ---------- */

test('clean days ratchet — a bad day does not remove one', () => {
  const entries = [entry({ date: '2026-03-02', risk: 100 }), entry({ date: '2026-03-03', risk: 100 })];
  const checks = [check({ date: '2026-03-02' }), check({ date: '2026-03-03', emotions: ['regret'] })];
  const s = summarizeDiscipline(ACCOUNT, [], entries, checks, '2026-03-03');
  assert.equal(s.cleanDays, 1);
});

test('a clean trade counts as a clean day with zero check-ins logged at all', () => {
  const entries = [entry({ date: '2026-03-02', risk: 100 })];
  const s = summarizeDiscipline(ACCOUNT, [], entries, [], '2026-03-02');
  assert.equal(s.cleanDays, 1);
  assert.equal(s.cleanStreak, 1);
  assert.equal(s.verdicts[0].checkedIn, true);
});

test('a rule broken on a trade with no check-in still fails the day and resets the streak', () => {
  const entries = [
    entry({ date: '2026-03-02', risk: 100 }),
    entry({ date: '2026-03-03', risk: 100, movedToBE: true }),
  ];
  const s = summarizeDiscipline(ACCOUNT, [], entries, [], '2026-03-03');
  assert.equal(s.cleanDays, 1);
  assert.equal(s.cleanStreak, 0);
});

test('a trade-derived clean day pays clean-day XP but not the check-in bonus', () => {
  const entries = [entry({ date: '2026-03-02', risk: 100 })];
  const s = summarizeDiscipline(ACCOUNT, [], entries, [], '2026-03-02');
  assert.equal(s.xp, XP.cleanDay);
});

test('an explicit check-in still wins over a trade that would otherwise judge differently', () => {
  // The trade alone is clean, but the check-in admits an emotion — the more
  // deliberate record has to be the one that counts.
  const entries = [entry({ date: '2026-03-02', risk: 100 })];
  const checks = [check({ date: '2026-03-02', emotions: ['fomo'] })];
  const s = summarizeDiscipline(ACCOUNT, [], entries, checks, '2026-03-02');
  assert.equal(s.cleanDays, 0);
});

test('attendance streak survives an admitted bad day', () => {
  const checks = [
    check({ date: '2026-03-02' }),
    check({ date: '2026-03-03', emotions: ['fomo', 'regret'] }),
    check({ date: '2026-03-04' }),
  ];
  assert.equal(attendanceStreak(checks, '2026-03-04'), 3);
});

test('attendance streak tolerates today not being logged yet', () => {
  const checks = [check({ date: '2026-03-02' }), check({ date: '2026-03-03' })];
  assert.equal(attendanceStreak(checks, '2026-03-04'), 2);
});

test('a missed day breaks the attendance streak', () => {
  // Mon 2 and Thu 5 March 2026 — Tue and Wed between them are trading days
  // that were genuinely skipped, so the run really is broken.
  const checks = [check({ date: '2026-03-02' }), check({ date: '2026-03-05' })];
  assert.equal(attendanceStreak(checks, '2026-03-05'), 1);
});

/* ---------- weekends and holidays are not graded ---------- */

test('a weekend does not break the attendance streak', () => {
  // Fri 6, Mon 9 March 2026 — nothing was missed in between, the market was
  // shut. Before trading days were used here, every Saturday reset the run
  // and the streak was unreachable by design.
  assert.equal(new Date(2026, 2, 6).getDay(), 5, 'fixture assumption: 6 Mar 2026 is a Friday');
  const checks = [check({ date: '2026-03-05' }), check({ date: '2026-03-06' }), check({ date: '2026-03-09' })];
  assert.equal(attendanceStreak(checks, '2026-03-09'), 3);
  assert.equal(longestAttendanceStreak(checks), 3);
});

test('checking in on a weekend neither adds to a streak nor bridges a real gap', () => {
  // Sat 7 March is checked in, but Fri 6 and Mon 9 are not. The weekend
  // check-in must not stitch those two together into a run.
  const checks = [check({ date: '2026-03-05' }), check({ date: '2026-03-07' })];
  assert.equal(attendanceStreak(checks, '2026-03-09'), 0, 'Friday was skipped, so the run is over');
  assert.equal(longestAttendanceStreak(checks), 1, 'only the Thursday counts');
});

test('a weekend check-in pays nothing and costs nothing', () => {
  // Sat 7 March 2026, checked in, no trade. Under the old model this was a
  // clean day worth XP; the market was shut, so there was nothing to hold.
  const weekend = check({ date: '2026-03-07', tookTrade: false, setupValid: null });
  const s = summarizeDiscipline(ACCOUNT, [], [], [weekend], '2026-03-09');
  assert.equal(s.cleanDays, 0, 'no clean day earned');
  assert.equal(s.xp, 0, 'no check-in XP either');
  assert.equal(s.verdicts.length, 0, 'the day never reaches the walk');
  assert.equal(s.cleanStreak, 0);
});

test('a weekend never marks a run dirty either', () => {
  // The flip side of the rule: a weekend check-in flagging an emotion cannot
  // reset a clean run that a Friday and a Monday built.
  const checks = [
    check({ date: '2026-03-06', tookTrade: false, setupValid: null }),
    check({ date: '2026-03-07', emotions: ['regret'] }),
    check({ date: '2026-03-09', tookTrade: false, setupValid: null }),
  ];
  const s = summarizeDiscipline(ACCOUNT, [], [], checks, '2026-03-09');
  assert.equal(s.cleanDays, 2, 'the Friday and the Monday');
  assert.equal(s.cleanStreak, 2, 'the weekend flag never touched the run');
});

test('a trade actually taken on a weekend is still judged', () => {
  // Futures reopen on Sunday evening. It is the EMPTY non-trading day that is
  // meaningless, not the date — a real trade on one is as real as any other.
  const trade = entry({ date: '2026-03-08', risk: 100, sessionProfile: '1800' });
  const s = summarizeDiscipline(ACCOUNT, [], [trade], [], '2026-03-09');
  assert.equal(s.verdicts.length, 1, 'the day is judged because it carries a trade');
  assert.equal(s.cleanDays, 1);
});

test('a market holiday is treated exactly like a weekend', () => {
  // Thanksgiving 2026 is Thursday 26 November — a weekday the market is shut.
  const holiday = check({ date: '2026-11-26', tookTrade: false, setupValid: null });
  const s = summarizeDiscipline(ACCOUNT, [], [], [holiday], '2026-11-27');
  assert.equal(s.cleanDays, 0);
  assert.equal(s.verdicts.length, 0);

  // ...and it does not break a run that spans it: Wed 25 and Fri 27.
  const around = [
    check({ date: '2026-11-25', tookTrade: false, setupValid: null }),
    check({ date: '2026-11-27', tookTrade: false, setupValid: null }),
  ];
  assert.equal(attendanceStreak(around, '2026-11-27'), 2, 'Thanksgiving is stepped over');
});

/* ---------- perfect boost ---------- */

test('boost tiers kick in at 2, 5 and 10 consecutive clean days', () => {
  assert.equal(boostFor(0), 1);
  assert.equal(boostFor(1), 1);
  assert.equal(boostFor(2), 1.25);
  assert.equal(boostFor(4), 1.25);
  assert.equal(boostFor(5), 1.5);
  assert.equal(boostFor(9), 1.5);
  assert.equal(boostFor(10), 2);
  assert.equal(boostFor(99), 2);
});

test('nextBoost points at the tier you are working toward', () => {
  assert.deepEqual(nextBoost(0), { at: 2, multiplier: 1.25 });
  assert.deepEqual(nextBoost(3), { at: 5, multiplier: 1.5 });
  assert.deepEqual(nextBoost(10), null);
});

/* Weekends and market holidays are no longer graded at all, so a fixture built
   from raw consecutive calendar dates silently loses every Saturday and Sunday
   in it — cleanRun(3) from Sunday 1 March 2026 only produced two graded days.
   These helpers walk TRADING days instead, which is what the runs below have
   always been trying to express. 2026-03-02 is a Monday. */

function nextTradingDay(date: string): string {
  let d = shiftDay(date, 1);
  while (isNonTradingDay(d)) d = shiftDay(d, 1);
  return d;
}

/** N consecutive trading days starting at (and including) `from`. */
function tradingDays(n: number, from = '2026-03-02'): string[] {
  const out: string[] = [];
  let cursor = isNonTradingDay(from) ? nextTradingDay(from) : from;
  for (let i = 0; i < n; i++) {
    out.push(cursor);
    cursor = nextTradingDay(cursor);
  }
  return out;
}

function cleanRun(days: number, from = '2026-03-02') {
  return tradingDays(days, from).map((date) => check({ date, tookTrade: false, setupValid: null }));
}

test('a clean run raises the multiplier and the XP it pays', () => {
  const run = tradingDays(3);
  const s = summarizeDiscipline(ACCOUNT, [], [], cleanRun(3), run[2]);
  assert.equal(s.cleanStreak, 3);
  assert.equal(s.boost, 1.25);
  // days 1 and 2 pay flat, day 3 pays boosted — you must hold it before it pays
  assert.equal(s.xp, 3 * XP.checkIn + XP.cleanDay * 2 + Math.round(XP.cleanDay * 1.25));
});

test('a dirty day resets the boost to 1x', () => {
  const [dirty] = tradingDays(1, nextTradingDay(tradingDays(4).at(-1)!));
  const checks = [...cleanRun(4), check({ date: dirty, emotions: ['fomo'] })];
  const s = summarizeDiscipline(ACCOUNT, [], [], checks, dirty);
  assert.equal(s.cleanStreak, 0);
  assert.equal(s.boost, 1);
  assert.equal(s.longestCleanStreak, 4, 'the best run is still remembered');
});

test('a missed check-in pauses the run rather than resetting it', () => {
  // The trading day straight after the run has no check — absence is not a
  // broken rule, so the day after that carries the run on.
  const gap = nextTradingDay(tradingDays(3).at(-1)!);
  const resume = nextTradingDay(gap);
  const checks = [...cleanRun(3), check({ date: resume, tookTrade: false, setupValid: null })];
  const s = summarizeDiscipline(ACCOUNT, [], [], checks, resume);
  assert.equal(s.cleanStreak, 4, 'the clean run carries across the gap');
  assert.equal(s.boost, 1.25);
});

test('the boost never applies to a dirty day', () => {
  const dirty = nextTradingDay(tradingDays(10).at(-1)!);
  const checks = [...cleanRun(10), check({ date: dirty, emotions: ['regret'] })];
  const s = summarizeDiscipline(ACCOUNT, [], [], checks, dirty);
  const cleanXp = s.verdicts.filter((v) => v.clean).length;
  assert.equal(cleanXp, 10);
  assert.equal(s.boost, 1, 'reset by the dirty day');
});

/* ---------- trajectory ---------- */

test('trajectory legs advance at 20 / 50 / 90 / 150', () => {
  assert.equal(trajectory(0).legName, 'Earth');
  assert.equal(trajectory(19).legName, 'Earth');
  assert.equal(trajectory(20).legName, 'Orbit');
  assert.equal(trajectory(50).legName, 'Deep Space');
  assert.equal(trajectory(90).legName, 'Lunar Descent');
  assert.equal(trajectory(150).legName, 'The Moon');
  assert.equal(trajectory(999).legName, 'The Moon');
});

test('every leg lands on a road stop', () => {
  // The road marks every 10 clean days; a leg between two marks never renders.
  for (const leg of LEGS) assert.equal(leg.at % 10, 0, `${leg.name} at ${leg.at}`);
});

test('trajectory reports what is left to the next leg', () => {
  assert.equal(trajectory(10).toNext, 10);
  assert.equal(trajectory(150).toNext, null);
});

/* ---------- sequence and full logging ---------- */

test('sequence counts only that day and that account', () => {
  const entries = [
    entry({ date: '2026-03-02' }),
    entry({ date: '2026-03-02' }),
    entry({ date: '2026-03-03' }),
    entry({ date: '2026-03-02', accountId: 'other' }),
  ];
  assert.equal(nextSequence(entries, '2026-03-02', 'a1'), 3);
  assert.equal(nextSequence(entries, '2026-03-04', 'a1'), 1);
});

const REFLECTION = 'Swept the session low, two-stage SMT confirmed, took the gap retest cleanly.';
/** A log the trader pressed "Complete log" on — the declaration isFullyLogged now requires. */
const DONE = '2026-03-02T12:00:00.000Z';

test('fully logged needs a profile tag, a screenshot, and real reflection', () => {
  assert.equal(isFullyLogged(entry({ sessionProfile: '0600' })), false);
  assert.equal(
    isFullyLogged(entry({ walkthrough: [{ id: 'w', note: '', image: '/media/x.png' }] })),
    false,
  );
  // Screenshot and profile, but nothing written — no longer enough on its own.
  assert.equal(
    isFullyLogged(
      entry({ sessionProfile: '0600', walkthrough: [{ id: 'w', note: '', image: '/media/x.png' }] }),
    ),
    false,
  );
  assert.equal(
    isFullyLogged(
      entry({
        sessionProfile: '0600',
        notes: REFLECTION,
        walkthrough: [{ id: 'w', note: '', image: '/media/x.png' }],
        completedAt: DONE,
      }),
    ),
    true,
  );
});

/* The write-up bonus is paid for a DECLARED-finished log, not for one that
   merely happens to contain the right things. Before this, the XP crept in the
   moment a screenshot and a long enough sentence coexisted, with no moment where
   it landed and no way to tell a finished write-up from an abandoned one. */

test('content alone is not a complete log — it has to be declared finished', () => {
  const content = {
    sessionProfile: '0600' as const,
    notes: REFLECTION,
    walkthrough: [{ id: 'w', note: '', image: '/media/x.png' }],
  };
  assert.equal(hasLogContent(entry(content)), true, 'everything needed is present');
  assert.equal(isFullyLogged(entry(content)), false, 'but it was never completed');
  assert.equal(isFullyLogged(entry({ ...content, completedAt: DONE })), true);
});

test('completing a log is what pays the write-up XP', () => {
  const content = {
    date: '2026-03-02',
    sessionProfile: '0600' as const,
    notes: REFLECTION,
    walkthrough: [{ id: 'w', note: '', image: '/media/x.png' }],
  };
  const open = summarizeDiscipline(ACCOUNT, [], [entry(content)], [], '2026-03-02');
  const done = summarizeDiscipline(ACCOUNT, [], [entry({ ...content, completedAt: DONE })], [], '2026-03-02');
  assert.equal(done.xp - open.xp, XP.fullyLogged, 'the button is worth exactly the write-up bonus');
});

test('an incomplete log still lists exactly what it is waiting on', () => {
  assert.deepEqual(missingForLog(entry({})), [
    'which candle it was',
    'a chart screenshot',
    'a sentence or two on what you saw',
  ]);
  assert.deepEqual(
    missingForLog(entry({ sessionProfile: '0600', notes: REFLECTION })),
    ['a chart screenshot'],
  );
  assert.deepEqual(
    missingForLog(
      entry({
        sessionProfile: '0600',
        notes: REFLECTION,
        walkthrough: [{ id: 'w', note: '', image: '/media/x.png' }],
      }),
    ),
    [],
    'nothing missing — it is only waiting on the button',
  );
});

test('reflection written on the walkthrough step itself counts the same as the top-level notes', () => {
  assert.equal(
    isFullyLogged(
      entry({
        sessionProfile: '0600',
        walkthrough: [{ id: 'w', note: REFLECTION, image: '/media/x.png' }],
        completedAt: DONE,
      }),
    ),
    true,
  );
});

test('a stray word is not reflection', () => {
  assert.equal(
    isFullyLogged(
      entry({ sessionProfile: '0600', notes: 'ok', walkthrough: [{ id: 'w', note: '', image: '/media/x.png' }] }),
    ),
    false,
  );
});

/* ---------- loop detection ---------- */

test('give-back tilt fires on a give-back followed by a same-day re-entry', () => {
  const entries = [
    entry({ date: '2026-03-02', sequence: 1, risk: 100, gaveBack: true }),
    entry({ date: '2026-03-02', sequence: 2, risk: 100 }),
  ];
  const flags = detectLoops(ACCOUNT, [], entries, [], '2026-03-02');
  const tilt = flags.find((f) => f.id === 'give-back-tilt');
  assert.ok(tilt, 'give-back tilt must fire — this is the chain the module exists for');
  assert.equal(tilt?.severity, 'high');
});

test('give-back alone, with no re-entry, does not fire tilt', () => {
  const entries = [entry({ date: '2026-03-02', sequence: 1, risk: 100, gaveBack: true })];
  const flags = detectLoops(ACCOUNT, [], entries, [], '2026-03-02');
  assert.equal(flags.find((f) => f.id === 'give-back-tilt'), undefined);
});

/* ---------- what the pattern cost ---------- */

test('tilt is priced by the re-entries only, not the trade that was given back', () => {
  const entries = [
    // The give-back itself came out flat — the damage is what followed it.
    entry({ date: '2026-03-02', sequence: 1, risk: 100, result: 0, gaveBack: true }),
    entry({ date: '2026-03-02', sequence: 2, risk: 100, result: -100 }),
    entry({ date: '2026-03-02', sequence: 3, risk: 100, result: -50 }),
  ];
  const tilt = detectLoops(ACCOUNT, [], entries, [], '2026-03-02').find((f) => f.id === 'give-back-tilt');
  assert.equal(tilt?.cost?.trades, 2, 'only the two re-entries are counted');
  assert.equal(tilt?.cost?.money, -150);
  assert.equal(tilt?.cost?.r, -1.5);
});

test('overtrading is priced by every trade past the first', () => {
  const entries = [
    entry({ date: '2026-03-02', sequence: 1, risk: 100, result: 200 }),
    entry({ date: '2026-03-02', sequence: 2, risk: 100, result: -100 }),
    entry({ date: '2026-03-03', sequence: 1, risk: 100, result: 50 }),
    entry({ date: '2026-03-03', sequence: 2, risk: 100, result: -200 }),
  ];
  const over = detectLoops(ACCOUNT, [], entries, [], '2026-03-03').find((f) => f.id === 'overtrading');
  assert.equal(over?.cost?.trades, 2, 'the allowed first trade of each day is excluded');
  assert.equal(over?.cost?.money, -300);
  assert.equal(over?.cost?.r, -3);
});

test('the break-even habit is never given a cost', () => {
  // What the trade would have paid had the stop stayed put is not recorded
  // anywhere, so there is no honest number here — and a made-up one is the
  // single thing this module must never show.
  const entries = [
    entry({ date: '2026-03-02', risk: 100, result: 0, movedToBE: true }),
    entry({ date: '2026-03-03', risk: 100, result: 0, movedToBE: true }),
  ];
  const be = detectLoops(ACCOUNT, [], entries, [], '2026-03-03').find((f) => f.id === 'break-even-habit');
  assert.ok(be, 'the flag itself still fires');
  assert.equal(be?.cost, undefined);
});

test('a pattern that happened to profit still reports its real, positive total', () => {
  // The engine reports what happened; the UI decides not to celebrate it.
  const entries = [
    entry({ date: '2026-03-02', sequence: 1, risk: 100, result: 0, gaveBack: true }),
    entry({ date: '2026-03-02', sequence: 2, risk: 100, result: 300 }),
  ];
  const tilt = detectLoops(ACCOUNT, [], entries, [], '2026-03-02').find((f) => f.id === 'give-back-tilt');
  assert.equal(tilt?.cost?.r, 3);
});

test('break-even habit fires on two or more days', () => {
  const entries = [
    entry({ date: '2026-03-02', risk: 100, movedToBE: true }),
    entry({ date: '2026-03-03', risk: 100, movedToBE: true }),
  ];
  const flags = detectLoops(ACCOUNT, [], entries, [], '2026-03-03');
  assert.ok(flags.find((f) => f.id === 'break-even-habit'));
});

test('repeated emotion fires at three in the window', () => {
  const checks = [
    check({ date: '2026-03-01', emotions: ['fomo'] }),
    check({ date: '2026-03-02', emotions: ['fomo'] }),
    check({ date: '2026-03-03', emotions: ['fomo'] }),
  ];
  const flags = detectLoops(ACCOUNT, [], [], checks, '2026-03-03');
  assert.ok(flags.find((f) => f.id === 'emotion-fomo'));
});

test('went dark fires after two missed days', () => {
  const checks = [check({ date: '2026-03-01' })];
  const flags = detectLoops(ACCOUNT, [], [], checks, '2026-03-05');
  assert.ok(flags.find((f) => f.id === 'went-dark'));
});

test('went dark never fires on your first day', () => {
  // No history behind today is not a gap — those days predate using this at all.
  const flags = detectLoops(ACCOUNT, [], [], [check({ date: '2026-03-02' })], '2026-03-02');
  assert.equal(flags.find((f) => f.id === 'went-dark'), undefined);
});

test('went dark still fires when the gap is longer than the window', () => {
  const checks = [check({ date: '2026-01-05' })];
  const flags = detectLoops(ACCOUNT, [], [], checks, '2026-03-05', 14);
  assert.ok(flags.find((f) => f.id === 'went-dark'), 'a 60-day silence must not fall out of the window');
});

test('a clean recent history produces no flags', () => {
  const entries = [entry({ date: '2026-03-02', sequence: 1, risk: 100 })];
  const checks = [check({ date: '2026-03-02' })];
  assert.deepEqual(detectLoops(ACCOUNT, [], entries, checks, '2026-03-02'), []);
});

/* ---------- voyagerNote ---------- */

test('no check-in gets named as a gap, not judged', () => {
  const v = judgeDay('2026-03-02', undefined, [], 100);
  const note = voyagerNote(undefined, [], v);
  assert.match(note, /No record for this day/);
});

test('a checked-in trade with nothing logged is called out as a mismatch', () => {
  // The rule engine cannot see this on its own — no entries means no dirty
  // reasons fire, so without this branch it would read as a clean day.
  const c = check({ tookTrade: true, setupValid: true });
  const v = judgeDay('2026-03-02', c, [], 100);
  assert.equal(v.clean, true, 'the engine itself sees nothing wrong');
  const note = voyagerNote(c, [], v);
  assert.match(note, /nothing is logged/);
});

test('a clean no-trade day is affirmed, not treated as a lesser clean day', () => {
  const c = check({ tookTrade: false, setupValid: null });
  const v = judgeDay('2026-03-02', c, [], 100);
  const note = voyagerNote(c, [], v);
  assert.match(note, /Sitting out clean counts the same/);
});

test('a clean single trade names the session it was taken on', () => {
  const c = check();
  const e = entry({ risk: 100, sessionProfile: '0600' });
  const v = judgeDay('2026-03-02', c, [e], 100);
  const note = voyagerNote(c, [e], v);
  assert.match(note, /One trade on 0600, sized on plan/);
});

test('a clean trade with no check-in is affirmed, not read as a gap', () => {
  const e = entry({ risk: 100, sessionProfile: '0600' });
  const v = judgeDayFromTrades('2026-03-02', [e], 100);
  const note = voyagerNote(undefined, [e], v);
  assert.match(note, /One trade on 0600, sized on plan/);
  assert.match(note, /no check-in needed/);
});

/* ---------- Voyager gives advice, the verdict states facts ----------

   Voyager used to print "What went wrong / What you could do / Rule broken".
   It now gives advice only. The split these tests defend: judgeDay and
   judgeDayFromTrades still say factually why a day was not clean (that drives
   the calendar label and tooltip and must stay blunt), while voyagerNote says
   what to do next time and never recites the failure back. */

test('a broken rule on a trade with no check-in still produces advice, not silence', () => {
  const e = entry({ risk: 100, movedToBE: true });
  const v = judgeDayFromTrades('2026-03-02', [e], 100);
  assert.match(v.reasons.join(' '), /moved a stop to break even/, "the engine's own reason is unaffected");
  const note = voyagerNote(undefined, [e], v);
  assert.match(note, /Leave the stop where you put it/);
  assert.doesNotMatch(note, /What went wrong|Rule broken/, 'the verdict framing is gone');
});

test('overtrading gets advice about stopping at one', () => {
  const c = check();
  const entries = [entry({ risk: 100 }), entry({ risk: 100 })];
  const v = judgeDay('2026-03-02', c, entries, 100);
  assert.match(v.reasons.join(' '), /2 trades — the rule is one/, "the engine's own reason is unaffected");
  const note = voyagerNote(c, entries, v);
  assert.match(note, /Stop at one/);
});

test('two behaviours in one day each get their own line of advice', () => {
  const c = check();
  const e = entry({ risk: 100, gaveBack: true, movedToBE: true });
  const v = judgeDay('2026-03-02', c, [e], 100);
  const note = voyagerNote(c, [e], v);
  assert.match(note, /Leave the stop where you put it/);
  assert.match(note, /starts handing it back/);
  assert.equal(note.split('\n').length, 2, 'one line each, not run together');
});

test('an emotion flag gets advice about catching it earlier', () => {
  const c = check({ emotions: ['fomo'] });
  const e = entry({ risk: 100 });
  const v = judgeDay('2026-03-02', c, [e], 100);
  const note = voyagerNote(c, [e], v);
  assert.match(note, /You flagged fomo\./);
  assert.match(note, /BEFORE the entry/);
});

test('a sat-out day with a flagged emotion is still read as not clean', () => {
  const c = check({ tookTrade: false, setupValid: null, emotions: ['boredom'] });
  const v = judgeDay('2026-03-02', c, [], 100);
  assert.equal(v.clean, false);
  const note = voyagerNote(c, [], v);
  assert.match(note, /You flagged boredom\./);
});

test('advice never runs past three lines', () => {
  // Everything wrong at once. Readable on a phone is the whole point of the
  // rewrite, so the cap is the behaviour, not an implementation detail.
  const c = check({ emotions: ['fomo', 'revenge'], setupValid: false });
  const entries = [
    entry({ risk: 400, gaveBack: true, movedToBE: true, candleRole: 'C2', killedBy: ['signature'] }),
    entry({ risk: 400 }),
  ];
  const v = judgeDay('2026-03-02', c, entries, 100);
  assert.equal(v.clean, false);
  const note = voyagerNote(c, entries, v);
  assert.ok(note.split('\n').length <= 3, `expected at most 3 lines, got: ${note}`);
});

/* ---------- calm streak ---------- */

test('longestCalmStreak counts check-ins with nothing flagged, independent of clean days', () => {
  // Day 2 is emotionally calm (no flags) even though the trade itself was
  // not clean — the two streaks measure different things and must not agree
  // by accident.
  const [d1, d2] = tradingDays(2);
  const checks = [
    check({ date: d1, emotions: [] }),
    check({ date: d2, emotions: [], tookTrade: true }),
  ];
  const entries = [entry({ date: d2, risk: 300 })]; // 30% drift, not clean
  const s = summarizeDiscipline(ACCOUNT, [], entries, checks, d2);
  assert.equal(s.cleanDays, 1, 'day 2 is not clean — risk drifted');
  assert.equal(s.longestCalmStreak, 2, 'but nothing was flagged on either day');
});

test('a flagged emotion breaks the calm streak even on an otherwise clean day', () => {
  const [d1, d2, d3] = tradingDays(3);
  const checks = [
    check({ date: d1, emotions: [] }),
    check({ date: d2, emotions: ['fomo'], tookTrade: false, setupValid: null }),
    check({ date: d3, emotions: [] }),
  ];
  const s = summarizeDiscipline(ACCOUNT, [], [], checks, d3);
  assert.equal(s.longestCalmStreak, 1, 'day 2 resets it, day 3 starts a new run of one');
});

test('longestCalmStreak remembers the best run, not just the current one', () => {
  const [d1, d2, d3, d4] = tradingDays(4);
  const checks = [
    check({ date: d1, emotions: [] }),
    check({ date: d2, emotions: [] }),
    check({ date: d3, emotions: [] }),
    check({ date: d4, emotions: ['regret'], tookTrade: false, setupValid: null }),
  ];
  const s = summarizeDiscipline(ACCOUNT, [], [], checks, d4);
  assert.equal(s.longestCalmStreak, 3, 'the best run survives the break that follows it');
});

test('a positive emotion never touches the clean day, the calm streak, or the loop detector', () => {
  const [d1, d2, d3] = tradingDays(3);
  const checks = [
    check({ date: d1, emotions: [], positiveEmotions: ['confident', 'in control'] }),
    check({ date: d2, emotions: [], positiveEmotions: ['calm'] }),
    check({ date: d3, emotions: [], positiveEmotions: ['calm'] }),
  ];
  const s = summarizeDiscipline(ACCOUNT, [], [], checks, d3);
  assert.equal(s.cleanDays, 3, 'ticking a positive state never breaks the clean-day verdict');
  assert.equal(s.longestCalmStreak, 3, 'a positive tag is not the same thing emotions being empty measures');
  const flags = detectLoops(ACCOUNT, [], [], checks, '2026-03-03');
  assert.ok(
    !flags.some((f) => f.id.startsWith('emotion-calm') || f.id.startsWith('emotion-confident')),
    'repeating a GOOD state 3 times must never read as a loop to watch for',
  );
});

/* ---------- steady streak (no give-back, no move-to-BE) ---------- */

test('longestSteadyStreak counts trades, not days, clean of the two named violations', () => {
  const entries = [
    entry({ date: '2026-03-01', sequence: 1 }),
    entry({ date: '2026-03-02', sequence: 1 }),
    entry({ date: '2026-03-02', sequence: 2, gaveBack: true }),
    entry({ date: '2026-03-03', sequence: 1 }),
  ];
  const checks = ['2026-03-01', '2026-03-02', '2026-03-03'].map((date) => check({ date }));
  const s = summarizeDiscipline(ACCOUNT, [], entries, checks, '2026-03-03');
  // Trade 3 (the give-back) breaks it; trade 4 starts a fresh run of one —
  // the best run stays at 2, from trades 1 and 2.
  assert.equal(s.longestSteadyStreak, 2);
});

test('a moved-to-BE trade breaks the steady streak exactly like a give-back does', () => {
  const entries = [
    entry({ date: '2026-03-01', sequence: 1 }),
    entry({ date: '2026-03-02', sequence: 1, movedToBE: true }),
    entry({ date: '2026-03-03', sequence: 1 }),
    entry({ date: '2026-03-04', sequence: 1 }),
  ];
  const checks = ['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04'].map((date) => check({ date }));
  const s = summarizeDiscipline(ACCOUNT, [], entries, checks, '2026-03-04');
  assert.equal(s.longestSteadyStreak, 2, 'trades 3 and 4, the run since the BE trade');
});

test('longestSteadyStreak is zero with no trades at all', () => {
  const s = summarizeDiscipline(ACCOUNT, [], [], [check({ tookTrade: false, setupValid: null })], '2026-03-02');
  assert.equal(s.longestSteadyStreak, 0);
});

/* ---------- voyager's mood ---------- */

test('a broken rule on the most recent recorded day dims him', () => {
  const checks = [...cleanRun(3), check({ date: '2026-03-04', emotions: ['fomo'] })];
  const s = summarizeDiscipline(ACCOUNT, [], [], checks, '2026-03-04');
  assert.equal(voyagerMood(s), 'dimmed');
});

test('he stays dim until an actual clean day replaces it, not just until tomorrow', () => {
  // The dirty day is the last thing recorded; days of silence since don't
  // undo it, because nothing has happened to undo it with.
  const checks = [...cleanRun(3), check({ date: '2026-03-04', emotions: ['fomo'] })];
  const s = summarizeDiscipline(ACCOUNT, [], [], checks, '2026-03-20');
  assert.equal(voyagerMood(s), 'dimmed');
});

test('a run of five clean days brightens him', () => {
  const s = summarizeDiscipline(ACCOUNT, [], [], cleanRun(5), '2026-03-05');
  assert.equal(s.cleanStreak, 5);
  assert.equal(voyagerMood(s), 'bright');
});

test('a short clean run is steady — bright has to be earned', () => {
  const s = summarizeDiscipline(ACCOUNT, [], [], cleanRun(4), '2026-03-04');
  assert.equal(voyagerMood(s), 'steady');
});

test('no history at all is steady, not dim', () => {
  const s = summarizeDiscipline(ACCOUNT, [], [], [], '2026-03-02');
  assert.equal(voyagerMood(s), 'steady');
});

/* ---------- missed setups: recorded, and completely inert ---------- */

const REFLECTION_M = 'Saw the whole thing set up but news was live so there was no margin to enter.';

test('a missed setup is not a trade you took', () => {
  assert.equal(isMissed(entry({ outcome: 'missed' })), true);
  assert.equal(isMissed(entry({ outcome: 'loss' })), false);
  assert.equal(isMissed(entry({})), false, 'no outcome yet is not missed');
  assert.deepEqual(
    takenTrades([entry({ outcome: 'missed' }), entry({ outcome: 'loss' })]).map((e) => e.outcome),
    ['loss'],
  );
});

test('a missed setup does not use up your one trade for the day', () => {
  // The whole point: log the setup, then still take a real trade later
  // without it reading as overtrading.
  const entries = [entry({ date: '2026-03-02', outcome: 'missed' })];
  assert.equal(nextSequence(entries, '2026-03-02', 'a1'), 1, 'the next real trade is still trade 1');

  const withReal = [...entries, entry({ date: '2026-03-02', risk: 100 })];
  const v = judgeDayFromTrades('2026-03-02', takenTrades(withReal), 100);
  assert.equal(v.clean, true, 'one taken trade plus a missed setup is still a clean day');
});

test('a day with nothing but missed setups produces no verdict at all', () => {
  const s = summarizeDiscipline(
    ACCOUNT,
    [],
    [entry({ date: '2026-03-02', outcome: 'missed' })],
    [],
    '2026-03-02',
  );
  assert.equal(s.verdicts.length, 0, 'a missed setup is not a day you traded');
  assert.equal(s.cleanDays, 0);
  assert.equal(s.xp, 0, 'and it pays nothing');
});

const RICH_MISS = {
  outcome: 'missed' as const,
  sessionProfile: '0600' as const,
  notes: REFLECTION_M,
  walkthrough: [{ id: 'w', note: '', image: '/media/x.png' }],
  completedAt: DONE,
};

test('a written-up miss clears the record bar, same as a taken trade', () => {
  // isFullyLogged is a bar on the RECORD, not on whether you executed.
  assert.equal(isFullyLogged(entry(RICH_MISS)), true);
  assert.equal(isFullyLogged(entry({ ...RICH_MISS, notes: 'nope' })), false, 'still needs real writing');
});

test('logging a miss properly pays XP — that is the whole reason to log it', () => {
  const s = summarizeDiscipline(ACCOUNT, [], [entry({ date: '2026-03-02', ...RICH_MISS })], [], '2026-03-02');
  assert.equal(s.xp, XP.missedLogged);
  assert.ok(XP.missedLogged < XP.fullyLogged, 'but less than actually taking the trade');
});

test('a miss with no write-up pays nothing — the XP is for the record, not the click', () => {
  const s = summarizeDiscipline(
    ACCOUNT,
    [],
    [entry({ date: '2026-03-02', outcome: 'missed' })],
    [],
    '2026-03-02',
  );
  assert.equal(s.xp, 0);
});

test('missed XP is capped per day so rank cannot be farmed off unrisked entries', () => {
  const many = Array.from({ length: 6 }, () => entry({ date: '2026-03-02', ...RICH_MISS }));
  const s = summarizeDiscipline(ACCOUNT, [], many, [], '2026-03-02');
  assert.equal(s.xp, XP.missedLogged * MISSED_XP_PER_DAY, 'six in a day still only pays for two');
});

test('the cap is per day, not overall — a miss on each of three days pays three times', () => {
  const spread = ['2026-03-02', '2026-03-03', '2026-03-04'].map((date) =>
    entry({ date, ...RICH_MISS }),
  );
  const s = summarizeDiscipline(ACCOUNT, [], spread, [], '2026-03-04');
  assert.equal(s.xp, XP.missedLogged * 3);
});

test('paying for a miss still creates no verdict, so it cannot become a clean day', () => {
  const s = summarizeDiscipline(ACCOUNT, [], [entry({ date: '2026-03-02', ...RICH_MISS })], [], '2026-03-02');
  assert.ok(s.xp > 0, 'it paid');
  assert.equal(s.verdicts.length, 0, 'but the day was never traded');
  assert.equal(s.cleanDays, 0);
  assert.equal(s.cleanStreak, 0);
});

test('a missed setup never becomes a broken rule, whatever is flagged on it', () => {
  // Flags on a setup you never entered describe the chart, not your conduct.
  const entries = [
    entry({ date: '2026-03-02', outcome: 'missed', movedToBE: true, killedBy: ['no-gap'], risk: 9999 }),
  ];
  const s = summarizeDiscipline(ACCOUNT, [], entries, [check({ date: '2026-03-02' })], '2026-03-02');
  assert.equal(s.verdicts[0].clean, true, 'the day is judged on the trades you took');
});

test('missed setups are invisible to the loop detectors', () => {
  // Three missed setups in a day is not overtrading — nothing was entered.
  const entries = [
    entry({ date: '2026-03-02', sequence: 1, outcome: 'missed', gaveBack: true }),
    entry({ date: '2026-03-02', sequence: 2, outcome: 'missed' }),
    entry({ date: '2026-03-02', sequence: 3, outcome: 'missed' }),
  ];
  const flags = detectLoops(ACCOUNT, [], entries, [], '2026-03-02');
  assert.deepEqual(flags.filter((f) => f.id === 'overtrading' || f.id === 'give-back-tilt'), []);
});

/* ---------- the comeback line ---------- */

test('one trade at the usual target clears a deficit several times over', () => {
  // The real shape of it: 2210 start, one -250 loss, so 1960 now and 196 at risk.
  const c = comeback(-250, 1960, 10);
  assert.equal(c.risk, 196);
  assert.equal(c.gain, 588);
  assert.equal(c.net, 338, 'a 3R win does not just recover, it puts you ahead');
  assert.equal(c.ahead, false);
});

test('risk is sized off the balance you have now, not the one you started with', () => {
  // Down 250 from 2210, so risk must be 10% of 1960 — quoting 221 would be a
  // stale figure that overstates what the next trade can actually earn back.
  const c = comeback(-250, 1960, 10);
  assert.equal(c.risk, 196);
  assert.notEqual(c.risk, 221);
});

test('it says how much is needed just to get back to flat', () => {
  const c = comeback(-250, 1960, 10);
  assert.ok(Math.abs(c.toFlat - 250 / 196) < 1e-9);
  assert.ok(c.toFlat > 1 && c.toFlat < 1.5, 'a shade over 1R here');
});

test('already ahead means nothing to claw back', () => {
  const c = comeback(400, 2610, 10);
  assert.equal(c.ahead, true);
  assert.equal(c.toFlat, 0, 'no deficit, so no R needed to erase one');
  assert.equal(c.net, 400 + 261 * 3, 'still prices what the next win adds');
});

test('a wiped-out balance is not encouraged with nonsense', () => {
  // Risk off zero is zero, so nothing can be earned back. Dividing by it would
  // report Infinity R to flat and render as encouragement.
  const c = comeback(-500, 0, 10);
  assert.equal(c.risk, 0);
  assert.equal(c.gain, 0);
  assert.equal(c.toFlat, 0);
  assert.equal(Number.isFinite(c.net), true);
});

test('a negative balance never produces negative risk', () => {
  const c = comeback(-500, -120, 10);
  assert.equal(c.risk, 0);
  assert.equal(c.gain, 0);
});

test('flat is treated as ahead — there is nothing to recover', () => {
  const c = comeback(0, 2000, 10);
  assert.equal(c.ahead, true);
  assert.equal(c.toFlat, 0);
});

test('the 9:30 marker is context only — it never touches the verdict or XP', () => {
  // Same shape as the outcomeTags purity test: ticking a note about the trade
  // must not silently become a rule the day is judged against.
  const clean = judgeDayFromTrades('2026-03-02', [entry({ risk: 100 })], 100);
  const marked = judgeDayFromTrades('2026-03-02', [entry({ risk: 100, nyOpenDriver: true })], 100);
  assert.equal(marked.clean, clean.clean);
  assert.deepEqual(marked.reasons, clean.reasons);

  const s1 = summarizeDiscipline(ACCOUNT, [], [entry({ date: '2026-03-02', risk: 100 })], [], '2026-03-02');
  const s2 = summarizeDiscipline(
    ACCOUNT,
    [],
    [entry({ date: '2026-03-02', risk: 100, nyOpenDriver: true })],
    [],
    '2026-03-02',
  );
  assert.equal(s2.xp, s1.xp);
});

/* ---------- the judge functions trust their caller to filter first ---------- */

test('judgeDay* does NOT filter missed trades itself — that is the caller\'s job', () => {
  // A real trap: DayLog.tsx once passed raw day entries (missed + taken)
  // straight into judgeDayAny, so a written-up miss plus one real trade read
  // as "2 trades — the rule is one" and a genuinely clean day showed as
  // BROKE A RULE. summarizeDiscipline gets this right because it filters
  // through takenTrades() before the day walk; judgeDay itself has no opinion
  // on `outcome` at all — it counts array length. This pins that contract down
  // so a future caller either filters first or fails a test finding out why.
  const real = entry({ risk: 100 });
  const missed = entry({ outcome: 'missed' });

  const correct = judgeDayFromTrades('2026-03-02', takenTrades([real, missed]), 100);
  assert.equal(correct.clean, true, 'one real trade, filtered first, reads as clean');

  const wrong = judgeDayFromTrades('2026-03-02', [real, missed], 100);
  assert.equal(wrong.clean, false, 'unfiltered, the missed entry pads the count to two');
  assert.ok(wrong.reasons[0].includes('2 trades'));
});

test('the exact shape of the real trade this was built for', () => {
  // The real Aug 7 case: a C2 on 1000, 'signature' explicitly killed, and one
  // more gate simply never answered either way (present in neither gatesPassed
  // nor killedBy). Mirrors what actually shipped this feature.
  //
  // wickSetsTarget is a 10:00 session add, so it is required here but never
  // in the ticked list — it stays unanswered. It must NOT be reported: an
  // unticked gate is silence, not a violation.
  const c2Required = SETUPS.find((s) => s.id === 'C2')!.checks.filter((c) => !c.optional).map((c) => c.id);
  const ticked = c2Required.filter((id) => id !== 'signature');
  const trade = entry({
    risk: 190,
    candleRole: 'C2',
    sessionProfile: '1000',
    killedBy: ['signature'],
    gatesPassed: ticked,
  });

  const v = judgeDayFromTrades('2026-08-07', [trade], 100);
  assert.equal(v.clean, false);
  // The killed gate's own line, automatically, no note required.
  assert.ok(v.reasons.includes(findGate('signature')!.avoid!));
  // The gate that was simply never answered stays out of it entirely.
  assert.ok(!v.reasons.includes(findGate('wickSetsTarget')!.avoid!));
  // The killed gate is reported exactly once, not repeated.
  assert.equal(v.reasons.filter((r) => r === findGate('signature')!.avoid!).length, 1);
  // And the "take the continuation instead" line, exactly once, not once per
  // failed gate.
  const ifItFailsHits = v.reasons.filter((r) => r.includes('Take the continuation instead'));
  assert.equal(ifItFailsHits.length, 1);

  // Voyager on this exact day: advice, and only advice. The framework's own
  // "take the continuation instead" line is the whole note here.
  //
  // Crucially it must NOT recite the gate's avoid-text. That is what made
  // this day read as nonsense once the reversal gate was reworded — the note
  // said "no gap turned up anywhere from the 1H down to the 5M" against a
  // trade whose own write-up describes finding and tapping a 15M gap. The
  // stored killedBy flag was judged under the old fixed-15M rule; the wording
  // recited over it was the new one. Advice does not have that failure mode,
  // because it never claims what happened.
  const note = voyagerNote(undefined, [trade], v);
  assert.match(note, /Take the continuation instead/);
  assert.doesNotMatch(note, /What went wrong|Rule broken|What you could do/);
  assert.doesNotMatch(note, /No gap turned up anywhere/, 'gate avoid-text must never be recited as advice');
  assert.ok(note.split('\n').length <= 3, `expected at most 3 lines, got: ${note}`);
});

test('advice is never double-punctuated', () => {
  const c2Required = SETUPS.find((s) => s.id === 'C2')!.checks.filter((c) => !c.optional).map((c) => c.id);
  const trade = entry({ risk: 100, candleRole: 'C2', killedBy: [c2Required[0]] });
  const v = judgeDayFromTrades('2026-03-02', [trade], 100);
  const note = voyagerNote(undefined, [trade], v);
  assert.ok(!note.includes('..'), `double period in: ${note}`);
});

test('no line of the note ever runs two sentences together', () => {
  // Fragments in this app (gate avoid-text, verdict reasons) carry no trailing
  // full stop of their own, so anything that joins them has to punctuate
  // first — a bare join produced run-ons like "...turning away sharply The
  // daily or the 1H...". Checked generically across a spread of dirty-day
  // shapes rather than one fixture, so it keeps catching this wherever the
  // joining happens to live.
  const c2Required = SETUPS.find((s) => s.id === 'C2')!.checks.filter((c) => !c.optional).map((c) => c.id);
  const ticked = c2Required.filter((id) => id !== 'signature');

  const cases: Array<[string, string]> = [
    ['killed gate on 1000', JSON.stringify({ candleRole: 'C2', sessionProfile: '1000', killedBy: ['signature'], gatesPassed: ticked })],
    ['first gate killed', JSON.stringify({ candleRole: 'C2', killedBy: [c2Required[0]] })],
    ['behaviour only', JSON.stringify({ gaveBack: true, movedToBE: true })],
  ];

  for (const [label, raw] of cases) {
    const trade = entry({ risk: 100, ...JSON.parse(raw) });
    const v = judgeDayFromTrades('2026-08-07', [trade], 100);
    const note = voyagerNote(undefined, [trade], v);
    for (const line of note.split('\n')) {
      assert.doesNotMatch(line, /[a-z] [A-Z]/, `unpunctuated join (${label}): ${line}`);
    }
  }
});

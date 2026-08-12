/* ============================================================
   The discipline rule engine.

   Pure functions only — no React, no fetch, no localStorage. These rules decide
   what your level means, so they have to be testable in isolation. Everything
   the UI shows about discipline is derived here and nowhere else.
   ============================================================ */

import { findGate, isComplete, outstanding, setupSpec } from '../data/framework.ts';
import { isNonTradingDay } from './marketDays.ts';
import type {
  Account,
  BalanceAdjustment,
  DayCheck,
  Entry,
} from '../types';

/** How far actual risk may sit from planned before it counts as drift. */
export const RISK_TOLERANCE = 0.2;

/**
 * Cumulative clean days required to reach each leg.
 *
 * All multiples of 10 so every leg lands exactly on a road stop — the route
 * puts a marker every 10 clean days, and a named leg falling between two of
 * them (as 15 and 45 used to) would simply never get drawn.
 */
export const LEGS = [
  { id: 'earth', name: 'Earth', at: 0 },
  { id: 'orbit', name: 'Orbit', at: 20 },
  { id: 'deep-space', name: 'Deep Space', at: 50 },
  { id: 'lunar-descent', name: 'Lunar Descent', at: 90 },
  { id: 'moon', name: 'The Moon', at: 150 },
] as const;

export const XP = {
  checkIn: 10,
  fullyLogged: 25,
  cleanDay: 100,
  /**
   * A missed setup, properly written up. Pays less than a trade you took —
   * the record is worth having, but it is a smaller thing than executing —
   * and it is the ONLY thing a missed setup ever affects.
   */
  missedLogged: 15,
} as const;

/**
 * How many written-up misses a day can pay for. Uncapped, this is the one XP
 * source with nothing at stake behind it, and process rank would stop meaning
 * anything. Two is well past a normal day's real misses.
 */
export const MISSED_XP_PER_DAY = 2;

/** XP per level — also what the Voyager card's progress bar is measured against. */
export const XP_PER_LEVEL = 500;

/**
 * Perfect boost — consecutive clean days multiply the XP a clean day pays.
 *
 * The point is that it grows: breaking a rule on day nine should cost visibly
 * more than breaking one on day two, so the friction arrives exactly when the
 * temptation does.
 */
export const BOOST_TIERS = [
  { at: 10, multiplier: 2 },
  { at: 5, multiplier: 1.5 },
  { at: 2, multiplier: 1.25 },
] as const;

/** Multiplier earned by a run of `streak` consecutive clean days. */
export function boostFor(streak: number): number {
  return BOOST_TIERS.find((t) => streak >= t.at)?.multiplier ?? 1;
}

/** The next tier up, for showing what's within reach. */
export function nextBoost(streak: number): { at: number; multiplier: number } | null {
  const upcoming = [...BOOST_TIERS].reverse().find((t) => streak < t.at);
  return upcoming ? { at: upcoming.at, multiplier: upcoming.multiplier } : null;
}

export const EMOTIONS = [
  'boredom',
  'fomo',
  'fear of ending red',
  'regret',
  'scarcity',
  'overconfidence',
  'proving myself',
  'loss of control',
] as const;

/**
 * The other half of "what was driving it" — tracked on DayCheck.positiveEmotions,
 * a field deliberately separate from `emotions`. `emotions` feeds judgeDay (a
 * flagged one makes the day not clean) and the calm streak (zero of them is
 * what "calm" means) — folding a good state in there would make ticking
 * "confident" read as a broken rule and break the calm streak on a day that
 * was, if anything, the opposite of dysregulated. These are recorded and
 * shown, never judged.
 */
export const POSITIVE_EMOTIONS = [
  'calm',
  'patient',
  'confident',
  'focused',
  'in control',
  'trusted the process',
] as const;

/**
 * Why a trade didn't play out despite a valid entry — outcome, not
 * rule-adherence. Never read by judgeDay / judgeDayFromTrades on purpose: a
 * trade can clear every real gate and still lose to plain variance, and that
 * is not the same thing as trading an invalidated setup. Ticking one of these
 * explains a loss without touching the clean-day verdict.
 */
export const OUTCOME_TAGS = [
  'consolidated instead of expanding',
  'swept back through entry',
  'stopped before the move',
  'wick already did the move',
  'news disrupted it',
  'ran out of session',
] as const;

/* ---------- trades ---------- */

export function entriesForAccount(entries: Entry[], accountId: string | null): Entry[] {
  if (!accountId) return entries;
  return entries.filter((e) => (e.accountId ?? accountId) === accountId);
}

/**
 * A setup you watched but never got into. Recorded for the read, but it never
 * had money on it — so it must stay out of everything that judges how you
 * traded: the one-trade-a-day rule, the sequence number that opens the hard
 * gate, clean days, every streak, XP, the loop detectors, and all P&L stats.
 *
 * The whole point is that logging a missed setup costs you nothing. The
 * moment it could cost you something you would stop logging them, and the
 * data would go with it.
 */
export function isMissed(entry: Entry): boolean {
  return entry.outcome === 'missed';
}

/** Entries you actually took — what every discipline rule is measured on. */
export function takenTrades(entries: Entry[]): Entry[] {
  return entries.filter((e) => !isMissed(e));
}

export function tradesOnDay(entries: Entry[], date: string, accountId: string | null): Entry[] {
  return takenTrades(entriesForAccount(entries, accountId).filter((e) => e.date === date));
}

/**
 * The sequence number a new trade on `date` would take. 1 is your allowed trade;
 * anything ≥2 has to pass the hard gate.
 */
export function nextSequence(entries: Entry[], date: string, accountId: string | null): number {
  return tradesOnDay(entries, date, accountId).length + 1;
}

/* ---------- balance ---------- */

/**
 * Balance as it stood at the end of `date`.
 *
 * Deposits are part of this: capital added weekly out of income moves the
 * balance and therefore moves planned risk. Trades are judged against the
 * balance on their own date, never against today's — otherwise every historical
 * trade would be re-scored every time money is added.
 */
export function balanceOn(
  account: Account,
  adjustments: BalanceAdjustment[],
  entries: Entry[],
  date: string,
): number {
  const deposits = adjustments
    .filter((a) => a.accountId === account.id && a.date <= date)
    .reduce((sum, a) => sum + a.amount, 0);

  const realised = entriesForAccount(entries, account.id)
    .filter((e) => e.date <= date && typeof e.result === 'number')
    .reduce((sum, e) => sum + (e.result as number), 0);

  return account.startingBalance + deposits + realised;
}

/**
 * Balance as it stood at the START of `date` — that day's own results excluded.
 *
 * This is the one to size against. Using the closing balance is circular: a
 * winning trade inflates the balance that its own risk is then judged against,
 * so a perfectly on-plan trade reads as undersized purely because it worked.
 * Deposits made on the day still count — money in the account is money you
 * could have sized from.
 */
export function openingBalanceOn(
  account: Account,
  adjustments: BalanceAdjustment[],
  entries: Entry[],
  date: string,
): number {
  const deposits = adjustments
    .filter((a) => a.accountId === account.id && a.date <= date)
    .reduce((sum, a) => sum + a.amount, 0);

  const realised = entriesForAccount(entries, account.id)
    .filter((e) => e.date < date && typeof e.result === 'number')
    .reduce((sum, e) => sum + (e.result as number), 0);

  return account.startingBalance + deposits + realised;
}

export function plannedRisk(balance: number, riskPercent: number): number {
  return (balance * riskPercent) / 100;
}

/** What you should have risked on `date`, given the balance you had going in. */
export function plannedRiskOn(
  account: Account,
  adjustments: BalanceAdjustment[],
  entries: Entry[],
  date: string,
): number {
  return plannedRisk(
    openingBalanceOn(account, adjustments, entries, date),
    account.riskPercent,
  );
}

/**
 * How far a trade's risk sat from plan, as a signed ratio.
 * 0 = on plan, +0.5 = 50% oversized, -0.5 = half size.
 * Returns null when there isn't enough information to judge.
 */
export function riskDrift(entry: Entry, planned: number): number | null {
  if (typeof entry.risk !== 'number' || planned <= 0) return null;
  return (entry.risk - planned) / planned;
}

export function isDrifting(entry: Entry, planned: number): boolean {
  const drift = riskDrift(entry, planned);
  return drift !== null && Math.abs(drift) > RISK_TOLERANCE;
}

/**
 * Where a trade's actual risk sits, as a percent of balance — fixed, absolute
 * bands, not a fraction of the plan. 12% on a 10% target and 12% on a 5%
 * target are both just "risked 12% of the account"; the number that can
 * actually hurt the balance is the real percentage, not how far it wandered
 * from whatever the plan happened to be that day.
 *
 * green  8%–12%
 * yellow 5%–8% or 12%–15%
 * red    under 5% or over 15%
 */
export type RiskBand = 'green' | 'yellow' | 'red';

export function riskBand(riskPercent: number, drift: number): RiskBand {
  const pct = riskPercent * (1 + drift);
  if (pct < 5 || pct > 15) return 'red';
  if (pct < 8 || pct > 12) return 'yellow';
  return 'green';
}

/* ---------- the clean day ---------- */

export type DayVerdict = {
  date: string;
  checkedIn: boolean;
  clean: boolean;
  /** why it wasn't clean — empty when it was, or when there's no check-in */
  reasons: string[];
};

/**
 * Names exactly what a day's own record already says went wrong — without
 * anyone having to sit down and write it out.
 *
 * Every gate in data/framework.ts already carries an `avoid` line: one plain
 * sentence describing its own failure case, sourced from the vault, not
 * invented per trade. This turns a trade's `killedBy` and unticked required
 * gates into that same sentence automatically, plus — when the failed setup
 * is a whole role (C2/C3/C4) — the one line the framework itself gives for
 * what to do instead (`ifItFails`), so a failed reversal always says "take
 * the continuation instead" without anyone having typed it.
 *
 * This is the deterministic half of what a written note can do. It cannot
 * read what you actually entered off and compare it to a DIFFERENT setup's
 * checklist the way a note you write by hand can — that took recognising
 * "3M CISD after a 15M gap tap" as the C3 entry sequence, which is reading
 * comprehension, not a lookup. Nothing here invents that; it only ever
 * repeats sentences the framework mapping already carries.
 */
/** One broken rule, named plainly: which rule, and what actually happened. */
export type BrokenRule = { rule: string; wrong: string };

function gateExplanations(dayEntries: Entry[]): BrokenRule[] {
  const seen = new Set<string>();
  const out: BrokenRule[] = [];
  const add = (rule: string | undefined, wrong: string | undefined) => {
    if (wrong && !seen.has(wrong)) {
      seen.add(wrong);
      out.push({ rule: rule ?? 'Framework checklist', wrong });
    }
  };

  for (const e of dayEntries) {
    for (const id of e.killedBy ?? []) {
      const g = findGate(id);
      if (g) add(g.label, g.avoid);
    }

    // Gated on "has ticked anything at all" on purpose — an entry logged
    // before this checklist existed, or one nobody has reviewed yet, must
    // read as unreviewed, not failed.
    if (e.candleRole && e.gatesPassed && e.gatesPassed.length > 0) {
      for (const g of outstanding(e.candleRole, e.gatesPassed, e.sessionProfile)) add(g.label, g.avoid);
    }
  }

  return out;
}

/**
 * The "where it could have been valid instead" line — the framework's own
 * `ifItFails` text for whichever setup actually failed today. Kept separate
 * from gateExplanations() because it isn't a {rule, wrong} pair: it's forward
 * guidance, not a rule that was broken, and mixing the two shapes would make
 * neither one honest. One line is enough — a trade with three missing gates
 * still only had one setup, and repeating the same advice three times would
 * not add anything to it.
 */
function betterAdvice(dayEntries: Entry[]): string | undefined {
  for (const e of dayEntries) {
    if (!e.candleRole) continue;
    const failed =
      (e.killedBy?.length ?? 0) > 0 ||
      (e.gatesPassed && e.gatesPassed.length > 0 && !isComplete(e.candleRole, e.gatesPassed, e.sessionProfile));
    if (!failed) continue;
    const line = setupSpec(e.candleRole)?.ifItFails;
    if (line) return line;
  }
  return undefined;
}

/**
 * A day is clean when you checked in, held to one trade, stayed on plan, and
 * flagged nothing emotional. Missing the check-in is never "clean" — but it also
 * never subtracts from anything, see cleanDayCount.
 */
export function judgeDay(
  date: string,
  check: DayCheck | undefined,
  dayEntries: Entry[],
  planned: number,
): DayVerdict {
  if (!check) return { date, checkedIn: false, clean: false, reasons: [] };

  const reasons: string[] = [];

  if (dayEntries.length > 1) reasons.push(`${dayEntries.length} trades — the rule is one`);
  if (check.emotions.length) reasons.push(`flagged: ${check.emotions.join(', ')}`);
  if (dayEntries.some((e) => e.movedToBE)) reasons.push('moved a stop to break even');
  // `check.setupValid` has no UI that ever sets it away from null — the real
  // signal already lives on the trade itself (killedBy, and whichever
  // required gates are still outstanding), the same place judgeDayFromTrades
  // reads it from. Named specifically rather than as one flat "took an
  // invalidated setup" or "missing a required gate" line — see
  // gateExplanations for why these sentences are never invented here.
  if (check.tookTrade && check.setupValid === false) reasons.push('took an invalidated setup');
  reasons.push(...gateExplanations(dayEntries).map((r) => r.wrong));
  const better = betterAdvice(dayEntries);
  if (better) reasons.push(better);
  if (dayEntries.some((e) => isDrifting(e, planned))) reasons.push('risk off plan');

  return { date, checkedIn: true, clean: reasons.length === 0, reasons };
}

/**
 * The same judgement, sourced from the trades themselves rather than a
 * separate check-in — for a day nothing was submitted through the checkpoint
 * for, but that has a real logged trade on it.
 *
 * A trade already carries everything the checkpoint would have asked: the
 * pre-flight gate list a trade is logged through records `gatesPassed` and
 * `killedBy` (did it clear the framework or get taken despite failing it),
 * and `movedToBE` / `emotions` are ticked on the trade itself. Requiring the
 * separate check-in ritual just to count a day that's already fully logged
 * would be asking the same question twice.
 */
export function judgeDayFromTrades(date: string, dayEntries: Entry[], planned: number): DayVerdict {
  if (dayEntries.length === 0) return { date, checkedIn: false, clean: false, reasons: [] };

  const reasons: string[] = [];
  const emotions = [...new Set(dayEntries.flatMap((e) => e.emotions ?? []))];

  if (dayEntries.length > 1) reasons.push(`${dayEntries.length} trades — the rule is one`);
  if (emotions.length) reasons.push(`flagged: ${emotions.join(', ')}`);
  if (dayEntries.some((e) => e.movedToBE)) reasons.push('moved a stop to break even');
  reasons.push(...gateExplanations(dayEntries).map((r) => r.wrong));
  const better = betterAdvice(dayEntries);
  if (better) reasons.push(better);
  if (dayEntries.some((e) => isDrifting(e, planned))) reasons.push('risk off plan');

  return { date, checkedIn: true, clean: reasons.length === 0, reasons };
}

/**
 * The one place that decides which of the two judges above applies. An
 * explicit check-in always wins when both exist — it's the more deliberate
 * record — and trades alone are enough when there's no check-in at all.
 */
export function judgeDayAny(
  date: string,
  check: DayCheck | undefined,
  dayEntries: Entry[],
  planned: number,
): DayVerdict {
  return check ? judgeDay(date, check, dayEntries, planned) : judgeDayFromTrades(date, dayEntries, planned);
}

/**
 * Voyager's read on a single day, built only from what that day's own record
 * says — the check, the verdict already computed for it, and the trades that
 * belong to it. Nothing here is generated from outside the app's own data.
 *
 * On a day that came out clean this affirms what held. On a day that did not,
 * it gives advice for next time and nothing else — see adviceFor() below for
 * why naming the failure is deliberately left to the verdict instead.
 */
export function voyagerNote(
  check: DayCheck | undefined,
  dayEntries: Entry[],
  verdict: DayVerdict,
): string {
  // No check-in AND nothing logged — genuinely nothing to read.
  if (!check && dayEntries.length === 0) {
    return 'No record for this day. If something happened, it went in without you catching it here — that gap is exactly what logging a trade or checking in exists to close.';
  }

  // A mismatch the rule engine itself can't see: "I traded" ticked with
  // nothing actually logged. Left alone this reads as a clean day, which
  // would be the wrong thing to tell you about it.
  if (check?.tookTrade && dayEntries.length === 0) {
    return 'Checked in as traded, but nothing is logged for this day. An unlogged trade is invisible to every number on this page, including the clean-day count — worth going back and logging it.';
  }

  if (verdict.clean) {
    if (check && !check.tookTrade) {
      return 'A no-trade day, held on its own terms. Sitting out clean counts the same as a clean trade — the rule was never about forcing size, only about never exceeding it.';
    }
    const one = dayEntries[0];
    const where = one?.sessionProfile ? ` on ${one.sessionProfile}` : '';
    // No check exists, but the trade itself carries the same signal a
    // check-in would have — the pre-flight gate it was logged through.
    const source = check ? '' : ' — no check-in needed, the trade log already says so';
    return `One trade${where}, sized on plan${source}. This is what the rule is supposed to produce, day after day — nothing more dramatic than holding it.`;
  }

  // Not clean — but Voyager's job here is advice, not a verdict.
  //
  // This used to print three labelled lines: "What went wrong", "What you
  // could do", "Rule broken". Two problems with that. It read as an
  // accusation rather than help, and because "What went wrong" recites a
  // gate's `avoid` text against a stored killedBy flag, a gate that was
  // later reworded would describe a failure that never happened — which is
  // exactly what it did after the reversal gate was rewritten.
  //
  // So the verdict and the coaching are now separate jobs. judgeDay /
  // judgeDayFromTrades still record factually WHY a day was not clean —
  // that drives the calendar's "Broke a rule" label and its tooltip, and it
  // should stay blunt. Voyager reads the same facts and says what to do
  // about them next time. Nothing here re-states the failure.
  const tips = adviceFor(check, dayEntries, verdict);
  if (tips.length) return tips.join('\n');
  // Fallback for a day the engine called dirty but that matched no advice
  // rule. Reasons are fragments without their own full stop, so punctuate
  // before joining — a bare join produced run-ons like "...sharply The daily".
  return verdict.reasons.map((r) => (/[.!?]$/.test(r) ? r : `${r}.`)).join(' ');
}

/**
 * Forward-looking advice for a day that did not come out clean.
 *
 * Two sources, and no third. The framework's own `ifItFails` line for
 * whichever setup failed — already written as "do this instead", already
 * sourced from the vault — plus one fixed line per behavioural rule the app
 * itself defines (one trade a day, never move to break even, and so on).
 * Those behavioural lines are the app's own rules restated as advice; nothing
 * here invents a trading rule, and no gate text is recited back.
 *
 * Capped at three. The whole point of this rewrite is that it stays short
 * enough to actually read on a phone.
 */
function adviceFor(check: DayCheck | undefined, dayEntries: Entry[], verdict: DayVerdict): string[] {
  const tips: string[] = [];

  // The trade itself first — what the framework says to do when this setup
  // is not there. Falls back to naming the step to get right, using gate
  // LABELS (what the step is) rather than avoid-text (what went wrong).
  const better = betterAdvice(dayEntries);
  if (better) {
    tips.push(better);
  } else {
    const steps = [...new Set(gateExplanations(dayEntries).map((g) => g.rule))];
    if (steps.length) tips.push(`The step to get right next time: ${steps.join(', ')}.`);
  }

  if (dayEntries.some((e) => e.movedToBE)) {
    tips.push(
      'Leave the stop where you put it. Moving it to break even turns a winner into a scratch while a loss still costs full price.',
    );
  }
  if (dayEntries.some((e) => e.gaveBack)) {
    tips.push('When a trade is well in profit and starts handing it back, that is the moment to take it — not after the round trip.');
  }
  if (dayEntries.length > 1) {
    tips.push('Stop at one. The second trade of a day is rarely the setup — it is usually the first one still talking.');
  }
  if (verdict.reasons.includes('risk off plan')) {
    tips.push('Size back to plan. Risk drifting up quietly is how a normal loss turns into one that needs winning back.');
  }
  const emotions = check?.emotions ?? [...new Set(dayEntries.flatMap((e) => e.emotions ?? []))];
  if (emotions.length) {
    tips.push(`You flagged ${emotions.join(', ')}. Worth catching what that felt like BEFORE the entry — that is where it is still cheap to act on.`);
  }
  if (check?.tookTrade && check.setupValid === false) {
    tips.push('This one was marked invalid at the time. Passing on those is the cheapest trade available.');
  }

  return tips.slice(0, 3);
}

export type DisciplineSummary = {
  cleanDays: number;
  attendanceStreak: number;
  longestAttendanceStreak: number;
  /** consecutive clean days right now — what drives the boost */
  cleanStreak: number;
  longestCleanStreak: number;
  /** longest run of check-ins with zero emotion flags — staying level-headed */
  longestCalmStreak: number;
  /** longest run of trades with no give-back and no move-to-break-even */
  longestSteadyStreak: number;
  /** the multiplier currently in force */
  boost: number;
  xp: number;
  level: number;
  verdicts: DayVerdict[];
};

/**
 * Clean days ratchet — they only ever increase. A bad day doesn't remove
 * progress, it just doesn't add any. The attendance streak is the number that
 * resets, and it survives any admission: honesty must never cost you it.
 */
export function summarizeDiscipline(
  account: Account,
  adjustments: BalanceAdjustment[],
  entries: Entry[],
  checks: DayCheck[],
  today: string,
  /**
   * XP earned outside this engine — currently back-testing reps, see
   * utils/backtest.ts. Passed as a plain number on purpose: it lifts the
   * Mastery total and the rank derived from it, and touches nothing else.
   * Clean days, every streak and the trajectory stay purely about trades.
   */
  bonusXp = 0,
): DisciplineSummary {
  const ofMine = entriesForAccount(entries, account.id);
  // Missed setups are dropped before the day walk, so nothing in there —
  // verdicts, clean days, streaks — can accidentally count one. Their XP is
  // added separately below, which is the only thing they touch.
  const mine = takenTrades(ofMine);
  const myChecks = checks
    .filter((c) => c.accountId === account.id)
    .sort((a, b) => a.date.localeCompare(b.date));

  const verdicts: DayVerdict[] = [];
  let xp = bonusXp;

  // Written-up misses pay, so logging the setup you didn't get into is worth
  // doing. Summed out here rather than inside the day walk: a missed setup
  // must never put a date into that walk, or a day you never traded would
  // start producing a verdict.
  const missedPaidOn = new Map<string, number>();
  for (const e of ofMine.filter(isMissed).sort((a, b) => a.date.localeCompare(b.date))) {
    if (!isFullyLogged(e)) continue;
    const paid = missedPaidOn.get(e.date) ?? 0;
    if (paid >= MISSED_XP_PER_DAY) continue;
    missedPaidOn.set(e.date, paid + 1);
    xp += XP.missedLogged;
  }

  // Walked oldest-first so the boost compounds in the order it was earned.
  let run = 0;
  let longestRun = 0;

  // A second, independent streak over the same walk: calm is about what you
  // admitted on the day, not whether the day was clean, so a flagged emotion
  // breaks it even on an otherwise clean day, and a clean day with nothing
  // flagged extends it even if a trade elsewhere on that day was not clean.
  let calmRun = 0;
  let longestCalmRun = 0;

  // Every date with either a check-in or a logged trade gets judged — a
  // trade already carries what a check-in would have asked (the pre-flight
  // gate it was logged through), so a day doesn't need both to count.
  const checkByDate = new Map(myChecks.map((c) => [c.date, c]));
  const allDates = [...new Set([...checkByDate.keys(), ...mine.map((e) => e.date)])]
    // A weekend or market holiday is not a day you were tested on. Checking in
    // to say "no trade" on a Saturday is not discipline — there was nothing to
    // resist — so it must not pay a clean day, extend the clean streak, or earn
    // check-in XP. It equally must not cost anything: the day never reaches the
    // walk at all, so it cannot mark the run dirty either.
    //
    // A day you ACTUALLY TRADED is always judged, whatever the calendar says.
    // Futures reopen on Sunday evening, and a trade taken then is as real as
    // any other — it is the empty non-trading day that is meaningless, not the
    // date itself.
    .filter((date) => !isNonTradingDay(date) || mine.some((e) => e.date === date))
    .sort();

  for (const date of allDates) {
    const check = checkByDate.get(date);
    const dayEntries = mine.filter((e) => e.date === date);
    const planned = plannedRiskOn(account, adjustments, entries, date);
    const verdict = judgeDayAny(date, check, dayEntries, planned);
    verdicts.push(verdict);

    // The check-in XP specifically rewards the check-in itself; a
    // trade-only day still earns the logging and clean-day XP below.
    if (check) xp += XP.checkIn;
    xp += dayEntries.filter(isFullyLogged).length * XP.fullyLogged;

    if (verdict.clean) {
      // The boost is earned by the days already banked, so a run of two pays
      // the bonus on the third — you have to hold it before it pays.
      xp += Math.round(XP.cleanDay * boostFor(run));
      run++;
      longestRun = Math.max(longestRun, run);
    } else {
      // Only a dirty day resets it. A missed check-in never reaches here at
      // all, so absence pauses the run rather than destroying it.
      run = 0;
    }

    const emotions = check ? check.emotions : dayEntries.flatMap((e) => e.emotions ?? []);
    if (emotions.length === 0) {
      calmRun++;
      longestCalmRun = Math.max(longestCalmRun, calmRun);
    } else {
      calmRun = 0;
    }
  }

  const cleanDays = verdicts.filter((v) => v.clean).length;

  // A third streak, over trades rather than days — the two named violations
  // this whole module exists to catch, back to back, measured against your
  // best-ever run so an unlock earned here is permanent.
  const orderedTrades = [...mine].sort(
    (a, b) => a.date.localeCompare(b.date) || (a.sequence ?? 0) - (b.sequence ?? 0),
  );
  let steadyRun = 0;
  let longestSteadyRun = 0;
  for (const trade of orderedTrades) {
    if (!trade.gaveBack && !trade.movedToBE) {
      steadyRun++;
      longestSteadyRun = Math.max(longestSteadyRun, steadyRun);
    } else {
      steadyRun = 0;
    }
  }

  return {
    cleanDays,
    attendanceStreak: attendanceStreak(myChecks, today),
    longestAttendanceStreak: longestAttendanceStreak(myChecks),
    cleanStreak: run,
    longestCleanStreak: longestRun,
    longestCalmStreak: longestCalmRun,
    longestSteadyStreak: longestSteadyRun,
    boost: boostFor(run),
    xp,
    level: Math.floor(xp / XP_PER_LEVEL) + 1,
    verdicts,
  };
}

/**
 * Rough floor for "wrote something real" rather than a stray word — about a
 * short sentence's worth of characters.
 */
const MIN_REFLECTION_LENGTH = 40;

function hasReflection(entry: Entry): boolean {
  if ((entry.notes ?? '').trim().length >= MIN_REFLECTION_LENGTH) return true;
  return entry.walkthrough.some((w) => w.note.trim().length >= MIN_REFLECTION_LENGTH);
}

/**
 * A trade is fully logged when it carries a screenshot, a profile tag, and
 * real reflection — a sentence or two, not just a click. The screenshot and
 * tag alone used to be enough, but that let the XP bonus pay out on a trade
 * with nothing actually written about it.
 *
 * This is a bar on the RECORD, so a missed setup can clear it too — it just
 * pays the smaller XP.missedLogged rather than XP.fullyLogged. See where the
 * two are awarded in summarizeDiscipline.
 */
export function isFullyLogged(entry: Entry): boolean {
  return hasLogContent(entry) && Boolean(entry.completedAt);
}

/**
 * Everything a full log needs EXCEPT the declaration that it's finished.
 *
 * Split out from isFullyLogged so the editor can answer "what is still
 * missing" and "is the Complete log button ready yet" without either question
 * having to know how XP is awarded.
 */
export function hasLogContent(entry: Entry): boolean {
  return Boolean(entry.sessionProfile) && entry.walkthrough.some((w) => w.image) && hasReflection(entry);
}

/** The specific things still standing between this entry and a complete log. */
export function missingForLog(entry: Entry): string[] {
  const missing: string[] = [];
  if (!entry.sessionProfile) missing.push('which candle it was');
  if (!entry.walkthrough.some((w) => w.image)) missing.push('a chart screenshot');
  if (!hasReflection(entry)) missing.push('a sentence or two on what you saw');
  return missing;
}

/* ---------- streaks ---------- */

function shiftDay(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Consecutive days ending today (or yesterday — today isn't "missed" until it's
 * over) with a check-in, regardless of what was admitted in them.
 */
/** The next/previous day the market is actually open. */
function stepTradingDay(date: string, direction: 1 | -1): string {
  let cursor = shiftDay(date, direction);
  while (isNonTradingDay(cursor)) cursor = shiftDay(cursor, direction);
  return cursor;
}

/**
 * Attendance is counted over TRADING days only. A weekend or holiday is
 * stepped straight over: it never extends a run, and never breaks one either.
 * Before this, checking in every weekday still reset the streak every Saturday,
 * which made the number unreachable by design.
 */
export function attendanceStreak(checks: DayCheck[], today: string): number {
  const dates = new Set(checks.map((c) => c.date));
  let cursor = dates.has(today) ? today : shiftDay(today, -1);
  // Today can itself be a weekend — start the walk at the last open day.
  if (isNonTradingDay(cursor)) cursor = stepTradingDay(cursor, -1);
  let run = 0;
  while (dates.has(cursor)) {
    run++;
    cursor = stepTradingDay(cursor, -1);
  }
  return run;
}

export function longestAttendanceStreak(checks: DayCheck[]): number {
  // Weekend check-ins are dropped rather than counted — see attendanceStreak.
  const dates = [...new Set(checks.map((c) => c.date))].filter((d) => !isNonTradingDay(d)).sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const date of dates) {
    run = prev && stepTradingDay(prev, 1) === date ? run + 1 : 1;
    best = Math.max(best, run);
    prev = date;
  }
  return best;
}

/* ---------- how Voyager is carrying it ---------- */

/**
 * Voyager's read on where you are, right now. Deliberately only three states:
 * this is a glance, not a fourth scoreboard, and anything finer would be
 * asking the mascot to editorialise on numbers the page already shows.
 *
 * 'dimmed' is driven by the most recent day you actually recorded, not by the
 * calendar — a rule broken three days ago that you haven't traded since is
 * still the last thing that happened.
 */
export type VoyagerMood = 'dimmed' | 'steady' | 'bright';

export function voyagerMood(summary: Pick<DisciplineSummary, 'verdicts' | 'cleanStreak'>): VoyagerMood {
  const last = summary.verdicts[summary.verdicts.length - 1];
  if (last && !last.clean) return 'dimmed';
  // The same run that earns the 1.5x boost — the point where a streak has
  // gone from "a couple of days" to something worth protecting.
  if (summary.cleanStreak >= 5) return 'bright';
  return 'steady';
}

/* ---------- trajectory ---------- */

export type Trajectory = {
  legIndex: number;
  legName: string;
  nextLegName: string | null;
  /** clean days needed to reach the next leg */
  toNext: number | null;
  /** 0..1 progress through the current leg */
  legProgress: number;
  /** 0..1 progress across the whole journey */
  totalProgress: number;
};

export function trajectory(cleanDays: number): Trajectory {
  let legIndex = 0;
  for (let i = LEGS.length - 1; i >= 0; i--) {
    if (cleanDays >= LEGS[i].at) {
      legIndex = i;
      break;
    }
  }
  const leg = LEGS[legIndex];
  const next = LEGS[legIndex + 1] ?? null;
  const span = next ? next.at - leg.at : 0;

  return {
    legIndex,
    legName: leg.name,
    nextLegName: next?.name ?? null,
    toNext: next ? next.at - cleanDays : null,
    legProgress: next ? Math.min(1, (cleanDays - leg.at) / span) : 1,
    totalProgress: Math.min(1, cleanDays / LEGS[LEGS.length - 1].at),
  };
}

/* ---------- loop detection ---------- */

/**
 * What a pattern actually took out of the account, in the account's own
 * numbers. Only ever the realised result of trades that would not exist if
 * the rule had held — never a guess at what a trade "would have" made.
 */
export type LoopCost = {
  /** summed R of the trades this pattern produced — negative means it cost you */
  r: number;
  /** the same trades in money */
  money: number;
  /** how many trades that is */
  trades: number;
};

export type LoopFlag = {
  id: string;
  title: string;
  detail: string;
  /** how loud this should read — 'high' is the give-back chain */
  severity: 'high' | 'medium' | 'low';
  dates: string[];
  /**
   * Present only where the counterfactual is honest — the extra trades a
   * pattern caused are real logged records, so their total is a real number.
   * The break-even habit deliberately has none: what the trade would have
   * paid had the stop stayed put is not something this app records, and
   * inventing it would be the one kind of number this module must not show.
   */
  cost?: LoopCost;
};

/** R for a single entry, same derivation the analytics module uses. */
function entryR(entry: Entry): number {
  if (typeof entry.rMultiple === 'number' && !Number.isNaN(entry.rMultiple)) return entry.rMultiple;
  const { risk, result } = entry;
  if (typeof risk === 'number' && risk > 0 && typeof result === 'number') return result / risk;
  return 0;
}

/** Total a set of trades in both R and money. Undefined when there's nothing to total. */
function costOf(trades: Entry[]): LoopCost | undefined {
  if (!trades.length) return undefined;
  return {
    r: trades.reduce((sum, e) => sum + entryR(e), 0),
    money: trades.reduce((sum, e) => sum + (typeof e.result === 'number' ? e.result : 0), 0),
    trades: trades.length,
  };
}

/**
 * Named detectors, not a generic "emotional load" score. The first one is the
 * chain that actually costs money: a trade that gave back profit, followed by
 * another trade the same day.
 */
export function detectLoops(
  account: Account,
  adjustments: BalanceAdjustment[],
  entries: Entry[],
  checks: DayCheck[],
  today: string,
  windowDays = 14,
): LoopFlag[] {
  const from = shiftDay(today, -windowDays);
  // Missed setups never happened as far as the loop detectors are concerned —
  // one cannot be overtrading, tilt, or a give-back. See isMissed.
  const mine = takenTrades(entriesForAccount(entries, account.id)).filter((e) => e.date >= from);
  const allMyChecks = checks.filter((c) => c.accountId === account.id);
  const myChecks = allMyChecks.filter((c) => c.date >= from);
  const flags: LoopFlag[] = [];

  const byDate = new Map<string, Entry[]>();
  for (const e of mine) {
    const list = byDate.get(e.date) ?? [];
    list.push(e);
    byDate.set(e.date, list);
  }

  /* 1 — give-back tilt: the signature chain */
  const tilt: string[] = [];
  // The trades taken AFTER the give-back on those days — the ones the tilt
  // itself produced, and the only part of the chain with a real price on it.
  const tiltReentries: Entry[] = [];
  for (const [date, list] of byDate) {
    const ordered = [...list].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
    const gaveBackAt = ordered.findIndex((e) => e.gaveBack || e.movedToBE);
    if (gaveBackAt !== -1 && ordered.length > gaveBackAt + 1) {
      tilt.push(date);
      tiltReentries.push(...ordered.slice(gaveBackAt + 1));
    }
  }
  if (tilt.length) {
    flags.push({
      id: 'give-back-tilt',
      title: 'Give-back tilt',
      detail:
        tilt.length === 1
          ? 'You gave back a trade and re-entered the same day.'
          : `You gave back a trade and re-entered the same day, ${tilt.length} times.`,
      severity: 'high',
      dates: tilt.sort(),
      cost: costOf(tiltReentries),
    });
  }

  /* 2 — break-even habit */
  const beDates = [...new Set(mine.filter((e) => e.movedToBE).map((e) => e.date))].sort();
  if (beDates.length >= 2) {
    flags.push({
      id: 'break-even-habit',
      title: 'Break-even habit',
      detail: `Stop moved to break even on ${beDates.length} days — your rule is never.`,
      severity: 'high',
      dates: beDates,
    });
  }

  /* 3 — overtrading */
  const overDates = [...byDate.entries()].filter(([, l]) => l.length > 1).map(([d]) => d).sort();
  if (overDates.length) {
    // Everything past the one trade the rule allows. Same logic as the tilt
    // cost: these are real records, so their total is a real number.
    const extras: Entry[] = [];
    for (const [, list] of byDate) {
      if (list.length <= 1) continue;
      extras.push(...[...list].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)).slice(1));
    }
    flags.push({
      id: 'overtrading',
      title: 'Overtrading',
      detail: `More than one trade on ${overDates.length} day${overDates.length === 1 ? '' : 's'}.`,
      severity: 'medium',
      dates: overDates,
      cost: costOf(extras),
    });
  }

  /* 4 — risk drift */
  const drifted = mine.filter((e) =>
    isDrifting(e, plannedRiskOn(account, adjustments, entries, e.date)),
  );
  if (drifted.length >= 2) {
    flags.push({
      id: 'risk-drift',
      title: 'Risk drifting',
      detail: `${drifted.length} trades sized more than ${RISK_TOLERANCE * 100}% away from plan.`,
      severity: 'medium',
      dates: [...new Set(drifted.map((e) => e.date))].sort(),
    });
  }

  /* 5 — repeated emotion */
  const tally = new Map<string, string[]>();
  for (const check of myChecks) {
    for (const tag of check.emotions) {
      const list = tally.get(tag) ?? [];
      list.push(check.date);
      tally.set(tag, list);
    }
  }
  for (const [tag, dates] of tally) {
    if (dates.length >= 3) {
      flags.push({
        id: `emotion-${tag}`,
        title: `Repeating: ${tag}`,
        detail: `Flagged ${dates.length} times in the last ${windowDays} days.`,
        severity: 'low',
        dates: dates.sort(),
      });
    }
  }

  /* 6 — went dark — needs the full history, not the window, or a gap longer
     than the window would leave nothing to measure against */
  const gap = missedRun(allMyChecks, today);
  if (gap >= 2) {
    flags.push({
      id: 'went-dark',
      title: 'Went dark',
      detail: `${gap} days without a check-in.`,
      severity: 'medium',
      dates: [],
    });
  }

  return flags;
}

/**
 * Consecutive days immediately before today with no check-in.
 *
 * Bounded by the first check-in ever made: days before you started using this
 * are not days you "went dark". And checking in today means the run is zero,
 * however sparse the history behind it.
 */
function missedRun(checks: DayCheck[], today: string): number {
  if (!checks.length) return 0;
  const dates = new Set(checks.map((c) => c.date));
  if (dates.has(today)) return 0;

  const earliest = checks.reduce((min, c) => (c.date < min ? c.date : min), checks[0].date);
  // Trading days only. A Monday after a normal weekend is one day away, not
  // three — counting the closed days made every Monday look like a lapse.
  let cursor = shiftDay(today, -1);
  if (isNonTradingDay(cursor)) cursor = stepTradingDay(cursor, -1);
  let run = 0;
  while (!dates.has(cursor) && cursor >= earliest && run < 60) {
    run++;
    cursor = stepTradingDay(cursor, -1);
  }
  return run;
}

export { shiftDay };

/* ---------- how far off being up ---------- */

/**
 * The R multiple the worked examples take. 2R–3R is the stated range, with 3R
 * described as the usual take, so that is what the comeback line prices a win
 * at rather than an invented number.
 */
export const TARGET_R = 3;

export type Comeback = {
  /** dollars at risk on the next trade, off the balance you have NOW */
  risk: number;
  /** R needed purely to erase the deficit — 0 when already ahead */
  toFlat: number;
  /** where a win at TARGET_R would leave the running total */
  net: number;
  /** how much that win adds */
  gain: number;
  ahead: boolean;
};

/**
 * "You are one trade away from being up X."
 *
 * The point is that a red number is not the whole story when risk is sized off
 * a live balance: one trade at the usual target clears a deficit several times
 * over. This states that in dollars instead of leaving it to be felt.
 *
 * Risk comes off the CURRENT balance, not the starting one, because that is the
 * rule — 10% of what you have now. A drawdown therefore shrinks the next trade,
 * and the line stays honest about that rather than quoting a stale figure.
 */
export function comeback(
  netPnl: number,
  balance: number,
  riskPercent: number,
  atR: number = TARGET_R,
): Comeback {
  const risk = Math.max(0, plannedRisk(Math.max(0, balance), riskPercent));
  const gain = risk * atR;
  return {
    risk,
    // A wiped-out balance risks nothing, so nothing can be earned back — say
    // zero rather than dividing by it and reporting Infinity as encouragement.
    toFlat: netPnl >= 0 || risk === 0 ? 0 : Math.abs(netPnl) / risk,
    net: netPnl + gain,
    gain,
    ahead: netPnl >= 0,
  };
}

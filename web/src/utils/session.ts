/* ============================================================
   Which candle are we on, right now.

   The six 4H candles sit on a clean grid: 02, 06, 10, 14, 18, 22 — and those
   are NEW YORK hours, not wherever you happen to be. That distinction is the
   whole point of this module: read off a Perth clock, 18:00 local is really
   NY 06:00, so the app would confidently name the wrong candle and every
   expectation under it would be wrong too.

   Conversion goes through Intl with an explicit timeZone, so EST/EDT is
   handled by the platform rather than by a hardcoded offset that would
   silently break twice a year.

   The grid logic is kept pure and separate (sessionAt) from reading the clock
   (sessionNow), so the arithmetic is testable without faking global time.
   ============================================================ */

import type { SessionProfile } from '../types';

/** The clock every session label in data/framework.ts is quoted in. */
export const SESSION_TZ = 'America/New_York';

/** Every 4H candle open, in New York hours, in the order they run. */
export const CANDLE_HOURS = [2, 6, 10, 14, 18, 22] as const;

export type CandleId = SessionProfile | '1400';

/** '0200' | '0600' | … — the id data/framework.ts keys its sessions by. */
function idOf(hour: number): CandleId {
  return String(hour).padStart(2, '0').concat('00') as CandleId;
}

/**
 * New York wall-clock hour and minute for a given instant, DST included.
 * Falls back to the device clock only if the runtime has no timezone data —
 * a wrong-but-working strip beats a blank one.
 */
export function nyClock(now: Date): { hour: number; minute: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: SESSION_TZ,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value);
    const minute = Number(parts.find((p) => p.type === 'minute')?.value);
    if (Number.isFinite(hour) && Number.isFinite(minute)) {
      // h23 should never produce 24, but a stray one would push the grid a
      // whole candle out — cheap to make impossible.
      return { hour: hour % 24, minute };
    }
  } catch {
    /* no timezone database — fall through */
  }
  return { hour: now.getHours(), minute: now.getMinutes() };
}

export type SessionNow = {
  /** the candle currently running */
  current: CandleId;
  /** the one that opens next */
  next: CandleId;
  /** whole minutes until `next` opens */
  minutesToNext: number;
  /** whole minutes since `current` opened */
  minutesIn: number;
  /**
   * True once the next open is close enough that the next candle is the one
   * worth reading about rather than the one you're sitting in.
   */
  approaching: boolean;
  /** New York wall clock, "06:15" — what the grid was actually computed from */
  nyTime: string;
};

/** How near the next open counts as "approaching". */
export const APPROACH_MINUTES = 60;

/** The grid arithmetic, given a New York wall clock. Pure. */
export function sessionAt(hour: number, minute: number, approachWithin = APPROACH_MINUTES): SessionNow {
  // The most recent open at or before now. Before 02:00 the running candle is
  // the previous day's 22:00, which is why this wraps to the last entry.
  let startIndex = -1;
  for (let i = CANDLE_HOURS.length - 1; i >= 0; i--) {
    if (hour >= CANDLE_HOURS[i]) {
      startIndex = i;
      break;
    }
  }
  const wrapped = startIndex === -1;
  const currentIndex = wrapped ? CANDLE_HOURS.length - 1 : startIndex;
  const nextIndex = (currentIndex + 1) % CANDLE_HOURS.length;

  const currentHour = CANDLE_HOURS[currentIndex];
  // Minutes since the current candle opened — plus a full day's worth when
  // we've wrapped past midnight into the 22:00 candle.
  const minutesIn = wrapped
    ? (24 - currentHour + hour) * 60 + minute
    : (hour - currentHour) * 60 + minute;
  // Every candle is exactly four hours, so what's left is what four hours
  // minus the elapsed part leaves.
  const minutesToNext = 240 - minutesIn;

  return {
    current: idOf(currentHour),
    next: idOf(CANDLE_HOURS[nextIndex]),
    minutesToNext,
    minutesIn,
    approaching: minutesToNext <= approachWithin,
    nyTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
  };
}

export function sessionNow(now: Date = new Date(), approachWithin = APPROACH_MINUTES): SessionNow {
  const { hour, minute } = nyClock(now);
  return sessionAt(hour, minute, approachWithin);
}

/* ------------------------------------------------------------
   The timing decision tree

   "Time Remaining in C2 — The Core Decision Tree" calls itself the master
   rule of the whole timing framework, and it is purely mechanical: how much
   of the current 4H candle is left decides whether you position inside it or
   wait for the next one to open.

   The app has always had the number — the countdown on the dashboard is the
   same minutesToNext — it just never ran the rule over it. This does.
   ------------------------------------------------------------ */

/**
 * Scheduled, high-impact times that deliver expansion regardless of how
 * little candle is left. The framework names exactly one — the 9:30 NY cash
 * open — and treats it as the only exception to the clock, so this stays a
 * list of what the source actually says rather than a guess at what else
 * might move price.
 */
export const DRIVERS = [{ hour: 9, minute: 30, label: '9:30 NY open' }] as const;

/** Roughly an hour left is the line the decision tree turns on. */
export const ENOUGH_TIME_MINUTES = 60;

export type TimingCall = {
  /** what to actually do right now */
  verdict: 'position-inside' | 'wait-for-next' | 'driver-overrides';
  /** the driver that overrode the clock, when one did */
  driver?: { label: string; minutesAway: number };
  minutesLeft: number;
};

/**
 * Which branch of the tree you are on, given a New York wall clock.
 *
 * Pure and separate from the clock read for the same reason sessionAt is —
 * so the branches can be tested without faking global time.
 */
export function timingAt(hour: number, minute: number, minutesLeft: number): TimingCall {
  // A driver still ahead of us and still inside this candle.
  const nowMins = hour * 60 + minute;
  let driver: TimingCall['driver'];
  for (const d of DRIVERS) {
    const away = d.hour * 60 + d.minute - nowMins;
    if (away >= 0 && away <= minutesLeft) {
      driver = { label: d.label, minutesAway: away };
      break;
    }
  }

  // The source puts the driver check first and says it "overrides everything
  // below" — but when there is already enough organic time, both branches end
  // in the same action: position now. Reporting that as an *override* would
  // dress an ordinary read up as an exception, so the driver is carried as
  // information here and only becomes the verdict when it actually changes
  // the answer.
  if (minutesLeft > ENOUGH_TIME_MINUTES) return { verdict: 'position-inside', driver, minutesLeft };

  // Short on time — the one case where a driver flips the decision.
  if (driver) return { verdict: 'driver-overrides', driver, minutesLeft };

  return { verdict: 'wait-for-next', minutesLeft };
}

/** The tree, run against the clock. */
export function timingNow(now: Date = new Date()): TimingCall {
  const { hour, minute } = nyClock(now);
  return timingAt(hour, minute, sessionAt(hour, minute).minutesToNext);
}

/** "1h 20m" / "35m" — how the countdown reads. */
export function untilLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

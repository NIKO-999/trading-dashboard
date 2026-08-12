/* ============================================================
   Which days the market is actually open.

   The discipline calendar needs this to tell two very different things apart:
   a trading day you did not show up for, and a day there was nothing to show
   up for. Without it a Saturday, Christmas Day and a skipped Tuesday all
   render identically, which makes the grid read worse the longer you use it.

   Deliberately computed, not a hard-coded list of dates. A table of holidays
   would silently expire — this app is meant to still be right in 2030 without
   anyone remembering to top it up. Every rule below is a standing one, so the
   only maintenance is if an exchange changes its own calendar.

   Scope: the US equity-index and metals futures sessions this app models
   (CME/NYSE full closures). Early closes — the half-days around Thanksgiving
   and Christmas — are NOT here on purpose: the market IS open, the session
   model still applies, and a shortened day is a normal trading day with less
   of it. Treating those as rest would excuse a day you could have traded.

   Pure functions, no IO, no React — same shape as discipline.ts, and tested
   the same way.
   ============================================================ */

/** 0 = Sunday … 6 = Saturday, for a local (not UTC) civil date. */
function weekday(y: number, m: number, d: number): number {
  return new Date(y, m - 1, d).getDay();
}

/** The date of the nth given weekday in a month, e.g. 3rd Monday of January. */
function nthWeekdayOf(y: number, m: number, weekdayWanted: number, n: number): number {
  const firstWd = weekday(y, m, 1);
  const offset = (weekdayWanted - firstWd + 7) % 7;
  return 1 + offset + (n - 1) * 7;
}

/** The date of the last given weekday in a month, e.g. last Monday of May. */
function lastWeekdayOf(y: number, m: number, weekdayWanted: number): number {
  const daysInMonth = new Date(y, m, 0).getDate();
  const lastWd = weekday(y, m, daysInMonth);
  return daysInMonth - ((lastWd - weekdayWanted + 7) % 7);
}

/**
 * Easter Sunday in the Gregorian calendar (Meeus/Jones/Butcher). Needed only
 * to place Good Friday, which is the one moveable market holiday that is not
 * anchored to a weekday-of-month rule.
 */
function easter(y: number): { month: number; day: number } {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/**
 * The exchange's observed date for a fixed-date holiday. A holiday landing on
 * Saturday is taken the Friday before; on Sunday, the Monday after. Without
 * this, Independence Day on a Saturday would mark a day the market was already
 * shut and leave the actual closure (the Friday) looking like a skipped day.
 */
function observed(y: number, m: number, d: number): string {
  const wd = weekday(y, m, d);
  const shift = wd === 6 ? -1 : wd === 0 ? 1 : 0; // Sat → Fri before, Sun → Mon after
  // Shifted through a Date, not by adding to `d`. Doing the arithmetic on the
  // day number alone produced "2028-01-00" for New Year's Day on a Saturday,
  // instead of rolling back to 31 December of the year before.
  const shifted = new Date(y, m - 1, d + shift);
  return iso(shifted.getFullYear(), shifted.getMonth() + 1, shifted.getDate());
}

/** Every full market closure in a given year, as ISO dates → name. */
export function marketHolidays(y: number): Map<string, string> {
  const out = new Map<string, string>();
  const add = (date: string, name: string) => out.set(date, name);

  add(observed(y, 1, 1), "New Year's Day");
  add(iso(y, 1, nthWeekdayOf(y, 1, 1, 3)), 'Martin Luther King Jr. Day');
  add(iso(y, 2, nthWeekdayOf(y, 2, 1, 3)), "Presidents' Day");

  // Good Friday — two days before Easter Sunday. Done through a Date so it
  // rolls back across a month boundary (Easter on the 1st or 2nd) correctly.
  const e = easter(y);
  const gf = new Date(y, e.month - 1, e.day - 2);
  add(iso(gf.getFullYear(), gf.getMonth() + 1, gf.getDate()), 'Good Friday');

  add(iso(y, 5, lastWeekdayOf(y, 5, 1)), 'Memorial Day');
  add(observed(y, 6, 19), 'Juneteenth');
  add(observed(y, 7, 4), 'Independence Day');
  add(iso(y, 9, nthWeekdayOf(y, 9, 1, 1)), 'Labor Day');
  add(iso(y, 11, nthWeekdayOf(y, 11, 4, 4)), 'Thanksgiving');
  add(observed(y, 12, 25), 'Christmas Day');

  // When 1 January falls on a Saturday, the closure is the Friday before —
  // which is 31 December of the year BEFORE it. That date belongs to this
  // year's calendar even though the holiday belongs to next year's, so a
  // year can legitimately carry eleven closures and two New Year's Days.
  const nextNewYear = observed(y + 1, 1, 1);
  if (nextNewYear.startsWith(String(y))) add(nextNewYear, "New Year's Day");

  return out;
}

/** The holiday's name if this ISO date is one, otherwise undefined. */
export function holidayName(date: string): string | undefined {
  const y = Number(date.slice(0, 4));
  if (!Number.isFinite(y)) return undefined;
  return marketHolidays(y).get(date);
}

/** Saturday or Sunday. */
export function isWeekend(date: string): boolean {
  const [y, m, d] = date.split('-').map(Number);
  const wd = weekday(y, m, d);
  return wd === 0 || wd === 6;
}

/**
 * A day the market was shut — weekend or full holiday. The calendar uses this
 * to decide whether a day with no record was a miss or simply not a trading
 * day. It says nothing about grading: a day you actually traded keeps its own
 * verdict regardless of what this returns.
 */
export function isNonTradingDay(date: string): boolean {
  return isWeekend(date) || holidayName(date) !== undefined;
}

/** "Weekend" or the holiday's name — what to show on a rest day. */
export function restLabel(date: string): string {
  return holidayName(date) ?? 'Weekend';
}

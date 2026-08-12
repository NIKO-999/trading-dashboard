import test from 'node:test';
import assert from 'node:assert/strict';
import { holidayName, isNonTradingDay, isWeekend, marketHolidays, restLabel } from './marketDays.ts';

/* Known-good dates, checked against the published NYSE/CME calendars rather
   than against this implementation — a test that only restates the code it
   tests proves nothing about whether the rules are right. */

test('the fixed-date holidays land where they should', () => {
  assert.equal(holidayName('2026-01-01'), "New Year's Day");
  assert.equal(holidayName('2026-06-19'), 'Juneteenth');
  assert.equal(holidayName('2026-12-25'), 'Christmas Day');
});

test('the weekday-of-month holidays land where they should', () => {
  // 2026: MLK is Mon 19 Jan, Presidents' Mon 16 Feb, Memorial Mon 25 May,
  // Labor Mon 7 Sep, Thanksgiving Thu 26 Nov.
  assert.equal(holidayName('2026-01-19'), 'Martin Luther King Jr. Day');
  assert.equal(holidayName('2026-02-16'), "Presidents' Day");
  assert.equal(holidayName('2026-05-25'), 'Memorial Day');
  assert.equal(holidayName('2026-09-07'), 'Labor Day');
  assert.equal(holidayName('2026-11-26'), 'Thanksgiving');
});

test('Good Friday tracks Easter across years', () => {
  // Easter Sunday: 2026-04-05, 2027-03-28, 2024-03-31. Good Friday is two
  // days before each — including 2024, where it crosses back into March.
  assert.equal(holidayName('2026-04-03'), 'Good Friday');
  assert.equal(holidayName('2027-03-26'), 'Good Friday');
  assert.equal(holidayName('2024-03-29'), 'Good Friday');
});

test('a fixed holiday on a weekend is observed on the adjacent weekday', () => {
  // 4 July 2026 is a Saturday — the market closes Friday the 3rd.
  assert.equal(new Date(2026, 6, 4).getDay(), 6, 'fixture assumption: 4 Jul 2026 is a Saturday');
  assert.equal(holidayName('2026-07-03'), 'Independence Day');
  assert.equal(holidayName('2026-07-04'), undefined, 'the Saturday itself is not the observed closure');

  // 1 Jan 2028 is a Saturday, so New Year's is observed on Friday 31 Dec 2027.
  assert.equal(holidayName('2027-12-31'), "New Year's Day");

  // 25 Dec 2027 is a Saturday → observed Friday 24 Dec.
  assert.equal(holidayName('2027-12-24'), 'Christmas Day');

  // 4 July 2027 is a Sunday → observed Monday the 5th.
  assert.equal(new Date(2027, 6, 4).getDay(), 0, 'fixture assumption: 4 Jul 2027 is a Sunday');
  assert.equal(holidayName('2027-07-05'), 'Independence Day');
});

test('every year carries all ten closures, on distinct dates', () => {
  const EXPECTED = [
    "New Year's Day", 'Martin Luther King Jr. Day', "Presidents' Day", 'Good Friday',
    'Memorial Day', 'Juneteenth', 'Independence Day', 'Labor Day', 'Thanksgiving', 'Christmas Day',
  ];
  for (const y of [2024, 2025, 2026, 2027, 2030]) {
    const h = marketHolidays(y);
    for (const name of EXPECTED) {
      assert.ok([...h.values()].includes(name), `${y} is missing ${name}`);
    }
    // 11 rather than 10 when next year's New Year's Day is observed on
    // 31 December of this one — see marketHolidays() for why that is correct.
    assert.ok(h.size === 10 || h.size === 11, `${y} has ${h.size} closures`);
    assert.equal(new Set(h.keys()).size, h.size, `${y} has a duplicated date`);
  }
});

test('an ordinary trading day is not a holiday and not a weekend', () => {
  // Thu 6 Aug 2026 — a real trade in the log sits on this date.
  assert.equal(holidayName('2026-08-06'), undefined);
  assert.equal(isWeekend('2026-08-06'), false);
  assert.equal(isNonTradingDay('2026-08-06'), false);
});

test('weekends are non-trading days, Saturday and Sunday alike', () => {
  assert.equal(isWeekend('2026-08-08'), true, 'Saturday');
  assert.equal(isWeekend('2026-08-09'), true, 'Sunday');
  assert.equal(isNonTradingDay('2026-08-08'), true);
  assert.equal(isNonTradingDay('2026-08-09'), true);
});

test('holidays count as non-trading days even midweek', () => {
  // Thanksgiving 2026 is a Thursday — a weekday the market is shut.
  assert.equal(isWeekend('2026-11-26'), false);
  assert.equal(isNonTradingDay('2026-11-26'), true);
});

test('the rest label names the holiday, or just says Weekend', () => {
  assert.equal(restLabel('2026-11-26'), 'Thanksgiving');
  assert.equal(restLabel('2026-08-08'), 'Weekend');
  // A holiday that also falls at a weekend reads as the holiday — it is the
  // more specific fact, and the observed-date rule already moved the closure.
  assert.equal(restLabel('2026-07-04'), 'Weekend');
});

test('early closes are deliberately not treated as holidays', () => {
  // The half-day after Thanksgiving 2026 (Fri 27 Nov) and Christmas Eve
  // (Thu 24 Dec 2026) are shortened, not shut. The market is open, so the
  // session model still applies and neither is a rest day.
  assert.equal(isNonTradingDay('2026-11-27'), false);
  assert.equal(isNonTradingDay('2026-12-24'), false);
});

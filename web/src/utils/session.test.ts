/* Which candle we're on — run with `npm test`. */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  APPROACH_MINUTES,
  nyClock,
  sessionAt,
  sessionNow,
  timingAt,
  timingNow,
  untilLabel,
} from './session.ts';

/* ---------- the grid, given a New York wall clock ---------- */

test('sits inside the candle that has already opened', () => {
  const s = sessionAt(19, 30);
  assert.equal(s.current, '1800');
  assert.equal(s.next, '2200');
  assert.equal(s.minutesIn, 90);
  assert.equal(s.minutesToNext, 150);
  assert.equal(s.approaching, false);
});

test('exactly on an open is the start of that candle, not the end of the last', () => {
  const s = sessionAt(18, 0);
  assert.equal(s.current, '1800');
  assert.equal(s.minutesIn, 0);
  assert.equal(s.minutesToNext, 240);
});

test('the hour before an open reads as approaching the next one', () => {
  const s = sessionAt(21, 15);
  assert.equal(s.current, '1800');
  assert.equal(s.next, '2200');
  assert.equal(s.minutesToNext, 45);
  assert.equal(s.approaching, true);
});

test('the approach window is exactly APPROACH_MINUTES, not a minute more', () => {
  assert.equal(sessionAt(21, 0).approaching, true, `${APPROACH_MINUTES}m out is approaching`);
  assert.equal(sessionAt(20, 59).approaching, false, 'a minute earlier is not');
});

test('after midnight the running candle is still the previous day’s 22:00', () => {
  // 01:30 is 3h30m into the 22:00 candle — the wrap is the case that breaks
  // if this is written as a naive "latest hour <= now" lookup.
  const s = sessionAt(1, 30);
  assert.equal(s.current, '2200');
  assert.equal(s.next, '0200');
  assert.equal(s.minutesIn, 210);
  assert.equal(s.minutesToNext, 30);
  assert.equal(s.approaching, true);
});

test('midnight itself is inside the 22:00 candle', () => {
  const s = sessionAt(0, 0);
  assert.equal(s.current, '2200');
  assert.equal(s.minutesIn, 120);
  assert.equal(s.minutesToNext, 120);
});

test('the excluded 14:00 candle is reported like any other — the UI decides what to say', () => {
  const s = sessionAt(15, 0);
  assert.equal(s.current, '1400');
  assert.equal(s.next, '1800');
});

test('approaching 14:00 still names 14:00 as next', () => {
  const s = sessionAt(13, 30);
  assert.equal(s.current, '1000');
  assert.equal(s.next, '1400');
  assert.equal(s.approaching, true);
});

test('every candle is exactly four hours — minutesIn + minutesToNext always 240', () => {
  for (let hour = 0; hour < 24; hour++) {
    for (const minute of [0, 17, 59]) {
      const s = sessionAt(hour, minute);
      assert.equal(
        s.minutesIn + s.minutesToNext,
        240,
        `${hour}:${minute} does not add up — ${s.minutesIn} + ${s.minutesToNext}`,
      );
      assert.ok(s.minutesIn >= 0 && s.minutesToNext > 0, `${hour}:${minute} produced a negative span`);
    }
  }
});

/* ---------- the clock it reads, which is New York's, not the device's ---------- */

test('the session grid follows New York, not whatever timezone the machine is in', () => {
  // 2026-08-06T10:00Z — that's 18:00 in Perth and 06:00 in New York (EDT).
  // Reading the device clock would name 18:00 Daily Open; the right answer
  // is the 06:00 candle. This is the bug this whole module exists to avoid.
  const s = sessionNow(new Date('2026-08-06T10:00:00Z'));
  assert.equal(s.nyTime, '06:00');
  assert.equal(s.current, '0600');
  assert.equal(s.next, '1000');
});

test('nyClock converts a UTC instant to New York summer time (EDT, UTC−4)', () => {
  assert.deepEqual(nyClock(new Date('2026-08-06T18:30:00Z')), { hour: 14, minute: 30 });
});

test('nyClock converts a UTC instant to New York winter time (EST, UTC−5)', () => {
  // Same UTC hour, five months later — the offset has to move on its own or
  // the whole grid slips by an hour for half the year.
  assert.deepEqual(nyClock(new Date('2026-01-06T18:30:00Z')), { hour: 13, minute: 30 });
});

test('New York midnight lands inside the 22:00 candle, from a UTC instant', () => {
  // 2026-08-06T04:00Z = 00:00 EDT.
  const s = sessionNow(new Date('2026-08-06T04:00:00Z'));
  assert.equal(s.nyTime, '00:00');
  assert.equal(s.current, '2200');
});

test('untilLabel reads as a countdown, not a raw number', () => {
  assert.equal(untilLabel(45), '45m');
  assert.equal(untilLabel(60), '1h');
  assert.equal(untilLabel(95), '1h 35m');
});

/* ---------- the timing decision tree ---------- */

test('more than an hour left means you can position inside the candle', () => {
  // 02:00 candle at 02:30 — 3h30m left and no driver anywhere near.
  const t = timingAt(2, 30, 210);
  assert.equal(t.verdict, 'position-inside');
  assert.equal(t.driver, undefined);
});

test('an upcoming driver is reported but does not hijack a verdict it would not change', () => {
  // 06:30 with 3h30m left: 9:30 is ahead, but you would position inside
  // anyway. Calling that an "override" would dress a normal read up as an
  // exception — so the driver is carried as information, not as the verdict.
  const t = timingAt(6, 30, 210);
  assert.equal(t.verdict, 'position-inside');
  assert.equal(t.driver?.minutesAway, 180, 'still worth knowing it is coming');
});

test('under an hour left, with nothing scheduled, means wait for the next candle', () => {
  // 02:00 candle at 05:30 — 30m left, and 9:30 is far outside this candle.
  const t = timingAt(5, 30, 30);
  assert.equal(t.verdict, 'wait-for-next');
});

test('the boundary is "more than" an hour, not "at least"', () => {
  // The source says roughly an hour; 60 exactly is not more than 60.
  assert.equal(timingAt(5, 0, 61).verdict, 'position-inside');
  assert.equal(timingAt(5, 0, 60).verdict, 'wait-for-next');
});

test('a driver inside the remaining window overrides the clock entirely', () => {
  // 06:00 candle at 09:15 — only 45m left, which would normally say wait,
  // but 9:30 is 15m away. The source calls this the one exception.
  const t = timingAt(9, 15, 45);
  assert.equal(t.verdict, 'driver-overrides');
  assert.equal(t.driver?.minutesAway, 15);
  assert.match(t.driver?.label ?? '', /9:30/);
});

test('a driver that has already passed does not override anything', () => {
  // 09:45 — 9:30 is behind us, so the clock rule applies again.
  assert.equal(timingAt(9, 45, 15).verdict, 'wait-for-next');
});

test('a driver beyond this candle is not this candle’s driver', () => {
  // 06:15 with only 20m left: 9:30 is hours away and lands in a later candle.
  const t = timingAt(6, 15, 20);
  assert.equal(t.verdict, 'wait-for-next');
  assert.equal(t.driver, undefined);
});

test('the tree reads the New York clock, not the device clock', () => {
  // 2026-08-06T13:20Z = 09:20 NY (EDT), ten minutes before the 9:30 driver,
  // inside the 06:00 candle with 40m left. A device-clock read would miss it.
  const t = timingNow(new Date('2026-08-06T13:20:00Z'));
  assert.equal(t.verdict, 'driver-overrides');
  assert.equal(t.driver?.minutesAway, 10);
});


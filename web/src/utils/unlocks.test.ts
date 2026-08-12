/* Unlock announcements — run with `npm test`. */

import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { collectUnlocks, type Progress } from './unlocks.ts';

/** Minimal localStorage stand-in — the module only needs get/set. */
const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: () => null,
  length: 0,
} as Storage;

beforeEach(() => store.clear());

function progress(over: Partial<Progress> = {}): Progress {
  return {
    level: 1,
    cleanDays: 0,
    longestAttendanceStreak: 0,
    longestCleanStreak: 0,
    longestCalmStreak: 0,
    longestSteadyStreak: 0,
    ...over,
  };
}

test('first run announces nothing and records the baseline', () => {
  // Ten unlocks at once for someone who just opened the app is noise.
  assert.deepEqual(collectUnlocks(progress({ level: 4, cleanDays: 30 })), []);
  assert.deepEqual(collectUnlocks(progress({ level: 4, cleanDays: 30 })), [], 'and nothing again on the next load');
});

test('a clean-day gain announces the gear it earned', () => {
  collectUnlocks(progress({ level: 1 }));
  const msgs = collectUnlocks(progress({ level: 1, cleanDays: 10 }));
  // Day 10 is both a gear tier and the first stop on the road — both fire.
  assert.equal(msgs.length, 2);
  assert.match(msgs[0], /Tinted Visor unlocked — 10 clean days/);
  assert.match(msgs[1], /Reached Cinder — 10 clean days/);
});

test('gear does not move on rank alone, but the outfit it crosses does', () => {
  // The whole point of the change: showing up and logging raises rank, but a
  // day you broke your rule must not advance the suit. The wardrobe is the
  // deliberate exception — it is meant to move on rank, so Pathfinder (rank
  // 4) is expected here alongside the rank line.
  collectUnlocks(progress({ level: 1, cleanDays: 10 }));
  const msgs = collectUnlocks(progress({ level: 6, cleanDays: 10 }));
  assert.deepEqual(
    msgs,
    ['Process rank 6', 'Pathfinder unlocked — process rank 4'],
    'rank moves, and the outfit it crossed along the way — gear does not',
  );
});

test('rank, outfit, gear and waypoint are announced together', () => {
  collectUnlocks(progress({ level: 1 }));
  const msgs = collectUnlocks(progress({ level: 4, cleanDays: 10 }));
  assert.equal(msgs.length, 4, 'one rank, one outfit, one gear tier, one waypoint');
  assert.match(msgs[0], /^Process rank 4/);
  assert.match(msgs[1], /Pathfinder unlocked — process rank 4/);
  assert.match(msgs[2], /Tinted Visor/);
  assert.match(msgs[3], /Reached Cinder/);
});

test('standing still announces nothing', () => {
  collectUnlocks(progress({ level: 4, cleanDays: 30 }));
  assert.deepEqual(collectUnlocks(progress({ level: 4, cleanDays: 30 })), []);
});

test('each gear tier is announced once, at the clean day that earns it', () => {
  collectUnlocks(progress({ level: 1, cleanDays: 10 }));
  assert.deepEqual(collectUnlocks(progress({ level: 1, cleanDays: 19 })), [], 'nothing sits between 10 and 20');

  const at20 = collectUnlocks(progress({ level: 1, cleanDays: 20 }));
  // Day 20 is also Orbit, the road's second stop — both land in the same call.
  assert.equal(at20.length, 2);
  assert.match(at20[0], /Silver Shell/, 'crosses the 20-day threshold exactly');
  assert.match(at20[1], /Reached Orbit/);

  assert.deepEqual(collectUnlocks(progress({ level: 1, cleanDays: 25 })), [], 'no re-announce of the silver shell');
  assert.match(collectUnlocks(progress({ level: 1, cleanDays: 30 }))[0], /Comms Antenna/);
});

test('a jump across several tiers announces every one crossed', () => {
  collectUnlocks(progress({ level: 1 }));
  const msgs = collectUnlocks(progress({ level: 1, cleanDays: 50 }));
  // Every gear tier crossed, in order, then every waypoint crossed, in order,
  // then crew — the passes run one after the other rather than interleaved by
  // day. Quill rides along because it gates on the lifetime clean-day count
  // rather than a streak, so a jump to 50 crosses its 30 as well.
  assert.deepEqual(msgs, [
    'Tinted Visor unlocked — 10 clean days',
    'Silver Shell unlocked — 20 clean days',
    'Comms Antenna unlocked — 30 clean days',
    'Graphite Weave unlocked — 50 clean days',
    'Reached Cinder — 10 clean days',
    'Reached Orbit — 20 clean days',
    'Reached Vesper — 30 clean days',
    'Reached Halcyon — 40 clean days',
    'Reached Deep Space — 50 clean days',
    'Quill joined the crew — 30 total clean days',
  ]);
});

test('each waypoint is announced once, at the clean day that earns it', () => {
  collectUnlocks(progress({ level: 1, cleanDays: 50 })); // first run at 50 — records the baseline silently
  // Day 60 is a road stop (Tarn) but not a gear tier, so exactly one message.
  const msgs = collectUnlocks(progress({ level: 1, cleanDays: 60 }));
  assert.deepEqual(msgs, ['Reached Tarn — 60 clean days']);

  assert.deepEqual(collectUnlocks(progress({ level: 1, cleanDays: 65 })), [], 'nothing sits between 60 and 70');
  assert.deepEqual(collectUnlocks(progress({ level: 1, cleanDays: 65 })), [], 'standing still says nothing');
});

test('a record written before gear moved to clean days stays quiet', () => {
  // Old shape: { level }. Announcing the whole roster on the first load after
  // the change would be the exact noise this module exists to prevent.
  store.set('mc-last-seen-progress', JSON.stringify({ level: 4 }));
  assert.deepEqual(collectUnlocks(progress({ level: 4, cleanDays: 90 })), []);
  // ...and the record is upgraded, so the next real gain does announce.
  assert.match(collectUnlocks(progress({ level: 4, cleanDays: 110 }))[0], /Nav Array/);
});

/* ---------- crew ---------- */

test('each crewmate is announced once, at the habit that earns it — and no other habit unlocks it', () => {
  collectUnlocks(progress()); // baseline at zero

  // Raising three unrelated habits, each still short of its own threshold,
  // must not unlock Beacon early.
  const decoy = collectUnlocks(
    progress({ longestCleanStreak: 5, longestCalmStreak: 5, longestSteadyStreak: 5, cleanDays: 5 }),
  );
  assert.deepEqual(decoy, [], 'nothing crew-related fires off the wrong metric');

  const msgs = collectUnlocks(
    progress({ longestAttendanceStreak: 14, longestCleanStreak: 5, longestCalmStreak: 5, longestSteadyStreak: 5, cleanDays: 5 }),
  );
  assert.deepEqual(msgs, ['Beacon joined the crew — 14 days checked in, back to back']);
});

test('the clean streak unlocks Pebble early and Bedrock later, and nothing else does', () => {
  collectUnlocks(progress());
  // 10 is short of Beacon's 14, so raising attendance alone stays quiet.
  assert.deepEqual(collectUnlocks(progress({ longestAttendanceStreak: 10 })), [], 'attendance alone does nothing on the clean track');

  // The early tier lands on its own, well before the late one.
  assert.deepEqual(
    collectUnlocks(progress({ longestAttendanceStreak: 10, longestCleanStreak: 6 })),
    ['Pebble joined the crew — 6 clean days in a row'],
  );
  // ...and the late tier lands later, without re-announcing the early one.
  assert.deepEqual(
    collectUnlocks(progress({ longestAttendanceStreak: 10, longestCleanStreak: 15 })),
    ['Bedrock joined the crew — 15 clean days in a row'],
  );
});

test('a jump straight past both tiers of a metric announces both, in ladder order', () => {
  collectUnlocks(progress());
  assert.deepEqual(collectUnlocks(progress({ longestCleanStreak: 15 })), [
    'Pebble joined the crew — 6 clean days in a row',
    'Bedrock joined the crew — 15 clean days in a row',
  ]);
});

test('Wisp unlocks on the calm streak', () => {
  collectUnlocks(progress());
  const msgs = collectUnlocks(progress({ longestCalmStreak: 20 }));
  assert.deepEqual(msgs, ['Wisp joined the crew — 20 check-ins with nothing flagged']);
});

test('the steady (no give-back, no move-to-BE) streak unlocks Sprocket then Anchor', () => {
  collectUnlocks(progress());
  assert.deepEqual(
    collectUnlocks(progress({ longestSteadyStreak: 6 })),
    ['Sprocket joined the crew — 6 trades with no give-back, no move to break-even'],
  );
  assert.deepEqual(
    collectUnlocks(progress({ longestSteadyStreak: 15 })),
    ['Anchor joined the crew — 15 trades with no give-back, no move to break-even'],
  );
});

test('the late tier of a metric does not unlock on its early sibling alone', () => {
  collectUnlocks(progress());
  // Every early threshold met, no late one — exactly the five early crewmates.
  const msgs = collectUnlocks(
    progress({ longestCleanStreak: 6, longestSteadyStreak: 6, longestAttendanceStreak: 14, longestCalmStreak: 20, cleanDays: 30 }),
  );
  assert.equal(msgs.filter((m) => m.includes('joined the crew')).length, 5, 'the early tier should not drag the late tier in with it');
});

test('Aegis unlocks on total clean days, the lifetime metric', () => {
  collectUnlocks(progress({ cleanDays: 99 }));
  assert.deepEqual(collectUnlocks(progress({ cleanDays: 99 })), [], 'standing still says nothing');
  const msgs = collectUnlocks(progress({ cleanDays: 100 }));
  // 100 clean days is also a road stop (Somnus) — both land in the same call.
  assert.deepEqual(msgs, ['Reached Somnus — 100 clean days', 'Aegis joined the crew — 100 total clean days']);
});

test('a crewmate is announced once, then never again', () => {
  collectUnlocks(progress());
  const first = collectUnlocks(progress({ longestAttendanceStreak: 14 }));
  assert.equal(first.length, 1);
  assert.deepEqual(collectUnlocks(progress({ longestAttendanceStreak: 14 })), [], 'no re-announce');
  assert.deepEqual(collectUnlocks(progress({ longestAttendanceStreak: 20 })), [], 'still no re-announce past the threshold');
});

test('a record written before the crew roster existed stays quiet on crew, but not on the rest', () => {
  // Old shape: full Progress minus the four crew fields.
  store.set('mc-last-seen-progress', JSON.stringify({ level: 1, cleanDays: 10 }));
  const msgs = collectUnlocks(progress({ level: 1, cleanDays: 20, longestAttendanceStreak: 10 }));
  // Gear/waypoint still work off cleanDays as before; crew stays silent this
  // one time because the baseline for its four fields didn't exist yet — 10
  // is deliberately under Beacon's threshold of 14, so nothing would have
  // fired even if it had run.
  assert.deepEqual(msgs, ['Silver Shell unlocked — 20 clean days', 'Reached Orbit — 20 clean days']);
  // ...and now that the record carries the crew fields, the next real gain announces.
  const next = collectUnlocks(progress({ level: 1, cleanDays: 20, longestAttendanceStreak: 14 }));
  assert.deepEqual(next, ['Beacon joined the crew — 14 days checked in, back to back']);
});

test('rank, outfit, gear, waypoint and crew can all land in the same call', () => {
  collectUnlocks(progress({ level: 1 }));
  const msgs = collectUnlocks(progress({ level: 4, cleanDays: 10, longestAttendanceStreak: 14 }));
  assert.deepEqual(msgs, [
    'Process rank 4',
    'Pathfinder unlocked — process rank 4',
    'Tinted Visor unlocked — 10 clean days',
    'Reached Cinder — 10 clean days',
    'Beacon joined the crew — 14 days checked in, back to back',
  ]);
});

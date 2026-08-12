/* ============================================================
   Noticing when you've earned something.

   A reward you have to go looking for isn't a reward. Levels, gear, outfits
   and crew all unlock silently as a by-product of check-ins, so without this
   you'd only discover a new crewmate by wandering onto the Moonshot page and
   spotting that a card stopped being grey.

   State is per-device in localStorage rather than on the server on purpose: the
   point is to tell *you*, here, once. Syncing it would mean a write on every
   load and a missed announcement if you happened to open the other device first.
   ============================================================ */

// Explicit .ts extensions: node's test runner resolves these directly, where
// Vite would happily infer them. Keeps this module testable outside a bundler.
import { CHARACTERS, unlockedCharacters, type CharacterProgress } from '../data/characters.ts';
import { unlockedGear } from '../data/gear.ts';
import { unlockedOutfits } from '../data/outfits.ts';
import { WAYPOINTS } from '../data/waypoints.ts';

const KEY = 'mc-last-seen-progress';

export type Progress = {
  level: number;
  cleanDays: number;
  longestAttendanceStreak: number;
  longestCleanStreak: number;
  longestCalmStreak: number;
  longestSteadyStreak: number;
};

type Seen = Partial<Progress> & { level: number };

function read(): Seen | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.level === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

function write(seen: Seen) {
  try {
    localStorage.setItem(KEY, JSON.stringify(seen));
  } catch {
    /* private mode — announcements just repeat, which is harmless */
  }
}

function toCharacterProgress(p: Progress | Seen): CharacterProgress | null {
  const keys = CHARACTERS.map((c) => c.metric);
  for (const key of keys) {
    if (typeof p[key] !== 'number') return null;
  }
  return {
    longestAttendanceStreak: p.longestAttendanceStreak ?? 0,
    longestCleanStreak: p.longestCleanStreak ?? 0,
    longestCalmStreak: p.longestCalmStreak ?? 0,
    longestSteadyStreak: p.longestSteadyStreak ?? 0,
    cleanDays: p.cleanDays ?? 0,
  };
}

/**
 * Compare progress against what this device last saw and return what's new.
 * First run records silently: announcing ten unlocks at once to someone who
 * just opened the app would be noise, not celebration.
 *
 * Six independent dimensions, because they're earned different ways — rank by
 * XP, gear and waypoints both by clean days but on different schedules,
 * outfits by the same XP rank as gear's neighbour but a genuinely different
 * track, and crew each by a different habit metric entirely (see
 * data/characters.ts — that's the whole point of the roster). A single
 * counter would announce the wrong thing whenever they moved apart.
 */
export function collectUnlocks(progress: Progress): string[] {
  const { level, cleanDays } = progress;
  const seen = read();
  write(progress);
  if (!seen) return [];

  const messages: string[] = [];

  if (level > seen.level) {
    messages.push(`Process rank ${level}`);

    const before = unlockedOutfits(seen.level).map((o) => o.id);
    for (const outfit of unlockedOutfits(level)) {
      if (!before.includes(outfit.id)) {
        messages.push(`${outfit.name} unlocked — process rank ${outfit.unlockLevel}`);
      }
    }
  }

  // A record written before gear moved onto clean days has no cleanDays field.
  // Treat that as a first run for this dimension rather than announcing every
  // tier the suit already had.
  if (typeof seen.cleanDays === 'number' && cleanDays > seen.cleanDays) {
    const before = unlockedGear(seen.cleanDays).map((g) => g.name);
    for (const gear of unlockedGear(cleanDays)) {
      if (!before.includes(gear.name)) {
        messages.push(`${gear.name} unlocked — ${gear.at} clean days`);
      }
    }

    // Same gate, same clean-day number, a different schedule — waypoints land
    // every 10 days, gear tiers do not, so this has to be its own pass rather
    // than piggybacking on the loop above. Without this, the cheer line
    // written for every stop on the road stays dead unless you go tap the
    // planet — arriving somewhere should say so.
    for (const waypoint of WAYPOINTS) {
      if (waypoint.days > seen.cleanDays && waypoint.days <= cleanDays) {
        messages.push(`Reached ${waypoint.name} — ${waypoint.days} clean days`);
      }
    }
  }

  // A record written before the crew roster existed is missing one or more of
  // the four streak fields — first run for this dimension, same rule as gear.
  const beforeCrew = toCharacterProgress(seen);
  const afterCrew = toCharacterProgress(progress);
  if (beforeCrew && afterCrew) {
    const beforeIds = unlockedCharacters(beforeCrew).map((c) => c.id);
    for (const character of unlockedCharacters(afterCrew)) {
      if (!beforeIds.includes(character.id)) {
        messages.push(`${character.name} joined the crew — ${character.threshold} ${character.unit}`);
      }
    }
  }

  return messages;
}

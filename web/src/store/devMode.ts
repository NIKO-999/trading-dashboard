/* ============================================================
   TEMPORARY — developer preview toggle.

   Lets you see every gear tier, outfit, crewmate and waypoint at once without
   grinding 150 days of real check-ins first. Purely a display override: it
   never writes to data/discipline.json, so turning it off puts you right back
   where your real progress actually is.

   Remove this whole file, DevToggle.tsx, and every `useDevUnlockAll` /
   `overrideSummary` call site once you're done previewing and ready to use
   the app for real.
   ============================================================ */

import { useSyncExternalStore } from 'react';
import type { DisciplineSummary } from '../utils/discipline';

const KEY = 'mc-dev-unlock-all';
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

let active = read();

export function toggleDevUnlockAll() {
  active = !active;
  try {
    localStorage.setItem(KEY, active ? '1' : '0');
  } catch {
    /* private mode — the toggle just won't survive a reload, harmless */
  }
  for (const l of listeners) l();
}

export function useDevUnlockAll(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => active,
    () => active,
  );
}

/** Every gear tier, outfit, crewmate and waypoint sits at or below 150 clean
 *  days / rank 12 — 999 clears all of them with headroom. */
const MAXED = 999;

export function overrideSummary(summary: DisciplineSummary, on: boolean): DisciplineSummary {
  if (!on) return summary;
  return {
    ...summary,
    cleanDays: 150,
    level: MAXED,
    xp: (MAXED - 1) * 500,
    attendanceStreak: MAXED,
    longestAttendanceStreak: MAXED,
    cleanStreak: MAXED,
    longestCleanStreak: MAXED,
    longestCalmStreak: MAXED,
    longestSteadyStreak: MAXED,
    boost: 2,
  };
}

/* ============================================================
   The launch transition.

   A brief full-screen beat between tapping Voyager and landing on the journey,
   so the rings arrive as a destination rather than appearing in place. Short
   enough that it never becomes a toll on the way to information — it announces,
   then gets out of the way.

   Skipped entirely under prefers-reduced-motion: the caller checks and jumps
   straight through.
   ============================================================ */

import { useEffect } from 'react';

export const LAUNCH_MS = 1100;

export function LaunchTransition({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, LAUNCH_MS);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="mc-launch" role="presentation">
      <div className="mc-launch-burst" aria-hidden="true" />
      <div className="mc-launch-pill">
        <span className="mc-launch-eyebrow">Entering</span>
        <span className="mc-launch-title">Trajectory</span>
      </div>
    </div>
  );
}

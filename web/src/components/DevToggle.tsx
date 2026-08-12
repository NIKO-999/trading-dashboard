/* ============================================================
   TEMPORARY — floating preview toggle. Remove alongside devMode.ts once
   you're done previewing gear/outfits/crew and ready to use the app for real.
   ============================================================ */

import { FlaskConical } from 'lucide-react';
import { toggleDevUnlockAll, useDevUnlockAll } from '../store/devMode';

export function DevToggle() {
  const on = useDevUnlockAll();
  return (
    <button
      className={`mc-dev-toggle ${on ? 'on' : ''}`}
      onClick={toggleDevUnlockAll}
      title={on ? 'Showing everything unlocked — tap to go back to your real progress' : 'Tap to preview every gear tier, outfit, crewmate and waypoint unlocked'}
    >
      <FlaskConical size={13} />
      {on ? 'Preview: everything' : 'Dev preview'}
    </button>
  );
}

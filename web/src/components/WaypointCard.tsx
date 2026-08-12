/* ============================================================
   The card you get when you tap a stop.

   Two states, and the difference matters: a place you have reached congratulates
   you, a place you haven't tells you how far off it is. Nothing here is
   flattering — the distance is the real number of clean days remaining.
   ============================================================ */

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PlanetArt } from './PlanetArt';
import type { Waypoint } from '../data/waypoints';

export function WaypointCard({
  waypoint,
  cleanDays,
  onClose,
}: {
  waypoint: Waypoint;
  cleanDays: number;
  onClose: () => void;
}) {
  const reached = cleanDays >= waypoint.days;
  const away = waypoint.days - cleanDays;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Portalled to the body: .mc-page runs a transform animation on entry, and a
  // transformed ancestor would become the containing block for position: fixed.
  return createPortal(
    <div className="mc-wp-backdrop" onClick={onClose} role="presentation">
      <div
        className="mc-card mc-wp-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={waypoint.name}
      >
        <button className="mc-wp-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="mc-wp-art">
          <svg viewBox="-40 -40 80 80" width="88" height="88" aria-hidden="true">
            <PlanetArt kind={waypoint.kind} palette={waypoint.palette} reached={reached} r={24} />
          </svg>
        </div>

        <div className="mc-wp-eyebrow">{reached ? 'Reached' : `${away} clean ${away === 1 ? 'day' : 'days'} away`}</div>
        <h3 className="mc-wp-name">{waypoint.name}</h3>
        <div className="mc-wp-meta">
          {waypoint.days} clean days · <span className="mc-wp-kind">{waypoint.kind}</span>
        </div>

        <p className="mc-wp-note">{waypoint.note}</p>

        {reached ? (
          <p className="mc-wp-cheer">{waypoint.cheer}</p>
        ) : (
          <p className="mc-wp-locked">Get here and this unlocks.</p>
        )}
      </div>
    </div>,
    document.body,
  );
}

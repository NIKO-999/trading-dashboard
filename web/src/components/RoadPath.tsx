/* ============================================================
   The road from Earth to the Moon.

   A winding route climbing a tall, scrollable canvas. Earth sits at the bottom,
   the Moon far above. A stop every 10 clean days; the five legs become named
   stretches along the way.

   The road behind you is lit and glowing, the road ahead is dim. Clean days
   ratchet in the engine, so the lit section can only ever grow — the picture is
   telling the truth rather than flattering it.

   The ship is placed with getPointAtLength on the real path, so it always sits
   exactly on the road no matter how the curve is tuned.
   ============================================================ */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LEGS } from '../utils/discipline';
import { PlanetArt } from './PlanetArt';
import { SpaceField } from './SpaceField';
import { WAYPOINTS, type Waypoint } from '../data/waypoints';

const EVERY = 10; // clean days per stop
const TOTAL = LEGS[LEGS.length - 1].at; // 150
const STOPS = Math.round(TOTAL / EVERY); // 15
const STEP = 92; // vertical distance between stops
const W = 300;
const PAD_BOTTOM = 96;
const PAD_TOP = 128;
const H = STEP * STOPS + PAD_BOTTOM + PAD_TOP;
const AMP = 62;

/** Stop i (0 = Earth, STOPS = the Moon) in canvas coordinates. */
function stopAt(i: number) {
  return {
    x: W / 2 + Math.sin(i * 0.82) * AMP,
    y: H - PAD_BOTTOM - i * STEP,
    days: i * EVERY,
  };
}

/** Smooth vertical cubic through every stop. */
function buildPath() {
  const p0 = stopAt(0);
  let d = `M ${p0.x} ${p0.y}`;
  for (let i = 1; i <= STOPS; i++) {
    const a = stopAt(i - 1);
    const b = stopAt(i);
    d += ` C ${a.x} ${a.y - STEP * 0.5}, ${b.x} ${b.y + STEP * 0.5}, ${b.x} ${b.y}`;
  }
  return d;
}

const PATH = buildPath();

export function RoadPath({
  cleanDays,
  onSelect,
  children,
}: {
  cleanDays: number;
  /** tapping a stop opens its card */
  onSelect?: (w: Waypoint) => void;
  /** the traveller, positioned on the road by this component */
  children?: React.ReactNode;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [len, setLen] = useState(0);
  const [ship, setShip] = useState<{ x: number; y: number; angle: number } | null>(null);

  const progress = Math.max(0, Math.min(1, cleanDays / TOTAL));

  useLayoutEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const total = path.getTotalLength();
    setLen(total);

    // Sample slightly ahead to get a heading, so the craft points up the road.
    const at = total * progress;
    const p = path.getPointAtLength(at);
    const q = path.getPointAtLength(Math.min(total, at + 2));
    setShip({
      x: p.x,
      y: p.y,
      angle: (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI + 90,
    });
  }, [progress]);

  // Open on your current position rather than at Earth every time.
  useEffect(() => {
    const box = scrollRef.current;
    if (!box || !ship) return;
    const scale = box.clientWidth / W;
    box.scrollTop = Math.max(0, ship.y * scale - box.clientHeight * 0.62);
  }, [ship]);

  const lit = len * progress;

  return (
    <div className="mc-road-scroll" ref={scrollRef}>
      <svg className="mc-road" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${cleanDays} of ${TOTAL} clean days`}>
        <defs>
          <filter id="road-glow" x="-60%" y="-20%" width="220%" height="140%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="road-earth" cx="0.4" cy="0.3" r="0.75">
            <stop offset="0%" stopColor="#5b9dd9" />
            <stop offset="55%" stopColor="#2f6fa8" />
            <stop offset="100%" stopColor="#123049" />
          </radialGradient>
          <radialGradient id="road-moon" cx="0.38" cy="0.32" r="0.72">
            <stop offset="0%" stopColor="#f2f4f8" />
            <stop offset="60%" stopColor="#c8cfda" />
            <stop offset="100%" stopColor="#8c95a4" />
          </radialGradient>
        </defs>

        {/* mask limits the flowing dashes to the part of the road you've lit —
            masks respect stroke geometry, which clip paths do not */}
        <mask id="road-lit-mask">
          <path
            d={PATH}
            fill="none"
            stroke="#fff"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${lit} ${len}`}
          />
        </mask>

        <SpaceField width={W} height={H} />

        {/* ---------- the road ---------- */}
        <path ref={pathRef} d={PATH} fill="none" stroke="var(--hairline-soft)" strokeWidth="7" strokeLinecap="round" />
        <path
          d={PATH}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${lit} ${len}`}
          filter="url(#road-glow)"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
        {/* wind running up the road you've already lit */}
        <g mask="url(#road-lit-mask)">
          <path d={PATH} className="mc-road-flow" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* ---------- the Moon, far up ---------- */}
        {(() => {
          const m = stopAt(STOPS);
          const reached = cleanDays >= TOTAL;
          return (
            <g>
              <circle cx={m.x} cy={m.y} r="30" fill="url(#road-moon)" opacity={reached ? 1 : 0.55} />
              <circle cx={m.x - 9} cy={m.y - 6} r="6" fill="#8c95a4" opacity="0.45" />
              <circle cx={m.x + 8} cy={m.y + 7} r="4.2" fill="#8c95a4" opacity="0.4" />
              <circle cx={m.x + 3} cy={m.y - 13} r="3" fill="#8c95a4" opacity="0.35" />
              <text x={m.x} y={m.y - 44} textAnchor="middle" className="mc-road-label">
                THE MOON
              </text>
            </g>
          );
        })()}

        {/* ---------- stops ---------- */}
        {WAYPOINTS.map((w) => {
          const i = w.days / EVERY;
          const s = stopAt(i);
          const reached = cleanDays >= w.days;
          const isLeg = LEGS.some((l) => l.at === w.days);
          return (
            <g
              key={w.days}
              className="mc-road-stop-node"
              transform={`translate(${s.x}, ${s.y})`}
              onClick={() => onSelect?.(w)}
              role="button"
              tabIndex={0}
              aria-label={`${w.name}, ${w.days} clean days`}
            >
              {/* generous invisible hit area — these are small on a phone */}
              <circle r="26" fill="transparent" />
              <PlanetArt kind={w.kind} palette={w.palette} reached={reached} r={isLeg ? 15 : 11} />
              {/* leg stops are larger and some wear rings — clear them properly */}
              <text
                x={(s.x > W / 2 ? -1 : 1) * (isLeg ? 36 : 26)}
                y="4"
                textAnchor={s.x > W / 2 ? 'end' : 'start'}
                className={`mc-road-stop ${reached ? 'on' : ''}`}
              >
                {w.name}
              </text>
            </g>
          );
        })}

        {/* ---------- Earth, at your back ---------- */}
        {(() => {
          const e = stopAt(0);
          return (
            <g>
              <circle cx={e.x} cy={e.y} r="34" fill="url(#road-earth)" />
              <ellipse cx={e.x - 8} cy={e.y - 10} rx="12" ry="7" fill="#4e8f5a" opacity="0.55" />
              <ellipse cx={e.x + 11} cy={e.y + 9} rx="9" ry="6" fill="#4e8f5a" opacity="0.45" />
              <text x={e.x} y={e.y + 52} textAnchor="middle" className="mc-road-label">
                EARTH
              </text>
            </g>
          );
        })()}

        {/* ---------- the ship ---------- */}
        {ship && (
          <g
            className="mc-road-ship"
            transform={`translate(${ship.x}, ${ship.y}) rotate(${ship.angle})`}
          >
            {children}
          </g>
        )}
      </svg>
    </div>
  );
}

export { TOTAL as ROAD_TOTAL, EVERY as ROAD_EVERY };

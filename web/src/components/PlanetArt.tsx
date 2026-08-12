/* ============================================================
   The bodies at each stop.

   Six silhouettes so the route is recognisably somewhere rather than a line of
   identical dots — you should be able to tell which stop you're looking at
   without reading the label.

   Unreached bodies render dim and desaturated. Reached ones take their full
   colour and a rim of the theme accent, so "lit up" means the same thing here
   as it does on the road.
   ============================================================ */

import type { WaypointKind } from '../data/waypoints';

export function PlanetArt({
  kind,
  palette,
  reached,
  r = 13,
}: {
  kind: WaypointKind;
  palette: [string, string];
  reached: boolean;
  r?: number;
}) {
  const [light, dark] = reached ? palette : ['#3a4048', '#22262c'];
  const rim = reached ? 'var(--accent)' : 'var(--hairline)';

  return (
    <g opacity={reached ? 1 : 0.75}>
      {kind === 'ringed' && (
        <ellipse rx={r * 1.95} ry={r * 0.5} fill="none" stroke={light} strokeWidth="2.4" opacity="0.75" transform="rotate(-18)" />
      )}

      {kind === 'star' ? (
        <g>
          <circle r={r * 0.78} fill={light} />
          <circle r={r * 0.44} fill="#fff" opacity="0.8" />
          {[0, 45, 90, 135].map((a) => (
            <rect
              key={a}
              x={-r * 1.7}
              y={-0.9}
              width={r * 3.4}
              height="1.8"
              rx="0.9"
              fill={light}
              opacity="0.5"
              transform={`rotate(${a})`}
            />
          ))}
        </g>
      ) : (
        <>
          <circle r={r} fill={dark} />
          <path d={`M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0 Z`} fill={light} transform="rotate(-28)" />
          <circle r={r} fill="none" stroke={rim} strokeWidth="1.6" opacity={reached ? 0.85 : 0.5} />
        </>
      )}

      {/* surface character */}
      {kind === 'rock' && (
        <g opacity="0.4" fill={dark}>
          <circle cx={-r * 0.35} cy={-r * 0.2} r={r * 0.26} />
          <circle cx={r * 0.3} cy={r * 0.3} r={r * 0.18} />
          <circle cx={r * 0.1} cy={-r * 0.5} r={r * 0.13} />
        </g>
      )}
      {kind === 'gas' && (
        <g opacity="0.45" fill={dark}>
          <rect x={-r} y={-r * 0.45} width={r * 2} height={r * 0.22} rx={r * 0.11} />
          <rect x={-r} y={r * 0.08} width={r * 2} height={r * 0.3} rx={r * 0.15} />
        </g>
      )}
      {kind === 'ice' && (
        <g opacity="0.6" fill="#ffffff">
          <ellipse cy={-r * 0.68} rx={r * 0.62} ry={r * 0.26} />
          <ellipse cy={r * 0.72} rx={r * 0.48} ry={r * 0.2} />
        </g>
      )}
      {kind === 'moonlet' && (
        <g opacity="0.35" fill={dark}>
          <circle cx={-r * 0.28} cy={r * 0.25} r={r * 0.33} />
          <circle cx={r * 0.38} cy={-r * 0.3} r={r * 0.2} />
        </g>
      )}
      {kind === 'ringed' && (
        <ellipse rx={r * 1.95} ry={r * 0.5} fill="none" stroke={light} strokeWidth="2.4" opacity="0.4" transform="rotate(-18)" />
      )}
    </g>
  );
}

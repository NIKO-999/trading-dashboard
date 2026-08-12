/* ============================================================
   The space behind the road.

   Static star field, slow drifting dust, the occasional shooting star, and a
   couple of asteroids crossing. Enough that the scene is alive; not so much
   that it competes with the thing you came to read.

   Positions come from a seeded generator rather than Math.random so the sky is
   identical on every render — a star field that reshuffles whenever React
   re-renders reads as a glitch, not as space.

   This lives inside the road canvas only. The app's own ambient background is
   untouched.
   ============================================================ */

/** Deterministic 0..1 from an integer — same sky every time. */
function rnd(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function SpaceField({ width, height }: { width: number; height: number }) {
  const stars = Array.from({ length: 130 }, (_, i) => ({
    x: rnd(i * 3 + 1) * width,
    y: rnd(i * 7 + 2) * height,
    r: 0.5 + rnd(i * 11 + 3) * 1.3,
    o: 0.25 + rnd(i * 13 + 4) * 0.6,
    // only some twinkle, and on their own clocks
    twinkle: rnd(i * 17 + 5) > 0.72,
    delay: rnd(i * 19 + 6) * 6,
  }));

  const dust = Array.from({ length: 22 }, (_, i) => ({
    x: rnd(i * 23 + 7) * width,
    y: rnd(i * 29 + 8) * height,
    r: 0.7 + rnd(i * 31 + 9) * 1.1,
    dur: 14 + rnd(i * 37 + 10) * 16,
    delay: rnd(i * 41 + 11) * 12,
  }));

  // spread down the canvas so one is usually in view wherever you're scrolled
  const shooters = Array.from({ length: 5 }, (_, i) => ({
    x: rnd(i * 43 + 12) * width * 0.8,
    y: (height / 5) * i + rnd(i * 47 + 13) * (height / 6),
    len: 46 + rnd(i * 53 + 14) * 40,
    dur: 5 + rnd(i * 59 + 15) * 5,
    delay: i * 3.1 + rnd(i * 61 + 16) * 4,
  }));

  const rocks = Array.from({ length: 3 }, (_, i) => ({
    y: (height / 3) * i + rnd(i * 67 + 17) * (height / 4),
    r: 2.4 + rnd(i * 71 + 18) * 2.2,
    dur: 26 + rnd(i * 73 + 19) * 18,
    delay: i * 7 + rnd(i * 79 + 20) * 9,
  }));

  return (
    <g className="mc-space" aria-hidden="true">
      {stars.map((s, i) => (
        <circle
          key={`s${i}`}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill="#ffffff"
          opacity={s.o}
          className={s.twinkle ? 'mc-star-twinkle' : undefined}
          style={s.twinkle ? { animationDelay: `${s.delay}s` } : undefined}
        />
      ))}

      {dust.map((d, i) => (
        <circle
          key={`d${i}`}
          cx={d.x}
          cy={d.y}
          r={d.r}
          fill="var(--accent)"
          opacity="0.3"
          className="mc-dust"
          style={{
            animationDuration: `${d.dur}s`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}

      {shooters.map((s, i) => (
        <g key={`sh${i}`} transform={`translate(${s.x}, ${s.y})`}>
          <g
            className="mc-shooter"
            style={{
              animationDuration: `${s.dur}s`,
              animationDelay: `${s.delay}s`,
            }}
          >
            <line
              x1="0"
              y1="0"
              x2={s.len}
              y2={s.len * 0.55}
              stroke="#ffffff"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.85"
            />
            <circle cx={s.len} cy={s.len * 0.55} r="1.9" fill="#ffffff" />
          </g>
        </g>
      ))}

      {rocks.map((r, i) => (
        <g key={`r${i}`} transform={`translate(0, ${r.y})`}>
          <g
            className="mc-asteroid"
            style={{
              animationDuration: `${r.dur}s`,
              animationDelay: `${r.delay}s`,
            }}
          >
            <path
              d={`M ${-r.r} 0 l ${r.r * 0.6} ${-r.r} l ${r.r} ${r.r * 0.3} l ${-r.r * 0.3} ${r.r} Z`}
              fill="#6f7885"
              opacity="0.55"
            />
          </g>
        </g>
      ))}
    </g>
  );
}

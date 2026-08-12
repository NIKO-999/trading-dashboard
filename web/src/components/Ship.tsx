/* ============================================================
   Voyager's craft.

   Drawn nose-up around its own origin so RoadPath can rotate it to the road's
   heading with a single transform. Deliberately simple: it renders at roughly
   30 screen pixels and it is moving, so detail would only muddy it.

   The window carries the theme accent — it reads as Voyager inside without
   needing a figure at this size.
   ============================================================ */

export function Ship({ size = 30 }: { size?: number }) {
  const s = size / 30;
  return (
    <g transform={`scale(${s})`}>
      {/* thruster plume, trailing behind */}
      <path d="M-5 12 q5 14 5 20 q0 -6 5 -20 Z" fill="var(--accent)" opacity="0.55" className="mc-ship-flame" />
      {/* fins */}
      <path d="M-7 4 l-8 10 h8 Z" fill="#8b95a5" />
      <path d="M7 4 l8 10 h-8 Z" fill="#8b95a5" />
      {/* hull */}
      <path d="M0 -18 q9 9 9 20 v6 h-18 v-6 q0 -11 9 -20 Z" fill="#e4e9f0" />
      <path d="M0 -18 q9 9 9 20 v6 h-9 Z" fill="#b9c2cf" />
      {/* window */}
      <circle cx="0" cy="-1" r="4.6" fill="var(--accent)" opacity="0.9" />
      <circle cx="-1.4" cy="-2.4" r="1.6" fill="#ffffff" opacity="0.55" />
      {/* nose light */}
      <circle cx="0" cy="-17" r="2" fill="#ffffff" opacity="0.8" />
    </g>
  );
}

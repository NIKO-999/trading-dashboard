/* Ported from the "Voidwalker" outfit review page — approved before integration.
   Own body: a genuinely different figure, not a decoration layered onto
   Voyager's shared rig. Dispatched from Voyager.tsx by figureId. */

/* DELIBERATELY EXCLUDED FROM THE INK PASS (./ink.tsx).
   Every other outfit got a dark outline carrying its silhouette. This one
   must not: its entire concept is edges that do not resolve — the cloak
   "fades at the hem instead of hemmed", the limbs "taper past the elbow into
   wisps", the torso has "no hard shoulder line", and it hovers rather than
   stands, which is why it has a glow with a gap under it and no contact
   shadow. An outline would draw a hard boundary exactly where the figure is
   supposed to stop existing. Consistency that destroys the subject is not
   consistency worth having. */

export function Voidwalker({ uid }: { uid: string }) {
  const id = (n: string) => `${n}-${uid}`;
  return (
    <>

        <defs>
          <radialGradient id={id('orb')} cx="0.36" cy="0.32" r="0.75">
            <stop offset="0%" stopColor="#3a2a6a" />
            <stop offset="45%" stopColor="#1a1030" />
            <stop offset="100%" stopColor="#050308" />
          </radialGradient>
          <radialGradient id={id('portal')} cx="0.4" cy="0.35" r="0.75">
            <stop offset="0%" stopColor="#4a3480" />
            <stop offset="45%" stopColor="#1e1438" />
            <stop offset="100%" stopColor="#040308" />
          </radialGradient>
          <linearGradient id={id('shade')} x1="0.15" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#3c2f66" />
            <stop offset="45%" stopColor="#221a3c" />
            <stop offset="100%" stopColor="#0c0918" />
          </linearGradient>
          <linearGradient id={id('wisp')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3c2f66" />
            <stop offset="70%" stopColor="#180f2c" />
            <stop offset="100%" stopColor="#0a0614" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id={id('cloak')} x1="0.15" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#2c2148" />
            <stop offset="55%" stopColor="#160f28" />
            <stop offset="100%" stopColor="#080512" stopOpacity="0.2" />
          </linearGradient>
          <radialGradient id={id('hover')} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#8a6ad9" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8a6ad9" stopOpacity="0" />
          </radialGradient>
          <filter id={id('glow')} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.6" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* hovering, not standing — the glow sits below him with a gap */}
        <ellipse cx="100" cy="270" rx="54" ry="10" fill={`url(#${id('hover')})`} />

        {/* ---------- trailing void-cloak — wispy, star-flecked, fading at the hem instead of hemmed ---------- */}
        <g opacity="0.92">
          <path d="M64 128 C48 160 62 190 44 224 C58 234 50 254 40 268 C60 258 66 236 60 214 C72 184 70 154 78 128 Z" fill={`url(#${id('cloak')})`} />
          <path d="M136 128 C152 160 138 190 156 224 C142 234 150 254 160 268 C140 258 134 236 140 214 C128 184 130 154 122 128 Z" fill={`url(#${id('cloak')})`} />
          <circle cx="52" cy="200" r="1.4" fill="#c9baf0" opacity="0.8" />
          <circle cx="148" cy="210" r="1.2" fill="#c9baf0" opacity="0.7" />
          <circle cx="46" cy="244" r="1" fill="#c9baf0" opacity="0.6" />
        </g>

        {/* ---------- legs — no boots, tapering into curling smoke ---------- */}
        <g>
          <path d="M82 192 C78 214 84 232 74 252 C86 250 90 238 92 220 C94 206 92 198 90 192 Z" fill={`url(#${id('wisp')})`} />
          <path d="M118 192 C122 214 116 232 126 252 C114 250 110 238 108 220 C106 206 108 198 110 192 Z" fill={`url(#${id('wisp')})`} />
          <path d="M74 250 Q66 258 70 268" stroke="#3c2f66" strokeWidth="2" fill="none" opacity="0.7" strokeLinecap="round" />
          <path d="M126 250 Q134 258 130 268" stroke="#3c2f66" strokeWidth="2" fill="none" opacity="0.7" strokeLinecap="round" />
          <circle cx="70" cy="266" r="1.6" fill="#c9baf0" style={{ filter: `url(#${id('glow')})` }} />
          <circle cx="130" cy="266" r="1.6" fill="#c9baf0" style={{ filter: `url(#${id('glow')})` }} />
        </g>

        {/* ---------- arms — taper past the elbow into wisps, no hands ---------- */}
        <g>
          <path d="M64 136 C52 156 60 176 44 198 C56 202 62 188 64 172 C68 156 68 146 68 136 Z" fill={`url(#${id('wisp')})`} />
          <path d="M46 196 Q36 202 42 212" stroke="#3c2f66" strokeWidth="1.8" fill="none" opacity="0.7" strokeLinecap="round" />
          <circle cx="42" cy="210" r="1.4" fill="#c9baf0" style={{ filter: `url(#${id('glow')})` }} />
        </g>
        <g>
          <path d="M136 136 C148 156 140 176 156 198 C144 202 138 188 136 172 C132 156 132 146 132 136 Z" fill={`url(#${id('wisp')})`} />
          <path d="M154 196 Q164 202 158 212" stroke="#3c2f66" strokeWidth="1.8" fill="none" opacity="0.7" strokeLinecap="round" />
          <circle cx="158" cy="210" r="1.4" fill="#c9baf0" style={{ filter: `url(#${id('glow')})` }} />
        </g>

        {/* ---------- torso — soft-edged, robed, no hard shoulder line ---------- */}
        <g>
          <path d="M70 138 Q100 126 130 138 Q138 156 132 186 Q100 202 68 186 Q62 156 70 138 Z" fill={`url(#${id('shade')})`} />

          {/* the void window — where a chest panel would be, straight through to the same starfield as the head */}
          <ellipse cx="100" cy="164" rx="19" ry="24" fill={`url(#${id('portal')})`} />
          <ellipse cx="100" cy="164" rx="19" ry="24" fill="none" stroke="#8a6ad9" strokeWidth="1.6" opacity="0.6" style={{ filter: `url(#${id('glow')})` }} />
          <circle cx="94" cy="154" r="1.3" fill="#ffffff" opacity="0.9" />
          <circle cx="106" cy="172" r="1" fill="#c9baf0" opacity="0.8" />
          <circle cx="98" cy="176" r="0.8" fill="#ffffff" opacity="0.7" />
          <circle cx="108" cy="152" r="0.9" fill="#c9baf0" opacity="0.7" />
        </g>

        {/* ---------- neck — a wisp, not a ring ---------- */}
        <path d="M86 108 Q100 116 114 108 L110 132 Q100 138 90 132 Z" fill={`url(#${id('wisp')})`} />

        {/* ---------- head — an orb of the same void, not a helmet ---------- */}
        <g>
          <circle cx="100" cy="72" r="36" fill={`url(#${id('orb')})`} />
          <circle cx="100" cy="72" r="36" fill="none" stroke="#8a6ad9" strokeWidth="1" opacity="0.35" />
          <ellipse cx="86" cy="56" rx="14" ry="8" fill="#ffffff" opacity="0.06" transform="rotate(-20 86 56)" />

          {/* the stars inside him */}
          <circle cx="90" cy="62" r="1.6" fill="#ffffff" opacity="0.9" />
          <circle cx="110" cy="58" r="1.1" fill="#c9baf0" opacity="0.8" />
          <circle cx="104" cy="80" r="1.4" fill="#ffffff" opacity="0.85" />
          <circle cx="84" cy="82" r="0.9" fill="#c9baf0" opacity="0.7" />
          <circle cx="116" cy="76" r="1" fill="#ffffff" opacity="0.7" />
          <circle cx="96" cy="90" r="0.8" fill="#c9baf0" opacity="0.6" />
          <circle cx="120" cy="66" r="0.7" fill="#ffffff" opacity="0.6" />
        </g>
      
    </>
  );
}

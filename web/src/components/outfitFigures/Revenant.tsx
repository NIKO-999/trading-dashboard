/* Ported from the "Revenant" outfit review page — approved before integration.
   Own body: a genuinely different figure, not a decoration layered onto
   Voyager's shared rig. Dispatched from Voyager.tsx by figureId. */

import { INK, Contact } from './ink';

export function Revenant({ uid }: { uid: string }) {
  const id = (n: string) => `${n}-${uid}`;
  return (
    <>

        <defs>
          <linearGradient id={id('suit')} x1="0.15" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#e0a06a" />
            <stop offset="42%" stopColor="#b5602f" />
            <stop offset="100%" stopColor="#5c2c14" />
          </linearGradient>
          <linearGradient id={id('shell')} x1="0.2" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor="#8a8f97" />
            <stop offset="55%" stopColor="#585d64" />
            <stop offset="100%" stopColor="#2a2c30" />
          </linearGradient>
          <linearGradient id={id('visorGlass')} x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#c9e2a0" stopOpacity="0.38" />
            <stop offset="55%" stopColor="#8fae5f" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3d4a28" stopOpacity="0.42" />
          </linearGradient>
          <clipPath id={id('visorClip')}>
            <path d="M62 72 L100 56 L138 72 L128 110 L100 124 L72 110 Z" />
          </clipPath>
          <radialGradient id={id('gloss')} cx="0.35" cy="0.28" r="0.55">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={id('cape')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1c1c1e" />
            <stop offset="100%" stopColor="#08080a" />
          </linearGradient>
          <linearGradient id={id('band')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e0483c" />
            <stop offset="100%" stopColor="#e0483c" stopOpacity="0.72" />
          </linearGradient>
          <radialGradient id={id('pool')} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#c9552b" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#c9552b" stopOpacity="0" />
          </radialGradient>
          <filter id={id('glow')} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* shared floor — see ./ink.tsx. cy is the measured sole line + 2,
            not a guess: the first pass eyeballed it and put this figure's
            shadow up to 12 units off the ground. */}
        <Contact cy={255} rx={44} />

        <ellipse cx="100" cy="280" rx="78" ry="12" fill={`url(#${id('pool')})`} />

        {/* ---------- dual rigid cape panels — straight, not draped, reaching near the feet ---------- */}
        <g>
          <path d="M64 96 L54 268 Q54 274 60 274 L80 274 Q84 274 84 268 L88 100 Z" fill={`url(#${id('cape')})`} stroke="#c9552b" strokeWidth="1.4" strokeOpacity="0.55" />
          <path d="M112 100 L116 268 Q116 274 120 274 L140 274 Q146 274 146 268 L136 96 Z" fill={`url(#${id('cape')})`} stroke="#c9552b" strokeWidth="1.4" strokeOpacity="0.55" />
          {/* edge stripes */}
          <rect x="61" y="100" width="3" height="168" fill="#c9552b" opacity="0.5" />
          <rect x="136" y="100" width="3" height="168" fill="#c9552b" opacity="0.5" />
        </g>

        {/* ---------- backpack ---------- */}
        <g>
          <rect x="34" y="100" width="132" height="96" rx="24" fill="#3a2c22" stroke={INK} strokeWidth="3" />
          <rect x="40" y="106" width="120" height="84" rx="20" fill="#4a3728" />
          <rect x="37" y="122" width="9" height="62" rx="4.5" fill="#1c140f" opacity="0.85" />
          <rect x="154" y="122" width="9" height="62" rx="4.5" fill="#1c140f" opacity="0.85" />
        </g>

        {/* ---------- legs, with hydraulic tube trim ---------- */}
        <g>
          <path d="M74 194 h24 v42 a12 12 0 0 1 -24 0 Z" fill={`url(#${id('suit')})`} />
          <path d="M102 194 h24 v42 a12 12 0 0 1 -24 0 Z" fill={`url(#${id('suit')})`} />
          <path d="M70 200 q-6 20 2 40" stroke="#2a2c30" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
          <path d="M130 200 q6 20 -2 40" stroke="#2a2c30" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
          <circle cx="70" cy="200" r="2.4" fill="#c9552b" style={{ filter: `url(#${id('glow')})` }} />
          <circle cx="130" cy="200" r="2.4" fill="#c9552b" style={{ filter: `url(#${id('glow')})` }} />
          <rect x="74" y="226" width="24" height="7" fill={`url(#${id('band')})`} style={{ filter: `url(#${id('glow')})` }} />
          <rect x="102" y="226" width="24" height="7" fill={`url(#${id('band')})`} style={{ filter: `url(#${id('glow')})` }} />
          <path d="M68 234 h32 v14 a5 5 0 0 1 -5 5 H73 a5 5 0 0 1 -5 -5 Z" fill="#2a2c30" />
          <path d="M100 234 h32 v14 a5 5 0 0 1 -5 5 h-22 a5 5 0 0 1 -5 -5 Z" fill="#2a2c30" />
          <rect x="68" y="248" width="32" height="5" rx="2.5" fill="#c9552b" style={{ filter: `url(#${id('glow')})` }} />
          <rect x="100" y="248" width="32" height="5" rx="2.5" fill="#c9552b" style={{ filter: `url(#${id('glow')})` }} />
        </g>

        {/* ---------- arms ---------- */}
        <g>
          <path d="M46 142 h23 v58 a11.5 11.5 0 0 1 -23 0 Z" fill={`url(#${id('suit')})`} />
          <rect x="46" y="158" width="23" height="8" fill={`url(#${id('band')})`} style={{ filter: `url(#${id('glow')})` }} />
        </g>
        <g>
          <path d="M131 142 h23 v58 a11.5 11.5 0 0 1 -23 0 Z" fill={`url(#${id('suit')})`} />
          <rect x="131" y="158" width="23" height="8" fill={`url(#${id('band')})`} style={{ filter: `url(#${id('glow')})` }} />
        </g>

        {/* ---------- torso ---------- */}
        <g>
          <path d="M62 146 q0 -14 14 -14 h48 q14 0 14 14 v44 q0 12 -14 12 H76 q-14 0 -14 -12 Z" fill={`url(#${id('suit')})`} />
          {/* rectangular scanner box, the one motif every reference shares */}
          <g transform="translate(104,148)">
            <rect width="30" height="26" rx="5" fill="#2a2c30" />
            <rect x="2.5" y="2.5" width="25" height="7" rx="2" fill="#1a1c1f" />
            <circle cx="8" cy="15" r="3.6" fill="#8fae5f" style={{ filter: `url(#${id('glow')})` }} />
            <circle cx="22" cy="15" r="3.6" fill="#c9552b" style={{ filter: `url(#${id('glow')})` }} />
            <circle cx="8" cy="23" r="3.6" fill="#5c5f66" />
            <circle cx="22" cy="23" r="3.6" fill="#5c5f66" />
          </g>
        </g>

        {/* ---------- both pauldrons — bulkier than any existing outfit ---------- */}
        <g>
          <g transform="translate(57,138)">
            <ellipse rx="19" ry="16" fill="#5c2c14" stroke={INK} strokeWidth="2.4" />
            <ellipse rx="13" ry="10" fill="#b5602f" opacity="0.85" />
            <rect x="-3.5" y="-2.5" width="7" height="5" rx="1.6" fill="#c9552b" style={{ filter: `url(#${id('glow')})` }} />
          </g>
          <g transform="translate(143,138)">
            <ellipse rx="19" ry="16" fill="#5c2c14" stroke={INK} strokeWidth="2.4" />
            <ellipse rx="13" ry="10" fill="#b5602f" opacity="0.85" />
            <rect x="-3.5" y="-2.5" width="7" height="5" rx="1.6" fill="#c9552b" style={{ filter: `url(#${id('glow')})` }} />
          </g>
        </g>

        <rect x="82" y="126" width="36" height="12" rx="6" fill="#2a2c30" />

        {/* ---------- helmet — angular facets, NOT the round dome every other outfit shares ---------- */}
        <g>
          <g transform="translate(44,86)">
            <path d="M0 -16 L13 -8 L13 8 L0 16 L-13 8 L-13 -8 Z" fill="#585d64" />
          </g>

          <path d="M100 12 L146 30 L160 84 L142 128 L100 142 L58 128 L40 84 L54 30 Z" fill={`url(#${id('shell')})`} />
          <path d="M100 12 L146 30 L142 60 L100 44 L58 60 L54 30 Z" fill="#6d7280" opacity="0.5" />

          {/* skull, seated behind the visor glass — hard-clipped to the hexagon so no
               feature can ever poke past the visor edge, whatever its size does. Sized to
               fill the opening rather than float inside it; the clip does the trimming, not
               a smaller skull. */}
          <g opacity="0.9" clipPath="url(#visorClip)">
            <ellipse cx="100" cy="84" rx="30" ry="28" fill="#dcd6c6" />
            <path d="M74 100 Q100 122 126 100 L121 110 Q100 126 79 110 Z" fill="#dcd6c6" />
            <ellipse cx="88" cy="82" rx="8" ry="10" fill="#1a1c1f" />
            <ellipse cx="112" cy="82" rx="8" ry="10" fill="#1a1c1f" />
            <path d="M96 92 L104 92 L100 102 Z" fill="#1a1c1f" />
            <g fill="#1a1c1f">
              <rect x="80" y="106" width="6" height="9" />
              <rect x="88.5" y="107" width="6" height="10" />
              <rect x="97" y="107" width="6" height="10" />
              <rect x="105.5" y="107" width="6" height="10" />
              <rect x="114" y="106" width="6" height="9" />
            </g>
          </g>

          {/* visor glass, hexagonal, over the skull — tinted, not painted, so the skull
               reads through it rather than sitting flat behind a solid colour */}
          <path d="M62 72 L100 56 L138 72 L128 110 L100 124 L72 110 Z" fill={`url(#${id('visorGlass')})`} />
          <path d="M62 72 L100 56 L138 72 L128 110 L100 124 L72 110 Z" fill={`url(#${id('gloss')})`} />
          <path d="M62 72 L100 56 L138 72 L128 110 L100 124 L72 110 Z" fill="none" stroke="#2a2c30" strokeWidth="2.5" />
          <path d="M76 62 L94 55" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.25" />

          {/* single tall antenna whip */}
          <path d="M138 34 Q150 4 168 -14" stroke="#585d64" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <circle cx="168" cy="-14" r="3" fill="#c9552b" style={{ filter: `url(#${id('glow')})` }} />
        </g>
      
    </>
  );
}

/* Ported from the "Herald" outfit review page — approved before integration.
   Own body: a genuinely different figure, not a decoration layered onto
   Voyager's shared rig. Dispatched from Voyager.tsx by figureId. */

import { INK, INK_MAIN, INK_SUB, Contact } from './ink';

export function Herald({ uid }: { uid: string }) {
  const id = (n: string) => `${n}-${uid}`;
  return (
    <>

        <defs>
          <linearGradient id={id('suit')} x1="0.15" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#f7efdc" />
            <stop offset="42%" stopColor="#d9c9a3" />
            <stop offset="100%" stopColor="#9c8a63" />
          </linearGradient>
          <linearGradient id={id('shell')} x1="0.2" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor="#faf3e2" />
            <stop offset="55%" stopColor="#e3d3ac" />
            <stop offset="100%" stopColor="#af9a6d" />
          </linearGradient>
          <linearGradient id={id('slit')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8a6a1c" stopOpacity="0.2" />
            <stop offset="18%" stopColor="#f6d67a" />
            <stop offset="50%" stopColor="#fff3cf" />
            <stop offset="82%" stopColor="#f6d67a" />
            <stop offset="100%" stopColor="#8a6a1c" stopOpacity="0.2" />
          </linearGradient>
          <radialGradient id={id('gloss')} cx="0.32" cy="0.26" r="0.55">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={id('cape')} x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor="#faf3e2" />
            <stop offset="55%" stopColor="#e3d3ac" />
            <stop offset="100%" stopColor="#b8a06a" />
          </linearGradient>
          <linearGradient id={id('band')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8b84f" />
            <stop offset="100%" stopColor="#e8b84f" stopOpacity="0.72" />
          </linearGradient>
          <radialGradient id={id('pool')} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#e8b84f" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#e8b84f" stopOpacity="0" />
          </radialGradient>
          <filter id={id('glow')} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* contact under the emission — this figure's viewBox runs to 320, so
            its floor sits lower than the rest of the set */}
        <Contact cy={259} />
        <ellipse cx="100" cy="308" rx="52" ry="9" fill={`url(#${id('pool')})`} />

        {/* ---------- single flowing ribbon cape — trails past the feet, tapering, no rigid panel ---------- */}
        <g>
          <path d="M90 98 C74 130 96 155 80 188 C66 216 92 238 84 268 C79 286 90 300 87 306 L97 306 C102 298 91 288 99 268 C109 236 83 214 99 186 C113 158 91 132 105 100 Z"
                fill={`url(#${id('cape')})`} stroke={INK} strokeWidth={INK_SUB} />
          <path d="M92 130 C82 152 98 168 88 190" stroke="#b8a06a" strokeWidth="1" fill="none" opacity="0.5" />
          <path d="M96 200 C88 224 100 240 92 262" stroke="#b8a06a" strokeWidth="1" fill="none" opacity="0.5" />
        </g>

        {/* ---------- backpack ---------- */}
        <g>
          <rect x="34" y="100" width="132" height="96" rx="24" fill="#efe6cf" stroke={INK} strokeWidth={INK_MAIN} />
          <rect x="40" y="106" width="120" height="84" rx="20" fill="#f7efdc" />
          <rect x="37" y="122" width="9" height="62" rx="4.5" fill="#a3915f" opacity="0.7" />
          <rect x="154" y="122" width="9" height="62" rx="4.5" fill="#a3915f" opacity="0.7" />
        </g>

        {/* ---------- legs, heavy ribbed segmented armour — more plating than any existing leg ---------- */}
        <g>
          <path d="M74 194 h24 v42 a12 12 0 0 1 -24 0 Z" fill={`url(#${id('suit')})`} stroke={INK} strokeWidth={INK_MAIN} />
          <path d="M102 194 h24 v42 a12 12 0 0 1 -24 0 Z" fill={`url(#${id('suit')})`} stroke={INK} strokeWidth={INK_MAIN} />
          <g fill="#af9a6d" stroke="#7c6c48" strokeWidth="1">
            <rect x="71" y="206" width="30" height="9" rx="3" />
            <rect x="71" y="217" width="30" height="9" rx="3" />
            <rect x="71" y="228" width="30" height="9" rx="3" />
            <rect x="99" y="206" width="30" height="9" rx="3" />
            <rect x="99" y="217" width="30" height="9" rx="3" />
            <rect x="99" y="228" width="30" height="9" rx="3" />
          </g>
          <path d="M68 238 h32 v14 a5 5 0 0 1 -5 5 H73 a5 5 0 0 1 -5 -5 Z" fill="#9c8a63" stroke={INK} strokeWidth={INK_SUB} />
          <path d="M100 238 h32 v14 a5 5 0 0 1 -5 5 h-22 a5 5 0 0 1 -5 -5 Z" fill="#9c8a63" stroke={INK} strokeWidth={INK_SUB} />
          <rect x="68" y="252" width="32" height="5" rx="2.5" fill="#e8b84f" style={{ filter: `url(#${id('glow')})` }} />
          <rect x="100" y="252" width="32" height="5" rx="2.5" fill="#e8b84f" style={{ filter: `url(#${id('glow')})` }} />
        </g>

        {/* ---------- arms ---------- */}
        <g>
          <path d="M46 142 h23 v58 a11.5 11.5 0 0 1 -23 0 Z" fill={`url(#${id('suit')})`} stroke={INK} strokeWidth={INK_MAIN} />
          <rect x="46" y="158" width="23" height="8" fill={`url(#${id('band')})`} style={{ filter: `url(#${id('glow')})` }} />
        </g>
        <g>
          <path d="M131 142 h23 v58 a11.5 11.5 0 0 1 -23 0 Z" fill={`url(#${id('suit')})`} stroke={INK} strokeWidth={INK_MAIN} />
          <rect x="131" y="158" width="23" height="8" fill={`url(#${id('band')})`} style={{ filter: `url(#${id('glow')})` }} />
        </g>

        {/* ---------- torso ---------- */}
        <g>
          <path d="M62 146 q0 -14 14 -14 h48 q14 0 14 14 v44 q0 12 -14 12 H76 q-14 0 -14 -12 Z" fill={`url(#${id('suit')})`} stroke={INK} strokeWidth={INK_MAIN} />
          <g transform="translate(104,148)">
            <rect width="30" height="26" rx="5" fill="#e3d3ac" stroke={INK} strokeWidth={INK_SUB} />
            <rect x="2.5" y="2.5" width="25" height="7" rx="2" fill="#5c5140" />
            <circle cx="8" cy="15" r="3.6" fill="#e8b84f" style={{ filter: `url(#${id('glow')})` }} />
            <circle cx="22" cy="15" r="3.6" fill="#c9b98e" />
            <circle cx="8" cy="23" r="3.6" fill="#8a7a56" />
            <circle cx="22" cy="23" r="3.6" fill="#8a7a56" />
          </g>
        </g>

        <rect x="82" y="126" width="36" height="12" rx="6" fill="#af9a6d" stroke={INK} strokeWidth={INK_SUB} />

        {/* ---------- helmet — round again, but ridge-crested, with a horizontal visor slit ---------- */}
        <g>
          <ellipse cx="100" cy="76" rx="60" ry="62" fill={`url(#${id('shell')})`} stroke={INK} strokeWidth={INK_MAIN} />
          <path d="M100 14 Q108 76 100 138" stroke="#c9b98e" strokeWidth="6" fill="none" opacity="0.55" strokeLinecap="round" />
          <path d="M100 14 Q108 76 100 138" stroke="#faf3e2" strokeWidth="2.4" fill="none" opacity="0.8" strokeLinecap="round" />

          <g transform="translate(44,84)">
            <ellipse rx="14" ry="16" fill="#e3d3ac" stroke={INK} strokeWidth={INK_SUB} />
            <ellipse rx="9" ry="11" fill="#af9a6d" />
          </g>

          {/* horizontal visor slit — new to the wardrobe, neither round, hexagon, nor kite */}
          <rect x="58" y="68" width="84" height="18" rx="9" fill="#2a2620" />
          <rect x="61" y="73" width="78" height="8" rx="4" fill={`url(#${id('slit')})`} style={{ filter: `url(#${id('glow')})` }} />
          <rect x="58" y="68" width="84" height="18" rx="9" fill={`url(#${id('gloss')})`} />
          <rect x="58" y="68" width="84" height="18" rx="9" fill="none" stroke={INK} strokeWidth={INK_SUB} />

          <ellipse cx="70" cy="42" rx="16" ry="9" fill="#ffffff" opacity="0.3" transform="rotate(-22 70 42)" />
        </g>
      
    </>
  );
}

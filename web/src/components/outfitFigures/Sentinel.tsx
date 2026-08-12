/* Ported from the "Sentinel" outfit review page — approved before integration.
   Own body: a genuinely different figure, not a decoration layered onto
   Voyager's shared rig. Dispatched from Voyager.tsx by figureId.

   Finish pass: this figure had NO dark stroke anywhere — its darkest was
   #5c6474, a mid grey-blue — so a near-white suit sat on a near-black app
   background with nothing separating the two. Ink from ./ink.ts now carries
   the silhouette. See that file for why the weights are what they are. */

import { INK, INK_MAIN, INK_SUB, Contact } from './ink';

export function Sentinel({ uid }: { uid: string }) {
  const id = (n: string) => `${n}-${uid}`;
  return (
    <>

        <defs>
          <linearGradient id={id('suit')} x1="0.15" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#f2f5f9" />
            <stop offset="42%" stopColor="#c3ccd9" />
            <stop offset="100%" stopColor="#7c8698" />
          </linearGradient>
          <linearGradient id={id('shell')} x1="0.2" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor="#f6f8fb" />
            <stop offset="55%" stopColor="#d3d9e2" />
            <stop offset="100%" stopColor="#98a2b3" />
          </linearGradient>
          <linearGradient id={id('visorGold')} x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#f6d67a" />
            <stop offset="45%" stopColor="#d9a636" />
            <stop offset="100%" stopColor="#8a6a1c" />
          </linearGradient>
          <radialGradient id={id('gloss')} cx="0.32" cy="0.26" r="0.55">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={id('chrome')} x1="0.15" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#c7d0dc" />
            <stop offset="55%" stopColor="#7c8798" />
            <stop offset="80%" stopColor="#dde3ec" />
            <stop offset="100%" stopColor="#4c5464" />
          </linearGradient>
          <linearGradient id={id('cape')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eef1f6" />
            <stop offset="100%" stopColor="#a7b0bf" />
          </linearGradient>
          <linearGradient id={id('hood')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dbe0e8" />
            <stop offset="100%" stopColor="#9aa4b3" />
          </linearGradient>
          <linearGradient id={id('band')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d9a636" />
            <stop offset="100%" stopColor="#d9a636" stopOpacity="0.72" />
          </linearGradient>
          <radialGradient id={id('pool')} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#d9a636" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#d9a636" stopOpacity="0" />
          </radialGradient>
          <filter id={id('glow')} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <clipPath id={id('visorClipS')}>
            <path d="M66 68 L100 52 L134 68 L120 100 L100 110 L80 100 Z" />
          </clipPath>
        </defs>

        {/* contact first, emission over it — a glow pool alone reads as the
            figure hovering rather than standing on something */}
        <Contact cy={257} />
        <ellipse cx="100" cy="280" rx="78" ry="12" fill={`url(#${id('pool')})`} />

        {/* ---------- single rigid cape panel, wide, ribbed — not draped, not doubled ---------- */}
        <g>
          <path d="M76 98 L70 270 Q70 276 76 276 L124 276 Q130 276 124 270 L124 98 Z" fill={`url(#${id('cape')})`} stroke={INK} strokeWidth={INK_MAIN} />
          <g stroke="#8b96a8" strokeWidth="1.2" opacity="0.55">
            <path d="M84 104 L80 268" fill="none" />
            <path d="M92 100 L89 272" fill="none" />
            <path d="M100 99 L100 274" fill="none" />
            <path d="M108 100 L111 272" fill="none" />
            <path d="M116 104 L120 268" fill="none" />
          </g>
          <rect x="72" y="98" width="2.4" height="176" fill="#d9a636" opacity="0.55" />
          <rect x="125.6" y="98" width="2.4" height="176" fill="#d9a636" opacity="0.55" />
        </g>

        {/* ---------- backpack ---------- */}
        <g>
          <rect x="34" y="100" width="132" height="96" rx="24" fill="#e4e8ee" stroke={INK} strokeWidth={INK_MAIN} />
          <rect x="40" y="106" width="120" height="84" rx="20" fill="#eef1f6" />
          <rect x="37" y="122" width="9" height="62" rx="4.5" fill="#8f99a8" opacity="0.7" />
          <rect x="154" y="122" width="9" height="62" rx="4.5" fill="#8f99a8" opacity="0.7" />
        </g>

        {/* ---------- legs, with ribbed knee gauntlets ---------- */}
        <g>
          <path d="M74 194 h24 v42 a12 12 0 0 1 -24 0 Z" fill={`url(#${id('suit')})`} stroke={INK} strokeWidth={INK_MAIN} />
          <path d="M102 194 h24 v42 a12 12 0 0 1 -24 0 Z" fill={`url(#${id('suit')})`} stroke={INK} strokeWidth={INK_MAIN} />
          <g fill="#7c8698" opacity="0.85">
            <rect x="73" y="212" width="26" height="4" rx="2" />
            <rect x="73" y="219" width="26" height="4" rx="2" />
            <rect x="101" y="212" width="26" height="4" rx="2" />
            <rect x="101" y="219" width="26" height="4" rx="2" />
          </g>
          <rect x="74" y="228" width="24" height="7" fill={`url(#${id('band')})`} style={{ filter: `url(#${id('glow')})` }} />
          <rect x="102" y="228" width="24" height="7" fill={`url(#${id('band')})`} style={{ filter: `url(#${id('glow')})` }} />
          <path d="M68 236 h32 v14 a5 5 0 0 1 -5 5 H73 a5 5 0 0 1 -5 -5 Z" fill="#7c8698" stroke={INK} strokeWidth={INK_SUB} />
          <path d="M100 236 h32 v14 a5 5 0 0 1 -5 5 h-22 a5 5 0 0 1 -5 -5 Z" fill="#7c8698" stroke={INK} strokeWidth={INK_SUB} />
          <rect x="68" y="250" width="32" height="5" rx="2.5" fill="#d9a636" style={{ filter: `url(#${id('glow')})` }} />
          <rect x="100" y="250" width="32" height="5" rx="2.5" fill="#d9a636" style={{ filter: `url(#${id('glow')})` }} />
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
            <rect width="30" height="26" rx="5" fill="#c3ccd9" stroke={INK} strokeWidth={INK_SUB} />
            <rect x="2.5" y="2.5" width="25" height="7" rx="2" fill="#4a525f" />
            <circle cx="8" cy="15" r="3.6" fill="#d9a636" style={{ filter: `url(#${id('glow')})` }} />
            <circle cx="22" cy="15" r="3.6" fill="#8fa0c9" />
            <circle cx="8" cy="23" r="3.6" fill="#6b7382" />
            <circle cx="22" cy="23" r="3.6" fill="#6b7382" />
          </g>
        </g>

        {/* ---------- fabric cowl, wrapped at the throat — new to this wardrobe ---------- */}
        <g>
          <path d="M74 128 Q100 146 126 128 L128 138 Q100 158 72 138 Z" fill={`url(#${id('hood')})`} stroke={INK} strokeWidth={INK_SUB} />
          <path d="M78 130 Q100 140 122 130" stroke="#7c8698" strokeWidth="1.2" fill="none" opacity="0.6" />
        </g>

        {/* ---------- one polished chrome pauldron, right shoulder only — no match on the left ---------- */}
        <g transform="translate(147,134)">
          <circle r="21" fill={`url(#${id('chrome')})`} stroke={INK} strokeWidth={INK_MAIN} />
          <path d="M-13 -13 A18 18 0 0 1 8 -16" stroke="#ffffff" strokeWidth="2.4" fill="none" opacity="0.7" strokeLinecap="round" />
          <rect x="-4" y="-2.5" width="8" height="5" rx="1.8" fill="#d9a636" style={{ filter: `url(#${id('glow')})` }} />
        </g>

        <rect x="82" y="126" width="36" height="12" rx="6" fill="#98a2b3" stroke={INK} strokeWidth={INK_SUB} />

        {/* ---------- helmet — tapered, forward-swept jaw, not the round dome ---------- */}
        <g>
          <path d="M100 14 L138 26 L152 66 Q152 100 128 126 L108 140 L92 140 L68 122 Q50 96 50 64 L64 26 Z" fill={`url(#${id('shell')})`} stroke={INK} strokeWidth={INK_MAIN} />
          <path d="M100 14 L138 26 L134 52 L100 40 L66 52 L64 26 Z" fill="#ffffff" opacity="0.4" />

          {/* visor, a narrow mirrored-gold kite — reflective, not glass — sealed with a hard clip */}
          <g clipPath={`url(#${id('visorClipS')})`}>
            <path d="M66 68 L100 52 L134 68 L120 100 L100 110 L80 100 Z" fill={`url(#${id('visorGold')})`} />
            <path d="M66 68 L100 52 L134 68 L120 100 L100 110 L80 100 Z" fill={`url(#${id('gloss')})`} />
            <path d="M74 66 L96 55" stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" opacity="0.55" />
          </g>
          <path d="M66 68 L100 52 L134 68 L120 100 L100 110 L80 100 Z" fill="none" stroke={INK} strokeWidth={INK_SUB} />

          {/* single tall antenna whip, curved, not paired */}
          <path d="M128 30 Q148 -6 138 -34" stroke="#98a2b3" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <circle cx="138" cy="-34" r="3" fill="#d9a636" style={{ filter: `url(#${id('glow')})` }} />
        </g>
      
    </>
  );
}

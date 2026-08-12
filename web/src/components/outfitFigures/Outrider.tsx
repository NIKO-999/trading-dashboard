/* Ported from the "Outrider" outfit review page — approved before integration.
   Own body: a genuinely different figure, not a decoration layered onto
   Voyager's shared rig. Dispatched from Voyager.tsx by figureId. */

import { INK, Contact } from './ink';

export function Outrider({ uid }: { uid: string }) {
  const id = (n: string) => `${n}-${uid}`;
  return (
    <>

        <defs>
          <linearGradient id={id('suit')} x1="0.15" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#9a9c85" />
            <stop offset="42%" stopColor="#767a5f" />
            <stop offset="100%" stopColor="#484c38" />
          </linearGradient>
          <linearGradient id={id('shell')} x1="0.2" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor="#8d9078" />
            <stop offset="55%" stopColor="#666a52" />
            <stop offset="100%" stopColor="#383b2c" />
          </linearGradient>
          <radialGradient id={id('lens')} cx="0.4" cy="0.35" r="0.6">
            <stop offset="0%" stopColor="#ffd9b0" />
            <stop offset="45%" stopColor="#d9603a" />
            <stop offset="100%" stopColor="#7a2f16" />
          </radialGradient>
          <radialGradient id={id('gloss')} cx="0.32" cy="0.26" r="0.55">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={id('banner')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c7bd9c" />
            <stop offset="100%" stopColor="#8a8268" />
          </linearGradient>
          <linearGradient id={id('band')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d9603a" />
            <stop offset="100%" stopColor="#d9603a" stopOpacity="0.72" />
          </linearGradient>
          <radialGradient id={id('pool')} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#d9603a" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#d9603a" stopOpacity="0" />
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

        <ellipse cx="100" cy="278" rx="70" ry="11" fill={`url(#${id('pool')})`} />

        {/* ---------- tattered banner cape — five ragged strips, uneven lengths, torn hems ---------- */}
        <g opacity="0.94">
          <path d="M70 98 L64 200 L74 214 L70 236 L80 198 L78 98 Z" fill={`url(#${id('banner')})`} stroke="#5c5744" strokeWidth="1" strokeOpacity="0.5" />
          <path d="M84 100 L80 224 L90 240 L86 262 L96 220 L92 100 Z" fill={`url(#${id('banner')})`} stroke="#5c5744" strokeWidth="1" strokeOpacity="0.5" />
          <path d="M100 100 L98 246 L108 258 L104 270 L112 244 L108 100 Z" fill={`url(#${id('banner')})`} stroke="#5c5744" strokeWidth="1" strokeOpacity="0.5" opacity="0.92" />
          <path d="M116 100 L120 220 L110 236 L116 256 L126 218 L124 100 Z" fill={`url(#${id('banner')})`} stroke="#5c5744" strokeWidth="1" strokeOpacity="0.5" />
          <path d="M130 98 L136 196 L126 210 L132 232 L140 194 L138 98 Z" fill={`url(#${id('banner')})`} stroke="#5c5744" strokeWidth="1" strokeOpacity="0.5" />
        </g>

        {/* ---------- backpack ---------- */}
        <g>
          <rect x="34" y="100" width="132" height="96" rx="24" fill="#585c46" stroke="#2c2e22" strokeWidth="3" />
          <rect x="40" y="106" width="120" height="84" rx="20" fill="#666a52" />
          <rect x="37" y="122" width="9" height="62" rx="4.5" fill="#2c2e22" opacity="0.85" />
          <rect x="154" y="122" width="9" height="62" rx="4.5" fill="#2c2e22" opacity="0.85" />
          {/* strapped canister, a scavenger detail */}
          <rect x="20" y="150" width="14" height="34" rx="6" fill="#484c38" stroke="#2c2e22" strokeWidth="2" />
          <rect x="23" y="155" width="8" height="4" rx="2" fill="#d9603a" opacity="0.8" />
        </g>

        {/* ---------- legs ---------- */}
        <g>
          <path d="M74 194 h24 v42 a12 12 0 0 1 -24 0 Z" fill={`url(#${id('suit')})`} />
          <path d="M102 194 h24 v42 a12 12 0 0 1 -24 0 Z" fill={`url(#${id('suit')})`} />
          <rect x="74" y="226" width="24" height="7" fill={`url(#${id('band')})`} style={{ filter: `url(#${id('glow')})` }} />
          <rect x="102" y="226" width="24" height="7" fill={`url(#${id('band')})`} style={{ filter: `url(#${id('glow')})` }} />
          <path d="M68 234 h32 v14 a5 5 0 0 1 -5 5 H73 a5 5 0 0 1 -5 -5 Z" fill="#484c38" />
          <path d="M100 234 h32 v14 a5 5 0 0 1 -5 5 h-22 a5 5 0 0 1 -5 -5 Z" fill="#484c38" />
          <rect x="68" y="248" width="32" height="5" rx="2.5" fill="#d9603a" style={{ filter: `url(#${id('glow')})` }} />
          <rect x="100" y="248" width="32" height="5" rx="2.5" fill="#d9603a" style={{ filter: `url(#${id('glow')})` }} />
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
          <g transform="translate(104,148)">
            <rect width="30" height="26" rx="5" fill="#666a52" />
            <rect x="2.5" y="2.5" width="25" height="7" rx="2" fill="#2c2e22" />
            <circle cx="8" cy="15" r="3.6" fill="#d9603a" style={{ filter: `url(#${id('glow')})` }} />
            <circle cx="22" cy="15" r="3.6" fill="#8d9078" />
            <circle cx="8" cy="23" r="3.6" fill="#484c38" />
            <circle cx="22" cy="23" r="3.6" fill="#484c38" />
          </g>
        </g>

        {/* ---------- segmented gorget — a hard collar instead of shoulder armour ---------- */}
        <g>
          <rect x="74" y="130" width="52" height="7" rx="3.5" fill="#666a52" stroke="#2c2e22" strokeWidth="1.4" />
          <rect x="78" y="122" width="44" height="7" rx="3.5" fill="#767a5f" stroke="#2c2e22" strokeWidth="1.4" />
          <rect x="82" y="114" width="36" height="7" rx="3.5" fill="#8d9078" stroke="#2c2e22" strokeWidth="1.4" />
        </g>

        {/* ---------- helmet — flat, wide, industrial hood; no dome, no wedge, no hexagon ---------- */}
        <g>
          <path d="M40 76 Q38 26 100 22 Q162 26 160 76 L154 104 Q100 120 46 104 Z" fill={`url(#${id('shell')})`} />
          <path d="M42 62 Q100 40 158 62" stroke="#8d9078" strokeWidth="4" fill="none" opacity="0.6" strokeLinecap="round" />

          <g transform="translate(40,88)">
            <rect x="-10" y="-14" width="20" height="28" rx="6" fill="#666a52" />
            <rect x="-6" y="-8" width="12" height="16" rx="4" fill="#383b2c" />
          </g>

          {/* brim / visor-shade ridge */}
          <path d="M56 58 Q100 46 144 58 L142 66 Q100 55 58 66 Z" fill="#383b2c" opacity="0.85" />

          {/* single glowing lens — an aperture, not a visor opening */}
          <circle cx="100" cy="80" r="24" fill="#242620" stroke={INK} strokeWidth="2" />
          <circle cx="100" cy="80" r="17" fill="#383b2c" />
          <circle cx="100" cy="80" r="17" fill="none" stroke="#8d9078" strokeWidth="1.2" opacity="0.5" />
          <g stroke={INK} strokeWidth="1.6" opacity="0.6">
            <path d="M100 63 L100 71" />
            <path d="M117 80 L109 80" />
            <path d="M100 97 L100 89" />
            <path d="M83 80 L91 80" />
          </g>
          <circle cx="100" cy="80" r="10" fill={`url(#${id('lens')})`} style={{ filter: `url(#${id('glow')})` }} />
          <circle cx="96" cy="76" r="3" fill="#ffffff" opacity="0.6" />

          <path d="M52 44 Q70 30 100 26" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.22" strokeLinecap="round" />
        </g>
      
    </>
  );
}

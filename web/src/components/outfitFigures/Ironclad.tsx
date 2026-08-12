/* Ported from the "Ironclad" outfit review page — approved before integration.
   Own body: a genuinely different figure, not a decoration layered onto
   Voyager's shared rig. Dispatched from Voyager.tsx by figureId. */

import { INK, Contact } from './ink';

export function Ironclad({ uid }: { uid: string }) {
  const id = (n: string) => `${n}-${uid}`;
  return (
    <>

        <defs>
          <linearGradient id={id('plateA')} x1="0.15" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#585c62" />
            <stop offset="45%" stopColor="#34383e" />
            <stop offset="100%" stopColor="#15171a" />
          </linearGradient>
          <linearGradient id={id('plateB')} x1="0.15" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#484c52" />
            <stop offset="45%" stopColor="#26292e" />
            <stop offset="100%" stopColor="#0e1012" />
          </linearGradient>
          <linearGradient id={id('molten')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff7a3a" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#ffb35a" />
            <stop offset="100%" stopColor="#ff7a3a" stopOpacity="0.15" />
          </linearGradient>
          <radialGradient id={id('visor')} cx="0.5" cy="0.5" r="0.6">
            <stop offset="0%" stopColor="#ffd9a0" />
            <stop offset="55%" stopColor="#ff7a3a" />
            <stop offset="100%" stopColor="#8a2e0a" />
          </radialGradient>
          <radialGradient id={id('aura')} cx="0.5" cy="0.46" r="0.62">
            <stop offset="0%" stopColor="#ff7a3a" stopOpacity="0.22" />
            <stop offset="55%" stopColor="#ff7a3a" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ff7a3a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={id('pool')} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#ff7a3a" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#ff7a3a" stopOpacity="0" />
          </radialGradient>
          <filter id={id('glow')} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.6" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id={id('auraBlur')} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>

        {/* shared floor — see ./ink.tsx. cy is the measured sole line + 2,
            not a guess: the first pass eyeballed it and put this figure's
            shadow up to 12 units off the ground. */}
        <Contact cy={270} rx={52} />

        {/* ---------- the aura — a heat-shimmer field around the whole frame, not a rim light on one edge ---------- */}
        <circle cx="110" cy="150" r="118" fill={`url(#${id('aura')})`} style={{ filter: `url(#${id('auraBlur')})` }} />

        <ellipse cx="110" cy="266" rx="70" ry="10" fill={`url(#${id('pool')})`} />

        {/* ---------- legs — short, thick, heavy-treaded, wide stance ---------- */}
        <g>
          <path d="M74 214 h28 v34 a8 8 0 0 1 -8 8 h-12 a8 8 0 0 1 -8 -8 Z" fill={`url(#${id('plateA')})`} stroke={INK} strokeWidth="2" />
          <path d="M118 214 h28 v34 a8 8 0 0 1 -8 8 h-12 a8 8 0 0 1 -8 -8 Z" fill={`url(#${id('plateA')})`} stroke={INK} strokeWidth="2" />
          <rect x="74" y="230" width="28" height="6" fill={`url(#${id('molten')})`} style={{ filter: `url(#${id('glow')})` }} />
          <rect x="118" y="230" width="28" height="6" fill={`url(#${id('molten')})`} style={{ filter: `url(#${id('glow')})` }} />
          <path d="M68 246 h40 v16 a6 6 0 0 1 -6 6 H74 a6 6 0 0 1 -6 -6 Z" fill="#15171a" stroke={INK} strokeWidth="2" />
          <path d="M112 246 h40 v16 a6 6 0 0 1 -6 6 h-28 a6 6 0 0 1 -6 -6 Z" fill="#15171a" stroke={INK} strokeWidth="2" />
          <g stroke="#484c52" strokeWidth="2" opacity="0.7">
            <path d="M72 254 h40" /><path d="M116 254 h40" />
          </g>
        </g>

        {/* ---------- arms — thick, layered, oversized gauntlets ---------- */}
        <g>
          <path d="M18 156 h38 v52 a13 13 0 0 1 -13 13 h-12 a13 13 0 0 1 -13 -13 Z" fill={`url(#${id('plateB')})`} stroke={INK} strokeWidth="2.4" />
          <rect x="18" y="176" width="38" height="8" fill={`url(#${id('molten')})`} style={{ filter: `url(#${id('glow')})` }} />
          <rect x="18" y="196" width="38" height="8" fill={`url(#${id('molten')})`} style={{ filter: `url(#${id('glow')})` }} opacity="0.7" />
          <path d="M14 200 h20 v16 a6 6 0 0 1 -6 6 h-8 a6 6 0 0 1 -6 -6 Z" fill="#15171a" />
        </g>
        <g>
          <path d="M164 156 h38 v52 a13 13 0 0 1 -13 13 h-12 a13 13 0 0 1 -13 -13 Z" fill={`url(#${id('plateB')})`} stroke={INK} strokeWidth="2.4" />
          <rect x="164" y="176" width="38" height="8" fill={`url(#${id('molten')})`} style={{ filter: `url(#${id('glow')})` }} />
          <rect x="164" y="196" width="38" height="8" fill={`url(#${id('molten')})`} style={{ filter: `url(#${id('glow')})` }} opacity="0.7" />
          <path d="M186 200 h20 v16 a6 6 0 0 1 -6 6 h-8 a6 6 0 0 1 -6 -6 Z" fill="#15171a" />
        </g>

        {/* ---------- torso — wider than tall, dominates the frame ---------- */}
        <g>
          <path d="M52 118 Q52 108 62 108 h96 q10 0 10 10 v78 q0 14 -14 14 H66 q-14 0 -14 -14 Z" fill={`url(#${id('plateA')})`} stroke={INK} strokeWidth="2.4" />
          <rect x="52" y="140" width="116" height="6" fill={`url(#${id('molten')})`} style={{ filter: `url(#${id('glow')})` }} />
          <rect x="52" y="166" width="116" height="6" fill={`url(#${id('molten')})`} style={{ filter: `url(#${id('glow')})` }} opacity="0.75" />
          <rect x="52" y="190" width="116" height="6" fill={`url(#${id('molten')})`} style={{ filter: `url(#${id('glow')})` }} opacity="0.5" />
          <g transform="translate(92,150)">
            <rect width="36" height="30" rx="5" fill="#26292e" stroke={INK} strokeWidth="2" />
            <rect x="3" y="3" width="30" height="8" rx="2" fill="#15171a" />
            <circle cx="9" cy="20" r="4" fill="#ff7a3a" style={{ filter: `url(#${id('glow')})` }} />
            <circle cx="27" cy="20" r="4" fill="#585c62" />
          </g>
          <circle cx="64" cy="120" r="2.4" fill="#0a0b0c" />
          <circle cx="156" cy="120" r="2.4" fill="#0a0b0c" />
          <circle cx="64" cy="196" r="2.4" fill="#0a0b0c" />
          <circle cx="156" cy="196" r="2.4" fill="#0a0b0c" />
        </g>

        {/* ---------- shoulder pauldrons — each nearly as wide as the torso itself ---------- */}
        <g>
          <path d="M10 118 Q10 100 34 96 Q58 100 58 122 L58 158 Q34 168 10 158 Z" fill={`url(#${id('plateB')})`} stroke={INK} strokeWidth="2.4" />
          <rect x="18" y="126" width="32" height="6" fill={`url(#${id('molten')})`} style={{ filter: `url(#${id('glow')})` }} />
          {/* exhaust vent, embers rising */}
          <rect x="22" y="98" width="12" height="14" rx="3" fill="#15171a" />
          <circle cx="26" cy="90" r="1.6" fill="#ffb35a" style={{ filter: `url(#${id('glow')})` }} />
          <circle cx="30" cy="80" r="1.2" fill="#ff9a4a" style={{ filter: `url(#${id('glow')})` }} />
        </g>
        <g>
          <path d="M210 118 Q210 100 186 96 Q162 100 162 122 L162 158 Q186 168 210 158 Z" fill={`url(#${id('plateB')})`} stroke={INK} strokeWidth="2.4" />
          <rect x="170" y="126" width="32" height="6" fill={`url(#${id('molten')})`} style={{ filter: `url(#${id('glow')})` }} />
          <rect x="186" y="98" width="12" height="14" rx="3" fill="#15171a" />
          <circle cx="194" cy="90" r="1.6" fill="#ffb35a" style={{ filter: `url(#${id('glow')})` }} />
          <circle cx="190" cy="80" r="1.2" fill="#ff9a4a" style={{ filter: `url(#${id('glow')})` }} />
        </g>

        {/* ---------- head — deliberately small, sunk between the pauldrons, the inverse of every other build's oversized helmet ---------- */}
        <g>
          <rect x="94" y="98" width="32" height="14" rx="5" fill="#26292e" />
          <circle cx="110" cy="82" r="24" fill={`url(#${id('plateA')})`} stroke={INK} strokeWidth="2.4" />
          <path d="M90 70 Q110 62 130 70" stroke="#585c62" strokeWidth="3" fill="none" opacity="0.7" strokeLinecap="round" />
          <rect x="92" y="78" width="36" height="9" rx="4.5" fill="#15171a" stroke={INK} strokeWidth="1.6" />
          <rect x="96" y="80.5" width="28" height="4" rx="2" fill={`url(#${id('visor')})`} style={{ filter: `url(#${id('glow')})` }} />
          <circle cx="102" cy="66" r="6" fill="#ffffff" opacity="0.12" />
        </g>
      
    </>
  );
}

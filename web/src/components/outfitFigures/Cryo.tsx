/* Ported from the "Cryo" outfit review page — approved before integration.
   Own body: a genuinely different figure, not a decoration layered onto
   Voyager's shared rig. Dispatched from Voyager.tsx by figureId. */

import { INK, INK_MAIN, INK_SUB, Contact } from './ink';

export function Cryo({ uid }: { uid: string }) {
  const id = (n: string) => `${n}-${uid}`;
  return (
    <>

        <defs>
          <linearGradient id={id('suit')} x1="0.15" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#f2f8fb" />
            <stop offset="42%" stopColor="#c3d8e2" />
            <stop offset="100%" stopColor="#7c98a8" />
          </linearGradient>
          <linearGradient id={id('cloak')} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#eef6fa" />
            <stop offset="55%" stopColor="#c7dbe5" />
            <stop offset="100%" stopColor="#93aebb" />
          </linearGradient>
          <linearGradient id={id('hood')} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#f4fafd" />
            <stop offset="55%" stopColor="#d2e4ec" />
            <stop offset="100%" stopColor="#a4bfcb" />
          </linearGradient>
          <linearGradient id={id('shell')} x1="0.2" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor="#fbfdff" />
            <stop offset="55%" stopColor="#dbe8ef" />
            <stop offset="100%" stopColor="#a9c1cd" />
          </linearGradient>
          <linearGradient id={id('visorIce')} x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#f2fbff" />
            <stop offset="45%" stopColor="#7ecbe8" />
            <stop offset="100%" stopColor="#2e6a8a" />
          </linearGradient>
          <radialGradient id={id('gloss')} cx="0.32" cy="0.26" r="0.55">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={id('ice')} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#2e6a8a" />
            <stop offset="45%" stopColor="#5ecbe8" />
            <stop offset="80%" stopColor="#bfeeff" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          <linearGradient id={id('band')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5ecbe8" />
            <stop offset="100%" stopColor="#5ecbe8" stopOpacity="0.72" />
          </linearGradient>
          <radialGradient id={id('pool')} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#5ecbe8" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#5ecbe8" stopOpacity="0" />
          </radialGradient>
          <filter id={id('glow')} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id={id('iceGlow')} x="-140%" y="-140%" width="380%" height="380%">
            <feGaussianBlur stdDeviation="3.4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* contact under the emission — a glow pool alone reads as hovering */}
        <Contact cy={255} />
        <ellipse cx="100" cy="270" rx="76" ry="12" fill={`url(#${id('pool')})`} />

        {/* ---------- the cloak — same garment as Pyro's, cleaner hem, no tearing ---------- */}
        <g>
          <path d="M62 118 Q100 108 138 118 L144 250 Q100 268 56 250 Z"
                fill={`url(#${id('cloak')})`} stroke={INK} strokeWidth={INK_MAIN} />
        </g>

        {/* ---------- backpack ---------- */}
        <g>
          <rect x="34" y="100" width="132" height="96" rx="24" fill="#e4edf2" stroke={INK} strokeWidth={INK_MAIN} />
          <rect x="40" y="106" width="120" height="84" rx="20" fill="#eef4f8" />
          <rect x="37" y="122" width="9" height="62" rx="4.5" fill="#8ba4b2" opacity="0.7" />
          <rect x="154" y="122" width="9" height="62" rx="4.5" fill="#8ba4b2" opacity="0.7" />
        </g>

        {/* ---------- legs ---------- */}
        <g>
          <path d="M74 194 h24 v42 a12 12 0 0 1 -24 0 Z" fill={`url(#${id('suit')})`} stroke={INK} strokeWidth={INK_MAIN} />
          <path d="M102 194 h24 v42 a12 12 0 0 1 -24 0 Z" fill={`url(#${id('suit')})`} stroke={INK} strokeWidth={INK_MAIN} />
          <rect x="74" y="226" width="24" height="7" fill={`url(#${id('band')})`} style={{ filter: `url(#${id('glow')})` }} />
          <rect x="102" y="226" width="24" height="7" fill={`url(#${id('band')})`} style={{ filter: `url(#${id('glow')})` }} />
          <path d="M68 234 h32 v14 a5 5 0 0 1 -5 5 H73 a5 5 0 0 1 -5 -5 Z" fill="#7c98a8" stroke={INK} strokeWidth={INK_SUB} />
          <path d="M100 234 h32 v14 a5 5 0 0 1 -5 5 h-22 a5 5 0 0 1 -5 -5 Z" fill="#7c98a8" stroke={INK} strokeWidth={INK_SUB} />
          <rect x="68" y="248" width="32" height="5" rx="2.5" fill="#5ecbe8" style={{ filter: `url(#${id('glow')})` }} />
          <rect x="100" y="248" width="32" height="5" rx="2.5" fill="#5ecbe8" style={{ filter: `url(#${id('glow')})` }} />
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

        {/* ---------- torso, clean ---------- */}
        <g>
          <path d="M62 146 q0 -14 14 -14 h48 q14 0 14 14 v44 q0 12 -14 12 H76 q-14 0 -14 -12 Z" fill={`url(#${id('suit')})`} stroke={INK} strokeWidth={INK_MAIN} />
          <g transform="translate(104,148)">
            <rect width="30" height="26" rx="5" fill="#eef4f8" stroke={INK} strokeWidth={INK_SUB} />
            <rect x="2.5" y="2.5" width="25" height="7" rx="2" fill="#3a4a52" />
            <circle cx="8" cy="15" r="3.6" fill="#5ecbe8" style={{ filter: `url(#${id('glow')})` }} />
            <circle cx="22" cy="15" r="3.6" fill="#c3d8e2" />
            <circle cx="8" cy="23" r="3.6" fill="#7c98a8" />
            <circle cx="22" cy="23" r="3.6" fill="#7c98a8" />
          </g>
        </g>

        {/* ---------- mantle — the same draped-over-the-body piece as Pyro, same construction ---------- */}
        <g>
          <path d="M44 122 Q100 106 156 122 L150 140 Q140 130 130 148 Q114 132 100 158 Q86 132 70 148 Q60 130 50 140 Z"
                fill={`url(#${id('hood')})`} stroke={INK} strokeWidth={INK_SUB} />
          <path d="M56 126 Q70 138 78 150" stroke="#7c98a8" strokeWidth="1.4" fill="none" opacity="0.4" />
          <path d="M144 126 Q130 138 122 150" stroke="#7c98a8" strokeWidth="1.4" fill="none" opacity="0.4" />
          <path d="M100 112 L100 152" stroke="#7c98a8" strokeWidth="1.2" fill="none" opacity="0.3" />
        </g>

        {/* ---------- the hood itself, collapsed around the neck rather than up over the head —
             its point drapes down behind the shoulder, not up over the crown ---------- */}
        <g>
          <path d="M62 116 Q100 126 138 116 Q142 130 122 140 Q100 132 78 140 Q58 130 62 116 Z" fill={`url(#${id('hood')})`} stroke={INK} strokeWidth={INK_SUB} />
          <path d="M118 120 Q130 148 116 172 Q108 150 108 122 Z" fill={`url(#${id('hood')})`} opacity="0.96" />
          <path d="M118 122 Q126 146 116 166" stroke="#7c98a8" strokeWidth="1.2" fill="none" opacity="0.4" />
        </g>

        <rect x="82" y="126" width="36" height="12" rx="6" fill="#a9c1cd" stroke={INK} strokeWidth={INK_SUB} />

        {/* ---------- helmet — visible for the first time in this pair, elegant tapered dome,
             clean glowing visor instead of a void ---------- */}
        <g>
          <path d="M100 16 Q150 24 152 74 Q154 108 130 128 L100 138 L70 128 Q46 108 48 74 Q50 24 100 16 Z" fill={`url(#${id('shell')})`} stroke={INK} strokeWidth={INK_MAIN} />
          <path d="M100 16 Q150 24 148 56 Q100 40 52 56 Q50 24 100 16 Z" fill="#ffffff" opacity="0.45" />

          <g transform="translate(46,84)">
            <ellipse rx="13" ry="15" fill="#dbe8ef" stroke={INK} strokeWidth={INK_SUB} />
            <ellipse rx="8.5" ry="10" fill="#a9c1cd" />
          </g>

          <path d="M70 60 Q100 50 130 60 Q128 90 100 98 Q72 90 70 60 Z" fill={`url(#${id('visorIce')})`} />
          <path d="M70 60 Q100 50 130 60 Q128 90 100 98 Q72 90 70 60 Z" fill={`url(#${id('gloss')})`} />
          <path d="M70 60 Q100 50 130 60 Q128 90 100 98 Q72 90 70 60 Z" fill="none" stroke={INK} strokeWidth={INK_SUB} />
          <path d="M78 58 L96 51" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.6" />

          <ellipse cx="76" cy="34" rx="16" ry="9" fill="#ffffff" opacity="0.4" transform="rotate(-24 76 34)" />
        </g>

        {/* ---------- the crown of ice — angular crystalline shards, cold instead of warm,
             the same "energy from the head" beat as Pyro but built from straight edges ---------- */}
        <g style={{ filter: `url(#${id('iceGlow')})` }}>
          <path d="M52 18 L58 -6 L64 18 Z" fill={`url(#${id('ice')})`} stroke="#2e6a8a" strokeWidth="0.6" />
          <path d="M72 10 L80 -26 L88 10 Z" fill={`url(#${id('ice')})`} stroke="#2e6a8a" strokeWidth="0.6" />
          <path d="M92 6 L100 -42 L108 6 Z" fill={`url(#${id('ice')})`} stroke="#2e6a8a" strokeWidth="0.6" />
          <path d="M112 10 L120 -26 L128 10 Z" fill={`url(#${id('ice')})`} stroke="#2e6a8a" strokeWidth="0.6" />
          <path d="M136 18 L142 -6 L148 18 Z" fill={`url(#${id('ice')})`} stroke="#2e6a8a" strokeWidth="0.6" />
          <path d="M92 6 L100 -42 L100 6 Z" fill="#ffffff" opacity="0.35" />
        </g>
        <g opacity="0.85">
          <circle cx="66" cy="-4" r="1.8" fill="#bfeeff" style={{ filter: `url(#${id('glow')})` }} />
          <circle cx="130" cy="-10" r="1.5" fill="#bfeeff" style={{ filter: `url(#${id('glow')})` }} />
          <circle cx="100" cy="-26" r="2.2" fill="#ffffff" style={{ filter: `url(#${id('glow')})` }} />
          <circle cx="112" cy="0" r="1.3" fill="#5ecbe8" style={{ filter: `url(#${id('glow')})` }} />
        </g>
      
    </>
  );
}

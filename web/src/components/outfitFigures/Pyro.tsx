/* Ported from the "Pyro" outfit review page — approved before integration.
   Own body: a genuinely different figure, not a decoration layered onto
   Voyager's shared rig. Dispatched from Voyager.tsx by figureId. */

import { INK, Contact } from './ink';

export function Pyro({ uid }: { uid: string }) {
  const id = (n: string) => `${n}-${uid}`;
  return (
    <>

        <defs>
          <linearGradient id={id('suit')} x1="0.15" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#6e5847" />
            <stop offset="42%" stopColor="#463526" />
            <stop offset="100%" stopColor="#221913" />
          </linearGradient>
          <linearGradient id={id('cloak')} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#2a2224" />
            <stop offset="55%" stopColor="#181315" />
            <stop offset="100%" stopColor="#0a0808" />
          </linearGradient>
          <linearGradient id={id('hood')} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#332a2b" />
            <stop offset="55%" stopColor="#1e1717" />
            <stop offset="100%" stopColor="#0c0909" />
          </linearGradient>
          <radialGradient id={id('void')} cx="0.5" cy="0.35" r="0.7">
            <stop offset="0%" stopColor="#241a17" />
            <stop offset="70%" stopColor="#0e0908" />
            <stop offset="100%" stopColor="#050303" />
          </radialGradient>
          <radialGradient id={id('ember')} cx="0.4" cy="0.35" r="0.6">
            <stop offset="0%" stopColor="#ffd9a0" />
            <stop offset="50%" stopColor="#e8641f" />
            <stop offset="100%" stopColor="#7a2a0a" />
          </radialGradient>
          <linearGradient id={id('fire')} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#7a1a0a" />
            <stop offset="45%" stopColor="#e8641f" />
            <stop offset="80%" stopColor="#ffb03a" />
            <stop offset="100%" stopColor="#fff3c9" />
          </linearGradient>
          <linearGradient id={id('band')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8641f" />
            <stop offset="100%" stopColor="#e8641f" stopOpacity="0.72" />
          </linearGradient>
          <radialGradient id={id('pool')} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#e8641f" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#e8641f" stopOpacity="0" />
          </radialGradient>
          <filter id={id('glow')} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id={id('flameGlow')} x="-140%" y="-140%" width="380%" height="380%">
            <feGaussianBlur stdDeviation="4.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* shared floor — see ./ink.tsx. cy is the measured sole line + 2,
            not a guess: the first pass eyeballed it and put this figure's
            shadow up to 12 units off the ground. */}
        <Contact cy={255} rx={46} />

        <ellipse cx="100" cy="270" rx="76" ry="12" fill={`url(#${id('pool')})`} />

        {/* ---------- the cloak — one garment with the hood, torn hem, not a separate cape ---------- */}
        <g>
          <path d="M62 92 Q100 82 138 92 L146 244 L136 264 L126 246 L116 266 L106 248 L100 268 L94 248 L84 266 L74 246 L64 264 L54 244 Z"
                fill={`url(#${id('cloak')})`} stroke={INK} strokeWidth="1" strokeOpacity="0.4" />
        </g>

        {/* ---------- backpack, half-swallowed by the cloak ---------- */}
        <g opacity="0.92">
          <rect x="34" y="100" width="132" height="96" rx="24" fill="#241c17" stroke={INK} strokeWidth="3" />
          <rect x="40" y="106" width="120" height="84" rx="20" fill="#332a22" />
          <rect x="37" y="122" width="9" height="62" rx="4.5" fill="#0c0908" opacity="0.85" />
          <rect x="154" y="122" width="9" height="62" rx="4.5" fill="#0c0908" opacity="0.85" />
        </g>

        {/* ---------- legs ---------- */}
        <g>
          <path d="M74 194 h24 v42 a12 12 0 0 1 -24 0 Z" fill={`url(#${id('suit')})`} />
          <path d="M102 194 h24 v42 a12 12 0 0 1 -24 0 Z" fill={`url(#${id('suit')})`} />
          <rect x="74" y="226" width="24" height="7" fill={`url(#${id('band')})`} style={{ filter: `url(#${id('glow')})` }} />
          <rect x="102" y="226" width="24" height="7" fill={`url(#${id('band')})`} style={{ filter: `url(#${id('glow')})` }} />
          <path d="M68 234 h32 v14 a5 5 0 0 1 -5 5 H73 a5 5 0 0 1 -5 -5 Z" fill="#221913" />
          <path d="M100 234 h32 v14 a5 5 0 0 1 -5 5 h-22 a5 5 0 0 1 -5 -5 Z" fill="#221913" />
          <rect x="68" y="248" width="32" height="5" rx="2.5" fill="#e8641f" style={{ filter: `url(#${id('glow')})` }} />
          <rect x="100" y="248" width="32" height="5" rx="2.5" fill="#e8641f" style={{ filter: `url(#${id('glow')})` }} />
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

        {/* ---------- torso, worn and dim ---------- */}
        <g>
          <path d="M62 146 q0 -14 14 -14 h48 q14 0 14 14 v44 q0 12 -14 12 H76 q-14 0 -14 -12 Z" fill={`url(#${id('suit')})`} />
          <g transform="translate(104,148)">
            <rect width="30" height="26" rx="5" fill="#332a22" />
            <rect x="2.5" y="2.5" width="25" height="7" rx="2" fill="#140f0c" />
            <circle cx="8" cy="15" r="3.6" fill="#e8641f" style={{ filter: `url(#${id('glow')})` }} />
            <circle cx="22" cy="15" r="3.6" fill="#6e5847" />
            <circle cx="8" cy="23" r="3.6" fill="#463526" />
            <circle cx="22" cy="23" r="3.6" fill="#463526" />
          </g>
        </g>

        {/* ---------- hood, draped clean over the helmet — no visor, no shell visible at all ---------- */}
        <g>
          <path d="M40 96 Q28 40 100 16 Q172 40 160 96 Q150 118 100 128 Q50 118 40 96 Z" fill={`url(#${id('hood')})`} />
          {/* ragged front opening edge */}
          <path d="M52 68 Q46 82 52 98 L58 92 L56 78 L62 74 Z" fill={`url(#${id('hood')})`} opacity="0.9" />
          <path d="M148 68 Q154 82 148 98 L142 92 L144 78 L138 74 Z" fill={`url(#${id('hood')})`} opacity="0.9" />
          {/* fold lines */}
          <path d="M56 40 Q40 70 46 98" stroke={INK} strokeWidth="2" fill="none" opacity="0.35" />
          <path d="M144 40 Q160 70 154 98" stroke={INK} strokeWidth="2" fill="none" opacity="0.35" />
          <path d="M78 22 Q72 60 78 98" stroke={INK} strokeWidth="1.4" fill="none" opacity="0.25" />
          <path d="M122 22 Q128 60 122 98" stroke={INK} strokeWidth="1.4" fill="none" opacity="0.25" />

          {/* the void where a face would be */}
          <path d="M62 66 Q100 52 138 66 Q134 96 100 108 Q66 96 62 66 Z" fill={`url(#${id('void')})`} />

          {/* scarf wrap across the lower face */}
          <path d="M64 90 Q100 104 136 90 L132 100 Q100 112 68 100 Z" fill="#2a1c14" opacity="0.9" />

          {/* two ember eyes, all there is to see */}
          <ellipse cx="86" cy="76" rx="4.2" ry="3.2" fill={`url(#${id('ember')})`} style={{ filter: `url(#${id('glow')})` }} />
          <ellipse cx="114" cy="76" rx="4.2" ry="3.2" fill={`url(#${id('ember')})`} style={{ filter: `url(#${id('glow')})` }} />
        </g>

        {/* ---------- mantle — the same garment continuing down over the shoulders and
             chest, drawn on top of the torso so it actually reads from the front instead
             of hiding entirely behind the body like the back cloak does ---------- */}
        <g>
          <path d="M44 122 Q100 106 156 122 L150 140 Q140 130 130 148 Q114 132 100 158 Q86 132 70 148 Q60 130 50 140 Z"
                fill={`url(#${id('hood')})`} stroke={INK} strokeWidth="1" strokeOpacity="0.35" />
          <path d="M56 126 Q70 138 78 150" stroke={INK} strokeWidth="1.4" fill="none" opacity="0.3" />
          <path d="M144 126 Q130 138 122 150" stroke={INK} strokeWidth="1.4" fill="none" opacity="0.3" />
          <path d="M100 112 L100 152" stroke={INK} strokeWidth="1.2" fill="none" opacity="0.22" />
        </g>

        {/* ---------- the crown of fire — structural, not a decal ---------- */}
        <g style={{ filter: `url(#${id('flameGlow')})` }}>
          <path d="M52 22 C44 10 54 2 48 -12 C58 -2 62 8 56 22 Z" fill={`url(#${id('fire')})`} />
          <path d="M72 12 C60 -4 74 -16 64 -34 C78 -20 86 -2 76 14 Z" fill={`url(#${id('fire')})`} />
          <path d="M94 8 C82 -8 100 -22 90 -46 C106 -28 114 -6 102 10 Z" fill={`url(#${id('fire')})`} />
          <path d="M118 12 C130 -4 116 -16 126 -34 C112 -20 104 -2 114 14 Z" fill={`url(#${id('fire')})`} />
          <path d="M140 22 C148 10 138 2 144 -12 C134 -2 130 8 136 22 Z" fill={`url(#${id('fire')})`} />
        </g>
        <g opacity="0.85">
          <circle cx="68" cy="-8" r="2.2" fill="#ffb03a" style={{ filter: `url(#${id('glow')})` }} />
          <circle cx="128" cy="-14" r="1.8" fill="#ffb03a" style={{ filter: `url(#${id('glow')})` }} />
          <circle cx="100" cy="-30" r="2.6" fill="#fff3c9" style={{ filter: `url(#${id('glow')})` }} />
          <circle cx="86" cy="-2" r="1.5" fill="#e8641f" style={{ filter: `url(#${id('glow')})` }} />
        </g>
      
    </>
  );
}

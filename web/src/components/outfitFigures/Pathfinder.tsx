/* Ported from the "Pathfinder" outfit review page — approved before integration.
   Own body: a genuinely different figure, not a decoration layered onto
   Voyager's shared rig. Dispatched from Voyager.tsx by figureId. */

import { INK, INK_MAIN, INK_SUB, INK_FINE, Contact } from './ink';

export function Pathfinder({ uid }: { uid: string }) {
  const id = (n: string) => `${n}-${uid}`;
  return (
    <>

        <defs>
          <linearGradient id={id('suit')} x1="0.15" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#a8b98a" />
            <stop offset="42%" stopColor="#788d5c" />
            <stop offset="100%" stopColor="#3e4a2c" />
          </linearGradient>
          <linearGradient id={id('shell')} x1="0.2" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor="#94a378" />
            <stop offset="55%" stopColor="#647252" />
            <stop offset="100%" stopColor="#363f28" />
          </linearGradient>
          <linearGradient id={id('visorAmber')} x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#f6cd82" />
            <stop offset="45%" stopColor="#c47f2e" />
            <stop offset="100%" stopColor="#7a4a14" />
          </linearGradient>
          <radialGradient id={id('gloss')} cx="0.3" cy="0.25" r="0.6">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={id('cape')} x1="0" y1="0" x2="0.2" y2="1">
            <stop offset="0%" stopColor="#d3c299" />
            <stop offset="100%" stopColor="#8f7d54" />
          </linearGradient>
          <linearGradient id={id('band')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c47f2e" />
            <stop offset="100%" stopColor="#c47f2e" stopOpacity="0.72" />
          </linearGradient>
          <radialGradient id={id('pool')} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#c47f2e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#c47f2e" stopOpacity="0" />
          </radialGradient>
          <filter id={id('glow')} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* this figure stands taller than the rest — boots end at 277, not 257 */}
        <Contact cy={279} rx={40} />
        <ellipse cx="100" cy="292" rx="58" ry="9" fill={`url(#${id('pool')})`} />

        {/* ---------- short travelling cloak — practical, not dramatic, matches a scout who moves fast ---------- */}
        <g>
          <path d="M74 128 Q100 118 126 128 L134 190 Q100 204 66 190 Z" fill={`url(#${id('cape')})`} stroke={INK} strokeWidth={INK_SUB} />
        </g>

        {/* ---------- lean daypack — narrower than the standard life-support pack, no armour bulk ---------- */}
        <g>
          <rect x="52" y="128" width="96" height="66" rx="18" fill="#5c6e48" stroke={INK} strokeWidth={INK_MAIN} />
          <rect x="58" y="134" width="84" height="54" rx="14" fill="#647252" />
          <rect x="55" y="146" width="7" height="40" rx="3.5" fill="#2c331e" opacity="0.8" />
          <rect x="138" y="146" width="7" height="40" rx="3.5" fill="#2c331e" opacity="0.8" />
        </g>

        {/* ---------- longer, slimmer legs — a taller stance than every other build ---------- */}
        <g>
          <path d="M76 196 h18 v58 a9 9 0 0 1 -18 0 Z" fill={`url(#${id('suit')})`} stroke={INK} strokeWidth={INK_MAIN} />
          <path d="M106 196 h18 v58 a9 9 0 0 1 -18 0 Z" fill={`url(#${id('suit')})`} stroke={INK} strokeWidth={INK_MAIN} />
          <rect x="76" y="236" width="18" height="6" fill={`url(#${id('band')})`} style={{ filter: `url(#${id('glow')})` }} />
          <rect x="106" y="236" width="18" height="6" fill={`url(#${id('band')})`} style={{ filter: `url(#${id('glow')})` }} />
          <path d="M72 254 h26 v18 a5 5 0 0 1 -5 5 h-16 a5 5 0 0 1 -5 -5 Z" fill="#3e4a2c" stroke={INK} strokeWidth={INK_SUB} />
          <path d="M102 254 h26 v18 a5 5 0 0 1 -5 5 h-16 a5 5 0 0 1 -5 -5 Z" fill="#3e4a2c" stroke={INK} strokeWidth={INK_SUB} />
          <rect x="72" y="272" width="26" height="4" rx="2" fill="#c47f2e" style={{ filter: `url(#${id('glow')})` }} />
          <rect x="102" y="272" width="26" height="4" rx="2" fill="#c47f2e" style={{ filter: `url(#${id('glow')})` }} />
        </g>

        {/* ---------- slimmer, longer arms ---------- */}
        <g>
          <path d="M56 138 h17 v56 a8.5 8.5 0 0 1 -17 0 Z" fill={`url(#${id('suit')})`} stroke={INK} strokeWidth={INK_MAIN} />
          <rect x="56" y="152" width="17" height="6" fill={`url(#${id('band')})`} style={{ filter: `url(#${id('glow')})` }} />
        </g>
        <g>
          <path d="M127 138 h17 v56 a8.5 8.5 0 0 1 -17 0 Z" fill={`url(#${id('suit')})`} stroke={INK} strokeWidth={INK_MAIN} />
          <rect x="127" y="152" width="17" height="6" fill={`url(#${id('band')})`} style={{ filter: `url(#${id('glow')})` }} />
        </g>

        {/* ---------- narrower, tapered torso — a leaner build than the standard rig's boxy chest ---------- */}
        <g>
          <path d="M74 142 q0 -12 12 -12 h28 q12 0 12 12 v40 q0 12 -10 12 H84 q-10 0 -10 -12 Z" fill={`url(#${id('suit')})`} stroke={INK} strokeWidth={INK_MAIN} />
          <g transform="translate(100,144)">
            <rect width="24" height="21" rx="4" fill="#94a378" stroke={INK} strokeWidth={INK_FINE} />
            <rect x="2" y="2" width="20" height="6" rx="1.6" fill="#2c331e" />
            <circle cx="6.5" cy="12" r="2.9" fill="#c47f2e" style={{ filter: `url(#${id('glow')})` }} />
            <circle cx="17.5" cy="12" r="2.9" fill="#647252" />
            <circle cx="6.5" cy="18.5" r="2.9" fill="#3e4a2c" />
            <circle cx="17.5" cy="18.5" r="2.9" fill="#3e4a2c" />
          </g>
        </g>

        <rect x="88" y="122" width="24" height="10" rx="5" fill="#647252" stroke={INK} strokeWidth={INK_FINE} />

        {/* ---------- helmet — low, flattened, wraparound goggle band. Nothing like a dome, hexagon, wedge or hood ---------- */}
        <g>
          <path d="M44 96 Q40 58 100 46 Q160 58 156 96 Q150 112 100 116 Q50 112 44 96 Z" fill={`url(#${id('shell')})`} stroke={INK} strokeWidth={INK_MAIN} />

          <g transform="translate(42,80)">
            <path d="M0 -12 L9 -6 L9 6 L0 12 L-9 6 L-9 -6 Z" fill="#647252" />
          </g>
          <g transform="translate(158,80)">
            <path d="M0 -12 L-9 -6 L-9 6 L0 12 L9 6 L9 -6 Z" fill="#647252" />
          </g>

          {/* wraparound goggle band, wide and flat */}
          <path d="M50 74 Q100 62 150 74 L146 92 Q100 82 54 92 Z" fill={`url(#${id('visorAmber')})`} />
          <path d="M50 74 Q100 62 150 74 L146 92 Q100 82 54 92 Z" fill={`url(#${id('gloss')})`} />
          <path d="M50 74 Q100 62 150 74 L146 92 Q100 82 54 92 Z" fill="none" stroke={INK} strokeWidth={INK_SUB} />
          <path d="M62 72 L88 65" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" opacity="0.5" />

          {/* low speed-crest at the back */}
          <path d="M100 46 Q112 32 108 16" stroke="#647252" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.85" />
          <path d="M100 46 Q112 32 108 16" stroke="#94a378" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.7" />
        </g>
      
    </>
  );
}

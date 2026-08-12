/* ============================================================
   Voyager — the avatar, drawn in code.

   A chibi/toy astronaut: oversized domed helmet, dark iridescent visor with a
   gold rim, glossy white suit with red accent bands, chest control panel.

   Vector rather than a render for one practical reason — gear upgrades are
   layers on this figure, so a new tier costs a few elements instead of a whole
   new illustration. It also inherits the theme accent, stays crisp at any size,
   and ships with no assets to manage.

   Gradient ids are namespaced per instance (useId) because the preview renders
   ten of these at once and the visor gradient differs by tier — shared ids
   would make every figure adopt the first one's visor.
   ============================================================ */

import { useId } from 'react';
import { CharacterFigure } from './CharacterArt';
import { FIGURE_VIEWBOX, OutfitFigure } from './outfitFigures';
import { INK, INK_MAIN, INK_SUB, Contact } from './outfitFigures/ink';
import { colorwayFor, currentGear, gearState } from '../data/gear';
import { outfitById } from '../data/outfits';
import type { VoyagerMood } from '../utils/discipline';

/* Reused whenever an outfit's own visor calls for it, rather than redefining
   the same two colour ramps a second time. */
const GOLD_VISOR = ['#3a2c0c', '#8a6a1c', '#e8c45f'];
const DARK_VISOR = ['#0c0e18', '#1c2340', '#39406b'];

export function Voyager({
  cleanDays,
  size = 150,
  companionId,
  outfitId,
  mood = 'steady',
}: {
  /** gear is earned in clean days, not XP — see data/gear.ts */
  cleanDays: number;
  size?: number;
  /** the crew member standing beside Voyager, if any — see data/characters.ts */
  companionId?: string | null;
  /** equipped wardrobe outfit — a separate, XP-gated track, see data/outfits.ts */
  outfitId?: string;
  /**
   * How he's carrying the current streak — see voyagerMood() in
   * utils/discipline.ts. Applied as a class on the root svg so it works on
   * every figure, the shared rig and all nine custom bodies alike, without
   * any of them knowing about it.
   */
  mood?: VoyagerMood;
}) {
  const g = gearState(cleanDays);
  const c = colorwayFor(cleanDays);
  const uid = useId().replace(/:/g, '');
  const id = (n: string) => `${n}-${uid}`;

  /* 'standard' renders byte-identical to the pre-wardrobe figure — an outfit
     only takes over suit/shell/band/visor and adds its cape and pauldrons
     when it is something other than the default. Backpack tier, mission
     badge and antenna tier are left alone either way: those are clean-day
     attachments, not part of the outfit, and should keep showing under
     whatever is worn on top. */
  const outfit = outfitId && outfitId !== 'standard' ? outfitById(outfitId) : null;

  /* Custom-body outfits aren't decorations on this rig — they're a different
     figure entirely (different helmet, different limbs, sometimes no visor
     at all), so they short-circuit the whole shared render below rather than
     adding another branch to it. Past this point `outfit`, if non-null, is
     narrowed to the standard-body shape. */
  if (outfit && outfit.bodyType === 'custom') {
    const viewBox = FIGURE_VIEWBOX[outfit.figureId] ?? '0 0 200 300';
    const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);
    return (
      <svg
        className={`voyager mood-${mood}`}
        width={size}
        height={size * (vbHeight / vbWidth)}
        viewBox={viewBox}
        role="img"
        aria-label={`Voyager wearing ${outfit.name}, ${cleanDays} clean ${cleanDays === 1 ? 'day' : 'days'}`}
      >
        <OutfitFigure figureId={outfit.figureId} uid={uid} />
        {companionId && (
          <g className="voyager-companion" transform="translate(138, 178) scale(0.55)">
            <CharacterFigure id={companionId} uid={`${uid}-crew`} />
          </g>
        )}
      </svg>
    );
  }

  const suitPalette = outfit ? outfit.suit : c.suit;
  const shellPalette = outfit ? outfit.shell : c.shell;

  /* visor tier: 0 dark neutral · 1 themed tint · 2 gold — overridden entirely
     by the outfit's own visor when one is equipped */
  const visorStops = outfit
    ? outfit.visor === 'dark-scan'
      ? DARK_VISOR
      : GOLD_VISOR
    : g.visor === 2
      ? GOLD_VISOR
      : g.visor === 1
        ? ['#0e1224', '#2b2560', 'var(--accent)']
        : DARK_VISOR;
  const visorNarrow = outfit?.visor === 'gold-narrow';
  const visorScanLine = outfit?.visor === 'dark-scan' && outfit.id === 'ironclad';

  /* the colourway owns the band; the top trim tier still swaps to the accent —
     an equipped outfit overrides both with its own accent colour */
  const band = outfit ? outfit.band : g.trim === 2 ? c.band : '#e0483c';

  /* the final gear suit glows, and so does any outfit that calls for it —
     either is reason enough to define the filter */
  const glowsAtAll = c.glow || Boolean(outfit?.glow);
  const bandGlow = glowsAtAll ? { filter: `url(#${id('glow')})` } : undefined;

  return (
    <svg
      className={`voyager mood-${mood}`}
      width={size}
      height={size * 1.3}
      viewBox="0 0 200 260"
      role="img"
      aria-label={
        outfit
          ? `Voyager wearing ${outfit.name}, ${cleanDays} clean ${cleanDays === 1 ? 'day' : 'days'}`
          : `Voyager wearing ${currentGear(cleanDays).name}, ${cleanDays} clean ${cleanDays === 1 ? 'day' : 'days'}`
      }
    >
      <defs>
        {/* suit — outfit palette if one is worn, otherwise the clean-day colourway */}
        <linearGradient id={id('suit')} x1="0.15" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor={suitPalette[0]} />
          <stop offset="42%" stopColor={suitPalette[1]} />
          <stop offset="100%" stopColor={suitPalette[2]} />
        </linearGradient>

        {/* helmet shell — brighter, with a cool rim */}
        <linearGradient id={id('shell')} x1="0.2" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor={shellPalette[0]} />
          <stop offset="55%" stopColor={shellPalette[1]} />
          <stop offset="100%" stopColor={shellPalette[2]} />
        </linearGradient>

        {/* the glow behind the amber trim on the final suit, or an outfit's own glow */}
        {glowsAtAll && (
          <filter id={id('glow')} x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}

        {/* the visor */}
        <linearGradient id={id('visor')} x1="0.15" y1="0.1" x2="0.85" y2="0.95">
          <stop offset="0%" stopColor={visorStops[2]} stopOpacity="0.95" />
          <stop offset="45%" stopColor={visorStops[1]} />
          <stop offset="100%" stopColor={visorStops[0]} />
        </linearGradient>

        {/* specular blob on the visor */}
        <radialGradient id={id('gloss')} cx="0.36" cy="0.3" r="0.5">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        {/* iridescent rim light along the top-left of the dome */}
        <linearGradient id={id('rim')} x1="0" y1="0.1" x2="1" y2="0.9">
          <stop offset="0%" stopColor="#9db8ff" />
          <stop offset="45%" stopColor="#c39cff" />
          <stop offset="100%" stopColor="#9db8ff" stopOpacity="0" />
        </linearGradient>

        <linearGradient id={id('band')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={band} />
          <stop offset="100%" stopColor={band} stopOpacity="0.72" />
        </linearGradient>

        {/* soft ground pool */}
        <radialGradient id={id('pool')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#4f7cff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#4f7cff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ---------- ground pool ---------- */}
      {/* The shared rig is the one figure the whole set is measured against, so
          it gets the same floor as the nine custom bodies — see outfitFigures/ink.tsx.
          Boots bottom out at 253 here, hence 255. */}
      <Contact cy={255} />
      <ellipse cx="100" cy="250" rx="72" ry="11" fill={`url(#${id('pool')})`} />

      {/* ---------- cape — outfit only, drawn first so the whole figure sits in
           front of it. Shape carries the outfit as much as colour does: a
           single tapered panel, two narrow straps, or two overlapping panels
           for the heaviest look — never just a recolour of the same path. */}
      {outfit && outfit.cape !== 'none' && (
        <g className="voyager-cape">
          {outfit.cape === 'single' && (
            <path
              d="M83 99 Q100 94 117 99 L123 251 Q100 264 77 251 Z"
              fill={outfit.capeColor[0]}
              stroke={outfit.capeColor[1]}
              strokeWidth="2"
            />
          )}
          {outfit.cape === 'double-strap' && (
            <>
              <path
                d="M83 99 h11 L98 253 a5.5 5.5 0 0 1 -11 0 Z"
                fill={outfit.capeColor[0]}
                stroke={outfit.capeColor[1]}
                strokeWidth="1.5"
              />
              <path
                d="M106 99 h11 L121 253 a5.5 5.5 0 0 1 -11 0 Z"
                fill={outfit.capeColor[0]}
                stroke={outfit.capeColor[1]}
                strokeWidth="1.5"
              />
            </>
          )}
          {outfit.cape === 'double-panel' && (
            <>
              <path d="M71 97 Q100 91 129 97 L136 259 Q100 272 64 259 Z" fill={outfit.capeColor[1]} />
              <path
                d="M80 103 Q100 99 120 103 L125 250 Q100 261 75 250 Z"
                fill={outfit.capeColor[0]}
                opacity="0.92"
              />
            </>
          )}
        </g>
      )}

      {/* ---------- backpack — on from day one, reinforced at 130 clean days ----------
          Sized to be SEEN. The helmet occludes everything above y≈140, the torso
          takes x 62–138 and the arms take 46–69 and 131–154 — so a pack narrower
          than x 34–166 is completely hidden behind the figure. It reads as two
          shoulders of hardware flanking the helmet and body. */}
      <g className="voyager-pack">
        {/* outline first, so the pack's silhouette is always distinct from the
            suit even where their values happen to sit close */}
        <rect
          x="34"
          y="100"
          width="132"
          height="96"
          rx="26"
          fill={c.pack[0]}
          stroke={c.packEdge}
          strokeWidth="3"
        />
        <rect x="40" y="106" width="120" height="84" rx="22" fill={c.pack[1]} stroke={INK} strokeWidth={INK_MAIN} />

        {/* detail lives in the exposed side strips, not the hidden middle */}
        <rect x="37" y="122" width="9" height="62" rx="4.5" fill={c.packEdge} opacity="0.85" />
        <rect x="154" y="122" width="9" height="62" rx="4.5" fill={c.packEdge} opacity="0.85" />
        {[130, 142, 154].map((y) => (
          <g key={y} opacity="0.7">
            <rect x="38.5" y={y} width="6" height="2.5" rx="1.2" fill={c.pack[1]} />
            <rect x="155.5" y={y} width="6" height="2.5" rx="1.2" fill={c.pack[1]} />
          </g>
        ))}

        {g.pack === 2 && (
          <>
            <rect x="36" y="118" width="11" height="70" rx="5.5" fill={band} opacity="0.94" style={bandGlow} />
            <rect x="153" y="118" width="11" height="70" rx="5.5" fill={band} opacity="0.94" style={bandGlow} />
          </>
        )}
      </g>

      {/* ---------- antenna ---------- */}
      {g.antenna > 0 && (
        <g className="voyager-antenna">
          <line x1="100" y1="20" x2="100" y2="6" stroke="#aab4c4" strokeWidth="3.5" strokeLinecap="round" />
          {g.antenna === 2 ? (
            <path d="M88 6 A 12 12 0 0 1 112 6 Z" fill={band} />
          ) : (
            <circle cx="100" cy="4" r="4.5" fill={band} />
          )}
        </g>
      )}

      {/* ---------- legs ---------- */}
      <g>
        <path d="M74 194 h24 v42 a12 12 0 0 1 -24 0 Z" fill={`url(#${id('suit')})`} stroke={INK} strokeWidth={INK_MAIN} />
        <path d="M102 194 h24 v42 a12 12 0 0 1 -24 0 Z" fill={`url(#${id('suit')})`} stroke={INK} strokeWidth={INK_MAIN} />
        {/* fabric ribs */}
        {[204, 212, 220].map((y) => (
          <g key={y} opacity="0.28">
            <rect x="74" y={y} width="24" height="2" fill="#8f9aab" />
            <rect x="102" y={y} width="24" height="2" fill="#8f9aab" />
          </g>
        ))}
        {/* knee bands */}
        <rect x="74" y="226" width="24" height="7" fill={`url(#${id('band')})`} style={bandGlow} />
        <rect x="102" y="226" width="24" height="7" fill={`url(#${id('band')})`} style={bandGlow} />
        {/* boots */}
        <path d="M68 234 h32 v14 a5 5 0 0 1 -5 5 H73 a5 5 0 0 1 -5 -5 Z" fill={`url(#${id('suit')})`} stroke={INK} strokeWidth={INK_SUB} />
        <path d="M100 234 h32 v14 a5 5 0 0 1 -5 5 h-22 a5 5 0 0 1 -5 -5 Z" fill={`url(#${id('suit')})`} stroke={INK} strokeWidth={INK_SUB} />
        <rect x="68" y="248" width="32" height="5" rx="2.5" fill={band} style={bandGlow} />
        <rect x="100" y="248" width="32" height="5" rx="2.5" fill={band} style={bandGlow} />
      </g>

      {/* ---------- arms ----------
          One continuous limb each: the shoulder starts well inside the torso
          silhouette and the hand is a rounded end of the same suit material, so
          the arm reads as part of the body rather than a stick with a glove
          stuck on it. Drawn before the torso so the torso overlaps the top. */}
      <g>
        {/* left, resting */}
        <path d="M46 142 h23 v58 a11.5 11.5 0 0 1 -23 0 Z" fill={`url(#${id('suit')})`} stroke={INK} strokeWidth={INK_MAIN} />
        <rect x="46" y="158" width="23" height="8" fill={`url(#${id('band')})`} style={bandGlow} />
        {/* wrist crease — suggests a hand without breaking the material */}
        <path d="M48 192 q11.5 4 21 0" stroke="#8f9aab" strokeWidth="1.6" fill="none" opacity="0.35" />
      </g>

      {/* right arm waves — its own group so the transform is isolated */}
      <g className="voyager-arm" style={{ transformOrigin: '142px 148px' }}>
        <path d="M131 142 h23 v58 a11.5 11.5 0 0 1 -23 0 Z" fill={`url(#${id('suit')})`} stroke={INK} strokeWidth={INK_MAIN} />
        <rect x="131" y="158" width="23" height="8" fill={`url(#${id('band')})`} style={bandGlow} />
        <path d="M133 192 q11.5 4 21 0" stroke="#8f9aab" strokeWidth="1.6" fill="none" opacity="0.35" />
      </g>

      {/* ---------- torso ---------- */}
      <g>
        <path d="M62 146 q0 -14 14 -14 h48 q14 0 14 14 v44 q0 12 -14 12 H76 q-14 0 -14 -12 Z" fill={`url(#${id('suit')})`} stroke={INK} strokeWidth={INK_MAIN} />

        {/* shoulder flag patch */}
        <g transform="translate(68,150)">
          <rect width="16" height="11" rx="2" fill="#e9edf3" />
          <rect width="16" height="3.6" fill="#e0483c" />
          <rect y="7.4" width="16" height="3.6" fill="#e0483c" />
          <rect width="7" height="6" fill="#2a44a8" />
        </g>

        {/* mission patch — unlocked gear */}
        {g.badge && (
          <g className="voyager-badge" transform="translate(88,152)">
            <circle r="9" fill="#1c2f6e" />
            <ellipse rx="8" ry="3.2" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.8" transform="rotate(-22)" />
            <path d="M-7 2 q7 -6 14 -2" stroke="#e0483c" strokeWidth="2" fill="none" strokeLinecap="round" />
            <circle cx="2" cy="-2" r="1.6" fill="#ffffff" />
          </g>
        )}

        {/* chest control panel */}
        <g transform="translate(104,148)">
          <rect width="30" height="26" rx="5" fill="#c3ccd9" />
          <rect x="2.5" y="2.5" width="25" height="7" rx="2" fill="#4a525f" />
          {[0, 1, 2, 3].map((i) => (
            <circle
              key={i}
              cx={8 + (i % 2) * 14}
              cy={15 + Math.floor(i / 2) * 8}
              r="3.6"
              fill={['#f6c8d4', '#e8e2ea', '#e0483c', '#f0a52e'][i]}
            />
          ))}
        </g>

        {/* torso ribs */}
        {[182, 190].map((y) => (
          <rect key={y} x="66" y={y} width="68" height="2" fill="#8f9aab" opacity="0.25" />
        ))}
      </g>

      {/* ---------- shoulder pauldrons — outfit only ----------
          Sits right at the shoulder seam, above where the flag patch and
          chest panel start, so it never collides with either. A structural
          difference between outfits, not a recolour: Pathfinder wears one,
          Ironclad wears both, the standard suit wears none. */}
      {outfit && outfit.pauldron > 0 && (
        <g className="voyager-pauldron">
          {(outfit.pauldron === 2 ? [[57, 140], [143, 140]] : [[143, 140]]).map(([px, py]) => (
            <g key={`${px}-${py}`} transform={`translate(${px},${py})`}>
              <ellipse rx="15" ry="12" fill={shellPalette[1]} stroke={outfit.capeColor[1]} strokeWidth="2" />
              <ellipse rx="10" ry="7.5" fill={shellPalette[0]} opacity="0.8" />
              <rect x="-3" y="-2" width="6" height="4" rx="1.5" fill={band} style={bandGlow} />
            </g>
          ))}
        </g>
      )}

      {/* ---------- neck ring ---------- */}
      <rect x="82" y="126" width="36" height="12" rx="6" fill={shellPalette[2]} />

      {/* ---------- helmet ---------- */}
      <g>
        {/* side ear pod */}
        <g transform="translate(44,84)">
          <ellipse rx="15" ry="17" fill={shellPalette[1]} stroke={INK} strokeWidth={INK_SUB} />
          <ellipse rx="10" ry="12" fill={shellPalette[2]} />
          <ellipse rx="5" ry="6" fill={shellPalette[1]} />
        </g>

        {/* dome */}
        <ellipse cx="100" cy="76" rx="62" ry="64" fill={`url(#${id('shell')})`} stroke={INK} strokeWidth={INK_MAIN} />

        {/* iridescent rim along the upper-left */}
        <path
          d="M100 12 A 62 64 0 0 0 38 76"
          fill="none"
          stroke={`url(#${id('rim')})`}
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* visor — rim then the glass. A closed dark visor gets a gunmetal rim
            instead of gold, and a narrow visor (Voidwalker) reads more like a
            squint than an open faceplate. */}
        <ellipse
          cx="108"
          cy="74"
          rx={visorNarrow ? 43 : 48}
          ry={visorNarrow ? 40 : 45}
          fill={outfit?.visor === 'dark-scan' ? '#3a3d46' : '#e8b44a'}
          opacity="0.95"
        />
        <ellipse
          cx="108"
          cy="74"
          rx={visorNarrow ? 40 : 45}
          ry={visorNarrow ? 37 : 42}
          fill={`url(#${id('visor')})`}
        />
        {/* specular */}
        <ellipse
          cx="108"
          cy="74"
          rx={visorNarrow ? 40 : 45}
          ry={visorNarrow ? 37 : 42}
          fill={`url(#${id('gloss')})`}
        />
        <ellipse cx="126" cy="58" rx="15" ry="9" fill="#ffffff" opacity="0.22" transform="rotate(-24 126 58)" />
        {/* Ironclad's scan-line — the one thing that makes its closed visor
            read as deliberately shut, not just dark */}
        {visorScanLine && (
          <rect x="70" y="73" width="76" height="2.4" rx="1.2" fill={band} opacity="0.85" style={bandGlow} />
        )}

        {/* soft shell highlight */}
        <ellipse cx="72" cy="40" rx="18" ry="11" fill="#ffffff" opacity="0.5" transform="rotate(-28 72 40)" />
      </g>

      {/* ---------- companion ----------
          Drawn last, standing at Voyager's feet rather than held — these are
          crew, not equipment. Scaled down and anchored to the ground line so
          every character reads at a consistent size regardless of its own
          proportions. */}
      {companionId && (
        <g className="voyager-companion" transform="translate(138, 178) scale(0.55)">
          <CharacterFigure id={companionId} uid={`${uid}-crew`} />
        </g>
      )}
    </svg>
  );
}

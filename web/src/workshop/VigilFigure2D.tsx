import { useCallback, useEffect, useRef } from 'react';
import './vigilFigure2D.css';

/* ============================================================
   Vigil — 2D figure, rev. 2 (generator servant).

   Rev. 1 was a gothic reliquary knight; it is fully superseded, not kept as
   a variant — see docs/crew3d/vigil-spec.md §0 for why. This redraw follows
   rev. 2's structure: an insectoid mask, an asymmetric loadout (armor on one
   arm only, a held power cell in the other), a tubing-and-bulb network
   instead of a single hero glow, and cracked-ceramic fittings for hands and
   feet instead of anatomical ones.

   Still SVG, for the same reason as rev. 1: this environment can draw real
   vector art — gradients, curves, layered fills — with genuine fidelity,
   which the primitive-based 3D blockout pipeline never had.
   ============================================================ */

const MASK_DARK = '#0d0d10';
const MASK_MID = '#1c1d21';
const EYE_GLOW = '#ffcf4d';
const WRAP_LIGHT = '#748259';
const WRAP_MID = '#525f3d';
const WRAP_DEEP = '#333a25';
const TORSO_LIGHT = '#5a4632';
const TORSO_DEEP = '#2c2216';
const ARMOR_LIGHT = '#7a5a37';
const ARMOR_MID = '#5a3f24';
const ARMOR_DEEP = '#33230f';
const RIVET = '#c9a24a';
const TUBE = '#5c211a';
const TUBE_DEEP = '#33110c';
const BULB_GLOW = '#ffb84d';
const BULB_CAP = '#8a6a34';
const TROUSER_LIGHT = '#221d18';
const TROUSER_DEEP = '#100d0a';
const SPECKLE = '#b8933f';
const CERAMIC_LIGHT = '#9fb3ba';
const CERAMIC_DEEP = '#5e6f75';
const CRACK_GLOW = '#dcecee';
const RUST = '#a85a26';
const POUCH = '#8a6a34';
const POUCH_DEEP = '#4a3a1c';
/** inked outline system, phase 1 head redraw — every shape in the head
 *  complex gets a stroke on top of its gradient fill now, at one of three
 *  weights (outer silhouette / inner seam / fine texture), which the torso
 *  and legs below still don't have. Intentional for this pass, not an
 *  oversight — see the file header. */
const LINE_INK = '#141414';
const GUNMETAL_LIGHT = '#4a4d54';
const GUNMETAL_DEEP = '#202226';

/** deterministic scatter — same reasoning as rev. 1: reproducible between
 *  reloads and screenshots, no Math.random() in render output. */
function hash(i: number, salt = 0): number {
  const s = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** flat-topped hexagon path, centered at (cx, cy) — the vent-grate cluster
 *  is built from these rather than a repeating <pattern>, since at this
 *  small a scale (each hex is ~2 units across) a handful of individually
 *  placed hexes reads better than a tiled pattern fighting the canister's
 *  rounded-rect clip. */
function hexPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i);
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}

/** the honeycomb filter-vent cluster on the mask's jaw plate — hand-placed
 *  rather than tiled on a grid, so it reads as a slightly worn cluster of
 *  vents rather than a printed pattern. */
const VENT_HEXES = [
  { x: 104, y: 58, r: 1.9 },
  { x: 108, y: 57.3, r: 1.9 },
  { x: 111.6, y: 58.6, r: 1.9 },
  { x: 106, y: 61 },
  { x: 110, y: 61 },
  { x: 103.2, y: 63.2, r: 1.7 },
  { x: 107.2, y: 64 },
].map((h) => ({ r: 1.8, ...h }));

/** trouser stain speckle — scattered across both legs, low-contrast */
const SPECKLE_DOTS = Array.from({ length: 26 }, (_, i) => ({
  x: 45 + hash(i) * 110,
  y: 175 + hash(i, 1) * 105,
  r: 0.8 + hash(i, 2) * 1.1,
  key: i,
}));

/** the five vacuum-tube bulbs — sternum is brightest, per spec §6 */
const BULBS = [
  { x: 68, y: 90, r: 5, bright: 0.7 },
  { x: 132, y: 86, r: 5, bright: 0.7 },
  { x: 100, y: 112, r: 6.5, bright: 1 },
  { x: 84, y: 178, r: 4.5, bright: 0.6 },
  { x: 108, y: 184, r: 4.5, bright: 0.6 },
];

export type VigilFigure2DProps = {
  /** rendered width in px; height follows the 200x300 viewBox. Omit to let
   *  the parent size it via CSS, which is what the workshop does. */
  size?: number;
  /** set false to render a completely inert figure — no idle, no reaction */
  interactive?: boolean;
};

export function VigilFigure2D({ size, interactive = true }: VigilFigure2DProps) {
  const ref = useRef<SVGSVGElement>(null);

  /**
   * Restarting a CSS animation that is already running requires the class to
   * be removed, a reflow forced, and the class re-added — assigning the same
   * class name again is a no-op and the animation just keeps playing. React
   * state can't express that (a re-render with the same value changes
   * nothing), so this is one of the few places where touching the DOM node
   * directly is the correct tool rather than an escape hatch. Without the
   * reflow read, the browser coalesces remove+add into no change at all and
   * repeat taps do nothing until the first animation finishes.
   */
  const poke = useCallback(() => {
    const el = ref.current;
    if (!el || !interactive) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.classList.remove('is-poked');
    void el.getBoundingClientRect().width; // force reflow
    el.classList.add('is-poked');
  }, [interactive]);

  /* Clearing on animationend hands the groups back to their idle
     animations; leaving the class on would pin them at the reaction's
     final frame. Bound once rather than per-render. */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const done = (e: AnimationEvent) => {
      if (e.animationName.startsWith('vg-startle')) el.classList.remove('is-poked');
    };
    el.addEventListener('animationend', done);
    return () => el.removeEventListener('animationend', done);
  }, []);

  return (
    /* strokeLinecap / strokeLinejoin are set once on the root rather than
       repeated on ~80 elements: both properties inherit, so every stroked
       path in the figure gets round ends and round joins, and no shape can
       produce a miter spike. */
    <svg
      ref={ref}
      className={interactive ? 'vg-figure' : undefined}
      viewBox="0 0 200 300"
      width={size}
      height={size == null ? undefined : size * 1.5}
      role={interactive ? 'button' : 'img'}
      tabIndex={interactive ? 0 : undefined}
      aria-label={
        interactive
          ? 'Vigil — a servant built to carry current. Tap to get its attention.'
          : 'Vigil — a servant built to carry current: an insectoid mask, one armored arm, both arms hanging at its sides, wrapped in tubing that feeds five glowing bulbs'
      }
      /* pointerdown rather than click: it fires immediately on touch instead
         of waiting out the browser's click delay, so the reaction feels like
         a response to the finger landing rather than to letting go. */
      onPointerDown={interactive ? poke : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                poke();
              }
            }
          : undefined
      }
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient id="vg-mask" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={MASK_MID} />
          <stop offset="100%" stopColor={MASK_DARK} />
        </linearGradient>
        <linearGradient id="vg-gunmetal" x1="0.15" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={GUNMETAL_LIGHT} />
          <stop offset="100%" stopColor={GUNMETAL_DEEP} />
        </linearGradient>
        <linearGradient id="vg-wrap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={WRAP_LIGHT} />
          <stop offset="55%" stopColor={WRAP_MID} />
          <stop offset="100%" stopColor={WRAP_DEEP} />
        </linearGradient>
        <linearGradient id="vg-torso" x1="0.15" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor={TORSO_LIGHT} />
          <stop offset="100%" stopColor={TORSO_DEEP} />
        </linearGradient>
        <linearGradient id="vg-armor" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor={ARMOR_LIGHT} />
          <stop offset="50%" stopColor={ARMOR_MID} />
          <stop offset="100%" stopColor={ARMOR_DEEP} />
        </linearGradient>
        <linearGradient id="vg-trouser" x1="0.2" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor={TROUSER_LIGHT} />
          <stop offset="100%" stopColor={TROUSER_DEEP} />
        </linearGradient>
        <linearGradient id="vg-ceramic" x1="0.15" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={CERAMIC_LIGHT} />
          <stop offset="100%" stopColor={CERAMIC_DEEP} />
        </linearGradient>
        <linearGradient id="vg-pouch" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={POUCH} />
          <stop offset="100%" stopColor={POUCH_DEEP} />
        </linearGradient>
        <radialGradient id="vg-gloss" cx="0.35" cy="0.25" r="0.6">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="vg-rust" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={RUST} stopOpacity="0.55" />
          <stop offset="55%" stopColor={RUST} stopOpacity="0.22" />
          <stop offset="100%" stopColor={RUST} stopOpacity="0" />
        </radialGradient>
        {/* dirt kicked up around the sole line — warm grey-brown, fading
            out entirely so it reads as grime rather than a drawn shape */}
        <radialGradient id="vg-dirt" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#4a4034" stopOpacity="0.75" />
          <stop offset="60%" stopColor="#4a4034" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#4a4034" stopOpacity="0" />
        </radialGradient>
        <filter id="vg-glow" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="vg-softGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="1.1" />
        </filter>
      </defs>

      {/* ---------- trousers — the lower silhouette's main volume (§2).
          True drop-crotch cut. The previous version tapered from the waist
          straight down and split at y=204 — narrower than the torso, which
          is why it read as two stiff tubes. Now: the outer edge FLARES out
          past the torso's own width at the thigh (x44/x156 vs the torso's
          x54/x146), the crotch hangs low at y=226, and the leg gathers hard
          at the ankle. That flare-then-gather is what makes cloth read as
          baggy rather than fitted. Left and right are deliberately not
          mirrored — the right leg hangs slightly wider and lower. */}
      <path
        d="M60,158 L50,180 L44,206 L47,232 L53,256 L59,274
           L86,280 L90,258 L93,240 L97,226
           L106,226 L110,242 L113,262 L117,282
           L142,276 L148,256 L153,232 L156,204 L148,178 L140,158 Z"
        fill="url(#vg-trouser)"
        stroke={LINE_INK}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* crotch shadow — a deep wedge hanging from the low split, which is
          where a drop-crotch actually pools fabric */}
      <path d="M90,258 L93,240 L97,226 L106,226 L110,242 L113,262 L102,252 Z" fill="#0a0806" opacity="0.5" />
      {/* wrinkle lines following the drop of the fabric: diagonals running
          from each hip DOWN AND IN toward the low crotch (that's the
          direction the weight pulls), then horizontal bunching at the
          ankles where the cloth gathers */}
      <g fill="none" stroke={LINE_INK} strokeWidth="2" strokeLinecap="round" opacity="0.55">
        <path d="M58,178 C70,192 82,208 90,228" />
        <path d="M52,200 C64,214 76,230 84,250" />
        <path d="M142,176 C132,190 120,206 111,228" />
        <path d="M150,200 C140,214 128,232 118,252" />
        <path d="M64,236 C72,244 78,254 80,266" />
        <path d="M138,232 C130,242 124,252 122,264" />
      </g>
      {/* ankle bunching — short stacked arcs, the cloth piling on the boot */}
      <g fill="none" stroke={LINE_INK} strokeWidth="1.6" strokeLinecap="round" opacity="0.6">
        <path d="M60,266 C68,272 78,274 86,272" />
        <path d="M60,274 C68,279 78,281 86,278" />
        <path d="M118,270 C126,276 134,277 141,272" />
        <path d="M118,278 C126,283 134,284 141,279" />
      </g>
      {SPECKLE_DOTS.map((d) => (
        <circle key={d.key} cx={d.x} cy={d.y} r={d.r} fill={SPECKLE} opacity="0.35" />
      ))}
      {/* rust stains, low on the legs where a servant kneels or brushes
          against machinery */}
      <circle cx="62" cy="248" r="8" fill="url(#vg-rust)" />
      <circle cx="140" cy="240" r="6.5" fill="url(#vg-rust)" />

      {/* ---------- trailing torn panel — opposite the pouch (spec §3).
          Drawn AFTER the trousers (so it sits on top of them, the way it
          drapes over the leg in the reference) and reaching further left
          than the trouser's own hip edge — the first pass sat entirely
          behind the trousers and was reduced to an invisible sliver. ---------- */}
      <path
        d="M62,150 C48,182 40,220 42,262 L52,278 L64,266
           C60,228 62,190 70,154 Z"
        fill="url(#vg-wrap)"
      />
      {/* torn hem — two ragged notches rather than a clean edge */}
      <path d="M44,258 L49,265 L46,272 L52,278" stroke={WRAP_DEEP} strokeWidth="1.2" fill="none" opacity="0.6" />

      {/* ---------- boots. Previously two rounded pills sitting under the
          cuffs with nothing anchoring them — they read as floating caps
          because they had no sole, no ground contact, and a silhouette that
          didn't distinguish toe from heel. These are wrapped tabi-style
          work boots: a heel block, a rising ankle wrap, a flat sole that
          actually meets the ground line, a split toe seam, and dirt
          gathering where the sole meets the floor. Mirrored in layout but
          not in detail — the left boot's wrap sits higher. ---------- */}
      {[
        { x: 58, lift: 0 },
        { x: 116, lift: 2 },
      ].map((b) => {
        const x = b.x;
        const y = 268 + b.lift;
        return (
          <g key={x}>
            {/* ankle wrap, rising behind the trouser gather */}
            <path
              d={`M${x + 4},${y} L${x + 1},${y + 10} L${x + 3},${y + 18} L${x + 26},${y + 18}
                  L${x + 28},${y + 8} L${x + 25},${y - 1} Z`}
              fill={ARMOR_DEEP}
              stroke={LINE_INK}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* boot body — heel at the back, toe box swelling forward */}
            <path
              d={`M${x + 2},${y + 14} L${x - 2},${y + 22} L${x},${y + 28}
                  L${x + 30},${y + 28} L${x + 34},${y + 22} L${x + 31},${y + 14} Z`}
              fill="url(#vg-armor)"
              stroke={LINE_INK}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* sole — a flat slab that genuinely meets the ground line */}
            <path
              d={`M${x - 3},${y + 26} L${x + 35},${y + 26} L${x + 36},${y + 31}
                  L${x - 4},${y + 31} Z`}
              fill={MASK_DARK}
              stroke={LINE_INK}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            {/* split toe seam — the tabi detail */}
            <path
              d={`M${x + 25},${y + 15} C${x + 27},${y + 20} ${x + 27},${y + 24} ${x + 26},${y + 26}`}
              stroke={LINE_INK}
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
            />
            {/* strap across the instep */}
            <path
              d={`M${x + 1},${y + 19} L${x + 32},${y + 19}`}
              stroke={LINE_INK}
              strokeWidth="1.8"
              opacity="0.7"
            />
            <circle cx={x + 6} cy={y + 19} r="1.2" fill={RIVET} />
            {/* dirt gathering at the sole line */}
            <ellipse cx={x + 16} cy={y + 30} rx="20" ry="5" fill="url(#vg-dirt)" />
            <circle cx={x + 8} cy={y + 27} r="4.5" fill="url(#vg-dirt)" />
            <circle cx={x + 28} cy={y + 28} r="3.5" fill="url(#vg-dirt)" />
          </g>
        );
      })}

      {/* ---------- hip pouch — opposite the trailing panel. Sits lower and
          further out than the first pass, which put it close enough to the
          forearm/hand below the shoulder armor to overlap it. ---------- */}
      <path d="M124,152 L153,198" stroke={POUCH_DEEP} strokeWidth="3" />
      <ellipse cx="155" cy="205" rx="13" ry="16" fill="url(#vg-pouch)" />
      <ellipse cx="155" cy="205" rx="13" ry="16" fill="url(#vg-gloss)" />
      <circle cx="155" cy="205" r="4.5" fill={POUCH_DEEP} />

      {/* ============================================================
          TORSO — phase-3 rebuild. The previous version was a symmetric
          rounded box: same curve mirrored left and right, one smooth
          outline, no layering. Cloth doesn't do that. What's here now:

          · an ASYMMETRIC silhouette — the right shoulder sits higher and
            squarer than the left, the right side bulges wider at the ribs,
            and the hem is lower on the right than the left
          · FOUR stacked layers with visible edges (under-tunic, main robe,
            cross-over flap, sash) instead of one shape plus a highlight
          · SHARP corner nodes at the shoulders and every hem break, so the
            outline changes direction rather than easing through
          · internal fold lines radiating from the two real tension points
            (the sash knot, and the left shoulder where the robe is pulled
            across)
          ============================================================ */}
      <g id="torso_complex">
        {/* 1 — under-tunic, olive, showing along the left edge and hem
            where the robe is pulled away from it */}
        <path
          d="M56,92 L52,112 L50,136 L54,160 L74,163 L70,138 L68,112 L72,94 Z"
          fill="url(#vg-wrap)"
          stroke={LINE_INK}
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* 2 — main robe. Every node is a corner, not a smooth control
            point: shoulders square off, the ribs kick out on the right,
            and the hem steps rather than curving.

            Stroke note: this was authored at 4 as specified, rendered, and
            dialled back to 2.4. At a 200-unit viewBox a 4-unit stroke is
            ~4% of the torso's own width — heavy enough that adjacent
            outlines merged into black mass and the internal layer edges
            stopped reading at all. 2.4 keeps it unmistakably inked while
            letting the shapes it surrounds survive. */}
        <path
          d="M60,96 L58,84 L66,74 L80,70 L92,74 L104,71 L118,75 L132,70
             L142,78 L146,96 L143,116 L147,134 L142,154 L120,161
             L98,157 L76,162 L58,156 L55,132 L58,112 Z"
          fill="url(#vg-torso)"
          stroke={LINE_INK}
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* 3 — cross-over flap: the robe's outer panel pulled diagonally
            across the body, left shoulder down to right hip. Its upper
            edge is the jagged one, since that's the loose edge. */}
        <path
          d="M57,108 L74,116 L88,112 L106,122 L122,130 L138,128 L145,140
             L142,155 L118,161 L96,157 L74,162 L57,155 L54,132 Z"
          fill={TORSO_DEEP}
          fillOpacity="0.55"
          stroke={LINE_INK}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* 4 — fold lines. Two tension points only: the sash knot pulls
            the lower panel in, the left shoulder pulls the upper panel
            across. Lines fan from those, they don't run parallel. */}
        <g fill="none" stroke={LINE_INK} strokeWidth="1.3" strokeLinecap="round" opacity="0.5">
          <path d="M64,86 C74,96 78,112 76,130" />
          <path d="M70,80 C84,92 92,106 94,124" />
          <path d="M136,82 C130,96 128,110 132,126" />
          <path d="M100,140 C92,146 80,149 68,148" />
          <path d="M100,140 C112,146 124,148 136,146" />
        </g>

        {/* cel-shadow where the scarf's lower edge falls across the chest */}
        <path d="M62,84 L86,92 L112,88 L138,94 L140,100 L110,96 L84,100 L60,92 Z" fill="#0a0806" opacity="0.32" />

        {/* 5 — sash: three wound bands at slightly different angles, with
            a knot offset to the left of centre. Not a rounded rect. */}
        <path
          d="M54,138 L80,134 L108,137 L134,132 L147,136 L146,148 L120,152
             L94,148 L68,153 L53,149 Z"
          fill="url(#vg-wrap)"
          stroke={LINE_INK}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M56,143 L84,140 L112,143 L140,139" stroke={WRAP_DEEP} strokeWidth="1.4" fill="none" opacity="0.7" />
        {/* knot + hanging end, left of centre */}
        <path
          d="M84,140 L96,138 L100,150 L94,166 L86,158 L88,148 Z"
          fill={WRAP_DEEP}
          stroke={LINE_INK}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </g>

      <g id="right_arm" className="vg-arm-r">
      {/* ---------- right arm — the armored, hanging side (§3).
          Two earlier passes drew this as discrete stacked segments — first
          fanned by incrementing rotation per piece, then still reading as
          beads-on-a-string even at a fixed angle, because separate rounded
          shapes always leave a gap that reads as body between them. A single
          continuous sleeve with etched ridge-lines reads as banded plate
          without that problem — closer to how the reference's leather
          actually holds together as one wrapped piece. Phase 2 adds two
          asymmetric edge notches, so the plate reads as hand-cut rather
          than a machined capsule, plus a shoulder-seam shadow. */}
      <path d="M128,86 C133,92 138,94 142,90 L146,96 C140,100 132,98 126,92 Z" fill="#0a0806" opacity="0.3" />
      <path
        d="M132,90 C130,84 134,80 140,80 C146,80 152,84 151,90
           L153,120 L156,121 L153,124
           L153,146 C153,152 148,155 143,155 C138,155 133,152 133,146
           L136,145 L133,143 Z"
        fill="url(#vg-armor)"
        stroke={LINE_INK}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {[100, 112, 124, 136].map((cy) => (
        <g key={cy}>
          <path d={`M133,${cy} Q142,${cy + 3} 152,${cy}`} stroke={ARMOR_DEEP} strokeWidth="1.4" fill="none" />
          <circle cx="135" cy={cy + 1.5} r="1.3" fill={RIVET} />
          <circle cx="150" cy={cy + 1.5} r="1.3" fill={RIVET} />
        </g>
      ))}
      <circle cx="145" cy="128" r="6" fill="url(#vg-rust)" />
      {/* organic wrist cuff — banded, slightly uneven, replacing the
          rounded-rect cap from the previous pass */}
      <path
        d="M139,150 C139,148 142,147 146,147 C151,147 155,148 155,150
           L155,156 C155,158 151,159 146,159 C142,159 139,158 139,156 Z"
        fill={ARMOR_DEEP}
        stroke={LINE_INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* bare ceramic forearm + mitt — short, ends well clear of the hip
          pouch below (an earlier pass ran the arm all the way down to the
          pouch and the two overlapped). The hand is now a mitt-shaped path
          with a thumb break and knuckle seams, not a plain ellipse — spec
          still rules out full anatomical fingers (docs/crew3d/vigil-spec.md
          §3: "blunt, worn, non-anatomical"), so this adds shape without
          crossing into fingers the spec explicitly says not to draw. */}
      <path d="M147,158 L146,166" stroke="url(#vg-ceramic)" strokeWidth="8" strokeLinecap="round" />
      <path
        id="right_hand"
        d="M139,168 C138,164 141,161 146,161 C151,161 154,164 153,168
           C155,172 154,177 150,179 L148,176 C147,178 144,178 143,176
           L141,179 C137,177 137,172 139,168 Z"
        fill="url(#vg-ceramic)"
        stroke={LINE_INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M148,163 L148,175" stroke={CERAMIC_DEEP} strokeWidth="0.5" opacity="0.6" />
      <path d="M143,166 L143,177" stroke={CERAMIC_DEEP} strokeWidth="0.5" opacity="0.5" />
      {/* hairline crack — a single sharp V at full stroke-width read as a
          bold chevron/icon once scaled up, not a fracture. Two disjoint,
          thin, low-opacity segments instead. */}
      <path d="M142,169 L145,172" stroke={CRACK_GLOW} strokeWidth="0.4" strokeLinecap="round" opacity="0.55" />
      <path d="M146,174 L144,177" stroke={CRACK_GLOW} strokeWidth="0.4" strokeLinecap="round" opacity="0.5" />
      <circle cx="150" cy="175" r="1" fill={RUST} opacity="0.7" />
      </g>

      {/* ---------- tubing / harness network (§3). Phase 2: the runs are no
          longer pure smooth bezier — each has a visible kink partway along
          (real hose has slack, it doesn't draw like a diagram line), plus
          ribbed-segment ticks throughout, not just at the neck. Bulb bases
          are wound collars now, not a flat rect cap. ---------- */}
      <path
        d="M100,80 C90,81 80,82 76,85 L68,90 M100,80 C112,81 122,83 128,86 L132,86
           M100,88 L100,98 L99,99 L100,110 M84,150 C83,158 85,162 83,168 L84,178
           M108,150 C109,158 107,163 109,170 L108,184"
        stroke={TUBE}
        strokeWidth="3.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M100,80 C90,81 80,82 76,85 L68,90 M100,80 C112,81 122,83 128,86 L132,86"
        stroke={TUBE_DEEP}
        strokeWidth="1"
        fill="none"
        opacity="0.6"
      />
      {/* ribbed ticks along every run, generated rather than hand-placed
          per segment so all four runs get consistent texture */}
      {[
        [72, 87.5, -20], [78, 84, -14], [84, 82, -8],
        [116, 84, 18], [122, 85.5, 12],
        [82, 158, 3], [82, 168, -4],
        [110, 158, -3], [110, 170, 4],
      ].map(([x, y, r]) => (
        <path
          key={`${x}-${y}`}
          d={`M${x - 1.4},${y} L${x + 1.4},${y}`}
          stroke={TUBE_DEEP}
          strokeWidth="0.55"
          opacity="0.65"
          transform={`rotate(${r}, ${x}, ${y})`}
        />
      ))}
      {BULBS.map((b, i) => (
        <g key={`${b.x}-${b.y}`}>
          <circle cx={b.x} cy={b.y + b.r - 0.5} r="2.6" fill="none" stroke={BULB_CAP} strokeWidth="1.3" />
          <rect x={b.x - 1.6} y={b.y + b.r - 1.2} width="3.2" height="2.6" fill={BULB_CAP} />
          <g className="vg-bulb" filter="url(#vg-glow)" style={{ animationDelay: `${i * 0.47}s` }}>
            <circle cx={b.x} cy={b.y} r={b.r} fill={BULB_GLOW} opacity={0.55 + b.bright * 0.35} />
          </g>
          <circle cx={b.x} cy={b.y} r={b.r} fill="none" stroke={LINE_INK} strokeWidth="0.5" opacity="0.5" />
        </g>
      ))}

      {/* The weapon-bearing arm used to be drawn here, before the head and
          the beam. That meant the beam painted over the entire arm and the
          gripping hand vanished behind it — the figure read as a slab
          balanced on a stub. The arm now renders AFTER the beam (search
          "weapon_arm" below), so the hand visibly grips it. Paint order is
          the whole fix; see the group's own comment. */}

      {/* ============================================================
          Head & scarf complex — phase-1 redraw. Everything below this
          point carries an inked outline (LINE_INK, three weights) on top
          of its gradient fill; the torso/arms/legs above don't yet. That
          split is deliberate, not an inconsistency — the head is the part
          under redraw this pass; the rest gets the same treatment later
          rather than half-matching it now.
          ============================================================ */}
      <g id="character_generator_servant">
        <g id="head_complex">
          {/* ---------- scarf, rear layer — peeks up beside the jaw from
              behind the mask, drawn before the mask so it's the mask that
              occludes its centre rather than the other way around. Pure
              depth cue: without it the mask reads as floating on top of
              the collar instead of wrapped into it. ---------- */}
          {/* ============================================================
              SCARF — phase-3 rebuild. Previously one smooth lozenge with a
              highlight band across it, which read as a neck pillow. It is
              now five separately-drawn overlapping wraps, each with its own
              ink edge, sharp corner nodes, and a different angle — so the
              eye reads wound cloth with visible layer edges rather than a
              single inflated shape. Deliberately not symmetric: the bulk
              sits left-of-centre and the loose tail hangs on the left only.
              ============================================================ */}
          <g id="scarf_wrap_back">
            <path
              d="M70,52 L64,64 L62,78 L70,88 L82,84 L76,68 L82,54 Z"
              fill={WRAP_DEEP}
              stroke={LINE_INK}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M128,50 L136,62 L138,78 L130,90 L118,84 L124,66 L119,52 Z"
              fill={WRAP_DEEP}
              stroke={LINE_INK}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </g>

          <g id="scarf_wrap_front">
            {/* wrap 1 — the base band. Compressed vertically from the first
                attempt (was y60-97, a 37-unit slab that read as a bib on a
                58-unit head); it now sits y62-88 so it reads as a collar. */}
            <path
              d="M58,84 L56,73 L66,64 L80,61 L94,65 L108,62 L124,66 L138,63
                 L145,71 L146,84 L138,90 L120,86 L102,90 L82,86 L66,90 Z"
              fill="url(#vg-wrap)"
              stroke={LINE_INK}
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* wrap 2 — crosses over the base at a different angle, its
                lower edge visible as a hard step */}
            <path
              d="M60,78 L76,83 L94,79 L114,84 L134,80 L145,85 L144,90
                 L124,94 L102,90 L80,94 L60,89 Z"
              fill={WRAP_MID}
              stroke={LINE_INK}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {/* wrap 3 — a narrow upper band tucked under the jaw, offset
                left so the wrap doesn't read as centred */}
            <path
              d="M68,70 L84,66 L100,70 L118,66 L131,70 L129,76 L112,73
                 L96,77 L79,73 L68,76 Z"
              fill={WRAP_LIGHT}
              fillOpacity="0.45"
              stroke={LINE_INK}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* wrap 4 — the loose tail, hanging on the left only, with a
                torn tip. This is what breaks the symmetry most. */}
            <path
              d="M60,86 L52,98 L48,116 L54,130 L64,124 L59,108 L67,92 Z"
              fill={WRAP_MID}
              stroke={LINE_INK}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path d="M54,130 L57,124 L59,131 L64,124" stroke={LINE_INK} strokeWidth="1.1" fill="none" strokeLinejoin="round" />
            {/* wrap 5 — frayed hem. First attempt used 13 uniform 6-unit
                triangles, which read as a saw blade / cartoon collar. Real
                fraying is irregular: varied notch width, varied depth, and
                several places where the edge barely breaks at all. */}
            <path
              d="M64,88 L66,93 L69,89 L73,95 L76,90 L79,91 L83,97 L86,90
                 L91,92 L94,96 L98,90 L103,94 L106,89 L110,90 L114,96 L118,90
                 L123,93 L126,89 L131,94 L135,90 L139,92 L141,87
                 L120,86 L100,90 L80,86 Z"
              fill={WRAP_DEEP}
              stroke={LINE_INK}
              strokeWidth="1"
              strokeLinejoin="round"
            />
            {/* fabric tension lines — fanning from where the wrap is
                pulled tightest (left of the jaw), not evenly spaced */}
            <g fill="none" stroke={LINE_INK} strokeWidth="1.2" strokeLinecap="round" opacity="0.45">
              <path d="M71,68 C76,75 78,81 77,87" />
              <path d="M85,66 C88,74 89,80 88,87" />
              <path d="M119,68 C118,75 118,81 120,87" />
            </g>
            {/* stitched glow-line, kept from the previous pass */}
            <path
              d="M68,74 C82,80 118,80 132,74"
              stroke="#eef2e6"
              strokeWidth="0.9"
              fill="none"
              opacity="0.5"
              filter="url(#vg-softGlow)"
            />
          </g>

          <g className="vg-head">
          {/* ---------- gas mask structure — an asymmetric dome (flatter
              lower-right, a brow ridge upper-left) rather than a perfect
              circle, a separate jaw/filter plate with its own rivets and a
              hex vent-cluster, and two hose ports low on the jaw. ---------- */}
          <g id="gas_mask_structure">
            <path
              id="mask_dome"
              d="M71,46 C69,28 83,15 100,15 C118,15 132,29 129,48
                 C127,60 118,68 108,70 L92,70 C81,68 72,58 71,46 Z"
              fill="url(#vg-mask)"
              stroke={LINE_INK}
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <path
              d="M71,46 C69,28 83,15 100,15 C118,15 132,29 129,48
                 C127,60 118,68 108,70 L92,70 C81,68 72,58 71,46 Z"
              fill="url(#vg-gloss)"
            />
            {/* dome seam — a construction line, not decoration; the plate
                edge the jaw unit below is bolted to */}
            <path
              d="M75,52 C85,56 115,56 125,52"
              stroke={LINE_INK}
              strokeWidth="0.7"
              fill="none"
              opacity="0.7"
            />
            {[80, 88, 96, 104, 112, 120].map((x, i) => (
              <circle
                key={x}
                cx={x}
                cy={53.5 - Math.abs(3 - i) * 0.6}
                r="0.9"
                fill={GUNMETAL_LIGHT}
                stroke={LINE_INK}
                strokeWidth="0.3"
              />
            ))}

            {/* jaw / filter plate — its own piece, bolted on, not part of
                the dome's silhouette */}
            <path
              id="jaw_plate"
              d="M82,54 C82,51 88,49 100,49 C112,49 118,51 118,54
                 L115,68 C112,71 106,73 100,73 C94,73 88,71 85,68 Z"
              fill="url(#vg-mask)"
              stroke={LINE_INK}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {[87, 93.5, 100, 106.5, 113].map((x) => (
              <circle key={x} cx={x} cy="51.5" r="0.9" fill={GUNMETAL_LIGHT} stroke={LINE_INK} strokeWidth="0.3" />
            ))}

            {/* hex vent cluster — a filter canister set into the jaw
                plate's lower-right, asymmetric on purpose */}
            <rect
              x="99"
              y="53.5"
              width="17"
              height="13"
              rx="2.4"
              fill="url(#vg-gunmetal)"
              stroke={LINE_INK}
              strokeWidth="1"
            />
            {VENT_HEXES.map((h) => (
              <path key={`${h.x}-${h.y}`} d={hexPath(h.x, h.y, h.r)} fill={GUNMETAL_DEEP} stroke={LINE_INK} strokeWidth="0.35" />
            ))}
            {[[100.5, 55], [100.5, 65], [114.5, 55], [114.5, 65]].map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="0.7" fill={RIVET} />
            ))}

            {/* wiring ports — where the neck tubes physically attach,
                low on the jaw's bare side (opposite the vent cluster) */}
            {[89, 97].map((x) => (
              <g key={x}>
                <rect x={x - 1.6} y="65.5" width="3.2" height="4" rx="0.8" fill={GUNMETAL_DEEP} stroke={LINE_INK} strokeWidth="0.4" />
                <circle cx={x} cy="67.2" r="0.7" fill={GUNMETAL_LIGHT} />
              </g>
            ))}

            {/* antenna, with a base collar where each meets the dome —
                the previous pass had bare lines with no attachment */}
            {[
              { bx: 76, by: 26, tx: 62, ty: 12 },
              { bx: 124, by: 26, tx: 138, ty: 12 },
            ].map((a) => (
              <g key={a.bx}>
                <path d={`M${a.bx},${a.by} L${a.tx},${a.ty}`} stroke={MASK_MID} strokeWidth="2.2" strokeLinecap="round" />
                <circle cx={a.bx} cy={a.by} r="1.6" fill={GUNMETAL_LIGHT} stroke={LINE_INK} strokeWidth="0.4" />
                <circle cx={a.tx} cy={a.ty} r="1.1" fill={GUNMETAL_DEEP} />
              </g>
            ))}
          </g>

          {/* ---------- eyes — recessed sockets with a two-layer glow
              (a tight bright core plus a soft outer bloom, blurred by
              different amounts) instead of one flat glowing shape, and a
              thin lens rim so the light reads as sitting behind glass. ---------- */}
          <g id="glowing_eyes">
            {[
              { cx: 86.5, cy: 40 },
              { cx: 113.5, cy: 40 },
            ].map((e) => (
              <g key={e.cx}>
                <ellipse cx={e.cx} cy={e.cy} rx="7.5" ry="8.5" fill={MASK_DARK} opacity="0.9" />
                <g filter="url(#vg-softGlow)">
                  <ellipse cx={e.cx} cy={e.cy} rx="6" ry="7" fill={EYE_GLOW} opacity="0.35" />
                </g>
                <g filter="url(#vg-glow)">
                  <path
                    d={`M${e.cx - 5},${e.cy} C${e.cx - 6},${e.cy - 4} ${e.cx - 4},${e.cy - 8} ${e.cx},${e.cy - 8}
                        C${e.cx + 3},${e.cy - 8} ${e.cx + 4},${e.cy - 2} ${e.cx + 1},${e.cy + 3}
                        C${e.cx - 2},${e.cy + 6} ${e.cx - 4},${e.cy + 4} ${e.cx - 5},${e.cy} Z`}
                    fill={EYE_GLOW}
                  />
                </g>
                <ellipse cx={e.cx} cy={e.cy} rx="7.5" ry="8.5" fill="none" stroke={LINE_INK} strokeWidth="0.8" opacity="0.8" />
              </g>
            ))}
          </g>

          {/* ---------- mask insignia — an original stamped mark (a
              triangle inside a ring, one radiating tick beneath), not a
              reproduction of anything in the reference. Deliberately
              abstract/geometric rather than a wordmark. ---------- */}
          <g id="mask_insignia" stroke={LINE_INK} strokeWidth="0.6" strokeLinejoin="round" fill="none" opacity="0.75">
            <circle cx="100" cy="24" r="4.2" />
            <path d="M100,20.6 L103,26.4 L97,26.4 Z" />
            <path d="M100,29.2 L100,31" strokeLinecap="round" />
          </g>
          </g>
        </g>
      </g>

      {/* ---------- red tubes, neck — connect the jaw's wiring ports down
          to the same collarbone junction (100,80) the torso network
          already starts from, so the two segments read as one continuous
          run rather than two systems that happen to meet. Drawn after the
          mask so the connector collars sit crisply on top of the jaw's
          lower edge. ---------- */}
      <g id="red_tubes_neck">
        <path d="M89,69.5 C87,73 86,76 88,80" stroke={TUBE} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M97,69.5 C98,74 99,77 100,80" stroke={TUBE} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        {/* ribbed-hose ticks, perpendicular to the run */}
        {[71.5, 74.5, 77.5].map((y, i) => (
          <path key={`l${y}`} d={`M${86.5 - i * 0.6},${y} L${89.5 - i * 0.6},${y}`} stroke={TUBE_DEEP} strokeWidth="0.5" opacity="0.7" />
        ))}
        {[71.5, 74.5, 77.5].map((y, i) => (
          <path key={`r${y}`} d={`M${96.5 + i * 0.3},${y} L${99.5 + i * 0.3},${y}`} stroke={TUBE_DEEP} strokeWidth="0.5" opacity="0.7" />
        ))}
        {/* connector collars, roughly mid-run */}
        <circle cx="87" cy="75" r="1.4" fill="none" stroke={GUNMETAL_LIGHT} strokeWidth="0.9" />
        <circle cx="98.5" cy="75" r="1.4" fill="none" stroke={GUNMETAL_LIGHT} strokeWidth="0.9" />
      </g>

      {/* ============================================================
          LEFT ARM — hanging at the side. The beam this arm used to hold
          overhead is gone, so the raised/bent pose went with it.

          The whole group is a MIRROR of the right arm: it reuses the right
          arm's exact path coordinates under translate(196,0) scale(-1,1),
          which maps x to 196-x and lands them on the left side of the body.
          Writing it that way rather than hand-authoring a second set of
          coordinates is what guarantees the two hands are genuinely
          identical rather than approximately so — a mirrored transform
          cannot drift from its source the way two hand-typed paths do.

          Only the FILLS differ: this sleeve is cloth where the right is
          riveted leather plate. That asymmetry is deliberate and is the
          character's one piece of real hardware (spec §3) — an even
          loadout on both arms reads as a soldier, not a servant.
          ============================================================ */}
      <g className="vg-arm-l">
      <g id="left_arm" transform="translate(196,0) scale(-1,1)">
        {/* sleeve — same silhouette as the armoured plate opposite, in cloth */}
        <path
          d="M132,90 C130,84 134,80 140,80 C146,80 152,84 151,90
             L153,120 L156,121 L153,124
             L153,146 C153,152 148,155 143,155 C138,155 133,152 133,146
             L136,145 L133,143 Z"
          fill="url(#vg-wrap)"
          stroke={LINE_INK}
          strokeWidth="4"
        />
        {/* drape folds instead of the opposite arm's rivet bands */}
        <g fill="none" stroke={LINE_INK} strokeWidth="1.8" opacity="0.5">
          <path d="M137,96 C135,110 135,126 137,142" />
          <path d="M147,94 C149,108 149,126 147,142" />
        </g>
        <circle cx="145" cy="128" r="6" fill="url(#vg-rust)" />
        {/* wrist cuff — identical geometry to the right cuff */}
        <path
          d="M139,150 C139,148 142,147 146,147 C151,147 155,148 155,150
             L155,156 C155,158 151,159 146,159 C142,159 139,158 139,156 Z"
          fill={WRAP_DEEP}
          stroke={LINE_INK}
          strokeWidth="2.5"
        />
        {/* bare ceramic forearm + mitt — the SAME paths as the right hand */}
        <path d="M147,158 L146,166" stroke="url(#vg-ceramic)" strokeWidth="8" />
        <path
          d="M139,168 C138,164 141,161 146,161 C151,161 154,164 153,168
             C155,172 154,177 150,179 L148,176 C147,178 144,178 143,176
             L141,179 C137,177 137,172 139,168 Z"
          fill="url(#vg-ceramic)"
          stroke={LINE_INK}
          strokeWidth="2.5"
        />
        <path d="M148,163 L148,175" stroke={CERAMIC_DEEP} strokeWidth="0.5" opacity="0.6" />
        <path d="M143,166 L143,177" stroke={CERAMIC_DEEP} strokeWidth="0.5" opacity="0.5" />
        <path d="M142,169 L145,172" stroke={CRACK_GLOW} strokeWidth="0.4" opacity="0.55" />
        <path d="M146,174 L144,177" stroke={CRACK_GLOW} strokeWidth="0.4" opacity="0.5" />
        <circle cx="150" cy="175" r="1" fill={RUST} opacity="0.7" />
      </g>
      </g>
    </svg>
  );
}

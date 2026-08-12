/* ============================================================
   Corvid — 2D figure. Special Forces, 1 of 5.
   Role: field medic / salvage specialist.

   BATCH 1 (done) built the base masses and passed the 80px silhouette gate
   — see docs/crew3d/corvid-spec.md's status note for the two structural
   revisions that took to get there (the coat was cut, then the brim was
   cut in favour of a fitted helmet). BATCH 2 (done) added head detail.
   BATCH 3 (done) added the satchel rig, the data-slate pouch, and vest
   quilt seams. BATCH 4 (done) added the arms — the figure had none before
   — plus the held tool, and carried REVISION 4, which replaced the whole
   rust trader palette with obsidian black/white and a lava glow. BATCH 5
   (done) added leg detail: a second strut hinge, plating scratches, and
   grime at four locations. BATCH 6 (done) closes out the detail inventory
   (tool-grip wear) and adds motion: an idle weight-shift and tool drift,
   plus a touch reaction — head tilt, then the tool raises. Full brief:
   docs/crew3d/corvid-spec.md

   Two silhouette choices carry the whole shape at this stage:

     the shoulders   broad and square — the figure's widest point since the
                      brim was cut in REVISION 3, and the main reason the
                      figure reads as male at a glance
     the legs        one fully suited in hard plate segments, one a bare
                      mechanical strut — the figure's primary asymmetry now
                      that the brim is gone, promoted from second to lead

   Conventions carried over from VigilFigure2D.tsx / BallastFigure2D.tsx:
   module-top colour constants, a <defs> gradient block (prefixed `cv-` so
   this figure can share a page with the other two without id collisions),
   stroke linecap/linejoin set once on the root, the `silhouette` prop
   pattern from Ballast — flat black, no stroke, for the 80px gate — and now
   the `interactive` + animation-restart pattern too: a class can't be
   re-added to restart a CSS animation while it's already present, so poke()
   removes the class, forces a reflow, then re-adds it. */

import { useCallback, useEffect, useRef } from 'react';
import './corvidFigure2D.css';

const INK = '#221f22';

/* ---------- REVISION 4 — palette, obsidian and lava.
   Rust trader (copper/umber/jade) is retired. Direction: black hull with a
   white gradient highlight, and lava glowing through the plate seams and
   the eyes rather than a flat jade accent. The two-material system stays
   (a glossy hull material and a flatter case material, same as copper/umber
   before) — only the hues and the glow change, not the construction. */
const OBSIDIAN_HI = '#f4f4f7';
const OBSIDIAN_MID = '#5c5c66';
const OBSIDIAN_LO = '#0a0a0d';
const CASE_HI = '#28282e';
const CASE_MID = '#151519';
const CASE_LO = '#08080a';
/** flat, for thin strokes — piping, fin highlights, plate-seam cracks —
 *  where a radial gradient wouldn't read at 1-2 units wide. */
export const LAVA = '#ff6a2a';
const LAVA_HOT = '#ffe066';
const LAVA_EDGE = '#c81e05';

/** deterministic scatter — no Math.random() in render output, so a reload
 *  and a screenshot always agree. Same helper, same reason, as Vigil and
 *  Ballast. Exported now, unused until the weathering batch. */
export function hash(i: number, salt = 0): number {
  const s = Math.sin(i * 63.7 + salt * 19.11) * 17431.27;
  return s - Math.floor(s);
}

export type CorvidFigure2DProps = {
  /** rendered width in px; height follows the 200x300 viewBox */
  size?: number;
  /**
   * Renders every shape flat black on a light ground — the spec §2 gate.
   * Same contract as Ballast's prop: a devtools fiddle can't be re-run on
   * every batch, so the check is one click instead.
   */
  silhouette?: boolean;
  /** set false to render a completely inert figure — no idle, no reaction */
  interactive?: boolean;
};

export function CorvidFigure2D({ size, silhouette = false, interactive = true }: CorvidFigure2DProps) {
  /* In silhouette mode every fill collapses to one flat black and strokes
     drop out entirely — an outline would fatten the shape and flatter the
     read, defeating the point of the test. Same helper as Ballast. */
  const f = (fill: string) => (silhouette ? '#050505' : fill);
  const stroke = silhouette ? 'none' : INK;

  const ref = useRef<SVGSVGElement>(null);

  /* Same mechanism as Vigil and Ballast: a class already present cannot be
     re-added to restart its animation, so it has to come off, force a
     reflow, then go back on. */
  const poke = useCallback(() => {
    const el = ref.current;
    if (!el || !interactive || silhouette) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.classList.remove('is-poked');
    void el.getBoundingClientRect().width;
    el.classList.add('is-poked');
  }, [interactive, silhouette]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    /* Only cv-head-tilt ends the run. It has no delay (cv-tool-raise does,
       0.3s) and the same 1.6s duration as the delayed animation's total
       span, so the two finish together — listening for this one alone is
       enough, the same "one animation owns clearing the class" guard Vigil
       and Ballast both use. */
    const done = (e: AnimationEvent) => {
      if (e.animationName === 'cv-head-tilt') el.classList.remove('is-poked');
    };
    el.addEventListener('animationend', done);
    return () => el.removeEventListener('animationend', done);
  }, []);

  return (
    <svg
      ref={ref}
      className={interactive && !silhouette ? 'cv-figure' : undefined}
      viewBox="0 0 200 300"
      width={size}
      height={size == null ? undefined : size * 1.5}
      role={interactive && !silhouette ? 'button' : 'img'}
      tabIndex={interactive && !silhouette ? 0 : undefined}
      aria-label={
        interactive && !silhouette
          ? 'Corvid — a bird-masked field medic and salvager. Tap to get its attention.'
          : 'Corvid — a bird-masked field medic and salvager, one leg a mechanical strut, tools slung at the hip'
      }
      onPointerDown={interactive && !silhouette ? poke : undefined}
      onKeyDown={
        interactive && !silhouette
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
        <linearGradient id="cv-obsidian" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={OBSIDIAN_HI} />
          <stop offset="45%" stopColor={OBSIDIAN_MID} />
          <stop offset="100%" stopColor={OBSIDIAN_LO} />
        </linearGradient>
        <linearGradient id="cv-case" x1="0.15" y1="0" x2="0.75" y2="1">
          <stop offset="0%" stopColor={CASE_HI} />
          <stop offset="60%" stopColor={CASE_MID} />
          <stop offset="100%" stopColor={CASE_LO} />
        </linearGradient>
        <radialGradient id="cv-lava" cx="0.5" cy="0.4" r="0.65">
          <stop offset="0%" stopColor={LAVA_HOT} />
          <stop offset="55%" stopColor={LAVA} />
          <stop offset="100%" stopColor={LAVA_EDGE} />
        </radialGradient>
      </defs>

      {/* ---------- BATCH 1 · base masses, back to front ----------
          Legs first (they sit furthest back — the robe hem overlaps their
          tops), then the robe, then the vest, then the neck placeholder,
          then the brim, then the crown last so its base cleanly overlaps
          the brim's inner seam the way a real hat sits. */}

      {/* ---------- REVISION 2.
          The open coat fixed the dress read but replaced it with a second
          problem: two flared cloth panels at the hip is a shape that reads
          as loose, baggy trousers — soft, fashion-cut, not gear. Direction
          was explicit: no soft draped cloth at all, more overtly a suited
          figure, and unambiguously read as male. All three come from the
          same fix, so the coat is gone rather than shrunk:

          1. The organic leg is now built as hard SUIT SEGMENTS — a flared
             hip plate, a shin plate, a boot — alternating the two hull
             materials the way a real pressure suit alternates hard and
             soft sections, rather than one soft column with cloth draped
             over it.
          2. The strut leg keeps NO covering at all — bare mechanical rod,
             full length, from the hip down. That asymmetry (one leg fully
             plated, one leg deliberately exposed) replaces the coat's
             "longer hem on one side" asymmetry and reads harder-edged.
          3. The torso stays broad-shouldered from REVISION 1, but now
             extends further down (to y168 instead of y160) so it bridges
             the gap between the two legs at the hip — there is no coat
             there anymore to cover that seam, so the vest has to. */}

      {/* ---------- REVISION 6 — both legs rebuilt, direct instruction:
          make the legs unique and unmistakably "spacey," and give the
          suited side proper magnetic boots (never actually built before —
          the sole had a line suggesting one, not an actual detail).

          Both legs now lean into the character's own name for the first
          time. "Corvid" has driven the head (beak, goggle eyes) since
          batch 2, but the legs were generic mecha-leg language — straight
          plated column vs. straight bare rod. Now:

          - the SUITED leg keeps its two-material plate system but ends in
            a taloned, padded magnetic boot — blunt toe segments, not claws,
            because it's protected.
          - the STRUT leg is rebuilt as a reverse-jointed bird leg — the
            angle real avian legs bend at, which nothing else on this
            figure or on Vigil/Ballast uses — with a lava power core
            glowing down its exposed length, ending in bare sharp talons.
            Padded vs. clawed is the new version of the suited/bare
            contrast the spec always wanted; it just reads far more
            distinctly now than two rectangles ever did. */}

      {/* suited leg — hip plate, now with an angled rather than flat lower
          edge, and shin plate. */}
      <path
        d="M44,158 L50,203 L86,198 L88,158 Z"
        fill={f('url(#cv-obsidian)')}
        stroke={stroke}
        strokeWidth="4"
      />
      <path
        d="M52,205 L48,252 L84,255 L82,200 Z"
        fill={f('url(#cv-case)')}
        stroke={stroke}
        strokeWidth="4"
      />
      {!silhouette && <path d="M53,203 L79,204" stroke={LAVA} strokeWidth="1.6" opacity="0.85" />}
      {!silhouette && <ellipse cx="64" cy="206" rx="10" ry="3.5" fill={INK} opacity="0.25" transform="rotate(3 64 206)" />}

      {/* magnetic boot — the direct answer to "add proper magnetic boots."
          Blunt padded toe segments (two notch lines splitting the front
          into three pads) each carrying its own small glowing contact
          stud — the magnetic part made visible rather than implied by a
          sole line. */}
      <path
        d="M46,252 L44,272 L48,282 L80,282 L82,272 L80,252 Z"
        fill={f('url(#cv-obsidian)')}
        stroke={stroke}
        strokeWidth="4"
      />
      {!silhouette && (
        <>
          <path d="M45,272 L81,272" stroke={INK} strokeWidth="1.4" opacity="0.5" fill="none" />
          <path d="M58,274 L58,282" stroke={INK} strokeWidth="1.2" opacity="0.5" fill="none" />
          <path d="M68,274 L68,282" stroke={INK} strokeWidth="1.2" opacity="0.5" fill="none" />
          <circle cx="52" cy="280" r="2.2" fill={LAVA} opacity="0.9" />
          <circle cx="64" cy="280" r="2.2" fill={LAVA} opacity="0.9" />
          <circle cx="76" cy="280" r="2.2" fill={LAVA} opacity="0.9" />
          <ellipse cx="52" cy="277" rx="6" ry="2.6" fill={INK} opacity="0.3" transform="rotate(-8 52 277)" />
        </>
      )}

      {/* ---------- strut — reverse-jointed bird leg ----------
          Upper thigh straight down from the hip, then the reverse-knee
          bend (the joint kicks BACK, opposite a human knee — the same
          angle a bird's leg reads at), then the tarsus runs back forward
          to the ankle, then bare talons. The zigzag in the x-coordinates
          across the three segments below IS the joint; there's no separate
          "bend" shape, the geometry does it. */}
      <path
        d="M126,158 L140,160 L132,206 L118,204 Z"
        fill={f('url(#cv-obsidian)')}
        stroke={stroke}
        strokeWidth="4"
      />
      {!silhouette && <path d="M131,162 L124,203" stroke={LAVA} strokeWidth="1.5" opacity="0.8" />}

      {/* reverse-knee — the first hinge, and the joint that actually reads
          as avian rather than generic mecha. */}
      <path d="M117,203 L133,207" stroke={f(INK)} strokeWidth="2.5" fill="none" />
      {!silhouette && <path d="M119,205 L131,205" stroke={LAVA} strokeWidth="1.8" opacity="0.9" />}

      <path
        d="M120,208 L134,206 L138,257 L124,259 Z"
        fill={f('url(#cv-obsidian)')}
        stroke={stroke}
        strokeWidth="4"
      />
      {!silhouette && <path d="M129,211 L133,255" stroke={LAVA} strokeWidth="1.5" opacity="0.8" />}
      {!silhouette && (
        <g stroke={OBSIDIAN_HI} strokeWidth="0.9" opacity="0.4" fill="none">
          <path d="M123,220 L128,226" />
          <path d="M130,240 L126,245" />
        </g>
      )}

      {/* ankle — second hinge, lighter treatment matching the bolt-collar
          approach the first pass used, still valid here. */}
      {!silhouette && (
        <>
          <path d="M124,258 L138,258" stroke={INK} strokeWidth="1.3" opacity="0.55" fill="none" />
          <circle cx="131" cy="258" r="2.4" fill={f('url(#cv-case)')} stroke={INK} strokeWidth="1" />
        </>
      )}
      {!silhouette && <ellipse cx="130" cy="242" rx="7" ry="2.4" fill={INK} opacity="0.28" />}

      {/* bare talons — three forward, one back spur. Sharp where the boot's
          toes are blunt; that contrast is the whole point. */}
      <path d="M118,261 L113,286 L120,288 L125,263 Z" fill={f('url(#cv-obsidian)')} stroke={stroke} strokeWidth="2.5" />
      <path d="M126,261 L124,291 L133,291 L133,261 Z" fill={f('url(#cv-obsidian)')} stroke={stroke} strokeWidth="2.5" />
      <path d="M135,261 L141,287 L147,285 L138,261 Z" fill={f('url(#cv-obsidian)')} stroke={stroke} strokeWidth="2.5" />
      <path d="M128,259 L119,253 L124,258 L131,261 Z" fill={f('url(#cv-case)')} stroke={stroke} strokeWidth="2" />
      {!silhouette && <circle cx="129" cy="263" r="1.8" fill={LAVA} opacity="0.7" />}

      {/* ---------- BATCH 6 · motion ----------
          Everything from here to the straps is wrapped in .cv-torso, which
          carries the idle weight-shift (spec §7: "a slow weight-shift onto
          the strut leg and back"). The legs above stay outside this group
          deliberately — they're what the weight shifts ONTO, so they have
          to stay planted while the mass above them leans. */}
      <g className="cv-torso">

      {/* vest — same broad-shouldered block as REVISION 1, extended down to
          y168-178 (was y160-168) specifically to bridge the gap between the
          hip plate's inner edge and the strut's inner edge now that no coat
          covers that seam. Painted after both legs, so it sits on top and
          closes the join cleanly rather than leaving bare background
          showing between them. */}
      <path
        d="M56,112 Q100,104 144,112 L136,170 Q100,178 64,170 Z"
        fill={f('url(#cv-case)')}
        stroke={stroke}
        strokeWidth="4"
      />

      {/* quilt seams — three thin arcs following the vest's own curve
          (matching its Q100,104 shoulder line and Q100,178 waist line),
          not straight lines laid over a curved surface. */}
      {!silhouette && (
        <g stroke={INK} strokeWidth="1.2" opacity="0.4" fill="none">
          <path d="M62,128 Q100,122 138,128" />
          <path d="M60,144 Q100,137 140,144" />
          <path d="M58,160 Q100,152 142,160" />
        </g>
      )}

      {/* ---------- BATCH 4 · arms & held tool ----------
          The figure had no arms at all before this. Painted here — after
          the vest, before the satchel/pouch/straps below — so those props
          (worn OVER a suited arm) naturally occlude whatever part of the
          upper arms falls under them, the same layering logic the straps
          already use against the beak vent.

          Asymmetric on purpose, matching every other pairing on this
          figure: the left arm hangs relaxed at the side; the right arm is
          bent at the elbow, angled out and down, gripping the held tool
          mid-task rather than at rest (spec §3). Two segments per arm
          (upper arm, forearm) with a quilt seam at the elbow, matching the
          vest's own quilting rather than introducing a new texture. */}

      {/* ---------- REVISION 5 — arm geometry.
          First render exposed two problems, both from the render→critique
          loop rather than guessed at in advance:

          1. The left arm hung almost straight down at x38-58, which is
             almost entirely INSIDE the satchel's own footprint (x46-92).
             Painting the satchel after the arm (intentional, so the strap
             crosses over it) meant the satchel didn't just overlap the
             arm, it nearly erased it — only a sliver of hand showed. Fixed
             by bending the elbow outward so the forearm swings clear of
             the satchel's x-range instead of straight down through it.
          2. The right arm's elbow bent one direction and the forearm bent
             back the other, then the tool haft reversed again — a
             shoulder-to-elbow-to-hand-to-tool zigzag that read as
             disconnected pieces rather than one gripping arm. Fixed by
             keeping every segment (upper arm, forearm, hand, tool haft)
             sweeping the same general down-and-outward direction, so the
             eye can follow it as one continuous line. */}

      {/* left arm — elbow bends outward at y152 specifically to clear the
          satchel (x46-92) by the time it reaches hip height. */}
      <path d="M44,120 L58,120 L48,155 L36,152 Z" fill={f('url(#cv-case)')} stroke={stroke} strokeWidth="3.5" />
      <path d="M48,153 L36,150 L28,200 L40,203 Z" fill={f('url(#cv-case)')} stroke={stroke} strokeWidth="3.5" />
      <path d="M27,198 L41,201 L39,214 L25,211 Z" fill={f('url(#cv-obsidian)')} stroke={stroke} strokeWidth="3" />
      {!silhouette && <path d="M39,153 L46,151" stroke={INK} strokeWidth="1" opacity="0.5" />}

      {/* ---------- REVISION 6 — arm pose.
          Direction: change the pose. The old one reached the tool far out
          to the right, past the figure's own silhouette — readable, but it
          put the most detailed prop on the figure out where it competes
          with open space instead of with the rest of the kit. Pulled in
          tight now: the elbow tucks close to the ribs and the hand ends up
          near the hip, by the satchel, so the tool reads as held AT THE
          READY against the body rather than reaching for something. */}
      <g className="cv-tool-arm">
      <path d="M144,120 L158,120 L166,144 L154,148 Z" fill={f('url(#cv-case)')} stroke={stroke} strokeWidth="3.5" />
      <path d="M160,146 L152,148 L146,180 L136,176 Z" fill={f('url(#cv-case)')} stroke={stroke} strokeWidth="3.5" />
      <path d="M134,176 L148,180 L144,192 L130,188 Z" fill={f('url(#cv-obsidian)')} stroke={stroke} strokeWidth="3" />
      {!silhouette && <path d="M159,145 L153,147" stroke={INK} strokeWidth="1" opacity="0.5" />}

      {/* geology pick — gripped close to the body now, haft angled down
          and slightly out rather than reaching away from the figure. */}
      <path d="M138,188 L156,204" stroke={f('url(#cv-case)')} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M152,197 L164,190 L167,198 L157,208 Z" fill={f('url(#cv-obsidian)')} stroke={stroke} strokeWidth="2.5" />
      {/* grip wear — detail item 14, the last one on the inventory. Two
          short worn-highlight scuffs right where a hand actually closes
          around the haft, not scattered along its whole length. */}
      {!silhouette && (
        <g stroke={OBSIDIAN_HI} strokeWidth="0.8" opacity="0.35" fill="none">
          <path d="M140,191 L144,194" />
          <path d="M143,196 L147,199" />
        </g>
      )}
      </g>

      {/* ---------- BATCH 3 · satchel rig & data-slate pouch ----------
          Direction for this batch: keep the space read. Every prop here is
          a hard case or a metal tool, nothing soft — the multi-tool is a
          folded rectangle, the injector is a tapered metal cylinder, the
          gauge is a lit hardware readout, and both the satchel and the
          data-slate pouch are flat-sided cases with their own distinct
          clasp styles (spec detail item 13), not leather bags. Satchel on
          the suited-leg side, data-slate on the strut side — opposite hips,
          so the front doesn't read as evenly loaded (spec §3). */}

      {/* satchel body — hard case, left hip. */}
      <rect x="46" y="144" width="46" height="24" rx="3" fill={f('url(#cv-case)')} stroke={stroke} strokeWidth="3" />
      {/* satchel corner grime — item 18's first two locations, bottom
          corners only (the two that actually knock against the leg when
          walking; the top corners don't). */}
      {!silhouette && (
        <>
          <ellipse cx="50" cy="166" rx="4" ry="2.4" fill={INK} opacity="0.3" />
          <ellipse cx="88" cy="166" rx="4" ry="2.4" fill={INK} opacity="0.3" />
        </>
      )}

      {/* multi-tool — folded rectangle with a hinge line, not an open shape. */}
      <rect x="50" y="149" width="12" height="14" rx="1.5" fill={f('url(#cv-obsidian)')} stroke={stroke} strokeWidth="1.6" />
      {!silhouette && <path d="M50,156 L62,156" stroke={INK} strokeWidth="1" opacity="0.5" />}

      {/* fuel-cell gauge — the hero prop. Three segments, one dim: this
          reads as equipment that has actually been used, not a full battery
          icon. Stacked with real gaps, not one bar with two lines drawn
          on it, so a segment can genuinely be a different opacity. */}
      <rect x="66" y="149" width="12" height="5" rx="1" fill={f('url(#cv-lava)')} stroke={stroke} strokeWidth="1.4" />
      <rect x="66" y="156" width="12" height="5" rx="1" fill={f('url(#cv-lava)')} stroke={stroke} strokeWidth="1.4" opacity={silhouette ? 1 : 0.85} />
      <rect x="66" y="163" width="12" height="5" rx="1" fill={f('url(#cv-lava)')} stroke={stroke} strokeWidth="1.4" opacity={silhouette ? 1 : 0.4} />

      {/* cryo-injector — tapered metal cylinder, not a syringe drawn in
          fabric colours. Its own small clip loop separate from the satchel
          body (detail item 12), rather than just tucked into a slot. */}
      <path d="M82,149 L90,149 L90,160 L86,168 L82,160 Z" fill={f('url(#cv-obsidian)')} stroke={stroke} strokeWidth="1.6" />
      <circle cx="86" cy="145" r="3" fill="none" stroke={f('url(#cv-obsidian)')} strokeWidth="2" />

      {/* data-slate pouch — right hip, opposite the satchel. Flat case with
          its own clasp style (a tab, not the satchel's rivets) so it reads
          as a different piece of kit, not the same case mirrored. */}
      <rect x="108" y="148" width="30" height="20" rx="2" fill={f('url(#cv-case)')} stroke={stroke} strokeWidth="3" />
      <rect x="118" y="145" width="10" height="6" rx="1" fill={f('url(#cv-obsidian)')} stroke={stroke} strokeWidth="1.4" />

      {/* ---------- BATCH 2 · head detail ----------
          Quilt collar first (painted before the helmet, same as the old
          placeholder rect was, so the helmet's jaw naturally overlaps its
          top ~10 units — a collar tucked under a chin, not floating above
          it). Goggles and the beak vent come after the helmet below, so
          they sit in front of the shell the way a face plate should.

          Everything through the antenna fins below is wrapped in .cv-head
          for the touch reaction (spec §7: "the head tilts toward the
          viewer" is the FIRST half of the gesture — see
          corvidFigure2D.css for how its timing is staggered against
          .cv-tool-arm's raise so the two don't happen simultaneously). No
          idle motion on this group; unlike the tool, the spec doesn't ask
          the head to move at rest. */}
      <g className="cv-head">

      {/* quilt collar — wraps wider than the old placeholder (x64-136, was
          x82-118) and its bottom edge is three irregular scallops rather
          than a rounded rect. Widened deliberately past the beak vent's
          own span (x80-120, below) so the outer two scallops and their
          piping stay visible instead of being drawn over — the first pass
          made the collar almost the same footprint as the beak, and the
          beak (painted after) erased it completely. */}
      <path
        d="M64,120 L136,120 L128,130 Q120,148 112,132 Q100,156 88,132
           Q80,148 72,130 Z"
        fill={f('url(#cv-case)')}
        stroke={stroke}
        strokeWidth="3"
      />
      {/* lava piping — traces only the scalloped edge, not the whole
          collar outline. A second thin stroke riding on top of the ink,
          same technique as Ballast's brass trim lines. */}
      {!silhouette && (
        <path
          d="M128,130 Q120,148 112,132 Q100,156 88,132 Q80,148 72,130"
          fill="none"
          stroke={LAVA}
          strokeWidth="1.4"
        />
      )}

      {/* ---------- REVISION 3 — the helmet, replacing the brim entirely.
          The wide brim was the hero silhouette element through two
          revisions, but direction was explicit: drop it, not reshape it —
          a floppy wide brim reads as civilian/scavenger headgear, not
          spacesuit. A fitted dome is closer to what Sentinel, Cryo and
          Voyager himself wear, so Corvid now shares that headgear FAMILY
          rather than standing apart from it.

          That means the brim's job — carrying the figure's silhouette
          identity — moves elsewhere. Two things pick it up:

          1. The antenna fins below: two, unequal length, rising from one
             side only, never a matched pair. The closest thing left to the
             brim's asymmetry.
          2. The body's own asymmetry, already built in REVISION 2 — one leg
             fully plated, one leg bare mechanical rod — which was always
             the figure's SECOND silhouette carrier and is now effectively
             promoted to co-lead now that the brim is gone. */}
      <path
        d="M100,18 L136,30 L150,68 Q150,100 128,120 L108,132 L92,132
           L72,120 Q50,100 50,68 L64,30 Z"
        fill={f('url(#cv-obsidian)')}
        stroke={stroke}
        strokeWidth="4"
      />
      {/* ---------- REVISION 6 — the broken panel.
          Direction: make the head "so unique" — nothing else on this
          figure, and nothing on Vigil or Ballast, does this. A section of
          the dome plating on the same side as the antenna fins has broken
          away entirely, revealing the lava-lit inner framework underneath
          rather than just a crack drawn on an intact surface. The old
          single crack line is kept, shortened, as the fracture that
          presumably caused this — leading down and away from the cavity
          rather than existing on its own.

          Built as a surface overlay INSIDE the dome's existing silhouette
          rather than as a cut in the outer path itself — the outer shape
          already passed the 80px three-way gate through two revisions, and
          re-opening that shape risks it for a detail-level change that
          doesn't need to touch it. */}
      <path
        d="M114,40 L132,36 L142,52 L134,60 L140,70 L122,76 L110,60 Z"
        fill={f(CASE_LO)}
        stroke={stroke}
        strokeWidth="2.5"
      />
      {!silhouette && (
        <>
          <ellipse cx="124" cy="47" rx="5" ry="3" fill={LAVA} opacity="0.85" />
          <ellipse cx="128" cy="64" rx="6" ry="3.5" fill={LAVA} opacity="0.8" />
          <ellipse cx="120" cy="72" rx="4" ry="2.5" fill={LAVA} opacity="0.75" />
          <g stroke={CASE_HI} strokeWidth="1.6" fill="none">
            <path d="M116,48 L136,44" />
            <path d="M114,60 L138,58" />
            <path d="M118,70 L132,68" />
          </g>
          <path
            d="M114,40 L132,36 L142,52 L134,60 L140,70 L122,76 L110,60 Z"
            fill="none"
            stroke={OBSIDIAN_HI}
            strokeWidth="1"
            opacity="0.5"
          />
          <path d="M118,76 L110,88 L116,98" stroke={LAVA} strokeWidth="1.5" opacity="0.8" fill="none" />
        </>
      )}

      {/* goggle lenses — open glass, not grille-covered like Ballast's eyes.
          Deliberately NOT identical: the left is bigger and sits a touch
          lower than the right, the same "don't mirror it" rule the whole
          figure follows. Each is a rim collar (the case-material ring) with
          a lava lens glowing inside it — the radial gradient gives it a hot
          core rather than a flat glowing disc. */}
      <circle cx="84" cy="108" r="11" fill={f('url(#cv-case)')} stroke={stroke} strokeWidth="2.5" />
      <circle cx="84" cy="108" r="7.5" fill={f('url(#cv-lava)')} stroke="none" />
      <circle cx="116" cy="105" r="9.5" fill={f('url(#cv-case)')} stroke={stroke} strokeWidth="2.5" />
      <circle cx="116" cy="105" r="6.5" fill={f('url(#cv-lava)')} stroke="none" />

      {/* beak vent / respirator — hangs down over the CENTRE of the collar
          only, narrower than the collar (x80-120 vs the collar's x64-136)
          so the collar's outer scallops and piping stay visible either
          side of it rather than being drawn over. Horizontal vent-slats
          (batch-2 detail item 3) break up what would otherwise be a smooth
          cone, and get progressively narrower toward the tip because the
          beak itself tapers. */}
      <path
        d="M80,112 Q100,106 120,112 L114,140 Q100,152 86,140 Z"
        fill={f('url(#cv-obsidian)')}
        stroke={stroke}
        strokeWidth="3.5"
      />
      {!silhouette && (
        <g stroke={INK} strokeWidth="1.4" opacity="0.55">
          <path d="M88,121 L112,121" fill="none" />
          <path d="M90,130 L110,130" fill="none" />
          <path d="M92,138 L108,138" fill="none" />
        </g>
      )}

      {/* antenna fins — unequal length and angle, both rooted on the
          helmet's right side, never a matched pair. Each carries a highlight
          down one edge now, and the two highlights deliberately don't match
          — different width, different opacity — so the pair reads as two
          distinct fins rather than one fin duplicated. */}
      <path
        d="M116,28 L121,-6 L126,30 Z"
        fill={f('url(#cv-obsidian)')}
        stroke={stroke}
        strokeWidth="3"
      />
      {!silhouette && <path d="M121,-6 L126,30" stroke={OBSIDIAN_HI} strokeWidth="1.1" opacity="0.6" fill="none" />}
      <path
        d="M130,32 L141,-18 L138,36 Z"
        fill={f('url(#cv-obsidian)')}
        stroke={stroke}
        strokeWidth="3"
      />
      {!silhouette && <path d="M130,32 L141,-18" stroke={OBSIDIAN_HI} strokeWidth="1.6" opacity="0.85" fill="none" />}
      </g>

      {/* ---------- straps, painted LAST ----------
          First pass drew these right after the vest, before any head
          detail — so the beak vent (batch 2), painted afterward, fell
          directly on top of the crossing point and erased the ring and
          most of both straps. A chest strap sits in FRONT of chin-mounted
          gear on a real rig, not behind it, so the fix is paint order, not
          new geometry: these render over the beak the same way a strap
          would actually cross in front of a hanging respirator. */}
      <path d="M126,116 L68,142" stroke={f('url(#cv-case)')} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M74,116 L122,144" stroke={f('url(#cv-case)')} strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="100" cy="130" r="4" fill={f('url(#cv-obsidian)')} stroke={stroke} strokeWidth="1.6" />
      </g>
    </svg>
  );
}

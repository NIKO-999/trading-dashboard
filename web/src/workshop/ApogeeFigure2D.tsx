import { useCallback, useEffect, useRef } from 'react';
import './apogeeFigure2D.css';

/* ============================================================
   Apogee — 2D figure. Special Forces, 2 of 5.
   Role: EVA specialist — external repair, zero-g maneuvering.

   BATCH 1 (done): base masses, gated against Vigil/Ballast/Corvid at 80px.
   BATCH 2 (done): visor HUD marks, the face glimpsed through the glass,
   nozzle glow, neck ring banding. BATCH 3 (done): reel spokes, cable wrap
   ticks, glowing connector tip, magnetic boot studs, glove seams. BATCH 4
   (done): weathering, plus motion — the tether sways at rest and snaps on
   touch, the one part of this figure that moves like a loose object rather
   than a rigid limb. REVISION 3 (done): palette flip to black/grey + lava
   (see comment below), pipes, expanded smudge pass. REVISION 4 (done): the
   glimpsed face became an actual skull with glowing lava eyes, on direct
   instruction. REVISION 5 (done): more surface detail on request — brow
   ridge, sagittal/temple cracks and socket rims on the skull; a torso
   center seam, shoulder rivets, forearm and shin panel seams, and extra
   scuffs on the body. REVISION 6 (done): the skull scaled up ~1.3x within
   the dome, on direct instruction ("skull should be bigger"). REVISION 7
   (done): skull nudged lower in the dome ("make it lower"). REVISION 8
   (done): a lot more shoulder/body detail on direct instruction — pauldrons,
   a chest cross-panel, a waist belt with buckle, forearm and thigh straps.
   REVISION 9-11 (done): an explicit over-detail pass, told to keep going
   until it reads as too much — pack grille/bolts/hazard stripe, neck ring
   third band, helmet rim highlight and second scuff, reel casing bolts,
   glove finger seams, boot toe caps and tread, pipe mounting brackets and
   second beads. REVISION 10 also added a soft pulsing lava aura behind the
   whole figure ("go super extra"). REVISION 12 (done): a cape, on direct
   instruction — built and named as a thermal radiator mantle (foil
   gradient, an irregular vented/notched hem with a lava trim glow, idle
   drift + touch flutter) rather than fabric, so it stays in the EVA-suit
   vocabulary ("make it look like a space version"). Painted first, so it
   reads as hanging behind the whole figure — this is a real trade-off,
   flagged rather than hidden: the cape now covers most of the matched-limb
   silhouette that was §2's original differentiator from Corvid at the 80px
   gate, though the gate still holds (the bell/notched-hem shape is now the
   distinguishing read instead). REVISION 13 (done): a starfield lining on
   the cape's visible flanks/hem, shoulder clasps as its attachment
   hardware, and a jaw crack + temple sensor node on the skull. REVISION 14
   (done): four classic real-EVA-suit tells, on direct instruction ("make
   it look like an astronaut") — a gold sun-visor flipped part-way up over
   the dome (the single most recognizable astronaut cue, and this figure
   had none of it), a chest-mounted control unit with switches/buttons/
   status line, an invented ringed-star mission patch (not a real flag or
   agency mark), and a strapped-on checklist cuff on each wrist. Full
   brief: docs/crew3d/apogee-spec.md

   ---------- WHY THIS CHARACTER EXISTS ----------

   Direct feedback on Corvid: none of the three crew members built so far
   commit to *astronaut*. Vigil is a wasteland servant, Ballast an armoured
   sentinel, Corvid a bird-masked medic — all sci-fi vocabulary, none of
   them a spacesuit in the literal sense. Apogee is that gap.

   ---------- HOW THIS AVOIDS REPEATING CORVID ----------

   Corvid's identity is mismatched limbs plus a broken helmet panel.
   Apogee's arms and legs are bulky and MATCHED instead — close to
   mirrored, the way Vigil's are. The asymmetry lives entirely in the
   tether reel (one hip only) and an uneven three-nozzle thruster cluster.
   Two crew members leaning on the same trick would make the roster feel
   smaller than it is.

   This also directly answers separate feedback that Corvid's limbs read
   too thin: built generously from batch 1, not thinned first and widened
   later. Arms and legs here are 24-32 units wide — compare Corvid's
   original strut leg at 14.

   ---------- THE FOUR-WAY GATE ----------

   At 80px, flattened to one colour, Apogee has to read as its own thing
   against Vigil (narrow spike), Ballast (wide anvil) AND Corvid (broad
   shoulders, mismatched legs). Its read: a round glass head over a wide
   thruster pack — the pack is the widest point, the same silhouette role
   Ballast's mantle and Corvid's shoulders play, but a soft dome above it
   rather than a faceted or cracked one.
   ============================================================ */

const INK = '#221f22';

/* ---------- REVISION 3 — palette, black/grey and lava.
   Direct instruction, given knowingly: this duplicates Corvid's register
   (obsidian black/white hull, lava glow) rather than the eggshell/cyan
   identity Apogee had through batches 1-4. Flagged before building — Corvid
   already owns black/grey + lava — and the answer was to use it anyway.
   Kept as its own named revision rather than silently overwriting the old
   constants so that "why do these two look alike" has an answer in the
   code, not just in chat history. */
const BODY_HI = '#6b6f78';
const BODY_MID = '#35383f';
const BODY_LO = '#0e0f12';
/* flatter dark material: pack, visor frame, boots, pipes. */
const CASE_HI = '#2a2c31';
const CASE_MID = '#17181b';
const CASE_LO = '#08090a';
/** the glow — no longer unclaimed; this is deliberately the same register
 *  as Corvid's lava. See the REVISION 3 note above. */
export const LAVA = '#ff6a2a';
const LAVA_HOT = '#ffe066';
const LAVA_EDGE = '#c81e05';

/** deterministic scatter — no Math.random() in render output. Exported now,
 *  unused until the weathering batch, same convention as the other three
 *  figures. */
export function hash(i: number, salt = 0): number {
  const s = Math.sin(i * 41.3 + salt * 71.9) * 9821.17;
  return s - Math.floor(s);
}

export type ApogeeFigure2DProps = {
  /** rendered width in px; height follows the 200x300 viewBox */
  size?: number;
  /** flat black on a light ground, for the 80px gate — same contract as
   *  Ballast/Corvid's prop */
  silhouette?: boolean;
  /** set false to render a completely inert figure — no idle, no reaction */
  interactive?: boolean;
};

export function ApogeeFigure2D({ size, silhouette = false, interactive = true }: ApogeeFigure2DProps) {
  const f = (fill: string) => (silhouette ? '#050505' : fill);
  const stroke = silhouette ? 'none' : INK;

  const ref = useRef<SVGSVGElement>(null);

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
    const done = (e: AnimationEvent) => {
      if (e.animationName === 'ap-cable-pulse') el.classList.remove('is-poked');
    };
    el.addEventListener('animationend', done);
    return () => el.removeEventListener('animationend', done);
  }, []);

  return (
    <svg
      ref={ref}
      className={interactive && !silhouette ? 'ap-figure' : undefined}
      viewBox="0 0 200 300"
      width={size}
      height={size == null ? undefined : size * 1.5}
      role={interactive && !silhouette ? 'button' : 'img'}
      tabIndex={interactive && !silhouette ? 0 : undefined}
      aria-label={
        interactive && !silhouette
          ? 'Apogee — an EVA specialist in a full glass-domed spacesuit. Tap to get its attention.'
          : 'Apogee — an EVA specialist in a full glass-domed spacesuit, a thruster pack on its back and a tether reeled at one hip'
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
        <linearGradient id="ap-body" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={BODY_HI} />
          <stop offset="55%" stopColor={BODY_MID} />
          <stop offset="100%" stopColor={BODY_LO} />
        </linearGradient>
        <linearGradient id="ap-case" x1="0.15" y1="0" x2="0.75" y2="1">
          <stop offset="0%" stopColor={CASE_HI} />
          <stop offset="60%" stopColor={CASE_MID} />
          <stop offset="100%" stopColor={CASE_LO} />
        </linearGradient>
        <radialGradient id="ap-glass" cx="0.35" cy="0.3" r="0.75">
          <stop offset="0%" stopColor="#dfe6ea" />
          <stop offset="55%" stopColor="#8f9aa4" />
          <stop offset="100%" stopColor="#464e56" />
        </radialGradient>
        <radialGradient id="ap-lava" cx="0.5" cy="0.4" r="0.65">
          <stop offset="0%" stopColor={LAVA_HOT} />
          <stop offset="55%" stopColor={LAVA} />
          <stop offset="100%" stopColor={LAVA_EDGE} />
        </radialGradient>
        {/* REVISION 14 — gold sun-visor tint, on direct instruction ("make
            it look like an astronaut"). Every real EVA helmet's single most
            recognizable feature is the reflective gold visor, and this
            figure had nothing playing that role — just clear glass over a
            skull, which reads as "spooky" before it reads as "spacesuit."
            Modeled as the visor flipped part-way up (covers roughly the top
            third of the dome), not fully down, so the skull stays the
            payoff instead of getting hidden by the fix. */}
        <linearGradient id="ap-visor-gold" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#ffe9a8" />
          <stop offset="45%" stopColor="#e8b84b" />
          <stop offset="100%" stopColor="#8a6a1e" />
        </linearGradient>
        {/* REVISION 12 — cape material. On instruction ("make it look like
            a space version") this is built and named as a thermal
            radiator mantle, not fabric: a metallic case-tone gradient with
            a cooler mid-tone streak standing in for foil sheen, the same
            visual grammar as an emergency space blanket rather than cloth. */}
        <linearGradient id="ap-cape" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor={CASE_HI} />
          <stop offset="40%" stopColor="#3d4048" />
          <stop offset="70%" stopColor={CASE_MID} />
          <stop offset="100%" stopColor={CASE_LO} />
        </linearGradient>
        <clipPath id="ap-dome-clip">
          <path d="M58,55 Q58,10 100,8 Q142,10 142,55 Q142,90 118,100 L82,100 Q58,90 58,55 Z" />
        </clipPath>
        {/* REVISION 10 — aura, on direct instruction ("go super extra").
            A soft blurred lava glow behind the whole figure, so the eyes
            and pipes read as the visible symptom of something the whole
            suit runs hot with, not just two lit dots on an otherwise cold
            body. */}
        <filter id="ap-aura-blur" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {/* aura — drawn first, behind every other part of the figure, so it
          reads as light spilling out from behind rather than a decal on
          top. Wrapped in its own class for a slow idle pulse (see
          apogeeFigure2D.css); silhouette-gated like every other glow. */}
      {!silhouette && (
        <ellipse
          className="ap-aura"
          cx="100"
          cy="175"
          rx="95"
          ry="150"
          fill="url(#ap-lava)"
          opacity="0.22"
          filter="url(#ap-aura-blur)"
        />
      )}

      {/* ---------- REVISION 12 — cape, on direct instruction ("add cape,"
          then "make it look like a space version"). Framed as a thermal
          radiator mantle rather than fabric: the kind of foil sheeting an
          EVA suit vents excess heat through, which is also the in-world
          reason it's the one part of this figure that glows along its
          whole trailing edge instead of at discrete points. Attached at
          the neck/shoulder line and painted FIRST — before legs, pack,
          torso, arms — so it reads as hanging behind the whole body, only
          visible where it's wider than what's in front of it, same
          occlusion logic that governs the pack (REVISION 1/2 lesson).
          The hem is a deliberately IRREGULAR notch pattern (varying width
          AND depth), not a uniform zigzag — a lesson learned the hard way
          on other crew members' fraying and hems: even notches read as a
          sawtooth decal, not a torn or vented edge. ---------- */}
      <path
        d="M82,94 Q55,130 35,190 Q22,230 30,270 L38,290 L48,278 L60,294 L72,276 L85,291 L100,273 L115,292 L128,277 L142,293 L155,275 L170,288 L178,250 Q182,210 170,175 Q150,130 118,94 Q100,87 82,94 Z"
        fill={f('url(#ap-cape)')}
        stroke={stroke}
        strokeWidth="3.5"
        className="ap-cape"
      />
      {!silhouette && (
        <>
          {/* trim glow tracing the notched hem — the vented edge itself. */}
          <path
            d="M30,270 L38,290 L48,278 L60,294 L72,276 L85,291 L100,273 L115,292 L128,277 L142,293 L155,275 L170,288"
            fill="none"
            stroke={f('url(#ap-lava)')}
            strokeWidth="1.4"
            opacity="0.6"
          />
          {/* fold lines — irregular spacing and length, same "not a perfect
              fan" rule as everything else on this roster. */}
          <path d="M88,100 Q70,180 58,260" stroke={CASE_LO} strokeWidth="1" opacity="0.3" fill="none" />
          <path d="M100,98 Q98,190 96,270" stroke={CASE_LO} strokeWidth="1" opacity="0.25" fill="none" />
          <path d="M112,100 Q130,180 142,258" stroke={CASE_LO} strokeWidth="1" opacity="0.3" fill="none" />
          {/* two small heat-vent slats, standing in for the mechanism that
              would actually radiate a suit's excess heat through foil. */}
          <path d="M62,150 L74,146" stroke={CASE_HI} strokeWidth="1.2" opacity="0.35" fill="none" />
          <path d="M128,150 L140,144" stroke={CASE_HI} strokeWidth="1.2" opacity="0.35" fill="none" />
          {/* starfield lining — the literal answer to "make it look like a
              space version": the cape's inner face carries a scatter of
              pale flecks rather than more hardware, read against the dark
              foil the same way stars read against vacuum. Placed in the
              strips that actually stay visible past the torso/arms/legs
              (the flanks and the hem) rather than scattered blindly under
              parts that would just paint over them. */}
          <circle cx="26" cy="160" r="1.2" fill="#eef2f4" opacity="0.55" />
          <circle cx="24" cy="200" r="0.8" fill="#eef2f4" opacity="0.4" />
          <circle cx="28" cy="240" r="1" fill="#eef2f4" opacity="0.5" />
          <circle cx="174" cy="170" r="1" fill="#eef2f4" opacity="0.5" />
          <circle cx="176" cy="210" r="0.8" fill="#eef2f4" opacity="0.4" />
          <circle cx="173" cy="245" r="1.2" fill="#eef2f4" opacity="0.55" />
          <circle cx="55" cy="268" r="0.9" fill="#eef2f4" opacity="0.45" />
          <circle cx="95" cy="268" r="0.7" fill="#eef2f4" opacity="0.35" />
          <circle cx="135" cy="270" r="0.9" fill="#eef2f4" opacity="0.45" />
        </>
      )}

      {/* ---------- legs — bulky, matched, ending in magnetic boots ----------
          24 units wide at the thigh, 34 at the boot — wide on purpose,
          per the "too skinny" lesson from Corvid's first pass. Painted
          first; the torso and pack overlap their tops. */}
      <path
        d="M72,200 L96,202 L92,250 L68,250 Z"
        fill={f('url(#ap-body)')}
        stroke={stroke}
        strokeWidth="4"
      />
      {/* knee grime — batch 4. Where an EVA suit actually picks up marks:
          bracing against a hull, not an even wear pattern. */}
      {!silhouette && <ellipse cx="82" cy="238" rx="8" ry="4" fill={INK} opacity="0.22" transform="rotate(-6 82 238)" />}
      {/* REVISION 5 — outer-thigh scuff, part of the "more body detail"
          pass; the thigh had grime only at the knee before this. */}
      {!silhouette && <ellipse cx="90" cy="216" rx="5" ry="3" fill={INK} opacity="0.15" transform="rotate(-14 90 216)" />}
      {/* REVISION 8 — thigh restraint strap, left, matching the forearm
          straps and waist belt: this figure now carries visible kit
          fastenings at every major limb segment, not just the tether. */}
      {!silhouette && (
        <>
          <path d="M70,228 L94,226" stroke={f('url(#ap-case)')} strokeWidth="4" fill="none" strokeLinecap="round" />
          <rect x="78" y="223.5" width="6" height="5" rx="1" fill={f('url(#ap-case)')} stroke={stroke} strokeWidth="1" />
          <circle cx="81" cy="226" r="1" fill={f('url(#ap-lava)')} opacity="0.8" />
        </>
      )}
      <path
        d="M66,250 L94,250 L98,272 L94,286 L64,286 L60,272 Z"
        fill={f('url(#ap-case)')}
        stroke={stroke}
        strokeWidth="4"
      />
      {/* shin panel seam — REVISION 5, same panel-line vocabulary as the
          new forearm seams. */}
      {!silhouette && <path d="M68,264 L90,264" stroke={CASE_HI} strokeWidth="1" opacity="0.3" fill="none" />}
      {!silhouette && <ellipse cx="72" cy="280" rx="6" ry="3" fill={INK} opacity="0.25" transform="rotate(8 72 280)" />}
      {/* REVISION 11 — boot toe cap seam and sole tread, left. Over-detail
          pass, everything still bare gets a mark. */}
      {!silhouette && (
        <>
          <path d="M64,274 L94,274" stroke={CASE_HI} strokeWidth="1" opacity="0.35" fill="none" />
          <path d="M66,288 L70,284 M76,289 L80,285" stroke={CASE_LO} strokeWidth="1" opacity="0.4" fill="none" strokeLinecap="round" />
        </>
      )}
      {/* magnetic boot studs — batch 3. Three glowing contact pads along
          the sole, same language as Corvid's boot studs so the two crew
          members reading as "the ones with visible magnetic footwear"
          feel like a deliberate family trait, not a coincidence. */}
      {!silhouette && (
        <>
          <circle cx="70" cy="282" r="2" fill={f('url(#ap-lava)')} opacity="0.85" />
          <circle cx="79" cy="284" r="2" fill={f('url(#ap-lava)')} opacity="0.85" />
          <circle cx="88" cy="282" r="2" fill={f('url(#ap-lava)')} opacity="0.85" />
        </>
      )}
      <path
        d="M128,200 L104,202 L108,250 L132,250 Z"
        fill={f('url(#ap-body)')}
        stroke={stroke}
        strokeWidth="4"
      />
      {!silhouette && <ellipse cx="110" cy="216" rx="5" ry="3" fill={INK} opacity="0.15" transform="rotate(14 110 216)" />}
      {!silhouette && (
        <>
          <path d="M130,228 L106,226" stroke={f('url(#ap-case)')} strokeWidth="4" fill="none" strokeLinecap="round" />
          <rect x="116" y="223.5" width="6" height="5" rx="1" fill={f('url(#ap-case)')} stroke={stroke} strokeWidth="1" />
          <circle cx="119" cy="226" r="1" fill={f('url(#ap-lava)')} opacity="0.8" />
        </>
      )}
      <path
        d="M134,250 L106,250 L102,272 L106,286 L136,286 L140,272 Z"
        fill={f('url(#ap-case)')}
        stroke={stroke}
        strokeWidth="4"
      />
      {!silhouette && <path d="M110,264 L132,264" stroke={CASE_HI} strokeWidth="1" opacity="0.3" fill="none" />}
      {!silhouette && (
        <>
          <path d="M106,274 L136,274" stroke={CASE_HI} strokeWidth="1" opacity="0.35" fill="none" />
          <path d="M134,288 L130,284 M124,289 L120,285" stroke={CASE_LO} strokeWidth="1" opacity="0.4" fill="none" strokeLinecap="round" />
        </>
      )}
      {!silhouette && (
        <>
          <circle cx="112" cy="282" r="2" fill={f('url(#ap-lava)')} opacity="0.85" />
          <circle cx="121" cy="284" r="2" fill={f('url(#ap-lava)')} opacity="0.85" />
          <circle cx="130" cy="282" r="2" fill={f('url(#ap-lava)')} opacity="0.85" />
        </>
      )}

      {/* ---------- REVISION 2 — pack proportions.
          REVISION 1 fixed the paint order (pack behind, body in front) but
          the pack was still both wide AND tall enough to swallow the
          entire shoulder line — its bottom edge sat almost exactly where
          the arms began, so nothing of the torso showed between "pack"
          and "arms sprouting from it." The result read as a slab with
          three legs, not a backpack behind a body. Fixed by shortening the
          pack (bottom edge now well above the shoulder line, not level
          with it) and raising the shoulder line to match, so a real
          stretch of visible torso-and-arm sits below the pack before
          anything overlaps. Width is unchanged — it is still the widest
          single element, just no longer the tallest one too. ---------- */}

      {/* ---------- thruster pack — replaces the life-support-pack
          silhouette every other figure uses. Wider than the torso: the
          figure's widest point, same silhouette role as Ballast's mantle
          and Corvid's shoulders. Short enough now that it sits ABOVE the
          shoulder line rather than overlapping it. ---------- */}
      <path
        d="M36,100 L164,100 L158,138 L42,138 Z"
        fill={f('url(#ap-case)')}
        stroke={stroke}
        strokeWidth="4"
      />
      {/* pack corner scuffs — batch 4, both bottom corners, where a pack
          this wide actually catches on a hatch frame. */}
      {!silhouette && (
        <>
          <ellipse cx="44" cy="134" rx="5" ry="3" fill={INK} opacity="0.2" transform="rotate(-15 44 134)" />
          <ellipse cx="156" cy="134" rx="5" ry="3" fill={INK} opacity="0.2" transform="rotate(15 156 134)" />
        </>
      )}
      {/* REVISION 9 — over-detail pass, on explicit direction to keep going
          until it reads as too much. Pack gets a vent grille (heat has to
          go somewhere on a thruster pack), four corner bolts, and a small
          hazard stripe pair — the one place on the whole figure with a
          genuine two-tone warning marking rather than a plain scuff. */}
      {!silhouette && (
        <>
          <path d="M64,110 L64,128 M74,110 L74,128 M86,110 L86,128 M98,110 L98,128" stroke={CASE_LO} strokeWidth="1.4" opacity="0.4" fill="none" />
          <circle cx="42" cy="106" r="1.2" fill={CASE_LO} opacity="0.5" />
          <circle cx="158" cy="106" r="1.2" fill={CASE_LO} opacity="0.5" />
          <circle cx="42" cy="132" r="1.2" fill={CASE_LO} opacity="0.5" />
          <circle cx="158" cy="132" r="1.2" fill={CASE_LO} opacity="0.5" />
          <path d="M118,112 L128,108 M122,116 L132,112 M126,120 L136,116" stroke={LAVA} strokeWidth="1.6" opacity="0.5" fill="none" strokeLinecap="round" />
        </>
      )}
      {/* two nozzle stubs, uneven length and angle — the second half of
          this figure's asymmetry, alongside the tether. Both sit outside
          the torso's own width so they stay visible once the torso paints
          over the pack's centre. Each glows cyan at the tip — batch 2. */}
      <path d="M50,136 L44,158 L56,158 L58,136 Z" fill={f('url(#ap-case)')} stroke={stroke} strokeWidth="3" />
      <path d="M142,136 L150,156 L138,158 L134,136 Z" fill={f('url(#ap-case)')} stroke={stroke} strokeWidth="3" />
      {!silhouette && (
        <>
          <circle cx="50" cy="157" r="3.2" fill={f('url(#ap-lava)')} opacity="0.9" />
          <circle cx="144" cy="156" r="2.6" fill={f('url(#ap-lava)')} opacity="0.85" />
        </>
      )}

      {/* ---------- torso — suited, rounder-shouldered than Corvid's square
          block. A pressure suit, not armour plate. Shoulder line raised to
          y128, well below the pack's own bottom edge (y138 — wait, ABOVE
          in screen terms since y increases downward: the pack ends at 138
          and the torso begins at 128, a deliberate 10-unit overlap for a
          clean seam rather than a gap, with most of the torso's height
          fully clear of the pack below that. ---------- */}
      <path
        d="M68,128 Q100,120 132,128 L126,196 Q100,204 74,196 Z"
        fill={f('url(#ap-body)')}
        stroke={stroke}
        strokeWidth="4"
      />
      {/* torso smudge — REVISION 3 weathering pass, off-centre rather than
          dead-centre so it reads as a mark from leaning/bracing against
          something, not a symmetrical decal. */}
      {!silhouette && <ellipse cx="88" cy="168" rx="9" ry="5" fill={INK} opacity="0.18" transform="rotate(-10 88 168)" />}
      {/* REVISION 5 — torso surface detail, on request for "more detail on
          the body." A center seam (the suit's own zip/closure line) and a
          shoulder rivet at each attach point give the torso the same
          panel-line language the legs and pack already carry; a second,
          smaller upper-chest smudge answers "the body" without stacking
          everything onto the one existing mark. */}
      {!silhouette && (
        <>
          <path d="M100,130 L100,196" stroke={CASE_HI} strokeWidth="1" opacity="0.3" fill="none" />
          <circle cx="70" cy="130" r="1.3" fill={CASE_LO} opacity="0.5" />
          <circle cx="130" cy="130" r="1.3" fill={CASE_LO} opacity="0.5" />
          <ellipse cx="112" cy="140" rx="5" ry="3" fill={INK} opacity="0.15" transform="rotate(8 112 140)" />
        </>
      )}
      {/* REVISION 8 — a lot more detail on the body, on direct instruction.
          A second, horizontal chest panel line crosses the existing center
          seam (the suit reads as actual quartered paneling, not one bare
          slab with a single line down it), with a rivet at each of the
          four corners it creates — the same case-material accent already
          used at the shoulders. */}
      {!silhouette && (
        <>
          <path d="M80,146 L120,146" stroke={CASE_HI} strokeWidth="1" opacity="0.3" fill="none" />
          <circle cx="80" cy="146" r="1.1" fill={CASE_LO} opacity="0.45" />
          <circle cx="120" cy="146" r="1.1" fill={CASE_LO} opacity="0.45" />
          <circle cx="80" cy="188" r="1.1" fill={CASE_LO} opacity="0.4" />
          <circle cx="120" cy="188" r="1.1" fill={CASE_LO} opacity="0.4" />
        </>
      )}
      {/* ---------- REVISION 14 — chest-mounted control unit and a mission
          patch, on direct instruction ("make it look like an astronaut").
          The RCU (toggle switches plus two round buttons and a status line)
          is the single most recognizable piece of hardware on a real EVA
          suit's chest, and this figure had a bare panel where it should be.
          The patch is an invented crew emblem — a ringed star, not a real
          flag or agency mark — so it reads as "this is a mission" without
          borrowing anyone's actual insignia. ---------- */}
      <rect x="84" y="156" width="32" height="24" rx="2" fill={f('url(#ap-case)')} stroke={stroke} strokeWidth="2" />
      {!silhouette && (
        <>
          <rect x="88" y="160" width="5" height="4" fill={CASE_LO} opacity="0.6" />
          <rect x="95" y="160" width="5" height="4" fill={CASE_LO} opacity="0.6" />
          <rect x="102" y="160" width="5" height="4" fill={CASE_LO} opacity="0.6" />
          <circle cx="91" cy="172" r="2" fill={f('url(#ap-lava)')} opacity="0.85" />
          <circle cx="100" cy="172" r="2" fill={CASE_LO} opacity="0.7" />
          <path d="M107,170 L113,170" stroke={f('url(#ap-lava)')} strokeWidth="1.4" opacity="0.75" fill="none" />
          <path d="M88,176 L112,176" stroke={CASE_HI} strokeWidth="0.8" opacity="0.4" fill="none" />
        </>
      )}
      <circle cx="76" cy="136" r="6" fill={f('url(#ap-case)')} stroke={stroke} strokeWidth="1.6" />
      {!silhouette && (
        <>
          <circle cx="76" cy="136" r="4.2" fill="none" stroke={CASE_HI} strokeWidth="0.8" opacity="0.5" />
          <path d="M76,132 L77.2,135.2 L80.5,135.3 L77.8,137.3 L78.8,140.5 L76,138.6 L73.2,140.5 L74.2,137.3 L71.5,135.3 L74.8,135.2 Z" fill={f('url(#ap-lava)')} opacity="0.8" />
        </>
      )}
      {/* waist belt — a banded strap across the hips with a central buckle,
          the one piece of visible kit-carrying gear this figure had none
          of before. Painted after the torso and legs, over the seam
          between them, since a belt sits on top of both. */}
      <path d="M70,197 L130,197 L128,204 L72,204 Z" fill={f('url(#ap-case)')} stroke={stroke} strokeWidth="3" />
      {!silhouette && (
        <>
          <rect x="94" y="197.5" width="12" height="7" rx="1.5" fill={f('url(#ap-case)')} stroke={stroke} strokeWidth="1.2" />
          <circle cx="100" cy="201" r="1.6" fill={f('url(#ap-lava)')} opacity="0.85" />
          <path d="M74,199 L88,199" stroke={CASE_HI} strokeWidth="0.8" opacity="0.4" fill="none" />
          <path d="M112,199 L126,199" stroke={CASE_HI} strokeWidth="0.8" opacity="0.4" fill="none" />
        </>
      )}

      {/* ---------- arms — bulky, matched, close to mirrored. 24-26 units
          wide throughout, no taper to a thin wrist. Shoulder attach raised
          to y128-130 to match the torso, and pulled outward so each arm's
          inner edge sits AT the torso's own edge rather than overlapping
          into it — the two need a real seam between them, not a shared
          blob of the same colour. ---------- */}
      <path d="M42,130 L68,128 L64,172 L38,174 Z" fill={f('url(#ap-body)')} stroke={stroke} strokeWidth="4" />
      {/* forearm smudge, left — REVISION 3. Arms had no weathering at all
          before this; legs and pack did. */}
      {!silhouette && <ellipse cx="50" cy="192" rx="6" ry="3.5" fill={INK} opacity="0.2" transform="rotate(12 50 192)" />}
      <path d="M40,172 L64,170 L60,216 L36,218 Z" fill={f('url(#ap-body)')} stroke={stroke} strokeWidth="4" />
      {/* REVISION 5 — forearm panel line, both arms, same "more body detail"
          request. A short diagonal seam standing in for a plating segment,
          the same panel-line vocabulary the legs already use. */}
      {!silhouette && <path d="M42,182 L58,179" stroke={CASE_HI} strokeWidth="1" opacity="0.3" fill="none" />}
      {/* REVISION 8 — forearm restraint strap, left. Kit-carrying detail to
          match the new waist belt: a wrapped band with its own buckle,
          not just a scored line. */}
      {!silhouette && (
        <>
          <path d="M37,204 L61,202" stroke={f('url(#ap-case)')} strokeWidth="4" fill="none" strokeLinecap="round" />
          <rect x="46" y="199.5" width="6" height="5" rx="1" fill={f('url(#ap-case)')} stroke={stroke} strokeWidth="1" />
          <circle cx="49" cy="202" r="1" fill={f('url(#ap-lava)')} opacity="0.8" />
        </>
      )}
      {/* REVISION 14 — wrist checklist cuff, left. The strapped-on card a
          real EVA glove carries procedures on; sits just above the strap
          rather than replacing it. */}
      {!silhouette && (
        <>
          <rect x="39" y="188" width="14" height="9" rx="1" fill="#e8e2d0" stroke={stroke} strokeWidth="1" opacity="0.92" />
          <path d="M41,191 L51,191 M41,193.5 L51,193.5 M41,196 L48,196" stroke={CASE_LO} strokeWidth="0.7" opacity="0.6" fill="none" />
        </>
      )}
      <path d="M34,216 L62,218 L58,234 L30,232 Z" fill={f('url(#ap-case)')} stroke={stroke} strokeWidth="3" />
      {/* glove knuckle seam — batch 3, a single line rather than the
          bare block the glove was through batches 1-2. */}
      {!silhouette && <path d="M33,223 L59,225" stroke={CASE_HI} strokeWidth="1" opacity="0.4" fill="none" />}
      {/* REVISION 11 — glove finger seams, left. Turns the single knuckle
          line into four fingers, over-detail pass. */}
      {!silhouette && (
        <path
          d="M37,226 L36,232 M43,227 L42,233 M49,227 L48,233 M55,226 L54,232"
          stroke={CASE_LO}
          strokeWidth="0.8"
          opacity="0.35"
          fill="none"
          strokeLinecap="round"
        />
      )}

      <path d="M158,130 L132,128 L136,172 L162,174 Z" fill={f('url(#ap-body)')} stroke={stroke} strokeWidth="4" />
      {!silhouette && <ellipse cx="150" cy="192" rx="6" ry="3.5" fill={INK} opacity="0.2" transform="rotate(-12 150 192)" />}
      <path d="M160,172 L136,170 L140,216 L164,218 Z" fill={f('url(#ap-body)')} stroke={stroke} strokeWidth="4" />
      {!silhouette && <path d="M158,182 L142,179" stroke={CASE_HI} strokeWidth="1" opacity="0.3" fill="none" />}
      {!silhouette && (
        <>
          <path d="M163,204 L139,202" stroke={f('url(#ap-case)')} strokeWidth="4" fill="none" strokeLinecap="round" />
          <rect x="148" y="199.5" width="6" height="5" rx="1" fill={f('url(#ap-case)')} stroke={stroke} strokeWidth="1" />
          <circle cx="151" cy="202" r="1" fill={f('url(#ap-lava)')} opacity="0.8" />
        </>
      )}
      {/* REVISION 14 — wrist checklist cuff, right, mirrored. */}
      {!silhouette && (
        <>
          <rect x="147" y="188" width="14" height="9" rx="1" fill="#e8e2d0" stroke={stroke} strokeWidth="1" opacity="0.92" />
          <path d="M149,191 L159,191 M149,193.5 L159,193.5 M152,196 L159,196" stroke={CASE_LO} strokeWidth="0.7" opacity="0.6" fill="none" />
        </>
      )}
      <path d="M166,216 L138,218 L142,234 L170,232 Z" fill={f('url(#ap-case)')} stroke={stroke} strokeWidth="3" />
      {!silhouette && <path d="M141,223 L167,225" stroke={CASE_HI} strokeWidth="1" opacity="0.4" fill="none" />}
      {/* REVISION 11 — glove finger seams, right, mirrored. */}
      {!silhouette && (
        <path
          d="M145,226 L146,232 M151,227 L152,233 M157,227 L158,233 M163,226 L164,232"
          stroke={CASE_LO}
          strokeWidth="0.8"
          opacity="0.35"
          fill="none"
          strokeLinecap="round"
        />
      )}

      {/* ---------- REVISION 8 — shoulder pauldrons, both sides, on direct
          instruction ("a lot more detail on the shoulder"). Small curved
          case-material plates painted over the torso/arm seam at each
          shoulder, each with a highlight arc and a rivet, giving the
          shoulder line an actual piece of hardware rather than just the
          bare seam where two flat blocks meet. ---------- */}
      <path d="M40,127 Q54,118 70,129 L65,141 Q54,134 41,139 Z" fill={f('url(#ap-case)')} stroke={stroke} strokeWidth="3" />
      <path d="M160,127 Q146,118 130,129 L135,141 Q146,134 159,139 Z" fill={f('url(#ap-case)')} stroke={stroke} strokeWidth="3" />
      {!silhouette && (
        <>
          <path d="M44,127 Q54,121 66,130" stroke={CASE_HI} strokeWidth="1" opacity="0.4" fill="none" />
          <circle cx="54" cy="128" r="1.3" fill={CASE_LO} opacity="0.55" />
          <path d="M156,127 Q146,121 134,130" stroke={CASE_HI} strokeWidth="1" opacity="0.4" fill="none" />
          <circle cx="146" cy="128" r="1.3" fill={CASE_LO} opacity="0.55" />
        </>
      )}
      {/* REVISION 13 — cape shoulder clasps, moved here (rather than drawn
          with the cape itself) so they paint on top of the pack instead of
          underneath it — the cape is drawn first and the pack immediately
          after, so anything meant to read as "attached over both" has to
          be painted this late in the document to actually show. */}
      {!silhouette && (
        <>
          <circle cx="70" cy="122" r="2.2" fill={f('url(#ap-case)')} stroke={stroke} strokeWidth="1.2" />
          <circle cx="70" cy="122" r="0.9" fill={f('url(#ap-lava)')} opacity="0.8" />
          <circle cx="130" cy="122" r="2.2" fill={f('url(#ap-case)')} stroke={stroke} strokeWidth="1.2" />
          <circle cx="130" cy="122" r="0.9" fill={f('url(#ap-lava)')} opacity="0.8" />
        </>
      )}

      {/* ---------- tether reel & cable — the one asymmetry budget on this
          figure, spent entirely here rather than on the limbs. Mounted at
          the left hip only. The cable loops loose past the leg and ends
          clear of the body, floating rather than resting against it — the
          one deliberately zero-g touch on a figure that otherwise stands
          like everything else on the roster. ---------- */}
      <circle cx="50" cy="180" r="11" fill={f('url(#ap-case)')} stroke={stroke} strokeWidth="3" />
      <circle cx="50" cy="180" r="5" fill={f('url(#ap-body)')} stroke={stroke} strokeWidth="1.6" />
      {/* reel spokes — batch 3, so the drum reads as a real spool rather
          than a plain ring. Three, uneven spacing, matching the "nothing
          on this figure is a perfectly even pattern" rule the rest of the
          roster follows. */}
      {!silhouette && (
        <g stroke={INK} strokeWidth="1" opacity="0.4">
          <path d="M50,180 L50,171" />
          <path d="M50,180 L57,185" />
          <path d="M50,180 L44,187" />
        </g>
      )}
      {/* REVISION 9 — reel casing bolts, three around the drum's outer rim
          at uneven spacing, same "nothing perfectly even" rule as the
          spokes. */}
      {!silhouette && (
        <>
          <circle cx="50" cy="169" r="1" fill={CASE_LO} opacity="0.5" />
          <circle cx="59" cy="186" r="1" fill={CASE_LO} opacity="0.5" />
          <circle cx="41" cy="184" r="1" fill={CASE_LO} opacity="0.5" />
        </>
      )}
      {/* ---------- BATCH 4 · motion ----------
          Everything from the cable down is wrapped in .ap-tether. Spec §6:
          "the tether should be the thing that moves at rest — a slack
          cable makes sense swaying gently in a way a rigid limb doesn't."
          The reel drum itself stays OUTSIDE this group — it's bolted to
          the hip and shouldn't move; only the loose cable hanging off it
          should. Transform-origin sits at (46,190), where the cable
          actually leaves the reel, so it swings from that point rather
          than from its own bounding-box centre. */}
      <g className="ap-tether">
        <path
          d="M46,190 Q28,220 44,248 Q60,268 38,288 Q20,294 24,278"
          fill="none"
          stroke={f('url(#ap-case)')}
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* wrap marks along the cable — a few short crossing ticks, standing
            in for the segmented sheathing on a real umbilical rather than
            leaving it a bare smooth line for its whole length. */}
        {!silhouette && (
          <g stroke={CASE_HI} strokeWidth="1" opacity="0.5">
            <path d="M32,208 L38,212" />
            <path d="M46,250 L52,246" />
            <path d="M34,272 L28,276" />
          </g>
        )}
        {/* connector tip — glows now rather than sitting as a plain dark
            ball, selling "live connector floating clear of the body" over
            just "end of a rope." Carries its own class so the touch
            reaction can flare it independently of the cable's snap. */}
        <circle cx="24" cy="278" r="4" fill={f('url(#ap-case)')} stroke={stroke} strokeWidth="1.6" />
        {!silhouette && <circle className="ap-connector" cx="24" cy="278" r="2" fill={f('url(#ap-lava)')} opacity="0.85" />}
      </g>

      {/* ---------- neck ring — short banded collar where the dome seats
          onto the suit. Two band lines and a status light, batch 2 —
          otherwise this was just a plain rounded rect. ---------- */}
      <rect x="82" y="93" width="36" height="16" rx="6" fill={f('url(#ap-case)')} stroke={stroke} strokeWidth="3" />
      {!silhouette && (
        <>
          <path d="M84,98 L116,98" stroke={INK} strokeWidth="1" opacity="0.4" fill="none" />
          <path d="M84,104 L116,104" stroke={INK} strokeWidth="1" opacity="0.4" fill="none" />
          <circle cx="100" cy="101" r="1.8" fill={f('url(#ap-lava)')} opacity="0.85" />
          {/* REVISION 9 — third band and two collar bolts, over-detail pass. */}
          <path d="M86,95.5 L114,95.5" stroke={INK} strokeWidth="0.8" opacity="0.3" fill="none" />
          <circle cx="86" cy="101" r="1" fill={CASE_LO} opacity="0.5" />
          <circle cx="114" cy="101" r="1" fill={CASE_LO} opacity="0.5" />
        </>
      )}

      {/* ---------- helmet — full round glass dome, the widest and
          roundest head shape on the roster. Painted last so it sits
          forward of the neck ring and pack. ---------- */}
      <path
        d="M58,55 Q58,10 100,8 Q142,10 142,55 Q142,90 118,100 L82,100 Q58,90 58,55 Z"
        fill={f('url(#ap-glass)')}
        stroke={stroke}
        strokeWidth="4"
      />
      {/* visor scuff — REVISION 3, drawn OVER the glass rather than clipped
          with the face/HUD group, since a scratch sits on the outer
          surface, not glimpsed through it. Kept off to one side, clear of
          the eyes themselves, so it reads as wear on the glass rather than
          damage to the eyes it's meant to be weathering near. */}
      {!silhouette && <path d="M116,26 L124,34" stroke={CASE_HI} strokeWidth="1.2" opacity="0.4" fill="none" strokeLinecap="round" />}
      {/* REVISION 9 — second visor scuff and a rim highlight, over-detail
          pass. The rim highlight is a thin light arc tracing the inside of
          the frame at the top of the dome, selling curved glass catching
          light rather than a flat painted circle. */}
      {!silhouette && (
        <>
          <path d="M70,80 L76,86" stroke={CASE_HI} strokeWidth="1" opacity="0.3" fill="none" strokeLinecap="round" />
          <path d="M68,20 Q100,4 132,20" stroke="#eef2f4" strokeWidth="1.2" opacity="0.3" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* ---------- skull & HUD, seen through the glass ----------
          Spec §3: "a face is visible inside — first time on this roster."
          Clipped to the dome's own path so nothing escapes its silhouette.
          REVISION 4: the dim "glimpsed face" ellipse is now an actual
          skull — cranium, hollow eye sockets, nasal cavity, a suggestion
          of teeth at the jaw — on direct instruction ("skull within the
          glass"). Kept at the same low-opacity ink register as the old
          face silhouette (not full black) so it still reads as *seen
          through curved glass*, not drawn on top of it; the lava eyes are
          the one saturated thing in the group; the glass and the low
          opacity is what keeps this eerie rather than gory. */}
      {!silhouette && (
        <g clipPath="url(#ap-dome-clip)">
          {/* REVISION 6 — skull scaled up ~1.3x around its own center, on
              direct instruction ("skull should be bigger"). Scaling the
              group rather than hand-editing every coordinate keeps every
              proportion (socket spacing, jaw taper, brow arch) identical to
              the REVISION 4/5 version, just larger — and it's still clipped
              to the dome, so a bigger skull reads as filling more of the
              helmet rather than spilling out of it. The three HUD ticks
              stay outside this inner group so they don't scale with it —
              they're readouts on the glass, not part of the skull.
              REVISION 7: shifted down 8 units within the dome, on direct
              instruction ("make it lower") — the outer translate's y no
              longer matches the inner pivot's y, so the scale still happens
              around the skull's own center (no distortion) but the result
              lands lower in the helmet, closer to the jaw of the dome
              rather than centered in it. */}
          <g transform="translate(100,54) scale(1.3) translate(-100,-46)">
            <path
              d="M100,14 Q122,15 123,36 L122,54 Q121,64 114,70 L106,76 Q100,79 94,76 L86,70 Q79,64 78,54 L77,36 Q78,15 100,14 Z"
              fill={INK}
              opacity="0.4"
            />
            <path d="M82,40 Q89,36 96,40" stroke={INK} strokeWidth="1.2" opacity="0.35" fill="none" />
            <path d="M104,40 Q111,36 118,40" stroke={INK} strokeWidth="1.2" opacity="0.35" fill="none" />
            <path d="M100,16 L100,38" stroke={CASE_LO} strokeWidth="0.8" opacity="0.3" fill="none" />
            <path d="M112,20 L117,29" stroke={CASE_LO} strokeWidth="0.8" opacity="0.25" fill="none" />
            <path d="M82,58 Q88,68 96,74" stroke={INK} strokeWidth="1" opacity="0.25" fill="none" />
            <path d="M118,58 Q112,68 104,74" stroke={INK} strokeWidth="1" opacity="0.25" fill="none" />
            <path d="M100,52 L95,62 L105,62 Z" fill={CASE_LO} opacity="0.55" />
            <ellipse cx="89" cy="47" rx="7.5" ry="8.5" fill={CASE_LO} opacity="0.6" />
            <ellipse cx="111" cy="47" rx="7.5" ry="8.5" fill={CASE_LO} opacity="0.6" />
            <ellipse cx="89" cy="47" rx="7.5" ry="8.5" fill="none" stroke={INK} strokeWidth="0.8" opacity="0.35" />
            <ellipse cx="111" cy="47" rx="7.5" ry="8.5" fill="none" stroke={INK} strokeWidth="0.8" opacity="0.35" />
            <circle cx="89" cy="48" r="3.2" fill={f('url(#ap-lava)')} opacity="0.95" />
            <circle cx="111" cy="48" r="3.2" fill={f('url(#ap-lava)')} opacity="0.95" />
            <path
              d="M90,73 L91,77 M94,75 L95,79 M98,76 L98,80 M102,76 L102,80 M106,75 L105,79 M109,73 L108,77"
              stroke={INK}
              strokeWidth="1"
              opacity="0.3"
              fill="none"
              strokeLinecap="round"
            />
            {/* REVISION 13 — jaw hairline crack and a temple sensor node,
                keep-going pass. The sensor node reads as a small telemetry
                pickup rather than an ear (this skull has none), tying the
                head into the same instrumented-hardware language the new
                cape clasps just introduced at the shoulders. */}
            <path d="M92,78 L90,74" stroke={CASE_LO} strokeWidth="0.7" opacity="0.25" fill="none" />
            <circle cx="79" cy="56" r="1.4" fill={CASE_LO} opacity="0.55" />
            <circle cx="79" cy="56" r="0.6" fill={f('url(#ap-lava)')} opacity="0.7" />
          </g>
          <path d="M66,40 L75,38" stroke={LAVA} strokeWidth="1.3" opacity="0.55" fill="none" />
          <circle cx="131" cy="34" r="1.5" fill={f('url(#ap-lava)')} opacity="0.6" />
          <path d="M122,76 L131,74" stroke={LAVA} strokeWidth="1.1" opacity="0.5" fill="none" />
        </g>
      )}

      {/* ---------- REVISION 14 — gold sun-visor, flipped part-way up.
          Drawn on top of the skull/HUD group (still clipped to the dome),
          so it reads as a coating on the outside of the glass rather than
          something glimpsed inside it — the same distinction the visor
          scuff already relies on. A thin case-colored hinge bar at the
          visor's lower edge sells "this flips down over the rest of the
          glass" rather than "the top of the helmet is just gold." ---------- */}
      {!silhouette && (
        <g clipPath="url(#ap-dome-clip)">
          <path d="M58,42 Q58,10 100,8 Q142,10 142,42 Q121,50 100,50 Q79,50 58,42 Z" fill="url(#ap-visor-gold)" opacity="0.82" />
          <path d="M64,26 Q100,16 136,26" stroke="#fff6de" strokeWidth="1.4" opacity="0.4" fill="none" strokeLinecap="round" />
          <path d="M58,42 Q100,52 142,42" stroke={CASE_HI} strokeWidth="2" opacity="0.55" fill="none" />
        </g>
      )}

      {/* ---------- REVISION 3 — pipes.
          "Pipes coming from it": two conduits run from the underside of
          the pack down each arm to the wrist, and two more from the hip
          down each leg to the boot — thruster fuel/coolant lines, reading
          as the reason the whole figure runs warm enough to glow. Each is
          a thick dark stroke (the case material, not the body's own
          gradient, so it reads as a separate part bolted on rather than a
          seam in the suit) with 1-2 lava beads along its length rather
          than a continuous glowing tube — a bead reads as "something hot
          moving through a pipe," a fully lit tube just reads as a light
          fixture. Drawn last, on top of everything, since a conduit runs
          OVER the suit it's attached to. */}
      {!silhouette && (
        <>
          <path d="M46,140 Q34,170 42,196" stroke={f('url(#ap-case)')} strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="41" cy="168" r="2.2" fill={f('url(#ap-lava)')} opacity="0.85" />
          <circle cx="43" cy="185" r="1.4" fill={f('url(#ap-lava)')} opacity="0.6" />
          <path d="M154,140 Q166,170 158,196" stroke={f('url(#ap-case)')} strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="159" cy="168" r="2.2" fill={f('url(#ap-lava)')} opacity="0.85" />
          <circle cx="157" cy="185" r="1.4" fill={f('url(#ap-lava)')} opacity="0.6" />

          <path d="M78,204 Q70,226 76,248" stroke={f('url(#ap-case)')} strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="75" cy="230" r="2" fill={f('url(#ap-lava)')} opacity="0.8" />
          <circle cx="73" cy="242" r="1.2" fill={f('url(#ap-lava)')} opacity="0.55" />
          <path d="M122,204 Q130,226 124,248" stroke={f('url(#ap-case)')} strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="125" cy="230" r="2" fill={f('url(#ap-lava)')} opacity="0.8" />
          <circle cx="127" cy="242" r="1.2" fill={f('url(#ap-lava)')} opacity="0.55" />

          {/* REVISION 11 — mounting bracket clamps where each pipe leaves
              the body, so it reads as bolted-on hardware at the join
              rather than a line that just starts in mid-air. */}
          <rect x="42" y="137" width="8" height="4" rx="1" fill={f('url(#ap-case)')} stroke={stroke} strokeWidth="1" transform="rotate(-8 46 139)" />
          <rect x="150" y="137" width="8" height="4" rx="1" fill={f('url(#ap-case)')} stroke={stroke} strokeWidth="1" transform="rotate(8 154 139)" />
          <rect x="74" y="201" width="8" height="4" rx="1" fill={f('url(#ap-case)')} stroke={stroke} strokeWidth="1" transform="rotate(-8 78 203)" />
          <rect x="118" y="201" width="8" height="4" rx="1" fill={f('url(#ap-case)')} stroke={stroke} strokeWidth="1" transform="rotate(8 122 203)" />
        </>
      )}
    </svg>
  );
}

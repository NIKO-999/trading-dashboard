import { useCallback, useEffect, useRef } from 'react';
import './eclipseFigure2D.css';

/* ============================================================
   Eclipse — 2D figure. Special Forces, 3 of 5.
   Role: mission commander/pilot — flies the ship, gives the order.

   Direct instruction: "an actual astronaut" — dark purple with glowing
   white trim, built to docs/crew3d/build-standard.md from batch 1 (not
   detailed later as an afterthought). REVISION 2 (done): a further detail
   pass on request — comm antenna, helmet facet rivets, third neck-ring
   band, pack grille/readout/warning stripe, shoulder pauldrons, an
   invented rank-chevron patch, forearm/thigh panel lines, glove finger
   seams, boot toe caps and tread. REVISION 3 (done): another detail pass
   on request — tank pressure gauges + bands, torso side seams, bicep
   straps, glove thumb seams, ankle cuffs + shin panel lines, and twin
   comm pucks on the helmet jaw. REVISION 4/5 (done): legs and helmet
   specifically, on request — hip and ankle flex-joint bellows, thigh
   utility pockets, knee pad plates, boot heel seams; helmet facet seam
   lines, a locking-ring tick pattern at the base, a helmet-mounted
   camera (mirroring the antenna rather than duplicating it), and a
   second, dimmer visor highlight. REVISION 6 (done): a jetpack, on direct
   request — four small SAFER-style RCS thrusters at the pack's own
   corners, deliberately NOT a repeat of Apogee's big twin-nozzle thruster
   cluster (see the REVISION 6 comment at the jetpack itself for the full
   reasoning); each thruster tip fires a brief flare on touch. REVISION 7
   (done): colour variants, on request — see ECLIPSE_PALETTES below and
   spec §7. Every colour already funneled through a handful of named
   constants, so variants are just alternate values for those names,
   resolved per-render; no geometry changed. A fifth variant, `annular`
   (black body, lava-orange glow), was added after flagging that it
   repeats Corvid's/Apogee's register — user confirmed "use lava anyway,"
   same protocol as Apogee's own REVISION 3. REVISION 8 (done): real
   hands, on direct instruction ("their hands... kinda just look like one
   more arm falling") — the single glove trapezoid with etched finger
   lines is now a separate palm plus four individual finger volumes
   (uneven lengths) and an angled thumb, real geometry rather than a
   decal. REVISION 9 (done): clenched fists, on direct instruction — the
   open-hand fingers from REVISION 8 became rounded knuckle bumps along
   a single curled fist mass, with the thumb wrapped low across the
   front instead of angled out to the side. REVISION 10 (done): "face his
   fingers downward" — REVISION 9's fist was 24 wide by 16 tall, wider
   than it was tall, which read as sideways rather than hanging down;
   rebuilt taller and narrower (20x25) so the fist's own long axis points
   down the same way the arm does, with the thumb rotated to -38°/+38°
   (was -14°/+14°) so it wraps down the side rather than out across the
   front. Full brief: docs/crew3d/eclipse-spec.md

   ---------- WHY THIS CHARACTER EXISTS ----------

   Apogee earned real astronaut hardware (gold visor, chest RCU, mission
   patch, wrist cuffs — REVISION 14) but its silhouette and palette — black
   and lava, a draping cape, a skull glimpsed through the dome — read
   "gothic space reaper" before they read "astronaut." Eclipse is the clean
   version: a fully mirrored visor instead of a skull, a boxy twin-tank
   life-support pack instead of a cape, dark purple instead of black, white
   instead of lava.

   ---------- HOW THIS AVOIDS REPEATING APOGEE ----------

   Apogee's widest point is a draping, curved cape; Eclipse's is a boxy,
   rectangular twin-tank pack — same structural role (the widest silhouette
   element), different geometry language entirely. Apogee's helmet shows a
   skull through glass; Eclipse's helmet shows nothing — a flat mirror.
   Both figures have matched, symmetric limbs (neither spends its asymmetry
   budget there), so the read has to come from pack shape and helmet
   treatment, which is exactly where the two diverge.

   ---------- THE FIVE-WAY GATE ----------

   At 80px, flattened to one colour, Eclipse has to read as its own thing
   against Vigil (spike), Ballast (anvil), Corvid (broad, mismatched) AND
   Apogee (round head, bell cape). Its read: tall and rectangular, widest
   at a boxy backpack rather than a curved cape or a mantle.
   ============================================================ */

/* ---------- REVISION 7 — colour variants, on request ("a few colour
   variations of this model"). Every colour used anywhere in this file was
   already funneled through a small set of named constants (INK,
   PURPLE_HI/MID/LO, CASE_HI/MID/LO) plus two hardcoded gradients (glow,
   visor) — so rather than branching the geometry, each variant is just a
   different set of values for those same names, resolved once per render
   and shadowing the names every existing line in this component already
   references. Nothing below the palette resolution had to change: ~500
   lines of paths/rects/circles keep using CASE_HI, PURPLE_LO, etc. exactly
   as before, and they now just mean "this variant's case-hi colour."

   Each variant keeps Eclipse's own formula — a dark body, a lit glow
   colour, a case/hardware tone — rather than reinventing the figure; only
   the hues change. Named after eclipse phenomena, matching the character's
   own naming logic (see the top-of-file note on "Eclipse" as a name). */
type EclipsePalette = {
  bodyHi: string;
  bodyMid: string;
  bodyLo: string;
  caseHi: string;
  caseMid: string;
  caseLo: string;
  glowHot: string;
  glowMid: string;
  glowEdge: string;
  visorHi: string;
  visorMid: string;
  visorLo: string;
  ink: string;
  /** short colour description, dropped into the aria-label */
  description: string;
};

export const ECLIPSE_PALETTES = {
  eclipse: {
    bodyHi: '#6b4b8a',
    bodyMid: '#3a2650',
    bodyLo: '#160f22',
    caseHi: '#3a3448',
    caseMid: '#221e2c',
    caseLo: '#0d0b12',
    glowHot: '#ffffff',
    glowMid: '#dcd8f2',
    glowEdge: '#8b83a8',
    visorHi: '#f4f2ff',
    visorMid: '#9a94b8',
    visorLo: '#332c48',
    ink: '#1c1826',
    description: 'dark purple pressure suit with glowing white trim',
  },
  corona: {
    bodyHi: '#4a4038',
    bodyMid: '#221c16',
    bodyLo: '#0c0906',
    caseHi: '#332a20',
    caseMid: '#1c160f',
    caseLo: '#0a0705',
    glowHot: '#fff4d6',
    glowMid: '#ffd27a',
    glowEdge: '#b8790f',
    visorHi: '#fff2d9',
    visorMid: '#c9a76a',
    visorLo: '#3d2f18',
    ink: '#201a10',
    description: 'near-black pressure suit with a glowing golden-amber trim, like a solar corona',
  },
  bloodmoon: {
    bodyHi: '#7a3838',
    bodyMid: '#451c1c',
    bodyLo: '#1a0a0a',
    caseHi: '#3d2222',
    caseMid: '#221212',
    caseLo: '#0d0606',
    glowHot: '#ffdada',
    glowMid: '#ff7a5c',
    glowEdge: '#b8341a',
    visorHi: '#ffe3d9',
    visorMid: '#b06858',
    visorLo: '#3d1c16',
    ink: '#200c0c',
    description: 'deep crimson pressure suit with a glowing red-orange trim, like a lunar eclipse',
  },
  annular: {
    /* "black lava," on direct request — flagged before building, same as
       Apogee's REVISION 3: this reuses Corvid's (and Apogee's) black
       body + lava-orange glow register almost exactly, a knowing repeat
       rather than an accidental one. Named for an annular eclipse — a
       black disc with a bright ring of fire around it — so the overlap
       at least gets its own honest reason to exist rather than just
       being "the third lava palette." Body, case and glow hex values are
       lifted directly from Apogee's own colour constants for true
       consistency with the two figures it's deliberately echoing. */
    bodyHi: '#6b6f78',
    bodyMid: '#35383f',
    bodyLo: '#0e0f12',
    caseHi: '#2a2c31',
    caseMid: '#17181b',
    caseLo: '#08090a',
    glowHot: '#ffe066',
    glowMid: '#ff6a2a',
    glowEdge: '#c81e05',
    visorHi: '#f2d9b8',
    visorMid: '#a85a24',
    visorLo: '#2e1608',
    ink: '#140f0a',
    description:
      'black pressure suit with a glowing lava-orange trim, like an annular eclipse\'s ring of fire — the same black/lava register Corvid and Apogee use, by direct request',
  },
  penumbra: {
    bodyHi: '#4a5a72',
    bodyMid: '#26313f',
    bodyLo: '#0e141c',
    caseHi: '#2e3a48',
    caseMid: '#1a222c',
    caseLo: '#0a0e12',
    glowHot: '#eafcff',
    glowMid: '#a8e0ec',
    glowEdge: '#4f8fa0',
    visorHi: '#eafbff',
    visorMid: '#8fb4c0',
    visorLo: '#28414d',
    ink: '#101820',
    description: 'slate blue-grey pressure suit with a soft glowing cyan trim, like a partial shadow',
  },
} satisfies Record<string, EclipsePalette>;

export type EclipsePaletteName = keyof typeof ECLIPSE_PALETTES;

/** deterministic scatter — no Math.random() in render output, same
 *  convention as every other figure on the roster. Reserved for future
 *  weathering scatter, unused for now (this figure stays deliberately
 *  close to regulation — see spec §6 batch 4). */
export function hash(i: number, salt = 0): number {
  const s = Math.sin(i * 41.3 + salt * 71.9) * 9821.17;
  return s - Math.floor(s);
}

export type EclipseFigure2DProps = {
  /** rendered width in px; height follows the 200x300 viewBox */
  size?: number;
  /** flattens all fills to near-black and drops strokes, for the 80px
   *  silhouette gate (see main.tsx's five-way comparison) */
  silhouette?: boolean;
  /** enables pointer/keyboard "poke" touch reaction */
  interactive?: boolean;
  /** colour variant — see ECLIPSE_PALETTES. Defaults to the original
   *  dark-purple/white "eclipse" scheme. */
  palette?: EclipsePaletteName;
};

export function EclipseFigure2D({
  size = 300,
  silhouette = false,
  interactive = true,
  palette = 'eclipse',
}: EclipseFigure2DProps) {
  const pal = ECLIPSE_PALETTES[palette] ?? ECLIPSE_PALETTES.eclipse;
  const INK = pal.ink;
  const PURPLE_HI = pal.bodyHi;
  const PURPLE_MID = pal.bodyMid;
  const PURPLE_LO = pal.bodyLo;
  const CASE_HI = pal.caseHi;
  const CASE_MID = pal.caseMid;
  const CASE_LO = pal.caseLo;
  const f = (fill: string) => (silhouette ? '#050505' : fill);
  const stroke = silhouette ? 'none' : INK;

  const ref = useRef<SVGSVGElement>(null);

  const poke = useCallback(() => {
    const el = ref.current;
    if (!el || silhouette) return;
    el.classList.remove('is-poked');
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    el.getBoundingClientRect().width;
    el.classList.add('is-poked');
  }, [silhouette]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onEnd = (e: AnimationEvent) => {
      if (e.animationName === 'ec-trim-flare') {
        el.classList.remove('is-poked');
      }
    };
    el.addEventListener('animationend', onEnd);
    return () => el.removeEventListener('animationend', onEnd);
  }, []);

  return (
    <svg
      ref={ref}
      className="ec-figure"
      width={size}
      height={(size * 300) / 200}
      viewBox="0 0 200 300"
      role="img"
      tabIndex={interactive && !silhouette ? 0 : undefined}
      aria-label={
        interactive
          ? `Eclipse — a mission commander in a ${pal.description} and a mirrored visor. Tap for a systems check.`
          : `Eclipse — a mission commander in a ${pal.description}, a boxy twin-tank life-support pack, and a fully mirrored visor`
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
        <linearGradient id="ec-body" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={PURPLE_HI} />
          <stop offset="55%" stopColor={PURPLE_MID} />
          <stop offset="100%" stopColor={PURPLE_LO} />
        </linearGradient>
        <linearGradient id="ec-case" x1="0.15" y1="0" x2="0.75" y2="1">
          <stop offset="0%" stopColor={CASE_HI} />
          <stop offset="60%" stopColor={CASE_MID} />
          <stop offset="100%" stopColor={CASE_LO} />
        </linearGradient>
        <radialGradient id="ec-glow" cx="0.5" cy="0.4" r="0.65">
          <stop offset="0%" stopColor={pal.glowHot} />
          <stop offset="55%" stopColor={pal.glowMid} />
          <stop offset="100%" stopColor={pal.glowEdge} />
        </radialGradient>
        <linearGradient id="ec-visor" x1="0.1" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor={pal.visorHi} />
          <stop offset="45%" stopColor={pal.visorMid} />
          <stop offset="100%" stopColor={pal.visorLo} />
        </linearGradient>
      </defs>

      {/* ---------- BATCH 1 — base masses & silhouette ----------
          Per build-standard.md, batch 1 already carries seams/rivets
          rather than flat blocks; the true "silhouette only" gate concern
          is handled by the f()/stroke gating below, not by leaving detail
          for later. Paint order: legs -> pack+tanks -> torso -> arms ->
          neck ring -> helmet+visor, same front-in-front-of-pack logic
          Apogee's REVISION 1/2 established. */}

      {/* legs — bulky, matched, boots. 26 units wide at the thigh, wider
          at the boot, same "not skinny" lesson every figure since Corvid's
          first pass has followed. */}
      <path d="M70,200 L98,202 L94,250 L66,250 Z" fill={f('url(#ec-body)')} stroke={stroke} strokeWidth="4" />
      {/* REVISION 4 — hip flex-joint bellows, left. A real pressure-suit
          hip is a ridged accordion joint, not a smooth pivot; three close
          ridge lines read as that without needing to actually articulate. */}
      {!silhouette && <path d="M71,203 L97,204 M71,207 L97,208 M71,211 L96,212" stroke={CASE_LO} strokeWidth="0.8" opacity="0.35" fill="none" />}
      {/* REVISION 2 — thigh panel line, left. */}
      {!silhouette && <path d="M72,222 L92,220" stroke={CASE_HI} strokeWidth="1" opacity="0.3" fill="none" />}
      {/* REVISION 4 — thigh utility pocket, left, with a flap line and a
          rivet — the kind of kit pocket a real EVA suit's thigh carries. */}
      {!silhouette && (
        <>
          <rect x="74" y="228" width="14" height="16" rx="1.5" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="1.2" opacity="0.9" />
          <path d="M75,233 L87,233" stroke={CASE_LO} strokeWidth="0.8" opacity="0.5" fill="none" />
          <circle cx="81" cy="239" r="1" fill={CASE_LO} opacity="0.5" />
        </>
      )}
      {/* BATCH 3 — knee seam, left, same lit-seam language as the elbow. */}
      {!silhouette && <path d="M66,250 L94,250" stroke={f('url(#ec-glow)')} strokeWidth="1" opacity="0.4" fill="none" />}
      {/* REVISION 4 — knee pad plate, left, a small case-material guard
          over the knee joint rather than leaving it bare suit fabric. */}
      <path d="M70,246 L92,246 L94,258 L88,264 L72,264 L66,258 Z" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="2" opacity="0.95" />
      <path d="M64,250 L96,250 L100,272 L96,286 L62,286 L58,272 Z" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="4" />
      {/* REVISION 3 — ankle cuff fold and shin panel line, left. */}
      {!silhouette && (
        <>
          <path d="M64,254 L96,254" stroke={CASE_HI} strokeWidth="0.8" opacity="0.3" fill="none" />
          <path d="M66,264 L92,264" stroke={CASE_LO} strokeWidth="1" opacity="0.3" fill="none" />
        </>
      )}
      {/* REVISION 4 — ankle flex-joint bellows, left, just above the boot —
          the same ridged-joint language as the hip, at the other end of
          the leg. */}
      {!silhouette && <path d="M63,268 L97,268 M62,271 L98,271" stroke={CASE_LO} strokeWidth="0.8" opacity="0.3" fill="none" />}
      {/* REVISION 2 — boot toe cap seam and sole tread, left. */}
      {!silhouette && (
        <>
          <path d="M60,274 L94,274" stroke={CASE_HI} strokeWidth="1" opacity="0.35" fill="none" />
          <path d="M62,288 L66,284 M72,289 L76,285" stroke={CASE_LO} strokeWidth="1" opacity="0.4" fill="none" strokeLinecap="round" />
          {/* REVISION 4 — boot heel seam, left. */}
          <path d="M59,278 L61,283" stroke={CASE_LO} strokeWidth="0.8" opacity="0.35" fill="none" strokeLinecap="round" />
        </>
      )}
      {!silhouette && (
        <>
          <circle cx="68" cy="282" r="2" fill={f('url(#ec-glow)')} opacity="0.85" />
          <circle cx="78" cy="284" r="2" fill={f('url(#ec-glow)')} opacity="0.85" />
          <circle cx="88" cy="282" r="2" fill={f('url(#ec-glow)')} opacity="0.85" />
        </>
      )}
      <path d="M130,200 L102,202 L106,250 L134,250 Z" fill={f('url(#ec-body)')} stroke={stroke} strokeWidth="4" />
      {/* REVISION 4 — hip flex-joint bellows, right, mirrored. */}
      {!silhouette && <path d="M129,203 L103,204 M129,207 L103,208 M129,211 L104,212" stroke={CASE_LO} strokeWidth="0.8" opacity="0.35" fill="none" />}
      {/* REVISION 2 — thigh panel line, right, mirrored. */}
      {!silhouette && <path d="M128,222 L108,220" stroke={CASE_HI} strokeWidth="1" opacity="0.3" fill="none" />}
      {/* REVISION 4 — thigh utility pocket, right, mirrored. */}
      {!silhouette && (
        <>
          <rect x="112" y="228" width="14" height="16" rx="1.5" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="1.2" opacity="0.9" />
          <path d="M113,233 L125,233" stroke={CASE_LO} strokeWidth="0.8" opacity="0.5" fill="none" />
          <circle cx="119" cy="239" r="1" fill={CASE_LO} opacity="0.5" />
        </>
      )}
      {/* BATCH 3 — knee seam, right, mirrored. */}
      {!silhouette && <path d="M106,250 L134,250" stroke={f('url(#ec-glow)')} strokeWidth="1" opacity="0.4" fill="none" />}
      {/* REVISION 4 — knee pad plate, right, mirrored. */}
      <path d="M130,246 L108,246 L106,258 L112,264 L128,264 L134,258 Z" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="2" opacity="0.95" />
      <path d="M136,250 L104,250 L100,272 L104,286 L138,286 L142,272 Z" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="4" />
      {/* REVISION 3 — ankle cuff fold and shin panel line, right, mirrored. */}
      {!silhouette && (
        <>
          <path d="M136,254 L104,254" stroke={CASE_HI} strokeWidth="0.8" opacity="0.3" fill="none" />
          <path d="M134,264 L108,264" stroke={CASE_LO} strokeWidth="1" opacity="0.3" fill="none" />
        </>
      )}
      {/* REVISION 4 — ankle flex-joint bellows, right, mirrored. */}
      {!silhouette && <path d="M137,268 L103,268 M138,271 L102,271" stroke={CASE_LO} strokeWidth="0.8" opacity="0.3" fill="none" />}
      {/* REVISION 2 — boot toe cap seam and sole tread, right, mirrored. */}
      {!silhouette && (
        <>
          <path d="M106,274 L140,274" stroke={CASE_HI} strokeWidth="1" opacity="0.35" fill="none" />
          <path d="M138,288 L134,284 M128,289 L124,285" stroke={CASE_LO} strokeWidth="1" opacity="0.4" fill="none" strokeLinecap="round" />
          {/* REVISION 4 — boot heel seam, right, mirrored. */}
          <path d="M141,278 L139,283" stroke={CASE_LO} strokeWidth="0.8" opacity="0.35" fill="none" strokeLinecap="round" />
        </>
      )}
      {!silhouette && (
        <>
          <circle cx="112" cy="282" r="2" fill={f('url(#ec-glow)')} opacity="0.85" />
          <circle cx="122" cy="284" r="2" fill={f('url(#ec-glow)')} opacity="0.85" />
          <circle cx="132" cy="282" r="2" fill={f('url(#ec-glow)')} opacity="0.85" />
        </>
      )}

      {/* backpack (PLSS) — a boxy rectangular life-support pack with two
          visible tanks, the real, literal NASA silhouette rather than
          Apogee's draping cape. This is Eclipse's widest point and its
          whole differentiation strategy — see spec §2. Painted before the
          torso/arms so the body sits in front of it, same occlusion logic
          as Apogee's pack (REVISION 1/2 lesson, not repeated blind here —
          this pack is short enough from the start that the shoulder line
          shows clearly below it). */}
      <rect x="36" y="96" width="128" height="40" rx="4" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="4" />
      {/* REVISION 1 — tanks moved outward from their first placement
          (x62-84/x116-138), which sat almost entirely behind the dome's
          own width (x64-136 at the tank's height) and read as two barely-
          visible slivers rather than the classic twin-tank PLSS silhouette
          this figure's whole differentiation strategy depends on. Found by
          rendering batch 1, fixed before moving on — same discipline
          Apogee's REVISION 1/2 pack fix followed. */}
      <rect x="44" y="66" width="22" height="36" rx="10" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="3" />
      <rect x="134" y="66" width="22" height="36" rx="10" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="3" />
      {!silhouette && (
        <>
          <circle cx="55" cy="72" r="2" fill={f('url(#ec-glow)')} opacity="0.85" />
          <circle cx="145" cy="72" r="2" fill={f('url(#ec-glow)')} opacity="0.85" />
        </>
      )}
      {/* REVISION 3 — tank band and pressure gauge, both tanks. A plain
          cylinder before this; the band + dial is what makes it read as a
          pressurized tank rather than a smooth capsule. */}
      {!silhouette && (
        <>
          <path d="M45,82 L65,82" stroke={CASE_LO} strokeWidth="1" opacity="0.4" fill="none" />
          <circle cx="55" cy="90" r="3" fill="none" stroke={f('url(#ec-glow)')} strokeWidth="0.9" opacity="0.5" />
          <path d="M55,90 L55,87.5" stroke={f('url(#ec-glow)')} strokeWidth="0.9" opacity="0.6" fill="none" />
          <path d="M135,82 L155,82" stroke={CASE_LO} strokeWidth="1" opacity="0.4" fill="none" />
          <circle cx="145" cy="90" r="3" fill="none" stroke={f('url(#ec-glow)')} strokeWidth="0.9" opacity="0.5" />
          <path d="M145,90 L146.5,88" stroke={f('url(#ec-glow)')} strokeWidth="0.9" opacity="0.6" fill="none" />
        </>
      )}
      {/* BATCH 2 — tank-to-pack tubing, the two conduits that feed the
          suit from the tanks. className="ec-tube" so BATCH 4's idle
          animation can send a travelling pulse along them — "power/air
          actually flowing" rather than a static accent line. */}
      {!silhouette && (
        <>
          <path className="ec-tube" d="M55,100 L55,120 L72,132" stroke={f('url(#ec-glow)')} strokeWidth="1.6" opacity="0.7" fill="none" />
          <path className="ec-tube" d="M145,100 L145,120 L128,132" stroke={f('url(#ec-glow)')} strokeWidth="1.6" opacity="0.7" fill="none" />
        </>
      )}
      {/* BATCH 2 — tank and pack hardware: base rivets on each tank, and
          two case-dark corner bolts on the pack itself — fasteners stay
          the case colour, not the glow colour, so "glowing white trim"
          keeps meaning "an actual lit seam," not "every piece of hardware
          on the figure." */}
      {!silhouette && (
        <>
          <circle cx="49" cy="98" r="1.1" fill={CASE_LO} opacity="0.6" />
          <circle cx="61" cy="98" r="1.1" fill={CASE_LO} opacity="0.6" />
          <circle cx="139" cy="98" r="1.1" fill={CASE_LO} opacity="0.6" />
          <circle cx="151" cy="98" r="1.1" fill={CASE_LO} opacity="0.6" />
          <circle cx="42" cy="102" r="1.2" fill={CASE_LO} opacity="0.55" />
          <circle cx="158" cy="102" r="1.2" fill={CASE_LO} opacity="0.55" />
          <circle cx="42" cy="130" r="1.2" fill={CASE_LO} opacity="0.55" />
          <circle cx="158" cy="130" r="1.2" fill={CASE_LO} opacity="0.55" />
        </>
      )}
      {/* REVISION 2 — pack face detail: a vent grille between the tanks
          (heat/air has to go somewhere, same reasoning Apogee's pack
          grille used), a small telemetry readout, and a warning stripe —
          the one place on this regulation suit that gets a genuine
          two-tone hazard marking rather than a plain seam. */}
      {!silhouette && (
        <>
          <path d="M78,104 L78,120 M86,104 L86,120 M94,104 L94,120" stroke={CASE_LO} strokeWidth="1.4" opacity="0.4" fill="none" />
          <rect x="104" y="106" width="18" height="10" rx="1" fill={CASE_LO} opacity="0.5" />
          <path d="M107,109 L117,109 M107,112 L114,112" stroke={f('url(#ec-glow)')} strokeWidth="0.9" opacity="0.6" fill="none" />
          <path d="M126,108 L134,104 M129,112 L137,108 M132,116 L140,112" stroke={f('url(#ec-glow)')} strokeWidth="1.4" opacity="0.5" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* ---------- REVISION 6 — jetpack, on direct instruction ("what
          about a jet pack"). Deliberately NOT a repeat of Apogee's big
          twin-nozzle thruster cluster: Eclipse's whole differentiation
          strategy is a boxy, regulation PLSS pack rather than a thruster
          pack (spec §2), so a matching pair of large nozzles at the base
          would blur exactly the line that keeps these two figures apart.
          Instead: four small SAFER-style RCS thrusters at the pack's own
          corners — real precision self-rescue hardware, appropriate for
          a *pilot* specifically, and small enough to read as "attached
          to the PLSS" rather than "replacing it." Painted as part of the
          pack (ungated geometry, same as the tanks) so they contribute to
          the actual silhouette, not just a lit decal. Glow tips carry
          className="ec-thruster" so BATCH 4's touch reaction can give
          them a firing flare — see eclipseFigure2D.css. ---------- */}
      <path d="M36,94 L28,96 L28,102 L36,104 Z" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="2" />
      <path d="M164,94 L172,96 L172,102 L164,104 Z" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="2" />
      <path d="M36,124 L26,127 L26,133 L36,136 Z" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="2" />
      <path d="M164,124 L174,127 L174,133 L164,136 Z" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="2" />
      {!silhouette && (
        <>
          <circle className="ec-thruster" cx="26" cy="99" r="1.6" fill={f('url(#ec-glow)')} opacity="0.75" />
          <circle className="ec-thruster" cx="174" cy="99" r="1.6" fill={f('url(#ec-glow)')} opacity="0.75" />
          <circle className="ec-thruster" cx="23" cy="130" r="1.8" fill={f('url(#ec-glow)')} opacity="0.75" />
          <circle className="ec-thruster" cx="177" cy="130" r="1.8" fill={f('url(#ec-glow)')} opacity="0.75" />
        </>
      )}

      {/* torso — structured and blocky, "regulation" rather than
          Apogee's soft worn-in suit. Center seam and a chest RCU are
          included from batch 1, per the build standard's "function-first
          hardware" rule: a commander's suit has this by default. */}
      <path d="M68,126 L132,126 L128,196 L72,196 Z" fill={f('url(#ec-body)')} stroke={stroke} strokeWidth="4" />
      {!silhouette && <path d="M100,128 L100,196" stroke={f('url(#ec-glow)')} strokeWidth="1.2" opacity="0.55" fill="none" />}
      {/* BATCH 3 — chest cross-seam and corner rivets, the same "quartered
          paneling, not one bare slab" move the build standard calls for. */}
      {!silhouette && (
        <>
          <path d="M76,150 L124,150" stroke={f('url(#ec-glow)')} strokeWidth="1" opacity="0.45" fill="none" />
          <circle cx="76" cy="150" r="1.1" fill={CASE_LO} opacity="0.5" />
          <circle cx="124" cy="150" r="1.1" fill={CASE_LO} opacity="0.5" />
          <circle cx="76" cy="190" r="1.1" fill={CASE_LO} opacity="0.45" />
          <circle cx="124" cy="190" r="1.1" fill={CASE_LO} opacity="0.45" />
        </>
      )}
      <rect x="84" y="152" width="32" height="22" rx="2" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="2" />
      {!silhouette && (
        <>
          <rect x="88" y="156" width="5" height="4" fill={f('url(#ec-glow)')} opacity="0.55" />
          <rect x="95" y="156" width="5" height="4" fill={f('url(#ec-glow)')} opacity="0.55" />
          <rect x="102" y="156" width="5" height="4" fill={f('url(#ec-glow)')} opacity="0.55" />
          <circle cx="91" cy="167" r="2" fill={f('url(#ec-glow)')} opacity="0.9" />
          <path d="M97,167 L112,167" stroke={f('url(#ec-glow)')} strokeWidth="1.2" opacity="0.7" fill="none" />
        </>
      )}
      {/* BATCH 3 — waist seam, where the suit's torso and legs actually
          meet; a plain line before this, now the same lit-seam language
          as everywhere else. */}
      {!silhouette && <path d="M74,196 L126,196" stroke={f('url(#ec-glow)')} strokeWidth="1.2" opacity="0.5" fill="none" />}
      {/* REVISION 3 — torso side seams, where the front and back panels of
          a real suit actually meet. The cross-seam quartered the front
          face; this closes the last bare edges. */}
      {!silhouette && (
        <>
          <path d="M74,128 L72,196" stroke={CASE_HI} strokeWidth="1" opacity="0.3" fill="none" />
          <path d="M126,128 L128,196" stroke={CASE_HI} strokeWidth="1" opacity="0.3" fill="none" />
        </>
      )}
      {/* REVISION 2 — rank chevrons, on request for "more details." Three
          stacked V-marks, an invented commander's rank marker (not a real
          military or agency insignia — same reasoning as Apogee's ringed-
          star mission patch), placed where a shoulder or chest rank tab
          would actually sit on a real suit. */}
      {!silhouette && (
        <path
          d="M74,138 L80,133 L86,138 M74,143 L80,138 L86,143 M74,148 L80,143 L86,148"
          stroke={f('url(#ec-glow)')}
          strokeWidth="1.3"
          opacity="0.7"
          fill="none"
        />
      )}

      {/* arms — bulky, matched, mirrored. Gloves with a wrist control pad,
          this figure's equivalent of Apogee's checklist cuff, reading as
          suit-integrated rather than strapped on. */}
      <path d="M42,128 L68,126 L64,172 L38,174 Z" fill={f('url(#ec-body)')} stroke={stroke} strokeWidth="4" />
      {/* BATCH 3 — shoulder rivet and upper-arm/forearm seam, left. */}
      {!silhouette && (
        <>
          <circle cx="54" cy="130" r="1.2" fill={CASE_LO} opacity="0.55" />
          <path d="M40,172 L64,170" stroke={f('url(#ec-glow)')} strokeWidth="1" opacity="0.4" fill="none" />
        </>
      )}
      {/* REVISION 3 — bicep strap, left, distinct from the forearm's own
          strap-free panel line — this is a restraint band, not a seam. */}
      {!silhouette && (
        <>
          <path d="M40,150 L63,148" stroke={f('url(#ec-case)')} strokeWidth="4" fill="none" strokeLinecap="round" />
          <rect x="48" y="145.5" width="6" height="5" rx="1" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="1" />
          <circle cx="51" cy="148" r="1" fill={f('url(#ec-glow)')} opacity="0.8" />
        </>
      )}
      <path d="M40,172 L64,170 L60,216 L36,218 Z" fill={f('url(#ec-body)')} stroke={stroke} strokeWidth="4" />
      {/* REVISION 2 — forearm panel line, left, same "more detail" pass. */}
      {!silhouette && <path d="M42,182 L58,179" stroke={CASE_HI} strokeWidth="1" opacity="0.3" fill="none" />}
      {/* ---------- REVISION 10 — fingers facing downward, left, on
          direct instruction. REVISION 9's fist read too wide-and-flat
          (24 wide by 16 tall — closer to a mitten lying on its side than
          a fist hanging off a wrist), so the knuckle row read as facing
          sideways rather than curling down. Rebuilt taller and narrower
          (20 wide by 25 tall) so the fist's own long axis points down the
          same way the arm does, and the thumb rotates more steeply
          (-38° instead of -14°) so it wraps down the side of the fist
          rather than out across the front. Knuckle bumps stay uneven in
          size, same rule as REVISION 9. ---------- */}
      <path d="M38,217 L58,218 L57,236 Q56,242 50,242 L46,242 Q40,242 39,236 Z" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="3" />
      <circle cx="41.5" cy="217.5" r="3.2" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="1.6" />
      <circle cx="46" cy="217" r="3.6" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="1.6" />
      <circle cx="50.5" cy="217" r="3.4" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="1.6" />
      <circle cx="55" cy="218" r="3" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="1.6" />
      <rect x="32" y="226" width="13" height="6.5" rx="3.2" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="1.8" transform="rotate(-38 38.5 229.5)" />
      {!silhouette && (
        <>
          <rect x="40" y="196" width="14" height="8" rx="1.5" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="1" />
          <circle cx="47" cy="200" r="1.4" fill={f('url(#ec-glow)')} opacity="0.85" />
          {/* knuckle creases — short ticks between the knuckle bumps,
              and one crease line where the thumb crosses the fingers. */}
          <path
            d="M44,218 L44,221 M49,217.5 L49,221 M53.5,218 L53.5,221"
            stroke={CASE_LO}
            strokeWidth="0.8"
            opacity="0.4"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M34,228 L42,233" stroke={CASE_LO} strokeWidth="0.8" opacity="0.35" fill="none" strokeLinecap="round" />
        </>
      )}
      <path d="M158,128 L132,126 L136,172 L162,174 Z" fill={f('url(#ec-body)')} stroke={stroke} strokeWidth="4" />
      {/* BATCH 3 — shoulder rivet and seam, right, mirrored. */}
      {!silhouette && (
        <>
          <circle cx="146" cy="130" r="1.2" fill={CASE_LO} opacity="0.55" />
          <path d="M160,172 L136,170" stroke={f('url(#ec-glow)')} strokeWidth="1" opacity="0.4" fill="none" />
        </>
      )}
      {/* REVISION 3 — bicep strap, right, mirrored. */}
      {!silhouette && (
        <>
          <path d="M160,150 L137,148" stroke={f('url(#ec-case)')} strokeWidth="4" fill="none" strokeLinecap="round" />
          <rect x="146" y="145.5" width="6" height="5" rx="1" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="1" />
          <circle cx="149" cy="148" r="1" fill={f('url(#ec-glow)')} opacity="0.8" />
        </>
      )}
      <path d="M160,172 L136,170 L140,216 L164,218 Z" fill={f('url(#ec-body)')} stroke={stroke} strokeWidth="4" />
      {/* REVISION 2 — forearm panel line, right, mirrored. */}
      {!silhouette && <path d="M158,182 L142,179" stroke={CASE_HI} strokeWidth="1" opacity="0.3" fill="none" />}
      {/* REVISION 10 — fingers facing downward, right, mirrored. */}
      <path d="M162,217 L142,218 L143,236 Q144,242 150,242 L154,242 Q160,242 161,236 Z" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="3" />
      <circle cx="158.5" cy="217.5" r="3.2" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="1.6" />
      <circle cx="154" cy="217" r="3.6" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="1.6" />
      <circle cx="149.5" cy="217" r="3.4" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="1.6" />
      <circle cx="145" cy="218" r="3" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="1.6" />
      <rect x="155" y="226" width="13" height="6.5" rx="3.2" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="1.8" transform="rotate(38 161.5 229.5)" />
      {!silhouette && (
        <>
          <rect x="146" y="196" width="14" height="8" rx="1.5" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="1" />
          <circle cx="153" cy="200" r="1.4" fill={f('url(#ec-glow)')} opacity="0.85" />
          <path
            d="M156,218 L156,221 M151,217.5 L151,221 M146.5,218 L146.5,221"
            stroke={CASE_LO}
            strokeWidth="0.8"
            opacity="0.4"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M166,228 L158,233" stroke={CASE_LO} strokeWidth="0.8" opacity="0.35" fill="none" strokeLinecap="round" />
        </>
      )}
      {/* REVISION 2 — shoulder pauldrons, both sides. Small case-material
          plates over the torso/arm seam, same "an actual piece of
          hardware, not just a seam" move Apogee's REVISION 8 established,
          reinforced here as a commander's rank-adjacent shoulder detail. */}
      <path d="M40,127 Q54,118 70,129 L65,141 Q54,134 41,139 Z" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="3" />
      <path d="M160,127 Q146,118 130,129 L135,141 Q146,134 159,139 Z" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="3" />
      {!silhouette && (
        <>
          <path d="M44,127 Q54,121 66,130" stroke={f('url(#ec-glow)')} strokeWidth="1" opacity="0.45" fill="none" />
          <circle cx="54" cy="128" r="1.3" fill={CASE_LO} opacity="0.55" />
          <path d="M156,127 Q146,121 134,130" stroke={f('url(#ec-glow)')} strokeWidth="1" opacity="0.45" fill="none" />
          <circle cx="146" cy="128" r="1.3" fill={CASE_LO} opacity="0.55" />
        </>
      )}

      {/* neck ring — banded collar, white-glow status light rather than
          lava, matching the palette this figure actually owns. */}
      <rect x="82" y="93" width="36" height="16" rx="6" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="3" />
      {!silhouette && (
        <>
          <path d="M84,98 L116,98" stroke={INK} strokeWidth="1" opacity="0.4" fill="none" />
          <path d="M84,104 L116,104" stroke={INK} strokeWidth="1" opacity="0.4" fill="none" />
          <circle className="ec-status" cx="100" cy="101" r="1.8" fill={f('url(#ec-glow)')} opacity="0.85" />
          {/* BATCH 3 — neck ring bolts, matching the shoulder/tank/pack
              fastener language rather than leaving the collar bare. */}
          <circle cx="86" cy="101" r="1" fill={CASE_LO} opacity="0.5" />
          <circle cx="114" cy="101" r="1" fill={CASE_LO} opacity="0.5" />
          {/* REVISION 2 — third band, more-detail pass. */}
          <path d="M86,95.5 L114,95.5" stroke={INK} strokeWidth="0.8" opacity="0.3" fill="none" />
        </>
      )}

      {/* helmet — a faceted dome (straight edges, not Apogee's smooth
          round glass), with a flat mirrored visor covering the whole
          front. No face, no skull — the deliberate opposite of Apogee's
          "glimpsed through glass" gimmick. */}
      <path
        d="M64,60 L62,36 L74,16 L100,10 L126,16 L138,36 L136,60 Q136,94 116,102 L84,102 Q64,94 64,60 Z"
        fill={f('url(#ec-case)')}
        stroke={stroke}
        strokeWidth="4"
      />
      <path
        d="M70,58 L69,38 L79,22 L100,17 L121,22 L131,38 L130,58 L128,82 L114,92 L86,92 L72,82 Z"
        fill={f('url(#ec-visor)')}
        stroke={stroke}
        strokeWidth="3"
      />
      {!silhouette && (
        <>
          <path d="M76,30 Q100,20 124,30" stroke="#ffffff" strokeWidth="1.6" opacity="0.4" fill="none" strokeLinecap="round" />
          <path
            d="M70,58 L69,38 L79,22 L100,17 L121,22 L131,38 L130,58 L128,82 L114,92 L86,92 L72,82 Z"
            fill="none"
            stroke={f('url(#ec-glow)')}
            strokeWidth="1.2"
            opacity="0.6"
          />
        </>
      )}
      {/* REVISION 2 — helmet detail, on request for "more details." Facet
          rivets at the dome's own angular joints (a straight-edged dome
          actually has seams there, unlike Apogee's single smooth curve),
          a comm antenna (a real EVA-suit detail this figure had none of),
          and a jaw trim line tracing the dome's lower edge. */}
      <path d="M136,38 L146,26" stroke={f('url(#ec-case)')} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      {!silhouette && <circle cx="146" cy="26" r="1.6" fill={f('url(#ec-glow)')} opacity="0.85" />}
      {!silhouette && (
        <>
          <circle cx="74" cy="16" r="1" fill={CASE_LO} opacity="0.5" />
          <circle cx="126" cy="16" r="1" fill={CASE_LO} opacity="0.5" />
          <circle cx="62" cy="36" r="1" fill={CASE_LO} opacity="0.5" />
          <circle cx="138" cy="36" r="1" fill={CASE_LO} opacity="0.5" />
          <path d="M84,102 L116,102" stroke={f('url(#ec-glow)')} strokeWidth="1" opacity="0.45" fill="none" />
        </>
      )}
      {/* REVISION 3 — comm pucks, both sides of the jaw, another real
          EVA-suit detail (the external speaker/mic units on a helmet)
          this figure didn't have yet. */}
      <circle cx="68" cy="72" r="4" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="1.6" />
      <circle cx="132" cy="72" r="4" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="1.6" />
      {!silhouette && (
        <>
          <circle cx="68" cy="72" r="1.4" fill={f('url(#ec-glow)')} opacity="0.75" />
          <circle cx="132" cy="72" r="1.4" fill={f('url(#ec-glow)')} opacity="0.75" />
        </>
      )}
      {/* REVISION 5 — more helmet detail, on request. Facet seam lines
          tracing the dome's actual panel edges (rivets alone marked the
          joints; this draws the seams between them, the same move the
          torso's cross-seam made explicit). A locking-ring tick pattern
          along the base, where a real helmet twist-locks onto the neck
          ring. A helmet-mounted camera, mirroring the antenna on the
          opposite side rather than duplicating it — one recorder, one
          transmitter, not two of the same part. A second, dimmer visor
          highlight for a more complex mirror reflection. */}
      {!silhouette && (
        <path
          d="M74,16 L62,36 M62,36 L64,60 M126,16 L138,36 M138,36 L136,60"
          stroke={CASE_LO}
          strokeWidth="0.9"
          opacity="0.35"
          fill="none"
        />
      )}
      {!silhouette && (
        <path
          d="M87,102 L87,99 M92,102 L92,99 M97,102 L97,99 M103,102 L103,99 M108,102 L108,99 M113,102 L113,99"
          stroke={CASE_LO}
          strokeWidth="0.8"
          opacity="0.4"
          fill="none"
        />
      )}
      <rect x="58" y="26" width="9" height="7" rx="1.5" fill={f('url(#ec-case)')} stroke={stroke} strokeWidth="1.2" />
      {!silhouette && <circle cx="62.5" cy="29.5" r="1.5" fill={f('url(#ec-glow)')} opacity="0.75" />}
      {!silhouette && (
        <path d="M80,66 Q100,60 118,66" stroke="#ffffff" strokeWidth="1" opacity="0.22" fill="none" strokeLinecap="round" />
      )}

      {/* ---------- BATCH 4 — weathering, deliberately light. Per spec §6,
          Eclipse is the one crew member who is NOT battle-worn: a
          commander's suit stays regulation. Two small marks, not the
          knee/boot/pack grime density every other figure carries. ---------- */}
      {!silhouette && (
        <>
          <ellipse cx="86" cy="240" rx="4" ry="2.2" fill={INK} opacity="0.15" transform="rotate(-8 86 240)" />
          <ellipse cx="72" cy="280" rx="4" ry="2" fill={INK} opacity="0.15" transform="rotate(6 72 280)" />
        </>
      )}
    </svg>
  );
}

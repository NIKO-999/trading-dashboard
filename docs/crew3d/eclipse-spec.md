# ECLIPSE — production spec

**Roster:** Special Forces, 3 of 5 · **Role:** mission commander/pilot — the
one who flies the ship and gives the order, not the one who goes outside
or holds the line.
**Status:** all 4 batches done and gated (§5), plus REVISION 2 through
REVISION 6 — successive detail passes on request ("more details," then
"details on the legs and helmet," then "what about a jet pack"): comm
antenna and a helmet-mounted camera, facet rivets/seams, jaw trim, a
locking-ring tick pattern, a third neck-ring band, pack vent grille +
telemetry readout + warning stripe + tank gauges/bands, shoulder
pauldrons, bicep straps, an invented rank-chevron patch, torso side
seams, forearm/thigh panel lines, hip and ankle flex-joint bellows, knee
pad plates, thigh utility pockets, glove finger/thumb seams, boot toe
caps/tread/heel seams, and four SAFER-style RCS thrusters at the pack's
corners (deliberately smaller/different from Apogee's twin-nozzle
thruster cluster — see §2). Built to docs/crew3d/build-standard.md from
batch 1 — the density/trim/hardware floor was applied while building,
not bolted on after.
**Medium:** 2D (SVG), same pipeline as Vigil, Ballast, Corvid and Apogee.

> **On the name.** Eclipse: a dark disc with a brilliant white ring around
> it. That's the palette in one word — dark purple body, glowing white
> trim tracing every edge — so the name is doing double duty as both a
> visual description and a callsign.
>
> **On why this exists.** Direct instruction: "an actual astronaut" —
> distinct from Apogee, which drifted (through a long, explicitly-requested
> "keep going" pass) into a black/lava, cape-wearing, skull-in-the-helmet
> figure. Apogee earned real astronaut hardware along the way (REVISION 14:
> gold visor, chest RCU, mission patch, wrist cuffs) but its silhouette and
> palette read "gothic space reaper" before they read "astronaut." Eclipse
> is built to be the clean, iconic version: a mirrored visor instead of a
> glimpsed skull, a boxy twin-tank backpack instead of a draping cape, dark
> purple instead of black, white instead of lava.

## 1. Concept

The commander. Where Apogee works outside the ship, Eclipse flies it —
issues the order, sits the chair, suits up only when the mission actually
calls for EVA rather than living in the suit. Built around the real,
recognizable silhouette of a NASA-style pressure suit: a boxy rectangular
life-support pack with two visible tanks, a fully mirrored visor that
shows nothing of the face behind it, and glowing white piping tracing
every seam — the "trim" the brief asked for, read literally as edge-lit
seams rather than a decorative accent.

## 2. Differentiation strategy

Five crew members now share a "roughly humanoid in a suit" silhouette
budget, so each one's read has to come from a different place:

| Crew member | Widest point | Silhouette read | What you see inside the helmet |
|---|---|---|---|
| Vigil | shoulders | narrow vertical spike | (opaque helmet) |
| Ballast | the mantle | wide horizontal anvil | (opaque helmet) |
| Corvid | the shoulders | broad shoulders, mismatched legs | (bird mask, not a face) |
| Apogee | the cape | round head, bell-shaped draping cape | a skull, glimpsed through glass |
| **Eclipse** | **the backpack** | **tall, rectangular, blocky** | **nothing — full mirror visor** |

Eclipse is deliberately the "block" to Apogee's "bell": a boxy, square-
edged twin-tank life-support pack reads as the widest silhouette element,
the same structural role Ballast's mantle and Apogee's cape play, but
rectangular instead of curved or draping. Matched, symmetric limbs (like
Apogee, unlike Corvid) — the asymmetry budget on this figure is spent on
nothing; Eclipse is the one crew member built to look procedurally
correct and regulation, not battle-worn or broken. Where Apogee's helmet
answers "what's inside" with a skull, Eclipse's answers with a fully
reflective mirror — you see the outside world reflected back, not a face,
which is the more common real-astronaut image and a clean visual opposite
to Apogee's gimmick.

## 3. Structure, top to bottom

**Helmet.** A faceted (not fully round) dome with a flat mirrored visor
across the whole front — no separate visor-flip overlay like Apogee's,
because the entire face is the mirror here. White glow traces the visor's
frame seam.

**Neck ring.** Banded collar, white-glow status light (not lava).

**Backpack (PLSS).** A rectangular life-support pack with two rounded-top
cylindrical tanks visible side by side — the classic, literal NASA
silhouette. Wider than the torso: the figure's widest point. White-glow
tubing runs from the tanks down into the suit.

**Torso.** Structured and blocky rather than Apogee's soft-shouldered
suit — reads "regulation," not "worn-in." Center seam and chest RCU
(control unit with switches/status lights) from batch 1, per the build
standard's "function-first hardware" rule — a commander's suit has this
by default, not as a later add-on.

**Arms.** Bulky, matched, mirrored — same "no skinny limbs" lesson as
every figure since Corvid's first pass. Gloves with a seam and a wrist
control pad (this figure's own equivalent of Apogee's checklist cuff,
reading as a suit-integrated display rather than a strapped-on card).

**Legs.** Bulky, matched, boots with white-glow sole studs (same visual
family as Corvid's and Apogee's magnetic boots — a genuine crew trait now,
not a coincidence on any one figure).

**Trim.** White-glow piping traces the major seams — helmet frame, neck
ring, torso center and cross seams, arm and leg panel lines, boot soles —
answering "glowing white trim" as a running visual language across the
whole figure, not a one-off accent.

## 4. Palette

| Surface | Value | Notes |
|---|---|---|
| Suit body | dark purple gradient, `#6b4b8a` → `#3a2650` → `#160f22` | "dark purple," per instruction |
| Pack, visor frame, boots | charcoal-purple gradient, `#3a3448` → `#221e2c` → `#0d0b12` | cool-toned hard-surface material, distinct from Apogee's neutral case grey |
| Glow — trim, RCU, boot studs, tank tips | white radial, `#ffffff` hot core → `#dcd8f2` → `#8b83a8` edge | "glowing white trim" — the only saturated-by-contrast colour, unclaimed by any other crew member (Vigil amber, Ballast magenta, Corvid/Apogee lava-orange) |
| Visor | mirrored gradient, `#f4f2ff` → `#9a94b8` → `#332c48`, angled highlight streak | reflective, not transparent — the opposite of Apogee's glass dome |
| Ink outline | `#1c1826` | this figure's own ink, purple-tinted like Apogee's `#221f22` is neutral, so the outline itself carries a hint of the palette |

## 5. Silhouette test — the five-way gate

At 80px, flattened to one colour, Eclipse has to be distinguishable from
Vigil, Ballast, Corvid AND Apogee simultaneously:

| | Vigil | Ballast | Corvid | Apogee | Eclipse |
|---|---|---|---|---|---|
| Read at 80px | narrow spike | wide anvil | broad, mismatched legs | round head, bell cape | tall, rectangular pack |
| Limb symmetry | mirrored | folded | mismatched | matched | matched |
| Widest point | shoulders | mantle | shoulders | the cape | the backpack |

## 6. Build order

Per docs/crew3d/build-standard.md: base masses → detail → props/weathering
→ motion, each batch ending in typecheck → render → screenshot → critique
→ fix, gated against all four existing crew at every stage. Because the
build standard now sets a higher detail floor, batch 1 already includes
seams/rivets/trim rather than flat blocks — "up to standard" applies from
the start, not as a later pass.

1. **Base masses & silhouette** — pack, torso, matched arms/legs, boots,
   faceted helmet with mirror visor. Gate: five-way, per §5. **Done** — one
   real defect found by rendering, not assumed in advance: the tanks'
   first placement (flanking the neck ring) sat almost entirely behind the
   dome's own width and read as two barely-visible slivers, undermining
   the twin-tank PLSS read this figure's whole differentiation strategy
   depends on. Fixed by moving both tanks outward (REVISION 1) so they
   clear the dome and read as the classic silhouette from the first check.
2. **Helmet & pack detail** — visor frame trim, tank details, neck ring
   banding, chest RCU. **Done**, folded into the same pass as batch 1 —
   the RCU and visor frame trim were built in from the start per the
   build standard rather than added later.
3. **Trim & hardware pass** — white-glow piping across every major seam
   (torso center + cross, waist, elbow, knee), tank-to-suit tubing, wrist
   control pads, boot studs, shoulder/tank/neck-ring rivets. **Done** —
   this is the batch that brings the figure up to the build-standard
   density floor explicitly.
4. **Weathering & motion** — **Done.** Weathering deliberately light (two
   small marks total — knee and boot-toe — not the grime density every
   other figure carries, since this is the one crew member who is NOT
   battle-worn). Motion is a genuinely different idle recipe from every
   other figure: a travelling pulse runs along the tank-to-suit tubing
   (`ec-tube`, dash-offset animation) and the neck status light blinks on
   its own short cycle (`ec-status`, stepped) — mechanical "systems are
   live" tells rather than a rigid-body gesture. Touch flares both
   brighter, once, verified via `getAnimations()` (`ec-tube-flare` /
   `ec-trim-flare` both fire on `svg.is-poked`).

All four batches complete. Silhouette gate re-checked after every batch;
holds cleanly against Vigil, Ballast, Corvid and Apogee throughout. Full
test suite green (239/239) with the new file in place.

## 7. Colour variants (REVISION 7)

On request ("a few colour variations of this model"), `EclipseFigure2D`
takes an optional `palette` prop (`EclipsePaletteName`, exported from
`ApogeeFigure2D`'s sibling file alongside `ECLIPSE_PALETTES`). Every
colour in the component was already funneled through a small set of
named constants (`INK`, `PURPLE_HI/MID/LO`, `CASE_HI/MID/LO`) plus two
gradients (`ec-glow`, `ec-visor`); the variants are just different values
for those same names, resolved once per render inside the component and
shadowing the names the other ~500 lines already reference — no geometry
changed, no other line in the file had to be touched.

Five variants, named after eclipse phenomena to match the character's own
naming logic:

| Variant | Body | Glow | Read |
|---|---|---|---|
| `eclipse` (default) | dark purple | white | the original |
| `corona` | near-black | golden-amber | a solar corona's bright ring |
| `bloodmoon` | deep crimson | red-orange | a lunar eclipse |
| `annular` | black | lava-orange | an annular eclipse's "ring of fire" |
| `penumbra` | slate blue-grey | soft cyan | a partial shadow |

`annular` is a flagged, knowing repeat of Corvid's (and Apogee's) black
body + lava-orange glow register, added on direct request after asking
whether the overlap was intentional — same protocol as Apogee's own
REVISION 3 palette override. Its body/case/glow hex values are lifted
directly from Apogee's own colour constants for true consistency with
the two figures it's deliberately echoing, rather than an approximate
lava that almost matches.

Each keeps Eclipse's own formula (dark body, lit glow, case/hardware
tone) rather than becoming a different character — only the hues change.
Silhouette gate is palette-independent by construction (the `f()` helper
collapses every fill to `#050505` regardless of which palette is active),
verified by rendering each variant through the silhouette toggle.

The workshop (`main.tsx`) exposes a variant picker for Eclipse only,
reusing the Orbit Lab's existing skin-button pattern rather than
inventing a new one.

## 8. Hands (REVISION 8, 9, 10)

Direct feedback: the gloves read as "one more arm falling" — a flat
trapezoid block with etched lines standing in for fingers and a thumb,
the same shape language as the upper arm and forearm, so the hand didn't
actually read as a hand. REVISION 8 fixed that with an open hand: a
separate palm shape, four individual finger volumes (index/ring slightly
shorter, middle longest, pinky shortest — uneven on purpose, the same
"nothing perfectly uniform" rule every repeated element on this roster
follows), and a thumb angled off the palm's outer edge via a rotated
rect.

**REVISION 9** then closed that open hand into a clenched fist, on direct
instruction. The four finger volumes became rounded knuckle bumps sitting
along the top of a single curled fist mass (still deliberately uneven in
size), and the thumb rotated down to wrap low across the front of the
fist — over the curled fingers — rather than angling out to the side the
way an open thumb would. All of it stays ungated (ungated = ordinary base
geometry, not `{!silhouette && ...}` decoration) since a hand's shape is
part of the figure's own mass — the silhouette gate shows the fist's
knuckle bumps too, confirmed by rendering, not assumed.

**REVISION 10** — "face his fingers downward." REVISION 9's fist was 24
units wide by 16 tall: wider than it was tall, which read as a mitten
lying on its side rather than a fist hanging naturally off the wrist.
Rebuilt taller and narrower (20 wide by 25 tall) so the fist's own long
axis points down the same direction the arm does, and the thumb's
rotation increased from ±14° to ±38° so it wraps down the side of the
fist instead of angling out across the front. Re-verified against the
silhouette gate and the touch/idle motion (neither references hand
geometry, so neither needed a change) after the resize.

## 9. Attribution note

Original design, no reference image — built directly from "an actual
astronaut, dark purple with glowing white trim," using real EVA-suit
silhouette language (boxy twin-tank PLSS, mirrored visor) already
established as fair game by Apogee's REVISION 14. No borrowed silhouette
from any other crew member.

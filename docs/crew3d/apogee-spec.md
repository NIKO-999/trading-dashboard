# APOGEE — production spec

**Roster:** Special Forces, 2 of 5 · **Role:** EVA specialist — external repair, zero-g maneuvering
**Status:** all 4 batches done and gated (§6), plus REVISION 3 (palette),
REVISION 4 (skull face), REVISION 5 (skull + body detail pass), REVISION 6
(skull sized up), REVISION 7 (skull repositioned lower), REVISION 8
(shoulder pauldrons, chest cross-panel, waist belt, limb straps),
REVISION 9-11 (an explicit, deliberate over-detail pass — pack grille,
neck ring third band, helmet rim highlight, reel bolts, glove fingers,
boot tread, pipe brackets, and a pulsing lava aura around the whole
figure), REVISION 12-13 (a cape — built as a thermal radiator mantle, not
fabric — with a starfield lining, shoulder clasps, and matching skull
detail), and REVISION 14 (four real-EVA-suit tells added on request to
read as more recognizably "astronaut": a gold sun-visor over the top of
the dome, a chest-mounted control unit, an invented mission patch, and
wrist checklist cuffs). This is the densest crew member on the roster
by design.

**Known trade-off, flagged rather than hidden:** the cape is painted
behind the whole figure and is wide enough to cover most of the
matched-limb silhouette §2 describes as Apogee's differentiator from
Corvid. At the 80px gate the figure is still clearly distinct from Vigil,
Ballast and Corvid — it's now the only one with a bell-shaped, notch-hemmed
body — but that distinction comes from the cape's shape rather than the
limbs underneath it, which is a real change from the original design intent
and not just an additive detail pass. Re-checked after every revision in
this batch; the gate holds, but on a different basis than §5 originally
describes.
**Medium:** 2D (SVG), same pipeline as Vigil, Ballast and Corvid

> **On the name.** Apogee — the point in an orbit farthest from the body
> it circles. Fits a crew member whose whole job is being outside the ship.
> Working name, easy to change.
>
> **On why this exists.** Direct feedback on Corvid: none of the three crew
> members built so far actually commit to *astronaut*. Vigil is a wasteland
> servant, Ballast is an armoured sentinel, Corvid is a bird-masked medic —
> all sci-fi vocabulary, none of them a spacesuit in the literal sense.
> Apogee is that gap, built deliberately to be the most overtly "space"
> figure on the roster.

## 1. Concept

The one who goes outside. Where Ballast holds a position and Corvid patches
you up, Apogee works in vacuum — hull repairs, external maintenance,
maneuvering by thruster rather than by foot. Full glass dome helmet with an
actual visible face inside (first time on this roster — everyone else wears
an opaque shell, mask, or visor slit). A chunky maneuvering-thruster pack
replaces the life-support-pack silhouette every other figure uses. A tether
reel at one hip with the cable trailing loose, ending in a connector that
sits slightly OFF the body — the one deliberately zero-g touch on a
figure that otherwise stands like everything else on the roster.

## 2. Differentiation strategy — how this avoids repeating Corvid

Corvid's whole identity is mismatched limbs (one suited leg, one bare
strut) plus a broken helmet panel. Apogee does the opposite on purpose:
**arms and legs are bulky and matched**, close to mirrored, the same way
Vigil's are. The asymmetry lives somewhere else entirely — the tether
reel and its trailing cable, mounted on one hip only, and an uneven
three-nozzle thruster cluster. Two crew members should not lean on the
same trick to be interesting.

This also directly answers separate feedback that Corvid's limbs read too
thin: Apogee's arms and legs are built generously from batch 1, not
thinned first and fixed later.

## 3. Structure, top to bottom

**Helmet.** A full round glass dome — the widest, roundest head shape on
the roster (everyone else is faceted or angular). Suggests glass through a
gradient rather than a hard shell material. Faint HUD marks glow at the
visor's inner edge (batch 2+). What's inside the dome started as a dim
glimpsed face and became, in **REVISION 4**, an actual skull — cranium,
hollow eye sockets, nasal cavity, a suggestion of teeth at the jaw, all at
the same low ink opacity as the original face silhouette so it still reads
as *seen through curved glass* rather than drawn on top of it — with the two
eye sockets glowing lava, the one saturated element in the group and the
clear focal point ("skull within the glass with glowing lava eyes," direct
instruction).

**Neck ring.** A short banded collar where the dome seats onto the suit.

**Thruster pack.** Replaces the life-support-pack silhouette. Wider than
the torso — the figure's widest point, the same silhouette role Ballast's
mantle and Corvid's shoulders play. Three angled nozzle stubs along its
base, uneven in length and angle, each glowing at the tip (batch 2+).

**Torso.** Suited, rounder and softer-shouldered than Corvid's square
block — a pressure suit, not armour plate.

**Arms.** Bulky, matched, closer to mirrored than anything on Corvid.
Gloved hands, no held tool — the point of this figure is maneuvering, not
manipulating.

**Legs.** Bulky, matched, ending in chunky magnetic boots. Both legs the
same construction, unlike Corvid — the asymmetry budget here is spent
entirely on the tether.

**Tether reel & cable.** Mounted at one hip only. The cable loops loose
down past that leg and trails off to the side, ending in a small glowing
connector that sits visibly clear of the body — weightless, even though
the figure stands. This is the silhouette-breaking asymmetry.

## 4. Palette

Originally a genuinely different colour story from all three existing crew
members (warm eggshell-white suit, graphite-navy hard surfaces, electric-cyan
glow — each crew member owning its own, on principle). **REVISION 3** replaced
that on direct instruction: "black and grey gradient with lava eyes and pipes
coming from it." This is a knowing duplication of Corvid's register, flagged
to the user before building (Corvid already owns black/grey + lava) — the
explicit answer was "use lava anyway," so the overlap is intentional, not
missed. Current palette:

| Surface | Value | Notes |
|---|---|---|
| Suit body | `#6b6f78` → `#35383f` → `#0e0f12` gradient | cool black/grey, was warm eggshell-white |
| Pack, visor frame, boots, pipes | `#2a2c31` → `#17181b` → `#08090a` gradient | the hard-surface / case material |
| Glow — visor HUD, nozzle tips, tether connector, boot studs, eyes | lava radial (`#ffe066` hot core → `#ff6a2a` → `#c81e05` edge) | identical hex values to Corvid's lava, reused by explicit instruction |
| Ink outline | `#221f22` | shared crew ink, unchanged |

**Pipes** (REVISION 3): four case-material conduits with lava beads run from
pack to wrist (both arms) and hip to boot (both legs) — "pipes coming from
it." Drawn last, over everything, since a conduit sits on top of the suit
it's attached to.

**Smudges** (REVISION 3): torso, both forearms, and a visor scuff on the
glass itself, answering "smudges and stuff" on the body/arms/legs.

## 5. Silhouette test — the four-way gate

At 80px, flattened to one colour, Apogee has to be distinguishable from
all three existing crew members:

| | Vigil | Ballast | Corvid | Apogee |
|---|---|---|---|---|
| Read at 80px | narrow vertical spike | wide horizontal anvil | broad shoulders, mismatched legs | round head, wide pack, trailing cable |
| Limb symmetry | mirrored | folded/symmetric | deliberately mismatched | bulky and matched |
| Widest point | shoulders | the mantle | the shoulders | the thruster pack |

## 6. Build order

Same render → critique → fix loop as every figure before this one.

1. **Base masses & silhouette** — dome, pack, torso, matched arms and legs.
   Flat fills, inked, no detail. Gate: four-way, per §5. **Done** — two real
   defects found by rendering, not assumed in advance:
   - the pack, painted opaque and after the torso/arms, blotted them out
     entirely rather than reading as "behind the shoulders." Fixed by
     painting it first, so the body sits in front and the pack is only
     visible where it's actually wider than what's in front of it.
   - even after that fix, the pack was tall enough that its bottom edge
     sat right at shoulder height, so the arms still read as sprouting
     directly from the pack rather than hanging from a torso. Fixed by
     shortening the pack and raising the shoulder line so a real stretch
     of torso and arm shows clear below it — see `ApogeeFigure2D.tsx`'s
     "REVISION 2 — pack proportions" comment.

   Passed the four-way gate on the first shape check after both fixes: a
   round glass head and matched bulky limbs read as unmistakably distinct
   from Vigil, Ballast and Corvid even at 80px, and the tether's trailing
   curl is legible at that size too.
2. **Head & pack detail** — visor HUD marks, nozzle glow, neck ring banding.
   **Done**, including the face glimpsed through the glass called for in
   §3 — a dim clipped silhouette with two eye-dots, not a rendered
   portrait, so it reads as glimpsed through curved glass rather than
   drawn on top of the helmet.
3. **Tether & gloves/boots** — the reel, the cable, magnetic boot studs.
   **Done** — reel spokes, cable wrap ticks, a glowing connector tip, boot
   studs (three per boot, same visual language as Corvid's magnetic boots,
   deliberately — the two crew members who actually have visible magnetic
   footwear should feel like a family trait, not a coincidence), and a
   glove knuckle seam on each hand.
4. **Weathering & motion** — **Done.** Knee, boot-toe and pack-corner grime;
   idle: the cable sways from its reel attachment on an asymmetric timing
   (not an even sine wave); touch: the cable snaps further out and back
   as if just tugged, while the connector tip flares — both end together
   (1.1s each) so the class-clearing listener only has to watch one of
   them. Full mechanism in `apogeeFigure2D.css`.

All four batches complete. Silhouette gate re-checked after every batch;
holds cleanly against Vigil, Ballast and Corvid throughout.

## 7. Attribution note

Original design, no reference image — built from the "deep-space EVA
trooper" brief directly. No borrowed silhouette from Vigil, Ballast or
Corvid; the astronaut vocabulary (dome visor, thruster pack, tether reel)
is genre-standard, not lifted from any one source.

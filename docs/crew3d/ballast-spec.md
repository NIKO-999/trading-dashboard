# BALLAST — production spec

**Roster slot:** 2 of 4 · **Discipline:** the hold — not flinching in drawdown
**Status:** PAUSED — built through all 7 batches, then redirected. See below.
**Medium:** 2D (SVG), same pipeline as Vigil
**Companion doc:** `docs/crew3d/vigil-spec.md`

> ### Paused — read this before resuming
>
> The figure is built and working in the dev workshop
> (`web/src/workshop/BallastFigure2D.tsx`, viewable at `/workshop.html`).
> It is dev-only: nothing in the shipped app imports it, tests pass, and
> typecheck is clean, so it can sit here indefinitely without cost.
>
> **Two sections of this document are now STALE and will mislead you:**
>
> - **§2** still describes the wide *anvil* silhouette and its 80px gate.
>   The mantle that created that silhouette was removed on direction. The
>   figure now reads as a cowled column, and the gate needs rewriting to
>   whatever shape is finally settled on.
> - **§3** still specifies the spiked mantle as the hero element. It no
>   longer exists. The hood — worn **down**, bunched across the shoulders,
>   head exposed — occupies that band instead.
>
> Everything else (§1 concept, §4 detail inventory, §5 palette, §6 emissive,
> §7 motion, §9 attribution) still matches what was built.
>
> The last open design question: with the mantle gone, the figure's
> silhouette is closer to Vigil's vertical-column family than intended. If
> width is wanted back without restoring the mantle, growing the elbow
> quills into proper shoulder spikes is the cheapest route.

---

## 0. Why this reference is Ballast

Ballast's original brief was "low, wide, bottom-heavy — a wedge… small head
sunk into a shoulder yoke. Reads as immovable." The supplied reference matches
that read almost exactly — crossed arms, hunched posture, head sunk into the
collar, a stance that says *nothing moves me* — with **one deliberate
inversion**: the reference is **top**-heavy, not bottom-heavy. The mass lives
in an enormous flat spiked mantle rather than in the boots.

Taking the inversion is the right call, because of the silhouette gate:

| | Vigil | Ballast |
|---|---|---|
| Read at 80px | narrow vertical spike | wide horizontal anvil |
| Mass | centred, tall | top-loaded, flared |
| Arms | hanging, open | folded, closed |

Vigil is a vertical; this is a horizontal. Two characters could not be easier
to tell apart as flat shapes, which is exactly what §2's gate demands. A
bottom-heavy wedge would have competed with the drop-crotch trousers Vigil
already owns.

## 1. Concept

A sentinel that has decided not to move. Everything about the design is
**closure**: arms folded and locked, head pulled down into the collar, a
mantle so wide it reads as a barricade the wearer is standing behind. Where
Vigil is a body that waits in the open, Ballast is a body that has shut.

The discipline it carries is holding through drawdown — staying in the
position while it goes against you. So the design must never look *braced* or
*straining*. It looks bored. The weight is already settled; the effort
happened a long time ago.

## 2. Proportion & silhouette

Roughly 6 head units. The mantle spans about **2.4x the shoulder width** of
the body underneath it — that ratio is the character.

**Silhouette test — the hard gate.** As a flat shape at 80px the read must be:
*wide flared spiked bar across the top, sharp taper to a narrow waist, flaring
again to a heavy planted base.* An anvil. If it doesn't read as top-heavy at
80px, the mantle isn't wide enough.

## 3. Structure, top to bottom

**Pipe crown.** Six to eight dark tubes looping up and outward from the back
of the helm, like handles or a cage. Irregular heights, none symmetric. Matte
near-black, catching a thin rim highlight along the top of each loop. This is
the one silhouette element that breaks the mantle's hard horizontal.

**Helm & faceplate.** Dark shell hood. Set into it, a pale **bone-coloured
faceplate** — the only light value above the waist. Two round eye ports with a
cross-hatched grille across each; the glow comes through the grille rather
than from an open lens. Below, a ridged respirator jaw with a small cylindrical
filter canister clamped to one cheek (one side only — asymmetric).

**Mantle.** The hero element. A broad flared collar of overlapping flat plates,
shingled, spanning far past the shoulders and canting upward at the outer ends.
Brass edge-trim lines follow every plate seam. Along the top edge: a row of
short upright pins, taller at the outer corners. The mantle's underside is in
full shadow.

**Arms — folded.** Crossed at the forearm, locked against the chest. Heavy
quilted sleeves with visible horizontal quilt seams. Two buckled straps per
forearm. Gloves end in short dark talons. At each elbow, a fan of stiff quills
juts backward — larger on one side than the other.

**Sash.** A wide wrapped cummerbund in bone/tan, three visible wraps, carrying
a repeating woven **chevron band**. This and the tabard are the only patterned
surfaces on the figure; everything else is plain material.

**Tabard.** A hanging centre panel below the sash in the same bone/tan, same
chevron weave, ending in a fringe of short tassels.

**Hip kit.** A round flask on one hip with a strap over the shoulder, plus one
or two small pouches. Right side only.

**Coat.** A long dark split coat falling to mid-calf, panelled, hem torn into
irregular pointed tongues. Reads as the same family as Vigil's trailing panel
but far bigger.

**Trousers.** Baggy, bone/grey, gathered into the boots. Surface carries a
faint **crackle of crease lines** in a loose diamond net — the detail that
makes the cloth read as worn rather than new.

**Boots.** Tall, tan leather, folded cuff at the top, wrapped strapping, blunt
toe. Scuffed and dirty at the sole line.

## 4. Detail inventory — the "small stuff" pass

This is the list that makes the figure read as *made* rather than drawn.
Nothing here is optional; it is the difference between Vigil's first pass and
its last.

1. Brass trim line on **every** mantle plate seam
2. Upright pins along the mantle's top edge, irregular heights
3. Rivets at each mantle plate corner
4. Quilt seams across both sleeves
5. Two buckles per forearm, with visible tongue and pin
6. Elbow quill fans, asymmetric count
7. Chevron weave on sash **and** tabard
8. Tabard tassel fringe
9. Flask seam + strap + buckle
10. Coat hem tongues, irregular
11. Crease-net on trousers
12. Boot cuff fold line, lace holes, sole seam
13. Grime: smudges at knees, hem, sole line, and mantle underside
14. Thread-level: loose threads at the coat hem and tabard fringe

## 5. Materials & palette

| Surface | Value | Notes |
|---|---|---|
| Coat, mantle, sleeves | near-black charcoal | the field; most of the figure |
| Faceplate, sash, tabard, trousers, boots | warm bone / tan | the only light values |
| Mantle trim, tabard weave | brass | thin lines only, never fills |
| Eye glow | **magenta** | see §6 |
| Grime | warm grey-brown | AO-style, never a drawn shape |

**The palette is the deliberate contrast with Vigil.** Vigil is warm amber
glow on olive and umber. Ballast is **magenta glow on charcoal and bone** —
cold accent, high-contrast, almost no mid-tones. Two crew members should not
share a colour story.

## 6. Emissive

Magenta, and only in two places: the eye grilles, and a **thin rim light**
tracing the figure's silhouette. The rim light is unusual for this project and
is worth the cost — against a dark app background it separates a mostly-black
character from the page, which Vigil solves instead by being olive.

No bulbs. Vigil owns the bulb motif.

## 7. Motion (for the later interaction pass)

Ballast should barely move — that's the discipline. Idle: the pipe crown
catches a slow travelling highlight; the rim light breathes. **The head does
not look around and the arms do not unfold.** On touch: a single slow head
turn toward the viewer and back. Nothing else. If Vigil is a character that
responds, Ballast is one that acknowledges.

## 8. Build order — batches

Each batch ends with a render, a critique pass and a fix pass before the next
starts. Same loop that got Vigil to its current state.

1. **Base masses & silhouette** — coat, trousers, mantle block, head block. Flat
   fills, inked, no detail. Gate: does it read as an anvil at 80px?
2. **Mantle** — plate shingling, brass trim, pins, rivets, underside shadow.
3. **Head** — pipe crown, faceplate, eye grilles, respirator, filter canister.
4. **Arms** — the fold, quilting, straps, buckles, talons, elbow quills.
5. **Sash & tabard** — wraps, chevron weave, tassel fringe.
6. **Lower** — coat panelling and torn hem, trouser crease-net, boots.
7. **Grime & threads** — smudges, scuffs, loose threads, rim light.

## 9. Attribution note

The reference is by the same artist as Vigil's (credited in the image). As
with Vigil: **no tracing, no reuse of their wordmark, and no reproduction of
the insect-drone designs shown alongside the figure.** The vocabulary used
here — pipe crowns, respirator masks, spiked mantles, chevron weave — is genre
vocabulary, and every path in this build is authored from scratch.

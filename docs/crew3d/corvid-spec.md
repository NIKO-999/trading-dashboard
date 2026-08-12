# CORVID — production spec

**Roster:** Special Forces, 1 of 5 · **Role:** field medic / salvage specialist
**Status:** all 6 batches done, plus a REVISION 6 redesign pass on top (§8a)
— helmet, both legs and the arm pose all changed after batch 6 shipped, on
direct feedback. Every structural direction reversed along the way is
folded into the sections below rather than logged separately, since the
code comments in `CorvidFigure2D.tsx` carry the "why" for anyone who wants
the blow-by-blow history. In short, across the whole build: the coat/
over-robe was cut entirely (read as a dress, then as baggy trousers even
opened up); the wide brim was cut in favour of a fitted dome; and that dome
later had a broken panel added, both legs were rebuilt (one as a
reverse-jointed bird leg, one gaining real magnetic boots), and the tool
arm's pose was pulled in tighter to the body.
**Medium:** 2D (SVG), same pipeline as Vigil and Ballast
**Companion docs:** `docs/crew3d/vigil-spec.md`, `docs/crew3d/ballast-spec.md`

> **On the name.** "Corvid" is a working name, not a locked one — it names the
> bird-headed silhouette (crow/raven register: dark plumage, a hooked beak,
> round eyes) and is easy to change without touching the build, since nothing
> outside this dev-only figure references it yet.
>
> **On the tier.** Special Forces sits above the numbered crew (Vigil,
> Ballast, and whatever fills slots 3–4 of that original 4) as its own group
> of five. The brief for this tier is explicit: **the most detailed and
> thoroughly worked-through figures built so far.** Ballast's 14-item detail
> inventory (§4 of its spec) is the bar this tier clears, not matches — see
> §4 below, which runs longer on purpose.

## 0. Why this reference is Corvid

The supplied reference is a bird-headed, plague-doctor-adjacent figure: wide
asymmetric brimmed hat with twin feathers, a beaked mask with round glowing
eyes, fur-trimmed robes over a herringbone vest, a hip satchel of medical
tools (scissors, syringe, a glowing three-segment cell), a held hand-tool, and
one leg reading as a peg-leg under the skirt.

The brief is to reinterpret it in the Mission Control sci-fi vocabulary — the
same move that turned a wasteland generator-servant into Vigil and a spiked
sentinel into Ballast — rather than reskin it literally. Every element below
has a one-to-one sci-fi translation, chosen so the reference's actual
silhouette and prop logic survive the translation intact:

| Reference | Corvid |
|---|---|
| Wide brimmed hat | Fitted dome helmet — spacesuit family, not a brim |
| Twin feathers | Twin antenna fins, unequal length, same asymmetric placement |
| Beak + goggle eyes | Beaked respirator vent built into the helmet, glass lenses underneath |
| Pale face-fringe | Insulation-quilt collar wrapping the jaw |
| Herringbone vest | Quilted pressure-suit weave |
| Fur trim (collar/cuffs/hem) | Glowing thermal-quilt trim, now on suit segment edges rather than a coat hem |
| Apron-skirt | Suit-segmented legs on one side (hip plate, shin plate, boot); the other leg is bare mechanical strut, uncovered |
| Satchel: scissors | Multi-tool / shears |
| Satchel: syringe | Cryo-injector |
| Satchel: glowing 3-bar cell | Charge/fuel-cell gauge — reads almost unchanged |
| Small hip book | Data-slate |
| Held hatchet | Geology pick / salvage tool |
| Peg leg | Mechanical prosthetic strut |
| Boots | Magnetic boots |

Nothing here is invented lore layered on top — it is the same object,
re-materialled.

## 1. Concept

A scavenger-medic: half field surgeon, half salvager, dressed for both jobs
at once. Where Vigil waits and Ballast has shut down, Corvid is always mid-
task — leaning slightly forward, one hand already on a tool. The read should
be *competent and unglamorous* — patched gear that has clearly saved someone's
life more than once, not fresh-issue kit.

The asymmetries carry the character: one leg is a strut, one shoulder carries
the satchel, one hand holds a tool. Nothing about this figure is meant to be
mirror-symmetric, which is itself a point of contrast against Vigil (built
from mirrored limb pairs) and Ballast (folded arms, symmetric mantle).

## 2. Proportion & silhouette

Roughly 6 head units, closer to Vigil and Ballast's own proportions now that
the brim's added height is gone. Broad, square shoulders — deliberately
wider relative to the waist than either existing crew member, which is the
figure's main claim to reading as male at a glance. Corvid's silhouette is
**asymmetric top and bottom**: the antenna fins break the helmet's outline on
one side only, and the leg pair is asymmetric in a way neither Vigil nor
Ballast attempts — one leg fully plated, the other bare mechanical rod.

**Silhouette test — the three-way gate.** At 80px, flattened to a single
colour, Corvid must be distinguishable from BOTH existing crew members at a
glance:

| | Vigil | Ballast | Corvid |
|---|---|---|---|
| Read at 80px | narrow vertical spike | wide horizontal anvil | broad-shouldered dome over a mismatched leg pair |
| Symmetry | mirrored limbs | fully symmetric | deliberately asymmetric throughout |
| Widest point | shoulders | the mantle | the shoulders |

With the brim gone, the leg asymmetry carries more of the identifying weight
than it did in either earlier revision — verified in the workshop's 80px
gate render after each structural change, not assumed from the shape alone.

## 3. Structure, top to bottom

**Helmet.** A fitted dome, tapering to a narrower jaw — the same headgear
family as Sentinel, Cryo and Voyager's own dome, not a wide brim. Matte
copper, riveted at any panel seam rather than fused smooth. Reads as
spacesuit issue at a glance, which a wide brim never did.

**Antenna fins.** Two, unequal length and angle, rising from one side of the
helmet only — never a matched pair. Thin, tapered, catching a faint highlight
down one edge. With the brim gone, this is the helmet's only asymmetry, so it
carries real weight; it should not shrink to an afterthought in later
batches.

**Beak vent / respirator.** Projects down and slightly forward from the
lower face — a hard-surfaced, olive-brass beak plate with a horizontal
vent-slat texture, not a smooth cone. This is the load-bearing "face" element,
the same role Vigil's mask and Ballast's faceplate play.

**Goggle lenses.** Two round lenses set into the face beneath the beak vent,
each with a rim collar and a jade inner glow. Unlike Ballast's grille-covered
glow, these are open glass — the closest thing this figure has to a visible
"eye contact" moment, which the medic register calls for.

**Quilt collar.** A soft insulation ruff wrapping the jaw and neck, ivory
with jade piping along its scalloped edge — echoes the reference's pale
face-fringe without literalising it as fur.

**Torso — quilted vest.** A close-fitting quilted weave in dark rust-brown,
broad and square through the shoulders, the figure's widest point now that
the brim is gone. Fully visible — nothing drapes over it anymore.

**Satchel rig.** Slung across the front on a shoulder strap, hip-mounted.
Houses, left to right: a folded multi-tool, a fuel-cell gauge (the hero prop —
see §6), and a cryo-injector clipped in its own loop. Visible buckles and
stitching, worn at the corners.

**Data-slate pouch.** A small hard-cased pouch on its own strap, opposite hip
from the satchel — the asymmetry keeps the front from reading as evenly
loaded.

**Held tool.** A geology pick / salvage tool gripped in the lower hand,
angled rather than held vertically — mid-task, not at rest.

**Legs — asymmetric pair, now the figure's primary silhouette carrier with
the brim gone.** One leg is built as hard suit segments — a flared hip plate,
a shin plate, a boot, alternating the two hull materials the way a real
pressure suit alternates hard and soft sections. The other leg is a bare
mechanical prosthetic strut, deliberately uncovered its full length: no hip
plate, no panel, just the rod, a joint break, and a flat foot plate. The
contrast is "fully suited" against "openly mechanical," not two versions of
the same idea in different widths — that was the earlier design (a soft boot
vs. a thin strut) and it read as two variations on one leg rather than a real
asymmetry.

**Boots / foot plate.** The suited leg's boot: worn leather-analogue,
magnetic sole visible as a thin dark band. The strut's foot plate: bare metal,
no boot, deliberately harder-edged than its partner.

## 4. Detail inventory — the "small stuff" pass

Ballast's 14-item list was the previous bar. This tier is meant to exceed it —
every item below is load-bearing, not decorative filler:

All 18 done as of batch 5. `#6` and `#9` are worded as originally written
(jade piping, brass trim) even though REVISION 4 recoloured both — the item
is still satisfied, only the hue moved to lava/obsidian; see §5.

1. Rivets along the helmet's panel seams, irregular spacing — **done**
2. Highlight down one edge of each antenna fin, the two fins NOT matching
   in brightness or angle — **done**
3. Horizontal vent-slats across the beak plate, worn unevenly — **done**
4. Rim collar + inner glow on each goggle lens, lenses NOT identical size — **done**
5. Scalloped edge on the quilt collar, irregular depth (same lesson as
   Ballast's frayed hem — uniform notches read as sawtooth) — **done**
6. Piping along the collar's scalloped edge (lava, was jade) — **done**
7. Visible quilt seams on the vest, following the torso's curve — **done**
8. Weathering/discoloration patches on the suited leg's plates, clustered
   rather than evenly scattered — **done**, batch 5
9. Glowing edge-seam where the hip plate and shin plate meet (lava crack,
   was brass trim) — **done**
10. Satchel strap stitching and a metal strap-guide ring — **done**, batch 3
11. Three-segment fuel-cell gauge with its own glow, at least one segment
    dimmer than the others (mid-charge, not full — reads as USED equipment) — **done**
12. Cryo-injector's own small clip/loop separate from the satchel body — **done**
13. Data-slate pouch clasp, distinct from the satchel's buckle style — **done**
14. Wear/scuffing on the held tool's handle grip — not yet; the tool exists
    (batch 4) but has no wear marks of its own yet
15. Joint detailing on the mechanical strut — at least two visible hinge
    points, not a smooth tube — **done**, batch 5: a full gap joint plus a
    lighter bolt-collar second hinge near the foot
16. Foot-plate tread pattern on the strut's base, contrasting the suited
    leg's boot sole — **done**, batch 5
17. Small scratches/scoring on the strut's plating (mechanical wear,
    different in character from the suited leg's plate wear) — **done**,
    batch 5
18. Grime: satchel corners, hip-plate seam, boot toe, strut lower joint — **done**, batch 5

## 5. Materials & palette — obsidian & lava (REVISION 4)

Rust trader is retired. Replaced during batch 4 on direct instruction: black
hull with a white gradient highlight, lava glowing through the plate seams
and the eyes rather than a flat accent colour. The construction — one glossy
hull material, one flatter case material, one saturated glow — carries over
unchanged from rust trader; only the hues moved.

| Surface | Value | Notes |
|---|---|---|
| Hull / helmet / vest / hip plate | `#f4f4f7` → `#5c5c66` → `#0a0a0d` gradient | white highlight to near-black, the glossy material |
| Case material — satchel, pouch, boots, arm sleeves | `#28282e` → `#151519` → `#08080a` gradient | flatter, no white highlight — the matte material |
| Glow — eyes, gauge, piping, plate-seam cracks | `#ffe066` → `#ff6a2a` → `#c81e05` radial (flat `#ff6a2a` for thin strokes) | lava: hot core to red edge, not a flat glowing disc |
| Ink outline | `#221f22` | unchanged — still matches the shared crew ink |

Lava reads as damage/heat rather than decoration specifically because it is
placed where a seam or joint already exists structurally — the hip/shin
plate seam, the strut's exposed joint gap, a crack down the helmet dome —
rather than added as trim on flat, uninterrupted surfaces.

## 6. Emissive

Jade, in exactly three places: the goggle lenses, the fuel-cell gauge, and the
collar piping. No rim light (that motif belongs to Ballast) and no bulb
network (that belongs to Vigil) — Corvid's glow is functional equipment light,
not body light. The gauge is the hero: one dim segment among the three is
what sells "field-worn tool" rather than "decorative meter."

## 7. Motion (for the later interaction pass)

Corvid should read as mid-task even at rest — the idle motion is a slow
weight-shift onto the strut leg and back, plus the held tool drifting a few
degrees as if about to be used. On touch: the head tilts toward the viewer
(a medic noticing you), then the held hand raises the tool slightly before
returning — a "one moment" gesture, distinct from Vigil's look-around and
Ballast's single slow turn.

## 8. Build order — batches

Same render → critique → fix loop that built Vigil and Ballast. Given the
tier's brief, no batch proceeds until the previous one has been rendered,
screenshotted, and checked against the 80px three-way gate (§2) where
relevant — stopping for review between batches rather than chaining several
blind.

1. **Base masses & silhouette** — helmet, antenna fins, vest, suited leg vs.
   bare strut leg. Flat fills, inked, zero detail. Gate: does it read as a
   broad-shouldered figure with a mismatched leg pair, distinct from both
   Vigil and Ballast at 80px? **Done** — passed after two structural
   revisions (coat cut, brim cut), see the status note at the top.
2. **Head** — beak vent, goggle lenses, antenna fin highlights, quilt collar.
   **Done.**
3. **Torso & satchel rig** — vest quilt seams, satchel with its three tools,
   data-slate pouch. **Done** — the satchel/data-slate straps ended up
   painted last, over the whole figure, rather than mid-stack where they
   were first drawn; see `CorvidFigure2D.tsx`'s "straps, painted LAST"
   comment for why.
4. **Arms & held tool** — **Done.** Also carried REVISION 4 (the palette
   change, §5). First pass had two real defects, both found by rendering:
   the left arm hung almost entirely inside the satchel's own footprint and
   was nearly erased by it, and the right arm's elbow/hand/tool bent three
   different directions in a row, reading as disconnected pieces rather
   than one gripping arm. Both fixed by geometry — see `CorvidFigure2D.tsx`'s
   "REVISION 5 — arm geometry" comment.
5. **Legs** — hip-plate/shin-plate seam trim, strut joint detailing,
   boot vs. foot-plate tread. **Done** — a second strut hinge, plating
   scratches, boot sole line vs. foot-plate tread (the batch's own explicit
   contrast requirement), and grime at the satchel corners, hip-plate seam,
   boot toe and strut lower joint.
6. **Weathering & motion** — **Done.** Grip wear closed out detail item 14
   (all 18 now complete). Motion built per §7: `.cv-torso` carries the idle
   weight-shift, `.cv-tool-arm` the idle tool drift; on touch, `.cv-head`
   tilts and `.cv-tool-arm` switches to a raise gesture instead of layering
   a second animation on top of the drift. Full mechanism and the reasoning
   for the paint/timing choices are in `corvidFigure2D.css`.

## 8a. REVISION 6 — the redesign pass

After batch 6 shipped, direction came back to push three regions further:
the head needed to be distinctive rather than competent, the legs needed to
be unique and read as more overtly "spacey," and the suited leg's magnetic
boots — mentioned in §0's translation table from the start — had never
actually been built as a visible detail. The arm pose also changed. None of
this touches the outer silhouette that passed the batch-1 gate; all of it
is surface detail or geometry inside the existing masses.

**Helmet.** A section of the dome plating on the antenna-fin side has
broken away entirely, revealing the lava-lit inner framework beneath rather
than a crack drawn on an intact surface. Built as an overlay inside the
dome's existing outline rather than a cut into the silhouette itself — the
outer shape had already cleared the three-way gate twice and didn't need to
be put at risk for a detail-level change. The original single crack line
survives, shortened, as the fracture that led to the break.

**Strut leg.** Rebuilt as a reverse-jointed bird leg — the same backward
knee-bend angle a real avian leg reads at, which nothing else on this
figure or on Vigil/Ballast uses. A lava core glows down its exposed length
(two segments, split at the joint). Ends in three bare talons and a small
back spur instead of a flat tread-marked plate.

**Suited leg.** Kept its two-plate system but the boot is now a genuine
magnetic boot: three blunt padded toe segments, each with its own glowing
contact stud. Padded-and-blunt vs. bare-and-clawed is the new version of
the suited/bare contrast the spec always wanted — it reads far more
distinctly than two rectangles of a different width ever did.

**Arm pose.** The tool-holding arm now tucks in close to the body — elbow
near the ribs, hand ending by the hip near the satchel — rather than
reaching out to the side past the figure's own silhouette. Reads as the
tool held at the ready against the body, not reaching for something.

## 9. Attribution note

Original interpretation only — no tracing, no reuse of any wordmark or brand
element visible in the reference, and no reproduction of any other character
design shown alongside it. The vocabulary used here (beaked respirator masks,
flared dish helmets, satchel medic rigs, mechanical prosthetics) is genre
vocabulary; every path in this build is authored from scratch, the same
standard applied to Vigil and Ballast.

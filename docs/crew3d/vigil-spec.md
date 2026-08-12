# VIGIL — production spec

**Roster slot:** 1 of 4 · **Discipline:** the wait — not entering
**Status:** spec approved (rev. 2 — redirected), assets not yet authored
**Runtime record:** `web/src/moonshot/crew3d/roster.ts`
**Medium:** 2D (SVG) — see §10; the 3D pipeline in this repo targets a later pass

---

## 0. Revision note

Rev. 1 was a gothic reliquary knight. It is fully superseded — this document
describes the character now, not a variant of it. The redirect came from a
supplied reference: a robed "generator servant" figure (wasteland-steampunk
registry — insectoid gas mask, rubber tubing, glass vacuum tubes, ceramic
limbs). Rev. 1's structural rigor (a hard silhouette gate, a fixed prop
inventory, materials that don't repaint per tier) carries forward unchanged;
only the design itself is new.

## 1. Concept

A servant built to carry current. Everything about it is plumbing: rubber
tubing runs the length of its body like a circulatory system, feeding a string
of glass vacuum-tube bulbs that glow amber wherever the load is heaviest. It
holds a dense power cell aloft on one shoulder — and it has held it so long
that holding is no longer effort, just posture.

**Reconciling the reference with the discipline it embodies.** The reference
is mid-labor, not mid-wait. Vigil's read has to stay "the wait — not
entering," so the character is not depicted doing a task — it is depicted
having done this one task, motionlessly, for longer than a body should be
able to. The cell never comes down. The arm never tires. That is the same
"waited so long it became architecture" idea rev. 1 had, aimed at a servant's
labor instead of a knight's stillness. Where a design choice would suggest
effort or strain — a bent knee, a grimace, a shifted brace — the choice is
wrong, for exactly the reason rev. 1 ruled out anything that looked poised to
move.

## 2. Proportion & silhouette

Stockier and more grounded than rev. 1 — broad shoulders, a thick wrapped
torso, wide ballooning trousers gathered at the ankle. Roughly 5.5 head units,
big-booted, no neck to speak of (the mask sits low into the shoulder wrap).

**Silhouette test — the hard gate, unchanged in principle from rev. 1.**
Rendered as a flat shape at 80 px, the read must be: *domed insect head, one
armored shoulder, a slab held overhead-side, ballooning legs to a narrow
ankle.* The asymmetric shoulder is the single most load-bearing silhouette
decision — it's what keeps this from reading as a generic robed figure at
small size.

## 3. Structure, top to bottom

**Mask.** A smooth black insectoid dome — no jaw, no visible mouth. Two
glowing amber lens-eyes, teardrop/triangular, canted slightly down at the
outer corners. Two thin antenna-stubs or vent pipes at the temples, swept
back. No hair, no skin, ever visible.

**Neck wrap.** A thick knitted collar, olive drab, wound high enough to
obscure where mask ends and body begins. Faint pale circuit-line stitching
glows very softly across it — the only glow on the character that isn't a
bulb or a lens.

**Torso.** A wrapped, layered robe — dark umber over the olive underlayer,
bound with a wide fabric sash at the waist. Built from folds and wraps, not
panels; nothing about the torso reads as armor plate except the one shoulder
below.

**Right shoulder & arm — the asymmetry.** Segmented, riveted brown-leather
armor plate, banded like a lobster tail, running shoulder to mid-forearm.
Where the plate ends, the forearm is bare and glows (§4). This is the
character's one piece of real hardware, and it sits on only one side on
purpose — an even loadout on both arms would read as a soldier, not a
servant.

**Left arm — the held weight.** Bare but for wrap and tubing, raised, forearm
resting the power cell against the shoulder. This is the pose the whole
character exists to justify: the arm that never comes down.

**Tubing & bulbs.** Dark red rubber hose, routed like veins — collarbone to
both shoulders, down the sash, looping to the hip. Glass vacuum-tube bulbs
break the line wherever a major junction would be: one per shoulder, one at
the sternum, two hanging loose below the sash. Amber-lit, brightest at the
sternum bulb.

**Hip pouch.** A squat drum canister on a cross-body strap, worn low on one
hip — fuel or coolant for the cell, not a weapon.

**Trailing panel.** A single torn strip of the same olive fabric as the neck
wrap, hanging from the sash on the side opposite the pouch, down past the
knee. The only piece of the silhouette that could ever move (§7) — everything
else on this character is wrapped tight enough that it wouldn't.

**Trousers.** Wide, gathered, ballooning through the thigh and cinched hard at
the ankle — near-black, faint pinstripe, scattered dull-gold stain speckle.
The volume here is load-bearing the same way rev. 1's cloak was: it's most of
the silhouette's lower mass.

**Hands & feet.** Cracked ceramic/stoneware, cool blue-grey, with thin pale
glowing crack-lines and a few rust-stain spots. Blunt, worn, non-anatomical —
these are fittings, not hands in the human sense. No individual fingers
articulated beyond a thumb break; detail here is cracks and glaze, not
knuckles.

## 4. Prop inventory

Every item survives into the drawing. Nothing on this list is optional.

1. Power cell — a dark rectangular slab, held, not set down
2. Shoulder armor — segmented plates, visible rivets, banded like a tail
3. Vacuum-tube bulbs — 5 total: 2 shoulder, 1 sternum, 2 loose below the sash
4. Tubing network connecting every bulb to a shoulder or the sash
5. Hip pouch — drum canister, cross-body strap
6. Trailing torn panel, opposite hip from the pouch
7. Neck-wrap circuit stitching (glow, not a bulb)
8. Trouser stain speckle
9. Ceramic crack-glow on both hands and both feet

## 5. Materials

| Surface | Base | Notes |
|---|---|---|
| Mask shell | near-black, cool | subtle warm rim reflection only, never a highlight that reads as "shiny plastic" |
| Lens-eyes | amber glow | the brightest point on the face; everything else on the mask stays flat |
| Neck wrap / trailing panel | olive drab | pale stitched glow-line detail, low intensity |
| Torso wrap | dark umber over olive | folds read through value shifts, not outline |
| Shoulder armor | worn brown leather + brass rivets | wear as edge-lightening, not scratches |
| Tubing | dark red rubber | matte, slightly darker in its own shadow-folds |
| Bulbs | amber glass over brass base caps | glow is the point; the glass itself stays simple |
| Trousers | near-black brown | pinstripe + gold speckle, both very low-contrast against base |
| Ceramic hands/feet | cool blue-grey | pale crack-glow, a few rust-orange stain spots |

Palette logic: warm dark neutrals (mask, torso, trousers) as the field; one
warm amber family (eyes, bulbs) as the only true glow; one cool blue-grey
family (ceramic limbs) as the sole cold accent, so the eye has exactly one
place to land that isn't glow and isn't earth-tone.

## 6. Emissive

Amber is the only glow family — lens-eyes, five bulbs, faint neck-wrap
stitching. No separate "hero" glow the way rev. 1's halo was; the read here
is a body with many small lit points rather than one dominant one, which
suits a servant covered in plumbing better than a single dramatic source
would.

## 7. Motion (2D — see §10 on medium)

This spec targets a 2D illustration for now, not a rigged 3D asset, so motion
is descriptive rather than a rig spec: if this is ever animated, the only
things that should move are the trailing panel (drift) and the bulbs
(a slow independent flicker/breathe per bulb, not synchronized — it should
read as several small imperfect lights, not one system). Everything else —
mask, shoulder armor, tubing, trousers, ceramic limbs — is wrapped, plated or
rigid, and should hold still, for the same "never sets it down" reason as §1.

## 8. Later passes — do not build now

Rank/XP tier variants are out of scope, same as rev. 1. When they arrive:
brighten the amber family and/or add bulbs, never redraw the figure.

## 9. Tonal note

This sits further from Voyager's chibi-astronaut register than even rev. 1
did — a wasteland labor-servant instead of a spaceman, still nothing like a
death-knight either. The through-line across all of Moonshot's crew is not a
shared world, it's a shared discipline: each character embodies one habit
this module rewards. Confirmed again on this redirect for the same reason it
was confirmed on rev. 1 — see the original note this superseded.

## 10. Medium

Built as a 2D SVG illustration (`web/src/workshop/VigilFigure2D.tsx`), not a
3D asset. This environment can draw real vector art with genuine fidelity —
gradients, curves, layered detail — which is not true of the primitive-based
3D blockout pipeline built earlier in this project. The 3D runtime module
(`web/src/moonshot/crew3d/`) and its budget/loader/particle scaffolding are
untouched by this redirect and remain available for a later pass if this
design is ever taken to 3D; nothing here requires them.

## 11. Delivery checklist

- [ ] Mask, lens-eyes, antenna stubs
- [ ] Neck wrap with glow-stitch detail
- [ ] Torso wrap + sash
- [ ] Shoulder armor (segmented, riveted) — one side only
- [ ] Bare glowing forearm on the armored side, below the plate
- [ ] Held power cell, raised arm
- [ ] Tubing network + 5 bulbs
- [ ] Hip pouch
- [ ] Trailing torn panel, opposite the pouch
- [ ] Trousers — volume, pinstripe, speckle
- [ ] Ceramic hands + feet with crack-glow
- [ ] Silhouette passes the 80 px flat-shape test (§2)

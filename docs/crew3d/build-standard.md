# Crew build standard

**Status:** in effect for crew members built from here forward. Vigil,
Ballast and Corvid are not being retrofitted to match — this is a floor
for new work, not a backfill project.

> **Why this exists.** Apogee went through a long, explicit "keep going"
> detail pass (REVISION 5 through REVISION 14 in `ApogeeFigure2D.tsx`) that
> pushed it well past what batches 1-4 alone produce. The user's call after
> seeing the result: *that* density is now the expected baseline for future
> crew, not a one-off. This doc pins down what specifically should carry
> forward, so the next character starts at Apogee's finish line instead of
> Vigil's.

## What carries forward

**Detail density.** A finished figure should read as "instrumented
hardware" at every major surface, not just at the silhouette-defining
masses. Concretely, per limb/torso segment: a panel seam or two, at least
one rivet or bolt, and at least one grime/scuff mark — not one pass with a
single smudge per limb. Apogee's forearms alone carry a panel line, a
restraint strap with its own buckle, a smudge, and (post-REVISION 11) a
finger-seam pass; that's the density to match, not exceed-by-default, but
also not undershoot.

**Function-first hardware, not decoration.** Every added mark should be
something a real version of the object would have — a seam because two
panels actually meet there, a rivet because something is actually bolted,
a strap because something needs to stay closed. Apogee's chest RCU, wrist
checklist cuffs, and mission patch (REVISION 14) are the model: real
EVA-suit hardware, reasoned about, not generic greebling. When a character
isn't a spacesuit, the equivalent is whatever *that* character's world
actually carries (Ballast's buckles and canister, Corvid's tool grip) —
the standard is "detail earns its place," not "add a rivet."

**Irregularity over uniformity.** Every notch, fold, rivet spacing, and
scatter must vary in width/depth/spacing — a lesson re-learned on Apogee's
cape hem after Ballast and Corvid already established it. A perfectly even
pattern reads as a decal; an irregular one reads as made.

**Silhouette-safe by construction, not by review.** Every decorative
addition is wrapped in `{!silhouette && ...}`, and every glow/gradient fill
goes through the figure's `f()` helper. This isn't optional at any detail
density — the 80px gate (docs/crew3d/*-spec.md §5 or §6, per character) has
to hold after *every* revision, checked by rendering, not assumed. Apogee's
gate was re-verified after all 14 revisions in this file and never broke.

**A figure may carry one large signature silhouette element** beyond limbs
— Ballast's mantle, Corvid's satchel, Apogee's cape — if the character's
own concept earns it. This is not "give every character a cape." It's
permission to let one big shape do real identity work instead of confining
big moves to base-mass proportions alone. If a future character adds one,
treat it the way Apogee's cape was treated: verify what it does to the
silhouette gate, and say so plainly in the spec if it changes the basis for
that character's distinctiveness (see apogee-spec.md's "Known trade-off"
note — that kind of honesty about a design's side effects is itself part
of the standard, not a one-time confession).

## What does NOT carry forward automatically

- **Astronaut-specific hardware** (gold visor, RCU, mission patch, EVA
  checklist cuffs) belongs to Apogee's concept. A non-spacesuit character
  gets its own equivalent research, not these specific shapes reused.
- **The lava palette** is Corvid's and (by explicit, flagged, one-time
  override) Apogee's. Each new character still gets its own colour story
  by default, per every existing spec's differentiation section — lava is
  not now "the roster's accent colour."
- **The aura** (a blurred glow behind the whole figure) is a deliberate,
  named "go super extra" addition on one character. It is not a default
  every figure now needs.

## Process, unchanged

Batch discipline stays exactly as documented per-character: base masses →
detail → props/weathering → motion, each ending in typecheck → render →
screenshot → critique → fix. The only change this doc makes is *how much*
a detail batch should add before it's considered done, and what kind of
hardware-reasoning should justify each addition.

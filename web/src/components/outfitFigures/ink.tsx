/* ============================================================
   Outfit ink — the shared finish language for all ten outfits.

   ---------- WHY THIS EXISTS ----------

   The outfits were each authored on their own review page and ported in one
   at a time, so each brought its own idea of an outline. Measured across the
   nine custom figures: four carried a genuinely dark stroke (Ironclad
   #0a0b0c, Revenant, Outrider, Pyro #000000), two were mid-tone, and three —
   Sentinel, Herald, Cryo — had no dark stroke at all, only tinted detail
   lines in their own hue family.

   That is exactly why those three dissolved into the app's dark background
   while Ironclad and Pyro sat crisply on it. The crew solved this long ago
   with one ink constant applied systematically; this is the same fix, and
   the reason it is a module rather than a copied constant is that "all ten
   share one finish" is a claim that has to stay true as figures get edited.

   ---------- WEIGHTS ----------

   The outfits are drawn roughly twice the scale of the crew — the crew use a
   100x130 viewBox, the outfits mostly 200x300 — but both render at similar
   pixel sizes. So an outfit unit is about half a crew unit on screen, and
   matching the crew's visual weight (2 / 1.2 / 0.7) means roughly doubling.

   Doubling exactly lands on 4, which is too heavy here: on a 200-wide figure,
   ink at 4 merges adjacent outlines into black mass and internal layer edges
   stop reading. That was found by rendering, twice. 3 is what these were
   dialled to, again by rendering — checked at 300px, where it separates the
   figure cleanly, and at 130px, where it still holds.

   Sub-2-unit details need PROPORTIONAL ink or the stroke is wider than the
   shape it outlines and erases it — that is what INK_FINE is for, not a
   general-purpose thin line.
   ============================================================ */

/** Near-black with a hint of warmth, matching the crew's own ink so the two
 *  sets read as one art direction when they stand next to each other. */
export const INK = '#221f22';

/** Primary silhouette: helmet, torso, limbs, pack, cape. */
export const INK_MAIN = 3;

/** Sub-shapes sitting on top of a primary: panels, pauldrons, visor frames. */
export const INK_SUB = 1.8;

/** Anything under ~2 units across. Below this the stroke eats the shape. */
export const INK_FINE = 1;

/**
 * A grounding shadow under the feet.
 *
 * This is a component rather than a constant because the outfits do NOT share
 * a viewBox — herald is 200x320, pyro and cryo are `0 -55 200 335`, ironclad
 * is 220x280, the rest 200x300 — so there is no single y that puts a shadow
 * on the floor for all of them. Each figure passes its own, and what's shared
 * is the look: same colour, same softness, so the set sits on one floor.
 *
 * Several outfits previously had only a coloured glow pool, which reads as the
 * figure emitting light rather than resting on something. Draw this first and
 * let the glow sit over it.
 */
export function Contact({ cy, cx = 100, rx = 46, ry = 7 }: { cy: number; cx?: number; rx?: number; ry?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#05060a" opacity={0.42} />;
}

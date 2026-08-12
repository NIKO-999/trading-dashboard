import { CharacterFigure } from '../components/CharacterArt';

/* ============================================================
   Crew lab — the ten companions. DEV ONLY.

   These SHIPPED. The art now lives in `components/CharacterArt.tsx` and this
   file re-exports it rather than keeping a second copy — the lab existed to
   judge the set as a group before it replaced anything, and it did. Holding
   a duplicate past that point only creates two places to edit and one of
   them to forget.

   What stays here is PETS: the lab's own metadata (kind, metric, tier, the
   one-line note), which is design bookkeeping rather than app data. The
   thresholds those tiers turned into live in data/characters.ts.

   ---------- THE REGISTER ----------

   These are PETS, and that word is doing real work. The temptation after
   Vigil and Ballast is to import that vocabulary wholesale — panel seams,
   rivets, grime, battle wear. That was actively wrong here, and the first
   attempt at Bedrock proved it: it grew articulated knee joints, a recessed
   sensor housing and ground-anchor spikes, and became a military walker.

   Detail on a pet means something different from detail on a sentinel:

     · proportion       oversized head, small body — the inverse of armour
     · eyes             a lens that LOOKS at you, with an iris and a
                        highlight, not an instrument aperture
     · wear             well-loved, not battle-scarred: scuffed paint, a
                        mismatched repair patch, a dangling tag
     · line             softer and rounder; hard chamfers read as equipment
     · silhouette       one endearing quirk that breaks the outline

   Mixed kinds on purpose — machines, creatures, spirits, constructs — so
   ten companions don't collapse into ten variations of one idea.

   ---------- UNLOCKS ----------

   characters.ts used to map five crewmates to five discipline metrics
   one-to-one. Ten needs a second axis, and the cheapest honest one is TIER:
   each discipline gets an early companion and a late one, so all ten unlocks
   come out of metrics the app already tracks rather than five invented ones.
   That is now implemented — see the ladder at the top of data/characters.ts.
   ============================================================ */

export type PetKind = 'machine' | 'creature' | 'spirit' | 'construct';

export type PetDef = {
  id: string;
  name: string;
  kind: PetKind;
  /** which existing discipline metric gates it, and at which tier */
  metric: 'attendance' | 'clean' | 'calm' | 'steady' | 'lifetime';
  tier: 'early' | 'late';
  /** one line — what it is, in the register */
  note: string;
  /** false until it has been drawn */
  built: boolean;
};

export const PETS: PetDef[] = [
  // ---- redesigns of the five that shipped ----
  { id: 'beacon', name: 'Beacon', kind: 'machine', metric: 'attendance', tier: 'early', built: true,
    note: 'Hovering lantern-drone. Big lamp, small body, one dangling tag.' },
  { id: 'bedrock', name: 'Bedrock', kind: 'creature', metric: 'clean', tier: 'late', built: true,
    note: 'Low shelled grazer. Heavy, patient, sleeps standing up.' },
  { id: 'wisp', name: 'Wisp', kind: 'spirit', metric: 'calm', tier: 'early', built: true,
    note: 'Drifting ring of light with trailing tendrils. No body at all.' },
  { id: 'anchor', name: 'Anchor', kind: 'machine', metric: 'steady', tier: 'late', built: true,
    note: 'Weighted bell-buoy. Rocks and self-rights, never tips.' },
  { id: 'aegis', name: 'Aegis', kind: 'construct', metric: 'lifetime', tier: 'late', built: true,
    note: 'Tall folding guardian. Unfolds when watched, closes when not.' },

  // ---- five new ----
  { id: 'ember', name: 'Ember', kind: 'creature', metric: 'attendance', tier: 'late', built: true,
    note: 'Small furred thing with a coal in its chest. Warms as the streak grows.' },
  { id: 'pebble', name: 'Pebble', kind: 'construct', metric: 'clean', tier: 'early', built: true,
    note: 'A single hovering stone that has decided to follow you. Barely a creature.' },
  { id: 'moth', name: 'Moth', kind: 'spirit', metric: 'calm', tier: 'late', built: true,
    note: 'Dust-winged drifter. Settles on Voyager\'s shoulder and stays.' },
  { id: 'sprocket', name: 'Sprocket', kind: 'machine', metric: 'steady', tier: 'early', built: true,
    note: 'Scrappy wheeled bot, one wheel bigger than the other. Endlessly busy.' },
  { id: 'quill', name: 'Quill', kind: 'creature', metric: 'lifetime', tier: 'early', built: true,
    note: 'Spined burrower. Curls into a ball when startled, uncurls when safe.' },
];

/* ---------- art ----------
   One source of truth, in the shipped component. */

export function PetFigure({ id, uid }: { id: string; uid: string }) {
  return <CharacterFigure id={id} uid={uid} />;
}

/** Standalone render, matching CharacterArt's viewBox. */
export function PetArt({ id, size = 110, name }: { id: string; size?: number; name?: string }) {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 100 130" role="img" aria-label={name ?? id}>
      <PetFigure id={id} uid={id} />
    </svg>
  );
}

/* ============================================================
   Roster contact sheet — every shipped figure, one grid, one size.

   Built for a specific job: judging the roster as a SET rather than judging
   figures one at a time. The Wardrobe page shows one outfit at a time by
   design (you are choosing what to wear), and VoyagerLab shows one figure's
   gear ladder. Neither answers "do any two of these read as the same
   character", which is the only question that matters when the complaint is
   that the roster feels samey — and it is a question you physically cannot
   answer by flipping between pages, because the comparison happens in
   memory rather than in the eye.

   Renders the REAL components (Voyager with each outfitId, CharacterArt for
   each crewmate), so there is no second copy to drift — the same principle
   VoyagerLab is built on.

   Dev-only, like everything else in workshop/. Delete freely.
   ============================================================ */

import { Voyager } from '../components/Voyager';
import { CharacterArt } from '../components/CharacterArt';
import { OUTFITS } from '../data/outfits';
import { CHARACTERS } from '../data/characters';
import { PETS, PetArt } from './CrewLab';

const CELL: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  padding: '10px 6px',
  borderRadius: 12,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
};

const LABEL: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 10,
  letterSpacing: 0.4,
  color: '#c8ccd4',
  textAlign: 'center',
};

const SUB: React.CSSProperties = { ...LABEL, fontSize: 9, color: '#767c86' };

export function RosterSheet({
  size = 130,
  cleanDays = 150,
}: {
  size?: number;
  /** gear tier the outfits are shown at — 150 is the full ladder, so the
   *  clean-day attachments never mask a difference between outfits */
  cleanDays?: number;
}) {
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px 24px 48px' }}>
      <div style={{ ...LABEL, fontSize: 12, textAlign: 'left', marginBottom: 10 }}>
        WARDROBE · {OUTFITS.length} outfits on Voyager's rig
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(${size + 26}px, 1fr))`,
          gap: 12,
          marginBottom: 30,
        }}
      >
        {OUTFITS.map((o) => (
          <div key={o.id} style={CELL}>
            <Voyager cleanDays={cleanDays} size={size} outfitId={o.id} />
            <div style={LABEL}>{o.name}</div>
            <div style={SUB}>
              {o.bodyType === 'custom' ? 'custom body' : 'shared rig'} · lv {o.unlockLevel}
            </div>
          </div>
        ))}
      </div>

      {/* Redesigns sit ABOVE the shipped crew rather than replacing them
          in place, so the two sets are visible in the same scroll and the
          question "is this actually better" can be answered by looking
          rather than remembering. */}
      <div style={{ ...LABEL, fontSize: 12, textAlign: 'left', marginBottom: 10 }}>
        CREW LAB · {PETS.filter((p) => p.built).length} of {PETS.length} redesigned · dev only
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(${size + 26}px, 1fr))`,
          gap: 12,
          marginBottom: 30,
        }}
      >
        {PETS.map((p) => (
          <div key={p.id} style={{ ...CELL, opacity: p.built ? 1 : 0.28 }}>
            {p.built ? (
              <PetArt id={p.id} size={size} name={p.name} />
            ) : (
              <div style={{ height: size * 1.3, display: 'grid', placeItems: 'center', ...SUB }}>
                not drawn
              </div>
            )}
            <div style={LABEL}>{p.name}</div>
            <div style={SUB}>
              {p.kind} · {p.metric} {p.tier}
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...LABEL, fontSize: 12, textAlign: 'left', marginBottom: 10 }}>
        CREW · {CHARACTERS.length} shipped (unchanged)
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(${size + 26}px, 1fr))`,
          gap: 12,
        }}
      >
        {CHARACTERS.map((c) => (
          <div key={c.id} style={CELL}>
            <CharacterArt id={c.id} size={size} />
            <div style={LABEL}>{c.name}</div>
            <div style={SUB}>{c.origin}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

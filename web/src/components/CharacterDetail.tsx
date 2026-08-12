/* ============================================================
   Crew detail — who they are, where they're from, and what it takes to bring
   them along. "Where they're from" is never invented: it's a real stop on the
   Earth-to-Moon road (data/waypoints.ts), rendered with the same PlanetArt
   the trajectory line itself uses, so a crewmate's origin is a place you can
   actually go find on your own route.
   ============================================================ */

import { MapPin } from 'lucide-react';
import { CharacterArt } from './CharacterArt';
import { Modal, ModalHead } from './kit';
import { PlanetArt } from './PlanetArt';
import type { Character, CharacterProgress } from '../data/characters';
import { isCharacterUnlocked, metricValue } from '../data/characters';
import { WAYPOINTS } from '../data/waypoints';
import { equipCompanion, useStore } from '../store/useStore';

export function CharacterDetail({
  character,
  progress,
  onClose,
}: {
  character: Character;
  progress: CharacterProgress;
  onClose: () => void;
}) {
  const { discipline } = useStore();
  const unlocked = isCharacterUnlocked(character, progress);
  const withYou = discipline.equippedCompanion === character.id;
  const value = metricValue(character, progress);
  const home = WAYPOINTS.find((w) => w.name === character.origin);

  return (
    <Modal onClose={onClose} width={480}>
      <ModalHead title={character.name} onClose={onClose} />

      <div style={{ display: 'grid', placeItems: 'center', marginBottom: 14 }}>
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            padding: '18px 10px',
            borderRadius: 16,
            background: 'var(--glass-input)',
            border: '1px solid var(--hairline-soft)',
            width: '100%',
            opacity: unlocked ? 1 : 0.55,
          }}
        >
          <CharacterArt id={character.id} name={character.name} size={110} />
        </div>
      </div>

      {home && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <svg width="26" height="26" viewBox="-14 -14 28 28" style={{ flexShrink: 0 }}>
            <PlanetArt kind={home.kind} palette={home.palette} reached r={12} />
          </svg>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--txt)' }}>
              <MapPin size={11} style={{ color: 'var(--txt-faint)' }} />
              From {home.name} — {home.days} clean days out
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-faint)', marginTop: 2 }}>{home.note}</div>
          </div>
        </div>
      )}

      <p style={{ fontSize: 13, color: 'var(--txt-dim)', lineHeight: 1.6, margin: '0 0 18px' }}>
        {character.blurb}
      </p>

      <div style={{ marginBottom: 18 }}>
        <div className="mc-section-title" style={{ marginBottom: 8 }}>
          Earned by
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--txt)', lineHeight: 1.55 }}>
          {character.threshold} {character.unit}
          {!unlocked && (
            <span style={{ color: 'var(--txt-faint)' }}> — you're at {value}.</span>
          )}
        </div>
      </div>

      {unlocked ? (
        <button
          className={withYou ? 'mc-btn' : 'mc-btn primary'}
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => equipCompanion(withYou ? null : character.id)}
        >
          {withYou ? 'Leave behind' : 'Bring along'}
        </button>
      ) : (
        <div
          style={{
            fontSize: 12,
            color: 'var(--txt-faint)',
            padding: '10px 12px',
            borderRadius: 10,
            background: 'var(--glass-input)',
            border: '1px solid var(--hairline-soft)',
          }}
        >
          Not earned yet — {character.threshold - value} {character.unit.startsWith('total') ? 'more' : 'to go'}.
        </div>
      )}
    </Modal>
  );
}

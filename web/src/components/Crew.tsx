/* ============================================================
   The crew.

   Five characters, five different habits — see data/characters.ts for why.
   Locked crewmates still show their real art, dimmed, rather than a silhouette
   or a lock icon: you should be able to see exactly what you're working
   toward, not just that something is there.

   Tapping a card opens the detail view — name, home planet, what it takes to
   earn them — rather than equipping straight away; bringing someone along
   happens from there.
   ============================================================ */

import { useState } from 'react';
import { Users } from 'lucide-react';
import { CharacterArt } from './CharacterArt';
import { CharacterDetail } from './CharacterDetail';
import { CHARACTERS, characterById, isCharacterUnlocked, metricValue, nextCharacter, type CharacterProgress } from '../data/characters';
import { useStore } from '../store/useStore';
import type { DisciplineSummary } from '../utils/discipline';

function toProgress(summary: DisciplineSummary): CharacterProgress {
  return {
    longestAttendanceStreak: summary.longestAttendanceStreak,
    longestCleanStreak: summary.longestCleanStreak,
    longestCalmStreak: summary.longestCalmStreak,
    longestSteadyStreak: summary.longestSteadyStreak,
    cleanDays: summary.cleanDays,
  };
}

export function Crew({ summary }: { summary: DisciplineSummary }) {
  const { discipline } = useStore();
  const worn = discipline.equippedCompanion ?? null;
  const progress = toProgress(summary);
  const unlockedCount = CHARACTERS.filter((c) => isCharacterUnlocked(c, progress)).length;
  const upcoming = nextCharacter(progress);
  const [detailId, setDetailId] = useState<string | null>(null);

  return (
    <div className="glass mc-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div className="mc-section-title" style={{ marginBottom: 0 }}>
          <Users size={11} style={{ marginRight: 6, verticalAlign: -1 }} />
          Crew
        </div>
        <span style={{ fontSize: 11, color: 'var(--txt-faint)', marginLeft: 'auto' }}>
          {unlockedCount} / {CHARACTERS.length} unlocked
        </span>
      </div>

      <div className="mc-tool-grid">
        {CHARACTERS.map((character) => {
          const unlocked = isCharacterUnlocked(character, progress);
          const on = worn === character.id;
          const value = metricValue(character, progress);
          return (
            <button
              key={character.id}
              className={`mc-tool ${on ? 'on' : ''} ${unlocked ? '' : 'locked'}`}
              onClick={() => setDetailId(character.id)}
              title={unlocked ? character.blurb : `Unlocks at ${character.threshold} ${character.unit}`}
              aria-pressed={on}
            >
              <span className="mc-tool-art">
                <CharacterArt id={character.id} name={character.name} size={36} />
              </span>
              <span className="mc-tool-name">{character.name}</span>
              <span className="mc-tool-req">
                {unlocked ? (on ? 'With you' : 'Tap to preview') : `${value} / ${character.threshold}`}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 11, color: 'var(--txt-faint)', marginTop: 14, lineHeight: 1.55 }}>
        {upcoming
          ? `${upcoming.name} needs ${upcoming.threshold} ${upcoming.unit} — you're at ${metricValue(upcoming, progress)}.`
          : 'Every crewmate earned.'}{' '}
        Five different habits, on purpose: no single number gets you the whole roster.
      </div>

      {detailId && characterById(detailId) && (
        <CharacterDetail character={characterById(detailId)!} progress={progress} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}

/* ============================================================
   The daily check-in.

   Rule-adherence lives on the trade itself now — the pre-flight gates it was
   logged through, moved-to-BE, gave-back, the outcome tags. Asking the same
   "did this match my framework" question again here would just be asking
   twice for an answer the trade already gave. So this checks the other
   thing a trade log can't: what state you were actually in, and whether you
   showed up at all, including on the days you sat out.

   Choosing "I sat out" is not a lesser answer — it still counts as a clean
   day, and it still keeps the streak. Honesty about your own state must
   never cost you anything, or the data stops being true.
   ============================================================ */

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Modal, ModalHead } from './kit';
import { EMOTIONS, POSITIVE_EMOTIONS } from '../utils/discipline';
import { upsertCheck } from '../store/useStore';
import type { DayCheck } from '../types';

export function Checkpoint({
  date,
  accountId,
  existing,
  onClose,
}: {
  date: string;
  accountId: string;
  existing?: DayCheck;
  onClose: () => void;
}) {
  const [tookTrade, setTookTrade] = useState(existing?.tookTrade ?? true);
  const [emotions, setEmotions] = useState<string[]>(existing?.emotions ?? []);
  const [positiveEmotions, setPositiveEmotions] = useState<string[]>(existing?.positiveEmotions ?? []);
  const [note, setNote] = useState(existing?.note ?? '');

  function toggleIn(set: React.Dispatch<React.SetStateAction<string[]>>, id: string) {
    set((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  function save() {
    upsertCheck({
      date,
      accountId,
      tookTrade,
      // Deliberately neutral — a broken rule is read off the trade's own
      // gatesPassed / killedBy / movedToBE, never off this check. Leaving
      // these here rather than dropping the fields keeps old check-ins
      // (saved before this changed) reading the same way they always did.
      setupValid: null,
      gatesPassed: [],
      emotions,
      positiveEmotions,
      note,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
    onClose();
  }

  return (
    <Modal onClose={onClose} width={480}>
      <ModalHead title={`Check-in · ${date}`} onClose={onClose} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="mc-seg" style={{ alignSelf: 'flex-start', display: 'inline-flex' }}>
          <button
            className={`mc-seg-btn ${tookTrade ? 'active' : ''}`}
            onClick={() => setTookTrade(true)}
          >
            I traded
          </button>
          <button
            className={`mc-seg-btn ${!tookTrade ? 'active' : ''}`}
            onClick={() => setTookTrade(false)}
          >
            I sat out
          </button>
        </div>

        <div style={{ fontSize: 11.5, color: 'var(--txt-dim)', lineHeight: 1.6 }}>
          Whether it matched your framework is already on the trade — the gates it cleared, a moved
          stop, a give-back. This is the other half: what was actually driving you today.
        </div>

        <div>
          <div className="mc-section-title" style={{ marginBottom: 9 }}>
            What was driving it
          </div>
          <div className="mc-option-grid">
            {EMOTIONS.map((tag) => (
              <Option
                key={tag}
                label={tag}
                on={emotions.includes(tag)}
                onClick={() => toggleIn(setEmotions, tag)}
              />
            ))}
          </div>
          {emotions.length === 0 && (
            <div style={{ fontSize: 11, color: 'var(--txt-faint)', marginTop: 8 }}>
              Nothing ticked reads as nothing driving it — leave it blank if that's true.
            </div>
          )}
        </div>

        <div>
          <div className="mc-section-title" style={{ marginBottom: 9 }}>
            What was working
          </div>
          <div className="mc-option-grid">
            {POSITIVE_EMOTIONS.map((tag) => (
              <Option
                key={tag}
                label={tag}
                on={positiveEmotions.includes(tag)}
                onClick={() => toggleIn(setPositiveEmotions, tag)}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="mc-section-title" style={{ marginBottom: 8 }}>
            In your own words · optional
          </div>
          <textarea
            className="mc-input"
            rows={2}
            placeholder="Anything the tags didn't capture."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="mc-btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="mc-btn primary" style={{ marginLeft: 'auto' }} onClick={save}>
            <Check size={14} /> I did my job
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Option({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button className={`mc-option ${on ? 'on' : ''}`} onClick={onClick} aria-pressed={on}>
      <span className="mc-option-dot">{on && <Check size={9} />}</span>
      <span>{label}</span>
    </button>
  );
}

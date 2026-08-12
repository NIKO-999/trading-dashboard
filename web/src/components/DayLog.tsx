/* ============================================================
   The day log — going back through your own days.

   Every day you have ANY record for — checked in, traded, or both — gets one
   page here, oldest first, numbered Day 1 through Day N. Prev/next walks the
   whole history; nothing is filtered out because it was dirty or empty.

   The bottom of every page is Voyager's read on that specific day, built by
   voyagerNote() from that day's own recorded facts — never invented, never
   pulling figures from anywhere outside what you actually logged.

   Deliberately not a leaderboard of stats: no XP breakdown, no "export this
   day". Just what happened and what the app's own rules already say about it.
   ============================================================ */

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal, ModalHead } from './kit';
import { Voyager } from './Voyager';
import { checksFor, sessionSpec, setupSpec } from '../data/framework';
import { isMissed, judgeDayAny, plannedRiskOn, riskBand, riskDrift, takenTrades, voyagerNote } from '../utils/discipline';
import type { Account, BalanceAdjustment, DayCheck, Entry } from '../types';

export function DayLog({
  account,
  checks,
  entries,
  adjustments,
  cleanDays,
  initialDate,
  onClose,
}: {
  account: Account;
  checks: DayCheck[];
  entries: Entry[];
  adjustments: BalanceAdjustment[];
  /** drives the Voyager art shown at the bottom of every page */
  cleanDays: number;
  /** open straight to this date if it has a record; otherwise the most recent */
  initialDate?: string;
  onClose: () => void;
}) {
  // The union of every date with a check, a trade, or both — sorted oldest
  // first so "Day 1" means what it says.
  const dates = useMemo(() => {
    const set = new Set<string>();
    for (const c of checks) if (c.accountId === account.id) set.add(c.date);
    for (const e of entries) if ((e.accountId ?? account.id) === account.id) set.add(e.date);
    return [...set].sort();
  }, [checks, entries, account.id]);

  const startIndex = useMemo(() => {
    if (initialDate) {
      const at = dates.indexOf(initialDate);
      if (at !== -1) return at;
    }
    return dates.length - 1;
  }, [dates, initialDate]);

  const [index, setIndex] = useState(startIndex);

  if (dates.length === 0) {
    return (
      <Modal onClose={onClose} width={480}>
        <ModalHead title="Day log" onClose={onClose} />
        <p style={{ fontSize: 13, color: 'var(--txt-dim)', lineHeight: 1.6 }}>
          Nothing logged yet. Your first check-in or trade is Day 1.
        </p>
      </Modal>
    );
  }

  const date = dates[index];
  const check = checks.find((c) => c.accountId === account.id && c.date === date);
  const dayEntries = entries.filter((e) => (e.accountId ?? account.id) === account.id && e.date === date);
  // A missed setup never had money on it and must stay out of everything that
  // judges how the day went — the same rule summarizeDiscipline follows. This
  // used to pass dayEntries straight through, so a written-up miss plus one
  // real trade counted as "2 trades — the rule is one" and the checkpoint's
  // own "took a trade" answer got second-guessed by a setup nobody entered.
  const takenEntries = takenTrades(dayEntries);
  const missedEntries = dayEntries.filter(isMissed);
  const planned = plannedRiskOn(account, adjustments, entries, date);
  const verdict = judgeDayAny(date, check, takenEntries, planned);
  const note = voyagerNote(check, takenEntries, verdict);

  const setup = setupSpec(check?.candleRole);
  const spec = sessionSpec(check?.sessionProfile);
  const brokenLabels = check
    ? checksFor(check.candleRole, check.sessionProfile)
        .filter((g) => check.gatesPassed.includes(g.id))
        .map((g) => g.label)
    : [];

  return (
    <Modal onClose={onClose} width={620}>
      <ModalHead title={`Day ${index + 1} of ${dates.length}`} onClose={onClose} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* ---------- nav + date + verdict ---------- */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="mc-icon-btn"
            disabled={index === 0}
            aria-label="Previous day"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            <ChevronLeft size={15} />
          </button>

          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              {new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
            <span className={`mc-daylog-verdict ${!verdict.checkedIn ? 'none' : verdict.clean ? 'clean' : 'dirty'}`}>
              {!verdict.checkedIn ? 'No record' : verdict.clean ? 'Clean' : 'Broke a rule'}
            </span>
          </div>

          <button
            className="mc-icon-btn"
            disabled={index === dates.length - 1}
            aria-label="Next day"
            onClick={() => setIndex((i) => Math.min(dates.length - 1, i + 1))}
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* ---------- the record ---------- */}
        {check && (
          <div className="glass-inset mc-daylog-block">
            <div className="mc-section-title" style={{ marginBottom: 10 }}>
              Checkpoint
            </div>
            <div className="mc-stat-row">
              <span className="mc-stat-label">Took a trade</span>
              <span className="mc-stat-value">{check.tookTrade ? 'Yes' : 'No'}</span>
            </div>
            {spec && (
              <div className="mc-stat-row">
                <span className="mc-stat-label">Candle</span>
                <span className="mc-stat-value">
                  {spec.label} · {setup?.label ?? '—'}
                </span>
              </div>
            )}
            {check.emotions.length > 0 && (
              <div className="mc-stat-row">
                <span className="mc-stat-label">Flagged</span>
                <span className="mc-stat-value">{check.emotions.join(', ')}</span>
              </div>
            )}
            {(check.positiveEmotions?.length ?? 0) > 0 && (
              <div className="mc-stat-row">
                <span className="mc-stat-label">Working</span>
                <span className="mc-stat-value">{check.positiveEmotions!.join(', ')}</span>
              </div>
            )}
            {brokenLabels.length > 0 && (
              <div className="mc-stat-row" style={{ borderBottom: 'none' }}>
                <span className="mc-stat-label">Which one gave way</span>
                <span className="mc-stat-value">{brokenLabels.join(', ')}</span>
              </div>
            )}
            {check.note && (
              <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--txt-dim)', lineHeight: 1.6 }}>
                “{check.note}”
              </div>
            )}
          </div>
        )}

        {takenEntries.length > 0 && (
          <div className="glass-inset mc-daylog-block">
            <div className="mc-section-title" style={{ marginBottom: 10 }}>
              {takenEntries.length === 1 ? 'Trade' : `Trades · ${takenEntries.length}`}
            </div>
            {takenEntries.map((e, i) => {
              const drift = typeof e.risk === 'number' ? riskDrift(e, planned) : null;
              // What was actually risked, as a percent of balance — not how
              // far it drifted from plan. 11% of the account reads the same
              // whether the plan was 10% or 5%; that's the number that can
              // hurt, so that's the one that gets the colour.
              const pct = drift !== null ? account.riskPercent * (1 + drift) : null;
              const band = pct !== null ? riskBand(account.riskPercent, drift!) : null;
              const bandColor =
                band === 'green' ? 'var(--win)' : band === 'yellow' ? 'var(--warn)' : band === 'red' ? 'var(--loss)' : 'var(--txt-faint)';
              return (
                <div key={e.id} className="mc-stat-row" style={i === takenEntries.length - 1 ? { borderBottom: 'none' } : undefined}>
                  <span className="mc-stat-label">
                    #{e.sequence ?? i + 1}
                    {e.gaveBack && <span className="mc-badge loss">GAVE BACK</span>}
                    {e.movedToBE && <span className="mc-badge loss">MOVED TO BE</span>}
                    {e.nyOpenDriver && <span className="mc-badge data">9:30 NY OPEN</span>}
                  </span>
                  <span className="mc-stat-value">
                    {typeof e.risk === 'number' ? `risked ${e.risk.toLocaleString()}` : 'risk —'}
                    {pct !== null && (
                      <span style={{ color: bandColor, fontSize: 11, fontWeight: 600 }}>
                        {' '}
                        {pct.toFixed(1)}%
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
            {takenEntries.some((e) => e.notes) && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {takenEntries
                  .filter((e) => e.notes)
                  .map((e) => (
                    <div key={e.id} style={{ fontSize: 12.5, color: 'var(--txt-dim)', lineHeight: 1.6 }}>
                      “{e.notes}”
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ---------- Voyager's read, as a speech bubble ----------

            Sits directly under the trades it is actually judging, and ABOVE
            the missed-setup block. It used to come last, which put it
            immediately below a written-up miss — so a read derived purely
            from the trade you TOOK looked like a verdict on the setup you
            correctly stood aside from. The note never mentioned the miss;
            the adjacency did. takenEntries above is what feeds it. */}
        <div className="mc-daylog-voyager">
          <div className="mc-daylog-voyager-art">
            <Voyager cleanDays={cleanDays} size={64} />
          </div>
          <div className="mc-daylog-voyager-col">
            <div className="mc-daylog-voyager-bubble">
              <div className="mc-daylog-voyager-label">Voyager</div>
              {/* On a broken-rule day the note is up to three short, labelled
                  lines ("What went wrong" / "What you could do" / "Rule
                  broken") joined by \n rather than one run-on paragraph — see
                  voyagerNote() in utils/discipline.ts. Every other day is
                  still a single plain sentence, which this renders exactly
                  the same as before. */}
              {note.split('\n').map((line, i) => {
                const m = /^([A-Za-z][^:]{0,28}):\s(.*)$/.exec(line);
                return (
                  <p key={i} className="mc-daylog-voyager-note">
                    {m ? (
                      <>
                        <strong>{m[1]}:</strong> {m[2]}
                      </>
                    ) : (
                      line
                    )}
                  </p>
                );
              })}
            </div>
          </div>
        </div>

        {/* Missed setups get their own block, never mixed into the trade
            count or numbering above — a setup you watched but never entered
            never had money on it and never touched the one-trade rule. It
            sits below Voyager for the same reason: it is reference material,
            not something the day is graded on. */}
        {missedEntries.length > 0 && (
          <div className="glass-inset mc-daylog-block">
            <div className="mc-section-title" style={{ marginBottom: 4 }}>
              {missedEntries.length === 1 ? 'Missed setup' : `Missed setups · ${missedEntries.length}`}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--txt-faint)', lineHeight: 1.5, marginBottom: 10 }}>
              Kept for the read. Not graded, and not part of Voyager's note above.
            </div>
            {missedEntries.map((e, i) => (
              <div key={e.id} className="mc-stat-row" style={i === missedEntries.length - 1 ? { borderBottom: 'none' } : undefined}>
                <span className="mc-stat-label">
                  <span className="mc-badge data">MISSED</span>
                </span>
                <span className="mc-stat-value">{e.sessionProfile ? e.sessionProfile : '—'}</span>
              </div>
            ))}
            {missedEntries.some((e) => e.notes) && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {missedEntries
                  .filter((e) => e.notes)
                  .map((e) => (
                    <div key={e.id} style={{ fontSize: 12.5, color: 'var(--txt-dim)', lineHeight: 1.6 }}>
                      “{e.notes}”
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

      </div>
    </Modal>
  );
}

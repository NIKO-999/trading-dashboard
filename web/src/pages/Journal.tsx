/* ============================================================
   Journal — calendar on the left, the trade you are editing on the right.

   Logging is deliberately short: date, pair, direction, risk, result.
   R and outcome derive themselves. Narrative, tags, and screenshots are
   optional and can be filled in later.

   The split can also be collapsed: FULLSCREEN_KEY drops the calendar and
   gives the trade the whole page, for reading back a long walkthrough
   without half the width going to a month you are not looking at.
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  Maximize2,
  Minimize2,
  Plus,
  Radio,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { Empty, Lightbox } from '../components/kit';
import {
  activeAccount,
  addEntry,
  pushToast,
  removeEntry,
  updateEntry,
  useStore,
} from '../store/useStore';
import { PreFlight, type PreFlightResult } from '../components/PreFlight';
import {
  OUTCOME_TAGS,
  isFullyLogged,
  missingForLog,
  nextSequence,
  summarizeDiscipline,
} from '../utils/discipline';
import { SESSIONS, SETUPS, checksFor, findGate, isComplete, setupSpec, type Gate } from '../data/framework';
import { ApiError, diagnose, uploadImage } from '../utils/api';
import { fmtMoney, fmtR, gradedEntries } from '../utils/analytics';
import type { CandleRole, Direction, Entry, Outcome } from '../types';

const OUTCOMES: { value: Exclude<Outcome, null>; label: string; title?: string }[] = [
  { value: 'win', label: 'WIN' },
  { value: 'loss', label: 'LOSS' },
  { value: 'be', label: 'BE' },
  {
    value: 'missed',
    label: 'MISSED',
    title:
      'Saw the setup, never got into it. Kept for the read — it does not count as your trade for the day, and earns nothing.',
  },
];

const PAIRS = ['MGC/SIL', 'MNQ/MES', 'MES/NQ', 'RTY/YM', 'GOLD', 'NASDAQ', 'Other'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function todayStr() {
  return isoOf(new Date());
}

function isoOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Weeks of the given month, Monday–Friday only. Markets are shut at the
 * weekend, and the design system's row is `repeat(5, 1fr) 72px` — five
 * weekdays plus a weekly total.
 */
function monthWeeks(year: number, month: number) {
  const first = new Date(year, month, 1);
  const cursor = new Date(first);
  cursor.setDate(first.getDate() - ((first.getDay() + 6) % 7)); // back to Monday

  const last = new Date(year, month + 1, 0);
  const weeks: { days: { date: string; inMonth: boolean }[] }[] = [];

  while (cursor <= last) {
    const days = [];
    for (let i = 0; i < 5; i++) {
      const day = new Date(cursor);
      day.setDate(cursor.getDate() + i);
      days.push({ date: isoOf(day), inMonth: day.getMonth() === month });
    }
    weeks.push({ days });
    cursor.setDate(cursor.getDate() + 7);
  }
  return weeks;
}

/* ---------- full-width reading mode ---------- */

const FULLSCREEN_KEY = 'mc-journal-fullscreen';

function readFullscreen(): boolean {
  try {
    return localStorage.getItem(FULLSCREEN_KEY) === '1';
  } catch {
    // Private-mode Safari throws on access rather than returning null. The
    // preference is cosmetic, so fall back to the split view and move on.
    return false;
  }
}

function writeFullscreen(on: boolean) {
  try {
    localStorage.setItem(FULLSCREEN_KEY, on ? '1' : '0');
  } catch {
    /* see readFullscreen — not worth surfacing */
  }
}

export default function Journal({
  focusId,
  onFocusConsumed,
  newEntryRequested,
  onNewEntryConsumed,
}: {
  focusId: string | null;
  onFocusConsumed: () => void;
  newEntryRequested?: boolean;
  onNewEntryConsumed: () => void;
}) {
  const { entries, discipline } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cursor, setCursor] = useState(() => new Date());
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [gate, setGate] = useState<{ date: string; sequence: number } | null>(null);
  // Per-device, like the theme and dev-mode flags — it is a viewing preference,
  // not trade data, so it has no business on the server or in a backup.
  const [fullscreen, setFullscreen] = useState(() => readFullscreen());
  const accountId = activeAccount()?.id ?? null;

  const graded = useMemo(() => gradedEntries(entries, true), [entries]);
  const selected = entries.find((e) => e.id === selectedId) || null;

  /* ---------- intents from App ---------- */

  useEffect(() => {
    if (focusId) {
      setSelectedId(focusId);
      const hit = entries.find((e) => e.id === focusId);
      if (hit) setCursor(new Date(`${hit.date}T00:00:00`));
      onFocusConsumed();
    }
  }, [focusId, entries, onFocusConsumed]);

  /**
   * Every route into a new trade goes through here. The first trade of the day
   * is created straight away; a second or later one has to clear the gate first,
   * so the trades you'd normally stop logging are the ones logged most fully.
   */
  const createTrade = useCallback(
    (date: string) => {
      setGate({ date, sequence: nextSequence(entries, date, accountId) });
    },
    [entries, accountId],
  );

  useEffect(() => {
    if (newEntryRequested) {
      createTrade(todayStr());
      onNewEntryConsumed();
    }
  }, [newEntryRequested, onNewEntryConsumed, createTrade]);

  const toggleFullscreen = useCallback(() => {
    setFullscreen((on) => {
      writeFullscreen(!on);
      return !on;
    });
  }, []);

  // Escape gets the calendar back. Ignored while a field has focus so it can
  // still cancel an edit, and while the lightbox is up — that owns Escape.
  useEffect(() => {
    if (!fullscreen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape' || lightbox) return;
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return;
      setFullscreen(false);
      writeFullscreen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen, lightbox]);

  /* ---------- calendar data ---------- */

  const byDate = useMemo(() => {
    const map = new Map<string, typeof graded>();
    for (const e of graded) {
      const list = map.get(e.date);
      if (list) list.push(e);
      else map.set(e.date, [e]);
    }
    return map;
  }, [graded]);

  const weeks = useMemo(
    () => monthWeeks(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );

  const monthLabel = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const monthEntries = graded.filter(
    (e) => e.date.slice(0, 7) === `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`,
  );
  const monthR = monthEntries.reduce((sum, e) => sum + (e.counts ? e.r : 0), 0);
  const monthPnl = monthEntries.reduce((sum, e) => sum + (e.counts ? e.pnl : 0), 0);
  // A setup you never entered is not a trade you took. `counts` is the wrong
  // filter here — it also excludes trades still open, which very much are.
  const monthTaken = monthEntries.filter((e) => e.grade !== 'missed').length;

  function shiftMonth(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }

  return (
    <div
      className="mc-page mc-journal-split"
      style={{
        display: 'grid',
        gridTemplateColumns: fullscreen ? '1fr' : '1fr 1fr',
        gap: 18,
        alignItems: 'start',
      }}
    >
      {/* ---------- calendar ---------- */}
      {!fullscreen && (
      <div className="glass mc-card">
        <div className="trade-cal-header">
          <div className="trade-cal-nav">
            <button className="mc-icon-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">
              <ChevronLeft size={16} />
            </button>
            <div className="trade-cal-month">{monthLabel}</div>
            <button className="mc-icon-btn" onClick={() => shiftMonth(1)} aria-label="Next month">
              <ChevronRight size={16} />
            </button>
          </div>
          <button className="mc-btn ghost sm" onClick={() => setCursor(new Date())}>
            Today
          </button>
        </div>

        <div className="trade-cal-tiles">
          <div className="trade-cal-tile">
            <div className="trade-cal-tile-label">Trades</div>
            <div className="trade-cal-tile-value">{monthTaken}</div>
          </div>
          <div className="trade-cal-tile">
            <div className="trade-cal-tile-label">Net</div>
            <div className="trade-cal-tile-value" style={{ color: monthPnl > 0 ? 'var(--win)' : monthPnl < 0 ? 'var(--loss)' : undefined }}>
              {fmtMoney(monthPnl)}
            </div>
          </div>
          <div className="trade-cal-tile">
            <div className="trade-cal-tile-label">R</div>
            <div className="trade-cal-tile-value" style={{ color: monthR > 0 ? 'var(--win)' : monthR < 0 ? 'var(--loss)' : undefined }}>
              {fmtR(monthR)}
            </div>
          </div>
        </div>

        <div className="trade-cal-grid">
          <div className="trade-cal-row trade-cal-row-head">
            {WEEKDAYS.map((d) => (
              <div key={d} className="trade-cal-daylabel">
                {d}
              </div>
            ))}
            <div className="trade-cal-daylabel trade-cal-weeklabel">Week</div>
          </div>

          {weeks.map((week) => {
            const weekR = week.days.reduce(
              (sum, cell) =>
                sum + (byDate.get(cell.date) || []).reduce((s, e) => s + (e.counts ? e.r : 0), 0),
              0,
            );
            return (
              <div className="trade-cal-row" key={week.days[0].date}>
                {week.days.map((cell) => {
                  const dayEntries = byDate.get(cell.date) || [];
                  const r = dayEntries.reduce((sum, e) => sum + (e.counts ? e.r : 0), 0);
                  // Split so a day of missed setups never reads as a day you
                  // traded — the count under the R is what you'd glance at.
                  const taken = dayEntries.filter((e) => e.grade !== 'missed').length;
                  const missed = dayEntries.length - taken;
                  const isToday = cell.date === todayStr();
                  // --cell-rgb drives the cell's tint in the design system.
                  const cellRgb = r > 0 ? 'var(--win-rgb)' : r < 0 ? 'var(--loss-rgb)' : '255, 255, 255';
                  return (
                    <button
                      key={cell.date}
                      className={`trade-cal-cell ${cell.inMonth ? '' : 'trade-cal-cell-out'} ${dayEntries.length ? 'trade-cal-cell-has' : ''}`}
                      style={{
                        ['--cell-rgb' as string]: cellRgb,
                        ...(isToday ? { borderColor: 'var(--hairline)' } : {}),
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        if (dayEntries.length) setSelectedId(dayEntries[0].id);
                        else createTrade(cell.date);
                      }}
                      title={
                        dayEntries.length
                          ? [taken && `${taken} trade(s)`, missed && `${missed} missed`]
                              .filter(Boolean)
                              .join(' · ')
                          : `Log a trade on ${cell.date}`
                      }
                    >
                      <span className="trade-cal-daynum">{Number(cell.date.slice(8))}</span>
                      {dayEntries.length > 0 && (
                        <>
                          <span className="trade-cal-dayr">{fmtR(r)}</span>
                          <span className="trade-cal-daycount">
                            {taken > 0 && `${taken} trade${taken === 1 ? '' : 's'}`}
                            {taken > 0 && missed > 0 && ' · '}
                            {missed > 0 && `${missed} missed`}
                          </span>
                          <span className="trade-cal-dots">
                            {dayEntries.slice(0, 6).map((e) => (
                              <span
                                key={e.id}
                                className="trade-cal-dot"
                                style={{
                                  background:
                                    e.grade === 'win'
                                      ? 'var(--win)'
                                      : e.grade === 'loss'
                                        ? 'var(--loss)'
                                        : 'var(--txt-faint)',
                                }}
                              />
                            ))}
                          </span>
                        </>
                      )}
                    </button>
                  );
                })}
                <div
                  className="trade-cal-weekr"
                  style={{ color: weekR > 0 ? 'var(--win)' : weekR < 0 ? 'var(--loss)' : undefined }}
                >
                  {weekR !== 0 ? fmtR(weekR) : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* ---------- editor ---------- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {selected ? (
          <EntryEditor
            key={selected.id}
            entry={selected}
            onDelete={() => {
              removeEntry(selected.id);
              setSelectedId(null);
              pushToast('Trade deleted');
            }}
            onLightbox={setLightbox}
            fullscreen={fullscreen}
            onToggleFullscreen={toggleFullscreen}
          />
        ) : (
          <div className="glass mc-card">
            <Empty icon={<Plus size={18} />}>
              {fullscreen ? (
                <>
                  Nothing open. Bring the calendar back to pick a day.
                  <br />
                  <button className="mc-btn ghost sm" style={{ marginTop: 12 }} onClick={toggleFullscreen}>
                    <Minimize2 size={13} /> Show calendar
                  </button>
                </>
              ) : (
                <>
                  Pick a day on the calendar to log a trade,
                  <br />
                  or open an existing one.
                </>
              )}
            </Empty>
          </div>
        )}

        {/* other trades on the selected day */}
        {selected && (byDate.get(selected.date)?.length || 0) > 1 && (
          <div className="glass mc-card">
            <div className="mc-section-title" style={{ marginBottom: 12 }}>
              Also on {selected.date}
            </div>
            {byDate
              .get(selected.date)!
              .filter((e) => e.id !== selected.id)
              .map((e) => (
                <button
                  key={e.id}
                  className="mc-kb-backlink-row"
                  onClick={() => setSelectedId(e.id)}
                  style={{ marginTop: 6 }}
                >
                  <span className="name">{e.pair || 'Untitled'} · {e.direction || '—'}</span>
                  <span style={{ marginLeft: 'auto', color: e.r > 0 ? 'var(--win)' : e.r < 0 ? 'var(--loss)' : 'var(--txt-faint)' }}>
                    {fmtR(e.r)}
                  </span>
                </button>
              ))}
          </div>
        )}

        {selected && (
          <button
            className="mc-btn ghost"
            onClick={() => createTrade(selected.date)}
          >
            <Plus size={13} /> Another trade on {selected.date}
          </button>
        )}
      </div>

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}

      {gate && (
        <PreFlight
          logging
          date={gate.date}
          sequence={gate.sequence}
          onClose={() => setGate(null)}
          onLog={(r: PreFlightResult) => {
            const draft: Entry = {
              id: 'draft',
              date: gate.date,
              outcome: null,
              tags: [],
              sessionProfile: r.sessionProfile,
              candleRole: r.candleRole,
              tradeKind: r.tradeKind,
              gatesPassed: r.gatesPassed,
              killedBy: r.killedBy,
              notes: r.note || undefined,
              walkthrough: r.image
                ? [{ id: `w_${Date.now().toString(36)}`, image: r.image, note: r.note }]
                : [],
            };

            // What this trade is worth, before it's actually saved — diffed
            // against the same summary without it, so the toast shows exactly
            // what logging it just earned rather than a re-derived guess.
            const account = activeAccount();
            if (account) {
              const before = summarizeDiscipline(account, discipline.adjustments, entries, discipline.checks, gate.date);
              const after = summarizeDiscipline(
                account,
                discipline.adjustments,
                [...entries, draft],
                discipline.checks,
                gate.date,
              );
              const gained = after.xp - before.xp;
              if (gained > 0) {
                const cleanToday = after.verdicts.find((v) => v.date === gate.date)?.clean;
                const boost = before.boost > 1 && cleanToday ? ` · ${before.boost}× boost` : '';
                const fully = isFullyLogged(draft) ? ' · fully logged' : '';
                pushToast(`+${gained} XP${boost}${fully}`);
              }
            }

            const created = addEntry({
              date: gate.date,
              sessionProfile: r.sessionProfile,
              candleRole: r.candleRole,
              tradeKind: r.tradeKind,
              gatesPassed: r.gatesPassed,
              killedBy: r.killedBy,
              notes: r.note || undefined,
              walkthrough: r.image
                ? [{ id: `w_${Date.now().toString(36)}`, image: r.image, note: r.note }]
                : [],
            });
            setSelectedId(created.id);
            setGate(null);
          }}
        />
      )}
    </div>
  );
}

/* ============================================================
   Entry editor
   ============================================================ */

function EntryEditor({
  entry,
  onDelete,
  onLightbox,
  fullscreen,
  onToggleFullscreen,
}: {
  entry: Entry;
  onDelete: () => void;
  onLightbox: (src: string) => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // Collapsed by default to save room — but a trade that already has
  // something flagged opens expanded, so switching to it never hides a flag
  // you'd already set.
  const [outcomeOpen, setOutcomeOpen] = useState(
    () => Boolean(entry.gaveBack || entry.movedToBE || (entry.outcomeTags?.length ?? 0) > 0),
  );
  // Same rule as the flags group: closed by default, but a trade someone has
  // already started reviewing opens straight to where they left off.
  const [checklistOpen, setChecklistOpen] = useState(() => (entry.gatesPassed?.length ?? 0) > 0);

  const risk = entry.risk ?? 0;
  const result = entry.result;
  const derivedR = risk > 0 && typeof result === 'number' ? result / risk : 0;
  const shownR = entry.rMultiple ?? derivedR;
  const flagCount =
    (entry.gaveBack ? 1 : 0) + (entry.movedToBE ? 1 : 0) + (entry.outcomeTags?.length ?? 0);

  // The retroactive checklist — same gate list checksFor(...) gives
  // pre-flight, keyed off whatever profile/type is currently set on the
  // trade so it can never disagree with the dropdowns above it.
  const setup = setupSpec(entry.candleRole);
  const checklistGates = checksFor(entry.candleRole, entry.sessionProfile);
  // checksFor() already sorts reminders after the confirmations — split here
  // rather than re-derive that order, so the two lists can never disagree
  // about which gate belongs where.
  const confirmGates = checklistGates.filter((g) => g.tier !== 'reminder');
  const reminderGates = checklistGates.filter((g) => g.tier === 'reminder');
  const ticked = entry.gatesPassed ?? [];
  const requiredChecksList = checklistGates.filter((g) => !g.optional);
  const tickedRequired = requiredChecksList.filter((g) => ticked.includes(g.id)).length;
  const gatesReviewed = ticked.length > 0;
  const gatesComplete = gatesReviewed && Boolean(entry.candleRole) && isComplete(entry.candleRole, ticked, entry.sessionProfile);

  const derivedOutcome: Exclude<Outcome, null> | 'ungraded' =
    entry.outcome ??
    (typeof result !== 'number' ? 'ungraded' : result > 0 ? 'win' : result < 0 ? 'loss' : 'be');

  function num(v: string): number | undefined {
    if (v.trim() === '') return undefined;
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  }

  // A loss with no result typed yet defaults to the full risked amount — a
  // stop-out — instead of leaving R/P&L sitting at zero. Only fills in an
  // untouched result (undefined or 0); a typed partial loss is left alone.
  function withLossDefault(patch: Partial<Entry>): Partial<Entry> {
    const nextOutcome = 'outcome' in patch ? patch.outcome : entry.outcome;
    const nextRisk = 'risk' in patch ? patch.risk : entry.risk;
    const nextResult = 'result' in patch ? patch.result : entry.result;
    if (nextOutcome === 'loss' && (nextResult === undefined || nextResult === 0) && (nextRisk ?? 0) > 0) {
      return { ...patch, result: -(nextRisk as number) };
    }
    return patch;
  }

  async function attach(file: File, stepId?: string) {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (stepId) {
        updateEntry(entry.id, {
          walkthrough: entry.walkthrough.map((s) => (s.id === stepId ? { ...s, image: url } : s)),
        });
      } else {
        updateEntry(entry.id, {
          walkthrough: [
            ...entry.walkthrough,
            { id: `w_${Date.now().toString(36)}`, image: url, note: '', time: '' },
          ],
        });
      }
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="glass mc-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div className="mc-section-title">{entry.date}</div>
          <div style={{ fontSize: 18, fontWeight: 300, marginTop: 4 }}>
            {entry.pair || 'New trade'}
            {entry.direction && (
              <span style={{ color: 'var(--txt-faint)', fontSize: 13, marginLeft: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                {entry.direction}
              </span>
            )}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <button
            className={`mc-icon-btn ${fullscreen ? 'active' : ''}`}
            onClick={onToggleFullscreen}
            title={fullscreen ? 'Show the calendar again (Esc)' : 'Give this trade the full width'}
            aria-label={fullscreen ? 'Exit full width' : 'Full width'}
            aria-pressed={fullscreen}
          >
            {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button
            className={`mc-icon-btn ${entry.starred ? 'active' : ''}`}
            onClick={() => updateEntry(entry.id, { starred: !entry.starred })}
            title="Star this trade"
            aria-label="Star this trade"
          >
            <Star size={15} fill={entry.starred ? 'currentColor' : 'none'} />
          </button>
          <button
            className="mc-icon-btn danger"
            onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
            title={confirmDelete ? 'Click again to delete' : 'Delete trade'}
            aria-label="Delete trade"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div style={{ fontSize: 11.5, color: 'var(--loss)' }}>
          Click the bin again to delete this trade — no undo.{' '}
          <button className="mc-btn ghost sm" onClick={() => setConfirmDelete(false)}>
            Cancel
          </button>
        </div>
      )}

      {/* the quick-entry row: this is the whole logging flow */}
      <div className="mc-trade-pill-row">
        <label className="mc-trade-pill">
          <span style={{ color: 'var(--txt-faint)', fontSize: 11 }}>DATE</span>
          <input
            type="date"
            value={entry.date}
            onChange={(e) => updateEntry(entry.id, { date: e.target.value })}
          />
        </label>

        <label className="mc-trade-pill">
          <span style={{ color: 'var(--txt-faint)', fontSize: 11 }}>PAIR</span>
          <select
            value={entry.pair || ''}
            onChange={(e) => updateEntry(entry.id, { pair: e.target.value || undefined })}
          >
            <option value="">—</option>
            {PAIRS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="mc-trade-pill">
          <span style={{ color: 'var(--txt-faint)', fontSize: 11 }}>SIDE</span>
          <select
            value={entry.direction || ''}
            onChange={(e) =>
              updateEntry(entry.id, { direction: (e.target.value || undefined) as Direction | undefined })
            }
          >
            <option value="">—</option>
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </label>

        <label className="mc-trade-pill">
          <span style={{ color: 'var(--txt-faint)', fontSize: 11 }}>RISKED $</span>
          <input
            type="number"
            inputMode="decimal"
            style={{ width: 76 }}
            placeholder="300"
            value={entry.risk ?? ''}
            onChange={(e) => updateEntry(entry.id, withLossDefault({ risk: num(e.target.value) }))}
          />
        </label>

        <label className="mc-trade-pill">
          <span style={{ color: 'var(--txt-faint)', fontSize: 11 }}>RESULT $</span>
          <input
            type="number"
            inputMode="decimal"
            style={{ width: 84 }}
            placeholder="900"
            value={entry.result ?? ''}
            onChange={(e) => updateEntry(entry.id, { result: num(e.target.value) })}
          />
        </label>

        <label className="mc-trade-pill">
          <span style={{ color: 'var(--txt-faint)', fontSize: 11 }}>TIME</span>
          <input
            type="time"
            value={entry.time || ''}
            onChange={(e) => updateEntry(entry.id, { time: e.target.value || undefined })}
          />
        </label>
      </div>

      {/* derived readout + outcome override */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div className="mc-daycard-metric" style={{ minWidth: 96 }}>
          <div className="mc-daycard-metric-label">R multiple</div>
          <div
            className="mc-daycard-metric-value"
            style={{ color: shownR > 0 ? 'var(--win)' : shownR < 0 ? 'var(--loss)' : undefined }}
          >
            {fmtR(shownR)}
          </div>
        </div>
        <div className="mc-daycard-metric" style={{ minWidth: 96 }}>
          <div className="mc-daycard-metric-label">P / L</div>
          <div
            className="mc-daycard-metric-value"
            style={{ color: (result ?? 0) > 0 ? 'var(--win)' : (result ?? 0) < 0 ? 'var(--loss)' : undefined }}
          >
            {typeof result === 'number' ? fmtMoney(result) : '—'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {OUTCOMES.map((o) => (
            <button
              key={o.value}
              className={`mc-outcome-btn ${derivedOutcome === o.value ? `on-${o.value}` : ''}`}
              onClick={() =>
                updateEntry(
                  entry.id,
                  withLossDefault({ outcome: entry.outcome === o.value ? null : o.value }),
                )
              }
              title={
                entry.outcome === o.value
                  ? 'Clear override — go back to deriving from result'
                  : o.title ?? `Mark as ${o.label}`
              }
            >
              {o.label}
            </button>
          ))}
          {entry.outcome && entry.outcome !== 'missed' && (
            <span style={{ fontSize: 10, color: 'var(--txt-faint)', letterSpacing: 1 }}>OVERRIDDEN</span>
          )}
        </div>
      </div>

      {/* Says out loud what a missed setup does and does not do, so it never
          looks like it quietly cost you something. */}
      {entry.outcome === 'missed' && (
        <div className="mc-missed-note">
          Doesn't use up your one trade for the day and never touches your P&amp;L or streaks — but a
          chart and a couple of sentences still earns XP. Worth logging.
        </div>
      )}

      {/* both flag groups share one collapsible shell so they stop eating a
          screen's worth of room by default — a trade that already carries a
          flag opens expanded (see outcomeOpen's initializer), everything
          else starts closed */}
      <div className="mc-outcome-group">
        <button
          className={`mc-outcome-group-head ${outcomeOpen ? 'open' : ''}`}
          onClick={() => setOutcomeOpen((v) => !v)}
        >
          <ChevronRight size={13} className="mc-outcome-group-chevron" />
          <span className="mc-outcome-group-title">What happened</span>
          {flagCount > 0 && <span className="mc-outcome-group-count">{flagCount}</span>}
        </button>

        {outcomeOpen && (
          <div className="mc-outcome-group-body">
            {/* the two flags that make the give-back chain detectable at all */}
            <div>
              <div className="mc-section-title" style={{ marginBottom: 8 }}>
                What happened to it
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  className={`mc-tag-chip ${entry.gaveBack ? 'flag-active' : ''}`}
                  onClick={() => updateEntry(entry.id, { gaveBack: !entry.gaveBack })}
                  title="It was in profit and came back on me"
                >
                  Was in profit, gave it back
                </button>
                <button
                  className={`mc-tag-chip ${entry.movedToBE ? 'flag-active' : ''}`}
                  onClick={() => updateEntry(entry.id, { movedToBE: !entry.movedToBE })}
                  title="Your rule is never to move a stop to break even"
                >
                  Moved stop to break even
                </button>
              </div>
              {entry.movedToBE && (
                <div style={{ fontSize: 11, color: 'var(--loss)', marginTop: 8, lineHeight: 1.5 }}>
                  Your own rule is never to move to break even — it converts winners into scratches
                  while the losses still pay full price.
                </div>
              )}
            </div>

            {/* outcome, not rule-adherence — a trade can clear every real gate
                and still not work, and ticking one of these never counts as a
                broken rule the way killedBy does */}
            <div>
              <div className="mc-section-title" style={{ marginBottom: 8 }}>
                Why it didn't play out
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {OUTCOME_TAGS.map((tag) => {
                  const on = (entry.outcomeTags ?? []).includes(tag);
                  return (
                    <button
                      key={tag}
                      className={`mc-tag-chip ${on ? 'flag-active' : ''}`}
                      onClick={() =>
                        updateEntry(entry.id, {
                          outcomeTags: on
                            ? (entry.outcomeTags ?? []).filter((t) => t !== tag)
                            : [...(entry.outcomeTags ?? []), tag],
                        })
                      }
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* profile tagging — optional on trade 1, required on 2+ via the gate */}
      <div className="mc-trade-pill-row">
        <label className="mc-trade-pill">
          <span style={{ color: 'var(--txt-faint)', fontSize: 11 }}>PROFILE</span>
          <select
            value={entry.sessionProfile || ''}
            onChange={(e) =>
              updateEntry(entry.id, {
                sessionProfile: (e.target.value || undefined) as Entry['sessionProfile'],
              })
            }
          >
            <option value="">—</option>
            {SESSIONS.filter((s) => s.tradable).map((s) => (
              <option key={s.id} value={s.id}>
                {s.id.slice(0, 2)}:{s.id.slice(2)}
              </option>
            ))}
          </select>
        </label>
        <label className="mc-trade-pill">
          <span style={{ color: 'var(--txt-faint)', fontSize: 11 }}>TYPE</span>
          <select
            value={entry.candleRole || ''}
            onChange={(e) => {
              const candleRole = (e.target.value || undefined) as CandleRole | undefined;
              updateEntry(entry.id, {
                candleRole,
                // Kept in sync for the couple of places still reading the
                // simplified field — C3 and C4 both collapse to
                // "continuation" here, same derivation PreFlight uses.
                tradeKind: candleRole === 'C2' ? 'reversal' : candleRole ? 'continuation' : undefined,
              });
            }}
          >
            <option value="">—</option>
            {SETUPS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        {typeof entry.sequence === 'number' && entry.sequence > 1 && (
          <span className="mc-badge loss" style={{ alignSelf: 'center' }}>
            TRADE {entry.sequence}
          </span>
        )}
      </div>

      {/* The 9:30 marker — not a candle, not a gate. Sits here because this is
          the profile/type row: the other piece of context about which candle
          this actually was. Purely a note for the read; nothing downstream
          checks it.

          Only offered on 06:00, the one candle 9:30 actually falls inside
          (06:00–10:00 NY). Still rendered when the flag is already set, so
          re-profiling a trade that was marked cannot strand the marker on
          with no way to clear it. */}
      {(entry.sessionProfile === '0600' || entry.nyOpenDriver) && (
        <button
          className={`mc-tag-chip ${entry.nyOpenDriver ? 'marker-active' : ''}`}
          onClick={() => updateEntry(entry.id, { nyOpenDriver: !entry.nyOpenDriver })}
          title="The 9:30 NY open played into this trade — same driver the dashboard's timing line surfaces live"
        >
          9:30 NY open
        </button>
      )}

      {/* the same checklist pre-flight would have shown, open to review
          after the fact — ticking a gate here writes the same gatesPassed
          the live gate does, so a missing required one counts the same way */}
      {entry.candleRole && (
        <div className="mc-outcome-group">
          <button
            className={`mc-outcome-group-head ${checklistOpen ? 'open' : ''}`}
            onClick={() => setChecklistOpen((v) => !v)}
          >
            <ChevronRight size={13} className="mc-outcome-group-chevron" />
            <span className="mc-outcome-group-title">Checklist · {setup?.label}</span>
            {gatesReviewed && (
              <span className={`mc-outcome-group-count ${gatesComplete ? 'ok' : ''}`}>
                {gatesComplete ? 'Complete' : `${tickedRequired}/${requiredChecksList.length}`}
              </span>
            )}
          </button>

          {checklistOpen && (
            <div className="mc-outcome-group-body">
              {/* Confirmations only — the ordered walk. Reminders used to sit
                  in this same numbered sequence with just a small tag on the
                  end, which read as "step 9 of 11" even though a reminder is
                  context you hold in mind, not a step you work through in
                  order. Split into its own group below instead. */}
              <div className="mc-gate-list">
                {confirmGates.map((g, i) => {
                  const on = ticked.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      className={`mc-gate ${on ? 'on' : ''}`}
                      title={g.must}
                      onClick={() =>
                        updateEntry(entry.id, {
                          gatesPassed: on ? ticked.filter((t) => t !== g.id) : [...ticked, g.id],
                        })
                      }
                    >
                      <span className="mc-gate-num">{on ? <Check size={10} /> : i + 1}</span>
                      <span className="mc-gate-tf">{g.tf}</span>
                      <span>{g.label}</span>
                      {g.optional && <span className="mc-gate-optional">optional</span>}
                    </button>
                  );
                })}
              </div>

              {reminderGates.length > 0 && (
                <>
                  <div className="mc-gate-sub">Reminders</div>
                  <div className="mc-gate-list reminders">
                    {reminderGates.map((g) => {
                      const on = ticked.includes(g.id);
                      return (
                        <button
                          key={g.id}
                          className={`mc-gate reminder ${on ? 'on' : ''}`}
                          title={g.must}
                          onClick={() =>
                            updateEntry(entry.id, {
                              gatesPassed: on ? ticked.filter((t) => t !== g.id) : [...ticked, g.id],
                            })
                          }
                        >
                          {/* No ordinal here — nothing about a reminder is "step
                              N", so numbering it would claim a sequence that
                              does not exist. The tick still records same as
                              any other gate. */}
                          <span className="mc-gate-num">{on && <Check size={10} />}</span>
                          <span className="mc-gate-tf">{g.tf}</span>
                          <span>{g.label}</span>
                          {g.optional && <span className="mc-gate-optional">optional</span>}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              {gatesReviewed && !gatesComplete && (
                <div style={{ fontSize: 11, color: 'var(--loss)', marginTop: 4, lineHeight: 1.5 }}>
                  A required gate isn't ticked — same as the pre-flight checklist catching it live,
                  this counts as a broken rule for the day.
                </div>
              )}
              {setup && <DiagnoseButton entry={entry} setup={setup} ticked={ticked} requiredChecksList={requiredChecksList} />}
            </div>
          )}
        </div>
      )}

      {/* notes */}
      <div>
        <div className="mc-section-title" style={{ marginBottom: 8 }}>
          Notes
        </div>
        <textarea
          className="mc-input"
          rows={5}
          placeholder="What was the setup? What did you do well, what would you change?"
          value={entry.notes || ''}
          onChange={(e) => updateEntry(entry.id, { notes: e.target.value })}
        />
      </div>

      {/* walkthrough */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <div className="mc-section-title">Walkthrough</div>
          <button
            className="mc-btn ghost sm"
            style={{ marginLeft: 'auto' }}
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 size={13} className="mc-spin" /> : <ImagePlus size={13} />}
            Add screenshot
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void attach(f);
              e.target.value = '';
            }}
          />
        </div>

        {entry.walkthrough.length === 0 ? (
          <div style={{ fontSize: 11.5, color: 'var(--txt-faint)' }}>
            Add a chart screenshot and a line about what you saw. Optional — the trade is already logged.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {entry.walkthrough.map((step) => (
              <div key={step.id} className="mc-walk-row">
                {step.image ? (
                  <img
                    className="mc-walk-thumb"
                    src={step.image}
                    alt=""
                    onClick={() => onLightbox(step.image!)}
                  />
                ) : (
                  <div className="mc-walk-thumb mc-walk-thumb-empty">
                    <ImagePlus size={16} />
                  </div>
                )}
                <div className="mc-walk-bubble">
                  <textarea
                    className="mc-walk-note"
                    rows={2}
                    placeholder="What was happening here?"
                    value={step.note}
                    onChange={(e) =>
                      updateEntry(entry.id, {
                        walkthrough: entry.walkthrough.map((s) =>
                          s.id === step.id ? { ...s, note: e.target.value } : s,
                        ),
                      })
                    }
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      className="mc-walk-time"
                      style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--txt-faint)', width: 70 }}
                      placeholder="11:35"
                      value={step.time || ''}
                      onChange={(e) =>
                        updateEntry(entry.id, {
                          walkthrough: entry.walkthrough.map((s) =>
                            s.id === step.id ? { ...s, time: e.target.value } : s,
                          ),
                        })
                      }
                    />
                    <button
                      className="mc-icon-btn danger"
                      style={{ marginLeft: 'auto', width: 24, height: 24 }}
                      onClick={() =>
                        updateEntry(entry.id, {
                          walkthrough: entry.walkthrough.filter((s) => s.id !== step.id),
                        })
                      }
                      aria-label="Remove step"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CompleteLog entry={entry} />
    </div>
  );
}

/* ============================================================
   Complete log — the moment the write-up counts.

   The fully-logged XP used to accrue on its own, the instant a screenshot and
   a long enough sentence both happened to exist. Nothing marked the moment, so
   there was no way to tell a finished write-up from one abandoned half way,
   and the XP arrived without ever being felt.

   So the declaration is now explicit and it is what pays. The button reports
   what it will be worth before you press it and what it paid after — the number
   is diffed against the same summary without this entry completed, so it is the
   real figure rather than a re-derived guess (same approach as the PreFlight
   toast).

   No discard button here on purpose: the bin at the top of the editor already
   deletes a trade, with its own tap-again confirm. A second destructive control
   at the other end of a long form would be two ways to do one thing.
   ============================================================ */

/* ============================================================
   Diagnose this — the on-demand, opt-in, costs-real-money exception.

   Everything else in this app runs offline, local, free. This is the one
   button that calls out to the internet — see server/diagnose.mjs for why
   that line is drawn where it is, and App.tsx's ApiKeySettings for where the
   key gets saved. It only ever fires when this specific button is pressed;
   nothing about logging or viewing a trade triggers it on its own.

   The setup summaries sent with the request are built fresh from SETUPS on
   every call, never cached or duplicated server-side — the server carries no
   copy of the framework, so this payload IS the framework as far as one
   request is concerned. A rewritten checklist is picked up automatically the
   next time this button is pressed, same as everywhere else in the app.
   ============================================================ */

function DiagnoseButton({
  entry,
  setup,
  ticked,
  requiredChecksList,
}: {
  entry: Entry;
  setup: { id: string; label: string; what: string };
  ticked: string[];
  requiredChecksList: Gate[];
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const noteText = (entry.notes?.trim() || entry.walkthrough.map((w) => w.note).filter(Boolean).join('\n')).trim();

  const outstandingGates = requiredChecksList.filter((g) => !ticked.includes(g.id));
  const killedGates = (entry.killedBy ?? [])
    .map((id) => findGate(id))
    .filter((g): g is Gate => Boolean(g));
  // Deduped by id — a gate can be both explicitly killed and still outstanding.
  const failedGates = [...killedGates, ...outstandingGates].filter(
    (g, i, arr) => arr.findIndex((x) => x.id === g.id) === i,
  );

  // Nothing to compare against a different setup with, or nothing that
  // actually failed — the button would only ever come back empty-handed.
  if (!noteText || failedGates.length === 0) return null;

  async function run() {
    setState('loading');
    setError('');
    try {
      const { diagnosis } = await diagnose({
        note: noteText,
        loggedAs: { id: setup.id, label: setup.label },
        setups: SETUPS.map((s) => ({
          id: s.id,
          label: s.label,
          what: s.what,
          checks: s.checks.filter((c) => !c.optional).map((c) => ({ id: c.id, label: c.label, must: c.must })),
        })),
        failedGates: failedGates.map((g) => ({ id: g.id, label: g.label, avoid: g.avoid ?? g.kills })),
      });
      setResult(diagnosis);
      setState('done');
      setSaved(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the diagnosis service.');
      setState('error');
    }
  }

  function saveToNote() {
    updateEntry(entry.id, { notes: entry.notes ? `${entry.notes}\n\n${result}` : result });
    setSaved(true);
    pushToast('Added to notes');
  }

  if (state === 'idle') {
    return (
      <button className="mc-btn ghost sm" style={{ marginTop: 8 }} onClick={run}>
        <Radio size={12} /> Diagnose this
      </button>
    );
  }

  if (state === 'loading') {
    return (
      <div className="mc-diagnose loading">
        <Loader2 size={13} className="mc-spin" /> Comparing against the framework…
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="mc-diagnose error">
        <span>{error}</span>
        <button className="mc-btn ghost sm" onClick={run}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mc-diagnose done">
      <p>{result}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="mc-btn ghost sm" disabled={saved} onClick={saveToNote}>
          {saved ? 'Saved to notes' : 'Save to notes'}
        </button>
        <button className="mc-btn ghost sm" onClick={run}>
          Ask again
        </button>
      </div>
    </div>
  );
}

function CompleteLog({ entry }: { entry: Entry }) {
  const { entries, discipline } = useStore();
  const missing = missingForLog(entry);
  const ready = missing.length === 0;
  const done = Boolean(entry.completedAt);

  // What pressing it is actually worth, right now.
  const account = activeAccount();
  const worth = (() => {
    if (!account || done || !ready) return 0;
    const args = [account, discipline.adjustments] as const;
    const before = summarizeDiscipline(...args, entries, discipline.checks, entry.date);
    const after = summarizeDiscipline(
      ...args,
      entries.map((e) => (e.id === entry.id ? { ...e, completedAt: new Date().toISOString() } : e)),
      discipline.checks,
      entry.date,
    );
    return after.xp - before.xp;
  })();

  if (done) {
    return (
      <div className="mc-complete done">
        <CheckCircle2 size={16} />
        <div className="mc-complete-body">
          <div className="mc-complete-head">Log complete</div>
          <div className="mc-complete-sub">
            Counted towards your XP. You can still edit anything above — fixing a typo doesn't
            un-log it.
          </div>
        </div>
        {/* Reopening is deliberately quiet: it exists for a log completed by
            mistake, not as a normal step. */}
        <button
          className="mc-btn ghost sm"
          onClick={() => updateEntry(entry.id, { completedAt: undefined })}
          title="Mark this log as unfinished again"
        >
          Reopen
        </button>
      </div>
    );
  }

  return (
    <div className={`mc-complete ${ready ? 'ready' : ''}`}>
      <div className="mc-complete-body">
        {ready ? (
          <>
            <div className="mc-complete-head">Ready to complete</div>
            <div className="mc-complete-sub">
              Everything a full log needs is here. Completing it is what banks the XP.
            </div>
          </>
        ) : (
          <>
            <div className="mc-complete-head">Not a full log yet</div>
            <div className="mc-complete-sub">
              Still needs {missing.join(', ')}. The trade is saved either way — this is only the
              bonus for writing it up properly.
            </div>
          </>
        )}
      </div>
      <button
        className={ready ? 'mc-btn primary' : 'mc-btn'}
        disabled={!ready}
        onClick={() => {
          updateEntry(entry.id, { completedAt: new Date().toISOString() });
          if (worth > 0) pushToast(`+${worth} XP · log complete`);
        }}
      >
        <CheckCircle2 size={13} /> Complete log{ready && worth > 0 ? ` · +${worth} XP` : ''}
      </button>
    </div>
  );
}


/* ============================================================
   Back-testing — its own section, on purpose.

   Reps are the one thing that compounds without costing anything, and the
   reason they don't happen is that they pay nothing back on the day you do
   them. So this pays immediately and pays more the longer the run goes.

   Nothing here touches the trading side. No P&L, no win rate, no clean days,
   no trajectory — a rep is practice, not evidence you held a rule with money
   on it. The only thing it shares with the rest of the app is the XP total,
   which is the point: reps raise your rank, they don't fake your discipline.
   ============================================================ */

import { useMemo, useRef, useState } from 'react';
import { Check, Flame, ImagePlus, Loader2, Plus, Target, Trash2, Zap } from 'lucide-react';
import { Empty } from '../components/kit';
import { SESSIONS, SETUPS } from '../data/framework';
import {
  BACKTEST_XP,
  WEEK_TARGET,
  isJournaled,
  nextBacktestBoost,
  summarizeBacktest,
  xpPreview,
} from '../utils/backtest';
import { addBacktest, pushToast, removeBacktest, updateBacktest, useStore } from '../store/useStore';
import { uploadImage } from '../utils/api';
import type { BacktestSession, CandleRole, SessionProfile } from '../types';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function BacktestPage() {
  const { discipline } = useStore();
  const sessions = useMemo(() => discipline.backtests ?? [], [discipline.backtests]);
  const today = todayStr();

  const summary = useMemo(() => summarizeBacktest(sessions, today), [sessions, today]);
  const upcoming = nextBacktestBoost(summary.streak);
  const loggedToday = sessions.some((s) => s.date === today);

  // What today would pay, before committing — the streak has to be visible as
  // the reason, not a number that changes after the fact.
  const preview = xpPreview(sessions, today, false);

  const ordered = useMemo(
    () => [...sessions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [sessions],
  );

  function logToday() {
    const created = addBacktest({ date: today, setups: 1 });
    pushToast(`+${preview.total} XP${preview.multiplier > 1 ? ` · ${preview.multiplier}× run` : ''}`);
    return created;
  }

  return (
    <div className="mc-page" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* ---------- the week ---------- */}
      <div className="glass mc-card mc-bt-hero">
        <div className="mc-bt-hero-head">
          <span className="mc-kpi-label">
            <Target size={11} /> This week
          </span>
          <span className="mc-bt-count">
            {summary.daysThisWeek} / {WEEK_TARGET}
          </span>
        </div>

        <div className="mc-bt-week">
          {Array.from({ length: WEEK_TARGET }, (_, i) => {
            // Oldest on the left, today on the right.
            const offset = WEEK_TARGET - 1 - i;
            const d = new Date(`${today}T00:00:00`);
            d.setDate(d.getDate() - offset);
            const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const day = sessions.filter((s) => s.date === date);
            const state = day.length === 0 ? 'empty' : day.some(isJournaled) ? 'journaled' : 'done';
            return (
              <div
                key={date}
                className={`mc-bt-day ${state} ${date === today ? 'today' : ''}`}
                title={
                  state === 'empty'
                    ? `Nothing on ${date}`
                    : `${date} — ${day.length} session${day.length === 1 ? '' : 's'}${state === 'journaled' ? ', written up' : ''}`
                }
              >
                <span className="mc-bt-day-label">
                  {d.toLocaleDateString(undefined, { weekday: 'narrow' })}
                </span>
                <span className="mc-bt-day-dot">{state === 'journaled' && <Check size={10} />}</span>
              </div>
            );
          })}
        </div>

        <div className="mc-bt-goal">
          {summary.weekComplete ? (
            <span className="ok">Week done — seven days, and one of them written up properly.</span>
          ) : (
            // Joined rather than conditionally concatenated: the two halves are
            // independent, and either can be the only one left.
            [
              WEEK_TARGET - summary.daysThisWeek > 0
                ? `${WEEK_TARGET - summary.daysThisWeek} more ${WEEK_TARGET - summary.daysThisWeek === 1 ? 'day' : 'days'}`
                : null,
              summary.journaledThisWeek ? null : 'one still needs a proper write-up',
            ]
              .filter(Boolean)
              .join(' · ')
          )}
        </div>

        <button className={loggedToday ? 'mc-btn' : 'mc-btn primary'} onClick={logToday}>
          <Plus size={14} />
          {loggedToday ? 'Log another session' : `Log today · +${preview.total} XP`}
        </button>
      </div>

      {/* ---------- the run ---------- */}
      <div className="glass mc-card mc-bt-run">
        <div className={`mc-bt-flame ${summary.streak > 0 ? 'lit' : ''}`}>
          <Flame size={17} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="mc-bt-run-head">
            {summary.streak > 0
              ? `${summary.streak} ${summary.streak === 1 ? 'day' : 'days'} in a row`
              : 'No run going'}
            {summary.boost > 1 && <span className="mc-bt-mult">{summary.boost}× XP</span>}
          </div>
          <div className="mc-bt-run-sub">
            {upcoming
              ? `${upcoming.at - summary.streak} more for ${upcoming.multiplier}×.`
              : 'Maximum multiplier — this is as good as it gets.'}{' '}
            A day pays {BACKTEST_XP.session} XP, {BACKTEST_XP.session + BACKTEST_XP.journaled} with a
            write-up. Miss two days and the run resets.
          </div>
        </div>
      </div>

      <div className="mc-bt-stats">
        <Stat label="Reps XP" value={summary.xp.toLocaleString()} icon={<Zap size={11} />} />
        <Stat label="Days logged" value={String(summary.totalDays)} />
        <Stat label="Sessions" value={String(summary.totalSessions)} />
        <Stat label="Best run" value={`${summary.longestStreak}d`} />
      </div>

      <div style={{ fontSize: 11, color: 'var(--txt-faint)', lineHeight: 1.55, marginTop: -6 }}>
        Reps XP counts toward your process rank and nothing else. It never becomes a clean day, a
        streak, or a line on any trading stat — none of this had money on it.
      </div>

      {/* ---------- the log ---------- */}
      <div className="glass mc-card">
        <div className="mc-section-title" style={{ marginBottom: 14 }}>
          Sessions
        </div>
        {ordered.length === 0 ? (
          <Empty icon={<Target size={18} />}>
            Nothing logged yet. One session a day, seven days — that's the whole goal.
          </Empty>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ordered.map((s) => (
              <SessionRow key={s.id} session={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="glass mc-card mc-bt-stat">
      <div className="mc-daycard-metric-label">
        {icon} {label}
      </div>
      <div className="mc-bt-stat-value">{value}</div>
    </div>
  );
}

function SessionRow({ session }: { session: BacktestSession }) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const journaled = isJournaled(session);

  async function attach(file: File) {
    setUploading(true);
    try {
      updateBacktest(session.id, { image: await uploadImage(file) });
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={`mc-bt-row ${journaled ? 'journaled' : ''}`}>
      <button className="mc-bt-row-head" onClick={() => setOpen((v) => !v)}>
        <span className="mc-bt-row-date">{session.date}</span>
        <span className="mc-bt-row-meta">
          {session.setups} {session.setups === 1 ? 'setup' : 'setups'}
          {session.sessionProfile && ` · ${session.sessionProfile}`}
        </span>
        {journaled && (
          <span className="mc-bt-badge">
            <Check size={9} /> written up
          </span>
        )}
      </button>

      {open && (
        <div className="mc-bt-row-body">
          <div className="mc-trade-pill-row">
            <label className="mc-trade-pill">
              <span style={{ color: 'var(--txt-faint)', fontSize: 11 }}>SETUPS</span>
              <input
                type="number"
                inputMode="numeric"
                style={{ width: 56 }}
                value={session.setups}
                onChange={(e) => updateBacktest(session.id, { setups: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="mc-trade-pill">
              <span style={{ color: 'var(--txt-faint)', fontSize: 11 }}>PROFILE</span>
              <select
                value={session.sessionProfile ?? ''}
                onChange={(e) =>
                  updateBacktest(session.id, {
                    sessionProfile: (e.target.value || undefined) as SessionProfile | undefined,
                  })
                }
              >
                <option value="">—</option>
                {SESSIONS.filter((s) => s.tradable).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mc-trade-pill">
              <span style={{ color: 'var(--txt-faint)', fontSize: 11 }}>TYPE</span>
              <select
                value={session.candleRole ?? ''}
                onChange={(e) =>
                  updateBacktest(session.id, {
                    candleRole: (e.target.value || undefined) as CandleRole | undefined,
                  })
                }
              >
                <option value="">—</option>
                {SETUPS.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <textarea
            className="mc-input"
            rows={3}
            placeholder="What did the reps show you? A couple of sentences is what earns the bonus."
            value={session.notes ?? ''}
            onChange={(e) => updateBacktest(session.id, { notes: e.target.value })}
          />

          {session.image ? (
            <div className="mc-bt-shot">
              <img src={session.image} alt="" />
              <button
                className="mc-icon-btn danger"
                onClick={() => updateBacktest(session.id, { image: undefined })}
                aria-label="Remove chart"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ) : (
            <button className="mc-btn ghost sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 size={13} className="mc-spin" /> : <ImagePlus size={13} />}
              Add the chart
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) attach(f);
              e.target.value = '';
            }}
          />

          <div className="mc-bt-row-foot">
            <span style={{ fontSize: 11, color: journaled ? 'var(--win)' : 'var(--txt-faint)' }}>
              {journaled
                ? `Written up — earning the full ${BACKTEST_XP.session + BACKTEST_XP.journaled} XP base.`
                : `Add a chart and a couple of sentences for +${BACKTEST_XP.journaled} XP.`}
            </span>
            <button
              className="mc-icon-btn danger"
              style={{ marginLeft: 'auto' }}
              onClick={() => (confirmDelete ? removeBacktest(session.id) : setConfirmDelete(true))}
              title={confirmDelete ? 'Click again to delete' : 'Delete session'}
              aria-label="Delete session"
            >
              <Trash2 size={14} />
            </button>
          </div>
          {confirmDelete && (
            <div style={{ fontSize: 11, color: 'var(--loss)' }}>
              Click the bin again to delete — no undo.{' '}
              <button className="mc-btn ghost sm" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

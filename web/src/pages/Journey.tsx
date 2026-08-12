/* ============================================================
   The journey — the rings as their own destination.

   Laid out like the reference: the road carries the left, a narrow column on the
   right holds today's checkpoint and the leg breakdown. On a phone that column
   splits — the checkpoint and the two readouts come first, then the road, then
   the legs — because the thing you open this page to do is check in.

   Reached by tapping Voyager on the hub, through a brief full-screen transition,
   so it arrives as a place rather than an expansion.
   ============================================================ */

import { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Check, Flag } from 'lucide-react';
import { CleanCalendar } from '../components/CleanCalendar';
import { DayLog } from '../components/DayLog';
import { RoadPath } from '../components/RoadPath';
import { Ship } from '../components/Ship';
import { WaypointCard } from '../components/WaypointCard';
import type { Waypoint } from '../data/waypoints';
import { activeAccount, checkFor, useStore } from '../store/useStore';
import { overrideSummary, useDevUnlockAll } from '../store/devMode'; // TEMPORARY — see store/devMode.ts
import { LEGS, XP_PER_LEVEL, summarizeDiscipline, trajectory } from '../utils/discipline';
import { isNonTradingDay, restLabel } from '../utils/marketDays';
import { summarizeBacktest } from '../utils/backtest';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function Journey({ onBack, onCheckIn }: { onBack: () => void; onCheckIn: () => void }) {
  const { entries, discipline } = useStore();
  const account = activeAccount();
  const today = todayStr();
  const [openStop, setOpenStop] = useState<Waypoint | null>(null);
  const [dayLog, setDayLog] = useState<{ open: boolean; date?: string }>({ open: false });
  const devUnlockAll = useDevUnlockAll(); // TEMPORARY — see store/devMode.ts

  const view = useMemo(() => {
    if (!account) return null;
    const summary = overrideSummary(
      summarizeDiscipline(
        account,
        discipline.adjustments,
        entries,
        discipline.checks,
        today,
        // Reps lift the rank and nothing else — see utils/backtest.ts.
        summarizeBacktest(discipline.backtests ?? [], today).xp,
      ),
      devUnlockAll,
    );
    return {
      summary,
      traj: trajectory(summary.cleanDays),
      checkedIn: Boolean(checkFor(today, account.id)),
    };
  }, [account, discipline, entries, today, devUnlockAll]);

  if (!view) return null;
  const { summary, traj, checkedIn } = view;
  // A logged trade already carries what the checkpoint would have asked, so
  // today can already be clean without the ritual — the banner below should
  // say that instead of asking for a check-in that wouldn't change anything.
  const todayVerdict = summary.verdicts.find((v) => v.date === today);
  const todayClean = !checkedIn && todayVerdict?.clean === true;
  // A weekend or market holiday is not graded at all, so the primary call to
  // action must not be a checkpoint — it would pay nothing and prove nothing.
  // Saying so is the honest version of the same card.
  const shut = isNonTradingDay(today) && !todayVerdict;
  const xpIntoLevel = summary.xp % XP_PER_LEVEL;

  return (
    <div className="mc-page" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* ---------- header strip ---------- */}
      <div className="mc-journey-head">
        <button className="mc-btn ghost sm" onClick={onBack}>
          <ArrowLeft size={13} /> Moonshot
        </button>
      </div>

      <div className="mc-journey-layout">
        {/* ---------- today, first thing on the page ---------- */}
        <div className="mc-journey-today">
          <div className="glass mc-card">
            <div className="mc-kpi-label">
              <Flag size={11} /> Today
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 400,
                marginTop: 8,
                lineHeight: 1.45,
              }}
            >
              {shut
                ? `${restLabel(today)} — the market is shut.`
                : checkedIn
                  ? "Today's checkpoint is done."
                  : todayClean
                    ? 'Today is already clean.'
                    : "Today's checkpoint is ready."}
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: 'var(--txt-dim)',
                marginTop: 8,
                lineHeight: 1.6,
              }}
            >
              {shut
                ? 'Nothing to grade today, and nothing missed by sitting it out. Your streak holds straight over it. You can still check in if you want the note — it just will not count either way.'
                : todayClean
                  ? "The trade you logged already cleared your framework — no check-in needed for it to count. Still there if you want to add anything."
                  : 'Did the trade match your framework, or did you break your rule. No P&L rewards — process only.'}
            </div>
          </div>

          <button
            className={checkedIn || todayClean || shut ? 'mc-btn' : 'mc-btn primary'}
            style={{
              justifyContent: 'center',
              padding: '18px 16px',
              fontSize: 14,
              borderRadius: 16,
            }}
            onClick={onCheckIn}
          >
            {checkedIn
              ? 'Update check-in'
              : shut
                ? 'Check in anyway'
                : todayClean
                  ? 'Add a check-in anyway'
                  : 'Start today’s checkpoint'}
          </button>

          {/* the two readouts, side by side */}
          <div className="mc-journey-stats">
            <div className="mc-daycard-metric">
              <div className="mc-daycard-metric-label">Trajectory</div>
              <div className="mc-daycard-metric-value">
                {summary.cleanDays} / {LEGS[LEGS.length - 1].at}
              </div>
            </div>

            <div className="mc-daycard-metric">
              <div className="mc-daycard-metric-label">Process rank</div>
              <div
                className="mc-daycard-metric-value"
                style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}
              >
                Level {summary.level}
                <span style={{ fontSize: 11, color: 'var(--txt-faint)' }}>
                  {xpIntoLevel} / {XP_PER_LEVEL} XP
                </span>
              </div>
              <div className="mc-wl-bar" style={{ marginTop: 6, height: 4 }}>
                <div
                  className="wl-win"
                  style={{ width: `${(xpIntoLevel / XP_PER_LEVEL) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ---------- the road ---------- */}
        <div
          className="glass mc-card mc-journey-road"
          style={{ position: 'relative', paddingTop: 26, paddingBottom: 26 }}
        >
          <div
            style={{
              position: 'absolute',
              top: 18,
              left: 20,
              padding: '8px 12px',
              borderRadius: 12,
              background: 'var(--glass-input)',
              border: '1px solid var(--hairline-soft)',
            }}
          >
            <div className="mc-daycard-metric-label">Current leg</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{traj.legName}</div>
          </div>

          {/* The route. Opens scrolled to wherever you've actually got to. */}
          <RoadPath cleanDays={summary.cleanDays} onSelect={setOpenStop}>
            <Ship />
          </RoadPath>

          <div
            style={{
              position: 'absolute',
              right: 20,
              bottom: 18,
              padding: '8px 12px',
              borderRadius: 12,
              textAlign: 'right',
              background: 'var(--glass-input)',
              border: '1px solid var(--hairline-soft)',
            }}
          >
            <div className="mc-daycard-metric-label">Destination</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>The Moon</div>
            <div style={{ fontSize: 10.5, color: 'var(--txt-faint)' }}>
              {traj.toNext !== null
                ? `${LEGS[LEGS.length - 1].at - summary.cleanDays} clean days out`
                : 'Arrived'}
            </div>
          </div>
        </div>

        {/* ---------- legs ---------- */}
        <div className="mc-journey-legs">
          <div className="glass mc-card">
            <div className="mc-section-title" style={{ marginBottom: 12 }}>
              Legs
            </div>
            <div className="mc-alloc-bar" style={{ height: 10, marginBottom: 12 }}>
              {LEGS.slice(0, -1).map((leg, i) => {
                const nextLeg = LEGS[i + 1];
                const span = nextLeg.at - leg.at;
                const done = Math.max(0, Math.min(span, summary.cleanDays - leg.at));
                const filled = done / span;
                return (
                  <div
                    key={leg.id}
                    className="mc-alloc-seg"
                    style={{
                      flex: span,
                      background: `linear-gradient(90deg, var(--accent) ${filled * 100}%, var(--glass-input) ${filled * 100}%)`,
                      opacity: filled > 0 ? 1 : 0.5,
                    }}
                    title={`${leg.name} → ${nextLeg.name}: ${Math.round(done)}/${span}`}
                  />
                );
              })}
            </div>

            <div className="mc-alloc-legend" style={{ marginTop: 0 }}>
              {LEGS.map((leg, i) => {
                const reached = summary.cleanDays >= leg.at;
                const current = i === traj.legIndex;
                return (
                  <div key={leg.id} className="mc-alloc-legend-item">
                    <span
                      className="mc-alloc-dot"
                      style={{
                        background: reached ? 'var(--accent)' : 'var(--glass-input)',
                        border: reached ? 'none' : '1px solid var(--hairline-soft)',
                      }}
                    />
                    <span
                      style={{
                        color: current ? 'var(--txt)' : undefined,
                        fontWeight: current ? 500 : 400,
                      }}
                    >
                      {leg.name}
                    </span>
                    <span
                      style={{
                        marginLeft: 'auto',
                        color: 'var(--txt-faint)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {reached ? <Check size={11} /> : leg.at}
                    </span>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                fontSize: 10.5,
                color: 'var(--txt-faint)',
                marginTop: 12,
                lineHeight: 1.55,
              }}
            >
              Clean days only ever go up. An honest flag doesn't take one away — it just doesn't add
              one.
            </div>

            <button
              className="mc-btn ghost"
              style={{ justifyContent: 'center', width: '100%', marginTop: 14 }}
              onClick={() => setDayLog({ open: true })}
            >
              <BookOpen size={13} /> Day log
            </button>
          </div>
        </div>
      </div>

      {/* ---------- clean-day calendar, full width — where the road gives you
           the total, this gives you the shape: which days, which weeks ---------- */}
      {account && (
        <CleanCalendar
          verdicts={summary.verdicts}
          accountCreatedAt={account.createdAt}
          today={today}
          onSelectDay={(date) => setDayLog({ open: true, date })}
        />
      )}

      {openStop && (
        <WaypointCard
          waypoint={openStop}
          cleanDays={summary.cleanDays}
          onClose={() => setOpenStop(null)}
        />
      )}

      {dayLog.open && account && (
        <DayLog
          account={account}
          checks={discipline.checks}
          entries={entries}
          adjustments={discipline.adjustments}
          cleanDays={summary.cleanDays}
          initialDate={dayLog.date}
          onClose={() => setDayLog({ open: false })}
        />
      )}
    </div>
  );
}

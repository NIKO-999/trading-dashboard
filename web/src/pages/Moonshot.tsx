/* ============================================================
   Moonshot — the home for the whole discipline system.

   Everything discipline-related lives here and nowhere else: level, XP, the
   trajectory, gear, checkpoint, loops. The Dashboard stays pure trading stats.

   The trajectory is driven by clean days, which ratchet: a bad day never
   removes progress, it just doesn't add any. The streak is the number that
   resets. Two numbers, two jobs — and neither is P&L.
   ============================================================ */

import { useMemo, useState } from 'react';
import { Check, Rocket, Sparkles, Zap } from 'lucide-react';
import { Crew } from '../components/Crew';
import { Empty } from '../components/kit';
import { LiveTrade } from '../components/LiveTrade';
import { PreFlight } from '../components/PreFlight';
import { Voyager } from '../components/Voyager';
import { currentGear, nextGear } from '../data/gear';
import { fmtMoney, fmtR } from '../utils/analytics';
import { activeAccount, addEntry, checkFor, useStore } from '../store/useStore';
import { overrideSummary, useDevUnlockAll } from '../store/devMode'; // TEMPORARY — see store/devMode.ts
import {
  LEGS,
  XP_PER_LEVEL,
  detectLoops,
  nextBoost,
  summarizeDiscipline,
  trajectory,
  voyagerMood,
} from '../utils/discipline';
import { summarizeBacktest } from '../utils/backtest';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function Moonshot({
  onCheckIn,
  onEnterJourney,
  onOpenTrade,
}: {
  onCheckIn: () => void;
  onEnterJourney: () => void;
  /** closing a position drops you into the entry, ready for the result */
  onOpenTrade: (id: string) => void;
}) {
  const { entries, discipline } = useStore();
  const account = activeAccount();
  const today = todayStr();
  const [preflight, setPreflight] = useState(false);
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
      loops: detectLoops(account, discipline.adjustments, entries, discipline.checks, today),
      checkedIn: Boolean(checkFor(today, account.id)),
    };
  }, [account, discipline, entries, today, devUnlockAll]);

  if (!account || !view) {
    return (
      <div className="mc-page glass mc-card">
        <Empty icon={<Rocket size={18} />}>Setting up your account…</Empty>
      </div>
    );
  }

  const { summary, traj, loops, checkedIn } = view;
  // A logged trade already carries what the checkpoint would have asked, so
  // today can already be clean without the ritual — say that instead of
  // asking for a check-in that wouldn't change anything.
  const todayVerdict = summary.verdicts.find((v) => v.date === today);
  const todayClean = !checkedIn && todayVerdict?.clean === true;
  const gear = currentGear(summary.cleanDays);
  const next = nextGear(summary.cleanDays);
  const boosted = summary.boost > 1;
  const upcoming = nextBoost(summary.cleanStreak);

  const xpIntoLevel = summary.xp % XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL - xpIntoLevel;

  return (
    <div className="mc-page" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* ---------- the trade you are in right now ---------- */}
      <LiveTrade
        onClose={(live) => {
          // Closing hands straight to the entry rather than a confirmation —
          // the result is the one field that still has to be typed, and the
          // gap between closing and logging is where the record goes missing.
          const created = addEntry({
            date: today,
            sessionProfile: live.sessionProfile,
            candleRole: live.candleRole,
            risk: live.risk,
          });
          onOpenTrade(created.id);
        }}
        onOpenChecklist={() => setPreflight(true)}
      />

      {/* ---------- today ----------
           Right under the trade you're in, not further down the page — this
           is the other thing you actually act on here, and it used to sit
           below the trajectory stats where it read as background reading
           rather than something to do. */}
      <div className="glass mc-card" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12.5, color: checkedIn || todayClean ? 'var(--txt-dim)' : 'var(--txt)' }}>
          {checkedIn
            ? "You've checked in today."
            : todayClean
              ? 'Today is already clean — logged trade cleared your framework.'
              : "You haven't checked in today."}
        </span>
        <button
          className={checkedIn || todayClean ? 'mc-btn' : 'mc-btn primary'}
          style={{ marginLeft: 'auto' }}
          onClick={onCheckIn}
        >
          {checkedIn ? <Check size={13} /> : null}
          {checkedIn ? 'Update check-in' : todayClean ? 'Add a check-in anyway' : 'Check in'}
        </button>
      </div>

      {/* ---------- the 2×2 at-a-glance grid ---------- */}
      <div className="glass mc-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <button
          className="mc-kpi-label"
          onClick={onEnterJourney}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--accent)' }}
        >
          <Rocket size={12} /> Trajectory · {traj.legName}
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          <Stat label="Trajectory" value={`${summary.cleanDays} / ${LEGS[LEGS.length - 1].at}`} />
          <Stat label="Process rank" value={`Level ${summary.level}`} />
          <Stat label="Mastery XP" value={summary.xp.toLocaleString()} />
          <Stat label="Discipline streak" value={`${summary.attendanceStreak}d`} />
        </div>

        {/* ---------- perfect boost ---------- */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            padding: '12px 14px',
            borderRadius: 14,
            background: boosted ? 'rgba(var(--warn-rgb), 0.09)' : 'var(--glass-input)',
            border: `1px solid ${boosted ? 'rgba(var(--warn-rgb), 0.34)' : 'var(--hairline-soft)'}`,
          }}
        >
          <Zap size={15} style={{ color: boosted ? 'var(--warn)' : 'var(--txt-faint)', flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: boosted ? 'var(--warn)' : 'var(--txt-dim)' }}>
              {boosted ? `Perfect boost · ${summary.boost}× XP` : 'Perfect boost · inactive'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-faint)', marginTop: 3, lineHeight: 1.5 }}>
              {summary.cleanStreak} clean {summary.cleanStreak === 1 ? 'day' : 'days'} in a row
              {upcoming
                ? ` · ${upcoming.at - summary.cleanStreak} more for ${upcoming.multiplier}×`
                : ' · maximum boost'}
              . Only a broken rule resets it — a missed day just pauses it.
            </div>
          </div>
        </div>

        <div style={{ fontSize: 11, color: 'var(--txt-faint)', lineHeight: 1.55 }}>
          Progress rewards process, not P&amp;L. Clean days only ever go up — an honest flag doesn't
          take one away, it just doesn't add one.
        </div>
      </div>

      {/* ---------- Voyager ----------
           Header across the top, then art beside the numbers. The art carries a
           glow the colour of the current suit trim, so the halo itself is part
           of the progression rather than decoration bolted on. */}
      <div className="glass mc-card mc-voyager-card">
        <div className="mc-voyager-head">
          <div className="mc-kpi-label">
            <Sparkles size={11} /> Voyager
          </div>
          <h3 className="mc-voyager-name">{gear.name}</h3>
          <p className="mc-voyager-sub">{gear.blurb}</p>
        </div>

        <button
          className="mc-voyager-art"
          onClick={onEnterJourney}
          title="Enter the trajectory"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <span className="mc-voyager-glow" aria-hidden="true" />
          <Voyager
            cleanDays={summary.cleanDays}
            companionId={discipline.equippedCompanion}
            outfitId={discipline.equippedOutfit}
            mood={voyagerMood(summary)}
          />
          <span className="mc-voyager-enter">Enter trajectory</span>
        </button>

        <div className="mc-voyager-info">
          <div className="mc-voyager-xp">
            <span>Level {summary.level}</span>
            <span>{xpToNext.toLocaleString()} XP to next</span>
          </div>
          <div className="mc-wl-bar" style={{ marginTop: 7 }}>
            <div className="wl-win" style={{ width: `${(xpIntoLevel / XP_PER_LEVEL) * 100}%` }} />
          </div>

          <div className="mc-voyager-box">
            {xpIntoLevel.toLocaleString()} / {XP_PER_LEVEL.toLocaleString()} XP
          </div>

          {next ? (
            <div className="mc-voyager-box">
              Next upgrade: {next.name} at {next.at} clean days
              <span className="mc-voyager-box-sub">
                {next.at - summary.cleanDays} clean{' '}
                {next.at - summary.cleanDays === 1 ? 'day' : 'days'} away. Gear is earned by holding
                the rule, not by showing up.
              </span>
            </div>
          ) : (
            <div className="mc-voyager-box">
              Fully kitted
              <span className="mc-voyager-box-sub">Every tier earned, all the way to the Moon.</span>
            </div>
          )}
        </div>
      </div>

      {/* ---------- crew ---------- */}
      <Crew summary={summary} />

      {/* ---------- loops ---------- */}
      <div className="glass mc-card">
        <div className="mc-section-title" style={{ marginBottom: 14 }}>
          What's repeating
        </div>
        {loops.length === 0 ? (
          <Empty icon={<Check size={18} />}>Nothing repeating in the last two weeks.</Empty>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loops.map((flag) => (
              <div key={flag.id} className="mc-stat-row" style={{ alignItems: 'flex-start' }}>
                <span className="mc-stat-label" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
                  <span style={{ color: flag.severity === 'high' ? 'var(--loss)' : 'var(--txt)' }}>
                    {flag.title}
                  </span>
                  <span style={{ fontSize: 11.5, color: 'var(--txt-faint)' }}>{flag.detail}</span>
                  {/* The price of the pattern, in the account's own numbers.
                      Only shown when it actually cost something — a pattern
                      that happened to come out ahead is still a broken rule,
                      but "it cost you +2R" would read as an endorsement. */}
                  {flag.cost && flag.cost.r < 0 && (
                    <span style={{ fontSize: 11.5, color: 'var(--loss)', fontWeight: 500 }}>
                      Cost you {fmtR(flag.cost.r)} across {flag.cost.trades}{' '}
                      {flag.cost.trades === 1 ? 'trade' : 'trades'}
                      {flag.cost.money !== 0 && ` · ${fmtMoney(flag.cost.money)}`}
                    </span>
                  )}
                </span>
                {flag.dates.length > 0 && (
                  <span className="mc-stat-value" style={{ fontSize: 11, color: 'var(--txt-faint)' }}>
                    {flag.dates[flag.dates.length - 1]}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {preflight && <PreFlight onClose={() => setPreflight(false)} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="mc-daycard-metric">
      <div className="mc-daycard-metric-label">{label}</div>
      <div className="mc-daycard-metric-value">{value}</div>
    </div>
  );
}

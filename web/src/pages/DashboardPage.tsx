/* ============================================================
   Dashboard — the at-a-glance view: where you stand, and the shape
   of how you got there.
   ============================================================ */

import { useMemo } from 'react';
import {
  Activity,
  BarChart3,
  Percent,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Empty, Seg } from '../components/kit';
import { SessionNow } from '../components/SessionNow';
import { equityCurve, fmtMoney, fmtPct, fmtR, summarize } from '../utils/analytics';
import { TARGET_R, comeback } from '../utils/discipline';
import { activeAccount, useStore } from '../store/useStore';
import type { GradedEntry } from '../types';

const TIMEFRAMES = [
  { value: 30, label: '30D' },
  { value: 90, label: '90D' },
  { value: 365, label: '1Y' },
  { value: null, label: 'All' },
];

export function DashboardPage({
  entries,
  allGradedCount,
  timeframeDays,
  onTimeframeChange,
  onOpenJournal,
  onOpenTrade,
}: {
  entries: GradedEntry[];
  allGradedCount: number;
  timeframeDays: number | null;
  onTimeframeChange: (days: number | null) => void;
  onOpenJournal: () => void;
  onOpenTrade: (id: string) => void;
}) {
  const stats = useMemo(() => summarize(entries), [entries]);
  const curve = useMemo(() => equityCurve(entries), [entries]);
  const recent = entries.slice(0, 12);

  if (!allGradedCount) {
    // Where we are in the day matters most before there's any history to
    // look at — it's the whole content of the screen on day one.
    return (
      <div className="mc-page" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <SessionNow />
        <div className="glass mc-card">
          <Empty icon={<TrendingUp size={18} />}>
            No trades logged yet.
            <br />
            Hit <strong>Log Trade</strong> — put in what you risked and what you made.
            <br />
            <button className="mc-btn" style={{ marginTop: 14 }} onClick={onOpenJournal}>
              Log your first trade
            </button>
          </Empty>
        </div>
      </div>
    );
  }

  const winPct = stats.wins + stats.losses ? stats.wins / (stats.wins + stats.losses) : 0;

  return (
    <div className="mc-page" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* ---------- where we are in the day ---------- */}
      <SessionNow />

      {/* ---------- balance hero + timeframe ---------- */}
      <div className="glass mc-card" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <div className="mc-kpi-label">
            <Activity size={11} /> Net P / L
          </div>
          <div
            className="mc-num-thin mc-balance-num"
            style={{
              fontSize: 48,
              marginTop: 8,
              color: stats.netPnl > 0 ? 'var(--win)' : stats.netPnl < 0 ? 'var(--loss)' : 'var(--txt)',
            }}
          >
            {fmtMoney(stats.netPnl)}
          </div>
          <div className="mc-kpi-sub">
            {fmtR(stats.totalR)} across {stats.total} graded trade{stats.total === 1 ? '' : 's'}
          </div>
          <ComebackLine netPnl={stats.netPnl} />
        </div>
        <Seg options={TIMEFRAMES} value={timeframeDays} onChange={onTimeframeChange} />
      </div>

      {/* ---------- KPI row ---------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <Kpi
          label="Win rate"
          icon={<Percent size={11} />}
          value={fmtPct(winPct)}
          sub={`${stats.wins}W · ${stats.losses}L${stats.breakEven ? ` · ${stats.breakEven}BE` : ''}`}
        >
          <div className="mc-wl-bar" style={{ marginTop: 10 }}>
            <div className="wl-win" style={{ width: `${winPct * 100}%` }} />
            <div className="wl-loss" style={{ width: `${(1 - winPct) * 100}%` }} />
          </div>
        </Kpi>

        <Kpi
          label="Average R"
          icon={<Target size={11} />}
          value={fmtR(stats.avgR)}
          sub={`Best streak ${stats.bestStreak}W · worst ${stats.worstStreak}L`}
        />

        <Kpi
          label="Profit factor"
          icon={<BarChart3 size={11} />}
          value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
          sub={`Avg win ${fmtMoney(stats.avgWin, false)} · avg loss ${fmtMoney(stats.avgLoss, false)}`}
        />

        <Kpi
          label="Expectancy"
          icon={<TrendingUp size={11} />}
          value={fmtMoney(stats.expectancy)}
          sub="Expected value per trade"
        />
      </div>

      {/* ---------- equity curve ---------- */}
      <div className="glass mc-card">
        <div className="mc-section-title" style={{ marginBottom: 16 }}>
          Equity curve
        </div>
        {curve.length < 2 ? (
          <Empty>Two graded trades and this starts drawing.</Empty>
        ) : (
          <div className="mc-chart-wrap" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={curve} margin={{ top: 6, right: 6, bottom: 0, left: -14 }}>
                <defs>
                  <linearGradient id="mc-equity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stats.netPnl >= 0 ? 'var(--win)' : 'var(--loss)'} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={stats.netPnl >= 0 ? 'var(--win)' : 'var(--loss)'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="trade"
                  tick={{ fill: 'rgba(255,255,255,0.34)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.34)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={54}
                  tickFormatter={(v: number) => fmtMoney(v, false)}
                />
                <Tooltip
                  cursor={{ stroke: 'rgba(255,255,255,0.25)', strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as { date: string; pnl: number; r: number };
                    return (
                      <div className="mc-chart-tooltip" style={{ position: 'static', transform: 'none' }}>
                        <div className="tt-date">{p.date}</div>
                        <div>{fmtMoney(p.pnl)} · {fmtR(p.r)}</div>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="pnl"
                  stroke={stats.netPnl >= 0 ? 'var(--win)' : 'var(--loss)'}
                  strokeWidth={1.6}
                  fill="url(#mc-equity)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ---------- recent form ---------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
        <div className="glass mc-card">
          <div className="mc-section-title" style={{ marginBottom: 14 }}>
            Recent form
          </div>
          <div className="mc-dotstrip">
            <div className="mc-dotstrip-row">
              <span className="mc-dotstrip-label">Last {recent.length}</span>
              <span className="mc-dotstrip-dots">
                {[...recent].reverse().map((e) => (
                  <span
                    key={e.id}
                    className="mc-dotstrip-dot"
                    title={`${e.date} · ${fmtR(e.r)}`}
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
              <span className="mc-dotstrip-count">
                {stats.currentStreak > 0 ? `${stats.currentStreak}W` : stats.currentStreak < 0 ? `${Math.abs(stats.currentStreak)}L` : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="glass mc-card">
          <div className="mc-section-title" style={{ marginBottom: 6 }}>
            Latest trades
          </div>
          {recent.slice(0, 5).map((e) => (
            <button
              key={e.id}
              className="mc-stat-row"
              style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              onClick={() => onOpenTrade(e.id)}
            >
              <span className="mc-stat-label">
                <span style={{ color: 'var(--txt-faint)', fontVariantNumeric: 'tabular-nums' }}>{e.date}</span>
                {e.pair || 'Untitled'}
              </span>
              <span
                className="mc-stat-value"
                style={{ color: e.r > 0 ? 'var(--win)' : e.r < 0 ? 'var(--loss)' : 'var(--txt-dim)' }}
              >
                {fmtR(e.r)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- kpi card ---------- */

function Kpi({
  label,
  value,
  sub,
  icon,
  children,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="glass mc-card mc-kpi">
      <div className="mc-kpi-body">
        <div className="mc-kpi-label">
          {icon}
          {label}
        </div>
        <div className="mc-kpi-value">{value}</div>
        {sub && <span className="mc-kpi-sub">{sub}</span>}
        {children}
      </div>
    </div>
  );
}


/**
 * What the next trade is actually worth, in dollars.
 *
 * A red total is not the whole story when risk is sized off a live balance:
 * one trade at the usual target clears a deficit like this several times over.
 * The number was always derivable and never stated, so the drawdown sat there
 * looking permanent — which is the read that produces the revenge trade this
 * whole app exists to interrupt.
 *
 * Deliberately not a prediction. It prices ONE trade at the target the vault
 * actually states, so the encouragement is arithmetic rather than optimism.
 */
function ComebackLine({ netPnl }: { netPnl: number }) {
  const { entries, discipline } = useStore();
  const account = activeAccount();
  if (!account) return null;

  // Risk comes off the balance you have now — the rule is a percentage of the
  // live balance, so a drawdown genuinely shrinks the next trade.
  const balance =
    account.startingBalance +
    discipline.adjustments
      .filter((a) => a.accountId === account.id)
      .reduce((sum, a) => sum + a.amount, 0) +
    entries
      .filter((e) => (e.accountId ?? account.id) === account.id && typeof e.result === 'number')
      .reduce((sum, e) => sum + (e.result as number), 0);

  const c = comeback(netPnl, balance, account.riskPercent);
  if (c.risk === 0) return null;

  return (
    <div className={`mc-comeback ${c.ahead ? 'ahead' : ''}`}>
      <TrendingUp size={13} />
      {c.ahead ? (
        <span>
          Another {TARGET_R}R at {fmtMoney(c.risk, false)} risk takes you to{' '}
          <strong>{fmtMoney(c.net)}</strong>.
        </span>
      ) : (
        <span>
          One trade at {TARGET_R}R puts you <strong>{fmtMoney(c.net)}</strong> — {c.toFlat.toFixed(1)}R
          gets you back to flat, off {fmtMoney(c.risk, false)} risk.
        </span>
      )}
    </div>
  );
}

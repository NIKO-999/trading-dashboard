/* Day View — one collapsible card per trading day. */

import { useMemo, useState } from 'react';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { Badge, Empty } from '../components/kit';
import { fmtMoney, fmtR, groupByDay } from '../utils/analytics';
import type { GradedEntry } from '../types';

export function DayViewPage({
  entries,
  onOpenTrade,
}: {
  entries: GradedEntry[];
  onOpenTrade: (id: string) => void;
}) {
  const days = useMemo(() => groupByDay(entries), [entries]);
  const [open, setOpen] = useState<Set<string>>(() => new Set(days.slice(0, 1).map((d) => d.date)));

  if (!days.length) {
    return (
      <div className="mc-page glass mc-card">
        <Empty icon={<CalendarDays size={18} />}>No trading days in this timeframe.</Empty>
      </div>
    );
  }

  function toggle(date: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  return (
    <div className="mc-page mc-dayview-grid" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {days.map((day) => {
        const isOpen = open.has(day.date);
        const label = new Date(`${day.date}T00:00:00`).toLocaleDateString('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        return (
          <div className="glass mc-card" key={day.date}>
            <button className="mc-daycard-head" onClick={() => toggle(day.date)}>
              <span className={`mc-daycard-chevron ${isOpen ? 'open' : ''}`}>
                <ChevronRight size={15} />
              </span>
              <span className="mc-daycard-date">{label}</span>
              <span className="mc-daycard-count">
                {day.entries.length} trade{day.entries.length === 1 ? '' : 's'}
              </span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontVariantNumeric: 'tabular-nums',
                  color: day.pnl > 0 ? 'var(--win)' : day.pnl < 0 ? 'var(--loss)' : 'var(--txt-dim)',
                }}
              >
                {fmtMoney(day.pnl)}
              </span>
            </button>

            {isOpen && (
              <>
                <div
                  className="mc-dayview-metrics"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, margin: '16px 0' }}
                >
                  <Metric label="Net" value={fmtMoney(day.pnl)} tone={day.pnl} />
                  <Metric label="R" value={fmtR(day.r)} tone={day.r} />
                  <Metric label="Wins" value={String(day.wins)} />
                  <Metric label="Losses" value={String(day.losses)} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {day.entries.map((e) => (
                    <button
                      key={e.id}
                      className="mc-kb-backlink-row"
                      onClick={() => onOpenTrade(e.id)}
                      style={{ marginTop: 0 }}
                    >
                      <span className="name">
                        {e.pair || 'Untitled'}
                        {e.direction && (
                          <span style={{ color: 'var(--txt-faint)', fontSize: 10, marginLeft: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                            {e.direction}
                          </span>
                        )}
                      </span>
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontVariantNumeric: 'tabular-nums',
                          color: e.r > 0 ? 'var(--win)' : e.r < 0 ? 'var(--loss)' : 'var(--txt-faint)',
                        }}
                      >
                        {fmtR(e.r)}
                      </span>
                      <Badge grade={e.grade} />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: number }) {
  return (
    <div className="mc-daycard-metric">
      <div className="mc-daycard-metric-label">{label}</div>
      <div
        className="mc-daycard-metric-value"
        style={{ color: tone && tone > 0 ? 'var(--win)' : tone && tone < 0 ? 'var(--loss)' : undefined }}
      >
        {value}
      </div>
    </div>
  );
}

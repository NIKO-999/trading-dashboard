/* Trades — the full ledger, sortable. */

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, List, Star } from 'lucide-react';
import { Badge, Empty } from '../components/kit';
import { fmtMoney, fmtR } from '../utils/analytics';
import type { GradedEntry } from '../types';

type SortKey = 'date' | 'pair' | 'risk' | 'result' | 'r';

const COLUMNS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: 'date', label: 'Date' },
  { key: 'pair', label: 'Pair' },
  { key: 'risk', label: 'Risked', numeric: true },
  { key: 'result', label: 'Result', numeric: true },
  { key: 'r', label: 'R', numeric: true },
];

export function TradesPage({
  entries,
  onOpenTrade,
}: {
  entries: GradedEntry[];
  onOpenTrade: (id: string) => void;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'desc' });

  const rows = useMemo(() => {
    const sorted = [...entries].sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      switch (sort.key) {
        case 'pair':
          return (a.pair || '').localeCompare(b.pair || '') * dir;
        case 'risk':
          return ((a.risk ?? 0) - (b.risk ?? 0)) * dir;
        case 'result':
          return (a.pnl - b.pnl) * dir;
        case 'r':
          return (a.r - b.r) * dir;
        default:
          return a.date.localeCompare(b.date) * dir;
      }
    });
    return sorted;
  }, [entries, sort]);

  if (!entries.length) {
    return (
      <div className="mc-page glass mc-card">
        <Empty icon={<List size={18} />}>No trades in this timeframe.</Empty>
      </div>
    );
  }

  function toggle(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));
  }

  return (
    <div className="mc-page glass mc-card" style={{ overflowX: 'auto' }}>
      <table className="mc-ledger">
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => toggle(col.key)}
                style={{ cursor: 'pointer', textAlign: col.numeric ? 'right' : 'left', whiteSpace: 'nowrap' }}
              >
                {col.label}
                {sort.key === col.key &&
                  (sort.dir === 'asc' ? (
                    <ArrowUp size={10} style={{ marginLeft: 4, verticalAlign: -1 }} />
                  ) : (
                    <ArrowDown size={10} style={{ marginLeft: 4, verticalAlign: -1 }} />
                  ))}
              </th>
            ))}
            <th style={{ textAlign: 'right' }}>Outcome</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id} onClick={() => onOpenTrade(e.id)} style={{ cursor: 'pointer' }}>
              <td style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                {e.starred && <Star size={10} fill="currentColor" style={{ marginRight: 5, verticalAlign: -1, opacity: 0.7 }} />}
                {e.date}
              </td>
              <td>
                {e.pair || '—'}
                {e.direction && (
                  <span style={{ color: 'var(--txt-faint)', fontSize: 10, marginLeft: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {e.direction}
                  </span>
                )}
              </td>
              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {typeof e.risk === 'number' ? fmtMoney(e.risk, false) : '—'}
              </td>
              <td
                style={{
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                  color: e.pnl > 0 ? 'var(--win)' : e.pnl < 0 ? 'var(--loss)' : undefined,
                }}
              >
                {typeof e.result === 'number' ? fmtMoney(e.result) : '—'}
              </td>
              <td
                style={{
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                  color: e.r > 0 ? 'var(--win)' : e.r < 0 ? 'var(--loss)' : undefined,
                }}
              >
                {fmtR(e.r)}
              </td>
              <td style={{ textAlign: 'right' }}>
                <Badge grade={e.grade} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

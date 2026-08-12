/* ============================================================
   The clean-day calendar.

   summarizeDiscipline already walks every check-in and judges it — this reuses
   that verdict list rather than re-deriving clean/dirty a second time. Every
   day on the grid is one of four things:

     clean         checked in, held to the rule
     dirty         checked in, broke it — named honestly, not punished
     rest          a weekend or full market holiday with no record — the
                   market was shut, so there was nothing to check in about
                   and nothing was missed. See utils/marketDays.ts.
     no check-in   a TRADING day passed and nothing was logged at all
     out of range  before the account existed, or still in the future

   Note what `rest` does NOT do: it never counts as a clean day. Nothing here
   feeds the streak, the XP or the trajectory — summarizeDiscipline owns all of
   that and only ever sees days with a real record. This is presentation, and
   the point of it is that a Saturday should not sit on the grid wearing the
   same red as a trading day you skipped.

   The reason this exists next to a streak number: a number can't show you
   WHERE the damage clusters. The loop detector already names patterns like
   "give-back tilt" in words; this is the same underlying data laid out so the
   shape of it — a weekday, a run right after a win, a dead week — is
   something you can see yourself rather than take on faith.
   ============================================================ */

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DayVerdict } from '../utils/discipline';
import { isNonTradingDay, restLabel } from '../utils/marketDays';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function ymd(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}
/** Sortable single number for a calendar month, for cheap min/max bounds checks. */
function monthKey(y: number, m: number) {
  return y * 12 + m;
}

type DayState = 'clean' | 'dirty' | 'rest' | 'dark' | 'out';

/** Empty for 'out' — a day outside the account's life states nothing at all. */
const STATE_LABEL: Record<DayState, string> = {
  clean: 'Clean',
  dirty: 'Broke rule',
  rest: 'Rest',
  dark: 'No check-in',
  out: '',
};
type Cell = { date: string; day: number; state: DayState; isToday: boolean; reasons: string[] };

export function CleanCalendar({
  verdicts,
  accountCreatedAt,
  today,
  onSelectDay,
}: {
  verdicts: DayVerdict[];
  /** account.createdAt — nothing before this has any data to show */
  accountCreatedAt: string;
  today: string;
  /** only fired for days that actually have a record — dark and out-of-range days have nothing to open */
  onSelectDay?: (date: string) => void;
}) {
  const byDate = useMemo(() => new Map(verdicts.map((v) => [v.date, v])), [verdicts]);
  const startYmd = accountCreatedAt.slice(0, 10);

  const [ty, tm] = today.split('-').map(Number);
  const [sy, sm] = startYmd.split('-').map(Number);
  const maxMonth = monthKey(ty, tm - 1);
  const minMonth = monthKey(sy, sm - 1);

  const [cursor, setCursor] = useState(() => ({ y: ty, m: tm - 1 }));
  const cursorKey = monthKey(cursor.y, cursor.m);

  const { cells, label } = useMemo(() => {
    const firstWeekday = (new Date(cursor.y, cursor.m, 1).getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();

    const out: (Cell | null)[] = Array.from({ length: firstWeekday }, () => null);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = ymd(cursor.y, cursor.m, day);
      let state: DayState;
      if (date < startYmd || date > today) {
        state = 'out';
      } else {
        const v = byDate.get(date);
        // A real record always wins, weekend or not — you do check in at
        // weekends, and those days keep their own verdict.
        state = v ? (v.clean ? 'clean' : 'dirty') : isNonTradingDay(date) ? 'rest' : 'dark';
      }
      out.push({
        date,
        day,
        state,
        isToday: date === today,
        reasons: byDate.get(date)?.reasons ?? [],
      });
    }
    return { cells: out, label: `${MONTHS[cursor.m]} ${cursor.y}` };
  }, [cursor, byDate, startYmd, today]);

  return (
    <div className="glass mc-card mc-cal">
      <div className="mc-cal-head">
        <div className="mc-section-title" style={{ marginBottom: 0 }}>
          Clean days
        </div>
        <div className="mc-cal-nav">
          <button
            className="mc-icon-btn"
            disabled={cursorKey <= minMonth}
            aria-label="Previous month"
            onClick={() => setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))}
          >
            <ChevronLeft size={13} />
          </button>
          <span className="mc-cal-month">{label}</span>
          <button
            className="mc-icon-btn"
            disabled={cursorKey >= maxMonth}
            aria-label="Next month"
            onClick={() => setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      <div className="mc-cal-weekdays">
        {WEEKDAYS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>

      <div className="mc-cal-grid">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`blank-${i}`} className="mc-cal-cell blank" />;
          // Only clean/dirty days have a record to open — a 'dark' day has
          // nothing to show, and opening the log on it would just silently
          // land on some other day, which reads as a bug, not a fallback.
          const openable = onSelectDay && (cell.state === 'clean' || cell.state === 'dirty');
          const Tag = openable ? 'button' : 'div';
          // A rest day names itself where it can — "Thanksgiving" says more
          // than "Rest", and on the desktop grid there is room for it. The
          // phone hides the label text anyway and leans on the tooltip.
          const label = cell.state === 'rest' ? restLabel(cell.date) : STATE_LABEL[cell.state];
          return (
            <Tag
              key={cell.date}
              className={`mc-cal-cell ${cell.state} ${cell.isToday ? 'today' : ''}`}
              title={
                cell.reasons.length
                  ? cell.reasons.join(' · ')
                  : cell.state === 'dark'
                    ? 'No check-in'
                    : cell.state === 'rest'
                      ? `${restLabel(cell.date)} — market shut, nothing missed`
                      : undefined
              }
              // The visible label is hidden on a phone, where a 38px column
              // cannot hold a word — the dot and the legend carry it there.
              // This keeps the state spoken either way.
              aria-label={label ? `${cell.day}: ${label}` : String(cell.day)}
              onClick={openable ? () => onSelectDay!(cell.date) : undefined}
            >
              <span className="mc-cal-daynum">{cell.day}</span>
              {label && (
                <span className="mc-cal-state">
                  {/* Rest gets no dot at all. The dot is the "this day has a
                      verdict" marker, and a weekend deliberately has none —
                      giving it one would put it back on the same footing as
                      a day you were supposed to show up for. */}
                  {cell.state !== 'rest' && <span className="mc-cal-dot" />}
                  <span className="mc-cal-state-label">{label}</span>
                </span>
              )}
            </Tag>
          );
        })}
      </div>

      <div className="mc-cal-legend">
        <span>
          <i className="mc-cal-swatch clean" /> Clean
        </span>
        <span>
          <i className="mc-cal-swatch dirty" /> Broke a rule
        </span>
        <span>
          <i className="mc-cal-swatch dark" /> No check-in
        </span>
        <span>
          <i className="mc-cal-swatch rest" /> Market shut
        </span>
      </div>
    </div>
  );
}

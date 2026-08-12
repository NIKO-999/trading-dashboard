/* ============================================================
   The trade you are in right now.

   Every Entry in this app is a closed record. That meant the app was only ever
   present after the decision — and the decision that costs you happens while
   the position is open, not when you write it up afterwards.

   Two jobs, and they are the same job:

   1. Say the framework's own instruction while it can still change something.
      Your target is the draw. That is what the trade is being held for.
   2. Make the second trade visible BEFORE it is taken. The counter counts the
      open position, so "1 / 1" is showing while you are still in the first one.
      The days you stopped logging are exactly the days that number mattered.

   Deliberately not a P&L tracker. It does not ask what the trade is worth,
   because "what is it worth right now" is the question that produces the
   behaviour this whole module exists to interrupt.

   Edit and Discard exist because the first version didn't have them: the only
   way out of an open position was to log it, so a wrong candle picked in a
   hurry, or a position opened by mistake, forced a real trade record into
   existence. Discard reuses the tap-again confirm pattern from the Journal's
   delete button — same gesture, same place in the app, one thing to learn.
   ============================================================ */

import { useEffect, useState } from 'react';
import { ClipboardCheck, Pencil, Radio, Square, Target, Trash2 } from 'lucide-react';
import { SESSIONS, SETUPS } from '../data/framework';
import { TimingCall } from './TimingCall';
import { closePosition, livePosition, openPosition, tradesUsedToday, updatePosition, useStore } from '../store/useStore';
import type { CandleRole, SessionProfile } from '../types';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Whole minutes since the position opened. */
function minutesSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

function elapsed(mins: number): string {
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

type Mode = 'idle' | 'opening' | 'editing';

export function LiveTrade({
  onClose,
  onOpenChecklist,
}: {
  onClose: (live: { sessionProfile?: SessionProfile; candleRole?: CandleRole; risk?: number }) => void;
  /** the same pre-flight checklist reachable from Moonshot's own button — quick
   *  access to it while the trade is still open, not a second copy of it */
  onOpenChecklist: () => void;
}) {
  useStore();
  const date = todayStr();
  const live = livePosition();
  const { logged, used } = tradesUsedToday(date);
  const [mode, setMode] = useState<Mode>('idle');
  const [session, setSession] = useState<SessionProfile | ''>('');
  const [role, setRole] = useState<CandleRole | ''>('');
  const [risk, setRisk] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Re-render once a minute so the elapsed time is not a lie. Cheap, and only
  // while something is actually open.
  const [, tick] = useState(0);
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, [live]);

  const over = used > 1;

  function startEditing() {
    if (!live) return;
    setSession(live.sessionProfile ?? '');
    setRole(live.candleRole ?? '');
    setRisk(typeof live.risk === 'number' ? String(live.risk) : '');
    setConfirmDiscard(false);
    setMode('editing');
  }

  function discardOrConfirm() {
    if (!confirmDiscard) {
      setConfirmDiscard(true);
      return;
    }
    closePosition();
    setConfirmDiscard(false);
  }

  /* ---------------- open position — not currently being edited ---------------- */
  if (live && mode !== 'editing') {
    const mins = minutesSince(live.openedAt);
    const spec = SESSIONS.find((s) => s.id === live.sessionProfile);
    const setup = SETUPS.find((s) => s.id === live.candleRole);

    return (
      <div className="glass mc-card mc-live on">
        <div className="mc-live-head">
          <span className="mc-live-dot" />
          <span className="mc-live-title">In a trade</span>
          <span className="mc-live-time">{elapsed(mins)}</span>
        </div>

        <div className="mc-live-what">
          {spec ? spec.label : 'Unlogged candle'}
          {setup && ` · ${setup.label}`}
          {typeof live.risk === 'number' && ` · risked ${live.risk.toLocaleString()}`}
        </div>

        {/* The framework's own instruction, not a pep talk. Example 2 ends on
            exactly this line, and it is the one that decides the outcome. */}
        <div className="mc-live-rule">Hold it for the open draw. That is the target you took it for.</div>

        {/* ...and the other half of that rule, which the card used to leave out.
            "Hold for the draw" without "the draw is where it ends" is only the
            encouraging half — it reads as hold forever. Protection expires the
            moment the draw is met; past that the level you're leaning on is
            liquidity for the next move, not structure for this one. */}
        <div className="mc-live-exit">
          <Target size={13} />
          <span>
            <strong>And that is where it ends.</strong> Once the draw is hit the move is done — those
            highs and lows are now liquidity for the <em>next</em> move, not structure for this one.
          </span>
        </div>

        {/* How much candle is left to deliver in. The card knew how long you
            had been in; it never said how long the candle had. */}
        <TimingCall inTrade />

        <TradesUsed logged={logged} live used={used} />

        <button
          className="mc-btn"
          style={{ justifyContent: 'center', width: '100%', marginTop: 12 }}
          onClick={() => {
            onClose({
              sessionProfile: live.sessionProfile,
              candleRole: live.candleRole,
              risk: live.risk,
            });
            closePosition();
          }}
        >
          <Square size={12} /> It's closed — log it
        </button>

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="mc-btn ghost sm" style={{ flex: 1, justifyContent: 'center' }} onClick={onOpenChecklist}>
            <ClipboardCheck size={11} /> Checklist
          </button>
          <button className="mc-btn ghost sm" style={{ flex: 1, justifyContent: 'center' }} onClick={startEditing}>
            <Pencil size={11} /> Edit
          </button>
          <button
            className="mc-btn ghost sm"
            style={{ flex: 1, justifyContent: 'center', color: confirmDiscard ? 'var(--loss)' : undefined }}
            onClick={discardOrConfirm}
          >
            <Trash2 size={11} /> {confirmDiscard ? 'Tap again to discard' : 'Discard'}
          </button>
        </div>

        {confirmDiscard && (
          <div style={{ fontSize: 11, color: 'var(--loss)', marginTop: 8, textAlign: 'center' }}>
            No trade gets logged — the position just disappears.{' '}
            <button className="mc-btn ghost sm" onClick={() => setConfirmDiscard(false)}>
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ---------------- opening / editing form ---------------- */
  if (mode === 'opening' || mode === 'editing') {
    return (
      <div className="glass mc-card mc-live">
        <div className="mc-live-head">
          <Radio size={13} />
          <span className="mc-live-title">{mode === 'editing' ? 'Editing the open trade' : 'Starting a trade'}</span>
        </div>

        <div className="mc-section-title" style={{ margin: '12px 0 8px' }}>
          Which candle
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {SESSIONS.filter((s) => s.tradable).map((s) => (
            <button
              key={s.id}
              className={`mc-tag-chip ${session === s.id ? 'active' : ''}`}
              onClick={() => setSession(s.id as SessionProfile)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="mc-section-title" style={{ margin: '14px 0 8px' }}>
          What am I taking
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {SETUPS.map((s) => (
            <button
              key={s.id}
              className={`mc-tag-chip ${role === s.id ? 'active' : ''}`}
              onClick={() => setRole(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="mc-section-title" style={{ margin: '14px 0 8px' }}>
          Risked · optional
        </div>
        <input
          className="mc-input"
          inputMode="decimal"
          placeholder="300"
          value={risk}
          onChange={(e) => setRisk(e.target.value)}
        />

        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button className="mc-btn ghost" onClick={() => setMode('idle')}>
            Cancel
          </button>
          <button
            className="mc-btn primary"
            style={{ marginLeft: 'auto' }}
            disabled={!session || !role}
            onClick={() => {
              const n = Number(risk);
              const parsedRisk = risk.trim() && Number.isFinite(n) ? n : undefined;
              if (mode === 'editing') {
                updatePosition({ sessionProfile: session || undefined, candleRole: role || undefined, risk: parsedRisk });
              } else {
                openPosition({ date, sessionProfile: session || undefined, candleRole: role || undefined, risk: parsedRisk });
              }
              setMode('idle');
              setSession('');
              setRole('');
              setRisk('');
            }}
          >
            {mode === 'editing' ? 'Save' : "I'm in"}
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- idle ---------------- */
  return (
    <div className="glass mc-card mc-live">
      <TradesUsed logged={logged} live={false} used={used} />
      <button
        className={over ? 'mc-btn' : 'mc-btn primary'}
        style={{ justifyContent: 'center', width: '100%', marginTop: 12 }}
        onClick={() => setMode('opening')}
      >
        <Radio size={12} /> {over ? 'Starting another one' : "I'm in a trade"}
      </button>
    </div>
  );
}

/**
 * The number the whole rule is made of. It lives here rather than inside the
 * checkpoint modal because by the time you open that, the decision is made.
 */
function TradesUsed({ logged, live, used }: { logged: number; live: boolean; used: number }) {
  const over = used > 1;
  return (
    <div className={`mc-used ${over ? 'over' : ''}`}>
      <div className="mc-used-row">
        <span className="mc-used-label">Trades today</span>
        <span className="mc-used-n">{used} / 1</span>
      </div>
      {/* One segment for the trade you are allowed, and one more for every
          trade past it. Empty until something is actually taken — a full green
          bar at 0/1 reads as "done", which is the opposite of true. */}
      <div className="mc-used-bar">
        <span className={`mc-used-seg ${used >= 1 ? 'ok' : ''}`} />
        {Array.from({ length: Math.max(0, used - 1) }, (_, i) => (
          <span key={i} className="mc-used-seg over" />
        ))}
      </div>
      <div className="mc-used-note">
        {over
          ? `Your rule is one. This is number ${used}${live ? ' and it is still open' : ''}.`
          : live
            ? 'This is it. Nothing else today.'
            : logged === 1
              ? 'Done for the day. The one you had is logged.'
              : 'One trade, 10% of balance. That is the rule.'}
      </div>
    </div>
  );
}

export { TradesUsed };

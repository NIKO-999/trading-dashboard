/* ============================================================
   Where we are in the day — read-only, on purpose.

   The first thing you see when you open the app should answer "what am I
   even looking for right now" without you having to go find it. This reads
   the clock, works out which 4H candle is running (or about to open), and
   states that candle's own expectation — straight from data/framework.ts, the
   same source the pre-flight checklist uses.

   Deliberately nothing to click. That was the original rule here, and it got
   broken: this strip grew a "Looking for" picker and a full "Avoid it if"
   list, which turned the opening screen into the checklist and made it
   interactive again. Both are gone. The gates live where you actually use
   them — in Log Trade and the pre-flight check, attached to a real trade —
   and duplicating them here only produced a second, competing copy you had to
   read past every time you opened the app.

   What is left is what is true whether or not you trade: which candle you are
   in, the read for that candle specifically, the clock check on whether to act
   on it now, and what happens if you miss it. The handoff line went — what
   this candle gives the next one is chain reasoning you want when planning a
   trade, not when glancing at the clock.
   ============================================================ */

import { useEffect, useState } from 'react';
import { AlertTriangle, Ban, Clock, Crosshair } from 'lucide-react';
import { SESSIONS } from '../data/framework';
import { sessionNow, untilLabel } from '../utils/session';
import { TimingCall } from './TimingCall';

export function SessionNow() {
  const [now, setNow] = useState(() => new Date());

  // Every 15s rather than every 60s: a minute-resolution countdown ticked on a
  // minute timer can sit a full minute stale, which is exactly wrong on the
  // one display whose job is telling you how long is left.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);

  const state = sessionNow(now);
  // Once the next open is close, that's the candle worth reading about.
  const focusId = state.approaching ? state.next : state.current;
  const spec = SESSIONS.find((s) => s.id === focusId);
  if (!spec) return null;

  return (
    <div className={`glass mc-card mc-sess ${spec.tradable ? '' : 'notrade'}`}>
      <div className="mc-sess-head">
        <span className="mc-sess-status">
          <Clock size={12} />
          {state.approaching ? 'Approaching' : 'In'}
        </span>
        <span className="mc-sess-label">{spec.label}</span>
        <span className="mc-sess-name">{spec.name}</span>
        <span className="mc-sess-count">
          {/* The clock the grid was actually computed from. Named explicitly
              because the labels are New York hours and the device usually
              isn't — without this, a wrong-looking candle has no explanation. */}
          <span className="mc-sess-ny">{state.nyTime} NY</span>
          {state.approaching
            ? `opens in ${untilLabel(state.minutesToNext)}`
            : `${untilLabel(state.minutesToNext)} left · then ${
                SESSIONS.find((s) => s.id === state.next)?.label ?? ''
              }`}
        </span>
      </div>

      {spec.tradable ? (
        <>
          {/* The read, as advice rather than description: what you are doing
              on this candle, the specific thing that has to show up, and what
              means you leave it alone. It used to narrate the candle —
              "takes a low, makes low of day, expands up" — which is the
              profile's own definition restated back at you, not something you
              can act on. */}
          <div className="mc-sess-play">{spec.read.play}</div>

          <div className="mc-sess-dirs">
            <div className="mc-sess-dir look">
              <Crosshair size={13} />
              <span>
                <strong>Looking for</strong> {spec.read.lookFor}
              </span>
            </div>
            <div className="mc-sess-dir stand">
              <Ban size={13} />
              <span>
                <strong>Not here if</strong> {spec.read.standDown}
              </span>
            </div>
          </div>

          {/* Timing last, after the read rather than before it: by the time
              you've read what to look for and what rules it out, the clock is
              the final check before acting on it. */}
          <TimingCall />

          <div className="mc-sess-missed">
            <strong>If you miss it:</strong> {spec.expectMissed}
          </div>
        </>
      ) : (
        <div className="mc-sess-notrade-body">
          <AlertTriangle size={15} />
          <div>
            <div className="mc-sess-notrade-head">{spec.expectThis}</div>
            <div className="mc-sess-missed" style={{ marginTop: 6 }}>
              {spec.expectMissed}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

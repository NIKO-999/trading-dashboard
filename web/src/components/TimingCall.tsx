/* ============================================================
   The timing decision, as one line.

   "Time Remaining in C2 — The Core Decision Tree" is the master rule of the
   whole timing framework, and it turns entirely on a number the app has
   always had: how much of the current 4H candle is left. The countdown was
   already on screen; the rule was already written down. This connects them.

   Shared between the dashboard strip and the open-position card because it is
   one engine — but they are asking genuinely different questions of it. On the
   dashboard it decides whether to ENTER inside this candle. In a trade that
   decision is behind you; what is left of the candle is now runway, and the
   question is whether the move has room to deliver before the close.

   So the branch is shared and the wording is not. Hedging one set of copy to
   cover both would have produced a line that reads as entry advice while you
   are already holding, which is worse than no line.
   ============================================================ */

import { useEffect, useState } from 'react';
import { Clock, Hourglass, Zap } from 'lucide-react';
import { timingNow, untilLabel } from '../utils/session';

export function TimingCall({ inTrade = false }: { inTrade?: boolean }) {
  const [call, setCall] = useState(() => timingNow());

  // Same 15s tick as the countdown it is derived from — a decision that flips
  // at the hour mark cannot be a minute stale.
  useEffect(() => {
    const id = setInterval(() => setCall(timingNow()), 15_000);
    return () => clearInterval(id);
  }, []);

  // In a trade this sits next to the position's own elapsed time, so it has to
  // name which clock it is — "38m left" beside "in 42m" is unreadable.
  const left = `${untilLabel(call.minutesLeft)} left${inTrade ? ' in this candle' : ''}`;

  if (call.verdict === 'driver-overrides') {
    const away = untilLabel(call.driver?.minutesAway ?? 0);
    return (
      <div className="mc-timing driver">
        <Zap size={14} className="mc-timing-icon" />
        <div>
          <div className="mc-timing-head">
            {/* The tag, not the colour, is what marks this as the exception —
                see the .mc-timing.driver rule for why. */}
            <span className="mc-timing-tag">OVERRIDE</span>
            {call.driver?.label} in {away} — {inTrade ? 'expansion is coming' : 'position now'}
          </div>
          <div className="mc-timing-sub">
            {inTrade
              ? `Only ${left}, so the candle is nearly done — but a scheduled driver delivers regardless of the clock. Hold for the draw through it.`
              : `Only ${left}, which would normally mean waiting. A scheduled driver is the one exception: it delivers the expansion regardless of the clock.`}
          </div>
        </div>
      </div>
    );
  }

  if (call.verdict === 'wait-for-next') {
    return (
      <div className="mc-timing wait">
        <Hourglass size={14} className="mc-timing-icon" />
        <div>
          <div className="mc-timing-head">
            {left} — {inTrade ? 'running out of runway' : 'wait for the next candle'}
          </div>
          <div className="mc-timing-sub">
            {inTrade
              ? 'Not much room left for this to deliver inside the candle. It either moves into the close or carries into the next one — that is a decision to make now, not at the close.'
              : 'Too little time to force an entry in here. Let it close, let the next candle form its own wick, and take the continuation off that.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mc-timing ok">
      <Clock size={14} className="mc-timing-icon" />
      <div>
        <div className="mc-timing-head">
          {left} — {inTrade ? 'room to deliver' : 'enough to position inside this candle'}
        </div>
        <div className="mc-timing-sub">
          {inTrade
            ? 'The candle has time to run. Nothing about the clock is asking you to touch this yet.'
            : 'Room for the setup to develop before the close.'}
          {call.driver && ` ${call.driver.label} lands in ${untilLabel(call.driver.minutesAway)}.`}
        </div>
      </div>
    </div>
  );
}

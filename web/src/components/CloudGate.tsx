import { useState, type FormEvent } from 'react';
import { Rocket } from 'lucide-react';

const PIN = '1955';
const SESSION_KEY = 'mc-cloud-pin-ok';

export function cloudPinOk(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return true; // private mode etc. — do not lock someone out over storage
  }
}

/**
 * Shown only in cloud mode (see useStore's cloudMode) — a deterrent against a
 * stumbled-upon link, not real security. The repo stays private; this just
 * keeps a bookmarked/cached URL from being an open book on its own.
 */
export function CloudGate({ onUnlocked }: { onUnlocked: () => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (value === PIN) {
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        /* private mode — unlock still proceeds for this render */
      }
      onUnlocked();
    } else {
      setError(true);
      setValue('');
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg, #05070c)',
      }}
    >
      <form
        onSubmit={submit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          width: 260,
        }}
      >
        <Rocket size={22} />
        <div style={{ fontSize: 13, color: 'var(--txt-faint)', textAlign: 'center' }}>
          Mission Control — cloud view
        </div>
        <input
          className="mc-input"
          type="password"
          inputMode="numeric"
          autoFocus
          placeholder="PIN"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          style={{ width: '100%', textAlign: 'center', letterSpacing: 4 }}
        />
        {error && (
          <div style={{ fontSize: 11.5, color: 'var(--loss)' }}>Wrong PIN</div>
        )}
        <button className="mc-btn primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>
          Enter
        </button>
      </form>
    </div>
  );
}

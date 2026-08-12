/* ============================================================
   Pre-flight check — the reference AND the way trades get logged.

   Two modes, one component, one source of truth:
     reference  you're about to enter and want the checklist
     log        you took it, and the same checklist becomes the record

   Logging is ticking, not typing. Every line comes from data/framework.ts,
   curated from the vault, and carries the note it came from. Nothing here is
   generated and nothing is invented.

   Trade 2+ still hard-requires a screenshot and a profile before it can save.
   That requirement is the fix for the actual leak — you stop logging after the
   first trade — so it survives the move into this flow.
   ============================================================ */

import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  BookOpenText,
  Check,
  Crosshair,
  ImagePlus,
  Layers,
  Loader2,
  Radio,
  ShieldCheck,
} from 'lucide-react';
import { Modal, ModalHead } from './kit';
import {
  ALIGNED_PAIRS,
  ALIGNED_PAIRS_NOTE,
  EXPANSION_ALIGNMENT,
  EXPANSION_ALIGNMENT_NOTE,
  GLOBAL_NO_TRADE,
  NO_GAP_FALLBACKS,
  SETUPS,
  SESSIONS,
  SMT_NOTES,
  SMT_SOURCE,
  TRADE_MANAGEMENT,
  chainLine,
  checksFor,
  frameworkSources,
  isComplete,
  outstanding,
  setupSpec,
} from '../data/framework';
import baseline from '../data/framework-hashes.json';
import { uploadImage } from '../utils/api';
import { pushToast } from '../store/useStore';
import type { CandleRole, SessionProfile, TradeKind } from '../types';

export type PreFlightResult = {
  sessionProfile: SessionProfile;
  candleRole: CandleRole;
  tradeKind: TradeKind;
  gatesPassed: string[];
  killedBy: string[];
  image?: string;
  note: string;
};

export function PreFlight({
  onClose,
  logging = false,
  sequence = 1,
  date,
  onLog,
}: {
  onClose: () => void;
  /** false = read-only reference, true = this is how the trade gets recorded */
  logging?: boolean;
  sequence?: number;
  date?: string;
  onLog?: (result: PreFlightResult) => void;
}) {
  const [picked, setPicked] = useState<SessionProfile | '1400' | ''>('');
  const [candleRole, setCandleRole] = useState<CandleRole | ''>('');
  const [ticked, setTicked] = useState<string[]>([]);
  const [killed, setKilled] = useState<string[]>([]);
  const [image, setImage] = useState('');
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stale, setStale] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // A hand-curated checklist that has silently drifted is worse than none.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/vault/hashes', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ paths: frameworkSources() }),
        });
        if (!res.ok) return;
        const { hashes } = (await res.json()) as { hashes: Record<string, string | null> };
        const drifted = Object.entries(hashes)
          .filter(([path, hash]) => {
            const known = (baseline.hashes as Record<string, string | null>)[path];
            return known !== undefined && hash !== known;
          })
          .map(([path]) => path.split('/').pop() || path);
        if (!cancelled) setStale(drifted);
      } catch {
        /* offline — the mapping still works, it just can't be checked */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const spec = SESSIONS.find((s) => s.id === picked);
  const setup = setupSpec(candleRole || undefined);
  // Reversal vs continuation is not a second question — it is what the candle
  // already tells you. C2 is the reversal; C3 and C4 are the continuation.
  const tradeKind: TradeKind | '' = candleRole === 'C2' ? 'reversal' : candleRole ? 'continuation' : '';
  // Everything downstream keys off BOTH — the checklist genuinely differs by
  // candle, not just by reversal-vs-continuation.
  const checks = checksFor(candleRole || undefined, picked || undefined);
  const left = outstanding(candleRole || undefined, ticked, picked || undefined);
  const matches = isComplete(candleRole || undefined, ticked, picked || undefined);
  const chain = chainLine(candleRole || undefined, picked || undefined);
  const needsPhoto = logging && sequence > 1;

  const missing: string[] = [];
  if (logging) {
    if (!picked || !spec?.tradable) missing.push('profile');
    if (!candleRole) missing.push('which candle');
    if (needsPhoto && !image) missing.push('screenshot');
  }

  /**
   * Functional update, not a read of the current array — two toggles inside one
   * React batch would otherwise both compute from the same stale value and the
   * second would silently discard the first.
   */
  function toggle(set: React.Dispatch<React.SetStateAction<string[]>>, id: string) {
    set((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  async function attach(file: File) {
    setUploading(true);
    try {
      setImage(await uploadImage(file));
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal onClose={onClose} width={580}>
      <ModalHead
        title={logging ? `Log trade ${sequence}` : 'Pre-flight check'}
        onClose={onClose}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {stale.length > 0 && (
          <Banner tone="loss">
            Framework source changed — this checklist may be out of date with {stale.join(', ')}.
            Regenerate it with <code>npm run framework:hashes</code>.
          </Banner>
        )}

        {needsPhoto && (
          <Banner tone="loss">
            You've already had your one trade today. This one still gets logged — but properly.
            Screenshot and profile are required.
          </Banner>
        )}

        {/* ---------- candle ---------- */}
        <div>
          <div className="mc-section-title" style={{ marginBottom: 9 }}>
            Which candle{logging ? ' did you trade' : ' are you watching'}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SESSIONS.map((s) => (
              <button
                key={s.id}
                className={`mc-tag-chip ${picked === s.id ? 'active' : ''}`}
                onClick={() => setPicked(s.id)}
              >
                {s.tradable ? null : <Ban size={10} />}
                {s.id.slice(0, 2)}:{s.id.slice(2)}
              </button>
            ))}
          </div>
        </div>

        {!spec ? (
          <div style={{ fontSize: 12.5, color: 'var(--txt-faint)', lineHeight: 1.65, padding: '10px 0' }}>
            Pick a candle and you'll get what has to be true before you take it, and what kills it.
          </div>
        ) : !spec.tradable ? (
          <div
            style={{
              display: 'flex',
              gap: 10,
              padding: '14px 16px',
              borderRadius: 14,
              background: 'rgba(var(--loss-rgb), 0.1)',
              border: '1px solid rgba(var(--loss-rgb), 0.28)',
            }}
          >
            <Ban size={16} style={{ flexShrink: 0, marginTop: 1, color: 'var(--loss)' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{spec.label}</div>
              <div style={{ fontSize: 12, color: 'var(--txt-dim)', lineHeight: 1.65 }}>{spec.expectThis}</div>
              <div style={{ fontSize: 11.5, color: 'var(--txt-dim)', lineHeight: 1.65, marginTop: 8 }}>
                {spec.expectMissed}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Two questions, answered before anything else: what should this
                candle do, and if I miss it what does the next one give me. */}
            <div className="glass-inset" style={{ padding: '14px 15px', borderRadius: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 11 }}>
                {spec.label} · {spec.name}
              </div>
              <div className="mc-expect">
                <span className="mc-expect-k">Expect</span>
                <span>{spec.expectThis}</span>
              </div>
              <div className="mc-expect">
                <span className="mc-expect-k">If you miss it</span>
                <span>{spec.expectMissed}</span>
              </div>
            </div>

            {/* ---------- reversal or continuation ---------- */}
            <div>
              <div className="mc-section-title" style={{ marginBottom: 9 }}>
                What am I taking
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {SETUPS.map((x) => (
                  <button
                    key={x.id}
                    className={`mc-tag-chip ${candleRole === x.id ? 'active' : ''}`}
                    onClick={() => setCandleRole(x.id)}
                  >
                    {x.label}
                  </button>
                ))}
              </div>
              {setup && (
                <div style={{ fontSize: 11.5, color: 'var(--txt-dim)', marginTop: 8, lineHeight: 1.6 }}>
                  {setup.what}
                </div>
              )}
            </div>

            {/* ---------- the checklist, and the verdict it produces ---------- */}
            {setup && (
              <div>
                <div className="mc-section-title" style={{ marginBottom: 6 }}>
                  <Check size={11} style={{ marginRight: 6, verticalAlign: -1, color: 'var(--win)' }} />
                  {spec.label} · {setup.label} · {checks.length} checks
                </div>
                {chain && (
                  <div style={{ fontSize: 11.5, color: 'var(--txt-dim)', marginBottom: 10, lineHeight: 1.6 }}>
                    {chain}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {checks.map((g, i) => (
                    <Tickable
                      key={g.id}
                      step={i + 1}
                      tf={g.tf}
                      label={g.label}
                      text={g.must}
                      optional={g.optional}
                      tone="win"
                      interactive
                      on={ticked.includes(g.id)}
                      onToggle={() => toggle(setTicked, g.id)}
                      note={g.sourceNote}
                    />
                  ))}
                </div>

                {/* the point of the screen */}
                <div className={`mc-match ${matches ? 'on' : ''}`}>
                  {matches ? (
                    <>
                      <ShieldCheck size={17} />
                      <div>
                        <div className="mc-match-head">This matches your framework.</div>
                        <div className="mc-match-sub">
                          Every check for a {setup.label.toLowerCase()} on {spec.label} is in. One
                          trade, your size.
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={17} />
                      <div>
                        <div className="mc-match-head">
                          {ticked.length === 0
                            ? `${checks.length} checks — click through them`
                            : `${left.length} still open — ${left
                                .slice(0, 3)
                                .map((g) => g.label)
                                .join(' · ')}${left.length > 3 ? ` · +${left.length - 3} more` : ''}`}
                        </div>
                        {/* Naming what to do instead only helps once you have
                            actually hit a wall — before that it is noise. */}
                        {ticked.length > 0 && <div className="mc-match-sub">{setup.ifItFails}</div>}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ---------- what kills it ---------- */}
            <div>
              <div className="mc-section-title" style={{ marginBottom: 10 }}>
                <Ban size={11} style={{ marginRight: 6, verticalAlign: -1, color: 'var(--loss)' }} />
                {logging ? 'What went wrong · tick any that applied' : 'What kills it'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[...checks, ...GLOBAL_NO_TRADE].map((g) => (
                  <Tickable
                    key={`k-${g.id}`}
                    text={g.kills}
                    tone="loss"
                    interactive={logging}
                    on={killed.includes(g.id)}
                    onToggle={() => toggle(setKilled, g.id)}
                    note={g.sourceNote}
                  />
                ))}
              </div>
            </div>

            {/* ---------- reference-only material ----------
                Everything below is background, not a record you fill in — SMT
                notes, both alignment tables, the no-gap fallbacks, trade
                management. It used to render in BOTH modes, which made the
                logging flow (you've already taken the trade) exactly as long
                as the reference flow (you're deciding whether to). By the time
                you're logging, the decision is made; this content belongs
                where you're still making it — reference mode, reached from
                "I'm in a trade" while you're about to act on it. */}
            {!logging && (
              <>
                {/* ---------- SMT, in three lines ---------- */}
                <div>
                  <div className="mc-section-title" style={{ marginBottom: 10 }}>
                    <Radio size={11} style={{ marginRight: 6, verticalAlign: -1 }} />
                    SMT
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {SMT_NOTES.map((n) => (
                      <Tickable key={n} text={n} tone="neutral" interactive={false} note={SMT_SOURCE} />
                    ))}
                  </div>
                </div>

                {/* ---------- aligned timeframes ---------- */}
                <div>
                  <div className="mc-section-title" style={{ marginBottom: 10 }}>
                    <Layers size={11} style={{ marginRight: 6, verticalAlign: -1 }} />
                    Which timeframe confirms which
                  </div>
                  <div className="mc-aligned">
                    <div className="mc-aligned-head">Level on</div>
                    <div className="mc-aligned-head" />
                    <div className="mc-aligned-head">Confirm on</div>
                    {ALIGNED_PAIRS.map((p) => (
                      <div key={p.pda} className={`mc-aligned-row ${p.pda === '4H' ? 'key' : ''}`} style={{ display: 'contents' }}>
                        <span className="mc-aligned-pda">{p.pda}</span>
                        <span className="mc-aligned-arrow">→</span>
                        <span className="mc-aligned-confirm">{p.confirm}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--txt-faint)', marginTop: 8, lineHeight: 1.55 }}>
                    {ALIGNED_PAIRS_NOTE}
                  </div>

                  {/* The second ladder. It looks like it disagrees with the table
                      above at the top row — Daily pairs to 1H there, to 4H here —
                      so the two are labelled by the QUESTION each answers rather
                      than shown as one merged table. The vault draws the same
                      distinction: that one aligns timeframes for swing
                      confirmation, this one aligns candles for expansion. */}
                  <div className="mc-section-title" style={{ margin: '16px 0 10px' }}>
                    <Layers size={11} style={{ marginRight: 6, verticalAlign: -1 }} />
                    Where the expansion candle's wick forms
                  </div>
                  <div className="mc-aligned">
                    <div className="mc-aligned-head">Expansion on</div>
                    <div className="mc-aligned-head" />
                    <div className="mc-aligned-head">Wick sits in a level on</div>
                    {EXPANSION_ALIGNMENT.map((p) => (
                      <div key={p.candle} className="mc-aligned-row" style={{ display: 'contents' }}>
                        <span className="mc-aligned-pda">{p.candle}</span>
                        <span className="mc-aligned-arrow">→</span>
                        <span className="mc-aligned-confirm">{p.level}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--txt-faint)', marginTop: 8, lineHeight: 1.55 }}>
                    {EXPANSION_ALIGNMENT_NOTE}
                  </div>
                </div>

                {/* ---------- no gap ---------- */}
                <div>
                  <div className="mc-section-title" style={{ marginBottom: 10 }}>
                    <Ban size={11} style={{ marginRight: 6, verticalAlign: -1 }} />
                    No gap anywhere — the only two exceptions
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {NO_GAP_FALLBACKS.map((f) => (
                      <div key={f.id} className="glass-inset" style={{ padding: '11px 13px', borderRadius: 12 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500 }}>{f.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--txt-dim)', marginTop: 5, lineHeight: 1.6 }}>
                          <strong style={{ color: 'var(--txt)' }}>When:</strong> {f.when}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--txt-dim)', marginTop: 4, lineHeight: 1.6 }}>
                          <strong style={{ color: 'var(--txt)' }}>How:</strong> {f.how}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--txt-faint)', marginTop: 5, lineHeight: 1.55 }}>
                          {f.caution}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--txt-faint)', marginTop: 8, lineHeight: 1.55 }}>
                    Outside these two, no gap means no trade.
                  </div>
                </div>

                {/* ---------- before you click ---------- */}
                <div>
                  <div className="mc-section-title" style={{ marginBottom: 10 }}>
                    <Crosshair size={11} style={{ marginRight: 6, verticalAlign: -1 }} />
                    Before you click
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {TRADE_MANAGEMENT.map((g) => (
                      <Tickable key={g.id} text={g.must} tone="neutral" interactive={false} note={g.sourceNote} />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ---------- screenshot ---------- */}
            {logging && (
              <div>
                <div className="mc-section-title" style={{ marginBottom: 9 }}>
                  Screenshot {needsPhoto ? '· required' : '· optional'}
                </div>
                {image ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img className="mc-walk-thumb" src={image} alt="" />
                    <button className="mc-btn ghost sm" onClick={() => setImage('')}>
                      Replace
                    </button>
                  </div>
                ) : (
                  <button
                    className="mc-dropzone"
                    style={{ padding: '22px 20px', width: '100%' }}
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    <span className="mc-dropzone-icon">
                      {uploading ? <Loader2 size={18} className="mc-spin" /> : <ImagePlus size={18} />}
                    </span>
                    {uploading ? 'Uploading…' : 'Add the chart'}
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void attach(f);
                    e.target.value = '';
                  }}
                />
              </div>
            )}

            {/* ---------- freeform fallback, deliberately secondary ---------- */}
            {logging &&
              (showNote ? (
                <div>
                  <div className="mc-section-title" style={{ marginBottom: 8 }}>
                    Anything the ticks didn't capture
                  </div>
                  <textarea
                    className="mc-input"
                    rows={3}
                    autoFocus
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              ) : (
                <button
                  className="mc-btn ghost sm"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => setShowNote(true)}
                >
                  Add a note
                </button>
              ))}
          </>
        )}

        {/* ---------- actions ---------- */}
        {logging ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="mc-btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              className="mc-btn primary"
              style={{ marginLeft: 'auto' }}
              disabled={missing.length > 0}
              onClick={() =>
                onLog?.({
                  sessionProfile: picked as SessionProfile,
                  candleRole: candleRole as CandleRole,
                  tradeKind: tradeKind as TradeKind,
                  gatesPassed: ticked,
                  killedBy: killed,
                  image: image || undefined,
                  note,
                })
              }
            >
              Log it
            </button>
          </div>
        ) : (
          <a
            className="mc-btn ghost sm"
            style={{ alignSelf: 'flex-start', textDecoration: 'none' }}
            href="#knowledge"
            onClick={onClose}
          >
            <BookOpenText size={12} /> Read the full framework
          </a>
        )}

        {logging && missing.length > 0 && (
          <div style={{ fontSize: 11, color: 'var(--txt-faint)', textAlign: 'right', marginTop: -10 }}>
            Still needed: {missing.join(' · ')}
          </div>
        )}

        {logging && date && (
          <div style={{ fontSize: 10.5, color: 'var(--txt-faint)' }}>
            {date} · recorded as trade {sequence} of the day.
          </div>
        )}
      </div>
    </Modal>
  );
}

function Banner({ children, tone }: { children: React.ReactNode; tone: 'loss' }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 9,
        padding: '10px 12px',
        borderRadius: 12,
        fontSize: 11.5,
        lineHeight: 1.55,
        background: `rgba(var(--${tone}-rgb), 0.1)`,
        border: `1px solid rgba(var(--${tone}-rgb), 0.28)`,
      }}
    >
      <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1, color: `var(--${tone})` }} />
      <span>{children}</span>
    </div>
  );
}

function Tickable({
  step,
  tf,
  label,
  text,
  optional,
  tone,
  interactive,
  on = false,
  onToggle,
  note,
}: {
  /** position in the walk — these are done in order, not picked over */
  step?: number;
  /** which chart you do this on */
  tf?: string;
  /** the short version — what you read first when you are scanning */
  label?: string;
  text: string;
  optional?: boolean;
  tone: 'win' | 'loss' | 'neutral';
  interactive: boolean;
  on?: boolean;
  onToggle?: () => void;
  note: string;
}) {
  const colour = tone === 'win' ? 'var(--win)' : tone === 'loss' ? 'var(--loss)' : 'var(--txt-faint)';
  const rgb = tone === 'win' ? 'var(--win-rgb)' : 'var(--loss-rgb)';

  const body = (
    <>
      {interactive ? (
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: 5,
            flexShrink: 0,
            marginTop: 1,
            display: 'grid',
            placeItems: 'center',
            border: `1px solid ${on ? `rgba(${rgb}, 0.5)` : 'var(--hairline)'}`,
            background: on ? `rgba(${rgb}, 0.16)` : 'transparent',
            color: colour,
          }}
        >
          {on && <Check size={10} />}
        </span>
      ) : (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: colour,
            flexShrink: 0,
            marginTop: 7,
          }}
        />
      )}
      <span style={{ textAlign: 'left', whiteSpace: 'normal' }}>
        {label && (
          <span style={{ display: 'block', color: 'var(--txt)', fontWeight: 500 }}>
            {step !== undefined && <span className="mc-step-n">{step}</span>}
            {tf && <span className="mc-tf">{tf}</span>}
            {label}
            {optional && <span className="mc-optional">optional</span>}
          </span>
        )}
        <span style={{ display: 'block', fontSize: label ? 11.5 : undefined, marginTop: label ? 2 : 0 }}>
          {text}
        </span>
      </span>
    </>
  );

  const style: React.CSSProperties = {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    fontSize: 12.5,
    lineHeight: 1.6,
    color: 'var(--txt-dim)',
  };

  if (!interactive) {
    return (
      <div style={style} title={note.split('/').pop()}>
        {body}
      </div>
    );
  }

  return (
    <button
      className="mc-kb-backlink-row"
      style={{ ...style, marginTop: 0, background: on ? 'var(--glass-strong)' : 'var(--glass)' }}
      onClick={onToggle}
      title={note.split('/').pop()}
    >
      {body}
    </button>
  );
}

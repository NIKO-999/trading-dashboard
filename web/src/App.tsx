import { useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  ArrowLeft,
  Home,
  BookMarked,
  BookOpen,
  CalendarDays,
  Check,
  CloudOff,
  Database,
  Download,
  Key,
  LayoutGrid,
  Library,
  List,
  Loader2,
  Plus,
  Rocket,
  Target,
  Trash2,
} from 'lucide-react';
import { AccountPanel } from './components/AccountPanel';
import { Ambient } from './components/Ambient';
import { CloudGate, cloudPinOk } from './components/CloudGate';
import { DevToggle } from './components/DevToggle'; // TEMPORARY — see store/devMode.ts
import { Toasts } from './components/Toasts';
import { Modal, ModalHead } from './components/kit';
import { DashboardPage } from './pages/DashboardPage';
import { DayViewPage } from './pages/DayViewPage';
import Journal from './pages/Journal';
import { TradesPage } from './pages/TradesPage';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { CompleteFramework } from './pages/CompleteFramework';
import { VoyagerLab } from './pages/VoyagerLab';
import { Checkpoint } from './components/Checkpoint';
import { LaunchTransition } from './components/LaunchTransition';
import { Moonshot } from './pages/Moonshot';
import { WardrobePage } from './pages/WardrobePage';
import { Journey } from './pages/Journey';
import { BacktestPage } from './pages/BacktestPage';
import {
  activeAccount,
  checkFor,
  clearAll,
  exportJson,
  pushToast,
  retrySync,
  useStore,
} from './store/useStore';
import { ApiError, settings as settingsApi, type SettingsStatus } from './utils/api';
import { gradedEntries } from './utils/analytics';
import { summarizeDiscipline } from './utils/discipline';
import { summarizeBacktest } from './utils/backtest';
import { collectUnlocks } from './utils/unlocks';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type Page =
  | 'dashboard'
  | 'dayview'
  | 'journal'
  | 'trades'
  | 'moonshot'
  | 'backtest'
  | 'wardrobe'
  | 'journey'
  | 'knowledge'
  | 'framework'
  /** preview surface for the avatar, reached at #voyager — remove once settled */
  | 'voyager';

type JournalIntent = { kind: 'new' } | { kind: 'focus'; id: string } | null;

// Wardrobe is deliberately absent from this rail — it's reachable only from
// the hub's own Mission Control drawer (hub/js/ui.js), never from inside
// the trading app's nav. Its Page id, hash route, and full-screen early
// return below all stay intact; only the rail icon is gone.
const NAV: { id: Page; label: string; icon: ComponentType<{ size?: number }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'dayview', label: 'Day View', icon: CalendarDays },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'trades', label: 'Trades', icon: List },
  { id: 'moonshot', label: 'Moonshot', icon: Rocket },
  { id: 'backtest', label: 'Backtesting Log', icon: Target },
];

const PAGE_META: Record<Page, { eyebrow: string; title: string }> = {
  dashboard: { eyebrow: 'Session overview', title: 'Dashboard' },
  dayview: { eyebrow: 'Day by day', title: 'Day View' },
  journal: { eyebrow: 'Calendar & entries', title: 'Journal' },
  trades: { eyebrow: 'Full ledger', title: 'Trades' },
  moonshot: { eyebrow: 'Process, not P&L', title: 'Moonshot' },
  backtest: { eyebrow: 'Reps, not results', title: 'Backtesting Log' },
  wardrobe: { eyebrow: 'Pick who you fly as', title: 'Character selection' },
  journey: { eyebrow: 'Earth to the Moon', title: 'Trajectory' },
  voyager: { eyebrow: 'Model preview', title: 'Voyager' },
  knowledge: { eyebrow: 'Your vault', title: 'Knowledge Base' },
  framework: { eyebrow: 'Reference, not the journal', title: 'Complete Framework' },
};

/** which pages belong to the Trading section — new sections add their own set */
const TRADING_PAGES = new Set<Page>(NAV.map((n) => n.id));

function withinTimeframe(entries: ReturnType<typeof gradedEntries>, days: number | null) {
  if (days == null) return entries;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return entries.filter((e) => e.date >= cutoffStr);
}

export default function App() {
  const data = useStore();
  const [pinUnlocked, setPinUnlocked] = useState(() => cloudPinOk());
  const [page, setPage] = useState<Page>(() => {
    const hash = window.location.hash;
    if (hash === '#knowledge') return 'knowledge';
    if (hash === '#voyager') return 'voyager';
    // Deep-linked from the gateway card, so the hub can hand you straight to
    // the discipline module rather than via the Dashboard.
    if (hash === '#moonshot') return 'moonshot';
    if (hash === '#wardrobe') return 'wardrobe';
    if (hash === '#journey') return 'journey';
    return 'dashboard';
  });
  const [timeframeDays, setTimeframeDays] = useState<number | null>(null);
  const [journalIntent, setJournalIntent] = useState<JournalIntent>(null);
  const [dataModal, setDataModal] = useState(false);
  const [checkpointOpen, setCheckpointOpen] = useState(false);
  const [launching, setLaunching] = useState(false);
  const account = activeAccount();
  const today = todayStr();

  /* Announce anything earned since this device last looked. */
  useEffect(() => {
    if (data.loading || !account) return;
    const summary = summarizeDiscipline(
      account,
      data.discipline.adjustments,
      data.entries,
      data.discipline.checks,
      today,
      summarizeBacktest(data.discipline.backtests ?? [], today).xp,
    );
    for (const message of collectUnlocks({
      level: summary.level,
      cleanDays: summary.cleanDays,
      longestAttendanceStreak: summary.longestAttendanceStreak,
      longestCleanStreak: summary.longestCleanStreak,
      longestCalmStreak: summary.longestCalmStreak,
      longestSteadyStreak: summary.longestSteadyStreak,
    })) {
      pushToast(message);
    }
  }, [data.loading, data.discipline, data.entries, account, today]);

  /**
   * Tapping Voyager launches into the journey. The transition is a beat, not a
   * toll — anyone who has asked not to see motion goes straight there.
   */
  function enterJourney() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPage('journey');
      return;
    }
    setLaunching(true);
  }

  function navigate(next: Page) {
    setPage(next);
    // Only the pages the gateway can link to keep a hash — the rest are
    // internal navigation and a stale hash would survive a reload wrongly.
    const LINKABLE = new Set<Page>(['knowledge', 'voyager', 'moonshot', 'journey']);
    window.location.hash = LINKABLE.has(next) ? next : '';
  }

  const allGraded = useMemo(
    () => gradedEntries(data.entries, false),
    [data.entries],
  );
  const entries = useMemo(() => withinTimeframe(allGraded, timeframeDays), [allGraded, timeframeDays]);

  function openJournal() {
    navigate('journal');
  }

  function openTrade(id: string) {
    setPage('journal');
    setJournalIntent({ kind: 'focus', id });
  }

  function logTrade() {
    if (data.cloudMode) {
      pushToast('Read-only cloud view — log trades on your Mac');
      return;
    }
    setPage('journal');
    setJournalIntent({ kind: 'new' });
  }

  const meta = PAGE_META[page];
  const inTrading = TRADING_PAGES.has(page); // sections are self-contained — no cross-section chrome

  if (data.cloudMode && !pinUnlocked) {
    return <CloudGate onUnlocked={() => setPinUnlocked(true)} />;
  }

  // Wardrobe is a full-screen view, not another page inside the rail/topbar
  // shell — no nav chrome at all, just the page and a way back to the hub.
  if (page === 'wardrobe') {
    return <WardrobePage />;
  }

  return (
    <>
      <Ambient />
      <div
        className="mc-stage"
        style={{
          position: 'relative',
          zIndex: 2,
          height: '100vh',
          padding: '22px 26px',
          display: 'grid',
          gridTemplateColumns: '64px 1fr',
          gap: 20,
        }}
      >
        {/* ---------- icon rail (desktop only — mobile navigates via the panel) ---------- */}
        <nav className="mc-rail">
          {!data.cloudMode && (
            <>
              <a
                className="mc-rail-btn"
                title="Back to Hub"
                href="../index.html"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'inherit' }}
              >
                <Home size={18} />
              </a>
              <div style={{ height: 1, width: 26, background: 'var(--hairline-soft)', margin: '2px 0' }} />
            </>
          )}
          {NAV.map((item) => (
            <button
              key={item.id}
              className={`mc-rail-btn ${page === item.id ? 'active' : ''}`}
              title={item.label}
              onClick={() => navigate(item.id)}
            >
              <item.icon size={18} />
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <div className="mc-rail-divider-wide" style={{ height: 1, width: 26, background: 'var(--hairline-soft)', margin: '2px 0' }} />
          {/* other sections — trading stays grouped above; each new section adds one button here */}
          <button
            className={`mc-rail-btn ${page === 'knowledge' ? 'active' : ''}`}
            title="Knowledge Base"
            onClick={() => navigate('knowledge')}
          >
            <Library size={18} />
          </button>
          <button
            className={`mc-rail-btn ${page === 'framework' ? 'active' : ''}`}
            title="Complete Framework"
            onClick={() => navigate('framework')}
          >
            <BookMarked size={18} />
          </button>
          <div style={{ flex: 1 }} />
          <div className="mc-rail-label">Mission Control</div>
          <button className="mc-rail-btn" title="Data & backups" onClick={() => setDataModal(true)}>
            <Database size={18} />
          </button>
        </nav>

        {/* ---------- main ---------- */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0, minHeight: 0 }}>
          <div className="mc-topbar" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '4px 6px 0', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {page !== 'dashboard' && inTrading && (
                <button
                  className="mc-icon-btn"
                  style={{ width: 38, height: 38, borderRadius: 13, background: 'var(--glass-strong)', border: '1px solid var(--hairline-soft)' }}
                  title="Back to Dashboard"
                  onClick={() => navigate('dashboard')}
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <div>
                <div className="mc-eyebrow">
                  <span className="mc-live-dot" />
                  {meta.eyebrow}
                </div>
                <h1 className="mc-h1" style={{ margin: '6px 0 0' }}>
                  {meta.title}
                </h1>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              {data.cloudMode && (
                <div className="mc-offline" title={`Synced ${data.cloudSyncedAt ? new Date(data.cloudSyncedAt).toLocaleString() : 'unknown'} — read-only, log trades on your Mac`}>
                  <CloudOff size={11} /> Cloud view
                </div>
              )}
              {!data.cloudMode && data.offline && (
                <button className="mc-offline" onClick={retrySync} title={`${data.offline} — tap to retry`}>
                  <CloudOff size={11} /> Offline
                </button>
              )}
              {inTrading && (
                <button className="mc-btn primary" onClick={logTrade}>
                  <Plus size={14} />
                  Log Trade
                </button>
              )}
              <div className="mc-topbar-clock">
                <Clock />
              </div>
            </div>
          </div>

          <div className="mc-main-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4, paddingBottom: 10, display: 'flex', flexDirection: 'column' }}>
            {page === 'dashboard' && (
              <DashboardPage
                entries={entries}
                allGradedCount={allGraded.length}
                timeframeDays={timeframeDays}
                onTimeframeChange={setTimeframeDays}
                onOpenJournal={openJournal}
                onOpenTrade={openTrade}
              />
            )}
            {page === 'moonshot' && (
              <Moonshot
                onOpenTrade={openTrade}
                onCheckIn={() => setCheckpointOpen(true)}
                onEnterJourney={enterJourney}
              />
            )}
            {page === 'journey' && (
              <Journey onBack={() => navigate('moonshot')} onCheckIn={() => setCheckpointOpen(true)} />
            )}
            {page === 'backtest' && <BacktestPage />}
            {page === 'dayview' && <DayViewPage entries={entries} onOpenTrade={openTrade} />}
            {page === 'journal' && <Journal focusId={journalIntent?.kind === 'focus' ? journalIntent.id : null} onFocusConsumed={() => setJournalIntent(null)} newEntryRequested={journalIntent?.kind === 'new'} onNewEntryConsumed={() => setJournalIntent(null)} />}
            {page === 'trades' && <TradesPage entries={entries} onOpenTrade={openTrade} />}
            {page === 'knowledge' && <KnowledgeBase />}
            {page === 'framework' && <CompleteFramework />}
            {page === 'voyager' && <VoyagerLab />}
          </div>
        </main>
      </div>

      {launching && (
        <LaunchTransition
          onDone={() => {
            setLaunching(false);
            setPage('journey');
          }}
        />
      )}
      {dataModal && <DataModal onClose={() => setDataModal(false)} />}
      {checkpointOpen && account && (
        <Checkpoint
          date={today}
          accountId={account.id}
          existing={checkFor(today, account.id)}
          onClose={() => setCheckpointOpen(false)}
        />
      )}
      <Toasts />
      <DevToggle /> {/* TEMPORARY — remove alongside store/devMode.ts and DevToggle.tsx */}
    </>
  );
}

/* ---------- live session clock ---------- */

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    <div style={{ textAlign: 'right' }}>
      <div className="mc-num-thin" style={{ fontSize: 22, letterSpacing: 1 }}>
        {p(now.getHours())}:{p(now.getMinutes())}:{p(now.getSeconds())}
      </div>
      <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--txt-faint)', marginTop: 3 }}>
        {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
      </div>
    </div>
  );
}

/* ---------- data & backups ---------- */

function DataModal({ onClose }: { onClose: () => void }) {
  const data = useStore();
  const [confirmWipe, setConfirmWipe] = useState(false);

  function doExport() {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mission-control-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast('Backup downloaded');
  }

  return (
    <Modal onClose={onClose} width={520}>
      <ModalHead title="Account & data" onClose={onClose} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AccountPanel />

        <div style={{ borderTop: '1px solid var(--hairline-soft)', margin: '6px 0' }} />

        <ApiKeySettings />

        <div style={{ borderTop: '1px solid var(--hairline-soft)', margin: '6px 0' }} />

        <div className="mc-section-title" style={{ marginBottom: 2 }}>
          Data &amp; backups
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--txt-faint)', lineHeight: 1.65 }}>
          {data.entries.length} entries, stored on your Mac in <code>data/trades.json</code> and shared with every
          device. The server keeps rolling backups automatically — this export is for keeping a copy somewhere else.
        </div>
        <button className="mc-btn" onClick={doExport}>
          <Download size={13} /> Export backup (.json)
        </button>
        <div style={{ borderTop: '1px solid var(--hairline-soft)', margin: '6px 0' }} />
        {!confirmWipe ? (
          <button className="mc-btn danger" onClick={() => setConfirmWipe(true)}>
            <Trash2 size={13} /> Clear all data…
          </button>
        ) : (
          <button
            className="mc-btn danger"
            onClick={() => {
              clearAll();
              pushToast('All data cleared');
              onClose();
            }}
          >
            <Trash2 size={13} /> Really erase everything — no undo
          </button>
        )}
      </div>
    </Modal>
  );
}

/**
 * The one credential this app ever asks for. Deliberately paste-in-and-save
 * rather than a full form: the server never hands the real key back out (see
 * server/settings.mjs), so this component tracks only whether one is set and
 * a masked preview — never the live value, not even in its own state, once
 * it has been saved.
 */
function ApiKeySettings() {
  const [status, setStatus] = useState<SettingsStatus | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    settingsApi
      .get()
      .then((s) => {
        if (!cancelled) setStatus(s);
      })
      .catch(() => {
        /* offline — the rest of the modal still works without this */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    if (!draft.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const s = await settingsApi.saveKey(draft.trim());
      setStatus(s);
      setDraft('');
      pushToast('API key saved');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the key');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    try {
      const s = await settingsApi.saveKey(null);
      setStatus(s);
      pushToast('API key removed');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not remove the key');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mc-section-title" style={{ marginBottom: 2 }}>
        AI diagnosis
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--txt-faint)', lineHeight: 1.65, marginBottom: 10 }}>
        Powers "Diagnose this" on a trade — compares your own note against every setup's checklist.
        On-demand only, never automatic, and this is the only thing in the app that ever calls
        out to the internet. The key lives on your Mac and is never sent back to any device that
        asks for it — only a masked preview is.
      </div>

      {status?.anthropicKeySet && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: 'var(--win)',
            marginBottom: 10,
          }}
        >
          <Check size={13} /> Key saved · {status.anthropicKeyPreview}
          <button
            className="mc-btn ghost sm"
            style={{ marginLeft: 'auto' }}
            disabled={saving}
            onClick={remove}
          >
            Remove
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="mc-input"
          type="password"
          placeholder={status?.anthropicKeySet ? 'Replace with a new key…' : 'sk-ant-…'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          style={{ flex: 1 }}
        />
        <button className="mc-btn" disabled={saving || !draft.trim()} onClick={save}>
          {saving ? <Loader2 size={13} className="mc-spin" /> : <Key size={13} />}
          Save
        </button>
      </div>
      {error && (
        <div style={{ fontSize: 11, color: 'var(--loss)', marginTop: 6 }}>{error}</div>
      )}
    </div>
  );
}

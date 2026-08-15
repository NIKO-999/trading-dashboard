/* ============================================================
   Trade store — server is the source of truth, localStorage is a mirror.

   Boot reads from the API. If the Mac is asleep the mirror renders instead
   and the app flags itself offline. Edits made while offline stay queued in
   the mirror and flush on the next successful write, so logging a trade on
   the phone never silently disappears.
   ============================================================ */

import { useSyncExternalStore } from 'react';
import type {
  Account,
  BacktestSession,
  BalanceAdjustment,
  DayCheck,
  DisciplineData,
  Entry,
  LivePosition,
  StoreState,
} from '../types';
import { ApiError, api } from '../utils/api';
import { loadCloudSnapshot } from '../utils/cloudSnapshot';
import { nextSequence, tradesOnDay } from '../utils/discipline';

const MIRROR_KEY = 'mc-trades-mirror';
const DIRTY_KEY = 'mc-trades-dirty';
const DISC_MIRROR_KEY = 'mc-discipline-mirror';
const DISC_DIRTY_KEY = 'mc-discipline-dirty';
const SAVE_DEBOUNCE = 600;

const EMPTY_DISCIPLINE: DisciplineData = {
  version: 1,
  accounts: [],
  activeAccountId: null,
  adjustments: [],
  checks: [],
  equippedOutfit: 'standard',
  equippedCompanion: null,
  live: null,
  backtests: [],
};

let state: StoreState = {
  entries: [],
  loading: true,
  offline: null,
  pendingWrites: 0,
  discipline: EMPTY_DISCIPLINE,
  cloudMode: false,
  cloudSyncedAt: null,
};

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function set(patch: Partial<StoreState>) {
  state = { ...state, ...patch };
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Every mutator checks this first. The cloud deploy has no server to write
 * to — silently accepting an edit into the in-memory mirror would let it
 * vanish on next load with nothing telling you it never actually saved.
 */
function blockedInCloudMode(): boolean {
  if (!state.cloudMode) return false;
  pushToast('Read-only cloud view — log trades on your Mac');
  return true;
}

export function useStore(): StoreState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

/* ---------- mirror ---------- */

function readMirror(): Entry[] | null {
  try {
    const raw = localStorage.getItem(MIRROR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.entries) ? parsed.entries : null;
  } catch {
    return null;
  }
}

function writeMirror(entries: Entry[], dirty: boolean) {
  try {
    localStorage.setItem(MIRROR_KEY, JSON.stringify({ entries }));
    if (dirty) localStorage.setItem(DIRTY_KEY, '1');
    else localStorage.removeItem(DIRTY_KEY);
  } catch {
    /* private mode / quota — the server still has the data */
  }
}

function mirrorIsDirty() {
  try {
    return localStorage.getItem(DIRTY_KEY) === '1';
  } catch {
    return false;
  }
}

/* ---------- load ---------- */

/**
 * True liveness check. The service worker deliberately does not cache
 * /api/health, so a cached /api/trades cannot make a sleeping Mac look awake.
 */
async function pingServer(): Promise<boolean> {
  try {
    await api.get('/api/health');
    return true;
  } catch {
    return false;
  }
}

export async function load() {
  const mirrored = readMirror();
  if (mirrored) set({ entries: mirrored });

  const discMirror = readDisciplineMirror();
  if (discMirror) set({ discipline: discMirror });

  const alive = await pingServer();
  if (!alive) {
    // Still attempt the read: the service worker may hold a cached copy that is
    // better than an empty mirror (e.g. first load on a second device).
    let filled = false;
    try {
      const cached = await api.get<{ entries: Entry[] }>('/api/trades');
      if (!mirrored) {
        set({ entries: cached.entries });
        filled = true;
      }
    } catch {
      /* nothing cached either */
    }
    // A device that has never talked to the Mac (no mirror at all) and can't
    // reach any API — e.g. the Vercel deploy, which has no server — falls back
    // to the static snapshot committed by `npm run sync:cloud`.
    if (!mirrored && !discMirror && !filled) {
      const snap = await loadCloudSnapshot();
      if (snap) {
        set({
          entries: snap.trades.entries,
          discipline: { ...EMPTY_DISCIPLINE, ...snap.discipline },
          loading: false,
          offline: null,
          cloudMode: true,
          cloudSyncedAt: snap.syncedAt,
        });
        return;
      }
    }
    set({ loading: false, offline: 'Server unreachable' });
    return;
  }

  try {
    const remote = await api.get<{ entries: Entry[] }>('/api/trades');
    if (mirrorIsDirty()) {
      // Offline edits are newer than whatever the server last saw — push them up.
      set({ loading: false, offline: null });
      void save();
      return;
    }
    set({ entries: remote.entries, loading: false, offline: null });
    writeMirror(remote.entries, false);
    await loadDiscipline();
    migrate();
  } catch (err) {
    const message = err instanceof ApiError && err.status === 0 ? 'Server unreachable' : 'Could not load trades';
    set({ loading: false, offline: message });
    if (!mirrored) pushToast(`${message} — showing nothing until it is back`);
  }
}

/* ============================================================
   Discipline slice — accounts, balance ledger, daily check-ins.
   Same offline contract as trades: mirror, queue, flush on reconnect.
   ============================================================ */

function readDisciplineMirror(): DisciplineData | null {
  try {
    const raw = localStorage.getItem(DISC_MIRROR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.accounts) ? { ...EMPTY_DISCIPLINE, ...parsed } : null;
  } catch {
    return null;
  }
}

function writeDisciplineMirror(data: DisciplineData, dirty: boolean) {
  try {
    localStorage.setItem(DISC_MIRROR_KEY, JSON.stringify(data));
    if (dirty) localStorage.setItem(DISC_DIRTY_KEY, '1');
    else localStorage.removeItem(DISC_DIRTY_KEY);
  } catch {
    /* quota — the server still has it */
  }
}

function disciplineIsDirty() {
  try {
    return localStorage.getItem(DISC_DIRTY_KEY) === '1';
  } catch {
    return false;
  }
}

async function loadDiscipline() {
  try {
    const remote = await api.get<DisciplineData>('/api/discipline');
    if (disciplineIsDirty()) {
      void saveDiscipline();
      return;
    }
    set({ discipline: { ...EMPTY_DISCIPLINE, ...remote } });
    writeDisciplineMirror({ ...EMPTY_DISCIPLINE, ...remote }, false);
  } catch {
    /* the offline flag is already driven by the trades load */
  }
}

let discTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleDisciplineSave() {
  writeDisciplineMirror(state.discipline, true);
  if (discTimer) clearTimeout(discTimer);
  discTimer = setTimeout(() => void saveDiscipline(), SAVE_DEBOUNCE);
}

async function saveDiscipline() {
  if (discTimer) {
    clearTimeout(discTimer);
    discTimer = null;
  }
  const snapshot = state.discipline;
  set({ pendingWrites: state.pendingWrites + 1 });
  try {
    await api.put('/api/discipline', snapshot);
    writeDisciplineMirror(snapshot, false);
    set({ offline: null });
  } catch {
    set({ offline: 'Not saved — server unreachable' });
  } finally {
    set({ pendingWrites: Math.max(0, state.pendingWrites - 1) });
  }
}

function patchDiscipline(patch: Partial<DisciplineData>) {
  if (blockedInCloudMode()) return;
  set({ discipline: { ...state.discipline, ...patch } });
  scheduleDisciplineSave();
}

/**
 * First run and back-fill.
 *
 * Creates a default live account if there is none, and stamps any trade logged
 * before this module existed with that account so nothing orphans — an entry
 * with no accountId would otherwise vanish from every per-account calculation.
 */
function migrate() {
  const { accounts, activeAccountId } = state.discipline;

  let account = accounts.find((a) => a.id === activeAccountId) ?? accounts[0];
  if (!account) {
    account = {
      id: `acc_${Date.now().toString(36)}`,
      name: 'Live',
      type: 'live',
      startingBalance: 0,
      riskPercent: 10,
      createdAt: new Date().toISOString(),
    };
    patchDiscipline({ accounts: [account], activeAccountId: account.id });
  } else if (!activeAccountId) {
    patchDiscipline({ activeAccountId: account.id });
  }

  const orphans = state.entries.filter((e) => !e.accountId);
  if (orphans.length) {
    set({
      entries: state.entries.map((e) => (e.accountId ? e : { ...e, accountId: account!.id })),
    });
    scheduleSave();
  }
}

export function activeAccount(): Account | null {
  const { accounts, activeAccountId } = state.discipline;
  return accounts.find((a) => a.id === activeAccountId) ?? accounts[0] ?? null;
}

export function upsertAccount(account: Account) {
  const exists = state.discipline.accounts.some((a) => a.id === account.id);
  patchDiscipline({
    accounts: exists
      ? state.discipline.accounts.map((a) => (a.id === account.id ? account : a))
      : [...state.discipline.accounts, account],
    activeAccountId: state.discipline.activeAccountId ?? account.id,
  });
}

export function setActiveAccount(id: string) {
  patchDiscipline({ activeAccountId: id });
}

export function addAdjustment(adj: Omit<BalanceAdjustment, 'id'>) {
  patchDiscipline({
    adjustments: [...state.discipline.adjustments, { ...adj, id: newId() }],
  });
}

export function removeAdjustment(id: string) {
  patchDiscipline({ adjustments: state.discipline.adjustments.filter((a) => a.id !== id) });
}

/** One check per day per account — saving again replaces that day's answers. */
export function upsertCheck(check: DayCheck) {
  const others = state.discipline.checks.filter(
    (c) => !(c.date === check.date && c.accountId === check.accountId),
  );
  patchDiscipline({
    checks: [...others, { ...check, updatedAt: new Date().toISOString() }],
  });
}

export function checkFor(date: string, accountId: string): DayCheck | undefined {
  return state.discipline.checks.find((c) => c.date === date && c.accountId === accountId);
}

/* ---------- back-testing ---------- */

/**
 * Back-testing reps. Stored here to reuse the offline-sync machinery, but
 * deliberately account-agnostic and never read by the discipline engine —
 * reps are practice, not evidence of holding a rule with money on it.
 */
export function addBacktest(partial: Partial<BacktestSession> = {}): BacktestSession {
  const created: BacktestSession = {
    id: newId(),
    date: partial.date ?? new Date().toISOString().slice(0, 10),
    setups: partial.setups ?? 1,
    createdAt: new Date().toISOString(),
    ...partial,
  };
  patchDiscipline({ backtests: [...(state.discipline.backtests ?? []), created] });
  return created;
}

export function updateBacktest(id: string, patch: Partial<BacktestSession>) {
  patchDiscipline({
    backtests: (state.discipline.backtests ?? []).map((b) =>
      b.id === id ? { ...b, ...patch, updatedAt: new Date().toISOString() } : b,
    ),
  });
}

export function removeBacktest(id: string) {
  patchDiscipline({ backtests: (state.discipline.backtests ?? []).filter((b) => b.id !== id) });
}

/**
 * Wear an outfit. Single-select — you wear one look at a time, so there is
 * nothing to unequip on the way to equipping another.
 */
export function equipOutfit(id: string) {
  patchDiscipline({ equippedOutfit: id });
}

/**
 * Choose who stands beside Voyager. Single-select, and unlike an outfit it can
 * be cleared entirely — a companion is optional company, not a default look.
 */
export function equipCompanion(id: string | null) {
  patchDiscipline({ equippedCompanion: id });
}

/* ---------- the trade you are in right now ---------- */

/** The open position, if it belongs to the active account. */
export function livePosition(): LivePosition | null {
  const live = state.discipline.live;
  if (!live) return null;
  const account = activeAccount();
  return account && live.accountId === account.id ? live : null;
}

export function openPosition(partial: Omit<LivePosition, 'accountId' | 'openedAt'>) {
  const account = activeAccount();
  if (!account) return;
  patchDiscipline({
    live: { ...partial, accountId: account.id, openedAt: new Date().toISOString() },
  });
}

export function closePosition() {
  patchDiscipline({ live: null });
}

/**
 * Correct a live position without losing its clock. Opening again would reset
 * `openedAt` to now, throwing away the real elapsed time over a fat-fingered
 * candle pick.
 */
export function updatePosition(patch: Partial<Omit<LivePosition, 'accountId' | 'openedAt'>>) {
  const live = livePosition();
  if (!live) return;
  patchDiscipline({ live: { ...live, ...patch } });
}

/**
 * Trades that count against today's one-trade rule.
 *
 * The open one counts. That is the entire point: the second trade has to be
 * visibly a second trade BEFORE you take it, not after you log it — and the
 * days you stop logging are exactly the days this number would have mattered.
 */
export function tradesUsedToday(date: string): { logged: number; live: boolean; used: number } {
  const account = activeAccount();
  if (!account) return { logged: 0, live: false, used: 0 };
  const logged = tradesOnDay(state.entries, date, account.id).length;
  const live = livePosition()?.date === date;
  return { logged, live, used: logged + (live ? 1 : 0) };
}

/* ---------- save ---------- */

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave() {
  writeMirror(state.entries, true);
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void save(), SAVE_DEBOUNCE);
}

async function save() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  const snapshot = state.entries;
  set({ pendingWrites: state.pendingWrites + 1 });
  try {
    await api.put('/api/trades', { entries: snapshot });
    writeMirror(snapshot, false);
    set({ offline: null });
  } catch {
    set({ offline: 'Not saved — server unreachable' });
  } finally {
    set({ pendingWrites: Math.max(0, state.pendingWrites - 1) });
  }
}

/** Retry a queued write — called when the tab regains focus or the network returns. */
export function retrySync() {
  const dirty = mirrorIsDirty();
  const discDirty = disciplineIsDirty();
  if (dirty) void save();
  if (discDirty) void saveDiscipline();
  if (!dirty && !discDirty) void load();
}

/* ---------- mutations ---------- */

function newId() {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function addEntry(partial: Partial<Entry> = {}): Entry {
  if (blockedInCloudMode()) {
    // A harmless, never-persisted stand-in — callers immediately read `.id`
    // to navigate to the new entry, and there is nothing sensible to show.
    return { id: newId(), date: partial.date ?? '', outcome: null, tags: [], walkthrough: [], ...partial };
  }
  const now = new Date();
  const date = partial.date || now.toISOString().slice(0, 10);
  const accountId = partial.accountId ?? activeAccount()?.id;

  const entry: Entry = {
    id: newId(),
    date,
    outcome: null,
    tags: [],
    walkthrough: [],
    createdAt: now.toISOString(),
    accountId,
    // Position in the day. 1 is your allowed trade; 2+ went through the gate,
    // and stamping it here means the ledger records that fact permanently.
    sequence: nextSequence(state.entries, date, accountId ?? null),
    ...partial,
  };
  set({ entries: [entry, ...state.entries] });
  scheduleSave();
  return entry;
}

export function updateEntry(id: string, patch: Partial<Entry>) {
  if (blockedInCloudMode()) return;
  set({
    entries: state.entries.map((e) =>
      e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e,
    ),
  });
  scheduleSave();
}

export function removeEntry(id: string) {
  if (blockedInCloudMode()) return;
  set({ entries: state.entries.filter((e) => e.id !== id) });
  scheduleSave();
}

export function clearAll() {
  if (blockedInCloudMode()) return;
  set({ entries: [] });
  scheduleSave();
}

export function exportJson(): string {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), entries: state.entries }, null, 2);
}

/* ---------- toasts ---------- */

export type Toast = { id: string; message: string };

let toasts: Toast[] = [];
const toastListeners = new Set<() => void>();

export function pushToast(message: string) {
  const toast = { id: newId(), message };
  toasts = [...toasts, toast];
  for (const l of toastListeners) l();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== toast.id);
    for (const l of toastListeners) l();
  }, 3200);
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    (listener) => {
      toastListeners.add(listener);
      return () => toastListeners.delete(listener);
    },
    () => toasts,
    () => toasts,
  );
}

/* ---------- boot ---------- */

void load();
window.addEventListener('online', retrySync);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && state.offline) retrySync();
});

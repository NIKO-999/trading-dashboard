/**
 * `missed` is a setup you watched play out but never got into — no position,
 * no money at risk. It is recorded because the read is worth keeping, but it
 * is deliberately inert: see `isMissed` in utils/discipline.ts for the full
 * list of things it must never touch.
 *
 * `data` is the older, broader version of the same idea and is kept only so
 * entries saved before `missed` existed still resolve.
 */
export type Outcome = 'win' | 'loss' | 'be' | 'missed' | 'data' | null;
export type Direction = 'long' | 'short';

/** The five tradable 4H candles. 14:00 is excluded from the framework entirely. */
export type SessionProfile = '1800' | '2200' | '0200' | '0600' | '1000';
export type TradeKind = 'reversal' | 'continuation';
/**
 * Which candle in the triplet the trade was taken on. C2 and C3 have genuinely
 * different requirements — two stages of SMT vs one, time-left vs a gap — so
 * "which candle was I on" has to be recorded alongside the gates, or a ticked
 * gate list says nothing about whether the right bar was cleared.
 */
export type CandleRole = 'C2' | 'C3' | 'C4';

export type WalkStep = {
  id: string;
  image?: string;
  note: string;
  time?: string;
};

export type Entry = {
  id: string;
  date: string; // YYYY-MM-DD — compared as a string throughout
  time?: string;
  pair?: string;
  direction?: Direction;
  /** dollars put at risk — what you type */
  risk?: number;
  /** dollars made or lost, negative for a loss — what you type */
  result?: number;
  /** derived from result / risk unless explicitly overridden */
  rMultiple?: number;
  /** derived from result unless explicitly overridden */
  outcome: Outcome;
  starred?: boolean;
  tags: string[];
  notes?: string;
  walkthrough: WalkStep[];
  createdAt?: string;
  updatedAt?: string;

  /* ---------- discipline module ---------- */

  /** which account this trade belongs to — assigned on migration for old entries */
  accountId?: string;
  /** was in profit and gave it back */
  gaveBack?: boolean;
  /** moved the stop to break even — a named violation of your own rule */
  movedToBE?: boolean;
  sessionProfile?: SessionProfile;
  candleRole?: CandleRole;
  tradeKind?: TradeKind;
  /** framework gate ids confirmed when logging — ticked, not typed */
  gatesPassed?: string[];
  /** invalidation conditions that applied anyway */
  killedBy?: string[];
  /** optional per-trade emotion flags, separate from the daily checkpoint */
  emotions?: string[];
  /**
   * Why a trade didn't play out even though the entry itself was valid —
   * outcome, not rule-adherence. Deliberately never read by the discipline
   * engine: ticking one of these explains a loss, it never flags the day as
   * having broken a rule the way `killedBy` does.
   */
  outcomeTags?: string[];
  /**
   * The 9:30 NY open played into this trade — the same driver TimingCall
   * surfaces live on the dashboard (see DRIVERS in utils/session.ts), noted on
   * the record after the fact. A marker, not a profile: 9:30 isn't a 4H candle
   * with its own checklist, it's a scheduled event that can override the clock
   * on whichever candle you actually traded. Purely informational, like
   * `outcomeTags` — never read by the discipline engine, never a gate.
   */
  nyOpenDriver?: boolean;
  /** 1 = first trade of that day; 2+ went through the hard gate */
  sequence?: number;
  /**
   * When you declared the write-up finished — set by the "Complete log" button,
   * never inferred. The content criteria alone used to be enough, which meant
   * the fully-logged XP crept in silently the moment a screenshot and a second
   * sentence happened to exist. There was no moment where it landed, and no way
   * to tell a finished write-up from one you were halfway through.
   * Editing afterwards does NOT clear this — a typo fix is not a retraction.
   */
  completedAt?: string;
};

/** An entry with its derived fields resolved — what every page consumes. */
export type GradedEntry = Entry & {
  grade: Exclude<Outcome, null> | 'ungraded';
  r: number;
  pnl: number;
  counts: boolean;
};

/* ============================================================
   Discipline module
   ============================================================ */

/**
 * Multi-account from the start. Only a live account exists today, but carrying
 * the field now means prop accounts can be added without migrating trades —
 * and `type` leaves room for buffer / trailing-drawdown fields later.
 */
export type Account = {
  id: string;
  name: string;
  type: 'live' | 'prop';
  startingBalance: number;
  /** planned risk as a percentage of current balance */
  riskPercent: number;
  createdAt: string;
};

/**
 * Balance is not just starting + results — capital gets added out of income.
 * Every change is a dated row so the balance on any past date is reconstructable
 * and an old trade is judged against the balance as it stood that day.
 */
export type BalanceAdjustment = {
  id: string;
  accountId: string;
  date: string; // YYYY-MM-DD
  /** signed: deposits positive, withdrawals negative */
  amount: number;
  kind: 'deposit' | 'withdrawal' | 'correction';
  note?: string;
};

/** One honest check-in per day, including days you didn't trade. */
export type DayCheck = {
  date: string; // YYYY-MM-DD
  accountId: string;
  tookTrade: boolean;
  /** null when no trade was taken */
  setupValid: boolean | null;
  /** gate ids from data/framework.ts that were confirmed */
  gatesPassed: string[];
  sessionProfile?: SessionProfile;
  /** which candle of the triplet — C2 and C3 have different requirements */
  candleRole?: CandleRole;
  emotions: string[];
  /**
   * What was working, not what was driving you off plan — kept separate from
   * `emotions` on purpose. Never read by the discipline engine: ticking
   * "confident" here must never flag the day, and must never break the calm
   * streak the way a real emotion tag does.
   */
  positiveEmotions?: string[];
  /** manual mode — always available, never gated behind the structured list */
  note: string;
  createdAt: string;
  updatedAt?: string;
};

/**
 * A trade that is open right now.
 *
 * Every Entry in this app is a closed record — it has an outcome and a result.
 * That means the app has only ever been present AFTER the decision, and the
 * decision that costs you happens while the trade is live. This is the missing
 * state: one open position at a time, per account, so the app can say something
 * at the moment it matters and so trade two has to walk past a wall instead of
 * quietly never being logged.
 */
export type LivePosition = {
  accountId: string;
  date: string; // YYYY-MM-DD
  openedAt: string; // ISO
  sessionProfile?: SessionProfile;
  candleRole?: CandleRole;
  /** what you actually risked, if you know it at open */
  risk?: number;
  note?: string;
};

/**
 * One day of back-testing. Deliberately NOT an Entry: nothing here was risked,
 * so it must never reach P&L, win rate, clean days, the trajectory, or any
 * streak that is supposed to mean "I held my rule with real money on it".
 *
 * It rides in discipline.json purely to reuse the offline-sync machinery — see
 * utils/backtest.ts for the engine, which is entirely separate from
 * utils/discipline.ts and shares nothing with it but the XP total.
 */
export type BacktestSession = {
  id: string;
  date: string; // YYYY-MM-DD — one session per day is the habit
  /** how many setups you went through */
  setups: number;
  sessionProfile?: SessionProfile;
  /** which setup type you were drilling */
  candleRole?: CandleRole;
  /** the write-up — a screenshot and real reflection is what earns the bonus */
  notes?: string;
  image?: string;
  createdAt: string;
  updatedAt?: string;
};

export type DisciplineData = {
  version: 1;
  accounts: Account[];
  activeAccountId: string | null;
  adjustments: BalanceAdjustment[];
  checks: DayCheck[];
  /** worn outfit id, a separate XP-gated track from gear — see data/outfits.ts */
  equippedOutfit?: string;
  /** crew member standing beside Voyager, if any — each unlocked by a different habit, see data/characters.ts */
  equippedCompanion?: string | null;
  /** the trade you are in right now, if any. One at a time. */
  live?: LivePosition | null;
  /** back-testing reps — its own section, its own engine, shares only XP */
  backtests?: BacktestSession[];
};

export type StoreState = {
  entries: Entry[];
  loading: boolean;
  /** null when the server is reachable, otherwise why it is not */
  offline: string | null;
  pendingWrites: number;
  discipline: DisciplineData;
  /** true when running off the static cloud snapshot — no server exists to write to */
  cloudMode: boolean;
  /** when the cloud snapshot was generated, if cloudMode is true */
  cloudSyncedAt: string | null;
};

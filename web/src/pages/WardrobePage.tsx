/* ============================================================
   Character selection — a full-screen view, not another page inside the
   app's rail and topbar shell (App.tsx returns this directly, bypassing that
   chrome entirely). Styled exactly like the review pages every outfit was
   approved on rather than the app's own glass/card look (see
   wardrobePage.css). Reachable from the rail and from the hub's own drawer —
   nowhere else.

   The page is named "Character selection" everywhere the user can see it.
   The file, the component, the #wardrobe route and the wb- class prefix
   still say wardrobe, deliberately: the hub links to #wardrobe by hard-coded
   href, so renaming the route would break navigation from outside this app
   for a label change.

   One outfit at a time, like the review pages were — the "rest of the
   roster" strip at the bottom is the navigation: tap a card, it becomes
   the one showing, nothing else changes. The only other control is the back
   button, which leaves the app entirely rather than going to some other page.
   ============================================================ */

import { useState } from 'react';
import { ArrowLeft, Check, Lock } from 'lucide-react';
import { Empty } from '../components/kit';
import { Voyager } from '../components/Voyager';
import { OUTFITS, type Outfit } from '../data/outfits';
import { activeAccount, equipOutfit, useStore } from '../store/useStore';
import { overrideSummary, useDevUnlockAll } from '../store/devMode'; // TEMPORARY — see store/devMode.ts
import { summarizeDiscipline } from '../utils/discipline';
import './wardrobePage.css';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** The three originals that got a full body redesign, vs. the six built new. */
const REDESIGNED = new Set(['pathfinder', 'voidwalker', 'ironclad']);

/** The figure numbers each design was reviewed and approved under — kept for continuity. */
const FIG: Record<string, string> = {
  revenant: '05',
  sentinel: '06',
  herald: '07',
  outrider: '08',
  pyro: '09',
  cryo: '10',
  pathfinder: '11',
  voidwalker: '12',
  ironclad: '13',
};

function statusOf(outfit: Outfit): 'redesigned' | 'new' | null {
  if (outfit.id === 'standard') return null;
  return REDESIGNED.has(outfit.id) ? 'redesigned' : 'new';
}

/** Every diff line was written as "Bold lead-in — the rest of it." — split once, on the first dash. */
function splitLead(line: string): [string, string] {
  const i = line.indexOf(' — ');
  return i === -1 ? [line, ''] : [line.slice(0, i), line.slice(i + 3)];
}

export function WardrobePage() {
  const { entries, discipline } = useStore();
  const account = activeAccount();
  const devUnlockAll = useDevUnlockAll(); // TEMPORARY — see store/devMode.ts
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!account) {
    return (
      <div className="wb-screen">
        <div className="wb-back-bar">
          <a className="wb-back-btn" href="../index.html">
            <ArrowLeft size={15} />
            Hub
          </a>
        </div>
        <div className="glass mc-card" style={{ margin: 20 }}>
          <Empty icon={<Lock size={18} />}>Setting up your account…</Empty>
        </div>
      </div>
    );
  }

  const summary = overrideSummary(
    summarizeDiscipline(account, discipline.adjustments, entries, discipline.checks, todayStr()),
    devUnlockAll,
  );
  const { level, cleanDays } = summary;
  const worn = discipline.equippedOutfit ?? 'standard';
  const outfit = OUTFITS.find((o) => o.id === selectedId) ?? OUTFITS.find((o) => o.id === worn) ?? OUTFITS[0];

  const unlocked = level >= outfit.unlockLevel;
  const isWorn = worn === outfit.id;
  const status = statusOf(outfit);
  const fig = FIG[outfit.id];

  return (
    <div className="wb-screen">
      {/* The page name lives here because this view bypasses the app's
          topbar entirely (App.tsx returns it directly), so PAGE_META's title
          never renders for it — and the rail is icon-only, so its label is
          just a hover tooltip. Without this line the page is unnamed
          anywhere the user actually looks. */}
      <div className="wb-back-bar">
        <a className="wb-back-btn" href="../index.html">
          <ArrowLeft size={15} />
          Hub
        </a>
        <span className="wb-page-name">Character selection</span>
      </div>

      <div className="wb-page">
        <div className="wb-eyebrow">
          <span className="dot" />
          {status === 'redesigned' ? 'Redesign' : status === 'new' ? 'New build' : 'Original'}
        </div>
        <h1 className="wb-h1">{outfit.name}</h1>
        <p className="wb-lede">{outfit.blurb}</p>

        <div className="wb-action">
          {unlocked ? (
            <button
              className={`wb-equip-btn ${isWorn ? 'worn' : ''}`}
              onClick={() => !isWorn && equipOutfit(outfit.id)}
              disabled={isWorn}
            >
              {isWorn ? 'Worn' : 'Wear this'}
            </button>
          ) : (
            <div className="wb-lock-notice">
              <Lock size={12} />
              Unlocks at process rank {outfit.unlockLevel} — you're at {level}.
            </div>
          )}
        </div>

        <div className={`wb-plate ${unlocked ? '' : 'locked'}`}>
          {fig && (
            <span className="wb-plate-tag">
              FIG.{fig} — <b>FRONT / QUARTER</b>
            </span>
          )}
          <Voyager cleanDays={cleanDays} outfitId={outfit.id} size={230} />
        </div>

        <div className="wb-sheet">
          {outfit.whatsDifferent.length > 0 && (
            <div className="wb-block wb-diff-block">
              <h3>What's different</h3>
              <ul className="wb-diff-list">
                {outfit.whatsDifferent.map((line, i) => {
                  const [lead, rest] = splitLead(line);
                  return (
                    <li key={i}>
                      <span className="tick">
                        <Check size={11} />
                      </span>
                      <span>
                        <b>{lead}</b>
                        {rest && ` — ${rest}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="wb-block">
            <h3>Palette</h3>
            <div className="wb-palette-row">
              {outfit.paletteSwatches.map((p) => (
                <div className="wb-swatch" key={p.label}>
                  <i className="chip" style={{ background: p.color }} />
                  <span>{p.label}</span>
                </div>
              ))}
            </div>
          </div>

          {outfit.bodyStats && outfit.bodyStats.length > 0 && (
            <div className="wb-block">
              <h3>Body, old vs. new</h3>
              <div className="wb-stat-table">
                {outfit.bodyStats.map((s) => (
                  <div className="wb-stat-row" key={s.k}>
                    <span className="k">{s.k}</span>
                    <span className="v">{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="wb-compare">
          <div className="wb-compare-head">
            The rest of the roster <span>— tap one to look at it</span>
          </div>
          <div className="wb-compare-grid">
            {OUTFITS.filter((o) => o.id !== outfit.id).map((o) => {
              const oStatus = statusOf(o);
              return (
                <button className="wb-compare-card" key={o.id} onClick={() => setSelectedId(o.id)}>
                  <div className="wb-compare-swatches">
                    {o.paletteSwatches.slice(0, 3).map((p) => (
                      <i key={p.label} style={{ background: p.color }} />
                    ))}
                  </div>
                  <div className="wb-compare-name">
                    {o.name}
                    {oStatus && <span className="wb-compare-badge">{oStatus}</span>}
                    {discipline.equippedOutfit === o.id && <span className="wb-compare-badge">worn</span>}
                  </div>
                  <div className="wb-compare-note">{o.blurb}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="wb-footer">Mission Control — Character selection · {OUTFITS.length} looks</div>
      </div>
    </div>
  );
}


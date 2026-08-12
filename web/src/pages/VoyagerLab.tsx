/* ============================================================
   Voyager lab — every gear tier side by side.

   A preview surface for judging the model and the progression in one look,
   rather than banking 150 clean days to see the final tier. Reached at
   /trading/#voyager. It renders the real component, so what you see here is
   exactly what the Moonshot page shows — there is no second copy to drift.

   Delete this page once the model is settled.
   ============================================================ */

import { useState } from 'react';
import { Voyager } from '../components/Voyager';
import { CHARACTERS } from '../data/characters';
import { GEAR, currentGear, gearState } from '../data/gear';

/** Every gear threshold, in clean days — derived so it can't drift from GEAR. */
const TIERS = GEAR.map((g) => g.at);

export function VoyagerLab() {
  const [size, setSize] = useState(150);
  const [hero, setHero] = useState(50);
  // Preview only — the real crew lives in the store and unlocks by habit.
  const [companionId, setCompanionId] = useState<string | null>(null);

  return (
    <div className="mc-page" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div
        style={{
          fontSize: 11.5,
          color: 'var(--txt-faint)',
          lineHeight: 1.6,
          padding: '10px 14px',
          borderRadius: 12,
          background: 'var(--glass-input)',
          border: '1px solid var(--hairline-soft)',
        }}
      >
        Preview only — nothing here is saved. It shows every tier and tool regardless of what you've
        actually unlocked, so you can see where the progression goes. Your real Voyager and toolbelt
        live on <strong>Moonshot</strong>.
      </div>

      {/* ---------- hero ---------- */}
      <div className="glass mc-card" style={{ display: 'flex', gap: 26, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'grid', placeItems: 'center', minWidth: 260 }}>
          <Voyager cleanDays={hero} size={230} companionId={companionId} />
        </div>
        <div style={{ minWidth: 220, flex: 1 }}>
          <div className="mc-kpi-label">{hero} clean days</div>
          <div className="mc-num-thin" style={{ fontSize: 27, marginTop: 6 }}>
            {currentGear(hero).name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--txt-dim)', marginTop: 8, lineHeight: 1.6 }}>
            {currentGear(hero).blurb}
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="mc-section-title" style={{ marginBottom: 8 }}>
              Layers on at this point
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.entries(gearState(hero)).map(([slot, tier]) => (
                <span
                  key={slot}
                  className={`mc-tag-chip ${tier ? 'active' : ''}`}
                  style={{ opacity: tier ? 1 : 0.45 }}
                >
                  {slot} {typeof tier === 'number' ? tier : tier ? 'on' : 'off'}
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="mc-section-title" style={{ marginBottom: 8 }}>
              Companion
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                className={`mc-tag-chip ${companionId === null ? 'active' : ''}`}
                onClick={() => setCompanionId(null)}
              >
                None
              </button>
              {CHARACTERS.map((c) => (
                <button
                  key={c.id}
                  className={`mc-tag-chip ${companionId === c.id ? 'active' : ''}`}
                  onClick={() => setCompanionId(c.id)}
                  title={c.blurb}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="mc-section-title">Size</span>
            <input
              type="range"
              min={80}
              max={280}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              style={{ accentColor: 'var(--accent)' }}
            />
            <span style={{ fontSize: 11, color: 'var(--txt-faint)' }}>{size}px</span>
          </div>
        </div>
      </div>

      {/* ---------- every tier ---------- */}
      <div className="glass mc-card">
        <div className="mc-section-title" style={{ marginBottom: 16 }}>
          All ten tiers
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(${size + 30}px, 1fr))`,
            gap: 18,
          }}
        >
          {TIERS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setHero(lvl)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: '14px 8px',
                borderRadius: 16,
                cursor: 'pointer',
                fontFamily: 'inherit',
                background: hero === lvl ? 'var(--glass-strong)' : 'var(--glass)',
                border: `1px solid ${hero === lvl ? 'var(--hairline)' : 'var(--hairline-soft)'}`,
              }}
            >
              <Voyager cleanDays={lvl} size={size} />
              <span style={{ fontSize: 11, color: 'var(--txt)' }}>{lvl} clean days</span>
              <span style={{ fontSize: 10, color: 'var(--txt-faint)', textAlign: 'center' }}>
                {GEAR.find((g) => g.at === lvl)?.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

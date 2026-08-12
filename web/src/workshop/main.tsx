/* ============================================================
   Workshop entry — dev-only, reached at /workshop.html.

   Separate from moonshot/crew3d/ on purpose: crew3d is the real runtime that
   will load authored .glb files through loader.ts/lod.ts once that pipeline
   exists. This file has no dependency on that pipeline at all.

   Views, toggled here rather than split across URLs because they get
   compared against each other:

     Vigil 2D      crew slot 1, finished
     Ballast 2D    crew slot 2, under construction
     Corvid 2D     Special Forces 1 of 5, batch 1 — base masses only
     3D blockout   grey-box primitives, kept for proportion reference

   The SILHOUETTE toggle is the reason the picker exists in this shape. Each
   character's spec sets an 80px flat-shape gate, and the gate is not really
   "does this read" but "does this read as DISTINCT FROM THE OTHERS" — which
   can only be judged by flipping between them in the same frame at the same
   size. Corvid's gate is explicitly three-way (vs. Vigil AND Ballast, see
   docs/crew3d/corvid-spec.md §2), which is why the silhouette toggle now
   covers all three figures rather than one at a time.
   ============================================================ */

import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { VigilBlockout } from './VigilBlockout';
import { VigilFigure2D } from './VigilFigure2D';
import { BallastFigure2D } from './BallastFigure2D';
import { CorvidFigure2D } from './CorvidFigure2D';
import { ApogeeFigure2D } from './ApogeeFigure2D';
import { EclipseFigure2D, ECLIPSE_PALETTES, type EclipsePaletteName } from './EclipseFigure2D';
import { RosterSheet } from './RosterSheet';
import { OrbitLab } from './CompanionOrbit';

type View = 'roster' | 'orbit' | 'vigil' | 'ballast' | 'corvid' | 'apogee' | 'eclipse' | 'blockout';

const VIEWS: { id: View; label: string }[] = [
  { id: 'roster', label: 'Shipped roster' },
  { id: 'orbit', label: 'Orbit lab' },
  { id: 'vigil', label: 'Vigil 2D' },
  { id: 'ballast', label: 'Ballast 2D' },
  { id: 'corvid', label: 'Corvid 2D' },
  { id: 'apogee', label: 'Apogee 2D' },
  { id: 'eclipse', label: 'Eclipse 2D' },
  { id: 'blockout', label: '3D blockout' },
];

function btn(active: boolean): React.CSSProperties {
  return {
    fontFamily: 'monospace',
    fontSize: 12,
    padding: '6px 14px',
    background: active ? '#3a3f4c' : '#1b1c20',
    color: '#e4e6ea',
    border: '1px solid #3a3f4c',
    borderRadius: 6,
    cursor: 'pointer',
  };
}

function Workshop() {
  const [view, setView] = useState<View>('orbit');
  const [silhouette, setSilhouette] = useState(false);
  const [eclipsePalette, setEclipsePalette] = useState<EclipsePaletteName>('eclipse');

  const is2d = view === 'vigil' || view === 'ballast' || view === 'corvid' || view === 'apogee' || view === 'eclipse';

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0c', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 20, display: 'flex', gap: 8 }}>
        {VIEWS.map((v) => (
          <button key={v.id} onClick={() => setView(v.id)} style={btn(view === v.id)}>
            {v.label}
          </button>
        ))}
        {is2d && (
          <button
            onClick={() => setSilhouette((s) => !s)}
            style={{ ...btn(silhouette), marginLeft: 16 }}
          >
            {silhouette ? 'silhouette · 80px gate' : 'shaded'}
          </button>
        )}
      </div>

      {/* Eclipse colour-variant picker — REVISION 7. Same pattern as the
          Orbit Lab's mascot skin buttons (standard/pathfinder/voidwalker/
          etc.), reused here rather than invented fresh: it's already the
          established way this codebase lets you flip between palettes of
          the same geometry. Hidden in silhouette mode since a variant
          picker is meaningless once everything's flattened to black. */}
      {view === 'eclipse' && !silhouette && (
        <div style={{ position: 'absolute', top: 56, left: 16, zIndex: 20, display: 'flex', gap: 8 }}>
          {(Object.keys(ECLIPSE_PALETTES) as EclipsePaletteName[]).map((name) => (
            <button key={name} onClick={() => setEclipsePalette(name)} style={btn(eclipsePalette === name)}>
              {name}
            </button>
          ))}
        </div>
      )}

      {view === 'orbit' ? (
        <OrbitLab />
      ) : view === 'roster' ? (
        <RosterSheet />
      ) : view === 'blockout' ? (
        <VigilBlockout />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'grid',
            placeItems: 'center',
            /* light ground in silhouette mode: a black shape on a dark page
               can't be judged, and the gate is about the shape's outline */
            background: silhouette ? '#d9dbe0' : '#7d818a',
          }}
        >
          {/* Sized by HEIGHT, not width — the 200x300 viewBox is portrait, and
              a width-based fit lets the rendered height exceed the viewport on
              anything wider than it is tall, cropping the feet. */}
          <div className="wk-frame" style={{ display: 'grid', placeItems: 'center', gap: 18 }}>
            <div className="wk-hero">
              {view === 'vigil' ? (
                <VigilFigure2D />
              ) : view === 'ballast' ? (
                <BallastFigure2D silhouette={silhouette} />
              ) : view === 'corvid' ? (
                <CorvidFigure2D silhouette={silhouette} />
              ) : view === 'apogee' ? (
                <ApogeeFigure2D silhouette={silhouette} />
              ) : (
                <EclipseFigure2D silhouette={silhouette} palette={eclipsePalette} />
              )}
            </div>
            {/* the gate itself, now four-way — Apogee's spec requires
                distinction from Vigil, Ballast AND Corvid, not just a read
                on its own. Vigil has no silhouette prop yet (a known gap,
                not fixed here), so its thumbnail stays shaded rather than
                flattening to black; it is still useful for a size/shape
                comparison, just not a true flat-silhouette one. */}
            {silhouette && (
              <div style={{ display: 'flex', gap: 20 }}>
                {(
                  [
                    { id: 'vigil' as const, node: <VigilFigure2D />, label: 'Vigil · shaded (no silhouette prop)' },
                    { id: 'ballast' as const, node: <BallastFigure2D silhouette />, label: 'Ballast · 80px gate' },
                    { id: 'corvid' as const, node: <CorvidFigure2D silhouette />, label: 'Corvid · 80px gate' },
                    { id: 'apogee' as const, node: <ApogeeFigure2D silhouette />, label: 'Apogee · 80px gate' },
                    { id: 'eclipse' as const, node: <EclipseFigure2D silhouette />, label: 'Eclipse · 80px gate' },
                  ]
                ).map((c) => (
                  <div key={c.id} style={{ display: 'grid', placeItems: 'center', gap: 6 }}>
                    <div
                      style={{
                        width: 80,
                        height: 120,
                        outline: c.id === view ? '2px solid #2a6' : 'none',
                        outlineOffset: 4,
                      }}
                    >
                      {c.node}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#5a5f68', textAlign: 'center' }}>
                      {c.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <style>{`
            .wk-frame svg { height: 100%; width: auto; display: block; }
            .wk-frame .wk-hero svg { height: ${silhouette ? '58vh' : '85vh'}; }
          `}</style>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Workshop />
  </StrictMode>,
);

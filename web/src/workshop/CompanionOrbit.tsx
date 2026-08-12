import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import './companionOrbit.css';
import { Voyager } from '../components/Voyager';
import { CharacterArt } from '../components/CharacterArt';
import { PetArt, PETS } from './CrewLab';

/* ============================================================
   Companion orbit — the run-around-and-jump-on interaction. DEV ONLY.

   ---------- WHY THIS IS NOT INSIDE Voyager.tsx ----------

   The obvious implementation is to animate the <g className="voyager-companion">
   that already exists inside Voyager's SVG. That cannot produce a lap,
   because "around" requires the companion to pass BEHIND Voyager, and SVG
   paint order is fixed by document order — a single element cannot move
   from behind a sibling to in front of it, no matter what transform it has.

   So the companion is rendered TWICE, as two absolutely-positioned layers
   straddling Voyager:

       layer 1   companion, BEHIND     (z-index below Voyager)
       layer 2   Voyager
       layer 3   companion, IN FRONT   (z-index above Voyager)

   Both companion layers run the identical lap animation in lockstep; a
   third animation cross-fades their opacity so exactly one is visible at
   any moment. The swap happens at the two crossover points — the far left
   and far right of the lap — where the companion is at the edge of the
   frame and furthest from Voyager's body, so the hand-off is invisible.

   Doing it as stacked HTML layers rather than inside the SVG has a second
   benefit worth the trade: Voyager.tsx is untouched, so this works with
   ALL TEN outfits (shared rig and every custom body) and all fifteen
   companions — the five shipped and the ten redesigned — without any of
   them knowing the feature exists.

   ---------- THE LAP ----------

   The arc itself lives in companionOrbit.css, including the reason its
   offsets are px-off-a-custom-property rather than percentages — that one
   was a real bug, not a style preference.

   What belongs here is the sizing contract the CSS depends on:

     --co-s    Voyager's rendered width. The vertical offsets are fractions
               of it, so the arc scales with him at any size.
     --co-x    how far out the companion swings at the two crossovers.
     stage     wide enough to hold --co-x plus the companion's own width.

   ---------- WHY --co-x IS MEASURED ----------

   The crossover only works if the two layers rasterise identically at the
   swap instant, and that requires the companion to be entirely clear of
   Voyager. The first cut hard-coded 0.62s, derived from the standard
   outfit's 0.36s half-width. Measuring all ten found ironclad at 0.536s —
   half again as wide, because it has pauldrons. At 0.62s the companion
   would still have been on top of it, and the swap would have popped.

   Rather than widen everything to ironclad's worst case and leave the nine
   narrow outfits swinging further than they need, the excursion is
   measured from the rendered geometry after mount: Voyager's half-width
   plus the companion's half-width plus a margin. That is correct for the
   ten outfits that exist, and stays correct for whatever gets added next
   without anyone remembering this constraint.

   getBBox() is geometry only — it ignores the glow filters, which is the
   right call here. A hard swap underneath a soft translucent glow is not
   perceptible, and counting the glow would push the arc uselessly wide.
   ============================================================ */

/** Ink half-width of an SVG's contents, in rendered px either side of its
 *  own centre. viewBox units scaled by the rendered width, so it is
 *  comparable across figures with different viewBoxes — ironclad's is 220
 *  where the rest are 200. */
function inkHalfWidth(svg: SVGSVGElement | null): number | null {
  if (!svg) return null;
  const vb = svg.getAttribute('viewBox');
  if (!vb) return null;
  const vbWidth = Number(vb.split(/\s+/)[2]);
  const rendered = svg.getBoundingClientRect().width;
  if (!vbWidth || !rendered) return null;
  let bb: DOMRect;
  try {
    bb = svg.getBBox();
  } catch {
    /* getBBox throws on a detached or display:none subtree. Callers fall
       back to the unmeasured default rather than crashing the lap. */
    return null;
  }
  if (!bb.width) return null;
  const cx = vbWidth / 2;
  const halfUnits = Math.max(cx - bb.x, bb.x + bb.width - cx);
  return (halfUnits / vbWidth) * rendered;
}

export type OrbitTrigger = 'hover' | 'click';

export function CompanionOrbit({
  outfitId,
  companionId,
  /** 'pet' uses the redesigned lab art, 'crew' uses what currently ships */
  source = 'pet',
  size = 190,
  cleanDays = 150,
}: {
  outfitId: string;
  companionId: string;
  source?: 'pet' | 'crew';
  size?: number;
  cleanDays?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(false);

  const petSize = size * 0.46;

  /* Fallback until the geometry has been measured, and the value used if
     measuring ever fails. Sized off the standard outfit so the very first
     paint is never wrong enough to notice. */
  const [reach, setReach] = useState(() => ({ x: size * 0.62, half: petSize * 0.32 }));

  /* Same animation-restart problem as Vigil and Ballast: re-adding a class
     that is already present is a no-op, so a second tap during a lap would
     do nothing. Remove, force reflow, re-add. */
  const run = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.classList.remove('is-running');
    void el.getBoundingClientRect().width;
    el.classList.add('is-running');
    setRunning(true);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const done = (e: AnimationEvent) => {
      /* Only the lap's own animation ends the run. Two layers x two
         animations means four animationend events land at the same
         instant; without this guard the class is cleared four times. */
      if (e.animationName === 'co-lap') {
        el.classList.remove('is-running');
        setRunning(false);
      }
    };
    el.addEventListener('animationend', done);
    return () => el.removeEventListener('animationend', done);
  }, []);

  /* Measure after paint, and re-measure whenever the figure or the
     companion changes — a wider outfit needs a wider lap. useLayoutEffect
     rather than useEffect so the corrected value is committed before the
     browser paints, otherwise switching outfit shows one frame of the old
     outfit's reach. */
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const vHalf = inkHalfWidth(el.querySelector('.co-voyager svg'));
    const pHalf = inkHalfWidth(el.querySelector('.co-front svg'));
    if (vHalf === null || pHalf === null) return;
    /* 8px of daylight. The two figures being merely tangent is enough for
       the swap to be a no-op, but antialiasing on two touching edges is
       not worth arguing with. */
    setReach({ x: vHalf + pHalf + 8, half: pHalf });
  }, [outfitId, companionId, source, size, cleanDays]);

  const Art = source === 'pet' ? PetArt : CharacterArt;

  return (
    <div
      ref={ref}
      className="co-stage"
      style={
        {
          /* full swing either side, plus the companion's own half-width so
             it is not clipped at the extremes, plus 4px of breathing room */
          width: Math.ceil(2 * (reach.x + reach.half) + 4),
          height: size * 1.34,
          '--co-s': `${size}px`,
          '--co-x': `${reach.x.toFixed(1)}px`,
        } as React.CSSProperties
      }
      onPointerEnter={run}
      onPointerDown={run}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          run();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Voyager with ${companionId}. Activate to make the companion run around.`}
    >
      {/* layer 1 — companion behind Voyager */}
      <div className="co-pet co-behind" style={{ width: petSize }}>
        <Art id={companionId} size={petSize} />
      </div>

      {/* layer 2 — Voyager. companionId deliberately omitted so it does not
          draw its own static companion competing with the orbiting one. */}
      <div className="co-voyager">
        <Voyager cleanDays={cleanDays} size={size} outfitId={outfitId} />
      </div>

      {/* layer 3 — companion in front of Voyager */}
      <div className="co-pet co-front" style={{ width: petSize }}>
        <Art id={companionId} size={petSize} />
      </div>

      {!running && <div className="co-hint">hover or tap</div>}
    </div>
  );
}

/** A grid running the orbit across every companion, to prove the crossover
 *  holds for all of them rather than for the one that was developed against. */
export function OrbitLab() {
  const [outfitId, setOutfitId] = useState('standard');
  const outfits = [
    'standard', 'pathfinder', 'voidwalker', 'ironclad', 'revenant',
    'sentinel', 'herald', 'outrider', 'pyro', 'cryo',
  ];

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '18px 22px 60px' }}>
      <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#c8ccd4', marginBottom: 10 }}>
        ORBIT LAB · hover any figure · outfit applies to all
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
        {outfits.map((o) => (
          <button
            key={o}
            onClick={() => setOutfitId(o)}
            style={{
              fontFamily: 'monospace',
              fontSize: 10,
              padding: '4px 9px',
              borderRadius: 5,
              cursor: 'pointer',
              color: '#e4e6ea',
              background: outfitId === o ? '#3a3f4c' : '#1b1c20',
              border: '1px solid #3a3f4c',
            }}
          >
            {o}
          </button>
        ))}
      </div>

      {/* 430px minimum: the stage sizes itself from the measured reach, and
          the widest combination (ironclad + the broadest companion) comes
          out at 418px. Anything narrower clips the lap in that one cell. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(430px, 1fr))', gap: 14 }}>
        {PETS.map((p) => (
          <div
            key={p.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: 8,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <CompanionOrbit outfitId={outfitId} companionId={p.id} source="pet" />
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#c8ccd4' }}>{p.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

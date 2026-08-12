import { useCallback, useEffect, useRef } from 'react';
import './ballastFigure2D.css';

/* ============================================================
   Ballast — 2D figure. Crew slot 2 of 4.
   Discipline: the hold — not flinching in drawdown.

   BATCH 1 of 7: base masses and silhouette only. Flat fills, inked, no
   surface detail. The single question this batch answers is whether the
   figure reads as an ANVIL at 80px — wide flared bar across the top, hard
   taper to a narrow waist, flaring again to a planted base. Everything in
   later batches (pipe crown, hood, quilting, weave, grime) hang
   off masses that are right, so nothing decorative gets drawn until the
   shape passes. Full brief: docs/crew3d/ballast-spec.md

   Deliberately built to CONTRAST with Vigil rather than match it:

     Vigil     narrow vertical spike · arms hanging open · amber on olive
     Ballast   hooded column, arms folded shut          · magenta on bone

   Two characters that read as one silhouette at small size are a failure of
   the roster, not of either figure — see the spec's §2 gate.

   Conventions carried over from VigilFigure2D.tsx, which earned them:
   module-top colour constants, a <defs> block (prefixed `bl-` here so the
   two figures can share a page without id collisions), stroke linecap and
   linejoin set once on the root so ~80 paths inherit them, deterministic
   hashed scatter instead of Math.random so screenshots are reproducible,
   and ink weights of 4 / 2.5 / 1.5 for silhouette / sub-shape / fine detail.
   ============================================================ */

const INK = '#141414';

/* The coat, hood and sleeves — most of the figure's area. Kept genuinely
   near-black: the magenta rim light in batch 7 needs somewhere dark to
   separate against, and mid-greys would kill it. */
const COAT_HI = '#3a3d42';
const COAT_LO = '#16181b';

/* Faceplate, sash, tabard, trousers and boots. The only light values, and
   the entire reason the figure doesn't read as a black blob. */
const BONE_HI = '#cfc3ab';
const BONE_MID = '#9d8f76';
const BONE_LO = '#6b6150';

const BRASS = '#b08a3e';
const MAGENTA = '#ff3fae';

/** deterministic scatter — no Math.random() in render output, so a reload
 *  and a screenshot always agree. Same helper, same reason, as Vigil. */
export function hash(i: number, salt = 0): number {
  const s = Math.sin(i * 91.7 + salt * 47.13) * 28001.31;
  return s - Math.floor(s);
}

/* Grime. Placed where a standing figure actually gets dirty — knees, hem,
   sole line, and in the hollow of the folded arms — rather
   than scattered evenly, which is what a texture does and not what wear
   does. Rotations keep the smudges from all lying the same way. */
const GRIME = [
  { x: 84, y: 236, rx: 13, ry: 7, r: -12 },
  { x: 118, y: 244, rx: 11, ry: 6, r: 8 },
  { x: 70, y: 288, rx: 15, ry: 5, r: -4 },
  { x: 126, y: 290, rx: 16, ry: 5, r: 3 },
  { x: 52, y: 246, rx: 12, ry: 8, r: 22 },
  { x: 148, y: 240, rx: 10, ry: 7, r: -18 },
  { x: 100, y: 212, rx: 9, ry: 5, r: 0 },
];

/* Torn hem tongues hanging off the coat's lower edge. Hand-authored rather
   than generated for the reason Vigil's frayed scarf hem had to be rebuilt:
   a run of evenly-spaced same-length points reads as a sawtooth, not as
   damage. These vary in width, length, lean and root position, and two of
   them are noticeably longer than the rest. The left panel's hem sits at
   y≈250-256 and the right at y≈252-258, so the two sides are rooted
   independently rather than mirrored. */
const COAT_TONGUES: string[] = [
  'M43,249 L40,268 L49,252 Z',
  'M52,252 L50,264 L58,253 Z',
  'M60,254 L62,275 L69,255 Z',
  'M70,255 L71,263 L77,256 Z',
  'M122,256 L120,272 L128,257 Z',
  'M130,255 L134,266 L137,254 Z',
  'M140,253 L146,270 L148,251 Z',
  'M150,251 L153,261 L157,250 Z',
];

/* Chevron weave rows, shared by the sash and the tabard. Declared as data
   so both surfaces are generated from one description: if the two were
   hand-placed they would drift apart under editing and stop reading as the
   same bolt of cloth. Rows on the sash are wider and fainter (it is wrapped,
   so the weave foreshortens); the tabard hangs flat and shows it fully. */
const CHEVRON_ROWS = [
  { y: 158, x0: 70, span: 60, n: 6, h: 3.4, o: 0.5 },
  { y: 167, x0: 69, span: 62, n: 6, h: 3.4, o: 0.45 },
  { y: 176, x0: 70, span: 60, n: 6, h: 3.2, o: 0.4 },
  { y: 190, x0: 88, span: 24, n: 3, h: 3.6, o: 0.65 },
  { y: 199, x0: 88, span: 24, n: 3, h: 3.6, o: 0.6 },
  { y: 208, x0: 89, span: 22, n: 3, h: 3.4, o: 0.55 },
];

/* ---------- pipe crown ----------
   Seven tubes looping up and out from behind the helm. Authored by hand
   rather than generated, because the whole value of this element is that no
   two loops match: a generated fan would come out evenly spaced and
   symmetric, which reads as a decorative crown. These read as salvage
   welded on at different times.

   Each is an open cubic stroked with a round cap, drawn twice — a thick
   ink pass and a thinner light pass riding on top — so the tube gets a lit
   outer surface without needing a gradient per loop. Deliberately
   asymmetric left to right: four loops on one side, three on the other. */
const PIPE_LOOPS: string[] = [
  'M80,42 C62,34 56,14 70,9 C82,5 88,17 86,30',
  'M84,34 C74,16 82,2 95,7 C103,10 102,20 99,28',
  'M78,50 C56,46 44,30 54,22 C62,16 70,24 74,34',
  'M118,40 C136,32 143,13 129,8 C117,4 111,16 113,29',
  'M114,33 C124,15 117,2 104,6 C97,9 98,19 101,27',
  'M121,50 C142,45 152,29 143,22 C135,16 128,25 125,35',
  'M123,58 C140,58 148,50 143,44',
];

export type BallastFigure2DProps = {
  /** rendered width in px; height follows the 200x300 viewBox */
  size?: number;
  /**
   * Renders every shape flat black on a light ground — the spec §2 gate.
   * A prop rather than a devtools fiddle because the check has to be run
   * on every batch, and something re-run that often should be one click.
   */
  silhouette?: boolean;
  /** set false to render a completely inert figure — no idle, no reaction */
  interactive?: boolean;
};

export function BallastFigure2D({
  size,
  silhouette = false,
  interactive = true,
}: BallastFigure2DProps) {
  const ref = useRef<SVGSVGElement>(null);

  /* Same animation-restart mechanism as Vigil: a class already present
     cannot be re-added to restart its animation, so it has to come off,
     force a reflow, and go back on. See vigilFigure2D.css for the full
     reasoning — this is the one place direct DOM access beats React state. */
  const poke = useCallback(() => {
    const el = ref.current;
    if (!el || !interactive || silhouette) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.classList.remove('is-poked');
    void el.getBoundingClientRect().width;
    el.classList.add('is-poked');
  }, [interactive, silhouette]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const done = (e: AnimationEvent) => {
      if (e.animationName.startsWith('bl-turn')) el.classList.remove('is-poked');
    };
    el.addEventListener('animationend', done);
    return () => el.removeEventListener('animationend', done);
  }, []);

  /* In silhouette mode every fill collapses to one flat black and strokes
     are dropped entirely — an outline would fatten the shape and flatter
     the read, which defeats the point of the test. */
  const f = (fill: string) => (silhouette ? '#050505' : fill);
  const stroke = silhouette ? 'none' : INK;

  return (
    <svg
      ref={ref}
      className={interactive && !silhouette ? 'bl-figure' : undefined}
      viewBox="0 0 200 300"
      width={size}
      height={size == null ? undefined : size * 1.5}
      role={interactive && !silhouette ? 'button' : 'img'}
      tabIndex={interactive && !silhouette ? 0 : undefined}
      aria-label={
        interactive && !silhouette
          ? 'Ballast — a sentinel that has decided not to move. Tap to get its attention.'
          : 'Ballast — a sentinel that has decided not to move: arms folded, head sunk into a wide spiked mantle'
      }
      onPointerDown={interactive && !silhouette ? poke : undefined}
      onKeyDown={
        interactive && !silhouette
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                poke();
              }
            }
          : undefined
      }
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient id="bl-coat" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={COAT_HI} />
          <stop offset="100%" stopColor={COAT_LO} />
        </linearGradient>
        <linearGradient id="bl-bone" x1="0.15" y1="0" x2="0.75" y2="1">
          <stop offset="0%" stopColor={BONE_HI} />
          <stop offset="60%" stopColor={BONE_MID} />
          <stop offset="100%" stopColor={BONE_LO} />
        </linearGradient>
        <linearGradient id="bl-mantle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COAT_HI} />
          <stop offset="55%" stopColor="#24272b" />
          <stop offset="100%" stopColor={COAT_LO} />
        </linearGradient>
        <radialGradient id="bl-eye" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={MAGENTA} stopOpacity="0.9" />
          <stop offset="100%" stopColor={MAGENTA} stopOpacity="0" />
        </radialGradient>
        <filter id="bl-glow" x="-160%" y="-160%" width="420%" height="420%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="bl-grime" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#3a3226" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#3a3226" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#3a3226" stopOpacity="0" />
        </radialGradient>
        {/* Rim light. Built as a blurred copy of the figure's own outline
            rather than as hand-drawn highlight strokes: the rim has to
            follow every tongue, quill and pin exactly, and any hand-drawn
            version would drift the moment a silhouette element moved. */}
        <filter id="bl-rim" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.9" />
        </filter>
      </defs>

      {/* ---------- BATCH 1 · base masses, back to front ----------
          Paint order is load-bearing here and gets relied on by every later
          batch: coat behind, then the light lower body, then the torso, then
          the mantle over the shoulders, then the head sunk into it, and the
          folded arms last so they sit in front of the mantle's lower edge.
          That last ordering is what will make the arms read as folded ACROSS
          the body rather than tucked behind the collar. */}

      {/* ---------- REVISION after the batch-1 gate.

          The first attempt failed the 80px test outright: it read as a
          scarecrow with its arms held out. Two causes, both structural:

          1. The mantle was a THIN, POINTED wing. Anything thin and tapering
             projecting horizontally from a torso reads as an arm — that is
             what arms look like in silhouette. Fixed by making it a deep
             blunt-ended shelf: ~44 units thick at the tips instead of ~26,
             and squared off rather than tapered to a point.

          2. There was NO WAIST. The coat flared straight off the shoulders,
             so from mantle to hem the body was a single rectangle and the
             anvil had no pinch to be an anvil about. Fixed by starting the
             coat's visible silhouette BELOW the sash, leaving the folded
             arms (84 wide) and sash (68 wide) as the neck of the shape.

          Widths now read top to bottom: mantle 172 · arms 84 · sash 68 ·
          coat hem 120. That is the anvil.
          ---------- */}

      {/* trousers — baggy, gathered at the ankle. Drawn before the coat so
          the coat's centre split reveals them. */}
      <path
        d="M78,186 L72,216 L70,246 L74,266 L96,268 L99,238 L100,218
           L101,238 L104,268 L126,266 L130,246 L128,216 L122,186 Z"
        fill={f('url(#bl-bone)')}
        stroke={stroke}
        strokeWidth="4"
      />

      {/* boots — blunt-toed and planted wide, toes turned slightly out.
          Part of the base flare, so their outer edges carry more weight
          than their detail will. */}
      {[
        { x: 62, out: -1 },
        { x: 108, out: 1 },
      ].map((b) => (
        <path
          key={b.x}
          d={`M${b.x + 4},258 L${b.x + 2},278 L${b.x + (b.out < 0 ? -4 : 2)},292
              L${b.x + (b.out < 0 ? 28 : 34)},292 L${b.x + 30},278 L${b.x + 28},258 Z`}
          fill={f('url(#bl-bone)')}
          stroke={stroke}
          strokeWidth="4"
        />
      ))}

      {/* coat — two panels split at the centre front. Critically these now
          begin at the WAIST (y150), not the shoulder: above that line the
          silhouette belongs to the folded arms and the sash, which is what
          creates the pinch. Hem is plain here; torn tongues in batch 6. */}
      <path
        d="M68,158 L58,188 L48,220 L41,252 L78,258 L82,220 L85,188 L86,160 Z"
        fill={f('url(#bl-coat)')}
        stroke={stroke}
        strokeWidth="4"
      />
      <path
        d="M132,158 L142,188 L152,220 L159,252 L122,258 L118,220 L115,188 L114,160 Z"
        fill={f('url(#bl-coat)')}
        stroke={stroke}
        strokeWidth="4"
      />

      {/* ---------- BATCH 6 · lower body ----------
          Torn hem tongues go OUTSIDE the silhouette guard — they are the
          only part of this batch that alters the outline. Everything else
          (panel seams, crease-net, boot detail) is surface. */}
      {COAT_TONGUES.map((t, i) => (
        <path
          key={`tongue-${i}`}
          d={t}
          fill={f('url(#bl-coat)')}
          stroke={stroke}
          strokeWidth="3"
        />
      ))}

      {!silhouette && (
        <g id="lower_detail">
          {/* coat panel seams — vertical, following the flare, two per side.
              They stop short of the hem so the torn tongues below read as
              damage to the panel rather than as a continuation of it. */}
          {[
            'M74,162 C68,190 62,218 57,244',
            'M86,164 C83,192 80,220 78,248',
            'M126,162 C132,190 138,218 143,244',
            'M114,164 C117,192 120,220 122,248',
          ].map((d, i) => (
            <path key={`panel-${i}`} d={d} stroke={INK} strokeWidth="1.8" fill="none" opacity="0.5" />
          ))}

          {/* trouser crease-net — the loose diamond lattice that makes worn
              cloth read as worn. Generated as two crossing families rather
              than drawn as diamonds: real creases are independent lines that
              happen to intersect, and drawing closed diamonds produces a
              printed harlequin pattern instead. */}
          {/* Toned down hard after rendering: at strokeWidth 1 / opacity 0.3
              with lines running the full leg width, the two crossing
              families closed into complete diamonds and the trousers read as
              fishnet — a printed harlequin, not worn cloth. Creases are now
              thinner, fainter, and each line spans only part of the leg with
              a hashed start, so they intersect only occasionally instead of
              everywhere. Sparse and broken is what makes them read as
              accidental. */}
          {Array.from({ length: 6 }, (_, i) => {
            const y = 196 + i * 12;
            const j = hash(i, 11) * 6;
            const k = hash(i, 13) * 5;
            return (
              <g key={`crease-${i}`} stroke={INK} strokeWidth="0.7" fill="none" opacity="0.17">
                <path d={`M${76 + j},${y} L${90 + j},${y + 7}`} />
                <path d={`M${124 - k},${y + 4} L${110 - k},${y + 11}`} />
                <path d={`M${80},${y + 9 + j * 0.5} L${94 - j * 0.4},${y + 2}`} />
                <path d={`M${120},${y + 6} L${106 + k * 0.4},${y - 1}`} />
              </g>
            );
          })}

          {/* boot detail — cuff fold, lace holes, sole seam. The cuff line
              sits well below the boot's top edge so it reads as leather
              turned down over itself rather than as a stripe. */}
          {[
            { x: 62, out: -1 },
            { x: 108, out: 1 },
          ].map((b) => (
            <g key={`boot-${b.x}`}>
              <path
                d={`M${b.x + 4},266 L${b.x + 28},266`}
                stroke={INK}
                strokeWidth="2.2"
                opacity="0.8"
              />
              <path
                d={`M${b.x + 3},270 L${b.x + 29},270`}
                stroke={INK}
                strokeWidth="1.2"
                opacity="0.45"
              />
              {/* sole seam, following the boot's own lower edge */}
              <path
                d={`M${b.x + (b.out < 0 ? -3 : 3)},286 L${b.x + (b.out < 0 ? 29 : 33)},286`}
                stroke={INK}
                strokeWidth="2"
                opacity="0.7"
              />
              {[0, 1, 2].map((i) => (
                <circle
                  key={i}
                  cx={b.x + 9 + i * 6}
                  cy={276}
                  r="1.1"
                  fill={INK}
                  opacity="0.6"
                />
              ))}
            </g>
          ))}
        </g>
      )}

      {/* torso block — narrow, and mostly covered by the mantle above and
          the folded arms in front. It exists so those two sit against
          something rather than floating over the background. */}
      {/* Raised from y86 to y70 after the mantle came out. The mantle used
          to span y46-106 and backed the whole hood opening; with it gone the
          band between the helm's lower edge (y78) and the torso's old top
          (y86) had nothing behind it and the page background showed through
          the hood as a hole under the chin. The torso now runs up inside the
          hood's inner boundary — which sits near x73 and x127 at this height
          — so it fills the opening without poking through the cloth. */}
      <path
        d="M74,70 L66,124 L68,160 L100,166 L132,160 L134,124 L126,70 Z"
        fill={f('url(#bl-coat)')}
        stroke={stroke}
        strokeWidth="4"
      />

      {/* sash — the pinch, and the single most important measurement in the
          batch: 68 wide against the mantle's 172. That 2.5x ratio is what
          makes the top read as heavy rather than merely wide. */}
      <path
        d="M68,154 L100,161 L132,154 L134,178 L100,186 L66,178 Z"
        fill={f('url(#bl-bone)')}
        stroke={stroke}
        strokeWidth="4"
      />

      {/* tabard — hanging centre panel */}
      <path
        d="M86,180 L114,180 L112,214 L100,224 L88,214 Z"
        fill={f('url(#bl-bone)')}
        stroke={stroke}
        strokeWidth="4"
      />

      {/* ---------- BATCH 5 · sash & tabard ----------
          The sash and tabard are the only patterned surfaces on the figure.
          Everything else is plain material, and that restraint is what lets
          the weave carry weight instead of competing — a second patterned
          area would turn the middle of the character into noise. */}
      {!silhouette && (
        <g id="weave">
          {/* three wraps, each edge a slightly different length so the sash
              reads as wound rather than as one printed band */}
          <path d="M67,161 C84,166 118,166 133,161" stroke={INK} strokeWidth="2" fill="none" opacity="0.75" />
          <path d="M66,170 C84,176 116,176 134,170" stroke={INK} strokeWidth="2" fill="none" opacity="0.65" />

          {/* chevron weave. Generated from one run so the sash and the
              tabard genuinely share a pattern — hand-placing each band
              would let the two drift and then they read as two different
              fabrics that happen to be the same colour. */}
          {CHEVRON_ROWS.map((row, r) =>
            Array.from({ length: row.n }, (_, i) => {
              const w = row.span / row.n;
              const x = row.x0 + i * w;
              return (
                <path
                  key={`chev-${r}-${i}`}
                  d={`M${x},${row.y} L${x + w / 2},${row.y - row.h} L${x + w},${row.y}`}
                  stroke={BRASS}
                  strokeWidth="1.5"
                  fill="none"
                  opacity={row.o}
                />
              );
            }),
          )}

          {/* tassel fringe along the tabard's lower edge. Lengths vary and
              two of them kink — a fringe of identical straight strands
              reads as a comb, which is the same failure the first pass of
              Vigil's frayed hem hit. */}
          {Array.from({ length: 9 }, (_, i) => {
            const t = i / 8;
            /* follow the tabard's V: it drops from y214 at the edges to
               y224 at the centre, so the fringe has to track that or the
               strands hang off nothing at the middle. */
            const x = 89 + t * 22;
            const yTop = 213 + (1 - Math.abs(t - 0.5) * 2) * 9;
            const len = 6 + hash(i, 7) * 7;
            const kink = i % 4 === 1 ? 2.4 : 0;
            return (
              <path
                key={`tassel-${i}`}
                d={`M${x},${yTop} L${x + kink},${yTop + len * 0.6} L${x - kink * 0.5},${yTop + len}`}
                stroke={BONE_LO}
                strokeWidth="1.6"
                fill="none"
              />
            );
          })}
        </g>
      )}

      {/* The spiked mantle that used to sit here has been removed on
          direction. It was the figure's widest element by far and carried
          the whole anvil silhouette the spec's §2 gate was written around,
          so its removal is a silhouette change, not a detail change: the
          folded-arm tier is now the widest thing on the character and the
          read has to be re-gated against Vigil from scratch. Everything it
          owned went with it — ten shingled plates, brass seam trim, corner
          rivets, the top-edge spike row and the underside shadow.

          The mantle GRADIENT (bl-mantle) is deliberately kept: the filter
          canister still uses it, and it is the only dark metal fill on the
          figure. */}

      {/* Head, pipe crown and face wrapped in one pivot group so the touch
          reaction turns all of them together. Without the wrapper the crown
          would stay put while the helm rotated out from under it, which is
          the single most obvious way a rigid head-turn gives itself away. */}
      <g className="bl-head-pivot">
        {/* ---------- BATCH 3 · head ----------
            Pipe crown first, BEHIND the helm — the loops have to emerge from
            behind the shell and be occluded by it, or they read as drawn on
            top of the head like a decal rather than mounted to its back. */}
        {/* Scaled about the head's own centre, landing at 0.82 after bracketing
            it from both sides. At 1.0 the loops spanned roughly twice the
            helm's width and became the largest shape on the figure, putting
            the character's read on its hat rather than on the mantle the whole
            silhouette is built around. At 0.62 they collapsed into a tight
            fuzz of small rings behind the head and stopped reading as pipes at
            all. 0.82 keeps them legible as individual tubes while leaving the
            mantle the widest thing on the figure. Scaling the group rather
            than retyping seven cubics preserves the hand-authored asymmetry
            exactly, and thins the 7.5 stroke to a more tubular ~6.2. */}
        <g transform="translate(100,40) scale(0.82) translate(-100,-40)">
          {PIPE_LOOPS.map((d, i) => (
            <path
              key={`pipe-${i}`}
              d={d}
              fill="none"
              stroke={silhouette ? '#050505' : INK}
              strokeWidth="7.5"
            />
          ))}
          {/* the lit top of each loop — a thin highlight riding the outside of
              the tube so it reads as round stock rather than a flat ribbon */}
          {!silhouette &&
            PIPE_LOOPS.map((d, i) => (
              <path key={`pipe-hi-${i}`} d={d} fill="none" stroke="#4d5158" strokeWidth="2.4" opacity="0.55" />
            ))}
        </g>

        {/* helm shell — the dark shell the faceplate is set into, sitting
            inside the hood's opening */}
        <path
          d="M78,26 L74,50 L76,70 L100,78 L124,70 L126,50 L122,26 L100,18 Z"
          fill={f('url(#bl-coat)')}
          stroke={stroke}
          strokeWidth="4"
        />

        {!silhouette && (
          <g id="head_detail">
            {/* faceplate — bone, set INTO the shell rather than laid over it,
                so the shell's edge stays visible all the way round. The only
                light value above the waist, and the thing that stops the top
                half of the figure being an unreadable black mass. */}
            <path
              d="M84,36 L82,54 L86,68 L100,74 L114,68 L118,54 L116,36 L100,32 Z"
              fill="url(#bl-bone)"
              stroke={INK}
              strokeWidth="2.5"
            />

            {/* eye ports. The glow comes THROUGH a cross-hatched grille rather
                than out of an open lens — that is the difference between a
                machine that is looking and a machine with lights on, and it
                is the whole reason the grille lines are drawn over the glow
                instead of beside it. */}
            {[92, 108].map((cx) => (
              <g key={`eye-${cx}`}>
                <circle cx={cx} cy={48} r="8" fill="url(#bl-eye)" opacity="0.85" />
                <circle cx={cx} cy={48} r="5.4" fill={MAGENTA} filter="url(#bl-glow)" />
                <circle cx={cx} cy={48} r="5.4" fill="#2a0d1f" opacity="0.35" />
                {/* the grille itself, over the light */}
                <path
                  d={`M${cx - 5.4},${48} L${cx + 5.4},${48}
                      M${cx},${48 - 5.4} L${cx},${48 + 5.4}
                      M${cx - 3.9},${48 - 3.9} L${cx + 3.9},${48 + 3.9}
                      M${cx - 3.9},${48 + 3.9} L${cx + 3.9},${48 - 3.9}`}
                  stroke={INK}
                  strokeWidth="1.3"
                  opacity="0.9"
                />
                <circle cx={cx} cy={48} r="5.4" fill="none" stroke={INK} strokeWidth="2" />
              </g>
            ))}

            {/* respirator — a ridged jaw plate. The ridges run across the
                mouth, and there are four of them because three read as a
                grate and six read as corduroy. */}
            <path
              d="M88,58 L86,68 L100,75 L114,68 L112,58 Z"
              fill={BONE_LO}
              stroke={INK}
              strokeWidth="2.2"
            />
            {[61, 64.5, 68, 71].map((y, i) => (
              <path
                key={`rib-${y}`}
                d={`M${88.5 + i * 0.9},${y} L${111.5 - i * 0.9},${y}`}
                stroke={INK}
                strokeWidth="1.2"
                opacity="0.75"
              />
            ))}

            {/* Filter canister — clamped to ONE cheek. The asymmetry is the
                point: a matched pair reads as ears, which is the one thing a
                faceless mask must not have.

                Restored after the hood went in, and nudged inboard from its
                original x69-83 to x73-87. At the old position it sat under
                the hood's inner edge and was half-swallowed; it now clamps
                across the faceplate's own left edge, which reads as bolted
                to the mask rather than buried in cloth. It also has to draw
                AFTER the hood, which it does by living in head_detail. */}
            <g>
              <path
                d="M78,54 L74,56 L73,66 L77,69 L86,67 L87,56 Z"
                fill="url(#bl-mantle)"
                stroke={INK}
                strokeWidth="2.2"
              />
              <path d="M75,59 L85,58 M75,63 L85,62" stroke={INK} strokeWidth="1.1" opacity="0.7" />
              <circle cx="80" cy="63.5" r="1.4" fill={BRASS} stroke={INK} strokeWidth="0.7" />
              {/* short hose from the canister into the jaw */}
              <path d="M86,62 C89,63 90,64 91,66" stroke={INK} strokeWidth="3.4" fill="none" />
            </g>

            {/* brow line — one hard shadow where the shell overhangs the
                faceplate, which is what makes the face read as recessed */}
            <path d="M83,38 C92,34 108,34 117,38" stroke={INK} strokeWidth="2.4" fill="none" opacity="0.8" />
          </g>
        )}
      </g>

      {/* ---------- HOOD, DOWN ----------
          The hood is pushed BACK off the head and bunched across the
          shoulders — it is not worn up. Three consequences follow, and all
          three are the reason this is a separate element rather than a
          reshaped version of the raised hood it replaces:

          1. It renders AFTER the head, so the helm's lower edge disappears
             into the collar and the head reads as emerging FROM the cloth
             rather than sitting on top of it.
          2. It renders OUTSIDE the bl-head-pivot group, so it does not turn
             when the head does. A pushed-back hood rests on the shoulders;
             it belongs to the body, not the skull.
          3. It occupies the shoulder band the removed mantle used to fill,
             which is what stops that area reading as an empty gap.

          Built as a solid bunched mass with a scalloped lower edge rather
          than as a thin crescent: gathered cloth is thick, and a thin arc
          here would read as a scarf. */}
      <path
        d="M48,134
           C45,106 57,84 78,78
           C90,74 110,74 122,78
           C143,84 155,106 152,134
           C142,127 130,123 118,122
           C112,128 88,128 82,122
           C70,123 58,127 48,134 Z"
        fill={f('url(#bl-mantle)')}
        stroke={stroke}
        strokeWidth="4"
      />

      {!silhouette && (
        <g id="hood_folds" fill="none" stroke={INK} strokeLinecap="round">
          {/* The "lines through it". Folds radiate from where the hood is
              gathered behind the neck and fan outward as the cloth spreads
              over the shoulders — parallel lines would read as corrugated
              metal, and only a fan reads as fabric under tension from a
              single point. Lengths and spacing are uneven on purpose. */}
          <path d="M92,80 C80,88 68,102 62,126" strokeWidth="2.2" opacity="0.7" />
          <path d="M96,79 C88,88 79,102 75,124" strokeWidth="1.7" opacity="0.6" />
          <path d="M108,80 C120,88 132,102 138,126" strokeWidth="2.2" opacity="0.7" />
          <path d="M104,79 C112,88 121,102 125,124" strokeWidth="1.7" opacity="0.6" />
          {/* the gathered ridge itself, arcing behind the neck */}
          <path d="M80,84 C88,78 112,78 120,84" strokeWidth="2.4" opacity="0.75" />
          {/* two short creases where the mass folds over onto itself */}
          <path d="M56,122 C62,118 68,118 72,121" strokeWidth="1.5" opacity="0.55" />
          <path d="M144,122 C138,118 132,118 128,121" strokeWidth="1.5" opacity="0.55" />
          {/* the hollow of the hood's opening, just visible behind the neck */}
          <path
            d="M84,84 C90,80 110,80 116,84 C112,90 88,90 84,84 Z"
            fill="#0c0e10"
            stroke="none"
            opacity="0.8"
          />
        </g>
      )}

      {/* FOLDED ARMS — widened to 108 (was 84) and pushed below the mantle's
          lower edge, because the second gate failure turned on this shape
          rather than on the mantle.

          With the arms tucked entirely inside the mantle's footprint there
          was nothing in the silhouette a viewer could read AS arms — so the
          eye assigned that job to the only thing projecting horizontally,
          which was the mantle's tips, and the figure became a scarecrow.
          Giving the arms their own visible tier means the mantle is no
          longer the widest arm-shaped thing on the figure, and the read
          resolves into three stacked steps instead: mantle 172 · arms 108 ·
          sash 68 · coat hem 120. */}
      <path
        d="M46,106 L44,130 L54,148 L100,155 L146,148 L156,130 L154,106
           L124,99 L100,104 L76,99 Z"
        fill={f('url(#bl-coat)')}
        stroke={stroke}
        strokeWidth="4"
      />
      {/* ---------- BATCH 4 · arms ----------
          The elbow quills go OUTSIDE the silhouette guard: they break the
          outline at both ends of the arm tier and are the only element in
          this batch that changes the figure's flat shape. Everything else
          is surface. */}
      {[
        { x: 48, dir: -1, n: 5 },
        { x: 152, dir: 1, n: 3 },
      ].map((side) =>
        Array.from({ length: side.n }, (_, i) => {
          /* fanned back and slightly down, longest in the middle of the fan.
             Counts differ left to right (5 vs 3) on purpose — a matched pair
             reads as a costume, an unmatched one as accumulated kit. */
          const t = side.n === 1 ? 0.5 : i / (side.n - 1);
          const y = 112 + t * 26;
          const len = 9 + Math.sin(t * Math.PI) * 7;
          const droop = (t - 0.4) * 6;
          return (
            <path
              key={`quill-${side.x}-${i}`}
              d={`M${side.x},${y - 2.4} L${side.x + side.dir * len},${y + droop} L${side.x},${y + 2.4} Z`}
              fill={silhouette ? '#050505' : INK}
            />
          );
        }),
      )}

      {/* ---------- BATCH 7 · grime, threads and rim light ----------
          Grime goes on LAST of the surface work so it can fall across seams
          and panel edges rather than being drawn under them. Dirt that
          respects panel boundaries reads as paint. */}
      {!silhouette && (
        <g id="grime">
          {GRIME.map((g, i) => (
            <ellipse
              key={`grime-${i}`}
              cx={g.x}
              cy={g.y}
              rx={g.rx}
              ry={g.ry}
              fill="url(#bl-grime)"
              transform={`rotate(${g.r}, ${g.x}, ${g.y})`}
            />
          ))}
          {/* loose threads — a handful at the coat hem and tabard fringe.
              The spec's detail inventory calls these out at thread level,
              and they are the cheapest possible signal that the garment is
              old: three hairlines that escape the outline. */}
          {[
            'M49,262 C48,268 50,272 47,276',
            'M137,264 C139,270 137,274 140,278',
            'M97,224 C96,231 98,235 96,240',
            'M62,257 C61,262 63,265 61,269',
          ].map((d, i) => (
            <path
              key={`thread-${i}`}
              d={d}
              stroke={i === 2 ? BONE_LO : INK}
              strokeWidth="0.8"
              fill="none"
              opacity="0.7"
            />
          ))}
        </g>
      )}

      {!silhouette && (
        <g id="arms_detail">
          {/* the fold — one forearm crossing over the other. Drawn as a real
              edge with the upper arm's cuff overlapping it, because a single
              diagonal line (what batch 1 used as a placeholder) reads as a
              crease in one shape rather than as two limbs stacked. */}
          <path
            d="M60,112 C78,126 104,136 138,138"
            stroke={INK}
            strokeWidth="3"
            fill="none"
          />
          {/* the lower forearm's own mass, sitting under the upper one */}
          <path
            d="M58,116 C80,130 108,140 142,141 L144,148 C106,148 76,138 56,126 Z"
            fill="#1a1d21"
            stroke={INK}
            strokeWidth="2.2"
          />

          {/* quilt seams — arcs across the sleeve following the arm's
              curve, not straight lines. Spacing tightens toward the elbow
              where padding bunches. */}
          {[
            'M52,116 C70,128 96,137 130,139',
            'M54,124 C72,135 98,143 132,145',
            'M66,106 C84,116 108,124 140,126',
            'M74,102 C90,110 112,117 144,119',
          ].map((d, i) => (
            <path key={`quilt-${i}`} d={d} stroke={INK} strokeWidth="1.4" fill="none" opacity="0.55" />
          ))}

          {/* forearm straps — two per arm, with a visible buckle plate and
              pin on each. The buckles sit off-centre so the two arms don't
              mirror each other. */}
          {[
            { x: 76, y: 132, w: 22, rot: 12 },
            { x: 112, y: 137, w: 20, rot: 6 },
          ].map((s, i) => (
            <g key={`strap-${i}`} transform={`rotate(${s.rot}, ${s.x}, ${s.y})`}>
              <path
                d={`M${s.x - s.w / 2},${s.y - 7} L${s.x + s.w / 2},${s.y - 7}
                    L${s.x + s.w / 2},${s.y + 7} L${s.x - s.w / 2},${s.y + 7} Z`}
                fill="#24272c"
                stroke={INK}
                strokeWidth="2.2"
              />
              {/* A solid brass block with a single bar through it renders as
                  a pause glyph — two equal brass rectangles either side of a
                  line, which is exactly what that icon is. A buckle needs a
                  visible WINDOW: brass frame, dark opening, pin crossing the
                  opening. Same three elements a real buckle has, and the
                  hole is what stops it reading as a symbol. */}
              <rect
                x={s.x - 5}
                y={s.y - 5.5}
                width="10"
                height="11"
                rx="2"
                fill={BRASS}
                stroke={INK}
                strokeWidth="1.4"
              />
              <rect x={s.x - 2.6} y={s.y - 3.4} width="5.2" height="6.8" rx="1" fill="#191c20" />
              <path d={`M${s.x},${s.y - 5.5} L${s.x},${s.y + 5.5}`} stroke={INK} strokeWidth="1.1" />
            </g>
          ))}

          {/* gloved hand, tucked into the opposite elbow, ending in short
              talons. Only one hand is visible — the other is buried under
              the fold, which is what folded arms actually do. */}
          <path
            d="M132,126 C142,126 148,131 147,138 C146,144 138,146 130,143 Z"
            fill="#24272c"
            stroke={INK}
            strokeWidth="2.4"
          />
          {[0, 1, 2].map((i) => (
            <path
              key={`talon-${i}`}
              d={`M${142 + i * 2},${131 + i * 4} L${150 + i * 1.5},${132 + i * 4.5} L${142 + i * 2},${134 + i * 4} Z`}
              fill={INK}
            />
          ))}
        </g>
      )}

      {/* ---------- rim light ----------
          Drawn last, over everything, as a set of magenta strokes tracing
          the outer edges of the silhouette's own shapes.

          Tracing the SAME path data the masses use, rather than hand-drawing
          a highlight, is the whole trick: the rim cannot drift from the
          figure because it IS the figure, restroked. It is also why this is
          cheap to keep correct when a mass changes later.

          Only the outward-facing masses get one — mantle, coat, boots, head.
          Rimming interior shapes too would light the character from every
          direction at once, which reads as a glow rather than as an edge. */}
      {!silhouette && (
        /* Dialled back hard after rendering. The first pass ran the bloom at
            opacity 0.75 / strokeWidth 3 and the result was a neon outline
            that became the loudest thing on the figure — it washed out the
            plating, the weave and the grime that six batches went into. A
            rim light's job is to separate the figure from the background at
            its edge, not to be seen; if you notice it as an effect it is
            already too strong. Now roughly a third of that intensity. */
        <g id="rim" className="bl-rim" fill="none" stroke={MAGENTA} strokeLinejoin="round">
          <g filter="url(#bl-rim)" opacity="0.26" strokeWidth="2.4">
            <path d="M68,158 L58,188 L48,220 L41,252 L78,258 L82,220 L85,188 L86,160 Z" />
            <path d="M132,158 L142,188 L152,220 L159,252 L122,258 L118,220 L115,188 L114,160 Z" />
            <path d="M78,26 L74,50 L76,70 L100,78 L124,70 L126,50 L122,26 L100,18 Z" />
            <path d="M46,106 L44,130 L54,148 L100,155 L146,148 L156,130 L154,106 L124,99 L100,104 L76,99 Z" />
          </g>
          {/* a tighter, brighter core pass so the rim has an edge rather
              than being only a soft bloom */}
          <g opacity="0.3" strokeWidth="0.8">
            <path d="M78,26 L74,50 L76,70 L100,78 L124,70 L126,50 L122,26 L100,18 Z" />
          </g>
        </g>
      )}
    </svg>
  );
}

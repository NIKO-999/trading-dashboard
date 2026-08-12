/* ============================================================
   Crew art — ten genuinely different silhouettes, not ten recolours.

   Voyager is one continuous biped figure with swappable layers. These are
   the opposite on purpose: each crewmate is its own small shape language,
   because the whole point of the roster is that it doesn't read as
   "Voyager again."

   ---------- THE REGISTER ----------

   These are PETS, and that word is doing real work. The temptation, coming
   off the sentinel figures, is to import that vocabulary wholesale — panel
   seams, rivets, grime, battle wear. That is actively wrong here: an early
   pass at Bedrock grew articulated knee joints, a recessed sensor housing
   and ground-anchor spikes, and became a military walker.

   Detail on a pet means something different from detail on a sentinel:

     · proportion       oversized head, small body — the inverse of armour
     · eyes             a lens that LOOKS at you, with an iris and a
                        highlight, not an instrument aperture
     · wear             well-loved, not battle-scarred: scuffed paint, a
                        mismatched repair patch, a dangling tag
     · line             softer and rounder; hard chamfers read as equipment
     · silhouette       one endearing quirk that breaks the outline

   Mixed kinds on purpose — machines, creatures, spirits, constructs — so
   ten companions don't collapse into ten variations of one idea.

   Two export shapes, same reason CharacterFigure/CharacterArt are split from
   Voyager's own gradients: `CharacterFigure` is bare shapes for embedding
   inside another SVG (Voyager stands one beside itself), `CharacterArt`
   wraps it in its own <svg> for standalone use (the crew grid, the preview
   lab). Gradient/filter ids take a `uid` so two instances on one page never
   collide — same technique as Voyager's own useId namespacing.

   Idle motion (.pl-pulse / .pl-swing / .pl-bob) lives in characterArt.css.
   ============================================================ */

import { useId } from 'react';
import './characterArt.css';

/** Ink weight. The crew share a 100x130 viewBox against the outfit figures'
 *  200x260 — exactly half — so ink has to be half the width to carry the
 *  same visual weight. 4 here would double it and turn a pet into a sticker. */
const INK = '#221f22';
const INK_MAIN = 2;
const INK_SUB = 1.2;
const INK_FINE = 0.7;

export function CharacterFigure({ id, uid }: { id: string; uid: string }) {
  const gid = (n: string) => `${n}-${id}-${uid}`;

  switch (id) {
    /* ============================================================
       BEACON — hovering lantern-drone. Machine register.

       The shipped version was an instrument: a lamp with a technical
       aperture, a straight capsule hull, and a lens that looked THROUGH
       you. Three changes make it a pet instead:

       1. Proportion inverted. The lamp is now wider than the body it sits
          on. Armour puts a small head on a big frame; a pet does the
          opposite, and that single ratio does more than any amount of
          added detail.
       2. The lens is an EYE. It has an iris, a pupil and an off-centre
          catchlight, so it reads as looking AT you rather than emitting.
          The catchlight is the whole trick — without it any circle is a
          lamp, with it any circle is alive.
       3. Wear is affectionate, not military. A mismatched repair patch
          riveted over one shoulder, a scuffed nose, and a luggage tag on a
          loop that swings. Someone has been keeping this thing running.
       ============================================================ */
    case 'beacon':
      return (
        <>
          <defs>
            <linearGradient id={gid('hull')} x1="0.25" y1="0" x2="0.8" y2="1">
              <stop offset="0%" stopColor="#f2f6ff" />
              <stop offset="55%" stopColor="#c3d0ea" />
              <stop offset="100%" stopColor="#7f8fb8" />
            </linearGradient>
            <radialGradient id={gid('glass')} cx="0.38" cy="0.32" r="0.72">
              <stop offset="0%" stopColor="#fff8e0" />
              <stop offset="45%" stopColor="#f9cf5e" />
              <stop offset="100%" stopColor="#b8791a" />
            </radialGradient>
            <radialGradient id={gid('hover')} cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#8fb4ff" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#8fb4ff" stopOpacity="0" />
            </radialGradient>
            <filter id={gid('glow')} x="-90%" y="-90%" width="280%" height="280%">
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* hover pool with a downdraft dimple, so floating reads as
              thrust rather than as a drop shadow */}
          <ellipse className="pl-contact" cx="50" cy="121" rx="24" ry="5.5" fill={`url(#${gid('hover')})`} />
          <ellipse className="pl-contact" cx="50" cy="120" rx="9" ry="2.2" fill="#8fb4ff" fillOpacity="0.3" />

          {/* fin-ears. Angled forward and rounded at the tip — the shipped
              version had them as flat swept triangles, which read as
              stabilisers. Ears tilt, fins don't. */}
          {[
            { d: 'M31,44 C22,38 17,44 20,52 C23,58 29,56 32,52 Z', r: -8 },
            { d: 'M69,44 C78,38 83,44 80,52 C77,58 71,56 68,52 Z', r: 8 },
          ].map((ear) => (
            <path
              key={ear.d}
              d={ear.d}
              fill="#aebbd6"
              stroke={INK}
              strokeWidth={INK_SUB}
              strokeLinejoin="round"
            />
          ))}

          {/* body — small, egg-shaped, and clearly secondary to the lamp */}
          <path
            d="M39,70 C39,63 61,63 61,70 L63,92 C63,100 37,100 37,92 Z"
            fill={`url(#${gid('hull')})`}
            stroke={INK}
            strokeWidth={INK_MAIN}
            strokeLinejoin="round"
          />
          {/* a repair patch someone riveted on — deliberately a different
              value from the hull, because a matching patch isn't a repair */}
          <path d="M40,76 L52,74 L53,86 L41,88 Z" fill="#93a2c4" stroke={INK} strokeWidth={INK_SUB} strokeLinejoin="round" />
          {[[42, 78], [51, 77], [42, 86], [51, 85]].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.9" fill={INK} opacity="0.6" />
          ))}

          {/* running lights along the belly */}
          {[43, 50, 57].map((x, i) => (
            <circle
              key={x}
              className="pl-pulse"
              cx={x}
              cy={94}
              r={i === 1 ? 1.7 : 1.3}
              fill="#f0a52e"
              style={{ filter: `url(#${gid('glow')})`, animationDelay: `${i * 0.4}s` }}
            />
          ))}

          {/* collar under the lamp */}
          <path d="M38,64 L62,64 L59,70 L41,70 Z" fill="#8a6a1c" stroke={INK} strokeWidth={INK_SUB} strokeLinejoin="round" />

          {/* THE LAMP — wider than the body beneath it */}
          <circle cx="50" cy="42" r="25" fill={`url(#${gid('glass')})`} stroke={INK} strokeWidth={INK_MAIN} />
          {/* two stepped bands only. The shipped version had concentric
              fresnel rings, which at icon scale read as a bullseye target
              — anatomically right, visually a dartboard. */}
          <path d="M28,33 L72,33 M28,53 L72,53" stroke="#b8791a" strokeWidth={INK_FINE} opacity="0.45" />

          {/* the eye: iris ring, dark pupil, and the catchlight that makes
              the whole figure read as alive rather than lit */}
          <circle cx="50" cy="42" r="12" fill="#c98a1f" opacity="0.55" />
          <circle cx="50" cy="42" r="8" fill="#2b2110" stroke={INK} strokeWidth={INK_FINE} />
          <circle className="pl-pulse" cx="50" cy="42" r="4.4" fill="#ffd76a" style={{ filter: `url(#${gid('glow')})` }} />
          <circle cx="45.5" cy="37.5" r="3.4" fill="#ffffff" opacity="0.85" />
          <circle cx="55" cy="47" r="1.5" fill="#ffffff" opacity="0.4" />

          {/* a nub of an aerial with a bobble — the endearing quirk that
              breaks the silhouette */}
          <path d="M50,17 C50,12 46,11 46,7" fill="none" stroke={INK} strokeWidth={INK_SUB} strokeLinecap="round" />
          <circle cx="46" cy="6" r="3" fill="#f0a52e" stroke={INK} strokeWidth={INK_FINE} />

          {/* luggage tag on a loop, hanging off the collar */}
          <g className="pl-swing" style={{ transformOrigin: '62px 68px' }}>
            <path d="M62,68 C66,72 66,76 64,79" fill="none" stroke={INK} strokeWidth={INK_FINE} />
            <path d="M60,79 L69,79 L70,87 L61,87 Z" fill="#e0c98a" stroke={INK} strokeWidth={INK_SUB} strokeLinejoin="round" />
            <path d="M62,82 L67,82 M62,84.5 L66,84.5" stroke={INK} strokeWidth={INK_FINE} opacity="0.7" />
          </g>

          {/* scuffs on the nose */}
          <path d="M41,72 L44,73 M57,71 L60,72" stroke={INK} strokeWidth={INK_FINE} opacity="0.35" />
        </>
      );

    /* ============================================================
       BEDROCK — low shelled grazer. Creature register.

       The first attempt at this one went badly and is worth recording: it
       grew articulated knee joints, a recessed sensor housing and ground
       spikes, and turned into a military walker. The fix isn't less
       detail, it's detail of a different KIND — a creature that has stood
       in one place so long that things have started growing on it says
       "patient" far better than hardware does.
       ============================================================ */
    case 'bedrock':
      return (
        <>
          <defs>
            <linearGradient id={gid('shell')} x1="0.3" y1="0" x2="0.7" y2="1">
              <stop offset="0%" stopColor="#e0d5bd" />
              <stop offset="50%" stopColor="#b09a79" />
              <stop offset="100%" stopColor="#6b5942" />
            </linearGradient>
            <linearGradient id={gid('hide')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a08a6c" />
              <stop offset="100%" stopColor="#5f5039" />
            </linearGradient>
          </defs>

          <ellipse className="pl-contact" cx="50" cy="116" rx="38" ry="5" fill="#3a3226" fillOpacity="0.3" />

          {/* stubby legs — soft columns with a rounded pad, no joints.
              A creature this heavy doesn't articulate, it plants. */}
          {[22, 40, 60, 78].map((x, i) => (
            <path
              key={x}
              d={`M${x - 6},${88 + (i % 2) * 2} L${x - 7},108 C${x - 7},113 ${x + 7},113 ${x + 7},108
                  L${x + 6},${88 + (i % 2) * 2} Z`}
              fill={`url(#${gid('hide')})`}
              stroke={INK}
              strokeWidth={INK_SUB}
              strokeLinejoin="round"
            />
          ))}

          {/* shell — a soft dome, wider than it is tall */}
          <path
            d="M8,92 C8,58 26,44 50,44 C74,44 92,58 92,92 C70,101 30,101 8,92 Z"
            fill={`url(#${gid('shell')})`}
            stroke={INK}
            strokeWidth={INK_MAIN}
            strokeLinejoin="round"
          />
          {/* scalloped rim — the shell's growth edge */}
          <path
            d="M8,92 C16,96 24,97 32,97 C40,97 44,94 50,94 C56,94 60,97 68,97 C76,97 84,96 92,92"
            fill="none"
            stroke={INK}
            strokeWidth={INK_SUB}
            opacity="0.7"
          />
          {/* plate seams radiating from the crown, not parallel bands —
              a dome is made of wedges meeting at the top */}
          {[20, 35, 50, 65, 80].map((x) => (
            <path
              key={`seg-${x}`}
              d={`M50,45 Q${(50 + x) / 2},70 ${x},${94 - Math.abs(50 - x) * 0.08}`}
              fill="none"
              stroke="#6b5942"
              strokeWidth={INK_FINE}
              opacity="0.45"
            />
          ))}

          {/* MOSS. The character has held one position long enough for
              things to start growing on it, which does the work "armour
              plating" was trying to do and does it as a creature. */}
          <path d="M26,54 C32,50 40,50 44,54 C40,58 30,59 26,54 Z" fill="#6e8a52" opacity="0.75" />
          <path d="M62,50 C68,47 74,48 77,52 C72,56 65,55 62,50 Z" fill="#6e8a52" opacity="0.6" />
          {/* one small sprout — the endearing silhouette break */}
          <path d="M40,50 C39,42 42,38 45,36" fill="none" stroke="#7fa25e" strokeWidth={INK_SUB} strokeLinecap="round" />
          <path d="M45,36 C41,34 40,38 44,39" fill="#8fb56a" stroke={INK} strokeWidth={INK_FINE} />
          <path d="M45,36 C49,33 51,37 46,39" fill="#8fb56a" stroke={INK} strokeWidth={INK_FINE} />

          {/* a chip out of the rim — old, worn smooth, not fresh damage */}
          <path d="M78,90 C82,86 86,88 86,92 C83,93 80,92 78,90 Z" fill="#6b5942" opacity="0.6" />

          {/* head — low and forward, sleepy. Half-lidded eyes are two
              short arcs over the pupils; a fully open circle would read as
              alert, and this animal is neither alarmed nor going anywhere. */}
          <path
            d="M38,82 C38,74 62,74 62,82 L60,96 C56,99 44,99 40,96 Z"
            fill={`url(#${gid('hide')})`}
            stroke={INK}
            strokeWidth={INK_MAIN}
            strokeLinejoin="round"
          />
          {[45, 55].map((cx) => (
            <g key={cx}>
              <circle cx={cx} cy="88" r="3.4" fill="#2a2620" />
              <circle cx={cx + 1} cy="86.8" r="1.2" fill="#ffffff" opacity="0.8" />
              <path
                d={`M${cx - 4},${86.5} C${cx - 2},${84.5} ${cx + 2},${84.5} ${cx + 4},${86.5}`}
                fill="none"
                stroke={INK}
                strokeWidth={INK_SUB}
                strokeLinecap="round"
              />
            </g>
          ))}
          {/* two nostril dots — cheap, and it makes the head a face */}
          <circle cx="47.5" cy="94" r="0.9" fill={INK} opacity="0.6" />
          <circle cx="52.5" cy="94" r="0.9" fill={INK} opacity="0.6" />
        </>
      );

    /* ============================================================
       WISP — drifting ring. Spirit register.

       The hardest of the ten to make read as a PET, because it has no
       body, no face and nothing to hold. Solved with two motes sitting in
       the ring's hollow: they track together, they blink, and the eye
       instantly assigns them as eyes. Two lights at the same height is
       apparently all a face needs.
       ============================================================ */
    case 'wisp':
      return (
        <>
          <defs>
            <radialGradient id={gid('halo')} cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#dcc9ff" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#dcc9ff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={gid('ring')} x1="0" y1="0" x2="0.6" y2="1">
              <stop offset="0%" stopColor="#fbf5ff" />
              <stop offset="45%" stopColor="#cbb8ff" />
              <stop offset="100%" stopColor="#8b74d4" />
            </linearGradient>
            <linearGradient id={gid('tendril')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cbb8ff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#cbb8ff" stopOpacity="0.04" />
            </linearGradient>
            <filter id={gid('soft')} x="-90%" y="-90%" width="280%" height="280%">
              <feGaussianBlur stdDeviation="2" />
            </filter>
          </defs>

          <ellipse cx="50" cy="46" rx="38" ry="34" fill={`url(#${gid('halo')})`} />

          {/* four tendrils, curling rather than hanging straight, each a
              different length. Straight parallel trails read as a
              jellyfish diagram; curl and variation read as drifting. */}
          <g className="pl-swing" style={{ transformOrigin: '50px 52px' }}>
            {[
              'M36,62 C28,80 34,94 28,110 C26,116 30,120 27,126',
              'M45,66 C42,86 47,100 43,118',
              'M56,65 C62,84 56,98 61,114 C63,120 59,123 61,128',
              'M64,60 C74,76 70,90 74,104',
            ].map((d, i) => (
              <path
                key={d}
                d={d}
                fill="none"
                stroke={`url(#${gid('tendril')})`}
                strokeWidth={i % 2 === 0 ? 5.5 : 4}
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* the ring — broken, not closed. A perfect torus reads as a
              manufactured object; a gap makes it something that formed. */}
          <path
            d="M50,26 A20,20 0 1 1 33,56"
            fill="none"
            stroke={`url(#${gid('ring')})`}
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path
            d="M50,26 A20,20 0 1 1 33,56"
            fill="none"
            stroke="#fbf5ff"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />

          {/* the two motes that make it a face */}
          {[44, 57].map((cx, i) => (
            <g key={cx}>
              <circle cx={cx} cy="46" r="5" fill="#dcc9ff" opacity="0.35" filter={`url(#${gid('soft')})`} />
              <circle
                className="pl-pulse"
                cx={cx}
                cy="46"
                r="2.6"
                fill="#fbf5ff"
                style={{ animationDelay: `${i * 0.25}s` }}
              />
            </g>
          ))}

          {/* orbiting motes at varied sizes and distances */}
          {[
            [24, 28, 1.7],
            [76, 34, 1.4],
            [68, 16, 1.1],
            [30, 62, 1.2],
            [80, 62, 0.9],
          ].map(([cx, cy, r]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="#f6ecff" opacity="0.75" />
          ))}
        </>
      );

    /* ============================================================
       ANCHOR — weighted bell-buoy. Machine register.

       Its discipline is not tipping over, so the design's whole job is to
       look like it CANNOT tip: a round bottom, all the mass low, and a
       permanent slight lean that reads as mid-rock rather than mid-fall.
       Drawn tilted rather than upright on purpose — an upright buoy is
       just a shape, a leaning one is a thing that rights itself.
       ============================================================ */
    case 'anchor':
      return (
        <>
          <defs>
            <linearGradient id={gid('bell')} x1="0.25" y1="0" x2="0.8" y2="1">
              <stop offset="0%" stopColor="#9aa3b4" />
              <stop offset="50%" stopColor="#5f6675" />
              <stop offset="100%" stopColor="#2d3138" />
            </linearGradient>
            <radialGradient id={gid('core')} cx="0.4" cy="0.34" r="0.7">
              <stop offset="0%" stopColor="#fff3cf" />
              <stop offset="45%" stopColor="#f5ad35" />
              <stop offset="100%" stopColor="#9c5410" />
            </radialGradient>
            <filter id={gid('glow')} x="-90%" y="-90%" width="280%" height="280%">
              <feGaussianBlur stdDeviation="2.4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <ellipse className="pl-contact" cx="50" cy="118" rx="28" ry="5" fill="#20242a" fillOpacity="0.4" />

          <g transform="rotate(-7 50 106)">
            {/* BELL, not egg. The first attempt drew this as a smooth ovoid
                and it read as an egg with a light in it — plain, and barely
                distinguishable from the version it was replacing. A buoy
                that self-rights needs its mass visibly LOW: a narrow
                shoulder flaring hard into a wide heavy skirt. The flare is
                what says "this comes back upright"; a symmetrical ovoid
                says nothing about which way is up. */}
            <path
              d="M50,30 C63,33 69,50 68,66 C71,82 80,95 80,105
                 C80,114 66,120 50,120 C34,120 20,114 20,105
                 C20,95 29,82 32,66 C31,50 37,33 50,30 Z"
              fill={`url(#${gid('bell')})`}
              stroke={INK}
              strokeWidth={INK_MAIN}
              strokeLinejoin="round"
            />
            {/* the heavy rim — a thick band around the widest point, which
                is where all the weight is meant to be */}
            <path
              d="M21,106 C30,114 70,114 79,106 L79,110 C70,118 30,118 21,110 Z"
              fill="#3c424c"
              stroke={INK}
              strokeWidth={INK_SUB}
              strokeLinejoin="round"
            />
            <path d="M22,100 C32,107 68,107 78,100" fill="none" stroke={INK} strokeWidth={INK_SUB} opacity="0.6" />

            {/* barnacles — bigger and clustered on ONE side, because growth
                collects where a thing consistently sits low in the water.
                The first pass scattered them evenly at r≈2 and they simply
                disappeared at icon scale. */}
            {[
              [28, 96, 4],
              [34, 104, 3.2],
              [24, 88, 2.6],
              [41, 108, 2.4],
              [70, 100, 2.8],
            ].map(([cx, cy, r]) => (
              <g key={`${cx}-${cy}`}>
                <circle cx={cx} cy={cy} r={r} fill="#8d95a4" stroke={INK} strokeWidth={INK_FINE} />
                <circle cx={cx} cy={cy} r={r * 0.45} fill="#2d3138" />
              </g>
            ))}
            <ellipse cx="70" cy="82" rx="8" ry="12" fill="#8a5a2c" opacity="0.3" />

            {/* the eye — bigger, with a real iris ring so it reads as
                looking rather than as a porthole */}
            <circle cx="50" cy="62" r="19" fill="#1b1e23" stroke={INK} strokeWidth={INK_MAIN} />
            <circle cx="50" cy="62" r="13" fill="#7a4a10" opacity="0.5" />
            <circle className="pl-pulse" cx="50" cy="62" r="9" fill={`url(#${gid('core')})`} style={{ filter: `url(#${gid('glow')})` }} />
            <circle cx="45" cy="57" r="3.6" fill="#ffffff" opacity="0.85" />
            <circle cx="55" cy="67" r="1.4" fill="#ffffff" opacity="0.4" />

            {/* lifting ring, bent out of true — the endearing quirk, and
                thicker than the first pass so it doesn't read as wire */}
            <path d="M50,30 C50,21 43,19 44,12" fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
            <circle cx="44" cy="9" r="5" fill="none" stroke={INK} strokeWidth="3" />
          </g>
        </>
      );

    /* ============================================================
       AEGIS — folding guardian. Construct register.

       The one that has to stay dignified: it gates the lifetime metric, so
       it is the last thing you earn. Kept tall and angular, but the plates
       are caught HALF-OPEN rather than sealed — a closed construct is
       furniture, and the gap is where the warmth shows.
       ============================================================ */
    case 'aegis':
      return (
        <>
          <defs>
            <linearGradient id={gid('plate')} x1="0.15" y1="0" x2="0.85" y2="1">
              <stop offset="0%" stopColor="#eef1f8" />
              <stop offset="50%" stopColor="#aab5cd" />
              <stop offset="100%" stopColor="#5a6482" />
            </linearGradient>
            <linearGradient id={gid('inner')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffe9b0" />
              <stop offset="100%" stopColor="#e08a2e" />
            </linearGradient>
            <filter id={gid('warm')} x="-90%" y="-90%" width="280%" height="280%">
              <feGaussianBlur stdDeviation="2.6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <ellipse className="pl-contact" cx="50" cy="122" rx="24" ry="4.5" fill="#2a3040" fillOpacity="0.4" />

          {/* the warm interior, glimpsed between the plates. Drawn FIRST so
              every plate laid over it crops the glow naturally — painting
              light on top would read as a decal. */}
          <path d="M44,44 L56,44 L58,104 L42,104 Z" fill={`url(#${gid('inner')})`} style={{ filter: `url(#${gid('warm')})` }} />

          {/* four petal plates, two per side, caught mid-open at different
              angles so it reads as unfolding rather than as a finished
              symmetrical object */}
          {[
            { d: 'M46,40 L30,50 L26,92 L44,104 Z', o: 1 },
            { d: 'M54,40 L70,48 L76,90 L56,104 Z', o: 1 },
            { d: 'M47,42 L38,54 L36,94 L47,102 Z', o: 0.75 },
            { d: 'M53,42 L63,52 L64,92 L53,102 Z', o: 0.75 },
          ].map((p) => (
            <path
              key={p.d}
              d={p.d}
              fill={`url(#${gid('plate')})`}
              opacity={p.o}
              stroke={INK}
              strokeWidth={INK_MAIN}
              strokeLinejoin="round"
            />
          ))}

          {/* seam lights running the length of the two outer plates */}
          <path d="M31,54 L28,90 M69,52 L73,88" fill="none" stroke="#ffd48a" strokeWidth={INK_SUB} opacity="0.8" style={{ filter: `url(#${gid('warm')})` }} />

          {/* head — a hood tipped very slightly, which is the whole
              difference between "monument" and "paying attention" */}
          <g transform="rotate(-4 50 34)">
            <path
              d="M50,10 L64,26 L60,44 L40,44 L36,26 Z"
              fill={`url(#${gid('plate')})`}
              stroke={INK}
              strokeWidth={INK_MAIN}
              strokeLinejoin="round"
            />
            {/* single warm eye, wide rather than a slit — a slit reads as a
                weapon sight, an oval reads as an eye */}
            <ellipse cx="50" cy="31" rx="7.5" ry="5" fill="#1c2028" stroke={INK} strokeWidth={INK_FINE} />
            <ellipse className="pl-pulse" cx="50" cy="31" rx="4.6" ry="3.1" fill="#ffcf7a" style={{ filter: `url(#${gid('warm')})` }} />
            <circle cx="47.6" cy="29.6" r="1.5" fill="#ffffff" opacity="0.85" />
          </g>

          {/* two small feet, toed slightly outward */}
          {[38, 62].map((x, i) => (
            <path
              key={x}
              d={`M${x - 5},104 L${x + 5},104 L${x + (i ? 8 : 4)},120 L${x + (i ? -4 : -8)},120 Z`}
              fill="#4a5470"
              stroke={INK}
              strokeWidth={INK_SUB}
              strokeLinejoin="round"
            />
          ))}
        </>
      );

    /* ============================================================
       EMBER — coal-hearted furball. Creature register.

       Fur is the whole problem and the whole solution. A smooth outline
       reads as plastic no matter what is drawn inside it, so the
       silhouette itself is scalloped — the OUTLINE is the fur, not a
       texture applied over a round body.
       ============================================================ */
    case 'ember':
      return (
        <>
          <defs>
            <radialGradient id={gid('fur')} cx="0.4" cy="0.3" r="0.8">
              <stop offset="0%" stopColor="#8a6a55" />
              <stop offset="60%" stopColor="#5d4638" />
              <stop offset="100%" stopColor="#33261e" />
            </radialGradient>
            <radialGradient id={gid('coal')} cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#fff0c4" />
              <stop offset="40%" stopColor="#f77c2a" />
              <stop offset="100%" stopColor="#8e2c08" stopOpacity="0" />
            </radialGradient>
            <filter id={gid('heat')} x="-90%" y="-90%" width="280%" height="280%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <ellipse className="pl-contact" cx="50" cy="116" rx="26" ry="4.5" fill="#2e2018" fillOpacity="0.4" />

          {/* the coal, glowing THROUGH the fur from inside the chest */}
          <ellipse cx="50" cy="82" rx="17" ry="14" fill={`url(#${gid('coal')})`} style={{ filter: `url(#${gid('heat')})` }} opacity="0.75" />

          {/* body — outline scalloped into tufts all the way round */}
          <path
            d="M50,42 C60,42 66,47 68,52 C74,52 77,58 74,63 C79,67 79,75 75,79
               C79,85 76,93 71,95 C72,102 66,108 60,107 C58,113 42,113 40,107
               C34,108 28,102 29,95 C24,93 21,85 25,79 C21,75 21,67 26,63
               C23,58 26,52 32,52 C34,47 40,42 50,42 Z"
            fill={`url(#${gid('fur')})`}
            stroke={INK}
            strokeWidth={INK_MAIN}
            strokeLinejoin="round"
          />

          {/* ear tufts, uneven — one flops */}
          <path d="M34,46 C29,34 33,28 38,30 C40,36 39,42 38,47 Z" fill={`url(#${gid('fur')})`} stroke={INK} strokeWidth={INK_SUB} strokeLinejoin="round" />
          <path d="M66,46 C73,36 76,40 73,46 C70,50 68,49 65,48 Z" fill={`url(#${gid('fur')})`} stroke={INK} strokeWidth={INK_SUB} strokeLinejoin="round" />

          {/* the coal itself, a hard bright core in the fur */}
          <circle className="pl-pulse" cx="50" cy="82" r="6" fill="#ffb347" style={{ filter: `url(#${gid('heat')})` }} />
          <circle cx="50" cy="82" r="2.6" fill="#fff3d0" />

          {/* face — eyes high and wide apart, which is the single strongest
              "young animal" signal there is */}
          {[42, 58].map((cx) => (
            <g key={cx}>
              <circle cx={cx} cy="62" r="5.4" fill="#141013" />
              <circle cx={cx + 1.6} cy="60" r="2" fill="#ffffff" opacity="0.9" />
              <circle cx={cx - 1.6} cy="64" r="0.9" fill="#ffffff" opacity="0.45" />
            </g>
          ))}
          <path d="M48,70 L52,70 L50,72.5 Z" fill="#2a1c18" />
          {/* tiny feet peeking out from under the fur */}
          {[42, 58].map((x) => (
            <ellipse key={x} cx={x} cy="110" rx="5" ry="3" fill="#3f2f26" stroke={INK} strokeWidth={INK_FINE} />
          ))}
        </>
      );

    /* ============================================================
       PEBBLE — a rock that follows you. Construct register.

       The minimal one, and deliberately so: ten companions all competing
       for attention is exhausting, and a set needs something quiet in it.
       Almost no features — the entire character is one crack that happens
       to sit where an eye would be, and the fact that it hovers when
       nothing about a rock should.
       ============================================================ */
    case 'pebble':
      return (
        <>
          <defs>
            <linearGradient id={gid('stone')} x1="0.3" y1="0" x2="0.7" y2="1">
              <stop offset="0%" stopColor="#9aa0a8" />
              <stop offset="55%" stopColor="#6c727b" />
              <stop offset="100%" stopColor="#40454c" />
            </linearGradient>
            <radialGradient id={gid('lift')} cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#a9d8ff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#a9d8ff" stopOpacity="0" />
            </radialGradient>
            <filter id={gid('glow')} x="-90%" y="-90%" width="280%" height="280%">
              <feGaussianBlur stdDeviation="1.8" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <ellipse className="pl-contact" cx="50" cy="112" rx="20" ry="4.5" fill={`url(#${gid('lift')})`} />

          <g className="pl-bob">
            {/* an irregular lump. Every vertex is a different distance from
                centre — a rounded polygon with even radii reads as a
                designed gem, and this needs to read as something picked up
                off the ground. */}
            <path
              d="M50,44 L66,50 L74,64 L71,82 L58,92 L42,91 L29,80 L27,62 L36,49 Z"
              fill={`url(#${gid('stone')})`}
              stroke={INK}
              strokeWidth={INK_MAIN}
              strokeLinejoin="round"
            />
            {/* facet shading, two planes only */}
            <path d="M50,44 L66,50 L58,92 L42,91 Z" fill="#ffffff" opacity="0.07" />
            <path d="M71,82 L58,92 L42,91 L29,80 Z" fill="#1b1e22" opacity="0.25" />

            {/* THE crack — the whole character. Sits at eye height and
                curves like a lid, so the light inside it reads as a
                half-open eye rather than as damage. */}
            <path
              d="M38,66 C44,61 56,61 63,66"
              fill="none"
              stroke="#141719"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              className="pl-pulse"
              d="M40,66 C45,63 55,63 61,66"
              fill="none"
              stroke="#a9d8ff"
              strokeWidth="2"
              strokeLinecap="round"
              style={{ filter: `url(#${gid('glow')})` }}
            />
            {/* two hairline cracks branching off, so the eye-crack belongs
                to the stone rather than being painted on it */}
            <path d="M45,68 L43,74 M58,68 L60,73 L57,77" fill="none" stroke="#141719" strokeWidth={INK_FINE} opacity="0.5" />

            {/* a few chips of grit orbiting with it */}
            <circle cx="24" cy="52" r="2" fill="#6c727b" stroke={INK} strokeWidth={INK_FINE} />
            <circle cx="79" cy="72" r="1.6" fill="#6c727b" stroke={INK} strokeWidth={INK_FINE} />
            <circle cx="70" cy="40" r="1.2" fill="#6c727b" opacity="0.8" />
          </g>
        </>
      );

    /* ============================================================
       MOTH — dust-winged drifter. Spirit register.

       Wings are ~2.4x the body's width. That ratio is the character: a
       moth with proportionate wings reads as a butterfly-shaped drone,
       whereas an absurdly small body under big soft wings reads as
       something that barely weighs anything.
       ============================================================ */
    case 'moth':
      return (
        <>
          <defs>
            <linearGradient id={gid('wing')} x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#d8cfe6" stopOpacity="0.92" />
              <stop offset="60%" stopColor="#a294c4" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#6f6293" stopOpacity="0.45" />
            </linearGradient>
            <linearGradient id={gid('fuzz')} x1="0.3" y1="0" x2="0.8" y2="1">
              <stop offset="0%" stopColor="#c3b8d6" />
              <stop offset="100%" stopColor="#5f5478" />
            </linearGradient>
            <filter id={gid('soft')} x="-90%" y="-90%" width="280%" height="280%">
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <ellipse className="pl-contact" cx="50" cy="118" rx="18" ry="4" fill="#3a3050" fillOpacity="0.35" />

          <g className="pl-bob">
            {/* hind wings behind, fore wings in front, all four with a
                scalloped trailing edge — a smooth wing edge reads as a
                blade, a scalloped one reads as something that has been
                flying a while */}
            {[
              { d: 'M48,72 C30,76 12,92 16,104 C22,112 40,102 48,88 Z', o: 0.75 },
              { d: 'M52,72 C70,76 88,92 84,104 C78,112 60,102 52,88 Z', o: 0.75 },
              { d: 'M48,58 C28,52 6,58 6,72 C8,84 32,80 48,70 Z', o: 1 },
              { d: 'M52,58 C72,52 94,58 94,72 C92,84 68,80 52,70 Z', o: 1 },
            ].map((w) => (
              <path
                key={w.d}
                d={w.d}
                fill={`url(#${gid('wing')})`}
                opacity={w.o}
                stroke={INK}
                strokeWidth={INK_SUB}
                strokeLinejoin="round"
              />
            ))}
            {/* wing veins, following each wing's own sweep */}
            <path
              d="M46,60 C34,58 20,61 12,68 M46,64 C34,64 22,68 14,74 M46,74 C34,79 24,90 20,100 M54,60 C66,58 80,61 88,68 M54,64 C66,64 78,68 86,74 M54,74 C66,79 76,90 80,100"
              fill="none"
              stroke={INK}
              strokeWidth={INK_FINE}
              opacity="0.35"
            />
            {/* two pale eyespots — moth markings, and they double as a
                second pair of "eyes" that make the wings feel watched-over */}
            <ellipse cx="26" cy="68" rx="5" ry="4" fill="#ede6f7" opacity="0.4" />
            <ellipse cx="74" cy="68" rx="5" ry="4" fill="#ede6f7" opacity="0.4" />

            {/* body — tiny, furry, segmented */}
            <path
              d="M50,48 C55,48 57,54 56,62 L55,82 C55,88 45,88 45,82 L44,62 C43,54 45,48 50,48 Z"
              fill={`url(#${gid('fuzz')})`}
              stroke={INK}
              strokeWidth={INK_SUB}
              strokeLinejoin="round"
            />
            <path d="M45,66 L55,66 M45,72 L55,72 M46,78 L54,78" stroke={INK} strokeWidth={INK_FINE} opacity="0.45" />

            {/* feathered antennae — the silhouette break */}
            {[-1, 1].map((s) => (
              <g key={s}>
                <path
                  d={`M${50 + s * 3},48 C${50 + s * 10},40 ${50 + s * 14},32 ${50 + s * 13},24`}
                  fill="none"
                  stroke={INK}
                  strokeWidth={INK_SUB}
                  strokeLinecap="round"
                />
                {[28, 33, 38, 43].map((y, i) => (
                  <path
                    key={y}
                    d={`M${50 + s * (13 - i * 1.6)},${y} l${s * 4},${-2.5}`}
                    stroke={INK}
                    strokeWidth={INK_FINE}
                    strokeLinecap="round"
                    opacity="0.7"
                  />
                ))}
              </g>
            ))}

            {/* eyes — big, dark, glossy */}
            {[46, 54].map((cx) => (
              <g key={cx}>
                <circle cx={cx} cy="55" r="3.6" fill="#17131f" />
                <circle cx={cx + 1.1} cy="53.8" r="1.4" fill="#ffffff" opacity="0.85" />
              </g>
            ))}
          </g>

          {/* dust shed in the air around it */}
          {[
            [22, 46, 1.4],
            [80, 50, 1.2],
            [34, 100, 1],
            [66, 104, 1.3],
            [50, 26, 0.9],
          ].map(([cx, cy, r]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="#e6ddf5" opacity="0.5" style={{ filter: `url(#${gid('soft')})` }} />
          ))}
        </>
      );

    /* ============================================================
       SPROCKET — scrappy wheeled bot. Machine register.

       Built asymmetric on purpose: one wheel noticeably bigger than the
       other, so the whole chassis sits at a tilt and reads as permanently
       mid-correction. It is the busy one, and busy is a shape as much as
       a motion.
       ============================================================ */
    case 'sprocket':
      return (
        <>
          <defs>
            <linearGradient id={gid('shell')} x1="0.2" y1="0" x2="0.85" y2="1">
              <stop offset="0%" stopColor="#f0dfae" />
              <stop offset="55%" stopColor="#c79a4e" />
              <stop offset="100%" stopColor="#7d5a26" />
            </linearGradient>
            <filter id={gid('glow')} x="-90%" y="-90%" width="280%" height="280%">
              <feGaussianBlur stdDeviation="1.8" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <ellipse className="pl-contact" cx="50" cy="116" rx="30" ry="4.5" fill="#2b2417" fillOpacity="0.4" />

          <g transform="rotate(-5 50 90)">
            {/* mismatched wheels — the big one carries the tilt */}
            <g>
              <circle cx="30" cy="94" r="20" fill="#3b3a38" stroke={INK} strokeWidth={INK_MAIN} />
              <circle cx="30" cy="94" r="12" fill="#5c5a56" stroke={INK} strokeWidth={INK_SUB} />
              <circle cx="30" cy="94" r="3.4" fill="#c79a4e" stroke={INK} strokeWidth={INK_FINE} />
              {[0, 60, 120].map((a) => (
                <path
                  key={a}
                  d="M30,82 L30,106"
                  stroke={INK}
                  strokeWidth={INK_FINE}
                  opacity="0.5"
                  transform={`rotate(${a} 30 94)`}
                />
              ))}
            </g>
            <g>
              <circle cx="72" cy="102" r="13" fill="#3b3a38" stroke={INK} strokeWidth={INK_MAIN} />
              <circle cx="72" cy="102" r="7" fill="#5c5a56" stroke={INK} strokeWidth={INK_SUB} />
              <circle cx="72" cy="102" r="2.4" fill="#c79a4e" stroke={INK} strokeWidth={INK_FINE} />
            </g>

            {/* chassis */}
            <path
              d="M26,64 C26,56 74,54 76,64 L80,90 C80,98 24,100 22,90 Z"
              fill={`url(#${gid('shell')})`}
              stroke={INK}
              strokeWidth={INK_MAIN}
              strokeLinejoin="round"
            />
            {/* a dent, and a panel bolted on crooked */}
            <path d="M62,68 L78,66 L79,80 L63,82 Z" fill="#a87f38" stroke={INK} strokeWidth={INK_SUB} strokeLinejoin="round" transform="rotate(4 70 74)" />
            {[[65, 70], [76, 69], [65, 79], [76, 78]].map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.9" fill={INK} opacity="0.6" />
            ))}
            <path d="M30,84 C34,80 38,80 41,83" fill="none" stroke={INK} strokeWidth={INK_FINE} opacity="0.4" />

            {/* one big lens eye, set left of centre because nothing about
                this character is aligned */}
            <circle cx="43" cy="74" r="14" fill="#26241f" stroke={INK} strokeWidth={INK_MAIN} />
            <circle className="pl-pulse" cx="43" cy="74" r="8" fill="#7fe0c0" style={{ filter: `url(#${gid('glow')})` }} />
            <circle cx="39.5" cy="70.5" r="3" fill="#ffffff" opacity="0.85" />

            {/* a whip aerial with a pennant, leaning back from the motion */}
            <path d="M64,56 C68,44 66,36 60,30" fill="none" stroke={INK} strokeWidth={INK_SUB} strokeLinecap="round" />
            <path d="M60,30 L52,26 L60,22 Z" fill="#e0603a" stroke={INK} strokeWidth={INK_FINE} strokeLinejoin="round" />
          </g>
        </>
      );

    /* ============================================================
       QUILL — spined burrower. Creature register.

       The only one whose silhouette is genuinely hostile, which is the
       point: it is soft underneath and the spines are what it does when
       startled. Drawn HALF-uncurled — spines still up, face already out —
       so it reads as deciding you are safe.
       ============================================================ */
    case 'quill':
      return (
        <>
          <defs>
            <radialGradient id={gid('belly')} cx="0.45" cy="0.35" r="0.75">
              <stop offset="0%" stopColor="#e7cdb0" />
              <stop offset="100%" stopColor="#a67f5c" />
            </radialGradient>
            <linearGradient id={gid('spine')} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#6a5340" />
              <stop offset="65%" stopColor="#3f3226" />
              <stop offset="100%" stopColor="#efe3d0" />
            </linearGradient>
          </defs>

          <ellipse className="pl-contact" cx="50" cy="114" rx="28" ry="4.5" fill="#2e2418" fillOpacity="0.4" />

          {/* spines, drawn BEHIND the body so they read as covering the
              back rather than as decoration stuck to the front. Lengths
              and angles all vary — a neat radial fan reads as a sun icon. */}
          {Array.from({ length: 15 }, (_, i) => {
            const a = -172 + i * 12.6;
            const rad = (a * Math.PI) / 180;
            const len = 20 + ((i * 7) % 5) * 3.2;
            const bx = 50 + Math.cos(rad) * 26;
            const by = 82 + Math.sin(rad) * 24;
            const tx = 50 + Math.cos(rad) * (26 + len);
            const ty = 82 + Math.sin(rad) * (24 + len * 0.85);
            const nx = -Math.sin(rad) * 3.4;
            const ny = Math.cos(rad) * 3.4;
            return (
              <path
                key={i}
                d={`M${bx + nx},${by + ny} L${tx},${ty} L${bx - nx},${by - ny} Z`}
                fill={`url(#${gid('spine')})`}
                stroke={INK}
                strokeWidth={INK_FINE}
                strokeLinejoin="round"
              />
            );
          })}

          {/* body — a soft rounded mass, wider than tall */}
          <ellipse
            cx="50"
            cy="82"
            rx="28"
            ry="25"
            fill={`url(#${gid('belly')})`}
            stroke={INK}
            strokeWidth={INK_MAIN}
          />

          {/* snout, poking forward and down — the "already decided you're
              safe" beat */}
          <path
            d="M50,76 C60,76 68,82 68,90 C68,98 58,102 50,102 C42,102 34,98 34,90 C34,82 40,76 50,76 Z"
            fill="#e7cdb0"
            stroke={INK}
            strokeWidth={INK_SUB}
            strokeLinejoin="round"
          />
          <ellipse cx="50" cy="95" rx="4" ry="3" fill="#2a1f18" />
          <circle cx="48.6" cy="94" r="1.2" fill="#ffffff" opacity="0.7" />
          {/* whiskers */}
          <path d="M40,93 L30,90 M40,96 L31,97 M60,93 L70,90 M60,96 L69,97" stroke={INK} strokeWidth={INK_FINE} opacity="0.55" strokeLinecap="round" />

          {/* eyes — small and close-set against the big snout, which is
              what makes it read as a burrower rather than a cat */}
          {[42, 58].map((cx) => (
            <g key={cx}>
              <circle cx={cx} cy="76" r="3.8" fill="#1a1410" />
              <circle cx={cx + 1.2} cy="74.8" r="1.4" fill="#ffffff" opacity="0.85" />
            </g>
          ))}

          {/* four little feet under the mass */}
          {[34, 45, 55, 66].map((x) => (
            <ellipse key={x} cx={x} cy="106" rx="4.6" ry="3.2" fill="#7d6146" stroke={INK} strokeWidth={INK_FINE} />
          ))}
        </>
      );

    default:
      return null;
  }
}

/** Standalone render — the crew grid, the preview lab. Own viewBox, own aria-label. */
export function CharacterArt({ id, size = 90, name }: { id: string; size?: number; name?: string }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 100 130" role="img" aria-label={name ?? id}>
      <CharacterFigure id={id} uid={uid} />
    </svg>
  );
}

# 2D Astronaut Character — Layered Outfit System Spec

## 1. Concept & Goals
- Flat/vector cartoon style, NOT flat-and-simple — full detail preserved (visor, cape, helmet greebles, backpack, boot tread etc.)
- One fixed base rig; outfits are swappable layer sets on top of it
- Outfits unlock via the existing XP/progression system (ties into the Moonshot module)
- Built as SVG/React components, not generated images — scales cleanly, no asset pipeline needed

## 2. Base Rig (drawn once, never changes)
- Single artboard/viewBox (e.g. 400×600), front-facing idle pose, symmetric — this maximizes reuse across gear
- A hidden "underlayer" body silhouette (suit fabric/skin) that only shows through gaps — neck seal, wrist gaps, visor opening
- A shared **anchor point map**: named coordinates every outfit piece aligns to — `head_center`, `neck`, `shoulder_L/R`, `elbow_L/R`, `wrist_L/R`, `hip`, `knee_L/R`, `ankle_L/R`, `back_anchor` (for cape/backpack)
- Get this right *before* drawing any armor — every outfit piece depends on it lining up correctly

## 3. Layer Stack (back → front render order)
1. Cape / cloak back panel
2. Backpack / life-support pack
3. Base body silhouette
4. Legs / pants
5. Boots
6. Torso / chest armor
7. Arms / gauntlets / gloves
8. Belt / hip accessories
9. Cape front strap / shoulder mantle (if it drapes forward)
10. Neck seal / collar
11. Helmet shell
12. Visor / faceplate (separate layer — needed for glow/reflection effects)
13. Antenna / helmet accessories
14. Accent greebles (badges, tubing, glow trim) — topmost, independently swappable

## 4. Component structure
```
/components/astronaut/
  AstronautBase.jsx          # renders full character, takes outfitId prop
  rig/
    anchorPoints.js          # shared coordinate constants
    BaseSilhouette.jsx
  parts/
    helmets/      HelmetDomed.jsx, HelmetVisorSkull.jsx, ...
    visors/       VisorGold.jsx, VisorAmber.jsx, ...
    torsos/       TorsoPaddedVest.jsx, TorsoArmoredPlate.jsx, ...
    capes/        CapeLongDouble.jsx, CapeNone.jsx, ...
    backpacks/    PackLifeSupportSquare.jsx, ...
    legs/         LegsBandedUtility.jsx, ...
    boots/        BootsLaced.jsx, ...
    accessories/  AntennaWhip.jsx, GlowTrimBlue.jsx, ...
  outfits/
    outfitConfig.js          # maps outfit ID -> part components + palette
```

## 5. Outfit config shape
```js
export const OUTFITS = {
  lost_pacific: {
    name: "Lost Pacific",
    unlockLevel: 1,
    parts: {
      helmet: 'HelmetDomed',
      visor: 'VisorGold',
      torso: 'TorsoPaddedVest',
      cape: 'CapeLongDouble',
      backpack: 'PackLifeSupportSquare',
      legs: 'LegsBandedUtility',
      boots: 'BootsLaced',
      accessory: ['AntennaWhip'],
    },
    palette: { primary: '#e8e6e1', secondary: '#2b2b2e', accent: '#f2a93b', glow: null },
  },
  siegebreak: {
    name: "Siegebreak",
    unlockLevel: 5,
    parts: {
      helmet: 'HelmetVisorSkull',
      visor: 'VisorAmber',
      torso: 'TorsoArmoredPlate',
      cape: 'CapeNone',
      backpack: 'PackLifeSupportSquare',
      legs: 'LegsBandedUtility',
      boots: 'BootsLaced',
      accessory: ['GlowTrimBlue'],
    },
    palette: { primary: '#c65a2e', secondary: '#3a3a3a', accent: '#e8dfc0', glow: '#7fd8ff' },
  },
  // repeat pattern per outfit — reuse geometry + swap palette where you can
};
```

## 6. Rules for keeping detail intact
- Each part component needs real path detail — seams, panel lines, buckles, vents, tubing — not a flat silhouette blob. Aim for enough sub-paths that gear reads as "designed," not clipart.
- Consistent stroke weight across all pieces (e.g. 3px, `vector-effect: non-scaling-stroke`), plus a base fill + one shadow shape + one highlight shape per piece — gives depth without leaving flat-vector territory.
- Palette lives in the outfit config, not the part component, so the same geometry can be reused across outfits with a different color scheme — this is how you get multiple outfits without redrawing everything each time.
- Glow elements (like the lit piping) get their own layer with an SVG blur filter, so they can be animated/pulsed later for higher-tier unlocks.

## 7. Build order
1. Base silhouette + anchor point map only — verify proportions before any armor
2. One full outfit, all layers — validates the whole pipeline
3. Outfit config + swap logic, wired to your unlock/XP data
4. 2–3 more outfits — reuse geometry where possible, new palettes
5. Optional: glow animation, back/side view

## 8. Model & effort in Claude Code
- **Steps 1–2 (rig + first full outfit): Opus 5, effort high (default).** This is where proportions, anchor points, and path density actually get decided — it's the template everything else copies, so it's worth the stronger model here.
- **Steps 3–5 (config wiring, additional outfits): Sonnet 5, effort high (default).** Once the pattern exists this is mostly following the template — no need to pay for Opus on repetitive work.
- No need for max effort — that's for gnarly multi-step debugging, not vector illustration precision. High is the right ceiling for this task.

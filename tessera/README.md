# Tessera — Tile Empires

A turn-based 4X strategy game for phones, built as an installable, offline-capable PWA.
It is separate from the rest of this repo, with its own `package.json` and build.

Lead one of ten empires, each with its own biome, starting tech, unique unit and bonus:

| Empire | Biome | Starts with | Unique unit | Bonus |
|---|---|---|---|---|
| Egyptian | desert and river | Gathering | Chariot (replaces Rider) | Farms give +1 extra population |
| Aztec | jungle | Hunting | Jaguar Warrior (replaces Rider) | Hunting refunds 1★ |
| Māori | green coast and tree ferns | Fishing | Waka Taua (replaces Canoe) | Board boats from any coast |
| Roman | hills | Riding | Legionary (replaces Warrior) | Roads cost 1★ less |
| Pirate | rocky coast | Fishing | Buccaneer (replaces Archer) | Boats and ships move +1 and attack +1; ports cost 4★ and earn +1★ a turn |
| Viking | snowy fjords | Climbing | Berserker (replaces Swordsman) | Units heal 3 HP when they win a fight |
| Japanese | mountains and blossom | Fishing | Samurai (replaces Swordsman) | +1 defence inside your own borders |
| Mongol | grass steppe | Riding | Horse Archer (replaces Archer) | Mounted units cost 1★ less |
| Greek | olive coast | Gathering | Hoplite (replaces Defender) | Every tech costs 1★ less |
| Zulu | savanna | Hunting | Impi (replaces Warrior) | Hunting grows a city by 2 |

Features:
- A seeded isometric map with fog of war.
- Harvestable resources: fruit, animals, fish, crops, ore and whales.
- Buildings: farms, mines, lumber huts, ports, shrines and markets.
- Roads that grow the cities they connect (+1 population at 6 and at 12 connected roads, +1 for a city's first two links to your other cities, and a little star income), villages to claim, and ruins to explore.
- Cities need 2, 4, 6, 8, 10… population per level. A Colossus is a prize at levels 5 and 8 only; the levels in between offer a garden or gold.
- Neighbouring lumber huts, ports, temples and markets give +1 bonus population each (up to +2).
- Units on mountains defend at ×2.
- Cities that level up, with a choice of reward at each level.
- A 25-node radial tech tree.
- Land and naval combat with retaliation.
- Heuristic AI rivals.
- Two modes: 30-turn score or conquest, on Normal, Large or Huge maps.
- Animated units: hops between tiles, attack lunges, arrows and cannon shots, hit flashes, death fades, particle bursts.
- Synthesized sound effects (Web Audio, no audio files) with a mute toggle.
- A local high-score table and autosave.

All art is drawn procedurally (`src/render/draw.ts` for the world, `src/render/units.ts` for units),
so there are no image assets apart from the app icons.

## Commands

```bash
npm install
npm run dev       # local dev server
npm test          # headless AI-vs-AI games across several seeds
npm run build     # typecheck + production build with service worker (dist/)
npm run icons     # regenerate public/icons/*
```

## Layout

- `src/data/`: empires, techs, units
- `src/game/`: map generation, rules, turn loop and AI. No DOM, so it runs in tests.
- `src/render/`: the camera, the canvas renderer and the unit art
- `src/audio/`: synthesized sound effects
- `src/ui/`: menus, HUD, action panel, tech tree and modals


## Install and host it

Tessera is a standard PWA: a web app manifest, maskable icons, a service worker that caches everything
(so it runs offline after the first visit) and iPhone home-screen support. `npm run build` produces the
whole site in `dist/`; host that folder over HTTPS.

- **Vercel:** New Project, import this repo, set **Root Directory** to `tessera`. `tessera/vercel.json` does the rest.
- **GitHub Pages:** Settings, Pages, Source: *GitHub Actions*; then run the *Deploy Tessera to GitHub Pages* workflow from the Actions tab.
- **Anything else** that serves static files over HTTPS works (Netlify, Cloudflare Pages, your own server).

To install it once it is hosted: on **iPhone** open the address in Safari, tap Share, then *Add to Home Screen*;
on **Android or desktop Chrome** use the *Install app* button on the title screen (or the browser menu).

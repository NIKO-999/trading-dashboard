# Tessera — Tile Empires

A turn-based 4X strategy game for phones, built as an installable, offline-capable PWA.
It is separate from the rest of this repo, with its own `package.json` and build.

Lead one of five empires, each with its own biome, starting tech, unique unit and bonus:

| Empire | Biome | Starts with | Unique unit | Bonus |
|---|---|---|---|---|
| Egyptian | desert and river | Gathering | Chariot (replaces Rider) | Farms give +1 extra population |
| Aztec | jungle | Hunting | Jaguar Warrior (replaces Rider) | Hunting refunds 1★ |
| Polynesian | islands | Fishing | Waka (replaces Canoe) | Board boats from any coast |
| Roman | hills | Riding | Legionary (replaces Warrior) | Roads cost 1★ less |
| Pirate | rocky coast | Fishing | Buccaneer (replaces Archer) | Boats and ships move +1 and attack +1; ports cost 4★ and earn +1★ a turn |

Features:
- A seeded isometric map with fog of war.
- Harvestable resources: fruit, animals, fish, crops, ore and whales.
- Buildings: farms, mines, lumber huts, ports, shrines and markets.
- Roads, villages to claim, and ruins to explore.
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

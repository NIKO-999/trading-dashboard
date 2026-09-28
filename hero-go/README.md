# Hero Go!

A Capybara Go!-style idle roguelike for mobile browsers. It's standalone and unrelated to the trading dashboard.

Open `index.html` in a browser (or serve the folder statically). There's no build step and no dependencies.

## Heroes
All six are hand-drawn, animated SVG. Each file was built by its own agent, following `ART_CONTRACT.md`. Every hero has a signature ability plus a passive Hero Bonus (`HERO_BONUS` in `js/data.js`).

| Hero | File | Signature | Hero Bonus |
|---|---|---|---|
| Kenji, the Samurai | `js/heroes/samurai.js` | Iaijutsu: 25% crit for 250% | Bushido: ATK +15%; the first strike of each battle always crits |
| Sir Aldric, the Knight | `js/heroes/knight.js` | Holy Bulwark: 30% HP shield each battle | Chivalry: DEF +25%; 20% less damage from elites and bosses |
| Itzcoatl, the Jaguar Warrior | `js/heroes/aztec.js` | Obsidian Fury: bleed on hit | Jaguar Spirit: +12% dodge; heal 6% HP per kill |
| Kaimana, the Ocean Warrior | `js/heroes/polynesian.js` | Mana Surge: 15% lifesteal | Ocean's Bounty: Max HP +20%; healing +40% |
| Bjorn, the Viking Berserker | `js/heroes/viking.js` | Berserkergang: up to +60% ATK at low HP | Plunder: +30% coins; starts with Power Up |
| Themba, the Zulu Warrior | `js/heroes/zulu.js` | Iklwa Flurry: 30% chance to strike twice | Impi Swiftness: +30% EXP; free opening spear throw |

## Game loop
- **Chapters:** 5 chapters (30–60 days). Each day is one event: a battle, a story, an Angel, a Devil deal, a merchant, a chest, a campfire or the Wheel of Fortune. Elites come every 10 days and a boss on the final day.
- **Battles:** auto turn-based with a round limit, x1/x2 speed and Skip.
- **Leveling:** each level-up lets you pick one of 3 skills. There are 22 stackable skills (daggers, lightning and thunderstorm, fire, meteor, angel, vampire, frost and others).
- **Meta progression:** hero levels, talents, a shop, energy, and pet eggs. Pets give team bonuses and fight beside you.
- **Walking:** between events the road scrolls endlessly (the scene plus a mirrored copy loop seamlessly), with a bouncing walk cycle, dust puffs and footsteps.
- **Audio:** chiptune music and sound effects are synthesized live with Web Audio in `js/audio.js`, so there are no audio files. There are three tracks: home, adventure and boss. Music and sound can be toggled with the speaker button on the home screen or in the pause menu.
- **Saving:** progress is kept in `localStorage`.

## Files
- `js/data.js`: skills, chapters, text and icons
- `js/game.js`: the engine
- `js/art/`: enemies, pets and scenes

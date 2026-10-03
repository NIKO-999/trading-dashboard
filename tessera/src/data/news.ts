// "What's new": the latest releases in a few plain lines each, newest first. The title screen shows the card once for
// each new release (and whenever the version label is tapped). Add an entry with every release that changes play.
export interface News { version: string; items: string[] }

export const NEWS: News[] = [
  {
    version: '0.60',
    items: [
      '🚩 Rally flags: tap any tile and plant a rally flag, pick a range (2–6 tiles) and tick the units to send. All of them are ticked to start, and Select all / none switches them in one tap. They march there by themselves, now and at the start of each of your turns, until they arrive.',
      '⚔ A marching unit stops and waits for you if an enemy comes within its reach, and moving it yourself cancels its march. Tap the flag to call more units or take it down. On a computer, F plants a flag on the selected tile.',
    ],
  },
  {
    version: '0.59',
    items: [
      '🖥 A desktop layout: on a computer the city and unit panel opens down the right-hand side, the buttons stay in view, and New Game shows the empires beside the chosen empire and its options.',
      '⌨ Keyboard shortcuts: Enter ends the turn, Space jumps to the next unit, 1–9 press the panel’s actions, WASD or the arrows pan, + and − zoom, Esc or a right-click closes things, T / G / E / M open the Tech Tree, Govern, Empires and Menu. Press ? for the list.',
      '⚙ Settings → Layout picks Auto, Desktop or Phone.',
    ],
  },
  {
    version: '0.58',
    items: [
      '🌿 A fresh look for the Māori: golden flax cloaks and piupiu, red ochre, greenstone mere and a single huia feather in the topknot, instead of the heavy black.',
      '🛶 Their waka are red-ochre hulls under woven flax sails, with carved prows and feather streamers trailing from the sternpost.',
      '🏷 Pale empire colours get a deeper city label, so every city name stays easy to read.',
    ],
  },
  {
    version: '0.57',
    items: [
      '📜 Civilization bonuses: every one of the 51 empires now has three always-on bonuses on top of its signature, like a real civ sheet. Tougher legions, cheaper research, richer ports, faster scouts, wonders built for less.',
      '⏳ Some grow with the ages: the Aztecs, the Gorkha and Kush hit harder from the Medieval era, harder still in the Renaissance; Viking raids pay from the Classical era.',
      '🤝 Alliance bonuses: each empire also has a bonus that it and all its allies enjoy, so who you ally with matters. Ally Egypt for cheaper temples, Rome for cheaper Masonry, Portugal for wider sight.',
      '📖 See them all on the empire card’s Overview tab (New Game and The Empires).',
    ],
  },
  {
    version: '0.56',
    items: [
      '🗂 A tidier empire card on New Game and in The Empires: the portrait, type, people and unique-unit stats sit up top, and the rest is split into Overview, Units, Hero and Traits tabs instead of one long wall of text.',
      '✅ Strengths and weaknesses now read as clean green and red rows, each with what it does.',
    ],
  },
  {
    version: '0.55',
    items: [
      '🌌 A bigger skill tree: every empire type now has its own Doctrine, nine new techs (the pentagons) only it can learn.',
      '⚔ Doctrine of War (military): Drill, Siegecraft and Cavalry tracks. 💰 Doctrine of Wealth (economy): Agrarian, Commerce and Learning. ⚓ Doctrine of the Sea (naval): Fleet, Fisheries and Exploration.',
      '🔭 The sky is larger again and laid out so the new tracks fan out cleanly from the techs they grow from.',
    ],
  },
  {
    version: '0.54',
    items: [
      '🌌 A wider skill tree: the sky is bigger and its rings spread out, so every tech and its name has room.',
      '⚖ Balance from 2,000 simulated games: the weakest empires (Assyria, Spain, Kush, England, Sweden, the Holy Roman Empire, Arabia, Mapuche, Venice, the Vikings) get sturdier cities and +1★ from their capital, and lose their harshest weakness; Portugal, Poland, Scotland, the Ottomans and the Aztecs lose theirs too. Aggressive rulers start fewer hopeless wars.',
      '⚖ The front-runners are trimmed: Babylon (Eureka 50%, ziggurats at most −2★), Mali (Deep Mines no longer free), the Cree (posts and visitors pay at most 2★), the Haudenosaunee (League of 4), the Celts (forests ×1.75), the Maya (temples dearer; Holcan 2.5 attack) and the Clansman (12 health).',
    ],
  },
  {
    version: '0.53',
    items: [
      '🌍 Twenty new empires, 51 in all, each with its own unique unit, mechanic, hero, music and hand-drawn look:',
      '🏛 Babylon (Ziggurats that speed research), Kush (Pyramids that lift your archers), Majapahit (spice-trading jongs), Spain (Conquest plunder and Missions), the Haudenosaunee (the Great League of Peace).',
      '🦁 Assyria (deportations and the Royal Library), Poland (elect a King every 8 turns; Winged Hussars), Scotland (Highland Games), England (Letters of Marque and the Royal Navy), France (Salons and the Grand Tour).',
      '⚔ The Holy Roman Empire (Hanse and the Imperial Diet), Sweden (Winter March, Falun copper, veterans after 2 kills), Portugal (padrões on far coasts), Venice (the Arsenal and treasury interest), Kongo (nkisi guardians and raffia savings).',
      '🪶 Asante (gold dust and the Golden Stool), the Mapuche (elect a Toqui; Malón raids), Georgia (qvevri wine that ages), the Gorkha (rope bridges and Gurkha levies), the Cree (trading posts and the Winter Count).',
    ],
  },
  {
    version: '0.52',
    items: [
      '🌍 Five new empires, 31 in all, each with its own unique unit, mechanic, hero, music and art.',
      '🟣 Carthage (naval): Purple Dye pays for every port and market; hire veteran Mercenaries that need no unit slot. Unique: the Sacred Band, which defends at full strength however wounded.',
      '🔥 Byzantium (economy): Greek Fire sets enemy ships and attackers ablaze; Theodosian Walls (+1 defence in your cities); pay tribute to blunt an attack. Unique: the Varangian Guard.',
      '🐪 Arabia (economy): House of Wisdom (techs others know cost 40% less), Caravanserais in the desert and camels that cross the sand like a road. Unique: the Camel Rider, whom horses fear.',
      '❄ Rus (military): General Winter freezes invaders every 10 turns, and once an era you can call it early; furs pay for every hunt. Unique: the Druzhina.',
      '🪵 Vietnam (military): hidden Stakes of Bạch Đằng wreck enemy ships; Guerrilla War (+1 defence in forest and swamp). Unique: the Rattan Guard.',
    ],
  },
  {
    version: '0.51',
    items: [
      '⭐ Stronger unique units: every empire\'s unique is now clearly better than the unit it replaces (about +1.5 in attack, defence and health combined), on top of its ability. Samurai and Buccaneer cost the same as the unit they replace; Impi, Clansman and Holcan no longer give up defence.',
    ],
  },
  {
    version: '0.50',
    items: [
      '🪓 Eight new troops for every empire, each with a job and a weakness: Axeman (breaks shields, fragile), Javelineer (cheap skirmisher), Ranger (hidden and strong in forest), Pikeman (stops cavalry, Medieval), Musketeer (ignores cover, Renaissance), Battering Ram (×3 vs cities), Ballista (4 tiles) and Cannon (+50% vs cities, Renaissance).',
      '✦ Trio formations: three of the same unit side by side unlock their own formation: Warband, Arrow Storm, Hedgehog, Volley Fire, Wedge, Grand Battery, Battle Fleet and more. Your unique unit counts as the one it replaces.',
      '⬆ New upgrade paths: Spearman → Pikeman, Archer → Musketeer, Catapult → Cannon, once you reach their era.',
    ],
  },
  {
    version: '0.49',
    items: [
      '⛏🐎 Easier Iron and Horses: your capital adds 1 of each every 2 turns from the Classical era (every turn from the Medieval); a level-3 city or market town can Buy 1 (5★, +2★ each time, easing a step a turn); defeated iron and horse units leave 1 behind; from the Medieval era you can Cultivate mines and pastures anywhere.',
      '🗂 Tidier city menu: units and actions sit in tabs (Ground, Ranged, Mounted, Support, Ships, Economy, City, Armoury, Build), ready ones first; units still locked behind a tech fold into one button.',
      '🐎 New cavalry for every empire, each drawn in its own style: the Lancer (Roads: fastest on land, 3 moves), the Mounted Archer (Horsemanship: shoots from 2 tiles and rides on) and the Cataphract (Smithing: horse and rider in scale armour, 18 health, defence 3).',
    ],
  },
  {
    version: '0.48',
    items: [
      '⚒ The Armoury: at your Barracks, upgrade a whole unit type for the rest of the game: 5 tiers each (attack, +1 movement, attack, +1 range for archers and siege, attack). Paid in Stars and luxury goods 💎; tiers 4 and 5 need a Drill Yard and a War College.',
      '💎 Every developed luxury now also makes 1 luxury good a turn (see the 🏺 chip).',
    ],
  },
  {
    version: '0.47',
    items: [
      '🏕 Frontier Camps: hemmed in? A soldier on unclaimed land near your border can Pitch a Camp: that tile and the free land around it join your nearest city. 5★, +2★ for each camp; up to 2 per city. Works in One City too.',
      '🌾 Homestead needs no tech any more, so every city always has a way to grow.',
      '🤝 Breaking an alliance now takes 2 turns before any attack, and meanwhile the betrayer\'s armies can only walk out of your land: no more surprise attacks from inside.',
    ],
  },
  {
    version: '0.46',
    items: [
      '⚔️ Formation doctrines: Military empires\' units in formation attack +0.5 (Drilled Ranks); Economy empires\' defend +0.5 on their own land (Hometown Guard); Naval empires\' warships side by side form a Line of Battle (+0.5 attack and defence).',
      '🛡 Rome\'s Testudo: Roman shield walls rise to +1.5 defence and hold +1 more against arrows and stones.',
    ],
  },
  {
    version: '0.45',
    items: [
      '🏰 Barracks: build one beside a city: it supports 1 more unit and can raise new units right on the yard. Move a unit onto it and tap Train: It upgrades for free (Warrior → Swordsman, Rider → Knight) or drills into a Veteran, but it takes turns and defends at half strength meanwhile. Naval empires refit ships at their ports.',
      '🌾 Homestead: make a Farm out of empty land. Cheap for Economy empires, dear for Military ones (Barracks are the other way round).',
      '🌱 Cultivate: once an empire you have met has a resource, grow your own: plant a luxury, sink an iron mine or start a horse pasture (8★, dearer each time).',
    ],
  },
  {
    version: '0.44',
    items: [
      '🏳 Free Cities: independent city-states (Trade, Military, Science, Culture, Maritime). Tap one to send envoys; the most envoys (3+) makes you Suzerain, and its guards fight for you. (New Game option, on by default.)',
      '🎉 City Festivals: spend spare Stars on a festival for +1 population and +30 score. Each one costs a little more.',
    ],
  },
  {
    version: '0.43',
    items: [
      '🌄 Natural Wonders: eight rare landmarks (Thundermantle Falls, Glimmerdeep Grotto, Mount Halcyra and more). Be the first to see one for Stars and score; hold it in your borders for its own bonus.',
      '✨ A gold light through the clouds marks a wonder you have not reached yet. Find them all under Empires → Wonders.',
    ],
  },
  {
    version: '0.42',
    items: [
      '🏛 Governments: tap Govern on the dock. Start as a Chiefdom; new eras unlock Autocracy, Oligarchy, Republics, Monarchy and Theocracy, each with its own bonus.',
      '🃏 Policy cards: 18 cards in Military, Economic and Wild slots. Fill a slot for free; swap once a turn to suit war or peace.',
    ],
  },
  {
    version: '0.41',
    items: [
      '🎖 Governors: tap your city to appoint a Steward, Treasurer, Marshal or Scholar. One slot, plus one more each era; they are promoted after 8 turns.',
      '⛺ Raider Clans: outlaw camps send raiders to pillage your land. Burn a camp for Stars, pay the clan off, or hire a raider. (New Game option, on by default.)',
      '🐎 Horse peoples breed more Horses; the Pirates smuggle Iron through their ports.',
    ],
  },
  {
    version: '0.40',
    items: [
      '🏛 Eras: Ancient → Classical → Medieval → Renaissance as you learn techs. Each new era grows your cities; a great era brings a Golden Age, a quiet one a Dark Age.',
      '🤝 A tech that an empire you have met already knows costs 20% less.',
      '👑 Monopolies: hold 3 of one luxury and every copy pays in full, and your trade routes pay more.',
      '⚖ Buy Iron and Horses from other empires on the Diplomacy screen.',
    ],
  },
  {
    version: '0.39',
    items: [
      '💡 Eurekas: every tech has a goal in the world (build a port, climb a mountain...). Meet it and the tech is 40% cheaper.',
      '⛏ Iron and 🐎 Horses: mines and pastures stockpile them; Swordsmen, Catapults and Knights need them.',
      '🍇 Luxuries: silk, spices, wine, ivory, pearls and incense pay Stars every turn once developed.',
    ],
  },
  {
    version: '0.38',
    items: ['🏰 One City Challenge: every empire keeps only its capital. Conquer everyone else to win.'],
  },
];

export const latestNews = () => NEWS[0].version;

// "What's new": the latest releases in a few plain lines each, newest first. The title screen shows the card once for
// each new release (and whenever the version label is tapped). Add an entry with every release that changes play.
export interface News { version: string; items: string[] }

export const NEWS: News[] = [
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

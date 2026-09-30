// "What's new": the latest releases in a few plain lines each, newest first. The title screen shows the card once for
// each new release (and whenever the version label is tapped). Add an entry with every release that changes play.
export interface News { version: string; items: string[] }

export const NEWS: News[] = [
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

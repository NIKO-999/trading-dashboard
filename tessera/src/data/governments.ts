// Governments and Policy Cards: the flexible layer over the permanent skill tree (see game/government for the rules).
// A government gives a small bonus of its own and a row of policy slots; the cards slotted into them are perks, read by
// game/perks like every other perk, so every rule that asks "how much of X?" sees them. Kept free of game rules so the
// perk code can read it without loading them.
import type { Perk } from '../game/perks';
import type { Player } from '../game/types';

export type CardType = 'military' | 'economic' | 'wild';
export type GovId = 'chiefdom' | 'autocracy' | 'oligarchy' | 'republic' | 'monarchy' | 'merchant' | 'theocracy';

export interface GovDef {
  id: GovId;
  name: string;
  era: number; // the era (game/eras ERAS index) that makes it available
  slots: CardType[]; // a Wild slot takes a card of any type
  perks: Perk[];
  bonus: string; // the inherent bonus, in words
  flavor: string;
}

export interface CardDef {
  id: string;
  name: string;
  type: CardType;
  tech?: string; // unlocked by this tech...
  era?: number; // ...or by reaching this era (0: from the start)
  perks: Perk[];
  desc: string;
  flavor: string;
}

export const GOVS: GovDef[] = [
  { id: 'chiefdom', name: 'Chiefdom', era: 0, slots: ['military', 'economic'], perks: [{ k: 'kill', n: 1 }],
    bonus: '+1★ for every enemy defeated.', flavor: 'The strongest arm leads, and shares the spoils.' },
  { id: 'autocracy', name: 'Autocracy', era: 1, slots: ['military', 'economic', 'wild'], perks: [{ k: 'income', per: 'capital', n: 1 }, { k: 'terrain', on: 'capital', n: 0.5 }],
    bonus: 'The capital pays +1★ a turn and its defenders hold 0.5 better.', flavor: 'One throne, one voice, one high wall.' },
  { id: 'oligarchy', name: 'Oligarchy', era: 1, slots: ['military', 'military', 'economic'], perks: [{ k: 'atk', who: 'melee', n: 0.5 }],
    bonus: 'Foot soldiers hit 0.5 harder.', flavor: 'A council of old families, each with its own household guard.' },
  { id: 'republic', name: 'Classical Republic', era: 1, slots: ['economic', 'economic', 'wild'], perks: [{ k: 'income', per: 'bigcity', n: 1 }],
    bonus: '+1★ a turn from every city of level 3 or more.', flavor: 'Citizens vote in the forum, and their towns prosper for it.' },
  { id: 'monarchy', name: 'Monarchy', era: 2, slots: ['military', 'military', 'economic', 'wild'], perks: [{ k: 'income', per: 'capital', n: 2 }, { k: 'terrain', on: 'city', n: 0.5 }],
    bonus: 'The capital pays +2★ a turn and units in your cities defend 0.5 better.', flavor: 'A crown handed down, and castles in every province.' },
  { id: 'merchant', name: 'Merchant Republic', era: 2, slots: ['military', 'economic', 'economic', 'wild'], perks: [{ k: 'income', per: 'market', n: 1 }, { k: 'route', n: 0.25 }],
    bonus: '+1★ a turn for every market, and trade routes pay 25% more.', flavor: 'The doge answers to the counting houses.' },
  { id: 'theocracy', name: 'Theocracy', era: 2, slots: ['military', 'economic', 'wild', 'wild'], perks: [{ k: 'income', per: 'temple', n: 1 }, { k: 'heal', n: 1 }],
    bonus: '+1★ a turn for every temple, and units on your land heal 1 more HP a turn.', flavor: 'The temple bell rules the hours, the field and the camp.' },
];
export const GOV_BY_ID = Object.fromEntries(GOVS.map((g) => [g.id, g])) as Record<GovId, GovDef>;

export const CARDS: CardDef[] = [
  // Military
  { id: 'levee', name: 'Levée', type: 'military', era: 0, perks: [{ k: 'terrain', on: 'city', n: 0.5 }],
    desc: 'Units in your cities defend 0.5 better.', flavor: 'Every hand to the ramparts when the horns sound.' },
  { id: 'conscription', name: 'Conscription', type: 'military', tech: 'tactics', perks: [{ k: 'unitcost', n: -1 }],
    desc: 'Every unit costs 1★ less.', flavor: 'Each village sends its sons, and the muster roll is long.' },
  { id: 'bounty', name: 'Bounty Rolls', type: 'military', tech: 'archery', perks: [{ k: 'kill', n: 2 }],
    desc: '+2★ for every enemy you defeat.', flavor: 'A coin for every notch on the bow.' },
  { id: 'scorched', name: 'Scorched Earth', type: 'military', tech: 'roads', perks: [{ k: 'raidheal', n: 5 }],
    desc: 'Pillaging a trade trail or a coastal improvement heals the raider 5 HP.', flavor: 'Take what you can carry and burn the rest.' },
  { id: 'shielddrill', name: 'Shield Drill', type: 'military', tech: 'smithing', perks: [{ k: 'def', who: 'melee', n: 0.5 }],
    desc: 'Foot soldiers defend 0.5 better.', flavor: 'Lock the rims, brace the knee, hold.' },
  { id: 'horselords', name: 'Horse Lords', type: 'military', tech: 'horsemanship', perks: [{ k: 'atk', who: 'mounted', n: 0.5 }],
    desc: 'Mounted units hit 0.5 harder.', flavor: 'Born in the saddle, they fight as if never out of it.' },
  { id: 'surgeons', name: 'Field Surgeons', type: 'military', tech: 'meditation', perks: [{ k: 'heal', n: 2 }],
    desc: 'Units on your land heal 2 HP every turn.', flavor: 'Poultice, splint and a steady hand behind the lines.' },
  // Economic
  { id: 'tribute', name: 'Tribute Rolls', type: 'economic', era: 0, perks: [{ k: 'income', per: 'capital', n: 1 }],
    desc: '+1★ a turn from your capital.', flavor: 'A tally stick for every household under the chief.' },
  { id: 'urban', name: 'Urban Planning', type: 'economic', era: 1, perks: [{ k: 'levelpop', n: 1 }],
    desc: 'A city that levels up gains 1 extra population.', flavor: 'Straight streets, clean wells, room to grow.' },
  { id: 'caravan', name: 'Caravan Guilds', type: 'economic', tech: 'roads', perks: [{ k: 'route', n: 0.5 }],
    desc: 'Trade routes pay 50% more.', flavor: 'Sealed charters and a guard for every camel string.' },
  { id: 'stockyards', name: 'Stockyards', type: 'economic', tech: 'horsemanship', perks: [{ k: 'stock', of: 'horses', n: 1 }],
    desc: '+1 Horse a turn.', flavor: 'Fenced paddocks and a breeding book.' },
  { id: 'bloomery', name: 'Bloomery', type: 'economic', tech: 'mining', perks: [{ k: 'stock', of: 'iron', n: 1 }],
    desc: '+1 Iron a turn.', flavor: 'Charcoal, bog ore and a bellows that never rests.' },
  { id: 'pilgrims', name: 'Pilgrims', type: 'economic', tech: 'masonry', perks: [{ k: 'income', per: 'temple', n: 1 }],
    desc: '+1★ a turn for every temple.', flavor: 'The road to the shrine is lined with traders.' },
  { id: 'patronage', name: 'Patronage', type: 'economic', era: 1, perks: [{ k: 'wonderpct', n: 0.2 }],
    desc: 'World Wonders cost 20% less.', flavor: 'Great families compete to fund the greatest works.' },
  // Wild
  { id: 'survey', name: 'Survey Corps', type: 'wild', tech: 'hunting', perks: [{ k: 'move', who: 'recon', n: 1 }],
    desc: 'Scouts and Voyagers move 1 further.', flavor: 'Chain, compass and a satchel of maps.' },
  { id: 'nightwatch', name: 'Night Watch', type: 'wild', era: 1, perks: [{ k: 'vision', n: 1 }],
    desc: 'See 1 tile further around every unit and city.', flavor: 'Beacons on the hills, and someone always awake.' },
  { id: 'harbour', name: 'Harbour Masters', type: 'wild', tech: 'sailing', perks: [{ k: 'move', who: 'naval', n: 1 }],
    desc: 'Boats and ships move 1 further.', flavor: 'Pilots who know every sandbar by name.' },
  { id: 'tolls', name: 'Road Tolls', type: 'wild', tech: 'roads', perks: [{ k: 'income', per: 'road', n: 1 }],
    desc: '+1★ a turn for every 4 road tiles in your borders.', flavor: 'A gate, a keeper and a small copper coin.' },
];
export const CARD_BY_ID: Record<string, CardDef> = Object.fromEntries(CARDS.map((c) => [c.id, c]));

/**
 * The government and cards of an empire. `slots[i]` is the card in slot i (null: empty) and `ready[i]` the turn it
 * starts to count (a card swapped in takes effect a turn later). `since`: the turn the government was adopted;
 * `swapped`: the turn a card was last replaced (one replacement a turn).
 */
export interface GovState {
  id: GovId;
  slots: (string | null)[];
  ready: number[];
  since: number;
  swapped: number;
}

/** The perks an empire's government and its policy cards in force give it right now (read by game/perks). */
export function govPerks(p: Player, turn: number): Perk[] {
  const g = p.gov;
  const out: Perk[] = [...(GOV_BY_ID[g?.id ?? 'chiefdom']?.perks ?? [])]; // an old save is a Chiefdom with empty slots
  g?.slots.forEach((id, i) => {
    const c = id ? CARD_BY_ID[id] : undefined;
    if (c && turn >= (g.ready[i] ?? 0)) out.push(...c.perks);
  });
  return out;
}

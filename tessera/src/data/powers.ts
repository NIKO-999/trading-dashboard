// One Empire Power per empire: a strong, once-in-a-while move that only that people can make. A power is a short list
// of effects; the rules engine (usePower in game/rules.ts) applies them, the AI uses them too.
import type { TribeId, UnitKind } from '../game/types';

type Who = 'all' | 'ranged' | 'mounted' | 'naval';
type Imp = 'farm' | 'mine' | 'temple' | 'port' | 'market' | 'lumber';

export type PowerFx =
  | { t: 'grow'; n: number; per?: Imp; max?: number } // every city grows: n pop, or n per matching tile (up to max)
  | { t: 'stars'; base?: number; perCity?: number; per?: [Imp, number]; perRoads?: number } // gold for the treasury
  | { t: 'heal'; n: number }
  | { t: 'buff'; stat: 'atk' | 'def' | 'move'; n: number; turns: number; who?: Who } // your units, this turn and the next (turns = own turns covered)
  | { t: 'curse'; stat: 'atk' | 'move' | 'strike'; n: number; turns: number } // every rival's units
  | { t: 'reveal'; r: number; from: 'units' | 'cities' | 'both' }
  | { t: 'levy'; kind: UnitKind | 'warrior'; max?: number } // a free soldier from each city that has room
  | { t: 'refresh'; who: Who } // those units may act again
  | { t: 'raid'; n: number } // take up to n★ from every rival
  | { t: 'tech' } // learn the cheapest available tech for free
  | { t: 'forest'; per: number } // plant forest around each city
  | { t: 'walls' }
  | { t: 'convert'; hp: number }; // win over enemy units of at most this health standing next to your units

export interface PowerDef {
  name: string;
  blurb: string;
  cooldown: number; // turns before it can be used again (it also starts on cooldown)
  fx: PowerFx[];
}

export const POWERS: Record<TribeId, PowerDef> = {
  egypt: { name: 'Flood of the Nile', blurb: 'The river rises. Every city grows by 1 for each of its farms (up to 3).', cooldown: 12, fx: [{ t: 'grow', n: 1, per: 'farm', max: 3 }] },
  aztec: { name: 'Flower War', blurb: 'Your warriors are stirred to battle: all units hit 1 harder for two turns and heal 3.', cooldown: 10, fx: [{ t: 'buff', stat: 'atk', n: 1, turns: 2 }, { t: 'heal', n: 3 }] },
  polynesia: { name: 'Star Path', blurb: 'The navigators read the stars: reveal the sea and coast around every boat and city, and boats sail 1 further for two turns.', cooldown: 10, fx: [{ t: 'reveal', r: 5, from: 'both' }, { t: 'buff', stat: 'move', n: 1, turns: 2, who: 'naval' }] },
  rome: { name: 'Levy of the Legions', blurb: 'The Senate calls the levy: a free soldier appears in every city that has room.', cooldown: 12, fx: [{ t: 'levy', kind: 'warrior' }] },
  pirates: { name: 'Black Flag Raid', blurb: 'A lightning raid: take up to 3★ from every rival.', cooldown: 8, fx: [{ t: 'raid', n: 3 }] },
  vikings: { name: 'Berserkergang', blurb: 'Battle-fury: all units hit 2 harder for two turns, but guard 1 less.', cooldown: 10, fx: [{ t: 'buff', stat: 'atk', n: 2, turns: 2 }, { t: 'buff', stat: 'def', n: -1, turns: 2 }] },
  japan: { name: 'Way of the Sword', blurb: 'Years of discipline in an instant: learn the cheapest available tech for free.', cooldown: 14, fx: [{ t: 'tech' }] },
  mongols: { name: 'Tumen Charge', blurb: 'The horde rides again: every mounted unit may move and strike a second time, and rides 1 further for two turns.', cooldown: 11, fx: [{ t: 'refresh', who: 'mounted' }, { t: 'buff', stat: 'move', n: 1, turns: 2, who: 'mounted' }] },
  greeks: { name: 'Golden Age', blurb: 'Philosophy and trade flourish: every city grows by 1 and you gain 1★ per city.', cooldown: 15, fx: [{ t: 'grow', n: 1 }, { t: 'stars', perCity: 1 }] },
  zulu: { name: 'Horns of the Buffalo', blurb: 'The regiments close in: all units march 1 further and hit 1 harder for two turns.', cooldown: 10, fx: [{ t: 'buff', stat: 'move', n: 1, turns: 2 }, { t: 'buff', stat: 'atk', n: 1, turns: 2 }] },
  persia: { name: 'Royal Road', blurb: 'The king’s highway: every unit travels 2 further this turn and the next.', cooldown: 9, fx: [{ t: 'buff', stat: 'move', n: 2, turns: 2 }] },
  celts: { name: 'Sacred Grove', blurb: 'The druids call the forest: up to 2 empty fields beside each city turn to woodland, and every city grows by 1.', cooldown: 13, fx: [{ t: 'forest', per: 2 }, { t: 'grow', n: 1 }] },
  inuit: { name: 'Whiteout', blurb: 'A blizzard sweeps in: every rival unit marches 1 less and hits 1 less for two turns.', cooldown: 12, fx: [{ t: 'curse', stat: 'move', n: -1, turns: 3 }, { t: 'curse', stat: 'atk', n: -1, turns: 3 }] },
  inca: { name: 'Terrace Harvest', blurb: 'The mountain harvest comes in: every city grows by 1 for each of its mines (up to 3).', cooldown: 12, fx: [{ t: 'grow', n: 1, per: 'mine', max: 3 }] },
  ethiopia: { name: 'Sanctuary of Aksum', blurb: 'The highland holds: all units heal fully and guard 1 more for two turns.', cooldown: 11, fx: [{ t: 'heal', n: 99 }, { t: 'buff', stat: 'def', n: 1, turns: 2 }] },
  aboriginal: { name: 'Walkabout', blurb: 'Reading the land: reveal the country around every unit, and all units walk 1 further for two turns.', cooldown: 10, fx: [{ t: 'reveal', r: 5, from: 'units' }, { t: 'buff', stat: 'move', n: 1, turns: 2 }] },
  china: { name: 'Grand Canal', blurb: 'Trade flows along your roads: gain 4★, plus 2★ per city and 1★ for every 2 road tiles.', cooldown: 11, fx: [{ t: 'stars', base: 4, perCity: 2, perRoads: 0.5 }] },
  india: { name: 'Festival of Lights', blurb: 'A great festival: all units heal fully and every city grows by 1.', cooldown: 14, fx: [{ t: 'heal', n: 99 }, { t: 'grow', n: 1 }] },
  mali: { name: 'Pilgrimage of the Mansa', blurb: 'The caravan returns laden with gold: gain 3★, plus 2★ per city and 2★ per mine.', cooldown: 12, fx: [{ t: 'stars', base: 3, perCity: 2, per: ['mine', 2] }] },
  lakota: { name: 'Plains Scouts', blurb: 'Riders fan out over the prairie: reveal the land around every unit, and mounted units ride 1 further for two turns.', cooldown: 10, fx: [{ t: 'reveal', r: 6, from: 'units' }, { t: 'buff', stat: 'move', n: 1, turns: 2, who: 'mounted' }] },
  ottoman: { name: 'Janissary Corps', blurb: 'The Sultan raises the Corps: a free Janissary in each of up to 3 cities with room.', cooldown: 13, fx: [{ t: 'levy', kind: 'janissary', max: 3 }] },
  maya: { name: 'Eclipse', blurb: 'The sun goes dark: rival units cannot attack during their next turn.', cooldown: 16, fx: [{ t: 'curse', stat: 'strike', n: 1, turns: 2 }] },
  korea: { name: 'Hwacha Volley', blurb: 'Fire arrows darken the sky: all ranged units hit 2 harder for two turns.', cooldown: 10, fx: [{ t: 'buff', stat: 'atk', n: 2, turns: 2, who: 'ranged' }] },
  khmer: { name: 'Naga Wards', blurb: 'The serpent guards the temples: every city gets walls, and all units guard 1 more for two turns.', cooldown: 13, fx: [{ t: 'walls' }, { t: 'buff', stat: 'def', n: 1, turns: 2 }] },
  swahili: { name: 'Monsoon Trade', blurb: 'The monsoon fleets arrive: gain 2★, plus 2★ per city and 3★ per port.', cooldown: 11, fx: [{ t: 'stars', base: 2, perCity: 2, per: ['port', 3] }] },
  tibet: { name: 'Compassion of the Plateau', blurb: 'Weary foes lay down their arms: enemy units of 5 health or less next to your units join you.', cooldown: 14, fx: [{ t: 'convert', hp: 5 }] },
};

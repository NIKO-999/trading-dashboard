import type { UnitKind } from '../game/types';

export type Skill = 'dash' | 'escape' | 'fortify' | 'persist' | 'forestwalk' | 'amphibious' | 'carry' | 'plunder' | 'scout';

export interface UnitDef {
  kind: UnitKind;
  name: string;
  cost: number;
  hp: number;
  atk: number;
  def: number;
  move: number;
  range: number;
  naval: boolean;
  skills: Skill[];
  tech: string | null; // tech required to train (null = always)
  /** Sees this far around it (units see 1 tile, 2 from a mountain, unless they have more). */
  vision?: number;
  trainable: boolean; // can be trained in cities
  blurb: string;
}

const U = (d: Omit<UnitDef, 'naval' | 'trainable'> & Partial<Pick<UnitDef, 'naval' | 'trainable'>>): UnitDef => ({
  naval: false,
  trainable: true,
  ...d,
});

export const UNITS: Record<UnitKind, UnitDef> = {
  warrior: U({ kind: 'warrior', name: 'Warrior', cost: 2, hp: 10, atk: 2, def: 2, move: 1, range: 1, skills: ['dash', 'fortify'], tech: null, blurb: 'Cheap, sturdy all-rounder.' }),
  rider: U({ kind: 'rider', name: 'Rider', cost: 3, hp: 10, atk: 2, def: 1, move: 2, range: 1, skills: ['dash', 'escape', 'fortify'], tech: 'riding', blurb: 'Fast scout that can strike and retreat.' }),
  archer: U({ kind: 'archer', name: 'Archer', cost: 3, hp: 10, atk: 2, def: 1, move: 1, range: 2, skills: ['dash', 'fortify'], tech: 'archery', blurb: 'Hits from two tiles away.' }),
  defender: U({ kind: 'defender', name: 'Defender', cost: 3, hp: 15, atk: 1, def: 3, move: 1, range: 1, skills: ['fortify'], tech: 'tactics', blurb: 'A wall of shields.' }),
  swordsman: U({ kind: 'swordsman', name: 'Swordsman', cost: 5, hp: 15, atk: 3, def: 3, move: 1, range: 1, skills: ['dash'], tech: 'smithing', blurb: 'Heavy hitter with iron blades.' }),
  catapult: U({ kind: 'catapult', name: 'Catapult', cost: 8, hp: 10, atk: 4, def: 0, move: 1, range: 3, skills: [], tech: 'engineering', blurb: 'Long-range siege engine. Fragile up close.' }),
  knight: U({ kind: 'knight', name: 'Knight', cost: 8, hp: 10, atk: 3.5, def: 1, move: 3, range: 1, skills: ['dash', 'persist', 'fortify'], tech: 'chivalry', blurb: 'Keeps charging after every kill.' }),
  giant: U({ kind: 'giant', name: 'Colossus', cost: 10, hp: 40, atk: 5, def: 4, move: 1, range: 1, skills: [], tech: null, trainable: false, blurb: 'A towering champion granted to great cities.' }),
  explorer: U({ kind: 'explorer', name: 'Pathfinder', cost: 0, hp: 1, atk: 0, def: 0, move: 0, range: 0, skills: ['scout'], tech: null, trainable: false, blurb: 'Wanders off and reveals the land.' }),
  boat: U({ kind: 'boat', name: 'Canoe', cost: 0, hp: 10, atk: 1, def: 1, move: 2, range: 2, naval: true, skills: ['dash', 'carry'], tech: null, trainable: false, blurb: 'Carries a land unit across shallow water.' }),
  ship: U({ kind: 'ship', name: 'Galley', cost: 5, hp: 10, atk: 2, def: 2, move: 3, range: 2, naval: true, skills: ['dash', 'carry'], tech: 'sailing', trainable: false, blurb: 'Sturdier boat that can cross the open ocean.' }),
  warship: U({ kind: 'warship', name: 'Trireme', cost: 15, hp: 15, atk: 4, def: 3, move: 3, range: 2, naval: true, skills: ['dash', 'carry'], tech: 'navigation', trainable: false, blurb: 'Rules the waves.' }),

  // Tribe-unique units
  legionary: U({ kind: 'legionary', name: 'Legionary', cost: 2, hp: 10, atk: 2, def: 3, move: 1, range: 1, skills: ['dash', 'fortify'], tech: null, blurb: 'Roman line infantry — a warrior with a real shield.' }),
  chariot: U({ kind: 'chariot', name: 'Chariot', cost: 4, hp: 10, atk: 3, def: 1, move: 2, range: 1, skills: ['dash', 'escape'], tech: 'riding', blurb: 'Egyptian war-chariot. Hits hard at speed.' }),
  jaguar: U({ kind: 'jaguar', name: 'Jaguar Warrior', cost: 3, hp: 10, atk: 2.5, def: 1, move: 2, range: 1, skills: ['dash', 'escape', 'forestwalk'], tech: 'riding', blurb: 'Aztec elite. Moves freely through forest.' }),
  buccaneer: U({ kind: 'buccaneer', name: 'Buccaneer', cost: 4, hp: 10, atk: 2, def: 1, move: 1, range: 2, skills: ['dash', 'amphibious', 'plunder'], tech: 'archery', blurb: 'Pirate musketeer. Wades through shallows, loots on kills.' }),
  waka: U({ kind: 'waka', name: 'Waka Taua', cost: 0, hp: 10, atk: 2, def: 1, move: 3, range: 2, naval: true, skills: ['dash', 'carry'], tech: null, trainable: false, blurb: 'Māori war canoe, paddled hard. Fast and fierce.' }),
  berserker: U({ kind: 'berserker', name: 'Berserker', cost: 5, hp: 15, atk: 3.5, def: 2, move: 1, range: 1, skills: ['dash'], tech: 'smithing', blurb: 'Viking axeman. Hits harder, guards less.' }),
  samurai: U({ kind: 'samurai', name: 'Samurai', cost: 6, hp: 15, atk: 3, def: 3, move: 1, range: 1, skills: ['dash', 'persist'], tech: 'smithing', blurb: 'Japanese swordmaster. Can strike again after a kill.' }),
  horsearcher: U({ kind: 'horsearcher', name: 'Horse Archer', cost: 4, hp: 10, atk: 2, def: 1, move: 2, range: 2, skills: ['dash', 'escape'], tech: 'archery', blurb: 'Mongol mounted bowman. Shoots and rides away.' }),
  hoplite: U({ kind: 'hoplite', name: 'Hoplite', cost: 3, hp: 15, atk: 2, def: 3, move: 1, range: 1, skills: ['fortify'], tech: 'tactics', blurb: 'Greek spearman behind a bronze shield. Hits back harder.' }),
  impi: U({ kind: 'impi', name: 'Impi', cost: 2, hp: 10, atk: 2.5, def: 1.5, move: 1, range: 1, skills: ['dash', 'fortify'], tech: null, blurb: 'Zulu warrior with a stabbing spear. Strikes harder than a warrior.' }),
  immortal: U({ kind: 'immortal', name: 'Immortal', cost: 5, hp: 15, atk: 3, def: 2.5, move: 1, range: 1, skills: ['dash', 'persist'], tech: 'smithing', blurb: 'Persian elite spearman in scale armour. Presses on after a kill.' }),
  clansman: U({ kind: 'clansman', name: 'Clansman', cost: 2, hp: 12, atk: 2, def: 1.5, move: 1, range: 1, skills: ['dash', 'forestwalk'], tech: null, blurb: 'Celtic warrior of the oak groves. Slips through forest.' }),
  harpooner: U({ kind: 'harpooner', name: 'Harpooner', cost: 3, hp: 10, atk: 2, def: 1, move: 1, range: 2, skills: ['dash', 'fortify'], tech: 'archery', blurb: 'Inuit hunter with a barbed harpoon. Hits from two tiles.' }),
  slinger: U({ kind: 'slinger', name: 'Slinger', cost: 3, hp: 10, atk: 2.5, def: 1, move: 1, range: 2, skills: ['dash', 'fortify'], tech: 'archery', blurb: 'Inca sling-warrior. Hurls stones harder than an archer shoots.' }),
  crossbowman: U({ kind: 'crossbowman', name: 'Crossbowman', cost: 4, hp: 10, atk: 2.5, def: 1, move: 1, range: 2, skills: ['dash', 'fortify'], tech: 'archery', blurb: 'Chinese crossbow infantry. Shoots harder than an archer.' }),
  elephant: U({ kind: 'elephant', name: 'War Elephant', cost: 8, hp: 20, atk: 3, def: 1.5, move: 2, range: 1, skills: ['persist', 'fortify'], tech: 'chivalry', blurb: 'Indian war elephant. Tough, fast and keeps charging after a kill.' }),
  sofa: U({ kind: 'sofa', name: 'Sofa', cost: 3, hp: 12, atk: 2.5, def: 2, move: 1, range: 1, skills: ['dash', 'fortify'], tech: null, blurb: 'Malian guardian warrior. A warrior that is a little tougher.' }),
  buffalorider: U({ kind: 'buffalorider', name: 'Horse Warrior', cost: 3, hp: 10, atk: 2.5, def: 1, move: 2, range: 1, skills: ['dash', 'escape', 'fortify'], tech: 'riding', blurb: 'Lakota mounted hunter and warrior. Swift and hard-hitting.' }),
  janissary: U({ kind: 'janissary', name: 'Janissary', cost: 4, hp: 10, atk: 3, def: 1, move: 1, range: 2, skills: ['dash', 'fortify'], tech: 'archery', blurb: 'Ottoman gunpowder infantry. Fires from two tiles away.' }),
  holcan: U({ kind: 'holcan', name: 'Holcan', cost: 2, hp: 10, atk: 2.5, def: 1.5, move: 1, range: 1, skills: ['dash', 'forestwalk'], tech: null, blurb: 'Maya spear-warrior with a jaguar-skin shield. Walks the jungle freely.' }),
  hwacha: U({ kind: 'hwacha', name: 'Hwacha', cost: 8, hp: 10, atk: 4.5, def: 0, move: 1, range: 3, skills: [], tech: 'engineering', blurb: 'Korean rocket-arrow cart. Volleys of fire arrows from three tiles away.' }),
  guardian: U({ kind: 'guardian', name: 'Temple Guardian', cost: 3, hp: 15, atk: 1.5, def: 3, move: 1, range: 1, skills: ['fortify'], tech: 'tactics', blurb: 'Khmer guardian of the temple gates. A wall of shields with a stinging spear.' }),
  askari: U({ kind: 'askari', name: 'Askari', cost: 2, hp: 10, atk: 2, def: 2, move: 1, range: 1, skills: ['dash', 'fortify'], tech: null, blurb: 'Swahili coast guard with a hide shield. A warrior who holds the line.' }),
  khampa: U({ kind: 'khampa', name: 'Khampa Rider', cost: 3, hp: 12, atk: 2, def: 1.5, move: 2, range: 1, skills: ['dash', 'escape', 'fortify'], tech: 'riding', blurb: 'Tibetan highland horseman. Hardy, fast and steady.' }),
  woomera: U({ kind: 'woomera', name: 'Woomera Hunter', cost: 3, hp: 10, atk: 2.5, def: 1, move: 1, range: 2, skills: ['dash', 'forestwalk'], tech: 'archery', blurb: 'Aboriginal hunter with a spear-thrower. Throws far and moves freely through forest.' }),
  shotelai: U({ kind: 'shotelai', name: 'Shotelai', cost: 5, hp: 15, atk: 3.5, def: 2.5, move: 1, range: 1, skills: ['dash'], tech: 'smithing', blurb: 'Ethiopian sickle-sword fighter that cuts around shields.' }),

  // Each empire's named champion (see game/heroes): never trained; its name and look come from the empire
  hero: U({ kind: 'hero', name: 'Hero', cost: 10, hp: 20, atk: 3, def: 2.5, move: 2, range: 1, skills: ['dash', 'fortify'], tech: null, trainable: false, blurb: 'A named champion of the empire. Levels up in battle and has a special ability.' }),

  // Every empire's merchants (see game/trade): they never fight or capture; their look and name come from the empire
  trader: U({ kind: 'trader', name: 'Trader', cost: 5, hp: 8, atk: 0, def: 1, move: 2, range: 1, skills: [], tech: 'roads', blurb: 'A merchant caravan. Walk it to another city and open a trade route that pays Stars every turn.' }),
  tradeship: U({ kind: 'tradeship', name: 'Trade Ship', cost: 6, hp: 10, atk: 0, def: 1, move: 3, range: 1, naval: true, skills: [], tech: 'sailing', blurb: 'A merchant ship, launched beside a coastal city. Sail it next to another port city to open a sea route.' }),

  // The role units of the three empire types (see game/roles): trained only by empires of that type, never capturing;
  // their name and look come from the empire
  recruiter: U({ kind: 'recruiter', name: 'Recruiter', cost: 3, hp: 10, atk: 0, def: 2, move: 1, range: 1, skills: ['dash', 'fortify'], tech: 'tactics', blurb: 'A warlord who raises troops. Station it in a city: units there cost 1★ less, the city supports one more, and it can rally militia when enemies come near.' }),
  sapper: U({ kind: 'sapper', name: 'Sappers', cost: 5, hp: 10, atk: 1, def: 2, move: 1, range: 1, skills: ['dash'], tech: 'roads', blurb: 'Military engineers. Lay roads as they march, build forts and bridges, and undermine enemy walls.' }),
  builder: U({ kind: 'builder', name: 'Master Builder', cost: 5, hp: 10, atk: 0, def: 1, move: 1, range: 1, skills: ['dash'], tech: 'farming', blurb: 'Builds farms, mines, ports and markets beside it at half price, and upgrades them into grander works.' }),
  collector: U({ kind: 'collector', name: 'Tax Collector', cost: 5, hp: 6, atk: 0, def: 0.5, move: 1, range: 1, skills: ['dash'], tech: 'trade', blurb: 'Station it in a city: the city pays half as much again in Stars. Fragile, and a prize for enemies.' }),
  fishfleet: U({ kind: 'fishfleet', name: 'Fishing Fleet', cost: 5, hp: 10, atk: 0, def: 1, move: 3, range: 1, naval: true, vision: 2, skills: ['dash'], tech: 'fishing', blurb: 'Launched beside a coastal city. Brings in fish and whales anywhere at sea for Stars and people, and 1★ a turn.' }),
  voyager: U({ kind: 'voyager', name: 'Voyager', cost: 8, hp: 10, atk: 0, def: 1, move: 4, range: 1, naval: true, vision: 3, skills: ['dash'], tech: 'sailing', blurb: 'A long-range explorer ship that crosses the ocean. Found an outpost city on an unclaimed coast.' }),

  // Every empire's auxiliaries (see game/auxiliaries): their name and look come from the empire. Scouts and Healers
  // never fight or capture
  spearman: U({ kind: 'spearman', name: 'Spearman', cost: 3, hp: 10, atk: 1.5, def: 2, move: 1, range: 1, skills: ['dash', 'fortify'], tech: 'hunting', blurb: 'Cheap spear infantry. Defends at double strength against mounted units and strikes them for +50%.' }),
  scout: U({ kind: 'scout', name: 'Scout', cost: 2, hp: 8, atk: 0, def: 1, move: 3, range: 1, vision: 3, skills: ['dash', 'forestwalk'], tech: null, blurb: 'A fast explorer that sees far and slips through forest. Finds 3★ more in ruins. Cannot fight or capture.' }),
  healer: U({ kind: 'healer', name: 'Healer', cost: 4, hp: 8, atk: 0, def: 1, move: 1, range: 1, skills: ['dash'], tech: 'meditation', blurb: 'Heals your units beside it 2 HP every turn, and can Convert a badly wounded enemy beside it (every 5 turns). Cannot fight or capture.' }),

  // Neutral Great Beasts (see game/wild): never trained, owned by the hidden neutral player
  kraken: U({ kind: 'kraken', name: 'Kraken', cost: 0, hp: 30, atk: 4, def: 2, move: 1, range: 1, naval: true, skills: [], tech: null, trainable: false, blurb: 'A leviathan of the deep ocean. Drags down any ship that sails too close.' }),
};

export const NAVAL_UPGRADE: Partial<Record<UnitKind, UnitKind>> = { boat: 'ship', waka: 'ship', ship: 'warship' };

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
  /** The era (game/eras index) an empire must have reached to train it: 2 Medieval, 3 Renaissance. */
  era?: number;
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

  // every empire's extra cavalry (drawn in its own style by render/units drawRider)
  horsebow: U({ kind: 'horsebow', name: 'Mounted Archer', cost: 5, hp: 10, atk: 2, def: 1, move: 2, range: 2, skills: ['dash', 'escape'], tech: 'horsemanship', blurb: 'Shoots from 2 tiles and rides on after shooting. Uses 1 Horse.' }),
  lancer: U({ kind: 'lancer', name: 'Lancer', cost: 4, hp: 10, atk: 2.5, def: 1, move: 3, range: 1, skills: ['dash', 'escape'], tech: 'roads', blurb: 'Fastest on land; +1 attack against archers and siege engines. Fragile: defence 1. Uses 1 Horse.' }),
  cataphract: U({ kind: 'cataphract', name: 'Cataphract', cost: 9, hp: 18, atk: 3.5, def: 3, move: 2, range: 1, skills: ['dash', 'fortify'], tech: 'smithing', blurb: 'Armoured heavy cavalry, a wall that charges. Bogged down in forest and swamp (−1 defence there); Pikemen stop it. Uses 1 Iron and 2 Horses.' }),
  // every empire's extra ground troops: each has a job and a weakness (see data/troops)
  axeman: U({ kind: 'axeman', name: 'Axeman', cost: 4, hp: 12, atk: 3, def: 1, move: 1, range: 1, skills: ['dash'], tech: 'smithing', blurb: 'Shield-breaker: +1.5 attack against shield units (Defenders, Pikemen, Spearmen, shield walls). Fragile: defence 1. Uses 1 Iron.' }),
  javelineer: U({ kind: 'javelineer', name: 'Javelineer', cost: 3, hp: 8, atk: 1.5, def: 1, move: 1, range: 2, skills: ['dash', 'escape'], tech: 'hunting', blurb: 'Cheap skirmisher: throws from 2 tiles and can move on after throwing. Light: 8 health.' }),
  ranger: U({ kind: 'ranger', name: 'Ranger', cost: 4, hp: 10, atk: 2, def: 1.5, move: 2, range: 1, skills: ['dash', 'fortify', 'forestwalk'], tech: 'forestry', blurb: 'Woodsman: walks through forest freely, hidden there, and +1 attack and defence in forest. Ordinary in the open.' }),
  pikeman: U({ kind: 'pikeman', name: 'Pikeman', cost: 5, hp: 15, atk: 1.5, def: 3, move: 1, range: 1, skills: ['fortify'], tech: 'tactics', era: 2, blurb: 'Cavalry-stopper: defence doubled against mounted attackers. Weak attack. Medieval era.' }),
  musketeer: U({ kind: 'musketeer', name: 'Musketeer', cost: 8, hp: 15, atk: 4, def: 3, move: 1, range: 2, skills: ['fortify'], tech: 'smithing', era: 3, blurb: 'Gunpowder: shoots 2 tiles and ignores the defence bonus of walls, forest and hills. Cannot shoot after moving. Renaissance era; uses 1 Iron.' }),
  ram: U({ kind: 'ram', name: 'Battering Ram', cost: 6, hp: 14, atk: 1.5, def: 0.5, move: 1, range: 1, skills: [], tech: 'engineering', blurb: 'Triple attack against units in a city. Nearly useless in the open; cannot attack after moving.' }),
  ballista: U({ kind: 'ballista', name: 'Ballista', cost: 7, hp: 8, atk: 3, def: 0, move: 1, range: 4, skills: [], tech: 'carpentry', blurb: 'The longest shot: 4 tiles. Cannot shoot after moving, and has no defence of its own.' }),
  cannon: U({ kind: 'cannon', name: 'Cannon', cost: 12, hp: 12, atk: 5, def: 0.5, move: 1, range: 3, skills: [], tech: 'engineering', era: 3, blurb: '+50% damage against units in a city. Slow and costly; cannot shoot after moving. Renaissance era; uses 2 Iron.' }),

  // Tribe-unique units
  legionary: U({ kind: 'legionary', name: 'Legionary', cost: 2, hp: 12, atk: 2.5, def: 3, move: 1, range: 1, skills: ['dash', 'fortify'], tech: null, blurb: 'Testudo: locks shields against missiles, +1 defence against ranged attacks.' }),
  chariot: U({ kind: 'chariot', name: 'Chariot', cost: 4, hp: 12, atk: 3, def: 1, move: 2, range: 2, skills: ['dash', 'escape'], tech: 'riding', blurb: 'Archer chariot: shoots from 2 tiles and can drive on after shooting.' }),
  jaguar: U({ kind: 'jaguar', name: 'Jaguar Warrior', cost: 3, hp: 12, atk: 3, def: 1.5, move: 2, range: 1, skills: ['dash', 'escape', 'forestwalk'], tech: 'riding', blurb: 'Jungle pounce: moves freely through forest; a strike from forest takes no counter-blow.' }),
  buccaneer: U({ kind: 'buccaneer', name: 'Buccaneer', cost: 3, hp: 12, atk: 2.5, def: 1.5, move: 1, range: 2, skills: ['dash', 'amphibious', 'plunder'], tech: 'archery', blurb: 'Plunder: wades through shallows and loots +2★ from every kill.' }),
  waka: U({ kind: 'waka', name: 'Waka Taua', cost: 0, hp: 12, atk: 2, def: 1, move: 3, range: 2, naval: true, skills: ['dash', 'carry'], tech: null, trainable: false, blurb: 'Ramming prow: the fastest boat (carries a unit); rams adjacent ships for +50% damage.' }),
  berserker: U({ kind: 'berserker', name: 'Berserker', cost: 4, hp: 15, atk: 4.5, def: 2.5, move: 1, range: 1, skills: ['dash'], tech: 'smithing', blurb: 'Battle fury: fights at full strength however wounded; its wounds never weaken its blows.' }),
  samurai: U({ kind: 'samurai', name: 'Samurai', cost: 5, hp: 15, atk: 4, def: 3.5, move: 1, range: 1, skills: ['dash', 'persist'], tech: 'smithing', blurb: 'Bushidō: strikes again after every kill.' }),
  horsearcher: U({ kind: 'horsearcher', name: 'Horse Archer', cost: 3, hp: 12, atk: 2.5, def: 1, move: 2, range: 2, skills: ['dash', 'escape'], tech: 'archery', blurb: 'Mounted archer: shoots from 2 tiles and can ride on after shooting.' }),
  hoplite: U({ kind: 'hoplite', name: 'Hoplite', cost: 3, hp: 15, atk: 2, def: 3.5, move: 1, range: 1, skills: ['fortify'], tech: 'tactics', blurb: 'Phalanx: its spear wall hits back 50% harder when attacked.' }),
  impi: U({ kind: 'impi', name: 'Impi', cost: 2, hp: 12, atk: 3, def: 2, move: 1, range: 1, skills: ['dash', 'fortify'], tech: null, blurb: 'Bull horns: after attacking it may still run 1 tile to close the horns around the foe.' }),
  immortal: U({ kind: 'immortal', name: 'Immortal', cost: 5, hp: 18, atk: 3.5, def: 3.5, move: 1, range: 1, skills: ['dash'], tech: 'smithing', blurb: 'Undying: heals 3 HP at the start of every turn, wherever it stands.' }),
  clansman: U({ kind: 'clansman', name: 'Clansman', cost: 2, hp: 14, atk: 2.5, def: 2, move: 1, range: 1, skills: ['dash', 'forestwalk'], tech: null, blurb: 'Oak-grove warband: moves freely through forest and attacks +1 from forest.' }),
  harpooner: U({ kind: 'harpooner', name: 'Harpooner', cost: 3, hp: 12, atk: 2.5, def: 1.5, move: 1, range: 2, skills: ['dash', 'fortify'], tech: 'archery', blurb: 'Harpoon: double damage to ships, boats and Great Beasts.' }),
  slinger: U({ kind: 'slinger', name: 'Slinger', cost: 3, hp: 12, atk: 3, def: 1, move: 1, range: 2, skills: ['dash', 'fortify'], tech: 'archery', blurb: 'Plunging stones: shoots from 2 tiles; +1 attack when it slings from a mountain.' }),
  crossbowman: U({ kind: 'crossbowman', name: 'Crossbowman', cost: 4, hp: 12, atk: 3, def: 1.5, move: 1, range: 2, skills: ['dash', 'fortify'], tech: 'archery', blurb: 'Siege bolts: shoots from 2 tiles; +1 attack against units in a city or fort.' }),
  elephant: U({ kind: 'elephant', name: 'War Elephant', cost: 8, hp: 22, atk: 4, def: 2, move: 2, range: 1, skills: ['persist', 'fortify'], tech: 'chivalry', blurb: 'Trample: a melee blow carries through, and the enemy behind the target takes half the damage.' }),
  sofa: U({ kind: 'sofa', name: 'Sofa', cost: 3, hp: 14, atk: 2.5, def: 2.5, move: 1, range: 1, skills: ['dash', 'fortify'], tech: null, blurb: 'Mansa\'s guard: +2 defence in its own cities.' }),
  buffalorider: U({ kind: 'buffalorider', name: 'Horse Warrior', cost: 3, hp: 13, atk: 2.5, def: 1.5, move: 2, range: 1, skills: ['dash', 'escape', 'fortify'], tech: 'riding', blurb: 'Plains charge: +1 attack when it charges from open ground (field, desert or tundra).' }),
  janissary: U({ kind: 'janissary', name: 'Janissary', cost: 4, hp: 12, atk: 3, def: 1.5, move: 1, range: 2, skills: ['dash', 'fortify'], tech: 'archery', blurb: 'Musket volley: fires from 2 tiles; +1 attack against melee units.' }),
  holcan: U({ kind: 'holcan', name: 'Holcan', cost: 2, hp: 12, atk: 3, def: 2, move: 1, range: 1, skills: ['dash', 'forestwalk'], tech: null, blurb: 'Jungle ambush: moves freely through forest and is hidden there from enemies not right beside it.' }),
  hwacha: U({ kind: 'hwacha', name: 'Hwacha', cost: 8, hp: 12, atk: 5, def: 0.5, move: 1, range: 3, skills: [], tech: 'engineering', blurb: 'Rocket volley: fires 3 tiles; every enemy next to the target takes half the damage too.' }),
  guardian: U({ kind: 'guardian', name: 'Temple Guardian', cost: 3, hp: 18, atk: 1.5, def: 3.5, move: 1, range: 1, skills: ['fortify'], tech: 'tactics', blurb: 'Temple ward: friendly units next to it take a third less damage, and the guardian takes that share instead.' }),
  askari: U({ kind: 'askari', name: 'Askari', cost: 2, hp: 12, atk: 2, def: 3, move: 1, range: 1, skills: ['dash', 'fortify'], tech: null, blurb: 'Coast guard: +1 defence on land beside water.' }),
  khampa: U({ kind: 'khampa', name: 'Khampa Rider', cost: 3, hp: 14, atk: 2.5, def: 1.5, move: 2, range: 1, skills: ['dash', 'escape', 'fortify'], tech: 'riding', blurb: 'Highlander: mountains never stop its move; it rides over them like open ground.' }),
  sacredband: U({ kind: 'sacredband', name: 'Sacred Band', cost: 3, hp: 16, atk: 2, def: 3.5, move: 1, range: 1, skills: ['dash', 'fortify'], tech: null, blurb: 'Sacred oath: defends at full strength however wounded.' }),
  varangian: U({ kind: 'varangian', name: 'Varangian Guard', cost: 5, hp: 16, atk: 4, def: 3, move: 1, range: 1, skills: ['dash'], tech: 'smithing', blurb: 'Emperor\'s guard: in or beside one of your cities, +1 defence and it heals 2 HP every turn.' }),
  camelrider: U({ kind: 'camelrider', name: 'Camel Rider', cost: 3, hp: 13, atk: 2.5, def: 1.5, move: 2, range: 1, skills: ['dash', 'escape', 'fortify'], tech: 'riding', blurb: 'Ship of the desert: horses shy from camels (+1.5 defence against mounted attackers); +1 attack from the desert.' }),
  druzhina: U({ kind: 'druzhina', name: 'Druzhina', cost: 8, hp: 13, atk: 4, def: 1.5, move: 3, range: 1, skills: ['dash', 'persist', 'fortify', 'forestwalk'], tech: 'chivalry', blurb: 'Winter host: forest never stops it; +1 attack and defence on tundra and ice.' }),
  rattan: U({ kind: 'rattan', name: 'Rattan Guard', cost: 2, hp: 12, atk: 2.5, def: 2.5, move: 1, range: 1, skills: ['dash', 'fortify', 'forestwalk'], tech: null, blurb: 'Jungle guerrilla: moves freely through forest and swamp, and attacks +1 from them.' }),
  woomera: U({ kind: 'woomera', name: 'Woomera Hunter', cost: 3, hp: 12, atk: 2.5, def: 1, move: 1, range: 3, skills: ['dash', 'forestwalk'], tech: 'archery', blurb: 'Spear-thrower: throws 3 tiles, further than any archer; moves freely through forest.' }),
  shotelai: U({ kind: 'shotelai', name: 'Shotelai', cost: 5, hp: 16, atk: 4, def: 3, move: 1, range: 1, skills: ['dash'], tech: 'smithing', blurb: 'Hooked blade: cuts around shields, so the defender gets no terrain, fortify or wall bonus.' }),

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

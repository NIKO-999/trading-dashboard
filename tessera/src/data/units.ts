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
};

export const NAVAL_UPGRADE: Partial<Record<UnitKind, UnitKind>> = { boat: 'ship', waka: 'ship', ship: 'warship' };

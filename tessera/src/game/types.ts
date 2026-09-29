export type Terrain = 'field' | 'forest' | 'mountain' | 'shallow' | 'ocean';
export type Resource = 'fruit' | 'crop' | 'animal' | 'fish' | 'ore' | 'whale';
export type Improvement = 'farm' | 'mine' | 'lumber' | 'port' | 'temple' | 'market';
export type TribeId = 'egypt' | 'aztec' | 'polynesia' | 'rome' | 'pirates' | 'vikings' | 'japan' | 'mongols' | 'greeks' | 'zulu' | 'persia' | 'celts' | 'inuit' | 'inca' | 'ethiopia' | 'aboriginal' | 'china' | 'india' | 'mali' | 'lakota' | 'ottoman' | 'maya' | 'korea' | 'khmer' | 'swahili' | 'tibet';
export type Biome = TribeId;
export type UnitKind =
  | 'warrior' | 'rider' | 'archer' | 'defender' | 'swordsman' | 'catapult' | 'knight' | 'giant'
  | 'explorer'
  | 'boat' | 'ship' | 'warship'
  | 'legionary' | 'chariot' | 'jaguar' | 'buccaneer' | 'waka'
  | 'berserker' | 'samurai' | 'horsearcher' | 'hoplite' | 'impi'
  | 'immortal' | 'clansman' | 'harpooner' | 'slinger' | 'shotelai' | 'woomera'
  | 'crossbowman' | 'elephant' | 'sofa' | 'buffalorider' | 'janissary'
  | 'holcan' | 'hwacha' | 'guardian' | 'askari' | 'khampa';

export interface Tile {
  x: number;
  y: number;
  terrain: Terrain;
  biome: Biome;
  resource: Resource | null;
  improvement: Improvement | null;
  road: boolean;
  village: boolean; // unclaimed settlement that can be captured
  ruin: boolean;
  cityId: number | null; // city standing on this tile
  owner: number | null; // city id whose territory this is
  seed: number; // stable per-tile random for decoration
}

export interface City {
  id: number;
  name: string;
  x: number;
  y: number;
  owner: number; // player id
  level: number;
  pop: number; // progress toward next level
  capital: boolean;
  workshop: boolean;
  walls: boolean;
  parks: number;
  borderRadius: number;
  pendingRewards: number[]; // levels whose reward still needs to be picked
  units: number; // units currently supported
  roadStage?: number; // road-network milestones already paid out (missing in older saves)
  linked?: number[]; // cities this one has already been paid for linking to by road
}

export interface Unit {
  id: number;
  kind: UnitKind;
  owner: number;
  x: number;
  y: number;
  hp: number;
  homeCity: number | null;
  moved: boolean;
  attacked: boolean;
  veteranKills: number;
  veteran: boolean;
  carrying: UnitKind | null; // land unit carried by a boat
  fortified: boolean;
  explorerSteps?: number;
}

export interface Player {
  id: number;
  tribe: TribeId;
  human: boolean;
  stars: number;
  techs: string[];
  explored: boolean[]; // index = y*size+x
  alive: boolean;
  kills: number;
  bonusScore: number;
  /** Empires this one has met: seen a unit or city of, or fought (missing in older saves). */
  met?: number[];
}

export type GameMode = 'perfection' | 'domination';
export type Difficulty = 'easy' | 'normal' | 'hard';

export interface LogEntry {
  turn: number;
  text: string;
}

export interface GameState {
  version: 1;
  seed: number;
  size: number;
  tiles: Tile[];
  cities: City[];
  units: Unit[];
  players: Player[];
  current: number; // index into players
  turn: number;
  maxTurns: number;
  mode: GameMode;
  difficulty: Difficulty;
  nextId: number;
  over: boolean;
  winner: number | null;
  log: LogEntry[];
  hintStep: number;
}

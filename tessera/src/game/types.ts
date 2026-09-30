import type { Perk } from './perks';

export type BaseTerrain = 'field' | 'forest' | 'mountain' | 'shallow' | 'ocean';
export type Terrain = BaseTerrain | 'desert' | 'swamp' | 'tundra' | 'ice' | 'platform';
export type Resource = 'fruit' | 'crop' | 'animal' | 'fish' | 'ore' | 'whale';
export type Improvement = 'farm' | 'mine' | 'lumber' | 'port' | 'temple' | 'market'
  // built by empire mechanics (see game/mech)
  | 'altar' | 'monolith' | 'stele' | 'chaski' | 'lighthouse' | 'baray' | 'dam' | 'grove' | 'stupa' | 'wall' | 'fort' | 'songline';
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
  | 'holcan' | 'hwacha' | 'guardian' | 'askari' | 'khampa'
  // neutral Great Beasts (see game/wild)
  | 'kraken';

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
  /** Free-form state kept by empire mechanics (see game/mech). Always JSON-safe. */
  data?: Record<string, unknown>;
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
  data?: Record<string, unknown>; // state kept by empire mechanics
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
  data?: Record<string, unknown>; // state kept by empire mechanics
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
  /** State kept by this empire's mechanic (see game/mech), e.g. a calendar or a captive count. Always JSON-safe. */
  mech?: Record<string, unknown>;
  /** Traditions adopted from conquered peoples, and choices still waiting to be made (see game/culture; missing in older saves). */
  culture?: CultureState;
  /**
   * The hidden neutral owner of Great Beasts and other third-party forces (see game/wild). It sits after every empire,
   * is never alive, takes no turns, meets no one, scores nothing and is left out of every list of empires.
   */
  neutral?: boolean;
  /** Skill-tree bookkeeping (missing in older saves): when it last fought or lost a city, which Wildcards surged, respecs. */
  skill?: SkillState;
}

export interface SkillState {
  war?: number; // turn this empire last fought
  lost?: number; // turn it last lost a city
  surges?: string[]; // Wildcard nodes surging at its last turn start
  paxOff?: boolean; // Pax Romana was broken at its last turn start
  respecs?: number;
}

/** One sub-trait taken from a conquered people (`id` is a key of the culture registry; its perks are copied in, so
 *  game/perks can read them without loading the registry). */
export interface Adopted { id: string; from: TribeId; turn: number; city: string; perks: Perk[] }
/** A choice offered when a city was taken: pick one of `options` (registry ids) from the people `from`. */
export interface CultureOffer { from: TribeId; city: string; options: string[] }
export interface CultureState { adopted: Adopted[]; offers: CultureOffer[] }

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
  /** World-level state kept by empire mechanics (see game/mech). */
  mech?: Record<string, unknown>;
  /** Wild events: beasts, volcanoes and mercenary camps (see game/wild). Missing when they are switched off and in older saves. */
  wild?: WildState;
  /** Rebellions: restless conquered cities may break away as Rogue States (see game/rebels). Missing when off and in older saves. */
  rebels?: boolean;
  /** World Wonders: great works being raised and those finished (see game/wonders). Missing in older saves and until the first is begun. */
  wonders?: WonderState;
}

/** A wonder being raised by one empire on a tile of its land; `paid` Stars so far (see game/wonders). */
export interface WonderSite {
  id: string;
  pid: number;
  x: number;
  y: number;
  paid: number;
  started: number; // the turn it was begun
  lastTurn: number; // the turn Stars were last put in, and how many that turn (investment is capped per turn)
  lastPaid: number;
}
/** A finished wonder: who built it, where, and when. Whoever holds its land holds it (see data/wonders). */
export interface BuiltWonder { id: string; pid: number; x: number; y: number; turn: number }
export interface WonderState { sites: WonderSite[]; built: BuiltWonder[] }

/** A neutral mercenary camp and its sealed-bid auction (see game/wild). */
export interface WildCamp {
  x: number;
  y: number;
  offer: UnitKind | null; // the veteran for hire, or null while the camp restocks
  restock: number; // the round a new offer arrives, while `offer` is null
  bids: { pid: number; stars: number }[]; // sealed bids, in the order they were first placed; the stars are held in escrow
}

export interface WildState {
  camps: WildCamp[];
  /** Rounds at which a slain Great Beast rises again somewhere else. */
  respawn: { kind: UnitKind; turn: number }[];
}

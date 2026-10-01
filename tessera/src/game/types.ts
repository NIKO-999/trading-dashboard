import type { Perk } from './perks';

export type BaseTerrain = 'field' | 'forest' | 'mountain' | 'shallow' | 'ocean';
export type Terrain = BaseTerrain | 'desert' | 'swamp' | 'tundra' | 'ice' | 'platform'
  // a shallow bridged by Sappers (see game/roles): walkable land with a road over the water
  | 'bridge';
export type Resource = 'fruit' | 'crop' | 'animal' | 'fish' | 'ore' | 'whale'
  // luxuries: rare deposits that pay Stars once developed (see game/goods)
  | 'silk' | 'spices' | 'wine' | 'ivory' | 'pearls' | 'incense';
export type Improvement = 'farm' | 'mine' | 'lumber' | 'port' | 'temple' | 'market'
  // a tamed herd and planted fruit trees, raised like the others (see game/levels)
  | 'pasture' | 'orchard'
  // a developed luxury: silk farm, vineyard, pearl beds... (see game/goods)
  | 'estate'
  // a training yard (see game/barracks)
  | 'barracks'
  // a frontier camp that claims land outside the borders (see game/frontier)
  | 'frontier'
  // built by empire mechanics (see game/mech)
  | 'altar' | 'monolith' | 'stele' | 'chaski' | 'lighthouse' | 'baray' | 'dam' | 'grove' | 'stupa' | 'wall' | 'fort' | 'songline' | 'caravanserai';
export type TribeId = 'egypt' | 'aztec' | 'polynesia' | 'rome' | 'pirates' | 'vikings' | 'japan' | 'mongols' | 'greeks' | 'zulu' | 'persia' | 'celts' | 'inuit' | 'inca' | 'ethiopia' | 'aboriginal' | 'china' | 'india' | 'mali' | 'lakota' | 'ottoman' | 'maya' | 'korea' | 'khmer' | 'swahili' | 'tibet' | 'carthage' | 'byzantium' | 'arabia' | 'rus' | 'vietnam' | 'babylon' | 'nubia' | 'majapahit' | 'spain' | 'haudenosaunee';
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
  | 'sacredband' | 'varangian' | 'camelrider' | 'druzhina' | 'rattan'
  | 'sabum' | 'pitati' | 'kris' | 'conquistador' | 'mohawk'
  // each empire's named champion (see game/heroes)
  | 'hero'
  // every empire's merchants: a land caravan and a sea trader, drawn in each empire's own style (see game/trade)
  | 'trader' | 'tradeship'
  // the role units of the three empire types, drawn in each empire's own style (see game/roles)
  | 'recruiter' | 'sapper' | 'builder' | 'collector' | 'fishfleet' | 'voyager'
  // every empire's auxiliaries: anti-cavalry spearmen, scouts and healers, drawn in each empire's own style (see game/auxiliaries)
  | 'spearman' | 'scout' | 'healer'
  // neutral Great Beasts (see game/wild)
  | 'kraken'
  // every empire's extra cavalry, drawn in each empire's own style (see data/units, render/units)
  | 'horsebow' | 'lancer' | 'cataphract'
  // every empire's extra ground troops and siege engines (see data/units, data/troops, render/troops)
  | 'axeman' | 'javelineer' | 'ranger' | 'pikeman' | 'musketeer' | 'ram' | 'ballista' | 'cannon';

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
  /** This empire's hero (see game/heroes; missing in older saves and before the hero first joins). */
  hero?: HeroState;
  /** Tiles this empire has raised a level so far (see game/levels; missing in older saves): each makes the next dearer. */
  raised?: number;
  /** Stockpiled strategic resources (see game/goods; missing in older saves). */
  stock?: { iron: number; horses: number; goods?: number };
  /** The Armoury: tiers bought for each unit type, for the rest of the game (see game/forge; missing in older saves). */
  forge?: Partial<Record<UnitKind, number>>;
  /** Recent requisitions of Iron or Horses, raising the price; cools 1 a turn (see game/goods). */
  req?: number;
  /** Techs made cheaper by a Eureka (see game/sparks; missing in older saves). */
  sparks?: string[];
  /** Sources raised by Cultivate so far (see game/homestead; missing in older saves). */
  cultivated?: number;
  /** The era reached and the Age it brought (see game/eras; missing in older saves). */
  era?: import('./eras').EraState;
  /** Its government and the policy cards slotted into it (see game/government; missing in older saves: a Chiefdom with empty slots). */
  gov?: import('../data/governments').GovState;
}

export interface HeroState {
  unit: number | null; // id of the hero on the field, or null while not there
  lvl: number;
  xp: number;
  ready: number; // the turn the ability can next be used
  back: number | null; // the turn a fallen hero returns
  joined: boolean; // has joined at least once
  discount?: boolean; // Imperial Largesse waiting to be spent
  uses?: number; // abilities used so far
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

/** 'onecity': the One City Challenge: every empire keeps only its capital (no villages, no new cities; a conquered capital is razed; no turn limit, the last empire standing wins). */
export type GameMode = 'perfection' | 'domination' | 'onecity';
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
  /** Diplomacy: treaties, offers and opinions between empires (see game/diplomacy). Missing when off and in older saves (everyone at war). */
  diplo?: DiploState;
  /** Trade routes opened by Traders and Trade Ships (see game/trade). Missing in older saves and until the first is opened. */
  trade?: TradeState;
  /** Raider Clans: outlaw camps whose raiders pillage the empires (see game/clans). Missing when off and in older saves. */
  clans?: ClanState;
  /** Natural Wonders: rare landmarks placed with the map (see game/naturals). Missing in older saves (no wonders). */
  naturals?: NaturalState;
  /** Free Cities: neutral city-states that take envoys and favour their suzerain (see game/citystates). Missing when off and in older saves. */
  free?: FreeState;
}

/**
 * A Natural Wonder on the map: which one, where, and the empires that have seen it, first discoverer first. `held` is
 * the empire whose borders held it at the last check (for the "now yours" / "lost" notices).
 */
export interface NaturalSite { id: string; x: number; y: number; found: number[]; turn?: number; held?: number | null }
export interface NaturalState { sites: NaturalSite[] }

/**
 * A permanent trade route between two cities (`a`: the trader's home, `b`: where it settled). `pa`/`pb` are the owners
 * when it was opened: the route is cut as soon as either city changes hands. `path` is the trail as tile indices.
 */
export interface TradeRoute {
  id: number;
  a: number;
  b: number;
  pa: number;
  pb: number;
  by: number; // the empire whose trader opened it
  sea: boolean;
  path: number[];
  since: number;
}
export interface TradeState { routes: TradeRoute[] }

/** A treaty between two empires (`a` < `b`). War is the absence of one. */
export interface DiploPact {
  a: number;
  b: number;
  kind: 'peace' | 'alliance';
  since: number; // the round it was signed
  trade?: number; // the round a trade deal was opened on top of it
  declared?: number; // the round one side declared war; the war begins at the declarer's next turn
  by?: number; // who declared it
}
/** An offer waiting for (or given to) an empire's answer. */
export interface DiploOffer {
  id: number;
  from: number;
  to: number;
  kind: 'peace' | 'alliance' | 'trade' | 'gift' | 'demand' | 'demandTurns' | 'call'
    // buying strategic resources: the sender pays BARTER.price Stars for BARTER.amount Iron or Horses (see game/goods)
    | 'buyIron' | 'buyHorses';
  turn: number;
  stars?: number; // tribute: the sum, or the Stars a turn
  turns?: number; // ongoing tribute: for how many turns
  enemy?: number; // a call to arms: the empire that attacked the ally
}
export interface DiploState {
  pacts: DiploPact[];
  offers: DiploOffer[]; // waiting for a human's answer
  tribute: { from: number; to: number; stars: number; until: number }[]; // ongoing tribute, paid at the payer's turn start
  mood: Record<string, number>; // "a:b": how a feels about b from past deeds (gifts, demands, betrayals); fades a point a round
  rep: Record<string, number>; // reputation lost for broken treaties (felt by everyone); heals a point a round
  fought: Record<string, number>; // "a:b": the round a last attacked b
  warSince: Record<string, number>; // "a:b" (a < b): the round their last war began
  ai: Record<string, number>; // bookkeeping: rounds of the last AI initiative, repeated offers, calls to arms
  victors?: number[]; // Domination: allies who won together
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

/** An outlaw camp's temper, picked at random when it appears (see game/clans). */
export type ClanKind = 'horse' | 'sea' | 'hill' | 'wolf';
/** A Raider Clan's camp; its raiders are neutral units with `data.clan` = `id` (see game/clans). */
export interface ClanCamp {
  id: number;
  x: number;
  y: number;
  kind: ClanKind;
  name: string;
  founded: number; // the round it appeared
  spawn: number; // the round its next raider rides out
  truce: { pid: number; until: number }[]; // empires that paid it off, and until which round it leaves them alone
}
export interface ClanState {
  camps: ClanCamp[];
  next: number; // the earliest round a new camp may appear
  seq: number; // the next camp id
  cleared: number; // camps destroyed so far
}

/** What a Free City is known for, and so what its favour brings (see game/citystates). */
export type FreeKind = 'trade' | 'military' | 'science' | 'culture' | 'maritime';
/** A request a Free City makes of the empires, rewarded with envoys: burn a raider camp near it, or grow a city. */
export interface FreeQuest { kind: 'camp' | 'level'; camp?: number; level?: number; until: number; done: number[] }
/**
 * A Free City: an ordinary city held by the neutral owner, with its type and the envoys each empire keeps there
 * (`envoys`, keyed by player id). Its guards are neutral units with `data.free` = `id` (the city id).
 */
export interface FreeCity {
  id: number;
  kind: FreeKind;
  envoys: Record<string, number>;
  suz: number | null; // the suzerain as of the last count
  since: number; // the round the suzerain took over (or the city was founded)
  last: Record<string, number>; // the round each empire last sent an envoy (one a round)
  foes: Record<string, number>; // the round each empire last attacked it
  rearm: number | null; // the round a lost guard is replaced
  quest: FreeQuest | null;
}
export interface FreeState {
  cities: FreeCity[];
  sent: Record<string, number>; // envoys each empire has paid for so far: each makes the next dearer
  war: Record<string, number>; // "a:b" (a < b): the round two empires last fought (a Free City's guards fight its suzerain's foes)
  nextQuest: number;
}

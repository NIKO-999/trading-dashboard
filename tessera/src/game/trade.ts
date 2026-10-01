// Trade routes: every empire can train merchants. A Trader (a land caravan, needs Roads) or a Trade Ship (needs Sailing,
// launched onto the water beside a coastal city) walks or sails to another city and opens a permanent route there
// ("Establish Trade Route" on its tile menu). The merchant settles down on the route (the unit is used up) and the route
// pays Stars every turn to BOTH ends, through the core city income (`cityIncome` adds `cityRouteIncome`), so the HUD's
// Stars (+N) and each city's income already count it.
//
//  - Partners. Any other city of your own, or a foreign city you are not at war with: with Diplomacy on that means an
//    empire you hold a treaty with (see game/diplomacy); with it off every foreign city will trade (merchants cross any
//    border). Rogue States and Great Beasts do not trade.
//  - Yield. Each end gets ROUTE_BASE, +FOREIGN_BONUS on a foreign route, +1 for each of ROUTE_FAR the trail reaches, up to
//    ROUTE_MAX, plus its empire's flavour bonus (below).
//  - Caps. A city takes part in at most `routesPerCity` routes (more as it grows) and an empire opens at most `routeCap`.
//  - Risk. A route is cut when either city changes hands, when war is declared between the two owners, or when a unit of
//    an enemy of either owner stands on its trail and pillages it (`trade:raid`, which pays the raider). Merchants on the
//    way are weak (no attack, low defence) and cannot capture anything.
//  - Flavour. Mali's caravans pay a salt toll (+1★ at a Malian end of a land route), Swahili ride the monsoon (+1★ at a
//    Swahili end of a sea route, Trade Ships 2★ cheaper), Persia's Royal Road (+1★ at a Persian end of a land route
//    that runs mostly on roads), Rome's roads bring cheap caravans (Traders 1★ cheaper), and Pirates intercept (their
//    raids loot double).
//
// State: `GameState.trade` (created with the first route, so older saves simply have none). Every route keeps the owners
// it was opened between and its trail (tile indices), so the map can draw it and the checks need no search.
import { TRIBES } from '../data/tribes';
import { UNITS } from '../data/units';
import { diploOn, hostile, pactOf } from './diplomacy';
import { emit } from './events';
import { raidHeal } from './government';
import { perkSum } from './perks';
import { dist, isLand, isWater, neighbors, tileAt } from './grid';
import { citiesOf, cityById, doAction, isExplored, moveOptions, moveUnit, tileActions, unitAt, type Action } from './rules';
import type { City, GameState, Tile, TradeRoute, TradeState, TribeId, Unit, UnitKind } from './types';

// ---------------------------------------------------------------- tuning

/** Stars each end of a route earns a turn, before distance and bonuses. */
export const ROUTE_BASE = 1;
/** A foreign route pays each end this much more. */
export const FOREIGN_BONUS = 1;
/** Trail lengths (in steps) at which a route pays each end one more. */
export const ROUTE_FAR = [6, 12];
/** Most an end earns from distance and partner (the flavour bonus comes on top). */
export const ROUTE_MAX = 4;
/** Most routes an empire may open, however many cities it has. */
export const MAX_ROUTES = 6;
/** A pillaged route pays the raider this, plus a turn of what the route paid both ends. */
export const RAID_BASE = 3;
/** Traders in the field at once, per empire, for the computer players. */
const AI_TRADERS = 1;

export const TRADER_KINDS: UnitKind[] = ['trader', 'tradeship'];
export const isTraderKind = (k: UnitKind | null | undefined) => k === 'trader' || k === 'tradeship';
/** A merchant: a Trader or Trade Ship (also a Trader carried in a boat). */
export const isTrader = (u: Unit) => isTraderKind(u.carrying ?? u.kind);

/** Routes a city may take part in: one, and one more at levels 3 and 6... */
export const routesPerCity = (c: City) => 1 + Math.floor(c.level / 3);
/** Routes an empire may open: one more than its cities, up to MAX_ROUTES. */
export const routeCap = (s: GameState, pid: number) => Math.min(MAX_ROUTES, 1 + citiesOf(s, pid).length);

/** What a merchant costs less for its empire (Rome's roads, the Swahili monsoon). */
export const traderDiscount = (s: GameState, pid: number, k: UnitKind) =>
  k === 'trader' && s.players[pid].tribe === 'rome' ? 1 : k === 'tradeship' && s.players[pid].tribe === 'swahili' ? 2 : 0;

// ---------------------------------------------------------------- each empire's merchants

/** How an empire's caravan looks (see render/trade). */
export type CaravanLook = 'camel' | 'saltcamel' | 'bactrian' | 'llama' | 'dogsled' | 'travois' | 'oxcart' | 'porter' | 'pochteca' | 'packhorse' | 'mule' | 'elephant' | 'yak';
/** How an empire's trading ship looks (see render/trade). */
export type ShipLook = 'knarr' | 'dhow' | 'sloop' | 'waka' | 'junk' | 'roundship' | 'canoe' | 'raft' | 'felucca';
export interface TraderDef { land: string; landLook: CaravanLook; sea: string; seaLook: ShipLook }

export const TRADERS: Record<TribeId, TraderDef> = {
  egypt: { land: 'Camel Caravan', landLook: 'camel', sea: 'Nile Felucca', seaLook: 'felucca' },
  aztec: { land: 'Pochteca Merchant', landLook: 'pochteca', sea: 'Trade Canoe', seaLook: 'canoe' },
  polynesia: { land: 'Kete Porter', landLook: 'porter', sea: 'Trading Waka', seaLook: 'waka' },
  rome: { land: 'Ox Cart', landLook: 'oxcart', sea: 'Merchant Corbita', seaLook: 'roundship' },
  pirates: { land: 'Smuggler Mule', landLook: 'mule', sea: 'Smuggler Sloop', seaLook: 'sloop' },
  vikings: { land: 'Pack Horse', landLook: 'packhorse', sea: 'Knarr', seaLook: 'knarr' },
  japan: { land: 'Shoulder-pole Porter', landLook: 'porter', sea: 'Kitamae-bune', seaLook: 'junk' },
  mongols: { land: 'Bactrian Camel', landLook: 'bactrian', sea: 'River Raft', seaLook: 'raft' },
  greeks: { land: 'Pack Mule', landLook: 'mule', sea: 'Merchant Holkas', seaLook: 'roundship' },
  zulu: { land: 'Ox Wagon', landLook: 'oxcart', sea: 'River Canoe', seaLook: 'canoe' },
  persia: { land: 'Royal Road Caravan', landLook: 'camel', sea: 'Gulf Dhow', seaLook: 'dhow' },
  celts: { land: 'Pack Pony', landLook: 'packhorse', sea: 'Trading Curragh', seaLook: 'canoe' },
  inuit: { land: 'Dog Sled', landLook: 'dogsled', sea: 'Umiak', seaLook: 'canoe' },
  inca: { land: 'Llama Train', landLook: 'llama', sea: 'Balsa Raft', seaLook: 'raft' },
  ethiopia: { land: 'Salt Caravan', landLook: 'camel', sea: 'Red Sea Dhow', seaLook: 'dhow' },
  aboriginal: { land: 'Songline Trader', landLook: 'porter', sea: 'Bark Canoe', seaLook: 'canoe' },
  china: { land: 'Silk Porter', landLook: 'porter', sea: 'Junk', seaLook: 'junk' },
  india: { land: 'Pack Elephant', landLook: 'elephant', sea: 'Kotia', seaLook: 'dhow' },
  mali: { land: 'Salt Camel', landLook: 'saltcamel', sea: 'Niger Pirogue', seaLook: 'canoe' },
  lakota: { land: 'Travois Pony', landLook: 'travois', sea: 'Bull Boat', seaLook: 'canoe' },
  ottoman: { land: 'Caravanserai Camel', landLook: 'camel', sea: 'Merchant Kalyon', seaLook: 'roundship' },
  maya: { land: 'Tumpline Porter', landLook: 'porter', sea: 'Trade Canoe', seaLook: 'canoe' },
  korea: { land: 'Bobusang Peddler', landLook: 'porter', sea: 'Merchant Junk', seaLook: 'junk' },
  khmer: { land: 'Pack Elephant', landLook: 'elephant', sea: 'Mekong Junk', seaLook: 'junk' },
  swahili: { land: 'Ivory Porter', landLook: 'porter', sea: 'Mtepe Dhow', seaLook: 'dhow' },
  tibet: { land: 'Yak Train', landLook: 'yak', sea: 'Yak-hide Coracle', seaLook: 'raft' },
  carthage: { land: 'Libyan Mule Train', landLook: 'mule', sea: 'Gaulos Merchantman', seaLook: 'roundship' },
  byzantium: { land: 'Silk Caravan', landLook: 'packhorse', sea: 'Imperial Dromon', seaLook: 'roundship' },
  arabia: { land: 'Camel Caravan', landLook: 'camel', sea: 'Ocean Dhow', seaLook: 'dhow' },
  rus: { land: 'Fur Sledge', landLook: 'dogsled', sea: 'River Lodya', seaLook: 'knarr' },
  vietnam: { land: 'Buffalo Cart', landLook: 'oxcart', sea: 'Basket-boat Junk', seaLook: 'junk' },
  babylon: { land: 'Donkey Caravan', landLook: 'mule', sea: 'Reed Boat', seaLook: 'raft' },
  nubia: { land: 'Desert Caravan', landLook: 'camel', sea: 'Nile Barge', seaLook: 'felucca' },
  majapahit: { land: 'Shoulder-pole Porter', landLook: 'porter', sea: 'Spice Jong', seaLook: 'junk' },
  spain: { land: 'Mule Train', landLook: 'mule', sea: 'Treasure Galleon', seaLook: 'roundship' },
  haudenosaunee: { land: 'Forest Porter', landLook: 'porter', sea: 'Elm-bark Canoe', seaLook: 'canoe' },
  assyria: { land: 'Donkey Caravan', landLook: 'mule', sea: 'River Raft', seaLook: 'raft' },
  poland: { land: 'Grain Wagon', landLook: 'oxcart', sea: 'Vistula Barge', seaLook: 'raft' },
  scotland: { land: 'Drover’s Herd', landLook: 'packhorse', sea: 'Herring Buss', seaLook: 'knarr' },
  england: { land: 'Wool Wagon', landLook: 'oxcart', sea: 'Wool Cog', seaLook: 'roundship' },
  france: { land: 'Wine Cart', landLook: 'oxcart', sea: 'River Barge', seaLook: 'roundship' },
  germany: { land: 'Hanse Wagon', landLook: 'oxcart', sea: 'Hanse Cog', seaLook: 'roundship' },
  sweden: { land: 'Copper Sledge', landLook: 'dogsled', sea: 'Baltic Fluyt', seaLook: 'knarr' },
  portugal: { land: 'Cork Cart', landLook: 'oxcart', sea: 'Spice Carrack', seaLook: 'roundship' },
  venice: { land: 'Pack Mule', landLook: 'mule', sea: 'Merchant Galley', seaLook: 'roundship' },
  kongo: { land: 'Head Porter', landLook: 'porter', sea: 'River Canoe', seaLook: 'canoe' },
  ashanti: { land: 'Kola Porter', landLook: 'porter', sea: 'Surf Canoe', seaLook: 'canoe' },
  mapuche: { land: 'Llama Train', landLook: 'llama', sea: 'Dalca Canoe', seaLook: 'canoe' },
  georgia: { land: 'Wine Mule', landLook: 'mule', sea: 'Black Sea Boat', seaLook: 'roundship' },
  nepal: { land: 'Porter Train', landLook: 'porter', sea: 'River Raft', seaLook: 'raft' },
  cree: { land: 'Toboggan', landLook: 'dogsled', sea: 'Birch-bark Canoe', seaLook: 'canoe' },
};

/** The name an empire gives its merchant of this kind. */
export const traderName = (tribe: TribeId, kind: UnitKind) => (kind === 'tradeship' ? TRADERS[tribe].sea : TRADERS[tribe].land);

// ---------------------------------------------------------------- routes

const state = (s: GameState): TradeState => (s.trade ??= { routes: [] });
/** Every route on record (a dead one lingers only until the next sweep). */
export const allRoutes = (s: GameState): TradeRoute[] => s.trade?.routes ?? [];

/** Are these two empires at war, as far as trade goes? With Diplomacy off, merchants trade with everyone. */
export function tradeWar(s: GameState, a: number, b: number): boolean {
  if (a === b || !diploOn(s)) return false;
  return hostile(s, a, b) || pactOf(s, a, b)?.declared !== undefined;
}

/** Why a route has to go, or null while it stands. */
function brokenWhy(s: GameState, r: TradeRoute): string | null {
  const A = cityById(s, r.a), B = cityById(s, r.b);
  if (!A || A.owner !== r.pa) return `${A?.name ?? 'a city'} changed hands`;
  if (!B || B.owner !== r.pb) return `${B?.name ?? 'a city'} changed hands`;
  if (tradeWar(s, r.pa, r.pb)) return 'war was declared';
  return null;
}
export const routeLive = (s: GameState, r: TradeRoute) => brokenWhy(s, r) === null;
/** Routes standing right now. */
export const liveRoutes = (s: GameState) => allRoutes(s).filter((r) => routeLive(s, r));
export const routesOfCity = (s: GameState, c: City) => liveRoutes(s).filter((r) => r.a === c.id || r.b === c.id);
/** Routes an empire has opened (these count against its cap). */
export const routesOpenedBy = (s: GameState, pid: number) => liveRoutes(s).filter((r) => r.by === pid);
/** Routes touching any of an empire's cities. */
export const routesOf = (s: GameState, pid: number) => liveRoutes(s).filter((r) => r.pa === pid || r.pb === pid);

/** Share of the trail between the two cities that runs on roads (1 for a trail with nothing between). */
function roadShare(s: GameState, path: number[]): number {
  const mid = path.slice(1, -1);
  if (!mid.length) return 1;
  return mid.filter((i) => s.tiles[i].road || s.tiles[i].cityId !== null).length / mid.length;
}

/** The flavour bonus an empire's end of a route earns. */
function flavour(s: GameState, pid: number, sea: boolean, path: number[]): number {
  switch (s.players[pid].tribe) {
    case 'mali': return sea ? 0 : 1; // salt tolls on the caravan road
    case 'swahili': return sea ? 1 : 0; // the monsoon trade
    case 'persia': return !sea && roadShare(s, path) >= 0.5 ? 1 : 0; // the Royal Road
    default: return 0;
  }
}

/** Stars one end earns a turn from a route between owners `mine` and `other` along `path`. */
function endYield(s: GameState, mine: number, other: number, sea: boolean, path: number[]): number {
  const len = path.length - 1;
  const n = ROUTE_BASE + (mine !== other ? FOREIGN_BONUS : 0) + ROUTE_FAR.filter((d) => len >= d).length;
  return Math.min(ROUTE_MAX, n) + flavour(s, mine, sea, path);
}
/** What a route pays the end at city `cityId` a turn (0 for a route not touching it). */
export function routeYield(s: GameState, r: TradeRoute, cityId: number): number {
  if (cityId === r.a) return endYield(s, r.pa, r.pb, r.sea, r.path);
  if (cityId === r.b) return endYield(s, r.pb, r.pa, r.sea, r.path);
  return 0;
}
/** Stars a city earns from its trade routes a turn (part of the core city income). */
export function cityRouteIncome(s: GameState, c: City): number {
  if (!s.trade) return 0;
  const n = routesOfCity(s, c).reduce((a, r) => a + routeYield(s, r, c.id), 0);
  const more = n ? perkSum(s, c.owner, 'route') : 0; // Caravan Guilds and a Merchant Republic (see game/government)
  return more ? Math.floor(n * (1 + more)) : n;
}
/** Stars an empire earns from trade routes a turn. */
export const routeIncome = (s: GameState, pid: number) => citiesOf(s, pid).reduce((n, c) => n + cityRouteIncome(s, c), 0);

/**
 * The trail between two cities: the shortest way over land (or over water for a sea route), as tile indices from `a` to
 * `b`. `null` when there is none (another island, a landlocked city).
 */
export function findTrail(s: GameState, a: City, b: City, sea: boolean): number[] | null {
  const size = s.size;
  const start = a.y * size + a.x, goal = b.y * size + b.x;
  const prev = new Int32Array(size * size).fill(-1);
  prev[start] = start;
  const queue = [start];
  for (let h = 0; h < queue.length && prev[goal] < 0; h++) {
    const i = queue[h];
    // straight steps before diagonal ones, so trails run along the grid where they can
    const around = neighbors(s, i % size, Math.floor(i / size)).sort((p, q) => Math.abs(p.x - (i % size)) + Math.abs(p.y - Math.floor(i / size)) - (Math.abs(q.x - (i % size)) + Math.abs(q.y - Math.floor(i / size))));
    for (const n of around) {
      const j = n.y * size + n.x;
      if (prev[j] >= 0) continue;
      if (j !== goal && (sea ? !isWater(n) : !isLand(n))) continue;
      if (j !== goal && n.cityId !== null) continue; // a trail runs between cities, not through them
      prev[j] = i;
      queue.push(j);
    }
  }
  if (prev[goal] < 0) return null;
  const path = [goal];
  while (path[0] !== start) path.unshift(prev[path[0]]);
  return path;
}

/** A trail even where there is no way: a straight line (a caravan that came by boat still trades overland). */
function straightTrail(s: GameState, a: City, b: City): number[] {
  const n = Math.max(1, dist(a.x, a.y, b.x, b.y));
  const out: number[] = [];
  for (let i = 0; i <= n; i++) out.push(Math.round(a.y + ((b.y - a.y) * i) / n) * s.size + Math.round(a.x + ((b.x - a.x) * i) / n));
  return out;
}

/** The city a merchant trades from: its home city while it still holds it, else the empire's city nearest to it. */
export function traderOrigin(s: GameState, u: Unit, target?: City): City | undefined {
  const home = cityById(s, u.homeCity);
  if (home && home.owner === u.owner && home !== target) return home;
  return citiesOf(s, u.owner).filter((c) => c !== target).sort((p, q) => dist(p.x, p.y, u.x, u.y) - dist(q.x, q.y, u.x, u.y))[0];
}

export interface Quote { mine: number; theirs: number; len: number; path: number[] }
/** What a route from `home` (of `pid`) to `target` would pay: `mine` at home, `theirs` at the target. */
export function quote(s: GameState, pid: number, home: City, target: City, sea: boolean): Quote {
  const path = findTrail(s, home, target, sea) ?? straightTrail(s, home, target);
  return { mine: endYield(s, pid, target.owner, sea, path), theirs: endYield(s, target.owner, pid, sea, path), len: path.length - 1, path };
}

const routeBetween = (s: GameState, a: number, b: number) => liveRoutes(s).find((r) => (r.a === a && r.b === b) || (r.a === b && r.b === a));
const people = (s: GameState, pid: number) => TRIBES[s.players[pid].tribe].people;

/** Why `u` can't open a route with `target` right now (null when it can). */
export function routeCheck(s: GameState, u: Unit, target: City): string | null {
  const pid = u.owner;
  if (!isTraderKind(u.kind)) return 'Only a merchant can open a trade route';
  if (dist(u.x, u.y, target.x, target.y) > 1) return 'Stand in or beside the city';
  const home = traderOrigin(s, u, target);
  if (!home) return 'No city of yours to trade from';
  if (s.players[target.owner].neutral) return 'Rebels and beasts do not trade';
  if (target.owner !== pid && tradeWar(s, pid, target.owner)) return `At war with the ${people(s, target.owner)}s`;
  if (routeBetween(s, home.id, target.id)) return `${home.name} already trades with ${target.name}`;
  if (u.kind === 'tradeship' && !neighbors(s, home.x, home.y).some(isWater)) return `${home.name} is not on the coast`;
  if (routesOpenedBy(s, pid).length >= routeCap(s, pid)) return `Your empire can run ${routeCap(s, pid)} routes (more with more cities)`;
  if (routesOfCity(s, home).length >= routesPerCity(home)) return `${home.name} can hold ${routesPerCity(home)} route${routesPerCity(home) === 1 ? '' : 's'} (more as it grows)`;
  if (routesOfCity(s, target).length >= routesPerCity(target)) return `${target.name} has no room for another route`;
  return null;
}

/** Cities within reach of a merchant standing where it is (its own tile and the eight around). */
const inReach = (s: GameState, u: Unit) => s.cities.filter((c) => dist(c.x, c.y, u.x, u.y) <= 1 && c.id !== cityById(s, u.homeCity)?.id);

/** Opens the route: the merchant settles down on it (it leaves the map without dying) and both ends are told. */
function openRoute(s: GameState, u: Unit, target: City): TradeRoute {
  const pid = u.owner;
  const home = traderOrigin(s, u, target)!;
  const sea = u.kind === 'tradeship';
  const q = quote(s, pid, home, target, sea);
  const r: TradeRoute = { id: s.nextId++, a: home.id, b: target.id, pa: pid, pb: target.owner, by: pid, sea, path: q.path, since: s.turn };
  state(s).routes.push(r);
  // the merchant is used up, not killed: no death hooks, but its home city gets the slot back
  s.units = s.units.filter((x) => x !== u);
  const hc = cityById(s, u.homeCity);
  if (hc) hc.units = Math.max(0, hc.units - 1);
  const pays = pid === target.owner ? `+${q.mine}★ to ${home.name} and +${q.theirs}★ to ${target.name}` : `+${q.mine}★ a turn to ${home.name}`;
  s.log.push({ turn: s.turn, text: `The ${people(s, pid)}s open a ${sea ? 'sea' : 'caravan'} route from ${home.name} to ${target.name}.` });
  emit({ type: 'toast', player: pid, text: `Trade route opened: ${home.name} ⇄ ${target.name}, ${pays}.` });
  if (target.owner !== pid) emit({ type: 'toast', player: target.owner, text: `${people(s, pid)} merchants open a route to ${target.name}: +${q.theirs}★ a turn.` });
  return r;
}

/** Cuts a route and tells both ends why. */
export function cutRoute(s: GameState, r: TradeRoute, why: string) {
  const d = s.trade;
  if (!d) return;
  d.routes = d.routes.filter((x) => x !== r);
  const name = (id: number) => cityById(s, id)?.name ?? 'a lost city';
  const text = `Trade route ${name(r.a)} ⇄ ${name(r.b)} cut: ${why}.`;
  s.log.push({ turn: s.turn, text });
  for (const pid of new Set([r.pa, r.pb])) if (s.players[pid]?.alive) emit({ type: 'toast', player: pid, text });
}

/** Cuts every route that no longer stands (a city changed hands, war was declared). Run at each turn start and after a capture. */
export function tradeSweep(s: GameState) {
  if (!s.trade) return;
  for (const r of [...s.trade.routes]) {
    const why = brokenWhy(s, r);
    if (why) cutRoute(s, r, why);
  }
}

/** Live routes whose trail crosses this tile (not at the cities at either end), that `pid` may pillage. */
export function raidable(s: GameState, pid: number, t: Tile): TradeRoute[] {
  if (t.cityId !== null) return [];
  const i = t.y * s.size + t.x;
  return liveRoutes(s).filter((r) => r.pa !== pid && r.pb !== pid && r.path.includes(i) && (hostile(s, pid, r.pa) || hostile(s, pid, r.pb)));
}
/** What pillaging these routes pays `pid` (Pirates intercept for double). */
export const raidLoot = (s: GameState, pid: number, rs: TradeRoute[]) =>
  rs.reduce((n, r) => n + RAID_BASE + routeYield(s, r, r.a) + routeYield(s, r, r.b), 0) * (s.players[pid].tribe === 'pirates' ? 2 : 1);

// ---------------------------------------------------------------- actions

/** The tile menu: "Establish Trade Route" for a merchant beside a city, "Raid Trade Route" for a soldier on a trail. */
export function tradeActions(s: GameState, pid: number, t: Tile): Action[] {
  const u = unitAt(s, t.x, t.y);
  if (!u || u.owner !== pid) return [];
  const acts: Action[] = [];
  if (isTraderKind(u.kind)) {
    const cities = inReach(s, u).filter((c) => !s.players[c.owner].neutral);
    for (const c of cities) {
      const why = routeCheck(s, u, c);
      const home = traderOrigin(s, u, c);
      const q = home ? quote(s, pid, home, c, u.kind === 'tradeship') : null;
      const desc = q && home
        ? `Settle this merchant on a ${q.len}-step ${u.kind === 'tradeship' ? 'sea lane' : 'caravan trail'} between ${home.name} and ${c.name}: +${q.mine}★ a turn to ${home.name}${c.owner === pid ? ` and +${q.theirs}★ to ${c.name}` : ` (the ${people(s, c.owner)}s get +${q.theirs}★)`}.`
        : 'Open a trade route with this city.';
      acts.push({ id: `trade:route:${c.id}`, label: cities.length > 1 ? `Trade with ${c.name}` : 'Establish Trade Route', desc, cost: 0, enabled: !why, reason: why ?? undefined, icon: u.kind });
    }
    return acts;
  }
  const rs = raidable(s, pid, t);
  if (rs.length && UNITS[u.kind].atk > 0) {
    const loot = raidLoot(s, pid, rs);
    const names = rs.map((r) => `${cityById(s, r.a)?.name} ⇄ ${cityById(s, r.b)?.name}`).join(', ');
    acts.push({ id: 'trade:raid', label: 'Raid Trade Route', desc: `Pillage the trail (${names}): the route is cut and you loot ${loot}★.`, cost: 0, icon: 'axe',
      enabled: !u.attacked, reason: u.attacked ? 'Unit has already acted' : undefined });
  }
  return acts;
}

export function tradeDoAction(s: GameState, pid: number, t: Tile, id: string): boolean {
  const u = unitAt(s, t.x, t.y);
  if (!u || u.owner !== pid) return false;
  if (id.startsWith('trade:route:')) {
    const c = cityById(s, Number(id.slice(12)));
    if (!c || routeCheck(s, u, c)) return false;
    openRoute(s, u, c);
    return true;
  }
  if (id === 'trade:raid') {
    const rs = raidable(s, pid, t);
    if (!rs.length) return false;
    const loot = raidLoot(s, pid, rs);
    for (const r of rs) cutRoute(s, r, `the ${people(s, pid)}s pillaged the trail`);
    s.players[pid].stars += loot;
    emit({ type: 'stars', player: pid, x: t.x, y: t.y, amount: loot });
    raidHeal(s, u); // Scorched Earth (see game/government)
    emit({ type: 'toast', player: pid, text: `Caravans pillaged: +${loot}★.` });
    u.moved = u.attacked = true;
    return true;
  }
  return false;
}

/** Where a Trade Ship trained in `c` is launched: a free water tile beside the city (a port first). */
export function shipSpawn(s: GameState, c: City): Tile | undefined {
  const free = neighbors(s, c.x, c.y).filter((t) => isWater(t) && !unitAt(s, t.x, t.y));
  return free.find((t) => t.improvement === 'port') ?? free.find((t) => t.terrain === 'shallow') ?? free[0];
}

/** A few words for a merchant's panel: what it would earn where it stands, or where the best markets are. */
export function traderPreview(s: GameState, u: Unit): string {
  const pid = u.owner;
  const sea = u.kind === 'tradeship';
  const here = inReach(s, u).filter((c) => !s.players[c.owner].neutral);
  if (here.length) {
    return here.map((c) => {
      const home = traderOrigin(s, u, c);
      if (!home) return `${c.name}: no city to trade from.`;
      const q = quote(s, pid, home, c, sea);
      const why = routeCheck(s, u, c);
      return `Route ${home.name} ⇄ ${c.name}: +${q.mine}★ to you${c.owner === pid ? ` and +${q.theirs}★ more` : `, +${q.theirs}★ to them`} a turn${why ? ` (${why.toLowerCase()})` : ''}.`;
    }).join(' ');
  }
  const best = bestTargets(s, u).slice(0, 3);
  if (!best.length) return `No city it can reach will trade (${sea ? 'sail' : 'walk'} it to another city of yours or a friendly one).`;
  return `Best markets: ${best.map((b) => `${b.c.name} +${b.q.mine}★${b.c.owner === pid ? `+${b.q.theirs}★` : ''} (${b.q.len} steps)`).join(', ')}. Stand in or beside the city to open the route.`;
}

// ---------------------------------------------------------------- computer players

/** Cities this merchant could open a route with (it can get there, they would trade), best first. */
export function bestTargets(s: GameState, u: Unit): { c: City; q: Quote; v: number }[] {
  const pid = u.owner;
  const sea = u.kind === 'tradeship';
  const out: { c: City; q: Quote; v: number }[] = [];
  for (const c of s.cities) {
    if (s.players[c.owner].neutral || !isExplored(s, pid, c.x, c.y) || c.id === u.homeCity) continue;
    const home = traderOrigin(s, u, c);
    if (!home || home === c) continue;
    if (c.owner !== pid && tradeWar(s, pid, c.owner)) continue;
    if (routeBetween(s, home.id, c.id) || routesOfCity(s, c).length >= routesPerCity(c) || routesOfCity(s, home).length >= routesPerCity(home)) continue;
    // the merchant has to get there: over land from where it stands, or by sea to the water beside the city
    const from = { x: u.x, y: u.y, level: 1 } as City;
    if (!findTrail(s, from, c, sea)) continue;
    const q = quote(s, pid, home, c, sea);
    // a foreign city with no treaty to shelter the merchant (Diplomacy off) is worth the risk only when it pays well
    const v = q.mine + (c.owner === pid ? q.theirs : 0) - dist(u.x, u.y, c.x, c.y) / 5 - (c.owner !== pid && !diploOn(s) ? 1.5 : 0);
    out.push({ c, q, v });
  }
  return out.sort((a, b) => b.v - a.v);
}

/** Tiles on enemy trails near `pid`'s units that are worth pillaging (goals for the AI's soldiers). */
export function raidSpots(s: GameState, pid: number, u: Unit): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (const r of liveRoutes(s)) {
    if (r.pa === pid || r.pb === pid || !(hostile(s, pid, r.pa) || hostile(s, pid, r.pb))) continue;
    for (const i of r.path) {
      const x = i % s.size, y = Math.floor(i / s.size);
      if (s.tiles[i].cityId === null && dist(x, y, u.x, u.y) <= 4 && isExplored(s, pid, x, y) && isLand(s.tiles[i]) !== UNITS[u.kind].naval) out.push({ x, y });
    }
  }
  return out;
}

/**
 * One trade step for a computer player: open a route where a merchant stands, move a merchant toward its best market,
 * pillage an enemy trail a soldier stands on, or train a merchant when stars are spare and a route is to be had.
 */
export function tradeAi(s: GameState, pid: number): boolean {
  const p = s.players[pid];
  const mine = s.units.filter((u) => u.owner === pid);
  for (const u of mine) {
    if (!isTraderKind(u.kind)) continue;
    const t = tileAt(s, u.x, u.y)!;
    const opens = tradeActions(s, pid, t).filter((a) => a.enabled && a.id.startsWith('trade:route:'));
    if (opens.length) {
      const best = opens.map((a) => ({ a, c: cityById(s, Number(a.id.slice(12)))! }))
        .map((o) => ({ ...o, q: quote(s, pid, traderOrigin(s, u, o.c)!, o.c, u.kind === 'tradeship') }))
        .sort((x, y) => y.q.mine - x.q.mine)[0];
      if (best.q.mine >= 1) return doAction(s, pid, t, best.a.id);
    }
    if (u.moved) continue;
    const goal = bestTargets(s, u)[0];
    if (!goal) continue;
    const danger = (x: number, y: number) => s.units.some((e) => e.owner !== pid && hostile(s, pid, e.owner) && UNITS[e.kind].atk > 0 && dist(e.x, e.y, x, y) <= 1) ? 2 : 0;
    const here = dist(u.x, u.y, goal.c.x, goal.c.y);
    const step = moveOptions(s, u).map((o) => ({ o, v: Math.max(0, dist(o.x, o.y, goal.c.x, goal.c.y) - 1) + danger(o.x, o.y) - (o.embark ? 0 : 0.1) }))
      .filter((m) => !m.o.embark && !m.o.disembark).sort((a, b) => a.v - b.v)[0];
    if (step && step.v < Math.max(0, here - 1)) return moveUnit(s, u, step.o.x, step.o.y);
  }
  for (const u of mine) { // pillage an enemy trail we stand on
    if (u.attacked || isTraderKind(u.kind)) continue;
    const t = tileAt(s, u.x, u.y)!;
    if (raidable(s, pid, t).length && tradeActions(s, pid, t).some((a) => a.id === 'trade:raid' && a.enabled)) return doAction(s, pid, t, 'trade:raid');
  }
  // a new merchant: spare stars, room for a route, none already on the road
  if (mine.filter((u) => isTraderKind(u.kind)).length >= AI_TRADERS || routesOpenedBy(s, pid).length >= routeCap(s, pid)) return false;
  for (const c of citiesOf(s, pid).sort((a, b) => b.level - a.level)) {
    if (routesOfCity(s, c).length >= routesPerCity(c)) continue;
    const t = tileAt(s, c.x, c.y)!;
    for (const a of tileActions(s, pid, t)) {
      if (!a.enabled || (a.id !== 'train:trader' && a.id !== 'train:tradeship') || p.stars < a.cost + 6) continue;
      // only when this city has somewhere worth going
      const kind = a.id.slice(6) as UnitKind;
      const probe = { id: -1, kind, owner: pid, x: c.x, y: c.y, homeCity: c.id } as Unit;
      if (kind === 'tradeship') { const w = shipSpawn(s, c); if (!w) continue; probe.x = w.x; probe.y = w.y; }
      const best = bestTargets(s, probe)[0];
      if (!best || best.q.mine + (best.c.owner === pid ? best.q.theirs : 0) < 2) continue;
      return doAction(s, pid, t, a.id);
    }
  }
  return false;
}

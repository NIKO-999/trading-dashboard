import { emit } from '../events';
import { area, dist, isLand, neighbors, tileAt } from '../grid';
import { unitFor } from '../../data/tribes';
import { foundCity, revealAround, spawnUnit } from '../mapgen';
import { addPop, cityById, citiesOf, def, isExplored, maxHp, tileOwnerPlayer, unitAt, unitCap } from '../rules';
import type { Action } from '../rules';
import type { City, GameState, Improvement, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// Flotilla Republic (core) + Black Market Havens (economy).
//
// Core: the Brethren hold no land. Their capital starts as a `platform` tile out on the ocean (game setup moves it off the
// shore) and every city is a floating platform. A platform is land to the rules (a city, land units and enemy landing
// parties stand on it) but Pirate ships sail straight over it (moveStep). Platforms are raised on open water next to an
// existing platform (`mech:platform`) and platforms that touch merge into ONE sea-city: its borders reach one tile
// around every platform of the cluster, and only ever over water/platforms (never land). A raft dropped next to a ship
// can seed a new cluster, which becomes a new city with `mech:found`. `mech:tow` drifts a city 1-2 tiles across the sea
// (the destination becomes platform; the old deck stays as part of the cluster). `mech:launch` turns a land unit standing
// on a platform into a galley crew (there are no shipyards: this is how the fleet is built). Boarding: a Pirate unit
// that would sink an enemy ship takes it alive instead (`spare` hook), and `mech:board` captures an adjacent, badly
// damaged enemy ship outright; the prize changes owner. At most 2 prizes a turn.
//
// Economy: no tile farming (farms, irrigation, markets and roads are blocked; villages cannot be claimed). Stars come from
// intercepting sea trade: at the start of a Pirate turn every foreign ship that sits next to a Pirate ship or in
// waters owned by a platform pays a toll (TOLL each, at most TOLL_CAP per victim); `mech:raze` lets a ship or a landed
// raider burn an enemy improvement on the coast for 2x its cost (host city loses a citizen). Stolen Stars are spent on
// `mech:recruit`: +2 population into a platform city (once every 2 turns per city). SIMPLIFICATION: the core still pays each
// city its level in Stars (`cityIncome`), the platform cities' "harbour dues"; the mechanic does not remove it.
// Enemy capture of a Pirate city is still possible (a landing party can step onto the platform).

export const PLATFORM_BASE = 3;
export const FOUND_COST = 8;
export const TOW_COST = 3; // onto open water (2 onto one of your platforms)
export const TOW_RANGE = 2;
export const LAUNCH_COST = 3;
export const TOLL = 2;
export const TOLL_CAP = 6;
export const RAID_MULT = 2;
export const RECRUIT_POP = 2;
export const RECRUIT_GAP = 2; // turns between recruitments in one city
export const MAX_PRIZES = 2;
const BLOCKED = ['farm', 'irrigate', 'market', 'road'];
export const IMPROVEMENT_COST: Partial<Record<Improvement, number>> = { farm: 5, mine: 5, lumber: 3, port: 7, temple: 10, market: 8 };
export const raidValue = (i: Improvement) => RAID_MULT * (IMPROVEMENT_COST[i] ?? 5);
export const recruitCost = (c: City) => 6 + 3 * c.level;

// ---------------------------------------------------------------- state

interface Stats { built: number; colonies: number; towed: number; recruited: number; launched: number; prizes: number; tolls: number; raided: number; lastToll: number; lastTollTurn: number; prizeTurn: number; prizeN: number }
function stats(s: GameState, owner: number): Stats {
  const m = (s.players[owner].mech ??= {}) as Record<string, number>;
  for (const k of ['built', 'colonies', 'towed', 'recruited', 'launched', 'prizes', 'tolls', 'raided', 'lastToll', 'lastTollTurn', 'prizeTurn', 'prizeN']) m[k] = m[k] ?? 0;
  return m as unknown as Stats;
}
export const statsOf = (s: GameState, owner: number): Stats => stats(s, owner);

const isPlat = (t: Tile) => t.terrain === 'platform';
const platOwner = (t: Tile) => (isPlat(t) && typeof t.data?.platform === 'number' ? (t.data.platform as number) : null);
const isShip = (u: Unit) => def(u).naval;
const isWater = (t: Tile) => t.terrain === 'shallow' || t.terrain === 'ocean';
const coastal = (s: GameState, t: Tile) => isWater(t) || neighbors(s, t.x, t.y).some(isWater);
const gain = (s: GameState, pid: number, x: number, y: number, n: number) => {
  s.players[pid].stars += n;
  emit({ type: 'stars', player: pid, x, y, amount: n });
};

export const platformsOf = (s: GameState, owner: number) => s.tiles.filter((t) => platOwner(t) === owner);
export const platformCost = (s: GameState, owner: number) => PLATFORM_BASE + Math.floor(platformsOf(s, owner).length / 4);

/** Every platform of `owner` joined (8-neighbour) to `start`: one giant sea-city. */
export function cluster(s: GameState, start: Tile, owner: number): Tile[] {
  if (!isPlat(start)) return [];
  const seen = new Set<Tile>([start]);
  const queue = [start];
  while (queue.length) {
    const t = queue.shift()!;
    for (const n of neighbors(s, t.x, t.y)) if (!seen.has(n) && platOwner(n) === owner) { seen.add(n); queue.push(n); }
  }
  return [...seen];
}
const clusterCities = (s: GameState, cl: Tile[]) => s.cities.filter((c) => cl.some((t) => t.x === c.x && t.y === c.y));

/** Borders of a sea-city: its own radius plus one tile around every platform of its cluster; water and platforms only. */
export function refreshTerritory(s: GameState, c: City) {
  const home = tileAt(s, c.x, c.y)!;
  const cl = isPlat(home) ? cluster(s, home, c.owner) : [home];
  const want = new Set<Tile>();
  for (const t of area(s, c.x, c.y, c.borderRadius)) want.add(t);
  for (const p of cl) for (const t of area(s, p.x, p.y, 1)) want.add(t);
  const ok = (t: Tile) => want.has(t) && (!isLand(t) || isPlat(t)) && (t.cityId === null || t.cityId === c.id);
  for (const t of s.tiles) {
    if (t.owner === c.id && !ok(t)) t.owner = null;
  }
  for (const t of want) if (t.owner === null && ok(t)) t.owner = c.id;
}
const refreshCluster = (s: GameState, owner: number, at: Tile) => {
  for (const c of clusterCities(s, cluster(s, at, owner))) refreshTerritory(s, c);
};

function raise(s: GameState, owner: number, t: Tile) {
  t.terrain = 'platform';
  t.resource = null;
  t.data = { ...t.data, platform: owner };
}

// ---------------------------------------------------------------- setup: the capital goes to sea

function relocateCapital(s: GameState, owner: number) {
  const city = s.cities.find((c) => c.owner === owner && c.capital) ?? citiesOf(s, owner)[0];
  if (!city) return;
  const old = tileAt(s, city.x, city.y)!;
  const others = s.cities.filter((c) => c !== city);
  const landAround = (t: Tile) => area(s, t.x, t.y, 1).filter((n) => isLand(n) && n !== t).length;
  for (const t of s.tiles) if (t.owner === city.id) t.owner = null; // the shore is given up
  const roomy = (t: Tile) => !unitAt(s, t.x, t.y) && t.cityId === null && t.owner === null && !t.village && !t.ruin && !neighbors(s, t.x, t.y).some((n) => n.village)
    && t.x > 0 && t.y > 0 && t.x < s.size - 1 && t.y < s.size - 1 && others.every((c) => dist(c.x, c.y, t.x, t.y) >= 3);
  const free = (t: Tile) => isWater(t) && roomy(t);
  let best: Tile | null = null;
  let bestScore = Infinity;
  for (const t of s.tiles) {
    if (!free(t)) continue;
    const d = dist(t.x, t.y, old.x, old.y);
    if (d > 7) continue;
    const score = d * 2 + landAround(t) * 3 + (t.terrain === 'ocean' ? 0 : 1);
    if (score < bestScore) { bestScore = score; best = t; }
  }
  // (a landlocked homeland: a deep bay is dug two tiles from the old capital)
  best ??= s.tiles.filter((t) => t !== old && roomy(t) && dist(t.x, t.y, old.x, old.y) <= 3 && t.terrain !== 'mountain')
    .sort((a, b) => Math.abs(dist(a.x, a.y, old.x, old.y) - 2) - Math.abs(dist(b.x, b.y, old.x, old.y) - 2) || a.y - b.y || a.x - b.x)[0] ?? null;
  const target = best ?? old; // (nothing at all: the capital tile itself is turned into a deck)
  if (target !== old) {
    old.cityId = null;
    target.cityId = city.id;
    city.x = target.x;
    city.y = target.y;
    for (const u of s.units) if (u.owner === owner && u.x === old.x && u.y === old.y) { u.x = target.x; u.y = target.y; }
    // open sea around the new home: land beside it is flooded into deep water
    for (const n of neighbors(s, target.x, target.y)) {
      if (n !== old && isLand(n) && n.cityId === null && n.owner === null && !n.village && !unitAt(s, n.x, n.y) && !neighbors(s, n.x, n.y).some((k) => k.village)) {
        n.terrain = 'ocean'; n.resource = null; n.improvement = null; n.ruin = false; n.road = false;
      }
    }
    target.resource = null; target.improvement = null;
  }
  raise(s, owner, target);
  // a second deck stitched to the first, so the sea-city starts as a cluster
  const twin = neighbors(s, target.x, target.y).filter((n) => free(n) && n !== old).sort((a, b) => landAround(a) - landAround(b) || a.y - b.y || a.x - b.x)[0];
  if (twin) raise(s, owner, twin);
  refreshTerritory(s, city);
  // fishing grounds in the new borders (three shallow fish tiles), so the city can grow and always starts with room
  if (target !== old) {
    const ring = neighbors(s, target.x, target.y).filter((n) => isWater(n) && n.cityId === null && !n.village).sort((a, b) => a.y - b.y || a.x - b.x);
    for (const t of ring.slice(0, 3)) { t.terrain = 'shallow'; t.resource = 'fish'; t.improvement = null; }
  }
  // a galley to start raiding with
  const berth = neighbors(s, target.x, target.y).find((n) => isWater(n) && !unitAt(s, n.x, n.y) && !n.resource && n.terrain === 'ocean')
    ?? neighbors(s, target.x, target.y).find((n) => isWater(n) && !unitAt(s, n.x, n.y));
  if (berth) spawnUnit(s, 'ship', owner, berth.x, berth.y, city.id).carrying = unitFor(s.players[owner].tribe, 'warrior'); // (a galley always has a crew aboard)
}

// ---------------------------------------------------------------- checks

/** Can `owner` raise a platform on water tile t? null: not offered; a string: offered but blocked; undefined: fine. */
function platformCheck(s: GameState, owner: number, t: Tile, needStars = true): string | undefined | null {
  if (!isWater(t) || t.cityId !== null) return null;
  const host = tileOwnerPlayer(s, t);
  if (host !== null && host !== owner) return null;
  const nearPlat = neighbors(s, t.x, t.y).some((n) => platOwner(n) === owner);
  const nearShip = s.units.some((u) => u.owner === owner && isShip(u) && dist(u.x, u.y, t.x, t.y) <= 1);
  if (!nearPlat && !nearShip) return null;
  if (!isExplored(s, owner, t.x, t.y)) return null;
  if (!nearPlat && s.cities.some((c) => dist(c.x, c.y, t.x, t.y) < 3)) return 'Too close to a city for a new raft';
  if (t.resource) return 'Harvest the resource here first';
  const at = unitAt(s, t.x, t.y);
  if (at && at.owner !== owner) return 'An enemy is in the way';
  if (needStars && s.players[owner].stars < platformCost(s, owner)) return 'Not enough stars';
  return undefined;
}

function foundCheck(s: GameState, owner: number, t: Tile, needStars = true): string | undefined | null {
  if (platOwner(t) !== owner || t.cityId !== null) return null;
  if (clusterCities(s, cluster(s, t, owner)).length) return null;
  if (s.cities.some((c) => dist(c.x, c.y, t.x, t.y) < 3)) return 'Too close to another city';
  const at = unitAt(s, t.x, t.y);
  if (at && at.owner !== owner) return 'An enemy is in the way';
  if (needStars && s.players[owner].stars < FOUND_COST) return 'Not enough stars';
  return undefined;
}

/** The city that would be towed to t, and what it costs. */
function towCheck(s: GameState, owner: number, t: Tile): { city: City; cost: number; reason?: string } | null {
  if (t.cityId !== null || unitAt(s, t.x, t.y)) return null;
  const onOwn = platOwner(t) === owner;
  if (!onOwn && !isWater(t)) return null;
  const host = tileOwnerPlayer(s, t);
  if (host !== null && host !== owner) return null;
  if (!isExplored(s, owner, t.x, t.y)) return null;
  const c = citiesOf(s, owner)
    .filter((k) => isPlat(tileAt(s, k.x, k.y)!) && dist(k.x, k.y, t.x, t.y) <= TOW_RANGE && k.data?.towed !== s.turn)
    .sort((a, b) => dist(a.x, a.y, t.x, t.y) - dist(b.x, b.y, t.x, t.y) || a.id - b.id)[0];
  if (!c) return null;
  const cost = onOwn ? TOW_COST - 1 : TOW_COST;
  let reason: string | undefined;
  if (t.resource) reason = 'Harvest the resource here first';
  else if (s.players[owner].stars < cost) reason = 'Not enough stars';
  return { city: c, cost, reason };
}

function launchCheck(s: GameState, owner: number, t: Tile): Unit | null {
  const u = unitAt(s, t.x, t.y);
  if (!u || u.owner !== owner || isShip(u) || !isPlat(t) || u.moved || u.attacked) return null;
  return u;
}

function recruitCheck(s: GameState, owner: number, t: Tile): { city: City; reason?: string } | null {
  const c = cityById(s, t.cityId);
  if (!c || c.owner !== owner) return null;
  if (typeof c.data?.recruited === 'number' && s.turn - (c.data.recruited as number) < RECRUIT_GAP) return { city: c, reason: 'The crew is still settling in (one recruitment every 2 turns)' };
  if (s.players[owner].stars < recruitCost(c)) return { city: c, reason: 'Not enough stars' };
  return { city: c };
}

/** A raider that can hit the coast at t: a ship within 2, or a landed unit standing on it. */
function raidCheck(s: GameState, owner: number, t: Tile): Unit | null {
  if (!t.improvement || t.cityId !== null) return null;
  const host = tileOwnerPlayer(s, t);
  if (host === null || host === owner || !coastal(s, t)) return null;
  return s.units.find((u) => u.owner === owner && !u.attacked && def(u).atk > 0 && (isShip(u) ? dist(u.x, u.y, t.x, t.y) <= 2 : dist(u.x, u.y, t.x, t.y) === 0)) ?? null;
}

function canPrize(s: GameState, owner: number) {
  const st = stats(s, owner);
  return st.prizeTurn !== s.turn || st.prizeN < MAX_PRIZES;
}

/** Boarding an enemy ship standing on t: my ship next to it that can still act; the prey must be badly hurt. */
function boardCheck(s: GameState, owner: number, t: Tile): { by?: Unit; reason?: string } | null {
  const prey = unitAt(s, t.x, t.y);
  if (!prey || prey.owner === owner || !isShip(prey)) return null;
  const by = s.units.find((u) => u.owner === owner && isShip(u) && !u.attacked && dist(u.x, u.y, prey.x, prey.y) === 1);
  if (!by) return null;
  if (!canPrize(s, owner)) return { reason: `Only ${MAX_PRIZES} prizes a turn` };
  if (prey.hp * 2 > maxHp(prey)) return { reason: 'Wear it down to half strength first' };
  return { by };
}

// ---------------------------------------------------------------- doing things

function takePrize(s: GameState, owner: number, prey: Unit, hp?: number) {
  const st = stats(s, owner);
  const oldHome = cityById(s, prey.homeCity);
  if (oldHome) oldHome.units = Math.max(0, oldHome.units - 1);
  const from = prey.owner;
  prey.owner = owner;
  if (hp !== undefined) prey.hp = Math.max(1, Math.min(maxHp(prey), hp));
  prey.moved = prey.attacked = true;
  prey.fortified = false;
  if (prey.data) { const { boarded: _b, ...rest } = prey.data; prey.data = rest; }
  const home = citiesOf(s, owner)
    .filter((c) => c.units < unitCap(c))
    .sort((a, b) => dist(a.x, a.y, prey.x, prey.y) - dist(b.x, b.y, prey.x, prey.y) || a.id - b.id)[0];
  prey.homeCity = home?.id ?? null;
  if (home) home.units++;
  if (st.prizeTurn !== s.turn) { st.prizeTurn = s.turn; st.prizeN = 0; }
  st.prizeN++;
  st.prizes++;
  emit({ type: 'toast', player: owner, text: `Boarded! A ${def(prey).name} of ${s.players[from].tribe} now flies the black flag.` });
  revealAround(s, owner);
}

function doRaid(s: GameState, owner: number, u: Unit, t: Tile) {
  const value = raidValue(t.improvement!);
  const host = cityById(s, t.owner);
  t.improvement = null;
  gain(s, owner, t.x, t.y, value);
  stats(s, owner).raided += value;
  if (host) addPop(s, host, -1);
  u.attacked = true;
  emit({ type: 'toast', player: owner, text: `Coast raided: +${value}★.` });
}

function doTow(s: GameState, owner: number, c: City, t: Tile) {
  const from = tileAt(s, c.x, c.y)!;
  from.cityId = null;
  raise(s, owner, t);
  t.cityId = c.id;
  c.x = t.x;
  c.y = t.y;
  c.data = { ...c.data, towed: s.turn };
  const garrison = unitAt(s, from.x, from.y);
  if (garrison && garrison.owner === owner) { garrison.x = t.x; garrison.y = t.y; }
  stats(s, owner).towed++;
  refreshCluster(s, owner, t);
  refreshTerritory(s, c);
  revealAround(s, owner);
  emit({ type: 'toast', player: owner, text: `${c.name} drifts across the waves.` });
}

function doLaunch(u: Unit) {
  const ratio = u.hp / maxHp(u);
  u.carrying = u.kind;
  u.kind = 'ship';
  u.hp = Math.max(1, Math.round(maxHp(u) * ratio));
  u.attacked = true; // the crew are busy casting off
}

// ---------------------------------------------------------------- the mechanic

export const mech: Mechanic = {
  name: 'Flotilla Republic & Black Market Havens',
  blurb: 'No land at all: platforms stitch into sea-cities that tow across the waves, and boarded ships join the fleet. Stars come only from tolls and coastal raids, and are spent to recruit people into the platforms.',

  setup(s, owner) {
    stats(s, owner);
    relocateCapital(s, owner);
  },

  // Pirate ships sail over platforms as if they were water (everyone else lands on them).
  moveStep(s, owner, u, _from, to, ctx) {
    if (u.owner !== owner || !isShip(u) || !isPlat(to)) return;
    ctx.opt = { x: to.x, y: to.y };
    ctx.cost = 1;
    ctx.stop = s.units.some((e) => e.owner !== u.owner && dist(e.x, e.y, to.x, to.y) === 1 && isExplored(s, u.owner, e.x, e.y));
  },

  // A Pirate strike that would sink an enemy ship takes it alive instead (see afterAttack).
  spare(s, owner, a, d) {
    if (a.owner !== owner || d.owner === owner || !isShip(d) || !canPrize(s, owner)) return false;
    d.data = { ...d.data, boarded: owner };
    return true;
  },

  afterAttack(s, owner, a, d) {
    if (a.owner !== owner || d.data?.boarded !== owner) return;
    takePrize(s, owner, d, Math.ceil(maxHp(d) / 3));
  },

  turnStart(s, owner) {
    const st = stats(s, owner);
    const mine = s.units.filter((u) => u.owner === owner && isShip(u));
    const paid = new Map<number, number>();
    let total = 0;
    for (const f of s.units) {
      if (f.owner === owner || !isShip(f) || !s.players[f.owner].alive) continue;
      const near = mine.some((m) => dist(m.x, m.y, f.x, f.y) <= 1) || tileOwnerPlayer(s, tileAt(s, f.x, f.y)!) === owner;
      if (!near) continue;
      const left = TOLL_CAP - (paid.get(f.owner) ?? 0);
      const take = Math.min(TOLL, left, Math.max(0, s.players[f.owner].stars));
      if (take <= 0) continue;
      s.players[f.owner].stars -= take;
      paid.set(f.owner, (paid.get(f.owner) ?? 0) + take);
      gain(s, owner, f.x, f.y, take);
      total += take;
    }
    if (total > 0) {
      st.tolls += total;
      st.lastToll = total;
      st.lastTollTurn = s.turn;
      emit({ type: 'toast', player: owner, text: `Tolls from passing ships: +${total}★.` });
    }
    // keep every sea-city's borders in step with its platforms
    for (const c of citiesOf(s, owner)) if (isPlat(tileAt(s, c.x, c.y)!)) refreshTerritory(s, c);
  },

  block(s, owner, pid, actionId, t) {
    if (pid !== owner) return undefined;
    if (BLOCKED.includes(actionId)) return 'The Flotilla lives off the sea, not the soil';
    if (actionId === 'capture' && t.village) return 'The Flotilla builds only on the waves';
    return undefined;
  },

  actions(s, owner, t): Action[] {
    const out: Action[] = [];
    const pc = platformCheck(s, owner, t);
    if (pc !== null) {
      out.push({
        id: 'mech:platform', label: 'Raise Platform',
        desc: 'Build a floating deck here. Platforms that touch merge into one sea-city and extend its borders. Needs a neighbouring platform (or a ship beside it, to start a new raft far from any city).',
        cost: platformCost(s, owner), enabled: pc === undefined, reason: pc, icon: 'port',
      });
    }
    const fc = foundCheck(s, owner, t);
    if (fc !== null) {
      out.push({
        id: 'mech:found', label: 'Found Sea-City', desc: 'Make this stand-alone platform a new city of the Flotilla.',
        cost: FOUND_COST, enabled: fc === undefined, reason: fc, icon: 'flag',
      });
    }
    const tw = towCheck(s, owner, t);
    if (tw) {
      out.push({
        id: 'mech:tow', label: 'Tow City Here',
        desc: `Drift ${tw.city.name} to this tile (1-${TOW_RANGE} tiles, once a turn). Open water becomes platform; the old deck stays.`,
        cost: tw.cost, enabled: !tw.reason, reason: tw.reason, icon: 'ship',
      });
    }
    const lu = launchCheck(s, owner, t);
    if (lu) {
      out.push({
        id: 'mech:launch', label: 'Launch Galley', desc: `Put this unit to sea: it becomes a galley crewed by ${def(lu).name}s (moves 4, attacks +1).`,
        cost: LAUNCH_COST, enabled: s.players[owner].stars >= LAUNCH_COST, reason: s.players[owner].stars >= LAUNCH_COST ? undefined : 'Not enough stars', icon: 'ship',
      });
    }
    const rc = recruitCheck(s, owner, t);
    if (rc) {
      out.push({
        id: 'mech:recruit', label: 'Recruit Crew', desc: `Spend stolen stars to bring ${RECRUIT_POP} people aboard ${rc.city.name}.`,
        cost: recruitCost(rc.city), enabled: !rc.reason, reason: rc.reason, icon: 'market',
      });
    }
    if (raidCheck(s, owner, t)) {
      out.push({
        id: 'mech:raid', label: 'Raid Coast', desc: `Burn this ${t.improvement}: +${raidValue(t.improvement!)}★ now, and the host city loses a citizen.`,
        cost: 0, enabled: true, icon: 'axe',
      });
    }
    const bc = boardCheck(s, owner, t);
    if (bc) {
      out.push({
        id: 'mech:board', label: 'Board Ship', desc: 'Swarm the wounded ship: it joins your fleet under the black flag (2 prizes a turn).',
        cost: 0, enabled: !!bc.by, reason: bc.reason, icon: 'buccaneer',
      });
    }
    return out;
  },

  doAction(s, owner, t, id) {
    const st = stats(s, owner);
    if (id === 'mech:platform') {
      if (platformCheck(s, owner, t, false) !== undefined) return false;
      raise(s, owner, t);
      st.built++;
      refreshCluster(s, owner, t);
      return true;
    }
    if (id === 'mech:found') {
      if (foundCheck(s, owner, t, false) !== undefined) return false;
      const c = foundCity(s, t.x, t.y, owner, false);
      t.terrain = 'platform'; // foundCity makes a field
      t.data = { ...t.data, platform: owner };
      refreshTerritory(s, c);
      st.colonies++;
      revealAround(s, owner);
      return true;
    }
    if (id === 'mech:tow') {
      const tw = towCheck(s, owner, t);
      if (!tw || tw.reason) return false;
      doTow(s, owner, tw.city, t);
      return true;
    }
    if (id === 'mech:launch') {
      const u = launchCheck(s, owner, t);
      if (!u) return false;
      doLaunch(u);
      st.launched++;
      return true;
    }
    if (id === 'mech:recruit') {
      const rc = recruitCheck(s, owner, t);
      if (!rc || rc.reason) return false;
      rc.city.data = { ...rc.city.data, recruited: s.turn };
      emit({ type: 'harvest', player: owner, x: t.x, y: t.y, pop: RECRUIT_POP });
      addPop(s, rc.city, RECRUIT_POP);
      st.recruited++;
      return true;
    }
    if (id === 'mech:raid') {
      const u = raidCheck(s, owner, t);
      if (!u) return false;
      doRaid(s, owner, u, t);
      return true;
    }
    if (id === 'mech:board') {
      const bc = boardCheck(s, owner, t);
      if (!bc?.by) return false;
      bc.by.attacked = true;
      bc.by.moved = true;
      takePrize(s, owner, unitAt(s, t.x, t.y)!);
      return true;
    }
    return false;
  },

  ai(s, owner) {
    const p = s.players[owner];
    const cities = citiesOf(s, owner);
    const ships = s.units.filter((u) => u.owner === owner && isShip(u));
    // 1. board a wounded ship
    for (const u of s.units) {
      if (u.owner === owner) continue;
      const t = tileAt(s, u.x, u.y)!;
      if (boardCheck(s, owner, t)?.by) return mech.doAction!(s, owner, t, 'mech:board');
    }
    // 2. raid a coastal improvement
    for (const t of s.tiles) if (t.improvement && raidCheck(s, owner, t)) return mech.doAction!(s, owner, t, 'mech:raid');
    // 3. flee a city that is outnumbered by enemies close by
    for (const c of cities) {
      if (c.data?.towed === s.turn || p.stars < TOW_COST + 1) continue;
      const foes = s.units.filter((u) => u.owner !== owner && dist(u.x, u.y, c.x, c.y) <= 2);
      const mine = s.units.filter((u) => u.owner === owner && dist(u.x, u.y, c.x, c.y) <= 2).length;
      if (foes.length < 2 || foes.length <= mine) continue;
      let best: Tile | null = null;
      let bestD = -1;
      for (const t of area(s, c.x, c.y, TOW_RANGE)) {
        if (t === tileAt(s, c.x, c.y) || towCheck(s, owner, t)?.city !== c || towCheck(s, owner, t)?.reason) continue;
        const d = Math.min(...foes.map((f) => dist(f.x, f.y, t.x, t.y)));
        if (d > bestD) { bestD = d; best = t; }
      }
      if (best && bestD > Math.min(...foes.map((f) => dist(f.x, f.y, c.x, c.y)))) return mech.doAction!(s, owner, best, 'mech:tow');
    }
    // 4. recruit people into a platform city
    for (const c of cities) {
      const t = tileAt(s, c.x, c.y)!;
      const rc = recruitCheck(s, owner, t);
      if (rc && !rc.reason && p.stars >= recruitCost(c) + 2) return mech.doAction!(s, owner, t, 'mech:recruit');
    }
    // 5. put a land crew to sea while the fleet is small
    if (ships.length < 2 + cities.length && p.stars >= LAUNCH_COST + 2) {
      for (const u of s.units) {
        if (u.owner !== owner) continue;
        const t = tileAt(s, u.x, u.y)!;
        if (launchCheck(s, owner, t)) return mech.doAction!(s, owner, t, 'mech:launch');
      }
    }
    // 6. found a city on a lone raft
    if (cities.length < 4 && p.stars >= FOUND_COST + 2) {
      for (const t of platformsOf(s, owner)) if (foundCheck(s, owner, t) === undefined) return mech.doAction!(s, owner, t, 'mech:found');
    }
    // 7. drop a raft beside a ship, far from every city, to seed a colony
    if (cities.length < 4 && p.stars >= platformCost(s, owner) + FOUND_COST + 2 && !platformsOf(s, owner).some((t) => foundCheck(s, owner, t, false) === undefined)) {
      const home = cities[0];
      let best: Tile | null = null;
      let bestD = Infinity;
      for (const sh of ships) {
        for (const t of area(s, sh.x, sh.y, 1)) {
          if (platformCheck(s, owner, t) !== undefined || neighbors(s, t.x, t.y).some((n) => platOwner(n) === owner)) continue;
          const d = home ? dist(home.x, home.y, t.x, t.y) : 0;
          if (d < bestD || (d === bestD && best && (t.y < best.y || (t.y === best.y && t.x < best.x)))) { bestD = d; best = t; }
        }
      }
      if (best) return mech.doAction!(s, owner, best, 'mech:platform');
    }
    // 8. widen the sea-city while stars are plentiful
    if (platformsOf(s, owner).length < 4 + cities.length * 4 && p.stars >= platformCost(s, owner) + 5) {
      let best: Tile | null = null;
      let bestN = -1;
      for (const pt of platformsOf(s, owner)) {
        for (const t of neighbors(s, pt.x, pt.y)) {
          if (platformCheck(s, owner, t) !== undefined) continue;
          const n =neighbors(s, t.x, t.y).filter((k) => k.owner === null && !isLand(k)).length;
          if (n > bestN || (n === bestN && best && (t.y < best.y || (t.y === best.y && t.x < best.x)))) { bestN = n; best = t; }
        }
      }
      if (best && bestN >= 2) return mech.doAction!(s, owner, best, 'mech:platform');
    }
    return false;
  },
};

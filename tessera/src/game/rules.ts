import { forkRivals, prereqs, TECH_BY_ID, techsFor } from '../data/techs';
import { TRIBES, unitFor } from '../data/tribes';
import type { CombatCtx } from './mech/types';
import { hookActions, hookAfterAttack, hookAfterMove, hookAttackTargets, hookBlock, hookCityCaptured, hookCombat, hookDoAction, hookExtraMoves, hookMoveStep, hookSpare, hookStat, hookUnitDied, unitVisibleTo } from './mech';
import { perkRange, perksOf, perkSum, perkUnit, unitMatches } from './perks';
import { NAVAL_UPGRADE, UNITS, type UnitDef } from '../data/units';
import { emit } from './events';
import { cityOrigin, offerCulture } from './culture';
import { clusterBonus, clusterHint, LINK_POP, MAX_LINKS_PAID_POP, MAX_PAYING_LINKS, networkIncome, roadNetwork, ROAD_MILESTONES, ROADS_PER_STAR } from './network';
import { area, dist, isLand, isWater, neighbors, tileAt } from './grid';
import { claimTerritory, foundCity, meet, revealAround, spawnUnit } from './mapgen';
import { alliedVictory, diploFought, hostile, mayStep } from './diplomacy';
import { heroDiscount, heroHp, heroSpent } from './heroes';
import { ashBonus, beastSlain, campAt, isBeast, isLava, wildActions, wildDoAction } from './wild';
import { clanCampAt, enterCamp, raiderSlain } from './clans';
import { freeActions, freeDoAction, freeFalls, freeIncome, freeStruck, freeTechOff, isFreeCity, FREE_RAZE_SCORE } from './citystates';
import { wonderActions, wonderDoAction, wonderOn } from './wonders';
import { WONDER_SCORE, wondersHeldBy } from '../data/wonders';
import { naturalCityIncome, naturalDefence, naturalFilter, naturalMove, naturalTechOff } from './naturals';
import { cityRouteIncome, isTrader, shipSpawn, tradeActions, tradeDoAction, traderDiscount, TRADER_KINDS, tradeSweep, traderName } from './trade';
import { uniqueEdge } from './uniques';
import { isRoleShip, isRoleUnit, postedCity, postSpawn, RECRUIT_CAP, roleActions, roleCityIncome, roleDiscount, roleDoAction, roleKindsOf, roleName, undermined } from './roles';
import { formation, outOfSupply, supplyAfterMove, upgradeCost, upgradeTarget, upgradeWhy } from './army';
import { AUX_KINDS, auxActions, auxDoAction, auxName, braceOf, isSupport, scoutRuin } from './auxiliaries';
import { levelActions, levelBoatDiscount, levelCityIncome, levelDoAction, levelGrowOnLevelUp, levelScore, levelTrainDiscount, specialNote, specialStart } from './levels';
import { EUREKA_OFF, sparked } from './sparks';
import { festivalActions, festivalDo } from './festival';
import { barracksActions, barracksDoAction, isBarracks, trainingDefense } from './barracks';
import { homesteadActions, homesteadDoAction } from './homestead';
import { frontierActions, frontierDoAction } from './frontier';
import { forgeActions, forgeDoAction } from './forge';
import { govActions, govCityIncome, govDefense, govDiscount, govDoAction, govTechOff } from './governors';
import { ageCityIncome, ageOf, DARK_OFF, eraCheck } from './eras';
import { MONOPOLY_AT, MONOPOLY_ROUTES_MAX, type Luxury } from './goods';
import { isLuxury, LUX_COST, LUX_EXTRA, LUX_FIRST, LUXURIES, luxuriesOf, luxuryIncome, needNote, needWhy, spendNeeds } from './goods';
import type { City, GameState, Player, Tile, Unit, UnitKind } from './types';

// ---------------------------------------------------------------- basics

export const hasTech = (s: GameState, pid: number, tech: string | null) => tech === null || s.players[pid].techs.includes(tech);
export const def = (u: Unit): UnitDef => UNITS[u.kind];
/** Full health. A boat carrying a unit has that unit's health, as in Polytopia. */
export const maxHp = (u: Unit) => UNITS[u.carrying ?? u.kind].hp + (u.veteran ? 5 : 0) + heroHp(u) + Number(u.data?.hpBonus ?? 0); // hpBonus: e.g. a Golden Guardian raised by wonders
export const cityById = (s: GameState, id: number | null) => (id === null ? undefined : s.cities.find((c) => c.id === id));
export const unitAt = (s: GameState, x: number, y: number) => s.units.find((u) => u.x === x && u.y === y);
export const tileOwnerPlayer = (s: GameState, t: Tile) => (t.owner === null ? null : (cityById(s, t.owner)?.owner ?? null));
export const isExplored = (s: GameState, pid: number, x: number, y: number) => s.players[pid].explored[y * s.size + x];
export const citiesOf = (s: GameState, pid: number) => s.cities.filter((c) => c.owner === pid);
const MOUNTED: UnitKind[] = ['rider', 'chariot', 'jaguar', 'knight', 'horsearcher', 'elephant', 'buffalorider', 'khampa'];

/** What a unit costs this empire to train (Mongols' Steppe Riders pay 1★ less for mounted units). */
const perkCost = (s: GameState, pid: number, k: UnitKind) => {
  if (!s.players[pid].techs.length) return 0;
  const tribe = s.players[pid].tribe;
  const of = (['melee', 'ranged', 'mounted', 'siege'] as const).filter((w) => unitMatches(tribe, k, w));
  const naval = UNITS[k].naval ? 'naval' : null;
  return Math.min(UNITS[k].cost - 1, perkSum(s, pid, 'cost', (p) => p.of === naval || (of as readonly string[]).includes(p.of)));
};
/** Salt & Gold Inflation (Mali): a flooded empire's markets are hyper-inflated, so everything it trains costs double. */
export const inflationOf = (s: GameState, pid: number): { until: number; pauseUntil: number } | null => {
  const i = (s.mech?.inflation as Record<string, { until: number; pauseUntil: number }> | undefined)?.[pid];
  return i && s.turn <= i.until ? i : null;
};
export const trainCost = (s: GameState, pid: number, k: UnitKind) => {
  let cost = UNITS[k].cost - (s.players[pid].tribe === 'mongols' && MOUNTED.includes(k) ? 1 : 0) - (s.players[pid].tribe === 'ottoman' && k === 'catapult' ? 3 : 0) - perkCost(s, pid, k) - traderDiscount(s, pid, k);
  if (s.players[pid].techs.length) { // the Trade/Markets fork: Caravan Monopoly surcharges, Mercenary Contracts discount
    cost = Math.max(1, cost + perkSum(s, pid, 'unitcost')); // Conscription (a policy card) takes 1★ off, never below 1★
    const pct = perkSum(s, pid, 'unitpct');
    if (pct) cost = Math.max(1, Math.round(cost * (1 - pct)));
  }
  return (inflationOf(s, pid) ? 2 : 1) * cost;
};

/** Pirates' Sea Raiders bonus: their boats and ships move one tile further and hit harder. */
/** Tibetans scale mountains without Climbing. */
const canClimb = (s: GameState, pid: number) => hasTech(s, pid, 'climbing') || s.players[pid].tribe === 'tibet';

export const seaBonus = (s: GameState, u: Unit) => (def(u).naval && s.players[u.owner].tribe === 'pirates' ? 1 : 0);
const PORT_COST = (s: GameState, pid: number) => (s.players[pid].tribe === 'pirates' ? 4 : 7);

// ---------------------------------------------------------------- economy

/** Pax Romana holds while the empire has not lost a city in the last PAX_LAPSE turns. */
export const PAX_LAPSE = 5;
export const paxHolds = (s: GameState, pid: number) => s.turn - (s.players[pid].skill?.lost ?? -99) > PAX_LAPSE;

/** A city's Stars a turn (`tax`: false leaves out a stationed Tax Collector's share; see game/roles). */
export function cityIncome(s: GameState, c: City, tax = true) {
  let inc = c.level + (c.capital ? 1 : 0) + (c.workshop ? 1 : 0) + c.parks;
  const tribe = s.players[c.owner].tribe;
  const perks = perksOf(s, c.owner);
  const sum = (k: string) => perks.reduce((n, pk) => n + (pk.k === k ? (pk as { n: number }).n : 0), 0);
  // trade Stars: markets (Silk Road doubles them) and the Trade bonus; Caravan Monopoly multiplies them
  const trade = s.tiles.filter((t) => t.owner === c.id && t.improvement === 'market').length * (tribe === 'china' ? 2 : 1) + (hasTech(s, c.owner, 'trade') ? 1 : 0);
  inc += trade * (1 + sum('trade'));
  const canopy = sum('canopy'); // Sacred Canopy: standing forest pays, up to half the city's level
  if (canopy) inc += canopy * Math.min(Math.ceil(c.level / 2), s.tiles.filter((t) => t.owner === c.id && t.terrain === 'forest').length);
  if (tribe === 'maya') inc += s.tiles.filter((t) => t.owner === c.id && t.improvement === 'temple').length; // Sky Watchers
  if (tribe === 'khmer') inc += s.tiles.filter((t) => t.owner === c.id && t.improvement === 'farm').length; // Baray Reservoirs
  if (tribe === 'mali') inc += s.tiles.filter((t) => t.owner === c.id && t.improvement === 'mine').length; // Gold of the Sahel
  if (s.players[c.owner].tribe === 'pirates') inc += s.tiles.filter((t) => t.owner === c.id && t.improvement === 'port').length;
  const net = roadNetwork(s, c);
  inc += networkIncome(net);
  inc += cityRouteIncome(s, c); // trade routes pay both ends (see game/trade)
  inc += levelCityIncome(s, c); // raised tiles and Districts (see game/levels)
  inc += govCityIncome(s, c); // a Treasurer (see game/governors)
  inc += naturalCityIncome(s, c); // the Skymirror Flats (see game/naturals)
  const pax = sum('pax');
  if (pax && net.linked.length && paxHolds(s, c.owner)) inc += pax; // Pax Romana
  {
    for (const pk of perks) {
      if (pk.k !== 'income') continue;
      if (pk.per === 'city') inc += pk.n;
      else if (pk.per === 'capital') inc += c.capital ? pk.n : 0;
      else if (pk.per === 'road') inc += Math.floor(pk.n * (s.tiles.filter((t) => t.owner === c.id && t.road).length / 4));
      else if (pk.per === 'bigcity') inc += c.level >= 3 ? pk.n : 0; // a Classical Republic (see game/government)
      else inc += Math.trunc(pk.n * s.tiles.filter((t) => t.owner === c.id && t.improvement === pk.per).length);
    }
  }
  return inc + roleCityIncome(s, c, inc, tax); // a Master Builder's grand works and a Tax Collector's share (see game/roles)
}

export const income = (s: GameState, pid: number) => citiesOf(s, pid).reduce((sum, c) => sum + cityIncome(s, c) + ageCityIncome(s, pid), 0) + luxuryIncome(s, pid) + freeIncome(s, pid); // luxuries pay the empire (see game/goods), and so do Trade cities (see game/citystates)

export function score(s: GameState, pid: number) {
  const p = s.players[pid];
  const cities = citiesOf(s, pid);
  const explored = p.explored.filter(Boolean).length;
  const territory = s.tiles.filter((t) => t.owner !== null && cityById(s, t.owner)?.owner === pid).length;
  const levels = cities.reduce((a, c) => a + c.level, 0);
  // a tech scores its tier; the nodes beyond the shared tree and the empire's line (forks, links, wildcards) score 1 each
  const techs = p.techs.reduce((a, t) => a + (TECH_BY_ID[t] ? (TECH_BY_ID[t].ring === 'core' || TECH_BY_ID[t].ring === 'culture' ? TECH_BY_ID[t].tier : 1) : 1), 0);
  const army = s.units.filter((u) => u.owner === pid).reduce((a, u) => a + def(u).cost, 0);
  const wonders = wondersHeldBy(s, pid).length * WONDER_SCORE; // World Wonders (see game/wonders)
  return explored * 5 + territory * 20 + levels * 50 + cities.length * 100 + techs * 100 + army * 5 + p.kills * 20 + p.bonusScore + wonders + levelScore(s, pid); // Holy Districts (see game/levels)
}

// ---------------------------------------------------------------- research

export function techCost(s: GameState, pid: number, tech: string) {
  const t = TECH_BY_ID[tech];
  const n = Math.max(1, citiesOf(s, pid).length);
  const base = t.tier * n + 4;
  // a Eureka (game/sparks), a met rival who already knows it, and a Dark Age (game/eras) each take a share off
  const mult = (sparked(s, pid, tech) ? 1 - EUREKA_OFF : 1) * (knownByContact(s, pid, tech) ? 1 - CONTACT_OFF : 1) * (ageOf(s, pid) === 'dark' ? 1 - DARK_OFF : 1);
  const sparkedBase = mult < 1 ? Math.ceil(base * mult) : base;
  const cost = Math.max(1, (hasTech(s, pid, 'philosophy') ? Math.ceil(sparkedBase * 0.67) : sparkedBase) - govTechOff(s, pid) - freeTechOff(s, pid) // a Scholar (see game/governors) and Science cities (see game/citystates)
    - perkSum(s, pid, 'cost', (p) => p.of === 'tech') + perkSum(s, pid, 'techcost', (p) => p.tech === tech)
    - naturalTechOff(s, pid, base)); // the Glimmerdeep Grotto (see game/naturals)
  return s.players[pid].tribe === 'greeks' ? Math.max(1, cost - 1) : cost; // Academy
}

/** The share a tech gets cheaper when an empire you have met already knows it. */
export const CONTACT_OFF = 0.2;
/** A met, living rival that already knows `tech`, or undefined. */
export function knownByContact(s: GameState, pid: number, tech: string): Player | undefined {
  const met = s.players[pid].met;
  if (!met?.length) return undefined;
  return s.players.find((q) => q.id !== pid && q.alive && !q.neutral && met.includes(q.id) && q.techs.includes(tech));
}

export type ResearchStatus = 'owned' | 'available' | 'locked' | 'sealed';

/** `sealed`: the other side of a fork was chosen. Aether Links need every tech in `requires`; others their parent. */
export function researchStatus(s: GameState, pid: number, tech: string): ResearchStatus {
  if (hasTech(s, pid, tech)) return 'owned';
  const t = TECH_BY_ID[tech];
  if (t.tribe && t.tribe !== s.players[pid].tribe) return 'locked'; // someone else's skill line
  if (forkRivals(tech).some((r) => hasTech(s, pid, r))) return 'sealed';
  return prereqs(t).every((q) => hasTech(s, pid, q)) ? 'available' : 'locked';
}

export function research(s: GameState, pid: number, tech: string) {
  const p = s.players[pid];
  const cost = techCost(s, pid, tech);
  if (researchStatus(s, pid, tech) !== 'available' || p.stars < cost) return false;
  p.stars -= cost;
  p.techs.push(tech);
  if (p.tribe === 'korea') { // Scholars
    const cap = citiesOf(s, pid).find((c) => c.capital) ?? citiesOf(s, pid)[0];
    if (cap) addPop(s, cap, 1);
  }
  eraCheck(s, pid); // a new era (see game/eras)
  return true;
}

export const researchable = (s: GameState, pid: number) => techsFor(s.players[pid].tribe).filter((t) => researchStatus(s, pid, t.id) === 'available');

// ---------------------------------------------------------------- transmutation shift (respec)

export const TRANSMUTE_BASE = 24;
export const TRANSMUTE_PER_CITY = 3;
/** The lump of Stars a Transmutation Shift costs: about 30, a little more for every city. */
export const transmuteCost = (s: GameState, pid: number) => TRANSMUTE_BASE + TRANSMUTE_PER_CITY * Math.max(1, citiesOf(s, pid).length);

/** The known sub-branch rooted at `tech`: it and every known node that grew from it (children, links, a line...). */
export function subBranch(s: GameState, pid: number, tech: string): string[] {
  const owned = s.players[pid].techs;
  const set = new Set([tech]);
  for (let grew = true; grew;) {
    grew = false;
    for (const id of owned) {
      const t = TECH_BY_ID[id];
      if (!set.has(id) && t && prereqs(t).some((q) => set.has(q))) { set.add(id); grew = true; }
    }
  }
  return owned.filter((id) => set.has(id));
}

/** The Stars a Transmutation Shift of `tech` gives back: what the sub-branch would cost to learn now. */
export const transmuteRefund = (s: GameState, pid: number, tech: string) => subBranch(s, pid, tech).reduce((n, id) => n + techCost(s, pid, id), 0);

export function transmuteCheck(s: GameState, pid: number, tech: string): string | null {
  const t = TECH_BY_ID[tech];
  if (!t || !hasTech(s, pid, tech)) return 'Not learned yet';
  if (t.ring === 'core' && t.tier === 1) return 'The roots of the tree cannot be transmuted';
  if (s.players[pid].stars < transmuteCost(s, pid)) return 'Not enough stars';
  return null;
}

/** Transmutation Shift: pay the lump, forget the sub-branch rooted at `tech`, and get its current price back to spend anew. */
export function transmute(s: GameState, pid: number, tech: string): { refund: number; removed: string[] } | null {
  if (transmuteCheck(s, pid, tech)) return null;
  const p = s.players[pid];
  const cost = transmuteCost(s, pid);
  const removed = subBranch(s, pid, tech);
  const refund = transmuteRefund(s, pid, tech); // priced while still known (Philosophy and the like still count)
  p.stars += refund - cost;
  p.techs = p.techs.filter((id) => !removed.includes(id));
  const sk = (p.skill ??= {});
  sk.respecs = (sk.respecs ?? 0) + 1;
  const names = removed.map((id) => TECH_BY_ID[id].name).join(', ');
  s.log.push({ turn: s.turn, text: `Transmutation Shift: the ${TECH_BY_ID[tech].name} branch is unlearned (${names}; ${cost}★ paid, ${refund}★ back).` });
  emit({ type: 'toast', player: pid, text: `Transmuted ${names}: ${refund}★ back to spend anew.` });
  return { refund, removed };
}

// ---------------------------------------------------------------- cities

/** Population a city of this level needs to reach the next one: it grows steeper from level 3. */
export const popNeeded = (level: number) => level + 1 + Math.max(0, level - POP_STEEP_FROM);
const POP_STEEP_FROM = 1;

/**
 * Grow (or shrink) a city. Mercenary Contracts halve growth (the odd half is banked in `city.data.halfPop`); Grain
 * Supply Lines send a levelling city's surplus along the road to its smallest linked city (`carried`: such a spill).
 */
export function addPop(s: GameState, c: City, n: number, carried = false) {
  const skilled = s.players[c.owner].techs.length > 0;
  if (n > 0 && !carried && skilled && perkSum(s, c.owner, 'halfgrow') > 0) {
    const bank = Number(c.data?.halfPop ?? 0) + n;
    n = Math.floor(bank / 2);
    c.data = { ...(c.data ?? {}), halfPop: bank % 2 };
  }
  const before = c.level;
  c.pop += n;
  while (c.pop >= popNeeded(c.level)) {
    c.pop -= popNeeded(c.level);
    c.level++;
    c.pendingRewards.push(c.level);
    emit({ type: 'levelup', player: c.owner, cityId: c.id, level: c.level });
    const ls = perkSum(s, c.owner, 'levelstar');
    if (ls) { s.players[c.owner].stars += ls; emit({ type: 'stars', player: c.owner, x: c.x, y: c.y, amount: ls }); }
  }
  if (c.level > before) levelGrowOnLevelUp(s, c, c.level - before); // Vineyards (see game/levels)
  const lp = c.level > before && skilled ? perkSum(s, c.owner, 'levelpop') : 0; // Urban Planning (see game/government)
  if (lp > 0) { emit({ type: 'harvest', player: c.owner, x: c.x, y: c.y, pop: lp * (c.level - before) }); addPop(s, c, lp * (c.level - before), true); }
  while (c.pop < 0 && c.level > 1) {
    c.level--;
    c.pop += popNeeded(c.level);
  }
  if (c.pop < 0) c.pop = 0;
  if (c.level > before && c.pop > 0 && !carried && skilled && perkSum(s, c.owner, 'spill') > 0) {
    const to = roadNetwork(s, c).linked.map((id) => cityById(s, id)).filter((k): k is City => !!k && k.owner === c.owner && k.level < c.level)
      .sort((a, b) => a.level - b.level || a.id - b.id)[0];
    if (to) {
      const surplus = c.pop;
      c.pop = 0;
      emit({ type: 'harvest', player: c.owner, x: to.x, y: to.y, pop: surplus });
      emit({ type: 'toast', player: c.owner, text: `Grain Supply Lines: ${c.name}'s surplus +${surplus} rolls on to ${to.name}.` });
      addPop(s, to, surplus, true);
    }
  }
}

export interface RewardOption {
  id: 'workshop' | 'explorer' | 'walls' | 'resources' | 'growth' | 'borders' | 'park' | 'giant';
  name: string;
  desc: string;
}

/** City levels whose reward can be a Colossus. */
export const GIANT_LEVELS = [5, 8];

export function rewardOptions(level: number, tribe?: string): [RewardOption, RewardOption] {
  // Lakota camps move with the herds and keep no permanent buildings: no Workshop, no City Walls (see game/mech/lakota)
  if (tribe === 'lakota' && level === 2) return [
    { id: 'resources', name: 'Trade Robes', desc: 'Receive 5★ right now. A moving camp keeps no workshop.' },
    { id: 'explorer', name: 'Pathfinder', desc: 'A scout roams the land and reveals the map.' },
  ];
  if (tribe === 'lakota' && level === 3) return [
    { id: 'borders', name: 'Wide Pastures', desc: 'Camp territory expands to 5×5. A moving camp builds no walls.' },
    { id: 'resources', name: 'Treasury', desc: 'Receive 5★ right now.' },
  ];
  if (level === 2) return [
    { id: 'workshop', name: 'Workshop', desc: '+1★ income every turn.' },
    { id: 'explorer', name: 'Pathfinder', desc: 'A scout roams the land and reveals the map.' },
  ];
  if (level === 3) return [
    { id: 'walls', name: 'City Walls', desc: 'Huge defence bonus for units in the city.' },
    { id: 'resources', name: 'Treasury', desc: 'Receive 5★ right now.' },
  ];
  if (level === 4) return [
    { id: 'growth', name: 'Harvest Festival', desc: '+3 population.' },
    { id: 'borders', name: 'Border Growth', desc: 'City territory expands to 5×5.' },
  ];
  // a Colossus is a once-in-a-while prize (levels 5 and 8); the levels between offer a garden or gold
  if (GIANT_LEVELS.includes(level)) return [
    { id: 'park', name: 'Grand Garden', desc: '+1★ income and +250 score.' },
    { id: 'giant', name: 'Colossus', desc: 'A 40-HP champion joins your army.' },
  ];
  return [
    { id: 'park', name: 'Grand Garden', desc: '+1★ income and +250 score.' },
    { id: 'resources', name: 'Treasury', desc: 'Receive 8★ right now.' },
  ];
}

export function applyReward(s: GameState, c: City, id: RewardOption['id']) {
  const p = s.players[c.owner];
  c.pendingRewards.shift();
  if (p.tribe === 'lakota') id = id === 'workshop' ? 'resources' : id === 'walls' ? 'borders' : id; // no permanent buildings
  switch (id) {
    case 'workshop': c.workshop = true; break;
    case 'explorer': explore(s, c.owner, c.x, c.y, 18); break;
    case 'walls': c.walls = true; break;
    case 'resources': p.stars += c.level >= 6 ? 8 : 5; break;
    case 'growth': addPop(s, c, 3); break;
    case 'borders': c.borderRadius = 2; claimTerritory(s, c.id); revealAround(s, c.owner); break;
    case 'park': c.parks++; p.bonusScore += 250; break;
    case 'giant': {
      const spot = freeSpotNear(s, c.x, c.y, false);
      if (spot) spawnUnit(s, 'giant', c.owner, spot.x, spot.y, null);
      else p.stars += 5;
      break;
    }
  }
}

function explore(s: GameState, pid: number, x: number, y: number, steps: number) {
  const p = s.players[pid];
  let cx = x;
  let cy = y;
  let seed = s.nextId * 7919 + s.turn * 31;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const before = p.explored.filter(Boolean).length;
  for (let i = 0; i < steps; i++) {
    // Walk preferring unexplored directions.
    const opts = neighbors(s, cx, cy).filter(isLand);
    if (!opts.length) break;
    opts.sort((a, b) => unexploredAround(s, pid, b) - unexploredAround(s, pid, a) + (rnd() - 0.5) * 3);
    cx = opts[0].x;
    cy = opts[0].y;
    for (const t of area(s, cx, cy, 1)) p.explored[t.y * s.size + t.x] = true;
  }
  const found = p.explored.filter(Boolean).length - before;
  emit({ type: 'toast', player: pid, text: found ? `The pathfinder mapped ${found} new tiles.` : 'The pathfinder found nothing new nearby.' });
  revealAround(s, pid); // meet whoever the pathfinder spotted
}
const unexploredAround = (s: GameState, pid: number, t: Tile) => area(s, t.x, t.y, 1).filter((n) => !isExplored(s, pid, n.x, n.y)).length;

function freeSpotNear(s: GameState, x: number, y: number, water: boolean) {
  for (let r = 0; r <= 2; r++)
    for (const t of area(s, x, y, r)) if (!unitAt(s, t.x, t.y) && isWater(t) === water && t.terrain !== 'mountain') return t;
  return undefined;
}

/** Units a city supports: one more than its level, and one more with a Recruiter stationed there (see game/roles). */
export const unitCap = (c: City) => c.level + 1 + (c.data?.recruiter ? RECRUIT_CAP : 0) + (c.data?.barracks ? 1 : 0); // a Barracks houses one more (see game/barracks)

/** Where a city afloat (`city.data.waka`) puts a newly trained unit: a free land tile beside it, else a free water tile. */
export function wakaSpawn(s: GameState, c: City): Tile | undefined {
  const free = neighbors(s, c.x, c.y).filter((t) => t.cityId === null && !unitAt(s, t.x, t.y) && t.terrain !== 'mountain');
  return free.find(isLand) ?? free.find(isWater);
}

/** Train `kind` in a city afloat: on shore beside it, or afloat in a boat carrying it (such voyagers may cross deep ocean). */
function trainAfloat(s: GameState, c: City, kind: UnitKind): boolean {
  const spot = wakaSpawn(s, c);
  if (!spot) return false;
  const u = spawnUnit(s, kind, c.owner, spot.x, spot.y, c.id);
  if (isWater(spot)) {
    u.carrying = kind;
    u.kind = s.players[c.owner].tribe === 'polynesia' ? 'waka' : 'boat';
    u.data = { ...(u.data ?? {}), voyager: true };
  }
  return true;
}

// ---------------------------------------------------------------- tile actions

export interface Action {
  id: string;
  label: string;
  desc: string;
  cost: number;
  enabled: boolean;
  reason?: string;
  icon: string;
  /** The tech this action is waiting for, when that's what is holding it back. */
  needs?: string;
}

const TRAIN_BASE: UnitKind[] = ['warrior', 'rider', 'archer', 'defender', 'swordsman', 'catapult', 'knight'];

export function trainableKinds(s: GameState, pid: number): UnitKind[] {
  const tribe = s.players[pid].tribe;
  return TRAIN_BASE.map((k) => unitFor(tribe, k));
}

/** Actions that would add a city: barred in the One City Challenge. */
const foundsCity = (id: string, t: Tile) => (id === 'capture' && t.village) || id === 'mech:waka' || id === 'mech:found' || id.startsWith('role:outpost:');

/** The tile menu for `pid`: the ordinary actions plus the empire's own, minus anything an empire mechanic blocks. */
export function tileActions(s: GameState, pid: number, t: Tile): Action[] {
  const base = baseTileActions(s, pid, t);
  heroDiscount(s, pid, base); // Suleiman's Imperial Largesse (see game/heroes)
  roleDiscount(s, pid, t, base); // a stationed Recruiter (see game/roles)
  govDiscount(s, pid, t, base); // a Marshal (see game/governors)
  specialNote(s, pid, base); // an empire whose speciality is built straight at level 2 (see game/levels)
  let acts = [...base, ...levelActions(s, pid, t), ...hookActions(s, pid, t), ...wildActions(s, pid, t), ...wonderActions(s, pid, t), ...tradeActions(s, pid, t), ...roleActions(s, pid, t), ...auxActions(s, pid, t), ...govActions(s, pid, t), ...festivalActions(s, pid, t), ...freeActions(s, pid, t), ...barracksActions(s, pid, t), ...homesteadActions(s, pid, t), ...frontierActions(s, pid, t), ...forgeActions(s, pid, t)]; // envoys to a Free City (see game/citystates)
  // a mercenary camp, an outlaw camp or a World Wonder stands on its tile: nothing can be built there but a road (see game/wild, game/clans, game/wonders)
  if (campAt(s, t.x, t.y) || clanCampAt(s, t.x, t.y) || wonderOn(s, t)) acts = acts.filter((a) => !['temple', 'shrine', 'market', 'farm', 'mine', 'lumber', 'harvest', 'port', 'clear', 'irrigate', 'drain', 'luxury'].includes(a.id) && !a.id.startsWith('level:'));
  // nor may an empire's own works reshape a wonder's tile (a unit standing there keeps its own actions)
  if (wonderOn(s, t) && unitAt(s, t.x, t.y)?.owner !== pid) acts = acts.filter((a) => !a.id.startsWith('mech:'));
  acts = naturalFilter(s, pid, t, acts); // a Natural Wonder is never built on, harvested or settled (see game/naturals)
  const beast = unitAt(s, t.x, t.y);
  if (s.mode === 'onecity') for (const a of acts) if (a.enabled && foundsCity(a.id, t)) { a.enabled = false; a.reason = 'One City Challenge: no new cities'; }
  for (const a of acts) {
    const why = hookBlock(s, pid, a.id, t) ?? (beast && isBeast(s, beast) && a.id.startsWith('mech:') ? 'A Great Beast cannot be tamed' : undefined) ?? (a.id === 'clear' && perkSum(s, pid, 'canopy') > 0 ? 'Sacred Canopy: the forest may not be cut' : undefined);
    if (why && a.enabled) { a.enabled = false; a.reason = why; }
  }
  return acts;
}

/** The ordinary tile menu, before empire mechanics, wonders, trade and role units add to it (a Master Builder reads it). */
export const plainTileActions = (s: GameState, pid: number, t: Tile): Action[] => baseTileActions(s, pid, t);

function baseTileActions(s: GameState, pid: number, t: Tile): Action[] {
  const p = s.players[pid];
  const acts: Action[] = [];
  const mine = tileOwnerPlayer(s, t) === pid;
  const city = cityById(s, t.owner);
  const add = (id: string, label: string, desc: string, baseCost: number, tech: string | null, icon: string, extra?: string) => {
    const hasT = hasTech(s, pid, tech);
    // historical strengths and weaknesses can make building cheaper or dearer
    const cat = id === 'road' ? 'road' : id === 'temple' || id === 'shrine' ? 'temple' : ['farm', 'mine', 'lumber', 'port', 'market'].includes(id) ? 'build' : null;
    const adj = cat ? perkSum(s, pid, 'cost', (pk) => pk.of === cat || (cat !== 'road' && pk.of === 'build')) : 0;
    const cost = baseCost > 0 ? Math.max(1, baseCost - adj) : baseCost;
    acts.push({
      id, label, desc, cost, icon,
      enabled: hasT && p.stars >= cost && !extra,
      reason: !hasT ? `Needs ${TECH_BY_ID[tech!].name}` : extra ?? (p.stars < cost ? 'Not enough stars' : undefined),
      needs: hasT ? undefined : tech!,
    });
  };

  const u = unitAt(s, t.x, t.y);
  if (u && u.owner === pid) {
    // a city afloat (the Maori Great Waka) can only be taken from the water, by a ship or boat standing on it
    const afloat = t.cityId !== null && !!cityById(s, t.cityId)?.data?.waka;
    // a treaty partner's city can't be taken (see game/diplomacy)
    if ((t.village || (t.cityId !== null && hostile(s, pid, cityById(s, t.cityId)!.owner))) && !isTrader(u) && !isRoleUnit(u) && !isSupport(u) && (def(u).naval === false || (afloat && def(u).naval && def(u).atk > 0))) {
      add('capture', t.village ? 'Claim Village' : 'Capture City', 'Take control of this settlement.', 0, null, 'flag',
        u.moved || u.attacked ? 'Units must start their turn here' : undefined);
    }
    if (u.hp < maxHp(u)) add('recover', 'Recover', `Heal ${mine ? 4 : 2} HP.`, 0, null, 'heal', u.moved || u.attacked ? 'Unit has already acted' : outOfSupply(u) ? 'Out of supply: no healing' : undefined);
    const up = NAVAL_UPGRADE[u.kind];
    if (up && def(u).naval) add(`upgrade:${up}`, `Upgrade to ${UNITS[up].name}`, UNITS[up].blurb, Math.max(1, UNITS[up].cost - levelBoatDiscount(s, t.owner)), UNITS[up].tech, 'ship'); // Timberworks (see game/levels)
    // a land unit in one of your cities trains up to the next unit of its line (see game/army)
    const next = upgradeTarget(s, u);
    if (next && t.cityId !== null && mine) {
      const d = UNITS[next];
      add(`upgrade:${next}`, `Upgrade to ${d.name}`, `${d.blurb} ⚔${d.atk} 🛡${d.def} ❤${d.hp} ➜${d.move}. Keeps its veteran rank and health; uses its turn.${needNote(next)}`, upgradeCost(s, pid, u.kind, next), d.tech, next, upgradeWhy(s, u) ?? needWhy(s, pid, next));
    }
  }

  // a city trains on its own tile, and also on its Barracks yard (see game/barracks)
  const yard = !!city && isBarracks(t) && t.cityId === null && isLand(t); // a yard under water (a Khmer flood) trains nothing
  if (city && city.owner === pid && ((t.cityId !== null && t.cityId === city.id) || yard)) {
    const full = city.units >= unitCap(city);
    const afloat = !yard && !!city.data?.waka; // a Great Waka trains onto a free tile beside it, so a unit on the city tile does not block it
    const room = afloat ? wakaSpawn(s, city) : undefined;
    // a Recruiter or Tax Collector stationed on the city does not block it either: new units step out beside it (see game/roles)
    const posted = !!u && !afloat && !yard && postedCity(s, u) === city;
    const land = yard ? (u ? 'The Barracks yard is occupied' : undefined) : u && !afloat ? (posted ? (!postSpawn(s, city) ? 'No free tile beside the city' : undefined) : 'City tile is occupied') : afloat && !room ? 'No free tile beside the Great Waka' : undefined;
    // a Foundry, Timberworks and some Districts make units trained here cheaper (see game/levels)
    const cost = (k: UnitKind) => { const c = trainCost(s, pid, k); return c > 1 ? Math.max(1, c - levelTrainDiscount(s, city, k)) : c; };
    for (const k of trainableKinds(s, pid)) {
      const d = UNITS[k];
      add(`train:${k}`, d.name, `${d.blurb} ⚔${d.atk} 🛡${d.def} ❤${d.hp} ➜${d.move}${d.range > 1 ? ` ◎${d.range}` : ''}${needNote(k)}`, cost(k), d.tech, k,
        land ?? (full ? `City supports ${unitCap(city)} units` : needWhy(s, pid, k))); // Iron and Horses (see game/goods)
    }
    for (const k of AUX_KINDS) { // every empire's Spearman, Scout and Healer, in its own name (see game/auxiliaries)
      const d = UNITS[k];
      add(`train:${k}`, auxName(p.tribe, k), `${d.name}. ${d.blurb} ${d.atk ? `⚔${d.atk} ` : ''}🛡${d.def} ❤${d.hp} ➜${d.move}`, cost(k), d.tech, k,
        land ?? (full ? `City supports ${unitCap(city)} units` : undefined));
    }
    for (const k of TRADER_KINDS) { // merchants (see game/trade); a Trade Ship is launched onto the water beside the city
      const d = UNITS[k];
      const ship = k === 'tradeship';
      add(`train:${k}`, traderName(p.tribe, k), `${d.name}. ${d.blurb} 🛡${d.def} ❤${d.hp} ➜${d.move}`, cost(k), d.tech, k,
        full ? `City supports ${unitCap(city)} units` : ship ? (!shipSpawn(s, city) ? 'No free water beside the city' : undefined) : land);
    }
    for (const k of roleKindsOf(p.tribe)) { // the empire type's two role units (see game/roles); ships are launched like a Trade Ship
      const d = UNITS[k];
      add(`train:${k}`, roleName(p.tribe, k), `${d.name}. ${d.blurb} ${d.atk ? `⚔${d.atk} ` : ''}🛡${d.def} ❤${d.hp} ➜${d.move}`, cost(k), d.tech, k,
        full ? `City supports ${unitCap(city)} units` : d.naval ? (!shipSpawn(s, city) ? 'No free water beside the city' : undefined) : land);
    }
    return acts;
  }

  // an enemy unit standing on a tile blocks harvesting and building there
  if (u && u.owner !== pid) return acts;

  if (!mine || !city) {
    if (isLand(t) && t.terrain !== 'mountain' && !t.road && !t.village && t.cityId === null && tileOwnerPlayer(s, t) === null && isExplored(s, pid, t.x, t.y))
      add('road', 'Build Road', ROAD_DESC, roadCost(s, pid), 'roads', 'road');
    return acts;
  }

  const tribe = p.tribe;
  // a resource can be developed once: a farm or mine keeps its crop or ore but can't be rebuilt
  if (!t.improvement) switch (t.resource) {
    case 'fruit': add('harvest', 'Harvest Fruit', '+1 population.', 2, 'gathering', 'fruit'); break;
    case 'animal': add('harvest', 'Hunt', `+${tribe === 'zulu' ? 2 : 1} population.${tribe === 'aztec' ? ' Sacred Hunt refunds 1★.' : ''}`, 2, 'hunting', 'animal'); break;
    case 'fish': add('harvest', 'Fish', `+${hasTech(s, pid, 'aquaculture') ? 2 : 1} population.`, 2, 'fishing', 'fish'); break;
    case 'whale': add('harvest', 'Whaling', 'Gain 10★.', 2, 'whaling', 'whale'); break;
    case 'crop': add('farm', 'Build Farm', `+${tribe === 'egypt' ? 3 : 2} population.`, 5, 'farming', 'farm'); break;
    case 'ore': add('mine', 'Build Mine', '+2 population and 1 Iron a turn.', 5, 'mining', 'mine'); break;
    default:
      if (isLuxury(t.resource)) { // a luxury deposit (see game/goods)
        const L = LUXURIES[t.resource];
        const n = luxuriesOf(s, pid)[t.resource] ?? 0;
        const note = !n ? ` (a new luxury: ${LUX_FIRST}★ for each different one, ${LUX_EXTRA}★ for each extra copy)`
          : n + 1 === MONOPOLY_AT ? ` and a ${L.name} Monopoly: every copy pays ${LUX_FIRST}★, trade routes +1★ each`
          : n + 1 > MONOPOLY_AT ? ` (your Monopoly)` : ` (another ${L.name}; ${MONOPOLY_AT} make a Monopoly)`;
        add('luxury', L.works, `+1 population and +${n + 1 >= MONOPOLY_AT ? LUX_FIRST : n ? LUX_EXTRA : LUX_FIRST}★ a turn${note}.`, LUX_COST, L.tech, `lux:${t.resource}`);
      }
  }
  if (!t.improvement && !t.resource) {
    if (t.terrain === 'forest') {
      add('lumber', 'Lumber Hut', `+${1 + clusterBonus(s, t, 'lumber')} population. ${clusterHint('lumber')}.`, 3, 'forestry', 'lumber');
      add('clear', 'Clear Forest', `Turn forest into a field and gain ${1 + perkSum(s, pid, 'clearStar')}★.`, 0, 'forestry', 'axe');
      add('shrine', 'Grove Shrine', `+${1 + clusterBonus(s, t, 'temple')} population, +100 score. ${clusterHint('temple')}.`, 8, 'spiritualism', 'temple');
    }
    if (t.terrain === 'shallow') {
      const gain = 1 + clusterBonus(s, t, 'port');
      const desc = `+${gain} population${p.tribe === 'pirates' ? ' and +1★ income' : ''}. ${clusterHint('port')}. Units can board boats here.`;
      add('port', 'Port', desc, PORT_COST(s, pid), 'fishing', 'port');
    }
    if (t.terrain === 'desert') add('irrigate', 'Irrigate', 'Turn desert into a fertile field. +1 population.', 3, 'farming', 'crop');
    if (t.terrain === 'swamp') add('drain', 'Drain Marsh', 'Turn swamp into a field and gain 1★.', 2, 'forestry', 'axe');
    if (t.terrain === 'mountain') add('shrine', 'Mountain Shrine', `+${1 + clusterBonus(s, t, 'temple')} population, +100 score. ${clusterHint('temple')}.`, 8, 'meditation', 'temple');
    if (t.terrain === 'field' && !t.village && !t.ruin) {
      add('temple', 'Temple', `+${1 + clusterBonus(s, t, 'temple')} population, +100 score. ${clusterHint('temple')}.`, 10, 'masonry', 'temple');
      add('market', 'Market', `+1★ city income each turn${clusterBonus(s, t, 'market') ? `, +${clusterBonus(s, t, 'market')} population` : ''}. ${clusterHint('market')}.`, 8, 'carpentry', 'market');
    }
  }
  if (isLand(t) && t.terrain !== 'mountain' && !t.road) add('road', 'Build Road', ROAD_DESC, roadCost(s, pid), 'roads', 'road');
  return acts;
}

const ROAD_DESC = `Units move twice as fast. Roads joined to a city grow it: ${ROAD_MILESTONES.map((m) => m.roads).join('/')} connected roads give +${ROAD_MILESTONES.map((m) => m.pop).join('/+')} population, linking two of your cities gives +${LINK_POP} each (a city's first ${MAX_LINKS_PAID_POP} links), and each link (up to ${MAX_PAYING_LINKS}) and every ${ROADS_PER_STAR} roads pay +1★ a turn.`;

/**
 * Pays out what a city's road network has earned: one-off population at each milestone of
 * connected roads, and a bigger one-off for each of the player's other cities it is now linked to.
 */
export function payRoadBonuses(s: GameState, pid: number) {
  for (const c of citiesOf(s, pid)) {
    const net = roadNetwork(s, c);
    let pop = 0;
    const notes: string[] = [];
    const stage = c.roadStage ?? 0;
    let reached = stage;
    for (let i = stage; i < ROAD_MILESTONES.length; i++) {
      if (net.roads < ROAD_MILESTONES[i].roads) break;
      pop += ROAD_MILESTONES[i].pop;
      reached = i + 1;
      notes.push(`${ROAD_MILESTONES[i].roads} connected roads`);
    }
    c.roadStage = reached;
    const linked = c.linked ?? (c.linked = []);
    for (const id of net.linked) {
      if (linked.includes(id)) continue;
      linked.push(id);
      if (linked.length > MAX_LINKS_PAID_POP) continue; // only a city's first links grow it
      pop += LINK_POP;
      notes.push(`a road to ${cityById(s, id)?.name ?? 'a city'}`);
    }
    if (pop > 0) {
      addPop(s, c, pop);
      emit({ type: 'harvest', player: pid, x: c.x, y: c.y, pop });
      emit({ type: 'toast', player: pid, text: `${c.name} grows +${pop} from ${notes.join(' and ')}!` });
    }
  }
}

const roadCost = (s: GameState, pid: number) => (s.players[pid].tribe === 'rome' ? 2 : 3);

export function doAction(s: GameState, pid: number, t: Tile, id: string): boolean {
  const act = tileActions(s, pid, t).find((a) => a.id === id);
  if (!act || !act.enabled) return false;
  const p = s.players[pid];
  p.stars -= act.cost;
  if (act.cost > 0 && !/^(mech|wild|hero|free):/.test(id)) heroSpent(s, pid);
  const city = cityById(s, t.owner);
  const u = unitAt(s, t.x, t.y);
  const grow = (n: number, ...tags: string[]) => {
    if (tags.length) n = Math.max(0, n + perkSum(s, pid, 'grow', (pk) => tags.includes(pk.on))); // traits and skill-line perks
    n += ashBonus(s, pid, t); // volcanic ash (see game/wild)
    emit({ type: 'harvest', player: pid, x: t.x, y: t.y, pop: n });
    addPop(s, city!, n);
    return true;
  };

  if (id.startsWith('mech:') || id.startsWith('hero:')) return hookDoAction(s, pid, t, id); // heroes run through the mechanic hooks
  if (id.startsWith('wild:')) return wildDoAction(s, pid, t, id);
  if (id.startsWith('wonder:')) return wonderDoAction(s, pid, t, id);
  if (id.startsWith('trade:')) return tradeDoAction(s, pid, t, id);
  if (id.startsWith('role:')) return roleDoAction(s, pid, t, id);
  if (id.startsWith('aux:')) return auxDoAction(s, pid, t, id);
  if (id.startsWith('level:')) return levelDoAction(s, pid, t, id);
  if (id.startsWith('gov:')) return govDoAction(s, pid, t, id);
  if (id === 'fest') return festivalDo(s, pid, t); // a City Festival (see game/festival)
  if (id.startsWith('barracks')) return barracksDoAction(s, pid, t, id); // (see game/barracks)
  if (id === 'frontier') return frontierDoAction(s, pid, t); // (see game/frontier)
  if (id.startsWith('forge:')) return forgeDoAction(s, pid, id); // the Armoury (see game/forge)
  if (id === 'homestead' || id.startsWith('cultivate:')) return homesteadDoAction(s, pid, t, id); // (see game/homestead)
  if (id.startsWith('free:')) return freeDoAction(s, pid, id); // (see game/citystates)
  if (id.startsWith('train:')) {
    const kind = id.slice(6) as UnitKind;
    spendNeeds(s, pid, kind); // Iron and Horses (see game/goods)
    if (kind === 'tradeship' || isRoleShip(kind)) { const w = shipSpawn(s, city!)!; spawnUnit(s, kind, pid, w.x, w.y, city!.id); return true; }
    if (t.cityId === null) { spawnUnit(s, kind, pid, t.x, t.y, city!.id); return true; } // raised on the city's Barracks yard (see game/barracks)
    if (city?.data?.waka) return trainAfloat(s, city, kind);
    if (u && postedCity(s, u) === city) { const w = postSpawn(s, city!)!; spawnUnit(s, kind, pid, w.x, w.y, city!.id); return true; } // steps out beside a stationed unit
    spawnUnit(s, kind, pid, t.x, t.y, t.cityId);
    return true;
  }
  if (id.startsWith('upgrade:') && u) {
    const hpRatio = u.hp / maxHp(u);
    if (!def(u).naval) s.log.push({ turn: s.turn, text: `${TRIBES[p.tribe].people} ${UNITS[u.kind].name} upgraded to ${UNITS[id.slice(8) as UnitKind].name} in ${city?.name ?? 'a city'}.` });
    if (!def(u).naval) spendNeeds(s, pid, id.slice(8) as UnitKind); // Iron and Horses (see game/goods)
    u.kind = id.slice(8) as UnitKind;
    u.hp = Math.max(1, Math.round(maxHp(u) * hpRatio));
    u.moved = u.attacked = true;
    return true;
  }
  switch (id) {
    case 'capture': return capture(s, u!, t);
    case 'recover': {
      const before = u!.hp;
      u!.hp = Math.min(maxHp(u!), u!.hp + (tileOwnerPlayer(s, t) === pid ? 4 : 2) + (s.players[pid].tribe === 'india' ? 2 : 0)); // Ahimsa
      u!.moved = u!.attacked = true;
      emit({ type: 'heal', unitId: u!.id, x: u!.x, y: u!.y, amount: u!.hp - before });
      return true;
    }
    case 'road': t.road = true; payRoadBonuses(s, pid); return true;
    case 'harvest': {
      const r = t.resource;
      t.resource = null;
      const hs = perkSum(s, pid, 'harvestStar');
      if (hs) { p.stars += hs; emit({ type: 'stars', player: pid, x: t.x, y: t.y, amount: hs }); }
      if (r === 'whale') { p.stars += 10; emit({ type: 'stars', player: pid, x: t.x, y: t.y, amount: 10 }); return true; }
      if (r === 'animal' && p.tribe === 'aztec') p.stars += 1;
      if (r === 'animal' && p.tribe === 'zulu') return grow(2, 'harvest', 'animal'); // Great Hunt
      return grow(r === 'fish' ? (hasTech(s, pid, 'aquaculture') ? 2 : 1) + (p.tribe === 'inuit' ? 1 : 0) : 1, 'harvest', r ?? ''); // Sea Hunters
    }
    // an empire's speciality may be built straight at level 2 (specialStart; see game/levels)
    case 'luxury': {
      t.improvement = 'estate';
      const kind = t.resource as Luxury;
      if (luxuriesOf(s, pid)[kind] === MONOPOLY_AT) emit({ type: 'toast', player: pid, text: `👑 ${LUXURIES[kind].name} Monopoly! Every ${LUXURIES[kind].name} tile now pays ${LUX_FIRST}★, and your trade routes pay +1★ each (up to ${MONOPOLY_ROUTES_MAX}).` });
      return grow(1, 'luxury');
    }
    case 'farm': t.improvement = 'farm'; specialStart(s, pid, t); return grow(p.tribe === 'egypt' ? 3 : 2, 'farm');
    case 'mine': t.improvement = 'mine'; specialStart(s, pid, t); return grow(p.tribe === 'inca' ? 3 : 2, 'mine'); // Terraces
    case 'lumber': { const b = clusterBonus(s, t, 'lumber'); t.improvement = 'lumber'; specialStart(s, pid, t); return grow(1 + b, 'lumber'); }
    case 'clear': { // Clear Cutting pays more for the timber
      const pay = 1 + perkSum(s, pid, 'clearStar');
      t.terrain = 'field'; p.stars += pay; emit({ type: 'stars', player: pid, x: t.x, y: t.y, amount: pay });
      return p.tribe === 'aboriginal' ? grow(1) : true; // Firestick Farming
    }
    case 'irrigate': t.terrain = 'field'; return grow(1);
    case 'drain':
      t.terrain = 'field'; p.stars += 1; emit({ type: 'stars', player: pid, x: t.x, y: t.y, amount: 1 });
      return true;
    case 'port': { const b = clusterBonus(s, t, 'port'); t.improvement = 'port'; specialStart(s, pid, t); return grow(1 + b, 'port'); }
    case 'shrine':
    case 'temple': { const b = clusterBonus(s, t, 'temple'); t.improvement = 'temple'; p.bonusScore += 100; specialStart(s, pid, t); return grow(1 + b, 'temple'); }
    case 'market': { const b = clusterBonus(s, t, 'market'); t.improvement = 'market'; specialStart(s, pid, t); return b || perkSum(s, pid, 'grow', (pk) => pk.on === 'market') ? grow(b, 'market') : (emit({ type: 'harvest', player: pid, x: t.x, y: t.y, pop: 0 }), true); }
  }
  return false;
}

function capture(s: GameState, u: Unit, t: Tile) {
  const pid = u.owner;
  // the capturing unit joins the settlement it takes, freeing its old city's slot (as in Polytopia)
  const joinCity = (c: City) => {
    const old = cityById(s, u.homeCity);
    if (old) old.units = Math.max(0, old.units - 1);
    u.homeCity = c.id;
    c.units++;
  };
  if (t.village) {
    const c = foundCity(s, t.x, t.y, pid, false);
    joinCity(c);
    emit({ type: 'capture', player: pid, cityId: c.id, from: null });
  } else if (t.cityId !== null && s.mode === 'onecity') {
    razeCity(s, u, t); // the One City Challenge: a conquered capital is burned, never kept
  } else if (t.cityId !== null) {
    const c = cityById(s, t.cityId)!;
    const from = c.owner;
    freeFalls(s, c, pid); // a Free City becomes an ordinary city, and its envoys' empires are angered (see game/citystates)
    const origin = cityOrigin(s, c); // the people who first held it (kept through later captures)
    c.data = { ...(c.data ?? {}), origin };
    c.owner = pid;
    c.capital = false;
    c.pendingRewards = [];
    c.units = 0;
    // Units homed in a lost city become unsupported.
    for (const x of s.units) if (x.homeCity === c.id) x.homeCity = null;
    joinCity(c);
    claimTerritory(s, c.id);
    emit({ type: 'capture', player: pid, cityId: c.id, from });
    hookCityCaptured(s, c, from);
    offerCulture(s, pid, c, origin); // Culture Blending: a choice of one of that people's traditions (see game/culture)
    (s.players[from].skill ??= {}).lost = s.turn; // breaks Pax Romana for a while
    checkElimination(s, from, pid);
    if (s.players[pid].tribe === 'persia') { // Royal Tribute
      s.players[pid].stars += 3;
      emit({ type: 'stars', player: pid, x: t.x, y: t.y, amount: 3 });
    }
  }
  u.moved = u.attacked = true;
  // a captured city may already sit on your road network: count what it has as already paid, so taking it
  // is never a windfall, then pay whatever the capture newly connects
  const taken = cityById(s, t.cityId);
  if (taken) {
    const net = roadNetwork(s, taken);
    taken.roadStage = ROAD_MILESTONES.filter((m) => net.roads >= m.roads).length;
    taken.linked = [...net.linked];
  }
  payRoadBonuses(s, pid);
  revealAround(s, pid);
  tradeSweep(s); // routes to a city that changed hands are cut (see game/trade)
  return true;
}

/** Score for razing a rival's city in the One City Challenge. */
export const RAZE_SCORE = 1000;

/** One City Challenge: the conquered city is razed to a ruin-field and its empire (having no other) falls. */
function razeCity(s: GameState, u: Unit, t: Tile) {
  const c = cityById(s, t.cityId)!;
  const from = c.owner;
  const free = isFreeCity(s, c); // a Free City is razed too, for less (see game/citystates)
  if (free) freeFalls(s, c, u.owner);
  s.cities = s.cities.filter((k) => k !== c);
  for (const x of s.tiles) if (x.owner === c.id) x.owner = null;
  t.cityId = null;
  t.improvement = null;
  t.terrain = 'field';
  for (const x of s.units) if (x.homeCity === c.id) x.homeCity = null;
  s.players[u.owner].bonusScore += free ? FREE_RAZE_SCORE : RAZE_SCORE;
  emit({ type: 'toast', player: u.owner, text: `${c.name} is razed! +${free ? FREE_RAZE_SCORE : RAZE_SCORE} score.` });
  if (!free) emit({ type: 'toast', player: from, text: `${c.name}, your only city, has been razed.` });
  checkElimination(s, from, u.owner);
}

export function checkElimination(s: GameState, pid: number, by: number) {
  const p = s.players[pid];
  if (!p.alive || citiesOf(s, pid).length > 0) return;
  p.alive = false;
  s.units = s.units.filter((u) => u.owner !== pid);
  if (s.diplo) { // a fallen empire's treaties and tribute end with it
    s.diplo.pacts = s.diplo.pacts.filter((x) => x.a !== pid && x.b !== pid);
    s.diplo.tribute = s.diplo.tribute.filter((t) => t.from !== pid && t.to !== pid);
    s.diplo.offers = s.diplo.offers.filter((o) => o.from !== pid && o.to !== pid);
  }
  emit({ type: 'eliminated', player: pid, by });
  checkGameOver(s);
}

/** Ends the game when every human is out, one empire is left, or the score-mode turn limit is reached. */
export function checkGameOver(s: GameState) {
  if (s.over) return;
  const alive = livingPlayers(s);
  const humans = s.players.filter((p) => p.human);
  if (humans.length && humans.every((p) => !p.alive)) {
    s.over = true;
    s.winner = bestScorer(s);
  } else if (alive.length === 1) {
    s.over = true;
    s.winner = alive[0].id;
  } else if (alliedVictory(s, alive.map((p) => p.id))) { // Domination: allied survivors win together (see game/diplomacy)
    s.over = true;
    s.winner = bestScorer(s);
    s.diplo!.victors = alive.map((p) => p.id);
  } else if (s.mode === 'perfection' && s.maxTurns > 0 && s.turn >= s.maxTurns) {
    s.over = true;
    s.winner = bestScorer(s);
  }
  if (s.over) emit({ type: 'toast', player: -1, text: 'Game over' });
}

function bestScorer(s: GameState) {
  return livingPlayers(s).sort((a, b) => score(s, b.id) - score(s, a.id))[0]?.id ?? null;
}

// ---------------------------------------------------------------- movement

export interface MoveOption {
  x: number;
  y: number;
  embark?: boolean;
  disembark?: boolean;
  /** A ship that lands but stays a ship (Viking beach landing): `disembark` is set for the AI, but the unit is not swapped. */
  beach?: boolean;
  path?: { x: number; y: number }[]; // tiles walked through, ending at (x, y)
}

function canEmbarkAt(s: GameState, u: Unit, from: Tile, to: Tile) {
  if (to.terrain !== 'shallow' && !(to.improvement === 'port')) return false;
  if (to.improvement === 'port' && tileOwnerPlayer(s, to) === u.owner) return true;
  return s.players[u.owner].tribe === 'polynesia' && isLand(from) && to.terrain === 'shallow';
}

/** Tiles this unit can move to this turn (Dijkstra over movement points). */
export function moveOptions(s: GameState, u: Unit): MoveOption[] {
  if (u.moved) return [];
  const d = def(u);
  const naval = d.naval;
  const pid = u.owner;
  const size = s.size;
  const best = new Float32Array(size * size).fill(-1); // remaining points when arriving
  const parent = new Int32Array(size * size).fill(-1); // where each reachable tile was entered from
  const out = new Map<number, MoveOption>();
  const enemyNear = (x: number, y: number) =>
    s.units.some((e) => e.owner !== pid && dist(e.x, e.y, x, y) === 1 && isExplored(s, pid, e.x, e.y) && hostile(s, pid, e.owner));
  const hasRoad = (t: Tile) => t.road || t.cityId !== null;

  const start = tileAt(s, u.x, u.y)!;
  const highway = !naval && perkSum(s, pid, 'highway') > 0; // Paved Highways: roads ignore terrain
  const range = Math.max(1, d.move + perkUnit(s, u, 'move') + hookStat(s, u, 'move') + seaBonus(s, u)) + (s.players[pid].tribe === 'lakota' && MOUNTED.includes(u.kind) ? 1 : 0) + (s.players[pid].tribe === 'swahili' && d.naval ? 1 : 0) + (naval ? 0 : naturalMove(s, u)); // Horse Nation, Monsoon Traders, Emberbreath Springs (see game/naturals)
  const queue: { t: Tile; left: number }[] = [{ t: start, left: range }];
  best[start.y * size + start.x] = range;
  while (queue.length) {
    queue.sort((a, b) => b.left - a.left);
    const { t: from, left } = queue.shift()!;
    if (left <= 0) continue;
    for (const to of neighbors(s, from.x, from.y)) {
      const i = to.y * size + to.x;
      if (!isExplored(s, pid, to.x, to.y)) continue;
      if (unitAt(s, to.x, to.y)) continue;
      if (isLava(to)) continue; // molten rock (see game/wild)
      if (!mayStep(s, pid, from, to) && !(isTrader(u) && to.cityId === null)) continue; // a treaty partner's borders (see game/diplomacy); merchants may cross them
      let opt: MoveOption = { x: to.x, y: to.y };
      let cost = 1;
      let stop = false;
      if (naval) {
        if (isLand(to)) {
          if (u.kind === 'tradeship' || isRoleShip(u.kind)) continue; // a Trade Ship (see game/trade) and the role ships (see game/roles) carry no one ashore
          if (to.terrain === 'mountain' && !canClimb(s, pid)) continue;
          opt = { ...opt, disembark: true }; // landing ends the move
          stop = true;
        } else if (to.terrain === 'ocean' && u.kind !== 'ship' && u.kind !== 'warship' && u.kind !== 'tradeship' && !isRoleShip(u.kind) && !u.data?.voyager) continue; // voyagers: born on a Great Waka
      } else {
        if (isWater(to)) {
          // amphibious units wade through shallows, but still board a boat at a port
          if (d.skills.includes('amphibious') && to.terrain === 'shallow' && !(to.improvement === 'port' && canEmbarkAt(s, u, from, to))) {
            stop = to.improvement !== 'port';
          } else if (canEmbarkAt(s, u, from, to)) {
            opt = { ...opt, embark: true };
            stop = true;
          } else continue;
        } else {
          if (to.terrain === 'mountain') {
            if (!canClimb(s, pid)) continue;
            stop = true;
          }
          const paved = (hasRoad(from) && hasRoad(to)) || (highway && hasRoad(to));
          if (to.terrain === 'forest' && !d.skills.includes('forestwalk') && !paved) stop = true;
          if (to.terrain === 'swamp' && !d.skills.includes('amphibious') && !paved) stop = true; // bogged down
          if ((hasRoad(from) && hasRoad(to) && isLand(from)) || (highway && hasRoad(to))) cost = 0.5;
        }
      }
      if (enemyNear(to.x, to.y)) stop = true;
      const step = { cost, stop, forbid: false, opt }; // empire mechanics may change a step
      hookMoveStep(s, u, from, to, step);
      if (step.forbid) continue;
      cost = step.cost; stop = step.stop; opt = step.opt;
      if (cost > left) continue;
      const remaining = stop ? 0 : left - cost;
      const fromI = from.y * size + from.x;
      if (remaining <= best[i]) {
        if (!out.has(i)) {
          out.set(i, opt);
          parent[i] = fromI;
        }
        continue;
      }
      best[i] = remaining;
      parent[i] = fromI;
      out.set(i, opt);
      if (remaining > 0) queue.push({ t: to, left: remaining });
    }
  }
  const startI = start.y * size + start.x;
  for (const ex of hookExtraMoves(s, u)) { // jumps (ziplines, portals...) from empire mechanics
    const i = ex.y * size + ex.x;
    if (!out.has(i) && !unitAt(s, ex.x, ex.y) && isExplored(s, pid, ex.x, ex.y) && mayStep(s, pid, null, tileAt(s, ex.x, ex.y)!)) { out.set(i, ex); parent[i] = startI; }
  }
  return [...out.entries()].map(([i, opt]) => {
    const path: { x: number; y: number }[] = [];
    if (opt.path) return opt; // a jump brings its own path
    for (let j = i, guard = 0; j !== startI && j >= 0 && guard < 64; j = parent[j], guard++) path.unshift({ x: j % size, y: Math.floor(j / size) });
    return { ...opt, path };
  });
}

export function moveUnit(s: GameState, u: Unit, x: number, y: number): boolean {
  const opt = moveOptions(s, u).find((o) => o.x === x && o.y === y);
  if (!opt) return false;
  emit({ type: 'move', unitId: u.id, owner: u.owner, path: [{ x: u.x, y: u.y }, ...(opt.path ?? [{ x, y }])], embark: !!opt.embark, disembark: !!opt.disembark && !opt.beach, before: u.kind });
  const from = { x: u.x, y: u.y };
  u.x = x;
  u.y = y;
  u.moved = true;
  if (!def(u).skills.includes('dash')) u.attacked = true;
  const t = tileAt(s, x, y)!;
  if (opt.embark) {
    u.carrying = u.kind;
    u.kind = s.players[u.owner].tribe === 'polynesia' ? 'waka' : 'boat';
    u.attacked = true;
  } else if (opt.disembark && !opt.beach && u.carrying) {
    const hpRatio = u.hp / maxHp(u);
    u.kind = u.carrying;
    u.carrying = null;
    u.hp = Math.max(1, Math.round(maxHp(u) * hpRatio));
    u.attacked = true;
  }
  if (t.ruin) openRuin(s, u, t);
  enterCamp(s, u, t); // an outlaw camp is burned by the unit that walks in (see game/clans)
  revealAround(s, u.owner);
  supplyAfterMove(s, u); // back in supply: the mark comes off (see game/army)
  hookAfterMove(s, u, from, t); // ambushes and other reactions to a finished move
  return true;
}

function openRuin(s: GameState, u: Unit, t: Tile) {
  t.ruin = false;
  scoutRuin(s, u, t); // a Scout finds a little more (see game/auxiliaries)
  const pid = u.owner;
  const p = s.players[pid];
  const roll = (t.seed + s.turn) % 5;
  const techs = researchable(s, pid).filter((t) => !t.fork); // a fork is the player's own choice
  if (roll === 0 && techs.length) {
    const tech = techs[t.seed % techs.length];
    p.techs.push(tech.id);
    emit({ type: 'ruin', player: pid, title: 'Ancient Scrolls', text: `Your scholars decipher the secrets of ${tech.name}!` });
  } else if (roll === 1) {
    const cap = citiesOf(s, pid).sort((a, b) => dist(a.x, a.y, t.x, t.y) - dist(b.x, b.y, t.x, t.y))[0];
    if (cap) addPop(s, cap, 3);
    emit({ type: 'ruin', player: pid, title: 'Lost Tribe', text: `Wanderers join ${cap?.name ?? 'your people'}: +3 population.` });
  } else if (roll === 2) {
    explore(s, pid, t.x, t.y, 20);
    emit({ type: 'ruin', player: pid, title: 'Old Maps', text: 'Faded charts reveal distant lands.' });
  } else if (roll === 3 && isLand(t)) {
    const spot = freeSpotNear(s, t.x, t.y, false);
    if (spot) {
      const nu = spawnUnit(s, unitFor(p.tribe, 'swordsman'), pid, spot.x, spot.y, null);
      nu.veteran = true;
      nu.hp = maxHp(nu);
    }
    emit({ type: 'ruin', player: pid, title: 'Forgotten Champion', text: 'A veteran warrior pledges their sword to you.' });
  } else {
    p.stars += 10;
    emit({ type: 'ruin', player: pid, title: 'Buried Treasure', text: 'You uncover a hoard worth 10★!' });
  }
}

// ---------------------------------------------------------------- combat

/** Defence multiplier for a unit standing on a mountain. */
export const MOUNTAIN_DEFENSE = 2;

export function defenseBonus(s: GameState, u: Unit) {
  const t = tileAt(s, u.x, u.y)!;
  let extra = 0; // terrain perks from the empire's skill line
  {
    const inCity = t.cityId !== null && cityById(s, t.cityId)?.owner === u.owner;
    extra = perkSum(s, u.owner, 'terrain', (p) => (p.on === 'forest' && t.terrain === 'forest') || (p.on === 'mountain' && t.terrain === 'mountain') || (p.on === 'own' && tileOwnerPlayer(s, t) === u.owner) || (p.on === 'city' && inCity) || (p.on === 'capital' && inCity && !!cityById(s, t.cityId)?.capital) || (p.on === 'away' && tileOwnerPlayer(s, t) !== u.owner) || (p.on === 'ice' && t.terrain === 'ice'));
  }
  return Math.max(0.5, (baseDefense(s, u, t) + extra + govDefense(s, u.owner, t)) * trainingDefense(u)); // a Marshal (see game/governors); a unit in training is half as hard to hit (see game/barracks)
}

function baseDefense(s: GameState, u: Unit, t: Tile) {
  const c = cityById(s, t.cityId);
  if (c && c.owner === u.owner && def(u).skills.includes('fortify')) return garrisonBonus(s, c);
  const tribe = s.players[u.owner].tribe;
  if (t.terrain === 'forest' && tribe === 'celts') return 2; // Sacred Groves
  if (t.terrain === 'forest' && hasTech(s, u.owner, 'archery')) return 1.5;
  if (t.terrain === 'mountain') return tribe === 'ethiopia' ? MOUNTAIN_DEFENSE + 0.5 : MOUNTAIN_DEFENSE; // Highland Fortress // high ground: the best cover on the map
  if (isWater(t) && hasTech(s, u.owner, 'aquaculture')) return 1.5;
  if (t.terrain === 'swamp') return 1.5; // cover in the reeds
  return 1;
}

/** A fortify unit's defence multiplier in its own city: ×4 behind walls, else ×1.5; nothing while Sappers have undermined it. */
export const garrisonBonus = (s: GameState, c: City) => (undermined(s, c) ? 1 : c.walls ? 4 : 1.5);

export const unitDef = (s: GameState, u: Unit) => def(u).def
  + (MOUNTED.includes(u.kind) && hasTech(s, u.owner, 'horsemanship') ? 1 : 0)
  + (s.players[u.owner].tribe === 'japan' && tileOwnerPlayer(s, tileAt(s, u.x, u.y)!) === u.owner ? 1 : 0) // Home Ground
  + naturalDefence(s, u); // Mount Halcyra (see game/naturals)

/** How far `u` can strike, with its empire's and skills' bonuses. */
export const attackRange = (s: GameState, u: Unit) => def(u).range + hookStat(s, u, 'range') + perkRange(s, u);

export function attackOptions(s: GameState, u: Unit): Unit[] {
  const d = def(u);
  if (u.attacked || d.atk <= 0) return [];
  const range = attackRange(s, u);
  const targets = s.units.filter((e) => e.owner !== u.owner && dist(e.x, e.y, u.x, u.y) <= range && isExplored(s, u.owner, e.x, e.y) && unitVisibleTo(s, u.owner, e));
  return hookAttackTargets(s, u, targets).filter((e) => hostile(s, u.owner, e.owner)); // never a treaty partner (see game/diplomacy)
}

export function previewCombat(s: GameState, a: Unit, d: Unit) {
  const f = formation(s, a, d); // volley, charge and shield wall (see game/army)
  const edge = uniqueEdge(s, a, d); // unique units' matchup bonuses (see game/uniques)
  const atk = Math.max(0.5, def(a).atk + seaBonus(s, a) + perkUnit(s, a, 'atk') + hookStat(s, a, 'atk') + f.atk + edge.atk);
  const dd = Math.max(0, unitDef(s, d) + perkUnit(s, d, 'def') + hookStat(s, d, 'def') + f.def + edge.def) * braceOf(s, a, d); // a Spearman braced against horse (see game/auxiliaries)
  const aForce = atk * (edge.fury ? 1 : a.hp / maxHp(a));
  const dForce = dd * (d.hp / maxHp(d)) * (edge.pierce ? Math.min(1, defenseBonus(s, d)) : defenseBonus(s, d));
  const total = aForce + dForce || 1;
  const ranged = dist(a.x, a.y, d.x, d.y) > 1;
  let dmg = Math.round((aForce / total) * atk * 4.5);
  let kills = dmg >= d.hp;
  const canRetaliate = !kills && dist(a.x, a.y, d.x, d.y) <= def(d).range + hookStat(s, d, 'range') + perkRange(s, d) && def(d).atk > 0;
  let ret = canRetaliate ? Math.round((dForce / total) * dd * 4.5) : 0;
  const ctx: CombatCtx = { dmg, ret, ranged, kills }; // empire mechanics may change the numbers (crits, traps, ambushes...)
  if (isBeast(s, a)) ctx.tag = `${UNITS[a.kind].name}!`; // a Great Beast's blow is always a big one
  hookCombat(s, a, d, ctx);
  dmg = Math.max(0, Math.round(ctx.dmg));
  kills = dmg >= d.hp;
  ret = kills ? 0 : Math.max(0, Math.round(ctx.ret));
  return { dmg, ret, kills, tag: dmg > 0 ? ctx.tag : undefined, formation: f.notes };
}

export function attack(s: GameState, a: Unit, d: Unit): boolean {
  if (!attackOptions(s, a).includes(d)) return false;
  meet(s, a.owner, d.owner);
  diploFought(s, a.owner, d.owner); // remembered, and the defender's allies are called to arms (see game/diplomacy)
  freeStruck(s, a, d); // a Free City remembers who attacked it, and its suzerain's wars (see game/citystates)
  (s.players[a.owner].skill ??= {}).war = s.turn; // both sides are at war (War Host surges)
  (s.players[d.owner].skill ??= {}).war = s.turn;
  const { dmg, ret, kills, tag } = previewCombat(s, a, d);
  const worth = UNITS[d.carrying ?? d.kind].cost;
  const ranged = dist(a.x, a.y, d.x, d.y) > 1;
  emit({ type: 'attack', unitId: a.id, kind: a.kind, player: a.owner, from: { x: a.x, y: a.y }, to: { x: d.x, y: d.y }, ranged });
  d.hp -= dmg;
  emit({ type: 'damage', unitId: d.id, x: d.x, y: d.y, amount: dmg, crit: tag });
  const pa = s.players[a.owner];
  const spared = kills && !isBeast(s, d) && hookSpare(s, a, d); // a mechanic may take the defender alive instead (never a Great Beast)
  const refund = kills ? perkSum(s, a.owner, 'refund') : 0; // Sacrificial Rites: killed or taken alive, the foe pays back
  if (refund > 0 && worth > 0) {
    const n = Math.max(1, Math.round(worth * refund));
    pa.stars += n;
    emit({ type: 'stars', player: a.owner, x: d.x, y: d.y, amount: n });
  }
  if (spared) d.hp = 1;
  else if (kills) {
    removeUnit(s, d, a);
    emit({ type: 'death', unitId: d.id, x: d.x, y: d.y, owner: d.owner, kind: d.kind });
    pa.kills++;
    const ks = perkSum(s, a.owner, 'kill');
    if (ks) { pa.stars += ks; emit({ type: 'stars', player: a.owner, x: d.x, y: d.y, amount: ks }); }
    if (def(a).skills.includes('plunder')) {
      pa.stars += 2;
      emit({ type: 'stars', player: a.owner, x: d.x, y: d.y, amount: 2 });
    }
    a.veteranKills++;
    if (a.veteranKills >= 3 && !a.veteran && (a.carrying ?? a.kind) !== 'hero') { // heroes level up instead (see game/heroes)
      a.veteran = true;
      a.hp = maxHp(a);
    } else if (pa.tribe === 'vikings' && a.hp < maxHp(a) && !outOfSupply(a)) {
      // Victory Feast
      const before = a.hp;
      a.hp = Math.min(maxHp(a), a.hp + 3);
      emit({ type: 'heal', unitId: a.id, x: a.x, y: a.y, amount: a.hp - before });
    }
    // Melee attackers advance into the tile they cleared.
    const t = tileAt(s, d.x, d.y)!;
    if (def(a).range === 1 && isWater(t) === def(a).naval && (t.terrain !== 'mountain' || canClimb(s, a.owner)) && mayStep(s, a.owner, null, t)) {
      emit({ type: 'move', unitId: a.id, owner: a.owner, path: [{ x: a.x, y: a.y }, { x: d.x, y: d.y }], embark: false, disembark: false });
      a.x = d.x;
      a.y = d.y;
      if (t.ruin) openRuin(s, a, t);
      enterCamp(s, a, t); // (see game/clans)
      revealAround(s, a.owner);
    }
  } else if (ret > 0) {
    emit({ type: 'attack', unitId: d.id, kind: d.kind, player: d.owner, from: { x: d.x, y: d.y }, to: { x: a.x, y: a.y }, ranged });
    a.hp -= ret;
    emit({ type: 'damage', unitId: a.id, x: a.x, y: a.y, amount: ret, counter: true });
    if (a.hp <= 0) {
      removeUnit(s, a, d);
      emit({ type: 'death', unitId: a.id, x: a.x, y: a.y, owner: a.owner, kind: a.kind });
      s.players[d.owner].kills++;
      return true;
    }
  }
  a.attacked = true;
  const skills = def(a).skills;
  if (kills && !spared && skills.includes('persist')) a.attacked = false;
  a.moved = !skills.includes('escape');
  hookAfterAttack(s, a, d, { dmg, ret, killed: kills && !spared, ranged });
  return true;
}

export function removeUnit(s: GameState, u: Unit, killer: Unit | null = null) {
  s.units = s.units.filter((x) => x !== u);
  const c = cityById(s, u.homeCity);
  if (c) c.units = Math.max(0, c.units - 1);
  hookUnitDied(s, u, killer);
  beastSlain(s, u, killer); // a Great Beast pays its bounty (see game/wild)
  raiderSlain(s, u, killer); // and a raider a small one (see game/clans)
}

export const livingPlayers = (s: GameState): Player[] => s.players.filter((p) => p.alive);

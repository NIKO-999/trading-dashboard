import { TECH_BY_ID, TECHS } from '../data/techs';
import { unitFor } from '../data/tribes';
import { NAVAL_UPGRADE, UNITS, type UnitDef } from '../data/units';
import { emit } from './events';
import { clusterBonus, clusterHint, LINK_POP, MAX_LINKS_PAID_POP, MAX_PAYING_LINKS, networkIncome, roadNetwork, ROAD_MILESTONES, ROADS_PER_STAR } from './network';
import { area, dist, isLand, isWater, neighbors, tileAt } from './grid';
import { claimTerritory, foundCity, meet, revealAround, spawnUnit } from './mapgen';
import type { City, GameState, Player, Tile, Unit, UnitKind } from './types';

// ---------------------------------------------------------------- basics

export const hasTech = (s: GameState, pid: number, tech: string | null) => tech === null || s.players[pid].techs.includes(tech);
export const def = (u: Unit): UnitDef => UNITS[u.kind];
/** Full health. A boat carrying a unit has that unit's health, as in Polytopia. */
export const maxHp = (u: Unit) => UNITS[u.carrying ?? u.kind].hp + (u.veteran ? 5 : 0);
export const cityById = (s: GameState, id: number | null) => (id === null ? undefined : s.cities.find((c) => c.id === id));
export const unitAt = (s: GameState, x: number, y: number) => s.units.find((u) => u.x === x && u.y === y);
export const tileOwnerPlayer = (s: GameState, t: Tile) => (t.owner === null ? null : (cityById(s, t.owner)?.owner ?? null));
export const isExplored = (s: GameState, pid: number, x: number, y: number) => s.players[pid].explored[y * s.size + x];
export const citiesOf = (s: GameState, pid: number) => s.cities.filter((c) => c.owner === pid);
const MOUNTED: UnitKind[] = ['rider', 'chariot', 'jaguar', 'knight', 'horsearcher'];

/** What a unit costs this empire to train (Mongols' Steppe Riders pay 1★ less for mounted units). */
export const trainCost = (s: GameState, pid: number, k: UnitKind) => UNITS[k].cost - (s.players[pid].tribe === 'mongols' && MOUNTED.includes(k) ? 1 : 0);

/** Pirates' Sea Raiders bonus: their boats and ships move one tile further and hit harder. */
export const seaBonus = (s: GameState, u: Unit) => (def(u).naval && s.players[u.owner].tribe === 'pirates' ? 1 : 0);
const PORT_COST = (s: GameState, pid: number) => (s.players[pid].tribe === 'pirates' ? 4 : 7);

// ---------------------------------------------------------------- economy

export function cityIncome(s: GameState, c: City) {
  let inc = c.level + (c.capital ? 1 : 0) + (c.workshop ? 1 : 0) + c.parks;
  inc += s.tiles.filter((t) => t.owner === c.id && t.improvement === 'market').length;
  if (s.players[c.owner].tribe === 'pirates') inc += s.tiles.filter((t) => t.owner === c.id && t.improvement === 'port').length;
  if (hasTech(s, c.owner, 'trade')) inc += 1;
  inc += networkIncome(roadNetwork(s, c));
  return inc;
}

export const income = (s: GameState, pid: number) => citiesOf(s, pid).reduce((sum, c) => sum + cityIncome(s, c), 0);

export function score(s: GameState, pid: number) {
  const p = s.players[pid];
  const cities = citiesOf(s, pid);
  const explored = p.explored.filter(Boolean).length;
  const territory = s.tiles.filter((t) => t.owner !== null && cityById(s, t.owner)?.owner === pid).length;
  const levels = cities.reduce((a, c) => a + c.level, 0);
  const techs = p.techs.reduce((a, t) => a + (TECH_BY_ID[t]?.tier ?? 1), 0);
  const army = s.units.filter((u) => u.owner === pid).reduce((a, u) => a + def(u).cost, 0);
  return explored * 5 + territory * 20 + levels * 50 + cities.length * 100 + techs * 100 + army * 5 + p.kills * 20 + p.bonusScore;
}

// ---------------------------------------------------------------- research

export function techCost(s: GameState, pid: number, tech: string) {
  const t = TECH_BY_ID[tech];
  const n = Math.max(1, citiesOf(s, pid).length);
  const base = t.tier * n + 4;
  const cost = hasTech(s, pid, 'philosophy') ? Math.ceil(base * 0.67) : base;
  return s.players[pid].tribe === 'greeks' ? Math.max(1, cost - 1) : cost; // Academy
}

export function researchStatus(s: GameState, pid: number, tech: string): 'owned' | 'available' | 'locked' {
  if (hasTech(s, pid, tech)) return 'owned';
  const t = TECH_BY_ID[tech];
  return t.parent === null || hasTech(s, pid, t.parent) ? 'available' : 'locked';
}

export function research(s: GameState, pid: number, tech: string) {
  const p = s.players[pid];
  const cost = techCost(s, pid, tech);
  if (researchStatus(s, pid, tech) !== 'available' || p.stars < cost) return false;
  p.stars -= cost;
  p.techs.push(tech);
  return true;
}

export const researchable = (s: GameState, pid: number) => TECHS.filter((t) => researchStatus(s, pid, t.id) === 'available');

// ---------------------------------------------------------------- cities

/** Population a city of this level needs to reach the next one: it grows steeper from level 3. */
export const popNeeded = (level: number) => level + 1 + Math.max(0, level - POP_STEEP_FROM);
const POP_STEEP_FROM = 1;

export function addPop(s: GameState, c: City, n: number) {
  c.pop += n;
  while (c.pop >= popNeeded(c.level)) {
    c.pop -= popNeeded(c.level);
    c.level++;
    c.pendingRewards.push(c.level);
    emit({ type: 'levelup', player: c.owner, cityId: c.id, level: c.level });
  }
  while (c.pop < 0 && c.level > 1) {
    c.level--;
    c.pop += popNeeded(c.level);
  }
  if (c.pop < 0) c.pop = 0;
}

export interface RewardOption {
  id: 'workshop' | 'explorer' | 'walls' | 'resources' | 'growth' | 'borders' | 'park' | 'giant';
  name: string;
  desc: string;
}

/** City levels whose reward can be a Colossus. */
export const GIANT_LEVELS = [5, 8];

export function rewardOptions(level: number): [RewardOption, RewardOption] {
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

export const unitCap = (c: City) => c.level + 1;

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

export function tileActions(s: GameState, pid: number, t: Tile): Action[] {
  const p = s.players[pid];
  const acts: Action[] = [];
  const mine = tileOwnerPlayer(s, t) === pid;
  const city = cityById(s, t.owner);
  const add = (id: string, label: string, desc: string, cost: number, tech: string | null, icon: string, extra?: string) => {
    const hasT = hasTech(s, pid, tech);
    acts.push({
      id, label, desc, cost, icon,
      enabled: hasT && p.stars >= cost && !extra,
      reason: !hasT ? `Needs ${TECH_BY_ID[tech!].name}` : extra ?? (p.stars < cost ? 'Not enough stars' : undefined),
      needs: hasT ? undefined : tech!,
    });
  };

  const u = unitAt(s, t.x, t.y);
  if (u && u.owner === pid) {
    if ((t.village || (t.cityId !== null && cityById(s, t.cityId)!.owner !== pid)) && def(u).naval === false) {
      add('capture', t.village ? 'Claim Village' : 'Capture City', 'Take control of this settlement.', 0, null, 'flag',
        u.moved || u.attacked ? 'Units must start their turn here' : undefined);
    }
    if (u.hp < maxHp(u)) add('recover', 'Recover', `Heal ${mine ? 4 : 2} HP.`, 0, null, 'heal', u.moved || u.attacked ? 'Unit has already acted' : undefined);
    const up = NAVAL_UPGRADE[u.kind];
    if (up && def(u).naval) add(`upgrade:${up}`, `Upgrade to ${UNITS[up].name}`, UNITS[up].blurb, UNITS[up].cost, UNITS[up].tech, 'ship');
  }

  if (t.cityId !== null && city && city.owner === pid && t.cityId === city.id) {
    const full = city.units >= unitCap(city);
    for (const k of trainableKinds(s, pid)) {
      const d = UNITS[k];
      add(`train:${k}`, d.name, `${d.blurb} ⚔${d.atk} 🛡${d.def} ❤${d.hp} ➜${d.move}${d.range > 1 ? ` ◎${d.range}` : ''}`, trainCost(s, pid, k), d.tech, k,
        u ? 'City tile is occupied' : full ? `City supports ${unitCap(city)} units` : undefined);
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
    case 'ore': add('mine', 'Build Mine', '+2 population.', 5, 'mining', 'mine'); break;
  }
  if (!t.improvement && !t.resource) {
    if (t.terrain === 'forest') {
      add('lumber', 'Lumber Hut', `+${1 + clusterBonus(s, t, 'lumber')} population. ${clusterHint('lumber')}.`, 3, 'forestry', 'lumber');
      add('clear', 'Clear Forest', 'Turn forest into a field and gain 1★.', 0, 'forestry', 'axe');
      add('shrine', 'Grove Shrine', `+${1 + clusterBonus(s, t, 'temple')} population, +100 score. ${clusterHint('temple')}.`, 8, 'spiritualism', 'temple');
    }
    if (t.terrain === 'shallow') {
      const gain = 1 + clusterBonus(s, t, 'port');
      const desc = `+${gain} population${p.tribe === 'pirates' ? ' and +1★ income' : ''}. ${clusterHint('port')}. Units can board boats here.`;
      add('port', 'Port', desc, PORT_COST(s, pid), 'fishing', 'port');
    }
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
  const city = cityById(s, t.owner);
  const u = unitAt(s, t.x, t.y);
  const grow = (n: number) => {
    emit({ type: 'harvest', player: pid, x: t.x, y: t.y, pop: n });
    addPop(s, city!, n);
    return true;
  };

  if (id.startsWith('train:')) {
    const kind = id.slice(6) as UnitKind;
    spawnUnit(s, kind, pid, t.x, t.y, t.cityId);
    return true;
  }
  if (id.startsWith('upgrade:') && u) {
    const hpRatio = u.hp / maxHp(u);
    u.kind = id.slice(8) as UnitKind;
    u.hp = Math.max(1, Math.round(maxHp(u) * hpRatio));
    u.moved = u.attacked = true;
    return true;
  }
  switch (id) {
    case 'capture': return capture(s, u!, t);
    case 'recover': {
      const before = u!.hp;
      u!.hp = Math.min(maxHp(u!), u!.hp + (tileOwnerPlayer(s, t) === pid ? 4 : 2));
      u!.moved = u!.attacked = true;
      emit({ type: 'heal', unitId: u!.id, x: u!.x, y: u!.y, amount: u!.hp - before });
      return true;
    }
    case 'road': t.road = true; payRoadBonuses(s, pid); return true;
    case 'harvest': {
      const r = t.resource;
      t.resource = null;
      if (r === 'whale') { p.stars += 10; emit({ type: 'stars', player: pid, x: t.x, y: t.y, amount: 10 }); return true; }
      if (r === 'animal' && p.tribe === 'aztec') p.stars += 1;
      if (r === 'animal' && p.tribe === 'zulu') return grow(2); // Great Hunt
      return grow(r === 'fish' ? (hasTech(s, pid, 'aquaculture') ? 2 : 1) + (p.tribe === 'inuit' ? 1 : 0) : 1); // Sea Hunters
    }
    case 'farm': t.improvement = 'farm'; return grow(p.tribe === 'egypt' ? 3 : 2);
    case 'mine': t.improvement = 'mine'; return grow(p.tribe === 'inca' ? 3 : 2); // Terraces
    case 'lumber': { const b = clusterBonus(s, t, 'lumber'); t.improvement = 'lumber'; return grow(1 + b); }
    case 'clear': t.terrain = 'field'; p.stars += 1; emit({ type: 'stars', player: pid, x: t.x, y: t.y, amount: 1 }); return true;
    case 'port': { const b = clusterBonus(s, t, 'port'); t.improvement = 'port'; return grow(1 + b); }
    case 'shrine':
    case 'temple': { const b = clusterBonus(s, t, 'temple'); t.improvement = 'temple'; p.bonusScore += 100; return grow(1 + b); }
    case 'market': { const b = clusterBonus(s, t, 'market'); t.improvement = 'market'; return b ? grow(b) : (emit({ type: 'harvest', player: pid, x: t.x, y: t.y, pop: 0 }), true); }
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
  } else if (t.cityId !== null) {
    const c = cityById(s, t.cityId)!;
    const from = c.owner;
    c.owner = pid;
    c.capital = false;
    c.pendingRewards = [];
    c.units = 0;
    // Units homed in a lost city become unsupported.
    for (const x of s.units) if (x.homeCity === c.id) x.homeCity = null;
    joinCity(c);
    claimTerritory(s, c.id);
    emit({ type: 'capture', player: pid, cityId: c.id, from });
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
  return true;
}

export function checkElimination(s: GameState, pid: number, by: number) {
  const p = s.players[pid];
  if (!p.alive || citiesOf(s, pid).length > 0) return;
  p.alive = false;
  s.units = s.units.filter((u) => u.owner !== pid);
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
    s.units.some((e) => e.owner !== pid && dist(e.x, e.y, x, y) === 1 && isExplored(s, pid, e.x, e.y));
  const hasRoad = (t: Tile) => t.road || t.cityId !== null;

  const start = tileAt(s, u.x, u.y)!;
  const range = d.move + seaBonus(s, u);
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
      let opt: MoveOption = { x: to.x, y: to.y };
      let cost = 1;
      let stop = false;
      if (naval) {
        if (isLand(to)) {
          if (to.terrain === 'mountain' && !hasTech(s, pid, 'climbing')) continue;
          opt = { ...opt, disembark: true }; // landing ends the move
          stop = true;
        } else if (to.terrain === 'ocean' && u.kind !== 'ship' && u.kind !== 'warship') continue;
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
            if (!hasTech(s, pid, 'climbing')) continue;
            stop = true;
          }
          if (to.terrain === 'forest' && !d.skills.includes('forestwalk') && !(hasRoad(from) && hasRoad(to))) stop = true;
          if (hasRoad(from) && hasRoad(to) && isLand(from)) cost = 0.5;
        }
      }
      if (enemyNear(to.x, to.y)) stop = true;
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
  return [...out.entries()].map(([i, opt]) => {
    const path: { x: number; y: number }[] = [];
    for (let j = i, guard = 0; j !== startI && j >= 0 && guard < 64; j = parent[j], guard++) path.unshift({ x: j % size, y: Math.floor(j / size) });
    return { ...opt, path };
  });
}

export function moveUnit(s: GameState, u: Unit, x: number, y: number): boolean {
  const opt = moveOptions(s, u).find((o) => o.x === x && o.y === y);
  if (!opt) return false;
  emit({ type: 'move', unitId: u.id, owner: u.owner, path: [{ x: u.x, y: u.y }, ...(opt.path ?? [{ x, y }])], embark: !!opt.embark, disembark: !!opt.disembark, before: u.kind });
  u.x = x;
  u.y = y;
  u.moved = true;
  if (!def(u).skills.includes('dash')) u.attacked = true;
  const t = tileAt(s, x, y)!;
  if (opt.embark) {
    u.carrying = u.kind;
    u.kind = s.players[u.owner].tribe === 'polynesia' ? 'waka' : 'boat';
    u.attacked = true;
  } else if (opt.disembark && u.carrying) {
    const hpRatio = u.hp / maxHp(u);
    u.kind = u.carrying;
    u.carrying = null;
    u.hp = Math.max(1, Math.round(maxHp(u) * hpRatio));
    u.attacked = true;
  }
  if (t.ruin) openRuin(s, u, t);
  revealAround(s, u.owner);
  return true;
}

function openRuin(s: GameState, u: Unit, t: Tile) {
  t.ruin = false;
  const pid = u.owner;
  const p = s.players[pid];
  const roll = (t.seed + s.turn) % 5;
  const techs = researchable(s, pid);
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
  const c = cityById(s, t.cityId);
  if (c && c.owner === u.owner && def(u).skills.includes('fortify')) return c.walls ? 4 : 1.5;
  const tribe = s.players[u.owner].tribe;
  if (t.terrain === 'forest' && tribe === 'celts') return 2; // Sacred Groves
  if (t.terrain === 'forest' && hasTech(s, u.owner, 'archery')) return 1.5;
  if (t.terrain === 'mountain') return tribe === 'ethiopia' ? MOUNTAIN_DEFENSE + 0.5 : MOUNTAIN_DEFENSE; // Highland Fortress // high ground: the best cover on the map
  if (isWater(t) && hasTech(s, u.owner, 'aquaculture')) return 1.5;
  return 1;
}

const unitDef = (s: GameState, u: Unit) => def(u).def
  + (MOUNTED.includes(u.kind) && hasTech(s, u.owner, 'horsemanship') ? 1 : 0)
  + (s.players[u.owner].tribe === 'japan' && tileOwnerPlayer(s, tileAt(s, u.x, u.y)!) === u.owner ? 1 : 0); // Home Ground

export function attackOptions(s: GameState, u: Unit): Unit[] {
  const d = def(u);
  if (u.attacked || d.atk <= 0) return [];
  return s.units.filter((e) => e.owner !== u.owner && dist(e.x, e.y, u.x, u.y) <= d.range && isExplored(s, u.owner, e.x, e.y));
}

export function previewCombat(s: GameState, a: Unit, d: Unit) {
  const atk = def(a).atk + seaBonus(s, a);
  const dd = unitDef(s, d);
  const aForce = atk * (a.hp / maxHp(a));
  const dForce = dd * (d.hp / maxHp(d)) * defenseBonus(s, d);
  const total = aForce + dForce || 1;
  const dmg = Math.round((aForce / total) * atk * 4.5);
  const kills = dmg >= d.hp;
  const canRetaliate = !kills && dist(a.x, a.y, d.x, d.y) <= def(d).range && def(d).atk > 0;
  const ret = canRetaliate ? Math.round((dForce / total) * dd * 4.5) : 0;
  return { dmg, ret, kills };
}

export function attack(s: GameState, a: Unit, d: Unit): boolean {
  if (!attackOptions(s, a).includes(d)) return false;
  meet(s, a.owner, d.owner);
  const { dmg, ret, kills } = previewCombat(s, a, d);
  const ranged = dist(a.x, a.y, d.x, d.y) > 1;
  emit({ type: 'attack', unitId: a.id, kind: a.kind, player: a.owner, from: { x: a.x, y: a.y }, to: { x: d.x, y: d.y }, ranged });
  d.hp -= dmg;
  emit({ type: 'damage', unitId: d.id, x: d.x, y: d.y, amount: dmg });
  const pa = s.players[a.owner];
  if (kills) {
    removeUnit(s, d);
    emit({ type: 'death', unitId: d.id, x: d.x, y: d.y, owner: d.owner, kind: d.kind });
    pa.kills++;
    if (def(a).skills.includes('plunder')) {
      pa.stars += 2;
      emit({ type: 'stars', player: a.owner, x: d.x, y: d.y, amount: 2 });
    }
    a.veteranKills++;
    if (a.veteranKills >= 3 && !a.veteran) {
      a.veteran = true;
      a.hp = maxHp(a);
    } else if (pa.tribe === 'vikings' && a.hp < maxHp(a)) {
      // Victory Feast
      const before = a.hp;
      a.hp = Math.min(maxHp(a), a.hp + 3);
      emit({ type: 'heal', unitId: a.id, x: a.x, y: a.y, amount: a.hp - before });
    }
    // Melee attackers advance into the tile they cleared.
    const t = tileAt(s, d.x, d.y)!;
    if (def(a).range === 1 && isWater(t) === def(a).naval && (t.terrain !== 'mountain' || hasTech(s, a.owner, 'climbing'))) {
      emit({ type: 'move', unitId: a.id, owner: a.owner, path: [{ x: a.x, y: a.y }, { x: d.x, y: d.y }], embark: false, disembark: false });
      a.x = d.x;
      a.y = d.y;
      if (t.ruin) openRuin(s, a, t);
      revealAround(s, a.owner);
    }
  } else if (ret > 0) {
    emit({ type: 'attack', unitId: d.id, kind: d.kind, player: d.owner, from: { x: d.x, y: d.y }, to: { x: a.x, y: a.y }, ranged });
    a.hp -= ret;
    emit({ type: 'damage', unitId: a.id, x: a.x, y: a.y, amount: ret });
    if (a.hp <= 0) {
      removeUnit(s, a);
      emit({ type: 'death', unitId: a.id, x: a.x, y: a.y, owner: a.owner, kind: a.kind });
      s.players[d.owner].kills++;
      return true;
    }
  }
  a.attacked = true;
  const skills = def(a).skills;
  if (kills && skills.includes('persist')) a.attacked = false;
  a.moved = !skills.includes('escape');
  return true;
}

export function removeUnit(s: GameState, u: Unit) {
  s.units = s.units.filter((x) => x !== u);
  const c = cityById(s, u.homeCity);
  if (c) c.units = Math.max(0, c.units - 1);
}

export const livingPlayers = (s: GameState): Player[] => s.players.filter((p) => p.alive);

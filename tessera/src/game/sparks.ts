// Eurekas: every tech of the shared tree has a small goal in the world. Meet it before you research the tech and the
// tech costs EUREKA_OFF less for good. Goals are read straight off the game state (one pass over the map), so they
// are checked at the start and end of every turn and after each of the player's own actions.
import { TECH_BY_ID } from '../data/techs';
import { emit } from './events';
import { hasTech, income } from './rules';
import { stockOf } from './goods';
import type { GameState, Player } from './types';

/** The share of a tech's cost a Eureka takes off. */
export const EUREKA_OFF = 0.4;

/** What the goals look at: counted once per check. */
interface Seen {
  p: Player;
  explored: number;
  farms: number; ports: number; lumber: number; roads: number;
  forest: number; shallow: boolean; ore: boolean;
  unitIn: Set<string>; // terrains the empire's units stand on
  riders: number; units: number;
  maxLevel: number;
  whaleSeen: boolean; mountainSeen: boolean;
  income: () => number;
}

export interface Eureka { goal: string; met: (v: Seen) => boolean }

export const EUREKAS: Record<string, Eureka> = {
  gathering: { goal: 'Explore 25 tiles', met: (v) => v.explored >= 25 },
  farming: { goal: 'Grow a city to level 2', met: (v) => v.maxLevel >= 2 },
  masonry: { goal: 'Own 2 farms', met: (v) => v.farms >= 2 },
  tactics: { goal: 'Defeat an enemy unit', met: (v) => v.p.kills >= 1 },
  engineering: { goal: 'Grow a city to level 3', met: (v) => v.maxLevel >= 3 },
  hunting: { goal: 'Have a unit in a forest', met: (v) => v.unitIn.has('forest') },
  archery: { goal: 'Field 4 units', met: (v) => v.units >= 4 },
  spiritualism: { goal: 'Own 2 lumber huts', met: (v) => v.lumber >= 2 },
  forestry: { goal: 'Have 4 forest tiles in your borders', met: (v) => v.forest >= 4 },
  carpentry: { goal: 'Earn 10★ a turn', met: (v) => v.income() >= 10 },
  fishing: { goal: 'Have shallow water in your borders', met: (v) => v.shallow },
  sailing: { goal: 'Build a port', met: (v) => v.ports >= 1 },
  navigation: { goal: 'Take a ship onto the open ocean', met: (v) => v.unitIn.has('ocean') },
  whaling: { goal: 'Spot a whale', met: (v) => v.whaleSeen },
  aquaculture: { goal: 'Own 2 ports', met: (v) => v.ports >= 2 },
  riding: { goal: 'Explore 50 tiles', met: (v) => v.explored >= 50 },
  roads: { goal: 'Meet another empire', met: (v) => (v.p.met?.length ?? 0) > 0 },
  trade: { goal: 'Build 4 roads in your borders', met: (v) => v.roads >= 4 },
  horsemanship: { goal: 'Field 2 Riders', met: (v) => v.riders >= 2 },
  chivalry: { goal: 'Stockpile 2 Horses', met: (v) => stockOf(v.p).horses >= 2 },
  climbing: { goal: 'Spot a mountain', met: (v) => v.mountainSeen },
  mining: { goal: 'Have ore in your borders', met: (v) => v.ore },
  smithing: { goal: 'Stockpile 3 Iron', met: (v) => stockOf(v.p).iron >= 3 },
  meditation: { goal: 'Have a unit on a mountain', met: (v) => v.unitIn.has('mountain') },
  philosophy: { goal: 'Know 8 techs', met: (v) => v.p.techs.length >= 8 },
};

export const sparked = (s: GameState, pid: number, tech: string) => !!s.players[pid].sparks?.includes(tech);

function look(s: GameState, pid: number): Seen {
  const p = s.players[pid];
  const mine = new Set(s.cities.filter((c) => c.owner === pid).map((c) => c.id));
  const v: Seen = {
    p, explored: 0, farms: 0, ports: 0, lumber: 0, roads: 0, forest: 0, shallow: false, ore: false,
    unitIn: new Set(), riders: 0, units: 0, maxLevel: 0, whaleSeen: false, mountainSeen: false,
    income: () => income(s, pid),
  };
  for (let i = 0; i < s.tiles.length; i++) {
    const t = s.tiles[i];
    if (p.explored[i]) {
      v.explored++;
      if (t.resource === 'whale') v.whaleSeen = true;
      if (t.terrain === 'mountain') v.mountainSeen = true;
    }
    if (t.owner === null || !mine.has(t.owner)) continue;
    if (t.improvement === 'farm') v.farms++;
    else if (t.improvement === 'port') v.ports++;
    else if (t.improvement === 'lumber') v.lumber++;
    if (t.road) v.roads++;
    if (t.terrain === 'forest') v.forest++;
    if (t.terrain === 'shallow') v.shallow = true;
    if (t.resource === 'ore') v.ore = true;
  }
  for (const u of s.units) {
    if (u.owner !== pid) continue;
    v.units++;
    if (u.kind === 'rider') v.riders++;
    v.unitIn.add(s.tiles[u.y * s.size + u.x].terrain);
  }
  for (const c of s.cities) if (c.owner === pid) v.maxLevel = Math.max(v.maxLevel, c.level);
  return v;
}

/** Awards every Eureka `pid` has earned and not yet had, for techs it doesn't know. Returns the new ones. */
export function checkSparks(s: GameState, pid: number): string[] {
  const p = s.players[pid];
  if (!p || p.neutral || !p.alive) return [];
  const open = Object.keys(EUREKAS).filter((id) => !hasTech(s, pid, id) && !p.sparks?.includes(id));
  if (!open.length) return [];
  const v = look(s, pid);
  const got = open.filter((id) => EUREKAS[id].met(v));
  if (!got.length) return got;
  (p.sparks ??= []).push(...got);
  for (const id of got) emit({ type: 'toast', player: pid, text: `💡 Eureka! ${EUREKAS[id].goal}: ${TECH_BY_ID[id].name} is ${Math.round(EUREKA_OFF * 100)}% cheaper.` });
  return got;
}

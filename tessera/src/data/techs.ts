import type { Cond } from '../game/alignment';
import { describePerk } from '../game/perks';
import type { TribeId } from '../game/types';
import { SKILLS } from './skills';
import { DOCTRINES } from './doctrines';
import { TRIBES, type Category } from './tribes';
import { UNIQUE_TECHS } from './uniqueTechs';

/**
 * The skill tree, three converging rings around the Empire Origin:
 *  - core    the 25 shared techs (the Core Domain), plus the two tier-3 forks (`fork`: one pick per group);
 *  - culture each empire's own 3-tech line (Master Culture), branching off a base tech;
 *  - aether  synergy nodes between two complete branches (`requires`), drawn in the middle ring;
 *  - wild    the outer Alignment ring: Wildcards that surge under a map condition (`cond`);
 *  - doctrine the empire type's own branch (data/doctrines): War, Wealth or the Sea, three tracks of three techs.
 */
export type TechRing = 'core' | 'fork' | 'culture' | 'aether' | 'wild' | 'doctrine';

export interface TechDef {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  parent: string | null;
  unlocks: string; // human description
  angle: number; // radial layout angle in degrees (0 = right, clockwise)
  ring: TechRing;
  tribe?: TribeId; // set on an empire's own skill line: only that empire can research it
  category?: Category; // set on a doctrine: only empires of that type can research it
  track?: string; // a doctrine's track
  requires?: string[]; // Aether Links: all of these must be known
  branches?: string;
  fork?: string; // fork group: learning one node seals the others
  cond?: Cond; // Wildcards: surge condition
  surge?: string; // Wildcards: what the surge adds
  flavor?: string;
}

// Five roots, each with two tier-2 children that each lead to one tier-3 tech.
const T = (id: string, name: string, tier: 1 | 2 | 3, parent: string | null, angle: number, unlocks: string): TechDef =>
  ({ id, name, tier, parent, angle, unlocks, ring: 'core' });

export const TECHS: TechDef[] = [
  T('gathering', 'Gathering', 1, null, 0, 'Harvest fruit (+1 pop).'),
  T('farming', 'Farming', 2, 'gathering', 0, 'Build farms on crops (+2 pop). Plant Vineyards and Incense Groves (luxuries).'),
  T('masonry', 'Masonry', 3, 'farming', 0, 'Build temples; city walls reward.'),
  T('tactics', 'Tactics', 2, 'gathering', 0, 'Train Defenders.'),
  T('engineering', 'Engineering', 3, 'tactics', 0, 'Train Catapults (1 Iron each).'),

  T('hunting', 'Hunting', 1, null, 0, 'Hunt wild animals (+1 pop). Train Spearmen. Set up Ivory Camps (luxury).'),
  T('archery', 'Archery', 2, 'hunting', 0, 'Train Archers. Forest defence bonus.'),
  T('spiritualism', 'Spiritualism', 3, 'archery', 0, 'Grove shrines: +1 pop from forests, free heal.'),
  T('forestry', 'Forestry', 2, 'hunting', 0, 'Lumber huts (+1 pop). Clear forests. Silk Farms and Spice Gardens (luxuries).'),
  T('carpentry', 'Carpentry', 3, 'forestry', 0, 'Build markets: +1★ city income each.'),

  T('fishing', 'Fishing', 1, null, 0, 'Catch fish (+1 pop). Build ports. Pearl Beds (luxury).'),
  T('sailing', 'Sailing', 2, 'fishing', 0, 'Upgrade boats to Galleys; sail open ocean.'),
  T('navigation', 'Navigation', 3, 'sailing', 0, 'Upgrade to Triremes.'),
  T('whaling', 'Whaling', 2, 'fishing', 0, 'Hunt whales (+10★).'),
  T('aquaculture', 'Aquaculture', 3, 'whaling', 0, 'Fish harvests grant +2 pop.'),

  T('riding', 'Riding', 1, null, 0, 'Train Riders.'),
  T('roads', 'Roads', 2, 'riding', 0, 'Build roads: faster travel. Roads joined to cities grow them. Train Lancers.'),
  T('trade', 'Trade', 3, 'roads', 0, 'Cities earn +1★ each turn.'),
  T('horsemanship', 'Horsemanship', 2, 'riding', 0, 'All mounted units +1 defence. Train Mounted Archers. Tame herds into Pastures, which breed Horses.'),
  T('chivalry', 'Chivalry', 3, 'horsemanship', 0, 'Train Knights (2 Horses each).'),

  T('climbing', 'Climbing', 1, null, 0, 'Move onto mountains. Units on a mountain defend at ×2.'),
  T('mining', 'Mining', 2, 'climbing', 0, 'Build mines on ore (+2 pop and 1 Iron a turn).'),
  T('smithing', 'Smithing', 3, 'mining', 0, 'Train Swordsmen (2 Iron each) and Cataphracts (1 Iron, 2 Horses).'),
  T('meditation', 'Meditation', 2, 'climbing', 0, 'Mountain shrines (+1 pop). Train Healers.'),
  T('philosophy', 'Philosophy', 3, 'meditation', 0, 'All future techs cost 33% less.'),
];

// Re-space the tree evenly: 5 roots plus the empire's own line, 60° apart; children ±19°, grandchildren ±21°.
export const UNIQUE_ANGLE = 210;
const ROOT_ANGLES: Record<string, number> = { gathering: -90, climbing: -30, fishing: 30, hunting: 90, riding: 150 };
for (const t of TECHS) if (t.tier === 1) t.angle = ROOT_ANGLES[t.id];
for (const root of TECHS.filter((t) => t.tier === 1)) {
  const kids = TECHS.filter((t) => t.parent === root.id);
  kids.forEach((k, i) => {
    k.angle = root.angle + (i === 0 ? -19 : 19);
    const g = TECHS.find((t) => t.parent === k.id);
    if (g) g.angle = root.angle + (i === 0 ? -21 : 21);
  });
}

// Each empire's own skill line: a chain of three techs growing out of its base tech.
const UNIQUE_DEFS: TechDef[] = UNIQUE_TECHS.map((u) => ({
  id: u.id, name: u.name, tier: u.tier, parent: u.parent, angle: UNIQUE_ANGLE, ring: 'culture', tribe: u.tribe, flavor: u.flavor,
  unlocks: u.perks.map(describePerk).join(' '),
}));

// Forks, Aether Links and Wildcards (data/skills.ts).
export const SKILL_DEFS: TechDef[] = SKILLS.map((k) => ({
  id: k.id, name: k.name, tier: k.tier, parent: k.parent, angle: 0, ring: k.ring, flavor: k.flavor,
  requires: k.requires, branches: k.branches, fork: k.fork, cond: k.cond,
  unlocks: k.perks.map(describePerk).join(' '),
  surge: k.surge?.map(describePerk).join(' '),
}));

// Doctrines (data/doctrines.ts): each empire type's own branch.
export const DOCTRINE_DEFS: TechDef[] = DOCTRINES.map((d) => ({
  id: d.id, name: d.name, tier: d.tier, parent: d.parent, angle: 0, ring: 'doctrine', category: d.category, track: d.track, flavor: d.flavor,
  unlocks: d.perks.map(describePerk).join(' '),
}));

export const TECH_BY_ID: Record<string, TechDef> = Object.fromEntries([...TECHS, ...UNIQUE_DEFS, ...SKILL_DEFS, ...DOCTRINE_DEFS].map((t) => [t.id, t]));

/** Every tech this empire can research: the shared tree, the forks, links and wildcards, plus its own line. */
export const techsFor = (tribe: TribeId): TechDef[] => [...TECHS, ...SKILL_DEFS, ...UNIQUE_DEFS.filter((t) => t.tribe === tribe), ...DOCTRINE_DEFS.filter((t) => t.category === TRIBES[tribe].category)];

/** The other nodes of a fork group (sealed once one of the group is known). */
export const forkRivals = (id: string): string[] => {
  const f = TECH_BY_ID[id]?.fork;
  return f ? SKILL_DEFS.filter((t) => t.fork === f && t.id !== id).map((t) => t.id) : [];
};

/** The techs a node needs before it opens: its parent, or all of an Aether Link's `requires`. */
export const prereqs = (t: TechDef): string[] => (t.requires ? t.requires : t.parent ? [t.parent] : []);

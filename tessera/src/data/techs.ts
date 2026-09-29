export interface TechDef {
  id: string;
  name: string;
  tier: 1 | 2 | 3;
  parent: string | null;
  unlocks: string; // human description
  angle: number; // radial layout angle in degrees (0 = right, clockwise)
}

// Five roots, each with two tier-2 children that each lead to one tier-3 tech.
const T = (id: string, name: string, tier: 1 | 2 | 3, parent: string | null, angle: number, unlocks: string): TechDef =>
  ({ id, name, tier, parent, angle, unlocks });

export const TECHS: TechDef[] = [
  T('gathering', 'Gathering', 1, null, 0, 'Harvest fruit (+1 pop).'),
  T('farming', 'Farming', 2, 'gathering', 0, 'Build farms on crops (+2 pop).'),
  T('masonry', 'Masonry', 3, 'farming', 0, 'Build temples; city walls reward.'),
  T('tactics', 'Tactics', 2, 'gathering', 0, 'Train Defenders.'),
  T('engineering', 'Engineering', 3, 'tactics', 0, 'Train Catapults.'),

  T('hunting', 'Hunting', 1, null, 0, 'Hunt wild animals (+1 pop).'),
  T('archery', 'Archery', 2, 'hunting', 0, 'Train Archers. Forest defence bonus.'),
  T('spiritualism', 'Spiritualism', 3, 'archery', 0, 'Grove shrines: +1 pop from forests, free heal.'),
  T('forestry', 'Forestry', 2, 'hunting', 0, 'Lumber huts (+1 pop). Clear forests.'),
  T('carpentry', 'Carpentry', 3, 'forestry', 0, 'Build markets: +1★ city income each.'),

  T('fishing', 'Fishing', 1, null, 0, 'Catch fish (+1 pop). Build ports.'),
  T('sailing', 'Sailing', 2, 'fishing', 0, 'Upgrade boats to Galleys; sail open ocean.'),
  T('navigation', 'Navigation', 3, 'sailing', 0, 'Upgrade to Triremes.'),
  T('whaling', 'Whaling', 2, 'fishing', 0, 'Hunt whales (+10★).'),
  T('aquaculture', 'Aquaculture', 3, 'whaling', 0, 'Fish harvests grant +2 pop.'),

  T('riding', 'Riding', 1, null, 0, 'Train Riders.'),
  T('roads', 'Roads', 2, 'riding', 0, 'Build roads: faster travel. Roads joined to cities grow them.'),
  T('trade', 'Trade', 3, 'roads', 0, 'Cities earn +1★ each turn.'),
  T('horsemanship', 'Horsemanship', 2, 'riding', 0, 'All mounted units +1 defence.'),
  T('chivalry', 'Chivalry', 3, 'horsemanship', 0, 'Train Knights.'),

  T('climbing', 'Climbing', 1, null, 0, 'Move onto mountains; mountain defence.'),
  T('mining', 'Mining', 2, 'climbing', 0, 'Build mines on ore (+2 pop).'),
  T('smithing', 'Smithing', 3, 'mining', 0, 'Train Swordsmen.'),
  T('meditation', 'Meditation', 2, 'climbing', 0, 'Mountain shrines (+1 pop).'),
  T('philosophy', 'Philosophy', 3, 'meditation', 0, 'All future techs cost 33% less.'),
];

// Re-space the tree evenly: 5 roots at 72° apart, children ±19°, grandchildren ±21°.
const ROOT_ANGLES: Record<string, number> = { gathering: -90, climbing: -18, fishing: 54, hunting: 126, riding: 198 };
for (const t of TECHS) if (t.tier === 1) t.angle = ROOT_ANGLES[t.id];
for (const root of TECHS.filter((t) => t.tier === 1)) {
  const kids = TECHS.filter((t) => t.parent === root.id);
  kids.forEach((k, i) => {
    k.angle = root.angle + (i === 0 ? -19 : 19);
    const g = TECHS.find((t) => t.parent === k.id);
    if (g) g.angle = root.angle + (i === 0 ? -21 : 21);
  });
}

export const TECH_BY_ID: Record<string, TechDef> = Object.fromEntries(TECHS.map((t) => [t.id, t]));

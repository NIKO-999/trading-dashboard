// Doctrines: the outer branch of the skill tree that only one empire type may research (see data/tribes `category`).
// Military empires learn the Doctrine of War, Economy empires the Doctrine of Wealth, Naval empires the Doctrine of the
// Sea. Each doctrine has three tracks of three techs; a track grows out of a shared tech that fits it. What they do is a
// list of perks (game/perks.ts), so the rules and the AI treat them like any other skill.
import type { Perk } from '../game/perks';
import type { Category } from './tribes';

export interface DoctrineNode {
  id: string;
  name: string;
  category: Category;
  track: string;
  tier: 2 | 3 | 4; // research cost grows with the tier (see rules.techCost)
  parent: string;
  flavor: string;
  perks: Perk[];
}

export const DOCTRINE_NAME: Record<Category, string> = { military: 'Doctrine of War', economy: 'Doctrine of Wealth', naval: 'Doctrine of the Sea' };

const D = (category: Category, track: string, rows: [id: string, name: string, flavor: string, perks: Perk[]][], root: string): DoctrineNode[] =>
  rows.map(([id, name, flavor, perks], i) => ({ id: `doctrine:${id}`, name, category, track, tier: (i + 2) as 2 | 3 | 4, parent: i === 0 ? root : `doctrine:${rows[i - 1][0]}`, flavor, perks }));

export const DOCTRINES: DoctrineNode[] = [
  // ------------------------------------------------------------ the Doctrine of War (military empires)
  ...D('military', 'Drill', [
    ['drill', 'Drill Sergeants', 'Shout, march, and march again.', [{ k: 'def', n: 0.5, who: 'melee' }]],
    ['cadres', 'Veteran Cadres', 'Old soldiers teach the new.', [{ k: 'heal', n: 1 }, { k: 'kill', n: 1 }]],
    ['totalwar', 'Total War', 'Every forge and field serves the army.', [{ k: 'atk', n: 0.5 }]],
  ], 'tactics'),
  ...D('military', 'Siegecraft', [
    ['sappers', 'Sappers’ Craft', 'Tunnels, ramps and mantlets.', [{ k: 'cost', of: 'siege', n: 1 }]],
    ['trains', 'Siege Trains', 'Engines that march with the army.', [{ k: 'atk', n: 0.5, who: 'siege' }, { k: 'move', n: 1, who: 'siege' }]],
    ['batteries', 'Grand Batteries', 'Guns massed wheel to wheel.', [{ k: 'range', n: 1, who: 'siege' }]],
  ], 'engineering'),
  ...D('military', 'Cavalry', [
    ['remounts', 'Remount Depots', 'A fresh horse for every rider.', [{ k: 'cost', of: 'mounted', n: 1 }]],
    ['lighthorse', 'Light Horse', 'Scouts and raiders who never stop.', [{ k: 'move', n: 1, who: 'recon' }, { k: 'def', n: 0.5, who: 'mounted' }]],
    ['shock', 'Shock Cavalry', 'Knee to knee, lances down.', [{ k: 'atk', n: 0.5, who: 'mounted' }, { k: 'def', n: 0.5, who: 'mounted' }]],
  ], 'horsemanship'),

  // ------------------------------------------------------------ the Doctrine of Wealth (economy empires)
  ...D('economy', 'Agrarian', [
    ['rotation', 'Crop Rotation', 'Rest the field and it repays you.', [{ k: 'income', per: 'farm', n: 0.5 }]],
    ['granaries', 'Public Granaries', 'Grain stored against the lean years.', [{ k: 'levelpop', n: 1 }]],
    ['breadbasket', 'Breadbasket', 'Your harvests feed the whole world.', [{ k: 'income', per: 'bigcity', n: 1 }]],
  ], 'farming'),
  ...D('economy', 'Commerce', [
    ['guilds', 'Guild Charters', 'Every trade has its hall and its rules.', [{ k: 'income', per: 'market', n: 1 }]],
    ['banking', 'Banking', 'Letters of credit instead of chests of gold.', [{ k: 'route', n: 0.25 }, { k: 'income', per: 'capital', n: 1 }]],
    ['exchange', 'Stock Exchange', 'Shares in every venture under the sun.', [{ k: 'income', per: 'city', n: 1 }]],
  ], 'roads'),
  ...D('economy', 'Learning', [
    ['libraries', 'Libraries', 'Every book copied and kept.', [{ k: 'cost', of: 'tech', n: 1 }]],
    ['universities', 'Universities', 'Scholars from every land.', [{ k: 'levelstar', n: 2 }]],
    ['renaissance', 'Renaissance', 'Art, science and splendour.', [{ k: 'wonderpct', n: 0.25 }, { k: 'cost', of: 'build', n: 1 }]],
  ], 'meditation'),

  // ------------------------------------------------------------ the Doctrine of the Sea (naval empires)
  ...D('naval', 'Fleet', [
    ['shipwrights', 'Shipwrights', 'Keels laid in every harbour.', [{ k: 'cost', of: 'naval', n: 1 }]],
    ['line', 'Ships of the Line', 'Wooden walls, three decks high.', [{ k: 'def', n: 1, who: 'naval' }]],
    ['admiralty', 'Admiralty', 'A navy run like a clock.', [{ k: 'atk', n: 1, who: 'naval' }]],
  ], 'sailing'),
  ...D('naval', 'Fisheries', [
    ['fleets', 'Fishing Fleets', 'Boats out before dawn.', [{ k: 'grow', on: 'fish', n: 1 }]],
    ['saltcod', 'Salt Cod', 'Fish that keeps for a year.', [{ k: 'income', per: 'port', n: 1 }]],
    ['seagranary', 'Sea Granaries', 'The sea feeds the cities.', [{ k: 'levelpop', n: 1 }]],
  ], 'whaling'),
  ...D('naval', 'Exploration', [
    ['charts', 'Charts and Compass', 'Every coast drawn, every star named.', [{ k: 'vision', n: 1 }]],
    ['tradewinds', 'Trade Winds', 'Sails that follow the seasons.', [{ k: 'move', n: 1, who: 'naval' }]],
    ['charters', 'Colonial Charters', 'Companies that trade across the world.', [{ k: 'route', n: 0.5 }]],
  ], 'navigation'),
];

export const DOCTRINE_BY_ID: Record<string, DoctrineNode> = Object.fromEntries(DOCTRINES.map((d) => [d.id, d]));

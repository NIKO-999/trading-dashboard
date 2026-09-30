// The skill-tree nodes beyond the shared techs and each empire's own line (see data/techs.ts for how they are laid out):
//  - Fork nodes (tier 3): two nodes share a `fork`; learning one seals the other for good (unless respecced).
//  - Aether Links: synergy nodes that open once BOTH parent branches are complete (every tech in `requires` known).
//  - Wildcards (the outer "Alignment" ring, tier 4): base perks always, plus `surge` perks while the map condition
//    `cond` holds (see game/alignment.ts).
// What they do is a list of perks (game/perks.ts), so the rules and the AI treat them like any other skill.
import type { Cond } from '../game/alignment';
import type { Perk } from '../game/perks';

export type SkillRing = 'fork' | 'aether' | 'wild';

export interface SkillNode {
  id: string;
  name: string;
  ring: SkillRing;
  tier: 3 | 4;
  parent: string | null;
  requires?: string[]; // Aether Links: every one must be known
  branches?: string; // how the requirement reads ("Sailing → Navigation and Tactics → Engineering")
  fork?: string; // fork group: one pick per group
  cond?: Cond; // Wildcards
  flavor: string;
  perks: Perk[];
  surge?: Perk[];
}

export const SKILLS: SkillNode[] = [
  // ------------------------------------------------------------ forks
  { id: 'fork:clearcut', name: 'Clear Cutting', ring: 'fork', tier: 3, parent: 'forestry', fork: 'forest', flavor: 'The axe feeds the treasury.',
    perks: [{ k: 'clearStar', n: 3 }] },
  { id: 'fork:canopy', name: 'Sacred Canopy', ring: 'fork', tier: 3, parent: 'forestry', fork: 'forest', flavor: 'The old woods are not for cutting.',
    perks: [{ k: 'canopy', n: 1 }] },
  { id: 'fork:caravan', name: 'Caravan Monopoly', ring: 'fork', tier: 3, parent: 'roads', fork: 'market', flavor: 'Every caravan pays the crown twice.',
    perks: [{ k: 'trade', n: 1 }, { k: 'unitcost', n: 1 }] },
  { id: 'fork:mercenary', name: 'Mercenary Contracts', ring: 'fork', tier: 3, parent: 'roads', fork: 'market', flavor: 'Hired swords, fed from the granaries.',
    perks: [{ k: 'unitpct', n: 0.25 }, { k: 'halfgrow', n: 1 }] },

  // ------------------------------------------------------------ aether links
  { id: 'aether:bombard', name: 'Naval Bombardment', ring: 'aether', tier: 3, parent: null, requires: ['navigation', 'engineering'],
    branches: 'Sailing → Navigation and Tactics → Engineering', flavor: 'Siege engines lashed to the decks.',
    perks: [{ k: 'range', n: 1, who: 'naval' }] },
  { id: 'aether:grain', name: 'Grain Supply Lines', ring: 'aether', tier: 3, parent: null, requires: ['trade', 'masonry'],
    branches: 'Roads → Trade and Farming → Masonry', flavor: 'Wagons of grain roll to the hungry towns.',
    perks: [{ k: 'spill', n: 1 }] },
  { id: 'aether:snipers', name: 'Highland Snipers', ring: 'aether', tier: 3, parent: null, requires: ['mining', 'spiritualism'],
    branches: 'Climbing → Mining and Archery → Spiritualism', flavor: 'Bowmen on the crags, eyes like hawks.',
    perks: [{ k: 'range', n: 2, who: 'ranged', on: 'mountain' }, { k: 'fogsight', n: 1 }] },
  { id: 'aether:tidal', name: 'Tidal Granaries', ring: 'aether', tier: 3, parent: null, requires: ['aquaculture', 'farming'],
    branches: 'Whaling → Aquaculture and Gathering → Farming', flavor: 'Salt-marsh fields and fish ponds side by side.',
    perks: [{ k: 'grow', on: 'port', n: 1 }, { k: 'income', per: 'port', n: 1 }] },
  { id: 'aether:cavalry', name: 'Iron Cavalry', ring: 'aether', tier: 3, parent: null, requires: ['chivalry', 'smithing'],
    branches: 'Horsemanship → Chivalry and Mining → Smithing', flavor: 'Mail for rider and horse alike.',
    perks: [{ k: 'atk', n: 0.5, who: 'mounted' }, { k: 'def', n: 0.5, who: 'mounted' }] },

  // ------------------------------------------------------------ wildcards
  { id: 'wild:tide', name: 'Tidecaller', ring: 'wild', tier: 4, parent: 'navigation', cond: 'water', flavor: 'The sea answers those who know it.',
    perks: [{ k: 'income', per: 'port', n: 1 }], surge: [{ k: 'move', n: 1, who: 'naval' }, { k: 'atk', n: 1, who: 'naval' }] },
  { id: 'wild:warhost', name: 'War Host', ring: 'wild', tier: 4, parent: 'chivalry', cond: 'war', flavor: 'Drums that never stop.',
    perks: [{ k: 'kill', n: 1 }], surge: [{ k: 'atk', n: 0.5 }, { k: 'heal', n: 2 }] },
  { id: 'wild:calendar', name: 'Star Calendar', ring: 'wild', tier: 4, parent: 'philosophy', cond: 'era', flavor: 'Read the sky and the age turns for you.',
    perks: [{ k: 'cost', of: 'tech', n: 1 }], surge: [{ k: 'income', per: 'city', n: 2 }] },
  { id: 'wild:omen', name: 'Storm Omens', ring: 'wild', tier: 4, parent: 'aquaculture', cond: 'wild', flavor: 'Seers who thrive on upheaval.',
    perks: [{ k: 'vision', n: 1 }], surge: [{ k: 'def', n: 0.5 }, { k: 'income', per: 'capital', n: 3 }] },
  { id: 'wild:greenwood', name: 'Greenwood Covenant', ring: 'wild', tier: 4, parent: 'spiritualism', cond: 'forest', flavor: 'A pact with the deep forest.',
    perks: [{ k: 'terrain', on: 'forest', n: 0.5 }], surge: [{ k: 'income', per: 'lumber', n: 1 }, { k: 'heal', n: 1 }] },
  { id: 'wild:throne', name: 'Mountain Throne', ring: 'wild', tier: 4, parent: 'smithing', cond: 'highland', flavor: 'Kings who rule from the peaks.',
    perks: [{ k: 'terrain', on: 'mountain', n: 0.5 }], surge: [{ k: 'income', per: 'mine', n: 1 }, { k: 'atk', n: 0.5 }] },
  { id: 'wild:twilight', name: 'Twilight Empire', ring: 'wild', tier: 4, parent: 'trade', cond: 'late', flavor: 'An old empire, rich in its evening.',
    perks: [{ k: 'levelstar', n: 1 }], surge: [{ k: 'income', per: 'city', n: 1 }] },
];

export const SKILL_BY_ID: Record<string, SkillNode> = Object.fromEntries(SKILLS.map((k) => [k.id, k]));

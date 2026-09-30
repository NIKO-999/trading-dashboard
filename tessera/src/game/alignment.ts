// Alignment: the map conditions and eras the outer ring of the skill tree (the "Wildcard" nodes, see data/skills.ts)
// listens to. A Wildcard always gives its base perks; while its condition holds it also SURGES with extra perks.
// Pure reads of the game state (no rules imports), cached per player-turn because perks are asked for constantly.
import type { GameState } from './types';

export type Cond = 'water' | 'war' | 'era' | 'wild' | 'forest' | 'highland' | 'late';

export const WATER_SHARE = 0.5; // the map is "mostly water"
export const FOREST_SHARE = 0.25; // of all land
export const HIGHLAND_SHARE = 0.15; // of all land
export const LATE_TURN = 20;
/** An empire counts as at war for this many turns after it last fought. */
export const WAR_MEMORY = 1;

export const COND_TEXT: Record<Cond, { name: string; when: string }> = {
  water: { name: 'Tides', when: `the map is mostly water (${WATER_SHARE * 100}%+)` },
  war: { name: 'War', when: 'you fought this turn or last' },
  era: { name: 'Maya Era', when: 'a Maya Long Count era is in force' },
  wild: { name: 'Wild Event', when: 'a wild event rages (a Maya era, an Aztec Sun Age, a Khmer flood or Malian hyper-inflation)' },
  forest: { name: 'Greenwood', when: `forest covers ${FOREST_SHARE * 100}%+ of the land` },
  highland: { name: 'Highlands', when: `mountains cover ${HIGHLAND_SHARE * 100}%+ of the land` },
  late: { name: 'Late Age', when: `the game has reached turn ${LATE_TURN}` },
};

interface WorldRead { key: string; water: number; forest: number; mountain: number; wild: boolean }
const cache = new WeakMap<GameState, WorldRead>();

function world(s: GameState): WorldRead {
  const key = `${s.turn}:${s.current}`;
  const hit = cache.get(s);
  if (hit && hit.key === key) return hit;
  let water = 0, land = 0, forest = 0, mountain = 0, flood = false;
  for (const t of s.tiles) {
    if (t.terrain === 'shallow' || t.terrain === 'ocean') water++;
    else { land++; if (t.terrain === 'forest') forest++; else if (t.terrain === 'mountain') mountain++; }
    if (!flood && t.data?.flood) flood = true;
  }
  const maya = (s.mech?.maya as { active?: unknown } | undefined)?.active;
  const sun = s.players.some((p) => p.alive && p.tribe === 'aztec' && Number((p.mech as { sun?: number } | undefined)?.sun ?? 0) > 0);
  const inflation = Object.values((s.mech?.inflation ?? {}) as Record<string, { until: number }>).some((i) => s.turn <= i.until);
  const read = { key, water: water / Math.max(1, s.tiles.length), forest: forest / Math.max(1, land), mountain: mountain / Math.max(1, land), wild: !!maya || sun || flood || inflation };
  cache.set(s, read);
  return read;
}

export const mapShares = (s: GameState) => { const w = world(s); return { water: w.water, forest: w.forest, mountain: w.mountain }; };

/** Does this condition hold for `pid` right now? */
export function condActive(s: GameState, pid: number, c: Cond): boolean {
  switch (c) {
    case 'water': return world(s).water >= WATER_SHARE;
    case 'forest': return world(s).forest >= FOREST_SHARE;
    case 'highland': return world(s).mountain >= HIGHLAND_SHARE;
    case 'war': return s.turn - (s.players[pid].skill?.war ?? -99) <= WAR_MEMORY;
    case 'era': return !!(s.mech?.maya as { active?: unknown } | undefined)?.active;
    case 'wild': return world(s).wild;
    case 'late': return s.turn >= LATE_TURN;
  }
}

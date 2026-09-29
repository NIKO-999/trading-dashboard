// Road networks and adjacency: what connected roads and neighbouring improvements are worth.
import { neighbors, tileAt } from './grid';
import type { City, GameState, Improvement, Tile } from './types';

export interface RoadNetwork {
  roads: number; // road tiles connected to the city
  linked: number[]; // ids of the player's other cities reached by road
}

/** Connected road tiles (counted once each) that reach the city, and the own cities they link. */
export function roadNetwork(s: GameState, c: City): RoadNetwork {
  const seen = new Set<number>([c.y * s.size + c.x]);
  const queue: Tile[] = [tileAt(s, c.x, c.y)!];
  const linked: number[] = [];
  let roads = 0;
  while (queue.length) {
    const cur = queue.pop()!;
    for (const n of neighbors(s, cur.x, cur.y)) {
      const key = n.y * s.size + n.x;
      if (seen.has(key)) continue;
      if (n.cityId !== null) {
        const other = s.cities.find((k) => k.id === n.cityId);
        if (!other || other.owner !== c.owner) continue; // roads never pass through a rival's city
        seen.add(key);
        linked.push(other.id);
        queue.push(n); // a city is a hub: its own roads join the network
      } else if (n.road) {
        seen.add(key);
        roads++;
        queue.push(n);
      }
    }
  }
  return { roads, linked };
}

/** Connected road tiles needed for each one-off population reward, cumulative. */
export const ROAD_MILESTONES: readonly { roads: number; pop: number }[] = [
  { roads: 3, pop: 1 },
  { roads: 6, pop: 1 },
  { roads: 10, pop: 2 },
  { roads: 15, pop: 2 },
];
/** Population both cities gain the first time a road links them. */
export const LINK_POP = 3;
/** Every this many connected road tiles pays +1★ a turn. */
export const ROADS_PER_STAR = 6;

/** Stars per turn a city earns from its road network: one per link plus one per 6 connected tiles. */
export const networkIncome = (n: RoadNetwork) => n.linked.length + Math.floor(n.roads / ROADS_PER_STAR);

const CLUSTER_MAX = 4;
const CLUSTER_NAME: Partial<Record<Improvement, string>> = { lumber: 'Lumber Hut', port: 'Port', temple: 'Temple or Shrine', market: 'Market' };

/** Extra population for building `kind` on `t`: one per neighbouring improvement of the same kind. */
export function clusterBonus(s: GameState, t: Tile, kind: Improvement) {
  const n = neighbors(s, t.x, t.y).filter((x) => x.improvement === kind).length;
  return Math.min(CLUSTER_MAX, n);
}
export const clusterHint = (kind: Improvement) => `+1 more per neighbouring ${CLUSTER_NAME[kind] ?? 'improvement'}`;

/** Harvests worth one population gain one more next to a road, which carries the goods to the city. */
export const roadHarvestBonus = (s: GameState, t: Tile) => (t.road || neighbors(s, t.x, t.y).some((x) => x.road) ? 1 : 0);

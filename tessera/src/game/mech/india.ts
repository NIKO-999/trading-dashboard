// India — Karma & Sacred Beasts. Killing an enemy that attacked one of our units, or that stands inside our borders, is a
// defensive kill: it builds karma and, beside wild animals, wins us a sacred elephant. Killing the unprovoked costs karma;
// a dark karma saps income and strength, a bright one brings alms and resolve.
import { dist, tileAt } from '../grid';
import { spawnUnit } from '../mapgen';
import { tileOwnerPlayer, unitAt } from '../rules';
import type { GameState, Unit } from '../types';
import type { Mechanic } from './types';

export const KARMA_MIN = -6;
export const KARMA_MAX = 12;

export const karmaOf = (s: GameState, pid: number): number => Number(s.players[pid].mech?.karma ?? 0);

function addKarma(s: GameState, pid: number, n: number) {
  const p = s.players[pid];
  p.mech ??= {};
  p.mech.karma = Math.max(KARMA_MIN, Math.min(KARMA_MAX, karmaOf(s, pid) + n));
}

/** Did `u` attack one of `owner`'s units, or does it stand in `owner`'s borders? */
export function isProvoker(s: GameState, owner: number, u: Unit): boolean {
  if (u.data?.aggr === owner) return true;
  const t = tileAt(s, u.x, u.y);
  return !!t && tileOwnerPlayer(s, t) === owner;
}

export const mech: Mechanic = {
  name: 'Karma & Sacred Beasts',
  blurb: 'Defensive kills carry no penalty and turn neutral wildlife into fighting beasts.',

  setup(s, owner) {
    s.players[owner].mech = { ...s.players[owner].mech, karma: 0 };
  },

  afterAttack(s, owner, a, d) {
    if (d.owner === owner && a.owner !== owner) { // whoever strikes us has picked the fight
      a.data ??= {};
      a.data.aggr = owner;
    }
  },

  unitDied(s, owner, u, killer) {
    if (!killer || killer.owner !== owner || u.owner === owner) return;
    if (!isProvoker(s, owner, u)) { addKarma(s, owner, -1); return; }
    addKarma(s, owner, 1);
    // a sacred beast answers: neutral wildlife near the fallen joins us as an elephant
    let best: { x: number; y: number; d: number } | null = null;
    for (const t of s.tiles) {
      if (t.resource !== 'animal' || t.cityId !== null || unitAt(s, t.x, t.y) || (t.x === u.x && t.y === u.y)) continue; // not the victim's tile: the killer may step onto it
      const d = Math.min(dist(t.x, t.y, u.x, u.y), dist(t.x, t.y, killer.x, killer.y));
      if (d <= 2 && (!best || d < best.d)) best = { x: t.x, y: t.y, d };
    }
    if (!best) return;
    const t = tileAt(s, best.x, best.y)!;
    t.resource = null;
    const e = spawnUnit(s, 'elephant', owner, t.x, t.y, null);
    e.data = { sacred: true };
  },

  income(s, owner) {
    const k = karmaOf(s, owner);
    return k >= 8 ? 2 : k >= 3 ? 1 : k <= -3 ? -1 : 0;
  },

  stat(s, owner, u, stat) {
    if (stat !== 'atk' || u.owner !== owner) return 0;
    const k = karmaOf(s, owner);
    return k >= 5 ? 0.5 : k <= -3 ? -0.5 : 0;
  },
};

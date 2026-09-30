import { emit } from '../events';
import { dist, isWater, tileAt } from '../grid';
import { citiesOf, def, previewCombat, removeUnit } from '../rules';
import type { Action } from '../rules';
import type { GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';
import { hostile } from '../diplomacy';
import { rocketSplash } from '../uniques';

// Singijeon Rocket Fleets: Korean siege engines fire high-arc salvos. They can hit any tile in range, even fogged or
// unexplored ones, and every hit sets the tile ablaze for a few turns. Fire is kept in tile.data.fire (turns left);
// it burns whoever stands there at the start of Korea's turns.

export const FIRE_TURNS = 3;
export const FIRE_DAMAGE = 2;
const SIEGE = ['hwacha', 'catapult'];

const isSiege = (u: Unit) => SIEGE.includes(u.kind);
export const fireLeft = (t: Tile) => (typeof t.data?.fire === 'number' ? (t.data.fire as number) : 0);

function ignite(t: Tile, owner: number) {
  if (isWater(t)) return;
  t.data = { ...t.data, fire: FIRE_TURNS, fireBy: owner };
}

const rangeOf = (u: Unit) => def(u).range;

/** Ready siege engines of `owner` that can reach the tile. */
function shooters(s: GameState, owner: number, x: number, y: number): Unit[] {
  return s.units
    .filter((u) => u.owner === owner && isSiege(u) && !u.attacked && def(u).atk > 0 && dist(u.x, u.y, x, y) <= rangeOf(u) && dist(u.x, u.y, x, y) >= 1)
    .sort((a, b) => b.hp - a.hp || a.id - b.id);
}

/** Fire one salvo from `a` at tile `t`: damages whatever is there (seen or not) and sets the ground alight. */
function salvo(s: GameState, a: Unit, t: Tile) {
  const d = s.units.find((u) => u.x === t.x && u.y === t.y);
  emit({ type: 'attack', unitId: a.id, kind: a.kind, player: a.owner, from: { x: a.x, y: a.y }, to: { x: t.x, y: t.y }, ranged: true });
  if (d && hostile(s, a.owner, d.owner)) {
    const { dmg } = previewCombat(s, a, d);
    d.hp -= dmg;
    emit({ type: 'damage', unitId: d.id, x: d.x, y: d.y, amount: dmg });
    if (d.hp <= 0) {
      removeUnit(s, d, a);
      emit({ type: 'death', unitId: d.id, x: d.x, y: d.y, owner: d.owner, kind: d.kind });
      s.players[a.owner].kills++;
      a.veteranKills++;
    }
    if (a.kind === 'hwacha') rocketSplash(s, a, t.x, t.y, dmg); // the hwacha's volley spreads (see game/uniques)
  }
  ignite(t, a.owner);
  a.attacked = true;
  a.moved = true;
}

/** Hall of Worthies: scholar-officials send every Korean city this many stars a turn. */
export const WORTHIES = 1;

export const mech: Mechanic = {
  name: 'Singijeon Rocket Fleets',
  income(s, owner) { return WORTHIES * citiesOf(s, owner).length; },
  blurb: 'Rocket salvos arc over fog and cover, setting targets ablaze for turns.',

  turnStart(s, owner) {
    for (const t of s.tiles) {
      const f = fireLeft(t);
      if (!f) continue;
      const u = s.units.find((e) => e.x === t.x && e.y === t.y);
      if (u && u.hp > 1) {
        const n = Math.min(FIRE_DAMAGE, u.hp - 1); // fire wounds but never finishes a unit
        u.hp -= n;
        emit({ type: 'damage', unitId: u.id, x: u.x, y: u.y, amount: n });
      }
      const { fire: _f, fireBy: _b, ...rest } = t.data ?? {};
      t.data = f > 1 ? { ...rest, fire: f - 1, fireBy: owner } : rest;
    }
  },

  // Rockets ignore fog and line of sight: every enemy in range is a target.
  attackTargets(s, owner, u, targets) {
    if (!isSiege(u) || u.attacked) return targets;
    const extra = s.units.filter((e) => e.owner !== owner && !targets.includes(e) && dist(e.x, e.y, u.x, u.y) <= rangeOf(u));
    return [...targets, ...extra];
  },

  afterAttack(s, owner, a, d, info) {
    if (a.owner !== owner || !isSiege(a) || !info.ranged) return;
    const t = tileAt(s, d.x, d.y);
    if (t) ignite(t, owner);
  },

  actions(s, owner, t): Action[] {
    const mine = s.units.find((u) => u.x === t.x && u.y === t.y);
    if (mine && mine.owner === owner) return [];
    const from = shooters(s, owner, t.x, t.y);
    if (!from.length) return [];
    return [{
      id: 'mech:salvo', label: 'Rocket salvo',
      desc: `Fire over fog and cover at this tile: hits anything there and sets it ablaze for ${FIRE_TURNS} turns (${FIRE_DAMAGE} damage a turn).`,
      cost: 0, enabled: true, icon: 'axe',
    }];
  },

  doAction(s, owner, t, id) {
    if (id !== 'mech:salvo') return false;
    const a = shooters(s, owner, t.x, t.y)[0];
    if (!a) return false;
    salvo(s, a, t);
    return true;
  },

  ai(s, owner) {
    let best: { a: Unit; t: Tile; score: number } | null = null;
    for (const a of s.units) {
      if (a.owner !== owner || !isSiege(a) || a.attacked) continue;
      const r = rangeOf(a);
      for (let y = a.y - r; y <= a.y + r; y++) {
        for (let x = a.x - r; x <= a.x + r; x++) {
          const t = tileAt(s, x, y);
          if (!t || (x === a.x && y === a.y)) continue;
          const d = s.units.find((e) => e.x === x && e.y === y);
          if (!d || !hostile(s, owner, d.owner)) continue;
          // never scorch a tile that touches one of our own units standing in a fire we lit
          const own = s.units.some((e) => e.owner === owner && dist(e.x, e.y, x, y) === 0);
          if (own) continue;
          const dmg = previewCombat(s, a, d).dmg;
          const score = Math.min(dmg, d.hp) + (dmg >= d.hp ? 5 : 0) + (fireLeft(t) ? 0 : 1);
          if (!best || score > best.score) best = { a, t, score };
        }
      }
    }
    if (!best) return false;
    salvo(s, best.a, best.t);
    return true;
  },
};

import { UNITS } from '../data/units';
import { dist, isLand, neighbors, tileAt } from './grid';
import {
  applyReward, attack, attackOptions, citiesOf, def, doAction, isExplored, maxHp, moveOptions, moveUnit,
  previewCombat, research, researchable, rewardOptions, techCost, tileActions, tileOwnerPlayer, trainableKinds, unitCap, unitAt,
} from './rules';
import type { GameState, Tile, Unit } from './types';

// Per-turn scratch memory so one unit isn't reconsidered forever.
let memoKey = '';
const done = new Set<number>();
let economyDone = false;

const HARVEST_IDS = ['harvest', 'farm', 'mine', 'lumber', 'port', 'shrine', 'temple', 'market'];

/** Performs one AI action for the current player. Returns false once the AI has nothing left to do. */
export function aiStep(s: GameState): boolean {
  const pid = s.current;
  const key = `${s.turn}:${pid}`;
  if (key !== memoKey) {
    memoKey = key;
    done.clear();
    economyDone = false;
  }
  const p = s.players[pid];

  // 1. Level-up rewards.
  for (const c of citiesOf(s, pid)) {
    if (!c.pendingRewards.length) continue;
    const [a, b] = rewardOptions(c.pendingRewards[0]);
    const threatened = s.units.some((u) => u.owner !== pid && dist(u.x, u.y, c.x, c.y) <= 2);
    const pick = a.id === 'walls' ? (threatened ? a : b) : a.id === 'growth' ? b : a.id === 'park' ? b : a;
    applyReward(s, c, pick.id);
    return true;
  }

  // 2. Economy first (so newly trained units wait a turn anyway).
  if (!economyDone) {
    if (economyStep(s, pid)) return true;
    economyDone = true;
  }

  // 3. Units.
  for (const u of s.units.filter((x) => x.owner === pid && !done.has(x.id))) {
    if (unitStep(s, u)) return true;
    done.add(u.id);
  }

  // Leftover stars: one more economic pass after units moved.
  if (p.stars > 0 && economyStep(s, pid)) return true;
  return false;
}

/** Runs the whole AI turn synchronously (used by simulations). */
export function aiTurn(s: GameState, maxSteps = 500) {
  for (let i = 0; i < maxSteps && aiStep(s); i++);
}

function economyStep(s: GameState, pid: number): boolean {
  const p = s.players[pid];
  const cities = citiesOf(s, pid);
  const myUnits = s.units.filter((u) => u.owner === pid);
  const enemiesNear = s.units.some((u) => u.owner !== pid && isExplored(s, pid, u.x, u.y) && cities.some((c) => dist(c.x, c.y, u.x, u.y) <= 3));
  const abroad = targetsOnlyOverseas(s, pid);

  // Harvest: cheapest population gain first.
  const harvests: { t: Tile; id: string; cost: number; value: number }[] = [];
  for (const t of s.tiles) {
    if (tileOwnerPlayer(s, t) !== pid) continue;
    for (const a of tileActions(s, pid, t)) {
      if (!a.enabled || !HARVEST_IDS.includes(a.id)) continue;
      if (a.id === 'market' && p.stars < 14) continue;
      if ((a.id === 'temple' || a.id === 'shrine') && p.stars < 16) continue;
      // one port is enough for most empires; pirates' ports also pay income, so they build more
      if (a.id === 'port' && p.tribe !== 'pirates' && s.tiles.some((x) => x.improvement === 'port' && tileOwnerPlayer(s, x) === pid)) continue;
      const value = a.id === 'harvest' ? (t.resource === 'whale' ? 5 : 3) : a.id === 'farm' || a.id === 'mine' ? 4 : a.id === 'port' && abroad ? 6 : 2;
      harvests.push({ t, id: a.id, cost: a.cost, value: value / Math.max(1, a.cost) });
    }
  }
  harvests.sort((a, b) => b.value - a.value);

  const armyWanted = cities.length * 2 + (enemiesNear ? 2 : 0) + (s.turn > 6 ? 2 : 0);
  const wantArmy = myUnits.length < armyWanted;

  // Train when the army is thin (or under threat), before spending on growth.
  if (wantArmy && (enemiesNear || myUnits.length < cities.length + 1 || harvests.length === 0)) {
    if (trainBest(s, pid, enemiesNear)) return true;
  }
  if (harvests.length) {
    const h = harvests[0];
    if (doAction(s, pid, h.t, h.id)) return true;
  }

  // Research: prefer techs that unlock resources we own, then military.
  const options = researchable(s, pid);
  if (options.length) {
    const owned = s.tiles.filter((t) => tileOwnerPlayer(s, t) === pid);
    const want = (id: string) => {
      const has = (pred: (t: Tile) => boolean) => owned.some(pred);
      switch (id) {
        case 'gathering': return has((t) => t.resource === 'fruit') ? 10 : 2;
        case 'hunting': return has((t) => t.resource === 'animal') ? 10 : 2;
        case 'fishing': return has((t) => t.resource === 'fish') || abroad ? 9 : 3;
        case 'farming': return has((t) => t.resource === 'crop') ? 8 : 1;
        case 'mining': return has((t) => t.resource === 'ore') ? 8 : 1;
        case 'whaling': return has((t) => t.resource === 'whale') ? 7 : 1;
        case 'climbing': return has((t) => t.terrain === 'mountain') ? 5 : 2;
        case 'forestry': return has((t) => t.terrain === 'forest') ? 4 : 1;
        case 'riding': return 6;
        case 'archery': return 5;
        case 'roads': return 1;
        case 'tactics': return 3;
        case 'smithing': return 5;
        case 'chivalry': return 4;
        case 'sailing': return abroad ? 6 : 3;
        case 'philosophy': return 3;
        default: return 2;
      }
    };
    const pick = options.map((t) => ({ t, w: want(t.id) / techCost(s, pid, t.id) })).sort((a, b) => b.w - a.w)[0];
    const reserve = wantArmy ? 2 : 0;
    if (p.stars - reserve >= techCost(s, pid, pick.t.id) && want(pick.t.id) >= 3) {
      if (research(s, pid, pick.t.id)) return true;
    }
  }

  if (wantArmy && trainBest(s, pid, enemiesNear)) return true;
  // Rich and idle: grab expensive upgrades.
  if (p.stars >= 15 && options.length) {
    const cheapest = options.sort((a, b) => techCost(s, pid, a.id) - techCost(s, pid, b.id))[0];
    if (research(s, pid, cheapest.id)) return true;
  }
  return false;
}

function trainBest(s: GameState, pid: number, defensive: boolean): boolean {
  const p = s.players[pid];
  for (const c of citiesOf(s, pid).sort((a, b) => b.level - a.level)) {
    if (c.units >= unitCap(c) || unitAt(s, c.x, c.y)) continue;
    const t = tileAt(s, c.x, c.y)!;
    const kinds = trainableKinds(s, pid)
      .filter((k) => UNITS[k].cost <= p.stars && (UNITS[k].tech === null || p.techs.includes(UNITS[k].tech!)))
      .sort((a, b) => {
        const va = defensive ? UNITS[a].def * 2 + UNITS[a].atk : UNITS[a].atk * 2 + UNITS[a].move;
        const vb = defensive ? UNITS[b].def * 2 + UNITS[b].atk : UNITS[b].atk * 2 + UNITS[b].move;
        return vb - va;
      });
    for (const k of kinds) if (doAction(s, pid, t, `train:${k}`)) return true;
  }
  return false;
}

function unitStep(s: GameState, u: Unit): boolean {
  const pid = u.owner;
  const t = tileAt(s, u.x, u.y)!;

  // Capture what we're standing on.
  const cap = tileActions(s, pid, t).find((a) => a.id === 'capture' && a.enabled);
  if (cap) return doAction(s, pid, t, 'capture');

  // Attack the juiciest target in range.
  const targets = attackOptions(s, u)
    .map((e) => ({ e, ...previewCombat(s, u, e) }))
    .filter((o) => o.kills || o.dmg >= o.ret || u.hp - o.ret > maxHp(u) * 0.5)
    .sort((a, b) => (b.kills ? 100 : 0) + b.dmg - b.ret - ((a.kills ? 100 : 0) + a.dmg - a.ret));
  if (targets.length) return attack(s, u, targets[0].e);

  if (u.moved) return false;

  // Stay put on a settlement we can capture next turn.
  if (t.village || (t.cityId !== null && s.cities.find((c) => c.id === t.cityId)!.owner !== pid)) return false;

  // Hurt and idle: recover.
  if (u.hp < maxHp(u) * 0.45 && !u.attacked) {
    const rec = tileActions(s, pid, t).find((a) => a.id === 'recover' && a.enabled);
    if (rec) return doAction(s, pid, t, 'recover');
  }

  const naval = def(u).naval;
  // boats: upgrade to cross open ocean when there are stars to spare
  if (naval && !u.moved) {
    const up = tileActions(s, pid, t).find((a) => a.id.startsWith('upgrade:') && a.enabled);
    if (up && s.players[pid].stars >= up.cost + 5) return doAction(s, pid, t, up.id);
  }

  const opts = moveOptions(s, u);
  if (!opts.length) return false;
  const goals = findGoals(s, u);
  if (!goals.length) return false;
  const mass = landmasses(s);
  const massAt = (x: number, y: number) => mass[y * s.size + x];
  let aims = goals;
  let allowEmbark = goals.some((g) => g.water);
  let allowLanding = (_x: number, _y: number) => true;

  if (!naval) {
    const home = massAt(u.x, u.y);
    const local = goals.filter((g) => massAt(g.x, g.y) === home);
    const overseas = goals.filter((g) => g.w > 0 && massAt(g.x, g.y) !== home);
    if (local.some((g) => g.w > 0) || !overseas.length) {
      aims = local.length ? local : goals;
    } else {
      // everything worth doing is across the water: board a boat, or walk to where one can be boarded
      const boarding = opts.filter((o) => o.embark);
      if (boarding.length) {
        const near = (o: { x: number; y: number }) => Math.min(...overseas.map((g) => dist(o.x, o.y, g.x, g.y) - g.w));
        const o = boarding.sort((a, b) => near(a) - near(b))[0];
        return moveUnit(s, u, o.x, o.y);
      }
      const spots = boardingSpots(s, u, home);
      aims = spots.length ? spots : local.length ? local : goals;
      allowEmbark = spots.length > 0;
    }
  } else {
    // at sea: only go ashore on land that holds something worth taking
    const worth = new Set(goals.filter((g) => g.w > 0).map((g) => massAt(g.x, g.y)).filter((m) => m >= 0));
    if (worth.size) allowLanding = (x, y) => worth.has(massAt(x, y));
  }

  const score = (x: number, y: number) => {
    let best = Infinity;
    for (const g of aims) best = Math.min(best, dist(x, y, g.x, g.y) - g.w);
    return best;
  };
  const here = score(u.x, u.y);
  const ranked = opts
    .filter((o) => !(o.embark && !allowEmbark) && !(o.disembark && !allowLanding(o.x, o.y)))
    .map((o) => ({ o, v: score(o.x, o.y) + (o.embark ? 0.5 : 0) }))
    .sort((a, b) => a.v - b.v);
  if (!ranked.length || ranked[0].v >= here) {
    // Guard duty: fortify cities that have enemies nearby, otherwise stay.
    return false;
  }
  return moveUnit(s, u, ranked[0].o.x, ranked[0].o.y);
}

/** Connected land regions (an id per tile, -1 for water), computed once per game. */
const massCache = new WeakMap<GameState, Int32Array>();
function landmasses(s: GameState): Int32Array {
  const hit = massCache.get(s);
  if (hit) return hit;
  const ids = new Int32Array(s.size * s.size).fill(-1);
  let next = 0;
  for (const t of s.tiles) {
    if (!isLand(t) || ids[t.y * s.size + t.x] >= 0) continue;
    ids[t.y * s.size + t.x] = next;
    const stack = [t];
    while (stack.length) {
      const c = stack.pop()!;
      for (const n of neighbors(s, c.x, c.y)) {
        const i = n.y * s.size + n.x;
        if (isLand(n) && ids[i] < 0) {
          ids[i] = next;
          stack.push(n);
        }
      }
    }
    next++;
  }
  massCache.set(s, ids);
  return ids;
}

/** True when every settlement this empire can see to take is on land its cities aren't on. */
function targetsOnlyOverseas(s: GameState, pid: number): boolean {
  const mass = landmasses(s);
  const mine = new Set(citiesOf(s, pid).map((c) => mass[c.y * s.size + c.x]));
  let home = false, away = false;
  for (const t of s.tiles) {
    if (!isExplored(s, pid, t.x, t.y)) continue;
    const target = t.village || (t.cityId !== null && s.cities.find((c) => c.id === t.cityId)!.owner !== pid);
    if (!target) continue;
    if (mine.has(mass[t.y * s.size + t.x])) home = true;
    else away = true;
  }
  return away && !home;
}

/** Where a land unit on this landmass can board a boat: its empire's ports, or (Polynesians) any coast. */
function boardingSpots(s: GameState, u: Unit, home: number): Goal[] {
  const pid = u.owner;
  const mass = landmasses(s);
  const polynesian = s.players[pid].tribe === 'polynesia';
  const out: Goal[] = [];
  for (const t of s.tiles) {
    if (unitAt(s, t.x, t.y)) continue;
    const port = t.improvement === 'port' && tileOwnerPlayer(s, t) === pid;
    const coast = polynesian && t.terrain === 'shallow';
    if (!port && !coast) continue;
    if (neighbors(s, t.x, t.y).some((n) => mass[n.y * s.size + n.x] === home)) out.push({ x: t.x, y: t.y, w: 0 });
  }
  return out;
}

interface Goal { x: number; y: number; w: number; water?: boolean }

function findGoals(s: GameState, u: Unit): Goal[] {
  const pid = u.owner;
  const goals: Goal[] = [];
  const weak = u.hp < maxHp(u) * 0.4;
  const myCities = citiesOf(s, pid);
  if (weak) return myCities.map((c) => ({ x: c.x, y: c.y, w: 2 }));

  for (const t of s.tiles) {
    if (!isExplored(s, pid, t.x, t.y)) continue;
    if (t.village && !unitAt(s, t.x, t.y)) goals.push({ x: t.x, y: t.y, w: 3 });
    if (t.ruin) goals.push({ x: t.x, y: t.y, w: 2 });
    if (t.cityId !== null) {
      const c = s.cities.find((k) => k.id === t.cityId)!;
      if (c.owner !== pid) goals.push({ x: t.x, y: t.y, w: s.turn > 5 ? 3 : 1 });
    }
  }
  for (const e of s.units) {
    if (e.owner === pid || !isExplored(s, pid, e.x, e.y)) continue;
    const nearMine = myCities.some((c) => dist(c.x, c.y, e.x, e.y) <= 3);
    goals.push({ x: e.x, y: e.y, w: nearMine ? 4 : 1 });
  }
  // Exploration frontier: explored tiles bordering the unknown.
  if (goals.length < 3) {
    for (const t of s.tiles) {
      if (!isExplored(s, pid, t.x, t.y)) continue;
      const frontier = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
        const n = tileAt(s, t.x + dx, t.y + dy);
        return n && !isExplored(s, pid, n.x, n.y);
      });
      if (frontier) goals.push({ x: t.x, y: t.y, w: 0 });
    }
  }
  for (const g of goals) {
    const gt = tileAt(s, g.x, g.y)!;
    g.water = gt.terrain === 'shallow' || gt.terrain === 'ocean';
  }
  return goals;
}

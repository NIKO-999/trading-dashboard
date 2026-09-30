import { emit } from '../events';
import { dist, isLand, neighbors, tileAt } from '../grid';
import { addPop, attackOptions, cityById, citiesOf, def, maxHp, moveOptions, moveUnit, tileOwnerPlayer, isExplored, unitAt } from '../rules';
import type { Action } from '../rules';
import type { City, GameState, Improvement, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// Great Heathen Fleet & Raid Havens (core) + Pillaging & Raiding (economy).
//
// Core: a Viking ship may sail straight onto a shore tile and stay a ship (the `beach` move flag, see rules.moveUnit);
// there are no rivers, so any land tile touching water is the "river" analogue. From the shore a Viking ship
// can found a Danelaw haven on an enemy-owned coastal tile (`mech:danelaw`, needs a Viking ship within 1 tile).
// Each Viking turn a haven siphons 20% of the host city's gold. Cities hold no gold of their own, so "the host
// city's gold" is simplified to its owner's stars divided evenly among their cities (capped per haven).
// A haven lapses if no Viking unit is within 2 tiles, or when the tile changes hands; any other unit that steps on
// it drives the raiders out.
// Economy: Vikings cannot build market/temple/shrine (block hook). Instead a Viking unit standing on an enemy tile
// improvement can raze it (`mech:raze`): 3x the improvement's star cost at once, the host city loses 1 population
// and a Viking city gains 1 (the captive). A unit razes once per turn.

export const DANELAW_COST = 4;
export const SIPHON_RATE = 0.2;
export const SIPHON_CAP = 6;
export const HAVEN_REACH = 2;
export const RAZE_MULT = 3;
const BLOCKED = ['market', 'temple', 'shrine'];
/** Star cost of building each improvement (the base for the raze payout). */
export const IMPROVEMENT_COST: Partial<Record<Improvement, number>> = { farm: 5, mine: 5, lumber: 3, port: 7, temple: 10, market: 8 };
export const razeValue = (i: Improvement) => RAZE_MULT * (IMPROVEMENT_COST[i] ?? 5);

const isShip = (u: Unit) => def(u).naval;
const coastal = (s: GameState, t: Tile) => neighbors(s, t.x, t.y).some((n) => !isLand(n));
export const havenOwner = (t: Tile) => (typeof t.data?.danelaw === 'number' ? (t.data.danelaw as number) : null);

function stats(s: GameState, owner: number) {
  const m = (s.players[owner].mech ??= {});
  m.plunder = (m.plunder as number) ?? 0;
  m.captives = (m.captives as number) ?? 0;
  return m as { plunder: number; captives: number };
}
export const plunderOf = (s: GameState, owner: number) => (s.players[owner].mech?.plunder as number) ?? 0;
export const captivesOf = (s: GameState, owner: number) => (s.players[owner].mech?.captives as number) ?? 0;

export const havens = (s: GameState, owner: number) => s.tiles.filter((t) => havenOwner(t) === owner);

function clearHaven(t: Tile) {
  const { danelaw: _d, ...rest } = t.data ?? {};
  t.data = rest;
}

const gain = (s: GameState, pid: number, x: number, y: number, n: number) => {
  s.players[pid].stars += n;
  emit({ type: 'stars', player: pid, x, y, amount: n });
};

/** Can `owner` found a haven here? null: not offered at all; a string: offered but blocked; undefined: fine. */
function havenCheck(s: GameState, owner: number, t: Tile, needStars = true): string | undefined | null {
  const host = tileOwnerPlayer(s, t);
  if (host === null || host === owner || !isLand(t) || t.cityId !== null) return null;
  if (!coastal(s, t)) return null;
  if (!s.units.some((u) => u.owner === owner && isShip(u) && dist(u.x, u.y, t.x, t.y) <= 1)) return null;
  if (havenOwner(t) === owner) return null;
  if (s.tiles.some((o) => o.owner === t.owner && havenOwner(o) === owner)) return 'This city already hosts a haven';
  const at = unitAt(s, t.x, t.y);
  if (at && at.owner !== owner) return 'An enemy holds the shore';
  if (needStars && s.players[owner].stars < DANELAW_COST) return 'Not enough stars';
  return undefined;
}

function razeCheck(s: GameState, owner: number, t: Tile): Unit | null {
  const u = unitAt(s, t.x, t.y);
  if (!u || u.owner !== owner || !t.improvement) return null;
  const host = tileOwnerPlayer(s, t);
  if (host === null || host === owner || t.cityId !== null) return null;
  if (u.data?.raze === s.turn) return null;
  return u;
}

function nearestHome(s: GameState, owner: number, u: Unit): City | undefined {
  const own = cityById(s, u.homeCity);
  if (own && own.owner === owner) return own;
  return citiesOf(s, owner).sort((a, b) => dist(a.x, a.y, u.x, u.y) - dist(b.x, b.y, u.x, u.y))[0];
}

function raze(s: GameState, owner: number, u: Unit, t: Tile) {
  const value = razeValue(t.improvement!);
  const host = cityById(s, t.owner);
  t.improvement = null;
  gain(s, owner, t.x, t.y, value);
  const st = stats(s, owner);
  st.plunder += value;
  if (host) {
    addPop(s, host, -1); // the raided city loses a citizen...
    const home = nearestHome(s, owner, u);
    if (home) {
      addPop(s, home, 1); // ...who is carried off as a captive
      emit({ type: 'harvest', player: owner, x: home.x, y: home.y, pop: 1 });
      st.captives++;
    }
  }
  u.data = { ...u.data, raze: s.turn };
  u.attacked = true;
  emit({ type: 'toast', player: owner, text: `Raiders raze the works: +${value}★ and a captive.` });
}

function unload(u: Unit) {
  if (!u.carrying) return;
  const ratio = u.hp / maxHp(u);
  u.kind = u.carrying;
  u.carrying = null;
  u.hp = Math.max(1, Math.round(maxHp(u) * ratio));
  if (u.moved) u.attacked = true; // stepping ashore after sailing costs the strike
}

export const mech: Mechanic = {
  name: 'Great Heathen Fleet & Raid Havens',
  blurb: "Longships beach on any shore and found Danelaw havens that siphon 20% of a city's gold; Vikings build no markets or temples, but raze enemy improvements for 3x their cost and carry off a citizen.",

  setup(s, owner) { stats(s, owner); },

  moveStep(s, owner, u, from, to, ctx) {
    if (u.owner !== owner || !isShip(u) || !isLand(to) || to.terrain === 'mountain') return;
    if (isLand(from) && !coastal(s, to)) return; // walking inland: the crew disembarks as usual
    ctx.opt = { ...ctx.opt, disembark: true, beach: true };
    ctx.stop = true;
  },

  afterMove(_s, owner, u, _from, to) {
    // any other unit stepping onto a haven drives the raiders out
    if (havenOwner(to) === owner && u.owner !== owner) clearHaven(to);
  },

  turnStart(s, owner) {
    const paid = new Set<number>();
    for (const t of havens(s, owner)) {
      const host = tileOwnerPlayer(s, t);
      const near = s.units.some((u) => u.owner === owner && dist(u.x, u.y, t.x, t.y) <= HAVEN_REACH);
      if (host === null || host === owner || !near || t.owner === null) { clearHaven(t); continue; }
      if (paid.has(t.owner)) continue;
      paid.add(t.owner);
      const victim = s.players[host];
      const share = victim.stars / Math.max(1, citiesOf(s, host).length);
      const take = Math.min(victim.stars, SIPHON_CAP, Math.max(share > 0 ? 1 : 0, Math.round(share * SIPHON_RATE)));
      if (take <= 0) continue;
      victim.stars -= take;
      gain(s, owner, t.x, t.y, take);
      stats(s, owner).plunder += take;
    }
  },

  block(_s, owner, pid, actionId) {
    if (pid === owner && BLOCKED.includes(actionId)) return 'Vikings raid instead of trading';
    return undefined;
  },

  actions(s, owner, t): Action[] {
    const out: Action[] = [];
    const hb = havenCheck(s, owner, t);
    if (hb !== null) {
      out.push({
        id: 'mech:danelaw', label: 'Danelaw Haven',
        desc: `Claim this shore for the fleet: each turn it siphons ${SIPHON_RATE * 100}% of the host city's gold (max ${SIPHON_CAP}★) while a Viking unit is within ${HAVEN_REACH} tiles.`,
        cost: DANELAW_COST, enabled: hb === undefined, reason: hb, icon: 'flag',
      });
    }
    if (razeCheck(s, owner, t)) {
      out.push({
        id: 'mech:raze', label: 'Raze',
        desc: `Burn this ${t.improvement}: +${razeValue(t.improvement!)}★ now, the host city loses 1 population and one of your cities gains it.`,
        cost: 0, enabled: true, icon: 'axe',
      });
    }
    const u = unitAt(s, t.x, t.y);
    if (u && u.owner === owner && isShip(u) && u.carrying && isLand(t)) {
      out.push({ id: 'mech:unload', label: 'Go Ashore', desc: 'The crew leave the longship and fight on foot.', cost: 0, enabled: true, icon: 'flag' });
    }
    return out;
  },

  doAction(s, owner, t, id) {
    if (id === 'mech:danelaw') {
      if (havenCheck(s, owner, t, false) !== undefined) return false; // the star cost is already paid by the core
      t.data = { ...t.data, danelaw: owner };
      return true;
    }
    if (id === 'mech:raze') {
      const u = razeCheck(s, owner, t);
      if (!u) return false;
      raze(s, owner, u, t);
      return true;
    }
    if (id === 'mech:unload') {
      const u = unitAt(s, t.x, t.y);
      if (!u || u.owner !== owner || !isShip(u) || !u.carrying || !isLand(t)) return false;
      unload(u);
      return true;
    }
    return false;
  },

  ai(s, owner) {
    const p = s.players[owner];
    // 1. raze what a raider stands on
    for (const u of s.units) {
      if (u.owner !== owner) continue;
      const t = tileAt(s, u.x, u.y)!;
      if (razeCheck(s, owner, t)) { raze(s, owner, u, t); return true; }
    }
    // 2. found a haven next to a ship
    if (p.stars >= DANELAW_COST + 2) {
      for (const t of s.tiles) {
        if (havenCheck(s, owner, t) === undefined) { t.data = { ...t.data, danelaw: owner }; p.stars -= DANELAW_COST; return true; }
      }
    }
    // 3. beached crews step ashore at the start of the turn
    for (const u of s.units) {
      if (u.owner !== owner || !isShip(u) || !u.carrying || u.moved) continue;
      const t = tileAt(s, u.x, u.y)!;
      if (isLand(t) && !attackOptions(s, u).length) { unload(u); return true; }
    }
    // 4. a healthy landed raider goes for the most valuable enemy improvement in reach
    for (const u of s.units) {
      if (u.owner !== owner || isShip(u) || u.moved || u.hp < maxHp(u) * 0.6 || def(u).atk <= 0) continue;
      if (attackOptions(s, u).length) continue;
      const here = tileAt(s, u.x, u.y)!;
      if (here.village || (here.cityId !== null && cityById(s, here.cityId)!.owner !== owner)) continue;
      // a village waiting to be claimed nearby comes first: the ordinary moves take the raider there
      if (s.tiles.some((t) => t.village && dist(u.x, u.y, t.x, t.y) <= 5 && isExplored(s, owner, t.x, t.y))) continue;
      let best: { x: number; y: number; v: number } | null = null;
      for (const o of moveOptions(s, u)) {
        const t = tileAt(s, o.x, o.y)!;
        const host = tileOwnerPlayer(s, t);
        if (!t.improvement || host === null || host === owner || t.cityId !== null) continue;
        const v = razeValue(t.improvement) - dist(u.x, u.y, o.x, o.y);
        if (!best || v > best.v) best = { x: o.x, y: o.y, v };
      }
      if (best && moveUnit(s, u, best.x, best.y)) return true;
    }
    return false;
  },
};

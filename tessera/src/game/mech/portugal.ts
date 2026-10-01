import { emit } from '../events';
import { area, dist, isLand, isWater, neighbors, tileAt } from '../grid';
import { meet } from '../mapgen';
import { attackOptions, citiesOf, moveOptions, moveUnit, tileOwnerPlayer, unitAt } from '../rules';
import type { Action } from '../rules';
import type { GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// Feitorias (empire bonus) + Padrões of Discovery (signature).
//
// Feitorias: every port inside Portugal's borders pays PORT_PAY★ a turn.
//
// Padrões (improvement `padrao`, the `mech:padrao` tile action on a land tile, PADRAO_COST★): a Portuguese boat, ship,
// warship or voyager standing next to an unclaimed land tile may raise a stone pillar on it. The tile must be unowned,
// hold no city, village, ruin or improvement, not be a mountain or ice, and lie at least PADRAO_MIN_DIST tiles from every
// Portuguese city. Portugal may keep at most one padrão per city it holds. Each padrão pays PADRAO_PAY★ a turn, and as a
// feitoria it pays FEITORIA_PAY★ more when it stands on the coast (next to water). Portugal sees PADRAO_SIGHT tiles round
// each padrão, re-revealed at the start of every Portuguese turn. If another empire's borders swallow the tile, the
// pillar is pulled down at the start of Portugal's next turn.

export const PORT_PAY = 1;
export const PADRAO_COST = 3;
export const PADRAO_PAY = 1;
export const FEITORIA_PAY = 1;
export const PADRAO_MIN_DIST = 5;
export const PADRAO_SIGHT = 2;
/** The AI keeps this many stars back after paying for a padrão. */
const AI_RESERVE = 2;
/** How far (tiles) an AI boat will look for a far coast to claim. */
const AI_SEARCH = 8;

const SAILORS = new Set(['boat', 'ship', 'warship', 'voyager']);
const isPortugal = (s: GameState, pid: number) => s.players[pid]?.tribe === 'portugal';
/** A Portuguese vessel that may raise a padrão: a boat, ship, warship or voyager. */
export const isSailor = (u: Unit) => SAILORS.has(u.kind);

// ---------------------------------------------------------------- feitorias

/** Ports inside `owner`'s borders. */
export const ports = (s: GameState, owner: number): Tile[] =>
  s.tiles.filter((t) => t.improvement === 'port' && tileOwnerPlayer(s, t) === owner);

export const portIncome = (s: GameState, owner: number) => (isPortugal(s, owner) ? ports(s, owner).length * PORT_PAY : 0);

// ---------------------------------------------------------------- padrões

/** Who raised the padrão on `t` (null if there is none). */
export const padraoOwner = (t: Tile): number | null =>
  t.improvement === 'padrao' && typeof t.data?.padrao === 'number' ? (t.data.padrao as number) : null;

/** Every padrão `owner` has raised. */
export const padroes = (s: GameState, owner: number): Tile[] => s.tiles.filter((t) => padraoOwner(t) === owner);

/** How many padrões `owner` may keep: one per city. */
export const padraoCap = (s: GameState, owner: number) => citiesOf(s, owner).length;

const coastal = (s: GameState, t: Tile) => neighbors(s, t.x, t.y).some(isWater);

/** Stars a padrão pays a turn: 1, and 1 more as a feitoria on the coast. */
export const padraoStars = (s: GameState, t: Tile) => PADRAO_PAY + (coastal(s, t) ? FEITORIA_PAY : 0);

export const padraoIncome = (s: GameState, owner: number) =>
  isPortugal(s, owner) ? padroes(s, owner).reduce((n, t) => n + padraoStars(s, t), 0) : 0;

/** Is `t` the kind of land a padrão may stand on (ignoring who owns it)? */
const plainLand = (t: Tile) =>
  isLand(t) && t.terrain !== 'mountain' && t.terrain !== 'ice' && t.terrain !== 'bridge' && t.terrain !== 'platform'
  && !t.improvement && t.cityId === null && !t.village && !t.ruin;

/** `owner`'s vessels next to `t`. */
export const sailorsBeside = (s: GameState, owner: number, t: Tile): Unit[] =>
  s.units.filter((u) => u.owner === owner && isSailor(u) && dist(u.x, u.y, t.x, t.y) === 1);

/** The distance from `t` to `owner`'s nearest city (Infinity with none). */
const cityDist = (s: GameState, owner: number, t: Tile) =>
  citiesOf(s, owner).reduce((m, c) => Math.min(m, dist(c.x, c.y, t.x, t.y)), Infinity);

/** Could a padrão ever stand here (the land itself, ownership and distance)? */
export const padraoSite = (s: GameState, owner: number, t: Tile) =>
  plainLand(t) && t.owner === null && tileOwnerPlayer(s, t) === null && cityDist(s, owner, t) >= PADRAO_MIN_DIST;

/** Why `owner` can't raise a padrão on `t` now (stars aside), or null if it can. */
export function padraoWhy(s: GameState, owner: number, t: Tile): string | null {
  if (!isPortugal(s, owner)) return 'Only Portugal raises padrões';
  if (!plainLand(t)) return 'Needs open land';
  if (t.owner !== null || tileOwnerPlayer(s, t) !== null) return 'The land is already claimed';
  if (cityDist(s, owner, t) < PADRAO_MIN_DIST) return `At least ${PADRAO_MIN_DIST} tiles from your cities`;
  if (!sailorsBeside(s, owner, t).length) return 'Needs one of your ships beside it';
  if (padroes(s, owner).length >= padraoCap(s, owner)) return 'One padrão per city';
  const at = unitAt(s, t.x, t.y);
  if (at && at.owner !== owner) return 'Someone stands on the shore';
  return null;
}

/** Marks everything within PADRAO_SIGHT of each of `owner`'s padrões as explored (and meets whoever is there). */
export function padraoSight(s: GameState, owner: number) {
  const p = s.players[owner];
  for (const t of padroes(s, owner)) {
    for (const n of area(s, t.x, t.y, PADRAO_SIGHT)) p.explored[n.y * s.size + n.x] = true;
  }
  const seen = (x: number, y: number) => p.explored[y * s.size + x];
  for (const u of s.units) if (u.owner !== owner && seen(u.x, u.y)) meet(s, owner, u.owner);
  for (const c of s.cities) if (c.owner !== owner && seen(c.x, c.y)) meet(s, owner, c.owner);
}

/** Raise the pillar (stars are paid by the caller). */
export function raise(s: GameState, owner: number, t: Tile): boolean {
  if (padraoWhy(s, owner, t)) return false;
  t.improvement = 'padrao';
  t.data = { ...(t.data ?? {}), padrao: owner, padraoTurn: s.turn };
  const m = (s.players[owner].mech ??= {});
  m.raised = Number(m.raised ?? 0) + 1;
  padraoSight(s, owner);
  emit({ type: 'toast', player: owner, text: `🗿 A padrão is raised: +${padraoStars(s, t)}★ a turn, and the coast around it is charted.` });
  return true;
}

/** Pull down padrões whose land another empire has claimed. */
function sweep(s: GameState, owner: number) {
  for (const t of padroes(s, owner)) {
    const o = tileOwnerPlayer(s, t);
    if (o === null || o === owner) continue;
    t.improvement = null;
    const { padrao: _p, padraoTurn: _t, ...rest } = t.data ?? {};
    t.data = rest;
  }
}

export const raisedCount = (s: GameState, owner: number) => Number(s.players[owner].mech?.raised ?? 0);

// ---------------------------------------------------------------- AI

/** The best site next to one of `owner`'s vessels right now, or null. */
function readySite(s: GameState, owner: number): Tile | null {
  let best: Tile | null = null, score = -Infinity;
  for (const u of s.units) {
    if (u.owner !== owner || !isSailor(u)) continue;
    for (const t of neighbors(s, u.x, u.y)) {
      if (padraoWhy(s, owner, t)) continue;
      const v = padraoStars(s, t) * 10 + cityDist(s, owner, t);
      if (v > score) { best = t; score = v; }
    }
  }
  return best;
}

export const mech: Mechanic = {
  name: 'Padrões of Discovery',
  blurb: `Feitorias: every port pays +${PORT_PAY}★ a turn. A boat or ship beside unclaimed land at least ${PADRAO_MIN_DIST} tiles from your cities may raise a stone padrão there (${PADRAO_COST}★, one per city): +${PADRAO_PAY}★ a turn, +${FEITORIA_PAY}★ more on the coast, and you see ${PADRAO_SIGHT} tiles around it for good.`,

  setup(s, owner) { if (isPortugal(s, owner)) s.players[owner].mech ??= {}; },

  income(s, owner) {
    return portIncome(s, owner) + padraoIncome(s, owner);
  },

  turnStart(s, owner) {
    if (!isPortugal(s, owner)) return;
    sweep(s, owner);
    padraoSight(s, owner);
  },

  actions(s, owner, t): Action[] {
    if (!isPortugal(s, owner) || !padraoSite(s, owner, t) || !sailorsBeside(s, owner, t).length) return [];
    const why = padraoWhy(s, owner, t);
    const poor = s.players[owner].stars < PADRAO_COST;
    return [{
      id: 'mech:padrao', label: 'Raise Padrão',
      desc: `Plant a stone pillar on this far shore: +${PADRAO_PAY}★ a turn (+${FEITORIA_PAY}★ more as a coastal feitoria), and you see ${PADRAO_SIGHT} tiles around it for good. One per city (${padroes(s, owner).length}/${padraoCap(s, owner)}).`,
      cost: PADRAO_COST, icon: 'flag', enabled: !why && !poor, reason: why ?? (poor ? 'Not enough stars' : undefined),
    }];
  },

  doAction(s, owner, t, id) {
    if (id !== 'mech:padrao') return false;
    return raise(s, owner, t);
  },

  // 1. raise a padrão next to any vessel that can; 2. once a turn, steer one idle vessel toward the nearest far coast.
  ai(s, owner) {
    if (!isPortugal(s, owner)) return false;
    const p = s.players[owner];
    if (p.stars < PADRAO_COST + AI_RESERVE || padroes(s, owner).length >= padraoCap(s, owner)) return false;
    const site = readySite(s, owner);
    if (site) {
      if (!raise(s, owner, site)) return false;
      p.stars -= PADRAO_COST; // the core charges only for human-issued actions; the AI pays here
      return true;
    }
    const m = (p.mech ??= {});
    if (m.steer === s.turn) return false;
    for (const u of s.units) {
      if (u.owner !== owner || !isSailor(u) || u.moved || attackOptions(s, u).length) continue;
      const tile = tileAt(s, u.x, u.y);
      if (!tile || !isWater(tile)) continue;
      // the nearest explored far coast
      let goal: Tile | null = null, gd = Infinity;
      for (const t of s.tiles) {
        const d = dist(u.x, u.y, t.x, t.y);
        if (d > AI_SEARCH || d >= gd || !p.explored[t.y * s.size + t.x] || !padraoSite(s, owner, t)) continue;
        if (!neighbors(s, t.x, t.y).some(isWater)) continue;
        goal = t; gd = d;
      }
      if (!goal) continue;
      let best: { x: number; y: number; d: number } | null = null;
      for (const o of moveOptions(s, u)) {
        const t = tileAt(s, o.x, o.y);
        if (!t || !isWater(t)) continue;
        const d = dist(o.x, o.y, goal.x, goal.y);
        if (d < gd && (!best || d < best.d)) best = { x: o.x, y: o.y, d };
      }
      if (!best) continue;
      m.steer = s.turn;
      if (moveUnit(s, u, best.x, best.y)) return true;
    }
    return false;
  },
};

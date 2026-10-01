// Barracks: upgrades that cost turns instead of Stars.
//  - Build one Barracks per city on a free field in its land (Tactics). Its price depends on the empire type: cheap for
//    Military empires, dear for Economy ones (BARRACKS_COST).
//  - A unit standing on your Barracks may Train: it is locked in (no moving, no attacking, half defence) for a few turns
//    and comes out as the next unit of its line for free (Warrior → Swordsman, Rider → Knight; Iron and Horses are
//    still used, see game/goods). A unit with no next unit takes a Drill instead and comes out a Veteran.
//  - Training time also depends on the empire type (TRAIN_TURNS). Expanding the Barracks to a Drill Yard (level 2)
//    takes a turn off everything; a War College (level 3) also sends upgraded units out as Veterans.
//  - Naval empires refit ships the same way at any of their Ports: Boat → Galley → Trireme, for free, in turns.
// Training state lives on the unit: `u.data.train = { to, until }` (`to` is the new kind, or 'drill').
import { categoryOf } from '../data/tribes';
import { NAVAL_UPGRADE, UNITS } from '../data/units';
import { upgradeTarget } from './army';
import { emit } from './events';
import { dist, tileAt } from './grid';
import { needWhy, spendNeeds } from './goods';
import { cityById, def, doAction, hasTech, maxHp, moveOptions, moveUnit, tileOwnerPlayer, unitAt, type Action } from './rules';
import type { Category } from '../data/tribes';
import type { GameState, Tile, Unit, UnitKind } from './types';

export const BARRACKS_COST: Record<Category, number> = { military: 4, economy: 12, naval: 8 };
/** Turns to train up to the next unit, and to drill a Veteran, by empire type (before a Drill Yard). */
export const TRAIN_TURNS: Record<Category, { up: number; drill: number }> = {
  military: { up: 2, drill: 1 },
  economy: { up: 4, drill: 3 },
  naval: { up: 3, drill: 2 },
};
/** Stars to expand a Barracks to level 2 (Drill Yard) and level 3 (War College). */
export const EXPAND_COST = [0, 0, 6, 10];
export const BARRACKS_NAMES = ['', 'Barracks', 'Drill Yard', 'War College'];
export const BARRACKS_TECH = 'tactics';

export interface Training { to: UnitKind | 'drill'; until: number }

const cat = (s: GameState, pid: number) => categoryOf(s.players[pid].tribe).id;
export const isBarracks = (t: Tile) => t.improvement === 'barracks';
export const barracksLevel = (t: Tile) => (isBarracks(t) ? Number(t.data?.blvl ?? 1) : 0);
export const trainingOf = (u: Unit): Training | undefined => u.data?.train as Training | undefined;
export const isTraining = (u: Unit) => !!trainingOf(u);
/** Turns left on a unit's training (0 when it is not training). */
export const trainLeft = (s: GameState, u: Unit) => { const t = trainingOf(u); return t ? Math.max(0, t.until - s.turn) : 0; };

/** Where `u` stands, can it train here: your Barracks, or (a Naval empire's ship) your Port? */
function yard(s: GameState, u: Unit): Tile | null {
  const t = tileAt(s, u.x, u.y)!;
  if (tileOwnerPlayer(s, t) !== u.owner) return null;
  if (isBarracks(t) && !def(u).naval) return t;
  if (t.improvement === 'port' && def(u).naval && cat(s, u.owner) === 'naval') return t;
  return null;
}

/** What `u` would become by training here: the next unit of its line, its next ship, or a drill (a Veteran). */
export function trainTarget(s: GameState, u: Unit): UnitKind | 'drill' | null {
  if (def(u).naval) return NAVAL_UPGRADE[u.carrying ?? u.kind] && !u.carrying ? NAVAL_UPGRADE[u.kind]! : null;
  const next = upgradeTarget(s, u);
  if (next) return next;
  return u.veteran || u.kind === 'hero' || UNITS[u.kind].atk <= 0 ? null : 'drill';
}

export function trainTurns(s: GameState, u: Unit, to: UnitKind | 'drill', t: Tile): number {
  const base = TRAIN_TURNS[cat(s, u.owner)][to === 'drill' ? 'drill' : 'up'];
  return Math.max(1, base - (barracksLevel(t) >= 2 ? 1 : 0));
}

/** Why `u` can't start training where it stands, or null. */
export function trainWhy(s: GameState, u: Unit): string | null {
  if (!yard(s, u)) return null; // not offered at all
  if (isTraining(u)) return 'Already training';
  if (u.attacked) return 'Unit has already attacked';
  const to = trainTarget(s, u);
  if (!to) return 'Nothing left to learn';
  if (to !== 'drill' && UNITS[to].tech && !hasTech(s, u.owner, UNITS[to].tech!)) return `Needs ${UNITS[to].tech}`;
  if (to !== 'drill') return needWhy(s, u.owner, to) ?? null;
  return null;
}

/** The Barracks a city already has, if any. */
const barracksOf = (s: GameState, cityId: number) => s.tiles.find((t) => t.owner === cityId && isBarracks(t));

/** The tile menu: build or expand a Barracks; train the unit standing on one. */
export function barracksActions(s: GameState, pid: number, t: Tile): Action[] {
  const p = s.players[pid];
  if (p.neutral || tileOwnerPlayer(s, t) !== pid) return [];
  const out: Action[] = [];
  const has = hasTech(s, pid, BARRACKS_TECH);
  const u = unitAt(s, t.x, t.y);
  if (!t.improvement && !t.resource && t.cityId === null && !t.village && !t.ruin && (t.terrain === 'field' || t.terrain === 'desert' || t.terrain === 'tundra') && t.owner !== null) {
    const cost = BARRACKS_COST[cat(s, pid)];
    const why = !has ? `Needs ${BARRACKS_TECH}` : barracksOf(s, t.owner) ? 'This city already has a Barracks' : p.stars < cost ? 'Not enough stars' : u && u.owner !== pid ? 'Enemy unit here' : undefined;
    const tt = TRAIN_TURNS[cat(s, pid)];
    out.push({
      id: 'barracks', label: 'Build Barracks', cost, icon: 'barracks', enabled: !why, reason: why, needs: has ? undefined : BARRACKS_TECH,
      desc: `A training yard: its city supports 1 more unit and can raise new units right here; a unit standing on it can Train to the next unit of its line for free in ${tt.up} turns, or Drill into a Veteran in ${tt.drill}. One per city.`,
    });
  }
  const lvl = barracksLevel(t);
  if (lvl && lvl < 3) {
    const cost = EXPAND_COST[lvl + 1];
    out.push({
      id: 'barracks:expand', label: `Expand to ${BARRACKS_NAMES[lvl + 1]}`, cost, icon: 'barracks', enabled: p.stars >= cost, reason: p.stars >= cost ? undefined : 'Not enough stars',
      desc: lvl + 1 === 2 ? 'Every training here takes 1 turn less.' : 'Units that train up to a new unit here also come out as Veterans.',
    });
  }
  if (u && u.owner === pid && yard(s, u)) {
    const to = trainTarget(s, u);
    const why = trainWhy(s, u);
    const turns = to ? trainTurns(s, u, to, t) : 0;
    const what = !to ? 'nothing' : to === 'drill' ? 'a Veteran (+5 max health)' : `a ${UNITS[to].name}`;
    out.push({
      id: 'barracks:train', label: to === 'drill' ? 'Drill' : def(u).naval ? 'Refit' : 'Train', cost: 0, icon: to && to !== 'drill' ? to : 'barracks',
      enabled: !why, reason: why ?? undefined,
      desc: isTraining(u) ? `Training: ${trainLeft(s, u)} turn(s) left.` : `Free: in ${turns} turn${turns === 1 ? '' : 's'} it becomes ${what}. Meanwhile it cannot move or attack and defends at half strength.`,
    });
  }
  return out;
}

export function barracksDoAction(s: GameState, pid: number, t: Tile, id: string): boolean {
  if (id === 'barracks') {
    t.improvement = 'barracks';
    t.data = { ...(t.data ?? {}), blvl: 1 };
    const c = cityById(s, t.owner);
    if (c) c.data = { ...(c.data ?? {}), barracks: true };
    emit({ type: 'toast', player: pid, text: 'Barracks built: move a unit onto it and tap Train.' });
    return true;
  }
  if (id === 'barracks:expand') { t.data = { ...(t.data ?? {}), blvl: barracksLevel(t) + 1 }; return true; }
  if (id === 'barracks:train') {
    const u = unitAt(s, t.x, t.y);
    if (!u || trainWhy(s, u)) return false;
    const to = trainTarget(s, u)!;
    if (to !== 'drill') spendNeeds(s, pid, to); // Iron and Horses are set aside now
    u.data = { ...(u.data ?? {}), train: { to, until: s.turn + trainTurns(s, u, to, t), college: barracksLevel(t) >= 3 } };
    u.moved = u.attacked = true;
    return true;
  }
  return false;
}

/** Start of `pid`'s turn: training units stay put; those whose time is up come out changed. */
export function barracksTurnStart(s: GameState, pid: number) {
  // the extra unit slot follows the yard: lost with it if it is pillaged or the land changes hands
  for (const c of s.cities) {
    if (c.owner !== pid) continue;
    const has = !!barracksOf(s, c.id);
    if (has !== !!c.data?.barracks) c.data = { ...(c.data ?? {}), barracks: has };
  }
  for (const u of s.units) {
    if (u.owner !== pid) continue;
    const tr = trainingOf(u);
    if (!tr) continue;
    if (s.turn < tr.until) { u.moved = u.attacked = true; continue; }
    const { train: _t, ...rest } = u.data!;
    u.data = rest;
    const name = UNITS[u.kind].name;
    if (tr.to === 'drill') {
      u.veteran = true;
      u.hp = maxHp(u);
      emit({ type: 'toast', player: pid, text: `🎖 Your ${name} finishes its drill: a Veteran now.` });
    } else {
      const ratio = u.hp / maxHp(u);
      u.kind = tr.to;
      if ((tr as { college?: boolean }).college) u.veteran = true;
      u.hp = Math.max(1, Math.round(maxHp(u) * ratio));
      emit({ type: 'toast', player: pid, text: `🎖 Training complete: your ${name} is now a ${UNITS[tr.to].name}${u.veteran ? ' (Veteran)' : ''}.` });
    }
    emit({ type: 'heal', unitId: u.id, x: u.x, y: u.y, amount: 0 });
  }
}

/** A training unit defends at half strength. */
export const trainingDefense = (u: Unit) => (isTraining(u) ? 0.5 : 1);

// ---------------------------------------------------------------- the AI

/** Build a Barracks when the empire type makes it worthwhile; send idle units at peace to train. */
export function barracksAi(s: GameState, pid: number, danger: (x: number, y: number) => boolean): boolean {
  const p = s.players[pid];
  const c = cat(s, pid);
  const cities = s.cities.filter((k) => k.owner === pid);
  // 1. train whoever stands on a free yard, when no enemy is near
  for (const u of s.units) {
    if (u.owner !== pid || isTraining(u) || u.attacked || !yard(s, u) || danger(u.x, u.y)) continue;
    if (!trainWhy(s, u)) return doAction(s, pid, tileAt(s, u.x, u.y)!, 'barracks:train');
  }
  // 2. walk an idle unit onto a Barracks it can reach this turn
  for (const t of s.tiles) {
    if (!isBarracks(t) || tileOwnerPlayer(s, t) !== pid || unitAt(s, t.x, t.y) || danger(t.x, t.y)) continue;
    for (const u of s.units) {
      if (u.owner !== pid || u.moved || isTraining(u) || def(u).naval || dist(u.x, u.y, t.x, t.y) > 3) continue;
      const to = trainTarget(s, u);
      if (!to || (to !== 'drill' && needWhy(s, pid, to))) continue;
      const here = tileAt(s, u.x, u.y)!;
      if (here.cityId !== null && cityById(s, here.cityId)?.owner === pid && s.units.filter((x) => x.owner === pid && dist(x.x, x.y, here.x, here.y) <= 1).length <= 1) continue; // keep the last guard home
      if (moveOptions(s, u).some((o) => o.x === t.x && o.y === t.y) && moveUnit(s, u, t.x, t.y)) return true;
    }
  }
  // 3. build one: Military empires early, others once rich
  const cost = BARRACKS_COST[c];
  if (!hasTech(s, pid, BARRACKS_TECH) || p.stars < cost + (c === 'military' ? 3 : 15)) return false;
  for (const city of cities) {
    if (barracksOf(s, city.id)) continue;
    const spot = s.tiles.find((t) => t.owner === city.id && !t.improvement && !t.resource && t.cityId === null && !t.village && !t.ruin && t.terrain === 'field' && !unitAt(s, t.x, t.y));
    if (spot) return doAction(s, pid, spot, 'barracks');
    if (c !== 'military') break; // only one at a time for the others
  }
  return false;
}

/** For the unit panel: "Training: Swordsman in 2 turns". */
export function trainingNote(s: GameState, u: Unit): string | null {
  const tr = trainingOf(u);
  if (!tr) return null;
  const left = trainLeft(s, u);
  return `⏳ Training: ${tr.to === 'drill' ? 'Veteran' : UNITS[tr.to].name} in ${left} turn${left === 1 ? '' : 's'} (half defence meanwhile).`;
}

export const barracksName = (t: Tile) => BARRACKS_NAMES[barracksLevel(t)] ?? 'Barracks';

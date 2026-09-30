// Empire types and their role units. Every empire belongs to one of three types (`category` in data/tribes): Military,
// Economy or Naval. Each type trains two role units that only its empires can have. They are one unit kind each, named
// and drawn in each empire's own style (see render/roles), and they hardly fight (little or no attack), so they want
// protecting. Their actions sit in the tile menus (ids `role:<verb>:<unit id>:<target tile>[:<arg>]`), on the unit's own
// tile and on the tile they act on, and run through the core `doAction`.
//
//  ⚔ Military
//   - Recruiter (a warlord). "Station Here" in one of your cities: while it stays on the city tile, units trained there
//     cost RECRUIT_DISCOUNT★ less (never below 1), the city supports RECRUIT_CAP more unit, and "Rally Militia" raises a
//     free warrior beside the city when an enemy is within RALLY_RANGE (every RALLY_COOLDOWN turns). Killing it pays a
//     bounty. A unit stationed on a city does not stop the city training: new units step out beside it.
//   - Sappers. Lay a road on the tiles they march from and to (free), "Build Fort" where they stand (FORT_COST★; a
//     permanent `fort` improvement marked `data.sfort`, worth +FORT_DEF defence to their empire's units on it: Rome's
//     castra keep `data.castra` and are left alone), "Build Bridge" over a shallow beside them (BRIDGE_COST★; the tile
//     becomes `bridge` terrain: land with a road on it, so land units walk over and ships no longer pass), and
//     "Undermine" an enemy city beside them: for UNDERMINE_TURNS turns its walls and garrison bonus count for nothing.
//  💰 Economy
//   - Master Builder. Builds a farm, mine, port or market on its own tile or one beside it at half price (rounded up),
//     and raises an improved tile there to its next level (see game/levels: farm → Estate → Granary Fields...) at half
//     the price; once per city it may skip the level's tech. Each action uses its turn.
//   - Tax Collector. "Station Here" in a city: while it stays, the city pays TAX_PCT more Stars (rounded up). Only one
//     unit can stand on a city tile, so one collector counts per city and never more collectors than cities. Fragile,
//     and killing it pays a bounty.
//  ⚓ Naval (both ships are launched beside a coastal city like the Trade Ship, cross the ocean and never go ashore)
//   - Fishing Fleet. "Bring in the Catch" on a fish or whale tile anywhere at sea (even outside your borders): Stars
//     and +1 population to your nearest city; every fleet also earns FLEET_STARS★ a turn, and sees 2 tiles around.
//   - Voyager. Moves 4, sees 3. "Found Outpost" on an empty unclaimed land tile beside it at least OUTPOST_GAP from every
//     city: a new level-1 city of yours, and the ship is used up. At most one outpost for every 2 cities you hold.
//
// State (all JSON-safe; older saves simply have none): on units `data.post` (the city a Recruiter or Tax Collector is
// stationed in) and `data.militia`; on cities `data.recruiter` (a stationed recruiter raises the unit cap, kept in step
// by `roleSweep`), `data.rally` (the turn Rally Militia is ready again), `data.mined` (undermined until this turn) and
// `data.outpost` (founded by a Voyager); on tiles `data.sfort` (a Sappers' fort, the builder's id), `data.bridge` and
// `data.up` (from older saves: the improvement a Master Builder upgraded; game/levels reads it as level 2).
//
// The hooks run through the empire-mechanic framework (see mech/index): ROLE_MECH is called for every living empire,
// so each hook checks `owner`. The computer players use the units through `roleAi` (called from game/ai).
import { CATEGORIES, TRIBES, unitFor } from '../data/tribes';
import { UNITS } from '../data/units';
import { hostile } from './diplomacy';
import { emit } from './events';
import { dist, isLand, isWater, neighbors, tileAt } from './grid';
import { foundCity, revealAround, spawnUnit } from './mapgen';
import { hookBlock } from './mech';
import { restLeft } from './mech/inuit';
import type { Mechanic } from './mech/types';
import {
  addPop, cityById, cityIncome, citiesOf, doAction, hasTech, isExplored, moveOptions, moveUnit, payRoadBonuses, plainTileActions,
  tileActions, tileOwnerPlayer, unitAt, type Action,
} from './rules';
import { roadNetwork } from './network';
import { shipSpawn } from './trade';
import type { City, GameState, Tile, TribeId, Unit, UnitKind } from './types';
import { campAt, isLava, isNeutral, nearBeast } from './wild';
import { wonderOn } from './wonders';
import { aName, LEVELS, levelGain, levelName, nextLevel, raiseTile, tileLevel } from './levels';
import { TECH_BY_ID } from '../data/techs';

// ---------------------------------------------------------------- tuning

export const RECRUIT_DISCOUNT = 1;
export const RECRUIT_CAP = 1;
export const RALLY_COOLDOWN = 4;
export const RALLY_RANGE = 3;
export const FORT_COST = 2;
export const FORT_DEF = 1;
export const BRIDGE_COST = 2;
export const UNDERMINE_TURNS = 3;
export const TAX_PCT = 0.5;
export const FLEET_STARS = 1;
export const CATCH: Record<'fish' | 'whale', { stars: number; pop: number }> = { fish: { stars: 2, pop: 1 }, whale: { stars: 5, pop: 1 } };
export const OUTPOST_GAP = 3;
/** Stars the killer of a role unit collects. */
export const BOUNTY: Partial<Record<UnitKind, number>> = { recruiter: 3, collector: 4 };
const BUILDS = ['farm', 'mine', 'port', 'market'];

export const ROLE_KINDS: UnitKind[] = ['recruiter', 'sapper', 'builder', 'collector', 'fishfleet', 'voyager'];
export const isRoleKind = (k: UnitKind | null | undefined) => !!k && ROLE_KINDS.includes(k);
/** A role unit (also one carried in a boat). */
export const isRoleUnit = (u: Unit) => isRoleKind(u.carrying ?? u.kind);
/** Role units that are ships: launched beside a coastal city, never going ashore, crossing the ocean. */
export const isRoleShip = (k: UnitKind) => k === 'fishfleet' || k === 'voyager';
/** Role units that are stationed in a city to work. */
const POST_KINDS: UnitKind[] = ['recruiter', 'collector'];
/** The two role units an empire of this people can train. */
export const roleKindsOf = (tribe: TribeId): UnitKind[] => CATEGORIES.find((c) => c.id === TRIBES[tribe].category)!.units;

// ---------------------------------------------------------------- each empire's role units

/** What each empire calls its role units (the look comes from the empire too; see render/roles). */
export const ROLE_NAMES: Record<TribeId, Partial<Record<UnitKind, string>>> = {
  rome: { recruiter: 'Conquisitor', sapper: 'Fabri Engineers' },
  mongols: { recruiter: 'Noyan Warlord', sapper: 'Hashar Levy' },
  zulu: { recruiter: 'Induna', sapper: 'Kraal Builders' },
  aztec: { recruiter: 'Tlacateccatl', sapper: 'Causeway Builders' },
  japan: { recruiter: 'Ashigaru Captain', sapper: 'Kuwa-kata Engineers' },
  persia: { recruiter: 'Hazarapat', sapper: 'Royal Road Builders' },
  ottoman: { recruiter: 'Sipahi Bey', sapper: 'Lağımcı Miners' },
  lakota: { recruiter: 'Akicita Leader', sapper: 'Trail Breakers' },
  egypt: { builder: 'Master of Works', collector: 'Granary Scribe' },
  mali: { builder: 'Banco Mason', collector: 'Farba Tax Collector' },
  china: { builder: 'Imperial Architect', collector: 'Tax Magistrate' },
  india: { builder: 'Sthapati', collector: 'Samaharta' },
  maya: { builder: 'Master Mason', collector: 'Tribute Steward' },
  inca: { builder: 'Mit’a Foreman', collector: 'Quipucamayoc' },
  tibet: { builder: 'Dzong Builder', collector: 'Monastery Steward' },
  celts: { builder: 'Hillfort Wright', collector: 'Chieftain’s Steward' },
  aboriginal: { builder: 'Weir Builder', collector: 'Exchange Keeper' },
  khmer: { builder: 'Temple Architect', collector: 'Rice Tax Collector' },
  ethiopia: { builder: 'Stele Mason', collector: 'Tribute Collector' },
  polynesia: { fishfleet: 'Fishing Waka', voyager: 'Wayfinder Waka' },
  pirates: { fishfleet: 'Turtling Smack', voyager: 'Scouting Brigantine' },
  vikings: { fishfleet: 'Færing Fishers', voyager: 'Vinland Knarr' },
  swahili: { fishfleet: 'Ngalawa Fishers', voyager: 'Monsoon Mtepe' },
  inuit: { fishfleet: 'Kayak Hunters', voyager: 'Umiak Voyagers' },
  greeks: { fishfleet: 'Tuna Fishers', voyager: 'Colonist Penteconter' },
  korea: { fishfleet: 'Jeju Fishers', voyager: 'Panokseon Scout' },
};
/** The name an empire gives its role unit of this kind. */
export const roleName = (tribe: TribeId, kind: UnitKind) => ROLE_NAMES[tribe]?.[kind] ?? UNITS[kind].name;

const people = (s: GameState, pid: number) => TRIBES[s.players[pid].tribe].people;
/** Bridges built so far in this session: the computer's map of connected land is redrawn when it changes. */
export let bridgesBuilt = 0;
const log = (s: GameState, text: string) => s.log.push({ turn: s.turn, text });
const ready = (u: Unit) => !u.attacked;
const NOT_READY = 'Unit has already acted';
const idx = (s: GameState, t: Tile) => t.y * s.size + t.x;

// ---------------------------------------------------------------- stationed units

/** The city a Recruiter or Tax Collector is stationed in, while it still stands on it. */
export function postedCity(s: GameState, u: Unit): City | undefined {
  const id = u.data?.post;
  if (typeof id !== 'number' || u.carrying || !POST_KINDS.includes(u.kind)) return undefined;
  const c = cityById(s, id);
  return c && c.owner === u.owner && c.x === u.x && c.y === u.y ? c : undefined;
}
/** The unit stationed in `c` (of `kind`, if given). One unit stands on a city tile, so at most one counts. */
export function postAt(s: GameState, c: City, kind?: UnitKind): Unit | undefined {
  const u = unitAt(s, c.x, c.y);
  return u && (!kind || u.kind === kind) && postedCity(s, u) === c ? u : undefined;
}
/** Where a unit trained in a city with a unit stationed on it steps out: a free land tile beside the city. */
export function postSpawn(s: GameState, c: City): Tile | undefined {
  return neighbors(s, c.x, c.y).find((t) => isLand(t) && t.terrain !== 'mountain' && t.cityId === null && !isLava(t) && !unitAt(s, t.x, t.y));
}
/** Keeps the bookkeeping in step: posts that were left are dropped, and cities know whether a recruiter serves them. */
export function roleSweep(s: GameState) {
  for (const u of s.units) {
    if (u.data && 'post' in u.data && !postedCity(s, u)) { const { post: _p, ...rest } = u.data; u.data = rest; }
  }
  for (const c of s.cities) {
    const r = !!postAt(s, c, 'recruiter');
    if (r && !c.data?.recruiter) c.data = { ...(c.data ?? {}), recruiter: true };
    else if (!r && c.data?.recruiter) { const { recruiter: _r, ...rest } = c.data; c.data = rest; }
  }
}
/** Turns until Rally Militia is ready in `c` (0 = ready). */
export const rallyLeft = (s: GameState, c: City) => Math.max(0, Number(c.data?.rally ?? 0) - s.turn);
const threatNear = (s: GameState, c: City) =>
  s.units.some((e) => e.owner !== c.owner && hostile(s, c.owner, e.owner) && dist(e.x, e.y, c.x, c.y) <= RALLY_RANGE);

/** Train actions in a city with a stationed Recruiter cost RECRUIT_DISCOUNT less (called from rules.tileActions). */
export function roleDiscount(s: GameState, pid: number, t: Tile, acts: Action[]) {
  if (t.cityId === null) return;
  const c = cityById(s, t.cityId);
  if (!c || c.owner !== pid || !postAt(s, c, 'recruiter')) return;
  const stars = s.players[pid].stars;
  for (const a of acts) {
    if (!a.id.startsWith('train:') || a.cost <= 1) continue;
    a.cost = Math.max(1, a.cost - RECRUIT_DISCOUNT);
    a.desc = `${a.desc} (Recruiter: ${RECRUIT_DISCOUNT}★ off)`;
    if (!a.enabled && a.reason === 'Not enough stars' && stars >= a.cost) { a.enabled = true; a.reason = undefined; }
  }
}

// ---------------------------------------------------------------- forts, walls, grand works, income

/** Is this city's defence undermined by Sappers right now? */
export const undermined = (s: GameState, c: City) => typeof c.data?.mined === 'number' && s.turn < (c.data.mined as number);
/** Turns an undermining still lasts. */
export const minedLeft = (s: GameState, c: City) => (undermined(s, c) ? (c.data!.mined as number) - s.turn : 0);
/** A Sappers' fort (not a Roman castra). */
export const isSapperFort = (t: Tile) => t.improvement === 'fort' && typeof t.data?.sfort === 'number';
/** Has the improvement on this tile been raised to level 2 or 3 (see game/levels)? Drawn as a grand work (see render/roles). */
export const isUpgraded = (t: Tile) => tileLevel(t) >= 2;
/** The Tax Collector's share of a city's income `inc` (0 without one). */
export const taxBonus = (s: GameState, c: City, inc: number) => (postAt(s, c, 'collector') ? Math.ceil(Math.max(0, inc) * TAX_PCT) : 0);
/** What the role units add to a city's income on top of `inc` (called at the end of rules.cityIncome). */
export function roleCityIncome(s: GameState, c: City, inc: number, tax: boolean): number {
  return tax ? taxBonus(s, c, inc) : 0;
}
/** The Stars a city's Tax Collector brings in a turn right now. */
export const cityTax = (s: GameState, c: City) => cityIncome(s, c) - cityIncome(s, c, false);
/** Stars `pid`'s Fishing Fleets earn a turn (part of the turn-start income). */
export const fleetIncome = (s: GameState, pid: number) => s.units.filter((u) => u.owner === pid && u.kind === 'fishfleet').length * FLEET_STARS;

// ---------------------------------------------------------------- outposts

/** Outposts `pid` may still found: one for every two cities it holds, less those it already holds. */
export function outpostRoom(s: GameState, pid: number): number {
  const cs = citiesOf(s, pid);
  return Math.floor(cs.length / 2) - cs.filter((c) => c.data?.outpost).length;
}
/** Why `pid` can't found an outpost on `t` (null when it can), ignoring the ship. */
export function outpostWhy(s: GameState, pid: number, t: Tile): string | null {
  if (s.players[pid].tribe === 'pirates') return 'The Brethren hold no land: raise platforms at sea instead'; // their Flotilla Republic (see mech/pirates)
  if (!isLand(t) || ['mountain', 'ice', 'platform', 'bridge'].includes(t.terrain) || isLava(t)) return 'Needs open land';
  if (t.cityId !== null || t.village || t.ruin || campAt(s, t.x, t.y)) return 'Something already stands here';
  if (t.owner !== null) return 'The land is already claimed';
  if (unitAt(s, t.x, t.y)) return 'The tile is occupied';
  const near = s.cities.find((c) => dist(c.x, c.y, t.x, t.y) < OUTPOST_GAP);
  if (near) return `Too close to ${near.name}`;
  if (outpostRoom(s, pid) <= 0) return 'One outpost for every 2 cities you hold';
  return null;
}

// ---------------------------------------------------------------- actions

interface RoleAct extends Action { unit: number; target: number }
const act = (u: Unit, target: number, verb: string, a: Omit<Action, 'id'>, arg?: string): RoleAct =>
  ({ ...a, id: `role:${verb}:${u.id}:${target}${arg ? `:${arg}` : ''}`, unit: u.id, target });
/** The unit and target tile an action id names (for the menus: a unit's panel lists its own, a tile's those aimed at it). */
export function roleParts(id: string): { verb: string; unit: number; target: number; arg?: string } | null {
  const m = /^role:(\w+):(\d+):(\d+)(?::(\w+))?$/.exec(id);
  return m ? { verb: m[1], unit: Number(m[2]), target: Number(m[3]), arg: m[4] } : null;
}

/** Every action this role unit (of `pid`) could take now: on its own tile and the tiles around it. */
function unitActs(s: GameState, pid: number, u: Unit): RoleAct[] {
  if (u.owner !== pid || u.carrying || !isRoleKind(u.kind)) return [];
  const p = s.players[pid];
  const here = tileAt(s, u.x, u.y)!;
  const out: RoleAct[] = [];
  const name = roleName(p.tribe, u.kind);
  const why = (cost: number, extra?: string | null) => (!ready(u) ? NOT_READY : extra ?? (p.stars < cost ? 'Not enough stars' : undefined));
  // an action on a tile beside the unit is labelled with an arrow pointing to it on screen
  const push = (target: Tile, verb: string, label: string, desc: string, cost: number, icon: string, reason?: string, arg?: string, needs?: string) =>
    out.push(act(u, idx(s, target), verb, { label: target === here ? label : `${label} ${arrow(target.x - u.x, target.y - u.y)}`, desc, cost, icon, enabled: !reason, reason, needs }, arg));

  switch (u.kind) {
    case 'recruiter':
    case 'collector': {
      const c = here.cityId !== null ? cityById(s, here.cityId) : undefined;
      if (!c || c.owner !== pid) break;
      if (postedCity(s, u) !== c) {
        const desc = u.kind === 'recruiter'
          ? `${name}: while it stays in ${c.name}, units trained there cost ${RECRUIT_DISCOUNT}★ less, the city supports ${RECRUIT_CAP} more unit, and it can rally militia when enemies come within ${RALLY_RANGE}. Uses its turn.`
          : `${name}: while it stays in ${c.name}, the city pays half as much again (+${Math.ceil(Math.max(0, cityIncome(s, c, false)) * TAX_PCT)}★ a turn now). Uses its turn.`;
        push(here, 'station', 'Station Here', desc, 0, u.kind === 'recruiter' ? 'role:banner' : 'role:coins', why(0));
      } else if (u.kind === 'recruiter') {
        const left = rallyLeft(s, c);
        const spot = postSpawn(s, c);
        const reason = left > 0 ? `Ready in ${left} turn${left === 1 ? '' : 's'}` : !threatNear(s, c) ? `Only when an enemy is within ${RALLY_RANGE} tiles` : !spot ? 'No free tile beside the city' : undefined;
        push(here, 'rally', 'Rally Militia', `A free ${UNITS[unitFor(p.tribe, 'warrior')].name} musters beside ${c.name}, ready to fight at once (it takes no unit slot). Every ${RALLY_COOLDOWN} turns.`, 0, unitFor(p.tribe, 'warrior'), reason);
      }
      break;
    }
    case 'sapper': {
      // a fort where they stand
      const own = tileOwnerPlayer(s, here);
      if (isLand(here) && here.terrain !== 'mountain' && here.terrain !== 'bridge' && here.cityId === null && !here.village && !here.ruin && !here.improvement && (own === null || own === pid) && !campAt(s, here.x, here.y) && !wonderOn(s, here))
        push(here, 'fort', 'Build Fort', `A permanent earthwork: your units standing here defend +${FORT_DEF}.`, FORT_COST, 'role:fort', why(FORT_COST));
      for (const n of neighbors(s, u.x, u.y)) {
        // a bridge over a shallow beside them
        const no = tileOwnerPlayer(s, n);
        if (n.terrain === 'shallow' && !n.improvement && !n.resource && n.cityId === null && !n.village && !n.ruin && (no === null || no === pid) && isExplored(s, pid, n.x, n.y))
          push(n, 'bridge', 'Build Bridge', 'A wooden bridge: the shallow becomes a road land units can walk over (ships can no longer pass).', BRIDGE_COST, 'role:bridge', why(BRIDGE_COST, unitAt(s, n.x, n.y) ? 'A unit is in the way' : null));
        // undermine an enemy city beside them
        const c = n.cityId !== null ? cityById(s, n.cityId) : undefined;
        if (c && c.owner !== pid && hostile(s, pid, c.owner)) {
          const left = minedLeft(s, c);
          push(n, 'undermine', `Undermine ${c.name}`, `Dig under the defences: for ${UNDERMINE_TURNS} turns ${c.name}'s walls and garrison bonus count for nothing. Uses its turn.`, 0, 'role:undermine',
            why(0, left > 0 ? `Already undermined (${left} turn${left === 1 ? '' : 's'} left)` : null));
        }
      }
      break;
    }
    case 'builder': {
      for (const t of [here, ...neighbors(s, u.x, u.y)]) {
        if (tileOwnerPlayer(s, t) !== pid || t.cityId !== null || campAt(s, t.x, t.y) || wonderOn(s, t)) continue;
        const other = unitAt(s, t.x, t.y);
        if (other && other.owner !== pid) continue;
        for (const base of plainTileActions(s, pid, t)) {
          if (!BUILDS.includes(base.id)) continue;
          const cost = Math.ceil(base.cost / 2);
          const block = hookBlock(s, pid, base.id, t);
          const reason = base.needs ? base.reason : why(cost, block ?? null);
          push(t, 'build', `${base.label} (½)`, `${base.desc} ${name}: half price; uses its turn.`, cost, base.icon, reason, base.id, base.needs);
        }
        // the next level of an improved tile, at half price; once per city it may skip the tech (see game/levels)
        const n = t.improvement ? nextLevel(s, pid, t, { half: true, skip: true }) : null;
        if (n) {
          const up = LEVELS[n.kind].names[n.lvl - 1];
          const skip = !hasTech(s, pid, n.tech) && !n.needs;
          const reason = n.needs ? `${n.reason} (${name} already skipped a tech in ${cityById(s, t.owner)?.name})` : why(n.cost, n.reason ?? hookBlock(s, pid, t.improvement!, t) ?? null);
          push(t, 'upgrade', `Upgrade to ${up} (½)`, `${name} raises it to level ${n.lvl}: ${levelGain(n.kind, n.lvl)}. Half price${skip ? `; skips ${TECH_BY_ID[n.tech].name} (once per city)` : ''}; uses its turn.`, n.cost, 'role:upgrade', reason, undefined, n.needs);
        }
      }
      break;
    }
    case 'fishfleet': {
      if ((here.resource === 'fish' || here.resource === 'whale') && !here.improvement) {
        const c = nearestCity(s, pid, here);
        const k = CATCH[here.resource];
        push(here, 'fish', here.resource === 'whale' ? 'Hunt the Whale' : 'Bring in the Catch', `+${k.stars}★ and +${k.pop} population to ${c?.name ?? 'your nearest city'}. Uses its turn.`, 0, here.resource,
          why(0, restLeft(here) > 0 ? `The waters rest for ${restLeft(here)} more turns` : !c ? 'No city to feed' : null));
      }
      break;
    }
    case 'voyager': {
      const sites = neighbors(s, u.x, u.y).filter((n) => isLand(n) && isExplored(s, pid, n.x, n.y) && !['mountain', 'ice', 'platform', 'bridge'].includes(n.terrain) && n.cityId === null);
      const good = sites.filter((n) => !outpostWhy(s, pid, n));
      const list = good.length ? good : sites.slice(0, 1);
      for (const n of list) {
        push(n, 'outpost', 'Found Outpost', `Settle this ${n.terrain}: a new level-1 city of yours. The ship is used up. One outpost for every 2 cities you hold.`, 0, 'role:outpost',
          why(0, outpostWhy(s, pid, n)));
      }
      break;
    }
  }
  return out;
}

/** Which way a neighbouring tile lies on the isometric screen. */
const arrow = (dx: number, dy: number) => ({ '1,0': '↘', '0,1': '↙', '1,1': '↓', '-1,-1': '↑', '1,-1': '→', '-1,1': '←', '-1,0': '↖', '0,-1': '↗' } as Record<string, string>)[`${dx},${dy}`] ?? '';

const nearestCity = (s: GameState, pid: number, t: Tile) => citiesOf(s, pid).sort((a, b) => dist(a.x, a.y, t.x, t.y) - dist(b.x, b.y, t.x, t.y) || a.id - b.id)[0];

/** The tile menu: the actions of a role unit standing on `t`, and those of role units beside it aimed at `t`. */
export function roleActions(s: GameState, pid: number, t: Tile): Action[] {
  const i = idx(s, t);
  const here = unitAt(s, t.x, t.y);
  const out: RoleAct[] = here && here.owner === pid ? unitActs(s, pid, here) : [];
  for (const n of neighbors(s, t.x, t.y)) {
    const v = unitAt(s, n.x, n.y);
    if (v && v.owner === pid && isRoleKind(v.kind)) out.push(...unitActs(s, pid, v).filter((a) => a.target === i));
  }
  return out.map(({ unit: _u, target: _t, ...a }) => a as Action);
}

export function roleDoAction(s: GameState, pid: number, _t: Tile, id: string): boolean {
  const parts = roleParts(id);
  if (!parts) return false;
  const u = s.units.find((x) => x.id === parts.unit && x.owner === pid);
  const tg = s.tiles[parts.target];
  if (!u || !tg) return false;
  const p = s.players[pid];
  const name = roleName(p.tribe, u.kind);
  const used = () => { u.moved = u.attacked = true; return true; };
  switch (parts.verb) {
    case 'station': {
      const c = cityById(s, tg.cityId);
      if (!c) return false;
      u.data = { ...(u.data ?? {}), post: c.id };
      roleSweep(s);
      emit({ type: 'toast', player: pid, text: u.kind === 'recruiter' ? `${name} stationed in ${c.name}: units there cost ${RECRUIT_DISCOUNT}★ less and it supports one more.` : `${name} stationed in ${c.name}: +${cityTax(s, c)}★ a turn in taxes.` });
      log(s, `${people(s, pid)} ${name} stationed in ${c.name}.`);
      return used();
    }
    case 'rally': {
      const c = cityById(s, tg.cityId);
      const spot = c && postSpawn(s, c);
      if (!c || !spot) return false;
      const m = spawnUnit(s, unitFor(p.tribe, 'warrior'), pid, spot.x, spot.y, null);
      m.data = { ...(m.data ?? {}), militia: true };
      m.moved = m.attacked = false; // an emergency levy: it stands ready to fight at once
      c.data = { ...(c.data ?? {}), rally: s.turn + RALLY_COOLDOWN };
      emit({ type: 'harvest', player: pid, x: spot.x, y: spot.y, pop: 0 });
      emit({ type: 'toast', player: pid, text: `${name} rallies the militia of ${c.name}!` });
      log(s, `The ${people(s, pid)}s rally militia at ${c.name}.`);
      return true; // a call to arms, not a day's work: the recruiter keeps its turn
    }
    case 'fort':
      tg.improvement = 'fort';
      tg.data = { ...(tg.data ?? {}), sfort: pid };
      emit({ type: 'harvest', player: pid, x: tg.x, y: tg.y, pop: 0 });
      log(s, `${people(s, pid)} ${name} raise a fort.`);
      return used();
    case 'bridge':
      tg.terrain = 'bridge';
      tg.road = true;
      tg.data = { ...(tg.data ?? {}), bridge: pid };
      bridgesBuilt++;
      emit({ type: 'harvest', player: pid, x: tg.x, y: tg.y, pop: 0 });
      log(s, `${people(s, pid)} ${name} bridge the shallows.`);
      payRoadBonuses(s, pid);
      return used();
    case 'undermine': {
      const c = cityById(s, tg.cityId);
      if (!c) return false;
      c.data = { ...(c.data ?? {}), mined: s.turn + UNDERMINE_TURNS };
      emit({ type: 'toast', player: pid, text: `${c.name} is undermined: its walls count for nothing for ${UNDERMINE_TURNS} turns.` });
      if (!isNeutral(s, c.owner)) emit({ type: 'toast', player: c.owner, text: `${people(s, pid)} sappers have undermined ${c.name}! Its walls are useless for ${UNDERMINE_TURNS} turns.` });
      log(s, `${people(s, pid)} ${name} undermine ${c.name}.`);
      return used();
    }
    case 'build': {
      // the ordinary build, with the Stars it charged handed back: the builder's half price was paid already
      const arg = parts.arg!;
      const charged = tileActions(s, pid, tg).find((a) => a.id === arg)?.cost ?? 0;
      const before = p.stars;
      const float = 1_000_000;
      p.stars += float;
      const ok = doAction(s, pid, tg, arg);
      p.stars = ok ? p.stars - float + charged : before;
      if (!ok) return false;
      log(s, `${people(s, pid)} ${name} builds a ${arg}.`);
      return used();
    }
    case 'upgrade':
      if (!tg.improvement || !raiseTile(s, pid, tg, true)) return false;
      log(s, `${people(s, pid)} ${name} raises ${aName(levelName(tg)!)}.`);
      return used();
    case 'fish': {
      const r = tg.resource;
      const c = nearestCity(s, pid, tg);
      if ((r !== 'fish' && r !== 'whale') || !c) return false;
      const k = CATCH[r];
      tg.resource = null;
      p.stars += k.stars;
      emit({ type: 'stars', player: pid, x: tg.x, y: tg.y, amount: k.stars });
      addPop(s, c, k.pop);
      emit({ type: 'harvest', player: pid, x: c.x, y: c.y, pop: k.pop });
      return used();
    }
    case 'outpost': {
      if (outpostWhy(s, pid, tg)) return false;
      const c = foundCity(s, tg.x, tg.y, pid, false);
      c.data = { ...(c.data ?? {}), outpost: true };
      // the ship's crew settle the new city: used up, not killed, and its home city gets the slot back
      s.units = s.units.filter((x) => x !== u);
      const hc = cityById(s, u.homeCity);
      if (hc) hc.units = Math.max(0, hc.units - 1);
      emit({ type: 'capture', player: pid, cityId: c.id, from: null });
      emit({ type: 'toast', player: pid, text: `${name} founds the outpost of ${c.name}!` });
      log(s, `The ${people(s, pid)}s found an outpost at ${c.name}.`);
      revealAround(s, pid);
      return true;
    }
  }
  return false;
}

/** A few words for a role unit's panel: what it is doing or could do where it stands. */
export function rolePreview(s: GameState, u: Unit): string {
  const c = postedCity(s, u);
  switch (u.kind) {
    case 'recruiter':
      return c ? `Stationed in ${c.name}: units cost ${RECRUIT_DISCOUNT}★ less there, +${RECRUIT_CAP} unit slot. Rally Militia ${rallyLeft(s, c) ? `in ${rallyLeft(s, c)} turns` : 'ready when foes come near'}.`
        : 'Walk it into one of your cities and Station it there. Killing it pays the enemy a bounty.';
    case 'collector':
      return c ? `Stationed in ${c.name}: +${cityTax(s, c)}★ a turn in taxes.` : 'Walk it into one of your cities and Station it there for +50% Stars. Fragile: killing it pays the enemy a bounty.';
    case 'sapper': return 'Lays a road wherever it marches. Build a fort where it stands, a bridge over a shallow beside it (tap the water), or undermine an enemy city beside it.';
    case 'builder': return 'Tap a tile of yours beside it (or its own) to build there at half price, or to raise an improved tile to its next level at half price (once per city it may skip the tech).';
    case 'fishfleet': return `Earns ${FLEET_STARS}★ a turn at sea. Sail onto fish or whales anywhere to bring in the catch.`;
    case 'voyager': return s.players[u.owner].tribe === 'pirates' ? 'A long-range scout: the Brethren hold no land, so it explores the seas (sees 3 tiles).' : `Explore the seas and found an outpost on an empty unclaimed coast (${Math.max(0, outpostRoom(s, u.owner))} allowed now; one for every 2 cities).`;
  }
  return '';
}

// ---------------------------------------------------------------- the mechanic hooks

const pavable = (s: GameState, pid: number, t: Tile | undefined): t is Tile => {
  if (!t || !isLand(t) || t.terrain === 'mountain' || t.cityId !== null || t.road || isLava(t)) return false;
  const o = tileOwnerPlayer(s, t);
  return o === null || o === pid;
};

export const ROLE_MECH: Mechanic = {
  name: 'Role units',
  blurb: 'Each empire type trains two role units of its own.',

  turnStart(s) { roleSweep(s); },
  income(s, owner) { return fleetIncome(s, owner); },

  stat(s, owner, u, stat) {
    if (stat !== 'def' || u.owner !== owner) return 0;
    const t = tileAt(s, u.x, u.y);
    return t && isSapperFort(t) && t.data!.sfort === owner ? FORT_DEF : 0;
  },

  afterMove(s, owner, u, from, to) {
    if (u.owner !== owner) return;
    if (u.kind === 'sapper' && !u.carrying) { // roads wherever the sappers march
      let paved = false;
      for (const t of [tileAt(s, from.x, from.y), to]) if (pavable(s, owner, t)) { t.road = true; paved = true; }
      if (paved) payRoadBonuses(s, owner);
    }
    if (u.data && 'post' in u.data) roleSweep(s);
  },
  unitDied(s, owner, u, killer) {
    if (u.owner === owner && (u.data?.post !== undefined)) roleSweep(s);
    const n = BOUNTY[u.carrying ?? u.kind];
    if (!n || !killer || killer.owner !== owner || u.owner === owner || isNeutral(s, owner)) return;
    s.players[owner].stars += n;
    emit({ type: 'stars', player: owner, x: u.x, y: u.y, amount: n });
    emit({ type: 'toast', player: owner, text: `Bounty: ${roleName(s.players[u.owner].tribe, u.carrying ?? u.kind)} slain, +${n}★.` });
  },
  cityCaptured(s, owner, c) { if (c.owner === owner) roleSweep(s); },
};

// ---------------------------------------------------------------- computer players

/** Walk or sail `u` one move closer to the nearest goal (to within `near` of it). */
function stepToward(s: GameState, u: Unit, goals: { x: number; y: number }[], near = 0): boolean {
  if (u.moved || !goals.length) return false;
  const d = (x: number, y: number) => Math.min(...goals.map((g) => Math.max(0, dist(x, y, g.x, g.y) - near)));
  const naval = UNITS[u.kind].naval;
  const danger = (x: number, y: number) => (s.units.some((e) => e.owner !== u.owner && hostile(s, u.owner, e.owner) && UNITS[e.kind].atk > 0 && dist(e.x, e.y, x, y) <= 1) ? 1.5 : 0);
  const here = d(u.x, u.y);
  const best = moveOptions(s, u)
    .filter((o) => !o.embark && !o.disembark && !(naval && nearBeast(s, o.x, o.y)))
    .map((o) => ({ o, v: d(o.x, o.y) + danger(o.x, o.y) }))
    .sort((a, b) => a.v - b.v)[0];
  return !!best && best.v < here && moveUnit(s, u, best.o.x, best.o.y);
}

/** Does the enabled action `verb` exist for `u`? Returns its id (the best by `rank`, if given, and only one worth `min`). */
function pick(s: GameState, pid: number, u: Unit, verb: string, rank?: (a: RoleAct) => number, min = -Infinity): string | null {
  const acts = unitActs(s, pid, u).filter((a) => a.enabled && a.id.startsWith(`role:${verb}:`) && (!rank || rank(a) >= min));
  if (!acts.length) return null;
  return (rank ? acts.sort((a, b) => rank(b) - rank(a)) : acts)[0].id;
}
const run = (s: GameState, pid: number, u: Unit, id: string | null) => !!id && doAction(s, pid, tileAt(s, u.x, u.y)!, id);

/** Own cities a stationed unit could still serve, best first (by `worth`), with their tile free or already its own. */
function postTargets(s: GameState, pid: number, u: Unit, worth: (c: City) => number) {
  return citiesOf(s, pid)
    .filter((c) => !postAt(s, c) && (!unitAt(s, c.x, c.y) || unitAt(s, c.x, c.y) === u) && isLand(tileAt(s, c.x, c.y)!))
    .sort((a, b) => worth(b) - dist(b.x, b.y, u.x, u.y) / 3 - (worth(a) - dist(a.x, a.y, u.x, u.y) / 3));
}

/** Own tiles a Master Builder could work on: a build waiting for it, or a grand work to raise. */
function builderSpots(s: GameState, pid: number): Tile[] {
  const p = s.players[pid];
  return s.tiles.filter((t) => {
    if (tileOwnerPlayer(s, t) !== pid || t.cityId !== null || campAt(s, t.x, t.y)) return false;
    if (t.improvement) return !!nextLevel(s, pid, t, { half: true, skip: true }) && !nextLevel(s, pid, t, { half: true, skip: true })!.needs;
    if (t.resource === 'crop') return hasTech(s, pid, 'farming');
    if (t.resource === 'ore') return hasTech(s, pid, 'mining');
    return t.terrain === 'shallow' && !t.resource && hasTech(s, pid, 'fishing') && p.tribe !== 'polynesia'
      && !s.tiles.some((x) => x.improvement === 'port' && tileOwnerPlayer(s, x) === pid);
  });
}

/** Fish and whales at sea `pid` knows of, not under another ship. */
const catchSpots = (s: GameState, pid: number) =>
  s.tiles.filter((t) => isWater(t) && (t.resource === 'fish' || t.resource === 'whale') && !t.improvement && restLeft(t) <= 0 && isExplored(s, pid, t.x, t.y) && !unitAt(s, t.x, t.y));
/** Land `pid` knows of where an outpost could stand. */
const outpostSites = (s: GameState, pid: number) =>
  s.tiles.filter((t) => isExplored(s, pid, t.x, t.y) && !outpostWhy(s, pid, t) && neighbors(s, t.x, t.y).some(isWater));
/** Explored water beside the unknown. */
const seaFrontier = (s: GameState, pid: number) =>
  s.tiles.filter((t) => isWater(t) && isExplored(s, pid, t.x, t.y) && neighbors(s, t.x, t.y).some((n) => !isExplored(s, pid, n.x, n.y)));

function unitStep(s: GameState, pid: number, u: Unit): boolean {
  const p = s.players[pid];
  switch (u.kind) {
    case 'recruiter':
    case 'collector': {
      const c = postedCity(s, u);
      if (c) return u.kind === 'recruiter' && run(s, pid, u, pick(s, pid, u, 'rally'));
      if (run(s, pid, u, pick(s, pid, u, 'station'))) return true;
      const worth = u.kind === 'recruiter' ? (k: City) => k.level * 2 + (k.capital ? 2 : 0) + (threatNear(s, k) ? 4 : 0) : (k: City) => cityIncome(s, k);
      const goal = postTargets(s, pid, u, worth)[0];
      return !!goal && stepToward(s, u, [goal]);
    }
    case 'sapper': {
      const soldiers = (c: City) => s.units.some((m) => m.owner === pid && !isRoleUnit(m) && UNITS[m.kind].atk > 0 && dist(m.x, m.y, c.x, c.y) <= 2);
      if (run(s, pid, u, pick(s, pid, u, 'undermine', (a) => (soldiers(cityById(s, s.tiles[a.target].cityId)!) ? 1 : 0), 1))) return true; // only for a siege
      const foes = s.units.some((e) => e.owner !== pid && hostile(s, pid, e.owner) && !isNeutral(s, e.owner) && UNITS[e.kind].atk > 0 && dist(e.x, e.y, u.x, u.y) <= 2);
      if (foes && p.stars >= FORT_COST + 3 && run(s, pid, u, pick(s, pid, u, 'fort'))) return true;
      if (p.stars >= BRIDGE_COST + 4 && run(s, pid, u, pick(s, pid, u, 'bridge', (a) => bridgeWorth(s, pid, u, s.tiles[a.target]), 1))) return true;
      if (u.moved) return false;
      // march on the nearest enemy city (paving the way), or else pave a road between two of our cities not yet linked
      const enemy = s.cities.filter((c) => c.owner !== pid && hostile(s, pid, c.owner) && isExplored(s, pid, c.x, c.y) && dist(c.x, c.y, u.x, u.y) <= 10);
      if (enemy.length && stepToward(s, u, enemy, 1)) return true;
      const pair = unlinked(s, pid);
      if (!pair) return false;
      // walk to the nearer end, then along to the other
      const [a, b] = dist(u.x, u.y, pair[0].x, pair[0].y) <= dist(u.x, u.y, pair[1].x, pair[1].y) ? pair : [pair[1], pair[0]];
      return u.x === a.x && u.y === a.y ? stepToward(s, u, [b]) : stepToward(s, u, [dist(u.x, u.y, a.x, a.y) <= 1 ? b : a]);
    }
    case 'builder': {
      const rank = (a: RoleAct) => (a.id.startsWith('role:upgrade') ? 3 : 4) - a.cost / 4;
      const id = pick(s, pid, u, 'build', rank) ?? pick(s, pid, u, 'upgrade', rank);
      if (id) {
        const cost = unitActs(s, pid, u).find((a) => a.id === id)!.cost;
        if (p.stars >= cost + (id.startsWith('role:upgrade') ? 6 : 2) && run(s, pid, u, id)) return true;
      }
      if (u.moved) return false;
      return stepToward(s, u, builderSpots(s, pid), 1);
    }
    case 'fishfleet':
      if (run(s, pid, u, pick(s, pid, u, 'fish'))) return true;
      return stepToward(s, u, catchSpots(s, pid)) || stepToward(s, u, seaFrontier(s, pid));
    case 'voyager': {
      const rank = (a: RoleAct) => neighbors(s, s.tiles[a.target].x, s.tiles[a.target].y).filter((n) => isLand(n) && n.owner === null).length + (s.tiles[a.target].resource ? 1 : 0);
      if (run(s, pid, u, pick(s, pid, u, 'outpost', rank))) return true;
      if (outpostRoom(s, pid) > 0) { const sites = outpostSites(s, pid); if (sites.length && stepToward(s, u, sites, 1)) return true; }
      return stepToward(s, u, seaFrontier(s, pid));
    }
  }
  return false;
}

/** The nearest two of `pid`'s cities not yet joined by road, within 8 tiles of each other. */
function unlinked(s: GameState, pid: number): [City, City] | null {
  const cs = citiesOf(s, pid);
  let best: [City, City] | null = null, bd = 9;
  for (const a of cs) {
    const linked = roadNetwork(s, a).linked;
    for (const b of cs) {
      if (b.id <= a.id || linked.includes(b.id)) continue;
      const d = dist(a.x, a.y, b.x, b.y);
      if (d < bd) { bd = d; best = [a, b]; }
    }
  }
  return best;
}

/** Would a bridge over `w` join this sapper's land to land it can't otherwise walk to? */
function bridgeWorth(s: GameState, pid: number, u: Unit, w: Tile): number {
  const lands = neighbors(s, w.x, w.y).filter((n) => isLand(n) && n.terrain !== 'mountain');
  const reach = new Set<number>([idx(s, tileAt(s, u.x, u.y)!)]);
  const queue = [tileAt(s, u.x, u.y)!];
  for (let h = 0; h < queue.length && reach.size < 400; h++) {
    for (const n of neighbors(s, queue[h].x, queue[h].y)) {
      const i = idx(s, n);
      if (reach.has(i) || !isLand(n)) continue;
      reach.add(i);
      queue.push(n);
    }
  }
  const across = lands.filter((n) => !reach.has(idx(s, n)));
  if (!across.length) return -1;
  // worth it when there is something to reach over there
  const prize = s.cities.some((c) => c.owner !== pid && across.some((n) => dist(n.x, n.y, c.x, c.y) <= 4)) || s.tiles.some((t) => t.village && across.some((n) => dist(n.x, n.y, t.x, t.y) <= 3));
  return prize ? 2 : 0.5;
}

/** Should `pid` train a role unit of `kind` now? */
function wantRole(s: GameState, pid: number, kind: UnitKind): boolean {
  const p = s.players[pid];
  const mine = s.units.filter((u) => u.owner === pid && (u.carrying ?? u.kind) === kind);
  const cities = citiesOf(s, pid);
  switch (kind) {
    case 'recruiter':
      return mine.every((u) => postedCity(s, u)) && mine.length < Math.ceil(cities.length / 2) && p.stars >= 8;
    case 'collector':
      return mine.every((u) => postedCity(s, u)) && mine.length < Math.ceil(cities.length / 2) && cities.some((c) => !postAt(s, c) && cityIncome(s, c) >= 6) && p.stars >= 9;
    case 'sapper': // for a war within reach, or roads to lay between our cities
      return mine.length < 1 && s.turn >= 5 && p.stars >= 9
        && (s.cities.some((c) => c.owner !== pid && hostile(s, pid, c.owner) && isExplored(s, pid, c.x, c.y) && cities.some((m) => dist(m.x, m.y, c.x, c.y) <= 8)) || !!unlinked(s, pid));
    case 'builder':
      return mine.length < 1 && p.stars >= 9 && builderSpots(s, pid).length >= 2;
    case 'fishfleet':
      return mine.length < (cities.length >= 4 ? 2 : 1) && p.stars >= 8 && catchSpots(s, pid).filter((t) => tileOwnerPlayer(s, t) !== pid).length >= 2;
    case 'voyager':
      return mine.length < 1 && outpostRoom(s, pid) > 0 && p.tribe !== 'pirates' && p.stars >= 12 && (outpostSites(s, pid).length > 0 || seaFrontier(s, pid).length > 0);
  }
  return false;
}

/**
 * One role-unit step for a computer player: station recruiters and tax collectors in their best cities and rally the
 * militia when a city is threatened, send sappers to dig in, bridge and undermine, builders to build and upgrade,
 * fleets to the fishing grounds and voyagers to settle new coasts; or train one when it would pay.
 */
export function roleAi(s: GameState, pid: number): boolean {
  const p = s.players[pid];
  if (p.human || p.neutral) return false;
  const key = `${s.turn}:${pid}`;
  if (key !== memo.key || s !== memo.state) Object.assign(memo, { key, state: s, idle: new Set<number>(), trained: false });
  for (const u of s.units) {
    if (u.owner !== pid || u.carrying || !isRoleKind(u.kind) || (u.moved && u.attacked) || memo.idle.has(u.id)) continue;
    if (unitStep(s, pid, u)) return true;
    memo.idle.add(u.id); // nothing to do this turn: don't ask again
  }
  if (memo.trained) return false;
  for (const kind of roleKindsOf(p.tribe)) {
    if (!hasTech(s, pid, UNITS[kind].tech) || !wantRole(s, pid, kind)) continue;
    for (const c of citiesOf(s, pid).sort((a, b) => b.level - a.level || a.id - b.id)) {
      if (UNITS[kind].naval && !shipSpawn(s, c)) continue;
      const t = tileAt(s, c.x, c.y)!;
      const a = tileActions(s, pid, t).find((x) => x.id === `train:${kind}`);
      if (a?.enabled) return doAction(s, pid, t, a.id);
    }
  }
  memo.trained = true; // looked once this turn
  return false;
}
/** Per-turn scratch memory of the computer's role units, so an idle one is not reconsidered at every step. */
const memo: { key: string; state: GameState | null; idle: Set<number>; trained: boolean } = { key: '', state: null, idle: new Set(), trained: false };

/** How much the computer wants a tech that unlocks one of its role units (0 when it unlocks none). */
export const roleTechWant = (s: GameState, pid: number, tech: string) => (roleKindsOf(s.players[pid].tribe).some((k) => UNITS[k].tech === tech) ? 5 : 0);

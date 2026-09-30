// Dynamic Cultural Assimilation, part 2: Rebellion and Rogue States.
//
// A conquered city (its origin people, `city.data.origin`, is not its owner's) grows restless when it is left alone far
// from home. It is switched on per game (`NewGameOptions.rebels`, on by default on the new-game screen) and does not
// need wild events: the first revolt adds the neutral owner (game/wild `ensureNeutral`) if the game has none.
//  - UNREST. Each turn, at the start of its owner's turn (`cultureUnrest`, called by turn.startTurn), the city's meter
//    (`city.data.unrest` = { pid, n, brink }) moves by `unrestFactors`: +1 when no friendly unit stands on it or next to
//    it, +1 more when it is also far from the owner's capital; a unit on the city tile calms it by 2, one next to it by 1,
//    and a road link to the capital, a temple in its territory or having adopted that people's ways (game/culture)
//    each calm it by 1 more. The meter belongs to its owner: a city that changes hands starts again from 0.
//  - REVOLT. When the meter is full the owner is warned ("on the brink"); if it is still full at the start of their
//    next turn the city breaks away. It passes to the neutral owner as a Rogue State and raises 1-2 defenders scaled by
//    its level. Capitals, an empire's last city and cities afloat (the Maori Great Waka) never rebel.
//  - ROGUE STATES. Their units (`unit.data.rogue` = the city id) hold their ground and strike any empire's unit next to
//    them once a round, after the last empire (`rogueRound`, run by game/wild.wildRound). A Rogue State whose defenders
//    are all gone musters a new warrior every few rounds. Any empire can capture it the ordinary way.
//  - AI. Computer empires garrison restless cities (`rebelAi`) and keep a guard in them (`holdsPost`).
import { TRIBES } from '../data/tribes';
import { govCalm } from './governors';
import { UNITS } from '../data/units';
import { adoptedOf, cityOrigin } from './culture';
import { emit } from './events';
import { dist, isLand, neighbors, tileAt } from './grid';
import { roadNetwork } from './network';
import { attackOptions, attack, citiesOf, cityById, def, doAction, maxHp, moveOptions, moveUnit, previewCombat, tileActions, unitAt, unitCap } from './rules';
import type { City, GameState, TribeId, Unit, UnitKind } from './types';
import { empires, ensureNeutral, isLava, isNeutral, spawnNeutral } from './wild';

// ---------------------------------------------------------------- tuning

/** A full meter: at this much unrest the city is on the brink, and revolts a turn later if nothing changes. */
export const UNREST_MAX = 6;
/** A city at least this far from its owner's capital (or of an empire with no capital) is far from home. */
export const FAR = 6;
/** The meter level at which the owner is first told, and the AI sends a garrison. */
export const UNREST_WARN = 3;
/** Rounds a Rogue State with no defenders left needs to muster a new one. */
export const REARM = 5;
/** Health a rogue unit recovers each round. */
export const ROGUE_HEAL = 2;

/** The defenders a Rogue State of this level raises when it breaks away. */
export function rogueGarrison(level: number): UnitKind[] {
  if (level >= 5) return ['defender', 'swordsman'];
  if (level >= 3) return ['defender', 'archer'];
  return ['warrior'];
}

// ---------------------------------------------------------------- queries

export const rebelsOn = (s: GameState) => !!s.rebels;
export const isRogueCity = (s: GameState, c: City) => isNeutral(s, c.owner);
/** Is this a Rogue State's unit? (Great Beasts are neutral too, but hold no city.) */
export const isRogueUnit = (s: GameState, u: Unit) => isNeutral(s, u.owner) && typeof u.data?.rogue === 'number';
/** The people a rogue unit fights for (it is drawn in their colours). */
export const rogueLook = (s: GameState, u: Unit): TribeId | null => (isRogueUnit(s, u) && typeof u.data?.look === 'string' ? (u.data.look as TribeId) : null);

interface Unrest { pid: number; n: number; brink: boolean }

function meter(c: City): Unrest | null {
  const u = c.data?.unrest as Unrest | undefined;
  return u && typeof u.n === 'number' && u.pid === c.owner ? u : null;
}
/** The city's unrest for its current owner (0 when it has none). */
export const unrestOf = (c: City) => meter(c)?.n ?? 0;
/** Will this city revolt at the start of its owner's next turn if nothing changes? */
export const onBrink = (c: City) => !!meter(c)?.brink;

/** Can this city grow restless at all? A conquered, non-capital city of a real empire, while rebellions are on. */
export function subject(s: GameState, c: City): boolean {
  if (!rebelsOn(s) || isNeutral(s, c.owner) || c.capital || c.data?.waka) return false;
  return cityOrigin(s, c) !== s.players[c.owner].tribe;
}

export const capitalOf = (s: GameState, pid: number) => citiesOf(s, pid).find((c) => c.capital);

/** Is the city far from its owner's capital (or does its owner have none)? */
export function farFromHome(s: GameState, c: City): boolean {
  const cap = capitalOf(s, c.owner);
  return !cap || dist(cap.x, cap.y, c.x, c.y) >= FAR;
}

/** Is a friendly unit on the city ('on'), next to it ('near'), or neither? */
export function garrison(s: GameState, c: City): 'on' | 'near' | null {
  const here = unitAt(s, c.x, c.y);
  if (here && here.owner === c.owner) return 'on';
  return s.units.some((u) => u.owner === c.owner && dist(u.x, u.y, c.x, c.y) === 1) ? 'near' : null;
}

/** How much the meter moves this turn, and why (plain English, for the city panel). */
export function unrestFactors(s: GameState, c: City): { delta: number; why: string[] } {
  const why: string[] = [];
  let delta = 0;
  const g = garrison(s, c);
  if (g === 'on') { delta -= 2; why.push('garrisoned −2'); }
  else if (g === 'near') { delta -= 1; why.push('guarded −1'); }
  else {
    delta += 1;
    why.push('ungarrisoned +1');
    if (farFromHome(s, c)) { delta += 1; why.push(capitalOf(s, c.owner) ? 'far from the capital +1' : 'no capital +1'); }
  }
  const cap = capitalOf(s, c.owner);
  if (cap && roadNetwork(s, c).linked.includes(cap.id)) { delta -= 1; why.push('road to the capital −1'); }
  if (s.tiles.some((t) => t.owner === c.id && t.improvement === 'temple')) { delta -= 1; why.push('temple −1'); }
  const origin = cityOrigin(s, c);
  if (adoptedOf(s, c.owner).some((a) => a.from === origin)) { delta -= 1; why.push(`${TRIBES[origin].people} ways adopted −1`); }
  return { delta, why };
}

/** One line for the city panel and HUD, e.g. "Unrest 3/6 — garrison it". Null when the city is calm. */
export function unrestLine(s: GameState, c: City): string | null {
  if (!subject(s, c)) return null;
  const n = unrestOf(c);
  const { delta } = unrestFactors(s, c);
  if (n <= 0 && delta <= 0) return null;
  if (onBrink(c)) return `Unrest ${n}/${UNREST_MAX} — revolts next turn unless garrisoned!`;
  return `Unrest ${n}/${UNREST_MAX}${delta > 0 ? ` (+${delta}/turn) — garrison it` : delta < 0 ? ` (${delta}/turn, calming)` : ' (steady)'}`;
}

// ---------------------------------------------------------------- the turn

/** Tells every empire that has seen (x, y), except `but`. */
function tell(s: GameState, x: number, y: number, text: string, but: number) {
  for (const p of empires(s)) if (p.alive && p.id !== but && p.explored[y * s.size + x]) emit({ type: 'toast', player: p.id, text });
}

/**
 * Start of `pid`'s turn: every restless city's meter moves; a city on the brink since last turn whose meter is still
 * full revolts, and one that has just filled up is put on the brink with a warning.
 */
export function cultureUnrest(s: GameState, pid: number): void {
  if (!rebelsOn(s) || s.players[pid].neutral) return;
  for (const c of citiesOf(s, pid)) {
    if (!subject(s, c) || govCalm(c)) { // a Marshal keeps the peace (see game/governors)
      if (c.data?.unrest !== undefined) { const { unrest: _gone, ...rest } = c.data; c.data = rest; }
      continue;
    }
    const before = meter(c) ?? { pid, n: 0, brink: false };
    const n = Math.max(0, Math.min(UNREST_MAX, before.n + unrestFactors(s, c).delta));
    const full = n >= UNREST_MAX;
    const lastCity = citiesOf(s, pid).length <= 1;
    if (full && before.brink && !lastCity && garrison(s, c) !== 'on') { revolt(s, c); continue; }
    c.data = { ...c.data, unrest: { pid, n, brink: full && !lastCity } };
    if (full && !before.brink && !lastCity) {
      emit({ type: 'toast', player: pid, text: `${c.name} is on the brink of revolt! Garrison it this turn or it breaks away as a Rogue State.` });
    } else if (n >= UNREST_WARN && before.n < UNREST_WARN && !full) {
      emit({ type: 'toast', player: pid, text: `Unrest is rising in ${c.name} (${n}/${UNREST_MAX}). Station a unit in or beside it.` });
    }
  }
}

/** A free tile on or around a city for a rebel to stand on. */
function rebelSpot(s: GameState, c: City) {
  const here = tileAt(s, c.x, c.y)!;
  if (!unitAt(s, c.x, c.y)) return here;
  return neighbors(s, c.x, c.y).find((t) => isLand(t) && t.terrain !== 'mountain' && !isLava(t) && t.cityId === null && !unitAt(s, t.x, t.y));
}

function raise(s: GameState, c: City, kind: UnitKind, look: TribeId): Unit | null {
  const t = rebelSpot(s, c);
  if (!t) return null;
  const u = spawnNeutral(s, kind, t.x, t.y);
  u.data = { rogue: c.id, look };
  return u;
}

/** The city breaks away: it passes to the neutral owner as a Rogue State and raises its defenders. */
export function revolt(s: GameState, c: City) {
  const from = c.owner;
  const origin = cityOrigin(s, c);
  const n = ensureNeutral(s);
  const { unrest: _gone, ...rest } = c.data ?? {};
  c.data = { ...rest, origin, rogue: { from, turn: s.turn } };
  c.owner = n;
  c.capital = false;
  c.pendingRewards = [];
  c.units = 0;
  for (const u of s.units) if (u.homeCity === c.id) u.homeCity = null; // its old soldiers are now unsupported
  const raised = rogueGarrison(c.level).map((k) => raise(s, c, k, origin)).filter((u): u is Unit => !!u);
  const who = TRIBES[s.players[from].tribe].people;
  emit({ type: 'toast', player: from, text: `${c.name} revolts! It breaks away as a Rogue State with ${raised.length} defender${raised.length === 1 ? '' : 's'}. Retake it by force.` });
  tell(s, c.x, c.y, `${c.name} throws off ${who} rule and stands alone as a Rogue State.`, from);
  s.log.push({ turn: s.turn, text: `${c.name} rebels against the ${who}s and becomes a Rogue State.` });
}

// ---------------------------------------------------------------- the Rogue States' round

/** Once a round, after the last empire (called by game/wild.wildRound): rogue units heal and strike, empty states rearm. */
export function rogueRound(s: GameState) {
  for (const c of s.cities) {
    if (!isRogueCity(s, c)) continue;
    const guards = s.units.filter((u) => isRogueUnit(s, u) && u.data!.rogue === c.id);
    if (guards.length) { if (c.data?.rearm !== undefined) { const { rearm: _r, ...rest } = c.data; c.data = rest; } continue; }
    const due = typeof c.data?.rearm === 'number' ? (c.data.rearm as number) : null;
    if (due === null) c.data = { ...c.data, rearm: s.turn + REARM };
    else if (s.turn >= due && !unitAt(s, c.x, c.y)) {
      raise(s, c, 'warrior', cityOrigin(s, c));
      const { rearm: _r, ...rest } = c.data!;
      c.data = rest;
      tell(s, c.x, c.y, `The Rogue State of ${c.name} musters a new defender.`, -1);
    }
  }
  for (const u of s.units.filter((x) => isRogueUnit(s, x))) rogueAct(s, u);
}

function rogueAct(s: GameState, u: Unit) {
  if (u.hp < maxHp(u)) {
    const before = u.hp;
    u.hp = Math.min(maxHp(u), u.hp + ROGUE_HEAL);
    emit({ type: 'heal', unitId: u.id, x: u.x, y: u.y, amount: u.hp - before });
  }
  u.moved = u.attacked = false;
  // strike a unit of any empire that has come next to it, only when the blow is worth the reply
  const best = attackOptions(s, u)
    .filter((e) => !isNeutral(s, e.owner) && dist(e.x, e.y, u.x, u.y) === 1)
    .map((e) => ({ e, ...previewCombat(s, u, e) }))
    .filter((o) => o.kills || (o.dmg >= o.ret && u.hp > o.ret))
    .sort((a, b) => (b.kills ? 100 : 0) + b.dmg - b.ret - ((a.kills ? 100 : 0) + a.dmg - a.ret) || a.e.id - b.e.id)[0];
  if (best) {
    const home = { x: u.x, y: u.y };
    const who = best.e.owner;
    attack(s, u, best.e);
    emit({ type: 'toast', player: who, text: s.units.includes(best.e) ? 'Rebels strike one of your units!' : 'Rebels cut down one of your units!' });
    // a rebel that cleared its foe's tile goes back to its post
    if (s.units.includes(u) && (u.x !== home.x || u.y !== home.y) && !unitAt(s, home.x, home.y)) {
      emit({ type: 'move', unitId: u.id, owner: u.owner, path: [{ x: u.x, y: u.y }, home], embark: false, disembark: false });
      u.x = home.x;
      u.y = home.y;
    }
  }
  u.moved = u.attacked = true;
}

// ---------------------------------------------------------------- AI

/** A restless city of `pid` that needs a guard now. */
const needsGuard = (s: GameState, c: City) => subject(s, c) && garrison(s, c) !== 'on' && (unrestOf(c) >= UNREST_WARN || onBrink(c) || unrestOf(c) + unrestFactors(s, c).delta >= UNREST_MAX);

/** Is this unit guarding a restless city of its own (standing on it while it still has unrest)? It should stay. */
export function holdsPost(s: GameState, u: Unit): boolean {
  if (!rebelsOn(s)) return false;
  const t = tileAt(s, u.x, u.y);
  const c = t && t.cityId !== null ? cityById(s, t.cityId) : undefined;
  return !!c && c.owner === u.owner && subject(s, c) && unrestOf(c) > 0;
}

/** Can this unit be sent off to guard somewhere else? */
const free = (s: GameState, u: Unit) => {
  if (u.moved || def(u).naval || def(u).atk <= 0 || holdsPost(s, u)) return false;
  const t = tileAt(s, u.x, u.y)!;
  return !t.village && !(t.cityId !== null && cityById(s, t.cityId)!.owner !== u.owner); // it is waiting to capture
};

/** One AI step: put a unit into (or next to) the most restless city that has none, or train one there. */
export function rebelAi(s: GameState, pid: number): boolean {
  if (!rebelsOn(s)) return false;
  const cities = citiesOf(s, pid).filter((c) => needsGuard(s, c)).sort((a, b) => unrestOf(b) - unrestOf(a) || a.id - b.id);
  for (const c of cities) {
    const mine = s.units.filter((u) => u.owner === pid && free(s, u)).sort((a, b) => dist(a.x, a.y, c.x, c.y) - dist(b.x, b.y, c.x, c.y) || a.id - b.id);
    // 1. someone who can reach the city (or its edge) this turn
    for (const u of mine) {
      const opts = moveOptions(s, u).filter((o) => !o.embark && !o.disembark);
      const onIt = opts.find((o) => o.x === c.x && o.y === c.y);
      if (onIt) return moveUnit(s, u, c.x, c.y);
      if (garrison(s, c) === 'near') continue;
      const edge = opts.filter((o) => dist(o.x, o.y, c.x, c.y) === 1).sort((a, b) => a.y - b.y || a.x - b.x)[0];
      if (edge && dist(u.x, u.y, c.x, c.y) > 1) return moveUnit(s, u, edge.x, edge.y);
    }
    // 2. a new recruit on the city tile itself
    const t = tileAt(s, c.x, c.y)!;
    if (!unitAt(s, c.x, c.y) && c.units < unitCap(c)) {
      const train = tileActions(s, pid, t).filter((a) => a.enabled && a.id.startsWith('train:'))
        .sort((a, b) => UNITS[b.id.slice(6) as UnitKind].def - UNITS[a.id.slice(6) as UnitKind].def || a.cost - b.cost)[0];
      if (train && doAction(s, pid, t, train.id)) return true;
    }
    // 3. the nearest unit within reach heads that way
    for (const u of mine) {
      if (dist(u.x, u.y, c.x, c.y) > 6) break;
      const here = dist(u.x, u.y, c.x, c.y);
      const step = moveOptions(s, u).filter((o) => !o.embark && !o.disembark && dist(o.x, o.y, c.x, c.y) < here)
        .sort((a, b) => dist(a.x, a.y, c.x, c.y) - dist(b.x, b.y, c.x, c.y) || a.y - b.y || a.x - b.x)[0];
      if (step) return moveUnit(s, u, step.x, step.y);
    }
  }
  return false;
}

// ---------------------------------------------------------------- descriptions

/** Title and text for a Rogue State's city panel. Plain text, no UI. */
export function rogueDescribe(s: GameState, c: City): string {
  const r = c.data?.rogue as { from?: number } | undefined;
  const from = typeof r?.from === 'number' && s.players[r.from] ? `${TRIBES[s.players[r.from].tribe].people} rule` : 'its masters';
  const guards = s.units.filter((u) => isRogueUnit(s, u) && u.data!.rogue === c.id).length;
  return `Rogue State · level ${c.level} · broke away from ${from}. ${guards ? `${guards} rebel${guards === 1 ? '' : 's'} guard it` : 'Its rebels are gone'}: defeat them and capture it.`;
}

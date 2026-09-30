// World Wonders: one-of-a-kind great works (the list is in data/wonders.ts). State lives in `GameState.wonders`
// (created when the first one is begun), so saves work and older saves simply have none.
//
//  - Begin. Once an empire knows a wonder's tech it may begin it on an empty tile of its land that suits it (a
//    mountain for Machu Picchu, a coast for the Lighthouse...): "Begin <Wonder>" in that tile's menu. An empire raises
//    one great work at a time.
//  - Invest. A wonder is paid for over several turns: up to INVEST_CAP Stars a turn from the site's tile menu (the
//    first chunk is paid on beginning), until its cost is reached. Paying over turns (rather than at once) makes it a
//    visible race: everyone can follow each site's progress on the Wonders screen, rivals can hurry or give up, and a
//    rich empire cannot simply buy every wonder the turn its tech arrives. Its own historical wonder costs an empire a
//    quarter less (Egypt's Pyramids, Rome's Colosseum...).
//  - Complete. The first to finish takes it; every rival site of that wonder is closed and REFUND_SHARE of what it
//    put in comes back. A site is also closed (and partly refunded) when its land is lost or it is abandoned.
//  - Hold. A finished wonder gives its holder a big lasting bonus (perks, see game/perks) and WONDER_SCORE points.
//    It stands on its tile and changes hands with the land it stands on.
import { TECH_BY_ID } from '../data/techs';
import { TRIBES } from '../data/tribes';
import { WONDER_BY_ID, WONDER_SCORE, WONDERS, wonderHolder, wondersHeldBy, type WonderDef } from '../data/wonders';
import { emit } from './events';
import { dist, isWater, neighbors, tileAt } from './grid';
import { revealAround } from './mapgen';
import { describePerk } from './perks';
import { addPop, citiesOf, doAction, hasTech, researchable, techCost, tileActions, tileOwnerPlayer, unitAt, type Action } from './rules';
import { campAt, isLava } from './wild';
import type { BuiltWonder, GameState, Tile, WonderSite, WonderState } from './types';

// ---------------------------------------------------------------- tuning

/** Most Stars an empire may put into its site in one turn. */
export const INVEST_CAP = 10;
/** Share of the cost an empire's own historical wonder is cheaper by. */
export const HOME_DISCOUNT = 0.25;
/** Each wonder an empire already holds makes its next one this share dearer, so one rich empire cannot take them all. */
export const HELD_SURCHARGE = 0.25;
/** Share of the Stars put in that comes back when a site is closed (a rival finished first, the land was lost...). */
export const REFUND_SHARE = 0.5;

// ---------------------------------------------------------------- small queries

const state = (s: GameState): WonderState => (s.wonders ??= { sites: [], built: [] });
export const isHomeWonder = (s: GameState, pid: number, id: string) => WONDER_BY_ID[id].home.includes(s.players[pid].tribe);
/** Stars `pid` needs to finish wonder `id`: a quarter less for its own history, a quarter more for each wonder it already holds. */
export const wonderCost = (s: GameState, pid: number, id: string) =>
  Math.round(WONDER_BY_ID[id].cost * (isHomeWonder(s, pid, id) ? 1 - HOME_DISCOUNT : 1) * (1 + HELD_SURCHARGE * wondersHeldBy(s, pid).filter((w) => w !== id).length));
export const builtWonder = (s: GameState, id: string): BuiltWonder | undefined => s.wonders?.built.find((b) => b.id === id);
export const builtAt = (s: GameState, x: number, y: number): BuiltWonder | undefined => s.wonders?.built.find((b) => b.x === x && b.y === y);
export const siteAt = (s: GameState, x: number, y: number): WonderSite | undefined => s.wonders?.sites.find((w) => w.x === x && w.y === y);
/** The great work `pid` is raising, if any. */
export const siteOf = (s: GameState, pid: number): WonderSite | undefined => s.wonders?.sites.find((w) => w.pid === pid);
export const sitesOf = (s: GameState, id: string): WonderSite[] => s.wonders?.sites.filter((w) => w.id === id) ?? [];
/** Does a wonder (finished or being raised) stand on this tile? Nothing else may be built there. */
export const wonderOn = (s: GameState, t: Tile) => !!(builtAt(s, t.x, t.y) ?? siteAt(s, t.x, t.y));
/** Stars `pid` may still put into its site this turn. */
export const investRoom = (s: GameState, w: WonderSite) =>
  Math.max(0, Math.min(INVEST_CAP - (w.lastTurn === s.turn ? w.lastPaid : 0), wonderCost(s, w.pid, w.id) - w.paid));

/** Why `pid` may not begin wonder `w` on tile `t` (null: it may). Ignores stars and any other site it runs. */
export function siteProblem(s: GameState, pid: number, t: Tile, w: WonderDef): string | null {
  if (builtWonder(s, w.id)) return `${w.name} already stands`;
  if (!hasTech(s, pid, w.tech)) return `Needs ${TECH_BY_ID[w.tech].name}`;
  if (tileOwnerPlayer(s, t) !== pid) return 'Must be on your own land';
  if (t.cityId !== null || t.village || t.ruin || t.improvement || t.resource || campAt(s, t.x, t.y) || isLava(t) || wonderOn(s, t)) return 'Needs an empty tile';
  if (!w.terrain.includes(t.terrain)) return `Needs ${w.terrain.join(' or ')}`;
  if (w.coast && !neighbors(s, t.x, t.y).some(isWater)) return 'Needs a coast';
  const u = unitAt(s, t.x, t.y);
  if (u && u.owner !== pid) return 'An enemy stands there';
  return null;
}

// ---------------------------------------------------------------- tile menu

/** The wonder entries in `pid`'s tile menu: begin one here, or invest in (or abandon) the site standing here. */
export function wonderActions(s: GameState, pid: number, t: Tile): Action[] {
  const p = s.players[pid];
  if (!p || p.neutral || !p.alive) return [];
  const site = siteAt(s, t.x, t.y);
  if (site) {
    if (site.pid !== pid) return [];
    const w = WONDER_BY_ID[site.id];
    const room = investRoom(s, site);
    const left = wonderCost(s, pid, site.id) - site.paid;
    const acts: Action[] = [];
    const amounts = room >= 4 ? [room, Math.ceil(room / 2)] : room > 0 ? [room] : [];
    for (const n of amounts) acts.push({
      id: `wonder:invest:${n}`, label: `Invest ${n}★`, cost: n, icon: `wonder:${site.id}`,
      desc: `Put ${n}★ into the ${w.name} (${site.paid}/${site.paid + left}★ so far${n >= left ? ': this finishes it!' : ''}). Up to ${INVEST_CAP}★ a turn.`,
      enabled: p.stars >= n, reason: p.stars < n ? 'Not enough stars' : undefined,
    });
    if (!amounts.length) acts.push({ id: 'wonder:invest:0', label: 'Invest', cost: 0, icon: `wonder:${site.id}`, desc: '', enabled: false, reason: `Up to ${INVEST_CAP}★ a turn: invest again next turn` });
    acts.push({
      id: 'wonder:abandon', label: 'Abandon', cost: 0, icon: 'axe', enabled: true,
      desc: `Give up the ${w.name} and get ${Math.floor(site.paid * REFUND_SHARE)}★ of the ${site.paid}★ back.`,
    });
    return acts;
  }
  // at most one great work at a time: while one rises, no other can be begun (the Wonders screen says so)
  if (siteOf(s, pid)) return [];
  const acts: Action[] = [];
  for (const w of WONDERS) {
    if (!hasTech(s, pid, w.tech) || siteProblem(s, pid, t, w)) continue;
    const cost = wonderCost(s, pid, w.id);
    const first = Math.min(INVEST_CAP, cost);
    acts.push({
      id: `wonder:begin:${w.id}`, label: `Begin ${w.name}`, cost: first, icon: `wonder:${w.id}`,
      desc: `A World Wonder (${cost}★${isHomeWonder(s, pid, w.id) ? ', your own history makes it cheaper' : ''}, up to ${INVEST_CAP}★ a turn; ${first}★ now). ${wonderBonus(w)}`,
      enabled: p.stars >= first, reason: p.stars < first ? 'Not enough stars' : undefined,
    });
  }
  return acts;
}

/** Performs a wonder action from the tile menu (the rules have already charged its cost). */
export function wonderDoAction(s: GameState, pid: number, t: Tile, id: string): boolean {
  if (id.startsWith('wonder:begin:')) {
    const w = WONDER_BY_ID[id.slice('wonder:begin:'.length)];
    const first = Math.min(INVEST_CAP, wonderCost(s, pid, w.id));
    const site: WonderSite = { id: w.id, pid, x: t.x, y: t.y, paid: first, started: s.turn, lastTurn: s.turn, lastPaid: first };
    state(s).sites.push(site);
    tellMet(s, pid, `The ${TRIBES[s.players[pid].tribe].people}s have begun the ${w.name}.`);
    emit({ type: 'toast', player: pid, text: `Work begins on the ${w.name}: ${first}/${wonderCost(s, pid, w.id)}★. Invest up to ${INVEST_CAP}★ a turn from its tile.` });
    s.log.push({ turn: s.turn, text: `${TRIBES[s.players[pid].tribe].people}s begin the ${w.name}.` });
    emit({ type: 'harvest', player: pid, x: t.x, y: t.y, pop: 0 });
    if (site.paid >= wonderCost(s, pid, w.id)) complete(s, site);
    return true;
  }
  const site = siteAt(s, t.x, t.y);
  if (!site || site.pid !== pid) return false;
  if (id === 'wonder:abandon') {
    close(s, site, `You abandon the ${WONDER_BY_ID[site.id].name}`);
    return true;
  }
  const n = Number(id.slice('wonder:invest:'.length));
  site.paid += n;
  site.lastPaid = (site.lastTurn === s.turn ? site.lastPaid : 0) + n;
  site.lastTurn = s.turn;
  emit({ type: 'harvest', player: pid, x: t.x, y: t.y, pop: 0 });
  if (site.paid >= wonderCost(s, pid, site.id)) complete(s, site);
  return true;
}

/** Closes a site with a partial refund to its builder. */
function close(s: GameState, site: WonderSite, why: string) {
  const w = state(s);
  w.sites = w.sites.filter((x) => x !== site);
  const back = Math.floor(site.paid * REFUND_SHARE);
  const p = s.players[site.pid];
  if (!p?.alive) return;
  p.stars += back;
  if (back) emit({ type: 'stars', player: site.pid, x: site.x, y: site.y, amount: back });
  emit({ type: 'toast', player: site.pid, text: `${why}: ${back}★ of the ${site.paid}★ put in comes back.` });
}

/** The first to finish takes the wonder: rivals' sites of it close with a partial refund, and everyone who knows the builder hears. */
function complete(s: GameState, site: WonderSite) {
  const w = WONDER_BY_ID[site.id];
  const st = state(s);
  st.sites = st.sites.filter((x) => x !== site);
  st.built.push({ id: site.id, pid: site.pid, x: site.x, y: site.y, turn: s.turn });
  const people = TRIBES[s.players[site.pid].tribe].people;
  for (const rival of sitesOf(s, site.id)) close(s, rival, `The ${people}s finished the ${w.name} first`);
  gift(s, site.pid, w);
  revealAround(s, site.pid); // a vision bonus shows at once
  s.log.push({ turn: s.turn, text: `The ${people}s complete the ${w.name}.` });
  emit({ type: 'wonder', player: site.pid, id: w.id, x: site.x, y: site.y });
  emit({ type: 'toast', player: site.pid, text: `The ${w.name} is complete! ${wonderBonus(w)}` });
}

/** The one-off gifts some wonders bring on completion. */
function gift(s: GameState, pid: number, w: WonderDef) {
  if (w.id === 'gardens') for (const c of citiesOf(s, pid)) addPop(s, c, 2);
  if (w.id === 'library') {
    const t = researchable(s, pid).filter((k) => !k.fork).sort((a, b) => techCost(s, pid, a.id) - techCost(s, pid, b.id) || a.id.localeCompare(b.id))[0];
    if (t) {
      s.players[pid].techs.push(t.id);
      emit({ type: 'toast', player: pid, text: `The Great Library's scholars teach you ${t.name}.` });
    }
  }
}

/** Tells every living empire that has met `pid` (and `pid` itself is told separately). */
function tellMet(s: GameState, pid: number, text: string) {
  for (const p of s.players) if (p.alive && p.id !== pid && (p.met ?? []).includes(pid)) emit({ type: 'toast', player: p.id, text });
}

/** Has `viewer` met the empire `pid` (or is it that empire)? Unmet builders are shown as unknown. */
export const knows = (s: GameState, viewer: number, pid: number) => viewer === pid || (s.players[viewer]?.met ?? []).includes(pid);

// ---------------------------------------------------------------- the turn

/** At the start of `pid`'s turn: sites on land no longer its own (or of fallen empires) are closed; one already paid for is finished. */
export function wonderTurnStart(s: GameState, pid: number) {
  if (!s.wonders) return;
  for (const site of [...s.wonders.sites]) {
    if (!s.players[site.pid]?.alive) { s.wonders.sites = s.wonders.sites.filter((x) => x !== site); continue; }
    if (site.pid !== pid) continue;
    const t = tileAt(s, site.x, site.y)!;
    if (tileOwnerPlayer(s, t) !== pid) close(s, site, `The land of the ${WONDER_BY_ID[site.id].name} was lost`);
    else if (site.paid >= wonderCost(s, pid, site.id)) complete(s, site); // its price fell (a wonder held was lost)
  }
}

// ---------------------------------------------------------------- AI

/** Stars a computer empire keeps back after investing. */
const AI_RESERVE = 4;

/**
 * One wonder step for a computer empire. It invests in its site whenever it can spare the Stars, and begins one
 * once it is rich and has a suitable tile: its own historical wonder first, then whichever pays best on its land.
 * It gives up a site a rival is about to finish.
 */
export function wonderAi(s: GameState, pid: number): boolean {
  const p = s.players[pid];
  const site = siteOf(s, pid);
  if (site) {
    const t = tileAt(s, site.x, site.y)!;
    const cost = wonderCost(s, pid, site.id);
    const rivalNear = sitesOf(s, site.id).some((r) => r.pid !== pid && r.paid >= wonderCost(s, r.pid, r.id) - INVEST_CAP);
    if (rivalNear && cost - site.paid > INVEST_CAP && site.paid < cost / 2) return doAction(s, pid, t, 'wonder:abandon');
    const acts = tileActions(s, pid, t).filter((a) => a.id.startsWith('wonder:invest:') && a.enabled && p.stars - a.cost >= AI_RESERVE);
    const best = acts.sort((a, b) => b.cost - a.cost)[0];
    return best ? doAction(s, pid, t, best.id) : false;
  }
  if (s.turn < 5 || p.stars < 16 || citiesOf(s, pid).length < 2) return false;
  const cities = citiesOf(s, pid);
  let pick: { t: Tile; id: string; v: number } | null = null;
  for (const t of s.tiles) {
    if (tileOwnerPlayer(s, t) !== pid) continue;
    for (const a of tileActions(s, pid, t)) {
      if (!a.enabled || !a.id.startsWith('wonder:begin:')) continue;
      const id = a.id.slice('wonder:begin:'.length);
      const near = Math.min(...cities.map((c) => dist(c.x, c.y, t.x, t.y)));
      const v = aiWorth(s, pid, id) - near * 0.1 - (t.road ? 0 : 0.05);
      if (!pick || v > pick.v) pick = { t, id, v };
    }
  }
  return pick && pick.v > 0 ? doAction(s, pid, pick.t, `wonder:begin:${pick.id}`) : false;
}

/** How much a computer empire wants a wonder: its own history, what it has to use the bonus on, and the price. */
function aiWorth(s: GameState, pid: number, id: string): number {
  const own = s.tiles.filter((t) => tileOwnerPlayer(s, t) === pid);
  const count = (pred: (t: Tile) => boolean) => own.filter(pred).length;
  const cities = citiesOf(s, pid).length;
  const rivals = sitesOf(s, id).filter((r) => r.pid !== pid).length;
  let v = 3;
  switch (id) {
    case 'machupicchu': v += cities; break;
    case 'gardens': v += count((t) => t.improvement === 'farm' || t.resource === 'crop') * 0.5 + cities * 0.5; break;
    case 'hagia': case 'angkor': v += count((t) => t.improvement === 'temple'); break;
    case 'djenne': v += count((t) => t.improvement === 'market'); break;
    case 'zimbabwe': v += count((t) => t.improvement === 'mine' || t.resource === 'ore'); break;
    case 'moai': v += count((t) => t.improvement === 'port' || t.resource === 'fish') * 0.5; break;
    case 'potala': case 'greatwall': v += s.units.some((u) => u.owner !== pid && own.some((t) => dist(t.x, t.y, u.x, u.y) <= 2)) ? 2 : 0; break;
    case 'colosseum': case 'terracotta': v += s.units.filter((u) => u.owner === pid).length * 0.3; break;
  }
  if (isHomeWonder(s, pid, id)) v += 4;
  return v - rivals * 2 - WONDER_BY_ID[id].cost / 20;
}

// ---------------------------------------------------------------- descriptions (plain text, no UI)

/** The bonus of a wonder in words. */
export function wonderBonus(w: WonderDef): string {
  return [...w.perks.map(describePerk), w.gift ?? ''].filter(Boolean).join(' ') + ` +${WONDER_SCORE} score.`;
}

/** Where a wonder may be built, in words. */
export function wonderNeeds(w: WonderDef): string {
  const ter = w.terrain.filter((x) => x !== 'platform').map((x) => (x === 'field' ? 'fields' : x === 'mountain' ? 'a mountain' : x === 'forest' ? 'forest' : x)).join(', ');
  return `${TECH_BY_ID[w.tech].name} · an empty tile of ${ter}${w.coast ? ' by the sea' : ''} in your land`;
}

/** Title and text for a wonder tile's panel, or null. */
export function wonderDescribe(s: GameState, t: Tile, viewer: number): { title: string; desc: string } | null {
  const b = builtAt(s, t.x, t.y);
  if (b) {
    const w = WONDER_BY_ID[b.id];
    const holder = wonderHolder(s, b);
    const who = holder === viewer ? 'Yours' : knows(s, viewer, holder) ? `Held by the ${TRIBES[s.players[holder].tribe].people}s` : 'Held by an unknown empire';
    const by = b.pid !== holder && knows(s, viewer, b.pid) ? ` (built by the ${TRIBES[s.players[b.pid].tribe].people}s)` : '';
    return { title: w.name, desc: `A World Wonder, finished on turn ${b.turn}. ${who}${by}. ${wonderBonus(w)}` };
  }
  const site = siteAt(s, t.x, t.y);
  if (site) {
    const w = WONDER_BY_ID[site.id];
    const who = site.pid === viewer ? 'Your great work' : `Raised by the ${TRIBES[s.players[site.pid].tribe].people}s`;
    return { title: `${w.name} (rising)`, desc: `${who}: ${site.paid}/${wonderCost(s, site.pid, site.id)}★. ${wonderBonus(w)}` };
  }
  return null;
}

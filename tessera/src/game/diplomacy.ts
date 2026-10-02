// Diplomacy: relations between empires that have met (`player.met`). Switched on per game (`NewGameOptions.diplomacy`);
// its state lives in `GameState.diplo`, so older saves (and games without it) simply keep the old rule: everyone at war.
//
//  - RELATIONS. War is the default. A PEACE treaty forbids attacking each other and entering each other's borders
//    (a unit already inside may still walk out). An ALLIANCE is a peace whose members share their maps, may walk through
//    each other's land (never into each other's cities) and are called to arms when one of them is attacked.
//    A TRADE deal rides on a peace or alliance: both sides earn `tradeValue` Stars a turn (distance between capitals and
//    the number of cities). TRIBUTE is a one-off payment (a gift, or a demand paid) or Stars per turn for some turns.
//  - BREAKING a treaty takes a declaration: it can't be made in the first PACT_LOCK rounds of a treaty, and the war only
//    starts at the declarer's next turn (a round's warning). Breaking one dents the declarer's reputation with everyone.
//  - OPINION (`opinion(s, a, b)`: how `a` feels about `b`, -100..100) sums the empire's personality, reputation, shared
//    enemies, touching borders, recent attacks, treaties in force and remembered deeds (`diplo.mood`: gifts, demands,
//    betrayals, refusals; they fade a point a round).
//  - OFFERS between an AI and anyone are answered on the spot by the AI (`aiAnswer`). An offer to a human waits in
//    `diplo.offers` and is shown at that human's next turn start with Accept / Decline (hot-seat humans included).
//  - The neutral owner (Great Beasts, Rogue States; see game/wild) is always hostile and never part of diplomacy.
//  - Domination victory: when every surviving empire is allied with every other, they win together (`alliedVictory`;
//    `diplo.victors` lists them and `s.winner` is the best scorer among them). Perfection mode is unchanged.
import { TRIBES } from '../data/tribes';
import { UNITS } from '../data/units';
import { emit } from './events';
import { dist, neighbors } from './grid';
import type { DiploOffer, DiploPact, DiploState, GameState, Tile, TribeId } from './types';
import { citiesOf, hasTech, score, tileOwnerPlayer } from './rules';
import { STOCK_CAP, stockOf, STRATEGIC_NAME, type Strategic } from './goods';

export type Relation = 'war' | 'peace' | 'alliance';

/** Rounds after signing before a treaty can be broken. */
export const PACT_LOCK = 3;
/** Rounds after a war (re)starts before peace can be proposed again. */
export const WAR_LOCK = 3;
/** Reputation lost with everyone for breaking a treaty (it heals a point a round). */
export const BETRAYAL = 25;
/** Raiders are expected to raid: the aggressive lose only this share of BETRAYAL when they break a treaty. */
export const RAIDER_BETRAYAL = 0.6;
/** Warlike empires (a war drive of at least this) live by raiding, see `diploAi`. */
export const RAIDER = 0.8;
/** How much stronger than a close treaty partner an empire must be before it breaks the treaty (raiders need less). */
export const breakEdge = (war: number) => (war >= RAIDER ? 1.15 : 1.4 + (1 - war) * 1.5);
/** How much stronger than a close neighbour a raider must be to have its tribute demands paid. */
export const RAID_TRIBUTE = 1.6;
/** The reputation an empire loses for breaking a treaty. */
export const betrayalCost = (s: GameState, pid: number) =>
  Math.round(BETRAYAL * (PERSONA[s.players[pid].tribe].war >= RAIDER ? RAIDER_BETRAYAL : 1));
/** The gift the Diplomacy screen sends. */
export const GIFT = 5;
/** A one-off tribute demand, and an ongoing one (Stars a turn, for that many turns). */
export const DEMAND = 10;
export const DEMAND_TURNS = { stars: 2, turns: 5 };
/** Buying strategic resources from another empire: this many for this many Stars. */
export const BARTER = { amount: 2, price: 6 };
/** The resource a barter offer buys. */
export const barterGood = (kind: OfferKind): Strategic | null => (kind === 'buyIron' ? 'iron' : kind === 'buyHorses' ? 'horses' : null);
/** How much of a resource an AI keeps for itself before it will sell: all it has if it can train units that use it. */
function aiSpare(s: GameState, pid: number, r: Strategic): number {
  const have = stockOf(s.players[pid])[r];
  const uses = r === 'iron' ? hasTech(s, pid, 'smithing') || hasTech(s, pid, 'engineering') : hasTech(s, pid, 'chivalry');
  return Math.max(0, have - (uses ? 4 : 0));
}

/** Rounds between declaring war and the first blow: a broken alliance takes longer, so an ally can't be ambushed from inside. */
export const WAR_NOTICE = { peace: 1, alliance: 2 } as const;
export const warNotice = (p: DiploPact) => WAR_NOTICE[p.kind];

/** Rounds an offer to a human waits for an answer before it lapses. */
export const OFFER_LIFE = 2;
/** Rounds before an AI repeats the same offer to the same empire. */
export const ASK_AGAIN = 4;

/** How an empire tends to behave: a base liking for others, how warlike and how keen on trade it is (0..1). */
interface Persona { base: number; war: number; trade: number; label: string }
const AGGRESSIVE: Persona = { base: -3, war: 0.7, trade: 0.2, label: 'aggressive' };
const MARTIAL: Persona = { base: -2, war: 0.6, trade: 0.4, label: 'proud' };
const TRADERS: Persona = { base: 4, war: 0.3, trade: 1, label: 'traders' };
const PEACEFUL: Persona = { base: 6, war: 0.1, trade: 0.6, label: 'peaceful' };
const STEADY: Persona = { base: 1, war: 0.4, trade: 0.5, label: 'steady' };
export const PERSONA: Record<TribeId, Persona> = {
  mongols: AGGRESSIVE, vikings: AGGRESSIVE, zulu: AGGRESSIVE, aztec: AGGRESSIVE, pirates: AGGRESSIVE,
  rome: MARTIAL, ottoman: MARTIAL, japan: MARTIAL, persia: MARTIAL, lakota: MARTIAL, celts: MARTIAL,
  swahili: TRADERS, mali: TRADERS, china: TRADERS, polynesia: TRADERS, greeks: TRADERS,
  tibet: PEACEFUL, india: PEACEFUL, inuit: PEACEFUL, aboriginal: PEACEFUL,
  egypt: STEADY, inca: STEADY, ethiopia: STEADY, maya: STEADY, korea: STEADY, khmer: STEADY,
  carthage: TRADERS, arabia: TRADERS, byzantium: STEADY, rus: MARTIAL, vietnam: MARTIAL,
  babylon: STEADY, nubia: MARTIAL, majapahit: TRADERS, spain: MARTIAL, haudenosaunee: STEADY,
  assyria: MARTIAL, poland: MARTIAL, scotland: MARTIAL, england: MARTIAL, france: STEADY, germany: MARTIAL, sweden: MARTIAL, portugal: TRADERS, venice: TRADERS, kongo: MARTIAL, ashanti: STEADY, mapuche: MARTIAL, georgia: STEADY, nepal: MARTIAL, cree: PEACEFUL,
};

// ---------------------------------------------------------------- state and relations

export const diploOn = (s: GameState) => !!s.diplo;
const D = (s: GameState): DiploState => s.diplo!;
/** The key of an ordered pair (a's view of b) and of an unordered pair. */
const dk = (a: number, b: number) => `${a}:${b}`;
const pk = (a: number, b: number) => (a < b ? dk(a, b) : dk(b, a));
const people = (s: GameState, pid: number) => TRIBES[s.players[pid].tribe].people;

export function newDiplo(): DiploState {
  return { pacts: [], offers: [], tribute: [], mood: {}, rep: {}, fought: {}, warSince: {}, ai: {} };
}

/** Can these two empires deal at all? (Both real, both alive, and they have met.) */
export function canDeal(s: GameState, a: number, b: number): boolean {
  const pa = s.players[a], pb = s.players[b];
  return diploOn(s) && a !== b && !!pa && !!pb && !pa.neutral && !pb.neutral && pa.alive && pb.alive && (pa.met ?? []).includes(b);
}

export const pactOf = (s: GameState, a: number, b: number): DiploPact | undefined =>
  s.diplo?.pacts.find((p) => (p.a === a && p.b === b) || (p.a === b && p.b === a));

export function relation(s: GameState, a: number, b: number): Relation {
  if (!s.diplo || a === b) return 'war';
  return pactOf(s, a, b)?.kind ?? 'war';
}

/** May `a` fight `b`? Always, without diplomacy or against the neutral owner; never oneself or a treaty partner. */
export function hostile(s: GameState, a: number, b: number): boolean {
  if (a === b) return false;
  if (!s.diplo) return true;
  return !pactOf(s, a, b);
}

export const allies = (s: GameState, pid: number): number[] =>
  (s.diplo?.pacts ?? []).filter((p) => p.kind === 'alliance' && (p.a === pid || p.b === pid)).map((p) => (p.a === pid ? p.b : p.a));

/**
 * May a unit of `pid` step from `from` onto `to`? A peace partner's land is closed (a unit already inside may still move
 * on through it, to get out); a treaty partner's city is never entered. Allies' land is open.
 */
export function mayStep(s: GameState, pid: number, from: Tile | null, to: Tile): boolean {
  if (!s.diplo) return true;
  const owner = tileOwnerPlayer(s, to);
  if (owner === null || owner === pid || hostile(s, pid, owner)) return true;
  if (to.cityId !== null) return false;
  // an alliance under a declaration of war opens no more borders: armies may only walk out (see WAR_NOTICE)
  if (relation(s, pid, owner) === 'alliance' && pactOf(s, pid, owner)?.declared === undefined) return true;
  return !!from && tileOwnerPlayer(s, from) === owner;
}

// ---------------------------------------------------------------- opinion

/** A rough military and civic strength: the army's worth plus the cities and their levels. */
export function power(s: GameState, pid: number): number {
  const army = s.units.filter((u) => u.owner === pid).reduce((n, u) => n + UNITS[u.carrying ?? u.kind].cost, 0);
  const cities = citiesOf(s, pid);
  return army + cities.length * 4 + cities.reduce((n, c) => n + c.level, 0) * 2 + 1;
}

/** The closest distance between a city of `a` and a city of `b` (99 when either has none). */
export function nearness(s: GameState, a: number, b: number): number {
  let d = 99;
  for (const x of citiesOf(s, a)) for (const y of citiesOf(s, b)) d = Math.min(d, dist(x.x, x.y, y.x, y.y));
  return d;
}
export const NEAR = 6;

export function bordersTouch(s: GameState, a: number, b: number): boolean {
  for (const t of s.tiles) {
    if (t.owner === null || tileOwnerPlayer(s, t) !== a) continue;
    if (neighbors(s, t.x, t.y).some((n) => n.owner !== null && tileOwnerPlayer(s, n) === b)) return true;
  }
  return false;
}

/** Is `pid` running away with the game (a score well above the average of the living empires)? Others close ranks. */
export function runaway(s: GameState, pid: number): boolean {
  const alive = s.players.filter((p) => p.alive && !p.neutral);
  if (alive.length < 3 || s.turn < 8) return false;
  const scores = alive.map((p) => score(s, p.id));
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return score(s, pid) >= avg * RUNAWAY && score(s, pid) === Math.max(...scores);
}
export const RUNAWAY = 1.3;

/** Did `a` attack `b` in the last `rounds` rounds? */
const attacked = (s: GameState, a: number, b: number, rounds = 5) => s.turn - (D(s).fought[dk(a, b)] ?? -99) <= rounds;
const fighting = (s: GameState, a: number, b: number) => attacked(s, a, b, 6) || attacked(s, b, a, 6);

/** Empires both `a` and `b` have recently fought (not either of them). */
export function sharedEnemies(s: GameState, a: number, b: number): number[] {
  return s.players.filter((c) => c.alive && !c.neutral && c.id !== a && c.id !== b && fighting(s, a, c.id) && fighting(s, b, c.id)).map((c) => c.id);
}

/** How `a` feels about `b` (-100..100), and why: each factor with its weight. */
export function opinionWhy(s: GameState, a: number, b: number): { n: number; why: [string, number][] } {
  const why: [string, number][] = [];
  const add = (label: string, n: number) => { if (n) why.push([label, Math.round(n)]); };
  const d = D(s);
  const persona = PERSONA[s.players[a].tribe];
  add(`${persona.label[0].toUpperCase()}${persona.label.slice(1)} people`, persona.base);
  add('Broken treaties', d.rep[b] ?? 0);
  add('Past deeds', d.mood[dk(a, b)] ?? 0);
  add('Shared enemies', Math.min(16, sharedEnemies(s, a, b).length * 8));
  const rel = relation(s, a, b);
  if (rel !== 'alliance' && bordersTouch(s, a, b)) add('Borders touching', -8);
  if (attacked(s, b, a)) add('Attacked us', -20);
  if (runaway(s, b)) add('Too powerful', -15);
  if (rel === 'peace') add('Peace treaty', 10);
  if (rel === 'alliance') add('Alliance', 20);
  if (pactOf(s, a, b)?.trade !== undefined) add('Trade deal', 6 + persona.trade * 6);
  const n = Math.max(-100, Math.min(100, why.reduce((m, [, v]) => m + v, 0)));
  return { n, why };
}
export const opinion = (s: GameState, a: number, b: number) => opinionWhy(s, a, b).n;

export function opinionWord(n: number): string {
  return n >= 50 ? 'Friendly' : n >= 20 ? 'Warm' : n >= -5 ? 'Wary' : n >= -30 ? 'Cold' : 'Hostile';
}

function moodAdd(s: GameState, a: number, b: number, n: number, min = -60, max = 40) {
  const m = D(s).mood;
  m[dk(a, b)] = Math.max(min, Math.min(max, (m[dk(a, b)] ?? 0) + n));
}

// ---------------------------------------------------------------- trade and tribute

/** Stars a trade deal pays each side per turn: more for far-apart capitals and bigger empires, 1..TRADE_MAX. */
export function tradeValue(s: GameState, a: number, b: number): number {
  const ca = citiesOf(s, a), cb = citiesOf(s, b);
  const capA = ca.find((c) => c.capital) ?? ca[0], capB = cb.find((c) => c.capital) ?? cb[0];
  if (!capA || !capB) return 0;
  return Math.max(1, Math.min(TRADE_MAX, 1 + Math.floor(dist(capA.x, capA.y, capB.x, capB.y) / 8) + Math.floor((ca.length + cb.length) / 6)));
}
export const TRADE_MAX = 3;
/** All of an empire's trade deals together pay at most this a turn (so trading with everyone doesn't beat growing). */
export const TRADE_CAP = 4;

/** Stars `pid` earns from its trade deals each turn. */
export function tradeIncome(s: GameState, pid: number): number {
  let n = 0;
  for (const p of s.diplo?.pacts ?? []) if (p.trade !== undefined && (p.a === pid || p.b === pid)) n += tradeValue(s, p.a, p.b);
  return Math.min(TRADE_CAP, n);
}

/** Stars `pid` gains (or, paying tribute, loses) from diplomacy each turn. */
export function diploIncome(s: GameState, pid: number): number {
  if (!s.diplo) return 0;
  let n = tradeIncome(s, pid);
  for (const t of s.diplo.tribute) {
    if (t.to === pid) n += t.stars;
    if (t.from === pid) n -= t.stars;
  }
  return n;
}

// ---------------------------------------------------------------- announcements

/** A diplomatic event: a toast for the empires involved (and, when `all`, everyone who has met them) and a log entry. */
function announce(s: GameState, text: string, involved: number[], all = false, own?: Record<number, string>) {
  s.log.push({ turn: s.turn, text: `diplo:${text}` });
  for (const p of s.players) {
    if (!p.alive || p.neutral) continue;
    if (involved.includes(p.id)) emit({ type: 'toast', player: p.id, text: own?.[p.id] ?? text });
    else if (all && involved.some((i) => (p.met ?? []).includes(i))) emit({ type: 'toast', player: p.id, text });
  }
}

/** The latest diplomatic news `pid` knows about (log entries naming empires it has met, or itself). */
export function diploNews(s: GameState, pid: number, n = 6): { turn: number; text: string }[] {
  const known = new Set([pid, ...(s.players[pid].met ?? [])].map((id) => people(s, id)));
  return s.log.filter((l) => l.text.startsWith('diplo:')).map((l) => ({ turn: l.turn, text: l.text.slice(6) }))
    .filter((l) => [...known].some((k) => l.text.includes(k))).slice(-n).reverse();
}

// ---------------------------------------------------------------- treaties

function sign(s: GameState, a: number, b: number, kind: 'peace' | 'alliance') {
  const d = D(s);
  const old = pactOf(s, a, b);
  if (old) { old.kind = kind; old.since = s.turn; delete old.declared; delete old.by; }
  else d.pacts.push({ a: Math.min(a, b), b: Math.max(a, b), kind, since: s.turn });
  if (kind === 'alliance') shareMaps(s, a, b);
  const text = kind === 'peace' ? `The ${people(s, a)}s and the ${people(s, b)}s sign a peace treaty.` : `The ${people(s, a)}s and the ${people(s, b)}s form an alliance.`;
  announce(s, text, [a, b], kind === 'alliance');
}

/** Allies see what each other have explored. */
function shareMaps(s: GameState, a: number, b: number) {
  const ea = s.players[a].explored, eb = s.players[b].explored;
  for (let i = 0; i < ea.length; i++) if (ea[i] || eb[i]) ea[i] = eb[i] = true;
}

/** Why `a` can't declare war on `b` right now (null when it can). */
export function declareCheck(s: GameState, a: number, b: number): string | null {
  const p = pactOf(s, a, b);
  if (!p) return 'Already at war';
  if (p.declared !== undefined) return 'War is already declared';
  if (s.turn - p.since < PACT_LOCK) return `The treaty holds for ${PACT_LOCK - (s.turn - p.since)} more round${PACT_LOCK - (s.turn - p.since) === 1 ? '' : 's'}`;
  return null;
}

/**
 * `a` declares war on its treaty partner `b`. The treaty still binds until `a`'s next turn, when the war begins. Unless
 * `honour` (answering an ally's call to arms), it dents `a`'s reputation with everyone and `b` remembers.
 */
export function declareWar(s: GameState, a: number, b: number, honour = false): boolean {
  if (!honour && declareCheck(s, a, b)) return false;
  const p = pactOf(s, a, b);
  if (!p || p.declared !== undefined) return false;
  p.declared = s.turn;
  p.by = a;
  delete p.trade;
  s.diplo!.tribute = s.diplo!.tribute.filter((t) => !((t.from === a && t.to === b) || (t.from === b && t.to === a)));
  if (!honour) {
    s.diplo!.rep[a] = (s.diplo!.rep[a] ?? 0) - betrayalCost(s, a);
    moodAdd(s, b, a, -40);
  }
  const wait = warNotice(p);
  const when = wait === 1 ? 'on their next turn' : `in ${wait} turns`;
  announce(s, `The ${people(s, a)}s declare war on the ${people(s, b)}s${honour ? ' to stand by their ally' : ''}! It begins ${when}.`, [a, b], true,
    { [b]: `The ${people(s, a)}s declare war on you! Their armies march ${when}${p.kind === 'alliance' ? '; until then their units can only leave your land' : ''}.` });
  return true;
}

/** A declared war begins: the treaty is torn up and `b`'s allies at peace with `a` are called to arms. */
function startWar(s: GameState, p: DiploPact) {
  const a = p.by!, b = p.a === a ? p.b : p.a;
  const d = D(s);
  d.pacts = d.pacts.filter((x) => x !== p);
  d.warSince[pk(a, b)] = s.turn;
  announce(s, `War between the ${people(s, a)}s and the ${people(s, b)}s!`, [a, b], true);
  callAllies(s, a, b);
}

/** `victim`'s allies who are at peace with `aggressor` are asked to join the war (once per aggressor every few rounds). */
function callAllies(s: GameState, aggressor: number, victim: number) {
  const d = D(s);
  for (const c of allies(s, victim)) {
    if (c === aggressor || relation(s, c, aggressor) !== 'peace' || !s.players[c].alive) continue;
    const key = `call:${c}:${aggressor}`;
    if (s.turn - (d.ai[key] ?? -99) < 4) continue;
    d.ai[key] = s.turn;
    const offer: DiploOffer = { id: nextOfferId(s), from: victim, to: c, kind: 'call', turn: s.turn, enemy: aggressor };
    if (s.players[c].human) d.offers.push(offer);
    else resolve(s, offer, aiAnswer(s, offer));
  }
}

/** Called by rules.attack: `a` struck `b`. Remembered for opinions; `b`'s allies may be called to arms. */
export function diploFought(s: GameState, a: number, b: number) {
  if (!s.diplo || s.players[a]?.neutral || s.players[b]?.neutral || a === b) return;
  const first = !attacked(s, a, b, 3);
  s.diplo.fought[dk(a, b)] = s.turn;
  if (first) callAllies(s, a, b);
}

// ---------------------------------------------------------------- offers

export type OfferKind = DiploOffer['kind'];

const nextOfferId = (s: GameState) => 1 + Math.max(0, ...D(s).offers.map((o) => o.id), D(s).ai.offerId ?? 0);

/** Why `from` can't make this offer to `to` now (null when it can). */
export function offerCheck(s: GameState, from: number, to: number, kind: OfferKind): string | null {
  if (!canDeal(s, from, to)) return 'You have not met them';
  const rel = relation(s, from, to);
  const p = pactOf(s, from, to);
  const d = D(s);
  if (d.offers.some((o) => o.from === from && o.to === to && o.kind === kind)) return 'Already waiting for an answer';
  if (d.ai[`ask:${from}:${to}:${kind}`] === s.turn) return 'They will not discuss it again this turn';
  if (p?.declared !== undefined) return 'War has been declared';
  const stars = s.players[from].stars;
  switch (kind) {
    case 'peace':
      if (rel !== 'war') return 'Already at peace';
      if (s.turn - (d.warSince[pk(from, to)] ?? -99) < WAR_LOCK) return 'Too soon after the war began';
      return null;
    case 'alliance': return rel === 'alliance' ? 'Already allies' : rel === 'war' ? 'Make peace first' : null;
    case 'trade': return rel === 'war' ? 'Make peace first' : p?.trade !== undefined ? 'Already trading' : null;
    case 'gift': return stars < GIFT ? 'Not enough stars' : null;
    case 'demand': return s.players[to].stars < DEMAND ? 'They cannot pay it' : null;
    case 'demandTurns': return d.tribute.some((t) => t.from === to && t.to === from) ? 'They already pay you tribute' : null;
    case 'call': return null;
    case 'buyIron': case 'buyHorses': {
      if (rel === 'war') return 'Not while at war';
      if (stars < BARTER.price) return 'Not enough stars';
      const r = barterGood(kind)!;
      return stockOf(s.players[to])[r] < BARTER.amount ? `They have no ${STRATEGIC_NAME[r]} to spare` : null;
    }
  }
}

/**
 * `from` makes an offer to `to`. A gift is simply given. An AI answers at once; a human finds it at their next turn start.
 * Returns what happened: 'given' | 'accepted' | 'declined' | 'sent', or null when the offer isn't allowed.
 */
export function propose(s: GameState, from: number, to: number, kind: OfferKind): 'given' | 'accepted' | 'declined' | 'sent' | null {
  if (offerCheck(s, from, to, kind)) return null;
  const d = D(s);
  d.ai[`ask:${from}:${to}:${kind}`] = s.turn;
  if (kind === 'gift') { gift(s, from, to, GIFT); return 'given'; }
  const offer: DiploOffer = { id: nextOfferId(s), from, to, kind, turn: s.turn };
  d.ai.offerId = offer.id;
  if (kind === 'demand') offer.stars = DEMAND;
  if (kind === 'demandTurns') { offer.stars = DEMAND_TURNS.stars; offer.turns = DEMAND_TURNS.turns; }
  if (barterGood(kind)) offer.stars = BARTER.price;
  if (s.players[to].human) {
    d.offers.push(offer);
    emit({ type: 'toast', player: from, text: `Your envoy leaves for the ${people(s, to)}s. They will answer on their turn.` });
    return 'sent';
  }
  const yes = aiAnswer(s, offer);
  resolve(s, offer, yes);
  return yes ? 'accepted' : 'declined';
}

function gift(s: GameState, from: number, to: number, stars: number) {
  s.players[from].stars -= stars;
  s.players[to].stars += stars;
  moodAdd(s, to, from, stars * 2);
  announce(s, `The ${people(s, from)}s send the ${people(s, to)}s a gift of ${stars}★.`, [from, to], false,
    { [to]: `The ${people(s, from)}s send you a gift of ${stars}★.` });
}

export const offersFor = (s: GameState, pid: number): DiploOffer[] => (s.diplo?.offers ?? []).filter((o) => o.to === pid);

/** A human answers an offer waiting for them. */
export function answer(s: GameState, id: number, yes: boolean): boolean {
  const o = s.diplo?.offers.find((x) => x.id === id);
  if (!o) return false;
  s.diplo!.offers = s.diplo!.offers.filter((x) => x !== o);
  if (!canDeal(s, o.from, o.to)) return false;
  resolve(s, o, yes && !stale(s, o));
  return true;
}
/** An offer that no longer makes sense (peace offered while already at peace...). */
const stale = (s: GameState, o: DiploOffer) =>
  (o.kind === 'peace' && relation(s, o.from, o.to) !== 'war') || ((o.kind === 'alliance' || o.kind === 'trade') && relation(s, o.from, o.to) === 'war')
  || (o.kind === 'call' && relation(s, o.to, o.enemy!) !== 'peace') || (o.kind === 'demand' && s.players[o.to].stars < (o.stars ?? 0))
  || (!!barterGood(o.kind) && (s.players[o.from].stars < BARTER.price || stockOf(s.players[o.to])[barterGood(o.kind)!] < BARTER.amount));

/** Carries out (or turns down) an offer. */
function resolve(s: GameState, o: DiploOffer, yes: boolean) {
  const d = D(s);
  const { from, to } = o;
  const them = people(s, to);
  if (!yes) {
    if (o.kind === 'demand' || o.kind === 'demandTurns') moodAdd(s, from, to, -10); // a refused demand angers the demander
    else if (o.kind === 'call') { moodAdd(s, from, to, -20); announce(s, `The ${them}s refuse to join the ${people(s, from)}s' war.`, [from, to]); return; }
    else moodAdd(s, from, to, -2);
    const what = { peace: 'peace', alliance: 'an alliance', trade: 'a trade deal', demand: 'tribute', demandTurns: 'tribute', gift: 'a gift', call: '', buyIron: 'to sell Iron', buyHorses: 'to sell Horses' }[o.kind];
    emit({ type: 'toast', player: from, text: `The ${them}s decline ${what}.` });
    return;
  }
  switch (o.kind) {
    case 'peace': sign(s, from, to, 'peace'); break;
    case 'alliance': sign(s, from, to, 'alliance'); break;
    case 'trade': {
      const p = pactOf(s, from, to);
      if (!p) return;
      p.trade = s.turn;
      announce(s, `The ${people(s, from)}s and the ${them}s open trade: +${tradeValue(s, from, to)}★ a turn each.`, [from, to]);
      break;
    }
    case 'demand': {
      const n = Math.min(o.stars ?? DEMAND, s.players[to].stars);
      s.players[to].stars -= n;
      s.players[from].stars += n;
      moodAdd(s, to, from, -15);
      announce(s, `The ${them}s pay the ${people(s, from)}s ${n}★ in tribute.`, [from, to]);
      break;
    }
    case 'demandTurns':
      d.tribute.push({ from: to, to: from, stars: o.stars ?? DEMAND_TURNS.stars, until: s.turn + (o.turns ?? DEMAND_TURNS.turns) });
      moodAdd(s, to, from, -15);
      announce(s, `The ${them}s agree to pay the ${people(s, from)}s ${o.stars}★ a turn for ${o.turns} turns.`, [from, to]);
      break;
    case 'call':
      moodAdd(s, from, to, 15);
      declareWar(s, to, o.enemy!, true);
      break;
    case 'gift': break;
    case 'buyIron': case 'buyHorses': {
      const r = barterGood(o.kind)!;
      const n = Math.min(BARTER.amount, stockOf(s.players[to])[r]);
      stockOf(s.players[to])[r] -= n;
      stockOf(s.players[from])[r] = Math.min(STOCK_CAP, stockOf(s.players[from])[r] + n);
      s.players[from].stars -= BARTER.price;
      s.players[to].stars += BARTER.price;
      moodAdd(s, to, from, 3);
      announce(s, `The ${them}s sell the ${people(s, from)}s ${n} ${STRATEGIC_NAME[r]} for ${BARTER.price}★.`, [from, to]);
      break;
    }
  }
}

// ---------------------------------------------------------------- the AI's judgement

/** Would the AI `o.to` accept this offer? Opinion of the sender, strength and the empire's personality decide. */
export function aiAnswer(s: GameState, o: DiploOffer): boolean {
  const { from, to } = o;
  const me = PERSONA[s.players[to].tribe];
  const op = opinion(s, to, from);
  const ratio = power(s, from) / power(s, to); // > 1: they are the stronger
  const near = nearness(s, from, to) <= NEAR;
  switch (o.kind) {
    case 'peace': {
      // afraid of them, or simply not interested in a war; the warlike like easy prey
      const fear = ratio >= 1.3 ? 25 * (1 - me.war) : ratio <= 0.6 && near ? -15 * me.war * 2 : 0;
      if (me.war >= RAIDER && near && ratio <= 0.9) return false; // a raider never lets a weaker neighbour off the hook
      return op + fear - me.war * 10 + (near ? 0 : 12) >= -10;
    }
    case 'alliance': return op >= 30 && (op >= 45 || sharedEnemies(s, from, to).length > 0);
    case 'trade': return op + me.trade * 15 >= 0;
    // a raider at the door is paid off sooner
    case 'demand': case 'demandTurns': return near && ratio >= (PERSONA[s.players[from].tribe].war >= RAIDER ? RAID_TRIBUTE : 2.2) && op > -60;
    case 'call': return opinion(s, to, from) >= 15 && power(s, to) >= power(s, o.enemy!) * 0.5;
    case 'gift': return true;
    case 'buyIron': case 'buyHorses': return op >= -20 && aiSpare(s, to, barterGood(o.kind)!) >= BARTER.amount;
  }
}

/**
 * One diplomatic initiative a turn for an AI empire: make peace, trade or an alliance with those it likes (or fears),
 * break a treaty when it is strong and the other side weak and near, demand tribute from the weak, or buy goodwill with
 * a gift when threatened. Returns true when it did something (it is asked again until it returns false).
 */
export function diploAi(s: GameState, pid: number): boolean {
  if (!s.diplo || s.players[pid].human) return false;
  const d = D(s);
  if (d.ai[`turn:${pid}`] === s.turn) return false;
  d.ai[`turn:${pid}`] = s.turn;
  if (s.turn < 2) return false;
  const me = PERSONA[s.players[pid].tribe];
  const mine = power(s, pid);
  const others = (s.players[pid].met ?? []).filter((b) => canDeal(s, pid, b)).sort((x, y) => x - y);
  // the same offer to the same empire at most every few rounds (a human would otherwise be asked every turn)
  const try_ = (b: number, kind: OfferKind) => {
    const key = `last:${pid}:${b}:${kind}`;
    if (s.turn - (d.ai[key] ?? -99) < ASK_AGAIN || offerCheck(s, pid, b, kind)) return false;
    d.ai[key] = s.turn;
    return propose(s, pid, b, kind) !== null;
  };
  for (const b of others) {
    const rel = relation(s, pid, b);
    const op = opinion(s, pid, b);
    const ratio = mine / power(s, b); // > 1: we are the stronger
    const near = nearness(s, pid, b) <= NEAR;
    const p = pactOf(s, pid, b);
    // break a treaty: strong, they are weak and close, and we don't much like them (the warlike need less of an edge)
    if (p && p.declared === undefined && !declareCheck(s, pid, b) && near
      && ((ratio >= breakEdge(me.war) && op < (p.kind === 'alliance' ? -10 : 15 + me.war * 20)) || (runaway(s, b) && ratio >= 1 && op < 10))) {
      return declareWar(s, pid, b);
    }
    if (rel === 'war') {
      const prey = near && me.war >= 0.5 && ratio >= Math.min(1.4, breakEdge(me.war)); // strong and close: keep the war going
      // a raider picks its fights: peace with everyone who is not prey, so its whole army falls on the weak neighbour
      const wants = me.war >= RAIDER || op >= 0 || ratio <= 0.7 || !near;
      if (!prey && wants && try_(b, 'peace')) return true;
      if (prey && ratio >= (me.war >= RAIDER ? RAID_TRIBUTE : 2.5) && s.players[b].stars >= DEMAND && try_(b, 'demand')) return true;
      if (ratio <= 0.4 && near && s.players[pid].stars >= 25 && op < 0 && try_(b, 'gift')) return true; // buying goodwill before asking for peace
      continue;
    }
    // a raider at peace with a weak neighbour still takes its cut: tribute, or the treaty goes (see above)
    if (me.war >= RAIDER && near && ratio >= RAID_TRIBUTE && try_(b, 'demandTurns')) return true;
    if (p && p.trade === undefined && op + me.trade * 15 >= 0 && try_(b, 'trade')) return true;
    if (rel === 'peace' && s.turn - p!.since >= PACT_LOCK && op >= 35 && try_(b, 'alliance')) return true;
    // short of Iron or Horses for the units it can train: buy some from a partner who has them
    const have = stockOf(s.players[pid]);
    if (s.players[pid].stars >= BARTER.price + 6) {
      if ((hasTech(s, pid, 'smithing') || hasTech(s, pid, 'engineering')) && have.iron < 2 && try_(b, 'buyIron')) return true;
      if (hasTech(s, pid, 'chivalry') && have.horses < 2 && try_(b, 'buyHorses')) return true;
    }
  }
  return false;
}

/** The AI wants to help an ally: units of empires that recently attacked one of `pid`'s allies. */
export function allyFoes(s: GameState, pid: number): Set<number> {
  const out = new Set<number>();
  if (!s.diplo) return out;
  for (const c of allies(s, pid)) for (const e of s.players) if (!e.neutral && e.id !== pid && hostile(s, pid, e.id) && attacked(s, e.id, c, 3)) out.add(e.id);
  return out;
}

// ---------------------------------------------------------------- the turn

/**
 * At the start of `pid`'s turn: its declared wars begin, its trade deals pay and its tribute is paid, allies share
 * their maps, stale offers lapse and old grudges fade.
 */
export function diploTurnStart(s: GameState, pid: number) {
  const d = s.diplo;
  if (!d) return;
  // treaties with fallen empires lapse
  d.pacts = d.pacts.filter((p) => s.players[p.a].alive && s.players[p.b].alive);
  d.tribute = d.tribute.filter((t) => s.players[t.from].alive && s.players[t.to].alive && s.turn < t.until);
  for (const p of [...d.pacts]) if (p.by === pid && p.declared !== undefined && s.turn >= p.declared + warNotice(p)) startWar(s, p); // after the notice (WAR_NOTICE)
  const me = s.players[pid];
  if (s.turn > 0) {
    const trade = tradeIncome(s, pid);
    if (trade) { me.stars += trade; emit({ type: 'toast', player: pid, text: `Trade deals bring in +${trade}★.` }); }
    for (const t of d.tribute) {
      if (t.from !== pid) continue;
      const n = Math.min(t.stars, me.stars);
      me.stars -= n;
      s.players[t.to].stars += n;
      if (n) emit({ type: 'toast', player: pid, text: `You pay the ${people(s, t.to)}s ${n}★ in tribute.` });
    }
  }
  for (const c of allies(s, pid)) shareMaps(s, pid, c);
  d.offers = d.offers.filter((o) => s.turn - o.turn <= OFFER_LIFE && s.players[o.to].alive && s.players[o.from].alive);
  // grudges and goodwill fade; reputation heals
  for (const k of Object.keys(d.mood)) {
    if (!k.startsWith(`${pid}:`)) continue;
    const v = d.mood[k];
    d.mood[k] = v > 0 ? v - 1 : v < 0 ? v + 1 : 0;
    if (!d.mood[k]) delete d.mood[k];
  }
  if ((d.rep[pid] ?? 0) < 0) d.rep[pid]++;
}

/** Domination: are the survivors (two or more) all allied with each other? */
export function alliedVictory(s: GameState, alive: number[]): boolean {
  if (!s.diplo || s.mode !== 'domination' || alive.length < 2) return false;
  for (let i = 0; i < alive.length; i++)
    for (let j = i + 1; j < alive.length; j++) {
      const p = pactOf(s, alive[i], alive[j]);
      if (p?.kind !== 'alliance' || p.declared !== undefined) return false;
    }
  return true;
}

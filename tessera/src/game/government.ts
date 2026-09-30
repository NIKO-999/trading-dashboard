// Governments and Policy Cards: a flexible layer over the permanent skill tree.
//
//  - Every empire starts as a Chiefdom (1 Military and 1 Economic slot). Reaching the Classical era (game/eras) opens
//    Autocracy, Oligarchy and the Classical Republic; the Medieval era opens Monarchy, the Merchant Republic and
//    Theocracy. Each government has a small bonus of its own and its own row of slots (data/governments).
//  - Changing government costs GOV_BASE★ + GOV_PER_CITY★ a city and takes effect at once; the next change must wait
//    GOV_WAIT turns. Cards already slotted move into the new slots that still take them; the rest go back in the hand.
//  - Policy cards are unlocked by techs or eras. A Military slot takes a Military card, an Economic slot an Economic
//    card, and a Wild slot any card (Wild cards only go in Wild slots).
//  - Putting a card into an empty slot is free and immediate. Replacing or removing a slotted card is free too, but only
//    once a turn, and the card swapped in takes effect at the start of your next turn (the slot is idle till then).
//  - The government and cards in force are plain perks (govPerks, read by game/perks), so every rule sees them.
// State: `player.gov` (JSON-safe; missing in older saves, which count as a Chiefdom with empty slots).
import { CARDS, CARD_BY_ID, GOVS, GOV_BY_ID, type CardDef, type CardType, type GovDef, type GovId, type GovState } from '../data/governments';
import { TRIBES } from '../data/tribes';
import { condActive } from './alignment';
import { eraState } from './eras';
import { emit } from './events';
import { dist } from './grid';
import { citiesOf, maxHp, tileOwnerPlayer } from './rules';
import type { GameState, Unit } from './types';
import { hostile } from './diplomacy';
import { routesOf } from './trade';
import { siteOf } from './wonders';
import { MOUNTED_KINDS, perkSum, unitMatches } from './perks';
import { UNITS } from '../data/units';

/** Stars a change of government costs: a base and a share for every city. */
export const GOV_BASE = 6;
export const GOV_PER_CITY = 2;
/** Turns to wait between two changes of government. */
export const GOV_WAIT = 5;

const people = (s: GameState, pid: number) => TRIBES[s.players[pid].tribe].people;

/** The empire's government and cards, created (as a Chiefdom) or fitted to its slots on first use. */
export function govState(s: GameState, pid: number): GovState {
  const p = s.players[pid];
  const g = (p.gov ??= { id: 'chiefdom', slots: [], ready: [], since: -99, swapped: -99 });
  if (!GOV_BY_ID[g.id]) g.id = 'chiefdom';
  const n = GOV_BY_ID[g.id].slots.length;
  while (g.slots.length < n) g.slots.push(null);
  g.slots.length = n;
  while (g.ready.length < n) g.ready.push(0);
  g.ready.length = n;
  return g;
}
export const govOf = (s: GameState, pid: number): GovDef => GOV_BY_ID[s.players[pid].gov?.id ?? 'chiefdom'] ?? GOV_BY_ID.chiefdom;

export const govCost = (s: GameState, pid: number) => GOV_BASE + GOV_PER_CITY * citiesOf(s, pid).length;
/** Turns left before `pid` may change government again (0: it may now). */
export const govWaitLeft = (s: GameState, pid: number) => Math.max(0, (s.players[pid].gov?.since ?? -99) + GOV_WAIT - s.turn);
export const govUnlocked = (s: GameState, pid: number, g: GovDef) => eraState(s, pid).n >= g.era;

/** Why `pid` can't adopt government `id` now (null when it can). */
export function govWhy(s: GameState, pid: number, id: GovId): string | null {
  const g = GOV_BY_ID[id];
  if (!g) return 'Unknown government';
  if (govOf(s, pid).id === id) return 'Already your government';
  if (!govUnlocked(s, pid, g)) return `Needs the ${['Ancient', 'Classical', 'Medieval', 'Renaissance'][g.era]} Era`;
  const wait = govWaitLeft(s, pid);
  if (wait > 0) return `The last change was recent: wait ${wait} more turn${wait === 1 ? '' : 's'}`;
  if (s.players[pid].stars < govCost(s, pid)) return `Needs ${govCost(s, pid)}★`;
  return null;
}

/** Adopts a new government: pays, keeps the cards that still fit, and tells the world. */
export function adoptGov(s: GameState, pid: number, id: GovId): boolean {
  if (govWhy(s, pid, id)) return false;
  const p = s.players[pid];
  const old = govState(s, pid);
  const cost = govCost(s, pid);
  p.stars -= cost;
  const def = GOV_BY_ID[id];
  const next: GovState = { id, slots: def.slots.map(() => null), ready: def.slots.map(() => 0), since: s.turn, swapped: old.swapped };
  // the cards in force move over, each into the first free slot that takes it (a typed slot before a Wild one)
  const held = old.slots.map((c, i) => ({ c, r: old.ready[i] })).filter((x): x is { c: string; r: number } => !!x.c && !!CARD_BY_ID[x.c]);
  const dropped: string[] = [];
  for (const { c, r } of held) {
    const type = CARD_BY_ID[c].type;
    let i = def.slots.findIndex((t, k) => next.slots[k] === null && t === type);
    if (i < 0) i = def.slots.findIndex((t, k) => next.slots[k] === null && t === 'wild');
    if (i < 0) { dropped.push(CARD_BY_ID[c].name); continue; }
    next.slots[i] = c;
    next.ready[i] = r;
  }
  p.gov = next;
  s.log.push({ turn: s.turn, text: `The ${people(s, pid)}s adopt ${def.name}.` });
  emit({ type: 'toast', player: pid, text: `🏛 ${def.name} (${cost}★): ${def.bonus}${dropped.length ? ` ${dropped.join(', ')} no longer fit${dropped.length === 1 ? 's' : ''} a slot.` : ''}` });
  for (const q of s.players) {
    if (q.id === pid || !q.alive || q.neutral || !q.met?.includes(pid)) continue;
    emit({ type: 'toast', player: q.id, text: `🏛 The ${people(s, pid)}s have adopted ${def.name}.` });
  }
  return true;
}

// ---------------------------------------------------------------- cards

export const cardUnlocked = (s: GameState, pid: number, c: CardDef) =>
  c.tech ? s.players[pid].techs.includes(c.tech) : eraState(s, pid).n >= (c.era ?? 0);
/** Every card `pid` has unlocked, in the order of the deck. */
export const cardsOf = (s: GameState, pid: number): CardDef[] => CARDS.filter((c) => cardUnlocked(s, pid, c));
export const fits = (slot: CardType, c: CardDef) => slot === 'wild' || slot === c.type;
/** Is the card in slot `i` in force (not still waiting for next turn)? */
export const slotLive = (s: GameState, pid: number, i: number) => {
  const g = s.players[pid].gov;
  return !!g?.slots[i] && s.turn >= (g.ready[i] ?? 0);
};
/** The cards in force. */
export const activeCards = (s: GameState, pid: number): CardDef[] =>
  (s.players[pid].gov?.slots ?? []).flatMap((id, i) => (id && CARD_BY_ID[id] && slotLive(s, pid, i) ? [CARD_BY_ID[id]] : []));
/** May `pid` still replace or remove a slotted card this turn? */
export const canSwap = (s: GameState, pid: number) => (s.players[pid].gov?.swapped ?? -99) !== s.turn;

/** Why card `card` (null: clear the slot) can't go into slot `i` now (null when it can). */
export function slotWhy(s: GameState, pid: number, i: number, card: string | null): string | null {
  const g = govState(s, pid);
  const slot = GOV_BY_ID[g.id].slots[i];
  if (!slot) return 'No such slot';
  const cur = g.slots[i];
  if (card !== null) {
    const c = CARD_BY_ID[card];
    if (!c) return 'Unknown card';
    if (!cardUnlocked(s, pid, c)) return c.tech ? 'Research its tech first' : 'Reach its era first';
    if (!fits(slot, c)) return `A ${c.type} card needs a ${c.type === 'wild' ? 'Wild' : `${c.type[0].toUpperCase()}${c.type.slice(1)} or Wild`} slot`;
    if (cur === card) return 'Already in this slot';
    if (g.slots.includes(card)) return 'Already slotted';
  } else if (cur === null) return 'The slot is empty';
  if (cur !== null && !canSwap(s, pid)) return 'One card change a turn: swap again next turn';
  return null;
}

/**
 * Puts `card` into slot `i` (null: empties it). An empty slot is filled at once; replacing or removing a card uses the
 * turn's one change, and the new card only takes effect next turn.
 */
export function slotCard(s: GameState, pid: number, i: number, card: string | null): boolean {
  if (slotWhy(s, pid, i, card)) return false;
  const g = govState(s, pid);
  const swap = g.slots[i] !== null;
  g.slots[i] = card;
  // a slot emptied this turn stays idle until next turn, so a swap can't dodge the wait by removing first
  g.ready[i] = swap ? s.turn + 1 : Math.max(s.turn, g.ready[i] ?? 0);
  if (swap) g.swapped = s.turn;
  if (card) {
    const c = CARD_BY_ID[card];
    emit({ type: 'toast', player: pid, text: g.ready[i] > s.turn ? `📜 ${c.name} is slotted: in force from next turn.` : `📜 ${c.name} is in force: ${c.desc}` });
  }
  return true;
}

/** Start of turn: cards swapped in last turn come into force. */
export function govTurnStart(s: GameState, pid: number) {
  const g = s.players[pid].gov;
  if (!g) return;
  g.slots.forEach((id, i) => {
    if (id && CARD_BY_ID[id] && g.ready[i] === s.turn) emit({ type: 'toast', player: pid, text: `📜 ${CARD_BY_ID[id].name} is now in force: ${CARD_BY_ID[id].desc}` });
  });
}

/** Scorched Earth: a unit that has just pillaged heals. */
export function raidHeal(s: GameState, u: Unit) {
  const n = perkSum(s, u.owner, 'raidheal');
  if (n <= 0 || u.hp >= maxHp(u)) return;
  const before = u.hp;
  u.hp = Math.min(maxHp(u), u.hp + n);
  emit({ type: 'heal', unitId: u.id, x: u.x, y: u.y, amount: u.hp - before });
}

/** The short "Monarchy 3/4" summary of a government and its filled slots. */
export function govSummary(s: GameState, pid: number): string {
  const g = govOf(s, pid);
  const filled = (s.players[pid].gov?.slots ?? []).filter(Boolean).length;
  return `${g.name} ${filled}/${g.slots.length}`;
}

// ---------------------------------------------------------------- AI

/** At war for the AI's purposes: it fought lately, or hostile troops stand near its cities. */
export function govAtWar(s: GameState, pid: number): boolean {
  if (condActive(s, pid, 'war')) return true;
  const cities = citiesOf(s, pid);
  return s.units.some((u) => u.owner !== pid && !s.players[u.owner].neutral && hostile(s, pid, u.owner) && UNITS[u.kind].atk > 0
    && cities.some((c) => dist(c.x, c.y, u.x, u.y) <= 3));
}

function govWant(s: GameState, pid: number, id: GovId, war: boolean): number {
  const cities = citiesOf(s, pid);
  const owned = (imp: string) => s.tiles.filter((t) => t.improvement === imp && tileOwnerPlayer(s, t) === pid).length;
  switch (id) {
    case 'chiefdom': return 0;
    case 'autocracy': return 3 + (cities.length <= 2 ? 2 : 0) + (war ? 1 : 0); // a small realm held from the capital
    case 'oligarchy': return war ? 7 : 1;
    case 'republic': return 3 + 1.5 * cities.filter((c) => c.level >= 3).length + (war ? -2 : 2.5);
    case 'monarchy': return war ? 10 : 4;
    case 'merchant': return 3 + owned('market') + 1.5 * routesOf(s, pid).length + (war ? -3 : 2);
    case 'theocracy': return 2 + 1.2 * owned('temple') + (war ? 1 : 0);
  }
}

/** How much the AI wants a card, at war or at peace. */
function cardWant(s: GameState, pid: number, c: CardDef, war: boolean): number {
  const p = s.players[pid];
  const units = s.units.filter((u) => u.owner === pid);
  const count = (who: Parameters<typeof unitMatches>[2]) => units.filter((u) => unitMatches(p.tribe, u.kind, who)).length;
  const owned = (pred: (t: (typeof s.tiles)[number]) => boolean) => s.tiles.filter((t) => pred(t) && tileOwnerPlayer(s, t) === pid).length;
  switch (c.id) {
    case 'levee': return war ? 4 : 1;
    case 'conscription': return war ? 6 : 2.5;
    case 'bounty': return war ? 4 : 1;
    case 'scorched': return war ? 2 : 0.5;
    case 'shielddrill': return count('melee') / 2 + (war ? 3 : 0);
    case 'horselords': return units.filter((u) => MOUNTED_KINDS.includes(u.kind)).length + (war ? 1 : 0);
    case 'surgeons': return war ? 5 : 1;
    case 'tribute': return 3;
    case 'urban': return 3.5;
    case 'caravan': return routesOf(s, pid).length * 1.5;
    case 'stockyards': return p.techs.includes('chivalry') ? 3 : 0.5;
    case 'bloomery': return p.techs.includes('smithing') || p.techs.includes('engineering') ? 3 : 0.5;
    case 'pilgrims': return owned((t) => t.improvement === 'temple') * 1.5;
    case 'patronage': return siteOf(s, pid) ? 5 : 0.5;
    case 'survey': return count('recon') * 1.5;
    case 'nightwatch': return war ? 3 : 2;
    case 'harbour': return count('naval');
    case 'tolls': return Math.floor(owned((t) => t.road) / 4);
  }
  return 1;
}

/**
 * One AI step with its government: adopt a better government when it can afford it, fill empty slots with the best
 * cards, and swap one card a turn when war or peace has made another clearly better. Returns true when it acted.
 */
export function govAi(s: GameState, pid: number): boolean {
  const p = s.players[pid];
  if (p.neutral || aiSettled.get(s) === `${s.turn}:${pid}`) return false; // nothing more to do this turn: skip the scans
  const acted = govAiStep(s, pid);
  if (!acted) aiSettled.set(s, `${s.turn}:${pid}`);
  return acted;
}
const aiSettled = new WeakMap<GameState, string>();

function govAiStep(s: GameState, pid: number): boolean {
  const p = s.players[pid];
  const g = govState(s, pid);
  const war = govAtWar(s, pid);
  // 1. a better government
  if (govWaitLeft(s, pid) === 0 && p.stars >= govCost(s, pid) + 4) {
    const cur = govWant(s, pid, g.id, war);
    const best = GOVS.filter((d) => !govWhy(s, pid, d.id)).map((d) => ({ d, w: govWant(s, pid, d.id, war) })).sort((a, b) => b.w - a.w)[0];
    if (best && best.w >= cur + 2 && adoptGov(s, pid, best.d.id)) return true;
  }
  // 2. fill an empty slot
  const def = GOV_BY_ID[g.id];
  const hand = cardsOf(s, pid).filter((c) => !g.slots.includes(c.id));
  const pick = (i: number) => hand.filter((c) => fits(def.slots[i], c)).map((c) => ({ c, w: cardWant(s, pid, c, war) })).sort((a, b) => b.w - a.w)[0];
  for (let i = 0; i < def.slots.length; i++) {
    if (g.slots[i] !== null || s.turn < (g.ready[i] ?? 0)) continue;
    const best = pick(i);
    if (best && best.w > 0 && slotCard(s, pid, i, best.c.id)) return true;
  }
  // 3. one swap a turn, when the best card in hand clearly beats the one in the slot
  if (!canSwap(s, pid)) return false;
  let swap: { i: number; c: CardDef; gain: number } | null = null;
  for (let i = 0; i < def.slots.length; i++) {
    const id = g.slots[i];
    if (!id || !slotLive(s, pid, i)) continue;
    const best = pick(i);
    const gain = best ? best.w - cardWant(s, pid, CARD_BY_ID[id], war) : 0;
    if (best && gain >= 3 && (!swap || gain > swap.gain)) swap = { i, c: best.c, gain };
  }
  return !!swap && slotCard(s, pid, swap.i, swap.c.id);
}

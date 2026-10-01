import { emit } from '../events';
import { canDeal, diploOn, offerCheck, power, propose, relation } from '../diplomacy';
import { citiesOf, maxHp, tileOwnerPlayer } from '../rules';
import type { Action } from '../rules';
import type { City, GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// Unconquered (empire bonus) + the Toqui and the Parlamento (signature).
//
// Unconquered (`stat`): Mapuche units standing inside Mapuche borders defend +HOME_DEF. The Mapuche held their land
// against the Inca and then for three centuries against Spain and its successors.
//
// Toqui (`mech:toqui`, at the capital, TOQUI_COST★, once every TOQUI_EVERY turns, counted from the last election): in
// peace the lof (lineages) answered to their own lonko; in war the council elected a toqui, a war chief, for the
// campaign alone. Only while at war (see `atWar`): with diplomacy on, while the Mapuche are at war with any empire they
// have met; with diplomacy off (everyone is always at war), while a hostile, non-neutral unit stands within THREAT_RANGE
// tiles of a Mapuche city. For TOQUI_TURNS turns (the turn of the election and the two after it) every Mapuche unit
// moves +TOQUI_MOVE and attacks +TOQUI_ATK.
//
// Parlamento (`mech:parlamento`, at the capital, PARL_COST★, once every PARL_EVERY turns): a koyang, a great parley
// (the Spanish crown signed such treaties with the Mapuche, at Quilín in 1641 and after). Two outcomes, decided by the
// state of the world when it is held:
//  - DIPLOMACY ON and at war with someone met: every empire at war with the Mapuche is courted. Its mood towards the
//    Mapuche rises by PARL_MOOD (capped like a gift's, at MOOD_CAP), and if a peace offer is allowed now (offerCheck:
//    not too soon after the war began, no offer already waiting...) one is sent through the normal `propose` route.
//    So nothing is forced: an AI weighs it as any peace offer (the warmer mood helps), a human gets it to accept or
//    decline at their next turn. This is the fair choice: diplomacy's own rules decide, the koyang only sweetens them.
//  - OTHERWISE (no diplomacy, or no war to settle): the council rests the warriors. Every Mapuche unit heals PARL_HEAL
//    HP (up to its maximum) and the next Toqui election costs nothing (`player.mech.free`; its cooldown still applies).

export const HOME_DEF = 0.5;
export const TOQUI_COST = 6;
export const TOQUI_EVERY = 10;
export const TOQUI_TURNS = 3;
export const TOQUI_MOVE = 1;
export const TOQUI_ATK = 0.5;
export const PARL_COST = 4;
export const PARL_EVERY = 8;
export const PARL_HEAL = 4;
export const PARL_MOOD = 15;
/** The highest a remembered deed lifts one empire's mood towards another (the diplomacy module's own cap). */
export const MOOD_CAP = 40;
/** Tiles from a Mapuche city within which a hostile unit means war, when diplomacy is off (and the AI's threat range). */
export const THREAT_RANGE = 4;
/** The AI holds a parley when a foe is this much stronger than the Mapuche. */
export const AI_PARL_FEAR = 1.2;

interface MState { toqui?: number; free?: boolean; parl?: number; elections?: number }

const isMapuche = (s: GameState, pid: number) => s.players[pid]?.tribe === 'mapuche';
const peek = (s: GameState, owner: number): MState => (s.players[owner].mech ?? {}) as MState;
const state = (s: GameState, owner: number): MState => (s.players[owner].mech ??= {}) as MState;
const near = (ax: number, ay: number, bx: number, by: number, r: number) => Math.max(Math.abs(ax - bx), Math.abs(ay - by)) <= r;
const tileOf = (s: GameState, x: number, y: number): Tile | undefined => s.tiles[y * s.size + x];

/** `owner`'s capital. */
export const capitalOf = (s: GameState, owner: number): City | undefined => citiesOf(s, owner).find((c) => c.capital);
const capTile = (s: GameState, owner: number): Tile | undefined => { const c = capitalOf(s, owner); return c && tileOf(s, c.x, c.y); };

// ---------------------------------------------------------------- Unconquered

/** Is `u` standing inside its own empire's borders? */
export const atHome = (s: GameState, u: Unit): boolean => { const t = tileOf(s, u.x, u.y); return !!t && tileOwnerPlayer(s, t) === u.owner; };

// ---------------------------------------------------------------- war

/** Empires the Mapuche have met and are at war with (diplomacy on only). */
export function foes(s: GameState, owner: number): number[] {
  if (!diploOn(s)) return [];
  return s.players.filter((p) => canDeal(s, owner, p.id) && relation(s, owner, p.id) === 'war').map((p) => p.id);
}

/** Hostile, non-neutral units within THREAT_RANGE tiles of one of `owner`'s cities. */
export function threats(s: GameState, owner: number): Unit[] {
  const cs = citiesOf(s, owner);
  return s.units.filter((u) => u.owner !== owner && !s.players[u.owner]?.neutral && (!diploOn(s) || relation(s, owner, u.owner) === 'war')
    && cs.some((c) => near(c.x, c.y, u.x, u.y, THREAT_RANGE)));
}

/** Is `owner` at war, so a Toqui may be elected? */
export const atWar = (s: GameState, owner: number): boolean => (diploOn(s) ? foes(s, owner).length > 0 : threats(s, owner).length > 0);

// ---------------------------------------------------------------- the Toqui

/** Turns of the Toqui's reign left, counting this one (0: no Toqui). */
export function toquiLeft(s: GameState, owner: number): number {
  const t = peek(s, owner).toqui;
  return t === undefined ? 0 : Math.max(0, t + TOQUI_TURNS - s.turn);
}
export const toquiActive = (s: GameState, owner: number) => isMapuche(s, owner) && toquiLeft(s, owner) > 0;
/** Turns until a Toqui may be elected again (0: now). */
export function toquiIn(s: GameState, owner: number): number {
  const t = peek(s, owner).toqui;
  return t === undefined ? 0 : Math.max(0, t + TOQUI_EVERY - s.turn);
}
/** Is the next election free (won at a Parlamento)? */
export const toquiFree = (s: GameState, owner: number) => !!peek(s, owner).free;
export const toquiCost = (s: GameState, owner: number) => (toquiFree(s, owner) ? 0 : TOQUI_COST);

/** Why a Toqui can't be elected now (stars aside), or null. */
export function toquiWhy(s: GameState, owner: number): string | null {
  if (!isMapuche(s, owner)) return 'Only the Mapuche elect a toqui';
  if (!capitalOf(s, owner)) return 'Only at your capital';
  const wait = toquiIn(s, owner);
  if (wait > 0) return toquiLeft(s, owner) > 0 ? 'A toqui already leads' : `The council meets again in ${wait} turn${wait > 1 ? 's' : ''}`;
  if (!atWar(s, owner)) return diploOn(s) ? 'A toqui is chosen only in war' : 'A toqui is chosen only when enemies are near';
  return null;
}

/** Elect a Toqui (stars are paid by the caller). */
export function electToqui(s: GameState, owner: number): boolean {
  if (toquiWhy(s, owner)) return false;
  const st = state(s, owner);
  st.toqui = s.turn;
  st.elections = (st.elections ?? 0) + 1;
  delete st.free;
  emit({ type: 'toast', player: owner, text: `🪓 The lonkos elect a toqui to lead the war: for ${TOQUI_TURNS} turns every Mapuche unit moves +${TOQUI_MOVE} and attacks +${TOQUI_ATK}.` });
  return true;
}

// ---------------------------------------------------------------- the Parlamento

/** Turns until the next Parlamento (0: now). */
export function parlIn(s: GameState, owner: number): number {
  const t = peek(s, owner).parl;
  return t === undefined ? 0 : Math.max(0, t + PARL_EVERY - s.turn);
}

/** Which way a Parlamento held now would go: 'peace' (court the empires at war with us) or 'rest' (heal, free Toqui). */
export const parlMode = (s: GameState, owner: number): 'peace' | 'rest' => (foes(s, owner).length ? 'peace' : 'rest');

export function parlWhy(s: GameState, owner: number): string | null {
  if (!isMapuche(s, owner)) return 'Only the Mapuche hold a koyang';
  if (!capitalOf(s, owner)) return 'Only at your capital';
  const wait = parlIn(s, owner);
  if (wait > 0) return `The next koyang in ${wait} turn${wait > 1 ? 's' : ''}`;
  return null;
}

/** Hold a Parlamento (stars are paid by the caller). Returns false when it can't be held. */
export function holdParlamento(s: GameState, owner: number): boolean {
  if (parlWhy(s, owner)) return false;
  const st = state(s, owner);
  st.parl = s.turn;
  if (parlMode(s, owner) === 'peace') {
    const mood = s.diplo!.mood;
    let sent = 0;
    for (const f of foes(s, owner)) {
      const key = `${f}:${owner}`; // how they feel about us
      mood[key] = Math.min(MOOD_CAP, (mood[key] ?? 0) + PARL_MOOD);
      if (!offerCheck(s, owner, f, 'peace') && propose(s, owner, f, 'peace')) sent++;
    }
    emit({ type: 'toast', player: owner, text: `🤝 A koyang is held: envoys carry the canelo branch to every enemy (opinion +${PARL_MOOD}${sent ? `, ${sent} peace offer${sent > 1 ? 's' : ''} sent` : ''}).` });
    return true;
  }
  for (const u of s.units) {
    if (u.owner !== owner || u.hp >= maxHp(u)) continue;
    const n = Math.min(PARL_HEAL, maxHp(u) - u.hp);
    u.hp += n;
    emit({ type: 'heal', unitId: u.id, x: u.x, y: u.y, amount: n });
  }
  st.free = true;
  emit({ type: 'toast', player: owner, text: `🤝 A koyang is held: the warriors rest (+${PARL_HEAL} HP) and the next toqui is chosen at no cost.` });
  return true;
}

export const mech: Mechanic = {
  name: 'The Toqui & the Parlamento',
  blurb: `In war, elect a Toqui at the capital (${TOQUI_COST}★, every ${TOQUI_EVERY} turns): for ${TOQUI_TURNS} turns every unit moves +${TOQUI_MOVE} and attacks +${TOQUI_ATK}. Hold a Parlamento (${PARL_COST}★, every ${PARL_EVERY} turns): with diplomacy, every enemy warms to you (+${PARL_MOOD}) and is offered peace; otherwise your units heal ${PARL_HEAL} HP and the next Toqui is free. Unconquered: your units inside your borders defend +${HOME_DEF}.`,

  stat(s, owner, u, stat) {
    if (u.owner !== owner || !isMapuche(s, owner)) return 0;
    if (stat === 'def') return atHome(s, u) ? HOME_DEF : 0;
    if (!toquiActive(s, owner)) return 0;
    return stat === 'atk' ? TOQUI_ATK : stat === 'move' ? TOQUI_MOVE : 0;
  },

  actions(s, owner, t): Action[] {
    if (!isMapuche(s, owner) || capTile(s, owner) !== t) return [];
    const stars = s.players[owner].stars;
    const cost = toquiCost(s, owner);
    const tw = toquiWhy(s, owner) ?? (stars < cost ? 'Not enough stars' : null);
    const mode = parlMode(s, owner);
    const pw = parlWhy(s, owner) ?? (stars < PARL_COST ? 'Not enough stars' : null);
    return [
      {
        id: 'mech:toqui', label: 'Elect a Toqui', cost, icon: 'axe', enabled: !tw, reason: tw ?? undefined,
        desc: `The lonkos choose a war chief for this war: for ${TOQUI_TURNS} turns every Mapuche unit moves +${TOQUI_MOVE} and attacks +${TOQUI_ATK}. Only in war; once every ${TOQUI_EVERY} turns.${cost === 0 ? ' Free: agreed at the last koyang.' : ''}`,
      },
      {
        id: 'mech:parlamento', label: 'Hold a Parlamento', cost: PARL_COST, icon: 'flag', enabled: !pw, reason: pw ?? undefined,
        desc: mode === 'peace'
          ? `A koyang with every empire at war with you: each one's opinion of you rises by ${PARL_MOOD} and a peace offer is sent where one may be. Once every ${PARL_EVERY} turns.`
          : `With no war to settle, the council rests: every unit heals ${PARL_HEAL} HP and the next Toqui costs nothing. Once every ${PARL_EVERY} turns.`,
      },
    ];
  },

  doAction(s, owner, t, id) {
    if ((id !== 'mech:toqui' && id !== 'mech:parlamento') || capTile(s, owner) !== t) return false;
    return id === 'mech:toqui' ? electToqui(s, owner) : holdParlamento(s, owner);
  },

  // Elects a Toqui as soon as enemies come near its cities; holds a Parlamento when an enemy is the stronger, or (with
  // nothing to settle) to rest a battered army.
  ai(s, owner) {
    if (!isMapuche(s, owner)) return false;
    const p = s.players[owner];
    const cost = toquiCost(s, owner);
    if (!toquiWhy(s, owner) && p.stars >= cost && threats(s, owner).length > 0) {
      p.stars -= cost; // the core charges only for human-issued actions; the AI pays here
      return electToqui(s, owner);
    }
    if (parlWhy(s, owner) || p.stars < PARL_COST) return false;
    const want = parlMode(s, owner) === 'peace'
      ? foes(s, owner).some((f) => power(s, f) > power(s, owner) * AI_PARL_FEAR && !offerCheck(s, owner, f, 'peace'))
      : s.units.filter((u) => u.owner === owner && maxHp(u) - u.hp >= PARL_HEAL).length >= 3;
    if (!want) return false;
    p.stars -= PARL_COST;
    return holdParlamento(s, owner);
  },
};

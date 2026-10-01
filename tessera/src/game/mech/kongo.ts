import { emit } from '../events';
import { hostile } from '../diplomacy';
import { citiesOf, tileOwnerPlayer } from '../rules';
import type { Action } from '../rules';
import type { City, GameState, Tile, Unit } from '../types';
import type { Mechanic } from './types';

// Kingdom of Cloth (empire bonus) + Nkisi Guardians & the Raffia Treasury (signature).
//
// Kingdom of Cloth (`income`): every orchard improvement inside Kongo's borders pays ORCHARD_STARS (+1★) a turn.
//
// Nkisi Guardians (`mech:nkisi`, a city action, NKISI_COST★, once per city): a carved nkisi nkondi, a wooden power figure
// studded with iron nails and blades, is set up at the city (`city.data.nkisi` = the turn it was raised). Any unit of an
// empire hostile to Kongo standing on or next to that city attacks −NKISI_ATK (the `stat` hook, called for every unit;
// Kongo's own units and those of its peace/alliance partners are untouched). Captured cities keep their figure, but it
// only guards while a Kongo empire holds the city.
//
// Raffia Treasury (`mech:weave`, at the capital, WEAVE_COST★): 5★ are woven into one bolt of raffia cloth, the kingdom's
// currency, kept in `player.mech.bolts` (at most MAX_BOLTS). Each bolt pays BOLT_STARS★ every turn (the `income` hook):
// a savings account no raider can carry off. But the cloth is stored at the court: if the capital falls
// (`cityCaptured`, tracked by `player.mech.seat`, the capital's city id) every bolt is lost.

export const ORCHARD_STARS = 1;
export const NKISI_COST = 5;
export const NKISI_ATK = 1;
export const WEAVE_COST = 5;
export const MAX_BOLTS = 5;
export const BOLT_STARS = 1;
/** Stars the computer keeps in hand after raising an nkisi. */
export const AI_NKISI_RESERVE = 2;
/** Stars the computer must hold before it weaves (it weaves only when rich). */
export const AI_WEAVE_AT = 18;
/** How close (tiles) an enemy must be for the computer to call a city threatened. */
export const AI_THREAT = 2;

interface KongoState { bolts?: number; seat?: number; woven?: number; lost?: number }

const isKongo = (s: GameState, pid: number) => s.players[pid]?.tribe === 'kongo';
const state = (s: GameState, owner: number): KongoState => (s.players[owner].mech ??= {}) as KongoState;
const peek = (s: GameState, owner: number): KongoState => (s.players[owner].mech ?? {}) as KongoState;
const near = (ax: number, ay: number, bx: number, by: number, r: number) => Math.max(Math.abs(ax - bx), Math.abs(ay - by)) <= r;
const cityOn = (s: GameState, t: Tile): City | undefined => (t.cityId === null ? undefined : s.cities.find((c) => c.id === t.cityId));

// ---------------------------------------------------------------- Kingdom of Cloth

/** Orchards inside `owner`'s borders. */
export const orchards = (s: GameState, owner: number): Tile[] =>
  s.tiles.filter((t) => t.improvement === 'orchard' && tileOwnerPlayer(s, t) === owner);

export const orchardIncome = (s: GameState, owner: number) => (isKongo(s, owner) ? ORCHARD_STARS * orchards(s, owner).length : 0);

// ---------------------------------------------------------------- Nkisi

/** Does city `c` have an nkisi figure? */
export const hasNkisi = (c: City) => typeof c.data?.nkisi === 'number';

/** `owner`'s cities guarded by an nkisi. */
export const nkisiCities = (s: GameState, owner: number): City[] => citiesOf(s, owner).filter(hasNkisi);

/** Is a unit at (x, y) on or next to one of `owner`'s nkisi cities? */
export const byNkisi = (s: GameState, owner: number, x: number, y: number) =>
  nkisiCities(s, owner).some((c) => near(c.x, c.y, x, y, 1));

/** Why an nkisi can't be raised at city `c` (stars aside), or null. */
export function nkisiWhy(s: GameState, owner: number, c: City | undefined): string | null {
  if (!isKongo(s, owner)) return 'Only Kongo raises nkisi';
  if (!c || c.owner !== owner) return 'Only in your own city';
  if (hasNkisi(c)) return 'This city already has its nkisi';
  return null;
}

/** Set up an nkisi guardian at city `c` (stars are paid by the caller). */
export function raiseNkisi(s: GameState, owner: number, c: City): boolean {
  if (nkisiWhy(s, owner, c)) return false;
  c.data = { ...(c.data ?? {}), nkisi: s.turn };
  emit({ type: 'toast', player: owner, text: `🪆 An nkisi nkondi stands guard at ${c.name}: enemies beside the city attack −${NKISI_ATK}.` });
  return true;
}

// ---------------------------------------------------------------- Raffia Treasury

/** Bolts of raffia cloth in the treasury. */
export const bolts = (s: GameState, owner: number) => peek(s, owner).bolts ?? 0;
export const boltIncome = (s: GameState, owner: number) => (isKongo(s, owner) ? BOLT_STARS * bolts(s, owner) : 0);

/** `owner`'s capital. */
export const capitalOf = (s: GameState, owner: number): City | undefined => citiesOf(s, owner).find((c) => c.capital);

/** Why cloth can't be woven at city `c` (stars aside), or null. */
export function weaveWhy(s: GameState, owner: number, c: City | undefined): string | null {
  if (!isKongo(s, owner)) return 'Only Kongo weaves raffia';
  if (!c || c.owner !== owner || !c.capital) return 'Only at your capital';
  if (bolts(s, owner) >= MAX_BOLTS) return `The treasury holds ${MAX_BOLTS} bolts at most`;
  return null;
}

/** Weave one bolt of raffia at the capital `c` (stars are paid by the caller). */
export function weave(s: GameState, owner: number, c: City): boolean {
  if (weaveWhy(s, owner, c)) return false;
  const st = state(s, owner);
  st.bolts = (st.bolts ?? 0) + 1;
  st.seat = c.id;
  st.woven = (st.woven ?? 0) + 1;
  emit({ type: 'toast', player: owner, text: `🧶 A bolt of raffia cloth is laid in the treasury at ${c.name} (${st.bolts}/${MAX_BOLTS}): +${BOLT_STARS}★ a turn each.` });
  return true;
}

/** Is `u` an enemy of Kongo player `owner`? */
const foe = (s: GameState, owner: number, u: Unit) => u.owner !== owner && hostile(s, owner, u.owner);

export const mech: Mechanic = {
  name: 'Nkisi Guardians & the Raffia Treasury',
  blurb: `Raise an nkisi nkondi in a city (${NKISI_COST}★, once per city): enemies on or beside it attack −${NKISI_ATK}. At the capital, weave ${WEAVE_COST}★ into a bolt of raffia cloth (up to ${MAX_BOLTS}): each bolt pays +${BOLT_STARS}★ a turn and can't be stolen, but all are lost if the capital falls. Kingdom of Cloth: every orchard pays +${ORCHARD_STARS}★ a turn.`,

  setup(s, owner) {
    if (!isKongo(s, owner)) return;
    const cap = capitalOf(s, owner);
    if (cap) state(s, owner).seat = cap.id;
  },

  turnStart(s, owner) {
    if (!isKongo(s, owner)) return;
    const cap = capitalOf(s, owner);
    if (cap && peek(s, owner).seat !== cap.id) state(s, owner).seat = cap.id;
  },

  income(s, owner) {
    return orchardIncome(s, owner) + boltIncome(s, owner);
  },

  stat(s, owner, u, stat) {
    if (stat !== 'atk' || !isKongo(s, owner) || !foe(s, owner, u)) return 0;
    return byNkisi(s, owner, u.x, u.y) ? -NKISI_ATK : 0;
  },

  cityCaptured(s, owner, c, from) {
    if (from !== owner || !isKongo(s, owner)) return;
    const st = peek(s, owner);
    if (st.seat !== c.id || !st.bolts) return;
    const n = st.bolts;
    state(s, owner).bolts = 0;
    state(s, owner).lost = (st.lost ?? 0) + n;
    emit({ type: 'toast', player: owner, text: `🧶 ${c.name} has fallen: the ${n} bolt${n > 1 ? 's' : ''} of raffia in the royal treasury are lost.` });
  },

  actions(s, owner, t): Action[] {
    const c = cityOn(s, t);
    if (!isKongo(s, owner) || !c || c.owner !== owner) return [];
    const stars = s.players[owner].stars;
    const out: Action[] = [];
    if (!hasNkisi(c)) {
      const why = nkisiWhy(s, owner, c) ?? (stars < NKISI_COST ? 'Not enough stars' : null);
      out.push({
        id: 'mech:nkisi', label: 'Raise Nkisi', cost: NKISI_COST, icon: 'temple', enabled: !why, reason: why ?? undefined,
        desc: `Set up an nkisi nkondi, a carved guardian figure driven with iron nails: enemy units on or beside ${c.name} attack −${NKISI_ATK}. Once per city.`,
      });
    }
    if (c.capital) {
      const why = weaveWhy(s, owner, c) ?? (stars < WEAVE_COST ? 'Not enough stars' : null);
      out.push({
        id: 'mech:weave', label: 'Weave Raffia', cost: WEAVE_COST, icon: 'market', enabled: !why, reason: why ?? undefined,
        desc: `Weave ${WEAVE_COST}★ into a bolt of raffia cloth for the treasury (${bolts(s, owner)}/${MAX_BOLTS}). Each bolt pays +${BOLT_STARS}★ a turn and can't be stolen, but all are lost if the capital falls.`,
      });
    }
    return out;
  },

  doAction(s, owner, t, id) {
    if (id !== 'mech:nkisi' && id !== 'mech:weave') return false;
    const c = cityOn(s, t);
    if (!c) return false;
    return id === 'mech:nkisi' ? raiseNkisi(s, owner, c) : weave(s, owner, c);
  },

  // Raises an nkisi at the most threatened unguarded city, then weaves raffia when the treasury is rich.
  ai(s, owner) {
    if (!isKongo(s, owner)) return false;
    const p = s.players[owner];
    if (p.stars >= NKISI_COST + AI_NKISI_RESERVE) {
      let best: City | null = null, bt = 0;
      for (const c of citiesOf(s, owner)) {
        if (hasNkisi(c)) continue;
        const threat = s.units.filter((u) => foe(s, owner, u) && near(u.x, u.y, c.x, c.y, AI_THREAT)).length;
        const v = threat + (threat && c.capital ? 0.5 : 0);
        if (v > bt) { bt = v; best = c; }
      }
      if (best) {
        p.stars -= NKISI_COST; // the core charges only for human-issued actions; the AI pays here
        return raiseNkisi(s, owner, best);
      }
    }
    const cap = capitalOf(s, owner);
    if (cap && p.stars >= AI_WEAVE_AT && !weaveWhy(s, owner, cap)) {
      p.stars -= WEAVE_COST;
      return weave(s, owner, cap);
    }
    return false;
  },
};

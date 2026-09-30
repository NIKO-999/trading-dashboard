// Eras and Ages. An empire moves from the Ancient era to the Classical, Medieval and Renaissance as it learns techs
// (ERAS[].at techs known). Crossing into a new era pays a one-off bonus and is announced to every empire that has
// met it. How the era just ended went decides the Age that follows: a high Era Score (Eurekas, battles won, cities
// grown, wonders raised since the era began) brings a Golden Age, a low one a Dark Age, each for AGE_TURNS turns:
//  - Golden Age: +GOLDEN_STARS★ a turn in every city;
//  - Dark Age: techs cost DARK_OFF less, the catch-up of a people with something to prove.
import { TRIBES } from '../data/tribes';
import { wondersHeldBy } from '../data/wonders';
import { emit } from './events';
import { addPop, citiesOf } from './rules';
import type { GameState, Player } from './types';

export interface EraDef { name: string; at: number; bonus: string }
export const ERAS: EraDef[] = [
  { name: 'Ancient', at: 0, bonus: '' },
  { name: 'Classical', at: 6, bonus: 'every city grows +1 and the treasury gains 5★' },
  { name: 'Medieval', at: 12, bonus: 'every city grows +1 and the treasury gains 10★' },
  { name: 'Renaissance', at: 20, bonus: 'every city grows +2 and the treasury gains 15★' },
];
const ERA_STARS = [0, 5, 10, 15];
const ERA_POP = [0, 1, 1, 2];
/** Score for each era reached. */
export const ERA_SCORE = 150;

export const GOLDEN_AT = 7;
export const DARK_AT = 2;
export const AGE_TURNS = 5;
export const GOLDEN_STARS = 1;
export const DARK_OFF = 0.25;

export type Age = 'golden' | 'dark' | null;
export interface EraState {
  n: number; // the era index
  snap: { sparks: number; kills: number; levels: number; wonders: number }; // counts when the era began
  age: Age;
  until: number; // the turn the Age ends
}

const counts = (s: GameState, p: Player) => ({
  sparks: p.sparks?.length ?? 0,
  kills: p.kills,
  levels: citiesOf(s, p.id).reduce((a, c) => a + c.level, 0),
  wonders: wondersHeldBy(s, p.id).length,
});

export function eraState(s: GameState, pid: number): EraState {
  const p = s.players[pid];
  return (p.era ??= { n: eraIndex(p), snap: counts(s, p), age: null, until: 0 });
}

export const eraIndex = (p: Player) => {
  let n = 0;
  for (let i = 0; i < ERAS.length; i++) if (p.techs.length >= ERAS[i].at) n = i;
  return n;
};

/** Era Score so far this era: a Eureka, a battle won (up to 4), a city level and a World Wonder (3) each count. */
export function eraScore(s: GameState, pid: number): number {
  const e = eraState(s, pid);
  const now = counts(s, s.players[pid]);
  return (now.sparks - e.snap.sparks) + Math.min(4, now.kills - e.snap.kills) + Math.max(0, now.levels - e.snap.levels) + 3 * (now.wonders - e.snap.wonders);
}

export const ageOf = (s: GameState, pid: number): Age => {
  const e = s.players[pid].era;
  return e && e.age && s.turn < e.until ? e.age : null;
};

/** Stars a Golden Age adds to a city's income. */
export const ageCityIncome = (s: GameState, pid: number) => (ageOf(s, pid) === 'golden' ? GOLDEN_STARS : 0);

/** Moves `pid` into any era its techs have reached, with the bonus, the Age and the news. */
export function eraCheck(s: GameState, pid: number) {
  const p = s.players[pid];
  if (!p || p.neutral || !p.alive) return;
  const e = eraState(s, pid);
  const target = eraIndex(p);
  while (e.n < target) {
    const score = eraScore(s, pid);
    e.n++;
    const era = ERAS[e.n];
    for (const c of citiesOf(s, pid)) addPop(s, c, ERA_POP[e.n]);
    p.stars += ERA_STARS[e.n];
    p.bonusScore += ERA_SCORE;
    e.age = score >= GOLDEN_AT ? 'golden' : score <= DARK_AT ? 'dark' : null;
    e.until = s.turn + AGE_TURNS;
    e.snap = counts(s, p);
    const age = e.age === 'golden' ? ` A Golden Age begins (Era Score ${score}): +${GOLDEN_STARS}★ in every city for ${AGE_TURNS} turns!`
      : e.age === 'dark' ? ` A Dark Age falls (Era Score ${score}): techs cost ${Math.round(DARK_OFF * 100)}% less for ${AGE_TURNS} turns while you rebuild.`
      : ` A Normal Age (Era Score ${score}; ${GOLDEN_AT}+ brings a Golden Age).`;
    emit({ type: 'toast', player: pid, text: `🏛 The ${era.name} Era: ${era.bonus}.${age}` });
    for (const q of s.players) {
      if (q.id === pid || !q.alive || q.neutral || !q.met?.includes(pid)) continue;
      emit({ type: 'toast', player: q.id, text: `🏛 The ${TRIBES[p.tribe].people} have entered the ${era.name} Era${e.age === 'golden' ? ' in a Golden Age' : ''}.` });
    }
  }
}

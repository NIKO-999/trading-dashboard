// City Festivals: a way to turn spare Stars into growth and fame when there is nothing better to buy. Any city may hold
// one festival a turn from its tile menu: the city grows +1 and the empire gains FEST_SCORE. Each festival a city has
// held makes its next one dearer (FEST_BASE + FEST_STEP per festival held), so it is a sink, not a shortcut.
import { emit } from './events';
import { addPop, cityById, citiesOf, doAction, type Action } from './rules';
import type { City, GameState, Tile } from './types';

export const FEST_BASE = 12;
export const FEST_STEP = 6;
export const FEST_SCORE = 50;

const held = (c: City) => Number(c.data?.fests ?? 0);
export const festCost = (c: City) => FEST_BASE + FEST_STEP * held(c);

export function festivalActions(s: GameState, pid: number, t: Tile): Action[] {
  const c = cityById(s, t.cityId);
  if (!c || c.owner !== pid || t.cityId !== c.id || s.players[pid].neutral) return [];
  const cost = festCost(c);
  const why = c.data?.festTurn === s.turn ? 'Already celebrating this turn' : s.players[pid].stars < cost ? 'Not enough stars' : undefined;
  return [{
    id: 'fest', label: 'Hold a Festival', icon: 'temple', cost, enabled: !why, reason: why,
    desc: `+1 population and +${FEST_SCORE} score. Festivals held here: ${held(c)}; each makes the next ${FEST_STEP}★ dearer.`,
  }];
}

export function festivalDo(s: GameState, pid: number, t: Tile): boolean {
  const c = cityById(s, t.cityId);
  if (!c || c.owner !== pid) return false;
  c.data = { ...(c.data ?? {}), fests: held(c) + 1, festTurn: s.turn };
  s.players[pid].bonusScore += FEST_SCORE;
  addPop(s, c, 1);
  emit({ type: 'harvest', player: pid, x: c.x, y: c.y, pop: 1 });
  return true;
}

/** An AI with a treasury it cannot otherwise use holds a festival in the city where it is cheapest. */
export function festivalAi(s: GameState, pid: number, reserve: number): boolean {
  const p = s.players[pid];
  const c = citiesOf(s, pid).filter((k) => k.data?.festTurn !== s.turn).sort((a, b) => festCost(a) - festCost(b))[0];
  if (!c || p.stars < festCost(c) + reserve) return false;
  return doAction(s, pid, s.tiles[c.y * s.size + c.x], 'fest');
}

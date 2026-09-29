import { emit } from './events';
import { revealAround } from './mapgen';
import { perkSum } from './perks';
import { tickPower, checkElimination, checkGameOver, citiesOf, income, maxHp, tileOwnerPlayer } from './rules';
import { tileAt } from './grid';
import type { GameState } from './types';

const AI_BONUS = { easy: 0, normal: 1, hard: 2 } as const;

/** Called when `s.current` begins its turn. */
export function startTurn(s: GameState) {
  const p = s.players[s.current];
  if (s.turn > 0) {
    const inc = income(s, p.id) + (p.human ? 0 : AI_BONUS[s.difficulty]);
    p.stars += inc;
  }
  for (const u of s.units) {
    u.hp = Math.min(u.hp, maxHp(u)); // saves from before boats kept their passenger's health
    if (u.owner !== p.id) continue;
    u.moved = false;
    u.attacked = false;
  }
  for (const u of s.units) { // tundra: cold nips at units left out beyond your borders
    if (u.owner !== p.id || u.hp <= 1) continue;
    const t = tileAt(s, u.x, u.y)!;
    if (t.terrain === 'tundra' && !t.road && t.cityId === null && tileOwnerPlayer(s, t) !== p.id) {
      u.hp -= 1;
      emit({ type: 'damage', unitId: u.id, x: u.x, y: u.y, amount: 1 });
    }
  }
  const heal = perkSum(s, p.id, 'heal'); // healing perks of the skill line
  if (heal > 0) {
    for (const u of s.units) {
      if (u.owner !== p.id || u.hp >= maxHp(u) || tileOwnerPlayer(s, tileAt(s, u.x, u.y)!) !== p.id) continue;
      const before = u.hp;
      u.hp = Math.min(maxHp(u), u.hp + heal);
      emit({ type: 'heal', unitId: u.id, x: u.x, y: u.y, amount: u.hp - before });
    }
  }
  tickPower(s, p.id);
  revealAround(s, p.id);
}

/** Ends the current player's turn and starts the next living player's. */
export function endTurn(s: GameState) {
  if (s.over) return;
  for (const p of s.players) if (p.alive) checkElimination(s, p.id, s.current);
  checkGameOver(s);
  if (s.over) return;
  let next = s.current;
  do {
    next = (next + 1) % s.players.length;
    if (next === 0) s.turn++;
  } while (!s.players[next].alive);
  s.current = next;
  checkGameOver(s);
  if (!s.over) startTurn(s);
}

export { checkGameOver };

export const isHumanTurn = (s: GameState) => s.players[s.current].human && !s.over;
export const cityCount = (s: GameState, pid: number) => citiesOf(s, pid).length;

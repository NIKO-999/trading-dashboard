import { emit } from './events';
import { revealAround } from './mapgen';
import { checkElimination, citiesOf, income, livingPlayers, score } from './rules';
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
    if (u.owner !== p.id) continue;
    u.moved = false;
    u.attacked = false;
  }
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

export function checkGameOver(s: GameState) {
  if (s.over) return;
  const alive = livingPlayers(s);
  const humans = s.players.filter((p) => p.human);
  if (humans.length && humans.every((p) => !p.alive)) {
    s.over = true;
    s.winner = bestScorer(s);
  } else if (alive.length === 1) {
    s.over = true;
    s.winner = alive[0].id;
  } else if (s.mode === 'perfection' && s.maxTurns > 0 && s.turn >= s.maxTurns) {
    s.over = true;
    s.winner = bestScorer(s);
  }
  if (s.over) emit({ type: 'toast', player: -1, text: 'Game over' });
}

function bestScorer(s: GameState) {
  return livingPlayers(s).sort((a, b) => score(s, b.id) - score(s, a.id))[0]?.id ?? null;
}

export const isHumanTurn = (s: GameState) => s.players[s.current].human && !s.over;
export const cityCount = (s: GameState, pid: number) => citiesOf(s, pid).length;

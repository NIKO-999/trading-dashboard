import { emit } from './events';
import { goodsTurnStart } from './goods';
import { checkSparks } from './sparks';
import { eraCheck } from './eras';
import { govTurnStart } from './governors';
import { govTurnStart as policyTurnStart } from './government';
import { revealAround } from './mapgen';
import { hookIncome, hookTurnEnd, hookTurnStart } from './mech';
import { perkSum } from './perks';
import { skillTurnStart } from './skills';
import { checkElimination, checkGameOver, citiesOf, income, maxHp, tileOwnerPlayer } from './rules';
import { tileAt } from './grid';
import { cultureUnrest } from './rebels';
import { diploTurnStart } from './diplomacy';
import { wildRound } from './wild';
import { wonderTurnStart } from './wonders';
import { naturalTurnStart } from './naturals';
import { tradeSweep } from './trade';
import { outOfSupply, supplyTurnStart } from './army';
import type { GameState } from './types';

const AI_BONUS = { easy: 0, normal: 1, hard: 2 } as const;

/** Called when `s.current` begins its turn. */
export function startTurn(s: GameState) {
  const p = s.players[s.current];
  if (s.turn > 0) cultureUnrest(s, p.id); // restless conquered cities may revolt before they pay (see game/rebels)
  tradeSweep(s); // trade routes to cities that changed hands, or between empires now at war, are cut (see game/trade)
  if (s.turn > 0) {
    const inc = income(s, p.id) + hookIncome(s, p.id) + (p.human ? 0 : AI_BONUS[s.difficulty]);
    p.stars += inc;
    goodsTurnStart(s, p.id); // mines dig Iron, pastures breed Horses (see game/goods)
  }
  diploTurnStart(s, p.id); // declared wars begin, trade and tribute pay, allies share maps (see game/diplomacy)
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
  supplyTurnStart(s, p.id); // units far beyond the borders run short of supplies (see game/army)
  const heal = perkSum(s, p.id, 'heal'); // healing perks of the skill line
  if (heal > 0) {
    for (const u of s.units) {
      if (u.owner !== p.id || u.hp >= maxHp(u) || outOfSupply(u) || tileOwnerPlayer(s, tileAt(s, u.x, u.y)!) !== p.id) continue;
      const before = u.hp;
      u.hp = Math.min(maxHp(u), u.hp + heal);
      emit({ type: 'heal', unitId: u.id, x: u.x, y: u.y, amount: u.hp - before });
    }
  }
  hookTurnStart(s, p.id);
  skillTurnStart(s, p.id);
  wonderTurnStart(s, p.id); // a wonder site on land it has lost is closed (see game/wonders)
  naturalTurnStart(s, p.id); // Natural Wonders won or lost, the Falls heal, the Elder grows its city (see game/naturals)
  revealAround(s, p.id);
  checkSparks(s, p.id); // Eurekas (see game/sparks)
  govTurnStart(s, p.id); // Stewards grow their cities, governors are promoted (see game/governors)
  eraCheck(s, p.id); // a tech from a ruin or a gift can cross into a new era (see game/eras)
  policyTurnStart(s, p.id); // policy cards swapped in last turn come into force (see game/government)
}

/** Ends the current player's turn and starts the next living player's. */
export function endTurn(s: GameState) {
  if (s.over) return;
  for (const p of s.players) if (p.alive) checkElimination(s, p.id, s.current);
  checkGameOver(s);
  if (s.over) return;
  hookTurnEnd(s, s.current);
  checkSparks(s, s.current); // what the turn's moves earned (see game/sparks)
  let next = s.current;
  do {
    next = (next + 1) % s.players.length;
    if (next === 0) {
      wildRound(s); // neutral beasts, volcanoes and camps act once a round, after the last empire (see game/wild)
      s.turn++;
    }
  } while (!s.players[next].alive);
  s.current = next;
  checkGameOver(s);
  if (!s.over) startTurn(s);
}

export { checkGameOver };

export const isHumanTurn = (s: GameState) => s.players[s.current].human && !s.over;
export const cityCount = (s: GameState, pid: number) => citiesOf(s, pid).length;

// Skill-tree upkeep that runs with the turn: announcing when a Wildcard starts or stops surging (its map condition
// came or went) and when Pax Romana breaks or returns. The effects themselves are perks (game/perks.ts) and rules.
import { SKILLS } from '../data/skills';
import { COND_TEXT, condActive } from './alignment';
import { emit } from './events';
import { hasTech, paxHolds } from './rules';
import type { GameState } from './types';

/** The Wildcards `pid` knows whose condition holds right now. */
export const surgingNodes = (s: GameState, pid: number): string[] =>
  SKILLS.filter((k) => k.cond && hasTech(s, pid, k.id) && condActive(s, pid, k.cond)).map((k) => k.id);

/** At the start of `pid`'s turn: tell the player what changed in its Alignment ring. */
export function skillTurnStart(s: GameState, pid: number) {
  const p = s.players[pid];
  if (!p.techs.some((id) => id.startsWith('wild:') || id === 'rome:3')) return;
  const sk = (p.skill ??= {});
  const now = surgingNodes(s, pid);
  const before = sk.surges ?? [];
  const say = (text: string) => { emit({ type: 'toast', player: pid, text }); s.log.push({ turn: s.turn, text: `${p.tribe}: ${text}` }); };
  for (const id of now) {
    if (before.includes(id)) continue;
    const k = SKILLS.find((x) => x.id === id)!;
    say(`${k.name} surges: ${COND_TEXT[k.cond!].when}.`);
  }
  for (const id of before) if (!now.includes(id)) say(`${SKILLS.find((x) => x.id === id)?.name ?? id} falls quiet.`);
  sk.surges = now;
  if (hasTech(s, pid, 'rome:3')) {
    const off = !paxHolds(s, pid);
    if (off !== !!sk.paxOff) say(off ? 'Pax Romana is broken: a city was lost.' : 'Pax Romana returns: the roads pay again.');
    sk.paxOff = off;
  }
}

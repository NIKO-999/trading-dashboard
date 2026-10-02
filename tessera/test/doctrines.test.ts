import assert from 'node:assert/strict';
import test from 'node:test';
import { DOCTRINES } from '../src/data/doctrines.ts';
import { techsFor, TECH_BY_ID } from '../src/data/techs.ts';
import { TRIBES } from '../src/data/tribes.ts';
import { createGame } from '../src/game/mapgen.ts';
import { perkSum } from '../src/game/perks.ts';
import { research, researchStatus } from '../src/game/rules.ts';
import { skyLayout, STAR_GAP } from '../src/ui/constellation.ts';

test('every empire type has its own doctrine: three tracks of three techs', () => {
  for (const c of ['military', 'economy', 'naval'] as const) {
    const mine = DOCTRINES.filter((d) => d.category === c);
    assert.equal(mine.length, 9);
    assert.equal(new Set(mine.map((d) => d.track)).size, 3);
    for (const d of mine) assert.ok(TECH_BY_ID[d.parent], `${d.id} grows from a real tech`);
  }
  assert.equal(techsFor('rome').filter((t) => t.ring === 'doctrine').every((t) => t.category === TRIBES.rome.category), true);
});

test('only an empire of the right type can research a doctrine, and its perks apply', () => {
  const s = createGame({ seed: 4, human: 'rome', opponents: ['egypt'], mode: 'domination' }); // Rome: military, Egypt: economy
  const p = s.players[0];
  p.techs.push('gathering', 'tactics');
  assert.equal(researchStatus(s, 0, 'doctrine:drill'), 'available');
  assert.equal(researchStatus(s, 0, 'doctrine:rotation'), 'locked', 'an economy doctrine is closed to Rome');
  s.players[1].techs.push('gathering', 'tactics');
  assert.equal(researchStatus(s, 1, 'doctrine:drill'), 'locked', 'a war doctrine is closed to Egypt');
  const before = perkSum(s, 0, 'def');
  p.stars = 99;
  assert.ok(research(s, 0, 'doctrine:drill'));
  assert.equal(perkSum(s, 0, 'def'), before + 0.5);
});

test('the doctrine stars fit the sky without overlapping', () => {
  for (const tribe of ['rome', 'egypt', 'vikings', 'babylon', 'cree'] as const) {
    const sky = skyLayout(tribe, 1300);
    const d = sky.stars.filter((st) => st.ring === 'doctrine');
    assert.equal(d.length, 9);
    for (const a of d) for (const b of sky.stars) if (a !== b) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= STAR_GAP - 0.01, `${tribe}: ${a.id} too close to ${b.id}`);
  }
});

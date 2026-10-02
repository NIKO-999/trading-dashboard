import assert from 'node:assert/strict';
import test from 'node:test';
import { CIV_BONUSES, ERA_AT } from '../src/data/bonuses.ts';
import { TECH_BY_ID } from '../src/data/techs.ts';
import { TRIBE_IDS } from '../src/data/tribes.ts';
import { ERAS } from '../src/game/eras.ts';
import { newDiplo } from '../src/game/diplomacy.ts';
import { createGame, spawnUnit } from '../src/game/mapgen.ts';
import { describePerk, perkSum } from '../src/game/perks.ts';
import { maxHp, techCost } from '../src/game/rules.ts';

test('every empire has three civilization bonuses and an alliance bonus, each in plain words', () => {
  assert.equal(Object.keys(CIV_BONUSES).length, TRIBE_IDS.length);
  for (const id of TRIBE_IDS) {
    const c = CIV_BONUSES[id];
    assert.equal(c.bonuses.length, 3, id);
    for (const b of [...c.bonuses, c.team]) {
      assert.ok(b.perks.length, id);
      for (const p of b.perks) {
        assert.ok(!/undefined|NaN/.test(describePerk(p)), `${id}: ${describePerk(p)}`);
        if (p.k === 'techcost') assert.ok(TECH_BY_ID[p.tech], `${id}: ${p.tech} is a real tech`);
      }
      if (b.scale) assert.ok(b.text, `${id}: an era-scaled bonus says so`);
    }
  }
  assert.deepEqual([...ERA_AT], ERAS.map((e) => e.at), 'the bonus eras match the game eras');
});

test('health bonuses land on new units, and a starting-Star bonus pays at the start', () => {
  const s = createGame({ seed: 5, human: 'rome', opponents: ['china'], mode: 'domination' });
  const c = s.cities.find((k) => k.owner === 0)!;
  const u = spawnUnit(s, 'warrior', 0, c.x, c.y, null); // Rome: foot soldiers +2 health
  assert.equal(maxHp(u), 12);
  assert.equal(u.hp, 12);
  const rider = spawnUnit(s, 'rider', 0, c.x, c.y, null);
  assert.equal(maxHp(rider), 10 + 0, 'a rider is no foot soldier');
  assert.equal(s.players[1].stars, s.players[0].stars + 5, 'China starts with 5★ more');
});

test('an alliance shares its bonus, and era bonuses grow with the eras', () => {
  const s = createGame({ seed: 6, human: 'rome', opponents: ['egypt'], mode: 'domination' }); // Egypt's alliance bonus: temples 1★ cheaper
  const temples = () => perkSum(s, 0, 'cost', (p) => p.of === 'temple');
  const masonry = techCost(s, 1, 'masonry');
  const before = temples();
  s.diplo ??= newDiplo();
  s.diplo.pacts.push({ a: 0, b: 1, kind: 'alliance', since: 0 });
  assert.equal(temples(), before + 1, 'Rome now shares Egypt’s alliance bonus');
  assert.equal(techCost(s, 1, 'masonry'), Math.max(1, masonry - 2), 'and Egypt shares Rome’s');

  const a = createGame({ seed: 7, human: 'aztec', opponents: ['egypt'], mode: 'domination' });
  const melee = () => perkSum(a, 0, 'atk', (p) => (p as { who?: string }).who === 'melee');
  const base = melee();
  a.players[0].techs = Object.keys(TECH_BY_ID).filter((t) => !t.includes(':')).slice(0, 12);
  assert.equal(melee(), base + 0.5, 'Medieval: +0.5');
  a.players[0].techs = Object.keys(TECH_BY_ID).filter((t) => !t.includes(':')).slice(0, 20);
  assert.equal(melee(), base + 1, 'Renaissance: +1');
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { isLand, neighbors, tileAt } from '../src/game/grid';
import { campSite } from '../src/game/clans';
import { govOf, govsOf } from '../src/game/governors';
import { createGame, spawnUnit } from '../src/game/mapgen';
import { doAction, maxHp, moveOptions } from '../src/game/rules';

test('a captured city loses its governor: governors serve only the empire that appointed them', () => {
  const s = createGame({ seed: 7, human: 'rome', opponents: ['vikings'], mode: 'domination' });
  const theirs = s.cities.find((c) => c.owner === 1)!;
  s.players[1].stars = 50;
  assert.ok(doAction(s, 1, tileAt(s, theirs.x, theirs.y)!, 'gov:treasurer'));
  assert.equal(govOf(theirs)?.k, 'treasurer');
  const t = tileAt(s, theirs.x, theirs.y)!;
  s.units = s.units.filter((u) => !(u.x === t.x && u.y === t.y));
  const u = spawnUnit(s, 'warrior', 0, t.x, t.y, null);
  u.moved = u.attacked = false;
  assert.ok(doAction(s, 0, t, 'capture'));
  assert.equal(theirs.owner, 0);
  assert.equal(govOf(theirs), undefined);
  assert.equal(govsOf(s, 0).length, 0);
});

test('no outlaw camp on a Natural Wonder', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const s = createGame({ seed, human: null, opponents: ['rome', 'vikings', 'egypt'], mode: 'perfection', clans: true } as never);
    for (const n of s.naturals?.sites ?? []) assert.ok(!campSite(s, tileAt(s, n.x, n.y)!), `seed ${seed}: ${n.id}`);
  }
});

test('the One City Challenge has no treaties', () => {
  const s = createGame({ seed: 3, human: 'rome', opponents: ['vikings'], mode: 'onecity', diplomacy: true });
  assert.equal(s.diplo, undefined);
});

test('a unit with bonus health has a higher maximum, not an overflow', () => {
  const s = createGame({ seed: 3, human: 'egypt', opponents: ['vikings'], mode: 'perfection' });
  const g = spawnUnit(s, 'guardian', 0, s.cities[0].x, s.cities[0].y, null);
  g.data = { golden: true, hpBonus: 4 };
  g.hp = 22; // 18 + 4
  assert.equal(maxHp(g), g.hp);
});

test('an empty boat cannot sail onto land', () => {
  const s = createGame({ seed: 5, human: 'swahili', opponents: ['rome'], mode: 'perfection' });
  const sea = s.tiles.find((t) => t.terrain === 'shallow' && !s.units.some((u) => u.x === t.x && u.y === t.y) && neighbors(s, t.x, t.y).some((n) => isLand(n) && n.terrain !== 'mountain' && !s.units.some((u) => u.x === n.x && u.y === n.y)))!;
  s.players[0].explored.fill(true);
  const b = spawnUnit(s, 'boat', 0, sea.x, sea.y, null);
  b.moved = false;
  const opts = moveOptions(s, b);
  assert.ok(opts.length > 0, 'the boat can sail');
  assert.ok(opts.every((o) => !isLand(tileAt(s, o.x, o.y)!)));
});

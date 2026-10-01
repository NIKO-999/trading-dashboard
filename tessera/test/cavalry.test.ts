import assert from 'node:assert/strict';
import test from 'node:test';
import { TRIBE_IDS } from '../src/data/tribes';
import { stockOf } from '../src/game/goods';
import { tileAt } from '../src/game/grid';
import { createGame } from '../src/game/mapgen';
import { MOUNTED_KINDS } from '../src/game/perks';
import { doAction, tileActions, trainableKinds } from '../src/game/rules';

test('every empire can train the Lancer, Mounted Archer and Cataphract', () => {
  for (const tribe of TRIBE_IDS) {
    const s = createGame({ seed: 3, human: tribe, opponents: [tribe === 'rome' ? 'greeks' : 'rome'], mode: 'perfection' });
    const kinds = trainableKinds(s, 0);
    for (const k of ['lancer', 'horsebow', 'cataphract'] as const) {
      assert.ok(kinds.includes(k), `${tribe}: ${k}`);
      assert.ok(MOUNTED_KINDS.includes(k));
    }
  }
});

test('cavalry needs its tech and its horses (and the Cataphract iron too)', () => {
  const s = createGame({ seed: 3, human: 'rome', opponents: ['greeks'], mode: 'perfection' });
  const c = s.cities.find((k) => k.owner === 0)!;
  const t = tileAt(s, c.x, c.y)!;
  s.units = s.units.filter((u) => !(u.x === t.x && u.y === t.y));
  s.players[0].stars = 100;
  s.players[0].techs.push('riding', 'roads', 'horsemanship', 'climbing', 'mining', 'smithing');
  const act = (id: string) => tileActions(s, 0, t).find((a) => a.id === id)!;
  assert.match(act('train:lancer').reason ?? '', /Horses/);
  stockOf(s.players[0]).horses = 3;
  assert.ok(act('train:lancer').enabled);
  assert.match(act('train:cataphract').reason ?? '', /Iron/);
  stockOf(s.players[0]).iron = 1;
  assert.ok(act('train:cataphract').enabled);
  assert.ok(doAction(s, 0, t, 'train:cataphract'));
  assert.deepEqual([stockOf(s.players[0]).iron, stockOf(s.players[0]).horses], [0, 1]);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { tileAt } from '../src/game/grid';
import { createGame } from '../src/game/mapgen';
import { tileActions, type Action } from '../src/game/rules';
import { actionGroup, groupActions, pickTab } from '../src/ui/actiongroups';

const a = (id: string, enabled = true, needs?: string): Action => ({ id, label: id, desc: '', cost: 1, icon: '', enabled, needs });

test('units sort into ground, ranged, mounted, support, ships and economy', () => {
  assert.equal(actionGroup(a('train:warrior')), 'ground');
  assert.equal(actionGroup(a('train:spearman')), 'ground');
  assert.equal(actionGroup(a('train:archer')), 'ranged');
  assert.equal(actionGroup(a('train:catapult')), 'ranged');
  assert.equal(actionGroup(a('train:knight')), 'mounted');
  assert.equal(actionGroup(a('train:horsebow')), 'mounted');
  assert.equal(actionGroup(a('train:healer')), 'support');
  assert.equal(actionGroup(a('train:recruiter')), 'support');
  assert.equal(actionGroup(a('train:trader')), 'economy');
  assert.equal(actionGroup(a('train:builder')), 'economy');
  assert.equal(actionGroup(a('train:fishfleet')), 'ships');
  assert.equal(actionGroup(a('gov:steward')), 'city');
  assert.equal(actionGroup(a('forge:archer')), 'armoury');
  assert.equal(actionGroup(a('farm')), 'build');
});

test('ready first, locked last; the remembered tab is kept', () => {
  const tabs = groupActions([a('train:knight', false, 'chivalry'), a('train:rider'), a('train:lancer', false), a('train:warrior')]);
  const mounted = tabs.find((t) => t.id === 'mounted')!;
  assert.deepEqual(mounted.acts.map((x) => x.id), ['train:rider', 'train:lancer', 'train:knight']);
  assert.equal(mounted.ready, 1);
  assert.equal(pickTab(tabs, 'mounted'), 'mounted');
  assert.equal(pickTab(tabs, 'ships'), 'ground', 'a missing tab falls back to the first with something ready');
});

test('a real city menu splits into several tabs, every action in exactly one', () => {
  const s = createGame({ seed: 7, human: 'rome', opponents: ['greeks'], mode: 'perfection' });
  const c = s.cities.find((k) => k.owner === 0)!;
  s.units = s.units.filter((u) => !(u.x === c.x && u.y === c.y));
  const acts = tileActions(s, 0, tileAt(s, c.x, c.y)!);
  const tabs = groupActions(acts);
  assert.ok(tabs.length >= 4, tabs.map((t) => t.id).join());
  assert.equal(tabs.reduce((n, t) => n + t.acts.length, 0), acts.length);
});

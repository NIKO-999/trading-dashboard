// The tidier map and HUD: readout chips, which units wear a health badge, city-label decluttering and the Great Wall's
// edges. All pure: states come from createGame, nothing touches a page.
import assert from 'node:assert/strict';
import test from 'node:test';
import { aiTurn } from '../src/game/ai';
import { drain } from '../src/game/events';
import { tileAt } from '../src/game/grid';
import { createGame, spawnUnit } from '../src/game/mapgen';
import { isBorder, mandateIncome } from '../src/game/mech/china';
import { citiesOf, maxHp, tileOwnerPlayer } from '../src/game/rules';
import { endTurn, startTurn } from '../src/game/turn';
import type { GameState, TribeId, Unit } from '../src/game/types';
import { newFx, type Overlay } from '../src/render/common';
import { badgeShown, declutterLabels, LABEL_FADE, labelPriority, type LabelBox } from '../src/render/dynamic';
import { wallEdges } from '../src/render/mech/china';
import { CHIP_CHARS, MAX_CHIPS, packChips, shortChip, signedStars, skillChip, unrestChip } from '../src/ui/hudchips';
import { MECH_UI } from '../src/ui/mech';
import type { MechView } from '../src/ui/mech/types';
import { wonderChip } from '../src/ui/wonders';

function game(human: TribeId = 'china', opponents: TribeId[] = ['rome', 'mongols']) {
  const s = createGame({ seed: 11, human, opponents, mode: 'perfection', mapSize: 'normal' });
  startTurn(s);
  return s;
}
const view = (s: GameState, me = 0): MechView => ({ s, me, refresh() {}, act() {}, focus() {} });
const overlay = (selected: { x: number; y: number } | null = null): Overlay => ({ selected, moves: [], attacks: [], glow: new Set(), fx: newFx(), now: 0 });
/** A free land tile `d` tiles east of (x, y), or nearby. */
function freeLand(s: GameState, x: number, y: number, d: number) {
  for (let r = 0; r < 4; r++) for (const [dx, dy] of [[d, r], [d, -r], [-d, r], [-d, -r], [r, d], [-r, d], [r, -d], [-r, -d]]) {
    const t = tileAt(s, x + dx, y + dy);
    if (t && t.terrain !== 'ocean' && t.terrain !== 'shallow' && t.terrain !== 'mountain' && !s.units.some((u) => u.x === t.x && u.y === t.y)) return t;
  }
  throw new Error('no free land');
}

// ------------------------------------------------------------ chips

test('the chip row shows at most three chips and folds the rest into "+N"', () => {
  assert.equal(MAX_CHIPS, 3);
  assert.deepEqual(packChips(['a', 'b']), { shown: ['a', 'b'], more: 0 });
  assert.deepEqual(packChips(['a', 'b', 'c']), { shown: ['a', 'b', 'c'], more: 0 });
  assert.deepEqual(packChips(['a', 'b', 'c', 'd', 'e']), { shown: ['a', 'b', 'c'], more: 2 });
  assert.deepEqual(packChips([]), { shown: [], more: 0 });
});

test('a readout with no summary of its own is shortened to its first part', () => {
  assert.equal(shortChip('☸ Karma +3 · Blessed'), 'Karma +3');
  assert.equal(shortChip('Wind ↗ NE (3t) · Lighthouses 2'), 'Wind ↗ NE…');
  const long = shortChip('Mandate holds +21★ · 21 improved tiles');
  assert.ok(long.length <= CHIP_CHARS && long.endsWith('…'), long);
  assert.equal(shortChip('\u{1F55B} Long Count: Next Era in 3 turns | Katun peak in 2').startsWith('Long'), true);
  assert.equal(signedStars(21), '+21★');
  assert.equal(signedStars(-3), '-3★');
});

test("China's chip is the Mandate's income, e.g. \"🏯 +21★\"", () => {
  const s = game();
  const c = MECH_UI.china!.chip!(view(s));
  assert.ok(c);
  assert.equal(c.icon, '🏯');
  assert.equal(c.text, signedStars(mandateIncome(s, 0)));
  // only China's own player gets it
  assert.equal(MECH_UI.china!.chip!(view(s, 1)), null);
});

test('every mechanic with a readout also has a short chip', () => {
  for (const [tribe, ui] of Object.entries(MECH_UI)) {
    if (!ui?.hud) continue;
    assert.ok(ui.chip, `${tribe} has a hud but no chip`);
    const s = game(tribe as TribeId, tribe === 'rome' ? ['mongols'] : ['rome']);
    const c = ui.chip(view(s));
    assert.ok(c, `${tribe}: no chip at the start`);
    assert.ok(c.icon.length > 0 && c.icon.length <= 3, `${tribe}: icon ${c.icon}`);
    assert.ok(c.text.length > 0 && c.text.length <= 16, `${tribe}: chip text too long: "${c.text}"`);
  }
});

test('the skill chip: surging Wildcards, else Pax Romana, else the Mercenaries', () => {
  const s = game();
  assert.equal(skillChip(s, 0), null);
  s.players[0].techs.push('fork:mercenary');
  assert.deepEqual(skillChip(s, 0), { icon: '⚔', text: 'growth ½' });
  s.players[0].techs.push('rome:3');
  assert.match(skillChip(s, 0)!.text, /^Pax (holds|broken)$/);
});

test('the wonder chip counts the Stars in, and the unrest chip turns red on the brink', () => {
  const s = game();
  assert.equal(wonderChip(s, 0), null);
  const cap = citiesOf(s, 0)[0];
  s.wonders = { sites: [{ id: 'machupicchu', pid: 0, x: cap.x + 1, y: cap.y, paid: 40, started: 1, lastTurn: s.turn, lastPaid: 9 }], built: [] };
  const w = wonderChip(s, 0)!;
  assert.equal(w.icon, '🏛');
  assert.match(w.text, /^40\/\d+★$/);
  cap.name = 'Constantinople';
  cap.data = { ...cap.data, unrest: { pid: 0, n: 6, brink: true } };
  const u = unrestChip(cap);
  assert.equal(u.tone, 'brink');
  assert.ok(u.text.endsWith('6/6') && u.text.length <= 14, u.text);
  cap.data = { ...cap.data, unrest: { pid: 0, n: 1, brink: false } };
  assert.equal(unrestChip(cap).tone, undefined);
});

// ------------------------------------------------------------ health badges

test('only units worth reading wear a health badge', () => {
  const s = game();
  const cap = citiesOf(s, 0)[0];
  const a = freeLand(s, cap.x, cap.y, 1);
  const mine = spawnUnit(s, 'archer', 0, a.x, a.y, null);
  const near = freeLand(s, mine.x, mine.y, 2);
  const foe = spawnUnit(s, 'warrior', 1, near.x, near.y, null);
  const far = freeLand(s, mine.x, mine.y, 3);
  const distant = spawnUnit(s, 'warrior', 1, far.x, far.y, null);
  const shown = (u: Unit, ov = overlay(), detail?: 'full' | 'mid' | 'name') => badgeShown(s, u, ov, u.hp, detail);

  // a healthy rank-and-file unit shows none
  assert.equal(shown(mine), false);
  assert.equal(shown(foe), false);
  // hurt
  mine.hp = maxHp(mine) - 3;
  assert.equal(shown(mine), true);
  mine.hp = maxHp(mine);
  // veteran
  mine.veteran = true;
  mine.hp = maxHp(mine); // a veteran's health rises with its rank
  assert.equal(shown(mine), true);
  assert.equal(shown(mine, overlay(), 'name'), false, 'far out only the hurt and the selected keep theirs');
  mine.veteran = false;
  mine.hp = maxHp(mine);
  // selected, and the enemies it could strike (an archer reaches two tiles), but not one out of reach
  const sel = overlay({ x: mine.x, y: mine.y });
  assert.equal(shown(mine, sel), true);
  assert.equal(shown(foe, sel), true);
  assert.equal(shown(distant, sel), false);
  // a target the selection marks for attack shows too
  const ov = overlay({ x: mine.x, y: mine.y });
  ov.attacks.push({ x: distant.x, y: distant.y });
  assert.equal(shown(distant, ov), true);
});

// ------------------------------------------------------------ city labels

test('overlapping city labels: the more important stays, the lesser moves aside or fades', () => {
  const s = game();
  const [c] = citiesOf(s, 0);
  assert.ok(labelPriority(c, true) > labelPriority({ ...c, capital: true, level: 9 }, false), 'your own cities come first');
  const box = (id: number, x: number, y: number, pri: number): LabelBox => ({ id, x, y, w: 90, h: 26, pri });
  // apart: untouched
  const apart = declutterLabels([box(1, 0, 0, 1), box(2, 200, 0, 2)], 3);
  assert.ok(apart.every((p) => p.dy === 0 && p.alpha === 1));
  // overlapping: the lesser label is nudged clear
  const two = declutterLabels([box(1, 0, 0, 1), box(2, 30, 8, 5)], 3);
  assert.equal(two[0].id, 2);
  assert.deepEqual([two[0].dy, two[0].alpha], [0, 1]);
  assert.equal(two[1].alpha, 1);
  assert.notEqual(two[1].dy, 0);
  // boxed in above and below: it fades instead
  const boxed = declutterLabels([box(1, 0, 0, 1), box(2, 0, 0, 9), box(3, 0, -24, 8), box(4, 0, 24, 7), box(5, 0, -48, 6), box(6, 0, 48, 6)], 3);
  const lesser = boxed.find((p) => p.id === 1)!;
  assert.equal(lesser.alpha, LABEL_FADE);
});

// ------------------------------------------------------------ the Great Wall

test('a Great Wall segment is drawn only along edges that face land outside the empire', () => {
  const s = game();
  const border = s.tiles.find((t) => isBorder(s, 0, t) && t.cityId === null)!;
  assert.ok(border);
  border.improvement = 'wall';
  border.data = { ...border.data, wall: 0 };
  const edges = wallEdges(s, border);
  assert.ok(edges.length >= 1 && edges.length <= 4);
  for (const [dx, dy] of edges) {
    const n = tileAt(s, border.x + dx, border.y + dy)!;
    assert.notEqual(tileOwnerPlayer(s, n), 0);
  }
  // deep inside the empire (the capital's own tile, all neighbours Chinese) a segment has no outward edge
  const cap = citiesOf(s, 0)[0];
  const inner = tileAt(s, cap.x, cap.y)!;
  inner.data = { ...inner.data, wall: 0 };
  assert.deepEqual(wallEdges(s, inner), []);
});

// ------------------------------------------------------------ in play

test('a 30-turn all-AI game: every readout chip stays short and every badge rule holds', () => {
  const tribes: TribeId[] = ['china', 'maya', 'swahili', 'persia', 'lakota'];
  const s = createGame({ seed: 23, human: null, opponents: tribes, mode: 'perfection' });
  startTurn(s);
  let guard = 0, chips = 0, badges = 0, hidden = 0;
  while (!s.over && guard++ < 1000) {
    aiTurn(s);
    for (const p of s.players) {
      if (!p.alive || p.neutral) continue;
      const c = MECH_UI[p.tribe]?.chip?.(view(s, p.id));
      if (c) { chips++; assert.ok(c.text.length <= 16, `${p.tribe}: "${c.text}"`); }
      const k = skillChip(s, p.id);
      if (k) assert.ok(k.text.length <= 16);
      const w = wonderChip(s, p.id);
      if (w) assert.ok(w.text.length <= 16);
    }
    for (const u of s.units) {
      const on = badgeShown(s, u, overlay(), u.hp);
      if (on) badges++; else hidden++;
      if (u.hp < maxHp(u)) assert.ok(on, 'a hurt unit always shows its health');
    }
    endTurn(s);
    drain();
  }
  assert.ok(s.over);
  assert.ok(chips > 50, `chips were read (${chips})`);
  assert.ok(hidden > badges, `most units are healthy and wear no badge (${hidden} hidden, ${badges} shown)`);
});

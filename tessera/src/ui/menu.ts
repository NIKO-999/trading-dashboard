import { portraitKind, TRIBE_IDS, TRIBES } from '../data/tribes';
import { UNITS } from '../data/units';
import type { MapSize } from '../game/mapgen';
import type { Difficulty, GameMode, TribeId } from '../game/types';
import { drawUnitSprite } from '../render/draw';
import { sfx } from '../audio/sfx';
import { canOfferInstall, installApp } from './install';
import { setSharpness } from '../render/common';
import { setCrispArt } from '../render/prims';
import { clearSpriteCache, setDirectDraw } from '../render/sprites';
import { showSharpnessTest } from './diag';
import { loadGame, loadScores, loadSettings, saveSettings } from '../save';
import { $ui, h, iconEl, paint } from './dom';

export type Seat = 'human' | 'ai' | 'off';

export interface NewGameChoice {
  tribe: TribeId;
  opponents: number;
  mode: GameMode;
  difficulty: Difficulty;
  mapSize: MapSize;
  hotseat: boolean; // pass & play on one device
  seats: Record<TribeId, Seat>; // pass & play: who plays each empire
}

export interface MenuHandlers {
  onNewGame: (c: NewGameChoice) => void;
  onContinue: () => void;
}

// ---------------------------------------------------------------- title backdrop

function landscapeSvg() {
  // A procedurally-built low-poly dusk landscape: layered peaks, pine forest and a lake.
  let seed = 11;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const peaks = (baseY: number, count: number, hMin: number, hMax: number, light: string, dark: string, snow: string | null) => {
    let out = '';
    const step = 1000 / count;
    for (let i = -1; i <= count; i++) {
      const cx = i * step + r() * step * 0.6;
      const hgt = hMin + r() * (hMax - hMin);
      const w = step * (0.9 + r() * 0.7);
      const ax = cx, ay = baseY - hgt;
      out += `<polygon points="${cx - w},${baseY} ${ax},${ay} ${cx + w * 0.1},${baseY}" fill="${light}"/>`;
      out += `<polygon points="${ax},${ay} ${cx + w},${baseY} ${cx + w * 0.1},${baseY}" fill="${dark}"/>`;
      if (snow) {
        const k = 0.28;
        out += `<polygon points="${ax},${ay} ${ax - w * k},${ay + hgt * k} ${ax - w * 0.05},${ay + hgt * k * 0.8} ${ax + w * k * 0.9},${ay + hgt * k}" fill="${snow}"/>`;
      }
    }
    return out;
  };
  let trees = '';
  for (let i = 0; i < 70; i++) {
    const x = r() * 1000;
    const y = 1395 + r() * 110;
    const s = 0.7 + ((y - 1395) / 110) * 0.8;
    trees += `<polygon points="${x},${y - 52 * s} ${x - 11 * s},${y} ${x},${y + 3 * s}" fill="#2c9a3c"/><polygon points="${x},${y - 52 * s} ${x + 11 * s},${y} ${x},${y + 3 * s}" fill="#1c6d2b"/>`;
  }
  let stars = '';
  for (let i = 0; i < 40; i++) stars += `<rect x="${r() * 1000}" y="${r() * 900}" width="4" height="4" fill="#fff" opacity="${0.4 + r() * 0.6}"/>`;
  return `<svg class="landscape" viewBox="0 0 1000 2000" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f45ca8"/><stop offset="0.42" stop-color="#f46ea6"/>
      <stop offset="0.6" stop-color="#f4959a"/><stop offset="0.72" stop-color="#f6c27f"/>
    </linearGradient>
    <linearGradient id="lake" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3fe0e6"/><stop offset="1" stop-color="#1f7fc2"/>
    </linearGradient>
  </defs>
  <rect width="1000" height="2000" fill="url(#sky)"/>
  ${stars}
  ${peaks(1330, 5, 200, 340, '#c9ccd6', '#9c9fab', '#ffffff')}
  ${peaks(1400, 7, 130, 240, '#a4a7b1', '#7b7e89', '#f4f6fb')}
  <polygon points="0,1400 1000,1380 1000,1560 0,1560" fill="#5cc23a"/>
  <polygon points="0,1420 380,1440 700,1400 1000,1430 1000,1560 0,1560" fill="#7fd63f"/>
  ${trees}
  <polygon points="0,1540 1000,1510 1000,2000 0,2000" fill="url(#lake)"/>
  <polygon points="0,1540 1000,1510 1000,1530 0,1565" fill="#b7f2f2" opacity="0.6"/>
  <polygon points="-20,1780 300,1640 520,1700 700,1650 1020,1760 1020,2000 -20,2000" fill="#1c6fb0" opacity="0.5"/>
  <polygon points="-20,1900 1020,1860 1020,2000 -20,2000" fill="#b88a55"/>
  <polygon points="230,1600 330,1560 420,1600 360,1625" fill="#8f8a95"/><polygon points="330,1560 420,1600 360,1625" fill="#6c6772"/>
</svg>`;
}

function screen(cls: string, ...children: (Node | string)[]) {
  const root = $ui();
  root.innerHTML = '';
  const el = h('div', { class: `screen ${cls}` }, ...children);
  root.append(el);
  return el;
}

// ---------------------------------------------------------------- title

export function showTitle(handlers: MenuHandlers) {
  const hasSave = !!loadGame();
  screen(
    'title',
    h('div', { class: 'title-bg', html: landscapeSvg() }),
    h('div', { class: 'title-logo' },
      h('div', { class: 'logo-sub' }, h('span', { class: 'rule' }), 'TILE EMPIRES OF', h('span', { class: 'rule' })),
      h('div', { class: 'logo-main' }, 'TESSERA'),
    ),
    h('div', { class: `title-buttons${hasSave ? ' many' : ''}` },
      hasSave ? h('button', { class: 'pill', onclick: handlers.onContinue }, 'CONTINUE') : null,
      h('button', { class: 'pill', onclick: () => showSetup(handlers, false) }, 'NEW GAME'),
      h('button', { class: 'pill', onclick: () => showSetup(handlers, true) }, 'PASS & PLAY'),
    ),
    ...(canOfferInstall() ? [h('button', { class: 'install-btn', onclick: () => void installApp() }, 'Install app')] : []),
    h('div', { class: 'title-version' }, `v${__APP_VERSION__.replace(/\.0$/, '')}`),
    h('div', { class: 'title-dock' },
      dockButton('menu', 'Settings', () => showSettings(handlers)),
      dockButton('trophy', 'High Scores', () => showScores(handlers)),
      dockButton('crown', 'Empires', () => showEmpires(handlers)),
      dockButton('info', 'About', () => showAbout(handlers)),
    ),
  );
}

function dockButton(icon: Parameters<typeof iconEl>[0], label: string, onclick: () => void) {
  return h('button', { class: 'dock-btn', onclick }, h('span', { class: 'round' }, iconEl(icon)), h('span', { class: 'dock-label' }, label));
}

function backBar(title: string, onBack: () => void) {
  return h('div', { class: 'backbar' }, h('button', { class: 'round-btn', onclick: onBack, 'aria-label': 'Back' }, iconEl('back')), h('h2', {}, title));
}

export function unitPortrait(kind: keyof typeof UNITS, tribe: TribeId, size = 64) {
  return paint(size, size, (ctx) => {
    const k = (size / 40) * (UNITS[kind].naval ? 0.8 : 1);
    ctx.translate(size / 2, size * 0.86);
    ctx.scale(k, k);
    drawUnitSprite(ctx, kind, tribe, 0, -2);
  }, `unit:${kind}:${tribe}:${size}`);
}

// ---------------------------------------------------------------- new game setup

const SEAT_LABEL: Record<Seat, string> = { human: 'Player', ai: 'AI', off: 'Off' };
const NEXT_SEAT: Record<Seat, Seat> = { human: 'ai', ai: 'off', off: 'human' };

function showSetup(handlers: MenuHandlers, hotseat: boolean) {
  const choice: NewGameChoice = {
    tribe: 'rome', opponents: 4, mode: 'perfection', difficulty: 'normal', mapSize: 'normal', hotseat,
    seats: { rome: 'human', egypt: 'human', aztec: 'ai', polynesia: 'ai', pirates: 'off', vikings: 'ai', japan: 'off', mongols: 'off', greeks: 'off', zulu: 'off', persia: 'off', celts: 'off', inuit: 'off', inca: 'off', ethiopia: 'off', aboriginal: 'off', china: 'off', india: 'off', mali: 'off', lakota: 'off', ottoman: 'off' },
  };
  const scroll = h('div', { class: 'scroll' });
  const seg = <T extends string | number>(label: string, opts: [T, string][], get: () => T, set: (v: T) => void) => {
    const row = h('div', { class: 'seg-row' }, h('div', { class: 'seg-label' }, label));
    const group = h('div', { class: 'seg' });
    const draw = () => {
      group.innerHTML = '';
      for (const [v, text] of opts) group.append(h('button', { class: get() === v ? 'on' : '', onclick: () => { set(v); draw(); } }, text));
    };
    draw();
    row.append(group);
    return row;
  };

  const render = () => {
    const humans = TRIBE_IDS.filter((t) => choice.seats[t] === 'human').length;
    const active = TRIBE_IDS.filter((t) => choice.seats[t] !== 'off').length;
    const problem = !choice.hotseat ? null
      : humans < 2 ? 'Pass & Play needs at least two players. Tap an empire to change who plays it.'
        : active < 2 ? 'Add at least one more empire.' : null;

    const cards = h('div', { class: 'tribe-grid' });
    for (const id of TRIBE_IDS) {
      const t = TRIBES[id];
      const seat = choice.seats[id];
      cards.append(
        h('button', {
          class: `tribe-card${choice.hotseat ? ` seat-${seat}` : choice.tribe === id ? ' active' : ''}`,
          style: { '--tc': t.color } as Record<string, string>,
          onclick: () => {
            if (choice.hotseat) choice.seats[id] = NEXT_SEAT[seat];
            choice.tribe = id;
            render();
          },
        },
          h('span', { class: 'portrait' }, unitPortrait(portraitKind(id), id, 70)),
          h('span', { class: 'tc-name' }, t.people),
          choice.hotseat ? h('span', { class: `seat ${seat}` }, SEAT_LABEL[seat]) : null,
        ),
      );
    }
    const t = TRIBES[choice.tribe];
    const detail = h('div', { class: 'tribe-detail' },
      h('h4', {}, t.name),
      h('p', {}, t.blurb),
      h('p', {}, h('b', {}, 'Bonus: '), t.bonus),
      h('p', {}, h('b', {}, `${UNITS[t.unique].name}: `), UNITS[t.unique].blurb),
    );
    const start = h('button', { class: 'pill wide', onclick: () => handlers.onNewGame(choice) }, 'START');
    if (problem) start.disabled = true;

    scroll.innerHTML = '';
    const parts: (Node | null)[] = [
      seg('Players', [[0, 'Solo'], [1, 'Pass & Play']], () => (choice.hotseat ? 1 : 0), (v) => { choice.hotseat = v === 1; render(); }),
      h('h3', {}, choice.hotseat ? 'Who plays each empire?' : 'Choose your empire'),
      cards,
      choice.hotseat
        ? h('p', { class: `setup-note${problem ? ' bad' : ''}` }, problem ?? `${humans} players take turns on this device, ${active - humans} AI ${active - humans === 1 ? 'rival' : 'rivals'}. Tap an empire to switch it between Player, AI and Off.`)
        : null,
      detail,
      choice.hotseat ? null : seg('Opponents', [[1, '1'], [2, '2'], [3, '3'], [4, '4']], () => choice.opponents, (v) => (choice.opponents = v)),
      seg('Map', [['normal', 'Normal'], ['large', 'Large'], ['huge', 'Huge']], () => choice.mapSize, (v) => (choice.mapSize = v)),
      seg('Mode', [['perfection', '30 Turns'], ['domination', 'Conquest']], () => choice.mode, (v) => (choice.mode = v)),
      seg('Rivals', [['easy', 'Easy'], ['normal', 'Normal'], ['hard', 'Hard']], () => choice.difficulty, (v) => (choice.difficulty = v)),
      start,
    ];
    scroll.append(...parts.filter((n): n is Node => n !== null));
  };
  render();
  screen('setup', backBar(hotseat ? 'Pass & Play' : 'New Game', () => showTitle(handlers)), scroll);
}

// ---------------------------------------------------------------- misc screens

function showScores(handlers: MenuHandlers) {
  const scores = loadScores();
  screen(
    'scores',
    backBar('High Scores', () => showTitle(handlers)),
    h('div', { class: 'scroll' },
      scores.length
        ? h('ol', { class: 'score-list' }, ...scores.map((s) =>
          h('li', { style: { '--tc': TRIBES[s.tribe].color } as Record<string, string> },
            h('span', { class: 'sc' }, s.score.toLocaleString()),
            h('span', {}, `${TRIBES[s.tribe].people} · ${s.mode === 'perfection' ? '30 Turns' : 'Conquest'} · ${s.won ? 'Victory' : 'Defeat'}`),
            h('span', { class: 'muted' }, s.date),
          )))
        : h('p', { class: 'muted center' }, 'No games finished yet. Go make history!'),
    ),
  );
}

function showEmpires(handlers: MenuHandlers) {
  screen(
    'empires',
    backBar('The Twenty-One Empires', () => showTitle(handlers)),
    h('div', { class: 'scroll' },
      ...TRIBE_IDS.map((id) => {
        const t = TRIBES[id];
        return h('div', { class: 'empire-row', style: { '--tc': t.color } as Record<string, string> },
          unitPortrait(t.unique, id, 72),
          h('div', {},
            h('h3', {}, `${t.people} — ${t.name}`),
            h('p', {}, t.blurb),
            h('p', {}, h('b', {}, 'Starts with: '), t.startTech[0].toUpperCase() + t.startTech.slice(1)),
            h('p', {}, h('b', {}, 'Bonus: '), t.bonus),
            h('p', {}, h('b', {}, `${UNITS[t.unique].name}`), ` (replaces ${UNITS[t.replaces].name}): ${UNITS[t.unique].blurb}`),
          ),
        );
      }),
    ),
  );
}

function showAbout(handlers: MenuHandlers) {
  screen(
    'about',
    backBar('About', () => showTitle(handlers)),
    h('div', { class: 'scroll prose' },
      h('p', {}, 'Tessera is a pocket-sized turn-based strategy game. Lead one of twenty-one empires across a tiled world: explore the fog, harvest what the land offers, grow your cities, research new skills and outlast your rivals.'),
      h('h3', {}, 'How to play'),
      h('ul', {},
        h('li', {}, 'Stars (★) are your currency. Every city pays out each turn.'),
        h('li', {}, 'Tap a resource in your territory to harvest it and grow the city. Full cities level up and grant a reward.'),
        h('li', {}, 'Tap a unit, then a highlighted tile to move, or a ringed enemy to attack.'),
        h('li', {}, 'End a unit’s move on a village or enemy city, then capture it at the start of your next turn.'),
        h('li', {}, 'Open the tech tree to unlock harvesting, buildings and stronger units.'),
        h('li', {}, 'In 30-turn mode the highest score wins; in Conquest the last empire standing does.'),
      ),
      h('p', { class: 'muted' }, 'Works offline once installed. Add it to your home screen from your browser’s share / install menu.'),
    ),
  );
}

function showSettings(handlers: MenuHandlers) {
  const st = loadSettings();
  const toggle = (label: string, key: 'sound' | 'hints' | 'fastAi') => {
    const b = h('button', { class: `toggle${st[key] ? ' on' : ''}` }, st[key] ? 'On' : 'Off');
    b.addEventListener('click', () => {
      st[key] = !st[key];
      saveSettings(st);
      if (key === 'sound') sfx.enabled = st.sound;
      b.className = `toggle${st[key] ? ' on' : ''}`;
      b.textContent = st[key] ? 'On' : 'Off';
    });
    return h('div', { class: 'seg-row' }, h('div', { class: 'seg-label' }, label), b);
  };
  const artRow = () => {
    const opts: [boolean, string][] = [[false, 'Soft'], [true, 'Crisp']];
    const row = h('div', { class: 'seg-row' }, h('div', { class: 'seg-label' }, 'Art style'));
    const group = h('div', { class: 'seg' });
    const draw = () => {
      group.innerHTML = '';
      for (const [v, text] of opts) group.append(h('button', { class: st.flat === v ? 'on' : '', onclick: () => { st.flat = v; saveSettings(st); setCrispArt(v); clearSpriteCache(); draw(); } }, text));
    };
    draw();
    row.append(group);
    return row;
  };
  const directRow = () => {
    const opts: [boolean, string][] = [[false, 'Direct'], [true, 'Cached']];
    const row = h('div', { class: 'seg-row' }, h('div', { class: 'seg-label' }, 'Map drawing'));
    const group = h('div', { class: 'seg' });
    const draw = () => {
      group.innerHTML = '';
      for (const [v, text] of opts) group.append(h('button', { class: st.cached === v ? 'on' : '', onclick: () => { st.cached = v; saveSettings(st); setDirectDraw(!v); draw(); } }, text));
    };
    draw();
    row.append(group);
    return row;
  };
  const sharpRow = () => {
    const opts: [1 | 4 | 5, string][] = [[1, 'Auto'], [4, 'High'], [5, 'Max']];
    const row = h('div', { class: 'seg-row' }, h('div', { class: 'seg-label' }, 'Map sharpness'));
    const group = h('div', { class: 'seg' });
    const draw = () => {
      group.innerHTML = '';
      for (const [v, text] of opts) group.append(h('button', { class: st.sharp === v ? 'on' : '', onclick: () => { st.sharp = v; saveSettings(st); setSharpness(v); draw(); } }, text));
    };
    draw();
    row.append(group);
    return row;
  };
  screen(
    'settings',
    backBar('Settings', () => showTitle(handlers)),
    h('div', { class: 'scroll' }, toggle('Sound', 'sound'), toggle('Guide hints', 'hints'), toggle('Fast rival turns', 'fastAi'), sharpRow(), artRow(), directRow(), h('button', { class: 'pill wide', onclick: () => showSharpnessTest() }, 'Sharpness test')),
  );
}

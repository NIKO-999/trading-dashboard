import { registerSW } from 'virtual:pwa-register';
import { TRIBE_IDS } from './data/tribes';
import { createGame } from './game/mapgen';
import { startTurn } from './game/turn';
import type { GameState } from './game/types';
import { music } from './audio/music';
import { sfx } from './audio/sfx';
import { setSharpness } from './render/common';
import { setCrispArt } from './render/prims';
import { setDirectDraw } from './render/sprites';
import { clearSave, loadGame, loadSettings, saveGame } from './save';
import { GameView } from './ui/game';
import { showTitle, type NewGameChoice } from './ui/menu';
import '@fontsource/josefin-sans/latin-300.css';
import '@fontsource/josefin-sans/latin-400.css';
import '@fontsource/josefin-sans/latin-600.css';
import '@fontsource/josefin-sans/latin-700.css';
import '@fontsource/josefin-sans/latin-600-italic.css';
import '@fontsource/josefin-sans/latin-700-italic.css';
import './style.css';

registerSW({ immediate: true });
sfx.enabled = loadSettings().sound;
music.enabled = loadSettings().music;
if (import.meta.env.DEV) Object.assign(window, { __music: music });
setSharpness(loadSettings().sharp);
setCrispArt(loadSettings().flat);
setDirectDraw(!loadSettings().cached);
// Browsers only allow audio after a user gesture; unlock on the first touch anywhere.
window.addEventListener('pointerdown', () => sfx.unlock());
// iOS Safari ignores user-scalable=no; block its page-zoom gestures so a pinch only zooms the map.
for (const ev of ['gesturestart', 'gesturechange']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
// The map canvas draws text itself, so make sure the faces it uses are loaded early.
for (const f of ['400 13px', '600 13px', '700 15px']) void document.fonts?.load(`${f} "Josefin Sans"`);

let view: GameView | null = null;
let lastChoice: NewGameChoice | null = null;

function play(state: GameState) {
  current = state;
  view?.destroy();
  view = new GameView(state, (next) => {
    view?.destroy();
    view = null;
    current = null;
    if (next === 'new' && lastChoice) newGame(lastChoice);
    else title();
  });
}

function newGame(choice: NewGameChoice) {
  lastChoice = choice;
  clearSave();
  const others = TRIBE_IDS.filter((t) => t !== choice.tribe);
  // Shuffle rivals so every game meets a different mix.
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  const common = { mode: choice.mode, difficulty: choice.difficulty, mapSize: choice.mapSize, terrain: choice.terrain, wild: choice.wild !== false };
  const state = choice.hotseat
    ? createGame({ ...common, human: null, humans: TRIBE_IDS.filter((t) => choice.seats[t] === 'human'), opponents: TRIBE_IDS.filter((t) => choice.seats[t] === 'ai') })
    : createGame({ ...common, human: choice.tribe, opponents: others.slice(0, choice.opponents) });
  startTurn(state);
  saveGame(state);
  play(state);
}

// When this page is hosted as a shared artifact, keep an in-progress game across live updates.
interface Hot { ready?: (start: (data: { state?: GameState }) => void) => void; data?: { state?: GameState }; snapshot?: (get: () => unknown) => void }
const hot = (window as unknown as { claude?: { hot?: Hot } }).claude?.hot;
let current: GameState | null = null;
if (typeof hot?.snapshot === 'function') hot.snapshot(() => (current && !current.over ? { state: current } : {}));

function title() {
  music.play('menu');
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
  showTitle({
    onNewGame: newGame,
    onContinue: () => {
      const s = loadGame();
      if (s) play(s);
      else title();
    },
  });
}

const boot = (data: { state?: GameState }) => (data?.state && !data.state.over ? play(data.state) : title());
if (typeof hot?.ready === 'function') hot.ready(boot);
else boot(hot?.data ?? {});

import { registerSW } from 'virtual:pwa-register';
import { TRIBE_IDS } from './data/tribes';
import { createGame } from './game/mapgen';
import { startTurn } from './game/turn';
import type { GameState } from './game/types';
import { clearSave, loadGame, saveGame } from './save';
import { GameView } from './ui/game';
import { showTitle, type NewGameChoice } from './ui/menu';
import './style.css';

registerSW({ immediate: true });

let view: GameView | null = null;
let lastChoice: NewGameChoice | null = null;

function play(state: GameState) {
  view?.destroy();
  view = new GameView(state, (next) => {
    view?.destroy();
    view = null;
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
  const state = createGame({ human: choice.tribe, opponents: others.slice(0, choice.opponents), mode: choice.mode, difficulty: choice.difficulty });
  startTurn(state);
  saveGame(state);
  play(state);
}

function title() {
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

title();

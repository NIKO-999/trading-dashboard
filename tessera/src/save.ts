import type { GameState, TribeId } from './game/types';

// Per-device conveniences only: the in-progress game, settings and local high scores.
const SAVE_KEY = 'tessera.save.v1';
const SCORES_KEY = 'tessera.scores.v1';
const SETTINGS_KEY = 'tessera.settings.v1';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: play on without saving */
  }
}

export const saveGame = (s: GameState) => write(SAVE_KEY, s);
export const loadGame = (): GameState | null => {
  const s = read<GameState | null>(SAVE_KEY, null);
  return s && s.version === 1 && !s.over ? s : null;
};
export const clearSave = () => {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
};

export interface HighScore {
  score: number;
  tribe: TribeId;
  won: boolean;
  mode: string;
  turns: number;
  date: string;
}
export const loadScores = () => read<HighScore[]>(SCORES_KEY, []);
export function addScore(h: HighScore) {
  const all = [...loadScores(), h].sort((a, b) => b.score - a.score).slice(0, 15);
  write(SCORES_KEY, all);
}

export interface Settings {
  hints: boolean;
  fastAi: boolean;
  sound: boolean;
}
export const loadSettings = (): Settings => ({ hints: true, fastAi: false, sound: true, ...read<Partial<Settings>>(SETTINGS_KEY, {}) });
export const saveSettings = (s: Settings) => write(SETTINGS_KEY, s);

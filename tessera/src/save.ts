import { maxHp } from './game/rules';
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
  if (!s || s.version !== 1 || s.over) return null;
  // older saves could hold units above full health (boats used to inflate it)
  for (const u of s.units) u.hp = Math.min(u.hp, maxHp(u));
  return s;
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
  music: boolean; // each empire's own generative theme
  cached: boolean; // draw the map through cached layers instead of straight onto the screen (see setDirectDraw)
  flat: boolean; // crisp art: flat colours and hard-edged shadows (see setCrispArt)
  sharp: 1 | 4 | 5; // minimum pixels per CSS pixel for drawing (1 = follow the screen; see renderDpr)
  /** How the map canvas is handed to the screen: 'standard' (CSS-sized) or 'exact' (one CSS pixel per canvas pixel, scaled down by the compositor). */
  display?: 'standard' | 'exact' | 'image';
  /** Show the build tag (version, drawing density, frame time) at the foot of the map. Off by default; the Menu shows the version. */
  buildInfo?: boolean;
  /** The on-screen sharpness picker has been shown once. */
  displayPicked?: boolean;
}
/** iPhone / iPad Safari and web views: where the map has looked soft. */
export const isIOS = () => typeof navigator !== 'undefined' && (/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1));
export const loadSettings = (): Settings => ({ hints: true, fastAi: false, sound: true, music: true, cached: false, flat: true, sharp: 1, display: isIOS() ? 'image' : 'standard', ...read<Partial<Settings>>(SETTINGS_KEY, {}) });
export const saveSettings = (s: Settings) => write(SETTINGS_KEY, s);

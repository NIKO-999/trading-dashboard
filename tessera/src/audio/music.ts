// Generative music: every empire has its own original theme, composed on the fly from the scale, rhythm and
// instruments of its culture (no samples, no recordings, no borrowed tunes). Everything is synthesised with Web Audio,
// so it works offline. A theme is a scale (in cents, so quarter-tones work), a groove, and a small band.
import type { TribeId } from '../game/types';
import { sfx } from './sfx';

export type ThemeId = TribeId | 'menu';

type Pluck = 'lyre' | 'harp' | 'koto' | 'oud' | 'sitar' | 'santur' | 'guzheng' | 'gayageum' | 'kora' | 'charango' | 'krar' | 'qanun' | 'pipa' | 'lute';
type Wind = 'flute' | 'ney' | 'whistle' | 'panpipe' | 'shaku' | 'dizi' | 'clayflute' | 'natflute';
type Reed = 'zurna' | 'duduk' | 'aulos' | 'piri' | 'accordion' | 'shawm';
type Bowed = 'erhu' | 'morin' | 'masenqo' | 'tagel' | 'fiddle' | 'rebab';
type Struck = 'marimba' | 'balafon' | 'roneat' | 'bell' | 'gong' | 'bowl' | 'chime';
type Pad = 'voice' | 'oo' | 'drone' | 'horn' | 'tuba' | 'dung' | 'didge' | 'yidaki' | 'tanpura' | 'brass';
type Voice = Pluck | Wind | Reed | Bowed | Struck | Pad;
type Perc =
  | 'kick' | 'taiko' | 'huehue' | 'frame' | 'na' | 'ge' | 'doum' | 'tek' | 'shaker' | 'rattle' | 'clave' | 'wood'
  | 'cymbal' | 'stomp' | 'djembe' | 'slap' | 'clap' | 'snare' | 'tunkul' | 'janggu' | 'davul' | 'bodhran' | 'gongperc';

interface Line {
  voice: Voice;
  oct: number; // octaves above the root
  vol: number;
  density?: number; // 0..1 chance that a rhythm onset is really played
  rhythms?: number[][]; // onset steps per bar; the bar of the phrase picks one
  contour?: 'arch' | 'descend' | 'wave' | 'leap' | 'flat';
  orn?: number; // chance of a grace note (koto flicks, sitar meend, ...)
  lo?: number; // lowest scale degree (relative to the root octave)
  hi?: number;
  hold?: number; // longest note, in steps
}

interface Theme {
  name: string;
  bpm: number;
  steps: number; // grid steps per bar
  perBeat: number; // grid steps per beat
  root: number; // MIDI note of the tonic
  scale: number[]; // cents above the tonic, one octave
  melody: Line;
  echo?: Line; // a second, quieter voice that answers the tune (a bar late, an octave away)
  arp?: Line & { pattern: number[] }; // accompaniment figure: scale-degree offsets played on `rhythms[0]`
  drone?: { voice: Voice; degrees: number[]; oct: number; vol: number; every?: number };
  perc: { voice: Perc; pat: string; vol: number }[]; // '.' rest, 'x' hit, 'X' accent, 'o' ghost note
  swing?: number;
  reverb?: number; // 0..1
  gain?: number; // loudness trim so every theme sits at about the same level
}

const R16 = [
  [0, 4, 8, 12], [0, 3, 6, 8, 12], [0, 2, 4, 8, 10, 12], [0, 4, 6, 8, 12, 14], [0, 3, 8, 11, 12], [0, 2, 4, 6, 8, 12],
];
const R12 = [[0, 3, 6, 9], [0, 2, 3, 6, 8, 9], [0, 3, 4, 6, 9, 10], [0, 3, 6, 8, 9], [0, 1, 3, 6, 9]];

const THEMES: Record<ThemeId, Theme> = {
  // ------------------------------------------------------------------ neutral title music
  menu: {
    gain: 1.0,
    name: 'Tessera', bpm: 72, steps: 16, perBeat: 4, root: 57, scale: [0, 200, 400, 700, 900], reverb: 0.5,
    melody: { voice: 'harp', oct: 1, vol: 0.2, density: 0.8, rhythms: R16, contour: 'arch', lo: -2, hi: 6, hold: 6 },
    echo: { voice: 'flute', oct: 1, vol: 0.09, density: 0.5, rhythms: [[0, 8], [0, 6, 12]], contour: 'wave', lo: 0, hi: 5, hold: 8 },
    drone: { voice: 'oo', degrees: [0, 3], oct: -1, vol: 0.07, every: 2 },
    perc: [{ voice: 'frame', pat: 'x.......o.......', vol: 0.12 }],
  },
  // ------------------------------------------------------------------ Egypt: Hijaz-like mode, ney, frame drum
  egypt: {
    name: 'Nile', bpm: 94, steps: 16, perBeat: 4, root: 57, scale: [0, 100, 400, 500, 700, 800, 1000], reverb: 0.45,
    melody: { voice: 'ney', oct: 1, vol: 0.2, density: 0.85, rhythms: R16, contour: 'wave', lo: -3, hi: 7, orn: 0.25, hold: 5 },
    arp: { voice: 'lyre', oct: 0, vol: 0.14, pattern: [0, 2, 4, 2, 0, 2, 4, 5], rhythms: [[0, 2, 4, 6, 8, 10, 12, 14]], density: 0.9 },
    drone: { voice: 'drone', degrees: [0, 4], oct: -1, vol: 0.08 },
    perc: [{ voice: 'doum', pat: 'X...x.....x.x...', vol: 0.3 }, { voice: 'tek', pat: '..x...x.o.x...x.', vol: 0.16 }],
  },
  // ------------------------------------------------------------------ Aztec: minor pentatonic, clay flute, huehuetl
  aztec: {
    name: 'Tenochtitlan', bpm: 84, steps: 16, perBeat: 4, root: 55, scale: [0, 300, 500, 700, 1000], reverb: 0.35,
    melody: { voice: 'clayflute', oct: 1, vol: 0.2, density: 0.8, rhythms: R16, contour: 'descend', lo: -2, hi: 7, hold: 6 },
    echo: { voice: 'whistle', oct: 2, vol: 0.06, density: 0.4, rhythms: [[2, 10], [6, 14]], contour: 'arch', lo: 0, hi: 5, hold: 3 },
    drone: { voice: 'oo', degrees: [0], oct: -1, vol: 0.06, every: 2 },
    perc: [{ voice: 'huehue', pat: 'X..x..x.X...x.x.', vol: 0.34 }, { voice: 'rattle', pat: 'x.x.x.x.x.x.x.x.', vol: 0.09 }, { voice: 'clave', pat: '....o.......o.x.', vol: 0.1 }],
  },
  // ------------------------------------------------------------------ Māori: pentatonic, koauau (nose flute), pūtātara, pahu, hand slaps
  polynesia: {
    name: 'Aotearoa', bpm: 100, steps: 16, perBeat: 4, root: 53, scale: [0, 200, 400, 700, 900], reverb: 0.4,
    melody: { voice: 'natflute', oct: 1, vol: 0.19, density: 0.8, rhythms: R16, contour: 'arch', lo: -2, hi: 6, hold: 6 },
    echo: { voice: 'voice', oct: 0, vol: 0.09, density: 0.6, rhythms: [[0, 6, 8], [0, 4, 8, 12]], contour: 'descend', lo: -2, hi: 3, hold: 4 },
    drone: { voice: 'horn', degrees: [0, 3], oct: -2, vol: 0.06, every: 4 },
    perc: [{ voice: 'taiko', pat: 'X..x..x.X.x.x...', vol: 0.3 }, { voice: 'slap', pat: '..x...x...x.x.x.', vol: 0.16 }, { voice: 'stomp', pat: 'x...x...x...x...', vol: 0.14 }],
  },
  // ------------------------------------------------------------------ Rome: Dorian, tuba/horn, lyre, marching drum
  rome: {
    gain: 1.1,
    name: 'Via Appia', bpm: 96, steps: 16, perBeat: 4, root: 50, scale: [0, 200, 300, 500, 700, 900, 1000], reverb: 0.4,
    melody: { voice: 'brass', oct: 1, vol: 0.16, density: 0.9, rhythms: [[0, 4, 6, 8, 12], [0, 3, 4, 8, 10, 12], [0, 2, 4, 8, 12]], contour: 'arch', lo: -1, hi: 6, hold: 4 },
    arp: { voice: 'lyre', oct: 1, vol: 0.12, pattern: [0, 2, 4, 2], rhythms: [[0, 4, 8, 12]], density: 1 },
    drone: { voice: 'tuba', degrees: [0, 4], oct: -1, vol: 0.09 },
    perc: [{ voice: 'kick', pat: 'X...x...X...x...', vol: 0.3 }, { voice: 'snare', pat: '....x.x.....x.xx', vol: 0.12 }],
  },
  // ------------------------------------------------------------------ Pirates: shanty in a jig, squeezebox, fiddle, stomps
  pirates: {
    gain: 1.1,
    name: 'Black Sails', bpm: 116, steps: 12, perBeat: 6, root: 52, scale: [0, 200, 300, 500, 700, 900, 1000], swing: 0.06, reverb: 0.25,
    melody: { voice: 'accordion', oct: 1, vol: 0.16, density: 0.9, rhythms: R12, contour: 'wave', lo: -2, hi: 7, hold: 4 },
    arp: { voice: 'fiddle', oct: 1, vol: 0.09, pattern: [0, 2, 4], rhythms: [[0, 6]], density: 1 },
    drone: { voice: 'tuba', degrees: [0, 4], oct: -1, vol: 0.09, every: 1 },
    perc: [{ voice: 'stomp', pat: 'X.....x.....', vol: 0.3 }, { voice: 'clap', pat: '......x.....', vol: 0.12 }, { voice: 'tek', pat: 'x.x.x.x.x.x.', vol: 0.08 }],
  },
  // ------------------------------------------------------------------ Vikings: Dorian/Aeolian, bowed lyre, low drone, war drum
  vikings: {
    name: 'Fjord', bpm: 78, steps: 16, perBeat: 4, root: 45, scale: [0, 200, 300, 500, 700, 800, 1000], reverb: 0.55,
    melody: { voice: 'tagel', oct: 1, vol: 0.17, density: 0.75, rhythms: R16, contour: 'descend', lo: -3, hi: 5, hold: 8 },
    echo: { voice: 'voice', oct: 0, vol: 0.09, density: 0.5, rhythms: [[0, 8], [0, 6, 12]], contour: 'flat', lo: -2, hi: 2, hold: 8 },
    drone: { voice: 'drone', degrees: [0, 4], oct: -1, vol: 0.11 },
    perc: [{ voice: 'taiko', pat: 'X.......x...x...', vol: 0.32 }, { voice: 'frame', pat: '..x...x...x...x.', vol: 0.1 }],
  },
  // ------------------------------------------------------------------ Japan: in scale, koto, shakuhachi, sparse taiko
  japan: {
    gain: 1.4,
    name: 'Sakura', bpm: 68, steps: 16, perBeat: 4, root: 57, scale: [0, 100, 500, 700, 800], reverb: 0.5,
    melody: { voice: 'koto', oct: 1, vol: 0.2, density: 0.7, rhythms: [[0, 6, 8], [0, 4, 10], [0, 3, 8, 12], [0, 8]], contour: 'wave', lo: -3, hi: 5, orn: 0.4, hold: 8 },
    echo: { voice: 'shaku', oct: 1, vol: 0.13, density: 0.6, rhythms: [[0, 8], [4, 12], [0]], contour: 'descend', lo: -1, hi: 4, hold: 12 },
    drone: { voice: 'bowl', degrees: [0], oct: 0, vol: 0.05, every: 4 },
    perc: [{ voice: 'taiko', pat: 'X...............', vol: 0.3 }, { voice: 'clave', pat: '............o...', vol: 0.09 }],
  },
  // ------------------------------------------------------------------ Mongols: pentatonic, morin khuur, gallop
  mongols: {
    name: 'Steppe', bpm: 116, steps: 12, perBeat: 3, root: 50, scale: [0, 200, 500, 700, 900], reverb: 0.4,
    melody: { voice: 'morin', oct: 1, vol: 0.18, density: 0.85, rhythms: [[0, 2, 3, 6, 8, 9], [0, 3, 6, 8, 9], [0, 2, 3, 6, 9]], contour: 'arch', lo: -2, hi: 6, hold: 4 },
    drone: { voice: 'drone', degrees: [0, 3], oct: -1, vol: 0.1 },
    perc: [{ voice: 'davul', pat: 'X.xx.xX.xx.x', vol: 0.24 }, { voice: 'tek', pat: '.x.x.x.x.x.x', vol: 0.07 }],
  },
  // ------------------------------------------------------------------ Greeks: Dorian-ish, aulos, lyre, in five
  greeks: {
    gain: 1.3,
    name: 'Aegean', bpm: 96, steps: 10, perBeat: 2, root: 52, scale: [0, 200, 300, 500, 700, 900, 1000], reverb: 0.45,
    melody: { voice: 'aulos', oct: 1, vol: 0.16, density: 0.9, rhythms: [[0, 2, 4, 6, 8], [0, 3, 4, 7, 8], [0, 2, 5, 6, 8]], contour: 'wave', lo: -2, hi: 6, hold: 4 },
    arp: { voice: 'lyre', oct: 0, vol: 0.13, pattern: [0, 2, 4, 2, 0], rhythms: [[0, 2, 4, 6, 8]], density: 1 },
    drone: { voice: 'drone', degrees: [0, 4], oct: -1, vol: 0.07 },
    perc: [{ voice: 'frame', pat: 'X.x.x.X.x.', vol: 0.18 }, { voice: 'tek', pat: '..x.o.x.o.', vol: 0.09 }],
  },
  // ------------------------------------------------------------------ Zulu: pentatonic, vocal-like pads answering, stomping polyrhythm
  zulu: {
    gain: 2.0,
    name: 'Savanna', bpm: 108, steps: 12, perBeat: 3, root: 53, scale: [0, 200, 400, 700, 900], reverb: 0.3,
    melody: { voice: 'voice', oct: 0, vol: 0.15, density: 0.85, rhythms: [[0, 3, 6, 9], [0, 2, 3, 6, 9], [0, 3, 5, 6, 9]], contour: 'descend', lo: -2, hi: 5, hold: 4 },
    echo: { voice: 'oo', oct: 0, vol: 0.09, density: 0.7, rhythms: [[1, 7], [3, 9]], contour: 'wave', lo: -3, hi: 2, hold: 5 },
    drone: { voice: 'oo', degrees: [0, 4], oct: -1, vol: 0.06 },
    perc: [{ voice: 'stomp', pat: 'X..x..X..x.x', vol: 0.3 }, { voice: 'clap', pat: '..x..x..x..x', vol: 0.1 }, { voice: 'shaker', pat: 'xxxxxxxxxxxx', vol: 0.05 }],
  },
  // ------------------------------------------------------------------ Persia: Shur-like with a neutral third, santur, ney, tombak
  persia: {
    name: 'Shiraz', bpm: 92, steps: 12, perBeat: 3, root: 50, scale: [0, 200, 350, 500, 700, 800, 1000], reverb: 0.5,
    melody: { voice: 'ney', oct: 1, vol: 0.18, density: 0.85, rhythms: R12, contour: 'arch', lo: -3, hi: 6, orn: 0.3, hold: 5 },
    arp: { voice: 'santur', oct: 1, vol: 0.13, pattern: [0, 2, 4, 2, 0, 4], rhythms: [[0, 2, 4, 6, 8, 10]], density: 0.95, contour: 'flat' },
    drone: { voice: 'drone', degrees: [0, 4], oct: -1, vol: 0.07 },
    perc: [{ voice: 'doum', pat: 'X..x..x.x...', vol: 0.24 }, { voice: 'tek', pat: '...x.xo..x.x', vol: 0.12 }],
  },
  // ------------------------------------------------------------------ Celts: Dorian jig, tin whistle, harp, bodhrán
  celts: {
    name: 'Highlands', bpm: 116, steps: 12, perBeat: 6, root: 50, scale: [0, 200, 300, 500, 700, 900, 1000], swing: 0.05, reverb: 0.4,
    melody: { voice: 'whistle', oct: 2, vol: 0.13, density: 0.95, rhythms: [[0, 2, 3, 5, 6, 8, 9, 11], [0, 3, 4, 6, 9, 10], [0, 2, 3, 6, 9]], contour: 'wave', lo: -2, hi: 7, orn: 0.3, hold: 3 },
    arp: { voice: 'harp', oct: 0, vol: 0.14, pattern: [0, 2, 4, 2, 4, 2], rhythms: [[0, 2, 4, 6, 8, 10]], density: 1, contour: 'flat' },
    drone: { voice: 'drone', degrees: [0], oct: -1, vol: 0.06 },
    perc: [{ voice: 'bodhran', pat: 'X.xx.xX.xx.x', vol: 0.24 }],
  },
  // ------------------------------------------------------------------ Inuit: sparse, breathy throat-song pulses, frame drum
  inuit: {
    gain: 2.7,
    name: 'Ice Song', bpm: 84, steps: 16, perBeat: 4, root: 48, scale: [0, 200, 300, 700], reverb: 0.6,
    melody: { voice: 'voice', oct: 0, vol: 0.13, density: 0.7, rhythms: [[0, 6], [0, 4, 8], [0, 10], [2, 8, 12]], contour: 'flat', lo: -1, hi: 3, hold: 8 },
    drone: { voice: 'didge', degrees: [0], oct: -1, vol: 0.09 },
    perc: [{ voice: 'frame', pat: 'X...x...X...x...', vol: 0.26 }, { voice: 'rattle', pat: '..x...x...x...x.', vol: 0.06 }],
  },
  // ------------------------------------------------------------------ Inca: Andean minor pentatonic, panpipes, charango, bombo (huayno)
  inca: {
    gain: 0.8,
    name: 'Andes', bpm: 106, steps: 16, perBeat: 4, root: 52, scale: [0, 300, 500, 700, 1000], reverb: 0.5,
    melody: { voice: 'panpipe', oct: 1, vol: 0.19, density: 0.9, rhythms: [[0, 3, 4, 8, 11, 12], [0, 3, 4, 6, 8, 12], [0, 4, 8, 11, 12]], contour: 'descend', lo: -2, hi: 7, hold: 4 },
    arp: { voice: 'charango', oct: 1, vol: 0.11, pattern: [0, 2, 4, 2], rhythms: [[0, 2, 4, 6, 8, 10, 12, 14]], density: 0.95, contour: 'flat' },
    drone: { voice: 'oo', degrees: [0, 4], oct: -1, vol: 0.05 },
    perc: [{ voice: 'huehue', pat: 'X..xX...x..xX...', vol: 0.26 }, { voice: 'shaker', pat: '..x...x...x...x.', vol: 0.05 }],
  },
  // ------------------------------------------------------------------ Ethiopia: tizita-like pentatonic, krar, masenqo, kebero, 6/8
  ethiopia: {
    gain: 1.15,
    name: 'Highlands of Aksum', bpm: 100, steps: 12, perBeat: 6, root: 55, scale: [0, 200, 400, 700, 900], reverb: 0.4,
    melody: { voice: 'masenqo', oct: 1, vol: 0.17, density: 0.9, rhythms: R12, contour: 'wave', lo: -2, hi: 6, orn: 0.2, hold: 5 },
    arp: { voice: 'krar', oct: 1, vol: 0.13, pattern: [0, 2, 3, 2, 0, 3], rhythms: [[0, 2, 4, 6, 8, 10]], density: 0.9, contour: 'flat' },
    drone: { voice: 'drone', degrees: [0], oct: -1, vol: 0.06 },
    perc: [{ voice: 'doum', pat: 'X..x..x..x..', vol: 0.24 }, { voice: 'tek', pat: '.x.x.x.x.x.x', vol: 0.08 }],
  },
  // ------------------------------------------------------------------ Aboriginal: didgeridoo drone, clapsticks, descending chant-like line
  aboriginal: {
    gain: 2.2,
    // a slow, mystic Dreamtime: the didgeridoo carries the piece, a far-off chant floats over it
    name: 'Dreaming', bpm: 68, steps: 16, perBeat: 4, root: 38, scale: [0, 300, 500, 700, 1000], reverb: 0.8,
    melody: { voice: 'oo', oct: 2, vol: 0.07, density: 0.45, rhythms: [[0, 8], [0, 6, 12], [4, 12], [0]], contour: 'descend', lo: -1, hi: 4, hold: 10 },
    drone: { voice: 'yidaki', degrees: [0], oct: 0, vol: 0.2, every: 1 },
    perc: [{ voice: 'clave', pat: 'x.......x...x...', vol: 0.14 }, { voice: 'rattle', pat: '......o.......o.', vol: 0.04 }],
  },
  // ------------------------------------------------------------------ China: pentatonic, guzheng, erhu, dizi, gong
  china: {
    name: 'Middle Kingdom', bpm: 82, steps: 16, perBeat: 4, root: 55, scale: [0, 200, 400, 700, 900], reverb: 0.5,
    melody: { voice: 'erhu', oct: 1, vol: 0.16, density: 0.8, rhythms: [[0, 6, 8], [0, 4, 8, 10], [0, 3, 6, 8, 12], [0, 8]], contour: 'arch', lo: -2, hi: 6, orn: 0.25, hold: 8 },
    echo: { voice: 'dizi', oct: 1, vol: 0.1, density: 0.6, rhythms: [[0, 8], [4, 12]], contour: 'wave', lo: 0, hi: 7, hold: 4 },
    arp: { voice: 'guzheng', oct: 0, vol: 0.14, pattern: [0, 2, 4, 5, 4, 2], rhythms: [[0, 2, 4, 6, 8, 10, 12, 14]], density: 0.85, contour: 'flat' },
    drone: { voice: 'gong', degrees: [0], oct: -1, vol: 0.07, every: 4 },
    perc: [{ voice: 'gongperc', pat: 'X...............', vol: 0.22 }, { voice: 'wood', pat: '....x.......x...', vol: 0.1 }],
  },
  // ------------------------------------------------------------------ India: Bhairav-like raga, sitar, tanpura, tabla
  india: {
    name: 'Ganges', bpm: 80, steps: 16, perBeat: 4, root: 50, scale: [0, 100, 400, 500, 700, 800, 1100], reverb: 0.5,
    melody: { voice: 'sitar', oct: 1, vol: 0.19, density: 0.85, rhythms: [[0, 2, 4, 8, 10, 12], [0, 3, 6, 8, 12], [0, 2, 3, 4, 8, 12, 14], [0, 4, 8, 10]], contour: 'arch', lo: -3, hi: 7, orn: 0.45, hold: 6 },
    drone: { voice: 'tanpura', degrees: [4, 0, 0, -7], oct: -1, vol: 0.09, every: 1 },
    perc: [{ voice: 'ge', pat: 'X.......x...x...', vol: 0.22 }, { voice: 'na', pat: '..x.x.x...x.x.o.', vol: 0.17 }],
  },
  // ------------------------------------------------------------------ Mali: pentatonic, kora ostinato, balafon, djembe
  mali: {
    name: 'Niger', bpm: 108, steps: 12, perBeat: 3, root: 52, scale: [0, 200, 400, 700, 900], reverb: 0.3,
    melody: { voice: 'balafon', oct: 1, vol: 0.16, density: 0.9, rhythms: [[0, 3, 4, 6, 9, 10], [0, 2, 3, 6, 8, 9], [0, 3, 6, 7, 9]], contour: 'wave', lo: -2, hi: 6, hold: 3 },
    arp: { voice: 'kora', oct: 0, vol: 0.15, pattern: [0, 2, 4, 2, 4, 5], rhythms: [[0, 2, 3, 5, 6, 8, 9, 11]], density: 1, contour: 'flat' },
    drone: { voice: 'drone', degrees: [0], oct: -1, vol: 0.05 },
    perc: [{ voice: 'djembe', pat: 'X..x..x.x..x', vol: 0.26 }, { voice: 'slap', pat: '.x..x.x..x.x', vol: 0.13 }, { voice: 'shaker', pat: 'x.x.x.x.x.x.', vol: 0.05 }],
  },
  // ------------------------------------------------------------------ Lakota: minor pentatonic, plains flute, heartbeat drum, rattle
  lakota: {
    name: 'Great Plains', bpm: 88, steps: 16, perBeat: 4, root: 50, scale: [0, 300, 500, 700, 1000], reverb: 0.55,
    melody: { voice: 'natflute', oct: 1, vol: 0.19, density: 0.7, rhythms: [[0, 6, 8], [0, 4, 10], [0, 8, 12], [0, 3, 8]], contour: 'descend', lo: -2, hi: 5, hold: 10 },
    echo: { voice: 'voice', oct: 0, vol: 0.08, density: 0.45, rhythms: [[0, 8]], contour: 'flat', lo: -2, hi: 2, hold: 8 },
    drone: { voice: 'oo', degrees: [0, 4], oct: -1, vol: 0.05, every: 2 },
    perc: [{ voice: 'frame', pat: 'X.x.X.x.X.x.X.x.', vol: 0.24 }, { voice: 'rattle', pat: '..x...x...x...x.', vol: 0.06 }],
  },
  // ------------------------------------------------------------------ Ottoman: Hicaz, zurna, oud, davul, aksak 9/8 (2+2+2+3)
  ottoman: {
    name: 'Sublime Porte', bpm: 128, steps: 9, perBeat: 2, root: 50, scale: [0, 100, 400, 500, 700, 800, 1000], reverb: 0.4,
    melody: { voice: 'zurna', oct: 1, vol: 0.13, density: 0.9, rhythms: [[0, 2, 4, 6, 7], [0, 2, 3, 4, 6], [0, 2, 4, 5, 6, 7]], contour: 'wave', lo: -2, hi: 7, orn: 0.3, hold: 4 },
    arp: { voice: 'oud', oct: 0, vol: 0.14, pattern: [0, 2, 4, 2], rhythms: [[0, 2, 4, 6]], density: 1, contour: 'flat' },
    drone: { voice: 'drone', degrees: [0, 4], oct: -1, vol: 0.06 },
    perc: [{ voice: 'davul', pat: 'X.x.x.X..', vol: 0.26 }, { voice: 'tek', pat: '..o.x.o.x', vol: 0.1 }],
  },
  // ------------------------------------------------------------------ Maya: pentatonic clay whistles, log drum, conch, rattles
  maya: {
    name: 'Jaguar Throne', bpm: 90, steps: 16, perBeat: 4, root: 53, scale: [0, 200, 500, 700, 900], reverb: 0.45,
    melody: { voice: 'clayflute', oct: 1, vol: 0.18, density: 0.75, rhythms: R16, contour: 'wave', lo: -2, hi: 6, hold: 6 },
    echo: { voice: 'whistle', oct: 2, vol: 0.05, density: 0.4, rhythms: [[3, 11], [7, 15]], contour: 'arch', lo: 0, hi: 4, hold: 2 },
    drone: { voice: 'horn', degrees: [0], oct: -2, vol: 0.07, every: 4 },
    perc: [{ voice: 'tunkul', pat: 'X...x...X.x.x...', vol: 0.3 }, { voice: 'rattle', pat: 'x.x.x.x.x.x.x.x.', vol: 0.07 }],
  },
  // ------------------------------------------------------------------ Korea: pyeongjo pentatonic, gayageum, piri, janggu, 12/8 (3+3+3+3)
  korea: {
    gain: 1.5,
    name: 'Morning Calm', bpm: 76, steps: 12, perBeat: 3, root: 52, scale: [0, 200, 500, 700, 900], reverb: 0.5,
    melody: { voice: 'piri', oct: 1, vol: 0.14, density: 0.8, rhythms: [[0, 3, 6, 9], [0, 4, 6, 9], [0, 6, 9], [0, 3, 8]], contour: 'arch', lo: -2, hi: 6, orn: 0.3, hold: 6 },
    arp: { voice: 'gayageum', oct: 0, vol: 0.15, pattern: [0, 2, 4, 2, 0], rhythms: [[0, 3, 6, 9]], density: 0.9, contour: 'flat' },
    drone: { voice: 'bowl', degrees: [0], oct: 0, vol: 0.04, every: 4 },
    perc: [{ voice: 'janggu', pat: 'X..x.xX..x.x', vol: 0.22 }, { voice: 'wood', pat: '..........o.', vol: 0.08 }],
  },
  // ------------------------------------------------------------------ Khmer: near-equidistant heptatonic, roneat, gong circle, skor drums
  khmer: {
    gain: 0.7,
    name: 'Angkor', bpm: 96, steps: 16, perBeat: 4, root: 54, scale: [0, 170, 340, 510, 690, 860, 1030], reverb: 0.5,
    melody: { voice: 'roneat', oct: 1, vol: 0.17, density: 0.9, rhythms: R16, contour: 'wave', lo: -3, hi: 7, hold: 3 },
    arp: { voice: 'bell', oct: 0, vol: 0.09, pattern: [0, 2, 4, 2, 0, 4], rhythms: [[0, 4, 8, 12]], density: 1, contour: 'flat' },
    drone: { voice: 'gong', degrees: [0], oct: -1, vol: 0.06, every: 4 },
    perc: [{ voice: 'gongperc', pat: 'X...x...x...x...', vol: 0.16 }, { voice: 'doum', pat: 'x..x..x.x..x..x.', vol: 0.2 }, { voice: 'clave', pat: '..x...x...x...x.', vol: 0.07 }],
  },
  // ------------------------------------------------------------------ Swahili coast: taarab, Hijaz colours, qanun/oud, fiddle, ngoma
  swahili: {
    name: 'Monsoon Coast', bpm: 106, steps: 16, perBeat: 4, root: 53, scale: [0, 100, 400, 500, 700, 800, 1000], reverb: 0.35,
    melody: { voice: 'fiddle', oct: 1, vol: 0.14, density: 0.9, rhythms: R16, contour: 'wave', lo: -2, hi: 7, orn: 0.3, hold: 5 },
    arp: { voice: 'qanun', oct: 1, vol: 0.12, pattern: [0, 2, 4, 2, 0, 2, 4, 6], rhythms: [[0, 2, 4, 6, 8, 10, 12, 14]], density: 0.9, contour: 'flat' },
    drone: { voice: 'drone', degrees: [0, 4], oct: -1, vol: 0.06 },
    perc: [{ voice: 'doum', pat: 'X..x..x.x.x.x.x.', vol: 0.24 }, { voice: 'tek', pat: '.x.x.x.x.x.x.x.x', vol: 0.08 }, { voice: 'shaker', pat: 'x.x.x.x.x.x.x.x.', vol: 0.05 }],
  },
  // ------------------------------------------------------------------ Tibet: slow pentatonic, long horns (dungchen), singing bowls, gyaling, cymbals
  tibet: {
    gain: 1.5,
    name: 'Roof of the World', bpm: 58, steps: 16, perBeat: 4, root: 46, scale: [0, 200, 500, 700, 900], reverb: 0.7,
    melody: { voice: 'shawm', oct: 1, vol: 0.1, density: 0.5, rhythms: [[0, 8], [0, 10], [4, 12], [0]], contour: 'arch', lo: -1, hi: 4, hold: 12 },
    echo: { voice: 'bowl', oct: 1, vol: 0.09, density: 0.7, rhythms: [[0], [8], [0, 8]], contour: 'flat', lo: 0, hi: 4, hold: 16 },
    drone: { voice: 'dung', degrees: [0, 4], oct: -2, vol: 0.13, every: 2 },
    perc: [{ voice: 'cymbal', pat: 'X...............', vol: 0.09 }, { voice: 'gongperc', pat: '........o.......', vol: 0.1 }, { voice: 'frame', pat: '....x.......x...', vol: 0.12 }],
  },
  // ------------------------------------------------------------------ Carthage: Phoenician double-reed and lyre over a frame drum, Phrygian-dominant
  carthage: {
    name: 'Tyrian Sea', bpm: 100, steps: 12, perBeat: 3, root: 50, scale: [0, 100, 400, 500, 700, 800, 1000], reverb: 0.45,
    melody: { voice: 'aulos', oct: 1, vol: 0.15, density: 0.85, rhythms: R12, contour: 'wave', lo: -2, hi: 6, orn: 0.25, hold: 5 },
    arp: { voice: 'lyre', oct: 0, vol: 0.13, pattern: [0, 2, 4, 2, 0, 4], rhythms: [[0, 2, 4, 6, 8, 10]], density: 0.9, contour: 'flat' },
    drone: { voice: 'drone', degrees: [0, 4], oct: -1, vol: 0.07 },
    perc: [{ voice: 'frame', pat: 'X..x..X.x.x.', vol: 0.2 }, { voice: 'tek', pat: '..x..x..o..x', vol: 0.09 }],
  },
  // ------------------------------------------------------------------ Byzantium: chant over an ison drone, bells, a double-harmonic mode
  byzantium: {
    gain: 1.3,
    name: 'Golden Horn', bpm: 64, steps: 16, perBeat: 4, root: 48, scale: [0, 100, 400, 500, 700, 800, 1100], reverb: 0.75,
    melody: { voice: 'voice', oct: 1, vol: 0.13, density: 0.6, rhythms: [[0, 4, 8, 12], [0, 8], [0, 6, 8, 12]], contour: 'arch', lo: -2, hi: 5, orn: 0.2, hold: 10 },
    echo: { voice: 'lyre', oct: 1, vol: 0.08, density: 0.5, rhythms: [[0, 8], [4, 12]], contour: 'flat', lo: 0, hi: 4, hold: 6 },
    drone: { voice: 'drone', degrees: [0], oct: -1, vol: 0.12 },
    perc: [{ voice: 'gongperc', pat: 'X...............', vol: 0.12 }, { voice: 'cymbal', pat: '........o.......', vol: 0.06 }],
  },
  // ------------------------------------------------------------------ Arabia: maqam Hijaz, ney and oud, doum-tek on the darbuka
  arabia: {
    name: 'Round City', bpm: 104, steps: 16, perBeat: 4, root: 50, scale: [0, 100, 400, 500, 700, 800, 1000], reverb: 0.4,
    melody: { voice: 'ney', oct: 1, vol: 0.17, density: 0.85, rhythms: R16, contour: 'wave', lo: -3, hi: 6, orn: 0.35, hold: 5 },
    arp: { voice: 'oud', oct: 0, vol: 0.14, pattern: [0, 2, 4, 2, 0, 2, 3, 2], rhythms: [[0, 2, 4, 6, 8, 10, 12, 14]], density: 0.9, contour: 'flat' },
    drone: { voice: 'drone', degrees: [0, 4], oct: -1, vol: 0.06 },
    perc: [{ voice: 'doum', pat: 'X..x..X...x.x...', vol: 0.25 }, { voice: 'tek', pat: '.x.x.x...x.x.x.x', vol: 0.1 }],
  },
  // ------------------------------------------------------------------ Rus: a minor folk song, low choir and plucked gusli, a frame drum
  rus: {
    gain: 1.2,
    name: 'Birch and Snow', bpm: 84, steps: 8, perBeat: 2, root: 45, scale: [0, 200, 300, 500, 700, 800, 1000], reverb: 0.6,
    melody: { voice: 'voice', oct: 1, vol: 0.13, density: 0.8, rhythms: [[0, 2, 4, 6], [0, 3, 4, 6], [0, 4]], contour: 'descend', lo: -2, hi: 5, hold: 6 },
    arp: { voice: 'harp', oct: 0, vol: 0.14, pattern: [0, 2, 4, 2], rhythms: [[0, 2, 4, 6]], density: 1, contour: 'flat' },
    drone: { voice: 'drone', degrees: [0, 4], oct: -2, vol: 0.09 },
    perc: [{ voice: 'frame', pat: 'X...x.x.', vol: 0.16 }, { voice: 'shaker', pat: '..x...x.', vol: 0.05 }],
  },
  // ------------------------------------------------------------------ Vietnam: pentatonic bamboo flute over a zither, wood blocks
  vietnam: {
    gain: 1.3,
    name: 'Red River', bpm: 80, steps: 16, perBeat: 4, root: 53, scale: [0, 200, 500, 700, 900], reverb: 0.5,
    melody: { voice: 'dizi', oct: 1, vol: 0.14, density: 0.8, rhythms: [[0, 6, 8], [0, 4, 8, 10], [0, 3, 6, 8, 12], [0, 8]], contour: 'wave', lo: -2, hi: 6, orn: 0.3, hold: 7 },
    arp: { voice: 'guzheng', oct: 0, vol: 0.14, pattern: [0, 1, 2, 4, 2, 1], rhythms: [[0, 2, 4, 6, 8, 10, 12, 14]], density: 0.8, contour: 'flat' },
    drone: { voice: 'gong', degrees: [0], oct: -1, vol: 0.06, every: 4 },
    perc: [{ voice: 'wood', pat: 'X...x...x.x.x...', vol: 0.12 }, { voice: 'gongperc', pat: '........o.......', vol: 0.08 }],
  },
  // ------------------------------------------------------------------ Babylon: a lyre and reed pipe over a frame drum, an old diatonic mode
  babylon: {
    gain: 1.2,
    name: 'Gate of Ishtar', bpm: 88, steps: 12, perBeat: 3, root: 50, scale: [0, 200, 300, 500, 700, 800, 1000], reverb: 0.55,
    melody: { voice: 'aulos', oct: 1, vol: 0.14, density: 0.75, rhythms: R12, contour: 'arch', lo: -2, hi: 5, orn: 0.2, hold: 6 },
    arp: { voice: 'lyre', oct: 0, vol: 0.14, pattern: [0, 2, 4, 2, 0, 4], rhythms: [[0, 2, 4, 6, 8, 10]], density: 0.9, contour: 'flat' },
    drone: { voice: 'drone', degrees: [0, 4], oct: -1, vol: 0.08 },
    perc: [{ voice: 'frame', pat: 'X..x..x..x..', vol: 0.18 }, { voice: 'tek', pat: '...x.....x.o', vol: 0.08 }],
  },
  // ------------------------------------------------------------------ Kush: a bowl lyre and handclaps over deep drums, pentatonic
  nubia: {
    name: 'Land of the Bow', bpm: 108, steps: 16, perBeat: 4, root: 52, scale: [0, 200, 500, 700, 900], reverb: 0.4,
    melody: { voice: 'voice', oct: 1, vol: 0.13, density: 0.8, rhythms: R16, contour: 'wave', lo: -2, hi: 5, hold: 5 },
    arp: { voice: 'harp', oct: 0, vol: 0.14, pattern: [0, 2, 4, 2, 0, 2, 3, 2], rhythms: [[0, 2, 4, 6, 8, 10, 12, 14]], density: 0.9, contour: 'flat' },
    drone: { voice: 'drone', degrees: [0], oct: -1, vol: 0.07 },
    perc: [{ voice: 'doum', pat: 'X..x..X.x..x..x.', vol: 0.25 }, { voice: 'clap', pat: '....x.......x...', vol: 0.1 }, { voice: 'shaker', pat: 'x.x.x.x.x.x.x.x.', vol: 0.05 }],
  },
  // ------------------------------------------------------------------ Majapahit: a gamelan of gongs and metallophones in pelog
  majapahit: {
    gain: 1.3,
    name: 'Gamelan of Trowulan', bpm: 72, steps: 16, perBeat: 4, root: 51, scale: [0, 120, 270, 540, 670, 790, 950], reverb: 0.55,
    melody: { voice: 'roneat', oct: 1, vol: 0.14, density: 0.85, rhythms: [[0, 2, 4, 6, 8, 10, 12, 14], [0, 4, 8, 12], [0, 2, 6, 8, 10, 14]], contour: 'wave', lo: -1, hi: 5, hold: 4 },
    arp: { voice: 'roneat', oct: 0, vol: 0.1, pattern: [0, 1, 2, 4, 2, 1], rhythms: [[0, 4, 8, 12]], density: 1, contour: 'flat' },
    drone: { voice: 'gong', degrees: [0], oct: -1, vol: 0.1, every: 2 },
    perc: [{ voice: 'gongperc', pat: 'X.......o.......', vol: 0.14 }, { voice: 'wood', pat: '..x...x...x...x.', vol: 0.08 }],
  },
  // ------------------------------------------------------------------ Spain: a plucked oud-guitar in the Phrygian mode with handclaps
  spain: {
    name: 'Castile', bpm: 112, steps: 12, perBeat: 3, root: 52, scale: [0, 100, 400, 500, 700, 800, 1000], reverb: 0.4,
    melody: { voice: 'fiddle', oct: 1, vol: 0.13, density: 0.85, rhythms: R12, contour: 'descend', lo: -2, hi: 6, orn: 0.3, hold: 4 },
    arp: { voice: 'oud', oct: 0, vol: 0.15, pattern: [0, 2, 4, 2, 0, 1], rhythms: [[0, 2, 4, 6, 8, 10]], density: 1, contour: 'flat' },
    drone: { voice: 'drone', degrees: [0, 4], oct: -1, vol: 0.06 },
    perc: [{ voice: 'clap', pat: 'x..x..x.x.x.', vol: 0.14 }, { voice: 'frame', pat: 'X.....X.....', vol: 0.14 }],
  },
  // ------------------------------------------------------------------ Haudenosaunee: a water drum and horn rattles under a call-and-answer song
  haudenosaunee: {
    gain: 1.3,
    name: 'Longhouse', bpm: 96, steps: 8, perBeat: 2, root: 48, scale: [0, 300, 500, 700, 1000], reverb: 0.45,
    melody: { voice: 'voice', oct: 1, vol: 0.13, density: 0.85, rhythms: [[0, 2, 4, 6], [0, 1, 2, 4, 6], [0, 4]], contour: 'descend', lo: -2, hi: 4, hold: 4 },
    echo: { voice: 'natflute', oct: 1, vol: 0.08, density: 0.4, rhythms: [[0, 4]], contour: 'flat', lo: 0, hi: 4, hold: 6 },
    drone: { voice: 'drone', degrees: [0], oct: -2, vol: 0.06 },
    perc: [{ voice: 'frame', pat: 'X.x.X.x.', vol: 0.2 }, { voice: 'rattle', pat: 'x.x.x.x.', vol: 0.1 }],
  },
};

// ---------------------------------------------------------------------------------------------- the engine

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Note { step: number; deg: number; len: number; grace?: boolean }

class Music {
  enabled = true;
  private want: ThemeId | null = null;
  private cur: ThemeId | null = null;
  private ac: AudioContext | null = null;
  private master: GainNode | null = null;
  private bus: GainNode | null = null;
  private send: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private timer = 0;
  private nextBar = 0;
  private bar = 0;
  private cycle = 0;
  private phrase: Note[][] = [];
  private melodyDeg = 0;
  private hidden = false;

  constructor(attach = true) {
    if (!attach) return;
    sfx.onReady = () => this.begin();
    document.addEventListener('visibilitychange', () => {
      this.hidden = document.hidden;
      if (!this.ac) return;
      if (document.hidden) void this.ac.suspend();
      else if (this.enabled && this.want) void this.ac.resume();
    });
  }

  /** Plays the theme of an empire (or the title music). Does nothing until a tap has unlocked audio. */
  play(id: ThemeId) {
    this.want = id;
    if (!this.enabled) return;
    if (this.cur === id && this.timer) return;
    this.begin();
  }

  stop() {
    this.want = null;
    this.halt(0.5);
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (!on) this.halt(0.4);
    else if (this.want) this.begin();
  }

  private halt(fade: number) {
    if (this.timer) clearInterval(this.timer);
    this.timer = 0;
    this.cur = null;
    if (this.master && this.ac) {
      this.master.gain.cancelScheduledValues(this.ac.currentTime);
      this.master.gain.setTargetAtTime(0, this.ac.currentTime, fade / 3);
    }
  }

  private setup(force?: BaseAudioContext) {
    const ac = (force as AudioContext | undefined) ?? sfx.context();
    if (!ac) return false;
    if (this.ac === ac) return true;
    this.ac = ac;
    this.master = ac.createGain();
    this.master.gain.value = 0;
    this.master.connect(ac.destination);
    this.bus = ac.createGain();
    this.bus.gain.value = 1;
    this.bus.connect(this.master);
    // a small synthetic hall: decaying noise as the impulse response
    const conv = ac.createConvolver();
    const len = Math.floor(ac.sampleRate * 2.2);
    const ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    conv.buffer = ir;
    this.send = ac.createGain();
    this.send.gain.value = 0.3;
    this.send.connect(conv).connect(this.master);
    this.noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const nd = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    return true;
  }

  private begin() {
    if (!this.enabled || !this.want || this.hidden || !this.setup()) return;
    const ac = this.ac!;
    if (ac.state === 'suspended') void ac.resume();
    if (this.cur === this.want && this.timer) return;
    const first = !this.cur;
    if (this.timer) clearInterval(this.timer);
    this.cur = this.want;
    const th = THEMES[this.cur];
    this.send!.gain.setTargetAtTime(th.reverb ?? 0.35, ac.currentTime, 0.2);
    // fade the old theme out and the new one in
    const t = ac.currentTime;
    this.master!.gain.cancelScheduledValues(t);
    this.master!.gain.setTargetAtTime(0, t, first ? 0.01 : 0.15);
    this.master!.gain.setTargetAtTime(0.5 * (th.gain ?? 1), t + (first ? 0.05 : 0.5), 0.5);
    this.nextBar = t + (first ? 0.15 : 0.6);
    this.bar = 0;
    this.cycle = 0;
    this.phrase = [];
    this.melodyDeg = 0;
    this.timer = window.setInterval(() => this.pump(), 80);
    this.pump();
  }

  debugSchedule(oc: OfflineAudioContext, id: ThemeId, bars: number, barSec: number) {
    this.setup(oc);
    this.master!.gain.value = 0.5 * (THEMES[id].gain ?? 1);
    this.cur = id;
    this.send!.gain.value = THEMES[id].reverb ?? 0.35;
    for (let b = 0; b < bars; b++) {
      this.bar = b;
      this.cycle = Math.floor(b / 8);
      this.scheduleBar(THEMES[id], 0.1 + b * barSec, barSec);
    }
  }

  private pump() {
    const ac = this.ac;
    if (!ac || !this.cur || ac.state !== 'running') return;
    const th = THEMES[this.cur];
    const barSec = (60 / th.bpm) * (th.steps / th.perBeat);
    while (this.nextBar < ac.currentTime + 0.7) {
      this.scheduleBar(th, this.nextBar, barSec);
      this.nextBar += barSec;
      this.bar++;
      if (this.bar % 8 === 0) this.cycle++;
    }
  }

  // ---- composing

  private freq(th: Theme, deg: number, oct: number) {
    const n = th.scale.length;
    const o = Math.floor(deg / n);
    const cents = th.scale[((deg % n) + n) % n] + 1200 * (o + oct);
    return 440 * Math.pow(2, (th.root - 69) / 12 + cents / 1200);
  }

  private pickNotes(th: Theme, line: Line, r: () => number, barInPhrase: number, startDeg: number): Note[] {
    const rhythms = line.rhythms ?? R16;
    const pat = rhythms[Math.floor(r() * rhythms.length)];
    const lo = line.lo ?? -2, hi = line.hi ?? 6;
    const notes: Note[] = [];
    let deg = startDeg;
    const contour = line.contour ?? 'wave';
    pat.forEach((step, i) => {
      if (r() > (line.density ?? 0.85)) return;
      let move = Math.round((r() - 0.5) * 3.2);
      if (contour === 'descend') move -= r() < 0.45 ? 1 : 0;
      else if (contour === 'arch') move += barInPhrase < 3 ? (r() < 0.4 ? 1 : 0) : (r() < 0.5 ? -1 : 0);
      else if (contour === 'wave') move += Math.sin((barInPhrase * 4 + i) * 0.9) > 0.3 ? 1 : Math.sin((barInPhrase * 4 + i) * 0.9) < -0.3 ? -1 : 0;
      else if (contour === 'flat') move = Math.round((r() - 0.5) * 2);
      else if (contour === 'leap' && r() < 0.25) move += r() < 0.5 ? 3 : -3;
      deg = Math.max(lo, Math.min(hi, deg + move));
      const next = pat[i + 1] ?? th.steps;
      notes.push({ step, deg, len: Math.min(next - step, line.hold ?? 6) });
    });
    if (notes.length && line.orn && r() < line.orn) {
      const t = notes[Math.floor(r() * notes.length)];
      if (t.step > 0) notes.push({ step: t.step - 0.5, deg: t.deg + (r() < 0.6 ? 1 : -1), len: 0.5, grace: true });
    }
    return notes;
  }

  private scheduleBar(th: Theme, t0: number, barSec: number) {
    const stepSec = barSec / th.steps;
    const swing = (s: number) => (th.swing && Math.floor(s) % 2 === 1 ? th.swing * stepSec * 2 : 0);
    const inPhrase = this.bar % 8;
    const r = rng(hash(this.cur!) + this.cycle * 977 + inPhrase * 31);
    // melody: bars 0-3 are new, 4-6 come back (lightly varied), 7 is a cadence that lands on the tonic
    let notes: Note[];
    if (inPhrase < 4) {
      notes = this.pickNotes(th, th.melody, r, inPhrase, this.melodyDeg);
      this.phrase[inPhrase] = notes;
    } else if (inPhrase < 7 && this.phrase[inPhrase - 4]) {
      notes = this.phrase[inPhrase - 4].map((n) => ({ ...n, deg: n.deg + (r() < 0.2 ? (r() < 0.5 ? 1 : -1) : 0) }));
    } else {
      notes = this.pickNotes(th, th.melody, r, 7, this.melodyDeg);
      const last = notes[notes.length - 1];
      if (last) last.deg = 0;
    }
    if (notes.length) this.melodyDeg = notes[notes.length - 1].deg;
    if (inPhrase === 0 || inPhrase === 4) notes.forEach((n, i) => { if (i === 0 && n.step === 0) n.len = Math.max(n.len, 4); });
    for (const n of notes) {
      const at = t0 + n.step * stepSec + swing(n.step);
      this.voice(th.melody.voice, this.freq(th, n.deg, th.melody.oct), at, n.len * stepSec, th.melody.vol * (n.grace ? 0.6 : 1), n.grace);
    }
    // echo voice answers with a different pattern
    if (th.echo && (inPhrase % 2 === 1 || inPhrase === 4)) {
      const e = this.pickNotes(th, th.echo, r, inPhrase, 1);
      for (const n of e) this.voice(th.echo.voice, this.freq(th, n.deg, th.echo.oct), t0 + n.step * stepSec + swing(n.step), n.len * stepSec, th.echo.vol);
    }
    // accompaniment figure
    if (th.arp) {
      const on = th.arp.rhythms![0];
      const pat = th.arp.pattern;
      on.forEach((step, i) => {
        if (r() > (th.arp!.density ?? 1)) return;
        const deg = pat[(i + this.bar * 3) % pat.length] + (inPhrase >= 4 && inPhrase < 7 ? 1 : 0) * 0;
        const next = on[i + 1] ?? th.steps;
        this.voice(th.arp!.voice, this.freq(th, deg, th.arp!.oct), t0 + step * stepSec + swing(step), Math.min(next - step, 3) * stepSec, th.arp!.vol * (i % 4 === 0 ? 1.15 : 0.85));
      });
    }
    // drone: a sustained tone that outlasts the bar
    if (th.drone && this.bar % (th.drone.every ?? 2) === 0) {
      const d = th.drone;
      const deg = d.degrees[(this.bar / (d.every ?? 2)) % d.degrees.length | 0];
      this.voice(d.voice, this.freq(th, deg, d.oct), t0, barSec * (d.every ?? 2) * 0.98, d.vol);
    }
    // percussion
    for (const p of th.perc) {
      for (let s = 0; s < th.steps; s++) {
        const c = p.pat[s % p.pat.length];
        if (c === '.' || c === undefined) continue;
        const amp = c === 'X' ? 1.35 : c === 'o' ? 0.5 : 1;
        this.hit(p.voice, t0 + s * stepSec + swing(s), p.vol * amp * (0.9 + r() * 0.2));
      }
    }
  }

  // ---- synthesis

  private out(node: AudioNode, wet = 0.4) {
    node.connect(this.bus!);
    if (wet > 0) {
      const g = this.ac!.createGain();
      g.gain.value = wet;
      node.connect(g).connect(this.send!);
    }
  }

  private gainEnv(t: number, a: number, dur: number, vol: number, rel = 0.12) {
    const g = this.ac!.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + Math.max(0.004, a));
    const end = t + Math.max(a + 0.02, dur);
    g.gain.setValueAtTime(Math.max(0.0002, vol), end);
    g.gain.exponentialRampToValueAtTime(0.0001, end + rel);
    return { g, end: end + rel + 0.05 };
  }

  private osc(type: OscillatorType, f: number, t: number, stop: number, detune = 0) {
    const o = this.ac!.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    o.detune.value = detune;
    o.start(t);
    o.stop(stop);
    return o;
  }

  private noise(t: number, stop: number) {
    const s = this.ac!.createBufferSource();
    s.buffer = this.noiseBuf!;
    s.loop = true;
    s.start(t, Math.random() * 0.5);
    s.stop(stop);
    return s;
  }

  private vibrato(o: OscillatorNode, t: number, stop: number, rate: number, cents: number, delay = 0.12) {
    const l = this.ac!.createOscillator();
    l.frequency.value = rate;
    const g = this.ac!.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(cents, t + delay + 0.25);
    l.connect(g).connect(o.detune);
    l.start(t);
    l.stop(stop);
  }

  /** A plucked string: a bright start that darkens as it rings. */
  private pluck(f: number, t: number, dur: number, vol: number, p: { w: OscillatorType; w2?: OscillatorType; cut: number; dec: number; bend?: number; q?: number; buzz?: number; det?: number; wet?: number; dbl?: boolean }) {
    const ac = this.ac!;
    const len = Math.min(p.dec, Math.max(dur, 0.25) + 0.3);
    const { g, end } = this.gainEnv(t, 0.003, len * 0.6, vol, len * 0.5);
    const fl = ac.createBiquadFilter();
    fl.type = 'lowpass';
    fl.Q.value = p.q ?? 1;
    fl.frequency.setValueAtTime(p.cut * 2.4, t);
    fl.frequency.exponentialRampToValueAtTime(Math.max(300, p.cut * 0.4), t + len);
    const o1 = this.osc(p.w, f, t, end, 0);
    if (p.bend) o1.frequency.setValueAtTime(f * Math.pow(2, p.bend / 1200), t), o1.frequency.exponentialRampToValueAtTime(f, t + 0.09);
    o1.connect(fl);
    if (p.w2) { const o2 = this.osc(p.w2, f * (p.buzz ? 2.005 : 1), t, end, p.det ?? 5); const m = ac.createGain(); m.gain.value = p.buzz ?? 0.5; o2.connect(m).connect(fl); }
    if (p.dbl) { const o3 = this.osc(p.w, f, t + 0.03, end, 8); const m = ac.createGain(); m.gain.value = 0.6; o3.connect(m).connect(fl); }
    fl.connect(g);
    this.out(g, p.wet ?? 0.4);
  }

  /** A blown pipe: a soft tone with a breath of noise and a delayed vibrato. */
  private wind(f: number, t: number, dur: number, vol: number, p: { breath: number; vib: number; att: number; w?: OscillatorType; cut?: number; over?: number; wet?: number }) {
    const ac = this.ac!;
    const { g, end } = this.gainEnv(t, p.att, dur, vol, 0.18);
    const o = this.osc(p.w ?? 'sine', f, t, end);
    this.vibrato(o, t, end, 5.2, p.vib);
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = p.cut ?? 4000;
    o.connect(lp);
    if (p.over) { const o2 = this.osc('triangle', f * 2, t, end); const m = ac.createGain(); m.gain.value = p.over; o2.connect(m).connect(lp); }
    lp.connect(g);
    const n = this.noise(t, end);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = Math.min(6000, f * 3);
    bp.Q.value = 1.2;
    const ng = ac.createGain();
    ng.gain.value = p.breath;
    n.connect(bp).connect(ng).connect(g);
    this.out(g, p.wet ?? 0.5);
  }

  /** Reeds, bowed strings, brass: a buzzing wave shaped by a resonance. */
  private buzzer(f: number, t: number, dur: number, vol: number, p: { w?: OscillatorType; res: number; q?: number; att: number; vib?: number; vibRate?: number; low?: boolean; det?: number; rel?: number; wet?: number; swell?: boolean }) {
    const ac = this.ac!;
    const { g, end } = this.gainEnv(t, p.att, dur, vol, p.rel ?? 0.15);
    const bp = ac.createBiquadFilter();
    bp.type = p.low ? 'lowpass' : 'bandpass';
    bp.Q.value = p.q ?? 1.5;
    bp.frequency.setValueAtTime(p.swell ? p.res * 0.4 : p.res, t);
    if (p.swell) bp.frequency.exponentialRampToValueAtTime(p.res, t + Math.max(0.1, dur * 0.5));
    const o = this.osc(p.w ?? 'sawtooth', f, t, end);
    if (p.vib) this.vibrato(o, t, end, p.vibRate ?? 5.6, p.vib);
    o.connect(bp);
    if (p.det) { const o2 = this.osc(p.w ?? 'sawtooth', f, t, end, p.det); o2.connect(bp); }
    bp.connect(g);
    this.out(g, p.wet ?? 0.35);
  }

  private bellTone(f: number, t: number, dur: number, vol: number, ratio: number, idx: number, dec: number, wet = 0.6) {
    const ac = this.ac!;
    const { g, end } = this.gainEnv(t, 0.004, Math.max(0.1, dec * 0.4), vol, dec);
    const c = this.osc('sine', f, t, end + dec);
    const m = this.osc('sine', f * ratio, t, end + dec);
    const mg = ac.createGain();
    mg.gain.setValueAtTime(f * idx, t);
    mg.gain.exponentialRampToValueAtTime(f * 0.05, t + dec * 0.7);
    m.connect(mg).connect(c.frequency);
    c.connect(g);
    this.out(g, wet);
  }

  private mallet(f: number, t: number, dur: number, vol: number, dec: number, buzz = 0) {
    const ac = this.ac!;
    const { g, end } = this.gainEnv(t, 0.002, dec * 0.3, vol, dec);
    const a = this.osc('sine', f, t, end);
    const b = this.osc('sine', f * 4, t, end);
    const bg = ac.createGain();
    bg.gain.setValueAtTime(0.3, t);
    bg.gain.exponentialRampToValueAtTime(0.001, t + dec * 0.25);
    a.connect(g);
    b.connect(bg).connect(g);
    if (buzz) { const n = this.noise(t, end); const hp = ac.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 2500; const ng = ac.createGain(); ng.gain.value = buzz; n.connect(hp).connect(ng).connect(g); }
    this.out(g, 0.3);
  }

  private voice(v: Voice, f: number, t: number, dur: number, vol: number, grace = false) {
    if (!this.ac) return;
    const d = Math.max(dur, 0.12);
    switch (v) {
      // plucked strings
      case 'lyre': return this.pluck(f, t, d, vol, { w: 'triangle', w2: 'sawtooth', buzz: 0.15, cut: 2600, dec: 1.1 });
      case 'harp': return this.pluck(f, t, d, vol * 1.05, { w: 'triangle', w2: 'sine', buzz: 0.4, cut: 2400, dec: 1.6, wet: 0.5 });
      case 'koto': return this.pluck(f, t, d, vol, { w: 'sawtooth', w2: 'triangle', buzz: 0.3, cut: 3200, dec: 0.9, bend: grace ? 0 : -25 });
      case 'oud': return this.pluck(f, t, d, vol, { w: 'sawtooth', w2: 'triangle', cut: 1900, dec: 0.85, q: 2 });
      case 'sitar': return this.pluck(f, t, d, vol * 0.9, { w: 'sawtooth', w2: 'square', buzz: 0.25, cut: 3000, dec: 1.6, bend: grace ? 0 : -60, q: 5 });
      case 'santur': return this.pluck(f, t, d, vol, { w: 'triangle', w2: 'square', buzz: 0.12, cut: 3600, dec: 0.8, dbl: true, wet: 0.6 });
      case 'guzheng': return this.pluck(f, t, d, vol, { w: 'triangle', w2: 'sawtooth', buzz: 0.25, cut: 3400, dec: 1.4, bend: -30 });
      case 'gayageum': return this.pluck(f, t, d, vol, { w: 'sawtooth', w2: 'triangle', cut: 2200, dec: 1.4, bend: -50 });
      case 'kora': return this.pluck(f, t, d, vol, { w: 'triangle', w2: 'sine', buzz: 0.6, cut: 3000, dec: 0.7 });
      case 'charango': return this.pluck(f, t, d, vol * 0.85, { w: 'square', w2: 'triangle', cut: 4200, dec: 0.4, dbl: true });
      case 'krar': return this.pluck(f, t, d, vol, { w: 'triangle', w2: 'sawtooth', buzz: 0.2, cut: 2200, dec: 0.7 });
      case 'qanun': return this.pluck(f, t, d, vol * 0.9, { w: 'sawtooth', w2: 'triangle', buzz: 0.35, cut: 4200, dec: 0.75, dbl: true });
      case 'pipa': return this.pluck(f, t, d, vol, { w: 'sawtooth', cut: 3800, dec: 0.5 });
      case 'lute': return this.pluck(f, t, d, vol, { w: 'triangle', cut: 2200, dec: 0.7 });
      // winds
      case 'flute': return this.wind(f, t, d, vol, { breath: 0.035, vib: 14, att: 0.06, over: 0.12 });
      case 'ney': return this.wind(f, t, d, vol, { breath: 0.09, vib: 16, att: 0.08, over: 0.18, cut: 3000, wet: 0.55 });
      case 'whistle': return this.wind(f, t, d, vol * 0.9, { breath: 0.02, vib: 10, att: 0.03, over: 0.25 });
      case 'panpipe': return this.wind(f, t, d, vol, { breath: 0.11, vib: 6, att: 0.045, over: 0.05, cut: 2600 });
      case 'shaku': return this.wind(f, t, d, vol, { breath: 0.16, vib: 22, att: 0.14, over: 0.08, cut: 2200, wet: 0.6 });
      case 'dizi': return this.wind(f, t, d, vol, { breath: 0.05, vib: 12, att: 0.05, over: 0.3, cut: 4500 });
      case 'clayflute': return this.wind(f, t, d, vol, { breath: 0.07, vib: 8, att: 0.05, over: 0.02, cut: 2000 });
      case 'natflute': return this.wind(f, t, d, vol, { breath: 0.13, vib: 12, att: 0.1, over: 0.06, cut: 2300, wet: 0.6 });
      // reeds
      case 'zurna': return this.buzzer(f, t, d, vol * 0.85, { res: 1800, q: 2.5, att: 0.02, vib: 12, vibRate: 6, det: 6 });
      case 'duduk': return this.buzzer(f, t, d, vol, { res: 900, q: 1.4, att: 0.06, vib: 10, low: true });
      case 'aulos': return this.buzzer(f, t, d, vol, { res: 1400, q: 2, att: 0.035, vib: 8, det: 14 });
      case 'piri': return this.buzzer(f, t, d, vol, { res: 1300, q: 2, att: 0.05, vib: 18, vibRate: 5, det: 4 });
      case 'accordion': return this.buzzer(f, t, d, vol, { w: 'square', res: 1500, q: 1, att: 0.015, det: 9 });
      case 'shawm': return this.buzzer(f, t, d, vol, { res: 1200, q: 2.4, att: 0.14, vib: 6, swell: true, wet: 0.6, det: 5 });
      // bowed
      case 'erhu': return this.buzzer(f, t, d, vol, { res: 1900, q: 1.3, att: 0.08, vib: 22, vibRate: 5.2 });
      case 'morin': return this.buzzer(f, t, d, vol, { res: 1200, q: 1, att: 0.07, vib: 12, det: 5, low: true });
      case 'masenqo': return this.buzzer(f, t, d, vol, { res: 1500, q: 1.6, att: 0.06, vib: 16 });
      case 'tagel': return this.buzzer(f, t, d, vol, { res: 1000, q: 1, att: 0.14, vib: 10, det: 7, low: true, swell: true });
      case 'fiddle': return this.buzzer(f, t, d, vol, { res: 2200, q: 1, att: 0.04, vib: 14, det: 4 });
      case 'rebab': return this.buzzer(f, t, d, vol, { res: 1100, q: 2, att: 0.06, vib: 12 });
      // struck
      case 'marimba': return this.mallet(f, t, d, vol, 0.6);
      case 'balafon': return this.mallet(f, t, d, vol, 0.5, 0.05);
      case 'roneat': return this.mallet(f, t, d, vol * 0.9, 0.35);
      case 'bell': return this.bellTone(f, t, d, vol, 1.4, 2.2, 2.6);
      case 'chime': return this.bellTone(f * 2, t, d, vol * 0.7, 2.76, 1.4, 1.8);
      case 'bowl': return this.bellTone(f, t, d, vol, 2.9, 0.6, Math.max(2.5, d * 1.2), 0.75);
      case 'gong': return this.bellTone(f, t, d, vol, 1.18, 1.6, Math.max(3, d * 0.9), 0.7);
      // sustained pads and drones
      case 'voice': return this.formant(f, t, d, vol, [700, 1100]);
      case 'oo': return this.formant(f, t, d, vol, [350, 800]);
      case 'drone': return this.buzzer(f, t, d, vol, { res: 700, q: 0.8, att: 0.5, det: 7, low: true, rel: 0.6, wet: 0.5 });
      case 'tanpura': return this.tanpura(f, t, d, vol);
      case 'horn': return this.buzzer(f, t, d, vol, { res: 900, q: 0.7, att: 0.35, low: true, swell: true, rel: 0.5 });
      case 'tuba': return this.buzzer(f, t, d, vol, { res: 600, q: 0.8, att: 0.12, low: true, det: 3 });
      case 'dung': return this.buzzer(f, t, d, vol, { res: 520, q: 0.7, att: 1.1, low: true, swell: true, det: 5, rel: 1.1, wet: 0.6 });
      case 'brass': return this.buzzer(f, t, d, vol, { res: 1500, q: 0.9, att: 0.05, low: true, swell: true });
      case 'didge': return this.didge(f, t, d, vol);
      case 'yidaki': return this.yidaki(f, t, d, vol);
    }
  }

  private formant(f: number, t: number, dur: number, vol: number, fm: [number, number]) {
    const ac = this.ac!;
    const { g, end } = this.gainEnv(t, 0.22, dur, vol, 0.35);
    const lfo = ac.createOscillator();
    lfo.frequency.value = 5;
    const lg = ac.createGain();
    lg.gain.setValueAtTime(0, t);
    lg.gain.linearRampToValueAtTime(9, t + 0.55);
    lfo.connect(lg);
    lfo.start(t);
    lfo.stop(end);
    const mix = ac.createGain();
    mix.gain.value = 1;
    for (const det of [-6, 6]) {
      const o = this.osc('sawtooth', f, t, end, det);
      lg.connect(o.detune);
      o.connect(mix);
    }
    fm.forEach((fr, i) => {
      const b = ac.createBiquadFilter();
      b.type = 'bandpass';
      b.frequency.value = fr;
      b.Q.value = 5;
      const m = ac.createGain();
      m.gain.value = i === 0 ? 1 : 0.5;
      mix.connect(b).connect(m).connect(g);
    });
    this.out(g, 0.55);
  }

  private tanpura(f: number, t: number, dur: number, vol: number) {
    const n = 4;
    for (let i = 0; i < n; i++) this.pluck(f * (i === 3 ? 0.5 : 1), t + i * 0.35, dur, vol * 0.8, { w: 'sawtooth', w2: 'triangle', buzz: 0.5, cut: 1800, dec: 2.2, q: 4, wet: 0.6 });
  }

  /** Didgeridoo: a low buzz whose vowel-like resonance sweeps and pulses. */
  private didge(f: number, t: number, dur: number, vol: number) {
    const ac = this.ac!;
    const { g, end } = this.gainEnv(t, 0.08, dur, vol, 0.2);
    const o = this.osc('sawtooth', f, t, end);
    const o2 = this.osc('square', f * 0.5, t, end);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 3;
    bp.frequency.setValueAtTime(380, t);
    const period = 0.9;
    for (let x = t; x < end; x += period) {
      bp.frequency.setValueAtTime(320, x);
      bp.frequency.linearRampToValueAtTime(1100, x + period * 0.5);
      bp.frequency.linearRampToValueAtTime(320, x + period);
    }
    const pulse = ac.createGain();
    pulse.gain.setValueAtTime(0.7, t);
    for (let x = t; x < end; x += period / 2) {
      pulse.gain.setValueAtTime(1, x);
      pulse.gain.linearRampToValueAtTime(0.65, x + period * 0.45);
    }
    o.connect(bp);
    const sub = ac.createGain();
    sub.gain.value = 0.5;
    o2.connect(sub).connect(bp);
    bp.connect(pulse).connect(g);
    this.out(g, 0.3);
  }

  /**
   * Yidaki (didgeridoo), the mystic way: a deep lip-buzz whose mouth-shape resonances glide like
   * slow vowels ("ooo-eee-aaa"), a rhythmic tongue pulse, the gulp of circular breathing, a growl
   * sung through the pipe and, now and then, an overblown "toot" an octave and a fifth above.
   */
  private yidaki(f: number, t: number, dur: number, vol: number) {
    const ac = this.ac!;
    const { g, end } = this.gainEnv(t, 0.35, dur, vol, 0.6);
    // the buzzing lips: two slightly detuned saws and a sub an octave down
    const mix = ac.createGain();
    mix.gain.value = 0.6;
    for (const det of [-4, 5]) this.osc('sawtooth', f, t, end, det).connect(mix);
    const sub = ac.createGain();
    sub.gain.value = 0.45;
    this.osc('triangle', f * 0.5, t, end).connect(sub).connect(mix);
    // a growl: the player's voice a twelfth above, rough and quiet
    const growl = ac.createGain();
    growl.gain.value = 0.12;
    const gv = this.osc('square', f * 3.01, t, end, 0);
    const trem = ac.createOscillator();
    trem.frequency.value = 23;
    const tg = ac.createGain();
    tg.gain.value = 0.08;
    trem.connect(tg).connect(growl.gain);
    trem.start(t);
    trem.stop(end);
    gv.connect(growl).connect(mix);
    // breath noise through the pipe
    const breath = ac.createGain();
    breath.gain.value = 0.05;
    const nf = ac.createBiquadFilter();
    nf.type = 'lowpass';
    nf.frequency.value = 900;
    this.noise(t, end).connect(nf).connect(breath).connect(mix);
    // two mouth resonances gliding like vowels, the heart of the sound
    const f1 = ac.createBiquadFilter(), f2 = ac.createBiquadFilter();
    f1.type = f2.type = 'bandpass';
    f1.Q.value = 6;
    f2.Q.value = 9;
    const vowels: [number, number][] = [[300, 850], [420, 2100], [650, 1200], [330, 1500], [550, 2400]];
    const step = 60 / 68; // one vowel a beat, bending into the next
    let i = Math.floor(t * 7) % vowels.length;
    f1.frequency.setValueAtTime(vowels[i][0], t);
    f2.frequency.setValueAtTime(vowels[i][1], t);
    for (let x = t + step; x < end; x += step) {
      i = (i + 1 + (Math.floor(x * 13) % 2)) % vowels.length;
      f1.frequency.linearRampToValueAtTime(vowels[i][0], x);
      f2.frequency.linearRampToValueAtTime(vowels[i][1], x);
    }
    const body = ac.createGain();
    body.gain.value = 1;
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 520;
    const f2g = ac.createGain();
    f2g.gain.value = 0.55;
    mix.connect(f1).connect(body);
    mix.connect(f2).connect(f2g).connect(body);
    mix.connect(lp).connect(body); // the drone's warm floor
    // the tongue pulse: a rolling rhythm in eighths, accents shifting bar to bar
    const pulse = ac.createGain();
    const eighth = step / 2;
    const pattern = [1, 0.55, 0.8, 0.5, 1, 0.6, 0.75, 0.9];
    pulse.gain.setValueAtTime(0.7, t);
    let n = Math.floor(t * 3) % pattern.length;
    for (let x = t; x < end; x += eighth, n++) {
      const a = pattern[n % pattern.length];
      pulse.gain.setValueAtTime(0.55 + a * 0.45, x);
      pulse.gain.linearRampToValueAtTime(0.5, x + eighth * 0.8);
    }
    // circular breathing: every few seconds a quick gulp dips and bends the drone
    for (let x = t + step * 3.5; x < end - 0.3; x += step * 4) {
      pulse.gain.setValueAtTime(0.5, x);
      pulse.gain.linearRampToValueAtTime(0.25, x + 0.08);
      pulse.gain.linearRampToValueAtTime(0.9, x + 0.2);
    }
    body.connect(pulse).connect(g);
    this.out(g, 0.55);
    // an overblown toot, rising out of the drone once in a while
    if (Math.floor(t * 5) % 3 === 0 && dur > step * 2) {
      const tt = t + step * (1.5 + (Math.floor(t * 11) % 3));
      const te = this.gainEnv(tt, 0.06, step * 0.9, vol * 0.35, 0.3);
      const to = this.osc('sawtooth', f * 3, tt, te.end);
      to.frequency.setValueAtTime(f * 2.7, tt);
      to.frequency.exponentialRampToValueAtTime(f * 3, tt + 0.12);
      const tb = ac.createBiquadFilter();
      tb.type = 'bandpass';
      tb.frequency.value = f * 3;
      tb.Q.value = 4;
      to.connect(tb).connect(te.g);
      this.out(te.g, 0.7);
    }
  }

  // ---- percussion

  private thump(t: number, vol: number, f0: number, f1: number, dur: number, click = 0.0) {
    const ac = this.ac!;
    const o = ac.createOscillator();
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    o.start(t);
    o.stop(t + dur + 0.02);
    if (click) this.burst(t, click * vol, 1800, 0.03, 'bandpass', 0);
    this.out(g, 0.25);
  }

  private burst(t: number, vol: number, freq: number, dur: number, type: BiquadFilterType, wet = 0.2, q = 1) {
    const ac = this.ac!;
    const n = this.noise(t, t + dur + 0.05);
    const f = ac.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(f).connect(g);
    this.out(g, wet);
  }

  private hit(p: Perc, t: number, v: number) {
    if (!this.ac) return;
    switch (p) {
      case 'kick': return this.thump(t, v, 130, 55, 0.28, 0.2);
      case 'taiko': this.thump(t, v, 110, 48, 0.55, 0.3); return this.burst(t, v * 0.25, 300, 0.12, 'lowpass', 0.3);
      case 'huehue': return this.thump(t, v, 150, 75, 0.42, 0.25);
      case 'frame': this.thump(t, v * 0.8, 210, 130, 0.2, 0.2); return this.burst(t, v * 0.12, 1500, 0.06, 'bandpass', 0.2);
      case 'na': return this.thump(t, v * 0.7, 420, 380, 0.11, 0.3);
      case 'ge': return this.thump(t, v, 175, 95, 0.4, 0.15);
      case 'doum': return this.thump(t, v, 165, 85, 0.3, 0.2);
      case 'tek': return this.burst(t, v * 0.6, 3200, 0.05, 'bandpass', 0.15, 2);
      case 'shaker': return this.burst(t, v * 0.5, 7000, 0.05, 'highpass', 0.15);
      case 'rattle': this.burst(t, v * 0.5, 4800, 0.05, 'bandpass', 0.2, 2); return this.burst(t + 0.04, v * 0.4, 4800, 0.05, 'bandpass', 0.2, 2);
      case 'clave': return this.thump(t, v * 0.7, 1250, 1100, 0.07, 0.1);
      case 'wood': return this.thump(t, v * 0.8, 720, 620, 0.1, 0.1);
      case 'cymbal': return this.burst(t, v * 0.5, 6000, 1.6, 'highpass', 0.5);
      case 'stomp': return this.thump(t, v, 85, 45, 0.22, 0.15);
      case 'djembe': return this.thump(t, v, 140, 82, 0.34, 0.2);
      case 'slap': this.burst(t, v * 0.6, 2200, 0.08, 'bandpass', 0.2, 1.5); return this.thump(t, v * 0.3, 330, 250, 0.08);
      case 'clap': this.burst(t, v * 0.7, 1500, 0.06, 'bandpass', 0.25); return this.burst(t + 0.02, v * 0.5, 1700, 0.07, 'bandpass', 0.25);
      case 'snare': this.burst(t, v * 0.7, 2600, 0.11, 'bandpass', 0.15); return this.thump(t, v * 0.5, 240, 170, 0.1);
      case 'tunkul': return this.thump(t, v, 190, 120, 0.45, 0.2);
      case 'janggu': this.thump(t, v, 130, 90, 0.3, 0.2); return this.burst(t + 0.005, v * 0.2, 2400, 0.05, 'bandpass', 0.2);
      case 'davul': this.thump(t, v, 100, 60, 0.4, 0.3); return this.burst(t, v * 0.15, 900, 0.1, 'bandpass', 0.2);
      case 'bodhran': return this.thump(t, v, 170, 105, 0.26, 0.2);
      case 'gongperc': return this.bellTone(120, t, 1, v, 1.18, 1.6, 2.6, 0.6);
    }
  }
}

export const music = new Music();

/** Renders a theme to a buffer without playing it (used to check every empire's music in tests). */
export async function renderTheme(id: ThemeId, bars: number, sampleRate = 22050): Promise<AudioBuffer> {
  const th = THEMES[id];
  const barSec = (60 / th.bpm) * (th.steps / th.perBeat);
  const oc = new OfflineAudioContext(2, Math.ceil(sampleRate * (barSec * bars + 2)), sampleRate);
  const m = new Music(false);
  m.debugSchedule(oc, id, bars, barSec);
  return oc.startRendering();
}

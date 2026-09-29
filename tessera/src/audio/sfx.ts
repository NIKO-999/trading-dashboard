// Tiny synthesized sound effects (Web Audio, no audio files), so they work offline too.
export type SoundName =
  | 'tap' | 'move' | 'harvest' | 'build' | 'train' | 'attack' | 'hit' | 'death' | 'levelup'
  | 'research' | 'endturn' | 'turn' | 'capture' | 'error' | 'stars' | 'ruin' | 'splash' | 'step';

type Wave = OscillatorType;

class Sound {
  enabled = true;
  private ac: AudioContext | null = null;
  private out: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private last = new Map<SoundName, number>();
  /** Called once audio has been unlocked by a tap (the music engine starts here). */
  onReady: (() => void) | null = null;

  /** The shared audio context, once unlocked. */
  context() {
    return this.ac;
  }

  /** Must be called from a user gesture before anything can play (browser autoplay rules). */
  unlock() {
    if (!this.ac) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ac = new AC();
      this.out = this.ac.createGain();
      this.out.gain.value = 0.55;
      this.out.connect(this.ac.destination);
      const len = this.ac.sampleRate;
      this.noiseBuf = this.ac.createBuffer(1, len, this.ac.sampleRate);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ac.state === 'suspended') void this.ac.resume();
    this.onReady?.();
  }

  private tone(freq: number, dur: number, wave: Wave, vol: number, at: number, slideTo?: number) {
    const ac = this.ac!;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = wave;
    o.frequency.setValueAtTime(freq, at);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, at + dur);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(this.out!);
    o.start(at);
    o.stop(at + dur + 0.02);
  }

  private noise(dur: number, vol: number, at: number, freq: number, type: BiquadFilterType = 'lowpass', sweepTo?: number) {
    const ac = this.ac!;
    const src = ac.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ac.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, at);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, at + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f).connect(g).connect(this.out!);
    src.start(at, Math.random() * 0.5);
    src.stop(at + dur + 0.02);
  }

  /** Plays a sound after `delayMs`, scaled by `volume` (0..1). Rapid repeats of the same sound are merged. */
  play(name: SoundName, delayMs = 0, volume = 1) {
    if (!this.enabled || !this.ac || this.ac.state !== 'running') return;
    const now = this.ac.currentTime;
    const at = now + Math.max(0, delayMs) / 1000;
    const prev = this.last.get(name) ?? -1;
    if (Math.abs(at - prev) < 0.05) return;
    this.last.set(name, at);
    const v = Math.max(0.05, Math.min(1, volume));
    const arp = (notes: number[], step: number, wave: Wave, vol: number, len = 0.22) =>
      notes.forEach((n, i) => this.tone(n, len, wave, vol * v, at + i * step));
    switch (name) {
      case 'tap': this.tone(1150, 0.05, 'sine', 0.12 * v, at); break;
      case 'move':
        this.tone(330, 0.08, 'triangle', 0.18 * v, at, 520);
        this.tone(520, 0.07, 'triangle', 0.12 * v, at + 0.07, 440);
        break;
      case 'splash': this.noise(0.25, 0.18 * v, at, 900, 'lowpass', 300); break;
      case 'step':
        this.tone(150 + Math.random() * 30, 0.07, 'sine', 0.16 * v, at, 90);
        this.noise(0.05, 0.07 * v, at, 700, 'lowpass');
        break;
      case 'harvest': arp([784, 1175, 1568], 0.07, 'sine', 0.2); break;
      case 'build':
        this.noise(0.07, 0.3 * v, at, 1200, 'bandpass');
        this.noise(0.07, 0.25 * v, at + 0.11, 900, 'bandpass');
        this.tone(196, 0.12, 'triangle', 0.15 * v, at + 0.11);
        break;
      case 'train': arp([392, 523, 659], 0.06, 'square', 0.07, 0.12); break;
      case 'attack':
        this.noise(0.16, 0.28 * v, at, 3000, 'bandpass', 700);
        break;
      case 'hit':
        this.noise(0.09, 0.32 * v, at, 1600, 'lowpass');
        this.tone(120, 0.14, 'sine', 0.35 * v, at, 60);
        break;
      case 'death': this.tone(420, 0.45, 'triangle', 0.18 * v, at, 90); break;
      case 'levelup': arp([523, 659, 784, 1047], 0.09, 'triangle', 0.2, 0.3); break;
      case 'research': arp([659, 880, 1319], 0.1, 'sine', 0.2, 0.35); break;
      case 'endturn':
        this.tone(196, 0.9, 'sine', 0.22 * v, at);
        this.tone(294, 0.9, 'sine', 0.13 * v, at + 0.02);
        break;
      case 'turn': arp([440, 660], 0.12, 'sine', 0.16, 0.3); break;
      case 'capture': arp([392, 523, 659, 784, 1047], 0.08, 'triangle', 0.2, 0.28); break;
      case 'error':
        this.tone(140, 0.1, 'square', 0.08 * v, at);
        this.tone(110, 0.14, 'square', 0.08 * v, at + 0.1);
        break;
      case 'stars': arp([1319, 1760], 0.06, 'sine', 0.15, 0.15); break;
      case 'ruin': arp([523, 784, 1047, 1568, 2093], 0.06, 'sine', 0.14, 0.4); break;
    }
  }
}

export const sfx = new Sound();

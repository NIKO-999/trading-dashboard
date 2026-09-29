/* Hero Go! — synthesized music + sound effects (Web Audio, no asset files). */
(function () {
  'use strict';
  let ctx = null, master, musicBus, sfxBus, noiseBuf, pulse25;
  let musicOn = true, sfxOn = true;
  const last = {};
  let speedMul = 1;

  function init() {
    // iOS: 'playback' session keeps sound on even with the ring/silent switch set to silent
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* unsupported */ }
    if (ctx) { if (ctx.state !== 'running' && !document.hidden) ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ctx = new AC(); } catch (e) { return; }
    master = ctx.createGain(); master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp); comp.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = musicOn ? 0.16 : 0; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = sfxOn ? 0.5 : 0; sfxBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // 25% pulse wave for that handheld-console lead
    const n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * 0.25);
    pulse25 = ctx.createPeriodicWave(re, im);
    document.addEventListener('visibilitychange', () => { if (!ctx) return; document.hidden ? ctx.suspend() : ctx.resume(); });
    // a context that starts (or gets) suspended/interrupted is resumed on the next real gesture
    if (ctx.state !== 'running') ctx.resume();
    if (pendingTrack) { const t = pendingTrack; pendingTrack = null; music(t); }
  }

  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  // ---------------------------------------------------------------- primitives
  function tone(o) {
    if (!ctx) return;
    const t = o.t != null ? o.t : ctx.currentTime, dur = o.dur || 0.15, bus = o.bus || sfxBus;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    if (o.type === 'pulse') osc.setPeriodicWave(pulse25); else osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + (o.slide || dur));
    if (o.vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 6; lg.gain.value = o.vib; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + dur + 0.05); }
    const v = o.vol == null ? 0.3 : o.vol, a = o.a || 0.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + a);
    if (o.sustain) g.gain.setValueAtTime(v, t + dur * o.sustain);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = osc;
    if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; osc.connect(f); node = f; }
    node.connect(g); g.connect(bus);
    osc.start(t); osc.stop(t + dur + 0.02);
  }
  function noise(o) {
    if (!ctx) return;
    const t = o.t != null ? o.t : ctx.currentTime, dur = o.dur || 0.1, bus = o.bus || sfxBus;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = o.ft || 'bandpass'; f.frequency.setValueAtTime(o.f || 2000, t); f.Q.value = o.q || 1;
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const g = ctx.createGain(), v = o.vol == null ? 0.3 : o.vol;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + (o.a || 0.003)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(bus);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }
  const arp = (notes, step, o = {}) => { const t0 = ctx.currentTime; notes.forEach((m, i) => tone({ f: mtof(m), t: t0 + i * step, dur: o.dur || step * 1.6, type: o.type || 'pulse', vol: o.vol || 0.18 })); };

  // ---------------------------------------------------------------- sound effects
  const FX = {
    click: () => tone({ f: 900, to: 1300, dur: 0.05, type: 'square', vol: 0.12 }),
    select: () => arp([72, 79, 84], 0.05, { vol: 0.16 }),
    step: () => noise({ f: 500, ft: 'lowpass', dur: 0.05, vol: 0.12 }),
    slash: () => { noise({ f: 1200, to: 6000, dur: 0.14, q: 0.8, vol: 0.32 }); tone({ f: 900, to: 300, dur: 0.1, type: 'sawtooth', vol: 0.05 }); },
    crit: () => { noise({ f: 3000, to: 8000, dur: 0.18, vol: 0.35 }); tone({ f: 1400, to: 2400, dur: 0.12, type: 'square', vol: 0.12 }); tone({ f: 180, to: 60, dur: 0.18, type: 'sine', vol: 0.5 }); },
    hit: () => { tone({ f: 220, to: 70, dur: 0.1, type: 'square', vol: 0.14, lp: 1200 }); noise({ f: 900, dur: 0.06, vol: 0.18 }); },
    hurt: () => { tone({ f: 160, to: 55, dur: 0.18, type: 'sawtooth', vol: 0.18, lp: 900 }); noise({ f: 400, ft: 'lowpass', dur: 0.12, vol: 0.3 }); },
    block: () => { tone({ f: 1800, dur: 0.18, type: 'triangle', vol: 0.18 }); tone({ f: 2700, dur: 0.12, type: 'sine', vol: 0.08 }); },
    miss: () => noise({ f: 800, to: 3000, dur: 0.16, q: 2, vol: 0.18 }),
    throw: () => noise({ f: 4000, to: 1500, dur: 0.12, q: 3, vol: 0.16 }),
    zap: () => { noise({ f: 5000, ft: 'highpass', dur: 0.3, vol: 0.3 }); tone({ f: 1200, to: 80, dur: 0.3, type: 'sawtooth', vol: 0.12 }); },
    storm: () => { noise({ f: 200, ft: 'lowpass', dur: 0.8, vol: 0.5, a: 0.02 }); noise({ f: 5000, ft: 'highpass', dur: 0.35, vol: 0.25 }); },
    fire: () => { noise({ f: 600, to: 200, ft: 'lowpass', dur: 0.35, vol: 0.4 }); tone({ f: 120, to: 50, dur: 0.3, type: 'sine', vol: 0.3 }); },
    boom: () => { noise({ f: 900, to: 60, ft: 'lowpass', dur: 0.9, vol: 0.7 }); tone({ f: 90, to: 30, dur: 0.7, type: 'sine', vol: 0.6 }); },
    pew: () => tone({ f: 1500, to: 500, dur: 0.1, type: 'square', vol: 0.08 }),
    poof: () => { noise({ f: 1500, to: 300, dur: 0.25, vol: 0.25 }); tone({ f: 600, to: 200, dur: 0.2, type: 'triangle', vol: 0.12 }); },
    heal: () => arp([76, 81, 88], 0.045, { type: 'sine', vol: 0.12 }),
    shield: () => { tone({ f: 500, to: 1000, dur: 0.3, type: 'triangle', vol: 0.15, vib: 20 }); },
    coin: () => { const t = ctx.currentTime; tone({ f: mtof(83), t, dur: 0.07, type: 'square', vol: 0.1 }); tone({ f: mtof(88), t: t + 0.07, dur: 0.22, type: 'square', vol: 0.1 }); },
    levelup: () => arp([67, 71, 74, 79, 83, 86, 91], 0.06, { vol: 0.16 }),
    chest: () => { noise({ f: 300, ft: 'lowpass', dur: 0.1, vol: 0.3 }); setTimeout(() => ctx && arp([72, 76, 79, 84, 88], 0.05, { vol: 0.14 }), 120); },
    angel: () => { const t = ctx.currentTime; [72, 76, 79, 84].forEach((m, i) => tone({ f: mtof(m), t: t + i * 0.09, dur: 1.2, type: 'sine', vol: 0.1, a: 0.08, vib: 3 })); },
    devil: () => { const t = ctx.currentTime; [48, 51, 54, 57].forEach((m, i) => tone({ f: mtof(m), t: t + i * 0.12, dur: 0.5, type: 'sawtooth', vol: 0.08, lp: 900 })); },
    alarm: () => { const t = ctx.currentTime; for (let i = 0; i < 3; i++) { tone({ f: 440, t: t + i * 0.22, dur: 0.18, type: 'square', vol: 0.12, lp: 2000 }); tone({ f: 466, t: t + i * 0.22, dur: 0.18, type: 'square', vol: 0.12, lp: 2000 }); } },
    tick: () => tone({ f: 2200, dur: 0.025, type: 'square', vol: 0.08 }),
    ding: () => arp([84, 88, 91, 96], 0.07, { type: 'triangle', vol: 0.16 }),
    wobble: () => { tone({ f: 300, to: 420, dur: 0.12, type: 'triangle', vol: 0.12 }); },
    crack: () => { noise({ f: 2500, dur: 0.08, q: 4, vol: 0.4 }); noise({ f: 1500, dur: 0.12, q: 3, vol: 0.3, t: ctx.currentTime + 0.06 }); },
    reveal: () => { arp([60, 64, 67, 72, 76, 79, 84], 0.05, { vol: 0.14 }); setTimeout(() => ctx && arp([84, 88, 91], 0.12, { dur: 0.6, type: 'triangle', vol: 0.14 }), 400); },
    victory: () => { const t = ctx.currentTime, seq = [[67, 0], [67, 0.12], [67, 0.24], [72, 0.36], [76, 0.72], [74, 0.96], [76, 1.08], [79, 1.2]]; seq.forEach(([m, d], i) => tone({ f: mtof(m), t: t + d, dur: i === seq.length - 1 ? 1 : 0.2, type: 'pulse', vol: 0.18 })); seq.forEach(([m, d]) => tone({ f: mtof(m - 24), t: t + d, dur: 0.2, type: 'triangle', vol: 0.2 })); },
    defeat: () => { const t = ctx.currentTime; [[67, 0], [66, 0.3], [65, 0.6], [64, 0.9]].forEach(([m, d], i) => tone({ f: mtof(m), t: t + d, dur: i === 3 ? 1.2 : 0.3, type: 'pulse', vol: 0.16, vib: i === 3 ? 8 : 0 })); },
    revive: () => arp([60, 67, 72, 79, 84, 91], 0.07, { type: 'triangle', vol: 0.18 }),
    buy: () => arp([79, 84], 0.08, { type: 'square', vol: 0.12 }),
    equip: () => { noise({ f: 5000, ft: 'highpass', dur: 0.05, vol: 0.3 }); tone({ f: 1800, to: 900, dur: 0.12, type: 'triangle', vol: 0.14 }); tone({ f: 2400, dur: 0.2, type: 'sine', vol: 0.06, t: ctx.currentTime + 0.04 }); },
    upgrade: () => { const t = ctx.currentTime; [0, 0.06, 0.12].forEach((d, i) => tone({ f: mtof(72 + i * 4), t: t + d, dur: 0.14, type: 'square', vol: 0.1 })); noise({ f: 3500, ft: 'highpass', dur: 0.1, vol: 0.2, t: t + 0.18 }); tone({ f: mtof(88), t: t + 0.18, dur: 0.3, type: 'triangle', vol: 0.14 }); },
    error: () => tone({ f: 200, dur: 0.18, type: 'square', vol: 0.12, lp: 800 }),
  };
  function play(name) {
    if (!ctx || !sfxOn || !FX[name]) return;
    const now = performance.now();
    if (last[name] && now - last[name] < 45 * Math.min(speedMul, 4)) return; // throttle bursts; wider at high game speed
    last[name] = now;
    try { FX[name](); } catch (e) { console.warn('sfx', name, e); }
  }

  // ---------------------------------------------------------------- music
  // Each bar: chord [rootMidi, 'M'|'m'] and an 8-step (eighth-note) melody, 0 = rest.
  const TRACKS = {
    home: { bpm: 100, drums: 'soft', lead: 'triangle', bars: [
      [[48, 'M'], [72, 0, 76, 0, 79, 0, 76, 74]], [[45, 'm'], [72, 0, 69, 0, 72, 74, 76, 0]],
      [[41, 'M'], [77, 0, 76, 74, 72, 0, 69, 0]], [[43, 'M'], [71, 72, 74, 0, 79, 0, 0, 0]],
      [[48, 'M'], [76, 0, 79, 0, 84, 0, 79, 76]], [[45, 'm'], [81, 0, 79, 76, 72, 0, 76, 0]],
      [[41, 'M'], [77, 76, 74, 72, 69, 72, 74, 0]], [[43, 'M'], [71, 0, 74, 0, 72, 0, 0, 0]]] },
    adventure: { bpm: 128, drums: 'full', lead: 'pulse', bars: [
      [[43, 'M'], [67, 71, 74, 79, 78, 74, 71, 74]], [[40, 'm'], [76, 0, 74, 71, 67, 0, 71, 0]],
      [[36, 'M'], [72, 76, 79, 76, 74, 72, 71, 72]], [[38, 'M'], [74, 0, 0, 78, 81, 0, 78, 0]],
      [[43, 'M'], [79, 0, 78, 79, 81, 79, 78, 74]], [[40, 'm'], [76, 0, 71, 0, 76, 78, 79, 0]],
      [[36, 'M'], [81, 79, 76, 72, 74, 76, 72, 0]], [[38, 'M'], [74, 0, 78, 0, 79, 0, 0, 0]]] },
    boss: { bpm: 152, drums: 'heavy', lead: 'square', bars: [
      [[45, 'm'], [69, 72, 76, 69, 72, 76, 77, 76]], [[41, 'M'], [77, 0, 76, 0, 72, 0, 69, 0]],
      [[43, 'M'], [67, 71, 74, 67, 71, 74, 76, 74]], [[40, 'M'], [76, 0, 80, 0, 83, 0, 80, 0]],
      [[45, 'm'], [81, 0, 79, 77, 76, 0, 72, 0]], [[41, 'M'], [77, 76, 77, 79, 81, 0, 77, 0]],
      [[43, 'M'], [79, 0, 74, 0, 71, 0, 74, 0]], [[40, 'M'], [76, 75, 76, 80, 83, 0, 0, 0]]] },
  };
  let cur = null, pendingTrack = null, timer = null, step = 0, nextT = 0;

  function scheduleStep(tr, s, t) {
    const bar = tr.bars[Math.floor(s / 16) % tr.bars.length], i16 = s % 16, i8 = i16 >> 1, sixteenth = 60 / tr.bpm / 4;
    const [root, q] = bar[0], third = q === 'm' ? 3 : 4, chord = [root + 12, root + 12 + third, root + 19];
    const B = musicBus;
    // melody (eighth notes)
    if (i16 % 2 === 0) {
      const m = bar[1][i8];
      if (m) {
        let len = 1; while (i8 + len < 8 && !bar[1][i8 + len] && len < 3) len++;
        tone({ f: mtof(m), t, dur: sixteenth * 2 * len * 0.95, type: tr.lead, vol: tr.lead === 'triangle' ? 0.32 : 0.16, bus: B, sustain: 0.6, lp: 3500, vib: len > 1 ? 4 : 0 });
      }
      // bass
      const pat = tr.drums === 'heavy' ? [0, 12, 0, 12, 0, 12, 0, 12] : [0, null, 12, null, 0, 7, 12, 7];
      const b = pat[i8];
      if (b != null) tone({ f: mtof(root + b), t, dur: sixteenth * 1.8, type: 'triangle', vol: 0.42, bus: B });
    }
    // arpeggio pad (sixteenths, soft)
    if (tr.drums !== 'soft' || i16 % 2 === 0) tone({ f: mtof(chord[i16 % 3] + 12), t, dur: sixteenth * 0.9, type: 'pulse', vol: 0.035, bus: B, lp: 2500 });
    // drums
    const kick = tr.drums === 'soft' ? i16 === 0 || i16 === 8 : tr.drums === 'heavy' ? i16 % 4 === 0 : i16 === 0 || i16 === 6 || i16 === 8;
    const snare = tr.drums !== 'soft' && (i16 === 4 || i16 === 12);
    const hat = tr.drums === 'soft' ? i16 % 4 === 2 : i16 % 2 === 0;
    if (kick) tone({ f: 150, to: 45, slide: 0.12, dur: 0.16, type: 'sine', vol: 0.5, bus: B });
    if (snare) noise({ t, f: 1800, dur: 0.12, q: 0.7, vol: 0.22, bus: B });
    if (hat) noise({ t, f: 8000, ft: 'highpass', dur: 0.03, vol: tr.drums === 'soft' ? 0.05 : 0.07, bus: B });
  }
  function music(name) {
    if (!ctx) { pendingTrack = name; return; }
    if (cur === name) return;
    cur = name;
    clearInterval(timer);
    if (!name || !TRACKS[name]) return;
    const tr = TRACKS[name];
    step = 0; nextT = ctx.currentTime + 0.08;
    timer = setInterval(() => {
      if (!ctx || ctx.state !== 'running') return;
      const sixteenth = 60 / tr.bpm / 4;
      // after a stall, skip the missed steps instead of firing them all at once
      if (nextT < ctx.currentTime) { const miss = Math.ceil((ctx.currentTime - nextT) / sixteenth); step += miss; nextT += miss * sixteenth; }
      while (nextT < ctx.currentTime + 0.15) {
        if (musicOn) scheduleWithTime(tr, step, nextT);
        nextT += sixteenth; step++;
      }
    }, 30);
  }
  function scheduleWithTime(tr, s, t) {
    // route every primitive in this step to time t
    const origTone = tone, origNoise = noise;
    tone = o => origTone(Object.assign({ t }, o));
    noise = o => origNoise(Object.assign({ t }, o));
    try { scheduleStep(tr, s, t); } finally { tone = origTone; noise = origNoise; }
  }

  function setMusic(on) { musicOn = on; if (musicBus) musicBus.gain.setTargetAtTime(on ? 0.16 : 0, ctx.currentTime, 0.05); }
  function setSfx(on) { sfxOn = on; if (sfxBus) sfxBus.gain.setTargetAtTime(on ? 0.5 : 0, ctx.currentTime, 0.02); }

  window.SFX = { init, play, music, setMusic, setSfx, setSpeed: v => { speedMul = v || 1; }, get ready() { return !!ctx; } };
})();

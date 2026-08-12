/* ============================================================
   Ambient liquid field — raw WebGL full-screen fragment shader.
   A calm, ultra-smooth dark color field: layered low-frequency
   noise blobs in the theme's two hues over deep obsidian.
   Slow breathing, soft mouse-follow gradient displacement,
   click ripples, per-card hover light warp. No lines, no
   particles — pure liquid light.
   ============================================================ */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform vec2  uMouse;      // lerped pointer, uv
uniform float uMouseAmp;   // presence 0..1 (decays when idle)
uniform vec3  uColA;       // theme hue 1
uniform vec3  uColB;       // theme hue 2
uniform vec4  uRipples[4]; // xy: uv origin, z: start time, w: hue mix
uniform vec2  uBoost;      // hovered card center, uv
uniform float uBoostAmp;   // 0..1

vec2 hash22(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}
float noise(in vec2 p) {
  const float K1 = 0.366025404;
  const float K2 = 0.211324865;
  vec2 i = floor(p + (p.x + p.y) * K1);
  vec2 a = p - i + (i.x + i.y) * K2;
  vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec2 b = a - o + K2;
  vec2 c = a - 1.0 + 2.0 * K2;
  vec3 h = max(0.5 - vec3(dot(a,a), dot(b,b), dot(c,c)), 0.0);
  vec3 n = h*h*h*h * vec3(dot(a, hash22(i)), dot(b, hash22(i+o)), dot(c, hash22(i+1.0)));
  return dot(n, vec3(70.0));
}
float fbm(vec2 p) {
  float f = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {
    f += a * noise(p);
    p = p * 2.02 + vec2(3.1, 7.7);
    a *= 0.5;
  }
  return f * 0.5 + 0.5;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 st = vec2(uv.x * aspect, uv.y);

  /* ---- soft mouse-follow displacement (soothing, not warping) ---- */
  vec2 m = vec2(uMouse.x * aspect, uMouse.y);
  float md = length(st - m);
  float follow = uMouseAmp * exp(-md * 2.6);
  vec2 drift = (st - m) * follow * 0.22;

  /* ---- slow breathing clock ---- */
  float breath = 0.5 + 0.5 * sin(uTime * 0.16);
  float t = uTime * 0.022;

  /* ---- layered liquid field ---- */
  vec2 p1 = st * 1.15 + vec2(t, -t * 0.6) + drift;
  vec2 p2 = st * 0.75 - vec2(t * 0.7, t * 0.4) - drift * 0.6;
  float f1 = fbm(p1 + 0.35 * fbm(p1 * 1.4 + t));
  float f2 = fbm(p2 + 0.30 * fbm(p2 * 1.6 - t));

  /* hue mixing across the field */
  float mixAB = smoothstep(0.25, 0.8, f2);
  vec3 hue = mix(uColA, uColB, mixAB);

  /* luminance: calm blobs, brighter at blob centers */
  float lum = smoothstep(0.42, 0.85, f1) * (0.35 + 0.3 * breath);

  /* ---- card hover: gentle light well beneath the active card ---- */
  float bd = length(st - vec2(uBoost.x * aspect, uBoost.y));
  lum += uBoostAmp * exp(-bd * 2.4) * 0.22;

  /* ---- click ripples: one soft expanding luminance ring ---- */
  float rippleGlow = 0.0;
  vec3 rippleTint = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    float t0 = uRipples[i].z;
    if (t0 < 0.0) continue;
    float age = uTime - t0;
    if (age <= 0.0 || age > 3.0) continue;
    vec2 c = vec2(uRipples[i].x * aspect, uRipples[i].y);
    float d = length(st - c);
    float ring = exp(-pow((d - age * 0.34) * 9.0, 2.0));
    float decay = exp(-age * 1.5);
    float g = ring * decay * 0.5;
    rippleGlow += g;
    rippleTint += g * mix(uColA, uColB, uRipples[i].w);
  }

  /* ---- compose over deep obsidian ---- */
  vec3 base = mix(vec3(0.031, 0.035, 0.047), vec3(0.043, 0.051, 0.067), uv.y);
  vec3 col = base;
  col += hue * lum * 0.55;
  col += hue * follow * 0.10;                    // soft presence near cursor
  col += rippleTint * 0.9;

  /* gentle center lift / edge falloff */
  float vig = smoothstep(1.3, 0.3, length(uv - 0.5));
  col *= 0.78 + 0.22 * vig;

  gl_FragColor = vec4(col, 1.0);
}
`;

const MAX_RIPPLES = 4;

/** theme hue pairs in linear 0..1 — mirrors the CSS variables */
const THEMES = {
  emerald:  { a: [0.0, 1.0, 0.4],   b: [0.0, 0.898, 1.0] },
  london:   { a: [0.306, 0.659, 1.0], b: [0.0, 0.898, 1.0] },
  void:     { a: [0.627, 0.42, 1.0],  b: [1.0, 0.42, 0.835] },
  graphite: { a: [0.788, 0.824, 0.863], b: [0.541, 0.592, 0.651] },
};

export function createAmbientField(canvas) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false })
          || canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) return null;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[ambient] shader compile:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('[ambient] program link:', gl.getProgramInfoLog(prog));
    return null;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const U = {
    res: gl.getUniformLocation(prog, 'uRes'),
    time: gl.getUniformLocation(prog, 'uTime'),
    mouse: gl.getUniformLocation(prog, 'uMouse'),
    mouseAmp: gl.getUniformLocation(prog, 'uMouseAmp'),
    colA: gl.getUniformLocation(prog, 'uColA'),
    colB: gl.getUniformLocation(prog, 'uColB'),
    ripples: gl.getUniformLocation(prog, 'uRipples'),
    boost: gl.getUniformLocation(prog, 'uBoost'),
    boostAmp: gl.getUniformLocation(prog, 'uBoostAmp'),
  };

  const state = {
    mouse: { x: 0.5, y: 0.5 },
    target: { x: 0.5, y: 0.5 },
    amp: 0,
    ripples: new Float32Array(MAX_RIPPLES * 4).fill(-1),
    rippleIdx: 0,
    boost: { x: 0.5, y: 0.5 },
    boostAmp: 0,
    boostTarget: 0,
    colA: THEMES.graphite.a.slice(),
    colB: THEMES.graphite.b.slice(),
    colATarget: THEMES.graphite.a.slice(),
    colBTarget: THEMES.graphite.b.slice(),
  };
  for (let i = 0; i < MAX_RIPPLES; i++) state.ripples[i * 4 + 2] = -1;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  let lost = false;
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; });
  canvas.addEventListener('webglcontextrestored', () => { lost = false; resize(); });

  const t0 = performance.now();

  return {
    pointer(x, y, moving) {
      state.target.x = x;
      state.target.y = 1 - y;
      if (moving) state.amp = Math.min(state.amp + 0.06, 1);
    },
    ripple(x, y, hueMix) {
      const i = state.rippleIdx % MAX_RIPPLES;
      state.ripples[i * 4] = x;
      state.ripples[i * 4 + 1] = 1 - y;
      state.ripples[i * 4 + 2] = (performance.now() - t0) / 1000;
      state.ripples[i * 4 + 3] = hueMix;
      state.rippleIdx++;
    },
    setBoost(x, y, amp) {
      state.boost.x = x;
      state.boost.y = 1 - y;
      state.boostTarget = amp;
    },
    /** switch theme — colors lerp smoothly in the shader */
    setTheme(name) {
      const t = THEMES[name];
      if (!t) return;
      state.colATarget = t.a.slice();
      state.colBTarget = t.b.slice();
    },
    frame() {
      if (lost) return;
      const t = (performance.now() - t0) / 1000;

      state.mouse.x += (state.target.x - state.mouse.x) * 0.06;
      state.mouse.y += (state.target.y - state.mouse.y) * 0.06;
      state.amp *= 0.988;
      state.boostAmp += (state.boostTarget - state.boostAmp) * 0.07;
      for (let c = 0; c < 3; c++) {
        state.colA[c] += (state.colATarget[c] - state.colA[c]) * 0.04;
        state.colB[c] += (state.colBTarget[c] - state.colB[c]) * 0.04;
      }

      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.uniform1f(U.time, t);
      gl.uniform2f(U.mouse, state.mouse.x, state.mouse.y);
      gl.uniform1f(U.mouseAmp, state.amp);
      gl.uniform3fv(U.colA, state.colA);
      gl.uniform3fv(U.colB, state.colB);
      gl.uniform4fv(U.ripples, state.ripples);
      gl.uniform2f(U.boost, state.boost.x, state.boost.y);
      gl.uniform1f(U.boostAmp, state.boostAmp);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    resize,
  };
}

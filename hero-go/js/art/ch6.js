/* Hero Go! — Chapter 6 art: "Sunken Ruins" (+ Ember Core boss).
 * Adds to window.ENEMIES / window.SCENES (does not replace them).
 * Enemies: viewBox 0 0 200 200, face LEFT, feet y~190.
 * Scene: viewBox 0 0 400 300, preserveAspectRatio xMidYMax slice.
 */
(function () {
  'use strict';
  var O = '#2b1d14';
  window.ENEMIES = window.ENEMIES || {};
  window.SCENES = window.SCENES || {};

  /* ------------------------------------------------------------ helpers */
  function S(w) { return 'stroke="' + O + '" stroke-width="' + (w || 4) + '" stroke-linejoin="round" stroke-linecap="round"'; }
  function f(n) { return Math.round(n * 10) / 10; }
  function stops(a) { return a.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join(''); }
  function lg(id, a, x1, y1, x2, y2) {
    return '<linearGradient id="' + id + '" x1="' + (x1 == null ? 0 : x1) + '" y1="' + (y1 == null ? 0 : y1) + '" x2="' + (x2 == null ? 0 : x2) + '" y2="' + (y2 == null ? 1 : y2) + '">' + stops(a) + '</linearGradient>';
  }
  function rg(id, a, cx, cy, r) {
    return '<radialGradient id="' + id + '" cx="' + (cx == null ? 0.5 : cx) + '" cy="' + (cy == null ? 0.5 : cy) + '" r="' + (r == null ? 0.6 : r) + '">' + stops(a) + '</radialGradient>';
  }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function shadow(rx, cx, op) {
    cx = cx == null ? 100 : cx;
    return '<g class="part-shadow"><ellipse cx="' + cx + '" cy="190" rx="' + rx + '" ry="' + f(4 + rx * 0.1) + '" fill="#000" opacity="' + (op == null ? 0.25 : op) + '"/></g>';
  }
  function wrap(defs, sh, body) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs>' + defs + '</defs>' + sh + '<g class="part-body">' + body + '</g></svg>';
  }
  function poly(p) { return 'M' + p.map(function (q) { return f(q[0]) + ' ' + f(q[1]); }).join('L') + 'Z'; }
  function ell(x, y, rx, ry, fill, extra) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '" ' + (extra || '') + '/>'; }
  function circ(x, y, r, fill, extra) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '" ' + (extra || '') + '/>'; }
  // glossy highlight blob
  function hl(x, y, rx, ry, rot, op) {
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="#fff" opacity="' + (op == null ? 0.5 : op) + '" transform="rotate(' + (rot || 0) + ' ' + x + ' ' + y + ')"/>';
  }
  // cute glossy eye
  function eye(x, y, rx, ry, col) {
    var s = ell(x, y, rx, ry, O);
    if (col) s += ell(x - rx * 0.15, y + ry * 0.25, rx * 0.62, ry * 0.5, col);
    s += ell(x - rx * 0.32, y - ry * 0.36, rx * 0.42, ry * 0.32, '#fff');
    s += circ(x + rx * 0.35, y + ry * 0.4, rx * 0.18, '#fff', 'opacity=".85"');
    return s;
  }
  function bez(P, t) {
    var m = 1 - t;
    var a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, d = t * t * t;
    var dx = 3 * m * m * (P[1][0] - P[0][0]) + 6 * m * t * (P[2][0] - P[1][0]) + 3 * t * t * (P[3][0] - P[2][0]);
    var dy = 3 * m * m * (P[1][1] - P[0][1]) + 6 * m * t * (P[2][1] - P[1][1]) + 3 * t * t * (P[3][1] - P[2][1]);
    var l = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0], y: a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1], nx: -dy / l, ny: dx / l };
  }
  // tapered tentacle along a cubic bezier. o: fill, sh, hi, suck, ring, n(suckers), side, sw, scales
  function tent(P, w0, w1, o) {
    var N = 20, L = [], R = [], I = [], i, t, c, w, s = '';
    var side = o.side == null ? 1 : o.side;
    for (i = 0; i <= N; i++) {
      t = i / N; c = bez(P, t); w = (w0 + (w1 - w0) * t) / 2;
      L.push([c.x + c.nx * w, c.y + c.ny * w]);
      R.push([c.x - c.nx * w, c.y - c.ny * w]);
      I.push([c.x - c.nx * w * 0.15 * side, c.y - c.ny * w * 0.15 * side]);
    }
    var outline = poly(L.concat(R.slice().reverse()));
    s += '<path d="' + outline + '" fill="' + o.fill + '" ' + S(o.sw || 4) + '/>';
    // shade band on one side
    var E = side > 0 ? R : L;
    var sh = E.concat(I.slice().reverse());
    s += '<path d="' + poly(sh) + '" fill="' + o.sh + '"/>';
    // highlight line on opposite side
    var hp = '';
    for (i = 2; i <= N - 4; i++) {
      t = i / N; c = bez(P, t); w = (w0 + (w1 - w0) * t) / 2;
      hp += (i === 2 ? 'M' : 'L') + f(c.x + c.nx * w * 0.55 * side) + ' ' + f(c.y + c.ny * w * 0.55 * side);
    }
    s += '<path d="' + hp + '" stroke="' + o.hi + '" stroke-width="' + f(Math.max(1.6, w0 * 0.1)) + '" fill="none" stroke-linecap="round" opacity=".6"/>';
    // suckers / scales
    var n = o.n == null ? 8 : o.n;
    for (i = 0; i < n; i++) {
      t = 0.1 + 0.8 * (i + 0.5) / n; c = bez(P, t); w = (w0 + (w1 - w0) * t) / 2;
      if (o.scales) {
        var r = w * 0.34;
        s += '<path d="M' + f(c.x - r) + ' ' + f(c.y - r * 0.4) + 'Q' + f(c.x) + ' ' + f(c.y + r * 1.4) + ' ' + f(c.x + r) + ' ' + f(c.y - r * 0.4) + '" stroke="' + o.hi + '" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".75"/>';
        continue;
      }
      var rr = Math.max(1.3, w * 0.3);
      if (w < 3) continue;
      var px = c.x - c.nx * w * 0.42 * side, py = c.y - c.ny * w * 0.42 * side;
      s += circ(f(px), f(py), f(rr), o.suck, 'stroke="' + O + '" stroke-width="1.3"');
      s += circ(f(px), f(py), f(rr * 0.4), o.ring || o.sh, 'opacity=".8"');
    }
    return s;
  }
  function flame(x, y, w, h, c1, c2) {
    return '<path d="M' + (x - w) + ' ' + y + ' Q' + f(x - w * 1.3) + ' ' + f(y - h * 0.45) + ' ' + f(x - w * 0.2) + ' ' + f(y - h * 0.62) + ' Q' + f(x - w * 0.1) + ' ' + f(y - h * 0.85) + ' ' + x + ' ' + (y - h) + ' Q' + f(x + w * 0.5) + ' ' + f(y - h * 0.6) + ' ' + f(x + w * 0.9) + ' ' + f(y - h * 0.5) + ' Q' + f(x + w * 1.2) + ' ' + f(y - h * 0.2) + ' ' + (x + w) + ' ' + y + ' Z" fill="' + c1 + '" ' + S(2.5) + '/>' +
      '<path d="M' + f(x - w * 0.5) + ' ' + y + ' Q' + f(x - w * 0.7) + ' ' + f(y - h * 0.3) + ' ' + x + ' ' + f(y - h * 0.62) + ' Q' + f(x + w * 0.7) + ' ' + f(y - h * 0.3) + ' ' + f(x + w * 0.5) + ' ' + y + ' Z" fill="' + c2 + '"/>';
  }
  function barn(x, y, r) {
    return circ(x, y, r, '#e4dcc8', S(1.6)) + circ(x, y, f(r * 0.55), '#5a4636') + ell(x - r * 0.25, y - r * 0.3, r * 0.3, r * 0.2, '#fff', 'opacity=".7"');
  }
  // arc of points for singing rings
  function arcPath(cx, cy, r, a0, a1) {
    var d = '', k, n = 8;
    for (k = 0; k <= n; k++) {
      var a = (a0 + (a1 - a0) * k / n) * Math.PI / 180;
      d += (k ? 'L' : 'M') + f(cx + r * Math.cos(a)) + ' ' + f(cy + r * Math.sin(a));
    }
    return d;
  }
  var E = window.ENEMIES;

  /* ================================================================ CRAB */
  E.crab = {
    name: 'Reef Crab',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'crab-' + n + '-' + uid; };
      var defs = rg(I('shell'), [[0, '#ffb08a'], [0.55, '#ea5a3c'], [1, '#a02a2a']], 0.38, 0.3, 0.85) +
        lg(I('claw'), [[0, '#ff9a6a'], [1, '#c8362e']], 0, 0, 1, 1) +
        lg(I('coral'), [[0, '#ffc6e8'], [1, '#e2609c']]);
      function leg(pts, dark) {
        var d = 'M' + pts.map(function (p) { return p[0] + ' ' + p[1]; }).join('L');
        return '<path d="' + d + '" stroke="' + O + '" stroke-width="10" fill="none" stroke-linejoin="round" stroke-linecap="round"/>' +
          '<path d="' + d + '" stroke="' + (dark ? '#a02a2a' : '#e2523a') + '" stroke-width="5.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>' +
          '<path d="' + d + '" stroke="#fff" stroke-width="1.5" fill="none" opacity=".25" stroke-linecap="round" transform="translate(-1.4 -1.4)"/>' +
          circ(pts[1][0], pts[1][1], 3.6, dark ? '#c8362e' : '#ff8a5a', S(2)) +
          '<path d="M' + (pts[2][0] - 3) + ' ' + (pts[2][1] - 3) + 'L' + pts[2][0] + ' ' + (pts[2][1] + 4) + 'L' + (pts[2][0] + 3) + ' ' + (pts[2][1] - 3) + 'Z" fill="#ffe6b8" ' + S(2) + '/>';
      }
      function claw(dark) {
        var c1 = dark ? '#b8302a' : 'url(#' + I('claw') + ')';
        return '<path d="M-17 -16Q-26 -42 -6 -56Q-10 -38 -5 -24Z" fill="' + c1 + '" ' + S(3.5) + '/>' +
          '<path d="M17 -16Q28 -40 8 -54Q11 -36 6 -24Z" fill="' + c1 + '" ' + S(3.5) + '/>' +
          '<path d="M-7 -30l5 3l-5 4M7 -30l-5 3l5 4M-8 -40l5 3l-4 4M8 -40l-5 3l4 4" fill="#fff4dc" stroke="' + O + '" stroke-width="1.4" stroke-linejoin="round"/>' +
          ell(0, -12, 20, 17, c1, S(3.5)) +
          '<path d="M-14 -6Q0 4 14 -6Q10 8 0 8Q-10 8 -14 -6Z" fill="#000" opacity=".16"/>' +
          '<path d="M-10 -20Q-2 -26 8 -20M-12 -12Q0 -18 12 -12" stroke="#7a1a1a" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>' +
          hl(-8, -18, 6, 3, -30, 0.55) +
          circ(11, -8, 2.2, '#ffe6b8', S(1.2)) + circ(-12, -4, 1.8, '#ffe6b8', S(1.2));
      }
      var body =
        // far claw & arm (dark, behind)
        '<path d="M130 132L158 112L166 96" stroke="' + O + '" stroke-width="13" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M130 132L158 112L166 96" stroke="#b8302a" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<g transform="translate(168 90) rotate(14) scale(.72)">' + claw(true) + '</g>' +
        // legs
        leg([[134, 150], [166, 146], [176, 188]], true) + leg([[128, 160], [156, 168], [160, 190]], true) +
        leg([[70, 154], [44, 152], [36, 188]], false) + leg([[80, 162], [62, 174], [62, 190]], false) +
        // carapace
        '<path d="M42 152C34 112 68 90 102 90C138 90 164 112 158 152C152 176 58 180 42 152Z" fill="url(#' + I('shell') + ')" ' + S(4.5) + '/>' +
        '<clipPath id="' + I('clip') + '"><path d="M42 152C34 112 68 90 102 90C138 90 164 112 158 152C152 176 58 180 42 152Z"/></clipPath>' +
        '<g clip-path="url(#' + I('clip') + ')">' +
        '<path d="M110 84C150 100 170 140 150 190L60 190C120 170 130 120 110 84Z" fill="#a02a2a" opacity=".45"/>' +
        '<path d="M34 152Q100 140 166 152L166 190L34 190Z" fill="#7a1a24" opacity=".35"/>' +
        '<path d="M56 130Q100 112 146 128M54 142Q100 126 150 142M60 154Q100 140 146 156" stroke="#7a1a24" stroke-width="2.4" fill="none" opacity=".5"/>' +
        '<path d="M100 92L98 176M76 100L66 170M126 100L134 170" stroke="#7a1a24" stroke-width="2" fill="none" opacity=".35"/>' +
        '</g>' +
        '<path d="M52 122Q72 100 96 98" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".5"/>' +
        // rim spikes
        '<path d="M50 138l-8 -6l10 -2zM64 166l-6 8l10 -2zM150 130l10 -3l-6 8zM152 158l9 5l-11 2z" fill="#ffe6b8" ' + S(2.5) + '/>' +
        // barnacles
        barn(74, 146, 5) + barn(82, 152, 3.4) + barn(138, 150, 5.2) + barn(130, 158, 3.2) + barn(112, 166, 3.6) +
        // coral garden on the shell
        '<path d="M112 100L106 84L98 74M106 84L114 72M124 104L134 88L130 74M134 88L144 84M118 98L122 80" stroke="' + O + '" stroke-width="9" fill="none" stroke-linecap="round"/>' +
        '<path d="M112 100L106 84L98 74M106 84L114 72M124 104L134 88L130 74M134 88L144 84M118 98L122 80" stroke="url(#' + I('coral') + ')" stroke-width="5" fill="none" stroke-linecap="round"/>' +
        circ(98, 73, 4, '#ffd0ec', S(2)) + circ(114, 71, 3.6, '#ffd0ec', S(2)) + circ(130, 73, 4, '#ffd0ec', S(2)) + circ(144, 84, 3.4, '#ffd0ec', S(2)) + circ(122, 79, 3.4, '#ffd0ec', S(2)) +
        '<path d="M146 108q10 -8 16 2q-2 8 -10 8z" fill="#7a5ad0" ' + S(2.5) + '/><path d="M150 108q6 -4 9 2M150 112q6 -2 8 2" stroke="#c8b0ff" stroke-width="1.6" fill="none"/>' +
        // front arm + claw
        '<path d="M68 130L38 122L34 92" stroke="' + O + '" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M68 130L38 122L34 92" stroke="url(#' + I('claw') + ')" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
        circ(38, 122, 6, '#ff9a6a', S(3)) +
        '<g transform="translate(32 96) rotate(-8) scale(1.04)">' + claw(false) + '</g>' +
        // face: mouth
        '<path d="M52 158Q60 152 68 158L64 164L58 160L54 165Z" fill="#3a1414" ' + S(2) + '/>' +
        // eye stalks
        '<path d="M70 100L66 84M88 96L92 78" stroke="' + O + '" stroke-width="10" stroke-linecap="round"/><path d="M70 100L66 84M88 96L92 78" stroke="#ea5a3c" stroke-width="5.5" stroke-linecap="round"/>' +
        '<g class="part-eyes" style="transform-origin: 79px 78px">' +
        circ(65, 79, 10, '#fff8e8', S(3.2)) + circ(93, 74, 10, '#fff8e8', S(3.2)) +
        eye(62, 81, 5, 6, '#7a1a1a') + eye(90, 76, 5, 6, '#7a1a1a') +
        '<path d="M54 74L74 80L72 70Q60 66 54 74ZM102 68L84 74L86 64Q96 60 102 68Z" fill="#c8362e" ' + S(2.6) + '/>' +
        '</g>';
      return wrap(defs, shadow(74, 100), body);
    }
  };

  /* ============================================================ JELLYFISH */
  E.jellyfish = {
    name: 'Storm Jelly',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'jellyfish-' + n + '-' + uid; };
      var defs = rg(I('bell'), [[0, '#e6fbff', 0.9], [0.55, '#7fd8ff', 0.82], [1, '#6a7cff', 0.85]], 0.4, 0.3, 0.85) +
        rg(I('core'), [[0, '#fffbb0', 1], [0.5, '#ffe14a', 0.7], [1, '#ffe14a', 0]]) +
        lg(I('tend'), [[0, '#9ee8ff'], [1, '#5c7cff']]) +
        rg(I('halo'), [[0, '#8ff2ff', 0.55], [1, '#8ff2ff', 0]]);
      function tendril(x, y, dx, len, ph, thick) {
        var d = 'M' + x + ' ' + y;
        for (var k = 1; k <= 4; k++) d += 'Q' + f(x + dx + (k % 2 ? 9 : -9) * ph) + ' ' + f(y + len * (k - 0.5) / 4) + ' ' + f(x + dx * k / 4 * 1.2) + ' ' + f(y + len * k / 4);
        return '<path d="' + d + '" stroke="' + O + '" stroke-width="' + (thick + 3) + '" fill="none" stroke-linecap="round"/>' +
          '<path d="' + d + '" stroke="url(#' + I('tend') + ')" stroke-width="' + thick + '" fill="none" stroke-linecap="round"/>' +
          '<path d="' + d + '" stroke="#fff8a0" stroke-width="1.2" fill="none" stroke-dasharray="3 6" stroke-linecap="round"/>' +
          circ(f(x + dx * 1.2), y + len, thick * 0.9, '#fff8a0', S(1.6));
      }
      function bolt(x, y, s, col) {
        return '<path d="M' + x + ' ' + y + 'l' + 7 * s + ' ' + -12 * s + 'l' + -3 * s + ' 0l' + 6 * s + ' ' + -12 * s + 'l' + -12 * s + ' ' + 14 * s + 'l' + 4 * s + ' 0z" fill="' + col + '" ' + S(1.8) + '/>';
      }
      var body =
        // halo
        circ(100, 84, 84, 'url(#' + I('halo') + ')') +
        // far tendrils
        '<g class="part-cape" style="transform-origin: 100px 110px">' +
        tendril(78, 112, -14, 70, 1, 4) + tendril(122, 112, 16, 66, -1, 4) + tendril(96, 116, -4, 82, 1, 3.4) + tendril(112, 116, 6, 76, -1, 3.4) +
        '</g>' +
        // oral arms (frilly ribbons)
        '<g class="part-cape" style="transform-origin: 100px 116px">' +
        '<path d="M88 112Q74 136 90 152Q78 166 92 178Q100 160 96 148Q104 134 98 114Z" fill="#b48cff" ' + S(3.4) + ' opacity=".95"/>' +
        '<path d="M108 112Q120 134 108 150Q122 162 110 176Q100 158 106 146Q98 132 104 114Z" fill="#8f6cf0" ' + S(3.4) + ' opacity=".95"/>' +
        '<path d="M92 128Q88 140 92 150M108 126Q112 140 108 148" stroke="#e8d8ff" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<path d="M50 112Q34 132 48 146Q36 160 50 172" stroke="' + O + '" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M50 112Q34 132 48 146Q36 160 50 172" stroke="#7fd8ff" stroke-width="3.6" fill="none" stroke-linecap="round"/>' +
        '<path d="M150 112Q166 132 152 146Q164 160 150 172" stroke="' + O + '" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M150 112Q166 132 152 146Q164 160 150 172" stroke="#7fd8ff" stroke-width="3.6" fill="none" stroke-linecap="round"/>' +
        circ(50, 172, 3.4, '#fff8a0', S(1.6)) + circ(150, 172, 3.4, '#fff8a0', S(1.6)) +
        '</g>' +
        // bell
        '<path d="M44 112C34 50 68 16 102 16C138 16 168 52 158 112C150 122 140 116 132 124C122 116 112 126 102 118C92 126 80 116 70 124C60 116 52 122 44 112Z" fill="url(#' + I('bell') + ')" ' + S(4.5) + '/>' +
        '<clipPath id="' + I('clip') + '"><path d="M44 112C34 50 68 16 102 16C138 16 168 52 158 112C150 122 140 116 132 124C122 116 112 126 102 118C92 126 80 116 70 124C60 116 52 122 44 112Z"/></clipPath>' +
        '<g clip-path="url(#' + I('clip') + ')">' +
        '<path d="M120 10C170 40 176 90 150 130L100 130C140 100 140 50 120 10Z" fill="#4a5cd8" opacity=".38"/>' +
        '<path d="M40 100Q100 86 164 100L164 130L40 130Z" fill="#4a5cd8" opacity=".25"/>' +
        '<path d="M102 16L96 118M78 22L60 112M128 22L140 112M62 36L46 110M144 40L156 108" stroke="#fff" stroke-width="2.6" fill="none" opacity=".5"/>' +
        '<path d="M86 22L70 116M116 20L118 118M136 28L150 112" stroke="#5c7cff" stroke-width="2" fill="none" opacity=".45"/>' +
        circ(112, 60, 34, 'url(#' + I('core') + ')') +
        '</g>' +
        // lightning inside
        bolt(120, 74, 1.5, '#fff26a') + bolt(148, 90, 1, '#fff26a') + bolt(78, 32, 0.9, '#fff8a0') +
        // scallop frill highlight
        '<path d="M46 108Q56 116 70 120M74 122Q86 118 98 116M106 116Q120 122 130 122M136 120Q148 116 156 108" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".7"/>' +
        hl(72, 38, 14, 6, -40, 0.75) + hl(58, 60, 4, 2.4, -60, 0.7) + circ(90, 30, 2.4, '#fff', 'opacity=".9"') +
        // face
        '<path d="M38 66L66 76" stroke="' + O + '" stroke-width="0"/>' +
        '<g class="part-eyes" style="transform-origin: 82px 78px">' +
        ell(66, 78, 10, 12, '#fff', S(3.4)) + ell(96, 80, 9, 11, '#fff', S(3.4)) +
        eye(64, 80, 6, 8, '#3a6cff') + eye(94, 82, 5.4, 7.4, '#3a6cff') +
        '</g>' +
        '<path d="M52 64L78 72L76 66Q62 58 52 64ZM108 68L86 72L88 64Q100 60 108 68Z" fill="#4a5cd8" ' + S(2.6) + '/>' +
        '<path d="M72 98Q80 106 90 98" stroke="' + O + '" stroke-width="3.4" fill="none" stroke-linecap="round"/>' +
        '<path d="M74 99l3 5l3 -4M84 100l3 4l3 -5" fill="#fff" ' + S(1.4) + '/>' +
        ell(54, 92, 6, 3.6, '#ff8fc8', 'opacity=".6"') + ell(112, 94, 6, 3.6, '#ff8fc8', 'opacity=".6"') +
        // stray sparks
        bolt(30, 60, 0.8, '#fff26a') + bolt(176, 62, 0.9, '#fff26a') + bolt(170, 150, 0.7, '#fff8a0') +
        '<path d="M22 100l6 -4l-2 6l6 -3" stroke="#fff26a" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M178 110l-6 -4l2 6l-6 -3" stroke="#fff26a" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
        // bubbles
        circ(24, 130, 4, '#e6fbff', S(1.6) + ' opacity=".8"') + circ(178, 128, 3, '#e6fbff', S(1.4) + ' opacity=".8"') + circ(30, 148, 2.4, '#e6fbff', S(1.2) + ' opacity=".8"');
      return wrap(defs, shadow(46, 100, 0.16), body);
    }
  };

  /* ============================================================== MERMAN */
  E.merman = {
    name: 'Merfolk Spearman',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'merman-' + n + '-' + uid; };
      var defs = rg(I('skin'), [[0, '#9ae8b8'], [0.6, '#3fb890'], [1, '#237a72']], 0.35, 0.3, 0.85) +
        lg(I('tail'), [[0, '#ff9a5c'], [1, '#d8442e']], 0, 0, 1, 1) +
        lg(I('shell'), [[0, '#fff4ec'], [0.6, '#ffc2c8'], [1, '#e07898']]) +
        lg(I('metal'), [[0, '#fff2b8'], [1, '#d8a02e']], 0, 0, 1, 1);
      function shellFan(cx, cy, r, rot, col) {
        // scallop shell with ribs
        var s = '<g transform="translate(' + cx + ' ' + cy + ') rotate(' + rot + ')">' +
          '<path d="M0 0L-' + r + ' -' + f(r * 0.7) + 'Q-' + f(r * 0.7) + ' -' + f(r * 1.3) + ' 0 -' + f(r * 1.2) + 'Q' + f(r * 0.7) + ' -' + f(r * 1.3) + ' ' + r + ' -' + f(r * 0.7) + 'Z" fill="' + col + '" ' + S(3) + '/>' +
          '<path d="M0 0L-' + f(r * 0.6) + ' -' + f(r * 0.95) + 'M0 0L-' + f(r * 0.28) + ' -' + f(r * 1.12) + 'M0 0L' + f(r * 0.28) + ' -' + f(r * 1.12) + 'M0 0L' + f(r * 0.6) + ' -' + f(r * 0.95) + '" stroke="#c0587a" stroke-width="1.7" fill="none"/>' +
          '<path d="M-' + f(r * 0.5) + ' -' + f(r * 0.5) + 'Q0 -' + f(r * 0.8) + ' ' + f(r * 0.5) + ' -' + f(r * 0.5) + '" stroke="#fff" stroke-width="1.5" fill="none" opacity=".7"/></g>';
        return s;
      }
      var tailP = [[112, 128], [130, 158], [158, 150], [160, 176]];
      var body =
        // back fin on tail end
        '<path d="M150 178Q176 158 188 176Q182 184 190 190Q168 194 152 188Z" fill="url(#' + I('tail') + ')" ' + S(4) + '/>' +
        '<path d="M164 180L182 178M162 186L182 188" stroke="#8a1c22" stroke-width="2.4" stroke-linecap="round"/>' +
        // tail body
        tent(tailP, 50, 24, { fill: 'url(#' + I('tail') + ')', sh: '#b8302a', hi: '#ffe0b0', n: 6, scales: true, sw: 4.2 }) +
        // dorsal fin
        '<path d="M126 128Q142 108 152 124Q146 128 150 136Z" fill="#ffc06a" ' + S(3) + '/><path d="M132 126L140 120M138 130L146 126" stroke="#c8532e" stroke-width="1.8"/>' +
        // torso
        '<path d="M78 82C70 100 78 128 104 134C130 132 138 104 130 84C118 74 92 74 78 82Z" fill="url(#' + I('skin') + ')" ' + S(4) + '/>' +
        '<path d="M124 88C134 104 128 126 108 134C126 132 138 110 130 86Z" fill="#1d6a66" opacity=".55"/>' +
        '<path d="M92 112q6 3 12 0M92 120q6 3 12 0" stroke="#1d6a66" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        // scale patches on torso
        '<path d="M86 100q4 5 8 0M94 100q4 5 8 0M90 106q4 5 8 0" stroke="#d8ffe6" stroke-width="1.4" fill="none" opacity=".6"/>' +
        // shell breastplate
        shellFan(104, 118, 26, 0, 'url(#' + I('shell') + ')') +
        '<path d="M80 96Q104 108 130 96" stroke="' + O + '" stroke-width="3" fill="none"/>' +
        circ(104, 104, 4, '#fff', S(2)) + circ(103, 103, 1.4, '#fff', 'opacity=".9"') +
        // belt/strap of net
        '<path d="M84 90L122 130" stroke="#7a4a2a" stroke-width="4" opacity=".0"/>' +
        // back arm
        '<path d="M126 92Q142 96 146 112" stroke="' + O + '" stroke-width="14" fill="none" stroke-linecap="round"/><path d="M126 92Q142 96 146 112" stroke="#2f9a84" stroke-width="8" fill="none" stroke-linecap="round"/>' +
        circ(147, 114, 6.5, '#3fb890', S(3)) +
        shellFan(128, 90, 12, 24, 'url(#' + I('shell') + ')') +
        // head
        '<g class="part-head">' +
        // head fins
        '<path d="M92 34Q104 12 122 16Q116 24 124 30Q112 30 108 42Z" fill="#ffc06a" ' + S(3.5) + '/><path d="M104 32L116 20M108 38L122 30" stroke="#c8532e" stroke-width="1.8"/>' +
        '<path d="M112 52Q130 46 134 58Q124 58 122 68Q114 64 110 60Z" fill="#ffc06a" ' + S(3) + '/>' +
        ell(92, 56, 27, 26, 'url(#' + I('skin') + ')', S(4)) +
        '<path d="M108 42Q120 56 108 78Q118 70 118 56Q116 46 108 42Z" fill="#1d6a66" opacity=".5"/>' +
        // scale dots on brow
        '<path d="M86 38q3 3 6 0M92 36q3 3 6 0M98 38q3 3 6 0" stroke="#d8ffe6" stroke-width="1.5" fill="none" opacity=".7"/>' +
        // gills
        '<path d="M108 64l6 2M108 69l6 2M107 74l6 1" stroke="#1d6a66" stroke-width="1.8" stroke-linecap="round"/>' +
        '<g class="part-eyes" style="transform-origin: 80px 54px">' +
        ell(76, 56, 8.6, 9.4, '#fff8dc', S(3)) + ell(98, 56, 7.4, 8.4, '#fff8dc', S(3)) +
        ell(74, 58, 4.4, 6, '#e8a01c') + ell(96, 58, 3.8, 5.4, '#e8a01c') + ell(74, 58, 1.8, 5, O) + ell(96, 58, 1.6, 4.6, O) +
        circ(72, 54, 1.8, '#fff') + circ(94, 54, 1.6, '#fff') +
        '</g>' +
        '<path d="M64 46L84 52L82 45Q72 40 64 46ZM106 46L92 52L94 44Q100 40 106 46Z" fill="#237a72" ' + S(2.6) + '/>' +
        '<path d="M72 74Q82 80 92 74" stroke="' + O + '" stroke-width="3.2" fill="none" stroke-linecap="round"/>' +
        '<path d="M75 75l2 5l3 -4M84 77l3 4l2 -5" fill="#fff" ' + S(1.3) + '/>' +
        ell(66, 70, 4.6, 2.8, '#ff7a88', 'opacity=".55"') +
        hl(84, 40, 8, 3.4, -25, 0.5) +
        // shell helmet
        shellFan(92, 36, 14, -6, 'url(#' + I('shell') + ')') +
        '</g>' +
        // spear arm + trident
        '<g class="part-weapon" style="transform-origin: 84px 94px">' +
        '<g transform="rotate(-8 50 110)">' +
        '<rect x="47" y="34" width="6" height="150" rx="3" fill="#a8703a" ' + S(3) + '/>' +
        '<path d="M48 56h4M48 70h4M48 156h4M48 170h4" stroke="' + O + '" stroke-width="2"/>' +
        '<path d="M46 60h8v6h-8zM46 138h8v6h-8z" fill="url(#' + I('metal') + ')" ' + S(2) + '/>' +
        '<path d="M50 36L50 4M50 36Q34 36 32 12Q30 26 38 34M50 36Q66 36 68 12Q70 26 62 34" fill="none" stroke="' + O + '" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M50 36L50 4M50 36Q34 36 32 12Q30 26 38 34M50 36Q66 36 68 12Q70 26 62 34" fill="none" stroke="#f4f8ff" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M49 30L49 12" stroke="#fff" stroke-width="1.6" opacity=".9"/>' +
        '<path d="M42 40h16v6l-8 4l-8 -4z" fill="url(#' + I('metal') + ')" ' + S(2.6) + '/>' +
        '<path d="M50 176q-8 6 -4 14M50 176q8 6 4 14" stroke="#3fb890" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        '</g>' +
        // arm
        '<path d="M84 92Q70 100 56 108" stroke="' + O + '" stroke-width="15" fill="none" stroke-linecap="round"/><path d="M84 92Q70 100 56 108" stroke="url(#' + I('skin') + ')" stroke-width="9" fill="none" stroke-linecap="round"/>' +
        ell(53, 108, 8, 7.4, '#3fb890', S(3)) + '<path d="M48 104q5 3 9 0M48 110q5 3 9 0" stroke="#1d6a66" stroke-width="1.6" fill="none"/>' +
        shellFan(80, 88, 14, -20, 'url(#' + I('shell') + ')') +
        '</g>';
      return wrap(defs, shadow(60, 118), body);
    }
  };

  /* =============================================================== SIREN */
  E.siren = {
    name: 'Siren Witch',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'siren-' + n + '-' + uid; };
      var defs = lg(I('skin'), [[0, '#f0fbff'], [1, '#b8d8ea']], 0, 0, 1, 1) +
        lg(I('tail'), [[0, '#d68cf0'], [0.55, '#8a5ad8'], [1, '#4a3aa8']], 0, 0, 1, 1) +
        rg(I('pearl'), [[0, '#ffffff'], [0.5, '#f4e0ff'], [1, '#c8a0f0']], 0.35, 0.3, 0.8) +
        rg(I('glow'), [[0, '#ff9ae0', 0.9], [0.5, '#c880ff', 0.45], [1, '#c880ff', 0]]) +
        rg(I('mouth'), [[0, '#ffffff'], [0.5, '#ffb0ec'], [1, '#c0308c']]) +
        lg(I('shell'), [[0, '#fff4ec'], [0.6, '#ffc2d8'], [1, '#e0709c']]) +
        lg(I('gold'), [[0, '#fff2b8'], [1, '#d8a02e']], 0, 0, 1, 1);
      var hairO = { fill: '#1f7f8c', sh: '#124a5c', hi: '#6ff0e0', suck: '#a8fff0', ring: '#124a5c', n: 6, side: 1, sw: 3.6 };
      function hair(P, w0, w1, n) { return tent(P, w0, w1, { fill: hairO.fill, sh: hairO.sh, hi: hairO.hi, suck: hairO.suck, ring: hairO.ring, n: n, side: 1, sw: 3.6 }); }
      var body =
        // singing rings
        '<g fill="none" stroke-linecap="round">' +
        '<path d="' + arcPath(70, 66, 14, 140, 220) + '" stroke="#ff9ae0" stroke-width="4" opacity=".85"/>' +
        '<path d="' + arcPath(70, 66, 26, 146, 214) + '" stroke="#c880ff" stroke-width="3.6" opacity=".6"/>' +
        '<path d="' + arcPath(70, 66, 38, 150, 210) + '" stroke="#8fe8ff" stroke-width="3.2" opacity=".4"/>' +
        '</g>' +
        // back hair-tentacles (sway)
        '<g class="part-cape" style="transform-origin: 112px 44px">' +
        hair([[112, 44], [160, 26], [196, 62], [184, 112]], 22, 4, 7) +
        '</g>' +
        '<g class="part-cape" style="transform-origin: 110px 54px">' +
        hair([[110, 54], [166, 66], [190, 118], [160, 156]], 20, 4, 7) +
        '</g>' +
        '<g class="part-cape" style="transform-origin: 106px 62px">' +
        hair([[106, 62], [132, 100], [148, 134], [124, 158]], 16, 4, 5) +
        '</g>' +
        // tail
        '<path d="M164 152Q186 126 196 146Q198 164 186 172Q194 182 182 190Q166 190 158 176Z" fill="url(#' + I('tail') + ')" ' + S(4) + '/>' +
        '<path d="M170 156L188 146M172 164L192 158M172 172L186 176" stroke="#e8b8ff" stroke-width="2.4" stroke-linecap="round"/>' +
        tent([[100, 122], [82, 164], [128, 198], [166, 168]], 56, 18, { fill: 'url(#' + I('tail') + ')', sh: '#3a2a90', hi: '#f0c8ff', n: 8, scales: true, sw: 4.4 }) +
        // waist sash
        '<path d="M72 122Q100 136 130 120L128 136Q100 150 74 138Z" fill="url(#' + I('gold') + ')" ' + S(3.4) + '/>' +
        circ(100, 134, 6, 'url(#' + I('pearl') + ')', S(2.4)) +
        // torso
        '<path d="M78 82C72 100 78 116 98 122C120 118 128 100 122 82C110 74 90 74 78 82Z" fill="url(#' + I('skin') + ')" ' + S(4) + '/>' +
        '<path d="M118 84C126 102 118 116 100 122C124 118 130 100 122 84Z" fill="#7aa8c8" opacity=".5"/>' +
        // shell top
        '<path d="M80 96Q92 92 100 100Q100 112 88 112Q78 108 80 96Z" fill="url(#' + I('shell') + ')" ' + S(3.2) + '/><path d="M118 96Q108 92 100 100Q100 112 112 112Q122 108 118 96Z" fill="url(#' + I('shell') + ')" ' + S(3.2) + '/>' +
        '<path d="M84 100L90 110M90 98L94 110M116 100L110 110M110 98L106 110" stroke="#c0587a" stroke-width="1.6"/>' +
        // pearl necklace
        '<path d="M80 84Q100 100 120 84" stroke="#fff" stroke-width="0"/>' +
        circ(82, 86, 3, 'url(#' + I('pearl') + ')', S(1.6)) + circ(88, 91, 3, 'url(#' + I('pearl') + ')', S(1.6)) + circ(96, 94, 3.4, 'url(#' + I('pearl') + ')', S(1.6)) + circ(104, 94, 3.4, 'url(#' + I('pearl') + ')', S(1.6)) + circ(112, 91, 3, 'url(#' + I('pearl') + ')', S(1.6)) + circ(118, 86, 3, 'url(#' + I('pearl') + ')', S(1.6)) +
        // back arm (right) casting
        '<path d="M120 88Q140 92 142 112" stroke="' + O + '" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M120 88Q140 92 142 112" stroke="#b8d8ea" stroke-width="7.4" fill="none" stroke-linecap="round"/>' +
        circ(144, 116, 15, 'url(#' + I('glow') + ')') +
        '<path d="M138 112l-3 -8M143 110l0 -9M148 112l3 -8" stroke="' + O + '" stroke-width="5" stroke-linecap="round"/><path d="M138 112l-3 -8M143 110l0 -9M148 112l3 -8" stroke="#dff2fa" stroke-width="2.4" stroke-linecap="round"/>' +
        ell(143, 116, 6.4, 6, '#dff2fa', S(2.6)) +
        circ(144, 118, 5, '#ff9ae0', 'opacity=".8"') +
        // head
        '<g class="part-head">' +
        // fin ear
        '<path d="M106 50Q126 42 130 56Q120 56 122 68Q112 66 108 62Z" fill="#8af0e0" ' + S(3) + '/><path d="M112 54L124 52M112 60L122 62" stroke="#2a9a9a" stroke-width="1.6"/>' +
        ell(92, 54, 22, 25, 'url(#' + I('skin') + ')', S(4)) +
        '<path d="M106 40Q114 56 104 76Q112 68 112 54Q110 44 106 40Z" fill="#7aa8c8" opacity=".5"/>' +
        // front hair bangs
        '<path d="M70 44Q76 24 96 26Q112 28 114 46Q100 34 90 40Q80 38 70 52Z" fill="#1f7f8c" ' + S(3.4) + '/><path d="M80 32Q92 28 104 34" stroke="#6ff0e0" stroke-width="2" fill="none" opacity=".7"/>' +
        // eyes
        '<g class="part-eyes" style="transform-origin: 90px 54px">' +
        ell(82, 54, 6.2, 7.6, '#fff', S(2.6)) + ell(101, 55, 5.2, 7, '#fff', S(2.6)) +
        ell(81, 55, 3.6, 5.6, '#a03cff') + ell(100, 56, 3, 5, '#a03cff') + ell(81, 55, 1.4, 4.6, O) + ell(100, 56, 1.2, 4.2, O) +
        circ(79.6, 52, 1.5, '#fff') + circ(98.6, 53, 1.3, '#fff') +
        '</g>' +
        '<path d="M73 46Q80 42 87 47M95 47Q101 42 108 48" stroke="' + O + '" stroke-width="3.2" fill="none" stroke-linecap="round"/>' +
        '<path d="M74 51l-5 -3M107 52l4 -3" stroke="' + O + '" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M70 62l-3 3l5 0" stroke="' + O + '" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
        // singing mouth
        circ(76, 68, 9, 'url(#' + I('glow') + ')') +
        ell(76, 68, 4.8, 6.2, 'url(#' + I('mouth') + ')', S(2.6)) + circ(74.4, 66, 1.4, '#fff') +
        ell(66, 62, 5, 2.6, '#ff8fc8', 'opacity=".5"') +
        hl(86, 38, 6, 2.2, -25, 0.55) +
        // shell crown
        '<path d="M76 34L74 14L84 26L88 6L96 24L104 8L106 28L114 18L110 38Z" fill="url(#' + I('gold') + ')" ' + S(3.2) + '/>' +
        '<path d="M80 30Q92 20 108 32Q94 26 80 30Z" fill="#fff" opacity=".5"/>' +
        circ(88, 10, 4.6, 'url(#' + I('pearl') + ')', S(2)) + circ(75, 17, 3.6, 'url(#' + I('pearl') + ')', S(2)) + circ(104, 12, 4, 'url(#' + I('pearl') + ')', S(2)) + circ(113, 21, 3, 'url(#' + I('pearl') + ')', S(2)) +
        '<path d="M80 34Q94 22 110 36" stroke="' + O + '" stroke-width="0"/>' +
        '<path d="M78 36Q86 26 94 32Q102 24 110 36Q94 42 78 36Z" fill="url(#' + I('shell') + ')" ' + S(3) + '/><path d="M86 32L88 38M94 30L94 39M102 32L100 38" stroke="#c0587a" stroke-width="1.4"/>' +
        '</g>' +
        // front hair tentacles
        '<g class="part-cape" style="transform-origin: 86px 32px">' +
        hair([[84, 34], [62, 30], [54, 58], [62, 86]], 13, 3.4, 4) +
        '</g>' +
        // staff & arm
        '<g class="part-weapon" style="transform-origin: 88px 90px">' +
        '<g transform="rotate(5 48 110)">' +
        circ(48, 24, 30, 'url(#' + I('glow') + ')') +
        '<rect x="45" y="30" width="6" height="162" rx="3" fill="#7a4a8a" ' + S(3) + '/>' +
        '<path d="M45 60h6M45 76h6M45 150h6M45 166h6" stroke="' + O + '" stroke-width="2"/>' +
        '<path d="M48 36Q28 34 26 12Q26 6 34 8Q34 22 44 26M48 36Q68 34 70 12Q70 6 62 8Q62 22 52 26" fill="url(#' + I('gold') + ')" ' + S(3) + '/>' +
        '<path d="M48 40Q36 40 32 30M48 40Q60 40 64 30" stroke="' + O + '" stroke-width="2.4" fill="none"/>' +
        circ(48, 22, 14, 'url(#' + I('pearl') + ')', S(3.4)) + hl(43, 16, 5, 3, -30, 0.95) + circ(53, 28, 2.4, '#fff', 'opacity=".8"') +
        '<path d="M40 22Q48 14 56 22" stroke="#ff9ae0" stroke-width="1.6" fill="none" opacity=".7"/>' +
        '<path d="M45 190q-6 4 -2 8" stroke="#3fb890" stroke-width="0"/>' +
        '<path d="M48 82l-10 -6M48 90l-12 -2M48 98l-10 4" stroke="#3fb890" stroke-width="0"/>' +
        '</g>' +
        '<path d="M88 90Q70 98 54 106" stroke="' + O + '" stroke-width="14" fill="none" stroke-linecap="round"/><path d="M88 90Q70 98 54 106" stroke="#dff2fa" stroke-width="8" fill="none" stroke-linecap="round"/>' +
        ell(52, 106, 8, 7.4, '#dff2fa', S(3)) + '<path d="M46 104q6 3 11 0M46 109q6 3 11 0" stroke="' + O + '" stroke-width="1.6" fill="none"/>' +
        '<path d="M80 86q6 -6 14 -2l-2 14z" fill="url(#' + I('shell') + ')" ' + S(3) + '/>' +
        '</g>' +
        // bubbles
        circ(30, 60, 4, '#e6fbff', S(1.5) + ' opacity=".7"') + circ(24, 92, 3, '#e6fbff', S(1.3) + ' opacity=".7"') + circ(178, 40, 3.4, '#e6fbff', S(1.4) + ' opacity=".7"');
      return wrap(defs, shadow(70, 110), body);
    }
  };

  /* ============================================================== KRAKEN */
  E.kraken = {
    name: 'Abyssal Kraken',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'kraken-' + n + '-' + uid; };
      var defs = rg(I('skin'), [[0, '#d48af0'], [0.45, '#9440be'], [1, '#54207c']], 0.36, 0.28, 0.9) +
        lg(I('back'), [[0, '#7a34a8'], [1, '#3a1660']]) +
        rg(I('eye'), [[0, '#fffbc0'], [0.4, '#ffd23a'], [0.8, '#ff8a1c'], [1, '#d83a14']], 0.45, 0.4, 0.62) +
        rg(I('glow'), [[0, '#7ffff0', 0.9], [0.5, '#4ad8e0', 0.35], [1, '#4ad8e0', 0]]) +
        rg(I('aura'), [[0, '#6ff5e6', 0.4], [1, '#6ff5e6', 0]]) +
        lg(I('beak'), [[0, '#ffe08a'], [0.6, '#d89a3a'], [1, '#8a4a1e']], 0, 0, 1, 1) +
        lg(I('iron'), [[0, '#a8b4b8'], [1, '#4a5a60']], 0, 0, 1, 1);
      var mantle = 'M52 104C36 46 84 6 128 8C150 8 172 24 178 56C184 92 170 122 150 132C130 144 96 146 76 138C60 130 54 118 52 104Z';
      var tb = { fill: '#6a2c94', sh: '#3a1660', hi: '#b070e0', suck: '#d8a0d8', ring: '#7a3a90', side: 1, sw: 4.2 };
      var tf = { fill: '#9a48c0', sh: '#5a2484', hi: '#f0b8ff', suck: '#f8cce8', ring: '#c06aa0', side: 1, sw: 4.4 };
      function T(P, w0, w1, n, o) {
        var origin = 'transform-origin: ' + P[0][0] + 'px ' + P[0][1] + 'px';
        return '<g class="part-cape" style="' + origin + '">' + tent(P, w0, w1, { fill: o.fill, sh: o.sh, hi: o.hi, suck: o.suck, ring: o.ring, side: o.side, sw: o.sw, n: n }) +
          glowDots(P, w0, w1, n) + '</g>';
      }
      function glowDots(P, w0, w1, n) {
        var s = '', i, t, c, w;
        for (i = 0; i < 4; i++) {
          t = 0.16 + i * 0.2; c = bez(P, t); w = (w0 + (w1 - w0) * t) / 2;
          if (w < 3.4) continue;
          s += circ(f(c.x + c.nx * w * 0.5), f(c.y + c.ny * w * 0.5), f(w * 0.5), 'url(#' + I('glow') + ')');
          s += circ(f(c.x + c.nx * w * 0.5), f(c.y + c.ny * w * 0.5), f(Math.max(1.1, w * 0.13)), '#eafffb');
        }
        return s;
      }
      function rune(x, y, s, k) {
        var g = ['M0 -6V6M-4 -3L4 3M4 -3L-4 3', 'M-5 6L0 -6L5 6M-3 1H3', 'M-4 -6V6M-4 -6H3L4 0L-4 0M-4 0L4 6', 'M0 -6L5 0L0 6L-5 0ZM0 -2V2', 'M-5 -5L5 5M5 -5L-5 5M0 -7V7'][k % 5];
        return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="' + g + '" stroke="#4ad8e0" stroke-width="5" fill="none" stroke-linecap="round" opacity=".45"/><path d="' + g + '" stroke="#c8fffa" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>';
      }
      function spot(x, y, r) { return circ(x, y, f(r * 2.4), 'url(#' + I('glow') + ')') + circ(x, y, r, '#c8fffa', S(1.2)) + circ(x - r * 0.3, y - r * 0.3, f(r * 0.35), '#fff'); }
      function wart(x, y, r) { return circ(x, y, r, '#7a34a8', 'opacity=".6"') + circ(x - r * 0.3, y - r * 0.3, f(r * 0.4), '#e0a0f8', 'opacity=".6"'); }

      var body =
        circ(104, 96, 100, 'url(#' + I('aura') + ')') +
        // ---- back tentacles
        T([[150, 112], [200, 116], [202, 62], [176, 50]], 22, 5, 8, tb) +
        T([[164, 128], [200, 140], [196, 176], [178, 190]], 20, 5, 7, tb) +
        T([[46, 114], [8, 110], [4, 66], [30, 46]], 18, 5, 7, tb) +
        // ---- mantle
        '<path d="' + mantle + '" fill="url(#' + I('skin') + ')" ' + S(5) + '/>' +
        '<clipPath id="' + I('clip') + '"><path d="' + mantle + '"/></clipPath>' +
        '<g clip-path="url(#' + I('clip') + ')">' +
        // shade tone 1 and 2
        '<path d="M120 4C190 20 196 100 156 140L100 150C150 110 150 50 120 4Z" fill="#4a1c74" opacity=".55"/>' +
        '<path d="M150 20C190 50 190 110 150 140L130 146C170 110 172 60 150 20Z" fill="#2c0f4c" opacity=".55"/>' +
        '<path d="M40 120Q100 104 170 124L170 150L40 150Z" fill="#3a1660" opacity=".4"/>' +
        // veins
        '<path d="M130 20Q126 50 136 72Q128 96 140 120M110 14Q104 40 112 60M150 30Q160 56 152 84" stroke="#c060e8" stroke-width="2" fill="none" opacity=".55"/>' +
        '<path d="M136 72Q150 76 158 70M112 60Q98 62 90 56M140 120Q152 118 160 112" stroke="#c060e8" stroke-width="1.6" fill="none" opacity=".5"/>' +
        // mottled skin
        wart(104, 26, 4) + wart(90, 40, 3) + wart(120, 40, 3.4) + wart(146, 44, 3.6) + wart(160, 76, 4) + wart(150, 100, 3) + wart(70, 60, 3.6) + wart(62, 84, 3) + wart(132, 122, 3.6) + wart(108, 16, 2.6) + wart(78, 34, 2.6) + wart(164, 100, 2.6) +
        // rune ring glow
        circ(118, 46, 40, 'url(#' + I('glow') + ')') +
        '</g>' +
        // rim outline redraw for cleanliness
        '<path d="' + mantle + '" fill="none" ' + S(5) + '/>' +
        // highlights
        '<path d="M64 84C60 56 84 26 112 18" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".5"/>' +
        hl(84, 34, 9, 3.4, -40, 0.55) + circ(66, 96, 2.4, '#fff', 'opacity=".6"') +
        // runes
        rune(112, 30, 1.5, 0) + rune(136, 44, 1.3, 1) + rune(96, 46, 1.2, 2) + rune(124, 60, 1.4, 3) + rune(152, 66, 1.1, 4) + rune(108, 68, 1, 1) +
        '<path d="M100 34Q118 22 138 34M102 52Q120 42 142 54" stroke="#4ad8e0" stroke-width="1.8" fill="none" opacity=".55" stroke-dasharray="2 4"/>' +
        // bioluminescent spots along the mantle
        spot(60, 76, 3) + spot(62, 62, 2.4) + spot(70, 46, 3) + spot(82, 30, 2.4) + spot(98, 18, 3) + spot(164, 64, 3) + spot(170, 84, 2.4) + spot(162, 104, 3) + spot(148, 122, 2.4) + spot(132, 134, 2.6) +
        // barnacle clusters
        barn(76, 18, 5) + barn(86, 12, 3.6) + barn(68, 26, 3.2) + barn(150, 26, 5.4) + barn(160, 34, 3.6) + barn(140, 16, 3) + barn(166, 116, 4.6) + barn(158, 124, 3) +
        // scars
        '<path d="M140 78l18 22M146 74l18 22" stroke="#e8c8ff" stroke-width="2.2" stroke-linecap="round" opacity=".7"/><path d="M140 78l18 22M146 74l18 22" stroke="#2c0f4c" stroke-width="1" stroke-linecap="round" opacity=".5" transform="translate(1 1.4)"/>' +
        // ---- face
        // mouth cavity + beak
        ell(90, 132, 28, 12, '#2a0c3c', S(3.6)) +
        '<path d="M66 132l3 -5l3 5M74 136l3 -6l3 6M84 138l3 -6l3 6M94 138l3 -6l3 6M104 136l3 -6l3 6" fill="#f4ecd0" stroke="' + O + '" stroke-width="1.2" stroke-linejoin="round" transform="translate(0 -2)"/>' +
        // eyes
        '<clipPath id="' + I('eyeL') + '"><ellipse cx="76" cy="98" rx="18" ry="17"/></clipPath><clipPath id="' + I('eyeR') + '"><ellipse cx="116" cy="100" rx="15" ry="14.5"/></clipPath>' +
        '<g class="part-eyes" style="transform-origin: 96px 99px">' +
        ell(76, 98, 18, 17, 'url(#' + I('eye') + ')', S(4)) + ell(116, 100, 15, 14.5, 'url(#' + I('eye') + ')', S(4)) +
        '<g clip-path="url(#' + I('eyeL') + ')"><path d="M62 90Q76 100 90 92M64 106Q76 112 90 106" stroke="#d83a14" stroke-width="1.2" fill="none" opacity=".6"/><path d="M58 76L96 92L96 60Z" fill="#5a2484"/><path d="M58 76L96 92" stroke="' + O + '" stroke-width="3"/></g>' +
        '<g clip-path="url(#' + I('eyeR') + ')"><path d="M102 92Q116 104 130 94M104 108Q116 112 130 108" stroke="#d83a14" stroke-width="1.2" fill="none" opacity=".6"/><path d="M134 82L98 94L98 60Z" fill="#5a2484"/><path d="M134 82L98 94" stroke="' + O + '" stroke-width="3"/></g>' +
        ell(74, 102, 4.6, 11, O) + ell(114, 104, 4, 10, O) +
        '<path d="M72 96l0 12M112 98l0 12" stroke="#ff8a1c" stroke-width="0"/>' +
        ell(69, 94, 5, 3.2, '#fff', 'opacity=".95"') + circ(84, 110, 2.6, '#fff', 'opacity=".8"') + ell(111, 96, 4, 2.6, '#fff', 'opacity=".95"') + circ(124, 110, 2.2, '#fff', 'opacity=".8"') +
        '</g>' +
        // brow ridges
        '<path d="M54 84C60 70 78 76 98 92L94 100C78 90 64 88 56 94Z" fill="#54207c" ' + S(4) + '/><path d="M60 82C68 76 78 80 90 90" stroke="#c060e8" stroke-width="2" fill="none" opacity=".6"/>' +
        '<path d="M138 86C132 72 116 78 96 94L100 102C116 92 130 90 136 96Z" fill="#54207c" ' + S(4) + '/><path d="M132 84C126 78 116 82 106 90" stroke="#c060e8" stroke-width="2" fill="none" opacity=".6"/>' +
        wart(70, 80, 2.2) + wart(84, 86, 2) + wart(124, 84, 2) +
        // beak
        '<path d="M64 126Q88 116 110 128Q106 146 88 158Q84 142 64 126Z" fill="url(#' + I('beak') + ')" ' + S(4) + '/>' +
        '<path d="M74 130Q90 124 104 132" stroke="#fff" stroke-width="2.2" fill="none" opacity=".6" stroke-linecap="round"/>' +
        '<path d="M78 138Q90 134 100 140Q96 150 88 156Q86 146 78 138Z" fill="#8a4a1e" ' + S(3) + '/>' +
        '<path d="M70 126l6 8M80 124l4 10M96 124l-2 8" stroke="#8a4a1e" stroke-width="1.6" stroke-linecap="round"/>' +
        '<path d="M88 158l-3 4l6 -1z" fill="#8a4a1e" stroke="' + O + '" stroke-width="1.6" stroke-linejoin="round"/>' +
        // nostrils / chips
        '<path d="M64 126l-2 4" stroke="' + O + '" stroke-width="3" stroke-linecap="round"/>' +
        // ---- front tentacles
        T([[136, 132], [172, 146], [200, 176], [164, 190]], 24, 6, 8, tf) +
        T([[108, 136], [98, 182], [66, 198], [36, 186]], 26, 6, 9, tf) +
        T([[62, 128], [20, 128], [2, 154], [22, 186]], 24, 6, 8, tf) +
        T([[56, 120], [14, 96], [6, 58], [32, 38]], 20, 5, 8, tf) +
        // ---- anchor & chain
        '<path d="M164 44Q140 8 104 10Q66 12 52 52Q38 84 40 110Q44 130 40 150" fill="none" stroke="' + O + '" stroke-width="8.4" stroke-linecap="round"/>' +
        '<path d="M164 44Q140 8 104 10Q66 12 52 52Q38 84 40 110Q44 130 40 150" fill="none" stroke="url(#' + I('iron') + ')" stroke-width="5" stroke-linecap="round" stroke-dasharray="6 3.6"/>' +
        '<path d="M164 44Q140 8 104 10Q66 12 52 52Q38 84 40 110Q44 130 40 150" fill="none" stroke="#dfe8ea" stroke-width="1.2" stroke-linecap="round" stroke-dasharray="3 7" opacity=".7" transform="translate(-.8 -1)"/>' +
        '<g transform="translate(168 52) rotate(28)">' +
        '<path d="M0 -16V22" stroke="' + O + '" stroke-width="10" stroke-linecap="round"/><path d="M0 -16V22" stroke="url(#' + I('iron') + ')" stroke-width="5.6" stroke-linecap="round"/>' +
        '<path d="M-14 -8H14" stroke="' + O + '" stroke-width="9" stroke-linecap="round"/><path d="M-14 -8H14" stroke="url(#' + I('iron') + ')" stroke-width="4.8" stroke-linecap="round"/>' +
        '<path d="M-22 10Q-20 30 0 32Q20 30 22 10" fill="none" stroke="' + O + '" stroke-width="10" stroke-linecap="round"/><path d="M-22 10Q-20 30 0 32Q20 30 22 10" fill="none" stroke="url(#' + I('iron') + ')" stroke-width="5.4" stroke-linecap="round"/>' +
        '<path d="M-30 6L-20 16L-16 4Z M30 6L20 16L16 4Z" fill="url(#' + I('iron') + ')" ' + S(3) + '/>' +
        '<circle cx="0" cy="-22" r="6" fill="none" stroke="' + O + '" stroke-width="7"/><circle cx="0" cy="-22" r="6" fill="none" stroke="url(#' + I('iron') + ')" stroke-width="3.2"/>' +
        '<path d="M-2 -10V16" stroke="#fff" stroke-width="1.6" opacity=".5" stroke-linecap="round"/>' +
        '<path d="M-6 10l3 5M4 18l4 4M-3 22l3 6" stroke="#b8542a" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>' +
        barn(-8, 24, 3.4) + barn(9, 4, 3) + barn(-3, -2, 2.4) +
        '<path d="M-22 12Q-30 26 -24 38M22 12Q30 24 24 36" stroke="#3ab84a" stroke-width="3.2" fill="none" stroke-linecap="round"/>' +
        '</g>' +
        // chain ends / links near hanging
        barn(41, 128, 3) +
        // seaweed on chain
        '<path d="M52 50Q42 60 48 74Q40 84 44 94" stroke="' + O + '" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M52 50Q42 60 48 74Q40 84 44 94" stroke="#3ab84a" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        // bubbles
        circ(20, 20, 4, '#dffcff', S(1.5) + ' opacity=".7"') + circ(32, 12, 2.6, '#dffcff', S(1.3) + ' opacity=".7"') + circ(184, 24, 3.4, '#dffcff', S(1.4) + ' opacity=".7"');
      return wrap(defs, shadow(88, 104, 0.3), body);
    }
  };

  /* ========================================================= MAGMA TITAN */
  E.magmatitan = {
    name: 'Magma Titan',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'magmatitan-' + n + '-' + uid; };
      var defs = lg(I('rock'), [[0, '#6a5470'], [0.5, '#3c2c48'], [1, '#221828']], 0, 0, 1, 1) +
        lg(I('rock2'), [[0, '#54405c'], [1, '#1c1222']], 0, 0, 0.6, 1) +
        rg(I('lava'), [[0, '#fff2a0'], [0.4, '#ffb02a'], [0.8, '#ff5a1a'], [1, '#c8280e']], 0.45, 0.4, 0.7) +
        rg(I('core'), [[0, '#ffffff', 1], [0.25, '#fff2a0', 1], [0.6, '#ff8a1c', 0.7], [1, '#ff4a12', 0]]) +
        rg(I('aura'), [[0, '#ff7a1a', 0.5], [1, '#ff4a12', 0]]) +
        lg(I('fist'), [[0, '#ffb02a'], [1, '#c8280e']], 0, 0, 1, 1) +
        lg(I('flame'), [[0, '#fff2a0'], [1, '#ff5a1a']]);
      var R = '#3c2c48', R2 = '#221828', RL = '#8a7292';
      function rock(pts, fill, w) { return '<path d="' + poly(pts) + '" fill="' + (fill || 'url(#' + I('rock') + ')') + '" ' + S(w || 4.4) + '/>'; }
      function fiss(d, w) {
        return '<path d="' + d + '" stroke="#ff4a12" stroke-width="' + f((w || 3) + 3) + '" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".5"/>' +
          '<path d="' + d + '" stroke="#ffb02a" stroke-width="' + (w || 3) + '" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<path d="' + d + '" stroke="#fff6b0" stroke-width="' + f((w || 3) * 0.35) + '" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
      }
      function drop(x, y, s) { return '<path d="M' + x + ' ' + y + 'q-' + 4 * s + ' ' + 7 * s + ' 0 ' + 10 * s + 'q' + 4 * s + ' -3 0 -' + 10 * s + 'z" fill="url(#' + I('lava') + ')" ' + S(1.8) + '/>'; }
      function link(x, y, rot, s) {
        return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + s + ')"><ellipse rx="8" ry="4.6" fill="none" stroke="' + O + '" stroke-width="6.4"/><ellipse rx="8" ry="4.6" fill="none" stroke="#ff8a1c" stroke-width="3.4"/><ellipse rx="8" ry="4.6" fill="none" stroke="#fff2a0" stroke-width="1" opacity=".8" transform="translate(-.6 -.6)"/></g>';
      }
      var body =
        circ(104, 104, 98, 'url(#' + I('aura') + ')') +
        // ---- back arm (right)
        rock([[152, 66], [180, 78], [188, 116], [184, 148], [160, 150], [156, 110]], null, 4.4) +
        rock([[160, 140], [190, 140], [194, 168], [176, 178], [156, 170]], 'url(#' + I('fist') + ')', 4.4) +
        '<path d="M166 146l0 12M176 144l0 14M186 146l0 12" stroke="' + O + '" stroke-width="2.6" stroke-linecap="round"/>' +
        fiss('M166 92L172 108L166 124', 2.4) +
        // ---- legs
        rock([[64, 132], [108, 132], [114, 190], [54, 190], [58, 160]], null, 4.4) +
        rock([[114, 134], [158, 132], [162, 172], [166, 190], [108, 190]], 'url(#' + I('rock2') + ')', 4.4) +
        '<path d="M56 190l6 -8l10 4l10 -6l12 6l10 -4l8 8M110 190l8 -8l10 4l10 -6l12 6l10 -4l8 8" fill="none" stroke="' + O + '" stroke-width="3"/>' +
        fiss('M78 140L84 158L74 174', 2.4) + fiss('M138 142L132 160L142 178', 2.4) +
        '<path d="M62 140L76 142L70 152Z M120 140L138 144L128 154Z" fill="' + RL + '" opacity=".5"/>' +
        '<path d="M60 162Q80 168 100 160" stroke="#000" stroke-width="2" fill="none" opacity=".3"/>' +
        // lava seepage on feet
        ell(72, 187, 16, 3, '#ff8a1c', 'opacity=".75"') + ell(136, 187, 18, 3, '#ff8a1c', 'opacity=".75"') +
        // ---- torso
        rock([[52, 72], [84, 44], [136, 44], [170, 70], [176, 108], [156, 144], [108, 154], [64, 142], [46, 104]], null, 4.8) +
        // facets (2 shade tones)
        '<path d="M136 44L170 70L176 108L156 144L140 120L150 84Z" fill="' + R2 + '" opacity=".7"/>' +
        '<path d="M156 144L108 154L64 142L92 128L130 134Z" fill="#150c1a" opacity=".55"/>' +
        '<path d="M52 72L84 44L104 50L74 82L58 100Z" fill="' + RL + '" opacity=".55"/>' +
        '<path d="M84 44L136 44L124 58L96 60Z" fill="#a08aa8" opacity=".35"/>' +
        '<path d="M60 112L80 100L96 128L70 136Z" fill="#000" opacity=".22"/>' +
        // plate edges
        '<path d="M96 60L74 82L80 100M124 58L150 84L146 110M64 142L82 122L108 134L134 128L156 144" stroke="' + O + '" stroke-width="3" fill="none" stroke-linejoin="round"/>' +
        // fissures
        fiss('M58 96L74 100L66 120L84 128', 2.8) + fiss('M150 84L138 96L150 112L136 128', 2.8) + fiss('M100 58L106 74M112 62L120 76L112 84', 2.2) + fiss('M96 138L102 150M120 134L124 148', 2.2) +
        // core
        circ(104, 104, 34, 'url(#' + I('core') + ')') +
        '<path d="' + poly([[104, 82], [116, 88], [124, 100], [120, 116], [108, 126], [92, 124], [84, 110], [86, 94]]) + '" fill="' + R2 + '" ' + S(3.6) + '/>' +
        '<path d="' + poly([[104, 88], [113, 93], [118, 102], [115, 113], [106, 119], [95, 117], [90, 108], [92, 97]]) + '" fill="url(#' + I('lava') + ')"/>' +
        '<path d="M96 96L104 104L98 112M112 98L106 106L114 112" stroke="#fff6b0" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        circ(102, 100, 4, '#fff', 'opacity=".8"') +
        '<path d="M104 82L104 74M124 100L132 100M84 110L76 114M108 126L110 134" stroke="' + O + '" stroke-width="3" stroke-linecap="round"/>' +
        // rune-brands on plates
        '<path d="M150 118l6 -5l0 10zM60 84l-4 6l8 0" fill="none" stroke="#ffb02a" stroke-width="2" opacity=".8"/>' +
        // ---- chains of fire (diagonal across torso)
        (function () {
          var s = '', k, n = 8, x0 = 62, y0 = 64, x1 = 150, y1 = 138;
          for (k = 0; k <= n; k++) {
            var t = k / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 6;
            s += link(f(x), f(y), f(Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI + (k % 2 ? 90 : 0) * 0), k % 2 ? 0.8 : 1);
          }
          return s;
        })() +
        // ---- pauldrons
        rock([[30, 84], [40, 54], [64, 46], [80, 62], [78, 92], [56, 104]], null, 4.6) +
        '<path d="M40 54L64 46L58 66Z" fill="' + RL + '" opacity=".5"/><path d="M78 92L56 104L60 82Z" fill="#000" opacity=".3"/>' +
        fiss('M44 70L56 82L50 96', 2.2) +
        '<path d="M40 54L34 40L48 48M62 46L64 30L72 46" fill="' + R + '" ' + S(3.2) + '/>' +
        rock([[142, 62], [156, 44], [182, 54], [190, 84], [172, 100], [146, 92]], 'url(#' + I('rock2') + ')', 4.6) +
        '<path d="M156 44L182 54L170 64Z" fill="' + RL + '" opacity=".4"/>' +
        fiss('M162 64L172 78L164 92', 2.2) +
        '<path d="M156 44L154 30L166 42M182 54L192 40L186 60" fill="' + R2 + '" ' + S(3.2) + '/>' +
        // ---- head
        '<g class="part-head">' +
        // crown flames (sway)
        '<g class="part-cape" style="transform-origin: 74px 26px">' + flame(66, 30, 9, 30, 'url(#' + I('flame') + ')', '#fff6b0') + flame(80, 24, 8, 24, 'url(#' + I('flame') + ')', '#fff6b0') + '</g>' +
        '<g class="part-cape" style="transform-origin: 100px 26px">' + flame(94, 24, 9, 34, 'url(#' + I('flame') + ')', '#fff6b0') + flame(110, 28, 8, 26, 'url(#' + I('flame') + ')', '#fff6b0') + '</g>' +
        // crown rocks
        '<path d="M62 40L58 18L70 30L74 8L82 28L92 4L98 28L110 10L112 32L122 22L116 44Z" fill="' + R + '" ' + S(3.6) + '/>' +
        '<path d="M66 34L64 24M78 26L76 14M90 24L92 12M104 26L108 16" stroke="#ff8a1c" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M58 18L70 30L62 40Z M92 4L98 28L88 26Z" fill="' + RL + '" opacity=".45"/>' +
        rock([[62, 46], [70, 30], [92, 24], [116, 34], [122, 56], [112, 72], [96, 78], [72, 74], [60, 62]], null, 4.6) +
        '<path d="M108 32L122 56L112 72L96 78L106 56Z" fill="' + R2 + '" opacity=".65"/>' +
        '<path d="M70 30L92 24L84 40L66 50Z" fill="' + RL + '" opacity=".5"/>' +
        fiss('M100 32L104 44L98 52', 2) + fiss('M64 62L72 60', 1.8) +
        // brow
        '<path d="M62 44L94 54L92 44L68 36Z M124 46L98 54L100 44L118 38Z" fill="#150c1a" ' + S(3.4) + '/>' +
        // eyes
        '<g class="part-eyes" style="transform-origin: 90px 56px">' +
        '<path d="M66 54L86 60L84 68Q72 68 66 60Z" fill="url(#' + I('lava') + ')" ' + S(3) + '/><path d="M118 54L98 60L100 68Q112 68 118 60Z" fill="url(#' + I('lava') + ')" ' + S(3) + '/>' +
        circ(78, 62, 4, '#fff8c0') + circ(106, 62, 4, '#fff8c0') + circ(76, 60.5, 1.6, '#fff') + circ(104, 60.5, 1.6, '#fff') +
        '</g>' +
        circ(76, 62, 16, 'url(#' + I('core') + ')') + circ(108, 62, 14, 'url(#' + I('core') + ')') +
        // maw
        '<path d="M68 70L82 72L96 72L112 70L106 80L96 76L88 82L80 76L72 82Z" fill="#7a1a10" ' + S(3) + '/>' +
        '<path d="M72 72L76 78L80 72M84 72L88 79L92 72M96 72L100 77L104 72" fill="#ffd090" stroke="' + O + '" stroke-width="1.4" stroke-linejoin="round"/>' +
        drop(80, 82, 0.8) + drop(96, 80, 0.6) +
        '</g>' +
        // ---- front arm (left) & molten fist
        rock([[34, 92], [58, 98], [66, 130], [56, 150], [26, 146], [24, 116]], null, 4.6) +
        '<path d="M34 92L58 98L46 108Z" fill="' + RL + '" opacity=".45"/><path d="M66 130L56 150L44 132Z" fill="#000" opacity=".3"/>' +
        fiss('M40 108L48 120L38 134', 2.4) +
        // wrist chain shackle
        '<path d="M22 138Q46 148 68 138L66 148Q46 158 24 148Z" fill="url(#' + I('lava') + ')" ' + S(3.4) + '/>' +
        '<path d="M8 152C4 138 16 130 30 132C46 128 62 136 62 152C66 168 54 180 36 180C16 182 4 170 8 152Z" fill="url(#' + I('fist') + ')" ' + S(4.6) + '/>' +
        '<path d="M14 150Q20 140 30 144M30 144Q40 138 48 146M50 148Q56 156 52 166" stroke="' + O + '" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
        '<path d="M16 162Q30 172 50 166" stroke="#c8280e" stroke-width="3" fill="none" opacity=".7"/>' +
        hl(22, 142, 8, 3.2, -30, 0.7) + circ(56, 146, 2, '#fff', 'opacity=".6"') +
        // dripping lava
        '<path d="M14 172q-2 10 0 16" stroke="#ff8a1c" stroke-width="4" stroke-linecap="round"/>' +
        drop(14, 168, 0.9) + drop(30, 182, 0.8) + drop(48, 176, 0.9) +
        '<path d="M30 178q-2 6 0 10M48 174q-2 8 0 14" stroke="#ff8a1c" stroke-width="3" stroke-linecap="round"/>' +
        ell(30, 189, 18, 2.6, '#ff8a1c', 'opacity=".8"') +
        // fiery chain swinging from hip
        '<g class="part-cape" style="transform-origin: 150px 140px">' +
        link(150, 144, 90, 0.9) + link(152, 154, 0, 0.9) + link(152, 164, 90, 0.9) + link(154, 174, 0, 0.9) +
        flame(154, 186, 8, 22, 'url(#' + I('flame') + ')', '#fff6b0') +
        '</g>' +
        // embers
        circ(24, 60, 2.4, '#ffb02a') + circ(14, 40, 1.8, '#fff2a0') + circ(186, 34, 2.2, '#ffb02a') + circ(172, 16, 1.6, '#fff2a0') + circ(132, 10, 2, '#ffb02a') + circ(40, 22, 1.6, '#fff2a0');
      return wrap(defs, shadow(88, 108, 0.3), body);
    }
  };

  /* ================================================================ SCENE */
  function ruins() {
    var r = rng(61), i, s = '';
    function ID(n) { return 'ruins-' + n; }
    s += '<defs>' +
      lg(ID('sky'), [[0, '#7fe6d4'], [0.4, '#2fa7b5'], [1, '#146f8c']]) +
      lg(ID('floor'), [[0, '#5fbfae'], [1, '#2a8580']]) +
      lg(ID('marble'), [[0, '#fbfffc'], [0.6, '#dcece6'], [1, '#a8c8c4']], 0, 0, 1, 0) +
      lg(ID('ray'), [[0, '#eaffff', 0.5], [1, '#eaffff', 0]]) +
      lg(ID('water'), [[0, '#9ff4f0', 0.05], [1, '#5ad8e0', 0.4]]) +
      rg(ID('lamp'), [[0, '#fffbd0', 1], [0.35, '#9ff8e0', 0.6], [1, '#5ad8e0', 0]]) +
      rg(ID('glass'), [[0, '#f4fff0'], [0.5, '#7ff0c8'], [1, '#2aa88e']], 0.38, 0.32, 0.8) +
      lg(ID('kelp'), [[0, '#5ad86a'], [1, '#1c7a48']], 0, 0, 1, 0) +
      '</defs>';
    s += '<rect width="400" height="300" fill="url(#' + ID('sky') + ')"/>';
    // light shafts
    for (i = 0; i < 6; i++) {
      var rx = 30 + i * 70 + r() * 20;
      s += '<path d="M' + f(rx) + ' 0L' + f(rx + 26) + ' 0L' + f(rx - 30) + ' 200L' + f(rx - 70) + ' 200Z" fill="url(#' + ID('ray') + ')" opacity="' + f(0.25 + r() * 0.25) + '"/>';
    }
    // surface shimmer
    s += '<path d="M0 6Q50 16 100 6T200 6T300 6T400 6V0H0Z" fill="#dffffa" opacity=".55"/>';
    // far ruins silhouette (arches / columns in haze)
    s += '<g fill="#3fb8c4" opacity=".55">';
    s += '<path d="M-10 180V120H14V100H30V180Z M30 180V116H46V180Z"/>';
    s += '<path d="M90 180V96H104V180Z M96 84H112V96H90Z M104 96Q124 66 144 96V180H130V110Q124 98 118 110V180H104Z"/>';
    s += '<path d="M180 180V118H194L196 104H208V180Z"/>';
    s += '<path d="M260 180V90H276V180Z M254 82H282V92H254Z M300 180V110Q322 70 344 110V180H330V120Q322 104 314 120V180Z"/>';
    s += '<path d="M372 180V108H388V180Z M368 100H392V110H368Z"/>';
    s += '</g>';
    s += '<path d="M-10 186Q70 168 150 180T300 174T410 182V210H-10Z" fill="#2a9aa8" opacity=".7"/>';
    // drifting bubbles far
    for (i = 0; i < 16; i++) s += '<circle cx="' + f(r() * 400) + '" cy="' + f(10 + r() * 170) + '" r="' + f(0.8 + r() * 2.2) + '" fill="#eaffff" opacity="' + f(0.25 + r() * 0.4) + '" stroke="#fff" stroke-width=".6"/>';
    // fish silhouettes
    for (i = 0; i < 5; i++) {
      var fx = 20 + r() * 360, fy = 40 + r() * 110, fs = 0.6 + r() * 0.5;
      s += '<g transform="translate(' + f(fx) + ' ' + f(fy) + ') scale(' + f(fs) + ')" fill="#1c7f98" opacity=".7"><path d="M-8 0Q0 -6 8 0Q0 6 -8 0ZM8 0L14 -5V5Z"/></g>';
    }
    // ground
    s += '<path d="M-10 190Q100 184 200 190T410 188V310H-10Z" fill="url(#' + ID('floor') + ')"/>';
    s += '<path d="M-10 190Q100 184 200 190T410 188" fill="none" stroke="#a8f0d8" stroke-width="2"/>';
    // sand ripples
    for (i = 0; i < 12; i++) {
      var sx = r() * 400, sy = 196 + r() * 20;
      s += '<path d="M' + f(sx) + ' ' + f(sy) + 'q12 -3 24 0" stroke="#bff4dc" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".5"/>';
    }
    // --- helpers for props
    function column(x, y, h, w, broken, lean) {
      var t = '<g transform="translate(' + x + ' ' + y + ') rotate(' + (lean || 0) + ')">';
      t += '<path d="M' + (-w * 0.5 - 4) + ' 0H' + (w * 0.5 + 4) + 'V-6H' + (w * 0.5) + 'V' + -h + 'H' + -w * 0.5 + 'V-6H' + (-w * 0.5 - 4) + 'Z" fill="url(#' + ID('marble') + ')" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>';
      t += '<path d="M' + f(-w * 0.2) + ' -6V' + (-h + 2) + 'M' + f(w * 0.12) + ' -6V' + (-h + 2) + '" stroke="#9ec4c0" stroke-width="1.6"/>';
      t += '<path d="M' + f(w * 0.5) + ' -6V' + -h + 'H' + f(w * 0.24) + 'V-6Z" fill="#7fb0b0" opacity=".45"/>';
      if (broken) {
        t += '<path d="M' + -w * 0.5 + ' ' + -h + 'L' + f(-w * 0.2) + ' ' + f(-h - 8) + 'L' + f(w * 0.05) + ' ' + f(-h - 2) + 'L' + f(w * 0.3) + ' ' + f(-h - 10) + 'L' + w * 0.5 + ' ' + -h + 'Z" fill="#eafaf4" stroke="' + O + '" stroke-width="2.2" stroke-linejoin="round"/>';
      } else {
        t += '<path d="M' + (-w * 0.5 - 4) + ' ' + (-h) + 'H' + (w * 0.5 + 4) + 'V' + (-h - 8) + 'H' + (-w * 0.5 - 4) + 'Z" fill="#eafaf4" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>';
      }
      // algae band
      t += '<path d="M' + -w * 0.5 + ' -14Q' + f(-w * 0.1) + ' -22 ' + w * 0.5 + ' -12V-6H' + -w * 0.5 + 'Z" fill="#3aa860" opacity=".75"/>';
      return t + '</g>';
    }
    function coral(x, y, sc, c1, c2) {
      var t = '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')">';
      var d = 'M0 0L0 -20L-8 -32M0 -20L8 -36M-4 -12L-14 -18M4 -8L14 -14M8 -36L4 -46M8 -36L16 -42';
      t += '<path d="' + d + '" stroke="' + O + '" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="' + d + '" stroke="' + c1 + '" stroke-width="6.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
      t += '<path d="M-1.6 -2L-1.6 -18" stroke="#fff" stroke-width="1.6" opacity=".5" stroke-linecap="round"/>';
      var tips = [[-8, -32], [4, -46], [16, -42], [-14, -18], [14, -14], [8, -36]];
      for (var k = 0; k < tips.length; k++) t += '<circle cx="' + tips[k][0] + '" cy="' + tips[k][1] + '" r="3.4" fill="' + c2 + '" stroke="' + O + '" stroke-width="1.6"/>';
      return t + '</g>';
    }
    function brainCoral(x, y, sc, c) {
      return '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')"><path d="M-18 0Q-20 -20 0 -22Q20 -20 18 0Z" fill="' + c + '" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/><path d="M-12 -6Q-6 -14 0 -8Q6 -16 12 -6M-8 -14Q0 -18 8 -14" stroke="#8a3a5a" stroke-width="1.6" fill="none" opacity=".7"/><ellipse cx="-6" cy="-14" rx="5" ry="2" fill="#fff" opacity=".4"/></g>';
    }
    function kelp(x, y, h, sc, ph) {
      var d = 'M' + x + ' ' + y;
      for (var k = 1; k <= 4; k++) d += 'Q' + f(x + (k % 2 ? 9 : -9) * ph) + ' ' + f(y - h * (k - 0.5) / 4) + ' ' + x + ' ' + f(y - h * k / 4);
      return '<path d="' + d + '" stroke="' + O + '" stroke-width="' + (sc * 2 + 3) + '" fill="none" stroke-linecap="round"/><path d="' + d + '" stroke="#38b85a" stroke-width="' + (sc * 2) + '" fill="none" stroke-linecap="round"/><path d="' + d + '" stroke="#9af090" stroke-width="' + f(sc * 0.6) + '" fill="none" stroke-linecap="round" opacity=".6" transform="translate(-1 0)"/>';
    }
    function lantern(x, y, sc) {
      return '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')">' +
        '<circle cx="0" cy="-62" r="34" fill="url(#' + ID('lamp') + ')"/>' +
        '<path d="M-3 0V-46" stroke="' + O + '" stroke-width="7" stroke-linecap="round"/><path d="M-3 0V-46" stroke="#6a7a84" stroke-width="3.6" stroke-linecap="round"/>' +
        '<path d="M-10 0H10L6 -6H-6Z" fill="#6a7a84" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>' +
        '<path d="M-14 -48H14L10 -44H-10Z" fill="#8a9aa4" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>' +
        '<circle cx="0" cy="-62" r="15" fill="url(#' + ID('glass') + ')" stroke="' + O + '" stroke-width="2.8"/>' +
        '<path d="M-15 -62H15M0 -77V-47" stroke="' + O + '" stroke-width="1.6" opacity=".7"/>' +
        '<ellipse cx="-5" cy="-68" rx="4.6" ry="2.6" fill="#fff" opacity=".85" transform="rotate(-30 -5 -68)"/>' +
        '<path d="M-6 -78Q0 -86 6 -78L4 -76H-4Z" fill="#8a9aa4" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/>' +
        '<circle cx="0" cy="-89" r="2.6" fill="none" stroke="' + O + '" stroke-width="1.8"/>' +
        '</g>';
    }
    function statue(x, y, sc) {
      return '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')">' +
        '<path d="M-26 0H26V-10H22V-16H-22V-10H-26Z" fill="url(#' + ID('marble') + ')" stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round"/>' +
        '<path d="M-14 -16L-18 -66Q-16 -78 -8 -80H8Q16 -78 18 -66L14 -16Z" fill="#e4f2ee" stroke="' + O + '" stroke-width="2.8" stroke-linejoin="round"/>' +
        '<path d="M6 -16L10 -60Q12 -72 8 -78H16Q20 -76 18 -66L14 -16Z" fill="#a8c8c4" opacity=".8"/>' +
        '<path d="M-6 -20L-8 -60M0 -20V-64M4 -20L4 -58" stroke="#9ec4c0" stroke-width="1.6"/>' +
        '<path d="M-18 -66Q-30 -56 -28 -40Q-24 -44 -20 -40L-14 -60Z" fill="#e4f2ee" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>' +
        '<path d="M-8 -80Q-4 -92 0 -90L2 -82Z" fill="#e4f2ee" stroke="' + O + '" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<path d="M-12 -30Q-2 -38 8 -30L10 -22H-12Z" fill="#3aa860" opacity=".8"/>' +
        '<path d="M-20 -10Q-10 -16 0 -10" stroke="#3aa860" stroke-width="3.4" fill="none" opacity=".8"/>' +
        '<circle cx="-14" cy="-50" r="3" fill="#ffc0e0" stroke="' + O + '" stroke-width="1.4"/><circle cx="12" cy="-36" r="2.4" fill="#ffc0e0" stroke="' + O + '" stroke-width="1.4"/>' +
        '</g>';
    }
    function arch(x, y, sc) {
      return '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')">' +
        '<path d="M-44 0V-70H-30V-70Q0 -108 30 -70V0H44V-78Q0 -128 -44 -78Z" fill="url(#' + ID('marble') + ')" stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round" opacity="0"/>' +
        '</g>';
    }
    // --- back row props (behind path)
    s += column(46, 200, 58, 16, true, -3) + column(74, 198, 40, 14, true, 4);
    s += statue(316, 204, 1.05);
    s += column(352, 200, 66, 17, false, 0) + column(126, 200, 32, 13, true, -6);
    s += lantern(160, 206, 0.9) + lantern(250, 204, 0.8);
    // fallen column
    s += '<g transform="translate(206 208) rotate(-4)"><path d="M-38 0V-15H38V0Z" fill="url(#' + ID('marble') + ')" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/><path d="M-30 -15V0M-14 -15V0M2 -15V0M18 -15V0" stroke="#9ec4c0" stroke-width="1.4"/><ellipse cx="-38" cy="-7.5" rx="4" ry="7.5" fill="#eafaf4" stroke="' + O + '" stroke-width="2.4"/><path d="M-4 0Q10 -8 20 -6Q30 -4 38 0Z" fill="#3aa860" opacity=".8"/></g>';
    s += coral(100, 212, 0.9, '#ff7aa8', '#ffd0e8') + coral(286, 210, 0.8, '#ff9a4a', '#ffe0a0') + brainCoral(236, 214, 0.9, '#ff9ab8') + brainCoral(30, 216, 0.8, '#b58cff');
    s += kelp(20, 214, 46, 2.2, 1) + kelp(28, 216, 30, 1.6, -1) + kelp(376, 216, 50, 2.2, -1) + kelp(384, 214, 32, 1.6, 1) + kelp(190, 212, 30, 1.4, 1);
    // --- mosaic path
    var PATH = 'M-10 224Q100 217 200 224T410 222V268Q300 275 200 268T-10 270Z';
    s += '<path d="' + PATH + '" fill="#1a5c70"/>';
    s += '<clipPath id="' + ID('pclip') + '"><path d="' + PATH + '"/></clipPath><g clip-path="url(#' + ID('pclip') + ')">';
    var pal = ['#f2f8f0', '#5ac0cc', '#2d8fb3', '#e8c66a', '#f8ecc4', '#3b6fa8', '#e8f4f0'];
    var row, col;
    for (row = 0; row < 4; row++) {
      var ty = 216 + row * 14, off = (row % 2) * 9;
      for (col = -1; col < 26; col++) {
        var tx = col * 17 + off, cIdx;
        if (row === 0 || row === 3) cIdx = (col % 2) ? 5 : 3;
        else cIdx = (col + row) % 3 === 0 ? 0 : ((col + row) % 3 === 1 ? 1 : (r() > 0.5 ? 4 : 6));
        if (r() > 0.93) { s += '<path d="M' + tx + ' ' + ty + 'h15v12h-15z" fill="#3c8a86"/>'; continue; }
        s += '<path d="M' + f(tx + r()) + ' ' + f(ty + r()) + 'h14.4v12.4h-14.4z" fill="' + pal[cIdx] + '" stroke="#2b1d14" stroke-width="1.1" stroke-linejoin="round" opacity=".95"/>';
        s += '<path d="M' + f(tx + 2) + ' ' + f(ty + 2.6) + 'h5" stroke="#fff" stroke-width="1.3" opacity=".45" stroke-linecap="round"/>';
      }
    }
    // cracks
    for (i = 0; i < 9; i++) {
      var cx = r() * 400, cy = 226 + r() * 34;
      s += '<path d="M' + f(cx) + ' ' + f(cy) + 'l5 6l-3 6l6 7" stroke="#1a3a44" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    }
    // sand drifts
    s += '<ellipse cx="60" cy="266" rx="34" ry="5" fill="#8fd8c0" opacity=".8"/><ellipse cx="300" cy="222" rx="30" ry="4" fill="#8fd8c0" opacity=".8"/>';
    // shallow water over the path
    s += '<rect x="-10" y="216" width="420" height="60" fill="url(#' + ID('water') + ')"/>';
    for (i = 0; i < 14; i++) {
      var wx = r() * 400, wy = 226 + r() * 40;
      s += '<path d="M' + f(wx) + ' ' + f(wy) + 'q10 -4 20 0t20 0" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="' + f(0.25 + r() * 0.3) + '"/>';
    }
    s += '</g>';
    s += '<path d="M-10 224Q100 217 200 224T410 222" fill="none" stroke="#dffffa" stroke-width="2.2" opacity=".8"/>';
    s += '<path d="M-10 270Q100 274 200 268T410 270" fill="none" stroke="#2b1d14" stroke-width="2" opacity=".6"/>';
    // --- foreground
    s += coral(24, 296, 1.5, '#ff5a8a', '#ffc0dc') + coral(376, 298, 1.6, '#ff9a4a', '#ffe0a0') + brainCoral(78, 292, 1.3, '#ff9ab8') + brainCoral(330, 294, 1.2, '#7ae0c0');
    s += kelp(46, 300, 60, 3, -1) + kelp(58, 302, 40, 2.2, 1) + kelp(352, 302, 64, 3, 1) + kelp(340, 300, 40, 2.2, -1);
    s += '<g transform="translate(220 294)"><path d="M-16 0Q-18 -14 0 -16Q18 -14 16 0Z" fill="#ffc2d8" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/><path d="M-10 -2L-9 -12M-3 -2L-3 -15M4 -2L3 -15M10 -2L9 -12" stroke="#c0587a" stroke-width="1.6"/></g>';
    s += '<g transform="translate(140 290)"><path d="M0 0l-6 -14l6 -4l6 4z" fill="#f4b04a" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/><path d="M-5 -8H5" stroke="' + O + '" stroke-width="1.4"/></g>';
    // sea-glass glints + bubbles
    for (i = 0; i < 12; i++) s += '<circle cx="' + f(r() * 400) + '" cy="' + f(196 + r() * 100) + '" r="' + f(1 + r() * 2.4) + '" fill="#eaffff" opacity="' + f(0.3 + r() * 0.4) + '" stroke="#fff" stroke-width=".6"/>';
    // caustic haze
    for (i = 0; i < 6; i++) s += '<ellipse cx="' + f(r() * 400) + '" cy="' + f(200 + r() * 90) + '" rx="' + f(40 + r() * 40) + '" ry="' + f(4 + r() * 5) + '" fill="#dffffa" opacity=".1"/>';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice">' + s + '</svg>';
  }

  window.SCENES.ruins = { name: 'Sunken Ruins', sky: '#2fa7b5', svg: ruins };
})();

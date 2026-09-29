/* Hero Go! — Itzcoatl, The Jaguar Warrior (Ocelotl)
 * Hand-authored inline SVG. See ART_CONTRACT.md.
 * Detail pass: feathers are shared <use> symbols (keeps markup small), rich materials & micro-story props.
 */
(function () {
  var O = '#2b1d14';            // outline
  var C = {
    fur: '#f2b544', furS: '#d98d2b', furL: '#ffd98a', spot: '#3a2414', spotC: '#c7741f',
    skin: '#c8845a', skinS: '#a9653f', skinL: '#e0a377', blush: '#e57a6a',
    hair: '#1d1418',
    gold: '#f5c542', goldS: '#c98f1c', goldL: '#fff1a8',
    jade: '#2fbf8f', jadeS: '#147a5c', jadeL: '#a8f0d0',
    q1: '#0f9d6e', q2: '#1ec8a0', q3: '#1f6fb8', q4: '#0b6b58', q5: '#2b4fa0',
    red: '#c0392b', redS: '#8e2419', redL: '#e8604f', yel: '#f3c436',
    cot: '#f4ead2', cotS: '#d9c9a4', stitch: '#a89468',
    obs: '#17131f', obsL: '#8f98d0',
    wood: '#8a5a2b', woodS: '#5e3a1a', woodL: '#b8834a',
    mouth: '#7a1f2a', tongue: '#d8606a'
  };

  function f(n) { return Math.round(n * 10) / 10; }
  function f2(n) { return Math.round(n * 100) / 100; }

  // deterministic pseudo random
  function rng(seed) {
    var s = seed;
    return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  }

  // small svg helpers
  function P(d, fill, stroke, sw, extra) {
    return '<path d="' + d + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="' + sw + '" stroke-linejoin="round"' : '') + (extra ? ' ' + extra : '') + '/>';
  }
  function L(d, stroke, sw, op, extra) {
    return '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + sw + '" stroke-linecap="round"' + (op != null && op !== 1 ? ' opacity="' + op + '"' : '') + (extra ? ' ' + extra : '') + '/>';
  }
  function Ci(x, y, r, fill, stroke, sw, extra) {
    return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + r + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="' + sw + '"' : '') + (extra ? ' ' + extra : '') + '/>';
  }
  function El(x, y, rx, ry, fill, extra) {
    return '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>';
  }

  var LITE = false;   // portrait: skip everything that is cropped away / too fine to see
  // short fur strokes scattered in a box
  function furTicks(x0, y0, w, h, n, seed, ang, len, col, op, sw) {
    if (LITE) return '';
    var r = rng(seed), d = '', i;
    for (i = 0; i < n; i++) {
      var x = x0 + r() * w, y = y0 + r() * h, a = (ang + (r() - 0.5) * 50) * Math.PI / 180, l = len * (0.6 + r() * 0.8);
      d += 'M' + f(x) + ' ' + f(y) + 'l' + f(Math.cos(a) * l) + ' ' + f(Math.sin(a) * l);
    }
    return L(d, col, sw || 0.8, op == null ? 0.6 : op);
  }

  // jaguar rosette: ring of broken blobs with warm, darker-cored centre
  function rosette(x, y, s, seed) {
    var r = rng(seed), out = '';
    out += '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(s * 0.66) + '" ry="' + f(s * 0.52) + '" transform="rotate(' + f(r() * 60 - 30) + ' ' + f(x) + ' ' + f(y) + ')" fill="' + C.spotC + '" opacity="0.9"/>';
    if (!LITE) out += '<ellipse cx="' + f(x + s * 0.08) + '" cy="' + f(y + s * 0.06) + '" rx="' + f(s * 0.3) + '" ry="' + f(s * 0.22) + '" fill="#9a5216" opacity="0.6"/>';
    var n = LITE ? 4 : 4 + Math.floor(r() * 3), rot = r() * 360;
    for (var i = 0; i < n; i++) {
      var a = (rot + i * (360 / n) + r() * 18) * Math.PI / 180;
      var cx = x + Math.cos(a) * s, cy = y + Math.sin(a) * s * 0.85;
      var deg = (a * 180 / Math.PI) + 90;
      out += '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(s * (0.36 + r() * 0.16)) + '" ry="' + f(s * (0.2 + r() * 0.08)) +
        '" transform="rotate(' + f(deg) + ' ' + f(cx) + ' ' + f(cy) + ')" fill="' + C.spot + '"/>';
    }
    if (r() > 0.55) out += '<circle cx="' + f(x + s * 1.5) + '" cy="' + f(y - s * 0.9) + '" r="' + f(s * 0.22) + '" fill="' + C.spot + '"/>';
    return out;
  }
  function dot(x, y, r) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + C.spot + '"/>';
  }
  function rivet(x, y, r) {
    return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + r + '" fill="' + C.gold + '" stroke="' + O + '" stroke-width="0.7"/><circle cx="' + f(x - r * 0.3) + '" cy="' + f(y - r * 0.3) + '" r="' + f2(r * 0.32) + '" fill="#fff" opacity="0.9"/>';
  }
  function bell(x, y, r) {
    return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + r + '" fill="url(#aztec-gold-' + FU + ')" stroke="' + O + '" stroke-width="0.9"/>' +
      '<path d="M' + f(x - r * 0.6) + ' ' + f(y + r * 0.25) + ' L' + f(x + r * 0.6) + ' ' + f(y + r * 0.25) + '" stroke="' + O + '" stroke-width="0.6"/>' +
      '<circle cx="' + f(x) + '" cy="' + f(y + r * 0.62) + '" r="0.4" fill="' + O + '"/>' +
      '<circle cx="' + f(x - r * 0.35) + '" cy="' + f(y - r * 0.4) + '" r="' + f2(r * 0.26) + '" fill="#fff" opacity="0.9"/>';
  }

  // ---------- shared quetzal feather (defined once per uid, drawn with <use>) ----------
  var FW = [13, 16.5, 21];
  function edgePt(W, t) {
    // right edge bezier: (0,0) c(W*.9,-22) c(W*1.05,-72) (0,-100)
    var m = 1 - t;
    return [3 * m * m * t * W * 0.9 + 3 * m * t * t * W * 1.05, -(3 * m * m * t * 22 + 3 * m * t * t * 72 + t * t * t * 100)];
  }
  function featherDef(u, k) {
    var W = FW[k], id = 'aztec-fs' + k + '-' + u;
    var body = 'M0 0 C ' + f(W * 0.9) + ' -22, ' + f(W * 1.05) + ' -72, 0 -100 C ' + f(-W * 1.05) + ' -72, ' + f(-W * 0.9) + ' -22, 0 0 Z';
    var half = 'M0 0 C ' + f(W * 0.9) + ' -22, ' + f(W * 1.05) + ' -72, 0 -100 Z';
    var tip1 = 'M' + f(-W * 0.68) + ' -52 C ' + f(-W * 0.3) + ' -44, ' + f(W * 0.3) + ' -44, ' + f(W * 0.68) + ' -52 C ' + f(W * 0.62) + ' -76, ' + f(W * 0.36) + ' -92, 0 -100 C ' + f(-W * 0.36) + ' -92, ' + f(-W * 0.62) + ' -76, ' + f(-W * 0.68) + ' -52 Z';
    var tip2 = 'M' + f(-W * 0.58) + ' -70 C ' + f(-W * 0.3) + ' -63, ' + f(W * 0.3) + ' -63, ' + f(W * 0.58) + ' -70 C ' + f(W * 0.46) + ' -86, ' + f(W * 0.26) + ' -96, 0 -100 C ' + f(-W * 0.26) + ' -96, ' + f(-W * 0.46) + ' -86, ' + f(-W * 0.58) + ' -70 Z';
    var mid = 'M' + f(-W * 0.6) + ' -30 C ' + f(-W * 0.3) + ' -23, ' + f(W * 0.3) + ' -23, ' + f(W * 0.6) + ' -30 L ' + f(W * 0.68) + ' -56 C ' + f(W * 0.3) + ' -49, ' + f(-W * 0.3) + ' -49, ' + f(-W * 0.68) + ' -56 Z';
    var bl = '', bd = '', i, t, e, y0;
    for (i = 1; i <= 8; i++) {
      t = 0.1 + i * 0.1;
      e = edgePt(W, t);
      y0 = e[1] + 9 + i * 0.6;
      bl += 'M0 ' + f(y0) + ' L' + f(e[0] * 0.86) + ' ' + f(e[1] + 1) + ' M0 ' + f(y0 + 2) + ' L' + f(-e[0] * 0.86) + ' ' + f(e[1] + 3) + ' ';
    }
    var notch = 'M' + f(W * 0.6) + ' -40 l-3 -3 l0.6 4.5 M' + f(-W * 0.6) + ' -58 l3 -3 l-0.6 4.5 M' + f(W * 0.42) + ' -80 l-2.4 -1.5';
    return '<g id="' + id + '">' +
      '<path d="' + body + '" stroke-linejoin="round"/>' +
      '<path d="' + mid + '" fill="#1ec8a0" opacity="0.32" stroke="none"/>' +
      '<path d="' + tip1 + '" fill="currentColor" opacity="0.5" stroke="none"/>' +
      '<path d="' + tip2 + '" fill="currentColor" opacity="0.85" stroke="none"/>' +
      '<path d="' + half + '" fill="#000" opacity="0.16" stroke="none"/>' +
      '<path d="M' + f(-W * 0.62) + ' -18 C ' + f(-W * 0.82) + ' -40, ' + f(-W * 0.7) + ' -62, ' + f(-W * 0.3) + ' -86" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity="0.28"/>' +
      '<path d="' + bd + bl + '" fill="none" stroke="#fff" stroke-opacity="0.34" stroke-width="1.5" stroke-linecap="round"/>' +
      '<path d="' + notch + '" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M1.6 -4 L1.6 -92" fill="none" stroke="#000" stroke-opacity="0.28" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M0 -3 L0 -93" fill="none" stroke="#f2fff8" stroke-width="2" stroke-linecap="round" opacity="0.95"/>' +
      '<path d="M0 -3 L0 -14" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.5"/>' +
      '<path d="' + body + '" fill="none" stroke-linejoin="round"/>' +
      '</g>';
  }

  // feather: base at (x,y), pointing in direction `ang` (0 = up, +cw), length len, half-width w
  function feather(x, y, len, ang, w, col, tip, rachis, u) {
    var r = w / len, k = r < 0.145 ? 0 : (r < 0.19 ? 1 : 2), s = len / 100;
    return '<use href="#aztec-fs' + k + '-' + FU + '" transform="translate(' + f(x) + ' ' + f(y) + ') rotate(' + f(ang) + ') scale(' + f2(s) + ')" fill="' + col + '" color="' + tip + '" stroke="' + O + '" stroke-width="' + f(2.2 / s) + '"/>';
  }
  var FU = '0';   // current uid (set by hero()/portrait() before building parts)

  // xicalcoliuhqui step-fret band: n interlocking units starting at (x,y), unit width u
  function fret(x, y, n, u, col, sw) {
    var out = '', k = u / 12;
    for (var i = 0; i < n; i++) {
      var ox = x + i * u;
      var pts = [[0, 12], [0, 9], [3, 9], [3, 6], [6, 6], [6, 1.2], [11, 1.2], [11, 7], [8.6, 7], [8.6, 4]];
      var d = pts.map(function (p, j) { return (j ? 'L' : 'M') + f2(ox + p[0] * k) + ' ' + f2(y + p[1] * k); }).join(' ');
      out += '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + sw + '" stroke-linejoin="miter" stroke-linecap="square"/>';
    }
    return out;
  }

  // ---------- key shapes ----------
  var DOME = 'M60 94 C 47 72, 56 44, 82 33 C 104 24, 130 29, 143 43 C 148 49, 151 55, 153 60 C 160 61, 164 70, 158 77 C 153 81, 146 81, 141 79 C 132 77, 124 73, 114 72 C 100 70, 85 71, 75 79 C 69 83, 64 88, 60 94 Z';
  var TORSO = 'M72 128 C 68 150, 70 175, 75 194 L 115 194 C 120 175, 122 150, 118 128 C 106 124, 84 124, 72 128 Z';
  var VEST = 'M73 138 C 71 158, 72 176, 75 191 L 115 191 C 118 176, 119 158, 117 138 C 108 144, 100 146, 95 146 C 88 146, 80 143, 73 138 Z';
  var LEGL = 'M79 190 L 93 190 L 92 222 L 80 222 Z';
  var LEGR = 'M98 190 L 112 190 L 111 222 L 99 222 Z';
  var ARMW = 'M110 134 C 120 132, 128 140, 132 150 C 136 157, 140 163, 139 168 L 128 172 C 124 164, 118 158, 112 152 C 106 146, 104 138, 110 134 Z';
  var ARMS = 'M80 134 C 70 132, 62 140, 60 150 C 58 158, 58 164, 60 170 L 70 170 C 70 162, 72 156, 76 150 C 82 144, 86 138, 80 134 Z';

  function defs(u) {
    var d = '<defs>' +
      '<linearGradient id="aztec-fur-' + u + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + C.furL + '"/><stop offset="0.45" stop-color="' + C.fur + '"/><stop offset="1" stop-color="' + C.furS + '"/></linearGradient>' +
      '<linearGradient id="aztec-gold-' + u + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + C.goldL + '"/><stop offset="0.5" stop-color="' + C.gold + '"/><stop offset="1" stop-color="' + C.goldS + '"/></linearGradient>' +
      '<radialGradient id="aztec-jade-' + u + '" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="' + C.jadeL + '"/><stop offset="0.45" stop-color="' + C.jade + '"/><stop offset="1" stop-color="' + C.jadeS + '"/></radialGradient>' +
      '<radialGradient id="aztec-skin-' + u + '" cx="0.55" cy="0.4" r="0.7"><stop offset="0" stop-color="' + C.skinL + '"/><stop offset="0.6" stop-color="' + C.skin + '"/><stop offset="1" stop-color="' + C.skinS + '"/></radialGradient>' +
      '<linearGradient id="aztec-obs-' + u + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a5878"/><stop offset="0.35" stop-color="' + C.obs + '"/><stop offset="1" stop-color="#050408"/></linearGradient>' +
      '<linearGradient id="aztec-wood-' + u + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + C.woodS + '"/><stop offset="0.35" stop-color="' + C.woodL + '"/><stop offset="1" stop-color="' + C.wood + '"/></linearGradient>' +
      '<linearGradient id="aztec-cot-' + u + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + C.cotS + '"/><stop offset="0.35" stop-color="#fffaf0"/><stop offset="1" stop-color="' + C.cotS + '"/></linearGradient>' +
      '<radialGradient id="aztec-iris-' + u + '" cx="0.5" cy="0.35" r="0.75"><stop offset="0" stop-color="#f0c070"/><stop offset="0.5" stop-color="#b8742c"/><stop offset="1" stop-color="#5e3210"/></radialGradient>' +
      '<radialGradient id="aztec-jeye-' + u + '" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="#fff59a"/><stop offset="0.55" stop-color="#e2cd3a"/><stop offset="1" stop-color="#9a8a14"/></radialGradient>' +
      '<radialGradient id="aztec-mouth-' + u + '" cx="0.5" cy="0.75" r="0.75"><stop offset="0" stop-color="#9a2c38"/><stop offset="0.6" stop-color="' + C.mouth + '"/><stop offset="1" stop-color="#3c0d16"/></radialGradient>' +
      '<linearGradient id="aztec-ao-' + u + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.38"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="aztec-gloss-' + u + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<pattern id="aztec-quilt-' + u + '" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="translate(1 2)">' +
      '<circle cx="4" cy="0" r="2.1" fill="#fff" opacity="0.55"/><circle cx="4" cy="8" r="2.1" fill="#fff" opacity="0.55"/><circle cx="0" cy="4" r="2.1" fill="#fff" opacity="0.55"/><circle cx="8" cy="4" r="2.1" fill="#fff" opacity="0.55"/>' +
      '<path d="M0 0L8 8M8 0L0 8" stroke="' + C.stitch + '" stroke-width="0.9" stroke-dasharray="1.5 1.2" fill="none"/>' +
      '<path d="M4 4.6L5.8 6.4M4 3.4L2.2 1.6" stroke="#8a7040" stroke-width="0.9" opacity="0.28"/>' +
      '</pattern>' +
      '<pattern id="aztec-twill-' + u + '" width="2.6" height="2.6" patternUnits="userSpaceOnUse"><path d="M0 2.6L2.6 0" stroke="#9c8850" stroke-width="0.5" opacity="0.32"/><path d="M0 0.6L0.6 0M2 2.6L2.6 2" stroke="#9c8850" stroke-width="0.5" opacity="0.32"/></pattern>' +
      '<pattern id="aztec-rtwill-' + u + '" width="2.4" height="2.4" patternUnits="userSpaceOnUse"><path d="M0 2.4L2.4 0" stroke="#ffb0a0" stroke-width="0.55" opacity="0.4"/><path d="M0 0L2.4 2.4" stroke="#5a0f08" stroke-width="0.4" opacity="0.28"/></pattern>' +
      '<pattern id="aztec-mosaic-' + u + '" width="7" height="5" patternUnits="userSpaceOnUse">' +
      '<path d="M0 5 C0 2.6 7 2.6 7 5 M-3.5 2.5 C-3.5 0.1 3.5 0.1 3.5 2.5 M3.5 2.5 C3.5 0.1 10.5 0.1 10.5 2.5" stroke="#000" stroke-opacity="0.38" stroke-width="0.8" fill="none"/>' +
      '<path d="M1.4 4 C2.6 3 4.4 3 5.6 4 M-2 1.6 C-1 0.9 1 0.9 2 1.6 M5 1.6 C6 0.9 8 0.9 9 1.6" stroke="#fff" stroke-opacity="0.42" stroke-width="0.7" fill="none"/>' +
      '</pattern>' +
      '<clipPath id="aztec-dome-' + u + '"><path d="' + DOME + '"/></clipPath>' +
      '<clipPath id="aztec-torso-' + u + '"><path d="' + TORSO + '"/></clipPath>' +
      '<clipPath id="aztec-vest-' + u + '"><path d="' + VEST + '"/></clipPath>' +
      '<clipPath id="aztec-legs-' + u + '"><path d="' + LEGL + ' ' + LEGR + '"/></clipPath>' +
      '<clipPath id="aztec-armw-' + u + '"><path d="' + ARMW + '"/></clipPath>' +
      '<clipPath id="aztec-arms-' + u + '"><path d="' + ARMS + '"/></clipPath>' +
      '<clipPath id="aztec-shield-' + u + '"><ellipse cx="60" cy="172" rx="21" ry="24"/></clipPath>' +
      '<clipPath id="aztec-face-' + u + '"><ellipse cx="100" cy="97" rx="27" ry="25"/></clipPath>' +
      '<clipPath id="aztec-flap-' + u + '"><path d="M88 191 L 104 191 L 106.5 216 C 100 218, 93 218, 85.5 216 Z"/></clipPath>' +
      featherDef(u, 0) + featherDef(u, 1) + featherDef(u, 2) +
      '</defs>';
    return d;
  }
  // ---------- parts ----------
  function shadow(anim) {
    return '<g' + (anim ? ' class="part-shadow"' : '') + '><ellipse cx="96" cy="229" rx="50" ry="7" fill="#000" opacity="0.2"/><ellipse cx="96" cy="229" rx="32" ry="4.5" fill="#000" opacity="0.14"/>' +
      '<ellipse cx="88" cy="228.6" rx="14" ry="2.6" fill="#000" opacity="0.18"/><ellipse cx="108" cy="228.6" rx="14" ry="2.6" fill="#000" opacity="0.18"/></g>';
  }

  function cape(u, anim) {
    var out = '<g' + (anim ? ' class="part-cape"' : '') + '>';
    var cx = 84, cy = 150, i, a;
    var back = [C.q4, C.q5, C.q4, C.q3, C.q4, C.q5, C.q4, C.q3, C.q4, C.q5, C.q4, C.q3];
    for (i = 0; i < (LITE ? 0 : 12); i++) {
      out += feather(cx, cy, 70, -122 + i * 12.5, 8, back[i], C.q4, '#dcfff0');
    }
    var outer = [C.q1, C.q3, C.q2, C.q5, C.q1, C.q2, C.q3, C.q1, C.q2, C.q5, C.q1, C.q3, C.q2];
    var otip = [C.q3, C.q2, C.q5, C.q2, C.q3, C.q5, C.q1, C.q3, C.q5, C.q2, C.q3, C.q1, C.q5];
    for (i = 0; i < 13; i++) {
      a = -128 + i * 12.5;
      out += feather(cx, cy, 66 + (i % 2) * 5, a, 8.5, outer[i], otip[i], '#dcfff0');
    }
    for (i = 0; i < 12; i++) {
      a = -122 + i * 13;
      out += feather(cx, cy, 44, a, 6.5, i % 2 ? C.red : C.redL, i % 2 ? C.redS : C.yel, '#ffd6c8');
    }
    for (i = 0; i < 11; i++) {
      a = -116 + i * 13.5;
      out += feather(cx, cy, 28, a, 5, C.yel, i % 2 ? C.goldS : C.redL, '#fff7cc');
    }
    // binding band where feathers are lashed
    out += '<path d="M62 146 C 72 138, 96 138, 106 146" fill="none" stroke="' + O + '" stroke-width="6" stroke-linecap="round"/>';
    out += '<path d="M62 146 C 72 138, 96 138, 106 146" fill="none" stroke="' + C.red + '" stroke-width="3.6" stroke-linecap="round"/>';
    out += '<path d="M62 146 C 72 138, 96 138, 106 146" fill="none" stroke="' + C.yel + '" stroke-width="1" stroke-dasharray="2 2"/>';
    out += '</g>';
    return out;
  }

  function sandal(x) {
    var r = '';
    // heel guard
    r += P('M' + (x - 1) + ' 215 C ' + (x - 3) + ' 219, ' + (x - 3) + ' 224, ' + (x - 1) + ' 227 L ' + (x + 5) + ' 227 L ' + (x + 5) + ' 216 Z', C.wood, O, 2.2);
    r += L('M' + (x - 1) + ' 218 L ' + (x + 4) + ' 218 M' + (x - 1.5) + ' 221 L ' + (x + 4) + ' 221 M' + (x - 1.5) + ' 224 L ' + (x + 4) + ' 224', C.woodS, 0.9, 1, 'stroke-dasharray="1.4 1"');
    r += L('M' + (x - 0.6) + ' 217 C ' + (x - 2) + ' 220, ' + (x - 2) + ' 223, ' + (x - 0.6) + ' 225.5', C.woodL, 0.9, 0.7);
    // foot (skin)
    r += P('M' + (x + 2) + ' 219 L ' + (x + 13) + ' 219 C ' + (x + 17) + ' 220, ' + (x + 19) + ' 222, ' + (x + 19) + ' 225 L ' + (x + 2) + ' 225 Z', C.skin, O, 2.2);
    r += P('M' + (x + 3) + ' 224 L ' + (x + 18.5) + ' 224 L ' + (x + 18.5) + ' 225 L ' + (x + 3) + ' 225 Z', C.skinS, null, 0, 'opacity="0.6"');
    r += L('M' + (x + 16.2) + ' 222 L ' + (x + 16.2) + ' 224.6 M' + (x + 13.8) + ' 221.4 L ' + (x + 13.8) + ' 224.6', C.skinS, 0.8);
    r += El(x + 17.6, 222.6, 0.9, 0.6, '#f6e6cc', 'opacity="0.9"') + El(x + 15.2, 221.9, 0.8, 0.55, '#f6e6cc', 'opacity="0.9"') + El(x + 12.9, 221.4, 0.7, 0.5, '#f6e6cc', 'opacity="0.9"');
    r += L('M' + (x + 4) + ' 220.2 C ' + (x + 8) + ' 219.6, ' + (x + 11) + ' 219.6, ' + (x + 13) + ' 220.2', C.skinL, 0.9, 0.8);
    // sole
    r += P('M' + (x - 2) + ' 224.5 L ' + (x + 17) + ' 224.5 C ' + (x + 21) + ' 224.5, ' + (x + 22) + ' 228.5, ' + (x + 18) + ' 229 L ' + (x - 1.5) + ' 229 C ' + (x - 3.5) + ' 229, ' + (x - 3.5) + ' 224.5, ' + (x - 2) + ' 224.5 Z', C.woodS, O, 2.2);
    r += L('M' + x + ' 226.6 L ' + (x + 18) + ' 226.6', C.woodL, 0.8, 0.7);
    r += L('M' + (x + 4) + ' 227.9 L ' + (x + 6) + ' 227.9 M' + (x + 9) + ' 227.9 L ' + (x + 11) + ' 227.9 M' + (x + 14) + ' 227.9 L ' + (x + 16) + ' 227.9', '#000', 0.7, 0.35);
    // cross straps (woven, stitched, riveted)
    var cross = 'M' + (x + 5) + ' 219.5 L ' + (x + 11) + ' 225 M' + (x + 11) + ' 219.5 L ' + (x + 5) + ' 225';
    r += L(cross, O, 3.2);
    r += L(cross, C.wood, 2);
    r += L(cross, C.woodL, 0.8, 0.7, 'transform="translate(-0.4 -0.4)"');
    r += L(cross, O, 0.6, 0.5, 'stroke-dasharray="1 1"');
    r += rivet(x + 8, 222.3, 1);
    // mud
    r += El(x + 15, 227, 1.4, 0.8, '#5a3d22', 'opacity="0.7"') + El(x + 1, 227.6, 1.1, 0.7, '#5a3d22', 'opacity="0.7"') + Ci(x + 10, 226, 0.5, '#5a3d22', null, 0, 'opacity="0.75"');
    // ankle tie (twisted red cotton cord + tassel + gold bell)
    var tie = 'M' + (x - 2) + ' 214 C ' + (x + 4) + ' 216, ' + (x + 10) + ' 216, ' + (x + 14) + ' 214';
    r += L(tie, O, 4);
    r += L(tie, C.red, 2.2);
    r += L(tie, C.redS, 0.8, 0.8, 'stroke-dasharray="0.8 1.2"');
    r += L('M' + (x - 1) + ' 211 C ' + (x + 4) + ' 213, ' + (x + 10) + ' 213, ' + (x + 13) + ' 211', C.cot, 1.6, 0.9);
    r += L('M' + (x - 1) + ' 211.2 C ' + (x + 4) + ' 213.2, ' + (x + 10) + ' 213.2, ' + (x + 13) + ' 211.2', C.cotS, 0.7, 0.9, 'stroke-dasharray="0.9 1"');
    r += L('M' + (x + 12) + ' 215 C ' + (x + 14) + ' 217, ' + (x + 14) + ' 218.4, ' + (x + 15.2) + ' 219.4 M' + (x + 12) + ' 215 C ' + (x + 13) + ' 218, ' + (x + 12) + ' 219.5, ' + (x + 12.6) + ' 221', C.redS, 1.3);
    r += bell(x + 15.6, 220.4, 1.7);
    r += Ci(x + 12, 215, 1.4, C.gold, O, 0.8);
    return r;
  }

  function legs(u) {
    var s = '';
    s += '<path d="' + LEGL + '" fill="url(#aztec-fur-' + u + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<path d="' + LEGR + '" fill="url(#aztec-fur-' + u + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<g clip-path="url(#aztec-legs-' + u + ')">' +
      rosette(84, 200, 3.2, 3) + rosette(89, 213, 3, 7) + dot(81, 208, 1.1) + dot(91, 203, 1) + dot(84, 219, 1) +
      rosette(103, 202, 3.2, 11) + rosette(108, 214, 3, 13) + dot(101, 211, 1.1) + dot(110, 197, 1) + dot(103, 219, 1) +
      furTicks(79, 192, 14, 28, 14, 5, 92, 2.6, C.furS, 0.7, 0.8) + furTicks(98, 192, 14, 28, 14, 9, 92, 2.6, C.furS, 0.7, 0.8) +
      furTicks(83, 194, 10, 26, 8, 15, 90, 2.4, C.furL, 0.7, 0.7) + furTicks(102, 194, 10, 26, 8, 17, 90, 2.4, C.furL, 0.7, 0.7) +
      '<rect x="79" y="190" width="4" height="34" fill="#000" opacity="0.12"/><rect x="98" y="190" width="4" height="34" fill="#000" opacity="0.12"/>' +
      '<rect x="90" y="190" width="3" height="34" fill="' + C.furL + '" opacity="0.4"/><rect x="109" y="190" width="3" height="34" fill="' + C.furL + '" opacity="0.4"/>' +
      '<rect x="78" y="190" width="36" height="11" fill="url(#aztec-ao-' + u + ')"/>' +
      '</g>';
    s += '<path d="' + LEGL + ' ' + LEGR + '" fill="none" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += sandal(80) + sandal(99);
    return s;
  }

  function torso(u) {
    var s = '';
    s += '<path d="' + TORSO + '" fill="url(#aztec-fur-' + u + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<g clip-path="url(#aztec-torso-' + u + ')">' + rosette(76, 134, 3, 21) + rosette(114, 133, 3, 23) +
      furTicks(72, 126, 12, 12, 8, 19, 100, 2.4, C.furS, 0.7) + furTicks(106, 126, 12, 12, 8, 29, 80, 2.4, C.furS, 0.7) + '</g>';
    // ichcahuipilli (quilted cotton armour)
    s += '<path d="' + VEST + '" fill="url(#aztec-cot-' + u + ')" stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round"/>';
    s += '<g clip-path="url(#aztec-vest-' + u + ')">' +
      '<rect x="70" y="136" width="50" height="58" fill="url(#aztec-twill-' + u + ')"/>' +
      '<rect x="70" y="136" width="50" height="58" fill="url(#aztec-quilt-' + u + ')"/>' +
      '<path d="M73 138 C 71 158, 72 176, 75 191 L 82 191 C 79 176, 79 158, 81 142 Z" fill="#8a7040" opacity="0.2"/>' +
      '<path d="M117 138 C 119 158, 118 176, 115 191 L 110 191 C 113 176, 113 158, 111 142 Z" fill="#8a7040" opacity="0.14"/>' +
      '<rect x="70" y="136" width="50" height="16" fill="url(#aztec-ao-' + u + ')"/>' +
      (LITE ? '' : L('M82 156 C 85 166, 84 176, 86 188 M103 154 C 100 165, 102 176, 100 188', '#8a7040', 1.2, 0.22)) +
      L('M83.4 158 C 86 167, 85 176, 87 186', '#fff', 1, 0.45) +
      // wear: dusty smudge + old stain
      '<ellipse cx="108" cy="176" rx="5" ry="2.2" transform="rotate(-25 108 176)" fill="#8a6a3a" opacity="0.28"/>' +
      '<path d="M78 170 C 80 172, 82 172, 83 175" stroke="#7a2a1a" stroke-width="1.6" stroke-linecap="round" opacity="0.4" fill="none"/>' +
      // repair patch with cross stitches
      '<g transform="rotate(-6 107 168)"><rect x="103" y="164" width="9" height="8" fill="#2fa07c" stroke="' + O + '" stroke-width="1" stroke-dasharray="2 1.2"/>' +
      L('M104.5 165.5 l2 2 m0 -2 l-2 2 M108 165.5 l2 2 m0 -2 l-2 2 M104.5 169.5 l2 2 m0 -2 l-2 2 M108 169.5 l2 2 m0 -2 l-2 2', '#f4ead2', 0.7) + '</g>' +
      '</g>';
    // neckline piping + side piping
    s += L('M73.5 138 C 80 143.5, 88 146.6, 95 146.6 C 102 146.6, 110 143.5, 116.5 138', O, 4.4);
    s += L('M73.5 138 C 80 143.5, 88 146.6, 95 146.6 C 102 146.6, 110 143.5, 116.5 138', C.red, 2.4);
    s += L('M73.5 138 C 80 143.5, 88 146.6, 95 146.6 C 102 146.6, 110 143.5, 116.5 138', C.yel, 0.8, 1, 'stroke-dasharray="2 1.6"');
    s += L('M75 141 C 73.5 158, 74 176, 77 190', C.redS, 1.8) + L('M115 141 C 116.5 158, 116 176, 113 190', C.redS, 1.8);
    s += L('M75 141 C 73.5 158, 74 176, 77 190', C.cot, 0.7, 0.9, 'stroke-dasharray="1.4 1.4"') + L('M115 141 C 116.5 158, 116 176, 113 190', C.cot, 0.7, 0.9, 'stroke-dasharray="1.4 1.4"');
    if (!LITE) {
    // padded hem (scallops with stitches + frayed threads)
    var hem = '';
    for (var k = 0; k < 7; k++) {
      var hx = 76 + k * 5.7;
      hem += '<path d="M' + f(hx) + ' 186 C ' + f(hx) + ' 192, ' + f(hx + 5.7) + ' 192, ' + f(hx + 5.7) + ' 186" fill="' + C.cot + '" stroke="' + O + '" stroke-width="1.6"/>';
      hem += L('M' + f(hx + 1) + ' 187.6 C ' + f(hx + 1.6) + ' 190, ' + f(hx + 4.1) + ' 190, ' + f(hx + 4.7) + ' 187.6', C.stitch, 0.6, 1, 'stroke-dasharray="0.9 0.8"');
      hem += L('M' + f(hx + 2.8) + ' 191.6 l0.2 1.6 M' + f(hx + 3.6) + ' 191.5 l0.7 1.2', C.cotS, 0.6);
    }
    s += hem;
    s += '<path d="M75 192 L 115 192 L 113.5 199 C 100 202.5, 90 202.5, 76.5 199 Z" fill="#000" opacity="0.16"/>';
    // side lacing with eyelets
    s += L('M78 150 L 81 153 M78 156 L 81 159 M78 162 L 81 165 M113 150 L 110 153 M113 156 L 110 159 M113 162 L 110 165', C.redS, 1.2);
    if (!LITE) s += L('M81 150 L 78 153 M81 156 L 78 159 M81 162 L 78 165 M110 150 L 113 153 M110 156 L 113 159 M110 162 L 113 165', C.red, 0.9);
    s += Ci(78, 150, 0.8, C.gold, O, 0.4) + Ci(78, 156, 0.8, C.gold, O, 0.4) + Ci(78, 162, 0.8, C.gold, O, 0.4) + Ci(113, 150, 0.8, C.gold, O, 0.4) + Ci(113, 156, 0.8, C.gold, O, 0.4) + Ci(113, 162, 0.8, C.gold, O, 0.4);
    s += L('M78.5 165 C 77 168, 78 170, 76.5 172', C.redS, 1.1);
    // sash (twill weave, gold thread)
    s += '<path d="M74 184 C 88 188, 104 188, 116 184 L 116 192 C 104 196, 88 196, 74 192 Z" fill="' + C.red + '" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>';
    s += '<path d="M74 184 C 88 188, 104 188, 116 184 L 116 192 C 104 196, 88 196, 74 192 Z" fill="url(#aztec-rtwill-' + u + ')"/>';
    s += '<path d="M74 190 C 88 194, 104 194, 116 190 L 116 192 C 104 196, 88 196, 74 192 Z" fill="#000" opacity="0.2"/>';
    s += L('M76 187 C 88 190.5, 104 190.5, 114 187', C.redL, 1.2);
    s += L('M76 190 C 88 193.5, 104 193.5, 114 190', C.yel, 0.9, 1, 'stroke-dasharray="2 1.5"');
    // maxtlatl front flap
    s += '<path d="M88 191 L 104 191 L 106.5 216 C 100 218, 93 218, 85.5 216 Z" fill="' + C.cot + '" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>';
    s += '<g clip-path="url(#aztec-flap-' + u + ')"><rect x="84" y="190" width="24" height="30" fill="url(#aztec-twill-' + u + ')"/>' +
      '<rect x="84" y="190" width="24" height="9" fill="url(#aztec-ao-' + u + ')"/>' +
      L('M96 197 C 95 202, 96 205, 95 208', '#8a7040', 1, 0.3) + L('M100.5 196 C 101.5 200, 101 203, 102 206', '#8a7040', 1, 0.25) + '</g>';
    s += '<path d="M88 191 L 91 191 L 89 216.8 L 85.5 216 Z" fill="' + C.cotS + '"/>';
    s += '<path d="M86.2 205 L 105.8 205 L 106.5 216 C 100 218, 93 218, 85.5 216 Z" fill="' + C.red + '" stroke="' + O + '" stroke-width="1.6" stroke-linejoin="round"/>';
    s += '<path d="M86.2 205 L 105.8 205 L 106.5 216 C 100 218, 93 218, 85.5 216 Z" fill="url(#aztec-rtwill-' + u + ')"/>';
    s += fret(87.6, 206.6, 3, 6, C.cot, 1.1);
    s += L('M86 204.2 L 106 204.2', C.q1, 1.3) + L('M86.6 205.5 L 105.6 205.5', C.yel, 0.6, 1, 'stroke-dasharray="1.2 1"');
    // fringe: threads with tiny jade/gold bead tips
    var fr = '', fx = [87.5, 90.5, 93.5, 96.5, 99.5, 102.5, 105];
    fx.forEach(function (x, i) { fr += 'M' + x + ' ' + (216.5 + (i % 2) * 0.4) + ' L ' + (x + (i % 2 ? 0.3 : -0.2)) + ' ' + (219.6 + (i % 3) * 0.4) + ' '; });
    s += L(fr, C.redS, 1.3);
    s += Ci(87.5, 220.4, 0.9, C.gold, O, 0.4) + Ci(93.5, 220.4, 0.9, C.jade, O, 0.4) + Ci(99.5, 220.4, 0.9, C.gold, O, 0.4) + Ci(105, 220, 0.9, C.jade, O, 0.4);
    // sash knot
    s += '<path d="M104 187 C 108 184, 112 186, 111 190 C 110 194, 105 193, 104 190 Z" fill="' + C.redL + '" stroke="' + O + '" stroke-width="1.6"/>';
    s += L('M105.6 187.6 C 107.6 186, 109.6 186.4, 110 188.6', '#fff', 0.9, 0.6) + L('M105.5 190 C 107 192, 109 192, 110 190', C.redS, 0.8, 0.7);
    s += '<path d="M109 192 C 112 197, 113 201, 111 205 L 108 204 C 109 200, 108 197, 106 193 Z" fill="' + C.red + '" stroke="' + O + '" stroke-width="1.4"/>';
    s += L('M108.2 194 C 110 198, 110.4 201, 109.4 203.4', C.redL, 0.7, 0.8) + L('M111 205 l0.6 2.6 M109.5 204.6 l0 2.8', C.redS, 1);
    // copal pouch on the hip cord
    s += L('M84 192 C 83 194, 83 195, 84 196', O, 2.6) + L('M84 192 C 83 194, 83 195, 84 196', C.red, 1.2);
    s += P('M80.6 196 C 80 200, 81 204, 84 205 C 87 204, 88 200, 87.4 196 Z', '#a8652f', O, 1.6);
    s += P('M80.6 196 C 82 198, 86 198, 87.4 196 C 86 194.6, 82 194.6, 80.6 196 Z', '#7a4520', O, 1.2);
    s += L('M82 199.6 C 83 202, 85 202, 86 199.6', '#5a3010', 0.7, 0.8, 'stroke-dasharray="1 0.8"') + L('M82 198 L 83.4 203', '#d8a06a', 0.7, 0.6) + Ci(84, 196.2, 0.9, C.gold, O, 0.5);
    }
    // jade bead necklace (graded beads on a cord)
    var beads = L('M75 131 C 82 145, 108 145, 115 131', O, 1.4);
    for (var b = 0; b <= 12; b++) {
      var t = b / 12, ang = Math.PI * (1 - t);
      var bx = 95 + Math.cos(ang) * 20, by = 131 + Math.sin(ang) * 11;
      var br = 2.1 + (1 - Math.abs(t - 0.5) * 2) * 1.0;
      beads += '<circle cx="' + f(bx) + '" cy="' + f(by) + '" r="' + f(br) + '" fill="url(#aztec-jade-' + u + ')" stroke="' + O + '" stroke-width="1.2"/>';
      if (b % 2) beads += '<circle cx="' + f(bx) + '" cy="' + f(by) + '" r="' + f(br - 0.6) + '" fill="' + C.q5 + '" opacity="0.16"/>';
      beads += '<circle cx="' + f(bx - br * 0.32) + '" cy="' + f(by - br * 0.36) + '" r="0.6" fill="#fff" opacity="0.9"/>';
    }
    s += beads;
    // jaguar-claw charm on a cord
    s += L('M107 139.6 C 109 141, 110 142, 110 143.6', O, 1.6) + L('M107 139.6 C 109 141, 110 142, 110 143.6', C.red, 0.7);
    s += P('M108.4 143.4 C 112.6 145, 113 150, 110.2 153.4 C 110.8 150, 109.6 147.6, 107.6 146 Z', '#f6ecd0', O, 1.2);
    s += L('M109.4 145 C 111 146.6, 111.2 148.6, 110.6 150.4', '#fff', 0.6, 0.9) + '<rect x="107.4" y="143.4" width="3.4" height="1.9" rx="0.8" fill="' + C.gold + '" stroke="' + O + '" stroke-width="0.7" transform="rotate(20 109 144)"/>';
    // gold pectoral disc
    s += L('M95 142 L 95 145', O, 2) + L('M92.6 141.4 L 95 145 L 97.4 141.4', O, 0.9, 0.6);
    s += Ci(95, 153, 9.6, 'url(#aztec-gold-' + u + ')', O, 2.2);
    s += Ci(95, 153, 8.2, 'none', C.goldL, 1.2, 'stroke-dasharray="0.1 2.2" stroke-linecap="round"');
    var rays = '', rays2 = '', rL = '';
    for (var rI = 0; rI < 16; rI++) {
      var ra = rI * Math.PI / 8, long = rI % 2 === 0;
      rays += 'M' + f(95 + Math.cos(ra) * 5.3) + ' ' + f(153 + Math.sin(ra) * 5.3) + ' L ' + f(95 + Math.cos(ra) * (long ? 7.6 : 6.6)) + ' ' + f(153 + Math.sin(ra) * (long ? 7.6 : 6.6)) + ' ';
      var rb = ra + 0.13;
      rL += 'M' + f(95 + Math.cos(rb) * 5.4) + ' ' + f(153 + Math.sin(rb) * 5.4) + ' L ' + f(95 + Math.cos(rb) * (long ? 7.2 : 6.3)) + ' ' + f(153 + Math.sin(rb) * (long ? 7.2 : 6.3)) + ' ';
    }
    s += L(rays, C.goldS, 1.2) + (LITE ? '' : L(rL, C.goldL, 0.5, 0.9));
    s += Ci(95, 153, 5.1, 'none', O, 0.7, 'opacity="0.75"');
    s += Ci(95, 153, 4.2, 'url(#aztec-jade-' + u + ')', O, 1.3);
    s += L('M92 153 L 98 153 M95 150 L 95 156', C.jadeS, 0.6, 0.6) + L('M92.6 150.6 L 97.4 155.4', C.jadeL, 0.5, 0.5);
    s += Ci(93.8, 151.7, 1.2, '#fff', null, 0, 'opacity="0.9"');
    s += L('M89 148 C 90.5 146.5, 92 146, 93.5 145.8', '#fff', 1.2, 0.8);
    s += L('M100 158.6 C 102 157, 103.4 155, 103.8 152.6', C.goldS, 1, 0.55);
    // bells + drop under the disc
    s += L('M90.6 161 L 90 165 M95 162.6 L 95 166.5 M99.4 161 L 100 165', O, 1);
    s += bell(90, 166.4, 1.7) + bell(95, 168, 1.8) + bell(100, 166.4, 1.7);
    return s;
  }

  // fang / tooth with shaded side, gloss line and gum base
  function fang(b1x, b1y, tx, ty, b2x, b2y, sw) {
    var mx = (b1x + b2x) / 2, my = (b1y + b2y) / 2;
    return '<path d="M' + b1x + ' ' + b1y + ' L' + tx + ' ' + ty + ' L' + b2x + ' ' + b2y + ' Z" fill="#fffbea" stroke="' + O + '" stroke-width="' + sw + '" stroke-linejoin="round"/>' +
      '<path d="M' + tx + ' ' + ty + ' L' + b2x + ' ' + b2y + ' L' + f(mx) + ' ' + f(my) + ' Z" fill="#d9caa0" opacity="0.7"/>' +
      L('M' + f(b1x + (tx - b1x) * 0.22 + (b2x - b1x) * 0.08) + ' ' + f(b1y + (ty - b1y) * 0.22) + ' L' + f(b1x + (tx - b1x) * 0.68) + ' ' + f(b1y + (ty - b1y) * 0.68), '#fff', 0.9, 0.95);
  }

  function head(u, anim) {
    var s = '<g' + (anim ? ' class="part-head"' : '') + '>';
    // quetzal headdress plumes (behind)
    var pl = [[-100, 56, C.q4, C.q5], [-88, 62, C.q3, C.q2], [-75, 62, C.q1, C.q3], [-62, 58, C.q2, C.q5], [-48, 52, C.q5, C.q2], [-34, 46, C.q1, C.q3], [-20, 42, C.q2, C.q5], [-6, 40, C.q3, C.q1]];
    pl.forEach(function (p, i) { s += feather(74, 42, p[1], p[0], 7.5, p[2], p[3], '#e6fff4'); });
    var pl2 = [[-82, 34, C.q2], [-55, 36, C.q3], [-27, 34, C.q1], [-2, 28, C.q2]];
    pl2.forEach(function (p, i) { s += feather(74, 42, p[1], p[0], 5.5, p[2], i % 2 ? C.redL : C.yel, '#ffffff'); });
    // jaguar ears
    function ear(cx, cy, rot, seed) {
      var e = '';
      e += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="10" ry="11" transform="rotate(' + rot + ' ' + (cx - 0) + ' ' + (cy + 0) + ')" fill="' + C.fur + '" stroke="' + O + '" stroke-width="3"/>';
      e += '<g transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')">' +
        El(cx, cy + 3.5, 8, 6, C.furS, 'opacity="0.35"') +
        El(cx + 0.5, cy + 1, 5.5, 6.5, C.spot) + El(cx + 1, cy + 2, 3.5, 4.5, '#d08a6a') +
        L('M' + (cx - 2) + ' ' + (cy + 5.2) + ' l0.4 -6 M' + (cx + 0.4) + ' ' + (cy + 5.6) + ' l0 -7 M' + (cx + 2.6) + ' ' + (cy + 5) + ' l-0.4 -5.6', '#fff2d8', 0.8, 0.9) +
        L('M' + (cx - 7.6) + ' ' + (cy - 5) + ' C ' + (cx - 5) + ' ' + (cy - 9) + ', ' + (cx - 1) + ' ' + (cy - 10.2) + ', ' + (cx + 2) + ' ' + (cy - 9.6), C.furL, 1.4, 0.85) +
        Ci(cx - 7.2, cy - 1.5, 0.9, C.spot) + Ci(cx - 5.4, cy - 5.2, 0.8, C.spot) + '</g>';
      return e;
    }
    s += ear(72, 40, -30) + ear(118, 30, 15);
    s += L('M64 38 l-2 2.6 l3 0.4', O, 1.2, 0.8);
    // helmet back / lower jaw base
    s += '<path d="M70 72 C 50 78, 44 106, 56 124 C 68 136, 114 138, 138 124 C 143 119, 141 110, 133 106 L 130 72 Z" fill="' + C.furS + '" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += furTicks(53, 92, 10, 24, 10, 71, 95, 2.6, '#a8621a', 0.8, 0.8);
    s += rosette(53, 100, 2.6, 75) + rosette(59, 114, 2.2, 79);
    // open mouth interior
    s += '<ellipse cx="101" cy="98" rx="34" ry="31" fill="url(#aztec-mouth-' + u + ')" stroke="' + O + '" stroke-width="2.4"/>';
    s += '<path d="M72 110 C 80 124, 118 128, 132 110 C 128 122, 116 130, 101 130 C 86 130, 76 122, 72 110 Z" fill="#4a1019"/>';
    s += '<ellipse cx="101" cy="125" rx="14" ry="3.6" fill="' + C.tongue + '" stroke="' + O + '" stroke-width="1.2"/>';
    s += El(101, 123.6, 10, 1.6, '#f08a92', 'opacity="0.7"') + L('M101 122.6 L 101 128', '#a8404a', 1) + Ci(95, 125.6, 0.5, '#b8434a') + Ci(98, 126.6, 0.5, '#b8434a') + Ci(104, 126.6, 0.5, '#b8434a') + Ci(107, 125.6, 0.5, '#b8434a');
    s += L('M76 108 C 74 100, 76 92, 80 86', '#b0404c', 1.4, 0.55) + L('M126 108 C 128 100, 127 93, 124 87', '#b0404c', 1.2, 0.5);
    // hair behind face
    s += '<path d="M72 80 C 66 92, 66 108, 72 116 L 80 112 L 78 84 Z" fill="' + C.hair + '" stroke="' + O + '" stroke-width="2"/>';
    s += L('M74 84 C 70 94, 69 106, 73 113 M77 86 C 74 96, 74 106, 77 111', '#5a4a66', 0.8, 0.8);
    // face
    s += '<ellipse cx="100" cy="97" rx="27" ry="25" fill="url(#aztec-skin-' + u + ')" stroke="' + O + '" stroke-width="2.8"/>';
    s += '<g clip-path="url(#aztec-face-' + u + ')">' +
      '<path d="M73 97 C 74 112, 86 122, 100 122 C 90 118, 80 110, 78 96 Z" fill="' + C.skinS + '" opacity="0.5"/>' +
      '<path d="M100 122 C 116 122, 126 112, 127 98 C 125 110, 116 118, 104 119 Z" fill="' + C.skinL + '" opacity="0.4"/>' +
      '<ellipse cx="100" cy="76" rx="17" ry="5" fill="' + C.skinS + '" opacity="0.32"/>' +
      // face paint: black band across eyes (warrior paint), gold cheek stripes, red dots
      '<path d="M73 92 C 88 89, 112 89, 128 92 L 128 101 C 112 99, 88 99, 73 102 Z" fill="' + C.spot + '" opacity="0.28"/>' +
      L('M76 93.6 C 90 90.6, 112 90.6, 126 93.6', C.spot, 0.6, 0.3) +
      '<path d="M84 107 L 88 107 M83.5 110 L 87.5 110 M83.8 113 L 87.2 113" stroke="' + C.gold + '" stroke-width="1.5" stroke-linecap="round"/>' +
      '<path d="M117 106 L 121 106 M117.5 109 L 121 109" stroke="' + C.gold + '" stroke-width="1.5" stroke-linecap="round"/>' +
      L('M84.4 106.3 L 88 106.3 M83.9 109.3 L 87.5 109.3 M117.4 105.3 L 121 105.3', C.goldL, 0.5, 0.9) +
      '<path d="M104 118 L 104 121 M107 117.6 L 107 120.8 M101 117.8 L 101 121" stroke="' + C.red + '" stroke-width="1.1" stroke-linecap="round"/>' +
      Ci(90, 115, 0.8, C.red) + Ci(93, 116.6, 0.7, C.red) + Ci(112, 115.6, 0.8, C.red) +
      // cheekbone + forehead sheen
      El(88, 105, 5, 2.2, C.skinL, 'opacity="0.35"') + El(112, 104.4, 4.6, 2, C.skinL, 'opacity="0.3"') +
      '</g>';
    // blush
    s += '<ellipse cx="89" cy="108" rx="4.5" ry="2.4" fill="' + C.blush + '" opacity="0.5"/><ellipse cx="121" cy="107.5" rx="3.8" ry="2.2" fill="' + C.blush + '" opacity="0.5"/>';
    if (!LITE) s += L('M86.6 108.4 l0.8 -1 M89 108.6 l0.8 -1 M91.4 108.4 l0.8 -1 M119 107.8 l0.7 -1 M121.2 107.8 l0.7 -1', '#fff', 0.5, 0.5);
    // bangs (pointed locks + strands)
    s += '<path d="M74 84 C 80 72, 96 68, 110 70 C 118 71, 124 74, 127 80 L 122 79 L 121 85 L 115 79 L 112 86 L 106 78 L 101 85 L 96 78 L 90 85 L 87 78 L 80 86 L 78 82 Z" fill="' + C.hair + '" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/>';
    s += L('M92 76 C 98 73.5, 106 73.5, 112 75', '#7a6a90', 1.3, 1) + L('M84 79 C 86 75, 90 73, 94 72 M114 74 C 118 74, 121 76, 123 78', '#5a4a66', 0.8, 0.9);
    if (!LITE) s += L('M88 82 L 88.6 78 M97 82 L 97.6 78.6 M104 82 L 104.6 78.6 M113 82 L 113 79', '#5a4a66', 0.7, 0.9);
    s += L('M126 79 C 128 82, 129 84, 128.6 87', C.hair, 1.2);
    // ear + gold ear spool
    s += P('M75 96 C 70 97, 70 106, 74 110 C 78 110, 80 104, 80 98 Z', C.skin, O, 1.8);
    s += L('M72.6 99 C 71.6 102, 72.4 105, 74 107', C.skinS, 0.9, 0.9);
    s += Ci(77, 103, 6.4, 'url(#aztec-gold-' + u + ')', O, 2);
    s += Ci(77, 103, 5.3, 'none', C.goldS, 1, 'stroke-dasharray="1 1.4"');
    s += Ci(77, 103, 3.6, 'url(#aztec-jade-' + u + ')', O, 1.1);
    s += L('M75.4 103 L 78.6 103 M77 101.4 L 77 104.6', C.jadeS, 0.5, 0.7);
    s += Ci(77, 103, 1.1, O);
    s += L('M73 99.5 C 74 98, 76 97.6, 77.5 97.6', '#fff', 1, 0.9);
    s += L('M77 109.4 L 77 112.4', O, 1) + Ci(77, 113.2, 1.3, C.gold, O, 0.7);
    // brows (hair strokes)
    s += L('M85 88.5 C 88 86, 93 85.6, 97 87.4', C.hair, 2.8) + L('M108 87.4 C 112 85.4, 117 85.6, 121 88', C.hair, 2.8);
    if (!LITE) s += L('M86 87.4 l-1 -1.8 M89 86 l-0.6 -2 M92 85.4 l-0.2 -2 M95 86.2 l0.4 -1.8 M110 86.2 l-0.4 -1.8 M113 85.2 l0.2 -2 M116 85.4 l0.6 -2 M119 86.6 l1 -1.6', C.hair, 0.9);
    s += L('M86 89.8 C 89 87.8, 93 87.6, 96 88.8 M109 88.8 C 112 87.4, 116 87.6, 120 89.6', '#5a4a66', 0.5, 0.7);
    // eyes
    function eye(x, y, dir) {
      var ix = x, iy = y + 1.7, o = dir > 0 ? 1 : -1;
      var e = '<ellipse cx="' + x + '" cy="' + y + '" rx="5.6" ry="7" fill="#2a1a10"/>' +
        '<ellipse cx="' + ix + '" cy="' + iy + '" rx="4.5" ry="4.9" fill="url(#aztec-iris-' + u + ')"/>' +
        '<ellipse cx="' + ix + '" cy="' + f(iy + 1.6) + '" rx="3" ry="2" fill="#e8b060" opacity="0.5"/>';
      var st = '';
      for (var k = 0; k < 10; k++) {
        var a = k * Math.PI / 5 + 0.3;
        st += 'M' + f(ix + Math.cos(a) * 2.4) + ' ' + f(iy + Math.sin(a) * 2.6) + ' L' + f(ix + Math.cos(a) * 4.1) + ' ' + f(iy + Math.sin(a) * 4.4) + ' ';
      }
      if (!LITE) e += L(st, '#f6d68a', 0.4, 0.55);
      e += '<ellipse cx="' + ix + '" cy="' + iy + '" rx="4.5" ry="4.9" fill="none" stroke="#2a1408" stroke-width="0.9"/>';
      e += '<ellipse cx="' + ix + '" cy="' + f(iy + 0.2) + '" rx="1.9" ry="2.2" fill="#100804"/>';
      e += '<ellipse cx="' + x + '" cy="' + y + '" rx="5.6" ry="7" fill="none" stroke="' + O + '" stroke-width="1.6"/>';
      e += Ci(x - 1.8, y - 2.8, 2.3, '#fff') + Ci(x + 2, y + 2.4, 1.1, '#fff') + Ci(x + 0.6, y - 5, 0.55, '#fff', null, 0, 'opacity="0.85"');
      e += L('M' + f(x - 3.4) + ' ' + f(y + 5.4) + ' C ' + f(x - 1) + ' ' + f(y + 6.4) + ', ' + f(x + 1.6) + ' ' + f(y + 6.4) + ', ' + f(x + 3.6) + ' ' + f(y + 5), '#ffd58a', 0.7, 0.7);
      e += L('M' + (x - 6.5) + ' ' + (y - 5) + ' C ' + (x - 3) + ' ' + (y - 8.6) + ', ' + (x + 3) + ' ' + (y - 8.6) + ', ' + (x + 6.8) + ' ' + (y - 4.4), O, 2.2);
      e += L('M' + f(x + o * 6.4) + ' ' + f(y - 4.6) + ' l' + f(o * 2.4) + ' -1.8 M' + f(x + o * 6.6) + ' ' + f(y - 3.4) + ' l' + f(o * 2.2) + ' -0.4', O, 1.1);
      e += L('M' + (x - 5.6) + ' ' + f(y - 9.4) + ' C ' + (x - 2) + ' ' + f(y - 11.2) + ', ' + (x + 3) + ' ' + f(y - 11.2) + ', ' + (x + 6) + ' ' + f(y - 9.6), C.skinS, 0.7, 0.7);
      e += L('M' + f(x - 4.4) + ' ' + f(y + 8.4) + ' C ' + f(x - 1) + ' ' + f(y + 9.6) + ', ' + f(x + 2) + ' ' + f(y + 9.6) + ', ' + f(x + 4.6) + ' ' + f(y + 8), C.skinL, 0.7, 0.7);
      return e;
    }
    s += '<g' + (anim ? ' class="part-eyes" style="transform-origin: 103px 97px"' : '') + '>' + eye(91, 97, -1) + eye(114, 97, 1) + '</g>';
    // nose bridge, nostril, philtrum
    s += L('M105 102 C 106.5 104.5, 106.5 106, 104 106.6', C.skinS, 1.6);
    s += L('M103.6 96 C 104.6 99, 105.2 101, 105 102', C.skinS, 0.8, 0.6) + L('M106.4 100 C 107 101.4, 107 103, 106.6 104', C.skinL, 0.9, 0.8);
    s += L('M101.6 106.6 C 102.4 107.4, 103.4 107.4, 104 106.8', C.skinS, 0.6, 0.8);
    // small open smile with teeth + tongue
    s += '<path d="M98.6 111.6 C 101 117, 108 117, 110.6 111 C 107 113.2, 102 113.2, 98.6 111.6 Z" fill="#6a1a24"/>';
    s += '<path d="M99.6 112.1 C 102 113.6, 107 113.6, 109.6 111.9 L 109.2 113.1 C 106.6 114.3, 102.4 114.3, 100 113 Z" fill="#fffbea"/>';
    s += '<path d="M101.5 115.2 C 103.5 117, 106.6 116.8, 108 114.8 C 106 114.2, 103.6 114.2, 101.5 115.2 Z" fill="#d8606a"/>';
    s += L('M99 112 C 102 114.6, 107 114.6, 110 111', O, 1.9);
    s += L('M97.6 110.4 l1.2 1.4 M111.8 109.8 l-1.4 1.6', O, 0.9, 0.8);
    s += L('M101.6 118 C 103.4 119, 106 119, 107.6 118', C.skinS, 0.7, 0.6);
    // lower jaw rim with fangs pointing up
    s += fang(62, 116, 66, 106, 71, 117, 1.8) + fang(127, 117, 130, 105, 135, 114, 1.8);
    s += fang(72, 121, 74.5, 114, 78, 122, 1.5) + fang(121, 121.5, 124, 115, 126.5, 120, 1.5);
    s += '<path d="M56 116 C 66 132, 112 138, 138 118 C 142 124, 136 132, 124 136 C 100 142, 66 138, 54 124 Z" fill="url(#aztec-fur-' + u + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += L('M58 118 C 68 132, 112 137, 136 119', '#c85868', 1.4, 0.7);
    s += L('M62 126 C 78 134, 110 136, 132 125', C.furL, 1.6, 0.8);
    s += furTicks(64, 134.4, 62, 4.6, 14, 91, 80, 2.2, C.furS, 0.7, 0.8);
    s += '<path d="M56 130 C 76 140, 112 140, 132 132 C 132 137, 124 138, 124 136 C 100 142, 66 138, 54 124 Z" fill="' + C.furS + '" opacity="0.5"/>';
    s += rosette(70, 131, 2.4, 31) + rosette(118, 133, 2.4, 37) + rosette(94, 135, 1.6, 39) + dot(84, 136, 1.1) + dot(106, 137.5, 1) + dot(128, 128, 1);
    // dome / upper jaw
    s += '<path d="' + DOME + '" fill="url(#aztec-fur-' + u + ')" stroke="' + O + '" stroke-width="3.2" stroke-linejoin="round"/>';
    s += '<g clip-path="url(#aztec-dome-' + u + ')">' +
      '<path d="M50 60 C 60 80, 74 78, 90 72 L 60 100 Z" fill="' + C.furS + '" opacity="0.6"/>' +
      '<path d="M64 60 C 60 44, 90 30, 118 32" stroke="#fff5d0" stroke-width="3.5" fill="none" opacity="0.55" stroke-linecap="round"/>' +
      '<path d="M124 34 C 132 36, 140 40, 144 46" stroke="#fff5d0" stroke-width="2" fill="none" opacity="0.5" stroke-linecap="round"/>' +
      '<path d="M78 72 C 92 66, 112 66, 128 72 L 128 76 C 112 71, 92 71, 78 76 Z" fill="#7a4210" opacity="0.28"/>' +
      furTicks(52, 34, 96, 44, 30, 101, 60, 1.9, C.furS, 0.45, 0.6) + furTicks(52, 34, 96, 44, 12, 103, 60, 1.8, C.furL, 0.6, 0.5) +
      rosette(68, 56, 3.6, 41) + rosette(84, 44, 3.4, 43) + rosette(66, 76, 3, 47) + rosette(100, 36, 3, 53) +
      rosette(82, 62, 3, 59) + rosette(138, 42, 2.6, 61) + dot(95, 60, 1.4) + dot(76, 68, 1.2) + dot(90, 34, 1.2) + dot(128, 36, 1.2) + rosette(115, 40, 2.4, 67) + rosette(96, 62, 2.2, 69) + rosette(58, 68, 2.8, 77) + dot(110, 60, 1.1) + dot(120, 64, 1) + dot(142, 54, 1) + dot(72, 50, 1.1) + dot(106, 32, 1) +
      rosette(146, 52, 2, 83) + rosette(56, 84, 2.4, 87) + dot(122, 50, 0.9) + dot(70, 90, 1) +
      // cream muzzle pad
      '<path d="M130 70 C 136 62, 150 60, 160 66 L 162 80 L 128 80 Z" fill="#fff0cc"/>' +
      '<path d="M130 76 C 140 79, 150 79, 162 74 L 162 80 L 128 80 Z" fill="#e6cf9e" opacity="0.7"/>' +
      furTicks(132, 66, 26, 12, 14, 111, 20, 2.4, '#d8bf88', 0.8, 0.7) +
      '<path d="M112 72 C 100 69, 85 71, 75 79 L 72 76 C 84 67, 102 66, 116 69 Z" fill="' + C.furS + '" opacity="0.8"/>' +
      '</g>';
    // whisker dots + muzzle line + long whiskers
    s += Ci(140, 71, 0.9, C.spot) + Ci(144, 69.5, 0.9, C.spot) + Ci(143, 73.5, 0.9, C.spot) + Ci(147, 72, 0.9, C.spot) + Ci(138, 74.6, 0.8, C.spot) + Ci(146.6, 68.6, 0.7, C.spot);
    s += L('M152 70 C 152 74, 150 76, 147 77.5', O, 1.5);
    var wh = 'M145 72.5 C 156 74, 168 73, 180 78 M144.5 74.5 C 155 78, 166 80, 177 87 M144 70.5 C 155 69, 168 67, 181 68';
    s += L(wh, O, 2.2, 0.8) + L(wh, '#fff8e0', 0.9);
    // nose
    s += '<path d="M154 62.5 C 158 61.5, 162 63, 162 65 C 161 68, 158 69.5, 156 70 C 154 68, 152.5 65, 154 62.5 Z" fill="#6a2a2a" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>';
    s += El(157, 63.6, 1.9, 0.9, '#fff', 'opacity="0.65"') + El(155.4, 67, 1, 0.6, '#1c0c0c', 'opacity="0.8"') + L('M158.6 67 C 158.4 68, 157.6 68.6, 157 68.8', '#a04a4a', 0.6, 0.8);
    s += L('M150 62 C 151.6 61, 153 60.6, 154 60.6', C.furS, 1, 0.8);
    // upper fangs
    s += fang(78, 76, 81, 88, 85, 74, 1.8) + fang(133, 76, 134.5, 89, 140, 78, 1.8);
    s += fang(88, 72.5, 90, 79, 92.5, 71.8, 1.4) + fang(125, 73, 126.5, 80, 129.5, 74.5, 1.4) + fang(145, 79.5, 146.5, 84, 149, 80.5, 1.4);
    s += L('M80 78 L 81.2 83', '#d8cfb0', 0.9) + L('M135 79 L 135 84', '#d8cfb0', 0.9);
    s += L('M76 76.4 C 79 78, 84 76, 86 73.6 M131 76 C 135 78.4, 140 79, 142 78', '#c85868', 1.2, 0.7);
    // helmet eyes (jaguar)
    function jeye(x, y, w, rot) {
      return '<g transform="rotate(' + rot + ' ' + x + ' ' + y + ')">' +
        '<path d="M' + (x - w) + ' ' + y + ' C ' + (x - w * 0.4) + ' ' + f(y - w * 0.62) + ', ' + (x + w * 0.5) + ' ' + f(y - w * 0.62) + ', ' + (x + w) + ' ' + (y - 1) + ' C ' + (x + w * 0.4) + ' ' + f(y + w * 0.5) + ', ' + (x - w * 0.5) + ' ' + f(y + w * 0.5) + ', ' + (x - w) + ' ' + y + ' Z" fill="url(#aztec-jeye-' + u + ')" stroke="' + O + '" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<path d="M' + (x - w + 0.6) + ' ' + f(y - 0.4) + ' C ' + (x - w * 0.4) + ' ' + f(y - w * 0.56) + ', ' + (x + w * 0.5) + ' ' + f(y - w * 0.56) + ', ' + (x + w - 0.6) + ' ' + (y - 1) + ' L ' + (x + w - 1) + ' ' + f(y - 1.4 + w * 0.12) + ' C ' + (x + w * 0.4) + ' ' + f(y - w * 0.12) + ', ' + (x - w * 0.5) + ' ' + f(y - w * 0.12) + ', ' + (x - w + 1) + ' ' + f(y + 0.2) + ' Z" fill="#8a6a10" opacity="0.35"/>' +
        '<ellipse cx="' + f(x + 0.5) + '" cy="' + f(y - 0.3) + '" rx="1.5" ry="' + f(w * 0.42) + '" fill="' + O + '"/>' +
        '<circle cx="' + f(x - w * 0.35) + '" cy="' + f(y - w * 0.18) + '" r="1.1" fill="#fff"/><circle cx="' + f(x + w * 0.4) + '" cy="' + f(y + w * 0.14) + '" r="0.5" fill="#fff" opacity="0.8"/>' +
        '<path d="M' + (x - w - 1) + ' ' + (y - 3) + ' C ' + f(x - w * 0.3) + ' ' + f(y - w * 0.9) + ', ' + f(x + w * 0.5) + ' ' + f(y - w * 0.9) + ', ' + f(x + w + 1.5) + ' ' + f(y - 2.5) + '" stroke="' + O + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        '<path d="M' + (x + w) + ' ' + y + ' L ' + (x + w + 3) + ' ' + (y + 2) + '" stroke="' + O + '" stroke-width="1.6" stroke-linecap="round"/>' +
        L('M' + f(x - 1) + ' ' + f(y + w * 0.5) + ' C ' + f(x - 2) + ' ' + f(y + w * 0.8) + ', ' + f(x - 2) + ' ' + f(y + w * 1.0) + ', ' + f(x - 3.4) + ' ' + f(y + w * 1.15), C.spot, 1.6, 0.85) +
        L('M' + f(x - w) + ' ' + f(y - w * 0.95) + ' l1.2 -2.4 M' + f(x - w * 0.4) + ' ' + f(y - w * 1.1) + ' l0.6 -2.6 M' + f(x + w * 0.3) + ' ' + f(y - w * 1.12) + ' l0 -2.6 M' + f(x + w * 0.9) + ' ' + f(y - w * 1.0) + ' l-0.6 -2.4', C.furS, 0.9, 0.9) +
        '</g>';
    }
    s += jeye(104, 49, 7, -6) + jeye(128, 53, 8, 4);
    // headdress holder: gold band with repoussé, jade inlays & rivets
    s += '<path d="M60 58 C 62 44, 72 36, 84 33 L 88 40 C 78 43, 70 50, 68 60 Z" fill="url(#aztec-gold-' + u + ')" stroke="' + O + '" stroke-width="2.2" stroke-linejoin="round"/>';
    s += L('M61.6 56 C 63 46, 70 38.4, 82 34.6', C.goldL, 1, 0.9) + L('M67 58.6 C 68.4 51, 74.4 45, 86 41.4', C.goldS, 1.1, 0.9);
    s += L('M63 53 l3 1 M64.4 47.6 l2.6 1.2 M68 41.6 l2 1.8 M73 37.6 l1.6 2.2 M79.6 35.4 l1 2.4', C.goldS, 0.8);
    s += Ci(64.6, 56, 0.7, C.goldS) + Ci(67.6, 45.2, 0.7, C.goldS) + Ci(70.8, 40.6, 0.7, C.goldS) + Ci(78, 37, 0.7, C.goldS) + Ci(84, 35.6, 0.7, C.goldS);
    s += '<ellipse cx="66" cy="50" rx="1.9" ry="1.3" transform="rotate(-68 66 50)" fill="url(#aztec-jade-' + u + ')" stroke="' + O + '" stroke-width="0.7"/>';
    s += '<ellipse cx="76" cy="38.8" rx="1.9" ry="1.3" transform="rotate(-30 76 38.8)" fill="url(#aztec-jade-' + u + ')" stroke="' + O + '" stroke-width="0.7"/>';
    s += rivet(61.8, 58.4, 1) + rivet(85.6, 34.4, 1);
    s += L('M69 47.4 l2 0.2', '#fff', 0.5, 0.6);
    s += '<circle cx="74" cy="42" r="5.2" fill="url(#aztec-gold-' + u + ')" stroke="' + O + '" stroke-width="2"/>';
    s += Ci(74, 42, 4.2, 'none', C.goldS, 0.8, 'stroke-dasharray="0.9 1.1"');
    s += '<circle cx="74" cy="42" r="2.8" fill="url(#aztec-jade-' + u + ')" stroke="' + O + '" stroke-width="1"/>';
    s += Ci(73, 41, 0.9, '#fff');
    s += '</g>';
    return s;
  }

  function shieldArm(u) {
    var s = '';
    // arm
    s += '<path d="' + ARMS + '" fill="url(#aztec-fur-' + u + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<g clip-path="url(#aztec-arms-' + u + ')">' + rosette(70, 142, 2.8, 71) + rosette(64, 158, 2.6, 73) + dot(75, 150, 1) +
      furTicks(58, 134, 24, 38, 18, 121, 90, 2.6, C.furS, 0.7, 0.8) + furTicks(62, 140, 16, 30, 8, 123, 90, 2.4, C.furL, 0.7, 0.7) +
      '<path d="M58 134 L 66 134 C 64 146, 64 158, 66 170 L 58 170 Z" fill="#000" opacity="0.1"/></g>';
    // gold armlet (repoussé)
    s += '<path d="M66 144 C 70 146, 76 146, 80 142 L 78 148 C 74 151, 68 151, 64 149 Z" fill="url(#aztec-gold-' + u + ')" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>';
    s += Ci(69, 147.4, 0.55, C.goldS) + Ci(72, 148.4, 0.55, C.goldS) + Ci(75, 147.8, 0.55, C.goldS) + '<ellipse cx="71.6" cy="146.2" rx="1.6" ry="1" fill="url(#aztec-jade-' + u + ')" stroke="' + O + '" stroke-width="0.6"/>';
    s += L('M67 145.2 C 70 147, 75 146.6, 79 143.4', C.goldL, 0.8, 0.9);
    // feather fringe hanging from shield
    var fr = [[150, C.red], [163, C.q1], [176, C.yel], [189, C.q3], [202, C.red], [215, C.q2]];
    if (!LITE) fr.forEach(function (p, i) {
      var bx = 60 + Math.sin(p[0] * Math.PI / 180) * 17, by = 172 - Math.cos(p[0] * Math.PI / 180) * 20;
      s += feather(bx, by, 19 + (i % 2) * 3, p[0], 4.2, p[1], i % 2 ? C.q4 : C.redS, '#ffffff');
    });
    // chimalli
    s += '<ellipse cx="60" cy="172" rx="21" ry="24" fill="' + C.cot + '" stroke="' + O + '" stroke-width="3"/>';
    s += '<g clip-path="url(#aztec-shield-' + u + ')">' +
      '<rect x="36" y="146" width="50" height="19" fill="#1aa37a"/>' +
      '<rect x="36" y="146" width="50" height="4" fill="#1f6fb8"/><rect x="36" y="150" width="50" height="4" fill="#12907a"/><rect x="36" y="158" width="50" height="4" fill="#22b98a"/>' +
      '<rect x="36" y="179" width="50" height="20" fill="' + C.red + '"/>' +
      (LITE ? '' : '<rect x="36" y="183" width="50" height="4" fill="#d24a37"/><rect x="36" y="191" width="50" height="3.4" fill="' + C.yel + '" opacity="0.85"/><rect x="36" y="194.4" width="50" height="6" fill="' + C.redS + '"/>') +
      '<rect x="36" y="165" width="50" height="14" fill="' + C.cot + '"/>' +
      '<rect x="36" y="146" width="50" height="19" fill="url(#aztec-mosaic-' + u + ')"/>' +
      (LITE ? '' : '<rect x="36" y="179" width="50" height="21" fill="url(#aztec-mosaic-' + u + ')"/>') +
      '<rect x="36" y="165" width="50" height="14" fill="url(#aztec-twill-' + u + ')"/>' +
      fret(40, 166, 4, 11.5, O, 1.9) +
      '<path d="M36 165 L 86 165 M36 179 L 86 179" stroke="' + O + '" stroke-width="1.6"/>' +
      L('M36 166.6 L 86 166.6 M36 177.4 L 86 177.4', C.goldS, 0.6, 0.7, 'stroke-dasharray="1.6 1.2"') +
      (LITE ? '' : '<circle cx="50" cy="186" r="1.6" fill="' + C.cot + '"/><circle cx="60" cy="189" r="1.6" fill="' + C.cot + '"/><circle cx="70" cy="186" r="1.6" fill="' + C.cot + '"/>' +
      Ci(49.5, 185.5, 0.5, '#fff') + Ci(59.5, 188.5, 0.5, '#fff') + Ci(69.5, 185.5, 0.5, '#fff')) +
      // cel shade crescent + highlight
      '<path d="M36 146 L 36 200 L 84 200 C 70 198, 52 190, 46 172 C 42 160, 44 152, 50 146 Z" fill="#000" opacity="0.14"/>' +
      '<path d="M66 152 C 74 155, 78 162, 79 168" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.55"/>' +
      '<path d="M46 155 C 48 152, 52 150, 55 149" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity="0.4"/>' +
      (LITE ? '' : L('M70 192 L 76 186 M72 196 L 77 190', '#fff', 0.8, 0.4)) +
      '</g>';
    // gold rim (hammered) with studs
    s += '<ellipse cx="60" cy="172" rx="21" ry="24" fill="none" stroke="url(#aztec-gold-' + u + ')" stroke-width="3"/>';
    s += '<ellipse cx="60" cy="172" rx="22.5" ry="25.5" fill="none" stroke="' + O + '" stroke-width="1.8"/>';
    s += '<ellipse cx="60" cy="172" rx="19.4" ry="22.4" fill="none" stroke="' + O + '" stroke-width="1"/>';
    s += '<ellipse cx="60" cy="172" rx="21" ry="24" fill="none" stroke="' + C.goldS + '" stroke-width="0.6" stroke-dasharray="0.1 2.6" stroke-linecap="round"/>';
    for (var i = 0; i < 12; i++) {
      var a = i * Math.PI / 6;
      s += '<circle cx="' + f(60 + Math.cos(a) * 21) + '" cy="' + f(172 + Math.sin(a) * 24) + '" r="1.1" fill="' + C.goldL + '" stroke="' + C.goldS + '" stroke-width="0.5"/>';
    }
    s += L('M44.6 156 C 48 152, 52 150, 56 149', '#fff', 1, 0.7) + L('M75 190 C 71 194, 67 196, 63 196.8', C.goldS, 1, 0.8);
    if (!LITE) s += L('M39.6 176 l-1.6 1.2 l0.4 2', O, 0.8, 0.8) + L('M78 158 l1.6 1 M79.4 161 l-1.2 0.4', O, 0.7, 0.6);
    // tally marks on the rim (five-bar gate) + knots
    if (!LITE) s += L('M40 184 l0.6 3 M41.8 184.4 l0.6 3 M43.6 185 l0.6 3 M45.4 185.6 l0.6 3 M39.6 186.6 l7 -1.6', O, 0.7, 0.85);
    s += Ci(60, 148, 1.5, C.red, O, 0.8) + L('M60 148.8 l-1 2.4 M60 148.8 l1.2 2.2', C.redS, 0.9);
    return s;
  }

  function weaponArm(u, anim) {
    var s = '<g' + (anim ? ' class="part-weapon" style="transform-origin: 114px 140px"' : '') + '>';
    // macuahuitl
    var club = '';
    var blade = 'url(#aztec-obs-' + u + ')';
    club += '<path d="M-6 -6 L -7.5 -70 C -7.5 -80, 7.5 -80, 7.5 -70 L 6 -6 Z" fill="none" stroke="' + O + '" stroke-width="5" stroke-linejoin="round"/>';
    // obsidian teeth (faceted, glossy, some chipped)
    var chip = { 2: 1, 5: -1, 3: -1 };
    for (var y = -14, ti = 0; y >= -70; y -= 8, ti++) {
      club += '<path d="M6 ' + (y - 3.5) + ' L 13 ' + (y - 1.2) + ' L 12 ' + (y + 2.6) + ' L 6 ' + (y + 3.5) + ' Z" fill="' + blade + '" stroke="' + O + '" stroke-width="1.4" stroke-linejoin="round"/>';
      club += '<path d="M6.4 ' + (y - 3.2) + ' L 12.6 ' + (y - 1.1) + ' L 9 ' + (y + 0.2) + ' Z" fill="#4d4a72" opacity="0.85"/>';
      if (!LITE) club += '<path d="M9 ' + (y + 0.2) + ' L 12 ' + (y + 2.5) + ' L 6.4 ' + (y + 3.2) + ' Z" fill="#000" opacity="0.5"/>';
      club += L('M7.4 ' + (y - 2.4) + ' L 11.6 ' + (y - 1), C.obsL, 1);
      if (!LITE) club += L('M7 ' + (y + 0.4) + ' L 10.6 ' + (y + 1.2), '#5a5a88', 0.5, 0.9);
      if (!LITE) club += Ci(9.2, y + 0.6, 0.6, '#e8ecff', null, 0, 'opacity="0.9"');
      club += '<path d="M-6 ' + (y - 3.5) + ' L -13 ' + (y - 1.2) + ' L -12 ' + (y + 2.6) + ' L -6 ' + (y + 3.5) + ' Z" fill="' + blade + '" stroke="' + O + '" stroke-width="1.4" stroke-linejoin="round"/>';
      club += '<path d="M-6.4 ' + (y - 3.2) + ' L -12.6 ' + (y - 1.1) + ' L -9 ' + (y + 0.2) + ' Z" fill="#3c3a58" opacity="0.85"/>';
      if (!LITE) club += '<path d="M-9 ' + (y + 0.2) + ' L -12 ' + (y + 2.5) + ' L -6.4 ' + (y + 3.2) + ' Z" fill="#000" opacity="0.5"/>';
      club += L('M-7.4 ' + (y - 2.4) + ' L -11.6 ' + (y - 1), C.obsL, 1);
      if (!LITE) club += L('M-7 ' + (y + 0.4) + ' L -10.4 ' + (y + 1.2), '#4a4a78', 0.5, 0.9);
      if (chip[ti]) club += '<path d="M' + (chip[ti] * 12.8) + ' ' + (y - 1.4) + ' l' + (chip[ti] * -2.4) + ' 0.2 l' + (chip[ti] * 0.6) + ' 2.2 Z" fill="' + C.wood + '" stroke="' + O + '" stroke-width="0.5" opacity="0.9"/>';
    }
    // tip shards
    club += '<path d="M-4 -76 L -3 -84 L 1.5 -86 L 4 -77 Z" fill="' + blade + '" stroke="' + O + '" stroke-width="1.4" stroke-linejoin="round"/>';
    club += '<path d="M-4 -76 L -3 -84 L 0 -80 Z" fill="#4d4a72" opacity="0.9"/>';
    club += L('M-2.2 -78 L -1.6 -83', C.obsL, 1);
    // wooden paddle
    club += '<path d="M-6 -6 L -7.5 -70 C -7.5 -80, 7.5 -80, 7.5 -70 L 6 -6 Z" fill="url(#aztec-wood-' + u + ')" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>';
    club += L('M-4.2 -10 L -5 -68 M4.6 -12 L 5 -66', C.woodS, 0.9, 0.7);
    club += L('M-1.5 -20 C -2 -34, -1 -46, -2 -60', C.woodL, 1.2, 0.8);
    // wood grain, knots
    club += L('M-3 -14 C -3.4 -24, -2.6 -36, -3.2 -48 M2.4 -16 C 3 -28, 2 -40, 2.8 -52 M0.6 -56 C 0.2 -62, 1 -68, 0.4 -72', C.woodS, 0.6, 0.55);
    club += '<ellipse cx="-3.6" cy="-56" rx="1" ry="1.6" fill="none" stroke="' + C.woodS + '" stroke-width="0.6" opacity="0.7"/>';
    // resin bedding along the blade edges + lashings
    club += L('M-6.2 -8 L -7.2 -68 M6.2 -8 L 7.2 -68', '#2a1a10', 1.1, 0.7);
    club += L('M-6 -12 L 6 -8.6 M-6.2 -15 L 6 -11.6', C.red, 1.1) + L('M-6 -11.4 L 6 -8 M-6.2 -14.4 L 6 -11', C.redL, 0.5, 0.8);
    club += L('M-7 -66 L 7 -63 M-7.2 -68.6 L 7.2 -65.6', C.red, 1.1) + L('M-7 -65.4 L 7 -62.4', C.redL, 0.5, 0.8);
    // painted step-fret along the paddle (red & gold)
    club += L('M-3 -18 L 3 -18 L 3 -22 L -1 -22 L -1 -26 L 3 -26 M-3 -34 L 3 -34 L 3 -38 L -1 -38 L -1 -42 L 3 -42 M-3 -50 L 3 -50 L 3 -54 L -1 -54 L -1 -58 L 3 -58', C.red, 1.4);
    club += Ci(0, -30, 1.2, C.gold) + Ci(0, -46, 1.2, C.gold) + Ci(0, -64, 1.6, C.jade, O, 0.6) + Ci(-0.4, -64.4, 0.5, '#fff');
    club += L('M-4.6 -30 l1.4 0 M3.2 -46 l1.4 0', C.woodS, 0.8, 0.7);
    // dried stain near the teeth
    club += '<ellipse cx="9" cy="-42" rx="2.6" ry="1.2" fill="#7a1010" opacity="0.4"/><ellipse cx="-10" cy="-26" rx="2.2" ry="1" fill="#7a1010" opacity="0.35"/>';
    // carved handle, leather wrap
    club += '<rect x="-3.4" y="-8" width="6.8" height="22" rx="2" fill="url(#aztec-wood-' + u + ')" stroke="' + O + '" stroke-width="2"/>';
    club += L('M-3.4 -5 L 3.4 -5 M-3.4 8 L 3.4 8 M-3.4 10.5 L 3.4 10.5', C.woodS, 1.1);
    club += L('M-3.4 -3 L 3.4 -0.6 M-3.4 0.6 L 3.4 3 M-3.4 4.2 L 3.4 6.6', C.cot, 1.5) + L('M-3.4 -2.4 L 3.4 0 M-3.4 1.2 L 3.4 3.6 M-3.4 4.8 L 3.4 7.2', C.cotS, 0.6);
    club += L('M-2.4 -6 L -2.4 12', C.woodL, 0.8, 0.6);
    club += '<ellipse cx="0" cy="15" rx="5.2" ry="3" fill="' + C.woodL + '" stroke="' + O + '" stroke-width="2"/>';
    club += L('M-3 15 L 3 15', C.woodS, 1) + '<ellipse cx="0" cy="14.2" rx="2.4" ry="1" fill="' + C.gold + '" stroke="' + O + '" stroke-width="0.6"/>' + Ci(-0.6, 14, 0.4, '#fff');
    // wrist cord (twisted) + jade bead + tassel
    var cord = 'M-1 16 C -9 24, -8 33, 1 32 C 7 31, 6 22, 1 17';
    club += L(cord, O, 3.2) + L(cord, C.red, 1.7) + L(cord, C.cot, 0.7, 0.9, 'stroke-dasharray="0.8 1.2"');
    club += Ci(-5.5, 27, 1.8, 'url(#aztec-jade-' + u + ')', O, 0.8) + Ci(-6, 26.4, 0.5, '#fff');
    club += L('M1 32 L 0 38 M1 32 L 2.5 38 M1 32 L 4.5 37 M1 32 L -1.5 37', C.redS, 1.2) + Ci(1, 32, 1.1, C.gold, O, 0.6);
    // glint on the tip
    club += L('M0 -93 L 0 -83 M-5 -88 L 5 -88', '#fff', 1, 0.9) + L('M-2.4 -90.4 L 2.4 -85.6 M2.4 -90.4 L -2.4 -85.6', '#fff', 0.6, 0.6);
    s += '<g transform="translate(135 168) rotate(30)">' + club + '</g>';
    // arm
    s += '<path d="' + ARMW + '" fill="url(#aztec-fur-' + u + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<g clip-path="url(#aztec-armw-' + u + ')">' + rosette(118, 142, 2.8, 81) + rosette(127, 156, 2.6, 83) + dot(112, 147, 1) + dot(131, 150, 0.9) +
      furTicks(104, 132, 34, 40, 20, 131, 60, 2.6, C.furS, 0.7, 0.8) + furTicks(106, 134, 30, 36, 8, 133, 60, 2.4, C.furL, 0.7, 0.7) +
      '<path d="M104 140 C 108 150, 118 160, 130 172 L 124 176 Z" fill="' + C.furS + '" opacity="0.5"/>' +
      L('M112 138 C 118 138, 124 142, 128 148', C.furL, 1.6, 0.6) + '</g>';
    // gold armlet + wrist cuff
    s += '<path d="M112 147 C 116 145, 121 142, 124 139 L 126 144 C 123 147, 118 150, 114 152 Z" fill="url(#aztec-gold-' + u + ')" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>';
    s += Ci(116.6, 148.6, 0.55, C.goldS) + Ci(119.4, 146.6, 0.55, C.goldS) + Ci(121.8, 144.4, 0.55, C.goldS) + '<ellipse cx="118.6" cy="146" rx="1.5" ry="1" transform="rotate(-42 118.6 146)" fill="url(#aztec-jade-' + u + ')" stroke="' + O + '" stroke-width="0.6"/>';
    s += L('M114 147 C 117 145.6, 121 143, 123.4 140.6', C.goldL, 0.8, 0.9);
    s += '<path d="M126 164 L 136 159 L 139 165 L 129 170 Z" fill="url(#aztec-gold-' + u + ')" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>';
    s += L('M128.5 165.5 L 136.5 161.5', C.goldS, 0.9, 1, 'stroke-dasharray="1.2 1"') + L('M127.6 163.6 L 135.6 159.8', C.goldL, 0.7, 0.9) + rivet(128.4, 167.6, 0.9) + rivet(137, 162.4, 0.9);
    // fist (knuckles, thumb, creases)
    s += '<ellipse cx="136" cy="169" rx="6.6" ry="6" fill="url(#aztec-skin-' + u + ')" stroke="' + O + '" stroke-width="2.4"/>';
    s += L('M138 164 C 141 165, 142 167, 141 170 M139.5 167.5 C 142 169, 142 171, 140 173 M136 164 C 133 166, 132 170, 134 173', C.skinS, 1.1);
    s += L('M133.6 165.4 C 135 164, 137 163.6, 138.6 164.2', C.skinL, 1, 0.9) + Ci(140.6, 168, 0.6, C.skinL) + Ci(140.4, 171, 0.5, C.skinL);
    s += '<path d="M131 168 C 130 172, 133 175, 136 174.6 C 133 173, 132 171, 132 168.6 Z" fill="' + C.skinS + '" opacity="0.5"/>';
    s += '</g>';
    return s;
  }

  function hero(u) {
    FU = u;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240">' + defs(u) +
      shadow(true) + legs(u) +
      '<g class="part-body">' + cape(u, true) + torso(u) + head(u, true) + shieldArm(u) + weaponArm(u, true) + '</g>' +
      '</svg>';
  }

  function portrait(u) {
    FU = u; LITE = true;
    var out = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' + defs(u) +
      '<g transform="translate(-13 1) scale(0.7)">' + cape(u, false) + torso(u) + head(u, false) + shieldArm(u) + weaponArm(u, false) + '</g>' +
      '</svg>';
    LITE = false;
    return out;
  }

  window.HEROES = window.HEROES || {};
  window.HEROES.aztec = {
    key: 'aztec', name: 'Itzcoatl', title: 'The Jaguar Warrior',
    lore: 'An Ocelotl of the jaguar order, sworn to fight from dusk to dawn. His obsidian-toothed macuahuitl sings like the night cat\'s roar.',
    color: '#1aa37a',
    base: { hp: 520, atk: 100, def: 24 },
    fx: { slash: '#39e6a0', glow: '#d6ffe9' },
    signature: { name: 'Obsidian Fury', desc: 'Attacks inflict Bleed: 20% ATK damage per turn for 3 turns.', type: 'burn' },
    svg: function (uid) { return hero(uid == null ? '0' : String(uid)); },
    portrait: function (uid) { return portrait(uid == null ? 'p' : String(uid)); }
  };
})();

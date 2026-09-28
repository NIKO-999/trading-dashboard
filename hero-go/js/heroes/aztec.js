/* Hero Go! — Itzcoatl, The Jaguar Warrior (Ocelotl)
 * Hand-authored inline SVG. See ART_CONTRACT.md.
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

  function f(n) { return Math.round(n * 100) / 100; }

  // deterministic pseudo random
  function rng(seed) {
    var s = seed;
    return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  }

  // jaguar rosette: ring of broken blobs with warm centre
  function rosette(x, y, s, seed) {
    var r = rng(seed), out = '';
    out += '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(s * 0.62) + '" ry="' + f(s * 0.5) + '" fill="' + C.spotC + '" opacity="0.85"/>';
    var n = 4 + Math.floor(r() * 2), rot = r() * 360;
    for (var i = 0; i < n; i++) {
      var a = (rot + i * (360 / n) + r() * 18) * Math.PI / 180;
      var cx = x + Math.cos(a) * s, cy = y + Math.sin(a) * s * 0.85;
      var deg = (a * 180 / Math.PI) + 90;
      out += '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(s * (0.42 + r() * 0.12)) + '" ry="' + f(s * 0.24) +
        '" transform="rotate(' + f(deg) + ' ' + f(cx) + ' ' + f(cy) + ')" fill="' + C.spot + '"/>';
    }
    return out;
  }
  function dot(x, y, r) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + C.spot + '"/>';
  }

  // feather: base at (x,y), pointing in direction `ang` (0 = up, +cw), length len, half-width w
  function feather(x, y, len, ang, w, col, tip, rachis) {
    var L = len, W = w;
    var body = 'M0 0 C ' + f(W * 0.9) + ' ' + f(-L * 0.22) + ', ' + f(W * 1.05) + ' ' + f(-L * 0.72) + ', 0 ' + f(-L) +
      ' C ' + f(-W * 1.05) + ' ' + f(-L * 0.72) + ', ' + f(-W * 0.9) + ' ' + f(-L * 0.22) + ', 0 0 Z';
    var half = 'M0 0 C ' + f(W * 0.9) + ' ' + f(-L * 0.22) + ', ' + f(W * 1.05) + ' ' + f(-L * 0.72) + ', 0 ' + f(-L) + ' Z';
    var tipP = 'M ' + f(-W * 0.95) + ' ' + f(-L * 0.7) + ' C ' + f(-W * 0.6) + ' ' + f(-L * 0.62) + ', ' + f(W * 0.6) + ' ' + f(-L * 0.62) + ', ' + f(W * 0.95) + ' ' + f(-L * 0.7) +
      ' C ' + f(W * 0.8) + ' ' + f(-L * 0.86) + ', ' + f(W * 0.3) + ' ' + f(-L * 0.97) + ', 0 ' + f(-L) +
      ' C ' + f(-W * 0.3) + ' ' + f(-L * 0.97) + ', ' + f(-W * 0.8) + ' ' + f(-L * 0.86) + ', ' + f(-W * 0.95) + ' ' + f(-L * 0.7) + ' Z';
    var barbs = '';
    for (var i = 1; i <= 4; i++) {
      var yy = -L * (0.2 + i * 0.13);
      barbs += 'M0 ' + f(yy) + ' L ' + f(W * 0.75) + ' ' + f(yy - L * 0.06) + ' M0 ' + f(yy + L * 0.03) + ' L ' + f(-W * 0.75) + ' ' + f(yy - L * 0.03) + ' ';
    }
    return '<g transform="translate(' + f(x) + ' ' + f(y) + ') rotate(' + f(ang) + ')">' +
      '<path d="' + body + '" fill="' + col + '" stroke="' + O + '" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<path d="' + half + '" fill="#000" opacity="0.14"/>' +
      '<path d="' + tipP + '" fill="' + tip + '" opacity="0.95"/>' +
      '<path d="' + barbs + '" stroke="#ffffff" stroke-opacity="0.28" stroke-width="0.8" fill="none" stroke-linecap="round"/>' +
      '<path d="M0 -1 L0 ' + f(-L * 0.93) + '" stroke="' + (rachis || '#e9fff6') + '" stroke-width="1" stroke-linecap="round" opacity="0.9"/>' +
      '<path d="' + body + '" fill="none" stroke="' + O + '" stroke-width="2.2" stroke-linejoin="round"/>' +
      '</g>';
  }

  // xicalcoliuhqui step-fret band: n interlocking units starting at (x,y), unit width u
  function fret(x, y, n, u, col, sw) {
    var out = '', k = u / 12;
    for (var i = 0; i < n; i++) {
      var ox = x + i * u;
      var pts = [[0, 12], [0, 9], [3, 9], [3, 6], [6, 6], [6, 1.2], [11, 1.2], [11, 7], [8.6, 7], [8.6, 4]];
      var d = pts.map(function (p, j) { return (j ? 'L' : 'M') + f(ox + p[0] * k) + ' ' + f(y + p[1] * k); }).join(' ');
      out += '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + sw + '" stroke-linejoin="miter" stroke-linecap="square"/>';
    }
    return out;
  }

  function defs(u) {
    return '<defs>' +
      '<linearGradient id="aztec-fur-' + u + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + C.furL + '"/><stop offset="0.45" stop-color="' + C.fur + '"/><stop offset="1" stop-color="' + C.furS + '"/></linearGradient>' +
      '<linearGradient id="aztec-gold-' + u + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + C.goldL + '"/><stop offset="0.5" stop-color="' + C.gold + '"/><stop offset="1" stop-color="' + C.goldS + '"/></linearGradient>' +
      '<radialGradient id="aztec-jade-' + u + '" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="' + C.jadeL + '"/><stop offset="0.45" stop-color="' + C.jade + '"/><stop offset="1" stop-color="' + C.jadeS + '"/></radialGradient>' +
      '<radialGradient id="aztec-skin-' + u + '" cx="0.55" cy="0.4" r="0.7"><stop offset="0" stop-color="' + C.skinL + '"/><stop offset="0.6" stop-color="' + C.skin + '"/><stop offset="1" stop-color="' + C.skinS + '"/></radialGradient>' +
      '<linearGradient id="aztec-obs-' + u + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a4766"/><stop offset="0.35" stop-color="' + C.obs + '"/><stop offset="1" stop-color="#050408"/></linearGradient>' +
      '<linearGradient id="aztec-wood-' + u + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + C.woodS + '"/><stop offset="0.35" stop-color="' + C.woodL + '"/><stop offset="1" stop-color="' + C.wood + '"/></linearGradient>' +
      '<linearGradient id="aztec-cot-' + u + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + C.cotS + '"/><stop offset="0.35" stop-color="#fffaf0"/><stop offset="1" stop-color="' + C.cotS + '"/></linearGradient>' +
      '<clipPath id="aztec-dome-' + u + '"><path d="' + DOME + '"/></clipPath>' +
      '<clipPath id="aztec-torso-' + u + '"><path d="' + TORSO + '"/></clipPath>' +
      '<clipPath id="aztec-vest-' + u + '"><path d="' + VEST + '"/></clipPath>' +
      '<clipPath id="aztec-legs-' + u + '"><path d="' + LEGL + ' ' + LEGR + '"/></clipPath>' +
      '<clipPath id="aztec-armw-' + u + '"><path d="' + ARMW + '"/></clipPath>' +
      '<clipPath id="aztec-arms-' + u + '"><path d="' + ARMS + '"/></clipPath>' +
      '<clipPath id="aztec-shield-' + u + '"><ellipse cx="60" cy="172" rx="21" ry="24"/></clipPath>' +
      '<clipPath id="aztec-face-' + u + '"><ellipse cx="100" cy="97" rx="27" ry="25"/></clipPath>' +
      '</defs>';
  }

  // ---------- key shapes ----------
  var DOME = 'M60 94 C 47 72, 56 44, 82 33 C 104 24, 130 29, 143 43 C 148 49, 151 55, 153 60 C 160 61, 164 70, 158 77 C 153 81, 146 81, 141 79 C 132 77, 124 73, 114 72 C 100 70, 85 71, 75 79 C 69 83, 64 88, 60 94 Z';
  var TORSO = 'M72 128 C 68 150, 70 175, 75 194 L 115 194 C 120 175, 122 150, 118 128 C 106 124, 84 124, 72 128 Z';
  var VEST = 'M73 138 C 71 158, 72 176, 75 191 L 115 191 C 118 176, 119 158, 117 138 C 108 144, 100 146, 95 146 C 88 146, 80 143, 73 138 Z';
  var LEGL = 'M79 190 L 93 190 L 92 222 L 80 222 Z';
  var LEGR = 'M98 190 L 112 190 L 111 222 L 99 222 Z';
  var ARMW = 'M110 134 C 120 132, 128 140, 132 150 C 136 157, 140 163, 139 168 L 128 172 C 124 164, 118 158, 112 152 C 106 146, 104 138, 110 134 Z';
  var ARMS = 'M80 134 C 70 132, 62 140, 60 150 C 58 158, 58 164, 60 170 L 70 170 C 70 162, 72 156, 76 150 C 82 144, 86 138, 80 134 Z';

  // ---------- parts ----------
  function shadow(anim) {
    return '<g' + (anim ? ' class="part-shadow"' : '') + '><ellipse cx="96" cy="229" rx="50" ry="7" fill="#000" opacity="0.22"/><ellipse cx="96" cy="229" rx="32" ry="4.5" fill="#000" opacity="0.14"/></g>';
  }

  function cape(u, anim) {
    var out = '<g' + (anim ? ' class="part-cape"' : '') + '>';
    var cx = 84, cy = 150, i, a;
    var outer = [C.q1, C.q3, C.q2, C.q5, C.q1, C.q2, C.q3, C.q1, C.q2, C.q5, C.q1, C.q3, C.q2];
    for (i = 0; i < 13; i++) {
      a = -128 + i * 12.5;
      out += feather(cx, cy, 66 + (i % 2) * 5, a, 8.5, outer[i], i % 2 ? C.q5 : C.q4, '#dcfff0');
    }
    for (i = 0; i < 12; i++) {
      a = -122 + i * 13;
      out += feather(cx, cy, 44, a, 6.5, i % 2 ? C.red : C.redL, C.redS, '#ffd6c8');
    }
    for (i = 0; i < 11; i++) {
      a = -116 + i * 13.5;
      out += feather(cx, cy, 28, a, 5, C.yel, C.goldS, '#fff7cc');
    }
    out += '</g>';
    return out;
  }

  function legs(u) {
    var s = '';
    // legs (tlahuiztli spotted)
    s += '<path d="' + LEGL + '" fill="url(#aztec-fur-' + u + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<path d="' + LEGR + '" fill="url(#aztec-fur-' + u + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<g clip-path="url(#aztec-legs-' + u + ')">' +
      rosette(84, 200, 3.2, 3) + rosette(89, 213, 3, 7) + dot(81, 208, 1.1) + dot(91, 203, 1) + dot(84, 219, 1) +
      rosette(103, 202, 3.2, 11) + rosette(108, 214, 3, 13) + dot(101, 211, 1.1) + dot(110, 197, 1) + dot(103, 219, 1) +
      '<rect x="79" y="190" width="4" height="34" fill="#000" opacity="0.12"/><rect x="98" y="190" width="4" height="34" fill="#000" opacity="0.12"/>' +
      '</g>';
    s += '<path d="' + LEGL + ' ' + LEGR + '" fill="none" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    // cactli sandals
    function sandal(x) {
      var r = '';
      // heel guard
      r += '<path d="M' + (x - 1) + ' 215 C ' + (x - 3) + ' 219, ' + (x - 3) + ' 224, ' + (x - 1) + ' 227 L ' + (x + 5) + ' 227 L ' + (x + 5) + ' 216 Z" fill="' + C.wood + '" stroke="' + O + '" stroke-width="2.2" stroke-linejoin="round"/>';
      r += '<path d="M' + (x - 1) + ' 218 L ' + (x + 4) + ' 218 M' + (x - 1.5) + ' 221 L ' + (x + 4) + ' 221" stroke="' + C.woodS + '" stroke-width="0.9" stroke-dasharray="1.4 1"/>';
      // foot (skin)
      r += '<path d="M' + (x + 2) + ' 219 L ' + (x + 13) + ' 219 C ' + (x + 17) + ' 220, ' + (x + 19) + ' 222, ' + (x + 19) + ' 225 L ' + (x + 2) + ' 225 Z" fill="' + C.skin + '" stroke="' + O + '" stroke-width="2.2" stroke-linejoin="round"/>';
      r += '<path d="M' + (x + 16) + ' 221.5 L ' + (x + 16) + ' 224.5 M' + (x + 13.5) + ' 221 L ' + (x + 13.5) + ' 224.5" stroke="' + C.skinS + '" stroke-width="0.8"/>';
      // sole
      r += '<path d="M' + (x - 2) + ' 224.5 L ' + (x + 17) + ' 224.5 C ' + (x + 21) + ' 224.5, ' + (x + 22) + ' 228.5, ' + (x + 18) + ' 229 L ' + (x - 1.5) + ' 229 C ' + (x - 3.5) + ' 229, ' + (x - 3.5) + ' 224.5, ' + (x - 2) + ' 224.5 Z" fill="' + C.woodS + '" stroke="' + O + '" stroke-width="2.2" stroke-linejoin="round"/>';
      r += '<path d="M' + (x) + ' 226.6 L ' + (x + 18) + ' 226.6" stroke="' + C.woodL + '" stroke-width="0.8" opacity="0.7"/>';
      // cross straps
      r += '<path d="M' + (x + 5) + ' 219.5 L ' + (x + 11) + ' 225 M' + (x + 11) + ' 219.5 L ' + (x + 5) + ' 225" stroke="' + C.wood + '" stroke-width="2" stroke-linecap="round"/>';
      r += '<path d="M' + (x + 5) + ' 219.5 L ' + (x + 11) + ' 225 M' + (x + 11) + ' 219.5 L ' + (x + 5) + ' 225" stroke="' + O + '" stroke-width="0.6" stroke-linecap="round" opacity="0.5"/>';
      // ankle tie (red cotton cords with dangling tassel)
      r += '<path d="M' + (x - 2) + ' 214 C ' + (x + 4) + ' 216, ' + (x + 10) + ' 216, ' + (x + 14) + ' 214" fill="none" stroke="' + O + '" stroke-width="4" stroke-linecap="round"/>';
      r += '<path d="M' + (x - 2) + ' 214 C ' + (x + 4) + ' 216, ' + (x + 10) + ' 216, ' + (x + 14) + ' 214" fill="none" stroke="' + C.red + '" stroke-width="2.2" stroke-linecap="round"/>';
      r += '<path d="M' + (x - 1) + ' 211 C ' + (x + 4) + ' 213, ' + (x + 10) + ' 213, ' + (x + 13) + ' 211" fill="none" stroke="' + C.cot + '" stroke-width="1.6" stroke-linecap="round" opacity="0.9"/>';
      r += '<path d="M' + (x + 12) + ' 215 C ' + (x + 15) + ' 217, ' + (x + 15) + ' 219, ' + (x + 17) + ' 220 M' + (x + 12) + ' 215 C ' + (x + 13) + ' 218, ' + (x + 12) + ' 219, ' + (x + 13) + ' 221" fill="none" stroke="' + C.redS + '" stroke-width="1.3" stroke-linecap="round"/>';
      r += '<circle cx="' + (x + 12) + '" cy="215" r="1.6" fill="' + C.gold + '" stroke="' + O + '" stroke-width="0.8"/>';
      return r;
    }
    s += sandal(80) + sandal(99);
    return s;
  }

  function torso(u) {
    var s = '';
    s += '<path d="' + TORSO + '" fill="url(#aztec-fur-' + u + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<g clip-path="url(#aztec-torso-' + u + ')">' + rosette(76, 134, 3, 21) + rosette(114, 133, 3, 23) + '</g>';
    // ichcahuipilli (quilted cotton armour)
    s += '<path d="' + VEST + '" fill="url(#aztec-cot-' + u + ')" stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round"/>';
    var q = '';
    for (var i = -6; i < 8; i++) {
      q += 'M' + (60 + i * 8) + ' 136 L ' + (60 + i * 8 + 56) + ' 196 M' + (60 + i * 8 + 56) + ' 136 L ' + (60 + i * 8) + ' 196 ';
    }
    s += '<g clip-path="url(#aztec-vest-' + u + ')">' +
      '<path d="' + q + '" stroke="' + C.stitch + '" stroke-width="0.9" stroke-dasharray="1.6 1.3" fill="none"/>' +
      '<path d="M73 138 C 71 158, 72 176, 75 191 L 81 191 C 78 176, 78 158, 80 142 Z" fill="#8a7040" opacity="0.18"/>' +
      '<path d="M117 138 C 119 158, 118 176, 115 191 L 111 191 C 114 176, 114 158, 112 142 Z" fill="#8a7040" opacity="0.12"/>' +
      '</g>';
    // padded hem (scallops)
    var hem = '';
    for (var k = 0; k < 7; k++) {
      var hx = 76 + k * 5.7;
      hem += '<path d="M' + f(hx) + ' 186 C ' + f(hx) + ' 192, ' + f(hx + 5.7) + ' 192, ' + f(hx + 5.7) + ' 186" fill="' + C.cot + '" stroke="' + O + '" stroke-width="1.6"/>';
    }
    s += hem;
    // side lacing
    s += '<path d="M78 150 L 81 153 M78 156 L 81 159 M78 162 L 81 165 M113 150 L 110 153 M113 156 L 110 159 M113 162 L 110 165" stroke="' + C.redS + '" stroke-width="1.2" stroke-linecap="round"/>';
    // sash
    s += '<path d="M74 184 C 88 188, 104 188, 116 184 L 116 192 C 104 196, 88 196, 74 192 Z" fill="' + C.red + '" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>';
    s += '<path d="M76 187 C 88 190.5, 104 190.5, 114 187" stroke="' + C.redL + '" stroke-width="1.2" fill="none"/>';
    s += '<path d="M76 190 C 88 193.5, 104 193.5, 114 190" stroke="' + C.yel + '" stroke-width="0.9" stroke-dasharray="2 1.5" fill="none"/>';
    // maxtlatl front flap
    s += '<path d="M88 191 L 104 191 L 106.5 216 C 100 218, 93 218, 85.5 216 Z" fill="' + C.cot + '" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>';
    s += '<path d="M88 191 L 91 191 L 89 216.8 L 85.5 216 Z" fill="' + C.cotS + '"/>';
    s += '<path d="M86.2 205 L 105.8 205 L 106.5 216 C 100 218, 93 218, 85.5 216 Z" fill="' + C.red + '" stroke="' + O + '" stroke-width="1.6" stroke-linejoin="round"/>';
    s += fret(87.6, 206.6, 3, 6, C.cot, 1.1);
    s += '<path d="M86 204.2 L 106 204.2" stroke="' + C.q1 + '" stroke-width="1.3"/>';
    // fringe
    s += '<path d="M87.5 216.5 L 87.5 219.5 M90.5 217 L 90.5 220 M93.5 217.2 L 93.5 220.2 M96.5 217.3 L 96.5 220.3 M99.5 217.2 L 99.5 220.2 M102.5 217 L 102.5 220 M105 216.6 L 105 219.6" stroke="' + C.redS + '" stroke-width="1.3" stroke-linecap="round"/>';
    // sash knot
    s += '<path d="M104 187 C 108 184, 112 186, 111 190 C 110 194, 105 193, 104 190 Z" fill="' + C.redL + '" stroke="' + O + '" stroke-width="1.6"/>';
    s += '<path d="M109 192 C 112 197, 113 201, 111 205 L 108 204 C 109 200, 108 197, 106 193 Z" fill="' + C.red + '" stroke="' + O + '" stroke-width="1.4"/>';
    // jade bead necklace
    var beads = '';
    for (var b = 0; b <= 12; b++) {
      var t = b / 12, ang = Math.PI * (1 - t);
      var bx = 95 + Math.cos(ang) * 20, by = 131 + Math.sin(ang) * 11;
      beads += '<circle cx="' + f(bx) + '" cy="' + f(by) + '" r="' + (b % 3 === 0 ? 2.9 : 2.4) + '" fill="url(#aztec-jade-' + u + ')" stroke="' + O + '" stroke-width="1.2"/>';
    }
    s += beads;
    // gold pectoral disc
    s += '<path d="M95 142 L 95 145" stroke="' + O + '" stroke-width="2"/>';
    s += '<circle cx="95" cy="153" r="9" fill="url(#aztec-gold-' + u + ')" stroke="' + O + '" stroke-width="2.2"/>';
    var rays = '';
    for (var rI = 0; rI < 12; rI++) {
      var ra = rI * Math.PI / 6;
      rays += 'M' + f(95 + Math.cos(ra) * 5.2) + ' ' + f(153 + Math.sin(ra) * 5.2) + ' L ' + f(95 + Math.cos(ra) * 7.6) + ' ' + f(153 + Math.sin(ra) * 7.6) + ' ';
    }
    s += '<path d="' + rays + '" stroke="' + C.goldS + '" stroke-width="1.1"/>';
    s += '<circle cx="95" cy="153" r="4.2" fill="url(#aztec-jade-' + u + ')" stroke="' + O + '" stroke-width="1.3"/>';
    s += '<circle cx="93.8" cy="151.7" r="1.2" fill="#fff" opacity="0.85"/>';
    s += '<path d="M89 148 C 90.5 146.5, 92 146, 93.5 145.8" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.8"/>';
    // small bells under the disc
    s += '<path d="M91 161 L 90 165 M95 162 L 95 166.5 M99 161 L 100 165" stroke="' + O + '" stroke-width="1"/>';
    s += '<circle cx="90" cy="166" r="1.6" fill="' + C.gold + '" stroke="' + O + '" stroke-width="0.9"/><circle cx="95" cy="167.5" r="1.7" fill="' + C.gold + '" stroke="' + O + '" stroke-width="0.9"/><circle cx="100" cy="166" r="1.6" fill="' + C.gold + '" stroke="' + O + '" stroke-width="0.9"/>';
    return s;
  }

  function head(u, anim) {
    var s = '<g' + (anim ? ' class="part-head"' : '') + '>';
    // quetzal headdress plumes (behind)
    var pl = [[-100, 56, C.q4], [-88, 62, C.q3], [-75, 62, C.q1], [-62, 58, C.q2], [-48, 52, C.q5], [-34, 46, C.q1], [-20, 42, C.q2], [-6, 40, C.q3]];
    pl.forEach(function (p, i) { s += feather(74, 42, p[1], p[0], 7.5, p[2], i % 2 ? C.q5 : C.q4, '#e6fff4'); });
    var pl2 = [[-82, 34, C.q2], [-55, 36, C.q3], [-27, 34, C.q1], [-2, 28, C.q2]];
    pl2.forEach(function (p) { s += feather(74, 42, p[1], p[0], 5.5, p[2], C.redL, '#ffffff'); });
    // jaguar ears
    s += '<ellipse cx="72" cy="40" rx="10" ry="11" transform="rotate(-30 72 40)" fill="' + C.fur + '" stroke="' + O + '" stroke-width="3"/>';
    s += '<ellipse cx="72.5" cy="41" rx="5.5" ry="6.5" transform="rotate(-30 72 40)" fill="' + C.spot + '"/>';
    s += '<ellipse cx="73" cy="42" rx="3.5" ry="4.5" transform="rotate(-30 72 40)" fill="#d08a6a"/>';
    s += '<ellipse cx="118" cy="30" rx="10" ry="11" transform="rotate(15 118 30)" fill="' + C.fur + '" stroke="' + O + '" stroke-width="3"/>';
    s += '<ellipse cx="118" cy="31" rx="5.5" ry="6.5" transform="rotate(15 118 30)" fill="' + C.spot + '"/>';
    s += '<ellipse cx="118" cy="32" rx="3.5" ry="4.5" transform="rotate(15 118 30)" fill="#d08a6a"/>';
    // helmet back / lower jaw base
    s += '<path d="M70 72 C 50 78, 44 106, 56 124 C 68 136, 114 138, 138 124 C 143 119, 141 110, 133 106 L 130 72 Z" fill="' + C.furS + '" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    // open mouth interior
    s += '<ellipse cx="101" cy="98" rx="34" ry="31" fill="' + C.mouth + '" stroke="' + O + '" stroke-width="2.4"/>';
    s += '<path d="M72 110 C 80 124, 118 128, 132 110 C 128 122, 116 130, 101 130 C 86 130, 76 122, 72 110 Z" fill="#5a1520"/>';
    s += '<ellipse cx="101" cy="125" rx="14" ry="3.4" fill="' + C.tongue + '" stroke="' + O + '" stroke-width="1.2"/>';
    s += '<path d="M101 123 L 101 128" stroke="#a8404a" stroke-width="1"/>';
    // hair behind face
    s += '<path d="M72 80 C 66 92, 66 108, 72 116 L 80 112 L 78 84 Z" fill="' + C.hair + '" stroke="' + O + '" stroke-width="2"/>';
    // face
    s += '<ellipse cx="100" cy="97" rx="27" ry="25" fill="url(#aztec-skin-' + u + ')" stroke="' + O + '" stroke-width="2.8"/>';
    s += '<g clip-path="url(#aztec-face-' + u + ')">' +
      '<path d="M73 97 C 74 112, 86 122, 100 122 C 90 118, 80 110, 78 96 Z" fill="' + C.skinS + '" opacity="0.5"/>' +
      // face paint: black band across eyes (warrior paint) kept soft, gold stripes on cheeks
      '<path d="M73 92 C 88 89, 112 89, 128 92 L 128 101 C 112 99, 88 99, 73 102 Z" fill="' + C.spot + '" opacity="0.28"/>' +
      '<path d="M84 107 L 88 107 M83.5 110 L 87.5 110 M83.8 113 L 87.2 113" stroke="' + C.gold + '" stroke-width="1.4" stroke-linecap="round"/>' +
      '<path d="M117 106 L 121 106 M117.5 109 L 121 109" stroke="' + C.gold + '" stroke-width="1.4" stroke-linecap="round"/>' +
      '<path d="M104 118 L 104 121 M107 117.6 L 107 120.8 M101 117.8 L 101 121" stroke="' + C.red + '" stroke-width="1.1" stroke-linecap="round"/>' +
      '</g>';
    // blush
    s += '<ellipse cx="89" cy="108" rx="4.5" ry="2.4" fill="' + C.blush + '" opacity="0.45"/><ellipse cx="121" cy="107.5" rx="3.8" ry="2.2" fill="' + C.blush + '" opacity="0.45"/>';
    // bangs
    s += '<path d="M74 84 C 80 72, 96 68, 110 70 C 118 71, 124 74, 127 80 L 122 79 L 121 85 L 115 79 L 112 86 L 106 78 L 101 85 L 96 78 L 90 85 L 87 78 L 80 86 L 78 82 Z" fill="' + C.hair + '" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/>';
    s += '<path d="M92 76 C 98 73.5, 106 73.5, 112 75" stroke="#5a4a66" stroke-width="1.3" fill="none" stroke-linecap="round"/>';
    // gold ear spool
    s += '<circle cx="77" cy="103" r="6.2" fill="url(#aztec-gold-' + u + ')" stroke="' + O + '" stroke-width="2"/>';
    s += '<circle cx="77" cy="103" r="3.6" fill="url(#aztec-jade-' + u + ')" stroke="' + O + '" stroke-width="1.1"/>';
    s += '<circle cx="77" cy="103" r="1.2" fill="' + O + '"/>';
    s += '<path d="M73 99.5 C 74 98, 76 97.6, 77.5 97.6" stroke="#fff" stroke-width="1" fill="none" opacity="0.9"/>';
    // brows
    s += '<path d="M85 88.5 C 88 86, 93 85.6, 97 87.4" stroke="' + C.hair + '" stroke-width="2.8" fill="none" stroke-linecap="round"/>';
    s += '<path d="M108 87.4 C 112 85.4, 117 85.6, 121 88" stroke="' + C.hair + '" stroke-width="2.8" fill="none" stroke-linecap="round"/>';
    // eyes
    function eye(x, y) {
      return '<ellipse cx="' + x + '" cy="' + y + '" rx="5.6" ry="7" fill="#2a1a10"/>' +
        '<ellipse cx="' + x + '" cy="' + (y + 2.4) + '" rx="4.2" ry="3.8" fill="#8a5424"/>' +
        '<ellipse cx="' + x + '" cy="' + (y + 3.2) + '" rx="2.8" ry="2.2" fill="#c98a3a" opacity="0.8"/>' +
        '<ellipse cx="' + x + '" cy="' + y + '" rx="5.6" ry="7" fill="none" stroke="' + O + '" stroke-width="1.6"/>' +
        '<circle cx="' + (x - 1.8) + '" cy="' + (y - 2.8) + '" r="2.3" fill="#fff"/>' +
        '<circle cx="' + (x + 2) + '" cy="' + (y + 2.2) + '" r="1.1" fill="#fff"/>' +
        '<path d="M' + (x - 6.5) + ' ' + (y - 5) + ' C ' + (x - 3) + ' ' + (y - 8.6) + ', ' + (x + 3) + ' ' + (y - 8.6) + ', ' + (x + 6.8) + ' ' + (y - 4.4) + '" stroke="' + O + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    }
    s += '<g' + (anim ? ' class="part-eyes" style="transform-origin: 103px 97px"' : '') + '>' + eye(91, 97) + eye(114, 97) + '</g>';
    // nose + mouth
    s += '<path d="M105 102 C 106.5 104.5, 106.5 106, 104 106.6" stroke="' + C.skinS + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    s += '<path d="M99 112 C 102 114.6, 107 114.6, 110 111" stroke="' + O + '" stroke-width="1.9" fill="none" stroke-linecap="round"/>';
    s += '<path d="M101.5 113.3 C 103.5 115.8, 106.5 115.6, 108 113.2 Z" fill="#b8434a"/>';
    // lower jaw rim with fangs pointing up
    s += '<path d="M62 116 L 66 106 L 71 117 Z M127 117 L 130 105 L 135 114 Z" fill="#fffbea" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>';
    s += '<path d="M72 121 L 74.5 114 L 78 122 Z M121 121.5 L 124 115 L 126.5 120 Z" fill="#fffbea" stroke="' + O + '" stroke-width="1.5" stroke-linejoin="round"/>';
    s += '<path d="M56 116 C 66 132, 112 138, 138 118 C 142 124, 136 132, 124 136 C 100 142, 66 138, 54 124 Z" fill="url(#aztec-fur-' + u + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<path d="M62 126 C 78 134, 110 136, 132 125" stroke="' + C.furL + '" stroke-width="1.6" fill="none" opacity="0.8"/>';
    s += rosette(70, 131, 2.4, 31) + rosette(118, 133, 2.4, 37) + dot(94, 137, 1) + dot(84, 136, 1.1) + dot(106, 137.5, 1);
    // dome / upper jaw
    s += '<path d="' + DOME + '" fill="url(#aztec-fur-' + u + ')" stroke="' + O + '" stroke-width="3.2" stroke-linejoin="round"/>';
    s += '<g clip-path="url(#aztec-dome-' + u + ')">' +
      '<path d="M50 60 C 60 80, 74 78, 90 72 L 60 100 Z" fill="' + C.furS + '" opacity="0.6"/>' +
      '<path d="M64 60 C 60 44, 90 30, 118 32" stroke="#fff5d0" stroke-width="3.5" fill="none" opacity="0.55" stroke-linecap="round"/>' +
      rosette(68, 56, 3.6, 41) + rosette(84, 44, 3.4, 43) + rosette(66, 76, 3, 47) + rosette(100, 36, 3, 53) +
      rosette(82, 62, 3, 59) + rosette(138, 42, 2.6, 61) + dot(95, 60, 1.4) + dot(76, 68, 1.2) + dot(90, 34, 1.2) + dot(128, 36, 1.2) + rosette(115, 40, 2.4, 67) + rosette(96, 62, 2.2, 69) + rosette(58, 68, 2.8, 77) + dot(110, 60, 1.1) + dot(120, 64, 1) + dot(142, 54, 1) + dot(72, 50, 1.1) + dot(106, 32, 1) +
      // cream muzzle pad
      '<path d="M130 70 C 136 62, 150 60, 160 66 L 162 80 L 128 80 Z" fill="#fff0cc"/>' +
      '<path d="M112 72 C 100 69, 85 71, 75 79 L 72 76 C 84 67, 102 66, 116 69 Z" fill="' + C.furS + '" opacity="0.8"/>' +
      '</g>';
    // whisker dots + muzzle line
    s += '<circle cx="140" cy="71" r="0.9" fill="' + C.spot + '"/><circle cx="144" cy="69.5" r="0.9" fill="' + C.spot + '"/><circle cx="143" cy="73.5" r="0.9" fill="' + C.spot + '"/><circle cx="147" cy="72" r="0.9" fill="' + C.spot + '"/>';
    s += '<path d="M152 70 C 152 74, 150 76, 147 77.5" stroke="' + O + '" stroke-width="1.5" fill="none" stroke-linecap="round"/>';
    // nose
    s += '<path d="M154 62.5 C 158 61.5, 162 63, 162 65 C 161 68, 158 69.5, 156 70 C 154 68, 152.5 65, 154 62.5 Z" fill="#6a2a2a" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>';
    s += '<ellipse cx="157" cy="63.8" rx="1.8" ry="0.9" fill="#fff" opacity="0.6"/>';
    // upper fangs
    s += '<path d="M78 76 L 81 88 L 85 74 Z M133 76 L 134.5 89 L 140 78 Z" fill="#fffbea" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>';
    s += '<path d="M88 72.5 L 90 79 L 92.5 71.8 Z M125 73 L 126.5 80 L 129.5 74.5 Z M145 79.5 L 146.5 84 L 149 80.5 Z" fill="#fffbea" stroke="' + O + '" stroke-width="1.4" stroke-linejoin="round"/>';
    s += '<path d="M80 78 L 81.2 83" stroke="#d8cfb0" stroke-width="0.9"/><path d="M135 79 L 135 84" stroke="#d8cfb0" stroke-width="0.9"/>';
    // helmet eyes (jaguar)
    function jeye(x, y, w, rot) {
      return '<g transform="rotate(' + rot + ' ' + x + ' ' + y + ')">' +
        '<path d="M' + (x - w) + ' ' + y + ' C ' + (x - w * 0.4) + ' ' + (y - w * 0.62) + ', ' + (x + w * 0.5) + ' ' + (y - w * 0.62) + ', ' + (x + w) + ' ' + (y - 1) + ' C ' + (x + w * 0.4) + ' ' + (y + w * 0.5) + ', ' + (x - w * 0.5) + ' ' + (y + w * 0.5) + ', ' + (x - w) + ' ' + y + ' Z" fill="#e9d64a" stroke="' + O + '" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<ellipse cx="' + (x + 0.5) + '" cy="' + (y - 0.3) + '" rx="1.5" ry="' + f(w * 0.42) + '" fill="' + O + '"/>' +
        '<circle cx="' + (x - w * 0.35) + '" cy="' + (y - w * 0.18) + '" r="1.1" fill="#fff"/>' +
        '<path d="M' + (x - w - 1) + ' ' + (y - 3) + ' C ' + (x - w * 0.3) + ' ' + (y - w * 0.9) + ', ' + (x + w * 0.5) + ' ' + (y - w * 0.9) + ', ' + (x + w + 1.5) + ' ' + (y - 2.5) + '" stroke="' + O + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        '<path d="M' + (x + w) + ' ' + y + ' L ' + (x + w + 3) + ' ' + (y + 2) + '" stroke="' + O + '" stroke-width="1.6" stroke-linecap="round"/>' +
        '</g>';
    }
    s += jeye(104, 49, 7, -6) + jeye(128, 53, 8, 4);
    // headdress holder: gold band with jade & macaw feather tuft
    s += '<path d="M60 58 C 62 44, 72 36, 84 33 L 88 40 C 78 43, 70 50, 68 60 Z" fill="url(#aztec-gold-' + u + ')" stroke="' + O + '" stroke-width="2.2" stroke-linejoin="round"/>';
    s += '<path d="M63 55 L 67 56 M65 49 L 69 51 M69 43 L 72 46 M75 38 L 77 41.5 M81 35 L 83 39" stroke="' + C.goldS + '" stroke-width="1"/>';
    s += '<circle cx="74" cy="42" r="5.2" fill="url(#aztec-gold-' + u + ')" stroke="' + O + '" stroke-width="2"/>';
    s += '<circle cx="74" cy="42" r="2.8" fill="url(#aztec-jade-' + u + ')" stroke="' + O + '" stroke-width="1"/>';
    s += '<circle cx="73" cy="41" r="0.9" fill="#fff"/>';
    s += '</g>';
    return s;
  }

  function shieldArm(u) {
    var s = '';
    // arm
    s += '<path d="' + ARMS + '" fill="url(#aztec-fur-' + u + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<g clip-path="url(#aztec-arms-' + u + ')">' + rosette(70, 142, 2.8, 71) + rosette(64, 158, 2.6, 73) + dot(75, 150, 1) + '</g>';
    // gold armlet
    s += '<path d="M66 144 C 70 146, 76 146, 80 142 L 78 148 C 74 151, 68 151, 64 149 Z" fill="url(#aztec-gold-' + u + ')" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>';
    // feather fringe hanging from shield
    var fr = [[150, C.red], [163, C.q1], [176, C.yel], [189, C.q3], [202, C.red], [215, C.q2]];
    fr.forEach(function (p, i) {
      var a = (p[0] - 90) * Math.PI / 180 + Math.PI / 2;
      var bx = 60 + Math.sin(p[0] * Math.PI / 180) * 17, by = 172 - Math.cos(p[0] * Math.PI / 180) * 20;
      s += feather(bx, by, 19 + (i % 2) * 3, p[0], 4.2, p[1], i % 2 ? C.q4 : C.redS, '#ffffff');
    });
    // chimalli
    s += '<ellipse cx="60" cy="172" rx="21" ry="24" fill="' + C.cot + '" stroke="' + O + '" stroke-width="3"/>';
    s += '<g clip-path="url(#aztec-shield-' + u + ')">' +
      '<rect x="36" y="146" width="50" height="19" fill="#1aa37a"/>' +
      '<rect x="36" y="179" width="50" height="20" fill="' + C.red + '"/>' +
      '<rect x="36" y="165" width="50" height="14" fill="' + C.cot + '"/>' +
      fret(40, 166, 4, 11.5, O, 1.9) +
      '<path d="M36 165 L 86 165 M36 179 L 86 179" stroke="' + O + '" stroke-width="1.6"/>' +
      // feather scale texture top half
      '<path d="M42 158 C 44 154, 48 154, 50 158 C 52 154, 56 154, 58 158 C 60 154, 64 154, 66 158 C 68 154, 72 154, 74 158 C 76 154, 80 154, 82 158" stroke="#0b6b58" stroke-width="1.1" fill="none"/>' +
      '<path d="M46 152 C 48 148, 52 148, 54 152 C 56 148, 60 148, 62 152 C 64 148, 68 148, 70 152 C 72 148, 76 148, 78 152" stroke="#0b6b58" stroke-width="1.1" fill="none"/>' +
      '<path d="M44 186 L 76 186 M46 192 L 74 192" stroke="' + C.redS + '" stroke-width="1" stroke-dasharray="3 2"/>' +
      '<circle cx="50" cy="186" r="1.6" fill="' + C.cot + '"/><circle cx="60" cy="189" r="1.6" fill="' + C.cot + '"/><circle cx="70" cy="186" r="1.6" fill="' + C.cot + '"/>' +
      // cel shade crescent + highlight
      '<path d="M36 146 L 36 200 L 84 200 C 70 198, 52 190, 46 172 C 42 160, 44 152, 50 146 Z" fill="#000" opacity="0.14"/>' +
      '<path d="M66 152 C 74 155, 78 162, 79 168" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.55"/>' +
      '</g>';
    // gold rim with studs
    s += '<ellipse cx="60" cy="172" rx="21" ry="24" fill="none" stroke="' + C.gold + '" stroke-width="3"/>';
    s += '<ellipse cx="60" cy="172" rx="22.5" ry="25.5" fill="none" stroke="' + O + '" stroke-width="1.8"/>';
    s += '<ellipse cx="60" cy="172" rx="19.4" ry="22.4" fill="none" stroke="' + O + '" stroke-width="1"/>';
    for (var i = 0; i < 12; i++) {
      var a = i * Math.PI / 6;
      s += '<circle cx="' + f(60 + Math.cos(a) * 21) + '" cy="' + f(172 + Math.sin(a) * 24) + '" r="1" fill="' + C.goldL + '" stroke="' + C.goldS + '" stroke-width="0.5"/>';
    }
    return s;
  }

  function weaponArm(u, anim) {
    var s = '<g' + (anim ? ' class="part-weapon" style="transform-origin: 114px 140px"' : '') + '>';
    // macuahuitl
    var club = '';
    club += '<path d="M-6 -6 L -7.5 -70 C -7.5 -80, 7.5 -80, 7.5 -70 L 6 -6 Z" fill="none" stroke="' + O + '" stroke-width="5" stroke-linejoin="round"/>';
    // obsidian teeth
    for (var y = -14; y >= -70; y -= 8) {
      var t = -1 + (y + 14) / -56 * 0.2;
      club += '<path d="M6 ' + (y - 3.5) + ' L 13 ' + (y - 1.2) + ' L 12 ' + (y + 2.6) + ' L 6 ' + (y + 3.5) + ' Z" fill="url(#aztec-obs-' + u + ')" stroke="' + O + '" stroke-width="1.4" stroke-linejoin="round"/>';
      club += '<path d="M7.4 ' + (y - 2.4) + ' L 11.6 ' + (y - 1) + '" stroke="' + C.obsL + '" stroke-width="1" stroke-linecap="round"/>';
      club += '<circle cx="9.2" cy="' + (y + 0.6) + '" r="0.6" fill="#e8ecff" opacity="0.9"/>';
      club += '<path d="M-6 ' + (y - 3.5) + ' L -13 ' + (y - 1.2) + ' L -12 ' + (y + 2.6) + ' L -6 ' + (y + 3.5) + ' Z" fill="url(#aztec-obs-' + u + ')" stroke="' + O + '" stroke-width="1.4" stroke-linejoin="round"/>';
      club += '<path d="M-7.4 ' + (y - 2.4) + ' L -11.6 ' + (y - 1) + '" stroke="' + C.obsL + '" stroke-width="1" stroke-linecap="round"/>';
    }
    // tip shards
    club += '<path d="M-4 -76 L -3 -84 L 1.5 -86 L 4 -77 Z" fill="url(#aztec-obs-' + u + ')" stroke="' + O + '" stroke-width="1.4" stroke-linejoin="round"/>';
    club += '<path d="M-2.2 -78 L -1.6 -83" stroke="' + C.obsL + '" stroke-width="1" stroke-linecap="round"/>';
    // wooden paddle
    club += '<path d="M-6 -6 L -7.5 -70 C -7.5 -80, 7.5 -80, 7.5 -70 L 6 -6 Z" fill="url(#aztec-wood-' + u + ')" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>';
    club += '<path d="M-4.2 -10 L -5 -68 M4.6 -12 L 5 -66" stroke="' + C.woodS + '" stroke-width="0.9" opacity="0.7"/>';
    club += '<path d="M-1.5 -20 C -2 -34, -1 -46, -2 -60" stroke="' + C.woodL + '" stroke-width="1.2" fill="none" opacity="0.8" stroke-linecap="round"/>';
    // painted step-fret along the paddle (red & gold)
    club += '<path d="M-3 -18 L 3 -18 L 3 -22 L -1 -22 L -1 -26 L 3 -26 M-3 -34 L 3 -34 L 3 -38 L -1 -38 L -1 -42 L 3 -42 M-3 -50 L 3 -50 L 3 -54 L -1 -54 L -1 -58 L 3 -58" stroke="' + C.red + '" stroke-width="1.4" fill="none"/>';
    club += '<circle cx="0" cy="-30" r="1.2" fill="' + C.gold + '"/><circle cx="0" cy="-46" r="1.2" fill="' + C.gold + '"/><circle cx="0" cy="-64" r="1.5" fill="' + C.jade + '" stroke="' + O + '" stroke-width="0.6"/>';
    // carved handle
    club += '<rect x="-3.4" y="-8" width="6.8" height="22" rx="2" fill="url(#aztec-wood-' + u + ')" stroke="' + O + '" stroke-width="2"/>';
    club += '<path d="M-3.4 -5 L 3.4 -5 M-3.4 8 L 3.4 8 M-3.4 10.5 L 3.4 10.5" stroke="' + C.woodS + '" stroke-width="1.1"/>';
    club += '<ellipse cx="0" cy="15" rx="5.2" ry="3" fill="' + C.woodL + '" stroke="' + O + '" stroke-width="2"/>';
    club += '<path d="M-3 15 L 3 15" stroke="' + C.woodS + '" stroke-width="1"/>';
    // wrist cord
    club += '<path d="M-1 16 C -9 24, -8 33, 1 32 C 7 31, 6 22, 1 17" fill="none" stroke="' + O + '" stroke-width="3.2" stroke-linecap="round"/>';
    club += '<path d="M-1 16 C -9 24, -8 33, 1 32 C 7 31, 6 22, 1 17" fill="none" stroke="' + C.red + '" stroke-width="1.7" stroke-linecap="round"/>';
    club += '<circle cx="-5.5" cy="27" r="1.8" fill="url(#aztec-jade-' + u + ')" stroke="' + O + '" stroke-width="0.8"/>';
    club += '<path d="M1 32 L 0 38 M1 32 L 2.5 38 M1 32 L 4.5 37" stroke="' + C.redS + '" stroke-width="1.2" stroke-linecap="round"/>';
    s += '<g transform="translate(135 168) rotate(30)">' + club + '</g>';
    // arm
    s += '<path d="' + ARMW + '" fill="url(#aztec-fur-' + u + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<g clip-path="url(#aztec-armw-' + u + ')">' + rosette(118, 142, 2.8, 81) + rosette(127, 156, 2.6, 83) + dot(112, 147, 1) + dot(131, 150, 0.9) +
      '<path d="M104 140 C 108 150, 118 160, 130 172 L 124 176 Z" fill="' + C.furS + '" opacity="0.5"/></g>';
    // gold armlet + wrist cuff
    s += '<path d="M112 147 C 116 145, 121 142, 124 139 L 126 144 C 123 147, 118 150, 114 152 Z" fill="url(#aztec-gold-' + u + ')" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>';
    s += '<path d="M126 164 L 136 159 L 139 165 L 129 170 Z" fill="url(#aztec-gold-' + u + ')" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>';
    s += '<path d="M128.5 165.5 L 136.5 161.5" stroke="' + C.goldS + '" stroke-width="0.9" stroke-dasharray="1.2 1"/>';
    // fist
    s += '<ellipse cx="136" cy="169" rx="6.6" ry="6" fill="url(#aztec-skin-' + u + ')" stroke="' + O + '" stroke-width="2.4"/>';
    s += '<path d="M138 164 C 141 165, 142 167, 141 170 M139.5 167.5 C 142 169, 142 171, 140 173 M136 164 C 133 166, 132 170, 134 173" stroke="' + C.skinS + '" stroke-width="1.1" fill="none" stroke-linecap="round"/>';
    s += '</g>';
    return s;
  }

  function hero(u) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240">' + defs(u) +
      shadow(true) + legs(u) +
      '<g class="part-body">' + cape(u, true) + torso(u) + head(u, true) + shieldArm(u) + weaponArm(u, true) + '</g>' +
      '</svg>';
  }

  function portrait(u) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' + defs(u) +
      '<g transform="translate(-13 1) scale(0.7)">' + cape(u, false) + torso(u) + head(u, false) + shieldArm(u) + weaponArm(u, false) + '</g>' +
      '</svg>';
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

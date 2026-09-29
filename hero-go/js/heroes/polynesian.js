/* Hero Go! — Kaimana, The Ocean Warrior (key: polynesian)
 * Hand-authored inline SVG. Chibi, facing right. See ART_CONTRACT.md.
 * Broadly inspired by Māori / Samoan / Hawaiian warrior traditions:
 * tatau linework, pounamu hei-matau, niho mano (shark-tooth) bands,
 * piupiu flax skirt, tapa cloth, feather cloak and a leiomano club.
 */
(function () {
  'use strict';

  var O = '#2b1d14';           // outline
  var SKIN = '#b9784a', SKIN_SH = '#8e5533', SKIN_HI = '#d99d6c', SKIN_DK = '#7a4529';
  var INK = '#2a1a14';         // tattoo ink

  function f(n) { return +n.toFixed(2); }

  /* ---------- helpers ---------- */

  // Archimedean spiral (koru-like) as a polyline path
  function spiral(cx, cy, r, turns, dir, start) {
    var steps = Math.round(turns * 28), d = '';
    start = start || 0;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var a = start + dir * t * turns * Math.PI * 2;
      var rr = 0.6 + (r - 0.6) * t;
      d += (i ? 'L' : 'M') + f(cx + Math.cos(a) * rr) + ' ' + f(cy + Math.sin(a) * rr);
    }
    return d;
  }

  // niho mano: band of triangles between two parallel lines
  function toothBand(x1, y1, x2, y2, n, h, col, sw) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy);
    var nx = -dy / L * h, ny = dx / L * h, s = '', tri = '';
    for (var i = 0; i < n; i++) {
      var a = i / n, b = (i + 1) / n, m = (a + b) / 2;
      tri += 'M' + f(x1 + dx * a) + ' ' + f(y1 + dy * a) +
        'L' + f(x1 + dx * b) + ' ' + f(y1 + dy * b) +
        'L' + f(x1 + dx * m + nx) + ' ' + f(y1 + dy * m + ny) + 'Z';
    }
    s += '<path d="' + tri + '" fill="' + col + '"/>';
    s += '<path d="M' + f(x1) + ' ' + f(y1) + 'L' + f(x2) + ' ' + f(y2) +
      'M' + f(x1 + nx) + ' ' + f(y1 + ny) + 'L' + f(x2 + nx) + ' ' + f(y2 + ny) +
      '" stroke="' + col + '" stroke-width="' + (sw || 0.9) + '" fill="none"/>';
    return s;
  }

  // single feather (teardrop) pointing along angle (deg), tip length len
  function feather(x, y, ang, len, fill, rib, P) {
    var w = len * 0.36, k, b = '', sh = '';
    for (k = 0; k < 6; k++) {
      var t = 0.24 + k * 0.1, bw = w * (0.78 - Math.abs(t - 0.45) * 0.9);
      b += 'M0 ' + f(len * t) + 'L' + f(bw) + ' ' + f(len * (t + 0.11)) + 'M0 ' + f(len * t) + 'L' + f(-bw) + ' ' + f(len * (t + 0.11));
    }
    var out = '<g transform="translate(' + f(x) + ' ' + f(y) + ') rotate(' + f(ang) + ')">' +
      '<path d="M0 0 C' + f(w) + ' ' + f(len * 0.25) + ' ' + f(w * 0.8) + ' ' + f(len * 0.8) + ' 0 ' + f(len) +
      ' C' + f(-w * 0.8) + ' ' + f(len * 0.8) + ' ' + f(-w) + ' ' + f(len * 0.25) + ' 0 0Z" fill="' + fill +
      '" stroke="' + O + '" stroke-width="1" stroke-linejoin="round"/>';
    if (P) out += '<path d="M0 0 C' + f(w) + ' ' + f(len * 0.25) + ' ' + f(w * 0.8) + ' ' + f(len * 0.8) + ' 0 ' + f(len) +
      ' C' + f(-w * 0.8) + ' ' + f(len * 0.8) + ' ' + f(-w) + ' ' + f(len * 0.25) + ' 0 0Z" fill="url(#polynesian-feath' + P + ')"/>';
    out += '<path d="M' + f(-w * 0.55) + ' ' + f(len * 0.3) + ' Q' + f(-w * 0.3) + ' ' + f(len * 0.65) + ' ' + f(-w * 0.1) + ' ' + f(len * 0.86) + '" stroke="#fff" stroke-width=".6" fill="none" opacity=".35" stroke-linecap="round"/>' +
      '<path d="' + b + '" stroke="' + rib + '" stroke-width="0.4" opacity=".75" fill="none"/>' +
      '<path d="M0 1 L0 ' + f(len * 0.9) + '" stroke="' + rib + '" stroke-width="0.8" stroke-linecap="round"/>' +
      '<path d="M0 ' + f(len * 0.9) + ' l0 ' + f(len * 0.06) + '" stroke="#fff" stroke-width=".5" opacity=".6"/>' +
      '</g>';
    return out;
  }

  // ring of leaves (ankle / arm cuff) centred at cx,y spanning width w
  function leafCuff(cx, y, w, n) {
    var s = '<path d="M' + f(cx - w / 2) + ' ' + f(y) + 'Q' + cx + ' ' + f(y + 3) + ' ' + f(cx + w / 2) + ' ' + f(y) +
      '" stroke="' + O + '" stroke-width="4.4" fill="none" stroke-linecap="round"/>' +
      '<path d="M' + f(cx - w / 2) + ' ' + f(y) + 'Q' + cx + ' ' + f(y + 3) + ' ' + f(cx + w / 2) + ' ' + f(y) +
      '" stroke="#8a6a2e" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    for (var i = 0; i < n; i++) {
      var t = n === 1 ? 0.5 : i / (n - 1);
      var x = cx - w / 2 + w * t, yy = y + 3 * 4 * t * (1 - t) * 0.5;
      var ang = -60 + 120 * t + (i % 2 ? 18 : -10);
      var col = i % 2 ? '#4f9a3a' : '#6cbf4a';
      s += '<g transform="translate(' + f(x) + ' ' + f(yy) + ') rotate(' + f(ang + 180) + ')">' +
        '<path d="M0 0 Q4 4.4 0 11 Q-4 4.4 0 0Z" fill="' + col + '" stroke="' + O + '" stroke-width="0.9"/>' +
        '<path d="M0 1 L0 9.4" stroke="#2f6a25" stroke-width="0.55"/>' +
        '<path d="M-0.9 3 Q-1.6 5 -0.9 6.5" stroke="#b7e59a" stroke-width="0.5" fill="none"/>' +
        '</g>';
    }
    s += '<circle cx="' + f(cx - w * 0.22) + '" cy="' + f(y + 2) + '" r="1.5" fill="#f1e6c8" stroke="' + O + '" stroke-width=".7"/><circle cx="' + f(cx - w * 0.22 - .4) + '" cy="' + f(y + 1.5) + '" r=".4" fill="#fff"/>' +
      '<circle cx="' + f(cx + w * 0.12) + '" cy="' + f(y + 2.8) + '" r="1.3" fill="#2f9a8a" stroke="' + O + '" stroke-width=".7"/><circle cx="' + f(cx + w * 0.12 - .4) + '" cy="' + f(y + 2.3) + '" r=".35" fill="#c9fff0"/>';
    return s;
  }

  // bare foot, heel at x, toes pointing right
  function foot(x, fill, sh) {
    var y = 219;
    var s = '<path d="M' + x + ' ' + (y + 5) + 'Q' + x + ' ' + (y + 11) + ' ' + (x + 6) + ' ' + (y + 11) +
      'L' + (x + 23) + ' ' + (y + 11) + 'Q' + (x + 29) + ' ' + (y + 11) + ' ' + (x + 28.5) + ' ' + (y + 6.5) +
      'Q' + (x + 27.5) + ' ' + (y + 2) + ' ' + (x + 20) + ' ' + (y + 1) + 'L' + (x + 6) + ' ' + y +
      'Q' + x + ' ' + y + ' ' + x + ' ' + (y + 5) + 'Z" fill="' + fill + '" stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round"/>';
    // sole shade
    s += '<path d="M' + (x + 2) + ' ' + (y + 8.5) + 'Q' + (x + 14) + ' ' + (y + 10.6) + ' ' + (x + 26) + ' ' + (y + 9) +
      'L' + (x + 25) + ' ' + (y + 10) + 'Q' + (x + 14) + ' ' + (y + 11.5) + ' ' + (x + 4) + ' ' + (y + 10) + 'Z" fill="' + sh + '"/>';
    // toes: separations + nails
    s += '<path d="M' + (x + 18.5) + ' ' + (y + 5.5) + 'L' + (x + 18.5) + ' ' + (y + 10) +
      'M' + (x + 21.5) + ' ' + (y + 4.8) + 'L' + (x + 21.8) + ' ' + (y + 10) +
      'M' + (x + 24.3) + ' ' + (y + 4.8) + 'L' + (x + 24.8) + ' ' + (y + 9.8) +
      '" stroke="' + O + '" stroke-width="0.9" stroke-linecap="round"/>';
    s += '<ellipse cx="' + (x + 26.6) + '" cy="' + (y + 5.2) + '" rx="1.3" ry="0.9" fill="#f3d2b4" opacity=".9"/>' +
      '<ellipse cx="' + (x + 23.2) + '" cy="' + (y + 4.1) + '" rx="1" ry="0.7" fill="#f3d2b4" opacity=".85"/>' +
      '<ellipse cx="' + (x + 20.2) + '" cy="' + (y + 3.6) + '" rx="0.9" ry="0.6" fill="#f3d2b4" opacity=".8"/>';
    s += '<path d="M' + (x + 3) + ' ' + (y + 9) + ' q1 -1.6 2.6 -.6 q1.2 -1.4 2.4 .2 q1.4 -1 2.2 .8 L' + (x + 9) + ' ' + (y + 10.2) + ' L' + (x + 3) + ' ' + (y + 10.2) + 'Z" fill="#5a3a20" opacity=".8"/>' +
      '<circle cx="' + (x + 13) + '" cy="' + (y + 8.6) + '" r=".7" fill="#5a3a20" opacity=".8"/><circle cx="' + (x + 24) + '" cy="' + (y + 9.2) + '" r=".6" fill="#5a3a20" opacity=".7"/>';
    s += '<path d="M' + (x + 12) + ' ' + (y + 2) + ' q2 3 1.4 6 M' + (x + 15) + ' ' + (y + 2.2) + ' q1.6 2.4 1.2 5" stroke="' + SKIN_DK + '" stroke-width=".5" fill="none" opacity=".6"/>';
    s += '<path d="M' + (x + 21) + ' ' + (y + 1.6) + ' L' + (x + 27) + ' ' + (y + 3) + '" stroke="' + SKIN_HI + '" stroke-width=".8" opacity=".7" stroke-linecap="round"/>';
    // ankle bone + arch highlight
    s += '<path d="M' + (x + 5) + ' ' + (y + 3) + 'Q' + (x + 8) + ' ' + (y + 1.5) + ' ' + (x + 11) + ' ' + (y + 3) +
      '" stroke="' + SKIN_HI + '" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".8"/>';
    return s;
  }

  /* ---------- defs ---------- */
  function defs(P) {
    var id = function (n) { return 'polynesian-' + n + P; };
    return '<defs>' +
      '<radialGradient id="' + id('skin') + '" cx="0.62" cy="0.3" r="0.8">' +
      '<stop offset="0" stop-color="' + SKIN_HI + '"/><stop offset=".55" stop-color="' + SKIN + '"/><stop offset="1" stop-color="' + SKIN_SH + '"/></radialGradient>' +
      '<radialGradient id="' + id('face') + '" cx="0.66" cy="0.42" r="0.72">' +
      '<stop offset="0" stop-color="#e2a877"/><stop offset=".6" stop-color="' + SKIN + '"/><stop offset="1" stop-color="' + SKIN_SH + '"/></radialGradient>' +
      '<linearGradient id="' + id('wood') + '" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="#4a2913"/><stop offset=".35" stop-color="#8a5227"/><stop offset=".55" stop-color="#a8683a"/><stop offset="1" stop-color="#5a3117"/></linearGradient>' +
      '<linearGradient id="' + id('jade') + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#a6f0c0"/><stop offset=".45" stop-color="#3fae6d"/><stop offset="1" stop-color="#15573a"/></linearGradient>' +
      '<linearGradient id="' + id('hair') + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#3b2b27"/><stop offset="1" stop-color="#17100e"/></linearGradient>' +
      '<linearGradient id="' + id('tapa') + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#f2dfb6"/><stop offset="1" stop-color="#d9bb86"/></linearGradient>' +
      '<linearGradient id="' + id('iris') + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#1c0f0a"/><stop offset=".6" stop-color="#5a2f16"/><stop offset="1" stop-color="#a0602a"/></linearGradient>' +
      '<linearGradient id="' + id('tooth') + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#d9ccaa"/></linearGradient>' +
      '<radialGradient id="' + id('bg') + '" cx=".5" cy=".4" r=".7">' +
      '<stop offset="0" stop-color="#ffd9a0"/><stop offset=".6" stop-color="#f2a04a"/><stop offset="1" stop-color="#c8621a"/></radialGradient>' +
      '<linearGradient id="' + id('feath') + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#fff" stop-opacity=".0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>' +
      '<linearGradient id="' + id('sheen') + '" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<pattern id="' + id('weave') + '" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
      '<rect width="3" height="3" fill="none"/><path d="M0 0.75 H3 M0 2.25 H3" stroke="#000" stroke-opacity=".22" stroke-width=".7"/><path d="M0.75 0 V3" stroke="#fff" stroke-opacity=".22" stroke-width=".6"/></pattern>' +
      '<pattern id="' + id('bark') + '" width="6" height="5" patternUnits="userSpaceOnUse">' +
      '<path d="M0 1 H4 M2 3 H6 M1 4.6 H3" stroke="#a5804a" stroke-opacity=".55" stroke-width=".45"/><circle cx="4.5" cy="1.6" r=".35" fill="#8f6a3a" fill-opacity=".6"/></pattern>' +
      '<clipPath id="' + id('torso') + '"><path d="M74 112 Q97 103 122 111 Q130 132 126 160 L69 160 Q65 132 74 112Z"/></clipPath>' +
      '<clipPath id="' + id('flapclip') + '"><path d="M112 168 Q118 180 114 192 L124 190 Q125 178 121 167Z"/></clipPath>' +
      '<clipPath id="' + id('tapaclip') + '"><path d="M69 154 Q97 161 127 154 L128 171 Q97 178 68 171Z"/></clipPath>' +
      '<clipPath id="' + id('pclip') + '"><circle cx="60" cy="60" r="56"/></clipPath>' +
      '</defs>';
  }

  /* ---------- body pieces (all in 200x240 hero space) ---------- */

  function capeBack(P) {
    // feather cloak hanging behind the left (rear) shoulder
    var s = '<path d="M62 110 Q52 140 50 176 Q64 184 80 178 L84 116 Z" fill="#7a1f18" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    var rows = [[114, 58, 80], [124, 55, 80], [134, 53, 80], [144, 52, 80], [154, 51, 80], [164, 50, 80]];
    for (var r = 0; r < rows.length; r++) {
      var y = rows[r][0];
      for (var x = rows[r][1] + (r % 2) * 3; x <= rows[r][2]; x += 6) {
        var yellow = (r === 2 || r === 5) || (x > 74 && r % 2 === 0);
        s += feather(x, y, 8 - (x - 66) * 0.4, 13, yellow ? '#f4b83a' : '#d23a2c', yellow ? '#a8661c' : '#7a1c16', P);
      }
    }
    return s;
  }

  function backArm() {
    var s = '';
    // hanging rear arm (left side), mostly behind mantle
    s += '<path d="M76 118 Q66 132 64 156" stroke="' + O + '" stroke-width="17" stroke-linecap="round" fill="none"/>';
    s += '<path d="M76 118 Q66 132 64 156" stroke="' + SKIN_SH + '" stroke-width="12" stroke-linecap="round" fill="none"/>';
    s += '<path d="M72 124 Q66 136 65 152" stroke="' + SKIN + '" stroke-width="4" stroke-linecap="round" fill="none" opacity=".7"/>';
    // woven wrist band
    s += '<path d="M57 148 L71 150" stroke="' + O + '" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M57 148 L71 150" stroke="#c9a15a" stroke-width="3.6" stroke-linecap="round"/>' +
      '<path d="M59 146.8 l1.6 2.6 M62 147.2 l1.6 2.6 M65 147.6 l1.6 2.6 M68 148 l1.6 2.6" stroke="#7a5a26" stroke-width="0.8"/>';
    s += '<path d="M69 122 Q63 134 62 148" stroke="' + SKIN_DK + '" stroke-width="3" fill="none" opacity=".35" stroke-linecap="round"/>';
    s += '<path d="M70 121 Q67 128 66 136" stroke="' + SKIN_HI + '" stroke-width="1.2" fill="none" opacity=".45" stroke-linecap="round"/>';
    s += '<path d="M62 132 l6 1.8 M61.4 135.4 l6 1.8 M62.8 138.8 l5 1.4" stroke="' + INK + '" stroke-width=".8" opacity=".85"/>';
    s += '<path d="M62 141 l2 -2.4 l2 2.4 l2 -2.4" stroke="' + INK + '" stroke-width=".7" fill="none"/>';
    // fist
    s += '<circle cx="64" cy="158" r="7" fill="' + SKIN_SH + '" stroke="' + O + '" stroke-width="2.8"/>' +
      '<path d="M66 154 Q69 157 67 161 M63 155.5 Q66 158 64.5 162" stroke="' + O + '" stroke-width="1" fill="none" stroke-linecap="round"/>' +
      '<path d="M60 153.6 Q63 152 66 153" stroke="' + SKIN + '" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/><path d="M58.6 160 Q61 165 66 164.6" stroke="' + SKIN_DK + '" stroke-width="1.4" fill="none" opacity=".5" stroke-linecap="round"/>';
    return s;
  }

  function torso(P) {
    var id = function (n) { return 'polynesian-' + n + P; };
    var s = '';
    // neck
    s += '<path d="M88 98 L88 114 Q98 119 110 114 L110 98 Z" fill="' + SKIN_SH + '" stroke="' + O + '" stroke-width="3"/>';
    s += '<path d="M89 106 Q99 112 109 106 L109 99 L89 99Z" fill="' + SKIN_DK + '" opacity=".55"/>';
    // torso
    s += '<path d="M74 112 Q97 103 122 111 Q130 132 126 160 L69 160 Q65 132 74 112Z" fill="url(#' + id('skin') + ')" stroke="' + O + '" stroke-width="3.2" stroke-linejoin="round"/>';
    s += '<g clip-path="url(#' + id('torso') + ')">';
    // rear-side shade
    s += '<path d="M64 110 Q80 130 76 162 L60 162Z" fill="' + SKIN_SH + '" opacity=".8"/>';
    s += '<path d="M118 112 Q128 132 124 162 L132 162 L132 110Z" fill="' + SKIN_SH + '" opacity=".35"/>';
    // ambient occlusion under mantle / pecs / hip
    s += '<path d="M66 116 Q76 126 86 138 Q78 146 64 150Z" fill="#4a2410" opacity=".22"/>';
    s += '<path d="M72 152 Q98 160 126 152 L126 160 L72 160Z" fill="#4a2410" opacity=".3"/>';
    s += '<path d="M78 137 Q90 146 99 138 Q109 146 122 136" stroke="#3a1c0c" stroke-width="3.2" fill="none" opacity=".22" stroke-linecap="round"/>';
    s += '<path d="M120 116 Q126 134 123 158" stroke="#d9805a" stroke-width="2.2" fill="none" opacity=".45" stroke-linecap="round"/>';
    // collarbones, pec bulge, serratus, oblique
    s += '<path d="M88 114.5 Q80 113 76 117 M110 114.4 Q117 112.6 122 115.6" stroke="' + SKIN_DK + '" stroke-width="1" fill="none" stroke-linecap="round" opacity=".7"/>';
    s += '<path d="M89 116 Q80 117 76 116 M110 116 Q118 114 122 117" stroke="' + SKIN_HI + '" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".8"/>';
    s += '<ellipse cx="88" cy="131" rx="5" ry="3.6" fill="' + SKIN_HI + '" opacity=".3"/><ellipse cx="111" cy="131" rx="5.4" ry="3.6" fill="' + SKIN_HI + '" opacity=".35"/>';
    s += '<circle cx="87" cy="133.4" r="1.3" fill="' + SKIN_DK + '" opacity=".8"/><circle cx="112" cy="133.4" r="1.3" fill="' + SKIN_DK + '" opacity=".8"/>';
    s += '<path d="M76 142 l6 1.6 M75 147 l6 1.6 M74.5 152 l5 1.4 M122 142 l-5 1.4 M123 147 l-5 1.4" stroke="' + SKIN_DK + '" stroke-width=".8" stroke-linecap="round" opacity=".6"/>';
    s += '<path d="M80 156 Q88 152 94 158 M118 156 Q110 152 104 158" stroke="' + SKIN_DK + '" stroke-width="1" fill="none" stroke-linecap="round" opacity=".55"/>';
    // sweat / skin pores
    s += '<path d="M85 127 h.01 M92 124 h.01 M106 126 h.01 M117 141 h.01 M92 149 h.01" stroke="' + SKIN_DK + '" stroke-width="1" stroke-linecap="round" opacity=".5"/>';
    // muscles
    s += '<path d="M80 134 Q90 141 99 135 M100 135 Q110 142 121 133" stroke="' + SKIN_DK + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    s += '<path d="M99 124 L99 158 M92 144 Q95 145.5 98 144 M101 144 Q104 145.5 107 144 M92 151 Q95 152.5 98 151 M101 151 Q104 152.5 107 151" stroke="' + SKIN_DK + '" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".75"/>';
    s += '<path d="M104 118 Q114 116 119 124" stroke="' + SKIN_HI + '" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>';
    s += '<path d="M84 120 Q88 117 93 118" stroke="' + SKIN_HI + '" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".6"/>';
    // --- tatau on right chest / shoulder ---
    s += '<g opacity=".92">';
    s += toothBand(104, 112.5, 126, 119, 7, 3.4, INK, 0.9);
    s += toothBand(103.5, 118.5, 126, 125, 7, -2.6, INK, 0.7);
    s += '<path d="' + spiral(113, 131, 6.4, 2.3, 1, 0.4) + '" stroke="' + INK + '" stroke-width="1.15" fill="none" stroke-linecap="round"/>';
    s += '<path d="M104 124 Q104 138 116 139 Q124 138 125 130" stroke="' + INK + '" stroke-width="1.3" fill="none"/>';
    s += '<path d="M106 125 Q106.5 136 116 136.8" stroke="' + INK + '" stroke-width="0.6" fill="none" stroke-dasharray="1.2 1"/>';
    // fish-scale (unaunahi) arcs on ribs
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 2; j++) {
        var x = 111 + i * 3.6 + j * 1.8, y = 143 + j * 3.5;
        s += '<path d="M' + f(x - 1.8) + ' ' + y + 'Q' + x + ' ' + (y + 2.6) + ' ' + f(x + 1.8) + ' ' + y + '" stroke="' + INK + '" stroke-width="0.8" fill="none"/>';
      }
    }
    // shoulder-cap chevron band + inner spiral echoes
    var chev = '';
    for (var q = 0; q < 6; q++) chev += 'M' + (108 + q * 3) + ' ' + f(109.6 + q * 1.4) + 'l1.5 2.6 l1.5 -2.6';
    s += '<path d="' + chev + '" stroke="' + INK + '" stroke-width=".7" fill="none" stroke-linejoin="round"/>';
    s += '<path d="' + spiral(120, 136, 3.2, 1.6, -1, 2) + '" stroke="' + INK + '" stroke-width=".8" fill="none" stroke-linecap="round"/>';
    s += '<circle cx="113" cy="131" r="1" fill="' + INK + '"/><circle cx="104.5" cy="134.5" r=".7" fill="' + INK + '"/><circle cx="105.5" cy="129" r=".6" fill="' + INK + '"/>';
    s += '<path d="M106 141.5 l2 -3 l2 3 l2 -3 l2 3 l2 -3 l2 3 l2 -3 l2 3" stroke="' + INK + '" stroke-width=".7" fill="none" stroke-linejoin="round"/>';
    // dotted lines flanking the ribs
    s += '<path d="M104.6 146 Q106 158 110 160" stroke="' + INK + '" stroke-width=".7" fill="none" stroke-dasharray=".8 1.3" stroke-linecap="round"/>';
    s += '<path d="M124.4 146 Q124 154 122 160" stroke="' + INK + '" stroke-width=".7" fill="none" stroke-dasharray=".8 1.3" stroke-linecap="round"/>';
    // small enata figures along the side
    s += enata(119, 152) + enata(113, 153.5) + enata(107, 155);
    s += '</g>';
    s += '</g>';
    // old reef scar on the left flank
    s += '<path d="M79 141 l4 3 M80.4 139.6 l1.2 2.4 M82 142.6 l1.4 -2 M83 144 l1.2 -2" stroke="#e3a57a" stroke-width=".6" fill="none" stroke-linecap="round" opacity=".7"/>';
    // navel
    s += '<path d="M98 155 Q99.5 157 101 155" stroke="' + SKIN_DK + '" stroke-width="1.1" fill="none" stroke-linecap="round"/>';
    return s;
  }

  // stylised human figure motif (enata)
  function enata(x, y) {
    return '<g transform="translate(' + x + ' ' + y + ')" stroke="' + INK + '" stroke-width="0.8" fill="none" stroke-linecap="round">' +
      '<circle cx="0" cy="-3.2" r="1" fill="' + INK + '"/>' +
      '<path d="M-2.4 -2.4 L-2.4 -1 L2.4 -1 L2.4 -2.4 M0 -1 L0 1.5 M-2 3.4 L-2 1.5 L2 1.5 L2 3.4"/></g>';
  }

  function skirt() {
    var s = '';
    // dark underlayer of flax
    s += '<path d="M69 166 Q97 172 127 166 L134 202 Q100 210 62 202Z" fill="#3a2a16" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    // back strands
    for (var x = 70; x <= 126; x += 3.4) {
      var sp = (x - 97) * 0.28, bx = x + sp, by = 201 + Math.sin(x * 0.7) * 1.5;
      var d = 'M' + f(x) + ' 168 Q' + f(x + sp * 0.3 + 1) + ' 186 ' + f(bx) + ' ' + f(by);
      s += '<path d="' + d + '" stroke="#6d5a2c" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
    }
    // front piupiu strands: rolled flax with black dyed bands
    for (var k = 0; k < 16; k++) {
      var x0 = 71 + k * 3.6;
      var spr = (x0 - 97) * 0.3, bx2 = x0 + spr, by2 = 203 + (k % 3) * 1.4 - (k % 2) * 0.8;
      var d2 = 'M' + f(x0) + ' 168 Q' + f(x0 + spr * 0.25 + (k % 2 ? 1.2 : -0.6)) + ' 186 ' + f(bx2) + ' ' + f(by2);
      s += '<path d="' + d2 + '" stroke="' + O + '" stroke-width="4.4" fill="none" stroke-linecap="round"/>';
      s += '<path d="' + d2 + '" stroke="' + (k % 2 ? '#e3cf8e' : '#f0dc9c') + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
      s += '<path d="' + d2 + '" stroke="#1d1410" stroke-width="2.6" fill="none" stroke-dasharray="' + (k % 2 ? '0 9 3 2 2 2 3 30' : '0 7 2 2 4 2 2 30') + '"/>';
      s += '<path d="' + d2 + '" stroke="#fff6d6" stroke-width="0.7" fill="none" stroke-dasharray="0 3 5 40" opacity=".9"/>';
      // rust-red dye band + twist marks + frayed tip
      s += '<path d="' + d2 + '" stroke="#b8442a" stroke-width="2.5" fill="none" stroke-dasharray="0 22 2.6 40" opacity=".95"/>';
      s += '<path d="M' + f(bx2) + ' ' + f(by2 - 0.5) + ' l' + f(-0.7 + (k % 3) * 0.6) + ' 2.6 M' + f(bx2 + 0.8) + ' ' + f(by2 - 0.5) + ' l' + f(0.5 + (k % 2) * 0.4) + ' 2.2" stroke="#c9b06a" stroke-width=".7" stroke-linecap="round"/>';
    }
    // deep shadow under the tapa wrap + on the left (rear) side, hem cast shadow
    s += '<path d="M69 168 Q97 175 127 168 L128 180 Q97 186 68 180Z" fill="#1a0e06" opacity=".18"/>';
    s += '<path d="M62 190 Q70 196 82 192 L80 206 Q68 206 62 202Z" fill="#1a0e06" opacity=".22"/>';
    s += '<path d="M66 204 Q100 212 134 203" stroke="#1a0e06" stroke-width="2.4" fill="none" opacity=".25"/>';
    // twisted flax hem cord
    s += '<path d="M66 199 Q100 208 133 198.6" stroke="' + O + '" stroke-width="3.4" fill="none" stroke-linecap="round"/>';
    s += '<path d="M66 199 Q100 208 133 198.6" stroke="#a5884a" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    s += '<path d="M66 199 Q100 208 133 198.6" stroke="#5a4520" stroke-width="1.6" fill="none" stroke-dasharray=".8 1.6"/>';
    return s;
  }

  function tapa(P) {
    var id = function (n) { return 'polynesian-' + n + P; };
    var s = '<path d="M69 154 Q97 161 127 154 L128 171 Q97 178 68 171Z" fill="url(#' + id('tapa') + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<g clip-path="url(#' + id('tapaclip') + ')">';
    // top & bottom border bands
    s += '<path d="M66 157.5 Q97 164.5 130 157.5" stroke="#6b3419" stroke-width="1.4" fill="none"/>';
    s += '<path d="M66 168 Q97 175 130 168" stroke="#6b3419" stroke-width="1.4" fill="none"/>';
    // triangles along the top
    var tri = '', dia = '', zig = '';
    for (var x = 68; x < 128; x += 4) {
      var yo = 154.4 + Math.pow((x - 97) / 30, 2) * -3 + 3.2;
      tri += 'M' + x + ' ' + f(yo - 3.2) + 'L' + (x + 4) + ' ' + f(yo - 3.2) + 'L' + (x + 2) + ' ' + f(yo) + 'Z';
      var yb = yo + 13.6;
      tri += 'M' + x + ' ' + f(yb + 2.8) + 'L' + (x + 4) + ' ' + f(yb + 2.8) + 'L' + (x + 2) + ' ' + f(yb) + 'Z';
    }
    for (var x2 = 70; x2 < 128; x2 += 8) {
      var ym = 163.3 - Math.pow((x2 - 97) / 30, 2) * 3 + 3;
      dia += 'M' + x2 + ' ' + f(ym) + 'L' + (x2 + 2.6) + ' ' + f(ym - 3) + 'L' + (x2 + 5.2) + ' ' + f(ym) + 'L' + (x2 + 2.6) + ' ' + f(ym + 3) + 'Z';
      zig += 'M' + (x2 + 5.6) + ' ' + f(ym - 2.4) + 'L' + (x2 + 7.4) + ' ' + f(ym + 2.4);
    }
    s += '<path d="' + tri + '" fill="#7a3a1a"/>';
    s += '<path d="' + dia + '" fill="none" stroke="#7a3a1a" stroke-width="1.1"/>';
    s += '<path d="' + zig + '" stroke="#b64a1c" stroke-width="1.2"/>';
    // dots in diamonds
    for (var x3 = 72.6; x3 < 128; x3 += 8) {
      var yd = 163.3 - Math.pow((x3 - 97) / 30, 2) * 3 + 3;
      s += '<circle cx="' + x3 + '" cy="' + f(yd) + '" r="0.9" fill="#b64a1c"/>';
    }
    // bark-cloth texture fibres
    s += '<path d="M72 160 L90 162 M100 163 L120 161 M76 170 L96 172 M104 171 L124 169" stroke="#c7a36a" stroke-width="0.5" opacity=".8"/>';
    s += '<path d="M69 154 Q97 161 127 154 L127 158 Q97 165 69 158Z" fill="#fff" opacity=".22"/>';
    s += '<rect x="66" y="150" width="64" height="30" fill="url(#' + id('bark') + ')"/>';
    // chevron mini-row between border and diamonds + edge dots
    var dt = '';
    for (var x4 = 69; x4 < 128; x4 += 3.2) dt += 'M' + f(x4) + ' ' + f(167.2 + Math.pow((x4 - 97) / 30, 2) * -3 + 3.6) + 'h.01';
    s += '<path d="' + dt + '" stroke="#6b3419" stroke-width="1" stroke-linecap="round"/>';
    // shading on rear side & under belt
    s += '<path d="M66 152 L82 152 Q76 165 68 178 L66 178Z" fill="#7a4a1a" opacity=".22"/>';
    s += '<path d="M66 154 Q97 161 130 154 L130 156.6 Q97 163.6 66 156.6Z" fill="#3a1c0c" opacity=".2"/>';
    // stitched hem
    s += '<path d="M69 169.4 Q97 176 127 169.4" stroke="#8a5a2a" stroke-width=".7" fill="none" stroke-dasharray="2 1.6"/>';
    // small patch + tear
    s += '<path d="M78 163 L84 163.4 L83.6 168 L78.4 167.6Z" fill="#c68a4a" stroke="#6b3419" stroke-width=".6"/><path d="M79 164.6 l4 .2 M79 166.4 l4 .2" stroke="#6b3419" stroke-width=".4" stroke-dasharray=".8 .8"/>';
    s += '</g>';
    // rope belt tie over the tapa
    s += '<path d="M68.4 154.6 Q97 161.4 127.6 154.6" stroke="' + O + '" stroke-width="3.6" fill="none" stroke-linecap="round"/>';
    s += '<path d="M68.4 154.6 Q97 161.4 127.6 154.6" stroke="#c9a15a" stroke-width="1.8" fill="none" stroke-linecap="round"/>';
    s += '<path d="M68.4 154.6 Q97 161.4 127.6 154.6" stroke="#6b4a1a" stroke-width="1.8" fill="none" stroke-dasharray=".7 1.5"/>';
    s += '<path d="M69 153.2 Q97 160 127 153.2" stroke="#fff2c8" stroke-width=".6" fill="none" opacity=".6"/>';
    // knot + hanging flap at the front hip
    s += '<path d="M112 168 Q118 180 114 192 L124 190 Q125 178 121 167Z" fill="url(#' + id('tapa') + ')" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>';
    s += '<path d="M114.5 176 L122.5 175 M114.8 180 L123 179.4" stroke="#7a3a1a" stroke-width="1"/>';
    s += '<path d="M116 183.5 L118 181 L120 183.5 L118 186Z" fill="#7a3a1a"/>';
    s += '<path d="M113 169 L116 172 M125 168 L122 172" stroke="#8a5a2a" stroke-width=".8"/><path d="M115 172 L121 172 L120 174 L116 174Z" fill="#b64a1c"/>';
    s += '<path d="M120.8 168 Q123 180 120 191 L124 190 Q125 178 121 167Z" fill="#5a2c10" opacity=".25"/>';
    s += '<path d="M115.4 170 Q116.4 180 115.4 190" stroke="#fff" stroke-width=".8" fill="none" opacity=".4" stroke-linecap="round"/>';
    s += '<rect x="113" y="168" width="12" height="24" fill="url(#' + id('bark') + ')" clip-path="url(#' + id('flapclip') + ')" opacity=".9"/>';
    s += '<path d="M114 192 l0.6 3 M116.4 191.6 l0.4 3.2 M118.8 191.2 l0.3 3.2 M121.2 190.8 l0.2 3.2 M123.4 190.4 l0.2 3" stroke="#b08a52" stroke-width="1" stroke-linecap="round"/>';
    s += '<ellipse cx="117.5" cy="166.5" rx="5.6" ry="4.4" fill="#e7cf9f" stroke="' + O + '" stroke-width="2.4"/>';
    s += '<path d="M114 165 Q117.5 168.5 121 165.5 M114.6 168 Q117.5 166 120.4 168.6" stroke="#9b6a36" stroke-width="0.9" fill="none"/>';
    return s;
  }

  function necklace(P) {
    var id = function (n) { return 'polynesian-' + n + P; };
    var s = '';
    // shark-tooth necklace
    s += '<path d="M84 111 Q99 124 115 111" stroke="' + O + '" stroke-width="2.6" fill="none"/>';
    s += '<path d="M84 111 Q99 124 115 111" stroke="#a0763e" stroke-width="1.2" fill="none"/>';
    for (var i = 0; i < 7; i++) {
      var t = 0.12 + i * 0.127;
      // quadratic point
      var x = (1 - t) * (1 - t) * 84 + 2 * (1 - t) * t * 99 + t * t * 115;
      var y = (1 - t) * (1 - t) * 111 + 2 * (1 - t) * t * 124 + t * t * 111;
      var ang = (t - 0.5) * -60;
      var big = 1.25 - Math.abs(i - 3) * 0.1;
      s += '<g transform="translate(' + f(x) + ' ' + f(y) + ') rotate(' + f(ang) + ') scale(' + big + ')">' +
        '<path d="M-2.2 0 Q-1.6 3.6 0.3 6.6 Q1.2 3.4 2.2 0 Z" fill="url(#' + id('tooth') + ')" stroke="' + O + '" stroke-width="0.95" stroke-linejoin="round"/>' +
        '<path d="M-1.2 0.8 Q-0.8 3 0.1 4.8" stroke="#fff" stroke-width="0.6" fill="none"/>' +
        '<path d="M1.6 1.2 l0.5 0.3 M1.3 2.4 l0.5 0.3 M1 3.6 l0.5 0.3" stroke="#a89770" stroke-width="0.4"/>' +
        '</g>';
    }
    // cord twist + tiny spacer beads between teeth
    s += '<path d="M84 111 Q99 124 115 111" stroke="#6b4a1a" stroke-width="1.2" fill="none" stroke-dasharray=".7 1.3"/>';
    [0.18, 0.31, 0.44, 0.56, 0.69, 0.82].forEach(function (t, j) {
      var x = (1 - t) * (1 - t) * 84 + 2 * (1 - t) * t * 99 + t * t * 115;
      var y = (1 - t) * (1 - t) * 111 + 2 * (1 - t) * t * 124 + t * t * 111;
      s += '<circle cx="' + f(x) + '" cy="' + f(y - 0.3) + '" r="1" fill="' + (j % 2 ? '#f1e6c8' : '#7a3a1a') + '" stroke="' + O + '" stroke-width=".6"/><circle cx="' + f(x - 0.3) + '" cy="' + f(y - 0.7) + '" r=".3" fill="#fff"/>';
    });
    // soft contact shadow of the necklace on the chest
    s += '<path d="M85 113.6 Q99 127 114 113.6" stroke="#3a1c0c" stroke-width="2" fill="none" opacity=".22"/>';
    // spacer beads
    [0.06, 0.94].forEach(function (t) {
      var x = (1 - t) * (1 - t) * 84 + 2 * (1 - t) * t * 99 + t * t * 115;
      var y = (1 - t) * (1 - t) * 111 + 2 * (1 - t) * t * 124 + t * t * 111;
      s += '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="1.5" fill="#e07b1f" stroke="' + O + '" stroke-width="0.8"/>';
    });
    // longer cord + pounamu hei-matau
    s += '<path d="M90 112 Q92 126 100 132 M109 112 Q108 126 100 132" stroke="' + O + '" stroke-width="1.1" fill="none"/>';
    s += '<g transform="translate(100 132)">';
    // lashing
    s += '<rect x="-2" y="-1.5" width="4" height="3.4" rx="1" fill="#c9a15a" stroke="' + O + '" stroke-width="0.9"/>';
    s += '<path d="M-1.8 0 L1.8 0 M-1.8 1.1 L1.8 1.1" stroke="#7a5a26" stroke-width="0.5"/>';
    // hook body
    var hook = 'M-1 2 C-8 4 -9 14 -3 17.5 C2 20 7 16 7 10 L9.6 8.2 L6.4 7.4 L4.6 9.6 C4.6 13.8 1.6 15.4 -1.4 14 C-4.6 12.4 -4 6.8 0.4 5.4 Z';
    s += '<path d="' + hook + '" fill="url(#' + id('jade') + ')" stroke="' + O + '" stroke-width="1.6" stroke-linejoin="round"/>';
    s += '<path d="M-3.4 5.2 C-6.4 8 -6 13.4 -2.6 15.4" stroke="#d8ffe6" stroke-width="1" fill="none" stroke-linecap="round" opacity=".9"/>';
    s += '<circle cx="-4.6" cy="8.4" r="0.7" fill="#fff"/>';
    s += '<path d="M-1 5.6 C-3.4 6.4 -3.6 10.6 -1.6 12 C0.4 12.8 1.4 11 1 9.4" stroke="#0e3d27" stroke-width=".5" fill="none" opacity=".55"/>';
    s += '<path d="M2 15.4 C4 14.6 5 13.4 5.4 12" stroke="#d8ffe6" stroke-width=".5" fill="none" opacity=".7"/>';
    s += '<circle cx="8.2" cy="8" r=".5" fill="#d8ffe6"/><path d="M-6.6 6.6 l.9 -.9 M-6.6 5.7 l.9 .9" stroke="#fff" stroke-width=".4"/>';
    s += '<path d="M-2.4 1.2 L2.4 1.2 L2 3.2 L-2 3.2Z" fill="#c9a15a" stroke="' + O + '" stroke-width=".5"/><path d="M-2.2 1.9 L2.2 2.7 M-2.2 2.7 L2.2 1.9" stroke="#7a5a26" stroke-width=".4"/>';
    s += '<circle cx="0" cy="-2.6" r=".9" fill="#e07b1f" stroke="' + O + '" stroke-width=".5"/>';
    s += '<path d="M3.2 16.4 C5.6 14.8 6.4 12.6 6.4 10.6" stroke="#0e3d27" stroke-width="0.8" fill="none" opacity=".7"/>';
    s += '</g>';
    return s;
  }

  function mantle(P) {
    // feather mantle draped over the rear (left) shoulder, tied at the neck
    var s = '';
    s += '<path d="M60 116 Q66 104 88 108 Q94 112 90 120 Q84 134 82 146 Q70 150 58 146 Q56 128 60 116Z" fill="#8a2219" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    var rows = [
      [112, [64, 70, 76, 82, 87]],
      [119, [60, 66, 72, 78, 84]],
      [126, [59, 65, 71, 77, 83]],
      [133, [58, 64, 70, 76, 82]]
    ];
    for (var r = 0; r < rows.length; r++) {
      var xs = rows[r][1];
      for (var i = 0; i < xs.length; i++) {
        var yel = (r === 1) || (r === 3 && i % 2 === 0);
        s += feather(xs[i] + (r % 2) * 1.5, rows[r][0], 10 - i * 5, 14, yel ? '#f6bf3f' : '#dc3b2c', yel ? '#a8661c' : '#7a1c16', P);
      }
    }
    for (var r2 = 1; r2 < rows.length; r2++) s += '<path d="M' + (rows[r2][1][0] - 3) + ' ' + (rows[r2][0] - 0.6) + ' Q72 ' + (rows[r2][0] - 4) + ' 88 ' + (rows[r2][0] - 4) + '" stroke="#2a0a06" stroke-width="2.4" fill="none" opacity=".22" stroke-linecap="round"/>';
    s += '<path d="M58 146 Q70 151 82 147" stroke="#2a0a06" stroke-width="3" fill="none" opacity=".25"/>';
    s += '<path d="M66 118 Q72 112 82 111" stroke="#fff" stroke-width="1" fill="none" opacity=".25" stroke-linecap="round"/>';
    // braided olonā cord collar edge
    s += '<path d="M60 115 Q72 104 91 110" stroke="' + O + '" stroke-width="4.6" fill="none" stroke-linecap="round"/>';
    s += '<path d="M60 115 Q72 104 91 110" stroke="#d9b56a" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
    s += '<path d="M63 111.6 l1.4 1.8 M66.5 109.2 l1.4 1.8 M70 107.6 l1.4 1.9 M74 106.7 l1.2 2 M78 106.6 l1 2.1 M82 107.2 l0.9 2.1 M86 108.2 l0.8 2.1" stroke="#8a6428" stroke-width="0.8"/>';
    // tie knot + hanging ends
    s += '<path d="M90 111 Q92 118 89 124 M91 111 Q95 117 94 124" stroke="' + O + '" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
    s += '<path d="M90 111 Q92 118 89 124 M91 111 Q95 117 94 124" stroke="#d9b56a" stroke-width="1.2" fill="none" stroke-linecap="round"/>';
    s += '<circle cx="90.5" cy="110.5" r="2.6" fill="#d9b56a" stroke="' + O + '" stroke-width="1.4"/>';
    s += '<circle cx="89" cy="125.2" r="1.3" fill="#e07b1f" stroke="' + O + '" stroke-width="0.7"/><circle cx="94" cy="125.2" r="1.3" fill="#e07b1f" stroke="' + O + '" stroke-width="0.7"/>';
    return s;
  }

  function head(P) {
    var id = function (n) { return 'polynesian-' + n + P; };
    var s = '';
    // back hair mass + topknot
    s += '<path d="M60 86 Q50 50 76 34 Q98 22 124 34 Q140 46 139 64 L66 95 Q59 93 60 86Z" fill="url(#' + id('hair') + ')" stroke="' + O + '" stroke-width="3.4" stroke-linejoin="round"/>';
    s += '<ellipse cx="86" cy="17" rx="15" ry="12.5" fill="url(#' + id('hair') + ')" stroke="' + O + '" stroke-width="3.2"/>';
    s += '<path d="M76 12 Q84 5 95 10 M78 18 Q86 12 97 16 M80 23 Q88 19 98 22" stroke="#5a4640" stroke-width="1" fill="none" stroke-linecap="round"/>';
    s += '<path d="M79 9.5 Q84 7 89 8" stroke="#8f7a70" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    s += '<path d="M72 17 Q75 9 84 6 M74 22 Q73 14 80 8.4 M99 13 Q100 20 94 25 M96 9.6 Q101 14 98 21 M84 27 Q80 20 84 12 M89 26 Q92 19 90 11" stroke="#0a0605" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".7"/>';
    s += '<path d="M76 14 Q80 9 88 8.6 M92 12 Q98 15 97 20" stroke="#7a6660" stroke-width=".6" fill="none" stroke-linecap="round" opacity=".8"/>';
    s += '<path d="M72.4 24.4 Q86 30 99.6 23.4" stroke="#1d1310" stroke-width="2.6" fill="none" opacity=".45"/>';
    s += '<path d="M64 84 Q56 64 64 48 M68 88 Q60 68 68 52 M72 60 Q68 46 80 38 M110 36 Q126 38 134 52 M118 40 Q132 50 136 62" stroke="#5a4640" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".7"/>';
    s += '<path d="M62 80 Q54 60 66 42" stroke="#0a0605" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".7"/>';
    // bone pin through the topknot
    s += '<path d="M67 22 L104 8" stroke="' + O + '" stroke-width="4" stroke-linecap="round"/>';
    s += '<path d="M67 22 L104 8" stroke="#f1e6c8" stroke-width="2.2" stroke-linecap="round"/>';
    s += '<circle cx="104.5" cy="7.8" r="2.4" fill="#f1e6c8" stroke="' + O + '" stroke-width="1.3"/>';
    s += '<path d="M70 20.2 l0.8 1.6 M73 19 l0.8 1.6 M76.4 17.8 l.8 1.6 M79.8 16.5 l.8 1.6 M83.2 15.2 l.8 1.6" stroke="#9c8a60" stroke-width="0.6"/>';
    s += '<path d="M68.4 20.4 L102.6 7" stroke="#fff" stroke-width=".7" stroke-linecap="round" opacity=".7"/>';
    s += '<path d="M92 12.6 L106 8" stroke="#a89770" stroke-width=".6" opacity=".7"/><circle cx="103.6" cy="7" r=".7" fill="#fff"/>';
    s += '<path d="M66 22.8 q-2 3 -1 7 M67 23 q-.6 3.6 1.2 6" stroke="' + O + '" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="65.6" cy="30.6" r="1.4" fill="#2f9a8a" stroke="' + O + '" stroke-width=".7"/><circle cx="65.2" cy="30.2" r=".4" fill="#c9fff0"/>';
    // woven band at topknot base
    s += '<path d="M73 27 Q86 33 99 26 L100 32 Q86 39 72 33Z" fill="#e07b1f" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>';
    var w = '';
    for (var x = 74.5; x < 99; x += 3) w += 'M' + x + ' ' + f(28.6 + Math.sin((x - 72) / 27 * Math.PI) * 3) + 'l2 4.2 ';
    s += '<path d="' + w + '" stroke="#8a3f0c" stroke-width="0.9"/>';
    s += '<path d="M74 30.5 Q86 36 98.5 29.5" stroke="#ffc27a" stroke-width="0.7" fill="none"/>';
    s += '<path d="M73.6 31.4 Q86 37.4 99 30.6" stroke="#5a2408" stroke-width=".6" fill="none" stroke-dasharray="1 1.4"/>';
    s += '<path d="M72 33 Q86 39.6 100 32.4 L100 35 Q86 42 72 35.6Z" fill="#1d1310" opacity=".35"/>';
    // ear (rear side)
    // face
    s += '<path d="M62 70 Q62 36 100 34 Q138 36 139 72 Q139 98 122 106 Q108 112 92 110 Q64 104 62 70Z" fill="url(#' + id('face') + ')" stroke="' + O + '" stroke-width="3.4" stroke-linejoin="round"/>';
    // jaw shade
    s += '<path d="M66 84 Q72 104 94 107 Q80 108 70 99 Q64 92 66 84Z" fill="' + SKIN_SH + '" opacity=".55"/>';
    // front hair: swept back hairline with sideburn
    s += '<path d="M60 78 Q56 44 86 34 Q116 26 136 50 Q138 58 137 64 Q128 50 112 47 Q98 45 86 50 Q76 56 74 70 Q73 80 72 88 Q64 88 60 78Z" fill="url(#' + id('hair') + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<path d="M84 49 Q98 36 124 40 M78 56 Q86 44 104 40 M92 46 Q108 38 130 46 M70 66 Q72 52 84 44" stroke="#5a4640" stroke-width="1.1" fill="none" stroke-linecap="round"/>';
    s += '<path d="M96 38 Q110 34 124 39" stroke="#8f7a70" stroke-width="2" fill="none" stroke-linecap="round" opacity=".9"/>';
    s += '<path d="M76 46 Q92 30 116 32 M74 62 Q76 50 90 44 M96 44 Q112 40 128 48 M100 42 Q118 38 133 52 M68 74 Q66 58 78 48" stroke="#0a0605" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".65"/>';
    s += '<path d="M82 44 Q92 36 106 35 M114 36 Q124 38 130 46 M78 52 Q80 48 84 46" stroke="#a89890" stroke-width=".7" fill="none" stroke-linecap="round" opacity=".7"/>';
    // ear
    s += '<path d="M70 72 Q60 68 60 80 Q61 90 71 89" fill="' + SKIN + '" stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round"/>';
    s += '<path d="M68 76 Q63 76 64 81 Q65 85 69 84" stroke="' + SKIN_DK + '" stroke-width="1.2" fill="none"/>';
    s += '<path d="M66 71 Q62 72 62.2 79 M70 88 Q65 89 62.4 84" stroke="' + SKIN_HI + '" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".7"/>';
    s += '<path d="M66.4 78.6 Q68 82 66.6 85" stroke="' + SKIN_DK + '" stroke-width=".8" fill="none" stroke-linecap="round"/>';
    s += '<circle cx="64.5" cy="88" r="1.6" fill="#f1e6c8" stroke="' + O + '" stroke-width="0.8"/><circle cx="64" cy="87.4" r=".5" fill="#fff"/>';
    s += '<path d="M64.4 89.6 L64.6 92 M63 89.8 l-.4 2" stroke="#6b4a1a" stroke-width=".5" stroke-linecap="round"/>';
    s += '<path d="M80 104 Q96 112 118 108 Q104 114 88 110Z" fill="#3a1c0c" opacity=".25"/>';
    s += '<path d="M126 100 Q134 92 138 76" stroke="#d9805a" stroke-width="1.6" fill="none" opacity=".35" stroke-linecap="round"/>';
    // cheeks
    s += '<ellipse cx="96" cy="93" rx="4" ry="2" fill="#f0917a" opacity=".35"/>';
    s += '<path d="M92 91 l1 2 M95 90.4 l1 2 M98 90.6 l1 2" stroke="#fff" stroke-width=".5" opacity=".5" stroke-linecap="round"/>';
    s += '<ellipse cx="96" cy="93" rx="6" ry="3.4" fill="#e8795c" opacity=".45"/>';
    s += '<ellipse cx="131" cy="91" rx="4.4" ry="3.2" fill="#e8795c" opacity=".45"/>';
    // eyebrows (determined)
    s += '<path d="M89 64 Q97 62 105.5 68.5 L104 71.5 Q97 67.8 89.5 68.4 Z" fill="#1d1310" stroke="' + O + '" stroke-width="1.2" stroke-linejoin="round"/>';
    s += '<path d="M114 69 Q123 61.5 133 62.5 L133 66.5 Q124 66 115.5 72 Z" fill="#1d1310" stroke="' + O + '" stroke-width="1.2" stroke-linejoin="round"/>';
    // brow hairs
    s += '<path d="M91 66.6 l3 -.8 M95 65.6 l3 -.4 M99 66 l3 .8 M102 68 l2 .6 M118 67 l3 -1.8 M122 64.6 l3 -.8 M126.4 63.6 l3 -.2 M130 63.6 l2.4 .2" stroke="#6a5048" stroke-width=".6" stroke-linecap="round" opacity=".85"/>';
    s += '<path d="M90.6 66 Q97 64.2 104 68.4" stroke="#5a4640" stroke-width=".6" fill="none" opacity=".8"/><path d="M116 69 Q124 63.6 132 64.4" stroke="#5a4640" stroke-width=".6" fill="none" opacity=".8"/>';
    // nose bridge shadow, philtrum, upper-lid shading
    s += '<path d="M110.6 74 Q109 82 111.4 90" stroke="' + SKIN_SH + '" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".35"/>';
    s += '<path d="M112.4 76 Q113.6 82 115 85" stroke="#e8b48a" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/>';
    s += '<path d="M111 94 Q112.6 96.4 114.4 95.4" stroke="' + SKIN_DK + '" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".7"/>';
    s += '<path d="M105 74.6 Q98 73 91 74.4 M131 73.4 Q124 70.6 117 73.4" stroke="#7a4529" stroke-width="2" fill="none" stroke-linecap="round" opacity=".28"/>';
    // eyes
    s += '<g class="part-eyes" style="transform-origin: 111px 80px">' + eye(97, 80, P) + eye(124, 80, P) + '</g>';
    // nose
    s += '<path d="M114 85 Q118 90 115 92.5 Q113 93.2 111.5 92" stroke="' + O + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    s += '<path d="M114.8 86.4 Q116.6 88.8 115.6 90.4" stroke="#eab48a" stroke-width="1" fill="none" stroke-linecap="round"/>';
    // mouth: confident grin
    s += '<path d="M103 97 Q113 99.5 122 95.5 Q120 104.5 112 104.8 Q105 104.6 103 97Z" fill="#6e2418" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/>';
    s += '<path d="M104.4 97.6 Q113 99.6 120.8 96.4 L120 99 Q112.5 101.6 105.4 99.8Z" fill="#fffaf0"/>';
    s += '<path d="M108 102.8 Q112.5 101 116.5 102.8 Q112.4 104.8 108 102.8Z" fill="#e0685a"/>';
    s += '<path d="M101.5 96 Q102.6 97.4 103.8 96.6 M121 94.8 Q122.8 94.4 123.4 93" stroke="' + O + '" stroke-width="1.2" fill="none" stroke-linecap="round"/>';
    s += '<path d="M108.4 97.8 L108.6 100.4 M112.4 98.6 L112.6 101.2 M116.4 98.2 L116.4 100.6" stroke="#d9ccaa" stroke-width=".5"/>';
    s += '<path d="M104.4 97.6 Q113 99.6 120.8 96.4" stroke="#fff" stroke-width=".6" fill="none" opacity=".0"/>';
    s += '<path d="M103.2 96.6 Q112 99.6 122.2 95.6" stroke="#c4574a" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".55"/>';
    s += '<path d="M105 103.4 Q112 106.6 119 103" stroke="#3a1008" stroke-width=".8" fill="none" opacity=".35"/>';
    s += '<path d="M107.6 106.4 Q112 108 116.6 106.2" stroke="' + SKIN_SH + '" stroke-width="1" fill="none" stroke-linecap="round" opacity=".5"/>';
    // chin highlight
    s += '<path d="M110 108 Q115 108 118 106.4" stroke="#e2a877" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".8"/>';
    // forehead shine
    s += '<ellipse cx="118" cy="56" rx="6" ry="2.4" fill="#fff" opacity=".18" transform="rotate(-12 118 56)"/>';
    return s;
  }

  function eye(cx, cy, P) {
    var id = function (n) { return 'polynesian-' + n + P; };
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="6.4" ry="8.2" fill="#fff" stroke="' + O + '" stroke-width="1.6"/>' +
      '<ellipse cx="' + (cx + 1.3) + '" cy="' + (cy + 0.6) + '" rx="4.9" ry="6.9" fill="url(#' + id('iris') + ')"/>' +
      '<ellipse cx="' + (cx + 1.5) + '" cy="' + (cy + 1) + '" rx="2.4" ry="3.4" fill="#0e0705"/>' +
      '<path d="M' + (cx - 2.2) + ' ' + (cy + 4.8) + ' Q' + (cx + 1.3) + ' ' + (cy + 7.2) + ' ' + (cx + 4.9) + ' ' + (cy + 4.2) + '" stroke="#d9914a" stroke-width="1" fill="none" opacity=".9"/>' +
      '<ellipse cx="' + (cx + 1.3) + '" cy="' + (cy + 0.6) + '" rx="4.9" ry="6.9" fill="none" stroke="#2a0f06" stroke-width=".9" opacity=".75"/>' +
      '<path d="M' + (cx - 1.2) + ' ' + (cy - 3) + ' Q' + (cx + 1.5) + ' ' + (cy - 5.6) + ' ' + (cx + 4.6) + ' ' + (cy - 3) + '" fill="#000" opacity=".28"/>' +
      '<path d="M' + (cx - 3) + ' ' + (cy + 1) + ' l1.2 0.2 M' + (cx + 4.5) + ' ' + (cy + 3) + ' l-1 .8 M' + (cx + 0.8) + ' ' + (cy + 5.4) + ' l.2 -1.2 M' + (cx + 5) + ' ' + (cy - 1) + ' l-1.2 .2" stroke="#e8a458" stroke-width=".5" opacity=".8"/>' +
      '<path d="M' + (cx - 5.4) + ' ' + (cy - 7.6) + ' Q' + cx + ' ' + (cy - 12.4) + ' ' + (cx + 5) + ' ' + (cy - 8.6) + '" stroke="' + SKIN_DK + '" stroke-width=".8" fill="none" opacity=".65" stroke-linecap="round"/>' +
      '<path d="M' + (cx - 6.6) + ' ' + (cy - 6) + ' l-1.6 -.6 M' + (cx - 5.6) + ' ' + (cy - 8) + ' l-1.4 -1.2" stroke="' + O + '" stroke-width="1.1" stroke-linecap="round"/>' +
      '<circle cx="' + (cx + 3.2) + '" cy="' + (cy - 2.6) + '" r="2.3" fill="#fff"/>' +
      '<circle cx="' + (cx - 1.4) + '" cy="' + (cy + 3.4) + '" r="1.1" fill="#fff"/>' +
      '<circle cx="' + (cx + 0.6) + '" cy="' + (cy - 4.2) + '" r="0.6" fill="#fff" opacity=".9"/>' +
      '<path d="M' + (cx - 7) + ' ' + (cy - 5) + ' Q' + cx + ' ' + (cy - 11.2) + ' ' + (cx + 7.2) + ' ' + (cy - 4.2) + '" stroke="' + O + '" stroke-width="2.8" fill="none" stroke-linecap="round"/>' +
      '<path d="M' + (cx + 6.2) + ' ' + (cy - 5) + ' l2.2 -1.4" stroke="' + O + '" stroke-width="1.4" stroke-linecap="round"/>';
  }

  function club(P) {
    var id = function (n) { return 'polynesian-' + n + P; };
    var s = '';
    // blade outline sampled: t in [0,1], y from -22 to -104
    function hw(t) { return 13.2 * Math.pow(Math.sin(Math.PI * (0.13 + 0.82 * t)), 0.7); }
    function yy(t) { return -22 - 82 * t; }
    var N = 40, L = '', R = '';
    for (var i = 0; i <= N; i++) {
      var t = i / N;
      R += (i ? 'L' : 'M') + f(hw(t)) + ' ' + f(yy(t));
      L = 'L' + f(-hw(t)) + ' ' + f(yy(t)) + L;
    }
    var blade = R + ' Q0 -109 ' + f(-hw(1)) + ' ' + f(yy(1)) + L + 'Z';
    // lanyard cord loop at butt
    s += '<path d="M0 30 Q-9 38 -5 46 Q0 50 3 44 Q5 38 0 31" stroke="' + O + '" stroke-width="3.2" fill="none" stroke-linecap="round"/>';
    s += '<path d="M0 30 Q-9 38 -5 46 Q0 50 3 44 Q5 38 0 31" stroke="#d9b56a" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    s += '<path d="M-5 46 L-7 54 M-5 46 L-4 54.5 M-5 46 L-1.8 53.4" stroke="#b37d2e" stroke-width="1.2" stroke-linecap="round"/>';
    s += '<circle cx="-5" cy="46" r="1.9" fill="#e07b1f" stroke="' + O + '" stroke-width="0.9"/>';
    // handle
    s += '<path d="M-4 -24 L-3.6 24 Q-5.5 27 -4 31 Q0 34 4 31 Q5.5 27 3.6 24 L4 -24Z" fill="url(#' + id('wood') + ')" stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round"/>';
    s += '<path d="M-3.9 24.5 Q0 26.4 3.9 24.5" stroke="' + O + '" stroke-width="1.2" fill="none"/>';
    s += '<path d="M-1 -20 L-0.6 22 M1.8 -18 Q1.4 0 2 20" stroke="#c78a52" stroke-width="0.6" fill="none" opacity=".8"/>';
    s += '<path d="M-2.6 -14 Q-2 0 -2.6 18 M0.6 -22 Q1 0 0.4 22" stroke="#3d200d" stroke-width=".4" fill="none" opacity=".6"/>';
    s += '<path d="M-3.4 -4 L-3.2 20" stroke="#000" stroke-width="1.2" opacity=".18"/>';
    // shark teeth along both edges (drawn before blade so bases tuck under)
    var teeth = '', hl = '', ser = '', tsh = '';
    for (var k = 0; k < 11; k++) {
      var tt = 0.07 + k * 0.083;
      var y0 = yy(tt), h0 = hw(tt), h1 = hw(Math.max(tt - 0.03, 0)), h2 = hw(tt + 0.03);
      [1, -1].forEach(function (sg) {
        var ya = y0 + 3, yb = y0 - 3;
        var xa = sg * (h1 - 1.2), xb = sg * (h2 - 1.2);
        var ang = Math.atan2(-(h2 - h1), -6) ; // edge tangent (unused sign-wise)
        var ox = sg * (h0 + 5.6), oy = y0 - 1.8;
        teeth += 'M' + f(xa) + ' ' + f(ya) + ' Q' + f(sg * (h0 + 3)) + ' ' + f(y0 + 1.6) + ' ' + f(ox) + ' ' + f(oy) +
          ' Q' + f(sg * (h0 + 2)) + ' ' + f(y0 - 2.4) + ' ' + f(xb) + ' ' + f(yb) + 'Z';
        tsh += 'M' + f(sg * (h0 + 2.2)) + ' ' + f(y0 + 2.4) + ' Q' + f(sg * (h0 + 3.6)) + ' ' + f(y0 + 1.4) + ' ' + f(ox) + ' ' + f(oy) + ' L' + f(sg * (h0 + 3.4)) + ' ' + f(y0 + 0.2) + 'Z';
        hl += 'M' + f(sg * (h0 + 0.6)) + ' ' + f(y0 - 1.2) + 'L' + f(sg * (h0 + 3.6)) + ' ' + f(y0 - 1.8);
        ser += 'M' + f(sg * (h0 + 1.6)) + ' ' + f(y0 + 1.6) + 'l' + f(sg * 0.5) + ' 0.6 M' + f(sg * (h0 + 3.2)) + ' ' + f(y0 + 0.4) + 'l' + f(sg * 0.5) + ' 0.6';
        void ang;
      });
    }
    s += '<path d="' + teeth + '" fill="url(#' + id('tooth') + ')" stroke="' + O + '" stroke-width="1.3" stroke-linejoin="round"/>';
    s += '<path d="' + tsh + '" fill="#b7a67c" opacity=".75"/>';
    s += '<path d="' + hl + '" stroke="#fff" stroke-width="0.9" stroke-linecap="round"/>';
    s += '<path d="' + ser + '" stroke="#9a8a66" stroke-width="0.5"/>';
    // blade
    s += '<path d="' + blade + '" fill="url(#' + id('wood') + ')" stroke="' + O + '" stroke-width="2.8" stroke-linejoin="round"/>';
    // wood grain
    var g = '';
    [-7, -4, -1.5, 1.2, 4, 7.2].forEach(function (off, j) {
      var p = '';
      for (var i2 = 0; i2 <= 20; i2++) {
        var t2 = 0.04 + i2 / 20 * 0.86;
        var x = off * hw(t2) / 13.2 + Math.sin(t2 * 9 + j) * 0.8;
        p += (i2 ? 'L' : 'M') + f(x) + ' ' + f(yy(t2));
      }
      g += p;
    });
    s += '<path d="' + g + '" stroke="#5c3217" stroke-width="0.6" fill="none" opacity=".75"/>';
    s += '<ellipse cx="-5" cy="-62" rx="1.6" ry="3.4" fill="none" stroke="#5c3217" stroke-width="0.6" opacity=".8"/>';
    s += '<ellipse cx="-5" cy="-62" rx="0.6" ry="1.4" fill="#5c3217" opacity=".7"/>';
    // blade shading: dark on the far edge, rim light near
    var shp = '';
    for (var i5 = 2; i5 <= 38; i5++) { var t5 = i5 / N; shp += (i5 > 2 ? 'L' : 'M') + f(-hw(t5) + 0.6) + ' ' + f(yy(t5)); }
    s += '<path d="' + shp + '" stroke="#2a160a" stroke-width="2.6" fill="none" opacity=".35" stroke-linecap="round"/>';
    // carved koru pair, triangle band and dotted border
    s += '<path d="' + spiral(-6, -48, 3.6, 1.7, 1, 0.5) + '" stroke="#3d200d" stroke-width="0.9" fill="none" stroke-linecap="round" transform="translate(0.4 0)"/>';
    s += '<path d="' + spiral(6, -48, 3.6, 1.7, -1, 2.6) + '" stroke="#3d200d" stroke-width="0.9" fill="none" stroke-linecap="round"/>';
    s += '<path d="' + spiral(-5.4, -76, 3, 1.6, -1, 1) + '" stroke="#3d200d" stroke-width="0.8" fill="none" stroke-linecap="round"/>';
    s += '<path d="' + spiral(5.4, -76, 3, 1.6, 1, 2) + '" stroke="#3d200d" stroke-width="0.8" fill="none" stroke-linecap="round"/>';
    var tb = '';
    for (var q = 0; q < 5; q++) tb += 'M' + f(-8 + q * 3.2) + ' -34.6 l1.6 -3.6 l1.6 3.6';
    s += '<path d="' + tb + '" stroke="#3d200d" stroke-width="0.8" fill="none" stroke-linejoin="round"/>';
    s += '<path d="M-7 -34.6 H9 M-7.6 -37.8 H9.6" stroke="#3d200d" stroke-width=".6" opacity=".7"/>';
    var dots = '';
    for (var i6 = 6; i6 <= 34; i6 += 2) { var t6 = i6 / N; dots += 'M' + f(hw(t6) - 4.6) + ' ' + f(yy(t6)) + 'h.01M' + f(-hw(t6) + 4.6) + ' ' + f(yy(t6)) + 'h.01'; }
    s += '<path d="' + dots + '" stroke="#f1c48a" stroke-width=".9" stroke-linecap="round" opacity=".7"/>';
    // tip: notches, dent and glint
    s += '<path d="M-1 -101 l2.4 -1.4 M-2.4 -96 l1.4 0.2" stroke="#2a160a" stroke-width=".7" stroke-linecap="round"/>';
    s += '<path d="M5.6 -84 L8 -86" stroke="#2a160a" stroke-width=".8" stroke-linecap="round"/>';
    s += '<g transform="translate(-4 -90)"><path d="M0 -4.2 L0.9 -0.9 L4.2 0 L0.9 0.9 L0 4.2 L-0.9 0.9 L-4.2 0 L-0.9 -0.9Z" fill="#fff" stroke="#fff3c8" stroke-width=".4" opacity=".95"/></g>';
    // central carved ridge with chevrons
    s += '<path d="M0 -26 L0 -98" stroke="#3d200d" stroke-width="1.2"/>';
    s += '<path d="M0 -26 L0 -98" stroke="#c98d55" stroke-width="0.5" transform="translate(0.9 0)"/>';
    var ch = '';
    for (var c = 0; c < 6; c++) {
      var cy = -40 - c * 9;
      ch += 'M-3.4 ' + (cy + 3) + 'L0 ' + cy + 'L3.4 ' + (cy + 3);
    }
    s += '<path d="' + ch + '" stroke="#3d200d" stroke-width="1" fill="none"/>';
    // lashing holes + cord stitching near each tooth
    var holes = '';
    for (var k2 = 0; k2 < 11; k2++) {
      var t3 = 0.07 + k2 * 0.083, y3 = yy(t3), h3 = hw(t3) - 2.8;
      holes += '<circle cx="' + f(h3) + '" cy="' + f(y3) + '" r="0.65" fill="#2a160a"/>' +
        '<circle cx="' + f(-h3) + '" cy="' + f(y3) + '" r="0.65" fill="#2a160a"/>';
    }
    s += holes;
    // edge highlight
    var eh = '';
    for (var i4 = 3; i4 <= 34; i4++) {
      var t4 = i4 / N;
      eh += (i4 > 3 ? 'L' : 'M') + f(hw(t4) - 2.2) + ' ' + f(yy(t4));
    }
    s += '<path d="' + eh + '" stroke="#e0a870" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".85"/>';
    // lashing cord binding at the blade/handle junction
    s += '<path d="M-5.2 -30 L5.2 -30 L4.6 -16 L-4.6 -16Z" fill="#d9b56a" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/>';
    var lash = '';
    for (var y5 = -28.6; y5 < -16.5; y5 += 1.8) lash += 'M-4.8 ' + f(y5 + 0.8) + ' L4.8 ' + f(y5 - 0.6);
    s += '<path d="' + lash + '" stroke="#8a6428" stroke-width="0.8"/>';
    s += '<path d="M-4.4 -23.5 L4.4 -21.5 M-4.4 -21.5 L4.4 -23.5" stroke="#6b4a1a" stroke-width="1.1"/>';
    s += '<path d="M-3.5 -29 L-3.5 -17" stroke="#fff2c8" stroke-width="0.7" opacity=".7"/>';
    s += '<path d="M-3.9 -11 L3.9 -11 M-3.9 -9.4 L3.9 -9.4" stroke="#3d200d" stroke-width=".8"/>';
    s += '<path d="M-3.8 -11 Q0 -10 3.8 -11" stroke="#f1c48a" stroke-width=".5" opacity=".7" fill="none"/>';
    s += '<path d="M-4.8 -14.4 L4.6 -13.6" stroke="#2a160a" stroke-width="2" opacity=".25"/>';
    // grip wrap below hand area
    s += '<path d="M-3.8 8 L3.8 8 L3.8 20 L-3.8 20Z" fill="#9c3a18" stroke="' + O + '" stroke-width="1.4"/>';
    s += '<path d="M-3.8 10 L3.8 12 M-3.8 13 L3.8 15 M-3.8 16 L3.8 18" stroke="#e07b1f" stroke-width="0.9"/>';
    s += '<path d="M-3.8 11 L3.8 13 M-3.8 14 L3.8 16 M-3.8 17 L3.8 19" stroke="#5a1a08" stroke-width=".5" opacity=".7"/>';
    s += '<path d="M-3 8.6 L-3 19.6" stroke="#fff" stroke-width=".6" opacity=".35"/>';
    s += '<path d="M-3.8 20 Q0 21.6 3.8 20 L3.6 22 Q0 23.6 -3.6 22Z" fill="#2a160a" opacity=".35"/>';
    return s;
  }

  function upperArm() {
    var s = '';
    // upper arm (shoulder 122,118 -> elbow 134,140)
    s += '<g transform="translate(121 117) rotate(62)">';
    s += '<rect x="-4" y="-8.5" width="33" height="17" rx="8.5" fill="' + SKIN + '" stroke="' + O + '" stroke-width="3"/>';
    s += '<path d="M2 5 L26 5.6" stroke="' + SKIN_SH + '" stroke-width="4" stroke-linecap="round" opacity=".7"/>';
    s += '<path d="M3 -4.8 L22 -4.6" stroke="' + SKIN_HI + '" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>';
    s += '<ellipse cx="9" cy="-1" rx="7" ry="3.6" fill="' + SKIN_HI + '" opacity=".3"/>';
    s += '<path d="M2 7.6 L26 7.8" stroke="#d9805a" stroke-width="1.4" opacity=".5" stroke-linecap="round"/>';
    s += '<path d="M-3 -3 Q0 -7 4 -6.8" stroke="' + O + '" stroke-width="1" fill="none" opacity=".3"/>';
    // tatau: tooth band + koru + lines
    s += '<g opacity=".92">' +
      '<path d="M-1.6 -6.4 Q-4.2 0 -1.6 6.4 M1.2 -7.4 Q-1.8 0 1.2 7.4" stroke="' + INK + '" stroke-width="0.9" fill="none"/>' +
      '<circle cx="-1.4" cy="0" r="1" fill="' + INK + '"/>' +
      toothBand(4, -7.6, 4, 7.6, 5, 3, INK, 0.8) +
      '<path d="M9.8 -7.6 L9.8 7.6 M11 -7.6 L11 7.6" stroke="' + INK + '" stroke-width="0.7"/>' +
      '<path d="' + spiral(15, 0, 3.4, 1.7, -1, 1.2) + '" stroke="' + INK + '" stroke-width="0.9" fill="none"/>' +
      '<path d="M19.4 -7.6 Q17 0 19.4 7.6" stroke="' + INK + '" stroke-width="0.8" fill="none"/>' +
      '</g>';
    // woven arm band with leaves
    s += '<rect x="22" y="-9.4" width="5.4" height="18.8" rx="2" fill="#c9a15a" stroke="' + O + '" stroke-width="2"/>';
    s += '<rect x="22.4" y="-9" width="4.6" height="4" rx="1.6" fill="#fff" opacity=".28"/><rect x="22.4" y="5" width="4.6" height="4" rx="1.6" fill="#3a1c0c" opacity=".25"/>';
    s += '<path d="M20.6 -8 Q19 0 20.6 8" stroke="#3a1c0c" stroke-width="2" fill="none" opacity=".25"/>';
    s += '<path d="M22.6 -7 l4.2 2.4 M22.6 -3 l4.2 2.4 M22.6 1 l4.2 2.4 M22.6 5 l4.2 2.4 M26.8 -7 l-4.2 2.4 M26.8 -3 l-4.2 2.4 M26.8 1 l-4.2 2.4 M26.8 5 l-4.2 2.4" stroke="#7a5a26" stroke-width="0.7"/>';
    s += '<g transform="translate(24.8 -9)">' +
      '<path d="M0 0 Q-7 -6 -12 -2 Q-6 2 0 0Z" fill="#5fae40" stroke="' + O + '" stroke-width="1"/>' +
      '<path d="M0 0 L-10 -2 M-3 -1.2 l-1 -2 M-5.6 -1.6 l-1 -2 M-8 -2 l-.6 -1.6 M-3 -1 l-1 1.4 M-5.6 -1.4 l-1 1.4" stroke="#2f6a25" stroke-width="0.4"/><path d="M-1 -1.6 Q-5 -4 -9 -2.6" stroke="#b7e59a" stroke-width=".5" fill="none"/>' +
      '<path d="M0 0 Q5 -7 12 -5 Q6 1 0 0Z" fill="#78c94f" stroke="' + O + '" stroke-width="1"/>' +
      '<path d="M0 0 L10 -4.4 M3 -1.4 l1 -2 M5.6 -2.6 l1 -2 M8 -3.6 l.6 -1.6 M3 -1.2 l1 1.4 M5.6 -2.4 l1 1.4" stroke="#2f6a25" stroke-width="0.4"/><path d="M1 -1.6 Q5 -5 10 -4.6" stroke="#c9f0a8" stroke-width=".5" fill="none"/></g>';
    s += '</g>';
    return s;
  }

  function weaponArm(P) {
    var s = upperArm();
    // forearm (elbow 134,140 -> hand 149,151)
    s += '<g transform="translate(134 141) rotate(36)">';
    s += '<rect x="-6" y="-7.8" width="26" height="15.6" rx="7.5" fill="' + SKIN + '" stroke="' + O + '" stroke-width="3"/>';
    s += '<path d="M-1 4.6 L16 4.6" stroke="' + SKIN_SH + '" stroke-width="3.4" stroke-linecap="round" opacity=".65"/>';
    s += '<g opacity=".92">' +
      '<path d="M0 -6.4 L2 -3 L0 0 L2 3 L0 6.4 M3 -6.4 L5 -3 L3 0 L5 3 L3 6.4" stroke="' + INK + '" stroke-width="0.8" fill="none"/>' +
      enata(9, 1) +
      '<path d="M13 -6.8 L13 6.8" stroke="' + INK + '" stroke-width="1.1"/>' +
      '</g>';
    s += '<ellipse cx="4" cy="-3" rx="6" ry="2.6" fill="' + SKIN_HI + '" opacity=".35"/>';
    s += '<path d="M-5 7 L12 7" stroke="#d9805a" stroke-width="1.2" opacity=".5" stroke-linecap="round"/>';
    s += '<path d="M6 -6 Q7.6 -3 6 0 M6 3 Q7.6 5 6 6.6" stroke="' + INK + '" stroke-width=".6" fill="none" opacity=".8"/>';
    // wrist wrap
    s += '<rect x="14" y="-8.2" width="5" height="16.4" rx="1.8" fill="#d9b56a" stroke="' + O + '" stroke-width="1.8"/>';
    s += '<rect x="14.4" y="-7.8" width="4.2" height="3.6" rx="1.4" fill="#fff" opacity=".28"/><path d="M13 -8 Q11.6 0 13 8" stroke="#3a1c0c" stroke-width="1.8" fill="none" opacity=".22"/>';
    s += '<path d="M14.4 -5 L18.6 -6.6 M14.4 -1.4 L18.6 -3 M14.4 2.2 L18.6 0.6 M14.4 5.8 L18.6 4.2" stroke="#8a6428" stroke-width="0.8"/>';
    s += '</g>';
    // club
    s += '<g transform="translate(150 152) rotate(13)">' + club(P) + '</g>';
    // fist wrapped around the handle
    s += '<g transform="translate(150 152) rotate(13)">' +
      '<path d="M-8.5 -6 Q-9.5 3 -6 7.5 L6.5 7.5 Q9.5 4 8.5 -6 Q0 -9 -8.5 -6Z" fill="' + SKIN + '" stroke="' + O + '" stroke-width="2.8" stroke-linejoin="round"/>' +
      '<path d="M2.2 -6.8 L2.4 7.2 M5.4 -6.2 L5.8 7 M-1 -7 L-1 7.4" stroke="' + O + '" stroke-width="1" stroke-linecap="round"/>' +
      '<path d="M-8.2 -1 Q-4 1.6 -1.4 -1.6" stroke="' + O + '" stroke-width="1.4" fill="none" stroke-linecap="round"/>' +
      '<path d="M-5.8 -5.4 Q-2 -6.6 1 -5.8" stroke="' + SKIN_HI + '" stroke-width="1.3" fill="none" stroke-linecap="round"/>' +
      '<path d="M0.4 -5 l0 1.2 M3.8 -4.8 l0 1.2 M7 -4.4 l0 1.2" stroke="#f3d2b4" stroke-width="1" stroke-linecap="round"/>' +
      '</g>';
    return s;
  }

  function legs() {
    var s = '';
    // rear leg
    s += '<path d="M75 192 L74 218 Q74 222 80 222 L88 222 Q90 219 89 214 L90 192Z" fill="' + SKIN_SH + '" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<path d="M76 194 L89 194" stroke="#1a0e06" stroke-width="3" opacity=".25"/><path d="M75.5 199 l2 -2.4 l2 2.4 l2 -2.4 l2 2.4 l2 -2.4" stroke="' + INK + '" stroke-width=".7" fill="none" opacity=".7"/>';
    s += foot(72, SKIN_SH, SKIN_DK);
    s += leafCuff(82, 214.5, 17, 5);
    // front leg
    s += '<path d="M100 192 L100 218 Q100 222 106 222 L114 222 Q116 219 115 214 L116 192Z" fill="' + SKIN + '" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<path d="M112 196 L112 214" stroke="' + SKIN_SH + '" stroke-width="3" stroke-linecap="round" opacity=".7"/>';
    s += '<path d="M103 196 L103 208" stroke="' + SKIN_HI + '" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>';
    // calf tatau bands
    s += '<path d="M100.5 200 L115.5 200 M100.5 202 L115.5 202" stroke="' + INK + '" stroke-width="0.8"/>';
    s += '<path d="M101 202 L103 205 L105 202 L107 205 L109 202 L111 205 L113 202 L115 205" stroke="' + INK + '" stroke-width="0.8" fill="none"/>';
    s += '<path d="M101 206 Q106 209 112 206" stroke="' + SKIN_DK + '" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".6"/>';
    s += '<path d="M100.6 194 L115.6 194" stroke="#3a1c0c" stroke-width="3" opacity=".25"/>';
    s += '<path d="M101 208.6 l2 -2.4 l2 2.4 l2 -2.4 l2 2.4 l2 -2.4 l2 2.4" stroke="' + INK + '" stroke-width=".7" fill="none"/>';
    s += '<path d="M101.6 197 h.01 M103.6 197.6 h.01 M105.6 197 h.01 M107.6 197.6 h.01 M109.6 197 h.01 M111.6 197.6 h.01 M113.6 197 h.01" stroke="' + INK + '" stroke-width=".9" stroke-linecap="round"/>';
    s += foot(99, SKIN, SKIN_SH);
    s += leafCuff(108, 214.5, 17, 5);
    return s;
  }

  function build(P, uidRaw) {
    var s = '';
    s += '<ellipse class="part-shadow" cx="100" cy="229.5" rx="48" ry="7" fill="#000" opacity=".22"/>';
    s += '<g class="part-legs">' + legs() + '</g>';
    s += '<g class="part-body">';
    s += '<g class="part-cape" style="transform-origin: 72px 112px">' + capeBack(P) + '</g>';
    s += backArm();
    s += torso(P);
    s += '<g class="part-cape" style="transform-origin: 98px 166px">' + skirt() + '</g>';
    s += tapa(P);
    s += necklace(P);
    s += '<g class="part-cape" style="transform-origin: 80px 110px">' + mantle(P) + '</g>';
    s += '<g class="part-head" style="transform-origin: 99px 104px">' + head(P) + '</g>';
    s += '<g class="part-weapon" style="transform-origin: 121px 117px">' + weaponArm(P) + '</g>';
    s += '</g>';
    return s;
  }

  function suffix(uid) { return '-' + (uid === undefined || uid === null ? '0' : String(uid)); }

  window.HEROES = window.HEROES || {};
  window.HEROES.polynesian = {
    key: 'polynesian',
    name: 'Kaimana',
    title: 'The Ocean Warrior',
    lore: 'Raised on the reef and guided by the stars, Kaimana carries his grandfather’s shark-tooth club. Every wave he rides feeds the mana that mends his wounds.',
    color: '#e07b1f',
    base: { hp: 580, atk: 95, def: 20 },
    fx: { slash: '#ffb03a', glow: '#fff0cc' },
    signature: { name: 'Mana Surge', desc: 'Heal 15% of damage dealt as HP (lifesteal).', type: 'lifesteal' },
    svg: function (uid) {
      var P = suffix(uid);
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240">' + defs(P) + build(P) + '</svg>';
    },
    portrait: function (uid) {
      var P = '-p' + suffix(uid);
      var id = function (n) { return 'polynesian-' + n + P; };
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' + defs(P) +
        '<circle cx="60" cy="60" r="56" fill="url(#' + id('bg') + ')"/>' +
        '<g clip-path="url(#' + id('pclip') + ')">' +
        // stylised wave rings behind
        '<g opacity=".18" fill="#fff6dc"><path d="M60 40 L20 -10 L40 -14Z M60 40 L70 -16 L90 -12Z M60 40 L104 -6 L118 8Z M60 40 L-6 30 L-6 50Z M60 40 L126 34 L126 54Z"/></g>' +
        '<g fill="#fff" opacity=".85"><path d="M18 24 l1.2 3.4 3.4 1.2 -3.4 1.2 -1.2 3.4 -1.2 -3.4 -3.4 -1.2 3.4 -1.2z M100 30 l.9 2.6 2.6 .9 -2.6 .9 -.9 2.6 -.9 -2.6 -2.6 -.9 2.6 -.9z M96 12 l.7 2 2 .7 -2 .7 -.7 2 -.7 -2 -2 -.7 2 -.7z"/></g>' +
        '<path d="M4 110 Q20 100 34 110 T64 110 T94 110 T124 110" stroke="#fff3dc" stroke-width="1.6" fill="none" opacity=".25"/>' +
        '<path d="M8 88 q3 -3 6 0 M30 96 q3 -3 6 0 M88 90 q3 -3 6 0 M104 100 q3 -3 6 0" stroke="#fff3dc" stroke-width="1" fill="none" opacity=".4"/>' +
        '<path d="M4 92 Q20 82 34 92 T64 92 T94 92 T124 92" stroke="#fff3dc" stroke-width="2.4" fill="none" opacity=".45"/>' +
        '<path d="M4 102 Q20 92 34 102 T64 102 T94 102 T124 102" stroke="#fff3dc" stroke-width="2" fill="none" opacity=".3"/>' +
        '<g transform="translate(-8.6 3) scale(0.7)">' +
        capeBack(P) + backArm() + torso(P) + necklace(P) + mantle(P) +
        '<g>' + head(P).replace('class="part-eyes"', 'class="p-eyes"') + '</g>' +
        upperArm() +
        '</g></g>' +
        '<circle cx="60" cy="60" r="53.6" fill="none" stroke="#ffe2b0" stroke-width="1" opacity=".55"/>' +
        '<path d="M14 40 A50 50 0 0 1 36 15" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".35"/>' +
        '<circle cx="60" cy="60" r="56" fill="none" stroke="' + O + '" stroke-width="3"/>' +
        '</svg>';
    }
  };
})();

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
  function feather(x, y, ang, len, fill, rib) {
    var w = len * 0.36;
    return '<g transform="translate(' + f(x) + ' ' + f(y) + ') rotate(' + f(ang) + ')">' +
      '<path d="M0 0 C' + f(w) + ' ' + f(len * 0.25) + ' ' + f(w * 0.8) + ' ' + f(len * 0.8) + ' 0 ' + f(len) +
      ' C' + f(-w * 0.8) + ' ' + f(len * 0.8) + ' ' + f(-w) + ' ' + f(len * 0.25) + ' 0 0Z" fill="' + fill +
      '" stroke="' + O + '" stroke-width="1"/>' +
      '<path d="M0 1 L0 ' + f(len * 0.88) + '" stroke="' + rib + '" stroke-width="0.7" stroke-linecap="round"/>' +
      '<path d="M0 ' + f(len * 0.4) + 'L' + f(w * 0.5) + ' ' + f(len * 0.6) + 'M0 ' + f(len * 0.55) + 'L' + f(-w * 0.5) + ' ' + f(len * 0.75) +
      '" stroke="' + rib + '" stroke-width="0.45" opacity=".8"/>' +
      '</g>';
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
      '<clipPath id="' + id('torso') + '"><path d="M74 112 Q97 103 122 111 Q130 132 126 160 L69 160 Q65 132 74 112Z"/></clipPath>' +
      '<clipPath id="' + id('tapaclip') + '"><path d="M69 154 Q97 161 127 154 L128 171 Q97 178 68 171Z"/></clipPath>' +
      '<clipPath id="' + id('pclip') + '"><circle cx="60" cy="60" r="56"/></clipPath>' +
      '</defs>';
  }

  /* ---------- body pieces (all in 200x240 hero space) ---------- */

  function capeBack() {
    // feather cloak hanging behind the left (rear) shoulder
    var s = '<path d="M62 110 Q52 140 50 176 Q64 184 80 178 L84 116 Z" fill="#7a1f18" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    var rows = [[114, 58, 80], [124, 55, 80], [134, 53, 80], [144, 52, 80], [154, 51, 80], [164, 50, 80]];
    for (var r = 0; r < rows.length; r++) {
      var y = rows[r][0];
      for (var x = rows[r][1] + (r % 2) * 3; x <= rows[r][2]; x += 6) {
        var yellow = (r === 2 || r === 5) || (x > 74 && r % 2 === 0);
        s += feather(x, y, 8 - (x - 66) * 0.4, 13, yellow ? '#f4b83a' : '#d23a2c', yellow ? '#a8661c' : '#7a1c16');
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
    // fist
    s += '<circle cx="64" cy="158" r="7" fill="' + SKIN_SH + '" stroke="' + O + '" stroke-width="2.8"/>' +
      '<path d="M66 154 Q69 157 67 161 M63 155.5 Q66 158 64.5 162" stroke="' + O + '" stroke-width="1" fill="none" stroke-linecap="round"/>';
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
    // small enata figures along the side
    s += enata(119, 152) + enata(113, 153.5);
    s += '</g>';
    s += '</g>';
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
    }
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
    s += '</g>';
    // knot + hanging flap at the front hip
    s += '<path d="M112 168 Q118 180 114 192 L124 190 Q125 178 121 167Z" fill="url(#' + id('tapa') + ')" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>';
    s += '<path d="M114.5 176 L122.5 175 M114.8 180 L123 179.4" stroke="#7a3a1a" stroke-width="1"/>';
    s += '<path d="M116 183.5 L118 181 L120 183.5 L118 186Z" fill="#7a3a1a"/>';
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
      var big = i === 3 ? 1.25 : 1;
      s += '<g transform="translate(' + f(x) + ' ' + f(y) + ') rotate(' + f(ang) + ') scale(' + big + ')">' +
        '<path d="M-2.2 0 Q-1.6 3.6 0.3 6.6 Q1.2 3.4 2.2 0 Z" fill="url(#' + id('tooth') + ')" stroke="' + O + '" stroke-width="0.95" stroke-linejoin="round"/>' +
        '<path d="M-1.2 0.8 Q-0.8 3 0.1 4.8" stroke="#fff" stroke-width="0.6" fill="none"/>' +
        '<path d="M1.6 1.2 l0.5 0.3 M1.3 2.4 l0.5 0.3 M1 3.6 l0.5 0.3" stroke="#a89770" stroke-width="0.4"/>' +
        '</g>';
    }
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
    s += '<path d="M3.2 16.4 C5.6 14.8 6.4 12.6 6.4 10.6" stroke="#0e3d27" stroke-width="0.8" fill="none" opacity=".7"/>';
    s += '</g>';
    return s;
  }

  function mantle() {
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
        s += feather(xs[i] + (r % 2) * 1.5, rows[r][0], 10 - i * 5, 14, yel ? '#f6bf3f' : '#dc3b2c', yel ? '#a8661c' : '#7a1c16');
      }
    }
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
    // bone pin through the topknot
    s += '<path d="M67 22 L104 8" stroke="' + O + '" stroke-width="4" stroke-linecap="round"/>';
    s += '<path d="M67 22 L104 8" stroke="#f1e6c8" stroke-width="2.2" stroke-linecap="round"/>';
    s += '<circle cx="104.5" cy="7.8" r="2.4" fill="#f1e6c8" stroke="' + O + '" stroke-width="1.3"/>';
    s += '<path d="M70 20.2 l0.8 1.6 M73 19 l0.8 1.6" stroke="#9c8a60" stroke-width="0.6"/>';
    // woven band at topknot base
    s += '<path d="M73 27 Q86 33 99 26 L100 32 Q86 39 72 33Z" fill="#e07b1f" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>';
    var w = '';
    for (var x = 74.5; x < 99; x += 3) w += 'M' + x + ' ' + f(28.6 + Math.sin((x - 72) / 27 * Math.PI) * 3) + 'l2 4.2 ';
    s += '<path d="' + w + '" stroke="#8a3f0c" stroke-width="0.9"/>';
    s += '<path d="M74 30.5 Q86 36 98.5 29.5" stroke="#ffc27a" stroke-width="0.7" fill="none"/>';
    // ear (rear side)
    // face
    s += '<path d="M62 70 Q62 36 100 34 Q138 36 139 72 Q139 98 122 106 Q108 112 92 110 Q64 104 62 70Z" fill="url(#' + id('face') + ')" stroke="' + O + '" stroke-width="3.4" stroke-linejoin="round"/>';
    // jaw shade
    s += '<path d="M66 84 Q72 104 94 107 Q80 108 70 99 Q64 92 66 84Z" fill="' + SKIN_SH + '" opacity=".55"/>';
    // front hair: swept back hairline with sideburn
    s += '<path d="M60 78 Q56 44 86 34 Q116 26 136 50 Q138 58 137 64 Q128 50 112 47 Q98 45 86 50 Q76 56 74 70 Q73 80 72 88 Q64 88 60 78Z" fill="url(#' + id('hair') + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<path d="M84 49 Q98 36 124 40 M78 56 Q86 44 104 40 M92 46 Q108 38 130 46 M70 66 Q72 52 84 44" stroke="#5a4640" stroke-width="1.1" fill="none" stroke-linecap="round"/>';
    s += '<path d="M96 38 Q110 34 124 39" stroke="#8f7a70" stroke-width="2" fill="none" stroke-linecap="round" opacity=".9"/>';
    // ear
    s += '<path d="M70 72 Q60 68 60 80 Q61 90 71 89" fill="' + SKIN + '" stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round"/>';
    s += '<path d="M68 76 Q63 76 64 81 Q65 85 69 84" stroke="' + SKIN_DK + '" stroke-width="1.2" fill="none"/>';
    s += '<circle cx="64.5" cy="88" r="1.6" fill="#f1e6c8" stroke="' + O + '" stroke-width="0.8"/>';
    // cheeks
    s += '<ellipse cx="96" cy="93" rx="6" ry="3.4" fill="#e8795c" opacity=".45"/>';
    s += '<ellipse cx="131" cy="91" rx="4.4" ry="3.2" fill="#e8795c" opacity=".45"/>';
    // eyebrows (determined)
    s += '<path d="M89 64 Q97 62 105.5 68.5 L104 71.5 Q97 67.8 89.5 68.4 Z" fill="#1d1310" stroke="' + O + '" stroke-width="1.2" stroke-linejoin="round"/>';
    s += '<path d="M114 69 Q123 61.5 133 62.5 L133 66.5 Q124 66 115.5 72 Z" fill="#1d1310" stroke="' + O + '" stroke-width="1.2" stroke-linejoin="round"/>';
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
    // shark teeth along both edges (drawn before blade so bases tuck under)
    var teeth = '', hl = '', ser = '';
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
        hl += 'M' + f(sg * (h0 + 0.6)) + ' ' + f(y0 - 1.2) + 'L' + f(sg * (h0 + 3.6)) + ' ' + f(y0 - 1.8);
        ser += 'M' + f(sg * (h0 + 1.6)) + ' ' + f(y0 + 1.6) + 'l' + f(sg * 0.5) + ' 0.6 M' + f(sg * (h0 + 3.2)) + ' ' + f(y0 + 0.4) + 'l' + f(sg * 0.5) + ' 0.6';
        void ang;
      });
    }
    s += '<path d="' + teeth + '" fill="url(#' + id('tooth') + ')" stroke="' + O + '" stroke-width="1.3" stroke-linejoin="round"/>';
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
    // grip wrap below hand area
    s += '<path d="M-3.8 8 L3.8 8 L3.8 20 L-3.8 20Z" fill="#9c3a18" stroke="' + O + '" stroke-width="1.4"/>';
    s += '<path d="M-3.8 10 L3.8 12 M-3.8 13 L3.8 15 M-3.8 16 L3.8 18" stroke="#e07b1f" stroke-width="0.9"/>';
    return s;
  }

  function upperArm() {
    var s = '';
    // upper arm (shoulder 122,118 -> elbow 134,140)
    s += '<g transform="translate(121 117) rotate(62)">';
    s += '<rect x="-4" y="-8.5" width="33" height="17" rx="8.5" fill="' + SKIN + '" stroke="' + O + '" stroke-width="3"/>';
    s += '<path d="M2 5 L26 5.6" stroke="' + SKIN_SH + '" stroke-width="4" stroke-linecap="round" opacity=".7"/>';
    s += '<path d="M3 -4.8 L22 -4.6" stroke="' + SKIN_HI + '" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>';
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
    s += '<path d="M22.6 -7 l4.2 2.4 M22.6 -3 l4.2 2.4 M22.6 1 l4.2 2.4 M22.6 5 l4.2 2.4 M26.8 -7 l-4.2 2.4 M26.8 -3 l-4.2 2.4 M26.8 1 l-4.2 2.4 M26.8 5 l-4.2 2.4" stroke="#7a5a26" stroke-width="0.7"/>';
    s += '<g transform="translate(24.8 -9)">' +
      '<path d="M0 0 Q-7 -6 -12 -2 Q-6 2 0 0Z" fill="#5fae40" stroke="' + O + '" stroke-width="1"/>' +
      '<path d="M0 0 L-10 -2" stroke="#2f6a25" stroke-width="0.5"/>' +
      '<path d="M0 0 Q5 -7 12 -5 Q6 1 0 0Z" fill="#78c94f" stroke="' + O + '" stroke-width="1"/>' +
      '<path d="M0 0 L10 -4.4" stroke="#2f6a25" stroke-width="0.5"/></g>';
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
    // wrist wrap
    s += '<rect x="14" y="-8.2" width="5" height="16.4" rx="1.8" fill="#d9b56a" stroke="' + O + '" stroke-width="1.8"/>';
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
    s += foot(72, SKIN_SH, SKIN_DK);
    s += leafCuff(82, 214.5, 17, 5);
    // front leg
    s += '<path d="M100 192 L100 218 Q100 222 106 222 L114 222 Q116 219 115 214 L116 192Z" fill="' + SKIN + '" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<path d="M112 196 L112 214" stroke="' + SKIN_SH + '" stroke-width="3" stroke-linecap="round" opacity=".7"/>';
    s += '<path d="M103 196 L103 208" stroke="' + SKIN_HI + '" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>';
    // calf tatau bands
    s += '<path d="M100.5 200 L115.5 200 M100.5 202 L115.5 202" stroke="' + INK + '" stroke-width="0.8"/>';
    s += '<path d="M101 202 L103 205 L105 202 L107 205 L109 202 L111 205 L113 202 L115 205" stroke="' + INK + '" stroke-width="0.8" fill="none"/>';
    s += foot(99, SKIN, SKIN_SH);
    s += leafCuff(108, 214.5, 17, 5);
    return s;
  }

  function build(P, uidRaw) {
    var s = '';
    s += '<ellipse class="part-shadow" cx="100" cy="229.5" rx="48" ry="7" fill="#000" opacity=".22"/>';
    s += '<g class="part-legs">' + legs() + '</g>';
    s += '<g class="part-body">';
    s += '<g class="part-cape" style="transform-origin: 72px 112px">' + capeBack() + '</g>';
    s += backArm();
    s += torso(P);
    s += '<g class="part-cape" style="transform-origin: 98px 166px">' + skirt() + '</g>';
    s += tapa(P);
    s += necklace(P);
    s += '<g class="part-cape" style="transform-origin: 80px 110px">' + mantle() + '</g>';
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
        '<path d="M4 92 Q20 82 34 92 T64 92 T94 92 T124 92" stroke="#fff3dc" stroke-width="2.4" fill="none" opacity=".45"/>' +
        '<path d="M4 102 Q20 92 34 102 T64 102 T94 102 T124 102" stroke="#fff3dc" stroke-width="2" fill="none" opacity=".3"/>' +
        '<g transform="translate(-8.6 3) scale(0.7)">' +
        capeBack() + backArm() + torso(P) + necklace(P) + mantle() +
        '<g>' + head(P).replace('class="part-eyes"', 'class="p-eyes"') + '</g>' +
        upperArm() +
        '</g></g>' +
        '<circle cx="60" cy="60" r="56" fill="none" stroke="' + O + '" stroke-width="3"/>' +
        '</svg>';
    }
  };
})();

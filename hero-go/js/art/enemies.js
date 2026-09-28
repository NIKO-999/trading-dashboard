/* Hero Go! — enemy art library.
 * viewBox 0 0 200 200, feet on y≈190, all enemies FACE LEFT.
 * window.ENEMIES = { key: { name, svg(uid) } }
 * Class hooks: part-shadow (ground), part-body (idle bob), part-eyes (blink),
 * plus part-head / part-weapon / part-cape where it makes sense.
 */
(function () {
  'use strict';
  var O = '#2b1d14';

  function S(w) { return 'stroke="' + O + '" stroke-width="' + (w || 4) + '" stroke-linejoin="round" stroke-linecap="round"'; }
  function stops(a) { return a.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join(''); }
  function lg(id, a, x1, y1, x2, y2) {
    return '<linearGradient id="' + id + '" x1="' + (x1 == null ? 0 : x1) + '" y1="' + (y1 == null ? 0 : y1) + '" x2="' + (x2 == null ? 0 : x2) + '" y2="' + (y2 == null ? 1 : y2) + '">' + stops(a) + '</linearGradient>';
  }
  function rg(id, a, cx, cy, r) {
    return '<radialGradient id="' + id + '" cx="' + (cx == null ? 0.5 : cx) + '" cy="' + (cy == null ? 0.5 : cy) + '" r="' + (r == null ? 0.6 : r) + '">' + stops(a) + '</radialGradient>';
  }
  function shadow(rx, cx, op) {
    cx = cx == null ? 100 : cx;
    return '<g class="part-shadow"><ellipse cx="' + cx + '" cy="190" rx="' + rx + '" ry="' + (4 + rx * 0.1).toFixed(1) + '" fill="#000" opacity="' + (op == null ? 0.25 : op) + '"/></g>';
  }
  function wrap(defs, sh, body) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs>' + defs + '</defs>' + sh + '<g class="part-body">' + body + '</g></svg>';
  }
  // Cute glossy chibi eye (dark oval + highlights, looking slightly left)
  function eye(x, y, rx, ry, col) {
    var s = '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + O + '"/>';
    if (col) s += '<ellipse cx="' + (x - rx * 0.15) + '" cy="' + (y + ry * 0.25) + '" rx="' + rx * 0.62 + '" ry="' + ry * 0.5 + '" fill="' + col + '"/>';
    s += '<ellipse cx="' + (x - rx * 0.32) + '" cy="' + (y - ry * 0.36) + '" rx="' + rx * 0.42 + '" ry="' + ry * 0.32 + '" fill="#fff"/>';
    s += '<circle cx="' + (x + rx * 0.35) + '" cy="' + (y + ry * 0.4) + '" r="' + rx * 0.18 + '" fill="#fff" opacity=".85"/>';
    return s;
  }
  // bumpy / furry outline around an ellipse
  function fluff(cx, cy, rx, ry, n, b, a0) {
    a0 = a0 || 0;
    var pts = [], i, d = '';
    for (i = 0; i <= n; i++) {
      var a = a0 + i * 2 * Math.PI / n;
      pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (i = 0; i < n; i++) {
      var am = a0 + (i + 0.5) * 2 * Math.PI / n;
      var qx = cx + rx * (1 + b) * Math.cos(am), qy = cy + ry * (1 + b) * Math.sin(am);
      d += ' Q' + qx.toFixed(1) + ' ' + qy.toFixed(1) + ' ' + pts[i + 1][0].toFixed(1) + ' ' + pts[i + 1][1].toFixed(1);
    }
    return d + 'Z';
  }
  // outlined bone / limb segment
  function limb(x1, y1, x2, y2, w, col) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + O + '" stroke-width="' + (w + 7) + '" stroke-linecap="round"/>' +
      '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round"/>';
  }
  function knob(x, y, r, col) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + col + '" ' + S(3) + '/>'; }
  function blush(x, y, rx) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + (rx || 8) + '" ry="' + ((rx || 8) * 0.5) + '" fill="#ff7f9a" opacity=".55"/>'; }
  function hl(x, y, rx, ry, rot, op) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" transform="rotate(' + (rot || 0) + ' ' + x + ' ' + y + ')" fill="#fff" opacity="' + (op == null ? 0.7 : op) + '"/>'; }

  var E = {};

  /* ---------------------------------------------------------------- SLIME */
  E.slime = {
    name: 'Slime',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'slime-' + n + '-' + uid; };
      var P = 'M40 186 C26 186 26 168 34 152 C46 120 70 94 98 90 Q100 76 110 70 Q108 82 114 92 C138 100 156 124 166 152 C174 168 172 186 158 186 Z';
      var defs = rg(I('body'), [[0, '#d7ff9e'], [0.4, '#7ddb4f'], [1, '#349a2a']], 0.36, 0.32, 0.8) +
        '<clipPath id="' + I('clip') + '"><path d="' + P + '"/></clipPath>';
      var body =
        '<path d="' + P + '" fill="url(#' + I('body') + ')" ' + S(4) + '/>' +
        '<g clip-path="url(#' + I('clip') + ')">' +
        '<ellipse cx="112" cy="206" rx="86" ry="34" fill="#2b8a22" opacity=".45"/>' +
        '<path d="M150 120 Q170 150 160 184" stroke="#2b8a22" stroke-width="10" fill="none" opacity=".35"/>' +
        '<circle cx="136" cy="168" r="5" fill="#fff" opacity=".35"/><circle cx="146" cy="156" r="3" fill="#fff" opacity=".35"/><circle cx="52" cy="170" r="3.5" fill="#fff" opacity=".3"/>' +
        '</g>' +
        hl(68, 116, 16, 8, -40, 0.85) + hl(52, 136, 4, 5, 0, 0.7) + hl(108, 80, 2.5, 5, 30, 0.8) +
        '<g class="part-eyes">' + eye(74, 140, 7.5, 11) + eye(108, 140, 7.5, 11) + '</g>' +
        blush(60, 158, 8) + blush(124, 158, 8) +
        '<path d="M82 156 Q91 168 100 156 Z" fill="#8a2338" ' + S(3) + '/>' +
        '<path d="M86 160 Q91 164 96 160" fill="#ff8aa0" />';
      return wrap(defs, shadow(64), body);
    }
  };

  /* ------------------------------------------------------------ HELMSLIME */
  E.helmslime = {
    name: 'Helmet Slime',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'helmslime-' + n + '-' + uid; };
      var P = 'M38 186 C24 186 24 166 32 150 C44 118 68 96 100 94 C132 96 156 118 168 150 C176 166 174 186 160 186 Z';
      var defs = rg(I('body'), [[0, '#ffe2a8'], [0.4, '#ffa447'], [1, '#d4601a']], 0.36, 0.3, 0.8) +
        lg(I('metal'), [[0, '#f4f7fa'], [0.45, '#b4bec8'], [1, '#6c7784']], 0, 0, 1, 1) +
        lg(I('horn'), [[0, '#fffaf0'], [0.6, '#eedbb0'], [1, '#c9a86c']], 0, 0, 1, 1) +
        lg(I('band'), [[0, '#f0b35a'], [1, '#a86420']]) +
        '<clipPath id="' + I('clip') + '"><path d="' + P + '"/></clipPath>';
      var hornL = 'M62 102 C38 102 20 86 16 54 C28 70 44 80 64 84 Z';
      var hornR = 'M138 102 C162 102 180 86 184 54 C172 70 156 80 136 84 Z';
      var body =
        '<path d="' + P + '" fill="url(#' + I('body') + ')" ' + S(4) + '/>' +
        '<g clip-path="url(#' + I('clip') + ')"><ellipse cx="112" cy="208" rx="86" ry="34" fill="#c24d10" opacity=".4"/>' +
        '<circle cx="140" cy="166" r="5" fill="#fff" opacity=".3"/></g>' +
        hl(52, 146, 4, 7, 20, 0.6) +
        // horns
        '<path d="' + hornL + '" fill="url(#' + I('horn') + ')" ' + S(3.5) + '/>' +
        '<path d="M30 78 Q36 76 40 70 M42 88 Q48 86 50 80" stroke="#b89358" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
        '<path d="' + hornR + '" fill="url(#' + I('horn') + ')" ' + S(3.5) + '/>' +
        '<path d="M170 78 Q164 76 160 70 M158 88 Q152 86 150 80" stroke="#b89358" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
        // helmet dome
        '<path d="M52 122 C50 86 72 64 100 64 C128 64 150 86 148 122 Z" fill="url(#' + I('metal') + ')" ' + S(4) + '/>' +
        '<path d="M100 66 L100 116" stroke="#7d8894" stroke-width="3"/>' +
        '<path d="M64 108 C62 88 76 74 92 70" stroke="#fff" stroke-width="5" fill="none" opacity=".75" stroke-linecap="round"/>' +
        '<path d="M126 96 l8 -4 M122 84 l6 5" stroke="#6c7784" stroke-width="2" stroke-linecap="round"/>' +
        // band
        '<path d="M46 114 Q100 104 154 114 L154 128 Q100 118 46 128 Z" fill="url(#' + I('band') + ')" ' + S(3.5) + '/>' +
        [56, 72, 128, 144].map(function (x) { return '<circle cx="' + x + '" cy="' + (x < 100 ? 119 - (x - 46) * 0.12 : 119 - (154 - x) * 0.12) + '" r="2.8" fill="#ffe7a8" ' + S(1.5) + '/>'; }).join('') +
        // nose guard
        '<path d="M86 108 L96 108 L94 140 Q91 146 88 140 Z" fill="url(#' + I('metal') + ')" ' + S(3) + '/>' +
        // brows + eyes
        '<path d="M64 132 L80 136 M104 136 L118 132" stroke="' + O + '" stroke-width="4" stroke-linecap="round"/>' +
        '<g class="part-eyes">' + eye(73, 146, 7, 9.5) + eye(110, 146, 7, 9.5) + '</g>' +
        blush(60, 162, 7) + blush(126, 162, 7) +
        '<path d="M82 164 Q96 174 110 162" fill="none" ' + S(3.5) + '/>' +
        '<path d="M100 167 L102 174 L106 166" fill="#fff" ' + S(2) + '/>' +
        // band-aid
        '<g transform="rotate(-25 134 150)"><rect x="126" y="146" width="18" height="8" rx="3" fill="#ffd9b0" ' + S(2) + '/><rect x="132" y="146" width="6" height="8" fill="#f2bf8a"/></g>';
      return wrap(defs, shadow(66), body);
    }
  };

  /* ------------------------------------------------------------- MUSHROOM */
  E.mushroom = {
    name: 'Grumpy Shroom',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'mushroom-' + n + '-' + uid; };
      var CAP = 'M24 108 C18 66 56 34 100 34 C144 34 182 66 176 108 C150 122 50 122 24 108 Z';
      var defs = rg(I('cap'), [[0, '#ff9a86'], [0.45, '#e8402e'], [1, '#a11f16']], 0.35, 0.25, 0.85) +
        lg(I('stem'), [[0, '#fff7e6'], [0.6, '#f3dcb4'], [1, '#d6b584']], 0, 0, 1, 0) +
        '<clipPath id="' + I('clip') + '"><path d="' + CAP + '"/></clipPath>';
      var spots = [[58, 66, 12], [100, 50, 9], [140, 68, 13], [80, 92, 7], [160, 96, 6], [38, 92, 6], [118, 94, 6]];
      var body =
        // feet
        '<ellipse cx="80" cy="183" rx="17" ry="8" fill="#9a6538" ' + S(3.5) + '/>' +
        '<ellipse cx="122" cy="183" rx="15" ry="7.5" fill="#9a6538" ' + S(3.5) + '/>' +
        // arms
        '<path d="M70 138 Q50 142 50 156 Q60 160 70 152" fill="#f3dcb4" ' + S(3.5) + '/>' +
        '<path d="M130 138 Q150 142 150 156 Q140 160 130 152" fill="#e2c496" ' + S(3.5) + '/>' +
        // stem
        '<path d="M68 110 C60 140 60 166 70 180 Q100 188 130 180 C140 166 140 140 132 110 Z" fill="url(#' + I('stem') + ')" ' + S(4) + '/>' +
        '<path d="M124 118 C132 140 132 164 124 178" stroke="#d6b584" stroke-width="5" fill="none" opacity=".7"/>' +
        // gills
        '<path d="M34 110 Q100 132 166 110 Q100 124 34 110 Z" fill="#f0d4a8" ' + S(3) + '/>' +
        // cap
        '<path d="' + CAP + '" fill="url(#' + I('cap') + ')" ' + S(4) + '/>' +
        '<g clip-path="url(#' + I('clip') + ')"><path d="M20 104 Q100 124 180 104 L180 130 L20 130 Z" fill="#8a160f" opacity=".45"/></g>' +
        spots.map(function (s) { return '<circle cx="' + s[0] + '" cy="' + s[1] + '" r="' + s[2] + '" fill="#fff6ea" stroke="#7a1a12" stroke-width="2"/>'; }).join('') +
        hl(62, 50, 16, 6, -30, 0.45) +
        // face
        '<path d="M70 126 L90 133 M122 126 L104 133" stroke="' + O + '" stroke-width="5" stroke-linecap="round"/>' +
        '<g class="part-eyes">' + eye(82, 142, 6.5, 8) + eye(110, 142, 6.5, 8) + '</g>' +
        '<path d="M84 164 Q96 154 108 164" fill="none" ' + S(4) + '/>' +
        '<path d="M72 150 q6 3 12 0 M100 150 q6 3 12 0" stroke="#d99a7a" stroke-width="2" fill="none" opacity=".8"/>' +
        '<path d="M126 58 l6 -4 M132 64 l6 -2" stroke="#fff" stroke-width="2" opacity=".6"/>';
      return wrap(defs, shadow(58), body);
    }
  };

  /* --------------------------------------------------------------- CACTUS */
  E.cactus = {
    name: 'Cactus Boxer',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'cactus-' + n + '-' + uid; };
      var defs = lg(I('body'), [[0, '#a8ec6e'], [0.45, '#5bb840'], [1, '#2e7a2a']], 0, 0, 1, 0) +
        rg(I('glove'), [[0, '#ff8a7a'], [0.5, '#e32b2b'], [1, '#9a1414']], 0.35, 0.3, 0.8);
      function spine(x, y, r) { return '<path d="M' + x + ' ' + y + ' l' + (r ? 5 : -5) + ' -3 M' + x + ' ' + y + ' l' + (r ? 5 : -5) + ' 3" stroke="#fff6c8" stroke-width="1.8" stroke-linecap="round"/>'; }
      function glove(cx, cy, rot, cuffDx) {
        return '<g transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')">' +
          '<rect x="' + (cx + cuffDx - 5) + '" y="' + (cy - 11) + '" width="11" height="22" rx="3" fill="#fff" ' + S(3) + '/>' +
          '<ellipse cx="' + cx + '" cy="' + cy + '" rx="19" ry="17" fill="url(#' + I('glove') + ')" ' + S(3.5) + '/>' +
          '<ellipse cx="' + (cx - 2) + '" cy="' + (cy + 12) + '" rx="10" ry="6" fill="#d02424" ' + S(3) + '/>' +
          '<path d="M' + (cx - 10) + ' ' + (cy - 8) + ' q6 -5 12 -4" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".7"/>' +
          '<path d="M' + (cx + cuffDx - 3) + ' ' + (cy - 6) + ' l6 3 M' + (cx + cuffDx - 3) + ' ' + (cy) + ' l6 3" stroke="#e32b2b" stroke-width="1.8"/>' +
          '</g>';
      }
      var body =
        // legs
        '<rect x="78" y="172" width="14" height="14" rx="4" fill="#4a9a36" ' + S(3.5) + '/>' +
        '<rect x="108" y="172" width="14" height="14" rx="4" fill="#3d852f" ' + S(3.5) + '/>' +
        '<ellipse cx="82" cy="186" rx="11" ry="5" fill="#fff" ' + S(3) + '/><ellipse cx="114" cy="186" rx="11" ry="5" fill="#f0f0f0" ' + S(3) + '/>' +
        // back arm (guard up)
        '<path d="M126 122 Q150 122 156 106 L146 100 Q142 112 126 110 Z" fill="#4a9a36" ' + S(3.5) + '/>' +
        glove(160, 94, -30, 8) +
        // body
        '<path d="M70 176 L70 82 C70 50 130 50 130 82 L130 176 Z" fill="url(#' + I('body') + ')" ' + S(4) + '/>' +
        '<path d="M86 64 L86 170 M100 58 L100 170 M114 64 L114 170" stroke="#2e7a2a" stroke-width="2.5" opacity=".55"/>' +
        spine(76, 90, 0) + spine(76, 120, 0) + spine(92, 76, 1) + spine(108, 72, 1) + spine(122, 128, 1) + spine(124, 94, 1) + spine(92, 128, 0) + spine(108, 140, 1) +
        // flower
        '<g transform="translate(112 56)">' +
        [0, 72, 144, 216, 288].map(function (a) { return '<ellipse cx="0" cy="-8" rx="5.5" ry="8" fill="#ff8fc8" ' + S(2.5) + ' transform="rotate(' + a + ')"/>'; }).join('') +
        '<circle r="5" fill="#ffd84a" ' + S(2.5) + '/></g>' +
        // headband
        '<path d="M69 80 Q100 72 131 80 L131 90 Q100 82 69 90 Z" fill="#e32b2b" ' + S(3) + '/>' +
        '<path d="M130 84 Q146 82 152 92 Q142 90 136 94 Z M130 86 Q144 94 144 106 Q136 98 132 96 Z" fill="#c81e1e" ' + S(2.5) + '/>' +
        // shorts
        '<path d="M68 150 L132 150 L134 178 L106 178 L100 168 L94 178 L66 178 Z" fill="#e32b2b" ' + S(3.5) + '/>' +
        '<path d="M68 150 L132 150 L132 157 L68 157 Z" fill="#fff" ' + S(3) + '/>' +
        '<path d="M124 158 L124 176" stroke="#fff" stroke-width="3"/>' +
        // face
        '<path d="M76 98 L90 103 M112 103 L124 98" stroke="' + O + '" stroke-width="4" stroke-linecap="round"/>' +
        '<g class="part-eyes">' + eye(84, 111, 6, 8) + eye(112, 111, 6, 8) + '</g>' +
        '<path d="M86 126 Q99 138 112 124 Z" fill="#fff" ' + S(3) + '/><path d="M92 127 L92 131 M99 128 L99 133 M106 126 L106 130" stroke="' + O + '" stroke-width="1.5"/>' +
        blush(76, 122, 6) + blush(122, 122, 6) +
        // front arm punching left
        '<path d="M72 118 Q56 116 50 124 L56 134 Q62 128 72 132 Z" fill="#5bb840" ' + S(3.5) + '/>' +
        spine(60, 120, 0) +
        glove(40, 126, 10, 12);
      return wrap(defs, shadow(52, 98), body);
    }
  };

  /* --------------------------------------------------------------- GOBLIN */
  E.goblin = {
    name: 'Goblin',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'goblin-' + n + '-' + uid; };
      var defs = rg(I('skin'), [[0, '#c4f28a'], [0.5, '#79c94a'], [1, '#3f8a2a']], 0.35, 0.3, 0.8) +
        lg(I('tunic'), [[0, '#b0804a'], [1, '#5e3a1c']]) +
        lg(I('blade'), [[0, '#e6e9ec'], [0.5, '#a9b0b8'], [1, '#6a727c']], 0, 0, 1, 0);
      var body =
        // legs & feet
        '<rect x="84" y="166" width="12" height="18" fill="#5fae3e" ' + S(3.5) + '/>' +
        '<rect x="106" y="166" width="12" height="18" fill="#4c9632" ' + S(3.5) + '/>' +
        '<path d="M96 180 Q80 178 72 188 L98 188 Z" fill="#6e4524" ' + S(3.5) + '/>' +
        '<path d="M118 180 Q102 178 96 188 L120 188 Z" fill="#5e3a1c" ' + S(3.5) + '/>' +
        // back arm
        '<path d="M124 134 Q140 144 138 160" stroke="' + O + '" stroke-width="13" fill="none" stroke-linecap="round"/>' +
        '<path d="M124 134 Q140 144 138 160" stroke="#4c9632" stroke-width="7" fill="none" stroke-linecap="round"/>' +
        // tunic
        '<path d="M76 126 L126 126 L132 174 L122 168 L114 176 L104 168 L94 176 L84 168 L72 174 Z" fill="url(#' + I('tunic') + ')" ' + S(3.5) + '/>' +
        '<path d="M84 132 l4 6 M112 140 l4 5 M92 160 l3 4" stroke="#3f2612" stroke-width="2" stroke-linecap="round"/>' +
        '<rect x="112" y="136" width="10" height="9" fill="#8a9a5a" stroke="#3f2612" stroke-width="1.5" transform="rotate(8 117 140)"/>' +
        '<path d="M114 138 l6 5 M120 138 l-6 5" stroke="#3f2612" stroke-width="1"/>' +
        '<rect x="74" y="148" width="54" height="8" fill="#3f2612" ' + S(2.5) + '/>' +
        '<rect x="94" y="146" width="12" height="12" rx="2" fill="#c9a24a" ' + S(2.5) + '/>' +
        // head group
        '<g class="part-head">' +
        '<path d="M66 82 Q36 70 12 58 Q26 92 66 106 Z" fill="#79c94a" ' + S(3.5) + '/>' +
        '<path d="M60 88 Q40 80 26 72 Q36 92 60 100 Z" fill="#e89a8a"/>' +
        '<path d="M138 82 Q168 70 188 58 Q176 92 138 106 Z" fill="#5fae3e" ' + S(3.5) + '/>' +
        '<path d="M144 88 Q164 80 176 72 Q168 92 144 100 Z" fill="#d88a7a"/>' +
        '<path d="M178 64 l6 6" stroke="' + O + '" stroke-width="3"/>' +
        '<ellipse cx="102" cy="92" rx="44" ry="38" fill="url(#' + I('skin') + ')" ' + S(4) + '/>' +
        '<path d="M92 56 Q94 44 88 38 M102 55 Q106 42 104 34 M112 57 Q118 46 120 42" stroke="' + O + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        hl(80, 66, 12, 5, -25, 0.5) +
        '<circle cx="128" cy="78" r="3" fill="#5a9a3a"/><circle cx="133" cy="84" r="2" fill="#5a9a3a"/>' +
        '<path d="M68 80 L90 88 M124 84 L106 88" stroke="' + O + '" stroke-width="4.5" stroke-linecap="round"/>' +
        '<g class="part-eyes">' +
        '<ellipse cx="80" cy="94" rx="9" ry="8" fill="#ffe45c" ' + S(3) + '/><ellipse cx="77" cy="95" rx="3" ry="5" fill="' + O + '"/><circle cx="76" cy="92" r="1.3" fill="#fff"/>' +
        '<ellipse cx="114" cy="94" rx="9" ry="8" fill="#ffe45c" ' + S(3) + '/><ellipse cx="111" cy="95" rx="3" ry="5" fill="' + O + '"/><circle cx="110" cy="92" r="1.3" fill="#fff"/>' +
        '</g>' +
        '<path d="M94 96 Q72 104 62 114 Q82 118 100 108 Z" fill="#6cbc40" ' + S(3.5) + '/>' +
        '<path d="M76 118 Q100 134 126 114 Q100 124 76 118 Z" fill="#5a1f1a" ' + S(3.5) + '/>' +
        '<path d="M84 121 L87 128 L90 122 Z M112 121 L115 127 L118 120 Z" fill="#fffbe6" ' + S(1.5) + '/>' +
        '</g>' +
        // front arm + dagger
        '<g class="part-weapon" style="transform-origin: 80px 134px">' +
        '<path d="M52 146 L28 104 L34 100 L38 108 L36 112 L44 116 L42 120 L58 142 Z" fill="url(#' + I('blade') + ')" ' + S(3) + '/>' +
        '<circle cx="40" cy="116" r="2.5" fill="#a0522d" opacity=".8"/><circle cx="48" cy="128" r="2" fill="#a0522d" opacity=".7"/>' +
        '<path d="M44 150 L64 138" stroke="' + O + '" stroke-width="9" stroke-linecap="round"/><path d="M44 150 L64 138" stroke="#7a4a2a" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M56 146 L66 164" stroke="' + O + '" stroke-width="9" stroke-linecap="round"/><path d="M56 146 L66 164" stroke="#c9a877" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M58 152 l5 -2 M61 157 l5 -2" stroke="#7a5a3a" stroke-width="1.5"/>' +
        '<path d="M80 134 Q70 144 62 148" stroke="' + O + '" stroke-width="13" fill="none" stroke-linecap="round"/>' +
        '<path d="M80 134 Q70 144 62 148" stroke="#79c94a" stroke-width="7" fill="none" stroke-linecap="round"/>' +
        '<circle cx="60" cy="150" r="8" fill="#79c94a" ' + S(3.5) + '/>' +
        '</g>';
      return wrap(defs, shadow(52, 98), body);
    }
  };

  /* ------------------------------------------------------------- SKELETON */
  E.skeleton = {
    name: 'Skeleton',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'skeleton-' + n + '-' + uid; };
      var B = '#f4ecd6', BS = '#cfc2a0';
      var defs = rg(I('skull'), [[0, '#fffcf2'], [0.6, '#efe4c8'], [1, '#c8b890']], 0.35, 0.3, 0.8) +
        lg(I('iron'), [[0, '#9aa0a8'], [1, '#4c525a']]) +
        lg(I('rust'), [[0, '#d9c4a8'], [0.5, '#a88a6c'], [1, '#6c5440']], 0, 0, 1, 0) +
        rg(I('glow'), [[0, '#ffe08a'], [0.4, '#ff4a2a'], [1, '#ff2a1a', 0]], 0.5, 0.5, 0.5);
      var body =
        // legs
        limb(94, 160, 88, 182, 6, B) + limb(110, 160, 116, 182, 6, BS) +
        '<path d="M78 188 Q80 180 92 182 L94 188 Z" fill="' + B + '" ' + S(3) + '/>' +
        '<path d="M106 188 Q108 180 120 182 L122 188 Z" fill="' + BS + '" ' + S(3) + '/>' +
        // tattered loincloth
        '<path d="M84 150 L120 150 L118 172 L112 166 L106 174 L100 164 L94 174 L90 166 L86 170 Z" fill="#6a3a4a" ' + S(3) + '/>' +
        // pelvis
        '<path d="M86 146 Q102 140 118 146 L116 156 Q102 160 88 156 Z" fill="' + B + '" ' + S(3) + '/>' +
        // back arm
        limb(122, 122, 130, 146, 5, BS) + knob(131, 150, 5, BS) +
        // spine
        limb(102, 112, 102, 146, 5, B) +
        // ribcage
        '<path d="M82 116 Q102 108 122 116 L120 138 Q102 146 84 138 Z" fill="#3a2a30" ' + S(3) + '/>' +
        [120, 128, 136].map(function (y, i) { var w = 18 - i * 2; return '<path d="M' + (102 - w) + ' ' + (y + 4) + ' Q102 ' + (y - 4) + ' ' + (102 + w) + ' ' + (y + 4) + '" stroke="' + O + '" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M' + (102 - w) + ' ' + (y + 4) + ' Q102 ' + (y - 4) + ' ' + (102 + w) + ' ' + (y + 4) + '" stroke="' + B + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>'; }).join('') +
        // head
        '<g class="part-head">' +
        '<path d="M80 92 L80 106 Q102 118 124 106 L126 92 Z" fill="url(#' + I('skull') + ')" ' + S(3.5) + '/>' +
        '<path d="M88 104 L88 111 M95 106 L95 114 M102 107 L102 114 M109 106 L109 113 M116 104 L116 110" stroke="' + O + '" stroke-width="2"/>' +
        '<circle cx="104" cy="76" r="34" fill="url(#' + I('skull') + ')" ' + S(4) + '/>' +
        '<path d="M130 70 L122 78 L126 84" stroke="' + O + '" stroke-width="2" fill="none"/>' +
        '<ellipse cx="88" cy="80" rx="11" ry="12" fill="#2a1a20"/><ellipse cx="116" cy="80" rx="10" ry="11" fill="#2a1a20"/>' +
        '<g class="part-eyes"><circle cx="87" cy="81" r="7" fill="url(#' + I('glow') + ')"/><circle cx="87" cy="81" r="2.6" fill="#fff4c0"/>' +
        '<circle cx="115" cy="81" r="6.5" fill="url(#' + I('glow') + ')"/><circle cx="115" cy="81" r="2.4" fill="#fff4c0"/></g>' +
        '<path d="M98 92 L94 100 L102 100 Z" fill="#2a1a20"/>' +
        // dented kettle helm
        '<path d="M66 70 Q66 34 104 34 Q142 34 142 70 Q104 58 66 70 Z" fill="url(#' + I('iron') + ')" ' + S(3.5) + '/>' +
        '<path d="M60 70 Q104 54 148 70 L146 76 Q104 62 62 76 Z" fill="#6c727a" ' + S(3) + '/>' +
        '<path d="M104 36 L104 60" stroke="#3c4148" stroke-width="3"/>' +
        '<circle cx="120" cy="50" r="4" fill="#a0522d" opacity=".75"/><circle cx="84" cy="56" r="3" fill="#a0522d" opacity=".7"/><circle cx="132" cy="64" r="2.5" fill="#a0522d" opacity=".7"/>' +
        '<path d="M80 44 Q88 38 96 38" stroke="#fff" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/>' +
        '</g>' +
        // sword arm
        '<g class="part-weapon" style="transform-origin: 84px 122px">' +
        '<g transform="translate(58 134) rotate(-22)">' +
        '<path d="M-6 -6 L-7 -92 L0 -106 L7 -92 L6 -6 Z" fill="url(#' + I('rust') + ')" ' + S(3.5) + '/>' +
        '<path d="M0 -10 L0 -94" stroke="#6c5440" stroke-width="1.5" opacity=".6"/>' +
        '<path d="M-7 -60 l4 3 l-4 3 M7 -40 l-4 3 l4 3" fill="#fff" stroke="' + O + '" stroke-width="2"/>' +
        '<circle cx="-2" cy="-30" r="3" fill="#8a4a1a" opacity=".8"/><circle cx="3" cy="-72" r="2.5" fill="#8a4a1a" opacity=".8"/><circle cx="-3" cy="-84" r="2" fill="#8a4a1a" opacity=".7"/>' +
        '<rect x="-17" y="-8" width="34" height="7" rx="3" fill="#7a5a3a" ' + S(3) + '/>' +
        '<rect x="-4" y="-2" width="8" height="18" fill="#5a3a2a" ' + S(3) + '/>' +
        '<circle cx="0" cy="18" r="5" fill="#9a7a4a" ' + S(3) + '/>' +
        '</g>' +
        limb(84, 122, 64, 132, 5, B) + knob(59, 134, 7, B) +
        '</g>';
      return wrap(defs, shadow(46, 102), body);
    }
  };

  /* ------------------------------------------------------------------ BAT */
  E.bat = {
    name: 'Bat',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'bat-' + n + '-' + uid; };
      var defs = rg(I('body'), [[0, '#d7b4ff'], [0.5, '#9660d6'], [1, '#5a2e92']], 0.35, 0.3, 0.8) +
        lg(I('wing'), [[0, '#8f5ccc'], [1, '#4a2478']]);
      var W = 'M82 96 Q50 44 8 58 Q22 70 18 90 Q34 84 42 100 Q54 94 62 112 Q72 102 86 110 Z';
      var wr = function (d) { return d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, function (m, x, y) { return (200 - +x) + ' ' + y; }); };
      var body =
        '<g class="part-cape">' +
        '<path d="' + W + '" fill="url(#' + I('wing') + ')" ' + S(3.5) + '/>' +
        '<path d="M80 96 L18 62 M72 96 L22 88 M74 100 L44 98 M78 104 L62 110" stroke="#c9a0f0" stroke-width="2" opacity=".6"/>' +
        '<path d="' + wr(W) + '" fill="url(#' + I('wing') + ')" ' + S(3.5) + '/>' +
        '<path d="' + wr('M80 96 L18 62 M72 96 L22 88 M74 100 L44 98 M78 104 L62 110') + '" stroke="#c9a0f0" stroke-width="2" opacity=".6"/>' +
        '<path d="M10 58 l-4 -6 M190 58 l4 -6" stroke="' + O + '" stroke-width="3" stroke-linecap="round"/>' +
        '</g>' +
        // ears
        '<path d="M76 84 L66 42 L96 72 Z" fill="#9660d6" ' + S(3.5) + '/><path d="M78 76 L72 54 L88 70 Z" fill="#ff9ec8"/>' +
        '<path d="M120 72 L136 44 L130 86 Z" fill="#7a46b8" ' + S(3.5) + '/><path d="M122 72 L132 56 L128 78 Z" fill="#e888b8"/>' +
        // feet
        '<path d="M88 132 l-4 10 M92 134 l0 10 M110 134 l0 10 M114 132 l4 10" stroke="' + O + '" stroke-width="3" stroke-linecap="round"/>' +
        // body
        '<ellipse cx="100" cy="104" rx="36" ry="33" fill="url(#' + I('body') + ')" ' + S(4) + '/>' +
        '<path d="M86 132 Q100 110 118 132" fill="#c7a4f0" opacity=".6"/>' +
        '<path d="M96 72 q4 -8 10 -6 q-2 4 0 8" fill="#9660d6" ' + S(2.5) + '/>' +
        hl(80, 84, 10, 5, -35, 0.6) +
        '<g class="part-eyes">' + eye(86, 100, 7, 9.5) + eye(112, 100, 7, 9.5) + '</g>' +
        blush(76, 114, 6) + blush(122, 114, 6) +
        '<path d="M90 114 Q99 122 108 114" fill="none" ' + S(3) + '/>' +
        '<path d="M93 116 L95 123 L97 117 Z M101 117 L103 123 L105 116 Z" fill="#fff" ' + S(1.5) + '/>';
      return wrap(defs, shadow(30, 100, 0.18), body);
    }
  };

  /* --------------------------------------------------------------- BANDIT */
  E.bandit = {
    name: 'Bandit',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'bandit-' + n + '-' + uid; };
      var defs = rg(I('skin'), [[0, '#ffe0c0'], [0.6, '#f4b98a'], [1, '#d48e5c']], 0.35, 0.35, 0.75) +
        lg(I('steel'), [[0, '#f2f5f8'], [0.5, '#aeb8c2'], [1, '#66717c']], 0, 0, 1, 1) +
        lg(I('leather'), [[0, '#a0683a'], [1, '#5a3418']]) +
        lg(I('band'), [[0, '#e8453a'], [1, '#9a1c18']]) +
        lg(I('beard'), [[0, '#8a5a30'], [1, '#4e2e14']]);
      var body =
        // legs / boots
        '<rect x="82" y="162" width="16" height="16" fill="#4a4050" ' + S(3.5) + '/><rect x="104" y="162" width="16" height="16" fill="#3c3442" ' + S(3.5) + '/>' +
        '<path d="M100 174 L78 174 Q70 180 70 189 L100 189 Z" fill="url(#' + I('leather') + ')" ' + S(3.5) + '/>' +
        '<path d="M122 174 L102 174 Q96 180 96 189 L122 189 Z" fill="#5a3418" ' + S(3.5) + '/>' +
        // cape behind
        '<path class="part-cape" d="M122 120 Q146 140 144 176 L130 170 L124 178 L118 150 Z" fill="#7a1e1a" ' + S(3.5) + '/>' +
        // back arm
        '<path d="M122 126 Q136 136 132 152" stroke="' + O + '" stroke-width="15" fill="none" stroke-linecap="round"/><path d="M122 126 Q136 136 132 152" stroke="#8a5a30" stroke-width="9" fill="none" stroke-linecap="round"/>' +
        '<circle cx="132" cy="154" r="7" fill="url(#' + I('skin') + ')" ' + S(3) + '/>' +
        // torso
        '<path d="M72 122 Q100 112 128 122 L126 166 L74 166 Z" fill="url(#' + I('leather') + ')" ' + S(3.5) + '/>' +
        '<path d="M80 124 Q100 118 118 124 L116 150 Q100 156 82 150 Z" fill="url(#' + I('steel') + ')" ' + S(3) + '/>' +
        '<path d="M100 122 L100 152" stroke="#66717c" stroke-width="2"/>' +
        '<circle cx="86" cy="128" r="1.8" fill="' + O + '"/><circle cx="114" cy="128" r="1.8" fill="' + O + '"/><circle cx="86" cy="146" r="1.8" fill="' + O + '"/><circle cx="114" cy="146" r="1.8" fill="' + O + '"/>' +
        '<path d="M88 132 l6 6" stroke="#fff" stroke-width="2" opacity=".7"/>' +
        '<rect x="72" y="152" width="56" height="9" fill="#3a2410" ' + S(3) + '/>' +
        '<rect x="94" y="150" width="13" height="13" rx="2" fill="#e8b84a" ' + S(3) + '/><rect x="98" y="154" width="5" height="5" fill="#8a6a1a"/>' +
        '<path d="M112 160 L124 160 L124 172 Q118 176 112 172 Z" fill="#8a5a30" ' + S(2.5) + '/>' +
        // head
        '<g class="part-head">' +
        '<circle cx="100" cy="82" r="38" fill="url(#' + I('skin') + ')" ' + S(4) + '/>' +
        '<ellipse cx="136" cy="88" rx="7" ry="9" fill="#e8a878" ' + S(3) + '/>' +
        // bandana
        '<path d="M60 80 Q58 40 100 40 Q142 40 140 80 Q100 64 60 80 Z" fill="url(#' + I('band') + ')" ' + S(3.5) + '/>' +
        '<circle cx="84" cy="56" r="3" fill="#fff" opacity=".85"/><circle cx="104" cy="50" r="3" fill="#fff" opacity=".85"/><circle cx="120" cy="60" r="3" fill="#fff" opacity=".85"/><circle cx="96" cy="66" r="2" fill="#fff" opacity=".85"/>' +
        '<path d="M136 64 Q156 60 162 72 Q150 72 142 76 Z M138 70 Q156 80 154 96 Q146 86 138 82 Z" fill="#b8241e" ' + S(3) + '/>' +
        // beard
        '<path d="M64 90 Q64 116 80 126 Q92 136 100 130 Q108 136 118 126 Q134 114 132 90 Q124 104 112 104 Q100 98 88 104 Q72 104 64 90 Z" fill="url(#' + I('beard') + ')" ' + S(3.5) + '/>' +
        '<path d="M80 112 q2 6 0 10 M92 116 q2 6 0 10 M106 116 q2 6 0 10 M118 110 q2 6 0 10" stroke="#3a200c" stroke-width="1.8" fill="none"/>' +
        '<path d="M76 104 Q88 96 98 104 Q108 96 118 104 Q108 110 98 106 Q88 110 76 104 Z" fill="#6a4020" ' + S(2.5) + '/>' +
        // eyes, patch, brow
        '<path d="M72 78 L92 84" stroke="' + O + '" stroke-width="5" stroke-linecap="round"/>' +
        '<g class="part-eyes">' + eye(83, 90, 5.5, 7) + '</g>' +
        '<path d="M62 74 L136 96" stroke="' + O + '" stroke-width="2.5"/>' +
        '<path d="M106 84 Q118 80 124 88 Q120 100 108 96 Z" fill="#241a1a" ' + S(2.5) + '/>' +
        '<path d="M86 98 Q80 98 80 102 Q84 106 92 102 Z" fill="#e0986a" ' + S(2.5) + '/>' +
        '<path d="M72 66 L68 76" stroke="#c8704a" stroke-width="0"/>' +
        '<path d="M126 100 l6 8 M128 104 l4 -2" stroke="#b86a50" stroke-width="2"/>' +
        '</g>' +
        // sword arm
        '<g class="part-weapon" style="transform-origin: 78px 126px">' +
        '<g transform="translate(58 146) rotate(-28)">' +
        '<path d="M-6 -8 L-6 -96 L0 -110 L6 -96 L6 -8 Z" fill="url(#' + I('steel') + ')" ' + S(3.5) + '/>' +
        '<path d="M0 -12 L0 -98" stroke="#7a8590" stroke-width="2"/>' +
        '<path d="M-3 -30 L-3 -90" stroke="#fff" stroke-width="2" opacity=".8"/>' +
        '<path d="M-18 -10 Q0 -4 18 -10 L18 -4 Q0 2 -18 -4 Z" fill="#c9a24a" ' + S(3) + '/>' +
        '<rect x="-4" y="-4" width="8" height="18" fill="#4a2a14" ' + S(3) + '/>' +
        '<circle cx="0" cy="17" r="5" fill="#e8b84a" ' + S(3) + '/>' +
        '</g>' +
        '<path d="M80 126 Q66 134 62 144" stroke="' + O + '" stroke-width="15" fill="none" stroke-linecap="round"/><path d="M80 126 Q66 134 62 144" stroke="#8a5a30" stroke-width="9" fill="none" stroke-linecap="round"/>' +
        '<path d="M74 118 Q84 112 94 120 L90 132 Q80 136 72 130 Z" fill="url(#' + I('steel') + ')" ' + S(3) + '/>' +
        '<circle cx="82" cy="124" r="1.8" fill="' + O + '"/>' +
        '<circle cx="58" cy="146" r="8" fill="url(#' + I('skin') + ')" ' + S(3.5) + '/>' +
        '</g>';
      return wrap(defs, shadow(52, 98), body);
    }
  };

  /* -------------------------------------------------------------- PALADIN */
  E.paladin = {
    name: 'Paladin',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'paladin-' + n + '-' + uid; };
      var defs = rg(I('skin'), [[0, '#ffe6cc'], [0.6, '#f7c69a'], [1, '#dc9a6a']], 0.35, 0.35, 0.75) +
        lg(I('hair'), [[0, '#fff2a0'], [0.5, '#f5c542'], [1, '#c98a1e']]) +
        lg(I('steel'), [[0, '#ffffff'], [0.45, '#c4ced8'], [1, '#76828e']], 0, 0, 1, 1) +
        lg(I('gold'), [[0, '#fff0a0'], [0.5, '#f0bc3a'], [1, '#b07a14']], 0, 0, 1, 1) +
        lg(I('tabard'), [[0, '#4a86e0'], [1, '#1f4a9a']]) +
        lg(I('hammer'), [[0, '#eef2f6'], [0.5, '#a6b2be'], [1, '#5c6874']]);
      var body =
        // legs
        '<rect x="80" y="162" width="17" height="16" fill="url(#' + I('steel') + ')" ' + S(3.5) + '/><rect x="104" y="162" width="17" height="16" fill="#8e9aa6" ' + S(3.5) + '/>' +
        '<path d="M99 174 L78 174 Q70 180 70 189 L99 189 Z" fill="url(#' + I('steel') + ')" ' + S(3.5) + '/>' +
        '<path d="M123 174 L104 174 Q98 180 98 189 L123 189 Z" fill="#76828e" ' + S(3.5) + '/>' +
        // cape
        '<path class="part-cape" d="M120 118 Q150 136 150 184 L136 178 L128 186 L118 150 Z" fill="#c02a2a" ' + S(3.5) + '/>' +
        // hammer (behind body) — head top-left, handle to hands
        '<g class="part-weapon" style="transform-origin: 82px 128px">' +
        '<path d="M44 58 L80 150" stroke="' + O + '" stroke-width="13" stroke-linecap="round"/>' +
        '<path d="M44 58 L80 150" stroke="#7a4a24" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M58 94 l6 -2 M62 104 l6 -2 M66 114 l6 -2" stroke="#c9a24a" stroke-width="3"/>' +
        '<circle cx="81" cy="153" r="6" fill="url(#' + I('gold') + ')" ' + S(3) + '/>' +
        '<g transform="translate(48 54) rotate(-14)">' +
        '<rect x="-36" y="-24" width="72" height="48" rx="7" fill="url(#' + I('hammer') + ')" ' + S(4) + '/>' +
        '<rect x="-40" y="-26" width="12" height="52" rx="4" fill="url(#' + I('gold') + ')" ' + S(3.5) + '/>' +
        '<rect x="28" y="-26" width="12" height="52" rx="4" fill="url(#' + I('gold') + ')" ' + S(3.5) + '/>' +
        '<rect x="-10" y="-24" width="20" height="48" fill="url(#' + I('gold') + ')" ' + S(3) + '/>' +
        '<path d="M0 -12 L7 0 L0 12 L-7 0 Z" fill="#5ad1ff" ' + S(2.5) + '/><path d="M-2 -6 L1 -1" stroke="#fff" stroke-width="2"/>' +
        '<path d="M-24 -18 L-16 -18 M16 -18 L24 -18" stroke="#fff" stroke-width="3" opacity=".8" stroke-linecap="round"/>' +
        '<circle cx="-34" cy="-18" r="1.8" fill="' + O + '"/><circle cx="-34" cy="18" r="1.8" fill="' + O + '"/><circle cx="34" cy="-18" r="1.8" fill="' + O + '"/><circle cx="34" cy="18" r="1.8" fill="' + O + '"/>' +
        '</g>' +
        '</g>' +
        // torso
        '<path d="M72 120 Q100 110 128 120 L126 166 L74 166 Z" fill="url(#' + I('steel') + ')" ' + S(3.5) + '/>' +
        '<path d="M84 126 L116 126 L114 170 L100 176 L86 170 Z" fill="url(#' + I('tabard') + ')" ' + S(3) + '/>' +
        '<path d="M100 132 L100 164 M90 142 L110 142" stroke="url(#' + I('gold') + ')" stroke-width="5" stroke-linecap="round"/>' +
        '<path d="M72 120 Q100 110 128 120 L126 128 Q100 118 74 128 Z" fill="url(#' + I('gold') + ')" ' + S(3) + '/>' +
        '<rect x="74" y="154" width="52" height="7" fill="#6a3a1a" ' + S(2.5) + '/><rect x="94" y="152" width="12" height="11" rx="2" fill="url(#' + I('gold') + ')" ' + S(2.5) + '/>' +
        // pauldrons
        '<path d="M116 114 Q140 108 144 130 Q132 136 118 132 Z" fill="#8e9aa6" ' + S(3.5) + '/>' +
        '<path d="M88 128 Q82 138 80 146" stroke="' + O + '" stroke-width="15" stroke-linecap="round"/><path d="M88 128 Q82 138 80 146" stroke="#b4bec8" stroke-width="9" stroke-linecap="round"/>' +
        '<path d="M64 124 Q78 108 98 120 Q96 136 80 138 Q66 136 64 124 Z" fill="url(#' + I('steel') + ')" ' + S(3.5) + '/>' +
        '<path d="M68 124 Q78 114 94 122" stroke="url(#' + I('gold') + ')" stroke-width="3" fill="none"/>' +
        '<circle cx="82" cy="128" r="2" fill="' + O + '"/>' +
        // head
        '<g class="part-head">' +
        '<path d="M64 76 Q60 30 104 34 Q146 36 140 86 L140 104 Q132 96 128 84 Z" fill="url(#' + I('hair') + ')" ' + S(3.5) + '/>' +
        '<circle cx="102" cy="84" r="36" fill="url(#' + I('skin') + ')" ' + S(4) + '/>' +
        '<ellipse cx="136" cy="90" rx="6" ry="8" fill="#e8a878" ' + S(3) + '/>' +
        // bangs sweeping left
        '<path d="M62 84 Q54 50 84 40 Q120 30 140 56 Q138 72 130 80 Q124 66 116 62 Q112 72 100 74 Q104 64 98 60 Q90 72 76 74 Q80 66 78 62 Q70 70 62 84 Z" fill="url(#' + I('hair') + ')" ' + S(3.5) + '/>' +
        '<path d="M84 46 Q96 40 108 42" stroke="#fff" stroke-width="3" fill="none" opacity=".75" stroke-linecap="round"/>' +
        // circlet
        '<path d="M66 66 Q100 50 138 62" stroke="url(#' + I('gold') + ')" stroke-width="5" fill="none"/><circle cx="96" cy="57" r="4" fill="#5ad1ff" ' + S(2) + '/>' +
        '<path d="M76 80 L92 82 M106 82 L120 79" stroke="#a86a14" stroke-width="4" stroke-linecap="round"/>' +
        '<g class="part-eyes">' + eye(84, 92, 6, 8, '#3a8ee6') + eye(112, 92, 6, 8, '#3a8ee6') + '</g>' +
        blush(76, 104, 6) + blush(122, 104, 6) +
        '<path d="M90 108 Q98 114 106 107" fill="none" ' + S(3) + '/>' +
        '</g>' +
        // gauntlets gripping the hammer handle
        '<circle cx="73" cy="134" r="8" fill="url(#' + I('steel') + ')" ' + S(3.5) + '/>' +
        '<path d="M68 130 L78 136" stroke="#76828e" stroke-width="2"/>' +
        '<circle cx="79" cy="148" r="8" fill="url(#' + I('steel') + ')" ' + S(3.5) + '/>' +
        '<path d="M74 144 L84 150" stroke="#76828e" stroke-width="2"/>';
      return wrap(defs, shadow(54, 98), body);
    }
  };

  /* ----------------------------------------------------------------- WOLF */
  E.wolf = {
    name: 'Grey Wolf',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'wolf-' + n + '-' + uid; };
      var defs = rg(I('fur'), [[0, '#e6ebf0'], [0.5, '#a3adb9'], [1, '#626c7a']], 0.35, 0.3, 0.85) +
        lg(I('tail'), [[0, '#b8c1cc'], [1, '#6a7482']]);
      var body =
        // tail
        '<g class="part-cape"><path d="M150 132 Q180 128 186 96 Q192 76 180 62 Q182 84 170 94 Q176 88 172 80 Q166 104 148 116 Z" fill="url(#' + I('tail') + ')" ' + S(3.5) + '/>' +
        '<path d="M182 66 Q186 78 182 88" stroke="#fff" stroke-width="3" fill="none" opacity=".6"/></g>' +
        // back legs
        '<path d="M150 146 L154 184 L168 184 L166 146 Z" fill="#6f7987" ' + S(3.5) + '/>' +
        '<path d="M90 150 L92 184 L106 184 L106 150 Z" fill="#6f7987" ' + S(3.5) + '/>' +
        '<path d="M88 188 Q88 181 99 181 Q110 181 110 188 Z M150 188 Q150 181 161 181 Q172 181 172 188 Z" fill="#b8c1cc" ' + S(3) + '/>' +
        // body
        '<path d="' + fluff(122, 138, 48, 30, 16, 0.08, 0.2) + '" fill="url(#' + I('fur') + ')" ' + S(4) + '/>' +
        '<path d="M100 118 Q120 110 150 116" stroke="#5a6472" stroke-width="3" fill="none" opacity=".5"/>' +
        '<path d="M128 124 l6 -8 l2 8 M144 128 l6 -8 l2 8" stroke="#626c7a" stroke-width="2.5" fill="none" stroke-linejoin="round"/>' +
        // front legs
        '<path d="M70 148 L68 184 L84 184 L88 148 Z" fill="url(#' + I('fur') + ')" ' + S(3.5) + '/>' +
        '<path d="M132 140 Q150 140 150 160 L146 184 L130 184 L128 160 Z" fill="url(#' + I('fur') + ')" ' + S(3.5) + '/>' +
        '<path d="M62 188 Q62 179 75 179 Q88 179 88 188 Z M124 188 Q124 179 137 179 Q150 179 150 188 Z" fill="#eef2f6" ' + S(3) + '/>' +
        '<path d="M71 183 l0 5 M79 183 l0 5 M133 183 l0 5 M141 183 l0 5" stroke="' + O + '" stroke-width="2"/>' +
        // chest fluff
        '<path d="' + fluff(80, 138, 20, 22, 9, 0.18, 0.4) + '" fill="#f4f7fa" ' + S(3.5) + '/>' +
        // head
        '<g class="part-head">' +
        '<path d="M52 70 L46 32 L78 60 Z" fill="#8e98a6" ' + S(3.5) + '/><path d="M55 64 L52 44 L70 60 Z" fill="#e8a0b0"/>' +
        '<path d="M88 62 L102 28 L108 70 Z" fill="#7a8492" ' + S(3.5) + '/><path d="M94 62 L101 42 L104 66 Z" fill="#d890a0"/>' +
        '<path d="' + fluff(76, 94, 34, 32, 12, 0.1, 0.3) + '" fill="url(#' + I('fur') + ')" ' + S(4) + '/>' +
        // snout
        '<path d="M58 92 Q30 92 22 104 Q24 118 40 122 Q54 124 66 116 Z" fill="#e6ebf0" ' + S(3.5) + '/>' +
        '<ellipse cx="24" cy="102" rx="7" ry="5.5" fill="' + O + '"/><circle cx="21" cy="100" r="1.8" fill="#fff" opacity=".7"/>' +
        '<path d="M28 114 Q42 120 58 114" fill="none" ' + S(3) + '/>' +
        '<path d="M34 115 L36 124 L40 116 Z M48 116 L50 124 L53 115 Z" fill="#fff" ' + S(1.8) + '/>' +
        '<path d="M60 76 L78 84 M94 82 L108 76" stroke="' + O + '" stroke-width="4.5" stroke-linecap="round"/>' +
        '<g class="part-eyes">' +
        '<ellipse cx="68" cy="88" rx="7" ry="6" fill="#ffd23a" ' + S(3) + '/><ellipse cx="66" cy="88" rx="2.5" ry="4.5" fill="' + O + '"/><circle cx="65" cy="86" r="1.2" fill="#fff"/>' +
        '<ellipse cx="98" cy="88" rx="7" ry="6" fill="#ffd23a" ' + S(3) + '/><ellipse cx="96" cy="88" rx="2.5" ry="4.5" fill="' + O + '"/><circle cx="95" cy="86" r="1.2" fill="#fff"/>' +
        '</g>' +
        '<path d="M100 104 Q106 110 104 118 M92 110 Q98 114 96 122" stroke="#626c7a" stroke-width="2.5" fill="none"/>' +
        hl(70, 70, 10, 4, -20, 0.55) +
        '</g>';
      return wrap(defs, shadow(64, 108), body);
    }
  };

  /* --------------------------------------------------------------- DRAGON */
  E.dragon = {
    name: 'Red Dragon',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'dragon-' + n + '-' + uid; };
      var defs = rg(I('skin'), [[0, '#ff9a7a'], [0.5, '#e0382a'], [1, '#961812']], 0.35, 0.3, 0.85) +
        lg(I('belly'), [[0, '#fff2b0'], [1, '#f0b24a']]) +
        lg(I('wing'), [[0, '#ffb070'], [1, '#e0582a']]) +
        lg(I('horn'), [[0, '#fffaf0'], [1, '#d4b680']], 0, 0, 1, 1);
      function spot(x, y, r) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#a3160f" opacity=".75"/>'; }
      var body =
        // wings (behind)
        '<g class="part-cape">' +
        '<path d="M122 100 Q138 42 184 12 Q172 36 188 56 Q170 58 172 80 Q154 78 154 100 Z" fill="url(#' + I('wing') + ')" ' + S(4) + '/>' +
        '<path d="M124 98 L182 16 M130 100 L186 56 M138 102 L170 80" stroke="#a82418" stroke-width="3.5" stroke-linecap="round"/>' +
        '<path d="M100 92 Q88 40 58 26 Q66 44 58 54 Q72 56 70 70 Q84 70 86 86 Z" fill="#d85026" ' + S(4) + '/>' +
        '<path d="M98 90 L60 28 M92 88 L62 54 M90 88 L72 70" stroke="#a82418" stroke-width="3" stroke-linecap="round"/>' +
        '</g>' +
        // tail
        '<path d="M140 162 Q176 172 180 146 Q182 132 172 126 Q170 146 150 146 Z" fill="url(#' + I('skin') + ')" ' + S(4) + '/>' +
        '<path d="M172 128 L186 108 L184 128 L196 136 L176 140 Z" fill="#a3160f" ' + S(3.5) + '/>' +
        // back spikes
        '<path d="M138 102 l14 -2 l-6 12 Z M148 120 l14 2 l-10 10 Z M152 140 l12 8 l-14 6 Z" fill="#ffd060" ' + S(3) + '/>' +
        // back leg
        '<path d="M130 160 Q150 160 150 176 L150 188 L118 188 Z" fill="#b8241a" ' + S(3.5) + '/>' +
        '<path d="M122 188 l-4 -5 M132 188 l-3 -5" stroke="#fff4dc" stroke-width="3" stroke-linecap="round"/>' +
        // body
        '<ellipse cx="112" cy="140" rx="46" ry="46" fill="url(#' + I('skin') + ')" ' + S(4) + '/>' +
        '<path d="M80 110 Q72 140 84 170 Q100 184 118 176 Q104 140 110 104 Q94 100 80 110 Z" fill="url(#' + I('belly') + ')" ' + S(3) + '/>' +
        '<path d="M80 122 Q94 118 108 118 M78 136 Q92 132 106 132 M80 150 Q94 146 108 148 M86 164 Q98 162 112 164" stroke="#c98a2a" stroke-width="2.5" fill="none"/>' +
        spot(132, 118, 6) + spot(146, 138, 5) + spot(128, 160, 7) + spot(142, 164, 3.5) + spot(124, 138, 3.5) +
        // front leg
        '<path d="M70 160 Q96 158 98 176 L98 189 L62 189 Q60 172 70 160 Z" fill="url(#' + I('skin') + ')" ' + S(3.5) + '/>' +
        '<path d="M64 189 l-3 -6 M74 189 l-3 -6 M84 189 l-3 -6" stroke="#fff4dc" stroke-width="3.5" stroke-linecap="round"/>' +
        '<path d="M64 189 l-3 -6 M74 189 l-3 -6 M84 189 l-3 -6" stroke="' + O + '" stroke-width="1" stroke-linecap="round" opacity=".3"/>' +
        // little arm
        '<path d="M86 128 Q66 132 62 144 Q72 148 88 140" fill="#d42e20" ' + S(3.5) + '/>' +
        '<path d="M62 142 l-6 -2 M62 146 l-6 2" stroke="#fff4dc" stroke-width="3" stroke-linecap="round"/>' +
        // head
        '<g class="part-head">' +
        '<path d="M96 42 Q112 18 140 12 Q124 26 118 50 Z" fill="url(#' + I('horn') + ')" ' + S(3.5) + '/>' +
        '<path d="M110 30 l6 5 M120 22 l5 6" stroke="#b89358" stroke-width="2"/>' +
        '<path d="M110 70 L130 62 L122 76 L136 80 L118 88 Z" fill="#ffd060" ' + S(3) + '/>' +
        '<ellipse cx="84" cy="70" rx="38" ry="34" fill="url(#' + I('skin') + ')" ' + S(4) + '/>' +
        '<path d="M70 42 Q76 20 96 12 Q86 28 88 44 Z" fill="url(#' + I('horn') + ')" ' + S(3.5) + '/>' +
        // snout
        '<path d="M60 66 Q26 60 14 76 Q12 96 30 100 Q52 104 70 96 Z" fill="url(#' + I('skin') + ')" ' + S(4) + '/>' +
        '<path d="M18 86 Q40 94 66 90" stroke="' + O + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M26 89 L28 96 L32 90 Z M50 91 L52 98 L56 91 Z" fill="#fff" ' + S(1.5) + '/>' +
        '<ellipse cx="22" cy="74" rx="3" ry="2" fill="' + O + '"/><ellipse cx="32" cy="72" rx="2.5" ry="1.8" fill="' + O + '"/>' +
        spot(96, 50, 5) + spot(108, 66, 4) + spot(100, 88, 3.5) + spot(46, 70, 3) +
        '<path d="M58 56 L80 62" stroke="' + O + '" stroke-width="5" stroke-linecap="round"/>' +
        '<g class="part-eyes"><ellipse cx="72" cy="68" rx="9" ry="8" fill="#ffe14a" ' + S(3) + '/><ellipse cx="70" cy="69" rx="2.5" ry="6" fill="' + O + '"/><circle cx="68" cy="65" r="1.6" fill="#fff"/></g>' +
        hl(88, 48, 10, 4, -20, 0.5) +
        // smoke
        '<circle cx="12" cy="64" r="5" fill="#d8d0cc" ' + S(2) + ' opacity=".9"/><circle cx="6" cy="54" r="3.5" fill="#d8d0cc" ' + S(2) + ' opacity=".8"/>' +
        '</g>';
      return wrap(defs, shadow(72, 112), body);
    }
  };

  /* ----------------------------------------------------------- DARKKNIGHT */
  E.darkknight = {
    name: 'Dark Knight',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'darkknight-' + n + '-' + uid; };
      var defs = lg(I('armor'), [[0, '#6a6f88'], [0.45, '#3a3e52'], [1, '#1c1e2a']], 0, 0, 1, 1) +
        lg(I('trim'), [[0, '#b8a0e0'], [1, '#6a4a9a']]) +
        lg(I('blade'), [[0, '#8a93a8'], [0.5, '#4a5064'], [1, '#262a36']], 0, 0, 1, 0) +
        lg(I('flame'), [[0, '#e8ffff'], [0.4, '#7ff3ff'], [1, '#16a8d8']], 0, 1, 0, 0) +
        rg(I('gem'), [[0, '#eaffd0'], [0.4, '#6bff5a'], [1, '#1a9a2a']], 0.4, 0.4, 0.6) +
        rg(I('halo'), [[0, '#7ff3ff', 0.7], [1, '#7ff3ff', 0]], 0.5, 0.5, 0.5) +
        rg(I('ghalo'), [[0, '#8aff6a', 0.8], [1, '#8aff6a', 0]], 0.5, 0.5, 0.5) +
        lg(I('cape'), [[0, '#5a1a3a'], [1, '#2a0a1c']]);
      var FL = 'M100 72 C70 72 66 48 76 32 C78 44 84 44 86 36 C84 22 94 12 106 4 C102 18 112 22 114 30 C116 24 118 20 122 16 C132 34 132 66 100 72 Z';
      var body =
        // cape
        '<path class="part-cape" d="M60 84 Q40 130 44 188 L60 180 L72 190 L88 178 L104 190 L120 180 L136 190 L150 180 L166 188 Q168 130 142 84 Z" fill="url(#' + I('cape') + ')" ' + S(4) + '/>' +
        // legs
        '<path d="M74 150 L70 178 L96 178 L98 150 Z" fill="url(#' + I('armor') + ')" ' + S(3.5) + '/>' +
        '<path d="M106 150 L106 178 L132 178 L130 150 Z" fill="#2a2d3c" ' + S(3.5) + '/>' +
        '<path d="M98 176 L66 176 Q56 182 56 190 L98 190 Z" fill="url(#' + I('armor') + ')" ' + S(3.5) + '/>' +
        '<path d="M136 176 L106 176 Q98 182 98 190 L136 190 Z" fill="#23252f" ' + S(3.5) + '/>' +
        '<ellipse cx="84" cy="160" rx="8" ry="6" fill="url(#' + I('trim') + ')" ' + S(2.5) + '/><ellipse cx="118" cy="160" rx="8" ry="6" fill="#5a4a7a" ' + S(2.5) + '/>' +
        // back pauldron/arm
        '<path d="M140 96 Q164 110 160 138" stroke="' + O + '" stroke-width="22" stroke-linecap="round" fill="none"/><path d="M140 96 Q164 110 160 138" stroke="#2e3142" stroke-width="15" stroke-linecap="round" fill="none"/>' +
        '<circle cx="160" cy="142" r="11" fill="#2a2d3c" ' + S(3.5) + '/>' +
        '<path d="M126 78 Q160 70 172 96 Q164 110 138 106 Z" fill="url(#' + I('armor') + ')" ' + S(4) + '/>' +
        '<path d="M150 76 L160 56 L162 82 Z M164 84 L180 72 L172 94 Z" fill="#2a2d3c" ' + S(3) + '/>' +
        // torso
        '<path d="M58 84 Q100 70 142 84 L136 128 Q128 150 100 154 Q72 150 64 128 Z" fill="url(#' + I('armor') + ')" ' + S(4) + '/>' +
        '<path d="M100 86 L100 102 M100 132 L100 150" stroke="#14151e" stroke-width="3"/>' +
        '<path d="M66 124 Q100 136 134 124" stroke="url(#' + I('trim') + ')" stroke-width="4" fill="none"/>' +
        '<path d="M68 136 Q100 148 132 136" stroke="#14151e" stroke-width="3" fill="none"/>' +
        '<path d="M70 92 Q84 86 96 88" stroke="#a8acc8" stroke-width="3" fill="none" opacity=".7" stroke-linecap="round"/>' +
        // chest gem (eye)
        '<circle cx="100" cy="114" r="22" fill="url(#' + I('ghalo') + ')"/>' +
        '<path d="M80 114 Q100 94 120 114 Q100 134 80 114 Z" fill="url(#' + I('trim') + ')" ' + S(3.5) + '/>' +
        '<path d="M86 114 Q100 100 114 114 Q100 128 86 114 Z" fill="url(#' + I('gem') + ')" ' + S(2.5) + '/>' +
        '<ellipse cx="100" cy="114" rx="2.5" ry="8" fill="#0a3a10"/><circle cx="96" cy="109" r="2" fill="#fff"/>' +
        // gorget
        '<path d="M76 82 Q100 72 124 82 L120 92 Q100 84 80 92 Z" fill="#23252f" ' + S(3.5) + '/>' +
        // ghost flame head
        '<g class="part-head">' +
        '<ellipse cx="100" cy="44" rx="40" ry="40" fill="url(#' + I('halo') + ')"/>' +
        '<path d="' + FL + '" fill="url(#' + I('flame') + ')" stroke="#0a5a7a" stroke-width="3" stroke-linejoin="round"/>' +
        '<path d="M100 66 C86 64 82 50 88 42 C92 50 96 48 98 42 C100 50 108 50 110 46 C114 56 110 64 100 66 Z" fill="#e8ffff" opacity=".8"/>' +
        '<g class="part-eyes"><path d="M84 46 L96 50 L94 56 Q86 56 84 46 Z" fill="#0a2a4a"/><path d="M116 46 L104 50 L106 56 Q114 56 116 46 Z" fill="#0a2a4a"/></g>' +
        '<circle cx="70" cy="30" r="2.5" fill="#bff9ff"/><circle cx="130" cy="42" r="2" fill="#bff9ff"/><circle cx="124" cy="10" r="1.8" fill="#bff9ff"/>' +
        '</g>' +
        // greatsword planted + front arm
        '<g class="part-weapon" style="transform-origin: 66px 92px">' +
        '<path d="M68 92 Q50 98 40 108" stroke="' + O + '" stroke-width="22" stroke-linecap="round" fill="none"/><path d="M68 92 Q50 98 40 108" stroke="#3a3e52" stroke-width="15" stroke-linecap="round" fill="none"/>' +
        '<path d="M88 78 Q56 58 38 80 Q46 98 74 96 Z" fill="url(#' + I('armor') + ')" ' + S(4) + '/>' +
        '<path d="M50 70 L40 48 L62 64 Z M66 64 L70 42 L80 68 Z" fill="#2a2d3c" ' + S(3) + '/>' +
        '<path d="M44 82 Q58 70 80 78" stroke="url(#' + I('trim') + ')" stroke-width="3" fill="none"/>' +
        '<path d="M22 132 L22 176 L35 194 L48 176 L48 132 Z" fill="url(#' + I('blade') + ')" ' + S(4) + '/>' +
        '<path d="M35 134 L35 180" stroke="#1a1c26" stroke-width="2"/>' +
        '<path d="M28 140 l3 4 l-3 4 M28 156 l3 4 l-3 4 M28 172 l3 4 l-3 4" stroke="#7ff3ff" stroke-width="2" fill="none"/>' +
        '<path d="M4 124 Q35 116 66 124 L64 134 Q35 126 6 134 Z" fill="url(#' + I('trim') + ')" ' + S(3.5) + '/>' +
        '<path d="M4 124 l-2 -8 l8 4 M66 124 l2 -8 l-8 4" fill="#6a4a9a" ' + S(2.5) + '/>' +
        '<rect x="30" y="92" width="10" height="32" fill="#2a1a2a" ' + S(3) + '/>' +
        '<path d="M35 76 L43 86 L35 96 L27 86 Z" fill="url(#' + I('gem') + ')" ' + S(3) + '/>' +
        '<rect x="22" y="100" width="28" height="20" rx="7" fill="url(#' + I('armor') + ')" ' + S(3.5) + '/>' +
        '<path d="M26 107 L46 107 M26 113 L46 113" stroke="#14151e" stroke-width="2"/>' +
        '<circle cx="40" cy="104" r="2" fill="#b8a0e0"/>' +
        '</g>';
      return wrap(defs, shadow(76, 102, 0.3), body);
    }
  };

  /* ------------------------------------------------------------ KINGSLIME */
  E.kingslime = {
    name: 'King Slime',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'kingslime-' + n + '-' + uid; };
      var P = 'M22 186 C6 186 6 162 18 138 C36 94 64 64 102 62 C140 64 166 94 182 138 C194 162 192 186 176 186 Z';
      var defs = rg(I('body'), [[0, '#f0d4ff'], [0.4, '#a966ea'], [1, '#5a2296']], 0.36, 0.3, 0.8) +
        lg(I('gold'), [[0, '#fff3a8'], [0.5, '#f5c230'], [1, '#b0780c']], 0, 0, 1, 1) +
        '<clipPath id="' + I('clip') + '"><path d="' + P + '"/></clipPath>';
      var body =
        // body
        '<path d="' + P + '" fill="url(#' + I('body') + ')" ' + S(4.5) + '/>' +
        '<g clip-path="url(#' + I('clip') + ')"><ellipse cx="118" cy="214" rx="110" ry="44" fill="#4a1686" opacity=".45"/>' +
        '<circle cx="150" cy="150" r="7" fill="#fff" opacity=".3"/><circle cx="164" cy="132" r="4" fill="#fff" opacity=".3"/><circle cx="40" cy="170" r="5" fill="#fff" opacity=".25"/></g>' +
        hl(58, 104, 20, 9, -40, 0.8) + hl(40, 128, 5, 7, 10, 0.6) +
        // crown
        '<g transform="translate(0 -2)">' +
        '<path d="M66 70 L60 30 L80 48 L90 22 L102 44 L114 22 L124 48 L144 30 L138 70 Q102 60 66 70 Z" fill="url(#' + I('gold') + ')" ' + S(3.5) + '/>' +
        '<path d="M64 64 Q102 52 140 64 L140 76 Q102 64 64 76 Z" fill="#d89a18" ' + S(3.5) + '/>' +
        '<circle cx="60" cy="28" r="4" fill="#fff3a8" ' + S(2.5) + '/><circle cx="90" cy="20" r="4" fill="#fff3a8" ' + S(2.5) + '/><circle cx="114" cy="20" r="4" fill="#fff3a8" ' + S(2.5) + '/><circle cx="144" cy="28" r="4" fill="#fff3a8" ' + S(2.5) + '/>' +
        '<path d="M102 38 L108 48 L102 56 L96 48 Z" fill="#ff3a5a" ' + S(2.5) + '/>' +
        '<circle cx="78" cy="68" r="4" fill="#3ad0ff" ' + S(2) + '/><circle cx="102" cy="64" r="4.5" fill="#4aff7a" ' + S(2) + '/><circle cx="126" cy="68" r="4" fill="#3ad0ff" ' + S(2) + '/>' +
        '<path d="M70 50 L74 62 M84 40 Q86 36 88 32" stroke="#fff" stroke-width="2.5" opacity=".75" stroke-linecap="round"/>' +
        '</g>' +
        // face
        '<path d="M58 108 L80 112 M104 112 L124 106" stroke="' + O + '" stroke-width="4.5" stroke-linecap="round"/>' +
        '<g class="part-eyes">' + eye(70, 124, 9, 12) + eye(112, 124, 9, 12) + '</g>' +
        '<path d="M60 116 Q70 112 80 116 M102 116 Q112 112 122 116" stroke="#5a2296" stroke-width="0"/>' +
        blush(54, 144, 9) + blush(130, 144, 9) +
        // mustache + grin
        '<path d="M92 142 Q78 136 66 146 Q76 140 80 146 Q88 150 92 146 Q96 150 104 146 Q108 140 118 146 Q106 136 92 142 Z" fill="#3a1a5a" ' + S(2.5) + '/>' +
        '<path d="M78 152 Q92 168 108 152 Q92 158 78 152 Z" fill="#6a1a3a" ' + S(3) + '/>' +
        // scepter held by a pseudopod
        '<g class="part-weapon" style="transform-origin: 36px 150px">' +
        '<path d="M38 150 L18 58" stroke="' + O + '" stroke-width="11" stroke-linecap="round"/>' +
        '<path d="M38 150 L18 58" stroke="url(#' + I('gold') + ')" stroke-width="5" stroke-linecap="round"/>' +
        '<path d="M24 82 l6 -2 M28 102 l6 -2 M32 122 l6 -2" stroke="#b0780c" stroke-width="2.5"/>' +
        '<circle cx="16" cy="48" r="12" fill="#ff3a5a" ' + S(3.5) + '/><circle cx="12" cy="44" r="4" fill="#fff" opacity=".8"/>' +
        '<path d="M6 58 Q16 64 26 58 L24 64 Q16 68 8 64 Z" fill="url(#' + I('gold') + ')" ' + S(2.5) + '/>' +
        '<path d="M16 36 L16 26 M11 30 L21 30" stroke="' + O + '" stroke-width="6" stroke-linecap="round"/><path d="M16 36 L16 26 M11 30 L21 30" stroke="#f5c230" stroke-width="2.5" stroke-linecap="round"/>' +
        '<path d="M50 150 Q32 146 28 130 Q40 124 46 134 Q52 142 56 142" fill="#a966ea" ' + S(3.5) + '/>' +
        '</g>';
      return wrap(defs, shadow(84), body);
    }
  };

  /* ----------------------------------------------------------------- YETI */
  E.yeti = {
    name: 'Yeti',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'yeti-' + n + '-' + uid; };
      var defs = rg(I('fur'), [[0, '#ffffff'], [0.6, '#e4eef8'], [1, '#a9c0da']], 0.38, 0.3, 0.8) +
        rg(I('skin'), [[0, '#b8d6f2'], [1, '#5a86b8']], 0.4, 0.35, 0.8) +
        lg(I('horn'), [[0, '#f4efe6'], [1, '#8a8a9a']], 0, 0, 1, 1);
      var body =
        // back arm
        '<path d="' + fluff(160, 128, 20, 36, 10, 0.14, 0.3) + '" fill="#cfdeee" ' + S(3.5) + '/>' +
        '<ellipse cx="164" cy="166" rx="16" ry="13" fill="#6a94c4" ' + S(3.5) + '/>' +
        // body (head+torso)
        '<path d="' + fluff(104, 118, 62, 60, 18, 0.1, 0.1) + '" fill="url(#' + I('fur') + ')" ' + S(4.5) + '/>' +
        '<path d="M70 150 q6 6 12 0 M110 160 q6 6 12 0 M136 128 q6 6 12 0 M90 170 q6 5 10 0" stroke="#a9c0da" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        // feet
        '<path d="M58 190 Q56 172 78 172 Q96 172 96 190 Z" fill="url(#' + I('skin') + ')" ' + S(3.5) + '/>' +
        '<path d="M108 190 Q106 172 128 172 Q146 172 146 190 Z" fill="#6a94c4" ' + S(3.5) + '/>' +
        '<path d="M66 190 l0 -6 M76 190 l0 -7 M86 190 l0 -6 M118 190 l0 -6 M128 190 l0 -7 M138 190 l0 -6" stroke="' + O + '" stroke-width="2"/>' +
        // horns
        '<path d="M66 70 Q46 56 50 30 Q60 46 78 58 Z" fill="url(#' + I('horn') + ')" ' + S(3.5) + '/>' +
        '<path d="M130 62 Q146 44 140 22 Q134 40 118 54 Z" fill="url(#' + I('horn') + ')" ' + S(3.5) + '/>' +
        '<path d="M54 44 l7 -2 M58 54 l7 -2 M138 36 l-7 -2 M134 46 l-7 -2" stroke="#8a8a9a" stroke-width="2"/>' +
        // face
        '<path d="M56 100 Q56 72 90 72 Q124 72 124 100 Q124 132 90 134 Q56 132 56 100 Z" fill="url(#' + I('skin') + ')" ' + S(4) + '/>' +
        '<path d="' + fluff(92, 70, 30, 10, 8, 0.4, 3.14) + '" fill="#fff" ' + S(3) + '/>' +
        '<path d="M64 88 L84 94 M100 94 L118 86" stroke="' + O + '" stroke-width="5" stroke-linecap="round"/>' +
        '<g class="part-eyes">' + eye(76, 102, 6.5, 8) + eye(106, 102, 6.5, 8) + '</g>' +
        '<ellipse cx="90" cy="112" rx="5" ry="3" fill="#2a4a7a"/>' +
        '<path d="M68 118 Q90 132 114 118 Q90 128 68 118 Z" fill="#2a1a3a" ' + S(3) + '/>' +
        '<path d="M72 121 L74 111 L78 122 Z M104 122 L108 111 L110 120 Z" fill="#fff" ' + S(2) + '/>' +
        hl(72, 80, 8, 3, -20, 0.5) +
        // front arm raised fist
        '<g class="part-weapon" style="transform-origin: 60px 120px">' +
        '<path d="' + fluff(44, 128, 20, 34, 10, 0.14, 0.2) + '" fill="url(#' + I('fur') + ')" ' + S(3.5) + '/>' +
        '<path d="M28 160 Q24 146 40 144 Q58 142 60 158 Q60 174 44 176 Q28 176 28 160 Z" fill="url(#' + I('skin') + ')" ' + S(3.5) + '/>' +
        '<path d="M34 152 q4 -2 8 0 M34 160 q4 -2 8 0 M34 168 q4 -2 8 0" stroke="' + O + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
        '</g>' +
        // frost sparkles
        '<path d="M170 60 l0 12 M164 66 l12 0 M166 62 l8 8 M174 62 l-8 8" stroke="#bfe4ff" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M22 70 l0 8 M18 74 l8 0" stroke="#bfe4ff" stroke-width="2" stroke-linecap="round"/>';
      return wrap(defs, shadow(80, 104), body);
    }
  };

  window.ENEMIES = window.ENEMIES || {};
  Object.keys(E).forEach(function (k) { window.ENEMIES[k] = E[k]; });
})();

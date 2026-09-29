/* Hero Go! — Chapter 7 "Crystal Caverns" art. Adds to window.ENEMIES / window.SCENES.
 * Enemies: viewBox 0 0 200 200, feet y≈190, FACE LEFT. Scene: viewBox 0 0 400 300.
 * Keys: gemslime, cavespider, shardbat, mimic (elite), colossus (boss); scene: crystal.
 */
(function () {
  'use strict';
  var O = '#2b1d14';

  function S(w) { return 'stroke="' + O + '" stroke-width="' + (w || 4) + '" stroke-linejoin="round" stroke-linecap="round"'; }
  function f(n) { return Math.round(n * 10) / 10; }
  function stops(a) { return a.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join(''); }
  function lg(id, a, x1, y1, x2, y2) {
    return '<linearGradient id="' + id + '" x1="' + (x1 == null ? 0 : x1) + '" y1="' + (y1 == null ? 0 : y1) + '" x2="' + (x2 == null ? 0 : x2) + '" y2="' + (y2 == null ? 1 : y2) + '">' + stops(a) + '</linearGradient>';
  }
  function rg(id, a, cx, cy, r) {
    return '<radialGradient id="' + id + '" cx="' + (cx == null ? 0.5 : cx) + '" cy="' + (cy == null ? 0.5 : cy) + '" r="' + (r == null ? 0.6 : r) + '">' + stops(a) + '</radialGradient>';
  }
  function shadow(rx, cx, op) {
    cx = cx == null ? 100 : cx;
    return '<g class="part-shadow"><ellipse cx="' + cx + '" cy="190" rx="' + rx + '" ry="' + (4 + rx * 0.1).toFixed(1) + '" fill="#000" opacity="' + (op == null ? 0.28 : op) + '"/></g>';
  }
  function wrap(defs, sh, body) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs>' + defs + '</defs>' + sh + '<g class="part-body">' + body + '</g></svg>';
  }
  function eye(x, y, rx, ry, col) {
    var s = '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + O + '"/>';
    if (col) s += '<ellipse cx="' + (x - rx * 0.15) + '" cy="' + (y + ry * 0.2) + '" rx="' + f(rx * 0.68) + '" ry="' + f(ry * 0.62) + '" fill="' + col + '"/>';
    s += '<ellipse cx="' + f(x - rx * 0.32) + '" cy="' + f(y - ry * 0.36) + '" rx="' + f(rx * 0.42) + '" ry="' + f(ry * 0.32) + '" fill="#fff"/>';
    s += '<circle cx="' + f(x + rx * 0.35) + '" cy="' + f(y + ry * 0.4) + '" r="' + f(rx * 0.18) + '" fill="#fff" opacity=".85"/>';
    return s;
  }
  function hl(x, y, rx, ry, rot, op) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" transform="rotate(' + (rot || 0) + ' ' + x + ' ' + y + ')" fill="#fff" opacity="' + (op == null ? 0.7 : op) + '"/>'; }
  function fluff(cx, cy, rx, ry, n, b, a0) {
    a0 = a0 || 0;
    var pts = [], i, d;
    for (i = 0; i <= n; i++) { var a = a0 + i * 2 * Math.PI / n; pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
    d = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]);
    for (i = 0; i < n; i++) {
      var am = a0 + (i + 0.5) * 2 * Math.PI / n;
      d += ' Q' + f(cx + rx * (1 + b) * Math.cos(am)) + ' ' + f(cy + ry * (1 + b) * Math.sin(am)) + ' ' + f(pts[i + 1][0]) + ' ' + f(pts[i + 1][1]);
    }
    return d + 'Z';
  }
  // 4-point sparkle star
  function spark(x, y, r, col, op) {
    return '<path d="M' + x + ' ' + f(y - r) + 'Q' + x + ' ' + y + ' ' + f(x + r) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + f(y + r) + 'Q' + x + ' ' + y + ' ' + f(x - r) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + f(y - r) + 'Z" fill="' + (col || '#fff') + '"' + (op != null ? ' opacity="' + op + '"' : '') + '/>';
  }
  function poly(pts, fill, extra) { return '<polygon points="' + pts + '" fill="' + fill + '" ' + (extra || '') + '/>'; }
  // faceted crystal prism. cols = [light, mid, dark]; base at (x,y), pointing "up" then rotated.
  function shard(x, y, w, h, rot, cols, sw) {
    var a = w / 2, s = sw == null ? 2.5 : sw;
    var out = f(-a) + ',0 ' + f(-a) + ',' + f(-h * 0.7) + ' 0,' + f(-h) + ' ' + f(a) + ',' + f(-h * 0.7) + ' ' + f(a) + ',0';
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ')">' +
      poly(out, cols[1]) +
      poly(f(-a) + ',0 ' + f(-a) + ',' + f(-h * 0.7) + ' 0,' + f(-h) + ' ' + f(-w * 0.06) + ',' + f(-h * 0.12), cols[0]) +
      poly(f(a) + ',0 ' + f(a) + ',' + f(-h * 0.7) + ' 0,' + f(-h) + ' ' + f(w * 0.16) + ',' + f(-h * 0.1), cols[2]) +
      poly(f(-a) + ',' + f(-h * 0.7) + ' 0,' + f(-h) + ' ' + f(a) + ',' + f(-h * 0.7) + ' 0,' + f(-h * 0.6), '#fff', 'opacity=".38"') +
      '<polygon points="' + out + '" fill="none" ' + S(s) + '/>' +
      '<path d="M' + f(-a * 0.55) + ' ' + f(-h * 0.2) + 'L' + f(-a * 0.55) + ' ' + f(-h * 0.55) + '" stroke="#fff" stroke-width="' + f(Math.max(1.2, w * 0.1)) + '" stroke-linecap="round" opacity=".85"/>' +
      '</g>';
  }
  var AM = ['#e6bcff', '#a44be8', '#5e239e'];
  var EM = ['#c4ffd8', '#2fd67a', '#11784a'];
  var SA = ['#c8ecff', '#3f8fee', '#1f3f9a'];
  var RS = ['#ffd0f0', '#ee5cc0', '#8e2a86'];

  var E = window.ENEMIES = window.ENEMIES || {};

  /* ------------------------------------------------------------- GEM SLIME */
  E.gemslime = {
    name: 'Gem Slime',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'gemslime-' + n + '-' + uid; };
      var P = 'M36 187 C22 187 22 166 30 150 C42 120 64 100 94 96 C126 94 154 116 168 150 C176 166 176 187 162 187 Z';
      var defs = rg(I('body'), [[0, '#b6f4ff'], [0.35, '#4fa4f0'], [1, '#2a3aa6']], 0.34, 0.3, 0.85) +
        rg(I('core'), [[0, '#ffffff'], [0.35, '#ff9af0'], [1, '#a03ad8']], 0.4, 0.35, 0.7) +
        rg(I('halo'), [[0, '#ff9af0', 0.75], [1, '#ff9af0', 0]], 0.5, 0.5, 0.5) +
        '<clipPath id="' + I('clip') + '"><path d="' + P + '"/></clipPath>';
      var body =
        // back shards poking through the top
        shard(66, 122, 16, 34, -32, SA) + shard(100, 104, 20, 44, 4, AM) + shard(138, 116, 16, 34, 30, EM) +
        '<path d="' + P + '" fill="url(#' + I('body') + ')" ' + S(4) + '/>' +
        '<g clip-path="url(#' + I('clip') + ')">' +
        '<ellipse cx="110" cy="210" rx="90" ry="38" fill="#1c2a86" opacity=".5"/>' +
        '<path d="M156 118 Q176 150 164 186" stroke="#1c2a86" stroke-width="12" fill="none" opacity=".4"/>' +
        '<path d="M30 160 L60 130 L70 172 Z M120 186 L150 150 L170 186 Z" fill="#fff" opacity=".08"/>' +
        '<circle cx="42" cy="176" r="3" fill="#fff" opacity=".35"/><circle cx="52" cy="166" r="2" fill="#fff" opacity=".35"/>' +
        '</g>' +
        hl(58, 128, 14, 7, -40, 0.8) + hl(44, 144, 3.5, 5, 0, 0.6) +
        // faceted core
        '<circle cx="128" cy="152" r="26" fill="url(#' + I('halo') + ')"/>' +
        '<polygon points="128,128 146,140 146,162 128,178 110,162 110,140" fill="url(#' + I('core') + ')" ' + S(3) + '/>' +
        poly('128,128 146,140 128,152 110,140', '#fff', 'opacity=".55"') +
        poly('146,140 146,162 128,178 128,152', '#7a1ea8', 'opacity=".45"') +
        '<path d="M110 140 L128 152 L146 140 M128 152 L128 178" stroke="' + O + '" stroke-width="1.6" fill="none" opacity=".6"/>' +
        spark(120, 140, 5, '#fff', 0.95) +
        // embedded gem shards with sockets
        '<ellipse cx="156" cy="176" rx="9" ry="3.5" fill="#1c2a86" opacity=".7"/>' + shard(156, 176, 14, 26, 14, EM, 2.2) +
        '<ellipse cx="46" cy="180" rx="8" ry="3" fill="#1c2a86" opacity=".7"/>' + shard(46, 180, 12, 22, -16, RS, 2.2) +
        '<ellipse cx="88" cy="112" rx="7" ry="3" fill="#1c2a86" opacity=".6"/>' + shard(92, 118, 10, 18, 20, AM, 2) +
        '<polygon points="70,178 76,172 82,178 76,184" fill="#ffe27a" ' + S(1.8) + '/>' +
        // face
        '<path d="M56 128 L82 138 M102 138 L114 126" stroke="' + O + '" stroke-width="5" stroke-linecap="round"/>' +
        '<g class="part-eyes" style="transform-origin: 82px 148px">' + eye(68, 150, 8, 11, '#ffe45a') + eye(98, 150, 8, 11, '#ffe45a') + '</g>' +
        '<path d="M64 168 L70 175 L76 168 L82 176 L88 168 L94 175 L100 167 Q82 160 64 168 Z" fill="#fff" ' + S(2.6) + '/>' +
        '<path d="M63 167 Q82 158 101 166" fill="none" ' + S(3.5) + '/>' +
        '<path d="M62 158 l-6 -3 M104 158 l6 -3" stroke="#1c2a86" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>';
      return wrap(defs, shadow(66), body);
    }
  };

  /* ------------------------------------------------------------ CAVE SPIDER */
  E.cavespider = {
    name: 'Cave Spider',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'cavespider-' + n + '-' + uid; };
      var defs = rg(I('fur'), [[0, '#8a62b8'], [0.5, '#4a2c70'], [1, '#1e1030']], 0.38, 0.3, 0.85) +
        rg(I('glow'), [[0, '#ff6ae8', 0.85], [1, '#ff6ae8', 0]], 0.5, 0.5, 0.5) +
        rg(I('cy'), [[0, '#ffffff'], [0.4, '#7ffcff'], [1, '#1aa8d8']], 0.4, 0.4, 0.6);
      function leg(pts, col, w) {
        var d = 'M' + pts.map(function (p) { return p[0] + ' ' + p[1]; }).join(' L');
        return '<path d="' + d + '" fill="none" stroke="' + O + '" stroke-width="' + (w + 5) + '" stroke-linejoin="round" stroke-linecap="round"/>' +
          '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-linejoin="round" stroke-linecap="round"/>';
      }
      var far = [[[92, 130], [70, 82], [40, 186]], [[100, 128], [96, 74], [72, 188]], [[126, 126], [136, 76], [116, 188]], [[142, 130], [172, 92], [152, 186]]];
      var near = [[[70, 142], [26, 98], [10, 186]], [[82, 148], [46, 112], [42, 189]], [[104, 156], [90, 112], [92, 190]], [[126, 152], [130, 108], [138, 190]]];
      var body = '';
      far.forEach(function (l) { body += leg(l, '#2a1844', 7); body += shard(l[1][0], l[1][1], 7, 14, l[1][0] < l[0][0] ? -30 : 30, AM, 1.8); });
      // abdomen
      body += '<path d="' + fluff(140, 128, 36, 32, 14, 0.09) + '" fill="url(#' + I('fur') + ')" ' + S(4) + '/>';
      body += shard(122, 104, 12, 30, -14, AM) + shard(142, 98, 14, 38, 6, SA) + shard(162, 108, 12, 28, 26, RS);
      body += '<path d="M116 122 Q140 108 166 122 M112 138 Q140 124 170 138 M118 152 Q142 142 166 152" stroke="#c48aff" stroke-width="2.4" fill="none" opacity=".5" stroke-linecap="round"/>';
      body += '<path d="M130 128 l10 -8 l10 8 l-10 14 Z" fill="#ff6ae8" opacity=".85" ' + S(2) + '/>' + hl(130, 108, 8, 4, -20, 0.35);
      near.forEach(function (l) { body += leg(l, '#5a3a82', 8); body += '<path d="M' + l[1][0] + ' ' + l[1][1] + ' L' + l[2][0] + ' ' + l[2][1] + '" stroke="#a884d8" stroke-width="2" stroke-linecap="round" opacity=".5" transform="translate(-1 0)"/>' + shard(l[1][0], l[1][1], 8, 17, l[1][0] < l[0][0] ? -34 : 34, l[1][0] < 60 ? SA : EM, 2); });
      // cephalothorax
      body += '<path d="' + fluff(84, 138, 28, 24, 12, 0.1) + '" fill="url(#' + I('fur') + ')" ' + S(4) + '/>';
      body += hl(70, 124, 9, 4, -30, 0.35);
      // fangs + palps
      body += '<path d="M62 152 Q54 164 58 174 Q66 166 68 154 Z" fill="#f4f0ff" ' + S(3) + '/>' +
        '<path d="M78 156 Q72 168 78 178 Q86 168 84 156 Z" fill="#f4f0ff" ' + S(3) + '/>' +
        '<path d="M60 160 Q58 166 59 170" stroke="#9fd0ff" stroke-width="2" fill="none"/>' +
        '<path d="M56 146 Q46 150 46 160 M92 152 Q96 162 90 168" stroke="' + O + '" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M56 146 Q46 150 46 160 M92 152 Q96 162 90 168" stroke="#5a3a82" stroke-width="4.5" fill="none" stroke-linecap="round"/>';
      // eyes
      body += '<circle cx="72" cy="128" r="18" fill="url(#' + I('glow') + ')"/>' +
        '<path d="M56 120 L78 126" stroke="' + O + '" stroke-width="4.5" stroke-linecap="round"/>' +
        '<g class="part-eyes" style="transform-origin: 74px 132px">' +
        '<circle cx="68" cy="134" r="7.5" fill="' + O + '"/><circle cx="68" cy="134" r="5.6" fill="#ff4fd8"/><circle cx="66" cy="132" r="2" fill="#fff"/>' +
        '<circle cx="84" cy="130" r="6" fill="' + O + '"/><circle cx="84" cy="130" r="4.5" fill="#7ffcff"/><circle cx="82.6" cy="128.6" r="1.6" fill="#fff"/>' +
        '<circle cx="58" cy="140" r="4" fill="' + O + '"/><circle cx="58" cy="140" r="2.8" fill="#ff4fd8"/>' +
        '<circle cx="76" cy="121" r="3.6" fill="' + O + '"/><circle cx="76" cy="121" r="2.5" fill="#7ffcff"/>' +
        '<circle cx="90" cy="120" r="3" fill="' + O + '"/><circle cx="90" cy="120" r="2" fill="#ff4fd8"/>' +
        '<circle cx="96" cy="130" r="2.6" fill="' + O + '"/><circle cx="96" cy="130" r="1.7" fill="#7ffcff"/>' +
        '</g>';
      return wrap(defs, shadow(78, 92), body);
    }
  };

  /* -------------------------------------------------------------- SHARD BAT */
  E.shardbat = {
    name: 'Shard Bat',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'shardbat-' + n + '-' + uid; };
      var defs = rg(I('body'), [[0, '#8a80e0'], [0.5, '#4a3aa0'], [1, '#231a5a']], 0.35, 0.3, 0.85) +
        lg(I('wing'), [[0, '#e0f8ff', 0.85], [0.5, '#8ad0ff', 0.7], [1, '#8a70ff', 0.65]], 0, 0, 1, 1) +
        rg(I('glow'), [[0, '#ff5a6a', 0.85], [1, '#ff5a6a', 0]], 0.5, 0.5, 0.5);
      var W = [[88, 100], [58, 60], [22, 46], [6, 44], [14, 70], [4, 92], [22, 100], [10, 124], [34, 122], [58, 130], [86, 122]];
      var mir = function (a) { return a.map(function (p) { return [200 - p[0], p[1]]; }); };
      function wing(pts, tip) {
        var pp = pts.map(function (p) { return p.join(','); }).join(' ');
        var s = '<polygon points="' + pp + '" fill="url(#' + I('wing') + ')" ' + S(3.5) + '/>';
        // struts
        s += '<path d="M' + pts[0].join(' ') + ' L' + pts[3].join(' ') + ' M' + pts[0].join(' ') + ' L' + pts[5].join(' ') + ' M' + pts[0].join(' ') + ' L' + pts[7].join(' ') + ' M' + pts[0].join(' ') + ' L' + pts[9].join(' ') + '" stroke="' + O + '" stroke-width="3" stroke-linecap="round" fill="none"/>';
        s += '<path d="M' + pts[0].join(' ') + ' L' + pts[3].join(' ') + '" stroke="#bfefff" stroke-width="1.2" fill="none" opacity=".8" transform="translate(0 -1.5)"/>';
        // facets
        s += poly(pts[1].join(',') + ' ' + pts[2].join(',') + ' ' + pts[3].join(',') + ' ' + pts[0].join(','), '#fff', 'opacity=".28"');
        s += poly(pts[5].join(',') + ' ' + pts[6].join(',') + ' ' + pts[7].join(',') + ' ' + pts[0].join(','), '#5a30c0', 'opacity=".22"');
        s += spark(pts[2][0] + (tip ? -6 : 6), pts[2][1] + 12, 4, '#fff', 0.95);
        s += '<circle cx="' + pts[3][0] + '" cy="' + pts[3][1] + '" r="2.4" fill="#fff" ' + S(1.5) + '/>';
        return s;
      }
      var body =
        '<g class="part-cape" style="transform-origin: 100px 104px">' + wing(W, 1) + wing(mir(W), 0) + '</g>' +
        // ears (crystal)
        '<path d="M76 84 L64 34 L98 72 Z" fill="#4a3aa0" ' + S(3.5) + '/><path d="M78 76 L70 48 L90 70 Z" fill="#8ad0ff"/><path d="M64 34 L70 48 L74 46 Z" fill="#fff" opacity=".7"/>' +
        '<path d="M108 74 L132 38 L128 86 Z" fill="#3a2c88" ' + S(3.5) + '/><path d="M112 74 L128 50 L124 78 Z" fill="#6ac0f0"/>' +
        // feet
        '<path d="M88 132 l-4 12 M94 134 l0 12 M108 134 l0 12 M114 132 l4 12" stroke="' + O + '" stroke-width="3.2" stroke-linecap="round"/>' +
        // body
        '<ellipse cx="100" cy="106" rx="34" ry="33" fill="url(#' + I('body') + ')" ' + S(4) + '/>' +
        '<path d="M80 128 Q100 108 124 128 Q100 138 80 128 Z" fill="#8f86ea" opacity=".55"/>' +
        // chest crystal + back shards
        shard(114, 78, 10, 22, 18, SA, 2) + shard(124, 86, 8, 16, 40, AM, 1.8) +
        '<polygon points="102,116 110,122 102,132 94,122" fill="#7ffcff" ' + S(2.4) + '/><path d="M94 122 L110 122 M102 116 L102 132" stroke="#fff" stroke-width="1.2" opacity=".7"/>' +
        hl(80, 86, 10, 5, -35, 0.55) +
        '<circle cx="86" cy="100" r="16" fill="url(#' + I('glow') + ')"/><circle cx="114" cy="100" r="14" fill="url(#' + I('glow') + ')"/>' +
        '<path d="M72 92 L92 100 M110 100 L124 92" stroke="' + O + '" stroke-width="4.5" stroke-linecap="round"/>' +
        '<g class="part-eyes" style="transform-origin: 100px 102px">' + eye(84, 104, 7, 8.5, '#ff4a5c') + eye(114, 104, 6.5, 8, '#ff4a5c') + '</g>' +
        '<path d="M88 118 Q98 124 108 118" fill="none" ' + S(3) + '/>' +
        '<path d="M90 118 L92 127 L96 120 Z M102 120 L106 128 L108 118 Z" fill="#fff" ' + S(1.8) + '/>';
      return wrap(defs, shadow(28, 100, 0.16), body);
    }
  };

  /* -------------------------------------------------------- TREASURE MIMIC */
  E.mimic = {
    name: 'Treasure Mimic',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'mimic-' + n + '-' + uid; };
      var defs = lg(I('wood'), [[0, '#c98a4a'], [0.5, '#9a5a28'], [1, '#623414']]) +
        lg(I('wood2'), [[0, '#a86c34'], [1, '#54290e']]) +
        lg(I('iron'), [[0, '#c9d0da'], [0.5, '#7a8494'], [1, '#3e4652']]) +
        lg(I('gold'), [[0, '#fff3a0'], [0.5, '#ffc93a'], [1, '#c8801a']], 0, 0, 1, 1) +
        rg(I('dark'), [[0, '#3a1440'], [0.6, '#170822'], [1, '#08030e']], 0.5, 0.4, 0.7) +
        lg(I('tongue'), [[0, '#ff8aa8'], [1, '#c22a5a']]) +
        rg(I('eg'), [[0, '#fff36a', 0.85], [1, '#fff36a', 0]], 0.5, 0.5, 0.5) +
        rg(I('gl'), [[0, '#ffe27a', 0.55], [1, '#ffe27a', 0]], 0.5, 0.5, 0.5);
      function tooth(x, y, w, h, up) { return '<path d="M' + f(x - w / 2) + ' ' + y + ' L' + x + ' ' + f(y + (up ? -h : h)) + ' L' + f(x + w / 2) + ' ' + y + ' Z" fill="#fffbe8" ' + S(2.2) + '/>'; }
      function coin(x, y, r, rot) { return '<g transform="translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ')"><ellipse rx="' + r + '" ry="' + f(r * 0.72) + '" fill="url(#' + I('gold') + ')" ' + S(2) + '/><ellipse rx="' + f(r * 0.5) + '" ry="' + f(r * 0.34) + '" fill="none" stroke="#c8801a" stroke-width="1.3"/></g>'; }
      var body =
        '<g transform="rotate(-4 100 150)">' +
        // lid outer shell
        '<path d="M34 96 C28 44 62 14 106 14 C150 14 180 46 176 96 Z" fill="url(#' + I('wood2') + ')" ' + S(4.5) + '/>' +
        // lid inner (dark maw roof)
        '<path d="M46 94 C42 54 68 28 106 28 C144 28 168 56 164 94 Z" fill="url(#' + I('dark') + ')" ' + S(3.5) + '/>' +
        '<path d="M60 40 Q76 30 96 30" stroke="#7a3a98" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/>' +
        // lid ribs / iron rim
        '<path d="M34 96 C28 44 62 14 106 14 C150 14 180 46 176 96" fill="none" stroke="url(#' + I('iron') + ')" stroke-width="5"/>' +
        '<path d="M34 96 C28 44 62 14 106 14 C150 14 180 46 176 96" fill="none" ' + S(1.4) + ' opacity=".5"/>' +
        [42, 70, 106, 142, 170].map(function (x, i) { var y = [70, 32, 20, 30, 64][i]; return '<circle cx="' + (x < 100 ? x - 6 : x + 6) + '" cy="' + (y - 2 + (i === 2 ? 0 : 2)) + '" r="3" fill="#dfe6ee" ' + S(1.6) + '/>'; }).join('') +
        // maw glow behind eyes
        '<ellipse cx="86" cy="82" rx="20" ry="12" fill="url(#' + I('eg') + ')"/><ellipse cx="124" cy="82" rx="18" ry="11" fill="url(#' + I('eg') + ')"/>' +
        '<path d="M66 66 L94 78 M138 66 L112 78" stroke="' + O + '" stroke-width="5" stroke-linecap="round"/>' +
        '<g class="part-eyes" style="transform-origin: 105px 84px">' +
        '<path d="M68 80 Q80 70 96 82 Q86 94 72 90 Z" fill="#fff36a" ' + S(2.6) + '/><ellipse cx="82" cy="83" rx="3" ry="6" fill="' + O + '"/><circle cx="79" cy="80" r="1.8" fill="#fff"/>' +
        '<path d="M136 80 Q126 70 112 82 Q120 94 134 90 Z" fill="#fff36a" ' + S(2.6) + '/><ellipse cx="121" cy="83" rx="3" ry="6" fill="' + O + '"/><circle cx="118" cy="80" r="1.8" fill="#fff"/>' +
        '</g>' +
        // upper teeth
        [52, 66, 80, 94, 108, 122, 136, 150, 162].map(function (x, i) { return tooth(x, 96, 11, i % 2 ? 15 : 20, false); }).join('') +
        // dark gap
        '<path d="M44 96 L166 96 L172 120 L38 120 Z" fill="url(#' + I('dark') + ')"/>' +
        // tongue lolling out left
        '<path d="M120 116 C96 108 66 112 44 122 C24 130 12 124 10 136 C8 148 24 152 32 144 C44 132 66 136 96 132 L128 126 Z" fill="url(#' + I('tongue') + ')" ' + S(3.5) + '/>' +
        '<path d="M16 138 Q28 136 40 128" stroke="#ff2a5a" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M60 122 Q80 118 100 122" stroke="#ff9ab8" stroke-width="2.4" fill="none" opacity=".8" stroke-linecap="round"/>' +
        '<path d="M22 150 Q22 158 24 164" stroke="#bfefff" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="24" cy="167" rx="2.6" ry="3.6" fill="#bfefff" ' + S(1.4) + '/>' +
        // treasure spilling inside
        coin(152, 118, 9, -10) + coin(138, 112, 8, 20) + '<polygon points="122,112 130,104 138,112 130,120" fill="#7ff0ff" ' + S(2) + '/>' +
        // base
        '<path d="M32 118 L178 118 L172 184 L38 184 Z" fill="url(#' + I('wood') + ')" ' + S(4.5) + '/>' +
        '<path d="M34 138 L176 138 M36 160 L174 160" stroke="#5a2e10" stroke-width="2.6" opacity=".65"/>' +
        '<path d="M50 126 L54 180 M92 126 L94 180 M128 126 L128 180" stroke="#7a4218" stroke-width="1.6" opacity=".7"/>' +
        '<path d="M42 124 L100 124" stroke="#f0c07a" stroke-width="3" opacity=".7" stroke-linecap="round"/>' +
        // lower teeth
        [46, 60, 74, 88, 102, 116, 130, 144, 158, 170].map(function (x, i) { return tooth(x, 118, 11, i % 2 ? 12 : 17, true); }).join('') +
        // iron bands
        '<path d="M52 118 L48 184 L66 184 L68 118 Z M142 118 L144 184 L162 184 L160 118 Z" fill="url(#' + I('iron') + ')" ' + S(3.5) + '/>' +
        [128, 148, 168].map(function (y) { return '<circle cx="58" cy="' + y + '" r="2.6" fill="#e6edf4" ' + S(1.5) + '/><circle cx="152" cy="' + y + '" r="2.6" fill="#e6edf4" ' + S(1.5) + '/>'; }).join('') +
        '<path d="M56 124 L54 178 M147 124 L148 178" stroke="#fff" stroke-width="2" opacity=".55" stroke-linecap="round"/>' +
        // lock plate (gold) + keyhole eye
        '<rect x="84" y="140" width="40" height="34" rx="6" fill="url(#' + I('gold') + ')" ' + S(3.5) + '/>' +
        '<circle cx="104" cy="154" r="5.5" fill="' + O + '"/><path d="M101 156 L107 156 L108 168 L100 168 Z" fill="' + O + '"/>' +
        '<circle cx="90" cy="146" r="2" fill="#fff8c0" ' + S(1.2) + '/><circle cx="118" cy="146" r="2" fill="#fff8c0" ' + S(1.2) + '/><circle cx="90" cy="168" r="2" fill="#fff8c0" ' + S(1.2) + '/><circle cx="118" cy="168" r="2" fill="#fff8c0" ' + S(1.2) + '/>' +
        hl(92, 145, 6, 2.5, -20, 0.8) +
        // wood damage
        '<path d="M170 130 l-8 10 l6 4 l-8 10" stroke="' + O + '" stroke-width="2" fill="none" opacity=".7"/>' +
        '</g>' +
        // stubby legs
        '<path d="M60 182 Q54 190 60 190 L90 190 Q92 182 84 180 Z" fill="#7a4218" ' + S(3.5) + '/>' +
        '<path d="M124 180 Q116 182 120 190 L154 190 Q158 184 150 180 Z" fill="#7a4218" ' + S(3.5) + '/>' +
        '<path d="M64 190 l-2 -4 M72 190 l-1 -4 M128 190 l-1 -4 M136 190 l-1 -4" stroke="#f4e8c8" stroke-width="2.6" stroke-linecap="round"/>' +
        // spilled loot on the floor at front-left
        coin(24, 184, 10, 8) + coin(38, 188, 9, -14) + coin(12, 176, 8, 24) + coin(46, 180, 7, 10) +
        '<polygon points="8,190 14,182 20,190" fill="#ff7ad0" ' + S(1.8) + '/><polygon points="52,190 58,182 64,190" fill="#7ff0ff" ' + S(1.8) + '/>' +
        spark(30, 172, 4.5, '#fff', 0.95) + spark(168, 108, 4, '#fff', 0.9) + spark(150, 100, 3, '#fff8c0', 0.9) +
        '<ellipse cx="104" cy="118" rx="70" ry="6" fill="url(#' + I('gl') + ')"/>';
      return wrap(defs, shadow(84, 104), body);
    }
  };

  /* ------------------------------------------------------ CRYSTAL COLOSSUS */
  E.colossus = {
    name: 'Crystal Colossus',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'colossus-' + n + '-' + uid; };
      var nn = 0;
      var defs =
        lg(I('am'), [[0, '#cf98ff'], [0.5, '#8a3fd8'], [1, '#4a2090']], 0, 0, 1, 1) +
        lg(I('amd'), [[0, '#8a4ad0'], [0.5, '#5a2aa0'], [1, '#2c1466']], 0, 0, 1, 1) +
        lg(I('sa'), [[0, '#b0e6ff'], [0.5, '#3f8fee'], [1, '#1d3f9a']], 0, 0, 1, 1) +
        lg(I('rock'), [[0, '#5a4a8a'], [1, '#231650']]) +
        lg(I('metal'), [[0, '#d8dee8'], [0.5, '#8a94a6'], [1, '#414a5c']], 0, 0, 1, 1) +
        rg(I('core'), [[0, '#ffffff'], [0.3, '#ffb4f4'], [0.7, '#e03ad8'], [1, '#7a1a9e']], 0.4, 0.4, 0.65) +
        rg(I('halo'), [[0, '#ff7af0', 0.8], [0.5, '#c23ad8', 0.35], [1, '#c23ad8', 0]], 0.5, 0.5, 0.5) +
        rg(I('cg'), [[0, '#7ffcff', 0.9], [1, '#7ffcff', 0]], 0.5, 0.5, 0.5) +
        lg(I('eye'), [[0, '#ffffff'], [0.5, '#8ffcff'], [1, '#1ab4e0']]) +
        lg(I('moss'), [[0, '#8ad85a'], [1, '#3d8a2e']]);
      // faceted slab helper: clipped overlays inside a polygon
      function slab(pts, fill, ov, sw) {
        var id = I('c' + (nn++));
        return '<clipPath id="' + id + '"><polygon points="' + pts + '"/></clipPath>' +
          '<polygon points="' + pts + '" fill="' + fill + '" ' + S(sw || 4) + '/>' +
          '<g clip-path="url(#' + id + ')">' + (ov || '') + '</g>' +
          '<polygon points="' + pts + '" fill="none" ' + S(sw || 4) + '/>';
      }
      function fl(pts, op) { return poly(pts, '#fff', 'opacity="' + (op == null ? 0.26 : op) + '"'); }
      function fd(pts, op, c) { return poly(pts, c || '#1a0a40', 'opacity="' + (op == null ? 0.3 : op) + '"'); }
      function ln(d, c, w, op) { return '<path d="' + d + '" fill="none" stroke="' + (c || O) + '" stroke-width="' + (w || 1.6) + '" stroke-linecap="round" stroke-linejoin="round"' + (op != null ? ' opacity="' + op + '"' : '') + '/>'; }
      function rune(cx, cy, r, col) {
        var s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + f(r * 1.7) + '" fill="url(#' + I('cg') + ')" opacity=".55"/>' +
          '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + O + '" opacity=".35"/>' +
          '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="1.8"/>' +
          '<circle cx="' + cx + '" cy="' + cy + '" r="' + f(r * 0.62) + '" fill="none" stroke="' + col + '" stroke-width="1.2"/>';
        for (var k = 0; k < 8; k++) {
          var a = k * Math.PI / 4;
          s += '<path d="M' + f(cx + r * 0.62 * Math.cos(a)) + ' ' + f(cy + r * 0.62 * Math.sin(a)) + 'L' + f(cx + r * Math.cos(a)) + ' ' + f(cy + r * Math.sin(a)) + '" stroke="' + col + '" stroke-width="1.4"/>';
        }
        s += '<path d="M' + f(cx - r * 0.3) + ' ' + f(cy + r * 0.25) + 'L' + cx + ' ' + f(cy - r * 0.32) + 'L' + f(cx + r * 0.3) + ' ' + f(cy + r * 0.25) + 'M' + f(cx - r * 0.2) + ' ' + f(cy + r * 0.02) + 'L' + f(cx + r * 0.2) + ' ' + f(cy + r * 0.02) + '" stroke="#fff" stroke-width="1.3" fill="none"/>';
        return s;
      }
      function chain(x0, y0, cx, cy, x1, y1, n) {
        var s = '';
        for (var i = 0; i <= n; i++) {
          var t = i / n, u = 1 - t;
          var x = u * u * x0 + 2 * u * t * cx + t * t * x1, y = u * u * y0 + 2 * u * t * cy + t * t * y1;
          var dx = 2 * u * (cx - x0) + 2 * t * (x1 - cx), dy = 2 * u * (cy - y0) + 2 * t * (y1 - cy);
          var ang = Math.atan2(dy, dx) * 180 / Math.PI;
          s += '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + (i % 2 ? 3.2 : 4.8) + '" ry="' + (i % 2 ? 4.4 : 3) + '" transform="rotate(' + f(ang + (i % 2 ? 90 : 0)) + ' ' + f(x) + ' ' + f(y) + ')" fill="none" stroke="' + O + '" stroke-width="4.4"/>' +
            '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + (i % 2 ? 3.2 : 4.8) + '" ry="' + (i % 2 ? 4.4 : 3) + '" transform="rotate(' + f(ang + (i % 2 ? 90 : 0)) + ' ' + f(x) + ' ' + f(y) + ')" fill="none" stroke="#a4aebe" stroke-width="2"/>';
        }
        return s;
      }
      function moss(x, y, w) {
        return '<path d="M' + x + ' ' + (y + 5) + ' Q' + f(x + w * 0.1) + ' ' + (y - 4) + ' ' + f(x + w * 0.25) + ' ' + (y + 1) + ' Q' + f(x + w * 0.4) + ' ' + (y - 6) + ' ' + f(x + w * 0.55) + ' ' + (y + 1) + ' Q' + f(x + w * 0.75) + ' ' + (y - 4) + ' ' + f(x + w) + ' ' + (y + 5) + ' Z" fill="url(#' + I('moss') + ')" ' + S(2.4) + '/>' +
          '<path d="M' + f(x + w * 0.2) + ' ' + (y + 5) + ' q-1 8 1 13 M' + f(x + w * 0.62) + ' ' + (y + 4) + ' q2 7 0 11" stroke="#4d9a36" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
      }

      var b = '';
      // ---- floating shards (orbit, sway) ----
      b += '<g class="part-cape" style="transform-origin: 100px 100px">' +
        '<circle cx="22" cy="52" r="14" fill="url(#' + I('cg') + ')" opacity=".6"/><circle cx="180" cy="36" r="12" fill="url(#' + I('cg') + ')" opacity=".6"/>' +
        shard(20, 66, 12, 26, -20, SA, 2.4) + shard(182, 48, 11, 24, 24, AM, 2.4) + shard(12, 112, 9, 18, -50, AM, 2.2) +
        shard(190, 110, 9, 18, 46, SA, 2.2) + shard(150, 24, 8, 16, 20, RS, 2) + shard(46, 26, 8, 15, -24, EM, 2) +
        spark(30, 34, 4, '#fff', 0.9) + spark(172, 66, 3.5, '#bff', 0.9) + spark(8, 90, 3, '#fff', 0.8) + spark(194, 84, 3, '#fff', 0.8) +
        '</g>';

      // ---- far (right) arm ----
      var farSh = '128,64 156,54 178,72 182,104 164,120 134,110';
      b += slab('146,110 178,106 186,144 168,156 146,144', 'url(#' + I('amd') + ')', fd('146,110 160,110 156,156 146,144', 0.3) + fl('150,112 178,108 176,116 152,122', 0.18) + ln('M150 130 L182 126 M160 110 L164 154', O, 1.6, 0.5)) +
        slab('142,148 184,142 192,170 178,186 152,186 140,168', 'url(#' + I('amd') + ')',
          fl('146,150 184,144 186,154 148,160', 0.2) + fd('150,170 190,166 178,188 152,188', 0.4) + fd('142,150 156,150 152,186 140,168', 0.25) +
          ln('M152 160 L152 176 M166 158 L168 176 M180 156 L182 174', O, 2, 0.7)) +
        rune(166, 130, 8, '#7ffcff');
      b += slab(farSh, 'url(#' + I('am') + ')', fl('130,66 156,56 160,70 134,80', 0.32) + fd('164,86 180,84 164,120 148,110', 0.36) + fd('178,72 182,104 170,112 172,80', 0.25) + ln('M136 96 L168 78 M150 58 L158 108', '#f4dcff', 1.4, 0.5)) +
        shard(150, 62, 12, 26, 14, SA, 2.4) + shard(166, 66, 10, 20, 34, AM, 2.2);

      // ---- legs ----
      b += slab('100,132 148,132 152,166 158,188 96,188 98,166', 'url(#' + I('amd') + ')',
        fd('120,132 148,132 152,166 158,188 132,188', 0.32) + fl('100,134 112,134 110,186 96,188', 0.12) + fd('96,176 158,178 158,190 96,190', 0.35) +
        ln('M102 168 L152 166 M110 178 L112 188 M130 176 L130 188', O, 1.6, 0.6)) +
        '<polygon points="104,146 144,146 148,164 100,164" fill="url(#' + I('sa') + ')" ' + S(2.6) + '/>' + fd('104,146 144,146 148,164 100,164', 0.4) + poly('104,146 144,146 140,152 106,152', '#fff', 'opacity=".3"') + rune(124, 156, 6.5, '#ff9af0');
      b += slab('54,134 104,134 108,168 114,190 46,190 50,166', 'url(#' + I('am') + ')',
        fl('56,136 76,136 68,188 46,190', 0.22) + fd('88,134 104,134 108,168 114,190 84,190', 0.36) + fd('46,178 114,180 114,192 46,192', 0.32) +
        ln('M50 168 L106 166 M60 180 L62 190 M84 178 L84 190', O, 1.8, 0.6) + ln('M62 140 L70 156 L62 168', '#fff', 1.4, 0.6)) +
        '<polygon points="60,146 100,146 104,166 56,166" fill="url(#' + I('sa') + ')" ' + S(3) + '/>' +
        poly('60,146 100,146 96,154 62,154', '#fff', 'opacity=".4"') + rune(80, 158, 8.5, '#7ffcff') +
        moss(52, 180, 22) + moss(120, 178, 18);

      // ---- torso ----
      var torso = '60,62 142,62 158,92 148,130 124,146 76,146 52,130 42,92';
      b += slab(torso, 'url(#' + I('am') + ')',
        fl('60,64 100,64 92,100 46,96', 0.3) + fl('44,94 60,66 66,110 54,128', 0.16) + fd('142,62 158,92 148,130 124,146 118,100', 0.38) + fd('76,146 124,146 116,120 84,124', 0.3) +
        ln('M60 62 L92 100 L52 130 M142 62 L110 100 L148 130 M92 100 L100 146 M110 100 L104 146', O, 1.8, 0.55) +
        ln('M46 100 L92 100 M110 100 L156 100', '#f4dcff', 1.4, 0.45)) +
        // plate
        slab('70,72 132,72 142,100 128,128 100,138 72,128 60,100', 'url(#' + I('sa') + ')',
          fl('72,74 106,74 92,104 62,100', 0.34) + fd('132,72 142,100 128,128 100,138 104,100', 0.4) + fd('72,128 100,138 128,128 100,116', 0.3) +
          ln('M64 100 L92 102 M112 100 L140 100 M76 126 L92 112 M126 126 L112 112', '#e8f8ff', 1.4, 0.55)) +
        // halo, crack, core
        '<circle cx="100" cy="104" r="40" fill="url(#' + I('halo') + ')"/>' +
        '<polygon points="96,72 105,82 99,92 114,102 106,114 114,124 100,138 91,120 86,104 94,94 89,82" fill="#3a0a56" ' + S(3) + '/>' +
        '<polygon points="97,80 103,88 98,96 108,103 102,112 108,121 100,131 95,119 92,104 98,96" fill="url(#' + I('core') + ')"/>' +
        '<polygon points="100,88 114,104 100,122 86,104" fill="url(#' + I('core') + ')" ' + S(2.6) + '/>' +
        poly('100,88 114,104 100,104 ', '#fff', 'opacity=".6"') + poly('86,104 100,104 100,122', '#fff', 'opacity=".35"') + poly('100,104 114,104 100,122', '#a020c8', 'opacity=".45"') +
        spark(96, 96, 6, '#fff', 1) + spark(106, 112, 3.5, '#fff', 0.9) +
        // veins radiating
        ln('M86 104 L72 100 L64 110 L52 108 M114 104 L128 100 L138 108 L152 104 M100 122 L96 134 L84 140 M100 88 L108 76', '#ff9af0', 1.8, 0.85) +
        ln('M72 100 L70 88 M128 100 L132 88', '#7ffcff', 1.4, 0.8) +
        // carved rune bands
        '<path d="M62 136 L138 136" stroke="' + O + '" stroke-width="2.4" opacity=".6"/>' + rune(100, 150, 0.1, '#7ffcff') +
        [64, 72, 80, 120, 128, 136].map(function (x) { return '<path d="M' + x + ' 138 l3 4 l-3 4" stroke="#7ffcff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".85"/>'; }).join('') +
        // moss on the shoulders/top ridge & torso
        moss(112, 58, 26) + moss(46, 116, 16);

      // ---- near (left) arm + shoulder ----
      b += slab('16,108 60,106 66,138 50,154 24,148', 'url(#' + I('am') + ')', fl('18,110 60,108 58,118 20,122', 0.3) + fd('44,108 60,106 66,138 50,154', 0.36) + ln('M22 128 L64 126', O, 1.6, 0.5)) +
        slab('8,142 60,138 68,168 56,188 20,188 6,166', 'url(#' + I('am') + ')',
          fl('10,144 60,140 60,152 12,158', 0.3) + fd('14,170 66,168 56,190 20,190', 0.4) + fd('44,140 60,138 68,168 56,188', 0.3) +
          ln('M18 156 L20 178 M34 154 L36 178 M50 152 L52 176', O, 2, 0.7) + ln('M10 150 L60 146', '#fff', 1.4, 0.5)) +
        moss(14, 184, 20) +
        slab('12,80 26,54 64,50 76,74 68,106 30,112', 'url(#' + I('am') + ')',
          fl('14,80 28,56 64,52 58,70 22,84', 0.36) + fd('76,74 68,106 30,112 46,84', 0.38) + fd('12,80 22,84 30,112', 0.2) +
          ln('M28 56 L46 84 L30 110 M64 52 L46 84 L70 100', O, 1.8, 0.55) + ln('M20 76 L60 60', '#fff', 1.5, 0.6)) +
        shard(30, 56, 12, 26, -24, AM, 2.4) + shard(50, 51, 13, 34, 0, SA, 2.6) + shard(66, 56, 10, 22, 26, EM, 2.2) +
        rune(44, 86, 11, '#7ffcff') + moss(24, 56, 20) +
        // scars
        ln('M32 96 l6 -5 l-3 8 l7 -4', O, 2, 0.9) + '<path d="M20 148 l7 8 l-4 6" stroke="' + O + '" stroke-width="2" fill="none" opacity=".8"/>';

      // ---- chains (sway) ----
      b += '<g class="part-cape" style="transform-origin: 34px 96px">' + chain(30, 98, 40, 128, 66, 116, 9) +
        '<polygon points="24,96 36,92 40,102 28,106" fill="url(#' + I('metal') + ')" ' + S(2.6) + '/>' + '</g>';
      b += '<g class="part-cape" style="transform-origin: 168px 108px">' + chain(166, 110, 178, 128, 176, 148, 5) + '<polygon points="160,104 174,102 174,114 162,114" fill="url(#' + I('metal') + ')" ' + S(2.6) + '/>' + '</g>';

      // ---- head ----
      b += '<g class="part-head" style="transform-origin: 100px 70px"><g transform="translate(100 76) scale(1.2) translate(-100 -76)">' +
        slab('86,60 116,60 118,74 84,74', 'url(#' + I('rock') + ')', '') +
        // crown spikes (shattered)
        '<polygon points="78,36 72,18 90,36" fill="url(#' + I('sa') + ')" ' + S(3) + '/>' +
        '<polygon points="90,36 92,10 106,36" fill="url(#' + I('am') + ')" ' + S(3) + '/>' + poly('92,10 97,36 90,36', '#fff', 'opacity=".4"') +
        '<polygon points="106,36 118,16 122,36" fill="url(#' + I('sa') + ')" ' + S(3) + '/>' + poly('118,16 121,36 114,36', '#1a0a40', 'opacity=".3"') +
        '<polygon points="122,38 128,24 124,20 134,38" fill="url(#' + I('am') + ')" ' + S(3) + '/>' +
        '<polygon points="70,40 62,26 78,36" fill="url(#' + I('am') + ')" ' + S(3) + '/>' +
        '<polygon points="132,16 136,10 140,18 136,24" fill="#8ad0ff" ' + S(1.8) + ' opacity=".9"/>' +
        slab('72,38 130,38 136,50 128,66 112,74 88,74 74,66 68,50', 'url(#' + I('am') + ')',
          fl('72,40 100,40 88,58 68,52', 0.34) + fd('130,38 136,50 128,66 112,74 106,54', 0.36) + fd('74,66 88,74 112,74 100,62', 0.3) +
          ln('M100 40 L100 50 M76 58 L84 64', O, 1.6, 0.5)) +
        // crown band with gem
        '<polygon points="70,36 132,36 130,46 72,46" fill="url(#' + I('metal') + ')" ' + S(3) + '/>' +
        '<polygon points="101,33 109,41 101,49 93,41" fill="url(#' + I('core') + ')" ' + S(2.2) + '/><circle cx="99" cy="39" r="1.6" fill="#fff"/>' +
        // eyes
        '<circle cx="86" cy="56" r="14" fill="url(#' + I('cg') + ')"/><circle cx="118" cy="56" r="13" fill="url(#' + I('cg') + ')"/>' +
        '<path d="M74 48 L98 58 L98 52 L78 42 Z" fill="#1a0a40" ' + S(2.4) + '/><path d="M130 48 L108 58 L108 52 L126 42 Z" fill="#1a0a40" ' + S(2.4) + '/>' +
        '<g class="part-eyes" style="transform-origin: 101px 58px">' +
        '<polygon points="76,54 98,59 95,66 80,64" fill="url(#' + I('eye') + ')" ' + S(2.4) + '/><ellipse cx="84" cy="60" rx="2.6" ry="3.2" fill="#0a3a6a"/><circle cx="82.6" cy="58.6" r="1.4" fill="#fff"/><circle cx="92" cy="62" r="1" fill="#fff" opacity=".8"/>' +
        '<polygon points="126,54 106,59 108,66 122,64" fill="url(#' + I('eye') + ')" ' + S(2.4) + '/><ellipse cx="114" cy="60" rx="2.4" ry="3.2" fill="#0a3a6a"/><circle cx="112.6" cy="58.6" r="1.3" fill="#fff"/><circle cx="121" cy="62" r="1" fill="#fff" opacity=".8"/>' +
        '</g>' +
        // nose / jaw / mouth
        '<path d="M99 60 L96 68 L104 68 Z" fill="#4a2090" ' + S(1.8) + '/>' +
        '<polygon points="80,67 121,66 118,71 110,73 92,73 84,71" fill="#7ffcff" ' + S(2.4) + '/>' +
        '<polygon points="82,67 87,71 92,67 97,72 102,67 107,72 112,67 117,71 119,67" fill="#fff" ' + S(1.6) + '/>' +
        '<path d="M86 71 L86 73 M97 72 L97 74 M107 72 L107 74" stroke="' + O + '" stroke-width="1.4"/>' +
        // scar + chip
        ln('M114 44 L104 56 L109 60', O, 2.2, 0.9) + '<path d="M76 62 l6 -4 l-1 7 z" fill="#2c1466" opacity=".8"/>' +
        hl(84, 44, 8, 3, -20, 0.6) +
        '</g></g>';

      // ---- dust & debris ----
      b += '<g fill="#e8d0ff" opacity=".85">' +
        '<circle cx="14" cy="192" r="0" /><circle cx="6" cy="176" r="2"/><circle cx="72" cy="176" r="1.6" opacity=".7"/><circle cx="184" cy="190" r="0"/>' +
        '<circle cx="196" cy="158" r="1.8"/><circle cx="190" cy="180" r="1.4" opacity=".7"/><circle cx="2" cy="160" r="1.4"/></g>' +
        spark(70, 150, 3, '#fff', 0.9) + spark(184, 132, 3, '#bff', 0.9);
      return wrap(defs, shadow(84, 102, 0.32), b);
    }
  };

  /* ================================================================ SCENE */
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function crystalScene() {
    var r = rng(77), i, s = '';
    function halo(x, y, rx, ry, col, op) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="url(#crystal-h' + col + ')" opacity="' + op + '"/>'; }
    s += '<defs>' +
      lg('crystal-sky', [[0, '#120c33'], [0.5, '#2a1f5e'], [1, '#43308a']]) +
      lg('crystal-ground', [[0, '#3c3080'], [1, '#170f3c']]) +
      lg('crystal-rock', [[0, '#2e2478'], [1, '#150e40']]) +
      lg('crystal-bed', [[0, '#5a4a96'], [1, '#3a2c70']]) +
      lg('crystal-wood', [[0, '#a8683a'], [1, '#603418']]) +
      lg('crystal-rail', [[0, '#d4dcec'], [0.5, '#8a94b0'], [1, '#4a5274']]) +
      rg('crystal-hp', [[0, '#c86aff', 0.75], [1, '#c86aff', 0]], 0.5, 0.5, 0.5) +
      rg('crystal-hb', [[0, '#5ab0ff', 0.75], [1, '#5ab0ff', 0]], 0.5, 0.5, 0.5) +
      rg('crystal-hg', [[0, '#5affa0', 0.7], [1, '#5affa0', 0]], 0.5, 0.5, 0.5) +
      rg('crystal-hy', [[0, '#ffdc78', 0.8], [1, '#ffdc78', 0]], 0.5, 0.5, 0.5) +
      '</defs>';
    s += '<rect width="400" height="300" fill="url(#crystal-sky)"/>';
    // far back-wall glow + silhouettes
    s += halo(200, 150, 190, 60, 'p', 0.5) + halo(80, 160, 90, 40, 'b', 0.4) + halo(330, 160, 90, 40, 'g', 0.35);
    var col = ['#4b3a9c', '#3c4aa8', '#3a3a8a'];
    for (i = 0; i < 16; i++) {
      var cx = 12 + i * 25 + r() * 10, h = 22 + r() * 44, w = 10 + r() * 12;
      s += '<polygon points="' + f(cx - w) + ',196 ' + f(cx - w * 0.6) + ',' + f(196 - h * 0.7) + ' ' + f(cx) + ',' + f(196 - h) + ' ' + f(cx + w * 0.6) + ',' + f(196 - h * 0.7) + ' ' + f(cx + w) + ',196" fill="' + col[i % 3] + '" opacity=".75"/>' +
        '<polygon points="' + f(cx) + ',' + f(196 - h) + ' ' + f(cx + w * 0.6) + ',' + f(196 - h * 0.7) + ' ' + f(cx + w) + ',196 ' + f(cx) + ',196" fill="#1a1250" opacity=".35"/>';
    }
    // ceiling with stalactites
    var d = 'M-10 -4 L410 -4 L410 30 ';
    var xs = [];
    for (i = 0; i < 14; i++) xs.push(400 - i * 30 - 6 - r() * 14);
    xs.forEach(function (x, k) {
      var len = 18 + r() * 52, w = 9 + r() * 10;
      d += 'L' + f(x + w) + ' ' + (28 + (k % 2) * 4) + ' L' + f(x + w * 0.2) + ' ' + f(30 + len) + ' L' + f(x - w) + ' ' + (30 + (k % 3)) + ' ';
    });
    d += 'L-10 30 Z';
    s += '<path d="' + d + '" fill="url(#crystal-rock)" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<path d="M-10 22 L410 22" stroke="#6a54c8" stroke-width="2.5" opacity=".6"/>';
    for (i = 0; i < 10; i++) s += '<path d="M' + f(r() * 400) + ' ' + f(4 + r() * 16) + 'l6 8" stroke="#5a44b0" stroke-width="2" opacity=".5"/>';
    // glowing crystals on ceiling
    s += halo(60, 34, 34, 22, 'b', 0.6) + shard(60, 26, 10, 26, 180, SA, 2) + shard(72, 26, 7, 16, 170, AM, 1.8);
    s += halo(330, 34, 34, 22, 'p', 0.6) + shard(330, 26, 10, 24, 180, AM, 2) + shard(318, 26, 7, 16, 190, EM, 1.8);
    // lanterns
    function lantern(x, y) {
      return '<path d="M' + x + ' 22 L' + x + ' ' + y + '" stroke="' + O + '" stroke-width="3"/>' +
        '<path d="M' + x + ' 22 L' + x + ' ' + y + '" stroke="#9a8a7a" stroke-width="1.2" stroke-dasharray="3 2"/>' +
        halo(x, y + 14, 46, 44, 'y', 0.75) +
        '<path d="M' + (x - 8) + ' ' + y + ' L' + (x + 8) + ' ' + y + ' L' + (x + 11) + ' ' + (y - 6) + ' L' + x + ' ' + (y - 12) + ' L' + (x - 11) + ' ' + (y - 6) + ' Z" fill="#4a3a30" stroke="' + O + '" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<rect x="' + (x - 8) + '" y="' + y + '" width="16" height="22" rx="3" fill="#ffe08a" stroke="' + O + '" stroke-width="2.4"/>' +
        '<ellipse cx="' + x + '" cy="' + (y + 12) + '" rx="4" ry="6" fill="#fff8d0"/>' +
        '<path d="M' + x + ' ' + y + ' L' + x + ' ' + (y + 22) + ' M' + (x - 8) + ' ' + (y + 11) + ' L' + (x + 8) + ' ' + (y + 11) + '" stroke="' + O + '" stroke-width="1.6"/>' +
        '<path d="M' + (x - 8) + ' ' + (y + 22) + ' L' + (x + 8) + ' ' + (y + 22) + ' L' + (x + 6) + ' ' + (y + 27) + ' L' + (x - 6) + ' ' + (y + 27) + ' Z" fill="#4a3a30" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/>';
    }
    s += lantern(150, 74) + lantern(268, 58);
    // big crystal clusters (mid-ground)
    function cluster(x, y, sc, a, b, c) {
      var cl = [[-30, 40, -22, a], [-14, 30, -8, b], [0, 58, 0, c], [14, 34, 8, a], [30, 44, 20, b], [-44, 22, -34, c], [44, 22, 32, a]];
      var o = halo(x, y - 30 * sc, 70 * sc, 50 * sc, a === AM ? 'p' : a === SA ? 'b' : 'g', 0.85);
      cl.slice().sort(function (p, q) { return q[1] - p[1]; }).forEach(function (k) { o += shard(f(x + k[0] * sc), y, f(k[1] * 0.36 * sc + 6), f(k[1] * 1.7 * sc), k[2], k[3], 3); });
      return o;
    }
    s += cluster(64, 204, 1.25, AM, SA, RS) + cluster(338, 204, 1.2, SA, EM, AM) + cluster(202, 194, 0.55, EM, AM, SA);
    // ground
    s += '<path d="M-10 192 Q100 186 200 192 T410 192 V310 H-10 Z" fill="url(#crystal-ground)"/>';
    s += '<path d="M-10 192 Q100 186 200 192 T410 192" fill="none" stroke="#7a62d0" stroke-width="2"/>';
    for (i = 0; i < 10; i++) s += '<ellipse cx="' + f(r() * 400) + '" cy="' + f(200 + r() * 12) + '" rx="' + f(6 + r() * 8) + '" ry="2.5" fill="#241a58" opacity=".7"/>';
    // luminous mushrooms (back)
    function mush(x, y, sc, cap, glow) {
      return halo(x, y - 10 * sc, 26 * sc, 20 * sc, glow, 0.7) +
        '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')"><path d="M-3 0 Q-4 -8 -2 -13 L3 -13 Q4 -8 3 0 Z" fill="#f4eaff" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M-13 -12 C-13 -26 13 -26 13 -12 Q0 -8 -13 -12 Z" fill="' + cap + '" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>' +
        '<circle cx="-5" cy="-18" r="2" fill="#fff" opacity=".9"/><circle cx="4" cy="-16" r="1.5" fill="#fff" opacity=".9"/><circle cx="8" cy="-20" r="1" fill="#fff" opacity=".8"/></g>';
    }
    s += mush(24, 216, 0.9, '#5affc8', 'g') + mush(36, 220, 0.6, '#7ac8ff', 'b') + mush(372, 218, 0.9, '#ff7ad8', 'p') + mush(384, 222, 0.55, '#5affc8', 'g') + mush(150, 210, 0.5, '#7ac8ff', 'b');
    // mine cart (back)
    s += '<g transform="translate(240 212)"><path d="M-22 -22 L22 -22 L16 0 L-16 0 Z" fill="#7a5a4a" stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<path d="M-22 -22 L22 -22" stroke="#b4a090" stroke-width="3"/>' +
      '<g>' + [[-12, -26], [-2, -30], [8, -27], [16, -25]].map(function (p, k) { return '<polygon points="' + p[0] + ',' + p[1] + ' ' + (p[0] + 6) + ',' + (p[1] - 8) + ' ' + (p[0] + 12) + ',' + p[1] + '" fill="' + ['#c86aff', '#5ab0ff', '#5affa0', '#ff7ad8'][k] + '" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>'; }).join('') + '</g>' +
      '<circle cx="-10" cy="2" r="5" fill="#8a94b0" stroke="' + O + '" stroke-width="2.4"/><circle cx="10" cy="2" r="5" fill="#8a94b0" stroke="' + O + '" stroke-width="2.4"/></g>';
    // path: rail bed
    s += '<path d="M-10 222 L410 222 L410 268 L-10 268 Z" fill="url(#crystal-bed)"/>';
    s += '<path d="M-10 222 L410 222 M-10 268 L410 268" stroke="' + O + '" stroke-width="3"/>';
    for (i = 0; i < 40; i++) s += '<ellipse cx="' + f(r() * 400) + '" cy="' + f(226 + r() * 38) + '" rx="' + f(2 + r() * 3) + '" ry="1.6" fill="' + (i % 2 ? '#7a68b8' : '#382a6c') + '" opacity=".8"/>';
    for (i = 0; i < 20; i++) {
      var sx = 10 + i * 20;
      s += '<rect x="' + (sx - 6) + '" y="224" width="12" height="42" rx="2" fill="url(#crystal-wood)" stroke="' + O + '" stroke-width="2.2"/><path d="M' + (sx - 3) + ' 230 L' + (sx - 3) + ' 260" stroke="#d09a60" stroke-width="1.6" opacity=".6"/>';
    }
    [[232, 237], [256, 261]].forEach(function (y) {
      s += '<rect x="-10" y="' + y[0] + '" width="420" height="7" fill="url(#crystal-rail)" stroke="' + O + '" stroke-width="2.4"/><path d="M-10 ' + (y[0] + 2) + ' L410 ' + (y[0] + 2) + '" stroke="#fff" stroke-width="1.6" opacity=".7"/>';
    });
    for (i = 0; i < 20; i++) s += '<circle cx="' + (10 + i * 20) + '" cy="235.5" r="1.6" fill="#2b1d14"/><circle cx="' + (10 + i * 20) + '" cy="259.5" r="1.6" fill="#2b1d14"/>';
    // foreground crystals & mushrooms
    s += cluster(112, 300, 0.6, SA, AM, EM) + cluster(296, 302, 0.55, RS, AM, SA);
    s += mush(20, 292, 1.3, '#ff7ad8', 'p') + mush(38, 298, 0.8, '#5affc8', 'g') + mush(380, 292, 1.3, '#5affc8', 'g') + mush(364, 298, 0.8, '#7ac8ff', 'b');
    // haze
    for (i = 0; i < 6; i++) s += '<ellipse cx="' + f(r() * 400) + '" cy="' + f(198 + r() * 80) + '" rx="' + f(40 + r() * 40) + '" ry="' + f(5 + r() * 5) + '" fill="#b89cff" opacity=".1"/>';
    // sparkle dust
    for (i = 0; i < 34; i++) s += '<circle cx="' + f(r() * 400) + '" cy="' + f(30 + r() * 250) + '" r="' + f(0.7 + r() * 1.3) + '" fill="' + ['#fff', '#cfe8ff', '#f0d0ff'][i % 3] + '" opacity="' + f(0.4 + r() * 0.5) + '"/>';
    for (i = 0; i < 10; i++) s += spark(f(20 + r() * 360), f(50 + r() * 220), f(3 + r() * 3), '#fff', 0.9);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice">' + s + '</svg>';
  }

  window.SCENES = window.SCENES || {};
  window.SCENES.crystal = { name: 'Crystal Caverns', sky: '#2a1f5e', svg: crystalScene };
})();

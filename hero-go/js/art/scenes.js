/* Hero Go! — battle / home backgrounds. Pure inline SVG strings. See ART_CONTRACT.md
   viewBox 0 0 400 300 (camp: 0 0 400 500), preserveAspectRatio xMidYMax slice.
   Battle floor from y≈190 down, with a clear path strip around y 222-266. */
(function () {
  var O = '#2b1d14';

  function wrap(h, inner) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 ' + h + '" preserveAspectRatio="xMidYMax slice">' + inner + '</svg>';
  }
  function lg(id, stops, x2, y2) {
    var s = '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (x2 || 0) + '" y2="' + (y2 == null ? 1 : y2) + '">';
    for (var i = 0; i < stops.length; i++) s += '<stop offset="' + stops[i][0] + '" stop-color="' + stops[i][1] + '"' + (stops[i][2] != null ? ' stop-opacity="' + stops[i][2] + '"' : '') + '/>';
    return s + '</linearGradient>';
  }
  function rgr(id, stops) {
    var s = '<radialGradient id="' + id + '">';
    for (var i = 0; i < stops.length; i++) s += '<stop offset="' + stops[i][0] + '" stop-color="' + stops[i][1] + '"' + (stops[i][2] != null ? ' stop-opacity="' + stops[i][2] + '"' : '') + '/>';
    return s + '</radialGradient>';
  }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function f(n) { return Math.round(n * 10) / 10; }

  // union-outlined blob of circles: [[x,y,r],...]
  function blob(circles, fill, shade, sw, hlCol) {
    var sh = '', i, c;
    for (i = 0; i < circles.length; i++) { c = circles[i]; sh += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '"/>'; }
    var out = (sw ? '<g fill="' + O + '" stroke="' + O + '" stroke-width="' + sw * 2 + '">' + sh + '</g>' : '') + '<g fill="' + fill + '">' + sh + '</g>';
    if (shade) {
      var s2 = '';
      for (i = 0; i < circles.length; i++) { c = circles[i]; s2 += '<circle cx="' + f(c[0] + c[2] * 0.18) + '" cy="' + f(c[1] + c[2] * 0.3) + '" r="' + f(c[2] * 0.8) + '"/>'; }
      out += '<g fill="' + shade + '">' + s2 + '</g>';
    }
    if (hlCol) {
      var s3 = '';
      for (i = 0; i < circles.length; i++) { c = circles[i]; s3 += '<circle cx="' + f(c[0] - c[2] * 0.3) + '" cy="' + f(c[1] - c[2] * 0.35) + '" r="' + f(c[2] * 0.35) + '"/>'; }
      out += '<g fill="' + hlCol + '">' + s3 + '</g>';
    }
    return out;
  }
  function cloud(x, y, s, fill, shade) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<g fill="' + (shade || '#dbeefa') + '"><ellipse cx="0" cy="6" rx="44" ry="12"/></g>' +
      '<g fill="' + (fill || '#fff') + '"><circle cx="-22" cy="0" r="14"/><circle cx="0" cy="-8" r="20"/><circle cx="22" cy="-2" r="15"/><ellipse cx="0" cy="3" rx="40" ry="10"/></g>' +
      '</g>';
  }
  function tuft(x, y, c) {
    return '<path d="M' + (x - 5) + ' ' + y + 'q2 -8 3 -9q1 5 2 7q1 -8 4 -10q0 7 1 10q2 -5 5 -6q-2 5 -2 8z" fill="' + c + '"/>';
  }
  function pebbles(r, n, x0, x1, y0, y1, cols) {
    var s = '';
    for (var i = 0; i < n; i++) {
      var x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), w = 2 + r() * 5;
      s += '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(w) + '" ry="' + f(w * 0.55) + '" fill="' + cols[i % cols.length] + '"/>';
    }
    return s;
  }
  // path strip, standard shape for battle scenes
  var PATH_TOP = 'M-10 226C80 216 170 222 240 220C310 218 360 224 410 222';
  var PATH_D = PATH_TOP + 'L410 266C340 272 250 262 180 266C110 270 50 262 -10 268Z';

  /* ------------------------------------------------ FOREST */
  function roundTree(x, y, s, c1, c2, c3) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<path d="M-7 0L-5 -40L5 -40L7 0Z" fill="#9a6236" stroke="' + O + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M1 -8v-20M-3 -20l-3 -8" stroke="#7a4a26" stroke-width="1.6"/>' +
      blob([[-18, -52, 18], [0, -66, 22], [18, -52, 18], [0, -44, 18]], c1, c2, 1.4, c3) +
      '<g fill="' + c3 + '" opacity=".8"><circle cx="-10" cy="-70" r="2"/><circle cx="12" cy="-60" r="1.6"/></g>' +
      '</g>';
  }
  function fencePost(x, y) {
    return '<path d="M' + (x - 4) + ' ' + y + 'V' + (y - 26) + 'l4 -5l4 5V' + y + 'Z" fill="#c98b52" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M' + (x - 1) + ' ' + (y - 22) + 'v14" stroke="#a36a38" stroke-width="1.2"/>';
  }
  function bush(x, y, s, c1, c2, berry) {
    var b = '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      blob([[-16, -10, 13], [0, -18, 16], [17, -10, 13], [0, -6, 15]], c1, c2, 1.3, 'rgba(255,255,255,.28)');
    if (berry) b += '<g fill="' + berry + '" stroke="' + O + '" stroke-width="1"><circle cx="-12" cy="-14" r="2.6"/><circle cx="6" cy="-22" r="2.6"/><circle cx="14" cy="-8" r="2.6"/><circle cx="-2" cy="-6" r="2.4"/></g>';
    return b + '</g>';
  }
  function smallFlower(x, y, c) {
    return '<g transform="translate(' + x + ' ' + y + ')"><path d="M0 0v-6" stroke="#3e8a2f" stroke-width="1.4"/>' +
      '<g fill="' + c + '"><circle cx="-2" cy="-7" r="2"/><circle cx="2" cy="-7" r="2"/><circle cx="0" cy="-9.5" r="2"/><circle cx="0" cy="-5" r="2"/></g><circle cx="0" cy="-7" r="1.2" fill="#ffe14d"/></g>';
  }

  function forest() {
    var r = rng(11), i, s = '';
    s += '<defs>' + lg('forest-sky', [[0, '#6ccaf7'], [0.7, '#bfeaff'], [1, '#e6f8ff']]) +
      lg('forest-grass', [[0, '#8fd65c'], [1, '#5fb03f']]) +
      lg('forest-path', [[0, '#f4d9a0'], [1, '#e2bb78']]) + '</defs>';
    s += '<rect width="400" height="300" fill="url(#forest-sky)"/>';
    s += '<circle cx="330" cy="46" r="26" fill="#fff7c2" opacity=".9"/><circle cx="330" cy="46" r="40" fill="#fff7c2" opacity=".25"/>';
    s += cloud(80, 50, 0.9) + cloud(250, 34, 0.7) + cloud(380, 90, 0.6);
    // far hills
    s += '<path d="M-10 170Q50 120 120 150T250 138T410 146V200H-10Z" fill="#a6dcb0"/>';
    s += '<path d="M-10 182Q70 150 150 172T300 162T410 170V200H-10Z" fill="#7cc58c"/>';
    // far treeline
    for (i = 0; i < 22; i++) {
      var tx = i * 19 + r() * 8 - 4, ty = 178 + r() * 6, tr = 11 + r() * 7;
      s += '<circle cx="' + f(tx) + '" cy="' + f(ty) + '" r="' + f(tr) + '" fill="#4f9f5e"/>';
      s += '<circle cx="' + f(tx - 3) + '" cy="' + f(ty - 4) + '" r="' + f(tr * 0.45) + '" fill="#63b570"/>';
    }
    // mid trees
    s += roundTree(28, 196, 1.05, '#58b84a', '#3d8f3a', '#8ada6a') + roundTree(372, 198, 1.15, '#58b84a', '#3d8f3a', '#8ada6a');
    s += roundTree(95, 192, 0.75, '#6cc452', '#46993d', '#9be27a') + roundTree(300, 190, 0.7, '#6cc452', '#46993d', '#9be27a');
    // ground
    s += '<path d="M-10 190Q100 184 200 188T410 188V310H-10Z" fill="url(#forest-grass)"/>';
    s += '<path d="M-10 190Q100 184 200 188T410 188" fill="none" stroke="#4e9a36" stroke-width="2"/>';
    // fence (back)
    for (i = 0; i < 9; i++) s += fencePost(120 + i * 22, 212);
    s += '<path d="M112 192L302 192M112 202L302 202" stroke="' + O + '" stroke-width="6" stroke-linecap="round"/>';
    s += '<path d="M112 192L302 192M112 202L302 202" stroke="#d9a066" stroke-width="3.2" stroke-linecap="round"/>';
    for (i = 0; i < 9; i++) s += '<rect x="' + (117 + i * 22) + '" y="189" width="6" height="16" fill="#c98b52"/><circle cx="' + (120 + i * 22) + '" cy="192" r="1" fill="#6b4020"/><circle cx="' + (120 + i * 22) + '" cy="202" r="1" fill="#6b4020"/>';
    // grass stripes / tufts
    for (i = 0; i < 26; i++) s += tuft(f(r() * 400), f(206 + r() * 14), '#4e9a36');
    // path
    s += '<path d="' + PATH_D + '" fill="url(#forest-path)"/>';
    s += '<path d="' + PATH_TOP + '" fill="none" stroke="#c99a58" stroke-width="3"/>';
    s += '<path d="M-10 268C50 262 110 270 180 266C250 262 340 272 410 266" fill="none" stroke="#c99a58" stroke-width="3"/>';
    s += pebbles(r, 34, 0, 400, 230, 262, ['#d6ae6c', '#fff0c8', '#caa066']);
    for (i = 0; i < 6; i++) { var sx = 30 + i * 70 + r() * 20; s += '<ellipse cx="' + f(sx) + '" cy="' + f(236 + r() * 20) + '" rx="9" ry="4" fill="#cfd4d8" stroke="' + O + '" stroke-width="1.5"/><ellipse cx="' + f(sx - 2) + '" cy="' + f(234 + r() * 20) + '" rx="3" ry="1.2" fill="#fff" opacity=".7"/>'; }
    // signpost
    s += '<g transform="translate(346 214)">' +
      '<path d="M-4 0V-44H4V0Z" fill="#b97a45" stroke="' + O + '" stroke-width="2.5"/>' +
      '<path d="M-24 -46H14L24 -38L14 -30H-24Z" fill="#e0a868" stroke="' + O + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M-18 -38h26M-18 -34h16" stroke="#8a5a30" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M22 -26H-14L-22 -18L-14 -10H22Z" fill="#d9975a" stroke="' + O + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M-10 -18h24" stroke="#8a5a30" stroke-width="2" stroke-linecap="round"/>' +
      '<circle cx="0" cy="-38" r="1.4" fill="' + O + '"/><circle cx="0" cy="-18" r="1.4" fill="' + O + '"/>' +
      '<path d="M-10 0q10 -5 20 0" fill="#4e9a36"/></g>';
    // foreground grass + bushes + flowers
    s += '<path d="M-10 275Q60 268 130 278T260 274T410 276V310H-10Z" fill="#5aa83f"/>';
    for (i = 0; i < 18; i++) s += smallFlower(f(r() * 400), f(280 + r() * 16), ['#ff8fb8', '#fff', '#ffd93b', '#b58cff'][i % 4]);
    s += bush(20, 298, 1.3, '#5fbf4a', '#3f933a', '#ff4d5e') + bush(385, 300, 1.2, '#5fbf4a', '#3f933a', '#5f8cff');
    s += bush(20, 212, 0.8, '#6cc452', '#46993d', null) + bush(80, 214, 0.6, '#6cc452', '#46993d', '#ff8fb8');
    // floating leaves / light motes
    for (i = 0; i < 10; i++) s += '<circle cx="' + f(r() * 400) + '" cy="' + f(60 + r() * 120) + '" r="' + f(1 + r() * 1.5) + '" fill="#fffbe0" opacity=".8"/>';
    return wrap(300, s);
  }

  /* ------------------------------------------------ DESERT */
  function cactus(x, y, s) {
    var body = '<path d="M-9 0V-58a9 9 0 0 1 18 0V0Z"/>' +
      '<path d="M-9 -26H-20a6 6 0 0 1 -6 -6V-44a6 6 0 0 1 12 0V-38H-9Z"/>' +
      '<path d="M9 -34H18V-52a6 6 0 0 1 12 0V-34a8 8 0 0 1 -8 8H9Z"/>';
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<g fill="' + O + '" stroke="' + O + '" stroke-width="5" stroke-linejoin="round">' + body + '</g>' +
      '<g fill="#5dbb5a">' + body + '</g>' +
      '<g stroke="#3f8f3f" stroke-width="2" stroke-linecap="round"><path d="M3 -60V-4"/><path d="M-20 -44V-32"/><path d="M24 -52V-34"/></g>' +
      '<g stroke="#9be58a" stroke-width="2" stroke-linecap="round"><path d="M-4 -60V-10"/></g>' +
      '<g stroke="#fff6d0" stroke-width="1.2" stroke-linecap="round"><path d="M-9 -46l-3 -1M-9 -18l-3 1M9 -50l3 -1M9 -12l3 1M-26 -38l-3 0M30 -44l3 0"/></g>' +
      '<g fill="#ff7aa8" stroke="' + O + '" stroke-width="1.4"><circle cx="-3" cy="-67" r="3"/><circle cx="3" cy="-67" r="3"/><circle cx="0" cy="-70" r="3"/></g><circle cx="0" cy="-67.5" r="1.3" fill="#ffe14d"/>' +
      '</g>';
  }
  function mesa(d, fill, shade, lines) {
    return '<path d="' + d + '" fill="' + fill + '" stroke="' + O + '" stroke-width="2.5" stroke-linejoin="round"/>' + (shade || '') + (lines || '');
  }
  function desert() {
    var r = rng(23), i, s = '';
    s += '<defs>' + lg('desert-sky', [[0, '#ff8fa6'], [0.5, '#ffb38a'], [1, '#ffe0a0']]) +
      lg('desert-sand', [[0, '#f7cf86'], [1, '#e8a860']]) +
      lg('desert-path', [[0, '#fde6b8'], [1, '#f0c98a']]) + '</defs>';
    s += '<rect width="400" height="300" fill="url(#desert-sky)"/>';
    s += '<circle cx="300" cy="92" r="46" fill="#fff3c4" opacity=".35"/><circle cx="300" cy="92" r="32" fill="#fff3c4"/>';
    s += cloud(90, 60, 0.9, '#fff4ef', '#ffc9c0') + cloud(230, 40, 0.6, '#fff4ef', '#ffc9c0') + cloud(370, 70, 0.7, '#fff4ef', '#ffc9c0');
    // distant mesas
    s += '<path d="M-10 170L20 170L28 140L90 140L98 170H160L170 152H210L218 170H260L270 128L350 128L360 170H410V200H-10Z" fill="#e89478"/>';
    s += '<path d="M28 150H90M270 140H350M270 152H350" stroke="#d97c62" stroke-width="3"/>';
    // near mesas
    s += mesa('M-10 196L-2 196L10 110L82 110L96 150L110 196Z', '#d4603f',
      '<path d="M50 110L82 110L96 150L110 196L60 196Z" fill="#b24a32"/>',
      '<path d="M4 132H86M0 152H94M-4 172H102" stroke="#a8412f" stroke-width="2.5"/><path d="M12 116H78" stroke="#f08a66" stroke-width="3"/>');
    s += mesa('M290 196L304 120L380 120L398 160L410 160V196Z', '#d4603f',
      '<path d="M350 120L380 120L398 160L410 160V196L340 196Z" fill="#b24a32"/>',
      '<path d="M300 140H386M296 160H410M294 178H410" stroke="#a8412f" stroke-width="2.5"/><path d="M308 126H376" stroke="#f08a66" stroke-width="3"/>');
    // sand
    s += '<path d="M-10 190Q80 180 180 188T410 186V310H-10Z" fill="url(#desert-sand)"/>';
    s += '<path d="M-10 190Q80 180 180 188T410 186" fill="none" stroke="#d99450" stroke-width="2"/>';
    for (i = 0; i < 8; i++) { var dx = r() * 400, dy = 198 + r() * 16; s += '<path d="M' + f(dx) + ' ' + f(dy) + 'q14 -4 28 0" fill="none" stroke="#e6a55c" stroke-width="1.8" stroke-linecap="round"/>'; }
    // path (stone slabs over sand)
    s += '<path d="' + PATH_D + '" fill="url(#desert-path)"/>';
    s += '<path d="' + PATH_TOP + '" fill="none" stroke="#d99a58" stroke-width="3"/>';
    s += '<path d="M-10 268C50 262 110 270 180 266C250 262 340 272 410 266" fill="none" stroke="#d99a58" stroke-width="3"/>';
    for (i = 0; i < 9; i++) {
      var px = -10 + i * 48 + r() * 8, py = 232 + r() * 14;
      s += '<path d="M' + f(px) + ' ' + f(py) + 'l30 -3l6 12l-28 4z" fill="#f3d39c" stroke="#caa06a" stroke-width="1.6" stroke-linejoin="round"/>';
    }
    s += pebbles(r, 22, 0, 400, 228, 264, ['#e0b070', '#fff3d6']);
    // rocks & bones
    s += '<g stroke="' + O + '" stroke-width="2" stroke-linejoin="round"><path d="M150 214l8 -12l14 2l6 10z" fill="#c9674a"/><path d="M252 212l6 -8l10 2l4 6z" fill="#c9674a"/></g>';
    s += '<path d="M155 206l6 -3" stroke="#e8906e" stroke-width="2"/>';
    s += '<g transform="translate(214 284)"><path d="M-12 0h24" stroke="' + O + '" stroke-width="6" stroke-linecap="round"/><path d="M-12 0h24" stroke="#fff6e6" stroke-width="3" stroke-linecap="round"/>' +
      '<g fill="#fff6e6" stroke="' + O + '" stroke-width="1.5"><circle cx="-13" cy="-2" r="3"/><circle cx="-13" cy="2" r="3"/><circle cx="13" cy="-2" r="3"/><circle cx="13" cy="2" r="3"/></g></g>';
    // cacti
    s += cactus(46, 214, 0.9) + cactus(358, 216, 0.75) + cactus(120, 208, 0.45);
    s += '<g transform="translate(260 292)">' + blob([[0, -8, 10]], '#5dbb5a', '#3f8f3f', 1.3, 'rgba(255,255,255,.3)') + '<path d="M-4 -16v14M4 -16v14" stroke="#3f8f3f" stroke-width="1.5"/><circle cx="0" cy="-18" r="3" fill="#ffe14d" stroke="' + O + '" stroke-width="1.2"/></g>';
    s += '<path d="M-10 280Q80 274 160 282T410 280V310H-10Z" fill="#e39d56"/>';
    s += cactus(10, 300, 0.7);
    return wrap(300, s);
  }

  /* ------------------------------------------------ SWAMP */
  function deadTree(x, y, s, col, sw) {
    var d = 'M-6 0C-4 -20 -8 -40 -4 -60C-12 -70 -24 -72 -30 -84M-4 -60C0 -76 8 -84 4 -100M-3 -46C8 -52 18 -50 26 -62M26 -62l8 -2M26 -62l-2 -8M-30 -84l-8 0M4 -100l6 -6M4 -100l-6 -4M6 0C4 -18 6 -34 2 -48';
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
      (sw ? '<path d="' + d + '" stroke="' + O + '" stroke-width="' + (sw + 4) + '"/>' : '') +
      '<path d="' + d + '" stroke="' + col + '" stroke-width="' + (sw || 6) + '"/>' +
      '<path d="M-10 0C-14 -4 -18 -2 -22 0M10 0C14 -4 18 -2 22 0" stroke="' + (sw ? O : col) + '" stroke-width="' + (sw ? sw + 2 : 5) + '"/>' +
      '</g>';
  }
  function tomb(x, y, s, kind) {
    var shape = kind === 1 ? '<path d="M-6 0V-26H-16V-36H-6V-48H6V-36H16V-26H6V0Z"/>' :
      kind === 2 ? '<path d="M-16 0V-22L-12 -34H12L16 -22V0Z"/>' :
      '<path d="M-15 0V-26A15 15 0 0 1 15 -26V0Z"/>';
    var det = kind === 0 ? '<path d="M-6 -30h12M0 -36v14" stroke="#6f767e" stroke-width="2.4" stroke-linecap="round"/><path d="M8 -12l-4 4l2 4" stroke="#5a6068" stroke-width="1.4" fill="none"/>' :
      kind === 2 ? '<path d="M-8 -22h16M-8 -16h12M-8 -10h14" stroke="#6f767e" stroke-width="2" stroke-linecap="round"/>' : '<path d="M0 -42v6" stroke="#6f767e" stroke-width="1.5"/>';
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<g fill="' + O + '" stroke="' + O + '" stroke-width="5" stroke-linejoin="round">' + shape + '</g>' +
      '<g fill="#a7afb8">' + shape + '</g>' +
      '<g fill="#7d858f" transform="translate(5 0)" opacity=".85" clip-path="none"><path d="M6 0V-20H10V0Z"/></g>' +
      det +
      '<path d="M-14 0q4 -8 10 -4q4 -6 10 -2q6 -2 8 6z" fill="#5f8f3a" stroke="' + O + '" stroke-width="1.5"/>' +
      '</g>';
  }
  function cauldron(x, y, s) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<path d="M-10 0l-4 8M10 0l4 8" stroke="' + O + '" stroke-width="4" stroke-linecap="round"/>' +
      '<g fill="#ff9d2a" stroke="' + O + '" stroke-width="1.5"><path d="M-10 8q-2 -8 4 -12q0 6 4 6q0 -8 6 -10q2 8 6 8q2 -4 0 -8q8 6 0 16z"/></g>' +
      '<path d="M-26 -22C-30 0 -18 8 0 8C18 8 30 0 26 -22Z" fill="#33303e" stroke="' + O + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M14 -18C18 -6 12 2 4 4" stroke="#57536a" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="0" cy="-22" rx="29" ry="7" fill="#2a2733" stroke="' + O + '" stroke-width="2.5"/>' +
      '<ellipse cx="0" cy="-22" rx="24" ry="4.5" fill="#8cff4a"/>' +
      '<ellipse cx="-6" cy="-23" rx="10" ry="2" fill="#d6ff9a"/>' +
      '<g fill="#a6ff5a" stroke="' + O + '" stroke-width="1.5"><circle cx="-8" cy="-30" r="5"/><circle cx="6" cy="-36" r="3.5"/><circle cx="12" cy="-28" r="4"/><circle cx="0" cy="-46" r="2.5"/></g>' +
      '<g fill="#fff" opacity=".8"><circle cx="-9.5" cy="-32" r="1.5"/><circle cx="5" cy="-37" r="1"/><circle cx="11" cy="-29.5" r="1.2"/></g>' +
      '<path d="M-26 -18q-6 2 -4 8M26 -18q6 2 4 8" stroke="' + O + '" stroke-width="2.5" fill="none"/>' +
      '</g>';
  }
  function swamp() {
    var r = rng(37), i, s = '';
    s += '<defs>' + lg('swamp-sky', [[0, '#1f2a2a'], [0.55, '#3f5a36'], [1, '#9fd45a']]) +
      lg('swamp-ground', [[0, '#5c7a3c'], [1, '#34492a']]) +
      lg('swamp-path', [[0, '#9a9a82'], [1, '#77775f']]) +
      rgr('swamp-glow', [[0, '#b8ff6a', 0.7], [1, '#b8ff6a', 0]]) + '</defs>';
    s += '<rect width="400" height="300" fill="url(#swamp-sky)"/>';
    for (i = 0; i < 24; i++) s += '<circle cx="' + f(r() * 400) + '" cy="' + f(r() * 110) + '" r="' + f(0.6 + r() * 1.1) + '" fill="#e6ffc0" opacity="' + f(0.4 + r() * 0.5) + '"/>';
    s += '<circle cx="96" cy="70" r="40" fill="#e6ffb0" opacity=".15"/><circle cx="96" cy="70" r="28" fill="#eaffc4"/>';
    s += '<g fill="#cfe89a"><circle cx="86" cy="62" r="5"/><circle cx="104" cy="78" r="4"/><circle cx="104" cy="60" r="2.5"/></g>';
    s += '<path d="M60 76q30 -8 70 -2" stroke="#4a5a3a" stroke-width="5" opacity=".4" fill="none" stroke-linecap="round"/>';
    // far silhouettes
    s += '<path d="M-10 178Q60 150 140 168T290 160T410 166V200H-10Z" fill="#2f4428"/>';
    s += deadTree(40, 180, 0.8, '#243420') + deadTree(250, 176, 0.9, '#243420') + deadTree(350, 184, 0.6, '#243420');
    for (i = 0; i < 7; i++) s += '<g transform="translate(' + f(20 + i * 60 + r() * 20) + ' ' + f(180 + r() * 6) + ') scale(.6)"><path d="M-8 0V-18A8 8 0 0 1 8 -18V0Z" fill="#2a3c24"/></g>';
    // ground
    s += '<path d="M-10 190Q100 182 200 190T410 188V310H-10Z" fill="url(#swamp-ground)"/>';
    s += '<path d="M-10 190Q100 182 200 190T410 188" fill="none" stroke="#7fa84a" stroke-width="2"/>';
    // toxic pools
    function pool(x, y, rx) {
      return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + (rx * 1.6) + '" ry="' + (rx * 0.5) + '" fill="url(#swamp-glow)"/>' +
        '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + (rx * 0.28) + '" fill="#7ee83a" stroke="' + O + '" stroke-width="2"/>' +
        '<ellipse cx="' + (x - rx * 0.2) + '" cy="' + (y - rx * 0.06) + '" rx="' + (rx * 0.55) + '" ry="' + (rx * 0.1) + '" fill="#c8ff8a"/>' +
        '<g fill="#b4ff6a" stroke="' + O + '" stroke-width="1.2"><circle cx="' + (x + rx * 0.4) + '" cy="' + (y - 3) + '" r="3"/><circle cx="' + (x - rx * 0.5) + '" cy="' + (y - 2) + '" r="2"/></g>';
    }
    s += pool(200, 204, 28) + pool(60, 280, 34) + pool(350, 284, 26);
    // tombstones back row
    s += tomb(110, 212, 0.9, 0) + tomb(150, 208, 0.7, 1) + tomb(266, 210, 0.85, 2) + tomb(300, 206, 0.6, 0);
    // cauldrons
    s += cauldron(40, 214, 0.9) + cauldron(362, 216, 1);
    // near dead tree
    s += deadTree(390, 222, 0.7, '#5a4632', 4);
    // stone path
    s += '<path d="' + PATH_D + '" fill="#4a5f30"/>';
    for (i = 0; i < 12; i++) {
      var px = -12 + i * 36 + r() * 6, py = 226 + r() * 8, w = 28 + r() * 6, h = 30 + r() * 6;
      s += '<path d="M' + f(px) + ' ' + f(py + 4) + 'q' + f(w / 2) + ' -6 ' + f(w) + ' 0l2 ' + f(h - 8) + 'q' + f(-w / 2) + ' 6 ' + f(-w - 4) + ' 0z" fill="url(#swamp-path)" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/>';
      s += '<path d="M' + f(px + 4) + ' ' + f(py + 6) + 'q' + f(w / 3) + ' -3 ' + f(w * 0.6) + ' 0" stroke="#c4c4a8" stroke-width="2" fill="none" stroke-linecap="round"/>';
      if (i % 3 === 0) s += '<path d="M' + f(px + w * 0.5) + ' ' + f(py + 10) + 'l4 8l-3 6" stroke="#55553f" stroke-width="1.3" fill="none"/>';
      if (i % 2 === 1) s += '<ellipse cx="' + f(px + 6) + '" cy="' + f(py + h - 6) + '" rx="6" ry="2.5" fill="#6f9a3a"/>';
    }
    // front tombstones
    s += tomb(16, 300, 1.1, 0) + tomb(392, 302, 1.2, 1) + tomb(236, 296, 0.7, 2);
    // fog
    for (i = 0; i < 8; i++) s += '<ellipse cx="' + f(r() * 400) + '" cy="' + f(196 + r() * 90) + '" rx="' + f(40 + r() * 40) + '" ry="' + f(5 + r() * 5) + '" fill="#dfffc0" opacity=".13"/>';
    // wisps
    for (i = 0; i < 6; i++) { var wx = r() * 400, wy = 120 + r() * 70; s += '<circle cx="' + f(wx) + '" cy="' + f(wy) + '" r="5" fill="#b8ff6a" opacity=".25"/><circle cx="' + f(wx) + '" cy="' + f(wy) + '" r="2" fill="#eaffc4"/>'; }
    return wrap(300, s);
  }

  /* ------------------------------------------------ SNOW */
  function pine(x, y, s, c1, c2) {
    var t = '';
    var tiers = [[0, 34, 30], [-18, 28, 26], [-34, 22, 22]];
    t += '<path d="M-5 0V12H5V0Z" fill="#8a5a36" stroke="' + O + '" stroke-width="2"/>';
    for (var i = 0; i < 3; i++) {
      var b = tiers[i][0], w = tiers[i][1], h = tiers[i][2];
      var d = 'M' + (-w) + ' ' + (b + 4) + 'L0 ' + (b - h - 6) + 'L' + w + ' ' + (b + 4) + 'Q0 ' + (b - 2) + ' ' + (-w) + ' ' + (b + 4) + 'Z';
      t += '<path d="' + d + '" fill="' + c1 + '" stroke="' + O + '" stroke-width="2.5" stroke-linejoin="round"/>';
      t += '<path d="M0 ' + (b - h - 6) + 'L' + w + ' ' + (b + 4) + 'Q' + (w * 0.5) + ' ' + (b) + ' 0 ' + b + 'Z" fill="' + c2 + '"/>';
      t += '<path d="M' + (-w * 0.45) + ' ' + (b - h * 0.45) + 'L0 ' + (b - h - 6) + 'L' + (w * 0.45) + ' ' + (b - h * 0.45) + 'q-6 5 -10 1q-5 5 -10 0q-4 4 -8 -1z" fill="#fff" stroke="' + O + '" stroke-width="1.5" stroke-linejoin="round"/>';
    }
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' + t + '</g>';
  }
  function snow() {
    var r = rng(53), i, s = '';
    s += '<defs>' + lg('snow-sky', [[0, '#7cc4f2'], [0.7, '#c8e9ff'], [1, '#eef9ff']]) +
      lg('snow-ground', [[0, '#f6fcff'], [1, '#d4e8f5']]) +
      lg('snow-path', [[0, '#d7e4ee'], [1, '#bdd0e0']]) + '</defs>';
    s += '<rect width="400" height="300" fill="url(#snow-sky)"/>';
    s += cloud(60, 44, 0.7) + cloud(300, 30, 0.8);
    // far mountains
    s += '<path d="M-10 180L50 96L96 150L150 70L220 160L270 104L330 150L372 90L410 130V200H-10Z" fill="#a9c6e2"/>';
    s += '<path d="M50 96L64 116L56 114L48 122L40 110ZM150 70L170 98L160 94L150 104L140 94L130 98ZM270 104L284 122L270 118L262 124ZM372 90L390 112L378 110L370 118L360 108Z" fill="#fff"/>';
    // near mountains
    s += '<path d="M-10 196L70 118L130 176L200 110L280 184L330 140L410 196Z" fill="#8fb1d4" stroke="' + O + '" stroke-width="2.5" stroke-linejoin="round"/>';
    s += '<path d="M200 110L280 184L230 184L214 150Z M70 118L130 176L96 176L84 144Z M330 140L410 196L360 196Z" fill="#7597bf"/>';
    s += '<path d="M70 118L92 140L82 136L74 146L66 136L56 140L50 138Z" fill="#fff" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/>';
    s += '<path d="M200 110L226 136L214 132L206 144L196 132L184 138L178 132Z" fill="#fff" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/>';
    s += '<path d="M330 140L348 158L338 156L330 164L322 154L314 158Z" fill="#fff" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/>';
    // back pines
    for (i = 0; i < 9; i++) s += pine(f(i * 48 + r() * 16 - 8), f(186 + r() * 4), f(0.4 + r() * 0.12), '#3e8f6a', '#2b6e52');
    // snowfield
    s += '<path d="M-10 190Q100 180 200 190T410 186V310H-10Z" fill="url(#snow-ground)"/>';
    s += '<path d="M-10 190Q100 180 200 190T410 186" fill="none" stroke="#b9d4e8" stroke-width="2"/>';
    // side pines (mid)
    s += pine(30, 208, 0.95, '#3a9a6e', '#276e50') + pine(372, 210, 1.05, '#3a9a6e', '#276e50') + pine(78, 202, 0.6, '#3a9a6e', '#276e50');
    // snowman
    s += '<g transform="translate(320 214)">' +
      blob([[0, -8, 11], [0, -26, 8]], '#fff', '#d6e8f5', 1.3) +
      '<g fill="' + O + '"><circle cx="2" cy="-28" r="1.3"/><circle cx="6" cy="-28" r="1.3"/><circle cx="1" cy="-10" r="1.1"/><circle cx="1" cy="-4" r="1.1"/></g>' +
      '<path d="M5 -25l8 1l-8 2z" fill="#ff8a2a" stroke="' + O + '" stroke-width="1"/>' +
      '<path d="M-8 -19q8 4 16 0" stroke="#e03a4a" stroke-width="3.5" fill="none" stroke-linecap="round"/>' +
      '<path d="M-10 -12l-8 -6M10 -12l8 -8" stroke="#6b4020" stroke-width="1.8" stroke-linecap="round"/>' +
      '<path d="M-6 -32h12v-8h-12z" fill="#34475e" stroke="' + O + '" stroke-width="1.5"/><path d="M-9 -32h18" stroke="' + O + '" stroke-width="2.5" stroke-linecap="round"/></g>';
    // drifts
    for (i = 0; i < 6; i++) { var dx = r() * 400; s += '<path d="M' + f(dx - 20) + ' 212q20 -10 40 0" fill="#fff" stroke="#c6dcec" stroke-width="1.5"/>'; }
    // path
    s += '<path d="' + PATH_D + '" fill="url(#snow-path)"/>';
    s += '<path d="' + PATH_TOP + '" fill="none" stroke="#fff" stroke-width="4"/>';
    s += '<path d="' + PATH_TOP + '" fill="none" stroke="#a8c2d8" stroke-width="1.5" transform="translate(0 3)"/>';
    for (i = 0; i < 10; i++) {
      var px = 10 + i * 40 + r() * 10, py = 236 + r() * 18;
      s += '<ellipse cx="' + f(px) + '" cy="' + f(py) + '" rx="' + f(10 + r() * 6) + '" ry="4.5" fill="#9fc4e0" stroke="#7aa6c8" stroke-width="1.5"/><ellipse cx="' + f(px - 3) + '" cy="' + f(py - 1.5) + '" rx="4" ry="1.2" fill="#e8f6ff"/>';
    }
    for (i = 0; i < 8; i++) { var fx = 20 + i * 50 + r() * 10; s += '<g fill="#a9c2d6"><ellipse cx="' + f(fx) + '" cy="' + f(248 + (i % 2) * 8) + '" rx="2.5" ry="4" transform="rotate(80 ' + f(fx) + ' ' + f(248 + (i % 2) * 8) + ')"/></g>'; }
    s += '<path d="M-10 272C60 266 120 274 200 270C280 266 340 276 410 270V310H-10Z" fill="#fff"/>';
    s += '<path d="M-10 272C60 266 120 274 200 270C280 266 340 276 410 270" fill="none" stroke="#c6dcec" stroke-width="2"/>';
    // ice crystals
    function crystal(x, y, sc) {
      return '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')" stroke="' + O + '" stroke-width="2" stroke-linejoin="round">' +
        '<path d="M-10 0L-14 -16L-8 -22L-4 0Z" fill="#9fe6ff"/><path d="M-4 0L0 -30L6 -26L6 0Z" fill="#c8f4ff"/><path d="M6 0L10 -14L16 -10L12 0Z" fill="#7fd4f5"/>' +
        '<path d="M0 -24L2 -6" stroke="#fff" stroke-width="1.5"/></g>';
    }
    s += crystal(150, 290, 0.9) + crystal(250, 294, 0.7) + pine(8, 300, 0.9, '#3a9a6e', '#276e50') + pine(396, 302, 0.8, '#3a9a6e', '#276e50');
    for (i = 0; i < 40; i++) s += '<circle cx="' + f(r() * 400) + '" cy="' + f(r() * 300) + '" r="' + f(0.8 + r() * 1.8) + '" fill="#fff" opacity="' + f(0.6 + r() * 0.4) + '"/>';
    return wrap(300, s);
  }

  /* ------------------------------------------------ VOLCANO */
  function rock(x, y, s, c1, c2) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<path d="M-20 0L-16 -18L-4 -30L10 -24L20 -8L22 0Z" fill="' + c1 + '" stroke="' + O + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M-4 -30L10 -24L20 -8L22 0L2 0L4 -16Z" fill="' + c2 + '"/>' +
      '<path d="M-14 -16L-4 -26" stroke="#7a5f66" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M4 -16l-6 8l4 8" stroke="#ff7a2a" stroke-width="1.5" fill="none"/></g>';
  }
  function volcano() {
    var r = rng(71), i, s = '';
    s += '<defs>' + lg('volcano-sky', [[0, '#240d1c'], [0.45, '#6b1a22'], [1, '#e3582a']]) +
      lg('volcano-ground', [[0, '#4a3434'], [1, '#221a1c']]) +
      lg('volcano-lava', [[0, '#ffe46a'], [0.5, '#ff8a1f'], [1, '#e0361a']]) +
      lg('volcano-path', [[0, '#7a6660'], [1, '#5a4a46']]) +
      rgr('volcano-glow', [[0, '#ffb13a', 0.8], [1, '#ff5a1a', 0]]) + '</defs>';
    s += '<rect width="400" height="300" fill="url(#volcano-sky)"/>';
    // eruption glow + smoke
    s += '<ellipse cx="220" cy="60" rx="110" ry="70" fill="url(#volcano-glow)" opacity=".7"/>';
    s += '<g fill="#3a2230" opacity=".9">' + '<circle cx="200" cy="40" r="22"/><circle cx="230" cy="28" r="26"/><circle cx="262" cy="42" r="18"/><circle cx="180" cy="20" r="16"/><circle cx="250" cy="10" r="20"/></g>';
    s += '<g fill="#52303c" opacity=".9"><circle cx="210" cy="36" r="12"/><circle cx="238" cy="22" r="14"/></g>';
    // volcano cone
    s += '<path d="M90 190L190 72L250 72L350 190Z" fill="#3b2a30" stroke="' + O + '" stroke-width="2.5" stroke-linejoin="round"/>';
    s += '<path d="M220 72L250 72L350 190L260 190Z" fill="#2c1f25"/>';
    s += '<ellipse cx="220" cy="72" rx="30" ry="6" fill="#ff8a1f" stroke="' + O + '" stroke-width="2"/>';
    s += '<path d="M204 74C200 100 214 116 206 140C200 160 212 176 208 190L222 190C226 170 214 156 222 136C230 112 220 96 226 74Z" fill="url(#volcano-lava)" stroke="' + O + '" stroke-width="2"/>';
    s += '<path d="M238 74C244 92 262 104 262 124L270 124C270 100 252 90 246 74Z" fill="url(#volcano-lava)" stroke="' + O + '" stroke-width="1.6"/>';
    // lava blobs flying
    s += '<g fill="#ffb13a" stroke="' + O + '" stroke-width="1.5"><circle cx="200" cy="54" r="4"/><circle cx="244" cy="48" r="3.5"/><circle cx="222" cy="40" r="3"/></g>';
    // side ridges
    s += '<path d="M-10 190L-10 130L30 110L70 150L110 190Z" fill="#2c2024" stroke="' + O + '" stroke-width="2.5" stroke-linejoin="round"/>';
    s += '<path d="M290 190L340 120L380 136L410 118V190Z" fill="#2c2024" stroke="' + O + '" stroke-width="2.5" stroke-linejoin="round"/>';
    s += '<path d="M30 110L70 150L50 150Z M340 120L380 136L360 150Z" fill="#43313a"/>';
    // ground
    s += '<path d="M-10 190Q100 184 200 190T410 188V310H-10Z" fill="url(#volcano-ground)"/>';
    s += '<path d="M-10 190Q100 184 200 190T410 188" fill="none" stroke="#6b4a44" stroke-width="2"/>';
    // lava river (back)
    s += '<path d="M-10 206C60 198 120 212 190 204C260 196 330 210 410 202L410 212C330 220 260 206 190 214C120 222 60 208 -10 216Z" fill="url(#volcano-lava)" stroke="' + O + '" stroke-width="2"/>';
    s += '<path d="M20 208q20 -3 40 0M150 208q20 -4 36 -2M280 206q20 -3 40 0" stroke="#fff3a0" stroke-width="2" fill="none" stroke-linecap="round"/>';
    s += '<path d="M-10 212C60 204 120 218 190 210C260 202 330 216 410 208" stroke="#ffd04a" stroke-width="10" opacity=".25" fill="none"/>';
    // rocks
    s += rock(30, 224, 1, '#4a3a40', '#33262c') + rock(120, 222, 0.6, '#4a3a40', '#33262c') + rock(300, 224, 0.75, '#4a3a40', '#33262c') + rock(378, 226, 1.1, '#4a3a40', '#33262c');
    // path: cracked basalt slabs with glowing seams
    s += '<path d="' + PATH_D + '" fill="#ff7a1f"/>';
    for (i = 0; i < 11; i++) {
      var px = -14 + i * 39 + r() * 4, py = 224 + r() * 4, w = 35, h = 40;
      s += '<path d="M' + f(px) + ' ' + f(py + 2) + 'l' + w + ' -2l2 ' + f(h - 4) + 'l' + (-w - 2) + ' 4z" fill="url(#volcano-path)" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/>';
      s += '<path d="M' + f(px + 3) + ' ' + f(py + 5) + 'h' + (w - 8) + '" stroke="#9a8680" stroke-width="2" stroke-linecap="round"/>';
      if (i % 2 === 0) s += '<path d="M' + f(px + 10) + ' ' + f(py + 12) + 'l6 8l-2 8l6 6" stroke="#ff9a2a" stroke-width="1.6" fill="none"/>';
    }
    // foreground
    s += '<path d="M-10 276Q80 268 160 278T410 274V310H-10Z" fill="#1e1618"/>';
    s += '<path d="M60 290C90 282 140 296 180 288" stroke="url(#volcano-lava)" stroke-width="6" fill="none" stroke-linecap="round"/>';
    s += rock(10, 300, 1.3, '#3a2e32', '#262024') + rock(392, 302, 1.2, '#3a2e32', '#262024');
    s += '<g stroke="' + O + '" stroke-width="2" stroke-linejoin="round"><path d="M250 296l6 -22l6 10l4 -14l6 26z" fill="#ff5a6a"/><path d="M256 296l3 -12l3 6l3 -6l3 12z" fill="#ffb0b8" stroke="none"/></g>';
    // embers
    for (i = 0; i < 40; i++) {
      var ex = r() * 400, ey = r() * 290, er = 0.8 + r() * 2;
      s += '<circle cx="' + f(ex) + '" cy="' + f(ey) + '" r="' + f(er * 2.2) + '" fill="#ff8a2a" opacity=".2"/><circle cx="' + f(ex) + '" cy="' + f(ey) + '" r="' + f(er) + '" fill="' + (i % 3 ? '#ffb13a' : '#fff0a0') + '"/>';
    }
    return wrap(300, s);
  }

  /* ------------------------------------------------ CAMP (400x500) */
  function platform(x, y, s, r) {
    var st = '';
    for (var i = 0; i < 7; i++) {
      var a = (Math.PI * 2 / 7) * i + 0.3;
      st += '<path d="M' + f(x + Math.cos(a) * 24 * s) + ' ' + f(y + Math.sin(a) * 7 * s) + 'l' + f(10 * s) + ' ' + f(2 * s) + '" stroke="#9c9486" stroke-width="1.5" stroke-linecap="round"/>';
    }
    return '<ellipse cx="' + x + '" cy="' + (y + 16 * s) + '" rx="' + (60 * s) + '" ry="' + (14 * s) + '" fill="#000" opacity=".18"/>' +
      '<path d="M' + (x - 50 * s) + ' ' + y + 'V' + (y + 10 * s) + 'C' + (x - 50 * s) + ' ' + (y + 30 * s) + ' ' + (x + 50 * s) + ' ' + (y + 30 * s) + ' ' + (x + 50 * s) + ' ' + (y + 10 * s) + 'V' + y + 'Z" fill="#8f8577" stroke="' + O + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M' + (x - 30 * s) + ' ' + (y + 12 * s) + 'v' + (10 * s) + 'M' + x + ' ' + (y + 16 * s) + 'v' + (10 * s) + 'M' + (x + 30 * s) + ' ' + (y + 12 * s) + 'v' + (10 * s) + '" stroke="#6f665b" stroke-width="2"/>' +
      '<ellipse cx="' + x + '" cy="' + y + '" rx="' + (50 * s) + '" ry="' + (14 * s) + '" fill="#d4ccbe" stroke="' + O + '" stroke-width="2.5"/>' +
      '<ellipse cx="' + x + '" cy="' + (y - 1 * s) + '" rx="' + (40 * s) + '" ry="' + (9 * s) + '" fill="#e6dfd2"/>' +
      '<ellipse cx="' + x + '" cy="' + y + '" rx="' + (24 * s) + '" ry="' + (5 * s) + '" fill="none" stroke="#bdb3a3" stroke-width="1.5"/>' +
      st +
      '<path d="M' + (x - 50 * s) + ' ' + (y + 6 * s) + 'q' + (6 * s) + ' ' + (-8 * s) + ' ' + (14 * s) + ' ' + (-2 * s) + 'q' + (4 * s) + ' ' + (8 * s) + ' ' + (-14 * s) + ' ' + (2 * s) + 'z" fill="#6cbf45" stroke="' + O + '" stroke-width="1.5"/>' +
      '<path d="M' + (x + 36 * s) + ' ' + (y + 10 * s) + 'q' + (8 * s) + ' ' + (-8 * s) + ' ' + (14 * s) + ' ' + (-4 * s) + 'v' + (4 * s) + 'q' + (-6 * s) + ' ' + (6 * s) + ' ' + (-14 * s) + ' 0z" fill="#6cbf45" stroke="' + O + '" stroke-width="1.5"/>';
  }
  function camp() {
    var r = rng(97), i, s = '';
    s += '<defs>' + lg('camp-sky', [[0, '#62c2f5'], [0.8, '#c8eeff'], [1, '#eafaff']]) +
      lg('camp-grass', [[0, '#96da62'], [1, '#62b443']]) +
      lg('camp-path', [[0, '#f4d9a0'], [1, '#e2bb78']]) +
      rgr('camp-fireglow', [[0, '#ffd04a', 0.55], [1, '#ffb13a', 0]]) + '</defs>';
    s += '<rect width="400" height="500" fill="url(#camp-sky)"/>';
    s += '<circle cx="330" cy="70" r="28" fill="#fff7c2"/><circle cx="330" cy="70" r="44" fill="#fff7c2" opacity=".3"/>';
    s += cloud(70, 70, 1) + cloud(230, 50, 0.7) + cloud(390, 120, 0.6);
    s += '<path d="M-10 190Q60 130 140 170T280 150T410 160V240H-10Z" fill="#a6dcb0"/>';
    s += '<path d="M-10 206Q80 170 170 196T330 186T410 190V240H-10Z" fill="#7cc58c"/>';
    for (i = 0; i < 22; i++) { var tx = i * 19 + r() * 8, ty = 206 + r() * 6, tr = 11 + r() * 8; s += '<circle cx="' + f(tx) + '" cy="' + f(ty) + '" r="' + f(tr) + '" fill="#4f9f5e"/><circle cx="' + f(tx - 3) + '" cy="' + f(ty - 4) + '" r="' + f(tr * 0.45) + '" fill="#63b570"/>'; }
    s += roundTree(24, 226, 1.1, '#58b84a', '#3d8f3a', '#8ada6a') + roundTree(384, 228, 1.2, '#58b84a', '#3d8f3a', '#8ada6a');
    // meadow
    s += '<path d="M-10 218Q100 208 200 216T410 214V510H-10Z" fill="url(#camp-grass)"/>';
    s += '<path d="M-10 218Q100 208 200 216T410 214" fill="none" stroke="#4e9a36" stroke-width="2"/>';
    // mow stripes
    for (i = 0; i < 5; i++) s += '<path d="M-10 ' + (262 + i * 50) + 'Q200 ' + (252 + i * 50) + ' 410 ' + (262 + i * 50) + 'V' + (284 + i * 50) + 'Q200 ' + (274 + i * 50) + ' -10 ' + (284 + i * 50) + 'Z" fill="#fff" opacity=".06"/>';
    // winding path
    s += '<path d="M170 510C160 460 230 440 220 400C212 360 150 350 160 310C168 280 210 270 200 240L226 240C236 272 196 286 190 312C182 346 246 356 252 400C258 446 196 466 214 510Z" fill="url(#camp-path)" stroke="#c99a58" stroke-width="2.5"/>';
    s += pebbles(r, 20, 180, 240, 250, 500, ['#d6ae6c', '#fff0c8']);
    // fence back right
    for (i = 0; i < 5; i++) s += fencePost(270 + i * 22, 240);
    s += '<path d="M262 220L360 220M262 230L360 230" stroke="' + O + '" stroke-width="6" stroke-linecap="round"/><path d="M262 220L360 220M262 230L360 230" stroke="#d9a066" stroke-width="3.2" stroke-linecap="round"/>';
    // tent
    s += '<g transform="translate(92 262)">' +
      '<path d="M-62 0L0 -76L62 0Z" fill="#ff8a5c" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M0 -76L62 0H30Z" fill="#e0603a"/>' +
      '<path d="M-40 0L-15 -45M40 0L15 -45" stroke="#fff3d6" stroke-width="5"/>' +
      '<path d="M-20 0L0 -46L20 0Z" fill="#6b3a2a" stroke="' + O + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M0 -46L-24 0L-30 0L-6 -44Z" fill="#ffb088" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M0 -46L22 0L28 0L6 -44Z" fill="#ffb088" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M0 -76V-100" stroke="' + O + '" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M0 -100L20 -94L0 -88Z" fill="#ffd93b" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M-62 0L-72 6M62 0L72 6" stroke="' + O + '" stroke-width="2"/><circle cx="-72" cy="6" r="2" fill="#8a5a36"/><circle cx="72" cy="6" r="2" fill="#8a5a36"/>' +
      '<path d="M-50 -8l4 4M-36 -24l4 4" stroke="#c94a2a" stroke-width="1.5" stroke-dasharray="2 2"/>' +
      '</g>';
    // campfire
    s += '<g transform="translate(300 290)">' +
      '<ellipse cx="0" cy="-10" rx="46" ry="30" fill="url(#camp-fireglow)"/>' +
      '<g fill="#9aa0a6" stroke="' + O + '" stroke-width="2"><ellipse cx="-20" cy="2" rx="7" ry="5"/><ellipse cx="-8" cy="6" rx="7" ry="5"/><ellipse cx="8" cy="6" rx="7" ry="5"/><ellipse cx="20" cy="2" rx="7" ry="5"/></g>' +
      '<path d="M-18 -2L16 -10M-16 -10L18 -2" stroke="' + O + '" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M-18 -2L16 -10M-16 -10L18 -2" stroke="#a0643a" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M0 -12C-14 -14 -12 -28 -6 -34C-6 -28 -2 -26 -2 -26C-4 -36 2 -46 8 -48C6 -40 14 -34 12 -22C12 -14 6 -12 0 -12Z" fill="#ff7a1f" stroke="' + O + '" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<path d="M1 -13C-6 -14 -6 -22 -2 -26C0 -22 3 -22 3 -22C3 -30 6 -34 8 -36C8 -28 10 -24 8 -18C7 -14 4 -13 1 -13Z" fill="#ffe14d"/>' +
      '<g fill="#ffb13a"><circle cx="-10" cy="-44" r="1.5"/><circle cx="14" cy="-54" r="1.2"/><circle cx="4" cy="-60" r="1"/></g>' +
      '</g>';
    // log bench
    s += '<g transform="translate(250 312)"><path d="M-22 -8H18a6 8 0 0 1 0 16H-22Z" fill="#b97a45" stroke="' + O + '" stroke-width="2.5"/><ellipse cx="-22" cy="0" rx="6" ry="8" fill="#e8c08a" stroke="' + O + '" stroke-width="2.5"/><ellipse cx="-22" cy="0" rx="2.5" ry="3.5" fill="none" stroke="#b97a45" stroke-width="1.2"/><path d="M-10 -4h20" stroke="#8a5a30" stroke-width="1.5"/></g>';
    // lantern string
    s += '<path d="M24 160Q120 200 200 176T384 162" fill="none" stroke="' + O + '" stroke-width="1.5"/>';
    var lx = [[70, 178], [130, 188], [200, 176], [262, 170], [330, 168]], lc = ['#ff8fb8', '#ffd93b', '#8fd3ff', '#b58cff', '#7bd65a'];
    for (i = 0; i < lx.length; i++) s += '<g transform="translate(' + lx[i][0] + ' ' + lx[i][1] + ')"><path d="M0 0v4" stroke="' + O + '" stroke-width="1.2"/><path d="M-6 4h12l-2 12h-8z" fill="' + lc[i] + '" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/><circle cx="0" cy="10" r="10" fill="' + lc[i] + '" opacity=".2"/><path d="M-2 6v8" stroke="#fff" stroke-width="1.5" opacity=".7"/></g>';
    // stone pet platforms
    s += platform(100, 350, 1.05) + platform(300, 350, 1.05) + platform(200, 410, 1.15) + platform(96, 460, 1) + platform(304, 460, 1);
    // flowers & tufts & mushrooms
    for (i = 0; i < 30; i++) {
      var fx = r() * 400, fy = 240 + r() * 250;
      if (fx > 150 && fx < 260) continue;
      s += i % 3 ? tuft(f(fx), f(fy), '#4e9a36') : smallFlower(f(fx), f(fy), ['#ff8fb8', '#fff', '#ffd93b', '#b58cff'][i % 4]);
    }
    s += '<g transform="translate(26 400)"><path d="M-4 0V-8H4V0Z" fill="#fff3da" stroke="' + O + '" stroke-width="2"/><path d="M-10 -8C-10 -18 10 -18 10 -8Z" fill="#ff4d5e" stroke="' + O + '" stroke-width="2"/><g fill="#fff"><circle cx="-4" cy="-12" r="1.6"/><circle cx="4" cy="-11" r="1.3"/></g></g>';
    s += '<g transform="translate(376 396)"><path d="M-4 0V-8H4V0Z" fill="#fff3da" stroke="' + O + '" stroke-width="2"/><path d="M-10 -8C-10 -18 10 -18 10 -8Z" fill="#b58cff" stroke="' + O + '" stroke-width="2"/><g fill="#fff"><circle cx="-4" cy="-12" r="1.6"/><circle cx="4" cy="-11" r="1.3"/></g></g>';
    s += bush(16, 506, 1.4, '#5fbf4a', '#3f933a', '#ff4d5e') + bush(388, 508, 1.3, '#5fbf4a', '#3f933a', '#ffd93b');
    s += bush(180, 232, 0.6, '#6cc452', '#46993d', '#ff8fb8');
    for (i = 0; i < 10; i++) s += '<circle cx="' + f(r() * 400) + '" cy="' + f(100 + r() * 120) + '" r="' + f(1 + r() * 1.5) + '" fill="#fffbe0" opacity=".8"/>';
    return wrap(500, s);
  }

  window.SCENES = {
    forest: { name: 'Whispering Woods', sky: '#6ccaf7', svg: forest },
    desert: { name: 'Sunset Mesa', sky: '#ff8fa6', svg: desert },
    swamp: { name: 'Toxic Graveyard', sky: '#1f2a2a', svg: swamp },
    snow: { name: 'Frostpeak Pass', sky: '#7cc4f2', svg: snow },
    volcano: { name: 'Ember Caldera', sky: '#240d1c', svg: volcano },
    camp: { name: 'Pet Camp', sky: '#62c2f5', svg: camp }
  };
})();

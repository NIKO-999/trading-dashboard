/* Hero Go! — Chapter 9 "Demon Gate" art: scene `hell`, mobs imp / hellhound / cultist,
 * elite warlock, boss demonlord. Adds to window.ENEMIES / window.SCENES (does not replace).
 */
(function () {
  'use strict';
  var O = '#2b1d14';

  function S(w) { return 'stroke="' + O + '" stroke-width="' + (w || 3.5) + '" stroke-linejoin="round" stroke-linecap="round"'; }
  function f(n) { return Math.round(n * 10) / 10; }
  function stops(a) { return a.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join(''); }
  function lg(id, a, x1, y1, x2, y2) {
    return '<linearGradient id="' + id + '" x1="' + (x1 == null ? 0 : x1) + '" y1="' + (y1 == null ? 0 : y1) + '" x2="' + (x2 == null ? 0 : x2) + '" y2="' + (y2 == null ? 1 : y2) + '">' + stops(a) + '</linearGradient>';
  }
  function rg(id, a, cx, cy, r) {
    return '<radialGradient id="' + id + '" cx="' + (cx == null ? 0.5 : cx) + '" cy="' + (cy == null ? 0.5 : cy) + '" r="' + (r == null ? 0.5 : r) + '">' + stops(a) + '</radialGradient>';
  }
  function shadow(rx, cx, op) {
    cx = cx == null ? 100 : cx;
    return '<g class="part-shadow"><ellipse cx="' + cx + '" cy="190" rx="' + rx + '" ry="' + f(4 + rx * 0.1) + '" fill="#000" opacity="' + (op == null ? 0.28 : op) + '"/></g>';
  }
  function wrap(defs, sh, body) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs>' + defs + '</defs>' + sh + '<g class="part-body">' + body + '</g></svg>';
  }
  // glossy eye: dark socket, coloured glow, highlights
  function eye(x, y, rx, ry, col, pupil) {
    var s = '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + O + '"/>';
    s += '<ellipse cx="' + f(x - rx * 0.1) + '" cy="' + f(y + ry * 0.1) + '" rx="' + f(rx * 0.78) + '" ry="' + f(ry * 0.78) + '" fill="' + col + '"/>';
    if (pupil) s += '<ellipse cx="' + f(x - rx * 0.1) + '" cy="' + y + '" rx="' + f(rx * 0.2) + '" ry="' + f(ry * 0.72) + '" fill="' + O + '"/>';
    s += '<ellipse cx="' + f(x - rx * 0.38) + '" cy="' + f(y - ry * 0.38) + '" rx="' + f(rx * 0.3) + '" ry="' + f(ry * 0.26) + '" fill="#fff"/>';
    s += '<circle cx="' + f(x + rx * 0.4) + '" cy="' + f(y + ry * 0.42) + '" r="' + f(rx * 0.14) + '" fill="#fff" opacity=".85"/>';
    return s;
  }
  // three-layer flame, base (x,y), tip up
  function flame1(x, y, w, h, fill, lean, sw) {
    lean = lean || 0;
    return '<path d="M' + f(x - w) + ' ' + y + 'C' + f(x - w) + ' ' + f(y - h * 0.45) + ' ' + f(x - w * 0.3 + lean * 0.4) + ' ' + f(y - h * 0.55) + ' ' + f(x + lean) + ' ' + f(y - h) +
      'C' + f(x + w * 0.15 + lean * 0.5) + ' ' + f(y - h * 0.6) + ' ' + f(x + w) + ' ' + f(y - h * 0.45) + ' ' + f(x + w) + ' ' + y + 'Z" fill="' + fill + '"' + (sw ? ' ' + S(sw) : '') + '/>';
  }
  var FIRE = ['#e8321a', '#ff8a1f', '#ffe36a'];
  var PFIRE = ['#5a1fb8', '#a04cff', '#f0d4ff'];
  function fire(x, y, w, h, lean, sw, pal) {
    pal = pal || FIRE;
    return flame1(x, y, w, h, pal[0], lean, sw == null ? 2.5 : sw) + flame1(x, y, w * 0.66, h * 0.72, pal[1], lean * 0.7) + flame1(x, y, w * 0.34, h * 0.42, pal[2], lean * 0.4);
  }
  function skull(x, y, s, fill) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M-10 0C-13 -14 -6 -20 0 -20C6 -20 13 -14 10 0C10 4 7 6 6 8L6 12L-6 12L-6 8C-7 6 -10 4 -10 0Z" fill="' + (fill || '#f2ead6') + '" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<ellipse cx="-4.5" cy="-2" rx="3.2" ry="3.8" fill="' + O + '"/><ellipse cx="4.5" cy="-2" rx="3.2" ry="3.8" fill="' + O + '"/><path d="M0 3L-2 7L2 7Z" fill="' + O + '"/>' +
      '<path d="M-3 8V12M0 8V12M3 8V12" stroke="' + O + '" stroke-width="1.3"/><path d="M-8 -10Q-6 -15 -2 -16" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/></g>';
  }
  // pentagram in circle
  function sigil(cx, cy, r, col, w) {
    var p = [], i, a;
    for (i = 0; i < 5; i++) { a = -Math.PI / 2 + i * 4 * Math.PI / 5; p.push(f(cx + r * Math.cos(a)) + ' ' + f(cy + r * Math.sin(a))); }
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="' + w + '"/><path d="M' + p.join('L') + 'Z" fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-linejoin="round"/>';
  }
  // chain of links along a sagging quad curve
  function chain(x1, y1, x2, y2, n, sag, sc) {
    var s = '', i, t, mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + sag;
    sc = sc || 1;
    for (i = 0; i <= n; i++) {
      t = i / n;
      var px = (1 - t) * (1 - t) * x1 + 2 * t * (1 - t) * mx + t * t * x2;
      var py = (1 - t) * (1 - t) * y1 + 2 * t * (1 - t) * my + t * t * y2;
      var dx = 2 * (1 - t) * (mx - x1) + 2 * t * (x2 - mx), dy = 2 * (1 - t) * (my - y1) + 2 * t * (y2 - my);
      var ang = Math.atan2(dy, dx) * 180 / Math.PI + (i % 2 ? 90 : 0);
      s += '<ellipse cx="' + f(px) + '" cy="' + f(py) + '" rx="' + f(3.6 * sc) + '" ry="' + f(2.3 * sc) + '" transform="rotate(' + f(ang) + ' ' + f(px) + ' ' + f(py) + ')" fill="' + (i % 2 ? '#7a7a8c' : '#a4a4b8') + '" stroke="' + O + '" stroke-width="' + f(1.6 * sc) + '"/>';
    }
    return s;
  }

  var E = {};

  /* ============================================================ IMP */
  E.imp = {
    name: 'Fire Imp',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'imp-' + n + '-' + uid; };
      var defs = lg(I('skin'), [[0, '#ff8a62'], [0.5, '#ea3a2e'], [1, '#a01a2c']], 0, 0, 1, 1) +
        lg(I('wing'), [[0, '#b0407e'], [1, '#4a1450']]) +
        lg(I('horn'), [[0, '#f8ead0'], [1, '#9a6a44']], 0, 0, 1, 0) +
        lg(I('metal'), [[0, '#d8d8e8'], [0.5, '#8a8a9e'], [1, '#4a4a5c']], 0, 0, 1, 0) +
        rg(I('glow'), [[0, '#ffb13a', 0.7], [1, '#ff5a1a', 0]]);
      var body =
        '<ellipse cx="150" cy="120" rx="40" ry="36" fill="url(#' + I('glow') + ')"/>' +
        // tail
        '<path d="M120 170C150 182 174 164 168 138" fill="none" stroke="' + O + '" stroke-width="9" stroke-linecap="round"/>' +
        '<path d="M120 170C150 182 174 164 168 138" fill="none" stroke="#d02c2c" stroke-width="4.6" stroke-linecap="round"/>' +
        '<g class="part-cape" style="transform-origin: 168px 138px">' + fire(168, 140, 11, 30, 3, 2.5) + '</g>' +
        // wing
        '<g class="part-cape" style="transform-origin: 116px 128px">' +
        '<path d="M116 128L152 64Q170 76 184 96Q170 100 175 124Q160 118 153 140Q143 128 132 148Q124 142 116 128Z" fill="url(#' + I('wing') + ')" ' + S(3.5) + '/>' +
        '<path d="M152 64L184 96M152 64L175 124M152 64L153 140M116 128L132 148" stroke="' + O + '" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
        '<path d="M150 70L160 76M158 98Q166 96 170 100" stroke="#e88ac0" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>' +
        '<path d="M152 64l4 -8l-1 8z" fill="#f8ead0" ' + S(1.8) + '/></g>' +
        // back arm
        '<path d="M124 138Q138 144 134 160" fill="none" stroke="' + O + '" stroke-width="14" stroke-linecap="round"/><path d="M124 138Q138 144 134 160" fill="none" stroke="#c42a34" stroke-width="8" stroke-linecap="round"/>' +
        '<circle cx="134" cy="162" r="6" fill="#c42a34" ' + S(3) + '/>' +
        // legs and feet
        '<path d="M84 172L82 186L106 186L104 172Z" fill="#c42a34" ' + S(3.5) + '/><path d="M108 172L108 186L132 186L128 172Z" fill="#a01a2c" ' + S(3.5) + '/>' +
        '<path d="M76 190Q74 182 84 182L106 182Q112 186 108 190Z" fill="url(#' + I('skin') + ')" ' + S(3.5) + '/><path d="M104 190Q104 182 112 182L134 182Q140 188 136 190Z" fill="#b82632" ' + S(3.5) + '/>' +
        '<path d="M80 190L80 186M88 190L88 186M114 190L114 186M122 190L122 186" stroke="#f8ead0" stroke-width="2.6" stroke-linecap="round"/>' +
        // belly
        '<ellipse cx="102" cy="150" rx="28" ry="30" fill="url(#' + I('skin') + ')" ' + S(4) + '/>' +
        '<ellipse cx="96" cy="158" rx="16" ry="18" fill="#ffb27a"/><path d="M84 152Q96 156 108 152M84 162Q96 166 108 162" stroke="#e08a52" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<path d="M118 132Q124 146 120 162" stroke="#7a1420" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>' +
        // ragged loincloth belt
        '<path d="M76 140Q102 150 128 140L128 148Q102 158 76 148Z" fill="#5a3a2a" ' + S(3) + '/><circle cx="102" cy="150" r="4" fill="#ffd04a" ' + S(2) + '/>' +
        // front arm + pitchfork
        '<g class="part-weapon" style="transform-origin: 82px 140px">' +
        '<rect x="50" y="62" width="6" height="128" rx="3" fill="#8a5a3a" ' + S(3) + '/><path d="M51 70V186" stroke="#c48a58" stroke-width="1.6"/>' +
        '<path d="M36 72L36 46Q36 40 40 44L42 56L46 40L50 56Q50 40 53 34Q56 40 56 56L60 40L64 56L66 44Q70 40 70 46L70 72Q70 84 53 84Q36 84 36 72Z" fill="url(#' + I('metal') + ')" ' + S(3.2) + '/>' +
        '<path d="M42 58V74M53 50V78M64 58V74" stroke="' + O + '" stroke-width="2" stroke-linecap="round"/><path d="M40 50L41 44" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M58 78L58 86M48 78L48 86" stroke="#c9902a" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M84 138Q66 138 56 142" fill="none" stroke="' + O + '" stroke-width="15" stroke-linecap="round"/><path d="M84 138Q66 138 56 142" fill="none" stroke="#e8362e" stroke-width="9" stroke-linecap="round"/>' +
        '<circle cx="53" cy="142" r="8" fill="#e8362e" ' + S(3.2) + '/><path d="M46 146l-5 3M48 150l-4 4" stroke="' + O + '" stroke-width="2.6" stroke-linecap="round"/><path d="M50 138q3 -3 7 -1" stroke="#ff9a7a" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '</g>' +
        // ears
        '<path d="M68 96L40 76L48 100L66 110Z" fill="url(#' + I('skin') + ')" ' + S(3.5) + '/><path d="M62 98L48 86L52 98Z" fill="#7a1420"/>' +
        '<path d="M126 92L154 72L148 98L130 108Z" fill="#c42a34" ' + S(3.5) + '/><path d="M130 94L146 82L144 96Z" fill="#7a1420"/>' +
        // horns
        '<path d="M78 74Q66 60 74 42Q84 56 92 68Z" fill="url(#' + I('horn') + ')" ' + S(3.2) + '/><path d="M72 58l7 -2M76 66l7 -3" stroke="#9a6a44" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M112 70Q118 56 132 50Q126 64 122 78Z" fill="url(#' + I('horn') + ')" ' + S(3.2) + '/><path d="M118 62l6 -2M116 70l6 -2" stroke="#9a6a44" stroke-width="1.8" stroke-linecap="round"/>' +
        // flame tuft
        '<g class="part-cape" style="transform-origin: 98px 72px">' + fire(98, 76, 9, 26, -3, 2.4) + '</g>' +
        // head
        '<g class="part-head" style="transform-origin: 98px 110px">' +
        '<path d="M64 100C62 76 80 68 98 68C118 68 134 80 132 102C132 124 116 134 98 134C80 134 66 124 64 100Z" fill="url(#' + I('skin') + ')" ' + S(4) + '/>' +
        '<path d="M70 118Q80 130 98 130" stroke="#7a1420" stroke-width="4" fill="none" stroke-linecap="round" opacity=".5"/>' +
        '<ellipse cx="74" cy="112" rx="6" ry="3.4" fill="#ff5a6a" opacity=".55"/><ellipse cx="124" cy="110" rx="6" ry="3.4" fill="#ff5a6a" opacity=".45"/>' +
        '<g class="part-eyes" style="transform-origin: 98px 96px">' + eye(83, 96, 9, 10, '#ffd83a', true) + eye(112, 95, 9, 10, '#ffd83a', true) + '</g>' +
        '<path d="M70 82L94 92M128 80L102 91" stroke="' + O + '" stroke-width="6" stroke-linecap="round"/>' +
        '<path d="M96 104q-2 4 2 5q4 -1 2 -5" fill="#7a1420"/><circle cx="94" cy="107" r="1.3" fill="' + O + '"/><circle cx="101" cy="107" r="1.3" fill="' + O + '"/>' +
        '<path d="M72 114Q98 138 126 112Q98 124 72 114Z" fill="#3a0c1a" ' + S(3) + '/>' +
        '<path d="M78 118L82 108L86 121Z M110 122L114 110L118 118Z" fill="#fff" ' + S(2) + '/>' +
        '<path d="M92 126Q98 132 104 126Q98 122 92 126Z" fill="#ff6a7a"/>' +
        '<path d="M76 76Q90 70 102 72" stroke="#ffb09a" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>' +
        '</g>' +
        // sparks
        '<circle cx="176" cy="60" r="2.4" fill="#ffb13a"/><circle cx="26" cy="120" r="2" fill="#ffd04a"/><circle cx="160" cy="44" r="1.6" fill="#ff8a1f"/>';
      return wrap(defs, shadow(52, 100), body);
    }
  };

  /* ============================================================ HELLHOUND */
  E.hellhound = {
    name: 'Hellhound',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'hellhound-' + n + '-' + uid; };
      var defs = lg(I('fur'), [[0, '#4a3c58'], [0.5, '#2a2236'], [1, '#120e1a']], 0, 0, 0.3, 1) +
        lg(I('fur2'), [[0, '#3a2e48'], [1, '#0e0a14']]) +
        lg(I('lava'), [[0, '#ffe36a'], [0.5, '#ff8a1f'], [1, '#e0361a']]) +
        rg(I('maw'), [[0, '#fff0a0'], [0.4, '#ff9a2a'], [1, '#b81e1a']], 0.5, 0.4, 0.7) +
        rg(I('eye3'), [[0, '#ffffff', 0.9], [0.4, '#ff6aff', 0.6], [1, '#ff3a3a', 0]]) +
        lg(I('col'), [[0, '#8a8a9c'], [1, '#3a3a4a']], 0, 0, 1, 0);
      var crack = function (d) { return '<path d="' + d + '" fill="none" stroke="#e0361a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="' + d + '" fill="none" stroke="url(#' + I('lava') + ')" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'; };
      var body =
        '<ellipse cx="118" cy="140" rx="70" ry="52" fill="url(#' + I('eye3') + ')" opacity=".25"/>' +
        // tail
        '<path d="M164 122C180 112 190 96 184 74" fill="none" stroke="' + O + '" stroke-width="13" stroke-linecap="round"/><path d="M164 122C180 112 190 96 184 74" fill="none" stroke="#2a2236" stroke-width="7" stroke-linecap="round"/>' +
        '<g class="part-cape" style="transform-origin: 184px 78px">' + fire(184, 82, 11, 32, 2, 2.5) + '</g>' +
        // far legs
        '<path d="M70 140L64 176L60 190L84 190L86 176L94 148Z" fill="#171220" ' + S(3.5) + '/>' +
        '<path d="M128 146L126 180L122 190L146 190L146 176L150 146Z" fill="#171220" ' + S(3.5) + '/>' +
        // body
        '<path d="M80 112C86 92 116 84 146 92C170 98 176 122 168 142C160 162 140 170 118 170C94 170 78 150 80 112Z" fill="url(#' + I('fur') + ')" ' + S(4) + '/>' +
        '<path d="M96 156C116 168 144 166 160 148C150 160 122 164 96 156Z" fill="#0e0a14" opacity=".7"/>' +
        '<path d="M118 100C138 96 158 104 162 122" stroke="#6a5a80" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>' +
        crack('M108 116L118 124L112 136L124 146') + crack('M140 108L146 120L138 130L150 142L146 152') + crack('M124 124L134 132') +
        '<path d="M86 140L90 150L98 144L104 156L112 148L120 160" stroke="#5a4a70" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
        // rear near leg (haunch)
        '<path d="M126 128C150 122 172 134 168 156L160 176L164 190L134 190L136 176C122 170 118 140 126 128Z" fill="url(#' + I('fur') + ')" ' + S(4) + '/>' +
        crack('M140 136L150 146L142 158') +
        '<path d="M134 190V184M143 190V184M152 190V184" stroke="#f2ead6" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M126 190Q124 180 136 180L156 180Q164 186 160 190Z" fill="#2a2236" ' + S(3.5) + '/>' +
        // front near leg
        '<path d="M70 126C90 120 106 136 102 152L96 178L98 190L64 190L72 176C66 160 60 138 70 126Z" fill="url(#' + I('fur') + ')" ' + S(4) + '/>' +
        crack('M82 138L90 148L84 160') +
        '<path d="M68 190V184M77 190V184M86 190V184" stroke="#f2ead6" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M60 190Q58 180 70 180L92 180Q100 186 96 190Z" fill="#2a2236" ' + S(3.5) + '/>' +
        // flaming mane
        '<g class="part-cape" style="transform-origin: 100px 100px">' +
        fire(118, 98, 12, 34, 4, 2.6) + fire(104, 94, 13, 42, 2, 2.6) + fire(90, 90, 13, 44, -2, 2.6) + fire(134, 102, 10, 28, 6, 2.6) + fire(76, 84, 10, 34, -6, 2.6) +
        '</g>' +
        // spiked collar
        '<path d="M78 90C90 84 100 90 104 100L96 138C88 134 80 128 74 120Z" fill="url(#' + I('col') + ')" ' + S(3.5) + '/>' +
        '<path d="M80 96L86 100M82 108L90 112M84 120L92 122" stroke="' + O + '" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M74 92L66 84L80 90Z M72 104L62 100L74 110Z M74 116L64 116L78 122Z M96 96L100 84L104 98Z" fill="#c8c8d8" ' + S(2.4) + '/>' +
        '<circle cx="88" cy="112" r="4.5" fill="#e0361a" ' + S(2) + '/><circle cx="87" cy="111" r="1.4" fill="#fff"/>' +
        // head
        '<g class="part-head" style="transform-origin: 70px 108px">' +
        '<path d="M64 72L62 42L48 66Z" fill="#2a2236" ' + S(3.5) + '/><path d="M62 66L61 50L54 64Z" fill="#7a2a4a"/>' +
        '<path d="M86 72L92 42L100 76Z" fill="#171220" ' + S(3.5) + '/><path d="M90 68L92 52L96 70Z" fill="#7a2a4a"/>' +
        // upper skull/snout
        '<path d="M28 96C28 82 44 66 68 66C88 66 100 82 98 100C96 112 88 118 74 118L40 116C32 114 28 106 28 96Z" fill="url(#' + I('fur') + ')" ' + S(4) + '/>' +
        '<ellipse cx="32" cy="94" rx="7" ry="5.5" fill="' + O + '"/><ellipse cx="30" cy="92" rx="2.4" ry="1.6" fill="#8a7aa0"/>' +
        '<path d="M50 74Q62 68 76 72" stroke="#7a68a0" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>' +
        crack('M76 80L82 92L76 104') + '<path d="M34 90Q40 76 56 72" stroke="#9a8ac0" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".8"/><path d="M32 100Q34 108 44 112" stroke="#6a5a88" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        // maw open
        '<path d="M40 114C34 122 40 148 62 152C82 154 92 138 92 122Q64 130 40 114Z" fill="url(#' + I('maw') + ')" ' + S(4) + '/>' +
        '<path d="M46 118Q66 128 88 122" fill="none" stroke="' + O + '" stroke-width="3"/>' +
        '<ellipse cx="66" cy="140" rx="13" ry="7" fill="#ff5a3a" ' + S(2.4) + '/>' +
        '<path d="M41 116L45 128L50 118Z M54 121L58 132L62 122Z M74 123L78 133L82 122Z M86 121L90 128L92 120Z" fill="#fff" ' + S(2.2) + '/>' +
        '<path d="M50 152L54 144L58 152Z M70 154L74 146L78 154Z" fill="#fff" ' + S(2.2) + '/>' +
        '<path d="M60 112L58 118M80 116L80 122" stroke="#fff" stroke-width="0"/>' +
        // eyes
        '<g class="part-eyes" style="transform-origin: 62px 88px">' +
        '<ellipse cx="60" cy="86" rx="11" ry="9" fill="url(#' + I('eye3') + ')" opacity=".8"/>' +
        eye(50, 90, 7, 6, '#ffe64a', true) + eye(74, 88, 7.5, 6.5, '#ffe64a', true) +
        '<circle cx="62" cy="72" r="6" fill="url(#' + I('eye3') + ')"/>' + eye(62, 73, 4.6, 5, '#ff4aff', true) +
        '</g>' +
        '<path d="M42 80L58 88M84 78L68 86" stroke="' + O + '" stroke-width="4.5" stroke-linecap="round"/>' +
        '</g>' +
        // embers
        '<circle cx="24" cy="60" r="2" fill="#ffb13a"/><circle cx="150" cy="60" r="2.2" fill="#ff8a1f"/><circle cx="110" cy="50" r="1.8" fill="#ffd04a"/>';
      return wrap(defs, shadow(78, 108), body);
    }
  };

  /* ============================================================ CULTIST */
  E.cultist = {
    name: 'Cultist',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'cultist-' + n + '-' + uid; };
      var defs = lg(I('robe'), [[0, '#b02436'], [0.5, '#7a1428'], [1, '#3e0a1e']], 0, 0, 0.4, 1) +
        lg(I('robe2'), [[0, '#8a1a2e'], [1, '#2e0818']]) +
        lg(I('gold'), [[0, '#ffe58a'], [1, '#b8801e']], 0, 0, 1, 1) +
        lg(I('blade'), [[0, '#f0e8f8'], [0.5, '#a89ac8'], [1, '#5a4a7a']], 0, 0, 1, 1) +
        rg(I('gem'), [[0, '#ffffff'], [0.3, '#ff6a5a'], [1, '#c81a3a']], 0.4, 0.4, 0.6) +
        rg(I('halo'), [[0, '#ff5a4a', 0.75], [1, '#ff5a4a', 0]]) +
        rg(I('void'), [[0, '#2a0a20'], [1, '#0c0208']]);
      var body =
        // hover glow beneath
        '<ellipse cx="100" cy="182" rx="40" ry="6" fill="url(#' + I('halo') + ')"/>' +
        // back sleeve raised, holding fire orb
        '<path d="M126 100Q150 96 158 80L172 88Q166 116 134 124Z" fill="url(#' + I('robe2') + ')" ' + S(3.6) + '/>' +
        '<path d="M160 82L172 90" stroke="url(#' + I('gold') + ')" stroke-width="4" stroke-linecap="round"/>' +
        '<circle cx="168" cy="74" r="6" fill="#d8a890" ' + S(3) + '/>' +
        '<circle cx="170" cy="56" r="17" fill="url(#' + I('halo') + ')"/>' + fire(170, 68, 8, 22, -1, 2.4) +
        // robe
        '<path d="M70 92Q66 130 56 164L62 170L70 162L78 176L88 166L98 178L108 166L118 176L128 164L136 172L142 164Q132 130 128 92Z" fill="url(#' + I('robe') + ')" ' + S(4) + '/>' +
        '<path d="M100 100L98 178L108 166L118 176L128 164L136 172L142 164Q132 130 128 92Z" fill="#2e0818" opacity=".28"/>' +
        '<path d="M70 150Q100 160 132 150" stroke="url(#' + I('gold') + ')" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        '<path d="M76 108Q72 132 66 156M120 110Q124 132 128 156M92 118Q90 140 92 160" stroke="#2e0818" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".6"/>' +
        // hem runes
        '<g stroke="#ffcf5a" stroke-width="2" fill="none" stroke-linecap="round"><path d="M66 164l3 -6l3 6M78 168l0 -6M84 166l4 -4l4 4M100 168l3 -6l3 6M112 166l0 -6M122 164l4 -4"/></g>' +
        // shoulders/collar
        '<path d="M68 92Q98 76 130 92L128 106Q98 96 70 106Z" fill="#8a1a2e" ' + S(3.6) + '/>' +
        // belt sash
        '<path d="M72 128Q100 138 128 126L128 136Q100 148 72 138Z" fill="#2e0818" ' + S(3.2) + '/>' +
        '<rect x="94" y="130" width="10" height="10" rx="2" fill="url(#' + I('gold') + ')" ' + S(2.2) + '/>' +
        '<path d="M100 140L98 162M104 140L108 160" stroke="#2e0818" stroke-width="5" stroke-linecap="round"/><path d="M98 162h0M108 160h0" stroke="url(#' + I('gold') + ')" stroke-width="4" stroke-linecap="round"/>' +
        // pendant
        '<path d="M86 100Q100 118 114 100" fill="none" stroke="#e8c050" stroke-width="2.2"/>' +
        '<circle cx="100" cy="116" r="15" fill="url(#' + I('halo') + ')"/><circle cx="100" cy="116" r="8.5" fill="#3e0a1e" ' + S(2.6) + '/>' + sigil(100, 116, 6.2, '#ffb0a0', 1.4) + '<circle cx="100" cy="116" r="2" fill="#fff"/>' +
        // hood back + hood
        '<g class="part-head" style="transform-origin: 96px 74px">' +
        '<path d="M60 84C56 56 72 34 92 16C96 34 112 44 128 60C136 76 128 90 116 96L70 96C64 94 60 90 60 84Z" fill="url(#' + I('robe') + ')" ' + S(4) + '/>' +
        '<path d="M92 16C96 34 112 44 128 60C136 76 128 90 116 96L104 96C116 80 112 50 92 16Z" fill="#2e0818" opacity=".3"/>' +
        '<path d="M78 82C70 64 80 46 92 42C104 40 116 50 116 68C116 82 108 92 96 94C88 94 82 90 78 82Z" fill="url(#' + I('void') + ')" ' + S(3.6) + '/>' +
        '<path d="M60 84C56 56 72 34 92 16" fill="none" stroke="url(#' + I('gold') + ')" stroke-width="3" stroke-linecap="round" opacity=".9"/>' +
        '<path d="M70 96L116 96" stroke="url(#' + I('gold') + ')" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M80 58Q88 50 98 52" stroke="#a04868" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>' +
        '<g class="part-eyes" style="transform-origin: 96px 68px">' +
        '<ellipse cx="86" cy="68" rx="9" ry="6.5" fill="url(#' + I('halo') + ')"/><ellipse cx="108" cy="67" rx="9" ry="6.5" fill="url(#' + I('halo') + ')"/>' +
        '<path d="M78 64Q86 60 94 68Q86 74 78 64Z" fill="#ffcf3a"/><path d="M100 68Q108 60 116 65Q108 74 100 68Z" fill="#ffcf3a"/>' +
        '<ellipse cx="86" cy="67" rx="1.8" ry="3.6" fill="' + O + '"/><ellipse cx="108" cy="67" rx="1.8" ry="3.6" fill="' + O + '"/>' +
        '<circle cx="83" cy="65" r="1.5" fill="#fff"/><circle cx="105" cy="64" r="1.5" fill="#fff"/></g>' +
        '<path d="M84 82Q96 90 108 80" stroke="#ffcf3a" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-dasharray="2 3" opacity=".8"/>' +
        '</g>' +
        // front arm + dagger
        '<g class="part-weapon" style="transform-origin: 74px 108px">' +
        '<path d="M76 100Q52 104 44 122L58 138Q72 128 84 118Z" fill="url(#' + I('robe2') + ')" ' + S(3.6) + '/>' +
        '<path d="M46 124L58 136" stroke="url(#' + I('gold') + ')" stroke-width="4" stroke-linecap="round"/>' +
        '<circle cx="46" cy="136" r="7.5" fill="#d8a890" ' + S(3) + '/><path d="M40 132q4 -2 7 0" stroke="#a87860" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
        '<path d="M46 142L46 130" stroke="' + O + '" stroke-width="7" stroke-linecap="round"/><path d="M46 142L46 130" stroke="#5a3a2a" stroke-width="3.5" stroke-linecap="round"/>' +
        '<path d="M38 128H54" stroke="url(#' + I('gold') + ')" stroke-width="5" stroke-linecap="round"/><path d="M38 128H54" stroke="' + O + '" stroke-width="0"/>' +
        '<path d="M42 128C24 118 22 88 46 66C40 88 48 104 52 128Z" fill="url(#' + I('blade') + ')" ' + S(3.2) + '/>' +
        '<path d="M42 118C34 106 34 92 42 80" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".85"/>' +
        '<path d="M46 108L50 112L46 116" stroke="#c81a3a" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<circle cx="46" cy="130" r="3.4" fill="url(#' + I('gem') + ')" ' + S(1.6) + '/>' +
        '</g>' +
        // floating runes
        '<g fill="none" stroke="#ff8a5a" stroke-width="2" stroke-linecap="round" opacity=".9"><path d="M148 140l4 -6l4 6M28 100l6 0M31 96l0 8M150 160l0 -7M146 156l8 0"/></g>' +
        '<circle cx="34" cy="60" r="2" fill="#ffb13a"/><circle cx="150" cy="128" r="1.8" fill="#ffd04a"/>';
      return wrap(defs, shadow(34, 100, 0.2), body);
    }
  };

  /* ============================================================ WARLOCK (elite) */
  E.warlock = {
    name: 'Dark Warlock',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'warlock-' + n + '-' + uid; };
      var defs = lg(I('robe'), [[0, '#6a3aa8'], [0.5, '#3e1e70'], [1, '#1c0c38']], 0, 0, 0.3, 1) +
        lg(I('robe2'), [[0, '#502a88'], [1, '#180a30']]) +
        lg(I('gold'), [[0, '#ffe58a'], [1, '#b8801e']], 0, 0, 1, 1) +
        lg(I('iron'), [[0, '#8a8aa2'], [0.5, '#4e4e66'], [1, '#22222e']], 0, 0, 1, 0) +
        lg(I('wood'), [[0, '#6a4a3a'], [1, '#2e1e18']], 0, 0, 1, 0) +
        lg(I('book'), [[0, '#8a2a3a'], [1, '#3a0e1e']], 0, 0, 1, 1) +
        rg(I('pglow'), [[0, '#e8b8ff', 0.85], [0.5, '#a04cff', 0.4], [1, '#7a2bd8', 0]]) +
        rg(I('circle'), [[0, '#a04cff', 0.0], [0.7, '#a04cff', 0.25], [1, '#d09aff', 0.6]]) +
        rg(I('void'), [[0, '#241040'], [1, '#080210']]) +
        rg(I('orb'), [[0, '#ffffff'], [0.3, '#e0a8ff'], [0.7, '#8a3aff'], [1, '#4a14a0']], 0.4, 0.4, 0.6);
      var rune = function (x, y) { return '<path d="M' + x + ' ' + y + 'l3 -5l3 5m-3 -5v10" stroke="#e0a8ff" stroke-width="1.8" fill="none" stroke-linecap="round"/>'; };
      // rune circle on the ground (static, outside idle bob)
      var sh = '<g class="part-shadow"><ellipse cx="100" cy="188" rx="72" ry="13" fill="url(#' + I('circle') + ')"/><ellipse cx="100" cy="188" rx="66" ry="11" fill="none" stroke="#d09aff" stroke-width="2.4"/><ellipse cx="100" cy="188" rx="52" ry="8.4" fill="none" stroke="#a04cff" stroke-width="1.6" stroke-dasharray="5 4"/>' +
        '<g stroke="#f0d4ff" stroke-width="1.8" stroke-linecap="round" fill="none"><path d="M30 186l-5 -4M48 178l-2 -5M76 176l0 -5M124 176l0 -5M152 178l2 -5M170 186l5 -4M42 197l-3 4M100 200v4M158 197l3 4"/></g>' +
        '<ellipse cx="100" cy="190" rx="34" ry="5" fill="#000" opacity=".3"/></g>';
      var body =
        // robe
        '<path d="M62 78C58 110 48 150 42 184L52 178L60 190L72 178L82 190L94 180L106 190L118 178L130 190L142 178L152 188L158 178C150 150 140 110 134 78Z" fill="url(#' + I('robe') + ')" ' + S(4.2) + '/>' +
        '<path d="M104 80L106 190L118 178L130 190L142 178L152 188L158 178C150 150 140 110 134 78Z" fill="#180a30" opacity=".3"/>' +
        '<path d="M96 96L94 188" stroke="url(#' + I('gold') + ')" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M96 96L98 186" stroke="' + O + '" stroke-width="0.8"/>' +
        '<path d="M68 116Q62 150 56 176M124 116Q130 150 136 176M80 124Q78 152 78 178M112 124Q112 152 114 180" stroke="#180a30" stroke-width="2.8" fill="none" stroke-linecap="round" opacity=".6"/>' +
        // tatters (rips)
        '<path d="M56 160l8 4l-6 6M138 158l-8 6l8 4" stroke="' + O + '" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        // rune embroidery
        rune(72, 150) + rune(78, 166) + rune(112, 150) + rune(120, 168) + rune(64, 132) + rune(128, 134) +
        // shoulder mantle
        '<path d="M56 86C62 70 84 64 98 64C114 64 134 70 142 88L136 102C120 94 78 94 60 102Z" fill="url(#' + I('robe2') + ')" ' + S(4) + '/>' +
        '<path d="M60 102C78 94 120 94 136 102" stroke="url(#' + I('gold') + ')" stroke-width="3.6" fill="none" stroke-linecap="round"/>' +
        '<path d="M60 86l-6 10l8 -2M140 88l6 10l-8 -2" stroke="' + O + '" stroke-width="2" fill="none"/>' +
        '<path d="M68 82l-4 -12l10 6M126 78l6 -12l-2 12" fill="#c9902a" ' + S(2.2) + '/>' +
        // belt + buckle + chain + book
        '<path d="M62 128Q98 140 134 126L134 138Q98 152 62 140Z" fill="#20102e" ' + S(3.4) + '/>' +
        '<circle cx="98" cy="139" r="6.5" fill="url(#' + I('gold') + ')" ' + S(2.4) + '/><path d="M95 137l6 4M101 137l-6 4" stroke="' + O + '" stroke-width="1.8"/>' +
        chain(98, 145, 122, 140, 5, 6, 0.9) +
        '<g transform="translate(124 142) rotate(-8)"><rect x="-4" y="-4" width="26" height="32" rx="3" fill="url(#' + I('book') + ')" ' + S(3.4) + '/><rect x="-4" y="-4" width="5" height="32" rx="2" fill="#2a0a16" ' + S(2) + '/>' +
        '<path d="M2 0H18M2 26H18" stroke="url(#' + I('gold') + ')" stroke-width="2.4"/><path d="M-4 6H21M-4 20H21" stroke="url(#' + I('gold') + ')" stroke-width="2.4"/>' +
        skull(11, 14, 0.52, '#f2ead6') + '<circle cx="18" cy="2" r="1.6" fill="#ffd04a"/><circle cx="18" cy="24" r="1.6" fill="#ffd04a"/></g>' +
        // back arm casting
        '<g class="part-cape" style="transform-origin: 134px 90px">' +
        '<path d="M130 88Q152 82 160 68L176 76Q170 108 136 112Z" fill="url(#' + I('robe2') + ')" ' + S(3.8) + '/>' +
        '<path d="M162 70L176 78" stroke="url(#' + I('gold') + ')" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M170 78l12 -8" stroke="#ffd0b0" stroke-width="0"/>' +
        '<circle cx="176" cy="58" r="20" fill="url(#' + I('pglow') + ')"/><circle cx="176" cy="58" r="9.5" fill="url(#' + I('orb') + ')" ' + S(2.6) + '/><path d="M170 54q3 -4 7 -3" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<path d="M160 44l6 6M190 46l-6 6M186 72l-6 -5M164 68l6 -4" stroke="#f0d4ff" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M164 60L156 54L162 66" stroke="#d09aff" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>' +
        // hood + skull crown
        '<g class="part-head" style="transform-origin: 98px 60px">' +
        // horns (ram-like)
        '<path d="M70 42C50 44 44 24 56 12C56 26 68 30 78 32Z" fill="#e8dcc0" ' + S(3.2) + '/><path d="M56 22l6 4M60 30l6 2" stroke="#8a6a44" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M126 40C146 42 152 22 140 10C140 24 128 28 118 30Z" fill="#e8dcc0" ' + S(3.2) + '/><path d="M140 20l-6 4M136 28l-6 2" stroke="#8a6a44" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M66 82C60 56 70 30 98 18C126 30 138 56 132 82C130 92 122 98 112 100L84 100C74 98 68 92 66 82Z" fill="url(#' + I('robe') + ')" ' + S(4.2) + '/>' +
        '<path d="M98 18C126 30 138 56 132 82C130 92 122 98 112 100L104 100C124 78 122 42 98 18Z" fill="#180a30" opacity=".3"/>' +
        '<path d="M76 84C70 66 78 48 98 44C118 44 128 60 122 82C120 92 112 98 100 98C88 98 80 92 76 84Z" fill="url(#' + I('void') + ')" ' + S(3.6) + '/>' +
        '<path d="M68 84C62 64 70 40 98 20" stroke="url(#' + I('gold') + ')" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".9"/>' +
        // skull crown
        '<path d="M80 36Q98 26 116 36L114 46Q98 38 82 46Z" fill="url(#' + I('iron') + ')" ' + S(3.2) + '/>' +
        skull(98, 36, 1.05, '#f6eedc') + '<circle cx="98" cy="22" r="2.6" fill="#e0361a" ' + S(1.4) + '/>' +
        '<path d="M84 40l-4 -8l8 4M112 40l4 -8l-8 4" fill="#4e4e66" ' + S(2) + '/>' +
        '<g class="part-eyes" style="transform-origin: 98px 66px">' +
        '<ellipse cx="88" cy="66" rx="9" ry="6.5" fill="url(#' + I('pglow') + ')"/><ellipse cx="110" cy="66" rx="9" ry="6.5" fill="url(#' + I('pglow') + ')"/>' +
        '<path d="M80 62Q88 58 96 66Q88 72 80 62Z" fill="#c8ff4a"/><path d="M102 66Q110 58 118 63Q110 72 102 66Z" fill="#c8ff4a"/>' +
        '<ellipse cx="88" cy="65" rx="1.8" ry="3.6" fill="' + O + '"/><ellipse cx="110" cy="65" rx="1.8" ry="3.6" fill="' + O + '"/>' +
        '<circle cx="85" cy="63" r="1.5" fill="#fff"/><circle cx="107" cy="62" r="1.5" fill="#fff"/></g>' +
        '<path d="M84 82Q98 92 112 82" stroke="#eaffc0" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M90 85l0 3M96 87l0 3M102 87l0 3M108 85l0 3" stroke="#eaffc0" stroke-width="1.6" stroke-linecap="round"/>' +
        '</g>' +
        // front arm + staff
        '<g class="part-weapon" style="transform-origin: 62px 96px">' +
        '<rect x="38" y="52" width="7" height="140" rx="3.2" fill="url(#' + I('wood') + ')" ' + S(3.4) + '/>' +
        '<path d="M40 60V184" stroke="#a08070" stroke-width="1.6" opacity=".7"/>' +
        '<path d="M38 96l7 4M38 130l7 4M38 164l7 4" stroke="' + O + '" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M28 50Q24 34 32 26M56 50Q60 34 52 26" fill="none" stroke="' + O + '" stroke-width="9" stroke-linecap="round"/><path d="M28 50Q24 34 32 26M56 50Q60 34 52 26" fill="none" stroke="url(#' + I('iron') + ')" stroke-width="4.6" stroke-linecap="round"/>' +
        '<path d="M28 54H56L52 62H32Z" fill="url(#' + I('iron') + ')" ' + S(3) + '/>' +
        '<g class="part-cape" style="transform-origin: 42px 30px">' +
        '<circle cx="42" cy="26" r="26" fill="url(#' + I('pglow') + ')"/>' + fire(42, 34, 16, 34, 0, 2.5, PFIRE) +
        skull(42, 26, 1.4, '#f6eedc') + '<ellipse cx="38" cy="22" rx="2.6" ry="3.2" fill="#c8ff4a"/><ellipse cx="46" cy="22" rx="2.6" ry="3.2" fill="#c8ff4a"/></g>' +
        // arm
        '<path d="M70 92Q54 96 46 108L54 122Q68 116 80 106Z" fill="url(#' + I('robe2') + ')" ' + S(3.8) + '/>' +
        '<path d="M46 110L54 122" stroke="url(#' + I('gold') + ')" stroke-width="4" stroke-linecap="round"/>' +
        '<circle cx="42" cy="110" r="7.5" fill="#c9b0d8" ' + S(3) + '/><path d="M35 106q4 -3 8 -1M35 112q4 -2 8 0" stroke="' + O + '" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '</g>' +
        // sparks
        '<g fill="#e0a8ff"><circle cx="20" cy="70" r="2"/><circle cx="66" cy="16" r="1.8"/><circle cx="24" cy="10" r="1.6"/><circle cx="188" cy="100" r="2"/></g>';
      return wrap(defs, sh, body);
    }
  };

  /* ============================================================ DEMON LORD (boss) */
  E.demonlord = {
    name: 'Demon Lord',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'demonlord-' + n + '-' + uid; };
      var U = function (n) { return 'url(#' + I(n) + ')'; };
      var defs =
        lg(I('skin'), [[0, '#ee5a48'], [0.45, '#c42a34'], [1, '#7a1228']], 0, 0, 0.4, 1) +
        lg(I('skin2'), [[0, '#a01a2c'], [1, '#4a0a1c']]) +
        lg(I('obs'), [[0, '#5a4a78'], [0.4, '#2c2244'], [1, '#100a1c']], 0, 0, 1, 1) +
        lg(I('obs2'), [[0, '#3c3058'], [1, '#0c0616']], 0, 0, 1, 0) +
        lg(I('gold'), [[0, '#fff0a0'], [0.5, '#f0b42e'], [1, '#a0641a']], 0, 0, 1, 1) +
        lg(I('horn'), [[0, '#f8ecd0'], [0.5, '#c8985e'], [1, '#5a3222']], 0, 0, 1, 0) +
        lg(I('wing'), [[0, '#d42a48'], [0.55, '#8a1a4a'], [1, '#3c0c40']], 0, 0, 0.3, 1) +
        lg(I('wing2'), [[0, '#8a1a44'], [1, '#2a0834']]) +
        lg(I('wbone'), [[0, '#5a2a44'], [1, '#1e0a1c']], 0, 0, 1, 0) +
        lg(I('cape'), [[0, '#6a1030'], [0.6, '#3a0a24'], [1, '#160510']], 0, 0, 0.3, 1) +
        lg(I('blade'), [[0, '#a898d0'], [0.5, '#4a3c74'], [1, '#1a1030']], 0, 0, 1, 0) +
        lg(I('fl'), [[0, '#ffe98a'], [0.5, '#ff8a1f'], [1, '#e0361a']], 0, 1, 0, 0) +
        lg(I('lava'), [[0, '#ffe36a'], [0.5, '#ff8a1f'], [1, '#e0361a']]) +
        rg(I('aura'), [[0, '#ff5a2a', 0.5], [0.6, '#c81a3a', 0.28], [1, '#7a1a8a', 0]], 0.5, 0.55, 0.5) +
        rg(I('sig'), [[0, '#fff6c0', 1], [0.4, '#ffb13a', 0.85], [1, '#ff4a1a', 0]]) +
        rg(I('eyeg'), [[0, '#ffffff', 1], [0.35, '#ffe63a', 0.9], [1, '#ff6a1a', 0]]) +
        rg(I('mouth'), [[0, '#fff0a0'], [0.45, '#ff8a2a'], [1, '#a81420']], 0.5, 0.35, 0.75) +
        rg(I('gem'), [[0, '#ffffff'], [0.3, '#ff6a5a'], [1, '#b8102a']], 0.4, 0.4, 0.6);
      var sh = '<ellipse cx="100" cy="112" rx="98" ry="88" fill="' + U('aura') + '"/>' + shadow(78, 100, 0.32);

      // ridged horn helper drawn as path + ridge arcs
      var ridgesL = '<path d="M62 30Q56 34 54 40M52 24Q45 27 42 32M44 16Q38 17 35 21M38 9Q33 9 31 12" stroke="#7a4a2e" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
      var ridgesR = '<path d="M118 30Q124 34 126 40M128 24Q135 27 138 32M136 16Q142 17 145 21M142 9Q147 9 149 12" stroke="#7a4a2e" stroke-width="2.2" fill="none" stroke-linecap="round"/>';

      var body =
        /* ---------- far wing ---------- */
        '<g class="part-cape" style="transform-origin: 122px 86px">' +
        '<path d="M122 86L142 22Q150 16 160 8Q160 30 172 42Q160 46 164 64Q150 60 150 78Q138 70 134 92Z" fill="' + U('wing2') + '" ' + S(3.6) + '/>' +
        '<path d="M142 22L172 42M142 22L164 64M142 22L150 78" stroke="' + O + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '</g>' +
        /* ---------- near wing ---------- */
        '<g class="part-cape" style="transform-origin: 130px 92px">' +
        '<path d="M130 92C132 66 146 44 166 26L178 8L182 26Q198 40 196 60Q186 60 188 76Q194 88 190 102Q176 96 172 112Q160 104 152 118Q144 108 134 112Z" fill="' + U('wing') + '" ' + S(4) + '/>' +
        // shade layers
        '<path d="M166 26L178 8L182 26Q198 40 196 60Q186 60 188 76Q176 60 166 26Z" fill="#ff5a5a" opacity=".22"/>' +
        '<path d="M190 102Q176 96 172 112Q160 104 152 118Q144 108 134 112Q150 96 160 74Q176 90 190 102Z" fill="#2a0834" opacity=".45"/>' +
        // veins
        '<path d="M172 44Q180 60 178 76M172 44Q170 68 162 88M172 44Q158 62 150 86M182 28Q190 44 190 58" stroke="#ff8a8a" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".55"/>' +
        '<path d="M160 52Q166 50 170 54M176 84Q182 86 184 92M152 96Q158 96 162 100" stroke="#ff8a8a" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".5"/>' +
        // bones (fingers)
        '<path d="M130 92C132 66 146 44 166 26" stroke="' + O + '" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M130 92C132 66 146 44 166 26" stroke="' + U('wbone') + '" stroke-width="5" fill="none" stroke-linecap="round"/>' +
        '<path d="M166 26L178 8" stroke="' + O + '" stroke-width="7" stroke-linecap="round"/><path d="M166 26L178 8" stroke="#c8a070" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M166 28L196 60M166 28L190 102M166 28L172 112M166 28L152 118" stroke="' + O + '" stroke-width="5.4" fill="none" stroke-linecap="round"/><path d="M166 28L196 60M166 28L190 102M166 28L172 112M166 28L152 118" stroke="#4a1e3a" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        '<circle cx="166" cy="28" r="7" fill="#3c1a30" ' + S(3) + '/><path d="M163 25q2 -3 5 -1" stroke="#a06a80" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
        '<path d="M196 60l6 4l-8 -1zM190 102l6 6l-10 -3z" fill="#f0e0c0" ' + S(1.8) + '/>' +
        // membrane tears
        '<path d="M184 84l-6 4l8 2z" fill="#1e0620" stroke="' + O + '" stroke-width="1.6" stroke-linejoin="round"/><path d="M158 100l5 3l-6 3z" fill="#1e0620" stroke="' + O + '" stroke-width="1.4"/>' +
        '</g>' +
        /* ---------- tattered cape ---------- */
        '<g class="part-cape" style="transform-origin: 120px 96px">' +
        '<path d="M118 92C148 98 176 128 186 186L172 176L164 190L152 176L142 190L130 172L120 178Z" fill="' + U('cape') + '" ' + S(4) + '/>' +
        '<path d="M140 108Q160 136 170 178M128 110Q140 140 146 172" stroke="#160510" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>' +
        '<path d="M150 104Q172 128 180 160" stroke="#a02040" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/>' +
        '<path d="M186 186L172 176L164 190L152 176L142 190L130 172" fill="none" stroke="#ff7a2a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>' +
        '<path d="M164 150l-6 8l8 2z" fill="#0c0206" stroke="' + O + '" stroke-width="1.4" stroke-linejoin="round"/>' +
        '<g fill="none" stroke="#ff9a2a" stroke-width="2" stroke-linecap="round" opacity=".9"><path d="M150 132l4 -6l4 6M158 150v-8M160 168l4 -4l4 4"/></g>' +
        '</g>' +

        /* ---------- legs and boots ---------- */
        '<path d="M74 148L70 174L100 174L100 148Z" fill="' + U('obs') + '" ' + S(4) + '/>' +
        '<path d="M102 148L102 174L132 174L128 148Z" fill="' + U('obs2') + '" ' + S(4) + '/>' +
        '<path d="M78 156Q86 162 96 158M106 156Q116 162 126 158" stroke="' + U('gold') + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        // boots
        '<path d="M100 170L66 170Q50 174 50 190L100 190Z" fill="' + U('obs') + '" ' + S(4) + '/>' +
        '<path d="M66 170Q50 174 50 190L60 190Q58 178 70 174Z" fill="#6a5a90" opacity=".6"/>' +
        '<path d="M102 170L136 170Q150 176 146 190L102 190Z" fill="' + U('obs2') + '" ' + S(4) + '/>' +
        '<path d="M60 172L98 172L98 180L56 182Z" fill="' + U('gold') + '" ' + S(3) + '/><path d="M104 172L138 172L142 180L104 180Z" fill="#b8801e" ' + S(3) + '/>' +
        '<path d="M50 186L44 190L52 190M56 178L48 176L54 182" fill="#f8ecd0" ' + S(2.4) + '/>' +
        '<path d="M66 184l2 -6l3 6M116 184l2 -6l3 6" stroke="#ffcf5a" stroke-width="2" fill="none" stroke-linecap="round"/>' +

        /* ---------- back arm (right) ---------- */
        '<path d="M142 94Q162 104 160 122Q158 134 150 140" fill="none" stroke="' + O + '" stroke-width="22" stroke-linecap="round"/><path d="M142 94Q162 104 160 122Q158 134 150 140" fill="none" stroke="' + U('skin2') + '" stroke-width="15" stroke-linecap="round"/>' +
        '<path d="M156 102Q162 114 158 128" fill="none" stroke="#ff7a6a" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>' +
        '<path d="M154 124L164 128L160 138L150 134Z" fill="' + U('obs2') + '" ' + S(3) + '/><path d="M153 128L163 132" stroke="' + U('gold') + '" stroke-width="2.6"/>' +
        '<circle cx="150" cy="142" r="10" fill="' + U('skin2') + '" ' + S(3.5) + '/><path d="M144 138q5 -3 10 0M144 144q5 -3 10 0" stroke="' + O + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
        '<path d="M158 134L168 130L166 140" fill="none" stroke="' + O + '" stroke-width="0"/>' +
        chain(160, 132, 176, 170, 6, 8, 0.9) + '<path d="M176 170l4 6l-9 0z" fill="#8a8a9c" ' + S(2) + '/>' +

        /* ---------- torso ---------- */
        '<path d="M66 92C60 112 64 136 76 152L126 152C138 136 142 112 136 92C120 86 82 86 66 92Z" fill="' + U('skin') + '" ' + S(4.2) + '/>' +
        '<path d="M108 92C126 96 136 100 136 106C138 124 132 142 124 152L110 152C120 134 120 108 108 92Z" fill="#7a1228" opacity=".5"/>' +
        // abs
        '<path d="M100 122V150M82 132Q100 136 118 132M84 144Q100 148 116 144" stroke="#7a1228" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
        '<path d="M90 128Q96 126 98 130M104 128Q110 126 114 130" stroke="#ff9a8a" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>' +
        // scars
        '<path d="M78 128L96 146" stroke="#f4b8a0" stroke-width="3.4" stroke-linecap="round"/><path d="M78 128L96 146" stroke="#7a1228" stroke-width="1.2" stroke-linecap="round"/>' +
        '<path d="M83 128l4 4M88 134l4 4M92 140l4 4" stroke="#7a1228" stroke-width="1.4" stroke-linecap="round"/>' +
        // chest plate (obsidian + gold)
        '<path d="M68 92C84 86 116 86 134 92L132 116C124 128 112 130 100 130C88 130 78 128 70 116Z" fill="' + U('obs') + '" ' + S(4) + '/>' +
        '<path d="M72 94C86 89 96 90 100 92L98 122C88 124 78 118 72 110Z" fill="#7a6aa0" opacity=".35"/>' +
        '<path d="M70 96C86 90 116 90 132 96" stroke="' + U('gold') + '" stroke-width="3.6" fill="none" stroke-linecap="round"/>' +
        '<path d="M72 114C82 126 118 126 130 114" stroke="' + U('gold') + '" stroke-width="3.2" fill="none" stroke-linecap="round"/>' +
        '<path d="M76 98L84 120M126 98L118 120" stroke="#100a1c" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M80 100L82 106M122 100L120 106" stroke="#a89ad0" stroke-width="1.6" stroke-linecap="round"/>' +
        // power sigil
        '<circle cx="101" cy="108" r="19" fill="' + U('sig') + '"/>' +
        '<circle cx="101" cy="108" r="12" fill="#1a0a10" ' + S(2.6) + '/>' + sigil(101, 108, 9.6, '#ffd04a', 1.6) + '<circle cx="101" cy="108" r="3" fill="#fff6c0"/><circle cx="101" cy="108" r="6" fill="' + U('sig') + '" opacity=".7"/>' +
        '<path d="M84 104l-2 -3M118 104l2 -3M86 118l-3 2M116 118l3 2" stroke="#ffb13a" stroke-width="1.8" stroke-linecap="round"/>' +
        // veins on neck / arms glowing
        '<path d="M84 90L88 100M118 90L114 100" stroke="#ff9a2a" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>' +
        // belt
        '<path d="M68 148Q100 158 134 148L134 160Q100 170 68 160Z" fill="' + U('obs2') + '" ' + S(4) + '/>' +
        '<path d="M70 150Q100 160 132 150" stroke="' + U('gold') + '" stroke-width="2.4" fill="none"/>' +
        '<path d="M92 150Q101 156 110 150L108 164Q101 168 94 164Z" fill="' + U('gold') + '" ' + S(3) + '/>' + skull(101, 156, 0.44, '#2a1a30') +
        '<circle cx="76" cy="155" r="2.2" fill="#ffd04a"/><circle cx="126" cy="155" r="2.2" fill="#ffd04a"/>' +
        // tassets
        '<path d="M70 160L84 160L82 176L72 172Z" fill="' + U('obs') + '" ' + S(3) + '/><path d="M86 162L100 164L98 178L86 178Z" fill="#231a38" ' + S(3) + '/><path d="M104 164L118 162L118 178L106 178Z" fill="#231a38" ' + S(3) + '/><path d="M120 160L134 160L130 172L120 176Z" fill="' + U('obs2') + '" ' + S(3) + '/>' +
        '<path d="M73 164L81 164M89 168L97 170M108 170L115 168M123 164L130 164" stroke="' + U('gold') + '" stroke-width="2" stroke-linecap="round"/>' +

        /* ---------- shoulder flames ---------- */
        '<g class="part-cape" style="transform-origin: 100px 80px">' +
        fire(52, 82, 12, 36, -6, 2.6) + fire(66, 78, 9, 26, -2, 2.4) + fire(148, 82, 12, 34, 6, 2.6) + fire(134, 78, 9, 26, 2, 2.4) +
        '</g>' +

        /* ---------- pauldrons ---------- */
        // left (front)
        '<path d="M46 98C40 78 60 68 72 76C80 84 78 98 72 104C62 108 50 106 46 98Z" fill="' + U('obs') + '" ' + S(4.2) + '/>' +
        '<path d="M50 92C52 82 62 76 70 80" stroke="#8a7ab8" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/>' +
        '<path d="M46 98C56 106 68 106 74 100" stroke="' + U('gold') + '" stroke-width="3.6" fill="none" stroke-linecap="round"/>' +
        '<path d="M46 86L34 78L44 74M52 76L46 62L58 72M62 74L62 58L70 72" fill="' + U('gold') + '" ' + S(2.6) + '/>' +
        '<circle cx="60" cy="92" r="4.4" fill="' + U('gem') + '" ' + S(2) + '/><circle cx="59" cy="91" r="1.4" fill="#fff"/>' +
        // right (back)
        '<path d="M154 100C160 80 142 68 130 78C122 86 124 100 130 106C140 110 152 108 154 100Z" fill="' + U('obs2') + '" ' + S(4.2) + '/>' +
        '<path d="M130 106C140 110 150 108 154 100" stroke="#c8801e" stroke-width="3.4" fill="none" stroke-linecap="round"/>' +
        '<path d="M154 88L166 80L158 76M148 76L154 62L142 72M138 74L138 58L132 72" fill="#c8801e" ' + S(2.6) + '/>' +
        '<circle cx="142" cy="94" r="4.2" fill="' + U('gem') + '" ' + S(2) + '/>' +
        // neck
        '<path d="M78 84Q90 96 102 96Q112 96 122 84L118 74L82 74Z" fill="' + U('skin2') + '" ' + S(3.6) + '/>' +
        '<path d="M80 88Q100 100 120 88" stroke="' + U('gold') + '" stroke-width="3.4" fill="none" stroke-linecap="round"/>' +

        /* ---------- horns ---------- */
        '<path d="M68 40C46 40 26 26 26 2C34 14 54 18 76 24Z" fill="' + U('horn') + '" ' + S(4) + '/>' + ridgesL +
        '<path d="M32 8C40 16 52 20 70 24" stroke="#fff6dc" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>' +
        '<path d="M112 38C134 38 152 24 152 2C144 14 128 18 108 24Z" fill="' + U('horn') + '" ' + S(4) + '/>' + ridgesR +
        '<path d="M146 8C138 16 126 20 112 24" stroke="#fff6dc" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>' +
        // ears
        '<path d="M60 58L38 52L54 70Z" fill="' + U('skin') + '" ' + S(3.4) + '/><path d="M56 58L46 55L54 65Z" fill="#7a1228"/>' +
        '<path d="M120 58L142 52L126 70Z" fill="' + U('skin2') + '" ' + S(3.4) + '/><path d="M124 58L134 55L126 65Z" fill="#4a0a1c"/>' +

        /* ---------- head ---------- */
        '<g class="part-head" style="transform-origin: 90px 80px">' +
        '<path d="M58 58C56 38 72 28 90 28C108 28 122 38 120 58C120 76 110 90 90 92C70 90 58 76 58 58Z" fill="' + U('skin') + '" ' + S(4.4) + '/>' +
        '<path d="M104 30C116 36 122 46 120 58C120 76 110 90 92 92C108 80 112 50 104 30Z" fill="#7a1228" opacity=".5"/>' +
        '<path d="M64 62C64 72 72 84 84 88" stroke="#ff9a8a" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".5"/>' +
        // cheek scar
        '<path d="M64 66L76 78" stroke="#f4b8a0" stroke-width="3" stroke-linecap="round"/><path d="M64 66L76 78" stroke="#7a1228" stroke-width="1" stroke-linecap="round"/><path d="M66 74l5 -3M70 79l5 -3" stroke="#7a1228" stroke-width="1.3" stroke-linecap="round"/>' +
        // crown
        '<path d="M60 44Q90 30 120 44L118 54Q90 42 62 54Z" fill="' + U('obs') + '" ' + S(3.6) + '/>' +
        '<path d="M62 46L58 28L74 40L76 18L88 38L92 12L100 38L108 20L110 42L124 26L118 48Z" fill="' + U('obs2') + '" ' + S(3.2) + '/>' +
        '<path d="M64 42L60 32M76 34L78 24M92 30L94 18M108 32L108 24M118 40L122 32" stroke="#8a7ab8" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>' +
        '<path d="M62 48Q90 36 118 48" stroke="' + U('gold') + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="90" cy="47" rx="6" ry="5.4" fill="' + U('gem') + '" ' + S(2.4) + '/><circle cx="88" cy="45" r="1.8" fill="#fff"/><circle cx="90" cy="47" r="10" fill="' + U('sig') + '" opacity=".5"/>' +
        // eyes
        '<g class="part-eyes" style="transform-origin: 90px 62px">' +
        '<ellipse cx="76" cy="62" rx="12" ry="9" fill="' + U('eyeg') + '" opacity=".7"/><ellipse cx="106" cy="62" rx="12" ry="9" fill="' + U('eyeg') + '" opacity=".7"/>' +
        '<path d="M66 62Q76 56 87 64Q78 71 66 62Z" fill="' + O + '"/><path d="M95 64Q106 56 116 62Q104 71 95 64Z" fill="' + O + '"/>' +
        '<path d="M68 62Q76 58 85 64Q77 69 68 62Z" fill="#ffe63a"/><path d="M97 64Q106 58 114 62Q105 69 97 64Z" fill="#ffe63a"/>' +
        '<path d="M70 63Q76 60 82 64" stroke="#ff9a1a" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="76" cy="64" rx="2.4" ry="4.4" fill="' + O + '"/><ellipse cx="105" cy="64" rx="2.4" ry="4.4" fill="' + O + '"/>' +
        '<circle cx="72.5" cy="61.5" r="1.9" fill="#fff"/><circle cx="101.5" cy="61.5" r="1.9" fill="#fff"/><circle cx="80" cy="66" r="1" fill="#fff" opacity=".85"/><circle cx="109" cy="66" r="1" fill="#fff" opacity=".85"/>' +
        '</g>' +
        // brows
        '<path d="M62 56L64 50L88 62L86 66Z" fill="#5a0c1e" ' + S(3.2) + '/><path d="M120 56L118 50L94 62L96 66Z" fill="#5a0c1e" ' + S(3.2) + '/>' +
        '<path d="M66 52L82 60M116 52L100 60" stroke="#c42a34" stroke-width="1.6" stroke-linecap="round"/>' +
        // scar over brow
        '<path d="M108 44L98 62" stroke="#f4b8a0" stroke-width="2.4" stroke-linecap="round" opacity=".9"/><path d="M104 50l4 2M101 56l4 2" stroke="#7a1228" stroke-width="1.2" stroke-linecap="round"/>' +
        // nose
        '<path d="M84 70Q90 66 96 70L94 76Q90 78 86 76Z" fill="#a01a2c" ' + S(2.4) + '/><ellipse cx="87.5" cy="74" rx="1.6" ry="1.2" fill="' + O + '"/><ellipse cx="92.5" cy="74" rx="1.6" ry="1.2" fill="' + O + '"/>' +
        // mouth
        '<path d="M66 78Q90 96 114 76Q114 92 90 98Q66 94 66 78Z" fill="' + O + '" ' + S(3.4) + '/>' +
        '<path d="M70 80Q90 94 110 79Q108 90 90 94Q72 90 70 80Z" fill="' + U('mouth') + '"/>' +
        '<path d="M72 82L75 90L79 84Z M82 87L86 96L90 88Z M92 88L96 96L100 87Z M102 85L106 90L109 82Z" fill="#fffbe8" ' + S(1.8) + '/>' +
        '<path d="M70 79L74 88L78 80Z M104 80L108 88L112 79Z" fill="#fffbe8" ' + S(2) + '/>' +
        '<path d="M83 91Q90 98 98 91Q91 94 83 91Z" fill="#ff5a6a"/>' +
        // goatee spikes
        '<path d="M78 92L82 104L88 96L92 108L96 96L102 104L104 92Z" fill="#3a0a18" ' + S(2.8) + '/><path d="M84 96L86 100M96 98L98 102" stroke="#8a2a44" stroke-width="1.4" stroke-linecap="round"/>' +
        // highlights
        '<path d="M72 40Q86 32 100 34" stroke="#ffc8b8" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>' +
        '</g>' +

        /* ---------- front arm + greatsword ---------- */
        '<g class="part-weapon" style="transform-origin: 58px 96px">' +
        '<g transform="translate(44 128) rotate(-23)">' +
        // flames wrapping blade (behind blade)
        '<ellipse cx="0" cy="-48" rx="20" ry="46" fill="' + U('sig') + '" opacity=".35"/>' +
        // blade
        '<path d="M-9 -8L-7 -74L0 -92L7 -74L9 -8Z" fill="' + U('blade') + '" ' + S(3.6) + '/>' +
        '<path d="M-1 -12V-84" stroke="#ff5a2a" stroke-width="3" stroke-linecap="round"/><path d="M-1 -12V-84" stroke="#ffe36a" stroke-width="1.2" stroke-linecap="round"/>' +
        '<path d="M-6 -20L-6 -70M6 -20L6 -70" stroke="#8a7ab8" stroke-width="1.4" opacity=".6"/>' +
        '<path d="M-9 -30L-14 -34L-9 -38M-9 -50L-14 -54L-9 -58M9 -40L14 -44L9 -48M9 -60L14 -64L9 -68" fill="#2a2044" stroke="' + O + '" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<path d="M-3 -78L-4 -14" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>' +
        // flames
        '<g class="part-cape" style="transform-origin: 0px -10px">' +
        fire(-13, -38, 5, 20, -3, 1.6) + fire(13, -56, 5, 20, 3, 1.6) + fire(0, -86, 6, 22, 0, 1.8) +
        '</g>' +
        // crossguard
        '<path d="M-22 -8Q-24 -20 -16 -22L-9 -10L9 -10L16 -22Q24 -20 22 -8Q10 -2 0 -2Q-10 -2 -22 -8Z" fill="' + U('gold') + '" ' + S(3.4) + '/>' +
        '<circle cx="0" cy="-7" r="4.4" fill="' + U('gem') + '" ' + S(2) + '/><circle cx="-1.2" cy="-8.2" r="1.3" fill="#fff"/>' +
        // grip
        '<rect x="-4" y="-2" width="8" height="20" rx="2" fill="#3a1a2a" ' + S(3) + '/><path d="M-4 3L4 6M-4 9L4 12" stroke="#8a4a5a" stroke-width="1.6"/>' +
        '<circle cx="0" cy="21" r="5" fill="' + U('gold') + '" ' + S(2.6) + '/>' +
        '</g>' +
        // arm
        '<path d="M58 96Q48 108 46 124" fill="none" stroke="' + O + '" stroke-width="22" stroke-linecap="round"/><path d="M58 96Q48 108 46 124" fill="none" stroke="' + U('skin') + '" stroke-width="15" stroke-linecap="round"/>' +
        '<path d="M53 100Q47 110 47 120" stroke="#ff9a8a" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".6"/>' +
        // bracer + broken shackle
        '<path d="M38 112L54 116L52 128L36 124Z" fill="' + U('obs') + '" ' + S(3.2) + '/><path d="M38 116L53 120" stroke="' + U('gold') + '" stroke-width="2.4"/>' +
        '<circle cx="37" cy="120" r="4" fill="#8a8a9c" ' + S(2.2) + '/>' +
        chain(35, 122, 24, 156, 5, 5, 0.9) + '<path d="M24 156l-5 5l8 1z" fill="#8a8a9c" ' + S(1.8) + '/>' +
        // fist
        '<circle cx="44" cy="130" r="10.5" fill="' + U('skin') + '" ' + S(3.8) + '/>' +
        '<path d="M36 126q5 -3 10 0M35 132q5 -3 11 0" stroke="' + O + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        '<path d="M50 124q3 2 3 6" stroke="#ff9a8a" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>' +
        '</g>' +

        /* ---------- embers & power motes ---------- */
        '<g fill="#ffb13a"><circle cx="14" cy="100" r="2.2"/><circle cx="188" cy="130" r="2"/><circle cx="24" cy="70" r="1.6"/><circle cx="106" cy="8" r="1.8"/><circle cx="184" cy="16" r="1.8"/><circle cx="10" cy="150" r="1.6"/></g>' +
        '<g fill="#ffe98a"><circle cx="30" cy="40" r="1.4"/><circle cx="170" cy="158" r="1.6"/><circle cx="8" cy="120" r="1.4"/></g>';
      return wrap(defs, sh, body);
    }
  };

  /* ============================================================ SCENE: DEMON GATE */
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function hell() {
    var r = rng(666), i, s = '', k;
    var o = 'stroke="' + O + '" stroke-linejoin="round" stroke-linecap="round"';
    s += '<defs>' +
      lg('hell-sky', [[0, '#1a0826'], [0.35, '#4a1230'], [0.75, '#a02a2e'], [1, '#e8602a']]) +
      lg('hell-ground', [[0, '#3a2440'], [1, '#150c1c']]) +
      lg('hell-lava', [[0, '#ffe46a'], [0.5, '#ff8a1f'], [1, '#e0361a']]) +
      lg('hell-path', [[0, '#5a4a6a'], [1, '#2e2440']]) +
      lg('hell-tower', [[0, '#4a3a62'], [1, '#1a1128']], 1, 0) +
      lg('hell-iron', [[0, '#6a6a80'], [0.5, '#34344a'], [1, '#14141e']], 1, 0) +
      lg('hell-mtn', [[0, '#3a1a3a'], [1, '#1c0c24']]) +
      rg('hell-moon', [[0, '#ffd8a0', 1], [0.5, '#ff7a3a', 0.6], [1, '#ff3a3a', 0]]) +
      rg('hell-glow', [[0, '#ffb13a', 0.8], [0.5, '#ff4a2a', 0.4], [1, '#ff2a2a', 0]]) +
      rg('hell-portal', [[0, '#fff0a0', 1], [0.35, '#ff8a2a', 0.9], [0.8, '#c81a3a', 0.85], [1, '#5a0a30', 0.9]]) +
      rg('hell-sig', [[0, '#fff6c0', 1], [0.4, '#ffb13a', 0.8], [1, '#ff4a1a', 0]]) +
      '</defs>';
    s += '<rect width="400" height="300" fill="url(#hell-sky)"/>';
    // blood moon
    s += '<circle cx="86" cy="62" r="70" fill="url(#hell-moon)" opacity=".7"/>';
    s += '<circle cx="86" cy="62" r="30" fill="#ff9a4a" stroke="#7a1a2a" stroke-width="2"/><circle cx="76" cy="54" r="7" fill="#e8703a"/><circle cx="98" cy="70" r="9" fill="#e8703a"/><circle cx="92" cy="48" r="4" fill="#e8703a"/>';
    // storm clouds
    for (i = 0; i < 9; i++) {
      var cx = i * 52 - 6 + r() * 20, cy = 24 + r() * 90, cw = 40 + r() * 40;
      s += '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(cw) + '" ry="' + f(7 + r() * 6) + '" fill="' + (i % 2 ? '#2a0f3a' : '#3c1440') + '" opacity=".75"/>';
      s += '<ellipse cx="' + f(cx) + '" cy="' + f(cy + 6) + '" rx="' + f(cw * 0.8) + '" ry="3" fill="#e8602a" opacity=".35"/>';
    }
    // far jagged mountains with lava veins
    s += '<path d="M-10 190L-10 138L16 120L34 146L56 112L78 150L104 126L126 154L150 118L172 152L200 132L228 154L250 122L276 150L300 116L322 148L346 124L370 150L392 128L410 140L410 190Z" fill="url(#hell-mtn)" ' + o + ' stroke-width="2.2"/>';
    s += '<g stroke="#ff7a2a" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".85"><path d="M56 118L60 134L54 146M150 124L154 140L148 150M250 128L256 140L250 150M300 122L304 136L298 148M104 132L108 144M346 130L350 142"/></g>';
    // distant lava rivers
    s += '<path d="M-10 176C40 168 80 184 130 176C180 168 220 184 270 176C320 168 360 182 410 176L410 186C360 194 320 178 270 186C220 194 180 178 130 186C80 194 40 178 -10 186Z" fill="url(#hell-lava)" ' + o + ' stroke-width="1.8"/>';
    s += '<path d="M-10 181C40 173 80 189 130 181C180 173 220 189 270 181C320 173 360 187 410 181" stroke="#ffe98a" stroke-width="1.6" fill="none" opacity=".7"/>';
    // obsidian towers
    function tower(x, w, h, tone) {
      var t = '<g>';
      t += '<path d="M' + (x - w / 2) + ' 192V' + (192 - h) + 'L' + x + ' ' + (192 - h - 34) + 'L' + (x + w / 2) + ' ' + (192 - h) + 'V192Z" fill="url(#hell-tower)" ' + o + ' stroke-width="2.6"/>';
      t += '<path d="M' + x + ' ' + (192 - h - 34) + 'L' + (x + w / 2) + ' ' + (192 - h) + 'V192H' + x + 'Z" fill="#100a1a" opacity=".5"/>';
      t += '<path d="M' + (x - w / 2 - 4) + ' ' + (192 - h) + 'H' + (x + w / 2 + 4) + 'V' + (192 - h + 8) + 'H' + (x - w / 2 - 4) + 'Z" fill="#2a1e3e" ' + o + ' stroke-width="2"/>';
      t += '<path d="M' + (x - w / 2 - 4) + ' ' + (192 - h) + 'l0 -8l5 4l4 -8l4 8l4 -8l4 8l5 -4' + '" fill="none" stroke="' + O + '" stroke-width="2"/>';
      t += '<path d="M' + x + ' ' + (192 - h - 34) + 'V' + (192 - h - 46) + '" stroke="' + O + '" stroke-width="2.4"/><path d="M' + x + ' ' + (192 - h - 46) + 'l12 3l-12 4z" fill="#e0361a" stroke="' + O + '" stroke-width="1.6"/>';
      for (var j = 0; j < 4; j++) {
        var wy = 192 - h + 22 + j * ((h - 40) / 4);
        t += '<path d="M' + (x - 3) + ' ' + f(wy + 8) + 'V' + f(wy) + 'Q' + x + ' ' + f(wy - 5) + ' ' + (x + 3) + ' ' + f(wy) + 'V' + f(wy + 8) + 'Z" fill="' + (j % 2 ? '#ff8a2a' : '#ffcf5a') + '" stroke="' + O + '" stroke-width="1.4"/>';
      }
      t += '<path d="M' + (x - w / 2 + 3) + ' ' + (192 - h + 14) + 'V186" stroke="#8a7ab8" stroke-width="1.6" opacity=".5"/>';
      return t + '</g>';
    }
    s += tower(50, 30, 96, 0) + tower(346, 34, 84, 0) + tower(20, 20, 56, 0) + tower(378, 22, 62, 0);
    // colossal gate: pillars
    function pillar(x) {
      var t = '<path d="M' + (x - 22) + ' 196V56H' + (x + 22) + 'V196Z" fill="url(#hell-tower)" ' + o + ' stroke-width="3"/>';
      t += '<path d="M' + x + ' 56H' + (x + 22) + 'V196H' + x + 'Z" fill="#0e0816" opacity=".45"/>';
      t += '<path d="M' + (x - 26) + ' 56H' + (x + 26) + 'V66H' + (x - 26) + 'Z" fill="#2c2044" ' + o + ' stroke-width="2.6"/>';
      t += '<path d="M' + (x - 26) + ' 56l6 -14l6 14l6 -18l8 18l8 -18l6 18l6 -14" fill="#3a2c58" ' + o + ' stroke-width="2.4"/>';
      t += '<path d="M' + (x - 26) + ' 166H' + (x + 26) + 'V176H' + (x - 26) + 'Z" fill="#2c2044" ' + o + ' stroke-width="2.6"/>';
      // rivets + sigils
      for (var j = 0; j < 5; j++) t += '<circle cx="' + (x - 14) + '" cy="' + (78 + j * 18) + '" r="2" fill="#8a7ab8"/><circle cx="' + (x + 14) + '" cy="' + (78 + j * 18) + '" r="2" fill="#8a7ab8"/>';
      t += '<circle cx="' + x + '" cy="106" r="12" fill="url(#hell-sig)"/>';
      t += '<path d="M' + x + ' 96L' + (x + 7) + ' 114L' + (x - 9) + ' 102L' + (x + 9) + ' 102L' + (x - 7) + ' 114Z" fill="none" stroke="#ffcf5a" stroke-width="1.8" stroke-linejoin="round"/><circle cx="' + x + '" cy="106" r="10" fill="none" stroke="#ffcf5a" stroke-width="1.8"/>';
      t += '<path d="M' + (x - 8) + ' 130l4 -6l4 6M' + (x + 2) + ' 132l4 -6l4 6M' + (x - 6) + ' 146h12" stroke="#ff8a2a" stroke-width="2" fill="none" stroke-linecap="round"/>';
      return t;
    }
    s += pillar(126) + pillar(274);
    // inner glow behind bars
    s += '<path d="M148 190V104Q200 64 252 104V190Z" fill="url(#hell-portal)" ' + o + ' stroke-width="2.4"/>';
    s += '<ellipse cx="200" cy="150" rx="46" ry="52" fill="url(#hell-glow)" opacity=".5"/>';
    // arch on top
    s += '<path d="M104 58Q200 -14 296 58L296 74Q200 8 104 74Z" fill="url(#hell-iron)" ' + o + ' stroke-width="3"/>';
    s += '<path d="M104 58Q200 -14 296 58" fill="none" stroke="#9a9ab4" stroke-width="1.6" opacity=".6"/>';
    for (i = 0; i < 9; i++) {
      var ax = 122 + i * 19, ay = 44 - 30 * Math.sin((ax - 104) / 192 * Math.PI) + 14 - 4;
      s += '<path d="M' + f(ax - 5) + ' ' + f(ay + 20) + 'L' + f(ax) + ' ' + f(ay - 8 - (i === 4 ? 10 : 0)) + 'L' + f(ax + 5) + ' ' + f(ay + 20) + 'Z" fill="#3c3c54" ' + o + ' stroke-width="2"/>';
    }
    // demon skull keystone
    s += '<path d="M182 18Q200 8 218 18L216 40Q200 48 184 40Z" fill="#e8dcc0" ' + o + ' stroke-width="2.6"/>';
    s += '<path d="M182 20L170 6L184 14M218 20L230 6L216 14" fill="#e8dcc0" ' + o + ' stroke-width="2.2"/>';
    s += '<path d="M187 28l7 3l-1 5zM213 28l-7 3l1 5z" fill="#ff5a2a" stroke="' + O + '" stroke-width="1.6"/><path d="M198 36l2 4l2 -4" fill="' + O + '"/><path d="M190 42V38M195 44V40M200 45V41M205 44V40M210 42V38" stroke="' + O + '" stroke-width="1.4"/>';
    s += '<circle cx="200" cy="30" r="20" fill="url(#hell-sig)" opacity=".4"/>';
    // gate bars
    s += '<path d="M148 190V104" stroke="' + O + '" stroke-width="0"/>';
    for (i = 0; i < 6; i++) {
      var bx = 154 + i * 18.4, by = 108 - 26 * Math.sin((bx - 148) / 104 * Math.PI);
      s += '<path d="M' + f(bx - 3.4) + ' 190V' + f(by + 12) + 'L' + f(bx) + ' ' + f(by - 4) + 'L' + f(bx + 3.4) + ' ' + f(by + 12) + 'V190Z" fill="url(#hell-iron)" ' + o + ' stroke-width="2"/>';
    }
    s += '<path d="M148 128H252M148 166H252" stroke="' + O + '" stroke-width="7" stroke-linecap="round"/><path d="M148 128H252M148 166H252" stroke="#4a4a62" stroke-width="3.4" stroke-linecap="round"/>';
    s += '<path d="M150 126H250" stroke="#9a9ab4" stroke-width="1" opacity=".6"/>';
    s += '<path d="M200 190V90" stroke="' + O + '" stroke-width="6" stroke-linecap="round"/><path d="M200 190V90" stroke="#4a4a62" stroke-width="2.6" stroke-linecap="round"/>';
    // gate sigil
    s += '<circle cx="200" cy="146" r="26" fill="url(#hell-sig)"/>';
    s += '<circle cx="200" cy="146" r="17" fill="#2a0a1a" stroke="' + O + '" stroke-width="2.6"/>';
    (function () {
      var p = [], a;
      for (var q = 0; q < 5; q++) { a = -Math.PI / 2 + q * 4 * Math.PI / 5; p.push(f(200 + 13 * Math.cos(a)) + ' ' + f(146 + 13 * Math.sin(a))); }
      s += '<path d="M' + p.join('L') + 'Z" fill="none" stroke="#ffcf5a" stroke-width="2" stroke-linejoin="round"/><circle cx="200" cy="146" r="13" fill="none" stroke="#ffcf5a" stroke-width="1.8"/><circle cx="200" cy="146" r="3" fill="#fff6c0"/>';
    })();
    // chains hanging from arch
    function hang(x, y0, len, sag) {
      var t = '', n = Math.round(len / 5.5);
      for (var j = 0; j <= n; j++) {
        var yy = y0 + j * (len / n), xx = x + Math.sin(j * 0.25) * sag;
        t += '<ellipse cx="' + f(xx) + '" cy="' + f(yy) + '" rx="' + (j % 2 ? 2.2 : 3) + '" ry="' + (j % 2 ? 3 : 2.2) + '" fill="' + (j % 2 ? '#7a7a8c' : '#a4a4b8') + '" stroke="' + O + '" stroke-width="1.4"/>';
      }
      return t;
    }
    s += hang(166, 52, 62, 1.5) + hang(234, 52, 48, 1.5) + hang(108, 68, 70, 2) + hang(292, 68, 84, 2);
    s += '<path d="M232 100q0 12 6 10q6 -2 0 -12" fill="none" stroke="' + O + '" stroke-width="2.4" stroke-linecap="round"/>';
    s += '<path d="M106 138l-6 14l6 -3l6 3z" fill="#8a8a9c" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/><path d="M290 152l-6 14l6 -3l6 3z" fill="#8a8a9c" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>';
    // wall extending left/right from pillars
    s += '<path d="M-10 196V158L20 152L20 146H60V152H100V196Z" fill="#1c1228" ' + o + ' stroke-width="2.2" opacity="0"/>';
    // ground (behind path)
    s += '<path d="M-10 190Q100 184 200 190T410 188V310H-10Z" fill="url(#hell-ground)"/>';
    s += '<path d="M-10 190Q100 184 200 190T410 188" fill="none" stroke="#6a4a80" stroke-width="2"/>';
    // lava river (near)
    s += '<path d="M-10 206C60 198 120 212 190 204C260 196 330 210 410 202L410 212C330 220 260 206 190 214C120 222 60 208 -10 216Z" fill="url(#hell-lava)" ' + o + ' stroke-width="2"/>';
    s += '<path d="M20 208q20 -3 40 0M150 208q20 -4 36 -2M280 206q20 -3 40 0" stroke="#fff3a0" stroke-width="2" fill="none" stroke-linecap="round"/>';
    s += '<path d="M-10 212C60 204 120 218 190 210C260 202 330 216 410 208" stroke="#ffd04a" stroke-width="10" opacity=".22" fill="none"/>';
    // spiky rocks
    function spikeRock(x, y, sc) {
      return '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')"><path d="M-16 0L-12 -14L-6 -8L0 -26L6 -10L12 -16L16 0Z" fill="#33244a" ' + o + ' stroke-width="2.4"/><path d="M0 -26L6 -10L12 -16L16 0H0Z" fill="#1a1128"/><path d="M-9 -4l3 -7" stroke="#8a7ab8" stroke-width="1.4" opacity=".6"/></g>';
    }
    s += spikeRock(30, 226, 1) + spikeRock(150, 222, 0.6) + spikeRock(262, 222, 0.7) + spikeRock(372, 226, 1.1);
    // skull torches
    function torch(x, y) {
      return '<g><path d="M' + (x - 3) + ' ' + y + 'V' + (y - 30) + '" stroke="' + O + '" stroke-width="8" stroke-linecap="round"/><path d="M' + (x - 3) + ' ' + y + 'V' + (y - 30) + '" stroke="#4a3a5a" stroke-width="4" stroke-linecap="round"/>' +
        '<ellipse cx="' + (x - 3) + '" cy="' + y + '" rx="10" ry="3.4" fill="#000" opacity=".3"/>' +
        '<circle cx="' + (x - 3) + '" cy="' + (y - 40) + '" r="16" fill="url(#hell-glow)"/>' +
        '<g transform="translate(' + (x - 3) + ' ' + (y - 33) + ')"><path d="M-9 0C-12 -10 -6 -16 0 -16C6 -16 12 -10 9 0L7 5L-7 5Z" fill="#efe6d0" stroke="' + O + '" stroke-width="2.2" stroke-linejoin="round"/><ellipse cx="-4" cy="-6" rx="2.8" ry="3.2" fill="#ff7a2a"/><ellipse cx="4" cy="-6" rx="2.8" ry="3.2" fill="#ff7a2a"/><path d="M-4 5V1M0 5V1M4 5V1" stroke="' + O + '" stroke-width="1.2"/></g>' +
        '<path d="M' + (x - 10) + ' ' + (y - 44) + 'Q' + (x - 12) + ' ' + (y - 56) + ' ' + (x - 6) + ' ' + (y - 64) + 'Q' + (x - 5) + ' ' + (y - 58) + ' ' + (x - 2) + ' ' + (y - 60) + 'Q' + x + ' ' + (y - 70) + ' ' + (x + 2) + ' ' + (y - 76) + 'Q' + (x + 8) + ' ' + (y - 60) + ' ' + (x + 6) + ' ' + (y - 46) + 'Z" fill="#ff7a1f" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M' + (x - 5) + ' ' + (y - 46) + 'Q' + (x - 6) + ' ' + (y - 56) + ' ' + (x - 1) + ' ' + (y - 62) + 'Q' + (x + 3) + ' ' + (y - 54) + ' ' + (x + 2) + ' ' + (y - 46) + 'Z" fill="#ffe36a"/></g>';
    }
    s += torch(96, 214) + torch(304, 214);
    // path: cracked obsidian slabs with glowing seams
    s += '<path d="M-10 226C80 216 170 222 240 220C310 218 360 224 410 222L410 266C340 272 250 262 180 266C110 270 50 262 -10 268Z" fill="#ff5a2a"/>';
    for (i = 0; i < 11; i++) {
      var px = -14 + i * 39 + r() * 4, py = 224 + r() * 4, w = 35, h = 40;
      s += '<path d="M' + f(px) + ' ' + f(py + 2) + 'l' + w + ' -2l2 ' + f(h - 4) + 'l' + (-w - 2) + ' 4z" fill="url(#hell-path)" ' + o + ' stroke-width="2"/>';
      s += '<path d="M' + f(px + 3) + ' ' + f(py + 5) + 'h' + (w - 8) + '" stroke="#8a7aa8" stroke-width="2" stroke-linecap="round"/>';
      if (i % 2 === 0) s += '<path d="M' + f(px + 10) + ' ' + f(py + 12) + 'l6 8l-2 8l6 6" stroke="#ff9a2a" stroke-width="1.8" fill="none"/>';
      else s += '<path d="M' + f(px + 22) + ' ' + f(py + 10) + 'l-5 7l4 8l-3 7" stroke="#ff6a2a" stroke-width="1.6" fill="none"/>';
    }
    s += '<path d="M-10 224C80 214 170 220 240 218C310 216 360 222 410 220" stroke="#ffb13a" stroke-width="3" fill="none" opacity=".8"/>';
    // foreground
    s += '<path d="M-10 276Q80 268 160 278T410 274V310H-10Z" fill="#150c1c"/>';
    s += '<path d="M60 290C90 282 140 296 180 288" stroke="url(#hell-lava)" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M270 292C300 286 340 296 370 290" stroke="url(#hell-lava)" stroke-width="4" fill="none" stroke-linecap="round"/>';
    s += spikeRock(14, 300, 1.5) + spikeRock(390, 302, 1.4) + spikeRock(210, 306, 1.1);
    // embers
    for (i = 0; i < 46; i++) {
      var ex = r() * 400, ey = r() * 290, er = 0.8 + r() * 2;
      s += '<circle cx="' + f(ex) + '" cy="' + f(ey) + '" r="' + f(er * 2.2) + '" fill="#ff8a2a" opacity=".2"/><circle cx="' + f(ex) + '" cy="' + f(ey) + '" r="' + f(er) + '" fill="' + (i % 3 ? '#ffb13a' : '#fff0a0') + '"/>';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice">' + s + '</svg>';
  }

  window.ENEMIES = window.ENEMIES || {};
  Object.keys(E).forEach(function (k) { window.ENEMIES[k] = E[k]; });
  window.SCENES = window.SCENES || {};
  window.SCENES.hell = { name: 'Demon Gate', sky: '#4a1230', svg: hell };
})();

/* Hero Go! — Chapter 8 "Storm Peaks" art. Adds to window.ENEMIES / window.SCENES.
 * Enemies: viewBox 0 0 200 200, feet y~190, FACING LEFT. Scene: viewBox 0 0 400 300.
 * Keys: harpy, stormwolf, gargoyle (mobs), stormknight (elite), thunderroc (boss), scene storm.
 */
(function () {
  'use strict';
  var O = '#2b1d14';

  function f(n) { return Math.round(n * 10) / 10; }
  function S(w) { return 'stroke="' + O + '" stroke-width="' + (w || 4) + '" stroke-linejoin="round" stroke-linecap="round"'; }
  function stops(a) { return a.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join(''); }
  function lg(id, a, x1, y1, x2, y2) {
    return '<linearGradient id="' + id + '" x1="' + (x1 == null ? 0 : x1) + '" y1="' + (y1 == null ? 0 : y1) + '" x2="' + (x2 == null ? 0 : x2) + '" y2="' + (y2 == null ? 1 : y2) + '">' + stops(a) + '</linearGradient>';
  }
  function rg(id, a, cx, cy, r) {
    return '<radialGradient id="' + id + '" cx="' + (cx == null ? 0.5 : cx) + '" cy="' + (cy == null ? 0.5 : cy) + '" r="' + (r == null ? 0.5 : r) + '">' + stops(a) + '</radialGradient>';
  }
  function shadow(rx, cx, op) {
    cx = cx == null ? 100 : cx;
    return '<g class="part-shadow"><ellipse cx="' + cx + '" cy="190" rx="' + rx + '" ry="' + f(4 + rx * 0.1) + '" fill="#000" opacity="' + (op == null ? 0.25 : op) + '"/></g>';
  }
  function wrap(defs, sh, body) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs>' + defs + '</defs>' + sh + '<g class="part-body">' + body + '</g></svg>';
  }
  function P(d, fill, sw, extra) { return '<path d="' + d + '" fill="' + fill + '" ' + (sw === 0 ? '' : S(sw || 3.5)) + (extra ? ' ' + extra : '') + '/>'; }
  function hl(x, y, rx, ry, rot, op, col) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" transform="rotate(' + (rot || 0) + ' ' + x + ' ' + y + ')" fill="' + (col || '#fff') + '" opacity="' + (op == null ? 0.7 : op) + '"/>'; }
  function limb(x1, y1, x2, y2, w, col) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + O + '" stroke-width="' + (w + 7) + '" stroke-linecap="round"/>' +
      '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round"/>';
  }
  // feather pointing up from (x,y), rotated clockwise by rot degrees. fill/dark may be gradients.
  function feather(x, y, len, w, rot, fill, dark, rach, sw) {
    var l = len, ww = w;
    var d = 'M0 0C' + f(ww * 0.9) + ' ' + f(-l * 0.25) + ' ' + f(ww) + ' ' + f(-l * 0.72) + ' 0 ' + f(-l) + 'C' + f(-ww) + ' ' + f(-l * 0.72) + ' ' + f(-ww * 0.9) + ' ' + f(-l * 0.25) + ' 0 0Z';
    var dk = 'M0 0C' + f(ww * 0.9) + ' ' + f(-l * 0.25) + ' ' + f(ww) + ' ' + f(-l * 0.72) + ' 0 ' + f(-l) + 'Q' + f(ww * 0.2) + ' ' + f(-l * 0.5) + ' 0 0Z';
    var b = '', k;
    if (l > 16) {
      for (k = 0.3; k < 0.75; k += 0.2) {
        b += 'M0 ' + f(-l * k) + 'L' + f(ww * 0.7) + ' ' + f(-l * (k + 0.11)) + 'M0 ' + f(-l * k) + 'L' + f(-ww * 0.7) + ' ' + f(-l * (k + 0.11));
      }
    }
    return '<g transform="translate(' + f(x) + ' ' + f(y) + ') rotate(' + f(rot) + ')"><path d="' + d + '" fill="' + fill + '" ' + S(sw || 2.2) + '/>' +
      '<path d="' + dk + '" fill="' + dark + '" opacity=".5"/>' +
      (b ? '<path d="' + b + '" stroke="' + (rach || O) + '" stroke-width=".8" opacity=".35" fill="none"/>' : '') +
      '<path d="M0 ' + f(-l * 0.05) + 'L0 ' + f(-l * 0.9) + '" stroke="' + (rach || O) + '" stroke-width="1.1" opacity=".55" fill="none"/></g>';
  }
  // lightning bolt shape pointing up from its base (0,0), height ~32*s
  function bolt(x, y, s, rot, fill, sw) {
    return '<g transform="translate(' + f(x) + ' ' + f(y) + ') rotate(' + f(rot) + ') scale(' + s + ')"><path d="M0 0L7 -13L1.5 -14L9 -32L-5 -14L0.5 -13Z" fill="' + fill + '" ' + S(sw == null ? 2 : sw) + '/></g>';
  }
  // glowing zig-zag electricity through points
  function zig(pts, col, core, w) {
    var d = 'M' + pts.map(function (p) { return f(p[0]) + ' ' + f(p[1]); }).join('L');
    return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + f(w * 3.2) + '" opacity=".28" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + f(w * 1.6) + '" opacity=".8" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="none" stroke="' + core + '" stroke-width="' + f(w * 0.7) + '" stroke-linejoin="round" stroke-linecap="round"/>';
  }
  // deterministic jagged bolt from (x1,y1) to (x2,y2)
  function arc(x1, y1, x2, y2, n, j, seed, col, core, w) {
    var pts = [[x1, y1]], i, t, dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / len, ny = dx / len;
    for (i = 1; i < n; i++) {
      t = i / n;
      var o = (((seed * 7 + i * 13) % 5) - 2) / 2 * j;
      pts.push([x1 + dx * t + nx * o, y1 + dy * t + ny * o]);
    }
    pts.push([x2, y2]);
    return zig(pts, col || '#7fe9ff', core || '#ffffff', w || 1.6);
  }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function uidv(u) { return u == null ? '0' : u; }

  var E = {};

  /* ============================================================ HARPY */
  E.harpy = {
    name: 'Storm Harpy',
    svg: function (uid) {
      uid = uidv(uid);
      var I = function (n) { return 'harpy-' + n + '-' + uid; };
      var defs = lg(I('wing'), [[0, '#2a2f78'], [0.55, '#4b6fd0'], [1, '#bfe8ff']]) +
        lg(I('wing2'), [[0, '#1c2058'], [1, '#5a52b8']]) +
        lg(I('hair'), [[0, '#6a3ac0'], [0.6, '#c85ae0'], [1, '#ffd0ff']]) +
        lg(I('skin'), [[0, '#ffd9b8'], [1, '#d99878']], 0, 0, 1, 1) +
        lg(I('top'), [[0, '#3ad0c0'], [1, '#146a80']]) +
        lg(I('leg'), [[0, '#ffe066'], [1, '#d99a1a']], 0, 0, 1, 0) +
        rg(I('glow'), [[0, '#9ff0ff', 0.6], [1, '#9ff0ff', 0]]);
      var b = '';
      b += '<circle cx="100" cy="100" r="92" fill="url(#' + I('glow') + ')"/>';
      // wings
      b += '<g class="part-cape" style="transform-origin: 112px 100px">';
      var i;
      for (i = 0; i < 7; i++) b += feather(118, 100, 74 - i * 3, 12, 22 + i * 14, 'url(#' + I('wing') + ')', '#141a52', '#0a1040');
      for (i = 0; i < 5; i++) b += feather(112, 98, 46 - i * 2, 11, 40 + i * 18, 'url(#' + I('wing2') + ')', '#141a52');
      b += P('M108 96Q124 80 138 94Q126 108 108 106Z', '#3a58c0', 3) + '<path d="M116 92l6 -6M124 96l6 -6" stroke="#bfe8ff" stroke-width="2" stroke-linecap="round"/>';
      b += arc(178, 70, 196, 40, 5, 7, 2, '#7fe9ff', '#fff', 1.2);
      b += '</g>';
      b += '<g class="part-cape" style="transform-origin: 88px 104px">';
      for (i = 0; i < 6; i++) b += feather(84, 104, 60 - i * 3, 11, -112 + i * 13, 'url(#' + I('wing') + ')', '#141a52', '#0a1040');
      for (i = 0; i < 4; i++) b += feather(88, 100, 38, 10, -80 + i * 16, 'url(#' + I('wing2') + ')', '#141a52');
      b += P('M94 100Q80 84 66 96Q78 110 94 108Z', '#3a58c0', 3) + arc(24, 88, 8, 62, 4, 6, 3, '#7fe9ff', '#fff', 1.1);
      b += '</g>';
      // tail feathers
      b += '<g class="part-cape" style="transform-origin: 108px 146px">';
      for (i = 0; i < 4; i++) b += feather(108, 146, 40 - i * 2, 8, 128 + i * 16, 'url(#' + I('hair') + ')', '#3a1a80');
      b += '</g>';
      // legs
      b += P('M86 148Q78 166 84 176L96 176Q98 162 100 148Z', 'url(#' + I('leg') + ')', 3.5);
      b += P('M104 148Q108 164 118 174L128 168Q118 160 116 148Z', 'url(#' + I('leg') + ')', 3.5);
      b += '<path d="M84 158h10M84 166h10M108 158l8 4M112 166l8 4" stroke="' + O + '" stroke-width="1.6" opacity=".45" stroke-linecap="round"/>';
      // talons
      b += P('M84 176Q70 176 64 184Q72 182 78 186Q84 184 90 186Q98 186 98 176Z', '#e6a91c', 3);
      b += P('M64 184l-4 6 8 -3zM78 186l-3 7 7 -4zM90 186l-1 7 6 -5z', '#f4f0e0', 2);
      b += P('M118 174Q126 182 138 180Q132 176 128 168Z', '#e6a91c', 3);
      b += P('M138 180l6 4 -8 1zM130 184l3 6 4 -6z', '#f4f0e0', 2);
      // thigh feathers
      for (i = 0; i < 4; i++) b += feather(84 + i * 7, 146, 26, 8, 180 - i * 6, 'url(#' + I('hair') + ')', '#3a1a80');
      for (i = 0; i < 3; i++) b += feather(106 + i * 6, 146, 24, 8, 176 + i * 6, 'url(#' + I('hair') + ')', '#3a1a80');
      // torso
      b += P('M78 96Q100 88 122 96L118 132Q100 142 82 132Z', 'url(#' + I('skin') + ')', 4);
      b += P('M76 94Q100 84 124 94L120 120Q100 130 80 120Z', 'url(#' + I('top') + ')', 4);
      b += '<path d="M80 108Q100 116 120 108M84 118Q100 124 116 118" stroke="#0a3a4a" stroke-width="2.2" fill="none"/>';
      b += bolt(100, 116, 0.55, 0, '#fff08a', 1.8);
      b += hl(88, 100, 6, 2.5, -20, 0.6);
      // waist feather skirt
      for (i = 0; i < 6; i++) b += feather(82 + i * 7.5, 128, 24, 7, 176 + (i - 2.5) * 5, 'url(#' + I('wing') + ')', '#141a52');
      // head
      b += '<g class="part-head">';
      for (i = 0; i < 9; i++) b += feather(88, 56, 40 + (i % 3) * 8, 8, 40 + i * 20, 'url(#' + I('hair') + ')', '#3a1a80', '#2a0a60');
      b += P('M62 46l-8 -14 14 6z', '#c85ae0', 2.5) + P('M100 40l6 -14 4 14z', '#c85ae0', 2.5);
      b += P('M96 60l14 -2 -6 10z', '#ffd0ff', 2.2);
      b += '<ellipse cx="80" cy="58" rx="21" ry="22" fill="url(#' + I('skin') + ')" ' + S(4) + '/>';
      b += P('M98 54l12 -6 -2 12z', '#e8a888', 2.5);
      b += P('M66 66Q78 60 92 64Q90 80 78 82Q66 78 66 66Z', '#5a1020', 2.5);
      b += P('M69 65l3 6 4 -6zM82 63l2 6 4 -5z', '#fff', 1.4);
      b += P('M72 76Q78 82 86 76Q80 72 72 76Z', '#ff6a80', 0);
      b += '<path d="M60 58l6 4" stroke="' + O + '" stroke-width="2" stroke-linecap="round"/>';
      b += '<path d="M60 44L76 52M100 46L88 52" stroke="' + O + '" stroke-width="4.5" stroke-linecap="round"/>';
      b += '<g class="part-eyes" style="transform-origin: 80px 54px"><ellipse cx="70" cy="56" rx="7" ry="6.5" fill="#fff6a0" ' + S(2.6) + '/><ellipse cx="68.5" cy="57" rx="2" ry="5" fill="' + O + '"/><circle cx="67" cy="54" r="1.4" fill="#fff"/>' +
        '<ellipse cx="90" cy="56" rx="6" ry="5.8" fill="#fff6a0" ' + S(2.6) + '/><ellipse cx="88.6" cy="57" rx="1.8" ry="4.6" fill="' + O + '"/><circle cx="87" cy="54.5" r="1.2" fill="#fff"/></g>';
      b += hl(72, 44, 8, 3, -20, 0.5);
      b += '</g>';
      b += bolt(150, 40, 0.5, 20, '#fff08a', 1.6) + bolt(40, 130, 0.4, -20, '#fff08a', 1.4);
      return wrap(defs, shadow(40, 100, 0.2), b);
    }
  };

  /* ============================================================ STORM WOLF */
  E.stormwolf = {
    name: 'Storm Wolf',
    svg: function (uid) {
      uid = uidv(uid);
      var I = function (n) { return 'stormwolf-' + n + '-' + uid; };
      var defs = lg(I('fur'), [[0, '#9fb4d6'], [0.55, '#5f7aa8'], [1, '#34456e']], 0, 0, 0.3, 1) +
        lg(I('belly'), [[0, '#e8f2ff'], [1, '#a8bede']]) +
        lg(I('mane'), [[0, '#ffffff'], [0.5, '#a8f0ff'], [1, '#3a8ad8']], 0, 0, 1, 0) +
        rg(I('eye'), [[0, '#ffffff', 1], [0.35, '#ffe84a', 0.95], [1, '#ffe84a', 0]]) +
        rg(I('halo'), [[0, '#8fe8ff', 0.55], [1, '#8fe8ff', 0]]);
      var b = '', i;
      b += '<ellipse cx="104" cy="120" rx="98" ry="70" fill="url(#' + I('halo') + ')"/>';
      // tail
      b += '<g class="part-cape" style="transform-origin: 150px 118px">';
      b += P('M148 122Q178 118 184 84Q186 66 176 52Q172 76 158 90Q150 100 140 106Z', 'url(#' + I('fur') + ')', 4);
      b += P('M176 52Q182 66 180 80Q176 66 170 60Z', 'url(#' + I('mane') + ')', 2.5);
      b += '<path d="M156 108Q170 100 176 84M160 116Q174 108 180 92" stroke="#dff4ff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>';
      b += arc(178, 56, 192, 30, 4, 6, 4, '#7fe9ff', '#fff', 1.3);
      b += '</g>';
      // back legs
      b += P('M124 146Q150 140 152 162L148 176L152 189L120 189L122 178Z', '#3e5282', 3.5);
      b += P('M146 152Q160 156 158 174L156 189L172 189L168 176Q172 156 156 140Z', 'url(#' + I('fur') + ')', 3.5);
      b += '<path d="M152 189l0 -6M158 189l0 -6M164 189l0 -6" stroke="#f4f0e0" stroke-width="2.2" stroke-linecap="round"/>';
      // body
      b += P('M56 118Q60 92 96 88Q132 84 152 104Q166 122 148 148Q130 162 100 160Q70 162 58 140Z', 'url(#' + I('fur') + ')', 4);
      b += P('M58 132Q80 156 116 158Q100 146 92 134Q76 138 58 132Z', 'url(#' + I('belly') + ')', 2.5);
      b += P('M96 88Q132 84 152 104Q140 100 120 102Q104 98 96 88Z', '#a8c0e6', 0, 'opacity=".6"');
      b += P('M150 120Q160 138 146 150Q140 136 150 120Z', '#2a3a62', 0, 'opacity=".5"');
      // flank bolt
      b += P('M110 108L128 106L120 120L136 118L106 146L114 124L100 126Z', '#ffe84a', 2.5);
      b += P('M112 110L124 109L116 121Z', '#fffbd0', 0, 'opacity=".9"');
      b += '<path d="M84 112q10 6 12 18M130 132q8 4 10 14M74 126q8 4 10 12" stroke="#28386a" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>';
      // front legs
      b += P('M62 140L60 168L56 189L84 189L80 176L88 140Z', '#3e5282', 3.5);
      b += P('M84 142L92 168L90 189L116 189L110 176L106 140Z', 'url(#' + I('fur') + ')', 3.5);
      b += '<path d="M60 189l0 -6M67 189l0 -6M74 189l0 -6M96 189l0 -6M103 189l0 -6M110 189l0 -6" stroke="#f4f0e0" stroke-width="2.2" stroke-linecap="round"/>';
      b += hl(96, 100, 12, 3, 10, 0.5);
      // mane spikes swept back
      b += '<g class="part-cape" style="transform-origin: 84px 90px">';
      var mp = [[78, 84, 124, 60], [86, 90, 138, 76], [92, 98, 146, 94], [80, 76, 112, 46], [70, 78, 98, 44], [96, 84, 148, 82]];
      for (i = 0; i < mp.length; i++) {
        var m = mp[i];
        b += P('M' + m[0] + ' ' + m[1] + 'Q' + f((m[0] + m[2]) / 2) + ' ' + f(m[1] - 14) + ' ' + m[2] + ' ' + m[3] + 'Q' + f((m[0] + m[2]) / 2 - 2) + ' ' + f(m[1] + 8) + ' ' + (m[0] + 10) + ' ' + (m[1] + 14) + 'Z', 'url(#' + I('mane') + ')', 3);
      }
      b += arc(122, 58, 140, 34, 4, 6, 5, '#7fe9ff', '#fff', 1.3) + arc(148, 92, 170, 84, 4, 5, 6, '#7fe9ff', '#fff', 1.2);
      b += '</g>';
      // neck fluff & head
      b += '<g class="part-head">';
      b += P('M72 78Q92 72 96 96Q92 118 72 124Z', 'url(#' + I('fur') + ')', 4);
      b += P('M44 70L48 46L62 62Z', '#3e5282', 3.5) + P('M64 62L76 40L84 66Z', 'url(#' + I('fur') + ')', 3.5);
      b += P('M50 62L52 52L58 62Z', '#ffb0c0', 0, 'opacity=".7"');
      b += P('M76 82Q76 60 52 60Q34 62 22 92Q12 102 14 112Q20 122 40 122Q70 124 78 106Z', 'url(#' + I('fur') + ')', 4);
      // open jaw
      b += P('M18 108Q30 106 50 108Q72 108 76 112Q70 130 48 132Q24 132 16 122Z', '#5a1a30', 3.5);
      b += P('M26 108l4 10 5 -10zM42 108l3 8 4 -8z', '#fff', 1.8);
      b += P('M24 122l4 -8 4 8zM40 124l3 -8 4 8z', '#fff', 1.8);
      b += P('M30 122Q42 130 56 124Q48 120 36 118Z', '#ff6a80', 0);
      b += P('M16 92Q10 96 14 104Q22 102 26 96Z', '#1a1418', 3);
      b += '<circle cx="17" cy="96" r="1.6" fill="#fff" opacity=".8"/>';
      b += '<path d="M28 84Q40 78 56 82M30 96q8 2 14 0M44 90q6 -2 12 0" stroke="#28386a" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".6"/>';
      b += '<path d="M58 70L34 88" stroke="' + O + '" stroke-width="5.5" stroke-linecap="round"/>';
      b += '<circle cx="50" cy="84" r="14" fill="url(#' + I('eye') + ')"/>';
      b += '<g class="part-eyes" style="transform-origin: 48px 86px"><path d="M36 82L60 78L58 92Q44 96 36 82Z" fill="#ffe84a" ' + S(2.6) + '/><ellipse cx="46" cy="86" rx="2.2" ry="5" fill="' + O + '"/><circle cx="44" cy="83" r="1.6" fill="#fff"/></g>';
      b += hl(60, 66, 9, 3, 30, 0.5);
      b += '</g>';
      // sparks
      b += bolt(100, 78, 0.5, 15, '#fff08a', 1.4) + bolt(178, 150, 0.6, 25, '#fff08a', 1.6) + bolt(30, 60, 0.45, -25, '#fff08a', 1.3);
      b += arc(112, 158, 96, 188, 4, 5, 7, '#7fe9ff', '#fff', 1.2);
      return wrap(defs, shadow(70, 106), b);
    }
  };

  /* ============================================================ GARGOYLE */
  E.gargoyle = {
    name: 'Stone Gargoyle',
    svg: function (uid) {
      uid = uidv(uid);
      var I = function (n) { return 'gargoyle-' + n + '-' + uid; };
      var defs = lg(I('stone'), [[0, '#c4c9d8'], [0.5, '#8990a8'], [1, '#575e78']], 0, 0, 1, 1) +
        lg(I('dark'), [[0, '#6c738c'], [1, '#3a4058']]) +
        lg(I('wing'), [[0, '#9aa0b8'], [1, '#4a5068']], 0, 0, 1, 1) +
        rg(I('eye'), [[0, '#ffffff', 1], [0.35, '#ffb02a', 0.95], [1, '#ff6a1a', 0]]) +
        rg(I('moss'), [[0, '#9adf60'], [1, '#4e9a3a']], 0.35, 0.3, 0.8);
      var b = '', i;
      function crack(d) { return '<path d="' + d + '" stroke="#262a3c" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'; }
      function moss(x, y, rx, ry) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="url(#' + I('moss') + ')" stroke="#2e5a24" stroke-width="1.6"/><ellipse cx="' + f(x - rx * 0.3) + '" cy="' + f(y - ry * 0.3) + '" rx="' + f(rx * 0.35) + '" ry="' + f(ry * 0.3) + '" fill="#d4f8a0" opacity=".7"/>'; }
      // wings
      b += '<g class="part-cape" style="transform-origin: 122px 96px">';
      b += P('M120 100Q128 50 168 22Q166 44 182 52Q168 60 176 76Q160 76 164 96Q148 90 148 108Z', 'url(#' + I('wing') + ')', 4);
      b += '<path d="M124 98L166 26M128 100L180 54M138 104L174 78" stroke="#3a4058" stroke-width="3.6" stroke-linecap="round"/>';
      b += '<path d="M132 90L156 52M150 96L166 70" stroke="#c4c9d8" stroke-width="1.6" opacity=".6" stroke-linecap="round"/>';
      b += crack('M150 60l6 8l-4 6l6 8') + moss(172, 62, 6, 3.5);
      b += P('M168 22l6 -6 -2 10z', '#575e78', 2.5);
      b += '</g>';
      // tail
      b += '<g class="part-cape" style="transform-origin: 148px 160px">';
      b += P('M144 166Q178 174 184 148Q186 136 176 130Q172 148 154 150Z', 'url(#' + I('stone') + ')', 4);
      b += P('M176 130L190 112L188 132L198 140L180 144Z', 'url(#' + I('dark') + ')', 3.5) + '</g>';
      // back leg / haunch
      b += '<ellipse cx="132" cy="160" rx="24" ry="26" fill="url(#' + I('stone') + ')" ' + S(4) + '/>';
      b += P('M112 176L148 176L152 190L108 190Z', 'url(#' + I('dark') + ')', 3.5);
      b += '<path d="M116 190l-2 -8M126 190l-1 -8M136 190l0 -8M146 190l1 -8" stroke="#2b2f42" stroke-width="3" stroke-linecap="round"/>';
      b += crack('M126 142l-6 10l8 6l-4 10') + moss(146, 148, 7, 4);
      // body hunch
      b += P('M62 100Q70 60 112 62Q146 66 150 110Q154 150 118 168Q84 172 68 146Z', 'url(#' + I('stone') + ')', 4);
      b += P('M118 168Q154 150 150 110Q146 90 138 82Q140 130 118 168Z', 'url(#' + I('dark') + ')', 0, 'opacity=".6"');
      b += P('M74 110Q92 104 104 116Q92 142 76 138Z', '#a8aec4', 0, 'opacity=".55"');
      // spine ridge
      b += P('M108 62l6 -14 6 14M124 66l8 -12 4 14M138 76l10 -8 0 16', '#575e78', 3);
      b += '<path d="M84 122h14M86 130h14M90 138h12" stroke="#3a4058" stroke-width="2" stroke-linecap="round" opacity=".55"/>';
      b += crack('M112 84l8 12l-6 8l10 10l-6 10') + crack('M92 150l6 -8l8 4') + moss(100, 72, 10, 5) + moss(80, 148, 6, 3.5);
      b += '<path d="M126 96l5 3M120 112l5 2M132 118l4 3" stroke="#f0f2fa" stroke-width="1.6" opacity=".5" stroke-linecap="round"/>';
      // front arms
      b += P('M62 132Q52 152 58 172L84 172Q86 152 84 134Z', 'url(#' + I('stone') + ')', 3.5);
      b += P('M50 172Q50 164 62 164L92 164Q96 172 92 180L54 182Z', 'url(#' + I('stone') + ')', 3.5);
      b += P('M52 182L44 190L60 190ZM66 182L62 190L74 190ZM80 182L78 190L90 190Z', '#2b2f42', 2.5);
      b += '<path d="M60 172v6M72 172v6M84 172v6" stroke="#3a4058" stroke-width="2" opacity=".5"/>';
      // head
      b += '<g class="part-head">';
      // horns
      b += P('M92 52Q104 36 100 14Q118 30 112 58Z', '#e6dcc0', 3.5);
      b += '<path d="M98 30l8 4M100 40l8 4" stroke="#a89a78" stroke-width="1.8"/>';
      b += P('M56 54Q48 42 52 30L60 26L66 34L64 60Z', '#e6dcc0', 3.5);
      b += P('M52 30L60 26L66 34L58 32Z', '#c4b898', 0);
      b += '<path d="M54 44l6 1" stroke="#a89a78" stroke-width="1.8"/>';
      b += P('M96 66L114 66L108 82Z', '#575e78', 3);
      b += P('M50 76Q46 50 74 46Q102 44 102 74Q104 94 76 98Q52 98 50 76Z', 'url(#' + I('stone') + ')', 4);
      b += P('M96 62Q106 80 92 94Q102 78 96 62Z', 'url(#' + I('dark') + ')', 0, 'opacity=".6"');
      // muzzle jaw
      b += P('M46 84Q42 74 56 72L74 76L76 92Q66 102 52 98Q44 94 46 84Z', 'url(#' + I('stone') + ')', 3.5);
      b += P('M50 90Q64 98 78 92Q70 102 56 102Q48 100 50 90Z', '#2b2f42', 0);
      b += P('M52 90l3 -10 4 10zM64 94l3 -9 4 9z', '#fffdf0', 2);
      b += P('M56 100l2 8 4 -8z', '#fffdf0', 1.6);
      b += '<ellipse cx="52" cy="78" rx="3" ry="2.2" fill="#262a3c"/>';
      // brow
      b += P('M56 64Q66 56 82 62L80 68Q66 64 58 70Z', '#575e78', 3);
      b += '<path d="M60 52l8 4M86 50l4 6" stroke="#262a3c" stroke-width="2" stroke-linecap="round"/>';
      b += '<circle cx="68" cy="70" r="12" fill="url(#' + I('eye') + ')"/><circle cx="90" cy="70" r="8" fill="url(#' + I('eye') + ')"/>';
      b += '<g class="part-eyes" style="transform-origin: 78px 70px"><ellipse cx="68" cy="70" rx="6.2" ry="5" fill="#ffd040" ' + S(2.4) + '/><ellipse cx="66.6" cy="70.6" rx="1.8" ry="4" fill="' + O + '"/><circle cx="65.6" cy="68.4" r="1.3" fill="#fff"/>' +
        '<ellipse cx="90" cy="70" rx="5" ry="4.4" fill="#ffd040" ' + S(2.4) + '/><ellipse cx="88.8" cy="70.6" rx="1.5" ry="3.4" fill="' + O + '"/></g>';
      b += crack('M76 48l-4 10l6 6') + crack('M94 82l-4 8') + moss(84, 50, 8, 3.5);
      b += hl(70, 52, 8, 2.6, -15, 0.55);
      b += '</g>';
      b += moss(140, 100, 6, 3) + '<path d="M104 140l-8 4" stroke="#7fe9ff" stroke-width="1.6" opacity=".0"/>';
      return wrap(defs, shadow(74, 108), b);
    }
  };

  /* ============================================================ STORM KNIGHT (elite) */
  E.stormknight = {
    name: 'Storm Knight',
    svg: function (uid) {
      uid = uidv(uid);
      var I = function (n) { return 'stormknight-' + n + '-' + uid; };
      var defs = lg(I('plate'), [[0, '#5a78c8'], [0.45, '#2c407e'], [1, '#141e46']], 0, 0, 1, 1) +
        lg(I('plate2'), [[0, '#46609e'], [1, '#101a3c']]) +
        lg(I('gold'), [[0, '#fff0a0'], [0.5, '#e6b830'], [1, '#9a6a14']], 0, 0, 1, 1) +
        lg(I('cape'), [[0, '#4a5a98'], [0.5, '#2a3468'], [1, '#141a3a']]) +
        lg(I('steel'), [[0, '#e8f0ff'], [0.5, '#8ea0c8'], [1, '#4a5680']], 0, 0, 0, 1) +
        rg(I('halo'), [[0, '#8fe8ff', 0.55], [1, '#8fe8ff', 0]]) +
        rg(I('tip'), [[0, '#ffffff', 1], [0.3, '#9ff0ff', 0.9], [1, '#3ad0ff', 0]]);
      var b = '', i;
      function rivets(pts, r) { return pts.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (r || 1.5) + '" fill="#e6b830" stroke="' + O + '" stroke-width="1"/>'; }).join(''); }
      b += '<ellipse cx="100" cy="106" rx="98" ry="90" fill="url(#' + I('halo') + ')"/>';
      // cape
      b += '<g class="part-cape" style="transform-origin: 122px 72px">';
      b += P('M112 66Q160 60 186 100Q192 146 178 180L166 168L156 190L144 170L130 188L118 164Q116 120 112 66Z', 'url(#' + I('cape') + ')', 4);
      b += '<path d="M150 90q14 4 20 -8M140 118q16 6 26 -6M136 146q16 4 26 -6" stroke="#8ea0e0" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>';
      b += '<path d="M130 100q-6 30 -2 60M148 84q8 34 4 80" stroke="#0a1030" stroke-width="2.5" fill="none" opacity=".6"/>';
      b += bolt(158, 134, 0.6, 12, '#7fe9ff', 1.2) + arc(176, 100, 190, 128, 4, 5, 3, '#7fe9ff', '#fff', 1.1);
      b += '</g>';
      // back leg
      b += P('M108 128L136 128L132 176L112 176Z', 'url(#' + I('plate2') + ')', 3.5);
      b += P('M108 172L138 172L146 190L104 190Z', 'url(#' + I('plate2') + ')', 3.5);
      b += '<ellipse cx="124" cy="148" rx="11" ry="9" fill="url(#' + I('gold') + ')" ' + S(3) + '/>';
      // front leg
      b += P('M66 128L100 128L100 176L72 176Z', 'url(#' + I('plate') + ')', 3.5);
      b += P('M62 172L102 172L108 190L54 190Z', 'url(#' + I('plate') + ')', 3.5);
      b += P('M54 190Q56 178 66 176L68 190Z', '#101a3c', 2.5);
      b += '<ellipse cx="82" cy="150" rx="13" ry="10" fill="url(#' + I('gold') + ')" ' + S(3) + '/>' + '<path d="M82 142l-2 8 4 -2 -2 8" stroke="#3a2a10" stroke-width="1.6" fill="none"/>';
      b += bolt(84, 172, 0.5, 0, '#7fe9ff', 1.2);
      b += rivets([[74, 134], [92, 134], [70, 178], [96, 178]]);
      b += '<path d="M72 134L98 134" stroke="#8ea0e0" stroke-width="2" opacity=".6"/>';
      // tassets
      b += P('M64 116L104 118L102 142Q84 148 66 138Z', 'url(#' + I('plate') + ')', 3.5);
      b += P('M104 118L140 116L138 138Q122 146 102 142Z', 'url(#' + I('plate2') + ')', 3.5);
      b += '<path d="M78 120v20M90 122v20M116 122v20M128 120v18" stroke="#0a1030" stroke-width="2" opacity=".6"/>';
      // torso
      b += P('M62 76Q100 62 140 76L134 122Q100 134 68 122Z', 'url(#' + I('plate') + ')', 4);
      b += P('M104 70Q136 72 140 76L134 122Q118 128 104 128Z', '#101a3c', 0, 'opacity=".45"');
      b += P('M66 112Q100 126 134 112L134 122Q100 136 66 122Z', 'url(#' + I('gold') + ')', 3);
      b += rivets([[76, 118], [90, 122], [104, 124], [118, 122], [128, 118]], 1.6);
      b += '<path d="M100 76L100 110" stroke="#0a1030" stroke-width="2.5"/>';
      // chest bolt engraving
      b += '<circle cx="100" cy="94" r="22" fill="url(#' + I('tip') + ')"/>';
      b += '<path d="M104 78L90 96L100 96L94 112L112 90L102 90Z" fill="#c8f8ff" stroke="#3ad0ff" stroke-width="2" stroke-linejoin="round"/>';
      b += '<path d="M70 86Q82 78 94 80" stroke="#a8c0f0" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>';
      b += '<path d="M112 84l12 -2M114 96l14 -2M112 106l12 0" stroke="#7fe9ff" stroke-width="1.6" opacity=".75" stroke-linecap="round"/>';
      // back arm and pauldron
      b += P('M126 72Q158 66 164 92Q160 106 140 104Z', 'url(#' + I('plate2') + ')', 4);
      b += P('M150 70l10 -18 2 22zM162 80l16 -10 -6 24z', 'url(#' + I('gold') + ')', 3);
      b += '<path d="M132 76Q148 74 156 84" stroke="#8ea0e0" stroke-width="2.4" fill="none" opacity=".6"/>';
      // shield (front)
      b += P('M38 96L80 96Q84 132 62 158Q42 138 38 96Z', 'url(#' + I('plate') + ')', 4.5);
      b += P('M44 100L76 100Q78 128 62 148Q48 132 44 100Z', '#1a2a62', 3);
      b += P('M62 158Q84 132 80 96L70 96Q74 130 62 158Z', '#101a3c', 0, 'opacity=".5"');
      b += '<path d="M38 96L80 96Q84 132 62 158Q42 138 38 96Z" fill="none" stroke="url(#' + I('gold') + ')" stroke-width="2.6" stroke-dasharray="0"/>';
      b += P('M66 102L52 124L62 124L54 144L74 118L64 118Z', '#c8f8ff', 2.2);
      b += rivets([[44, 100], [74, 100], [62, 154], [42, 118], [78, 118]]);
      b += '<circle cx="60" cy="124" r="14" fill="url(#' + I('tip') + ')" opacity=".6"/>';
      // lance (weapon) — held forward, tilted upward
      b += '<g class="part-weapon" style="transform-origin: 138px 84px">';
      b += P('M124 82Q120 96 116 102L132 104Q140 96 140 84Z', 'url(#' + I('plate') + ')', 3.5);
      b += '<g transform="rotate(10 118 100)">';
      b += '<rect x="20" y="96.5" width="150" height="7" rx="3" fill="url(#' + I('steel') + ')" ' + S(3) + '/>';
      b += '<path d="M40 100h110" stroke="#fff" stroke-width="1.4" opacity=".6"/>';
      b += '<rect x="66" y="94" width="5" height="12" fill="url(#' + I('gold') + ')" ' + S(1.8) + '/><rect x="90" y="94" width="5" height="12" fill="url(#' + I('gold') + ')" ' + S(1.8) + '/>';
      b += '<circle cx="106" cy="100" r="15" fill="url(#' + I('gold') + ')" ' + S(3.5) + '/><circle cx="106" cy="100" r="9" fill="#2c407e" ' + S(2) + '/><path d="M107 94l-4 7h4l-3 6 7 -8h-4z" fill="#c8f8ff"/>';
      b += P('M170 100l8 -6 0 12z', 'url(#' + I('gold') + ')', 2.5);
      b += P('M24 92L2 100L24 108Q20 100 24 92Z', 'url(#' + I('steel') + ')', 3.5);
      b += '<path d="M22 100L6 100" stroke="#fff" stroke-width="1.6" opacity=".8"/>';
      b += '<circle cx="8" cy="100" r="16" fill="url(#' + I('tip') + ')"/>';
      b += '</g>';
      b += P('M104 92Q124 84 136 92L134 108Q112 112 104 104Z', 'url(#' + I('plate') + ')', 3.5);
      b += rivets([[112, 96], [124, 96]]);
      b += arc(14, 74, 34, 56, 4, 6, 1, '#7fe9ff', '#fff', 1.4) + arc(10, 86, 2, 60, 4, 5, 2, '#7fe9ff', '#fff', 1.2) + arc(12, 90, 30, 84, 3, 4, 4, '#7fe9ff', '#fff', 1.1);
      b += '</g>';
      // front pauldron
      b += P('M56 76Q64 60 92 66L96 84Q76 96 58 92Z', 'url(#' + I('plate') + ')', 4);
      b += P('M62 70l-6 -18 14 12zM72 64l2 -20 12 18z', 'url(#' + I('gold') + ')', 3);
      b += '<path d="M62 82Q76 72 90 74" stroke="#a8c0f0" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/>';
      b += rivets([[70, 84], [82, 80]]);
      // helmet
      b += '<g class="part-head">';
      b += '<g transform="translate(112 30)"><path d="M0 0Q30 -14 40 -2Q26 -2 30 8Q16 2 12 12Q8 4 0 8Z" transform="translate(-10 4)" fill="none"/></g>';
      b += P('M96 26Q126 10 140 30Q124 26 122 36Q112 28 108 40Z', 'url(#' + I('cape') + ')', 3.5);
      b += bolt(112, 26, 0.9, 30, '#7fe9ff', 2.2);
      b += P('M74 48Q72 24 100 20Q128 22 126 48L124 66Q100 76 78 66Z', 'url(#' + I('plate') + ')', 4);
      b += P('M104 22Q128 24 126 48L124 66Q112 70 104 70Z', '#101a3c', 0, 'opacity=".45"');
      b += P('M76 50L124 50L124 56L76 56Z', '#101a3c', 2.5);
      b += '<path d="M100 20L100 72" stroke="url(#' + I('gold') + ')" stroke-width="4"/>';
      b += P('M72 30L60 12L82 24Z', 'url(#' + I('gold') + ')', 3) + P('M128 30L142 16L120 26Z', 'url(#' + I('gold') + ')', 3);
      b += '<g class="part-eyes" style="transform-origin: 90px 53px"><path d="M78 50L98 52L96 57L78 56Z" fill="#dfffff"/><rect x="78" y="50" width="20" height="6" rx="2" fill="none" stroke="#3ad0ff" stroke-width="1.4"/><path d="M74 49L98 51" stroke="#7fe9ff" stroke-width="7" opacity=".3"/></g>';
      b += '<path d="M78 62h12M78 66h12M104 62h10" stroke="#0a1030" stroke-width="1.8" stroke-linecap="round"/>';
      b += rivets([[80, 44], [92, 40], [112, 40], [120, 60]]);
      b += hl(86, 32, 8, 3, -25, 0.6);
      b += '</g>';
      b += bolt(46, 170, 0.5, -15, '#fff08a', 1.3) + arc(36, 178, 44, 190, 3, 3, 5, '#7fe9ff', '#fff', 1);
      return wrap(defs, shadow(70, 100), b);
    }
  };

  /* ============================================================ THUNDER ROC (boss) */
  E.thunderroc = {
    name: 'Thunder Roc',
    svg: function (uid) {
      uid = uidv(uid);
      var I = function (n) { return 'thunderroc-' + n + '-' + uid; };
      var defs = lg(I('prim'), [[0, '#1f3fb8'], [0.45, '#4f8cf5'], [0.8, '#dff4ff'], [1, '#ffd84a']], 0, 1, 0, 0) +
        lg(I('sec'), [[0, '#1a2f8a'], [0.6, '#3a6ee0'], [1, '#bfe4ff']], 0, 1, 0, 0) +
        lg(I('cov'), [[0, '#233fb0'], [1, '#5f9bff']], 0, 1, 0, 0) +
        lg(I('cov2'), [[0, '#f0f8ff'], [1, '#8fc4ff']], 0, 1, 0, 0) +
        lg(I('crest'), [[0, '#ffffff'], [0.5, '#9ff0ff'], [1, '#3aa0f0']], 0, 1, 0, 0) +
        lg(I('gold'), [[0, '#fff4a8'], [0.5, '#ffc93a'], [1, '#c8801a']], 0, 0, 1, 1) +
        lg(I('beak'), [[0, '#ffe680'], [0.5, '#ffaa2a'], [1, '#c8621a']], 0, 0, 1, 1) +
        lg(I('leg'), [[0, '#ffe066'], [1, '#c8861a']], 0, 0, 1, 0) +
        lg(I('rock'), [[0, '#8a9ac4'], [0.5, '#55648e'], [1, '#2c3658']]) +
        lg(I('tail'), [[0, '#1c2f90'], [0.7, '#4a80e8'], [1, '#ffd84a']], 0, 0, 0, 1) +
        rg(I('body'), [[0, '#6fa4ff'], [0.55, '#2f56d0'], [1, '#182a86']], 0.4, 0.3, 0.85) +
        rg(I('halo'), [[0, '#a8f4ff', 0.6], [0.6, '#5ac0ff', 0.22], [1, '#5ac0ff', 0]]) +
        rg(I('eye'), [[0, '#ffffff', 1], [0.3, '#fff27a', 0.95], [1, '#ffb020', 0]]) +
        rg(I('cloud'), [[0, '#5a5ea8', 0.85], [1, '#1c2050', 0.75]]);
      var b = '', i, k;
      var PR = 'url(#' + I('prim') + ')', SC = 'url(#' + I('sec') + ')', CV = 'url(#' + I('cov') + ')', CW = 'url(#' + I('cov2') + ')';
      function wisp(x, y, r, o) { return '<g opacity="' + o + '"><circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="url(#' + I('cloud') + ')"/><circle cx="' + f(x + r * 0.9) + '" cy="' + f(y + r * 0.2) + '" r="' + f(r * 0.7) + '" fill="url(#' + I('cloud') + ')"/><circle cx="' + f(x - r * 0.9) + '" cy="' + f(y + r * 0.25) + '" r="' + f(r * 0.65) + '" fill="url(#' + I('cloud') + ')"/><path d="M' + f(x - r * 0.5) + ' ' + f(y - r * 0.6) + 'Q' + x + ' ' + f(y - r * 1.05) + ' ' + f(x + r * 0.5) + ' ' + f(y - r * 0.6) + '" stroke="#9aa0ec" stroke-width="1.4" fill="none" opacity=".6"/></g>'; }
      function rune(x, y, s, col) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" stroke="' + col + '" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M0 -5v10M-3 -2l3 -3l3 3M-3 3l6 -2"/></g>'; }

      // backdrop
      b += '<circle cx="104" cy="104" r="100" fill="url(#' + I('halo') + ')"/>';
      b += wisp(20, 150, 16, 0.55) + wisp(186, 168, 14, 0.5) + wisp(176, 20, 12, 0.45) + wisp(24, 26, 11, 0.4);
      b += arc(196, 96, 178, 128, 5, 7, 11, '#7fe9ff', '#fff', 1.2);

      // ---- far (right) wing
      b += '<g class="part-cape" style="transform-origin: 124px 96px">';
      // primaries from wrist (146,46)
      for (i = 0; i < 9; i++) {
        var pl = 44 + 6 * Math.sin(i / 8 * Math.PI);
        b += feather(146, 46, pl, 8.6, 34 + i * 10.5, PR, '#0c1e70', '#08123e', 2.4);
      }
      // secondaries along forearm (128,90) -> (146,46)
      for (i = 0; i < 8; i++) {
        var t = i / 7, sx = 128 + t * 18, sy = 90 - t * 44;
        b += feather(sx, sy, 50 - i * 0.6, 9.4, 104 + i * 4.5, SC, '#0c1e70', '#08123e', 2.4);
      }
      for (i = 0; i < 8; i++) { var t6 = i / 7; b += feather(127 + t6 * 18, 88 - t6 * 42, 32, 8, 102 + i * 4, CV, '#0c1e70', '#08123e', 2); }
      // coverts rows
      for (i = 0; i < 8; i++) { var t2 = i / 7; b += feather(125 + t2 * 20, 90 - t2 * 42, 22, 7, 96 + i * 5, CW, '#4a7ad0', '#08123e', 1.8); }
      // arm leading edge
      b += '<path d="M116 102Q128 84 146 46" stroke="' + O + '" stroke-width="11" stroke-linecap="round" fill="none"/><path d="M116 102Q128 84 146 46" stroke="#3a64d8" stroke-width="6" stroke-linecap="round" fill="none"/>';
      b += '<path d="M122 92Q132 78 142 56" stroke="#9ec8ff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".8"/>';
      b += bolt(178, 60, 0.7, 70, '#ffd84a', 1.6) + bolt(160, 30, 0.55, 30, '#ffd84a', 1.5) + bolt(170, 96, 0.6, 110, '#ffd84a', 1.5);
      b += arc(174, 14, 190, 4, 3, 4, 1, '#7fe9ff', '#fff', 1.3) + arc(198, 52, 190, 86, 4, 5, 2, '#7fe9ff', '#fff', 1.3);
      b += arc(140, 30, 164, 46, 4, 5, 4, '#7fe9ff', '#fff', 1.1);
      b += '</g>';

      // ---- near (left) wing, foreshortened
      b += '<g class="part-cape" style="transform-origin: 82px 100px">';
      for (i = 0; i < 7; i++) b += feather(36, 62, 46 - Math.abs(i - 3) * 1.4, 8.4, -132 + i * 14, PR, '#0c1e70', '#08123e', 2.4);
      for (i = 0; i < 6; i++) { var t4 = i / 5; b += feather(78 - t4 * 34, 98 - t4 * 30, 36 - i, 8.5, -120 + i * 3, SC, '#0c1e70', '#08123e', 2.4); }
      for (i = 0; i < 6; i++) { var t5 = i / 5; b += feather(78 - t5 * 34, 96 - t5 * 30, 20, 6.5, -100 + i * 4, CV, '#0c1e70', '#08123e', 2); }
      b += '<path d="M84 102Q56 94 40 66" stroke="' + O + '" stroke-width="10" stroke-linecap="round" fill="none"/><path d="M84 102Q56 94 40 66" stroke="#3a64d8" stroke-width="5.5" stroke-linecap="round" fill="none"/>';
      b += bolt(20, 60, 0.6, -70, '#ffd84a', 1.5) + bolt(14, 100, 0.55, -110, '#ffd84a', 1.4);
      b += arc(8, 44, 18, 20, 3, 4, 5, '#7fe9ff', '#fff', 1.2) + arc(4, 90, 12, 118, 3, 4, 6, '#7fe9ff', '#fff', 1.2);
      b += '</g>';

      // ---- tail feathers
      b += '<g class="part-cape" style="transform-origin: 124px 148px">';
      for (i = 0; i < 5; i++) b += feather(122, 148, 58 - Math.abs(i - 2) * 4, 10, 112 + i * 15, 'url(#' + I('tail') + ')', '#0c1e70', '#08123e', 2.6);
      b += bolt(160, 172, 0.55, 130, '#ffd84a', 1.4);
      b += '</g>';

      // ---- rock perch
      b += P('M28 190Q26 176 44 170L64 166L84 162L120 164L150 160Q174 166 180 178L182 190Z', 'url(#' + I('rock') + ')', 4);
      b += P('M120 164L150 160Q174 166 180 178L182 190L130 190Q126 176 120 164Z', '#1c2648', 0, 'opacity=".5"');
      b += P('M40 172Q60 160 92 164Q80 170 60 172Z', '#f2fbff', 2.2);
      b += P('M126 166Q146 158 166 166Q152 168 140 170Z', '#f2fbff', 2);
      b += '<path d="M60 176l-6 12M102 172l6 14M150 176l-4 12" stroke="#1c2648" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
      b += rune(56, 182, 0.9, '#7fe9ff') + rune(140, 182, 0.9, '#7fe9ff') + rune(170, 184, 0.7, '#7fe9ff');
      b += '<ellipse cx="100" cy="176" rx="34" ry="5" fill="#7fe9ff" opacity=".18"/>';

      // ---- body
      b += '<ellipse cx="106" cy="114" rx="47" ry="54" transform="rotate(12 106 114)" fill="url(#' + I('body') + ')" ' + S(4.5) + '/>';
      b += P('M134 76Q158 110 140 146Q120 166 96 164Q136 140 134 76Z', '#0c1a66', 0, 'opacity=".55"');
      // back feather rows
      for (k = 0; k < 4; k++) for (i = 0; i < 4; i++) {
        var bx = 112 + i * 9 + (k % 2) * 4 - k * 2, by = 86 + k * 17;
        b += feather(bx, by + 14, 18, 7, 172 + i * 3, k % 2 ? CV : SC, '#0c1e70', '#08123e', 1.8);
      }
      // gold bolt chevrons on back
      b += '<path d="M118 92l8 6l-6 2l8 8M116 112l8 6l-6 2l8 8M118 132l6 4l-4 2l6 6" stroke="url(#' + I('gold') + ')" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
      // chest plumage
      b += P('M62 100Q66 78 96 76Q116 82 120 108Q116 140 92 152Q66 148 60 120Z', '#eef8ff', 3);
      b += P('M92 152Q116 140 120 108Q116 130 92 152Z', '#9cc4f4', 0, 'opacity=".7"');
      var rows = [[70, 92, 5], [66, 108, 5], [70, 124, 4], [78, 140, 3]];
      for (k = 0; k < rows.length; k++) for (i = 0; i < rows[k][2]; i++) {
        b += feather(rows[k][0] + i * 10.5 + (k % 2) * 4, rows[k][1] + 14, 17, 6.4, 182 - i * 2, k % 2 ? CW : 'url(#' + I('cov2') + ')', '#5a86d0', '#3a5a9a', 1.8);
      }
      // chest bolt emblem
      b += '<circle cx="90" cy="110" r="20" fill="url(#' + I('eye') + ')" opacity=".55"/>';
      b += P('M96 94L80 114L90 114L84 132L104 108L93 108Z', '#ffd84a', 2.6);
      b += P('M95 98L86 112L92 112Z', '#fffbd0', 0, 'opacity=".9"');
      b += hl(76, 92, 10, 3.4, -25, 0.7);
      // battle scars
      b += '<path d="M104 120l14 10M107 114l14 10M110 108l12 9" stroke="#0c1a66" stroke-width="1.6" stroke-linecap="round" opacity=".6"/><path d="M70 130l8 6M74 126l8 6" stroke="#8fb0e0" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>';
      // gold torc
      b += P('M62 96Q80 104 100 84L104 92Q82 116 60 106Z', 'url(#' + I('gold') + ')', 3);
      b += '<path d="M66 100l4 -2M74 102l4 -3M82 100l4 -4M90 96l4 -5" stroke="#8a5a10" stroke-width="1.6" stroke-linecap="round"/>';
      // thigh feather pants
      for (i = 0; i < 6; i++) b += feather(78 + i * 9, 148, 24, 8, 176 + (i - 2.5) * 4, i % 2 ? 'url(#' + I('cov2') + ')' : CW, '#5a86d0', '#3a5a9a', 2);
      // legs
      b += P('M84 158Q80 166 82 174L98 174Q98 166 98 158Z', 'url(#' + I('leg') + ')', 3.5);
      b += P('M114 156Q114 166 118 172L132 170Q128 164 128 156Z', 'url(#' + I('leg') + ')', 3.5);
      b += '<path d="M82 162h14M82 168h14M116 162h12M118 168h12" stroke="#8a5a10" stroke-width="1.6" opacity=".7" stroke-linecap="round"/>';
      // talons (left leg, near)
      b += limb(84, 174, 62, 172, 8, '#f2b02a') + limb(88, 174, 76, 184, 8, '#f2b02a') + limb(96, 174, 108, 180, 8, '#f2b02a');
      b += P('M62 172Q52 172 48 184Q56 180 58 176Z', '#2b1d14', 2.4) + P('M62 172Q54 170 46 176Q52 176 56 174Z', '#fff4dc', 0, 'opacity=".5"');
      b += P('M76 184Q72 190 74 194Q80 190 82 184Z', '#2b1d14', 2.4) + P('M108 180Q114 186 112 192Q118 186 114 178Z', '#2b1d14', 2.4);
      // talons (right leg, far)
      b += limb(120, 172, 140, 170, 7, '#e6a01c') + limb(124, 172, 138, 180, 7, '#e6a01c') + limb(118, 172, 108, 178, 7, '#e6a01c');
      b += P('M140 170Q150 168 154 178Q146 174 142 176Z', '#2b1d14', 2.4) + P('M138 180Q142 188 142 192Q148 186 144 178Z', '#2b1d14', 2.4);
      // crackle at feet
      b += arc(70, 180, 40, 186, 4, 4, 3, '#7fe9ff', '#fff', 1.1) + arc(140, 184, 170, 186, 3, 4, 4, '#7fe9ff', '#fff', 1.1);

      // ---- neck ruff + head
      b += '<g class="part-head">';
      // neck
      b += P('M56 72Q64 96 96 96L104 78Q84 62 72 56Z', 'url(#' + I('body') + ')', 4);
      // crest
      b += '<g class="part-cape" style="transform-origin: 78px 40px">';
      var cr = [[-26, 1.25], [-4, 1.5], [18, 1.45], [38, 1.2], [56, 0.95]];
      for (i = 0; i < cr.length; i++) b += bolt(78 + i * 4, 42, cr[i][1], cr[i][0], i % 2 ? 'url(#' + I('crest') + ')' : '#ffe680', 2.4);
      b += arc(78, 10, 100, 4, 3, 4, 7, '#7fe9ff', '#fff', 1.1);
      b += '</g>';
      // head shape
      b += '<ellipse cx="70" cy="58" rx="27" ry="24" transform="rotate(-8 70 58)" fill="url(#' + I('body') + ')" ' + S(4.5) + '/>';
      // white face/cheek feathers
      for (i = 0; i < 5; i++) b += feather(96 - i * 3, 64 + i * 3, 22, 6.5, 118 + i * 12, CW, '#5a86d0', '#3a5a9a', 2);
      for (i = 0; i < 4; i++) b += feather(64 + i * 7, 40, 16, 5.5, -18 + i * 16, CV, '#0c1e70', '#08123e', 1.8);
      // gold crown band
      b += P('M56 42Q70 32 88 42L86 47Q70 38 58 48Z', 'url(#' + I('gold') + ')', 2.6);
      // beak: lower then upper
      b += P('M52 66Q34 68 26 78Q40 80 56 74Z', 'url(#' + I('beak') + ')', 3.4);
      b += P('M52 60Q30 54 20 72Q16 86 26 96Q28 82 38 72Q46 68 58 68Z', 'url(#' + I('beak') + ')', 4);
      b += P('M52 60Q30 54 20 72Q30 68 44 68Q52 68 58 66Z', '#fff0a8', 0, 'opacity=".6"');
      b += P('M26 96Q34 84 40 76L36 74Q30 82 26 96Z', '#8a3a10', 0, 'opacity=".55"');
      b += '<path d="M28 78q6 2 12 0M32 82q4 1 8 0" stroke="#8a3a10" stroke-width="1.2" fill="none" opacity=".6"/>';
      b += '<ellipse cx="46" cy="60" rx="3.2" ry="1.9" fill="' + O + '" transform="rotate(20 46 60)"/>';
      b += '<path d="M24 74L44 70M30 62l10 -2" stroke="#fff8d0" stroke-width="1.6" stroke-linecap="round" opacity=".75"/>';
      // scars over beak/eye
      b += '<path d="M34 64l12 8M38 60l12 8" stroke="#7a2a10" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>';
      b += '<path d="M62 30l6 12M67 28l6 12" stroke="#e6f4ff" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>';
      // brow
      b += '<path d="M48 44L84 56" stroke="' + O + '" stroke-width="7.5" stroke-linecap="round"/>';
      b += P('M46 42L64 36L86 52L84 58Z', 'url(#' + I('gold') + ')', 2.8);
      b += '<path d="M52 42l30 12" stroke="#fff8c0" stroke-width="1.4" opacity=".7"/>';
      // eye
      b += '<circle cx="70" cy="60" r="17" fill="url(#' + I('eye') + ')"/>';
      b += '<g class="part-eyes" style="transform-origin: 68px 62px"><path d="M56 58Q66 52 82 62Q76 74 62 72Q54 68 56 58Z" fill="#fff37a" ' + S(3) + '/><ellipse cx="66" cy="63" rx="3" ry="7.5" fill="' + O + '"/><path d="M58 60Q68 55 80 62" stroke="#ff9a1a" stroke-width="2.2" fill="none" opacity=".7"/><ellipse cx="62.5" cy="59.5" rx="2.6" ry="1.8" fill="#fff"/><circle cx="72" cy="68" r="1.4" fill="#fff" opacity=".9"/></g>';
      b += hl(60, 40, 9, 2.6, -18, 0.7);
      b += '</g>';

      // bolts arcing off the bird, drawn on top
      b += arc(52, 96, 20, 120, 5, 7, 13, '#7fe9ff', '#fff', 1.4);
      b += arc(112, 40, 132, 16, 4, 6, 3, '#7fe9ff', '#fff', 1.3);
      b += arc(148, 120, 186, 130, 5, 6, 5, '#7fe9ff', '#fff', 1.3);
      b += bolt(30, 142, 0.6, -20, '#ffd84a', 1.5) + bolt(170, 150, 0.6, 30, '#ffd84a', 1.5);
      b += wisp(40, 186, 11, 0.6) + wisp(164, 190, 12, 0.6);
      return wrap(defs, shadow(88, 106, 0.3), b);
    }
  };

  /* ============================================================ SCENE */
  function shardCap(px, py, w, h) {
    return 'M' + f(px) + ' ' + f(py) + 'L' + f(px - w) + ' ' + f(py + h) + 'L' + f(px - w * 0.5) + ' ' + f(py + h * 0.7) + 'L' + f(px - w * 0.1) + ' ' + f(py + h * 1.1) + 'L' + f(px + w * 0.3) + ' ' + f(py + h * 0.75) + 'L' + f(px + w * 0.8) + ' ' + f(py + h) + 'Z';
  }
  function ridge(r, x0, x1, base, ytop, ybot, fill, snow, stroke) {
    var pts = [], x = x0, up = true, i, d = '', caps = '';
    while (x < x1) { pts.push([x, up ? ytop + r() * (ybot - ytop) * 0.4 : ybot - r() * (ybot - ytop) * 0.3, up]); x += 18 + r() * 26; up = !up; }
    pts.push([x1, ybot, false]);
    d = 'M' + x0 + ' ' + base;
    for (i = 0; i < pts.length; i++) d += 'L' + f(pts[i][0]) + ' ' + f(pts[i][1]);
    d += 'L' + x1 + ' ' + base + 'Z';
    if (snow) for (i = 0; i < pts.length; i++) if (pts[i][2] && pts[i][1] < ybot - 10) caps += '<path d="' + shardCap(pts[i][0], pts[i][1], 9 + r() * 6, 11 + r() * 8) + '" fill="' + snow + '"/>';
    return '<path d="' + d + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="2" stroke-linejoin="round"' : '') + '/>' + caps;
  }
  function stormCloud(x, y, s, c1, c2, c3) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<g fill="' + c2 + '"><ellipse cx="0" cy="12" rx="60" ry="14"/><circle cx="-34" cy="4" r="18"/><circle cx="34" cy="6" r="18"/></g>' +
      '<g fill="' + c1 + '"><ellipse cx="0" cy="6" rx="56" ry="12"/><circle cx="-28" cy="-2" r="19"/><circle cx="2" cy="-12" r="24"/><circle cx="30" cy="-2" r="18"/></g>' +
      '<g fill="' + c3 + '" opacity=".55"><ellipse cx="-6" cy="14" rx="40" ry="5"/></g>' +
      '</g>';
  }
  function obelisk(x, y, s, uid) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<ellipse cx="0" cy="-30" rx="30" ry="40" fill="url(#storm-glow)" opacity=".8"/>' +
      '<path d="M-12 0L-9 -52L-4 -66L4 -66L9 -52L12 0Z" fill="url(#storm-stone)" stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<path d="M2 -66L9 -52L12 0L2 0Z" fill="#1c2444" opacity=".5"/>' +
      '<path d="M-14 0L-13 -8L13 -8L14 0Z" fill="#5a6890" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M-2 -8v-44M-6 -20h4M2 -32h4M-6 -42h4" stroke="#7fe9ff" stroke-width="1.8" stroke-linecap="round"/>' +
      '<path d="M0 -66L0 -84" stroke="' + O + '" stroke-width="4.5" stroke-linecap="round"/><path d="M0 -66L0 -84" stroke="#c8d4f0" stroke-width="2" stroke-linecap="round"/>' +
      '<circle cx="0" cy="-88" r="6" fill="url(#storm-orb)" stroke="' + O + '" stroke-width="2"/>' +
      '<path d="M-7 -92l-6 -6l3 8M7 -92l7 -8l-4 9M0 -95l-2 -10l4 8" stroke="#dffbff" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</g>';
  }
  function brokenPillar(x, y, s, h) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<path d="M-12 0L-11 ' + (-h) + 'L-6 ' + (-h + 6) + 'L-2 ' + (-h - 3) + 'L5 ' + (-h + 4) + 'L11 ' + (-h) + 'L12 0Z" fill="url(#storm-stone)" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M3 ' + (-h + 4) + 'L11 ' + (-h) + 'L12 0L3 0Z" fill="#1c2444" opacity=".5"/>' +
      '<path d="M-4 0V' + (-h + 8) + 'M-11 ' + (-h * 0.45) + 'H12" stroke="#2a3254" stroke-width="1.4" opacity=".7"/>' +
      '<path d="M-8 ' + (-h * 0.7) + 'h5m2 6h4" stroke="#7fe9ff" stroke-width="1.5" stroke-linecap="round"/>' +
      '<path d="M-13 ' + (-h) + 'Q-6 ' + (-h - 4) + ' 2 ' + (-h - 2) + 'L0 ' + (-h + 3) + 'Z" fill="#f2fbff"/>' +
      '</g>';
  }
  function bentRock(x, y, s, flip) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + (flip ? -s : s) + ' ' + s + ')">' +
      '<path d="M-24 0L-18 -16L-6 -26L8 -22L22 -10L26 0Z" fill="url(#storm-stone)" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M8 -22L22 -10L26 0L6 0L10 -12Z" fill="#1c2444" opacity=".45"/>' +
      '<path d="M-20 -14Q-8 -30 8 -25Q-2 -21 -8 -18Q-14 -16 -20 -14Z" fill="#f2fbff" stroke="' + O + '" stroke-width="1.4"/>' +
      '<path d="M-10 -4l5 -4l4 4" stroke="#2a3254" stroke-width="1.4" fill="none"/>' +
      '<path d="M26 0Q40 -6 52 -2" stroke="#e8f4ff" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round"/>' +
      '</g>';
  }
  var PATH_TOP = 'M-10 226C80 216 170 222 240 220C310 218 360 224 410 222';
  var PATH_D = PATH_TOP + 'L410 266C340 272 250 262 180 266C110 270 50 262 -10 268Z';

  function storm() {
    var r = rng(88), i, s = '';
    s += '<defs>' +
      lg('storm-sky', [[0, '#12163a'], [0.45, '#33406e'], [0.85, '#4d7896'], [1, '#6a98a8']]) +
      lg('storm-ground', [[0, '#5a688c'], [0.4, '#3c4870'], [1, '#232c4c']]) +
      lg('storm-path', [[0, '#8590ae'], [1, '#535e80']]) +
      lg('storm-stone', [[0, '#9aa6c8'], [0.5, '#66739a'], [1, '#3a4568']], 0, 0, 1, 0) +
      lg('storm-mist', [[0, '#a8c8d8', 0], [1, '#a8c8d8', 0.55]]) +
      rg('storm-glow', [[0, '#8fe8ff', 0.55], [1, '#8fe8ff', 0]]) +
      rg('storm-orb', [[0, '#ffffff'], [0.5, '#9ff0ff'], [1, '#2a9ae0']]) +
      rg('storm-flash', [[0, '#c8e0ff', 0.55], [1, '#c8e0ff', 0]]) +
      '</defs>';
    s += '<rect width="400" height="300" fill="url(#storm-sky)"/>';
    // flash glows
    s += '<ellipse cx="96" cy="70" rx="90" ry="60" fill="url(#storm-flash)"/><ellipse cx="316" cy="56" rx="70" ry="46" fill="url(#storm-flash)"/>';
    // rolling storm clouds (high)
    s += stormCloud(40, 20, 1.5, '#262c5c', '#181c40', '#3a4478') + stormCloud(190, 12, 1.7, '#2c3466', '#1a2048', '#44508a') + stormCloud(350, 26, 1.5, '#262c5c', '#181c40', '#3a4478');
    s += stormCloud(110, 62, 1.1, '#3a4678', '#242c5a', '#5a6aa0') + stormCloud(270, 74, 1.2, '#3a4678', '#242c5a', '#5a6aa0') + stormCloud(-10, 80, 1.0, '#3a4678', '#242c5a', '#5a6aa0') + stormCloud(400, 84, 1.0, '#3a4678', '#242c5a', '#5a6aa0');
    // forked lightning in the distance
    var LB1 = 'M96 38L88 62L100 66L84 96L96 100L78 132', LB2 = 'M316 30L308 54L320 58L306 84L316 88L302 112';
    s += '<path d="' + LB1 + '" fill="none" stroke="#bfe0ff" stroke-width="9" opacity=".25" stroke-linejoin="round"/><path d="' + LB1 + '" fill="none" stroke="#d8ecff" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"/><path d="' + LB1 + '" fill="none" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>';
    s += '<path d="M100 66L120 82L114 100M96 100L108 118" fill="none" stroke="#d8ecff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    s += '<path d="' + LB2 + '" fill="none" stroke="#bfe0ff" stroke-width="8" opacity=".22" stroke-linejoin="round"/><path d="' + LB2 + '" fill="none" stroke="#d8ecff" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><path d="' + LB2 + '" fill="none" stroke="#fff" stroke-width="1.2"/>';
    s += '<path d="M320 58L338 72L332 90" fill="none" stroke="#d8ecff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>';
    // far peaks
    s += ridge(r, -10, 410, 200, 92, 168, '#3a4a7a', '#dbe8ff', null);
    s += ridge(r, -10, 410, 200, 120, 178, '#2c3a68', '#c8d8f4', O);
    // lit rims on near ridge (subtle)
    // cloud sea
    s += '<rect x="-10" y="150" width="420" height="50" fill="url(#storm-mist)"/>';
    for (i = 0; i < 9; i++) s += '<ellipse cx="' + f(i * 50 + r() * 20 - 20) + '" cy="' + f(176 + r() * 14) + '" rx="' + f(36 + r() * 24) + '" ry="' + f(8 + r() * 4) + '" fill="#8aa8c8" opacity=".38"/>';
    // ground plateau
    s += '<path d="M-10 190Q60 180 130 188T260 186T410 190V310H-10Z" fill="url(#storm-ground)"/>';
    s += '<path d="M-10 190Q60 180 130 188T260 186T410 190" fill="none" stroke="' + O + '" stroke-width="2.4"/>';
    s += '<path d="M-10 193Q60 183 130 191T260 189T410 193" fill="none" stroke="#c8d8f4" stroke-width="2" opacity=".7"/>';
    for (i = 0; i < 14; i++) { var gx = r() * 400, gy = 196 + r() * 20; s += '<path d="M' + f(gx) + ' ' + f(gy) + 'l8 -3l7 3" stroke="#2a3254" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".6"/>'; }
    // obelisks + broken pillars + bent rocks (mid)
    s += obelisk(78, 206, 1.0) + obelisk(330, 208, 1.0);
    s += brokenPillar(150, 208, 0.9, 34) + brokenPillar(262, 210, 0.85, 22) + brokenPillar(30, 212, 0.7, 26) + brokenPillar(376, 214, 0.7, 20);
    s += bentRock(200, 205, 0.8, false) + bentRock(112, 202, 0.55, true) + bentRock(300, 204, 0.6, true);
    // wind-bent dead shrubs
    for (i = 0; i < 6; i++) { var sx = 20 + i * 70 + r() * 20; s += '<path d="M' + f(sx) + ' 212q-2 -10 6 -16q8 -4 14 -2M' + f(sx + 3) + ' 205q6 -6 14 -6" stroke="#2a2440" stroke-width="2.2" fill="none" stroke-linecap="round"/>'; }
    // road
    s += '<path d="' + PATH_D + '" fill="url(#storm-path)"/>';
    s += '<path d="' + PATH_TOP + '" fill="none" stroke="' + O + '" stroke-width="2.6"/>';
    s += '<path d="' + PATH_TOP + '" fill="none" stroke="#e8f4ff" stroke-width="2.4" transform="translate(0 -2)" opacity=".8"/>';
    s += '<path d="M410 266C340 272 250 262 180 266C110 270 50 262 -10 268" fill="none" stroke="' + O + '" stroke-width="2.4"/>';
    // slab joints (vertical-ish) and horizontal
    s += '<path d="M-10 246C80 240 170 246 240 244C310 242 360 246 410 244" stroke="#2c3454" stroke-width="2" fill="none" opacity=".8"/>';
    for (i = 0; i < 10; i++) {
      var jx = i * 42 - 6 + (i % 2) * 8;
      s += '<path d="M' + jx + ' 223L' + (jx - 3) + ' 245M' + (jx + 20) + ' 246L' + (jx + 17) + ' 266" stroke="#2c3454" stroke-width="2" fill="none" opacity=".8"/>';
      s += '<path d="M' + (jx + 2) + ' 224L' + (jx - 1) + ' 243" stroke="#b8c4e4" stroke-width="1" opacity=".5"/>';
    }
    // runes on slabs
    for (i = 0; i < 6; i++) {
      var rx = 24 + i * 66 + r() * 8, ry = i % 2 ? 256 : 234;
      s += '<g stroke="#7fe9ff" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".9" transform="translate(' + f(rx) + ' ' + ry + ')"><path d="M0 -5v10M-3 -2l3 -3l3 3M-3 3l6 -2"/></g>';
      s += '<ellipse cx="' + f(rx) + '" cy="' + ry + '" rx="9" ry="4" fill="#7fe9ff" opacity=".14"/>';
    }
    // cracks, snow dust, puddles
    s += '<path d="M40 232l10 6l-4 6M190 250l8 -4l6 6M330 234l-6 8l6 4" stroke="#1c2444" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    for (i = 0; i < 12; i++) s += '<ellipse cx="' + f(r() * 400) + '" cy="' + f(230 + r() * 32) + '" rx="' + f(3 + r() * 5) + '" ry="1.6" fill="#f2fbff" opacity=".7"/>';
    var pu = [[130, 254], [300, 240], [60, 240]];
    for (i = 0; i < pu.length; i++) s += '<ellipse cx="' + pu[i][0] + '" cy="' + pu[i][1] + '" rx="16" ry="3.6" fill="#28345c" stroke="#8fb0d8" stroke-width="1.2"/><path d="M' + (pu[i][0] - 8) + ' ' + pu[i][1] + 'h8" stroke="#dffbff" stroke-width="1.2" opacity=".8" stroke-linecap="round"/><ellipse cx="' + pu[i][0] + '" cy="' + pu[i][1] + '" rx="6" ry="1.4" fill="none" stroke="#dffbff" stroke-width=".8" opacity=".7"/>';
    // foreground ledge
    s += '<path d="M-10 276C60 270 120 278 200 274C280 270 340 280 410 274V310H-10Z" fill="#1c2444"/>';
    s += '<path d="M-10 276C60 270 120 278 200 274C280 270 340 280 410 274" fill="none" stroke="' + O + '" stroke-width="2.4"/>';
    s += '<path d="M-10 279C60 273 120 281 200 277C280 273 340 283 410 277" fill="none" stroke="#e8f4ff" stroke-width="2.2" opacity=".55"/>';
    s += bentRock(160, 298, 1.2, false) + bentRock(258, 300, 1.0, true);
    // rain
    for (i = 0; i < 90; i++) {
      var rx2 = r() * 420 - 10, ry2 = r() * 290, rl = 9 + r() * 9;
      s += '<path d="M' + f(rx2) + ' ' + f(ry2) + 'l' + f(-rl * 0.32) + ' ' + f(rl) + '" stroke="#cfe4ff" stroke-width="' + f(0.7 + r() * 0.5) + '" opacity="' + f(0.22 + r() * 0.25) + '" stroke-linecap="round"/>';
    }
    // splashes
    for (i = 0; i < 8; i++) { var spx = r() * 400, spy = 232 + r() * 34; s += '<path d="M' + f(spx - 3) + ' ' + f(spy) + 'q3 -4 6 0" stroke="#dffbff" stroke-width="1" fill="none" opacity=".6"/>'; }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice">' + s + '</svg>';
  }

  window.ENEMIES = window.ENEMIES || {};
  Object.keys(E).forEach(function (k) { window.ENEMIES[k] = E[k]; });
  window.SCENES = window.SCENES || {};
  window.SCENES.storm = { name: 'Storm Peaks', sky: '#33406e', svg: storm };
})();

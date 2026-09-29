/* Hero Go! — Chapter 10 "Celestial Void" art (enemies + scene).
 * Adds to window.ENEMIES / window.SCENES (runs after enemies.js + scenes.js).
 * Enemies: viewBox 0 0 200 200, face LEFT, feet y~190.
 */
(function () {
  'use strict';
  var O = '#2b1d14';
  var f = function (n) { return Math.round(n * 10) / 10; };
  function S(w, c) { return 'stroke="' + (c || O) + '" stroke-width="' + (w || 4) + '" stroke-linejoin="round" stroke-linecap="round"'; }
  function stops(a) { return a.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join(''); }
  function lg(id, a, x1, y1, x2, y2) {
    return '<linearGradient id="' + id + '" x1="' + (x1 == null ? 0 : x1) + '" y1="' + (y1 == null ? 0 : y1) + '" x2="' + (x2 == null ? 0 : x2) + '" y2="' + (y2 == null ? 1 : y2) + '">' + stops(a) + '</linearGradient>';
  }
  function lgu(id, a, x1, y1, x2, y2) {
    return '<linearGradient id="' + id + '" gradientUnits="userSpaceOnUse" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '">' + stops(a) + '</linearGradient>';
  }
  function rg(id, a, cx, cy, r) {
    return '<radialGradient id="' + id + '" cx="' + (cx == null ? 0.5 : cx) + '" cy="' + (cy == null ? 0.5 : cy) + '" r="' + (r == null ? 0.5 : r) + '">' + stops(a) + '</radialGradient>';
  }
  function rng(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function shadow(rx, cx, op) {
    cx = cx == null ? 100 : cx;
    return '<g class="part-shadow"><ellipse cx="' + cx + '" cy="190" rx="' + rx + '" ry="' + f(4 + rx * 0.1) + '" fill="#000" opacity="' + (op == null ? 0.3 : op) + '"/></g>';
  }
  function wrap(defs, sh, body) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs>' + defs + '</defs>' + sh + '<g class="part-body">' + body + '</g></svg>';
  }
  // n-point star path
  function star(cx, cy, R, r, n, rot) {
    var d = '', i, a, rr;
    rot = rot == null ? -Math.PI / 2 : rot;
    for (i = 0; i < n * 2; i++) {
      a = rot + i * Math.PI / n; rr = i % 2 ? r : R;
      d += (i ? 'L' : 'M') + f(cx + rr * Math.cos(a)) + ' ' + f(cy + rr * Math.sin(a));
    }
    return d + 'Z';
  }
  function spark(x, y, s, col, op) {
    return '<path d="M' + x + ' ' + f(y - s) + 'Q' + x + ' ' + y + ' ' + f(x + s) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + f(y + s) + 'Q' + x + ' ' + y + ' ' + f(x - s) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + f(y - s) + 'Z" fill="' + (col || '#fff') + '"' + (op != null ? ' opacity="' + op + '"' : '') + '/>';
  }
  function claw(x, y, ang, len, w) {
    w = w || 3.5;
    return '<path transform="translate(' + x + ' ' + y + ') rotate(' + ang + ')" d="M' + (-w) + ' 0Q' + f(-w * 0.3) + ' ' + f(len * 0.6) + ' ' + f(w * 0.6) + ' ' + len + 'Q' + w + ' ' + f(len * 0.4) + ' ' + w + ' 0Z" fill="#fff6d8" ' + S(2.2) + '/>';
  }
  function stars(seed, n, x0, y0, x1, y1, col, rmax) {
    var r = rng(seed), s = '', i;
    for (i = 0; i < n; i++) s += '<circle cx="' + f(x0 + r() * (x1 - x0)) + '" cy="' + f(y0 + r() * (y1 - y0)) + '" r="' + f(0.5 + r() * (rmax || 1.2)) + '" fill="' + (col || '#fff') + '" opacity="' + f(0.5 + r() * 0.5) + '"/>';
    return s;
  }
  // angry glowing almond eye. returns markup
  function gEye(x, y, rx, ry, iris, id, tilt) {
    var d = 'M' + f(x - rx) + ' ' + f(y + ry * 0.3) + 'Q' + x + ' ' + f(y - ry * 1.7) + ' ' + f(x + rx) + ' ' + f(y - ry * 0.5) + 'Q' + f(x + rx * 0.1) + ' ' + f(y + ry * 1.3) + ' ' + f(x - rx) + ' ' + f(y + ry * 0.3) + 'Z';
    return '<circle cx="' + x + '" cy="' + y + '" r="' + f(rx * 1.7) + '" fill="' + iris + '" opacity=".28"/>' +
      '<path d="' + d + '" fill="#fff" ' + S(2.6) + '/>' +
      '<ellipse cx="' + f(x - rx * 0.15) + '" cy="' + f(y) + '" rx="' + f(rx * 0.62) + '" ry="' + f(ry * 0.95) + '" fill="url(#' + id + ')"/>' +
      '<ellipse cx="' + f(x - rx * 0.15) + '" cy="' + f(y) + '" rx="' + f(rx * 0.17) + '" ry="' + f(ry * 0.9) + '" fill="' + O + '"/>' +
      '<ellipse cx="' + f(x - rx * 0.45) + '" cy="' + f(y - ry * 0.4) + '" rx="' + f(rx * 0.25) + '" ry="' + f(ry * 0.22) + '" fill="#fff"/>' +
      '<circle cx="' + f(x + rx * 0.25) + '" cy="' + f(y + ry * 0.35) + '" r="' + f(rx * 0.1) + '" fill="#fff" opacity=".9"/>';
  }

  window.ENEMIES = window.ENEMIES || {};
  var E = window.ENEMIES;

  /* ============================================================ VOID WISP */
  E.voidwisp = {
    name: 'Void Wisp',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'voidwisp-' + n + '-' + uid; };
      var defs = lg(I('flame'), [[0, '#8a4cf0'], [0.55, '#4a1fa8'], [1, '#22095a']]) +
        lg(I('inner'), [[0, '#b58bff'], [1, '#5b2bc0']]) +
        rg(I('core'), [[0, '#ffffff'], [0.3, '#9ff4ff'], [0.7, '#2fc8ee'], [1, '#1b7fc0']], 0.5, 0.45, 0.55) +
        rg(I('aura'), [[0, '#8a4cf0', 0.6], [1, '#3a1590', 0]]) +
        lg(I('tail'), [[0, '#6a35d0'], [1, '#1c0850', 0.4]], 0, 0, 1, 1);
      var body =
        '<circle cx="90" cy="102" r="78" fill="url(#' + I('aura') + ')"/>' +
        // tail
        '<g class="part-cape" style="transform-origin: 118px 120px">' +
        '<path d="M108 108C140 112 152 138 178 148C188 152 196 148 197 140C196 170 164 182 140 170C116 158 106 142 96 128Z" fill="url(#' + I('tail') + ')" ' + S(4) + '/>' +
        '<path d="M112 120C136 124 146 144 168 156C150 156 130 148 112 132Z" fill="#a878ff" opacity=".55"/>' +
        '<path d="M120 146C136 168 160 176 178 168" stroke="#22e0ff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>' +
        '<path d="M126 108C150 100 170 108 184 96C182 116 160 124 132 120Z" fill="#5a2ec8" ' + S(3) + '/>' +
        '<circle cx="170" cy="128" r="3" fill="#7ff4ff"/><circle cx="186" cy="160" r="2" fill="#7ff4ff"/><circle cx="150" cy="186" r="2.5" fill="#7ff4ff" opacity=".8"/>' +
        '</g>' +
        // main flame body
        '<path d="M50 118C38 90 54 66 68 46C72 60 78 66 86 66C80 46 90 30 104 12C110 34 126 44 128 68C140 84 130 120 112 138C98 152 64 150 50 118Z" fill="url(#' + I('flame') + ')" ' + S(4.5) + '/>' +
        '<path d="M58 112C50 92 62 74 72 62C76 72 84 76 92 74C88 60 94 48 104 36C108 52 118 60 118 76C126 88 118 116 104 130C92 142 68 138 58 112Z" fill="url(#' + I('inner') + ')" opacity=".75"/>' +
        '<path d="M62 84C64 72 70 66 74 60M96 44C98 40 100 34 102 28M120 82C122 92 118 104 112 112" stroke="#d4b8ff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>' +
        // flame licks
        '<path d="M44 132C36 128 34 120 38 112C42 118 48 118 50 124Z" fill="#6a35d0" ' + S(3) + '/>' +
        '<path d="M126 106C136 102 142 94 140 84C134 90 130 90 126 92Z" fill="#6a35d0" ' + S(3) + '/>' +
        // cyan core face
        '<ellipse cx="86" cy="106" rx="32" ry="30" fill="url(#' + I('core') + ')" ' + S(3.5) + '/>' +
        '<ellipse cx="72" cy="90" rx="10" ry="5" fill="#fff" opacity=".6" transform="rotate(-30 72 90)"/>' +
        '<path d="M58 118C64 132 82 136 98 132" stroke="#1b7fc0" stroke-width="3" fill="none" opacity=".5"/>' +
        // brows
        '<path d="M60 92L78 100M112 88L94 98" stroke="' + O + '" stroke-width="4.5" stroke-linecap="round"/>' +
        '<g class="part-eyes" style="transform-origin: 84px 104px">' +
        '<ellipse cx="72" cy="105" rx="7" ry="9" fill="' + O + '" transform="rotate(14 72 105)"/><ellipse cx="98" cy="104" rx="7" ry="9" fill="' + O + '" transform="rotate(-14 98 104)"/>' +
        '<ellipse cx="70" cy="101" rx="2.8" ry="3.4" fill="#fff"/><ellipse cx="96" cy="100" rx="2.8" ry="3.4" fill="#fff"/>' +
        '<circle cx="74" cy="109" r="1.4" fill="#fff"/><circle cx="100" cy="108" r="1.4" fill="#fff"/></g>' +
        // fanged grin
        '<path d="M64 118Q84 138 108 116Q86 124 64 118Z" fill="' + O + '" ' + S(3) + '/>' +
        '<path d="M68 119L71 127L75 121ZM80 122L83 131L87 123ZM94 121L97 128L101 120Z" fill="#fff" ' + S(1.6) + '/>' +
        // hands
        '<g fill="#5a2ec8" ' + S(3.5) + '><path d="M44 124Q30 116 26 100Q38 100 46 110Z"/><path d="M122 122Q138 120 146 106Q134 104 124 112Z"/></g>' +
        '<path d="M26 100l-4 -6M30 101l-2 -7M35 103l0 -7M146 106l5 -5M142 105l3 -7" stroke="#e8dcff" stroke-width="2.6" stroke-linecap="round"/>' +
        spark(40, 60, 5, '#9ff4ff') + spark(150, 60, 4, '#c9a8ff') + spark(22, 150, 3.5, '#9ff4ff') + spark(160, 40, 3, '#fff');
      return wrap(defs, shadow(34, 92, 0.22), body);
    }
  };

  /* ========================================================== STAR KNIGHT */
  E.starknight = {
    name: 'Fallen Star Knight',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'starknight-' + n + '-' + uid; };
      var defs = lg(I('white'), [[0, '#ffffff'], [0.55, '#e4e0f4'], [1, '#a9a4cc']], 0, 0, 1, 1) +
        lg(I('gold'), [[0, '#fff0a0'], [0.5, '#f2b632'], [1, '#b8741a']], 0, 0, 1, 1) +
        rg(I('void'), [[0, '#5a2bd0'], [0.55, '#241064'], [1, '#0b0630']], 0.5, 0.5, 0.6) +
        lg(I('cape'), [[0, '#5a2ec8'], [1, '#1c0c58']]) +
        lg(I('blade'), [[0, '#ffffff'], [0.5, '#9ff4ff'], [1, '#2fb4ee']], 0, 0, 1, 0) +
        rg(I('glow'), [[0, '#7ff4ff', 0.7], [1, '#7ff4ff', 0]]);
      var W = 'url(#' + I('white') + ')', G = 'url(#' + I('gold') + ')', V = 'url(#' + I('void') + ')';
      function crack(d, sx) { return '<path d="' + d + '" fill="' + V + '" ' + S(1.8) + '/>' + (sx || ''); }
      var body =
        // cape
        '<g class="part-cape" style="transform-origin: 120px 68px">' +
        '<path d="M116 66C152 70 172 116 164 178L154 168L148 186L138 168L130 178L122 148C124 120 118 96 116 66Z" fill="url(#' + I('cape') + ')" ' + S(4) + '/>' +
        '<path d="M130 80C148 96 152 130 148 168M140 84C156 108 158 140 158 168" stroke="#8a5cf0" stroke-width="2.4" fill="none" opacity=".7"/>' +
        stars(11, 16, 128, 84, 160, 164, '#fff', 1) +
        '</g>' +
        // back leg
        '<path d="M110 128L136 126L138 172L142 186L112 186L114 168Z" fill="' + W + '" ' + S(4) + '/>' +
        '<path d="M112 166L140 166M114 150L138 148" stroke="#a9a4cc" stroke-width="2.4"/>' +
        '<path d="M108 170L142 170L146 188L106 188Z" fill="' + G + '" ' + S(3.5) + '/>' +
        // front leg
        '<path d="M76 130L104 130L102 172L104 186L70 186L76 168Z" fill="' + W + '" ' + S(4) + '/>' +
        '<path d="M76 152L102 152M80 136L100 136" stroke="#a9a4cc" stroke-width="2.4"/>' +
        '<path d="M68 170L104 170L108 188L58 188Z" fill="' + G + '" ' + S(3.5) + '/>' +
        '<path d="M62 188L60 182M70 188L68 182" stroke="#8a5a14" stroke-width="2"/>' +
        '<ellipse cx="88" cy="146" rx="12" ry="9" fill="' + G + '" ' + S(3.2) + '/>' +
        crack('M82 152L86 146L84 140L90 144L94 138L92 148L96 152L88 150Z') +
        // torso
        '<path d="M74 70L130 70L138 108L128 134L80 134L68 108Z" fill="' + W + '" ' + S(4.5) + '/>' +
        '<path d="M74 70L100 70L96 134L80 134L68 108Z" fill="#c8c4e4" opacity=".55"/>' +
        '<path d="M70 118L136 118L130 136L76 136Z" fill="' + G + '" ' + S(3.5) + '/>' +
        '<path d="M80 126l4 4M96 126l4 4M112 126l4 4M124 126l4 4" stroke="#8a5a14" stroke-width="2"/>' +
        '<path d="M80 70L102 96L126 70" fill="none" stroke="#f2b632" stroke-width="4" stroke-linecap="round"/>' +
        // chest crack showing void
        crack('M92 82L100 90L96 98L106 106L100 116L110 112L112 100L106 92L112 84L104 80Z', stars(5, 9, 94, 82, 110, 114, '#fff', 0.9)) +
        '<path d="M100 90l-9 -6M106 106l10 4M98 98l-8 6" stroke="' + O + '" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M100 60L128 60L132 74L104 74Z" fill="url(#' + I('cape') + ')" ' + S(3) + '/>' +
        // helm
        '<path d="M88 26C88 0 128 -2 130 28L130 52C130 62 118 68 110 68L92 68C84 66 82 58 84 50Z" fill="' + W + '" ' + S(4.5) + '/>' +
        '<path d="M92 20C94 6 108 4 116 8C104 10 98 20 100 34L92 46Z" fill="#fff" opacity=".8"/>' +
        '<path d="M114 8C126 14 130 24 130 40L124 52C124 32 122 18 114 8Z" fill="#b6b0d8" opacity=".55"/>' +
        '<path d="M84 34L128 34L130 44L84 44Z" fill="' + G + '" ' + S(3) + '/>' +
        '<g class="part-eyes" style="transform-origin: 96px 39px"><path d="M84 37L112 37L108 43L84 43Z" fill="#12093a"/><path d="M86 38L104 38L104 42L86 42Z" fill="#7ff4ff"/><path d="M86 38L96 38L96 40L86 40Z" fill="#fff"/></g>' +
        '<path d="M96 46L96 66M104 46L104 66M112 46L112 64" stroke="#a9a4cc" stroke-width="2.4"/>' +
        crack('M110 14L116 22L112 30L120 34L114 42L122 40L124 30L118 24L122 14Z', stars(2, 4, 112, 16, 122, 38, '#fff', 0.7)) +
        // crest
        '<path d="M100 8L104 -2L110 8Z" fill="#f2b632" ' + S(2.6) + '/>' +
        '<path d="' + star(106, 12, 8, 3.6, 5) + '" fill="' + G + '" ' + S(2.6) + '/>' +
        // pauldrons
        '<ellipse cx="136" cy="76" rx="15" ry="13" fill="' + W + '" ' + S(4) + '/>' +
        '<path d="M124 74Q136 62 148 74" stroke="#f2b632" stroke-width="4" fill="none"/>' +
        '<ellipse cx="66" cy="76" rx="16" ry="14" fill="' + G + '" ' + S(4) + '/>' +
        '<circle cx="66" cy="76" r="5" fill="#fff" ' + S(2) + '/>' +
        // shield (broken star)
        '<path d="M58 112L48 86L26 96L34 122L14 144L44 148L50 176L72 156L96 164L86 138L96 112Z" fill="' + G + '" ' + S(4.5) + ' transform="translate(0 -2)"/>' +
        '<path d="M50 112L42 92L30 98L38 122L24 140L46 142L52 162L70 148L84 152L78 134L86 114Z" fill="' + W + '" ' + S(2.5) + ' transform="translate(0 -2)"/>' +
        crack('M62 100L58 118L68 126L62 140L76 134L74 120L84 116L72 108Z', stars(9, 10, 58, 102, 84, 138, '#fff', 0.9)) +
        '<path d="M70 126l-4 -8M60 128l-10 6M74 128l8 8" stroke="' + O + '" stroke-width="2" stroke-linecap="round"/>' +
        '<circle cx="46" cy="118" r="3" fill="#f2b632" ' + S(1.6) + '/><circle cx="40" cy="138" r="2.4" fill="#f2b632" ' + S(1.4) + '/>' +
        '<path d="M96 112L104 100" stroke="' + O + '" stroke-width="3.5" stroke-linecap="round"/>' +
        // sword arm + sword
        '<g class="part-weapon" style="transform-origin: 140px 84px">' +
        '<path d="M136 86L150 100L148 110" fill="none" stroke="' + O + '" stroke-width="15" stroke-linecap="round"/>' +
        '<path d="M136 86L150 100L148 110" fill="none" stroke="url(#' + I('white') + ')" stroke-width="9" stroke-linecap="round"/>' +
        '<ellipse cx="164" cy="60" rx="30" ry="62" fill="url(#' + I('glow') + ')" transform="rotate(8 164 60)" opacity=".7"/>' +
        '<path d="M154 100L166 4L170 100Z" fill="url(#' + I('blade') + ')" ' + S(3.5) + ' transform="rotate(4 160 100)"/>' +
        '<path d="M162 96L166 12" stroke="#fff" stroke-width="2.6" stroke-linecap="round" transform="rotate(4 160 100)"/>' +
        '<path d="M142 100L184 98L182 106L144 108Z" fill="' + G + '" ' + S(3.2) + '/>' +
        '<path d="M156 108L172 108L171 122L157 122Z" fill="#5a2ec8" ' + S(3) + '/>' +
        '<circle cx="164" cy="128" r="6" fill="' + G + '" ' + S(2.6) + '/>' +
        '<circle cx="150" cy="106" r="7" fill="#c8c4e4" ' + S(3) + '/>' +
        spark(180, 40, 5, '#fff') + spark(148, 24, 3.5, '#9ff4ff') + spark(186, 78, 3, '#9ff4ff') +
        '</g>';
      return wrap(defs, shadow(62, 96, 0.3), body);
    }
  };

  /* ============================================================== WATCHER */
  E.watcher = {
    name: 'Watcher Eye',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'watcher-' + n + '-' + uid; };
      var defs = rg(I('ball'), [[0, '#ffffff'], [0.6, '#efe6f8'], [1, '#b89cd8']], 0.4, 0.35, 0.75) +
        rg(I('iris'), [[0, '#ffffff'], [0.25, '#9ff4ff'], [0.65, '#2a8fe0'], [1, '#8a2fd0']], 0.5, 0.5, 0.55) +
        lg(I('wing'), [[0, '#6a35d0'], [1, '#22095a']]) +
        lg(I('tent'), [[0, '#3a1a80'], [1, '#12053a']]) +
        rg(I('aura'), [[0, '#c04cf0', 0.45], [1, '#3a1590', 0]]);
      function wing(sx) {
        // sx = 1 right wing, -1 left wing (mirrored about x=100)
        var t = sx === 1 ? '' : ' transform="translate(200 0) scale(-1 1)"';
        return '<g' + t + '><path d="M138 78Q168 36 190 50Q180 58 184 68Q172 66 168 78Q160 72 156 86Q148 82 144 96Z" fill="url(#' + I('wing') + ')" ' + S(4) + '/>' +
          '<path d="M140 80L188 52M144 88L172 78M146 94L160 88" stroke="#a878ff" stroke-width="2.4" stroke-linecap="round"/>' +
          '<path d="M188 52l4 -4" stroke="#e8dcff" stroke-width="3" stroke-linecap="round"/></g>';
      }
      var vein = '', r = rng(31), i;
      var veins = ['M150 96C136 98 128 92 120 96', 'M148 116C134 114 128 122 120 120', 'M140 138C132 128 126 128 118 126', 'M60 74C70 82 68 90 76 92', 'M52 106C64 104 66 112 72 114', 'M64 132C72 128 76 122 84 122', 'M112 52C108 62 114 66 110 76', 'M92 148C94 138 100 136 100 128', 'M132 66C126 72 128 80 122 84'];
      for (i = 0; i < veins.length; i++) vein += '<path d="' + veins[i] + '" stroke="#d8386a" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".85"/>';
      var body =
        '<circle cx="100" cy="100" r="92" fill="url(#' + I('aura') + ')"/>' +
        // wings
        '<g class="part-cape" style="transform-origin: 100px 84px">' + wing(1) + wing(-1) + '</g>' +
        // tendrils
        '<g class="part-cape" style="transform-origin: 100px 140px">' +
        '<path d="M64 132C50 148 68 160 56 176C52 182 56 186 60 184C72 178 66 160 78 146Z" fill="url(#' + I('tent') + ')" ' + S(3.5) + '/>' +
        '<path d="M84 144C76 160 92 168 84 184C82 188 88 190 92 186C100 172 90 164 100 148Z" fill="url(#' + I('tent') + ')" ' + S(3.5) + '/>' +
        '<path d="M108 146C112 162 100 170 110 184C112 188 118 188 120 184C126 170 116 160 122 146Z" fill="url(#' + I('tent') + ')" ' + S(3.5) + '/>' +
        '<path d="M130 138C146 150 128 162 142 176C146 180 152 176 150 172C142 162 156 152 144 134Z" fill="url(#' + I('tent') + ')" ' + S(3.5) + '/>' +
        '<path d="M70 140C62 152 74 160 66 172M112 150C114 160 106 166 112 176M136 142C144 152 134 160 142 168" stroke="#8a5cf0" stroke-width="2" fill="none" opacity=".7"/>' +
        '<ellipse cx="72" cy="188" rx="3" ry="4" fill="#3a1a80" ' + S(2) + '/><ellipse cx="128" cy="186" rx="2.6" ry="3.4" fill="#3a1a80" ' + S(2) + '/>' +
        '</g>' +
        // eyeball
        '<circle cx="100" cy="98" r="54" fill="url(#' + I('ball') + ')" ' + S(4.5) + '/>' +
        '<path d="M56 116C60 138 84 152 106 150C90 144 68 134 56 116Z" fill="#a482c8" opacity=".5"/>' +
        vein +
        '<ellipse cx="128" cy="66" rx="10" ry="5" fill="#fff" opacity=".9" transform="rotate(-38 128 66)"/>' +
        // iris (looks left)
        '<g class="part-eyes" style="transform-origin: 78px 100px">' +
        '<circle cx="76" cy="100" r="33" fill="#5a1aa0" ' + S(3.5) + '/>' +
        '<circle cx="76" cy="100" r="30" fill="url(#' + I('iris') + ')"/>' +
        '<path d="M76 70L76 76M76 124L76 130M46 100L52 100M100 100L106 100M55 79l4 4M97 79l-4 4M55 121l4 -4M97 121l-4 -4" stroke="#fff" stroke-width="2" opacity=".6" stroke-linecap="round"/>' +
        '<ellipse cx="74" cy="100" rx="7.5" ry="21" fill="' + O + '"/>' +
        '<ellipse cx="62" cy="86" rx="7" ry="5" fill="#fff" transform="rotate(-30 62 86)"/><circle cx="88" cy="114" r="3" fill="#fff" opacity=".9"/><circle cx="66" cy="110" r="1.8" fill="#fff" opacity=".8"/>' +
        '</g>' +
        // heavy angry lid
        '<path d="M46 92C50 60 88 46 122 60C134 66 144 76 146 88C120 66 84 66 46 92Z" fill="#5a2ec8" ' + S(4) + '/>' +
        '<path d="M52 88C68 66 100 60 128 68C104 66 76 72 52 88Z" fill="#a878ff" opacity=".7"/>' +
        '<path d="M52 86L60 90M66 78L72 84M84 72L88 78" stroke="' + O + '" stroke-width="2" stroke-linecap="round" opacity=".6"/>' +
        '<path d="M42 86L100 66" stroke="' + O + '" stroke-width="5" stroke-linecap="round" opacity="0"/>' +
        spark(30, 50, 4, '#9ff4ff') + spark(176, 110, 3.5, '#e0a8ff') + spark(160, 26, 3, '#fff');
      return wrap(defs, shadow(40, 100, 0.2), body);
    }
  };

  /* ============================================================== SERAPH */
  E.seraph = {
    name: 'Corrupted Seraph',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'seraph-' + n + '-' + uid; };
      var defs = lg(I('wingw'), [[0, '#ffffff'], [0.6, '#efe8ff'], [1, '#b8a8e8']], 0, 0, 1, 1) +
        lg(I('wingd'), [[0, '#5a2ec8'], [0.5, '#2c1370'], [1, '#12053a']], 0, 0, 1, 1) +
        lg(I('gold'), [[0, '#fff0a0'], [0.5, '#f2b632'], [1, '#a8661a']], 0, 0, 1, 1) +
        lg(I('black'), [[0, '#4a3a68'], [1, '#150f26']], 0, 0, 1, 1) +
        lg(I('mask'), [[0, '#ffffff'], [1, '#c9c2e6']], 0, 0, 1, 1) +
        rg(I('halo'), [[0, '#fff6b0', 0.6], [1, '#f2b632', 0]]) +
        rg(I('gem'), [[0, '#ffffff'], [0.4, '#ff7ae8'], [1, '#7a1ac8']]) +
        lg(I('fire'), [[0, '#fff6a0'], [0.5, '#ff9a2a'], [1, '#e0361a']], 0, 1, 0, 0) +
        rg(I('dark'), [[0, '#8a2fd0', 0.55], [1, '#2a0a68', 0]]);
      var GD = 'url(#' + I('gold') + ')', BK = 'url(#' + I('black') + ')';
      function pair(inner) { return inner + '<g transform="translate(200 0) scale(-1 1)">' + inner + '</g>'; }
      var wing1 = '<path d="M104 82C128 52 158 22 192 20C188 36 180 44 186 58C172 56 164 66 168 80C152 76 142 86 140 98C130 94 116 94 104 102Z" fill="url(#' + I('wingw') + ')" ' + S(4) + '/>' +
        '<path d="M110 84C134 60 158 36 184 28M120 92C140 76 160 62 176 60M132 94C146 86 156 82 164 82" stroke="#b8a8e8" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        '<path d="M186 58l-6 6M168 80l-6 4" stroke="' + O + '" stroke-width="2" stroke-linecap="round"/>';
      var wing2 = '<path d="M106 98C140 84 172 90 197 112L186 114L192 128L178 124L180 140L164 128L162 144L148 128C130 124 116 120 106 118Z" fill="url(#' + I('wingd') + ')" ' + S(4) + '/>' +
        '<path d="M112 104C140 98 166 102 186 116M116 112C138 110 156 114 170 124" stroke="#8a5cf0" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>' +
        '<path d="M150 106l8 10M166 108l6 12" stroke="#12053a" stroke-width="2" stroke-linecap="round"/>';
      var wing3 = '<path d="M104 112C130 122 158 142 178 176C166 172 162 176 160 186C150 176 144 170 136 172C132 160 120 148 104 136Z" fill="url(#' + I('wingw') + ')" ' + S(4) + '/>' +
        '<path d="M110 120C132 132 152 152 166 172M116 130C130 140 142 152 150 166" stroke="#b8a8e8" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
      var body =
        '<ellipse cx="100" cy="96" rx="98" ry="92" fill="url(#' + I('dark') + ')" opacity=".55"/>' +
        '<g class="part-cape" style="transform-origin: 100px 90px">' + pair(wing2) + '</g>' +
        '<g class="part-cape" style="transform-origin: 100px 84px">' + pair(wing1) + '</g>' +
        '<g class="part-cape" style="transform-origin: 100px 112px">' + pair(wing3) + '</g>' +
        // back leg
        '<path d="M108 124L128 128L138 166L146 184L116 184L114 162Z" fill="' + BK + '" ' + S(4) + '/>' +
        '<path d="M110 150L134 152" stroke="#f2b632" stroke-width="3"/>' +
        '<path d="M112 170L146 170L150 188L110 188Z" fill="' + GD + '" ' + S(3.5) + '/>' +
        // front leg lunging left
        '<path d="M90 124L72 132L60 168L54 184L84 186L88 166L102 138Z" fill="' + BK + '" ' + S(4) + '/>' +
        '<path d="M66 150L90 156M72 138L96 142" stroke="#f2b632" stroke-width="3"/>' +
        '<path d="M46 170L86 170L90 188L44 188Z" fill="' + GD + '" ' + S(3.5) + '/>' +
        '<path d="M46 170L40 176" stroke="' + O + '" stroke-width="3"/>' +
        // tassets
        '<path d="M78 120L126 120L136 148L112 142L100 152L88 142L70 148Z" fill="' + GD + '" ' + S(3.6) + '/>' +
        '<path d="M100 122L100 150M88 122L84 142M112 122L116 142" stroke="#8a5a14" stroke-width="2"/>' +
        // torso
        '<path d="M78 74L124 74L130 106L122 124L80 124L72 106Z" fill="' + BK + '" ' + S(4.5) + '/>' +
        '<path d="M78 74L100 74L98 124L80 124L72 106Z" fill="#000" opacity=".28"/>' +
        '<path d="M80 76L100 100L122 76" fill="none" stroke="#f2b632" stroke-width="4.5" stroke-linecap="round"/>' +
        '<path d="M76 108L126 108" stroke="#f2b632" stroke-width="3.6"/>' +
        '<circle cx="100" cy="98" r="14" fill="url(#' + I('halo') + ')"/>' +
        '<path d="' + star(100, 96, 11, 5, 4) + '" fill="url(#' + I('gem') + ')" ' + S(2.6) + '/>' +
        '<circle cx="96" cy="92" r="2" fill="#fff"/>' +
        '<path d="M86 84L90 90M114 84L110 90M84 116l4 -4M116 116l-4 -4" stroke="#f2b632" stroke-width="2.4" stroke-linecap="round"/>' +
        // right arm (dark energy orb)
        '<path d="M124 80L146 92L152 106" fill="none" stroke="' + O + '" stroke-width="16" stroke-linecap="round"/>' +
        '<path d="M124 80L146 92L152 106" fill="none" stroke="#3a2a58" stroke-width="10" stroke-linecap="round"/>' +
        '<path d="M126 78L146 90" stroke="#f2b632" stroke-width="3" stroke-linecap="round"/>' +
        '<circle cx="154" cy="112" r="14" fill="#8a2fd0" opacity=".5"/>' +
        '<circle cx="154" cy="112" r="9" fill="#2a0a68" ' + S(3) + '/>' +
        '<circle cx="154" cy="112" r="4.5" fill="#ff7ae8"/><circle cx="152" cy="110" r="1.8" fill="#fff"/>' +
        // pauldrons
        '<ellipse cx="128" cy="78" rx="14" ry="12" fill="' + GD + '" ' + S(4) + '/>' +
        '<path d="M120 78Q128 66 138 76" stroke="#8a5a14" stroke-width="2.2" fill="none"/>' +
        '<ellipse cx="74" cy="78" rx="14" ry="12" fill="' + GD + '" ' + S(4) + '/>' +
        '<path d="M66 78Q74 66 84 76" stroke="#8a5a14" stroke-width="2.2" fill="none"/>' +
        // hair / hood
        '<path d="M78 56C70 34 84 22 100 22C118 22 130 36 122 58L114 70L86 70Z" fill="#2a1a58" ' + S(4) + '/>' +
        // mask
        '<path d="M80 46C80 30 120 30 120 46L118 62C114 74 106 76 100 76C94 76 86 74 82 62Z" fill="url(#' + I('mask') + ')" ' + S(4) + '/>' +
        '<path d="M84 44C86 36 96 34 100 34L96 70C90 68 86 62 84 56Z" fill="#fff" opacity=".7"/>' +
        '<path d="M110 40L106 50L112 56L108 68" stroke="' + O + '" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<path d="M82 40L118 40" stroke="#f2b632" stroke-width="3.5"/>' +
        '<g class="part-eyes" style="transform-origin: 100px 52px">' +
        '<path d="M84 50L96 54L96 58L86 56Z" fill="#7ff4ff" ' + S(2) + '/><path d="M116 50L104 54L104 58L114 56Z" fill="#7ff4ff" ' + S(2) + '/>' +
        '<circle cx="90" cy="55" r="1.6" fill="#fff"/><circle cx="110" cy="55" r="1.6" fill="#fff"/></g>' +
        '<path d="M89 59C86 66 90 72 88 76M111 59C114 66 110 72 112 76" stroke="#7ff4ff" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
        '<path d="M89 59C86 66 90 72 88 76M111 59C114 66 110 72 112 76" stroke="#fff" stroke-width="1" fill="none"/>' +
        '<path d="M96 68Q100 72 104 68" stroke="' + O + '" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        // cracked halo
        '<ellipse cx="100" cy="26" rx="34" ry="12" fill="url(#' + I('halo') + ')"/>' +
        '<path d="M68 26C68 12 86 6 100 6C120 6 134 14 132 28" fill="none" stroke="' + O + '" stroke-width="9" stroke-linecap="round"/>' +
        '<path d="M68 26C68 12 86 6 100 6C120 6 134 14 132 28" fill="none" stroke="#ffe680" stroke-width="5" stroke-linecap="round"/>' +
        '<path d="M108 6L112 12L108 16" stroke="' + O + '" stroke-width="2.4" fill="none"/>' +
        '<path d="M74 14C80 10 90 8 98 8" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
        '<path d="M132 28L136 34M68 26L64 32" stroke="#ffe680" stroke-width="3" stroke-linecap="round"/>' +
        // left arm + flaming sword (attack pose)
        '<g class="part-weapon" style="transform-origin: 78px 84px">' +
        '<path d="M78 84L56 92L46 100" fill="none" stroke="' + O + '" stroke-width="16" stroke-linecap="round"/>' +
        '<path d="M78 84L56 92L46 100" fill="none" stroke="#3a2a58" stroke-width="10" stroke-linecap="round"/>' +
        '<path d="M70 84L56 90" stroke="#f2b632" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M52 98L6 26L18 20L60 94Z" fill="#fff" ' + S(4) + ' transform="translate(2 4)"/>' +
        '<path d="M52 98L10 30L14 27L57 95Z" fill="#ffd8a0" opacity=".9" transform="translate(2 4)"/>' +
        '<path d="M10 34C-2 18 6 4 14 2C12 12 20 16 22 26C26 18 34 20 32 30C28 40 18 44 10 34Z" fill="url(#' + I('fire') + ')" ' + S(3) + '/>' +
        '<path d="M22 50C12 44 12 34 18 32C20 38 26 40 26 46Z" fill="url(#' + I('fire') + ')" ' + S(2.6) + '/>' +
        '<path d="M34 68C24 62 26 52 30 50C32 56 38 58 38 64Z" fill="url(#' + I('fire') + ')" ' + S(2.4) + '/>' +
        '<path d="M8 22C10 14 14 10 16 8" stroke="#fff6a0" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
        '<path d="M36 100L74 84L70 94L40 110Z" fill="' + GD + '" ' + S(3.2) + ' transform="rotate(-8 50 98)"/>' +
        '<circle cx="46" cy="104" r="7" fill="#3a2a58" ' + S(3) + '/>' +
        spark(30, 12, 4, '#fff6a0') + spark(4, 60, 3, '#ffb060') + spark(50, 40, 3, '#fff6a0') +
        '</g>' +
        // swirling dark energy
        '<path d="M150 150C186 140 190 100 170 80C186 104 176 132 148 140Z" fill="#8a2fd0" opacity=".45"/>' +
        '<path d="M40 140C10 130 8 96 24 76C14 98 24 122 46 128Z" fill="#8a2fd0" opacity=".4"/>' +
        '<path d="M118 178C150 190 178 170 186 148" stroke="#c04cf0" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>' +
        '<path d="M20 170C40 186 70 190 96 190" stroke="#c04cf0" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>' +
        spark(184, 60, 4, '#e0a8ff') + spark(16, 110, 3.5, '#9ff4ff') + spark(176, 168, 3, '#e0a8ff') + spark(120, 8, 3, '#fff6a0');
      return wrap(defs, shadow(70, 98, 0.3), body);
    }
  };

  /* ======================================================== STAR DEVOURER */
  E.stardevourer = {
    name: 'Star Devourer',
    svg: function (uid) {
      uid = uid == null ? '0' : uid;
      var I = function (n) { return 'stardevourer-' + n + '-' + uid; };
      var i, r, d;
      var defs =
        rg(I('aura'), [[0, '#ff5ad0', 0.55], [0.5, '#7a3bff', 0.28], [1, '#3a1a99', 0]]) +
        lgu(I('skin'), [[0, '#9a55ff'], [0.45, '#4a2ac0'], [1, '#1c0d6a']], 20, 30, 180, 190) +
        lgu(I('neb'), [[0, '#ff4fc8', 0.5], [0.5, '#5a2bd0', 0.1], [1, '#22d8ff', 0.5]], 20, 20, 190, 190) +
        lgu(I('wingf'), [[0, '#b02fd0'], [0.5, '#4a2ac8'], [1, '#22b4f0']], 130, 100, 198, 10) +
        lgu(I('wingn'), [[0, '#ff5ac8'], [0.55, '#8a3bf0'], [1, '#3ac8ff']], 128, 100, 176, 46) +
        rg(I('glowc'), [[0, '#5ff0ff', 0.85], [1, '#22b4f0', 0]]) +
        rg(I('glowm'), [[0, '#ff7ae8', 0.85], [1, '#c02fd0', 0]]) +
        rg(I('irisc'), [[0, '#ffffff'], [0.4, '#7ff4ff'], [1, '#1a90e0']], 0.5, 0.5, 0.6) +
        rg(I('irism'), [[0, '#ffffff'], [0.4, '#ff8af0'], [1, '#c01ac0']], 0.5, 0.5, 0.6) +
        lg(I('horn'), [[0, '#fffbe8'], [0.6, '#f0d590'], [1, '#b8863a']], 0, 0, 1, 1) +
        lg(I('gold'), [[0, '#fff2a0'], [0.5, '#f2b632'], [1, '#a8661a']], 0, 0, 1, 1) +
        lg(I('tooth'), [[0, '#ffffff'], [1, '#d8d0f0']]) +
        rg(I('maw'), [[0, '#ff8af0'], [0.25, '#a03bf0'], [0.65, '#2a1078'], [1, '#080428']], 0.5, 0.5, 0.65) +
        rg(I('planet1'), [[0, '#ffd08a'], [0.5, '#ff6aa8'], [1, '#7a2ab8']], 0.35, 0.3, 0.8) +
        rg(I('planet2'), [[0, '#e8fbff'], [0.6, '#8ac8e8'], [1, '#3a6aa8']], 0.35, 0.3, 0.8) +
        rg(I('starglow'), [[0, '#fff6b0', 0.85], [0.5, '#ffb84a', 0.35], [1, '#ff8a2a', 0]]) +
        lg(I('fin'), [[0, '#ff5ac8'], [1, '#22b4f0']], 0, 0, 1, 1) +
        lg(I('shard'), [[0, '#ffffff'], [1, '#ffc850']], 0, 0, 1, 1) +
        // starfield pattern (used as stroke / fill texture)
        '<pattern id="' + I('pat') + '" patternUnits="userSpaceOnUse" width="34" height="34">' +
        '<circle cx="5" cy="7" r="1.1" fill="#fff"/><circle cx="19" cy="4" r="0.7" fill="#bfefff"/><circle cx="28" cy="15" r="1.3" fill="#fff"/>' +
        '<circle cx="11" cy="22" r="0.8" fill="#ffd0f8"/><circle cx="23" cy="29" r="1" fill="#fff"/><circle cx="2" cy="31" r="0.6" fill="#bfefff"/>' +
        '<path d="M15 14l1 -3l1 3l3 1l-3 1l-1 3l-1 -3l-3 -1z" fill="#fff" opacity=".9"/></pattern>' +
        // clip paths
        '<clipPath id="' + I('cwf') + '"><path d="M135 96C140 60 158 30 178 10Q192 22 196 44Q184 60 198 80Q184 92 190 110Q160 100 146 106Z"/></clipPath>' +
        '<clipPath id="' + I('cwn') + '"><path d="M126 100C128 76 140 56 158 44Q164 60 176 68Q166 80 178 92Q160 92 152 104Z"/></clipPath>' +
        '<clipPath id="' + I('cmaw') + '"><path d="M18 80L86 90C92 92 94 96 90 98C70 104 44 108 24 110C16 100 14 90 18 80Z"/></clipPath>' +
        '<clipPath id="' + I('cskull') + '"><path d="M100 52C86 34 56 34 42 50C32 58 20 60 10 66C6 72 10 78 18 80L86 90C104 86 112 66 100 52Z"/></clipPath>' +
        '<clipPath id="' + I('cjaw') + '"><path d="M24 110C15 120 20 131 34 134C62 140 94 132 108 110C108 100 98 94 90 98C70 104 44 108 24 110Z"/></clipPath>';

      var T = 'stroke-linecap="round" fill="none"', TB = 'stroke-linecap="butt" fill="none"';
      var BODY = 'M92 100C140 86 186 106 174 142C166 168 132 174 112 160';
      function bodyStroke(w, stroke, extra) { return '<path d="' + BODY + '" ' + (extra && extra.indexOf('dasharray') > -1 ? TB : T) + ' stroke="' + stroke + '" stroke-width="' + w + '" ' + (extra || '') + '/>'; }

      // spiral galaxy arms in the maw
      var galaxy = '';
      for (var k = 0; k < 3; k++) {
        var pts = '';
        for (i = 0; i <= 28; i++) {
          var t = i / 28, a = k * 2.094 + t * 4.4, rr = 3 + t * 34;
          pts += (i ? 'L' : 'M') + f(54 + rr * Math.cos(a)) + ' ' + f(96 + rr * 0.42 * Math.sin(a));
        }
        galaxy += '<path d="' + pts + '" fill="none" stroke="' + (k === 1 ? '#7ff4ff' : '#ffd0f8') + '" stroke-width="3.4" stroke-linecap="round" opacity=".55"/>' +
          '<path d="' + pts + '" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".85"/>';
      }
      var maw =
        '<g clip-path="url(#' + I('cmaw') + ')">' +
        '<rect x="0" y="70" width="110" height="50" fill="#080428"/>' +
        '<ellipse cx="54" cy="96" rx="44" ry="20" fill="url(#' + I('maw') + ')"/>' + galaxy +
        stars(77, 26, 12, 78, 92, 112, '#fff', 1) +
        '<ellipse cx="54" cy="96" rx="7" ry="3.4" fill="#fff"/>' + '<ellipse cx="54" cy="96" rx="14" ry="6" fill="#fff" opacity=".35"/>' +
        '</g>';

      // dorsal spikes
      var spikes = '';
      var spk = [[133, 72, 137, 54], [155, 82, 166, 64], [171, 92, 188, 80], [180, 114, 197, 110], [104, 76, 100, 60]];
      for (i = 0; i < spk.length; i++) {
        var s = spk[i];
        spikes += '<path d="M' + (s[0] - 8) + ' ' + (s[1] + 6) + 'L' + s[2] + ' ' + s[3] + 'L' + (s[0] + 9) + ' ' + (s[1] + 4) + 'Z" fill="url(#' + I('gold') + ')" ' + S(3) + '/>';
      }

      // wings
      var wingF =
        '<g class="part-cape" style="transform-origin: 135px 94px">' +
        '<path d="M135 96C140 60 158 30 178 10Q192 22 196 44Q184 60 198 80Q184 92 190 110Q160 100 146 106Z" fill="url(#' + I('wingf') + ')"/>' +
        '<g clip-path="url(#' + I('cwf') + ')">' +
        '<ellipse cx="176" cy="40" rx="30" ry="24" fill="url(#' + I('glowm') + ')" opacity=".7"/><ellipse cx="180" cy="84" rx="26" ry="22" fill="url(#' + I('glowc') + ')" opacity=".7"/>' +
        '<rect x="120" y="0" width="90" height="120" fill="url(#' + I('pat') + ')" opacity=".9"/></g>' +
        '<path d="M135 96C140 60 158 30 178 10Q192 22 196 44Q184 60 198 80Q184 92 190 110Q160 100 146 106Z" fill="none" ' + S(4) + '/>' +
        '<path d="M138 94C144 62 160 34 178 10M178 10L196 44M178 10L198 80M158 34L190 110" stroke="#1c0d6a" stroke-width="4.5" fill="none" stroke-linecap="round"/>' +
        '<path d="M140 92C146 62 160 36 177 12M178 12L195 44M179 12L197 78" stroke="#c8b0ff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".8"/>' +
        '<circle cx="178" cy="10" r="4.5" fill="url(#' + I('gold') + ')" ' + S(2.4) + '/>' +
        '</g>';
      var wingN =
        '<g class="part-cape" style="transform-origin: 128px 102px">' +
        '<path d="M126 100C128 76 140 56 158 44Q164 60 176 68Q166 80 178 92Q160 92 152 104Z" fill="url(#' + I('wingn') + ')"/>' +
        '<g clip-path="url(#' + I('cwn') + ')"><ellipse cx="156" cy="66" rx="24" ry="20" fill="url(#' + I('glowc') + ')" opacity=".6"/><rect x="120" y="40" width="70" height="70" fill="url(#' + I('pat') + ')"/></g>' +
        '<path d="M126 100C128 76 140 56 158 44Q164 60 176 68Q166 80 178 92Q160 92 152 104Z" fill="none" ' + S(4) + '/>' +
        '<path d="M128 98C130 78 142 58 158 44M158 44L176 68M158 44L178 92" stroke="#2a1280" stroke-width="3.6" fill="none" stroke-linecap="round"/>' +
        '<circle cx="158" cy="44" r="3.4" fill="url(#' + I('gold') + ')" ' + S(2) + '/>' +
        '</g>';

      // tail (sway)
      var tail =
        '<g class="part-cape" style="transform-origin: 116px 162px">' +
        '<path d="M116 162C146 180 178 184 192 164" ' + T + ' stroke="' + O + '" stroke-width="24"/>' +
        '<path d="M192 164C200 150 190 132 178 120" ' + T + ' stroke="' + O + '" stroke-width="16"/>' +
        '<path d="M116 162C146 180 178 184 192 164" ' + T + ' stroke="#2a1490" stroke-width="18"/>' +
        '<path d="M116 162C146 180 178 184 192 164" ' + T + ' stroke="url(#' + I('pat') + ')" stroke-width="18"/>' +
        '<path d="M116 162C146 180 178 184 192 164"  ' + TB + ' stroke="#f2b632" stroke-width="18" stroke-dasharray="2.5 16" opacity=".85"/>' +
        '<path d="M192 164C200 150 190 132 178 120" ' + T + ' stroke="#2a1490" stroke-width="10"/>' +
        '<path d="M192 164C200 150 190 132 178 120" ' + T + ' stroke="url(#' + I('pat') + ')" stroke-width="10"/>' +
        '<path d="M120 156C148 172 176 176 190 158" ' + T + ' stroke="#9ec8ff" stroke-width="2.5" opacity=".5"/>' +
        '<path d="' + star(176, 114, 12, 5, 4) + '" fill="url(#' + I('gold') + ')" ' + S(3) + '/>' +
        '<circle cx="176" cy="114" r="3.2" fill="#ff7ae8"/>' +
        '</g>';

      // whiskers of light (sway)
      function whisker(dd) {
        return '<path d="' + dd + '" ' + T + ' stroke="#22d8ff" stroke-width="7" opacity=".25"/>' +
          '<path d="' + dd + '" ' + T + ' stroke="' + O + '" stroke-width="4.6" opacity=".7"/>' +
          '<path d="' + dd + '" ' + T + ' stroke="#d8fbff" stroke-width="2.4"/>';
      }
      var whiskers =
        '<g class="part-cape" style="transform-origin: 22px 76px">' +
        whisker('M20 68C6 62 3 42 14 28C22 18 14 10 8 5') + whisker('M17 84C6 96 7 116 15 128C20 136 12 140 8 143') +
        spark(8, 5, 4.5, '#fff') + spark(8, 143, 4.5, '#fff') + spark(13, 40, 2.6, '#7ff4ff', 0.9) + spark(10, 112, 2.6, '#7ff4ff', 0.9) +
        '</g>';

      // constellations
      function constel(pts, col) {
        var p = '', dots = '';
        pts.forEach(function (q, j) { p += (j ? 'L' : 'M') + q[0] + ' ' + q[1]; dots += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="2.4" fill="' + (col || '#fff') + '"/><circle cx="' + q[0] + '" cy="' + q[1] + '" r="4.6" fill="' + (col || '#fff') + '" opacity=".28"/>'; });
        return '<path d="' + p + '" stroke="' + (col || '#fff') + '" stroke-width="1.3" fill="none" opacity=".85"/>' + dots;
      }

      // shattered star clutched in claws
      var starD = star(50, 166, 24, 10.5, 5);
      var shatter =
        '<circle cx="50" cy="166" r="38" fill="url(#' + I('starglow') + ')"/>' +
        '<g transform="translate(-2.4 1.2)"><path d="' + starD + '" fill="url(#' + I('shard') + ')" ' + S(3.4) + '/></g>' +
        '<g transform="translate(2.6 -0.8)"><path d="' + starD + '" fill="url(#' + I('shard') + ')" ' + S(3.4) + ' clip-path="url(#' + I('cstar') + ')"/></g>' +
        '<path d="M50 144L46 156L54 162L46 172L54 180L50 190" stroke="#ff8a2a" stroke-width="2.4" fill="none" stroke-linejoin="round"/>' +
        '<path d="M40 160L60 168" stroke="#fff" stroke-width="1.4" opacity=".8"/>' +
        '<path d="M22 150l7 -3l-2 8Z M78 176l8 2l-6 6Z M80 154l5 -4l1 7Z" fill="url(#' + I('shard') + ')" ' + S(2.2) + '/>' +
        spark(34, 160, 5, '#fff') + spark(62, 174, 4, '#fff') + spark(50, 166, 6, '#fff');
      // (the right half of the star is clipped to x>=50 so the star reads as split)
      defs += '<clipPath id="' + I('cstar') + '"><rect x="50" y="130" width="60" height="70"/></clipPath>';
      // clip the left half too: draw left copy clipped to x<50
      defs += '<clipPath id="' + I('cstarl') + '"><rect x="0" y="130" width="50" height="70"/></clipPath>';
      shatter = shatter.replace('<g transform="translate(-2.4 1.2)"><path d="' + starD + '" fill="url(#' + I('shard') + ')" ' + S(3.4) + '/></g>',
        '<g transform="translate(-2.4 1.2)"><path d="' + starD + '" fill="url(#' + I('shard') + ')" ' + S(3.4) + ' clip-path="url(#' + I('cstarl') + ')"/></g>');

      var body =
        // aura + rays
        '<circle cx="100" cy="100" r="100" fill="url(#' + I('aura') + ')"/>' +
        (function () { var s = '', j; for (j = 0; j < 12; j++) { var a = j * Math.PI / 6 + 0.2; s += '<path d="M100 100L' + f(100 + 130 * Math.cos(a - 0.07)) + ' ' + f(100 + 130 * Math.sin(a - 0.07)) + 'L' + f(100 + 130 * Math.cos(a + 0.07)) + ' ' + f(100 + 130 * Math.sin(a + 0.07)) + 'Z" fill="#e8c8ff" opacity=".07"/>'; } return s; })() +
        stars(3, 26, 4, 4, 196, 196, '#fff', 1.2) +
        // orbit ring
        '<ellipse cx="100" cy="112" rx="94" ry="34" transform="rotate(-24 100 112)" fill="none" stroke="#9ff4ff" stroke-width="1.2" stroke-dasharray="2 5" opacity=".45"/>' +
        wingF + tail + spikes + wingN +
        // fins behind head
        '<path d="M100 62L126 44L114 68L138 64L114 86L132 96L104 98Z" fill="url(#' + I('fin') + ')" ' + S(3.5) + '/>' +
        '<path d="M104 66L122 52M108 76L128 68M108 88L124 92" stroke="#fff" stroke-width="1.6" opacity=".7" stroke-linecap="round"/>' +
        // far horn
        '<path d="M70 42C72 22 84 8 106 2C96 16 94 30 98 46Z" fill="url(#' + I('horn') + ')" ' + S(3.6) + '/>' +
        '<path d="M78 34l7 -3M82 24l7 -3" stroke="#a87830" stroke-width="2"/>' +
        // body
        bodyStroke(46, O) + bodyStroke(40, '#1a0a5c') + bodyStroke(32, 'url(#' + I('skin') + ')') +
        bodyStroke(32, 'url(#' + I('neb') + ')') + bodyStroke(32, 'url(#' + I('pat') + ')') +
        bodyStroke(32, '#12063e', 'stroke-dasharray="1.4 7.6" opacity=".55"') +
        bodyStroke(32, '#f2b632', 'stroke-dasharray="3 24" opacity=".9"') +
        bodyStroke(7, '#d8e8ff', 'opacity=".4" transform="translate(-3 -7)"') +
        bodyStroke(5, '#0c0430', 'opacity=".35" transform="translate(4 9)"') +
        constel([[120, 92], [134, 98], [146, 92], [160, 102], [170, 116]], '#ffffff') +
        constel([[176, 138], [168, 156], [150, 166], [132, 164]], '#7ff4ff') +
        // medallion
        '<circle cx="156" cy="148" r="15" fill="url(#' + I('glowm') + ')"/>' +
        '<path d="' + star(156, 148, 12, 5.5, 8) + '" fill="url(#' + I('gold') + ')" ' + S(2.6) + '/>' +
        '<circle cx="156" cy="148" r="4" fill="#ff7ae8"/><circle cx="155" cy="147" r="1.6" fill="#fff"/>' +
        // arm holding star
        '<path d="M112 130C92 140 76 148 62 156" ' + T + ' stroke="' + O + '" stroke-width="22"/>' +
        '<path d="M112 130C92 140 76 148 62 156" ' + T + ' stroke="url(#' + I('skin') + ')" stroke-width="15"/>' +
        '<path d="M112 130C92 140 76 148 62 156" ' + T + ' stroke="url(#' + I('pat') + ')" stroke-width="15"/>' +
        '<path d="M108 128C92 136 78 144 64 152" ' + T + ' stroke="#d8e8ff" stroke-width="2.4" opacity=".45"/>' +
        shatter +
        '<path d="M62 154C64 148 68 146 72 150C72 156 68 160 62 160Z" fill="url(#' + I('skin') + ')" ' + S(3) + '/>' +
        claw(56, 150, 150, 14) + claw(62, 146, 175, 14) + claw(70, 146, 200, 13) +
        claw(58, 162, 20, 12) + claw(66, 162, 0, 12) +
        // planet chains + planets
        '<path d="M46 26C48 34 48 40 50 46" ' + T + ' stroke="' + O + '" stroke-width="5.4" stroke-dasharray="5 3"/>' +
        '<path d="M46 26C48 34 48 40 50 46" ' + T + ' stroke="#f2b632" stroke-width="2.6" stroke-dasharray="5 3"/>' +
        '<path d="M100 170C98 174 97 176 96 178" ' + T + ' stroke="' + O + '" stroke-width="5.4" stroke-dasharray="4 2.4"/>' +
        '<path d="M100 170C98 174 97 176 96 178" ' + T + ' stroke="#f2b632" stroke-width="2.6" stroke-dasharray="4 2.4"/>' +
        '<g transform="rotate(-18 36 20)"><ellipse cx="36" cy="20" rx="24" ry="6.5" fill="none" stroke="' + O + '" stroke-width="6"/></g>' +
        '<circle cx="36" cy="20" r="13" fill="url(#' + I('planet1') + ')" ' + S(3.4) + '/>' +
        '<path d="M25 16Q36 22 47 14M24 24Q36 30 48 22" stroke="#7a2ab8" stroke-width="2" fill="none" opacity=".6"/>' +
        '<g transform="rotate(-18 36 20)"><path d="M12 20A24 6.5 0 0 0 60 20" fill="none" stroke="#ffe680" stroke-width="3"/></g>' +
        '<ellipse cx="31" cy="15" rx="4" ry="2.4" fill="#fff" opacity=".7"/>' +
        '<circle cx="96" cy="181" r="9" fill="url(#' + I('planet2') + ')" ' + S(3.2) + '/>' +
        '<circle cx="93" cy="184" r="2.2" fill="#5a86b8" opacity=".7"/><circle cx="100" cy="179" r="1.6" fill="#5a86b8" opacity=".7"/><ellipse cx="92" cy="177" rx="3" ry="1.8" fill="#fff" opacity=".8"/>' +
        // head
        '<g class="part-head" style="transform-origin: 96px 96px">' +
        // near horn
        '<path d="M84 44C96 22 128 10 164 22C140 24 124 34 112 54Z" fill="url(#' + I('horn') + ')" ' + S(4) + '/>' +
        '<path d="M96 40C108 28 122 22 140 20M106 46C114 38 124 32 134 30" stroke="#a87830" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<path d="M124 24L130 30L125 36" stroke="' + O + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
        '<path d="M96 38C106 26 118 20 130 17" stroke="#fff" stroke-width="2" fill="none" opacity=".7" stroke-linecap="round"/>' +
        // maw
        maw +
        // lower jaw
        '<path d="M24 110C15 120 20 131 34 134C62 140 94 132 108 110C108 100 98 94 90 98C70 104 44 108 24 110Z" fill="url(#' + I('skin') + ')" ' + S(4.2) + '/>' +
        '<g clip-path="url(#' + I('cjaw') + ')"><rect x="10" y="90" width="110" height="60" fill="url(#' + I('pat') + ')" opacity=".9"/>' +
        '<ellipse cx="60" cy="140" rx="60" ry="14" fill="#0c0430" opacity=".5"/><ellipse cx="40" cy="120" rx="22" ry="6" fill="#c8a8ff" opacity=".35"/></g>' +
        '<path d="M40 128L46 133M58 131L62 136M76 129L80 133" stroke="#22d8ff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>' +
        // lower fangs
        '<path d="M26 112L28 96L36 110ZM46 108L49 98L55 107ZM62 105L65 97L70 103ZM78 102L80 96L85 100Z" fill="url(#' + I('tooth') + ')" ' + S(2.4) + '/>' +
        // skull
        '<path d="M100 52C86 34 56 34 42 50C32 58 20 60 10 66C6 72 10 78 18 80L86 90C104 86 112 66 100 52Z" fill="url(#' + I('skin') + ')" ' + S(4.4) + '/>' +
        '<g clip-path="url(#' + I('cskull') + ')">' +
        '<rect x="0" y="30" width="120" height="70" fill="url(#' + I('neb') + ')"/><rect x="0" y="30" width="120" height="70" fill="url(#' + I('pat') + ')" opacity=".9"/>' +
        '<ellipse cx="88" cy="86" rx="40" ry="22" fill="#0c0430" opacity=".45"/>' +
        '<ellipse cx="34" cy="50" rx="30" ry="9" fill="#d8c8ff" opacity=".4" transform="rotate(-20 34 50)"/>' +
        '<path d="M14 72L84 88" stroke="#0c0430" stroke-width="5" opacity=".4"/>' +
        '</g>' +
        constel([[26, 66], [40, 62], [52, 74], [68, 78], [80, 68]], '#9ff4ff') +
        // upper fangs
        '<path d="M22 79L26 100L34 81ZM40 82L43 92L49 83ZM56 84L59 93L65 85ZM72 86L75 93L80 87Z" fill="url(#' + I('tooth') + ')" ' + S(2.4) + '/>' +
        // nostrils + snout ridges
        '<ellipse cx="16" cy="70" rx="3" ry="2" fill="' + O + '"/><ellipse cx="26" cy="66" rx="2.6" ry="1.8" fill="' + O + '"/>' +
        '<path d="M30 60L38 66M38 55L46 62" stroke="#1a0a5c" stroke-width="2.4" stroke-linecap="round"/>' +
        // scar across the eye
        '<path d="M38 50L58 74" stroke="#ffc8e0" stroke-width="3" stroke-linecap="round"/><path d="M38 50L58 74" stroke="#7a2a68" stroke-width="1" stroke-linecap="round"/>' +
        '<path d="M42 56l-3 2M46 61l-3 2M50 66l-3 2M54 70l-3 2" stroke="#ffe8f4" stroke-width="1.4" stroke-linecap="round"/>' +
        '<path d="M92 76l-4 5M96 72l-4 5" stroke="#ffc8e0" stroke-width="2" stroke-linecap="round" opacity=".8"/>' +
        // brow ridges
        '<path d="M34 54C44 50 56 52 64 60" stroke="' + O + '" stroke-width="6" fill="none" stroke-linecap="round"/>' +
        '<path d="M60 46C72 46 84 52 90 60" stroke="' + O + '" stroke-width="6" fill="none" stroke-linecap="round"/>' +
        '<path d="M36 52C44 48 54 50 62 57" stroke="#9a78ff" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        // eyes
        '<g class="part-eyes" style="transform-origin: 60px 62px">' +
        gEye(46, 64, 9, 7, '#22d8ff', I('irisc')) + gEye(74, 62, 9, 7, '#ff5ae8', I('irism')) +
        '</g>' +
        // crown of stars (broken)
        '<path d="M44 44C58 28 86 28 100 50" fill="none" stroke="' + O + '" stroke-width="10" stroke-linecap="round"/>' +
        '<path d="M44 44C58 28 86 28 100 50" fill="none" stroke="url(#' + I('gold') + ')" stroke-width="5.4" stroke-linecap="round"/>' +
        '<path d="M52 36L50 24M62 31L62 18M90 36L92 24" stroke="' + O + '" stroke-width="4.4" stroke-linecap="round"/>' +
        '<path d="M52 36L50 24M62 31L62 18M90 36L92 24" stroke="#f2b632" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="' + star(50, 20, 7, 3, 4) + '" fill="url(#' + I('gold') + ')" ' + S(2.4) + '/>' +
        '<path d="' + star(62, 14, 8, 3.4, 4) + '" fill="url(#' + I('gold') + ')" ' + S(2.4) + '/>' +
        '<path d="M87 24L92 20L96 24L94 30Z" fill="url(#' + I('gold') + ')" ' + S(2.2) + '/>' +
        '<path d="M76 29L78 26L79 30" stroke="' + O + '" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<circle cx="74" cy="31" r="10" fill="url(#' + I('glowm') + ')"/>' +
        '<path d="' + star(74, 31, 8, 3.6, 4) + '" fill="url(#' + I('gold') + ')" ' + S(2.4) + '/>' +
        '<circle cx="74" cy="31" r="3" fill="#ff7ae8"/><circle cx="73" cy="30" r="1.2" fill="#fff"/>' +
        spark(58, 8, 3.4, '#fff') + spark(96, 14, 3, '#fff9c0') +
        '</g>' +
        // sparkles
        spark(120, 190, 3.5, '#fff') + spark(188, 190, 4, '#9ff4ff') + spark(150, 128, 3, '#fff') + spark(8, 100, 3, '#ffd0f8');
      return wrap(defs, shadow(90, 104, 0.32), body);
    }
  };

  /* ===================================================================
   * SCENE: Celestial Void  (400x300)
   * =================================================================== */
  window.SCENES = window.SCENES || {};

  function voidScene() {
    var r = rng(4242), i, s = '';
    var defs =
      lg('void-sky', [[0, '#04031a'], [0.4, '#0d0b2e'], [0.75, '#241a66'], [1, '#3a2380']]) +
      rg('void-neb1', [[0, '#e0359f', 0.7], [0.6, '#8a2fd0', 0.25], [1, '#5a2bd0', 0]]) +
      rg('void-neb2', [[0, '#2fd4ff', 0.6], [0.6, '#2a6fe0', 0.22], [1, '#2a4fe0', 0]]) +
      rg('void-neb3', [[0, '#a04cf0', 0.5], [1, '#5a2bd0', 0]]) +
      lg('void-planet', [[0, '#e8a8ff'], [0.5, '#8a4cf0'], [1, '#2a1a70']], 0.2, 0, 0.8, 1) +
      lg('void-marble', [[0, '#f4f0ff'], [1, '#b8b0d8']]) +
      lg('void-marbled', [[0, '#a8a0d0'], [1, '#6a62a0']]) +
      lg('void-rock', [[0, '#5a4c98'], [1, '#1c1448']]) +
      lg('void-plaza', [[0, '#2a2468'], [1, '#120e38']]) +
      lg('void-path', [[0, '#6a68b8'], [1, '#403c8a']]) +
      lg('void-gold', [[0, '#fff0a0'], [1, '#d89a2a']]) +
      rg('void-glow', [[0, '#7ff4ff', 0.6], [1, '#7ff4ff', 0]]) +
      lg('void-comet', [[0, '#ffffff', 0], [1, '#bff6ff', 0.95]], 0, 0, 1, 0) +
      lg('void-mist', [[0, '#7a4cf0', 0], [1, '#7a4cf0', 0.35]]);
    s += '<defs>' + defs + '</defs>';
    s += '<rect width="400" height="300" fill="url(#void-sky)"/>';
    // nebulae
    s += '<ellipse cx="90" cy="70" rx="150" ry="80" fill="url(#void-neb1)" transform="rotate(-18 90 70)"/>';
    s += '<ellipse cx="330" cy="150" rx="160" ry="70" fill="url(#void-neb2)" transform="rotate(14 330 150)"/>';
    s += '<ellipse cx="200" cy="30" rx="180" ry="46" fill="url(#void-neb3)"/>';
    s += '<ellipse cx="40" cy="170" rx="90" ry="40" fill="url(#void-neb2)" opacity=".6"/>';
    // stars
    for (i = 0; i < 110; i++) {
      var sx = r() * 400, sy = r() * 200, sr = 0.4 + r() * 1.1;
      s += '<circle cx="' + f(sx) + '" cy="' + f(sy) + '" r="' + f(sr) + '" fill="' + (i % 5 === 0 ? '#bff6ff' : i % 7 === 0 ? '#ffd0f8' : '#fff') + '" opacity="' + f(0.4 + r() * 0.6) + '"/>';
    }
    // sparkles
    var sp = [[40, 30, 6], [120, 18, 5], [250, 44, 7], [360, 24, 5], [300, 100, 4], [20, 110, 4], [170, 70, 5]];
    sp.forEach(function (q) { s += spark(q[0], q[1], q[2], '#fff', 0.9); });
    // broken ring planet
    s += '<g transform="rotate(-20 280 78)"><ellipse cx="280" cy="78" rx="98" ry="20" fill="none" stroke="#1a1050" stroke-width="12" opacity=".7"/>' +
      '<path d="M182 78A98 20 0 0 1 378 78" fill="none" stroke="#c8a8ff" stroke-width="7" stroke-dasharray="120 14 40 10 90 30" opacity=".85"/></g>';
    s += '<circle cx="280" cy="78" r="48" fill="url(#void-planet)" stroke="' + O + '" stroke-width="3"/>';
    s += '<path d="M238 66Q280 80 322 62M234 86Q280 100 326 84M244 104Q280 114 316 102" stroke="#5a2bd0" stroke-width="5" fill="none" opacity=".45"/>';
    s += '<path d="M244 56Q252 44 270 40" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".5"/>';
    s += '<path d="M306 96C316 88 322 74 320 60C328 86 316 108 292 122Z" fill="#0d0b2e" opacity=".35"/>';
    s += '<g transform="rotate(-20 280 78)"><path d="M182 78A98 20 0 0 0 378 78" fill="none" stroke="' + O + '" stroke-width="12" stroke-dasharray="60 16 110 12 70"/>' +
      '<path d="M182 78A98 20 0 0 0 378 78" fill="none" stroke="#e8d0ff" stroke-width="7" stroke-dasharray="60 16 110 12 70"/>' +
      '<path d="M182 78A98 20 0 0 0 378 78" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="60 16 110 12 70" transform="translate(0 -2)" opacity=".7"/></g>';
    // ring debris
    s += '<g fill="#c8a8ff" stroke="' + O + '" stroke-width="1.6" stroke-linejoin="round"><path d="M352 118l8 -4l4 7l-8 4z"/><path d="M366 132l5 -2l2 5l-5 2z"/><path d="M204 104l6 -3l3 6l-6 2z"/></g>';

    // floating ruin island
    function island(x, y, sc, op, marble) {
      var g = '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')" opacity="' + op + '">';
      g += '<path d="M-56 0L56 0C50 14 40 22 30 34C24 48 14 60 4 80C-2 62 -10 50 -18 38C-32 30 -46 16 -56 0Z" fill="url(#void-rock)" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
      g += '<path d="M-40 6L-30 24M-10 10L-4 40M20 8L26 26M36 4L30 18" stroke="#8a7ad0" stroke-width="2" stroke-linecap="round" opacity=".6"/>';
      g += '<path d="M-58 0Q0 -12 58 0L56 6Q0 -4 -56 6Z" fill="#6a5cb0" stroke="' + O + '" stroke-width="2.5" stroke-linejoin="round"/>';
      g += '<ellipse cx="0" cy="-1" rx="52" ry="6" fill="#8a80c8"/>';
      // columns
      var cols = [-38, -18, 20, 40], j;
      for (j = 0; j < cols.length; j++) {
        var ch = j === 1 ? 20 : j === 3 ? 26 : 44;
        g += '<rect x="' + (cols[j] - 5) + '" y="' + (-ch - 2) + '" width="10" height="' + (ch + 2) + '" fill="url(#void-marble)" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>';
        g += '<path d="M' + (cols[j] - 1) + ' ' + (-ch) + 'V-3" stroke="#b8b0d8" stroke-width="1.4"/>';
        g += '<rect x="' + (cols[j] - 7) + '" y="' + (-ch - 6) + '" width="14" height="5" fill="url(#void-gold)" stroke="' + O + '" stroke-width="2"/>';
        if (j === 1 || j === 3) g += '<path d="M' + (cols[j] - 5) + ' ' + (-ch - 2) + 'l4 -5l3 4l3 -6l3 3" fill="none" stroke="' + O + '" stroke-width="2"/>';
      }
      if (marble) {
        // architrave + pediment between tall columns
        g += '<path d="M-46 -52L-8 -52L-8 -46L-46 -46Z" fill="url(#void-marble)" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>';
        g += '<path d="M-48 -52L-27 -70L-6 -52Z" fill="url(#void-gold)" stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round"/>';
        g += '<circle cx="-27" cy="-58" r="3" fill="#7ff4ff" stroke="' + O + '" stroke-width="1.4"/>';
      }
      g += '<path d="M6 -16Q24 -34 34 -16" fill="none" stroke="' + O + '" stroke-width="6" opacity="0"/>';
      g += '<path d="M2 0V-16C2 -32 14 -34 24 -30" fill="none" stroke="#b8b0d8" stroke-width="0"/>';
      g += '<path d="M-56 -2l6 -6l4 5M44 -2l6 -5l4 5" fill="#7a5cd0" stroke="' + O + '" stroke-width="1.6"/>';
      g += '<circle cx="-2" cy="-6" r="2.6" fill="#7ff4ff"/><circle cx="-2" cy="-6" r="7" fill="url(#void-glow)"/>';
      return g + '</g>';
    }
    // distant grand temple on the horizon
    s += '<g opacity=".55" transform="translate(200 186) scale(1.7 1.2)">' +
      '<path d="M-60 0L60 0L52 10L-52 10Z" fill="#4a3c90"/>' +
      '<path d="M-50 0V-38M-32 0V-38M-14 0V-38M14 0V-38M32 0V-38M50 0V-38" stroke="#b8b0d8" stroke-width="6"/>' +
      '<path d="M-60 -38L0 -62L60 -38Z" fill="#8a80c8"/><path d="M-60 -38H60" stroke="#f2c85a" stroke-width="3"/>' +
      '<circle cx="0" cy="-46" r="4" fill="#7ff4ff"/></g>';
    s += '<ellipse cx="200" cy="192" rx="140" ry="12" fill="url(#void-mist)"/>';
    s += island(62, 132, 0.85, 0.95, true);
    s += island(338, 146, 0.72, 0.95, false);
    s += island(196, 96, 0.4, 0.7, false);
    s += island(390, 60, 0.3, 0.6, false);
    s += island(10, 62, 0.3, 0.6, false);

    // comets
    s += '<g><path d="M60 40L132 14L134 20Z" fill="url(#void-comet)"/><circle cx="60" cy="40" r="4" fill="#fff"/><circle cx="60" cy="40" r="9" fill="url(#void-glow)"/></g>';
    s += '<g><path d="M330 20L380 6L382 10Z" fill="url(#void-comet)"/><circle cx="330" cy="20" r="3" fill="#fff"/><circle cx="330" cy="20" r="7" fill="url(#void-glow)"/></g>';
    s += '<g><path d="M150 128L214 108L215 113Z" fill="url(#void-comet)" opacity=".7"/><circle cx="150" cy="128" r="2.6" fill="#fff"/></g>';

    // ---- floor: big floating platform
    s += '<path d="M-10 190C60 186 140 192 200 190C260 188 340 192 410 188V300H-10Z" fill="url(#void-plaza)"/>';
    s += '<path d="M-10 190C60 186 140 192 200 190C260 188 340 192 410 188" fill="none" stroke="#8a7ad8" stroke-width="2.4"/>';
    // balustrade posts far edge
    for (i = 0; i < 9; i++) {
      var bx = 10 + i * 46;
      s += '<path d="M' + bx + ' 190l0 -10l6 0l0 10z" fill="url(#void-marbled)" stroke="' + O + '" stroke-width="1.6" stroke-linejoin="round"/><circle cx="' + (bx + 3) + '" cy="178" r="2.6" fill="url(#void-gold)" stroke="' + O + '" stroke-width="1.2"/>';
    }
    s += '<path d="M-10 186Q100 182 200 186T410 184" fill="none" stroke="#b8b0d8" stroke-width="2.6" opacity=".8"/>';
    // plaza tile lines
    s += '<g stroke="#4a4290" stroke-width="1.6" opacity=".7" fill="none"><path d="M-10 204Q200 198 410 202M-10 282Q200 274 410 280M0 194L-40 300M100 194L80 300M200 194V300M300 194L320 300M400 194L440 300"/></g>';
    s += '<ellipse cx="200" cy="200" rx="200" ry="8" fill="url(#void-mist)"/>';
    // the star bridge (battle strip)
    var PT = 'M-10 218C60 214 140 220 200 217C270 214 340 220 410 216L410 268C340 272 270 264 200 268C130 272 60 264 -10 270Z';
    s += '<path d="' + PT + '" fill="#f2c85a" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<path d="M-10 224C60 220 140 226 200 223C270 220 340 226 410 222L410 264C340 268 270 260 200 264C130 268 60 260 -10 266Z" fill="url(#void-path)"/>';
    // slabs
    for (i = 0; i < 11; i++) {
      var px = -14 + i * 39 + r() * 3, py = 225 + (i % 2) * 1.5;
      s += '<path d="M' + f(px) + ' ' + f(py) + 'l37 -1l2 40l-39 1z" fill="' + (i % 2 ? '#5a58a8' : '#6664b4') + '" stroke="#2c2668" stroke-width="1.8" stroke-linejoin="round" opacity=".9"/>';
      s += '<path d="M' + f(px + 3) + ' ' + f(py + 3) + 'h30" stroke="#a8a4e8" stroke-width="2" stroke-linecap="round" opacity=".7"/>';
      if (i % 3 === 1) s += '<path d="M' + f(px + 14) + ' ' + f(py + 14) + 'l5 8l-3 7l5 6" stroke="#2c2668" stroke-width="1.6" fill="none"/>';
    }
    // edge glow
    s += '<path d="M-10 222C60 218 140 224 200 221C270 218 340 224 410 220" fill="none" stroke="#7ff4ff" stroke-width="2.4" opacity=".9"/>';
    s += '<path d="M-10 266C60 262 130 270 200 266C270 262 340 270 410 266" fill="none" stroke="#7ff4ff" stroke-width="2" opacity=".6"/>';
    // gold inlay dots at edge
    for (i = 0; i < 18; i++) s += '<circle cx="' + (i * 24 + 8) + '" cy="' + f(220 + Math.sin(i) * 1.5 + (i % 2 ? 0 : 0.5)) + '" r="1.6" fill="#fff0a0"/>';
    // etched constellations
    function cons(pts, col) {
      var p = '', dt = '';
      pts.forEach(function (q, j) { p += (j ? 'L' : 'M') + q[0] + ' ' + q[1]; dt += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="2.2" fill="#fff"/><circle cx="' + q[0] + '" cy="' + q[1] + '" r="5" fill="' + col + '" opacity=".35"/>'; });
      return '<path d="' + p + '" stroke="' + col + '" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>' + dt;
    }
    s += cons([[24, 250], [52, 236], [84, 244], [110, 232], [130, 250]], '#7ff4ff');
    s += cons([[170, 240], [196, 254], [226, 240], [250, 252], [222, 232]], '#ffb0f0');
    s += cons([[290, 234], [318, 248], [346, 236], [372, 252], [388, 238]], '#7ff4ff');
    // runic circle motif
    s += '<ellipse cx="200" cy="245" rx="16" ry="5" fill="none" stroke="#f2c85a" stroke-width="1.4" opacity=".5"/>';
    // front face of the platform + hanging rocks
    s += '<path d="M-10 276Q80 268 160 278T410 274V300H-10Z" fill="#100b32"/>';
    s += '<path d="M-10 276Q80 268 160 278T410 274" fill="none" stroke="#6a5cc0" stroke-width="2"/>';
    s += '<path d="M30 290l4 10M140 288l3 12M250 290l4 10M330 288l3 12" stroke="#3a2f88" stroke-width="2" stroke-linecap="round"/>';
    // foreground crystals & rubble
    function crystal(x, y, h, c) {
      return '<g stroke="' + O + '" stroke-width="2" stroke-linejoin="round"><path d="M' + x + ' ' + y + 'l4 ' + (-h) + 'l5 ' + h + 'z" fill="' + c + '"/><path d="M' + (x + 7) + ' ' + y + 'l3 ' + f(-h * 0.6) + 'l4 ' + f(h * 0.6) + 'z" fill="' + c + '"/></g><path d="M' + (x + 3) + ' ' + (y - 2) + 'l1.5 ' + (-h + 6) + '" stroke="#fff" stroke-width="1.4" opacity=".7"/>';
    }
    s += crystal(8, 296, 26, '#ff6ad0') + crystal(376, 296, 24, '#4ad8ff') + crystal(180, 298, 12, '#a86cff');
    s += '<circle cx="20" cy="270" r="14" fill="url(#void-glow)" opacity=".6"/>';
    // drifting dust motes
    for (i = 0; i < 26; i++) {
      var mx = r() * 400, my = 190 + r() * 108, mr = 0.6 + r() * 1.4;
      s += '<circle cx="' + f(mx) + '" cy="' + f(my) + '" r="' + f(mr) + '" fill="' + (i % 2 ? '#bff6ff' : '#ffd0f8') + '" opacity="' + f(0.35 + r() * 0.5) + '"/>';
    }
    s += spark(90, 200, 4, '#fff', 0.9) + spark(310, 206, 5, '#bff6ff', 0.9) + spark(230, 284, 4, '#ffd0f8', 0.9);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice">' + s + '</svg>';
  }

  window.SCENES.void = { name: 'Celestial Void', sky: '#0d0b2e', svg: voidScene };
})();

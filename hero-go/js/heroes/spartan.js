/* Hero Go! — Kallias, The Spartan Hoplite (key: spartan)
 * Hand-authored inline SVG. See ART_CONTRACT.md.
 */
(function () {
  var OL = '#2b1d14';

  function mk(uid) {
    uid = uid == null ? '' : String(uid);
    return function (n) { return 'spartan-' + n + '-' + uid; };
  }

  /* helmet silhouette: dome + cheek guards, with the T-opening cut in as one contour */
  var HELM = 'M50,86 C47,48 72,27 99,27 C126,27 150,46 149,84 L149,106 Q148,120 134,124 L119,125 ' +
    'L117,100 Q120,96 128,95 Q141,92 142,78 Q136,68 120,70 Q110,72 105,77 Q100,72 90,70 Q74,68 68,78 ' +
    'Q69,92 82,95 Q90,96 93,100 L91,125 L76,124 Q62,122 56,117 Q50,121 45,121 Q48,112 50,104 Z';
  /* the opening edge only (for rim strokes) */
  var OPEN = 'M119,125 L117,100 Q120,96 128,95 Q141,92 142,78 Q136,68 120,70 Q110,72 105,77 Q100,72 90,70 ' +
    'Q74,68 68,78 Q69,92 82,95 Q90,96 93,100 L91,125';

  /* ---------------- small helpers ---------------- */
  function cubic(a, b, c, d, t) {
    var u = 1 - t;
    return [
      u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
      u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]
    ];
  }
  var CREST_SEGS = [
    [[140, 38], [150, 18], [138, 5], [112, 4]],
    [[112, 4], [88, 2], [62, 7], [50, 19]],
    [[50, 19], [40, 29], [35, 47], [38, 70]]
  ];
  var CREST_C = [98, 46];
  function crestPoints(k, n) {
    var pts = [];
    for (var s = 0; s < CREST_SEGS.length; s++) {
      var g = CREST_SEGS[s];
      for (var i = (s === 0 ? 0 : 1); i <= n; i++) {
        var p = cubic(g[0], g[1], g[2], g[3], i / n);
        pts.push([CREST_C[0] + (p[0] - CREST_C[0]) * k, CREST_C[1] + (p[1] - CREST_C[1]) * k]);
      }
    }
    return pts;
  }
  function f(v) { return v.toFixed(1); }
  function rng(seed) { var s = seed; return function () { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }
  /* slanted rope-twist ticks around an ellipse */
  function ropeTicks(cx, cy, rx, ry, n, w) {
    var d = '';
    for (var i = 0; i < n; i++) {
      var a = i / n * Math.PI * 2, px = cx + rx * Math.cos(a), py = cy + ry * Math.sin(a);
      var tx = -rx * Math.sin(a), ty = ry * Math.cos(a), tl = Math.sqrt(tx * tx + ty * ty);
      tx /= tl; ty /= tl;
      var nx = ty, ny = -tx;
      d += 'M' + f(px - nx * w / 2 - tx * w * 0.55) + ',' + f(py - ny * w / 2 - ty * w * 0.55) +
        ' L' + f(px + nx * w / 2 + tx * w * 0.55) + ',' + f(py + ny * w / 2 + ty * w * 0.55) + ' ';
    }
    return d;
  }
  var BEARD = 'M84,97 Q92,104 97,102 Q105,99 113,102 Q118,104 126,97 L129,121 Q126,132 115,135 Q105,139 95,135 Q84,132 81,121 Z';

  /* ---------------- defs ---------------- */
  function defs(id) {
    return `
    <defs>
      <linearGradient id="${id('bronze')}" x1="0" y1="0" x2="1" y2="0.35">
        <stop offset="0" stop-color="#fff0c4"/>
        <stop offset="0.3" stop-color="#f3c66c"/>
        <stop offset="0.7" stop-color="#cf8d38"/>
        <stop offset="1" stop-color="#8e5621"/>
      </linearGradient>
      <linearGradient id="${id('bronzev')}" x1="0" y1="0" x2="0.25" y2="1">
        <stop offset="0" stop-color="#ffeebd"/>
        <stop offset="0.45" stop-color="#e2a852"/>
        <stop offset="1" stop-color="#95591f"/>
      </linearGradient>
      <radialGradient id="${id('helm')}" cx="0.33" cy="0.24" r="0.85">
        <stop offset="0" stop-color="#fff8dc"/>
        <stop offset="0.25" stop-color="#f7cf78"/>
        <stop offset="0.62" stop-color="#d2913c"/>
        <stop offset="1" stop-color="#83501c"/>
      </radialGradient>
      <radialGradient id="${id('cuir')}" cx="0.3" cy="0.25" r="0.9">
        <stop offset="0" stop-color="#fff5d4"/>
        <stop offset="0.28" stop-color="#f4c86e"/>
        <stop offset="0.66" stop-color="#d0903b"/>
        <stop offset="1" stop-color="#87521d"/>
      </radialGradient>
      <radialGradient id="${id('aspis')}" cx="0.36" cy="0.3" r="0.8">
        <stop offset="0" stop-color="#fff6d6"/>
        <stop offset="0.3" stop-color="#f1c469"/>
        <stop offset="0.72" stop-color="#cb8836"/>
        <stop offset="1" stop-color="#8a531e"/>
      </radialGradient>
      <linearGradient id="${id('crest')}" x1="0.2" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ff6a52"/>
        <stop offset="0.45" stop-color="#dc2a2e"/>
        <stop offset="1" stop-color="#8c1119"/>
      </linearGradient>
      <linearGradient id="${id('cloak')}" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#d9383a"/>
        <stop offset="0.55" stop-color="#b3212b"/>
        <stop offset="1" stop-color="#7c1320"/>
      </linearGradient>
      <linearGradient id="${id('cloakin')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#8e1a24"/>
        <stop offset="1" stop-color="#5a0d16"/>
      </linearGradient>
      <linearGradient id="${id('chiton')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#c8302f"/>
        <stop offset="1" stop-color="#861520"/>
      </linearGradient>
      <linearGradient id="${id('lambda')}" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0" stop-color="#f0473f"/>
        <stop offset="0.55" stop-color="#c81f28"/>
        <stop offset="1" stop-color="#8a121b"/>
      </linearGradient>
      <linearGradient id="${id('leather')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#b98150"/>
        <stop offset="1" stop-color="#6c4020"/>
      </linearGradient>
      <linearGradient id="${id('leatherd')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#8a5830"/>
        <stop offset="1" stop-color="#4e2c14"/>
      </linearGradient>
      <linearGradient id="${id('shaft')}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#8a5f33"/>
        <stop offset="0.35" stop-color="#f3dcae"/>
        <stop offset="0.7" stop-color="#c99a5e"/>
        <stop offset="1" stop-color="#7a522b"/>
      </linearGradient>
      <linearGradient id="${id('blade')}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset="0.46" stop-color="#e3ebf4"/>
        <stop offset="0.54" stop-color="#a3b3c6"/>
        <stop offset="1" stop-color="#6f8098"/>
      </linearGradient>
      <radialGradient id="${id('skin')}" cx="0.45" cy="0.4" r="0.7">
        <stop offset="0" stop-color="#ffe0c2"/>
        <stop offset="0.75" stop-color="#f7c497"/>
        <stop offset="1" stop-color="#e0a071"/>
      </radialGradient>
      <linearGradient id="${id('skinl')}" x1="0" y1="0" x2="1" y2="0.2">
        <stop offset="0" stop-color="#ffdcbc"/>
        <stop offset="0.6" stop-color="#f3b886"/>
        <stop offset="1" stop-color="#d48d5c"/>
      </linearGradient>
      <linearGradient id="${id('beard')}" x1="0" y1="0" x2="0.2" y2="1">
        <stop offset="0" stop-color="#5a3822"/>
        <stop offset="1" stop-color="#2e1b0f"/>
      </linearGradient>
      <radialGradient id="${id('iris')}" cx="0.5" cy="0.65" r="0.6">
        <stop offset="0" stop-color="#f5c24e"/>
        <stop offset="0.6" stop-color="#b8731f"/>
        <stop offset="1" stop-color="#6b3a0e"/>
      </radialGradient>
      <radialGradient id="${id('glint')}" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#ffffff" stop-opacity="1"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
      <pattern id="${id('hammer')}" patternUnits="userSpaceOnUse" width="11" height="9">
        <g fill="none" stroke-linecap="round" stroke-width="0.6">
          <path d="M1,2.6 a1.5,1 0 0 0 3,0 M6.5,1.4 a1.4,0.9 0 0 0 2.8,0 M3.6,7 a1.5,1 0 0 0 3,0 M8.4,7.4 a1.3,0.9 0 0 0 2.4,0" stroke="#6b3a12" opacity="0.4"/>
          <path d="M1.3,1.9 a1.5,1 0 0 1 2.4,0 M6.8,0.7 a1.4,0.9 0 0 1 2.2,0 M3.9,6.3 a1.5,1 0 0 1 2.4,0 M8.6,6.8 a1.3,0.9 0 0 1 2,0" stroke="#fff6d0" opacity="0.4"/>
        </g>
      </pattern>
      <pattern id="${id('twill')}" patternUnits="userSpaceOnUse" width="3" height="3">
        <path d="M0,3 L3,0 M-0.5,0.5 L0.5,-0.5 M2.5,3.5 L3.5,2.5" stroke="#2c0509" stroke-width="0.55" opacity="0.32"/>
        <path d="M0,1.5 L1.5,0 M1.5,3 L3,1.5" stroke="#ff9a8a" stroke-width="0.4" opacity="0.16"/>
      </pattern>
      <pattern id="${id('linen')}" patternUnits="userSpaceOnUse" width="2.6" height="2.6">
        <path d="M0,1.3 H2.6 M1.3,0 V2.6" stroke="#8a6a38" stroke-width="0.35" opacity="0.32"/>
      </pattern>
      <pattern id="${id('grain')}" patternUnits="userSpaceOnUse" width="6" height="6">
        <g fill="#2b1508" opacity="0.32"><circle cx="1" cy="1.2" r="0.45"/><circle cx="4.2" cy="2.6" r="0.4"/><circle cx="2.4" cy="4.8" r="0.45"/><circle cx="5.3" cy="5.2" r="0.35"/></g>
        <path d="M2.5,0.5 l1.2,0.6 M0.2,3.4 l1.3,0.5 M3.8,4 l1,-0.5" stroke="#ffd9a0" stroke-width="0.35" opacity="0.28"/>
      </pattern>
      <linearGradient id="${id('aov')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2b1508" stop-opacity="0.5"/>
        <stop offset="1" stop-color="#2b1508" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="${id('shr')}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0.35" stop-color="#4a2408" stop-opacity="0"/>
        <stop offset="1" stop-color="#4a2408" stop-opacity="0.42"/>
      </linearGradient>
      <linearGradient id="${id('ribbon')}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#e2383a"/><stop offset="1" stop-color="#8c1119"/>
      </linearGradient>
      <clipPath id="${id('helmclip')}"><path d="${HELM}"/></clipPath>
      <clipPath id="${id('beardclip')}"><path d="${BEARD}"/></clipPath>
      <clipPath id="${id('aspisclip')}"><ellipse cx="47" cy="160" rx="33" ry="37"/></clipPath>
      <clipPath id="${id('cuirclip')}">
        <path d="M66,122 Q98,108 130,122 Q134,146 131,168 Q98,178 65,168 Q62,146 66,122 Z"/>
      </clipPath>
    </defs>`;
  }

  /* ---------------- crimson cloak (behind) ---------------- */
  function cloak(id) {
    var OUTER = 'M74,114 C60,140 38,168 14,207 Q28,199 42,208 Q58,199 74,208 Q94,197 114,204 Q125,202 130,197 L122,118 Z';
    var r = rng(11), fringe = '', fringeL = '';
    var lin = [[[10, 212], [26, 204], [40, 214]], [[40, 214], [56, 205], [72, 214]], [[72, 214], [94, 203], [116, 209]], [[116, 209], [128, 207], [134, 201]]];
    for (var s = 0; s < lin.length; s++) {
      for (var i = 1; i < 9; i++) {
        var t = i / 9 + (r() - 0.5) * 0.03, u = 1 - t, g = lin[s];
        var x = u * u * g[0][0] + 2 * u * t * g[1][0] + t * t * g[2][0];
        var y = u * u * g[0][1] + 2 * u * t * g[1][1] + t * t * g[2][1];
        var len = 3.5 + r() * 3, dx = (r() - 0.5) * 2;
        fringe += 'M' + f(x) + ',' + f(y - 0.6) + ' l' + f(dx) + ',' + f(len) + ' ';
        if (i % 2) fringeL += 'M' + f(x + 0.5) + ',' + f(y - 0.4) + ' l' + f(dx) + ',' + f(len - 0.6) + ' ';
      }
    }
    var HEM = 'M16,204 Q29,196 42,205 Q58,196 74,205 Q94,194 114,201 Q124,199 129,194';
    return `
    <g class="part-cape" style="transform-origin: 97px 120px">
      <!-- fringe hanging from the lining hem -->
      <path d="${fringe}" fill="none" stroke="${OL}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="${fringe}" fill="none" stroke="#a3202a" stroke-width="1.1" stroke-linecap="round"/>
      <path d="${fringeL}" fill="none" stroke="#e9b25c" stroke-width="0.5" stroke-linecap="round" opacity="0.9"/>
      <!-- inner lining -->
      <path d="M72,116 C56,142 32,172 10,212 Q26,204 40,214 Q56,205 72,214 Q94,203 116,209 Q128,207 134,201 L122,120 Z"
            fill="url(#${id('cloakin')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M11,211 Q26,203 40,213 Q56,204 72,213 Q94,202 116,208 Q128,206 133,200" fill="none" stroke="#c43c42" stroke-width="0.9" opacity="0.55"/>
      <!-- outer cloak -->
      <path d="${OUTER}" fill="url(#${id('cloak')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
      <path d="${OUTER}" fill="url(#${id('twill')})"/>
      <!-- fold shading -->
      <path d="M80,124 C70,148 52,176 34,202 L44,206 C60,180 76,154 86,128 Z" fill="#6e0f1a" opacity="0.35"/>
      <path d="M98,130 C94,156 88,182 82,206 L90,204 C96,180 102,156 104,132 Z" fill="#6e0f1a" opacity="0.3"/>
      <path d="M112,132 C113,158 111,182 108,203 L120,200 C122,176 122,150 121,124 Z" fill="#4a0810" opacity="0.28"/>
      <path d="M60,150 C52,168 40,184 26,200 L34,203 C46,190 60,172 66,150 Z" fill="#4a0810" opacity="0.18"/>
      <path d="M78,126 C68,150 50,176 32,200" fill="none" stroke="#5e0c16" stroke-width="2.2" stroke-linecap="round" opacity="0.8"/>
      <path d="M94,130 C90,154 82,180 74,204" fill="none" stroke="#5e0c16" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
      <path d="M110,132 C110,158 108,182 106,202" fill="none" stroke="#5e0c16" stroke-width="1.8" stroke-linecap="round" opacity="0.6"/>
      <path d="M118,130 C119,156 118,178 116,198" fill="none" stroke="#5e0c16" stroke-width="1.4" stroke-linecap="round" opacity="0.5"/>
      <path d="M84,126 C76,148 62,172 50,198" fill="none" stroke="#ff7a6e" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>
      <path d="M102,132 C100,156 96,180 92,200" fill="none" stroke="#ff7a6e" stroke-width="1.4" stroke-linecap="round" opacity="0.5"/>
      <path d="M72,122 C62,142 46,166 28,194" fill="none" stroke="#ff9a8a" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
      <path d="M69,140 C60,156 48,174 38,190 M92,166 C89,178 86,190 84,198 M113,170 C112,180 111,190 110,198" fill="none" stroke="#ff9a8a" stroke-width="0.8" stroke-linecap="round" opacity="0.4"/>
      <!-- crease dimples where folds meet the hem -->
      <path d="M44,200 q2,-3 4,-1 M76,200 q2,-3 5,-1 M108,198 q2,-3 4,-1" fill="none" stroke="#5e0c16" stroke-width="0.9" stroke-linecap="round" opacity="0.7"/>
      <!-- dark border band at hem + woven meander -->
      <path d="${HEM}" fill="none" stroke="#5a0d16" stroke-width="5" stroke-linecap="round"/>
      <path d="${HEM}" fill="none" stroke="#e9b25c" stroke-width="0.9" stroke-dasharray="3 2" opacity="0.9"/>
      <path d="${HEM}" transform="translate(0,-5.2)" fill="none" stroke="#5a0d16" stroke-width="2.4" stroke-linecap="round"/>
      <path d="${HEM}" transform="translate(0,-5.2)" fill="none" stroke="#e9b25c" stroke-width="1.3" stroke-dasharray="1 1.2" opacity="0.85"/>
      <path d="${HEM}" transform="translate(0,-8.6)" fill="none" stroke="#e9b25c" stroke-width="0.7" stroke-dasharray="4 1.5 1 1.5" opacity="0.7"/>
      <!-- trailing edge highlight -->
      <path d="M74,116 C60,140 38,168 16,203" fill="none" stroke="#ff8d7e" stroke-width="1.4" stroke-linecap="round" opacity="0.7"/>
      <!-- frayed nicks / battle wear -->
      <path d="M22,196 l3,1.5 M33,200 l-1,3 M124,196 l-3,2" fill="none" stroke="${OL}" stroke-width="1" stroke-linecap="round" opacity="0.7"/>
      <path d="M86,175 l6,-2 M87.5,177 l5,-1" fill="none" stroke="#3a0810" stroke-width="0.8" stroke-linecap="round" opacity="0.6"/>
      <path d="M86,175 l6,-2" fill="none" stroke="#ffb0a0" stroke-width="0.4" opacity="0.5" transform="translate(0.5,0.6)"/>
    </g>`;
  }

  /* ---------------- legs: greaves + sandals ---------------- */
  function leg(id, dx) {
    var GREAVE = 'M73.5,190 Q83,184 93.5,190 L93,200 Q92.5,208 90.5,214 Q83,216.5 76.5,214 Q74,206 73.5,198 Z';
    var hob = '';
    for (var i = 0; i < 8; i++) hob += `<circle cx="${73.5 + i * 4.2}" cy="${227.3 + (i % 2) * 0.1}" r="0.55"/>`;
    return `
    <g transform="translate(${dx},0)">
      <!-- thigh -->
      <path d="M75,182 L92,182 L92,196 L75,196 Z" fill="url(#${id('skinl')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M75,182 L92,182 L92,190 L75,190 Z" fill="url(#${id('aov')})"/>
      <path d="M77,186 q2,3 1,7 M89,186 q-1,3 0,6" fill="none" stroke="#c98458" stroke-width="0.7" stroke-linecap="round" opacity="0.7"/>
      <!-- sandal laces around the ankle (under greave edge) -->
      <path d="M76,211 L90,217 M90,211 L76,217" stroke="${OL}" stroke-width="2.6" stroke-linecap="round"/>
      <!-- foot -->
      <path d="M74,213 L90,213 Q98,215 103,220 Q106,224 103,226 L73,226 Q71,219 74,213 Z"
            fill="url(#${id('skinl')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M74,222 L103,222 L103,226 L73,226 Z" fill="#a4643c" opacity="0.22"/>
      <path d="M98.5,222 Q99.5,224.5 98.5,226 M101.5,221.5 Q102.8,223.5 102,225.5" fill="none" stroke="#b9764a" stroke-width="0.9" stroke-linecap="round"/>
      <path d="M99,220.5 q1,-0.6 2,0 M101.6,221.4 q0.9,-0.4 1.6,0.2" fill="none" stroke="#fff0e0" stroke-width="0.6" stroke-linecap="round" opacity="0.9"/>
      <path d="M91,216 Q95,216 98,218.5" fill="none" stroke="#fff0e0" stroke-width="0.9" stroke-linecap="round" opacity="0.7"/>
      <!-- sole -->
      <path d="M70,225 L104,225 Q108,226 106.5,229 L71,229.5 Q68.5,227.5 70,225 Z" fill="url(#${id('leatherd')})" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M73,227 L104,227" stroke="#b98150" stroke-width="0.7" stroke-dasharray="1.4 1.2"/>
      <g fill="#d9b070" stroke="${OL}" stroke-width="0.3">${hob}</g>
      <path d="M71.5,225.6 L104,225.6" stroke="#c99a5e" stroke-width="0.6" opacity="0.7"/>
      <!-- sandal straps -->
      <g stroke-linecap="round" fill="none">
        <path d="M78,215 L94,225 M92,215 L80,225 M95,217.5 L99,225.5 M74,214.5 Q84,217 91,214.5" stroke="${OL}" stroke-width="3.2"/>
        <path d="M78,215 L94,225 M92,215 L80,225 M95,217.5 L99,225.5 M74,214.5 Q84,217 91,214.5" stroke="url(#${id('leather')})" stroke-width="1.8"/>
        <path d="M79,215.8 L85,219.6 M93,218.5 L95,222" stroke="#e0ad7a" stroke-width="0.6"/>
        <path d="M79.5,222.5 L84,219 M96,219 l1,3" stroke="#3d220d" stroke-width="0.5" stroke-dasharray="0.9 0.9"/>
      </g>
      <!-- loose lace tails -->
      <path d="M74.5,214.6 q-3,1 -3.6,4.6 M74.5,214.6 q-2,3 -1,6" fill="none" stroke="${OL}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M74.5,214.6 q-3,1 -3.6,4.6 M74.5,214.6 q-2,3 -1,6" fill="none" stroke="#b98150" stroke-width="0.9" stroke-linecap="round"/>
      <circle cx="86" cy="220" r="1.5" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="0.6"/>
      <circle cx="85.6" cy="219.6" r="0.45" fill="#fff"/>
      <!-- mud splatter -->
      <g fill="#6b4a2a" opacity="0.7">
        <path d="M76,224.5 q1.5,-2.4 3.4,-0.6 q0.6,1.5 -0.6,2.2 l-2.6,0 z"/>
        <path d="M100,224.4 q1.6,-1.6 3,0 l0,1.6 l-3,0 z"/>
        <circle cx="90.5" cy="223.5" r="0.7"/><circle cx="82" cy="221.6" r="0.5"/><circle cx="102.2" cy="222.6" r="0.5"/>
      </g>
      <!-- greave -->
      <path d="${GREAVE}" fill="url(#${id('bronze')})" stroke="none"/>
      <path d="${GREAVE}" fill="url(#${id('hammer')})" opacity="0.6"/>
      <path d="${GREAVE}" fill="url(#${id('shr')})"/>
      <path d="${GREAVE}" fill="none" stroke="${OL}" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M75,192 Q83,187.5 92,192" fill="none" stroke="#fff0c4" stroke-width="0.8" opacity="0.8"/>
      <path d="M74.6,199 Q74.8,205 76.6,211 M92.2,199 Q91.8,205 89.6,211" fill="none" stroke="#f4c86e" stroke-width="0.7" opacity="0.8" stroke-dasharray="0.1 1.7" stroke-linecap="round"/>
      <!-- knee boss with engraved palmette -->
      <path d="M76.5,195 Q83,189 90,195 Q89.5,202 83,203 Q77,202 76.5,195 Z" fill="url(#${id('bronzev')})" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M77.5,195.4 Q83,190.6 89,195.4" fill="none" stroke="#7a4515" stroke-width="0.6" opacity="0.7"/>
      <path d="M83,201.4 L83,196.6 M83,201.4 L80.4,197.2 M83,201.4 L85.6,197.2 M83,201.4 L78.8,199 M83,201.4 L87.2,199" fill="none" stroke="#7a4515" stroke-width="0.7" stroke-linecap="round"/>
      <path d="M80.4,196 q2.6,-2.6 5.2,0" fill="none" stroke="#7a4515" stroke-width="0.7" stroke-linecap="round"/>
      <circle cx="83" cy="195.2" r="0.9" fill="#7a4515"/>
      <path d="M79,194 Q81,191.6 83,191.4" fill="none" stroke="#ffffff" stroke-width="1.1" stroke-linecap="round" opacity="0.9"/>
      <!-- calf muscle engraving + shine -->
      <path d="M88.5,204 Q91,208 88.5,213" fill="none" stroke="#8e5621" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M84,204.5 Q86.5,208 84.5,212.5" fill="none" stroke="#a86b2a" stroke-width="0.7" stroke-linecap="round" opacity="0.8"/>
      <path d="M77.5,204 L78.5,212" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.85"/>
      <path d="M75,213 Q83,215.5 91,213" fill="none" stroke="#fff0c4" stroke-width="0.8" opacity="0.8"/>
      <path d="M75,213 Q83,215.5 91,213" fill="none" stroke="#6b3a12" stroke-width="0.6" opacity="0.6" transform="translate(0,1.4)"/>
      <circle cx="75.5" cy="206" r="0.8" fill="#8e5621"/><circle cx="75.3" cy="205.6" r="0.3" fill="#fff"/>
      <circle cx="91.6" cy="206" r="0.8" fill="#8e5621"/><circle cx="91.4" cy="205.6" r="0.3" fill="#fff"/>
      <!-- dent + scratches -->
      <ellipse cx="81.5" cy="208.5" rx="2.2" ry="1.3" fill="#8e5621" opacity="0.35" transform="rotate(-20 81.5 208.5)"/>
      <path d="M79.5,208.6 q2,-1.6 4,-0.6" fill="none" stroke="#fff6d0" stroke-width="0.5" opacity="0.8" transform="translate(0.4,1.1)"/>
      <path d="M86,197.5 l2,4 M87.4,196.5 l1.5,3" stroke="#fff6d0" stroke-width="0.4" opacity="0.6"/>
      <path d="M74.6,201 l1.2,2.4" stroke="#5a3010" stroke-width="0.6" opacity="0.7"/>
    </g>`;
  }

  /* ---------------- torso: chiton, pteruges, muscle cuirass ---------------- */
  function pteruges(id) {
    var back = '', front = '';
    var i, x, sp;
    for (i = 0; i < 8; i++) {
      x = 67 + i * 7.6; sp = (i - 3.5) * 0.9;
      back += `<path d="M${f(x + 3.5)},168 L${f(x + 10.5)},168 L${f(x + 10.5 + sp)},191 Q${f(x + 7 + sp)},194.5 ${f(x + 3.5 + sp)},191 Z" fill="url(#${id('leatherd')})" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M${f(x + 7 + sp)},174 L${f(x + 7 + sp)},190" stroke="#2b1508" stroke-width="0.6" opacity="0.5"/>`;
    }
    for (i = 0; i < 8; i++) {
      x = 66 + i * 8.2; sp = (i - 3.5) * 1.1;
      var linen = !(i % 2);
      var fill = linen ? '#f1e0bd' : `url(#${id('leather')})`;
      var edge = linen ? '#c9a770' : '#e0ad7a';
      var tab = `M${f(x)},166 L${f(x + 7.4)},166 L${f(x + 7.4 + sp)},186 Q${f(x + 3.7 + sp)},189.5 ${f(x + sp)},186 Z`;
      front += `
      <path d="${tab}" fill="${fill}" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="${tab}" fill="url(#${id(linen ? 'linen' : 'grain')})"/>
      <path d="M${f(x + 5.2)},167 L${f(x + 7.4)},167 L${f(x + 7.4 + sp)},186 Q${f(x + 6 + sp)},188.6 ${f(x + 5 + sp)},188.6 Z" fill="#5a3010" opacity="${linen ? 0.14 : 0.24}"/>
      <path d="M${f(x + 1.6)},169 L${f(x + 1.6 + sp)},184 M${f(x + 5.8)},169 L${f(x + 5.8 + sp)},184" stroke="${edge}" stroke-width="0.6" stroke-dasharray="1.3 1.1"/>
      <path d="M${f(x + 0.4 + sp)},183 L${f(x + 7 + sp)},183" stroke="#b3212b" stroke-width="1.6"/>
      <path d="M${f(x + 0.6 + sp)},181.9 L${f(x + 6.8 + sp)},181.9" stroke="#e9b25c" stroke-width="0.3" opacity="0.8"/>
      <path d="M${f(x + 1.4 + sp)},187 l-0.3,2 M${f(x + 3.7 + sp)},188 l0,2.1 M${f(x + 6 + sp)},187 l0.3,2" stroke="${linen ? '#c9a770' : '#6c4020'}" stroke-width="0.5" stroke-linecap="round"/>
      <circle cx="${f(x + 3.7 + sp * 0.8)}" cy="179" r="1.1" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="0.5"/>
      <circle cx="${f(x + 3.4 + sp * 0.8)}" cy="178.6" r="0.35" fill="#fff"/>`;
    }
    return back + front;
  }

  function torso(id) {
    var CUIR = 'M66,122 Q98,108 130,122 Q134,146 131,168 Q98,178 65,168 Q62,146 66,122 Z';
    /* scratches on the polished bronze */
    var scr = '';
    var r = rng(5);
    for (var k = 0; k < 9; k++) {
      var sx = 72 + r() * 52, sy = 126 + r() * 34, l = 2.5 + r() * 4;
      scr += 'M' + f(sx) + ',' + f(sy) + ' l' + f(l) + ',' + f(-l * 0.5 + (r() - 0.5)) + ' ';
    }
    return `
    <!-- crimson chiton skirt -->
    <path d="M68,166 L128,166 L130.5,193 Q98,198 65.5,193 Z" fill="url(#${id('chiton')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M68,166 L128,166 L130.5,193 Q98,198 65.5,193 Z" fill="url(#${id('twill')})"/>
    <path d="M75,182 Q74,188 72,193 M88,184 L87,195 M108,184 L109,195 M121,182 Q122,188 124,193" fill="none" stroke="#5e0c16" stroke-width="1.2" opacity="0.8"/>
    <path d="M66.5,191 Q98,196.5 130,191" fill="none" stroke="#e9b25c" stroke-width="0.7" stroke-dasharray="2 1.4" opacity="0.8"/>
    ${pteruges(id)}
    <!-- pouch hanging from the belt, with tally marks -->
    <g>
      <path d="M121,170 L131,170 L131.5,181 Q131.5,185 127.5,185 L124.5,185 Q120.5,185 120.5,181 Z" fill="url(#${id('leatherd')})" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M121,170 L131,170 L131.5,181 Q131.5,185 127.5,185 L124.5,185 Q120.5,185 120.5,181 Z" fill="url(#${id('grain')})"/>
      <path d="M121,174.5 Q126,178.5 131,174.5" fill="none" stroke="${OL}" stroke-width="1.2"/>
      <path d="M121.4,175.6 Q126,179.4 130.6,175.6" fill="none" stroke="#c99a5e" stroke-width="0.4" stroke-dasharray="1 0.8"/>
      <circle cx="126" cy="177.6" r="1.1" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="0.5"/>
      <path d="M123,180.6 l0.3,2.6 M124.4,180.4 l0.3,2.6 M125.8,180.4 l0.2,2.6 M127.2,180.4 l0.1,2.6 M122.6,182.8 l5.4,-1.4" stroke="#e0ad7a" stroke-width="0.45" stroke-linecap="round"/>
      <path d="M126,185 l-1.3,3.5 M126,185 l0,4.2 M126,185 l1.3,3.5" stroke="${OL}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M126,185 l-1.3,3.5 M126,185 l0,4.2 M126,185 l1.3,3.5" stroke="#c81f28" stroke-width="0.8" stroke-linecap="round"/>
    </g>
    <!-- ambient occlusion under the cuirass -->
    <path d="M66.5,170 Q98,180 130,170 L130.5,181 Q98,191 66,181 Z" fill="url(#${id('aov')})"/>
    <!-- muscle cuirass -->
    <path d="${CUIR}" fill="url(#${id('cuir')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
    <g clip-path="url(#${id('cuirclip')})">
      <path d="${CUIR}" fill="url(#${id('hammer')})" opacity="0.25"/>
      <!-- form shadow on the far side -->
      <path d="M116,112 Q136,140 128,178 L140,178 L140,112 Z" fill="#6b3a12" opacity="0.36"/>
      <path d="M60,160 Q98,172 136,158 L136,180 L60,180 Z" fill="#6b3a12" opacity="0.18"/>
      <!-- second shade layer under the pecs and ribs -->
      <path d="M72,140 Q84,152 98,142 L98,150 Q84,158 72,148 Z" fill="#8a4c16" opacity="0.2"/>
      <path d="M99,142 Q112,152 126,138 L126,146 Q112,158 99,150 Z" fill="#8a4c16" opacity="0.24"/>
      <path d="M100,150 L112,152 L112,164 L100,166 Z M84,152 L97,150 L97,166 L84,164 Z" fill="#8a4c16" opacity="0.1"/>
      <!-- reflected light on the shadow side -->
      <path d="M128.5,132 Q131.5,148 129.5,164" fill="none" stroke="#ffd88a" stroke-width="1.8" stroke-linecap="round" opacity="0.6"/>
      <path d="M68,162 Q98,172 128,162" fill="none" stroke="#ffd88a" stroke-width="1.2" opacity="0.4"/>
      <!-- pecs -->
      <path d="M72,137 Q84,147 97,139" fill="none" stroke="#7a4515" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M99,139 Q112,147 126,135" fill="none" stroke="#7a4515" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M73,138.6 Q84,148.6 97,140.6 M99,140.6 Q112,148.6 125.6,136.8" fill="none" stroke="#ffe7a8" stroke-width="0.8" stroke-linecap="round" opacity="0.8"/>
      <path d="M74,131 Q84,128 95,132 M102,132 Q113,128 123,131" fill="none" stroke="#7a4515" stroke-width="0.7" stroke-linecap="round" opacity="0.6"/>
      <!-- nipples -->
      <circle cx="84" cy="138" r="1.2" fill="#9a5b22"/><circle cx="113" cy="138" r="1.2" fill="#9a5b22"/>
      <circle cx="83.6" cy="137.6" r="0.4" fill="#ffe7a8"/><circle cx="112.6" cy="137.6" r="0.4" fill="#ffe7a8"/>
      <!-- sternum + linea alba -->
      <path d="M98,124 L98,138 M98,142 L98,166" stroke="#7a4515" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M99.2,125 L99.2,137 M99.2,143 L99.2,164" stroke="#ffe7a8" stroke-width="0.5" opacity="0.7"/>
      <!-- abs -->
      <path d="M86,150 Q92,152.5 97,150 M99,150 Q105,152.5 111,150 M87,158 Q92,160.5 97,158 M99,158 Q105,160.5 110,158" fill="none" stroke="#7a4515" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M86.5,151.2 Q92,153.7 96.5,151.2 M87.5,159.2 Q92,161.7 96.5,159.2 M99.5,151.2 Q105,153.7 110.5,151.2 M99.5,159.2 Q105,161.7 110,159.2" fill="none" stroke="#ffe7a8" stroke-width="0.7" opacity="0.8"/>
      <circle cx="98" cy="166.5" r="1.1" fill="#7a4515"/>
      <!-- serratus / flank -->
      <path d="M72,148 Q76,156 74,166 M125,146 Q121,156 123,166" fill="none" stroke="#7a4515" stroke-width="1.1" stroke-linecap="round" opacity="0.8"/>
      <path d="M121,150 l3,-1.5 M121,155 l3,-1.5 M76,152 l-3,-1.5 M76,157 l-3,-1.5 M121,145 l3,-1.5" stroke="#7a4515" stroke-width="0.9" stroke-linecap="round" opacity="0.7"/>
      <!-- engraved neckline border -->
      <path d="M70,127 Q98,113.5 126,127" fill="none" stroke="#7a4515" stroke-width="0.8"/>
      <path d="M70.6,128.4 Q98,115 125.4,128.4" fill="none" stroke="#7a4515" stroke-width="1.1" stroke-dasharray="1 1.2" opacity="0.8"/>
      <path d="M70,126 Q98,112.5 126,126" fill="none" stroke="#ffe7a8" stroke-width="0.5" opacity="0.7"/>
      <!-- engraved shoulder curl + side border -->
      <path d="M69,134 q-1,-4 3,-4.6 q3.4,0 3.2,3 q-0.2,2.4 -2.4,2.2" fill="none" stroke="#7a4515" stroke-width="0.8" stroke-linecap="round"/>
      <path d="M127,134 q1,-4 -3,-4.6 q-3.4,0 -3.2,3 q0.2,2.4 2.4,2.2" fill="none" stroke="#7a4515" stroke-width="0.8" stroke-linecap="round"/>
      <path d="M67.6,144 Q66.8,154 68,164 M129.4,144 Q130.4,154 129.4,164" fill="none" stroke="#7a4515" stroke-width="0.7" stroke-dasharray="2 1.2"/>
      <!-- scratches -->
      <path d="${scr}" fill="none" stroke="#fff3cf" stroke-width="0.4" stroke-linecap="round" opacity="0.5"/>
      <path d="M86,128 l3,4 M110,158 l4,-2 M92,145 l-2,3" fill="none" stroke="#6b3a12" stroke-width="0.5" stroke-linecap="round" opacity="0.6"/>
      <!-- polished highlight -->
      <path d="M71,130 Q75,123 88,120" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
      <ellipse cx="80" cy="133" rx="5" ry="2.4" fill="#ffffff" opacity="0.55" transform="rotate(-18 80 133)"/>
      <path d="M69,142 Q68,152 70,160" fill="none" stroke="#fff5d4" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>
      <circle cx="90.6" cy="127.5" r="0.9" fill="#fff"/>
      <!-- dent -->
      <ellipse cx="108" cy="130" rx="3.4" ry="2" fill="#8a4c16" opacity="0.22" transform="rotate(-25 108 130)"/>
      <path d="M105.5,131.6 q3,1.6 6,-1.4" fill="none" stroke="#fff3cf" stroke-width="0.6" opacity="0.7" stroke-linecap="round"/>
    </g>
    <!-- flank straps with buckles -->
    <g>
      <path d="M124.5,140 L133,141.4 L132.6,146.6 L124.2,145.4 Z" fill="url(#${id('leather')})" stroke="${OL}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M124.5,154 L132.4,155 L132,160 L124.2,159 Z" fill="url(#${id('leather')})" stroke="${OL}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M125.4,142.6 L131,143.4 M125.2,156.4 L130.8,157.2" stroke="#e0ad7a" stroke-width="0.5" stroke-dasharray="1 0.8"/>
      <rect x="127.4" y="141" width="3.2" height="5" rx="0.8" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="0.8" transform="rotate(8 129 143.5)"/>
      <rect x="127" y="154.6" width="3.2" height="5" rx="0.8" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="0.8" transform="rotate(8 129 157)"/>
    </g>
    <!-- lower rim band with meander -->
    <path d="M65,163 Q98,173 131,163 L131,169 Q98,179 65,169 Z" fill="url(#${id('bronzev')})" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M68,166.8 l0,-2 l3,0 l0,2.6 M74,167.8 l0,-2 l3,0 l0,2.4 M80,168.8 l0,-2 l3,0 l0,2.4 M86,169.5 l0,-2 l3,0 l0,2.2 M92,170 l0,-2 l3,0 l0,2 M101,170 l0,-2 l3,0 l0,2 M107,169.5 l0,-2 l3,0 l0,2.2 M113,168.8 l0,-2 l3,0 l0,2.4 M119,167.8 l0,-2 l3,0 l0,2.4 M125,166.8 l0,-2 l3,0 l0,2.6"
          fill="none" stroke="#7a4515" stroke-width="0.8"/>
    <path d="M66,164.4 Q98,174.4 130,164.4" fill="none" stroke="#fff0c4" stroke-width="0.6" opacity="0.8"/>
    <path d="M66,168.6 Q98,178.6 130,168.6" fill="none" stroke="#6b3a12" stroke-width="0.5" opacity="0.7"/>
    <g fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="0.4"><circle cx="66.6" cy="166" r="0.9"/><circle cx="129.4" cy="166" r="0.9"/><circle cx="98" cy="171.6" r="1"/></g>
    <!-- neck rim -->
    <path d="M78,117 Q98,110 118,117" fill="none" stroke="#7a4515" stroke-width="1.2"/>
    <path d="M78,116 Q98,109 118,116" fill="none" stroke="#fff0c4" stroke-width="0.6" opacity="0.8"/>
    <path d="M80,118.4 Q98,112.2 116,118.4" fill="none" stroke="#7a4515" stroke-width="1.1" stroke-dasharray="0.1 3" stroke-linecap="round"/>`;
  }

  /* ---------------- off arm + aspis ---------------- */
  function backArm(id) {
    return `
    <!-- upper off arm, going behind the shield -->
    <path d="M64,124 Q72,118 80,124 L82,146 L66,150 Q61,138 64,124 Z" fill="url(#${id('skinl')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M64,124 Q72,118 80,124 L80.6,132 Q72,128 63.6,132 Z" fill="url(#${id('aov')})" opacity="0.7"/>
    <path d="M67,132 Q66,140 68,146" fill="none" stroke="#fff0e0" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/>
    <path d="M76,134 Q78,140 77,146 M73,138 q1.5,2 1,5" fill="none" stroke="#c98458" stroke-width="0.8" stroke-linecap="round"/>
    <path d="M70,142 q1,-0.8 2,0 M73,145 q1,-0.8 2,0" fill="none" stroke="#a4643c" stroke-width="0.5" stroke-linecap="round" opacity="0.7"/>`;
  }

  function aspis(id) {
    var rivets = '', rh = '';
    for (var i = 0; i < 16; i++) {
      var a = i / 16 * Math.PI * 2;
      var rx = 47 + Math.cos(a) * 30.2, ry = 160 + Math.sin(a) * 34.2;
      rivets += `<circle cx="${f(rx)}" cy="${f(ry)}" r="1.25"/>`;
      rh += `<circle cx="${f(rx - 0.4)}" cy="${f(ry - 0.45)}" r="0.4"/>`;
    }
    var rope = ropeTicks(47, 160, 30.2, 34.2, 72, 4.6);
    var rings = '';
    return `
    <!-- shield edge (thickness / inner rim) -->
    <ellipse cx="52.5" cy="160" rx="33" ry="37" fill="#7a4418" stroke="${OL}" stroke-width="3.2"/>
    <path d="M78,132 Q90,160 78,188" fill="none" stroke="#5a3010" stroke-width="2" opacity="0.8"/>
    <path d="M80,136 Q90,160 80,184" fill="none" stroke="#c98a44" stroke-width="0.7" opacity="0.6"/>
    <!-- porpax arm-strap and antilabe cord seen on the edge -->
    <path d="M77,150 Q86,149 86.5,153 Q86,158 77,158 Z" fill="url(#${id('leather')})" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M77,150 Q86,149 86.5,153 Q86,158 77,158 Z" fill="url(#${id('grain')})"/>
    <path d="M79,151.5 L85,151.5" stroke="#e0ad7a" stroke-width="0.6" stroke-dasharray="1.2 1"/>
    <path d="M79,156.3 L85,156.3" stroke="#3d220d" stroke-width="0.5" stroke-dasharray="1.2 1"/>
    <circle cx="83" cy="153.8" r="1.05" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="0.5"/>
    <path d="M78,172 Q88,176 84,184" fill="none" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>
    <path d="M78,172 Q88,176 84,184" fill="none" stroke="#c99a5e" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M78,172 Q88,176 84,184" fill="none" stroke="#7a522b" stroke-width="1.5" stroke-linecap="butt" stroke-dasharray="0.6 1.4"/>
    <path d="M84,184 l-1.5,3.6 M84,184 l0.4,4 M84,184 l1.7,3.4" stroke="${OL}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M84,184 l-1.5,3.6 M84,184 l0.4,4 M84,184 l1.7,3.4" stroke="#c99a5e" stroke-width="0.6" stroke-linecap="round"/>
    <!-- face -->
    <ellipse cx="47" cy="160" rx="33" ry="37" fill="url(#${id('aspis')})" stroke="${OL}" stroke-width="3.2"/>
    <g clip-path="url(#${id('aspisclip')})">
      <!-- dished field shading -->
      <ellipse cx="50" cy="164" rx="26" ry="30" fill="#8a531e" opacity="0.18"/>
      <ellipse cx="47" cy="160" rx="33" ry="37" fill="url(#${id('hammer')})" opacity="0.35"/>
      <!-- engraved concentric rings + reflected light at the bottom -->
      <ellipse cx="47" cy="160" rx="24.4" ry="28.2" fill="none" stroke="#7a4515" stroke-width="0.7" opacity="0.8"/>
      <ellipse cx="47" cy="160" rx="24.4" ry="28.2" fill="none" stroke="#fff0c4" stroke-width="0.4" opacity="0.7" transform="translate(0.5,0.6)"/>
      <ellipse cx="47" cy="160" rx="21.8" ry="25.4" fill="none" stroke="#7a4515" stroke-width="0.9" stroke-dasharray="0.1 2.6" stroke-linecap="round"/>
      <path d="M22,178 Q34,196 58,194 Q70,190 74,178" fill="none" stroke="#ffd88a" stroke-width="2.4" stroke-linecap="round" opacity="0.5"/>
      <!-- lambda -->
      <path d="M31,186 L44.5,134 L50.5,134 L64,186 L55.5,186 L47.5,152 L39.5,186 Z"
            fill="url(#${id('lambda')})" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M33.5,184 L45.5,137 M56.5,184 L49,155" stroke="#ff8a78" stroke-width="0.5" opacity="0.55" fill="none"/>
      <path d="M45,137 L34,183" stroke="#ff8a78" stroke-width="1.2" stroke-linecap="round" opacity="0.9"/>
      <path d="M50,138 L61,183" stroke="#6b0d15" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
      <path d="M52.6,152 L62,184" stroke="#6b0d15" stroke-width="0.6" opacity="0.5"/>
      <!-- paint chips showing the bronze under the lambda -->
      <g fill="#e6b25e" stroke="#7a4515" stroke-width="0.35" stroke-linejoin="round">
        <path d="M37,169 l2.6,-1.2 l1,2.2 l-2,1.6 z"/>
        <path d="M54,163 l2,-0.8 l0.8,1.8 l-1.8,0.8 z"/>
        <path d="M46.4,140 l1.8,-0.4 l0.2,1.6 l-1.6,0.2 z"/>
        <path d="M58,178 l1.6,0.2 l0,1.6 l-1.6,-0.4 z"/>
        <path d="M34.6,180 l1.5,-0.4 l0.6,1.4 l-1.6,0.2 z"/>
      </g>
      <path d="M40.4,158 l1,-1.2 M44,145 l0.8,-1.4 M57.6,172 l1.4,1" stroke="#e6b25e" stroke-width="0.6" stroke-linecap="round"/>
      <!-- dents -->
      <g>
        <ellipse cx="62" cy="146" rx="4.2" ry="2.6" fill="#8a531e" opacity="0.28" transform="rotate(-30 62 146)"/>
        <path d="M58.6,145 q3.4,-3.2 7,-1" fill="none" stroke="#6b3a12" stroke-width="0.7" stroke-linecap="round"/>
        <path d="M59.4,148.6 q3.2,1.2 6.2,-1.6" fill="none" stroke="#fff6d0" stroke-width="0.7" stroke-linecap="round"/>
        <ellipse cx="27" cy="172" rx="2.8" ry="1.9" fill="#8a531e" opacity="0.28" transform="rotate(20 27 172)"/>
        <path d="M24.6,171.4 q2.4,-1.8 4.8,0" fill="none" stroke="#6b3a12" stroke-width="0.6" stroke-linecap="round"/>
        <path d="M25,173.6 q2.4,1 4.6,-0.6" fill="none" stroke="#fff6d0" stroke-width="0.6" stroke-linecap="round"/>
      </g>
      <!-- glossy highlight -->
      <path d="M22,150 Q26,134 40,127" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" opacity="0.85"/>
      <circle cx="21.5" cy="157" r="1.6" fill="#ffffff" opacity="0.8"/>
      <path d="M26,146 Q29,138 35,133" fill="none" stroke="#ffffff" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
      <!-- battle scratches -->
      <path d="M62,142 l5,-3 M60,146 l4,-1.5 M29,176 l3,3" stroke="#fff3cf" stroke-width="0.8" stroke-linecap="round" opacity="0.8"/>
      <path d="M68,172 l-3,4" stroke="#6b3a12" stroke-width="0.8" stroke-linecap="round" opacity="0.7"/>
      <path d="M50,190 l6,-4 M52,192 l5,-2 M24,163 l2,-4 M66,158 l3,-5 M36,192 l4,-2" stroke="#fff3cf" stroke-width="0.4" stroke-linecap="round" opacity="0.7"/>
      <path d="M66,166 l1,-4 M62,186 l3,-2" stroke="#6b3a12" stroke-width="0.5" stroke-linecap="round" opacity="0.6"/>
    </g>
    <!-- rolled rim (itys) with rope twist -->
    <ellipse cx="47" cy="160" rx="30.2" ry="34.2" fill="none" stroke="url(#${id('bronzev')})" stroke-width="5.4"/>
    <path d="${rope}" fill="none" stroke="#7a4515" stroke-width="1.1" stroke-linecap="round" opacity="0.85"/>
    <path d="${rope}" fill="none" stroke="#fff0c4" stroke-width="0.5" stroke-linecap="round" opacity="0.7" transform="translate(-0.5,-0.4)"/>
    <ellipse cx="47" cy="160" rx="27.2" ry="31.2" fill="none" stroke="${OL}" stroke-width="1.2"/>
    <ellipse cx="47" cy="160" rx="33" ry="37" fill="none" stroke="${OL}" stroke-width="3.2"/>
    <g fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="0.55">${rivets}</g>
    <g fill="#ffffff">${rh}</g>
    <path d="M24,136 Q34,125.5 47,124.5" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.9"/>
    <path d="M70,186 Q60,195 46,196.5" fill="none" stroke="#ffd88a" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>`;
  }

  /* ---------------- dory spear + weapon arm ---------------- */
  function spear(id) {
    return `
    <g transform="translate(150,150) rotate(20)">
      <!-- ash shaft -->
      <rect x="-2.8" y="-76" width="5.6" height="140" rx="2" fill="url(#${id('shaft')})" stroke="${OL}" stroke-width="2.4"/>
      <path d="M-0.6,-70 L-0.6,58" stroke="#fff4dc" stroke-width="0.8" opacity="0.8"/>
      <path d="M1.4,-40 q0.6,3 0,6 M1.2,20 q0.6,3 0,6 M-1.5,-12 q-0.5,2 0,4" fill="none" stroke="#7a522b" stroke-width="0.6"/>
      <path d="M1.6,-70 C1,-50 2,-30 1.4,-8 M-1.8,-30 C-1.4,-10 -2,20 -1.6,58 M0.4,26 C0.8,40 0.2,50 0.6,58 M1.5,-62 q-0.6,2 0.3,4 M1.6,44 q-0.7,2 0.2,4" fill="none" stroke="#8a5f33" stroke-width="0.35" opacity="0.85"/>
      <ellipse cx="1" cy="-52" rx="0.8" ry="1.5" fill="none" stroke="#7a522b" stroke-width="0.4"/>
      <!-- tally notches cut into the shaft -->
      <path d="M-2.8,30 l2.4,0.9 M-2.8,33 l2.4,0.9 M-2.8,36 l2.4,0.9 M-2.8,39 l2.4,0.9 M-2.9,29.5 l5.6,10.4" stroke="#4a2a10" stroke-width="0.7" stroke-linecap="round"/>
      <!-- leather grip wraps -->
      <g>
        <rect x="-3.4" y="-24" width="6.8" height="14" rx="1.2" fill="url(#${id('leatherd')})" stroke="${OL}" stroke-width="1.5"/>
        <rect x="-3.4" y="-24" width="6.8" height="14" rx="1.2" fill="url(#${id('grain')})"/>
        <path d="M-3.4,-22 l6.8,2 M-3.4,-19 l6.8,2 M-3.4,-16 l6.8,2 M-3.4,-13 l6.8,2" stroke="#3d220d" stroke-width="0.8"/>
        <path d="M-3.4,-23 l6.8,2 M-3.4,-20 l6.8,2 M-3.4,-17 l6.8,2 M-3.4,-14 l6.8,2" stroke="#d9a878" stroke-width="0.4" opacity="0.8"/>
        <path d="M0,-10 q-3,3 -4,6 M0.4,-10 q1,4 0.4,7" fill="none" stroke="${OL}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M0,-10 q-3,3 -4,6 M0.4,-10 q1,4 0.4,7" fill="none" stroke="#b98150" stroke-width="0.6" stroke-linecap="round"/>
        <rect x="-3.4" y="9" width="6.8" height="14" rx="1.2" fill="url(#${id('leatherd')})" stroke="${OL}" stroke-width="1.5"/>
        <rect x="-3.4" y="9" width="6.8" height="14" rx="1.2" fill="url(#${id('grain')})"/>
        <path d="M-3.4,11 l6.8,-2 M-3.4,14 l6.8,-2 M-3.4,17 l6.8,-2 M-3.4,20 l6.8,-2 M-3.4,23 l6.8,-2" stroke="#3d220d" stroke-width="0.8"/>
        <path d="M-3.4,12 l6.8,-2 M-3.4,15 l6.8,-2 M-3.4,18 l6.8,-2 M-3.4,21 l6.8,-2" stroke="#d9a878" stroke-width="0.4" opacity="0.8"/>
      </g>
      <!-- sauroter (butt spike) -->
      <path d="M-3.8,60 L3.8,60 L3.4,70 L0.6,82 L-0.6,82 L-3.4,70 Z" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M-3.8,63 L3.8,63" stroke="${OL}" stroke-width="1.4"/>
      <path d="M0,65 L0,80" stroke="#7a4515" stroke-width="0.9"/>
      <path d="M-2,66 L-0.8,78" stroke="#ffffff" stroke-width="0.9" stroke-linecap="round" opacity="0.9"/>
      <path d="M-3.4,66 L3.4,66 M-3.1,68.6 L3.1,68.6" stroke="#7a4515" stroke-width="0.6"/>
      <path d="M1.4,66 L0.6,79" stroke="#7a4515" stroke-width="0.5" opacity="0.7"/>
      <path d="M-1,80 l2,0" stroke="#fff" stroke-width="0.5"/>
      <!-- red ribbon tied under the blade -->
      <g>
        <path d="M-2,-71 C-8,-69 -13,-63 -12.5,-54 C-10,-57 -8,-56.4 -6.6,-52 C-5.4,-58 -2,-64 1.5,-69 Z" fill="url(#${id('ribbon')})" stroke="${OL}" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M-2.6,-69 C-7,-66 -10,-61 -10.6,-56.4" fill="none" stroke="#ff8a78" stroke-width="0.5" opacity="0.8"/>
        <path d="M-5,-64 C-6,-60 -6.6,-57 -6.6,-54" fill="none" stroke="#5e0c16" stroke-width="0.6" opacity="0.7"/>
        <rect x="-3.3" y="-73" width="6.6" height="3.4" rx="1" fill="#c81f28" stroke="${OL}" stroke-width="1.2"/>
        <path d="M-2.4,-72 L2.4,-72" stroke="#ff8a78" stroke-width="0.4"/>
      </g>
      <!-- blade socket -->
      <path d="M-3.6,-74 L3.6,-74 L2.9,-84 L-2.9,-84 Z" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M-3.4,-77.5 L3.4,-77.5 M-3.1,-80.5 L3.1,-80.5" stroke="#7a4515" stroke-width="0.9"/>
      <path d="M-2,-75 L-1.6,-83" stroke="#fff" stroke-width="0.6" opacity="0.9"/>
      <circle cx="1.6" cy="-79" r="0.55" fill="#7a4515"/>
      <!-- leaf blade -->
      <path d="M0,-83 C9,-88 10,-100 0,-118 C-10,-100 -9,-88 0,-83 Z" fill="url(#${id('blade')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M0,-83 C9,-88 10,-100 0,-118 L0,-83 Z" fill="#6f8098" opacity="0.28"/>
      <path d="M0,-85 L0,-114" stroke="#6f8098" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M0.8,-86 L0.8,-112" stroke="#eef4fb" stroke-width="0.6" stroke-linecap="round"/>
      <path d="M-4,-90 Q-6,-99 -1.4,-111" fill="none" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M6.6,-91 Q7.4,-99 2.6,-110" fill="none" stroke="#4d607a" stroke-width="0.6" stroke-linecap="round" opacity="0.8"/>
      <path d="M-6.4,-92 Q-7.6,-99 -3,-110" fill="none" stroke="#c9d6e6" stroke-width="0.5" stroke-linecap="round"/>
      <path d="M-1.2,-88 L-1.2,-93 M2.6,-97 l0.6,3 M6.2,-96 l1.4,0.2" stroke="#5a6b82" stroke-width="0.5" stroke-linecap="round" opacity="0.8"/>
      <path d="M7.7,-96.4 l-1.2,0.4 l0.6,1 z" fill="#8fa2ba"/>
      <!-- tip sparkle -->
      <g transform="translate(-2,-112)">
        <circle r="5" fill="url(#${id('glint')})" opacity="0.9"/>
        <path d="M0,-6 L1,-1 L6,0 L1,1 L0,6 L-1,1 L-6,0 L-1,-1 Z" fill="#ffffff"/>
      </g>
    </g>`;
  }

  function pin(id, x, y) {
    return `<g>
      <circle cx="${x}" cy="${y}" r="4.6" fill="#7a4515" opacity="0.35"/>
      <circle cx="${x}" cy="${y}" r="4.2" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="1.8"/>
      <circle cx="${x}" cy="${y}" r="2.9" fill="none" stroke="#7a4515" stroke-width="0.5" stroke-dasharray="0.1 1" stroke-linecap="round"/>
      <circle cx="${x}" cy="${y}" r="1.8" fill="none" stroke="#7a4515" stroke-width="0.8"/>
      <path d="M${x - 1.2},${y + 1} L${x},${y - 1.2} L${x + 1.2},${y + 1}" fill="none" stroke="#7a4515" stroke-width="0.6" stroke-linejoin="round"/>
      <circle cx="${x - 1}" cy="${y - 1.2}" r="0.9" fill="#ffffff"/>
      <path d="M${x - 3.4},${y + 2} q-2,1.6 -2.6,4 M${x + 3.6},${y + 1.6} q1.4,1 2,3" fill="none" stroke="${OL}" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
    </g>`;
  }

  function weaponArm(id) {
    return `
    <g class="part-weapon" style="transform-origin: 124px 126px">
      <!-- upper arm -->
      <path d="M114,124 Q124,114 134,122 L141,142 Q137,150 129,149 L120,134 Z" fill="url(#${id('skinl')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M121,125 Q128,122 131,127" fill="none" stroke="#fff0e0" stroke-width="1.3" stroke-linecap="round" opacity="0.8"/>
      <path d="M128,135 Q132,140 131,145" fill="none" stroke="#c98458" stroke-width="1" stroke-linecap="round"/>
      <path d="M114,124 Q124,114 134,122 L135,128 Q124,122 115,130 Z" fill="url(#${id('aov')})" opacity="0.5"/>
      <path d="M126,131 Q129,133 129.5,137 M123,133 q1.6,1 2,3" fill="none" stroke="#c98458" stroke-width="0.6" stroke-linecap="round" opacity="0.8"/>
      <path d="M136,131 q2,3 2,6" fill="none" stroke="#fff0e0" stroke-width="0.9" stroke-linecap="round" opacity="0.7"/>
      <!-- forearm -->
      <path d="M129,142 Q136,138 146,143 L148,157 Q139,159 133,155 Q127,150 129,142 Z" fill="url(#${id('skinl')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      <!-- leather bracer -->
      <path d="M137,141 L146,143.5 L147.5,156.5 L138,156.5 Z" fill="url(#${id('leather')})" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M139,144 L145,149 M145,144.5 L139.5,149.5 M139.5,150 L146,154.5 M146,150 L140,155" stroke="#3d220d" stroke-width="0.8"/>
      <path d="M138.5,143 L145.5,145" stroke="#e0ad7a" stroke-width="0.7"/>
      <path d="M137,141 L146,143.5 L147.5,156.5 L138,156.5 Z" fill="url(#${id('grain')})"/>
      <rect x="140.6" y="146" width="4" height="4.4" rx="0.8" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="0.8" transform="rotate(8 142.6 148)"/>
      <circle cx="139.2" cy="142.8" r="0.6" fill="#e6b25e" stroke="${OL}" stroke-width="0.3"/><circle cx="139.6" cy="155.2" r="0.6" fill="#e6b25e" stroke="${OL}" stroke-width="0.3"/>
      <path d="M131,146 q1.6,0.6 3,0.2 M132,148.4 q1.6,0.4 2.6,0" fill="none" stroke="#a4643c" stroke-width="0.5" stroke-linecap="round" opacity="0.8"/>
      <path d="M131.6,145 l3.4,-1.2" stroke="#fff0e0" stroke-width="0.8" stroke-linecap="round" opacity="0.8"/>
      ${spear(id)}
      <!-- fist around the shaft -->
      <g transform="translate(150,150) rotate(20)">
        <path d="M-10,-7 Q-4,-9.5 3,-8.5 L3,8.5 Q-4,9.5 -10,7 Q-12,0 -10,-7 Z" fill="url(#${id('skinl')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
        <g fill="url(#${id('skinl')})" stroke="${OL}" stroke-width="1.6">
          <rect x="-0.5" y="-8.6" width="9.4" height="4.6" rx="2.3"/>
          <rect x="-0.5" y="-4.2" width="9.8" height="4.6" rx="2.3"/>
          <rect x="-0.5" y="0.2" width="9.6" height="4.6" rx="2.3"/>
          <rect x="-0.5" y="4.6" width="8.6" height="4.2" rx="2.1"/>
        </g>
        <path d="M2,-7.4 L6.5,-7.4 M2,-3 L7,-3 M2,1.4 L6.8,1.4 M2,5.7 L6,5.7" stroke="#fff0e0" stroke-width="0.9" stroke-linecap="round" opacity="0.8"/>
        <path d="M-8,-8.5 Q-1,-13 6,-9.6 Q3,-7 -3,-6.8 Z" fill="url(#${id('skinl')})" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M-7,-2 Q-8.4,2 -7,6" fill="none" stroke="#c98458" stroke-width="1" stroke-linecap="round"/>
        <path d="M6.6,-6.6 q1,0.5 1.4,-0.4 M7,-2.2 q1,0.5 1.4,-0.4 M7.2,2.2 q1,0.5 1.4,-0.4 M6.4,6.4 q1,0.5 1.3,-0.4" fill="none" stroke="#fff" stroke-width="0.5" stroke-linecap="round" opacity="0.9"/>
        <path d="M0.4,-4.2 h7.6 M0.4,0.2 h8 M0.4,4.6 h7" stroke="#b9764a" stroke-width="0.5" opacity="0.7"/>
        <path d="M-9,-3 Q-11,0 -9,4" fill="none" stroke="#fff0e0" stroke-width="0.8" stroke-linecap="round" opacity="0.7"/>
      </g>
      <!-- cloak pin (fibula) on the shoulder -->
      ${pin(id, 119, 121)}
    </g>`;
  }

  /* ---------------- head ---------------- */
  function crest(id, withClasses) {
    var cc = withClasses ? ' class="part-cape" style="transform-origin: 99px 34px"' : '';
    var outer = crestPoints(1, 10);
    var c = CREST_C;
    // scalloped horsehair edge
    var d = `M${f(outer[0][0])},${f(outer[0][1])}`;
    for (var i = 1; i < outer.length; i++) {
      var a = outer[i - 1], b = outer[i];
      var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      var vx = mx - c[0], vy = my - c[1], L = Math.sqrt(vx * vx + vy * vy);
      d += ` Q${f(mx + vx / L * 3.2)},${f(my + vy / L * 3.2)} ${f(b[0])},${f(b[1])}`;
    }
    d += ' Q46,54 58,40 Q98,24 140,38 Z';
    // hair strokes following the crest arc
    var strands = '', lights = '';
    var ks = [0.97, 0.94, 0.91, 0.88, 0.85, 0.82, 0.79, 0.76, 0.73, 0.7, 0.66, 0.62, 0.58, 0.54];
    for (var k = 0; k < ks.length; k++) {
      var p = crestPoints(ks[k], 6);
      var s = `M${f(p[0][0])},${f(p[0][1])}`;
      for (var j = 1; j < p.length; j++) s += ` L${f(p[j][0])},${f(p[j][1])}`;
      if (k % 2) lights += s + ' '; else strands += s + ' ';
    }
    // hundreds of individual radial hairs
    var r = rng(3), dark = '', light = '', mid = '';
    var N = 26;
    for (var sg = 0; sg < CREST_SEGS.length; sg++) {
      var g = CREST_SEGS[sg];
      for (var h = 0; h < N; h++) {
        var t = (h + r() * 0.9) / N;
        var q = cubic(g[0], g[1], g[2], g[3], t);
        var ux = q[0] - c[0], uy = q[1] - c[1];
        var k1 = 0.5 + r() * 0.25, k2 = 0.86 + r() * 0.12, bend = (r() - 0.5) * 5;
        var x1 = c[0] + ux * k1, y1 = c[1] + uy * k1, x2 = c[0] + ux * k2, y2 = c[1] + uy * k2;
        var seg = 'M' + f(x1) + ',' + f(y1) + ' Q' + f((x1 + x2) / 2 - uy * 0.02 * bend) + ',' + f((y1 + y2) / 2 + ux * 0.02 * bend) + ' ' + f(x2) + ',' + f(y2) + ' ';
        var kind = r();
        if (kind < 0.42) dark += seg; else if (kind < 0.72) light += seg; else mid += seg;
      }
    }
    // tuft ticks at the edge
    var ticks = '';
    for (var t2 = 2; t2 < outer.length - 1; t2 += 2) {
      var q2 = outer[t2];
      var ux2 = q2[0] - c[0], uy2 = q2[1] - c[1], M = Math.sqrt(ux2 * ux2 + uy2 * uy2);
      ticks += `M${f(q2[0] - ux2 / M * 7)},${f(q2[1] - uy2 / M * 7)} L${f(q2[0] - ux2 / M * 1)},${f(q2[1] - uy2 / M * 1)} `;
    }
    return `
      <g${cc}>
        <path d="${d}" fill="url(#${id('crest')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
        <path d="${strands}" fill="none" stroke="#8c1119" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
        <path d="${lights}" fill="none" stroke="#ff9a7e" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
        <path d="${dark}" fill="none" stroke="#6e0c14" stroke-width="0.5" stroke-linecap="round" opacity="0.55"/>
        <path d="${mid}" fill="none" stroke="#c81f28" stroke-width="0.5" stroke-linecap="round" opacity="0.7"/>
        <path d="${light}" fill="none" stroke="#ff8f78" stroke-width="0.4" stroke-linecap="round" opacity="0.4"/>
        <path d="${ticks}" fill="none" stroke="#a0161f" stroke-width="1" stroke-linecap="round" opacity="0.8"/>
        <path d="M37,66 q-2,4 -4,6 M40,67 q0,4 -1,7 M43,64 q2,3 2,6 M35,62 q-3,2 -5,5 M46,60 q3,2 3,5" fill="none" stroke="${OL}" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M37,66 q-2,4 -4,6 M40,67 q0,4 -1,7 M43,64 q2,3 2,6" fill="none" stroke="#b3212b" stroke-width="0.5" stroke-linecap="round"/>
        <path d="M128,14 Q108,6 84,9 M70,14 Q58,19 50,30" fill="none" stroke="#ffd2c0" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>
        <path d="M132,18 Q112,10 90,12 M64,18 Q54,24 46,36" fill="none" stroke="#ffd2c0" stroke-width="0.7" stroke-linecap="round" opacity="0.6"/>
        <path d="M120,28 Q96,20 70,26" fill="none" stroke="#5e0c16" stroke-width="5" stroke-linecap="round" opacity="0.28"/>
      </g>`;
  }

  function eye(cx, cy, id, side) {
    /* side: -1 = left eye (outer corner left), +1 = right eye */
    var o = side;
    return `
      <g>
        <ellipse cx="${cx}" cy="${cy}" rx="5.2" ry="6.2" fill="${OL}"/>
        <ellipse cx="${cx + 0.6}" cy="${cy + 1.2}" rx="3.9" ry="4.6" fill="url(#${id('iris')})"/>
        <ellipse cx="${cx + 0.6}" cy="${cy + 1.2}" rx="3.9" ry="4.6" fill="none" stroke="#5a300a" stroke-width="0.6"/>
        <path d="M${cx + 0.8},${cy + 1.2} l-2.2,1.6 M${cx + 0.8},${cy + 1.2} l0.2,3 M${cx + 0.8},${cy + 1.2} l2.4,1.6 M${cx + 0.8},${cy + 1.2} l2.8,-0.8 M${cx + 0.8},${cy + 1.2} l-2.8,-0.4" stroke="#f5c24e" stroke-width="0.35" opacity="0.75"/>
        <circle cx="${cx + 0.8}" cy="${cy + 1}" r="1.8" fill="${OL}"/>
        <path d="M${cx - 3.4},${cy - 2.2} Q${cx + 0.6},${cy - 5.4} ${cx + 4.6},${cy - 2.2} Q${cx + 0.6},${cy - 3} ${cx - 3.4},${cy - 2.2} Z" fill="#2b1d14" opacity="0.7"/>
        <path d="M${cx - 2.2},${cy + 4.8} Q${cx + 0.8},${cy + 6} ${cx + 3.2},${cy + 4.2}" fill="none" stroke="#ffe08a" stroke-width="0.7" stroke-linecap="round" opacity="0.85"/>
        <circle cx="${cx - 1.6}" cy="${cy - 2.5}" r="2.1" fill="#ffffff"/>
        <circle cx="${cx + 2.3}" cy="${cy + 3.1}" r="0.95" fill="#ffffff"/>
        <circle cx="${cx + 2.6}" cy="${cy - 1.2}" r="0.6" fill="#ffffff" opacity="0.9"/>
        <path d="M${cx - 5.4},${cy - 2.6} Q${cx},${cy - 7.6} ${cx + 5.6},${cy - 2.2}" fill="none" stroke="${OL}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M${cx + o * 5.2},${cy - 2.8} l${o * 1.6},-0.2" stroke="${OL}" stroke-width="1.3" stroke-linecap="round"/>
        <path d="M${cx - 4.4},${cy + 5.6} Q${cx},${cy + 8} ${cx + 4.6},${cy + 5.4}" fill="none" stroke="#b9764a" stroke-width="0.6" stroke-linecap="round" opacity="0.75"/>
      </g>`;
  }

  function brow(pts, hairs) {
    return `<path d="${pts}" fill="#3a2314" stroke="${OL}" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="${hairs[0]}" fill="none" stroke="#7a4e2c" stroke-width="0.5" stroke-linecap="round" opacity="0.9"/>
    <path d="${hairs[1]}" fill="none" stroke="#150a04" stroke-width="0.5" stroke-linecap="round" opacity="0.8"/>`;
  }

  function face(id, withClasses) {
    var ec = withClasses ? ' class="part-eyes" style="transform-origin: 105px 85px"' : '';
    var r = rng(21), bd = '', bl = '', stub = '';
    for (var i = 0; i < 96; i++) {
      var x0 = 82 + r() * 46, y0 = 100 + r() * 36;
      var dx = (x0 - 105) / 24, dy = (y0 - 118) / 20;
      if (dx * dx + dy * dy > 1.15) continue;
      var lean = (x0 - 105) * 0.06 + (r() - 0.5) * 2, len = 5 + r() * 5;
      var seg = 'M' + f(x0) + ',' + f(y0) + ' q' + f(lean * 0.5) + ',' + f(len * 0.5) + ' ' + f(lean) + ',' + f(len) + ' ';
      if (i % 3) bd += seg; else if (i % 2) bl += seg;
    }
    for (var j = 0; j < 26; j++) {
      var sx = 84 + r() * 42, sy = 91 + r() * 7;
      if (sy > 97 + Math.abs(sx - 105) * -0.05 && sx > 92 && sx < 118) continue;
      stub += 'M' + f(sx) + ',' + f(sy) + ' l0.1,0.1 ';
    }
    return `
    <!-- skin behind the helmet openings -->
    <path d="M66,70 L144,70 L144,98 L122,126 L88,126 L66,98 Z" fill="url(#${id('skin')})"/>
    <!-- shadow cast by the helmet brow -->
    <path d="M66,70 L144,70 L144,80 Q124,74 105,82 Q86,74 66,80 Z" fill="#6b3a12" opacity="0.28"/>
    <path d="M66,80 Q86,74 105,82 Q124,74 144,80 L144,86 Q124,81 105,88 Q86,81 66,86 Z" fill="#b9764a" opacity="0.16"/>
    <!-- nasal-guard occlusion + cheek blush + stubble -->
    <path d="M110,76 L117,80 L115,97 L109.5,99 Z M100,76 L94,80 L95.5,97 L100.5,99 Z" fill="#8a4c16" opacity="0.2"/>
    <ellipse cx="80.5" cy="93" rx="6" ry="2.4" fill="#ff7f70" opacity="0.4"/>
    <ellipse cx="130" cy="93" rx="6" ry="2.4" fill="#ff7f70" opacity="0.4"/>
    <path d="${stub}" fill="none" stroke="#5a3822" stroke-width="0.9" stroke-linecap="round" opacity="0.65"/>
    <path d="M73,90 q3,1.4 6,0.4 M132,90.4 q3,1 6,-0.4" fill="none" stroke="#fff0e0" stroke-width="0.6" stroke-linecap="round" opacity="0.5"/>
    <!-- short dark beard -->
    <path d="${BEARD}" fill="url(#${id('beard')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
    <g clip-path="url(#${id('beardclip')})">
      <path d="${bd}" fill="none" stroke="#120a05" stroke-width="0.7" stroke-linecap="round" opacity="0.5"/>
      <path d="${bl}" fill="none" stroke="#8a5c3a" stroke-width="0.6" stroke-linecap="round" opacity="0.4"/>
      <path d="M84,124 Q92,136 106,137 Q120,136 127,124" fill="none" stroke="#a87a4e" stroke-width="1.2" stroke-linecap="round" opacity="0.4"/>
      <path d="M86,108 Q82,118 84,126 M124,108 Q128,118 126,126" fill="none" stroke="#8a5c3a" stroke-width="1" stroke-linecap="round" opacity="0.4"/>
      <path d="M100,132 q2,-3 4,-5 M108,133 q1,-3 3,-5" fill="none" stroke="#c9a06a" stroke-width="0.6" stroke-linecap="round" opacity="0.5"/>
    </g>
    <path d="M92,120 q1,5 3,9 M98,124 q0,5 1,9 M105,125 q0,5 0,10 M112,124 q0,5 -1,9 M118,120 q-1,5 -3,9 M88,112 q1,4 2,7 M122,112 q-1,4 -2,7"
          fill="none" stroke="#1a0f08" stroke-width="1.1" stroke-linecap="round" opacity="0.8"/>
    <path d="M95,121 q1,4 2,7 M101,124 q0,4 1,7 M109,124 q0,4 -1,7 M115,121 q-1,4 -2,7"
          fill="none" stroke="#8a5c3a" stroke-width="0.9" stroke-linecap="round" opacity="0.8"/>
    <!-- nose tip below the nasal -->
    <path d="M102,101 Q105,106 108.5,101" fill="#eaa77a" stroke="${OL}" stroke-width="1.4" stroke-linejoin="round"/>
    <circle cx="103.6" cy="102.6" r="0.5" fill="#8a4c16" opacity="0.7"/><circle cx="107" cy="102.6" r="0.5" fill="#8a4c16" opacity="0.7"/>
    <path d="M103.4,101.4 q1.2,-0.6 2,0" stroke="#fff0e0" stroke-width="0.6" fill="none" stroke-linecap="round" opacity="0.9"/>
    <!-- moustache -->
    <path d="M93,106 Q99,101.5 105,104 Q111,101.5 117,106 Q113,108.5 109,107.5 Q105,106.5 101,107.5 Q97,108.5 93,106 Z"
          fill="#3a2314" stroke="${OL}" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M96,105 Q100,103.4 103.5,104.6 M106.5,104.6 Q110,103.4 114,105" fill="none" stroke="#8a5c3a" stroke-width="0.7" stroke-linecap="round"/>
    <path d="M94.6,106.4 l3,-1.2 M98,106.8 l3,-1.6 M116.4,106.4 l-3,-1.2 M113,106.8 l-3,-1.6 M100,105 l1.6,-0.4" fill="none" stroke="#150a04" stroke-width="0.5" stroke-linecap="round"/>
    <!-- determined mouth: lips, gritted teeth -->
    <path d="M98.8,109.6 Q105,108 111.2,109.6 Q110.4,113.8 105,114.2 Q99.6,113.8 98.8,109.6 Z" fill="#c9705f" stroke="${OL}" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M100.2,110.4 Q105,111.4 109.8,110.4 Q109,112.9 105,113 Q101,112.9 100.2,110.4 Z" fill="#5a1418"/>
    <path d="M100.6,110.6 Q105,111.6 109.4,110.6 L109.1,112 Q105,112.8 100.9,112 Z" fill="#ffffff"/>
    <path d="M105,110.9 L105,112.3 M102.8,111 L102.9,112.2 M107.2,111 L107.1,112.2" stroke="#c8b9a8" stroke-width="0.35"/>
    <path d="M101.8,113.9 Q105,115.2 108.2,113.9" fill="none" stroke="#f4a08f" stroke-width="0.5" stroke-linecap="round" opacity="0.9"/>
    <!-- eyes -->
    <g${ec}>
      ${eye(87, 86, id, -1)}
      ${eye(123, 86, id, 1)}
    </g>
    <!-- fierce brows -->
    ${brow('M77,76.5 Q86,76 96.5,80.5 L95.5,83 Q86,79.5 78,80 Z', ['M79,79 l2,-1.6 M83,78.4 l2.2,-1.4 M87,78.6 l2.4,-0.6 M91,79.8 l2.4,0.2', 'M80,79.8 l1.8,-1 M85,79.2 l2,-0.8 M89,79.6 l2,0'])}
    ${brow('M113.5,80.5 Q124,76 133,76.5 L132,80 Q124,79.5 114.5,83 Z', ['M131,79 l-2,-1.6 M127,78.4 l-2.2,-1.4 M123,78.6 l-2.4,-0.6 M119,79.8 l-2.4,0.2', 'M130,79.8 l-1.8,-1 M125,79.2 l-2,-0.8 M121,79.6 l-2,0'])}
    <path d="M76,82 q1,-2 3,-2.4 M134,82 q-1,-2 -3,-2.4" fill="none" stroke="#a4643c" stroke-width="0.5" stroke-linecap="round"/>`;
  }

  function helmet(id) {
    var browTicks = '';
    for (var k = 0; k < 9; k++) {
      var tx = 73 + k * 3.2, ty = 71.6 - Math.sin(k / 8 * Math.PI) * 6 - 0.6;
      browTicks += 'M' + f(tx) + ',' + f(ty + 1.6) + ' l0.8,-2 ';
      var ux = 138 - k * 3.2, uy = 71.2 - Math.sin(k / 8 * Math.PI) * 6 - 0.4;
      browTicks += 'M' + f(ux) + ',' + f(uy + 1.6) + ' l-0.8,-2 ';
    }
    return `
    <!-- bronze Corinthian helmet -->
    <path d="${HELM}" fill="url(#${id('helm')})" stroke="none"/>
    <g clip-path="url(#${id('helmclip')})">
      <path d="${HELM}" fill="url(#${id('hammer')})" opacity="0.3"/>
      <!-- side shadow -->
      <path d="M136,40 Q154,70 150,126 L126,126 Q146,96 136,40 Z" fill="#6b3a12" opacity="0.35"/>
      <path d="M40,100 Q70,112 100,126 L40,126 Z" fill="#6b3a12" opacity="0.22"/>
      <path d="M146,46 Q152,74 148,110" fill="none" stroke="#ffd88a" stroke-width="1.6" stroke-linecap="round" opacity="0.45"/>
      <!-- raised rim bands along every edge -->
      <path d="${HELM}" fill="none" stroke="#9c6226" stroke-width="7"/>
      <path d="${HELM}" fill="none" stroke="#f7d58a" stroke-width="2.2" opacity="0.8" transform="translate(0.8,0.8)"/>
      <path d="${HELM}" fill="none" stroke="#6b3a12" stroke-width="0.6" transform="translate(-3.4,-3.4)" opacity="0.6"/>
      <path d="${OPEN}" fill="none" stroke="#9c6226" stroke-width="7"/>
      <path d="${OPEN}" fill="none" stroke="#6b3a12" stroke-width="1" transform="translate(0,1)"/>
      <path d="${OPEN}" fill="none" stroke="#f7d58a" stroke-width="0.8" transform="translate(0,-3.4)" opacity="0.75"/>
      <path d="${OPEN}" fill="none" stroke="#5a3010" stroke-width="1.2" stroke-dasharray="0.1 2.4" stroke-linecap="round" transform="translate(0,-5)" opacity="0.8"/>
      <!-- patina in the crevices -->
      <g fill="#5fae95" opacity="0.35">
        <path d="M52,112 q4,-1 6,3 q-3,3 -6,0 z"/><path d="M138,118 q4,0 5,-4 q-4,-1 -6,2 z"/>
        <path d="M60,60 q2,-3 4,0 q0,3 -3,3 z"/><path d="M140,64 q2,-2 3,1 q-1,3 -3,1 z"/>
      </g>
      <!-- embossed brows over the eyes -->
      <path d="M70,73 Q82,61 102,70" fill="none" stroke="#7a4515" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M108,70 Q128,61 141,73" fill="none" stroke="#7a4515" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M72,70.5 Q83,60 99,66.5 M111,66.5 Q127,59 139,69" fill="none" stroke="#fff4cf" stroke-width="1.3" stroke-linecap="round" opacity="0.9"/>
      <path d="${browTicks}" fill="none" stroke="#7a4515" stroke-width="0.5" stroke-linecap="round" opacity="0.8" transform="translate(0,-1.2)"/>
      <path d="M70,63 Q83,51 102,60 M108,60 Q128,51 141,63" fill="none" stroke="#7a4515" stroke-width="0.6" stroke-dasharray="1.6 1.4" opacity="0.6"/>
      <!-- engraved spiral + palmette on the cheek guards -->
      <path d="M60,100 q0,-7 7,-7 q6,0 6,6 q0,4 -4,4 q-3,0 -3,-3 q0,-2 2,-2" fill="none" stroke="#7a4515" stroke-width="1.1" stroke-linecap="round"/>
      <path d="M134,104 q0,-5 5,-6 q5,0 5,5 q0,3 -3,3 q-2.5,0 -2.5,-2.5" fill="none" stroke="#7a4515" stroke-width="1" stroke-linecap="round"/>
      <path d="M58,108 Q70,112 84,112" fill="none" stroke="#7a4515" stroke-width="0.9" stroke-dasharray="1.6 1.6"/>
      <path d="M60,113.6 Q66,117 76,117.6 M68,105 q3,-1 5,1 M52,101 q-1,4 0,8" fill="none" stroke="#7a4515" stroke-width="0.7" stroke-linecap="round"/>
      <path d="M126,114 L126,108.6 M126,114 L123,109.8 M126,114 L129,109.8 M126,114 L121.4,112 M126,114 L130.6,112 M122,115.6 q4,3 8,0" fill="none" stroke="#7a4515" stroke-width="0.8" stroke-linecap="round"/>
      <path d="M140,113 q4,0 5,-4 M124,120.6 Q135,121.6 144,116" fill="none" stroke="#7a4515" stroke-width="0.7" stroke-dasharray="1.4 1.4"/>
      <path d="M59.6,101.4 q0,-6 6.4,-6.4" fill="none" stroke="#fff4cf" stroke-width="0.5" opacity="0.9" transform="translate(0.6,0.7)"/>
      <!-- dome highlight -->
      <path d="M60,62 Q64,42 84,33" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.9"/>
      <path d="M56,74 Q56,68 58,64" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>
      <circle cx="58" cy="70" r="2" fill="#ffffff" opacity="0.85"/>
      <path d="M126,38 Q138,46 142,58" fill="none" stroke="#ffe7a8" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/>
      <path d="M122,98 L126,122" stroke="#ffe7a8" stroke-width="1.4" stroke-linecap="round" opacity="0.6"/>
      <!-- dents and scratches -->
      <ellipse cx="118" cy="50" rx="4.6" ry="2.6" fill="#8a4c16" opacity="0.22" transform="rotate(-30 118 50)"/>
      <path d="M114.6,50.6 q3,-3.6 7.4,-1.6" fill="none" stroke="#6b3a12" stroke-width="0.6" stroke-linecap="round" opacity="0.8"/>
      <path d="M115.6,52.8 q3.4,1.2 6.6,-1.8" fill="none" stroke="#fff6d0" stroke-width="0.6" stroke-linecap="round"/>
      <ellipse cx="72" cy="52" rx="2.6" ry="1.6" fill="#8a4c16" opacity="0.2"/>
      <path d="M92,44 l5,-2.6 M95,47 l4,-1.5 M130,64 l3,-3 M74,56 l3,1.4 M104,40 l2.6,-1.6" fill="none" stroke="#fff6d0" stroke-width="0.45" stroke-linecap="round" opacity="0.75"/>
      <path d="M132,84 l2,5 M134,86 l1.4,3" fill="none" stroke="#6b3a12" stroke-width="0.5" stroke-linecap="round" opacity="0.6"/>
    </g>
    <path d="${HELM}" fill="none" stroke="${OL}" stroke-width="3.4" stroke-linejoin="round"/>
    <!-- nose guard -->
    <path d="M100.5,74 L109.5,74 L108.8,99 Q105,104 101.2,99 Z" fill="url(#${id('bronzev')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M103,77 L103,98" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" opacity="0.9"/>
    <path d="M107.4,78 L107,98" stroke="#8e5621" stroke-width="1" stroke-linecap="round"/>
    <path d="M101.6,80 l1.2,0.3 M101.6,84 l1.2,0.3 M101.6,88 l1.2,0.3 M101.8,92 l1.2,0.3 M107.8,82 l-0.8,0.3 M107.8,90 l-0.8,0.3" stroke="#7a4515" stroke-width="0.5" stroke-linecap="round"/>
    <circle cx="105" cy="76.4" r="1" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="0.5"/>
    <circle cx="104.7" cy="76.1" r="0.3" fill="#fff"/>
    <!-- rivets along the lower rim -->
    <g fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="0.5">
      <circle cx="54" cy="112" r="1.1"/><circle cx="64" cy="118.5" r="1.1"/><circle cx="76" cy="120.5" r="1.1"/><circle cx="87" cy="120.5" r="1.1"/>
      <circle cx="123" cy="121" r="1.1"/><circle cx="134" cy="119.5" r="1.1"/><circle cx="144" cy="110" r="1.1"/><circle cx="145.5" cy="96" r="1.1"/>
    </g>
    <g fill="#ffffff"><circle cx="53.6" cy="111.6" r="0.35"/><circle cx="63.6" cy="118.1" r="0.35"/><circle cx="75.6" cy="120.1" r="0.35"/><circle cx="86.6" cy="120.1" r="0.35"/><circle cx="122.6" cy="120.6" r="0.35"/><circle cx="133.6" cy="119.1" r="0.35"/><circle cx="143.6" cy="109.6" r="0.35"/><circle cx="145.1" cy="95.6" r="0.35"/></g>
    <!-- crest holder ridge -->
    <path d="M56,52 C60,38 78,30.5 99,30.5 C120,30.5 138,38 144,50" fill="none" stroke="${OL}" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M56,52 C60,38 78,30.5 99,30.5 C120,30.5 138,38 144,50" fill="none" stroke="url(#${id('bronzev')})" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M56,52 C60,38 78,30.5 99,30.5 C120,30.5 138,38 144,50" fill="none" stroke="#7a4515" stroke-width="3.6" stroke-dasharray="0.5 3.2" opacity="0.7"/>
    <path d="M62,44 C70,36 82,32.5 96,32" fill="none" stroke="#ffffff" stroke-width="1" stroke-linecap="round" opacity="0.9"/>
    <path d="M64,34 C74,30 86,29 99,29" fill="none" stroke="none"/>
    <g fill="#7a4515"><circle cx="72" cy="36.5" r="0.8"/><circle cx="99" cy="30.6" r="0.8"/><circle cx="126" cy="35.5" r="0.8"/></g>
    <!-- crest-holder end knobs -->
    <g>
      <circle cx="56" cy="52.4" r="3.2" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="1.6"/>
      <circle cx="144" cy="50.4" r="3.2" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="1.6"/>
      <circle cx="55" cy="51.3" r="0.9" fill="#fff"/><circle cx="143" cy="49.3" r="0.9" fill="#fff"/>
      <circle cx="56.4" cy="52.8" r="1" fill="none" stroke="#7a4515" stroke-width="0.5"/><circle cx="144.4" cy="50.8" r="1" fill="none" stroke="#7a4515" stroke-width="0.5"/>
      <path d="M99,28.4 l0,-3.4" stroke="${OL}" stroke-width="0" />
      <rect x="96.6" y="28.3" width="4.8" height="5.4" rx="1.2" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="1.2"/>
      <path d="M97.6,30 h2.8 M97.6,32 h2.8" stroke="#7a4515" stroke-width="0.5"/>
      <circle cx="98" cy="29.2" r="0.4" fill="#fff"/>
    </g>`;
  }

  function head(id, withClasses) {
    var hc = withClasses ? ' class="part-head" style="transform-origin: 100px 120px"' : '';
    return `
    <g${hc}>
      ${crest(id, withClasses)}
      ${face(id, withClasses)}
      ${helmet(id)}
    </g>`;
  }

  function body(id) {
    return `
    <g class="part-body">
      ${backArm(id)}
      ${torso(id)}
      ${aspis(id)}
      ${weaponArm(id)}
      ${head(id, true)}
    </g>`;
  }

  function svg(uid) {
    var id = mk(uid);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240">
    ${defs(id)}
    <ellipse class="part-shadow" cx="97" cy="229" rx="58" ry="7.5" fill="#000" opacity="0.22"/>
    ${cloak(id)}
    ${leg(id, 0)}
    ${leg(id, 26)}
    ${body(id)}
  </svg>`;
  }

  function portrait(uid) {
    var id = mk('p' + (uid == null ? '' : uid));
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    ${defs(id)}
    <defs>
      <radialGradient id="${id('pbg')}" cx="0.5" cy="0.42" r="0.65">
        <stop offset="0" stop-color="#ffe2b0"/>
        <stop offset="1" stop-color="#b8732e"/>
      </radialGradient>
      <clipPath id="${id('pclip')}"><rect x="0" y="0" width="120" height="120" rx="14"/></clipPath>
    </defs>
    <g clip-path="url(#${id('pclip')})">
      <rect x="0" y="0" width="120" height="120" fill="url(#${id('pbg')})"/>
      <g fill="#ffffff" opacity="0.16">
        <path d="M60,56 L8,0 L28,0Z M60,56 L68,0 L88,0Z M60,56 L120,18 L120,38Z M60,56 L0,40 L0,60Z M60,56 L120,78 L120,98Z"/>
      </g>
      <!-- meander band -->
      <path d="M0,112 h6 v-5 h-3 v2 M10,112 h6 v-5 h-3 v2 M20,112 h6 v-5 h-3 v2 M30,112 h6 v-5 h-3 v2 M40,112 h6 v-5 h-3 v2 M50,112 h6 v-5 h-3 v2 M60,112 h6 v-5 h-3 v2 M70,112 h6 v-5 h-3 v2 M80,112 h6 v-5 h-3 v2 M90,112 h6 v-5 h-3 v2 M100,112 h6 v-5 h-3 v2 M110,112 h6 v-5 h-3 v2"
            fill="none" stroke="#7a4515" stroke-width="1.2" opacity="0.5"/>
      <g transform="translate(-1,5) scale(0.62)">
        <path d="M50,120 Q97,102 148,120 Q160,150 164,200 L34,200 Q38,150 50,120 Z" fill="url(#${id('cloak')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M50,120 Q97,102 148,120 Q160,150 164,200 L34,200 Q38,150 50,120 Z" fill="url(#${id('twill')})"/>
        <path d="M52,136 Q46,168 40,198 M146,136 Q156,168 160,198 M64,150 Q60,174 56,198 M134,150 Q140,174 144,198" fill="none" stroke="#5e0c16" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
        <path d="M58,140 Q52,168 48,192 M152,142 Q158,166 160,190" fill="none" stroke="#ff8d7e" stroke-width="1.2" stroke-linecap="round" opacity="0.4"/>
        <path d="M70,121 Q54,118 50,134 L48,170 L68,170 Z" fill="url(#${id('skinl')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M126,121 Q142,118 146,134 L148,170 L128,170 Z" fill="url(#${id('skinl')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M52,150 q2,-1 4,0 M60,140 q1,3 0,6 M130,150 q2,-1 4,0" fill="none" stroke="#c98458" stroke-width="1" stroke-linecap="round"/>
        <path d="M54,134 Q53,146 54,158 M140,128 Q144,136 144,146" fill="none" stroke="#fff0e0" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/>
        ${torso(id)}
        ${pin(id, 119, 121)}
        ${pin(id, 77, 121)}
        ${head(id, false)}
      </g>
    </g>
  </svg>`;
  }

  window.HEROES = window.HEROES || {};
  window.HEROES.spartan = {
    key: 'spartan',
    name: 'Kallias',
    title: 'The Spartan Hoplite',
    lore: 'Raised in the agoge to hold the line no matter the odds, Kallias answers every blow with his shield. Come back with it, or on it.',
    color: '#b8732e',
    base: { hp: 570, atk: 95, def: 26 },
    fx: { slash: '#ffb45a', glow: '#fff1d6' },
    signature: { name: 'Phalanx', desc: 'Reflect 30% of all damage you take back at the attacker.', type: 'thorns' },
    svg: svg,
    portrait: portrait
  };
})();

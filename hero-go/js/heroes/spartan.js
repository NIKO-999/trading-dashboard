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
      <clipPath id="${id('helmclip')}"><path d="${HELM}"/></clipPath>
      <clipPath id="${id('aspisclip')}"><ellipse cx="47" cy="160" rx="33" ry="37"/></clipPath>
      <clipPath id="${id('cuirclip')}">
        <path d="M66,122 Q98,108 130,122 Q134,146 131,168 Q98,178 65,168 Q62,146 66,122 Z"/>
      </clipPath>
    </defs>`;
  }

  /* ---------------- crimson cloak (behind) ---------------- */
  function cloak(id) {
    return `
    <g class="part-cape" style="transform-origin: 97px 120px">
      <!-- inner lining -->
      <path d="M72,116 C56,142 32,172 10,212 Q26,204 40,214 Q56,205 72,214 Q94,203 116,209 Q128,207 134,201 L122,120 Z"
            fill="url(#${id('cloakin')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
      <!-- outer cloak -->
      <path d="M74,114 C60,140 38,168 14,207 Q28,199 42,208 Q58,199 74,208 Q94,197 114,204 Q125,202 130,197 L122,118 Z"
            fill="url(#${id('cloak')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
      <!-- fold shading -->
      <path d="M80,124 C70,148 52,176 34,202 L44,206 C60,180 76,154 86,128 Z" fill="#6e0f1a" opacity="0.35"/>
      <path d="M98,130 C94,156 88,182 82,206 L90,204 C96,180 102,156 104,132 Z" fill="#6e0f1a" opacity="0.3"/>
      <path d="M78,126 C68,150 50,176 32,200" fill="none" stroke="#5e0c16" stroke-width="2.2" stroke-linecap="round" opacity="0.8"/>
      <path d="M94,130 C90,154 82,180 74,204" fill="none" stroke="#5e0c16" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
      <path d="M110,132 C110,158 108,182 106,202" fill="none" stroke="#5e0c16" stroke-width="1.8" stroke-linecap="round" opacity="0.6"/>
      <path d="M84,126 C76,148 62,172 50,198" fill="none" stroke="#ff7a6e" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>
      <path d="M102,132 C100,156 96,180 92,200" fill="none" stroke="#ff7a6e" stroke-width="1.4" stroke-linecap="round" opacity="0.5"/>
      <path d="M72,122 C62,142 46,166 28,194" fill="none" stroke="#ff9a8a" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
      <!-- dark border band at hem -->
      <path d="M16,204 Q29,196 42,205 Q58,196 74,205 Q94,194 114,201 Q124,199 129,194" fill="none" stroke="#5a0d16" stroke-width="5" stroke-linecap="round"/>
      <path d="M16,204 Q29,196 42,205 Q58,196 74,205 Q94,194 114,201 Q124,199 129,194" fill="none" stroke="#e9b25c" stroke-width="0.9" stroke-dasharray="3 2" opacity="0.9"/>
      <!-- trailing edge highlight -->
      <path d="M74,116 C60,140 38,168 16,203" fill="none" stroke="#ff8d7e" stroke-width="1.4" stroke-linecap="round" opacity="0.7"/>
    </g>`;
  }

  /* ---------------- legs: greaves + sandals ---------------- */
  function leg(id, dx) {
    return `
    <g transform="translate(${dx},0)">
      <!-- thigh -->
      <path d="M75,182 L92,182 L92,196 L75,196 Z" fill="url(#${id('skinl')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      <!-- sandal laces around the ankle (under greave edge) -->
      <path d="M76,211 L90,217 M90,211 L76,217" stroke="${OL}" stroke-width="2.6" stroke-linecap="round"/>
      <!-- foot -->
      <path d="M74,213 L90,213 Q98,215 103,220 Q106,224 103,226 L73,226 Q71,219 74,213 Z"
            fill="url(#${id('skinl')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M98.5,222 Q99.5,224.5 98.5,226 M101.5,221.5 Q102.8,223.5 102,225.5" fill="none" stroke="#b9764a" stroke-width="0.9" stroke-linecap="round"/>
      <!-- sole -->
      <path d="M70,225 L104,225 Q108,226 106.5,229 L71,229.5 Q68.5,227.5 70,225 Z" fill="url(#${id('leatherd')})" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M73,227 L104,227" stroke="#b98150" stroke-width="0.7" stroke-dasharray="1.4 1.2"/>
      <!-- sandal straps -->
      <g stroke-linecap="round" fill="none">
        <path d="M78,215 L94,225 M92,215 L80,225 M95,217.5 L99,225.5 M74,214.5 Q84,217 91,214.5" stroke="${OL}" stroke-width="3.2"/>
        <path d="M78,215 L94,225 M92,215 L80,225 M95,217.5 L99,225.5 M74,214.5 Q84,217 91,214.5" stroke="url(#${id('leather')})" stroke-width="1.8"/>
        <path d="M79,215.8 L85,219.6 M93,218.5 L95,222" stroke="#e0ad7a" stroke-width="0.6"/>
      </g>
      <circle cx="86" cy="220" r="1.5" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="0.6"/>
      <!-- greave -->
      <path d="M73.5,190 Q83,184 93.5,190 L93,200 Q92.5,208 90.5,214 Q83,216.5 76.5,214 Q74,206 73.5,198 Z"
            fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="2.8" stroke-linejoin="round"/>
      <!-- knee boss -->
      <path d="M76.5,195 Q83,189 90,195 Q89.5,202 83,203 Q77,202 76.5,195 Z" fill="url(#${id('bronzev')})" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M80,194.5 Q83,192 86.5,194.5 M80.5,198.5 q2.5,2 5.5,0" fill="none" stroke="#8e5621" stroke-width="0.9" stroke-linecap="round"/>
      <path d="M79,194 Q81,191.6 83,191.4" fill="none" stroke="#ffffff" stroke-width="1.1" stroke-linecap="round" opacity="0.9"/>
      <!-- calf muscle engraving + shine -->
      <path d="M88.5,204 Q91,208 88.5,213" fill="none" stroke="#8e5621" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M77.5,204 L78.5,212" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.85"/>
      <path d="M75,213 Q83,215.5 91,213" fill="none" stroke="#fff0c4" stroke-width="0.8" opacity="0.8"/>
      <circle cx="75.5" cy="206" r="0.8" fill="#8e5621"/>
      <circle cx="91.6" cy="206" r="0.8" fill="#8e5621"/>
    </g>`;
  }

  /* ---------------- torso: chiton, pteruges, muscle cuirass ---------------- */
  function pteruges(id) {
    var back = '', front = '';
    var i, x, sp;
    for (i = 0; i < 8; i++) {
      x = 67 + i * 7.6; sp = (i - 3.5) * 0.9;
      back += `<path d="M${f(x + 3.5)},168 L${f(x + 10.5)},168 L${f(x + 10.5 + sp)},191 Q${f(x + 7 + sp)},194.5 ${f(x + 3.5 + sp)},191 Z" fill="url(#${id('leatherd')})" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>`;
    }
    for (i = 0; i < 8; i++) {
      x = 66 + i * 8.2; sp = (i - 3.5) * 1.1;
      var fill = i % 2 ? `url(#${id('leather')})` : '#f1e0bd';
      var edge = i % 2 ? '#e0ad7a' : '#c9a770';
      front += `
      <path d="M${f(x)},166 L${f(x + 7.4)},166 L${f(x + 7.4 + sp)},186 Q${f(x + 3.7 + sp)},189.5 ${f(x + sp)},186 Z" fill="${fill}" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M${f(x + 1.6)},169 L${f(x + 1.6 + sp)},184 M${f(x + 5.8)},169 L${f(x + 5.8 + sp)},184" stroke="${edge}" stroke-width="0.6" stroke-dasharray="1.3 1.1"/>
      <path d="M${f(x + 0.4 + sp)},183 L${f(x + 7 + sp)},183" stroke="#b3212b" stroke-width="1.6"/>
      <circle cx="${f(x + 3.7 + sp * 0.8)}" cy="179" r="1.1" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="0.5"/>`;
    }
    return back + front;
  }

  function torso(id) {
    return `
    <!-- crimson chiton skirt -->
    <path d="M68,166 L128,166 L130.5,193 Q98,198 65.5,193 Z" fill="url(#${id('chiton')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M75,182 Q74,188 72,193 M88,184 L87,195 M108,184 L109,195 M121,182 Q122,188 124,193" fill="none" stroke="#5e0c16" stroke-width="1.2" opacity="0.8"/>
    ${pteruges(id)}
    <!-- muscle cuirass -->
    <path d="M66,122 Q98,108 130,122 Q134,146 131,168 Q98,178 65,168 Q62,146 66,122 Z" fill="url(#${id('cuir')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
    <g clip-path="url(#${id('cuirclip')})">
      <!-- form shadow on the far side -->
      <path d="M116,112 Q136,140 128,178 L140,178 L140,112 Z" fill="#6b3a12" opacity="0.28"/>
      <path d="M60,160 Q98,172 136,158 L136,180 L60,180 Z" fill="#6b3a12" opacity="0.18"/>
      <!-- pecs -->
      <path d="M72,137 Q84,147 97,139" fill="none" stroke="#7a4515" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M99,139 Q112,147 126,135" fill="none" stroke="#7a4515" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M73,138.6 Q84,148.6 97,140.6 M99,140.6 Q112,148.6 125.6,136.8" fill="none" stroke="#ffe7a8" stroke-width="0.8" stroke-linecap="round" opacity="0.8"/>
      <!-- nipples -->
      <circle cx="84" cy="138" r="1.2" fill="#9a5b22"/><circle cx="113" cy="138" r="1.2" fill="#9a5b22"/>
      <!-- sternum + linea alba -->
      <path d="M98,124 L98,138 M98,142 L98,166" stroke="#7a4515" stroke-width="1.3" stroke-linecap="round"/>
      <!-- abs -->
      <path d="M86,150 Q92,152.5 97,150 M99,150 Q105,152.5 111,150 M87,158 Q92,160.5 97,158 M99,158 Q105,160.5 110,158" fill="none" stroke="#7a4515" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M86.5,151.2 Q92,153.7 96.5,151.2 M87.5,159.2 Q92,161.7 96.5,159.2" fill="none" stroke="#ffe7a8" stroke-width="0.7" opacity="0.8"/>
      <circle cx="98" cy="166.5" r="1.1" fill="#7a4515"/>
      <!-- serratus / flank -->
      <path d="M72,148 Q76,156 74,166 M125,146 Q121,156 123,166" fill="none" stroke="#7a4515" stroke-width="1.1" stroke-linecap="round" opacity="0.8"/>
      <path d="M121,150 l3,-1.5 M121,155 l3,-1.5" stroke="#7a4515" stroke-width="0.9" stroke-linecap="round" opacity="0.7"/>
      <!-- polished highlight -->
      <path d="M71,130 Q75,123 88,120" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
      <ellipse cx="80" cy="133" rx="5" ry="2.4" fill="#ffffff" opacity="0.55" transform="rotate(-18 80 133)"/>
      <path d="M69,142 Q68,152 70,160" fill="none" stroke="#fff5d4" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>
    </g>
    <!-- lower rim band with meander -->
    <path d="M65,163 Q98,173 131,163 L131,169 Q98,179 65,169 Z" fill="url(#${id('bronzev')})" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M68,166.8 l0,-2 l3,0 l0,2.6 M74,167.8 l0,-2 l3,0 l0,2.4 M80,168.8 l0,-2 l3,0 l0,2.4 M86,169.5 l0,-2 l3,0 l0,2.2 M92,170 l0,-2 l3,0 l0,2 M101,170 l0,-2 l3,0 l0,2 M107,169.5 l0,-2 l3,0 l0,2.2 M113,168.8 l0,-2 l3,0 l0,2.4 M119,167.8 l0,-2 l3,0 l0,2.4 M125,166.8 l0,-2 l3,0 l0,2.6"
          fill="none" stroke="#7a4515" stroke-width="0.8"/>
    <!-- neck rim -->
    <path d="M78,117 Q98,110 118,117" fill="none" stroke="#7a4515" stroke-width="1.2"/>`;
  }

  /* ---------------- off arm + aspis ---------------- */
  function backArm(id) {
    return `
    <!-- upper off arm, going behind the shield -->
    <path d="M64,124 Q72,118 80,124 L82,146 L66,150 Q61,138 64,124 Z" fill="url(#${id('skinl')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M67,132 Q66,140 68,146" fill="none" stroke="#fff0e0" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/>`;
  }

  function aspis(id) {
    var rivets = '';
    for (var i = 0; i < 16; i++) {
      var a = i / 16 * Math.PI * 2;
      rivets += `<circle cx="${f(47 + Math.cos(a) * 30.2)}" cy="${f(160 + Math.sin(a) * 34.2)}" r="1.1"/>`;
    }
    return `
    <!-- shield edge (thickness / inner rim) -->
    <ellipse cx="52.5" cy="160" rx="33" ry="37" fill="#7a4418" stroke="${OL}" stroke-width="3.2"/>
    <path d="M78,132 Q90,160 78,188" fill="none" stroke="#5a3010" stroke-width="2" opacity="0.8"/>
    <!-- porpax arm-strap and antilabe cord seen on the edge -->
    <path d="M77,150 Q86,149 86.5,153 Q86,158 77,158 Z" fill="url(#${id('leather')})" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M79,151.5 L85,151.5" stroke="#e0ad7a" stroke-width="0.6" stroke-dasharray="1.2 1"/>
    <path d="M78,172 Q88,176 84,184" fill="none" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>
    <path d="M78,172 Q88,176 84,184" fill="none" stroke="#c99a5e" stroke-width="1.5" stroke-linecap="round"/>
    <!-- face -->
    <ellipse cx="47" cy="160" rx="33" ry="37" fill="url(#${id('aspis')})" stroke="${OL}" stroke-width="3.2"/>
    <g clip-path="url(#${id('aspisclip')})">
      <!-- dished field shading -->
      <ellipse cx="50" cy="164" rx="26" ry="30" fill="#8a531e" opacity="0.18"/>
      <!-- lambda -->
      <path d="M31,186 L44.5,134 L50.5,134 L64,186 L55.5,186 L47.5,152 L39.5,186 Z"
            fill="url(#${id('lambda')})" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M45,137 L34,183" stroke="#ff8a78" stroke-width="1.2" stroke-linecap="round" opacity="0.9"/>
      <path d="M50,138 L61,183" stroke="#6b0d15" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
      <!-- glossy highlight -->
      <path d="M22,150 Q26,134 40,127" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" opacity="0.85"/>
      <circle cx="21.5" cy="157" r="1.6" fill="#ffffff" opacity="0.8"/>
      <!-- battle scratches -->
      <path d="M62,142 l5,-3 M60,146 l4,-1.5 M29,176 l3,3" stroke="#fff3cf" stroke-width="0.8" stroke-linecap="round" opacity="0.8"/>
      <path d="M68,172 l-3,4" stroke="#6b3a12" stroke-width="0.8" stroke-linecap="round" opacity="0.7"/>
    </g>
    <!-- rolled rim (itys) with rope pattern -->
    <ellipse cx="47" cy="160" rx="30.2" ry="34.2" fill="none" stroke="url(#${id('bronzev')})" stroke-width="5.4"/>
    <ellipse cx="47" cy="160" rx="30.2" ry="34.2" fill="none" stroke="#7a4515" stroke-width="1.6" stroke-dasharray="2.2 2.2" opacity="0.8"/>
    <ellipse cx="47" cy="160" rx="27.2" ry="31.2" fill="none" stroke="${OL}" stroke-width="1.2"/>
    <ellipse cx="47" cy="160" rx="33" ry="37" fill="none" stroke="${OL}" stroke-width="3.2"/>
    <g fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="0.55">${rivets}</g>
    <path d="M24,136 Q34,125.5 47,124.5" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.9"/>`;
  }

  /* ---------------- dory spear + weapon arm ---------------- */
  function spear(id) {
    return `
    <g transform="translate(150,150) rotate(20)">
      <!-- ash shaft -->
      <rect x="-2.8" y="-76" width="5.6" height="140" rx="2" fill="url(#${id('shaft')})" stroke="${OL}" stroke-width="2.4"/>
      <path d="M-0.6,-70 L-0.6,58" stroke="#fff4dc" stroke-width="0.8" opacity="0.8"/>
      <path d="M1.4,-40 q0.6,3 0,6 M1.2,20 q0.6,3 0,6 M-1.5,-12 q-0.5,2 0,4" fill="none" stroke="#7a522b" stroke-width="0.6"/>
      <!-- grip binding -->
      <path d="M-3,-14 L3,-12 M-3,-10 L3,-8 M-3,12 L3,14 M-3,16 L3,18" stroke="#5e3719" stroke-width="1.3"/>
      <!-- sauroter (butt spike) -->
      <path d="M-3.8,60 L3.8,60 L3.4,70 L0.6,82 L-0.6,82 L-3.4,70 Z" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M-3.8,63 L3.8,63" stroke="${OL}" stroke-width="1.4"/>
      <path d="M0,65 L0,80" stroke="#7a4515" stroke-width="0.9"/>
      <path d="M-2,66 L-0.8,78" stroke="#ffffff" stroke-width="0.9" stroke-linecap="round" opacity="0.9"/>
      <!-- blade socket -->
      <path d="M-3.6,-74 L3.6,-74 L2.9,-84 L-2.9,-84 Z" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M-3.4,-77.5 L3.4,-77.5 M-3.1,-80.5 L3.1,-80.5" stroke="#7a4515" stroke-width="0.9"/>
      <!-- leaf blade -->
      <path d="M0,-83 C9,-88 10,-100 0,-118 C-10,-100 -9,-88 0,-83 Z" fill="url(#${id('blade')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M0,-85 L0,-114" stroke="#6f8098" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M0.8,-86 L0.8,-112" stroke="#eef4fb" stroke-width="0.6" stroke-linecap="round"/>
      <path d="M-4,-90 Q-6,-99 -1.4,-111" fill="none" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round"/>
      <!-- tip sparkle -->
      <g transform="translate(-2,-112)">
        <circle r="5" fill="url(#${id('glint')})" opacity="0.9"/>
        <path d="M0,-6 L1,-1 L6,0 L1,1 L0,6 L-1,1 L-6,0 L-1,-1 Z" fill="#ffffff"/>
      </g>
    </g>`;
  }

  function weaponArm(id) {
    return `
    <g class="part-weapon" style="transform-origin: 124px 126px">
      <!-- upper arm -->
      <path d="M114,124 Q124,114 134,122 L141,142 Q137,150 129,149 L120,134 Z" fill="url(#${id('skinl')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M121,125 Q128,122 131,127" fill="none" stroke="#fff0e0" stroke-width="1.3" stroke-linecap="round" opacity="0.8"/>
      <path d="M128,135 Q132,140 131,145" fill="none" stroke="#c98458" stroke-width="1" stroke-linecap="round"/>
      <!-- forearm -->
      <path d="M129,142 Q136,138 146,143 L148,157 Q139,159 133,155 Q127,150 129,142 Z" fill="url(#${id('skinl')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      <!-- leather bracer -->
      <path d="M137,141 L146,143.5 L147.5,156.5 L138,156.5 Z" fill="url(#${id('leather')})" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M139,144 L145,149 M145,144.5 L139.5,149.5 M139.5,150 L146,154.5 M146,150 L140,155" stroke="#3d220d" stroke-width="0.8"/>
      <path d="M138.5,143 L145.5,145" stroke="#e0ad7a" stroke-width="0.7"/>
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
      </g>
      <!-- cloak pin (fibula) on the shoulder -->
      <circle cx="119" cy="121" r="4.2" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="1.8"/>
      <circle cx="119" cy="121" r="1.8" fill="none" stroke="#7a4515" stroke-width="0.8"/>
      <circle cx="118" cy="119.8" r="0.9" fill="#ffffff"/>
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
    var ks = [0.96, 0.91, 0.86, 0.8, 0.74, 0.67, 0.6, 0.52];
    for (var k = 0; k < ks.length; k++) {
      var p = crestPoints(ks[k], 6);
      var s = `M${f(p[0][0])},${f(p[0][1])}`;
      for (var j = 1; j < p.length; j++) s += ` L${f(p[j][0])},${f(p[j][1])}`;
      if (k % 2) lights += s + ' '; else strands += s + ' ';
    }
    // tuft ticks at the edge
    var ticks = '';
    for (var t = 2; t < outer.length - 1; t += 2) {
      var q = outer[t];
      var ux = q[0] - c[0], uy = q[1] - c[1], M = Math.sqrt(ux * ux + uy * uy);
      ticks += `M${f(q[0] - ux / M * 7)},${f(q[1] - uy / M * 7)} L${f(q[0] - ux / M * 1)},${f(q[1] - uy / M * 1)} `;
    }
    return `
      <g${cc}>
        <path d="${d}" fill="url(#${id('crest')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
        <path d="${strands}" fill="none" stroke="#8c1119" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>
        <path d="${lights}" fill="none" stroke="#ff9a7e" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round" opacity="0.75"/>
        <path d="${ticks}" fill="none" stroke="#a0161f" stroke-width="1" stroke-linecap="round" opacity="0.8"/>
        <path d="M37,66 q-2,4 -4,6 M40,67 q0,4 -1,7 M43,64 q2,3 2,6" fill="none" stroke="${OL}" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M128,14 Q108,6 84,9 M70,14 Q58,19 50,30" fill="none" stroke="#ffd2c0" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>
      </g>`;
  }

  function eye(cx, cy, id) {
    return `
      <g>
        <ellipse cx="${cx}" cy="${cy}" rx="5.2" ry="6.2" fill="${OL}"/>
        <ellipse cx="${cx + 0.6}" cy="${cy + 1.2}" rx="3.9" ry="4.6" fill="url(#${id('iris')})"/>
        <circle cx="${cx + 0.8}" cy="${cy + 1}" r="1.8" fill="${OL}"/>
        <circle cx="${cx - 1.6}" cy="${cy - 2.5}" r="2.1" fill="#ffffff"/>
        <circle cx="${cx + 2.3}" cy="${cy + 3.1}" r="0.95" fill="#ffffff"/>
      </g>`;
  }

  function face(id, withClasses) {
    var ec = withClasses ? ' class="part-eyes" style="transform-origin: 105px 85px"' : '';
    return `
    <!-- skin behind the helmet openings -->
    <path d="M66,70 L144,70 L144,98 L122,126 L88,126 L66,98 Z" fill="url(#${id('skin')})"/>
    <!-- shadow cast by the helmet brow -->
    <path d="M66,70 L144,70 L144,80 Q124,74 105,82 Q86,74 66,80 Z" fill="#6b3a12" opacity="0.28"/>
    <!-- short dark beard -->
    <path d="M84,97 Q92,104 97,102 Q105,99 113,102 Q118,104 126,97 L129,121 Q126,132 115,135 Q105,139 95,135 Q84,132 81,121 Z"
          fill="url(#${id('beard')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M92,120 q1,5 3,9 M98,124 q0,5 1,9 M105,125 q0,5 0,10 M112,124 q0,5 -1,9 M118,120 q-1,5 -3,9 M88,112 q1,4 2,7 M122,112 q-1,4 -2,7"
          fill="none" stroke="#1a0f08" stroke-width="1.1" stroke-linecap="round" opacity="0.8"/>
    <path d="M95,121 q1,4 2,7 M101,124 q0,4 1,7 M109,124 q0,4 -1,7 M115,121 q-1,4 -2,7"
          fill="none" stroke="#8a5c3a" stroke-width="0.9" stroke-linecap="round" opacity="0.8"/>
    <!-- nose tip below the nasal -->
    <path d="M102,101 Q105,106 108.5,101" fill="#eaa77a" stroke="${OL}" stroke-width="1.4" stroke-linejoin="round"/>
    <!-- moustache -->
    <path d="M93,106 Q99,101.5 105,104 Q111,101.5 117,106 Q113,108.5 109,107.5 Q105,106.5 101,107.5 Q97,108.5 93,106 Z"
          fill="#3a2314" stroke="${OL}" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M96,105 Q100,103.4 103.5,104.6 M106.5,104.6 Q110,103.4 114,105" fill="none" stroke="#8a5c3a" stroke-width="0.7" stroke-linecap="round"/>
    <!-- determined mouth -->
    <path d="M99,111 Q105,114.5 111,110.5 Q105,112.2 99,111 Z" fill="#7a2222" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M100.5,111.3 L109.5,111.1" stroke="#ffffff" stroke-width="0.9" stroke-linecap="round"/>
    <!-- eyes -->
    <g${ec}>
      ${eye(87, 86, id)}
      ${eye(123, 86, id)}
    </g>
    <!-- fierce brows -->
    <path d="M77,76.5 Q86,76 96.5,80.5 L95.5,83 Q86,79.5 78,80 Z" fill="#3a2314" stroke="${OL}" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M113.5,80.5 Q124,76 133,76.5 L132,80 Q124,79.5 114.5,83 Z" fill="#3a2314" stroke="${OL}" stroke-width="1.3" stroke-linejoin="round"/>`;
  }

  function helmet(id) {
    return `
    <!-- bronze Corinthian helmet -->
    <path d="${HELM}" fill="url(#${id('helm')})" stroke="none"/>
    <g clip-path="url(#${id('helmclip')})">
      <!-- side shadow -->
      <path d="M136,40 Q154,70 150,126 L126,126 Q146,96 136,40 Z" fill="#6b3a12" opacity="0.35"/>
      <path d="M40,100 Q70,112 100,126 L40,126 Z" fill="#6b3a12" opacity="0.22"/>
      <!-- raised rim bands along every edge -->
      <path d="${HELM}" fill="none" stroke="#9c6226" stroke-width="7"/>
      <path d="${HELM}" fill="none" stroke="#f7d58a" stroke-width="2.2" opacity="0.8" transform="translate(0.8,0.8)"/>
      <path d="${OPEN}" fill="none" stroke="#9c6226" stroke-width="7"/>
      <path d="${OPEN}" fill="none" stroke="#6b3a12" stroke-width="1" transform="translate(0,1)"/>
      <!-- embossed brows over the eyes -->
      <path d="M70,73 Q82,61 102,70" fill="none" stroke="#7a4515" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M108,70 Q128,61 141,73" fill="none" stroke="#7a4515" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M72,70.5 Q83,60 99,66.5 M111,66.5 Q127,59 139,69" fill="none" stroke="#fff4cf" stroke-width="1.3" stroke-linecap="round" opacity="0.9"/>
      <!-- engraved spiral on the cheek guards -->
      <path d="M60,100 q0,-7 7,-7 q6,0 6,6 q0,4 -4,4 q-3,0 -3,-3 q0,-2 2,-2" fill="none" stroke="#7a4515" stroke-width="1.1" stroke-linecap="round"/>
      <path d="M134,104 q0,-5 5,-6 q5,0 5,5 q0,3 -3,3 q-2.5,0 -2.5,-2.5" fill="none" stroke="#7a4515" stroke-width="1" stroke-linecap="round"/>
      <path d="M58,108 Q70,112 84,112" fill="none" stroke="#7a4515" stroke-width="0.9" stroke-dasharray="1.6 1.6"/>
      <!-- dome highlight -->
      <path d="M60,62 Q64,42 84,33" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.9"/>
      <circle cx="58" cy="70" r="2" fill="#ffffff" opacity="0.85"/>
      <path d="M126,38 Q138,46 142,58" fill="none" stroke="#ffe7a8" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/>
      <path d="M122,98 L126,122" stroke="#ffe7a8" stroke-width="1.4" stroke-linecap="round" opacity="0.6"/>
    </g>
    <path d="${HELM}" fill="none" stroke="${OL}" stroke-width="3.4" stroke-linejoin="round"/>
    <!-- nose guard -->
    <path d="M100.5,74 L109.5,74 L108.8,99 Q105,104 101.2,99 Z" fill="url(#${id('bronzev')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M103,77 L103,98" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" opacity="0.9"/>
    <path d="M107.4,78 L107,98" stroke="#8e5621" stroke-width="1" stroke-linecap="round"/>
    <!-- rivets along the lower rim -->
    <g fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="0.5">
      <circle cx="54" cy="112" r="1.1"/><circle cx="64" cy="118.5" r="1.1"/><circle cx="76" cy="120.5" r="1.1"/><circle cx="87" cy="120.5" r="1.1"/>
      <circle cx="123" cy="121" r="1.1"/><circle cx="134" cy="119.5" r="1.1"/><circle cx="144" cy="110" r="1.1"/><circle cx="145.5" cy="96" r="1.1"/>
    </g>
    <!-- crest holder ridge -->
    <path d="M56,52 C60,38 78,30.5 99,30.5 C120,30.5 138,38 144,50" fill="none" stroke="${OL}" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M56,52 C60,38 78,30.5 99,30.5 C120,30.5 138,38 144,50" fill="none" stroke="url(#${id('bronzev')})" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M62,44 C70,36 82,32.5 96,32" fill="none" stroke="#ffffff" stroke-width="1" stroke-linecap="round" opacity="0.9"/>
    <g fill="#7a4515"><circle cx="72" cy="36.5" r="0.8"/><circle cx="99" cy="30.6" r="0.8"/><circle cx="126" cy="35.5" r="0.8"/></g>`;
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
        <path d="M64,124 Q72,118 80,124 L82,146 L64,150 Q56,136 64,124 Z" fill="url(#${id('skinl')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M114,124 Q124,114 134,122 L141,142 Q137,150 129,149 L120,134 Z" fill="url(#${id('skinl')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
        ${torso(id)}
        <circle cx="119" cy="121" r="4.2" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="1.8"/>
        <circle cx="75" cy="121" r="4.2" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="1.8"/>
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

/* Hero Go! — Brenna, The Celtic Warrior (key: celtic)
 * Hand-authored inline SVG. See ART_CONTRACT.md.
 * Iron Age (La Tène) inspired: gold twisted torc, woad body-paint spirals,
 * check-woven wool cloak with penannular brooch, bracae, long oval shield with
 * bronze spine/boss and red-enamel roundels, anthropomorphic-hilted iron sword.
 */
(function () {
  var OL = '#2b1d14';
  var WOAD = '#2f5fc4';

  function mk(uid) {
    uid = uid == null ? '' : String(uid);
    return function (n) { return 'celtic-' + n + '-' + uid; };
  }

  /* ---------------- small helpers ---------------- */
  function f(n) { return (Math.round(n * 100) / 100).toString(); }

  // Archimedean spiral as a path string (centre cx,cy; outer radius r; turns; start angle)
  function spiralD(cx, cy, r, turns, a0, dir) {
    dir = dir || 1;
    var steps = Math.round(turns * 18), d = '';
    for (var i = 0; i <= steps; i++) {
      var t = i / steps, a = a0 + dir * t * turns * Math.PI * 2, rr = 0.12 * r + t * 0.88 * r;
      d += (i ? ' L' : 'M') + f(cx + Math.cos(a) * rr) + ',' + f(cy + Math.sin(a) * rr);
    }
    return d;
  }

  // three hooked arms whirling from a centre point
  function triskeleD(cx, cy, r, rot) {
    var d = '';
    for (var k = 0; k < 3; k++) {
      var a = (rot + k * 120) * Math.PI / 180;
      var c = Math.cos(a), s = Math.sin(a);
      var P = function (x, y) { return f(cx + x * c - y * s) + ',' + f(cy + x * s + y * c); };
      d += 'M' + P(0, 0) + ' Q' + P(r * 0.55, -r * 0.55) + ' ' + P(r, -r * 0.05) +
           ' Q' + P(r * 1.05, r * 0.55) + ' ' + P(r * 0.55, r * 0.5) +
           ' Q' + P(r * 0.3, r * 0.4) + ' ' + P(r * 0.45, r * 0.18) + ' ';
    }
    return d;
  }

  function woad(d, w, op) {
    return `<path d="${d}" fill="none" stroke="${WOAD}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op == null ? 0.9 : op}"/>`;
  }

  function enamel(x, y, r) {
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#d42a2a" stroke="${OL}" stroke-width="0.6"/>` +
           `<circle cx="${f(x - r * 0.35)}" cy="${f(y - r * 0.35)}" r="${f(r * 0.38)}" fill="#ffc2b8"/>`;
  }

  /* ---------------- defs ---------------- */
  function defs(id) {
    return `
    <defs>
      <radialGradient id="${id('skin')}" cx="0.45" cy="0.4" r="0.7">
        <stop offset="0" stop-color="#ffe9d6"/>
        <stop offset="0.75" stop-color="#ffd7b8"/>
        <stop offset="1" stop-color="#f0b48e"/>
      </radialGradient>
      <linearGradient id="${id('skinl')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffe0c6"/>
        <stop offset="1" stop-color="#eeb08a"/>
      </linearGradient>
      <linearGradient id="${id('hair')}" x1="0.2" y1="0" x2="0.6" y2="1">
        <stop offset="0" stop-color="#f28a45"/>
        <stop offset="0.5" stop-color="#d4582a"/>
        <stop offset="1" stop-color="#a33b1a"/>
      </linearGradient>
      <linearGradient id="${id('hairs')}" x1="1" y1="0" x2="0" y2="0.4">
        <stop offset="0" stop-color="#e06a33"/>
        <stop offset="0.6" stop-color="#c24a22"/>
        <stop offset="1" stop-color="#8f3116"/>
      </linearGradient>
      <linearGradient id="${id('gold')}" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0" stop-color="#fff4b8"/>
        <stop offset="0.45" stop-color="#f2c048"/>
        <stop offset="1" stop-color="#a8741e"/>
      </linearGradient>
      <linearGradient id="${id('bronze')}" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stop-color="#ffe3a3"/>
        <stop offset="0.45" stop-color="#d49a45"/>
        <stop offset="1" stop-color="#87531b"/>
      </linearGradient>
      <radialGradient id="${id('bronzer')}" cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stop-color="#fff6d8"/>
        <stop offset="0.35" stop-color="#e8b862"/>
        <stop offset="1" stop-color="#8a561c"/>
      </radialGradient>
      <linearGradient id="${id('linen')}" x1="0" y1="0" x2="0.35" y2="1">
        <stop offset="0" stop-color="#fbf4e2"/>
        <stop offset="0.55" stop-color="#eadcb9"/>
        <stop offset="1" stop-color="#cbb68c"/>
      </linearGradient>
      <linearGradient id="${id('leather')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#9a6234"/>
        <stop offset="1" stop-color="#5a3418"/>
      </linearGradient>
      <linearGradient id="${id('blade')}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset="0.45" stop-color="#dfe7ef"/>
        <stop offset="0.55" stop-color="#9eabb9"/>
        <stop offset="1" stop-color="#6f7c8b"/>
      </linearGradient>
      <radialGradient id="${id('shield')}" cx="0.36" cy="0.3" r="0.85">
        <stop offset="0" stop-color="#7cc451"/>
        <stop offset="0.55" stop-color="#4c9a2a"/>
        <stop offset="1" stop-color="#2c6218"/>
      </radialGradient>
      <radialGradient id="${id('iris')}" cx="0.45" cy="0.65" r="0.6">
        <stop offset="0" stop-color="#d4ffb0"/>
        <stop offset="0.55" stop-color="#5cb33a"/>
        <stop offset="1" stop-color="#23601a"/>
      </radialGradient>
      <radialGradient id="${id('glint')}" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#ffffff" stop-opacity="1"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="${id('bead')}" cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stop-color="#e6f6ff"/>
        <stop offset="0.45" stop-color="#3b8ee0"/>
        <stop offset="1" stop-color="#173f86"/>
      </radialGradient>
      <!-- green & brown check wool -->
      <pattern id="${id('tartan')}" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-10)">
        <rect width="12" height="12" fill="#3f8a2a"/>
        <rect x="0" y="4" width="12" height="4" fill="#6a4524" opacity="0.72"/>
        <rect x="4" y="0" width="4" height="12" fill="#6a4524" opacity="0.72"/>
        <rect x="4" y="4" width="4" height="4" fill="#3e2612" opacity="0.55"/>
        <path d="M0,1.5 H12 M1.5,0 V12" stroke="#1f4a14" stroke-width="0.9"/>
        <path d="M0,10 H12 M10,0 V12" stroke="#e7cf6a" stroke-width="0.55" opacity="0.9"/>
      </pattern>
      <!-- red & ochre check for the bracae -->
      <pattern id="${id('check')}" width="7" height="7" patternUnits="userSpaceOnUse">
        <rect width="7" height="7" fill="#a8412a"/>
        <rect x="0" y="3" width="7" height="2" fill="#6e2416" opacity="0.7"/>
        <rect x="3" y="0" width="2" height="7" fill="#6e2416" opacity="0.7"/>
        <path d="M0,0.8 H7 M0.8,0 V7" stroke="#e2b04a" stroke-width="0.6"/>
      </pattern>
      <!-- tablet-woven border -->
      <pattern id="${id('weave')}" width="6" height="5" patternUnits="userSpaceOnUse">
        <rect width="6" height="5" fill="#2f5fc4"/>
        <path d="M0,2.5 L1.5,0 L3,2.5 L1.5,5 Z M3,2.5 L4.5,0 L6,2.5 L4.5,5 Z" fill="#f2c14e"/>
        <path d="M1.5,1.4 L2.2,2.5 L1.5,3.6 L0.8,2.5 Z M4.5,1.4 L5.2,2.5 L4.5,3.6 L3.8,2.5 Z" fill="#c0392b"/>
      </pattern>
      <clipPath id="${id('shieldclip')}">
        <ellipse cx="42" cy="166" rx="21" ry="45"/>
      </clipPath>
      <clipPath id="${id('tunicclip')}">
        <path d="M68,120 Q98,112 128,120 L133,190 Q98,198 62,190 Z"/>
      </clipPath>
      <clipPath id="${id('drapeclip')}">
        <path d="M60,118 Q84,110 106,114 L125,121 Q118,138 98,150 Q80,160 60,162 Z"/>
      </clipPath>
    </defs>`;
  }

  /* ---------------- cloak (behind, sways) ---------------- */
  function cloak(id) {
    var fringe = '';
    var hem = [[12,198],[20,202],[28,205],[36,207],[44,208],[52,208],[60,208],[68,207],[76,206],[84,205],[92,204],[100,203],[108,202],[116,200],[124,198]];
    for (var i = 0; i < hem.length; i++) {
      var h = hem[i];
      fringe += `M${h[0]},${h[1]} l${i % 2 ? -1 : -1.6},${i % 3 ? 6 : 7.5} `;
    }
    return `
    <g class="part-cape" style="transform-origin: 104px 120px">
      <!-- wind-flung cloak body -->
      <path d="M126,118 Q104,112 70,118 C52,124 30,122 8,112 Q18,132 14,150 Q8,170 10,198 Q30,210 66,208 Q100,205 126,198 L132,150 Z"
            fill="url(#${id('tartan')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
      <!-- cel shading & folds -->
      <path d="M8,112 Q18,132 14,150 Q8,170 10,198 Q22,204 34,206 Q28,176 34,150 Q38,132 30,120 Q18,118 8,112 Z" fill="#12240b" opacity="0.32"/>
      <path d="M58,124 Q46,160 52,206 M84,122 Q76,160 84,204 M40,124 Q30,150 36,204" fill="none" stroke="#12240b" stroke-width="2.4" stroke-linecap="round" opacity="0.4"/>
      <path d="M66,124 Q56,160 62,204 M92,124 Q88,160 94,202" fill="none" stroke="#bfe39a" stroke-width="1.4" stroke-linecap="round" opacity="0.45"/>
      <!-- rolled top edge flapping in the wind -->
      <path d="M70,118 C52,124 30,122 8,112 Q24,122 36,124 Q54,128 72,122 Z" fill="#2c5e1d" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>
      <!-- woven selvedge along hem -->
      <path d="M11,195 Q30,205 66,204 Q100,201 127,194" fill="none" stroke="url(#${id('weave')})" stroke-width="4.5"/>
      <path d="M10,198 Q30,208 66,207 Q100,204 126,198" fill="none" stroke="${OL}" stroke-width="1"/>
      <path d="M11,192.7 Q30,202.7 66,201.7 Q100,198.7 127,191.7" fill="none" stroke="${OL}" stroke-width="0.9"/>
      <!-- tasselled fringe -->
      <path d="${fringe}" fill="none" stroke="#6a4524" stroke-width="1.8" stroke-linecap="round"/>
      <path d="${fringe}" fill="none" stroke="#c8a15a" stroke-width="0.7" stroke-linecap="round"/>
    </g>`;
  }

  /* ---------------- legs ---------------- */
  function leg(id, dx) {
    return `
    <g transform="translate(${dx},0)">
      <!-- checked wool bracae -->
      <path d="M72,186 L95,186 L94,213 L74,213 Q71,200 72,186 Z" fill="url(#${id('check')})" stroke="${OL}" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M88,188 Q92,200 91,212 L94,212 L95,188 Z" fill="#3a0f08" opacity="0.3"/>
      <path d="M77,190 Q76,200 78,210" fill="none" stroke="#ffd9a0" stroke-width="1.1" opacity="0.5" stroke-linecap="round"/>
      <path d="M82,196 q2,3 1,7 M86,190 q-1,4 1,8" fill="none" stroke="#3a0f08" stroke-width="0.9" opacity="0.6"/>
      <!-- ankle binding -->
      <path d="M73.5,208 Q84,211 94.5,208 L94.5,213 Q84,216 73.5,213 Z" fill="#d9c49a" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M76,209.5 L78,213.5 M80,210 L82,214 M84,210.3 L86,214.3 M88,210 L90,214 M92,209.5 L93.5,213" stroke="#8c7550" stroke-width="0.7"/>
      <!-- wrapped leather shoe (carbatina) -->
      <path d="M72,213 L93,213 Q101,214 106,219.5 Q109,229 101,229 L72,229 Q68,221 72,213 Z"
            fill="url(#${id('leather')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M74,215.5 Q86,214.5 97,217" fill="none" stroke="#c98c55" stroke-width="1.2" stroke-linecap="round"/>
      <!-- lace loops & criss-cross laces -->
      <g fill="#3d220d"><circle cx="78" cy="221" r="0.9"/><circle cx="84" cy="221.5" r="0.9"/><circle cx="90" cy="221" r="0.9"/><circle cx="96" cy="220.5" r="0.9"/>
        <circle cx="81" cy="216" r="0.8"/><circle cx="87" cy="216" r="0.8"/><circle cx="93" cy="216.4" r="0.8"/></g>
      <path d="M78,221 L81,216 L84,221.5 L87,216 L90,221 L93,216.4 L96,220.5" fill="none" stroke="#f0d9a8" stroke-width="1.1" stroke-linejoin="round"/>
      <!-- tie with dangling ends -->
      <path d="M79,214 q-3,-2 -5,1 q3,1 5,-1 q1,-3 -1,-5" fill="none" stroke="#f0d9a8" stroke-width="1" stroke-linecap="round"/>
      <path d="M78,215 l-2,5 M79,215 l1,5" stroke="#f0d9a8" stroke-width="0.9" stroke-linecap="round"/>
      <path d="M72,226.5 L104,226.5" stroke="#2b1a0e" stroke-width="1.2" opacity="0.5"/>
      <path d="M99,218 Q104,221 104.5,225" fill="none" stroke="#3d220d" stroke-width="0.8" stroke-dasharray="1.2 1.2"/>
    </g>`;
  }

  /* ---------------- torso ---------------- */
  function buckle(id) {
    // La Tène belt plate: curvilinear S-scroll with red enamel dots
    return `
    <g>
      <path d="M86,162 Q98,158 110,162 L110,175 Q98,179 86,175 Z" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M88.5,164 Q98,161 107.5,164 L107.5,173.5 Q98,176.5 88.5,173.5 Z" fill="none" stroke="#6b3f12" stroke-width="0.7"/>
      <!-- S-scroll with trumpet voids -->
      <path d="M91,172 Q90,165 95,165 Q99,165 98,169 Q97,172 101,172 Q106,172 105,165" fill="none" stroke="#6b3f12" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M91,172 Q90,165 95,165 Q99,165 98,169 Q97,172 101,172 Q106,172 105,165" fill="none" stroke="#ffe8b0" stroke-width="0.5" stroke-linecap="round"/>
      <circle cx="95" cy="167.6" r="1.2" fill="#6b3f12"/><circle cx="101.2" cy="169.6" r="1.2" fill="#6b3f12"/>
      ${enamel(89.4, 165.2, 1.25)}${enamel(106.8, 172.6, 1.25)}
      <path d="M88,163.2 Q94,160.8 99,161" fill="none" stroke="#fff5d6" stroke-width="1" stroke-linecap="round"/>
      <!-- tongue / hook -->
      <path d="M110,165 L114,166 Q116,168.5 114,171 L110,172" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="1.4" stroke-linejoin="round"/>
    </g>`;
  }

  function brooch(id, cx, cy, s) {
    return `
    <g transform="translate(${cx},${cy}) scale(${s})">
      <!-- pin (behind ring on the far side, over it on the near side) -->
      <path d="M-9,8 L8,-9" stroke="${OL}" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M-9,8 L8,-9" stroke="url(#${id('gold')})" stroke-width="1.8" stroke-linecap="round"/>
      <!-- penannular ring -->
      <path d="M-3.2,6.4 A7,7 0 1,1 3.2,6.4" fill="none" stroke="${OL}" stroke-width="5.4" stroke-linecap="round"/>
      <path d="M-3.2,6.4 A7,7 0 1,1 3.2,6.4" fill="none" stroke="url(#${id('gold')})" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M-5.6,-2.5 A6,6 0 0,1 1,-6" fill="none" stroke="#fff6cf" stroke-width="0.9" stroke-linecap="round"/>
      <!-- ring twist marks -->
      <path d="M-7,1 l1.6,0.8 M-6,-3.6 l1.6,1 M-2.8,-6.6 l1,1.6 M1.6,-6.8 l-0.2,1.8 M5.4,-4.4 l-1.2,1.3 M7,0 l-1.8,0.2 M5.6,3.8 l-1.4,-1" stroke="#8a5e18" stroke-width="0.6"/>
      <!-- decorated terminals -->
      <circle cx="-3.6" cy="6.6" r="2.3" fill="url(#${id('gold')})" stroke="${OL}" stroke-width="1"/>
      <circle cx="3.6" cy="6.6" r="2.3" fill="url(#${id('gold')})" stroke="${OL}" stroke-width="1"/>
      ${enamel(-3.6, 6.6, 1)}${enamel(3.6, 6.6, 1)}
      <!-- pin head -->
      <circle cx="8" cy="-9" r="1.6" fill="url(#${id('gold')})" stroke="${OL}" stroke-width="0.8"/>
    </g>`;
  }

  function torso(id) {
    return `
    <!-- neck -->
    <path d="M95,110 L113,110 L114,126 L94,126 Z" fill="url(#${id('skinl')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M95,116 Q104,120 113,116 L113,112 L95,112 Z" fill="#c9805e" opacity="0.45"/>
    <!-- linen tunic -->
    <path d="M68,120 Q98,112 128,120 L133,190 Q98,198 62,190 Z" fill="url(#${id('linen')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
    <g clip-path="url(#${id('tunicclip')})">
      <path d="M118,118 Q130,150 126,196 L140,196 L140,110 Z" fill="#8a6a3a" opacity="0.28"/>
      <path d="M76,176 Q74,184 74,194 M90,178 Q89,186 90,196 M110,178 Q112,186 113,196 M122,176 Q124,184 126,194" fill="none" stroke="#b39a6c" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M83,178 Q82,186 83,195 M100,179 Q100,187 101,196" fill="none" stroke="#ffffff" stroke-width="1.1" stroke-linecap="round" opacity="0.8"/>
      <!-- woven hem border -->
      <path d="M60,184 Q98,192 136,184 L136,196 L60,196 Z" fill="url(#${id('weave')})"/>
      <path d="M60,184 Q98,192 136,184" fill="none" stroke="${OL}" stroke-width="1.3"/>
      <path d="M60,185.3 Q98,193.3 136,185.3" fill="none" stroke="#f2c14e" stroke-width="0.6"/>
    </g>
    <!-- neckline border -->
    <path d="M92,119 Q104,134 116,119" fill="none" stroke="${OL}" stroke-width="5.6" stroke-linecap="round"/>
    <path d="M92,119 Q104,134 116,119" fill="none" stroke="url(#${id('weave')})" stroke-width="3.6" stroke-linecap="round"/>
    <!-- belt -->
    <path d="M63,160 Q98,167 133,160 L133,170 Q98,177 63,170 Z" fill="url(#${id('leather')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M65,163 Q98,170 131,163" fill="none" stroke="#c98c55" stroke-width="0.7" stroke-dasharray="1.6 1.4"/>
    <path d="M65,168 Q98,175 131,168" fill="none" stroke="#3d220d" stroke-width="0.6" stroke-dasharray="1.6 1.4" opacity="0.7"/>
    <!-- bronze belt rings -->
    <g fill="none" stroke="${OL}" stroke-width="2.4"><circle cx="122" cy="167" r="2.4"/><circle cx="76" cy="167.5" r="2.4"/></g>
    <g fill="none" stroke="url(#${id('bronze')})" stroke-width="1.2"><circle cx="122" cy="167" r="2.4"/><circle cx="76" cy="167.5" r="2.4"/></g>
    <!-- belt end hanging -->
    <path d="M114,171 Q116,178 114,184 L118,184 Q120,178 118,171 Z" fill="url(#${id('leather')})" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M113.5,182 L118.5,182 L117.5,188 Q116,190 114.5,188 Z" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="1.3" stroke-linejoin="round"/>
    ${buckle(id)}
    <!-- cloak drape wrapping over the off shoulder, pinned at the sword shoulder -->
    <path d="M60,118 Q84,110 106,114 L125,121 Q118,138 98,150 Q80,160 60,162 Z" fill="url(#${id('tartan')})" stroke="${OL}" stroke-width="2.8" stroke-linejoin="round"/>
    <g clip-path="url(#${id('drapeclip')})">
      <path d="M125,121 Q118,138 98,150 Q80,160 60,162 L60,152 Q80,150 96,142 Q112,132 122,120 Z" fill="#12240b" opacity="0.35"/>
      <path d="M72,122 Q86,130 92,146 M86,118 Q100,126 104,140 M100,116 Q110,122 114,132" fill="none" stroke="#12240b" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
      <path d="M66,122 Q80,120 96,116" fill="none" stroke="#dff5c0" stroke-width="1.6" stroke-linecap="round" opacity="0.55"/>
    </g>
    <path d="M62,159 Q80,157 97,148 Q114,137 123,122" fill="none" stroke="url(#${id('weave')})" stroke-width="3"/>
    <path d="M60.5,161.5 Q80,159.5 98,150 Q116,139 125,121.5" fill="none" stroke="${OL}" stroke-width="1"/>`;
  }

  /* ---------------- torc ---------------- */
  function torc(id) {
    return `
    <g>
      <path d="M86,114 Q86,130 100,131.5 M122,114 Q122,130 108,131.5" fill="none" stroke="${OL}" stroke-width="7" stroke-linecap="round"/>
      <path d="M86,114 Q86,130 100,131.5 M122,114 Q122,130 108,131.5" fill="none" stroke="url(#${id('gold')})" stroke-width="4.4" stroke-linecap="round"/>
      <!-- twisted strands -->
      <path d="M86,114 Q86,130 100,131.5 M122,114 Q122,130 108,131.5" fill="none" stroke="#9b6a1c" stroke-width="4.4" stroke-dasharray="0.9 1.9"/>
      <path d="M86.6,115 Q87,127 97,130" fill="none" stroke="#fff6cf" stroke-width="0.9" stroke-linecap="round"/>
      <!-- buffer terminals with spiral chasing -->
      <circle cx="100" cy="131.5" r="4.2" fill="url(#${id('gold')})" stroke="${OL}" stroke-width="1.8"/>
      <circle cx="108.5" cy="131.5" r="4.2" fill="url(#${id('gold')})" stroke="${OL}" stroke-width="1.8"/>
      <path d="${spiralD(100, 131.5, 2.8, 1.6, 0, 1)}" fill="none" stroke="#8a5e18" stroke-width="0.6"/>
      <path d="${spiralD(108.5, 131.5, 2.8, 1.6, Math.PI, -1)}" fill="none" stroke="#8a5e18" stroke-width="0.6"/>
      <circle cx="98.6" cy="130" r="0.9" fill="#ffffff"/><circle cx="107.1" cy="130" r="0.9" fill="#ffffff"/>
    </g>`;
  }

  /* ---------------- long oval shield (Battersea-inspired) ---------------- */
  function roundel(id, cx, cy, r) {
    return `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id('bronzer')})" stroke="${OL}" stroke-width="1.8"/>
      <circle cx="${cx}" cy="${cy}" r="${f(r - 1.8)}" fill="none" stroke="#8a561c" stroke-width="0.7"/>
      <path d="${triskeleD(cx, cy, r * 0.62, -90)}" fill="none" stroke="#7a4814" stroke-width="1.2" stroke-linecap="round"/>
      ${enamel(cx, cy - r * 0.78, 1.1)}${enamel(f(cx + r * 0.68), f(cy + r * 0.4), 1.1)}${enamel(f(cx - r * 0.68), f(cy + r * 0.4), 1.1)}
      <circle cx="${cx}" cy="${cy}" r="1.3" fill="#d42a2a" stroke="${OL}" stroke-width="0.5"/>`;
  }

  function shield(id) {
    var rivets = '';
    for (var k = 0; k < 22; k++) {
      var a = k / 22 * Math.PI * 2;
      rivets += `<circle cx="${f(42 + Math.cos(a) * 18.8)}" cy="${f(166 + Math.sin(a) * 42.8)}" r="0.6" fill="#fff0c8" stroke="#6b3f12" stroke-width="0.3"/>`;
    }
    return `
    <g>
      <ellipse cx="42" cy="166" rx="21" ry="45" fill="url(#${id('shield')})"/>
      <g clip-path="url(#${id('shieldclip')})">
        <!-- La Tène tendrils in low relief -->
        <path d="M28,128 Q22,146 34,150 Q40,151 38,146 M56,128 Q62,146 50,150 Q44,151 46,146 M28,204 Q22,186 34,182 Q40,181 38,186 M56,204 Q62,186 50,182 Q44,181 46,186"
              fill="none" stroke="#244f12" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M28,128 Q22,146 34,150 Q40,151 38,146 M56,128 Q62,146 50,150 Q44,151 46,146 M28,204 Q22,186 34,182 Q40,181 38,186 M56,204 Q62,186 50,182 Q44,181 46,186"
              fill="none" stroke="#a8e07c" stroke-width="0.7" stroke-linecap="round" opacity="0.8"/>
        <path d="${spiralD(31, 166, 5, 1.5, 0, 1)}" fill="none" stroke="#244f12" stroke-width="1.3" stroke-linecap="round"/>
        <path d="${spiralD(53, 166, 5, 1.5, Math.PI, 1)}" fill="none" stroke="#244f12" stroke-width="1.3" stroke-linecap="round"/>
        <!-- cel shade + gloss -->
        <path d="M50,122 Q66,160 50,212 L70,212 L70,120 Z" fill="#0e2a06" opacity="0.3"/>
        <path d="M27,140 Q28,128 36,123" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" opacity="0.55"/>
      </g>
      <!-- bronze spine -->
      <path d="M40,122 L44,122 L44.6,210 L39.4,210 Z" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M41,124 L41,208" stroke="#fff3cf" stroke-width="0.7"/>
      <!-- upper / lower roundels -->
      ${roundel(id, 42, 139, 7.4)}
      ${roundel(id, 42, 193, 7.4)}
      <!-- spindle boss -->
      <path d="M42,149 Q52,158 52,166 Q52,174 42,183 Q32,174 32,166 Q32,158 42,149 Z" fill="url(#${id('bronzer')})" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M42,152.5 Q49,159 49,166 Q49,173 42,179.5 Q35,173 35,166 Q35,159 42,152.5 Z" fill="none" stroke="#8a561c" stroke-width="0.7"/>
      <circle cx="42" cy="166" r="5" fill="url(#${id('bronzer')})" stroke="${OL}" stroke-width="1.6"/>
      <circle cx="42" cy="166" r="2.2" fill="#d42a2a" stroke="${OL}" stroke-width="0.6"/>
      <circle cx="41.2" cy="165.2" r="0.8" fill="#ffc2b8"/>
      ${enamel(42, 155.5, 1.1)}${enamel(42, 176.5, 1.1)}${enamel(36.5, 166, 0.9)}${enamel(47.5, 166, 0.9)}
      <circle cx="39.5" cy="163.5" r="1.2" fill="#ffffff" opacity="0.9"/>
      <path d="M36,158 Q39,153 42,151.5" fill="none" stroke="#ffffff" stroke-width="1" stroke-linecap="round" opacity="0.8"/>
      ${rivets}
      <!-- bronze binding rim -->
      <ellipse cx="42" cy="166" rx="20.2" ry="44.2" fill="none" stroke="url(#${id('bronze')})" stroke-width="3"/>
      <ellipse cx="42" cy="166" rx="22" ry="46" fill="none" stroke="${OL}" stroke-width="3"/>
      <ellipse cx="42" cy="166" rx="18.4" ry="42.4" fill="none" stroke="${OL}" stroke-width="0.8" opacity="0.7"/>
    </g>`;
  }

  /* ---------------- sword + weapon arm ---------------- */
  function sword(id) {
    return `
    <g transform="translate(154,150) rotate(18)">
      <!-- long iron blade -->
      <path d="M-4.8,-13 L4.8,-13 L4.4,-88 Q3.4,-96 0,-100 Q-3.4,-96 -4.4,-88 Z" fill="url(#${id('blade')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      <!-- fuller -->
      <path d="M0,-17 L0,-84" stroke="#7a8898" stroke-width="2" stroke-linecap="round"/>
      <path d="M0.8,-17 L0.8,-84" stroke="#eef4fb" stroke-width="0.6" stroke-linecap="round"/>
      <!-- edge shine -->
      <path d="M-3,-20 L-2.8,-86" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M-2,-90 L-0.5,-95.5" stroke="#ffffff" stroke-width="1" stroke-linecap="round"/>
      <!-- forge pattern marks -->
      <path d="M2.8,-30 q-1,2 0,4 M2.8,-50 q-1,2 0,4 M2.8,-70 q-1,2 0,4" fill="none" stroke="#6f7c8b" stroke-width="0.6"/>
      <!-- bell-shaped guard -->
      <path d="M-7.6,-9 Q-7,-15 0,-16 Q7,-15 7.6,-9 Z" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M-4.8,-12 Q0,-14.4 4.8,-12" fill="none" stroke="#fff3cf" stroke-width="0.8" stroke-linecap="round"/>
      <!-- grip -->
      <rect x="-3.2" y="-9" width="6.4" height="21" rx="2" fill="url(#${id('leather')})" stroke="${OL}" stroke-width="2"/>
      <path d="M-3,-5 L3,-3 M-3,0 L3,2 M-3,5 L3,7" stroke="#3d220d" stroke-width="0.9"/>
      <!-- anthropomorphic pommel: little figure with raised, curling arms -->
      <path d="M-5,12 L5,12 L4,15 L-4,15 Z" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M-3,14 Q-10,14 -10,20 Q-10,24 -7,24" fill="none" stroke="${OL}" stroke-width="3.6" stroke-linecap="round"/>
      <path d="M3,14 Q10,14 10,20 Q10,24 7,24" fill="none" stroke="${OL}" stroke-width="3.6" stroke-linecap="round"/>
      <path d="M-3,14 Q-10,14 -10,20 Q-10,24 -7,24" fill="none" stroke="url(#${id('bronze')})" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M3,14 Q10,14 10,20 Q10,24 7,24" fill="none" stroke="url(#${id('bronze')})" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="-6.6" cy="23.6" r="2" fill="url(#${id('bronzer')})" stroke="${OL}" stroke-width="1"/>
      <circle cx="6.6" cy="23.6" r="2" fill="url(#${id('bronzer')})" stroke="${OL}" stroke-width="1"/>
      <circle cx="0" cy="19.5" r="4" fill="url(#${id('bronzer')})" stroke="${OL}" stroke-width="1.5"/>
      <circle cx="-1.3" cy="19.4" r="0.55" fill="${OL}"/><circle cx="1.3" cy="19.4" r="0.55" fill="${OL}"/>
      <path d="M-1,21.2 Q0,21.9 1,21.2" fill="none" stroke="${OL}" stroke-width="0.5" stroke-linecap="round"/>
      <!-- tip sparkle -->
      <g transform="translate(-2,-92)">
        <circle r="5" fill="url(#${id('glint')})" opacity="0.9"/>
        <path d="M0,-5.5 L1,-1 L5.5,0 L1,1 L0,5.5 L-1,1 L-5.5,0 L-1,-1 Z" fill="#ffffff"/>
      </g>
    </g>`;
  }

  function weaponArm(id) {
    return `
    <g class="part-weapon" style="transform-origin: 124px 126px">
      ${sword(id)}
      <!-- linen sleeve -->
      <path d="M114,124 L130,119 L142,139 L130,150 Z" fill="url(#${id('linen')})" stroke="${OL}" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M124,131 L134,146" stroke="#b39a6c" stroke-width="1.4" opacity="0.8"/>
      <path d="M119,127 L126,124" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.8"/>
      <!-- woven cuff -->
      <path d="M128,145 L140,137 L143.5,141.5 L131.5,150.5 Z" fill="url(#${id('weave')})" stroke="${OL}" stroke-width="1.5" stroke-linejoin="round"/>
      <!-- bare forearm with woad spirals -->
      <path d="M136,142 L149,141 L151,157 L137,158 Q133,150 136,142 Z" fill="url(#${id('skinl')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      ${woad(spiralD(141.5, 150, 3.4, 1.7, 0, 1), 1.1)}
      ${woad('M137,145 Q141,143 145,144.5 M137.5,155.5 Q141,157 145,155.5', 1, 0.85)}
      <g fill="${WOAD}" opacity="0.9"><circle cx="146.2" cy="149" r="0.7"/><circle cx="146.4" cy="152" r="0.7"/></g>
      <!-- bronze bracelet -->
      <rect x="146.4" y="140.8" width="3.6" height="16.8" rx="1.6" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="1.4"/>
      <path d="M146.7,143.2 l3,1.3 M146.7,146.4 l3,1.3 M146.7,149.6 l3,1.3 M146.7,152.8 l3,1.3" stroke="#8a561c" stroke-width="0.6"/>
      <path d="M147.4,142.4 L147.4,146" stroke="#fff5d6" stroke-width="0.8" stroke-linecap="round"/>
      <!-- fist around grip -->
      <path d="M148,142 Q156,138 161,143 Q163,150 159,157 Q152,160 148,156 Z" fill="url(#${id('skin')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M152,141.5 q3,2 3,5 M156,142 q3,2 3,5 M151,148 q3,1.5 3.5,4.5 M155.5,148.5 q3,1.5 3.5,4.5" fill="none" stroke="#c9775a" stroke-width="1"/>
      <path d="M147,147 Q152,144 157,149" fill="none" stroke="${OL}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M151,140.8 Q154,139.8 157,141" fill="none" stroke="#fff1e2" stroke-width="1" stroke-linecap="round"/>
    </g>`;
  }

  function backArm(id) {
    return `
    <!-- off arm (holds the shield grip behind the boss) -->
    <path d="M64,122 Q54,132 55,152 L67,152 Q66,138 72,128 Z" fill="url(#${id('linen')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>`;
  }

  /* ---------------- head ---------------- */
  function braid(x, y, n, dx, dy) {
    var s = '';
    for (var i = 0; i < n; i++) {
      var cx = x + dx * i, cy = y + dy * i;
      s += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="3.3" ry="2.8" fill="#d4582a" stroke="${OL}" stroke-width="1.3"/>`;
      s += `<path d="M${f(cx - 2.3)},${f(cy - 0.8)} Q${f(cx)},${f(cy + 1.4)} ${f(cx + 2.3)},${f(cy - 0.8)}" fill="none" stroke="#8f3116" stroke-width="0.8"/>`;
      s += `<path d="M${f(cx - 1.6)},${f(cy - 1.6)} Q${f(cx - 0.4)},${f(cy - 2.2)} ${f(cx + 0.6)},${f(cy - 1.8)}" fill="none" stroke="#ffb07a" stroke-width="0.6" stroke-linecap="round"/>`;
    }
    return s;
  }

  function bead(id, x, y, kind) {
    var g = kind === 'g' ? id('gold') : id('bead');
    return `<rect x="${f(x - 3)}" y="${f(y - 2.5)}" width="6" height="5" rx="2" fill="url(#${g})" stroke="${OL}" stroke-width="1.1"/>
      <path d="M${f(x - 2)},${f(y - 1.2)} L${f(x + 1)},${f(y - 1.2)}" stroke="#ffffff" stroke-width="0.7" stroke-linecap="round"/>
      ${kind === 'g' ? `<path d="M${f(x - 3)},${f(y + 0.3)} L${f(x + 3)},${f(y + 0.3)}" stroke="#8a5e18" stroke-width="0.5"/>` : `<circle cx="${f(x + 1.2)}" cy="${f(y + 0.8)}" r="0.7" fill="#f2f7ff"/>`}`;
  }

  function tuft(x, y) {
    return `<path d="M${x - 2.5},${y} Q${x - 4},${y + 5} ${x - 6},${y + 7} M${x},${y} Q${x - 0.5},${y + 5} ${x - 1.5},${y + 8} M${x + 2.5},${y} Q${x + 3},${y + 4} ${x + 2},${y + 7}" fill="none" stroke="#c24a22" stroke-width="1.8" stroke-linecap="round"/>`;
  }

  function hairStreamers(id, withClasses) {
    var cc = withClasses ? ' class="part-cape" style="transform-origin: 70px 66px"' : '';
    return `
    <g${cc}>
      <!-- wind-swept locks trailing behind -->
      <path d="M72,40 C58,28 40,30 22,22 C30,34 40,40 50,44 C38,46 26,50 10,50 C24,62 44,62 58,58 C44,64 32,72 14,76 C30,86 50,80 62,72 C50,82 42,92 30,100 C46,104 60,94 68,84 Z"
            fill="url(#${id('hairs')})" stroke="${OL}" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M62,44 C50,40 40,38 30,32 M56,54 C44,56 32,56 20,54 M60,66 C48,70 38,74 26,78 M64,78 C56,86 48,92 38,98"
            fill="none" stroke="#8f3116" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M64,48 C54,46 46,44 38,40 M60,60 C50,62 40,64 30,64 M64,72 C56,76 48,80 40,84"
            fill="none" stroke="#ffab6e" stroke-width="1.1" stroke-linecap="round" opacity="0.8"/>
      <!-- long braid flying back, with beads -->
      <path d="M64,90 Q56,98 50,108" fill="none" stroke="${OL}" stroke-width="7" stroke-linecap="round"/>
      <path d="M64,90 Q56,98 50,108" fill="none" stroke="#c24a22" stroke-width="4.4" stroke-linecap="round"/>
      ${braid(50, 110, 4, -3.2, 3.2)}
      ${bead(id, 37.4, 123.5, 'b')}
      <path d="M35,126 Q31,130 26,131 M36.5,126.5 Q34,132 30,135 M38.5,126.5 Q38,132 35,136" fill="none" stroke="#c24a22" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M35,126 Q31,130 26,131 M36.5,126.5 Q34,132 30,135 M38.5,126.5 Q38,132 35,136" fill="none" stroke="${OL}" stroke-width="0.4" stroke-linecap="round" opacity="0.6"/>
    </g>`;
  }

  function backHair(id) {
    return `
    <path d="M66,120 C54,106 52,84 56,66 C60,42 80,24 104,24 C130,24 150,40 148,68 C148,84 146,98 141,110 L128,112 L80,122 Z"
          fill="url(#${id('hair')})" stroke="${OL}" stroke-width="3.2" stroke-linejoin="round"/>
    <path d="M140,104 Q146,90 145,70 M60,70 Q56,90 64,112" fill="none" stroke="#8f3116" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>
    <!-- wild tufts on the crown -->
    <path d="M84,30 Q74,16 60,14 Q72,24 76,34 Z" fill="url(#${id('hair')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M104,26 Q104,12 94,4 Q110,10 114,26 Z" fill="url(#${id('hair')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M124,30 Q132,20 144,20 Q136,28 134,38 Z" fill="url(#${id('hair')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M100,22 Q100,14 97,9 M80,28 Q74,20 68,18" fill="none" stroke="#ffab6e" stroke-width="1" stroke-linecap="round"/>
    <path d="M116,25 Q112,16 104,14 M130,30 Q126,22 118,20" fill="none" stroke="${OL}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M116,25 Q112,16 104,14 M130,30 Q126,22 118,20" fill="none" stroke="#e06a33" stroke-width="0.8" stroke-linecap="round"/>`;
  }

  function eye(cx, cy, id) {
    return `
      <g>
        <ellipse cx="${cx}" cy="${cy}" rx="5.4" ry="6.6" fill="${OL}"/>
        <ellipse cx="${cx + 0.5}" cy="${cy + 1.2}" rx="4" ry="5" fill="url(#${id('iris')})"/>
        <circle cx="${cx + 0.7}" cy="${cy + 1.1}" r="1.9" fill="${OL}"/>
        <circle cx="${cx - 1.7}" cy="${cy - 2.6}" r="2.2" fill="#ffffff"/>
        <circle cx="${cx + 2.2}" cy="${cy + 3.4}" r="1" fill="#ffffff"/>
        <!-- upper lash line with flick -->
        <path d="M${cx - 5.8},${cy - 3} Q${cx},${cy - 8.6} ${cx + 5.8},${cy - 3.6} L${cx + 7.8},${cy - 5.6}" fill="none" stroke="${OL}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </g>`;
  }

  function face(id, withClasses) {
    var ec = withClasses ? ' class="part-eyes" style="transform-origin: 106px 90px"' : '';
    var freckles = [[99,97],[101.5,99.5],[97,100],[111,97],[113.5,99.5],[115.5,97.2],[88,98],[124,98],[126.5,100]];
    var fr = '';
    for (var i = 0; i < freckles.length; i++) fr += `<circle cx="${freckles[i][0]}" cy="${freckles[i][1]}" r="0.75"/>`;
    return `
    <!-- ear with bronze ring -->
    <path d="M72,84 Q63,80 63,89 Q64,97 72,96" fill="url(#${id('skin')})" stroke="${OL}" stroke-width="2.2"/>
    <path d="M70,86 Q67,89 70,93" fill="none" stroke="#d98e6a" stroke-width="1"/>
    <circle cx="66.5" cy="98" r="2" fill="none" stroke="${OL}" stroke-width="2.2"/>
    <circle cx="66.5" cy="98" r="2" fill="none" stroke="url(#${id('gold')})" stroke-width="1.1"/>
    <!-- face -->
    <path d="M70,76 Q70,56 90,56 L118,56 Q138,56 138,76 L138,96 Q138,118 113,118 L96,118 Q70,118 70,96 Z" fill="url(#${id('skin')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M132,84 Q136,104 124,114 Q134,112 137,100 Z" fill="#e89a72" opacity="0.4"/>
    <!-- woad: triskele on the near cheek, spiral on the far cheek -->
    ${woad(triskeleD(127, 104, 4.4, -20), 1.25)}
    ${woad(spiralD(81, 103, 4.2, 1.8, -Math.PI / 2, -1), 1.25)}
    ${woad('M77,95 Q81,93.5 85,95', 1, 0.8)}
    <!-- blush + freckles -->
    <ellipse cx="86" cy="106" rx="4.2" ry="2.2" fill="#ff8a7a" opacity="0.45"/>
    <ellipse cx="122" cy="106.5" rx="4" ry="2.2" fill="#ff8a7a" opacity="0.45"/>
    <g fill="#b8612e" opacity="0.85">${fr}</g>
    <!-- eyes -->
    <g${ec}>
      ${eye(92, 89, id)}
      ${eye(119, 89, id)}
    </g>
    <!-- fierce brows -->
    <path d="M84,78.5 Q91,75 99,80 L98,82.4 Q91,78.6 84.6,81 Z" fill="#b8431c" stroke="${OL}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M111,80 Q119,75 127,78 L126.4,80.8 Q119.5,78.4 112,82.4 Z" fill="#b8431c" stroke="${OL}" stroke-width="1.4" stroke-linejoin="round"/>
    <!-- nose -->
    <path d="M106,96 Q108.5,100 105,101.2" fill="none" stroke="#c9775a" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="104.4" cy="98.4" r="0.9" fill="#ffffff" opacity="0.8"/>
    <!-- fierce grin -->
    <path d="M98,105.5 Q108,103.5 119,104.5 Q117,114.5 108,115 Q100,114 98,105.5 Z" fill="#7a2222" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M99.2,106.2 Q108,104.6 117.8,105.3 L117.2,107.6 Q108,107.2 99.8,108.3 Z" fill="#ffffff"/>
    <path d="M104,106 L104,107.8 M110,105.4 L110,107.4" stroke="#d8d0c8" stroke-width="0.5"/>
    <path d="M102.5,112.4 Q108,109.4 114,112" fill="#ff8f8f" stroke="none"/>
    <path d="M97,104.6 Q96.2,106 97.2,107 M119.8,103.6 Q121,104 121.2,105.6" fill="none" stroke="${OL}" stroke-width="1.2" stroke-linecap="round"/>`;
  }

  function fringe(id) {
    return `
    <!-- wind-tossed fringe -->
    <path d="M66,90 C58,76 57,58 62,48 C70,32 84,25 104,25 C130,25 149,41 146,80 L140,78 Q140,68 134,64 Q136,72 130,76 Q126,66 118,62 Q118,70 110,74 Q106,64 98,62 Q96,70 86,72 Q88,64 84,62 Q78,68 76,76 Q72,80 70,92 Z"
          fill="url(#${id('hair')})" stroke="${OL}" stroke-width="2.8" stroke-linejoin="round"/>
    <path d="M71,86 Q70,70 80,58 M90,58 Q98,46 116,44 M122,48 Q134,54 138,66" fill="none" stroke="#8f3116" stroke-width="1.3" stroke-linecap="round"/>
    <!-- glossy highlight band -->
    <path d="M80,50 Q94,40 110,40" fill="none" stroke="#ffc08c" stroke-width="3.2" stroke-linecap="round" opacity="0.9"/>
    <path d="M116,41 Q124,42 128,45" fill="none" stroke="#ffc08c" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
    <!-- front braid by the ear -->
    ${braid(71, 98, 6, -0.3, 4.4)}
    ${bead(id, 69.3, 125.2, 'g')}
    ${tuft(69.3, 127.5)}
    <path d="M69.5,127.5 l0,6" stroke="${OL}" stroke-width="0.4" opacity="0.5"/>
`;
  }

  function head(id, withClasses) {
    var hc = withClasses ? ' class="part-head" style="transform-origin: 104px 118px"' : '';
    return `
    <g${hc}>
      ${hairStreamers(id, withClasses)}
      ${backHair(id)}
      <!-- near-side lock behind the cheek -->
      <path d="M136,76 Q146,86 142,106 L136,104 Z" fill="url(#${id('hair')})" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
      ${face(id, withClasses)}
      ${fringe(id)}
    </g>`;
  }

  function body(id) {
    return `
    <g class="part-body">
      ${backArm(id)}
      ${torso(id)}
      ${torc(id)}
      ${brooch(id, 112, 141, 1.05)}
      ${shield(id)}
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
        <stop offset="0" stop-color="#d9f2c4"/>
        <stop offset="1" stop-color="#4c9a2a"/>
      </radialGradient>
      <clipPath id="${id('pclip')}"><rect x="0" y="0" width="120" height="120" rx="14"/></clipPath>
    </defs>
    <g clip-path="url(#${id('pclip')})">
      <rect x="0" y="0" width="120" height="120" fill="url(#${id('pbg')})"/>
      <circle cx="60" cy="54" r="44" fill="#ffffff" opacity="0.14"/>
      <!-- rolling hills and a standing stone -->
      <path d="M0,96 Q24,80 50,90 Q76,78 120,92 L120,120 L0,120 Z" fill="#2c6218" opacity="0.5"/>
      <path d="M96,86 L98,68 Q101,64 104,68 L106,88 Z" fill="#2c4a22" opacity="0.45"/>
      <path d="M8,80 L10,66 Q12,63 14,66 L15,82 Z" fill="#2c4a22" opacity="0.4"/>
      <g transform="translate(-8.6,3) scale(0.66)">
        <path d="M26,200 Q26,134 66,123 Q104,114 142,123 Q182,134 182,200 Z" fill="url(#${id('tartan')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M142,123 Q182,134 182,200 L158,200 Q160,150 138,128 Z" fill="#12240b" opacity="0.3"/>
        <path d="M60,130 Q46,150 44,196 M150,132 Q164,150 166,196" fill="none" stroke="#12240b" stroke-width="2.4" stroke-linecap="round" opacity="0.4"/>
        <path d="M84,119 Q104,160 124,119 Z" fill="url(#${id('linen')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M88,121 Q104,152 120,121" fill="none" stroke="url(#${id('weave')})" stroke-width="3.4"/>
        <path d="M94,110 L114,110 L115,126 L93,126 Z" fill="url(#${id('skinl')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
        ${brooch(id, 146, 146, 1.6)}
        ${torc(id)}
        ${head(id, false)}
      </g>
    </g>
  </svg>`;
  }

  window.HEROES = window.HEROES || {};
  window.HEROES.celtic = {
    key: 'celtic',
    name: 'Brenna',
    title: 'The Celtic Warrior',
    lore: 'Brenna paints the old spirals on her skin before every fight and sings her ancestors’ names into the wind. Each blow she lands only makes the song louder.',
    color: '#4c9a2a',
    base: { hp: 530, atk: 102, def: 20 },
    fx: { slash: '#6fd6ff', glow: '#e6f8ff' },
    signature: { name: 'Battle Cry', desc: 'Every hit fires you up: +5% ATK for the rest of the battle (stacks 10 times).', type: 'stack' },
    svg: svg,
    portrait: portrait
  };
})();

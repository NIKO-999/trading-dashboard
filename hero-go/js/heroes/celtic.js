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
        <path d="M0,6 H12 M6,0 V12" stroke="#2a1608" stroke-width="0.35" opacity="0.5"/>
        <path d="M0,3 H4 M8,3 H12 M0,9 H4 M8,9 H12" stroke="#0e2408" stroke-width="0.3" opacity="0.4"/>
        <path d="M2,2.6 H3.6 M8.4,8.6 H10 M2.4,8.2 H3.8 M9,3 H10.4" stroke="#f6e9a0" stroke-width="0.4" opacity="0.55"/>
      </pattern>
      <!-- fine twill hatch overlay for wool -->
      <pattern id="${id('twill')}" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
        <rect width="3" height="3" fill="none"/>
        <path d="M0,0.4 H3" stroke="#000" stroke-width="0.4" opacity="0.1"/>
        <path d="M0,1.9 H3" stroke="#fff" stroke-width="0.25" opacity="0.07"/>
      </pattern>
      <!-- linen weave overlay -->
      <pattern id="${id('linenw')}" width="2.6" height="2.6" patternUnits="userSpaceOnUse">
        <rect width="2.6" height="2.6" fill="none"/>
        <path d="M0,1.3 H1.3 M1.3,2.6 H2.6" stroke="#8a6a3a" stroke-width="0.35" opacity="0.13"/>
        <circle cx="0.4" cy="0.4" r="0.25" fill="#fff" opacity="0.35"/>
      </pattern>
      <!-- leather grain -->
      <pattern id="${id('grain')}" width="5" height="5" patternUnits="userSpaceOnUse">
        <rect width="5" height="5" fill="none"/>
        <circle cx="1" cy="1.2" r="0.35" fill="#2a1208" opacity="0.35"/>
        <circle cx="3.6" cy="2.4" r="0.3" fill="#2a1208" opacity="0.3"/>
        <circle cx="2" cy="4.1" r="0.3" fill="#e8b078" opacity="0.28"/>
        <path d="M3.2,4.4 q0.8,-0.5 1.4,-0.1" stroke="#2a1208" stroke-width="0.25" fill="none" opacity="0.3"/>
      </pattern>
      <!-- hammered metal -->
      <pattern id="${id('hammer')}" width="4.5" height="4.5" patternUnits="userSpaceOnUse">
        <rect width="4.5" height="4.5" fill="none"/>
        <circle cx="1.2" cy="1.2" r="0.7" fill="#5a3208" opacity="0.18"/>
        <circle cx="3.4" cy="3.2" r="0.6" fill="#5a3208" opacity="0.16"/>
        <path d="M0.6,0.8 q0.5,-0.5 1,-0.2 M2.8,2.7 q0.5,-0.5 1,-0.2" stroke="#fff6d8" stroke-width="0.3" fill="none" opacity="0.5"/>
      </pattern>
      <radialGradient id="${id('ao')}" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#1a0d05" stop-opacity="0.5"/>
        <stop offset="1" stop-color="#1a0d05" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="${id('iris2')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1f5a2c"/>
        <stop offset="0.45" stop-color="#3f9a3a"/>
        <stop offset="1" stop-color="#b8f07a"/>
      </linearGradient>
      <linearGradient id="${id('blade2')}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset="0.5" stop-color="#c9d5e2"/>
        <stop offset="0.5" stop-color="#8c9aab"/>
        <stop offset="1" stop-color="#5f6c7c"/>
      </linearGradient>
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
    var fuzz = '';
    for (var j = 0; j < hem.length; j++) {
      var q = hem[j], ty = q[1] + (j % 3 ? 6 : 7.5), tx = q[0] + (j % 2 ? -1 : -1.6) ;
      fuzz += `M${f(tx)},${f(ty)} l-1,1.4 M${f(tx)},${f(ty)} l0.3,1.8 M${f(tx)},${f(ty)} l1.2,1.2 `;
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
      <path d="M126,118 Q104,112 70,118 C52,124 30,122 8,112 Q18,132 14,150 Q8,170 10,198 Q30,210 66,208 Q100,205 126,198 L132,150 Z" fill="url(#${id('twill')})"/>
      <!-- secondary fold shadows + reflected light on the shadow side -->
      <path d="M100,124 Q94,160 104,200 L116,198 Q108,160 114,122 Z" fill="#12240b" opacity="0.22"/>
      <path d="M70,124 Q64,160 72,205 L78,205 Q72,160 78,123 Z" fill="#12240b" opacity="0.16"/>
      <path d="M12,150 Q9,172 11,196" fill="none" stroke="#9be07a" stroke-width="1.6" stroke-linecap="round" opacity="0.45"/>
      <path d="M46,128 Q40,158 44,196 M74,126 Q68,160 74,200 M104,124 Q100,158 108,196" fill="none" stroke="#dff5c0" stroke-width="0.8" stroke-linecap="round" opacity="0.35"/>
      <!-- stitched repair patch -->
      <path d="M112,168 L124,166 L125,178 L113,180 Z" fill="#7a5a34" stroke="${OL}" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M113.6,169.2 L123.4,167.6 L124.2,177 L114.4,178.6 Z" fill="none" stroke="#e8d3a0" stroke-width="0.6" stroke-dasharray="1.3 1"/>
      <path d="M116,172 l5,-0.8 M116.4,175 l5,-0.8" stroke="#3d220d" stroke-width="0.5"/>
      <!-- cloak battle wear: small tears -->
      <path d="M20,176 l3,2 l-1,3 M30,190 l2,-2 l3,1" fill="none" stroke="${OL}" stroke-width="0.9" stroke-linecap="round" opacity="0.8"/>
      <!-- rolled top edge flapping in the wind -->
      <path d="M70,118 C52,124 30,122 8,112 Q24,122 36,124 Q54,128 72,122 Z" fill="#2c5e1d" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>
      <!-- woven selvedge along hem -->
      <path d="M11,195 Q30,205 66,204 Q100,201 127,194" fill="none" stroke="url(#${id('weave')})" stroke-width="4.5"/>
      <path d="M10,198 Q30,208 66,207 Q100,204 126,198" fill="none" stroke="${OL}" stroke-width="1"/>
      <path d="M11,192.7 Q30,202.7 66,201.7 Q100,198.7 127,191.7" fill="none" stroke="${OL}" stroke-width="0.9"/>
      <!-- tasselled fringe -->
      <path d="${fringe}" fill="none" stroke="#6a4524" stroke-width="1.8" stroke-linecap="round"/>
      <path d="${fringe}" fill="none" stroke="#c8a15a" stroke-width="0.7" stroke-linecap="round"/>
      <path d="${fuzz}" fill="none" stroke="#e6cf94" stroke-width="0.45" stroke-linecap="round" opacity="0.9"/>
      <path d="M12,109 Q30,120 60,122 M22,114 Q36,122 62,124" fill="none" stroke="#e7f6c8" stroke-width="0.7" stroke-linecap="round" opacity="0.35"/>
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
      <path d="M72,186 L95,186 L94,213 L74,213 Q71,200 72,186 Z" fill="url(#${id('twill')})"/>
      <!-- knee crease, seam + patch stitches, AO under tunic -->
      <path d="M74,199 Q83,202 93,199" fill="none" stroke="#3a0f08" stroke-width="0.9" opacity="0.5" stroke-linecap="round"/>
      <path d="M83,187 L83.6,206" stroke="#e2b04a" stroke-width="0.5" stroke-dasharray="1.2 1" opacity="0.8"/>
      <path d="M72,186 L95,186 L95,192 Q83,196 72,192 Z" fill="#1a0d05" opacity="0.32"/>
      <path d="M86.5,201 l4,-0.5 l0.4,4 l-4,0.5 Z" fill="#7a5a34" stroke="#3a0f08" stroke-width="0.5"/>
      <path d="M87.2,201.6 l2.6,-0.3 M87.4,203.8 l2.6,-0.3" stroke="#e8d3a0" stroke-width="0.35"/>
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
      <path d="M72,213 L93,213 Q101,214 106,219.5 Q109,229 101,229 L72,229 Q68,221 72,213 Z" fill="url(#${id('grain')})"/>
      <!-- toe cap, sole welt, stitches, scuffs, mud -->
      <path d="M92,217 Q99,218 102,224 Q102,228 98,228" fill="none" stroke="#3d220d" stroke-width="0.8"/>
      <path d="M93.5,217.6 Q99.5,218.6 102.6,224" fill="none" stroke="#e0b078" stroke-width="0.5" stroke-dasharray="1 1"/>
      <path d="M73,227.6 L103,227.6" stroke="#e0b078" stroke-width="0.5" stroke-dasharray="1.4 1" opacity="0.8"/>
      <path d="M96,222 l3,1.5 M100,225 l2,0.5" stroke="#d9a877" stroke-width="0.6" stroke-linecap="round" opacity="0.8"/>
      <path d="M72,220 Q86,222 96,221 L96,229 L72,229 Z" fill="#1a0d05" opacity="0.15"/>
      <path d="M74,225 q2,-2 4,-0.5 q1,2 -1,3 q-3,0.5 -3,-2.5 Z M86,226.5 q2,-1.2 3.5,0 q0.5,1.8 -1.5,2 q-2,0 -2,-2 Z M100,227 q1.5,-1 2.5,0.2 q0,1.5 -1.7,1.6 Z" fill="#5b3a1a" opacity="0.85"/>
      <path d="M75,225.4 q1,-1 2,-0.4" stroke="#8a6238" stroke-width="0.4" fill="none"/>
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
      <ellipse cx="1" cy="2" rx="12" ry="12" fill="url(#${id('ao')})" opacity="0.7"/>
      <!-- pin (behind ring on the far side, over it on the near side) -->
      <path d="M-9,8 L8,-9" stroke="${OL}" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M-9,8 L8,-9" stroke="url(#${id('gold')})" stroke-width="1.8" stroke-linecap="round"/>
      <!-- penannular ring -->
      <path d="M-3.2,6.4 A7,7 0 1,1 3.2,6.4" fill="none" stroke="${OL}" stroke-width="5.4" stroke-linecap="round"/>
      <path d="M-3.2,6.4 A7,7 0 1,1 3.2,6.4" fill="none" stroke="url(#${id('gold')})" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M-5.6,-2.5 A6,6 0 0,1 1,-6" fill="none" stroke="#fff6cf" stroke-width="0.9" stroke-linecap="round"/>
      <!-- ring twist marks -->
      <path d="M-7,1 l1.6,0.8 M-6,-3.6 l1.6,1 M-2.8,-6.6 l1,1.6 M1.6,-6.8 l-0.2,1.8 M5.4,-4.4 l-1.2,1.3 M7,0 l-1.8,0.2 M5.6,3.8 l-1.4,-1" stroke="#8a5e18" stroke-width="0.6"/>
      <path d="M-6,-1 l2,-1.8 M-4.6,-4.2 l2.4,-1.4 M-0.6,-6.6 l2,0.2 M3.6,-6 l1.8,1 M6.2,-2.4 l0.8,2 M6.4,2 l-0.6,1.6" stroke="#fff6cf" stroke-width="0.5" opacity="0.9"/>
      <path d="M-5.4,4 A6.4,6.4 0 0,0 -3,6.5" fill="none" stroke="#7a4e0e" stroke-width="0.7" opacity="0.6"/>
      <path d="M-9.4,8.6 l3.4,-3.4" stroke="#5a3208" stroke-width="0.5" opacity="0.6"/>
      <!-- decorated terminals -->
      <circle cx="-3.6" cy="6.6" r="2.3" fill="url(#${id('gold')})" stroke="${OL}" stroke-width="1"/>
      <circle cx="3.6" cy="6.6" r="2.3" fill="url(#${id('gold')})" stroke="${OL}" stroke-width="1"/>
      ${enamel(-3.6, 6.6, 1)}${enamel(3.6, 6.6, 1)}
      <!-- pin head -->
      <circle cx="8" cy="-9" r="1.6" fill="url(#${id('gold')})" stroke="${OL}" stroke-width="0.8"/>
      <circle cx="7.5" cy="-9.5" r="0.5" fill="#fff"/>
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
      <path d="M60,110 H140 V196 H60 Z" fill="url(#${id('linenw')})"/>
      <!-- fold shading: under belt, side, hem drape -->
      <path d="M62,170 Q98,177 134,170 L134,184 Q98,192 62,184 Z" fill="#8a6a3a" opacity="0.2"/>
      <path d="M66,176 Q72,182 70,190 M104,178 Q106,184 104,192 M118,174 Q124,182 122,190" fill="none" stroke="#8a6a3a" stroke-width="1.6" stroke-linecap="round" opacity="0.35"/>
      <path d="M70,124 Q66,140 68,158" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.55"/>
      <path d="M126,130 Q131,150 130,170" fill="none" stroke="#d9c49a" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
      <!-- side-seam stitches -->
      <path d="M127,150 L129,192" stroke="#7a5a30" stroke-width="0.6" stroke-dasharray="1.6 1.2"/>
      <!-- woven hem border -->
      <path d="M60,184 Q98,192 136,184 L136,196 L60,196 Z" fill="url(#${id('weave')})"/>
      <path d="M60,184 Q98,192 136,184" fill="none" stroke="${OL}" stroke-width="1.3"/>
      <path d="M60,185.3 Q98,193.3 136,185.3" fill="none" stroke="#f2c14e" stroke-width="0.6"/>
      <path d="M60,195.2 Q98,203 136,195.2" fill="none" stroke="#3d220d" stroke-width="0.6" stroke-dasharray="1.4 1.2" opacity="0.7"/>
      <path d="M60,188 Q98,196 136,188" fill="none" stroke="#fff" stroke-width="0.4" opacity="0.35"/>
    </g>
    <!-- neckline border -->
    <path d="M92,119 Q104,134 116,119" fill="none" stroke="${OL}" stroke-width="5.6" stroke-linecap="round"/>
    <path d="M92,119 Q104,134 116,119" fill="none" stroke="url(#${id('weave')})" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M93.5,121 Q104,135.4 114.5,121" fill="none" stroke="#3d220d" stroke-width="0.5" stroke-dasharray="1.2 1"/>
    <!-- belt -->
    <path d="M63,160 Q98,167 133,160 L133,170 Q98,177 63,170 Z" fill="url(#${id('leather')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M63,160 Q98,167 133,160 L133,170 Q98,177 63,170 Z" fill="url(#${id('grain')})"/>
    <path d="M63,160 Q98,167 133,160" fill="none" stroke="#e0a870" stroke-width="0.8" opacity="0.7"/>
    <path d="M65,163 Q98,170 131,163" fill="none" stroke="#c98c55" stroke-width="0.7" stroke-dasharray="1.6 1.4"/>
    <path d="M63,170 Q98,177 133,170" fill="none" stroke="#1a0d05" stroke-width="1" opacity="0.35"/>
    <g fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="0.6"><circle cx="66" cy="164.6" r="1.3"/><circle cx="130" cy="164.6" r="1.3"/><circle cx="84" cy="166" r="1.1"/><circle cx="112" cy="166" r="1.1"/></g>
    <g fill="#fff6d8"><circle cx="65.6" cy="164.2" r="0.4"/><circle cx="129.6" cy="164.2" r="0.4"/></g>

    <path d="M65,168 Q98,175 131,168" fill="none" stroke="#3d220d" stroke-width="0.6" stroke-dasharray="1.6 1.4" opacity="0.7"/>
    <!-- bronze belt rings -->
    <g fill="none" stroke="${OL}" stroke-width="2.4"><circle cx="122" cy="167" r="2.4"/><circle cx="76" cy="167.5" r="2.4"/></g>
    <g fill="none" stroke="url(#${id('bronze')})" stroke-width="1.2"><circle cx="122" cy="167" r="2.4"/><circle cx="76" cy="167.5" r="2.4"/></g>
    <!-- hanging leather pouch -->
    <path d="M73,171 Q70,172 70,177 L70,184 Q70,190 76,190.5 Q82,190 83,184 L83,177 Q83,172 80,171 Z" fill="url(#${id('leather')})" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M70,177 Q76.5,181.5 83,177 L83,173 Q76.5,177 70,173 Z" fill="#7a4a24" stroke="${OL}" stroke-width="1.2"/>
    <path d="M70.5,172 Q76.5,176 82.5,172" fill="none" stroke="#c98c55" stroke-width="0.6" stroke-dasharray="1.2 1"/>
    <path d="M71.6,180 Q72,186 76,188.6" fill="none" stroke="#e0a870" stroke-width="0.6" stroke-dasharray="1 1"/>
    <circle cx="76.5" cy="180" r="1.6" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="0.9"/>
    <circle cx="76" cy="179.5" r="0.5" fill="#fff"/>
    <path d="M71,183 l2,2 M81,182 l-1,3" stroke="#3d220d" stroke-width="0.5" opacity="0.6"/>
    <!-- sheathed knife -->
    <path d="M124,170 L127.5,169.5 L129,190 Q127,193 125,190 Z" fill="url(#${id('leather')})" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M125.4,175 L127.8,174.8 M125.6,180 L128,179.8" stroke="#e0a870" stroke-width="0.6"/>
    <path d="M124.6,190 Q126,193.6 128.4,190.4 L128.6,192.5 Q126.6,195.4 124.6,192.4 Z" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="0.9"/>
    <path d="M123.4,166.6 L128.6,166 L128.4,171.5 L123.6,172 Z" fill="#5a3418" stroke="${OL}" stroke-width="1.2"/>
    <path d="M124.4,167.6 L127.6,167.2" stroke="#e0a870" stroke-width="0.5"/>
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
      <path d="M86,114 Q86,130 100,131.5 M122,114 Q122,130 108,131.5" fill="none" stroke="#fff2b0" stroke-width="4.4" stroke-dasharray="0.5 2.3" stroke-dashoffset="1.1" opacity="0.8"/>
      <path d="M88.6,116 Q89,127 99,129.4 M119.4,116 Q119,127 109,129.4" fill="none" stroke="#7a4e0e" stroke-width="0.6" opacity="0.5"/>
      <path d="M86.6,115 Q87,127 97,130" fill="none" stroke="#fff6cf" stroke-width="0.9" stroke-linecap="round"/>
      <path d="M121.4,116 Q121,126 112,129.6" fill="none" stroke="#fff6cf" stroke-width="0.6" stroke-linecap="round" opacity="0.7"/>
      <!-- buffer terminals with spiral chasing -->
      <circle cx="100" cy="131.5" r="4.2" fill="url(#${id('gold')})" stroke="${OL}" stroke-width="1.8"/>
      <circle cx="108.5" cy="131.5" r="4.2" fill="url(#${id('gold')})" stroke="${OL}" stroke-width="1.8"/>
      <path d="${spiralD(100, 131.5, 2.8, 1.6, 0, 1)}" fill="none" stroke="#8a5e18" stroke-width="0.6"/>
      <path d="${spiralD(108.5, 131.5, 2.8, 1.6, Math.PI, -1)}" fill="none" stroke="#8a5e18" stroke-width="0.6"/>
      <circle cx="98.6" cy="130" r="0.9" fill="#ffffff"/><circle cx="107.1" cy="130" r="0.9" fill="#ffffff"/>
      <path d="M96.4,134.6 Q100,136.2 103.6,134.6 M104.9,134.6 Q108.5,136.2 112.1,134.6" fill="none" stroke="#7a4e0e" stroke-width="0.6" opacity="0.6"/>
      <circle cx="100" cy="131.5" r="3.6" fill="none" stroke="#7a4e0e" stroke-width="0.4" stroke-dasharray="0.7 0.7"/>
      <circle cx="108.5" cy="131.5" r="3.6" fill="none" stroke="#7a4e0e" stroke-width="0.4" stroke-dasharray="0.7 0.7"/>
      <ellipse cx="104" cy="127" rx="9" ry="2" fill="#1a0d05" opacity="0.18"/>
    </g>`;
  }

  /* ---------------- long oval shield (Battersea-inspired) ---------------- */
  function roundel(id, cx, cy, r) {
    return `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id('bronzer')})" stroke="${OL}" stroke-width="1.8"/>
      <circle cx="${cx}" cy="${cy}" r="${f(r - 1.8)}" fill="none" stroke="#8a561c" stroke-width="0.7"/>
      <path d="${triskeleD(cx, cy, r * 0.62, -90)}" fill="none" stroke="#7a4814" stroke-width="1.2" stroke-linecap="round"/>
      ${enamel(cx, cy - r * 0.78, 1.1)}${enamel(f(cx + r * 0.68), f(cy + r * 0.4), 1.1)}${enamel(f(cx - r * 0.68), f(cy + r * 0.4), 1.1)}
      <circle cx="${cx}" cy="${cy}" r="1.3" fill="#d42a2a" stroke="${OL}" stroke-width="0.5"/>
      <circle cx="${cx}" cy="${cy}" r="${f(r - 1)}" fill="url(#${id('hammer')})"/>
      <circle cx="${cx}" cy="${cy}" r="${f(r - 0.9)}" fill="none" stroke="#fff0c0" stroke-width="0.4" stroke-dasharray="0.5 0.9"/>
      <path d="M${f(cx - r * 0.7)},${f(cy - r * 0.5)} Q${f(cx - r * 0.3)},${f(cy - r * 0.85)} ${f(cx + r * 0.2)},${f(cy - r * 0.8)}" fill="none" stroke="#fffbe8" stroke-width="0.8" stroke-linecap="round"/>
      <circle cx="${f(cx + r * 0.45)}" cy="${f(cy - r * 0.55)}" r="0.35" fill="#fff"/>`;
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
        <!-- painted knot tendrils + leaf scrolls -->
        <path d="M24,160 Q30,156 34,160 Q30,164 26,161 M60,160 Q54,156 50,160 Q54,164 58,161 M26,172 Q32,178 36,172 M58,172 Q52,178 48,172" fill="none" stroke="#2f6a1a" stroke-width="1" stroke-linecap="round"/>
        <path d="M29,131 Q25,138 30,142 M55,131 Q59,138 54,142 M29,201 Q25,194 30,190 M55,201 Q59,194 54,190" fill="none" stroke="#c9f09a" stroke-width="0.6" stroke-linecap="round" opacity="0.7"/>
        <g fill="#c9f09a" opacity="0.65"><circle cx="34.6" cy="150.6" r="0.9"/><circle cx="49.4" cy="150.6" r="0.9"/><circle cx="34.6" cy="181.4" r="0.9"/><circle cx="49.4" cy="181.4" r="0.9"/></g>
        <!-- wood grain -->
        <path d="M30,126 Q27,166 30,206 M35,122 Q32,166 35,210 M49,122 Q52,166 49,210 M54,126 Q57,166 54,206" fill="none" stroke="#1d4a0e" stroke-width="0.5" opacity="0.35"/>
        <!-- reflected light on shadow side + AO around boss & roundels -->
        <path d="M60,138 Q63,166 60,194" fill="none" stroke="#9fe07a" stroke-width="1.6" stroke-linecap="round" opacity="0.4"/>
        <ellipse cx="43" cy="167.5" rx="13" ry="20" fill="url(#${id('ao')})" opacity="0.7"/>
        <ellipse cx="43" cy="141" rx="10" ry="9" fill="url(#${id('ao')})" opacity="0.6"/>
        <ellipse cx="43" cy="195" rx="10" ry="9" fill="url(#${id('ao')})" opacity="0.6"/>
        <!-- scratches, dents and chips -->
        <path d="M27,152 l7,9 M29,150 l4,5 M52,186 l-6,7 M55,183 l-3,4 M31,196 l4,-3" fill="none" stroke="#d4f0b0" stroke-width="0.6" stroke-linecap="round" opacity="0.75"/>
        <path d="M25,158 l3,-1.2 l0.6,1.8 z M56,176 l-2.4,0.6 l0.6,2.4 z" fill="#e6c48a" stroke="#2f1d0d" stroke-width="0.5" opacity="0.9"/>
        <!-- cel shade + gloss -->
        <path d="M50,122 Q66,160 50,212 L70,212 L70,120 Z" fill="#0e2a06" opacity="0.3"/>
        <path d="M27,140 Q28,128 36,123" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" opacity="0.55"/>
      </g>
      <!-- bronze spine -->
      <path d="M40,122 L44,122 L44.6,210 L39.4,210 Z" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M41,124 L41,208" stroke="#fff3cf" stroke-width="0.7"/>
      <path d="M39.4,122 L44.6,122 L44.6,210 L39.4,210 Z" fill="url(#${id('hammer')})"/>
      <path d="M40,127 h4 M40,131 h4 M40,206 h4 M40,202 h4 M40,148 h4 M40,184 h4 M40,157 h4 M40,175 h4" stroke="#6b3f12" stroke-width="0.5"/>
      <circle cx="42" cy="124.4" r="0.9" fill="#fff0c8" stroke="#6b3f12" stroke-width="0.3"/><circle cx="42" cy="207.8" r="0.9" fill="#fff0c8" stroke="#6b3f12" stroke-width="0.3"/>
      <path d="M43.6,146 l0.9,2 M40.2,190 l1,2" stroke="${OL}" stroke-width="0.6"/>
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
      <path d="M42,150.5 Q51,158.5 51,166 Q51,173 42,181.5" fill="none" stroke="#fff2c8" stroke-width="0.5" stroke-dasharray="0.6 1" opacity="0.9"/>
      <path d="M42,154 Q40,160 42,166 Q44,172 42,178" fill="none" stroke="#8a561c" stroke-width="0.5"/>
      <circle cx="42" cy="166" r="4.5" fill="none" stroke="#fff2c8" stroke-width="0.4" stroke-dasharray="0.6 0.8"/>
      <path d="M46.6,169 l1.8,2 l-0.4,1.2" fill="none" stroke="${OL}" stroke-width="0.6"/>
      <circle cx="39.5" cy="163.5" r="1.2" fill="#ffffff" opacity="0.9"/>
      <path d="M36,158 Q39,153 42,151.5" fill="none" stroke="#ffffff" stroke-width="1" stroke-linecap="round" opacity="0.8"/>
      ${rivets}
      <!-- bronze binding rim -->
      <ellipse cx="42" cy="166" rx="20.2" ry="44.2" fill="none" stroke="url(#${id('bronze')})" stroke-width="3"/>
      <ellipse cx="42" cy="166" rx="22" ry="46" fill="none" stroke="${OL}" stroke-width="3"/>
      <ellipse cx="42" cy="166" rx="18.4" ry="42.4" fill="none" stroke="${OL}" stroke-width="0.8" opacity="0.7"/>
      <ellipse cx="42" cy="166" rx="20.2" ry="44.2" fill="none" stroke="url(#${id('hammer')})" stroke-width="3"/>
      <path d="M26,140 Q22,166 26,192" fill="none" stroke="#fff3cf" stroke-width="1" stroke-linecap="round" opacity="0.8"/>
      <path d="M58,144 Q62,166 58,188" fill="none" stroke="#6b3f12" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
      <path d="M61.5,150 l-1.6,-1 M62,182 l-1.6,1.6" fill="none" stroke="${OL}" stroke-width="0.7"/>
      
      <g transform="translate(24.6,127.6)"><path d="M0,-3 L0.6,-0.6 L3,0 L0.6,0.6 L0,3 L-0.6,0.6 L-3,0 L-0.6,-0.6 Z" fill="#fff"/></g>
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
      <!-- bevel edge planes, wear and nicks -->
      <path d="M-4.4,-16 L-4.2,-88 M4.4,-16 L4.2,-88" stroke="#5f6c7c" stroke-width="0.5" opacity="0.6"/>
      <path d="M2.4,-16 L2.4,-84" stroke="#4c5a6a" stroke-width="0.5" opacity="0.5"/>
      <path d="M-4.9,-44 l1.6,0.6 l-1.6,0.8 M4.9,-62 l-1.6,0.6 l1.6,0.8 M-4.7,-72 l1.2,0.4 l-1.2,0.6" fill="#3a2a1a" stroke="${OL}" stroke-width="0.5"/>
      <path d="M-1.6,-36 l2.4,-5 M1.2,-58 l1.8,-3 M-2,-66 l1.4,-2.4 M1.4,-24 l1.6,-2" stroke="#ffffff" stroke-width="0.4" opacity="0.8" stroke-linecap="round"/>
      <path d="M-3.4,-14 L3.4,-14 L3.4,-11 L-3.4,-11 Z" fill="#4c5a6a" opacity="0.5"/>
      <path d="M-1.6,-32 h1.2 M-1.6,-46 h1.2 M-1.6,-60 h1.2" stroke="#3b4756" stroke-width="0.4" opacity="0.6"/>
      <!-- forge pattern marks -->
      <path d="M2.8,-30 q-1,2 0,4 M2.8,-50 q-1,2 0,4 M2.8,-70 q-1,2 0,4" fill="none" stroke="#6f7c8b" stroke-width="0.6"/>
      <!-- bell-shaped guard -->
      <path d="M-7.6,-9 Q-7,-15 0,-16 Q7,-15 7.6,-9 Z" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M-4.8,-12 Q0,-14.4 4.8,-12" fill="none" stroke="#fff3cf" stroke-width="0.8" stroke-linecap="round"/>
      <path d="M-6.2,-10.4 Q0,-12.6 6.2,-10.4" fill="none" stroke="#7a4814" stroke-width="0.5"/>
      <path d="M-2,-14.6 l0,-1 M2,-14.6 l0,-1" stroke="#7a4814" stroke-width="0.5"/>
      ${enamel(-5.2, -10.6, 0.8)}${enamel(5.2, -10.6, 0.8)}${enamel(0, -13.4, 0.8)}
      <path d="M-7.4,-9.4 L7.4,-9.4" stroke="#6b3f12" stroke-width="0.6"/>
      <!-- grip -->
      <rect x="-3.2" y="-9" width="6.4" height="21" rx="2" fill="url(#${id('leather')})" stroke="${OL}" stroke-width="2"/>
      <rect x="-3.2" y="-9" width="6.4" height="21" rx="2" fill="url(#${id('grain')})"/>
      <path d="M-3,-6 L3,-3.6 M-3,-2.4 L3,0 M-3,1.2 L3,3.6 M-3,4.8 L3,7.2 M-3,8.4 L3,10.8" stroke="#2a1508" stroke-width="1.1"/>
      <path d="M-3,-7 L3,-4.6 M-3,-3.4 L3,-1 M-3,0.2 L3,2.6 M-3,3.8 L3,6.2 M-3,7.4 L3,9.8" stroke="#d99a5e" stroke-width="0.5" opacity="0.8"/>
      <path d="M-2.2,-8 L-2.2,11" stroke="#f0c088" stroke-width="0.6" opacity="0.6" stroke-linecap="round"/>
      <path d="M-4.2,-8.4 L4.2,-8.4 L4.2,-6.6 L-4.2,-6.6 Z" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="1"/>
      <!-- anthropomorphic pommel: little figure with raised, curling arms -->
      <path d="M-5,12 L5,12 L4,15 L-4,15 Z" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M-3,14 Q-10,14 -10,20 Q-10,24 -7,24" fill="none" stroke="${OL}" stroke-width="3.6" stroke-linecap="round"/>
      <path d="M3,14 Q10,14 10,20 Q10,24 7,24" fill="none" stroke="${OL}" stroke-width="3.6" stroke-linecap="round"/>
      <path d="M-3,14 Q-10,14 -10,20 Q-10,24 -7,24" fill="none" stroke="url(#${id('bronze')})" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M3,14 Q10,14 10,20 Q10,24 7,24" fill="none" stroke="url(#${id('bronze')})" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="-6.6" cy="23.6" r="2" fill="url(#${id('bronzer')})" stroke="${OL}" stroke-width="1"/>
      <circle cx="6.6" cy="23.6" r="2" fill="url(#${id('bronzer')})" stroke="${OL}" stroke-width="1"/>
      <circle cx="0" cy="19.5" r="4" fill="url(#${id('bronzer')})" stroke="${OL}" stroke-width="1.5"/>
      <path d="M-3.4,17.2 Q-1.8,15.4 0,15.6 Q1.8,15.4 3.4,17.2" fill="none" stroke="#8a561c" stroke-width="0.7"/>
      <path d="M-4,19.4 Q-4.6,20.4 -4,21.4 M4,19.4 Q4.6,20.4 4,21.4" fill="none" stroke="#8a561c" stroke-width="0.5"/>
      <path d="M-2.6,18.3 l1.6,-0.4 M2.6,18.3 l-1.6,-0.4" stroke="${OL}" stroke-width="0.5"/>
      <circle cx="-1.6" cy="19.5" r="0.5" fill="${OL}"/><circle cx="1.6" cy="19.5" r="0.5" fill="${OL}"/>
      <circle cx="-1.9" cy="19.2" r="0.16" fill="#fff"/><circle cx="1.3" cy="19.2" r="0.16" fill="#fff"/>
      <path d="M0,19.8 l0,0.9" stroke="#8a561c" stroke-width="0.4"/>
      <circle cx="-6.6" cy="23.6" r="0.7" fill="#d42a2a"/><circle cx="6.6" cy="23.6" r="0.7" fill="#d42a2a"/>
      <path d="M-10,17 l1.2,0.4 M-10,20 l1.4,0 M10,17 l-1.2,0.4 M10,20 l-1.4,0" stroke="#6b3f12" stroke-width="0.4"/>
      <path d="M-3,16.4 Q-1,15 1.4,15.4" stroke="#fff5d6" stroke-width="0.6" fill="none" stroke-linecap="round"/>
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
      <path d="M114,124 L130,119 L142,139 L130,150 Z" fill="url(#${id('linenw')})"/>
      <path d="M120,138 Q128,142 133,148 L130,150 L118,140 Z" fill="#8a6a3a" opacity="0.25"/>
      <path d="M118,132 Q124,134 128,140 M121,127 Q127,131 131,137" fill="none" stroke="#b39a6c" stroke-width="0.9" stroke-linecap="round" opacity="0.7"/>
      <path d="M115.6,125 L129,120.6" stroke="#7a5a30" stroke-width="0.5" stroke-dasharray="1.4 1.1"/>
      <path d="M119,127 L126,124" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.8"/>
      <!-- woven cuff -->
      <path d="M128,145 L140,137 L143.5,141.5 L131.5,150.5 Z" fill="url(#${id('weave')})" stroke="${OL}" stroke-width="1.5" stroke-linejoin="round"/>
      <!-- bare forearm with woad spirals -->
      <path d="M136,142 L149,141 L151,157 L137,158 Q133,150 136,142 Z" fill="url(#${id('skinl')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      ${woad(spiralD(141.5, 150, 3.4, 1.7, 0, 1), 1.1)}
      ${woad('M137,145 Q141,143 145,144.5 M137.5,155.5 Q141,157 145,155.5', 1, 0.85)}
      <g fill="${WOAD}" opacity="0.9"><circle cx="146.2" cy="149" r="0.7"/><circle cx="146.4" cy="152" r="0.7"/></g>
      ${woad('M138.4,147 q1.2,-2.4 3.6,-2.6 M137.6,153 q1.4,1.8 3.4,1.8 M144,146.4 q1.6,1.4 1.4,3.2', 0.7, 0.85)}
      <path d="M136,142 L149,141 L149,146 Q142,148 136,146 Z" fill="#a0603e" opacity="0.18"/>
      <!-- bronze bracelet -->
      <rect x="146.4" y="140.8" width="3.6" height="16.8" rx="1.6" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="1.4"/>
      <path d="M146.7,143.2 l3,1.3 M146.7,146.4 l3,1.3 M146.7,149.6 l3,1.3 M146.7,152.8 l3,1.3" stroke="#8a561c" stroke-width="0.6"/>
      <path d="M147.4,142.4 L147.4,146" stroke="#fff5d6" stroke-width="0.8" stroke-linecap="round"/>
      <!-- fist around grip -->
      <path d="M148,142 Q156,138 161,143 Q163,150 159,157 Q152,160 148,156 Z" fill="url(#${id('skin')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M152,141.5 q3,2 3,5 M156,142 q3,2 3,5 M151,148 q3,1.5 3.5,4.5 M155.5,148.5 q3,1.5 3.5,4.5" fill="none" stroke="#c9775a" stroke-width="1"/>
      <path d="M147,147 Q152,144 157,149" fill="none" stroke="${OL}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M151,140.8 Q154,139.8 157,141" fill="none" stroke="#fff1e2" stroke-width="1" stroke-linecap="round"/>
      <path d="M152.4,152 q1,1.8 3,2 M156,151 q1.2,1.8 3,1.6" fill="none" stroke="#e8a582" stroke-width="0.5"/>
      <path d="M158.6,145 q1,1.6 0.6,3.6" fill="none" stroke="#fff1e2" stroke-width="0.6" stroke-linecap="round"/>
      <path d="M152,154.6 Q156,158 160,152" fill="none" stroke="#e89a72" stroke-width="0.9" opacity="0.5"/>
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
      s += `<path d="M${f(cx - 3)},${f(cy + 1.8)} L${f(cx + 3)},${f(cy - 1.4)}" stroke="#7a2a12" stroke-width="0.4" opacity="0.6"/>`;
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
      <path d="M66,44 C54,42 42,40 28,30 M64,52 C50,52 34,54 16,52 M60,62 C48,64 34,66 20,72 M62,74 C52,78 40,84 30,92 M66,84 C58,90 48,98 40,104" fill="none" stroke="#f08a4c" stroke-width="0.6" stroke-linecap="round" opacity="0.75"/>
      <path d="M58,36 C44,34 32,30 24,22 M52,56 C38,58 24,56 12,52" fill="none" stroke="#7a2a12" stroke-width="0.7" stroke-linecap="round" opacity="0.8"/>
      <path d="M24,24 Q18,20 14,22 M12,51 Q8,54 4,52 M15,75 Q10,80 6,78 M29,99 Q24,104 22,108" fill="none" stroke="#c24a22" stroke-width="0.7" stroke-linecap="round"/>
      <!-- long braid flying back, with beads -->
      <path d="M64,90 Q56,98 50,108" fill="none" stroke="${OL}" stroke-width="7" stroke-linecap="round"/>
      <path d="M64,90 Q56,98 50,108" fill="none" stroke="#c24a22" stroke-width="4.4" stroke-linecap="round"/>
      <path d="M64,90 Q56,98 50,108" fill="none" stroke="#7a2a12" stroke-width="4.4" stroke-dasharray="0.5 2" stroke-linecap="butt" opacity="0.6"/>
      <path d="M63,89 Q56,96 51,105" fill="none" stroke="#ff9a5e" stroke-width="0.8" stroke-linecap="round"/>
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
    <path d="M140,100 Q144,88 143,72 M143,104 Q147,90 146,74 M62,76 Q58,90 66,110 M58,72 Q55,88 60,100 M138,82 Q142,92 138,106" fill="none" stroke="#a33b1a" stroke-width="0.6" stroke-linecap="round" opacity="0.7"/>
    <path d="M70,40 Q62,54 60,72 M126,32 Q140,42 144,60 M96,30 Q84,34 74,44" fill="none" stroke="#f6935a" stroke-width="0.6" stroke-linecap="round" opacity="0.7"/>
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
        <ellipse cx="${cx + 0.5}" cy="${cy + 1.2}" rx="4.2" ry="5.2" fill="url(#${id('iris2')})"/>
        <ellipse cx="${cx + 0.5}" cy="${cy + 1.2}" rx="4.2" ry="5.2" fill="none" stroke="#154a22" stroke-width="0.6"/>
        <path d="M${cx - 2.6},${cy + 3} L${cx - 1.4},${cy + 0.2} M${cx + 3.6},${cy + 3} L${cx + 2.4},${cy + 0.2} M${cx + 0.5},${cy + 5} L${cx + 0.5},${cy + 2.4} M${cx - 1.6},${cy + 4.4} L${cx - 0.8},${cy + 2.4} M${cx + 2.6},${cy + 4.4} L${cx + 1.8},${cy + 2.4}" stroke="#d9ff9a" stroke-width="0.35" opacity="0.7"/>
        <circle cx="${cx + 0.7}" cy="${cy + 1.1}" r="1.9" fill="${OL}"/>
        <path d="M${cx - 3.4},${cy - 3.2} Q${cx + 0.5},${cy - 5.6} ${cx + 4.6},${cy - 3.2} L${cx + 4.6},${cy - 1} Q${cx + 0.5},${cy - 3.2} ${cx - 3.4},${cy - 1} Z" fill="#0f2a10" opacity="0.5"/>
        <circle cx="${cx - 1.7}" cy="${cy - 2.6}" r="2.2" fill="#ffffff"/>
        <circle cx="${cx + 2.2}" cy="${cy + 3.4}" r="1" fill="#ffffff"/>
        <circle cx="${cx + 3.2}" cy="${cy - 0.4}" r="0.55" fill="#ffffff" opacity="0.9"/>
        <path d="M${cx - 3},${cy + 4.6} Q${cx + 0.5},${cy + 6.8} ${cx + 3.6},${cy + 4.4}" fill="none" stroke="#e8ffc0" stroke-width="0.5" opacity="0.6" stroke-linecap="round"/>
        <!-- upper lash line with flick + extra lashes -->
        <path d="M${cx - 5.8},${cy - 3} Q${cx},${cy - 8.6} ${cx + 5.8},${cy - 3.6} L${cx + 7.8},${cy - 5.6}" fill="none" stroke="${OL}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M${cx - 5.6},${cy - 3.6} l-1.6,-1.2 M${cx - 4.2},${cy - 5.6} l-1.4,-1.6 M${cx + 5.6},${cy - 4.4} l1.6,-0.4" fill="none" stroke="${OL}" stroke-width="0.9" stroke-linecap="round"/>
        <path d="M${cx - 4.6},${cy - 5.4} Q${cx - 1},${cy - 7.6} ${cx + 2.6},${cy - 7}" fill="none" stroke="#b56a3c" stroke-width="0.5" opacity="0.7"/>
      </g>`;
  }

  function face(id, withClasses) {
    var ec = withClasses ? ' class="part-eyes" style="transform-origin: 106px 90px"' : '';
    var freckles = [[99,97],[101.5,99.5],[97,100],[111,97],[113.5,99.5],[115.5,97.2],[88,98],[124,98],[126.5,100],[95.6,98],[103.4,97.4],[109.4,99.4],[117.6,99.6],[91,100.6],[121.4,101],[100.6,95.6],[112.6,94.8],[94,101.4],[118.6,96.4]];
    var fr = '';
    for (var i = 0; i < freckles.length; i++) fr += `<circle cx="${freckles[i][0]}" cy="${freckles[i][1]}" r="0.75"/>`;
    return `
    <!-- ear with bronze ring -->
    <path d="M72,84 Q63,80 63,89 Q64,97 72,96" fill="url(#${id('skin')})" stroke="${OL}" stroke-width="2.2"/>
    <path d="M70,86 Q67,89 70,93" fill="none" stroke="#d98e6a" stroke-width="1"/>
    <path d="M68.6,85 Q65.6,86.6 66,90.6" fill="none" stroke="#e8a582" stroke-width="0.6"/>
    <path d="M65.6,84.4 q1,-1 2.4,-0.6" fill="none" stroke="#fff1e2" stroke-width="0.6" stroke-linecap="round"/>
    <circle cx="66.5" cy="98" r="2" fill="none" stroke="${OL}" stroke-width="2.2"/>
    <circle cx="66.5" cy="98" r="2" fill="none" stroke="url(#${id('gold')})" stroke-width="1.1"/>
    <!-- face -->
    <path d="M70,76 Q70,56 90,56 L118,56 Q138,56 138,76 L138,96 Q138,118 113,118 L96,118 Q70,118 70,96 Z" fill="url(#${id('skin')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M132,84 Q136,104 124,114 Q134,112 137,100 Z" fill="#e89a72" opacity="0.4"/>
    <!-- woad: triskele on the near cheek, spiral on the far cheek -->
    ${woad(triskeleD(127, 104, 4.4, -20), 1.25)}
    ${woad(spiralD(81, 103, 4.2, 1.8, -Math.PI / 2, -1), 1.25)}
    ${woad('M77,95 Q81,93.5 85,95', 1, 0.8)}
    <ellipse cx="89" cy="99" rx="5" ry="1.4" fill="#e6a488" opacity="0.32"/>
    <ellipse cx="116.6" cy="99" rx="5" ry="1.4" fill="#e6a488" opacity="0.32"/>
    ${woad('M124.6,110.4 q1.4,1.2 3.6,1.4 M121.4,109 q0.6,1.8 1.6,2.4', 0.8, 0.8)}
    <g fill="${WOAD}" opacity="0.85"><circle cx="76.4" cy="107.6" r="0.6"/><circle cx="79" cy="109.4" r="0.6"/><circle cx="131.6" cy="98" r="0.6"/></g>
    <!-- blush + freckles -->
    <ellipse cx="86" cy="106" rx="4.2" ry="2.2" fill="#ff8a7a" opacity="0.45"/>
    <ellipse cx="86" cy="105.6" rx="2.4" ry="1.1" fill="#ff6f6a" opacity="0.28"/>
    <path d="M83,104.6 l1,1.4 M85.4,104 l1,1.4 M88,104.4 l1,1.4 M119.4,105 l1,1.4 M122,104.6 l1,1.4 M124.6,105 l1,1.4" stroke="#e35f5f" stroke-width="0.4" opacity="0.5"/>
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
    <path d="M85.4,80.6 l1.6,-1.6 M88,79.6 l1.4,-1.8 M91,79 l1.2,-2 M94,79.4 l1,-1.8 M96.6,80.8 l0.8,-1.6 M113,81 l-0.6,-1.8 M116,79.6 l-0.8,-1.8 M119,78.8 l-1,-1.8 M122,78.6 l-1.2,-1.6 M124.8,79.4 l-1.4,-1.4" stroke="#8f3116" stroke-width="0.6" stroke-linecap="round"/>
    <path d="M86,79.4 Q91,76.6 96,79.4 M113.4,79.6 Q119,76.6 124.6,78.6" fill="none" stroke="#ff9a5e" stroke-width="0.6" stroke-linecap="round" opacity="0.8"/>
    <path d="M103.4,84 Q104,90 103.6,95" fill="none" stroke="#e8a582" stroke-width="0.7" stroke-linecap="round" opacity="0.6"/>
    <!-- nose -->
    <path d="M106,96 Q108.5,100 105,101.2" fill="none" stroke="#c9775a" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="104.4" cy="98.4" r="0.9" fill="#ffffff" opacity="0.8"/>
    <path d="M102.6,100.6 Q104.4,102 106.6,101.2" fill="none" stroke="#d98e6a" stroke-width="0.7" stroke-linecap="round"/>
    <!-- fierce grin -->
    <path d="M98,105.5 Q108,103.5 119,104.5 Q117,114.5 108,115 Q100,114 98,105.5 Z" fill="#7a2222" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M99.2,106.2 Q108,104.6 117.8,105.3 L117.2,107.6 Q108,107.2 99.8,108.3 Z" fill="#ffffff"/>
    <path d="M104,106 L104,107.8 M110,105.4 L110,107.4 M101.4,106.4 L101.6,108 M113.6,105.6 L113.2,107.2 M107,105.8 L107,107.6 M116,105.4 L115.6,106.8" stroke="#c9c0b8" stroke-width="0.45"/>
    <path d="M99.4,108.2 Q108,107 117.6,107.6" fill="none" stroke="#c9c0b8" stroke-width="0.4" opacity="0.7"/>
    <path d="M100.6,109.6 Q108,108.4 116.6,109.2 L116.4,110.6 Q108,109.8 101,111 Z" fill="#5a1418" opacity="0.7"/>
    <path d="M101.6,112 Q108,116.4 115,112.4" fill="none" stroke="#ff9d9d" stroke-width="0.6" opacity="0.7"/>
    <path d="M108,110.6 L108,113.6" stroke="#c94f57" stroke-width="0.6" stroke-linecap="round"/>
    <path d="M103.6,113.2 Q108,115.2 113,113.4" fill="none" stroke="#ffb8b0" stroke-width="0.8" stroke-linecap="round" opacity="0.7"/>
    <path d="M100,116.8 Q108,119.6 116,116.8" fill="none" stroke="#e89a72" stroke-width="0.7" opacity="0.5"/>
    <path d="M102.5,112.4 Q108,109.4 114,112" fill="#ff8f8f" stroke="none"/>
    <path d="M97,104.6 Q96.2,106 97.2,107 M119.8,103.6 Q121,104 121.2,105.6" fill="none" stroke="${OL}" stroke-width="1.2" stroke-linecap="round"/>`;
  }

  function fringe(id) {
    return `
    <!-- wind-tossed fringe -->
    <path d="M66,90 C58,76 57,58 62,48 C70,32 84,25 104,25 C130,25 149,41 146,80 L140,78 Q140,68 134,64 Q136,72 130,76 Q126,66 118,62 Q118,70 110,74 Q106,64 98,62 Q96,70 86,72 Q88,64 84,62 Q78,68 76,76 Q72,80 70,92 Z"
          fill="url(#${id('hair')})" stroke="${OL}" stroke-width="2.8" stroke-linejoin="round"/>
    <path d="M71,86 Q70,70 80,58 M90,58 Q98,46 116,44 M122,48 Q134,54 138,66" fill="none" stroke="#8f3116" stroke-width="1.3" stroke-linecap="round"/>
    <!-- individual strands -->
    <path d="M76,72 Q74,60 82,50 M80,74 Q80,62 88,54 M86,66 Q88,56 96,48 M94,64 Q98,54 106,48 M104,66 Q108,56 116,50 M112,68 Q118,58 126,54 M122,70 Q130,62 134,56 M130,72 Q136,68 139,62" fill="none" stroke="#a33b1a" stroke-width="0.7" stroke-linecap="round" opacity="0.75"/>
    <path d="M78,60 Q86,46 100,42 M100,40 Q112,38 124,44 M90,52 Q98,44 108,43 M126,54 Q134,58 138,68 M72,66 Q72,56 78,50" fill="none" stroke="#ffb983" stroke-width="0.6" stroke-linecap="round" opacity="0.8"/>
    <path d="M70,52 Q74,40 88,32 M106,32 Q120,32 132,40 M62,60 Q64,50 70,44" fill="none" stroke="#f8a566" stroke-width="0.6" stroke-linecap="round" opacity="0.65"/>
    <!-- fringe under-shadow on forehead -->
    <path d="M84,64 Q88,72 98,71 Q106,76 112,72 Q124,72 130,68 Q126,80 116,77 Q108,80 100,76 Q90,76 84,64 Z" fill="#c9805e" opacity="0.28"/>
    <!-- flyaway hairs -->
    <path d="M100,26 Q106,14 114,10 M92,27 Q88,16 94,8 M132,34 Q142,28 146,20 M64,52 Q56,46 52,38" fill="none" stroke="#e06a33" stroke-width="0.6" stroke-linecap="round"/>
    <path d="M118,25 Q124,14 122,8 M78,30 Q72,20 76,12" fill="none" stroke="#ffa060" stroke-width="0.5" stroke-linecap="round"/>
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

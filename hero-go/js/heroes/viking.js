/* Hero Go! — Bjorn, The Viking Berserker (key: viking)
 * Hand-authored inline SVG. See ART_CONTRACT.md.
 * Historically grounded: gjermundbu spectacle helm (no horns!), mail byrnie,
 * wolf-pelt cloak, round plank shield, bearded Dane axe.
 */
(function () {
  var OL = '#2b1d14';

  function mk(uid) {
    uid = uid == null ? '' : String(uid);
    return function (n) { return 'viking-' + n + '-' + uid; };
  }

  /* ---------------- defs ---------------- */
  function defs(id) {
    return `
    <defs>
      <radialGradient id="${id('helm')}" cx="0.36" cy="0.25" r="0.85">
        <stop offset="0" stop-color="#f4f6f8"/>
        <stop offset="0.3" stop-color="#bcc4cd"/>
        <stop offset="0.7" stop-color="#7f8a97"/>
        <stop offset="1" stop-color="#4f5864"/>
      </radialGradient>
      <linearGradient id="${id('iron')}" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0" stop-color="#dfe4ea"/>
        <stop offset="0.45" stop-color="#9aa4b0"/>
        <stop offset="1" stop-color="#5a6470"/>
      </linearGradient>
      <linearGradient id="${id('ironh')}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#5f6975"/>
        <stop offset="0.4" stop-color="#c9d0d8"/>
        <stop offset="1" stop-color="#6d7783"/>
      </linearGradient>
      <linearGradient id="${id('blade')}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#8793a1"/>
        <stop offset="0.5" stop-color="#c7d1dc"/>
        <stop offset="0.8" stop-color="#eef4fa"/>
        <stop offset="1" stop-color="#ffffff"/>
      </linearGradient>
      <radialGradient id="${id('skin')}" cx="0.45" cy="0.4" r="0.7">
        <stop offset="0" stop-color="#ffe4cc"/>
        <stop offset="0.75" stop-color="#ffcfa8"/>
        <stop offset="1" stop-color="#eeab80"/>
      </radialGradient>
      <linearGradient id="${id('skinl')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffdcbf"/>
        <stop offset="1" stop-color="#eaa77c"/>
      </linearGradient>
      <linearGradient id="${id('beard')}" x1="0" y1="0" x2="0.2" y2="1">
        <stop offset="0" stop-color="#f59a4a"/>
        <stop offset="0.5" stop-color="#dc6d2a"/>
        <stop offset="1" stop-color="#a9461a"/>
      </linearGradient>
      <linearGradient id="${id('tunic')}" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0" stop-color="#6d9fd0"/>
        <stop offset="0.5" stop-color="#40709f"/>
        <stop offset="1" stop-color="#284b72"/>
      </linearGradient>
      <linearGradient id="${id('fur')}" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stop-color="#b3a38c"/>
        <stop offset="0.5" stop-color="#8b7a64"/>
        <stop offset="1" stop-color="#5c4d3e"/>
      </linearGradient>
      <linearGradient id="${id('bronze')}" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stop-color="#ffe3a3"/>
        <stop offset="0.45" stop-color="#d9a04a"/>
        <stop offset="1" stop-color="#8e5a1d"/>
      </linearGradient>
      <linearGradient id="${id('silver')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset="0.5" stop-color="#d3d9e0"/>
        <stop offset="1" stop-color="#8b96a3"/>
      </linearGradient>
      <linearGradient id="${id('leather')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#9a6234"/>
        <stop offset="1" stop-color="#5a3418"/>
      </linearGradient>
      <linearGradient id="${id('wood')}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#e0b67a"/>
        <stop offset="0.5" stop-color="#b98450"/>
        <stop offset="1" stop-color="#7f5530"/>
      </linearGradient>
      <linearGradient id="${id('wool')}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#7d6a4a"/>
        <stop offset="1" stop-color="#554631"/>
      </linearGradient>
      <linearGradient id="${id('wrap')}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#ece1c6"/>
        <stop offset="0.6" stop-color="#cdbd99"/>
        <stop offset="1" stop-color="#a8977a"/>
      </linearGradient>
      <radialGradient id="${id('boss')}" cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset="0.3" stop-color="#c7ced6"/>
        <stop offset="1" stop-color="#4f5864"/>
      </radialGradient>
      <radialGradient id="${id('shield')}" cx="0.4" cy="0.35" r="0.75">
        <stop offset="0" stop-color="#fbf0d6"/>
        <stop offset="1" stop-color="#dcc39a"/>
      </radialGradient>
      <radialGradient id="${id('iris')}" cx="0.45" cy="0.65" r="0.6">
        <stop offset="0" stop-color="#bfe6ff"/>
        <stop offset="0.6" stop-color="#4f97d4"/>
        <stop offset="1" stop-color="#1f4f86"/>
      </radialGradient>
      <radialGradient id="${id('glint')}" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#ffffff" stop-opacity="1"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
      <pattern id="${id('mail')}" width="4" height="4" patternUnits="userSpaceOnUse">
        <rect width="4" height="4" fill="#737e8b"/>
        <circle cx="1" cy="1" r="1.25" fill="none" stroke="#d3dae2" stroke-width="0.65"/>
        <circle cx="3" cy="3" r="1.25" fill="none" stroke="#b1bac5" stroke-width="0.65"/>
        <circle cx="1" cy="1" r="1.25" fill="none" stroke="#3d4652" stroke-width="0.25" stroke-dasharray="1 1"/>
      </pattern>
      <pattern id="${id('tablet')}" width="6" height="5" patternUnits="userSpaceOnUse">
        <rect width="6" height="5" fill="#b8322c"/>
        <path d="M0,2.5 L1.5,0 L3,2.5 L1.5,5 Z M3,2.5 L4.5,0 L6,2.5 L4.5,5 Z" fill="#f2c14e"/>
        <path d="M1.5,1.4 L2.2,2.5 L1.5,3.6 L0.8,2.5 Z M4.5,1.4 L5.2,2.5 L4.5,3.6 L3.8,2.5 Z" fill="#1f3f63"/>
      </pattern>
      <clipPath id="${id('shieldclip')}">
        <circle cx="46" cy="168" r="27"/>
      </clipPath>
      <clipPath id="${id('byrnieclip')}">
        <path d="M67,120 Q97,110 128,120 L132,186 Q97,194 63,186 Z"/>
      </clipPath>
    </defs>`;
  }

  /* shaggy fur strokes */
  function furStrokes(pts, col, w, op) {
    var s = '';
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      s += `M${p[0]},${p[1]} q${p[2]},${p[3]} ${p[4]},${p[5]} `;
    }
    return `<path d="${s}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
  }

  /* ---------------- wolf-pelt cloak (behind) ---------------- */
  function cape(id) {
    return `
    <g class="part-cape" style="transform-origin: 96px 120px">
      <!-- pelt, skin side lining peeking -->
      <path d="M68,112 C40,118 22,156 12,206 Q18,212 24,207 Q30,214 37,208 Q44,215 51,209 Q58,215 65,208 Q72,214 80,207 Q88,212 96,205 Q106,209 114,202 Q121,204 126,200 L122,122 Z"
            fill="#c9ab82" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
      <!-- fur outer -->
      <path d="M70,110 C42,116 24,152 14,201 Q20,206 26,201 Q32,208 39,202 Q46,209 53,203 Q60,209 67,202 Q74,208 82,201 Q90,206 98,199 Q107,203 115,196 Q122,198 127,194 L124,120 Z"
            fill="url(#${id('fur')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
      <!-- darker dorsal stripe -->
      <path d="M86,126 C76,148 60,172 44,196 L56,196 C70,174 84,150 94,128 Z" fill="#5c4d3e" opacity="0.45"/>
      <!-- fur texture -->
      ${furStrokes([[80,130,-3,6,-5,12],[72,146,-3,6,-6,11],[62,160,-3,6,-6,10],[52,174,-3,5,-6,10],[40,188,-3,4,-5,8],[92,140,-2,7,-4,13],[86,160,-2,7,-5,12],[76,176,-2,7,-5,12],[98,168,-1,8,-3,13],[110,150,-1,8,-2,14],[112,176,0,7,-1,12],[66,184,-2,6,-4,10]], '#3f3328', 1.3, 0.75)}
      ${furStrokes([[84,128,-3,6,-5,11],[76,142,-3,6,-5,11],[66,156,-3,6,-6,10],[56,170,-3,5,-6,10],[96,152,-2,7,-4,12],[104,136,-1,7,-3,12],[82,168,-2,6,-4,11],[118,138,0,8,-1,13]], '#d8cab0', 1.1, 0.7)}
      <!-- tail hanging from the back corner -->
      <path d="M26,196 Q14,204 12,218 Q18,214 22,218 Q24,210 32,204 Z" fill="url(#${id('fur')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M14,214 Q16,211 19,212" fill="none" stroke="#d8cab0" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M18,208 q2,-4 6,-6 M22,212 q1,-3 5,-6" fill="none" stroke="#3f3328" stroke-width="1" stroke-linecap="round"/>
    </g>`;
  }

  /* ---------------- legs ---------------- */
  function leg(id, dx) {
    return `
    <g transform="translate(${dx},0)">
      <!-- wool trousers -->
      <path d="M74,194 L93,194 L92,206 L75,206 Z" fill="url(#${id('wool')})" stroke="${OL}" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M79,196 Q80,201 78,205 M88,196 Q87,200 89,205" fill="none" stroke="#3a2f20" stroke-width="1" opacity="0.8"/>
      <!-- winingas (wrapped leg bindings) -->
      <path d="M75,203 L92,203 L91,219 L76,219 Z" fill="url(#${id('wrap')})" stroke="${OL}" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M76,207 L91,204.5 M76,211 L91,208.5 M76,215 L91,212.5 M76.5,218.5 L91,216" stroke="#9b8a6c" stroke-width="1.1"/>
      <path d="M77,206 L90,204 M77,210 L90,208 M77,214 L90,212" stroke="#fffaf0" stroke-width="0.7" opacity="0.8"/>
      <!-- crossed leather straps -->
      <path d="M76,205 L91,217 M91,205 L76,217" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>
      <path d="M76,205 L91,217 M91,205 L76,217" stroke="#8a5530" stroke-width="1.7" stroke-linecap="round"/>
      <path d="M77,205.5 L83,210.3" stroke="#c98c55" stroke-width="0.6" stroke-linecap="round"/>
      <!-- leather turnshoe -->
      <path d="M73,217 L92,217 Q100,218 105,222 Q108,229 101,229 L73,229 Q70,223 73,217 Z"
            fill="url(#${id('leather')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M75,219.5 Q86,218 96,220.5" fill="none" stroke="#c98c55" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M92,218 Q96,222 94,228" fill="none" stroke="#3d220d" stroke-width="1" stroke-dasharray="1.2 1.2"/>
      <!-- ankle thong -->
      <path d="M73,219.5 Q83,222 92,219" fill="none" stroke="#3d220d" stroke-width="1.5"/>
      <circle cx="91" cy="219.5" r="1.1" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="0.5"/>
      <path d="M72,226.5 L104,226.5" stroke="#2b1a0e" stroke-width="1.2" opacity="0.5"/>
    </g>`;
  }

  /* ---------------- torso ---------------- */
  function knotBuckle(id) {
    // Borre-style ring-chain / interlace on a bronze plate
    return `
    <g>
      <path d="M86,159 Q95,155 104,159 L105,172 Q95,177 85,172 Z" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>
      <g fill="none" stroke-linecap="round">
        <path d="M89,162 Q95,157.5 101,162 Q103,166 100,169 Q95,173 90,169 Q87,166 89,162 Z" stroke="#6b3f12" stroke-width="1.6"/>
        <path d="M91,166 Q95,160 99,166 Q95,171 91,166 Z" stroke="#6b3f12" stroke-width="1.4"/>
        <path d="M89,162 Q95,157.5 101,162 Q103,166 100,169 Q95,173 90,169 Q87,166 89,162 Z" stroke="#ffe3a3" stroke-width="0.5"/>
        <path d="M91,166 Q95,160 99,166 Q95,171 91,166 Z" stroke="#ffe3a3" stroke-width="0.45"/>
        <path d="M95,158.5 L95,172.5 M88,165.5 L102,165.5" stroke="#6b3f12" stroke-width="1" stroke-dasharray="2.2 2"/>
      </g>
      <circle cx="95" cy="165.8" r="1.4" fill="#ffe3a3" stroke="#6b3f12" stroke-width="0.6"/>
      <circle cx="87.6" cy="160.5" r="0.8" fill="#6b3f12"/><circle cx="102.4" cy="160.5" r="0.8" fill="#6b3f12"/>
      <circle cx="87.4" cy="171" r="0.8" fill="#6b3f12"/><circle cx="102.6" cy="171" r="0.8" fill="#6b3f12"/>
      <path d="M88,160.5 Q93,158 97,158.5" fill="none" stroke="#fff5d6" stroke-width="1" stroke-linecap="round"/>
    </g>`;
  }

  function torso(id) {
    return `
    <!-- tunic skirt below the byrnie -->
    <path d="M66,180 L129,180 L134,199 Q98,206 61,199 Z" fill="url(#${id('tunic')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M62,194 Q98,201 133,194 L134,199 Q98,206 61,199 Z" fill="url(#${id('tablet')})" stroke="${OL}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M62.5,194 Q98,201 133,194" fill="none" stroke="#f2c14e" stroke-width="0.8"/>
    <path d="M78,186 Q76,192 75,197 M112,186 Q114,191 116,196" fill="none" stroke="#1d3a5c" stroke-width="1.6" opacity="0.8"/>
    <path d="M96,188 Q96,193 97,198" fill="none" stroke="#8fbde8" stroke-width="1.2" opacity="0.6"/>
    <!-- mail byrnie -->
    <path d="M67,120 Q97,110 128,120 L132,186 Q97,194 63,186 Z" fill="url(#${id('mail')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
    <g clip-path="url(#${id('byrnieclip')})">
      <!-- cel shading on the mail -->
      <path d="M116,118 Q126,150 124,190 L140,190 L140,110 Z" fill="#1b2330" opacity="0.35"/>
      <path d="M70,124 Q66,150 70,184 L76,184 Q72,152 76,122 Z" fill="#ffffff" opacity="0.22"/>
      <!-- ring rows -->
      <path d="M64,134 Q97,128 132,134 M64,146 Q97,140 132,146 M64,176 Q97,182 132,176" fill="none" stroke="#e8edf2" stroke-width="0.6" stroke-dasharray="1.4 1.4" opacity="0.7"/>
    </g>
    <!-- scalloped mail hem with brass rings -->
    <path d="M63.5,186 Q66,190 69,187 Q72,191 75,188 Q78,192 81,189 Q84,193 87,190 Q90,194 93,191 Q96,195 99,191 Q102,194 105,190 Q108,193 111,189 Q114,192 117,188 Q120,191 123,187 Q126,190 129,186 Q131,188 132,186"
          fill="#737e8b" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>
    <g fill="none" stroke="url(#${id('bronze')})" stroke-width="0.9">
      <circle cx="69" cy="188.4" r="1.1"/><circle cx="81" cy="190.4" r="1.1"/><circle cx="93" cy="192.4" r="1.1"/>
      <circle cx="105" cy="191.4" r="1.1"/><circle cx="117" cy="189.4" r="1.1"/><circle cx="129" cy="187.4" r="1.1"/>
    </g>
    <!-- belt -->
    <path d="M63,158 Q97,165 132,158 L132,168 Q97,175 63,168 Z" fill="url(#${id('leather')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M65,161 Q97,168 130,161" fill="none" stroke="#c98c55" stroke-width="0.7" stroke-dasharray="1.6 1.4"/>
    <path d="M65,166 Q97,173 130,166" fill="none" stroke="#3d220d" stroke-width="0.6" stroke-dasharray="1.6 1.4" opacity="0.7"/>
    <!-- bronze belt mounts -->
    <g fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="0.6">
      <path d="M71,161.5 l2,-1.5 l2,1.5 l0,3.5 l-2,1.5 l-2,-1.5z"/>
      <path d="M78,162.8 l2,-1.5 l2,1.5 l0,3.5 l-2,1.5 l-2,-1.5z"/>
      <path d="M116,162.8 l2,-1.5 l2,1.5 l0,3.5 l-2,1.5 l-2,-1.5z"/>
      <path d="M123,161.5 l2,-1.5 l2,1.5 l0,3.5 l-2,1.5 l-2,-1.5z"/>
    </g>
    <!-- belt tail hanging with strap-end -->
    <path d="M100,170 Q102,178 100,184 L104,184 Q106,178 104,170 Z" fill="url(#${id('leather')})" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M99.5,182 L104.5,182 L103.5,189 Q102,191 100.5,189 Z" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M101,184 q1,2 2,0" fill="none" stroke="#6b3f12" stroke-width="0.6"/>
    ${knotBuckle(id)}
    <!-- belt pouch (left hip) -->
    <g>
      <path d="M72,168 L86,169 L86,182 Q79,187 72,182 Z" fill="url(#${id('leather')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M71.5,167.5 L86.5,168.5 L86,174 Q79,178 72,174 Z" fill="#b0743f" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M73.5,170 L84.5,170.8" stroke="#e0a86e" stroke-width="0.8" stroke-linecap="round"/>
      <path d="M73.5,180 Q79,184 84.5,180" fill="none" stroke="#3d220d" stroke-width="0.6" stroke-dasharray="1.2 1.2"/>
      <path d="M79,174.5 l-1.5,3 l1.5,1.2 l1.5,-1.2z" fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="0.6"/>
    </g>
    <!-- seax worn horizontally below the belt -->
    <g>
      <!-- sheath -->
      <path d="M113,170 L136,171 Q139,172.5 136,175 L113,176.5 Z" fill="url(#${id('leather')})" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M115,171.8 L134,172.6" stroke="#c98c55" stroke-width="0.7" stroke-dasharray="1.3 1.2"/>
      <path d="M118,173 q2,2 4,0 q2,-2 4,0 q2,2 4,0" fill="none" stroke="#3d220d" stroke-width="0.6"/>
      <g fill="url(#${id('bronze')})" stroke="${OL}" stroke-width="0.6">
        <rect x="113" y="169.8" width="3" height="7" rx="0.6"/>
        <rect x="126" y="170.4" width="2.4" height="6" rx="0.5"/>
        <path d="M135,171 Q140,172.6 135,175.2 Z"/>
      </g>
      <!-- handle (antler) -->
      <path d="M103,171 L113,170.4 L113,176.6 L103,176 Q101,173.5 103,171 Z" fill="#e9dcc0" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M105,172 L105,175.2 M108,171.7 L108,175.6 M111,171.4 L111,175.8" stroke="#a8977a" stroke-width="0.8"/>
      <path d="M104,172 L112,171.4" stroke="#ffffff" stroke-width="0.7" opacity="0.8"/>
      <rect x="112" y="169.8" width="2" height="7.4" rx="0.5" fill="url(#${id('silver')})" stroke="${OL}" stroke-width="0.6"/>
    </g>`;
  }

  /* ---------------- wolf head (pelt draped over the back shoulder) ---------------- */
  function wolfHead(id) {
    return `
    <g transform="translate(52,122) scale(1.15) translate(-50,-120)">
      <!-- ears -->
      <path d="M44,112 L40,98 L51,107 Z" fill="#8b7a64" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M44,109 L42,101.5 L48,107 Z" fill="#e0a898"/>
      <path d="M53,110 L55,97 L61,109 Z" fill="#7a6a56" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
      <!-- skull -->
      <path d="M40,114 Q44,104 56,106 Q66,109 66,120 Q64,130 54,132 L44,130 Q38,124 40,114 Z"
            fill="url(#${id('fur')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      <!-- muzzle pointing out/back -->
      <path d="M44,118 Q34,118 27,123 Q24,127 28,129 Q34,131 44,130 Z" fill="#a6947b" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M28,124 Q34,124 40,127" fill="none" stroke="#e4d8c2" stroke-width="1.4" stroke-linecap="round"/>
      <ellipse cx="27.2" cy="124" rx="2.2" ry="1.7" fill="${OL}"/>
      <circle cx="26.6" cy="123.4" r="0.6" fill="#ffffff"/>
      <!-- jaw with fangs -->
      <path d="M29,129 Q35,133 44,131" fill="none" stroke="${OL}" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M32,129.5 l0.8,3 l1.2,-2.8 M38,130.5 l0.8,3 l1.2,-2.8" fill="#ffffff" stroke="${OL}" stroke-width="0.6" stroke-linejoin="round"/>
      <!-- closed pelt eye + brow -->
      <path d="M43,115 Q46,113 49,115" fill="none" stroke="${OL}" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M42,112 Q46,109 51,111" fill="none" stroke="#3f3328" stroke-width="1.2" stroke-linecap="round"/>
      <!-- cheek ruff -->
      <path d="M52,124 l4,6 M56,121 l5,5 M60,117 l5,3 M48,127 l2,5" stroke="#3f3328" stroke-width="1.1" stroke-linecap="round"/>
      <path d="M50,109 q4,1 8,4 M54,108 q4,2 7,6" fill="none" stroke="#d8cab0" stroke-width="1" stroke-linecap="round"/>
      <path d="M45,106.5 Q50,104.5 55,106" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
    </g>`;
  }

  /* ---------------- round shield ---------------- */
  function horn(rot) {
    return `<path transform="rotate(${rot} 46 168)" d="M46,160 Q44,152 48,146 Q54,141 60,144 Q55,145 52,149 Q50,154 50,160 Z"/>`;
  }

  function shield(id) {
    var planks = '';
    for (var i = 0; i < 6; i++) {
      var x = 23 + i * 9;
      planks += `<path d="M${x},138 L${x},198" stroke="#9c7a4a" stroke-width="0.9" opacity="0.7"/>`;
      planks += `<path d="M${x + 1},138 L${x + 1},198" stroke="#fff6e0" stroke-width="0.5" opacity="0.5"/>`;
    }
    var rivets = '';
    for (var k = 0; k < 16; k++) {
      var a = k / 16 * Math.PI * 2;
      rivets += `<circle cx="${(46 + Math.cos(a) * 24.5).toFixed(1)}" cy="${(168 + Math.sin(a) * 24.5).toFixed(1)}" r="0.55" fill="#6b4a2a"/>`;
    }
    return `
    <g>
      <circle cx="46" cy="168" r="27" fill="url(#${id('shield')})"/>
      <g clip-path="url(#${id('shieldclip')})">
        <!-- red outer band -->
        <circle cx="46" cy="168" r="23" fill="none" stroke="#b8322c" stroke-width="6"/>
        <!-- triple-horn triskele -->
        <g fill="#b8322c" stroke="#6e1a15" stroke-width="0.7" stroke-linejoin="round">
          ${horn(0)}${horn(120)}${horn(240)}
        </g>
        ${planks}
        <!-- weathering -->
        <path d="M30,150 l6,2 M58,186 l5,-3 M26,172 l3,4 M60,154 l4,1" stroke="#7f5a32" stroke-width="0.7" stroke-linecap="round" opacity="0.7"/>
        <!-- cel shade + gloss -->
        <path d="M46,195 A27,27 0 0,0 73,168 Q70,188 46,195 Z" fill="#5a3418" opacity="0.28"/>
        <path d="M24,160 Q28,146 42,142" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" opacity="0.55"/>
      </g>
      ${rivets}
      <!-- rawhide rim, stitched -->
      <circle cx="46" cy="168" r="26.2" fill="none" stroke="#d9b98a" stroke-width="3.8"/>
      <circle cx="46" cy="168" r="26.2" fill="none" stroke="#8a6238" stroke-width="0.8" stroke-dasharray="1.4 2.2"/>
      <circle cx="46" cy="168" r="28" fill="none" stroke="${OL}" stroke-width="3"/>
      <circle cx="46" cy="168" r="24.2" fill="none" stroke="${OL}" stroke-width="0.9" opacity="0.7"/>
      <!-- iron boss -->
      <circle cx="46" cy="168" r="9" fill="url(#${id('iron')})" stroke="${OL}" stroke-width="2.2"/>
      <circle cx="46" cy="168" r="6" fill="url(#${id('boss')})" stroke="${OL}" stroke-width="1.4"/>
      <g fill="#dfe4ea" stroke="${OL}" stroke-width="0.5">
        <circle cx="46" cy="160.5" r="0.9"/><circle cx="53.5" cy="168" r="0.9"/><circle cx="46" cy="175.5" r="0.9"/><circle cx="38.5" cy="168" r="0.9"/>
      </g>
      <circle cx="43.8" cy="165.6" r="1.6" fill="#ffffff"/>
    </g>`;
  }

  /* ---------------- dane axe + weapon arm ---------------- */
  function axe(id) {
    return `
    <g transform="translate(152,150) rotate(8)">
      <!-- haft -->
      <rect x="-3" y="-98" width="6" height="146" rx="2.6" fill="url(#${id('wood')})" stroke="${OL}" stroke-width="2.4"/>
      <path d="M-1.3,-60 L-1.3,40" stroke="#f3d3a0" stroke-width="0.9" opacity="0.8"/>
      <path d="M1.4,-40 q-1,4 0,8 M0.8,24 q-1,4 0,8" fill="none" stroke="#7f5530" stroke-width="0.6"/>
      <!-- iron butt cap -->
      <path d="M-3.6,40 L3.6,40 L3.2,49 Q0,51 -3.2,49 Z" fill="url(#${id('ironh')})" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>
      <!-- leather wrap on the grip -->
      <rect x="-3.8" y="-16" width="7.6" height="44" rx="2" fill="url(#${id('leather')})" stroke="${OL}" stroke-width="2"/>
      <path d="M-3.6,-12 L3.6,-9 M-3.6,-6 L3.6,-3 M-3.6,0 L3.6,3 M-3.6,6 L3.6,9 M-3.6,12 L3.6,15 M-3.6,18 L3.6,21 M-3.6,24 L3.6,27" stroke="#3d220d" stroke-width="1"/>
      <path d="M-3.6,-11 L3.6,-8 M-3.6,1 L3.6,4 M-3.6,13 L3.6,16" stroke="#c98c55" stroke-width="0.5"/>
      <!-- iron langets riveted down the haft -->
      <path d="M-3.4,-84 L-1.4,-84 L-1.4,-56 L-2.4,-53 L-3.4,-56 Z" fill="url(#${id('ironh')})" stroke="${OL}" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M1.4,-84 L3.4,-84 L3.4,-56 L2.4,-53 L1.4,-56 Z" fill="url(#${id('ironh')})" stroke="${OL}" stroke-width="1.1" stroke-linejoin="round"/>
      <g fill="#e6ebf0" stroke="${OL}" stroke-width="0.4"><circle cx="-2.4" cy="-76" r="0.7"/><circle cx="-2.4" cy="-64" r="0.7"/><circle cx="2.4" cy="-70" r="0.7"/><circle cx="2.4" cy="-60" r="0.7"/></g>
      <!-- bearded blade -->
      <path d="M3,-97 L9,-98 Q17,-99 25,-107 Q33,-88 26,-70 Q20,-60 11,-57 Q11,-68 3,-79 Z"
            fill="url(#${id('blade')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      <!-- forged dark cheek near socket -->
      <path d="M3,-96 L9,-97 Q12,-88 9,-80 Q7,-75 3,-79 Z" fill="#5f6975" opacity="0.8"/>
      <!-- bevel along the edge -->
      <path d="M24.5,-104 Q30.5,-88 24.5,-71 Q19.5,-62 12.5,-59" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M21.5,-101 Q27,-88 21.5,-73 Q17,-65 12,-63" fill="none" stroke="#8793a1" stroke-width="0.7" opacity="0.8"/>
      <!-- etched runes: ᛒᛃᚬᚱᚾ -->
      <g fill="none" stroke="#3a4450" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12,-94 L12,-86 M12,-94 L14.5,-92 L12,-90 L14.5,-88 L12,-86"/>
        <path d="M17,-93 L17,-85 M15.8,-90.5 L18.2,-88.5"/>
        <path d="M14,-83 L14,-75 M14,-83 L16.5,-81 L14,-79 L16.5,-75"/>
        <path d="M19,-84 L19,-76 M18,-80 L20,-79 M18,-82 L20,-81"/>
        <path d="M13,-72 L13,-66 M12,-70 L14.5,-68.5"/>
      </g>
      <!-- socket / eye -->
      <path d="M-4.4,-101 L4.4,-101 L5,-79 L-5,-79 Z" fill="url(#${id('ironh')})" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M-4.6,-95 L4.6,-95 M-4.8,-85 L4.8,-85" stroke="${OL}" stroke-width="1"/>
      <path d="M-2.5,-99 L-2.5,-81" stroke="#ffffff" stroke-width="1" stroke-linecap="round" opacity="0.8"/>
      <!-- shine sparkle -->
      <g transform="translate(26,-100)">
        <circle r="5" fill="url(#${id('glint')})" opacity="0.9"/>
        <path d="M0,-5.5 L1,-1 L5.5,0 L1,1 L0,5.5 L-1,1 L-5.5,0 L-1,-1 Z" fill="#ffffff"/>
      </g>
    </g>`;
  }

  function furShoulder(id, cx, cy, s) {
    return `
    <g transform="translate(${cx},${cy}) scale(${s})">
      <path d="M-15,4 Q-18,-10 -4,-14 Q10,-16 16,-6 Q20,2 16,10 L13,7 L11,13 L7,8 L4,14 L1,8 L-3,14 L-5,8 L-9,12 L-10,6 L-14,9 Z"
            fill="url(#${id('fur')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      ${furStrokes([[-10,-8,1,4,0,8],[-4,-10,1,5,0,9],[3,-10,1,5,1,9],[10,-6,1,4,1,8]], '#3f3328', 1.1, 0.7)}
      ${furStrokes([[-8,-11,2,3,2,6],[0,-12,2,3,2,6],[7,-10,2,3,2,6]], '#e0d4bc', 1.1, 0.85)}
    </g>`;
  }

  function weaponArm(id) {
    return `
    <g class="part-weapon" style="transform-origin: 124px 126px">
      ${axe(id)}
      <!-- tunic sleeve (upper arm) -->
      <path d="M115,126 L131,121 L143,141 L131,151 Z" fill="url(#${id('tunic')})" stroke="${OL}" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M124,132 L134,146" stroke="#1d3a5c" stroke-width="1.4" opacity="0.7"/>
      <!-- tablet-weave cuff -->
      <path d="M129,146 L141,138 L144,142 L132,151 Z" fill="url(#${id('tablet')})" stroke="${OL}" stroke-width="1.5" stroke-linejoin="round"/>
      <!-- mail short sleeve -->
      <path d="M114,124 L131,119 L138,132 Q134,135 130,134 Q126,138 122,137 Q119,140 117,137 Z" fill="url(#${id('mail')})" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>
      <!-- bare forearm -->
      <path d="M137,142 L149,141 L151,157 L137,157 Q133,150 137,142 Z" fill="url(#${id('skinl')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M139,147 q2,1 4,0 M140,152 q2,1 4,0" fill="none" stroke="#d98e6a" stroke-width="0.8"/>
      <!-- silver arm rings (twisted) -->
      <g>
        <rect x="140.5" y="141.2" width="3.4" height="16.2" rx="1.5" fill="url(#${id('silver')})" stroke="${OL}" stroke-width="1.4"/>
        <path d="M140.8,143.5 l3,1.4 M140.8,146.5 l3,1.4 M140.8,149.5 l3,1.4 M140.8,152.5 l3,1.4 M140.8,155.3 l3,1.2" stroke="#7d8896" stroke-width="0.6"/>
        <rect x="145" y="141" width="3" height="16.4" rx="1.4" fill="url(#${id('silver')})" stroke="${OL}" stroke-width="1.4"/>
        <circle cx="146.5" cy="149.2" r="1.3" fill="#ffffff" stroke="#7d8896" stroke-width="0.4"/>
        <path d="M141.6,142.6 L141.6,146" stroke="#ffffff" stroke-width="0.8" stroke-linecap="round"/>
      </g>
      <!-- fist around haft -->
      <path d="M147,142 Q155,138 160,143 Q162,150 158,157 Q151,160 147,156 Z" fill="url(#${id('skin')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M151,141.5 q3,2 3,5 M155,142 q3,2 3,5 M150,148 q3,1.5 3.5,4.5 M154.5,148.5 q3,1.5 3.5,4.5" fill="none" stroke="#c9775a" stroke-width="1"/>
      <path d="M146,147 Q151,144 156,149" fill="none" stroke="${OL}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M150,140.8 Q153,139.8 156,141" fill="none" stroke="#fff1e2" stroke-width="1" stroke-linecap="round"/>
      <!-- fur mantle over the shoulder -->
      ${furShoulder(id, 131, 126, 0.95)}
    </g>`;
  }

  /* ---------------- head ---------------- */
  function braid(x, y, n, dx, col, sh) {
    // chain of chevron lobes going down; returns string
    var s = '';
    for (var i = 0; i < n; i++) {
      var cx = x + dx * i, cy = y + i * 4.2;
      s += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="3.4" ry="2.8" fill="${col}" stroke="${OL}" stroke-width="1.3"/>`;
      s += `<path d="M${(cx - 2.4).toFixed(1)},${(cy - 0.8).toFixed(1)} Q${cx.toFixed(1)},${(cy + 1.4).toFixed(1)} ${(cx + 2.4).toFixed(1)},${(cy - 0.8).toFixed(1)}" fill="none" stroke="${sh}" stroke-width="0.8"/>`;
    }
    return s;
  }

  function bead(x, y, kind, id) {
    var g = kind === 'b' ? id('bronze') : id('silver');
    return `<rect x="${x - 3}" y="${y - 2.4}" width="6" height="4.8" rx="1.6" fill="url(#${g})" stroke="${OL}" stroke-width="1.1"/>
      <path d="M${x - 2},${y - 1.2} L${x + 1.2},${y - 1.2}" stroke="#ffffff" stroke-width="0.7" stroke-linecap="round"/>
      <path d="M${x - 3},${y} L${x + 3},${y}" stroke="${kind === 'b' ? '#8e5a1d' : '#6d7885'}" stroke-width="0.5"/>`;
  }

  function helmet(id) {
    var bandRivets = '';
    var pts = [[98,27],[101,34],[103.5,42],[105,50],[106,57],[93,29],[84,33],[76,40],[69,49],[64,58]];
    for (var i = 0; i < pts.length; i++) {
      bandRivets += `<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="1.2" fill="#eef1f4" stroke="${OL}" stroke-width="0.5"/>`;
    }
    var browRivets = '';
    for (var j = 0; j < 9; j++) {
      var bx = 60 + j * 10;
      var by = 67 - Math.sin((j / 8) * Math.PI) * 4.2;
      browRivets += `<circle cx="${bx}" cy="${by.toFixed(1)}" r="1.1" fill="#eef1f4" stroke="${OL}" stroke-width="0.5"/>`;
    }
    return `
    <!-- dome -->
    <path d="M55,68 C52,38 73,23 98,23 C123,23 144,38 141,68 Z" fill="url(#${id('helm')})" stroke="${OL}" stroke-width="3.4" stroke-linejoin="round"/>
    <!-- side shadow -->
    <path d="M128,32 Q144,44 141,68 L128,68 Q134,48 128,32 Z" fill="#3e4652" opacity="0.4"/>
    <!-- hammer marks -->
    <g fill="#ffffff" opacity="0.35"><circle cx="88" cy="40" r="1"/><circle cx="116" cy="44" r="1.1"/><circle cx="92" cy="54" r="0.9"/><circle cx="120" cy="56" r="0.8"/></g>
    <g fill="#4f5864" opacity="0.35"><circle cx="112" cy="36" r="0.9"/><circle cx="82" cy="50" r="0.9"/><circle cx="126" cy="50" r="0.9"/></g>
    <!-- crown bands: front-to-back and side band -->
    <path d="M96,24 Q104,38 107,62 L102,62 Q100,40 91,25 Z" fill="url(#${id('iron')})" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M95,24 Q74,32 62,64 L57,63 Q66,30 90,23 Z" fill="url(#${id('iron')})" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>
    ${bandRivets}
    <!-- highlight -->
    <path d="M68,48 Q72,36 84,30" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" opacity="0.9"/>
    <circle cx="66" cy="55" r="1.6" fill="#ffffff" opacity="0.85"/>
    <!-- top spike -->
    <path d="M94,25 L97,15 Q98,13 99,15 L102,25 Z" fill="url(#${id('iron')})" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M97,23 L98,16" stroke="#ffffff" stroke-width="0.8" stroke-linecap="round"/>
    <ellipse cx="98" cy="25" rx="6" ry="2.2" fill="url(#${id('iron')})" stroke="${OL}" stroke-width="1.6"/>
    <!-- brow band -->
    <path d="M53,63 Q98,54 143,63 L143,72 Q98,63 53,72 Z" fill="url(#${id('iron')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M56,65.5 Q98,57 140,65.5" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.8"/>
    ${browRivets}`;
  }

  function spectacles(id) {
    return `
    <!-- spectacle guard with nasal -->
    <path fill-rule="evenodd" fill="url(#${id('iron')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"
      d="M78,68 L132,68 L132,86 Q132,98 119,98 Q112,98 109.5,93 L108.5,101 Q106,104.5 103.5,101 L102.5,93 Q99,98 91,98 Q78,98 78,86 Z
         M82.5,86 a8.5,9 0 1,0 17,0 a8.5,9 0 1,0 -17,0 Z
         M110.5,86 a8.5,9 0 1,0 17,0 a8.5,9 0 1,0 -17,0 Z"/>
    <path d="M80.5,84 Q80,78 84,75 M106,92 L106,100" fill="none" stroke="#ffffff" stroke-width="1.1" stroke-linecap="round" opacity="0.85"/>
    <path d="M129.5,82 Q130,93 121,96" fill="none" stroke="#3e4652" stroke-width="1.4" opacity="0.6"/>
    <g fill="#eef1f4" stroke="${OL}" stroke-width="0.45">
      <circle cx="80.4" cy="92" r="0.9"/><circle cx="91" cy="96.2" r="0.9"/><circle cx="119" cy="96.2" r="0.9"/><circle cx="129.8" cy="92" r="0.9"/>
      <circle cx="106" cy="97" r="0.9"/>
    </g>`;
  }

  function eye(cx, cy, id) {
    return `
      <g>
        <ellipse cx="${cx}" cy="${cy}" rx="5.2" ry="6.4" fill="${OL}"/>
        <ellipse cx="${cx + 0.5}" cy="${cy + 1.2}" rx="3.9" ry="4.8" fill="url(#${id('iris')})"/>
        <circle cx="${cx + 0.7}" cy="${cy + 1}" r="1.8" fill="${OL}"/>
        <circle cx="${cx - 1.7}" cy="${cy - 2.6}" r="2.1" fill="#ffffff"/>
        <circle cx="${cx + 2.2}" cy="${cy + 3.3}" r="0.95" fill="#ffffff"/>
      </g>`;
  }

  function face(id, withClasses) {
    var ec = withClasses ? ' class="part-eyes" style="transform-origin: 105px 87px"' : '';
    return `
    <!-- ear -->
    <path d="M71,82 Q63,78 63,87 Q64,95 72,94" fill="url(#${id('skin')})" stroke="${OL}" stroke-width="2.2"/>
    <path d="M69,84 Q66,87 69,91" fill="none" stroke="#d98e6a" stroke-width="1"/>
    <circle cx="67" cy="94.5" r="1.4" fill="none" stroke="url(#${id('silver')})" stroke-width="1"/>
    <!-- face -->
    <path d="M70,72 Q70,64 80,64 L124,64 Q137,64 137,76 L137,96 Q137,116 112,116 L92,116 Q70,116 70,96 Z" fill="url(#${id('skin')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
    <!-- ginger fringe under the brow band -->
    <path d="M71,74 Q74,68 79,70 Q82,75 86,70 Q90,74 94,70 L96,68 L71,68 Z" fill="#dc6d2a" stroke="${OL}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M126,68 Q130,74 134,70 Q136,74 137,78 L137,68 Z" fill="#dc6d2a" stroke="${OL}" stroke-width="1.4" stroke-linejoin="round"/>
    <!-- helm shadow on the face -->
    <path d="M70,76 Q104,68 137,76 L137,71 Q104,63 70,71 Z" fill="#000" opacity="0.18"/>
    <!-- eyes -->
    <g${ec}>
      ${eye(91, 87, id)}
      ${eye(118, 87, id)}
    </g>
    ${spectacles(id)}
    <!-- bushy fierce brows (over the guard) -->
    <path d="M82,76.5 Q88,74 99,79.5 L98,82 Q89,78.5 83,79.5 Z" fill="#e0782e" stroke="${OL}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M111,79.5 Q121,74 128,76 L127.5,79 Q121,78 112,82 Z" fill="#e0782e" stroke="${OL}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M85,77 l2,1 M89,77 l2,1.2 M114,79 l2,-1.2 M118,77.3 l2,-1" stroke="#ffb56b" stroke-width="0.7" stroke-linecap="round"/>
    <!-- blush + war-paint smudge -->
    <ellipse cx="85" cy="103" rx="4.4" ry="2.4" fill="#ff8a7a" opacity="0.6"/>
    <ellipse cx="127" cy="103" rx="4.2" ry="2.4" fill="#ff8a7a" opacity="0.6"/>
    <path d="M123,100 l2.5,-1.8 M126,101 l2.5,-1.8" stroke="#2f5b8f" stroke-width="1.2" stroke-linecap="round" opacity="0.85"/>
    <!-- nose tip under the nasal -->
    <path d="M102.5,101 Q106,108 110,102" fill="#f4b58c" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M104.5,103.2 Q106,104.4 107.5,103.4" fill="none" stroke="#ffffff" stroke-width="0.8" stroke-linecap="round" opacity="0.8"/>`;
  }

  function beard(id) {
    var strands = '';
    var ss = [[76,104,2,10,6,18],[82,108,1,10,5,20],[90,112,0,12,3,20],[118,112,0,12,-2,20],[126,108,-1,10,-4,18],[131,102,-2,10,-5,16],[98,120,0,8,1,14],[112,120,0,8,-1,14]];
    for (var i = 0; i < ss.length; i++) {
      var p = ss[i];
      strands += `M${p[0]},${p[1]} q${p[2]},${p[3]} ${p[4]},${p[5]} `;
    }
    return `
    <!-- side braids of hair (behind beard, from under the helm) -->
    <g>
      <path d="M62,70 Q58,86 62,100 L68,98 Q66,84 69,72 Z" fill="#dc6d2a" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
      ${braid(64, 102, 5, -0.4, '#e27a34', '#a9461a')}
      ${bead(62.2, 124, 's', id)}
      <path d="M60,127 Q60,132 58,135 M62,127 Q62.5,132 62,136 M64,127 Q65,131 66,134" fill="none" stroke="#dc6d2a" stroke-width="1.6" stroke-linecap="round"/>
    </g>
    <!-- great beard -->
    <path d="M69,80 L74,80 Q75,98 86,105 Q96,109 106,107 Q118,109 127,104 Q135,97 135,80 L140,80 Q143,108 133,126 Q124,141 106,143 Q86,141 77,127 Q66,110 69,80 Z"
          fill="url(#${id('beard')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
    <path d="${strands}" fill="none" stroke="#a9461a" stroke-width="1.2" stroke-linecap="round" opacity="0.85"/>
    <path d="M79,100 q2,8 6,14 M86,108 q1,8 4,14 M124,108 q-1,8 -4,13 M130,100 q-1,8 -4,14" fill="none" stroke="#ffb56b" stroke-width="1.1" stroke-linecap="round" opacity="0.85"/>
    <path d="M71,86 Q70,100 74,110" fill="none" stroke="#ffc58a" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>
    <!-- twin braided beard tails with beads -->
    <g>
      ${braid(97, 138, 3, -0.3, '#dc6d2a', '#a9461a')}
      ${bead(96.1, 151.5, 'b', id)}
      <path d="M93.5,154 Q93,158 91.5,160 M96,154 Q96,159 95.5,161 M98.5,154 Q99.5,158 100,160" fill="none" stroke="#c75a22" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M93.5,154 Q93,158 91.5,160 M96,154 Q96,159 95.5,161 M98.5,154 Q99.5,158 100,160" fill="none" stroke="${OL}" stroke-width="0.4" stroke-linecap="round" opacity="0.6"/>
      ${braid(115, 138, 3, 0.3, '#dc6d2a', '#a9461a')}
      ${bead(115.9, 151.5, 's', id)}
      <path d="M113.5,154 Q113,158 112,160 M116,154 Q116,159 116.5,161 M118.5,154 Q119.5,158 120.5,160" fill="none" stroke="#c75a22" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M113.5,154 Q113,158 112,160 M116,154 Q116,159 116.5,161 M118.5,154 Q119.5,158 120.5,160" fill="none" stroke="${OL}" stroke-width="0.4" stroke-linecap="round" opacity="0.6"/>
    </g>
    <!-- mouth: big friendly battle-grin -->
    <path d="M97,112 Q106,122 116,112 Q106,115 97,112 Z" fill="#7a2222" stroke="${OL}" stroke-width="1.7" stroke-linejoin="round"/>
    <path d="M98.5,112.6 Q106,115.4 114.5,112.6 L113.5,114.6 Q106,116.8 99.5,114.6 Z" fill="#ffffff"/>
    <path d="M101,117 Q106,119.5 111,117" fill="none" stroke="#ff8f8f" stroke-width="1.2" stroke-linecap="round"/>
    <!-- braided moustache -->
    <path d="M106,103.5 Q96,101 88,106 Q83,110 84,116 L88.5,114.5 Q90,109 97,108 Q102,107.5 106,109 Q110,107.5 115,108 Q122,109 123.5,114.5 L128,116 Q129,110 124,106 Q116,101 106,103.5 Z"
          fill="#e8813a" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M104,104.6 Q96,103.4 90,107.5 M108,104.6 Q116,103.4 122,107.5" fill="none" stroke="#ffc58a" stroke-width="1" stroke-linecap="round"/>
    ${braid(86, 118.5, 2, -0.3, '#e8813a', '#a9461a')}
    ${braid(126, 118.5, 2, 0.3, '#e8813a', '#a9461a')}
    ${bead(85.7, 127.5, 'b', id)}
    ${bead(126.3, 127.5, 'b', id)}`;
  }

  function aventail(id) {
    return `
    <!-- short mail aventail hanging from the helm at back and side -->
    <path d="M53,68 L70,70 L70,96 Q64,104 56,102 Q50,100 50,90 Z" fill="url(#${id('mail')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M51,92 Q58,98 69,94" fill="none" stroke="#d3dae2" stroke-width="0.7" stroke-dasharray="1.3 1.3"/>
    <path d="M137,70 L143,68 L144,86 Q141,92 137,90 Z" fill="url(#${id('mail')})" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>`;
  }

  function head(id, withClasses) {
    var hc = withClasses ? ' class="part-head" style="transform-origin: 100px 118px"' : '';
    return `
    <g${hc}>
      ${aventail(id)}
      ${face(id, withClasses)}
      ${helmet(id)}
      ${beard(id)}
    </g>`;
  }

  function backArm(id) {
    return `
    <!-- off arm tucked behind the shield -->
    <path d="M62,124 Q54,132 56,150 L68,152 Q66,138 72,128 Z" fill="url(#${id('tunic')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M62,124 L74,122 L73,132 Q68,135 63,133 Z" fill="url(#${id('mail')})" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>`;
  }

  function body(id) {
    return `
    <g class="part-body">
      ${backArm(id)}
      ${torso(id)}
      ${wolfHead(id)}
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
    ${cape(id)}
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
        <stop offset="0" stop-color="#d6e6f5"/>
        <stop offset="1" stop-color="#6b8fb3"/>
      </radialGradient>
      <clipPath id="${id('pclip')}"><rect x="0" y="0" width="120" height="120" rx="14"/></clipPath>
    </defs>
    <g clip-path="url(#${id('pclip')})">
      <rect x="0" y="0" width="120" height="120" fill="url(#${id('pbg')})"/>
      <circle cx="60" cy="54" r="44" fill="#ffffff" opacity="0.14"/>
      <!-- snowy peaks -->
      <path d="M0,100 L22,80 L36,92 L58,70 L80,94 L96,82 L120,100 L120,120 L0,120 Z" fill="#3f5f82" opacity="0.45"/>
      <path d="M52,76 L58,70 L64,77 L60,75 L57,78 Z M18,84 L22,80 L26,84 L22,83 Z" fill="#ffffff" opacity="0.7"/>
      <g transform="translate(0,-2) scale(0.62)">
        <path d="M48,124 Q97,108 148,124 L156,200 L40,200 Z" fill="url(#${id('mail')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
        ${furShoulder(id, 136, 128, 1.35)}
        ${furShoulder(id, 58, 128, 1.35)}
        ${head(id, false)}
      </g>
    </g>
  </svg>`;
  }

  window.HEROES = window.HEROES || {};
  window.HEROES.viking = {
    key: 'viking',
    name: 'Bjorn',
    title: 'The Viking Berserker',
    lore: 'Bjorn sailed from the northern fjords with a wolf on his shoulders and a song in his beard. When the battle-fury takes him, even the storm gods give him room.',
    color: '#6b8fb3',
    base: { hp: 560, atk: 105, def: 18 },
    fx: { slash: '#bfe6ff', glow: '#f2fbff' },
    signature: { name: 'Berserkergang', desc: 'The lower your HP, the harder you hit — up to +60% ATK.', type: 'rage' },
    svg: svg,
    portrait: portrait
  };
})();

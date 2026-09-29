/* Hero Go! — Sir Aldric, The Knight (key: knight)
 * Hand-authored inline SVG. See ART_CONTRACT.md.
 */
(function () {
  var OL = '#2b1d14';
  var FACE = 'M64,74 Q64,62 77,62 L122,62 Q135,62 135,74 L135,92 Q135,113 111,113 L88,113 Q64,113 64,92 Z';

  function mk(uid) {
    uid = uid == null ? '' : String(uid);
    return function (n) { return 'knight-' + n + '-' + uid; };
  }

  /* ---------------- defs ---------------- */
  function defs(id) {
    return `
    <defs>
      <linearGradient id="${id('steel')}" x1="0" y1="0" x2="1" y2="0.3">
        <stop offset="0" stop-color="#f7fafd"/>
        <stop offset="0.35" stop-color="#d3dce7"/>
        <stop offset="0.7" stop-color="#9ba9bb"/>
        <stop offset="1" stop-color="#6c7b8f"/>
      </linearGradient>
      <linearGradient id="${id('steelv')}" x1="0" y1="0" x2="0.25" y2="1">
        <stop offset="0" stop-color="#f4f8fc"/>
        <stop offset="0.45" stop-color="#c3cedb"/>
        <stop offset="1" stop-color="#76869b"/>
      </linearGradient>
      <radialGradient id="${id('helm')}" cx="0.36" cy="0.26" r="0.8">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset="0.28" stop-color="#dfe6ee"/>
        <stop offset="0.65" stop-color="#a7b4c4"/>
        <stop offset="1" stop-color="#66758a"/>
      </radialGradient>
      <radialGradient id="${id('pauld')}" cx="0.35" cy="0.3" r="0.85">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset="0.35" stop-color="#d4dde8"/>
        <stop offset="1" stop-color="#76869b"/>
      </radialGradient>
      <linearGradient id="${id('blue')}" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stop-color="#5a97f2"/>
        <stop offset="0.5" stop-color="#2e6fd8"/>
        <stop offset="1" stop-color="#1c4696"/>
      </linearGradient>
      <linearGradient id="${id('cape')}" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2a63c6"/>
        <stop offset="0.6" stop-color="#1f4ea8"/>
        <stop offset="1" stop-color="#173a80"/>
      </linearGradient>
      <linearGradient id="${id('capein')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#b8263a"/>
        <stop offset="1" stop-color="#7c1426"/>
      </linearGradient>
      <linearGradient id="${id('gold')}" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0" stop-color="#fff3b4"/>
        <stop offset="0.45" stop-color="#f4c64f"/>
        <stop offset="1" stop-color="#b5822a"/>
      </linearGradient>
      <linearGradient id="${id('blade')}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset="0.46" stop-color="#e3ebf4"/>
        <stop offset="0.54" stop-color="#a3b3c6"/>
        <stop offset="1" stop-color="#7a8aa0"/>
      </linearGradient>
      <linearGradient id="${id('leather')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#9a6234"/>
        <stop offset="1" stop-color="#5e3719"/>
      </linearGradient>
      <radialGradient id="${id('skin')}" cx="0.45" cy="0.4" r="0.7">
        <stop offset="0" stop-color="#ffe6cf"/>
        <stop offset="0.75" stop-color="#ffd3ae"/>
        <stop offset="1" stop-color="#f1b48a"/>
      </radialGradient>
      <radialGradient id="${id('gem')}" cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stop-color="#ffd0d6"/>
        <stop offset="0.4" stop-color="#e3314d"/>
        <stop offset="1" stop-color="#7a0f22"/>
      </radialGradient>
      <radialGradient id="${id('bgem')}" cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stop-color="#e2f4ff"/>
        <stop offset="0.45" stop-color="#3d8cf0"/>
        <stop offset="1" stop-color="#16408e"/>
      </radialGradient>
      <radialGradient id="${id('boss')}" cx="0.35" cy="0.3" r="0.75">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset="0.4" stop-color="#fbe089"/>
        <stop offset="1" stop-color="#a8761f"/>
      </radialGradient>
      <radialGradient id="${id('glint')}" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#ffffff" stop-opacity="1"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
      <pattern id="${id('mail')}" width="4" height="4" patternUnits="userSpaceOnUse">
        <rect width="4" height="4" fill="#8391a4"/>
        <circle cx="1" cy="1" r="1.25" fill="none" stroke="#dde5ee" stroke-width="0.6"/>
        <circle cx="3" cy="3" r="1.25" fill="none" stroke="#c2ccd8" stroke-width="0.6"/>
        <circle cx="1" cy="1" r="1.25" fill="none" stroke="#4a5566" stroke-width="0.25" stroke-dasharray="1 1"/>
        <circle cx="3" cy="1" r="0.5" fill="#39465a" opacity="0.65"/>
        <circle cx="1" cy="3" r="0.5" fill="#39465a" opacity="0.65"/>
        <path d="M0.3,0.6 A1.2,1.2 0 0 1 1.6,0.2" stroke="#ffffff" stroke-width="0.35" fill="none" opacity="0.9"/>
      </pattern>
      <pattern id="${id('twill')}" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
        <rect width="4" height="4" fill="#ffffff" opacity="0"/>
        <path d="M0,1 H4" stroke="#0f2a66" stroke-width="0.7" opacity="0.22"/>
        <path d="M0,3 H4" stroke="#9cc4ff" stroke-width="0.5" opacity="0.2"/>
      </pattern>
      <pattern id="${id('grain')}" width="5" height="5" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1.2" r="0.5" fill="#2b1608" opacity="0.35"/>
        <circle cx="3.6" cy="3" r="0.45" fill="#e0a86e" opacity="0.3"/>
        <path d="M0.5,4 Q2,3.2 3,4.4" stroke="#2b1608" stroke-width="0.35" fill="none" opacity="0.3"/>
      </pattern>
      <pattern id="${id('hammer')}" width="7" height="7" patternUnits="userSpaceOnUse">
        <circle cx="1.6" cy="1.8" r="1.1" fill="#ffffff" opacity="0.16"/>
        <circle cx="5.2" cy="4.6" r="1.2" fill="#3c4a5e" opacity="0.13"/>
        <path d="M0.5,6 L3,5.2 M4,1 L6.5,0.4" stroke="#ffffff" stroke-width="0.4" opacity="0.3"/>
      </pattern>
      <pattern id="${id('lining')}" width="6" height="6" patternUnits="userSpaceOnUse">
        <path d="M3,0.8 L5,3 L3,5.2 L1,3 Z" fill="none" stroke="#e8a1ab" stroke-width="0.5" opacity="0.55"/>
        <circle cx="3" cy="3" r="0.5" fill="#f4c64f" opacity="0.7"/>
      </pattern>
      <pattern id="${id('stripe')}" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(-25)">
        <path d="M0,0.8 H3" stroke="#ffffff" stroke-width="0.45" opacity="0.16"/>
      </pattern>
      <clipPath id="${id('capeclip')}">
        <path d="M76,116 C62,140 40,168 16,205 Q30,198 44,207 Q60,198 76,207 Q96,196 116,203 Q127,201 132,196 L122,120 Z"/>
      </clipPath>
      <clipPath id="${id('shieldclip')}">
        <path d="M27,131 Q50,120 73,131 Q76,166 50,206 Q24,166 27,131Z"/>
      </clipPath>
      <clipPath id="${id('tabclip')}">
        <path d="M76,121 L116,121 L119,168 L123,194 Q110,198 99,192 L95,186 L91,192 Q80,198 68,194 L72,168Z"/>
      </clipPath>
    </defs>`;
  }

  /* ---------------- cape (behind) ---------------- */
  function cape(id) {
    return `
    <g class="part-cape" style="transform-origin: 96px 120px">
      <!-- inner lining -->
      <path d="M74,118 C58,142 34,172 12,210 Q28,203 42,213 Q58,204 74,213 Q96,202 118,208 Q130,206 136,200 L120,122 Z"
            fill="url(#${id('capein')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
      <!-- outer cape -->
      <path d="M76,116 C62,140 40,168 16,205 Q30,198 44,207 Q60,198 76,207 Q96,196 116,203 Q127,201 132,196 L122,120 Z"
            fill="url(#${id('cape')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M74,118 C58,142 34,172 12,210 Q28,203 42,213 Q58,204 74,213 Q96,202 118,208 Q130,206 136,200 L120,122 Z" fill="url(#${id('lining')})" opacity="0.9"/>
      <g clip-path="url(#${id('capeclip')})">
        <rect x="10" y="110" width="130" height="105" fill="url(#${id('twill')})"/>
        <rect x="10" y="110" width="130" height="105" fill="url(#${id('stripe')})"/>
        <!-- ambient occlusion under the shoulders and along the fold valleys -->
        <path d="M70,116 L124,118 L124,146 Q96,132 66,140 Z" fill="#0c204d" opacity="0.5"/>
        <path d="M14,206 C40,176 62,146 78,120 L64,122 C50,150 30,182 14,206Z" fill="#0c204d" opacity="0.3"/>
        <path d="M100,132 C98,156 94,180 90,204 L112,204 L118,130Z" fill="#0c204d" opacity="0.28"/>
        <!-- reflected light on the rim -->
        <path d="M124,124 L132,196" stroke="#6da4ff" stroke-width="2" opacity="0.45"/>
        <!-- threadbare patch, mended -->
        <g transform="translate(58,176) rotate(-14)">
          <rect x="-5" y="-4" width="10" height="8" rx="1" fill="#3f78d6" stroke="#0f2a66" stroke-width="0.6"/>
          <rect x="-5" y="-4" width="10" height="8" rx="1" fill="none" stroke="#e9dcc0" stroke-width="0.5" stroke-dasharray="1.2 1"/>
          <path d="M-3,-1 L3,1 M-3,1 L3,3" stroke="#e9dcc0" stroke-width="0.4"/>
        </g>
      </g>
      <!-- fold shading second layer -->
      <path d="M70,140 C62,160 50,182 40,204" fill="none" stroke="#0c204d" stroke-width="3.4" stroke-linecap="round" opacity="0.28"/>
      <path d="M110,150 C110,170 106,188 100,202" fill="none" stroke="#0c204d" stroke-width="3" stroke-linecap="round" opacity="0.25"/>
      <path d="M66,138 C58,158 44,180 26,203" fill="none" stroke="#8fbaff" stroke-width="1" stroke-linecap="round" opacity="0.45"/>
      <!-- folds -->
      <path d="M78,128 C68,150 50,176 32,200" fill="none" stroke="#153472" stroke-width="2.2" stroke-linecap="round" opacity="0.8"/>
      <path d="M92,130 C88,154 80,180 72,204" fill="none" stroke="#153472" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
      <path d="M84,126 C76,148 62,172 50,198" fill="none" stroke="#5a8fe6" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>
      <path d="M100,132 C98,156 94,180 90,200" fill="none" stroke="#5a8fe6" stroke-width="1.4" stroke-linecap="round" opacity="0.5"/>
      <!-- gold trim along hem -->
      <path d="M18,202 Q31,195 44,203 Q60,194 76,203 Q96,192 116,199 Q126,198 131,193" fill="none" stroke="url(#${id('gold')})" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M18,202 Q31,195 44,203 Q60,194 76,203 Q96,192 116,199 Q126,198 131,193" fill="none" stroke="#8a5e18" stroke-width="0.8" stroke-dasharray="2 2.5"/>
      <!-- embroidery: little gold fleurs above the hem -->
      <g fill="#f4c64f" stroke="#8a5e18" stroke-width="0.5">
        <path d="M44,190 l2,-4 l2,4 l-2,2z"/><circle cx="46" cy="193.5" r="0.9"/>
        <path d="M62,190 l2,-4 l2,4 l-2,2z"/><circle cx="64" cy="193.5" r="0.9"/>
        <path d="M80,190 l2,-4 l2,4 l-2,2z"/><circle cx="82" cy="193.5" r="0.9"/>
        <path d="M97,186 l2,-4 l2,4 l-2,2z"/><circle cx="99" cy="189.5" r="0.9"/>
      </g>
      <path d="M38,194 Q46,188 54,194 Q62,188 70,194 Q78,188 86,194 Q94,186 104,190" fill="none" stroke="#f4c64f" stroke-width="0.9" opacity="0.8"/>
      <!-- frayed hem ticks and stitch line -->
      <path d="M22,209 l-1,3 M34,207 l0,3 M50,209 l1,3 M66,208 l0,3 M82,207 l-1,3 M104,206 l0,3 M121,205 l1,3" stroke="#7c1426" stroke-width="0.9" stroke-linecap="round"/>
      <path d="M20,196 Q31,190 44,197 Q60,188 76,197 Q96,187 116,193 Q124,192 129,188" fill="none" stroke="#fff3b4" stroke-width="0.5" stroke-dasharray="1 1.6" opacity="0.8"/>
      <!-- clasp cord at neck -->
      <path d="M78,119 Q96,126 118,120" fill="none" stroke="url(#${id('gold')})" stroke-width="2.2"/>
      <path d="M78,119 Q96,126 118,120" fill="none" stroke="#8a5e18" stroke-width="0.6" stroke-dasharray="1 1.3"/>
      <!-- trailing edge trim -->
      <path d="M76,118 C62,140 40,168 18,201" fill="none" stroke="#f4c64f" stroke-width="1.6" stroke-linecap="round" opacity="0.9"/>
    </g>`;
  }

  /* ---------------- legs ---------------- */
  function leg(id, dx) {
    var x = dx;
    return `
    <g transform="translate(${x},0)">
      <!-- chainmail at knee back -->
      <rect x="74" y="186" width="18" height="12" fill="url(#${id('mail')})" stroke="${OL}" stroke-width="2"/>
      <!-- greave -->
      <path d="M74,194 L92,194 L91,216 L75,216 Z" fill="url(#${id('steel')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M78,198 L78,213" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.85"/>
      <path d="M88,198 L87.5,213" stroke="#6c7b8f" stroke-width="1.3" stroke-linecap="round" opacity="0.7"/>
      <path d="M75,196 L91,196 L91,201 L75,201Z" fill="#2b1d14" opacity="0.28"/>
      <path d="M75,195 L91,195 L90.6,216 L75.4,216 Z" fill="url(#${id('hammer')})"/>
      <path d="M85,200 L84.6,212" stroke="#ffffff" stroke-width="0.7" opacity="0.6"/>
      <path d="M80,205 l3,-1.5 M82,209 l4,-1" stroke="#56647a" stroke-width="0.6" stroke-linecap="round"/>
      <!-- greave strap + buckle -->
      <path d="M74.5,205 L91.5,205 L91.5,208.5 L74.5,208.5Z" fill="url(#${id('leather')})" stroke="${OL}" stroke-width="1.2"/>
      <path d="M76,206.8 L90,206.8" stroke="#e0a86e" stroke-width="0.4" stroke-dasharray="1 1"/>
      <rect x="82" y="204.4" width="3.6" height="5" rx="0.8" fill="url(#${id('gold')})" stroke="${OL}" stroke-width="0.8"/>
      <circle cx="76.5" cy="200" r="0.8" fill="url(#${id('gold')})" stroke="${OL}" stroke-width="0.4"/>
      <circle cx="89.5" cy="200" r="0.8" fill="url(#${id('gold')})" stroke="${OL}" stroke-width="0.4"/>
      <!-- poleyn (knee cop) with side wing -->
      <path d="M90,190 q8,2 6,10 q-5,-2 -8,-4z" fill="url(#${id('steelv')})" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
      <ellipse cx="83" cy="194" rx="9.5" ry="6.5" fill="url(#${id('pauld')})" stroke="${OL}" stroke-width="2.6"/>
      <path d="M76,195 Q83,199 90,195" fill="none" stroke="#f4c64f" stroke-width="1.3"/>
      <circle cx="83" cy="193" r="1.6" fill="url(#${id('gold')})" stroke="${OL}" stroke-width="0.7"/>
      <ellipse cx="83" cy="194" rx="9.5" ry="6.5" fill="url(#${id('hammer')})"/>
      <path d="M77.5,191 q1.5,-2.5 5,-3.2" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.85"/>
      <path d="M84,190 q3,0.5 4.5,3 M79,196.5 q3,1.5 7,0" fill="none" stroke="#e0a93a" stroke-width="0.5" stroke-linecap="round"/>
      <path d="M86,197 Q90,196 91,193" fill="none" stroke="#56647a" stroke-width="1.2" opacity="0.5"/>
      <!-- sabaton -->
      <path d="M72,213 L92,213 Q101,216 106,222 Q108,229 101,229 L72,229 Q69,222 72,213 Z"
            fill="url(#${id('steelv')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M80,214 Q81,221 80,229 M87,214 Q89,221 88,229 M94,216 Q96,222 95,229" fill="none" stroke="#56647a" stroke-width="1.4"/>
      <path d="M74,217 Q84,215 94,218" fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" opacity="0.9"/>
      <circle cx="76" cy="222" r="1" fill="#f4c64f" stroke="${OL}" stroke-width="0.5"/>
      <path d="M72,213 L92,213 Q101,216 106,222 Q108,229 101,229 L72,229 Q69,222 72,213 Z" fill="url(#${id('hammer')})"/>
      <circle cx="80" cy="218" r="0.8" fill="#f4c64f" stroke="${OL}" stroke-width="0.4"/><circle cx="88" cy="217" r="0.8" fill="#f4c64f" stroke="${OL}" stroke-width="0.4"/><circle cx="95.5" cy="219.5" r="0.8" fill="#f4c64f" stroke="${OL}" stroke-width="0.4"/>
      <path d="M79.5,215 Q80.5,221 79.5,228 M86.5,215 Q88.5,221 87.5,228 M93.5,217 Q95.5,222 94.5,228" fill="none" stroke="#ffffff" stroke-width="0.5" opacity="0.6" transform="translate(1,0)"/>
      <path d="M100,222 q4,1 4,5" fill="none" stroke="#ffffff" stroke-width="1" stroke-linecap="round" opacity="0.7"/>
      <!-- mud splashes and scuffs -->
      <path d="M74,229 Q77,224.5 82,227.5 Q86,225 90,229Z" fill="#6b4a2b" opacity="0.75"/>
      <circle cx="99" cy="227" r="1" fill="#6b4a2b" opacity="0.7"/><circle cx="84" cy="221.5" r="0.7" fill="#6b4a2b" opacity="0.6"/>
      <path d="M96,225 l3,-2 M100,218 l2,1.5" stroke="#3c4a5e" stroke-width="0.6" stroke-linecap="round"/>
      <path d="M72,226 L104,226" stroke="#3b2a1d" stroke-width="1.2" opacity="0.5"/>
    </g>`;
  }

  /* ---------------- torso ---------------- */
  function lion(id) {
    // gold lion rampant (local 0..30 x 0..36)
    return `
    <g transform="translate(81,127) scale(0.95)" fill="url(#${id('gold')})" stroke="#6b4510" stroke-width="0.9" stroke-linejoin="round">
      <path d="M8,28 Q-1,26 1.5,17 Q3,12.5 6.5,14.5 Q3,19 6,23 Q8,25 9.5,26 Z"/>
      <path d="M4,14 q-2.5,-1 -2.8,-3.6 q2.5,0.4 3.4,2.4z"/>
      <path d="M12,12 Q20,11 21.5,18 Q22.5,26 17,30 L20,35 L14.5,35 L13,31.5 Q10.5,33 8.5,35.5 L3.5,35.5 L7.2,30 Q5.5,21 12,12 Z"/>
      <path d="M20,15 L26.5,9.5 L29,11 L27.5,13 L22,19 Z"/>
      <path d="M21,20.5 L28,18.5 L29.5,20.5 L28,22.3 L21.5,24 Z"/>
      <path d="M13,4 Q17,-0.5 22,1.5 Q27,3.5 25.5,9 Q24,13 19,13.5 Q13.5,13.5 12,9.5 Q11,6.5 13,4 Z"/>
      <path d="M22.5,4.5 L27.5,6 L26,9 L23,9 Z"/>
      <circle cx="22" cy="5.8" r="0.9" fill="#6b4510" stroke="none"/>
      <path d="M26.5,8.5 l2.5,1.4 l-2.4,0.6z" fill="#d7263d" stroke="none"/>
      <path d="M14,5 q2,2 1,5 M16.5,3 q2,2.5 1,6 M18.5,11 q0.5,-2 2.5,-2.5" fill="none" stroke="#6b4510" stroke-width="0.7"/>
      <path d="M13,15 Q17,18 17,24" fill="none" stroke="#fff3b4" stroke-width="1" opacity="0.8"/>
      <path d="M12,7 q-3,2 -2,6 M13,10 q-3,3 -1,7 M15,13 q-3,3 -1,8 M20,12.5 q1,2 0,4.5 M16,4 q0.5,-2 3,-2.6" fill="none" stroke="#6b4510" stroke-width="0.6" stroke-linecap="round"/>
      <path d="M11,9 q3,0 5,3 M12,14 q3,1 4,4 M11.5,19 q3,1 4,5" fill="none" stroke="#fff3b4" stroke-width="0.5" opacity="0.7" stroke-linecap="round"/>
      <path d="M9,26 q1,2 2.5,2.5 M13,26 q1.5,1 3,0.5 M25,10 l1.7,-2 M27,10.5 l1.8,-1.8 M27,19 l2,-0.5 M27.8,21 l1.7,0" stroke="#fff8d8" stroke-width="0.6" stroke-linecap="round" fill="none"/>
      <path d="M6,34 l1,-3 M10,34.5 l0.5,-3 M16,34.5 l-0.5,-3 M19,34.5 l-0.5,-2.5" stroke="#6b4510" stroke-width="0.5"/>
      <path d="M24,4 q4,-3 6,-2" fill="none" stroke="#6b4510" stroke-width="0.6"/>
      <path d="M22.5,26 q4,-1 6,-6 q1,-6 -1,-9" fill="none" stroke="#6b4510" stroke-width="0.9" stroke-linecap="round"/>
    </g>`;
  }

  function torso(id) {
    return `
    <!-- chainmail skirt -->
    <path d="M68,168 L124,168 L126,196 Q96,202 66,196 Z" fill="url(#${id('mail')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M67,194 Q96,200 125,194" fill="none" stroke="#dde5ee" stroke-width="1" stroke-dasharray="1.5 1.5"/>
    <path d="M69,168 L123,168 L124,182 Q96,188 68,182Z" fill="#1c2636" opacity="0.32"/>
    <path d="M67,192 Q96,198 125,192 L126,196 Q96,202 66,196Z" fill="#ffffff" opacity="0.28"/>
    <g fill="none" stroke="#3a4658" stroke-width="0.5" opacity="0.7"><path d="M72,186 Q77,190 82,186 Q87,190 92,186 Q97,190 102,186 Q107,190 112,186 Q117,190 122,186"/></g>
    <!-- breastplate -->
    <path d="M66,124 Q96,110 126,124 L128,170 Q96,178 64,170 Z" fill="url(#${id('steel')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M70,130 Q72,150 70,166" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" opacity="0.9"/>
    <path d="M66,124 Q96,110 126,124 L128,170 Q96,178 64,170 Z" fill="url(#${id('hammer')})"/>
    <path d="M122,130 Q124,150 122,168 L128,170 L126,124Z" fill="#56647a" opacity="0.38"/>
    <path d="M67,166 Q96,174 127,166 L128,170 Q96,178 64,170Z" fill="#1c2636" opacity="0.3"/>
    <path d="M70,127 Q96,114 122,127" fill="none" stroke="#ffffff" stroke-width="0.8" opacity="0.7"/>
    <path d="M67.5,131 q0.5,4 0,8 M67,146 q0.5,4 0,7" stroke="#e0a93a" stroke-width="0.5" fill="none"/>
    <path d="M96,124 L96,158" stroke="#7f8ea2" stroke-width="0.9" opacity="0.5"/>
    <path d="M108,131 l6,-3 M112,148 l4,-1" stroke="#56647a" stroke-width="0.6" stroke-linecap="round"/>
    <circle cx="69" cy="140" r="1.3" fill="#f4c64f" stroke="${OL}" stroke-width="0.6"/>
    <g fill="#ffffff"><circle cx="68.6" cy="139.5" r="0.4"/><circle cx="68.6" cy="155.5" r="0.4"/><circle cx="122.6" cy="139.5" r="0.4"/><circle cx="122.6" cy="155.5" r="0.4"/></g>
    <circle cx="123" cy="140" r="1.3" fill="#f4c64f" stroke="${OL}" stroke-width="0.6"/>
    <circle cx="69" cy="156" r="1.3" fill="#f4c64f" stroke="${OL}" stroke-width="0.6"/>
    <circle cx="123" cy="156" r="1.3" fill="#f4c64f" stroke="${OL}" stroke-width="0.6"/>
    <!-- tabard -->
    <path d="M76,121 L116,121 L119,168 L123,194 Q110,198 99,192 L95,186 L91,192 Q80,198 68,194 L72,168 Z"
          fill="url(#${id('blue')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
    <g clip-path="url(#${id('tabclip')})">
      <rect x="66" y="118" width="62" height="84" fill="url(#${id('twill')})"/>
      <path d="M72,150 L76,121 L84,121 L82,150Z" fill="#000" opacity="0.0"/>
      <path d="M110,121 L116,121 L119,168 L123,194 L112,194 L112,150Z" fill="#0c204d" opacity="0.35"/>
      <path d="M76,121 L116,121 L115,132 Q96,126 77,132Z" fill="#0c204d" opacity="0.35"/>
      <path d="M96,183 L96,190 L91,193 L95,186Z" fill="#0c204d" opacity="0.4"/>
      <path d="M79,124 L113,124 L116,168 L120,191 Q110,194 100,189 L95,182 L90,189 Q80,194 71,191 L75,168 Z"
            fill="none" stroke="url(#${id('gold')})" stroke-width="2"/>
      <path d="M81,126 L111,126" stroke="#f4c64f" stroke-width="0.7" stroke-dasharray="1.5 1.5"/>
      <!-- fabric folds -->
      <path d="M84,172 Q82,182 80,194" fill="none" stroke="#173a80" stroke-width="1.8" opacity="0.8"/>
      <path d="M108,172 Q110,182 112,194" fill="none" stroke="#173a80" stroke-width="1.8" opacity="0.8"/>
      <path d="M79,130 Q78,150 80,164" fill="none" stroke="#7fb0ff" stroke-width="1.6" opacity="0.55"/>
      <path d="M113,130 Q115,150 113,164" fill="none" stroke="#173a80" stroke-width="1.6" opacity="0.5"/>
      <!-- threadbare spots + frays -->
      <g fill="#7fb0ff" opacity="0.4"><ellipse cx="86" cy="156" rx="2.6" ry="1.6"/><ellipse cx="106" cy="178" rx="2" ry="1.3"/></g>
      <path d="M84,155 l4,2 M85,157 l3,-3 M105,177 l3,2" stroke="#e9dcc0" stroke-width="0.4" opacity="0.6"/>
      <path d="M70,192 l-1,3 M76,193 l0,3 M84,194 l0,3 M90,192 l0,3 M100,190 l0,3 M108,193 l1,3 M117,192 l0,3" stroke="#173a80" stroke-width="0.9" stroke-linecap="round"/>
      <path d="M72,181 Q80,186 90,183 M102,183 Q110,186 119,181" fill="none" stroke="#f4c64f" stroke-width="0.6" stroke-dasharray="1 1.3"/>
      <!-- hem diamonds -->
      <g fill="#f4c64f" stroke="#8a5e18" stroke-width="0.4">
        <path d="M76,186 l2,-2.5 l2,2.5 l-2,2.5z"/>
        <path d="M86,187 l2,-2.5 l2,2.5 l-2,2.5z"/>
        <path d="M102,187 l2,-2.5 l2,2.5 l-2,2.5z"/>
        <path d="M112,186 l2,-2.5 l2,2.5 l-2,2.5z"/>
      </g>
    </g>
    ${lion(id)}
    <!-- belt -->
    <path d="M65,161 Q96,168 127,161 L127,169 Q96,176 65,169 Z" fill="url(#${id('leather')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M67,164 Q96,171 125,164" fill="none" stroke="#c78d55" stroke-width="0.7" stroke-dasharray="1.6 1.4"/>
    <path d="M67,167 Q96,174 125,167" fill="none" stroke="#3d220d" stroke-width="0.6" stroke-dasharray="1.6 1.4" opacity="0.6"/>
    <path d="M65,161 Q96,168 127,161 L127,169 Q96,176 65,169 Z" fill="url(#${id('grain')})"/>
    <path d="M65,161 Q96,168 127,161 L127,163 Q96,170 65,163 Z" fill="#000" opacity="0.18"/>
    <path d="M67,163 Q96,169.5 125,163" fill="none" stroke="#e0a86e" stroke-width="0.5" opacity="0.7"/>
    <!-- belt loop and dangling strap end -->
    <path d="M103,161.5 L106,161.5 L106,173 L103,173Z" fill="url(#${id('leather')})" stroke="${OL}" stroke-width="1"/>
    <path d="M76,168.5 L79,168 L79,176 L76,176.5Z" fill="url(#${id('leather')})" stroke="${OL}" stroke-width="1"/>
    <!-- belt studs -->
    <g fill="url(#${id('gold')})" stroke="${OL}" stroke-width="0.6">
      <circle cx="72" cy="165.5" r="1.3"/><circle cx="80" cy="167" r="1.3"/>
      <circle cx="112" cy="167" r="1.3"/><circle cx="120" cy="165.5" r="1.3"/>
    </g>
    <!-- buckle -->
    <rect x="89" y="162.5" width="13" height="11" rx="2.5" fill="url(#${id('gold')})" stroke="${OL}" stroke-width="2"/>
    <rect x="92.2" y="165.4" width="6.6" height="5.2" rx="1.2" fill="#4a2c12" stroke="#8a5e18" stroke-width="0.6"/>
    <path d="M95.5,165.6 L95.5,170.4" stroke="#fff3b4" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M91,172 L100,172 M90.5,163.6 q1,-0.6 2,0" stroke="#8a5e18" stroke-width="0.5" stroke-linecap="round" fill="none"/>
    <path d="M89.8,167 q0.6,-1 1.4,0 q-0.6,1 -1.4,0Z M100.3,167 q-0.6,-1 -1.4,0 q0.6,1 1.4,0Z" fill="#8a5e18"/>
    <circle cx="90.6" cy="163.8" r="0.5" fill="#fff"/>
    <path d="M90.5,164 L93,164" stroke="#ffffff" stroke-width="1" stroke-linecap="round"/>
    <!-- pouch -->
    <g>
      <path d="M109,168 L123,166 L124,181 Q117,185 110,182 Z" fill="url(#${id('leather')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M108.5,168 L123.5,166 L123.5,172 Q116,176 109,173 Z" fill="#b0743f" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M110.5,169.5 L122,168" stroke="#e0a86e" stroke-width="0.8" stroke-linecap="round"/>
      <path d="M111,177 Q117,180 122.5,176.5" fill="none" stroke="#3d220d" stroke-width="0.6" stroke-dasharray="1.2 1.2"/>
      <path d="M109,168 L123,166 L124,181 Q117,185 110,182 Z" fill="url(#${id('grain')})"/>
      <path d="M110.5,170.5 L110.8,181 M122.5,168.5 L123,179" stroke="#3d220d" stroke-width="0.5" stroke-dasharray="1 1"/>
      <path d="M111,180.5 Q117,183.6 122.6,179.5" fill="none" stroke="#e0a86e" stroke-width="0.4" stroke-dasharray="1 1"/>
      <path d="M109.5,174.5 Q116,178 123.5,173.5 L123.5,175.5 Q116,180 109.5,176.5Z" fill="#000" opacity="0.2"/>
      <path d="M118,171 Q121,176 119,180 L120.5,179.5" fill="none" stroke="url(#${id('gold')})" stroke-width="0.8"/>
      <circle cx="116.3" cy="173.4" r="1.4" fill="url(#${id('gold')})" stroke="${OL}" stroke-width="0.6"/>
      <circle cx="115.8" cy="172.9" r="0.4" fill="#fff"/>
    </g>
    <!-- gorget -->
    <path d="M72,118 Q96,106 120,118 L122,125 Q96,115 70,125 Z" fill="url(#${id('steelv')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M74,122 Q96,113 118,122" fill="none" stroke="#f4c64f" stroke-width="1.2"/>
    <path d="M72,118 Q96,106 120,118 L122,125 Q96,115 70,125 Z" fill="url(#${id('hammer')})"/>
    <path d="M75,119 Q96,110 117,119" fill="none" stroke="#ffffff" stroke-width="0.9" opacity="0.8"/>
    <path d="M71,124 Q96,114.5 121,124 L122,125 Q96,115 70,125Z" fill="#1c2636" opacity="0.3"/>
    <path d="M76,122.5 q2,-1 4,-1.6 M88,119.6 q2,-0.5 4,-0.8 M100,119 q2,0 4,0.4 M112,120.8 q2,0.6 4,1.6" stroke="#8a5e18" stroke-width="0.5" stroke-linecap="round" fill="none"/>
    <g fill="url(#${id('gold')})" stroke="${OL}" stroke-width="0.5">
      <circle cx="80" cy="119" r="1.1"/><circle cx="96" cy="114.5" r="1.1"/><circle cx="112" cy="119" r="1.1"/>
    </g>`;
  }

  /* ---------------- pauldron (layered lames) ---------------- */
  function pauldron(id, cx, cy, flip) {
    var s = flip ? -1 : 1;
    return `
    <g transform="translate(${cx},${cy}) scale(${s},1)">
      <!-- lower lames -->
      <path d="M-15,8 Q0,20 15,8 L15,14 Q0,26 -15,14 Z" fill="url(#${id('steelv')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M-16,2 Q0,15 16,2 L16,9 Q0,21 -16,9 Z" fill="url(#${id('steelv')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M-13,12 Q0,22 13,12" fill="none" stroke="#f4c64f" stroke-width="1"/>
      <!-- main cop -->
      <path d="M-17,4 Q-18,-14 0,-15 Q18,-14 17,4 Q0,14 -17,4 Z" fill="url(#${id('pauld')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M-14,3 Q0,11 14,3" fill="none" stroke="url(#${id('gold')})" stroke-width="2.2"/>
      <!-- filigree scrolls -->
      <path d="M-9,-2 q3,-5 7,-3 q-3,1 -2,3 M9,-2 q-3,-5 -7,-3 q3,1 2,3" fill="none" stroke="#e0a93a" stroke-width="0.9" stroke-linecap="round"/>
      <path d="M-11,-9 Q-6,-13 0,-13" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" opacity="0.95"/>
      <!-- ambient occlusion, hammered finish, ridges, engraving -->
      <path d="M-17,4 Q-18,-14 0,-15 Q18,-14 17,4 Q0,14 -17,4 Z" fill="url(#${id('hammer')})"/>
      <path d="M17,4 Q18,-14 0,-15 Q10,-8 9,6 Q14,6 17,4Z" fill="#56647a" opacity="0.4"/>
      <path d="M-16,-2 Q0,6 16,-2 L15.5,3 Q0,11 -16,3Z" fill="#1c2636" opacity="0.2"/>
      <path d="M-14,-6 Q0,-1 14,-6" fill="none" stroke="#7f8ea2" stroke-width="0.8" opacity="0.7"/>
      <path d="M-5,-14 Q-6,-5 -3,3 M5,-14 Q6,-5 3,3" fill="none" stroke="#7f8ea2" stroke-width="0.7" opacity="0.6"/>
      <path d="M-13,-4 q1.5,-4 5,-6" fill="none" stroke="#ffffff" stroke-width="0.9" stroke-linecap="round" opacity="0.8"/>
      <path d="M-6,-8 l2,-1 M4,-9 l3,-0.5 M8,-4 l3,1.5" stroke="#4a5566" stroke-width="0.5" stroke-linecap="round" opacity="0.8"/>
      <path d="M-14,4.2 Q0,12.4 14,4.2" fill="none" stroke="#ffffff" stroke-width="0.6" stroke-dasharray="0.8 1.6" stroke-linecap="round"/>
      <path d="M-15,9 Q0,20 15,9" fill="none" stroke="#1c2636" stroke-width="1" opacity="0.35"/>
      <path d="M-13.5,15 Q0,22 13.5,15" fill="none" stroke="#1c2636" stroke-width="0.9" opacity="0.3"/>
      <path d="M-15,11 Q0,22 15,11 M-14,5 q2,2 5,2.8" fill="none" stroke="#ffffff" stroke-width="0.6" opacity="0.6"/>

      <!-- rivets -->
      <g fill="url(#${id('gold')})" stroke="${OL}" stroke-width="0.6">
        <circle cx="-12" cy="3.5" r="1.3"/><circle cx="0" cy="7.5" r="1.3"/><circle cx="12" cy="3.5" r="1.3"/>
        <circle cx="-10" cy="12.5" r="1"/><circle cx="10" cy="12.5" r="1"/>
      </g>
    </g>`;
  }

  /* ---------------- shield arm ---------------- */
  function shieldArm(id) {
    return `
    <!-- back pauldron -->
    ${pauldron(id, 66, 124, true)}
    <!-- kite shield -->
    <g transform="rotate(-6 50 165)">
      <path d="M27,131 Q50,120 73,131 Q76,166 50,206 Q24,166 27,131Z" fill="#dfe6ee" stroke="${OL}" stroke-width="3.2" stroke-linejoin="round"/>
      <g clip-path="url(#${id('shieldclip')})">
        <!-- per bend: blue upper, silver lower -->
        <path d="M20,120 L80,120 L80,150 L20,196 Z" fill="url(#${id('blue')})"/>
        <path d="M20,196 L80,150 L80,152 L20,198Z" fill="#173a80" opacity="0.6"/>
        <!-- silver field shading -->
        <path d="M50,210 Q66,180 80,150 L80,210Z" fill="#9aa8ba" opacity="0.6"/>
        <!-- gold cross -->
        <path d="M46.5,120 L53.5,120 L53.5,148 L80,148 L80,155 L53.5,155 L53.5,210 L46.5,210 L46.5,155 L20,155 L20,148 L46.5,148 Z"
              fill="url(#${id('gold')})" stroke="#6b4510" stroke-width="1"/>
        <path d="M48,123 L48,146 M48,157 L48,200" stroke="#fff3b4" stroke-width="1" opacity="0.9"/>
        <!-- small fleurs in quarters -->
        <g fill="#f4c64f" stroke="#6b4510" stroke-width="0.5">
          <path d="M36,138 q2,-5 4,0 q-2,2 -4,0z M34,139 q3,1 3,3 M42,139 q-3,1 -3,3"/>
          <path d="M62,138 q2,-5 4,0 q-2,2 -4,0z"/>
        </g>
        <g fill="#2e6fd8" stroke="#173a80" stroke-width="0.5">
          <path d="M60,168 q2,-5 4,0 q-2,2 -4,0z"/>
          <path d="M37,168 q2,-5 4,0 q-2,2 -4,0z" fill="#f4c64f" stroke="#6b4510"/>
        </g>
        <!-- worn paint, hammered dents, cross engraving -->
        <rect x="20" y="120" width="60" height="90" fill="url(#${id('hammer')})"/>
        <rect x="20" y="120" width="60" height="90" fill="url(#${id('stripe')})" opacity="0.7"/>
        <path d="M50,158 L50,202 M50,122 L50,144 M22,151.5 L44,151.5 M56,151.5 L78,151.5" stroke="#8a5e18" stroke-width="0.6" stroke-dasharray="1.2 1.4"/>
        <path d="M46.5,120 L53.5,120 L53.5,148 L80,148 L80,155 L53.5,155 L53.5,210 L46.5,210 L46.5,155 L20,155 L20,148 L46.5,148 Z" fill="none" stroke="#fff3b4" stroke-width="0.5" opacity="0.6" transform="translate(-0.4,-0.4)"/>
        <g fill="#dfe6ee" opacity="0.85">
          <path d="M34,158 l4,-1 l2,3 l-3,2 l-3,-1z"/><path d="M60,140 l3,0 l1,3 l-3,1z"/><path d="M56,190 l3,-2 l2,2 l-2,3z"/>
          <path d="M38,180 l2,-3 l3,1 l-1,3z" opacity="0.7"/>
        </g>
        <g fill="#0f2a66" opacity="0.5"><ellipse cx="38" cy="132" rx="3" ry="1.2" transform="rotate(20 38 132)"/><ellipse cx="62" cy="198" rx="3" ry="1.3" transform="rotate(-40 62 198)"/></g>
        <path d="M27,170 Q34,180 44,192 Q37,178 31,168Z" fill="#000" opacity="0.14"/>
        <path d="M68,140 Q72,160 62,184" fill="none" stroke="#173a80" stroke-width="3" opacity="0.25"/>
        <!-- glossy highlight -->
        <path d="M31,134 Q36,128 46,126 L46,131 Q37,133 33,139 Z" fill="#ffffff" opacity="0.55"/>
      </g>
      <!-- bordure (steel rim + gold) -->
      <path d="M27,131 Q50,120 73,131 Q76,166 50,206 Q24,166 27,131Z" fill="none" stroke="url(#${id('steel')})" stroke-width="5"/>
      <path d="M30.5,133 Q50,124 69.5,133 Q72,165 50,201 Q28,165 30.5,133Z" fill="none" stroke="${OL}" stroke-width="1"/>
      <path d="M27,131 Q50,120 73,131 Q76,166 50,206 Q24,166 27,131Z" fill="none" stroke="${OL}" stroke-width="3.2" stroke-linejoin="round"/>
      <!-- rim rivets -->
      <g fill="url(#${id('gold')})" stroke="${OL}" stroke-width="0.6">
        <circle cx="33" cy="129.5" r="1.3"/><circle cx="42" cy="126.5" r="1.3"/><circle cx="58" cy="126.5" r="1.3"/><circle cx="67" cy="129.5" r="1.3"/>
        <circle cx="30" cy="144" r="1.3"/><circle cx="31.5" cy="160" r="1.3"/><circle cx="36" cy="176" r="1.3"/><circle cx="42.5" cy="191" r="1.3"/>
        <circle cx="72" cy="144" r="1.3"/><circle cx="70" cy="160" r="1.3"/><circle cx="65" cy="176" r="1.3"/><circle cx="58" cy="191" r="1.3"/>
      </g>
      <!-- boss -->
      <circle cx="50" cy="151.5" r="8" fill="url(#${id('steel')})" stroke="${OL}" stroke-width="2.4"/>
      <circle cx="50" cy="151.5" r="5" fill="url(#${id('boss')})" stroke="${OL}" stroke-width="1.4"/>
      <circle cx="48" cy="149.5" r="1.5" fill="#ffffff"/>
      <g fill="#6b4510"><circle cx="50" cy="144.8" r="0.8"/><circle cx="56.7" cy="151.5" r="0.8"/><circle cx="50" cy="158.2" r="0.8"/><circle cx="43.3" cy="151.5" r="0.8"/></g>
      <!-- boss engraving: cross + spiked ring -->
      <path d="M50,145.5 L50,157.5 M44,151.5 L56,151.5" stroke="#8a5e18" stroke-width="1" stroke-linecap="round"/>
      <circle cx="50" cy="151.5" r="6.6" fill="none" stroke="#fff3b4" stroke-width="0.5" stroke-dasharray="0.8 1.2"/>
      <circle cx="50" cy="151.5" r="8" fill="none" stroke="#ffffff" stroke-width="0.7" stroke-dasharray="6 30" transform="rotate(200 50 151.5)"/>
      <path d="M43,157 Q50,163 57,157 L58,159 Q50,166 42,159Z" fill="#000" opacity="0.2"/>
      <!-- chipped edge, cracks and scratches -->
      <path d="M26.5,143 l3,1.6 l-1.5,2.4 l-2.2,-1z M65,196 l2,-2.5 l2,1.4 l-1.5,2z" fill="#9aa8ba" stroke="${OL}" stroke-width="0.9"/>
      <path d="M42,196 l-2,-4 M45,200 l-1,-5" stroke="#ffffff" stroke-width="0.7" stroke-linecap="round" opacity="0.7"/>
      <path d="M60,180 l4,-3 M34,165 l3,2 M62,172 l5,-1.6 M35,150 l4,1.5 M57,136 l4,3" stroke="#ffffff" stroke-width="0.8" stroke-linecap="round" opacity="0.7"/>
      <path d="M62,131 l2,3 l-1.5,2 l2,3" fill="none" stroke="${OL}" stroke-width="0.7" stroke-linejoin="round"/>
      <path d="M43,176 l-5,7 M45,179 l-2,4" stroke="#1c2636" stroke-width="0.5" opacity="0.6"/>
      <!-- leather guige strap loop -->
      <path d="M27,131 Q50,120 73,131" fill="none" stroke="#ffffff" stroke-width="0.8" opacity="0.7" transform="translate(0,-0.5)"/>
    </g>
    <!-- gauntlet fingers wrapped over shield edge -->
    <g transform="translate(73,158)">
      <path d="M-4,-7 Q4,-9 6,-3 L6,5 Q2,9 -4,7 Z" fill="url(#${id('steelv')})" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M-3,-3 L5,-3 M-3,0.5 L5.5,0.5 M-3,4 L5,4" stroke="#56647a" stroke-width="1"/>
      <path d="M-2,-6 Q2,-7 4,-5" stroke="#ffffff" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <path d="M-4,-7 Q4,-9 6,-3 L6,5 Q2,9 -4,7 Z" fill="url(#${id('hammer')})"/>
      <path d="M-4,-1.5 L-6,-1.5 M-4,2 L-6,2 M-4,5.5 L-6,5.5" stroke="${OL}" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="0" cy="-4.5" r="0.7" fill="#f4c64f" stroke="${OL}" stroke-width="0.3"/><circle cx="0" cy="6" r="0.7" fill="#f4c64f" stroke="${OL}" stroke-width="0.3"/>
      <path d="M5,-2 L5,6" stroke="#1c2636" stroke-width="1.4" opacity="0.3"/>
    </g>`;
  }

  /* ---------------- sword + weapon arm ---------------- */
  function sword(id) {
    return `
    <g transform="translate(153,151) rotate(28)">
      <!-- blade -->
      <path d="M-5.5,-14 L5.5,-14 L4.8,-82 L0,-96 L-4.8,-82 Z" fill="url(#${id('blade')})" stroke="${OL}" stroke-width="2.8" stroke-linejoin="round"/>
      <!-- fuller groove -->
      <path d="M0,-18 L0,-76" stroke="#7a8aa0" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M0.9,-18 L0.9,-76" stroke="#eef4fb" stroke-width="0.7" stroke-linecap="round"/>
      <!-- edge shine -->
      <path d="M-3.2,-20 L-3,-80" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" opacity="0.95"/>
      <path d="M-2.6,-84 L-0.6,-91" stroke="#ffffff" stroke-width="1" stroke-linecap="round"/>
      <!-- inscription runes down the fuller, hammer polish, nicks -->
      <g stroke="#5a6a80" stroke-width="0.6" stroke-linecap="round" fill="none">
        <path d="M-1.2,-26 l2.4,0 M-1,-30 l2,2 M-1.2,-33 l0,3 M-1,-37 l2,0 M0,-40 l1.2,2 M-1.2,-43 l2.4,1 M-1,-47 l0,3 M-0.6,-51 l1.6,1.6 M-1.2,-54 l2.4,0 M0,-58 l0,3 M-1,-61 l2,1 M-1.2,-65 l1.4,2"/>
      </g>
      <path d="M0,-14 L4.8,-82 L5.5,-14Z" fill="#6c7b8f" opacity="0.18"/>
      <path d="M3.4,-24 L3.2,-78" stroke="#5a6a80" stroke-width="0.6" opacity="0.7"/>
      <path d="M-5.2,-46 l2,0.6 l-0.5,1.6 z M4.8,-60 l-2,0.7 l0.5,1.5z M-4.9,-70 l1.6,0.4 l-0.3,1.4z" fill="#3c4a5e"/>
      <path d="M-4,-36 l2.5,-1 M2,-52 l2.5,-0.5 M-2,-64 l1.5,0.5" stroke="#ffffff" stroke-width="0.5" opacity="0.8" stroke-linecap="round"/>
      <!-- ricasso engraving -->
      <path d="M-2.5,-16.5 q2.5,-3 5,0" fill="none" stroke="#b5822a" stroke-width="0.9"/>
      <!-- cross-guard with curled quillons -->
      <path d="M-20,-12 Q-22,-16 -18,-17 L18,-17 Q22,-16 20,-12 Q14,-9.5 0,-10 Q-14,-9.5 -20,-12 Z"
            fill="url(#${id('gold')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
      <circle cx="-21" cy="-11" r="2.6" fill="url(#${id('gold')})" stroke="${OL}" stroke-width="1.6"/>
      <circle cx="21" cy="-11" r="2.6" fill="url(#${id('gold')})" stroke="${OL}" stroke-width="1.6"/>
      <path d="M-15,-15 L15,-15" stroke="#fff3b4" stroke-width="1" stroke-linecap="round"/>
      <path d="M-4,-17 L4,-17 L3,-8 L-3,-8 Z" fill="url(#${id('gold')})" stroke="${OL}" stroke-width="1.6"/>
      <circle cx="0" cy="-12.5" r="1.8" fill="url(#${id('bgem')})" stroke="${OL}" stroke-width="0.7"/>
      <circle cx="-0.5" cy="-13" r="0.5" fill="#fff"/>
      <path d="M-18,-14 q-1,1.5 1,2.6 M18,-14 q1,1.5 -1,2.6 M-12,-11.6 q6,1 12,0.6 M8,-11.6 q3,0.3 5,-0.3" fill="none" stroke="#8a5e18" stroke-width="0.5" stroke-linecap="round"/>
      <path d="M-20.4,-12 l1,-1.4" stroke="#fff" stroke-width="0.7" stroke-linecap="round"/>
      <path d="M-20,-12 Q-14,-9.5 0,-10 Q14,-9.5 20,-12 Q14,-10.6 0,-11 Q-14,-10.6 -20,-12Z" fill="#8a5e18" opacity="0.4"/>
      <!-- leather-wrapped grip -->
      <rect x="-3.6" y="-9" width="7.2" height="22" rx="2" fill="url(#${id('leather')})" stroke="${OL}" stroke-width="2.2"/>
      <path d="M-3.4,-6 L3.4,-3 M-3.4,-1 L3.4,2 M-3.4,4 L3.4,7 M-3.4,9 L3.4,12" stroke="#3d220d" stroke-width="1"/>
      <path d="M-3.4,-5 L3.4,-2 M-3.4,0 L3.4,3 M-3.4,5 L3.4,8" stroke="#c78d55" stroke-width="0.5"/>
      <rect x="-3.6" y="-9" width="7.2" height="22" rx="2" fill="url(#${id('grain')})"/>
      <path d="M2.4,-8 L2.4,12" stroke="#000" stroke-width="1.4" opacity="0.2"/>
      <path d="M-3.6,-8 L3.6,-8 M-3.6,11.5 L3.6,11.5" stroke="url(#${id('gold')})" stroke-width="1.3"/>
      <path d="M-3.6,-2.5 L3.6,0.5" stroke="#8a5e18" stroke-width="0.35" opacity="0.7"/>
      <!-- pommel with gem -->
      <path d="M-3,12 L3,12 L2,14.5 L-2,14.5Z" fill="url(#${id('gold')})" stroke="${OL}" stroke-width="1.4"/>
      <circle cx="0" cy="19" r="5.4" fill="url(#${id('gold')})" stroke="${OL}" stroke-width="2.2"/>
      <circle cx="0" cy="19" r="2.8" fill="url(#${id('gem')})" stroke="${OL}" stroke-width="0.8"/>
      <circle cx="-0.9" cy="18" r="0.9" fill="#ffffff"/>
      <path d="M0,16.2 L2.6,19 L0,21.8 L-2.6,19Z" fill="none" stroke="#ffb0bb" stroke-width="0.3" opacity="0.8"/>
      <path d="M-4.6,16.5 q1,-2.5 4,-3.4 M3,15 q1.5,1 2,3" fill="none" stroke="#fff3b4" stroke-width="0.6" stroke-linecap="round"/>
      <g fill="#8a5e18"><circle cx="-4.2" cy="21" r="0.5"/><circle cx="4.2" cy="21" r="0.5"/><circle cx="0" cy="24" r="0.5"/></g>
      <!-- tip sparkle -->
      <g transform="translate(-5,-86)">
        <circle r="5" fill="url(#${id('glint')})" opacity="0.9"/>
        <path d="M0,-6 L1,-1 L6,0 L1,1 L0,6 L-1,1 L-6,0 L-1,-1 Z" fill="#ffffff"/>
      </g>
    </g>`;
  }

  function weaponArm(id) {
    return `
    <g class="part-weapon" style="transform-origin: 124px 126px">
      ${sword(id)}
      <!-- chainmail at armpit / elbow -->
      <path d="M118,130 L134,138 L140,152 L128,154 Z" fill="url(#${id('mail')})" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
      <!-- rerebrace (upper arm) -->
      <path d="M116,128 L130,124 L139,143 L127,149 Z" fill="url(#${id('steel')})" stroke="${OL}" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M120,130 L129,146" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>
      <path d="M116,128 L130,124 L139,143 L127,149 Z" fill="url(#${id('hammer')})"/>
      <path d="M133,126 L139,143 L127,149 L131,138Z" fill="#56647a" opacity="0.35"/>
      <path d="M118,132 L127.5,147 M122,128.5 L131,146" stroke="#7f8ea2" stroke-width="0.6" opacity="0.6"/>
      <circle cx="119" cy="131" r="0.9" fill="#f4c64f" stroke="${OL}" stroke-width="0.4"/><circle cx="136" cy="141" r="0.9" fill="#f4c64f" stroke="${OL}" stroke-width="0.4"/>
      <path d="M124,136 l3,-1 M126,141 l2.5,-0.5" stroke="#4a5566" stroke-width="0.5" stroke-linecap="round"/>
      <!-- vambrace (forearm) -->
      <path d="M132,143 L148,142 L150,158 L134,159 Z" fill="url(#${id('steelv')})" stroke="${OL}" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M136,146 L146,145.5" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" opacity="0.85"/>
      <path d="M134,154 L149,153" stroke="#f4c64f" stroke-width="1.1"/>
      <path d="M132,143 L148,142 L150,158 L134,159 Z" fill="url(#${id('hammer')})"/>
      <path d="M134,157 L150,156 L150,158 L134,159Z" fill="#1c2636" opacity="0.3"/>
      <path d="M140,148 l4,-0.6 M137,151 l3,-0.4" stroke="#56647a" stroke-width="0.5" stroke-linecap="round"/>
      <path d="M135,150 h1 M147,149 h1" stroke="#f4c64f" stroke-width="1.2" stroke-linecap="round"/>
      <!-- couter (elbow) with fan -->
      <path d="M126,146 q-4,8 3,13 q2,-6 5,-8z" fill="url(#${id('steelv')})" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="133" cy="150" r="7" fill="url(#${id('pauld')})" stroke="${OL}" stroke-width="2.6"/>
      <circle cx="133" cy="150" r="3.6" fill="none" stroke="#f4c64f" stroke-width="1"/>
      <circle cx="133" cy="150" r="1.4" fill="url(#${id('gold')})" stroke="${OL}" stroke-width="0.6"/>
      <circle cx="131" cy="147.5" r="1.1" fill="#ffffff" opacity="0.9"/>
      <g stroke="#7f8ea2" stroke-width="0.5" opacity="0.8"><path d="M133,143.5 L133,145.5 M133,154.5 L133,156.5 M126.6,150 L128.6,150 M137.4,150 L139.4,150"/></g>
      <path d="M127,152.5 Q133,157.5 139,152.5" fill="none" stroke="#1c2636" stroke-width="1.2" opacity="0.25"/>
      <path d="M126,146 q-4,8 3,13" fill="none" stroke="#ffffff" stroke-width="0.6" opacity="0.6"/>
      <!-- gauntlet cuff -->
      <path d="M144,140 L152,139 L154,161 L145,161 Z" fill="url(#${id('steel')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M146,142 L147,158" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M144,140 L152,139 L154,161 L145,161 Z" fill="url(#${id('hammer')})"/>
      <path d="M150.5,140 L153.5,160" stroke="#f4c64f" stroke-width="0.7" stroke-dasharray="1 1.2"/>
      <path d="M145,158.5 L154,158.5" stroke="#1c2636" stroke-width="1" opacity="0.3"/>
      <!-- fist: finger plates over grip -->
      <path d="M150,142 Q158,139 162,144 L162,158 Q157,162 150,160 Z" fill="url(#${id('steelv')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M151,146 L162,146 M151,150 L162.3,150 M151,154 L162,154" stroke="#56647a" stroke-width="1.1"/>
      <path d="M150,142 Q158,139 162,144 L162,158 Q157,162 150,160 Z" fill="url(#${id('hammer')})"/>
      <path d="M150,158 L162,157 L162,158 Q157,162 150,160Z" fill="#1c2636" opacity="0.3"/>
      <path d="M161.2,144.6 l0.6,1.4 M161.2,148.6 l0.6,1.4 M161.2,152.6 l0.6,1.4" stroke="${OL}" stroke-width="1.2"/>
      <g fill="#f4c64f" stroke="${OL}" stroke-width="0.3"><circle cx="152.4" cy="148.2" r="0.6"/><circle cx="152.4" cy="152.2" r="0.6"/></g>
      <path d="M156,143 L156,158" stroke="#56647a" stroke-width="0.8" opacity="0.7"/>
      <g fill="#ffffff" opacity="0.85"><rect x="152" y="143" width="3" height="1.3" rx="0.6"/><rect x="152" y="147" width="3" height="1.3" rx="0.6"/><rect x="152" y="151" width="3" height="1.3" rx="0.6"/></g>
      <!-- thumb -->
      <path d="M148,146 Q152,141 158,142 Q158,145 153,147 Z" fill="url(#${id('steel')})" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>
      <circle cx="160" cy="159" r="0.9" fill="#f4c64f" stroke="${OL}" stroke-width="0.4"/>
      <!-- front pauldron (on top) -->
      <g transform="translate(130,125) scale(0.86) translate(-130,-125)">${pauldron(id, 130, 125, false)}</g>
    </g>`;
  }

  /* ---------------- head ---------------- */
  function plume(id) {
    return `
    <g class="part-cape" style="transform-origin: 100px 36px">
      <!-- feathers sweep back (left) -->
      <path d="M100,40 C88,26 66,22 46,32 C58,32 72,34 84,40 C74,40 64,44 56,52 C72,46 86,46 98,44 Z"
            fill="#1f4ea8" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M98,42 C84,32 66,30 52,34" fill="none" stroke="#7fb0ff" stroke-width="1" opacity="0.8"/>
      <path d="M102,38 C98,18 80,6 56,12 C70,16 80,22 88,30 C78,28 68,30 60,36 C76,34 90,36 100,42 Z"
            fill="#ffffff" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M100,38 C94,24 80,14 62,13" fill="none" stroke="#b9c7d8" stroke-width="1.1"/>
      <path d="M84,20 l-4,4 M78,17 l-4,4 M90,25 l-4,3" stroke="#c7d3e2" stroke-width="0.8"/>
      <g stroke="#9db0c8" stroke-width="0.55" stroke-linecap="round" fill="none">
        <path d="M94,32 l-4,-3 M90,29 l-4,-3.5 M86,26 l-4,-4 M82,23 l-4,-4 M78,20.5 l-4,-4 M74,18 l-3,-4 M70,16.5 l-3,-3.5 M66,15 l-2,-3.5"/>
        <path d="M96,35 l-4,1 M90,33.5 l-4,1.5 M84,32 l-4,2 M78,32 l-4,2.5 M72,33 l-4,2 M66,34.5 l-3,1.5"/>
      </g>
      <g stroke="#8fbaff" stroke-width="0.55" stroke-linecap="round" fill="none">
        <path d="M94,44 l-4,1.5 M88,44.5 l-4,2 M82,45 l-4,2.5 M76,46 l-4,3 M70,48 l-3,3.5 M90,38 l-4,-1 M80,35.5 l-4,-1 M70,33 l-3,-1 M60,32.5 l-3,-0.5"/>
      </g>
      <g stroke="#7fb0ff" stroke-width="0.55" stroke-linecap="round" fill="none"><path d="M100,32 l3,-1.5 M99,26 l3.5,-1.5 M97,20 l3,-2 M95,14 l3,-2 M92,9 l3,-1.5"/></g>
      <path d="M100,40 C88,26 66,22 46,32" fill="none" stroke="#173a80" stroke-width="1.3" opacity="0.6"/>
      <path d="M60,36 Q80,36 100,42" fill="none" stroke="#e5edf7" stroke-width="0.8" opacity="0.7"/>
      <path d="M104,38 C108,18 98,6 84,4 C92,12 94,20 94,28 C96,26 98,32 100,40 Z"
            fill="#2e6fd8" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M102,36 C102,22 96,12 88,7" fill="none" stroke="#9cc4ff" stroke-width="1"/>
      <!-- gold feather tips -->
      <path d="M56,12 Q60,11 63,12.5 Q59,14 56,12Z M46,32 Q50,30.5 53,31.5 Q49,33 46,32Z M84,4 Q87,5 88.5,7 Q85,6.8 84,4Z" fill="#f4c64f" stroke="${OL}" stroke-width="1"/>
    </g>`;
  }

  function face(id) {
    return `
    <!-- face opening -->
    <path d="${FACE}" fill="url(#${id('skin')})"/>
    <!-- hair fringe -->
    <path d="M63,74 Q67,63 76,63 Q79,71 84,65 Q88,74 95,66 Q99,75 106,66 Q110,74 117,65 Q122,73 128,64 Q135,66 136,76 L136,58 L63,58 Z"
          fill="#7a4a26" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M86,64 Q89,68 93,66 M106,64 Q109,68 113,65" fill="none" stroke="#b27442" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M67,65 Q70,68 72,72 M78,64.5 Q80,67 80,70 M96,68 Q98,71 99,73 M118,66 Q120,69 121,72 M128,66 Q131,68 132,72 M70,63 Q76,60 84,61 M100,62 Q108,60 118,62 M124,63 Q129,62 132,64" fill="none" stroke="#4b2a12" stroke-width="0.6" stroke-linecap="round" opacity="0.8"/>
    <path d="M72,64 Q77,62 82,63.5 M104,64.4 Q110,62.6 116,64 M123,65 Q128,64 133,66" fill="none" stroke="#c98b52" stroke-width="0.7" stroke-linecap="round"/>
    <path d="M63,74 L58,80 L66,79 Z M136,74 L140,80 L133,79Z" fill="#7a4a26" stroke="${OL}" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M65,78 q0,3 -1,5 M134,78 q0,3 1,5" stroke="#5a3218" stroke-width="0.6" fill="none"/>
    <!-- helm shadow under brim -->
    <path d="M64,70 Q98,62 136,70 L136,66 Q98,58 64,66Z" fill="#000" opacity="0.18"/>
    <!-- brows (determined) -->
    <path d="M84,76 Q90,72 97,75" fill="none" stroke="#5a3218" stroke-width="3" stroke-linecap="round"/>
    <path d="M111,75 Q118,72 124,75" fill="none" stroke="#5a3218" stroke-width="3" stroke-linecap="round"/>
    <path d="M85,74.6 l2,-2.2 M88,73.4 l1.6,-2.4 M91.5,73 l1,-2.6 M95,74 l0.4,-2.4 M112.6,74 l0,-2.4 M115.6,72.8 l0.8,-2.5 M119,72.6 l1.4,-2.3 M122.4,74 l1.8,-1.8" stroke="#5a3218" stroke-width="0.8" stroke-linecap="round"/>
    <path d="M85,77.6 Q90,74.6 96,77 M112,77 Q118,74.4 123,77.4" fill="none" stroke="#f1b48a" stroke-width="0.8" stroke-linecap="round" opacity="0.7"/>

    <!-- eyes -->
    <g class="part-eyes" style="transform-origin: 105px 86px">
      <g>
        <ellipse cx="91" cy="86" rx="5.4" ry="7" fill="${OL}"/>
        <ellipse cx="91.6" cy="87.6" rx="3.9" ry="5" fill="#2e6fd8"/>
        <ellipse cx="91.6" cy="89.4" rx="3" ry="3" fill="#7fb8ff"/>
        <circle cx="91.8" cy="87.4" r="1.8" fill="${OL}"/>
        <circle cx="89.3" cy="83.2" r="2.2" fill="#ffffff"/>
        <circle cx="93.6" cy="90.4" r="1" fill="#ffffff"/>
        <ellipse cx="91.6" cy="87.6" rx="3.9" ry="5" fill="none" stroke="#173a80" stroke-width="0.7"/>
        <path d="M88.6,86 Q91.6,84 94.6,86" fill="none" stroke="#1c4696" stroke-width="0.8" opacity="0.7"/>
        <path d="M91.6,89.6 l-2,1.6 M91.6,89.6 l0.4,2.5 M91.6,89.6 l2.4,1.4" stroke="#b9dcff" stroke-width="0.4" opacity="0.8"/>
        <circle cx="94.4" cy="85.4" r="0.6" fill="#ffffff"/>
        <path d="M85.6,84 Q88,79.4 93,79.6 Q96.6,80 97,83" fill="none" stroke="${OL}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M86.6,92.6 Q91,95 96,92.4" fill="none" stroke="#d99670" stroke-width="0.6" opacity="0.7"/>
      </g>
      <g>
        <ellipse cx="117" cy="86" rx="5.4" ry="7" fill="${OL}"/>
        <ellipse cx="117.6" cy="87.6" rx="3.9" ry="5" fill="#2e6fd8"/>
        <ellipse cx="117.6" cy="89.4" rx="3" ry="3" fill="#7fb8ff"/>
        <circle cx="117.8" cy="87.4" r="1.8" fill="${OL}"/>
        <circle cx="115.3" cy="83.2" r="2.2" fill="#ffffff"/>
        <circle cx="119.6" cy="90.4" r="1" fill="#ffffff"/>
        <ellipse cx="117.6" cy="87.6" rx="3.9" ry="5" fill="none" stroke="#173a80" stroke-width="0.7"/>
        <path d="M114.6,86 Q117.6,84 120.6,86" fill="none" stroke="#1c4696" stroke-width="0.8" opacity="0.7"/>
        <path d="M117.6,89.6 l-2,1.6 M117.6,89.6 l0.4,2.5 M117.6,89.6 l2.4,1.4" stroke="#b9dcff" stroke-width="0.4" opacity="0.8"/>
        <circle cx="120.4" cy="85.4" r="0.6" fill="#ffffff"/>
        <path d="M111.6,84 Q114,79.4 119,79.6 Q122.6,80 123,83" fill="none" stroke="${OL}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M112.6,92.6 Q117,95 122,92.4" fill="none" stroke="#d99670" stroke-width="0.6" opacity="0.7"/>
      </g>
      <path d="M85,80 L83.5,78.5 M123,80 L124.5,78.5" stroke="${OL}" stroke-width="1.4" stroke-linecap="round"/>
    </g>
    <!-- blush -->
    <ellipse cx="85" cy="97" rx="4.5" ry="2.6" fill="#ff8a8a" opacity="0.55"/>
    <ellipse cx="124" cy="97" rx="4.5" ry="2.6" fill="#ff8a8a" opacity="0.55"/>
    <path d="M83,96 l1,-1.5 M86,96 l1,-1.5 M122,96 l1,-1.5 M125,96 l1,-1.5" stroke="#e86b6b" stroke-width="0.6" stroke-linecap="round"/>
    <!-- nose -->
    <path d="M105,92 Q107,94 105.5,95" fill="none" stroke="#d99670" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M104.6,88.5 Q104,91 104.8,92" fill="none" stroke="#f1b48a" stroke-width="0.8" stroke-linecap="round" opacity="0.8"/>
    <circle cx="105.8" cy="94.2" r="0.6" fill="#fff" opacity="0.8"/>
    <path d="M102.6,95.6 Q105,97.4 107.6,95.8" fill="none" stroke="#e8a679" stroke-width="0.6" stroke-linecap="round" opacity="0.7"/>
    <ellipse cx="86" cy="98" rx="2" ry="1" fill="#ffd0d0" opacity="0.5"/><ellipse cx="123" cy="98" rx="2" ry="1" fill="#ffd0d0" opacity="0.5"/>

    <!-- confident smile -->
    <path d="M99,100 Q106,106.5 113,99.5 Q106,102 99,100 Z" fill="#8a2c2c" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M102,101.6 Q106,104 110,101.4" fill="none" stroke="#ff9a9a" stroke-width="1.1" stroke-linecap="round"/>
    <path d="M101.5,100.4 L110.5,100.4" stroke="#ffffff" stroke-width="1" stroke-linecap="round"/>
    <path d="M104,103.2 Q106,102 108,103.2 Q106,104.4 104,103.2Z" fill="#e0566a" opacity="0.9"/>
    <path d="M106,100.6 L106,101.8" stroke="#d8dfe8" stroke-width="0.4"/>
    <path d="M98.4,99.4 q-1,-0.6 -1.4,-1.6 M113.6,99.2 q1,-0.6 1.6,-1.6" stroke="#c9825c" stroke-width="0.8" stroke-linecap="round" fill="none"/>
    <path d="M102,108 Q106,110 110,108" fill="none" stroke="#e59d74" stroke-width="0.7" opacity="0.6" stroke-linecap="round"/>
    <path d="M100,106.4 Q106,109.4 112,106.4 Q106,108.4 100,106.4Z" fill="#000" opacity="0.06"/>
    <!-- chin chainmail (coif) peeking -->
    <path d="M74,108 Q100,115 126,108 L120,114 Q100,119 80,114 Z" fill="url(#${id('mail')})" stroke="${OL}" stroke-width="1.4"/>`;
  }

  function head(id) {
    return `
    <g class="part-head" style="transform-origin: 97px 112px">
      ${plume(id)}
      <!-- aventail (mail cape at neck) -->
      <path d="M58,100 L136,100 L140,120 Q97,130 54,120 Z" fill="url(#${id('mail')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M58,100 L136,100 L140,120 Q97,130 54,120 Z" fill="#1c2636" opacity="0.22"/>
      <path d="M62,102 Q97,110 132,102 L131,106 Q97,114 63,106Z" fill="#000" opacity="0.22"/>
      <path d="M56,118 Q97,128 138,118" fill="none" stroke="url(#${id('gold')})" stroke-width="2"/>
      <path d="M56,118 Q97,128 138,118" fill="none" stroke="#8a5e18" stroke-width="0.5" stroke-dasharray="1 2.2"/>
      <path d="M56,112 q3,2 6,1 M132,113 q3,1 6,-1 M82,116 l6,1.4 M104,117 l6,-0.4" stroke="#ffffff" stroke-width="0.6" opacity="0.6" stroke-linecap="round"/>
      <path d="M58,115 Q97,124 136,115" fill="none" stroke="#dde5ee" stroke-width="0.7" opacity="0.8"/>
      <!-- helm shell (bascinet) -->
      <path d="M50,80 C48,48 70,33 97,33 C124,33 146,48 145,80 L145,103 Q142,114 129,114 L66,114 Q52,114 50,103 Z"
            fill="url(#${id('helm')})" stroke="${OL}" stroke-width="3.4" stroke-linejoin="round"/>
      <!-- hammered finish, seams, engraved band, polish streaks -->
      <path d="M50,80 C48,48 70,33 97,33 C124,33 146,48 145,80 L145,103 Q142,114 129,114 L66,114 Q52,114 50,103 Z" fill="url(#${id('hammer')})"/>
      <path d="M97,34 Q80,42 66,58 M97,34 Q114,42 128,58" fill="none" stroke="#7f8ea2" stroke-width="0.8" opacity="0.6"/>
      <path d="M52,84 Q97,70 143,84" fill="none" stroke="url(#${id('gold')})" stroke-width="0.9" stroke-dasharray="0.8 2.2" stroke-linecap="round"/>
      <path d="M50,108 Q97,120 145,108 L145,103 Q142,114 129,114 L66,114 Q52,114 50,103Z" fill="#1c2636" opacity="0.25"/>
      <path d="M66,66 Q70,50 84,42 M74,62 Q78,52 90,45" fill="none" stroke="#ffffff" stroke-width="0.9" stroke-linecap="round" opacity="0.6"/>
      <path d="M126,50 l6,5 M132,64 l4,2 M120,44 l3,2" stroke="#4a5566" stroke-width="0.6" stroke-linecap="round" opacity="0.8"/>
      <path d="M58,74 l3,-1 M62,50 l4,-3" stroke="#ffffff" stroke-width="0.8" stroke-linecap="round" opacity="0.7"/>
      <path d="M140,76 l3,5 -2.5,2 z" fill="#3c4a5e" opacity="0.7"/>
      <!-- dome ridge + highlight -->
      <path d="M97,34 Q99,46 98,56" fill="none" stroke="#7f8ea2" stroke-width="1.4"/>
      <path d="M62,56 Q68,42 84,37" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.95"/>
      <circle cx="60" cy="63" r="2" fill="#ffffff" opacity="0.9"/>
      <!-- side shadow -->
      <path d="M140,62 Q146,80 144,102 Q142,112 132,113 Q140,96 138,74 Z" fill="#56647a" opacity="0.45"/>
      <!-- ventilation holes (cheek) -->
      <g fill="${OL}">
        <circle cx="56" cy="88" r="1.2"/><circle cx="56" cy="93" r="1.2"/><circle cx="56" cy="98" r="1.2"/>
        <circle cx="59.5" cy="90.5" r="1.2"/><circle cx="59.5" cy="95.5" r="1.2"/><circle cx="59.5" cy="100.5" r="1.2"/>
        <circle cx="140" cy="88" r="1.1"/><circle cx="140" cy="93" r="1.1"/><circle cx="140" cy="98" r="1.1"/>
        <circle cx="53.5" cy="93" r="1"/><circle cx="53.5" cy="98" r="1"/><circle cx="143" cy="93" r="0.9"/><circle cx="143" cy="98" r="0.9"/>
      </g>
      <g fill="#ffffff" opacity="0.5"><circle cx="55.6" cy="87.5" r="0.4"/><circle cx="55.6" cy="92.5" r="0.4"/><circle cx="59" cy="90" r="0.4"/><circle cx="59" cy="95" r="0.4"/></g>
      <path d="M53,86 Q52,94 55,103 M57,88 Q56,95 58,103" fill="none" stroke="#56647a" stroke-width="0.5" opacity="0.6"/>
      <!-- face opening rim -->
      <path d="${FACE}"
            fill="none" stroke="#56647a" stroke-width="6"/>
      ${face(id)}
      <path d="${FACE}"
            fill="none" stroke="${OL}" stroke-width="2.6"/>
      <path d="M61,71 Q61,59 76,59 L124,59 Q138,59 138,73 L138,99" fill="none" stroke="url(#${id('gold')})" stroke-width="2"/>
      <!-- rim rivets -->
      <g fill="url(#${id('gold')})" stroke="${OL}" stroke-width="0.5">
        <circle cx="61.5" cy="80" r="1.1"/><circle cx="61.5" cy="92" r="1.1"/><circle cx="61.5" cy="104" r="1.1"/>
        <circle cx="138" cy="84" r="1.1"/><circle cx="138" cy="96" r="1.1"/><circle cx="138" cy="106" r="1.1"/>
      </g>
      <!-- raised visor (sits on the brow) -->
      <path d="M58,62 Q58,44 97,41 Q137,44 139,62 Q120,55 97,55 Q74,55 58,62 Z"
            fill="url(#${id('steelv')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M64,58 Q97,49 133,58" fill="none" stroke="url(#${id('gold')})" stroke-width="1.8"/>
      <!-- breathing slits -->
      <g stroke="${OL}" stroke-width="1.9" stroke-linecap="round">
        <path d="M104,47 L114,48 M104,51 L116,52 M117,46.5 L125,48.5 M118,50.5 L128,53"/>
      </g>
      <g fill="${OL}"><circle cx="72" cy="52" r="1"/><circle cx="77" cy="50" r="1"/><circle cx="82" cy="48.5" r="1"/><circle cx="75" cy="55" r="0.9"/><circle cx="80" cy="53.3" r="0.9"/></g>
      <path d="M68,50 Q80,44 94,43.5" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.95"/>
      <path d="M58,62 Q58,44 97,41 Q137,44 139,62 Q120,55 97,55 Q74,55 58,62 Z" fill="url(#${id('hammer')})"/>
      <path d="M60,60 Q76,53 97,53 Q118,53 137,60 Q118,56 97,56.4 Q76,56.4 60,60Z" fill="#1c2636" opacity="0.32"/>
      <path d="M92,42 L92,54 M102,42 L102,54" stroke="#7f8ea2" stroke-width="0.7" opacity="0.6"/>
      <path d="M64,57 q1,-2 3,-3 M126,57 q1,-2 3,-3 M100,44 l8,0.6 M112,43.6 l6,1.4" stroke="#ffffff" stroke-width="0.6" stroke-linecap="round" opacity="0.7"/>
      <g stroke="#ffffff" stroke-width="0.4" opacity="0.6"><path d="M104,48.5 L114,49.5 M104,52.5 L116,53.5 M118,47.5 L125,49.5 M119,51.5 L128,54"/></g>
      <!-- visor pivots (gold rosettes) -->
      <g>
        <circle cx="58" cy="68" r="4" fill="url(#${id('gold')})" stroke="${OL}" stroke-width="1.8"/>
        <circle cx="58" cy="68" r="1.4" fill="#8a5e18"/>
        <g stroke="#8a5e18" stroke-width="0.4"><path d="M58,64.6 L58,66 M58,70 L58,71.4 M54.6,68 L56,68 M60,68 L61.4,68 M139,64.6 L139,66 M139,70 L139,71.4 M135.6,68 L137,68 M141,68 L142.4,68"/></g>
        <circle cx="57.2" cy="67" r="0.7" fill="#fff"/><circle cx="138.2" cy="67" r="0.7" fill="#fff"/>
        <path d="M52,72 Q55,76 56,80 M144,72 Q141,76 141,80" stroke="#8a5e18" stroke-width="1" fill="none" stroke-linecap="round"/>
        <circle cx="139" cy="68" r="4" fill="url(#${id('gold')})" stroke="${OL}" stroke-width="1.8"/>
        <circle cx="139" cy="68" r="1.4" fill="#8a5e18"/>
      </g>
      <!-- gold filigree band at helm base -->
      <path d="M51,104 Q56,106 62,106.5 M137,106.5 Q141,106 144,104" fill="none" stroke="url(#${id('gold')})" stroke-width="3"/>
      <path d="M54,108 q3,-3 6,0 t6,0 M132,108 q3,-3 6,0" fill="none" stroke="#b5822a" stroke-width="0.9"/>
      <!-- plume holder -->
      <path d="M96,34 L104,34 L103,40 L97,40 Z" fill="url(#${id('gold')})" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="100" cy="37" r="1.4" fill="url(#${id('bgem')})"/>
    </g>`;
  }

  function body(id) {
    return `
    <g class="part-body">
      ${torso(id)}
      ${shieldArm(id)}
      ${head(id)}
      ${weaponArm(id)}
    </g>`;
  }

  function svg(uid) {
    var id = mk(uid);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240">
    ${defs(id)}
    <ellipse class="part-shadow" cx="97" cy="229" rx="56" ry="7.5" fill="#000" opacity="0.22"/>
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
      <radialGradient id="${id('pbg')}" cx="0.5" cy="0.45" r="0.6">
        <stop offset="0" stop-color="#bcd6ff"/>
        <stop offset="1" stop-color="#2e6fd8"/>
      </radialGradient>
      <clipPath id="${id('pclip')}"><rect x="0" y="0" width="120" height="120" rx="14"/></clipPath>
    </defs>
    <g clip-path="url(#${id('pclip')})">
      <rect x="0" y="0" width="120" height="120" fill="url(#${id('pbg')})"/>
      <g fill="#ffffff" opacity="0.18">
        <path d="M60,60 L10,0 L30,0Z M60,60 L70,0 L90,0Z M60,60 L120,20 L120,40Z M60,60 L0,40 L0,60Z"/>
      </g>
      <g transform="translate(-9,4) scale(0.72)">
        ${cape(id)}
        ${torso(id)}
        ${pauldron(id, 66, 124, true)}
        ${pauldron(id, 126, 124, false)}
        ${head(id)}
      </g>
    </g>
  </svg>`;
  }

  window.HEROES = window.HEROES || {};
  window.HEROES.knight = {
    key: 'knight',
    name: 'Sir Aldric',
    title: 'The Knight',
    lore: 'A sworn defender of the Azure Crown who has never once lowered his shield. They say his oath glows brighter than his blade.',
    color: '#2e6fd8',
    base: { hp: 560, atk: 90, def: 30 },
    fx: { slash: '#7fd4ff', glow: '#e0f6ff' },
    signature: { name: 'Holy Bulwark', desc: 'Start each battle with a shield equal to 30% Max HP.', type: 'shield' },
    svg: svg,
    portrait: portrait
  };
})();

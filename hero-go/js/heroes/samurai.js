/* Hero Go! — Kenji, The Samurai (key: samurai) */
(function () {
  var OL = '#2b1d14';

  function ids(uid) {
    var u = uid == null ? '' : String(uid);
    return function (n) { return 'samurai-' + n + '-' + u; };
  }

  function defs(I) {
    return `
  <defs>
    <linearGradient id="${I('lacquer')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4a5578"/><stop offset="0.45" stop-color="#2c3452"/><stop offset="1" stop-color="#171b2e"/>
    </linearGradient>
    <linearGradient id="${I('lacquerH')}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#1c2136"/><stop offset="0.55" stop-color="#3a4466"/><stop offset="0.8" stop-color="#56628a"/><stop offset="1" stop-color="#2a3150"/>
    </linearGradient>
    <linearGradient id="${I('bowl')}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6b7699"/><stop offset="0.35" stop-color="#39436a"/><stop offset="1" stop-color="#161a2b"/>
    </linearGradient>
    <linearGradient id="${I('gold')}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff2a8"/><stop offset="0.35" stop-color="#f6c945"/><stop offset="0.7" stop-color="#d9962a"/><stop offset="1" stop-color="#a8651a"/>
    </linearGradient>
    <linearGradient id="${I('goldV')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff4b8"/><stop offset="0.5" stop-color="#f2bf3c"/><stop offset="1" stop-color="#b9761e"/>
    </linearGradient>
    <linearGradient id="${I('steel')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="0.3" stop-color="#e3ecf5"/><stop offset="0.55" stop-color="#b8c6d6"/><stop offset="1" stop-color="#8797ab"/>
    </linearGradient>
    <linearGradient id="${I('hakama')}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#2b3553"/><stop offset="0.5" stop-color="#3d4b73"/><stop offset="1" stop-color="#27304b"/>
    </linearGradient>
    <linearGradient id="${I('crimson')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ff6b5b"/><stop offset="0.5" stop-color="#d63a2b"/><stop offset="1" stop-color="#8e1f18"/>
    </linearGradient>
    <linearGradient id="${I('obi')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9b59b6"/><stop offset="1" stop-color="#5b2a78"/>
    </linearGradient>
    <radialGradient id="${I('skin')}" cx="0.6" cy="0.4" r="0.7">
      <stop offset="0" stop-color="#ffe9d4"/><stop offset="0.7" stop-color="#ffd2ad"/><stop offset="1" stop-color="#f0b48c"/>
    </radialGradient>
    <radialGradient id="${I('iris')}" cx="0.5" cy="0.35" r="0.65">
      <stop offset="0" stop-color="#b86a2c"/><stop offset="0.6" stop-color="#6e3514"/><stop offset="1" stop-color="#2b1208"/>
    </radialGradient>
    <radialGradient id="${I('blush')}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ff8a8a" stop-opacity="0.75"/><stop offset="1" stop-color="#ff8a8a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${I('cloth')}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8e1f18"/><stop offset="0.6" stop-color="#d63a2b"/><stop offset="1" stop-color="#ff6b5b"/>
    </linearGradient>
    <clipPath id="${I('doClip')}">
      <path d="M68,121 Q64,145 69,164 L123,164 Q128,145 123,121 Q96,113 68,121 Z"/>
    </clipPath>
  </defs>`;
  }

  /* rows of kozane lamellae with odoshi lacing */
  function plateRows(I, x, y, w, rows, rh, pitch) {
    var s = '';
    for (var r = 0; r < rows; r++) {
      var yy = y + r * rh;
      var lace = r === 0 ? `url(#${I('goldV')})` : `url(#${I('crimson')})`;
      s += `<rect x="${x}" y="${yy}" width="${w}" height="${rh - 0.6}" fill="url(#${I('lacquer')})" stroke="${OL}" stroke-width="0.9"/>`;
      /* scalloped plate heads */
      for (var px = x; px < x + w - 0.1; px += pitch) {
        s += `<path d="M${px},${yy + 1.2} Q${px + pitch / 2},${yy - 0.6} ${px + pitch},${yy + 1.2}" fill="none" stroke="#6f7ca6" stroke-width="0.6"/>`;
      }
      s += `<line x1="${x + 0.5}" y1="${yy + 1.5}" x2="${x + w - 0.5}" y2="${yy + 1.5}" stroke="#ffffff" stroke-opacity="0.18" stroke-width="0.8"/>`;
      for (var lx = x + pitch / 2; lx < x + w; lx += pitch) {
        s += `<line x1="${lx}" y1="${yy + 0.8}" x2="${lx}" y2="${yy + rh - 1.2}" stroke="${lace}" stroke-width="1.7" stroke-linecap="round"/>`;
        s += `<line x1="${lx - 0.4}" y1="${yy + 1.2}" x2="${lx - 0.4}" y2="${yy + rh - 1.8}" stroke="#ffffff" stroke-opacity="0.35" stroke-width="0.4"/>`;
      }
    }
    /* cross-stitch (hishinui) on bottom row */
    var by = y + (rows - 1) * rh + rh / 2 - 0.3;
    for (var cx = x + pitch; cx < x + w - pitch / 2; cx += pitch * 2) {
      s += `<path d="M${cx - 1.4},${by - 1.4} L${cx + 1.4},${by + 1.4} M${cx + 1.4},${by - 1.4} L${cx - 1.4},${by + 1.4}" stroke="#ffd35c" stroke-width="0.9"/>`;
    }
    return s;
  }

  /* sode shoulder guard, drawn in local coords (0,0) top-left */
  function sode(I, w, h) {
    var rows = 4, rh = (h - 6) / rows;
    return `
      <rect x="-1.5" y="-1.5" width="${w + 3}" height="${h + 3}" rx="3" fill="${OL}"/>
      <rect x="0" y="0" width="${w}" height="5" rx="1.5" fill="url(#${I('gold')})"/>
      <circle cx="3" cy="2.5" r="0.9" fill="#fff6c4"/><circle cx="${w - 3}" cy="2.5" r="0.9" fill="#fff6c4"/><circle cx="${w / 2}" cy="2.5" r="0.9" fill="#fff6c4"/>
      ${plateRows(I, 0, 6, w, rows, rh, 4)}
      <rect x="0" y="${h - 1.6}" width="${w}" height="1.6" fill="url(#${I('gold')})"/>
      <path d="M${w * 0.35},${h} l-1,5 M${w * 0.65},${h} l1,5" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>
      <path d="M${w * 0.35},${h} l-1,5 M${w * 0.65},${h} l1,5" stroke="#e8483a" stroke-width="1.6" stroke-linecap="round"/>`;
  }

  function mitsudomoe(cx, cy, s, fill) {
    var comma = 'M-1.9,-2.6 A2,2 0 1 1 1.9,-2.2 C2.4,0.6 0.8,3.4 -2.6,4.4 C-0.4,2.4 -0.6,0 -1.9,-2.6 Z';
    return `<g transform="translate(${cx},${cy}) scale(${s})" fill="${fill}">
        <path d="${comma}" transform="translate(0,-2.4)"/>
        <path d="${comma}" transform="rotate(120) translate(0,-2.4)"/>
        <path d="${comma}" transform="rotate(240) translate(0,-2.4)"/>
      </g>`;
  }

  function torso(I) {
    return `
    <!-- dō chest armor -->
    <path d="M68,121 Q64,145 69,164 L123,164 Q128,145 123,121 Q96,113 68,121 Z" fill="${OL}" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/>
    <g clip-path="url(#${I('doClip')})">
      <rect x="60" y="112" width="70" height="56" fill="url(#${I('lacquerH')})"/>
      ${plateRows(I, 60, 129, 70, 4, 8.6, 4.4)}
      <!-- munaita (breast plate) -->
      <path d="M60,112 L130,112 L130,129 Q96,124 60,129 Z" fill="url(#${I('lacquerH')})"/>
      <path d="M60,129 Q96,124 130,129" fill="none" stroke="url(#${I('gold')})" stroke-width="2.2"/>
      <path d="M60,127 Q96,122 130,127" fill="none" stroke="#fff6c4" stroke-width="0.5" stroke-opacity="0.8"/>
      <!-- right side shading & highlight -->
      <path d="M112,112 Q126,140 118,168 L132,168 L132,112 Z" fill="#000" opacity="0.18"/>
      <path d="M74,124 Q71,142 74,160" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="2" stroke-linecap="round"/>
    </g>
    <!-- mon (family crest) -->
    <circle cx="101" cy="137" r="8.3" fill="${OL}"/>
    <circle cx="101" cy="137" r="7" fill="url(#${I('gold')})"/>
    <circle cx="101" cy="137" r="5.6" fill="#b3261e"/>
    ${mitsudomoe(101, 137, 0.95, '#ffd35c')}
    <path d="M96.5,132 A6,6 0 0 1 103,131.4" fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="0.8" stroke-linecap="round"/>
    <!-- gold rivets on munaita -->
    <circle cx="78" cy="122" r="1.3" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="0.5"/>
    <circle cx="116" cy="122" r="1.3" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="0.5"/>
    <!-- nodowa throat guard / collar -->
    <path d="M82,116 Q96,124 112,116 L110,112 Q96,118 84,112 Z" fill="#e8483a" stroke="${OL}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M85,114 Q96,119.5 109,114" fill="none" stroke="#ffd35c" stroke-width="0.8" stroke-dasharray="1.5 1.2"/>`;
  }

  function kusazuri(I) {
    var s = '';
    var panels = [[62, 16, -6], [78, 17, -2], [95, 17, 2], [112, 16, 6]];
    for (var i = 0; i < panels.length; i++) {
      var p = panels[i];
      var x = p[0], w = p[1], rot = p[2];
      s += `<g transform="rotate(${rot} ${x + w / 2} 164)">
        <rect x="${x - 1.5}" y="162.5" width="${w + 3}" height="25" rx="2" fill="${OL}"/>
        ${plateRows(I, x, 164, w, 3, 7.4, 4)}
        <rect x="${x}" y="185.4" width="${w}" height="1.6" fill="url(#${I('gold')})"/>
      </g>`;
    }
    return s;
  }

  function obi(I) {
    return `
    <path d="M66,159 Q96,163 126,159 L126,168 Q96,172 66,168 Z" fill="url(#${I('obi')})" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M67,161.5 Q96,165.5 125,161.5" fill="none" stroke="#e3b5f5" stroke-width="0.8"/>
    <path d="M67,166 Q96,170 125,166" fill="none" stroke="#3a1650" stroke-width="0.8"/>
    <path d="M70,163.6 Q96,167.6 122,163.6" fill="none" stroke="#ffd35c" stroke-width="0.7" stroke-dasharray="2 1.6"/>
    <!-- obi knot -->
    <path d="M70,163 l-7,-5 l-2,9 z M70,164 l-5,9 l7,1 z" fill="url(#${I('obi')})" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>
    <ellipse cx="70.5" cy="164" rx="3.2" ry="3.6" fill="#7d3c98" stroke="${OL}" stroke-width="1.6"/>`;
  }

  /* wakizashi: saya behind, handle forward-right */
  function wakizashiBack(I) {
    return `
    <g transform="translate(110,160) rotate(162)">
      <path d="M0,-3.2 L58,-2.4 Q62,0 58,2.4 L0,3.2 Z" fill="#7a1a14" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M2,-1.6 L56,-1.2" stroke="#ff8a7a" stroke-width="0.8" stroke-opacity="0.8"/>
      <rect x="53" y="-2.8" width="6" height="5.6" rx="1.5" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="1"/>
      <rect x="20" y="-3.4" width="3" height="6.8" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="0.7"/>
    </g>`;
  }
  function wakizashiFront(I) {
    var diamonds = '';
    for (var i = 0; i < 3; i++) {
      var x = 5 + i * 4.4;
      diamonds += `<path d="M${x},0 L${x + 2.2},-1.8 L${x + 4.4},0 L${x + 2.2},1.8 Z" fill="#f4ecd8" stroke="#1a1410" stroke-width="0.4"/>`;
    }
    return `
    <g transform="translate(112,162) rotate(-18)">
      <ellipse cx="2" cy="0" rx="1.8" ry="5.2" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="1.3"/>
      <rect x="3.5" y="-2.8" width="16" height="5.6" rx="1.2" fill="#1d1a24" stroke="${OL}" stroke-width="1.4"/>
      ${diamonds}
      <rect x="18.5" y="-3" width="3" height="6" rx="1.2" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="1"/>
    </g>`;
  }

  function legs(I) {
    var pleats = '';
    var xs = [[76, 178, 70, 214], [83, 178, 80, 216], [104, 180, 108, 218], [111, 180, 117, 218], [118, 180, 125, 214]];
    for (var i = 0; i < xs.length; i++) {
      var p = xs[i];
      pleats += `<path d="M${p[0]},${p[1]} L${p[2]},${p[3]}" stroke="#1a2036" stroke-width="1.3" stroke-linecap="round"/>`;
      pleats += `<path d="M${p[0] + 1.6},${p[1]} L${p[2] + 1.6},${p[3]}" stroke="#6a7aa6" stroke-width="0.8" stroke-opacity="0.7" stroke-linecap="round"/>`;
    }
    function foot(x, dir) {
      /* tabi + waraji, toes to the right */
      return `
      <g transform="translate(${x},0)">
        <path d="M-1,229 L33,229 Q36,228 35,225.5 L-1,225.5 Q-3,227.5 -1,229 Z" fill="#d9a85c" stroke="${OL}" stroke-width="2"/>
        <path d="M2,227.4 h3 M8,227.4 h3 M14,227.4 h3 M20,227.4 h3 M26,227.4 h3" stroke="#9c6b2c" stroke-width="0.9"/>
        <path d="M1,225.5 L1,217 Q12,214 24,217 Q33,219 33,225.5 Z" fill="#fbf7ee" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M27,219.5 L27,225" stroke="#b8b0a0" stroke-width="1"/>
        <path d="M4,219 Q12,217 20,219" fill="none" stroke="#d8d0c0" stroke-width="0.9"/>
        <!-- waraji straps -->
        <path d="M27,225 L22,219 L12,225" fill="none" stroke="#8a5a22" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M27,225 L22,219 L12,225" fill="none" stroke="#e8b86a" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M5,225 L8,219.5" stroke="#8a5a22" stroke-width="2" stroke-linecap="round"/>
        <path d="M5,225 L8,219.5" stroke="#e8b86a" stroke-width="0.8" stroke-linecap="round"/>
      </g>`;
    }
    return `
    <!-- hakama -->
    <path d="M70,170 L56,214 Q72,221 90,216 L96,190 L101,218 Q120,223 136,214 L122,170 Z" fill="url(#${I('hakama')})" stroke="${OL}" stroke-width="3.2" stroke-linejoin="round"/>
    <path d="M96,190 L94,178" stroke="${OL}" stroke-width="1.6"/>
    ${pleats}
    <path d="M58,211 Q72,217 89,213" fill="none" stroke="#6a7aa6" stroke-width="1" stroke-opacity="0.6"/>
    <path d="M102,215 Q120,219 134,211" fill="none" stroke="#6a7aa6" stroke-width="1" stroke-opacity="0.6"/>
    <path d="M122,172 L134,212 L128,214 Z" fill="#000" opacity="0.18"/>
    ${foot(60, 1)}
    ${foot(100, 1)}`;
  }

  function cape(I) {
    return `
    <g class="part-cape" style="transform-origin: 58px 62px">
      <path d="M60,58 C46,50 34,66 18,60 L14,72 C30,80 46,66 60,66 Z" fill="url(#${I('cloth')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M58,60 C46,56 36,68 22,64" fill="none" stroke="#ffb3a8" stroke-width="1" stroke-opacity="0.8"/>
      <path d="M18,60 L14,72" stroke="#ffd35c" stroke-width="2"/>
      <path d="M16,61 l-4,-1 M15,64.5 l-4.5,0 M14.5,68 l-4.5,1 M14,71 l-4,2" stroke="#ffd35c" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M60,64 C50,74 44,92 30,98 L38,108 C50,98 56,82 64,70 Z" fill="url(#${I('cloth')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M58,70 C50,82 44,94 34,101" fill="none" stroke="#ffb3a8" stroke-width="1" stroke-opacity="0.8"/>
      <path d="M30,98 L38,108" stroke="#ffd35c" stroke-width="2"/>
      <path d="M31,100 l-3.5,2.5 M33,103 l-3,3 M35.5,105.5 l-2.5,3.5" stroke="#ffd35c" stroke-width="1.2" stroke-linecap="round"/>
      ${mitsudomoe(28, 66, 0.5, '#ffd35c')}
    </g>`;
  }

  function head(I, eyesClass) {
    var ec = eyesClass ? ' class="part-eyes" style="transform-origin: 105px 80px"' : '';
    /* shikoro lames */
    var shik = '';
    for (var r = 0; r < 4; r++) {
      var y0 = 52 + r * 11;
      var spread = r * 5;
      shik += `<path d="M${50 - spread},${y0} Q97,${y0 - 4} ${146 + spread * 0.5},${y0} L${147 + spread * 0.6},${y0 + 11} Q97,${y0 + 7} ${45 - spread - 4},${y0 + 11} Z" fill="url(#${I('lacquer')})" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>`;
      shik += `<path d="M${52 - spread},${y0 + 2} Q97,${y0 - 2} ${144 + spread * 0.5},${y0 + 2}" fill="none" stroke="#7f8bb5" stroke-width="0.8" stroke-opacity="0.7"/>`;
      var lace = r % 2 === 0 ? '#d63a2b' : '#f2bf3c';
      for (var k = 0; k < 13; k++) {
        var lx = 48 - spread - 2 + k * ((100 + spread * 1.6) / 12);
        shik += `<line x1="${lx.toFixed(1)}" y1="${y0 + 2}" x2="${(lx - 0.6).toFixed(1)}" y2="${y0 + 9}" stroke="${lace}" stroke-width="1.8" stroke-linecap="round"/>`;
      }
    }
    /* bowl ridges + rivets */
    var ridges = '', rivets = '';
    for (var j = 1; j < 9; j++) {
      var bx = 58 + j * 9.2;
      ridges += `<path d="M98,21 Q${(98 + (bx - 98) * 0.75).toFixed(1)},30 ${bx.toFixed(1)},52" fill="none" stroke="#11152a" stroke-width="1" stroke-opacity="0.7"/>`;
      rivets += `<circle cx="${(98 + (bx - 98) * 0.9).toFixed(1)}" cy="44" r="1.1" fill="#d7deef" stroke="${OL}" stroke-width="0.4"/>`;
      rivets += `<circle cx="${(98 + (bx - 98) * 0.72).toFixed(1)}" cy="34" r="0.9" fill="#d7deef" stroke="${OL}" stroke-width="0.4"/>`;
    }
    return `
    <!-- shikoro neck guard -->
    <g>${shik}</g>
    <path d="M40,96 Q97,88 150,96" fill="none" stroke="url(#${I('gold')})" stroke-width="1.8"/>
    <!-- hair (sideburn + back) -->
    <path d="M66,58 Q60,78 70,96 L78,92 Q72,76 76,60 Z" fill="#231a22" stroke="${OL}" stroke-width="2"/>
    <!-- face -->
    <path d="M72,60 Q70,98 100,106 Q128,106 134,84 Q138,66 128,56 Z" fill="url(#${I('skin')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
    <!-- ear -->
    <path d="M77,78 Q70,74 70,82 Q71,89 78,88" fill="url(#${I('skin')})" stroke="${OL}" stroke-width="2"/>
    <path d="M75,80 Q73,82 75,85" fill="none" stroke="#d98e6a" stroke-width="1"/>
    <!-- bangs peeking under brim -->
    <path d="M78,56 L84,68 L90,58 L97,66 L103,57 L108,64 L114,57 L120,62 L126,56 Z" fill="#231a22" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M86,60 L88,63 M99,60 L101,62" stroke="#5b4a66" stroke-width="0.8"/>
    <!-- blush -->
    <ellipse cx="94" cy="92" rx="6" ry="3.5" fill="url(#${I('blush')})"/>
    <ellipse cx="126" cy="90" rx="5" ry="3.2" fill="url(#${I('blush')})"/>
    <path d="M91,91 l1.5,-1.5 M94,91 l1.5,-1.5 M124,89.5 l1.2,-1.4 M127,89.5 l1.2,-1.4" stroke="#e9707a" stroke-width="0.7" stroke-linecap="round"/>
    <!-- determined brows -->
    <path d="M89,68.5 L103,72.5" stroke="${OL}" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M113,72 L126,67.5" stroke="${OL}" stroke-width="3.6" stroke-linecap="round"/>
    <!-- eyes -->
    <g${ec}>
      <path d="M90,75 Q97,72 104,76 L104,86 Q97,90 91,86 Z" fill="#fff" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>
      <ellipse cx="99" cy="81" rx="4.3" ry="5.3" fill="url(#${I('iris')})" stroke="${OL}" stroke-width="0.8"/>
      <ellipse cx="99.4" cy="81.5" rx="2" ry="2.6" fill="#1a0c06"/>
      <circle cx="100.8" cy="79" r="1.7" fill="#fff"/><circle cx="97.4" cy="84" r="0.8" fill="#fff"/>
      <path d="M89,75.5 Q97,71 105,76" fill="none" stroke="${OL}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M112,76 Q119,72 126,75 L125,86 Q119,90 113,86 Z" fill="#fff" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>
      <ellipse cx="121" cy="81" rx="4.1" ry="5.3" fill="url(#${I('iris')})" stroke="${OL}" stroke-width="0.8"/>
      <ellipse cx="121.4" cy="81.5" rx="1.9" ry="2.6" fill="#1a0c06"/>
      <circle cx="122.8" cy="79" r="1.7" fill="#fff"/><circle cx="119.6" cy="84" r="0.8" fill="#fff"/>
      <path d="M111,76 Q119,71 127,75" fill="none" stroke="${OL}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M126,75 l2.5,-1.5" stroke="${OL}" stroke-width="1.6" stroke-linecap="round"/>
    </g>
    <!-- nose + mouth -->
    <path d="M110,87.5 q1.5,1.5 0,2.5" fill="none" stroke="#c9775a" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M104,96.5 Q110,94.5 116,96.5" fill="none" stroke="${OL}" stroke-width="2" stroke-linecap="round"/>
    <path d="M116,96.5 l1.5,-1" stroke="${OL}" stroke-width="1.4" stroke-linecap="round"/>
    <!-- battle scar -->
    <path d="M129,78 l3,6 M129.5,81.5 l2.4,-0.8 M130.5,83.5 l2.2,-0.8" stroke="#c96b5a" stroke-width="0.9" stroke-linecap="round"/>
    <!-- chin cord (shinobi-no-o) -->
    <path d="M77,88 Q84,101 98,104 M134,82 Q130,99 110,104" fill="none" stroke="#b3261e" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M77,88 Q84,101 98,104 M134,82 Q130,99 110,104" fill="none" stroke="#ff7a6a" stroke-width="0.8" stroke-linecap="round" stroke-dasharray="1.6 1.4"/>
    <path d="M104,104 q-7,-5 -8,2 q4,3 8,-2 q7,-5 8,2 q-4,3 -8,-2 z" fill="#d63a2b" stroke="${OL}" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M103,105 l-3,6 M105,105 l3,6" stroke="#d63a2b" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="104" cy="104.4" r="1.4" fill="#ffd35c" stroke="${OL}" stroke-width="0.6"/>
    <!-- topknot poking through tehen -->
    <path d="M96,20 Q92,10 100,7 Q108,6 106,14 Q104,11 101,12 Q99,15 102,20 Z" fill="#231a22" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M96,15 Q100,14 103,16" stroke="#e8483a" stroke-width="1.6" fill="none"/>
    <path d="M99,9.5 Q102,8.5 104,10" fill="none" stroke="#6e5a78" stroke-width="0.8"/>
    <!-- kabuto bowl -->
    <path d="M56,55 Q54,20 98,18 Q142,20 140,55 Z" fill="url(#${I('bowl')})" stroke="${OL}" stroke-width="3.2" stroke-linejoin="round"/>
    ${ridges}
    ${rivets}
    <path d="M66,44 Q66,28 84,23" fill="none" stroke="#ffffff" stroke-opacity="0.45" stroke-width="3" stroke-linecap="round"/>
    <path d="M70,48 Q70,40 72,36" fill="none" stroke="#ffffff" stroke-opacity="0.3" stroke-width="1.6" stroke-linecap="round"/>
    <!-- tehen kanamono ring -->
    <ellipse cx="98.5" cy="20" rx="6" ry="2.6" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="1.4"/>
    <ellipse cx="98.5" cy="19.6" rx="3.2" ry="1.2" fill="#3a2a10"/>
    <!-- fukigaeshi (side wings) -->
    <path d="M58,50 Q44,48 40,58 Q46,66 60,64 Z" fill="url(#${I('lacquer')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M56,52 Q46,51 43,58" fill="none" stroke="url(#${I('gold')})" stroke-width="1.4"/>
    <circle cx="50" cy="58" r="3.4" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="0.8"/>
    ${mitsudomoe(50, 58, 0.45, '#b3261e')}
    <path d="M136,50 Q150,48 154,58 Q148,66 136,63 Z" fill="url(#${I('lacquer')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M138,52 Q148,51 151,58" fill="none" stroke="url(#${I('gold')})" stroke-width="1.4"/>
    <circle cx="145" cy="57.5" r="3.2" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="0.8"/>
    ${mitsudomoe(145, 57.5, 0.42, '#b3261e')}
    <!-- mabizashi (visor) -->
    <path d="M60,52 Q100,44 142,50 L146,57 Q100,52 58,59 Z" fill="url(#${I('lacquerH')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M59,58.2 Q100,51.2 145.5,56.2" fill="none" stroke="url(#${I('gold')})" stroke-width="1.6"/>
    <path d="M66,51.5 Q100,45.5 136,49.5" fill="none" stroke="#9aa6cc" stroke-width="0.8" stroke-opacity="0.8"/>
    <!-- hachimaki knot at back -->
    <path d="M58,58 q-6,-5 -8,2 q4,4 8,0 z M58,62 q-6,5 -3,9 q5,-2 5,-7 z" fill="#d63a2b" stroke="${OL}" stroke-width="1.5" stroke-linejoin="round"/>
    <circle cx="59" cy="61" r="2.4" fill="#e8483a" stroke="${OL}" stroke-width="1.2"/>
    <!-- maedate: golden crescent -->
    <path d="M62,5 Q104,66 146,5 Q104,46 62,5 Z" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M70,11 Q104,52 138,11" fill="none" stroke="#fff6c4" stroke-width="1.2" stroke-opacity="0.9" stroke-linecap="round"/>
    <path d="M78,20 Q104,44 130,20" fill="none" stroke="#a8651a" stroke-width="0.7" stroke-opacity="0.8"/>
    <!-- haraidate holder -->
    <path d="M96,34 L112,34 L110,48 L98,48 Z" fill="url(#${I('goldV')})" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="104" cy="41" r="4.6" fill="#b3261e" stroke="${OL}" stroke-width="1.4"/>
    ${mitsudomoe(104, 41, 0.55, '#ffd35c')}
    <circle cx="102.5" cy="39" r="1" fill="#fff" opacity="0.8"/>
    <circle cx="64" cy="7" r="1.2" fill="#fff6c4"/><circle cx="144" cy="7" r="1.2" fill="#fff6c4"/>`;
  }

  function backArm(I) {
    return `
    <!-- back arm (kote) -->
    <path d="M62,130 Q58,146 64,158 L76,156 Q74,144 76,132 Z" fill="#1d2238" stroke="${OL}" stroke-width="2.8" stroke-linejoin="round"/>
    <path d="M63,140 l11,-1 M63.5,146 l11,-1 M64.5,152 l11,-1" stroke="#5c6890" stroke-width="1" stroke-dasharray="1.2 1.2"/>
    <rect x="63" y="141.5" width="10" height="3" rx="1" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="0.7" transform="rotate(-5 68 143)"/>
    <ellipse cx="70" cy="160" rx="6.5" ry="6" fill="url(#${I('skin')})" stroke="${OL}" stroke-width="2.4"/>
    <path d="M66,158 q2,3 6,2 M66.5,161.5 q2,2 5.5,1" fill="none" stroke="#c9775a" stroke-width="0.9"/>
    <!-- back sode -->
    <g transform="translate(52,118) rotate(8)">${sode(I, 22, 30)}</g>`;
  }

  function weaponArm(I) {
    var ito = '';
    for (var i = 0; i < 5; i++) {
      var x = -21 + i * 4.8;
      ito += `<path d="M${x},0 L${x + 2.4},-2.2 L${x + 4.8},0 L${x + 2.4},2.2 Z" fill="#f4ecd8" stroke="#0e0c14" stroke-width="0.5"/>`;
      ito += `<path d="M${x + 2.4},-3 L${x + 4.8},0 L${x + 2.4},3" fill="none" stroke="#3b3550" stroke-width="0.6"/>`;
    }
    return `
    <g class="part-weapon" style="transform-origin: 122px 126px">
      <!-- katana -->
      <g transform="translate(146,148) rotate(-64)">
        <!-- blade -->
        <path d="M14,-2.8 Q58,-3.4 98,-8.6 L106,-10.2 Q103,-4.4 96,-2.2 Q56,3.4 14,2.8 Z" fill="url(#${I('steel')})" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>
        <!-- hamon -->
        <path d="M15,1.2 q3,-1.6 6,0 q3,1.6 6,0 q3,-1.6 6,0 q3,1.6 6,-0.2 q3,-1.8 6,-0.3 q3,1.4 6,-0.6 q3,-1.9 6,-0.6 q3,1.2 6,-1 q3,-2 6,-1 q3,1 6,-1.4 q3,-2 6,-1.4 q3,0.8 6,-1.8 q3,-2.2 5,-2" fill="none" stroke="#ffffff" stroke-width="1.1" stroke-linecap="round"/>
        <path d="M15,1.9 q3,-1.6 6,0 q3,1.6 6,0 q3,-1.6 6,0 q3,1.6 6,-0.2 q3,-1.8 6,-0.3 q3,1.4 6,-0.6 q3,-1.9 6,-0.6 q3,1.2 6,-1 q3,-2 6,-1 q3,1 6,-1.4 q3,-2 6,-1.4 q3,0.8 6,-1.8" fill="none" stroke="#9fb0c4" stroke-width="0.5"/>
        <!-- shinogi ridge + shine -->
        <path d="M14,-1.2 Q56,-2 96,-6.6 L103,-8.8" fill="none" stroke="#7a8aa0" stroke-width="0.6"/>
        <path d="M20,-2 Q56,-2.8 90,-6.8" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M60,-3.2 l6,-0.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
        <path d="M83,-9 l1.5,-4 l1.5,4 l4,1.5 l-4,1.5 l-1.5,4 l-1.5,-4 l-4,-1.5 z" fill="#ffffff" opacity="0.95"/>
        <!-- habaki -->
        <path d="M10,-3.4 L15,-3.2 L15,3.2 L10,3.4 Z" fill="url(#${I('goldV')})" stroke="${OL}" stroke-width="1.2"/>
        <path d="M11.5,-2.6 l2,5" stroke="#fff6c4" stroke-width="0.6"/>
        <!-- tsuba -->
        <ellipse cx="8" cy="0" rx="2.8" ry="8" fill="${OL}"/>
        <ellipse cx="8" cy="0" rx="1.8" ry="7" fill="url(#${I('gold')})"/>
        <circle cx="8" cy="-4.2" r="0.8" fill="#8a4f12"/><circle cx="8" cy="4.2" r="0.8" fill="#8a4f12"/>
        <path d="M7.4,-6 Q7,0 7.4,6" fill="none" stroke="#fff6c4" stroke-width="0.5"/>
        <!-- tsuka (handle) -->
        <rect x="-23" y="-3.4" width="30" height="6.8" rx="2" fill="#15121c" stroke="${OL}" stroke-width="1.8"/>
        ${ito}
        <rect x="3.5" y="-3.6" width="3" height="7.2" rx="0.8" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="0.8"/>
        <path d="M-25.5,-3 Q-27,0 -25.5,3 L-22,3.6 L-22,-3.6 Z" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M-10,-3.6 q2,-1.8 4,0" fill="#f6c945" stroke="${OL}" stroke-width="0.6"/>
        <!-- sageo cord tassel -->
        <path d="M-25,2 Q-30,10 -26,16" fill="none" stroke="#d63a2b" stroke-width="1.6" stroke-linecap="round"/>
      </g>
      <!-- sword arm -->
      <path d="M118,128 Q126,128 134,136 L148,142 L144,154 L128,150 Q116,144 114,134 Z" fill="#1d2238" stroke="${OL}" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M122,138 l6,4 M126,134 l6,4 M131,139 l6,4" stroke="#5c6890" stroke-width="1" stroke-dasharray="1.2 1.2"/>
      <path d="M134,138 L145,142.5 L142.5,150 L131,146 Z" fill="url(#${I('lacquer')})" stroke="${OL}" stroke-width="1.2"/>
      <path d="M136,140.5 l6,2.5 M134.5,143.5 l6,2.5" stroke="url(#${I('gold')})" stroke-width="0.9"/>
      <!-- fist around the tsuka -->
      <path d="M140,141 Q148,137 153,142 Q156,149 150,154 Q143,156 140,151 Z" fill="url(#${I('skin')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M146,140.5 q3,2 2.5,5 M149.5,142.5 q3,2 2,5 M142.5,143.5 q3,2 2,5" fill="none" stroke="#c9775a" stroke-width="1"/>
      <path d="M140,148 Q146,146 150,151" fill="none" stroke="${OL}" stroke-width="1.4" stroke-linecap="round"/>
      <!-- front sode -->
      <g transform="translate(112,117) rotate(-10)">${sode(I, 23, 31)}</g>
    </g>`;
  }

  function svg(uid) {
    var I = ids(uid);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240">
  ${defs(I)}
  <ellipse class="part-shadow" cx="97" cy="229" rx="54" ry="7" fill="#000" opacity="0.25"/>
  ${legs(I)}
  <g class="part-body">
    ${cape(I)}
    ${wakizashiBack(I)}
    ${backArm(I)}
    ${kusazuri(I)}
    ${torso(I)}
    ${obi(I)}
    ${wakizashiFront(I)}
    <g class="part-head" style="transform-origin: 97px 108px">
      ${head(I, true)}
    </g>
    ${weaponArm(I)}
  </g>
</svg>`;
  }

  function portrait(uid) {
    var I = ids('p' + (uid == null ? '' : uid));
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  ${defs(I)}
  <defs>
    <radialGradient id="${I('pbg')}" cx="0.5" cy="0.4" r="0.7">
      <stop offset="0" stop-color="#ffb199"/><stop offset="1" stop-color="#c0392b"/>
    </radialGradient>
    <clipPath id="${I('pclip')}"><rect x="0" y="0" width="120" height="120" rx="14"/></clipPath>
  </defs>
  <g clip-path="url(#${I('pclip')})">
    <rect width="120" height="120" fill="url(#${I('pbg')})"/>
    <circle cx="60" cy="52" r="46" fill="#ffffff" opacity="0.15"/>
    <path d="M0,104 L30,90 L60,104 L90,90 L120,104 L120,120 L0,120 Z" fill="#8e1f18" opacity="0.35"/>
    <g transform="translate(-6,-1) scale(0.72)">
      <g transform="translate(52,118) rotate(8)">${sode(I, 22, 30)}</g>
      ${torso(I)}
      <g transform="translate(112,117) rotate(-10)">${sode(I, 23, 31)}</g>
      ${head(I, false)}
    </g>
  </g>
</svg>`;
  }

  window.HEROES = window.HEROES || {};
  window.HEROES.samurai = {
    key: 'samurai',
    name: 'Kenji',
    title: 'The Samurai',
    lore: 'A wandering swordsman sworn to his clan\'s crescent crest. His blade leaves the scabbard only once per duel, and once is always enough.',
    color: '#c0392b',
    base: { hp: 500, atk: 105, def: 22 },
    fx: { slash: '#ff4d4d', glow: '#ffd1d1' },
    signature: { name: 'Iaijutsu', desc: '25% chance to strike with a lightning-fast critical for 250% damage.', type: 'crit' },
    svg: svg,
    portrait: portrait
  };
})();

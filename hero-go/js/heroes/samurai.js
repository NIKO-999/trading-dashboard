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
    <clipPath id="${I('bowlClip')}"><path d="M56,55 Q54,20 98,18 Q142,20 140,55 Z"/></clipPath>
    <clipPath id="${I('faceClip')}"><path d="M72,60 Q70,98 100,106 Q128,106 134,84 Q138,66 128,56 Z"/></clipPath>
    <clipPath id="${I('hakClip')}"><path d="M70,170 L56,214 Q72,221 90,216 L96,190 L101,218 Q120,223 136,214 L122,170 Z"/></clipPath>
    <clipPath id="${I('bladeClip')}"><path d="M14,-2.8 Q58,-3.4 98,-8.6 L106,-10.2 Q103,-4.4 96,-2.2 Q56,3.4 14,2.8 Z"/></clipPath>
    <clipPath id="${I('kbClip')}"><path d="M62,130 Q58,146 64,158 L76,156 Q74,144 76,132 Z"/></clipPath>
    <clipPath id="${I('kfClip')}"><path d="M118,128 Q126,128 134,136 L148,142 L144,154 L128,150 Q116,144 114,134 Z"/></clipPath>
    <clipPath id="${I('obiClip')}"><path d="M66,159 Q96,163 126,159 L126,168 Q96,172 66,168 Z"/></clipPath>
    <linearGradient id="${I('brimAO')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5a2418" stop-opacity="0.32"/><stop offset="1" stop-color="#5a2418" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${I('sideAO')}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#5a2418" stop-opacity="0.22"/><stop offset="1" stop-color="#5a2418" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${I('aoDown')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#05060f" stop-opacity="0.5"/><stop offset="1" stop-color="#05060f" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${I('aoUp')}" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#05060f" stop-opacity="0.45"/><stop offset="1" stop-color="#05060f" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${I('sheen')}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <pattern id="${I('lzC')}" width="4" height="4.4" patternUnits="userSpaceOnUse">
      <path d="M0,0 V4.4 M4,0 V4.4" stroke="#090c18" stroke-width="0.45" stroke-opacity="0.6"/>
      <path d="M0.8,0 V4.4" stroke="#8b98c4" stroke-width="0.3" stroke-opacity="0.45"/>
      <rect x="1.35" y="0.5" width="1.1" height="3.3" rx="0.5" fill="#c23427"/>
      <rect x="2.2" y="0.5" width="0.6" height="3.5" rx="0.3" fill="#a52a20"/>
      <path d="M1.6,0.8 V3.8" stroke="#ff8a7a" stroke-width="0.35" stroke-opacity="0.8"/>
      <path d="M1.15,1 l1.7,0.9 M1.15,2.9 l1.7,0.9" stroke="#5e120c" stroke-width="0.3" stroke-opacity="0.5"/>
    </pattern>
    <pattern id="${I('lzG')}" width="4" height="4.4" patternUnits="userSpaceOnUse">
      <path d="M0,0 V4.4 M4,0 V4.4" stroke="#090c18" stroke-width="0.45" stroke-opacity="0.6"/>
      <path d="M0.8,0 V4.4" stroke="#8b98c4" stroke-width="0.3" stroke-opacity="0.45"/>
      <rect x="1.35" y="0.5" width="1.1" height="3.3" rx="0.5" fill="#e8b535"/>
      <rect x="2.2" y="0.5" width="0.6" height="3.5" rx="0.3" fill="#b9761e"/>
      <path d="M1.6,0.8 V3.8" stroke="#fff2a8" stroke-width="0.35" stroke-opacity="0.8"/>
      <path d="M1.15,1 l1.7,0.9 M1.15,2.9 l1.7,0.9" stroke="#7a4a0c" stroke-width="0.3" stroke-opacity="0.5"/>
    </pattern>
    <pattern id="${I('lzC2')}" width="4.4" height="4.4" patternUnits="userSpaceOnUse">
      <path d="M0,0 V4.4 M4.4,0 V4.4" stroke="#090c18" stroke-width="0.45" stroke-opacity="0.6"/>
      <path d="M0.8,0 V4.4" stroke="#8b98c4" stroke-width="0.3" stroke-opacity="0.45"/>
      <rect x="1.55" y="0.5" width="1.1" height="3.3" rx="0.5" fill="#c23427"/>
      <rect x="2.4" y="0.5" width="0.6" height="3.5" rx="0.3" fill="#a52a20"/>
      <path d="M1.8,0.8 V3.8" stroke="#ff8a7a" stroke-width="0.35" stroke-opacity="0.8"/>
      <path d="M1.35,1 l1.7,0.9 M1.35,2.9 l1.7,0.9" stroke="#5e120c" stroke-width="0.3" stroke-opacity="0.5"/>
    </pattern>
    <pattern id="${I('lzG2')}" width="4.4" height="4.4" patternUnits="userSpaceOnUse">
      <path d="M0,0 V4.4 M4.4,0 V4.4" stroke="#090c18" stroke-width="0.45" stroke-opacity="0.6"/>
      <path d="M0.8,0 V4.4" stroke="#8b98c4" stroke-width="0.3" stroke-opacity="0.45"/>
      <rect x="1.55" y="0.5" width="1.1" height="3.3" rx="0.5" fill="#e8b535"/>
      <rect x="2.4" y="0.5" width="0.6" height="3.5" rx="0.3" fill="#b9761e"/>
      <path d="M1.8,0.8 V3.8" stroke="#fff2a8" stroke-width="0.35" stroke-opacity="0.8"/>
      <path d="M1.35,1 l1.7,0.9 M1.35,2.9 l1.7,0.9" stroke="#7a4a0c" stroke-width="0.3" stroke-opacity="0.5"/>
    </pattern>
    <pattern id="${I('twill')}" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
      <line x1="0" y1="0" x2="0" y2="3.2" stroke="#9fb0e0" stroke-width="0.55" stroke-opacity="0.32"/>
      <line x1="1.6" y1="0" x2="1.6" y2="3.2" stroke="#0a0f20" stroke-width="0.4" stroke-opacity="0.22"/>
    </pattern>
    <pattern id="${I('weave')}" width="2.4" height="2.4" patternUnits="userSpaceOnUse">
      <path d="M0,0.6 H2.4 M0,1.8 H2.4" stroke="#fff" stroke-opacity="0.16" stroke-width="0.35"/>
      <path d="M0.6,0 V2.4 M1.8,0 V2.4" stroke="#000" stroke-opacity="0.16" stroke-width="0.35"/>
    </pattern>
    <pattern id="${I('hammer')}" width="7" height="6" patternUnits="userSpaceOnUse">
      <circle cx="1.8" cy="1.6" r="1.5" fill="none" stroke="#fff" stroke-opacity="0.09" stroke-width="0.5"/>
      <circle cx="5.3" cy="4.6" r="1.4" fill="none" stroke="#000" stroke-opacity="0.14" stroke-width="0.5"/>
    </pattern>
    <pattern id="${I('same')}" width="3" height="3" patternUnits="userSpaceOnUse">
      <circle cx="0.75" cy="0.75" r="0.6" fill="#f8f3e3"/><circle cx="2.25" cy="2.25" r="0.6" fill="#f8f3e3"/>
      <circle cx="0.75" cy="0.75" r="0.9" fill="none" stroke="#7a7060" stroke-width="0.2" stroke-opacity="0.6"/>
    </pattern>
    <pattern id="${I('straw')}" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
      <line x1="0" y1="0.5" x2="3" y2="0.5" stroke="#8a5a22" stroke-width="0.7" stroke-opacity="0.8"/>
      <line x1="0" y1="2" x2="3" y2="2" stroke="#fff0b8" stroke-width="0.5" stroke-opacity="0.6"/>
    </pattern>
    <pattern id="${I('mail')}" width="3" height="3" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r="1.05" fill="none" stroke="#a9b4d6" stroke-width="0.45" stroke-opacity="0.75"/>
      <circle cx="0" cy="0" r="1.05" fill="none" stroke="#a9b4d6" stroke-width="0.45" stroke-opacity="0.5"/>
      <circle cx="3" cy="3" r="1.05" fill="none" stroke="#a9b4d6" stroke-width="0.45" stroke-opacity="0.5"/>
    </pattern>
    <pattern id="${I('seiga')}" width="8" height="4" patternUnits="userSpaceOnUse">
      <path d="M0,4 A4,4 0 0 1 8,4 M1.5,4 A2.5,2.5 0 0 1 6.5,4" fill="none" stroke="#e3b5f5" stroke-width="0.4" stroke-opacity="0.5"/>
      <path d="M-4,2 A4,4 0 0 1 4,2 M4,2 A4,4 0 0 1 12,2" fill="none" stroke="#2a0d3d" stroke-width="0.35" stroke-opacity="0.35"/>
    </pattern>
  </defs>`;
  }

  /* small helpers */
  function rivet(I, cx, cy, r) {
    cx = +cx; cy = +cy;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="0.45"/><circle cx="${(cx - r * 0.35).toFixed(2)}" cy="${(cy - r * 0.35).toFixed(2)}" r="${(r * 0.32).toFixed(2)}" fill="#fff"/>`;
  }
  function rivetS(cx, cy, r) {
    cx = +cx; cy = +cy;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#cfd8ee" stroke="${OL}" stroke-width="0.4"/><circle cx="${(cx - r * 0.3).toFixed(2)}" cy="${(cy - r * 0.3).toFixed(2)}" r="${(r * 0.35).toFixed(2)}" fill="#fff"/><circle cx="${(cx + r * 0.3).toFixed(2)}" cy="${(cy + r * 0.35).toFixed(2)}" r="${(r * 0.4).toFixed(2)}" fill="#5a6890" opacity="0.6"/>`;
  }
  function scratches(list, col, op) {
    var s = '';
    for (var i = 0; i < list.length; i++) {
      s += `<path d="${list[i]}" fill="none" stroke="${col || '#ffffff'}" stroke-opacity="${op || 0.5}" stroke-width="0.5" stroke-linecap="round"/>`;
    }
    return s;
  }

  /* rows of kozane lamellae with odoshi lacing (laces/seams come from tiled patterns) */
  function plateRows(I, x, y, w, rows, rh, pitch) {
    var s = '';
    var big = pitch > 4.2;
    for (var r = 0; r < rows; r++) {
      var yy = +(y + r * rh).toFixed(2);
      var pat = (r === 0 ? 'lzG' : 'lzC') + (big ? '2' : '');
      var sc = `M${x},${yy + 1.2}`;
      for (var px = x; px < x + w - 0.1; px += pitch) {
        sc += ` Q${(px + pitch / 2).toFixed(1)},${yy - 0.6} ${(px + pitch).toFixed(1)},${yy + 1.2}`;
      }
      s += `<rect x="${x}" y="${yy}" width="${w}" height="${(rh - 0.6).toFixed(2)}" fill="url(#${I('lacquer')})" stroke="${OL}" stroke-width="0.9"/>`;
      s += `<rect x="${x}" y="${yy}" width="${w}" height="${(rh - 0.6).toFixed(2)}" fill="url(#${I(pat)})"/>`;
      s += `<path d="${sc}" fill="none" stroke="#6f7ca6" stroke-width="0.6"/>`;
      s += `<line x1="${x + 0.5}" y1="${yy + 1.5}" x2="${x + w - 0.5}" y2="${yy + 1.5}" stroke="#ffffff" stroke-opacity="0.18" stroke-width="0.8"/>`;
      s += `<rect x="${x}" y="${(yy + rh - 2.6).toFixed(2)}" width="${w}" height="2" fill="#000" opacity="0.3"/>`;
    }
    /* cross-stitch (hishinui) on bottom row */
    var by = y + (rows - 1) * rh + rh / 2 - 0.3;
    var cs = '';
    for (var cx = x + pitch; cx < x + w - pitch / 2; cx += pitch * 2) {
      cs += `M${(cx - 1.4).toFixed(1)},${(by - 1.4).toFixed(1)} l2.8,2.8 m0,-2.8 l-2.8,2.8 `;
    }
    s += `<path d="${cs}" stroke="#ffd35c" stroke-width="0.9" fill="none"/>`;
    return s;
  }

  /* sode shoulder guard, drawn in local coords (0,0) top-left */
  function sode(I, w, h) {
    var rows = 4, rh = (h - 6) / rows;
    var engr = '';
    for (var ex = 4.5; ex < w - 3; ex += 3.4) {
      engr += `<path d="M${ex},3.6 q1.1,-2.2 2.2,0" fill="none" stroke="#9a5a12" stroke-width="0.4"/>`;
    }
    return `
      <rect x="-1.5" y="-1.5" width="${w + 3}" height="${h + 3}" rx="3" fill="${OL}"/>
      <rect x="0" y="0" width="${w}" height="5" rx="1.5" fill="url(#${I('gold')})"/>
      <rect x="0" y="3.6" width="${w}" height="1.4" fill="#8a4f12" opacity="0.3"/>
      ${engr}
      <path d="M1.5,0.9 H${w - 1.5}" stroke="#fff" stroke-opacity="0.7" stroke-width="0.6" stroke-linecap="round"/>
      <circle cx="3" cy="2.5" r="0.95" fill="#fff6c4" stroke="#8a4f12" stroke-width="0.3"/><circle cx="${w - 3}" cy="2.5" r="0.95" fill="#fff6c4" stroke="#8a4f12" stroke-width="0.3"/><circle cx="${w / 2}" cy="2.5" r="0.95" fill="#fff6c4" stroke="#8a4f12" stroke-width="0.3"/>
      <rect x="0" y="5" width="${w}" height="2.2" fill="#000" opacity="0.3"/>
      ${plateRows(I, 0, 6, w, rows, rh, 4)}
      <path d="M${w - 2},6 V${h - 2}" stroke="#7a86b0" stroke-width="0.8" stroke-opacity="0.4"/>
      <path d="M2,8 V${h - 5}" stroke="#fff" stroke-width="0.9" stroke-opacity="0.16" stroke-linecap="round"/>
      <rect x="0" y="${h - 1.6}" width="${w}" height="1.6" fill="url(#${I('gold')})"/>
      <path d="M1,${h - 0.9} H${w - 1}" stroke="#a8651a" stroke-width="0.4" stroke-dasharray="1.2 1"/>
      <path d="M${w * 0.35},${h} l-1,5 M${w * 0.65},${h} l1,5" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>
      <path d="M${w * 0.35},${h} l-1,5 M${w * 0.65},${h} l1,5" stroke="#e8483a" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M${w * 0.35 - 0.4},${h + 1} l-0.6,3 M${w * 0.65 + 0.4},${h + 1} l0.6,3" stroke="#ff9a8a" stroke-width="0.4"/>
      <circle cx="${w * 0.35 - 1}" cy="${h + 5.4}" r="1" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="0.5"/><circle cx="${w * 0.65 + 1}" cy="${h + 5.4}" r="1" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="0.5"/>
      ${scratches(['M' + (w * 0.55) + ',12 l4,3.4', 'M' + (w * 0.62) + ',13.4 l2.6,2'], '#fff', 0.5)}`;
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
      <path d="M60,112 L130,112 L130,129 Q96,124 60,129 Z" fill="url(#${I('hammer')})"/>
      <path d="M70,118 Q96,112 122,118" fill="none" stroke="#8b98c8" stroke-width="0.7" stroke-opacity="0.5"/>
      <path d="M60,129 Q96,124 130,129" fill="none" stroke="url(#${I('gold')})" stroke-width="2.2"/>
      <path d="M60,127 Q96,122 130,127" fill="none" stroke="#fff6c4" stroke-width="0.5" stroke-opacity="0.8"/>
      <path d="M62,130.6 Q96,125.6 128,130.6" fill="none" stroke="#7a4a0c" stroke-width="0.5" stroke-dasharray="1.4 1.1" stroke-opacity="0.85"/>
      <!-- AO under the munaita ledge -->
      <path d="M60,130 Q96,125 130,130 L130,134 Q96,129 60,134 Z" fill="#000" opacity="0.28"/>
      <!-- right side shading, reflected light & highlight -->
      <path d="M112,112 Q126,140 118,168 L132,168 L132,112 Z" fill="#000" opacity="0.18"/>
      <path d="M121,124 Q126,142 121,160" fill="none" stroke="#7f8fd0" stroke-width="1.2" stroke-opacity="0.4" stroke-linecap="round"/>
      <path d="M74,124 Q71,142 74,160" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="2" stroke-linecap="round"/>
      <path d="M78,120 Q76,132 78,144" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="0.8" stroke-linecap="round"/>
      <!-- battle wear -->
      ${scratches(['M84,117 l7,2.4', 'M86,119.8 l4,1.2', 'M108,121 l-5,-1.6', 'M80,148 l6,2', 'M88,152 l2.6,-4'], '#fff', 0.42)}
      <path d="M90,152 l1.6,-0.4 l0.4,1.4" fill="none" stroke="#000" stroke-opacity="0.5" stroke-width="0.5"/>
      <path d="M113,140.5 q2,-1 3.2,0.2" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="0.7" stroke-linecap="round"/>
    </g>
    <!-- mon (family crest) -->
    <circle cx="101" cy="137" r="9.3" fill="#000" opacity="0.28"/>
    <circle cx="101" cy="137" r="8.3" fill="${OL}"/>
    <circle cx="101" cy="137" r="7" fill="url(#${I('gold')})"/>
    <circle cx="101" cy="137" r="6.3" fill="none" stroke="#a8651a" stroke-width="0.4" stroke-dasharray="0.9 0.8"/>
    <circle cx="101" cy="137" r="5.6" fill="#b3261e"/>
    <circle cx="101" cy="137" r="5.6" fill="none" stroke="#5e120c" stroke-width="0.6" stroke-opacity="0.6"/>
    ${mitsudomoe(101, 137, 0.95, '#ffd35c')}
    <path d="M96.5,132 A6,6 0 0 1 103,131.4" fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="0.8" stroke-linecap="round"/>
    <!-- gold rivets on munaita -->
    ${rivet(I, 78, 122, 1.4)}${rivet(I, 116, 122, 1.4)}${rivet(I, 88, 120.6, 1)}${rivet(I, 106, 120.6, 1)}
    <!-- agemaki chest cord bows -->
    <path d="M80,130 q-4,-3 -5,1 q3,3 5,-1 q4,-3 5,1 q-3,3 -5,-1 z" fill="#d63a2b" stroke="${OL}" stroke-width="0.9" stroke-linejoin="round"/>
    <path d="M79,131 l-2,6 M81,131 l1.5,6" stroke="${OL}" stroke-width="2.4" stroke-linecap="round"/><path d="M79,131 l-2,6 M81,131 l1.5,6" stroke="#e8483a" stroke-width="1.1" stroke-linecap="round"/>
    <circle cx="80" cy="130.4" r="0.9" fill="#ffd35c" stroke="${OL}" stroke-width="0.4"/>
    <path d="M114,130 q-4,-3 -5,1 q3,3 5,-1 q4,-3 5,1 q-3,3 -5,-1 z" fill="#d63a2b" stroke="${OL}" stroke-width="0.9" stroke-linejoin="round"/>
    <path d="M113,131 l-2,6 M115,131 l1.5,6" stroke="${OL}" stroke-width="2.4" stroke-linecap="round"/><path d="M113,131 l-2,6 M115,131 l1.5,6" stroke="#e8483a" stroke-width="1.1" stroke-linecap="round"/>
    <circle cx="114" cy="130.4" r="0.9" fill="#ffd35c" stroke="${OL}" stroke-width="0.4"/>
    <!-- nodowa throat guard / collar -->
    <path d="M82,116 Q96,124 112,116 L110,112 Q96,118 84,112 Z" fill="#e8483a" stroke="${OL}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M84,113.4 Q96,120 110,113.4" fill="none" stroke="#ff9a8a" stroke-width="0.7" stroke-opacity="0.9"/>
    <path d="M82.6,117 Q96,125 111,117" fill="none" stroke="#8e1f18" stroke-width="0.9" stroke-opacity="0.8"/>
    <path d="M85,114 Q96,119.5 109,114" fill="none" stroke="#ffd35c" stroke-width="0.8" stroke-dasharray="1.5 1.2"/>
    <path d="M88,114.5 l1,1.8 M94,116 l0.3,2 M100,116 l-0.3,2 M106,114.5 l-1,1.8" stroke="#8e1f18" stroke-width="0.5" stroke-opacity="0.8"/>`;
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
        <rect x="${x}" y="164" width="${w}" height="6" fill="url(#${I('aoDown')})"/>
        <rect x="${x}" y="185.4" width="${w}" height="1.6" fill="url(#${I('gold')})"/>
        <path d="M${x + 0.6},186.5 H${x + w - 0.6}" stroke="#a8651a" stroke-width="0.4" stroke-dasharray="1.2 1"/>
        <path d="M${x + 1},185.6 H${x + w - 1}" stroke="#fff" stroke-opacity="0.6" stroke-width="0.4"/>
        <path d="M${x + 3},187 l-0.4,1.8 M${x + w / 2},187 l0.3,2 M${x + w - 3},187 l0.4,1.6" stroke="#e8483a" stroke-width="0.6" stroke-linecap="round"/>
      </g>`;
    }
    /* tally of duels won, scratched into the left panel + a nick */
    s += `<path d="M66,174.5 v5 M68,174.2 v5 M70,174 v5 M72,173.8 v5 M65.6,178.4 L73,175.4" stroke="#fff" stroke-opacity="0.55" stroke-width="0.6" stroke-linecap="round"/>`;
    s += scratches(['M118,172 l5,3', 'M120,180 l3,-2'], '#fff', 0.4);
    return s;
  }

  function obi(I) {
    return `
    <path d="M66,159 Q96,163 126,159 L126,168 Q96,172 66,168 Z" fill="url(#${I('obi')})" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/>
    <g clip-path="url(#${I('obiClip')})">
      <rect x="64" y="156" width="64" height="18" fill="url(#${I('seiga')})"/>
      <rect x="64" y="156" width="64" height="18" fill="url(#${I('weave')})" opacity="0.6"/>
      <path d="M64,156 H128 V162 Q96,165 64,162 Z" fill="#fff" opacity="0.12"/>
      <path d="M64,166 Q96,170 128,166 V172 H64 Z" fill="#000" opacity="0.2"/>
      <path d="M84,159 q2,5 -1,10 M108,161 q-2,4 1,8" fill="none" stroke="#2a0d3d" stroke-width="0.8" stroke-opacity="0.45"/>
      <path d="M85,159.4 q2,5 -1,9.6 M109,161.4 q-2,4 1,7.8" fill="none" stroke="#e3b5f5" stroke-width="0.5" stroke-opacity="0.4"/>
    </g>
    <path d="M67,161.5 Q96,165.5 125,161.5" fill="none" stroke="#e3b5f5" stroke-width="0.8"/>
    <path d="M67,166 Q96,170 125,166" fill="none" stroke="#3a1650" stroke-width="0.8"/>
    <path d="M70,163.6 Q96,167.6 122,163.6" fill="none" stroke="#ffd35c" stroke-width="0.7" stroke-dasharray="2 1.6"/>
    <!-- obi knot -->
    <path d="M70,163 l-7,-5 l-2,9 z M70,164 l-5,9 l7,1 z" fill="url(#${I('obi')})" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M65,160.4 l3.6,2.6 M63.6,163 l4.6,0.6 M66.6,169.4 l2.6,-4 M69,172 l1.4,-5" fill="none" stroke="#2a0d3d" stroke-width="0.6" stroke-opacity="0.7" stroke-linecap="round"/>
    <path d="M64.4,159.8 l-1,4.4 M66.4,172 l3,0.6" fill="none" stroke="#e3b5f5" stroke-width="0.5" stroke-opacity="0.7"/>
    <path d="M66,173 l-0.6,2 M69,174 l0,2.2 M71.5,173.6 l0.8,1.8" stroke="#9b59b6" stroke-width="0.6" stroke-linecap="round"/>
    <ellipse cx="70.5" cy="164" rx="3.2" ry="3.6" fill="#7d3c98" stroke="${OL}" stroke-width="1.6"/>
    <path d="M69,162.4 q1.4,-0.8 2.6,0.2" fill="none" stroke="#e3b5f5" stroke-width="0.6" stroke-linecap="round"/>
    <!-- omamori charm dangling from the obi -->
    <path d="M86,169 Q85,173 86.6,177" fill="none" stroke="${OL}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M86,169 Q85,173 86.6,177" fill="none" stroke="#ffd35c" stroke-width="1" stroke-linecap="round"/>
    <rect x="83.2" y="176" width="6.6" height="8.6" rx="1.4" fill="#e8483a" stroke="${OL}" stroke-width="1.2"/>
    <rect x="83.2" y="176" width="6.6" height="2.4" rx="1" fill="#f4ecd8" stroke="${OL}" stroke-width="0.7"/>
    <path d="M85,181 h3.2 M86.6,179.4 v4.6" stroke="#ffd35c" stroke-width="0.8" stroke-linecap="round"/>
    <path d="M84.2,177.2 v6" stroke="#fff" stroke-opacity="0.5" stroke-width="0.5"/>`;
  }

  /* wakizashi: saya behind, handle forward-right */
  function wakizashiBack(I) {
    var dots = '';
    for (var i = 0; i < 6; i++) {
      dots += `<circle cx="${(26 + i * 4.4).toFixed(1)}" cy="${(i % 2 ? 1 : -1).toFixed(1)}" r="0.55" fill="#ffd35c"/>`;
    }
    return `
    <g transform="translate(110,160) rotate(162)">
      <path d="M0,-3.2 L58,-2.4 Q62,0 58,2.4 L0,3.2 Z" fill="#7a1a14" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M2,-1.6 L56,-1.2" stroke="#ff8a7a" stroke-width="0.8" stroke-opacity="0.8"/>
      <path d="M2,2.2 L56,1.6" stroke="#3a0a06" stroke-width="0.8" stroke-opacity="0.6"/>
      <!-- maki-e gold wave + dots -->
      <path d="M26,0 q2.2,-2 4.4,0 t4.4,0 t4.4,0 t4.4,0 t4.4,0" fill="none" stroke="#ffd35c" stroke-width="0.6" stroke-opacity="0.85"/>
      ${dots}
      <rect x="53" y="-2.8" width="6" height="5.6" rx="1.5" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="1"/>
      <path d="M54.4,-2 v4" stroke="#fff" stroke-opacity="0.7" stroke-width="0.6"/>
      <rect x="20" y="-3.4" width="3" height="6.8" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="0.7"/>
      <path d="M10,-3.1 q-1,3 0,6.3 M12,-3.1 q-1,3 0,6.3 M14,-3 q-1,3 0,6.2" stroke="#3a0a06" stroke-width="0.5" stroke-opacity="0.6" fill="none"/>
    </g>`;
  }
  function wakizashiFront(I) {
    var diamonds = '';
    for (var i = 0; i < 3; i++) {
      var x = 5 + i * 4.4;
      diamonds += `<path d="M${x},0 L${x + 2.2},-1.8 L${x + 4.4},0 L${x + 2.2},1.8 Z" fill="#f4ecd8" stroke="#1a1410" stroke-width="0.4"/>`;
      diamonds += `<path d="M${x + 0.9},0 L${x + 2.2},-0.8 L${x + 3.5},0" fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="0.3"/>`;
    }
    return `
    <g transform="translate(112,162) rotate(-18)">
      <ellipse cx="2" cy="0" rx="1.8" ry="5.2" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="1.3"/>
      <circle cx="2" cy="-3.2" r="0.55" fill="#3a2a10"/><circle cx="2" cy="3.2" r="0.55" fill="#3a2a10"/><circle cx="2" cy="0" r="0.7" fill="#3a2a10"/>
      <path d="M1.2,-4.4 Q0.6,0 1.2,4.4" fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="0.4"/>
      <rect x="3.5" y="-2.8" width="16" height="5.6" rx="1.2" fill="#1d1a24" stroke="${OL}" stroke-width="1.4"/>
      <rect x="3.5" y="-2.8" width="16" height="5.6" rx="1.2" fill="url(#${I('same')})" opacity="0.7"/>
      ${diamonds}
      <rect x="3.5" y="1.4" width="16" height="1.4" fill="#000" opacity="0.3"/>
      <rect x="18.5" y="-3" width="3" height="6" rx="1.2" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="1"/>
      <path d="M19.4,-2.2 v4" stroke="#fff" stroke-opacity="0.7" stroke-width="0.5"/>
      <circle cx="10.6" cy="-2.9" r="0.7" fill="#ffd35c"/>
    </g>`;
  }

  function legs(I) {
    var pleats = '', folds = '';
    var xs = [[76, 178, 70, 214], [83, 178, 80, 216], [104, 180, 108, 218], [111, 180, 117, 218], [118, 180, 125, 214]];
    for (var i = 0; i < xs.length; i++) {
      var p = xs[i];
      pleats += `<path d="M${p[0]},${p[1]} L${p[2]},${p[3]}" stroke="#1a2036" stroke-width="1.3" stroke-linecap="round"/>`;
      pleats += `<path d="M${p[0] + 1.6},${p[1]} L${p[2] + 1.6},${p[3]}" stroke="#6a7aa6" stroke-width="0.8" stroke-opacity="0.7" stroke-linecap="round"/>`;
      /* fold shadow wedge beside each pleat */
      folds += `<path d="M${p[0] + 2.4},${p[1]} L${p[2] + 2},${p[3]} L${p[2] + 7.5},${p[3] - 1} L${p[0] + 5.5},${p[1]} Z" fill="#0a0f24" opacity="0.2"/>`;
    }
    function foot(x, dir) {
      /* tabi + waraji, toes to the right */
      return `
      <g transform="translate(${x},0)">
        <path d="M-1,229 L33,229 Q36,228 35,225.5 L-1,225.5 Q-3,227.5 -1,229 Z" fill="#d9a85c" stroke="${OL}" stroke-width="2"/>
        <path d="M-1,229 L33,229 Q36,228 35,225.5 L-1,225.5 Q-3,227.5 -1,229 Z" fill="url(#${I('straw')})"/>
        <path d="M2,227.4 h3 M8,227.4 h3 M14,227.4 h3 M20,227.4 h3 M26,227.4 h3" stroke="#9c6b2c" stroke-width="0.9"/>
        <path d="M-2,228.4 q-1.5,1.2 -0.4,2 M0,228.8 q-0.6,1.4 0.6,1.8 M32,228.8 q0.6,1.2 -0.4,1.6 M34,228 q1.4,0.6 0.8,1.6" fill="none" stroke="#c99a52" stroke-width="0.6" stroke-linecap="round"/>
        <path d="M1,225.5 L1,217 Q12,214 24,217 Q33,219 33,225.5 Z" fill="#fbf7ee" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M1,225.5 L1,217 Q12,214 24,217 Q33,219 33,225.5 Z" fill="url(#${I('weave')})" opacity="0.55"/>
        <path d="M2,222 H32 L33,225.5 H1 Z" fill="#8a7a5a" opacity="0.12"/>
        <path d="M27,219.5 L27,225" stroke="#b8b0a0" stroke-width="1"/>
        <path d="M4,219 Q12,217 20,219" fill="none" stroke="#d8d0c0" stroke-width="0.9"/>
        <path d="M3,220.6 Q5,222.2 3.4,224 M6,221 q1.4,1.6 0,3" fill="none" stroke="#cfc6b2" stroke-width="0.6" stroke-linecap="round"/>
        <path d="M14,218 v-0.1" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-opacity="0.9"/>
        <path d="M6,216.4 Q12,214.8 18,216.2" fill="none" stroke="#fff" stroke-opacity="0.9" stroke-width="0.7" stroke-linecap="round"/>
        <rect x="1.4" y="216.6" width="3.2" height="5" rx="0.8" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="0.6"/>
        <!-- waraji straps -->
        <path d="M27,225 L22,219 L12,225" fill="none" stroke="#8a5a22" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M27,225 L22,219 L12,225" fill="none" stroke="#e8b86a" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M27,225 L22,219 L12,225" fill="none" stroke="#6a3f14" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="0.8 1.4"/>
        <path d="M5,225 L8,219.5" stroke="#8a5a22" stroke-width="2" stroke-linecap="round"/>
        <path d="M5,225 L8,219.5" stroke="#e8b86a" stroke-width="0.8" stroke-linecap="round"/>
        <circle cx="22" cy="219" r="1.5" fill="#c98a3c" stroke="${OL}" stroke-width="0.6"/>
        <!-- mud splashes -->
        <ellipse cx="9" cy="224" rx="2.4" ry="1.1" fill="#6b4a2c" opacity="0.5"/><circle cx="14" cy="223" r="0.8" fill="#6b4a2c" opacity="0.5"/><ellipse cx="29" cy="224.2" rx="1.6" ry="0.8" fill="#6b4a2c" opacity="0.45"/>
      </g>`;
    }
    return `
    <!-- hakama -->
    <path d="M70,170 L56,214 Q72,221 90,216 L96,190 L101,218 Q120,223 136,214 L122,170 Z" fill="url(#${I('hakama')})" stroke="${OL}" stroke-width="3.2" stroke-linejoin="round"/>
    <g clip-path="url(#${I('hakClip')})">
      <rect x="50" y="166" width="90" height="60" fill="url(#${I('twill')})"/>
      ${folds}
      <rect x="50" y="168" width="90" height="12" fill="url(#${I('aoDown')})"/>
      <path d="M96,190 L92,222 L104,222 L101,218 Z" fill="#05060f" opacity="0.22"/>
      <path d="M57,200 Q64,210 60,216 M128,196 Q132,206 130,214" fill="none" stroke="#0a0f24" stroke-width="1.6" stroke-opacity="0.25"/>
      <path d="M62,196 Q70,200 74,196 M84,200 Q90,204 93,200 M106,200 Q112,204 116,200 M124,192 Q128,196 131,192" fill="none" stroke="#0a0f24" stroke-width="0.7" stroke-opacity="0.4"/>
      <path d="M63,197.6 Q70,201.6 74,197.6 M107,201.6 Q112,205.6 116,201.6" fill="none" stroke="#9fb0e0" stroke-width="0.5" stroke-opacity="0.35"/>
      <path d="M60,207 Q72,214 88,210 M104,211 Q120,216 133,208" fill="none" stroke="#0a0f24" stroke-width="0.6" stroke-opacity="0.3"/>
      <path d="M58,213 Q72,219.5 89,215 M103,217 Q120,221 135,213" fill="none" stroke="#e8d9a8" stroke-width="0.5" stroke-dasharray="1.4 1.2" stroke-opacity="0.55"/>
      <ellipse cx="66" cy="211" rx="3" ry="1.4" fill="#6b4a2c" opacity="0.4"/><circle cx="72" cy="214" r="1" fill="#6b4a2c" opacity="0.4"/><ellipse cx="128" cy="212" rx="3.4" ry="1.4" fill="#6b4a2c" opacity="0.4"/><circle cx="121" cy="216" r="0.9" fill="#6b4a2c" opacity="0.4"/>
    </g>
    <path d="M96,190 L94,178" stroke="${OL}" stroke-width="1.6"/>
    ${pleats}
    <path d="M58,211 Q72,217 89,213" fill="none" stroke="#6a7aa6" stroke-width="1" stroke-opacity="0.6"/>
    <path d="M102,215 Q120,219 134,211" fill="none" stroke="#6a7aa6" stroke-width="1" stroke-opacity="0.6"/>
    <path d="M122,172 L134,212 L128,214 Z" fill="#000" opacity="0.18"/>
    <path d="M57,215 l-1.4,2.6 M62,217 l-0.8,2.4 M68,219 l-0.2,2.4 M77,219.6 l0.4,2.2 M84,218.4 l0.8,2 M107,220 l0.2,2.4 M115,221.4 l0.6,2.2 M125,220 l1,2.2 M132,217 l1.4,2" stroke="#3d4b73" stroke-width="0.7" stroke-linecap="round"/>
    ${foot(60, 1)}
    ${foot(100, 1)}`;
  }

  function kanji(x, y, s, col) {
    /* calligraphic, kanji-like brush strokes (not a real character) */
    return `<g transform="translate(${x},${y}) scale(${s})" fill="none" stroke="${col}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M-4,-4 H4 M0,-6 V6 M-3,1 Q0,4 -4,6 M3,1 Q4,4 5,6"/><path d="M-2,-1 H2" stroke-width="1"/></g>`;
  }

  function cape(I) {
    return `
    <g class="part-cape" style="transform-origin: 58px 62px">
      <path d="M60,58 C46,50 34,66 18,60 L14,72 C30,80 46,66 60,66 Z" fill="url(#${I('cloth')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M60,58 C46,50 34,66 18,60 L14,72 C30,80 46,66 60,66 Z" fill="url(#${I('weave')})" opacity="0.35"/>
      <path d="M58,60 C46,56 36,68 22,64" fill="none" stroke="#ffb3a8" stroke-width="1" stroke-opacity="0.8"/>
      <path d="M58,64.4 C46,66 34,74 20,70" fill="none" stroke="#6a120c" stroke-width="0.9" stroke-opacity="0.55"/>
      <path d="M58,64 C46,63 36,70 22,67.4" fill="none" stroke="#ffd35c" stroke-width="0.5" stroke-dasharray="1.6 1.2" stroke-opacity="0.8"/>
      <path d="M40,58 C38,62 38,66 40,69 M30,62 C28,65 29,69 31,72" fill="none" stroke="#6a120c" stroke-width="0.7" stroke-opacity="0.45"/>
      <path d="M18,60 L14,72" stroke="#ffd35c" stroke-width="2"/>
      <path d="M16,61 l-4,-1 M15,64.5 l-4.5,0 M14.5,68 l-4.5,1 M14,71 l-4,2" stroke="#ffd35c" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M15.6,62 l-3.2,-0.8 M14.6,65.4 l-3.4,0 M14,69 l-3.2,0.8" stroke="#fff6c4" stroke-width="0.4" stroke-linecap="round"/>
      <path d="M60,64 C50,74 44,92 30,98 L38,108 C50,98 56,82 64,70 Z" fill="url(#${I('cloth')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M60,64 C50,74 44,92 30,98 L38,108 C50,98 56,82 64,70 Z" fill="url(#${I('weave')})" opacity="0.35"/>
      <path d="M58,70 C50,82 44,94 34,101" fill="none" stroke="#ffb3a8" stroke-width="1" stroke-opacity="0.8"/>
      <path d="M62,72 C56,84 50,96 40,105" fill="none" stroke="#6a120c" stroke-width="0.9" stroke-opacity="0.55"/>
      <path d="M53,80 C49,86 46,90 42,93 M56,74 C53,79 51,82 48,86" fill="none" stroke="#6a120c" stroke-width="0.7" stroke-opacity="0.4"/>
      <path d="M59,64 C50,76 45,92 32,99" fill="none" stroke="#ffd35c" stroke-width="0.5" stroke-dasharray="1.6 1.2" stroke-opacity="0.8"/>
      <path d="M30,98 L38,108" stroke="#ffd35c" stroke-width="2"/>
      <path d="M31,100 l-3.5,2.5 M33,103 l-3,3 M35.5,105.5 l-2.5,3.5" stroke="#ffd35c" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M31.6,101 l-3,2 M33.6,104 l-2.6,2.6" stroke="#fff6c4" stroke-width="0.4" stroke-linecap="round"/>
      ${mitsudomoe(25, 66, 0.42, '#ffd35c')}
      ${kanji(39, 65.5, 0.5, '#ffd35c')}
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
      var laceHi = r % 2 === 0 ? '#ff9a8a' : '#fff2a8';
      var seams = '', ticks = '', his = '';
      for (var k = 0; k < 13; k++) {
        var lx = 48 - spread - 2 + k * ((100 + spread * 1.6) / 12);
        shik += `<line x1="${lx.toFixed(1)}" y1="${y0 + 2}" x2="${(lx - 0.6).toFixed(1)}" y2="${y0 + 9}" stroke="${lace}" stroke-width="1.8" stroke-linecap="round"/>`;
        his += `M${(lx - 0.5).toFixed(1)},${y0 + 3} l-0.4,4.6 `;
        ticks += `M${(lx - 1).toFixed(1)},${y0 + 4.2} l1.6,0.8 M${(lx - 1).toFixed(1)},${y0 + 6.4} l1.6,0.8 `;
        if (k < 12) {
          var sx = lx + (100 + spread * 1.6) / 24;
          seams += `M${sx.toFixed(1)},${y0 + 1} l-0.6,9 `;
        }
      }
      shik += `<path d="${his}" stroke="${laceHi}" stroke-width="0.35" stroke-opacity="0.8" fill="none"/>`;
      shik += `<path d="${ticks}" stroke="#000" stroke-width="0.3" stroke-opacity="0.35" fill="none"/>`;
      shik += `<path d="${seams}" stroke="#090c18" stroke-width="0.4" stroke-opacity="0.6" fill="none"/>`;
      /* AO where each lame tucks under the one above */
      shik += `<path d="M${50 - spread},${y0 + 0.5} Q97,${y0 - 3.5} ${146 + spread * 0.5},${y0 + 0.5} L${146 + spread * 0.5},${y0 + 4} Q97,${y0} ${50 - spread},${y0 + 4} Z" fill="#05060f" opacity="0.32"/>`;
    }
    /* lowest lame gold trim + rivets */
    shik += `<path d="M28,95.4 Q97,84 154,95.4" fill="none" stroke="url(#${I('gold')})" stroke-width="1.6"/>`;
    for (var q = 0; q < 9; q++) {
      shik += rivet(I, 38 + q * 14, 92.6 - Math.sin(q / 8 * Math.PI) * 5.2 + 3.6 - 3.6 + 0.6, 0.9);
    }
    /* bowl ridges + rivets */
    var ridges = '', ridgeHi = '', rivets = '';
    for (var j = 1; j < 9; j++) {
      var bx = 58 + j * 9.2;
      ridges += `<path d="M98,21 Q${(98 + (bx - 98) * 0.75).toFixed(1)},30 ${bx.toFixed(1)},52" fill="none" stroke="#11152a" stroke-width="1" stroke-opacity="0.7"/>`;
      ridgeHi += `M${(98.8 + (bx - 98) * 0.02).toFixed(1)},22 Q${(99 + (bx - 98) * 0.76).toFixed(1)},31 ${(bx + 0.9).toFixed(1)},52 `;
      rivets += rivetS((98 + (bx - 98) * 0.9).toFixed(1), 44, 1.15);
      rivets += rivetS((98 + (bx - 98) * 0.72).toFixed(1), 34, 0.95);
      rivets += rivetS((98 + (bx - 98) * 0.97).toFixed(1), 50, 0.8);
    }
    /* maedate engraved dots along the crescent centreline */
    var mdots = '';
    for (var m = 1; m < 12; m++) {
      var t = m / 12, u = 1 - t;
      var mx = u * u * 62 + 2 * u * t * 104 + t * t * 146;
      var my = u * u * 5 + 2 * u * t * 56 + t * t * 5;
      mdots += `<circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="${m % 2 ? 0.7 : 0.45}" fill="#8a4f12"/>`;
    }
    return `
    <!-- shikoro neck guard -->
    <g>${shik}</g>
    <!-- hair (sideburn + back) -->
    <path d="M66,58 Q60,78 70,96 L78,92 Q72,76 76,60 Z" fill="#231a22" stroke="${OL}" stroke-width="2"/>
    <path d="M68,64 Q64,78 71,92 M71,62 Q68,76 74,90 M74,63 Q71,74 76,86" fill="none" stroke="#5b4a66" stroke-width="0.6" stroke-opacity="0.8"/>
    <path d="M69,70 Q66,80 70,88" fill="none" stroke="#8a78a0" stroke-width="0.5" stroke-opacity="0.6"/>
    <!-- face -->
    <path d="M72,60 Q70,98 100,106 Q128,106 134,84 Q138,66 128,56 Z" fill="url(#${I('skin')})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
    <g clip-path="url(#${I('faceClip')})">
      <rect x="70" y="54" width="70" height="20" fill="url(#${I('brimAO')})"/>
      <rect x="70" y="60" width="16" height="46" fill="url(#${I('sideAO')})"/>
      <path d="M76,96 Q88,108 104,107 Q124,106 134,90" fill="none" stroke="#d98e6a" stroke-width="3" stroke-opacity="0.3"/>
      <path d="M133,68 Q136,80 131,92" fill="none" stroke="#fff6e6" stroke-width="1.6" stroke-opacity="0.65" stroke-linecap="round"/>
      <ellipse cx="112" cy="91.6" rx="3.4" ry="1.2" fill="#d98e6a" opacity="0.45"/>
      <!-- stubble -->
      <path d="M98,100 v0.1 M101,101.4 v0.1 M104,102 v0.1 M107,102.4 v0.1 M110,102.4 v0.1 M113,102 v0.1 M116,101.4 v0.1 M119,100.4 v0.1 M122,98.8 v0.1 M100,98.4 v0.1 M103,99.4 v0.1 M106,100 v0.1 M112,99.6 v0.1 M115,99 v0.1 M119,97.6 v0.1 M108,105 v0.1 M113,104.4 v0.1 M104,104.6 v0.1 M117,104 v0.1 M121,101.6 v0.1 M125,97.4 v0.1" stroke="#6b4a44" stroke-width="0.8" stroke-opacity="0.2" stroke-linecap="round"/>
    </g>
    <!-- ear -->
    <path d="M77,78 Q70,74 70,82 Q71,89 78,88" fill="url(#${I('skin')})" stroke="${OL}" stroke-width="2"/>
    <path d="M75,80 Q73,82 75,85" fill="none" stroke="#d98e6a" stroke-width="1"/>
    <path d="M74.6,77.4 Q71.4,77.6 71.6,81.4" fill="none" stroke="#e8a884" stroke-width="0.7" stroke-linecap="round"/>
    <path d="M72.4,85 Q73.6,87.6 76.6,87.4" fill="none" stroke="#c9775a" stroke-width="0.8" stroke-linecap="round"/>
    <circle cx="75.6" cy="88.2" r="0.9" fill="#ffd35c" stroke="${OL}" stroke-width="0.4"/>
    <!-- bangs peeking under brim -->
    <path d="M78,56 L84,68 L90,58 L97,66 L103,57 L108,64 L114,57 L120,62 L126,56 Z" fill="#231a22" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M86,60 L88,63 M99,60 L101,62" stroke="#5b4a66" stroke-width="0.8"/>
    <path d="M81,59 L84,65 M87,60 L90,62.5 M93,60 L97,64 M100,59.6 L103,61.6 M106,59 L108,62 M111,59.4 L114,60.6 M117,58.6 L120,60" stroke="#5b4a66" stroke-width="0.5" stroke-opacity="0.9" stroke-linecap="round"/>
    <path d="M80,58.4 Q82,62 84,63.4 M91,59.6 Q94,62.6 96,63.4 M104,58.6 Q106,60.4 107,61.6" fill="none" stroke="#a894c2" stroke-width="0.6" stroke-opacity="0.7" stroke-linecap="round"/>
    <path d="M76,58 L79,66 M124,57 L127,60" stroke="${OL}" stroke-width="1.2" stroke-linecap="round"/>
    <!-- blush -->
    <ellipse cx="94" cy="92" rx="6" ry="3.5" fill="url(#${I('blush')})"/>
    <ellipse cx="126" cy="90" rx="5" ry="3.2" fill="url(#${I('blush')})"/>
    <path d="M91,91 l1.5,-1.5 M94,91 l1.5,-1.5 M124,89.5 l1.2,-1.4 M127,89.5 l1.2,-1.4" stroke="#e9707a" stroke-width="0.7" stroke-linecap="round"/>
    <path d="M91.6,94.2 l0.1,0 M95.4,95 l0.1,0 M124.8,92.8 l0.1,0 M128.4,92.4 l0.1,0" stroke="#fff" stroke-opacity="0.7" stroke-width="0.9" stroke-linecap="round"/>
    <!-- determined brows -->
    <path d="M89,68.5 L103,72.5" stroke="${OL}" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M113,72 L126,67.5" stroke="${OL}" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M89.6,67 l1.2,-1.6 M92,67.7 l1.3,-1.7 M94.6,68.4 l1.2,-1.8 M97.2,69.2 l1.2,-1.6 M99.8,70 l1.1,-1.7 M102.3,70.7 l1,-1.5 M114,70.5 l0.8,-1.6 M116.6,69.8 l1,-1.7 M119.2,69 l1.1,-1.7 M121.8,68.2 l1.2,-1.6 M124.4,67.4 l1.2,-1.5" stroke="${OL}" stroke-width="0.7" stroke-linecap="round"/>
    <path d="M91,68.4 L102,71.6 M114.4,71.2 L125,67.8" stroke="#6b4a44" stroke-width="0.45" stroke-opacity="0.8" stroke-linecap="round"/>
    <!-- eyes -->
    <g${ec}>
      <path d="M90,75 Q97,72 104,76 L104,86 Q97,90 91,86 Z" fill="#fff" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M90.6,75 Q97,72.4 103.6,76 L103.8,79.4 Q97,76.2 91,79 Z" fill="#7a5a70" opacity="0.4"/>
      <ellipse cx="99" cy="81" rx="4.3" ry="5.3" fill="url(#${I('iris')})" stroke="${OL}" stroke-width="0.8"/>
      <path d="M95.4,83.6 Q99,88.6 102.8,83.6 Q99,86.2 95.4,83.6 Z" fill="#f0a850" opacity="0.75"/>
      <ellipse cx="99" cy="81" rx="3.6" ry="4.6" fill="none" stroke="#2b1208" stroke-width="0.5" stroke-opacity="0.7"/>
      <path d="M96,78 l1.2,1.2 M102,78 l-1.2,1.2 M96,84 l1.2,-1.2 M102,84 l-1.2,-1.2" stroke="#e8a048" stroke-width="0.3" stroke-opacity="0.55"/>
      <ellipse cx="99.4" cy="81.5" rx="2" ry="2.6" fill="#1a0c06"/>
      <circle cx="100.8" cy="79" r="1.7" fill="#fff"/><circle cx="97.4" cy="84" r="0.8" fill="#fff"/><circle cx="101.6" cy="83" r="0.4" fill="#fff" opacity="0.8"/>
      <path d="M89,75.5 Q97,71 105,76" fill="none" stroke="${OL}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M90.6,73.4 Q97,69.8 104.6,74" fill="none" stroke="#8a5a48" stroke-width="0.5" stroke-opacity="0.7" stroke-linecap="round"/>
      <path d="M91.6,86.6 Q97,89.6 103,86.4" fill="none" stroke="#b3705a" stroke-width="0.6" stroke-opacity="0.8" stroke-linecap="round"/>
      <path d="M89.2,75.6 l-1.8,-1 M89.6,77.4 l-1.8,0" stroke="${OL}" stroke-width="1" stroke-linecap="round"/>
      <path d="M112,76 Q119,72 126,75 L125,86 Q119,90 113,86 Z" fill="#fff" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M112.6,76 Q119,72.6 125.6,75.2 L125.4,79.2 Q119,76 113,79.4 Z" fill="#7a5a70" opacity="0.4"/>
      <ellipse cx="121" cy="81" rx="4.1" ry="5.3" fill="url(#${I('iris')})" stroke="${OL}" stroke-width="0.8"/>
      <path d="M117.6,83.6 Q121,88.6 124.6,83.6 Q121,86.2 117.6,83.6 Z" fill="#f0a850" opacity="0.75"/>
      <ellipse cx="121" cy="81" rx="3.4" ry="4.6" fill="none" stroke="#2b1208" stroke-width="0.5" stroke-opacity="0.7"/>
      <path d="M118,78 l1.2,1.2 M124,78 l-1.2,1.2 M118,84 l1.2,-1.2 M124,84 l-1.2,-1.2" stroke="#e8a048" stroke-width="0.3" stroke-opacity="0.55"/>
      <ellipse cx="121.4" cy="81.5" rx="1.9" ry="2.6" fill="#1a0c06"/>
      <circle cx="122.8" cy="79" r="1.7" fill="#fff"/><circle cx="119.6" cy="84" r="0.8" fill="#fff"/><circle cx="123.6" cy="83" r="0.4" fill="#fff" opacity="0.8"/>
      <path d="M111,76 Q119,71 127,75" fill="none" stroke="${OL}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M112.6,73.8 Q119,70 126,73.6" fill="none" stroke="#8a5a48" stroke-width="0.5" stroke-opacity="0.7" stroke-linecap="round"/>
      <path d="M113.6,86.4 Q119,89.6 124.6,86.2" fill="none" stroke="#b3705a" stroke-width="0.6" stroke-opacity="0.8" stroke-linecap="round"/>
      <path d="M126,75 l2.5,-1.5" stroke="${OL}" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M126.4,76.6 l2.4,-0.2" stroke="${OL}" stroke-width="1" stroke-linecap="round"/>
    </g>
    <!-- nose + mouth -->
    <path d="M108.6,79 Q107.4,84 109,87.6" fill="none" stroke="#e0a080" stroke-width="0.8" stroke-opacity="0.8" stroke-linecap="round"/>
    <path d="M110,87.5 q1.5,1.5 0,2.5" fill="none" stroke="#c9775a" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M111.6,86.6 l0.1,0.1" stroke="#fff" stroke-width="1" stroke-opacity="0.85" stroke-linecap="round"/>
    <path d="M104,96.5 Q110,94.5 116,96.5" fill="none" stroke="${OL}" stroke-width="2" stroke-linecap="round"/>
    <path d="M116,96.5 l1.5,-1" stroke="${OL}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M105.6,98.6 Q110,100.2 114.6,98.4" fill="none" stroke="#d98e6a" stroke-width="1.3" stroke-opacity="0.8" stroke-linecap="round"/>
    <path d="M107.6,99.2 Q110,99.8 112.4,99.2" fill="none" stroke="#fff" stroke-width="0.5" stroke-opacity="0.7" stroke-linecap="round"/>
    <path d="M105,93.4 Q110,92 115,93.4" fill="none" stroke="#c9775a" stroke-width="0.6" stroke-opacity="0.7" stroke-linecap="round"/>
    <!-- battle scar -->
    <path d="M129,78 l3,6 M129.5,81.5 l2.4,-0.8 M130.5,83.5 l2.2,-0.8" stroke="#c96b5a" stroke-width="0.9" stroke-linecap="round"/>
    <path d="M128.6,76.6 l3.6,7.6" stroke="#fff" stroke-opacity="0.35" stroke-width="0.4" stroke-linecap="round"/>
    <path d="M128.4,80 l-1.6,-0.6 M129.4,83 l-1.8,-0.4" stroke="#c96b5a" stroke-width="0.7" stroke-linecap="round"/>
    <!-- chin cord (shinobi-no-o) -->
    <path d="M77,88 Q84,101 98,104 M134,82 Q130,99 110,104" fill="none" stroke="#b3261e" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M77,88 Q84,101 98,104 M134,82 Q130,99 110,104" fill="none" stroke="#ff7a6a" stroke-width="0.8" stroke-linecap="round" stroke-dasharray="1.6 1.4"/>
    <path d="M77,88 Q84,101 98,104 M134,82 Q130,99 110,104" fill="none" stroke="#5e120c" stroke-width="0.5" stroke-linecap="round" stroke-dasharray="1.4 1.6" stroke-dashoffset="1.5"/>
    <path d="M104,104 q-7,-5 -8,2 q4,3 8,-2 q7,-5 8,2 q-4,3 -8,-2 z" fill="#d63a2b" stroke="${OL}" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M99,103.4 q-2,0.6 -2.4,2.2 M109,103.4 q2,0.6 2.4,2.2" fill="none" stroke="#ff9a8a" stroke-width="0.5"/>
    <path d="M103,105 l-3,6 M105,105 l3,6" stroke="#d63a2b" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M100,110.6 l-0.6,1.4 M101,110.6 l0,1.6 M108,110.6 l0.6,1.4 M107,110.6 l0,1.6" stroke="#d63a2b" stroke-width="0.6" stroke-linecap="round"/>
    <circle cx="104" cy="104.4" r="1.4" fill="#ffd35c" stroke="${OL}" stroke-width="0.6"/>
    <circle cx="103.5" cy="104" r="0.4" fill="#fff"/>
    <!-- topknot poking through tehen -->
    <path d="M96,20 Q92,10 100,7 Q108,6 106,14 Q104,11 101,12 Q99,15 102,20 Z" fill="#231a22" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M96,15 Q100,14 103,16" stroke="#e8483a" stroke-width="1.6" fill="none"/>
    <path d="M96.4,17.6 Q99,16.6 102,18" stroke="#ffd35c" stroke-width="0.8" fill="none"/>
    <path d="M99,9.5 Q102,8.5 104,10" fill="none" stroke="#6e5a78" stroke-width="0.8"/>
    <path d="M95.6,13 Q95,10.4 98,8.6 M98,12 Q97.6,10 99.6,9 M104.6,12 Q105,10 103.4,8.6" fill="none" stroke="#5b4a66" stroke-width="0.4" stroke-opacity="0.9"/>
    <!-- kabuto bowl -->
    <path d="M56,55 Q54,20 98,18 Q142,20 140,55 Z" fill="url(#${I('bowl')})" stroke="${OL}" stroke-width="3.2" stroke-linejoin="round"/>
    <g clip-path="url(#${I('bowlClip')})">
      <rect x="50" y="14" width="96" height="44" fill="url(#${I('hammer')})"/>
      <rect x="50" y="46" width="96" height="10" fill="url(#${I('aoDown')})" opacity="0.5"/>
      <path d="M131,52 Q137,38 127,26" fill="none" stroke="#7a86b0" stroke-width="1.6" stroke-opacity="0.4" stroke-linecap="round"/>
      <path d="M98,21 Q120,24 138,46" fill="none" stroke="#000" stroke-opacity="0.12" stroke-width="5"/>
    </g>
    <path d="M56,55 Q54,20 98,18 Q142,20 140,55 Z" fill="none" stroke="${OL}" stroke-width="3.2" stroke-linejoin="round"/>
    ${ridges}
    <path d="${ridgeHi}" fill="none" stroke="#8b98c8" stroke-width="0.4" stroke-opacity="0.55"/>
    ${rivets}
    <path d="M66,44 Q66,28 84,23" fill="none" stroke="#ffffff" stroke-opacity="0.45" stroke-width="3" stroke-linecap="round"/>
    <path d="M70,48 Q70,40 72,36" fill="none" stroke="#ffffff" stroke-opacity="0.3" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M87,20.6 l3,-0.4" stroke="#fff" stroke-opacity="0.7" stroke-width="1" stroke-linecap="round"/>
    ${scratches(['M114,30 l6,4', 'M117,28.6 l3,2.4', 'M74,30 l-3,5'], '#fff', 0.5)}
    <path d="M120,38 l1.6,-1.2 l0.6,1.8" fill="none" stroke="#05060f" stroke-opacity="0.7" stroke-width="0.6"/>
    <!-- tehen kanamono ring -->
    <ellipse cx="98.5" cy="20" rx="6" ry="2.6" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="1.4"/>
    <ellipse cx="98.5" cy="19.6" rx="3.2" ry="1.2" fill="#3a2a10"/>
    <path d="M93.4,19 Q96,17.6 99,17.8" fill="none" stroke="#fff" stroke-opacity="0.85" stroke-width="0.6" stroke-linecap="round"/>
    <!-- fukigaeshi (side wings) -->
    <path d="M58,50 Q44,48 40,58 Q46,66 60,64 Z" fill="url(#${I('lacquer')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M58,50 Q44,48 40,58 Q46,66 60,64 Z" fill="url(#${I('hammer')})"/>
    <path d="M56,52 Q46,51 43,58" fill="none" stroke="url(#${I('gold')})" stroke-width="1.4"/>
    <path d="M55,55 Q49,55 46,59 M55,59 Q50,60 48,63" fill="none" stroke="#7f8bb5" stroke-width="0.5" stroke-opacity="0.8"/>
    <path d="M57,62 Q48,64 43,60" fill="none" stroke="#05060f" stroke-width="1.4" stroke-opacity="0.35"/>
    <circle cx="50" cy="58" r="3.4" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="0.8"/>
    <circle cx="50" cy="58" r="2.8" fill="none" stroke="#a8651a" stroke-width="0.3"/>
    ${mitsudomoe(50, 58, 0.45, '#b3261e')}
    ${rivet(I, 57, 54, 0.8)}${rivet(I, 57, 62, 0.8)}
    <path d="M136,50 Q150,48 154,58 Q148,66 136,63 Z" fill="url(#${I('lacquer')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M136,50 Q150,48 154,58 Q148,66 136,63 Z" fill="url(#${I('hammer')})"/>
    <path d="M138,52 Q148,51 151,58" fill="none" stroke="url(#${I('gold')})" stroke-width="1.4"/>
    <path d="M139,55 Q145,55 148,59 M139,59 Q144,60 146,63" fill="none" stroke="#7f8bb5" stroke-width="0.5" stroke-opacity="0.8"/>
    <path d="M137,61.6 Q146,64 151,60" fill="none" stroke="#05060f" stroke-width="1.4" stroke-opacity="0.35"/>
    <circle cx="145" cy="57.5" r="3.2" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="0.8"/>
    <circle cx="145" cy="57.5" r="2.6" fill="none" stroke="#a8651a" stroke-width="0.3"/>
    ${mitsudomoe(145, 57.5, 0.42, '#b3261e')}
    ${rivet(I, 139, 54, 0.8)}${rivet(I, 139, 61, 0.8)}
    <!-- mabizashi (visor) -->
    <path d="M60,52 Q100,44 142,50 L146,57 Q100,52 58,59 Z" fill="url(#${I('lacquerH')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M60,52 Q100,44 142,50 L146,57 Q100,52 58,59 Z" fill="url(#${I('hammer')})"/>
    <path d="M59,58.2 Q100,51.2 145.5,56.2" fill="none" stroke="url(#${I('gold')})" stroke-width="1.6"/>
    <path d="M61,59.4 Q100,53 144,57.6" fill="none" stroke="#7a4a0c" stroke-width="0.5" stroke-dasharray="1.4 1.1" stroke-opacity="0.8"/>
    <path d="M66,51.5 Q100,45.5 136,49.5" fill="none" stroke="#9aa6cc" stroke-width="0.8" stroke-opacity="0.8"/>
    ${rivetS(70, 52, 0.9)}${rivetS(84, 49.6, 0.9)}${rivetS(112, 49, 0.9)}${rivetS(128, 50.6, 0.9)}
    <!-- hachimaki knot at back -->
    <path d="M58,58 q-6,-5 -8,2 q4,4 8,0 z M58,62 q-6,5 -3,9 q5,-2 5,-7 z" fill="#d63a2b" stroke="${OL}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M55,57.6 q-2.4,-1 -3.6,1.4 M56,66 q-1.6,1.6 -1.4,3.4 M57,63 q-1.6,1.2 -2,3" fill="none" stroke="#ff9a8a" stroke-width="0.5"/>
    <path d="M55,61 q-2.4,0.6 -3,2" fill="none" stroke="#6a120c" stroke-width="0.6" stroke-opacity="0.7"/>
    <circle cx="59" cy="61" r="2.4" fill="#e8483a" stroke="${OL}" stroke-width="1.2"/>
    <path d="M57.8,60 q1,-0.8 2,0" fill="none" stroke="#ffb3a8" stroke-width="0.5"/>
    <!-- maedate: golden crescent -->
    <path d="M62,5 Q104,66 146,5 Q104,46 62,5 Z" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M70,11 Q104,52 138,11" fill="none" stroke="#fff6c4" stroke-width="1.2" stroke-opacity="0.9" stroke-linecap="round"/>
    <path d="M78,20 Q104,44 130,20" fill="none" stroke="#a8651a" stroke-width="0.7" stroke-opacity="0.8"/>
    <path d="M66,8.6 Q104,60 142,8.6" fill="none" stroke="#a8651a" stroke-width="0.5" stroke-opacity="0.7" stroke-dasharray="2.4 1.2"/>
    <path d="M72,16 Q104,58 136,16 Q104,50 72,16 Z" fill="url(#${I('hammer')})" opacity="0.7"/>
    ${mdots}
    <path d="M86,28 q3,-3 6,-1 q-2,3 -5,2 M122,28 q-3,-3 -6,-1 q2,3 5,2" fill="none" stroke="#8a4f12" stroke-width="0.5"/>
    <path d="M75,15 Q84,30 92,32" fill="none" stroke="#fff" stroke-opacity="0.45" stroke-width="0.6" stroke-linecap="round"/>
    <!-- haraidate holder -->
    <path d="M96,34 L112,34 L110,48 L98,48 Z" fill="url(#${I('goldV')})" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M97.4,36 L110.6,36 M98,46 L110,46" stroke="#a8651a" stroke-width="0.5" stroke-dasharray="1.2 1"/>
    <path d="M97.6,35 L98.8,47" stroke="#fff" stroke-opacity="0.6" stroke-width="0.6"/>
    ${rivet(I, 98.6, 35.8, 0.7)}${rivet(I, 109.4, 35.8, 0.7)}
    <circle cx="104" cy="41" r="4.6" fill="#b3261e" stroke="${OL}" stroke-width="1.4"/>
    <circle cx="104" cy="41" r="3.9" fill="none" stroke="#ffd35c" stroke-width="0.4"/>
    ${mitsudomoe(104, 41, 0.55, '#ffd35c')}
    <circle cx="102.5" cy="39" r="1" fill="#fff" opacity="0.8"/>
    <circle cx="64" cy="7" r="1.2" fill="#fff6c4"/><circle cx="144" cy="7" r="1.2" fill="#fff6c4"/>
    <path d="M64,3.4 v7.2 M60.4,7 h7.2" stroke="#fff" stroke-opacity="0.7" stroke-width="0.4" stroke-linecap="round"/>`;
  }

  function backArm(I) {
    return `
    <!-- back arm (kote) -->
    <path d="M62,130 Q58,146 64,158 L76,156 Q74,144 76,132 Z" fill="#1d2238" stroke="${OL}" stroke-width="2.8" stroke-linejoin="round"/>
    <g clip-path="url(#${I('kbClip')})">
      <rect x="55" y="126" width="26" height="36" fill="url(#${I('mail')})"/>
      <rect x="55" y="126" width="26" height="8" fill="url(#${I('aoDown')})"/>
      <path d="M72,130 Q74,144 72,158" fill="none" stroke="#000" stroke-width="3" stroke-opacity="0.22"/>
      <path d="M62,134 Q60,146 64,156" fill="none" stroke="#fff" stroke-width="0.9" stroke-opacity="0.2"/>
      <path d="M64.5,146.4 l4,-2.8 l4,2.8 l-4,2.8 z M64.5,152.2 l4,-2.8 l4,2.8 l-4,2.8 z" fill="#2c3452" stroke="#f2bf3c" stroke-width="0.6"/>
      <path d="M66,146.4 l2.5,-1.6 M66,152.2 l2.5,-1.6" stroke="#fff" stroke-width="0.4" stroke-opacity="0.5"/>
    </g>
    <path d="M63,140 l11,-1 M63.5,146 l11,-1 M64.5,152 l11,-1" stroke="#5c6890" stroke-width="1" stroke-dasharray="1.2 1.2"/>
    <rect x="63" y="141.5" width="10" height="3" rx="1" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="0.7" transform="rotate(-5 68 143)"/>
    <path d="M64,142 l8.6,-0.8" stroke="#fff" stroke-opacity="0.7" stroke-width="0.5"/>
    ${rivet(I, 64.4, 143, 0.6)}${rivet(I, 72, 142.2, 0.6)}
    <ellipse cx="70" cy="160" rx="6.5" ry="6" fill="url(#${I('skin')})" stroke="${OL}" stroke-width="2.4"/>
    <path d="M65.5,162 Q70,167 75,162" fill="none" stroke="#d98e6a" stroke-width="1.4" stroke-opacity="0.45"/>
    <path d="M66,158 q2,3 6,2 M66.5,161.5 q2,2 5.5,1" fill="none" stroke="#c9775a" stroke-width="0.9"/>
    <path d="M68,156.4 q2,-0.8 4,0" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="0.6" stroke-linecap="round"/>
    <path d="M64,154.4 h11 M64.4,157 h11" stroke="${OL}" stroke-width="2" stroke-linecap="round"/><path d="M64,154.4 h11" stroke="#e8483a" stroke-width="0.8"/>
    <!-- back sode -->
    <g transform="translate(52,118) rotate(8)">${sode(I, 22, 30)}</g>`;
  }

  function weaponArm(I) {
    var ito = '', menuki = '';
    for (var i = 0; i < 5; i++) {
      var x = -21 + i * 4.8;
      ito += `<path d="M${x},0 L${x + 2.4},-2.2 L${x + 4.8},0 L${x + 2.4},2.2 Z" fill="#f4ecd8" stroke="#0e0c14" stroke-width="0.5"/>`;
      ito += `<path d="M${x + 2.4},-3 L${x + 4.8},0 L${x + 2.4},3" fill="none" stroke="#3b3550" stroke-width="0.6"/>`;
      ito += `<path d="M${x + 0.9},0 L${x + 2.4},-1.1 L${x + 3.9},0" fill="none" stroke="#fff" stroke-width="0.3" stroke-opacity="0.9"/>`;
      ito += `<path d="M${x + 1.6},0.7 h1.6" stroke="#b8ad90" stroke-width="0.3"/>`;
    }
    menuki = `<path d="M-17,-1.1 q1.2,-1.4 2.4,0 q-1.2,1.4 -2.4,0 z M-7.4,-1.1 q1.2,-1.4 2.4,0 q-1.2,1.4 -2.4,0 z" fill="url(#${I('gold')})" stroke="#5a3608" stroke-width="0.3"/>`;
    /* nie sparkles along the hamon */
    var nie = '';
    for (var n = 0; n < 12; n++) {
      nie += `<circle cx="${(22 + n * 6.4).toFixed(1)}" cy="${(1.4 - n * 0.28 + (n % 2) * 0.5).toFixed(2)}" r="0.28" fill="#fff"/>`;
    }
    return `
    <g class="part-weapon" style="transform-origin: 122px 126px">
      <!-- katana -->
      <g transform="translate(146,148) rotate(-64)">
        <!-- blade -->
        <path d="M14,-2.8 Q58,-3.4 98,-8.6 L106,-10.2 Q103,-4.4 96,-2.2 Q56,3.4 14,2.8 Z" fill="url(#${I('steel')})" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>
        <g clip-path="url(#${I('bladeClip')})">
          <path d="M14,-0.6 Q56,-1.4 98,-6.2 L108,-8 L108,-12 L14,-6 Z" fill="#7d8ea6" opacity="0.28"/>
          <path d="M14,2.4 Q56,2.6 96,-1.4 L96,4 L14,4 Z" fill="#fff" opacity="0.35"/>
          <path d="M30,-4 L36,3 M52,-4 L58,3 M74,-6 L80,1" stroke="#fff" stroke-width="2.4" stroke-opacity="0.22"/>
        </g>
        <!-- hamon -->
        <path d="M15,1.2 q3,-1.6 6,0 q3,1.6 6,0 q3,-1.6 6,0 q3,1.6 6,-0.2 q3,-1.8 6,-0.3 q3,1.4 6,-0.6 q3,-1.9 6,-0.6 q3,1.2 6,-1 q3,-2 6,-1 q3,1 6,-1.4 q3,-2 6,-1.4 q3,0.8 6,-1.8 q3,-2.2 5,-2" fill="none" stroke="#ffffff" stroke-width="1.1" stroke-linecap="round"/>
        <path d="M15,1.9 q3,-1.6 6,0 q3,1.6 6,0 q3,-1.6 6,0 q3,1.6 6,-0.2 q3,-1.8 6,-0.3 q3,1.4 6,-0.6 q3,-1.9 6,-0.6 q3,1.2 6,-1 q3,-2 6,-1 q3,1 6,-1.4 q3,-2 6,-1.4 q3,0.8 6,-1.8" fill="none" stroke="#9fb0c4" stroke-width="0.5"/>
        ${nie}
        <!-- shinogi ridge + shine -->
        <path d="M14,-1.2 Q56,-2 96,-6.6 L103,-8.8" fill="none" stroke="#7a8aa0" stroke-width="0.6"/>
        <path d="M26,-0.2 Q56,-1 88,-4.6" fill="none" stroke="#7a8aa0" stroke-width="0.5" stroke-opacity="0.8"/>
        <path d="M20,-2 Q56,-2.8 90,-6.8" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M60,-3.2 l6,-0.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
        <path d="M97,-2.6 L100,-5.6" stroke="#7a8aa0" stroke-width="0.5"/>
        <path d="M44,2.8 l1,-1.4 l1.2,1.5 M63,2.4 l0.8,-1.2 l1,1.3" fill="#2b1d14" stroke="none"/>
        <path d="M40,2.9 H50 M60,2.6 H68" stroke="#fff" stroke-opacity="0.5" stroke-width="0.4"/>
        <path d="M83,-9 l1.5,-4 l1.5,4 l4,1.5 l-4,1.5 l-1.5,4 l-1.5,-4 l-4,-1.5 z" fill="#ffffff" opacity="0.95"/>
        <path d="M30,-2.4 l0.6,-1.8 l0.6,1.8 l1.8,0.6 l-1.8,0.6 l-0.6,1.8 l-0.6,-1.8 l-1.8,-0.6 z" fill="#fff" opacity="0.9"/>
        <!-- habaki -->
        <path d="M10,-3.4 L15,-3.2 L15,3.2 L10,3.4 Z" fill="url(#${I('goldV')})" stroke="${OL}" stroke-width="1.2"/>
        <path d="M11.5,-2.6 l2,5" stroke="#fff6c4" stroke-width="0.6"/>
        <path d="M10.6,-1 h4 M10.6,1 h4" stroke="#a8651a" stroke-width="0.35"/>
        <!-- tsuba (openwork) -->
        <ellipse cx="8" cy="0" rx="2.8" ry="8" fill="${OL}"/>
        <ellipse cx="8" cy="0" rx="1.8" ry="7" fill="url(#${I('gold')})"/>
        <ellipse cx="8" cy="-4.4" rx="0.7" ry="1.3" fill="#2b1d14"/><ellipse cx="8" cy="4.4" rx="0.7" ry="1.3" fill="#2b1d14"/>
        <circle cx="8" cy="-1.6" r="0.5" fill="#8a4f12"/><circle cx="8" cy="1.6" r="0.5" fill="#8a4f12"/>
        <path d="M6.7,-6.2 Q7.6,-3.4 6.7,-1 M6.7,6.2 Q7.6,3.4 6.7,1" fill="none" stroke="#fff6c4" stroke-width="0.5"/>
        <path d="M9.2,-6 Q9.6,0 9.2,6" fill="none" stroke="#8a4f12" stroke-width="0.4" stroke-dasharray="0.8 0.7"/>
        <!-- tsuka (handle) -->
        <rect x="-23" y="-3.4" width="30" height="6.8" rx="2" fill="#15121c" stroke="${OL}" stroke-width="1.8"/>
        <rect x="-23" y="-3.4" width="30" height="6.8" rx="2" fill="url(#${I('same')})" opacity="0.9"/>
        ${ito}
        ${menuki}
        <rect x="-23" y="1.4" width="30" height="2" rx="1" fill="#000" opacity="0.28"/>
        <path d="M-21,-2.7 H5" stroke="#fff" stroke-opacity="0.3" stroke-width="0.5"/>
        <rect x="3.5" y="-3.6" width="3" height="7.2" rx="0.8" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="0.8"/>
        <path d="M4.4,-2.8 v5.6" stroke="#fff" stroke-opacity="0.7" stroke-width="0.5"/>
        <path d="M-25.5,-3 Q-27,0 -25.5,3 L-22,3.6 L-22,-3.6 Z" fill="url(#${I('gold')})" stroke="${OL}" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M-24.4,-2.2 Q-25.4,0 -24.4,2.2" fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="0.5"/>
        <circle cx="-24" cy="0" r="0.6" fill="#8a4f12"/>
        <path d="M-10,-3.6 q2,-1.8 4,0" fill="#f6c945" stroke="${OL}" stroke-width="0.6"/>
        <!-- sageo cord tassel -->
        <path d="M-25,2 Q-30,10 -26,16" fill="none" stroke="#d63a2b" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M-25,2 Q-30,10 -26,16" fill="none" stroke="#5e120c" stroke-width="0.5" stroke-dasharray="0.9 0.9"/>
        <path d="M-26.4,15.4 l-1.6,2.6 M-26,16 l-0.4,3 M-25.4,15.8 l1,2.6" stroke="#d63a2b" stroke-width="0.7" stroke-linecap="round"/>
        <circle cx="-27.8" cy="7.6" r="1.1" fill="#ffd35c" stroke="${OL}" stroke-width="0.5"/>
      </g>
      <!-- sword arm -->
      <path d="M118,128 Q126,128 134,136 L148,142 L144,154 L128,150 Q116,144 114,134 Z" fill="#1d2238" stroke="${OL}" stroke-width="2.8" stroke-linejoin="round"/>
      <g clip-path="url(#${I('kfClip')})">
        <rect x="110" y="124" width="42" height="34" fill="url(#${I('mail')})"/>
        <path d="M118,128 Q126,128 134,136 L138,138 L120,144 Z" fill="#05060f" opacity="0.28"/>
        <path d="M116,146 Q126,154 144,154 L144,158 L114,158 Z" fill="#05060f" opacity="0.25"/>
        <path d="M116,134 Q120,144 128,149" fill="none" stroke="#fff" stroke-width="0.9" stroke-opacity="0.2"/>
      </g>
      <path d="M122,138 l6,4 M126,134 l6,4 M131,139 l6,4" stroke="#5c6890" stroke-width="1" stroke-dasharray="1.2 1.2"/>
      <path d="M134,138 L145,142.5 L142.5,150 L131,146 Z" fill="url(#${I('lacquer')})" stroke="${OL}" stroke-width="1.2"/>
      <path d="M134,138 L145,142.5 L142.5,150 L131,146 Z" fill="url(#${I('hammer')})"/>
      <path d="M136,140.5 l6,2.5 M134.5,143.5 l6,2.5" stroke="url(#${I('gold')})" stroke-width="0.9"/>
      ${rivet(I, 135.4, 139.4, 0.7)}${rivet(I, 143.6, 143.2, 0.7)}${rivet(I, 132.4, 145, 0.7)}
      <path d="M135.4,138.6 L144,142.2" stroke="#fff" stroke-opacity="0.45" stroke-width="0.5"/>
      <!-- fist around the tsuka -->
      <path d="M140,141 Q148,137 153,142 Q156,149 150,154 Q143,156 140,151 Z" fill="url(#${I('skin')})" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M142,152.6 Q148,155 152,150" fill="none" stroke="#d98e6a" stroke-width="1.6" stroke-opacity="0.5"/>
      <path d="M146,140.5 q3,2 2.5,5 M149.5,142.5 q3,2 2,5 M142.5,143.5 q3,2 2,5" fill="none" stroke="#c9775a" stroke-width="1"/>
      <path d="M141,146.4 Q145,145 149.4,148.4" fill="none" stroke="#c9775a" stroke-width="0.8" stroke-linecap="round"/>
      <path d="M143.6,140.6 Q147,139 150,140.6" fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="0.7" stroke-linecap="round"/>
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
    <circle cx="60" cy="52" r="34" fill="none" stroke="#fff" stroke-opacity="0.18" stroke-width="1"/>
    <path d="M60,52 L-10,0 L14,-10 Z M60,52 L40,-14 L70,-14 Z M60,52 L100,-14 L130,-4 Z M60,52 L130,30 L130,56 Z" fill="#fff" opacity="0.07"/>
    <path d="M0,104 L30,90 L60,104 L90,90 L120,104 L120,120 L0,120 Z" fill="#8e1f18" opacity="0.35"/>
    <rect x="0" y="92" width="120" height="28" fill="url(#${I('seiga')})" opacity="0.7"/>
    <path d="M12,24 q3,-3 5,0 q-2,3 -5,0 z M104,40 q3,-3 5,0 q-2,3 -5,0 z M20,60 q3,-3 5,0 q-2,3 -5,0 z M100,14 q3,-3 5,0 q-2,3 -5,0 z" fill="#ffd1d6" opacity="0.8"/>
    <path d="M14,24 l1.4,0.4 M106,40 l1.4,0.4" stroke="#e8708a" stroke-width="0.4"/>
    <circle cx="10" cy="40" r="1" fill="#fff" opacity="0.6"/><circle cx="110" cy="70" r="1.2" fill="#fff" opacity="0.5"/><circle cx="16" cy="80" r="0.8" fill="#fff" opacity="0.6"/>
    <g transform="translate(-6,-1) scale(0.72)">
      <g transform="translate(52,118) rotate(8)">${sode(I, 22, 30)}</g>
      ${torso(I)}
      <g transform="translate(112,117) rotate(-10)">${sode(I, 23, 31)}</g>
      ${head(I, false)}
    </g>
    <rect x="1" y="1" width="118" height="118" rx="13" fill="none" stroke="#fff" stroke-opacity="0.25" stroke-width="1.2"/>
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

/* Hero Go! — Khulan, The Steppe Archer (key: mongol)
 * Hand-authored inline SVG. Chibi, facing right. See ART_CONTRACT.md.
 * Inspired by Mongolian dress and archery: the loovuuz fur-trimmed pointed hat
 * with its red silk top knot (jinst / zalaa), a deel robe closing diagonally
 * under the right arm with knotted (sampin) buttons, a wide silk sash (büs),
 * a lamellar leather khuyag, gutal boots with upturned toes, an open quiver
 * (sagadag) and a bow case (numuu), and a horn-and-sinew composite bow.
 */
(function () {
  'use strict';

  var O = '#2b1d14';
  var SKIN = '#ffdcbf', SKIN_SH = '#f0b98f', SKIN_DK = '#c98460';
  var HAIR = '#1d1718', HAIR_HI = '#4d4a60';
  var DEEL = '#8e3b46', DEEL_SH = '#62222d', DEEL_HI = '#c0606d';
  var TEAL = '#1f8a98', TEAL_DK = '#135a66', GOLD = '#f4c24e', GOLD_DK = '#b07c1c';
  var LEATHER = '#9a6234', LEATHER_DK = '#5e3a1e', LEATHER_HI = '#c98e56';
  var LACE = '#3aa6d0', CORAL = '#e5533d', TURQ = '#3fc6c0', SILVER = '#dfe6ee';

  function f(n) { return +(+n).toFixed(2); }
  function rnd(i) { var x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }
  function ids(uid) {
    var u = uid == null ? '' : String(uid);
    return function (n) { return 'mongol-' + n + '-' + u; };
  }
  function qpt(p0, p1, p2, t) {
    var a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
    return [a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]];
  }
  function qtan(p0, p1, p2, t) {
    var dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    var dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    return Math.atan2(dy, dx) * 57.2958;
  }

  /* ---------- defs ---------- */
  function defs(I) {
    return `
  <defs>
    <linearGradient id="${I('deel')}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${DEEL_SH}"/><stop offset="0.45" stop-color="${DEEL}"/><stop offset="0.8" stop-color="${DEEL_HI}"/><stop offset="1" stop-color="${DEEL}"/>
    </linearGradient>
    <linearGradient id="${I('deelV')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${DEEL_HI}"/><stop offset="0.5" stop-color="${DEEL}"/><stop offset="1" stop-color="${DEEL_SH}"/>
    </linearGradient>
    <linearGradient id="${I('teal')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3fb3c0"/><stop offset="0.6" stop-color="${TEAL}"/><stop offset="1" stop-color="${TEAL_DK}"/>
    </linearGradient>
    <linearGradient id="${I('gold')}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff2b0"/><stop offset="0.4" stop-color="${GOLD}"/><stop offset="1" stop-color="${GOLD_DK}"/>
    </linearGradient>
    <linearGradient id="${I('sash')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffd878"/><stop offset="0.45" stop-color="#f5a623"/><stop offset="1" stop-color="#c46d12"/>
    </linearGradient>
    <linearGradient id="${I('leather')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${LEATHER_HI}"/><stop offset="0.55" stop-color="${LEATHER}"/><stop offset="1" stop-color="${LEATHER_DK}"/>
    </linearGradient>
    <linearGradient id="${I('boot')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a0432c"/><stop offset="0.6" stop-color="#7a2e1f"/><stop offset="1" stop-color="#521b12"/>
    </linearGradient>
    <linearGradient id="${I('crown')}" x1="0" y1="0" x2="1" y2="0.3">
      <stop offset="0" stop-color="#1c3264"/><stop offset="0.5" stop-color="#2d5096"/><stop offset="0.8" stop-color="#4a74c0"/><stop offset="1" stop-color="#2d5096"/>
    </linearGradient>
    <linearGradient id="${I('fur')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f3cf95"/><stop offset="0.5" stop-color="#d99a55"/><stop offset="1" stop-color="#a86a33"/>
    </linearGradient>
    <linearGradient id="${I('red')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ff6a5a"/><stop offset="0.5" stop-color="#d9302c"/><stop offset="1" stop-color="#8f1717"/>
    </linearGradient>
    <linearGradient id="${I('hair')}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3a3444"/><stop offset="0.5" stop-color="${HAIR}"/><stop offset="1" stop-color="#0d0a0b"/>
    </linearGradient>
    <linearGradient id="${I('steel')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="0.45" stop-color="#cbd6e0"/><stop offset="1" stop-color="#7d8b99"/>
    </linearGradient>
    <radialGradient id="${I('skin')}" cx="0.62" cy="0.4" r="0.72">
      <stop offset="0" stop-color="#fff0e2"/><stop offset="0.65" stop-color="${SKIN}"/><stop offset="1" stop-color="${SKIN_SH}"/>
    </radialGradient>
    <radialGradient id="${I('blush')}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ff6f7d" stop-opacity="0.85"/><stop offset="1" stop-color="#ff6f7d" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${I('iris')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#180c07"/><stop offset="0.55" stop-color="#4c2413"/><stop offset="1" stop-color="#a2602a"/>
    </linearGradient>
    <clipPath id="${I('skirtClip')}"><path d="${SKIRT}"/></clipPath>
    <clipPath id="${I('vestClip')}"><path d="${VEST}"/></clipPath>
    <clipPath id="${I('torsoClip')}"><path d="${TORSO}"/></clipPath>
    <clipPath id="${I('crownClip')}"><path d="${CROWN}"/></clipPath>
  </defs>`;
  }

  var TORSO = 'M74,114 Q98,106 122,114 Q130,136 126,164 L70,164 Q66,136 74,114 Z';
  var VEST = 'M71,130 Q98,124 125,130 Q129,148 127,163 L69,163 Q67,148 71,130 Z';
  var SKIRT = 'M72,164 Q66,182 61,200 Q98,209 135,199 Q129,182 124,164 Z';
  var CROWN = 'M63,58 Q64,32 94,16 Q102,11 108,14 Q132,28 142,54 Q100,40 63,58 Z';

  /* ---------- motifs ---------- */

  // ulzii (endless knot) medallion
  function ulzii(cx, cy, s, col, bg) {
    var g = '<g transform="translate(' + cx + ',' + cy + ') scale(' + s + ')">';
    if (bg) g += '<circle r="6.2" fill="' + bg + '" stroke="' + O + '" stroke-width="1.2"/>';
    g += '<g transform="rotate(45)" fill="none" stroke="' + col + '" stroke-width="1" stroke-linecap="round">' +
      '<rect x="-2.8" y="-2.8" width="5.6" height="5.6"/>' +
      '<path d="M-2.8,-0.9 H2.8 M-2.8,0.9 H2.8 M-0.9,-2.8 V2.8 M0.9,-2.8 V2.8"/>' +
      '<path d="M-2.8,-2.8 a1.4,1.4 0 1 1 0,0.01 M2.8,-2.8 a1.4,1.4 0 1 1 0,0.01 M2.8,2.8 a1.4,1.4 0 1 1 0,0.01 M-2.8,2.8 a1.4,1.4 0 1 1 0,0.01"/>' +
      '<circle cx="-3.8" cy="-3.8" r="1.2"/><circle cx="3.8" cy="-3.8" r="1.2"/><circle cx="3.8" cy="3.8" r="1.2"/><circle cx="-3.8" cy="3.8" r="1.2"/>' +
      '</g></g>';
    return g;
  }

  // row of cloud curls (üülen khee) along a straight band, local x from 0..w at y
  function clouds(x0, y, w, sz, col) {
    var d = '';
    for (var x = x0; x < x0 + w - sz * 1.6; x += sz * 2.2) {
      d += 'M' + f(x) + ',' + f(y + sz * 0.5) + ' q0,' + f(-sz) + ' ' + f(sz * 0.8) + ',' + f(-sz) +
        ' q' + f(sz * 0.8) + ',0 ' + f(sz * 0.8) + ',' + f(sz * 0.7) + ' q0,' + f(sz * 0.5) + ' ' + f(-sz * 0.5) + ',' + f(sz * 0.5) +
        ' q' + f(-sz * 0.35) + ',0 ' + f(-sz * 0.35) + ',' + f(-sz * 0.35);
      d += ' M' + f(x + sz * 1.6) + ',' + f(y + sz * 0.5) + ' q' + f(sz * 0.3) + ',' + f(-sz * 0.2) + ' ' + f(sz * 0.6) + ',0';
    }
    return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + f(sz * 0.32) + '" stroke-linecap="round"/>';
  }

  // alkhan khee (key meander) along a band
  function meander(x0, y, w, h, col) {
    var d = '', s = h;
    for (var x = x0; x < x0 + w - s * 1.5; x += s * 1.6) {
      d += 'M' + f(x) + ',' + f(y + s / 2) + ' v' + f(-s) + ' h' + f(s) + ' v' + f(s * 0.7) + ' h' + f(-s * 0.5) + ' v' + f(-s * 0.35) + ' M' + f(x) + ',' + f(y + s / 2) + ' h' + f(s * 1.6);
    }
    return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="0.7" stroke-linejoin="round"/>';
  }

  // knotted cloth button (sampin)
  function knotBtn(x, y, r) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + (r + 0.9) + '" fill="' + O + '"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="url(#GOLD)"/>' +
      '<path d="M' + f(x - r * 0.6) + ',' + f(y - r * 0.2) + ' q' + f(r * 0.6) + ',' + f(r * 0.8) + ' ' + f(r * 1.2) + ',0 M' + f(x - r * 0.3) + ',' + f(y + r * 0.5) + ' q' + f(r * 0.3) + ',' + f(-r * 0.9) + ' ' + f(r * 0.7) + ',' + f(-r * 0.9) + '" fill="none" stroke="' + GOLD_DK + '" stroke-width="0.6"/>' +
      '<circle cx="' + f(x - r * 0.35) + '" cy="' + f(y - r * 0.4) + '" r="' + f(r * 0.3) + '" fill="#fff" opacity=".8"/>';
  }

  // plaited braid along a quadratic curve
  function braid(p0, p1, p2, w, n, tieCol, tieCol2) {
    var s = '', outl = '', segs = '', hl = '', i, t, p, a;
    for (i = 0; i < n; i++) {
      t = (i + 0.5) / n;
      p = qpt(p0, p1, p2, t); a = qtan(p0, p1, p2, t);
      var off = (i % 2 ? 1 : -1) * w * 0.18, ww = w * (1 - t * 0.35);
      var cx = p[0] + Math.cos((a + 90) / 57.2958) * off, cy = p[1] + Math.sin((a + 90) / 57.2958) * off;
      var L = 70 / n;
      outl += '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(L * 0.72 + 1.3) + '" ry="' + f(ww / 2 + 1.3) + '" transform="rotate(' + f(a + (i % 2 ? 22 : -22)) + ' ' + f(cx) + ' ' + f(cy) + ')" fill="' + O + '"/>';
      segs += '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(L * 0.72) + '" ry="' + f(ww / 2) + '" transform="rotate(' + f(a + (i % 2 ? 22 : -22)) + ' ' + f(cx) + ' ' + f(cy) + ')" fill="url(#HAIRG)" stroke="' + O + '" stroke-width="0.8"/>';
      hl += '<ellipse cx="' + f(cx - 0.6) + '" cy="' + f(cy - 0.8) + '" rx="' + f(L * 0.35) + '" ry="' + f(ww / 7) + '" transform="rotate(' + f(a + (i % 2 ? 22 : -22)) + ' ' + f(cx) + ' ' + f(cy) + ')" fill="' + HAIR_HI + '" opacity=".85"/>';
    }
    s += outl + segs + hl;
    // cloth tie wrapped near the end, beads, and a soft tuft
    var e = qpt(p0, p1, p2, 0.93), ae = qtan(p0, p1, p2, 0.93);
    s += '<g transform="translate(' + f(p2[0]) + ',' + f(p2[1]) + ') rotate(' + f(ae - 90) + ')">' +
      '<path d="M-3,0 Q-5.4,5 -4.8,9.4 Q-2.4,8 0,10.4 Q2.4,8 4.8,9.4 Q5.4,5 3,0 Z" fill="url(#HAIRG)" stroke="' + O + '" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<path d="M-1.2,1 L-2.6,8 M0.2,1 L0,8.6 M1.4,1 L2.6,8" stroke="' + HAIR_HI + '" stroke-width="0.6"/></g>';
    s += '<g transform="translate(' + f(e[0]) + ',' + f(e[1]) + ') rotate(' + f(ae - 90) + ')">' +
      '<rect x="-4.4" y="-3.2" width="8.8" height="5.4" rx="1.6" fill="' + tieCol + '" stroke="' + O + '" stroke-width="1.4"/>' +
      '<path d="M-4,-1 L4,-0.4 M-4,0.9 L4,1.5" stroke="#fff" stroke-width="0.6" opacity=".6"/>' +
      '<path d="M3.8,-1 q5,1 6,6 q-3,-1 -5,-3 M3.8,0.6 q3,3 2,8" fill="' + tieCol + '" stroke="' + O + '" stroke-width="1.1" stroke-linejoin="round"/>' +
      '<circle cx="0" cy="-5.4" r="2" fill="' + tieCol2 + '" stroke="' + O + '" stroke-width="1"/><circle cx="-0.6" cy="-6" r="0.6" fill="#fff" opacity=".8"/>' +
      '</g>';
    // second tie with coral + turquoise beads higher up
    var m = qpt(p0, p1, p2, 0.55), am = qtan(p0, p1, p2, 0.55);
    s += '<g transform="translate(' + f(m[0]) + ',' + f(m[1]) + ') rotate(' + f(am - 90) + ')">' +
      '<rect x="-4.8" y="-1.8" width="9.6" height="3.6" rx="1.4" fill="' + tieCol2 + '" stroke="' + O + '" stroke-width="1.2"/>' +
      '<circle cx="-2.4" cy="0" r="1.3" fill="' + CORAL + '" stroke="' + O + '" stroke-width="0.6"/>' +
      '<circle cx="0.4" cy="0" r="1.3" fill="' + SILVER + '" stroke="' + O + '" stroke-width="0.6"/>' +
      '<circle cx="3.1" cy="0" r="1.3" fill="' + TURQ + '" stroke="' + O + '" stroke-width="0.6"/>' +
      '</g>';
    return s;
  }

  /* ---------- body pieces ---------- */

  function backBraid() {
    return braid([66, 96], [52, 118], [54, 150], 8.5, 7, TEAL, CORAL);
  }
  function frontBraid() {
    return braid([79, 96], [72, 124], [84, 152], 9, 7, CORAL, TURQ);
  }

  // open quiver (sagadag) at the back hip with fletched arrows
  function quiver(I) {
    var arrows = '';
    var ax = [-5.5, -1.8, 2, 5.6], fcol = [['#f7f3ea', '#3b2b22'], ['#d9302c', '#fff'], ['#e9e2d0', '#6a5140'], ['#3a3a44', '#f7f3ea']];
    for (var i = 0; i < 4; i++) {
      var x = ax[i], top = -46 + (i % 2) * 3, rot = -8 + i * 5;
      arrows += '<g transform="translate(' + x + ',-24) rotate(' + rot + ')">' +
        '<path d="M0,0 L0,' + (top + 24) + '" stroke="' + O + '" stroke-width="3"/>' +
        '<path d="M0,0 L0,' + (top + 24) + '" stroke="#d9b273" stroke-width="1.5"/>' +
        '<path d="M0,' + (top + 26) + ' L-4,' + (top + 22) + ' L-4.2,' + (top + 36) + ' L0,' + (top + 40) + ' Z" fill="' + fcol[i][0] + '" stroke="' + O + '" stroke-width="1.2" stroke-linejoin="round"/>' +
        '<path d="M0,' + (top + 26) + ' L4,' + (top + 22) + ' L4.2,' + (top + 36) + ' L0,' + (top + 40) + ' Z" fill="' + fcol[i][0] + '" stroke="' + O + '" stroke-width="1.2" stroke-linejoin="round"/>' +
        '<path d="M-4,' + (top + 28) + ' L-1,' + (top + 30) + ' M-4,' + (top + 32) + ' L-1,' + (top + 34) + ' M4,' + (top + 28) + ' L1,' + (top + 30) + ' M4,' + (top + 32) + ' L1,' + (top + 34) + '" stroke="' + fcol[i][1] + '" stroke-width="1" opacity=".8"/>' +
        '<rect x="-1.4" y="' + (top + 22) + '" width="2.8" height="3" rx="0.8" fill="' + (i % 2 ? GOLD : CORAL) + '" stroke="' + O + '" stroke-width="0.8"/>' +
        '</g>';
    }
    return `
    <g transform="translate(58,170) rotate(-22)">
      ${arrows}
      <path d="M-10,-26 Q0,-30 10,-26 L9,24 Q0,32 -9,24 Z" fill="url(#${I('leather')})" stroke="${O}" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M-10,-26 Q0,-22 10,-26 L10,-20 Q0,-16 -10,-20 Z" fill="url(#${I('red')})" stroke="${O}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M-9,-18 Q0,-14 9,-18" fill="none" stroke="${GOLD}" stroke-width="0.8" stroke-dasharray="1.4 1"/>
      <path d="M-7,-12 L-6.6,20 M7,-12 L6.6,20" fill="none" stroke="#f0d3a0" stroke-width="0.8" stroke-dasharray="1.6 1.2"/>
      ${ulzii(0, 0, 0.95, GOLD, '#6d3a1a')}
      <rect x="-9.4" y="12" width="18.8" height="3.2" fill="url(#${I('gold')})" stroke="${O}" stroke-width="1"/>
      <circle cx="-5" cy="13.6" r="0.8" fill="#fff5c0"/><circle cx="0" cy="13.6" r="0.8" fill="#fff5c0"/><circle cx="5" cy="13.6" r="0.8" fill="#fff5c0"/>
      <path d="M-8,-10 Q-9,4 -7,20" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2" stroke-linecap="round"/>
      <path d="M6,-14 Q9,4 6,22 L9,22 L9.5,-14 Z" fill="#000" opacity=".2"/>
    </g>`;
  }

  // bow case (numuu) at the front hip
  function bowCase(I) {
    var studs = '';
    for (var k = 0; k < 6; k++) {
      var t = k / 5, x = -6 + t * 13 + Math.sin(t * 3) * 1.5, y = -19 + t * 38;
      studs += '<circle cx="' + f(x - 1.8) + '" cy="' + f(y) + '" r="0.75" fill="' + SILVER + '" stroke="' + O + '" stroke-width="0.4"/>';
    }
    return `
    <g transform="translate(126,184) rotate(-16)">
      <path d="M-8,-24 Q7,-27 9,-12 Q11,6 3,25 Q-3,28 -6,21 Q-10,0 -8,-24 Z" fill="url(#${I('leather')})" stroke="${O}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M-5.6,-20 Q5,-22 6.6,-11 Q8,5 1.8,20.6 Q-2,22.4 -3.8,18 Q-7,0 -5.6,-20 Z" fill="none" stroke="#f0d3a0" stroke-width="0.8" stroke-dasharray="1.6 1.2"/>
      <path d="M-8,-24 Q7,-27 9,-12 L8.4,-9 Q-1,-10 -8.4,-12 Z" fill="${TEAL}" stroke="${O}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M-7.6,-14 Q0,-12.4 8.4,-11.6" fill="none" stroke="${GOLD}" stroke-width="0.7"/>
      ${ulzii(0.6, 2, 0.8, GOLD, '#6d3a1a')}
      ${studs}
      <path d="M5,-6 Q7,6 2,18 L5,18 Q9,6 7,-6 Z" fill="#000" opacity=".2"/>
      <path d="M-5,-6 Q-6,4 -4,14" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.6" stroke-linecap="round"/>
    </g>`;
  }

  function backArm(I) {
    return `
    <path d="M78,122 Q63,136 61,152" stroke="${O}" stroke-width="18.5" stroke-linecap="round" fill="none"/>
    <path d="M78,122 Q63,136 61,152" stroke="${DEEL_SH}" stroke-width="13.5" stroke-linecap="round" fill="none"/>
    <path d="M72,127 Q64,136 62.6,146" stroke="${DEEL}" stroke-width="3.5" stroke-linecap="round" fill="none" opacity=".8"/>
    <!-- horse-hoof cuff (turuu) -->
    <path d="M52.6,150 Q61,145 70,151 L68.6,157.4 Q61,153.6 53.6,157 Z" fill="url(#${I('teal')})" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M54.6,153.4 Q61,149.6 68,154" fill="none" stroke="${GOLD}" stroke-width="0.8" stroke-dasharray="1.2 1"/>
    <!-- hand resting on the quiver -->
    <ellipse cx="60.6" cy="161" rx="5.8" ry="5.4" fill="url(#${I('skin')})" stroke="${O}" stroke-width="2.3"/>
    <path d="M57,160 q3,2 6.5,0.6 M57.6,163 q3,1.6 5.6,0.4" fill="none" stroke="${SKIN_DK}" stroke-width="0.9" stroke-linecap="round"/>`;
  }

  function hemBack(I) {
    // rear flare of the deel skirt + sash tails (sway)
    return `
    <path d="M72,166 Q60,184 48,203 Q58,209 68,203 Q70,186 76,168 Z" fill="${DEEL_SH}" stroke="${O}" stroke-width="2.8" stroke-linejoin="round"/>
    <path d="M49,202 Q58,207 67.6,202 L67,198 Q58,203 51,198.5 Z" fill="${TEAL}" stroke="${O}" stroke-width="1" stroke-linejoin="round"/>
    <path d="M66,176 Q60,188 56,198" fill="none" stroke="${O}" stroke-width="1" opacity=".5"/>
    <!-- sash tails -->
    <path d="M74,165 Q64,178 58,192 L64,195 Q70,182 78,168 Z" fill="url(#${I('sash')})" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M77,166 Q72,180 70,196 L76,197 Q77,182 80,168 Z" fill="url(#${I('sash')})" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M58,192 l6,3 M70,196 l6,1" stroke="${CORAL}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M58.5,193.5 l-1,3 M61,194.6 l-0.6,3 M63.4,195.8 l-0.4,3 M71,197 l-0.6,3 M73.5,197.4 l-0.2,3 M76,197.6 l0,3" stroke="${O}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M58.5,193.5 l-1,3 M61,194.6 l-0.6,3 M63.4,195.8 l-0.4,3 M71,197 l-0.6,3 M73.5,197.4 l-0.2,3 M76,197.6 l0,3" stroke="${GOLD}" stroke-width="0.9" stroke-linecap="round"/>`;
  }

  function skirt(I) {
    var folds = '';
    var fx = [[86, 170, 82, 203], [100, 170, 100, 205], [112, 170, 116, 203], [120, 172, 127, 200]];
    for (var i = 0; i < fx.length; i++) {
      var p = fx[i];
      folds += '<path d="M' + p[0] + ',' + p[1] + ' Q' + (p[0] + p[2]) / 2 + ',' + ((p[1] + p[3]) / 2) + ' ' + p[2] + ',' + p[3] + '" stroke="' + DEEL_SH + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
      folds += '<path d="M' + (p[0] + 2) + ',' + p[1] + ' Q' + ((p[0] + p[2]) / 2 + 2) + ',' + ((p[1] + p[3]) / 2) + ' ' + (p[2] + 2) + ',' + (p[3] - 2) + '" stroke="' + DEEL_HI + '" stroke-width="0.9" fill="none" stroke-linecap="round" opacity=".7"/>';
    }
    return `
    <path d="${SKIRT}" fill="url(#${I('deel')})" stroke="${O}" stroke-width="3.2" stroke-linejoin="round"/>
    <g clip-path="url(#${I('skirtClip')})">
      ${folds}
      <path d="M120,164 Q134,184 136,204 L140,204 L140,160 Z" fill="#000" opacity=".16"/>
      <!-- hem band with cloud curls -->
      <path d="M50,195 Q98,204 146,193 L146,214 L50,214 Z" fill="url(#${I('teal')})"/>
      <path d="M50,195 Q98,204 146,193" fill="none" stroke="${O}" stroke-width="1.4"/>
      <path d="M50,196.6 Q98,205.6 146,194.6" fill="none" stroke="${GOLD}" stroke-width="0.7"/>
      <g transform="translate(0,2.4) skewY(-1)">${clouds(60, 197.6, 80, 2.6, GOLD)}</g>
      <!-- overlapping front panel edge (fastens under the right arm) -->
      <path d="M78,164 Q72,182 68,203 L75,204 Q78,184 83,164 Z" fill="url(#${I('teal')})" stroke="${O}" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M80,166 Q75,184 71.5,203" fill="none" stroke="${GOLD}" stroke-width="0.8" stroke-dasharray="1.4 1"/>
    </g>
    <path d="${SKIRT}" fill="none" stroke="${O}" stroke-width="3.2" stroke-linejoin="round"/>`;
  }

  // lamellar rows (khuyag): small laced leather plates
  function lamellar(I, x, y, w, rows, rh, pitch) {
    var s = '';
    for (var r = 0; r < rows; r++) {
      var yy = y + r * rh, off = (r % 2) * pitch / 2;
      s += '<rect x="' + x + '" y="' + yy + '" width="' + w + '" height="' + rh + '" fill="' + LEATHER_DK + '"/>';
      for (var px = x - pitch + off; px < x + w; px += pitch) {
        s += '<path d="M' + f(px + 0.4) + ',' + f(yy + rh) + ' L' + f(px + 0.4) + ',' + f(yy + 1.6) + ' Q' + f(px + pitch / 2) + ',' + f(yy - 0.8) + ' ' + f(px + pitch - 0.4) + ',' + f(yy + 1.6) + ' L' + f(px + pitch - 0.4) + ',' + f(yy + rh) + ' Z" fill="url(#' + I('leather') + ')" stroke="' + O + '" stroke-width="0.7"/>';
        s += '<path d="M' + f(px + 1.3) + ',' + f(yy + 2.4) + ' L' + f(px + 1.3) + ',' + f(yy + rh - 1) + '" stroke="' + LEATHER_HI + '" stroke-width="0.6" opacity=".8"/>';
        s += '<circle cx="' + f(px + pitch / 2) + '" cy="' + f(yy + 2.2) + '" r="0.45" fill="' + SILVER + '"/>';
      }
      // lacing row
      s += '<path d="M' + x + ',' + f(yy + rh - 1.6) + ' H' + (x + w) + '" stroke="' + O + '" stroke-width="2.2"/>';
      s += '<path d="M' + x + ',' + f(yy + rh - 1.6) + ' H' + (x + w) + '" stroke="' + LACE + '" stroke-width="1.2" stroke-dasharray="2 ' + f(pitch - 2) + '"/>';
    }
    return s;
  }

  function torso(I) {
    return `
    <!-- neck -->
    <path d="M91,100 L91,116 Q100,120 109,116 L109,100 Z" fill="${SKIN_SH}" stroke="${O}" stroke-width="2.6"/>
    <!-- deel body -->
    <path d="${TORSO}" fill="url(#${I('deel')})" stroke="${O}" stroke-width="3.2" stroke-linejoin="round"/>
    <g clip-path="url(#${I('torsoClip')})">
      <path d="M64,112 Q80,132 76,166 L60,166 Z" fill="#000" opacity=".18"/>
      <!-- diagonal overlapping front (closes under the right arm) -->
      <path d="M101,115 Q92,124 70,129 L70,134 Q94,130 104,118 Z" fill="url(#${I('teal')})" stroke="${O}" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M101.5,117.4 Q92,126 70,131.2" fill="none" stroke="${GOLD}" stroke-width="0.8" stroke-dasharray="1.4 1"/>
      <path d="M100,112 Q112,110 121,116" fill="none" stroke="${DEEL_HI}" stroke-width="2" stroke-linecap="round" opacity=".7"/>
    </g>
    <!-- standing collar with key meander -->
    <path d="M86,109 Q100,115 114,109 L115,116.5 Q100,122 85,116.5 Z" fill="url(#${I('teal')})" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
    <g transform="translate(0,0)">${meander(88, 114.6, 24, 3.2, GOLD)}</g>
    <path d="M86.5,110.5 Q100,116.4 113.5,110.5" fill="none" stroke="#9fe3ea" stroke-width="0.6" opacity=".8"/>
    <!-- knot buttons along the closure -->
    ${knotBtn(101, 118.6, 1.7)}
    ${knotBtn(92, 124, 1.6)}
    <path d="M89.6,124.6 l-3,0.6 M98.6,119.4 l-2.6,1" stroke="${GOLD}" stroke-width="1.1" stroke-linecap="round"/>`;
  }

  function vest(I) {
    return `
    <path d="${VEST}" fill="${LEATHER_DK}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>
    <g clip-path="url(#${I('vestClip')})">
      ${lamellar(I, 64, 131, 68, 5, 6.6, 4.6)}
      <path d="M62,128 Q78,146 74,166 L62,166 Z" fill="#000" opacity=".22"/>
      <path d="M118,128 Q126,146 124,166 L132,166 L132,128 Z" fill="#000" opacity=".14"/>
    </g>
    <!-- red leather binding on top edge -->
    <path d="M71,130 Q98,124 125,130" fill="none" stroke="${O}" stroke-width="5"/>
    <path d="M71,130 Q98,124 125,130" fill="none" stroke="url(#${I('red')})" stroke-width="3"/>
    <path d="M72,129.4 Q98,123.4 124,129.4" fill="none" stroke="#ffd0c0" stroke-width="0.6" stroke-dasharray="1.2 1.2"/>
    <!-- shoulder straps -->
    <path d="M78,129 L80,115 L87,113 L86,128" fill="${LEATHER}" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M112,127 L113,113 L120,115 L120,128.6" fill="${LEATHER}" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="82.5" cy="121" r="1.4" fill="url(#${I('gold')})" stroke="${O}" stroke-width="0.6"/>
    <circle cx="116.5" cy="121" r="1.4" fill="url(#${I('gold')})" stroke="${O}" stroke-width="0.6"/>
    <path d="M81,117 L81.8,127 M117.8,117 L118.4,127" stroke="#f0d3a0" stroke-width="0.6" stroke-dasharray="1.2 1"/>
    <!-- side lacing -->
    <path d="M121,133 l3,2 M121,138 l3,2 M121,143 l3,2 M121,148 l3,2" stroke="${LACE}" stroke-width="1.2" stroke-linecap="round"/>`;
  }

  function sash(I) {
    return `
    <path d="M68,157 Q98,163 128,157 L128.6,170 Q98,176 68,170 Z" fill="url(#${I('sash')})" stroke="${O}" stroke-width="2.8" stroke-linejoin="round"/>
    <path d="M70,160.6 Q98,166.4 127,160.6" fill="none" stroke="#c46d12" stroke-width="1"/>
    <path d="M70,164.6 Q98,170.2 127,164.4" fill="none" stroke="#c46d12" stroke-width="1"/>
    <path d="M71,159 Q98,164.5 126,159" fill="none" stroke="#fff4c4" stroke-width="1" opacity=".8"/>
    <path d="M86,160 l-2,10 M104,162 l-1,9 M116,160 l1,10" stroke="#b86010" stroke-width="0.8" opacity=".7"/>
    <!-- silver flint pouch (khet) + coral bead on a chain -->
    <path d="M110,170 Q111,176 108,180" fill="none" stroke="${SILVER}" stroke-width="1" stroke-dasharray="1 0.8"/>
    <path d="M102,180 L114,180 Q115,188 108,190 Q101,188 102,180 Z" fill="${LEATHER_DK}" stroke="${O}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M101.6,179 L114.4,179 L114,183 L102,183 Z" fill="${SILVER}" stroke="${O}" stroke-width="1" stroke-linejoin="round"/>
    <path d="M104,181 h8" stroke="#8a96a4" stroke-width="0.6" stroke-dasharray="0.8 0.8"/>
    <circle cx="108" cy="186" r="1.5" fill="${CORAL}" stroke="${O}" stroke-width="0.6"/>
    <!-- sash knot at the back hip -->
    <path d="M78,163 q-8,-6 -10,0 q2,6 10,2 z" fill="url(#${I('sash')})" stroke="${O}" stroke-width="1.6" stroke-linejoin="round"/>
    <ellipse cx="78" cy="164.4" rx="3" ry="3.4" fill="#f5a623" stroke="${O}" stroke-width="1.5"/>`;
  }

  function boot(I, x, dark) {
    return `
    <g>
      <path d="M${x + 2},192 L${x + 2},224 Q${x + 2},229 ${x + 7},229 L${x + 27},229 Q${x + 34},229 ${x + 37},222 Q${x + 39},216 ${x + 36},212.5 Q${x + 34},217 ${x + 30},218.6 Q${x + 26},219.6 ${x + 22},217 L${x + 21},192 Z" fill="url(#${I('boot')})" stroke="${O}" stroke-width="2.8" stroke-linejoin="round"/>
      <!-- sole -->
      <path d="M${x + 1.4},225 Q${x + 1.4},230.4 ${x + 7},230.4 L${x + 27},230.4 Q${x + 35.4},230.4 ${x + 38.2},222 L${x + 35.6},221 Q${x + 32.6},226.4 ${x + 27},226.4 L${x + 7},226.4 Q${x + 3},226.4 ${x + 3},224 Z" fill="#3a2418" stroke="${O}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M${x + 5},228.4 h3 M${x + 11},228.4 h3 M${x + 17},228.4 h3 M${x + 23},228.4 h3" stroke="#8a6a52" stroke-width="0.8"/>
      <!-- toe applique + stitching -->
      <path d="M${x + 21},219 Q${x + 28},221 ${x + 34},215" fill="none" stroke="${O}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M${x + 21},219 Q${x + 28},221 ${x + 34},215" fill="none" stroke="${GOLD}" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M${x + 36},213 q2,-2 1,-4" fill="none" stroke="${O}" stroke-width="1.6" stroke-linecap="round"/>
      <!-- shaft applique curls -->
      <path d="M${x + 6},206 q0,-4 4,-4 q4,0 4,4 q0,3 -3,3 q-2,0 -2,-2 M${x + 11},214 q0,-3 3,-3 q3,0 3,3 q0,2 -2,2" fill="none" stroke="${O}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M${x + 6},206 q0,-4 4,-4 q4,0 4,4 q0,3 -3,3 q-2,0 -2,-2 M${x + 11},214 q0,-3 3,-3 q3,0 3,3 q0,2 -2,2" fill="none" stroke="${TEAL}" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M${x + 4.5},196 L${x + 4.5},222 M${x + 19},196 L${x + 19.4},215" stroke="#e8b87a" stroke-width="0.7" stroke-dasharray="1.4 1.1"/>
      <path d="M${x + 6},197 Q${x + 5},210 ${x + 7},220" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2" stroke-linecap="round"/>
      <path d="M${x + 8},221.8 Q${x + 20},223.4 ${x + 30},221" fill="none" stroke="#e8b87a" stroke-width="0.7" stroke-dasharray="1.4 1.1"/>
      ${dark ? `<path d="M${x + 2},192 L${x + 2},224 Q${x + 2},229 ${x + 7},229 L${x + 27},229 Q${x + 34},229 ${x + 37},222 Q${x + 39},216 ${x + 36},212.5 Q${x + 34},217 ${x + 30},218.6 Q${x + 26},219.6 ${x + 22},217 L${x + 21},192 Z" fill="#000" opacity=".2"/>` : ''}
    </g>`;
  }

  function legs(I) {
    return boot(I, 70, true) + boot(I, 98, false);
  }

  /* ---------- head ---------- */

  function furRoll(I, p0, p1, p2, n, r, seed) {
    var back = '', fr = '', tuft = '', lite = '';
    for (var i = 0; i <= n; i++) {
      var t = i / n, p = qpt(p0, p1, p2, t), a = qtan(p0, p1, p2, t) / 57.2958;
      var nx = Math.sin(a), ny = -Math.cos(a);           // outward (up) normal
      var j = (rnd(seed + i * 5) - 0.5) * 2.2;
      var cx = p[0] + nx * j, cy = p[1] + ny * j;
      var rr = r * (0.82 + rnd(seed + i) * 0.3);
      back += '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(rr + 1.7) + '" fill="' + O + '"/>';
      fr += '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(rr) + '" fill="url(#' + I('fur') + ')"/>';
      // short fur strands fanning outward, plus darker strands near the base
      var k = (rnd(seed + i * 3) - 0.5) * 0.8;
      tuft += 'M' + f(cx + nx * rr * 0.1) + ',' + f(cy + ny * rr * 0.1) + ' l' + f((nx + k) * rr * 0.6) + ',' + f((ny) * rr * 0.6);
      tuft += 'M' + f(cx - nx * rr * 0.5 + 1.4) + ',' + f(cy - ny * rr * 0.5) + ' l' + f((-nx + k) * rr * 0.35) + ',' + f(-ny * rr * 0.35);
      lite += 'M' + f(cx + nx * rr * 0.45 - 1) + ',' + f(cy + ny * rr * 0.45) + ' q1.2,-1 2.4,-0.4';
    }
    return back + fr +
      '<path d="' + tuft + '" stroke="#9a6030" stroke-width="0.8" fill="none" stroke-linecap="round" opacity=".8"/>' +
      '<path d="' + lite + '" stroke="#fff4dc" stroke-width="1" fill="none" stroke-linecap="round" opacity=".85"/>';
  }

  function eye(cx, cy, I, far) {
    var rx = far ? 5.8 : 6.6, ry = 8;
    return `
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" stroke="${O}" stroke-width="1.6"/>
      <ellipse cx="${cx + 1.2}" cy="${cy + 0.8}" rx="${rx - 1.4}" ry="${ry - 1.2}" fill="url(#${I('iris')})"/>
      <ellipse cx="${cx + 1.4}" cy="${cy + 1.2}" rx="2.3" ry="3.3" fill="#0a0503"/>
      <path d="M${cx - 2.4},${cy + 4.8} Q${cx + 1.2},${cy + 7.4} ${cx + rx - 1.4},${cy + 4}" stroke="#e0a060" stroke-width="1" fill="none" opacity=".9"/>
      <circle cx="${cx + 3}" cy="${cy - 2.6}" r="2.3" fill="#fff"/>
      <circle cx="${cx - 1.5}" cy="${cy + 3.4}" r="1.1" fill="#fff"/>
      <circle cx="${cx + 0.4}" cy="${cy - 4.4}" r="0.6" fill="#fff" opacity=".9"/>
      <path d="M${cx - rx - 0.8},${cy - 4.4} Q${cx},${cy - 11.4} ${cx + rx + 0.8},${cy - 4.2}" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M${cx + rx},${cy - 4.6} l2.8,-2 M${cx + rx - 0.6},${cy - 6.4} l2,-2.6" stroke="${O}" stroke-width="1.4" stroke-linecap="round"/>`;
  }

  function head(I, anim) {
    var eyes = eye(96, 84, I, false) + eye(122, 84, I, true);
    var eg = anim ? `<g class="part-eyes" style="transform-origin: 109px 84px">${eyes}</g>` : `<g>${eyes}</g>`;
    var tassel = tasselG(I);
    var tg = anim ? `<g class="part-cape" style="transform-origin: 103px 13px">${tassel}</g>` : tassel;
    return `
    <!-- back hair mass -->
    <path d="M66,56 Q56,80 64,102 L82,102 Q78,80 84,58 Z" fill="url(#${I('hair')})" stroke="${O}" stroke-width="2.6" stroke-linejoin="round"/>
    <!-- fur ear flap (hanging, behind the ear) -->
    <path d="M58,62 Q52,82 55,102 Q63,108 72,101 Q70,82 75,63 Z" fill="url(#${I('fur')})" stroke="${O}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M61,66 Q57,84 59,99 Q64,102 68,98 Q67,82 71,66 Z" fill="url(#${I('crown')})" stroke="${O}" stroke-width="1.2"/>
    <path d="M63,72 Q61,84 62,95" fill="none" stroke="${GOLD}" stroke-width="0.8" stroke-dasharray="1.3 1"/>
    <path d="M55,90 l-2,2 M55,96 l-2,1.6 M57,102 l-1,2.4 M62,105 l0,2.4 M68,103.6 l1,2" stroke="${O}" stroke-width="1.1" stroke-linecap="round"/>
    <!-- face -->
    <path d="M74,60 Q68,100 102,109 Q130,110 137,88 Q141,70 133,58 Z" fill="url(#${I('skin')})" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M78,90 Q84,104 100,108" fill="none" stroke="${SKIN_SH}" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>
    <!-- ear + coral earring -->
    <path d="M79,79 Q71,75 71,84 Q72,92 80,90" fill="url(#${I('skin')})" stroke="${O}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M77,81 Q74.5,83.5 77,87" fill="none" stroke="${SKIN_DK}" stroke-width="1"/>
    <path d="M75,91 L75,95" stroke="${SILVER}" stroke-width="1.1"/>
    <circle cx="75" cy="97" r="2.1" fill="${CORAL}" stroke="${O}" stroke-width="0.9"/>
    <circle cx="75" cy="101.6" r="1.4" fill="${TURQ}" stroke="${O}" stroke-width="0.8"/>
    <circle cx="74.4" cy="96.3" r="0.6" fill="#fff" opacity=".8"/>
    <!-- side lock in front of the ear, leading to the braid -->
    <path d="M82,60 Q76,78 80,97 L84,96 Q81,80 86,62 Z" fill="url(#${I('hair')})" stroke="${O}" stroke-width="1.8" stroke-linejoin="round"/>
    <!-- centre-parted fringe -->
    <path d="M80,56 Q82,70 90,70 Q95,66 97,60 Q100,68 108,69 Q116,69 121,62 Q125,68 132,68 Q136,64 136,56 Z" fill="url(#${I('hair')})" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M86,60 Q88,66 92,67 M104,62 Q108,66 114,65 M126,60 Q128,64 132,64" fill="none" stroke="${HAIR_HI}" stroke-width="1.1" stroke-linecap="round"/>
    <!-- rosy cheeks -->
    <ellipse cx="92" cy="96" rx="7" ry="4" fill="url(#${I('blush')})"/>
    <ellipse cx="129" cy="94" rx="5.4" ry="3.6" fill="url(#${I('blush')})"/>
    <path d="M89,95.4 l1.6,-1.8 M92.4,95.4 l1.6,-1.8 M127,93.6 l1.3,-1.6 M130,93.6 l1.3,-1.6" stroke="#e3606e" stroke-width="0.8" stroke-linecap="round"/>
    <!-- brows: confident, gently arched -->
    <path d="M88,72 Q95,66.6 103,70.4 L102.4,72.4 Q95,69.4 88.6,73.6 Z" fill="${HAIR}" stroke="${O}" stroke-width="1" stroke-linejoin="round"/>
    <path d="M116,70 Q123,66 130,68.6 L130,70.6 Q123.4,68.6 116.6,72 Z" fill="${HAIR}" stroke="${O}" stroke-width="1" stroke-linejoin="round"/>
    ${eg}
    <!-- nose -->
    <path d="M113,92 q2,1.8 -0.4,3" fill="none" stroke="#c9775a" stroke-width="1.3" stroke-linecap="round"/>
    <!-- friendly open smile -->
    <path d="M104,99.6 Q112,103 120,98.6 Q118.6,106.4 112,106.6 Q106,106.4 104,99.6 Z" fill="#6a1c1c" stroke="${O}" stroke-width="1.9" stroke-linejoin="round"/>
    <path d="M105.2,100.4 Q112,103.2 118.8,99.6 L118.2,101.4 Q112,104.2 105.8,102 Z" fill="#fffaf2"/>
    <path d="M108,105.2 Q112,103.2 116,105 Q112,107 108,105.2 Z" fill="#e5606a"/>
    <path d="M102.6,98.6 Q103.6,99.8 104.6,99.4 M119.6,98 Q121.4,97.6 122,96.2" stroke="${O}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    <path d="M131,76 Q136,84 133,92" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".4"/>
    <!-- loovuuz crown -->
    <path d="${CROWN}" fill="url(#${I('crown')})" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>
    <g clip-path="url(#${I('crownClip')})">
      <path d="M103,12 Q86,26 80,54 M103,12 Q100,30 100,50 M103,12 Q118,28 122,50" fill="none" stroke="#132448" stroke-width="1.2"/>
      <path d="M103,13 Q87,27 81.6,54 M103,13 Q101.4,30 101.6,50 M103,13 Q119.4,28 123.6,50" fill="none" stroke="${GOLD}" stroke-width="0.8" stroke-dasharray="1.4 1.1"/>
      <path d="M60,60 Q66,32 94,16 L96,20 Q72,36 70,60 Z" fill="#000" opacity=".22"/>
      <path d="M108,20 Q126,30 134,46" fill="none" stroke="#9ab8f0" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>
      <!-- gold brocade band above the fur -->
      <path d="M60,52 Q100,34 146,48 L146,54 Q100,40 60,58 Z" fill="url(#${I('gold')})" stroke="${O}" stroke-width="0.9"/>
    </g>
    ${ulzii(114, 34, 0.9, GOLD, '#8f1717')}
    ${tg}
    <!-- fox-fur brim -->
    ${furRoll(I, [60, 64], [101, 39], [146, 56], 20, 6, 5)}
    <path d="M70,52 Q100,38 136,48" fill="none" stroke="#fff3d6" stroke-width="2" stroke-linecap="round" opacity=".55"/>`;
  }

  function tasselG(I) {
    var strands = '';
    var ends = [[74, 44], [78, 48], [83, 50], [88, 50], [92, 46]];
    for (var i = 0; i < ends.length; i++) {
      var e = ends[i];
      strands += 'M103,13 Q' + f(92 - i * 1.5) + ',' + f(18 + i * 2) + ' ' + e[0] + ',' + e[1];
    }
    return `
      <path d="${strands}" fill="none" stroke="${O}" stroke-width="4.6" stroke-linecap="round"/>
      <path d="${strands}" fill="none" stroke="url(#${I('red')})" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M103,13 Q90,19 76,44" fill="none" stroke="#ff9a8a" stroke-width="0.8" stroke-linecap="round" opacity=".9"/>
      <!-- knotted top button (jinst) -->
      <circle cx="103.5" cy="10.5" r="5" fill="${O}"/>
      <circle cx="103.5" cy="10.5" r="3.8" fill="url(#${I('red')})"/>
      <path d="M100.6,9.6 q3,2.6 5.8,0 M101.4,12.6 q2.4,-3.4 4.6,-5" fill="none" stroke="#8f1717" stroke-width="0.8"/>
      <circle cx="102.4" cy="9" r="1" fill="#ffd0c8"/>
      <circle cx="103.5" cy="4.6" r="2" fill="url(#${I('gold')})" stroke="${O}" stroke-width="1"/>`;
  }

  /* ---------- weapon arm + composite bow ---------- */

  function bow(I) {
    var limb = 'M156.6,78 L156,99 C160,110 173,124 171,146 C173,168 160,182 156,193 L156.6,214';
    var belly = 'M154.4,99.5 C158.4,110.5 171,124 169,146 C171,168 158.4,181.5 154.4,192.5';
    return `
      <!-- string -->
      <path d="M154.2,79 L154.2,213" stroke="${O}" stroke-width="2.4"/>
      <path d="M154.2,79 L154.2,213" stroke="#f7efd8" stroke-width="1"/>
      <!-- limbs: sinew back, wood core, horn belly -->
      <path d="${limb}" fill="none" stroke="${O}" stroke-width="9.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${limb}" fill="none" stroke="#e3c486" stroke-width="6.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${belly}" fill="none" stroke="#3a2f2a" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M157.6,101 C162,111 173.6,124 172.4,140 M172.4,152 C173.6,166 162,181 157.6,191" fill="none" stroke="#fff6dc" stroke-width="0.9" stroke-linecap="round" opacity=".9"/>
      <!-- painted bands (lacquer + birch bark) -->
      <path d="M163.2,112 l5,-3 M166.6,118 l5,-2 M166.6,174 l5,2 M163.2,180 l5,3" stroke="${O}" stroke-width="3.4" stroke-linecap="butt"/>
      <path d="M163.2,112 l5,-3 M166.6,118 l5,-2 M166.6,174 l5,2 M163.2,180 l5,3" stroke="#c8352c" stroke-width="2" stroke-linecap="butt"/>
      <path d="M165,115 l5,-2.4 M165,177 l5,2.4" stroke="${GOLD}" stroke-width="1.2"/>
      <!-- siyah tips (stiff ears) with string bridges -->
      <path d="M156.6,99 L156.6,79 Q157,72 163,69" fill="none" stroke="${O}" stroke-width="6.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M156.6,99 L156.6,79 Q157,72 163,69" fill="none" stroke="#7a4a26" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M156.6,193 L156.6,213 Q157,220 163,223" fill="none" stroke="${O}" stroke-width="6.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M156.6,193 L156.6,213 Q157,220 163,223" fill="none" stroke="#7a4a26" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M157.6,96 L157.6,82 M157.6,196 L157.6,210" stroke="#b07a48" stroke-width="0.9"/>
      <rect x="153" y="97" width="4.4" height="3.2" rx="1" fill="#f0e2c0" stroke="${O}" stroke-width="0.9"/>
      <rect x="153" y="191.8" width="4.4" height="3.2" rx="1" fill="#f0e2c0" stroke="${O}" stroke-width="0.9"/>
      <path d="M154.2,79 L156.6,77.4 M154.2,213 L156.6,214.6" stroke="#f4ead0" stroke-width="1.1" stroke-linecap="round"/>`;
  }

  function arrow(I) {
    // nocked on the string, resting on the bow hand, pointing forward-down
    return `
      <g transform="translate(152.6,132.4) rotate(26.5)">
        <path d="M2,0 L39,0" stroke="${O}" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M2,0 L39,0" stroke="#d9b273" stroke-width="1.6"/>
        <path d="M-0.5,-1.8 L3,-1.8 L3,1.8 L-0.5,1.8 Z" fill="${CORAL}" stroke="${O}" stroke-width="0.9"/>
        <path d="M4,0 L6,-5 L17,-4.2 L19,0 Z" fill="#f7f3ea" stroke="${O}" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M4,0 L6,4.6 L17,3.8 L19,0 Z" fill="#d9302c" stroke="${O}" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M8,-4 L10,-0.6 M12,-4 L14,-0.6 M8,3.6 L10,0.6 M12,3.6 L14,0.6" stroke="#6a5140" stroke-width="0.8"/>
        <path d="M20,-1.4 h2 M20,1.4 h2" stroke="${O}" stroke-width="0.6"/>
        <!-- leaf-shaped arrowhead -->
        <path d="M38,-1.6 L40,-3.6 Q46,-2 48,0 Q46,2 40,3.6 L38,1.6 Z" fill="url(#${I('steel')})" stroke="${O}" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M39.6,-0.8 L46,-0.2" stroke="#fff" stroke-width="0.8" stroke-linecap="round"/>
      </g>`;
  }

  function weaponArm(I) {
    return `
      ${bow(I)}
      <!-- deel sleeve: shoulder -> elbow -> wrist -->
      <path d="M120,122 Q128,142 146,148" stroke="${O}" stroke-width="18.5" stroke-linecap="round" fill="none"/>
      <path d="M120,122 Q128,142 146,148" stroke="${DEEL}" stroke-width="13.5" stroke-linecap="round" fill="none"/>
      <path d="M124,124 Q130,138 142,143" stroke="${DEEL_HI}" stroke-width="3" stroke-linecap="round" fill="none" opacity=".8"/>
      <path d="M121,132 Q128,148 142,152" stroke="${DEEL_SH}" stroke-width="3" stroke-linecap="round" fill="none" opacity=".8"/>
      <!-- teal shoulder seam trim -->
      <path d="M113,118 Q121,112 128,120" fill="none" stroke="${O}" stroke-width="4.4" stroke-linecap="round"/>
      <path d="M113,118 Q121,112 128,120" fill="none" stroke="${TEAL}" stroke-width="2.6" stroke-linecap="round"/>
      <!-- horse-hoof cuff (turuu) -->
      <g transform="translate(146,149) rotate(20)">
        <path d="M-4,-9 Q3,-9 4,-8 L4,8 Q-2,9 -4,8 Z" fill="url(#${I('teal')})" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M-1.6,-7.6 L-1.4,7.4" stroke="${GOLD}" stroke-width="0.8" stroke-dasharray="1.2 1"/>
      </g>
      <!-- leather bracer on the bow arm -->
      <g transform="translate(157,151.4) rotate(12)">
        <path d="M-7,-6.2 L7,-5.4 Q8.6,0 7,5.4 L-7,6.2 Q-8.4,0 -7,-6.2 Z" fill="url(#${I('leather')})" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M-5.6,-4.4 L5.8,-3.8 M-5.6,4.4 L5.8,3.8" stroke="#f0d3a0" stroke-width="0.6" stroke-dasharray="1.2 0.9"/>
        <path d="M-2,-5.8 L-2,5.8 M2.4,-5.6 L2.4,5.6" stroke="${O}" stroke-width="1.6"/>
        <path d="M-2,-5.8 L-2,5.8 M2.4,-5.6 L2.4,5.6" stroke="${LACE}" stroke-width="0.8"/>
        <circle cx="0.2" cy="0" r="1.5" fill="url(#${I('gold')})" stroke="${O}" stroke-width="0.6"/>
      </g>
      <!-- bow hand gripping the handle -->
      <path d="M163,142 Q171,138.6 177,142.6 Q179.4,149 176,155 Q169,158 163.4,154.4 Q160.6,148 163,142 Z" fill="url(#${I('skin')})" stroke="${O}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M170.4,142 Q173,146 170.8,150 M166.8,143 Q169.4,147 167.2,151.4" fill="none" stroke="${SKIN_DK}" stroke-width="1" stroke-linecap="round"/>
      <path d="M163.6,146.4 Q168,146.6 172,144.2" fill="none" stroke="${O}" stroke-width="1.3" stroke-linecap="round"/>
      <!-- thumb ring (jade) -->
      <rect x="170.4" y="139.2" width="4" height="3.2" rx="1.2" fill="#6fc9a0" stroke="${O}" stroke-width="0.9"/>
      ${arrow(I)}`;
  }

  /* ---------- assembly ---------- */

  function fixIds(s, I) {
    return s.replace(/url\(#GOLD\)/g, 'url(#' + I('gold') + ')').replace(/url\(#HAIRG\)/g, 'url(#' + I('hair') + ')');
  }

  function svg(uid) {
    var I = ids(uid);
    return fixIds(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240">
  ${defs(I)}
  <ellipse class="part-shadow" cx="100" cy="229.5" rx="54" ry="7" fill="#000" opacity="0.24"/>
  ${legs(I)}
  <g class="part-body">
    <g class="part-cape" style="transform-origin: 66px 96px">${backBraid()}</g>
    ${quiver(I)}
    <g class="part-cape" style="transform-origin: 74px 166px">${hemBack(I)}</g>
    ${skirt(I)}
    ${backArm(I)}
    ${torso(I)}
    ${vest(I)}
    ${sash(I)}
    ${bowCase(I)}
    <g class="part-cape" style="transform-origin: 79px 96px">${frontBraid()}</g>
    <g class="part-head" style="transform-origin: 100px 108px">
      ${head(I, true)}
    </g>
    <g class="part-weapon" style="transform-origin: 121px 122px">
      ${weaponArm(I)}
    </g>
  </g>
</svg>`, I);
  }

  function portrait(uid) {
    var I = ids('p' + (uid == null ? '' : uid));
    return fixIds(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  ${defs(I)}
  <defs>
    <radialGradient id="${I('pbg')}" cx="0.5" cy="0.4" r="0.75">
      <stop offset="0" stop-color="#f7b8c2"/><stop offset="0.6" stop-color="#b85563"/><stop offset="1" stop-color="#8e3b46"/>
    </radialGradient>
    <clipPath id="${I('pclip')}"><rect x="0" y="0" width="120" height="120" rx="14"/></clipPath>
  </defs>
  <g clip-path="url(#${I('pclip')})">
    <rect width="120" height="120" fill="url(#${I('pbg')})"/>
    <circle cx="60" cy="50" r="46" fill="#ffffff" opacity="0.15"/>
    <path d="M0,106 Q30,96 60,104 Q90,96 120,104 L120,120 L0,120 Z" fill="#5a1f28" opacity="0.4"/>
    ${clouds(4, 112, 112, 3, '#ffd6dc')}
    <g transform="translate(-11,2) scale(0.75)">
      ${backBraid()}
      <path d="M120,122 Q126,136 128,150" stroke="${O}" stroke-width="18.5" stroke-linecap="round" fill="none"/>
      <path d="M120,122 Q126,136 128,150" stroke="${DEEL}" stroke-width="13.5" stroke-linecap="round" fill="none"/>
      <path d="M78,122 Q70,136 69,150" stroke="${O}" stroke-width="18.5" stroke-linecap="round" fill="none"/>
      <path d="M78,122 Q70,136 69,150" stroke="${DEEL_SH}" stroke-width="13.5" stroke-linecap="round" fill="none"/>
      ${torso(I)}
      ${vest(I)}
      <path d="M113,118 Q121,112 128,120" fill="none" stroke="${O}" stroke-width="4.4" stroke-linecap="round"/>
      <path d="M113,118 Q121,112 128,120" fill="none" stroke="${TEAL}" stroke-width="2.6" stroke-linecap="round"/>
      ${frontBraid()}
      ${head(I, false)}
    </g>
  </g>
  <rect x="1.5" y="1.5" width="117" height="117" rx="13" fill="none" stroke="${O}" stroke-width="3"/>
</svg>`, I);
  }

  window.HEROES = window.HEROES || {};
  window.HEROES.mongol = {
    key: 'mongol',
    name: 'Khulan',
    title: 'The Steppe Archer',
    lore: 'Raised in the saddle beneath the Eternal Blue Sky, Khulan can split a falling leaf at a hundred paces. Her grandmother\'s horn bow has never missed a naadam, and it does not intend to start now.',
    color: '#8e3b46',
    base: { hp: 500, atk: 108, def: 18 },
    fx: { slash: '#ff9ab0', glow: '#ffe8ee' },
    signature: { name: 'Rain of Arrows', desc: 'Fire 2 extra arrows every turn (50% ATK each) at random enemies.', type: 'volley' },
    svg: svg,
    portrait: portrait
  };
})();

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

  function cb(p0, p1, p2, p3, t) {
    var u = 1 - t;
    return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
  }
  function star(x, y, r, op) {
    return '<path d="M' + x + ',' + f(y - r) + ' Q' + x + ',' + y + ' ' + f(x + r) + ',' + y + ' Q' + x + ',' + y + ' ' + x + ',' + f(y + r) + ' Q' + x + ',' + y + ' ' + f(x - r) + ',' + y + ' Q' + x + ',' + y + ' ' + x + ',' + f(y - r) + ' Z" fill="#fff" opacity="' + (op || 0.95) + '"/>';
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
    <linearGradient id="${I('aoV')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1a0b10" stop-opacity="0.5"/><stop offset="1" stop-color="#1a0b10" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${I('sheen')}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.32"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${I('ao')}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#14070a" stop-opacity="0.5"/><stop offset="1" stop-color="#14070a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${I('irisR')}" cx="0.5" cy="0.62" r="0.6">
      <stop offset="0.35" stop-color="#d9a25c" stop-opacity="0"/><stop offset="0.8" stop-color="#e8b070" stop-opacity="0.75"/><stop offset="1" stop-color="#e8b070" stop-opacity="0"/>
    </radialGradient>
    <pattern id="${I('twill')}" patternUnits="userSpaceOnUse" width="2.6" height="2.6" patternTransform="rotate(38)">
      <path d="M0,0.5 H2.6" stroke="#000" stroke-width="0.5" opacity="0.16"/>
    </pattern>
    <pattern id="${I('damask')}" patternUnits="userSpaceOnUse" width="12" height="12">
      <g fill="none" stroke="#f0a0aa" stroke-width="0.6" opacity="0.4" stroke-linecap="round">
        <path d="M6,2.4 Q8.2,4.2 6,6 Q3.8,4.2 6,2.4 M3.4,4.2 Q6,3.4 8.6,4.2"/><circle cx="6" cy="8.4" r="0.7"/>
        <path d="M0,0 l1.6,1.6 M12,0 l-1.6,1.6 M0,12 l1.6,-1.6 M12,12 l-1.6,-1.6"/>
      </g>
    </pattern>
    <pattern id="${I('grain')}" patternUnits="userSpaceOnUse" width="4.4" height="4.4">
      <path d="M0.4,1 q0.6,-0.5 1.2,0 M2.6,3.2 q0.7,-0.6 1.3,0 M3.2,0.6 l0.6,0.5 M1,3.6 l0.6,0.4" stroke="#3c2210" stroke-width="0.45" fill="none" opacity="0.5" stroke-linecap="round"/>
      <circle cx="2.2" cy="1.8" r="0.3" fill="#e8b87a" opacity="0.4"/>
    </pattern>
    <pattern id="${I('weave')}" patternUnits="userSpaceOnUse" width="2.4" height="2.4">
      <path d="M0,0.6 H2.4 M0.6,0 V2.4" stroke="#8a4306" stroke-width="0.45" opacity="0.4"/>
      <path d="M1.8,0 V2.4 M0,1.8 H2.4" stroke="#fff4c4" stroke-width="0.3" opacity="0.35"/>
    </pattern>
    <pattern id="${I('felt')}" patternUnits="userSpaceOnUse" width="3.6" height="3.6">
      <path d="M0.4,0.8 l1,0.4 M2.4,2.6 l1,-0.3 M2,0.4 l0.5,0.8 M0.2,2.8 l0.8,0.4" stroke="#2a0c06" stroke-width="0.45" opacity="0.5" stroke-linecap="round"/>
      <circle cx="2.6" cy="1.2" r="0.3" fill="#e0a080" opacity="0.4"/>
    </pattern>
    <pattern id="${I('quilt')}" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(-8)">
      <path d="M0,4 L4,0 M4,8 L8,4 M0,4 L4,8 M4,0 L8,4" stroke="#f4c24e" stroke-width="0.55" opacity="0.7" fill="none"/>
      <circle cx="4" cy="4" r="0.55" fill="#f4c24e" opacity="0.85"/><circle cx="0" cy="0" r="0.4" fill="#f4c24e" opacity="0.7"/><circle cx="8" cy="8" r="0.4" fill="#f4c24e" opacity="0.7"/>
    </pattern>
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
      hl += '<path transform="translate(' + f(cx) + ',' + f(cy) + ') rotate(' + f(a) + ')" d="M' + f(-L * 0.5) + ',' + f(-ww * 0.32) + ' Q0,' + f(ww * 0.05) + ' ' + f(L * 0.5) + ',' + f(-ww * 0.32) + ' M' + f(-L * 0.4) + ',' + f(ww * 0.1) + ' Q0,' + f(ww * 0.36) + ' ' + f(L * 0.4) + ',' + f(ww * 0.1) + '" fill="none" stroke="#0a0708" stroke-width="0.5" opacity=".7"/>';
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
    // silver ring wrapped on the plait
    var rg = qpt(p0, p1, p2, 0.25), ar = qtan(p0, p1, p2, 0.25);
    s += '<g transform="translate(' + f(rg[0]) + ',' + f(rg[1]) + ') rotate(' + f(ar - 90) + ')"><rect x="-4.6" y="-1.5" width="9.2" height="3" rx="1.4" fill="' + SILVER + '" stroke="' + O + '" stroke-width="1.1"/><path d="M-3.4,-0.5 H3.4" stroke="#fff" stroke-width="0.6"/><path d="M-2,1 l0.6,0.4 M0.4,1 l0.6,0.4 M2.6,1 l0.6,0.4" stroke="#7d8b99" stroke-width="0.4"/></g>';
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
        '<path d="M0,' + (top + 26) + ' L0,' + (top + 40) + ' M-4.2,' + (top + 25) + ' L-4,' + (top + 36) + '" stroke="#000" stroke-width="0.5" opacity=".35"/>' +
        '<path d="M-3.4,' + (top + 34.6) + ' L-0.4,' + (top + 36.4) + ' M3.4,' + (top + 34.6) + ' L0.4,' + (top + 36.4) + '" stroke="' + fcol[i][1] + '" stroke-width="1" opacity=".8"/>' +
        '<path d="M0,' + (top + 42) + ' L0,' + (top + 45) + '" stroke="' + (i % 2 ? CORAL : TURQ) + '" stroke-width="1.6"/>' +
        '</g>';
    }
    return `
    <g transform="translate(58,170) rotate(-22)">
      ${arrows}
      <path d="M-10,-26 Q0,-30 10,-26 L9,24 Q0,32 -9,24 Z" fill="url(#${I('leather')})" stroke="${O}" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M-10,-26 Q0,-30 10,-26 L9,24 Q0,32 -9,24 Z" fill="url(#${I('grain')})" opacity=".45"/>
      <path d="M-6.4,-12 q1.6,-2 3.2,0 q1.6,2 3.2,0 M-6.6,-7 q1.6,-2 3.2,0 M3.6,-6 q1.6,-2 3.2,0 M-6.6,9 q1.6,-2 3.2,0 q1.6,2 3.2,0 M-6.4,16 q1.6,-2 3.2,0 M3.4,15 q1.6,-2 3.2,0 M-3,22 q3,2 6,0" fill="none" stroke="#3c2210" stroke-width="0.7" stroke-linecap="round" opacity=".7"/>
      <path d="M-10,-26 Q0,-22 10,-26 L10,-20 Q0,-16 -10,-20 Z" fill="url(#${I('red')})" stroke="${O}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M-9,-18 Q0,-14 9,-18" fill="none" stroke="${GOLD}" stroke-width="0.8" stroke-dasharray="1.4 1"/>
      <path d="M-7,-12 L-6.6,20 M7,-12 L6.6,20" fill="none" stroke="#f0d3a0" stroke-width="0.8" stroke-dasharray="1.6 1.2"/>
      ${ulzii(0, 0, 0.95, GOLD, '#6d3a1a')}
      <rect x="-9.4" y="12" width="18.8" height="3.2" fill="url(#${I('gold')})" stroke="${O}" stroke-width="1"/>
      <circle cx="-5" cy="13.6" r="0.8" fill="#fff5c0"/><circle cx="0" cy="13.6" r="0.8" fill="#fff5c0"/><circle cx="5" cy="13.6" r="0.8" fill="#fff5c0"/>
      <path d="M-8,-10 Q-9,4 -7,20" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2" stroke-linecap="round"/>
      <path d="M-9,-1 Q0,3 9,-1 L9,3 Q0,7 -9,3 Z" fill="url(#${I('leather')})" stroke="${O}" stroke-width="1.2"/>
      <rect x="-1.6" y="-0.6" width="3.2" height="4" rx="0.8" fill="url(#${I('gold')})" stroke="${O}" stroke-width="0.7"/>
      <path d="M-8,0.8 H-3 M3,0.8 H8" stroke="#f0d3a0" stroke-width="0.4" stroke-dasharray="1 0.8"/>
      <path d="M-9.4,20 Q0,28 9.4,20" fill="none" stroke="${O}" stroke-width="0.8" opacity=".5"/>
      <path d="M0,28 v4 M-1,28.4 l-1.4,3.6 M1,28.4 l1.4,3.6" stroke="${O}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M0,28 v4 M-1,28.4 l-1.4,3.6 M1,28.4 l1.4,3.6" stroke="url(#${I('red')})" stroke-width="1.2" stroke-linecap="round"/>
      <circle cy="27.6" r="1.6" fill="${TURQ}" stroke="${O}" stroke-width="0.8"/><circle cx="-0.5" cy="27" r="0.5" fill="#fff"/>
      <ellipse cx="0" cy="-22" rx="9.4" ry="1.6" fill="#000" opacity=".28"/>
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
      <path d="M-8,-24 Q7,-27 9,-12 Q11,6 3,25 Q-3,28 -6,21 Q-10,0 -8,-24 Z" fill="url(#${I('grain')})" opacity=".45"/>
      <path d="M-4,-8 q2,-2 4,0 M-4.6,8 q2,-2 4,0 M-2,13 q2,-2 4,0 M3.6,-2 q1.6,-1.6 3,0" fill="none" stroke="#3c2210" stroke-width="0.6" opacity=".7" stroke-linecap="round"/>
      <path d="M-8,-22 Q1,-25 8,-22" fill="none" stroke="#fff" stroke-width="0.8" opacity=".5" stroke-linecap="round"/>
      <circle cx="-4" cy="-17.4" r="0.8" fill="${SILVER}" stroke="${O}" stroke-width="0.4"/><circle cx="4.6" cy="-18.4" r="0.8" fill="${SILVER}" stroke="${O}" stroke-width="0.4"/>
      <path d="M-8.4,10 Q1,13 9.6,8 L9.4,12 Q1,17 -8,14.4 Z" fill="url(#${I('leather')})" stroke="${O}" stroke-width="1.2" stroke-linejoin="round"/>
      <rect x="-1.4" y="10.6" width="4" height="4.4" rx="0.8" fill="${SILVER}" stroke="${O}" stroke-width="0.8"/><path d="M0,12 v1.6" stroke="${O}" stroke-width="0.6"/>
      <path d="M4,-25 v-2.6 M6.6,-24 v-3" stroke="${O}" stroke-width="2.4" stroke-linecap="round"/><path d="M4,-25 v-2.6 M6.6,-24 v-3" stroke="${CORAL}" stroke-width="1" stroke-linecap="round"/>
      <path d="M-3,25 v4 M-4.6,24 l-1,4" stroke="${O}" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      <path d="M-3,25 v4 M-4.6,24 l-1,4" stroke="${GOLD}" stroke-width="1" stroke-linecap="round" fill="none"/>
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
    <path d="M78,122 Q63,136 61,152" stroke="url(#${I('damask')})" stroke-width="13.5" stroke-linecap="round" fill="none"/>
    <path d="M78,122 Q63,136 61,152" stroke="url(#${I('twill')})" stroke-width="13.5" stroke-linecap="round" fill="none"/>
    <path d="M72,127 Q64,136 62.6,146" stroke="${DEEL}" stroke-width="3.5" stroke-linecap="round" fill="none" opacity=".8"/>
    <path d="M70,128 q6,4 6,9 M66,138 q-5,3 -6,8" fill="none" stroke="${O}" stroke-width="0.7" opacity=".4" stroke-linecap="round"/>
    <ellipse cx="61" cy="148" rx="8" ry="3" fill="#000" opacity=".2"/>
    <!-- horse-hoof cuff (turuu) -->
    <path d="M52.6,150 Q61,145 70,151 L68.6,157.4 Q61,153.6 53.6,157 Z" fill="url(#${I('teal')})" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M54.6,153.4 Q61,149.6 68,154" fill="none" stroke="${GOLD}" stroke-width="0.8" stroke-dasharray="1.2 1"/>
    <!-- hand resting on the quiver -->
    <ellipse cx="60.6" cy="161" rx="5.8" ry="5.4" fill="url(#${I('skin')})" stroke="${O}" stroke-width="2.3"/>
    <path d="M56,157.8 q1.4,-1 2.6,-0.4 M60,157 q1.4,-0.8 2.6,0 M63.4,157.6 q1.2,-0.4 2,0.4" fill="none" stroke="#fff" stroke-width="0.7" opacity=".55" stroke-linecap="round"/>
    <path d="M57,160 q3,2 6.5,0.6 M57.6,163 q3,1.6 5.6,0.4" fill="none" stroke="${SKIN_DK}" stroke-width="0.9" stroke-linecap="round"/>`;
  }

  function hemBack(I) {
    // rear flare of the deel skirt + sash tails (sway)
    return `
    <path d="M72,166 Q60,184 48,203 Q58,209 68,203 Q70,186 76,168 Z" fill="${DEEL_SH}" stroke="${O}" stroke-width="2.8" stroke-linejoin="round"/>
    <path d="M49,202 Q58,207 67.6,202 L67,198 Q58,203 51,198.5 Z" fill="${TEAL}" stroke="${O}" stroke-width="1" stroke-linejoin="round"/>
    <path d="M66,176 Q60,188 56,198" fill="none" stroke="${O}" stroke-width="1" opacity=".5"/>
    <path d="M72,166 Q60,184 48,203 Q58,209 68,203 Q70,186 76,168 Z" fill="url(#${I('twill')})"/>
    <path d="M62,178 Q56,190 53,199 M70,172 Q64,186 62,198" fill="none" stroke="#000" stroke-width="0.8" opacity=".25"/>
    <path d="M50.4,199.6 Q58,204.6 66.4,199.4" fill="none" stroke="#c9f0f2" stroke-width="0.5" stroke-dasharray="1.4 1.2" opacity=".8"/>
    <path d="M50,203 l-0.6,2 M53,205 l-0.4,2 M57,206.4 l0,2 M61,206.6 l0.2,2 M65,205.8 l0.4,2" stroke="${O}" stroke-width="0.9" stroke-linecap="round"/>
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
      <rect x="55" y="162" width="85" height="45" fill="url(#${I('damask')})"/>
      <rect x="55" y="162" width="85" height="45" fill="url(#${I('twill')})"/>
      <path d="M88,166 Q84,186 90,202 M104,166 Q108,186 104,202 M116,167 Q120,186 122,200" fill="none" stroke="url(#${I('sheen')})" stroke-width="5" opacity=".7"/>
      <path d="M92,171 q3,14 -1,28 M108,171 q-3,12 2,28 M124,172 q1,10 2,20" fill="none" stroke="${DEEL_SH}" stroke-width="0.6" opacity=".7"/>
      <ellipse cx="98" cy="166" rx="36" ry="7" fill="url(#${I('ao')})"/>
      <path d="M120,164 Q134,184 136,204 L140,204 L140,160 Z" fill="#000" opacity=".16"/>
      <!-- hem band with cloud curls -->
      <path d="M50,195 Q98,204 146,193 L146,214 L50,214 Z" fill="url(#${I('teal')})"/>
      <path d="M50,195 Q98,204 146,193" fill="none" stroke="${O}" stroke-width="1.4"/>
      <path d="M50,196.6 Q98,205.6 146,194.6" fill="none" stroke="${GOLD}" stroke-width="0.7"/>
      <g transform="translate(0,2.4) skewY(-1)">${clouds(60, 197.6, 80, 2.6, GOLD)}</g>
      <!-- overlapping front panel edge (fastens under the right arm) -->
      <path d="M78,164 Q72,182 68,203 L75,204 Q78,184 83,164 Z" fill="url(#${I('teal')})" stroke="${O}" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M80,166 Q75,184 71.5,203" fill="none" stroke="${GOLD}" stroke-width="0.8" stroke-dasharray="1.4 1"/>
      <path d="M73.4,168 Q70.4,184 68.6,200" fill="none" stroke="#7fd6df" stroke-width="0.6" opacity=".7"/>
      ${ulzii(72.4, 190, 0.5, GOLD, null)}
      <!-- stitching + thread ends on the hem -->
      <path d="M52,192.6 Q98,201.4 146,191.6" fill="none" stroke="#c9f0f2" stroke-width="0.5" stroke-dasharray="1.6 1.4" opacity=".8"/>
      <path d="M64,198.6 Q98,207.2 134,197.4" fill="none" stroke="#0c3d47" stroke-width="0.8" opacity=".55"/>
      <path d="M62,199.4 l-0.6,2 M67,201.4 l-0.4,2 M73,203 l-0.2,2.2 M80,204 l0,2 M89,204.6 l0.2,2 M99,204.8 l0.2,2.2 M109,204.6 l0.4,2 M118,203.8 l0.4,2 M127,202 l0.6,2 M133,200 l0.8,1.8" stroke="${TEAL_DK}" stroke-width="0.9" stroke-linecap="round"/>
      <!-- knots on the hem band -->
      ${ulzii(88, 199.2, 0.55, '#ffe9a0', null)}${ulzii(112, 198.6, 0.55, '#ffe9a0', null)}
      <!-- dust scuffs -->
      <path d="M60,196 q5,3 10,2 M118,199 q7,0 14,-3" fill="none" stroke="#6b4a2a" stroke-width="1.6" opacity=".22" stroke-linecap="round"/>
    </g>
    <path d="${SKIRT}" fill="none" stroke="${O}" stroke-width="3.2" stroke-linejoin="round"/>`;
  }

  // lamellar rows (khuyag): small laced leather plates
  function lamellar(I, x, y, w, rows, rh, pitch) {
    var s = '', LG = 'url(#' + I('leather') + ')';
    for (var r = 0; r < rows; r++) {
      var yy = y + r * rh, off = (r % 2) * pitch / 2;
      var plates = '', sh = '', hi = '', lace = '', riv = '', rivh = '', scuff = '';
      s += '<rect x="' + x + '" y="' + yy + '" width="' + w + '" height="' + rh + '" fill="' + LEATHER_DK + '"/>';
      for (var px = x - pitch + off; px < x + w; px += pitch) {
        var pl = f(px + 0.4), pr = f(px + pitch - 0.4), pm = f(px + pitch / 2), y1 = f(yy + 1.6), yb = f(yy + rh);
        plates += 'M' + pl + ',' + yb + ' L' + pl + ',' + y1 + ' Q' + pm + ',' + f(yy - 0.8) + ' ' + pr + ',' + y1 + ' L' + pr + ',' + yb + ' Z ';
        sh += 'M' + pm + ',' + f(yy + 1.2) + ' L' + pr + ',' + y1 + ' L' + pr + ',' + yb + ' L' + pm + ',' + yb + ' Z ';
        hi += 'M' + f(px + 1.3) + ',' + f(yy + 2.4) + ' V' + f(yy + rh - 1) + ' ';
        lace += 'M' + f(px + pitch) + ',' + f(yy + 2.4) + ' V' + f(yy + rh - 0.6) + ' ';
        riv += 'M' + pm + ',' + f(yy + 2.7) + ' v0.01 ';
        rivh += 'M' + f(px + pitch / 2 - 0.2) + ',' + f(yy + 2.5) + ' v0.01 ';
        if (rnd(px * 3 + r * 7) > 0.72) scuff += 'M' + f(px + 1.6) + ',' + f(yy + 3.6) + ' l1.4,1.6 ';
      }
      s += '<path d="' + plates + '" fill="' + LG + '" stroke="' + O + '" stroke-width="0.7" stroke-linejoin="round"/>';
      s += '<path d="' + sh + '" fill="#2a1408" opacity=".3"/>';
      s += '<path d="' + hi + '" stroke="' + LEATHER_HI + '" stroke-width="0.6" opacity=".8" fill="none"/>';
      s += '<path d="' + lace + '" stroke="' + LACE + '" stroke-width="0.5" opacity=".9" fill="none"/>';
      s += '<path d="' + riv + '" stroke="' + O + '" stroke-width="1.35" stroke-linecap="round"/><path d="' + riv + '" stroke="' + SILVER + '" stroke-width="0.95" stroke-linecap="round"/><path d="' + rivh + '" stroke="#fff" stroke-width="0.35" stroke-linecap="round"/>';
      s += '<path d="' + scuff + '" stroke="#f0d3a0" stroke-width="0.4" opacity=".8" fill="none"/>';
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
    <path d="M92,104 L108,104 L108,114 Q100,118 92,114 Z" fill="${SKIN_DK}" opacity=".35"/>
    <path d="M104,104 Q106,110 104,115" fill="none" stroke="#fff" stroke-width="1" opacity=".35" stroke-linecap="round"/>
    <!-- deel body -->
    <path d="${TORSO}" fill="url(#${I('deel')})" stroke="${O}" stroke-width="3.2" stroke-linejoin="round"/>
    <g clip-path="url(#${I('torsoClip')})">
      <path d="M64,112 Q80,132 76,166 L60,166 Z" fill="#000" opacity=".18"/>
      <rect x="62" y="104" width="72" height="64" fill="url(#${I('damask')})"/>
      <rect x="62" y="104" width="72" height="64" fill="url(#${I('twill')})"/>
      <path d="M84,120 Q80,128 82,134 M112,120 Q116,128 113,133" fill="none" stroke="${DEEL_SH}" stroke-width="0.9" stroke-linecap="round" opacity=".7"/>
      <path d="M105,121 Q112,124 118,132" fill="none" stroke="url(#${I('sheen')})" stroke-width="4" opacity=".8"/>
      <ellipse cx="100" cy="119" rx="14" ry="5" fill="url(#${I('ao')})"/>
      <!-- diagonal overlapping front (closes under the right arm) -->
      <path d="M101,115 Q92,124 70,129 L70,134 Q94,130 104,118 Z" fill="url(#${I('teal')})" stroke="${O}" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M101.5,117.4 Q92,126 70,131.2" fill="none" stroke="${GOLD}" stroke-width="0.8" stroke-dasharray="1.4 1"/>
      <path d="M100,119.6 Q92,127.6 71,133" fill="none" stroke="#0c3d47" stroke-width="0.6" opacity=".5"/>
      ${clouds(72, 131.4, 24, 1.6, '#ffe9a0')}
      <path d="M96,124 q-5,3 -8,4" fill="none" stroke="#000" stroke-width="2.4" opacity=".16" stroke-linecap="round"/>
      <path d="M100,112 Q112,110 121,116" fill="none" stroke="${DEEL_HI}" stroke-width="2" stroke-linecap="round" opacity=".7"/>
    </g>
    <!-- standing collar with key meander -->
    <path d="M86,109 Q100,115 114,109 L115,116.5 Q100,122 85,116.5 Z" fill="url(#${I('teal')})" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
    <g transform="translate(0,0)">${meander(88, 114.6, 24, 3.2, GOLD)}</g>
    <path d="M86.5,110.5 Q100,116.4 113.5,110.5" fill="none" stroke="#9fe3ea" stroke-width="0.6" opacity=".8"/>
    <path d="M86.4,115.6 Q100,121 113.6,115.6" fill="none" stroke="#0c3d47" stroke-width="0.5" stroke-dasharray="1.2 1" opacity=".7"/>
    <path d="M85.6,110 l1.2,6.4 M114.4,110 l-1.2,6.4" stroke="${O}" stroke-width="0.8" opacity=".6"/>
    <!-- knot buttons along the closure -->
    ${knotBtn(101, 118.6, 1.7)}
    ${knotBtn(92, 124, 1.6)}
    ${knotBtn(83.6, 127.6, 1.4)}
    <path d="M100.6,120.6 q-1.6,4 -0.4,7 M91.6,126 q-1,3.4 0.4,5.6" fill="none" stroke="${GOLD}" stroke-width="0.9" stroke-linecap="round"/>
    <path d="M89.6,124.6 l-3,0.6 M98.6,119.4 l-2.6,1" stroke="${GOLD}" stroke-width="1.1" stroke-linecap="round"/>`;
  }

  function vest(I) {
    return `
    <path d="${VEST}" fill="${LEATHER_DK}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>
    <g clip-path="url(#${I('vestClip')})">
      ${lamellar(I, 64, 131, 68, 5, 6.6, 4.6)}
      <rect x="64" y="131" width="68" height="35" fill="url(#${I('grain')})" opacity=".3"/>
      <rect x="64" y="130" width="68" height="7" fill="url(#${I('aoV')})"/>
      <path d="M62,128 Q78,146 74,166 L62,166 Z" fill="#000" opacity=".22"/>
      <path d="M92,132 Q88,148 90,164" fill="none" stroke="url(#${I('sheen')})" stroke-width="5" opacity=".5"/>
      <path d="M118,128 Q126,146 124,166 L132,166 L132,128 Z" fill="#000" opacity=".14"/>
    </g>
    <!-- red leather binding on top edge -->
    <path d="M71,130 Q98,124 125,130" fill="none" stroke="${O}" stroke-width="5"/>
    <path d="M71,130 Q98,124 125,130" fill="none" stroke="url(#${I('red')})" stroke-width="3"/>
    <path d="M72,129.4 Q98,123.4 124,129.4" fill="none" stroke="#ffd0c0" stroke-width="0.6" stroke-dasharray="1.2 1.2"/>
    <path d="M72,131.6 Q98,125.6 124,131.6" fill="none" stroke="#5a0e10" stroke-width="0.7" opacity=".55"/>
    <path d="M90,126 Q98,124.4 106,125.6" fill="none" stroke="#fff" stroke-width="0.9" opacity=".55" stroke-linecap="round"/>
    <!-- shoulder straps -->
    <path d="M78,129 L80,115 L87,113 L86,128" fill="${LEATHER}" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M112,127 L113,113 L120,115 L120,128.6" fill="${LEATHER}" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
    <rect x="79.4" y="119.2" width="6.2" height="4.8" rx="1" fill="url(#${I('gold')})" stroke="${O}" stroke-width="0.9"/>
    <rect x="114" y="119.2" width="6.2" height="4.8" rx="1" fill="url(#${I('gold')})" stroke="${O}" stroke-width="0.9"/>
    <path d="M82.5,120 v2.8 M117.1,120 v2.8" stroke="${O}" stroke-width="0.7"/>
    <circle cx="82.5" cy="121" r="1.1" fill="url(#${I('gold')})" stroke="${O}" stroke-width="0.5"/>
    <circle cx="116.5" cy="121" r="1.1" fill="url(#${I('gold')})" stroke="${O}" stroke-width="0.5"/>
    <path d="M79.6,115 l6,-1.2 M113.6,113.8 l6,1.2" stroke="#000" stroke-width="0.6" opacity=".35"/>
    <path d="M78.8,126 l7,-0.6 M113,126.2 l6.8,0.6" stroke="#f0d3a0" stroke-width="0.5" stroke-dasharray="1 0.8"/>
    <path d="M81,117 L81.8,127 M117.8,117 L118.4,127" stroke="#f0d3a0" stroke-width="0.6" stroke-dasharray="1.2 1"/>
    <!-- side lacing -->
    <path d="M121,133 l3,2 M121,138 l3,2 M121,143 l3,2 M121,148 l3,2" stroke="${LACE}" stroke-width="1.2" stroke-linecap="round"/>`;
  }

  function sash(I) {
    return `
    <path d="M68,157 Q98,163 128,157 L128.6,170 Q98,176 68,170 Z" fill="url(#${I('sash')})" stroke="${O}" stroke-width="2.8" stroke-linejoin="round"/>
    <path d="M68,157 Q98,163 128,157 L128.6,170 Q98,176 68,170 Z" fill="url(#${I('weave')})"/>
    <path d="M70,160.6 Q98,166.4 127,160.6" fill="none" stroke="#c46d12" stroke-width="1"/>
    <path d="M70,164.6 Q98,170.2 127,164.4" fill="none" stroke="#c46d12" stroke-width="1"/>
    <path d="M71,159 Q98,164.5 126,159" fill="none" stroke="#fff4c4" stroke-width="1" opacity=".8"/>
    <path d="M86,160 l-2,10 M104,162 l-1,9 M116,160 l1,10" stroke="#b86010" stroke-width="0.8" opacity=".7"/>
    <path d="M72,158 l4,11 M92,161 l3,10 M124,158 l-4,11 M108,162 l-2,7" stroke="#9a4e08" stroke-width="0.7" opacity=".5" stroke-linecap="round"/>
    <path d="M69,169 Q98,175 128,169" fill="none" stroke="#7a3a08" stroke-width="1.4" opacity=".35"/>
    <!-- leather belt with silver plaques -->
    <path d="M69,163.8 Q98,169.8 127,163.8" fill="none" stroke="${O}" stroke-width="4.6"/>
    <path d="M69,163.8 Q98,169.8 127,163.8" fill="none" stroke="url(#${I('leather')})" stroke-width="2.8"/>
    <path d="M69,163.2 Q98,169.2 127,163.2" fill="none" stroke="#f0d3a0" stroke-width="0.4" stroke-dasharray="1 0.9"/>
    ${[0.12, 0.3, 0.5, 0.7, 0.88].map(function (t, i) {
      var q = qpt([69, 163.8], [98, 169.8], [127, 163.8], t), a = qtan([69, 163.8], [98, 169.8], [127, 163.8], t);
      return '<g transform="translate(' + f(q[0]) + ',' + f(q[1]) + ') rotate(' + f(a) + ')"><rect x="-3" y="-2.6" width="6" height="5.2" rx="1.6" fill="' + SILVER + '" stroke="' + O + '" stroke-width="1"/><path d="M-2,-1.6 H2" stroke="#fff" stroke-width="0.6"/><circle r="1" fill="' + (i % 2 ? TURQ : CORAL) + '" stroke="' + O + '" stroke-width="0.4"/></g>';
    }).join('')}
    <!-- knife in sheath -->
    <g transform="translate(88.6,166) rotate(7)">
      <path d="M-2.4,0 L2.4,0 L1.8,15 L0,18.6 L-1.8,15 Z" fill="url(#${I('leather')})" stroke="${O}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M-1.6,14.6 L1.6,14.6 L0,18 Z" fill="${SILVER}" stroke="${O}" stroke-width="0.6"/>
      <path d="M-1,2 V13" stroke="#f0d3a0" stroke-width="0.5" stroke-dasharray="1 0.8"/>
      <rect x="-3" y="-1.4" width="6" height="2.4" rx="0.8" fill="${SILVER}" stroke="${O}" stroke-width="1"/>
      <rect x="-1.9" y="-8.6" width="3.8" height="7.6" rx="1.4" fill="#f0e2c0" stroke="${O}" stroke-width="1.2"/>
      <path d="M-1.9,-6.4 H1.9 M-1.9,-4.2 H1.9 M-1.9,-2.4 H1.9" stroke="#8a6a3a" stroke-width="0.6"/>
      <circle cy="-8.6" r="1.4" fill="${CORAL}" stroke="${O}" stroke-width="0.8"/>
    </g>
    <!-- silver flint pouch (khet) + coral bead on a chain -->
    <path d="M110,170 Q111,176 108,180" fill="none" stroke="${SILVER}" stroke-width="1" stroke-dasharray="1 0.8"/>
    <path d="M102,180 L114,180 Q115,188 108,190 Q101,188 102,180 Z" fill="${LEATHER_DK}" stroke="${O}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M101.6,179 L114.4,179 L114,183 L102,183 Z" fill="${SILVER}" stroke="${O}" stroke-width="1" stroke-linejoin="round"/>
    <path d="M104,181 h8" stroke="#8a96a4" stroke-width="0.6" stroke-dasharray="0.8 0.8"/>
    <circle cx="108" cy="186" r="1.5" fill="${CORAL}" stroke="${O}" stroke-width="0.6"/>
    <circle cx="107.5" cy="185.4" r="0.5" fill="#fff" opacity=".8"/>
    <path d="M103,184.4 Q108,187 113,184.2" fill="none" stroke="#f0d3a0" stroke-width="0.5" stroke-dasharray="1 0.8"/>
    <path d="M103.2,181 l2,-1 M106.4,181 l2,-1 M109.6,181 l2,-1" stroke="#fff" stroke-width="0.5" opacity=".7"/>
    <path d="M103.6,183.4 Q102,187 105,189.4" fill="none" stroke="#fff" stroke-width="0.6" opacity=".25"/>
    <ellipse cx="108" cy="192" rx="7" ry="2" fill="url(#${I('ao')})"/>
    <!-- sash knot at the back hip -->
    <path d="M78,163 q-8,-6 -10,0 q2,6 10,2 z" fill="url(#${I('sash')})" stroke="${O}" stroke-width="1.6" stroke-linejoin="round"/>
    <ellipse cx="78" cy="164.4" rx="3" ry="3.4" fill="#f5a623" stroke="${O}" stroke-width="1.5"/>
    <path d="M69,163.6 q4,-3 8,-0.6 M70.6,166.6 q4,1 7,-2 M77,162 l1.4,5 M75.8,164.4 h4.4" fill="none" stroke="#9a4e08" stroke-width="0.6" opacity=".8"/>
    <path d="M76.6,162.6 q1.4,-1 2.4,0" fill="none" stroke="#fff4c4" stroke-width="0.7" stroke-linecap="round"/>`;
  }

  function boot(I, x, dark) {
    return `
    <g>
      <path d="M${x + 2},192 L${x + 2},224 Q${x + 2},229 ${x + 7},229 L${x + 27},229 Q${x + 34},229 ${x + 37},222 Q${x + 39},216 ${x + 36},212.5 Q${x + 34},217 ${x + 30},218.6 Q${x + 26},219.6 ${x + 22},217 L${x + 21},192 Z" fill="url(#${I('boot')})" stroke="${O}" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M${x + 2},192 L${x + 2},224 Q${x + 2},229 ${x + 7},229 L${x + 27},229 Q${x + 34},229 ${x + 37},222 Q${x + 39},216 ${x + 36},212.5 Q${x + 34},217 ${x + 30},218.6 Q${x + 26},219.6 ${x + 22},217 L${x + 21},192 Z" fill="url(#${I('felt')})"/>
      <path d="M${x + 2},199 L${x + 21},199 L${x + 21},214 L${x + 2},214 Z" fill="url(#${I('aoV')})"/>
      <path d="M${x + 12},214 Q${x + 22},218 ${x + 34},213.6" fill="none" stroke="#3a1008" stroke-width="0.8" opacity=".5"/>
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
      <path d="M${x + 33},214 Q${x + 35.4},212.6 ${x + 36.6},213.2" stroke="#fff" stroke-width="0.9" fill="none" opacity=".5" stroke-linecap="round"/>
      <path d="M${x + 9},203.4 q1.4,-1.4 3,-0.4 M${x + 8.6},207.4 q2,1.6 4,0.4 M${x + 12.6},210.6 q0.8,1.4 2.4,1.2" fill="none" stroke="#ffe9a0" stroke-width="0.6" opacity=".9" stroke-linecap="round"/>
      <g fill="#4b2c14" opacity=".8"><circle cx="${x + 9}" cy="226" r="1.1"/><circle cx="${x + 12.4}" cy="224.4" r="0.7"/><circle cx="${x + 26}" cy="225.4" r="0.9"/><circle cx="${x + 30}" cy="227" r="0.6"/><circle cx="${x + 5}" cy="221.4" r="0.6"/></g>
      <path d="M${x + 14},226.4 q2,-1 4,0 M${x + 20},227 q3,-1.4 5,-0.2" stroke="#2a1408" stroke-width="0.9" opacity=".5" fill="none" stroke-linecap="round"/>
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

  // dense fur strands + stray hairs along the brim
  function furHair() {
    var p0 = [60, 64], p1 = [101, 39], p2 = [146, 56], dk = '', lt = '', md = '', tips = '';
    for (var i = 0; i < 46; i++) {
      var t = (i + rnd(i * 7)) / 46, p = qpt(p0, p1, p2, t), a = qtan(p0, p1, p2, t) / 57.2958;
      var nx = Math.sin(a), ny = -Math.cos(a), o = (rnd(i * 3 + 1) - 0.5) * 7.6;
      var bx = p[0] - Math.cos(a) * 0 + (-ny) * 0 + nx * o * 0.5 - ny * 0, by = p[1] + ny * o * 0.5;
      var len = 2.6 + rnd(i + 9) * 2.6, k = (rnd(i * 5) - 0.5) * 1.4;
      var d = 'M' + f(bx) + ',' + f(by) + ' q' + f(nx * len * 0.5 + k) + ',' + f(ny * len * 0.5) + ' ' + f(nx * len * 0.2 + k * 2) + ',' + f(ny * len * 0.9 + 0.8) + ' ';
      if (i % 3 === 0) lt += d; else if (i % 3 === 1) dk += d; else md += d;
    }
    for (var j = 0; j < 9; j++) {
      var tt = (j + 0.5) / 9, pp = qpt(p0, p1, p2, tt), aa = qtan(p0, p1, p2, tt) / 57.2958, nx2 = Math.sin(aa), ny2 = -Math.cos(aa);
      var bx2 = pp[0] + nx2 * 5.6, by2 = pp[1] + ny2 * 5.6, l2 = 2.6 + rnd(j + 3) * 1.6, k2 = (rnd(j * 2 + 4) - 0.5) * 3;
      tips += 'M' + f(bx2 - 1.2) + ',' + f(by2 + 0.6) + ' Q' + f(bx2 + nx2 * l2 * 0.4 + k2) + ',' + f(by2 + ny2 * l2 + 0.2) + ' ' + f(bx2 + 1.2) + ',' + f(by2 + 0.6) + ' Z ';
    }
    return '<path d="' + md + '" stroke="#c78a46" stroke-width="0.6" fill="none" stroke-linecap="round"/>' +
      '<path d="' + dk + '" stroke="#8a5326" stroke-width="0.6" fill="none" stroke-linecap="round" opacity=".9"/>' +
      '<path d="' + lt + '" stroke="#fff6dc" stroke-width="0.7" fill="none" stroke-linecap="round"/>';
  }

  function eye(cx, cy, I, far) {
    var rx = far ? 5.8 : 6.6, ry = 8;
    return `
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" stroke="${O}" stroke-width="1.6"/>
      <ellipse cx="${cx + 1.2}" cy="${cy + 0.8}" rx="${rx - 1.4}" ry="${ry - 1.2}" fill="url(#${I('iris')})"/>
      <ellipse cx="${cx + 1.2}" cy="${cy + 0.8}" rx="${rx - 1.4}" ry="${ry - 1.2}" fill="url(#${I('irisR')})"/>
      <ellipse cx="${cx + 1.2}" cy="${cy + 0.8}" rx="${rx - 1.4}" ry="${ry - 1.2}" fill="none" stroke="#2a1206" stroke-width="0.9"/>
      <path d="M${cx - 1.2},${cy - 3} v-1.2 M${cx + 3.6},${cy - 3.4} v-1 M${cx + 5},${cy - 0.4} h1 M${cx - 2},${cy + 3} l-0.6,0.8 M${cx + 4},${cy + 3.6} l0.6,0.8" stroke="#6a3a1c" stroke-width="0.4" opacity=".8"/>
      <ellipse cx="${cx + 1.4}" cy="${cy + 1.2}" rx="2.3" ry="3.3" fill="#0a0503"/>
      <path d="M${cx - 2.4},${cy + 4.8} Q${cx + 1.2},${cy + 7.4} ${cx + rx - 1.4},${cy + 4}" stroke="#e0a060" stroke-width="1" fill="none" opacity=".9"/>
      <circle cx="${cx + 3}" cy="${cy - 2.6}" r="2.3" fill="#fff"/>
      <circle cx="${cx - 1.5}" cy="${cy + 3.4}" r="1.1" fill="#fff"/>
      <circle cx="${cx + 0.4}" cy="${cy - 4.4}" r="0.6" fill="#fff" opacity=".9"/>
      <path d="M${cx - rx - 0.8},${cy - 4.4} Q${cx},${cy - 11.4} ${cx + rx + 0.8},${cy - 4.2}" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M${cx - rx - 0.6},${cy - 9.6} Q${cx},${cy - 14.4} ${cx + rx + 0.4},${cy - 9.2}" stroke="${O}" stroke-width="0.6" fill="none" opacity=".45"/>
      <path d="M${cx - rx + 0.6},${cy + 6.4} Q${cx},${cy + 8.8} ${cx + rx - 0.6},${cy + 6.6}" stroke="${SKIN_DK}" stroke-width="0.7" fill="none" opacity=".8" stroke-linecap="round"/>
      <path d="M${cx + rx - 3.4},${cy - 1} q0.8,-1.6 2,-1.8" stroke="#fff" stroke-width="0.5" fill="none" opacity=".6"/>
      <path d="M${cx - rx - 0.8},${cy - 4.4} l-2.4,-1 M${cx - rx + 0.4},${cy - 6.6} l-2,-1.8" stroke="${O}" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M${cx + rx},${cy - 4.6} l2.8,-2 M${cx + rx - 0.6},${cy - 6.4} l2,-2.6" stroke="${O}" stroke-width="1.4" stroke-linecap="round"/>`;
  }

  function head(I, anim) {
    var eyes = eye(96, 84, I, false) + eye(122, 84, I, true);
    var eg = anim ? `<g class="part-eyes" style="transform-origin: 109px 84px">${eyes}</g>` : `<g>${eyes}</g>`;
    var tassel = tasselG(I);
    var tg = anim ? `<g class="part-cape" style="transform-origin: 103px 13px">${tassel}</g>` : tassel;
    return `
    <!-- wind-blown loose strands -->
    <path d="M62,88 Q54,90 49,82 M62,96 Q54,104 47,101" fill="none" stroke="${O}" stroke-width="1.9" stroke-linecap="round"/>
    <path d="M62,88 Q54,90 49,82 M62,96 Q54,104 47,101" fill="none" stroke="${HAIR}" stroke-width="0.8" stroke-linecap="round"/>
    <!-- back hair mass -->
    <path d="M66,56 Q56,80 64,102 L82,102 Q78,80 84,58 Z" fill="url(#${I('hair')})" stroke="${O}" stroke-width="2.6" stroke-linejoin="round"/>
    <!-- fur ear flap (hanging, behind the ear) -->
    <path d="M58,62 Q52,82 55,102 Q63,108 72,101 Q70,82 75,63 Z" fill="url(#${I('fur')})" stroke="${O}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M61,66 Q57,84 59,99 Q64,102 68,98 Q67,82 71,66 Z" fill="url(#${I('crown')})" stroke="${O}" stroke-width="1.2"/>
    <path d="M63,72 Q61,84 62,95" fill="none" stroke="${GOLD}" stroke-width="0.8" stroke-dasharray="1.3 1"/>
    <path d="M56,70 q-2,3 -1,6 M54.4,80 q-1.6,3 -0.4,6 M56,96 q-2,3 0,5 M60,104 q-1,2 1,3" stroke="#f9e2b0" stroke-width="0.9" fill="none" stroke-linecap="round" opacity=".9"/>
    <path d="M61,66 Q57,84 59,99 Q64,102 68,98 Q67,82 71,66 Z" fill="url(#${I('crown')})" opacity="0"/>
    <path d="M62,68 L70,68 L69.4,86 L61.6,86 Z" fill="url(#${I('quilt')})" opacity=".7"/>
    <path d="M60,76 Q65,73 70,76" fill="none" stroke="${O}" stroke-width="0.5" opacity=".5"/>
    <path d="M58,68 Q54,84 57,101 L60,101 Q57,84 61,68 Z" fill="#7a4a1a" opacity=".3"/>
    <path d="M65,99 q-1,5 0.6,9 M65.6,99.4 l1.6,-0.6" stroke="${O}" stroke-width="1.3" stroke-linecap="round" fill="none"/>
    <circle cx="65.4" cy="109" r="1.5" fill="${CORAL}" stroke="${O}" stroke-width="0.7"/>
    <path d="M55,90 l-2,2 M55,96 l-2,1.6 M57,102 l-1,2.4 M62,105 l0,2.4 M68,103.6 l1,2" stroke="${O}" stroke-width="1.1" stroke-linecap="round"/>
    <!-- face -->
    <path d="M74,60 Q68,100 102,109 Q130,110 137,88 Q141,70 133,58 Z" fill="url(#${I('skin')})" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M78,90 Q84,104 100,108" fill="none" stroke="${SKIN_SH}" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>
    <path d="M76,62 L134,60 L134,72 Q105,76 78,72 Z" fill="url(#${I('aoV')})" opacity=".8"/>
    <path d="M85,101.4 Q98,110 118,106" fill="none" stroke="#fff" stroke-width="1" opacity=".3" stroke-linecap="round"/>
    <path d="M128,100 Q124,106 116,108" fill="none" stroke="${SKIN_SH}" stroke-width="1.6" opacity=".5" stroke-linecap="round"/>

    <!-- ear + coral earring -->
    <path d="M79,79 Q71,75 71,84 Q72,92 80,90" fill="url(#${I('skin')})" stroke="${O}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M77,81 Q74.5,83.5 77,87" fill="none" stroke="${SKIN_DK}" stroke-width="1"/>
    <path d="M77.6,78.4 Q73.4,78 73.2,83 M78,86 Q76,89 78.6,89.4" fill="none" stroke="${SKIN_DK}" stroke-width="0.6" opacity=".8" stroke-linecap="round"/>
    <path d="M78.4,90 Q82,88 82,82" fill="none" stroke="${SKIN_SH}" stroke-width="1.4" opacity=".7" stroke-linecap="round"/>
    <circle cx="72.6" cy="80.6" r="0.9" fill="#fff" opacity=".45"/>
    <path d="M75,91 L75,95" stroke="${SILVER}" stroke-width="1.1"/>
    <circle cx="75" cy="97" r="2.1" fill="${CORAL}" stroke="${O}" stroke-width="0.9"/>
    <circle cx="75" cy="101.6" r="1.4" fill="${TURQ}" stroke="${O}" stroke-width="0.8"/>
    <circle cx="74.4" cy="96.3" r="0.6" fill="#fff" opacity=".8"/>
    <!-- side lock in front of the ear, leading to the braid -->
    <path d="M82,60 Q76,78 80,97 L84,96 Q81,80 86,62 Z" fill="url(#${I('hair')})" stroke="${O}" stroke-width="1.8" stroke-linejoin="round"/>
    <!-- centre-parted fringe -->
    <path d="M80,56 Q82,70 90,70 Q95,66 97,60 Q100,68 108,69 Q116,69 121,62 Q125,68 132,68 Q136,64 136,56 Z" fill="url(#${I('hair')})" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M83,60 Q85,67 90,69 M90,58 Q91,64 95,66 M99,63 Q100,67 103,68 M109,62 Q110,66 114,68 M118,63 Q120,67 123,67 M128,60 Q129,65 134,66" fill="none" stroke="#0a0708" stroke-width="0.5" opacity=".8"/>
    <path d="M78,72 q-4,3 -4,8 M80,76 q-3,5 -1,11" fill="none" stroke="${HAIR_HI}" stroke-width="0.6" opacity=".8" stroke-linecap="round"/>
    <path d="M86,60 Q88,66 92,67 M104,62 Q108,66 114,65 M126,60 Q128,64 132,64" fill="none" stroke="${HAIR_HI}" stroke-width="1.1" stroke-linecap="round"/>
    <!-- freckles -->
    <g fill="#c98460" opacity=".75"><circle cx="90.2" cy="99.2" r=".55"/><circle cx="93.4" cy="100.4" r=".5"/><circle cx="96.2" cy="98.6" r=".5"/><circle cx="87.6" cy="97.6" r=".45"/><circle cx="125.4" cy="97.6" r=".5"/><circle cx="128.2" cy="98.4" r=".45"/><circle cx="122.4" cy="99.2" r=".45"/><circle cx="130.4" cy="96" r=".4"/></g>
    <!-- rosy cheeks -->
    <ellipse cx="92" cy="96" rx="7" ry="4" fill="url(#${I('blush')})"/>
    <ellipse cx="129" cy="94" rx="5.4" ry="3.6" fill="url(#${I('blush')})"/>
    <path d="M89,95.4 l1.6,-1.8 M92.4,95.4 l1.6,-1.8 M127,93.6 l1.3,-1.6 M130,93.6 l1.3,-1.6" stroke="#e3606e" stroke-width="0.8" stroke-linecap="round"/>
    <!-- brows: confident, gently arched -->
    <path d="M88.6,72.6 l-1.4,1.6 M91,70.6 l-1,1.8 M93.6,69 l-0.6,1.8 M96.4,68.2 l0,1.8 M99.4,68.6 l0.6,1.8 M102,70 l1,1.6 M117.6,70.6 l-1,1.8 M120.6,68.4 l-0.6,1.8 M123.6,67.4 l0,1.8 M126.6,67.6 l0.6,1.8 M129.4,68.8 l1,1.6" stroke="${O}" stroke-width="0.6" stroke-linecap="round"/>
    <path d="M88,72 Q95,66.6 103,70.4 L102.4,72.4 Q95,69.4 88.6,73.6 Z" fill="${HAIR}" stroke="${O}" stroke-width="1" stroke-linejoin="round"/>
    <path d="M116,70 Q123,66 130,68.6 L130,70.6 Q123.4,68.6 116.6,72 Z" fill="${HAIR}" stroke="${O}" stroke-width="1" stroke-linejoin="round"/>
    ${eg}
    <!-- nose -->
    <path d="M112.4,84 Q113.6,88 113.4,91.4" fill="none" stroke="${SKIN_SH}" stroke-width="1.2" stroke-linecap="round" opacity=".55"/>
    <path d="M113,92 q2,1.8 -0.4,3" fill="none" stroke="#c9775a" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M110.6,95.4 q1.4,1 3.2,0.2" fill="none" stroke="#c9775a" stroke-width="0.7" stroke-linecap="round" opacity=".8"/>
    <circle cx="114.2" cy="91.4" r="0.7" fill="#fff" opacity=".7"/>
    <!-- friendly open smile -->
    <path d="M104,99.6 Q112,103 120,98.6 Q118.6,106.4 112,106.6 Q106,106.4 104,99.6 Z" fill="#6a1c1c" stroke="${O}" stroke-width="1.9" stroke-linejoin="round"/>
    <path d="M105.2,100.4 Q112,103.2 118.8,99.6 L118.2,101.4 Q112,104.2 105.8,102 Z" fill="#fffaf2"/>
    <path d="M108,105.2 Q112,103.2 116,105 Q112,107 108,105.2 Z" fill="#e5606a"/>
    <path d="M108.4,100.8 v2 M112,101.4 v2 M115.6,101 v2" stroke="#d9cdb8" stroke-width="0.5" opacity=".9"/>
    <path d="M106.6,106.2 Q112,108.6 117.4,105.6" fill="none" stroke="#e48a8a" stroke-width="0.7" stroke-linecap="round" opacity=".8"/>
    <path d="M106,104 Q108,103.4 109.6,104.2" fill="none" stroke="#fff" stroke-width="0.6" opacity=".55" stroke-linecap="round"/>
    <path d="M102.6,98.6 Q103.6,99.8 104.6,99.4 M119.6,98 Q121.4,97.6 122,96.2" stroke="${O}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    <path d="M131,76 Q136,84 133,92" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".4"/>
    <!-- loovuuz crown -->
    <path d="${CROWN}" fill="url(#${I('crown')})" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>
    <g clip-path="url(#${I('crownClip')})">
      <path d="M103,12 Q86,26 80,54 M103,12 Q100,30 100,50 M103,12 Q118,28 122,50" fill="none" stroke="#132448" stroke-width="1.2"/>
      <path d="M103,13 Q87,27 81.6,54 M103,13 Q101.4,30 101.6,50 M103,13 Q119.4,28 123.6,50" fill="none" stroke="${GOLD}" stroke-width="0.8" stroke-dasharray="1.4 1.1"/>
      <rect x="58" y="10" width="90" height="52" fill="url(#${I('quilt')})" opacity=".42"/>
      <path d="M60,60 Q66,32 94,16 L96,20 Q72,36 70,60 Z" fill="#000" opacity=".22"/>
      <path d="M110,16 Q128,28 136,46" fill="none" stroke="#fff" stroke-width="0.8" opacity=".5" stroke-linecap="round"/>
      <path d="M62,46 Q100,30 144,44 L146,54 Q100,44 62,58 Z" fill="url(#${I('aoV')})" opacity=".0"/>
      <path d="M62,50 Q100,36 144,46" fill="none" stroke="#0c1a3a" stroke-width="2.6" opacity=".35"/>
      <path d="M108,20 Q126,30 134,46" fill="none" stroke="#9ab8f0" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>
      <!-- gold brocade band above the fur -->
      <path d="M60,52 Q100,34 146,48 L146,54 Q100,40 60,58 Z" fill="url(#${I('gold')})" stroke="${O}" stroke-width="0.9"/>
    </g>
    <circle cx="114" cy="34" r="7.6" fill="none" stroke="${GOLD}" stroke-width="0.9" stroke-dasharray="1.1 1.1"/>
    ${ulzii(114, 34, 0.9, GOLD, '#8f1717')}
    <circle cx="112.4" cy="30.4" r="0.9" fill="#fff" opacity=".7"/>
    ${tg}
    <!-- fox-fur brim -->
    ${furRoll(I, [60, 64], [101, 39], [146, 56], 20, 6, 5)}
    <path d="M70,52 Q100,38 136,48" fill="none" stroke="#fff3d6" stroke-width="2" stroke-linecap="round" opacity=".55"/>
    ${furHair()}
    <path d="M64,66 Q100,50 144,60" fill="none" stroke="#5a2e10" stroke-width="3" opacity=".22" stroke-linecap="round"/>`;
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
      <path d="M103,13 Q90,19 76,44 M103,13 Q94,20 84,49" fill="none" stroke="#ff9a8a" stroke-width="0.8" stroke-linecap="round" opacity=".9"/>
      <path d="M100,15 Q90,22 79,46 M102,16 Q94,26 87,48 M98,15 Q88,24 76,47" fill="none" stroke="#8f1717" stroke-width="0.5" opacity=".7"/>
      <path d="M73,43.4 l-1,3 M77,47.4 l-1,3 M82.6,49.6 l-0.4,3 M87.6,49.6 l0,3 M92,45.6 l0.6,3" stroke="#d9302c" stroke-width="0.9" stroke-linecap="round"/>
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
    var fib = '', k, q1, q2;
    var seg1 = [[156,99], [160,110], [173,124], [171,146]], seg2 = [[171,146], [173,168], [160,182], [156,193]];
    for (k = 0; k < 15; k++) {
      var tt = 0.06 + k * 0.062;
      q1 = cb(seg1[0], seg1[1], seg1[2], seg1[3], tt);
      fib += 'M' + f(q1[0] + 1) + ',' + f(q1[1] - 1.4) + ' l1.8,1.2 ';
      q2 = cb(seg2[0], seg2[1], seg2[2], seg2[3], tt + 0.02);
      fib += 'M' + f(q2[0] + 1) + ',' + f(q2[1] + 0.2) + ' l1.8,-1.2 ';
    }
    var belly = 'M154.4,99.5 C158.4,110.5 171,124 169,146 C171,168 158.4,181.5 154.4,192.5';
    return `
      <!-- string -->
      <path d="M154.2,79 L154.2,213" stroke="${O}" stroke-width="2.4"/>
      <path d="M154.2,79 L154.2,213" stroke="#f7efd8" stroke-width="1"/>
      <!-- limbs: sinew back, wood core, horn belly -->
      <path d="${limb}" fill="none" stroke="${O}" stroke-width="9.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${limb}" fill="none" stroke="#e3c486" stroke-width="6.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${belly}" fill="none" stroke="#3a2f2a" stroke-width="2.4" stroke-linecap="round"/>
      <path d="${limb}" fill="none" stroke="#c9a55f" stroke-width="1" stroke-linecap="round" stroke-dasharray="0.1 2.2" opacity=".0"/>
      <path d="${fib}" stroke="#a88248" stroke-width="0.6" fill="none" stroke-linecap="round" opacity=".85"/>
      <path d="M160.2,100 C164.4,111 176,124 174.6,146 C176,168 164,181 160.2,192" fill="none" stroke="#a5824a" stroke-width="1.1" opacity=".55" stroke-linecap="round"/>
      <path d="M158.6,98 C162,108 171.4,118 172.4,130" fill="none" stroke="#fff" stroke-width="0.7" opacity=".7" stroke-linecap="round"/>
      <path d="M153.6,102 C156.4,111 168,124 166,146" fill="none" stroke="#000" stroke-width="0.7" opacity=".3" stroke-linecap="round"/>
      <path d="M157.6,101 C162,111 173.6,124 172.4,140 M172.4,152 C173.6,166 162,181 157.6,191" fill="none" stroke="#fff6dc" stroke-width="0.9" stroke-linecap="round" opacity=".9"/>
      <!-- painted bands (lacquer + birch bark) -->
      <path d="M162.6,114 l5.4,-3.4 M165.6,120.4 l5.6,-2.4 M165.6,172 l5.6,2.4 M162.6,178 l5.4,3.4" stroke="${O}" stroke-width="1" opacity="0"/>
      <path d="M163.2,112 l5,-3 M166.6,118 l5,-2 M166.6,174 l5,2 M163.2,180 l5,3" stroke="${O}" stroke-width="3.4" stroke-linecap="butt"/>
      <path d="M163.2,112 l5,-3 M166.6,118 l5,-2 M166.6,174 l5,2 M163.2,180 l5,3" stroke="#c8352c" stroke-width="2" stroke-linecap="butt"/>
      <path d="M165,115 l5,-2.4 M165,177 l5,2.4" stroke="${GOLD}" stroke-width="1.2"/>
      <path d="M164.6,114 l0.4,-2.6 M167.2,119 l0.4,-2.4 M167.4,175 l0.4,2.4 M164.6,180.4 l0.4,2.6" stroke="#fff" stroke-width="0.5" opacity=".6"/>
      <!-- grip wraps (leather + brass) -->
      <path d="M166.6,133 l10.6,0.8 M166.4,136.6 l10.8,0.4 M166.4,158 l10.8,-0.4 M166.6,161.6 l10.6,-0.8" stroke="${O}" stroke-width="2.6"/>
      <path d="M166.6,133 l10.6,0.8 M166.4,158 l10.8,-0.4" stroke="${GOLD}" stroke-width="1.2"/>
      <path d="M166.4,136.6 l10.8,0.4 M166.6,161.6 l10.6,-0.8" stroke="url(#${I('red')})" stroke-width="1.2"/>
      <path d="M167.4,133 l1.4,0.1 M167.4,158 l1.4,0" stroke="#fff" stroke-width="0.5"/>
      <!-- siyah tips (stiff ears) with string bridges -->
      <path d="M156.6,99 L156.6,79 Q157,72 163,69" fill="none" stroke="${O}" stroke-width="6.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M156.6,99 L156.6,79 Q157,72 163,69" fill="none" stroke="#7a4a26" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M156.6,193 L156.6,213 Q157,220 163,223" fill="none" stroke="${O}" stroke-width="6.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M156.6,193 L156.6,213 Q157,220 163,223" fill="none" stroke="#7a4a26" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M157.6,96 L157.6,82 M157.6,196 L157.6,210" stroke="#b07a48" stroke-width="0.9"/>
      <path d="M155.2,90 h3 M155.2,86 h3 M155.2,203 h3 M155.2,207 h3" stroke="#3a2010" stroke-width="0.6" opacity=".7"/>
      <path d="M160.4,73.6 l1.8,0.4 M160.4,218.4 l1.8,-0.4" stroke="#fff" stroke-width="0.6" opacity=".6"/>
      <!-- bone tip caps + inlay -->
      <path d="M159.6,72.4 Q162,68.2 165,68.6 Q166.2,70 164.4,71.6 Q162,73.4 159.6,74.6 Z" fill="#f4ecd4" stroke="${O}" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M159.6,219.6 Q162,223.8 165,223.4 Q166.2,222 164.4,220.4 Q162,218.6 159.6,217.4 Z" fill="#f4ecd4" stroke="${O}" stroke-width="1.3" stroke-linejoin="round"/>
      <circle cx="156.6" cy="88" r="1" fill="${TURQ}" stroke="${O}" stroke-width="0.5"/><circle cx="156.6" cy="204" r="1" fill="${TURQ}" stroke="${O}" stroke-width="0.5"/>
      <circle cx="156.6" cy="93" r="0.8" fill="${CORAL}" stroke="${O}" stroke-width="0.4"/><circle cx="156.6" cy="199" r="0.8" fill="${CORAL}" stroke="${O}" stroke-width="0.4"/>
      <!-- string serving wraps + nocking point -->
      <path d="M154.2,81 v6 M154.2,205 v6" stroke="${O}" stroke-width="3.2"/><path d="M154.2,81 v6 M154.2,205 v6" stroke="#c98e56" stroke-width="1.8"/>
      <path d="M153.4,82.4 l1.6,0.8 M153.4,84.6 l1.6,0.8 M153.4,206.4 l1.6,0.8 M153.4,208.6 l1.6,0.8" stroke="#5e3a1e" stroke-width="0.5"/>
      <path d="M153,129.4 h3.4 v5.6 h-3.4 Z" fill="#c98e56" stroke="${O}" stroke-width="0.9"/><path d="M153.4,131 h2.6 M153.4,133 h2.6" stroke="#5e3a1e" stroke-width="0.4"/>
      ${star(170.4, 118, 3.4, 0.9)}${star(159, 196, 2.2, 0.8)}
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
        <path d="M4.6,-0.6 L18,-0.4" stroke="#000" stroke-width="0.5" opacity=".35"/>
        <path d="M5,-3.6 L8,-0.6 M9.6,-4.4 L12,-0.6 M14,-4 L16,-0.6 M5.6,3.4 L8,0.6 M10,4 L12,0.6 M14.4,3.6 L16.4,0.6" stroke="#3b2b22" stroke-width="0.7" opacity=".8"/>
        <path d="M22,-1.2 V1.2 M25,-1.2 V1.2 M36,-1.2 V1.2" stroke="${CORAL}" stroke-width="1.2"/>
        <path d="M6,-4.6 L16.6,-3.9" stroke="#fff" stroke-width="0.6" opacity=".8"/>
        <!-- leaf-shaped arrowhead -->
        <path d="M38,-1.6 L40,-3.6 Q46,-2 48,0 Q46,2 40,3.6 L38,1.6 Z" fill="url(#${I('steel')})" stroke="${O}" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M39.6,-0.8 L46,-0.2" stroke="#fff" stroke-width="0.8" stroke-linecap="round"/>
        <path d="M40,1.6 L45,0.6" stroke="#7d8b99" stroke-width="0.6"/>
        <path d="M37.6,-1.4 v2.8" stroke="#3b2b22" stroke-width="1"/>
        ${star(43, -3.4, 2.6, 0.95)}
      </g>`;
  }

  function weaponArm(I) {
    return `
      ${bow(I)}
      <!-- deel sleeve: shoulder -> elbow -> wrist -->
      <path d="M120,122 Q128,142 146,148" stroke="${O}" stroke-width="18.5" stroke-linecap="round" fill="none"/>
      <path d="M120,122 Q128,142 146,148" stroke="${DEEL}" stroke-width="13.5" stroke-linecap="round" fill="none"/>
      <path d="M120,122 Q128,142 146,148" stroke="url(#${I('damask')})" stroke-width="13.5" stroke-linecap="round" fill="none"/>
      <path d="M120,122 Q128,142 146,148" stroke="url(#${I('twill')})" stroke-width="13.5" stroke-linecap="round" fill="none"/>
      <path d="M124,124 Q130,138 142,143" stroke="${DEEL_HI}" stroke-width="3" stroke-linecap="round" fill="none" opacity=".8"/>
      <path d="M126,127 q2,6 6,8 M133,138 q4,2 8,2" fill="none" stroke="${DEEL_SH}" stroke-width="0.8" stroke-linecap="round" opacity=".7"/>
      <path d="M125,128 Q131,141 143,146" stroke="#fff" stroke-width="0.7" stroke-linecap="round" fill="none" opacity=".45"/>
      <ellipse cx="128" cy="126" rx="7" ry="3" fill="#000" opacity=".16" transform="rotate(50 128 126)"/>
      <path d="M121,132 Q128,148 142,152" stroke="${DEEL_SH}" stroke-width="3" stroke-linecap="round" fill="none" opacity=".8"/>
      <!-- teal shoulder seam trim -->
      <path d="M113,118 Q121,112 128,120" fill="none" stroke="${O}" stroke-width="4.4" stroke-linecap="round"/>
      <path d="M113,118 Q121,112 128,120" fill="none" stroke="${TEAL}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M114,117.4 Q121,111.6 127,118.6" fill="none" stroke="${GOLD}" stroke-width="0.6" stroke-dasharray="1.2 1"/>
      <!-- horse-hoof cuff (turuu) -->
      <g transform="translate(146,149) rotate(20)">
        <path d="M-4,-9 Q3,-9 4,-8 L4,8 Q-2,9 -4,8 Z" fill="url(#${I('teal')})" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M-1.6,-7.6 L-1.4,7.4" stroke="${GOLD}" stroke-width="0.8" stroke-dasharray="1.2 1"/>
        <path d="M1.4,-6 L1.4,6" stroke="#0c3d47" stroke-width="0.6" opacity=".6"/>
        <path d="M-3,-7 Q-2,-5 -3,-3" stroke="#9fe3ea" stroke-width="0.6" fill="none" opacity=".8"/>
      </g>
      <!-- leather bracer on the bow arm -->
      <g transform="translate(157,151.4) rotate(12)">
        <path d="M-7,-6.2 L7,-5.4 Q8.6,0 7,5.4 L-7,6.2 Q-8.4,0 -7,-6.2 Z" fill="url(#${I('leather')})" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M-5.6,-4.4 L5.8,-3.8 M-5.6,4.4 L5.8,3.8" stroke="#f0d3a0" stroke-width="0.6" stroke-dasharray="1.2 0.9"/>
        <path d="M-2,-5.8 L-2,5.8 M2.4,-5.6 L2.4,5.6" stroke="${O}" stroke-width="1.6"/>
        <path d="M-2,-5.8 L-2,5.8 M2.4,-5.6 L2.4,5.6" stroke="${LACE}" stroke-width="0.8"/>
        <path d="M-7,-6.2 L7,-5.4 Q8.6,0 7,5.4 L-7,6.2 Q-8.4,0 -7,-6.2 Z" fill="url(#${I('grain')})" opacity=".45"/>
        <path d="M-5,-2 L-3.4,-2 M-5,2 L-3.4,2 M4,-2 L5.6,-2 M4,2 L5.6,2" stroke="#3c2210" stroke-width="0.6"/>
        <circle cx="0.2" cy="0" r="1.5" fill="url(#${I('gold')})" stroke="${O}" stroke-width="0.6"/>
        <circle cx="-5.6" cy="0" r="0.7" fill="${SILVER}" stroke="${O}" stroke-width="0.3"/><circle cx="5.8" cy="0" r="0.7" fill="${SILVER}" stroke="${O}" stroke-width="0.3"/>
        <path d="M-6,-5 L6,-4.4" stroke="#fff" stroke-width="0.7" opacity=".45"/>
      </g>
      <!-- bow hand gripping the handle -->
      <path d="M163,142 Q171,138.6 177,142.6 Q179.4,149 176,155 Q169,158 163.4,154.4 Q160.6,148 163,142 Z" fill="url(#${I('skin')})" stroke="${O}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M170.4,142 Q173,146 170.8,150 M166.8,143 Q169.4,147 167.2,151.4" fill="none" stroke="${SKIN_DK}" stroke-width="1" stroke-linecap="round"/>
      <path d="M163.6,146.4 Q168,146.6 172,144.2" fill="none" stroke="${O}" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M164,149.6 Q168,150.4 172.6,148.6 M165,152.4 Q168.4,153.2 172,151.8" fill="none" stroke="${SKIN_DK}" stroke-width="0.7" stroke-linecap="round"/>
      <path d="M164.6,143.6 Q168,141.6 173,142.6" fill="none" stroke="#fff" stroke-width="0.9" opacity=".6" stroke-linecap="round"/>
      <path d="M175.4,144.4 q1.2,0.4 1.4,1.6 M175.8,148 q1.2,0.4 1.2,1.6" fill="none" stroke="#e8a080" stroke-width="0.7" stroke-linecap="round"/>
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

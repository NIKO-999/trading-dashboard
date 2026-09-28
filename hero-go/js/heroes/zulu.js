/* Hero Go! — Themba, The Zulu Warrior (key: zulu)
 * Hand-authored inline SVG. Chibi, facing right. See ART_CONTRACT.md.
 * Inspired by the regalia of the amaZulu: umqhele leopard-skin headband with
 * ostrich and blue-crane plumes, amashoba cow-tail ruffs, isinene / ibheshu
 * hide loin covering, beadwork (ubuhlalu), the isihlangu cowhide shield,
 * the iklwa short stabbing spear and an iwisa (knobkerrie) at the belt.
 */
(function () {
  'use strict';

  var O = '#2b1d14';                                    // outline
  var SKIN = '#7a4a2e', SKIN_SH = '#5a331e', SKIN_HI = '#a06a45', SKIN_DK = '#3f2212', SKIN_GL = '#c48a5e';
  var BW = '#f7f4ec', BR = '#d8342c', BB = '#2f6fd0', BG = '#2f9e4f', BY = '#f2c230', BK = '#1d1714';
  var FUR = '#e8b04a', FUR_S = '#c4832a', SPOT = '#2e1c10', SPOT_C = '#b8691c';
  var HAIR_W = '#f8f5ee', HAIR_S = '#cfc6b5';

  function f(n) { return +(+n).toFixed(2); }
  function rnd(i) { var x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }

  /* ---------- helpers ---------- */

  // leopard rosette: warm centre + ring of broken dark blobs
  function rosette(x, y, r, seed) {
    var s = '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(r * 0.6) + '" ry="' + f(r * 0.48) + '" fill="' + SPOT_C + '"/>';
    var n = 4 + (seed % 2), rot = rnd(seed) * 6.28;
    for (var i = 0; i < n; i++) {
      var a = rot + i * 6.283 / n + rnd(seed + i) * 0.3;
      var cx = x + Math.cos(a) * r, cy = y + Math.sin(a) * r * 0.82;
      s += '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(r * 0.46) + '" ry="' + f(r * 0.24) +
        '" transform="rotate(' + f(a * 57.3 + 90) + ' ' + f(cx) + ' ' + f(cy) + ')" fill="' + SPOT + '"/>';
    }
    return s;
  }

  // white fluffy cow-tail ruff (ishoba). Local frame: band along x (-w/2..w/2) at y=0, hair hangs to +y.
  function ruff(x, y, ang, w, len, n, seed) {
    var tips = [], i;
    for (i = 0; i <= n; i++) {
      var t = i / n, xx = -w / 2 + w * t;
      var mid = 1 - Math.pow(2 * t - 1, 2);
      tips.push([xx * 1.18 + (rnd(seed + i) - 0.5) * 1.6, len * (0.62 + 0.38 * mid) + rnd(seed + i * 3) * len * 0.18]);
    }
    var d = 'M' + f(-w / 2) + ' -1 Q' + f(-w / 2 - 2.5) + ' ' + f(len * 0.3) + ' ' + f(tips[0][0]) + ' ' + f(tips[0][1]);
    for (i = 1; i < tips.length; i++) {
      var p = tips[i - 1], q = tips[i];
      d += ' Q' + f((p[0] + q[0]) / 2) + ' ' + f(Math.min(p[1], q[1]) - len * 0.28) + ' ' + f(q[0]) + ' ' + f(q[1]);
    }
    d += ' Q' + f(w / 2 + 2.5) + ' ' + f(len * 0.3) + ' ' + f(w / 2) + ' -1 Q0 -3.4 ' + f(-w / 2) + ' -1Z';
    var s = '<g transform="translate(' + f(x) + ' ' + f(y) + ') rotate(' + f(ang) + ')">';
    s += '<path d="' + d + '" fill="' + HAIR_W + '" stroke="' + O + '" stroke-width="2.2" stroke-linejoin="round"/>';
    // cel shade on the rear half + underside
    var sh = '';
    for (i = 0; i < tips.length; i++) {
      var tp = tips[i];
      sh += 'M' + f(tp[0] * 0.55) + ' ' + f(len * 0.25) + ' Q' + f(tp[0] * 0.95) + ' ' + f(tp[1] * 0.7) + ' ' + f(tp[0]) + ' ' + f(tp[1] - 0.8);
    }
    s += '<path d="' + sh + '" stroke="' + HAIR_S + '" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".75"/>';
    // individual hair strokes
    var hs = '';
    for (i = 0; i < n * 3; i++) {
      var tt = (i + 0.5) / (n * 3), bx = -w / 2 + w * tt, ex = bx * 1.15 + (rnd(seed + i * 7) - 0.5) * 2;
      var ey = len * (0.35 + 0.45 * (1 - Math.pow(2 * tt - 1, 2))) + rnd(seed + i) * len * 0.15;
      hs += 'M' + f(bx) + ' 1.2 Q' + f(bx + (ex - bx) * 0.3 + (i % 2 ? 0.8 : -0.8)) + ' ' + f(ey * 0.5) + ' ' + f(ex) + ' ' + f(ey);
    }
    s += '<path d="' + hs + '" stroke="#a89f90" stroke-width="0.55" fill="none" stroke-linecap="round" opacity=".85"/>';
    s += '<path d="M' + f(-w * 0.3) + ' 2 Q' + f(-w * 0.1) + ' ' + f(len * 0.4) + ' ' + f(-w * 0.2) + ' ' + f(len * 0.6) + '" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round"/>';
    // hide thong + beads binding the tuft
    s += '<path d="M' + f(-w / 2 - 0.5) + ' -0.6 Q0 2.6 ' + f(w / 2 + 0.5) + ' -0.6" stroke="' + O + '" stroke-width="4.2" fill="none" stroke-linecap="round"/>';
    s += '<path d="M' + f(-w / 2 - 0.5) + ' -0.6 Q0 2.6 ' + f(w / 2 + 0.5) + ' -0.6" stroke="#7b4a26" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    var bc = [BR, BW, BB, BW, BY, BW, BG];
    for (i = 0; i < 5; i++) {
      var bt = (i + 0.5) / 5, bxx = -w / 2 + w * bt, byy = -0.6 + 3.2 * 4 * bt * (1 - bt) * 0.5;
      s += '<circle cx="' + f(bxx) + '" cy="' + f(byy) + '" r="0.95" fill="' + bc[(i + seed) % bc.length] + '" stroke="' + O + '" stroke-width="0.4"/>';
    }
    s += '</g>';
    return s;
  }

  // row of beads along a quadratic curve
  function beadCurve(x1, y1, cx, cy, x2, y2, n, r, cols) {
    var s = '<path d="M' + x1 + ' ' + y1 + 'Q' + cx + ' ' + cy + ' ' + x2 + ' ' + y2 + '" stroke="' + O + '" stroke-width="' + f(r * 2 + 1.4) + '" fill="none" stroke-linecap="round"/>';
    for (var i = 0; i < n; i++) {
      var t = i / (n - 1);
      var x = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
      var y = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
      s += '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + r + '" fill="' + cols[i % cols.length] + '"/>' +
        '<circle cx="' + f(x + r * 0.3) + '" cy="' + f(y - r * 0.35) + '" r="' + f(r * 0.32) + '" fill="#fff" opacity=".7"/>';
    }
    return s;
  }

  // feather pointing "up" in local space, rotated by ang (deg, 0 = up)
  function craneFeather(x, y, ang, len, w, P) {
    var id = function (n) { return 'zulu-' + n + P; };
    var body = 'M0 0 C' + f(w) + ' ' + f(-len * 0.2) + ' ' + f(w * 1.1) + ' ' + f(-len * 0.7) + ' ' + f(w * 0.2) + ' ' + f(-len) +
      ' C' + f(-w * 0.6) + ' ' + f(-len * 0.8) + ' ' + f(-w) + ' ' + f(-len * 0.3) + ' 0 0Z';
    var tip = 'M' + f(w * 1.02) + ' ' + f(-len * 0.72) + ' C' + f(w * 0.9) + ' ' + f(-len * 0.88) + ' ' + f(w * 0.5) + ' ' + f(-len * 0.97) + ' ' + f(w * 0.2) + ' ' + f(-len) +
      ' C' + f(-w * 0.5) + ' ' + f(-len * 0.86) + ' ' + f(-w * 0.8) + ' ' + f(-len * 0.72) + ' ' + f(-w * 0.86) + ' ' + f(-len * 0.62) + ' Q0 ' + f(-len * 0.62) + ' ' + f(w * 1.02) + ' ' + f(-len * 0.72) + 'Z';
    var barbs = '';
    for (var i = 1; i <= 7; i++) {
      var yy = -len * (0.1 + i * 0.1);
      barbs += 'M0.2 ' + f(yy) + 'L' + f(w * 0.8) + ' ' + f(yy - len * 0.05) + 'M0 ' + f(yy + len * 0.03) + 'L' + f(-w * 0.75) + ' ' + f(yy - len * 0.02);
    }
    return '<g transform="translate(' + f(x) + ' ' + f(y) + ') rotate(' + f(ang) + ')">' +
      '<path d="' + body + '" fill="url(#' + id('crane') + ')" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<path d="' + tip + '" fill="#2d3644"/>' +
      '<path d="' + barbs + '" stroke="#3f5168" stroke-width="0.5" opacity=".7"/>' +
      '<path d="M0 -1 Q' + f(w * 0.25) + ' ' + f(-len * 0.5) + ' ' + f(w * 0.2) + ' ' + f(-len * 0.97) + '" stroke="#e8eef5" stroke-width="0.8" fill="none"/>' +
      '<path d="M' + f(w * 0.5) + ' ' + f(-len * 0.2) + ' Q' + f(w * 0.75) + ' ' + f(-len * 0.4) + ' ' + f(w * 0.6) + ' ' + f(-len * 0.55) + '" stroke="#dfe8f2" stroke-width="1" fill="none" stroke-linecap="round" opacity=".8"/>' +
      '</g>';
  }

  // fluffy ostrich plume: soft scalloped blob around a curved rachis. Local: base at 0,0, grows to (0,-len)
  function ostrich(x, y, ang, len, w, col, sh, hi, seed) {
    var n = 7, L = '', R = '', i;
    for (i = 0; i <= n; i++) {
      var t = i / n, yy = -len * t, bend = Math.sin(t * 2.2) * w * 0.5;
      var ww = w * Math.sin(Math.PI * (0.12 + 0.8 * t)) * (0.9 + rnd(seed + i) * 0.25);
      R += (i ? ' Q' + f(bend + ww + 2.6) + ' ' + f(yy + len / n * 0.5) + ' ' : 'M') + f(bend + ww) + ' ' + f(yy);
      L = ' Q' + f(bend - ww - 2.6) + ' ' + f(yy + len / n * 0.5) + ' ' + f(bend - ww) + ' ' + f(yy) + L;
    }
    var tipX = Math.sin(2.2) * w * 0.5;
    var d = R + ' Q' + f(tipX + 2) + ' ' + f(-len - 5) + ' ' + f(tipX - 2) + ' ' + f(-len - 2) + ' L' + f(tipX - w * 0.2) + ' ' + f(-len) + L.replace(/^ Q/, ' Q') + ' Z';
    var rach = 'M0 0';
    for (i = 1; i <= 10; i++) { var t2 = i / 10; rach += ' L' + f(Math.sin(t2 * 2.2) * w * 0.5) + ' ' + f(-len * t2); }
    var barbs = '';
    for (i = 1; i < 12; i++) {
      var t3 = i / 12, by = -len * t3, bx = Math.sin(t3 * 2.2) * w * 0.5, bw = w * Math.sin(Math.PI * (0.12 + 0.8 * t3)) * 0.85;
      barbs += 'M' + f(bx) + ' ' + f(by) + ' q' + f(bw * 0.4) + ' ' + f(-2.6) + ' ' + f(bw * 0.9) + ' ' + f(0.4) + ' q' + f(bw * 0.15) + ' ' + f(1) + ' ' + f(-0.2) + ' ' + f(1.8) +
        'M' + f(bx) + ' ' + f(by) + ' q' + f(-bw * 0.4) + ' ' + f(-2.6) + ' ' + f(-bw * 0.9) + ' ' + f(0.4) + ' q' + f(-bw * 0.15) + ' ' + f(1) + ' ' + f(0.2) + ' ' + f(1.8);
    }
    return '<g transform="translate(' + f(x) + ' ' + f(y) + ') rotate(' + f(ang) + ')">' +
      '<path d="' + d + '" fill="' + col + '" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<path d="' + barbs + '" stroke="' + sh + '" stroke-width="0.8" fill="none" stroke-linecap="round"/>' +
      '<path d="' + rach + '" stroke="' + hi + '" stroke-width="0.9" fill="none" stroke-linecap="round"/>' +
      '</g>';
  }

  // bare foot, heel at x, toes pointing right
  function foot(x, fill, sh, hi) {
    var y = 219;
    var s = '<path d="M' + x + ' ' + (y + 5) + 'Q' + x + ' ' + (y + 11) + ' ' + (x + 6) + ' ' + (y + 11) +
      'L' + (x + 23) + ' ' + (y + 11) + 'Q' + (x + 29) + ' ' + (y + 11) + ' ' + (x + 28.5) + ' ' + (y + 6.5) +
      'Q' + (x + 27.5) + ' ' + (y + 2) + ' ' + (x + 20) + ' ' + (y + 1) + 'L' + (x + 6) + ' ' + y +
      'Q' + x + ' ' + y + ' ' + x + ' ' + (y + 5) + 'Z" fill="' + fill + '" stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round"/>';
    s += '<path d="M' + (x + 2) + ' ' + (y + 8.5) + 'Q' + (x + 14) + ' ' + (y + 10.6) + ' ' + (x + 26) + ' ' + (y + 9) +
      'L' + (x + 25) + ' ' + (y + 10) + 'Q' + (x + 14) + ' ' + (y + 11.5) + ' ' + (x + 4) + ' ' + (y + 10) + 'Z" fill="' + sh + '"/>';
    s += '<path d="M' + (x + 18.5) + ' ' + (y + 5.5) + 'L' + (x + 18.5) + ' ' + (y + 10) +
      'M' + (x + 21.5) + ' ' + (y + 4.8) + 'L' + (x + 21.8) + ' ' + (y + 10) +
      'M' + (x + 24.3) + ' ' + (y + 4.8) + 'L' + (x + 24.8) + ' ' + (y + 9.8) +
      '" stroke="' + O + '" stroke-width="0.9" stroke-linecap="round"/>';
    s += '<ellipse cx="' + (x + 26.6) + '" cy="' + (y + 5.2) + '" rx="1.3" ry="0.9" fill="#d9a987" opacity=".9"/>' +
      '<ellipse cx="' + (x + 23.2) + '" cy="' + (y + 4.1) + '" rx="1" ry="0.7" fill="#d9a987" opacity=".85"/>' +
      '<ellipse cx="' + (x + 20.2) + '" cy="' + (y + 3.6) + '" rx="0.9" ry="0.6" fill="#d9a987" opacity=".8"/>';
    s += '<path d="M' + (x + 8) + ' ' + (y + 3.4) + 'Q' + (x + 14) + ' ' + (y + 2.2) + ' ' + (x + 19) + ' ' + (y + 3) +
      '" stroke="' + hi + '" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".85"/>';
    return s;
  }

  // ankle bead anklet
  function anklet(cx, y, w) {
    var s = '<path d="M' + f(cx - w / 2) + ' ' + y + 'Q' + cx + ' ' + f(y + 3) + ' ' + f(cx + w / 2) + ' ' + y + '" stroke="' + O + '" stroke-width="4.6" fill="none" stroke-linecap="round"/>';
    var cols = [BW, BR, BW, BB, BW, BY, BW, BG];
    for (var i = 0; i < 8; i++) {
      var t = (i + 0.5) / 8, x = cx - w / 2 + w * t, yy = y + 3 * 4 * t * (1 - t) * 0.5;
      s += '<circle cx="' + f(x) + '" cy="' + f(yy) + '" r="1.25" fill="' + cols[i] + '"/>';
    }
    return s;
  }

  /* ---------- defs ---------- */
  function defs(P) {
    var id = function (n) { return 'zulu-' + n + P; };
    return '<defs>' +
      '<radialGradient id="' + id('skin') + '" cx="0.64" cy="0.3" r="0.8">' +
      '<stop offset="0" stop-color="' + SKIN_HI + '"/><stop offset=".55" stop-color="' + SKIN + '"/><stop offset="1" stop-color="' + SKIN_SH + '"/></radialGradient>' +
      '<radialGradient id="' + id('face') + '" cx="0.66" cy="0.45" r="0.72">' +
      '<stop offset="0" stop-color="#a26b44"/><stop offset=".6" stop-color="' + SKIN + '"/><stop offset="1" stop-color="' + SKIN_SH + '"/></radialGradient>' +
      '<linearGradient id="' + id('wood') + '" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="#4a2913"/><stop offset=".4" stop-color="#8a5227"/><stop offset=".6" stop-color="#a8683a"/><stop offset="1" stop-color="#5a3117"/></linearGradient>' +
      '<linearGradient id="' + id('steel') + '" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="#eef3f7"/><stop offset=".48" stop-color="#c3ccd4"/><stop offset=".52" stop-color="#8d98a3"/><stop offset="1" stop-color="#5d6873"/></linearGradient>' +
      '<linearGradient id="' + id('fur') + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#f6cf72"/><stop offset=".55" stop-color="' + FUR + '"/><stop offset="1" stop-color="' + FUR_S + '"/></linearGradient>' +
      '<linearGradient id="' + id('crane') + '" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="#b9c9da"/><stop offset=".6" stop-color="#8aa0b8"/><stop offset="1" stop-color="#607891"/></linearGradient>' +
      '<linearGradient id="' + id('hair') + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#2f2522"/><stop offset="1" stop-color="#140d0b"/></linearGradient>' +
      '<linearGradient id="' + id('hide') + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#9a6536"/><stop offset="1" stop-color="#5e3718"/></linearGradient>' +
      '<radialGradient id="' + id('cow') + '" cx="0.62" cy="0.32" r="0.8">' +
      '<stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#f3eee2"/><stop offset="1" stop-color="#d6ccb8"/></radialGradient>' +
      '<linearGradient id="' + id('iris') + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#140a06"/><stop offset=".6" stop-color="#4a2612"/><stop offset="1" stop-color="#9a5a24"/></linearGradient>' +
      '<linearGradient id="' + id('pbg') + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#f7d977"/><stop offset=".55" stop-color="#c9a227"/><stop offset="1" stop-color="#8a6512"/></linearGradient>' +
      '<clipPath id="' + id('torso') + '"><path d="M74 112 Q97 103 122 111 Q130 132 126 160 L69 160 Q65 132 74 112Z"/></clipPath>' +
      '<clipPath id="' + id('band') + '"><path d="' + BAND + '"/></clipPath>' +
      '<clipPath id="' + id('shield') + '"><ellipse cx="0" cy="0" rx="27" ry="52"/></clipPath>' +
      '<clipPath id="' + id('ibheshu') + '"><path d="' + IBHESHU + '"/></clipPath>' +
      '<clipPath id="' + id('pclip') + '"><rect x="0" y="0" width="120" height="120" rx="14"/></clipPath>' +
      '</defs>';
  }

  var BAND = 'M57 67 Q56 38 100 35 Q136 35 144 50 Q147 57 143 63 Q134 51 100 51 Q72 52 64 79 Q57 77 57 67Z';
  var IBHESHU = 'M66 158 Q62 182 57 208 Q72 214 90 208 Q88 186 88 162Z';

  /* ---------- body pieces (all in 200x240 hero space) ---------- */

  function ibheshu(P) {
    var id = function (n) { return 'zulu-' + n + P; };
    // calfskin back flap (behind the rear hip)
    var s = '<path d="' + IBHESHU + '" fill="url(#' + id('hide') + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<g clip-path="url(#' + id('ibheshu') + ')">';
    s += '<path d="M70 170 Q78 164 86 172 Q84 182 76 180 Q68 180 70 170Z M62 196 Q70 190 78 198 Q74 206 66 206 Q60 202 62 196Z" fill="#f1e8d6"/>';
    s += '<path d="M56 160 Q66 186 62 212 L54 212Z" fill="#3f2410" opacity=".5"/>';
    s += '<path d="M70 164 l-1 6 M74 166 l-1 7 M80 186 l-1 7 M84 190 l0 6 M72 186 l-1 6 M66 200 l-1 5" stroke="#3f2410" stroke-width="0.7" opacity=".7"/>';
    s += '</g>';
    // fringed bottom edge
    s += '<path d="M60 208 l-1 4 M64 210 l-0.6 4 M68 211 l-0.3 4 M72 211 l0 4.2 M76 211 l0.2 4 M80 210.6 l0.4 4 M84 210 l0.6 3.8 M88 209 l0.8 3.6" stroke="' + O + '" stroke-width="2.6" stroke-linecap="round"/>';
    s += '<path d="M60 208 l-1 4 M64 210 l-0.6 4 M68 211 l-0.3 4 M72 211 l0 4.2 M76 211 l0.2 4 M80 210.6 l0.4 4 M84 210 l0.6 3.8 M88 209 l0.8 3.6" stroke="#8a5a32" stroke-width="1.2" stroke-linecap="round"/>';
    return s;
  }

  function shieldArmBack() {
    // rear (left) arm reaching forward to grip the shield from behind
    var s = '';
    s += '<path d="M79 118 Q70 130 68 146" stroke="' + O + '" stroke-width="17" stroke-linecap="round" fill="none"/>';
    s += '<path d="M79 118 Q70 130 68 146" stroke="' + SKIN_SH + '" stroke-width="12" stroke-linecap="round" fill="none"/>';
    s += '<path d="M76 123 Q71 132 70 142" stroke="' + SKIN + '" stroke-width="3.6" stroke-linecap="round" fill="none" opacity=".7"/>';
    return s;
  }

  function torso(P) {
    var id = function (n) { return 'zulu-' + n + P; };
    var s = '';
    // neck
    s += '<path d="M88 98 L88 114 Q98 119 110 114 L110 98 Z" fill="' + SKIN_SH + '" stroke="' + O + '" stroke-width="3"/>';
    s += '<path d="M89 106 Q99 112 109 106 L109 99 L89 99Z" fill="' + SKIN_DK + '" opacity=".55"/>';
    // torso
    s += '<path d="M74 112 Q97 103 122 111 Q130 132 126 160 L69 160 Q65 132 74 112Z" fill="url(#' + id('skin') + ')" stroke="' + O + '" stroke-width="3.2" stroke-linejoin="round"/>';
    s += '<g clip-path="url(#' + id('torso') + ')">';
    s += '<path d="M64 110 Q80 130 76 162 L60 162Z" fill="' + SKIN_SH + '" opacity=".85"/>';
    s += '<path d="M118 112 Q128 132 124 162 L132 162 L132 110Z" fill="' + SKIN_SH + '" opacity=".35"/>';
    // pecs + abs
    s += '<path d="M80 134 Q90 141 99 135 M100 135 Q110 142 121 133" stroke="' + SKIN_DK + '" stroke-width="1.7" fill="none" stroke-linecap="round"/>';
    s += '<path d="M99 124 L99 158 M92 144 Q95 145.5 98 144 M101 144 Q104 145.5 107 144 M92 151 Q95 152.5 98 151 M101 151 Q104 152.5 107 151" stroke="' + SKIN_DK + '" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".8"/>';
    s += '<path d="M104 118 Q114 116 119 124" stroke="' + SKIN_GL + '" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>';
    s += '<path d="M106 138 Q112 139 116 136" stroke="' + SKIN_GL + '" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".55"/>';
    s += '<path d="M101.5 145.5 Q103.5 146.5 105.5 145.8 M101.5 152.5 Q103.5 153.5 105.5 152.8" stroke="' + SKIN_GL + '" stroke-width="1" fill="none" stroke-linecap="round" opacity=".5"/>';
    s += '</g>';
    s += '<path d="M98 155 Q99.5 157 101 155" stroke="' + SKIN_DK + '" stroke-width="1.1" fill="none" stroke-linecap="round"/>';
    return s;
  }

  // diagonal beaded chest band (from rear shoulder to front hip) with triangle/diamond motifs
  function chestBand() {
    var x0 = 80, y0 = 112, x1 = 125, y1 = 155;
    var L = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0)), ang = Math.atan2(y1 - y0, x1 - x0) * 57.2958;
    var s = '<g transform="translate(' + x0 + ' ' + y0 + ') rotate(' + f(ang) + ')">';
    s += '<rect x="0" y="-5" width="' + f(L) + '" height="10" rx="2" fill="' + BW + '" stroke="' + O + '" stroke-width="2.4"/>';
    // black bead borders
    s += '<path d="M1 -3.4 L' + f(L - 1) + ' -3.4 M1 3.4 L' + f(L - 1) + ' 3.4" stroke="' + BK + '" stroke-width="1.3" stroke-dasharray="1.2 0.5"/>';
    var cols = [BR, BB, BG, BY];
    var tri = {}, k;
    for (k = 0; k < 4; k++) tri[cols[k]] = '';
    var dia = '';
    for (var x = 3, i = 0; x < L - 6; x += 7, i++) {
      var c1 = cols[i % 4], c2 = cols[(i + 2) % 4];
      tri[c1] += 'M' + f(x) + ' -2.6 L' + f(x + 6) + ' -2.6 L' + f(x + 3) + ' 0.2Z';
      tri[c2] += 'M' + f(x) + ' 2.6 L' + f(x + 6) + ' 2.6 L' + f(x + 3) + ' -0.2Z';
      dia += 'M' + f(x + 6.5) + ' -1.5 L' + f(x + 7.6) + ' 0 L' + f(x + 6.5) + ' 1.5 L' + f(x + 5.4) + ' 0Z';
    }
    for (k = 0; k < 4; k++) s += '<path d="' + tri[cols[k]] + '" fill="' + cols[k] + '"/>';
    s += '<path d="' + dia + '" fill="' + BK + '"/>';
    // bead texture
    var bt = '';
    for (var y = -2.2; y <= 2.4; y += 1.5) bt += 'M1 ' + f(y) + ' L' + f(L - 1) + ' ' + f(y);
    s += '<path d="' + bt + '" stroke="#fff" stroke-width="0.35" stroke-dasharray="0.4 0.9" opacity=".6"/>';
    s += '<path d="M2 -4.3 L' + f(L - 2) + ' -4.3" stroke="#fff" stroke-width="0.7" opacity=".6"/>';
    s += '</g>';
    return s;
  }

  function necklaces() {
    var s = '';
    // tight choker: white with coloured accents
    s += beadCurve(88, 109, 99, 119, 111, 109, 11, 1.35, [BW, BW, BR, BW, BW, BB]);
    // longer strand: repeating colour blocks
    s += beadCurve(84, 112, 99, 132, 115, 112, 15, 1.55, [BR, BR, BW, BB, BB, BW, BG, BG, BW, BY, BY, BW]);
    // beaded square pendant (ucu-style panel) with a diamond motif
    s += '<g transform="translate(99 131.5)">';
    s += '<path d="M-5 0 L5 0 L5 8 L0 11.5 L-5 8Z" fill="' + BW + '" stroke="' + O + '" stroke-width="1.6" stroke-linejoin="round"/>';
    s += '<path d="M0 1.4 L3 5 L0 8.6 L-3 5Z" fill="' + BR + '"/>';
    s += '<path d="M0 3.4 L1.4 5 L0 6.6 L-1.4 5Z" fill="' + BY + '"/>';
    s += '<path d="M-4.2 1.2 L-2.6 1.2 L-4.2 3Z M4.2 1.2 L2.6 1.2 L4.2 3Z" fill="' + BB + '"/>';
    s += '<path d="M-4 9 L0 11 L4 9" stroke="' + BG + '" stroke-width="1" fill="none"/>';
    s += '<path d="M-3.4 12 l-0.4 3 M0 12.6 l0 3.2 M3.4 12 l0.4 3" stroke="' + O + '" stroke-width="1.8" stroke-linecap="round"/>';
    s += '<circle cx="-3.8" cy="15.4" r="1" fill="' + BR + '" stroke="' + O + '" stroke-width="0.5"/><circle cx="0" cy="16.2" r="1" fill="' + BB + '" stroke="' + O + '" stroke-width="0.5"/><circle cx="3.8" cy="15.4" r="1" fill="' + BG + '" stroke="' + O + '" stroke-width="0.5"/>';
    s += '</g>';
    return s;
  }

  function belt() {
    var s = '';
    s += '<path d="M68 155 Q97 163 128 155 L128 164 Q97 172 68 164Z" fill="#6e4122" stroke="' + O + '" stroke-width="2.8" stroke-linejoin="round"/>';
    // beaded strip on the belt
    var d = '', dd = '';
    for (var x = 71, i = 0; x < 126; x += 3.2, i++) {
      var y = 159.8 + 4 * (1 - Math.pow((x - 98) / 30, 2)) * 0.9;
      d += '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="1.25" fill="' + [BW, BR, BW, BB, BW, BY][i % 6] + '"/>';
    }
    s += '<path d="M69 159.8 Q98 167 127 159.8" stroke="' + BK + '" stroke-width="3.2" fill="none"/>' + d;
    s += '<path d="M70 157 Q97 164 126 157" stroke="#9a6a3e" stroke-width="0.8" fill="none" opacity=".8"/>';
    void dd;
    return s;
  }

  // tapered furry tail along a quadratic curve
  function tail(x0, y0, cx, cy, x1, y1, w0, w1, base, ring, hi, rings, seed) {
    var N = 12, Lp = [], Rp = [], i, pts = [];
    function pt(t) {
      return [(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1];
    }
    function nrm(t) {
      var dx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx), dy = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy), l = Math.sqrt(dx * dx + dy * dy);
      return [-dy / l, dx / l];
    }
    for (i = 0; i <= N; i++) {
      var t = i / N, P0 = pt(t), n = nrm(t), w = (w0 + (w1 - w0) * t) / 2 * (1 + 0.12 * Math.sin(t * 9));
      pts.push([P0, n, w]);
      Rp.push(f(P0[0] + n[0] * w) + ' ' + f(P0[1] + n[1] * w));
      Lp.unshift(f(P0[0] - n[0] * w) + ' ' + f(P0[1] - n[1] * w));
    }
    var e = pts[N], ew = e[2];
    var d = 'M' + Rp.join(' L') + ' Q' + f(e[0][0] - e[1][1] * ew * 1.8) + ' ' + f(e[0][1] + e[1][0] * ew * 1.8) + ' ' + Lp.join(' L') + 'Z';
    var s = '<path d="' + d + '" fill="' + base + '" stroke="' + O + '" stroke-width="1.7" stroke-linejoin="round"/>';
    // rings / spots
    var rg = '';
    for (i = 0; i < rings.length; i++) {
      var k = Math.round(rings[i] * N), q = pts[k], ww = q[2] * 0.95, ax = -q[1][1], ay = q[1][0];
      rg += 'M' + f(q[0][0] + q[1][0] * ww) + ' ' + f(q[0][1] + q[1][1] * ww) +
        ' Q' + f(q[0][0] + ax * 0.9) + ' ' + f(q[0][1] + ay * 0.9) + ' ' + f(q[0][0] - q[1][0] * ww) + ' ' + f(q[0][1] - q[1][1] * ww);
    }
    s += '<path d="' + rg + '" stroke="' + ring + '" stroke-width="1.7" fill="none"/>';
    // highlight + fur ticks
    var hl = 'M' + f(pts[1][0][0] - pts[1][1][0] * pts[1][2] * 0.45) + ' ' + f(pts[1][0][1] - pts[1][1][1] * pts[1][2] * 0.45);
    for (i = 2; i < N - 2; i++) hl += ' L' + f(pts[i][0][0] - pts[i][1][0] * pts[i][2] * 0.45) + ' ' + f(pts[i][0][1] - pts[i][1][1] * pts[i][2] * 0.45);
    s += '<path d="' + hl + '" stroke="' + hi + '" stroke-width="0.8" fill="none" stroke-linecap="round" opacity=".8"/>';
    var tk = '';
    for (i = 3; i < N; i += 4) {
      var sg = (i + seed) % 4 < 2 ? 1 : -1, qq = pts[i];
      tk += 'M' + f(qq[0][0] + qq[1][0] * qq[2] * sg) + ' ' + f(qq[0][1] + qq[1][1] * qq[2] * sg) + ' l' + f(qq[1][0] * 1.4 * sg) + ' ' + f(1.2);
    }
    s += '<path d="' + tk + '" stroke="' + O + '" stroke-width="0.8" stroke-linecap="round"/>';
    return s;
  }

  function isinene() {
    // front apron of fur tails (genet, civet, monkey)
    var s = '';
    s += '<path d="M88 163 Q104 169 122 163 L124 188 Q106 194 86 188Z" fill="#4a2c16" stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round"/>';
    var kinds = [
      ['#d9c08e', '#3b2616', '#fff4d6', [0.2, 0.36, 0.52, 0.68, 0.84]],   // genet
      ['#5b4e46', '#f1eadc', '#9a8c80', [0.3, 0.55, 0.8]],               // civet
      ['#a8794a', '#4a2c16', '#e6be8a', [0.25, 0.5, 0.75]]                // hide tail
    ];
    var order = [2, 0, 1, 0, 1, 0, 2];
    for (var k = 0; k < 7; k++) {
      var x0 = 90 + k * 5.2, sp = (x0 - 105) * 0.22, kd = kinds[order[k]];
      var end = 194 + (k % 3) * 2.4 - (k % 2) * 1.4;
      s += tail(x0, 164, x0 + sp * 0.4 + (k % 2 ? 1 : -0.6), 180, x0 + sp, end, 6.4, 3.6, kd[0], kd[1], kd[2], kd[3], k);
    }
    return s;
  }

  function knobkerrie(P) {
    var id = function (n) { return 'zulu-' + n + P; };
    // iwisa tucked through the belt at the front hip, knob up
    var s = '<g transform="translate(121 150) rotate(-18)">';
    s += '<path d="M-2.4 4 L-1.8 44 Q0 46.5 1.8 44 L2.4 4Z" fill="url(#' + id('wood') + ')" stroke="' + O + '" stroke-width="2.2" stroke-linejoin="round"/>';
    s += '<path d="M0 8 L0.3 42" stroke="#c78a52" stroke-width="0.6" opacity=".8"/>';
    s += '<circle cx="0" cy="-2" r="7.4" fill="url(#' + id('wood') + ')" stroke="' + O + '" stroke-width="2.6"/>';
    s += '<path d="M-5 1.6 Q0 5.6 5 1.6" stroke="#4a2913" stroke-width="1.2" fill="none" opacity=".7"/>';
    s += '<ellipse cx="2.4" cy="-4.6" rx="2.4" ry="1.5" fill="#e0b07a" opacity=".85" transform="rotate(-25 2.4 -4.6)"/>';
    s += '<path d="M-3.6 -3.6 Q-2.8 -6.2 0 -7" stroke="#c78a52" stroke-width="0.7" fill="none"/>';
    s += '</g>';
    return s;
  }

  function shield(P) {
    var id = function (n) { return 'zulu-' + n + P; };
    var s = '<g transform="translate(54 158) rotate(-5)">';
    // stick ends (behind the hide)
    s += '<path d="M-2 -62 L-2 62 Q0 65 2 62 L2 -62Z" fill="url(#' + id('wood') + ')" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/>';
    // fur tuft (genet tail) crowning the stick
    s += '<path d="M-1.6 -60 Q-7.5 -63 -6 -69 Q-8.5 -73 -4.6 -76 Q-4.2 -81 0 -82 Q4.4 -81 4.6 -76.5 Q8.4 -73 6 -68.6 Q7.4 -63 1.6 -60Z" fill="#4a3322" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>';
    s += '<path d="M-4 -66 Q-4.4 -72 -2 -77 M0 -62 L0 -79 M3.8 -65 Q4.6 -71 2.6 -77" stroke="#8a6a52" stroke-width="0.7" fill="none" stroke-linecap="round"/>';
    s += '<path d="M-5.4 -70.5 Q-2 -69 0 -70.5 Q2.4 -69 5.4 -70.5 M-4 -75.5 Q0 -74 4 -75.5" stroke="#efe2c4" stroke-width="1.3" fill="none" stroke-linecap="round"/>';
    s += '<path d="M-1.6 -60 L1.6 -60 L1.8 -57 L-1.8 -57Z" fill="#b87333" stroke="' + O + '" stroke-width="1"/>';
    // hide
    s += '<ellipse cx="0" cy="0" rx="27" ry="52" fill="url(#' + id('cow') + ')"/>';
    s += '<g clip-path="url(#' + id('shield') + ')">';
    s += '<path d="M-28 -56 L6 -56 Q4 -44 -6 -40 Q-12 -30 -8 -18 Q-12 -8 -22 -6 Q-26 -4 -28 -6Z" fill="#1e1a18"/>';
    s += '<path d="M28 -30 Q16 -26 12 -14 Q8 0 16 8 Q22 14 28 12Z" fill="#1e1a18"/>';
    s += '<path d="M-28 20 Q-18 14 -10 22 Q-4 32 -8 42 Q-12 54 -28 56Z" fill="#1e1a18"/>';
    s += '<path d="M28 34 Q18 34 14 44 Q12 52 16 56 L28 56Z" fill="#6b3f1f"/>';
    s += '<path d="M-6 -2 Q0 -6 4 0 Q2 6 -4 5Z" fill="#1e1a18"/>';
    s += '<path d="M-18 -30 Q-14 -34 -12 -28 Q-14 -24 -18 -26Z" fill="#f3eee2"/>';
    // hair texture
    var ht = '';
    for (var i = 0; i < 34; i++) {
      var hx = -22 + rnd(i + 40) * 44, hy = -46 + rnd(i + 90) * 92;
      ht += 'M' + f(hx) + ' ' + f(hy) + 'l0.7 2.2';
    }
    s += '<path d="' + ht + '" stroke="#8a8274" stroke-width="0.6" stroke-linecap="round" opacity=".7"/>';
    // cel shade (rear side) + highlight
    s += '<path d="M-27 -60 L-27 60 L-14 60 Q-26 30 -24 0 Q-24 -30 -14 -60Z" fill="#000" opacity=".16"/>';
    s += '<path d="M15 -40 Q23 -24 22 -4" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/>';
    // central stick on the face
    s += '<rect x="-2.1" y="-52" width="4.2" height="104" fill="url(#' + id('wood') + ')" stroke="' + O + '" stroke-width="1.4"/>';
    s += '<path d="M-0.6 -50 L-0.6 50" stroke="#c78a52" stroke-width="0.6" opacity=".8"/>';
    // two vertical rows of laced hide strips threaded through slits
    [-9, 9].forEach(function (lx) {
      var hw = 0;
      for (var y = -42, j = 0; y <= 38; y += 7.6, j++) {
        hw = 3.3;
        s += '<path d="M' + f(lx - hw - 0.6) + ' ' + f(y - 0.4) + ' L' + f(lx + hw + 0.6) + ' ' + f(y - 0.4) + '" stroke="' + O + '" stroke-width="1.3" stroke-linecap="round"/>';
        s += '<rect x="' + f(lx - hw) + '" y="' + f(y) + '" width="' + f(hw * 2) + '" height="4.4" rx="0.9" fill="#f5ecd8" stroke="' + O + '" stroke-width="1"/>';
        s += '<path d="M' + f(lx - hw + 0.8) + ' ' + f(y + 1.1) + ' L' + f(lx + hw - 0.8) + ' ' + f(y + 1.1) + '" stroke="#fff" stroke-width="0.7"/>';
        s += '<path d="M' + f(lx - hw + 0.6) + ' ' + f(y + 3.6) + ' L' + f(lx + hw - 0.6) + ' ' + f(y + 3.6) + '" stroke="#c9b894" stroke-width="0.7"/>';
      }
    });
    s += '</g>';
    // rim: sewn hide edge
    s += '<ellipse cx="0" cy="0" rx="24" ry="49" fill="none" stroke="#9a907f" stroke-width="0.8" stroke-dasharray="1.6 1.6" opacity=".85"/>';
    s += '<ellipse cx="0" cy="0" rx="27" ry="52" fill="none" stroke="' + O + '" stroke-width="3.4"/>';
    s += '</g>';
    return s;
  }

  function shieldHand() {
    // fingers curled around the shield's edge
    return '<g transform="translate(78 148)">' +
      '<path d="M-3 -6 Q4 -8 6 -3 Q7 3 3 6 Q-2 7 -3 3Z" fill="' + SKIN_SH + '" stroke="' + O + '" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<path d="M0 -6.6 Q3.4 -5 3.6 -1.8 M0.4 -1.6 Q3.6 0 3.2 3.4" stroke="' + O + '" stroke-width="1" fill="none" stroke-linecap="round"/>' +
      '<path d="M0.8 -5.6 Q3 -5.4 4 -3.6" stroke="' + SKIN + '" stroke-width="1" fill="none" stroke-linecap="round"/>' +
      '</g>';
  }

  function plumes(P) {
    var s = '';
    s += ostrich(66, 56, -64, 34, 7, '#1f1a1a', '#4d4343', '#6a5e5e', 5);
    s += ostrich(71, 48, -44, 44, 8, '#1f1a1a', '#4d4343', '#6a5e5e', 3);
    s += craneFeather(79, 45, -28, 44, 4.4, P);
    s += craneFeather(87, 43, -12, 40, 4.4, P);
    s += ostrich(95, 42, 6, 33, 6.4, '#f6f2ea', '#c9c0b0', '#fff', 11);
    return s;
  }

  function head(P, anim) {
    var id = function (n) { return 'zulu-' + n + P; };
    var s = '';
    // plumes behind the head
    // short cropped hair cap
    s += '<path d="M59 74 Q53 26 100 22 Q145 24 143 66 L60 78Z" fill="url(#' + id('hair') + ')" stroke="' + O + '" stroke-width="3.4" stroke-linejoin="round"/>';
    // face
    s += '<path d="M62 74 Q61 32 100 30 Q139 31 140 74 Q140 100 122 108 Q108 113 92 111 Q64 105 62 74Z" fill="url(#' + id('face') + ')" stroke="' + O + '" stroke-width="3.4" stroke-linejoin="round"/>';
    s += '<path d="M66 86 Q72 106 94 108 Q80 109 70 100 Q64 93 66 86Z" fill="' + SKIN_SH + '" opacity=".6"/>';
    // hair texture (tight coils) above the band
    var coils = '';
    for (var i = 0; i < 18; i++) {
      var cx = 66 + rnd(i) * 70, cy = 26 + rnd(i + 30) * 10;
      if (cy > 22 + Math.abs(cx - 100) * 0.12) coils += 'M' + f(cx) + ' ' + f(cy) + ' a1.3 1.3 0 1 1 2.2 0.6';
    }
    s += '<path d="' + coils + '" stroke="#4a3d38" stroke-width="0.8" fill="none" stroke-linecap="round"/>';
    s += '<path d="M92 26 Q108 24 124 30" stroke="#5a4b46" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>';
    // plumes tucked into the headband
    s += anim ? '<g class="part-cape" style="transform-origin: 82px 46px">' + plumes(P) + '</g>' : plumes(P);
    // umqhele: padded leopard-skin headband
    s += '<path d="' + BAND + '" fill="url(#' + id('fur') + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<g clip-path="url(#' + id('band') + ')">';
    s += rosette(66, 56, 3.2, 1) + rosette(78, 44, 3.2, 2) + rosette(93, 42, 3.4, 3) + rosette(108, 43, 3.2, 4) +
      rosette(123, 44, 3, 5) + rosette(136, 51, 2.6, 6) + rosette(86, 48.5, 2, 7) + rosette(116, 48.8, 2, 8) + rosette(62, 68, 2.4, 9);
    s += '<circle cx="100" cy="48" r="1" fill="' + SPOT + '"/><circle cx="72" cy="52" r="0.9" fill="' + SPOT + '"/><circle cx="130" cy="46" r="0.9" fill="' + SPOT + '"/>';
    s += '<path d="M60 62 Q66 46 96 44 Q70 50 64 74Z" fill="#7a4a1a" opacity=".35"/>';
    s += '<path d="M96 38.5 Q120 37.5 136 45" stroke="#fff4cf" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>';
    s += '</g>';
    // fur tufts along the band edges
    var tf = '';
    for (var t = 0; t < 12; t++) {
      var x = 66 + t * 6.4, yb = 51.5 + Math.pow((x - 100) / 38, 2) * 4 + (x < 80 ? (80 - x) * 0.5 : 0);
      tf += 'M' + f(x) + ' ' + f(yb - 0.6) + ' l' + f(0.8) + ' ' + f(2.2);
    }
    s += '<path d="' + tf + '" stroke="' + O + '" stroke-width="1.2" stroke-linecap="round"/>';
    s += '<path d="M64 42 l-1.4 -2 M74 37.4 l-0.8 -2.2 M86 35 l-0.4 -2.2 M112 35 l0.4 -2.2 M126 37.6 l1 -2 M138 44 l1.4 -1.6" stroke="' + O + '" stroke-width="1.2" stroke-linecap="round"/>';
    // ear with beaded ear plug
    s += '<path d="M70 76 Q60 71 60 83 Q61 93 71 92" fill="' + SKIN + '" stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round"/>';
    s += '<path d="M68 79 Q63 79 64 84 Q65 88 69 87" stroke="' + SKIN_DK + '" stroke-width="1.2" fill="none"/>';
    s += '<circle cx="63.6" cy="90" r="2.6" fill="' + BW + '" stroke="' + O + '" stroke-width="1"/><circle cx="63.6" cy="90" r="1.3" fill="' + BR + '"/>';
    // cheeks
    s += '<ellipse cx="95" cy="95" rx="6" ry="3.2" fill="#c4553f" opacity=".35"/>';
    s += '<ellipse cx="132" cy="93" rx="4.4" ry="3" fill="#c4553f" opacity=".35"/>';
    // expressive brows: determined, slightly raised at the outer edge
    s += '<path d="M88 67 Q96 63 105 69 L103.6 72.4 Q96 68.4 88.6 71.2 Z" fill="#150d0a" stroke="' + O + '" stroke-width="1.2" stroke-linejoin="round"/>';
    s += '<path d="M115 70 Q123 63 133 64.5 L133 68.6 Q124 67.4 116.6 73 Z" fill="#150d0a" stroke="' + O + '" stroke-width="1.2" stroke-linejoin="round"/>';
    // eyes
    var eyes = eye(97, 83, P) + eye(124, 83, P);
    s += anim ? '<g class="part-eyes" style="transform-origin: 111px 83px">' + eyes + '</g>' : '<g>' + eyes + '</g>';
    // nose (broad)
    s += '<path d="M109.4 92.6 Q108 95.4 111 96 Q113.4 97.2 116 96 Q119.6 95.6 119 92.6" stroke="' + O + '" stroke-width="1.7" fill="none" stroke-linecap="round"/>';
    s += '<path d="M111.6 94.6 Q112.6 95.6 113.6 94.8 M116 94.8 Q117 95.6 117.6 94.4" stroke="' + SKIN_DK + '" stroke-width="1.1" fill="none" stroke-linecap="round"/>';
    s += '<ellipse cx="115.4" cy="92.4" rx="2" ry="1.3" fill="' + SKIN_GL + '" opacity=".75"/>';
    // mouth: warm, confident grin
    s += '<path d="M103 99.5 Q113 102 122 98 Q120 106.5 112 106.8 Q105 106.6 103 99.5Z" fill="#5a1a14" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/>';
    s += '<path d="M104.4 100.1 Q113 102.1 120.8 98.9 L120 101.4 Q112.5 104 105.4 102.2Z" fill="#fffaf0"/>';
    s += '<path d="M108 105 Q112.5 103.2 116.5 105 Q112.4 107 108 105Z" fill="#c9564a"/>';
    s += '<path d="M101.5 98.4 Q102.6 99.8 103.8 99 M121 97.3 Q122.8 96.9 123.4 95.5" stroke="' + O + '" stroke-width="1.2" fill="none" stroke-linecap="round"/>';
    s += '<path d="M109 109.4 Q114 109.6 117.6 107.8" stroke="' + SKIN_GL + '" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/>';
    // soft face highlights
    s += '<ellipse cx="122" cy="58" rx="6" ry="2.2" fill="#fff" opacity=".14" transform="rotate(-10 122 58)"/>';
    s += '<path d="M133 76 Q137 84 134 92" stroke="' + SKIN_GL + '" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/>';
    return s;
  }

  function eye(cx, cy, P) {
    var id = function (n) { return 'zulu-' + n + P; };
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="6.4" ry="8.2" fill="#fff" stroke="' + O + '" stroke-width="1.6"/>' +
      '<ellipse cx="' + (cx + 1.3) + '" cy="' + (cy + 0.6) + '" rx="4.9" ry="6.9" fill="url(#' + id('iris') + ')"/>' +
      '<ellipse cx="' + (cx + 1.5) + '" cy="' + (cy + 1) + '" rx="2.4" ry="3.4" fill="#0a0503"/>' +
      '<path d="M' + (cx - 2.2) + ' ' + (cy + 4.8) + ' Q' + (cx + 1.3) + ' ' + (cy + 7.2) + ' ' + (cx + 4.9) + ' ' + (cy + 4.2) + '" stroke="#d08a44" stroke-width="1" fill="none" opacity=".9"/>' +
      '<circle cx="' + (cx + 3.2) + '" cy="' + (cy - 2.6) + '" r="2.3" fill="#fff"/>' +
      '<circle cx="' + (cx - 1.4) + '" cy="' + (cy + 3.4) + '" r="1.1" fill="#fff"/>' +
      '<circle cx="' + (cx + 0.6) + '" cy="' + (cy - 4.2) + '" r="0.6" fill="#fff" opacity=".9"/>' +
      '<path d="M' + (cx - 7) + ' ' + (cy - 5) + ' Q' + cx + ' ' + (cy - 11.2) + ' ' + (cx + 7.2) + ' ' + (cy - 4.2) + '" stroke="' + O + '" stroke-width="2.8" fill="none" stroke-linecap="round"/>' +
      '<path d="M' + (cx + 6.2) + ' ' + (cy - 5) + ' l2.2 -1.4" stroke="' + O + '" stroke-width="1.4" stroke-linecap="round"/>';
  }

  function spear(P) {
    var id = function (n) { return 'zulu-' + n + P; };
    var s = '';
    // haft (wooden) from butt (+24) up to socket (-40)
    s += '<path d="M-2.9 -40 L-2.6 22 Q0 26 2.6 22 L2.9 -40Z" fill="url(#' + id('wood') + ')" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>';
    s += '<path d="M-0.8 -36 L-0.6 20 M1.4 -30 Q1.2 0 1.6 16" stroke="#c78a52" stroke-width="0.6" fill="none" opacity=".8"/>';
    s += '<path d="M-2.4 14 L2.4 14 M-2.4 16.4 L2.4 16.4" stroke="#3a1e0c" stroke-width="0.8"/>';
    // blade
    var blade = 'M0 -100 C6 -91 12 -78 10.6 -66 C9.6 -59 5.4 -55 2.6 -52.5 L-2.6 -52.5 C-5.4 -55 -9.6 -59 -10.6 -66 C-12 -78 -6 -91 0 -100Z';
    s += '<path d="' + blade + '" fill="url(#' + id('steel') + ')" stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round"/>';
    // shaded half + central ridge
    s += '<path d="M0 -99 C6 -90 11.8 -78 10.4 -66 C9.4 -59 5.4 -55 2.4 -52.8 L0 -52.8Z" fill="#5d6873" opacity=".35"/>';
    s += '<path d="M0 -98 L0 -53" stroke="#3d4650" stroke-width="1.2"/>';
    s += '<path d="M-0.9 -96 L-0.9 -54" stroke="#ffffff" stroke-width="0.8" opacity=".9"/>';
    // shine
    s += '<path d="M-6.4 -82 Q-8.4 -71 -6.8 -62" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/>';
    s += '<circle cx="-4.2" cy="-86" r="1" fill="#fff"/>';
    s += '<path d="M-2 -91 l0.8 -2.6 M-3.2 -88.2 l1.4 0.2" stroke="#fff" stroke-width="0.8" stroke-linecap="round"/>';
    // edge bevels
    s += '<path d="M7.8 -78 Q8.8 -70 7.6 -62" stroke="#39424b" stroke-width="0.7" fill="none" opacity=".7"/>';
    // socket bound with copper wire and sinew
    s += '<path d="M-3.4 -53.5 L3.4 -53.5 L3.2 -39 L-3.2 -39Z" fill="#b87333" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/>';
    var wr = '';
    for (var y = -52.4; y < -46; y += 1.2) wr += 'M-3.2 ' + f(y + 0.5) + ' L3.2 ' + f(y - 0.3);
    s += '<path d="' + wr + '" stroke="#6e3c14" stroke-width="0.6"/>';
    s += '<path d="M-2.4 -52 L-2.4 -46" stroke="#f3c08a" stroke-width="0.8" opacity=".9"/>';
    s += '<path d="M-3.3 -45.5 L3.3 -45.5 L3.2 -39.5 L-3.2 -39.5Z" fill="#dcc79c"/>';
    var sn = '';
    for (var y2 = -45; y2 < -40; y2 += 1.1) sn += 'M-3.2 ' + f(y2) + ' L3.2 ' + f(y2 + 0.7);
    s += '<path d="' + sn + '" stroke="#8f7648" stroke-width="0.55"/>';
    s += '<path d="M-3.4 -45.6 L3.4 -45.6" stroke="' + O + '" stroke-width="0.9"/>';
    return s;
  }

  function weaponArm(P) {
    var s = '';
    // upper arm (shoulder 122,118 -> elbow 134,140)
    s += '<g transform="translate(121 117) rotate(62)">';
    s += '<rect x="-4" y="-8.5" width="33" height="17" rx="8.5" fill="' + SKIN + '" stroke="' + O + '" stroke-width="3"/>';
    s += '<path d="M2 5 L26 5.6" stroke="' + SKIN_SH + '" stroke-width="4" stroke-linecap="round" opacity=".75"/>';
    s += '<path d="M3 -4.8 L22 -4.6" stroke="' + SKIN_GL + '" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>';
    s += '</g>';
    // forearm (elbow -> hand 150,152)
    s += '<g transform="translate(134 141) rotate(36)">';
    s += '<rect x="-6" y="-7.8" width="26" height="15.6" rx="7.5" fill="' + SKIN + '" stroke="' + O + '" stroke-width="3"/>';
    s += '<path d="M-1 4.6 L16 4.6" stroke="' + SKIN_SH + '" stroke-width="3.4" stroke-linecap="round" opacity=".7"/>';
    s += '<path d="M0 -4.6 L12 -4.6" stroke="' + SKIN_GL + '" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>';
    // beaded wrist band
    s += '<rect x="13" y="-8.2" width="5.4" height="16.4" rx="1.8" fill="' + BW + '" stroke="' + O + '" stroke-width="1.8"/>';
    s += '<path d="M13.4 -6 L18 -6 M13.4 6 L18 6" stroke="' + BK + '" stroke-width="1"/>';
    s += '<path d="M15.7 -5 L17.6 -2.4 L15.7 0 L13.8 -2.4Z M15.7 0 L17.6 2.4 L15.7 5 L13.8 2.4Z" fill="' + BR + '"/>';
    s += '<circle cx="15.7" cy="0" r="0.9" fill="' + BB + '"/>';
    s += '</g>';
    // cow-tail ruff (ishoba) on the upper arm
    s += ruff(127, 124, -28, 17, 16, 6, 21);
    // spear
    s += '<g transform="translate(150 152) rotate(22)">' + spear(P) + '</g>';
    // fist wrapped around the haft
    s += '<g transform="translate(150 152) rotate(22)">' +
      '<path d="M-8.5 -6 Q-9.5 3 -6 7.5 L6.5 7.5 Q9.5 4 8.5 -6 Q0 -9 -8.5 -6Z" fill="' + SKIN + '" stroke="' + O + '" stroke-width="2.8" stroke-linejoin="round"/>' +
      '<path d="M2.2 -6.8 L2.4 7.2 M5.4 -6.2 L5.8 7 M-1 -7 L-1 7.4" stroke="' + O + '" stroke-width="1" stroke-linecap="round"/>' +
      '<path d="M-8.2 -1 Q-4 1.6 -1.4 -1.6" stroke="' + O + '" stroke-width="1.4" fill="none" stroke-linecap="round"/>' +
      '<path d="M-5.8 -5.4 Q-2 -6.6 1 -5.8" stroke="' + SKIN_GL + '" stroke-width="1.3" fill="none" stroke-linecap="round"/>' +
      '<path d="M0.4 -5 l0 1.2 M3.8 -4.8 l0 1.2 M7 -4.4 l0 1.2" stroke="#b98463" stroke-width="1" stroke-linecap="round"/>' +
      '</g>';
    return s;
  }

  function legs() {
    var s = '';
    // rear leg
    s += '<path d="M75 188 L74 218 Q74 222 80 222 L88 222 Q90 219 89 214 L90 188Z" fill="' + SKIN_SH + '" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += foot(72, SKIN_SH, SKIN_DK, SKIN);
    s += anklet(82, 215, 17);
    s += ruff(82.5, 199, 0, 20, 14, 6, 3);
    // front leg
    s += '<path d="M100 188 L100 218 Q100 222 106 222 L114 222 Q116 219 115 214 L116 188Z" fill="' + SKIN + '" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<path d="M112 196 L112 214" stroke="' + SKIN_SH + '" stroke-width="3" stroke-linecap="round" opacity=".75"/>';
    s += '<path d="M103.4 206 L103.4 212" stroke="' + SKIN_GL + '" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>';
    s += foot(99, SKIN, SKIN_SH, SKIN_GL);
    s += anklet(108, 215, 17);
    s += ruff(108, 199, 0, 20.5, 14, 6, 9);
    return s;
  }

  function build(P) {
    var s = '';
    s += '<ellipse class="part-shadow" cx="100" cy="229.5" rx="50" ry="7" fill="#000" opacity=".22"/>';
    s += '<g class="part-legs">' + legs() + '</g>';
    s += '<g class="part-body">';
    s += '<g class="part-cape" style="transform-origin: 76px 160px">' + ibheshu(P) + '</g>';
    s += shieldArmBack();
    s += torso(P);
    s += chestBand();
    s += necklaces();
    s += '<g class="part-cape" style="transform-origin: 105px 164px">' + isinene() + '</g>';
    s += belt();
    s += knobkerrie(P);
    s += ruff(76, 122, 26, 15, 13, 5, 33);
    s += shield(P);
    s += shieldHand();
    s += '<g class="part-head" style="transform-origin: 100px 106px">' + head(P, true) + '</g>';
    s += '<g class="part-weapon" style="transform-origin: 121px 117px">' + weaponArm(P) + '</g>';
    s += '</g>';
    return s;
  }

  function suffix(uid) { return '-' + (uid === undefined || uid === null ? '0' : String(uid)); }

  window.HEROES = window.HEROES || {};
  window.HEROES.zulu = {
    key: 'zulu',
    name: 'Themba',
    title: 'The Zulu Warrior',
    lore: 'Themba ran barefoot across the hills of KwaZulu until his feet were hard as the veld. With cowhide shield and iklwa in hand, he strikes twice before the thunder answers.',
    color: '#c9a227',
    base: { hp: 540, atk: 100, def: 22 },
    fx: { slash: '#ffd23a', glow: '#fff4c2' },
    signature: { name: 'Iklwa Flurry', desc: '30% chance to strike twice with a lightning-fast stab.', type: 'multi' },
    svg: function (uid) {
      var P = suffix(uid);
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240">' + defs(P) + build(P) + '</svg>';
    },
    portrait: function (uid) {
      var P = '-p' + suffix(uid);
      var id = function (n) { return 'zulu-' + n + P; };
      // triangle bead motif around the frame
      var tri = '';
      for (var x = 0; x < 120; x += 10) tri += 'M' + x + ' 120 L' + (x + 5) + ' 111 L' + (x + 10) + ' 120Z';
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' + defs(P) +
        '<g clip-path="url(#' + id('pclip') + ')">' +
        '<rect x="0" y="0" width="120" height="120" fill="url(#' + id('pbg') + ')"/>' +
        '<circle cx="60" cy="50" r="44" fill="#fff" opacity=".16"/>' +
        '<path d="' + tri + '" fill="#8a3a18" opacity=".5"/>' +
        '<g transform="translate(-10 9) scale(0.7)">' +
        shieldArmBack() + torso(P) + chestBand() + necklaces() + head(P, false) +
        '<g transform="translate(121 117) rotate(62)"><rect x="-4" y="-8.5" width="33" height="17" rx="8.5" fill="' + SKIN + '" stroke="' + O + '" stroke-width="3"/></g>' +
        ruff(127, 124, -28, 17, 16, 6, 21) + ruff(76, 122, 26, 15, 13, 5, 33) +
        '</g></g>' +
        '<rect x="1.5" y="1.5" width="117" height="117" rx="13" fill="none" stroke="' + O + '" stroke-width="3"/>' +
        '</svg>';
    }
  };
})();

/* Hero Go! — K’awiil, God of Storm (key: polynesian)
 * Hand-authored inline SVG. Chibi, facing right. See ART_CONTRACT.md.
 * Maya god of storm, lightning and royal power: obsidian crown with golden
 * lightning cracks, twin cobras, black feather mantle, jade-and-gold regalia,
 * skull-face pendant/buckle and the sacred trident scepter.
 */
(function () {
  'use strict';

  var OL = '#120c08';
  var GOLD = '#c98a2b', GOLDL = '#f2c15a', GOLDD = '#7a4c12';
  var JADE = '#1f7a80', JADEL = '#4cc2b8', JADED = '#0d474e';
  var SKN = '#5e3a1d', SKNL = '#88562a', SKND = '#37200d';
  var BOLT = '#ffd23a';

  function f(n) { return +n.toFixed(1); }

  /* ---------- small helpers ---------- */
  function bolt(pts, w) {
    var d = 'M' + pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' L');
    return '<path d="' + d + '" fill="none" stroke="#ffb400" stroke-opacity=".3" stroke-width="' + f(w * 3.4) + '" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="none" stroke="' + BOLT + '" stroke-width="' + w + '" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="none" stroke="#fff7cf" stroke-width="' + f(w * 0.38) + '" stroke-linejoin="round" stroke-linecap="round"/>';
  }
  /* crack: no wide glow, used inside dark shapes */
  function crack(pts, w) {
    var d = 'M' + pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' L');
    return '<path d="' + d + '" fill="none" stroke="#ffb400" stroke-opacity=".35" stroke-width="' + f(w * 2.6) + '" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="none" stroke="' + BOLT + '" stroke-width="' + w + '" stroke-linejoin="round" stroke-linecap="round"/>';
  }

  /* one glossy black feather. ang: degrees, 0 = pointing down, + = tip toward viewer-left */
  function feather(x, y, ang, len, w, fill) {
    var a = ang * Math.PI / 180, s = Math.sin(a), c = Math.cos(a);
    function P(px, py) { return f(x + px * c - py * s) + ',' + f(y + px * s + py * c); }
    return '<path d="M' + P(0, 0) + 'C' + P(w, len * 0.25) + ' ' + P(w * 0.9, len * 0.75) + ' ' + P(0, len) +
      'C' + P(-w * 0.9, len * 0.75) + ' ' + P(-w, len * 0.25) + ' ' + P(0, 0) + 'Z" fill="' + fill + '" stroke="#060403" stroke-width=".8" stroke-linejoin="round"/>' +
      '<path d="M' + P(-w * 0.55, len * 0.18) + 'C' + P(-w * 0.85, len * 0.4) + ' ' + P(-w * 0.6, len * 0.75) + ' ' + P(-0.6, len * 0.94) + '" fill="none" stroke="#8d97a6" stroke-width=".55" opacity=".6" stroke-linecap="round"/>' +
      '<path d="M' + P(0, len * 0.1) + 'L' + P(0.4, len * 0.8) + '" fill="none" stroke="#000" stroke-width=".4" opacity=".55"/>';
  }
  var FEA = ['#1a1512', '#241d19', '#14100d', '#2b2320'];

  function lerpTab(tab, y) {
    if (y <= tab[0][0]) return tab[0][1];
    for (var i = 1; i < tab.length; i++) {
      if (y <= tab[i][0]) {
        var a = tab[i - 1], b = tab[i], t = (y - a[0]) / (b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * t;
      }
    }
    return tab[tab.length - 1][1];
  }

  /* ---- glyph carvings for jade blocks ---- */
  function glyph(cx, cy, s, k, col) {
    var t = 'translate(' + f(cx) + ' ' + f(cy) + ') scale(' + f(s) + ')';
    var o = '<g transform="' + t + '" fill="none" stroke="' + col + '" stroke-width=".13" stroke-linecap="round" stroke-linejoin="round">';
    switch (k % 5) {
      case 0: o += '<path d="M-.4,-.4H.4V.4H-.4Z"/><circle r=".14" fill="' + col + '"/>'; break;
      case 1: o += '<path d="M-.45,.45V-.45H.45V.1H-.1V-.1"/>'; break;
      case 2: o += '<path d="M0,-.5V.5M-.5,0H.5"/><circle r=".22"/>'; break;
      case 3: o += '<circle cx="-.24" cy="-.15" r=".13"/><circle cx=".24" cy="-.15" r=".13"/><path d="M-.34,.3H.34"/>'; break;
      default: o += '<path d="M-.45,-.1Q0,-.6 .45,-.1Q0,.45 -.45,-.1Z"/><circle cy="-.1" r=".1" fill="' + col + '"/>'; break;
    }
    return o + '</g>';
  }
  /* jade block set in gold */
  function block(id, x, y, w, h, k) {
    var s = Math.min(w, h) * 0.78;
    return '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '" rx=".8" fill="url(#' + id('jade') + ')" stroke="' + GOLD + '" stroke-width="1"/>' +
      '<path d="M' + f(x + 0.6) + ',' + f(y + h - 0.6) + 'V' + f(y + 0.6) + 'H' + f(x + w - 0.6) + '" fill="none" stroke="#9cf0e0" stroke-width=".4" opacity=".6"/>' +
      glyph(x + w / 2, y + h / 2, s, k, '#06272c');
  }
  /* rotated block placed on a limb/curve */
  function rblock(id, x, y, deg, w, h, k) {
    return '<g transform="translate(' + f(x) + ' ' + f(y) + ') rotate(' + f(deg) + ')">' +
      '<rect x="' + f(-w / 2 - 1.2) + '" y="' + f(-h / 2 - 1.2) + '" width="' + f(w + 2.4) + '" height="' + f(h + 2.4) + '" rx="1.4" fill="' + OL + '"/>' +
      block(id, -w / 2, -h / 2, w, h, k) + '</g>';
  }

  /* gold skull face. cy centres the visual mass */
  function skull(id, cx, cy, s) {
    return '<g transform="translate(' + cx + ' ' + cy + ') scale(' + s + ')">' +
      '<path d="M-5.4,-1C-6.4,-9.4 -2.6,-11 0,-11C2.6,-11 6.4,-9.4 5.4,-1C5.2,1 4,2.6 3.3,3.6L3.3,6.8L-3.3,6.8L-3.3,3.6C-4,2.6 -5.2,1 -5.4,-1Z" fill="url(#' + id('gold') + ')" stroke="' + OL + '" stroke-width="1.1" stroke-linejoin="round"/>' +
      '<ellipse cx="-2.4" cy="-3.6" rx="1.9" ry="2.3" fill="#0c0806"/><ellipse cx="2.4" cy="-3.6" rx="1.9" ry="2.3" fill="#0c0806"/>' +
      '<circle cx="-2.1" cy="-3.3" r=".8" fill="' + JADEL + '"/><circle cx="2.1" cy="-3.3" r=".8" fill="' + JADEL + '"/>' +
      '<path d="M0,-.7L-1.2,1.7H1.2Z" fill="#0c0806"/>' +
      '<path d="M-2.3,4.2V6.8M0,4.2V6.8M2.3,4.2V6.8M-3.3,4.2H3.3" stroke="' + OL + '" stroke-width=".55" fill="none"/>' +
      '<path d="M-1.6,-9.6L1.6,-9.6L0,-7.4Z" fill="' + JADE + '" stroke="' + OL + '" stroke-width=".5"/>' +
      '<path d="M-4.6,-7Q-3,-9.6 -1,-10" stroke="#fff3c0" stroke-width=".7" fill="none" opacity=".8" stroke-linecap="round"/></g>';
  }

  /* point/tangent on a quadratic */
  function qpt(p0, c, p1, t) {
    var u = 1 - t;
    return {
      x: u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0],
      y: u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1],
      tx: 2 * u * (c[0] - p0[0]) + 2 * t * (p1[0] - c[0]),
      ty: 2 * u * (c[1] - p0[1]) + 2 * t * (p1[1] - c[1])
    };
  }
  /* muscular limb along a quadratic: outline, skin, scales, highlight, then bands */
  function limb(id, p0, c, p1, wOut, wIn) {
    var d = 'M' + p0 + 'Q' + c + ' ' + p1;
    return '<path d="' + d + '" fill="none" stroke="' + OL + '" stroke-width="' + wOut + '" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="none" stroke="' + SKN + '" stroke-width="' + wIn + '" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="none" stroke="url(#' + id('scl') + ')" stroke-width="' + wIn + '" stroke-linecap="round"/>' +
      '<g transform="translate(-2 -1.5)"><path d="' + d + '" fill="none" stroke="' + SKNL + '" stroke-width="' + f(wIn * 0.28) + '" stroke-linecap="round" opacity=".7"/></g>';
  }
  function band(id, p0, c, p1, t, w, h, k) {
    var q = qpt(p0, c, p1, t), deg = Math.atan2(q.ty, q.tx) * 180 / Math.PI - 90;
    return rblock(id, q.x, q.y, deg, w, h, k);
  }

  function fist(id, x, y, rot) {
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')">' +
      '<path d="M-7.5,-6Q0,-9.5 7.5,-6Q10,0 7,6Q0,9 -7,6Q-10,0 -7.5,-6Z" fill="' + SKN + '" stroke="' + OL + '" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<path d="M-7.5,-6Q0,-9.5 7.5,-6Q10,0 7,6Q0,9 -7,6Q-10,0 -7.5,-6Z" fill="url(#' + id('scl') + ')"/>' +
      '<path d="M-3,-7.5V-1M0,-8V-1M3,-7.5V-1" stroke="' + SKND + '" stroke-width=".9"/>' +
      '<path d="M-6,0Q0,3 6,0M-5,3.5Q0,6 5,3.5" stroke="' + OL + '" stroke-width="1" fill="none" stroke-linecap="round"/>' +
      '<path d="M-6,-5Q-1,-8 4,-6.6" stroke="' + SKNL + '" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/></g>';
  }

  /* ---------- defs ---------- */
  function defs(id) {
    return '<defs>' +
      '<radialGradient id="' + id('skin') + '" cx=".35" cy=".28" r=".95"><stop offset="0" stop-color="#a06a36"/><stop offset=".5" stop-color="' + SKN + '"/><stop offset="1" stop-color="#3a200d"/></radialGradient>' +
      '<linearGradient id="' + id('obs') + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d3733"/><stop offset=".45" stop-color="#1c1613"/><stop offset="1" stop-color="#0a0706"/></linearGradient>' +
      '<linearGradient id="' + id('gold') + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe89a"/><stop offset=".38" stop-color="' + GOLDL + '"/><stop offset=".7" stop-color="' + GOLD + '"/><stop offset="1" stop-color="' + GOLDD + '"/></linearGradient>' +
      '<linearGradient id="' + id('jade') + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#57d0c2"/><stop offset=".45" stop-color="' + JADE + '"/><stop offset="1" stop-color="' + JADED + '"/></linearGradient>' +
      '<linearGradient id="' + id('bronze') + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6a5a48"/><stop offset=".35" stop-color="#2d241d"/><stop offset="1" stop-color="#0f0a07"/></linearGradient>' +
      '<radialGradient id="' + id('orb') + '" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#8ff0e6"/><stop offset=".3" stop-color="#2b9ea3"/><stop offset=".75" stop-color="#0c3a42"/><stop offset="1" stop-color="#04181c"/></radialGradient>' +
      '<radialGradient id="' + id('glow') + '"><stop offset="0" stop-color="#fff3b8" stop-opacity=".85"/><stop offset=".4" stop-color="#ffd23a" stop-opacity=".4"/><stop offset="1" stop-color="#ffb000" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + id('eye') + '" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#fff6c0"/><stop offset=".5" stop-color="#ffcf3a"/><stop offset="1" stop-color="#d98a10"/></radialGradient>' +
      '<pattern id="' + id('scl') + '" width="8" height="6" patternUnits="userSpaceOnUse"><path d="M0,0Q4,5 8,0M-4,3Q0,8 4,3M4,3Q8,8 12,3" fill="none" stroke="#2a1508" stroke-width=".55" opacity=".55"/></pattern>' +
      '<pattern id="' + id('fscl') + '" width="6" height="5" patternUnits="userSpaceOnUse"><path d="M0,0Q3,4 6,0M-3,2.5Q0,6.5 3,2.5M3,2.5Q6,6.5 9,2.5" fill="none" stroke="#8a93a0" stroke-width=".5" opacity=".55"/></pattern>' +
      '<pattern id="' + id('sscl') + '" width="4" height="3.4" patternUnits="userSpaceOnUse"><path d="M0,0Q2,2.6 4,0M-2,1.7Q0,4.3 2,1.7M2,1.7Q4,4.3 6,1.7" fill="none" stroke="#e8b55a" stroke-width=".4" opacity=".5"/></pattern>' +
      '<radialGradient id="' + id('pbg') + '" cx=".5" cy=".4" r=".75"><stop offset="0" stop-color="#1b5a5c"/><stop offset=".55" stop-color="#0d2a2e"/><stop offset="1" stop-color="#070c0e"/></radialGradient>' +
      '<clipPath id="' + id('pclip') + '"><rect x="0" y="0" width="120" height="120" rx="16"/></clipPath>' +
      '</defs>';
  }

  /* ---------- MANTLE (hair + feather cloak, behind the body) ---------- */
  var MT = [[106, 40], [120, 58], [146, 64], [172, 54], [194, 36], [214, 18], [224, 3]];
  function mantle(id, maxY) {
    var cx = 94, s = '';
    /* long black hair falling behind the shoulders */
    s += '<path d="M64,56C46,72 40,104 46,138L60,128L66,96Z" fill="url(#' + id('obs') + ')" stroke="' + OL + '" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M124,56C142,72 148,104 142,138L128,128L122,96Z" fill="url(#' + id('obs') + ')" stroke="' + OL + '" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M58,70Q50,96 52,124M63,80Q56,100 58,120M130,70Q138,96 136,124M125,80Q132,100 130,120" fill="none" stroke="#8d97a6" stroke-width=".7" opacity=".55" stroke-linecap="round"/>';
    /* underlay */
    var L = [], R = [];
    for (var y = 108; y <= 214; y += 7) {
      var hw = lerpTab(MT, y) - 5;
      L.push((cx - hw) + ',' + y); R.push((cx + hw) + ',' + y);
    }
    var lim = maxY || 300;
    s += '<path d="M' + L.join(' L') + ' L' + R.reverse().join(' L') + 'Z" fill="#0f0b09" stroke="' + OL + '" stroke-width="3" stroke-linejoin="round"/>';
    var row = 0;
    for (var yy = 110; yy <= 200; yy += 9, row++) {
      if (yy > lim) break;
      var w2 = lerpTab(MT, yy), n = Math.max(1, Math.round(w2 * 2 / 9.5)), step = n > 1 ? (w2 * 2) / (n - 1) : 0;
      for (var i = 0; i < n; i++) {
        var x = n > 1 ? cx - w2 + i * step : cx;
        var off = (row % 2) ? step * 0.25 : 0;
        x += off; if (x > cx + w2) continue;
        var ang = (cx - x) / Math.max(w2, 8) * 18;
        s += feather(x, yy, ang, 23 + (row > 6 ? 3 : 0), 6.6, FEA[(i + row) % 4]);
      }
    }
    return s;
  }
  /* small shoulder-draping feathers in front, over the mantle edge */
  function shoulderFeathers() {
    var s = '', i, x, y;
    for (i = 0; i < 4; i++) {
      s += feather(56 - i * 2.4, 112 + i * 6, 30 + i * 4, 16, 5.2, FEA[i % 4]);
      s += feather(132 + i * 2.4, 112 + i * 6, -30 - i * 4, 16, 5.2, FEA[(i + 1) % 4]);
    }
    return s;
  }

  /* ---------- SERPENTS ---------- */
  function serpentHead(id) {
    /* pointing +x, origin at the neck join */
    return '<path d="M-2,4L20,8Q27,9 26,13L4,17Q-6,16 -8,8Z" fill="url(#' + id('obs') + ')" stroke="' + OL + '" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M28,0L14,2L-2,4L4,12L21,10Z" fill="#6e1a17" stroke="' + OL + '" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<path d="M8,5.5Q13,9 19,8" stroke="#e05a4a" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/>' +
      '<path d="M-7,-8Q2,-16 16,-13Q25,-10 30,-3Q31,0 28,0L14,2L-2,4Q-9,2 -7,-8Z" fill="url(#' + id('obs') + ')" stroke="' + OL + '" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M-7,-8Q2,-16 16,-13Q25,-10 30,-3Q31,0 28,0L14,2L-2,4Q-9,2 -7,-8Z" fill="url(#' + id('fscl') + ')"/>' +
      '<path d="M22,1L24.5,9L19.5,1.6Z" fill="#fff6dc" stroke="' + OL + '" stroke-width=".8" stroke-linejoin="round"/>' +
      '<path d="M11,3L12.5,9L8.6,3.2Z" fill="#fff6dc" stroke="' + OL + '" stroke-width=".8" stroke-linejoin="round"/>' +
      '<path d="M-4,-9Q4,-14 15,-11.5" stroke="#9aa4b4" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".7"/>' +
      '<path d="M8,-11L11,-6L14,-9" fill="none" stroke="' + BOLT + '" stroke-width="1"/>' +
      '<ellipse cx="9.5" cy="-5" rx="3.3" ry="2.4" transform="rotate(14 9.5 -5)" fill="url(#' + id('eye') + ')" stroke="' + OL + '" stroke-width="1"/>' +
      '<ellipse cx="10" cy="-5" rx=".7" ry="1.9" fill="#1a0a04"/>' +
      '<path d="M5.5,-7.4Q9,-9 13.5,-7" stroke="' + OL + '" stroke-width="1.4" fill="none" stroke-linecap="round"/>' +
      '<circle cx="25" cy="-4" r=".9" fill="#000"/>' +
      '<path d="M0,-3L-3,-12" stroke="' + BOLT + '" stroke-width="0"/>';
  }
  function serpent(id, side) {
    /* side -1 = left of the viewer, +1 = right. Built for the left one, mirrored about x=94 for right */
    var body = 'M74,128C52,132 30,112 38,90C42,80 44,78 46,76';
    var s = '<path d="' + body + '" fill="none" stroke="' + OL + '" stroke-width="16" stroke-linecap="round"/>' +
      '<path d="' + body + '" fill="none" stroke="url(#' + id('obs') + ')" stroke-width="12" stroke-linecap="round"/>' +
      '<path d="' + body + '" fill="none" stroke="#c98a2b" stroke-width="10" stroke-dasharray="1.2 3.6" opacity=".55"/>' +
      '<path d="M73,123C54,127 36,110 42,92" fill="none" stroke="#9aa4b4" stroke-width="1.3" opacity=".6" stroke-linecap="round"/>' +
      crack([[70, 130], [62, 126], [58, 131], [50, 125], [44, 118], [40, 110], [43, 102], [38, 96]], 1.1) +
      /* hood */
      '<path d="M32,92Q34,74 48,70L54,82Q46,88 44,100Q36,102 32,92Z" fill="url(#' + id('obs') + ')" stroke="' + OL + '" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M32,92Q34,74 48,70L54,82Q46,88 44,100Q36,102 32,92Z" fill="url(#' + id('fscl') + ')"/>' +
      '<g transform="translate(50 76) scale(-1 1) rotate(-14)">' + serpentHead(id) + '</g>';
    if (side > 0) return '<g transform="translate(188 0) scale(-1 1)">' + s + '</g>';
    return s;
  }

  /* ---------- TORSO, ARMS, REGALIA ---------- */
  function torso(id) {
    var T = 'M68,114Q64,130 67,146Q69,157 76,160L112,160Q119,157 121,146Q124,130 120,114Q108,107 94,107Q80,107 68,114Z';
    return '<path d="' + T + '" fill="url(#' + id('skin') + ')" stroke="' + OL + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="' + T + '" fill="url(#' + id('scl') + ')"/>' +
      /* obsidian patches */
      '<path d="M69,116Q77,112 86,120Q84,130 76,132Q70,128 69,116Z M104,114Q116,112 120,122Q118,132 110,134Q104,126 104,114Z M99,148Q106,144 110,150Q108,156 100,155Z M72,140Q78,138 80,145Q77,150 72,148Z" fill="#171210" opacity=".88" stroke="#000" stroke-width=".6"/>' +
      '<path d="M72,118L79,121L82,127M107,118L112,123L116,126" fill="none" stroke="#5c6470" stroke-width=".6" opacity=".7"/>' +
      /* muscle lines */
      '<path d="M74,126Q84,144 94,138Q104,144 116,126" fill="none" stroke="' + SKND + '" stroke-width="1.5" stroke-linecap="round"/>' +
      '<path d="M94,138V158M84,147H104M85,153H103" fill="none" stroke="' + SKND + '" stroke-width="1.3" stroke-linecap="round"/>' +
      '<path d="M76,122Q82,130 88,132M100,132Q108,130 114,122" fill="none" stroke="' + SKNL + '" stroke-width="1.5" opacity=".7" stroke-linecap="round"/>' +
      '<path d="M90,150Q94,151 98,150" fill="none" stroke="' + SKNL + '" stroke-width="1" opacity=".5"/>' +
      crack([[112, 148], [116, 151], [114, 155], [118, 158]], .7) +
      crack([[74, 150], [78, 153], [76, 158]], .6);
  }
  function collar(id) {
    var s = '', n = 9, i;
    function O(t) { var q = qpt([64, 112], [94, 166], [124, 112], t); return [q.x, q.y]; }
    function I(t) { var q = qpt([76, 110], [94, 134], [112, 110], t); return [q.x, q.y]; }
    /* backing */
    s += '<path d="M64,112Q94,166 124,112L112,110Q94,134 76,110Z" fill="' + OL + '" stroke="' + OL + '" stroke-width="3.6" stroke-linejoin="round"/>';
    for (i = 0; i < n; i++) {
      var a = O(i / n), b = O(i / n + 1 / n), c = I(i / n + 1 / n), d = I(i / n);
      var mx = (a[0] + b[0] + c[0] + d[0]) / 4, my = (a[1] + b[1] + c[1] + d[1]) / 4;
      s += '<path d="M' + f(a[0]) + ',' + f(a[1]) + 'L' + f(b[0]) + ',' + f(b[1]) + 'L' + f(c[0]) + ',' + f(c[1]) + 'L' + f(d[0]) + ',' + f(d[1]) + 'Z" fill="url(#' + id('jade') + ')" stroke="' + GOLD + '" stroke-width="1.1" stroke-linejoin="round"/>' +
        glyph(mx, my, 6.2, i, '#06272c');
    }
    s += '<path d="M64,112Q94,166 124,112" fill="none" stroke="' + GOLDL + '" stroke-width="1.2" opacity=".9"/>' +
      '<path d="M76,110Q94,134 112,110" fill="none" stroke="' + GOLDL + '" stroke-width="1"/>';
    /* gold beads on the outer edge */
    for (i = 1; i < n; i++) { var p = O(i / n); s += '<circle cx="' + f(p[0]) + '" cy="' + f(p[1] + 0.5) + '" r="1.3" fill="' + GOLDL + '" stroke="' + OL + '" stroke-width=".6"/>'; }
    /* pendant */
    s += '<path d="M89,138Q94,140 99,138L98,144L90,144Z" fill="' + OL + '"/>' +
      '<rect x="89" y="136" width="10" height="3.4" rx="1" fill="url(#' + id('gold') + ')" stroke="' + OL + '" stroke-width="1"/>' +
      skull(id, 94, 144, 0.92);
    s += '<path d="M94,158V163" stroke="' + OL + '" stroke-width="0"/>';
    return s;
  }
  function shoulderPlate(id, x, flip) {
    /* jade-and-gold plate over the shoulder; x = centre */
    var g = '<g transform="translate(' + x + ' 116)' + (flip ? ' scale(-1 1)' : '') + '">' +
      '<path d="M-13,10Q-15,-8 0,-11Q14,-8 12,10Q6,13 -3,13Z" fill="' + OL + '" stroke="' + OL + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M-13,10Q-15,-8 0,-11Q14,-8 12,10Q6,13 -3,13Z" fill="url(#' + id('gold') + ')"/>' +
      '<path d="M-9.5,8Q-10.5,-5 0,-7.5Q10,-5 8.5,8Q4,10 -3,10Z" fill="url(#' + id('jade') + ')" stroke="' + GOLDD + '" stroke-width=".8"/>' +
      '<rect x="-6" y="-4" width="12" height="4" rx=".6" fill="' + JADED + '" stroke="' + GOLD + '" stroke-width=".7"/>' + glyph(0, -2, 3.2, 1, '#7ff0e0') +
      '<rect x="-6.5" y="1.5" width="6" height="5" rx=".6" fill="' + JADED + '" stroke="' + GOLD + '" stroke-width=".7"/>' + glyph(-3.5, 4, 3, 3, '#7ff0e0') +
      '<rect x="1" y="1.5" width="6" height="5" rx=".6" fill="' + JADED + '" stroke="' + GOLD + '" stroke-width=".7"/>' + glyph(4, 4, 3, 0, '#7ff0e0') +
      '<circle cx="-9" cy="9" r="1.3" fill="' + GOLDL + '" stroke="' + OL + '" stroke-width=".5"/><circle cx="7" cy="9.5" r="1.3" fill="' + GOLDL + '" stroke="' + OL + '" stroke-width=".5"/>' +
      '<path d="M-8,-6Q-4,-10 2,-9.6" stroke="#fff3c0" stroke-width="1" fill="none" opacity=".7" stroke-linecap="round"/>' +
      '</g>';
    return g;
  }
  function beltAndSkirt(id) {
    var s = '', i, r, x;
    s += '<path d="M62,160L126,160L123,186L94,198L65,186Z" fill="#0f0b09" stroke="' + OL + '" stroke-width="2.6" stroke-linejoin="round"/>';
    for (r = 0; r < 3; r++) {
      for (i = 0; i < 9; i++) {
        x = 64 + i * 7.6 + (r % 2 ? 3.8 : 0);
        if (x > 126) continue;
        s += feather(x, 164 + r * 8.5, (94 - x) / 30 * 15, 17 + r * 1.5, 5.6, FEA[(i + r * 2) % 4]);
      }
    }
    return s;
  }
  function apron(id) {
    var s = '<path d="M83,168H105V210L94,220L83,210Z" fill="' + OL + '" stroke="' + OL + '" stroke-width="3.4" stroke-linejoin="round"/>' +
      '<path d="M83,168H105V210L94,220L83,210Z" fill="url(#' + id('gold') + ')"/>';
    var ys = [170, 178.5, 187, 195.5, 204], k;
    for (k = 0; k < 5; k++) s += block(id, 85.5, ys[k], 17, 7, k + 1);
    s += '<path d="M85.5,210L94,217.5L102.5,210Z" fill="url(#' + id('jade') + ')" stroke="' + GOLDD + '" stroke-width=".8"/>' +
      '<circle cx="94" cy="211.5" r="1.4" fill="' + GOLDL + '" stroke="' + OL + '" stroke-width=".5"/>' +
      '<path d="M83.6,170V209" stroke="#fff3c0" stroke-width=".6" opacity=".6"/>';
    /* hanging beads */
    s += '<circle cx="85" cy="218" r="1.8" fill="' + JADE + '" stroke="' + OL + '" stroke-width=".8"/><circle cx="103" cy="218" r="1.8" fill="' + JADE + '" stroke="' + OL + '" stroke-width=".8"/>';
    return s;
  }
  function belt(id) {
    return '<path d="M64,157H124V169H64Z" fill="' + OL + '" stroke="' + OL + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<rect x="64" y="157" width="60" height="12" fill="url(#' + id('gold') + ')"/>' +
      block(id, 66, 159, 8, 8, 0) + block(id, 76, 159, 8, 8, 2) + block(id, 104, 159, 8, 8, 4) + block(id, 114, 159, 8, 8, 1) +
      '<path d="M64,160.5H124M64,165.5H124" stroke="' + GOLDD + '" stroke-width=".6" opacity=".7"/>' +
      '<circle cx="94" cy="163" r="10.5" fill="' + OL + '"/><circle cx="94" cy="163" r="9.2" fill="url(#' + id('jade') + ')" stroke="' + GOLD + '" stroke-width="1.6"/>' +
      '<circle cx="94" cy="163" r="7" fill="none" stroke="' + GOLDL + '" stroke-width=".7"/>' +
      skull(id, 94, 165.4, 0.78) +
      '';
  }

  /* ---------- LEGS ---------- */
  function leg(id, x) {
    var cx = x + 9;
    return '<path d="M' + x + ',184L' + (x + 18) + ',184L' + (x + 17) + ',207L' + (x + 1) + ',207Z" fill="' + SKN + '" stroke="' + OL + '" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<path d="M' + x + ',184L' + (x + 18) + ',184L' + (x + 17) + ',207L' + (x + 1) + ',207Z" fill="url(#' + id('scl') + ')"/>' +
      '<path d="M' + (x + 3) + ',188Q' + (x + 2) + ',198 ' + (x + 4) + ',204" stroke="' + SKNL + '" stroke-width="1.6" fill="none" opacity=".7" stroke-linecap="round"/>' +
      /* greave */
      '<path d="M' + (cx - 12.5) + ',203L' + (cx + 12.5) + ',203L' + (cx + 10) + ',222L' + (cx - 10) + ',222Z" fill="' + OL + '" stroke="' + OL + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M' + (cx - 12) + ',203L' + (cx + 12) + ',203L' + (cx + 9.5) + ',222L' + (cx - 9.5) + ',222Z" fill="url(#' + id('jade') + ')"/>' +
      '<path d="M' + (cx - 12) + ',203H' + (cx + 12) + 'V208H' + (cx - 12) + 'Z" fill="url(#' + id('gold') + ')" stroke="' + OL + '" stroke-width=".8"/>' +
      '<path d="M' + (cx - 10) + ',219.5H' + (cx + 10) + 'V222H' + (cx - 10) + 'Z" fill="url(#' + id('gold') + ')" stroke="' + OL + '" stroke-width=".8"/>' +
      block(id, cx - 6, 209, 12, 4.6, 1) + block(id, cx - 6, 214.2, 12, 4.6, 3) +
      '<circle cx="' + (cx - 9) + '" cy="205.5" r="1" fill="' + OL + '"/><circle cx="' + (cx + 9) + '" cy="205.5" r="1" fill="' + OL + '"/>' +
      '<path d="M' + (cx - 11) + ',209L' + (cx - 9.5) + ',220" stroke="#9cf0e0" stroke-width=".7" opacity=".5"/>' +
      /* sandal */
      '<path d="M' + (x - 3) + ',223L' + (x + 21) + ',222Q' + (x + 31) + ',224 ' + (x + 33) + ',228.5L' + (x + 32) + ',230.5L' + (x - 4) + ',230.5Q' + (x - 6) + ',226 ' + (x - 3) + ',223Z" fill="' + SKN + '" stroke="' + OL + '" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M' + (x - 4.5) + ',228.2H' + (x + 32.5) + 'L' + (x + 32) + ',230.5L' + (x - 4) + ',230.5Z" fill="#2a170a" stroke="' + OL + '" stroke-width="1"/>' +
      '<path d="M' + (x + 20) + ',222.5L' + (x + 22) + ',228M' + (x + 24) + ',223.5L' + (x + 26) + ',228.4" stroke="' + OL + '" stroke-width=".8" fill="none"/>' +
      '<path d="M' + (x + 2) + ',223.5L' + (x + 4) + ',228M' + (x + 8) + ',222.5L' + (x + 10) + ',228M' + (x + 14) + ',222.5L' + (x + 16) + ',228" stroke="#3b220f" stroke-width="2.4" fill="none"/>' +
      '<path d="M' + (x - 2) + ',225.5H' + (x + 26) + '" stroke="#5a3418" stroke-width="2.2" fill="none"/>' +
      '<circle cx="' + (x + 9) + '" cy="225.6" r="1.7" fill="' + JADE + '" stroke="' + GOLD + '" stroke-width=".8"/>' +
      '<circle cx="' + (x + 19) + '" cy="225.6" r="1.4" fill="' + JADE + '" stroke="' + GOLD + '" stroke-width=".8"/>' +
      '<path d="M' + (x + 26) + ',225.2Q' + (x + 30) + ',225.4 ' + (x + 31) + ',227.6" stroke="' + SKNL + '" stroke-width="1.2" fill="none" opacity=".8"/>';
  }

  /* ---------- ARMS ---------- */
  function leftArm(id) {
    var p0 = '68,120', c = '48,130', p1 = '52,157';
    var a0 = [68, 120], ac = [48, 130], a1 = [52, 157];
    return limb(id, p0, c, p1, 19, 15) +
      band(id, a0, ac, a1, 0.38, 17, 5.5, 2) +
      band(id, a0, ac, a1, 0.84, 15, 8, 4) +
      fist(id, 52, 164, 4);
  }
  /* right arm (holds the scepter) — lives inside part-weapon */
  var RA = { a0: [120, 120], ac: [150, 124], a1: [157, 142] };
  function rightArm(id) {
    var a = RA;
    return limb(id, a.a0.join(','), a.ac.join(','), a.a1.join(','), 19, 15) +
      band(id, a.a0, a.ac, a.a1, 0.4, 17, 5.5, 3) +
      band(id, a.a0, a.ac, a.a1, 0.82, 15, 7, 1);
  }
  /* scepter axis: top at (SX,SY), tilted slightly */
  var SX = 171, SY = 8, SANG = 6.2;
  function scepter(id) {
    var G = 'url(#' + id('gold') + ')', J = 'url(#' + id('jade') + ')', B = 'url(#' + id('bronze') + ')';
    var s = '<g transform="translate(' + SX + ' ' + SY + ') rotate(' + SANG + ')">';
    s += '<circle cx="0" cy="48" r="30" fill="url(#' + id('glow') + ')"/>';
    /* shaft */
    s += '<rect x="-3.4" y="70" width="6.8" height="136" fill="' + OL + '" stroke="' + OL + '" stroke-width="2"/>' +
      '<rect x="-2.6" y="70" width="5.2" height="136" fill="' + B + '"/>' +
      '<path d="M-1.4,72V204" stroke="#a8b0bc" stroke-width=".6" opacity=".55"/>';
    var ys = [96, 122, 150, 178], k;
    for (k = 0; k < 4; k++) {
      s += '<rect x="-4.2" y="' + ys[k] + '" width="8.4" height="3.6" rx="1" fill="' + G + '" stroke="' + OL + '" stroke-width="1"/>' +
        '<rect x="-3.4" y="' + (ys[k] + 6) + '" width="6.8" height="9" rx="1" fill="' + J + '" stroke="' + GOLD + '" stroke-width=".9"/>' +
        glyph(0, ys[k] + 10.5, 6, k, '#06272c');
    }
    /* spear-like butt */
    s += '<rect x="-4.4" y="199" width="8.8" height="5" rx="1" fill="' + G + '" stroke="' + OL + '" stroke-width="1"/>' +
      '<path d="M-3.6,204L0,224L3.6,204Z" fill="' + B + '" stroke="' + OL + '" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M-1.2,206L0,220" stroke="#c7ced8" stroke-width=".7" opacity=".7"/>';
    /* outer prongs */
    var pr = 'M-4,66C-14,63 -22,44 -19.6,4L-18,-1L-15.4,4C-15,24 -13,40 -5.5,52Z';
    s += '<path d="' + pr + '" fill="' + OL + '" stroke="' + OL + '" stroke-width="3.4" stroke-linejoin="round"/>' +
      '<path d="' + pr + '" fill="' + B + '"/>' +
      '<g transform="scale(-1 1)"><path d="' + pr + '" fill="' + OL + '" stroke="' + OL + '" stroke-width="3.4" stroke-linejoin="round"/><path d="' + pr + '" fill="' + B + '"/></g>';
    var pn;
    for (pn = -1; pn <= 1; pn += 2) {
      s += '<g transform="scale(' + pn + ' 1)">' +
        '<path d="M-20.6,50C-23.4,40 -22,24 -19.4,6" fill="none" stroke="' + GOLDL + '" stroke-width="1.3" stroke-linecap="round"/>' +
        '<path d="M-15.8,10C-14.6,26 -12.4,40 -5.4,52" fill="none" stroke="' + GOLD + '" stroke-width="1"/>' +
        '<path d="M-13.6,34L-8.6,28.5L-10,37Z" fill="' + B + '" stroke="' + OL + '" stroke-width="1.2" stroke-linejoin="round"/>' +
        '<path d="M-21.4,50L-19.4,46.6L-17.4,50L-19.4,53.4Z" fill="' + J + '" stroke="' + GOLD + '" stroke-width=".8"/>' +
        '<path d="M-22.8,38L-20.8,34.6L-18.8,38L-20.8,41.4Z" fill="' + J + '" stroke="' + GOLD + '" stroke-width=".8"/>' +
        '<path d="M-21.4,25L-19.6,22L-17.8,25L-19.6,28Z" fill="' + J + '" stroke="' + GOLD + '" stroke-width=".8"/>' +
        '<path d="M-20,14L-18.4,11.5L-16.8,14L-18.4,16.5Z" fill="' + G + '" stroke="' + OL + '" stroke-width=".5"/>' +
        '<path d="M-24.6,46Q-26,38 -23,28" stroke="#c7ced8" stroke-width=".8" fill="none" opacity=".55" stroke-linecap="round"/>' +
        '</g>';
    }
    /* central spike */
    s += '<path d="M0,7L3.2,22L2.4,38L-2.4,38L-3.2,22Z" fill="' + OL + '" stroke="' + OL + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M0,7L3.2,22L2.4,38L-2.4,38L-3.2,22Z" fill="' + B + '"/>' +
      '<path d="M-1,11L-1.8,32" stroke="#c7ced8" stroke-width=".7" opacity=".7"/>' +
      '<path d="M0,28L5.4,34L0,42L-5.4,34Z" fill="' + G + '" stroke="' + OL + '" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<path d="M0,31L2.2,34L0,37.4L-2.2,34Z" fill="' + J + '"/>';
    /* cradle + orb */
    s += '<path d="M-17,50Q-17,74 0,74Q17,74 17,50L11.5,50Q11.5,66 0,66Q-11.5,66 -11.5,50Z" fill="' + OL + '" stroke="' + OL + '" stroke-width="3.4" stroke-linejoin="round"/>' +
      '<path d="M-17,50Q-17,74 0,74Q17,74 17,50L11.5,50Q11.5,66 0,66Q-11.5,66 -11.5,50Z" fill="' + B + '"/>' +
      '<path d="M-14.5,52Q-14,68 0,71.4" stroke="' + GOLDL + '" stroke-width="1.2" fill="none"/>' +
      '<circle cx="0" cy="52" r="12.6" fill="url(#' + id('glow') + ')"/>' +
      '<circle cx="0" cy="52" r="9.4" fill="url(#' + id('orb') + ')" stroke="' + OL + '" stroke-width="1.4"/>' +
      '<circle cx="0" cy="52" r="11.2" fill="none" stroke="' + GOLD + '" stroke-width="2.4"/>' +
      '<circle cx="0" cy="52" r="12.5" fill="none" stroke="' + OL + '" stroke-width="1"/>' +
      '<circle cx="0" cy="52" r="10" fill="none" stroke="' + GOLDL + '" stroke-width=".6" opacity=".8"/>' +
      '<path d="M-5,47Q-2,44 2,45" stroke="#e6fffb" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".9"/>' +
      '<path d="M-3,55L0,49L2,54L5,50" stroke="' + BOLT + '" stroke-width=".8" fill="none" opacity=".8"/>';
    /* neck block with jade + hanging beads */
    s += '<path d="M-6,72H6L4.6,88H-4.6Z" fill="' + OL + '" stroke="' + OL + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M-6,72H6L4.6,88H-4.6Z" fill="' + J + '"/>' +
      '<rect x="-7" y="72" width="14" height="3.6" rx="1" fill="' + G + '" stroke="' + OL + '" stroke-width="1"/>' +
      '<rect x="-5.6" y="86" width="11.2" height="3.6" rx="1" fill="' + G + '" stroke="' + OL + '" stroke-width="1"/>' +
      glyph(0, 81, 6.4, 1, '#06272c');
    /* side spurs + chains */
    s += '<path d="M-6,78Q-14,78 -15,88" fill="none" stroke="' + OL + '" stroke-width="2.6" stroke-linecap="round"/><path d="M-6,78Q-14,78 -15,88" fill="none" stroke="' + GOLD + '" stroke-width="1.2" stroke-linecap="round"/>' +
      '<path d="M6,78Q14,78 15,88" fill="none" stroke="' + OL + '" stroke-width="2.6" stroke-linecap="round"/><path d="M6,78Q14,78 15,88" fill="none" stroke="' + GOLD + '" stroke-width="1.2" stroke-linecap="round"/>' +
      '<path d="M-15,88V93M15,88V98" stroke="' + GOLDD + '" stroke-width="1"/>' +
      '<circle cx="-15" cy="96" r="3.4" fill="' + J + '" stroke="' + OL + '" stroke-width="1.2"/><circle cx="-15.8" cy="95" r="1" fill="#c8fff4" opacity=".8"/>' +
      '<circle cx="15" cy="101" r="3.4" fill="' + J + '" stroke="' + OL + '" stroke-width="1.2"/><circle cx="14.2" cy="100" r="1" fill="#c8fff4" opacity=".8"/>' +
      '<path d="M0,90V94" stroke="' + GOLDD + '" stroke-width="1"/><circle cx="0" cy="97" r="2.6" fill="' + G + '" stroke="' + OL + '" stroke-width="1"/>';
    /* lightning around the head */
    s += bolt([[-24, 14], [-29, 20], [-25, 25], [-31, 33]], 1.3) +
      bolt([[22, 8], [28, 15], [24, 20], [30, 28]], 1.3) +
      bolt([[6, 6], [10, 13], [7, 18], [12, 26]], 1) +
      bolt([[-14, 44], [-19, 48], [-16, 53], [-21, 59]], 1.1) +
      bolt([[14, 42], [20, 47], [16, 52], [21, 57]], 1.1) +
      bolt([[-6, -1], [-10, 5], [-8, 9]], .9);
    return s + '</g>';
  }
  /* hand gripping the shaft, drawn over it (world coords) */
  function grip(id) {
    /* shaft at y=140: x = SX - tan(a)*(140-SY) */
    var hx = SX - Math.tan(SANG * Math.PI / 180) * (142 - SY);
    return '<g transform="translate(' + f(hx) + ' 142) rotate(' + (-SANG) + ')">' +
      '<path d="M-8,-8Q0,-11 8,-8Q10,0 8,8Q0,11 -8,8Q-10,0 -8,-8Z" fill="' + SKN + '" stroke="' + OL + '" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M-8,-8Q0,-11 8,-8Q10,0 8,8Q0,11 -8,8Q-10,0 -8,-8Z" fill="url(#' + id('scl') + ')"/>' +
      '<path d="M-7,-3H7M-7,2.4H7M-6.5,7H6.5" stroke="' + OL + '" stroke-width="1.1" stroke-linecap="round"/>' +
      '<path d="M-7.5,-6.6Q-3,-9 3,-8.4" stroke="' + SKNL + '" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".85"/>' +
      '<path d="M-9,-5Q-13,-9 -9,-12Q-4,-11 -2,-6" fill="' + SKN + '" stroke="' + OL + '" stroke-width="1.8" stroke-linejoin="round"/>' +
      '</g>';
  }

  /* ---------- HEAD ---------- */
  function head(id, withEyes) {
    var s = '', ec = withEyes ? ' class="part-eyes" style="transform-origin: 93px 85px"' : '';
    /* ear spools */
    var ear = function (x, sg) {
      return '<ellipse cx="' + x + '" cy="86" rx="4.4" ry="8" fill="' + SKN + '" stroke="' + OL + '" stroke-width="2"/>' +
        '<path d="M' + (x + 22 * 0) + ',99V103" stroke="' + GOLDD + '" stroke-width="1"/>' +
        '<circle cx="' + (x - sg * 1) + '" cy="93" r="7.4" fill="' + OL + '"/>' +
        '<circle cx="' + (x - sg * 1) + '" cy="93" r="6.4" fill="url(#' + id('gold') + ')"/>' +
        '<circle cx="' + (x - sg * 1) + '" cy="93" r="4.6" fill="url(#' + id('jade') + ')" stroke="' + OL + '" stroke-width=".8"/>' +
        '<circle cx="' + (x - sg * 1) + '" cy="93" r="1.7" fill="' + GOLDL + '" stroke="' + OL + '" stroke-width=".5"/>' +
        '<path d="M' + (x - sg * 4) + ',89.4Q' + (x - sg * 2.6) + ',87.6 ' + (x - sg * .4) + ',87.4" stroke="#fff3c0" stroke-width=".8" fill="none" opacity=".8"/>' +
        '<path d="M' + (x - sg * 1) + ',99.6V104" stroke="' + OL + '" stroke-width="2.4"/><path d="M' + (x - sg * 1) + ',99.6V104" stroke="' + GOLD + '" stroke-width="1"/>' +
        '<circle cx="' + (x - sg * 1) + '" cy="106.4" r="2.6" fill="url(#' + id('jade') + ')" stroke="' + OL + '" stroke-width="1"/>';
    };
    s += ear(63, 1) + ear(123, -1);
    /* face */
    var FACE = 'M64,80C62,58 76,50 93,50C110,50 123,58 122,80C122,98 109,111 93,112C77,111 65,98 64,80Z';
    s += '<path d="' + FACE + '" fill="url(#' + id('skin') + ')" stroke="' + OL + '" stroke-width="3.2" stroke-linejoin="round"/>' +
      '<path d="' + FACE + '" fill="url(#' + id('scl') + ')" opacity=".8"/>' +
      '<path d="M112,62Q123,72 121,88Q119,102 106,110Q116,96 112,62Z" fill="#2a1408" opacity=".38"/>' +
      '<path d="M66,84Q66,72 72,66" stroke="' + SKNL + '" stroke-width="2" fill="none" opacity=".7" stroke-linecap="round"/>' +
      crack([[70, 100], [74, 103], [72, 108]], .6) + crack([[116, 96], [113, 100], [115, 104]], .6);
    /* jade markings */
    s += '<path d="M65,70Q78,62 93,69Q108,62 121,70L119,76Q108,70 93,75Q78,70 67,76Z" fill="url(#' + id('jade') + ')" stroke="' + OL + '" stroke-width="1.2" stroke-linejoin="round"/>' +
      '<path d="M93,66.4L96.4,71.6L93,77L89.6,71.6Z" fill="url(#' + id('gold') + ')" stroke="' + OL + '" stroke-width=".9"/>' +
      '<path d="M68,71Q78,65 88,71M98,71Q108,65 118,71" stroke="#a5f4e6" stroke-width=".7" fill="none" opacity=".7"/>' +
      '<path d="M67,80L71,86L66,90Z M119,80L115,86L120,90Z M73,93L81,95L76,100Z M113,93L105,95L110,100Z M66,95L72,99L67,103Z M120,95L114,99L119,103Z" fill="url(#' + id('jade') + ')" stroke="' + OL + '" stroke-width=".9" stroke-linejoin="round"/>';
    /* brows */
    s += '<path d="M68,77Q80,73 91,81L90.6,84.5Q80,79 69,82Z" fill="' + OL + '"/><path d="M118,77Q106,73 95,81L95.4,84.5Q106,79 117,82Z" fill="' + OL + '"/>';
    /* eyes */
    s += '<g' + ec + '>' +
      '<circle cx="80" cy="85.5" r="12" fill="url(#' + id('glow') + ')"/><circle cx="107" cy="85.5" r="12" fill="url(#' + id('glow') + ')"/>' +
      '<path d="M71,83Q80,79 90,86.5Q80,92 71,83Z" fill="url(#' + id('eye') + ')" stroke="' + OL + '" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<path d="M116,83Q107,79 97,86.5Q107,92 116,83Z" fill="url(#' + id('eye') + ')" stroke="' + OL + '" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<ellipse cx="82" cy="85.4" rx="2.6" ry="3.6" fill="#24110a"/><ellipse cx="105" cy="85.4" rx="2.6" ry="3.6" fill="#24110a"/>' +
      '<circle cx="80.8" cy="83.8" r="1.1" fill="#fff"/><circle cx="103.8" cy="83.8" r="1.1" fill="#fff"/>' +
      '<path d="M70.5,83.4Q80,78 90.6,86.6M116.5,83.4Q107,78 96.4,86.6" fill="none" stroke="' + OL + '" stroke-width="2.6" stroke-linecap="round"/>' +
      '</g>';
    /* nose, mouth, chin ornament */
    s += '<path d="M91,88Q89,97 86.6,100Q93,104 99.4,100Q97,97 95,88Z" fill="' + SKN + '" stroke="' + OL + '" stroke-width="1.2" stroke-linejoin="round"/>' +
      '<path d="M91.4,89Q90.6,95 89,98" stroke="' + SKNL + '" stroke-width="1.2" fill="none" opacity=".85" stroke-linecap="round"/>' +
      '<ellipse cx="89.8" cy="100" rx="1.2" ry=".8" fill="#1a0c05"/><ellipse cx="96.2" cy="100" rx="1.2" ry=".8" fill="#1a0c05"/>' +
      '<path d="M80,105.4Q93,102.4 106,105.4" stroke="' + OL + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
      '<path d="M80,105.4L78.6,108.6M106,105.4L107.4,108.6" stroke="' + OL + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
      '<path d="M86,108Q93,110.4 100,108" stroke="' + SKNL + '" stroke-width="1.2" fill="none" opacity=".7" stroke-linecap="round"/>' +
      '<path d="M93,110.6V113.6" stroke="' + OL + '" stroke-width="2"/><circle cx="93" cy="115" r="2.8" fill="url(#' + id('gold') + ')" stroke="' + OL + '" stroke-width="1"/><circle cx="93" cy="115" r="1.1" fill="' + JADE + '"/>';
    /* crown */
    var CR = 'M62,68L57,54L66,56L63,38L73,47L73,26L83,38Q89,26 93,2Q97,26 103,38L113,26L113,47L123,38L120,56L129,54L124,68Q108,56 93,63Q78,56 62,68Z';
    s += '<path d="' + CR + '" fill="' + OL + '" stroke="' + OL + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="' + CR + '" fill="url(#' + id('obs') + ')"/>' +
      '<path d="' + CR + '" fill="url(#' + id('fscl') + ')"/>' +
      '<path d="M93,4Q89,26 83,38M73,28V46M64,40L66,54M58,55L62,66M113,28V47M123,40L120,54" fill="none" stroke="#a3adbc" stroke-width="1.1" opacity=".65" stroke-linecap="round"/>' +
      '<path d="M69,64Q80,54 93,60Q106,54 117,64" fill="none" stroke="#8b95a4" stroke-width=".8" opacity=".55"/>' +
      crack([[93, 7], [91, 17], [95, 26], [91, 36], [94, 46], [92, 60]], 1.5) +
      crack([[91, 26], [85, 30], [83, 39]], 1) + crack([[95, 33], [102, 36], [104, 45]], 1) +
      crack([[88, 46], [79, 48], [75, 56]], 1) + crack([[97, 49], [106, 51], [111, 59]], 1) +
      crack([[73, 29], [76, 37], [72, 45]], .9) + crack([[113, 29], [110, 37], [114, 45]], .9) +
      crack([[64, 42], [67, 49]], .8) + crack([[122, 42], [119, 50]], .8);
    /* lightning above the crown */
    s += bolt([[70, 22], [63, 16], [68, 11], [60, 4]], 1.2) +
      bolt([[116, 24], [123, 18], [118, 12], [127, 5]], 1.2) +
      bolt([[85, 15], [79, 10], [83, 5]], 1) + bolt([[101, 14], [107, 9], [102, 4]], 1);
    return s;
  }

  /* ---------- assembly ---------- */
  function figure(id) {
    var s = '';
    s += '<g class="part-cape" style="transform-origin: 94px 112px">' + mantle(id) + '</g>';
    s += '<g class="part-cape" style="transform-origin: 74px 122px">' + serpent(id, -1) + '</g>';
    s += '<g class="part-cape" style="transform-origin: 114px 122px">' + serpent(id, 1) + '</g>';
    s += leg(id, 68) + leg(id, 100);
    s += torso(id);
    s += leftArm(id);
    s += shoulderPlate(id, 62, false);
    s += shoulderFeathers();
    s += '<g class="part-cape" style="transform-origin: 94px 164px">' + beltAndSkirt(id) + apron(id) + '</g>';
    s += belt(id);
    s += collar(id);
    s += '<g class="part-weapon" style="transform-origin: 122px 118px">' + scepter(id) + rightArm(id) + grip(id) + shoulderPlate(id, 126, true) + '</g>';
    s += '<g class="part-head" style="transform-origin: 93px 108px">' + head(id, true) + '</g>';
    return s;
  }

  function mk(uid, pre) {
    uid = uid == null ? '' : String(uid);
    return function (n) { return 'polynesian-' + n + '-' + pre + uid; };
  }

  function svg(uid) {
    var id = mk(uid, '');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240">' + defs(id) +
      '<g transform="translate(-3 0)">' +
      '<ellipse class="part-shadow" cx="96" cy="229" rx="62" ry="7.5" fill="#000" opacity="0.24"/>' +
      '<g class="part-body">' + figure(id) + '</g></g></svg>';
  }

  function portrait(uid) {
    var id = mk(uid, 'p');
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' + defs(id) +
      '<g clip-path="url(#' + id('pclip') + ')">' +
      '<rect width="120" height="120" fill="url(#' + id('pbg') + ')"/>' +
      '<path d="M0,96L20,84L14,72L34,66" fill="none" stroke="' + JADE + '" stroke-width="0"/>' +
      '<g opacity=".55"><path d="M8,8h20v4H12v8h-4Z M112,8h-20v4h16v8h4Z M8,112h20v-4H12v-8h-4Z M112,112h-20v-4h16v-8h4Z" fill="' + GOLD + '"/></g>' +
      '<circle cx="60" cy="58" r="46" fill="url(#' + id('glow') + ')" opacity=".5"/>' +
      '<g opacity=".8">' + bolt([[6, 40], [14, 48], [9, 54], [18, 64]], 1.1) + bolt([[114, 30], [106, 40], [111, 46], [102, 56]], 1.1) + '</g>' +
      '<g transform="translate(-14.5 -1.5) scale(0.82)">' +
      serpent(id, -1) + serpent(id, 1) +
      mantle(id, 152) +
      torso(id) + shoulderPlate(id, 62, false) + shoulderPlate(id, 126, true) + shoulderFeathers() + collar(id) +
      head(id, false) +
      '</g></g>' +
      '<rect x="1.5" y="1.5" width="117" height="117" rx="15" fill="none" stroke="' + OL + '" stroke-width="3"/>' +
      '<rect x="4.6" y="4.6" width="110.8" height="110.8" rx="12.5" fill="none" stroke="' + GOLD + '" stroke-width="1.3" opacity=".9"/>' +
      '</svg>';
    return s;
  }

  window.HEROES = window.HEROES || {};
  window.HEROES.polynesian = {
    key: 'polynesian',
    name: 'K’awiil',
    title: 'God of Storm',
    lore: 'The Maya god of storm, fire and royal power, K’awiil calls lightning down through his sacred scepter and crowns kings in its thunder. His twin serpents strike wherever the storm points.',
    color: '#d9a03a',
    base: { hp: 580, atk: 95, def: 20 },
    fx: { slash: '#ffd23a', glow: '#fff3b8' },
    signature: { name: 'Serpent Bite', desc: 'Heal 15% of damage dealt as HP (lifesteal).', type: 'lifesteal' },
    svg: svg,
    portrait: portrait
  };
})();

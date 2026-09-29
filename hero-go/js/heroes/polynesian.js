/* Hero Go! — K’awiil, God of Storm (key: polynesian)
 * Hand-authored inline SVG, realistic painted proportions (~7.5 heads), facing right.
 * Maya god of storm, lightning and royal power: obsidian crown with golden lightning
 * cracks, twin cobras, heavy black feather mantle, jade-and-gold regalia, skull-face
 * pendant/buckle and the sacred trident scepter.  viewBox 0 0 180 300.
 * All artwork is authored in "sheet" coordinates (460 x 1000) and wrapped in a
 * scale transform; part-* groups carry origins in real viewBox units.
 */
(function () {
  'use strict';

  var OL = '#150c06';
  var S = 0.294, TX = 16, TY = 1;
  function vx(x) { return +(TX + S * x).toFixed(1); }
  function vy(y) { return +(TY + S * y).toFixed(1); }
  function T(inner) { return '<g transform="translate(' + TX + ' ' + TY + ') scale(' + S + ')">' + inner + '</g>'; }
  function f(n) { return +n.toFixed(1); }
  function rng(seed) { var s = seed; return function () { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }
  function pts(a) { return a.map(function (p) { return p[0] + ',' + p[1]; }).join(' L'); }

  /* jagged bolt: golden glow + core */
  function bolt(a, w, glow) {
    var d = 'M' + pts(a);
    return '<path d="' + d + '" fill="none" stroke="#ffb000" stroke-opacity="' + (glow || 0.28) + '" stroke-width="' + f(w * 3.6) + '" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="none" stroke="#ffd23a" stroke-width="' + w + '" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="none" stroke="#fff6cc" stroke-width="' + f(w * 0.38) + '" stroke-linejoin="round" stroke-linecap="round"/>';
  }
  function crack(a, w) {
    var d = 'M' + pts(a);
    return '<path d="' + d + '" fill="none" stroke="#ff9d00" stroke-opacity=".35" stroke-width="' + f(w * 2.4) + '" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="none" stroke="#ffd23a" stroke-width="' + w + '" stroke-linejoin="round" stroke-linecap="round"/>';
  }
  /* zigzag between two points */
  function zig(x1, y1, x2, y2, n, amp, seed) {
    var r = rng(seed), a = [[x1, y1]], dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy), nx = -dy / L, ny = dx / L;
    for (var i = 1; i < n; i++) {
      var t = i / n, o = (r() - 0.5) * 2 * amp;
      a.push([f(x1 + dx * t + nx * o), f(y1 + dy * t + ny * o)]);
    }
    a.push([x2, y2]);
    return a;
  }

  /* ---------------- gradients / patterns ---------------- */
  function defs(I) {
    function lg(n, x1, y1, x2, y2, stops, units) {
      return '<linearGradient id="' + I(n) + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"' + (units ? ' gradientUnits="userSpaceOnUse"' : '') + '>' +
        stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('') + '</linearGradient>';
    }
    function rg(n, cx, cy, r, stops) {
      return '<radialGradient id="' + I(n) + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '">' +
        stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('') + '</radialGradient>';
    }
    return '<defs>' +
      lg('skinH', 0, 0, 1, 0, [[0, '#33200f'], [0.22, '#6b4423'], [0.5, '#93602f'], [0.78, '#65401f'], [1, '#2b190a']]) +
      lg('skinT', 140, 0, 310, 0, [[0, '#33200f'], [0.16, '#67411f'], [0.42, '#8f5c2c'], [0.62, '#7d4f26'], [0.86, '#5a3819'], [1, '#2b190a']], 1) +
      lg('skinV', 0, 0, 0, 1, [[0, '#8a5a2c'], [0.5, '#6b4423'], [1, '#3f2712']]) +
      lg('face', 0, 0, 1, 0, [[0, '#3b2411'], [0.3, '#75491f'], [0.55, '#8c5a2b'], [0.85, '#5a361a'], [1, '#2c1a0c']]) +
      rg('hi', 0.4, 0.32, 0.65, [[0, '#f6c98a', 0.8], [0.55, '#d09048', 0.3], [1, '#c98a2b', 0]]) +
      rg('sh', 0.5, 0.5, 0.5, [[0, '#0d0703', 0.65], [1, '#0d0703', 0]]) +
      lg('obs', 0, 0, 0.6, 1, [[0, '#3a3a40'], [0.25, '#141416'], [0.7, '#08080a'], [1, '#1a1a1e']]) +
      lg('obsE', 0, 0, 1, 0, [[0, '#050506'], [0.45, '#1c1c20'], [0.6, '#2e3034'], [1, '#050506']]) +
      lg('jade', 0, 0, 1, 1, [[0, '#57cfc3'], [0.4, '#1f7a80'], [1, '#0a3d44']]) +
      lg('jadeD', 0, 0, 1, 1, [[0, '#2a9a9a'], [0.5, '#155e66'], [1, '#062a30']]) +
      lg('gold', 0, 0, 1, 1, [[0, '#ffe08a'], [0.35, '#e0a63a'], [0.7, '#c98a2b'], [1, '#6b400f']]) +
      lg('bronze', 0, 0, 1, 0, [[0, '#2a1a0b'], [0.35, '#6a4a22'], [0.55, '#8a6530'], [1, '#22140a']]) +
      lg('leather', 0, 0, 0, 1, [[0, '#5a3a20'], [1, '#26160a']]) +
      lg('fA', 0, 0, 1, 0, [[0, '#0a0908'], [0.55, '#1d1a17'], [1, '#080706']]) +
      lg('fB', 0, 0, 1, 0, [[0, '#0c0c0e'], [0.5, '#23262b'], [1, '#08080a']]) +
      lg('fC', 0, 0, 1, 0, [[0, '#0b0806'], [0.5, '#2a2016'], [1, '#070504']]) +
      lg('mantle', 0, 0, 1, 0, [[0, '#050505'], [0.3, '#131211'], [0.5, '#0b0b0b'], [0.75, '#181614'], [1, '#050505']]) +
      lg('aprn', 0, 0, 1, 0, [[0, '#1b1109'], [0.5, '#4a3218'], [1, '#170e07']]) +
      rg('orb', 0.38, 0.32, 0.75, [[0, '#8ce8e0'], [0.25, '#2a8a92'], [0.6, '#0e4a54'], [1, '#03151a']]) +
      rg('glow', 0.5, 0.5, 0.5, [[0, '#ffe066', 0.9], [0.45, '#ffb400', 0.35], [1, '#ff9a00', 0]]) +
      rg('tglow', 0.5, 0.5, 0.5, [[0, '#7ff5e8', 0.55], [1, '#20b0a0', 0]]) +
      rg('eye', 0.5, 0.5, 0.5, [[0, '#fffbd0'], [0.35, '#ffd02a'], [0.8, '#e88a10'], [1, '#e88a10', 0]]) +
      rg('mouth', 0.5, 0.5, 0.5, [[0, '#7a1c10'], [1, '#2a0603']]) +
      /* fish-scale skin */
      '<pattern id="' + I('scale') + '" width="16" height="12" patternUnits="userSpaceOnUse">' +
      '<g fill="none" stroke="#1c0f05" stroke-opacity=".5" stroke-width="1.2"><path d="M0,0 Q4,7 8,0 M8,0 Q12,7 16,0 M-4,6 Q0,13 4,6 M4,6 Q8,13 12,6 M12,6 Q16,13 20,6"/></g>' +
      '<g fill="none" stroke="#e6b06a" stroke-opacity=".22" stroke-width="1"><path d="M0,1.6 Q4,8.6 8,1.6 M8,1.6 Q12,8.6 16,1.6 M-4,7.6 Q0,14.6 4,7.6 M4,7.6 Q8,14.6 12,7.6 M12,7.6 Q16,14.6 20,7.6"/></g></pattern>' +
      '<pattern id="' + I('scaleG') + '" width="14" height="10" patternUnits="userSpaceOnUse">' +
      '<g fill="none" stroke="#e0a63a" stroke-opacity=".5" stroke-width="1"><path d="M0,0 Q3.5,6 7,0 M7,0 Q10.5,6 14,0 M-3.5,5 Q0,11 3.5,5 M3.5,5 Q7,11 10.5,5 M10.5,5 Q14,11 17.5,5"/></g></pattern>' +
      '</defs>';
  }

  /* ---------------- small ornaments ---------------- */
  function blk(I, x, y, w, h, rot) {
    var i = Math.min(w, h) * 0.24;
    return '<g' + (rot ? ' transform="rotate(' + rot + ' ' + f(x + w / 2) + ' ' + f(y + h / 2) + ')"' : '') + '>' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="1.5" fill="url(#' + I('gold') + ')" stroke="' + OL + '" stroke-width="1.6"/>' +
      '<rect x="' + f(x + 2.5) + '" y="' + f(y + 2.5) + '" width="' + f(w - 5) + '" height="' + f(h - 5) + '" fill="url(#' + I('jade') + ')"/>' +
      '<path d="M' + f(x + i) + ',' + f(y + h - i) + ' V' + f(y + i) + ' H' + f(x + w - i) + ' V' + f(y + h - i * 1.7) + ' H' + f(x + i * 1.9) + ' V' + f(y + h / 2) + '" fill="none" stroke="#f1c75a" stroke-width="1.5" stroke-linejoin="miter"/>' +
      '<path d="M' + f(x + 2.5) + ',' + f(y + 2.5) + ' H' + f(x + w - 2.5) + '" stroke="#b6fff4" stroke-opacity=".5" stroke-width="1.2"/>' +
      '</g>';
  }
  function bead(I, cx, cy, r) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="url(#' + I('orb') + ')" stroke="#e0a63a" stroke-width="' + f(r * 0.24) + '"/>' +
      '<circle cx="' + f(cx - r * 0.3) + '" cy="' + f(cy - r * 0.35) + '" r="' + f(r * 0.24) + '" fill="#c9fff6" opacity=".75"/>';
  }
  function skull(I, cx, cy, s) {
    var g = 'url(#' + I('gold') + ')';
    return '<g>' +
      '<ellipse cx="' + cx + '" cy="' + f(cy - 2 * s) + '" rx="' + f(12 * s) + '" ry="' + f(13 * s) + '" fill="' + g + '" stroke="' + OL + '" stroke-width="1.8"/>' +
      '<path d="M' + f(cx - 8 * s) + ',' + f(cy + 6 * s) + ' L' + f(cx - 7 * s) + ',' + f(cy + 15 * s) + ' Q' + cx + ',' + f(cy + 19 * s) + ' ' + f(cx + 7 * s) + ',' + f(cy + 15 * s) + ' L' + f(cx + 8 * s) + ',' + f(cy + 6 * s) + ' Z" fill="' + g + '" stroke="' + OL + '" stroke-width="1.6"/>' +
      '<ellipse cx="' + f(cx - 5 * s) + '" cy="' + f(cy - 3 * s) + '" rx="' + f(3.6 * s) + '" ry="' + f(4.2 * s) + '" fill="#160c04"/>' +
      '<ellipse cx="' + f(cx + 5 * s) + '" cy="' + f(cy - 3 * s) + '" rx="' + f(3.6 * s) + '" ry="' + f(4.2 * s) + '" fill="#160c04"/>' +
      '<circle cx="' + f(cx - 5 * s) + '" cy="' + f(cy - 3 * s) + '" r="' + f(1.6 * s) + '" fill="#5fe6d8"/><circle cx="' + f(cx + 5 * s) + '" cy="' + f(cy - 3 * s) + '" r="' + f(1.6 * s) + '" fill="#5fe6d8"/>' +
      '<path d="M' + cx + ',' + f(cy + 1 * s) + ' l' + f(-2 * s) + ',' + f(5 * s) + ' h' + f(4 * s) + ' Z" fill="#160c04"/>' +
      '<path d="M' + f(cx - 6 * s) + ',' + f(cy + 11 * s) + ' H' + f(cx + 6 * s) + ' M' + f(cx - 3 * s) + ',' + f(cy + 8 * s) + ' v' + f(8 * s) + ' M' + f(cx + 3 * s) + ',' + f(cy + 8 * s) + ' v' + f(8 * s) + ' M' + cx + ',' + f(cy + 8 * s) + ' v' + f(9 * s) + '" stroke="#3a220a" stroke-width="' + f(0.9 * s) + '" fill="none"/>' +
      '<path d="M' + f(cx - 8 * s) + ',' + f(cy - 10 * s) + ' Q' + f(cx - 3 * s) + ',' + f(cy - 14 * s) + ' ' + f(cx + 2 * s) + ',' + f(cy - 13 * s) + '" stroke="#fff2b0" stroke-opacity=".7" stroke-width="' + f(1.2 * s) + '" fill="none"/>' +
      '</g>';
  }

  /* ---------------- feathers ---------------- */
  var FSTEP = ['fA', 'fB', 'fC'];
  function feather(I, x, y, len, w, ang, k) {
    var d = 'M0,0 C' + f(w) + ',' + f(len * 0.22) + ' ' + f(w * 0.95) + ',' + f(len * 0.72) + ' 0,' + f(len) + ' C' + f(-w * 0.95) + ',' + f(len * 0.72) + ' ' + f(-w) + ',' + f(len * 0.22) + ' 0,0Z';
    return '<g transform="translate(' + f(x) + ' ' + f(y) + ') rotate(' + f(ang) + ')"><path d="' + d + '" fill="url(#' + I(FSTEP[k % 3]) + ')" stroke="#030303" stroke-opacity=".85" stroke-width="1.2"/>' +
      '<path d="M0,3 L0,' + f(len * 0.9) + '" stroke="#7a5a2a" stroke-opacity=".55" stroke-width=".9" fill="none"/>' +
      '</g>';
  }
  var LEDGE = [[240, 118], [300, 68], [400, 36], [500, 20], [560, 22], [650, 48], [750, 92], [840, 150], [905, 225]];
  var REDGE = [[240, 332], [300, 380], [400, 402], [500, 402], [560, 397], [650, 382], [750, 338], [840, 278], [905, 225]];
  function edgeAt(E, y) {
    for (var i = 1; i < E.length; i++) if (y <= E[i][0]) { var a = E[i - 1], b = E[i], t = (y - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * t; }
    return E[E.length - 1][1];
  }

  /* heavy back mantle silhouette + feathers */
  function mantleBack(I, top, bottom) {
    var r = rng(7), i, s = '', L = [], R = [];
    for (i = 0; i < LEDGE.length; i++) L.push(LEDGE[i][1] + ',' + LEDGE[i][0]);
    for (i = REDGE.length - 1; i >= 0; i--) R.push(REDGE[i][1] + ',' + REDGE[i][0]);
    s += '<path d="M' + L.join(' L') + ' L' + R.join(' L') + ' Z" fill="url(#' + I('mantle') + ')" stroke="#000" stroke-width="2"/>';
    for (var y = top; y <= bottom; y += 27) {
      var l = edgeAt(LEDGE, y), rr = edgeAt(REDGE, y);
      for (var x = l; x <= rr + 1; x += 23) {
        var hidden = (y < 560 && x > 85 && x < 365) || (y < 700 && x > 130 && x < 320);
        if (hidden) continue;
        var xx = x + (r() - 0.5) * 8, yy = y + (r() - 0.5) * 8;
        var ang = (225 - xx) * 0.085 + (r() - 0.5) * 9;
        var len = 62 + r() * 26 + (yy > 700 ? 8 : 0);
        s += feather(I, xx, yy, len, 12 + r() * 4, ang, Math.floor(r() * 3));
      }
    }
    /* fine sheen strokes */
    s += '<path d="M60,300 C40,420 40,520 62,640 M392,300 C412,420 410,520 388,640" fill="none" stroke="#6f7c86" stroke-opacity=".18" stroke-width="3"/>';
    return s;
  }

  /* ---------------- serpents (left drawn; right = mirror about x=221) ---------------- */
  function serpent(I) {
    var s = '';
    /* neck */
    s += '<path d="M176,270 C182,232 184,204 172,182 C164,166 148,158 132,160" fill="none" stroke="#050506" stroke-width="36" stroke-linecap="round"/>';
    s += '<path d="M176,270 C182,232 184,204 172,182 C164,166 148,158 132,160" fill="none" stroke="url(#' + I('obsE') + ')" stroke-width="31" stroke-linecap="round"/>';
    s += '<path d="M176,270 C182,232 184,204 172,182 C164,166 148,158 132,160" fill="none" stroke="#e0a63a" stroke-opacity=".55" stroke-width="30" stroke-dasharray="1.6 8" stroke-linecap="butt"/>';
    s += '<path d="M168,270 C173,236 174,206 163,186 C156,172 146,167 134,168" fill="none" stroke="#3b4048" stroke-opacity=".5" stroke-width="5" stroke-linecap="round"/>';
    s += '<path d="M188,262 C194,232 194,204 182,182" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="7" stroke-linecap="round"/>';
    /* lower jaw + mouth */
    s += '<path d="M99,186 C106,206 126,214 152,207 L160,196 C138,200 116,196 108,186 Z" fill="url(#' + I('obsE') + ')" stroke="' + OL + '" stroke-width="2"/>';
    s += '<path d="M100,180 C118,190 140,190 160,182 L152,200 C130,204 112,198 100,186 Z" fill="url(#' + I('mouth') + ')"/>';
    s += '<path d="M104,192 C102,199 102,204 106,210 C108,203 108,197 108,192 Z" fill="#f4ead0" stroke="' + OL + '" stroke-width="1"/>';
    /* tongue */
    s += '<path d="M105,201 C96,208 88,214 90,226 M90,226 l-6,7 M90,226 l7,6" fill="none" stroke="#08090a" stroke-width="2.6" stroke-linecap="round"/>';
    /* head upper */
    s += '<path d="M92,176 C97,158 116,146 140,147 C162,148 178,162 180,184 C176,192 168,192 160,186 C140,184 118,184 104,184 C98,184 94,181 92,176 Z" fill="url(#' + I('obsE') + ')" stroke="' + OL + '" stroke-width="2.2"/>';
    /* head plates */
    s += '<path d="M112,154 C124,146 146,146 160,152 L152,164 C138,158 124,158 114,164 Z" fill="#20303a" stroke="#e0a63a" stroke-width="1.6"/>';
    s += '<path d="M116,158 C128,152 142,152 154,157" stroke="#7ad8d0" stroke-opacity=".5" stroke-width="1.4" fill="none"/>';
    s += '<path d="M96,178 C110,168 128,166 150,170" fill="none" stroke="#e0a63a" stroke-opacity=".8" stroke-width="1.6" stroke-dasharray="3 3"/>';
    s += '<path d="M104,182 L102,186 M112,183 L110,187 M120,183 L118,187 M128,183 L126,187" stroke="#e0a63a" stroke-width="1.6"/>';
    /* fang */
    s += '<path d="M100,183 L96,197 L108,186 Z" fill="#f4ead0" stroke="' + OL + '" stroke-width="1"/>';
    s += '<path d="M112,185 L110,195 L118,186 Z" fill="#e6dcc0" stroke="' + OL + '" stroke-width="1"/>';
    /* eye */
    s += '<ellipse cx="127" cy="169" rx="7" ry="3.2" fill="url(#' + I('glow') + ')"/><path d="M120,170 Q127,164 135,169 Q127,173 120,170Z" fill="#ffc21a" stroke="#000" stroke-width="1"/><ellipse cx="127.5" cy="169" rx="1.2" ry="2.4" fill="#000"/>';
    s += crack([[140, 152], [146, 160], [142, 168], [150, 178]], 1.3);
    s += crack([[176, 250], [180, 232], [174, 214], [178, 198]], 1.2);
    /* hair wisps behind */
    return s;
  }

  /* ---------------- legs ---------------- */
  function leg(I) {
    var d = 'M100,545 C86,585 82,640 88,690 C90,715 94,738 98,760 C98,780 94,795 96,812 L96,912 L134,912 L136,812 C140,790 156,770 170,745 C182,718 190,690 196,655 C200,620 208,585 220,552 Z';
    var s = '<path d="' + d + '" fill="url(#' + I('skinH') + ')"/><path d="' + d + '" fill="url(#' + I('scale') + ')" opacity=".75"/>';
    /* muscle volume */
    s += '<ellipse cx="146" cy="640" rx="24" ry="66" transform="rotate(-9 146 640)" fill="url(#' + I('hi') + ')"/>';
    s += '<ellipse cx="108" cy="645" rx="15" ry="58" transform="rotate(-2 108 645)" fill="url(#' + I('hi') + ')" opacity=".8"/>';
    s += '<ellipse cx="184" cy="640" rx="14" ry="48" fill="url(#' + I('sh') + ')"/>';
    s += '<path d="M126,585 C120,630 126,680 134,708" fill="none" stroke="#1a0c04" stroke-opacity=".45" stroke-width="3.5"/>';
    s += '<path d="M164,590 C166,640 168,684 162,708" fill="none" stroke="#1a0c04" stroke-opacity=".4" stroke-width="3"/>';
    s += '<ellipse cx="140" cy="726" rx="31" ry="22" fill="url(#' + I('hi') + ')"/>';
    s += '<path d="M118,716 C128,706 152,706 162,716 M122,742 C132,750 150,750 160,742" fill="none" stroke="#1a0c04" stroke-opacity=".55" stroke-width="2.6"/>';
    s += '<path d="M104,764 C104,778 108,792 112,800" fill="none" stroke="#1a0c04" stroke-opacity=".4" stroke-width="3"/>';
    s += '<ellipse cx="152" cy="775" rx="13" ry="26" fill="url(#' + I('hi') + ')" opacity=".7"/>';
    /* obsidian patches */
    s += '<path d="M92,585 C102,578 118,584 124,598 C118,612 106,614 98,626 C90,616 88,598 92,585 Z" fill="url(#' + I('obs') + ')" opacity=".9"/>';
    s += '<path d="M150,600 C160,596 170,602 168,614 C160,622 152,616 150,600 Z" fill="url(#' + I('obs') + ')" opacity=".85"/>';
    s += '<path d="M128,740 C136,736 142,742 138,752 C130,754 126,748 128,740Z" fill="url(#' + I('obs') + ')" opacity=".8"/>';
    s += '<path d="' + d + '" fill="none" stroke="' + OL + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<path d="M96,600 C88,650 90,700 100,760" fill="none" stroke="#5fe0d0" stroke-opacity=".3" stroke-width="2.4"/>';
    /* greave */
    s += '<path d="M74,790 L144,786 L140,905 L80,910 Z" fill="url(#' + I('bronze') + ')" stroke="' + OL + '" stroke-width="3"/>';
    s += '<path d="M74,790 L144,786 L143,802 L75,806 Z" fill="url(#' + I('gold') + ')" stroke="' + OL + '" stroke-width="2"/>';
    s += '<path d="M79,892 L141,888 L140,906 L80,910 Z" fill="url(#' + I('gold') + ')" stroke="' + OL + '" stroke-width="2"/>';
    s += blk(I, 86, 812, 48, 24, 0) + blk(I, 86, 842, 48, 20, 0) + blk(I, 85, 866, 48, 18, 0);
    s += '<path d="M90,806 V890 M130,804 V889" stroke="#3a2412" stroke-width="5"/><path d="M90,806 V890 M130,804 V889" stroke="#8a5a2c" stroke-width="2"/>';
    s += '<circle cx="90" cy="828" r="2.2" fill="#f1c75a"/><circle cx="130" cy="828" r="2.2" fill="#f1c75a"/><circle cx="90" cy="874" r="2.2" fill="#f1c75a"/><circle cx="130" cy="874" r="2.2" fill="#f1c75a"/>';
    s += '<path d="M76,796 L76,904" stroke="#ffe08a" stroke-opacity=".5" stroke-width="2"/>';
    /* foot + sandal */
    s += '<path d="M90,906 L134,906 C140,930 130,950 118,962 C100,968 60,948 34,958 C22,962 20,976 30,982 C60,990 100,986 122,978 C136,970 142,940 134,906 Z" fill="none"/>';
    s += '<path d="M88,908 L136,908 C142,932 132,952 120,964 L112,972 C90,976 60,978 36,978 C22,976 20,962 32,955 C48,946 66,942 76,930 Z" fill="url(#' + I('skinH') + ')" stroke="' + OL + '" stroke-width="2.6"/>';
    s += '<path d="M30,958 C40,952 52,952 60,956 M44,968 C52,962 64,962 72,966" fill="none" stroke="#1a0c04" stroke-opacity=".5" stroke-width="2"/>';
    s += '<path d="M28,975 C18,968 22,958 34,955 C48,948 60,950 70,956 L60,972 Z" fill="url(#' + I('skinH') + ')" opacity=".9" stroke="' + OL + '" stroke-width="1.6"/>';
    s += '<path d="M34,984 C60,996 108,992 132,978 L138,966 C136,970 112,974 92,976 C68,980 44,976 26,974 Z" fill="url(#' + I('leather') + ')" stroke="' + OL + '" stroke-width="2.6"/>';
    s += '<path d="M84,930 C98,946 116,946 132,930" fill="none" stroke="#2a1608" stroke-width="7" stroke-linecap="round"/><path d="M84,930 C98,946 116,946 132,930" fill="none" stroke="#7a4e26" stroke-width="3" stroke-linecap="round"/>';
    s += '<path d="M76,948 C90,956 108,958 124,950" fill="none" stroke="#2a1608" stroke-width="6" stroke-linecap="round"/><path d="M76,948 C90,956 108,958 124,950" fill="none" stroke="#7a4e26" stroke-width="2.6" stroke-linecap="round"/>';
    s += '<path d="M108,912 L100,946" stroke="#2a1608" stroke-width="6"/><path d="M108,912 L100,946" stroke="#7a4e26" stroke-width="2.4"/>';
    s += bead(I, 100, 936, 8) + bead(I, 112, 956, 5);
    s += '<ellipse cx="46" cy="962" rx="9" ry="6" fill="#e0a55a" opacity=".22"/>';
    return s;
  }
  function legs(I) {
    return '<g>' + leg(I) + '</g><g transform="translate(442 0) scale(-1 1)">' + leg(I) + '</g>';
  }

  /* ---------------- skirt & apron ---------------- */
  function skirt(I) {
    var r = rng(21), s = '', rows = [[522, 118, 330, 20], [552, 106, 342, 26], [586, 100, 348, 30]], k;
    /* base */
    s += '<path d="M138,514 C124,560 112,610 110,650 L176,700 L225,720 L276,700 L340,650 C338,610 326,560 312,514 Z" fill="#090807" stroke="#000" stroke-width="2"/>';
    for (var i = 0; i < rows.length; i++) {
      for (var x = rows[i][1]; x <= rows[i][2]; x += 21) {
        var xx = x + (r() - 0.5) * 6, yy = rows[i][0] + (r() - 0.5) * 6;
        var dist = Math.abs(xx - 225) / 120;
        var len = 70 + i * 18 + (1 - dist) * -6 + r() * 16;
        if (i === 2 && Math.abs(xx - 225) < 26) continue;
        s += feather(I, xx, yy, len, 12, (225 - xx) * 0.1 + (r() - 0.5) * 8, Math.floor(r() * 3));
        if (r() > 0.55) s += '<circle cx="' + f(xx) + '" cy="' + f(yy + len * 0.6) + '" r="2.2" fill="#e0a63a" stroke="#000" stroke-width=".6"/>';
      }
    }
    return s;
  }
  function apron(I) {
    var d = 'M192,522 L258,522 L259,826 L225,908 L191,826 Z', s = '';
    s += '<path d="' + d + '" fill="url(#' + I('aprn') + ')" stroke="' + OL + '" stroke-width="3"/>';
    s += '<path d="M197,528 L253,528 L254,822 L225,898 L196,822 Z" fill="none" stroke="#e0a63a" stroke-width="2"/>';
    for (var i = 0; i < 5; i++) s += blk(I, 204, 534 + i * 60, 42, 48, 0);
    /* beads & chains along sides */
    for (var j = 0; j < 9; j++) { s += '<circle cx="198" cy="' + (540 + j * 34) + '" r="2.6" fill="#e0a63a"/><circle cx="252" cy="' + (540 + j * 34) + '" r="2.6" fill="#e0a63a"/>'; }
    s += '<path d="M204,836 L246,836 L225,880 Z" fill="url(#' + I('jade') + ')" stroke="#e0a63a" stroke-width="2"/>';
    s += '<path d="M212,838 L225,862 L238,838" fill="none" stroke="#f1c75a" stroke-width="1.6"/>';
    s += bead(I, 225, 886, 6);
    s += '<path d="M194,524 H256" stroke="#ffe08a" stroke-opacity=".6" stroke-width="2"/>';
    return s;
  }

  /* ---------------- torso ---------------- */
  var TORSO = 'M203,228 C196,244 170,254 140,264 C128,270 120,282 122,300 C128,330 148,352 162,385 C170,410 180,435 184,458 L180,528 L272,528 L266,458 C270,435 280,410 288,385 C302,352 322,330 328,300 C330,282 322,270 310,264 C280,254 256,244 249,228 Z';
  function torso(I) {
    var s = '<path d="' + TORSO + '" fill="url(#' + I('skinT') + ')"/><path d="' + TORSO + '" fill="url(#' + I('scale') + ')" opacity=".85"/>';
    /* neck / traps */
    s += '<path d="M203,228 C210,262 240,262 249,228 L249,250 C238,268 214,268 203,250Z" fill="#1c0e05" opacity=".25"/>';
    s += '<path d="M206,236 C204,262 176,268 150,270 M246,236 C248,262 274,268 300,270" fill="none" stroke="#e6b06a" stroke-opacity=".25" stroke-width="7" stroke-linecap="round"/>';
    s += '<path d="M214,240 L225,268 L237,240" fill="none" stroke="#1a0c04" stroke-opacity=".4" stroke-width="2.6"/>';
    /* clavicles */
    s += '<path d="M178,278 C196,288 212,290 224,286 M272,278 C254,288 238,290 226,286" fill="none" stroke="#1a0c04" stroke-opacity=".55" stroke-width="3"/>';
    s += '<path d="M180,272 C198,280 212,282 224,279 M270,272 C252,280 238,282 226,279" fill="none" stroke="#f0c08a" stroke-opacity=".4" stroke-width="2"/>';
    /* pecs */
    s += '<path d="M150,292 C154,332 190,356 224,346 L224,296 C200,292 172,288 150,292Z" fill="url(#' + I('hi') + ')" opacity=".9"/>';
    s += '<path d="M300,292 C296,332 260,356 226,346 L226,296 C250,292 278,288 300,292Z" fill="url(#' + I('hi') + ')" opacity=".75"/>';
    s += '<path d="M150,300 C158,338 190,358 224,349 M300,300 C292,338 260,358 226,349" fill="none" stroke="#150a04" stroke-opacity=".7" stroke-width="3.4"/>';
    s += '<path d="M150,308 C160,344 192,362 224,355 M300,308 C292,344 258,362 226,355" fill="none" stroke="#150a04" stroke-opacity=".22" stroke-width="7"/>';
    s += '<path d="M225,298 L225,452" stroke="#150a04" stroke-opacity=".5" stroke-width="2.6"/>';
    /* abs blocks */
    var ys = [372, 402, 432];
    for (var i = 0; i < 3; i++) {
      var y = ys[i], w = 33 - i * 1.5;
      s += '<rect x="' + (222 - w) + '" y="' + (y - 13) + '" width="' + w + '" height="26" rx="9" fill="url(#' + I('hi') + ')" opacity=".95"/>';
      s += '<rect x="228" y="' + (y - 13) + '" width="' + w + '" height="26" rx="9" fill="url(#' + I('hi') + ')" opacity=".8"/>';
      s += '<path d="M' + (200 - i * 2) + ',' + (y + 15) + ' Q225,' + (y + 21) + ' ' + (250 + i * 2) + ',' + (y + 15) + '" fill="none" stroke="#150a04" stroke-opacity=".6" stroke-width="3"/>';
    }
    s += '<path d="M198,362 Q225,368 252,362" fill="none" stroke="#150a04" stroke-opacity=".55" stroke-width="2.6"/>';
    s += '<ellipse cx="225" cy="452" rx="4" ry="2.6" fill="#150a04" opacity=".6"/>';
    /* obliques / serratus */
    s += '<path d="M160,336 L180,346 M158,352 L182,362 M162,370 L184,380 M290,336 L270,346 M292,352 L268,362 M288,370 L266,380" stroke="#150a04" stroke-opacity=".5" stroke-width="2.6" fill="none"/>';
    s += '<path d="M176,392 C182,420 186,440 186,470 M274,392 C268,420 264,440 264,470" fill="none" stroke="#150a04" stroke-opacity=".35" stroke-width="3.5"/>';
    s += '<path d="M188,478 C200,492 208,498 214,506 M262,478 C250,492 242,498 236,506" fill="none" stroke="#150a04" stroke-opacity=".4" stroke-width="2.6"/>';
    /* shadows at sides */
    s += '<path d="M122,300 C128,330 148,352 162,385 C170,410 180,435 184,458 L196,458 C190,430 178,400 170,372 C158,340 140,320 134,300Z" fill="#0d0703" opacity=".3"/>';
    s += '<path d="M328,300 C322,330 302,352 288,385 C280,410 270,435 266,458 L254,458 C260,430 272,400 280,372 C292,340 310,320 316,300Z" fill="#0d0703" opacity=".4"/>';
    /* obsidian stone patches */
    s += '<path d="M156,300 C168,296 186,304 190,318 C184,326 194,336 186,344 C172,346 160,336 158,324 C150,316 152,306 156,300Z" fill="url(#' + I('obs') + ')" opacity=".92"/>';
    s += '<path d="M264,300 C280,298 296,304 298,318 C292,330 298,338 288,346 C276,346 266,336 268,324 C262,314 262,306 264,300Z" fill="url(#' + I('obs') + ')" opacity=".92"/>';
    s += '<path d="M190,404 C198,398 206,404 204,414 C198,420 190,416 190,404Z M252,388 C260,386 264,394 260,402 C254,404 250,396 252,388Z M168,364 C176,360 180,368 176,376 C170,376 166,370 168,364Z" fill="url(#' + I('obs') + ')" opacity=".85"/>';
    s += '<path d="M156,304 C168,300 184,308 188,318 M266,304 C280,302 292,308 296,318" stroke="#5a4a3a" stroke-opacity=".6" stroke-width="1.4" fill="none"/>';
    /* gold hairline cracks in skin */
    s += crack([[186, 400], [192, 412], [188, 422]], 1) + crack([[262, 340], [258, 352], [264, 362]], 1);
    s += '<path d="' + TORSO + '" fill="none" stroke="' + OL + '" stroke-width="2.6"/>';
    s += '<path d="M328,300 C324,330 304,352 290,385 C282,410 272,435 268,458" fill="none" stroke="#ffd060" stroke-opacity=".4" stroke-width="2.6"/>';
    s += '<path d="M122,300 C128,330 148,352 162,385" fill="none" stroke="#5fe0d0" stroke-opacity=".3" stroke-width="2.4"/>';
    return s;
  }

  /* ---------------- arms ---------------- */
  function armL(I) {
    var d = 'M120,258 C88,262 62,286 54,322 C46,360 52,392 46,428 C42,455 30,478 26,505 C24,530 26,552 32,566 L70,570 C70,548 72,525 80,505 C92,480 112,452 122,420 C132,390 140,350 150,315 C154,290 150,270 140,262 Z';
    var s = '<path d="' + d + '" fill="url(#' + I('skinH') + ')"/><path d="' + d + '" fill="url(#' + I('scale') + ')" opacity=".8"/>';
    s += '<ellipse cx="108" cy="300" rx="34" ry="42" fill="url(#' + I('hi') + ')"/>';
    s += '<path d="M76,310 C90,340 100,360 96,388" fill="none" stroke="#150a04" stroke-opacity=".45" stroke-width="3"/>';
    s += '<ellipse cx="86" cy="376" rx="22" ry="36" fill="url(#' + I('hi') + ')" opacity=".9"/>';
    s += '<ellipse cx="128" cy="380" rx="10" ry="34" fill="url(#' + I('sh') + ')"/>';
    s += '<ellipse cx="52" cy="470" rx="14" ry="30" transform="rotate(12 52 470)" fill="url(#' + I('hi') + ')" opacity=".9"/>';
    s += '<path d="M40,540 C48,548 56,548 64,542 M46,525 L64,520 M44,520 C50,540 54,560 52,566" fill="none" stroke="#150a04" stroke-opacity=".4" stroke-width="2"/>';
    s += '<path d="M96,448 C100,462 100,476 92,488" fill="none" stroke="#150a04" stroke-opacity=".4" stroke-width="3"/>';
    s += '<path d="M46,440 C52,450 64,455 78,452" fill="none" stroke="#150a04" stroke-opacity=".45" stroke-width="2.4"/>';
    /* obsidian patches */
    s += '<path d="M40,415 C48,405 58,410 60,424 C56,440 62,452 52,468 C42,466 36,450 42,436 C36,428 36,420 40,415Z" fill="url(#' + I('obs') + ')" opacity=".9"/>';
    s += '<path d="M62,330 C72,326 82,334 78,346 C70,352 60,346 62,330Z" fill="url(#' + I('obs') + ')" opacity=".85"/>';
    s += '<path d="' + d + '" fill="none" stroke="' + OL + '" stroke-width="2.8" stroke-linejoin="round"/>';
    s += '<path d="M54,322 C46,360 52,392 46,428" fill="none" stroke="#5fe0d0" stroke-opacity=".32" stroke-width="2.4"/>';
    /* upper armband */
    s += '<path d="M48,386 C80,374 114,376 139,390 L135,424 C110,410 78,410 45,424 Z" fill="url(#' + I('bronze') + ')" stroke="' + OL + '" stroke-width="2.6"/>';
    s += blk(I, 56, 390, 22, 24, -8) + blk(I, 82, 388, 22, 24, 0) + blk(I, 108, 392, 22, 24, 10);
    s += '<path d="M48,386 C80,374 114,376 139,390 M45,424 C78,410 110,410 135,424" fill="none" stroke="url(#' + I('gold') + ')" stroke-width="3"/>';
    /* bracer */
    s += '<path d="M27,498 L82,494 L76,542 L31,548 Z" fill="url(#' + I('bronze') + ')" stroke="' + OL + '" stroke-width="2.6"/>';
    s += blk(I, 33, 503, 20, 34, -3) + blk(I, 56, 500, 20, 34, -3);
    s += '<path d="M27,498 L82,494 M31,548 L76,542" stroke="url(#' + I('gold') + ')" stroke-width="3.4"/>';
    /* hand */
    var hd = 'M34,564 L72,568 C78,584 80,600 76,614 C72,628 68,642 60,656 L50,652 L44,662 L36,654 L30,636 C24,612 28,588 34,564 Z';
    s += '<path d="' + hd + '" fill="url(#' + I('skinH') + ')" stroke="' + OL + '" stroke-width="2.6"/>';
    s += '<path d="' + hd + '" fill="url(#' + I('scale') + ')" opacity=".7"/>';
    s += '<path d="M46,600 L44,650 M56,600 L58,652 M36,604 L34,640 M66,596 L70,626" stroke="#150a04" stroke-opacity=".5" stroke-width="2"/>';
    s += '<path d="M70,580 C82,588 84,606 80,620 C76,616 72,606 70,596Z" fill="url(#' + I('skinH') + ')" stroke="' + OL + '" stroke-width="2"/>';
    s += '<ellipse cx="50" cy="586" rx="12" ry="10" fill="url(#' + I('hi') + ')" opacity=".6"/>';
    return s;
  }
  /* viewer-right arm: holds the scepter */
  function armR(I) {
    var d = 'M312,262 C345,262 372,282 384,315 C394,345 394,385 388,420 C386,436 380,440 378,437 L423,494 L397,517 L346,467 C340,455 336,440 332,425 C322,395 314,360 306,318 C304,290 306,272 312,262 Z';
    var s = '<path d="' + d + '" fill="url(#' + I('skinH') + ')"/><path d="' + d + '" fill="url(#' + I('scale') + ')" opacity=".8"/>';
    s += '<ellipse cx="342" cy="300" rx="34" ry="42" fill="url(#' + I('hi') + ')"/>';
    s += '<ellipse cx="362" cy="372" rx="20" ry="36" fill="url(#' + I('hi') + ')" opacity=".9"/>';
    s += '<ellipse cx="328" cy="380" rx="9" ry="34" fill="url(#' + I('sh') + ')"/>';
    s += '<path d="M352,300 C346,330 346,360 350,390" fill="none" stroke="#150a04" stroke-opacity=".4" stroke-width="3"/>';
    s += '<ellipse cx="386" cy="470" rx="16" ry="12" transform="rotate(40 386 470)" fill="url(#' + I('hi') + ')" opacity=".8"/>';
    s += '<path d="M352,462 L404,506" stroke="#150a04" stroke-opacity=".35" stroke-width="3"/>';
    s += '<path d="M348,430 C352,442 360,450 372,452" fill="none" stroke="#150a04" stroke-opacity=".45" stroke-width="2.4"/>';
    s += '<path d="M372,318 C382,320 388,332 384,346 C376,350 370,338 372,318Z" fill="url(#' + I('obs') + ')" opacity=".85"/>';
    s += '<path d="M360,402 C368,398 376,404 374,414 C368,420 360,414 360,402Z" fill="url(#' + I('obs') + ')" opacity=".85"/>';
    s += '<path d="' + d + '" fill="none" stroke="' + OL + '" stroke-width="2.8" stroke-linejoin="round"/>';
    s += '<path d="M384,315 C394,345 394,385 388,420" fill="none" stroke="#ffd060" stroke-opacity=".55" stroke-width="2.6"/>';
    /* upper armband */
    s += '<path d="M318,378 C345,368 372,370 392,380 L388,414 C365,404 340,404 316,414 Z" fill="url(#' + I('bronze') + ')" stroke="' + OL + '" stroke-width="2.6"/>';
    s += blk(I, 326, 384, 20, 24, -6) + blk(I, 350, 382, 20, 24, 0) + blk(I, 372, 384, 18, 24, 8);
    s += '<path d="M318,378 C345,368 372,370 392,380 M316,414 C340,404 365,404 388,414" fill="none" stroke="url(#' + I('gold') + ')" stroke-width="3"/>';
    /* bracer */
    s += '<path d="M361,482 L391,454 L407,473 L379,499 Z" fill="url(#' + I('bronze') + ')" stroke="' + OL + '" stroke-width="2.6"/>';
    s += blk(I, 372, 468, 24, 16, 44);
    s += '<path d="M361,482 L391,454 M379,499 L407,473" stroke="url(#' + I('gold') + ')" stroke-width="3.2"/>';
    return s;
  }
  function fist(I) {
    var s = '';
    s += '<path d="M392,494 C388,512 388,534 396,546 L436,548 C446,530 446,506 438,490 Z" fill="url(#' + I('skinH') + ')" stroke="' + OL + '" stroke-width="2.8"/>';
    for (var i = 0; i < 4; i++) {
      s += '<ellipse cx="' + (424 + (i % 2)) + '" cy="' + (502 + i * 14) + '" rx="20" ry="8.5" fill="url(#' + I('skinH') + ')" stroke="' + OL + '" stroke-width="2.2"/>';
      s += '<path d="M410,' + (498 + i * 14) + ' Q424,' + (494 + i * 14) + ' 438,' + (498 + i * 14) + '" stroke="#f0c08a" stroke-opacity=".4" stroke-width="1.6" fill="none"/>';
    }
    s += '<path d="M392,490 C384,486 384,502 394,512 C404,516 412,506 410,494 Z" fill="url(#' + I('skinH') + ')" stroke="' + OL + '" stroke-width="2.4"/>';
    s += '<ellipse cx="398" cy="494" rx="8" ry="6" fill="url(#' + I('hi') + ')"/>';
    s += '<path d="M400,532 L440,536" stroke="#150a04" stroke-opacity=".4" stroke-width="3"/>';
    return s;
  }

  /* ---------------- belt, collar, plates ---------------- */
  function belt(I) {
    var s = '';
    s += '<path d="M146,468 C180,502 270,502 304,468 L306,506 C270,538 180,538 144,506 Z" fill="url(#' + I('bronze') + ')" stroke="' + OL + '" stroke-width="3"/>';
    s += '<path d="M146,468 C180,502 270,502 304,468 M144,506 C180,538 270,538 306,506" fill="none" stroke="url(#' + I('gold') + ')" stroke-width="3.4"/>';
    var bl = [[156, 486, 22, -22], [182, 500, 22, -12], [268, 500, 22, 12], [294, 484, 22, 22]];
    s += blk(I, 154, 480, 20, 22, -24) + blk(I, 176, 496, 20, 22, -12) + blk(I, 256, 496, 20, 22, 12) + blk(I, 278, 480, 20, 22, 24);
    s += bead(I, 186, 508, 9) + bead(I, 264, 508, 9);
    /* central medallion */
    s += '<circle cx="225" cy="498" r="42" fill="url(#' + I('jadeD') + ')" stroke="' + OL + '" stroke-width="3"/>';
    s += '<circle cx="225" cy="498" r="42" fill="none" stroke="url(#' + I('gold') + ')" stroke-width="5"/>';
    s += '<circle cx="225" cy="498" r="33" fill="none" stroke="#f1c75a" stroke-width="2" stroke-dasharray="6 4"/>';
    s += '<path d="M188,478 A42,42 0 0 1 262,478" fill="none" stroke="#c9fff6" stroke-opacity=".5" stroke-width="2"/>';
    s += skull(I, 225, 500, 1.9);
    s += bead(I, 225, 462, 6);
    /* hanging pendants */
    s += '<path d="M200,536 l12,16 l-12,16 l-12,-16 Z M250,536 l12,16 l-12,16 l-12,-16 Z" fill="url(#' + I('jade') + ')" stroke="#e0a63a" stroke-width="2.4"/>';
    s += bead(I, 225, 548, 7) + bead(I, 225, 566, 5);
    s += '<path d="M160,510 v26 M290,510 v26 M172,516 v22 M278,516 v22" stroke="#e0a63a" stroke-width="1.6" stroke-dasharray="1 5"/>';
    return s;
  }
  function collar(I) {
    var s = '';
    s += '<path d="M168,262 C176,310 202,322 225,322 C248,322 274,310 282,262 L266,262 C258,296 244,306 225,306 C206,306 192,296 184,262 Z" fill="url(#' + I('bronze') + ')" stroke="' + OL + '" stroke-width="2.4"/>';
    /* blocks along arc */
    for (var i = 0; i < 9; i++) {
      var a = Math.PI * (0.06 + i * 0.111), cx = 225 - Math.cos(a) * 46, cy = 268 + Math.sin(a) * 36;
      var ang = (a - Math.PI / 2) * 180 / Math.PI;
      if (i === 4) continue;
      s += blk(I, f(cx - 8), f(cy - 8), 16, 16, f(ang * 0.9 + (a < Math.PI / 2 ? 0 : 0)));
    }
    s += '<path d="M168,262 C176,310 202,322 225,322 C248,322 274,310 282,262" fill="none" stroke="url(#' + I('gold') + ')" stroke-width="2.4"/>';
    /* pendant */
    s += '<path d="M204,300 C204,290 246,290 246,300 C248,320 238,334 225,338 C212,334 202,320 204,300Z" fill="url(#' + I('bronze') + ')" stroke="' + OL + '" stroke-width="2.6"/>';
    s += bead(I, 200, 304, 8) + bead(I, 250, 304, 8);
    s += skull(I, 225, 312, 1.1);
    s += '<path d="M218,338 L232,338 L232,362 L225,372 L218,362 Z" fill="url(#' + I('jade') + ')" stroke="#e0a63a" stroke-width="2"/>';
    s += '<path d="M225,342 V366" stroke="#f1c75a" stroke-width="1.4"/>';
    return s;
  }
  function plate(I) {
    var s = '';
    s += '<path d="M100,258 L146,232 L170,246 L172,302 L150,322 L116,290 Z" fill="url(#' + I('bronze') + ')" stroke="' + OL + '" stroke-width="3"/>';
    s += '<path d="M106,262 L146,240 L164,250 L165,296 L148,314 L120,288 Z" fill="none" stroke="url(#' + I('gold') + ')" stroke-width="3"/>';
    s += blk(I, 114, 262, 26, 20, -26) + blk(I, 138, 250, 22, 22, -26) + blk(I, 130, 280, 28, 22, -26);
    s += '<path d="M104,258 L146,232" stroke="#fff2b0" stroke-opacity=".6" stroke-width="2"/>';
    /* strap down chest */
    s += '<path d="M150,322 L148,468" stroke="#1a0f08" stroke-width="10"/>';
    for (var y = 330; y < 452; y += 20) s += '<rect x="145" y="' + y + '" width="9" height="14" rx="1.5" fill="url(#' + I('jade') + ')" stroke="#e0a63a" stroke-width="1.4"/>';
    s += bead(I, 150, 440, 6);
    s += '<path d="M150,446 v16" stroke="#e0a63a" stroke-width="1.6"/>';
    return s;
  }
  function plateR(I) {
    var s = '<g transform="translate(450 0) scale(-1 1)">' + plate(I) + '</g>';
    return s;
  }
  function shoulderTufts(I, side) {
    var r = rng(side > 0 ? 3 : 5), s = '';
    for (var i = 0; i < 9; i++) {
      var x = 118 + i * 5.5 + (r() - 0.5) * 6, y = 262 - Math.abs(i - 3) * 2 + (r() - 0.5) * 8;
      var ang = 180 - (60 - i * 8) + (r() - 0.5) * 12;
      s += feather(I, x, y, 40 + r() * 20, 10, ang, i);
    }
    var out = '<g' + (side > 0 ? ' transform="translate(450 0) scale(-1 1)"' : '') + '>' + s + '</g>';
    return out;
  }

  /* ---------------- head ---------------- */
  function head(I) {
    var s = '';
    /* hair mass behind */
    s += '<path d="M186,110 C166,150 156,210 160,268 C170,262 180,240 190,232 L190,150Z M264,110 C284,150 294,210 290,268 C280,262 270,240 260,232 L260,150Z" fill="#050506" stroke="#000" stroke-width="2"/>';
    var r = rng(11);
    for (var i = 0; i < 12; i++) {
      var sx = 172 + r() * 10, sy = 150 + i * 10;
      s += '<path d="M' + sx + ',' + sy + ' C' + (sx - 8 - r() * 6) + ',' + (sy + 30) + ' ' + (sx - 4) + ',' + (sy + 50) + ' ' + (sx - 6 - r() * 8) + ',' + (sy + 70) + '" fill="none" stroke="#000" stroke-width="2.2"/>';
      s += '<path d="M' + (450 - sx) + ',' + sy + ' C' + (450 - sx + 8 + r() * 6) + ',' + (sy + 30) + ' ' + (450 - sx + 4) + ',' + (sy + 50) + ' ' + (450 - sx + 6 + r() * 8) + ',' + (sy + 70) + '" fill="none" stroke="#000" stroke-width="2.2"/>';
    }
    s += '<path d="M176,140 C168,180 166,220 172,254 M274,140 C282,180 284,220 278,254" fill="none" stroke="#5a6570" stroke-opacity=".35" stroke-width="3"/>';
    /* ears */
    s += '<path d="M188,168 C178,160 170,150 168,140 C176,146 184,150 192,158Z M262,168 C272,160 280,150 282,140 C274,146 266,150 258,158Z" fill="url(#' + I('face') + ')" stroke="' + OL + '" stroke-width="2"/>';
    s += '<path d="M188,166 C180,170 178,188 186,198 L194,190Z M262,166 C270,170 272,188 264,198 L256,190Z" fill="url(#' + I('face') + ')" stroke="' + OL + '" stroke-width="2"/>';
    /* face */
    var fd = 'M187,150 C184,186 188,212 204,230 C214,240 236,240 246,230 C262,212 267,186 264,150 Z';
    s += '<path d="' + fd + '" fill="url(#' + I('face') + ')"/>';
    s += '<path d="' + fd + '" fill="url(#' + I('scale') + ')" opacity=".5"/>';
    /* face volumes */
    s += '<ellipse cx="204" cy="196" rx="13" ry="16" fill="url(#' + I('hi') + ')"/><ellipse cx="248" cy="196" rx="11" ry="15" fill="url(#' + I('hi') + ')" opacity=".8"/>';
    s += '<path d="M226,168 C220,180 218,194 212,206 C218,210 234,210 240,206 C234,194 232,180 226,168Z" fill="url(#' + I('hi') + ')" opacity=".9"/>';
    s += '<path d="M192,205 C194,222 204,232 214,236 M258,205 C256,222 246,232 236,236" fill="none" stroke="#150a04" stroke-opacity=".4" stroke-width="4"/>';
    s += '<path d="M196,182 C192,196 196,210 204,220 M256,182 C260,196 256,210 248,220" fill="none" stroke="#150a04" stroke-opacity=".3" stroke-width="3"/>';
    /* jade markings */
    s += '<path d="M187,152 L224,166 L224,178 L206,172 L194,180 L188,196 Z M264,152 L228,166 L228,178 L246,172 L258,180 L264,196 Z" fill="url(#' + I('jade') + ')" stroke="#0a2a2e" stroke-width="1.6" opacity=".92"/>';
    s += '<path d="M190,158 L222,170 M262,158 L230,170" stroke="#9af5e8" stroke-opacity=".6" stroke-width="1.4"/>';
    s += '<path d="M192,200 L198,222 M258,200 L252,222" stroke="#2fa79f" stroke-width="3"/>';
    /* brows */
    s += '<path d="M191,171 C202,164 214,166 224,174 L224,180 C214,174 202,172 191,178Z M259,171 C248,164 236,166 226,174 L226,180 C236,174 248,172 259,178Z" fill="#0d0703" stroke="#000" stroke-width="1.2"/>';
    /* eyes */
    var eyes = '';
    eyes += '<ellipse cx="206" cy="184" rx="15" ry="9" fill="url(#' + I('glow') + ')" opacity=".55"/><ellipse cx="246" cy="184" rx="15" ry="9" fill="url(#' + I('glow') + ')" opacity=".55"/>';
    eyes += '<path d="M194,185 Q206,176 220,184 Q206,192 194,185Z M258,185 Q246,176 232,184 Q246,192 258,185Z" fill="#0a0503" stroke="#000" stroke-width="1"/>';
    eyes += '<ellipse cx="207" cy="184" rx="6.5" ry="4.6" fill="url(#' + I('eye') + ')"/><ellipse cx="245" cy="184" rx="6.5" ry="4.6" fill="url(#' + I('eye') + ')"/>';
    eyes += '<ellipse cx="207" cy="184" rx="1.6" ry="3.4" fill="#2a1200"/><ellipse cx="245" cy="184" rx="1.6" ry="3.4" fill="#2a1200"/>';
    eyes += '<path d="M195,185 Q206,178 219,184 M257,185 Q246,178 233,184" fill="none" stroke="#000" stroke-width="2"/>';
    var partA = s; s = '';
    /* nose */
    s += '<path d="M222,178 C220,192 216,202 210,208 C216,214 236,214 242,208 C236,202 232,192 230,178Z" fill="url(#' + I('face') + ')" opacity=".6"/>';
    s += '<path d="M211,208 C214,214 222,214 226,212 C230,214 238,214 241,208" fill="none" stroke="#150a04" stroke-width="2.4"/>';
    s += '<ellipse cx="217" cy="210" rx="3" ry="1.8" fill="#0a0503"/><ellipse cx="235" cy="210" rx="3" ry="1.8" fill="#0a0503"/>';
    s += '<path d="M222,182 C221,194 218,202 213,207" fill="none" stroke="#150a04" stroke-opacity=".5" stroke-width="2.6"/><path d="M231,184 C232,194 234,202 238,206" fill="none" stroke="#f0c08a" stroke-opacity=".4" stroke-width="2"/>';
    /* mouth */
    s += '<path d="M209,222 C216,218 222,220 226,222 C230,220 236,218 243,222 C236,226 216,226 209,222Z" fill="#2a1408" stroke="#0a0503" stroke-width="1.4"/>';
    s += '<path d="M212,227 C220,232 232,232 240,227 C232,236 220,236 212,227Z" fill="#8a5a2c" opacity=".7"/>';
    s += '<path d="M208,222 C216,224 236,224 244,222" fill="none" stroke="#0a0503" stroke-width="1.8"/>';
    s += '<path d="M220,238 C224,242 228,242 232,238" fill="none" stroke="#150a04" stroke-opacity=".45" stroke-width="2"/>';
    /* chin ornament */
    s += '<path d="M226,240 v6" stroke="#e0a63a" stroke-width="1.6"/><path d="M226,246 l-5,8 l5,10 l5,-10 Z" fill="url(#' + I('gold') + ')" stroke="' + OL + '" stroke-width="1.4"/><circle cx="226" cy="254" r="2" fill="#5fe6d8"/>';
    /* earrings */
    for (var k = 0; k < 2; k++) {
      var ex = k ? 273 : 178;
      s += '<path d="M' + (ex - 2) + ',196 C' + (ex - 15) + ',204 ' + (ex - 14) + ',230 ' + (ex + 2) + ',236 C' + (ex + 15) + ',230 ' + (ex + 14) + ',204 ' + (ex + 2) + ',196" fill="none" stroke="' + OL + '" stroke-width="7"/>';
      s += '<path d="M' + (ex - 2) + ',196 C' + (ex - 15) + ',204 ' + (ex - 14) + ',230 ' + (ex + 2) + ',236 C' + (ex + 15) + ',230 ' + (ex + 14) + ',204 ' + (ex + 2) + ',196" fill="none" stroke="url(#' + I('gold') + ')" stroke-width="4.5"/>';
      s += '<path d="M' + (ex - 9) + ',212 C' + (ex - 9) + ',222 ' + (ex - 5) + ',228 ' + (ex + 2) + ',230" fill="none" stroke="url(#' + I('jade') + ')" stroke-width="4" stroke-dasharray="6 3"/>';
      s += bead(I, ex, 196, 5) + '<path d="M' + ex + ',236 v10" stroke="#e0a63a" stroke-width="1.5"/>' + bead(I, ex, 250, 4);
    }
    s += '<path d="M182,160 C168,132 172,102 196,80 L204,108 L196,160Z M268,160 C282,132 278,102 254,80 L246,108 L254,160Z" fill="#050506" stroke="#000" stroke-width="2"/>';
    /* crown */
    var cd = 'M225,8 C228,44 240,78 256,100 C266,114 271,136 269,158 L181,158 C179,136 184,114 194,100 C210,78 222,44 225,8 Z';
    s += '<path d="' + cd + '" fill="url(#' + I('obsE') + ')" stroke="#000" stroke-width="2.4"/>';
    /* plates */
    for (var j = 0; j < 14; j++) {
      var y = 26 + j * 9.6, hw = 5 + j * 3.3, h = 14 + j * 0.7;
      var lf = 'M225,' + y + ' C' + (225 - hw * 0.5) + ',' + (y + 2) + ' ' + (225 - hw) + ',' + (y + h * 0.4) + ' ' + (225 - hw - 3) + ',' + (y + h) + ' C' + (225 - hw * 0.4) + ',' + (y + h * 0.7) + ' 225,' + (y + h * 0.5) + ' 225,' + (y + 5) + ' Z';
      s += '<path d="' + lf + '" fill="url(#' + I('obs') + ')" stroke="#000" stroke-width="1"/>';
      s += '<path d="' + lf + '" fill="url(#' + I('obs') + ')" stroke="#000" stroke-width="1" transform="translate(450 0) scale(-1 1)"/>';
      s += '<path d="M' + (225 - hw - 2) + ',' + (y + h - 1) + ' C' + (225 - hw * 0.4) + ',' + (y + h * 0.7) + ' 226,' + (y + h * 0.5) + ' 226,' + (y + 5) + '" fill="none" stroke="#8a6a3a" stroke-opacity=".55" stroke-width="1.2"/>';
      s += '<path d="M' + (225 + hw + 2) + ',' + (y + h - 1) + ' C' + (225 + hw * 0.4) + ',' + (y + h * 0.7) + ' 224,' + (y + h * 0.5) + ' 224,' + (y + 5) + '" fill="none" stroke="#8a6a3a" stroke-opacity=".4" stroke-width="1.2"/>';
    }
    s += '<path d="M232,40 C240,60 254,84 266,104" fill="none" stroke="#7a8a96" stroke-opacity=".3" stroke-width="3"/>';
    /* lightning cracks in crown */
    s += crack([[225, 14], [222, 34], [228, 54], [222, 76], [228, 100], [224, 124], [226, 152]], 2.2);
    s += crack([[224, 60], [212, 74], [206, 92], [196, 108], [194, 128]], 1.4);
    s += crack([[227, 70], [240, 86], [246, 104], [256, 120], [258, 140]], 1.4);
    s += crack([[222, 100], [214, 116], [210, 134]], 1);
    s += crack([[228, 96], [236, 112], [240, 130]], 1);
    /* forehead band under crown */
    s += '<path d="M168,158 C186,150 206,158 225,172 C244,158 264,150 284,158 L284,166 C264,158 244,166 225,180 C206,166 186,158 168,166Z" fill="url(#' + I('jadeD') + ')" stroke="' + OL + '" stroke-width="1.6"/>';
    /* lightning arcs above crown */
    s += bolt(zig(196, 88, 128, 56, 5, 8, 3), 2.2);
    s += bolt(zig(206, 66, 170, 22, 4, 7, 9), 1.8);
    s += bolt(zig(258, 84, 300, 46, 4, 7, 4), 2);
    s += bolt(zig(246, 60, 276, 20, 4, 6, 6), 1.6);
    s += bolt(zig(262, 118, 330, 96, 5, 8, 12), 1.8);
    s += bolt(zig(186, 118, 132, 108, 4, 6, 15), 1.6);
    return [partA, eyes, s];
  }

  /* ---------------- scepter (origin: orb centre; shaft runs along +y) ---------------- */
  function prong(I) {
    var s = '';
    var out = 'M-24,24 C-40,18 -54,6 -56,-16 C-58,-44 -48,-78 -34,-112 C-28,-130 -22,-146 -14,-172 C-16,-146 -12,-128 -8,-112 C-16,-88 -22,-60 -22,-32 C-22,-14 -16,2 -6,14 Z';
    s += '<path d="' + out + '" fill="url(#' + I('obsE') + ')" stroke="' + OL + '" stroke-width="2.6" stroke-linejoin="round"/>';
    /* inlay panels */
    s += '<path d="M-48,-4 C-48,-30 -40,-58 -32,-84 L-24,-72 C-30,-50 -34,-30 -32,-8 Z" fill="url(#' + I('jadeD') + ')" opacity=".9"/>';
    s += '<path d="M-42,-96 C-36,-112 -30,-126 -24,-142 L-20,-120 C-24,-112 -28,-100 -30,-92 Z" fill="url(#' + I('jadeD') + ')" opacity=".9"/>';
    s += '<path d="M-56,-16 C-58,-44 -48,-78 -34,-112 C-28,-130 -22,-146 -14,-172" fill="none" stroke="url(#' + I('gold') + ')" stroke-width="2.4"/>';
    s += '<path d="M-22,-32 C-22,-60 -16,-88 -8,-112" fill="none" stroke="#e0a63a" stroke-width="1.6"/>';
    s += '<path d="M-52,-30 L-24,-40 M-46,-60 L-26,-66 M-38,-90 L-24,-94" stroke="#e0a63a" stroke-width="1.6"/>';
    /* barbs */
    s += '<path d="M-56,-10 L-68,26 L-52,10 Z M-50,-60 L-62,-56 L-48,-44 Z" fill="url(#' + I('obsE') + ')" stroke="' + OL + '" stroke-width="2"/>';
    s += '<path d="M-56,-10 L-66,22" stroke="#e0a63a" stroke-width="1.4"/>';
    s += '<path d="M-54,-6 C-52,-40 -42,-70 -30,-104" fill="none" stroke="#c9fff6" stroke-opacity=".28" stroke-width="2"/>';
    return s;
  }
  function scepter(I) {
    var s = '';
    /* glow behind head */
    s += '<circle cx="0" cy="0" r="66" fill="url(#' + I('glow') + ')" opacity=".55"/>';
    /* shaft */
    s += '<path d="M-6,100 L6,100 L5,700 L0,760 L-5,700 Z" fill="url(#' + I('bronze') + ')" stroke="' + OL + '" stroke-width="2.4"/>';
    s += '<path d="M-3,100 L-3,700" stroke="#c9a05a" stroke-opacity=".4" stroke-width="1.6"/>';
    for (var y = 120; y < 690; y += 46) {
      s += '<rect x="-6.6" y="' + y + '" width="13.2" height="6" fill="url(#' + I('gold') + ')" stroke="' + OL + '" stroke-width="1.2"/>';
      if ((y - 120) % 92 === 0) s += '<rect x="-4" y="' + (y + 12) + '" width="8" height="22" fill="url(#' + I('jade') + ')" stroke="#e0a63a" stroke-width="1.2"/>';
      else s += '<path d="M-4,' + (y + 14) + ' L4,' + (y + 30) + ' M4,' + (y + 14) + ' L-4,' + (y + 30) + '" stroke="#e0a63a" stroke-opacity=".8" stroke-width="1.4"/>';
    }
    s += '<path d="M-6,690 L6,690 L4,706 L-4,706 Z" fill="url(#' + I('gold') + ')" stroke="' + OL + '" stroke-width="1.6"/>';
    s += '<path d="M-4,706 L4,706 L0,760 Z" fill="url(#' + I('obsE') + ')" stroke="' + OL + '" stroke-width="1.6"/>';
    /* prongs (mirrored) */
    s += '<g>' + prong(I) + '</g><g transform="scale(-1 1)">' + prong(I) + '</g>';
    /* lower head */
    s += '<path d="M-30,12 C-32,34 -24,56 -14,68 L-12,102 L12,102 L14,68 C24,56 32,34 30,12 C20,26 12,32 0,32 C-12,32 -20,26 -30,12 Z" fill="url(#' + I('bronze') + ')" stroke="' + OL + '" stroke-width="2.6"/>';
    s += '<path d="M-24,22 C-20,44 -14,58 -8,70 M24,22 C20,44 14,58 8,70" fill="none" stroke="#e0a63a" stroke-width="2"/>';
    s += '<path d="M0,38 C-9,48 -9,66 0,80 C9,66 9,48 0,38 Z" fill="url(#' + I('jade') + ')" stroke="#e0a63a" stroke-width="2"/>';
    s += '<path d="M-26,40 l-8,-2 l4,10 Z M26,40 l8,-2 l-4,10 Z" fill="#0a0a0c" stroke="#e0a63a" stroke-width="1.4"/>';
    s += '<circle cx="-20" cy="30" r="4" fill="#050505" stroke="#e0a63a" stroke-width="1.4"/><circle cx="20" cy="30" r="4" fill="#050505" stroke="#e0a63a" stroke-width="1.4"/>';
    s += '<rect x="-9" y="86" width="18" height="8" fill="url(#' + I('gold') + ')" stroke="' + OL + '" stroke-width="1.4"/>';
    /* hanging beads */
    s += '<path d="M-24,54 V92 M24,54 V98" stroke="#7a5a2a" stroke-width="1.6" stroke-dasharray="2 2"/>';
    s += bead(I, -24, 100, 9) + bead(I, 24, 106, 9);
    s += '<path d="M-24,110 v14 M24,116 v14" stroke="#e0a63a" stroke-width="1.6"/><path d="M-24,124 l-3,8 l6,0Z M24,130 l-3,8 l6,0Z" fill="#c98a2b"/>';
    /* central spike & orb */
    s += '<path d="M0,-118 L7,-60 L-7,-60 Z" fill="url(#' + I('obsE') + ')" stroke="' + OL + '" stroke-width="2.2"/><path d="M0,-118 L0,-62" stroke="#e0a63a" stroke-width="1.6"/>';
    s += '<path d="M-10,-56 L10,-56 L6,-40 L-6,-40 Z" fill="url(#' + I('gold') + ')" stroke="' + OL + '" stroke-width="1.6"/>';
    s += '<path d="M-8,-70 l-6,-8 l6,3 Z M8,-70 l6,-8 l-6,3 Z" fill="url(#' + I('obsE') + ')" stroke="' + OL + '" stroke-width="1.4"/>';
    s += '<circle cx="0" cy="-2" r="34" fill="url(#' + I('glow') + ')"/>';
    s += '<circle cx="0" cy="-2" r="24" fill="url(#' + I('orb') + ')" stroke="' + OL + '" stroke-width="2"/>';
    s += '<circle cx="0" cy="-2" r="25" fill="none" stroke="url(#' + I('gold') + ')" stroke-width="4"/>';
    s += '<path d="M-14,-4 C-4,-14 8,-10 14,-2 M-10,8 C0,0 4,4 12,10 M0,-20 L0,14" fill="none" stroke="#e0a63a" stroke-opacity=".75" stroke-width="1.2"/>';
    s += '<ellipse cx="-8" cy="-12" rx="8" ry="5" transform="rotate(-30 -8 -12)" fill="#d6fff8" opacity=".55"/>';
    s += '<circle cx="0" cy="-2" r="30" fill="none" stroke="#ffd23a" stroke-opacity=".5" stroke-width="2.4"/>';
    /* lightning */
    s += bolt(zig(-18, -34, -30, -110, 5, 7, 31), 2);
    s += bolt(zig(6, -70, 16, -140, 5, 7, 32), 1.8);
    s += bolt(zig(30, -8, 64, -48, 4, 6, 33), 1.8);
    s += bolt(zig(-32, 10, -62, 40, 3, 5, 34), 1.6);
    s += bolt(zig(34, 52, 62, 78, 3, 5, 35), 1.4);
    s += crack([[-52, -30], [-40, -22], [-42, -10], [-30, -2]], 1.4);
    s += crack([[52, -30], [40, -22], [42, -10], [30, -2]], 1.4);
    return s;
  }
  function scepterPlaced(I) {
    return '<g transform="translate(438 208) rotate(5.2) scale(1.08)">' + scepter(I) + '</g>';
  }

  /* ---------------- assemble ---------------- */
  function svg(uid) {
    uid = uid == null ? '' : String(uid);
    function I(n) { return 'polynesian-' + n + '-' + uid; }
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 300">' + defs(I);
    s += '<ellipse class="part-shadow" cx="85" cy="291.5" rx="66" ry="5" fill="#000" opacity="0.28"/>';
    /* back mantle tail */
    s += '<g class="part-cape" style="transform-origin: ' + vx(225) + 'px ' + vy(255) + 'px">' + T(mantleBack(I, 246, 880)) + '</g>';
    /* serpents */
    s += '<g class="part-cape" style="transform-origin: ' + vx(176) + 'px ' + vy(268) + 'px">' + T(serpent(I)) + '</g>';
    s += '<g class="part-cape" style="transform-origin: ' + vx(266) + 'px ' + vy(268) + 'px">' + T('<g transform="translate(442 0) scale(-1 1)">' + serpent(I) + '</g>') + '</g>';
    /* legs */
    s += T(legs(I));
    /* body */
    s += '<g class="part-body" style="transform-origin: ' + vx(225) + 'px ' + vy(420) + 'px">';
    s += T(torso(I));
    s += '<g class="part-cape" style="transform-origin: ' + vx(225) + 'px ' + vy(515) + 'px">' + T(skirt(I) + apron(I)) + '</g>';
    s += T(armL(I) + belt(I) + collar(I) + plate(I));
    s += T(shoulderTufts(I, -1));
    s += (function () { var h = head(I); return '<g class="part-head" style="transform-origin: ' + vx(226) + 'px ' + vy(240) + 'px">' + T(h[0]) + '<g class="part-eyes" style="transform-origin: ' + vx(226) + 'px ' + vy(184) + 'px">' + T(h[1]) + '</g>' + T(h[2]) + '</g>'; })();
    s += '</g>';
    /* weapon arm + scepter */
    s += '<g class="part-weapon" style="transform-origin: ' + vx(335) + 'px ' + vy(285) + 'px">' + T(scepterPlaced(I) + armR(I) + fist(I) + plateR(I) + shoulderTufts(I, 1)) + '</g>';
    s += '</svg>';
    return s;
  }

  /* ---------------- portrait ---------------- */
  function portrait(uid) {
    uid = uid == null ? '' : String(uid);
    function I(n) { return 'polynesian-pt-' + n + '-' + uid; }
    var bg = I('bg'), cl = I('clip');
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' + defs(I) +
      '<defs><radialGradient id="' + bg + '" cx="0.5" cy="0.4" r="0.7"><stop offset="0" stop-color="#16333a"/><stop offset=".55" stop-color="#0b1417"/><stop offset="1" stop-color="#050708"/></radialGradient>' +
      '<clipPath id="' + cl + '"><rect x="0" y="0" width="120" height="120" rx="16"/></clipPath></defs>' +
      '<g clip-path="url(#' + cl + ')"><rect width="120" height="120" fill="url(#' + bg + ')"/>' +
      '<circle cx="60" cy="52" r="52" fill="url(#' + I('tglow') + ')" opacity=".35"/>' +
      '<g opacity=".8">' + bolt([[8, 30], [16, 40], [10, 48], [20, 60]], 1) + bolt([[112, 24], [104, 36], [110, 44], [100, 56]], 1) + '</g>' +
      '<g transform="translate(-22.5 1.5) scale(0.4)">' +
      mantleBack(I, 246, 330) +
      serpent(I) + '<g transform="translate(442 0) scale(-1 1)">' + serpent(I) + '</g>' +
      torso(I) + armL(I) + '<g transform="translate(0 0)">' + armR(I) + '</g>' +
      collar(I) + plate(I) + plateR(I) + shoulderTufts(I, -1) + shoulderTufts(I, 1) +
      head(I).join('') +
      '</g>' +
      '<rect x="0" y="92" width="120" height="28" fill="#050708" opacity="0"/></g>' +
      '<rect x="1.5" y="1.5" width="117" height="117" rx="15" fill="none" stroke="' + OL + '" stroke-width="3"/>' +
      '<rect x="4.6" y="4.6" width="110.8" height="110.8" rx="12.5" fill="none" stroke="#c98a2b" stroke-width="1.3" opacity=".9"/>' +
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
    aspect: 300 / 180,
    base: { hp: 580, atk: 95, def: 20 },
    fx: { slash: '#ffd23a', glow: '#fff3b8' },
    signature: { name: 'Serpent Bite', desc: 'Heal 15% of damage dealt as HP (lifesteal).', type: 'lifesteal' },
    svg: svg,
    portrait: portrait
  };
})();

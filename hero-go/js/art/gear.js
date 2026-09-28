/* Hero Go! — equipment icons (6 slots x 5 rarities). Pure inline SVG strings. See ART_CONTRACT.md
   window.GEAR_ART.icon(slot, rarity, uid) -> '<svg viewBox="0 0 100 100">' on a transparent background. */
(function () {
  var O = '#2b1d14';
  // rarity families: m = main, l = light, d = dark
  var FAM = [
    { m: '#b9b2a6', l: '#e6e1d6', d: '#8a8377' },
    { m: '#4aa3ff', l: '#b5dbff', d: '#2a6fc9' },
    { m: '#b06bff', l: '#e2c6ff', d: '#7b3fc6' },
    { m: '#ffb02e', l: '#ffe39a', d: '#c47408' },
    { m: '#ff4d5e', l: '#ffa9b0', d: '#a81c33' }
  ];
  var GLOW_OP = [0, 0.16, 0.26, 0.36, 0.5];

  function ids(key, uid) {
    var s = uid != null && uid !== '' ? '-' + uid : '';
    return {
      id: function (n) { return key + '-' + n + s; },
      url: function (n) { return 'url(#' + key + '-' + n + s + ')'; }
    };
  }

  // Cel-shaded part: outline, shade base, lit base shifted by `off`, extras clipped inside.
  function cel(I, name, shape, base, shade, extra, sw, off) {
    off = off || [-3, -4];
    return '<clipPath id="' + I.id(name) + '">' + shape + '</clipPath>' +
      '<g fill="none" stroke="' + O + '" stroke-width="' + (sw || 7) + '" stroke-linejoin="round" stroke-linecap="round">' + shape + '</g>' +
      '<g clip-path="' + I.url(name) + '">' +
        '<g fill="' + shade + '">' + shape + '</g>' +
        '<g fill="' + base + '" transform="translate(' + off[0] + ' ' + off[1] + ')">' + shape + '</g>' +
        (extra || '') +
      '</g>';
  }
  function P(d, fill, sw) {
    return '<path d="' + d + '" fill="' + fill + '" stroke="' + O + '" stroke-width="' + (sw || 3.5) + '" stroke-linejoin="round" stroke-linecap="round"/>';
  }
  function L(d, c, w, op, dash) {
    return '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + (w || 1.5) + '" stroke-linecap="round" stroke-linejoin="round"' +
      (op != null ? ' opacity="' + op + '"' : '') + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>';
  }
  function C(x, y, r, fill, sw) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '"' + (sw === 0 ? '' : ' stroke="' + O + '" stroke-width="' + (sw || 2) + '"') + '/>';
  }
  function E(x, y, rx, ry, fill, op, rot) {
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '"' + (op != null ? ' opacity="' + op + '"' : '') +
      (rot ? ' transform="rotate(' + rot + ' ' + x + ' ' + y + ')"' : '') + '/>';
  }
  function rivet(x, y, r, c) {
    r = r || 2;
    return C(x, y, r, c || '#e6e1d6', 1.3) + C(x - r * 0.3, y - r * 0.3, r * 0.3, '#fff', 0);
  }
  function spark(x, y, s, c) {
    return '<path d="M' + x + ' ' + (y - s) + 'Q' + x + ' ' + y + ' ' + (x + s) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y + s) + 'Q' + x + ' ' + y + ' ' + (x - s) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y - s) + 'z" fill="' + (c || '#fff') + '"/>';
  }
  function starPath(cx, cy, r1, r2, n, rot) {
    var d = '', i, a, r;
    for (i = 0; i < n * 2; i++) {
      a = (Math.PI / n) * i + (rot == null ? -Math.PI / 2 : rot);
      r = i % 2 ? r2 : r1;
      d += (i ? 'L' : 'M') + (cx + Math.cos(a) * r).toFixed(1) + ' ' + (cy + Math.sin(a) * r).toFixed(1);
    }
    return d + 'Z';
  }
  function glow(I, cx, cy, rad, col, op, name) {
    var n = name || 'glow';
    return '<radialGradient id="' + I.id(n) + '"><stop offset="0" stop-color="' + col + '" stop-opacity="' + op + '"/><stop offset=".55" stop-color="' + col + '" stop-opacity="' + (op * 0.45).toFixed(3) + '"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></radialGradient>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + rad + '" fill="' + I.url(n) + '"/>';
  }
  // faceted diamond gem
  function gem(x, y, r, c, sw) {
    var rx = r * 0.85, t = y - r, b = y + r * 1.15, m = y + r * 0.15;
    return '<path d="M' + x + ' ' + t + 'L' + (x + rx) + ' ' + y + 'L' + x + ' ' + b + 'L' + (x - rx) + ' ' + y + 'Z" fill="' + c.m + '" stroke="' + O + '" stroke-width="' + (sw || 2.6) + '" stroke-linejoin="round"/>' +
      '<path d="M' + x + ' ' + t + 'L' + (x - rx) + ' ' + y + 'L' + x + ' ' + m + 'Z" fill="' + c.l + '"/>' +
      '<path d="M' + x + ' ' + b + 'L' + (x + rx) + ' ' + y + 'L' + x + ' ' + m + 'Z" fill="' + c.d + '"/>' +
      '<path d="M' + (x - rx) + ' ' + y + 'L' + (x + rx) + ' ' + y + '" stroke="#fff" stroke-width=".6" opacity=".4"/>' +
      C(x - r * 0.32, y - r * 0.36, r * 0.16, '#fff', 0);
  }
  // round cabochon gem
  function gemR(x, y, r, c, sw) {
    return C(x, y, r, c.m, sw || 2.6) +
      '<path d="M' + (x - r * 0.75) + ' ' + (y + r * 0.45) + 'A' + r + ' ' + r + ' 0 0 0 ' + (x + r * 0.75) + ' ' + (y + r * 0.45) + 'Q' + x + ' ' + (y + r * 0.1) + ' ' + (x - r * 0.75) + ' ' + (y + r * 0.45) + 'z" fill="' + c.d + '"/>' +
      E(x - r * 0.3, y - r * 0.35, r * 0.34, r * 0.2, '#fff', 0.85, -35) + C(x + r * 0.35, y + r * 0.25, r * 0.1, '#fff', 0);
  }
  function mirror(inner) { return '<g transform="translate(100 0) scale(-1 1)">' + inner + '</g>'; }
  function both(fn) { return fn('l') + mirror(fn('r')); }
  function svg(inner) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' + inner + '</svg>'; }
  function bolt(x, y, s, rot) {
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')"><path d="M0 0L-7 11L-1 11L-8 26L9 7L2 7L7 0Z" fill="#ffe45e" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/><path d="M-1 3L-4 9" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/></g>';
  }
  function flame(x, y, s, rot, c1, c2) {
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')"><path d="M0 0C-9 -6 -8 -16 -2 -26C-2 -18 3 -18 2 -12C8 -16 9 -6 0 0Z" fill="' + c1 + '" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/><path d="M0 -2C-4 -6 -3 -11 0 -15C1 -10 4 -8 0 -2Z" fill="' + c2 + '"/></g>';
  }
  function chain(col, w) {
    var d1 = 'M16 6Q20 44 50 47', d2 = 'M84 6Q80 44 50 47';
    return L(d1, O, 6) + L(d2, O, 6) + L(d1, col, 3.4, 1, '3.6 2.2') + L(d2, col, 3.4, 1, '3.6 2.2');
  }
  function bail(x, y, c) {
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="5.5" ry="6" fill="' + c.m + '" stroke="' + O + '" stroke-width="3"/>' +
      '<ellipse cx="' + x + '" cy="' + (y + 0.5) + '" rx="2.2" ry="3" fill="#3d2a1a" stroke="' + O + '" stroke-width="1"/>' +
      E(x - 2.5, y - 2.5, 1.6, 1, '#fff', 0.8, -30);
  }

  var STEEL = { m: '#c9d1da', l: '#f2f6fa', d: '#8b96a3' };
  var GOLD = { m: '#ffc94a', l: '#fff0b0', d: '#c9861a' };
  var LEA = { m: '#a97c50', l: '#c39566', d: '#6b4a2d' };

  /* ============================== WEAPONS ============================== */
  // local coordinates: blade points up (-y); rotated 45deg so the tip goes up-right.
  function W(inner, c, sc) {
    var k = 0.7071;
    sc = sc || 1;
    return '<g transform="translate(' + (50 + c * k * sc).toFixed(1) + ' ' + (50 - c * k * sc).toFixed(1) + ') rotate(45) scale(' + sc + ')">' + inner + '</g>';
  }
  function wraps(x0, y0, y1, w, col, step) {
    var s = '', y;
    for (y = y0; y < y1; y += step || 4) s += L('M' + (-w) + ' ' + (y + 3) + 'L' + w + ' ' + y, col, 1.6);
    return s;
  }

  function w0(I) {
    var pom = cel(I, 'pom', '<circle cx="0" cy="42" r="6"/>', '#c8c2b6', '#8a8377', '', 6, [-2, -2]);
    var grip = cel(I, 'grip', '<rect x="-4.5" y="15" width="9" height="22" rx="2.5"/>', '#a97c50', '#6b4a2d', wraps(-4.5, 17, 37, 4.5, '#3d2a1a'), 6, [-2, 0]);
    var blade = cel(I, 'blade', '<path d="M-6.5 12L-6.5 -44L0 -55L6.5 -44L6.5 12Z"/>', '#cfc9bd', '#8a8377',
      L('M0 -44L0 8', '#8a8377', 2.2) + '<rect x="-5" y="-42" width="1.8" height="48" fill="#fff" opacity=".6"/>', 7, [-3, 0]);
    var guard = cel(I, 'guard', '<rect x="-16" y="8" width="32" height="8" rx="4"/>', '#a9825a', '#6b4a2d', L('M-12 10.5L10 10.5', '#fff', 1.4, 0.5), 6, [0, -2]);
    return W(pom + grip + blade + guard, -3.5);
  }
  function w1(I) {
    var f = FAM[1];
    var pom = cel(I, 'pom', '<circle cx="0" cy="44" r="6.5"/>', STEEL.m, STEEL.d, '', 6, [-2, -2]) + gemR(0, 44, 2.6, f, 1.4);
    var grip = cel(I, 'grip', '<rect x="-4.5" y="17" width="9" height="22" rx="2.5"/>', '#8a6a4a', '#5e4530', wraps(-4.5, 19, 39, 4.5, f.d), 6, [-2, 0]);
    var blade = cel(I, 'blade', '<path d="M-7.5 12L-7.5 -48L0 -62L7.5 -48L7.5 12Z"/>', '#86c0ff', '#3d86dd',
      L('M0 -48L0 6', '#2a6fc9', 2.6) + '<rect x="-5.5" y="-46" width="2" height="52" fill="#fff" opacity=".65"/>' + L('M-7 -48L0 -60', '#fff', 1.2, 0.5), 7, [-3.5, 0]);
    var guard = cel(I, 'guard', '<path d="M-23 3L-14 10L14 10L23 3L21 16Q0 21 -21 16Z"/>', STEEL.m, STEEL.d, L('M-17 14Q0 18 17 14', '#fff', 1.5, 0.7), 6, [-2, -3]);
    return W(pom + grip + blade + guard + gem(0, 13, 4.6, f), -6, 0.96);
  }
  function w2(I) {
    var f = FAM[2];
    var pom = cel(I, 'pom', '<circle cx="0" cy="44" r="6.5"/>', f.m, f.d, '', 6, [-2, -2]) + C(-2, 42, 1.8, '#fff', 0);
    var grip = cel(I, 'grip', '<rect x="-4.5" y="17" width="9" height="22" rx="2.5"/>', '#5a2f96', '#3a1c66', wraps(-4.5, 19, 39, 4.5, f.l), 6, [-2, 0]);
    var blade = cel(I, 'blade', '<path d="M-8 12C-14 -12 -8 -42 14 -63C11 -42 10 -20 8 12Z"/>', '#c58bff', '#7b3fc6',
      L('M-9 -6L2 -12L-6 -26L6 -33L2 -46', f.l, 1.2, 0.8) + L('M2 -12L8 -4', f.l, 1, 0.6) +
      L('M0 6C-2 -14 1 -34 10 -54', '#e9c9ff', 6, 0.5) + L('M0 6C-2 -14 1 -34 10 -54', '#fff6ff', 2.2) +
      L('M-3 -6L1 -6M-3 -18L1 -18M-1 -30L3 -30M4 -42L8 -42', '#fff', 1.4, 0.9), 7, [-3, 0]);
    var guard = cel(I, 'guard', '<path d="M-24 4Q-14 3 -6 10L6 10Q14 3 24 4Q19 21 0 21Q-19 21 -24 4Z"/>', '#7b3fc6', '#3a1c66', L('M-19 8Q-8 14 0 13Q8 14 19 8', '#ffc94a', 1.6), 6, [-1, -3]);
    return W(pom + grip + blade + guard + gem(0, 13, 5.2, { m: '#d69bff', l: '#f6e4ff', d: '#8a3fd8' }), -7.5, 0.9);
  }
  function w3(I) {
    var gold = GOLD;
    var wing = function (s) {
      return cel(I, 'wing' + s, '<path d="M-8 5C-20 -8 -34 -8 -43 -17C-41 -4 -39 3 -43 10C-37 10 -35 15 -39 21C-29 19 -20 21 -8 19Z"/>', '#fff6d8', '#e4b45a',
        L('M-12 8C-22 2 -30 0 -38 -8M-12 13C-22 11 -30 12 -37 12', '#c9861a', 1.5), 5.5, [-2, -3]);
    };
    var wings = wing('l') + '<g transform="scale(-1 1)">' + wing('r') + '</g>';
    var pom = cel(I, 'pom', '<circle cx="0" cy="46" r="7"/>', gold.m, gold.d, C(0, 46, 3, '#ff8a2a', 0) + C(-1, 45, 1.2, '#fff', 0), 6, [-2, -2]);
    var grip = cel(I, 'grip', '<rect x="-4.5" y="18" width="9" height="24" rx="2.5"/>', '#8a3a24', '#54200f', wraps(-4.5, 20, 42, 4.5, gold.m), 6, [-2, 0]);
    var bo = cel(I, 'bo', '<path d="M-11 10L-11 -46L0 -64L11 -46L11 10Z"/>', gold.m, gold.d, '', 7, [-3, 0]);
    var bi = cel(I, 'bi', '<path d="M-5.5 10L-5.5 -44L0 -57L5.5 -44L5.5 10Z"/>', '#f7fafc', '#b3bfcc', L('M0 -44L0 8', '#b3bfcc', 2), 4.5, [-2, 0]);
    var guard = cel(I, 'guard', '<rect x="-12" y="3" width="24" height="17" rx="5"/>', gold.m, gold.d, L('M-9 6.5L9 6.5', '#fff', 1.4, 0.6), 6, [-2, -3]);
    var sun = '<path d="' + starPath(0, 11.5, 8.5, 4.6, 8) + '" fill="#ff8a2a" stroke="' + O + '" stroke-width="1.4" stroke-linejoin="round"/>' + C(0, 11.5, 3.4, '#fff0b0', 1.2);
    return W(wings + pom + grip + bo + bi + guard + sun, -5.5, 0.94);
  }
  function w4(I) {
    var f = FAM[4];
    var wing = function (s) {
      return cel(I, 'wing' + s, '<path d="M-6 8L-14 0L-27 -10L-24 1L-38 3L-29 10L-36 21L-22 16L-14 25L-6 19Z"/>', '#c42846', '#6b1029',
        L('M-8 10L-26 -6M-8 12L-35 5M-8 15L-33 19', '#ff8a2a', 1.4, 0.9), 5.5, [-2, -3]);
    };
    var wings = wing('l') + '<g transform="scale(-1 1)">' + wing('r') + '</g>';
    var pom = cel(I, 'pom', '<circle cx="0" cy="45" r="6.5"/>', '#4a1f2e', '#22101a', '', 6, [-2, -2]) + gemR(0, 45, 3.2, { m: '#ff4d5e', l: '#fff', d: '#a81c33' }, 1.4);
    var grip = cel(I, 'grip', '<rect x="-4.5" y="18" width="9" height="22" rx="2.5"/>', '#4a1f2e', '#22101a', wraps(-4.5, 20, 40, 4.5, '#ff4d5e'), 6, [-2, 0]);
    var blade = cel(I, 'blade', '<path d="M-8 12L-12 4L-7 -2L-13 -12L-7 -18L-12 -28L-5 -33L-8 -44L2 -44L4 -56L17 -68L11 -52L14 -44L9 -36L12 -24L9 -14L11 -4L9 12Z"/>', '#ff5a68', '#a81c33',
      L('M0 8C0 -14 4 -36 14 -62', '#ff8a2a', 7, 0.55) + L('M0 8C0 -14 4 -36 14 -62', '#fff3b0', 2.6) + L('M-4 -20L-1 -20M-3 -36L0 -36', '#fff', 1, 0.7), 7, [-3, 0]);
    var body = cel(I, 'gd', '<rect x="-8" y="5" width="16" height="16" rx="5"/>', GOLD.m, GOLD.d, '', 5.5, [-2, -2]) + gemR(0, 13, 4.6, { m: '#ff4d5e', l: '#fff', d: '#a81c33' }, 1.6);
    return W(pom + grip + wings + blade + body, -8, 0.84);
  }

  /* ============================== HELMETS ============================== */
  function knight(I, o) {
    var t = o.top;
    var dome = cel(I, 'dome', '<path d="M20 66C14 ' + (t + 18) + ' 30 ' + t + ' 50 ' + t + 'C70 ' + t + ' 86 ' + (t + 18) + ' 80 66Z"/>', o.base, o.shade,
      (o.domeExtra || '') + E(36, t + 12, 7, 3.5, '#fff', 0.5, -35), 7, [-5, -4]);
    var face = P('M31 58L69 58L69 76Q50 86 31 76Z', '#2b1d14', 3.5) + (o.eyes || '');
    var cheek = both(function (s) {
      return cel(I, 'ch' + s, '<path d="M19 58L33 58L33 78Q27 86 20 76Z"/>', o.base, o.shade, L('M24 62L24 74', '#fff', 1.4, 0.5), 6.5, [-3, -2]);
    });
    var band = cel(I, 'band', '<path d="M18 44Q50 53 82 44L82 58Q50 67 18 58Z"/>', o.band, o.bandShade, L('M20 47Q50 56 80 47', '#fff', 1.4, 0.55) + (o.bandExtra || ''), 6.5, [-2, -3]);
    var nose = o.noNose ? '' : cel(I, 'nose', '<path d="M46 46L54 46L54 71L50 79L46 71Z"/>', o.nose || o.base, o.shade, L('M48.5 50L48.5 68', '#fff', 1.4, 0.55), 6, [-1.5, -1]);
    return (o.pre || '') + dome + face + cheek + band + nose + (o.rivets || '') + (o.post || '');
  }
  function eyeDots(c) {
    return E(41, 67, 3, 3.6, c || '#fff') + E(59, 67, 3, 3.6, c || '#fff') + C(41.6, 68, 1.3, O, 0) + C(59.6, 68, 1.3, O, 0);
  }

  function h0(I) {
    var flaps = both(function (s) {
      return cel(I, 'fl' + s, '<path d="M17 58Q9 62 11 76Q13 90 24 86L29 62Z"/>', '#a9825a', '#6b4a2d', L('M17 66Q14 76 20 82', '#3d2a1a', 1.4, 1, '2.5 2.5'), 6.5, [-2, -2]);
    });
    var dome = cel(I, 'dome', '<path d="M18 66C10 36 28 16 50 16C72 16 90 36 82 66Q50 76 18 66Z"/>', '#b98a5a', '#7a5231',
      L('M50 18Q42 40 46 66', '#3d2a1a', 1.7, 1, '3 3') + L('M50 18Q60 40 56 66', '#3d2a1a', 1.7, 1, '3 3') +
      L('M32 28Q28 44 30 62M68 28Q72 44 70 62', '#3d2a1a', 1.4, 0.8, '3 3') + E(34, 30, 8, 4, '#fff', 0.42, -40), 7, [-5, -5]);
    var band = cel(I, 'band', '<path d="M15 54Q50 66 85 54L84 70Q50 82 16 70Z"/>', '#d4a370', '#96683f',
      L('M18 58Q50 70 82 58', '#3d2a1a', 1.5, 1, '3 2.5') + L('M18 66Q50 78 82 66', '#3d2a1a', 1.5, 1, '3 2.5') + L('M20 57Q50 68 80 57', '#fff', 1.3, 0.5), 6.5, [-2, -3]);
    var button = C(50, 16, 4, '#8a6a4a', 2.4) + C(49, 15, 1.3, '#fff', 0);
    var patch = P('M60 34L72 40L70 52L58 47Z', '#c39566', 2.6) + L('M61 38L69 42M60 44L68 48', '#3d2a1a', 1.2, 1, '2 2');
    return flaps + dome + band + patch + button;
  }
  function h1(I) {
    var f = FAM[1];
    var plume = P('M42 24Q34 12 42 6Q46 12 50 4Q54 12 58 6Q66 12 58 24Z', f.m, 3.2) + L('M46 20Q45 12 50 8', f.l, 1.6, 0.9) + L('M54 20Q55 14 52 10', f.d, 1.3);
    var riv = rivet(28, 51, 2, '#e6e1d6') + rivet(40, 54, 2) + rivet(60, 54, 2) + rivet(72, 51, 2);
    return knight(I, { top: 20, base: '#c9c3b7', shade: '#8a8377', band: f.m, bandShade: f.d, pre: plume, rivets: riv, eyes: eyeDots(),
      domeExtra: L('M50 22L50 46', '#8a8377', 2) + rivet(50, 30, 2, '#e6e1d6') + L('M27 36Q34 26 44 24', '#fff', 1.4, 0.5) });
  }
  function h2(I) {
    var f = FAM[2];
    var hood = cel(I, 'hood', '<path d="M15 86C6 56 26 30 50 26C74 30 94 56 85 86Q70 72 66 62L34 62Q30 72 15 86Z"/>', '#9558e6', '#5a2f96',
      L('M28 44Q24 62 22 76M72 44Q76 62 78 76', '#5a2f96', 1.6, 0.9) + L('M36 34Q46 28 58 30', '#fff', 1.6, 0.5), 7, [-5, -5]);
    var opening = P('M32 64Q29 46 50 43Q71 46 68 64Q60 76 50 76Q40 76 32 64Z', '#2b1d14', 3.5) +
      E(42, 60, 3.2, 3.8, '#efd7ff') + E(58, 60, 3.2, 3.8, '#efd7ff') + C(42.6, 61, 1.3, '#7b3fc6', 0) + C(58.6, 61, 1.3, '#7b3fc6', 0);
    var trim = L('M32 64Q29 46 50 43Q71 46 68 64', '#e2c6ff', 2, 0.9);
    var circlet = L('M24 42Q50 32 76 42', O, 8) + L('M24 42Q50 32 76 42', '#d9dde8', 5) + L('M24 40Q50 30 76 40', '#fff', 1.4, 0.7) +
      L('M31 40l1.5 3M36 38l1.5 3M64 38l-1.5 3M69 40l-1.5 3M40 36.5l2 -2M60 36.5l-2 -2', f.d, 1.2);
    var jewel = gem(50, 37, 4.6, f);
    var top = glow(I, 50, 13, 15, f.l, 0.7, 'gg') + gem(50, 12, 6.5, { m: '#c98cff', l: '#f6e4ff', d: '#8a3fd8' }, 2.8) + spark(38, 8, 3, '#fff') + spark(63, 17, 2.6, '#f6e4ff') + C(60, 6, 1.2, '#fff', 0);
    var runes = L('M20 74l3 -4l3 4M74 74l3 -4l3 4', f.l, 1.3, 0.9);
    return hood + opening + trim + circlet + jewel + runes + top;
  }
  function h3(I) {
    var g = GOLD;
    var feather = cel(I, 'fe', '<path d="M60 38C60 20 74 10 89 11C88 26 80 38 66 46Z"/>', '#ffffff', '#c7d6ea', L('M63 42C72 32 80 22 86 14', '#a9bbd6', 1.4) + L('M70 30l4 2M74 25l4 3M67 36l4 2', '#a9bbd6', 1, 0.9), 6, [-3, -3]);
    var crown = cel(I, 'crown', '<path d="M21 50L19 22L35 36L50 16L65 36L81 22L79 50Q50 58 21 50Z"/>', g.m, g.d, L('M24 46Q50 54 76 46', '#fff', 1.5, 0.6) + L('M35 36L35 48M50 22L50 50M65 36L65 48', g.d, 1.4, 0.8), 6.5, [-3, -3]);
    var jewels = C(19, 22, 3.4, '#ff4d5e', 2) + C(50, 16, 3.6, '#ff4d5e', 2) + C(81, 22, 3.4, '#ff4d5e', 2) + C(18.5, 21, 1, '#fff', 0) + C(49.5, 15, 1.1, '#fff', 0) + C(80.5, 21, 1, '#fff', 0) +
      gem(50, 40, 4.6, { m: '#ff4d5e', l: '#ffc2c8', d: '#a81c33' }) + C(30, 46, 2.2, '#ff4d5e', 1.4) + C(70, 46, 2.2, '#ff4d5e', 1.4);
    return knight(I, { top: 38, base: g.m, shade: g.d, band: '#ffd873', bandShade: g.d, nose: g.m, pre: feather, post: crown + jewels, eyes: eyeDots(),
      noNose: false, domeExtra: '' });
  }
  function h4(I) {
    var gold = GOLD;
    var feather = function (a, len, c, s) {
      return '<g transform="rotate(' + a + ') scale(' + len + ')"><path d="M0 0C-7 -6 -7 -20 0 -32C7 -20 7 -6 0 0Z" fill="' + c + '" stroke="' + O + '" stroke-width="' + (3.4 / len).toFixed(2) + '" stroke-linejoin="round"/><path d="M0 -4C-2 -12 -1 -20 0 -26" stroke="#fff" stroke-width="1.2" opacity=".6" fill="none"/></g>';
    };
    var wing = function (s) {
      return '<g transform="translate(24 52)">' + feather(-98, 0.95, '#ff8a2a') + feather(-72, 1.05, gold.m) + feather(-46, 1.02, '#ff4d5e') + feather(-20, 0.8, gold.l) + '</g>';
    };
    var wings = wing('l') + mirror(wing('r'));
    var plumes = '<g transform="translate(50 32)">' + feather(-56, 0.85, '#ff4d5e') + feather(56, 0.85, '#ff4d5e') + feather(-28, 1.05, '#ff8a2a') + feather(28, 1.05, '#ff8a2a') + feather(0, 1.15, gold.m) + '</g>';
    var head = C(50, 28, 6.5, '#ffe39a', 2.6) + P('M55 26L64 29L55 32Z', '#ff8a2a', 2.2) + C(52.5, 26, 1.7, O, 0) + C(53, 25.5, .6, '#fff', 0) + L('M46 23Q49 21 52 22', '#fff', 1.2, 0.8);
    var slit = '<path d="M33 65L47 68L46 72L33 70Z" fill="#ffe45e"/><path d="M67 65L53 68L54 72L67 70Z" fill="#ffe45e"/>' + glow(I, 50, 68, 20, '#ffd24a', 0.55, 'eg');
    var riv = rivet(28, 51, 2, gold.l) + rivet(72, 51, 2, gold.l) + gem(50, 52, 3.8, { m: '#ffd24a', l: '#fff', d: '#e08a00' }, 2.2);
    return '<g transform="translate(50 52) scale(.8) translate(-50 -52)">' + wings + plumes + knight(I, { top: 30, base: '#ff5a68', shade: '#a81c33', band: gold.m, bandShade: gold.d, nose: gold.m, rivets: riv, post: head, eyes: slit,
      domeExtra: L('M50 36L50 46', gold.m, 2.4) + L('M28 50Q30 38 40 36M72 50Q70 38 60 36', gold.m, 2.4) }) + '</g>';
  }

  /* ============================== ARMOR ============================== */
  var TRUNK = 'M34 19Q50 31 66 19L73 25L75 52L73 82Q50 91 27 82L25 52L27 25Z';
  var SLEEVE = 'M31 22L17 28Q6 34 9 50Q11 58 22 57L29 52Z';
  function shell(I, o) {
    var sl = both(function (s) {
      return cel(I, 'sl' + s, '<path d="' + SLEEVE + '"/>', o.sBase, o.sShade, (o.sExtra ? o.sExtra(s) : '') + E(16, 36, 4, 7, '#fff', 0.4, 20), 6.5, [-3, -3]);
    });
    var neck = P('M33 19Q50 8 67 19Q50 30 33 19Z', '#3d2a1a', 3);
    var trunk = cel(I, 'trunk', '<path d="' + TRUNK + '"/>', o.base, o.shade, (o.extra || '') + E(36, 38, 3.5, 9, '#fff', 0.38, 8), 7, o.off || [-4, -4]);
    return (o.defs || '') + sl + neck + trunk + (o.post || '');
  }
  function rect100(fill) { return '<rect x="0" y="0" width="100" height="100" fill="' + fill + '"/>'; }

  function a0(I) {
    var pat = '<pattern id="' + I.id('quilt') + '" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 0L12 12M12 0L0 12" stroke="#6b5236" stroke-width="1.3" stroke-dasharray="2.6 2" fill="none"/></pattern>';
    var lace = '';
    var y;
    for (y = 32; y < 80; y += 9) lace += L('M46 ' + y + 'L54 ' + (y + 7) + 'M54 ' + y + 'L46 ' + (y + 7), '#5e4530', 1.8);
    return shell(I, {
      defs: pat, base: '#cdb48a', shade: '#8f7550', sBase: '#cdb48a', sShade: '#8f7550',
      extra: rect100(I.url('quilt')) + L('M50 27L50 84', '#3d2a1a', 2.2) + lace + L('M29 77Q50 86 71 77', '#3d2a1a', 1.5, 1, '3 2.5') + L('M28 30L28 50', '#3d2a1a', 1.3, 0.7, '3 2.5'),
      sExtra: function () { return rect100(I.url('quilt')) + L('M6 52Q16 62 30 54', '#3d2a1a', 1.5, 1, '3 2.5'); },
      post: C(50, 26, 0.01, 'none', 0)
    });
  }
  function a1(I) {
    var f = FAM[1];
    var pat = '<pattern id="' + I.id('mesh') + '" width="8" height="6" patternUnits="userSpaceOnUse"><g fill="none" stroke="#6f685c" stroke-width="1.15"><circle cx="2" cy="1.5" r="2"/><circle cx="6" cy="1.5" r="2"/><circle cx="0" cy="4.5" r="2"/><circle cx="4" cy="4.5" r="2"/><circle cx="8" cy="4.5" r="2"/></g><g fill="none" stroke="#fff" stroke-width=".6" opacity=".55"><path d="M1 0.5A2 2 0 0 1 3 0.6M5 0.5A2 2 0 0 1 7 0.6M3 3.5A2 2 0 0 1 5 3.6"/></g></pattern>';
    return shell(I, {
      defs: pat, base: '#c9c3b7', shade: '#8a8377', sBase: '#c9c3b7', sShade: '#8a8377',
      extra: rect100(I.url('mesh')) + L('M34 19Q50 31 66 19', f.m, 8) + L('M34 21Q50 33 66 21', f.l, 1.5, 0.7) +
        '<path d="M20 76Q50 87 80 76L80 92L20 92Z" fill="' + f.m + '"/>' + L('M22 79Q50 90 78 79', f.l, 1.5, 0.7) + L('M20 76Q50 87 80 76', f.d, 2) +
        rivet(35, 82, 1.8, f.l) + rivet(50, 85, 1.8, f.l) + rivet(65, 82, 1.8, f.l),
      sExtra: function () { return rect100(I.url('mesh')) + '<path d="M0 50Q14 62 34 54L34 74L0 74Z" fill="' + f.m + '"/>' + L('M4 53Q16 63 32 56', f.l, 1.5, 0.7); }
    });
  }
  function a2(I) {
    var f = FAM[2];
    var paul = both(function (s) {
      return cel(I, 'pa' + s, '<path d="M6 32Q8 12 33 17L35 37Q19 43 6 32Z"/>', f.m, f.d, L('M10 30Q14 20 28 20', '#fff', 1.6, 0.6) + L('M12 34Q22 36 32 32', f.d, 1.4) + E(15, 24, 3.5, 2, '#fff', 0.5, -30), 6.5, [-3, -3]) + rivet(30, 26, 1.7, f.l);
    });
    var sig = glow(I, 50, 46, 19, f.l, 0.9, 'sg') + C(50, 46, 9.5, 'none', 0) +
      '<circle cx="50" cy="46" r="9" fill="#3a1c66" stroke="' + O + '" stroke-width="2"/>' + '<circle cx="50" cy="46" r="7.4" fill="none" stroke="#f0deff" stroke-width="1.6"/>' +
      L('M50 39.5L56 50L44 50Z', '#f0deff', 1.6) + L('M50 43.5L50 47.5M47.5 45.5L52.5 45.5', '#fff', 1.3);
    return shell(I, {
      base: '#d8d0f2', shade: '#8f7fc4', sBase: '#a476ea', sShade: '#6a3fb0',
      extra: L('M50 30L50 40M50 55L50 82', '#8f7fc4', 2) +
        '<path d="M24 62Q50 72 76 62L76 76Q50 86 24 76Z" fill="' + f.m + '"/>' + L('M26 65Q50 75 74 65', f.l, 1.5, 0.7) + L('M24 62Q50 72 76 62M24 76Q50 86 76 76', f.d, 2) +
        rivet(32, 70, 1.6, f.l) + rivet(68, 70, 1.6, f.l) + L('M28 24L33 34M72 24L67 34', '#8f7fc4', 1.6) + L('M33 22Q50 34 67 22', f.m, 5),
      post: paul + sig
    });
  }
  function a3(I) {
    var g = GOLD;
    var guards = both(function (s) {
      return cel(I, 'gu' + s, '<path d="M5 34Q6 12 34 16L35 40Q17 46 5 34Z"/>', g.m, g.d, L('M8 34Q18 24 34 26M10 40Q22 36 34 34', g.d, 1.6) + L('M9 30Q13 20 30 19', '#fff', 1.6, 0.65), 6.5, [-3, -3]) + gem(17, 27, 3.4, { m: '#ff4d5e', l: '#ffc2c8', d: '#a81c33' }, 2);
    });
    var sun = '<path d="' + starPath(50, 45, 12.5, 7.5, 10) + '" fill="#ff8a2a" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>' + C(50, 45, 6, '#ffe39a', 1.6) + C(48.5, 43.5, 1.6, '#fff', 0);
    var belt = '<path d="M25 66Q50 75 75 66L75 77Q50 86 25 77Z" fill="#d64545" stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round"/>' + L('M27 70Q50 79 73 70', '#ff8b8b', 1.4, 0.7) +
      '<rect x="43" y="67" width="14" height="13" rx="3" fill="' + g.m + '" stroke="' + O + '" stroke-width="2.4"/>' + C(50, 73.5, 2.8, '#ff4d5e', 1.4);
    return shell(I, {
      base: g.m, shade: g.d, sBase: '#d64545', sShade: '#8f1f2b',
      extra: L('M50 58L50 66M50 80L50 86', g.d, 2) + L('M34 20Q50 32 66 20', g.d, 3) + L('M27 30Q27 55 29 78M73 30Q73 55 71 78', g.d, 1.6, 0.8) + L('M30 60Q50 68 70 60', g.l, 1.3, 0.6),
      sExtra: function () { return L('M6 50Q16 60 30 54', '#ffb02e', 3); },
      post: guards + sun + belt
    });
  }
  function a4(I) {
    var f = FAM[4];
    var pat = '<pattern id="' + I.id('scale') + '" width="10" height="8" patternUnits="userSpaceOnUse"><path d="M0 4A5 4 0 0 0 10 4M-5 0A5 4 0 0 0 5 0M5 0A5 4 0 0 0 15 0" fill="none" stroke="#7a1226" stroke-width="1.3"/><path d="M1.5 5.5A4 3 0 0 0 4 7M6.5 1.5A4 3 0 0 0 9 3" fill="none" stroke="#ffb0b8" stroke-width=".8" opacity=".7"/></pattern>';
    var head = function (s) {
      return cel(I, 'hn' + s, '<path d="M28 15L26 3L39 12Z"/>', '#ffd166', '#c9861a', '', 4.5, [-1, -1]) +
        cel(I, 'hd' + s, '<path d="M38 27C36 14 22 11 14 16L4 14L8 22L2 28L12 30C16 39 30 41 38 35Z"/>', '#ec4358', '#8f1428',
          L('M14 31L20 34', '#8f1428', 1.4) + '<path d="M12 30L14 36L17 31ZM19 33L21 38L24 33Z" fill="#fff"/>' + L('M16 18Q26 14 34 20', '#fff', 1.4, 0.55), 5.5, [-3, -3]) +
        E(23, 23, 3, 2.3, '#ffe45e') + C(23.5, 23, 1, O, 0) + C(7, 21, 1, O, 0);
    };
    var heads = both(head);
    var core = glow(I, 50, 47, 20, '#ffb02e', 0.85, 'cg') + C(50, 47, 10.5, GOLD.m, 2.4) + C(50, 47, 7.6, '#ff6a2a', 1.6) + C(50, 47, 4.4, '#fff3b0', 0) + C(48.5, 45.5, 1.4, '#fff', 0) +
      L('M50 34L50 37M50 57L50 60M37 47L40 47M60 47L63 47', GOLD.m, 2.2);
    return shell(I, {
      defs: pat, base: '#ff5a68', shade: '#a81c33', sBase: '#c42846', sShade: '#6b1029',
      extra: rect100(I.url('scale')) + L('M50 62L50 84', GOLD.m, 2.4) + '<path d="M24 66Q50 76 76 66L76 78Q50 88 24 78Z" fill="' + GOLD.m + '"/>' + L('M26 69Q50 79 74 69', '#fff', 1.4, 0.6) + L('M24 66Q50 76 76 66M24 78Q50 88 76 78', GOLD.d, 1.8) + L('M34 20Q50 32 66 20', GOLD.m, 4),
      sExtra: function () { return rect100(I.url('scale')); },
      post: '<g transform="translate(50 30) scale(.86) translate(-50 -30)">' + heads + '</g>' + core
    });
  }

  /* ============================== BOOTS ============================== */
  var BOOT = 'M30 12L62 12L62 52C62 58 70 58 80 62C91 66 93 72 93 78L93 82L24 82L24 76C26 70 30 66 30 58Z';
  function boot(I, o) {
    var body = cel(I, 'body', '<path d="' + BOOT + '"/>', o.base, o.shade, (o.extra || '') + E(38, 34, 3, 12, '#fff', 0.38), 7, [-4, -4]);
    var sole = cel(I, 'sole', '<path d="M22 76L94 76L94 85Q94 89 90 89L27 89Q22 89 22 84Z"/>', o.soleBase || '#5a4030', o.soleShade || '#33231a', o.soleExtra || (L('M26 80L90 80', '#fff', 1.2, 0.25)), 6, [-2, -3]);
    var heel = cel(I, 'heel', '<path d="M22 76L42 76L42 89L27 89Q22 89 22 84Z"/>', o.heel || '#4a3422', '#26170f', '', 5, [-1, -2]);
    var cuff = cel(I, 'cuff', '<rect x="27" y="9" width="39" height="15" rx="4"/>', o.cuff, o.cuffShade, (o.cuffExtra || '') + L('M31 12.5L62 12.5', '#fff', 1.4, 0.55), 6.5, [-2, -3]);
    return (o.pre || '') + body + sole + heel + cuff + (o.post || '');
  }
  function b0(I) {
    var lace = '', y;
    for (y = 28; y < 56; y += 7) lace += L('M52 ' + y + 'L60 ' + (y + 6) + 'M60 ' + y + 'L52 ' + (y + 6), '#f4e6c4', 1.7) + C(52, y, 1, '#3d2a1a', 0) + C(60, y, 1, '#3d2a1a', 0);
    return boot(I, { base: '#a97c50', shade: '#6b4a2d', cuff: '#cfa06c', cuffShade: '#96683f',
      extra: '<rect x="49" y="26" width="15" height="32" fill="#7a5433" opacity=".5"/>' + lace +
        L('M70 60L76 64L82 65', '#f4e6c4', 1.7) + L('M40 44L46 48M38 62L44 60M76 72L84 76', '#e2c090', 1.4, 0.8) + P('M70 68L84 72L80 80L68 76Z', '#c39566', 2.2) + L('M71 71L80 74', '#3d2a1a', 1, 1, '2 2'),
      cuffExtra: L('M31 20L62 20', '#3d2a1a', 1.3, 1, '3 2.5') });
  }
  function b1(I) {
    var f = FAM[1];
    var strap = function (y) {
      return '<rect x="28" y="' + y + '" width="36" height="7" fill="' + f.d + '" stroke="' + O + '" stroke-width="1.8"/>' + L('M30 ' + (y + 2) + 'L62 ' + (y + 2), f.m, 1.3, 0.9) +
        '<rect x="50" y="' + (y - 1) + '" width="9" height="9" rx="1.5" fill="none" stroke="' + O + '" stroke-width="3.6"/><rect x="50" y="' + (y - 1) + '" width="9" height="9" rx="1.5" fill="none" stroke="' + STEEL.m + '" stroke-width="1.8"/>' + L('M54.5 ' + (y + 1) + 'L54.5 ' + (y + 6), STEEL.d, 1.4);
    };
    return boot(I, { base: '#8a6a4a', shade: '#553a24', cuff: f.m, cuffShade: f.d,
      extra: strap(28) + strap(42) + '<path d="M70 58C84 62 93 68 93 78L93 84L70 84Z" fill="' + STEEL.m + '"/>' + L('M70 58C84 62 93 68 93 78', STEEL.d, 2.4) + L('M74 66Q86 70 89 78', '#fff', 1.6, 0.7) + rivet(78, 74, 1.8, STEEL.l) + rivet(84, 79, 1.8, STEEL.l),
      cuffExtra: rivet(34, 16.5, 1.6, f.l) + rivet(59, 16.5, 1.6, f.l) });
  }
  function b2(I) {
    var f = FAM[2];
    var feather = function (a, len, c) {
      return '<g transform="rotate(' + a + ') scale(' + len + ')"><path d="M0 0C-8 -6 -8 -22 0 -34C8 -22 8 -6 0 0Z" fill="' + c + '" stroke="' + O + '" stroke-width="' + (3.4 / len).toFixed(2) + '" stroke-linejoin="round"/><path d="M0 -4C-2 -12 -2 -22 0 -28" stroke="' + f.d + '" stroke-width="1.3" fill="none" opacity=".7"/></g>';
    };
    var wing = '<g transform="translate(30 40)">' + feather(-82, 0.72, '#e9d3ff') + feather(-58, 0.86, '#f6ecff') + feather(-32, 0.86, '#ffffff') + feather(-8, 0.66, '#e9d3ff') + '</g>';
    return boot(I, { pre: wing, base: '#b06bff', shade: '#6a34b0', cuff: '#e2c6ff', cuffShade: '#a67ee0', soleBase: '#f2e6ff', soleShade: '#b79ae0', heel: '#8a55d0',
      extra: L('M50 30L62 34M50 42L62 46', '#7b3fc6', 1.6) + '<path d="M70 58C84 62 93 68 93 78L93 84L70 84Z" fill="#c992ff" opacity=".7"/>' + L('M72 63Q84 68 90 76', '#f6e4ff', 1.6, 0.8),
      post: gem(45, 17, 3.4, f, 2), soleExtra: '' });
  }
  function b3(I) {
    var g = GOLD;
    var spur = P('M24 74L12 78', GOLD.d, 5) + L('M24 74L12 78', GOLD.m, 2) + '<path d="' + starPath(9, 79, 7, 3.4, 6, 0) + '" fill="' + g.m + '" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/>' + C(9, 79, 1.5, O, 0);
    return boot(I, { pre: spur, base: g.m, shade: g.d, cuff: g.l, cuffShade: g.m, soleBase: '#6b4a2d', soleShade: '#3d2a1a', heel: '#8a3a24', soleExtra: '',
      extra: L('M30 28L62 28M30 40L62 40', g.d, 2) + L('M32 30L60 30M32 42L60 42', '#fff', 1.2, 0.5) +
        L('M68 58Q72 70 68 82M76 60Q80 70 78 82M84 64Q88 72 86 82', g.d, 2) + L('M70 62Q73 70 71 78', '#fff', 1.3, 0.5) + rivet(35, 34, 1.6, g.l) + rivet(57, 34, 1.6, g.l) + rivet(35, 46, 1.6, g.l) + rivet(57, 46, 1.6, g.l),
      post: gem(46, 16.5, 4, { m: '#ff4d5e', l: '#ffc2c8', d: '#a81c33' }, 2) });
  }
  function b4(I) {
    var f = FAM[4];
    var solGlow = '<radialGradient id="' + I.id('sg') + '"><stop offset="0" stop-color="#ffb02e" stop-opacity=".9"/><stop offset="1" stop-color="#ff4d5e" stop-opacity="0"/></radialGradient><ellipse cx="58" cy="88" rx="40" ry="11" fill="' + I.url('sg') + '"/>';
    var post = bolt(20, 14, 0.9, 14) + bolt(84, 34, 1.0, -12) + bolt(14, 52, 0.7, 20) +
      L('M18 42L24 48L18 56', '#fff6b0', 1.5, 0.9);
    return solGlow +
      boot(I, { base: '#ff5a68', shade: '#a81c33', cuff: '#4a1f2e', cuffShade: '#22101a', soleBase: '#ffe45e', soleShade: '#ff9a2a', heel: '#ff9a2a', soleExtra: L('M26 80L90 80', '#fff', 1.6, 0.9),
        extra: L('M40 24L52 32L44 40L56 50', '#ffe45e', 2.2) + L('M68 62Q82 66 90 74', '#ffb0b8', 1.6, 0.7) + L('M30 60L40 64', '#7a1226', 1.6),
        cuffExtra: L('M29 14L64 14', GOLD.m, 1.6) + L('M29 21L64 21', GOLD.m, 1.6),
        post: post });
  }

  /* ============================== RINGS ============================== */
  var BAND = 'M24 66a26 26 0 1 0 52 0a26 26 0 1 0 -52 0Z M34 66a16 16 0 1 0 32 0a16 16 0 1 0 -32 0Z';
  function band(I, base, shade, hi) {
    var sh = '<path fill-rule="evenodd" clip-rule="evenodd" d="' + BAND + '"/>';
    return cel(I, 'band', sh, base, shade, L('M30 56A22 22 0 0 1 44 46', hi || '#fff', 2.6, 0.75), 7.5, [-4, -5]);
  }
  function r0(I) {
    var boss = cel(I, 'boss', '<ellipse cx="50" cy="39" rx="11" ry="7.5"/>', '#d99356', '#8a4f26', E(46, 36, 5, 2, '#fff', 0.55, -12), 6, [-2, -2]);
    return band(I, '#c98548', '#84502a') + boss + L('M44 39L56 39', '#7a4a26', 1.4) + L('M30 76Q36 86 46 89', '#7a4a26', 1.4, 0.6) + L('M32 62L36 66', '#e9b27e', 1.5, 0.7);
  }
  function r1(I) {
    var f = FAM[1];
    var wings = L('M38 44L28 46M62 44L72 46', O, 5) + L('M38 44L28 46M62 44L72 46', '#c7ced8', 2.4);
    var bez = cel(I, 'bez', '<ellipse cx="50" cy="34" rx="14" ry="12"/>', '#e3e8ee', '#9aa4b0', '', 6.5, [-2, -3]);
    var stone = '<ellipse cx="50" cy="34" rx="9.5" ry="8" fill="' + f.m + '" stroke="' + O + '" stroke-width="2"/><path d="M41 37Q50 44 59 37Q56 42 50 42Q44 42 41 37Z" fill="' + f.d + '"/>' + E(46, 30.5, 3.6, 2, '#fff', 0.85, -30) + C(54, 36, 1.2, '#fff', 0);
    return band(I, '#e3e8ee', '#98a3b0') + wings + bez + stone;
  }
  function r2(I) {
    var f = FAM[2];
    var prongs = '', k;
    var pr = [[35, 34, -30], [65, 34, 30], [39, 18, -12], [61, 18, 12]];
    for (k = 0; k < pr.length; k++) prongs += '<g transform="translate(' + pr[k][0] + ' ' + pr[k][1] + ') rotate(' + pr[k][2] + ')"><path d="M-2.6 5L0 -5L2.6 5Z" fill="#dfe3f0" stroke="' + O + '" stroke-width="2" stroke-linejoin="round"/></g>';
    var seat = cel(I, 'seat', '<ellipse cx="50" cy="40" rx="16" ry="8"/>', '#dfe3f0', '#8f97b0', '', 6, [-2, -2]);
    var side = gemR(33, 53, 3.2, f, 1.8) + gemR(67, 53, 3.2, f, 1.8);
    var big = '<path d="M50 9L65 20L60 40L50 46L40 40L35 20Z" fill="' + f.m + '" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M50 9L35 20L50 25Z" fill="' + f.l + '"/><path d="M50 9L65 20L50 25Z" fill="#cf9dff"/><path d="M35 20L40 40L50 25Z" fill="#c78cff"/><path d="M65 20L60 40L50 25Z" fill="' + f.d + '"/><path d="M40 40L50 46L60 40L50 25Z" fill="#8a3fd8"/>' +
      L('M35 20L50 25L65 20M50 25L50 46', '#fff', 0.8, 0.5) + E(44, 17, 3, 1.6, '#fff', 0.85, -25) + C(56, 33, 1.2, '#fff', 0);
    return band(I, '#dfe3f0', '#8f97b0') + seat + side + prongs + big;
  }
  function r3(I) {
    var g = GOLD;
    var rays = '', i, a;
    for (i = 0; i < 12; i++) {
      a = i * 30;
      rays += '<path transform="rotate(' + a + ' 50 31)" d="M50 16.5L52.4 21L47.6 21Z" fill="' + '#ff8a2a' + '"/>';
    }
    var plate = cel(I, 'plate', '<ellipse cx="50" cy="32" rx="22" ry="17"/>', g.m, g.d, '', 7, [-3, -4]);
    var face = rays + C(50, 31, 8.4, '#ffe39a', 1.8) + '<path d="M43 34A8 8 0 0 0 57 34Q50 30 43 34Z" fill="#ffc94a"/>' + C(47, 29.5, 1.3, O, 0) + C(53, 29.5, 1.3, O, 0) +
      L('M47.3 34Q50 36.4 52.7 34', O, 1.4) + E(48, 26.5, 2.4, 1.2, '#fff', 0.8, -25) + '<ellipse cx="45" cy="33" rx="1.6" ry=".9" fill="#ff8a6a" opacity=".7"/><ellipse cx="55" cy="33" rx="1.6" ry=".9" fill="#ff8a6a" opacity=".7"/>';
    return band(I, g.m, g.d, '#fff8d0') + plate + L('M32 26Q36 19 45 17', '#fff', 1.6, 0.7) + face;
  }
  function r4(I) {
    var f = FAM[4];
    var flames = flame(30, 40, 0.9, -28, '#ff6a2a', '#ffd24a') + flame(70, 40, 0.9, 28, '#ff6a2a', '#ffd24a') + flame(38, 26, 0.7, -14, '#ff4d5e', '#ffb02e') + flame(62, 26, 0.7, 14, '#ff4d5e', '#ffb02e') + flame(50, 14, 0.8, 0, '#ff4d5e', '#ffd24a');
    var seat = cel(I, 'seat', '<path d="M32 44L36 30Q50 22 64 30L68 44Q50 50 32 44Z"/>', '#5a4050', '#251722', '', 6.5, [-2, -3]);
    var spikes = P('M26 52L20 44L32 48Z', '#5a4050', 2.4) + P('M74 52L80 44L68 48Z', '#5a4050', 2.4);
    var jewel = glow(I, 50, 32, 24, '#ff4d5e', 0.85, 'jg') + gemR(50, 32, 13, { m: '#ff3350', l: '#ffb0b8', d: '#8e1128' }, 3) +
      '<path d="M44 26Q50 21 56 26" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".7"/><path d="M50 20L50 44M38 32L62 32" stroke="#ffd2d6" stroke-width=".7" opacity=".4"/>';
    var edge = L('M30 56A22 22 0 0 1 40 47', '#ff4d5e', 1.8, 0.9);
    return flames + band(I, '#4a3444', '#1e1320', '#ff8a96') + edge + seat + spikes + jewel + rivet(32, 55, 1.6, '#ff4d5e') + rivet(68, 55, 1.6, '#ff4d5e');
  }

  /* ============================== AMULETS ============================== */
  function m0(I) {
    var cord = L('M16 6Q20 44 50 47', O, 6) + L('M84 6Q80 44 50 47', O, 6) + L('M16 6Q20 44 50 47', '#8a5a34', 3) + L('M84 6Q80 44 50 47', '#8a5a34', 3) + L('M17 8Q21 40 46 46', '#c39566', 1, 0.7);
    var beads = C(24, 26, 3.3, '#c9793f', 1.8) + C(76, 26, 3.3, '#7fb0a0', 1.8) + C(33, 38, 3, '#d9c7a0', 1.8) + C(67, 38, 3, '#c9793f', 1.8);
    var tooth = cel(I, 'tooth', '<path d="M36 52Q50 42 64 52C66 66 60 80 50 94C40 80 34 66 36 52Z"/>', '#f6ecd6', '#c9b28a',
      L('M42 62Q46 74 50 84', '#c9b28a', 1.6) + L('M44 58L48 66', '#a99060', 1.2) + E(42, 58, 3, 6, '#fff', 0.7, 12), 7, [-4, -3]);
    var hole = C(50, 55, 3.2, '#3d2a1a', 1.6);
    var wrap = L('M45 49Q50 52 55 49', '#8a5a34', 3);
    return cord + beads + tooth + hole + wrap;
  }
  function m1(I) {
    var f = FAM[1];
    var disc = cel(I, 'disc', '<path fill-rule="evenodd" clip-rule="evenodd" d="M50 47a23 23 0 1 0 0.01 0Z M50 62.5a7 7 0 1 1 -0.01 0Z"/>', '#63b4ff', '#2a6fc9',
      '<circle cx="50" cy="70" r="15.5" fill="none" stroke="' + f.d + '" stroke-width="1.6"/>' + L('M36 60Q40 54 46 52', '#fff', 2, 0.8) +
      L('M50 47.5L50 52M50 87.5L50 83M27.5 70L32 70M72.5 70L68 70M34 54L37 57M66 54L63 57M34 86L37 83M66 86L63 83', f.d, 1.6), 7, [-4, -4]);
    return chain('#dfe4ea') + bail(50, 45, { m: '#dfe4ea' }) + disc;
  }
  function m2(I) {
    var f = FAM[2];
    var pts = [], i, a;
    for (i = 0; i < 10; i++) { a = (Math.PI / 5) * i - Math.PI / 2; pts.push([50 + Math.cos(a) * (i % 2 ? 12 : 29), 68 + Math.sin(a) * (i % 2 ? 12 : 29)]); }
    var facets = '';
    for (i = 0; i < 5; i++) {
      var o = pts[i * 2], v1 = pts[(i * 2 + 9) % 10], v2 = pts[(i * 2 + 1) % 10];
      facets += '<path d="M50 68L' + v1[0].toFixed(1) + ' ' + v1[1].toFixed(1) + 'L' + o[0].toFixed(1) + ' ' + o[1].toFixed(1) + 'Z" fill="' + f.l + '" opacity=".55"/>' +
        '<path d="M50 68L' + o[0].toFixed(1) + ' ' + o[1].toFixed(1) + 'L' + v2[0].toFixed(1) + ' ' + v2[1].toFixed(1) + 'Z" fill="' + f.d + '" opacity=".5"/>';
    }
    var star = cel(I, 'star', '<path d="' + starPath(50, 68, 29, 12, 5) + '"/>', f.m, f.d, facets + L('M50 68L' + pts[0][0] + ' ' + pts[0][1], '#fff', 0.8, 0.4), 7, [-2, -3]);
    return chain('#e6d3ff') + bail(50, 46, { m: '#ffd873' }) + star + gemR(50, 68, 4.6, { m: '#f6e4ff', l: '#fff', d: '#c78cff' }, 1.8) + spark(24, 46, 4, '#fff') + spark(78, 84, 3.4, '#f6e4ff') + spark(80, 50, 2.4, '#fff');
  }
  function m3(I) {
    var g = GOLD;
    var rays = '', i;
    for (i = 0; i < 12; i++) rays += '<path transform="rotate(' + (i * 30) + ' 50 68)" d="M50 37.5L55 51L45 51Z" fill="' + (i % 2 ? '#ff9a2a' : g.m) + '" stroke="' + O + '" stroke-width="2.2" stroke-linejoin="round"/>';
    var locket = cel(I, 'lock', '<circle cx="50" cy="68" r="19"/>', g.m, g.d, '<circle cx="50" cy="68" r="14.5" fill="none" stroke="' + g.d + '" stroke-width="1.4"/>' + L('M36 58Q40 52 47 50', '#fff', 2, 0.75), 7, [-3, -4]);
    var sun = '<path d="' + starPath(50, 68, 11, 6, 8) + '" fill="#ff8a2a" stroke="' + O + '" stroke-width="1.5" stroke-linejoin="round"/>' + C(50, 68, 5, '#ffe39a', 1.5) + C(48.5, 66.5, 1.4, '#fff', 0);
    return chain('#ffd873') + rays + bail(50, 45, g) + locket + sun + '<rect x="67" y="66" width="5" height="4" rx="1" fill="' + g.d + '" stroke="' + O + '" stroke-width="1.4"/>' + spark(16, 48, 3.6, '#fff8d0') + spark(86, 62, 3, '#fff8d0');
  }
  function m4(I) {
    var f = FAM[4];
    var claw = function (s) {
      return cel(I, 'cl' + s, '<path d="M45 96C22 88 12 68 20 44C23 58 30 72 52 86Z"/>', '#4a3a46', '#1e1320', L('M22 56Q26 74 44 88', '#a9899c', 1.3, 0.7), 5, [-1, -2]) +
        cel(I, 'ct' + s, '<path d="M31 47C19 47 15 39 20 33C23 40 30 43 36 42Z"/>', '#ffd873', '#c9861a', '', 3.6, [-1, -1]);
    };
    var claws = both(claw);
    var heart = 'M50 87C30 73 22 60 24 51C26 40 42 38 50 49C58 38 74 40 76 51C78 60 70 73 50 87Z';
    var gemH = glow(I, 50, 64, 34, '#ff4d5e', 0.9, 'hg') +
      cel(I, 'heart', '<path d="' + heart + '"/>', '#ff4763', '#a01230', L('M33 50Q38 45 44 49', '#fff', 2.6, 0.85) + L('M50 50L50 82M35 56L50 66L65 56', '#ffb0b8', 0.9, 0.4) + E(66, 62, 5, 9, '#7a0d24', 0.35, 25), 7, [-3, -3]) +
      C(70, 50, 1.6, '#fff', 0);
    var top = P('M44 34Q50 40 56 34L54 30Q50 32 46 30Z', '#4a3a46', 2.2);
    return chain('#c9a25a') + bail(50, 45, { m: '#ffd873' }) + claws + gemH + top +
      C(16, 84, 1.8, '#ffb02e', 0) + C(85, 78, 1.5, '#ff8a2a', 0) + C(90, 90, 1.2, '#ffd24a', 0) + C(11, 68, 1.3, '#ff8a2a', 0) + spark(84, 46, 3, '#ffd2d6') + spark(14, 52, 2.6, '#ffd2d6');
  }

  /* ============================== dispatch ============================== */
  var BUILD = {
    weapon: [w0, w1, w2, w3, w4],
    helmet: [h0, h1, h2, h3, h4],
    armor: [a0, a1, a2, a3, a4],
    boots: [b0, b1, b2, b3, b4],
    ring: [r0, r1, r2, r3, r4],
    amulet: [m0, m1, m2, m3, m4]
  };
  var SPARKS = {
    weapon: [[16, 22, 4.5], [84, 82, 4], [28, 8, 3], [90, 56, 3]],
    helmet: [[10, 12, 4], [90, 14, 3.6], [8, 90, 3.2], [92, 88, 4]],
    armor: [[8, 10, 4], [92, 10, 3.6], [6, 90, 3.4], [94, 90, 4]],
    boots: [[12, 18, 4], [88, 18, 3.6], [8, 96, 0], [60, 6, 3]],
    ring: [[14, 18, 4], [88, 16, 3.6], [10, 52, 3], [92, 56, 3.6]],
    amulet: [[8, 62, 3.6], [92, 70, 3.6], [10, 92, 3], [90, 92, 3.4]]
  };
  var GLOWC = { weapon: [56, 46], helmet: [50, 50], armor: [50, 52], boots: [56, 54], ring: [50, 54], amulet: [50, 62] };

  function icon(slot, rarity, uid) {
    var r = Math.max(0, Math.min(4, rarity | 0));
    var fn = BUILD[slot] && BUILD[slot][r];
    if (!fn) return svg('');
    var I = ids('gear-' + slot + '-' + r, uid);
    var out = '', g = GLOWC[slot], k, sp;
    if (r >= 1) out += glow(I, g[0], g[1], 46, FAM[r].m, GLOW_OP[r], 'aura');
    out += fn(I);
    if (r >= 2) {
      sp = SPARKS[slot];
      for (k = 0; k < r - 1 && k < sp.length; k++) if (sp[k][2] > 0) out += spark(sp[k][0], sp[k][1], sp[k][2], r === 4 ? '#ffd2d6' : '#fff');
    }
    return svg(out);
  }

  window.GEAR_ART = { icon: icon };
})();

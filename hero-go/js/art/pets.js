/* Hero Go! — pet companions + eggs. Pure inline SVG strings. See ART_CONTRACT.md */
(function () {
  var O = '#2b1d14';

  function ids(key, uid) {
    var s = uid != null && uid !== '' ? '-' + uid : '';
    return {
      id: function (n) { return key + '-' + n + s; },
      url: function (n) { return 'url(#' + key + '-' + n + s + ')'; }
    };
  }

  // Cel-shaded part: outline behind, base fill, shade crescent bottom-right, extra details clipped inside.
  // `shape` = markup of one or more shapes WITHOUT fill/stroke attributes (union is used).
  function cel(I, name, shape, base, shade, extra, sw, off) {
    off = off || [-4, -5];
    return '<clipPath id="' + I.id(name) + '">' + shape + '</clipPath>' +
      '<g fill="none" stroke="' + O + '" stroke-width="' + (sw || 6.5) + '" stroke-linejoin="round">' + shape + '</g>' +
      '<g clip-path="' + I.url(name) + '">' +
        '<g fill="' + shade + '">' + shape + '</g>' +
        '<g fill="' + base + '" transform="translate(' + off[0] + ' ' + off[1] + ')">' + shape + '</g>' +
        (extra || '') +
      '</g>';
  }

  function eye(x, y, r, col) {
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + (r * 0.82) + '" ry="' + r + '" fill="' + (col || O) + '"/>' +
      '<ellipse cx="' + x + '" cy="' + (y + r * 0.45) + '" rx="' + (r * 0.55) + '" ry="' + (r * 0.35) + '" fill="#fff" opacity=".18"/>' +
      '<circle cx="' + (x + r * 0.28) + '" cy="' + (y - r * 0.38) + '" r="' + (r * 0.4) + '" fill="#fff"/>' +
      '<circle cx="' + (x - r * 0.3) + '" cy="' + (y + r * 0.38) + '" r="' + (r * 0.16) + '" fill="#fff"/>';
  }
  function eyes(x1, y1, x2, y2, r, col) {
    return '<g class="part-eyes" style="transform-box:fill-box;transform-origin:center">' + eye(x1, y1, r, col) + eye(x2, y2, r, col) + '</g>';
  }
  function blush(x, y, rx) {
    rx = rx || 5;
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + (rx * 0.55) + '" fill="#ff6f91" opacity=".45"/>' +
      '<path d="M' + (x - 2.5) + ' ' + (y + 0.5) + 'l1.5 -2M' + (x + 0.5) + ' ' + (y + 0.5) + 'l1.5 -2" stroke="#e0476d" stroke-width=".9" opacity=".6" stroke-linecap="round"/>';
  }
  function smile(x, y, w) {
    w = w || 4;
    return '<path d="M' + (x - w) + ' ' + y + 'q' + (w / 2) + ' ' + (w * 0.7) + ' ' + w + ' 0q' + (w / 2) + ' ' + (w * 0.7) + ' ' + w + ' 0" fill="none" stroke="' + O + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  function openMouth(x, y, w, h) {
    return '<path d="M' + (x - w) + ' ' + y + 'q' + w + ' ' + (h * 2) + ' ' + (w * 2) + ' 0z" fill="#8a2230" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<path d="M' + (x - w * 0.45) + ' ' + (y + h * 0.75) + 'q' + (w * 0.45) + ' -' + (h * 0.5) + ' ' + (w * 0.9) + ' 0" fill="#ff7d8e"/>';
  }
  function shadow(cx, rx, op) {
    return '<g class="part-shadow"><ellipse cx="' + (cx || 60) + '" cy="109" rx="' + (rx || 30) + '" ry="' + ((rx || 30) * 0.2) + '" fill="#000" opacity="' + (op || 0.22) + '"/></g>';
  }
  function sparkle(x, y, s, c) {
    return '<path d="M' + x + ' ' + (y - s) + 'Q' + x + ' ' + y + ' ' + (x + s) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y + s) + 'Q' + x + ' ' + y + ' ' + (x - s) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y - s) + 'z" fill="' + (c || '#fff') + '"/>';
  }
  function hl(x, y, rx, ry, rot, op) {
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" transform="rotate(' + (rot || 0) + ' ' + x + ' ' + y + ')" fill="#fff" opacity="' + (op || 0.55) + '"/>';
  }
  function svg(vb, inner) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '">' + inner + '</svg>';
  }
  function star(cx, cy, r1, r2, n, rot) {
    var d = '', i, a, r;
    for (i = 0; i < n * 2; i++) {
      a = (Math.PI / n) * i + (rot || -Math.PI / 2);
      r = i % 2 ? r2 : r1;
      d += (i ? 'L' : 'M') + (cx + Math.cos(a) * r).toFixed(1) + ' ' + (cy + Math.sin(a) * r).toFixed(1);
    }
    return d + 'Z';
  }
  function flower(cx, cy, r, petal, center) {
    var s = '', i, a;
    for (i = 0; i < 5; i++) {
      a = (Math.PI * 2 / 5) * i - Math.PI / 2;
      s += '<circle cx="' + (cx + Math.cos(a) * r).toFixed(1) + '" cy="' + (cy + Math.sin(a) * r).toFixed(1) + '" r="' + (r * 0.85) + '"/>';
    }
    return '<g fill="none" stroke="' + O + '" stroke-width="4">' + s + '</g><g fill="' + petal + '">' + s + '</g>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.7) + '" fill="' + center + '" stroke="' + O + '" stroke-width="1.5"/>' +
      '<circle cx="' + (cx - r * 0.2) + '" cy="' + (cy - r * 0.25) + '" r="' + (r * 0.22) + '" fill="#fff" opacity=".8"/>';
  }
  function snowflake(cx, cy, r, c, w) {
    var s = '', i, a, x, y;
    for (i = 0; i < 3; i++) {
      a = Math.PI / 3 * i;
      x = Math.cos(a) * r; y = Math.sin(a) * r;
      s += 'M' + (cx - x).toFixed(1) + ' ' + (cy - y).toFixed(1) + 'L' + (cx + x).toFixed(1) + ' ' + (cy + y).toFixed(1);
    }
    return '<path d="' + s + '" stroke="' + c + '" stroke-width="' + (w || 1.6) + '" stroke-linecap="round"/><circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.3) + '" fill="' + c + '"/>';
  }

  /* ---------------- PETS ---------------- */

  function sprout(uid) {
    var I = ids('sprout', uid);
    var stem = '<path d="M40 66C37 84 40 102 60 104C80 102 83 84 80 66Z"/>';
    var cap = '<path d="M16 66C14 42 34 28 60 28C86 28 106 42 104 66C92 74 28 74 16 66Z"/>';
    return svg('0 0 120 120',
      shadow(60, 30) +
      '<g class="part-body">' +
        // feet
        cel(I, 'footl', '<ellipse cx="49" cy="104" rx="9" ry="5.5"/>', '#f5dfb4', '#d9b98a') +
        cel(I, 'footr', '<ellipse cx="72" cy="104" rx="9" ry="5.5"/>', '#f5dfb4', '#d9b98a') +
        // stem body
        cel(I, 'stem', stem, '#fff3da', '#e6caa0',
          '<path d="M44 70q16 5 32 0" stroke="#e6caa0" stroke-width="3" fill="none"/>' +
          '<path d="M46 96q3 3 7 2M68 97q3 1 6-2" stroke="#e6caa0" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
          hl(49, 80, 3, 8, 8, 0.6)) +
        // leaf arms
        cel(I, 'arml', '<path d="M42 80C32 78 26 84 26 90C34 92 40 88 42 84Z"/>', '#7bd65a', '#4ea33b',
          '<path d="M41 83L29 89" stroke="#3e8a2f" stroke-width="1.2"/>', 5) +
        cel(I, 'armr', '<path d="M78 80C88 76 96 80 97 87C89 90 81 88 78 84Z"/>', '#7bd65a', '#4ea33b',
          '<path d="M79 83L94 86" stroke="#3e8a2f" stroke-width="1.2"/>', 5) +
        // face
        eyes(59, 83, 74, 83, 4.2) +
        blush(53, 91, 4) + blush(81, 91, 4) +
        smile(66.5, 90, 3) +
        // cap
        cel(I, 'cap', cap, '#6fcf4a', '#3f9e36',
          '<path d="M10 60C30 78 90 78 112 60L112 90L10 90Z" fill="#3f9e36"/>' +
          '<g fill="#c8f58a" stroke="#3f9e36" stroke-width="1.5">' +
            '<circle cx="36" cy="46" r="7"/><circle cx="62" cy="38" r="5"/><circle cx="84" cy="50" r="7.5"/>' +
            '<circle cx="52" cy="58" r="4"/><circle cx="98" cy="60" r="3.5"/><circle cx="22" cy="60" r="3"/></g>' +
          hl(78, 36, 9, 4, 20, 0.5) + hl(34, 44, 2.5, 1.5, -30, 0.8)) +
        '<path d="M20 66C38 74 82 74 100 66" fill="none" stroke="' + O + '" stroke-width="2" stroke-linecap="round" opacity=".5"/>' +
        // flower sprout
        '<path d="M60 30C58 22 62 16 68 12" fill="none" stroke="' + O + '" stroke-width="6" stroke-linecap="round"/>' +
        '<path d="M60 30C58 22 62 16 68 12" fill="none" stroke="#5cbf3f" stroke-width="3" stroke-linecap="round"/>' +
        cel(I, 'leaf', '<path d="M60 24C52 16 44 18 42 22C48 28 56 28 60 24Z"/>', '#8be066', '#4ea33b',
          '<path d="M59 24L45 21" stroke="#3e8a2f" stroke-width="1"/>', 5) +
        flower(70, 12, 5, '#ff8fb8', '#ffd93b') +
      '</g>');
  }

  function cloud(uid) {
    var I = ids('cloud', uid);
    var body = '<circle cx="36" cy="56" r="17"/><circle cx="58" cy="44" r="22"/><circle cx="82" cy="52" r="18"/>' +
      '<circle cx="96" cy="68" r="12"/><circle cx="24" cy="70" r="12"/><ellipse cx="60" cy="72" rx="38" ry="15"/>';
    var bolt = '<path d="M58 80L46 100L57 98L50 116L74 92L62 94L70 80Z"/>';
    return svg('0 0 120 120',
      '<g class="part-shadow"><ellipse cx="60" cy="110" rx="22" ry="4.5" fill="#000" opacity=".15"/></g>' +
      '<g class="part-body">' +
        // raindrops
        '<g fill="#8fd3ff" stroke="' + O + '" stroke-width="1.5">' +
          '<path d="M32 86q-5 7 0 10q5-3 0-10z"/><path d="M88 88q-5 7 0 10q5-3 0-10z"/><path d="M22 96q-4 5 0 8q4-3 0-8z"/></g>' +
        cel(I, 'bolt', bolt, '#ffe14d', '#f5a623', hl(62, 86, 2, 5, 30, 0.8), 6) +
        cel(I, 'body', body, '#a58bf0', '#6f4fc8',
          '<ellipse cx="60" cy="92" rx="56" ry="14" fill="#6f4fc8"/>' +
          '<g fill="#c9b8ff" opacity=".9"><ellipse cx="52" cy="34" rx="10" ry="5"/><ellipse cx="30" cy="48" rx="6" ry="3.5"/><ellipse cx="78" cy="40" rx="6" ry="3.5"/></g>' +
          '<g fill="none" stroke="#8a6ce0" stroke-width="2" stroke-linecap="round"><path d="M40 70q6 3 12 0"/><path d="M90 74q4 2 8-1"/></g>' +
          hl(52, 32, 6, 2.5, -15, 0.7)) +
        // stormy brows + face
        '<path d="M58 54l9 3M88 55l-8 3" stroke="' + O + '" stroke-width="2.4" stroke-linecap="round"/>' +
        eyes(64, 63, 82, 63, 4.4) +
        blush(56, 71, 4) + blush(90, 71, 4) +
        openMouth(73, 71, 4, 3.5) +
        // tiny arms holding sparks
        sparkle(104, 40, 5, '#ffe14d') + sparkle(16, 42, 4, '#ffe14d') + sparkle(98, 96, 3, '#fff6b0') +
        '<path d="M102 50l6 -4l-2 6l5 -2" fill="none" stroke="#ffe14d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</g>');
  }

  function puff(uid) {
    var I = ids('puff', uid);
    var body = '<path d="M14 102C4 100 6 84 16 78C18 54 36 40 60 40C84 40 102 54 104 78C114 84 116 100 106 102Z"/>';
    var horn = '<path d="M60 46L72 8L78 48Z"/>';
    return svg('0 0 120 120',
      shadow(60, 34) +
      '<g class="part-body">' +
        // rainbow mane tufts (behind)
        cel(I, 'mane', '<circle cx="44" cy="40" r="9"/><circle cx="32" cy="48" r="8"/><circle cx="55" cy="37" r="7"/>', '#ffb3d9', '#e67ab3',
          '<circle cx="32" cy="50" r="6" fill="#9ed8ff"/><circle cx="44" cy="42" r="5" fill="#c6a9ff"/>', 6) +
        cel(I, 'body', body, '#fdfaff', '#d8d0ee',
          '<path d="M10 96C40 106 80 106 112 96L112 110L10 110Z" fill="#d8d0ee"/>' +
          hl(80, 58, 9, 5, 30, 0.9) + hl(92, 70, 2.5, 2.5, 0, 0.9) +
          '<g fill="#efe7ff"><circle cx="30" cy="88" r="3"/><circle cx="38" cy="95" r="2"/><circle cx="92" cy="92" r="2.5"/></g>') +
        // horn
        cel(I, 'horn', horn, '#ffe07a', '#e3a833',
          '<g stroke="#e3a833" stroke-width="2.2" fill="none"><path d="M62 40l14 -4"/><path d="M64 31l12 -4"/><path d="M67 22l9 -3"/><path d="M69 14l6 -2"/></g>' +
          hl(69, 26, 1.5, 7, 16, 0.8), 6) +
        sparkle(84, 12, 4, '#fff6b0') + sparkle(90, 22, 2.5, '#ffe07a') +
        // cherries hair clip
        '<path d="M34 42C36 32 42 28 48 26M44 46C44 36 46 30 48 26" fill="none" stroke="' + O + '" stroke-width="4.5" stroke-linecap="round"/>' +
        '<path d="M34 42C36 32 42 28 48 26M44 46C44 36 46 30 48 26" fill="none" stroke="#5aa83a" stroke-width="2" stroke-linecap="round"/>' +
        cel(I, 'leafc', '<path d="M48 26C54 18 62 20 62 22C58 28 52 28 48 26Z"/>', '#7bd65a', '#4ea33b', '', 4.5) +
        cel(I, 'ch1', '<circle cx="33" cy="47" r="7"/>', '#ff4d5e', '#c21f3a', hl(31, 44, 2, 1.4, -30, 0.9), 5.5) +
        cel(I, 'ch2', '<circle cx="45" cy="51" r="7"/>', '#ff4d5e', '#c21f3a', hl(43, 48, 2, 1.4, -30, 0.9), 5.5) +
        // face
        eyes(66, 74, 86, 74, 5) +
        blush(58, 84, 4.5) + blush(95, 83, 4) +
        smile(76, 83, 3.5) +
      '</g>');
  }

  function frostfox(uid) {
    var I = ids('frostfox', uid);
    var tail = '<path d="M44 98C22 102 8 88 10 68C12 52 24 44 30 50C26 60 30 74 44 82Z"/>';
    var body = '<path d="M36 104C30 84 40 68 60 68C80 68 90 84 84 104Z"/>';
    var head = '<ellipse cx="62" cy="52" rx="28" ry="23"/>';
    var earL = '<path d="M44 38C36 26 34 10 38 4C46 8 54 22 54 34Z"/>';
    var earR = '<path d="M70 32C72 18 80 6 88 4C92 12 86 28 80 38Z"/>';
    return svg('0 0 120 120',
      shadow(56, 34) +
      '<g class="part-body">' +
        cel(I, 'tail', tail, '#8fcaff', '#5a9fe6',
          '<path d="M6 60C14 58 22 56 30 50L30 40L0 40Z" fill="#fff"/>' +
          '<path d="M16 76q6 2 10 -2M20 88q6 1 10 -3" stroke="#5a9fe6" stroke-width="1.8" fill="none" stroke-linecap="round"/>') +
        cel(I, 'body', body, '#a8d8ff', '#6aaee8',
          '<path d="M48 70L54 84L58 76L62 88L66 76L70 84L74 70Z" fill="#fff"/>' +
          '<path d="M44 96q4 3 8 1M76 96q-4 3 -8 1" stroke="#6aaee8" stroke-width="1.5" fill="none"/>') +
        // paws
        cel(I, 'pawl', '<ellipse cx="52" cy="103" rx="8" ry="6"/>', '#fff', '#cfe6f7', '<path d="M50 105v3M54 105v3" stroke="#9cc4e0" stroke-width="1.2"/>', 5.5) +
        cel(I, 'pawr', '<ellipse cx="70" cy="103" rx="8" ry="6"/>', '#fff', '#cfe6f7', '<path d="M68 105v3M72 105v3" stroke="#9cc4e0" stroke-width="1.2"/>', 5.5) +
        '<g class="part-head">' +
          cel(I, 'earl', earL, '#a8d8ff', '#6aaee8', '<path d="M42 32C40 22 40 14 40 10C46 14 50 22 50 32Z" fill="#fff"/><path d="M38 0L46 12L34 12Z" fill="#fff"/>', 6) +
          cel(I, 'earr', earR, '#a8d8ff', '#6aaee8', '<path d="M74 32C76 22 80 14 86 10C86 18 82 28 78 34Z" fill="#fff"/><path d="M84 0L92 10L80 10Z" fill="#fff"/>', 6) +
          cel(I, 'head', head + '<path d="M34 56L28 62L38 62Z"/><path d="M88 58L96 62L86 64Z"/>', '#a8d8ff', '#6aaee8',
            '<ellipse cx="74" cy="64" rx="18" ry="11" fill="#fff"/>' +
            '<ellipse cx="42" cy="64" rx="10" ry="7" fill="#fff"/>' +
            hl(52, 36, 8, 3.5, -12, 0.55)) +
          '<g opacity=".9">' + snowflake(62, 38, 5, '#ffffff', 1.8) + '</g>' +
          eyes(62, 52, 80, 52, 4.6) +
          blush(55, 61, 4) + blush(87, 60, 3.5) +
          '<path d="M84 58.5q3 -1.5 4 0.5q-1 2.5 -2.5 2.5q-1.5 0 -1.5 -3z" fill="' + O + '"/>' +
          smile(80, 63, 2.6) +
          '<g fill="#fff" opacity=".9">' + sparkle(98, 30, 3.5) + sparkle(20, 30, 2.5) + '</g>' +
        '</g>' +
      '</g>');
  }

  function spikeCap(cx, cy, r1, r2, n) {
    var d = '', i, a, r;
    for (i = 0; i <= n * 2; i++) {
      a = Math.PI + (Math.PI / (n * 2)) * i;
      r = i % 2 ? r2 : r1;
      d += (i ? 'L' : 'M') + (cx + Math.cos(a) * r).toFixed(1) + ' ' + (cy + Math.sin(a) * r * 0.86).toFixed(1);
    }
    return d + 'C' + (cx + r1 * 0.6) + ' ' + (cy + 12) + ' ' + (cx - r1 * 0.6) + ' ' + (cy + 12) + ' ' + (cx - r1) + ' ' + cy + 'Z';
  }

  function spikeshroom(uid) {
    var I = ids('spikeshroom', uid);
    var stem = '<path d="M42 64C38 84 40 102 60 104C80 102 84 84 78 64Z"/>';
    var cap = '<path d="' + spikeCap(60, 66, 33, 43, 8) + '"/>';
    return svg('0 0 120 120',
      shadow(60, 30) +
      '<g class="part-body">' +
        cel(I, 'footl', '<ellipse cx="49" cy="104" rx="9" ry="5.5"/>', '#d8c4f0', '#a98cd0') +
        cel(I, 'footr', '<ellipse cx="72" cy="104" rx="9" ry="5.5"/>', '#d8c4f0', '#a98cd0') +
        cel(I, 'stem', stem, '#efe4ff', '#c3aee6',
          '<path d="M46 68q14 6 28 0" stroke="#c3aee6" stroke-width="3" fill="none"/>' + hl(50, 82, 3, 8, 8, 0.6)) +
        // angry cute face
        '<path d="M52 76l9 4M83 76l-9 4" stroke="' + O + '" stroke-width="2.6" stroke-linecap="round"/>' +
        eyes(58, 85, 76, 85, 4) +
        blush(52, 93, 3.5) + blush(83, 93, 3.5) +
        '<path d="M62 94q5 -3 10 0" fill="none" stroke="' + O + '" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M70 93.2l1.5 3.5l1.5 -3.2z" fill="#fff" stroke="' + O + '" stroke-width="1"/>' +
        cel(I, 'cap', cap, '#a45fe0', '#6b35a8',
          '<path d="M0 58C30 78 90 78 120 58L120 90L0 90Z" fill="#6b35a8"/>' +
          '<g fill="#ff7ad9" stroke="#6b35a8" stroke-width="1.5"><circle cx="38" cy="46" r="6"/><circle cx="64" cy="36" r="5"/><circle cx="84" cy="50" r="6.5"/><circle cx="52" cy="58" r="3.5"/></g>' +
          '<g fill="#e7b8ff">' + '<circle cx="36" cy="44" r="2"/><circle cx="62" cy="34" r="1.6"/><circle cx="82" cy="48" r="2"/></g>' +
          hl(76, 30, 9, 3.5, 20, 0.45)) +
        '<path d="M22 64C40 74 80 74 98 64" fill="none" stroke="' + O + '" stroke-width="2" stroke-linecap="round" opacity=".5"/>' +
        sparkle(100, 22, 4, '#ff9cf0') + sparkle(14, 30, 3, '#d8a8ff') +
      '</g>');
  }

  function blossom(uid) {
    var I = ids('blossom', uid);
    var tail = '<path d="M42 96C20 100 6 84 10 64C14 50 26 46 30 52C26 62 30 76 44 82Z"/>';
    var body = '<path d="M36 104C30 84 40 70 60 70C80 70 90 84 84 104Z"/>';
    var head = '<ellipse cx="62" cy="56" rx="26" ry="21"/>';
    var earL = '<path d="M40 46C26 34 20 12 24 2C38 6 52 24 54 38Z"/>';
    var earR = '<path d="M70 38C76 22 92 6 104 4C106 16 94 38 84 46Z"/>';
    return svg('0 0 120 120',
      shadow(56, 34) +
      '<g class="part-body">' +
        cel(I, 'tail', tail, '#ff9ec7', '#e0679e',
          '<path d="M4 64C12 62 22 58 30 52L30 36L0 36Z" fill="#7fd65f"/>' +
          '<path d="M8 60L24 52" stroke="#4ea33b" stroke-width="1.4"/>') +
        cel(I, 'body', body, '#ffb0d0', '#e0679e',
          '<ellipse cx="62" cy="84" rx="12" ry="12" fill="#fff0e6"/>' +
          '<path d="M44 74q16 8 34 0" fill="none" stroke="#5cbf3f" stroke-width="4"/>' +
          '<g fill="#7fd65f" stroke="' + O + '" stroke-width="1.2"><path d="M50 78l-3 8l6 -4z"/><path d="M62 80l0 8l4 -6z"/><path d="M73 78l3 8l-6 -4z"/></g>') +
        cel(I, 'pawl', '<ellipse cx="52" cy="103" rx="8" ry="6"/>', '#fff0e6', '#f0c4b8', '', 5.5) +
        cel(I, 'pawr', '<ellipse cx="70" cy="103" rx="8" ry="6"/>', '#fff0e6', '#f0c4b8', '', 5.5) +
        '<g class="part-head">' +
          cel(I, 'earl', earL, '#ffb0d0', '#e0679e',
            '<path d="M40 40C32 30 28 16 28 8C38 12 48 26 50 36Z" fill="#8be066"/>' +
            '<path d="M48 36L30 10M44 30l-6 -2M40 24l-5 -3" stroke="#4ea33b" stroke-width="1.3" fill="none"/>', 6) +
          cel(I, 'earr', earR, '#ffb0d0', '#e0679e',
            '<path d="M74 38C80 24 90 12 100 8C100 20 92 34 82 42Z" fill="#8be066"/>' +
            '<path d="M78 38L98 10M84 30l6 0M89 23l5 0" stroke="#4ea33b" stroke-width="1.3" fill="none"/>', 6) +
          cel(I, 'head', head + '<path d="M36 60L30 66L40 66Z"/><path d="M86 62L94 66L84 68Z"/>', '#ffb0d0', '#e0679e',
            '<ellipse cx="74" cy="67" rx="16" ry="10" fill="#fff0e6"/>' +
            '<ellipse cx="42" cy="68" rx="8" ry="6" fill="#fff0e6"/>' +
            hl(52, 42, 8, 3.5, -12, 0.55)) +
          flower(96, 14, 5, '#fff', '#ff8fb8') +
          '<path d="M56 40q4 -4 8 0q-4 4 -8 0z" fill="#8be066" stroke="' + O + '" stroke-width="1.2"/>' +
          eyes(62, 56, 79, 56, 4.6) +
          blush(55, 65, 4) + blush(86, 64, 3.5) +
          '<path d="M83 62q3 -1.5 4 0.5q-1 2.5 -2.5 2.5q-1.5 0 -1.5 -3z" fill="' + O + '"/>' +
          smile(79, 67, 2.6) +
        '</g>' +
        '<g fill="#ffc8e0" stroke="' + O + '" stroke-width="1"><path d="M104 60q4 -3 6 1q-3 4 -6 -1z"/><path d="M12 22q3 -4 6 0q-3 3 -6 0z"/></g>' +
      '</g>');
  }

  function sparkcat(uid) {
    var I = ids('sparkcat', uid);
    var tail = '<path d="M40 94L26 86L32 76L18 68L24 58L20 52L28 54L32 62L28 68L40 74L36 82L46 88Z"/>';
    var crystal = '<path d="M20 52L12 36L20 22L28 36Z"/>';
    var body = '<path d="M36 104C30 84 40 70 60 70C80 70 90 84 84 104Z"/>';
    var head = '<ellipse cx="62" cy="54" rx="27" ry="22"/>';
    var earL = '<path d="M38 44L34 16L56 34Z"/>';
    var earR = '<path d="M70 34L90 16L88 46Z"/>';
    return svg('0 0 120 120',
      shadow(56, 34) +
      '<g class="part-body">' +
        cel(I, 'tail', tail, '#ffd93b', '#e8a41c', '', 5.5) +
        cel(I, 'crystal', crystal, '#7ff3ff', '#2fb6e0',
          '<path d="M20 22L20 52L28 36Z" fill="#b9fbff"/>' + hl(17, 36, 1.5, 6, 18, 0.9), 5.5) +
        sparkle(30, 18, 4, '#b9fbff') + sparkle(8, 50, 3, '#fff') +
        cel(I, 'body', body, '#ffe04d', '#e8a41c',
          '<ellipse cx="62" cy="86" rx="12" ry="13" fill="#fff6d0"/>' +
          '<path d="M40 82l6 2l-4 4l6 2M82 82l-6 2l4 4l-6 2" fill="none" stroke="#c9741a" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>' +
          '<path d="M46 72q14 6 30 0" stroke="#7ff3ff" stroke-width="3" fill="none"/>' +
          '<circle cx="62" cy="76" r="3" fill="#7ff3ff" stroke="' + O + '" stroke-width="1.2"/>') +
        cel(I, 'pawl', '<ellipse cx="52" cy="103" rx="8" ry="6"/>', '#fff6d0', '#e8cf8a', '<path d="M50 105v3M54 105v3" stroke="#d0a860" stroke-width="1.2"/>', 5.5) +
        cel(I, 'pawr', '<ellipse cx="70" cy="103" rx="8" ry="6"/>', '#fff6d0', '#e8cf8a', '<path d="M68 105v3M72 105v3" stroke="#d0a860" stroke-width="1.2"/>', 5.5) +
        '<g class="part-head">' +
          cel(I, 'earl', earL, '#ffe04d', '#e8a41c', '<path d="M40 40L37 22L50 34Z" fill="#ff9ab0"/>', 6) +
          cel(I, 'earr', earR, '#ffe04d', '#e8a41c', '<path d="M74 34L87 22L86 42Z" fill="#ff9ab0"/>', 6) +
          cel(I, 'head', head + '<path d="M36 58L28 60L36 64Z"/><path d="M88 58L96 60L88 64Z"/>', '#ffe04d', '#e8a41c',
            '<ellipse cx="74" cy="64" rx="15" ry="9" fill="#fff6d0"/>' +
            '<path d="M56 32l3 6l-4 1l3 6M66 32l-2 6l4 1l-3 5" fill="none" stroke="#c9741a" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>' +
            '<path d="M36 50l6 2l-4 3l6 2" fill="none" stroke="#c9741a" stroke-width="2" stroke-linejoin="round"/>' +
            hl(48, 40, 6, 3, -20, 0.55)) +
          eyes(62, 54, 79, 54, 4.8, '#1f5a73') +
          blush(55, 63, 4) + blush(86, 62, 3.5) +
          '<path d="M82 60l4 0l-2 2.5z" fill="#ff6f91" stroke="' + O + '" stroke-width="1" stroke-linejoin="round"/>' +
          smile(80, 64, 2.4) +
          '<path d="M94 62l12 -2M94 66l12 2M30 62l-10 -2" stroke="' + O + '" stroke-width="1.2" stroke-linecap="round"/>' +
        '</g>' +
        '<path d="M100 30l6 -6l-1 6l6 -3" fill="none" stroke="#ffe04d" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</g>');
  }

  function babydragon(uid) {
    var I = ids('babydragon', uid);
    var tail = '<path d="M40 96C24 100 12 94 10 80C14 86 24 88 36 84Z"/><path d="M12 84L2 72L14 72L8 62L20 76Z"/>';
    var wing = '<path d="M40 76C28 64 20 50 24 40C30 46 38 44 42 48C44 56 48 62 50 70Z"/>';
    var body = '<path d="M36 104C30 84 40 68 60 68C80 68 90 84 84 104Z"/>';
    var head = '<path d="M36 50C36 32 50 24 64 24C82 24 96 34 98 50C100 62 90 70 72 70C50 70 36 64 36 50Z"/>';
    return svg('0 0 120 120',
      shadow(56, 34) +
      '<g class="part-body">' +
        cel(I, 'tail', tail, '#ff5a4a', '#c0302a', '<path d="M2 72L14 72L8 62L20 76L12 84Z" fill="#ffb347"/>', 6) +
        '<g class="part-cape">' +
          cel(I, 'wing', wing, '#ff5a4a', '#c0302a',
            '<path d="M30 48C34 58 40 66 48 70L44 52Z" fill="#ffb347"/>' +
            '<path d="M26 42L46 68M34 46L46 64" stroke="#c0302a" stroke-width="1.6"/>', 6) +
        '</g>' +
        cel(I, 'body', body, '#ff6250', '#c0302a',
          '<path d="M50 72C46 86 50 100 60 104C70 100 76 86 72 72Z" fill="#ffe3a8"/>' +
          '<path d="M51 80h20M50 88h22M52 96h18" stroke="#e8b870" stroke-width="1.6"/>' +
          '<g fill="#ffb347"><circle cx="42" cy="84" r="3"/><circle cx="80" cy="82" r="2.5"/><circle cx="40" cy="96" r="2"/></g>') +
        cel(I, 'pawl', '<ellipse cx="50" cy="103" rx="8" ry="6"/>', '#ff6250', '#c0302a', '<path d="M46 104l-1 3M50 105v3M54 104l1 3" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>', 5.5) +
        cel(I, 'pawr', '<ellipse cx="72" cy="103" rx="8" ry="6"/>', '#ff6250', '#c0302a', '<path d="M68 104l-1 3M72 105v3M76 104l1 3" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>', 5.5) +
        cel(I, 'arm', '<path d="M76 78C84 80 88 84 86 88C82 90 76 86 74 82Z"/>', '#ff6250', '#c0302a', '', 5) +
        '<g class="part-head">' +
          cel(I, 'hornl', '<path d="M50 28L40 8L60 26Z"/>', '#fff3d0', '#d9b77a', '<path d="M44 16l6 2M47 21l6 1" stroke="#d9b77a" stroke-width="1.5"/>', 5.5) +
          cel(I, 'hornr', '<path d="M70 26L78 6L82 30Z"/>', '#fff3d0', '#d9b77a', '<path d="M76 14l5 2M75 20l6 1" stroke="#d9b77a" stroke-width="1.5"/>', 5.5) +
          cel(I, 'crest', '<path d="M40 38L32 34L38 44Z"/><path d="M38 50L28 48L36 56Z"/>', '#ffb347', '#e0822a', '', 5) +
          cel(I, 'head', head, '#ff6250', '#c0302a',
            '<path d="M70 58C80 58 94 56 98 50C100 62 90 70 72 70C62 70 64 58 70 58Z" fill="#ffe3a8"/>' +
            '<g fill="#ffb347"><circle cx="48" cy="34" r="4"/><circle cx="58" cy="30" r="2.5"/><circle cx="42" cy="46" r="2.5"/><circle cx="46" cy="58" r="3"/></g>' +
            hl(60, 30, 9, 3.5, -8, 0.5)) +
          eyes(64, 46, 82, 45, 5) +
          blush(57, 56, 4) + blush(89, 54, 3.5) +
          '<g fill="' + O + '"><ellipse cx="92" cy="48" rx="1.2" ry="1.8"/><ellipse cx="96" cy="48" rx="1.2" ry="1.8"/></g>' +
          '<path d="M74 60q6 4 12 0" fill="#8a2230" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>' +
          '<path d="M76 60l1.5 2.5l1.5 -2.3z" fill="#fff"/>' +
        '</g>' +
        // smoke puff
        '<g fill="#ffd27a" stroke="' + O + '" stroke-width="1.5"><circle cx="104" cy="42" r="4"/><circle cx="110" cy="36" r="3"/><circle cx="113" cy="29" r="2"/></g>' +
        '<g fill="#fff3b0"><circle cx="103" cy="41" r="1.4"/></g>' +
      '</g>');
  }

  function iceprincess(uid) {
    var I = ids('iceprincess', uid);
    var wings = '<path d="M50 62C34 42 14 44 16 58C18 68 34 70 48 68Z"/><path d="M48 70C32 72 22 84 28 92C36 96 46 84 50 74Z"/>';
    var hair = '<path d="M34 52C30 30 44 20 60 20C78 20 90 32 88 52C90 66 86 76 78 78L74 60L46 60L42 80C34 76 32 64 34 52Z"/>';
    var face = '<ellipse cx="62" cy="52" rx="20" ry="18"/>';
    var dress = '<path d="M50 74C44 88 36 98 36 104C50 108 74 108 86 104C86 98 78 88 72 74Z"/>';
    return svg('0 0 120 120',
      shadow(60, 26, 0.16) +
      '<g class="part-body">' +
        '<g class="part-cape">' +
          cel(I, 'wings', wings, '#d7f6ff', '#9fdcf5',
            '<path d="M22 56C30 54 40 58 48 66M30 88C36 82 42 78 48 72" stroke="#fff" stroke-width="1.6" fill="none"/>' +
            '<g fill="#fff" opacity=".7"><circle cx="26" cy="54" r="2"/><circle cx="32" cy="86" r="1.6"/></g>', 5) +
        '</g>' +
        // back hair
        cel(I, 'hair', hair, '#e8f8ff', '#9fd2ee',
          '<path d="M44 26C52 34 52 52 46 62M82 34C86 44 84 60 80 70" stroke="#b8e2f6" stroke-width="2" fill="none"/>') +
        cel(I, 'dress', dress, '#7ecbff', '#3f8fd9',
          '<path d="M36 100C50 106 74 106 88 100L88 110L36 110Z" fill="#d7f6ff"/>' +
          '<path d="M40 100l4 -4l4 4l4 -4l4 4l4 -4l4 4l4 -4l4 4l4 -4l4 4" stroke="#fff" stroke-width="1.6" fill="none"/>' +
          '<path d="M56 76L50 100M66 76L74 100" stroke="#b9e6ff" stroke-width="1.6"/>' +
          '<g opacity=".95">' + snowflake(62, 88, 4, '#ffffff', 1.4) + '</g>') +
        // arms
        cel(I, 'arml', '<path d="M52 76C46 80 44 86 46 88C50 88 54 84 56 80Z"/>', '#ffe6dc', '#f0bca8', '', 5) +
        // wand
        '<path d="M76 84L96 62" stroke="' + O + '" stroke-width="5" stroke-linecap="round"/>' +
        '<path d="M76 84L96 62" stroke="#ffe07a" stroke-width="2.4" stroke-linecap="round"/>' +
        cel(I, 'wstar', '<path d="' + star(98, 58, 9, 4, 6) + '"/>', '#b9fbff', '#4fc3ef', hl(96, 55, 2, 1.2, -30, 0.9), 5) +
        sparkle(108, 46, 3.5, '#fff') + sparkle(88, 44, 2.5, '#b9fbff') + sparkle(110, 70, 2.5, '#b9fbff') +
        cel(I, 'armr', '<path d="M68 76C74 78 78 82 78 86C74 88 70 84 66 80Z"/>', '#ffe6dc', '#f0bca8', '', 5) +
        '<g class="part-head">' +
          cel(I, 'face', face, '#ffece4', '#f3c2b0', '') +
          // bangs
          cel(I, 'bangs', '<path d="M40 50C38 34 50 26 62 26C76 26 86 34 84 50C80 42 74 38 70 36C70 42 66 44 62 44C62 40 58 38 56 36C52 42 46 46 40 50Z"/>', '#e8f8ff', '#9fd2ee',
            hl(66, 30, 7, 2.5, 5, 0.9), 5.5) +
          // crown
          cel(I, 'crown', '<path d="M46 28L44 12L52 20L60 8L68 20L76 12L76 28Z"/>', '#ffe07a', '#e3a833',
            '<path d="M46 25h30" stroke="#e3a833" stroke-width="2"/>' + hl(56, 18, 1.4, 4, 20, 0.8), 5) +
          '<path d="M60 16l3 4l-3 4l-3 -4z" fill="#4fc3ef" stroke="' + O + '" stroke-width="1.2"/>' +
          '<circle cx="44" cy="12" r="2" fill="#b9fbff" stroke="' + O + '" stroke-width="1"/><circle cx="76" cy="12" r="2" fill="#b9fbff" stroke="' + O + '" stroke-width="1"/>' +
          eyes(60, 56, 75, 56, 4.4, '#2f6fb0') +
          '<path d="M55 50.5l-2 -1.5M80 50.5l2 -1.5" stroke="' + O + '" stroke-width="1.3" stroke-linecap="round"/>' +
          blush(54, 63, 3.5) + blush(81, 63, 3.2) +
          smile(68, 64, 2.2) +
        '</g>' +
      '</g>');
  }

  function kingling(uid) {
    var I = ids('kingling', uid);
    var body = '<path d="M16 102C8 102 8 90 16 84C20 60 36 44 58 44C82 44 98 60 102 84C110 90 110 102 102 102Z"/>';
    var crown = '<path d="M40 48L36 22L48 34L58 16L68 34L80 22L76 48Z"/>';
    return svg('0 0 120 120',
      shadow(60, 36) +
      '<g class="part-body">' +
        // cape behind
        '<g class="part-cape">' +
          cel(I, 'cape', '<path d="M22 70C12 80 8 96 10 104L30 104C24 92 26 80 32 72Z"/>', '#e0344a', '#a31d33',
            '<path d="M10 100L30 100L30 110L10 110Z" fill="#fff"/><g fill="' + O + '"><circle cx="16" cy="104" r="1.2"/><circle cx="24" cy="104" r="1.2"/></g>', 6) +
        '</g>' +
        cel(I, 'body', body, '#a970ef', '#7340bb',
          '<path d="M8 96C40 106 80 106 112 96L112 110L8 110Z" fill="#7340bb"/>' +
          hl(78, 60, 10, 5, 30, 0.6) + hl(92, 72, 2.5, 2.5, 0, 0.8) +
          '<g fill="#c9a0ff"><circle cx="30" cy="80" r="3"/><circle cx="38" cy="90" r="2"/></g>') +
        // ermine collar
        cel(I, 'collar', '<path d="M36 46C46 52 70 52 80 46C84 49 84 54 80 56C70 62 46 62 36 56C32 54 32 49 36 46Z"/>', '#fff', '#dcd6ea',
          '<g fill="' + O + '"><path d="M42 53l1 3l1 -3z"/><path d="M58 56l1 3l1 -3z"/><path d="M74 53l1 3l1 -3z"/></g>', 5.5) +
        cel(I, 'crown', crown, '#ffd84a', '#e39a1e',
          '<path d="M38 42h40" stroke="#e39a1e" stroke-width="2.5"/>' + hl(52, 32, 1.6, 6, 20, 0.8), 6) +
        '<g stroke="' + O + '" stroke-width="1.3"><circle cx="58" cy="38" r="4" fill="#ff4d6a"/><circle cx="46" cy="42" r="2.4" fill="#4fc3ef"/><circle cx="70" cy="42" r="2.4" fill="#4fc3ef"/>' +
          '<circle cx="36" cy="22" r="2.6" fill="#fff6b0"/><circle cx="58" cy="16" r="2.8" fill="#fff6b0"/><circle cx="80" cy="22" r="2.6" fill="#fff6b0"/></g>' +
        '<circle cx="57" cy="37" r="1.3" fill="#fff"/>' +
        // face
        eyes(62, 76, 82, 76, 5) +
        '<path d="M56 67l8 1M88 67l-8 1" stroke="' + O + '" stroke-width="2.2" stroke-linecap="round"/>' +
        blush(55, 85, 4.5) + blush(90, 84, 4) +
        // tiny mustache + smile
        '<path d="M72 83q-4 -3 -8 1q4 2 8 -1q4 3 8 1q-4 -4 -8 -1z" fill="#5a2c8a" stroke="' + O + '" stroke-width="1.2" stroke-linejoin="round"/>' +
        smile(72, 87, 2.2) +
        // scepter
        '<path d="M102 104L106 50" stroke="' + O + '" stroke-width="6" stroke-linecap="round"/>' +
        '<path d="M102 104L106 50" stroke="#ffd84a" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M103 90h4M104 76h4M104 64h4" stroke="#e39a1e" stroke-width="1.6"/>' +
        cel(I, 'orb', '<circle cx="106" cy="44" r="7"/>', '#ff4d6a', '#b81f3e', hl(104, 41, 2, 1.3, -30, 0.9), 5) +
        '<path d="M106 37v-6M103 34h6" stroke="' + O + '" stroke-width="4" stroke-linecap="round"/><path d="M106 37v-6M103 34h6" stroke="#ffd84a" stroke-width="2" stroke-linecap="round"/>' +
        cel(I, 'hand', '<ellipse cx="102" cy="82" rx="6" ry="5"/>', '#a970ef', '#7340bb', '', 5) +
        sparkle(92, 18, 3.5, '#fff6b0') + sparkle(20, 40, 3, '#fff6b0') +
      '</g>');
  }

  window.PETS = {
    sprout: { name: 'Sprout', rarity: 'common', bonus: { stat: 'hp', pct: 5 }, desc: 'A cheerful mushroom buddy whose flower blooms brighter when you heal.', svg: sprout },
    cloud: { name: 'Stormy', rarity: 'common', bonus: { stat: 'atk', pct: 5 }, desc: 'A grumpy little thundercloud that zaps anything that looks at you funny.', svg: cloud },
    puff: { name: 'Puff', rarity: 'rare', bonus: { stat: 'def', pct: 8 }, desc: 'A squishy unicorn slime. Hits just bounce right off. Loves cherries.', svg: puff },
    frostfox: { name: 'Frostfox', rarity: 'rare', bonus: { stat: 'hp', pct: 10 }, desc: 'Half fox, half bunny, all fluff. Its snowy fur keeps you cozy in any fight.', svg: frostfox },
    spikeshroom: { name: 'Spikeshroom', rarity: 'rare', bonus: { stat: 'atk', pct: 10 }, desc: 'A prickly purple mushroom with a short temper and sharp spikes.', svg: spikeshroom },
    blossom: { name: 'Blossom', rarity: 'epic', bonus: { stat: 'hp', pct: 15 }, desc: 'A big-eared spring fox. Flowers sprout wherever it naps.', svg: blossom },
    sparkcat: { name: 'Sparkcat', rarity: 'epic', bonus: { stat: 'atk', pct: 15 }, desc: 'A crackling cat whose crystal tail stores a whole thunderstorm.', svg: sparkcat },
    babydragon: { name: 'Ember', rarity: 'legendary', bonus: { stat: 'atk', pct: 25 }, desc: 'A baby dragon with a big heart and even bigger sneezes of fire.', svg: babydragon },
    iceprincess: { name: 'Frost Princess', rarity: 'legendary', bonus: { stat: 'hp', pct: 25 }, desc: 'A tiny royal fairy of the north. Her wand mends wounds with snowflakes.', svg: iceprincess },
    kingling: { name: 'Kingling', rarity: 'legendary', bonus: { stat: 'def', pct: 25 }, desc: 'The pocket-sized ruler of all slimes. Bow before his squishy majesty.', svg: kingling }
  };

  /* ---------------- EGGS (viewBox 0 0 100 120) ---------------- */
  var EGG = '<path d="M50 8C76 8 90 54 90 76C90 100 72 114 50 114C28 114 10 100 10 76C10 54 24 8 50 8Z"/>';

  function eggCommon(uid) {
    var I = ids('egg-common', uid);
    return svg('0 0 100 120',
      '<g class="part-shadow"><ellipse cx="50" cy="114" rx="32" ry="5" fill="#000" opacity=".2"/></g>' +
      '<g class="part-body">' +
        cel(I, 'shell', EGG, '#fff4dc', '#e8cfa2',
          '<g fill="#d9a066" stroke="#b97d44" stroke-width="1.2">' +
            '<ellipse cx="36" cy="40" rx="7" ry="6"/><ellipse cx="62" cy="30" rx="5" ry="4"/><ellipse cx="70" cy="62" rx="8" ry="7"/>' +
            '<ellipse cx="30" cy="80" rx="6" ry="5"/><ellipse cx="52" cy="92" rx="7" ry="5"/><ellipse cx="48" cy="58" rx="3.5" ry="3"/><ellipse cx="78" cy="90" rx="3.5" ry="3"/></g>' +
          '<g fill="#e8bb86"><circle cx="34" cy="38" r="2.5"/><circle cx="68" cy="60" r="3"/><circle cx="50" cy="90" r="2.5"/></g>' +
          hl(36, 30, 6, 12, 20, 0.7) + hl(28, 50, 2.5, 3, 0, 0.7), 7, [-5, -6]) +
        '<path d="M22 98C32 108 68 108 78 98" fill="none" stroke="#d6b584" stroke-width="2" stroke-linecap="round" opacity=".6"/>' +
        sparkle(84, 20, 4, '#fff6b0') +
      '</g>');
  }

  function eggRare(uid) {
    var I = ids('egg-rare', uid);
    return svg('0 0 100 120',
      '<g class="part-shadow"><ellipse cx="50" cy="114" rx="32" ry="5" fill="#000" opacity=".2"/></g>' +
      '<g class="part-body">' +
        cel(I, 'shell', EGG, '#a36be8', '#6a36b0',
          // gold bands
          '<path d="M8 50C30 58 70 58 92 50L92 60C70 68 30 68 8 60Z" fill="#ffd84a"/>' +
          '<path d="M8 50C30 58 70 58 92 50M8 60C30 68 70 68 92 60" fill="none" stroke="' + O + '" stroke-width="2"/>' +
          '<path d="M8 84C30 92 70 92 92 84L92 90C70 98 30 98 8 90Z" fill="#ffd84a"/>' +
          '<path d="M8 84C30 92 70 92 92 84M8 90C30 98 70 98 92 90" fill="none" stroke="' + O + '" stroke-width="2"/>' +
          '<g fill="#e39a1e"><circle cx="24" cy="58" r="1.6"/><circle cx="76" cy="58" r="1.6"/><circle cx="36" cy="61" r="1.6"/><circle cx="64" cy="61" r="1.6"/></g>' +
          '<g fill="#c9a0ff" opacity=".9"><path d="' + star(36, 32, 4, 1.6, 4) + '"/><path d="' + star(66, 40, 3, 1.2, 4) + '"/><path d="' + star(30, 76, 3, 1.2, 4) + '"/><path d="' + star(70, 74, 3.5, 1.4, 4) + '"/><path d="' + star(50, 104, 3, 1.2, 4) + '"/></g>' +
          hl(36, 26, 5, 11, 20, 0.55), 7, [-5, -6]) +
        // central gem on band
        cel(I, 'gem', '<path d="M50 50L58 60L50 70L42 60Z"/>', '#4fe0ff', '#1f8fc9', '<path d="M50 50L50 70L42 60Z" fill="#9ff3ff"/>', 5) +
        sparkle(82, 18, 5, '#fff6b0') + sparkle(16, 36, 3, '#fff') +
      '</g>');
  }

  window.EGGS = { common: eggCommon, rare: eggRare };
})();

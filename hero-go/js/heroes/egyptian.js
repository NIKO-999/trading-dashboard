/* Hero Go! — Neferu, The Desert Guardian (key: egyptian)
 * Hand-authored inline SVG. Chibi, facing right. See ART_CONTRACT.md.
 * A Medjay guardian: striped nemes headcloth with uraeus, kohl-winged eyes,
 * usekh bead collar, pleated linen shendyt, scarab amulet, lotus-painted
 * bronze buckler and an engraved bronze khopesh.
 */
(function () {
  'use strict';

  var O = '#2b1d14';            // outline
  var C = {
    skin: '#b87445', skinS: '#91532b', skinL: '#d99a64', skinD: '#7a4222', blush: '#e0735e',
    kohl: '#15100c', brow: '#1f140e', mal: '#19b39c',
    blue: '#2456a6', blueS: '#173a78', blueL: '#5b8fdc',
    gold: '#f5c542', goldS: '#c98f1c', goldL: '#fff1a8',
    lapis: '#2a4fb0', lapisL: '#6f95ea', turq: '#2fc2b8', turqS: '#17857e', turqL: '#a6f1ea',
    carn: '#d2452b', carnS: '#8e2419', carnL: '#f07b5e',
    lin: '#fbf6ea', linS: '#ddd3bb', pleat: '#c7bb9e',
    lea: '#8a5a2b', leaS: '#5e3a1a', leaL: '#b8834a',
    brz: '#c27a2a', brzS: '#7e4416', brzL: '#ffd48a', brzD: '#5e3310',
    lotus: '#3f7fd6', lotusL: '#8fc0ff', leaf: '#3aa66a', leafS: '#1f6e42',
    lip: '#a8404a', mouth: '#6e2418'
  };

  function f(n) { return Math.round(n * 100) / 100; }

  function mk(u) { return function (n) { return 'egyptian-' + n + '-' + u; }; }

  // ---------- key shapes ----------
  var NEMES = 'M58 119 C 55 102, 58 86, 66 72 C 62 42, 80 22, 104 21 C 128 21, 146 38, 142 70 C 150 84, 154 102, 151 119 C 142 123, 133 121, 128 115 L 80 115 C 75 121, 66 123, 58 119 Z';
  var FACE = 'M76 78 C 76 61, 90 54, 106 54 C 124 54, 135 65, 135 82 C 135 100, 123 112, 106 113 C 88 113, 76 100, 76 78 Z';
  var TORSO = 'M73 122 C 69 138, 71 152, 75 166 L 117 166 C 121 152, 123 138, 119 122 C 107 116, 85 116, 73 122 Z';
  var SKIRT = 'M75 160 C 71 176, 66 192, 62 205 C 78 211, 114 211, 130 205 C 126 192, 121 176, 117 160 Z';
  var LEGL = 'M81 198 L 93 198 L 92.5 222 L 81.5 222 Z';
  var LEGR = 'M99 198 L 111 198 L 110.5 222 L 99.5 222 Z';
  var ARMS = 'M83 123 C 72 121, 64 129, 62 140 C 60 149, 60 156, 61 163 L 71 164 C 71 157, 72 151, 75 145 C 80 138, 90 128, 83 123 Z';
  var ARMW = 'M109 123 C 120 121, 128 129, 132 141 C 135 149, 139 156, 139 163 L 128 167 C 125 160, 119 154, 113 148 C 106 141, 102 128, 109 123 Z';
  var BO = 'M-2.8 -26 C -6 -38, -7 -52, -2 -64 C 5 -78, 22 -84, 34 -78 C 40 -75, 44 -70, 46 -64';
  var BI = 'M46 -64 C 38 -68, 30 -69, 22 -66 C 13 -62, 8.5 -55, 7 -46 C 5.5 -38, 3.5 -31, 2.8 -26 L 2.8 -9';
  var BLADE = 'M-2.8 -9 L ' + BO.slice(1) + ' ' + BI.slice(BI.indexOf('C')) + ' Z';
  var LAPL = 'M63 108 L 75 108 L 77 147 C 72.5 150.5, 65.5 150.5, 61 147 Z';
  var LAPR = 'M117 108 L 129 108 L 131 147 C 126.5 150.5, 119.5 150.5, 115 147 Z';

  function defs(u) {
    var id = mk(u);
    return '<defs>' +
      '<radialGradient id="' + id('skin') + '" cx="0.6" cy="0.35" r="0.8"><stop offset="0" stop-color="' + C.skinL + '"/><stop offset="0.55" stop-color="' + C.skin + '"/><stop offset="1" stop-color="' + C.skinS + '"/></radialGradient>' +
      '<radialGradient id="' + id('face') + '" cx="0.62" cy="0.42" r="0.72"><stop offset="0" stop-color="#e3a874"/><stop offset="0.6" stop-color="' + C.skin + '"/><stop offset="1" stop-color="' + C.skinS + '"/></radialGradient>' +
      '<linearGradient id="' + id('gold') + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + C.goldL + '"/><stop offset="0.5" stop-color="' + C.gold + '"/><stop offset="1" stop-color="' + C.goldS + '"/></linearGradient>' +
      '<linearGradient id="' + id('goldh') + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + C.goldS + '"/><stop offset="0.4" stop-color="' + C.goldL + '"/><stop offset="1" stop-color="' + C.goldS + '"/></linearGradient>' +
      '<linearGradient id="' + id('lin') + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + C.linS + '"/><stop offset="0.4" stop-color="#ffffff"/><stop offset="1" stop-color="' + C.linS + '"/></linearGradient>' +
      '<linearGradient id="' + id('brz') + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + C.brzL + '"/><stop offset="0.45" stop-color="' + C.brz + '"/><stop offset="1" stop-color="' + C.brzS + '"/></linearGradient>' +
      '<radialGradient id="' + id('shield') + '" cx="0.38" cy="0.32" r="0.8"><stop offset="0" stop-color="' + C.brzL + '"/><stop offset="0.55" stop-color="' + C.brz + '"/><stop offset="1" stop-color="' + C.brzS + '"/></radialGradient>' +
      '<radialGradient id="' + id('field') + '" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="#e9fffb"/><stop offset="0.6" stop-color="' + C.turqL + '"/><stop offset="1" stop-color="' + C.turq + '"/></radialGradient>' +
      '<radialGradient id="' + id('lapis') + '" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="' + C.lapisL + '"/><stop offset="0.5" stop-color="' + C.lapis + '"/><stop offset="1" stop-color="' + C.blueS + '"/></radialGradient>' +
      '<linearGradient id="' + id('iris') + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a0e08"/><stop offset="0.6" stop-color="#5a2f16"/><stop offset="1" stop-color="#b8782e"/></linearGradient>' +
      '<radialGradient id="' + id('pbg') + '" cx="0.5" cy="0.4" r="0.75"><stop offset="0" stop-color="#8fe0f0"/><stop offset="0.55" stop-color="#2a93b4"/><stop offset="1" stop-color="#15506a"/></radialGradient>' +
      '<pattern id="' + id('weave') + '" patternUnits="userSpaceOnUse" width="2.6" height="2.6"><path d="M0 0.65 H2.6 M0 1.95 H2.6" stroke="#9c8f6c" stroke-width="0.28" opacity="0.5"/><path d="M0.65 0 V2.6 M1.95 0 V2.6" stroke="#fff" stroke-width="0.25" opacity="0.55"/></pattern>' +
      '<pattern id="' + id('hammer') + '" patternUnits="userSpaceOnUse" width="4.2" height="4.2" patternTransform="rotate(20)"><circle cx="1" cy="1" r="0.75" fill="' + C.brzD + '" opacity="0.28"/><circle cx="3.1" cy="3" r="0.8" fill="' + C.brzL + '" opacity="0.35"/><circle cx="3.3" cy="0.9" r="0.4" fill="' + C.brzD + '" opacity="0.2"/></pattern>' +
      '<pattern id="' + id('grain') + '" patternUnits="userSpaceOnUse" width="3.4" height="3.4"><circle cx="0.8" cy="0.8" r="0.35" fill="' + C.leaS + '" opacity="0.45"/><circle cx="2.5" cy="2.3" r="0.3" fill="' + C.leaL + '" opacity="0.5"/></pattern>' +
      '<pattern id="' + id('papy') + '" patternUnits="userSpaceOnUse" width="3" height="3"><path d="M0 0 L3 3 M3 0 L0 3" stroke="' + C.leaS + '" stroke-width="0.45" opacity="0.6"/><path d="M1.5 0 L1.5 3" stroke="' + C.leaL + '" stroke-width="0.3" opacity="0.6"/></pattern>' +
      '<pattern id="' + id('cell') + '" patternUnits="userSpaceOnUse" width="3" height="3"><path d="M1.5 0 L3 1.5 L1.5 3 L0 1.5 Z" fill="none" stroke="' + C.goldS + '" stroke-width="0.45"/></pattern>' +
      '<linearGradient id="' + id('nsh') + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0a1a44" stop-opacity="0.32"/><stop offset="0.28" stop-color="#0a1a44" stop-opacity="0"/><stop offset="0.7" stop-color="#fff" stop-opacity="0.05"/><stop offset="1" stop-color="#0a1a44" stop-opacity="0.3"/></linearGradient>' +
      '<linearGradient id="' + id('eshadow') + '" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="' + C.mal + '" stop-opacity="0.7"/><stop offset="0.6" stop-color="#2b7fd0" stop-opacity="0.35"/><stop offset="1" stop-color="' + C.mal + '" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="' + id('sheer') + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.55" stop-color="#b9a97f" stop-opacity="0.06"/><stop offset="1" stop-color="#8a7448" stop-opacity="0.22"/></linearGradient>' +
      '<radialGradient id="' + id('ao') + '" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#2b1d14" stop-opacity="0.42"/><stop offset="1" stop-color="#2b1d14" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="' + id('nemes') + '"><path d="' + NEMES + '"/></clipPath>' +
      '<clipPath id="' + id('face-c') + '"><path d="' + FACE + '"/></clipPath>' +
      '<clipPath id="' + id('torso-c') + '"><path d="' + TORSO + '"/></clipPath>' +
      '<clipPath id="' + id('skirt-c') + '"><path d="' + SKIRT + '"/></clipPath>' +
      '<clipPath id="' + id('armw-c') + '"><path d="' + ARMW + '"/></clipPath>' +
      '<clipPath id="' + id('arms-c') + '"><path d="' + ARMS + '"/></clipPath>' +
      '<clipPath id="' + id('lap-c') + '"><path d="' + LAPL + ' ' + LAPR + '"/></clipPath>' +
      '<clipPath id="' + id('blade-c') + '"><path d="' + BLADE + '"/></clipPath>' +
      '<clipPath id="' + id('field-c') + '"><circle cx="54" cy="174" r="13.2"/></clipPath>' +
      '<clipPath id="' + id('pclip') + '"><rect x="0" y="0" width="120" height="120" rx="14"/></clipPath>' +
      '</defs>';
  }

  // ---------- helpers ----------
  function sparkle(x, y, s, col, op) {
    return '<path d="M' + f(x) + ' ' + f(y - s) + ' C ' + f(x + s * 0.18) + ' ' + f(y - s * 0.18) + ', ' + f(x + s * 0.18) + ' ' + f(y - s * 0.18) + ', ' + f(x + s) + ' ' + f(y) +
      ' C ' + f(x + s * 0.18) + ' ' + f(y + s * 0.18) + ', ' + f(x + s * 0.18) + ' ' + f(y + s * 0.18) + ', ' + f(x) + ' ' + f(y + s) +
      ' C ' + f(x - s * 0.18) + ' ' + f(y + s * 0.18) + ', ' + f(x - s * 0.18) + ' ' + f(y + s * 0.18) + ', ' + f(x - s) + ' ' + f(y) +
      ' C ' + f(x - s * 0.18) + ' ' + f(y - s * 0.18) + ', ' + f(x - s * 0.18) + ' ' + f(y - s * 0.18) + ', ' + f(x) + ' ' + f(y - s) + ' Z" fill="' + col + '" opacity="' + (op || 1) + '"/>';
  }

  // half-annulus (lower half) of the collar, centred on neck
  var CX = 96, CY = 114, K = 1.2;
  function ann(r1, r2) {
    return 'M' + f(CX + r2 * K) + ' ' + CY + ' A ' + f(r2 * K) + ' ' + r2 + ' 0 0 1 ' + f(CX - r2 * K) + ' ' + CY +
      ' L ' + f(CX - r1 * K) + ' ' + CY + ' A ' + f(r1 * K) + ' ' + r1 + ' 0 0 0 ' + f(CX + r1 * K) + ' ' + CY + ' Z';
  }
  function arc(r) {
    return 'M' + f(CX + r * K) + ' ' + CY + ' A ' + f(r * K) + ' ' + r + ' 0 0 1 ' + f(CX - r * K) + ' ' + CY;
  }
  function pt(r, a) { return [CX + Math.cos(a) * r * K, CY + Math.sin(a) * r]; }

  function bz(a, b, c, d, t) {
    var m = 1 - t;
    return [m * m * m * a[0] + 3 * m * m * t * b[0] + 3 * m * t * t * c[0] + t * t * t * d[0],
      m * m * m * a[1] + 3 * m * m * t * b[1] + 3 * m * t * t * c[1] + t * t * t * d[1]];
  }
  function dia(x, y, r, col) {
    return '<path d="M' + f(x) + ' ' + f(y - r) + ' L ' + f(x + r * 0.8) + ' ' + f(y) + ' L ' + f(x) + ' ' + f(y + r) + ' L ' + f(x - r * 0.8) + ' ' + f(y) + ' Z" fill="' + col + '"/>';
  }
  function rivet(x, y, r) {
    return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + r + '" fill="' + C.goldL + '" stroke="' + O + '" stroke-width="' + f(r * 0.5) + '"/><circle cx="' + f(x - r * 0.3) + '" cy="' + f(y - r * 0.3) + '" r="' + f(r * 0.32) + '" fill="#fff"/>';
  }

  // ---------- parts ----------
  function shadow(anim) {
    return '<g' + (anim ? ' class="part-shadow"' : '') + '><ellipse cx="96" cy="229" rx="48" ry="7" fill="#000" opacity="0.22"/><ellipse cx="96" cy="229" rx="30" ry="4.5" fill="#000" opacity="0.14"/></g>';
  }

  function sands() {
    return '<g opacity="0.95">' +
      sparkle(26, 72, 4.2, '#f7dc9a') + sparkle(26, 72, 1.6, '#fff') +
      sparkle(178, 44, 3.4, '#f7dc9a') + sparkle(178, 44, 1.3, '#fff') +
      sparkle(20, 128, 2.6, '#e9c77a', 0.85) +
      sparkle(186, 150, 3, '#f7dc9a', 0.9) + sparkle(186, 150, 1.1, '#fff') +
      sparkle(160, 208, 2.4, '#e9c77a', 0.8) +
      sparkle(52, 222, 2.2, '#f7dc9a', 0.9) + sparkle(52, 222, 0.8, '#fff') +
      sparkle(146, 224, 2.6, '#f7dc9a', 0.9) + sparkle(146, 224, 1, '#fff') +
      sparkle(70, 232, 1.6, '#e9c77a', 0.8) + sparkle(120, 233, 1.4, '#e9c77a', 0.8) +
      '<circle cx="58" cy="229" r="0.9" fill="#e9c77a" opacity="0.8"/><circle cx="136" cy="230" r="1" fill="#e9c77a" opacity="0.8"/><circle cx="44" cy="216" r="0.9" fill="#f7dc9a" opacity="0.7"/><circle cx="152" cy="216" r="0.8" fill="#f7dc9a" opacity="0.7"/><circle cx="84" cy="232.4" r="0.7" fill="#e9c77a" opacity="0.7"/><circle cx="108" cy="232" r="0.7" fill="#e9c77a" opacity="0.7"/>' +
      '<circle cx="36" cy="96" r="1.2" fill="#e9c77a" opacity="0.8"/><circle cx="170" cy="118" r="1.1" fill="#e9c77a" opacity="0.8"/><circle cx="30" cy="206" r="1.3" fill="#e9c77a" opacity="0.7"/><circle cx="148" cy="30" r="1" fill="#f7dc9a" opacity="0.8"/>' +
      '</g>';
  }

  function legs(u) {
    var id = mk(u), s = '';
    s += '<path d="' + LEGL + '" fill="url(#' + id('skin') + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<path d="' + LEGR + '" fill="url(#' + id('skin') + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<path d="M83 200 L 84 220 M101 200 L 102 220" stroke="' + C.skinS + '" stroke-width="2.4" opacity="0.5"/>';
    s += '<path d="M90 202 L 90 212 M108 202 L 108 212" stroke="' + C.skinL + '" stroke-width="1.2" opacity="0.7" stroke-linecap="round"/>';
    s += '<ellipse cx="87" cy="199.6" rx="7" ry="2.4" fill="url(#' + id('ao') + ')"/><ellipse cx="105" cy="199.6" rx="7" ry="2.4" fill="url(#' + id('ao') + ')"/>';
    s += '<path d="M86.6 204 C 86 207, 86.4 210, 87 211 M104.6 204 C 104 207, 104.4 210, 105 211" stroke="' + C.skinL + '" stroke-width="0.9" fill="none" opacity="0.55" stroke-linecap="round"/>';
    s += '<path d="M89.4 208.4 l 0.9 0.4 M107.6 206.6 l 0.9 0.4 M85 205 l 0.8 0.3" stroke="' + C.skinD + '" stroke-width="0.6" opacity="0.6" stroke-linecap="round"/>';
    function sandal(x) {
      var r = '';
      // foot
      r += '<path d="M' + (x + 1) + ' 218 L ' + (x + 12) + ' 218.5 C ' + (x + 17) + ' 219.5, ' + (x + 19.5) + ' 222, ' + (x + 19.5) + ' 225 L ' + (x + 1) + ' 225 Z" fill="' + C.skin + '" stroke="' + O + '" stroke-width="2.2" stroke-linejoin="round"/>';
      r += '<path d="M' + (x + 16.5) + ' 222 L ' + (x + 16.5) + ' 224.6 M' + (x + 14) + ' 221.2 L ' + (x + 14) + ' 224.6" stroke="' + C.skinS + '" stroke-width="0.8"/>';
      // sole
      r += '<path d="M' + (x - 2) + ' 224.3 L ' + (x + 18) + ' 224.3 C ' + (x + 22.5) + ' 224.3, ' + (x + 23) + ' 228.6, ' + (x + 19) + ' 229 L ' + (x - 1.5) + ' 229 C ' + (x - 3.6) + ' 229, ' + (x - 3.6) + ' 224.3, ' + (x - 2) + ' 224.3 Z" fill="' + C.leaS + '" stroke="' + O + '" stroke-width="2.2" stroke-linejoin="round"/>';
      r += '<path d="M' + (x) + ' 226.5 L ' + (x + 19) + ' 226.5" stroke="' + C.leaL + '" stroke-width="0.8" stroke-dasharray="1.5 1" opacity="0.8"/>';
      r += '<path d="M' + (x - 2) + ' 224.3 L ' + (x + 18) + ' 224.3 C ' + (x + 22.5) + ' 224.3, ' + (x + 23) + ' 228.6, ' + (x + 19) + ' 229 L ' + (x - 1.5) + ' 229 C ' + (x - 3.6) + ' 229, ' + (x - 3.6) + ' 224.3, ' + (x - 2) + ' 224.3 Z" fill="url(#' + id('grain') + ')"/>';
      r += '<path d="M' + (x - 1) + ' 224.9 L ' + (x + 17) + ' 224.9" stroke="' + C.leaL + '" stroke-width="0.6" opacity="0.8"/>';
      r += '<path d="M' + (x + 18.4) + ' 220.6 l 0.8 1.6 M' + (x + 16.4) + ' 220.2 l 0.8 1.4" stroke="' + C.skinS + '" stroke-width="0.6" stroke-linecap="round" opacity="0.8"/>';
      r += '<ellipse cx="' + (x + 18.6) + '" cy="222.4" rx="0.9" ry="0.7" fill="#f0c9a0" opacity="0.8"/>';
      r += '<circle cx="' + (x + 1.2) + '" cy="227.6" r="0.7" fill="' + C.leaS + '" opacity="0.85"/><circle cx="' + (x + 4) + '" cy="228" r="0.5" fill="' + C.leaS + '"/><circle cx="' + (x + 16) + '" cy="227.8" r="0.6" fill="' + C.leaS + '" opacity="0.9"/><circle cx="' + (x + 18.6) + '" cy="226.4" r="0.5" fill="#c9a462"/>';
      r += '<path d="M' + (x + 3) + ' 224.8 C ' + (x + 6) + ' 226, ' + (x + 8) + ' 226.2, ' + (x + 10) + ' 225" stroke="#c9a462" stroke-width="0.9" opacity="0.5" stroke-linecap="round"/>';
      // toe thong + instep strap
      r += '<path d="M' + (x + 15) + ' 224.5 C ' + (x + 13) + ' 222, ' + (x + 10) + ' 220, ' + (x + 7) + ' 219.2" stroke="' + O + '" stroke-width="3" fill="none" stroke-linecap="round"/>';
      r += '<path d="M' + (x + 15) + ' 224.5 C ' + (x + 13) + ' 222, ' + (x + 10) + ' 220, ' + (x + 7) + ' 219.2" stroke="' + C.lea + '" stroke-width="1.7" fill="none" stroke-linecap="round"/>';
      r += '<path d="M' + (x + 2) + ' 224.5 C ' + (x + 3) + ' 220, ' + (x + 9) + ' 218.5, ' + (x + 12) + ' 224.5" stroke="' + O + '" stroke-width="3.4" fill="none" stroke-linecap="round"/>';
      r += '<path d="M' + (x + 2) + ' 224.5 C ' + (x + 3) + ' 220, ' + (x + 9) + ' 218.5, ' + (x + 12) + ' 224.5" stroke="' + C.lea + '" stroke-width="2" fill="none" stroke-linecap="round"/>';
      r += '<path d="M' + (x + 4.4) + ' 221.6 l 1 -1.3 M' + (x + 6.6) + ' 221.2 l 0.4 -1.6 M' + (x + 8.6) + ' 221.4 l -0.2 -1.5" stroke="' + C.leaL + '" stroke-width="0.6" stroke-linecap="round"/>';
      r += '<path d="M' + (x + 15) + ' 224.5 C ' + (x + 13) + ' 222, ' + (x + 10) + ' 220, ' + (x + 7) + ' 219.2" stroke="' + C.leaL + '" stroke-width="0.5" fill="none" opacity="0.8" transform="translate(0 -0.5)"/>';
      r += '<circle cx="' + (x + 7) + '" cy="219.6" r="1.3" fill="' + C.gold + '" stroke="' + O + '" stroke-width="0.7"/><circle cx="' + (x + 6.6) + '" cy="219.2" r="0.4" fill="#fff"/>';
      // gold anklet
      r += '<path d="M' + (x - 0.5) + ' 212 C ' + (x + 4) + ' 214.5, ' + (x + 9) + ' 214.5, ' + (x + 12.5) + ' 212 L ' + (x + 12.5) + ' 215.5 C ' + (x + 9) + ' 218, ' + (x + 4) + ' 218, ' + (x - 0.5) + ' 215.5 Z" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="1.6" stroke-linejoin="round"/>';
      r += '<path d="M' + (x + 0.4) + ' 213.2 C ' + (x + 4) + ' 215.4, ' + (x + 9) + ' 215.4, ' + (x + 12) + ' 213.2" stroke="' + C.goldL + '" stroke-width="0.6" fill="none"/>';
      r += '<circle cx="' + (x + 3) + '" cy="215.3" r="0.9" fill="' + C.lapis + '"/><circle cx="' + (x + 6) + '" cy="215.9" r="0.9" fill="' + C.carn + '"/><circle cx="' + (x + 9) + '" cy="215.3" r="0.9" fill="' + C.turq + '"/>';
      return r;
    }
    s += sandal(81) + sandal(99.5);
    return s;
  }

  function backArm(u) {
    var id = mk(u), s = '';
    s += '<path d="' + ARMS + '" fill="url(#' + id('skin') + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<g clip-path="url(#' + id('arms-c') + ')"><path d="M60 138 C 62 150, 63 158, 64 166 L 58 166 Z" fill="' + C.skinS + '" opacity="0.5"/></g>';
    // upper-arm band
    s += '<path d="M64 136 C 68 138.5, 74 138.5, 78 135 L 76.5 141 C 72.5 144, 67 144, 63 142 Z" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>';
    s += '<path d="M65 139.6 C 69 141.4, 73 141.2, 77 138.6" stroke="' + C.lapis + '" stroke-width="1.2" fill="none"/>';
    // wrist cuff
    s += '<path d="M60.5 153 L 72.5 153.5 L 71.8 160 L 60.8 159.6 Z" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>';
    s += '<path d="M61 156.5 L 72 156.8" stroke="' + C.turq + '" stroke-width="1.4"/>';
    s += '<path d="M60.8 153.6 L 72.4 154.1 M61 159 L 71.9 159.3" stroke="' + C.goldL + '" stroke-width="0.6" opacity="0.9"/>';
    s += dia(63.4, 156.7, 1, C.carn) + dia(66.4, 156.7, 1, C.lapis) + dia(69.4, 156.7, 1, C.carn);
    s += '<path d="M64 136.6 C 68 139, 74 139, 78 135.6" stroke="' + C.goldL + '" stroke-width="0.7" fill="none"/>';
    s += rivet(66, 141.6, 0.9) + rivet(74, 140.6, 0.9);
    // arm shading: crease, reflected light, ambient occlusion under the bands
    s += '<g clip-path="url(#' + id('arms-c') + ')"><path d="M70 146 C 70 150, 70.6 152, 71 153" stroke="' + C.skinS + '" stroke-width="0.9" fill="none" opacity="0.6" stroke-linecap="round"/>' +
      '<path d="M62.4 143 C 62.2 148, 62.6 152, 63.4 153" stroke="#e5a878" stroke-width="1" fill="none" opacity="0.5" stroke-linecap="round"/>' +
      '<ellipse cx="70" cy="146" rx="8" ry="3" fill="url(#' + id('ao') + ')"/><ellipse cx="66" cy="161" rx="7" ry="2.6" fill="url(#' + id('ao') + ')"/>' +
      '<path d="M73 128 C 71 132, 70 136, 71 140" stroke="' + C.skinL + '" stroke-width="1.4" fill="none" opacity="0.6" stroke-linecap="round"/></g>';
    s += '<path d="M62 162 C 64 165, 68 165, 70 162" stroke="' + C.skinD + '" stroke-width="0.8" fill="none" opacity="0.7"/>';
    return s;
  }

  function skirt(u) {
    var id = mk(u), s = '';
    s += '<path d="' + SKIRT + '" fill="url(#' + id('lin') + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    var hemDiamonds = '', hp, hq = [[62, 202.5], [78, 208.5], [114, 208.5], [130, 202.5]];
    for (var hi = 0; hi < 16; hi++) {
      hp = bz(hq[0], hq[1], hq[2], hq[3], (hi + 0.5) / 16);
      hemDiamonds += dia(hp[0], hp[1] - 1.6, 1.15, hi % 2 ? C.carn : C.blueS);
    }
    var p = '';
    for (var i = 0; i <= 18; i++) {
      var hx = 63 + i * 3.7, tx = 76 + i * 2.25;
      p += 'M' + f(tx) + ' 161 L ' + f(hx) + ' 210 ';
    }
    s += '<g clip-path="url(#' + id('skirt-c') + ')">' +
      '<path d="' + p + '" stroke="' + C.pleat + '" stroke-width="0.9" fill="none"/>' +
      // shaded left side + wrap-over fold
      '<path d="M75 160 C 71 176, 66 192, 62 205 L 76 208 C 77 190, 79 176, 82 160 Z" fill="#8a7a58" opacity="0.18"/>' +
      '<path d="M117 162 C 114 178, 110 194, 111 209 L 130 209 L 118 160 Z" fill="' + C.linS + '" opacity="0.8"/>' +
      '<path d="M117 162 C 114 178, 110 194, 111 209" stroke="' + O + '" stroke-width="1.6" fill="none"/>' +
      '<path d="M119 170 L 121 205 M122 178 L 124.5 205" stroke="' + C.pleat + '" stroke-width="0.8" fill="none"/>' +
      // blue & gold hem border
      '<path d="M62 202.5 C 78 208.5, 114 208.5, 130 202.5" stroke="' + C.blue + '" stroke-width="1.8" fill="none"/>' +
      '<path d="M63 199.6 C 78 205.6, 114 205.6, 129 199.6" stroke="' + C.gold + '" stroke-width="1" fill="none"/>' +
      '<path d="M62 204 C 78 210, 114 210, 130 204" stroke="' + C.gold + '" stroke-width="0.7" fill="none"/>' +
      hemDiamonds +
      // sheer linen: weave, depth and deeper folds
      '<rect x="60" y="158" width="72" height="54" fill="url(#' + id('weave') + ')" opacity="0.1"/>' +
      '<rect x="60" y="158" width="72" height="54" fill="url(#' + id('sheer') + ')"/>' +
      '<path d="M79 163 C 77 178, 75 192, 72 206 M86 164 C 85 180, 84 194, 83 208 M108 164 C 108 180, 109 194, 111 208" stroke="#8a7a58" stroke-width="1.2" fill="none" opacity="0.2"/>' +
      '<path d="M82 163 C 80 178, 78 192, 76 206 M89 164 C 88 180, 87 194, 86 208 M112 164 C 112 180, 113 194, 115 208 M66 190 C 68 178, 70 172, 72 166" stroke="#fff" stroke-width="0.9" fill="none" opacity="0.8"/>' +
      '<ellipse cx="96" cy="164" rx="24" ry="4.2" fill="url(#' + id('ao') + ')"/>' +
      '<ellipse cx="84" cy="209" rx="9" ry="3" fill="#b89a5e" opacity="0.28"/><ellipse cx="112" cy="209" rx="10" ry="3" fill="#b89a5e" opacity="0.26"/>' +
      '<path d="M63 205 l 2 -0.6 M70 208 l 1.4 -1.8 M118 208.6 l 2 -1.4 M125 205.6 l 1.6 -1.6" stroke="#c9a462" stroke-width="0.9" opacity="0.6" stroke-linecap="round"/>' +
      '<path d="M70 178 l 2.6 0.4 M69.5 178 l 1.4 1.2 M112 186 l 2 1.6 M113 185 l 2.4 -0.4" stroke="#b7a57c" stroke-width="0.6" opacity="0.55"/>' +
      '</g>';
    s += '<path d="' + SKIRT + '" fill="none" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    // frayed hem threads
    var th = '', sq = [[62, 205], [78, 211], [114, 211], [130, 205]];
    for (var ti = 0; ti < 17; ti++) {
      hp = bz(sq[0], sq[1], sq[2], sq[3], 0.04 + ti * 0.0575);
      th += 'M' + f(hp[0]) + ' ' + f(hp[1] + 1) + ' l ' + f(((ti * 7) % 5 - 2) * 0.3) + ' ' + f(1.6 + (ti % 3) * 0.6) + ' ';
    }
    s += '<path d="' + th + '" stroke="' + O + '" stroke-width="0.8" stroke-linecap="round"/>';
    return s;
  }

  function torso(u) {
    var id = mk(u), s = '';
    // neck
    s += '<path d="M88 104 L 104 104 L 105 124 L 87 124 Z" fill="url(#' + id('skin') + ')" stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round"/>';
    s += '<path d="M88 106 L 104 106 L 104 113 C 98 116, 92 116, 88 113 Z" fill="' + C.skinD + '" opacity="0.45"/>';
    // linen sheath
    s += '<path d="' + TORSO + '" fill="url(#' + id('lin') + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<g clip-path="url(#' + id('torso-c') + ')">' +
      '<path d="M73 122 C 69 138, 71 152, 75 166 L 81 166 C 78 152, 77 138, 79 124 Z" fill="#8a7a58" opacity="0.16"/>' +
      '<path d="M84 142 C 86 150, 86 158, 84 166 M90 146 C 91 154, 91 160, 90 166 M103 146 C 102 154, 102 160, 103 166 M109 142 C 107 150, 107 158, 109 166" stroke="' + C.pleat + '" stroke-width="0.9" fill="none"/>' +
      '<rect x="68" y="116" width="56" height="52" fill="url(#' + id('weave') + ')" opacity="0.3"/>' +
      '<path d="M114 122 C 118 138, 118 152, 116 166 L 121 166 C 123 152, 122 138, 120 124 Z" fill="#8a7a58" opacity="0.16"/>' +
      '<path d="M78 128 C 80 138, 81 148, 80 158 M113 130 C 112 140, 112 148, 113 156 M86 124 C 84 132, 84 140, 86 148" stroke="#fff" stroke-width="0.9" fill="none" opacity="0.85"/>' +
      '<path d="M81 130 C 83 140, 83 150, 82 158 M116 132 C 116 142, 116 150, 117 158" stroke="#8a7a58" stroke-width="0.8" fill="none" opacity="0.3"/>' +
      '<ellipse cx="96" cy="120" rx="18" ry="4" fill="url(#' + id('ao') + ')"/>' +
      '</g>';
    // gold belt with inlay
    s += '<path d="M72 156 C 86 160.5, 106 160.5, 120 156 L 120 165 C 106 169.5, 86 169.5, 72 165 Z" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>';
    var inl = '';
    for (var i = 0; i < 9; i++) {
      var bx = 75 + i * 5.1, by = 159.4 + Math.sin((i + 0.5) / 9 * Math.PI) * 2.4;
      var col = [C.lapis, C.carn, C.turq][i % 3];
      inl += '<rect x="' + f(bx) + '" y="' + f(by) + '" width="3.4" height="3.6" rx="0.5" fill="' + col + '" stroke="' + C.goldS + '" stroke-width="0.6"/>';
    }
    s += inl;
    s += '<path d="M73 158.2 C 86 162.6, 106 162.6, 119 158.2" stroke="' + C.goldL + '" stroke-width="0.9" fill="none" opacity="0.9"/>';
    s += '<path d="M73 163.7 C 86 168, 106 168, 119 163.7" stroke="' + C.goldS + '" stroke-width="0.7" fill="none" stroke-dasharray="1.4 1"/>';
    s += rivet(73.6, 160.6, 1.1) + rivet(118.4, 160.6, 1.1);
    // cartouche belt buckle
    s += '<rect x="88.6" y="156.6" width="14.8" height="10.6" rx="5" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="1.5"/>';
    s += '<rect x="91" y="158.8" width="10" height="6.2" rx="3" fill="' + C.blueS + '" stroke="' + C.goldS + '" stroke-width="0.6"/>';
    s += '<path d="M93.6 160.4 L 98.6 160.4 M93.6 163.4 L 98.6 163.4" stroke="' + C.goldL + '" stroke-width="0.7"/><circle cx="96" cy="161.9" r="1" fill="' + C.carn + '"/><path d="M99.4 160.2 L 99.4 163.6" stroke="' + C.goldL + '" stroke-width="0.6"/>';
    s += '<path d="M90.4 158 C 93 156.6, 99 156.6, 101.6 158" stroke="#fff" stroke-width="0.6" fill="none" opacity="0.7"/>';

    // hanging apron
    s += '<path d="M87 166 L 105 166 L 107.5 207 C 101 209.5, 91 209.5, 84.5 207 Z" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>';
    s += '<path d="M89.5 169 L 102.5 169 L 104.6 203 C 99 205, 93 205, 87.4 203 Z" fill="' + C.blue + '" stroke="' + O + '" stroke-width="1.1" stroke-linejoin="round"/>';
    // vertical stripes of the apron
    s += '<path d="M92.8 174 L 91.8 203.8 M96 174 L 96 204.4 M99.2 174 L 100.2 203.8" stroke="' + C.gold + '" stroke-width="1.1"/>';
    s += '<path d="M94.4 174 L 93.9 204.2 M97.6 174 L 98.1 204.2" stroke="' + C.carn + '" stroke-width="1"/>';
    s += '<path d="M89.6 199.4 L 91.4 197.4 L 93.2 199.4 L 95 197.4 L 96.8 199.4 L 98.6 197.4 L 100.4 199.4 L 102.2 197.4 L 102.5 199.6" stroke="' + C.carn + '" stroke-width="0.9" fill="none" stroke-linejoin="round"/>';
    s += '<path d="M90 190 L 102 190 M90.2 192.4 L 101.8 192.4" stroke="' + C.goldL + '" stroke-width="0.5" opacity="0.7"/>';
    s += '<path d="M87.6 168 L 89.6 207 M105.4 168 L 103.6 207" stroke="' + C.goldL + '" stroke-width="0.7" opacity="0.8"/>';
    s += '<path d="M89.5 169 L 102.5 169 L 102.2 172.4 C 98 173.6, 94 173.6, 89.8 172.4 Z" fill="#000" opacity="0.22"/>';
    // winged sun disc on apron top
    s += '<path d="M89.8 171.8 C 92 169.6, 94 170.2, 96 171.6 C 98 170.2, 100 169.6, 102.2 171.8 L 102.4 174 L 89.7 174 Z" fill="' + C.gold + '" stroke="' + O + '" stroke-width="0.7"/>';
    s += '<circle cx="96" cy="171.8" r="1.8" fill="' + C.carn + '" stroke="' + O + '" stroke-width="0.7"/>';
    // bead fringe
    var fr = '';
    for (var k = 0; k < 7; k++) {
      var fx = 86.4 + k * 3.2, fy = 207.4 + Math.sin((k + 0.5) / 7 * Math.PI) * 1.4;
      fr += '<path d="M' + f(fx) + ' ' + f(fy) + ' L ' + f(fx) + ' ' + f(fy + 3) + '" stroke="' + O + '" stroke-width="0.8"/>';
      fr += '<ellipse cx="' + f(fx) + '" cy="' + f(fy + 4) + '" rx="1.3" ry="1.7" fill="' + [C.turq, C.carn, C.lapis][k % 3] + '" stroke="' + O + '" stroke-width="0.7"/>';
    }
    s += fr;
    return s;
  }

  function collar(u) {
    var id = mk(u), s = '', i, n, a, p;
    s += '<path d="' + ann(11, 33.5) + '" fill="#000" opacity="0.16"/>';
    s += '<path d="' + ann(10.5, 31) + '" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>';
    // band 1: lapis round beads
    n = 13;
    for (i = 0; i < n; i++) {
      a = (i + 0.5) / n * Math.PI; p = pt(15.2, a);
      s += '<circle cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="2.3" fill="url(#' + id('lapis') + ')" stroke="' + O + '" stroke-width="0.8"/>';
      s += '<circle cx="' + f(p[0] - 0.7) + '" cy="' + f(p[1] - 0.8) + '" r="0.6" fill="#fff" opacity="0.85"/>';
    }
    // gold spacer beads between rows
    n = 26;
    for (i = 0; i < n; i++) {
      a = (i + 0.5) / n * Math.PI; p = pt(18.3, a);
      s += '<circle cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="0.85" fill="' + C.goldL + '" stroke="' + C.goldS + '" stroke-width="0.4"/>';
    }
    s += '<path d="' + arc(18.3) + '" stroke="' + O + '" stroke-width="0.9" fill="none"/>';
    // band 2: turquoise & carnelian tube beads
    n = 26;
    for (i = 0; i < n; i++) {
      a = (i + 0.5) / n * Math.PI;
      var p1 = pt(19.2, a), p2 = pt(23.2, a);
      s += '<path d="M' + f(p1[0]) + ' ' + f(p1[1]) + ' L ' + f(p2[0]) + ' ' + f(p2[1]) + '" stroke="' + O + '" stroke-width="3" stroke-linecap="round"/>';
      s += '<path d="M' + f(p1[0]) + ' ' + f(p1[1]) + ' L ' + f(p2[0]) + ' ' + f(p2[1]) + '" stroke="' + (i % 2 ? C.carn : C.turq) + '" stroke-width="1.8" stroke-linecap="round"/>';
    }
    s += '<path d="' + arc(24.3) + '" stroke="' + O + '" stroke-width="0.9" fill="none"/>';
    n = 26;
    for (i = 0; i < n; i++) {
      a = (i + 0.5) / n * Math.PI; p = pt(24.3, a);
      s += '<circle cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="0.8" fill="' + C.goldL + '" stroke="' + C.goldS + '" stroke-width="0.4"/>';
      var q1 = pt(19.6, a), q2 = pt(22.2, a);
      s += '<path d="M' + f(q1[0] - 0.4) + ' ' + f(q1[1] - 0.3) + ' L ' + f(q2[0] - 0.4) + ' ' + f(q2[1] - 0.3) + '" stroke="#fff" stroke-width="0.5" opacity="0.5" stroke-linecap="round"/>';
    }
    // band 3: teardrop pendants
    n = 17;
    var cols = [C.carn, C.turq, C.lapis];
    for (i = 0; i < n; i++) {
      a = (i + 0.5) / n * Math.PI; p = pt(27.6, a);
      var deg = Math.atan2(Math.sin(a), Math.cos(a) / K) * 180 / Math.PI - 90;
      s += '<g transform="translate(' + f(p[0]) + ' ' + f(p[1]) + ') rotate(' + f(deg) + ')">' +
        '<path d="M0 -3 C 2.2 -1.5, 2.6 1.6, 0 4.2 C -2.6 1.6, -2.2 -1.5, 0 -3 Z" fill="' + cols[i % 3] + '" stroke="' + O + '" stroke-width="0.8"/>' +
        '<circle cx="0" cy="-2.6" r="1" fill="' + C.goldL + '" stroke="' + C.goldS + '" stroke-width="0.4"/>' +
        '<circle cx="-0.7" cy="0.6" r="0.6" fill="#fff" opacity="0.7"/></g>';
    }
    // tiny gold caps under each pendant + edge beading
    for (i = 0; i < 17; i++) {
      a = (i + 0.5) / 17 * Math.PI; p = pt(30.2, a);
      s += '<circle cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="0.7" fill="' + C.goldL + '" stroke="' + O + '" stroke-width="0.4"/>';
    }
    s += '<path d="' + arc(31) + '" stroke="' + O + '" stroke-width="2.4" fill="none"/>';
    s += '<path d="' + arc(11.5) + '" stroke="' + C.goldL + '" stroke-width="0.9" fill="none" opacity="0.9"/>';
    return s;
  }

  function scarab(u) {
    var id = mk(u), s = '';
    var x = 96, y = 151;
    s += '<path d="M' + x + ' 144 L ' + x + ' ' + (y - 5) + '" stroke="' + O + '" stroke-width="1.6"/>';
    // wings
    s += '<path d="M' + (x - 3) + ' ' + (y - 1) + ' C ' + (x - 8) + ' ' + (y - 5) + ', ' + (x - 13) + ' ' + (y - 4) + ', ' + (x - 15) + ' ' + (y - 1) + ' C ' + (x - 12) + ' ' + (y + 1) + ', ' + (x - 8) + ' ' + (y + 2.5) + ', ' + (x - 3) + ' ' + (y + 2.5) + ' Z" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="1.2" stroke-linejoin="round"/>';
    s += '<path d="M' + (x + 3) + ' ' + (y - 1) + ' C ' + (x + 8) + ' ' + (y - 5) + ', ' + (x + 13) + ' ' + (y - 4) + ', ' + (x + 15) + ' ' + (y - 1) + ' C ' + (x + 12) + ' ' + (y + 1) + ', ' + (x + 8) + ' ' + (y + 2.5) + ', ' + (x + 3) + ' ' + (y + 2.5) + ' Z" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="1.2" stroke-linejoin="round"/>';
    s += '<path d="M' + (x - 6) + ' ' + (y - 1.6) + ' L ' + (x - 7) + ' ' + (y + 1.8) + ' M' + (x - 9.5) + ' ' + (y - 2.4) + ' L ' + (x - 10.4) + ' ' + (y + 1) + ' M' + (x + 6) + ' ' + (y - 1.6) + ' L ' + (x + 7) + ' ' + (y + 1.8) + ' M' + (x + 9.5) + ' ' + (y - 2.4) + ' L ' + (x + 10.4) + ' ' + (y + 1) + '" stroke="' + C.goldS + '" stroke-width="0.8"/>';
    s += '<path d="M' + (x - 12) + ' ' + (y - 0.6) + ' C ' + (x - 9) + ' ' + (y + 0.6) + ', ' + (x - 6) + ' ' + (y + 1) + ', ' + (x - 3.5) + ' ' + (y + 1) + ' M' + (x + 12) + ' ' + (y - 0.6) + ' C ' + (x + 9) + ' ' + (y + 0.6) + ', ' + (x + 6) + ' ' + (y + 1) + ', ' + (x + 3.5) + ' ' + (y + 1) + '" stroke="' + C.turq + '" stroke-width="0.9" fill="none"/>';
    // sun disc
    s += '<circle cx="' + x + '" cy="' + (y - 6.5) + '" r="2.3" fill="' + C.carn + '" stroke="' + O + '" stroke-width="1"/>';
    // beetle
    s += '<ellipse cx="' + x + '" cy="' + (y + 1.5) + '" rx="4.3" ry="5.2" fill="url(#' + id('lapis') + ')" stroke="' + O + '" stroke-width="1.3"/>';
    s += '<path d="M' + (x - 3) + ' ' + (y - 3) + ' C ' + (x - 2) + ' ' + (y - 5.4) + ', ' + (x + 2) + ' ' + (y - 5.4) + ', ' + (x + 3) + ' ' + (y - 3) + ' Z" fill="' + C.blueS + '" stroke="' + O + '" stroke-width="1"/>';
    s += '<path d="M' + x + ' ' + (y - 1.5) + ' L ' + x + ' ' + (y + 6.4) + ' M' + (x - 4) + ' ' + (y - 0.6) + ' L ' + (x + 4) + ' ' + (y - 0.6) + '" stroke="' + C.gold + '" stroke-width="0.8"/>';
    s += '<ellipse cx="' + (x - 1.6) + '" cy="' + (y + 1) + '" rx="0.9" ry="1.6" fill="#fff" opacity="0.6"/>';
    // cloisonne cells on the wings + feather barbs + legs
    s += '<path d="M' + (x - 5) + ' ' + (y + 0.6) + ' L ' + (x - 6) + ' ' + (y + 2.2) + ' M' + (x - 8) + ' ' + (y - 0.2) + ' L ' + (x - 9) + ' ' + (y + 1.6) + ' M' + (x - 11) + ' ' + (y - 0.4) + ' L ' + (x - 12) + ' ' + (y + 0.6) + ' M' + (x + 5) + ' ' + (y + 0.6) + ' L ' + (x + 6) + ' ' + (y + 2.2) + ' M' + (x + 8) + ' ' + (y - 0.2) + ' L ' + (x + 9) + ' ' + (y + 1.6) + ' M' + (x + 11) + ' ' + (y - 0.4) + ' L ' + (x + 12) + ' ' + (y + 0.6) + '" stroke="' + C.lapis + '" stroke-width="0.6"/>';
    s += '<path d="M' + (x - 4) + ' ' + (y + 5.2) + ' L ' + (x - 6) + ' ' + (y + 7) + ' M' + (x + 4) + ' ' + (y + 5.2) + ' L ' + (x + 6) + ' ' + (y + 7) + '" stroke="' + O + '" stroke-width="1" stroke-linecap="round"/>';
    s += '<circle cx="' + (x - 0.8) + '" cy="' + (y - 6.9) + '" r="0.6" fill="#fff" opacity="0.8"/>';
    s += '<path d="M' + (x - 13.5) + ' ' + (y - 1.4) + ' C ' + (x - 11) + ' ' + (y - 3.4) + ', ' + (x - 8) + ' ' + (y - 3.6) + ', ' + (x - 5) + ' ' + (y - 2.6) + ' M' + (x + 13.5) + ' ' + (y - 1.4) + ' C ' + (x + 11) + ' ' + (y - 3.4) + ', ' + (x + 8) + ' ' + (y - 3.6) + ', ' + (x + 5) + ' ' + (y - 2.6) + '" stroke="' + C.goldL + '" stroke-width="0.6" fill="none" opacity="0.9"/>';
    return s;
  }

  function lappets(u) {
    var id = mk(u), s = '';
    s += '<path d="' + LAPL + ' ' + LAPR + '" fill="' + C.gold + '" stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round"/>';
    var st = '';
    for (var y = 106; y < 144; y += 7) {
      st += '<path d="M60 ' + y + ' L 132 ' + (y + 1.5) + ' L 132 ' + (y + 5) + ' L 60 ' + (y + 3.5) + ' Z" fill="' + C.blue + '"/>';
    }
    s += '<g clip-path="url(#' + id('lap-c') + ')">' + st +
      '<rect x="62" y="106" width="3.5" height="50" fill="#000" opacity="0.14"/><rect x="116" y="106" width="3" height="50" fill="#000" opacity="0.14"/>' +
      '<path d="M73 110 L 74 145 M127.5 110 L 127.2 145" stroke="' + C.goldL + '" stroke-width="1.2" opacity="0.7"/>' +
      '<path d="M67.5 108 L 67 146 M70.5 108 L 70.5 147 M121.4 108 L 121 146 M124.6 108 L 124.6 147" stroke="' + C.blueS + '" stroke-width="0.7" opacity="0.4"/>' +
      '<path d="M65 108 L 64.6 146 M76 108 L 76.4 147 M118.5 108 L 118.4 147 M129 108 L 129.4 146" stroke="#fff" stroke-width="0.5" opacity="0.35"/>' +
      '<rect x="60" y="106" width="72" height="42" fill="url(#' + id('weave') + ')" opacity="0.22"/>' +
      '<ellipse cx="69" cy="108" rx="9" ry="5" fill="url(#' + id('ao') + ')"/><ellipse cx="123" cy="108" rx="9" ry="5" fill="url(#' + id('ao') + ')"/>' +
      '<path d="M60 143.5 L 132 145 L 132 147 L 60 145.5 Z" fill="#000" opacity="0.18"/>' +
      // gold end bands
      '<path d="M60 142 L 132 143.5 L 132 160 L 60 160 Z" fill="url(#' + id('gold') + ')"/>' +
      '<path d="M60 142 L 132 143.5" stroke="' + O + '" stroke-width="1.3"/>' +
      '<rect x="60" y="144" width="72" height="14" fill="url(#' + id('cell') + ')" opacity="0.85"/>' +
      '<path d="M60 146.4 L 132 147.9" stroke="' + C.lapis + '" stroke-width="1.1"/><path d="M60 152.6 L 132 154" stroke="' + C.carn + '" stroke-width="0.8"/>' +
      '</g>';
    // tassel cords at the lappet tips
    s += '<path d="M69 148.6 L 69 152 M65.6 147.6 L 65.4 150.6 M72.4 149 L 72.6 152 M123 148.6 L 123 152 M119.6 149 L 119.4 152 M126.4 148 L 126.6 151" stroke="' + O + '" stroke-width="0.8" stroke-linecap="round"/><circle cx="69" cy="153" r="1.1" fill="' + C.carn + '" stroke="' + O + '" stroke-width="0.6"/><circle cx="123" cy="153" r="1.1" fill="' + C.turq + '" stroke="' + O + '" stroke-width="0.6"/>';
    s += '<path d="' + LAPL + ' ' + LAPR + '" fill="none" stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round"/>';
    return s;
  }

  function eye(x, y, dir, u) {
    var id = mk(u);
    function P(dx, dy) { return f(x + dir * dx) + ' ' + f(y + dy); }
    var s = '';
    s += '<ellipse cx="' + x + '" cy="' + y + '" rx="5.9" ry="7.4" fill="#fff" stroke="' + O + '" stroke-width="1.4"/>';
    s += '<ellipse cx="' + f(x + 0.9) + '" cy="' + f(y + 0.6) + '" rx="4.7" ry="6.5" fill="url(#' + id('iris') + ')"/>';
    s += '<ellipse cx="' + f(x + 0.9) + '" cy="' + f(y + 0.6) + '" rx="4.7" ry="6.5" fill="none" stroke="#1a0e08" stroke-width="0.9"/>';
    s += '<path d="M' + f(x + 0.9) + ' ' + f(y + 3) + ' L ' + f(x + 0.9) + ' ' + f(y + 6) + ' M' + f(x - 1.4) + ' ' + f(y + 2.4) + ' L ' + f(x - 2.8) + ' ' + f(y + 4.8) + ' M' + f(x + 3.2) + ' ' + f(y + 2.4) + ' L ' + f(x + 4.2) + ' ' + f(y + 4.6) + ' M' + f(x - 2) + ' ' + f(y - 0.6) + ' L ' + f(x - 3.6) + ' ' + f(y - 0.6) + ' M' + f(x + 4) + ' ' + f(y - 0.6) + ' L ' + f(x + 5) + ' ' + f(y - 0.6) + '" stroke="#f0b661" stroke-width="0.5" opacity="0.65" stroke-linecap="round"/>';
    s += '<ellipse cx="' + f(x + 1.1) + '" cy="' + f(y + 1) + '" rx="2.2" ry="3.1" fill="#0d0604"/>';
    s += '<ellipse cx="' + f(x + 1.1) + '" cy="' + f(y + 1) + '" rx="2.2" ry="3.1" fill="none" stroke="#3a1c0c" stroke-width="0.5"/>';
    s += '<path d="M' + f(x - 2.4) + ' ' + f(y + 4.6) + ' Q ' + f(x + 0.9) + ' ' + f(y + 6.8) + ' ' + f(x + 4.4) + ' ' + f(y + 4) + '" stroke="#e0a14e" stroke-width="1" fill="none" opacity="0.9"/>';
    s += '<circle cx="' + f(x + 2.8) + '" cy="' + f(y - 2.6) + '" r="2.2" fill="#fff"/>';
    s += '<circle cx="' + f(x - 1.4) + '" cy="' + f(y + 3.2) + '" r="1" fill="#fff"/>';
    s += '<circle cx="' + f(x + 0.4) + '" cy="' + f(y - 4.2) + '" r="0.55" fill="#fff" opacity="0.9"/>';
    // bold kohl upper lid sweeping into a wing
    s += '<path d="M' + P(-6.8, -2.4) + ' C ' + P(-4.5, -9.6) + ', ' + P(4.5, -10) + ', ' + P(7, -4.2) + ' L ' + P(12.8, -7.6) + ' L ' + P(8.2, -0.8) + ' C ' + P(6.8, -5.4) + ', ' + P(3.5, -7.8) + ', ' + P(0, -7.8) + ' C ' + P(-3.8, -7.8) + ', ' + P(-5.6, -5.4) + ', ' + P(-6.8, -2.4) + ' Z" fill="' + C.kohl + '" stroke="' + C.kohl + '" stroke-width="0.8" stroke-linejoin="round"/>';
    // upper lid crease + lash flicks
    s += '<path d="M' + P(-5.4, -8.6) + ' C ' + P(-2.4, -11.6) + ', ' + P(3, -12.2) + ', ' + P(6.2, -9.6) + '" stroke="' + C.skinD + '" stroke-width="0.8" fill="none" stroke-linecap="round" opacity="0.75"/>';
    s += '<path d="M' + P(-2.4, -8.4) + ' L ' + P(-3.4, -10.4) + ' M' + P(0.4, -8.6) + ' L ' + P(0.4, -11) + ' M' + P(3.2, -8.2) + ' L ' + P(4.4, -10.2) + '" stroke="' + C.kohl + '" stroke-width="0.9" stroke-linecap="round"/>';
    s += '<path d="M' + P(-3, 7.2) + ' L ' + P(-3.6, 8.8) + ' M' + P(0, 7.9) + ' L ' + P(-0.2, 9.6) + ' M' + P(3, 7) + ' L ' + P(3.6, 8.6) + '" stroke="' + C.kohl + '" stroke-width="0.7" stroke-linecap="round"/>';
    s += '<path d="M' + P(-4.4, 8.4) + ' C ' + P(-1, 10.6) + ', ' + P(3.4, 9.8) + ', ' + P(6, 6.6) + '" stroke="#fff" stroke-width="0.5" fill="none" opacity="0.25"/>';
    // inner corner tick
    s += '<path d="M' + P(-6.4, -2) + ' L ' + P(-8.4, 0.2) + '" stroke="' + C.kohl + '" stroke-width="1.5" stroke-linecap="round"/>';
    // lower kohl line running parallel to the wing
    s += '<path d="M' + P(-4.6, 6) + ' C ' + P(-1, 8.4) + ', ' + P(4.4, 7.4) + ', ' + P(6.4, 3.4) + ' L ' + P(11, -1.8) + '" stroke="' + C.kohl + '" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    return s;
  }

  function head(u, anim) {
    var id = mk(u), s = '<g' + (anim ? ' class="part-head" style="transform-origin: 100px 112px"' : '') + '><g transform="translate(104 113) scale(1.12) translate(-104 -113)">';
    // nemes headcloth mass
    s += '<path d="' + NEMES + '" fill="' + C.gold + '" stroke="' + O + '" stroke-width="3.2" stroke-linejoin="round"/>';
    var st = '', sl = '';
    for (var y = 24; y < 124; y += 7) {
      st += '<path d="M48 ' + (y + 2) + ' C 80 ' + (y - 4) + ', 128 ' + (y - 4) + ', 160 ' + (y + 2) + ' L 160 ' + (y + 5.6) + ' C 128 ' + (y - 0.4) + ', 80 ' + (y - 0.4) + ', 48 ' + (y + 5.6) + ' Z" fill="' + C.blue + '"/>';
      sl += '<path d="M48 ' + (y + 2.7) + ' C 80 ' + (y - 3.3) + ', 128 ' + (y - 3.3) + ', 160 ' + (y + 2.7) + '" stroke="' + C.blueL + '" stroke-width="0.6" fill="none" opacity="0.55"/>' +
        '<path d="M48 ' + (y + 5) + ' C 80 ' + (y - 1) + ', 128 ' + (y - 1) + ', 160 ' + (y + 5) + '" stroke="' + C.blueS + '" stroke-width="0.6" fill="none" opacity="0.45"/>' +
        '<path d="M48 ' + (y + 7.4) + ' C 80 ' + (y + 1.4) + ', 128 ' + (y + 1.4) + ', 160 ' + (y + 7.4) + '" stroke="' + C.goldL + '" stroke-width="0.7" fill="none" opacity="0.6"/>' +
        '<path d="M48 ' + (y + 8.9) + ' C 80 ' + (y + 2.9) + ', 128 ' + (y + 2.9) + ', 160 ' + (y + 8.9) + '" stroke="' + C.goldS + '" stroke-width="0.5" fill="none" opacity="0.3"/>';
    }
    s += '<g clip-path="url(#' + id('nemes') + ')">' + st + sl +
      '<rect x="40" y="18" width="130" height="110" fill="url(#' + id('nsh') + ')"/>' +
      // pleat folds radiating from the crown
      '<path d="M104 21 C 98 44, 92 66, 90 92 M104 21 C 112 44, 118 66, 121 90 M96 22 C 84 40, 76 60, 72 82 M112 22 C 126 40, 134 58, 139 80 M88 26 C 76 40, 68 56, 66 74 M120 26 C 134 40, 142 56, 143 72" stroke="' + C.blueS + '" stroke-width="0.8" fill="none" opacity="0.2"/>' +
      '<path d="M100 21.5 C 93 44, 87 68, 85 94 M108 21.5 C 115 44, 120 68, 124 92 M70 100 C 68 108, 68 114, 70 119 M63 100 C 62 108, 62 114, 61 119 M140 100 C 142 108, 142 114, 143 119 M147 98 C 149 106, 149 112, 148 119" stroke="#fff" stroke-width="0.6" fill="none" opacity="0.28"/>' +
      '<path d="M62 96 C 61 106, 62 113, 64 119 M68 96 C 67 106, 68 113, 70 120 M136 100 C 138 108, 139 114, 138 120 M145 98 C 146 106, 146 112, 145 119" stroke="' + O + '" stroke-width="0.8" fill="none" opacity="0.3"/>' +
      // woven cloth texture
      '<rect x="40" y="18" width="130" height="110" fill="url(#' + id('weave') + ')" opacity="0.1"/>' +
      // dark tuck under the dome where the cloth is drawn tight
      '<path d="M64 76 C 60 92, 62 108, 68 120 L 60 120 C 54 106, 56 88, 64 74 Z" fill="#0a1a44" opacity="0.1"/>' +
      // cel shade on back half + dome highlight
      '<path d="M40 30 C 60 30, 70 60, 68 90 C 67 104, 72 114, 80 124 L 40 124 Z" fill="#000" opacity="0.1"/>' +
      '<path d="M142 60 C 150 80, 154 100, 152 124 L 160 124 L 160 50 Z" fill="#000" opacity="0.1"/>' +
      '<path d="M84 34 C 94 27, 112 25, 126 31" stroke="#fff" stroke-width="3.2" fill="none" opacity="0.35" stroke-linecap="round"/>' +
      // inner shadow where the cloth wraps behind the face
      '<path d="M68 76 C 66 90, 70 106, 80 115 L 88 115 C 78 104, 74 92, 76 78 Z" fill="' + C.blueS + '" opacity="0.55"/>' +
      '<path d="M134 74 C 138 90, 136 104, 128 115 L 136 115 C 142 104, 144 90, 140 72 Z" fill="' + C.blueS + '" opacity="0.4"/>' +
      '</g>';
    // nemes hem: tiny frayed threads + ambient occlusion where cloth meets neck
    s += '<path d="M60 119 l -0.6 2.6 M63 121 l -0.4 2.4 M67 121.6 l 0 2.4 M72 121 l 0.4 2.2 M131 116.4 l 0 2.2 M136 121 l 0.2 2.4 M141 121.8 l 0.4 2.4 M146 121 l 0.6 2.2 M150 119.6 l 0.8 2.2" stroke="' + O + '" stroke-width="0.7" stroke-linecap="round" opacity="0.8"/>';
    s += '<ellipse cx="102" cy="116" rx="22" ry="3.4" fill="url(#' + id('ao') + ')"/>';
    // gold earring peeking below the cloth
    s += '<path d="M76 104 L 76 108" stroke="' + O + '" stroke-width="1.2"/>';
    s += '<circle cx="76" cy="111.5" r="3.8" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="1.4"/>';
    s += '<circle cx="76" cy="111.5" r="1.7" fill="' + C.carn + '"/>';
    // face
    s += '<path d="' + FACE + '" fill="url(#' + id('face') + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<g clip-path="url(#' + id('face-c') + ')">' +
      '<path d="M74 84 C 76 104, 90 114, 108 114 C 94 110, 82 100, 80 82 Z" fill="' + C.skinS + '" opacity="0.5"/>' +
      '<path d="M70 58 C 90 70, 120 70, 140 58 L 140 72 C 120 78, 90 78, 70 72 Z" fill="' + C.skinD + '" opacity="0.35"/>' +
      '</g>';
    // blush
    s += '<ellipse cx="94" cy="100" rx="5.4" ry="2.8" fill="' + C.blush + '" opacity="0.45"/>';
    s += '<ellipse cx="127.5" cy="99" rx="4" ry="2.6" fill="' + C.blush + '" opacity="0.45"/>';
    // forehead band of the nemes (gold with lapis edge)
    s += '<path d="M72 74 C 80 60, 94 55.5, 106 55.5 C 120 55.5, 133 60, 139 72 L 137 77.5 C 128 67.5, 116 65, 106 65 C 94 65, 82 68, 74 79 Z" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>';
    s += '<path d="M75 76 C 83 66, 95 62.2, 106 62.2 C 117 62.2, 128 64.6, 136.6 74.6" stroke="' + C.blue + '" stroke-width="1.6" fill="none"/>';
    s += '<path d="M78 69 C 86 61, 96 58.4, 106 58.4 C 116 58.4, 126 60.6, 133 66" stroke="' + C.goldL + '" stroke-width="1" fill="none" opacity="0.9"/>';
    // eyebrows
    s += '<path d="M85.5 77.6 C 89 74, 95 73, 101 75.2" stroke="' + C.brow + '" stroke-width="2.8" fill="none" stroke-linecap="round"/>';
    s += '<path d="M112.5 75.2 C 118 72.8, 124 73.4, 129.5 77" stroke="' + C.brow + '" stroke-width="2.8" fill="none" stroke-linecap="round"/>';
    s += '<path d="M87 76.4 L 85.6 75.2 M89.6 74.6 L 88.6 73.2 M92.4 73.9 L 92 72.4 M95.4 73.8 L 95.6 72.4 M98.4 74.4 L 99 73.1 M114.5 74.4 L 114 73 M117.6 73.3 L 117.6 71.9 M120.8 73 L 121.4 71.7 M124 73.5 L 125 72.4 M127 74.9 L 128.2 74" stroke="' + C.brow + '" stroke-width="0.7" stroke-linecap="round"/>';
    s += '<path d="M88 75.6 C 91 73.8, 94 73.6, 97 74.2 M116 74 C 119 73.2, 122 73.4, 125 74.6" stroke="#5a3a24" stroke-width="0.6" fill="none" opacity="0.7" stroke-linecap="round"/>';
    // malachite eye shadow
    s += '<path d="M85 84 C 84 76, 90 73.4, 96 74.4 C 101 75.4, 103 79, 102 84 Z" fill="url(#' + id('eshadow') + ')"/>';
    s += '<path d="M112 84 C 111 78, 114 74.6, 120 74.2 C 126 74, 131 77, 131.4 82 L 130 84 Z" fill="url(#' + id('eshadow') + ')"/>';
    s += '<circle cx="90" cy="79.4" r="0.5" fill="' + C.goldL + '" opacity="0.9"/><circle cx="96.4" cy="78.4" r="0.4" fill="#fff" opacity="0.8"/><circle cx="118" cy="78.2" r="0.5" fill="' + C.goldL + '" opacity="0.9"/><circle cx="125" cy="79" r="0.4" fill="#fff" opacity="0.8"/>';
    // eyes
    s += '<g' + (anim ? ' class="part-eyes" style="transform-origin: 108px 89px"' : '') + '>' + eye(94, 89, -1, u) + eye(120, 89, 1, u) + '</g>';
    // nose
    s += '<path d="M113.5 94 C 115.8 97, 115.6 99.2, 112.6 99.8" stroke="' + C.skinD + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    s += '<path d="M114.4 95 C 115.4 96.6, 115.3 97.6, 114.6 98.4" stroke="#eab48a" stroke-width="0.9" fill="none" stroke-linecap="round"/>';
    s += '<path d="M107.6 84 C 108.6 88, 109.6 91, 110.4 94.4" stroke="' + C.skinS + '" stroke-width="0.9" fill="none" stroke-linecap="round" opacity="0.5"/>';
    s += '<path d="M109.6 84.6 C 110.4 88, 111 90.6, 111.6 93" stroke="#efbe90" stroke-width="0.9" fill="none" stroke-linecap="round" opacity="0.6"/>';
    s += '<ellipse cx="113.6" cy="97.6" rx="1.4" ry="0.8" fill="' + C.skinD + '" opacity="0.5"/>';
    s += '<path d="M110.6 100.4 C 109.6 101.6, 109.8 102.6, 110.6 103" stroke="' + C.skinS + '" stroke-width="0.8" fill="none" stroke-linecap="round" opacity="0.6"/>';
    s += '<path d="M79 90 C 79 98, 84 106, 92 110 M133 88 C 134 96, 130 104, 124 108" stroke="' + C.skinD + '" stroke-width="1" fill="none" opacity="0.25" stroke-linecap="round"/>';
    s += '<path d="M83 96 C 84 102, 88 106, 94 108" stroke="#f0c090" stroke-width="0.9" fill="none" opacity="0.4" stroke-linecap="round"/>';
    // mouth: calm confident smile
    s += '<path d="M105.5 104.2 C 109 107.8, 115 107.6, 118.4 103.4 C 116.6 108.8, 108.6 109.8, 105.5 104.2 Z" fill="' + C.lip + '" stroke="' + O + '" stroke-width="1.6" stroke-linejoin="round"/>';
    s += '<path d="M107.6 104.6 C 110 106, 114 105.8, 116.6 104.2 C 115 106.6, 109.6 107, 107.6 104.6 Z" fill="#fff8ea"/>';
    s += '<path d="M109.4 105.2 L 109.6 106.4 M111.6 105.5 L 111.7 106.8 M113.8 105.4 L 113.8 106.5" stroke="#d8cdb4" stroke-width="0.4"/>';
    s += '<path d="M108.4 106.8 C 110.6 108, 113.6 108, 115.4 106.6" stroke="#d06a6e" stroke-width="1" fill="none" stroke-linecap="round"/>';
    s += '<path d="M109.6 108.4 C 111.4 109, 113.4 108.8, 114.6 108" stroke="#f2a0a0" stroke-width="0.6" fill="none" stroke-linecap="round" opacity="0.8"/>';
    s += '<path d="M106.4 103.4 C 109 105.2, 113 105.2, 117 102.8" stroke="' + C.carnS + '" stroke-width="0.5" fill="none" opacity="0.7"/>';
    s += '<path d="M104.4 103.2 Q 105.2 104.6 106.6 104.2 M117.6 102.6 Q 119.2 102.8 119.6 101.4" stroke="' + O + '" stroke-width="1.1" fill="none" stroke-linecap="round"/>';
    s += '<path d="M112 111 Q 116 110.8 119 109" stroke="#e2a877" stroke-width="1.1" fill="none" stroke-linecap="round" opacity="0.8"/>';
    // uraeus: body snaking over the headcloth, rearing cobra at the brow
    s += '<path d="M108 56 C 104.5 50, 109.5 45, 105.5 39.5 C 103.5 37, 104.5 34.5, 107 33.5" stroke="' + O + '" stroke-width="4.4" fill="none" stroke-linecap="round"/>';
    s += '<path d="M108 56 C 104.5 50, 109.5 45, 105.5 39.5 C 103.5 37, 104.5 34.5, 107 33.5" stroke="' + C.gold + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    s += '<path d="M107.4 45.6 L 108.8 44.6 M105 38.6 L 106.4 37.6" stroke="' + C.goldS + '" stroke-width="0.8"/>';
    s += '<path d="M103.4 64 C 101.6 58.5, 103.4 53, 108 50.4 C 112.6 53, 114.4 58.5, 112.6 64 Z" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>';
    s += '<path d="M106 62.6 C 105.2 59, 106 56, 108 54.6 C 110 56, 110.8 59, 110 62.6 Z" fill="' + C.lapis + '"/>';
    s += '<path d="M108 55.6 L 108 62 M106.4 58 L 109.6 58" stroke="' + C.carn + '" stroke-width="0.9"/>';
    s += '<ellipse cx="108" cy="49.6" rx="2.6" ry="2.2" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="1.3"/>';
    s += '<circle cx="109" cy="49.2" r="0.6" fill="' + O + '"/>';
    s += '</g></g>';
    return s;
  }

  function shield(u) {
    var id = mk(u), s = '';
    var x = 54, y = 174;
    s += '<circle cx="' + x + '" cy="' + y + '" r="19" fill="url(#' + id('shield') + ')" stroke="' + O + '" stroke-width="3"/>';
    s += '<path d="M' + (x - 19) + ' ' + y + ' a 19 19 0 1 0 38 0 a 19 19 0 1 0 -38 0 Z M' + (x - 13.2) + ' ' + y + ' a 13.2 13.2 0 1 1 26.4 0 a 13.2 13.2 0 1 1 -26.4 0 Z" fill="url(#' + id('hammer') + ')" fill-rule="evenodd"/>';
    s += '<circle cx="' + x + '" cy="' + y + '" r="17.6" fill="none" stroke="' + C.brzL + '" stroke-width="0.7" opacity="0.8"/>';
    s += '<circle cx="' + x + '" cy="' + y + '" r="14.6" fill="none" stroke="' + C.brzD + '" stroke-width="0.7" opacity="0.7"/>';
    s += '<circle cx="' + x + '" cy="' + y + '" r="13.2" fill="url(#' + id('field') + ')" stroke="' + O + '" stroke-width="1.6"/>';
    var gl = ['eye', 'ankh', 'water', 'sun', 'hut', 'ankh', 'water', 'eye'];
    for (var gi = 0; gi < 8; gi++) {
      var ga = gi * 45 + 0.001, gr = ga * Math.PI / 180;
      s += '<g transform="rotate(' + (ga + 90) + ' ' + f(x + Math.cos(gr) * 16.1) + ' ' + f(y + Math.sin(gr) * 16.1) + ')">' + glyph(gl[gi], x + Math.cos(gr) * 16.1, y + Math.sin(gr) * 16.1, 0.78).replace(/stroke="#5e3310"/g, 'stroke="#4a2810"') + '</g>';
    }
    // painted lotus
    var l = '';
    l += '<path d="M' + x + ' 187.5 C 53 183, 53.5 180, ' + x + ' 178" stroke="' + C.leafS + '" stroke-width="1.6" fill="none"/>';
    l += '<path d="M46 186 C 44 182, 47 179, 51 181 C 51.5 184, 49.5 186.5, 46 186 Z M62 186 C 64 182, 61 179, 57 181 C 56.5 184, 58.5 186.5, 62 186 Z" fill="' + C.leaf + '" stroke="' + O + '" stroke-width="0.9"/>';
    // back petals
    l += '<path d="M' + x + ' 178.5 C 46 177, 42.5 171, 43.5 166 C 48 168, 51.5 172, ' + x + ' 178.5 Z M' + x + ' 178.5 C 62 177, 65.5 171, 64.5 166 C 60 168, 56.5 172, ' + x + ' 178.5 Z" fill="' + C.lotusL + '" stroke="' + O + '" stroke-width="1"/>';
    l += '<path d="M' + x + ' 178.5 C 49 175, 47.5 169, 49.5 163.5 C 52 167, 53.5 172, ' + x + ' 178.5 Z M' + x + ' 178.5 C 59 175, 60.5 169, 58.5 163.5 C 56 167, 54.5 172, ' + x + ' 178.5 Z" fill="' + C.lotus + '" stroke="' + O + '" stroke-width="1"/>';
    l += '<path d="M' + x + ' 178.5 C 51 174, 51 166, ' + x + ' 161 C 57 166, 57 174, ' + x + ' 178.5 Z" fill="' + C.lotusL + '" stroke="' + O + '" stroke-width="1"/>';
    l += '<path d="M' + x + ' 164 L ' + x + ' 176 M50.2 167.5 L 52.6 175.6 M57.8 167.5 L 55.4 175.6" stroke="#fff" stroke-width="0.6" opacity="0.8"/>';
    l += '<path d="M45.6 168 C 47 171, 49 174, 51 176.6 M62.4 168 C 61 171, 59 174, 57 176.6 M50.4 166.6 C 50.4 170, 51.4 173, 52.6 175 M57.6 166.6 C 57.6 170, 56.6 173, 55.4 175" stroke="' + C.blueS + '" stroke-width="0.45" opacity="0.7" fill="none"/>';
    l += '<path d="M' + x + ' 161.4 C 55 163, 55.6 165, 55.4 167" stroke="#fff" stroke-width="0.7" fill="none" opacity="0.9"/>';
    l += '<circle cx="' + x + '" cy="163" r="0.5" fill="' + C.gold + '"/><path d="M44 174 C 46 174, 48 174.4, 49.6 175.6 M64 174 C 62 174, 60 174.4, 58.4 175.6" stroke="' + C.lotus + '" stroke-width="0.6" fill="none"/>';
    l += '<path d="M47.4 183 L 46 185 M60.6 183 L 62 185 M' + x + ' 183.6 L ' + x + ' 187" stroke="' + C.leafS + '" stroke-width="0.5"/><path d="M44.4 168 C 40 166, 40 172, 42 176" stroke="' + C.turqS + '" stroke-width="0.6" fill="none" opacity="0.5"/>';
    l += '<path d="M49 179 C 52 180.6, 56 180.6, 59 179 L 58 181.4 C 55 182.6, 53 182.6, 50 181.4 Z" fill="' + C.gold + '" stroke="' + O + '" stroke-width="0.8"/>';
    // ring of dots
    for (var i = 0; i < 16; i++) {
      var a = i * Math.PI / 8;
      l += '<circle cx="' + f(x + Math.cos(a) * 11.4) + '" cy="' + f(y + Math.sin(a) * 11.4) + '" r="0.75" fill="' + C.carn + '"/>';
    }
    s += '<g clip-path="url(#' + id('field-c') + ')">' + l +
      '<path d="M40 174 C 42 186, 54 192, 68 186 L 68 192 L 40 192 Z" fill="#000" opacity="0.1"/></g>';
    // bronze rim details: rivets + engraved ring
    s += '<circle cx="' + x + '" cy="' + y + '" r="16.2" fill="none" stroke="' + C.brzS + '" stroke-width="0.9" stroke-dasharray="2 1.4"/>';
    for (var k = 0; k < 8; k++) {
      var b = k * Math.PI / 4 + Math.PI / 8;
      var rx = x + Math.cos(b) * 16.2, ry = y + Math.sin(b) * 16.2;
      s += '<circle cx="' + f(rx) + '" cy="' + f(ry) + '" r="1.4" fill="' + C.brzL + '" stroke="' + O + '" stroke-width="0.8"/>';
    }
    // wear: scratches, a dent and a chipped rim
    s += '<path d="M' + (x + 3) + ' ' + (y + 14.6) + ' l 4 -3 M' + (x + 4.4) + ' ' + (y + 15.6) + ' l 3 -2.4 M' + (x - 13) + ' ' + (y - 8) + ' l 3.4 2" stroke="' + C.brzL + '" stroke-width="0.6" stroke-linecap="round" opacity="0.9"/>';
    s += '<path d="M' + (x + 14.4) + ' ' + (y - 9.4) + ' C ' + (x + 16.6) + ' ' + (y - 8) + ', ' + (x + 17.6) + ' ' + (y - 5.4) + ', ' + (x + 17.2) + ' ' + (y - 3.6) + '" stroke="' + C.brzD + '" stroke-width="0.8" fill="none" opacity="0.8" stroke-linecap="round"/><path d="M' + (x + 15.8) + ' ' + (y - 7) + ' l 1 1.6" stroke="' + C.brzL + '" stroke-width="0.6" stroke-linecap="round"/>';
    s += '<path d="M' + (x - 5) + ' ' + (y + 18.4) + ' l 1.4 -1.4 M' + (x - 2.4) + ' ' + (y + 18.8) + ' l 1 -1.2" stroke="' + O + '" stroke-width="0.7" stroke-linecap="round" opacity="0.6"/>';
    // cel shade + shine
    s += '<path d="M' + (x - 19) + ' ' + y + ' C ' + (x - 17) + ' ' + (y + 12) + ', ' + (x - 6) + ' ' + (y + 19) + ', ' + (x + 6) + ' ' + (y + 18) + ' C ' + (x - 6) + ' ' + (y + 16.5) + ', ' + (x - 15) + ' ' + (y + 10) + ', ' + (x - 16.6) + ' ' + y + ' Z" fill="' + C.brzD + '" opacity="0.4"/>';
    s += '<path d="M' + (x - 9) + ' ' + (y - 15) + ' C ' + (x - 4) + ' ' + (y - 17.2) + ', ' + (x + 4) + ' ' + (y - 17.2) + ', ' + (x + 10) + ' ' + (y - 14) + '" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.75"/>';
    s += '<circle cx="' + x + '" cy="' + y + '" r="19" fill="none" stroke="' + O + '" stroke-width="3"/>';
    // fingers gripping the rim
    s += '<path d="M70 164.5 C 74 164, 75.5 167, 73.8 169.5 C 75.4 170.6, 75 173.6, 72.2 174 L 69 173 Z" fill="' + C.skin + '" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>';
    s += '<path d="M70.8 169.2 L 73.6 169.4" stroke="' + C.skinS + '" stroke-width="0.9"/>';
    s += '<path d="M70.6 165.6 C 72.4 165.4, 73.6 166, 73.8 167" stroke="' + C.skinL + '" stroke-width="0.7" fill="none" stroke-linecap="round"/><ellipse cx="72.4" cy="166.4" rx="0.6" ry="0.9" fill="#f5d8b8" opacity="0.8"/><ellipse cx="72" cy="172" rx="0.6" ry="0.8" fill="#f5d8b8" opacity="0.7"/>';
    s += '<path d="M72.6 167.6 L 73.4 167.6 M72.2 171.6 L 73 171.6" stroke="' + C.skinS + '" stroke-width="0.6"/>';
    return s;
  }

  function glyph(kind, x, y, sc) {
    var t = 'translate(' + f(x) + ' ' + f(y) + ') scale(' + sc + ')';
    var st = 'stroke="' + C.brzD + '" stroke-width="' + f(0.9 / sc) + '" fill="none" stroke-linecap="round"';
    if (kind === 'ankh') return '<g transform="' + t + '"><ellipse cx="0" cy="-1.6" rx="1" ry="1.3" ' + st + '/><path d="M-1.8 0 L 1.8 0 M0 0 L 0 3" ' + st + '/></g>';
    if (kind === 'eye') return '<g transform="' + t + '"><path d="M-2 0 C -1 -1.4, 1 -1.4, 2 0 C 1 1, -1 1, -2 0 Z M-0.2 0.6 L -0.6 2.4" ' + st + '/></g>';
    if (kind === 'water') return '<g transform="' + t + '"><path d="M-2 0 L -1 -1 L 0 0 L 1 -1 L 2 0" ' + st + '/></g>';
    if (kind === 'sun') return '<g transform="' + t + '"><circle cx="0" cy="0" r="1.3" ' + st + '/></g>';
    return '<g transform="' + t + '"><path d="M-1.4 -2 L -1.4 2 M1.4 -2 L 1.4 2 M-1.4 0 L 1.4 0" ' + st + '/></g>';
  }

  function khopesh(u) {
    var id = mk(u), s = '';
    s += '<path d="' + BLADE + '" fill="url(#' + id('brz') + ')" stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round"/>';
    s += '<g clip-path="url(#' + id('blade-c') + ')">' +
      // honed outer edge (lighter band) + inner shade
      '<path d="' + BO + '" stroke="' + C.brzL + '" stroke-width="4.4" fill="none"/>' +
      '<path d="' + BO + '" stroke="#fff" stroke-width="1.2" fill="none" opacity="0.5" transform="translate(1.4 0.8)"/>' +
      '<path d="' + BI + '" stroke="' + C.brzS + '" stroke-width="4" fill="none" opacity="0.75"/>' +
      '<path d="' + BO + '" stroke="url(#' + id('hammer') + ')" stroke-width="12" fill="none" opacity="0.9"/>' +
      '<path d="' + BI + '" stroke="' + C.brzD + '" stroke-width="0.7" fill="none" opacity="0.6" transform="translate(-0.8 0.2)"/>' +
      '<path d="' + BO + '" stroke="' + C.brzD + '" stroke-width="0.6" fill="none" opacity="0.5" transform="translate(-2.6 1.6)"/>' +
      '<path d="M-1.6 -12.5 L -1.6 -24 M1.6 -12.5 L 1.6 -24" stroke="' + C.brzD + '" stroke-width="0.5" opacity="0.6"/>' +
      '<path d="M4.4 -42 l 2.4 -1.2 M5.2 -50 l 2.6 -0.6 M8.6 -32 l 2 0.4 M14 -60 l 2.4 1.4 M-1.6 -30 l 2 -0.6" stroke="#fff" stroke-width="0.5" opacity="0.6"/>' +
      '<path d="M44.4 -66.4 l 1.4 1 M40.6 -71.4 l 1.6 0.8 M19.6 -80.4 l 0.6 1.4 M21.6 -81 l 0.8 1.2" stroke="' + O + '" stroke-width="0.9" stroke-linecap="round"/>' +
      // engraved central line + hieroglyphs
      '<path d="M0 -12 L 0 -26 C -2 -38, -2 -50, 2 -60 C 8 -72, 22 -77, 34 -73 C 38 -71.5, 41 -69, 43 -66" stroke="' + C.brzD + '" stroke-width="0.7" fill="none" opacity="0.8"/>' +
      glyph('ankh', 0, -17, 0.9) + glyph('eye', 0, -22.5, 0.85) + glyph('water', 1.4, -34, 0.9) + glyph('sun', 1.2, -42, 0.9) +
      glyph('ankh', 2, -51, 0.9) + glyph('eye', 5.4, -61, 0.9) + glyph('water', 11, -68.4, 0.9) + glyph('hut', 17.6, -72.4, 0.8) + glyph('sun', 25, -74, 0.9) + glyph('water', 32, -73.4, 0.9) + glyph('ankh', 38.4, -70.2, 0.8) +
      // shine highlights
      '<path d="M-4.4 -40 C -4.8 -52, -2 -62, 3 -70" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.95"/>' +
      '<path d="M12 -79.4 C 19 -82, 27 -82, 33 -79.2" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity="0.85"/>' +
      '<path d="M-1.4 -12 L -1.4 -26" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity="0.6"/>' +
      '</g>';
    s += '<path d="' + BLADE + '" fill="none" stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round"/>';
    s += sparkle(-4.6, -60, 3.2, '#fff');
    s += sparkle(30, -80.4, 2.2, '#fff', 0.9);
    // spine bevel line following the outer edge
    s += '<path d="M-1.6 -26 C -4.6 -38, -5.4 -52, -1 -63 C 5 -76, 21 -82, 33 -76.6" stroke="' + C.brzL + '" stroke-width="0.6" fill="none" opacity="0.9"/>';
    // guard
    s += '<path d="M-5.5 -11 L 5.5 -11 L 4.4 -6.4 L -4.4 -6.4 Z" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>';
    s += '<path d="M-5.5 -11 L 5.5 -11" stroke="' + C.goldL + '" stroke-width="0.7"/><path d="M-3.4 -9.2 L 3.4 -9.2" stroke="' + C.goldS + '" stroke-width="0.5"/>';
    s += '<circle cx="0" cy="-8.7" r="1.2" fill="' + C.lapis + '"/><circle cx="-0.4" cy="-9.1" r="0.35" fill="#fff"/><circle cx="-3.6" cy="-8.8" r="0.6" fill="' + C.carn + '"/><circle cx="3.6" cy="-8.8" r="0.6" fill="' + C.carn + '"/>';
    // wrapped grip
    s += '<rect x="-3.3" y="-7" width="6.6" height="21" rx="1.6" fill="' + C.blueS + '" stroke="' + O + '" stroke-width="2"/>';
    var w = '';
    for (var y = -5.5; y < 13; y += 2.6) w += 'M-3.2 ' + f(y + 1.8) + ' L 3.2 ' + f(y) + ' ';
    s += '<path d="' + w + '" stroke="' + C.gold + '" stroke-width="1" fill="none"/>';
    s += '<path d="M-1.8 -5 L -1.8 12" stroke="' + C.blueL + '" stroke-width="0.8" opacity="0.6"/>';
    s += '<path d="M2 -5.2 L 2 12.4" stroke="#000" stroke-width="0.8" opacity="0.25"/>';
    s += '<path d="M-3.3 3.6 L 3.3 3.6 M-3.3 4.4 L 3.3 4.4" stroke="' + C.goldS + '" stroke-width="0.4"/>';
    s += '<path d="M-3.4 -7.2 L 3.4 -7.2 M-3.4 13 L 3.4 13" stroke="' + C.goldL + '" stroke-width="1.1"/>';
    s += '<path d="M-1 -2.6 l 0.8 -0.2 M0.2 2.4 l 0.9 -0.2 M-0.6 7 l 0.9 -0.2" stroke="#fff" stroke-width="0.4" opacity="0.6"/>';
    s += '<path d="M2.6 8.4 C 4.4 9.4, 4.8 11.4, 3.6 13.4" stroke="' + C.gold + '" stroke-width="0.7" fill="none"/>';
    // pommel
    s += '<path d="M-4.6 13 L 4.6 13 C 5.6 16, 3.6 19, 0 19 C -3.6 19, -5.6 16, -4.6 13 Z" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>';
    // falcon head crest on the pommel
    s += '<path d="M-3.4 16.6 C -4.2 14.4, -2.6 13, -0.6 13.2 C 1.8 13.2, 3.4 14.6, 3.4 16.6 C 3.8 18, 2.4 19.2, 0.4 19.6 L 1.6 21.4 C -0.6 21.4, -2.6 20.4, -3.4 16.6 Z" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="1.1" stroke-linejoin="round"/>';
    s += '<path d="M0.6 19.4 C 2.2 19.6, 2.6 20.8, 1.8 21.6" stroke="' + O + '" stroke-width="0.7" fill="none"/>';
    s += '<circle cx="0.8" cy="16" r="1.05" fill="' + C.carn + '" stroke="' + O + '" stroke-width="0.5"/><circle cx="0.5" cy="15.7" r="0.35" fill="#fff"/>';
    s += '<path d="M1.6 16.8 C 2 18, 1.6 18.8, 1 19.4 M-1.8 14.4 C -0.6 14, 0.8 14.2, 1.6 14.8" stroke="' + C.lapis + '" stroke-width="0.6" fill="none" stroke-linecap="round"/>';
    s += '<path d="M-2.4 15.4 l 0.6 0.6 M-2.6 17 l 0.6 0.6" stroke="' + C.goldS + '" stroke-width="0.5"/>';
    return s;
  }

  function weaponArm(u, anim) {
    var id = mk(u), s = '<g' + (anim ? ' class="part-weapon" style="transform-origin: 114px 128px"' : '') + '>';
    s += '<g transform="translate(135.5 166.5) rotate(5) scale(1.1)">' + khopesh(u) + '</g>';
    s += '<path d="' + ARMW + '" fill="url(#' + id('skin') + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<g clip-path="url(#' + id('armw-c') + ')"><path d="M103 138 C 108 148, 118 158, 130 170 L 124 174 Z" fill="' + C.skinS + '" opacity="0.5"/>' +
      '<path d="M114 126 C 120 127, 125 132, 128 138" stroke="' + C.skinL + '" stroke-width="2" fill="none" opacity="0.7" stroke-linecap="round"/></g>';
    // upper-arm cuff (lapis inlay)
    s += '<path d="M111.5 140 C 116 139, 121.5 136.6, 125 133 L 128 139 C 124.5 142.6, 119 145.4, 114.5 146.4 Z" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>';
    s += '<path d="M113 143.4 C 117.4 142.4, 122.4 140, 126.4 136.2" stroke="' + C.lapis + '" stroke-width="1.6" fill="none"/>';
    s += '<circle cx="119.8" cy="140.6" r="1.4" fill="' + C.carn + '" stroke="' + O + '" stroke-width="0.6"/><circle cx="119.4" cy="140.2" r="0.4" fill="#fff"/>';
    s += '<path d="M112.6 141.4 C 117 140.4, 122 138, 125.6 134.6" stroke="' + C.goldL + '" stroke-width="0.7" fill="none"/>';
    s += dia(115.6, 143.2, 0.9, C.turq) + dia(123.4, 138.4, 0.9, C.turq);
    s += '<g clip-path="url(#' + id('armw-c') + ')"><ellipse cx="114" cy="148" rx="7" ry="2.6" fill="url(#' + id('ao') + ')" transform="rotate(35 114 148)"/><ellipse cx="128" cy="152" rx="6" ry="2.2" fill="url(#' + id('ao') + ')" transform="rotate(-25 128 152)"/>' +
      '<path d="M112 150 C 116 153, 119 156, 121 158" stroke="' + C.skinS + '" stroke-width="0.9" fill="none" opacity="0.6" stroke-linecap="round"/>' +
      '<path d="M133 142 C 135 148, 136 152, 137 156" stroke="#e5a878" stroke-width="1" fill="none" opacity="0.5" stroke-linecap="round"/></g>';
    // wrist cuff (broad, striped)
    s += '<path d="M124.5 157.5 L 135.5 152 L 139.4 160.2 L 128.4 165.6 Z" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>';
    s += '<path d="M125.9 160.4 L 136.9 155 M127.1 163 L 138.1 157.6" stroke="' + C.blue + '" stroke-width="1.1"/>';
    s += '<path d="M125 158.4 L 135.6 153.2 M128 164.6 L 138.8 159.4" stroke="' + C.goldL + '" stroke-width="0.6"/>';
    s += dia(127.4, 158.6, 0.8, C.carn) + dia(131.4, 156.6, 0.8, C.carn) + dia(135.2, 154.8, 0.8, C.carn);
    s += rivet(126.4, 162.2, 0.8) + rivet(137.6, 156.8, 0.8);
    // fist
    s += '<ellipse cx="135.5" cy="167.5" rx="6.6" ry="6" fill="url(#' + id('skin') + ')" stroke="' + O + '" stroke-width="2.4"/>';
    s += '<ellipse cx="134" cy="165" rx="3" ry="1.8" fill="' + C.skinL + '" opacity="0.5" transform="rotate(-30 134 165)"/>';
    s += '<path d="M140 164.6 l 1 0.4 M140.6 168 l 1 0.6 M139.2 171 l 0.8 0.8" stroke="' + C.skinL + '" stroke-width="0.8" stroke-linecap="round"/>';
    s += '<path d="M137.5 162.5 C 140.5 163.5, 141.5 165.5, 140.5 168.5 M139 166 C 141.5 167.5, 141.5 169.5, 139.5 171.5 M135.5 162.5 C 132.5 164.5, 131.5 168.5, 133.5 171.5" stroke="' + C.skinS + '" stroke-width="1.1" fill="none" stroke-linecap="round"/>';
    s += '</g>';
    return s;
  }

  function body(u, anim) {
    return backArm(u) +
      '<g' + (anim ? ' class="part-cape" style="transform-origin: 96px 162px"' : '') + '>' + skirt(u) + '</g>' +
      torso(u) + collar(u) + scarab(u) + head(u, anim) + shield(u) + weaponArm(u, anim) +
      '<g' + (anim ? ' class="part-cape" style="transform-origin: 96px 108px"' : '') + '>' + lappets(u) + '</g>';
  }

  function hero(u) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240">' + defs(u) +
      sands() + shadow(true) + legs(u) +
      '<g class="part-body">' + body(u, true) + '</g>' +
      '</svg>';
  }

  function portrait(u) {
    var id = mk(u);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' + defs(u) +
      '<g clip-path="url(#' + id('pclip') + ')">' +
      '<rect x="0" y="0" width="120" height="120" fill="url(#' + id('pbg') + ')"/>' +
      '<g fill="#ffffff" opacity="0.16"><path d="M60 52 L 20 0 L 38 0 Z M60 52 L 70 0 L 88 0 Z M60 52 L 120 14 L 120 34 Z M60 52 L 0 30 L 0 50 Z M60 52 L 120 60 L 120 78 Z"/></g>' +
      '<path d="M-4 104 L 22 78 L 48 104 Z M70 104 L 102 70 L 134 104 Z" fill="#e9c77a" opacity="0.55"/>' +
      '<path d="M-4 104 L 22 78 L 22 104 Z M70 104 L 102 70 L 102 104 Z" fill="#c9a054" opacity="0.5"/>' +
      '<rect x="0" y="100" width="120" height="20" fill="#e2bd72" opacity="0.7"/>' +
      sparkle(16, 22, 3, '#fff3c4') + sparkle(104, 18, 2.4, '#fff3c4') +
      '<g transform="translate(-15 2) scale(0.72)">' + backArm(u) + torso(u) + collar(u) + scarab(u) + head(u, false) + lappets(u) + '</g>' +
      '</g>' +
      '<rect x="1.5" y="1.5" width="117" height="117" rx="13" fill="none" stroke="' + O + '" stroke-width="3"/>' +
      '</svg>';
  }

  window.HEROES = window.HEROES || {};
  window.HEROES.egyptian = {
    key: 'egyptian', name: 'Neferu', title: 'The Desert Guardian',
    lore: 'A Medjay sworn to guard the tombs of the Two Lands, Neferu walks where the dunes whisper. Those who cross her feel the desert\'s old curse sap the strength from their arms.',
    color: '#1f6f8b',
    base: { hp: 530, atk: 98, def: 24 },
    fx: { slash: '#5fe0ff', glow: '#e3fbff' },
    signature: { name: 'Curse of the Sands', desc: 'At the start of every battle, all enemies lose 25% ATK.', type: 'curse' },
    svg: function (uid) { return hero(uid == null ? '0' : String(uid)); },
    portrait: function (uid) { return portrait('p' + (uid == null ? '' : String(uid))); }
  };
})();

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
    kohl: '#15100c', brow: '#1f140e', mal: '#1fa38c',
    blue: '#2456a6', blueS: '#173a78', blueL: '#5b8fdc',
    gold: '#f5c542', goldS: '#c98f1c', goldL: '#fff1a8',
    lapis: '#2a4fb0', lapisL: '#6f95ea', turq: '#2fc2b8', turqS: '#17857e', turqL: '#a6f1ea',
    carn: '#d2452b', carnS: '#8e2419', carnL: '#f07b5e',
    lin: '#fbf6ea', linS: '#ddd3bb', pleat: '#c7bb9e',
    lea: '#8a5a2b', leaS: '#5e3a1a', leaL: '#b8834a',
    brz: '#d4903a', brzS: '#8c4f1c', brzL: '#ffe2a8', brzD: '#5e3310',
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
  var BO = 'M-2.8 -30 C -10 -40, -12 -58, -4 -72 C 4 -84, 22 -88, 32 -78 C 38 -72, 38 -62, 33 -54 L 31 -49';
  var BI = 'M31 -49 C 29 -58, 26 -66, 20 -69 C 12 -72, 5 -66, 4 -57 C 3 -48, 3.5 -40, 2.8 -30 L 2.8 -9';
  var BLADE = 'M-2.8 -9 L -2.8 -30 C -10 -40, -12 -58, -4 -72 C 4 -84, 22 -88, 32 -78 C 38 -72, 38 -62, 33 -54 L 31 -49 C 29 -58, 26 -66, 20 -69 C 12 -72, 5 -66, 4 -57 C 3 -48, 3.5 -40, 2.8 -30 L 2.8 -9 Z';
  var LAPL = 'M62 108 L 75 108 L 76 147 C 72 150, 66 150, 62.5 147 Z';
  var LAPR = 'M117 108 L 130 108 L 129.5 147 C 126 150, 120 150, 116 147 Z';

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
      '<circle cx="36" cy="96" r="1.2" fill="#e9c77a" opacity="0.8"/><circle cx="170" cy="118" r="1.1" fill="#e9c77a" opacity="0.8"/><circle cx="30" cy="206" r="1.3" fill="#e9c77a" opacity="0.7"/><circle cx="148" cy="30" r="1" fill="#f7dc9a" opacity="0.8"/>' +
      '</g>';
  }

  function legs(u) {
    var id = mk(u), s = '';
    s += '<path d="' + LEGL + '" fill="url(#' + id('skin') + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<path d="' + LEGR + '" fill="url(#' + id('skin') + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<path d="M83 200 L 84 220 M101 200 L 102 220" stroke="' + C.skinS + '" stroke-width="2.4" opacity="0.5"/>';
    s += '<path d="M90 202 L 90 212 M108 202 L 108 212" stroke="' + C.skinL + '" stroke-width="1.2" opacity="0.7" stroke-linecap="round"/>';
    function sandal(x) {
      var r = '';
      // foot
      r += '<path d="M' + (x + 1) + ' 218 L ' + (x + 12) + ' 218.5 C ' + (x + 17) + ' 219.5, ' + (x + 19.5) + ' 222, ' + (x + 19.5) + ' 225 L ' + (x + 1) + ' 225 Z" fill="' + C.skin + '" stroke="' + O + '" stroke-width="2.2" stroke-linejoin="round"/>';
      r += '<path d="M' + (x + 16.5) + ' 222 L ' + (x + 16.5) + ' 224.6 M' + (x + 14) + ' 221.2 L ' + (x + 14) + ' 224.6" stroke="' + C.skinS + '" stroke-width="0.8"/>';
      // sole
      r += '<path d="M' + (x - 2) + ' 224.3 L ' + (x + 18) + ' 224.3 C ' + (x + 22.5) + ' 224.3, ' + (x + 23) + ' 228.6, ' + (x + 19) + ' 229 L ' + (x - 1.5) + ' 229 C ' + (x - 3.6) + ' 229, ' + (x - 3.6) + ' 224.3, ' + (x - 2) + ' 224.3 Z" fill="' + C.leaS + '" stroke="' + O + '" stroke-width="2.2" stroke-linejoin="round"/>';
      r += '<path d="M' + (x) + ' 226.5 L ' + (x + 19) + ' 226.5" stroke="' + C.leaL + '" stroke-width="0.8" stroke-dasharray="1.5 1" opacity="0.8"/>';
      // toe thong + instep strap
      r += '<path d="M' + (x + 15) + ' 224.5 C ' + (x + 13) + ' 222, ' + (x + 10) + ' 220, ' + (x + 7) + ' 219.2" stroke="' + O + '" stroke-width="3" fill="none" stroke-linecap="round"/>';
      r += '<path d="M' + (x + 15) + ' 224.5 C ' + (x + 13) + ' 222, ' + (x + 10) + ' 220, ' + (x + 7) + ' 219.2" stroke="' + C.lea + '" stroke-width="1.7" fill="none" stroke-linecap="round"/>';
      r += '<path d="M' + (x + 2) + ' 224.5 C ' + (x + 3) + ' 220, ' + (x + 9) + ' 218.5, ' + (x + 12) + ' 224.5" stroke="' + O + '" stroke-width="3.4" fill="none" stroke-linecap="round"/>';
      r += '<path d="M' + (x + 2) + ' 224.5 C ' + (x + 3) + ' 220, ' + (x + 9) + ' 218.5, ' + (x + 12) + ' 224.5" stroke="' + C.lea + '" stroke-width="2" fill="none" stroke-linecap="round"/>';
      r += '<circle cx="' + (x + 7) + '" cy="219.6" r="1.3" fill="' + C.gold + '" stroke="' + O + '" stroke-width="0.7"/>';
      // gold anklet
      r += '<path d="M' + (x - 0.5) + ' 212 C ' + (x + 4) + ' 214.5, ' + (x + 9) + ' 214.5, ' + (x + 12.5) + ' 212 L ' + (x + 12.5) + ' 215.5 C ' + (x + 9) + ' 218, ' + (x + 4) + ' 218, ' + (x - 0.5) + ' 215.5 Z" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="1.6" stroke-linejoin="round"/>';
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
    return s;
  }

  function skirt(u) {
    var id = mk(u), s = '';
    s += '<path d="' + SKIRT + '" fill="url(#' + id('lin') + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
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
      '</g>';
    s += '<path d="' + SKIRT + '" fill="none" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
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
    // hanging apron
    s += '<path d="M87 166 L 105 166 L 107.5 207 C 101 209.5, 91 209.5, 84.5 207 Z" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>';
    s += '<path d="M89.5 169 L 102.5 169 L 104.6 203 C 99 205, 93 205, 87.4 203 Z" fill="' + C.blue + '" stroke="' + O + '" stroke-width="1.1" stroke-linejoin="round"/>';
    // vertical stripes of the apron
    s += '<path d="M92.8 174 L 91.8 203.8 M96 174 L 96 204.4 M99.2 174 L 100.2 203.8" stroke="' + C.gold + '" stroke-width="1.1"/>';
    s += '<path d="M94.4 174 L 93.9 204.2 M97.6 174 L 98.1 204.2" stroke="' + C.carn + '" stroke-width="1"/>';
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
    s += '<path d="' + ann(10.5, 31) + '" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="2.4" stroke-linejoin="round"/>';
    // band 1: lapis round beads
    n = 13;
    for (i = 0; i < n; i++) {
      a = (i + 0.5) / n * Math.PI; p = pt(15.2, a);
      s += '<circle cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="2.3" fill="url(#' + id('lapis') + ')" stroke="' + O + '" stroke-width="0.8"/>';
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
    return s;
  }

  function lappets(u) {
    var id = mk(u), s = '';
    s += '<path d="' + LAPL + ' ' + LAPR + '" fill="' + C.gold + '" stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round"/>';
    var st = '';
    for (var y = 110; y < 150; y += 6) {
      st += '<path d="M60 ' + y + ' L 130 ' + (y + 1.5) + ' L 130 ' + (y + 3.2) + ' L 60 ' + (y + 1.7) + ' Z" fill="' + C.blue + '"/>';
    }
    s += '<g clip-path="url(#' + id('lap-c') + ')">' + st +
      '<rect x="62" y="106" width="3.5" height="50" fill="#000" opacity="0.14"/><rect x="116" y="106" width="3" height="50" fill="#000" opacity="0.14"/>' +
      '<path d="M73 110 L 74 145 M127.5 110 L 127.2 145" stroke="' + C.goldL + '" stroke-width="1.2" opacity="0.7"/>' +
      // gold end bands
      '<path d="M60 142 L 132 143.5 L 132 160 L 60 160 Z" fill="url(#' + id('gold') + ')"/>' +
      '<path d="M60 142 L 132 143.5" stroke="' + O + '" stroke-width="1.3"/>' +
      '</g>';
    s += '<path d="' + LAPL + ' ' + LAPR + '" fill="none" stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round"/>';
    return s;
  }

  function eye(x, y, dir, u) {
    var id = mk(u);
    function P(dx, dy) { return f(x + dir * dx) + ' ' + f(y + dy); }
    var s = '';
    s += '<ellipse cx="' + x + '" cy="' + y + '" rx="5.9" ry="7.4" fill="#fff" stroke="' + O + '" stroke-width="1.4"/>';
    s += '<ellipse cx="' + f(x + 0.9) + '" cy="' + f(y + 0.6) + '" rx="4.7" ry="6.5" fill="url(#' + id('iris') + ')"/>';
    s += '<ellipse cx="' + f(x + 1.1) + '" cy="' + f(y + 1) + '" rx="2.2" ry="3.1" fill="#0d0604"/>';
    s += '<path d="M' + f(x - 2.4) + ' ' + f(y + 4.6) + ' Q ' + f(x + 0.9) + ' ' + f(y + 6.8) + ' ' + f(x + 4.4) + ' ' + f(y + 4) + '" stroke="#e0a14e" stroke-width="1" fill="none" opacity="0.9"/>';
    s += '<circle cx="' + f(x + 2.8) + '" cy="' + f(y - 2.6) + '" r="2.2" fill="#fff"/>';
    s += '<circle cx="' + f(x - 1.4) + '" cy="' + f(y + 3.2) + '" r="1" fill="#fff"/>';
    s += '<circle cx="' + f(x + 0.4) + '" cy="' + f(y - 4.2) + '" r="0.55" fill="#fff" opacity="0.9"/>';
    // bold kohl upper lid sweeping into a wing
    s += '<path d="M' + P(-6.8, -2.4) + ' C ' + P(-4.5, -9.6) + ', ' + P(4.5, -10) + ', ' + P(7, -4.2) + ' L ' + P(12.8, -7.6) + ' L ' + P(8.2, -0.8) + ' C ' + P(6.8, -5.4) + ', ' + P(3.5, -7.8) + ', ' + P(0, -7.8) + ' C ' + P(-3.8, -7.8) + ', ' + P(-5.6, -5.4) + ', ' + P(-6.8, -2.4) + ' Z" fill="' + C.kohl + '" stroke="' + C.kohl + '" stroke-width="0.8" stroke-linejoin="round"/>';
    // inner corner tick
    s += '<path d="M' + P(-6.4, -2) + ' L ' + P(-8.4, 0.2) + '" stroke="' + C.kohl + '" stroke-width="1.5" stroke-linecap="round"/>';
    // lower kohl line running parallel to the wing
    s += '<path d="M' + P(-4.6, 6) + ' C ' + P(-1, 8.4) + ', ' + P(4.4, 7.4) + ', ' + P(6.4, 3.4) + ' L ' + P(11, -1.8) + '" stroke="' + C.kohl + '" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    return s;
  }

  function head(u, anim) {
    var id = mk(u), s = '<g' + (anim ? ' class="part-head" style="transform-origin: 100px 110px"' : '') + '>';
    // nemes headcloth mass
    s += '<path d="' + NEMES + '" fill="' + C.gold + '" stroke="' + O + '" stroke-width="3.2" stroke-linejoin="round"/>';
    var st = '';
    for (var y = 24; y < 124; y += 7) {
      st += '<path d="M48 ' + (y + 2) + ' C 80 ' + (y - 4) + ', 128 ' + (y - 4) + ', 160 ' + (y + 2) + ' L 160 ' + (y + 5.6) + ' C 128 ' + (y - 0.4) + ', 80 ' + (y - 0.4) + ', 48 ' + (y + 5.6) + ' Z" fill="' + C.blue + '"/>';
    }
    s += '<g clip-path="url(#' + id('nemes') + ')">' + st +
      // cel shade on back half + dome highlight
      '<path d="M40 30 C 60 30, 70 60, 68 90 C 67 104, 72 114, 80 124 L 40 124 Z" fill="#000" opacity="0.16"/>' +
      '<path d="M142 60 C 150 80, 154 100, 152 124 L 160 124 L 160 50 Z" fill="#000" opacity="0.1"/>' +
      '<path d="M84 34 C 94 27, 112 25, 126 31" stroke="#fff" stroke-width="3.2" fill="none" opacity="0.35" stroke-linecap="round"/>' +
      // inner shadow where the cloth wraps behind the face
      '<path d="M68 76 C 66 90, 70 106, 80 115 L 88 115 C 78 104, 74 92, 76 78 Z" fill="' + C.blueS + '" opacity="0.55"/>' +
      '<path d="M134 74 C 138 90, 136 104, 128 115 L 136 115 C 142 104, 144 90, 140 72 Z" fill="' + C.blueS + '" opacity="0.4"/>' +
      '</g>';
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
    // malachite eye shadow
    s += '<ellipse cx="94" cy="81" rx="7" ry="3" fill="' + C.mal + '" opacity="0.45"/>';
    s += '<ellipse cx="121" cy="81" rx="6.4" ry="3" fill="' + C.mal + '" opacity="0.45"/>';
    // eyes
    s += '<g' + (anim ? ' class="part-eyes" style="transform-origin: 108px 89px"' : '') + '>' + eye(94, 89, -1, u) + eye(120, 89, 1, u) + '</g>';
    // nose
    s += '<path d="M113.5 94 C 115.8 97, 115.6 99.2, 112.6 99.8" stroke="' + C.skinD + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    s += '<path d="M114.4 95 C 115.4 96.6, 115.3 97.6, 114.6 98.4" stroke="#eab48a" stroke-width="0.9" fill="none" stroke-linecap="round"/>';
    // mouth: calm confident smile
    s += '<path d="M105.5 104.2 C 109 107.8, 115 107.6, 118.4 103.4 C 116.6 108.8, 108.6 109.8, 105.5 104.2 Z" fill="' + C.lip + '" stroke="' + O + '" stroke-width="1.6" stroke-linejoin="round"/>';
    s += '<path d="M108.4 106.8 C 110.6 108, 113.6 108, 115.4 106.6" stroke="#d06a6e" stroke-width="1" fill="none" stroke-linecap="round"/>';
    s += '<path d="M104.4 103.2 Q 105.2 104.6 106.6 104.2 M117.6 102.6 Q 119.2 102.8 119.6 101.4" stroke="' + O + '" stroke-width="1.1" fill="none" stroke-linecap="round"/>';
    s += '<path d="M112 111 Q 116 110.8 119 109" stroke="#e2a877" stroke-width="1.1" fill="none" stroke-linecap="round" opacity="0.8"/>';
    // uraeus: body snaking over the headcloth, rearing cobra at the brow
    s += '<path d="M108 58 C 104 50, 110 44, 104 36 C 101 32, 103 28, 106 26" stroke="' + O + '" stroke-width="4.4" fill="none" stroke-linecap="round"/>';
    s += '<path d="M108 58 C 104 50, 110 44, 104 36 C 101 32, 103 28, 106 26" stroke="' + C.gold + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    s += '<path d="M107.2 52 L 108.6 50.6 M106.4 42 L 108 40.6 M103 34 L 104.4 32.8" stroke="' + C.goldS + '" stroke-width="0.8"/>';
    s += '<path d="M103.4 64 C 101.6 58.5, 103.4 53, 108 50.4 C 112.6 53, 114.4 58.5, 112.6 64 Z" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>';
    s += '<path d="M106 62.6 C 105.2 59, 106 56, 108 54.6 C 110 56, 110.8 59, 110 62.6 Z" fill="' + C.lapis + '"/>';
    s += '<path d="M108 55.6 L 108 62 M106.4 58 L 109.6 58" stroke="' + C.carn + '" stroke-width="0.9"/>';
    s += '<ellipse cx="108" cy="49.6" rx="2.6" ry="2.2" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="1.3"/>';
    s += '<circle cx="109" cy="49.2" r="0.6" fill="' + O + '"/>';
    s += '</g>';
    return s;
  }

  function shield(u) {
    var id = mk(u), s = '';
    var x = 54, y = 174;
    s += '<circle cx="' + x + '" cy="' + y + '" r="19" fill="url(#' + id('shield') + ')" stroke="' + O + '" stroke-width="3"/>';
    s += '<circle cx="' + x + '" cy="' + y + '" r="13.2" fill="url(#' + id('field') + ')" stroke="' + O + '" stroke-width="1.6"/>';
    // painted lotus
    var l = '';
    l += '<path d="M' + x + ' 187.5 C 53 183, 53.5 180, ' + x + ' 178" stroke="' + C.leafS + '" stroke-width="1.6" fill="none"/>';
    l += '<path d="M46 186 C 44 182, 47 179, 51 181 C 51.5 184, 49.5 186.5, 46 186 Z M62 186 C 64 182, 61 179, 57 181 C 56.5 184, 58.5 186.5, 62 186 Z" fill="' + C.leaf + '" stroke="' + O + '" stroke-width="0.9"/>';
    // back petals
    l += '<path d="M' + x + ' 178.5 C 46 177, 42.5 171, 43.5 166 C 48 168, 51.5 172, ' + x + ' 178.5 Z M' + x + ' 178.5 C 62 177, 65.5 171, 64.5 166 C 60 168, 56.5 172, ' + x + ' 178.5 Z" fill="' + C.lotusL + '" stroke="' + O + '" stroke-width="1"/>';
    l += '<path d="M' + x + ' 178.5 C 49 175, 47.5 169, 49.5 163.5 C 52 167, 53.5 172, ' + x + ' 178.5 Z M' + x + ' 178.5 C 59 175, 60.5 169, 58.5 163.5 C 56 167, 54.5 172, ' + x + ' 178.5 Z" fill="' + C.lotus + '" stroke="' + O + '" stroke-width="1"/>';
    l += '<path d="M' + x + ' 178.5 C 51 174, 51 166, ' + x + ' 161 C 57 166, 57 174, ' + x + ' 178.5 Z" fill="' + C.lotusL + '" stroke="' + O + '" stroke-width="1"/>';
    l += '<path d="M' + x + ' 164 L ' + x + ' 176 M50.2 167.5 L 52.6 175.6 M57.8 167.5 L 55.4 175.6" stroke="#fff" stroke-width="0.6" opacity="0.8"/>';
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
    // cel shade + shine
    s += '<path d="M' + (x - 19) + ' ' + y + ' C ' + (x - 17) + ' ' + (y + 12) + ', ' + (x - 6) + ' ' + (y + 19) + ', ' + (x + 6) + ' ' + (y + 18) + ' C ' + (x - 6) + ' ' + (y + 16.5) + ', ' + (x - 15) + ' ' + (y + 10) + ', ' + (x - 16.6) + ' ' + y + ' Z" fill="' + C.brzD + '" opacity="0.4"/>';
    s += '<path d="M' + (x - 9) + ' ' + (y - 15) + ' C ' + (x - 4) + ' ' + (y - 17.2) + ', ' + (x + 4) + ' ' + (y - 17.2) + ', ' + (x + 10) + ' ' + (y - 14) + '" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.75"/>';
    s += '<circle cx="' + x + '" cy="' + y + '" r="19" fill="none" stroke="' + O + '" stroke-width="3"/>';
    // fingers gripping the rim
    s += '<path d="M70 164.5 C 74 164, 75.5 167, 73.8 169.5 C 75.4 170.6, 75 173.6, 72.2 174 L 69 173 Z" fill="' + C.skin + '" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>';
    s += '<path d="M70.8 169.2 L 73.6 169.4" stroke="' + C.skinS + '" stroke-width="0.9"/>';
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
      '<path d="' + BO + '" stroke="' + C.brzL + '" stroke-width="6" fill="none"/>' +
      '<path d="' + BO + '" stroke="#fff" stroke-width="1.2" fill="none" opacity="0.5" transform="translate(1.4 0.8)"/>' +
      '<path d="' + BI + '" stroke="' + C.brzS + '" stroke-width="4" fill="none" opacity="0.75"/>' +
      // engraved central line + hieroglyphs
      '<path d="M0 -12 L 0 -30 C -5 -40, -6 -56, -1 -66 C 5 -76, 18 -80, 26 -74 C 31 -70, 32 -64, 31 -58" stroke="' + C.brzD + '" stroke-width="0.7" fill="none" opacity="0.8"/>' +
      glyph('ankh', 0, -19, 0.9) + glyph('eye', 0, -25.5, 0.9) + glyph('water', -3.4, -40, 0.9) + glyph('sun', -4.4, -48, 0.9) +
      glyph('ankh', -3.6, -57, 0.9) + glyph('eye', 1.6, -69, 0.9) + glyph('water', 9, -75.4, 0.9) + glyph('hut', 17.4, -76.2, 0.8) + glyph('sun', 25, -72.4, 0.9) + glyph('water', 29.4, -65, 0.9) +
      // shine highlights
      '<path d="M-8 -46 C -9 -58, -5 -69, 2 -77" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.95"/>' +
      '<path d="M10 -83.5 C 17 -85, 24 -84, 29 -80" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity="0.85"/>' +
      '<path d="M-1.4 -12 L -1.4 -28" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity="0.6"/>' +
      '</g>';
    s += '<path d="' + BLADE + '" fill="none" stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round"/>';
    s += sparkle(-7.5, -62, 3.2, '#fff');
    // guard
    s += '<path d="M-5.5 -11 L 5.5 -11 L 4.4 -6.4 L -4.4 -6.4 Z" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>';
    s += '<circle cx="0" cy="-8.7" r="1.2" fill="' + C.lapis + '"/>';
    // wrapped grip
    s += '<rect x="-3.3" y="-7" width="6.6" height="21" rx="1.6" fill="' + C.blueS + '" stroke="' + O + '" stroke-width="2"/>';
    var w = '';
    for (var y = -5.5; y < 13; y += 2.6) w += 'M-3.2 ' + f(y + 1.8) + ' L 3.2 ' + f(y) + ' ';
    s += '<path d="' + w + '" stroke="' + C.gold + '" stroke-width="1" fill="none"/>';
    s += '<path d="M-1.8 -5 L -1.8 12" stroke="' + C.blueL + '" stroke-width="0.8" opacity="0.6"/>';
    // pommel
    s += '<path d="M-4.6 13 L 4.6 13 C 5.6 16, 3.6 19, 0 19 C -3.6 19, -5.6 16, -4.6 13 Z" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>';
    s += '<circle cx="0" cy="16" r="1.4" fill="' + C.carn + '" stroke="' + O + '" stroke-width="0.6"/>';
    return s;
  }

  function weaponArm(u, anim) {
    var id = mk(u), s = '<g' + (anim ? ' class="part-weapon" style="transform-origin: 114px 128px"' : '') + '>';
    s += '<g transform="translate(135.5 166.5) rotate(12)">' + khopesh(u) + '</g>';
    s += '<path d="' + ARMW + '" fill="url(#' + id('skin') + ')" stroke="' + O + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<g clip-path="url(#' + id('armw-c') + ')"><path d="M103 138 C 108 148, 118 158, 130 170 L 124 174 Z" fill="' + C.skinS + '" opacity="0.5"/>' +
      '<path d="M114 126 C 120 127, 125 132, 128 138" stroke="' + C.skinL + '" stroke-width="2" fill="none" opacity="0.7" stroke-linecap="round"/></g>';
    // upper-arm cuff (lapis inlay)
    s += '<path d="M111.5 140 C 116 139, 121.5 136.6, 125 133 L 128 139 C 124.5 142.6, 119 145.4, 114.5 146.4 Z" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>';
    s += '<path d="M113 143.4 C 117.4 142.4, 122.4 140, 126.4 136.2" stroke="' + C.lapis + '" stroke-width="1.6" fill="none"/>';
    s += '<circle cx="119.8" cy="140.6" r="1.4" fill="' + C.carn + '" stroke="' + O + '" stroke-width="0.6"/>';
    // wrist cuff (broad, striped)
    s += '<path d="M124.5 157.5 L 135.5 152 L 139.4 160.2 L 128.4 165.6 Z" fill="url(#' + id('gold') + ')" stroke="' + O + '" stroke-width="1.8" stroke-linejoin="round"/>';
    s += '<path d="M125.9 160.4 L 136.9 155 M127.1 163 L 138.1 157.6" stroke="' + C.blue + '" stroke-width="1.1"/>';
    // fist
    s += '<ellipse cx="135.5" cy="167.5" rx="6.6" ry="6" fill="url(#' + id('skin') + ')" stroke="' + O + '" stroke-width="2.4"/>';
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
      '<g transform="translate(-15 -1) scale(0.72)">' + backArm(u) + torso(u) + collar(u) + scarab(u) + head(u, false) + lappets(u) + '</g>' +
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

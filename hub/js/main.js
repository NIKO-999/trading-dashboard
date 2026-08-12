/* ============================================================
   MISSION CONTROL — Gateway & Ambient Hub · entry point
   ============================================================ */

import { createAmbientField } from './shader.js';
// Versioned like the script tag itself: a bare specifier resolves to the same
// URL regardless of main.js's own cache-busting query, so the service worker's
// cache-first strategy can keep serving a stale ui.js forever otherwise — this
// forces a real cache miss whenever ui.js actually changes.
import { initUI } from './ui.js?v=1785986086';

function boot() {
  const canvas = document.getElementById('ambient');
  let field = null;

  try {
    field = createAmbientField(canvas);
  } catch (err) {
    console.warn('[ambient] init failed:', err);
    field = null;
  }

  if (!field) {
    // graceful fallback: static gradient remains, UI fully operational
    document.getElementById('fallback').hidden = false;
    canvas.style.background =
      'radial-gradient(90% 90% at 50% 35%, #12151B 0%, #0B0D10 70%)';
  } else {
    /* render loop with visibility + reduced-motion awareness */
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;
    let running = true;

    function loop() {
      if (!running) return;
      field.frame();
      raf = requestAnimationFrame(loop);
    }
    function start() { if (!running) { running = true; loop(); } }
    function stop() { running = false; cancelAnimationFrame(raf); }

    document.addEventListener('visibilitychange', () => {
      document.hidden ? stop() : start();
    });
    reduced.addEventListener?.('change', () => {
      reduced.matches ? stop() : start();
    });
    reduced.matches ? stop() : loop();

    window.addEventListener('resize', () => field.resize(), { passive: true });
  }

  initUI(field);
}

boot();

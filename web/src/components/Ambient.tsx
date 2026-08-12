import { useEffect, useRef } from 'react';
// The gateway page and the dashboard share one shader source.
import { createAmbientField } from '../../../hub/js/shader.js';

type Field = {
  frame: () => void;
  resize: () => void;
  setTheme: (name: string) => void;
  pointer: (x: number, y: number, moving: boolean) => void;
};

/**
 * Full-screen ambient field. Pauses when the tab is hidden and when the user
 * asks for reduced motion, and falls back to a static gradient with no WebGL.
 */
export function Ambient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let field: Field | null = null;
    try {
      field = createAmbientField(canvas) as Field | null;
    } catch (err) {
      console.warn('[ambient] init failed:', err);
    }

    if (!field) {
      canvas.style.background = 'radial-gradient(90% 90% at 50% 35%, #12151B 0%, #0B0D10 70%)';
      return;
    }

    field.setTheme(document.body.dataset.theme || 'graphite');

    // Theme changed on the gateway in another tab — the shader lerps to the
    // new hues rather than snapping.
    const onThemeChange = (e: StorageEvent) => {
      if (e.key === 'mc-theme' && e.newValue) field!.setTheme(e.newValue);
    };
    window.addEventListener('storage', onThemeChange);

    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;
    let running = false;

    const loop = () => {
      if (!running) return;
      field!.frame();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      // Deliberately not gated on document.hidden: the browser already throttles
      // rAF in a background tab, and gating here left the field frozen at t=0
      // (a flat near-black frame) whenever the app mounted while hidden.
      if (running || reduced.matches) return;
      running = true;
      loop();
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onVisibility = () => (document.hidden ? stop() : start());
    const onReduced = () => (reduced.matches ? stop() : start());
    const onResize = () => field!.resize();
    const onPointer = (e: PointerEvent) =>
      field!.pointer(e.clientX / window.innerWidth, e.clientY / window.innerHeight, true);

    document.addEventListener('visibilitychange', onVisibility);
    reduced.addEventListener?.('change', onReduced);
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('pointermove', onPointer, { passive: true });

    // Always paint one frame up front. rAF never fires while the tab is in the
    // background, so without this the field stays pure black until the tab is
    // first shown — which is exactly how a PWA restores from the home screen.
    field.frame();
    if (!reduced.matches) start();

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      reduced.removeEventListener?.('change', onReduced);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('storage', onThemeChange);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="mc-ambient" aria-hidden="true" />
      <div className="mc-vignette" aria-hidden="true" />
    </>
  );
}

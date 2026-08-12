import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/inter/200.css'
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import './index.css'
import './additions.css'
import App from './App.tsx'

// The gateway page persists the chosen theme; mirror it here before first paint
// so the ambient field and accent colours match across both screens.
const THEMES = ['emerald', 'london', 'void', 'graphite'];
const stored = localStorage.getItem('mc-theme');
document.body.dataset.theme = stored && THEMES.includes(stored) ? stored : 'graphite';

// Picked up if the theme is changed on the gateway in another tab.
window.addEventListener('storage', (e) => {
  if (e.key === 'mc-theme' && e.newValue && THEMES.includes(e.newValue)) {
    document.body.dataset.theme = e.newValue;
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Slow reveal: the frosted veil holds while the app mounts, then fades out.
// Driven by a CSS transition rather than a per-frame rAF loop — rAF does not
// fire in a backgrounded tab, which left the veil stuck at full opacity over
// the whole app until the user touched it.
const VEIL_DELAY = 400;
const VEIL_DURATION = 1700;

setTimeout(() => {
  const veil = document.getElementById('veil');
  if (!veil) return;
  veil.style.transition = `opacity ${VEIL_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`;
  veil.style.opacity = '0';
  const drop = () => veil.remove();
  veil.addEventListener('transitionend', drop, { once: true });
  // Belt and braces: if the transition never fires the veil still goes away.
  setTimeout(drop, VEIL_DURATION + 400);
}, VEIL_DELAY)

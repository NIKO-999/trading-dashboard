// "Install app": the browser's own install prompt where there is one (Chrome and Edge, on Android
// and desktop), and clear steps where there isn't (Safari on iPhone and iPad has no install prompt).
import { h } from './dom';
import { modal } from './modal';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((f) => f());

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // keep it for our own button
  deferred = e as InstallPromptEvent;
  changed();
});
window.addEventListener('appinstalled', () => {
  installed = true;
  deferred = null;
  changed();
});

export const isStandalone = () =>
  matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isFramed = () => {
  try { return window.self !== window.top; } catch { return true; }
};
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** Worth showing an install button: a real web address, not already installed, not inside another page. */
export const canOfferInstall = () => /^https?:$/.test(location.protocol) && !installed && !isStandalone() && !isFramed();

/** Calls back when the browser says the app became installable or got installed. */
export const onInstallChange = (f: () => void) => { listeners.add(f); return () => listeners.delete(f); };

export async function installApp() {
  if (deferred) {
    const ev = deferred;
    deferred = null;
    await ev.prompt();
    const { outcome } = await ev.userChoice;
    if (outcome === 'accepted') installed = true;
    changed();
    return;
  }
  const steps = isIOS()
    ? ['Tap the Share button in Safari (the square with an arrow, at the bottom of the screen).', 'Scroll down and tap “Add to Home Screen”.', 'Tap “Add”. Tessera now opens like an app, full screen, and works offline.']
    : ['Open your browser’s menu (⋮ or ⋯).', 'Choose “Install app” or “Add to Home screen”.', 'Tessera then opens like an app and works offline.'];
  modal({
    title: 'Install Tessera',
    body: [h('p', {}, isIOS() ? 'On iPhone and iPad, installing is done from Safari:' : 'Your browser installs apps from its menu:'), h('ol', { class: 'install-steps' }, ...steps.map((s) => h('li', {}, s)))],
    dismissable: true,
  });
}

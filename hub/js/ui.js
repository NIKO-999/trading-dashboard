/* ============================================================
   Gateway UI — hash routing to real views, zen mode, drawer,
   settings with theme preview + persist, prefs, clock.
   ============================================================ */


export function initUI(field) {
  const body = document.body;

  /* ---------- clock ---------- */
  const clock = document.getElementById('clock');
  function tick() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    clock.textContent = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- theme (global, persisted, previewed) ---------- */
  const themeOptions = document.querySelectorAll('.theme-option');
  function applyTheme(name, save = true) {
    body.dataset.theme = name;
    field?.setTheme(name);
    themeOptions.forEach((o) => o.classList.toggle('active', o.dataset.theme === name));
    if (save) localStorage.setItem('mc-theme', name);
  }
  themeOptions.forEach((o) => o.addEventListener('click', () => applyTheme(o.dataset.theme)));
  applyTheme(localStorage.getItem('mc-theme') || 'graphite', false);

  /* ---------- preferences ---------- */
  document.querySelectorAll('.toggle').forEach((t) => {
    const pref = t.dataset.pref;
    const stored = localStorage.getItem('mc-pref-' + pref);
    if (stored !== null) setPref(pref, stored === '1', t);
    t.addEventListener('click', () => setPref(pref, !t.classList.contains('on'), t));
  });
  function setPref(pref, on, el) {
    const t = el || document.querySelector(`.toggle[data-pref="${pref}"]`);
    t.classList.toggle('on', on);
    t.setAttribute('aria-checked', String(on));
    localStorage.setItem('mc-pref-' + pref, on ? '1' : '0');
    if (pref === 'ambient') body.classList.toggle('no-ambient', !on);
    if (pref === 'reduceMotion') body.classList.toggle('reduce-motion', on);
  }

  /* ---------- zen ---------- */
  const zenBtn = document.getElementById('zenToggle');
  let zen = false;
  const enterZen = () => { zen = true; body.classList.add('zen'); };
  const exitZen = () => { zen = false; body.classList.remove('zen'); };
  const toggleZen = () => (zen ? exitZen() : enterZen());
  zenBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleZen(); });

  /* ---------- pointer → field ---------- */
  let lastMove = 0;
  window.addEventListener('pointermove', (e) => {
    const now = performance.now();
    const moving = now - lastMove < 90;
    lastMove = now;
    field?.pointer(e.clientX / innerWidth, e.clientY / innerHeight, moving);
    if (zen) exitZen();
  }, { passive: true });
  window.addEventListener('pointerdown', (e) => {
    field?.ripple(e.clientX / innerWidth, e.clientY / innerHeight, Math.random());
  }, { passive: true });

  const settings = document.getElementById('settings');
  const settingsScrim = document.getElementById('settingsScrim');
  const drawer = document.getElementById('drawer');
  const drawerScrim = document.getElementById('drawerScrim');
  const edgeArrow = document.getElementById('edgeArrow');

  function showScrim(el, show) {
    if (show) { el.hidden = false; requestAnimationFrame(() => el.classList.add('on')); }
    else { el.classList.remove('on'); setTimeout(() => { el.hidden = true; }, 400); }
  }

  function openSettings() {
    closeDrawer();
    settings.classList.add('on');
    settings.setAttribute('aria-hidden', 'false');
    showScrim(settingsScrim, true);
  }
  function closeSettings() {
    settings.classList.remove('on');
    settings.setAttribute('aria-hidden', 'true');
    showScrim(settingsScrim, false);
  }

  function openDrawer() {
    drawer.classList.add('on'); drawer.setAttribute('aria-hidden', 'false');
    showScrim(drawerScrim, true);
  }
  function closeDrawer() {
    drawer.classList.remove('on'); drawer.setAttribute('aria-hidden', 'true');
    showScrim(drawerScrim, false);
  }

  /* hash routing */
  function route() {
    const h = location.hash.replace('#/', '') || 'hub';
    if (h === 'settings') openSettings();
    else closeSettings();
  }
  window.addEventListener('hashchange', route);

  /* gateway cards + drawer → navigate AWAY to the real pages */
  const DESTINATIONS = {
    hub: './index.html',
    trading: './trading/index.html',
    knowledge: './trading/index.html#knowledge',
    moonshot: './trading/index.html#moonshot',
    wardrobe: './trading/index.html#wardrobe',
  };
  document.querySelectorAll('[data-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const dest = DESTINATIONS[el.dataset.nav] || './index.html';
      const r = el.getBoundingClientRect();
      const cx = (r.left + r.width / 2) / innerWidth;
      const cy = (r.top + r.height / 2) / innerHeight;
      field?.ripple(cx, cy, Math.random());
      const warp = document.getElementById('warp');
      warp.style.setProperty('--wx', `${cx * 100}%`);
      warp.style.setProperty('--wy', `${cy * 100}%`);
      warp.classList.add('on');
      document.body.classList.add('leaving');
      setTimeout(() => { window.location.href = dest; }, 620);
    });
  });

  /* close buttons */
  settingsScrim.addEventListener('click', () => { location.hash = '#/hub'; });

  /* settings open/close */
  document.getElementById('settingsToggle').addEventListener('click', () => { location.hash = '#/settings'; });
  document.getElementById('settingsClose').addEventListener('click', () => { location.hash = '#/hub'; });

  /* drawer */
  edgeArrow.addEventListener('click', () => (drawer.classList.contains('on') ? closeDrawer() : openDrawer()));
  document.getElementById('drawerClose').addEventListener('click', closeDrawer);
  drawerScrim.addEventListener('click', closeDrawer);

  /* keyboard */
  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.code === 'Space' || e.key.toLowerCase() === 'h') { e.preventDefault(); toggleZen(); }
    else if (e.key === 'Escape') {
      if (drawer.classList.contains('on')) closeDrawer();
      else if (settings.classList.contains('on')) location.hash = '#/hub';
      else if (zen) exitZen();
    } else if (zen) exitZen();
  });

  route(); // initial
}

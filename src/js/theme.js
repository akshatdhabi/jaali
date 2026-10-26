// Theme (palette) and mode (dark or light). Both persist, both fire "jaali:theme".
import { THEMES, DEFAULT_THEME } from './_themes.gen.js';
import { $$, reduced } from './util.js';

const KEY_THEME = 'jaali:theme';
const KEY_MODE = 'jaali:mode';
const root = () => document.documentElement;

const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode: skip */ } };
const notify = () => document.dispatchEvent(new CustomEvent('jaali:theme', { detail: { theme: getTheme(), mode: getMode() } }));

/** [{ name, label }] in display order. */
export const themes = () => Object.entries(THEMES).map(([name, t]) => ({ name, label: t.label }));

export const getTheme = () => root().dataset.theme || DEFAULT_THEME;

/** 'dark' or 'light'. Follows the system until the visitor picks one. */
export const getMode = () =>
  root().dataset.mode || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

export function setMode(mode, { persist = true } = {}) {
  if (mode !== 'dark' && mode !== 'light') throw new RangeError(`mode must be "dark" or "light", got "${mode}"`);
  root().dataset.mode = mode;
  if (persist) write(KEY_MODE, mode);
  notify();
}

export const toggleMode = () => setMode(getMode() === 'light' ? 'dark' : 'light');

export function setTheme(name, { quiet = false, persist = true } = {}) {
  if (!THEMES[name]) throw new RangeError(`unknown theme "${name}". Available: ${Object.keys(THEMES).join(', ')}`);
  if (!quiet && !reduced()) {
    const el = root();
    el.classList.add('j-reskin');
    clearTimeout(setTheme._t);
    setTheme._t = setTimeout(() => el.classList.remove('j-reskin'), 700);
  }
  root().dataset.theme = name;
  if (persist) write(KEY_THEME, name);
  notify();
}

/** Restore the saved theme and mode. Call once, as early as you can. */
export function initTheme() {
  const t = read(KEY_THEME);
  const m = read(KEY_MODE);
  if (t && THEMES[t]) root().dataset.theme = t; else root().dataset.theme = DEFAULT_THEME;
  if (m === 'dark' || m === 'light') root().dataset.mode = m;
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', notify);
  notify();
}

/**
 * Render one card per theme into `list`. Each card previews that theme in the current mode.
 * Optional `toggle` and `panel` wire a button that opens a dropdown panel.
 */
export function themePicker(list, { toggle, panel } = {}) {
  const paint = () => {
    const mode = getMode();
    const cur = getTheme();
    list.replaceChildren();
    Object.entries(THEMES).forEach(([name, t], i) => {
      const v = t[mode];
      const b = document.createElement('button');
      b.className = 'j-skin' + (name === cur ? ' on' : '');
      b.type = 'button';
      b.dataset.theme = name;
      b.style.setProperty('--i', i);
      b.style.background = v.tile;
      const dots = document.createElement('span');
      dots.className = 'dots';
      [v.ground, v.tile, v.ink, v.accent].forEach((c) => {
        const d = document.createElement('i');
        d.style.background = c;
        dots.append(d);
      });
      const title = document.createElement('b');
      title.style.color = v.ink;
      title.append(name);
      const dot = document.createElement('i');
      dot.style.color = v.accent;
      dot.textContent = '.';
      title.append(dot);
      const label = document.createElement('small');
      label.style.color = v.muted;
      label.textContent = t.label;
      b.append(dots, title, label);
      b.addEventListener('click', () => setTheme(name));
      list.append(b);
    });
  };
  paint();
  document.addEventListener('jaali:theme', paint);
  if (toggle && panel) {
    toggle.addEventListener('click', () => {
      const open = panel.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }
  return { repaint: paint };
}

export { THEMES, DEFAULT_THEME };

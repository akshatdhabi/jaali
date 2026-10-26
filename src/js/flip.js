// Flip word: the accent word that turns over like a live tile.
// <span class="j-flip" data-words="system|brain|engine">system</span>
// First word is the true claim and the one screen readers hear.
import { $$, reduced } from './util.js';

const state = new WeakMap();
const cur = (el) => el.querySelector('span[data-f]:not(.out)');

function build(el, text) {
  const s = document.createElement('span');
  s.dataset.f = '';
  s.setAttribute('aria-hidden', 'true');
  s.textContent = text;
  return s;
}

function init(el, idx) {
  if (state.has(el)) return;
  const words = (el.dataset.words || '').split('|').filter(Boolean);
  if (words.length < 2) return;
  const line = el.classList.contains('j-flip--line');
  const sr = document.createElement('span');
  sr.className = 'j-sr';
  sr.textContent = words[0];
  el.replaceChildren(sr, build(el, words[0]));
  const st = { i: 0, words, line, hover: false, vis: true, next: performance.now() + 1800 + (idx % 6) * 650 };
  state.set(el, st);
  const host = el.closest('.j-card,.j-live,p,h1,h2') || el;
  host.addEventListener('pointerenter', () => { st.hover = true; });
  host.addEventListener('pointerleave', () => { st.hover = false; });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { st.vis = es[0].isIntersecting; }).observe(el);
  }
  if (!line) el.style.width = cur(el).offsetWidth + 'px';
}

function step(el, st) {
  st.i = (st.i + 1) % st.words.length;
  const old = cur(el);
  if (old) { old.classList.add('out'); setTimeout(() => old.remove(), 400); }
  const nx = build(el, st.words[st.i]);
  nx.classList.add('in');
  el.append(nx);
  if (!st.line) el.style.width = nx.offsetWidth + 'px';
}

const refit = () => $$('.j-flip:not(.j-flip--line)').forEach((el) => { const c = cur(el); if (c) el.style.width = c.offsetWidth + 'px'; });

/**
 * Start every .j-flip[data-words] under `root`. Words appear 2.6s apart, staggered across the page.
 * Pauses on hover and off screen. Under reduced motion the first word stays put.
 * New .j-flip elements added later are picked up on the next tick. Returns stop().
 */
export function flipWords(root = document, { interval = 2600 } = {}) {
  const all = () => $$('.j-flip[data-words]', root);
  all().forEach(init);
  addEventListener('resize', refit);
  document.fonts && document.fonts.ready.then(refit);
  if (reduced()) return () => {};
  const timer = setInterval(() => {
    const now = performance.now();
    all().forEach((el, i) => {
      init(el, i);
      const st = state.get(el);
      if (!st || st.hover || !st.vis || document.hidden) return;
      if (now >= st.next) { step(el, st); st.next = now + interval; }
    });
  }, 200);
  return () => { clearInterval(timer); removeEventListener('resize', refit); };
}

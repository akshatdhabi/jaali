// Slide-ins: adds .is-in to [data-j-in] and .j-band when they scroll into view.
// Elements already on screen at load are left alone, so the first screen never flashes.
import { $$, reduced } from './util.js';

export function reveal(root = document) {
  if (reduced() || !('IntersectionObserver' in window)) return () => {};
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -6% 0px' });
  $$('[data-j-in],.j-band', root).forEach((el) => {
    if (el.getBoundingClientRect().top > innerHeight) io.observe(el);
  });
  return () => io.disconnect();
}

/** Count a number up to its data-count over 1.2s. */
export function countUp(el, { duration = 1200, delay = 300 } = {}) {
  const n = +el.dataset.count;
  if (reduced() || Number.isNaN(n)) return;
  const t0 = performance.now() + delay;
  const f = (t) => {
    const k = Math.min(1, Math.max(0, (t - t0) / duration));
    el.textContent = Math.round(n * (1 - Math.pow(1 - k, 4)));
    if (k < 1) requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
}

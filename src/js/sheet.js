// Continuum: tap a title and it flies into the detail sheet; back flies it home.
import { $, EASE, reduced } from './util.js';

function flip(from, to, forward) {
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  const s = a.height / b.height;
  const k = [{ transform: 'none' }, { transform: `translate(${a.left - b.left}px,${a.top - b.top}px) scale(${s})` }];
  return to.animate(forward ? k : k.reverse(), { duration: forward ? 420 : 620, easing: EASE, fill: forward ? 'forwards' : 'none' });
}

/**
 * Markup: <div class="j-sheet j-wrap" hidden><div class="j-inner">
 *   <button class="j-cbtn j-sheet__back">...</button><p class="j-sheet__org"></p>
 *   <h2 class="j-sheet__title"></h2><div class="j-sheet__body"></div></div></div>
 * Returns { open(sourceTitleEl, { org, title, html }), close() }. `html` is trusted markup you built.
 */
export function sheet(el) {
  const title = $('.j-sheet__title', el);
  const body = $('.j-sheet__body', el);
  const back = $('.j-sheet__back', el);
  let src = null;

  function open(from, { org = '', title: t = '', html = '' } = {}) {
    src = from;
    $('.j-sheet__org', el).textContent = org;
    title.textContent = t;
    body.innerHTML = html;
    el.hidden = false;
    el.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    body.classList.remove('j-sheet__body');
    void el.offsetWidth;
    body.classList.add('j-sheet__body');
    if (!reduced() && from) {
      flip(from, title, false);
      el.animate([{ backgroundColor: 'transparent' }, {}], { duration: 300 });
      from.style.visibility = 'hidden';
    }
    back.focus({ preventScroll: true });
  }

  function close() {
    const done = () => {
      el.hidden = true;
      document.body.style.overflow = '';
      el.getAnimations({ subtree: true }).forEach((x) => x.cancel());
      if (src) { src.style.visibility = ''; const b = src.closest('button'); if (b) b.focus({ preventScroll: true }); }
    };
    if (reduced() || !src || !src.isConnected) { done(); return; }
    body.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateX(40px)' }], { duration: 170, fill: 'forwards' });
    [...el.querySelectorAll('.j-cbtn,.j-sheet__org')].forEach((e) => e.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' }));
    el.animate([{ backgroundColor: getComputedStyle(el).backgroundColor }, { backgroundColor: 'transparent' }], { duration: 420, fill: 'forwards' });
    flip(src, title, true).onfinish = done;
  }

  back.addEventListener('click', close);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !el.hidden) close(); });
  return { open, close };
}

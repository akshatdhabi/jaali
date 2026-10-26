// Pivots: big lowercase words, the strip slides so the active word leads and wraps around.
// <div class="j-pivot"><div class="j-pivot__strip"><button class="on">one</button><button>two</button></div></div>
import { $, $$, reduced } from './util.js';

/** Wire a pivot. onPick(button, index) runs on every change. Returns { select(index) }. */
export function pivot(box, onPick = () => {}) {
  const strip = $('.j-pivot__strip', box);
  const base = $$('button', strip);
  const n = base.length;
  base.forEach((b) => {
    const c = b.cloneNode(true);
    c.classList.remove('on');
    c.tabIndex = -1;
    c.setAttribute('aria-hidden', 'true');
    strip.append(c);
  });
  const all = $$('button', strip);
  let pos = 0;
  const ghost = () => all.forEach((x, j) => x.classList.toggle('ghost', j < pos || j >= pos + n));
  const off = (b) => b.offsetLeft - all[0].offsetLeft;
  ghost();

  all.forEach((b, j) => b.addEventListener('click', () => {
    const k = j % n;
    if (pos % n === k) return;
    let target = k >= pos % n ? pos - (pos % n) + k : pos - (pos % n) + k + n;
    if (target >= 2 * n) target -= n;
    all.forEach((x) => x.classList.remove('on'));
    all[target].classList.add('on');
    strip.style.transform = `translateX(${-off(all[target])}px)`;
    pos = target;
    ghost();
    if (pos >= n) {
      // landed on the clone: after the slide, jump back to the real button with no animation
      const settle = () => {
        strip.style.transition = 'none';
        all.forEach((x) => { x.style.transition = 'none'; x.classList.remove('on'); });
        base[k].classList.add('on');
        pos = k;
        strip.style.transform = `translateX(${-off(base[k])}px)`;
        ghost();
        void strip.offsetWidth;
        strip.style.transition = '';
        all.forEach((x) => { x.style.transition = ''; });
      };
      reduced() ? settle() : setTimeout(settle, 620);
    }
    onPick(base[k], k);
  }));

  return { select: (k) => base[k] && base[k].click() };
}

/** Swap a view: turn the old one out (170ms), render, turn the new one in item by item. */
export function turnstile(el, render) {
  if (reduced()) { render(); return; }
  el.classList.remove('is-in');
  el.classList.add('is-out');
  setTimeout(() => {
    render();
    el.classList.remove('is-out');
    void el.offsetWidth;
    el.classList.add('is-in');
  }, 170);
}

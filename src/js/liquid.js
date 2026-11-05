// Liquid: motion that answers an action. Glass: the material it moves in.
import { $, $$, EASE, reduced } from './util.js';

const SPRING = 'cubic-bezier(.3,1.25,.5,1)';

/** Glass + materialize: add or remove .is-on on a .j-glass.j-mat element. */
export function materialize(el, on = true) { el.classList.toggle('is-on', on); }

/**
 * Pill tabs whose pill stretches: the leading edge moves first, the trailing edge follows.
 * <div class="j-stretch" role="tablist"><i class="j-stretch__pill"></i><button role="tab">a</button>...</div>
 */
export function stretch(box, onPick = () => {}) {
  const pill = $('.j-stretch__pill', box);
  const tabs = $$('button', box);
  let cur = Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'));
  function place(i, anim) {
    const b = tabs[i];
    const right = box.clientWidth - (b.offsetLeft + b.offsetWidth);
    const fwd = i >= cur;
    pill.style.transition = anim && !reduced()
      ? (fwd ? `left .62s ${EASE} .04s, right .36s ${EASE}` : `left .36s ${EASE}, right .62s ${EASE} .04s`)
      : 'none';
    pill.style.left = b.offsetLeft + 'px';
    pill.style.right = right + 'px';
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    const prev = cur; cur = i;
    if (anim) onPick(tabs[i], i, prev);
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => place(i, true));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      place(n, true); tabs[n].focus();
    });
  });
  const again = () => place(cur, false);
  again();
  if (document.fonts) document.fonts.ready.then(again);
  addEventListener('resize', again);
  return { select: (i) => place(i, true) };
}

/** A glass + that grows into its row. <button class="j-grow j-glass"><span class="j-grow__plus">+</span><span class="j-grow__opts">...</span></button> */
export function grow(btn) {
  const set = (o) => { btn.classList.toggle('is-open', o); btn.setAttribute('aria-expanded', String(o)); };
  btn.addEventListener('click', (e) => { if (e.target.closest('.j-grow__opts > *') && btn.classList.contains('is-open')) return; set(!btn.classList.contains('is-open')); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
  set(false);
  return { open: () => set(true), close: () => set(false) };
}

let veil = null;
let open = null;

/**
 * Pour a glass sheet out of a tile and back. `render(sheetBody)` fills it; it gets called once per open.
 * Returns { close }.
 */
export function pour(tile, render) {
  if (open) return open.api;
  if (!veil) { veil = document.createElement('div'); veil.className = 'j-veil'; document.body.append(veil); veil.addEventListener('click', () => open && open.api.close()); }
  const r = tile.getBoundingClientRect();
  const w = Math.min(620, innerWidth - 32), h = Math.min(440, innerHeight - 80);
  const T = { left: (innerWidth - w) / 2, top: (innerHeight - h) / 2, width: w, height: h };
  const sh = document.createElement('div');
  sh.className = 'j-pour'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true');
  sh.innerHTML = '<button class="j-pour__x" aria-label="Close">×</button><div class="j-pour__in"></div>';
  render($('.j-pour__in', sh));
  Object.assign(sh.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  document.body.append(sh);
  veil.classList.add('is-on');
  tile.style.visibility = 'hidden';
  const px = (n) => n + 'px';
  const a = sh.animate([
    { left: px(r.left), top: px(r.top), width: px(r.width), height: px(r.height), borderRadius: '12px' },
    { left: px((T.left + r.left) / 2), top: px((T.top + r.top) / 2 - 14), width: px(T.width * .85 + r.width * .15), height: px(T.height * .55 + r.height * .45), borderRadius: '40px', offset: .45 },
    { left: px(T.left), top: px(T.top), width: px(T.width), height: px(T.height), borderRadius: '26px' }
  ], { duration: reduced() ? 1 : 620, easing: SPRING, fill: 'forwards' });
  a.onfinish = () => { sh.classList.add('is-ready'); $('.j-pour__x', sh).focus({ preventScroll: true }); };
  const api = {
    close() {
      if (!open) return;
      open = null;
      const b = sh.getBoundingClientRect(), t = tile.getBoundingClientRect();
      sh.classList.remove('is-ready'); veil.classList.remove('is-on');
      sh.animate([
        { left: px(b.left), top: px(b.top), width: px(b.width), height: px(b.height), borderRadius: '26px' },
        { left: px((b.left + t.left) / 2), top: px((b.top + t.top) / 2 + 10), width: px(b.width * .4 + t.width * .6), height: px(b.height * .5 + t.height * .5), borderRadius: '40px', offset: .5 },
        { left: px(t.left), top: px(t.top), width: px(t.width), height: px(t.height), borderRadius: '12px' }
      ], { duration: reduced() ? 1 : 480, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' }).onfinish = () => {
        tile.style.visibility = ''; sh.remove(); tile.focus({ preventScroll: true });
      };
    }
  };
  $('.j-pour__x', sh).addEventListener('click', api.close);
  open = { api };
  return api;
}
addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) open.api.close(); });

const ARCH = 'M8 300V132C8 76 46 40 80 6C114 40 152 76 152 132V300Z';
const STAR = 'M0-48L11-27L34-34L27-11L48 0L27 11L34 34L11 27L0 48L-11 27L-34 34L-27 11L-48 0L-27-11L-34-34L-11-27Z';
const ROSE = Array.from({ length: 8 }, (_, k) => `<path transform="rotate(${k * 45})" d="M0 0C-9-9-9-30 0-46C9-30 9-9 0 0Z"/>`).join('') + '<circle r="10"/>';

/** Fill a .j-stage with the four drifting jaali shapes. */
export function stage(el) {
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML =
    `<svg class="s1" viewBox="0 0 160 300"><path d="${ARCH}"/></svg>` +
    `<svg class="s2" viewBox="-50 -50 100 100"><path d="${STAR}"/></svg>` +
    `<svg class="s3" viewBox="-50 -50 100 100">${ROSE}</svg>` +
    `<svg class="s4" viewBox="0 0 160 300"><path d="${ARCH}"/></svg>`;
}

/** A soft highlight follows the mouse across glass tiles. Touch keeps the resting sheen. Returns a stop function. */
export function sheen(root = document) {
  const on = (e) => {
    if (e.pointerType !== 'mouse' || !e.target.closest) return;
    const f = e.target.closest('.is-glass .j-face, .j-glass');
    if (!f || !root.contains(f)) return;
    const r = f.getBoundingClientRect();
    f.style.setProperty('--mx', e.clientX - r.left + 'px');
    f.style.setProperty('--my', e.clientY - r.top + 'px');
  };
  addEventListener('pointermove', on, { passive: true });
  return () => removeEventListener('pointermove', on);
}

/** Pager tied to horizontal scroll: <div class="j-worm"><i></i>...<b></b></div> */
export function worm(scroller, pager) {
  const dots = $$('i', pager), bar = $('b', pager), gap = 20;
  const paint = () => {
    const kids = [...scroller.children];
    const step = kids.length > 1 ? kids[1].offsetLeft - kids[0].offsetLeft : 1;
    const max = scroller.scrollWidth - scroller.clientWidth;
    let f = Math.min(Math.max(scroller.scrollLeft / step, 0), dots.length - 1);
    if (max > 0 && scroller.scrollLeft >= max - 2) f = dots.length - 1;
    const i = Math.floor(f), fr = f - i;
    const head = i * gap + Math.min(1, fr * 2) * gap, tail = i * gap + Math.max(0, fr * 2 - 1) * gap;
    bar.style.left = tail + 'px'; bar.style.width = head - tail + 10 + 'px';
  };
  scroller.addEventListener('scroll', () => requestAnimationFrame(paint), { passive: true });
  paint();
  return { paint };
}

/**
 * A word that melts into the next one. <span class="j-melt" data-words="glass|liquid|light"></span>
 * Adds the threshold filter once. Holds the first word under reduced motion. Returns a stop function.
 */
export function melt(el, { hold = 2600, ms = 1100 } = {}) {
  if (!document.getElementById('j-melt')) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('width', '0'); s.setAttribute('height', '0'); s.setAttribute('aria-hidden', 'true'); s.style.position = 'absolute';
    s.innerHTML = '<filter id="j-melt"><feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"/></filter>';
    document.body.append(s);
  }
  const words = (el.dataset.words || el.textContent).split('|');
  el.innerHTML = '<span class="j-melt__a"></span><span class="j-melt__b" aria-hidden="true"></span>';
  const a = $('.j-melt__a', el), b = $('.j-melt__b', el);
  let i = 0; a.textContent = words[0];
  if (reduced() || words.length < 2) return () => {};
  const blur = (f) => `blur(${Math.min(8 / Math.max(f, 0.001) - 8, 100)}px)`;
  const id = setInterval(() => {
    if (document.hidden) return;
    const n = (i + 1) % words.length, t0 = performance.now();
    b.textContent = words[n];
    const step = (now) => {
      const f = Math.min((now - t0) / ms, 1), g = 1 - f;
      b.style.filter = blur(f); b.style.opacity = String(f ** 0.4);
      a.style.filter = blur(g); a.style.opacity = String(g ** 0.4);
      if (f < 1) requestAnimationFrame(step);
      else { i = n; a.textContent = words[i]; a.style.filter = ''; a.style.opacity = '1'; b.style.opacity = '0'; }
    };
    requestAnimationFrame(step);
  }, hold + ms);
  return () => clearInterval(id);
}

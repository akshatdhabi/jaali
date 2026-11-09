// Focus: point at one item in a busy group and the rest step back.
// <div class="j-focus">
//   <a data-focus data-tip-k="shipped · 2024" data-tip-t="bot builder" data-tip-s="No-code, drag and drop.">…</a>
// </div>
// Hover, keyboard focus or a tap picks an item and the others dim. Opt in to a raised tip with { tip: true }.

let tipEl = null, owner = null;

/** The shared raised tip. One element for the page, so only one tip is ever on screen. */
export function focusTip() {
  if (!tipEl) {
    tipEl = document.createElement('div');
    tipEl.className = 'j-tip';
    tipEl.setAttribute('role', 'status');
    tipEl.setAttribute('aria-live', 'polite');
    tipEl.innerHTML = '<b class="j-tip__k"></b><span class="j-tip__t"></span><span class="j-tip__s"></span>';
    document.body.appendChild(tipEl);
  }
  const k = tipEl.querySelector('.j-tip__k'), t = tipEl.querySelector('.j-tip__t'), s = tipEl.querySelector('.j-tip__s');
  return {
    /** info: { k, t, s, quiet }. x, y in viewport pixels. owner: any object; only it can hide the tip it showed. */
    show(info, x, y, who = null) {
      owner = who;
      k.textContent = info.k || ''; t.textContent = info.t || ''; s.textContent = info.s || '';
      k.classList.toggle('is-quiet', !!info.quiet);
      s.hidden = !info.s;
      const w = tipEl.offsetWidth || 240, h = tipEl.offsetHeight || 80;
      let X = x + 18, Y = y + 18;
      if (X + w > innerWidth - 12) X = x - w - 18;
      if (Y + h > innerHeight - 12) Y = y - h - 18;
      tipEl.style.left = Math.max(12, X) + 'px';
      tipEl.style.top = Math.max(64, Y) + 'px';
      tipEl.classList.add('is-on');
    },
    hide(who = null) { if (who && owner && who !== owner) return; owner = null; tipEl.classList.remove('is-on'); },
  };
}

const infoOf = (el) => ({ k: el.dataset.tipK, t: el.dataset.tipT, s: el.dataset.tipS, quiet: el.hasAttribute('data-tip-quiet') });

/**
 * Wire one .j-focus group. Items are its [data-focus] children. Pass { tip: true } to name the picked item in a raised tip.
 * Returns stop().
 */
export function focusGroup(box, { tip = false } = {}) {
  const T = focusTip(), me = {};
  let on = null;
  const pick = (el, x, y) => {
    if (on && on !== el) on.classList.remove('is-focus');
    on = el;
    box.classList.toggle('is-focusing', !!el);
    if (!el) { T.hide(me); return; }
    el.classList.add('is-focus');
    if (tip && el.dataset.tipT) {
      if (x == null) { const r = el.getBoundingClientRect(); x = r.left + Math.min(r.width * 0.6, 320); y = r.top + r.height * 0.4; }
      T.show(infoOf(el), x, y, me);
    }
  };
  const item = (e) => e.target.closest && e.target.closest('[data-focus]');
  const move = (e) => { if (e.pointerType === 'touch') return; const el = item(e); el && box.contains(el) ? pick(el, e.clientX, e.clientY) : pick(null); };
  const leave = () => pick(null);
  const tap = (e) => { if (e.pointerType !== 'touch') return; const el = item(e); pick(el && el !== on ? el : null); };
  const fin = (e) => { const el = item(e); if (el) pick(el); };
  const fout = (e) => { if (!box.contains(e.relatedTarget)) pick(null); };
  const hide = () => on && pick(null);
  box.addEventListener('pointermove', move);
  box.addEventListener('pointerleave', leave);
  box.addEventListener('pointerup', tap);
  box.addEventListener('focusin', fin);
  box.addEventListener('focusout', fout);
  addEventListener('scroll', hide, { passive: true });
  return () => {
    pick(null);
    box.removeEventListener('pointermove', move);
    box.removeEventListener('pointerleave', leave);
    box.removeEventListener('pointerup', tap);
    box.removeEventListener('focusin', fin);
    box.removeEventListener('focusout', fout);
    removeEventListener('scroll', hide);
  };
}

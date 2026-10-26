// Toast: slides up on the raised layer, then leaves.
let el = null;
let timer = 0;

function ensure() {
  if (el && el.isConnected) return el;
  el = document.querySelector('.j-toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'j-toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.append(el);
  }
  return el;
}

/** toast('Saved', 'Three habits updated') */
export function toast(title, sub = '', { ms = 2800 } = {}) {
  const t = ensure();
  const wrap = document.createElement('div');
  const b = document.createElement('b'); b.textContent = title;
  const s = document.createElement('span'); s.textContent = sub;
  wrap.append(b, s);
  t.replaceChildren(wrap);
  t.classList.add('is-on');
  clearTimeout(timer);
  timer = setTimeout(() => t.classList.remove('is-on'), ms);
}

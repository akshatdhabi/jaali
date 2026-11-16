// Shared wiring for every docs page: theme, mode, lattice field, slide-ins, progress bar.
(function () {
  const J = window.Jaali;
  /* warm the next page as soon as you point at its link (prefetch, for browsers that ignore speculation rules) */
  var warmed = {};
  function warm(e) {
    var a = e.target.closest && e.target.closest('a[href$=".html"]');
    if (!a || a.origin !== location.origin || warmed[a.href] || a.href === location.href) return;
    warmed[a.href] = 1;
    var l = document.createElement('link'); l.rel = 'prefetch'; l.href = a.href; document.head.appendChild(l);
  }
  ['pointerover', 'focusin', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, warm, { passive: true, capture: true }); });
  var cv = J.$('#field');
  try { var pp = localStorage.getItem('jaali:pattern'); if (pp && cv) { if (pp === 'none') cv.style.display = 'none'; else cv.dataset.pattern = pp; } } catch (e) {}
  J.mount();
  J.themePicker(J.$('#skinRow'), { toggle: J.$('#skinBtn'), panel: J.$('#skins') });
  J.$('#modeBtn').addEventListener('click', J.toggleMode);
  const prog = J.$('#prog');
  J.scrollSpy({ progress: prog });
  J.$$('[data-count]').forEach((el) => J.countUp(el));
  J.$$('.j-pivot[data-auto]').forEach((b) => J.pivot(b));
  J.sheen();
  var pl = J.$('#patList');
  if (pl && cv) {
    var saved = null; try { saved = localStorage.getItem('jaali:pattern'); } catch (e) {}
    J.$$('button', pl).forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.v === (saved || cv.dataset.pattern))); });
    pl.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      J.$$('button', pl).forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
      if (b.dataset.v === 'none') cv.style.display = 'none'; else { cv.style.display = ''; cv.dataset.pattern = b.dataset.v; }
      try { localStorage.setItem('jaali:pattern', b.dataset.v); } catch (err) {}
    });
  }
})();

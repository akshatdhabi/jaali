// Shared wiring for every docs page: theme, mode, lattice field, slide-ins, progress bar.
(function () {
  const J = window.Jaali;
  J.mount();
  J.jaaliField(J.$('#field'));
  J.themePicker(J.$('#skinRow'), { toggle: J.$('#skinBtn'), panel: J.$('#skins') });
  J.$('#modeBtn').addEventListener('click', J.toggleMode);
  const prog = J.$('#prog');
  J.scrollSpy({ progress: prog });
  J.$$('[data-count]').forEach((el) => J.countUp(el));
  J.$$('.j-pivot[data-auto]').forEach((b) => J.pivot(b));
})();

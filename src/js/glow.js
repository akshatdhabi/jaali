// Cursor glow for .j-glow surfaces: tells the CSS where the pointer is inside the element.
export function glow() {
  const move = (e) => {
    const g = e.target.closest && e.target.closest('.j-glow');
    if (!g) return;
    const r = g.getBoundingClientRect();
    g.style.setProperty('--mx', e.clientX - r.left + 'px');
    g.style.setProperty('--my', e.clientY - r.top + 'px');
  };
  addEventListener('pointermove', move, { passive: true });
  return () => removeEventListener('pointermove', move);
}

// Cursor glow for .j-glow surfaces: tells the CSS where the pointer is inside the element.
// The light trails the pointer a little, so it feels poured instead of snapped. Under
// reduced motion it goes straight to the pointer.
import { reduced } from './util.js';

export function glow() {
  const state = new Map();
  let raf = 0;

  const paint = (g, s) => {
    g.style.setProperty('--mx', s.x.toFixed(1) + 'px');
    g.style.setProperty('--my', s.y.toFixed(1) + 'px');
  };
  const step = () => {
    raf = 0;
    let more = false;
    state.forEach((s, g) => {
      s.x += (s.tx - s.x) * 0.17;
      s.y += (s.ty - s.y) * 0.17;
      paint(g, s);
      if (Math.abs(s.tx - s.x) > 0.4 || Math.abs(s.ty - s.y) > 0.4) more = true;
      else state.delete(g);
    });
    if (more) raf = requestAnimationFrame(step);
  };

  const move = (e) => {
    const g = e.target.closest && e.target.closest('.j-glow');
    if (!g) return;
    const r = g.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (reduced()) { paint(g, { x, y }); return; }
    let s = state.get(g);
    if (!s) { s = { x, y, tx: x, ty: y }; state.set(g, s); }
    s.tx = x; s.ty = y;
    if (!raf) raf = requestAnimationFrame(step);
  };
  addEventListener('pointermove', move, { passive: true });
  return () => { removeEventListener('pointermove', move); cancelAnimationFrame(raf); state.clear(); };
}

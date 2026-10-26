// The page-wide jaali field: one faint lattice behind everything that lights under the cursor.
import { reduced } from './util.js';

/**
 * Draw the lattice on a fixed canvas (<canvas class="j-field-canvas" aria-hidden="true">).
 * It draws itself in from the top right, drifts slowly, shifts a little with scroll, is
 * brighter while the hero is on screen, and glows around the pointer. Returns stop().
 */
export function jaaliField(cv, { cell = 28 } = {}) {
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, px = -999, py = -999, glowK = 0, hidden = false, stopped = false;
  const t0 = performance.now();
  let acc = '#F28DAE';
  const readAcc = () => { acc = getComputedStyle(document.documentElement).getPropertyValue('--j-accent').trim() || acc; };

  function size() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(now) {
    const t = (now - t0) / 1000;
    const R = cell;
    ctx.clearRect(0, 0, W, H);
    const sy = scrollY;
    const heroK = Math.max(0, 1 - sy / (H * 0.9));
    const base = 0.0414 + 0.069 * heroK;
    const r = reduced();
    const off = r ? 0 : (t * 3) % R;
    const oy = (sy * 0.15) % R;
    const cols = Math.ceil(W / R) + 2;
    const rows = Math.ceil(H / R) + 2;
    ctx.lineWidth = 0.8; ctx.strokeStyle = acc; ctx.fillStyle = acc;
    for (let j = -1; j < rows; j++) for (let i = -1; i < cols; i++) {
      const x = i * R + off, y = j * R - oy;
      const d = Math.hypot(W - x, y) / Math.hypot(W, H);
      const born = r ? 1 : Math.min(1, Math.max(0, (t * 0.6 - d * 0.9) * 3));
      if (born <= 0) continue;
      const near = Math.max(0, 1 - Math.hypot(x - px, y - py) / 220) * glowK;
      const a = (base + near * 0.6) * born;
      if (a < 0.02) continue;
      ctx.globalAlpha = a;
      ctx.beginPath(); ctx.arc(x, y, R * born, 0, Math.PI * 2); ctx.stroke();
      if (near > 0.05 && (i + j) % 2 === 0) {
        ctx.globalAlpha = Math.min(1, near * 0.88);
        ctx.beginPath(); ctx.arc(x, y, 1.4, 0, Math.PI * 2); ctx.fill();
      }
    }
    glowK = Math.max(0, glowK * 0.992);
    if (!r && !hidden && !stopped) requestAnimationFrame(draw);
  }

  const onMove = (e) => { px = e.clientX; py = e.clientY; glowK = 1; };
  const onResize = () => { size(); if (reduced()) draw(performance.now()); };
  const onScroll = () => { if (reduced()) draw(performance.now()); };
  const onVis = () => { hidden = document.hidden; if (!hidden && !reduced() && !stopped) requestAnimationFrame(draw); };
  const onTheme = () => { readAcc(); if (reduced()) draw(performance.now()); };

  readAcc(); size();
  addEventListener('resize', onResize);
  addEventListener('pointermove', onMove, { passive: true });
  addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', onVis);
  document.addEventListener('jaali:theme', onTheme);
  requestAnimationFrame(draw);

  return () => {
    stopped = true;
    removeEventListener('resize', onResize);
    removeEventListener('pointermove', onMove);
    removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', onVis);
    document.removeEventListener('jaali:theme', onTheme);
  };
}

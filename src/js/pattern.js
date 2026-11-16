// The calm backdrop: a thin Rajasthani pattern on a fixed canvas.
// It drifts slowly, leans a few pixels away from the pointer and lights up near it.
// Corners carry it and the middle stays clear, so content stays readable.
import { reduced } from './util.js';
import { getMode } from './theme.js';

/** The four patterns. Each is drawn as a continuous screen, not as a row of small icons. */
export const PATTERNS = ['ogee', 'win', 'bandhani', 'lehariya'];

// ogee: the trellis of pointed shapes in carved stone screens
// win: the arched windows of Hawa Mahal, each with a smaller arch inside
// bandhani: tie-dye dots, a ring of dots round a larger one
// lehariya: the wavy stripes of a Rajasthani turban
const CELL = { ogee: [60, 60], win: [56, 84], bandhani: [44, 44] };

/**
 * Draw a pattern on a canvas (<canvas class="j-pattern-canvas" aria-hidden="true">).
 * Returns { stop(), set(pattern) }. Under reduced motion it draws once and stays still.
 */
export function jaaliPattern(cv, { pattern = 'ogee' } = {}) {
  const ctx = cv.getContext('2d');
  const OGEE = new Path2D('M30 0C30 12 44 18 60 30C44 42 30 48 30 60C30 48 16 42 0 30C16 18 30 12 30 0Z');
  const WIN = new Path2D('M10 72V34C10 22 22 14 28 3C34 14 46 22 46 34V72');
  const WIN2 = new Path2D('M19 72V37C19 29 25 24 28 17C31 24 37 29 37 37V72');
  const DOTS = [[0, -11], [8, -8], [11, 0], [8, 8], [0, 11], [-8, 8], [-11, 0], [-8, -8]];
  const TAU = Math.PI * 2;

  let kind = PATTERNS.includes(pattern) ? pattern : 'ogee';
  let W = 0, H = 0, px = -999, py = -999, nx = 0, ny = 0, sx = 0, sy = 0, near = 0, nearT = 0, idleAt = 0;
  let acc = '#E4789F', frames = 0, raf = 0, stopped = false;
  const t0 = performance.now();

  const size = () => {
    const d = Math.min(2, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = W * d; cv.height = H * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
  };
  const fade = (x, y) => {
    const f1 = 1 - Math.min(1, Math.hypot((W - x) / (W * 0.62), y / (H * 0.55)));
    const f2 = 1 - Math.min(1, Math.hypot(x / (W * 0.46), (H - y) / (H * 0.5)));
    return Math.max(f1, f2, 0);
  };

  const cell = {
    ogee: (x, y) => { ctx.save(); ctx.translate(x, y); ctx.stroke(OGEE); ctx.restore(); },
    win: (x, y) => {
      ctx.save(); ctx.translate(x, y); ctx.stroke(WIN);
      ctx.globalAlpha *= 0.55; ctx.stroke(WIN2); ctx.restore();
    },
    bandhani: (x, y, n) => {
      ctx.save(); ctx.translate(x, y);
      for (const [dx, dy] of DOTS) { ctx.beginPath(); ctx.arc(dx, dy, 1.5 + n, 0, TAU); ctx.fill(); }
      ctx.beginPath(); ctx.arc(0, 0, 2.8 + n * 1.5, 0, TAU); ctx.fill(); ctx.restore();
    }
  };

  function waves(t, seg) {
    const ang = 0.36, ca = Math.cos(ang), sa = Math.sin(ang), gap = 28, step = 44;
    const x1 = W * ca + H * sa, y0 = -W * sa, y1 = H * ca;
    for (let yy = y0 - gap; yy < y1 + gap; yy += gap) {
      let ax = null, ay = null;
      for (let xx = -step; xx < x1 + step; xx += step) {
        const w = yy + 9 * Math.sin(xx / 70 + t * 0.55 + yy * 0.017);
        const bx = xx * ca - w * sa, by = xx * sa + w * ca;
        if (ax !== null) seg(ax, ay, bx, by);
        ax = bx; ay = by;
      }
    }
  }

  function draw(now) {
    raf = 0;
    if (stopped) return;
    if (document.hidden) { ctx.clearRect(0, 0, W, H); return; }
    const still = reduced();
    const t = still ? 0 : (now - t0) / 1000;
    if (frames++ % 30 === 0) acc = getComputedStyle(document.documentElement).getPropertyValue('--j-accent').trim() || acc;
    const light = getMode() === 'light';
    if (!still) {
      const tx = px < -900 ? 0 : (px / W - 0.5) * 2, ty = py < -900 ? 0 : (py / H - 0.5) * 2;
      sx += (tx - sx) * 0.05; sy += (ty - sy) * 0.05;
      nx += (px - nx) * 0.12; ny += (py - ny) * 0.12;
      if (performance.now() > idleAt) nearT = 0;
      near += (nearT - near) * 0.06;
    }
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = acc; ctx.fillStyle = acc;
    const base = light ? 0.2 : 0.24, boost = light ? 0.34 : 0.42;
    const lit = (x, y) => Math.pow(Math.max(0, 1 - Math.hypot(x - nx, y - ny) / 240), 1.6) * near;

    if (kind === 'lehariya') {
      waves(t, (ax, ay, bx, by) => {
        const mx = (ax + bx) / 2, my = (ay + by) / 2, n = lit(mx, my);
        const a = base * fade(mx, my) * 1.1 + n * boost;
        if (a < 0.015) return;
        ctx.globalAlpha = Math.min(0.8, a); ctx.lineWidth = 1.1 + n * 0.9;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      });
    } else {
      const [cw, ch] = CELL[kind];
      const dx = ((t * 5 - sx * 16) % cw + cw) % cw, dy = ((t * 3.2 - sy * 16) % ch + ch) % ch;
      const cols = Math.ceil(W / cw) + 2, rows = Math.ceil(H / ch) + 2;
      for (let j = -1; j < rows; j++) for (let i = -1; i < cols; i++) {
        const x = i * cw + dx, y = j * ch + dy, n = lit(x, y);
        const breath = still ? 0 : Math.sin(t * 0.6 + (i * 1.3 + j * 0.9)) * 0.12;
        const a = base * fade(x, y) * (1 + breath) + n * boost;
        if (a < 0.015) continue;
        ctx.globalAlpha = Math.min(0.8, a); ctx.lineWidth = 1.1 + n * 0.9;
        cell[kind](x, y, n);
      }
    }
    ctx.globalAlpha = 1;
    if (!still) raf = requestAnimationFrame(draw);
  }

  const kick = () => { if (!raf && !stopped) raf = requestAnimationFrame(draw); };
  const onMove = (e) => { px = e.clientX; py = e.clientY; nearT = 1; idleAt = performance.now() + 1800; kick(); };
  const onResize = () => { size(); kick(); };
  const mo = new MutationObserver(kick);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-mode', 'data-tier'] });
  addEventListener('pointermove', onMove, { passive: true });
  addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', kick);
  size(); kick();

  return {
    set(next) { if (PATTERNS.includes(next)) { kind = next; kick(); } },
    stop() {
      stopped = true; cancelAnimationFrame(raf); mo.disconnect();
      removeEventListener('pointermove', onMove); removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', kick);
      ctx.clearRect(0, 0, W, H);
    }
  };
}

// The calm backdrop: a thin Rajasthani pattern behind the page.
// It drifts slowly, leans a few pixels away from the pointer and lights up near it.
// Corners carry it and the middle stays clear, so content stays readable.
//
// Cost, because canvases that cover the screen are the most expensive thing on a page:
// - no full-screen canvas. The pattern lives in two corner canvases that together cover about half
//   the screen, and the pointer light is a small canvas that follows the pointer by transform.
// - each corner is one cached tile drawn as a single fill and faded by one baked mask. It redraws
//   only when the drift has moved a whole pixel (about 8 times a second), not every frame.
// - the pointer light redraws at about 30 frames a second, only while you move the pointer, then hides itself.
// - it stops when the tab is hidden, and after 45 seconds with no pointer, scroll or key. Any input wakes it.
// - under reduced motion it draws once and stays still.
import { reduced } from './util.js';
import { getMode } from './theme.js';

/** The four patterns. Each is drawn as a continuous screen, not as a row of small icons. */
export const PATTERNS = ['ogee', 'win', 'bandhani', 'lehariya'];

// ogee: the trellis of pointed shapes in carved stone screens
// win: the arched windows of Hawa Mahal, each with a smaller arch inside
// bandhani: tie-dye dots, a ring of dots round a larger one
// lehariya: the wavy stripes of a Rajasthani turban (drawn as lines, since it flows)
const CELL = { ogee: [60, 60], win: [56, 84], bandhani: [44, 44] };
const TAU = Math.PI * 2;
const FRAME = 1000 / 60;
const IDLE_CHECK = 100;       // ms between drift checks when nothing is moving
const SLEEP_AFTER = 45000;    // ms without input before the drift stops
const RADIUS = 240;           // how far the pointer light reaches
const DOTS = [[0, -11], [8, -8], [11, 0], [8, 8], [0, 11], [-8, 8], [-11, 0], [-8, -8]];

/**
 * Draw a pattern behind the page. Pass the <canvas class="j-pattern-canvas" aria-hidden="true">
 * from your page: it becomes the top right corner, and the library adds the other two canvases beside it.
 * Switch pattern with set() or by changing the canvas's data-pattern. Returns { set(pattern), stop() }.
 */
export function jaaliPattern(cv, { pattern = 'ogee' } = {}) {
  const mk = () => { const c = document.createElement('canvas'); c.className = cv.className; c.setAttribute('aria-hidden', 'true'); cv.after(c); return c; };
  const bl = mk();                       // bottom left corner
  const ov = mk();                       // the pointer light
  ov.style.display = 'none';
  const corner = [{ c: cv, g: cv.getContext('2d') }, { c: bl, g: bl.getContext('2d') }];
  const octx = ov.getContext('2d');

  // paths are made here, not at import, so the module can be imported where there is no canvas (server rendering, tests)
  const OGEE = new Path2D('M30 0C30 12 44 18 60 30C44 42 30 48 30 60C30 48 16 42 0 30C16 18 30 12 30 0Z');
  const WIN = new Path2D('M10 72V34C10 22 22 14 28 3C34 14 46 22 46 34V72');
  const WIN2 = new Path2D('M19 72V37C19 29 25 24 28 17C31 24 37 29 37 37V72');

  let kind = PATTERNS.includes(pattern) ? pattern : 'ogee';
  let W = 0, H = 0, dpr = 1, S = 0;
  let px = -999, py = -999, nx = 0, ny = 0, sx = 0, sy = 0, near = 0, nearT = 0, idleAt = 0, lastInput = performance.now();
  let acc = '#E4789F', light = false;
  let tile = null, boxes = [], masks = [], pats = [];
  let raf = 0, timer = 0, stopped = false, lastTick = 0, lastBase = 0, lastFrame = 0;
  let needBase = true, lastDX = NaN, lastDY = NaN, ovOn = false;
  const t0 = performance.now();

  const readColour = () => {
    acc = getComputedStyle(document.documentElement).getPropertyValue('--j-accent').trim() || acc;
    light = getMode() === 'light';
  };

  function motif(g) {
    if (kind === 'ogee') { g.stroke(OGEE); return; }
    if (kind === 'win') { g.stroke(WIN); g.globalAlpha = 0.55; g.stroke(WIN2); g.globalAlpha = 1; return; }
    for (const [dx, dy] of DOTS) { g.beginPath(); g.arc(dx, dy, 1.5, 0, TAU); g.fill(); }
    g.beginPath(); g.arc(0, 0, 2.8, 0, TAU); g.fill();
  }

  // the tile for the current pattern and colour, drawn once
  function buildTile() {
    tile = null; pats = []; needBase = true;
    if (kind === 'lehariya') return;
    const [cw, ch] = CELL[kind];
    const c = document.createElement('canvas');
    c.width = Math.round(cw * dpr); c.height = Math.round(ch * dpr);
    const g = c.getContext('2d');
    g.scale(c.width / cw, c.height / ch);
    g.strokeStyle = acc; g.fillStyle = acc; g.lineWidth = 1.1;
    const at = kind === 'bandhani' ? [[0, 0], [cw, 0], [0, ch], [cw, ch]] : [[0, 0]];
    for (const [x, y] of at) { g.save(); g.translate(x, y); motif(g); g.restore(); }
    tile = c;
    pats = corner.map((k) => k.g.createPattern(c, 'repeat'));
  }

  // the two corners, and a fade for each: strong at the screen corner, clear toward the middle. Baked once per size.
  function layout() {
    boxes = [
      { x: W * 0.38, y: 0, w: W * 0.62, h: H * 0.55, cx: W, cy: 0, rx: W * 0.62, ry: H * 0.55 },      // top right
      { x: 0, y: H * 0.5, w: W * 0.46, h: H * 0.5, cx: 0, cy: H, rx: W * 0.46, ry: H * 0.5 }          // bottom left
    ];
    masks = boxes.map((b) => {
      const m = document.createElement('canvas');
      m.width = Math.round(b.w * dpr); m.height = Math.round(b.h * dpr);
      const g = m.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, -b.x * dpr, -b.y * dpr);
      g.translate(b.cx, b.cy); g.scale(b.rx, b.ry);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.fill();
      return m;
    });
    corner.forEach((k, i) => {
      const b = boxes[i], c = k.c, st = c.style;
      c.width = Math.round(b.w * dpr); c.height = Math.round(b.h * dpr);
      st.inset = 'auto'; st.left = b.x + 'px'; st.top = b.y + 'px';
      st.width = b.w + 'px'; st.height = b.h + 'px';
    });
  }

  function size() {
    dpr = Math.min(1.5, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    S = (RADIUS + 70) * 2;
    ov.width = Math.round(S * dpr); ov.height = Math.round(S * dpr);
    ov.style.inset = '0 auto auto 0'; ov.style.width = S + 'px'; ov.style.height = S + 'px';
    layout(); buildTile();
  }

  const fade = (x, y) => {
    const f1 = 1 - Math.min(1, Math.hypot((W - x) / (W * 0.62), y / (H * 0.55)));
    const f2 = 1 - Math.min(1, Math.hypot(x / (W * 0.46), (H - y) / (H * 0.5)));
    return Math.max(f1, f2, 0);
  };

  // lehariya: walk the flowing diagonal lines, calling seg(ax, ay, bx, by, midX, midY) for each piece on screen
  function waves(t, seg) {
    const ang = 0.36, ca = Math.cos(ang), sa = Math.sin(ang), gap = 30, step = 52;
    const x1 = W * ca + H * sa, y0 = -W * sa, y1 = H * ca;
    for (let yy = y0 - gap; yy < y1 + gap; yy += gap) {
      let ax = null, ay = null;
      for (let xx = -step; xx < x1 + step; xx += step) {
        const w = yy + 9 * Math.sin(xx / 70 + t * 0.55 + yy * 0.017);
        const bx = xx * ca - w * sa, by = xx * sa + w * ca;
        if (ax !== null) {
          const mx = (ax + bx) / 2, my = (ay + by) / 2;
          if (mx > -60 && mx < W + 60 && my > -60 && my < H + 60) seg(ax, ay, bx, by, mx, my);
        }
        ax = bx; ay = by;
      }
    }
  }
  const within = (b, x, y) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;

  // ---- corners: redrawn only when the drift has moved a pixel ----
  function drawBase(t, dx, dy, base) {
    const STEPS = 12;
    const lines = kind === 'lehariya' ? boxes.map(() => Array.from({ length: STEPS + 1 }, () => null)) : null;
    if (lines) {
      waves(t, (ax, ay, bx, by, mx, my) => {
        const a = base * fade(mx, my) * 1.1;
        if (a < 0.015) return;
        const k = Math.min(STEPS, Math.round(a / 0.8 * STEPS));
        for (let i = 0; i < boxes.length; i++) {
          if (!within(boxes[i], mx, my)) continue;
          const p = lines[i][k] || (lines[i][k] = new Path2D());
          p.moveTo(ax, ay); p.lineTo(bx, by);
          break;
        }
      });
    }
    corner.forEach((kc, i) => {
      const b = boxes[i], g = kc.g;
      g.setTransform(dpr, 0, 0, dpr, -b.x * dpr, -b.y * dpr);
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      g.clearRect(b.x, b.y, b.w, b.h);
      if (lines) {
        g.strokeStyle = acc; g.lineWidth = 1.1;
        for (let k = 1; k <= STEPS; k++) if (lines[i][k]) { g.globalAlpha = (k / STEPS) * 0.8; g.stroke(lines[i][k]); }
        g.globalAlpha = 1;
        return;
      }
      const [cw, ch] = CELL[kind];
      pats[i].setTransform(new DOMMatrix().translate(dx, dy).scale(cw / tile.width, ch / tile.height));
      g.fillStyle = pats[i]; g.globalAlpha = base;
      g.fillRect(b.x, b.y, b.w, b.h);
      g.globalAlpha = 1; g.globalCompositeOperation = 'destination-in';
      g.drawImage(masks[i], b.x, b.y, b.w, b.h);
      g.globalCompositeOperation = 'source-over';
    });
  }

  // ---- the pointer light: a small canvas that follows the pointer ----
  function drawOverlay(t, dx, dy, boost) {
    const ox = nx - S / 2, oy = ny - S / 2;
    ov.style.transform = `translate3d(${ox.toFixed(1)}px,${oy.toFixed(1)}px,0)`;
    octx.setTransform(1, 0, 0, 1, 0, 0);
    octx.globalCompositeOperation = 'source-over'; octx.globalAlpha = 1;
    octx.clearRect(0, 0, ov.width, ov.height);
    octx.setTransform(dpr, 0, 0, dpr, -ox * dpr, -oy * dpr);
    if (kind === 'lehariya') {
      octx.strokeStyle = acc; octx.lineWidth = 1.6;
      waves(t, (ax, ay, bx, by, mx, my) => {
        if (Math.abs(mx - nx) > RADIUS || Math.abs(my - ny) > RADIUS) return;
        const n = Math.pow(Math.max(0, 1 - Math.hypot(mx - nx, my - ny) / RADIUS), 1.6) * near;
        const a = n * boost;
        if (a < 0.015) return;
        octx.globalAlpha = Math.min(0.8, a);
        octx.beginPath(); octx.moveTo(ax, ay); octx.lineTo(bx, by); octx.stroke();
      });
    } else {
      const [cw, ch] = CELL[kind];
      const i0 = Math.floor((nx - RADIUS - dx) / cw) - 1, i1 = Math.ceil((nx + RADIUS - dx) / cw);
      const j0 = Math.floor((ny - RADIUS - dy) / ch) - 1, j1 = Math.ceil((ny + RADIUS - dy) / ch);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const x = i * cw + dx, y = j * ch + dy;
        const n = Math.pow(Math.max(0, 1 - Math.hypot(x - nx, y - ny) / RADIUS), 1.6) * near;
        const a = n * boost;
        if (a < 0.015) continue;
        octx.globalAlpha = Math.min(0.8, a);
        octx.drawImage(tile, x, y, cw, ch);
      }
    }
    octx.globalAlpha = 1;
  }

  function loop(now) {
    raf = 0;
    if (stopped) return;
    // follow the page hiding the canvas (pattern "none")
    const hidden = cv.style.display === 'none';
    if (bl.style.display !== cv.style.display) bl.style.display = cv.style.display;
    if (document.hidden || hidden) { if (ovOn) { ov.style.display = 'none'; ovOn = false; } return; }
    const still = reduced();
    // the light follows the pointer at about 30 frames a second. Smoothing hides the gap, and every
    // frame drawn is a frame the browser has to composite.
    if (!still && (near > 0.01 || nearT > 0) && now - lastFrame < 28) { schedule(true); return; }
    lastFrame = now;
    const base = light ? 0.2 : 0.24, boost = light ? 0.34 : 0.42;
    const t = still ? 0 : (now - t0) / 1000;
    if (!still) {
      const dt = Math.min(64, Math.max(1, now - (lastTick || now - FRAME))) / FRAME;
      lastTick = now;
      const k = (r) => 1 - Math.pow(1 - r, dt);
      const tx = px < -900 ? 0 : (px / W - 0.5) * 2, ty = py < -900 ? 0 : (py / H - 0.5) * 2;
      sx += (tx - sx) * k(0.05); sy += (ty - sy) * k(0.05);
      nx += (px - nx) * k(0.12); ny += (py - ny) * k(0.12);
      if (performance.now() > idleAt) nearT = 0;
      near += (nearT - near) * k(0.06);
    }
    const cw = kind === 'lehariya' ? 1 : CELL[kind][0], ch = kind === 'lehariya' ? 1 : CELL[kind][1];
    const dx = Math.round(((t * 5 - sx * 16) % cw + cw) % cw), dy = Math.round(((t * 3.2 - sy * 16) % ch + ch) % ch);
    const moved = dx !== lastDX || dy !== lastDY;
    // corners: only when something about them changed. Lehariya flows, so it also refreshes on a timer.
    const wavesDue = kind === 'lehariya' && !still && now - lastBase > (near > 0.01 ? 50 : 120);
    if (needBase || (kind !== 'lehariya' && moved) || wavesDue) {
      drawBase(t, dx, dy, base); lastDX = dx; lastDY = dy; lastBase = now; needBase = false;
    }
    // the light: only while it is up, then hide the canvas so it costs nothing
    if (near > 0.01) {
      if (!ovOn) { ov.style.display = ''; ovOn = true; }
      drawOverlay(t, dx, dy, boost);
    } else if (ovOn) { ov.style.display = 'none'; ovOn = false; }
    if (still) return;
    const active = near > 0.01 || nearT > 0;
    if (now - lastInput > SLEEP_AFTER && !active) return;   // asleep until the next input
    schedule(active);
  }
  // active: every frame. At rest: a cheap check about ten times a second.
  function schedule(active) {
    if (raf || timer || stopped) return;
    if (active) raf = requestAnimationFrame(loop);
    else timer = setTimeout(() => { timer = 0; if (!raf && !stopped) raf = requestAnimationFrame(loop); }, IDLE_CHECK);
  }
  const kick = () => { clearTimeout(timer); timer = 0; if (!raf && !stopped) raf = requestAnimationFrame(loop); };
  const wake = () => { lastInput = performance.now(); kick(); };

  const onMove = (e) => { px = e.clientX; py = e.clientY; nearT = 1; idleAt = performance.now() + 1800; wake(); };
  const onResize = () => { size(); kick(); };
  const onTheme = () => { readColour(); buildTile(); kick(); };
  const mo = new MutationObserver(onTheme);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-mode'] });
  const attr = new MutationObserver(() => {
    const v = cv.dataset.pattern;
    if (PATTERNS.includes(v) && v !== kind) { kind = v; buildTile(); }
    needBase = true; kick();
  });
  attr.observe(cv, { attributes: true, attributeFilter: ['data-pattern', 'style'] });
  addEventListener('pointermove', onMove, { passive: true });
  addEventListener('scroll', wake, { passive: true });
  addEventListener('keydown', wake);
  addEventListener('touchstart', wake, { passive: true });
  addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', kick);
  readColour(); size(); kick();

  return {
    set(next) { if (PATTERNS.includes(next) && next !== kind) { kind = next; buildTile(); kick(); } },
    stop() {
      stopped = true; cancelAnimationFrame(raf); clearTimeout(timer); mo.disconnect(); attr.disconnect();
      removeEventListener('pointermove', onMove); removeEventListener('scroll', wake);
      removeEventListener('keydown', wake); removeEventListener('touchstart', wake);
      removeEventListener('resize', onResize); document.removeEventListener('visibilitychange', kick);
      for (const k of corner) k.g.clearRect(0, 0, k.c.width, k.c.height);
      bl.remove(); ov.remove();
      for (const p of ['inset', 'left', 'top', 'width', 'height']) cv.style[p] = '';
    }
  };
}

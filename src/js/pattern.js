// The calm backdrop: a thin Rajasthani pattern behind the page.
// It drifts slowly, leans a few pixels away from the pointer and lights up near it.
// Corners carry it and the middle stays clear, so content stays readable.
//
// How it stays smooth and cheap: the pattern is drawn once. The drift is a compositor animation
// (a transform), so the browser moves a finished picture instead of redrawing it, and it is as
// smooth as scrolling. The corner fade is a static layer. The pointer light is a second copy of the
// pattern, brighter, shown through a round mask that follows the pointer by transform. There is no
// per-frame canvas drawing for ogee, win or bandhani. Lehariya flows as a wave, so it is still drawn
// frame by frame on its own canvas.
import { reduced } from './util.js';
import { getMode } from './theme.js';

/** The four patterns. Each is drawn as a continuous screen, not as a row of small icons. */
export const PATTERNS = ['ogee', 'win', 'bandhani', 'lehariya'];

// ogee: the trellis of pointed shapes in carved stone screens
// win: the arched windows of Hawa Mahal, each with a smaller arch inside
// bandhani: tie-dye dots, a ring of dots round a larger one
// lehariya: the wavy stripes of a Rajasthani turban
const CELL = { ogee: [60, 60], win: [56, 84], bandhani: [44, 44] };
const TAU = Math.PI * 2;
const DRIFT = 4;        // px per second along x. y follows the cell shape so the loop is seamless
const LEAN = 16;        // px the pattern leans away from the pointer
const RADIUS = 240;     // how far the pointer light reaches
const LIT_FOR = 1800;   // ms the light stays up after the pointer stops
const FRAME = 1000 / 60;
const DOTS = [[0, -11], [8, -8], [11, 0], [8, 8], [0, 11], [-8, 8], [-11, 0], [-8, -8]];
const mod = (a, n) => ((a % n) + n) % n;

/**
 * Draw a pattern behind the page. Pass <div class="j-pattern" aria-hidden="true">: the library fills it.
 * Switch pattern with set() or by changing the element's data-pattern. Hide the pattern with
 * style.display = 'none'. Returns { set(pattern), stop() }.
 */
export function jaaliPattern(host, { pattern = 'ogee' } = {}) {
  if (!host || host.tagName === 'CANVAS') throw new TypeError('jaaliPattern needs a <div class="j-pattern">, not a canvas');
  // paths are made here, not at import, so the module can be imported where there is no canvas (server rendering, tests)
  const OGEE = new Path2D('M30 0C30 12 44 18 60 30C44 42 30 48 30 60C30 48 16 42 0 30C16 18 30 12 30 0Z');
  const WIN = new Path2D('M10 72V34C10 22 22 14 28 3C34 14 46 22 46 34V72');
  const WIN2 = new Path2D('M19 72V37C19 29 25 24 28 17C31 24 37 29 37 37V72');

  let kind = PATTERNS.includes(pattern) ? pattern : 'ogee';
  let W = 0, H = 0, dpr = 1, acc = '#E4789F', lightMode = false;
  let corners = [], lightEl = null, lightTile = null, anim = null, dur = 1, legacy = null;
  let px = -999, py = -999, nx = 0, ny = 0, sx = 0, sy = 0, tx = 0, ty = 0, seen = false, idleAt = 0, lit = false;
  let raf = 0, lastTick = 0, stopped = false, resizeT = 0;

  const readColour = () => {
    acc = getComputedStyle(document.documentElement).getPropertyValue('--j-accent').trim() || acc;
    lightMode = getMode() === 'light';
  };
  const div = (cls) => { const d = document.createElement('div'); d.className = cls; return d; };

  function motif(g) {
    if (kind === 'ogee') { g.stroke(OGEE); return; }
    if (kind === 'win') { g.stroke(WIN); g.globalAlpha = 0.55; g.stroke(WIN2); g.globalAlpha = 1; return; }
    for (const [dx, dy] of DOTS) { g.beginPath(); g.arc(dx, dy, 1.5, 0, TAU); g.fill(); }
    g.beginPath(); g.arc(0, 0, 2.8, 0, TAU); g.fill();
  }

  // one cell of the pattern in the accent colour, drawn once
  function makeCell() {
    const [cw, ch] = CELL[kind];
    const c = document.createElement('canvas');
    c.width = Math.round(cw * dpr); c.height = Math.round(ch * dpr);
    const g = c.getContext('2d');
    g.scale(c.width / cw, c.height / ch);
    g.strokeStyle = acc; g.fillStyle = acc; g.lineWidth = 1.1;
    const at = kind === 'bandhani' ? [[0, 0], [cw, 0], [0, ch], [cw, ch]] : [[0, 0]];
    for (const [x, y] of at) { g.save(); g.translate(x, y); motif(g); g.restore(); }
    return c;
  }

  // a canvas of w x h css pixels filled with the repeating cell. Its origin is a cell origin.
  function paint(cell, w, h) {
    const [cw, ch] = CELL[kind];
    const c = document.createElement('canvas');
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    c.className = 'j-pattern-tile';
    c.style.width = w + 'px'; c.style.height = h + 'px';
    const g = c.getContext('2d');
    g.scale(dpr, dpr);
    const pat = g.createPattern(cell, 'repeat');
    pat.setTransform(new DOMMatrix().scale(cw / cell.width, ch / cell.height));
    g.fillStyle = pat; g.fillRect(0, 0, w, h);
    return c;
  }

  function teardown() {
    if (anim) { anim.cancel(); anim = null; }
    if (legacy) { legacy.stop(); legacy = null; }
    cancelAnimationFrame(raf); raf = 0;
    host.replaceChildren();
    corners = []; lightEl = null; lightTile = null; lit = false;
  }

  function build() {
    teardown();
    readColour();
    dpr = Math.min(1.5, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    if (kind === 'lehariya') { legacy = startWaves(); return; }

    const [cw, ch] = CELL[kind];
    const cell = makeCell();
    const base = lightMode ? 0.2 : 0.24, boost = lightMode ? 0.34 : 0.42;
    dur = cw / DRIFT * 1000;
    const still = reduced();
    const frames = [{ transform: 'translate3d(0,0,0)' }, { transform: `translate3d(${cw}px,${ch}px,0)` }];

    // the two corners: box, and a fade (a static layer of the page colour that thickens away from the corner)
    const boxes = [
      { x: W * 0.38, y: 0, w: W * 0.62, h: H * 0.55, at: '100% 0%' },     // top right
      { x: 0, y: H * 0.5, w: W * 0.46, h: H * 0.5, at: '0% 100%' }        // bottom left
    ];
    corners = boxes.map((b) => {
      const el = div('j-pattern-corner');
      el.style.cssText = `left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px`;
      // the canvas origin stays on the global cell grid, three cells to the left and above, so the drift never shows an edge
      const cvn = paint(cell, b.w + cw * 5, b.h + ch * 5);
      cvn.style.left = (mod(-b.x, cw) - cw * 3) + 'px';
      cvn.style.top = (mod(-b.y, ch) - ch * 3) + 'px';
      cvn.style.opacity = base;
      const fog = div('j-pattern-fog');
      fog.style.background = `radial-gradient(ellipse ${b.w}px ${b.h}px at ${b.at}, transparent 0%, var(--j-ground) 100%)`;
      el.append(cvn, fog); host.append(el);
      return { el, cvn, b };
    });
    if (!still) {
      // one clock for everything: the first corner's animation. The others share its start, and the light reads it.
      anim = corners[0].cvn.animate(frames, { duration: dur, iterations: Infinity, easing: 'linear' });
      for (let i = 1; i < corners.length; i++) {
        const a = corners[i].cvn.animate(frames, { duration: dur, iterations: Infinity, easing: 'linear' });
        a.startTime = anim.startTime;
      }
    }

    // the pointer light
    const S = (RADIUS + 70) * 2;
    lightEl = div('j-pattern-light');
    lightEl.style.cssText = `width:${S}px;height:${S}px`;
    lightTile = paint(cell, S + cw * 5, S + ch * 5);
    lightTile.style.opacity = boost;
    lightEl.append(lightTile); host.append(lightEl);
    lightEl._S = S;
    if (seen) place();
  }

  // where the drift is now, in px, from the shared clock
  function drift() {
    const [cw, ch] = CELL[kind];
    if (!anim) return [0, 0];
    const p = mod(+anim.currentTime, dur) / dur;
    return [p * cw, p * ch];
  }

  function place() {
    const [cw, ch] = CELL[kind];
    const S = lightEl._S, ox = nx - S / 2, oy = ny - S / 2;
    lightEl.style.transform = `translate3d(${ox.toFixed(1)}px,${oy.toFixed(1)}px,0)`;
    const [dx, dy] = drift();
    // keep the light's copy of the pattern on the same grid as the corners
    lightTile.style.translate = `${mod(dx - sx * LEAN - ox, cw) - cw * 3}px ${mod(dy - sy * LEAN - oy, ch) - ch * 3}px`;
    for (const c of corners) c.cvn.style.translate = `${-sx * LEAN}px ${-sy * LEAN}px`;
  }

  // runs only while the pointer is moving or the light is up, and does nothing but set a few transforms
  function tick(now) {
    raf = 0;
    if (stopped || !lightEl) return;
    const dt = Math.min(64, Math.max(1, now - (lastTick || now - FRAME))) / FRAME;
    lastTick = now;
    const k = (r) => 1 - Math.pow(1 - r, dt);
    tx = px < -900 ? 0 : (px / W - 0.5) * 2; ty = py < -900 ? 0 : (py / H - 0.5) * 2;
    sx += (tx - sx) * k(0.05); sy += (ty - sy) * k(0.05);
    nx += (px - nx) * k(0.12); ny += (py - ny) * k(0.12);
    place();
    if (lit && performance.now() > idleAt) { lit = false; lightEl.classList.remove('is-lit'); }
    const settling = Math.abs(tx - sx) > 0.002 || Math.abs(ty - sy) > 0.002 || Math.abs(px - nx) > 0.2 || Math.abs(py - ny) > 0.2;
    if (lit || settling) raf = requestAnimationFrame(tick); else lastTick = 0;
  }

  const onMove = (e) => {
    if (reduced() || !lightEl || host.style.display === 'none') return;
    px = e.clientX; py = e.clientY;
    if (!seen) { nx = px; ny = py; seen = true; }
    idleAt = performance.now() + LIT_FOR;
    if (!lit) { lit = true; lightEl.classList.add('is-lit'); }
    if (!raf) raf = requestAnimationFrame(tick);
  };

  // ---- lehariya: the wave flows, so it is drawn frame by frame on one canvas ----
  function startWaves() {
    const cv = document.createElement('canvas');
    cv.className = 'j-pattern-legacy';
    host.append(cv);
    const ctx = cv.getContext('2d');
    const t0 = performance.now();
    let wpx = -999, wpy = -999, wnx = 0, wny = 0, near = 0, nearT = 0, idle = 0, wraf = 0, wlast = 0, off = false;
    const fade = (x, y) => {
      const f1 = 1 - Math.min(1, Math.hypot((W - x) / (W * 0.62), y / (H * 0.55)));
      const f2 = 1 - Math.min(1, Math.hypot(x / (W * 0.46), (H - y) / (H * 0.5)));
      return Math.max(f1, f2, 0);
    };
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    function frame(now) {
      wraf = 0;
      if (off || document.hidden) return;
      const still = reduced();
      const t = still ? 0 : (now - t0) / 1000;
      const base = lightMode ? 0.2 : 0.24, boost = lightMode ? 0.34 : 0.42;
      if (!still) {
        const dt = Math.min(64, Math.max(1, now - (wlast || now - FRAME))) / FRAME; wlast = now;
        const k = (r) => 1 - Math.pow(1 - r, dt);
        wnx += (wpx - wnx) * k(0.12); wny += (wpy - wny) * k(0.12);
        if (performance.now() > idle) nearT = 0;
        near += (nearT - near) * k(0.06);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = acc; ctx.lineWidth = 1.1;
      const ang = 0.36, ca = Math.cos(ang), sa = Math.sin(ang), gap = 28, step = 44;
      const x1 = W * ca + H * sa, y0 = -W * sa, y1 = H * ca;
      for (let yy = y0 - gap; yy < y1 + gap; yy += gap) {
        let ax = null, ay = null;
        for (let xx = -step; xx < x1 + step; xx += step) {
          const w = yy + 9 * Math.sin(xx / 70 + t * 0.55 + yy * 0.017);
          const bx = xx * ca - w * sa, by = xx * sa + w * ca;
          if (ax !== null) {
            const mx = (ax + bx) / 2, my = (ay + by) / 2;
            const n = Math.pow(Math.max(0, 1 - Math.hypot(mx - wnx, my - wny) / RADIUS), 1.6) * near;
            const a = base * fade(mx, my) * 1.1 + n * boost;
            if (a >= 0.015) { ctx.globalAlpha = Math.min(0.8, a); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); }
          }
          ax = bx; ay = by;
        }
      }
      ctx.globalAlpha = 1;
      if (!still) wraf = requestAnimationFrame(frame);
    }
    const move = (e) => { if (!reduced()) { wpx = e.clientX; wpy = e.clientY; nearT = 1; idle = performance.now() + LIT_FOR; } };
    const vis = () => { if (!wraf && !off) wraf = requestAnimationFrame(frame); };
    addEventListener('pointermove', move, { passive: true });
    document.addEventListener('visibilitychange', vis);
    wraf = requestAnimationFrame(frame);
    return { stop() { off = true; cancelAnimationFrame(wraf); removeEventListener('pointermove', move); document.removeEventListener('visibilitychange', vis); } };
  }

  const onResize = () => { clearTimeout(resizeT); resizeT = setTimeout(() => { if (!stopped) build(); }, 150); };
  const mo = new MutationObserver(() => { if (!stopped) build(); });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-mode'] });
  const attr = new MutationObserver(() => {
    const v = host.dataset.pattern;
    if (PATTERNS.includes(v) && v !== kind) { kind = v; build(); }
  });
  attr.observe(host, { attributes: true, attributeFilter: ['data-pattern'] });
  addEventListener('pointermove', onMove, { passive: true });
  addEventListener('resize', onResize);
  build();

  return {
    set(next) { if (PATTERNS.includes(next) && next !== kind) { kind = next; build(); } },
    stop() {
      stopped = true; clearTimeout(resizeT); mo.disconnect(); attr.disconnect();
      removeEventListener('pointermove', onMove); removeEventListener('resize', onResize);
      teardown();
    }
  };
}

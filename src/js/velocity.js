// Scroll speed as a shared motion input.
// 0 at rest, 1 on a fast flick. The lattice reads it, and CSS can too:
// html gets --j-velocity, so `animation-duration: calc(4s - 3s * var(--j-velocity))` works.
import { reduced } from './util.js';

let v = 0, target = 0, raf = 0, last = 0, lastY = 0, lastT = 0, users = 0, cap = 4000;
const subs = new Set();

/** Scroll distance over time, as a 0..1 target. Pure, so it can be tested. */
export const speedToTarget = (px, ms, max = 4000) => Math.min(1, Math.max(0, Math.abs(px) / Math.max(8, ms) * 1000 / max));

/** Current eased velocity, 0..1. */
export const getVelocity = () => (v > 0 ? v : 0);

/** Call fn(v) on each frame while the velocity is moving. Returns unsubscribe. */
export function onVelocity(fn) { subs.add(fn); return () => subs.delete(fn); }

/** One easing step. dt is clamped to 0..0.05s, so a timestamp that runs backwards cannot push v below 0. Pure. */
export function easeVelocity(v0, t0, dt) {
  const d = Math.min(0.05, Math.max(0, dt));
  const t = t0 * Math.pow(0.04, d);
  const v = Math.min(1, Math.max(0, v0 + (t - v0) * Math.min(1, d * 4)));
  return [v, t];
}

function tick(now) {
  [v, target] = easeVelocity(v, target, (now - last) / 1000); last = now;
  if (v < 0.001 && target < 0.001) { v = 0; target = 0; raf = 0; }
  document.documentElement.style.setProperty('--j-velocity', v.toFixed(3));
  subs.forEach((fn) => fn(v));
  if (raf) raf = requestAnimationFrame(tick);
}

function onScroll() {
  const now = performance.now();
  const t = speedToTarget(scrollY - lastY, now - lastT, cap);
  lastY = scrollY; lastT = now;
  if (reduced()) return;
  target = Math.max(target, t);
  if (!raf) { last = now; raf = requestAnimationFrame(tick); }
}

/**
 * Start tracking scroll speed. Safe to call more than once; the listener is shared.
 * `max` is the speed in px/s that counts as 1. Returns stop().
 */
export function velocity({ max = 4000 } = {}) {
  cap = max;
  if (users++ === 0) {
    lastY = scrollY; lastT = performance.now();
    addEventListener('scroll', onScroll, { passive: true });
  }
  return () => {
    if (--users > 0) return;
    removeEventListener('scroll', onScroll);
    if (raf) cancelAnimationFrame(raf);
    raf = 0; v = 0; target = 0;
    document.documentElement.style.removeProperty('--j-velocity');
  };
}

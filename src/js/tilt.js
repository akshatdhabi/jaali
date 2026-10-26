// Press tilt: the surface tips toward your finger and settles back.
import { $$, reduced } from './util.js';

export function tilt(el) {
  el.addEventListener('pointerdown', (e) => {
    if (reduced()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transitionDuration = '.12s';
    el.style.transform = `perspective(900px) rotateX(${-y * 10}deg) rotateY(${x * 12}deg) scale(.975)`;
  });
  const up = () => { el.style.transitionDuration = ''; el.style.transform = ''; };
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => el.addEventListener(ev, up));
}

/** Tilt every [data-j-tilt] under root. */
export const tiltAll = (root = document) => $$('[data-j-tilt]', root).forEach(tilt);

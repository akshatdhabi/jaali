// Live tiles: tap to flip, and a random tile with a back face turns itself over now and then.
import { $$, reduced } from './util.js';
import { tilt } from './tilt.js';

/** Give each tile its column and row so the turn-in animation staggers across the grid. */
export function placeTiles(hub) {
  const hr = hub.getBoundingClientRect();
  const cs = getComputedStyle(hub);
  const cw = hr.width / cs.gridTemplateColumns.split(' ').length;
  const rh = parseFloat(cs.gridAutoRows) || 120;
  $$('.j-live', hub).forEach((t) => {
    const r = t.getBoundingClientRect();
    t.style.setProperty('--c', Math.round((r.left - hr.left) / cw));
    t.style.setProperty('--r', Math.round((r.top - hr.top) / rh));
  });
}

/**
 * Wire a .j-hub. Tiles marked data-j-live have a back face. Returns { stop, place }.
 * interval: ms between automatic flips. hold: ms a tile stays flipped.
 */
export function liveTiles(hub, { interval = 2200, hold = 2800 } = {}) {
  placeTiles(hub);
  const tiles = $$('.j-live', hub);
  tiles.forEach((t) => {
    tilt(t);
    t.addEventListener('click', () => { if (t.hasAttribute('data-j-live')) t.classList.toggle('is-flip'); });
  });
  const live = tiles.filter((t) => t.hasAttribute('data-j-live'));
  let timer = null;
  if (!reduced() && live.length) {
    timer = setInterval(() => {
      const t = live[Math.floor(Math.random() * live.length)];
      if (t.classList.contains('is-flip')) return;
      t.classList.add('is-flip');
      setTimeout(() => t.classList.remove('is-flip'), hold);
    }, interval);
  }
  const place = () => placeTiles(hub);
  addEventListener('resize', place);
  return { stop: () => { clearInterval(timer); removeEventListener('resize', place); }, place };
}

// jaali: small, framework-free helpers for the CSS system.
import { initTheme } from './theme.js';
import { reveal } from './reveal.js';
import { glow } from './glow.js';
import { flipWords } from './flip.js';
import { tiltAll } from './tilt.js';
import { jaaliPattern } from './pattern.js';

export { $, $$, EASE, reduced, indexKids } from './util.js';
export { themes, getTheme, getMode, setTheme, setMode, toggleMode, initTheme, themePicker, THEMES, DEFAULT_THEME } from './theme.js';
export { flipWords } from './flip.js';
export { pivot, turnstile } from './pivot.js';
export { tilt, tiltAll } from './tilt.js';
export { glow } from './glow.js';
export { jaaliPattern, PATTERNS } from './pattern.js';
export { reveal, countUp } from './reveal.js';
export { liveTiles, placeTiles } from './tiles.js';
export { toast } from './toast.js';
export { range } from './range.js';
export { sheet } from './sheet.js';
export { scrollSpy } from './spy.js';
export { motif, motifs, rosette, arch } from './motif.js';
export { velocity, getVelocity, onVelocity, speedToTarget } from './velocity.js';
export { focusGroup, focusTip } from './focus.js';
export { materialize, stretch, grow, pour, sheen, worm, melt } from './liquid.js';

/**
 * One call for the common setup: restore theme and mode, slide-ins, cursor glow, flip words, press tilt,
 * and the pattern on <div class="j-pattern" data-pattern="ogee"> if the page has one.
 * Returns a function that undoes it all.
 */
export function mount(root = document) {
  initTheme();
  const stops = [reveal(root), glow(), flipWords(root)];
  const cv = root.querySelector && root.querySelector('.j-pattern');
  if (cv) stops.push(jaaliPattern(cv, { pattern: cv.dataset.pattern || 'ogee' }).stop);
  tiltAll(root);
  return () => stops.forEach((s) => s && s());
}

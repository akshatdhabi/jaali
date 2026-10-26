// Contrast audit for the resolved tokens. Pure functions.
// Each check names the pair as it is used in the CSS, so a failure points at a real surface.
import { contrast, mix } from './derive.mjs';

export const CHECKS = [
  { id: 'accent-on-ground', fg: 'accent', bg: 'ground', min: 4.5, use: 'accent text and links on the page' },
  { id: 'accent-on-tile', fg: 'accent', bg: 'tile', min: 4.5, use: 'accent text on tiles (held status, taglines)' },
  { id: 'accentInk-on-accent', fg: 'accentInk', bg: 'accent', min: 4.5, use: 'text on the accent tile' },
  { id: 'faded-on-ground', fg: 'faded', bg: 'ground', min: 3, use: 'inactive pivots and nav (large type)' },
  { id: 'faded-on-tile', fg: 'faded', bg: 'tile', min: 3, use: 'placeholder and quiet text on tiles' }
];

/** Every failing pair across all themes and modes. */
export function audit(resolved) {
  const fails = [];
  for (const [theme, modes] of Object.entries(resolved)) {
    for (const mode of ['dark', 'light']) {
      const m = modes[mode];
      for (const c of CHECKS) {
        const ratio = contrast(m[c.fg], m[c.bg]);
        if (ratio < c.min) {
          fails.push({ key: `${theme}.${mode}.${c.id}`, theme, mode, check: c.id, ratio, min: c.min, fg: m[c.fg], bg: m[c.bg] });
        }
      }
    }
  }
  return fails;
}

/** Smallest nudge of the foreground toward `toward` that reaches the minimum, or null. */
export function suggest(fg, bg, min, toward) {
  for (let t = 0.02; t <= 1; t += 0.02) {
    const c = mix(fg, toward, t);
    if (contrast(c, bg) >= min) return c.toUpperCase();
  }
  return null;
}

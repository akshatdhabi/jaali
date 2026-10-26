// Shared helpers. No state.
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const EASE = 'cubic-bezier(.1,.9,.2,1)';

/** True when the visitor asked for less motion. Read each call so a change takes effect without a reload. */
export const reduced = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Give each child an --i index so turnstile can stagger them. */
export const indexKids = (el) => [...el.children].forEach((c, i) => c.style.setProperty('--i', i));

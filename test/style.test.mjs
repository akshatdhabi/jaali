// style: the calm rules, as tests. These are the rules the system holds itself to.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PATTERNS } from '../src/js/pattern.js';

const css = readFileSync(new URL('../dist/jaali.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const js = (f) => readFileSync(new URL(`../src/js/${f}`, import.meta.url), 'utf8');

test('four patterns ship: ogee, win, bandhani and lehariya', () => {
  assert.deepEqual(PATTERNS, ['ogee', 'win', 'bandhani', 'lehariya']);
});

test('the loud parts are gone: no glass tiles, no stage, no lattice field, no tier switch', () => {
  for (const gone of ['is-glass', 'j-stage', 'j-staged', 'j-field-canvas', 'j-lattice-fill', 'j-band', 'data-tier']) {
    assert.ok(!css.includes(gone), `${gone} is still in the css`);
  }
  const files = readdirSync(new URL('../src/js/', import.meta.url));
  assert.ok(!files.includes('field.js'), 'field.js is gone');
});

test('the pop colour is a tint by default, and .is-slab brings the fill back', () => {
  assert.match(css, /\.j-live\.is-pop \.j-face\s*\{[^}]*color-mix\(in srgb, var\(--j-pop\) 15%/);
  assert.match(css, /\.j-live\.is-pop\.is-slab \.j-face\s*\{[^}]*background:\s*var\(--j-pop\)/);
});

test('the accent marks a number and never fills a tile', () => {
  assert.match(css, /\.j-live\.is-accent \.j-face \.j-tn1\s*\{\s*color:\s*var\(--j-accent\)/);
  assert.ok(!/\.j-live\.is-accent \.j-face\s*\{[^}]*background/.test(css), 'is-accent must not set a background');
});

test('glass is for things that float: no live or data tile has a backdrop filter', () => {
  const blocks = css.split('}').map((b) => b.trim()).filter((b) => /backdrop-filter/.test(b));
  for (const b of blocks) {
    const sel = b.split('{')[0];
    assert.ok(!/\.j-live|\.j-face|\.j-tile|\.j-card/.test(sel), `data surface with a backdrop filter: ${sel.trim()}`);
  }
});

test('motion rule: at rest only state indicators move. Decoration moves when you point at it.', () => {
  const ALLOWED = [/\.j-status--run::before/, /\.j-typing i/, /\.j-live-dot::before/, /:hover/, /:focus-visible/];
  const re = /([^{}]+)\{[^{}]*animation:[^;}]*infinite[^;}]*[;}]/g;
  let m;
  while ((m = re.exec(css))) {
    const sels = m[1].split(',').map((x) => x.trim());
    for (const sel of sels) assert.ok(ALLOWED.some((a) => a.test(sel)), `an infinite animation at rest: ${sel}`);
  }
});

test('live tiles flip on tap only unless you ask for an interval', () => {
  assert.match(js('tiles.js'), /interval = 0/);
  assert.match(js('tiles.js'), /interval > 0/);
});

test('mount starts the pattern when the page has a canvas for it', () => {
  assert.match(js('index.js'), /canvas\.j-pattern-canvas/);
  assert.match(js('index.js'), /jaaliPattern/);
});

test('the pattern canvas never takes the pointer', () => {
  assert.match(css, /\.j-pattern-canvas\s*\{[^}]*pointer-events:\s*none/);
});

test('glow trails the pointer and goes straight to it under reduced motion', () => {
  assert.match(js('glow.js'), /requestAnimationFrame/);
  assert.match(js('glow.js'), /reduced\(\)/);
});

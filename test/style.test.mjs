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
  assert.match(js('index.js'), /\.j-pattern/);
  assert.match(js('index.js'), /jaaliPattern/);
});

test('the pattern never takes the pointer', () => {
  assert.match(css, /\.j-pattern\s*\{[^}]*pointer-events:\s*none/);
});

test('glow trails the pointer and goes straight to it under reduced motion', () => {
  assert.match(js('glow.js'), /requestAnimationFrame/);
  assert.match(js('glow.js'), /reduced\(\)/);
});

test('the pattern drift is a compositor animation, not a redraw loop', () => {
  const src = js('pattern.js');
  assert.match(src, /\.animate\(frames/, 'the drift uses the Web Animations API on a transform');
  assert.match(src, /translate3d/);
  assert.ok(!/ctx\.setTransform[\s\S]{0,400}fillRect[\s\S]{0,200}requestAnimationFrame/.test(src.split('function startWaves')[0]), 'no per-frame fill outside lehariya');
});

test('the pattern module can be imported where there is no canvas (server rendering)', async () => {
  const m = await import('../src/js/pattern.js');
  assert.equal(typeof m.jaaliPattern, 'function');
});

test('nothing eases on page load: the page and the bar have no colour transition, and a mode change eases through j-reskin', () => {
  assert.ok(!/\.jaali\s*\{[^}]*transition/.test(css), '.jaali must not transition its background');
  assert.ok(!/\.j-top::before\s*\{[^}]*transition/.test(css), 'the bar must not transition its background');
  assert.match(js('theme.js'), /function reskin\(\)/);
  assert.match(js('theme.js'), /reskin\(\);\s*root\(\)\.dataset\.mode/);
});

test('every docs page sets theme, mode and color-scheme in a script that runs before the stylesheets', () => {
  for (const f of readdirSync(new URL('../docs/', import.meta.url)).filter((n) => n.endsWith('.html'))) {
    const h = readFileSync(new URL(`../docs/${f}`, import.meta.url), 'utf8');
    const script = h.indexOf("localStorage.getItem('jaali:mode')");
    const sheet = h.indexOf('<link rel="stylesheet"');
    assert.ok(script > -1 && script < sheet, `${f}: the early script must come before the first stylesheet`);
    assert.match(h, /style\.colorScheme = m/, `${f}: sets color-scheme early`);
  }
});

test('the docs load fast: one minified stylesheet, the next page warmed, pages crossfade', () => {
  for (const f of readdirSync(new URL('../docs/', import.meta.url)).filter((n) => n.endsWith('.html'))) {
    const h = readFileSync(new URL(`../docs/${f}`, import.meta.url), 'utf8');
    assert.match(h, /assets\/jaali\.min\.css/, `${f}: links the minified stylesheet`);
    assert.ok(!/assets\/fonts\.css/.test(h), `${f}: no separate fonts stylesheet`);
    assert.match(h, /speculationrules/, `${f}: asks the browser to pre-render the next page`);
  }
  const docsCss = readFileSync(new URL('../docs/assets/docs.css', import.meta.url), 'utf8');
  assert.match(docsCss, /@view-transition\s*\{\s*navigation:\s*auto/);
  assert.match(docsCss, /prefers-reduced-motion:\s*no-preference\)\s*\{\s*@view-transition/, 'crossfade only without reduced motion');
  assert.match(readFileSync(new URL('../docs/assets/site.js', import.meta.url), 'utf8'), /rel = 'prefetch'/);
});

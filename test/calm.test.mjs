// calm: soft themes, the tool tier and the pattern backdrop.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveAll } from '../src/tokens/derive.mjs';
import { audit } from '../src/tokens/audit.mjs';
import { PATTERNS } from '../src/js/pattern.js';

const src = JSON.parse(readFileSync(new URL('../src/tokens/themes.json', import.meta.url), 'utf8'));
const calmSrc = readFileSync(new URL('../src/css/57-calm.css', import.meta.url), 'utf8');
const css = readFileSync(new URL('../dist/jaali.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const SOFT = ['rani', 'neel', 'amer', 'makrana', 'sanjh', 'calm'];

test('six soft themes ship, pinned, with a pop of their own', () => {
  for (const name of SOFT) {
    const th = src.themes[name];
    assert.ok(th, `${name} exists`);
    assert.equal(th.pinned, true, `${name} is pinned`);
    for (const mode of ['dark', 'light']) {
      assert.ok(th[mode].pop && th[mode].popInk, `${name} ${mode} has pop and popInk`);
      assert.notEqual(th[mode].pop.toLowerCase(), th[mode].accent.toLowerCase(), `${name} ${mode}: pop differs from accent`);
    }
  }
});

test('soft themes pass every audit check with no known gaps', () => {
  const fails = audit(resolveAll(src)).filter((f) => SOFT.includes(f.theme));
  assert.deepEqual(fails.map((f) => f.key), []);
});

test('four patterns ship: ogee, win, bandhani and lehariya', () => {
  assert.deepEqual(PATTERNS, ['ogee', 'win', 'bandhani', 'lehariya']);
});

test('tool tier: tint tile, flat accent, no stage, no ambient motion', () => {
  assert.match(css, /\.j-live\.is-tint \.j-face[^{]*\{[^}]*color-mix\(in srgb, var\(--j-pop\) 15%/);
  assert.match(css, /\[data-tier="tool"\]\) \.j-stage\s*\{\s*display:\s*none/);
  assert.match(css, /\[data-tier="tool"\]\) \.j-live\.is-accent \.j-face \.j-tn1\s*\{\s*color:\s*var\(--j-accent\)/);
  assert.match(css, /\[data-tier="tool"\]\) \.j-typing i[^{]*\{\s*animation:\s*none/);
});

test('without data-tier nothing in the tool rules applies', () => {
  const blocks = calmSrc.replace(/\/\*[\s\S]*?\*\//g, '').split('}').map((b) => b.trim()).filter(Boolean);
  const open = /^\.j-live\.is-tint|^\.j-pattern-canvas|^\.j-chips/;
  for (const b of blocks) {
    const sel = b.split('{')[0].trim();
    for (const one of sel.split(',').map((x) => x.trim())) {
      assert.ok(open.test(one) || one.startsWith(':where([data-tier="tool"])'), `selector is gated: ${one}`);
    }
  }
});

test('the pattern canvas never takes the pointer', () => {
  assert.match(css, /\.j-pattern-canvas\s*\{[^}]*pointer-events:\s*none/);
});

test('glow trails the pointer and goes straight to it under reduced motion', () => {
  const js = readFileSync(new URL('../src/js/glow.js', import.meta.url), 'utf8');
  assert.match(js, /requestAnimationFrame/);
  assert.match(js, /reduced\(\)/);
});

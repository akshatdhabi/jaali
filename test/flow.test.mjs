// flow: velocity and focus.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { speedToTarget } from '../src/js/velocity.js';

const css = readFileSync(new URL('../dist/jaali.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
test('velocity target is clamped to 0..1', () => {
  assert.equal(speedToTarget(0, 16), 0);
  assert.equal(speedToTarget(100000, 16), 1);
  assert.equal(speedToTarget(100, 100), 0.25);
  assert.equal(speedToTarget(50, 0), speedToTarget(50, 8), 'a zero time step must not divide by zero');
});

test('focus dims the rest and the tip is glass', () => {
  assert.match(css, /\.j-focus\.is-focusing \[data-focus\]:not\(\.is-focus\)\s*\{[^}]*opacity/);
  assert.match(css, /\.j-tip\s*\{[^}]*backdrop-filter:\s*blur/);
});

test('velocity easing never goes negative, even when a frame timestamp runs backwards', async () => {
  const { easeVelocity } = await import('../src/js/velocity.js');
  for (const dt of [-0.02, -0.001, 0, 0.016, 0.05, 1]) {
    for (const [v, t] of [[0, 0.5], [0.3, 0], [0, 0], [1, 1]]) {
      const [nv, nt] = easeVelocity(v, t, dt);
      assert.ok(nv >= 0 && nv <= 1 && Number.isFinite(nv), `v=${nv} for dt=${dt}`);
      assert.ok(nt >= 0 && nt <= 1, `target=${nt} for dt=${dt}`);
    }
  }
});

test('focus tip is opt-in', () => {
  const src = readFileSync(new URL('../src/js/focus.js', import.meta.url), 'utf8');
  assert.match(src, /focusGroup\(box, \{ tip = false \}/);
});

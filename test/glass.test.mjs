// The function layer is glass by default: bars, theme panel, popovers, sheets, toasts.
// Content stays flat: tiles and cards carry no blur.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../dist/jaali.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

// every top-level rule body for an exact selector (ignores @supports and @media blocks)
function rules(sel) {
  const out = [];
  let depth = 0, start = 0, head = '';
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '{') { if (depth === 0) head = css.slice(start, i).trim(); depth++; start = i + 1; }
    else if (c === '}') {
      depth--;
      if (depth === 0) { if (head.split(',').map((s) => s.trim()).includes(sel)) out.push(css.slice(start, i)); start = i + 1; }
    }
  }
  return out.join('\n');
}
const blurs = (sel) => /backdrop-filter:\s*blur\(/.test(rules(sel));

test('function-layer parts are glass by default', () => {
  for (const sel of ['.j-top::before', '.j-skins', '.j-raised', '.j-sheet', '.j-toast.is-on', '.j-glass', '.j-pour']) {
    assert.ok(blurs(sel), `${sel} should have a backdrop blur`);
  }
});

test('the bar keeps its blur off the bar element, so the theme panel can blur the page', () => {
  assert.ok(!/backdrop-filter/.test(rules('.j-top')), '.j-top itself must not set backdrop-filter');
});

test('content stays flat', () => {
  for (const sel of ['.j-tile', '.j-face', '.j-card']) {
    assert.ok(!/backdrop-filter/.test(rules(sel)), `${sel} must not blur`);
  }
});

test('a toast rises out of blur: hidden state starts at blur 0', () => {
  assert.match(rules('.j-toast'), /backdrop-filter:\s*blur\(0px\)/);
});

test('glass has a solid fallback when backdrop-filter is missing', () => {
  assert.match(css, /@supports not \(\(backdrop-filter: blur\(1px\)\) or \(-webkit-backdrop-filter: blur\(1px\)\)\)/);
});

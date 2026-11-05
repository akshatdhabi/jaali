import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mix, luminance, contrast, resolveTheme, resolveAll, ROLES } from '../src/tokens/derive.mjs';
import { audit } from '../src/tokens/audit.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = JSON.parse(readFileSync(join(root, 'src/tokens/themes.json'), 'utf8'));
const names = Object.keys(src.themes);
const HEX = /^#[0-9A-Fa-f]{6}$/;
const hue = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (!d) return 0;
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
};

test('mix: endpoints and midpoint', () => {
  assert.equal(mix('#000000', '#FFFFFF', 0), '#000000');
  assert.equal(mix('#000000', '#FFFFFF', 1), '#ffffff');
  assert.equal(mix('#000000', '#FFFFFF', 0.5), '#808080');
});

test('contrast: black on white is 21, same colour is 1', () => {
  assert.ok(Math.abs(contrast('#000000', '#FFFFFF') - 21) < 1e-9);
  assert.ok(Math.abs(contrast('#336699', '#336699') - 1) < 1e-9);
});

test('twelve themes ship, rani is the default', () => {
  assert.deepEqual(names.slice().sort(), ['amer', 'cobalt', 'ember', 'gulabi', 'gulal', 'magenta', 'makrana', 'mehendi', 'neel', 'nilam', 'rani', 'sanjh']);
  assert.equal(src.default, 'rani');
});

const THREE = ['rani', 'gulal', 'nilam', 'mehendi'];

test('three-colour themes: base, primary and pop are three distinct colours', () => {
  for (const name of THREE) {
    for (const mode of ['dark', 'light']) {
      const m = resolveTheme(src.themes[name], mode);
      assert.notEqual(m.pop.toLowerCase(), m.accent.toLowerCase(), `${name} ${mode}: pop must differ from accent`);
      const d = Math.abs(hue(m.pop) - hue(m.accent));
      assert.ok(Math.min(d, 360 - d) >= 45, `${name} ${mode}: pop and accent hues are only ${Math.min(d, 360 - d).toFixed(0)} degrees apart`);
    }
  }
});

test('three-colour themes pass every audit check with no known gaps', () => {
  const fails = audit(resolveAll(src)).filter((f) => THREE.includes(f.theme));
  assert.deepEqual(fails.map((f) => f.key), []);
});

test('themes without their own pop reuse the accent', () => {
  for (const name of names.filter((n) => !src.themes[n].dark.pop)) {
    for (const mode of ['dark', 'light']) {
      const m = resolveTheme(src.themes[name], mode);
      assert.equal(m.pop, m.accent, `${name} ${mode}`);
      assert.equal(m.popInk, m.accentInk, `${name} ${mode}`);
    }
  }
});

test('every theme resolves to a full, valid token set in both modes', () => {
  for (const [name, modes] of Object.entries(resolveAll(src))) {
    for (const mode of ['dark', 'light']) {
      for (const role of ROLES) {
        assert.match(modes[mode][role], HEX, `${name}.${mode}.${role}`);
      }
    }
  }
});

test('gulabi matches the published token table exactly', () => {
  const dark = resolveTheme(src.themes.gulabi, 'dark');
  const light = resolveTheme(src.themes.gulabi, 'light');
  assert.deepEqual(dark, {
    ground: '#17121A', tile: '#251C2A', tileBack: '#2E2335', raised: '#3A2D42',
    line: '#342A36', lineSoft: '#271F2B', ink: '#F5EEF0', muted: '#A89AA2',
    faded: '#6E6072', accent: '#F28DAE', accentInk: '#17121A', pop: '#F28DAE', popInk: '#17121A'
  });
  assert.deepEqual(light, {
    ground: '#F7F2F1', tile: '#FFFFFF', tileBack: '#F4ECEA', raised: '#FFFFFF',
    line: '#E6DAD9', lineSoft: '#F0E7E5', ink: '#2E1F27', muted: '#7A6A70',
    faded: '#A5949B', accent: '#B53A61', accentInk: '#FBF8F7', pop: '#B53A61', popInk: '#FBF8F7'
  });
});

test('dark derivation: tile 3.5% and tile-back 5% toward ink, raised 12% from authored tile-back', () => {
  for (const name of names.filter((n) => !src.themes[n].pinned)) {
    const a = src.themes[name].dark;
    const r = resolveTheme(src.themes[name], 'dark');
    assert.equal(r.tile, mix(a.tile, a.ink, 0.035), `${name} tile`);
    assert.equal(r.tileBack, mix(a.tileBack, a.ink, 0.05), `${name} tileBack`);
    assert.equal(r.raised, mix(a.tileBack, a.ink, 0.12), `${name} raised`);
  }
});

test('light derivation: white tiles and raised, ground nudged 25% toward line', () => {
  for (const name of names.filter((n) => !src.themes[n].pinned)) {
    const a = src.themes[name].light;
    const r = resolveTheme(src.themes[name], 'light');
    assert.equal(r.tile, '#FFFFFF', `${name} tile`);
    assert.equal(r.raised, '#FFFFFF', `${name} raised`);
    assert.equal(r.tileBack, a.tile, `${name} tileBack`);
    assert.equal(r.ground, mix(a.ground, a.line, 0.25), `${name} ground`);
  }
});

test('elevation: in dark, raised is lighter than tile and tile is lighter than ground (low-brightness beta fix)', () => {
  for (const [name, modes] of Object.entries(resolveAll(src))) {
    const d = modes.dark;
    assert.ok(luminance(d.tile) > luminance(d.ground), `${name}: tile lifts off ground`);
    assert.ok(luminance(d.raised) > luminance(d.tile), `${name}: raised lifts off tile`);
  }
});

test('elevation: every theme separates raised from tile by at least 1.15:1 in dark', () => {
  for (const [name, modes] of Object.entries(resolveAll(src))) {
    const c = contrast(modes.dark.raised, modes.dark.tile);
    assert.ok(c >= 1.15, `${name}: raised vs tile is ${c.toFixed(2)}`);
  }
});

test('legibility: ink on ground is AAA (7:1) in every theme and mode', () => {
  for (const [name, modes] of Object.entries(resolveAll(src))) {
    for (const mode of ['dark', 'light']) {
      const c = contrast(modes[mode].ink, modes[mode].ground);
      assert.ok(c >= 7, `${name} ${mode}: ink on ground ${c.toFixed(2)}`);
    }
  }
});

test('legibility: muted text on ground and on tile is AA (4.5:1)', () => {
  for (const [name, modes] of Object.entries(resolveAll(src))) {
    for (const mode of ['dark', 'light']) {
      const m = modes[mode];
      assert.ok(contrast(m.muted, m.ground) >= 4.5, `${name} ${mode}: muted on ground ${contrast(m.muted, m.ground).toFixed(2)}`);
      assert.ok(contrast(m.muted, m.tile) >= 4.5, `${name} ${mode}: muted on tile ${contrast(m.muted, m.tile).toFixed(2)}`);
    }
  }
});

test('contrast audit: the failing pairs are exactly the documented known gaps', () => {
  const known = JSON.parse(readFileSync(join(root, 'src/tokens/known-gaps.json'), 'utf8')).gaps.slice().sort();
  const found = audit(resolveAll(src)).map((f) => f.key).sort();
  const added = found.filter((k) => !known.includes(k));
  const fixed = known.filter((k) => !found.includes(k));
  assert.deepEqual(added, [], 'new contrast gaps: fix the colour or record the gap on purpose');
  assert.deepEqual(fixed, [], 'gaps that now pass: remove them from known-gaps.json');
});

test('gulabi accent, the one the docs lead with, passes AA on ground and tile in both modes', () => {
  for (const mode of ['dark', 'light']) {
    const m = resolveTheme(src.themes.gulabi, mode);
    assert.ok(contrast(m.accent, m.ground) >= 4.5, `${mode} accent on ground`);
    assert.ok(contrast(m.accent, m.tile) >= 4.5, `${mode} accent on tile`);
    assert.ok(contrast(m.accentInk, m.accent) >= 4.5, `${mode} accent-ink on accent`);
  }
});

test('hairlines are visible against ground (at least 1.1:1)', () => {
  for (const [name, modes] of Object.entries(resolveAll(src))) {
    for (const mode of ['dark', 'light']) {
      const m = modes[mode];
      assert.ok(contrast(m.line, m.ground) >= 1.1, `${name} ${mode}: line on ground ${contrast(m.line, m.ground).toFixed(2)}`);
    }
  }
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist']);
const SKIP_FILES = new Set(['hygiene.test.mjs', 'package-lock.json']);
const TEXT = /\.(md|json|css|js|mjs|html|yml|yaml|txt|svg)$|LICENSE$|\.gitignore$/;

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    if (SKIP_DIRS.has(f)) continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const files = walk(root).filter((p) => TEXT.test(p) && !SKIP_FILES.has(p.split('/').pop()));
const rel = (p) => relative(root, p);

// Placeholder content from the working page. None of it may ship.
const FORBIDDEN = [
  'infeedo', 'inloop', 'yellow.ai', 'threado', 'kommunicate', 'amber studio', 'send guard',
  'acme', 'northstar', 'lumen', 'corvid', 'halden', 'orra', 'chief of staff', 'cpo',
  'gmail', 'manipal', 'hrbp', 'mcp', 'aia ', 'hello@', 'inbox', 'deflect', 'pilot'
];

test('no employer, client, product or personal-contact references anywhere in the repo', () => {
  const hits = [];
  for (const p of files) {
    const text = readFileSync(p, 'utf8').toLowerCase();
    for (const w of FORBIDDEN) if (text.includes(w)) hits.push(`${rel(p)}: "${w}"`);
  }
  assert.deepEqual(hits, []);
});

// Zune and Metro are Microsoft names. They may appear in prose that tells the story
// (README, story page, changelog) and in the trademark notice. Nowhere else.
const TM_WORDS = ['zune', 'metro'];
const TM_ALLOWED = new Set(['README.md', 'docs/story.html', 'CHANGELOG.md']);

test('Zune and Metro appear only in the story prose, never in code, names or tokens', () => {
  const hits = [];
  for (const p of files) {
    if (TM_ALLOWED.has(rel(p))) continue;
    const text = readFileSync(p, 'utf8').toLowerCase();
    for (const w of TM_WORDS) if (text.includes(w)) hits.push(`${rel(p)}: "${w}"`);
  }
  assert.deepEqual(hits, []);
});

test('no file or folder name contains zune or metro', () => {
  const bad = walk(root).map(rel).filter((p) => /zune|metro/i.test(p));
  assert.deepEqual(bad, []);
});

test('the trademark notice is present where the words are used', () => {
  for (const f of TM_ALLOWED) {
    let text;
    try { text = readFileSync(join(root, f), 'utf8'); } catch { continue; }
    if (!/zune|metro/i.test(text)) continue;
    assert.match(text, /trademark of microsoft/i, `${f} mentions Zune or Metro without the notice`);
  }
});

test('package.json carries no trademarked names and is publishable', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.name, 'jaali');
  assert.equal(pkg.license, 'MIT');
  assert.ok(!/zune|metro/i.test(JSON.stringify(pkg)));
  assert.ok(pkg.exports['./css'] && pkg.exports['./tokens.css'] && pkg.exports['.']);
});

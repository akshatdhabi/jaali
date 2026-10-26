// npm run audit: prints every contrast gap and a suggested value.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { resolveAll } from '../src/tokens/derive.mjs';
import { audit, suggest } from '../src/tokens/audit.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = JSON.parse(readFileSync(join(root, 'src/tokens/themes.json'), 'utf8'));
const known = new Set(JSON.parse(readFileSync(join(root, 'src/tokens/known-gaps.json'), 'utf8')).gaps);
const resolved = resolveAll(src);
const fails = audit(resolved);

const rows = fails.map((f) => {
  const m = resolved[f.theme][f.mode];
  const toward = f.check === 'accentInk-on-accent' ? '#000000' : (f.mode === 'light' ? m.ink : '#FFFFFF');
  const fix = suggest(f.fg, f.bg, f.min, toward);
  return `${known.has(f.key) ? 'known' : 'NEW  '}  ${f.key.padEnd(40)} ${f.ratio.toFixed(2)} (need ${f.min})  ${f.fg} on ${f.bg}  nearest passing: ${fix ?? 'n/a'}`;
});
console.log(rows.join('\n') || 'no gaps');
console.log(`\n${fails.length} gaps, ${fails.filter((f) => !known.has(f.key)).length} new`);

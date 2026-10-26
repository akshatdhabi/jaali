// Pure colour helpers and the rules that turn authored theme values into the final tokens.
// No DOM, no I/O. Used by scripts/build.mjs and by the tests.

export const ROLES = [
  'ground', 'tile', 'tileBack', 'raised', 'line', 'lineSoft',
  'ink', 'muted', 'faded', 'accent', 'accentInk'
];

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** Linear mix of two #RRGGBB colours. t=0 returns a, t=1 returns b. Output is lowercase. */
export function mix(a, b, t) {
  const A = rgb(a);
  const B = rgb(b);
  return '#' + A.map((c, i) => Math.round(c + (B[i] - c) * t).toString(16).padStart(2, '0')).join('');
}

/** WCAG relative luminance. */
export function luminance(hex) {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colours, 1 to 21. */
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Resolve one theme in one mode to the final token set.
 * Pinned themes (gulabi) are used exactly as written.
 *
 * dark:  tile = tile mixed 3.5% toward ink
 *        tileBack = tileBack mixed 5% toward ink
 *        raised = authored tileBack mixed 12% toward ink
 * light: ground nudged 25% toward line, tile and raised white,
 *        tileBack = the authored tile
 */
export function resolveTheme(theme, mode) {
  const a = theme[mode];
  const pick = (o) => {
    const out = {};
    for (const r of ROLES) out[r] = o[r];
    if (o.groundImage) out.groundImage = o.groundImage;
    return out;
  };
  if (theme.pinned) return pick(a);

  if (mode === 'dark') {
    return pick({
      ...a,
      tile: mix(a.tile, a.ink, 0.035),
      tileBack: mix(a.tileBack, a.ink, 0.05),
      raised: mix(a.tileBack, a.ink, 0.12)
    });
  }
  return pick({
    ...a,
    ground: mix(a.ground, a.line, 0.25),
    tile: '#FFFFFF',
    tileBack: a.tile,
    raised: '#FFFFFF'
  });
}

/** { name: { dark: {...}, light: {...} } } for every theme in the source file. */
export function resolveAll(src) {
  const out = {};
  for (const [name, theme] of Object.entries(src.themes)) {
    out[name] = { dark: resolveTheme(theme, 'dark'), light: resolveTheme(theme, 'light') };
  }
  return out;
}

// Jaipur line figures as SVG strings. Hairline, accent only, animated by the CSS.
const pts = (n, r, cx = 60, cy = 60) =>
  Array.from({ length: n }, (_, i) => [cx + r * Math.cos((i * 2 * Math.PI) / n), cy + r * Math.sin((i * 2 * Math.PI) / n)]);

const MOTIFS = {
  // twelve overlapping circles around a centre, slowly turning
  ring: () => `<svg class="j-motif" viewBox="0 0 120 120" aria-hidden="true"><g class="j-spin">${pts(12, 30).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="22"/>`).join('')}</g><circle cx="60" cy="60" r="8"/><circle class="j-dot" cx="60" cy="60" r="2"/></svg>`,
  // three nested Amer arches drawing and erasing themselves
  arch: () => `<svg class="j-motif" viewBox="0 0 120 150" aria-hidden="true"><path class="j-drawloop" pathLength="1" d="M10 150 V70 C10 40 36 20 60 4 C84 20 110 40 110 70 V150"/><path class="j-drawloop" pathLength="1" style="animation-delay:.4s" d="M26 150 V76 C26 52 44 36 60 24 C76 36 94 52 94 76 V150"/><path class="j-drawloop" pathLength="1" style="animation-delay:.8s" d="M42 150 V84 C42 66 52 56 60 46 C68 56 78 66 78 84 V150"/></svg>`,
  // blue-pottery rosette: eight petals and a dotted ring counter-rotating
  rosette: () => `<svg class="j-motif" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="56"/><g class="j-spin">${Array.from({ length: 8 }, (_, i) => `<ellipse cx="60" cy="30" rx="8" ry="20" transform="rotate(${i * 45} 60 60)"/>`).join('')}</g><g class="j-spin r">${pts(16, 48).map(([x, y]) => `<circle class="j-dot" cx="${x}" cy="${y}" r="1.4"/>`).join('')}</g><circle cx="60" cy="60" r="9"/></svg>`,
  // a 3x3 grid of eight-point stars, breathing out of step
  star: () => `<svg class="j-motif" viewBox="0 0 120 120" aria-hidden="true">${[0, 1, 2].map((r) => [0, 1, 2].map((c) => `<g class="j-breathe" style="animation-delay:${(r + c) * 0.3}s;transform-origin:${20 + c * 40}px ${20 + r * 40}px"><rect x="${8 + c * 40}" y="${8 + r * 40}" width="24" height="24" transform="rotate(45 ${20 + c * 40} ${20 + r * 40})"/><rect x="${8 + c * 40}" y="${8 + r * 40}" width="24" height="24"/></g>`).join('')).join('')}</svg>`,
  // stepwell: nested squares stepping down to a point
  well: () => `<svg class="j-motif" viewBox="0 0 120 120" aria-hidden="true">${[54, 44, 34, 24, 14].map((r, i) => `<rect class="j-breathe" style="animation-delay:${i * 0.35}s" x="${60 - r}" y="${60 - r}" width="${r * 2}" height="${r * 2}" rx="2"/>`).join('')}<circle class="j-dot" cx="60" cy="60" r="2"/></svg>`
};

/** motif('ring' | 'arch' | 'rosette' | 'star' | 'well') -> SVG string */
export function motif(kind) {
  const f = MOTIFS[kind];
  if (!f) throw new RangeError(`unknown motif "${kind}". Available: ${Object.keys(MOTIFS).join(', ')}`);
  return f();
}
export const motifs = () => Object.keys(MOTIFS);

/** Small rosette for sign-offs. Class j-rosette. */
export const rosette = () =>
  `<svg class="j-rosette" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21"/>${Array.from({ length: 8 }, (_, i) => `<ellipse cx="24" cy="12.5" rx="3" ry="7" transform="rotate(${i * 45} 24 24)"/>`).join('')}<circle cx="24" cy="24" r="4"/><circle class="j-dot" cx="24" cy="24" r="1.6"/></svg>`;

/** The Amer arch for a hero corner: two pointed arches with straight jambs, drawn once. */
export const arch = () =>
  `<svg class="j-arch" viewBox="0 0 160 300" aria-hidden="true"><path pathLength="1" d="M8 300 V132 C8 76 46 40 80 6 C114 40 152 76 152 132 V300"/><path class="a2" pathLength="1" d="M20 300 V136 C20 86 52 54 80 24 C108 54 140 86 140 136 V300"/></svg>`;

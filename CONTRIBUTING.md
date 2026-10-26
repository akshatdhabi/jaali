# Contributing

Small, sharp changes are welcome. Open an issue first for anything that changes how the system looks.

## Setup

```sh
npm install
npm test
npm run docs
```

## Rules that keep it coherent

- **Type, then lines, then Jaipur.** A change that adds a filled box where a hairline would do will be asked to change.
- **Tokens live in `src/tokens/themes.json`.** Do not edit generated files (`dist/`, `src/js/_themes.gen.js`, `docs/assets/jaali.*`).
- **One easing, one accent.** Use `var(--j-ease)`. Do not add a second accent colour or a new status colour. Status uses shape.
- **Sentence case, lowercase titles.** No all-caps labels.
- **Reduced motion and no-JS must still work.** Behaviour belongs in `src/js/` and must not throw when `localStorage` is blocked.
- **Prefix every class with `j-`** and use `:where()` for resets so base styles never outrank components.
- **Contrast.** `npm run audit` must report no new gaps. Fixing a listed gap is welcome: remove it from `src/tokens/known-gaps.json` in the same change.
- **Example content is invented.** Docs and samples use fictional names and numbers only.

## Pull requests

Keep them focused. Include a screenshot (dark and light) for visual changes. `npm test` must pass.

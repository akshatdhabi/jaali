# Changelog

All notable changes to jaali. Follows [Semantic Versioning](https://semver.org/).

## 1.0.0

Calm becomes the whole system. A breaking release. Not published to npm.

The ops screens had grown busy: five fill treatments on one screen, two equally loud colours, tiles over moving shapes, 33 animations at rest. This release removes the loud parts instead of hiding them behind a switch.

**Changed**

- Seven themes. `rani`, `neel`, `amer`, `makrana`, `sanjh` and `calm` take the plain names with the calm palettes. `gulabi` stays pinned. `rani` is still the default, and now it is dusty rose and warm amber. All themes are pinned. The contrast audit has 3 known gaps left, all gulabi `faded`.
- `.is-pop` is a tint (a coloured number, a thin edge, a 15% fill). `.is-slab` brings back the solid fill.
- `.is-accent` colours a number and never fills a tile.
- A failed status (`.j-status--fail`) takes the pop dot.
- `liveTiles()` flips on tap only. Pass `{ interval }` for automatic flips.
- Card line figures (`.j-motif`) move only while you point at the card.
- `glow()`: the card light trails the pointer.
- `mount()` starts the pattern for `canvas.j-pattern-canvas` and no longer starts scroll velocity. Call `velocity()` yourself if you use it.

**Added**

- `jaaliPattern(canvas, { pattern })` and `PATTERNS`: `ogee` (stone trellis), `win` (Hawa Mahal windows), `bandhani` (tie-dye dots), `lehariya` (turban waves). Switch by setting `data-pattern` on the canvas.
- `.j-chips`: a wrapping row of pill choices.
- `test/style.test.mjs`: the calm rules as tests, including the motion rule (at rest only state indicators move; decoration moves on hover).

**Removed**

- Glass tiles (`.is-glass`), the stage (`.j-stage`, `.j-staged`, `stage()`), the lattice field (`jaaliField()`, `.j-field-canvas`), the lattice band (`.j-band`) and `.j-lattice-fill`.
- Six themes: `gulal`, `nilam`, `mehendi`, `magenta`, `ember` and `cobalt`. `rani`, `neel`, `amer`, `makrana` and `sanjh` keep their names with new, calmer values.

**Migrating from 0.x**

| if you used | now |
|---|---|
| `jaaliField(canvas)` and `.j-field-canvas` | `<canvas class="j-pattern-canvas" data-pattern="ogee">`, started by `mount()` |
| `.is-glass` tiles and `stage()` | flat `.j-live` tiles. Glass stays on bars, pills, menus, sheets and toasts |
| a solid `.is-pop` or `.is-accent` tile | `.is-pop` is a tint. Add `.is-slab` for the solid fill. `.is-accent` colours a number |
| `data-tier="tool"` (0.5.0) | nothing to set. It is the default |
| a removed theme name | `setTheme()` throws for an unknown name. Pick one of the seven |
| `mount()` starting `velocity()` | call `velocity()` yourself |

## 0.5.0

Calm: a quieter tier for tools. Not published to npm.

- `data-tier="tool"`: flat tiles, a tint for the one thing that needs a person, accent as a mark, no stage, no ambient motion. New `57-calm.css`. Without the attribute nothing changes.
- `.is-tint` (and `.is-pop` in the tool tier): the pop colour as a 15% tint with a coloured number and a thin edge. `.is-slab` keeps the solid fill.
- Six soft themes: `soft-rani`, `soft-neel`, `soft-amer`, `soft-makrana`, `soft-sanjh`, `soft-calm`. Eighteen themes in all. All pinned, all pass the contrast audit, no new known gaps.
- `jaaliPattern(canvas, { pattern })` and `PATTERNS`: a thin Rajasthani pattern behind the page, as a screen and not a row of icons. `ogee` (stone trellis), `win` (Hawa Mahal windows), `bandhani` (tie-dye dots), `lehariya` (turban waves). It drifts, leans away from the pointer and lights up near it. Still under reduced motion.
- `glow()`: the card light now trails the pointer. It goes straight to the pointer under reduced motion.
- `.j-chips`: a wrapping row of pill choices.
- New test (`test/calm.test.mjs`): the soft themes pass every audit check, the four shipped patterns, and that the tier rules only apply under `data-tier="tool"`.
- Docs: new calm page with the ops dashboard in the tool tier, a pattern picker and the per-view budgets. Calm link in the nav.

## 0.4.0

Flow: motion that answers the reader. Not published to npm.

- `velocity()`: scroll speed as a shared 0 to 1 input, with `getVelocity()`, `onVelocity(fn)` and `--j-velocity` on `<html>`. `mount()` starts it. Stays at 0 under reduced motion.
- The lattice field reads velocity: it drifts up to 7x faster and glows brighter on a fast scroll, then settles.
- `focusGroup(el, { tip })`: point at one `[data-focus]` item and the others dim. Works with hover, keyboard and tap. The raised glass tip (`.j-tip`, `focusTip()`) is opt-in.
- New `65-flow.css`, with types for the new helpers.
- New test (`test/flow.test.mjs`): velocity clamps to 0..1 and never goes negative when a frame timestamp runs backwards; focus dims the rest; the tip is glass and opt-in.
- Docs: new flow page with a live velocity meter, a focus demo and an example release page. Flow link in the nav.
- JS is now about 11 KB gzipped.

## 0.3.0

Glass becomes the default for the raised layer, and every docs page uses glass and liquid. Not published to npm.

- The top bar, theme panel, `.j-raised` popovers, `.j-sheet` and `.j-toast` are glass by default. The bar's blur sits on `::before` so the theme panel below it can blur the page too.
- Toasts rise out of blur with the spring and carry a pop dot instead of an accent bar.
- Sheets keep the page faintly visible behind an 80% ground and a 28px blur.
- Glass falls back to the solid raised colour when `backdrop-filter` is missing.
- New test (`test/glass.test.mjs`): function-layer parts blur, content tiles stay flat.
- Docs: home links become a staged hub with a fourth principle for glass; kit token table follows the current theme and mode, adds pop, a liquid section and glass tiles; sample filters stretch, the ops hub sits on a stage with glass and pop tiles and a tile that pours; examples filter with a stretch pill, rows pour into sheets, habits and the release gate confirm with glass toasts; story gets a glass and liquid chapter.

## 0.2.0

Glass and liquid, and three-colour themes. Not published to npm.

- New `pop` and `popInk` tokens (`--j-pop`, `--j-pop-ink`) on every theme. Themes without one reuse the accent.
- Four three-colour themes: rani (black, rani pink, orange), gulal, nilam and mehendi. Rani is the new default; set `data-theme="gulabi"` to keep the old look. The eight original themes are unchanged. Twelve in all.
- Glass material tokens: `--j-glass-blur`, `--j-glass-fill`, `--j-glass-saturate`, plus `--j-spring`.
- `35-glass.css`: `.j-glass`, materialize (`.j-mat`), glass and pop live tiles (`.is-glass`, `.is-pop`), and a stage of drifting jaali shapes (`.j-stage`).
- `55-liquid.css` and new JS helpers: `stretch`, `grow`, `pour`, `worm`, `melt`, `materialize`, `stage`, `sheen`, with types.
- Contrast audit checks pop on ground and popInk on pop. The new themes pass with no gaps.
- Docs: new glass page, glass link in the nav, counts updated.
- JS is now about 10 KB gzipped.

## 0.1.0

First public release. Not published to npm: clone the repo and run `npm run build`.

- Tokens: eight themes (gulabi, neel, amer, makrana, magenta, ember, cobalt, sanjh), each in dark and light, generated from one JSON file.
- Three surface layers: ground, tile, raised.
- CSS components: titles, flip word, hero, tiles and live tiles, cards, rows, pivots, status, toggle, field, range, toast, sheet, top bar, theme picker.
- Jaipur cues: jaali lattice field and glow, Amer arch, rosette, line motifs.
- Vanilla JS helpers, with TypeScript types. About 7 KB gzipped.
- Self-hosted Geist (SIL OFL 1.1).
- Docs site: home, kit, examples, story, sample.
- Contrast audit with a recorded list of known gaps.

Zune is a trademark of Microsoft. jaali is not affiliated with Microsoft.

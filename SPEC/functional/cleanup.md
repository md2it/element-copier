# CLEANUP FOR DERIVED FORMATS

- These rules do not apply to Devtools formats
- These rules are not exhaustive. Many more rules are applied, but these are documented separately because related bugs occurred

---

## Text, Markdown, Image, PNG, JPEG
- Remove noscript and comment tags `<!--...-->`

---

## Text, Markdown

### Decorative user interface icons (remove, do not materialize)
Remove an inline `<svg>` before materialization if ALL conditions are true:
1. Decorative: aria-hidden=true OR role=presentation/none, AND the SVG has no accessible name.
2. UI element: inside a button, role=button, or a link/short description containing only an icon.
3. Small: rendered element size or viewBox ≤ 48×48 pixels.
4. Not content: there is no parent figure/picture/article in which the SVG is the primary media.
If removal empties the control, remove the control itself.
DO NOT apply this rule to `<img>` elements.

### Content SVGs (preserve and materialize as inline raster images)
- Derived formats (Markdown, Text/HTML) must not contain `data:image/svg+xml` in `<img src>`: typical viewers (md-reader, Google Docs) do not render such URLs and display the raw string
- SVGs not removed by the "decorative UI icons" rule are materialized as `<img src="data:image/png;base64,...">` (or JPEG, if that is the pipeline convention) while the element is still in the page DOM
- When rasterizing, account for the SVG's computed styles (for example, `stroke="currentColor"` and CSS-derived `fill`)

### Distinguishing content from UI by size
- For the UI removal rule and the content safelist, SVG size is **max(rendered size, viewBox)** on each axis, not only the `width`/`height` attributes
- Example: a logo with `viewBox="0 0 946 947"` and `width="24"` is content (rasterize, do not remove); a menu icon with a 24×24 viewBox is UI (remove)
- This rule does **not** define raster size (see below)

### SVG raster size (materialize)
Context: a page contains a 24×24 icon with `viewBox="0 -960 960 960"`; in Markdown it becomes a PNG hundreds or thousands of pixels wide and appears oversized
Requirements:
- The canvas size and `<img width/height>` attributes after materialization must use **only the layout size of the live `<svg>`** on the original page: `getBoundingClientRect()`; measure the `<svg>`, not a nested `<path>`
- **Do not** use the SVG viewBox or `width`/`height` attributes as the raster size if `getBoundingClientRect()` returns both dimensions > 0
- If rect = 0: **do not** fall back to the viewBox; acceptable options include computed size, a visible ancestor, or an upper cap per side (the exact value is implementation-defined, but the result must not match the "Material icon" viewBox when displayed at 24×24)
- When rasterizing, resolve in the clone not only `currentColor`, but also `fill`/`stroke` values such as `var(--…)` to computed values from the live DOM
- Expected result: `viewBox` 960×960 + display 24×24 → **24×24** px PNG in `data:image/png`, not 960×960
- Regression: keep the md2it-logo smoke case (24×24 logo, viewBox ~946) unchanged; add a Material-style case with `viewBox="0 -960 960 960"` and display 24×24

### Additional UI contexts (remove)
- `<summary>` / `<details>` with an icon next to the trigger text
- `aria-hidden="true"` on an SVG ancestor (not only on the `<svg>` itself), if the other UI icon conditions are met

---

## Markdown

### Pseudo-links
- Contact/action href (`mailto:`, `tel:`, `sms:`, `facetime:`, `tg:`, `whatsapp:`, `skype:`, `slack:`): do not format as "domain/..."; without text/alt, use the destination address from href as the label, not `/...`

### Image inside a link
- If an `<img>` remains inside `<a>` after cleanup, the result is a linked image `[![alt](src)](href)` entirely on one line
- Not allowed: a line break between `![alt](src)` and the outer link's closing `](href)`
- Verification: `element-copier/copied-www-google-com-div.md` — the Google account avatar is one clickable link, not "image + separate link tail"

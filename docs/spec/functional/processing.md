# PROCESSING

Description of snapshot processing at the user's request.

---

## DOCUMENT ABBREVIATIONS

READY = existing data that we do not create ourselves but retrieve from the page through the browser API
CACHE = saved to the cache/buffer

---

## SEQUENCE

1. The user takes a snapshot (clicks an element, captures the entire page, or uses a keyboard shortcut)
2. Read the user settings. Disabled formats are not generated (skip their steps below)
3. url // READY CACHE
4. outerHTML // READY CACHE
5. tagIdClass
6. computedStyles // READY CACHE
7. selector
8. jsPath
9. xpath
10. fullXPath
11. styles
12. text
13. markdown
14. images // see ### Images

### Images

**Once**, if png and/or jpeg is enabled (branches 6 and/or 7, only for enabled formats):
1. clone node — traverse and clone the DOM
2. embed web font — fetch CSS/fonts
3. embed node — fetch images, inline CSS URLs (the most expensive step for complex elements)
4. foreignObject SVG
5. SVG → canvas — browser rasterization
   - canvas backgroundColor: effective `background-color` with alpha > 0 (including 0 < alpha < 1); otherwise transparent, as for PNG now (without JPEG fallback `#ffffff`)
   - apply the effective background to the clone before rendering, as for PNG now: `background-color` with alpha > 0, or non-empty `background` / `background-image`

**The PNG and JPEG branches then differ** (without repeating domTo*):
6. PNG — `toDataURL('image/png')` from the canvas in step 5
   - keep the rest of the PNG behavior unchanged (filter, fetch placeholder, …)
7. JPEG
   1. Get the fill background behind the snapshot from `computedStyles`, which is already in the cache (not from the live DOM)
      - If the element has a non-transparent `background-color` (alpha > 0) or non-empty `background` / `background-image`, use that background
      - Otherwise, use the first suitable background from the parent chain and `documentElement`
      - Otherwise, use white #ffffff
   2. Composite on a second canvas: fill background → `drawImage` (canvas from step 5) → `toDataURL('image/jpeg', 0.92)`

---

## RELATED SPECIFICATIONS

These specifications do not affect the requirements of this document. Read them only when necessary.

- Format generation includes pre-processing and post-processing, partially described in cleanup.md, but the code contains much more logic
- The formats are then stored in the cache: cache.md
- The markdownFile and htmlFile formats are not generated when the snapshot is taken. Generate them from markdown and outerHTML:
   - When the user clicks a button on the COPIED page: ../pages/copied.md
   - If it is the default action: ../pages/settings.md

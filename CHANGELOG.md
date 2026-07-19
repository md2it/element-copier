# RELEASE LIST

Version logic:
- A.B.C
- A = changes UX: major updates
- B = impacts the UX: new functionality or improvement of old one
- C = does not affect the UX: bug fixes, improvements
- A | B | C -- \d+

---

## RELEASES

### 1.1.6
- Updated the Welcome page to match About

### 1.1.5
- Refined the About page layout

### 1.1.4
- Fixed Firefox TypeError when reading `adoptedStyleSheets` in content scripts ([bug 1770592](https://bugzilla.mozilla.org/show_bug.cgi?id=1770592))
- Isolated format snapshot errors so one failing format no longer blocks the rest or opening results

### 1.1.3
- Refined activity statistics in About

### 1.1.2
- Kept developer tool formats available for default actions when hidden in the interface
- Fixed survey store link browser detection (Chrome vs Firefox)
- Fixed copying to clipboard on Firefox after pick/async work (`clipboardWrite`)

### 1.1.1
- Refined activity statistics in About

### 1.1.0
- Added optional feedback survey and activity statistics in About

### 1.0.3
- Fixed copying on pages that were already open when the extension was installed

### 1.0.2
- Removed dead code

### 1.0.1
- Improved icons
- The grand refactoring: bandles split to chunks, removed dependencies
- Fixed bugs and errors

### 1.0.0
- Copy an entire page or a specific element,
- Convert information into multiple formats at once,
- Keep the last copied content for all formats,
- Keyboard shortcuts,
- Light and dark themes,
- Flexible settings,
- Rich text for pasting into Google Docs and Word,
- Images (PNG, JPEG),
- Markdown,
- Page source code,
- Many formats for developers and testers:
   - HTML,
   - CSS selector,
   - JS path,
   - XPath,
   - full XPath,
   - declared and computed styles.

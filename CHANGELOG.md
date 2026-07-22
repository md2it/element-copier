# RELEASE LIST

Regular SemVer logic.

---

## RELEASES

### 1.3.1
- Fixed the action popup at 500×600 px to stay within Chrome and Firefox limits
- Aligned Copy and Download actions with Developer Tools fields on the Copied page
- Renamed the element and page actions across all supported languages

### 1.3.0
- Added `QA details`: a compact copy format with the page URL, element identifier, CSS selector, identifying attributes, capture timestamp, and browser environment

### 1.2.3
- Improved release packaging and store-release automation

### 1.2.2
- Test Chrome Web Store API upload while another version is under review

### 1.2.1
- Prepared Chrome Web Store upload release

### 1.2.0
- Added a new copy format: `tag#id.class` (available in the "Copied" panel and as a "Default action" option, between "Copy code" and "Copy selector")

### 1.1.12
- Reduced expected copy and fallback logs from warning level to debug level

### 1.1.11
- Hardened clipboard HTML parsing and info-window content insertion against unsafe `innerHTML`

### 1.1.10
- Unified Lucide UI icons via shared vendor copies (`lib/vendor/icons`)

### 1.1.9
- Welcome pin hint is positioned from the viewport edge (no fixed inset)

### 1.1.8
- Background loads through a single ES-module entry (`app/background/main.js`) for Chrome MV3 and Firefox 121+
- Goal: one background load path for both browsers, without a second handwritten dependency list in the manifest
- Prevents Chrome/Firefox background wiring from drifting apart when modules are added or reordered

### 1.1.7
- Widened Welcome for denser About text on small screens

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

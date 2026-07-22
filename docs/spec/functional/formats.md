# AVAILABLE FORMATS

---

## Devtools
- code
- tag#id.class
- selector
- JS path
- XPath
- full XPath
- styles
- computed styles
- QA details
  - Plain-text bug-report reference generated when the element is selected:
    ```text
    THE ELEMENT:
    - Page: https://example.com/products/42
    - Element: button#checkout.btn.btn-primary
    - Selector: main > section:nth-of-type(2) > article.product-card > button
    - Attributes: type="button"; name="checkout"; aria-label="Checkout"; data-action="checkout"
    - Timestamp: 2026-07-22T10:35:12+05:00
    - Environment: Chrome 138 / Blink / macOS 15.5
    ```
  - Attributes include only `name`, `role`, `type`, `aria-*`, and `data-*`; HTML content and attribute values such as `value`, `href`, `src`, `style`, and event handlers are excluded

---

## Copy formats
- Text
   - text/html is the primary format
   - text/plain is derived from text/html
   - Human-readable formatted text for Google Docs / Word
- Markdown
   - headingStyle atx
   - hr `---`
   - fence ```
   - bullet list `-`
   - **Bold**, *italic*, ~~strikethrough~~
   - link style [title](link)
- Image

---

## Download formats
- These are downloadable files
- The file name uses the `C-D-T.E` format, where:
   - C = `copied`
   - D = website domain, replace dots with hyphens -> replace `-www-` with `-`
   - T = tag name
   - E = file extension
- List:
   - Markdown // Generated from markdown text
   - PNG
   - JPEG
   - HTML // Generated from code text

---

## URL
- URL

---

## RELATED UI PAGES
- COPIED -- save / copy information and action buttons
- SETTINGS -- user settings

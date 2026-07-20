# PAGE SETTINGS

---

## Language settings
- Simple buttons: EN | ES | FR | DE | RU | 中文 | عربي
- Content block: this specific list does not change direction when switching between LTR / RTL

---

## Dropdown lists

### Default action
- Heading: "Default action"
- The field allows selection from the available formats:
   - NOTHING // This option is first in the list and gray
   - Copy Text // default
   - Copy Markdown
   - Copy Image
   - Download Markdown
   - Download HTML
   - Download PNG
   - Download JPEG
   - Copy code
   - Copy tag#id.class
   - Copy selector
   - Copy JS path
   - Copy XPath
   - Copy full XPath
   - Copy styles
   - Copy computed styles

### Inline images
- Heading: "Inline images in text"
- Options:
   - Use all
   - Remove large // remove imgs over 2kb
   - Remove small // remove imgs less 2kb // default
   - Remove all
- A lucide info icon appears next to the label. Clicking it opens an information window:
   - Some pages embed images in the HTML as Base64 (common on Google and similar sites). This can slow copying and bloat Text or Markdown output. Small images are often icons or buttons that add clutter. Use this setting to control what is included.

### Selection label style
- Heading: "On the frame"
- Options:
   - "No title"
   - "click to copy" // plain localized string, default field value
   - "tag id class"
   - "selector"
   - "full XPath"

---

## Togglers

### Generate images
- Default on
- A lucide info icon appears next to the label. Clicking it opens an information window:
   - On large pages, images take a lot of time to generate. If you don't need them, turn them off to run way faster.
- If one of these actions was selected in "Default action", disabling image generation resets "Default action" to its default
- If the user selects an item from the sublist in "Default action", force this toggler on:
   - Copy Image
   - Download PNG
   - Download JPEG

### Display developer tools
- Default on
- If off, hides the corresponding button block from the COPIED page

### Dark theme
- Default off
